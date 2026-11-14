import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  detectSource,
  maskSensitive,
  preservesSensitive,
  restoreSensitive,
  translateText
} from "../src/engine.js";

const sourcePairs = JSON.parse(
  await readFile(new URL("../scripts/source-texts.json", import.meta.url), "utf8")
);

test("detects both source languages", () => {
  assert.equal(detectSource("Vérifiez les frais avant de confirmer."), "fr");
  assert.equal(detectSource("Check the fees before confirming."), "en");
});

test("translates exact French and English strings to the same fub output", () => {
  const fr = translateText("Confirmer le transfert");
  const en = translateText("Confirm transfer");
  assert.equal(fr.text, "Tabitin transfeer");
  assert.equal(en.text, fr.text);
  assert.equal(fr.method, "memory");
  assert.equal(en.method, "memory");
});

test("never changes canonical financial values", () => {
  const protectedCases = [
    "250 000 FCFA",
    "-12 500 FCFA",
    "+237 6 99 12 34 56",
    "CM 001 2345 6789 01",
    "SAF-2026-LCIFIB",
    "DSAFDF",
    "05 nov. 2026",
    "Jean-Paul Mbarga",
    "Amina Ngo Bell"
  ];
  for (const value of protectedCases) {
    const result = translateText(value);
    assert.equal(result.text, value);
    assert.equal(result.changed, false);
  }
});

test("preserves surrounding whitespace and all values in exact translations", () => {
  const original = "  Frais de 1,5 % (min. 100 FCFA, max. 2 500 FCFA)  ";
  const result = translateText(original);
  assert.ok(result.text.startsWith("  "));
  assert.ok(result.text.endsWith("  "));
  for (const value of ["1,5 %", "100 FCFA", "2 500 FCFA"]) {
    assert.ok(result.text.includes(value), value);
  }
});

test("masks and restores mixed financial values byte-for-byte", () => {
  const original = "Votre transfert de 25 000 FCFA est en attente.";
  const { masked, values } = maskSensitive(original);
  assert.match(masked, /KORA_0/);
  assert.equal(restoreSensitive(masked, values), original);
  const result = translateText(original);
  assert.equal(result.text, "Transfeer maa 25 000 FCFA ɗon e fadde.");
  assert.equal(preservesSensitive(original, result.text), true);
  assert.equal(
    preservesSensitive("Montant : 25 000 FCFA", "Jate kaalisi: 25 000 FCFA 25 000 FCFA"),
    false
  );
});

test("preserves user-entered values wherever they are rendered", () => {
  const protectedValues = ["DSAFDF", "Jean-Paul Mbarga", "Paiement spécial"];
  for (const value of protectedValues) {
    assert.equal(translateText(value, { protectedValues }).text, value);
  }
});

test("translates greetings while preserving arbitrary names without hardcoding", async () => {
  const cases = [
    ["Bonjour, Mariama Bello", "fr", "Sannu, Mariama Bello"],
    ["Bonjour Moussa", "fr", "Sannu, Moussa"],
    ["Hello, Fatou Ndiaye", "en", "Sannu, Fatou Ndiaye"],
    ["Hello Oumar", "en", "Sannu, Oumar"]
  ];
  for (const [input, sourceHint, expected] of cases) {
    const result = translateText(input, { sourceHint });
    assert.equal(result.text, expected);
    assert.equal(result.method, "template");
  }
  const runtimeSources = await Promise.all([
    readFile(new URL("../src/translations.js", import.meta.url), "utf8"),
    readFile(new URL("../src/content.js", import.meta.url), "utf8")
  ]);
  assert.doesNotMatch(runtimeSources.join("\n"), /\b(?:Amina|Jean-Paul Mbarga)\b/u);
});

test("supports compositional fallback for unseen banking content", () => {
  const result = translateText("Erreur de transfert", { sourceHint: "fr" });
  assert.equal(result.changed, true);
  assert.match(result.text, /juumre/i);
  assert.match(result.text, /transfeer/i);
  assert.equal(result.method, "glossary");
});

test("uses Adamawa fub forms from linguistic review", async () => {
  assert.equal(translateText("Solde insuffisant").text, "Kaalisi yonaa");
  assert.equal(translateText("Payment for services").text, "Yoɓugo golle");
  assert.equal(
    translateText("Vous devez confirmer les informations avant de valider le transfert.").text,
    "A foti tabitingo humpito hade maa jaɓugo transfeer."
  );
  const catalogue = await readFile(new URL("../src/translations.js", import.meta.url), "utf8");
  assert.doesNotMatch(catalogue, /\b(?:yonay|tabitinde|huutoreede|yoɓde)\b/iu);
});

