#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MODELS_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${MODELS_DIR}"

MERGES=(
  loewith
  gehlen
  kant
  plessner
  marx
)

mkdir -p merged

for name in "${MERGES[@]}"; do
  lora_dir="out/${name}_lora"
  out_dir="merged/${name}_fp16"

  if [[ ! -d "${lora_dir}" ]]; then
    echo "WARN: LoRA-Verzeichnis ${lora_dir} nicht gefunden – überspringe ${name}." >&2
    continue
  fi

  if [[ -d "${out_dir}" ]]; then
    echo "INFO: Merge-Ziel ${out_dir} existiert bereits – überspringe ${name}."
    continue
  fi

  echo "Running: python merge_lora.py --lora ${lora_dir} --out ${out_dir}"
  python merge_lora.py --lora "${lora_dir}" --out "${out_dir}"
done
