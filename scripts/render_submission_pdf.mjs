import { mkdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import puppeteer from "puppeteer-core";

const root = path.resolve(import.meta.dirname, "..");
const source = path.join(root, "submission", "documentation.html");
const output = path.join(root, "release", "KORA-Documentation-SAFINUM.pdf");

await mkdir(path.dirname(output), { recursive: true });

const browser = await puppeteer.launch({
  executablePath: "/usr/bin/google-chrome",
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--allow-file-access-from-files"]
});

try {
  const page = await browser.newPage();
  await page.goto(pathToFileURL(source).href, { waitUntil: "networkidle0" });
  await page.emulateMediaType("print");
  await page.pdf({
    path: output,
    format: "A4",
    printBackground: true,
    preferCSSPageSize: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 }
  });
  console.log(`Created ${path.relative(root, output)}`);
} finally {
  await browser.close();
}
