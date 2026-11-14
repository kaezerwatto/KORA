import assert from "node:assert/strict";
import test from "node:test";
import {
  CORPUS_EN_TO_FUB,
  CORPUS_FR_TO_FUB,
  CORPUS_PRESERVED_TERMS
} from "../src/corpus-translations.js";
import { translateText } from "../src/engine.js";
import {
  GENERAL_EN_TO_FUB,
  GENERAL_FR_TO_FUB
} from "../src/general-translations.js";
import { findSpellingMatch } from "../src/spelling.js";
import { EN_TO_FUB, FR_TO_FUB } from "../src/translations.js";

function spellingVariants(value) {
  const characters = [...value];
  const letterIndexes = characters
    .map((character, index) => /\p{L}/u.test(character) ? index : -1)
    .filter((index) => index >= 0);
  const variants = [];
  for (const index of letterIndexes) {
    if (index > 0) {
      variants.push(
        [...characters.slice(0, index), characters[index], ...characters.slice(index)].join("")
      );
      variants.push(
        [...characters.slice(0, index), ...characters.slice(index + 1)].join("")
      );
    }
    const next = index + 1;
    if (
      next < characters.length &&
      /\p{L}/u.test(characters[next]) &&
      characters[index] !== characters[next]
    ) {
      const swapped = [...characters];
      [swapped[index], swapped[next]] = [swapped[next], swapped[index]];
      variants.push(swapped.join(""));
    }
  }
  return [...new Set(variants)].filter((variant) => variant !== value);
}

const directions = [
  {
    sourceHint: "fr",
    memories: [FR_TO_FUB, GENERAL_FR_TO_FUB, CORPUS_FR_TO_FUB]
  },
  {
    sourceHint: "en",
    memories: [EN_TO_FUB, GENERAL_EN_TO_FUB, CORPUS_EN_TO_FUB]
  }
];

test("recovers a generated spelling error for every eligible FR/EN memory entry", () => {
  let checked = 0;
  const failures = [];
  for (const { sourceHint, memories } of directions) {
    const sources = new Set(memories.flatMap((memory) => Object.keys(memory)));
    for (const source of sources) {
      if (/\d/u.test(source) || (source.match(/\p{L}/gu)?.length ?? 0) < 3) continue;
      const exact = translateText(source, {
        sourceHint,
        domainHint: "financial"
      });
      if (!exact.changed) continue;
      const recovered = spellingVariants(source).some((variant) => {
        const result = translateText(variant, {
          sourceHint,
          domainHint: "financial"
        });
        return result.text === exact.text && result.method === "spelling-memory";
      });
      checked += 1;
      if (!recovered) failures.push(`${sourceHint}: ${source}`);
    }
  }
  assert.ok(checked > 900, `expected broad memory coverage, received ${checked}`);
  assert.deepEqual(failures, []);
});

test("supports bounded multi-error recovery and abstains on ambiguity", () => {
  assert.deepEqual(
    findSpellingMatch(
      "cot",
      [{ cat: "A", cut: "B" }],
      "ambiguous-test"
    ),
    null
  );
  assert.equal(
    translateText("sodle insufisant", {
      sourceHint: "fr",
      domainHint: "financial"
    }).text,
    "Kaalisi yonaa"
  );
  assert.equal(
    translateText("insuficient balnce", {
      sourceHint: "en",
      domainHint: "financial"
    }).text,
    "Kaalisi yonaa"
  );
  assert.equal(
    translateText("customer pineapple", {
      sourceHint: "auto",
      domainHint: "general"
    }).text,
    "customer pineapple"
  );
});

test("never repairs or translates protected technical codes", () => {
  for (const code of ["HTTP 503", "transaction.failed", "SUCCESS"]) {
    assert.ok(CORPUS_PRESERVED_TERMS.has(code), code);
    assert.equal(
      translateText(code, {
        sourceHint: "auto",
        domainHint: "financial"
      }).text,
      code
    );
  }
  assert.equal(
    translateText("NETWORK_001", {
      sourceHint: "auto",
      domainHint: "financial"
    }).text,
    "NETWORK_001"
  );
});
