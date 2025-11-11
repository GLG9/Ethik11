#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MODELS_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${MODELS_DIR}"

PERSONA="${1:-}"
if [[ -z "${PERSONA}" ]]; then
  echo "Usage: $0 <persona> [calib_glob]" >&2
  exit 1
fi

CALIB_PATTERNS="${CALIB_PATTERNS:-models/data/*.jsonl}"
CALIB_SAMPLES="${CALIB_SAMPLES:-48}"
BASE_ALIAS="${BASE_ALIAS:-deepseek-r1:7b}"
FORCE_MERGE="${FORCE_MERGE:-0}"
FORCE_QUANT="${FORCE_QUANT:-0}"

LORA_DIR="out/${PERSONA}_lora"
MERGED_DIR="merged/${PERSONA}_fp16"
QUANT_DIR="quantized/${PERSONA}_awq"

if [[ ! -d "${LORA_DIR}" ]]; then
  echo "ERROR: LoRA-Verzeichnis ${LORA_DIR} nicht gefunden." >&2
  exit 1
fi

mkdir -p merged quantized

if [[ "${FORCE_MERGE}" == "1" && -d "${MERGED_DIR}" ]]; then
  echo "INFO: Entferne bestehendes Merge-Ziel ${MERGED_DIR} (FORCE_MERGE=1)."
  rm -rf "${MERGED_DIR}"
fi

if [[ ! -d "${MERGED_DIR}" ]]; then
  echo "==> Merge ${PERSONA}: python merge_lora.py --base ${BASE_ALIAS} --lora ${LORA_DIR} --out ${MERGED_DIR}"
  python3 merge_lora.py --base "${BASE_ALIAS}" --lora "${LORA_DIR}" --out "${MERGED_DIR}"
else
  echo "INFO: Überspringe Merge für ${PERSONA} – ${MERGED_DIR} existiert bereits."
fi

if [[ "${FORCE_QUANT}" == "1" && -d "${QUANT_DIR}" ]]; then
  echo "INFO: Entferne bestehendes Quant-Ziel ${QUANT_DIR} (FORCE_QUANT=1)."
  rm -rf "${QUANT_DIR}"
fi

if [[ -d "${QUANT_DIR}" ]]; then
  echo "INFO: Überspringe Quantisierung – ${QUANT_DIR} existiert bereits."
  exit 0
fi

echo "==> Quantisiere ${PERSONA} nach ${QUANT_DIR}"
python3 quantize_awq.py \
  --base "${MERGED_DIR}" \
  --out "${QUANT_DIR}" \
  --calib "${CALIB_PATTERNS}" \
  --calib-samples "${CALIB_SAMPLES}"
