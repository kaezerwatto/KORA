import { translateText } from "./engine.js";

const shouldInitialize = !globalThis.__KORA_CONTENT_INITIALIZED__;
if (shouldInitialize) globalThis.__KORA_CONTENT_INITIALIZED__ = true;
const PROTOCOL_VERSION = 6;
const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "CODE", "PRE", "SVG", "CANVAS", "IFRAME"]);
const records = new Map();
const attributeRecords = new Map();
const langRecords = new Map();
const ephemeralProtectedValues = new Set(["Safinum Pay", "FCFA"]);
let observer;
let enabled = true;
let sourceHint = "auto";
let displayLanguage = "fub";
let scanTimer;
let safetyTimer;
let stats = freshStats();
let originalTooltip;

function freshStats() {
  return { scanned: 0, translated: 0, protected: 0, fallback: 0, memory: 0, template: 0, glossary: 0 };
}

function parentIsEligible(node) {
  const element = node.parentElement;
  if (!element || SKIP_TAGS.has(element.tagName)) return false;
  if (element.closest("[contenteditable='true']")) return false;
  if (element.closest("[data-kora-ui]")) return false;
  return true;
}

function protectedValues() {
  for (const field of document.querySelectorAll("input, textarea, select")) {
    if (["checkbox", "radio", "button", "submit"].includes(field.type)) continue;
    if (typeof field.value === "string" && field.value.trim().length > 2) {
      ephemeralProtectedValues.add(field.value.trim());
    }
  }
  return [...ephemeralProtectedValues];
}

function pageSourceHint() {
  return sourceHint;
}

function translateNode(node, protectedList) {
  const current = node.nodeValue ?? "";
  if (!parentIsEligible(node)) return;
  const previous = records.get(node);
  if (previous && current === previous.translated) return;
  if (!current.trim() || !/[\p{L}]/u.test(current)) return;

  stats.scanned += 1;
  const option = node.parentElement?.tagName === "OPTION" ? node.parentElement : null;
  const optionValue = option?.value;
  const textProtectedValues = option
    ? protectedList.filter((value) => value !== optionValue)
    : protectedList;
  const result = translateText(current, {
    sourceHint: pageSourceHint(),
    protectedValues: textProtectedValues
  });

  if (!result.changed) {
    if (result.method === "protected") stats.protected += 1;
    else stats.fallback += 1;
    records.delete(node);
    return;
  }

  const parent = node.parentElement;
  records.set(node, {
    original: current,
    translated: result.text
  });
  node.nodeValue = result.text;
  if (option && optionValue != null) option.value = optionValue;
  if (parent) {
    if (!langRecords.has(parent)) langRecords.set(parent, parent.getAttribute("lang"));
    parent.dataset.koraTranslated = result.method;
    parent.dataset.koraOriginal = current.trim();
    parent.setAttribute("lang", "fub");
    parent.dataset.koraAddedLang = "true";
    if (!parent.hasAttribute("title")) {
      parent.setAttribute("title", current.trim());
      parent.dataset.koraAddedTitle = "true";
    }
  }
  stats.translated += 1;
  if (Object.hasOwn(stats, result.method)) stats[result.method] += 1;
}

function translateAttribute(element, attribute, protectedList) {
  const current = element.getAttribute(attribute);
  if (!current?.trim()) return;
  const key = `${attribute}`;
  const byAttribute = attributeRecords.get(element) ?? new Map();
  const previous = byAttribute.get(key);
  if (previous && current === previous.translated) return;
  const result = translateText(current, {
    sourceHint: pageSourceHint(),
    protectedValues: protectedList
  });
  if (!result.changed) return;
  byAttribute.set(key, { original: current, translated: result.text });
  attributeRecords.set(element, byAttribute);
  element.setAttribute(attribute, result.text);
}

function scan() {
  if (!enabled || !document.body) return;
  stats = freshStats();
  for (const [node] of records) {
    if (!node.isConnected) records.delete(node);
  }
  for (const [element] of attributeRecords) {
    if (!element.isConnected) attributeRecords.delete(element);
  }
  const protectedList = protectedValues();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  let node;
  while ((node = walker.nextNode())) textNodes.push(node);
  for (const textNode of textNodes) translateNode(textNode, protectedList);
  // Frameworks such as Vue may replace action-label text nodes while the first
  // pass is running. Revisit interactive labels after the DOM has settled.
  const interactive = [...document.querySelectorAll("button, a, label, option, [role='button']")].reverse();
  for (const element of interactive) {
    for (const child of element.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) translateNode(child, protectedList);
    }
  }

  for (const element of document.querySelectorAll("[aria-label], [placeholder], [title]")) {
    if (element.closest("[data-kora-ui]")) continue;
    for (const attribute of ["aria-label", "placeholder", "title"]) {
      if (element.hasAttribute(attribute) && element.dataset.koraAddedTitle !== "true") {
        translateAttribute(element, attribute, protectedList);
      }
    }
  }
  stats.translated = records.size;
  document.documentElement.dataset.koraActive = "true";
}

