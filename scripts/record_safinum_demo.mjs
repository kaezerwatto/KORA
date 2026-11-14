import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import puppeteer from "puppeteer-core";

const root = path.resolve(import.meta.dirname, "..");
const extensionPath = path.join(root, "release", "kora-unpacked");
const narrationPath = path.join(root, "submission", "video", "narration-fr.json");
const audioDirectory = path.join(root, "submission", "video", "audio");
const recorderHtml = path.join(root, "submission", "video", "recorder.html");
const preview = process.env.KORA_VIDEO_PREVIEW === "1";
const playbackRate = Number(process.env.KORA_VIDEO_SPEED ?? "1.10");
const output = path.join(
  root,
  "release",
  preview
    ? "KORA_Demo_Pitch_SAFINUM_2026-preview.webm"
    : "KORA_Demo_Pitch_SAFINUM_2026.webm"
);
const normalSafinumUrl = "https://safinum.cm/hackathon-test";

await access(path.join(extensionPath, "manifest.json"));
await mkdir(path.dirname(output), { recursive: true });

const narration = JSON.parse(await readFile(narrationPath, "utf8"));
const manifest = JSON.parse(
  await readFile(path.join(audioDirectory, "manifest.json"), "utf8")
);
if (manifest.voice?.id !== narration.voice.id) {
  throw new Error("La voix du manifeste audio ne correspond pas à Lucie.");
}
const audioFiles = manifest.segments.map((segment) =>
  pathToFileURL(path.join(audioDirectory, segment.file)).href
);

if (audioFiles.length !== narration.segments.length) {
  throw new Error("Le nombre de pistes audio ne correspond pas au storyboard.");
}

const browser = await puppeteer.launch({
  executablePath: "/usr/bin/google-chrome",
  headless: true,
  enableExtensions: true,
  protocolTimeout: 600_000,
  args: [
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--disable-background-timer-throttling",
    "--disable-backgrounding-occluded-windows",
    "--disable-renderer-backgrounding",
    "--allow-file-access-from-files",
    "--autoplay-policy=no-user-gesture-required",
    "--force-dark-mode",
    "--enable-features=WebContentsForceDark",
    "--hide-scrollbars",
    "--window-size=1440,900"
  ]
});

const delay = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

const captureClients = new WeakMap();
let cursor = { x: 720, y: 450, visible: false };
const sourceViewport = { width: 1440, height: 900 };
const browserChromeHeight = 54;
const videoScale = Math.min(
  1280 / sourceViewport.width,
  (720 - browserChromeHeight) / sourceViewport.height
);
const videoOffset = {
  x: (1280 - sourceViewport.width * videoScale) / 2,
  y:
    browserChromeHeight +
    (720 - browserChromeHeight - sourceViewport.height * videoScale) / 2
};

async function waitForKora(page) {
  try {
    await page.waitForFunction(
      () => document.documentElement.dataset.koraActive === "true",
      { timeout: 20_000 }
    );
  } catch {
    await page.reload({ waitUntil: "domcontentloaded", timeout: 60_000 });
    await page.waitForFunction(
      () => document.documentElement.dataset.koraActive === "true",
      { timeout: 20_000 }
    );
  }
}

async function assertNormalSafinum(page) {
  const state = await page.evaluate(() => ({
    search: location.search,
    text: document.body.innerText
  }));
  if (state.search || /panneau jury|injecter du contenu inédit|unseen content/iu.test(state.text)) {
    throw new Error("La page jury ou un contrôle d’injection est présent : captation refusée.");
  }
}

async function visibleOriginal(page, original) {
  const handle = await page.evaluateHandle((value) => {
    const candidates = [...document.querySelectorAll("[data-kora-original]")];
    const node = candidates.find((candidate) => {
      const original = candidate.dataset.koraOriginal ?? "";
      if (original !== value && !original.startsWith(value)) return false;
      const rect = candidate.getBoundingClientRect();
      const style = getComputedStyle(candidate);
      return (
        rect.width > 0 &&
        rect.height > 0 &&
        style.visibility !== "hidden" &&
        style.display !== "none"
      );
    });
    return node?.closest("button, a, label") ?? node ?? null;
  }, original);
  const element = handle.asElement();
  if (!element) throw new Error(`Élément visible introuvable : ${original}`);
  return element;
}