test("covers common financial and web intents beyond Safinum", () => {
  const pairs = [
    ["Mot de passe oublié ?", "Forgot password?"],
    ["Historique des transactions", "Transaction history"],
    ["Déposer de l'argent", "Deposit money"],
    ["Retirer de l'argent", "Withdraw money"],
    ["Carte bloquée", "Card blocked"],
    ["Paiement refusé", "Payment declined"],
    ["Transaction en attente", "Transaction pending"],
    ["Fonds insuffisants", "Insufficient funds"],
    ["Politique de confidentialité", "Privacy policy"]
  ];
  for (const [fr, en] of pairs) {
    const frResult = translateText(fr, { sourceHint: "fr" });
    const enResult = translateText(en, { sourceHint: "en" });
    assert.equal(frResult.changed, true, fr);
    assert.equal(enResult.text, frResult.text, `${fr} / ${en}`);
  }
});

test("general templates preserve unexpected financial values byte-for-byte", () => {
  const pairs = [
    ["Vous avez reçu 13 725 FCFA.", "A jaɓii 13 725 FCFA."],
    ["Votre paiement de 8,500 FCFA a été refusé.", "Yoɓugol maa 8,500 FCFA salaama."],
    ["Le montant maximum est de 400 000 FCFA.", "Jate kaalisi ɓurɗo ɗuuɗugo ko 400 000 FCFA."]
  ];
  for (const [input, expected] of pairs) {
    const result = translateText(input, { sourceHint: "fr" });
    assert.equal(result.text, expected);
    assert.equal(preservesSensitive(input, result.text), true);
  }
});

test("keeps low-confidence unknown prose unchanged instead of inventing meaning", () => {
  const original = "Erreur mystérieuse de transfert international";
  const result = translateText(original, { sourceHint: "fr" });
  assert.equal(result.text, original);
  assert.equal(result.method, "original");
});

test("requires complete coverage for unknown critical financial meaning", () => {
  const cases = [
    ["Carte bloquée : contactez immédiatement votre agence.", "fr"],
    ["Le transfert n'a pas échoué.", "fr"],
    ["The amount was not debited.", "en"],
    ["Payment reversed for an unknown compliance reason.", "en"]
  ];
  for (const [original, sourceHint] of cases) {
    const result = translateText(original, { sourceHint });
    assert.equal(result.text, original);
    assert.equal(result.method, "original");
  }
});

test("covers all seven public Safinum errors in both source languages", () => {
  const pairs = [
    ["Le montant doit être supérieur à zéro.", "The amount must be greater than zero."],
    ["Solde insuffisant pour effectuer ce transfert.", "Insufficient balance for this transfer."],
    ["Veuillez renseigner le nom et le numéro du bénéficiaire.", "Please provide the beneficiary name and phone number."],
    ["Alerte de sécurité : vérifiez le numéro du bénéficiaire avant de continuer.", "Security warning: verify the beneficiary phone number before continuing."],
    ["Alerte de sécurité : ce bénéficiaire n'a jamais été utilisé sur ce compte.", "Security warning: this beneficiary has never been used on this account."],
    ["Erreur réseau : le service est temporairement indisponible. Réessayez.", "Network error: the service is temporarily unavailable. Please try again."],
    ["Vous devez confirmer les informations avant de valider le transfert.", "You must confirm the details before validating the transfer."]
  ];
  for (const [fr, en] of pairs) {
    const frResult = translateText(fr);
    const enResult = translateText(en);
    assert.equal(frResult.changed, true, fr);
    assert.equal(enResult.changed, true, en);
    assert.equal(frResult.text, enResult.text);
  }
});

test("covers the complete bilingual Safinum and financial message catalogue", () => {
  for (const [fr, en] of sourcePairs) {
    const frResult = translateText(fr, { sourceHint: "fr" });
    const enResult = translateText(en, { sourceHint: "en" });
    if (fr !== en) {
      assert.equal(frResult.changed, true, `Missing FR: ${fr}`);
      assert.equal(enResult.changed, true, `Missing EN: ${en}`);
    }
    if (!/\d/.test(fr + en)) {
      assert.equal(frResult.text, enResult.text, `Direction mismatch: ${fr} / ${en}`);
    }
  }
});
