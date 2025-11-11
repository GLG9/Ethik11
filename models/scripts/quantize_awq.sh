#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MODELS_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${MODELS_DIR}"

BASE_MODEL="${BASE_MODEL:-deepseek-ai/DeepSeek-R1-Distill-Qwen-7B}"
OUT_DIR="${OUT_DIR:-${MODELS_DIR}/quantized/deepseek-r1-7b-awq}"
CALIB_PATTERNS="${CALIB_PATTERNS:-models/data/*.jsonl}"
CALIB_SAMPLES="${CALIB_SAMPLES:-128}"

python3 "${MODELS_DIR}/quantize_awq.py" \
  --base "${BASE_MODEL}" \
  --out "${OUT_DIR}" \
  --calib "${CALIB_PATTERNS}" \
  --calib-samples "${CALIB_SAMPLES}"
