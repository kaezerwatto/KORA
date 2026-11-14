import { translateText } from "../src/engine.js";
import {
  FUB_MODEL_META,
  predictNextFub,
  scoreFubFluency
} from "../src/language-model.js";

const contexts = process.argv.slice(2);
const prompts = contexts.length
  ? contexts
  : ["o", "mi ɗon", "transfeer maa", "kaalisi", "jaɓoowo"];

console.log("KORA FUB language model");
console.log(FUB_MODEL_META);
for (const context of prompts) {
  console.log(`\n${context} →`, predictNextFub(context, 5));
}

const evaluation = [
  ["fr", "Accueil"],
  ["en", "Home"],
  ["fr", "Développement des langues"],
  ["en", "New chat"],
  ["fr", "Votre paiement de 25 000 FCFA a été refusé."],
  ["en", "You received 12,500 FCFA."],
  ["fr", "Le transfert n'a pas échoué."]
];

console.log("\nTranslation safety samples");
for (const [sourceHint, source] of evaluation) {
  const result = translateText(source, { sourceHint });
  console.log({
    source,
    output: result.text,
    method: result.method,
    fluency: result.changed ? scoreFubFluency(result.text) : null
  });
}
