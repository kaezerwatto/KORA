import { translateText } from "./engine.js";

const enabled = document.querySelector("#enabled");
const statusTitle = document.querySelector("#status-title");
const statusDetail = document.querySelector("#status-detail");
const statusIcon = document.querySelector("#status-icon");
const translated = document.querySelector("#translated");
const protectedCount = document.querySelector("#protected");
const fallback = document.querySelector("#fallback");
const rescan = document.querySelector("#rescan");
const sample = document.querySelector("#sample");
const translateSample = document.querySelector("#translate-sample");
const sampleOutput = document.querySelector("#sample-output");
const speakSample = document.querySelector("#speak-sample");
const toast = document.querySelector("#toast");
let toastTimer;
let currentTab;

async function activeTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  currentTab = tab;
  return tab;
}

function isSupportedPage(tab) {
  return /^(?:https?|file):/i.test(tab?.url ?? "");
}

async function send(message, allowInjection = true) {
  const tab = await activeTab();
  if (!tab?.id) throw new Error("Aucun onglet actif");
  if (!isSupportedPage(tab)) throw new Error("PAGE_PROTECTED");
  try {
    return await chrome.tabs.sendMessage(tab.id, message);
  } catch (error) {
    if (!allowInjection) throw error;
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["content.js"] });
    await new Promise((resolve) => setTimeout(resolve, 60));
    return chrome.tabs.sendMessage(tab.id, message);
  }
}

function pageLabel(tab) {
  try {
    const url = new URL(tab?.url ?? "");
    if (url.protocol === "file:") return "Fichier local";
    return url.hostname.replace(/^www\./, "");
  } catch {
    return "Onglet actif";
  }
}

function notify(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.hidden = false;
  toastTimer = setTimeout(() => {
    toast.hidden = true;
  }, 2200);
}

function render(status) {
  enabled.checked = status.enabled;
  enabled.disabled = false;
  rescan.disabled = false;
  const source = document.querySelector(`input[name="source"][value="${status.sourceHint}"]`);
  if (source) source.checked = true;
  translated.textContent = status.stats?.translated ?? 0;
  protectedCount.textContent = status.stats?.protected ?? 0;
  fallback.textContent = status.stats?.fallback ?? 0;
  statusTitle.textContent = status.enabled ? "KORA est actif" : "Traduction suspendue";
  statusDetail.textContent = status.enabled
    ? `${pageLabel(currentTab)} · traitement local`
    : "Le texte original est affiché.";
  statusIcon.className = `status-icon ${status.enabled ? "" : "pending"}`;
}

function showError(error) {
  const protectedPage = error?.message === "PAGE_PROTECTED";
  statusTitle.textContent = protectedPage ? "Page protégée par Chrome" : "Page non connectée";
  statusDetail.textContent = protectedPage
    ? "Ouvrez un site web pour utiliser KORA."
    : "Actualisez la page ou cliquez à nouveau.";
  statusIcon.className = "status-icon error";
  enabled.disabled = true;
  rescan.disabled = true;
}

async function refresh() {
  try {
    render(await send({ type: "KORA_STATUS" }));
  } catch (error) {
    showError(error);
  }
}

enabled.addEventListener("change", async () => {
  const desired = enabled.checked;
  try {
    await send({ type: "KORA_TOGGLE", enabled: desired });
    await refresh();
    notify(desired ? "Traduction activée" : "Texte original restauré");
  } catch (error) {
    enabled.checked = !desired;
    showError(error);
  }
});

for (const radio of document.querySelectorAll('input[name="source"]')) {
  radio.addEventListener("change", async () => {
    if (!radio.checked) return;
    try {
      await send({ type: "KORA_SOURCE", source: radio.value });
      await new Promise((resolve) => setTimeout(resolve, 80));
      await refresh();
      notify("Langue source mise à jour");
    } catch (error) {
      showError(error);
    }
  });
}

rescan.addEventListener("click", async () => {
  let usable = true;
  rescan.disabled = true;
  rescan.classList.add("busy");
  rescan.querySelector("span").textContent = "Analyse en cours…";
  try {
    await send({ type: "KORA_RESCAN" });
    await new Promise((resolve) => setTimeout(resolve, 120));
    await refresh();
    notify("Page traduite");
  } catch (error) {
    usable = false;
    showError(error);
  } finally {
    rescan.classList.remove("busy");
    rescan.querySelector("span").textContent = "Traduire cette page";
    rescan.disabled = !usable;
  }
});

translateSample.addEventListener("click", () => {
  const text = sample.value.trim();
  if (!text) {
    sampleOutput.textContent = "Saisissez une phrase à traduire.";
    speakSample.disabled = true;
    return;
  }
  translateSample.disabled = true;
  try {
    const checked = document.querySelector('input[name="source"]:checked')?.value ?? "auto";
    const result = translateText(text, { sourceHint: checked });
    sampleOutput.textContent = result.changed
      ? result.text
      : "Traduction incertaine : KORA conserve le texte original.";
    speakSample.disabled = !result.changed;
  } catch {
    sampleOutput.textContent = "Une erreur est survenue. Réessayez.";
    speakSample.disabled = true;
  } finally {
    translateSample.disabled = false;
  }
});

speakSample.addEventListener("click", () => {
  const text = sampleOutput.textContent.trim();
  if (!text || !("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ff-CM";
  utterance.rate = 0.85;
  speechSynthesis.speak(utterance);
});

refresh();