async function visibleOriginalAny(page, originals) {
  for (const original of originals) {
    try {
      return await visibleOriginal(page, original);
    } catch {
      // Try the next wording used by the live page.
    }
  }
  throw new Error(`Élément visible introuvable : ${originals.join(" / ")}`);
}

async function visibleText(page, wording) {
  const handle = await page.evaluateHandle((value) => {
    const candidates = [...document.querySelectorAll("body *")];
    const node = candidates.find((candidate) => {
      const rect = candidate.getBoundingClientRect();
      const style = getComputedStyle(candidate);
      return (
        candidate.children.length === 0 &&
        candidate.textContent?.trim() === value &&
        rect.width > 0 &&
        rect.height > 0 &&
        style.visibility !== "hidden" &&
        style.display !== "none"
      );
    });
    return node?.closest("button, a") ?? node ?? null;
  }, wording);
  const element = handle.asElement();
  if (!element) throw new Error(`Texte visible introuvable : ${wording}`);
  return element;
}

function videoPoint(point) {
  return {
    x: videoOffset.x + point.x * videoScale,
    y: videoOffset.y + point.y * videoScale,
    visible: point.visible
  };
}

async function moveCursor(renderer, page, x, y, milliseconds = 220) {
  const start = { ...cursor };
  const steps = Math.max(7, Math.round(milliseconds / 16));
  const dx = x - start.x;
  const dy = y - start.y;
  const curve = Math.max(-70, Math.min(70, (dx - dy) * 0.07));
  const control1 = {
    x: start.x + dx * 0.34 - curve,
    y: start.y + dy * 0.18 + curve * 0.3
  };
  const control2 = {
    x: start.x + dx * 0.72 + curve * 0.35,
    y: start.y + dy * 0.82 - curve
  };
  cursor.visible = true;
  for (let step = 1; step <= steps; step += 1) {
    const t = step / steps;
    const inverse = 1 - t;
    cursor.x =
      inverse ** 3 * start.x +
      3 * inverse ** 2 * t * control1.x +
      3 * inverse * t ** 2 * control2.x +
      t ** 3 * x;
    cursor.y =
      inverse ** 3 * start.y +
      3 * inverse ** 2 * t * control1.y +
      3 * inverse * t ** 2 * control2.y +
      t ** 3 * y;
    await renderer.evaluate(
      (value) => window.koraVideo.setCursor(value),
      videoPoint(cursor)
    );
    await delay(milliseconds / steps);
  }
  await page?.mouse.move(x, y);
}

async function moveCanvasCursor(renderer, x, y, milliseconds = 220) {
  const start = { x: 640, y: 350 };
  const steps = Math.max(7, Math.round(milliseconds / 16));
  for (let step = 1; step <= steps; step += 1) {
    const t = step / steps;
    const eased = 1 - Math.pow(1 - t, 3);
    await renderer.evaluate(
      (value) => window.koraVideo.setCursor(value),
      {
        x: start.x + (x - start.x) * eased,
        y: start.y + (y - start.y) * eased,
        visible: true
      }
    );
    await delay(milliseconds / steps);
  }
}

async function waitForAudio(renderer) {
  await renderer.waitForFunction(() => window.koraVideo.audioStatus().ended, {
    timeout: 120_000
  });
}

async function atAudio(renderer, duration, fraction, action) {
  const target = duration * fraction;
  while (true) {
    const status = await renderer.evaluate(() => window.koraVideo.audioStatus());
    if (status.ended || status.currentTime >= target) break;
    await delay(Math.min(80, Math.max(20, (target - status.currentTime) * 500)));
  }
  if (action) await action();
  await renderer.bringToFront();
  await renderer.evaluate(() => window.koraVideo.resumeAudio());
}

