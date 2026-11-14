import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import puppeteer from "puppeteer-core";

const root = path.resolve(import.meta.dirname, "..");
const extensionPath = path.join(root, "dist");
const profile = await mkdtemp(path.join(tmpdir(), "kora-chrome-"));

const browser = await puppeteer.launch({
  executablePath: "/usr/bin/google-chrome",
  headless: true,
  enableExtensions: [extensionPath],
  userDataDir: profile,
  args: [
    "--no-sandbox",
    "--disable-dev-shm-usage"
  ]
});
const extensionId = await browser.installExtension(extensionPath);

async function waitForKora(page) {
  try {
    await page.waitForFunction(() => document.documentElement.dataset.koraActive === "true", { timeout: 20_000 });
  } catch {
    await page.reload({ waitUntil: "networkidle2", timeout: 90_000 });
    await page.waitForFunction(() => document.documentElement.dataset.koraActive === "true", { timeout: 20_000 });
  }
}

async function visibleByOriginal(page, original) {
  const escaped = original.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
  const handles = await page.$$(`[data-kora-original="${escaped}"]`);
  for (const handle of handles) {
    const visible = await handle.evaluate((node) => {
      const style = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
    });
    if (visible) {
      await handle.scrollIntoView();
      return handle;
    }
  }
  throw new Error(`Visible translated element not found: ${original}`);
}

async function clickOriginal(page, original) {
  try {
    await page.waitForFunction(
      (value) => [...document.querySelectorAll("[data-kora-original]")].some((node) => node.dataset.koraOriginal === value),
      { timeout: 8_000 },
      original
    );
  } catch (error) {
    const diagnostics = await page.evaluate(() => ({
      text: document.body.innerText,
      originals: [...document.querySelectorAll("[data-kora-original]")].map((node) => node.dataset.koraOriginal),
      suspectNodes: [...document.querySelectorAll("*")].flatMap((element) =>
        [...element.childNodes]
          .filter((node) => node.nodeType === Node.TEXT_NODE && /continuer|renseignez|note/i.test(node.nodeValue ?? ""))
          .map((node) => ({ tag: element.tagName, value: node.nodeValue, html: element.outerHTML.slice(0, 500) }))
      )
    }));
    console.error("CLICK DIAGNOSTICS", original, diagnostics);
    throw error;
  }
  const handle = await visibleByOriginal(page, original);
  const target = await handle.evaluateHandle((node) => node.closest("button, a") ?? node);
  await target.asElement().evaluate((node) => node.click());
}

async function clickVisibleCheckbox(page) {
  const boxes = await page.$$('input[type="checkbox"]');
  for (const box of boxes) {
    if (await box.isIntersectingViewport()) {
      await box.click();
      return;
    }
  }
  throw new Error("No visible checkbox found");
}

