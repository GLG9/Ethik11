#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MODELS_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${MODELS_DIR}"

export PYTORCH_CUDA_ALLOC_CONF="${PYTORCH_CUDA_ALLOC_CONF:-expandable_segments:True}"

resolve_model_id() {
  local candidate="$1"
  if [[ -n "${BASE_MODEL_HF:-}" ]]; then
    echo "${BASE_MODEL_HF}"
    return
  fi

  local persona_dir="${MODELS_DIR}/quantized/${candidate}_awq"
  if [[ -d "${persona_dir}" ]]; then
    echo "${persona_dir}"
    return
  fi

  case "${candidate}" in
    deepseek-r1:7b|deepseek-r1-7b|deepseek-r1)
      local default_awq="${MODELS_DIR}/quantized/deepseek-r1-7b-awq"
      if [[ -d "${default_awq}" ]]; then
        echo "${default_awq}"
        return
      fi
      echo "deepseek-ai/DeepSeek-R1-Distill-Qwen-7B"
      return
      ;;
    deepseek-r1:14b|deepseek-r1-14b)
      local awq_14b="${MODELS_DIR}/quantized/deepseek-r1-14b-awq"
      if [[ -d "${awq_14b}" ]]; then
        echo "${awq_14b}"
        return
      fi
      echo "deepseek-ai/DeepSeek-R1-Distill-Qwen-14B"
      return
      ;;
  esac

  echo "${candidate}"
}

MODEL_ID="${MODEL_ID:-deepseek-r1:7b}"
RESOLVED_MODEL_ID="$(resolve_model_id "${MODEL_ID}")"
HOST="${HOST:-127.0.0.1}"
PORT="${PORT:-9000}"
QUANTIZATION="${QUANTIZATION:-}"
LOAD_FORMAT="${LOAD_FORMAT:-auto}"
KV_CACHE_DTYPE="${KV_CACHE_DTYPE:-}"

if [[ -z "${QUANTIZATION}" ]]; then
  case "${RESOLVED_MODEL_ID}" in
    "${MODELS_DIR}/quantized/"*_awq)
      QUANTIZATION="${DEFAULT_AWQ_QUANTIZATION:-awq_marlin}"
      ;;
  esac
fi

if [[ -z "${KV_CACHE_DTYPE}" && "${QUANTIZATION}" =~ awq ]]; then
  KV_CACHE_DTYPE="fp8"
fi
GPU_MEMORY_UTILIZATION_SET="yes"
if [[ -z "${GPU_MEMORY_UTILIZATION+x}" ]]; then
  GPU_MEMORY_UTILIZATION_SET="no"
  GPU_MEMORY_UTILIZATION=0.93
fi

MAX_MODEL_LEN_SET="yes"
if [[ -z "${MAX_MODEL_LEN+x}" ]]; then
  MAX_MODEL_LEN_SET="no"
  MAX_MODEL_LEN=2048
fi

SWAP_SPACE_SET="yes"
if [[ -z "${SWAP_SPACE+x}" ]]; then
  SWAP_SPACE_SET="no"
  SWAP_SPACE=8
fi

CPU_OFFLOAD_GB_SET="yes"
if [[ -z "${CPU_OFFLOAD_GB+x}" ]]; then
  CPU_OFFLOAD_GB_SET="no"
  CPU_OFFLOAD_GB=0
fi

if [[ "${RESOLVED_MODEL_ID}" == *"14B"* || "${MODEL_ID}" =~ 14[bB] ]]; then
  if [[ "${GPU_MEMORY_UTILIZATION_SET}" == "no" ]]; then
    GPU_MEMORY_UTILIZATION=0.93
  fi
  if [[ "${MAX_MODEL_LEN_SET}" == "no" ]]; then
    MAX_MODEL_LEN=1792
  elif (( MAX_MODEL_LEN >= 2048 )); then
    MAX_MODEL_LEN=1792
  fi
  if [[ "${SWAP_SPACE_SET}" == "no" ]]; then
    SWAP_SPACE=16
  fi
  if [[ "${CPU_OFFLOAD_GB_SET}" == "no" ]]; then
    CPU_OFFLOAD_GB=16
  fi
fi

if [[ -z "${VLLM_LORA_BACKEND:-}" ]]; then
  export VLLM_LORA_BACKEND="punica"
fi

declare -a PERSONA_NAMES=(loewith gehlen kant plessner marx)

IS_PERSONA=0
for persona in "${PERSONA_NAMES[@]}"; do
  if [[ "${MODEL_ID}" == "${persona}" ]]; then
    IS_PERSONA=1
    PERSONA_PATH="${MODELS_DIR}/quantized/${persona}_awq"
    if [[ ! -d "${PERSONA_PATH}" ]]; then
      echo "ERROR: Persona-Modell ${PERSONA_PATH} nicht gefunden. Bitte package_persona.sh ausführen." >&2
      exit 1
    fi
    break
  fi
done

declare -a LORA_NAMES=(kant marx gehlen plessner loewith)
declare -a LORA_ARGS=()

if [[ "${IS_PERSONA}" -eq 0 ]]; then
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
fi

if ! command -v vllm >/dev/null 2>&1; then
  echo "ERROR: vllm nicht im PATH gefunden." >&2
  exit 1
fi

declare -a EXTRA_ARGS=()
if [[ -n "${QUANTIZATION}" && "${QUANTIZATION}" != "None" ]]; then
  EXTRA_ARGS+=(--quantization "${QUANTIZATION}")
  if [[ "${QUANTIZATION}" == "bitsandbytes" && "${LOAD_FORMAT}" == "auto" ]]; then
    LOAD_FORMAT="bitsandbytes"
  fi
fi
if [[ -n "${CPU_OFFLOAD_GB}" && "${CPU_OFFLOAD_GB}" != "0" ]]; then
  EXTRA_ARGS+=(--cpu-offload-gb "${CPU_OFFLOAD_GB}")
fi
if [[ -n "${LOAD_FORMAT}" && "${LOAD_FORMAT}" != "auto" ]]; then
  EXTRA_ARGS+=(--load-format "${LOAD_FORMAT}")
fi
if [[ -n "${KV_CACHE_DTYPE}" && "${KV_CACHE_DTYPE}" != "auto" ]]; then
  EXTRA_ARGS+=(--kv-cache-dtype "${KV_CACHE_DTYPE}")
fi
CMD=(vllm serve "${RESOLVED_MODEL_ID}"
  --dtype float16
  --host "${HOST}" --port "${PORT}"
  --max-model-len "${MAX_MODEL_LEN}"
  --max-num-batched-tokens 2048
  --max-num-seqs 16
  --gpu-memory-utilization "${GPU_MEMORY_UTILIZATION}"
  --swap-space "${SWAP_SPACE}"
  --served-model-name "${MODEL_ID}"
)

if [[ "${IS_PERSONA}" -eq 0 ]]; then
  CMD+=(--enable-lora --lora-modules "${LORA_ARGS[@]}" --max-loras 1 --max-cpu-loras 0)
fi

CMD+=("${EXTRA_ARGS[@]}")

"${CMD[@]}"
