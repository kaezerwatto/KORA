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
    let sourceHint = "auto";
    let enabled = true;
    let translated = 17;
    let injected = false;
    globalThis.chrome = {
      tabs: {
        query: async () => [{ id: 7, url: "https://bank.example/dashboard" }],
        sendMessage: async (_tabId, message) => {
          if (!injected) throw new Error("Receiving end does not exist");
          if (message.type === "KORA_SOURCE") sourceHint = message.source;
          if (message.type === "KORA_TOGGLE") enabled = message.enabled;
          if (message.type === "KORA_RESCAN") translated = 21;
          if (message.type === "KORA_STATUS") {
            return {
              enabled,
              sourceHint,
              stats: { translated, protected: 6, fallback: 2 }
            };
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
  await page.waitForFunction(() => document.querySelector("#status-title")?.textContent === "KORA est actif");

  assert.equal(await page.$eval("#status-detail", (node) => node.textContent), "bank.example · traitement local");
  assert.equal(await page.$eval("#translated", (node) => node.textContent), "17");

  await page.click('input[name="source"][value="fr"]');
  await page.waitForFunction(() => document.querySelector('input[name="source"][value="fr"]')?.checked);
  await page.click("#rescan");
  await page.waitForFunction(() => document.querySelector("#translated")?.textContent === "21");

  await page.click(".lab summary");
  await page.type("#sample", "Bonjour, Fatou Ndiaye");
  await page.click("#translate-sample");
  assert.equal(await page.$eval("#sample-output", (node) => node.textContent), "Sannu, Fatou Ndiaye");

  await page.screenshot({
    path: path.join(root, "test-results/kora-popup.png"),
    fullPage: true
  });

  console.log("POPUP PASS: controls, local translator, status and responsive visual render.");
} finally {
  await browser.close();
}