function scheduleScan() {
  clearTimeout(scanTimer);
  scanTimer = setTimeout(scan, 0);
}

function restore() {
  observer?.disconnect();
  for (const [node, record] of records) {
    if (node.isConnected && node.nodeValue === record.translated) node.nodeValue = record.original;
    const parent = node.parentElement;
    if (parent) {
      delete parent.dataset.koraTranslated;
      delete parent.dataset.koraOriginal;
      if (parent.dataset.koraAddedTitle === "true") {
        parent.removeAttribute("title");
        delete parent.dataset.koraAddedTitle;
      }
    }
  }
  for (const [element, originalLang] of langRecords) {
    if (!element.isConnected) continue;
    if (originalLang == null) element.removeAttribute("lang");
    else element.setAttribute("lang", originalLang);
    delete element.dataset.koraAddedLang;
  }
  for (const [element, attrs] of attributeRecords) {
    if (!element.isConnected) continue;
    for (const [attribute, record] of attrs) {
      if (element.getAttribute(attribute) === record.translated) element.setAttribute(attribute, record.original);
    }
  }
  records.clear();
  attributeRecords.clear();
  langRecords.clear();
  delete document.documentElement.dataset.koraActive;
  startObserver();
}

function startObserver() {
  observer?.disconnect();
  observer = new MutationObserver(scheduleScan);
  if (document.body) {
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["aria-label", "placeholder", "title", "disabled", "selected"]
    });
  }
}

function ensureOriginalTooltip() {
  if (originalTooltip?.isConnected) return originalTooltip;
  originalTooltip = document.createElement("div");
  originalTooltip.dataset.koraUi = "true";
  originalTooltip.setAttribute("role", "status");
  originalTooltip.setAttribute("aria-live", "polite");
  originalTooltip.hidden = true;
  Object.assign(originalTooltip.style, {
    position: "fixed",
    zIndex: "2147483647",
    left: "50%",
    bottom: "18px",
    transform: "translateX(-50%)",
    maxWidth: "min(620px, calc(100vw - 32px))",
    padding: "9px 13px",
    borderRadius: "10px",
    background: "#172033",
    color: "#fff",
    font: "600 12px/1.4 system-ui, sans-serif",
    boxShadow: "0 8px 28px #0004",
    pointerEvents: "none"
  });
  document.body.appendChild(originalTooltip);
  return originalTooltip;
}

function showOriginal(event) {
  const element = event.target instanceof Element ? event.target.closest("[data-kora-original]") : null;
  if (!element?.dataset.koraOriginal) return;
  const tooltip = ensureOriginalTooltip();
  tooltip.textContent = `Original : ${element.dataset.koraOriginal}`;
  tooltip.hidden = false;
}

function hideOriginal(event) {
  if (event.relatedTarget instanceof Element && event.relatedTarget.closest("[data-kora-original]")) return;
  if (originalTooltip) originalTooltip.hidden = true;
}

function normalizeUiLabel(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .trim()
    .toLocaleLowerCase("fr");
}

const LANGUAGE_ALIASES = Object.freeze({
  fr: new Set(["fr", "français", "french"]),
  en: new Set(["en", "english", "anglais"])
});

function languageForLabel(value) {
  const label = normalizeUiLabel(value);
  for (const [language, aliases] of Object.entries(LANGUAGE_ALIASES)) {
    if (aliases.has(label)) return language;
  }
  return null;
}

function originalControlText(control) {
  const walker = document.createTreeWalker(control, NodeFilter.SHOW_TEXT);
  const parts = [];
  let node;
  while ((node = walker.nextNode())) {
    parts.push(records.get(node)?.original ?? node.nodeValue ?? "");
  }
  return parts.join(" ");
}

function switchNativeLanguage(language) {
  const aliases = LANGUAGE_ALIASES[language];
  if (!aliases) return false;

  for (const select of document.querySelectorAll("select")) {
    const option = [...select.options].find((item) =>
      aliases.has(normalizeUiLabel(item.textContent)) ||
      aliases.has(normalizeUiLabel(item.value))
    );
    if (!option) continue;
    select.value = option.value;
    select.dispatchEvent(new Event("input", { bubbles: true }));
    select.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }

  for (const control of document.querySelectorAll("button, a, [role='button']")) {
    const labels = [
      control.textContent,
      control.getAttribute("aria-label"),
      control.getAttribute("title")
    ].map(normalizeUiLabel);
    if (!labels.some((label) => aliases.has(label))) continue;
    const style = getComputedStyle(control);
    if (style.display === "none" || style.visibility === "hidden") continue;
    control.click();
    return true;
  }
  return false;
}

