import { createHash } from "node:crypto";
import { mkdir, stat, writeFile } from "node:fs/promises";
import {
  FUB_NEURAL_META,
  FUB_NEURAL_VOCAB,
  FUB_NEURAL_WEIGHTS
} from "../src/fub-neural-model.js";

const output = "release/kora-fub-neural-model.json";
const payload = {
  format: "kora-fub-neural-int8",
  task: "next-word prediction and safe-candidate fluency ranking",
  language: "fub",
  license: "MIT; training sentences: Common Voice CC0 and KORA reviewed memory",
  metadata: FUB_NEURAL_META,
  vocabulary: FUB_NEURAL_VOCAB,
  tensors: FUB_NEURAL_WEIGHTS
};
const canonical = JSON.stringify(payload);
const sha256 = createHash("sha256").update(canonical).digest("hex");
const artifact = JSON.stringify({ ...payload, sha256 });

await mkdir("release", { recursive: true });
await writeFile(output, `${artifact}\n`, "utf8");
const { size } = await stat(output);
console.log(`Exported ${output}: ${(size / 1024).toFixed(1)} KiB, sha256 ${sha256}`);