async function playScene(renderer, index, mode, action) {
  const segment = narration.segments[index];
  console.log(`Scène ${index + 1}/${narration.segments.length}: ${segment.id}`);
  await renderer.bringToFront();
  await renderer.evaluate(
    (scene) =>
      window.koraVideo.setScene({
        mode: scene.mode,
        title: scene.title,
        chapter: scene.chapter,
        caption: scene.caption,
        index: scene.index,
        count: scene.count
      }),
    {
      mode,
      title: narration.title,
      chapter: segment.chapter,
      caption: segment.caption,
      index,
      count: narration.segments.length
    }
  );
  const duration = await renderer.evaluate(
    ({ url, rate }) => window.koraVideo.startAudio(url, rate),
    { url: audioFiles[index], rate: playbackRate }
  );
  if (action) await action(duration);
  await waitForAudio(renderer);
  await delay(90);
  console.log(`Scène terminée: ${segment.id} (${duration.toFixed(1)} s)`);
}

async function captureFrame(page, quality = 76) {
  let client = captureClients.get(page);
  if (!client) {
    client = await page.createCDPSession();
    captureClients.set(page, client);
  }
  const { data } = await client.send("Page.captureScreenshot", {
    format: "jpeg",
    quality,
    fromSurface: true,
    captureBeyondViewport: false,
    optimizeForSpeed: true
  });
  return `data:image/jpeg;base64,${data}`;
}

