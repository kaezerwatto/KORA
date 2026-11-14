import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { FUB_NEURAL_META } from "../src/fub-neural-model.js";

test("exports a portable and verifiable quantized model", async () => {
  const artifact = JSON.parse(
    await readFile(new URL("../release/kora-fub-neural-model.json", import.meta.url), "utf8")
  );
  const { sha256, ...payload } = artifact;
  const calculated = createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex");

  assert.equal(artifact.format, "kora-fub-neural-int8");
  assert.equal(artifact.language, "fub");
  assert.deepEqual(artifact.metadata, FUB_NEURAL_META);
  assert.equal(artifact.vocabulary.length, FUB_NEURAL_META.vocabulary);
  assert.equal(artifact.tensors.embedding.dtype, "int8");
  assert.equal(artifact.tensors.outputWeight.dtype, "int8");
  assert.equal(sha256, calculated);
});
