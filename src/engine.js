import {
  EN_TO_FUB,
  FR_TO_FUB,
  GLOSSARY_EN,
  GLOSSARY_FR,
  TEMPLATES_EN,
  TEMPLATES_FR
} from "./translations.js";
import {
  GENERAL_EN_TO_FUB,
  GENERAL_FR_TO_FUB,
  GENERAL_TEMPLATES_EN,
  GENERAL_TEMPLATES_FR
} from "./general-translations.js";
import { rankFubCandidates, scoreFubFluency } from "./language-model.js";

const FRENCH_MARKERS = /\b(le|la|les|des|du|de|votre|vous|avant|après|bonjour|bonsoir|bienvenue|transfert|frais|solde|compte|vérifiez|paiement|carte|mot|passe|retrait|dépôt)\b/i;
const ENGLISH_MARKERS = /\b(the|your|you|before|after|hello|welcome|good evening|transfer|fees?|balance|account|check|confirm|payment|card|password|withdrawal|deposit)\b/i;
const STOPWORDS = Object.freeze({
  fr: new Set(["a", "au", "aux", "ce", "ces", "de", "des", "du", "en", "est", "et", "la", "le", "les", "l'", "un", "une", "votre", "vos"]),
  en: new Set(["a", "an", "and", "are", "at", "for", "in", "is", "of", "on", "the", "to", "was", "were", "your"])
});
const CRITICAL_MARKERS = Object.freeze({
  fr: /\b(?:annul|bénéficiaire|carte|code|compte|confirm|crédit|débit|dépôt|échou|frais|gratuit|limite|montant|mot de passe|paiement|plafond|prêt|refus|rembours|retrait|sécurité|solde|transfert|valid)\w*/iu,
  en: /\b(?:account|amount|beneficiary|cancel|card|code|confirm|credit|debit|declin|deposit|fail|fees?|free|limit|loan|password|payment|recipient|refund|repay|security|transfer|valid|withdraw)\w*/iu
});
const NAME_PATTERN = /^(?:[\p{Lu}][\p{L}'’.-]*)(?:\s+[\p{Lu}][\p{L}'’.-]*){1,4}$/u;
const GREETING_PATTERN = /^(?:bonjour|bonsoir|bienvenue|hello|good evening|welcome)[,\s]+/iu;
const OPAQUE_CODE_PATTERN = /^(?=.*[\p{Lu}\d])[\p{Lu}\d_.:/-]{4,}$/u;
const SENSITIVE_PATTERNS = [
  /[+\-]?\d[\d\s\u00a0\u202f.,]*\s*(?:FCFA|XAF|CFA|%)/giu,
  /(?:\+?\d[\d\s().-]{6,}\d)/gu,
  /\b(?:CM|SAF)[\s-][A-Z0-9][A-Z0-9\s-]{4,}\b/gu,
  /\b[A-Z]{2,}(?:-[A-Z0-9]{2,}){2,}\b/gu,
  /\b\d{1,2}\s+(?:janv\.?|févr\.?|mars|avr\.?|mai|juin|juil\.?|août|sept\.?|oct\.?|nov\.?|déc\.?|jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{4}\b/giu,
  /\b[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}\b/gu,
  /https?:\/\/\S+/giu
];

export function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .replace(/[’‘]/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("fr");
}

export function detectSource(text, hint = "auto") {
  const key = normalizeText(text);
  const inFr = Object.hasOwn(FR_TO_FUB, key) || Object.hasOwn(GENERAL_FR_TO_FUB, key);
  const inEn = Object.hasOwn(EN_TO_FUB, key) || Object.hasOwn(GENERAL_EN_TO_FUB, key);
  if (inFr && !inEn) return "fr";
  if (inEn && !inFr) return "en";
  if (hint === "fr" || hint === "en") return hint;
  const fr = (text.match(FRENCH_MARKERS) ?? []).length;
  const en = (text.match(ENGLISH_MARKERS) ?? []).length;
  return en > fr ? "en" : "fr";
}

function collectMatches(text, extraValues) {
  const matches = [];
  for (const pattern of SENSITIVE_PATTERNS) {
    pattern.lastIndex = 0;
    for (const match of text.matchAll(pattern)) {
      matches.push({ start: match.index, end: match.index + match[0].length, value: match[0] });
    }
  }
  for (const raw of extraValues) {
    const value = String(raw ?? "").trim();
    if (value.length < 2) continue;
    let index = text.indexOf(value);
    while (index !== -1) {
      matches.push({ start: index, end: index + value.length, value });
      index = text.indexOf(value, index + value.length);
    }
  }
  matches.sort((a, b) => a.start - b.start || b.end - a.end);
  return matches.filter((item, index, all) =>
    !all.slice(0, index).some((kept) => item.start < kept.end && item.end > kept.start)
  );
}

export function maskSensitive(text, extraValues = []) {
  const matches = collectMatches(text, extraValues);
  if (!matches.length) return { masked: text, values: [] };
  let cursor = 0;
  let masked = "";
  const values = [];
  for (const match of matches) {
    masked += text.slice(cursor, match.start);
    const token = `⟪KORA_${values.length}⟫`;
    masked += token;
    values.push({ token, value: match.value });
    cursor = match.end;
  }
  masked += text.slice(cursor);
  return { masked, values };
}

export function restoreSensitive(text, values) {
  let restored = text;
  for (const { token, value } of values) restored = restored.replaceAll(token, value);
  return restored;
}

export function preservesSensitive(original, translated, extraValues = []) {
  const { values } = maskSensitive(original, extraValues);
  const uniqueValues = new Set(values.map(({ value }) => value));
  return [...uniqueValues].every((value) => {
    const originalCount = original.split(value).length - 1;
    const translatedCount = translated.split(value).length - 1;
    return translatedCount === originalCount;
  });
}

function preserveOuterWhitespace(original, translated) {
  const leading = original.match(/^\s*/u)?.[0] ?? "";
  const trailing = original.match(/\s*$/u)?.[0] ?? "";
  return `${leading}${translated.trim()}${trailing}`;
}

function applyTemplates(masked, source) {
  const templates = source === "en"
    ? [...TEMPLATES_EN, ...GENERAL_TEMPLATES_EN]
    : [...TEMPLATES_FR, ...GENERAL_TEMPLATES_FR];
  const candidates = [];
  for (const template of templates) {
    const match = masked.match(template.pattern);
    if (!match) continue;
    const rendered = template.render(match);
    candidates.push(...(Array.isArray(rendered) ? rendered : [rendered]));
  }
  return candidates.length ? rankFubCandidates(candidates)[0].text : null;
}

function applyGlossary(masked, source) {
  const generalMemory = source === "en" ? GENERAL_EN_TO_FUB : GENERAL_FR_TO_FUB;
  const glossary = [
    ...Object.entries(generalMemory).sort((a, b) => b[0].length - a[0].length),
    ...(source === "en" ? GLOSSARY_EN : GLOSSARY_FR)
  ];
  let output = masked;
  let matchedWords = 0;
  for (const [term, translated] of glossary) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(`(^|[^\\p{L}])(${escaped})(?=$|[^\\p{L}])`, "giu");
    output = output.replace(pattern, (_, prefix) => {
      matchedWords += term.match(/\p{L}+/gu)?.length ?? 1;
      return `${prefix}${translated}`;
    });
  }
  const sourceWords = normalizeText(masked)
    .replace(/⟪kora_\d+⟫/g, "")
    .match(/\p{L}+/gu) ?? [];
  const meaningfulWords = sourceWords.filter((word) => !STOPWORDS[source].has(word));
  const coverage = meaningfulWords.length === 0
    ? 0
    : Math.min(1, matchedWords / meaningfulWords.length);
  const threshold = CRITICAL_MARKERS[source].test(masked) ? 1 : 0.8;
  return matchedWords > 0 && coverage >= threshold ? output : null;
}

