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

async function replaceInput(page, field, value) {
  await field.click();
  await page.keyboard.down("Control");
  await page.keyboard.press("A");
  await page.keyboard.up("Control");
  await field.type(value);
}

try {
  await browser.installExtension(extensionPath);
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.goto("https://safinum.cm/hackathon-test", {
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

  await clickOriginal(page, "Effectuer un transfert");
  await page.waitForFunction(
    () => document.querySelector('input[type="number"]'),
    { timeout: 15_000 }
  );
  await page.select("select", "other_bank");
  const amount = await page.$('input[type="number"]');
  await replaceInput(page, amount, "300000");
  await clickOriginal(page, "Continuer");
  await page.waitForFunction(
    () => document.body.innerText.includes("AMOUNT_002"),
    { timeout: 15_000 }
  );
  await page.evaluate(() => scrollTo(0, 0));
  await screenshot(page, "pitch-fees.png");

  const correctedAmount = await page.$('input[type="number"]');
  await replaceInput(page, correctedAmount, "25000");
  await clickOriginal(page, "Continuer");
  await page.waitForFunction(
    () => document.querySelectorAll('input[type="text"], input[type="tel"]').length >= 3,
    { timeout: 15_000 }
  );
  const fields = await page.$$('input[type="text"], input[type="tel"]');
  await replaceInput(page, fields[0], "Jean-Paul Mbarga");
  await replaceInput(page, fields[1], "+237 6 99 12 34 56");
  await replaceInput(page, fields[2], "Paiement de services");
  await clickOriginal(page, "Continuer");
  await page.waitForFunction(
    () => document.body.innerText.includes("SECURITY_001"),
    { timeout: 15_000 }
  );
  await page.evaluate(() => scrollTo(0, 0));
  await screenshot(page, "pitch-security.png");

  console.log(`Captured submission assets in ${path.relative(root, output)}`);
} finally {
  await browser.close();
  await rm(profile, { recursive: true, force: true });
}
