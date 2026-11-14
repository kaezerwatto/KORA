import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { translateText } from "../src/engine.js";
import { normalizeText } from "../src/engine.js";
import { CORPUS_TRANSLATION_META } from "../src/corpus-translations.js";

const inventory = JSON.parse(
  await readFile(new URL("../data/corpora/index.json", import.meta.url), "utf8")
);
const terminology = JSON.parse(
  await readFile(
    new URL("../data/corpora/financial-terminology-candidates.json", import.meta.url),
    "utf8"
  )
);

const expectedLabels = new Set(
  inventory.sources.flatMap((source) => source.termLabels.map(normalizeText))
);
const actualLabels = new Set(terminology.entries.map((entry) => normalizeText(entry.fr)));
const allowedStatuses = new Set([
  "attested",
  "reviewed-existing",
  "compositional-candidate",
  "local-loan-candidate",
  "preserved-code"
]);

test("imports every deduplicated financial corpus label with explicit provenance", () => {
  assert.deepEqual(actualLabels, expectedLabels);
  assert.equal(terminology.entries.length, expectedLabels.size);
  assert.equal(CORPUS_TRANSLATION_META.entries, expectedLabels.size);
  for (const entry of terminology.entries) {
    assert.ok(entry.fr?.trim(), "French key required");
    assert.ok(entry.en?.trim(), `English key required for ${entry.fr}`);
    assert.ok(entry.fub?.trim(), `fub value required for ${entry.fr}`);
    assert.ok(allowedStatuses.has(entry.status), `${entry.fr}: ${entry.status}`);
    assert.ok(Array.isArray(entry.sources), entry.fr);
    if (["attested", "reviewed-existing"].includes(entry.status)) {
      assert.ok(entry.sources.length > 0, entry.fr);
    }
    assert.ok(Array.isArray(entry.corpus) && entry.corpus.length > 0, entry.fr);
  }
});

test("translates every imported French and English term in financial context", () => {
  for (const entry of terminology.entries) {
    for (const [source, sourceHint] of [
      [entry.fr, "fr"],
      [entry.en, "en"]
    ]) {
      const result = translateText(source, {
        sourceHint,
        domainHint: "financial"
      });
      const expected = entry.status === "preserved-code" ? source : entry.fub;
      assert.equal(result.text, expected, `${sourceHint}: ${source}`);
      assert.equal(
        result.changed,
        entry.status === "preserved-code"
          ? false
          : normalizeText(source) !== normalizeText(entry.fub),
        `${sourceHint}: ${source}`
      );
    }
  }
});

test("does not apply ambiguous corpus-only terms outside a financial page", () => {
  const ambiguous = terminology.entries.find(
    (entry) => normalizeText(entry.fr) === "action"
  );
  assert.ok(ambiguous, "The financial corpus should contain Action");
  assert.equal(
    translateText("Action", { sourceHint: "fr", domainHint: "general" }).text,
    "Action"
  );
});
