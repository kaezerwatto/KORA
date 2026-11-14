import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import puppeteer from "puppeteer-core";

const root = path.resolve(import.meta.dirname, "..");
await mkdir(path.join(root, "test-results"), { recursive: true });

const browser = await puppeteer.launch({
  executablePath: "/usr/bin/google-chrome",
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--allow-file-access-from-files"]
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 400, height: 700, deviceScaleFactor: 2 });
  await page.evaluateOnNewDocument(() => {
    let enabled = true;
    let displayLanguage = "fub";
    let injected = false;
    globalThis.chrome = {
      tabs: {
        query: async () => [{ id: 7, url: "https://bank.example/dashboard" }],
        sendMessage: async (_tabId, message) => {
          if (!injected) throw new Error("Receiving end does not exist");
          if (message.type === "KORA_TOGGLE") {
            enabled = message.enabled;
            displayLanguage = enabled ? "fub" : "original";
          }
          if (message.type === "KORA_DISPLAY_LANGUAGE") {
            displayLanguage = message.language;
            enabled = displayLanguage === "fub";
            return { ok: true, enabled, displayLanguage };
          }
          if (message.type === "KORA_STATUS") {
            return { enabled, displayLanguage, sourceHint: "auto", stats: {} };
          }
          return { ok: true };
        }
      },
      scripting: {
        executeScript: async () => {
          injected = true;
          return [];
        }
      }
    };
  });

  await page.goto(`file://${path.join(root, "dist/popup.html")}`, { waitUntil: "load" });
  await page.waitForFunction(() => document.querySelector("#status-title")?.textContent === "Traduction activée");

  assert.equal(
    await page.$eval("#status-detail", (node) => node.textContent),
    "bank.example · Fulfulde automatique"
  );
  assert.equal(await page.$$eval("input", (inputs) => inputs.length), 4);
  assert.equal(await page.$$eval("button, .toast, .local-badge", (nodes) => nodes.length), 0);
  assert.equal(await page.$eval("body", (node) => getComputedStyle(node).backgroundColor), "rgb(13, 13, 13)");

  await page.click('input[name="display-language"][value="fr"]');
  await page.waitForFunction(() => document.querySelector("#status-title")?.textContent === "Page en français");
  assert.equal(await page.$eval("#enabled", (input) => input.checked), false);

  await page.click('input[name="display-language"][value="en"]');
  await page.waitForFunction(() => document.querySelector("#status-title")?.textContent === "Page in English");

  await page.click('input[name="display-language"][value="fub"]');
  await page.waitForFunction(() => document.querySelector("#status-title")?.textContent === "Traduction activée");
  assert.equal(await page.$eval("#enabled", (input) => input.checked), true);

  await page.click("#enabled");
  await page.waitForFunction(() => document.querySelector("#status-title")?.textContent === "Traduction désactivée");
  assert.equal(await page.$eval("#enabled", (input) => input.checked), false);

  await page.click("#enabled");
  await page.waitForFunction(() => document.querySelector("#status-title")?.textContent === "Traduction activée");
  assert.equal(await page.$eval("#enabled", (input) => input.checked), true);

  await page.screenshot({
    path: path.join(root, "test-results/kora-popup.png"),
    fullPage: true
  });

  console.log("POPUP PASS: dark UI, FUB/FR/EN selector, automatic injection and reliable activation.");
} finally {
  await browser.close();
}
