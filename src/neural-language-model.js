import {
  FUB_NEURAL_META,
  FUB_NEURAL_VOCAB,
  FUB_NEURAL_WEIGHTS,
} from "./fub-neural-model.js";

const SPECIAL_TOKENS = new Set(["<pad>", "<unk>", "<s>", "</s>"]);
const wordToId = new Map(FUB_NEURAL_VOCAB.map((word, index) => [word, index]));
let decodedWeights = null;

function decodeBase64(value) {
  if (typeof atob === "function") {
    const binary = atob(value);
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  }
  return Uint8Array.from(globalThis.Buffer.from(value, "base64"));
}

function decodeTensor(tensor) {
  const bytes = decodeBase64(tensor.data);
  if (tensor.dtype === "int8") {
    return {
      values: new Int8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength),
      scale: tensor.scale,
      shape: tensor.shape,
    };
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const values = new Float32Array(bytes.byteLength / 4);
  for (let index = 0; index < values.length; index += 1) {
    values[index] = view.getFloat32(index * 4, true);
  }
  return { values, scale: 1, shape: tensor.shape };
}

function weights() {
  if (!decodedWeights) {
    decodedWeights = Object.fromEntries(
      Object.entries(FUB_NEURAL_WEIGHTS).map(([name, tensor]) => [name, decodeTensor(tensor)]),
    );
  }
  return decodedWeights;
}

function tokenize(text) {
  return String(text ?? "")
    .normalize("NFC")
    .toLocaleLowerCase("fub")
    .match(/[\p{L}\p{M}]+(?:['’][\p{L}\p{M}]+)*/gu) ?? [];
}

function idFor(word) {
  return wordToId.get(word) ?? wordToId.get("<unk>");
}

function infer(contextWords) {
  const model = weights();
  const embeddingSize = FUB_NEURAL_META.embeddingSize;
  const hiddenSize = FUB_NEURAL_META.hiddenSize;
  const contextSize = FUB_NEURAL_META.contextSize ?? 2;
  const vocabularySize = FUB_NEURAL_VOCAB.length;
  const start = "<s>";
  const context = [...Array(contextSize).fill(start), ...contextWords]
    .slice(-contextSize)
    .map(idFor);
  const input = new Float32Array(embeddingSize * contextSize);

  for (let slot = 0; slot < contextSize; slot += 1) {
    const offset = context[slot] * embeddingSize;
    for (let index = 0; index < embeddingSize; index += 1) {
      input[slot * embeddingSize + index] =
        model.embedding.values[offset + index] * model.embedding.scale;
    }
  }

  const hidden = new Float32Array(hiddenSize);
  const hiddenWidth = embeddingSize * contextSize;
  for (let row = 0; row < hiddenSize; row += 1) {
    let value = model.hiddenBias.values[row];
    const rowOffset = row * hiddenWidth;
    for (let column = 0; column < hiddenWidth; column += 1) {
      value +=
        model.hiddenWeight.values[rowOffset + column] *
        model.hiddenWeight.scale *
        input[column];
    }
    hidden[row] = Math.tanh(value);
  }

  const logits = new Float32Array(vocabularySize);
  for (let row = 0; row < vocabularySize; row += 1) {
    let value = model.outputBias.values[row];
    const rowOffset = row * hiddenSize;
    for (let column = 0; column < hiddenSize; column += 1) {
      value +=
        model.outputWeight.values[rowOffset + column] *
        model.outputWeight.scale *
        hidden[column];
    }
    logits[row] = value;
  }
  return logits;
}

function distribution(logits) {
  let maximum = Number.NEGATIVE_INFINITY;
  for (const value of logits) maximum = Math.max(maximum, value);
  let denominator = 0;
  for (const value of logits) denominator += Math.exp(value - maximum);
  return { maximum, denominator };
}

export function predictNextNeuralFub(context, limit = 5) {
  const contextWords = Array.isArray(context) ? context.flatMap(tokenize) : tokenize(context);
  const logits = infer(contextWords);
  const { maximum, denominator } = distribution(logits);
  return Array.from(logits, (logit, index) => ({
    word: FUB_NEURAL_VOCAB[index],
    probability: Math.exp(logit - maximum) / denominator,
  }))
    .filter(({ word }) => !SPECIAL_TOKENS.has(word))
    .sort((left, right) => right.probability - left.probability)
    .slice(0, Math.max(1, limit));
}

export function scoreNeuralFub(text) {
  const words = tokenize(text);
  if (!words.length) return 0;
  const knownRatio =
    words.filter((word) => wordToId.has(word)).length / words.length;
  const sequence = [...words, "</s>"];
  const context = Array(FUB_NEURAL_META.contextSize ?? 2).fill("<s>");
  let logProbability = 0;

  for (const word of sequence) {
    const logits = infer(context);
    const { maximum, denominator } = distribution(logits);
    const target = idFor(word);
    logProbability += logits[target] - maximum - Math.log(denominator);
    context.push(word);
  }

  const lexicalPenalty = (0.02 + 0.98 * knownRatio) ** 2;
  return Math.exp(logProbability / sequence.length) * lexicalPenalty;
}

export { FUB_NEURAL_META };
