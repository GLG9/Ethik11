#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MODELS_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${MODELS_DIR}"

export PYTORCH_CUDA_ALLOC_CONF="${PYTORCH_CUDA_ALLOC_CONF:-expandable_segments:True}"

resolve_model_id() {
  if [[ -n "${BASE_MODEL_HF:-}" ]]; then
    echo "${BASE_MODEL_HF}"
    return
  fi
  case "$1" in
    deepseek-r1:7b|deepseek-r1-7b|deepseek-r1)
      echo "deepseek-ai/DeepSeek-R1-Distill-Qwen-7B"
      ;;
    *)
      echo "$1"
      ;;
  esac
}

MODEL_ID="${MODEL_ID:-deepseek-r1:7b}"
RESOLVED_MODEL_ID="$(resolve_model_id "${MODEL_ID}")"
HOST="${HOST:-127.0.0.1}"
PORT="${PORT:-9000}"

declare -a LORA_NAMES=(kant marx gehlen plessner loewith)
declare -a LORA_ARGS=()

for name in "${LORA_NAMES[@]}"; do
  path="${MODELS_DIR}/out/${name}_lora"
  if [[ -d "${path}" ]]; then
    LORA_ARGS+=("${name}=${path}")
  else
    echo "WARN: Adapter-Verzeichnis ${path} fehlt – ${name} wird nicht geladen." >&2
  fi
done

if [[ ${#LORA_ARGS[@]} -eq 0 ]]; then
  echo "ERROR: Keine LoRA-Adapter gefunden. Bitte zuerst trainieren." >&2
  exit 1
fi

if ! command -v vllm >/dev/null 2>&1; then
  echo "ERROR: vllm nicht im PATH gefunden." >&2
  exit 1
fi

vllm serve "${RESOLVED_MODEL_ID}" \
  --dtype float16 \
  --enable-lora \
  --lora-modules "${LORA_ARGS[@]}" \
  --host "${HOST}" --port "${PORT}" \
  --max-model-len 4096 \
  --max-num-batched-tokens 1024 \
  --max-num-seqs 32 \
  --kv-cache-dtype fp8 \
  --gpu-memory-utilization 0.90 \
  --cpu-offload-gb 6 \
  --swap-space 8 \
  --max-loras 1 \
  --max-cpu-loras 5 \
  --enforce-eager \
  --served-model-name "${MODEL_ID}"
