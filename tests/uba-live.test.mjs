import assert from "node:assert/strict";
import path from "node:path";
import puppeteer from "puppeteer-core";

const root = path.resolve(import.meta.dirname, "..");
const extensionPath = path.join(root, "dist");

const browser = await puppeteer.launch({
  executablePath: "/usr/bin/google-chrome",
  headless: true,
  enableExtensions: [extensionPath],
  args: ["--no-sandbox", "--disable-dev-shm-usage"]
});

try {
  const page = await browser.newPage();
  await page.goto("https://www.ubacameroon.com/", {
    waitUntil: "domcontentloaded",
    timeout: 90_000
  });
  await page.waitForFunction(
    () => document.documentElement.dataset.koraActive === "true",
    { timeout: 20_000 }
  );
  await new Promise((resolve) => setTimeout(resolve, 1_500));

  const text = await page.evaluate(() => document.body.innerText);
  for (const expected of [
    "Baŋki dijitaal",
    "Kuutorɗe amen dijitaal",
    "Anndu LEO",
    "Baŋki ngam kiliyaneeɓe keeriiɓe",
    "Suɓo kabaruuji maa",
    "Innde e jammun"
  ]) {
    assert.match(text, new RegExp(expected, "iu"), expected);
  }

  await page.evaluate(() => {
    document.body.tabIndex = -1;
    document.body.focus();
  });
  await page.keyboard.down("Control");
  await page.keyboard.press("KeyA");
  await page.keyboard.up("Control");
  const pageSelection = await page.evaluate(() => getSelection()?.toString() ?? "");
  assert.ok(pageSelection.length > 1_000, "Ctrl+A should select the translated page");

  const field = await page.$("input[type='email'], input[type='text']");
  assert.ok(field, "UBA page should expose an editable field");
  await field.focus();
  await field.evaluate((input) => {
    input.value = "Alpha Beta";
  });
  await page.keyboard.down("Control");
  await page.keyboard.press("KeyA");
  await page.keyboard.up("Control");
  assert.deepEqual(
    await field.evaluate((input) => [input.selectionStart, input.selectionEnd]),
    [0, 10]
  );

  console.log(
    `UBA LIVE PASS: translated homepage, page selection ${pageSelection.length} characters, field selection 10/10.`
  );
} finally {
  await browser.close();
}
