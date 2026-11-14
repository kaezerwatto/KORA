import {
  FUB_MODEL_META,
  FUB_TRANSITIONS,
  FUB_UNIGRAMS
} from "./fub-language-model.js";
import {
  FUB_NEURAL_META,
  predictNextNeuralFub,
  scoreNeuralFub
} from "./neural-language-model.js";

const unigramCounts = new Map(FUB_UNIGRAMS);
const unigramTotal = FUB_UNIGRAMS.reduce((total, [, count]) => total + count, 0);
const vocabularySize = Math.max(1, FUB_UNIGRAMS.length);
const fluencyCache = new Map();

function tokenizeFub(text) {
  return String(text ?? "")
    .normalize("NFKC")
    .toLocaleLowerCase("ff")
    .replace(/[’ʼ]/g, "'")
    .match(/[\p{L}]+(?:['-][\p{L}]+)*/gu) ?? [];
}

function contextDistribution(context) {
  const entries = FUB_TRANSITIONS[context];
  if (!entries) return null;
  const total = entries.reduce((sum, [, count]) => sum + count, 0);
  return { entries, total };
}

function addDistribution(scores, distribution, weight) {
  if (!distribution) return;
  for (const [word, count] of distribution.entries) {
    if (word === "</s>") continue;
    scores.set(word, (scores.get(word) ?? 0) + weight * (count / distribution.total));
  }
}

function predictNextNgramFub(context, limit = 5) {
  const tokens = ["<s>", "<s>", ...tokenizeFub(context)];
  const last = tokens.at(-1);
  const previous = tokens.at(-2);
  const scores = new Map();
  addDistribution(scores, contextDistribution(`2:${previous} ${last}`), 0.72);
  addDistribution(scores, contextDistribution(`1:${last}`), 0.23);

  for (const [word, count] of FUB_UNIGRAMS.slice(0, 80)) {
    scores.set(word, (scores.get(word) ?? 0) + 0.05 * (count / unigramTotal));
  }

  const ranked = [...scores.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ff"))
    .slice(0, Math.max(1, limit));
  const total = ranked.reduce((sum, [, score]) => sum + score, 0) || 1;
  return ranked.map(([word, score]) => ({
    word,
    probability: Math.round((score / total) * 10_000) / 10_000
  }));
}

export function predictNextFub(context, limit = 5) {
  const scores = new Map();
  for (const prediction of predictNextNeuralFub(context, Math.max(12, limit))) {
    scores.set(prediction.word, 0.85 * prediction.probability);
  }
  for (const prediction of predictNextNgramFub(context, Math.max(12, limit))) {
    scores.set(
      prediction.word,
      (scores.get(prediction.word) ?? 0) + 0.15 * prediction.probability
    );
  }
  const ranked = [...scores.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0], "ff"))
    .slice(0, Math.max(1, limit));
  const total = ranked.reduce((sum, [, score]) => sum + score, 0) || 1;
  return ranked.map(([word, score]) => ({
    word,
    probability: Math.round((score / total) * 10_000) / 10_000
  }));
}

function probabilityFor(tokens, index) {
  const word = tokens[index];
  const last = tokens[index - 1];
  const previous = tokens[index - 2];
  const trigram = contextDistribution(`2:${previous} ${last}`);
  const bigram = contextDistribution(`1:${last}`);
  const unigram = (unigramCounts.get(word) ?? 0.25) / (unigramTotal + vocabularySize);

  const probabilityIn = (distribution) => {
    if (!distribution) return 0;
    const match = distribution.entries.find(([candidate]) => candidate === word);
    return match ? match[1] / distribution.total : 0;
  };

  return Math.max(
    1e-7,
    0.72 * probabilityIn(trigram) +
      0.23 * probabilityIn(bigram) +
      0.05 * unigram
  );
}

function scoreNgramFubFluency(text) {
  const words = tokenizeFub(text);
  if (!words.length) return 0;
  const tokens = ["<s>", "<s>", ...words, "</s>"];
  let logProbability = 0;
  for (let index = 2; index < tokens.length; index += 1) {
    logProbability += Math.log(probabilityFor(tokens, index));
  }
  const geometricMean = Math.exp(logProbability / (tokens.length - 2));
  return Math.round(geometricMean * 1_000_000) / 1_000_000;
}

export function scoreFubFluency(text) {
  const cacheKey = String(text ?? "").normalize("NFC");
  if (fluencyCache.has(cacheKey)) return fluencyCache.get(cacheKey);
  const neural = Math.max(1e-9, scoreNeuralFub(text));
  const ngram = Math.max(1e-9, scoreNgramFubFluency(text));
  const score =
    Math.round(Math.exp(0.8 * Math.log(neural) + 0.2 * Math.log(ngram)) * 1e6) / 1e6;
  if (fluencyCache.size >= 1_000) fluencyCache.delete(fluencyCache.keys().next().value);
  fluencyCache.set(cacheKey, score);
  return score;
}

export function rankFubCandidates(candidates) {
  return [...new Set(candidates)]
    .map((text) => ({ text, fluency: scoreFubFluency(text) }))
    .sort((a, b) => b.fluency - a.fluency || a.text.localeCompare(b.text, "ff"));
}

export { FUB_MODEL_META, FUB_NEURAL_META };
