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
const playbackRate = Number(process.env.KORA_VIDEO_SPEED ?? "1");
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
    "--window-size=1280,720"
  ]
});

const delay = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

let activeSourcePage = null;
let captureSource = false;
let pumpRunning = true;
let cursor = { x: 640, y: 360, visible: false };

async function deepText(page) {
  return page.evaluate(() => {
    const values = [];
    const visit = (rootNode) => {
      for (const node of rootNode.querySelectorAll("*")) {
        if (node.shadowRoot) visit(node.shadowRoot);
        if (node.children.length === 0 && node.textContent?.trim()) {
          values.push(node.textContent.trim());
        }
      }
    };
    visit(document);
    return values.join("\n");
  });
}

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

async function moveCursor(renderer, page, x, y, milliseconds = 520) {
  const start = { ...cursor };
  const steps = Math.max(8, Math.round(milliseconds / 24));
  cursor.visible = true;
  for (let step = 1; step <= steps; step += 1) {
    const t = step / steps;
    const eased = t * t * (3 - 2 * t);
    cursor.x = start.x + (x - start.x) * eased;
    cursor.y = start.y + (y - start.y) * eased;
    await Promise.all([
      renderer.evaluate((value) => window.koraVideo.setCursor(value), cursor),
      page?.mouse.move(cursor.x, cursor.y)
    ]);
    await delay(milliseconds / steps);
  }
}

async function moveToElement(renderer, page, element, padding = 0) {
  const box = await element.boundingBox();
  if (!box) throw new Error("Impossible de localiser la cible du curseur.");
  await moveCursor(
    renderer,
    page,
    box.x + Math.max(padding, box.width / 2),
    box.y + box.height / 2
  );
  return box;
}

async function clickElement(renderer, page, element) {
  await moveToElement(renderer, page, element);
  await renderer.evaluate(() => window.koraVideo.click());
  await page.mouse.click(cursor.x, cursor.y);
}

async function clickOriginal(renderer, page, original) {
  const element = await visibleOriginal(page, original);
  await clickElement(renderer, page, element);
}

async function focusInput(renderer, page, selector, index = 0) {
  const elements = await page.$$(selector);
  const element = elements[index];
  if (!element) throw new Error(`Champ introuvable : ${selector}[${index}]`);
  await clickElement(renderer, page, element);
  return element;
}

async function replaceInput(renderer, page, element, value, typingDelay = 45) {
  await clickElement(renderer, page, element);
  await page.keyboard.down("Control");
  await page.keyboard.press("A");
  await page.keyboard.up("Control");
  await page.keyboard.type(value, { delay: typingDelay });
  await page.keyboard.press("Tab");
}

async function waitForAudio(renderer) {
  await renderer.waitForFunction(() => window.koraVideo.audioStatus().ended, {
    timeout: 90_000
  });
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
  await renderer.evaluate(() => window.koraVideo.setFocus(null));
  captureSource = mode === "screen";
  const duration = await renderer.evaluate(
    ({ url, rate }) => window.koraVideo.startAudio(url, rate),
    { url: audioFiles[index], rate: playbackRate }
  );
  if (action) await action(duration);
  await waitForAudio(renderer);
  await delay(320);
  console.log(`Scène terminée: ${segment.id} (${duration.toFixed(1)} s)`);
}

