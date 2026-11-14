#!/usr/bin/env python3
"""Train and export KORA's tiny quantized neural next-word model."""

from __future__ import annotations

import base64
import csv
import json
import random
from pathlib import Path

import numpy as np
import torch
from torch import nn
from torch.utils.data import DataLoader, TensorDataset

from build_fub_language_model import (
    DEFAULT_INPUT,
    ROOT,
    reviewed_phrases,
    tokenize,
)

OUTPUT = ROOT / "src/fub-neural-model.js"
SEED = 2026
VOCAB_LIMIT = 1_024
EMBEDDING_SIZE = 12
HIDDEN_SIZE = 24
EPOCHS = 35
BATCH_SIZE = 256


class TinyContextModel(nn.Module):
    def __init__(self, vocabulary_size: int) -> None:
        super().__init__()
        self.embedding = nn.Embedding(vocabulary_size, EMBEDDING_SIZE)
        self.hidden = nn.Linear(EMBEDDING_SIZE * 2, HIDDEN_SIZE)
        self.output = nn.Linear(HIDDEN_SIZE, vocabulary_size)

    def forward(self, contexts: torch.Tensor) -> torch.Tensor:
        embedded = self.embedding(contexts).reshape(contexts.shape[0], -1)
        hidden = torch.tanh(self.hidden(embedded))
        return self.output(hidden)


def load_sentences() -> tuple[list[list[str]], list[list[str]]]:
    common_voice: list[list[str]] = []
    with DEFAULT_INPUT.open(encoding="utf-8", newline="") as stream:
        for row in csv.DictReader(stream, delimiter="\t"):
            tokens = tokenize(row.get("sentence", ""))
            if tokens:
                common_voice.append(tokens)
    reviewed: list[list[str]] = []
    for phrase in reviewed_phrases():
        tokens = tokenize(phrase)
        if tokens:
            reviewed.append(tokens)
    return common_voice, reviewed


def build_vocabulary(sentences: list[list[str]]) -> tuple[list[str], dict[str, int]]:
    frequencies: dict[str, int] = {}
    for sentence in sentences:
        for token in sentence:
            frequencies[token] = frequencies.get(token, 0) + 1
    words = sorted(frequencies, key=lambda word: (-frequencies[word], word))
    vocabulary = ["<pad>", "<unk>", "<s>", "</s>", *words[: VOCAB_LIMIT - 4]]
    return vocabulary, {word: index for index, word in enumerate(vocabulary)}


def examples(sentences: list[list[str]], word_to_id: dict[str, int]):
    contexts: list[list[int]] = []
    targets: list[int] = []
    unknown = word_to_id["<unk>"]
    start = word_to_id["<s>"]
    end = word_to_id["</s>"]
    for sentence in sentences:
        ids = [word_to_id.get(word, unknown) for word in sentence]
        padded = [start, start, *ids, end]
        for index in range(2, len(padded)):
            contexts.append([padded[index - 2], padded[index - 1]])
            targets.append(padded[index])
    return torch.tensor(contexts, dtype=torch.long), torch.tensor(targets, dtype=torch.long)


def quantized_tensor(tensor: torch.Tensor, dtype: str = "int8") -> dict:
    values = tensor.detach().cpu().numpy()
    if dtype == "float32":
        encoded = base64.b64encode(values.astype("<f4").tobytes()).decode("ascii")
        return {"dtype": "float32", "shape": list(values.shape), "data": encoded}
    maximum = float(np.max(np.abs(values))) or 1.0
    scale = maximum / 127.0
    quantized = np.clip(np.rint(values / scale), -127, 127).astype(np.int8)
    encoded = base64.b64encode(quantized.tobytes()).decode("ascii")
    return {
        "dtype": "int8",
        "shape": list(values.shape),
        "scale": scale,
        "data": encoded,
    }


def quantize_weights_in_place(model: nn.Module) -> None:
    """Apply the same symmetric int8 quantization used by the JS export."""
    with torch.no_grad():
        for name, parameter in model.named_parameters():
            if name.endswith("bias"):
                continue
            maximum = float(parameter.abs().max()) or 1.0
            scale = maximum / 127.0
            parameter.copy_(torch.clamp(torch.round(parameter / scale), -127, 127) * scale)