export function isProtectedWhole(text, extraValues = []) {
  const trimmed = text.trim();
  if (!trimmed || !/[\p{L}]/u.test(trimmed)) return true;
  if (extraValues.some((value) => String(value).trim() === trimmed)) return true;
  if (NAME_PATTERN.test(trimmed) && !GREETING_PATTERN.test(trimmed)) return true;
  if (OPAQUE_CODE_PATTERN.test(trimmed)) return true;
  const { masked, values } = maskSensitive(trimmed, extraValues);
  return values.length > 0 && !/[\p{L}]/u.test(masked.replace(/⟪KORA_\d+⟫/g, ""));
}

export function translateText(text, options = {}) {
  const { sourceHint = "auto", protectedValues = [] } = options;
  const original = String(text ?? "");
  const key = normalizeText(original);
  if (!key || protectedValues.some((value) => normalizeText(value) === key)) {
    return { text: original, source: null, method: "protected", changed: false };
  }

  const source = detectSource(original, sourceHint);
  const memory = source === "en" ? EN_TO_FUB : FR_TO_FUB;
  const generalMemory = source === "en" ? GENERAL_EN_TO_FUB : GENERAL_FR_TO_FUB;
  const exact = memory[key] ?? generalMemory[key];
  if (exact) {
    const translated = preserveOuterWhitespace(original, exact);
    if (!preservesSensitive(original, translated, protectedValues)) {
      return { text: original, source, method: "integrity-fallback", changed: false };
    }
    return {
      text: translated,
      source,
      method: "memory",
      fluency: scoreFubFluency(translated),
      changed: normalizeText(translated) !== key
    };
  }
  if (isProtectedWhole(original, protectedValues)) {
    return { text: original, source: null, method: "protected", changed: false };
  }

  const { masked, values } = maskSensitive(original, protectedValues);
  const templated = applyTemplates(masked, source);
  const composed = templated ?? applyGlossary(masked, source);
  if (!composed) return { text: original, source, method: "original", changed: false };

  const restored = preserveOuterWhitespace(original, restoreSensitive(composed, values));
  if (!preservesSensitive(original, restored, protectedValues)) {
    return { text: original, source, method: "integrity-fallback", changed: false };
  }
  return {
    text: restored,
    source,
    method: templated ? "template" : "glossary",
    fluency: scoreFubFluency(restored),
    changed: normalizeText(restored) !== key
  };
}
