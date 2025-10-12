#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MODELS_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${MODELS_DIR}"

export CUDA_VISIBLE_DEVICES="${CUDA_VISIBLE_DEVICES:-0}"
export BASE_MODEL="${BASE_MODEL:-Qwen/Qwen2.5-7B-Instruct}"
export PYTORCH_CUDA_ALLOC_CONF="${PYTORCH_CUDA_ALLOC_CONF:-expandable_segments:True}"

DATASETS=(
  loewith
  gehlen
  kant
  plessner
  marx
)

mkdir -p out

for dataset in "${DATASETS[@]}"; do
  data_path="data/${dataset}.jsonl"
  out_dir="out/${dataset}_lora"

  if [[ ! -f "${data_path}" ]]; then
    echo "WARN: Datei ${data_path} nicht gefunden – überspringe ${dataset}." >&2
    continue
  fi

  if [[ -d "${out_dir}" ]]; then
    echo "INFO: Ziel ${out_dir} existiert bereits – überspringe Training für ${dataset}."
    continue
  fi

  echo "Running: python train_sft.py --qlora --data ${data_path} --out ${out_dir}"
  python train_sft.py --qlora --data "${data_path}" --out "${out_dir}"
done