async function elementPoint(element) {
  const box = await element.boundingBox();
  if (!box) throw new Error("Cible visuelle introuvable.");
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

async function setFrameData(renderer, dataUrl) {
  await renderer.evaluate((frame) => window.koraVideo.setFrame(frame), dataUrl);
  await delay(90);
}

async function playFrameSequence(renderer, frames, milliseconds = 900) {
  if (!frames.length) return;
  const frameDelay = milliseconds / frames.length;
  for (const frame of frames) {
    await renderer.evaluate((dataUrl) => window.koraVideo.setFrame(dataUrl), frame);
    await delay(frameDelay);
  }
}

async function visualClick(renderer) {
  await renderer.evaluate(() => window.koraVideo.click());
  await delay(320);
}

async function replaceInputFast(page, element, value) {
  await element.click();
  await page.keyboard.down("Control");
  await page.keyboard.press("A");
  await page.keyboard.up("Control");
  await page.keyboard.type(value);
  await page.keyboard.press("Tab");
}

async function captureTyping(page, element, chunks) {
  await element.click();
  await page.keyboard.down("Control");
  await page.keyboard.press("A");
  await page.keyboard.up("Control");
  await page.keyboard.press("Backspace");
  const frames = [];
  for (const chunk of chunks) {
    await page.keyboard.type(chunk);
    frames.push(await captureFrame(page));
  }
  await page.keyboard.press("Tab");
  return frames;
}

let renderer;
try {
  renderer = await browser.newPage();
  await renderer.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
  await renderer.goto(pathToFileURL(recorderHtml).href, { waitUntil: "load" });
  await renderer.exposeFunction("saveKoraDemo", async (dataUrl) => {
    const base64 = dataUrl.slice(dataUrl.lastIndexOf(",") + 1);
    await writeFile(output, Buffer.from(base64, "base64"));
  });
  await renderer.waitForFunction(() => Boolean(window.koraVideo));
  await renderer.waitForFunction(() => window.koraVideo.assetsReady());

  const extensionsPage = await browser.newPage();
  await extensionsPage.setViewport({ ...sourceViewport, deviceScaleFactor: 1 });
  await extensionsPage.goto("chrome://extensions/", { waitUntil: "load" });
  const snapshots = {
    extensionsBefore: await captureFrame(extensionsPage)
  };
  const points = {};
  points.developerMode = await extensionsPage.evaluate(() => {
    const toggle = document
      .querySelector("extensions-manager")
      ?.shadowRoot?.querySelector("extensions-toolbar")
      ?.shadowRoot?.querySelector("#devMode");
    if (!toggle) throw new Error("Interrupteur du mode développeur introuvable.");
    const rect = toggle.getBoundingClientRect();
    return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
  });
  await extensionsPage.evaluate(() =>
    document
      .querySelector("extensions-manager")
      ?.shadowRoot?.querySelector("extensions-toolbar")
      ?.shadowRoot?.querySelector("#devMode")
      ?.click()
  );
  snapshots.extensionsDeveloper = await captureFrame(extensionsPage);

  const extensionId = await browser.installExtension(extensionPath);
  if (!extensionId) throw new Error("Chrome n’a pas chargé KORA.");
  await extensionsPage.reload({ waitUntil: "load" });
  await extensionsPage.waitForFunction(
    () => {
      const text = [];
      const visit = (rootNode) => {
        for (const node of rootNode.querySelectorAll("*")) {
          if (node.shadowRoot) visit(node.shadowRoot);
          if (node.children.length === 0) text.push(node.textContent ?? "");
        }
      };
      visit(document);
      return text.join(" ").includes("KORA");
    },
    { timeout: 15_000 }
  );
  snapshots.extensionsAfter = await captureFrame(extensionsPage);

  const preferences = await browser.newPage();
  await preferences.goto(`chrome-extension://${extensionId}/popup.html?standalone=1`, {
    waitUntil: "load"
  });
  await preferences.evaluate(() =>
    chrome.storage.local.set({
      koraEnabled: false,
      koraSource: "auto",
      koraDisplayLanguage: "fr"
    })
  );
  await preferences.close();

  const safinum = await browser.newPage();
  await safinum.setViewport({ ...sourceViewport, deviceScaleFactor: 1 });
  await safinum.goto(normalSafinumUrl, {
    waitUntil: "domcontentloaded",
    timeout: 60_000
  });
  await assertNormalSafinum(safinum);
  await safinum.waitForFunction(
    () => document.body.innerText.toLocaleLowerCase("fr").includes("solde disponible"),
    { timeout: 15_000 }
  );
  await safinum.evaluate(() => scrollTo(0, 0));
  snapshots.dashboardFrench = await captureFrame(safinum);

  const popup = await browser.newPage();
  await popup.setViewport({ width: 360, height: 430, deviceScaleFactor: 1 });
  await popup.goto(`chrome-extension://${extensionId}/popup.html?standalone=1`, {
    waitUntil: "load"
  });
  await popup.waitForFunction(
    () => document.querySelector("#status-title")?.textContent === "Page en français",
    { timeout: 10_000 }
  );
  const popupHeight = await popup.evaluate(() =>
    Math.min(520, Math.max(document.body.scrollHeight, 360))
  );
  const popupLanguagePoint = await popup.$eval(
    'input[name="display-language"][value="fub"] + span',
    (span) => {
      const rect = span.getBoundingClientRect();
      return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
    }
  );
  const popupImage = await popup.screenshot({
    type: "png",
    clip: { x: 0, y: 0, width: 360, height: popupHeight }
  });
  await popup.$eval(
    'input[name="display-language"][value="fub"]',
    (input) => input.click()
  );
  await waitForKora(safinum);
  await safinum.waitForFunction(
    () => document.body.innerText.includes("Kaalisi gonɗi e konte"),
    { timeout: 15_000 }
  );
  if (!popup.isClosed()) await popup.close();
  await safinum.evaluate(() => scrollTo(0, 0));
  snapshots.dashboard = await captureFrame(safinum);
  points.dashboard = {
    balance: await elementPoint(await visibleOriginal(safinum, "Solde disponible")),
    account: await elementPoint(await visibleOriginal(safinum, "Numéro de compte")),
    transactions: await elementPoint(
      await visibleOriginal(safinum, "Transactions récentes")
    ),
    transfer: await elementPoint(
      await visibleOriginal(safinum, "Effectuer un transfert")
    )
  };

  await (await visibleOriginal(safinum, "Effectuer un transfert")).click();
  await safinum.waitForSelector('input[type="number"]', { timeout: 10_000 });
  snapshots.feesInitial = await captureFrame(safinum);
  const operation = await safinum.$("select");
  const amount = await safinum.$('input[type="number"]');
  if (!operation || !amount) throw new Error("Étape des frais incomplète.");
  points.fees = {
    operation: await elementPoint(operation),
    amount: await elementPoint(amount),
    continue: await elementPoint(await visibleOriginal(safinum, "Continuer"))
  };
  const otherBankValue = await operation.evaluate((select) => {
    const option = [...select.options].find((candidate) =>
      /autre banque|other bank/iu.test(
        candidate.dataset.koraOriginal ?? candidate.textContent ?? ""
      )
    );
    return option?.value ?? select.options[0]?.value;
  });
  await operation.select(otherBankValue);
  snapshots.feesSelected = await captureFrame(safinum);
  snapshots.feesHighTyping = await captureTyping(
    safinum,
    amount,
    ["3", "0", "0", "0", "0", "0"]
  );
  snapshots.feesHigh = snapshots.feesHighTyping.at(-1);
  await (await visibleOriginal(safinum, "Continuer")).click();
  await safinum.waitForFunction(
    () => document.body.innerText.includes("AMOUNT_002"),
    { timeout: 10_000 }
  );
  snapshots.feesError = await captureFrame(safinum);
  points.fees.amountAfterError = await elementPoint(
    (await safinum.$$('input[type="number"]'))[0]
  );
  points.fees.continueAfterError = await elementPoint(
    await visibleOriginal(safinum, "Continuer")
  );
  snapshots.feesCorrectedTyping = await captureTyping(
    safinum,
    (await safinum.$$('input[type="number"]'))[0],
    ["2", "5", "0", "0", "0"]
  );
  snapshots.feesCorrected = snapshots.feesCorrectedTyping.at(-1);
  await (await visibleOriginal(safinum, "Continuer")).click();
  await safinum.waitForFunction(
    () => document.body.innerText.toLowerCase().includes("innde jaɓoowo"),
    { timeout: 10_000 }
  );
  snapshots.beneficiaryEmpty = await captureFrame(safinum);

  const textInputs = await safinum.$$('input[type="text"]');
  const phone = await safinum.$('input[type="tel"]');
  const note = await safinum.$("textarea");
  if (textInputs.length < 2 || !phone || !note) {
    throw new Error("Les champs bénéficiaire attendus sont absents.");
  }
  points.beneficiary = {
    name: await elementPoint(textInputs[0]),
    phone: await elementPoint(phone),
    reason: await elementPoint(textInputs[1]),
    note: await elementPoint(note),
    checkbox: await elementPoint(await safinum.$('input[type="checkbox"]')),
    continue: await elementPoint(await visibleOriginal(safinum, "Continuer"))
  };
  snapshots.beneficiaryNameTyping = await captureTyping(
    safinum,
    textInputs[0],
    ["Jean", "-Paul", " Mbarga"]
  );
  snapshots.beneficiaryPhoneTyping = await captureTyping(
    safinum,
    phone,
    ["+237 ", "6 99 ", "12 34 56"]
  );
  snapshots.beneficiaryIdentity = snapshots.beneficiaryPhoneTyping.at(-1);
  snapshots.beneficiaryReasonTyping = await captureTyping(
    safinum,
    textInputs[1],
    ["Paiement ", "de ", "services"]
  );
  snapshots.beneficiaryNoteTyping = await captureTyping(
    safinum,
    note,
    ["Démonstration ", "KORA"]
  );
  snapshots.beneficiaryFilled = snapshots.beneficiaryNoteTyping.at(-1);
  await (await visibleOriginal(safinum, "Continuer")).click();
  await safinum.waitForFunction(
    () => document.body.innerText.includes("SECURITY_001"),
    { timeout: 10_000 }
  );
  snapshots.beneficiarySecurityError = await captureFrame(safinum);
  points.beneficiary.checkboxAfterError = await elementPoint(
    await safinum.$('input[type="checkbox"]')
  );
  points.beneficiary.continueAfterError = await elementPoint(
    await visibleOriginal(safinum, "Continuer")
  );
  await (await safinum.$('input[type="checkbox"]')).click();
  snapshots.beneficiaryChecked = await captureFrame(safinum);
  await (await visibleOriginal(safinum, "Continuer")).click();
  await safinum.waitForFunction(
    () => document.body.innerText.toLowerCase().includes("mi tabitinii humpito"),
    { timeout: 10_000 }
  );
  snapshots.summary = await captureFrame(safinum);
  const summaryCheckbox = await safinum.$('input[type="checkbox"]');
  if (!summaryCheckbox) throw new Error("Confirmation du récapitulatif absente.");
  points.summary = {
    amount: await elementPoint(
      await visibleOriginalAny(safinum, ["Montant", "Montant envoyé"])
    ),
    checkbox: await elementPoint(summaryCheckbox),
    confirm: await elementPoint(
      await visibleOriginal(safinum, "Confirmer le transfert")
    )
  };
  await summaryCheckbox.click();
  snapshots.summaryChecked = await captureFrame(safinum);
  await (await visibleOriginal(safinum, "Confirmer le transfert")).click();
  await safinum.waitForFunction(
    () => document.body.innerText.toLowerCase().includes("transfeer timmii"),
    { timeout: 12_000 }
  );
  const receipt = await safinum.evaluate(() => document.body.innerText);
  for (const value of ["Jean-Paul Mbarga", "25", "SAF-2026-"]) {
    if (!receipt.includes(value)) throw new Error(`Valeur absente du reçu : ${value}`);
  }
  snapshots.receipt = await captureFrame(safinum);
  points.receiptNewTransfer = await elementPoint(
    await visibleOriginal(safinum, "Nouveau transfert")
  );
  await (await visibleOriginal(safinum, "Nouveau transfert")).click();
  await delay(650);
  if (!(await safinum.$('input[type="number"]'))) {
    const transferFromDashboard = await visibleOriginal(
      safinum,
      "Effectuer un transfert"
    );
    snapshots.postReceiptDashboard = await captureFrame(safinum);
    points.postReceiptTransfer = await elementPoint(transferFromDashboard);
    await transferFromDashboard.click();
  }
  await safinum.waitForSelector('input[type="number"]', { timeout: 10_000 });
  snapshots.postReceiptFees = await captureFrame(safinum);
  points.postReceiptBack = await elementPoint(await visibleOriginal(safinum, "Retour"));
  await (await visibleOriginal(safinum, "Retour")).click();
  await safinum.waitForFunction(
    () =>
      [...document.querySelectorAll("[data-kora-original]")].some(
        (node) => node.dataset.koraOriginal === "Solde disponible"
      ),
    { timeout: 10_000 }
  );
  await safinum.evaluate(() => scrollTo(0, 0));
  snapshots.dashboardReturn = await captureFrame(safinum);
  const returnedBalance = await safinum.evaluate(() => {
    const label = [...document.querySelectorAll("[data-kora-original]")].find(
      (node) => node.dataset.koraOriginal === "Solde disponible"
    );
    return label?.parentElement?.textContent?.trim() ?? "";
  });
  console.log(`Solde affiché après retour réel : ${returnedBalance}`);

  await extensionsPage.close();
  await safinum.close();
  await renderer.bringToFront();
  await setFrameData(renderer, snapshots.extensionsBefore);
  await renderer.evaluate(
    (scene) => window.koraVideo.setScene(scene),
    {
      mode: "intro",
      title: narration.title,
      chapter: narration.segments[0].chapter,
      caption: narration.segments[0].caption,
      index: 0,
      count: narration.segments.length
    }
  );

  const mimeType = await renderer.evaluate(
    (urls) => window.koraVideo.startRecording(urls),
    audioFiles
  );
  await delay(350);

  await playScene(renderer, 0, "intro");
  await playScene(renderer, 1, "concept");

  await setFrameData(renderer, snapshots.extensionsBefore);
  await renderer.evaluate(() =>
    window.koraVideo.setBrowser({
      url: "chrome://extensions",
      title: "Extensions"
    })
  );
  await playScene(renderer, 2, "screen", async (duration) => {
    await atAudio(renderer, duration, 0.08, async () => {
      await moveCursor(
        renderer,
        null,
        points.developerMode.x,
        points.developerMode.y
      );
      await visualClick(renderer);
      await setFrameData(renderer, snapshots.extensionsDeveloper);
    });
    await atAudio(renderer, duration, 0.34, async () => {
      await renderer.evaluate(() => window.koraVideo.showInstallPath(true));
    });
    await atAudio(renderer, duration, 0.52, async () => {
      await setFrameData(renderer, snapshots.extensionsAfter);
    });
    await atAudio(renderer, duration, 0.80, async () => {
      await renderer.evaluate(() => window.koraVideo.showInstallPath(false));
    });
  });

  await renderer.evaluate(() =>
    window.koraVideo.setBrowser({
      url: "https://safinum.cm/hackathon-test",
      title: "Safinum Pay"
    })
  );
  await setFrameData(renderer, snapshots.dashboardFrench);
  await renderer.evaluate(
    (dataUrl) => window.koraVideo.setPopup(dataUrl),
    `data:image/png;base64,${popupImage.toString("base64")}`
  );

  await playScene(renderer, 3, "screen", async (duration) => {
    await atAudio(renderer, duration, 0.08, async () => {
      await renderer.evaluate(() => {
        window.koraVideo.showPopup(true);
        window.koraVideo.setCursor({ visible: false });
      });
    });
    await atAudio(renderer, duration, 0.23, async () => {
      await moveCanvasCursor(
        renderer,
        1280 - 360 - 46 + popupLanguagePoint.x,
        82 + popupLanguagePoint.y
      );
      await visualClick(renderer);
    });
    await atAudio(renderer, duration, 0.36, async () => {
      await renderer.evaluate(() => window.koraVideo.showPopup(false));
      await setFrameData(renderer, snapshots.dashboard);
    });
    await atAudio(renderer, duration, 0.52, async () => {
      await moveCursor(
        renderer,
        null,
        points.dashboard.balance.x,
        points.dashboard.balance.y
      );
    });
    await atAudio(renderer, duration, 0.66, async () => {
      await moveCursor(
        renderer,
        null,
        points.dashboard.account.x,
        points.dashboard.account.y
      );
    });
    await atAudio(renderer, duration, 0.78, async () => {
      await moveCursor(
        renderer,
        null,
        points.dashboard.transactions.x,
        points.dashboard.transactions.y
      );
    });
    await atAudio(renderer, duration, 0.90, async () => {
      await moveCursor(
        renderer,
        null,
        points.dashboard.transfer.x,
        points.dashboard.transfer.y
      );
      await visualClick(renderer);
      await setFrameData(renderer, snapshots.feesInitial);
    });
  });

  await playScene(renderer, 4, "screen", async (duration) => {
    await atAudio(renderer, duration, 0.07, async () => {
      await moveCursor(
        renderer,
        null,
        points.fees.operation.x,
        points.fees.operation.y
      );
      await visualClick(renderer);
      await setFrameData(renderer, snapshots.feesSelected);
    });
    await atAudio(renderer, duration, 0.20, async () => {
      await moveCursor(renderer, null, points.fees.amount.x, points.fees.amount.y);
      await visualClick(renderer);
      await playFrameSequence(renderer, snapshots.feesHighTyping, 1_250);
    });
    await atAudio(renderer, duration, 0.43, async () => {
      await moveCursor(
        renderer,
        null,
        points.fees.continue.x,
        points.fees.continue.y
      );
      await visualClick(renderer);
      await setFrameData(renderer, snapshots.feesError);
    });
    await atAudio(renderer, duration, 0.67, async () => {
      await moveCursor(
        renderer,
        null,
        points.fees.amountAfterError.x,
        points.fees.amountAfterError.y
      );
      await visualClick(renderer);
      await playFrameSequence(renderer, snapshots.feesCorrectedTyping, 1_050);
    });
    await atAudio(renderer, duration, 0.90, async () => {
      await moveCursor(
        renderer,
        null,
        points.fees.continueAfterError.x,
        points.fees.continueAfterError.y
      );
      await visualClick(renderer);
      await setFrameData(renderer, snapshots.beneficiaryEmpty);
    });
  });

  await playScene(renderer, 5, "screen", async (duration) => {
    await atAudio(renderer, duration, 0.06, async () => {
      await moveCursor(
        renderer,
        null,
        points.beneficiary.name.x,
        points.beneficiary.name.y
      );
      await visualClick(renderer);
      await playFrameSequence(renderer, snapshots.beneficiaryNameTyping, 850);
    });
    await atAudio(renderer, duration, 0.23, async () => {
      await moveCursor(
        renderer,
        null,
        points.beneficiary.phone.x,
        points.beneficiary.phone.y
      );
      await visualClick(renderer);
      await playFrameSequence(renderer, snapshots.beneficiaryPhoneTyping, 850);
    });
    await atAudio(renderer, duration, 0.40, async () => {
      await moveCursor(
        renderer,
        null,
        points.beneficiary.reason.x,
        points.beneficiary.reason.y
      );
      await visualClick(renderer);
      await playFrameSequence(renderer, snapshots.beneficiaryReasonTyping, 850);
    });
    await atAudio(renderer, duration, 0.55, async () => {
      await moveCursor(
        renderer,
        null,
        points.beneficiary.note.x,
        points.beneficiary.note.y
      );
      await visualClick(renderer);
      await playFrameSequence(renderer, snapshots.beneficiaryNoteTyping, 650);
    });
    await atAudio(renderer, duration, 0.69, async () => {
      await moveCursor(
        renderer,
        null,
        points.beneficiary.continue.x,
        points.beneficiary.continue.y
      );
      await visualClick(renderer);
      await setFrameData(renderer, snapshots.beneficiarySecurityError);
    });
    await atAudio(renderer, duration, 0.82, async () => {
      await moveCursor(
        renderer,
        null,
        points.beneficiary.checkboxAfterError.x,
        points.beneficiary.checkboxAfterError.y
      );
      await visualClick(renderer);
      await setFrameData(renderer, snapshots.beneficiaryChecked);
    });
    await atAudio(renderer, duration, 0.93, async () => {
      await moveCursor(
        renderer,
        null,
        points.beneficiary.continueAfterError.x,
        points.beneficiary.continueAfterError.y
      );
      await visualClick(renderer);
      await setFrameData(renderer, snapshots.summary);
    });
  });

  await playScene(renderer, 6, "screen", async (duration) => {
    await atAudio(renderer, duration, 0.12, async () => {
      await moveCursor(
        renderer,
        null,
        points.summary.amount.x,
        points.summary.amount.y
      );
    });
    await atAudio(renderer, duration, 0.30, async () => {
      await moveCursor(
        renderer,
        null,
        points.summary.checkbox.x,
        points.summary.checkbox.y
      );
      await visualClick(renderer);
      await setFrameData(renderer, snapshots.summaryChecked);
    });
    await atAudio(renderer, duration, 0.44, async () => {
      await moveCursor(
        renderer,
        null,
        points.summary.confirm.x,
        points.summary.confirm.y
      );
      await visualClick(renderer);
      await setFrameData(renderer, snapshots.receipt);
    });
  });

  await playScene(renderer, 7, "screen", async (duration) => {
    await atAudio(renderer, duration, 0.12, async () => {
      await moveCursor(
        renderer,
        null,
        points.receiptNewTransfer.x,
        points.receiptNewTransfer.y
      );
      await visualClick(renderer);
      await setFrameData(
        renderer,
        snapshots.postReceiptDashboard ?? snapshots.postReceiptFees
      );
    });
    await atAudio(renderer, duration, 0.34, async () => {
      if (!snapshots.postReceiptDashboard) return;
      await moveCursor(
        renderer,
        null,
        points.postReceiptTransfer.x,
        points.postReceiptTransfer.y
      );
      await visualClick(renderer);
      await setFrameData(renderer, snapshots.postReceiptFees);
    });
    await atAudio(renderer, duration, 0.62, async () => {
      await moveCursor(
        renderer,
        null,
        points.postReceiptBack.x,
        points.postReceiptBack.y
      );
      await visualClick(renderer);
      await setFrameData(renderer, snapshots.dashboardReturn);
    });
  });

  await playScene(renderer, 8, "validation");
  await playScene(renderer, 9, "outro");

  const result = await renderer.evaluate(() => window.koraVideo.stopRecording());
  console.log(
    `Vidéo ${path.relative(root, output)}: ${(result.bytes / 1024 / 1024).toFixed(
      2
    )} Mio, ${result.mimeType}`
  );
  console.log(`Captation réelle terminée sur ${normalSafinumUrl}`);
  console.log(`Codec demandé : ${mimeType}`);
} finally {
  await browser.close();
}