function handleNativeLanguageSelection(event) {
  const target = event.target;
  let language = null;
  if (target instanceof HTMLSelectElement) {
    language = languageForLabel(target.selectedOptions[0]?.textContent) ??
      languageForLabel(target.value);
  } else if (target instanceof Element) {
    const control = target.closest("button, a, [role='button']");
    if (control) {
      language = languageForLabel(control.textContent) ??
        languageForLabel(originalControlText(control)) ??
        languageForLabel(control.getAttribute("aria-label")) ??
        languageForLabel(control.getAttribute("title"));
    }
  }
  if (!language || (!enabled && displayLanguage === language)) return;

  // Let the site's own event pipeline finish before touching extension
  // storage or translated nodes. Some frameworks synchronously inspect the
  // clicked control until dispatch has fully returned.
  setTimeout(() => {
    enabled = false;
    displayLanguage = language;
    chrome.storage.local.set({
      koraEnabled: false,
      koraDisplayLanguage: language
    });
    restore();
  }, 0);
}

async function loadPreferences() {
  const stored = await chrome.storage.local.get({
    koraEnabled: true,
    koraSource: "auto",
    koraDisplayLanguage: "fub"
  });
  enabled = stored.koraEnabled;
  sourceHint = stored.koraSource;
  displayLanguage = ["fub", "fr", "en", "original"].includes(stored.koraDisplayLanguage)
    ? stored.koraDisplayLanguage
    : "fub";
  if (displayLanguage !== "fub") enabled = false;
}

function registerMessageListener() {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "KORA_STATUS") {
    sendResponse({
      protocolVersion: PROTOCOL_VERSION,
      enabled,
      sourceHint,
      displayLanguage,
      stats,
      language: "fub",
      offline: true
    });
    return;
  }
  if (message?.type === "KORA_TOGGLE") {
    enabled = Boolean(message.enabled);
    displayLanguage = enabled ? "fub" : "original";
    chrome.storage.local.set({
      koraEnabled: enabled,
      koraDisplayLanguage: displayLanguage
    });
    enabled ? scan() : restore();
    sendResponse({ ok: true, enabled, displayLanguage });
    return;
  }
  if (message?.type === "KORA_DISPLAY_LANGUAGE") {
    const requested = ["fub", "fr", "en"].includes(message.language)
      ? message.language
      : "fub";
    displayLanguage = requested;
    enabled = requested === "fub";
    sourceHint = "auto";
    chrome.storage.local.set({
      koraEnabled: enabled,
      koraSource: sourceHint,
      koraDisplayLanguage: displayLanguage
    });
    if (enabled) {
      scan();
      sendResponse({ ok: true, enabled, displayLanguage, switched: true });
    } else {
      restore();
      sendResponse({ ok: true, enabled, displayLanguage });
      setTimeout(() => switchNativeLanguage(requested), 0);
    }
    return;
  }
  if (message?.type === "KORA_SOURCE") {
    sourceHint = ["auto", "fr", "en"].includes(message.source) ? message.source : "auto";
    chrome.storage.local.set({ koraSource: sourceHint });
    restore();
    if (enabled) scan();
    sendResponse({ ok: true, sourceHint });
    return;
  }
  if (message?.type === "KORA_RESCAN") {
    restore();
    if (enabled) scan();
    sendResponse({ ok: true, stats });
    return;
  }
  if (message?.type === "KORA_TRANSLATE_SAMPLE") {
    const result = translateText(String(message.text ?? ""), {
      sourceHint: ["auto", "fr", "en"].includes(message.source) ? message.source : sourceHint,
      protectedValues: []
    });
    sendResponse(result);
  }
  });
}

async function initialize() {
  await loadPreferences();
  registerMessageListener();
  startObserver();
  if (enabled) scan();
  document.addEventListener("click", handleNativeLanguageSelection, true);
  document.addEventListener("change", handleNativeLanguageSelection, true);
  for (const eventName of ["click", "change", "input"]) {
    document.addEventListener(eventName, scheduleScan, true);
  }
  document.addEventListener("mouseover", showOriginal, true);
  document.addEventListener("focusin", showOriginal, true);
  document.addEventListener("mouseout", hideOriginal, true);
  document.addEventListener("focusout", hideOriginal, true);
  safetyTimer = setInterval(() => {
    if (enabled && !document.hidden) scan();
  }, 500);
}

if (shouldInitialize) void initialize().catch(() => {
  delete globalThis.__KORA_CONTENT_INITIALIZED__;
});
