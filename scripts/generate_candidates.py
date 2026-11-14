import json
from pathlib import Path

import ctranslate2
from transformers import MarianTokenizer

ROOT = Path(__file__).resolve().parents[1]
MODEL = ROOT / ".models" / "francais-fufulde"
SOURCE = ROOT / "scripts" / "source-texts.json"
OUTPUT = ROOT / ".models" / "fr-fub-candidates.json"

rows = json.loads(SOURCE.read_text(encoding="utf-8"))
texts = [row[0] for row in rows]
tokenizer = MarianTokenizer.from_pretrained(MODEL)
translator = ctranslate2.Translator(str(MODEL), device="cpu", compute_type="int8")

results = []
for start in range(0, len(texts), 16):
    batch = texts[start : start + 16]
    tokens = [tokenizer.convert_ids_to_tokens(tokenizer.encode(text)) for text in batch]
    translated = translator.translate_batch(tokens, beam_size=4, max_decoding_length=256)
    for source, result in zip(batch, translated):
        ids = tokenizer.convert_tokens_to_ids(result.hypotheses[0])
        target = tokenizer.decode(ids, skip_special_tokens=True)
        results.append({"fr": source, "fub": target})
        print(f"{source}\n  -> {target}")

OUTPUT.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"\nSaved {len(results)} candidates to {OUTPUT}")