def main() -> None:
    random.seed(SEED)
    np.random.seed(SEED)
    torch.manual_seed(SEED)
    torch.set_num_threads(2)

    common_voice, reviewed = load_sentences()
    vocabulary, word_to_id = build_vocabulary([*common_voice, *reviewed])
    sentence_indices = list(range(len(common_voice)))
    random.shuffle(sentence_indices)
    split = int(len(sentence_indices) * 0.9)
    train_sentences = [common_voice[index] for index in sentence_indices[:split]]
    validation_sentences = [common_voice[index] for index in sentence_indices[split:]]
    # Reviewed product language receives extra training weight and is never
    # counted in the held-out Common Voice metrics.
    train_contexts, train_targets = examples([*train_sentences, *(reviewed * 4)], word_to_id)
    validation_contexts, validation_targets = examples(validation_sentences, word_to_id)
    train_data = TensorDataset(train_contexts, train_targets)

    model = TinyContextModel(len(vocabulary))
    optimizer = torch.optim.AdamW(model.parameters(), lr=0.012, weight_decay=1e-4)
    criterion = nn.CrossEntropyLoss()
    loader = DataLoader(train_data, batch_size=BATCH_SIZE, shuffle=True)

    model.train()
    for _epoch in range(EPOCHS):
        for batch_contexts, batch_targets in loader:
            optimizer.zero_grad(set_to_none=True)
            loss = criterion(model(batch_contexts), batch_targets)
            loss.backward()
            optimizer.step()

    quantize_weights_in_place(model)
    model.eval()
    with torch.no_grad():
        logits = model(validation_contexts)
        validation_loss = float(criterion(logits, validation_targets))
        top1 = float((logits.argmax(dim=1) == validation_targets).float().mean())
        top5 = float(
            (logits.topk(5, dim=1).indices == validation_targets[:, None])
            .any(dim=1)
            .float()
            .mean()
        )

    state = {
        "embedding": quantized_tensor(model.embedding.weight),
        "hiddenWeight": quantized_tensor(model.hidden.weight),
        "hiddenBias": quantized_tensor(model.hidden.bias, "float32"),
        "outputWeight": quantized_tensor(model.output.weight),
        "outputBias": quantized_tensor(model.output.bias, "float32"),
    }
    metadata = {
        "language": "fub",
        "kind": "quantized two-token neural language model",
        "commonVoiceSentences": len(common_voice),
        "reviewedPhrases": len(reviewed),
        "vocabulary": len(vocabulary),
        "embeddingSize": EMBEDDING_SIZE,
        "hiddenSize": HIDDEN_SIZE,
        "parameters": sum(parameter.numel() for parameter in model.parameters()),
        "epochs": EPOCHS,
        "validationExamples": len(validation_targets),
        "validationSentences": len(validation_sentences),
        "validationLoss": round(validation_loss, 4),
        "top1Accuracy": round(top1, 4),
        "top5Accuracy": round(top5, 4),
        "seed": SEED,
        "runtime": "custom JavaScript int8 inference",
    }
    content = (
        "// Generated by scripts/train_tiny_fub_neural.py. Do not edit manually.\n"
        f"export const FUB_NEURAL_META = Object.freeze({json.dumps(metadata, ensure_ascii=False, separators=(',', ':'))});\n"
        f"export const FUB_NEURAL_VOCAB = Object.freeze({json.dumps(vocabulary, ensure_ascii=False, separators=(',', ':'))});\n"
        f"export const FUB_NEURAL_WEIGHTS = Object.freeze({json.dumps(state, ensure_ascii=False, separators=(',', ':'))});\n"
    )
    OUTPUT.write_text(content, encoding="utf-8")
    print(
        f"Generated {OUTPUT.relative_to(ROOT)}: {metadata['parameters']} parameters, "
        f"top-1={top1:.3f}, top-5={top5:.3f}, "
        f"{OUTPUT.stat().st_size / 1024:.1f} KiB"
    )


if __name__ == "__main__":
    main()
