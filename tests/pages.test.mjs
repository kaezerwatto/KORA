import assert from "node:assert/strict";
import { createServer } from "node:http";
import path from "node:path";
import puppeteer from "puppeteer-core";

const root = path.resolve(import.meta.dirname, "..");
const extensionPath = path.join(root, "dist");

const pages = {
  "/fr": `<!doctype html><html lang="fr"><body>
    <h1>Bonjour, Mariama Bello</h1>
    <nav><button>Déposer de l'argent</button><button>Retirer de l'argent</button></nav>
    <p>Carte bloquée</p><p>Transaction en attente</p>
    <dl><dt>Solde disponible</dt><dd>375 400 FCFA</dd></dl>
    <nav><a>Accueil</a><a>Développement des langues</a><a>Ressources</a><a>Actualités</a></nav>
    <section><h2>Bibliothèque académique</h2><a>Foire aux questions</a></section>
    <aside><button>Nouvelle discussion</button><button>Envoyer le message</button></aside>
    <input value="Mariama Bello"><p id="customer">Mariama Bello</p>
  </body></html>`,
  "/en": `<!doctype html><html lang="en"><body>
    <h1>Hello, Fatou Ndiaye</h1>
    <nav><button>Deposit money</button><button>Withdraw money</button></nav>
    <p>Payment declined</p><p>Account statement</p>
    <dl><dt>Available balance</dt><dd>81,250 FCFA</dd></dl>
    <nav><a>Home</a><a>Language development</a><a>Resources</a><a>News</a></nav>
    <section><h2>Academic library</h2><a>Frequently asked questions</a></section>
    <aside><button>New chat</button><button>Send message</button></aside>
    <input value="Fatou Ndiaye"><p id="customer">Fatou Ndiaye</p>
  </body></html>`
};

const server = createServer((request, response) => {
  const body = pages[request.url] ?? pages["/fr"];
  response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  response.end(body);
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const { port } = server.address();

const browser = await puppeteer.launch({
  executablePath: "/usr/bin/google-chrome",
  headless: true,
  enableExtensions: [extensionPath],
  args: ["--no-sandbox", "--disable-dev-shm-usage"]
});

try {
  const page = await browser.newPage();
  await page.goto(`http://127.0.0.1:${port}/fr`, { waitUntil: "load" });
  await page.waitForFunction(() => document.documentElement.dataset.koraActive === "true");
  const french = await page.evaluate(() => document.body.innerText);
  assert.match(french, /Sannu, Mariama Bello/);
  assert.match(french, /Naatnugo kaalisi/);
  assert.match(french, /Ittugo kaalisi/);
  assert.match(french, /Kaartu uddaama/);
  assert.match(french, /Jaɓɓorgo/);
  assert.match(french, /Ɓeydingo ɗemɗe/);
  assert.match(french, /Deftereeru jaŋde/);
  assert.match(french, /Yeewtere hesere/);
  assert.match(french, /375 400 FCFA/);
  assert.equal(await page.$eval("input", (input) => input.value), "Mariama Bello");
  assert.equal(await page.$eval("#customer", (node) => node.textContent), "Mariama Bello");

  await page.evaluate(() => {
    const message = document.createElement("p");
    message.id = "dynamic";
    message.textContent = "Vous avez reçu 12 750 FCFA.";
    document.body.appendChild(message);
  });
  await page.waitForFunction(() => document.querySelector("#dynamic")?.textContent === "A jaɓii 12 750 FCFA.");

  await page.goto(`http://127.0.0.1:${port}/en`, { waitUntil: "load" });
  await page.waitForFunction(() => document.documentElement.dataset.koraActive === "true");
  const english = await page.evaluate(() => document.body.innerText);
  assert.match(english, /Sannu, Fatou Ndiaye/);
  assert.match(english, /Naatnugo kaalisi/);
  assert.match(english, /Ittugo kaalisi/);
  assert.match(english, /Yoɓugol salaama/);
  assert.match(english, /Jaɓɓorgo/);
  assert.match(english, /Kuutorɗe/);
  assert.match(english, /Lamɗe e jaabawuuji/);
  assert.match(english, /Neldu ɓatakuru/);
  assert.match(english, /81,250 FCFA/);
  assert.equal(await page.$eval("#customer", (node) => node.textContent), "Fatou Ndiaye");

  console.log("PAGES PASS: banking, portal and assistant UIs in FR/EN, names, values and dynamic text.");
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