try {
  const page = await browser.newPage();
  await page.goto("https://safinum.cm/hackathon-test?jury=1", { waitUntil: "networkidle2", timeout: 90_000 });
  await waitForKora(page);
  await page.waitForFunction(
    () =>
      [...document.querySelectorAll("[data-kora-original]")].some(
        (node) => node.dataset.koraOriginal === "Injecter du contenu inédit"
      ),
    { timeout: 20_000 }
  );
  const juryText = await page.evaluate(() => document.body.innerText);
  for (const expected of [
    "Naatnu loowdi ndi anndaaka",
    "Walaa loowdi naatnaandi.",
    "Ƴeewtagol",
    "Naatnaaɗe",
    "Keɓagol firo",
    "Fuɗɗin juumre / jeertina",
    "Jeertina kisal",
    "Juumre reso",
    "Waylu kiɗɗe tabitiiɗe",
    "Ƴeewto taƴre jooni"
  ]) {
    assert.match(juryText, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "iu"), expected);
  }

  const injectedSource = "hello mon frere qui est tu";
  const injectionFieldFound = await page.evaluate((value) => {
    const field = [...document.querySelectorAll("textarea, input")].find((candidate) =>
      /message|inject|inédit|unseen/i.test(
        [
          candidate.id,
          candidate.name,
          candidate.getAttribute("placeholder"),
          candidate.getAttribute("aria-label")
        ].join(" ")
      )
    );
    if (!field) return false;
    const prototype =
      field instanceof HTMLTextAreaElement
        ? HTMLTextAreaElement.prototype
        : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(prototype, "value")?.set?.call(field, value);
    field.dispatchEvent(new Event("input", { bubbles: true }));
    field.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }, injectedSource);
  assert.equal(injectionFieldFound, true, "jury injection field should be available");
  await clickOriginal(page, "Injecter");
  await page.waitForFunction(
    () => document.body.innerText.includes("Sannu musiɗɗo am, aan ko moy?"),
    { timeout: 10_000 }
  );

  const initial = await page.evaluate(() => document.body.innerText);
  assert.match(initial, /konte maa/i);
  assert.match(initial, /kaalisi gonɗi e konte/i);
  assert.match(initial, /250[\s\u00a0\u202f]000 FCFA/);
  assert.match(initial, /CM 001 2345 6789 01/);
  assert.match(initial, /Amina Ngo Bell/);

  await page.evaluate(() => {
    const p = document.createElement("p");
    p.id = "kora-dynamic-test";
    p.textContent = "Votre transfert de 9 500 FCFA est en attente.";
    document.body.appendChild(p);
  });
  await page.waitForFunction(() => document.querySelector("#kora-dynamic-test")?.textContent.includes("Transfeer maa"), { timeout: 5_000 });
  assert.equal(
    await page.$eval("#kora-dynamic-test", (node) => node.textContent),
    "Transfeer maa 9 500 FCFA ɗon e fadde."
  );

  await clickOriginal(page, "Effectuer un transfert");
  await page.waitForFunction(() => document.body.innerText.toLowerCase().includes("musakaaji transfeer"), { timeout: 8_000 });
  assert.match(await page.evaluate(() => document.body.innerText), /25[\s\u00a0\u202f]000 FCFA/);

  await clickOriginal(page, "Continuer");
  try {
    await page.waitForFunction(() => document.body.innerText.toLowerCase().includes("innde jaɓoowo"), {
      timeout: 10_000
    });
  } catch (error) {
    console.error(
      "BENEFICIARY STEP DIAGNOSTICS",
      await page.evaluate(() => ({
        text: document.body.innerText,
        buttons: [...document.querySelectorAll("button")].map((button) => ({
          text: button.textContent.trim(),
          disabled: button.disabled
        })),
        selects: [...document.querySelectorAll("select")].map((select) => ({
          value: select.value,
          options: [...select.options].map((option) => ({
            text: option.textContent,
            value: option.value
          }))
        }))
      }))
    );
    throw error;
  }
  const beneficiaryStep = await page.evaluate(() => document.body.innerText);
  assert.doesNotMatch(beneficiaryStep, /Continuer|Note \(optionnel\)/i);
  assert.match(beneficiaryStep, /Tesko \(so a yiɗi\)/i);
  const fields = await page.$$eval(
    "input, textarea, select",
    (inputs) => inputs.map((input) => ({ type: input.type, value: input.value }))
  );
  assert.ok(fields.some((field) => field.value === "Jean-Paul Mbarga"));
  assert.ok(fields.some((field) => field.value === "+237 6 99 12 34 56"));
  assert.ok(
    fields.some((field) => /^(?:Paiement de services|Payment for services)$/u.test(field.value)),
    "transfer reason input must remain unchanged"
  );
  await clickVisibleCheckbox(page);
  await page.waitForFunction(() => !/Continuer|Note \(optionnel\)/i.test(document.body.innerText));
  await page.waitForFunction(() =>
    document.body.innerText.toLowerCase().includes("mi tabitinii humpito") ||
    [...document.querySelectorAll("button")].some((button) => button.textContent.trim() === "Jokku" && !button.disabled)
  );
  if (!(await page.evaluate(() => document.body.innerText.toLowerCase().includes("mi tabitinii humpito")))) {
    const continued = await page.$$eval("button", (buttons) => {
      const button = buttons.find((item) => item.textContent.trim() === "Jokku" && !item.disabled);
      button?.click();
      return Boolean(button);
    });
    assert.equal(continued, true, "Translated Continue button must stay functional");
  }
  await page.waitForFunction(() => document.body.innerText.toLowerCase().includes("mi tabitinii humpito"));
  const summary = await page.evaluate(() => document.body.innerText);
  const normalizeFinancial = (value) => value.normalize("NFKC").replace(/fcfa/gi, "").replace(/[\s,.'’]+/g, "").toLowerCase();
  for (const canonical of ["25 000 FCFA", "0 FCFA", "Jean-Paul Mbarga", "+237 6 99 12 34 56"]) {
    assert.ok(normalizeFinancial(summary).includes(normalizeFinancial(canonical)), canonical);
  }
  await clickVisibleCheckbox(page);
  await clickOriginal(page, "Confirmer le transfert");

  await page.waitForFunction(() => document.body.innerText.toLowerCase().includes("transfeer timmii"));
  const receipt = await page.evaluate(() => document.body.innerText);
  assert.match(receipt, /Jean-Paul Mbarga/);
  assert.match(receipt, /SAF-2026-[A-Z0-9]+/);

  await clickOriginal(page, "Soumissions");
  try {
    await page.waitForFunction(() => document.body.innerText.includes("Waylaaka"), { timeout: 10_000 });
  } catch (error) {
    console.error("SUBMISSIONS DIAGNOSTICS", await page.evaluate(() => document.body.innerText));
    throw error;
  }
  const submissions = await page.evaluate(() => document.body.innerText);
  assert.match(submissions, /Humpito/);
  assert.match(submissions, /Jean-Paul Mbarga/);
  assert.match(submissions, /25(?:[,\s\u00a0\u202f])?000/);
  assert.match(submissions, /SAF-2026-[A-Z0-9]+/);

  console.log("LIVE PASS: French journey, dynamic content, form values and receipt integrity.");

  const second = await browser.newPage();
  await second.goto("https://safinum.cm/hackathon-test?jury=1", { waitUntil: "networkidle2", timeout: 90_000 });
  await waitForKora(second);
  const languageButtons = await second.$$("button");
  for (const button of languageButtons) {
    if ((await button.evaluate((node) => node.textContent.trim())) === "EN") {
      await button.evaluate((node) => node.click());
      break;
    }
  }
  await second.waitForFunction(
    () =>
      document.body.innerText.includes("Make a transfer") &&
      document.documentElement.dataset.koraActive !== "true",
    { timeout: 10_000 }
  );
  const extensionPage = await browser.newPage();
  await extensionPage.goto(`chrome-extension://${extensionId}/popup.html`, { waitUntil: "load" });
  await second.bringToFront();
  await extensionPage.evaluate(async () => {
    const [target] = await chrome.tabs.query({ active: true, currentWindow: true });
    return chrome.tabs.sendMessage(target.id, {
      type: "KORA_DISPLAY_LANGUAGE",
      language: "fub"
    });
  });
  await second.waitForFunction(() => [...document.querySelectorAll("[data-kora-original]")].some((node) => node.dataset.koraOriginal === "Make a transfer"), { timeout: 10_000 });
  const english = await second.evaluate(() => document.body.innerText);
  assert.match(english, /Waɗugo transfeer/);
  assert.match(english, /kaalisi gonɗi e konte/i);
  assert.match(english, /250[,\s\u00a0\u202f]000 FCFA/);
  console.log("LIVE PASS: English source switched and translated to the same fub interface.");
} finally {
  await browser.close();
  await rm(profile, { recursive: true, force: true });
}
