#!/usr/bin/env python3
"""
Quantize DeepSeek-R1 Distill 7B to 4-bit AWQ for serving with vLLM.

Usage:
  python quantize_awq.py \
      --base deepseek-ai/DeepSeek-R1-Distill-Qwen-7B \
      --out quantized/deepseek-r1-7b-awq \
      --calib models/data/*.jsonl
"""
import argparse
import glob
import json
import os
import random
from pathlib import Path
from typing import Iterable, List

import torch
from transformers import AutoTokenizer, activations as hf_activations

# AutoAWQ erwartet ältere Aktivierungsklassen – lege Ersatz nach.
if not hasattr(hf_activations, "PytorchGELUTanh"):
  class PytorchGELUTanh(torch.nn.Module):  # type: ignore
    def forward(self, input):
      return torch.nn.functional.gelu(input, approximate="tanh")  # type: ignore[attr-defined]
  hf_activations.PytorchGELUTanh = PytorchGELUTanh  # type: ignore[attr-defined]

from awq import AutoAWQForCausalLM  # type: ignore

REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CALIB_GLOB = "models/data/*.jsonl"
DEFAULT_OUT = "models/quantized/deepseek-r1-7b-awq"


def iter_calib_texts(paths: Iterable[Path]) -> Iterable[str]:
  for path in paths:
    try:
      with path.open("r", encoding="utf-8") as fh:
        for line in fh:
          line = line.strip()
          if not line:
            continue
          try:
            record = json.loads(line)
          except json.JSONDecodeError:
            continue
          if isinstance(record, dict):
            if "messages" in record:
              msgs = record["messages"]
              if isinstance(msgs, list) and msgs:
                # Use last user message as calibration text.
                for msg in reversed(msgs):
                  if isinstance(msg, dict) and msg.get("role") == "user":
                    content = msg.get("content")
                    if isinstance(content, str) and content.strip():
                      yield content.strip()
                      break
            elif "text" in record and isinstance(record["text"], str):
              yield record["text"].strip()
          elif isinstance(record, str):
            yield record.strip()
    except FileNotFoundError:
      continue


def build_calib_set(patterns: List[str], limit: int) -> List[str]:
  files: List[Path] = []
  for pattern in patterns:
    pattern = pattern.strip()
    if not pattern:
      continue
    abs_pattern = pattern if os.path.isabs(pattern) else str((REPO_ROOT / pattern).resolve())
    for path in glob.glob(abs_pattern):
      files.append(Path(path))
  texts = [t for t in iter_calib_texts(files) if t]
  if not texts:
    raise RuntimeError(f"Keine Kalibrierdaten unter {patterns} gefunden.")
  random.shuffle(texts)
  return texts[:limit]


def main():
  parser = argparse.ArgumentParser()
  parser.add_argument("--base", default=os.environ.get("BASE_MODEL_HF", "deepseek-ai/DeepSeek-R1-Distill-Qwen-7B"))
  parser.add_argument("--out", default=DEFAULT_OUT)
  parser.add_argument("--calib", nargs="*", default=[DEFAULT_CALIB_GLOB])
  parser.add_argument("--calib-samples", type=int, default=128)
  parser.add_argument("--bits", type=int, default=4)
  parser.add_argument("--group-size", type=int, default=128)
  parser.add_argument("--version", default="GEMM")
  parser.add_argument("--calib-batches", type=int, default=8)
  args = parser.parse_args()

  calib_texts = build_calib_set(args.calib, args.calib_samples)
  print(f"INFO: Verwende {len(calib_texts)} Kalibrier-Beispiele.")

  tokenizer = AutoTokenizer.from_pretrained(args.base, trust_remote_code=True)
  model = AutoAWQForCausalLM.from_pretrained(
      args.base,
      trust_remote_code=True,
      safetensors=True,
  )

  quant_config = {
      "zero_point": True,
      "w_bit": args.bits,
      "q_group_size": args.group_size,
      "version": args.version.lower(),
  }

  model.quantize(
      tokenizer,
      quant_config=quant_config,
      calib_data=calib_texts,
      max_calib_samples=len(calib_texts),
      max_calib_seq_len=128,
  )

  out_path = Path(args.out)
  out_path.mkdir(parents=True, exist_ok=True)
  model.save_quantized(str(out_path), safetensors=True)
  tokenizer.save_pretrained(str(out_path))
  print(f"INFO: Quantisiertes Modell gespeichert unter {out_path}")


if __name__ == "__main__":
  main()
