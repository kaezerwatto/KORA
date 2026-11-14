import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import puppeteer from "puppeteer-core";

const root = path.resolve(import.meta.dirname, "..");
const output = path.join(root, "submission/assets");
const extensionPath = path.join(root, "dist");
const profile = await mkdtemp(path.join(tmpdir(), "kora-submission-"));
await mkdir(output, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: "/usr/bin/google-chrome",
  headless: true,
  enableExtensions: [extensionPath],
  userDataDir: profile,
  args: ["--no-sandbox", "--disable-dev-shm-usage"]
});

async function waitForKora(page) {
  try {
    await page.waitForFunction(
      () => document.documentElement.dataset.koraActive === "true",
      { timeout: 20_000 }
    );
  } catch {
    await page.reload({ waitUntil: "networkidle2", timeout: 90_000 });
    await page.waitForFunction(
      () => document.documentElement.dataset.koraActive === "true",
      { timeout: 20_000 }
    );
  }
}

async function clickOriginal(page, original) {
  await page.waitForFunction(
    (value) =>
      [...document.querySelectorAll("[data-kora-original]")].some(
        (node) => node.dataset.koraOriginal === value
      ),
    { timeout: 15_000 },
    original
  );
  const handle = await page.evaluateHandle((value) => {
    const node = [...document.querySelectorAll("[data-kora-original]")].find(
      (candidate) => candidate.dataset.koraOriginal === value
    );
    return node?.closest("button, a") ?? node;
  }, original);
  await handle.asElement().evaluate((node) => node.click());
}

async function screenshot(page, name) {
  await page.screenshot({
    path: path.join(output, name),
    type: "png",
    captureBeyondViewport: false
  });
}

try {
  await browser.installExtension(extensionPath);
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.goto("https://safinum.cm/hackathon-test?jury=1", {
    waitUntil: "networkidle2",
    timeout: 90_000
  });
  await waitForKora(page);
  await page.waitForFunction(
    () => document.body.innerText.includes("Kaalisi gonɗi e konte"),
    { timeout: 20_000 }
  );
  await page.evaluate(() => scrollTo(0, 0));
  await screenshot(page, "pitch-dashboard.png");

  const sourceFieldFound = await page.evaluate(() => {
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
    Object.getOwnPropertyDescriptor(prototype, "value")?.set?.call(
      field,
      "sodle insufisant"
    );
    field.dispatchEvent(new Event("input", { bubbles: true }));
    field.dispatchEvent(new Event("change", { bubbles: true }));
    field.scrollIntoView({ block: "center" });
    return true;
  });
  if (!sourceFieldFound) throw new Error("Champ d’injection introuvable");
  await clickOriginal(page, "Injecter");
  await page.waitForFunction(
    () =>
      [...document.querySelectorAll("[data-kora-original]")].some(
        (node) =>
          node.dataset.koraOriginal === "sodle insufisant" &&
          node.textContent.includes("Kaalisi yonaa")
      ),
    { timeout: 15_000 }
  );
  await page.evaluate(() => {
    const translated = [...document.querySelectorAll("[data-kora-original]")].find(
      (node) => node.dataset.koraOriginal === "sodle insufisant"
    );
    translated?.scrollIntoView({ block: "center" });
  });
  await screenshot(page, "pitch-injection.png");

  await clickOriginal(page, "Effectuer un transfert");
  await page.waitForFunction(
    () => document.body.innerText.toLowerCase().includes("musakaaji transfeer"),
    { timeout: 15_000 }
  );
  await page.evaluate(() => scrollTo(0, 0));
  await screenshot(page, "pitch-fees.png");

  console.log(`Captured submission assets in ${path.relative(root, output)}`);
} finally {
  await browser.close();
  await rm(profile, { recursive: true, force: true });
}
