const INDEX_CACHE = new WeakMap();
const RESULT_CACHE = new Map();
const MAX_RESULT_CACHE = 4_000;

export function normalizeSpelling(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/\p{M}+/gu, "")
    .replace(/[’‘ʼ`´]/gu, "'")
    .toLocaleLowerCase("fr")
    .replace(/[^\p{L}'-]+/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
}

function editBudget(value) {
  const length = [...value.replace(/[ '-]/gu, "")].length;
  if (length < 3) return 0;
  if (length < 12) return 1;
  if (length < 24) return 2;
  if (length < 40) return 3;
  return 4;
}

function damerauLevenshtein(left, right, maximum) {
  const a = [...left];
  const b = [...right];
  if (Math.abs(a.length - b.length) > maximum) return maximum + 1;

  const matrix = Array.from({ length: a.length + 1 }, () => {
    const row = new Uint16Array(b.length + 1);
    row.fill(maximum + 1);
    return row;
  });
  for (let row = 0; row <= a.length; row += 1) matrix[row][0] = row;
  for (let column = 0; column <= b.length; column += 1) {
    matrix[0][column] = column;
  }

  for (let row = 1; row <= a.length; row += 1) {
    const from = Math.max(1, row - maximum);
    const to = Math.min(b.length, row + maximum);
    for (let column = from; column <= to; column += 1) {
      const substitution = a[row - 1] === b[column - 1] ? 0 : 1;
      let distance = Math.min(
        matrix[row - 1][column] + 1,
        matrix[row][column - 1] + 1,
        matrix[row - 1][column - 1] + substitution
      );
      if (
        row > 1 &&
        column > 1 &&
        a[row - 1] === b[column - 2] &&
        a[row - 2] === b[column - 1]
      ) {
        distance = Math.min(distance, matrix[row - 2][column - 2] + 1);
      }
      matrix[row][column] = distance;
    }
  }
  return matrix[a.length][b.length];
}

function memoryIndex(memory) {
  let index = INDEX_CACHE.get(memory);
  if (index) return index;

  index = new Map();
  for (const [source, translation] of Object.entries(memory)) {
    const spelling = normalizeSpelling(source);
    if (!spelling) continue;
    const length = [...spelling].length;
    const bucket = index.get(length) ?? [];
    bucket.push({
      source,
      spelling,
      translation,
      words: spelling.split(" ").length
    });
    index.set(length, bucket);
  }
  INDEX_CACHE.set(memory, index);
  return index;
}

function cacheResult(cacheKey, result) {
  if (RESULT_CACHE.size >= MAX_RESULT_CACHE) {
    RESULT_CACHE.delete(RESULT_CACHE.keys().next().value);
  }
  RESULT_CACHE.set(cacheKey, result);
  return result;
}

export function findSpellingMatch(value, memories, namespace) {
  const spelling = normalizeSpelling(value);
  const cacheKey = `${namespace}:${spelling}`;
  if (RESULT_CACHE.has(cacheKey)) return RESULT_CACHE.get(cacheKey);
  if (
    !spelling ||
    /[\d⟪⟫]/u.test(String(value)) ||
    /[\u0000-\u001F\u007F]/u.test(String(value))
  ) {
    return cacheResult(cacheKey, null);
  }

  const maximum = editBudget(spelling);
  const length = [...spelling].length;
  const wordCount = spelling.split(" ").length;
  const matches = [];

  for (const memory of memories) {
    const index = memoryIndex(memory);
    for (let candidateLength = length - maximum; candidateLength <= length + maximum; candidateLength += 1) {
      for (const candidate of index.get(candidateLength) ?? []) {
        if (Math.abs(candidate.words - wordCount) > (maximum >= 3 ? 1 : 0)) continue;
        const distance = damerauLevenshtein(spelling, candidate.spelling, maximum);
        if (distance <= maximum) matches.push({ ...candidate, distance });
      }
    }
  }
  if (!matches.length) return cacheResult(cacheKey, null);

  matches.sort(
    (left, right) =>
      left.distance - right.distance ||
      Math.abs(left.spelling.length - spelling.length) -
        Math.abs(right.spelling.length - spelling.length) ||
      left.source.localeCompare(right.source)
  );
  const bestDistance = matches[0].distance;
  const best = matches.filter(({ distance }) => distance === bestDistance);
  const bestTranslations = new Set(best.map(({ translation }) => translation));
  if (bestTranslations.size !== 1) return cacheResult(cacheKey, null);

  const selectedTranslation = best[0].translation;
  const competing = matches.find(
    ({ translation }) => translation !== selectedTranslation
  );
  if (competing && competing.distance <= bestDistance) {
    return cacheResult(cacheKey, null);
  }

  return cacheResult(cacheKey, {
    key: best[0].source,
    translation: selectedTranslation,
    distance: bestDistance,
    normalized: spelling
  });
}