async function screenshotPump(renderer) {
  while (pumpRunning) {
    if (captureSource && activeSourcePage && !activeSourcePage.isClosed()) {
      try {
        const image = await activeSourcePage.screenshot({
          type: "jpeg",
          quality: 70,
          captureBeyondViewport: false
        });
        await renderer.evaluate(
          (dataUrl) => window.koraVideo.setFrame(dataUrl),
          `data:image/jpeg;base64,${image.toString("base64")}`
        );
      } catch {
        // A navigation can invalidate one frame; the next iteration replaces it.
      }
    }
    await delay(260);
  }
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

  const extensionsPage = await browser.newPage();
  await extensionsPage.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
  await extensionsPage.goto("chrome://extensions/", { waitUntil: "load" });
  activeSourcePage = extensionsPage;

  const pump = screenshotPump(renderer);
  const mimeType = await renderer.evaluate(() => window.koraVideo.startRecording());
  await delay(500);

  await playScene(renderer, 0, "brand");

  await playScene(renderer, 1, "screen", async (duration) => {
    await delay(Math.min(2200, duration * 180));
    captureSource = false;
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
    const text = await deepText(extensionsPage);
    if (!text.includes("KORA")) throw new Error("La carte KORA n’apparaît pas.");
    captureSource = true;
    await renderer.evaluate(() =>
      window.koraVideo.setFocus({ x: 240, y: 250, width: 600, height: 338 })
    );
    await renderer.evaluate(() => window.koraVideo.setCursor({ visible: false }));
  });

  captureSource = false;
  activeSourcePage = null;
  const safinum = await browser.newPage();
  await safinum.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
  await safinum.goto(normalSafinumUrl, {
    waitUntil: "domcontentloaded",
    timeout: 60_000
  });
  await waitForKora(safinum);
  await assertNormalSafinum(safinum);
  await safinum.waitForFunction(
    () => document.body.innerText.includes("Kaalisi gonɗi e konte"),
    { timeout: 15_000 }
  );
  await safinum.evaluate(() => scrollTo(0, 0));
  activeSourcePage = safinum;

  await playScene(renderer, 2, "screen", async () => {
    await delay(2200);
    const balance = await visibleOriginal(safinum, "Solde disponible");
    await moveToElement(renderer, safinum, balance);
    await delay(1800);
    const account = await visibleOriginal(safinum, "Numéro de compte");
    await moveToElement(renderer, safinum, account);
    await delay(1800);
    await clickOriginal(renderer, safinum, "Effectuer un transfert");
    await safinum.waitForSelector('input[type="number"]', { timeout: 10_000 });
  });

  await playScene(renderer, 3, "screen", async () => {
    const amount = await focusInput(renderer, safinum, 'input[type="number"]');
    await replaceInput(renderer, safinum, amount, "300000", 85);
    await delay(1300);
    await clickOriginal(renderer, safinum, "Continuer");
    await safinum.waitForFunction(
      () => document.body.innerText.includes("AMOUNT_002"),
      { timeout: 10_000 }
    );
    await delay(2400);
    const currentAmount = (await safinum.$$('input[type="number"]'))[0];
    await replaceInput(renderer, safinum, currentAmount, "25000", 85);
    await delay(1500);
    await clickOriginal(renderer, safinum, "Continuer");
    await safinum.waitForFunction(
      () => document.body.innerText.toLowerCase().includes("innde jaɓoowo"),
      { timeout: 10_000 }
    );
  });

  await playScene(renderer, 4, "screen", async () => {
    const textInputs = await safinum.$$('input[type="text"]');
    const phone = await safinum.$('input[type="tel"]');
    const note = await safinum.$("textarea");
    if (textInputs.length < 2 || !phone || !note) {
      throw new Error("Les champs bénéficiaire attendus sont absents.");
    }
    await replaceInput(renderer, safinum, textInputs[0], "Jean-Paul Mbarga", 42);
    await replaceInput(renderer, safinum, phone, "+237 6 99 12 34 56", 38);
    await replaceInput(renderer, safinum, textInputs[1], "Paiement de services", 38);
    await replaceInput(renderer, safinum, note, "Démonstration KORA", 42);
    await delay(900);
    const checkbox = await safinum.$('input[type="checkbox"]');
    await clickElement(renderer, safinum, checkbox);
    await delay(900);
    await clickOriginal(renderer, safinum, "Continuer");
    await safinum.waitForFunction(
      () => document.body.innerText.toLowerCase().includes("mi tabitinii humpito"),
      { timeout: 10_000 }
    );
  });

  await playScene(renderer, 5, "screen", async () => {
    await delay(2300);
    const checkbox = await safinum.$('input[type="checkbox"]');
    if (!checkbox) throw new Error("Confirmation du récapitulatif absente.");
    await clickElement(renderer, safinum, checkbox);
    await delay(1700);
    await clickOriginal(renderer, safinum, "Confirmer le transfert");
    await safinum.waitForFunction(
      () => document.body.innerText.toLowerCase().includes("transfeer timmii"),
      { timeout: 12_000 }
    );
    const receipt = await safinum.evaluate(() => document.body.innerText);
    for (const value of ["Jean-Paul Mbarga", "25", "SAF-2026-"]) {
      if (!receipt.includes(value)) throw new Error(`Valeur absente du reçu : ${value}`);
    }
    await delay(2200);
  });

  await playScene(renderer, 6, "brand");

  captureSource = false;
  pumpRunning = false;
  await pump;
  const result = await renderer.evaluate(() => window.koraVideo.stopRecording());
  console.log(
    `Vidéo ${path.relative(root, output)}: ${(result.bytes / 1024 / 1024).toFixed(
      2
    )} Mio, ${result.mimeType}`
  );
  console.log(`Captation réelle terminée sur ${normalSafinumUrl}`);
  console.log(`Codec demandé : ${mimeType}`);
} finally {
  pumpRunning = false;
  await browser.close();
}
