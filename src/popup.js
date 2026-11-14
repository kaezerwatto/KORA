const enabled = document.querySelector("#enabled");
const statusTitle = document.querySelector("#status-title");
const statusDetail = document.querySelector("#status-detail");
const statusIcon = document.querySelector("#status-icon");
const languageInputs = [...document.querySelectorAll('input[name="display-language"]')];
const PROTOCOL_VERSION = 5;

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
    const response = await chrome.tabs.sendMessage(tab.id, message);
    if (message.type === "KORA_STATUS" && response?.protocolVersion !== PROTOCOL_VERSION) {
      await chrome.tabs.reload(tab.id);
      return { response: null, tab, reloading: true };
    }
    return { response, tab };
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
  for (const input of languageInputs) {
    input.disabled = false;
    input.checked = input.value === status.displayLanguage;
  }
  if (status.enabled) {
    statusTitle.textContent = "Traduction activée";
    statusDetail.textContent = `${pageLabel(tab)} · Fulfulde automatique`;
  } else if (status.displayLanguage === "fr") {
    statusTitle.textContent = "Page en français";
    statusDetail.textContent = `${pageLabel(tab)} · texte original ou langue du site`;
  } else if (status.displayLanguage === "en") {
    statusTitle.textContent = "Page in English";
    statusDetail.textContent = `${pageLabel(tab)} · original or website language`;
  } else {
    statusTitle.textContent = "Traduction désactivée";
    statusDetail.textContent = `${pageLabel(tab)} · texte original`;
  }
  statusIcon.className = `status-icon ${status.enabled ? "active" : ""}`;
}

function renderUnavailable(tab, reloading = false) {
  enabled.checked = false;
  enabled.disabled = true;
  for (const input of languageInputs) input.disabled = true;
  statusTitle.textContent = reloading
    ? "Mise à jour de KORA…"
    : supportsPage(tab) ? "Actualisez cette page" : "Page non accessible";
  statusDetail.textContent = reloading
    ? "La page se recharge avec la nouvelle version."
    : supportsPage(tab)
    ? "KORA se reconnectera après actualisation."
    : "Ouvrez un site web normal pour traduire.";
  statusIcon.className = "status-icon error";
}

async function refresh() {
  const { response, tab, reloading } = await sendToPage({ type: "KORA_STATUS" });
  if (response) renderAvailable(response, tab);
  else renderUnavailable(tab, reloading);
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

for (const input of languageInputs) {
  input.addEventListener("change", () => {
    if (!input.checked) return;
    void (async () => {
      for (const control of languageInputs) control.disabled = true;
      const { response, tab } = await sendToPage({
        type: "KORA_DISPLAY_LANGUAGE",
        language: input.value
      });
      if (!response) {
        renderUnavailable(tab);
        return;
      }
      renderAvailable(response, tab);
    })().catch(async () => {
      renderUnavailable(await activeTab());
    });
  });
}

void refresh().catch(async () => {
  renderUnavailable(await activeTab());
});
