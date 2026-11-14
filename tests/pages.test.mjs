import assert from "node:assert/strict";
import { createServer } from "node:http";
import path from "node:path";
import puppeteer from "puppeteer-core";

const root = path.resolve(import.meta.dirname, "..");
const extensionPath = path.join(root, "dist");

const pages = {
  "/fr": `<!doctype html><html lang="fr"><body>
    <h1>Bonjour, Mariama Bello</h1>
    <button id="switch-fr">FR</button><button id="switch-en">EN</button>
    <nav><button>Déposer de l'argent</button><button>Retirer de l'argent</button></nav>
    <p>Carte bloquée</p><p>Transaction en attente</p>
    <dl><dt>Solde disponible</dt><dd>375 400 FCFA</dd></dl>
    <nav><a>Accueil</a><a>Développement des langues</a><a>Ressources</a><a>Actualités</a></nav>
    <section><h2>Bibliothèque académique</h2><a>Foire aux questions</a></section>
    <aside><button>Nouvelle discussion</button><button>Envoyer le message</button></aside>
    <select id="bank"><option value="other-bank">Autre banque</option><option value="mobile-money">Mobile Money</option></select>
    <input value="Mariama Bello"><p id="customer">Mariama Bello</p>
    <script>
      document.querySelector('#switch-fr').onclick = () => document.documentElement.dataset.siteLanguage = 'fr';
      document.querySelector('#switch-en').onclick = () => document.documentElement.dataset.siteLanguage = 'en';
    </script>
  </body></html>`,
  "/en": `<!doctype html><html lang="en"><body>
    <h1>Hello, Fatou Ndiaye</h1>
    <button id="switch-fr">FR</button><button id="switch-en">EN</button>
    <nav><button>Deposit money</button><button>Withdraw money</button></nav>
    <p>Payment declined</p><p>Account statement</p>
    <dl><dt>Available balance</dt><dd>81,250 FCFA</dd></dl>
    <nav><a>Home</a><a>Language development</a><a>Resources</a><a>News</a></nav>
    <section><h2>Academic library</h2><a>Frequently asked questions</a></section>
    <aside><button>New chat</button><button>Send message</button></aside>
    <select id="bank"><option value="other-bank">Other bank</option><option value="mobile-money">Mobile Money</option></select>
    <input id="reason" value="Payment for services"><p id="reason-echo">Payment for services</p>
    <iframe id="injected-frame" src="/frame"></iframe>
    <input value="Fatou Ndiaye"><p id="customer">Fatou Ndiaye</p>
    <script>
      document.querySelector('#switch-fr').onclick = () => document.documentElement.dataset.siteLanguage = 'fr';
      document.querySelector('#switch-en').onclick = () => document.documentElement.dataset.siteLanguage = 'en';
    </script>
  </body></html>`,
  "/frame": `<!doctype html><html lang="en"><body>
    <p id="frame-message">Injected content</p>
    <input id="frame-attribute" placeholder="Amount">
  </body></html>`,
  "/uba": `<!doctype html><html lang="fr"><body>
    <nav>
      <a>Localisateur de GAB / Agences</a><a>Particuliers</a><a>Cartes</a>
      <a>Crédits</a><a>Entreprises</a><a>Internet Banking</a><a>Aide</a>
    </nav>
    <main>
      <h1>Banque Digitale</h1>
      <p>Nos solutions digitales offrent de nombreux avantages qui vous permettront de garder le contrôle où que vous soyez.</p>
      <a>En savoir plus</a>
      <h2>LEO</h2>
      <p>Découvrez LEO, l’assistant virtuel de UBA qui simplifie votre quotidien en vous accompagnant dans vos paiements, vos transferts et toutes vos opérations essentielles.</p>
      <h2>Banque pour particuliers</h2>
      <p>Nous répondons à vos besoins essentiels en vous proposant une gamme d’options bancaires adaptées à votre personnalité.</p>
      <h2>Personnalisez vos mises à jour</h2>
      <p>Inscrivez-vous pour recevoir les contenus qui vous intéressent le plus.</p>
      <label>Noms &amp; Prénoms <input value=""></label>
    </main>
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
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--enable-unsafe-extension-debugging"]
});
const extensionId = await browser.installExtension(extensionPath);

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
  assert.equal(await page.$eval("#bank", (select) => select.value), "other-bank");
  assert.equal(await page.$eval("#bank option", (option) => option.value), "other-bank");
  assert.equal(await page.$eval("#bank option", (option) => option.textContent), "Baŋki goɗɗo");

  await page.evaluate(() => {
    document.body.tabIndex = -1;
    document.body.focus();
  });
  await page.keyboard.down("Control");
  await page.keyboard.press("KeyA");
  await page.keyboard.up("Control");
  assert.match(await page.evaluate(() => getSelection()?.toString() ?? ""), /Sannu, Mariama Bello/);
  await page.evaluate(() => getSelection()?.removeAllRanges());

  const extensionPage = await browser.newPage();
  await extensionPage.goto(`chrome-extension://${extensionId}/popup.html`, { waitUntil: "load" });
  const displayLanguage = async (language) => {
    await page.bringToFront();
    return extensionPage.evaluate(async (selectedLanguage) => {
    const [target] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!target?.id) throw new Error("Fixture tab not found");
    return chrome.tabs.sendMessage(target.id, {
      type: "KORA_DISPLAY_LANGUAGE",
      language: selectedLanguage
    });
  }, language);
  };

  await page.$eval("#switch-fr", (control) => control.click());
  await page.waitForFunction(() => document.documentElement.dataset.siteLanguage === "fr");
  assert.match(await page.evaluate(() => document.body.innerText), /Bonjour, Mariama Bello/);
  assert.equal(await page.evaluate(() => document.documentElement.dataset.koraActive), undefined);

  await displayLanguage("fub");
  await page.waitForFunction(() => document.documentElement.dataset.koraActive === "true");
  assert.match(await page.evaluate(() => document.body.innerText), /Sannu, Mariama Bello/);

  await displayLanguage("en");
  await page.waitForFunction(() => document.documentElement.dataset.siteLanguage === "en");
  assert.match(await page.evaluate(() => document.body.innerText), /Bonjour, Mariama Bello/);
  await displayLanguage("fub");
  await page.waitForFunction(() => document.documentElement.dataset.koraActive === "true");

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
  assert.equal(await page.$eval("#bank", (select) => select.value), "other-bank");
  assert.equal(await page.$eval("#bank option", (option) => option.value), "other-bank");
  assert.equal(await page.$eval("#bank option", (option) => option.textContent), "Baŋki goɗɗo");
  assert.equal(await page.$eval("#reason", (input) => input.value), "Payment for services");
  assert.equal(await page.$eval("#reason-echo", (node) => node.textContent), "Payment for services");
  const injectedFrame = page.frames().find((frame) => frame.url().endsWith("/frame"));
  assert.ok(injectedFrame, "same-origin frame should be present");
  await injectedFrame.waitForFunction(
    () =>
      document.querySelector("#frame-message")?.textContent === "Loowdi naatnaandi" &&
      document.querySelector("#frame-attribute")?.placeholder === "Jate kaalisi"
  );

  await page.evaluate(() => {
    const panel = document.createElement("section");
    panel.id = "jury-panel";
    panel.innerHTML = `
      <h2>Inject unseen content</h2>
      <p>Text rendered in the page after load. The extension must translate it without a dedicated hook.</p>
      <label for="inject-source">Inject unseen content</label>
      <textarea id="inject-source" placeholder="e.g. An important message for customers…"></textarea>
      <button>Inject</button><h3>Injected content</h3>
      <p>Trigger an error / warning</p><button>Security warning</button><button>Network error</button>
      <p>Alter canonical values</p><label>Amount</label><output>25,000 FCFA</output>
      <label>Beneficiary</label><output>Jean-Paul Mbarga</output>
      <label>Code</label><output>NETWORK_001</output><button>Apply</button>
      <button>Verify current step now</button><button>Reset test</button>
      <h3>Alert / error</h3><p>Intact</p><button>Detail</button><p>Fee consultation</p>`;
    document.body.appendChild(panel);
  });
  await page.waitForFunction(
    () =>
      document.querySelector("#jury-panel")?.innerText.includes("Naatnu loowdi ndi anndaaka") &&
      document.querySelector("#jury-panel")?.innerText.includes("Waylu kiɗɗe tabitiiɗe")
  );
  const juryPanel = await page.$eval("#jury-panel", (node) => node.innerText);
  for (const expected of [
    "Fuɗɗin juumre / jeertina",
    "Jeertina kisal",
    "Juumre reso",
    "25,000 FCFA",
    "Jean-Paul Mbarga",
    "NETWORK_001",
    "Huutin",
    "Ƴeewto taƴre jooni",
    "Fuɗɗito ƴeewndo",
    "Waylaaka",
    "Ƴeewtagol musakaaji"
  ]) {
    assert.match(juryPanel, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), expected);
  }
  await page.$eval("#inject-source", (field) => {
    field.value = "hello mon frere qui est tu";
    field.title = "Network error";
    field.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await page.waitForFunction(
    () => document.querySelector("#inject-source")?.title === "Juumre reso"
  );
  await page.evaluate(() => {
    const message = document.createElement("p");
    message.id = "mixed-injection";
    message.textContent = document.querySelector("#inject-source").value;
    document.querySelector("#jury-panel").appendChild(message);
  });
  await page.waitForFunction(
    () =>
      document.querySelector("#mixed-injection")?.textContent ===
      "Sannu musiɗɗo am, aan ko moy?"
  );
  assert.equal(
    await page.$eval("#inject-source", (field) => field.value),
    "hello mon frere qui est tu"
  );

  await page.evaluate(() => {
    const changing = document.createElement("p");
    changing.id = "changing-injection";
    changing.textContent = "Network error";
    document.body.appendChild(changing);

    const misspelled = document.createElement("p");
    misspelled.id = "financial-spelling-injection";
    misspelled.textContent = "sodle insufisant";
    document.body.appendChild(misspelled);

    const attributes = document.createElement("input");
    attributes.id = "attribute-injection";
    attributes.placeholder = "Amount";
    attributes.setAttribute("aria-label", "Apply");
    attributes.title = "Security warning";
    document.body.appendChild(attributes);

    const host = document.createElement("div");
    host.id = "shadow-injection";
    host.attachShadow({ mode: "open" }).innerHTML =
      '<p id="shadow-message">Injected content</p><input id="shadow-field" placeholder="Amount">';
    document.body.appendChild(host);
  });
  await page.waitForFunction(
    () =>
      document.querySelector("#changing-injection")?.textContent === "Juumre reso" &&
      document.querySelector("#financial-spelling-injection")?.textContent === "Kaalisi yonaa" &&
      document.querySelector("#attribute-injection")?.placeholder === "Jate kaalisi" &&
      document.querySelector("#shadow-injection")?.shadowRoot
        ?.querySelector("#shadow-message")?.textContent === "Loowdi naatnaandi"
  );
  assert.equal(
    await page.$eval("#attribute-injection", (field) => field.getAttribute("aria-label")),
    "Huutin"
  );
  assert.equal(
    await page.$eval("#attribute-injection", (field) => field.title),
    "Jeertina kisal"
  );
  assert.equal(
    await page.$eval(
      "#shadow-injection",
      (host) => host.shadowRoot.querySelector("#shadow-field").placeholder
    ),
    "Jate kaalisi"
  );
  await page.$eval("#changing-injection", (node) => {
    node.textContent = "Security warning";
  });
  await page.waitForFunction(
    () => document.querySelector("#changing-injection")?.textContent === "Jeertina kisal"
  );

  await page.$eval("#switch-en", (control) => control.click());
  await page.waitForFunction(() => document.documentElement.dataset.siteLanguage === "en");
  assert.match(await page.evaluate(() => document.body.innerText), /Hello, Fatou Ndiaye/);
  await displayLanguage("fub");
  await page.waitForFunction(() => document.documentElement.dataset.koraActive === "true");
  assert.match(await page.evaluate(() => document.body.innerText), /Sannu, Fatou Ndiaye/);

  await page.goto(`http://127.0.0.1:${port}/uba`, { waitUntil: "load" });
  await page.waitForFunction(() => document.documentElement.dataset.koraActive === "true");
  const uba = await page.evaluate(() => document.body.innerText);
  for (const expected of [
    "Ɗaɓɓirgal masin kaalisi / bure baŋki",
    "Kiliyaneeɓe keeriiɓe",
    "Kaarte",
    "Kerdii",
    "Kompaniiji",
    "Baŋki e internet",
    "Baŋki dijitaal",
    "Kuutorɗe amen dijitaal",
    "Anndu LEO",
    "Baŋki ngam kiliyaneeɓe keeriiɓe",
    "Suɓo kabaruuji maa",
    "Innde e jammun"
  ]) {
    assert.match(uba, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "iu"), expected);
  }

  console.log("PAGES PASS: FR/EN/FUB, inputs, dynamic text/attributes, open Shadow DOM and iframe.");
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
