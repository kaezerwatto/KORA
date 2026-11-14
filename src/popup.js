const enabled = document.querySelector("#enabled");
const statusTitle = document.querySelector("#status-title");
const statusDetail = document.querySelector("#status-detail");
const statusDot = document.querySelector("#status-dot");

async function activeTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

function supportsPage(tab) {
  return /^(?:https?|file):/i.test(tab?.url ?? "");
}

function pageLabel(tab) {
  try {
    const url = new URL(tab.url);
    return url.protocol === "file:" ? "Fichier local" : url.hostname.replace(/^www\./, "");
  } catch {
    return "Onglet actif";
  }
}

async function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function sendToPage(message) {
  const tab = await activeTab();
  if (!tab?.id || !supportsPage(tab)) return { response: null, tab };

  try {
    return { response: await chrome.tabs.sendMessage(tab.id, message), tab };
  } catch {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content.js"]
      });
      for (const delay of [60, 120, 240]) {
        await wait(delay);
        try {
          return { response: await chrome.tabs.sendMessage(tab.id, message), tab };
        } catch {
          // The injected script may still be reading stored preferences.
        }
      }
    } catch {
      // Restricted browser pages intentionally reject script injection.
    }
  }
  return { response: null, tab };
}

function renderAvailable(status, tab) {
  enabled.disabled = false;
  enabled.checked = Boolean(status.enabled);
  statusTitle.textContent = status.enabled ? "Traduction activée" : "Traduction désactivée";
  statusDetail.textContent = status.enabled
    ? `${pageLabel(tab)} · mise à jour automatique`
    : `${pageLabel(tab)} · texte original`;
  statusDot.className = `status-dot ${status.enabled ? "active" : ""}`;
}

function renderUnavailable(tab) {
  enabled.checked = false;
  enabled.disabled = true;
  statusTitle.textContent = supportsPage(tab) ? "Actualisez cette page" : "Page non accessible";
  statusDetail.textContent = supportsPage(tab)
    ? "KORA se reconnectera après actualisation."
    : "Ouvrez un site web normal pour traduire.";
  statusDot.className = "status-dot error";
}

async function refresh() {
  const { response, tab } = await sendToPage({ type: "KORA_STATUS" });
  if (response) renderAvailable(response, tab);
  else renderUnavailable(tab);
}

async function toggleTranslation() {
  const requested = enabled.checked;
  enabled.disabled = true;
  const { response, tab } = await sendToPage({
    type: "KORA_TOGGLE",
    enabled: requested
  });
  if (!response) {
    renderUnavailable(tab);
    return;
  }
  await refresh();
}

enabled.addEventListener("change", () => {
  void toggleTranslation().catch(async () => {
    renderUnavailable(await activeTab());
  });
});

void refresh().catch(async () => {
  renderUnavailable(await activeTab());
});
