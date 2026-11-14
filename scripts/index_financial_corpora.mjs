import { createHash } from "node:crypto";
import { readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const corpusDirectory = path.join(root, "data/corpora");
const sources = [
  {
    file: "corpus_terminologique_financier_volume_1.txt",
    kind: "terminology",
    trainingPolicy: "source inventory only; requires reviewed fub translation"
  },
  {
    file: "corpus_finance_transactionnelle_volume_2.txt",
    kind: "transactional",
    trainingPolicy:
      "defined terms and curated examples only; contradictory synthetic matrix excluded"
  }
];

function normalizedLines(content) {
  return content.replace(/\r\n?/g, "\n").split("\n");
}

function nextNonEmpty(lines, start) {
  for (let index = start; index < lines.length; index += 1) {
    if (lines[index].trim()) return lines[index].trim();
  }
  return "";
}

function termLabels(lines) {
  const labels = [];
  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(/^\s*\d+\.\s+(.+?)\s*$/u);
    if (!match) continue;
    if (!nextNonEmpty(lines, index + 1).startsWith("Définition :")) continue;
    labels.push(match[1].trim());
  }
  return labels;
}

function sections(lines) {
  const values = [];
  for (let index = 1; index < lines.length - 1; index += 1) {
    if (!/^#{5,}$/u.test(lines[index - 1].trim())) continue;
    if (!/^#{5,}$/u.test(lines[index + 1].trim())) continue;
    const value = lines[index].replace(/^\s*\d+\.\s*/u, "").trim();
    if (value) values.push(value);
  }
  return values;
}

function curatedExamples(lines) {
  const syntheticStart = lines.findIndex((line) =>
    line.includes("BANQUE ÉTENDUE DE PHRASES SYNTHÉTIQUES")
  );
  const limit = syntheticStart === -1 ? lines.length : syntheticStart;
  return lines.slice(0, limit).filter((line) => /^\s*-\s+\S/u.test(line)).length;
}

function syntheticRows(lines) {
  const syntheticStart = lines.findIndex((line) =>
    line.includes("BANQUE ÉTENDUE DE PHRASES SYNTHÉTIQUES")
  );
  if (syntheticStart === -1) return 0;
  return lines
    .slice(syntheticStart + 1)
    .filter((line) => /^\s*\d{3}\.\s+\S/u.test(line)).length;
}

const inventory = {
  format: "kora-financial-corpus-inventory-v2",
  generatedBy: "scripts/index_financial_corpora.mjs",
  license: "not specified in supplied files",
  runtimeBundled: false,
  sources: []
};

for (const source of sources) {
  const absolute = path.join(corpusDirectory, source.file);
  const content = await readFile(absolute, "utf8");
  const lines = normalizedLines(content);
  const { size } = await stat(absolute);
  const labels = termLabels(lines);
  inventory.sources.push({
    kind: source.kind,
    language: "fr",
    parallelFubTranslations: false,
    lines: lines.at(-1) === "" ? lines.length - 1 : lines.length,
    terms: labels.length,
    examples: curatedExamples(lines),
    sections: sections(lines),
    termLabels: labels,
    syntheticMatrixRowsExcludedFromTraining: syntheticRows(lines),
    trainingPolicy: source.trainingPolicy,
    file: source.file,
    bytes: size,
    sha256: createHash("sha256").update(content).digest("hex")
  });
}

await writeFile(
  path.join(corpusDirectory, "index.json"),
  `${JSON.stringify(inventory, null, 2)}\n`,
  "utf8"
);

for (const source of inventory.sources) {
  console.log(
    `${source.file}: ${source.terms} terms, ${source.examples} examples, ${source.lines} lines`
  );
}
