#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MODELS_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${MODELS_DIR}"

TARGET_DIR="${SPEC_MODEL_DIR:-${MODELS_DIR}/quantized/qwen2p5-1_5b-awq}"
BASE_MODEL="${SPEC_BASE_MODEL:-Qwen/Qwen2.5-1.5B-Instruct}"
PREBUILT_REPO_DEFAULT="Qwen/Qwen2.5-1.5B-Instruct-AWQ"
PREBUILT_REPO="${SPEC_PREBUILT_REPO:-$PREBUILT_REPO_DEFAULT}"
CALIB_PATTERNS="${CALIB_PATTERNS:-models/data/*.jsonl}"
CALIB_SAMPLES="${CALIB_SAMPLES:-64}"

if [[ -d "$TARGET_DIR" ]]; then
  echo "[spec-model] ${TARGET_DIR} existiert bereits – überspringe."
  exit 0
fi

echo "[spec-model] Versuche, vorquantisiertes Modell (${PREBUILT_REPO}) zu laden ..."
if TARGET_DIR="$TARGET_DIR" SPEC_PREBUILT_REPO="$PREBUILT_REPO" python3 - <<'PY'
import os
from huggingface_hub import snapshot_download
repo = os.environ["SPEC_PREBUILT_REPO"]
target = os.environ["TARGET_DIR"]
snapshot_download(
    repo_id=repo,
    local_dir=target,
    local_dir_use_symlinks=False,
    allow_patterns=["*.json","*.safetensors","*.model","*.txt","*.py","*.md"]
)
PY
then
  echo "[spec-model] Download erfolgreich."
  exit 0
fi

echo "[spec-model] Download fehlgeschlagen – bitte SPEC_PREBUILT_REPO anpassen oder manuell bereitstellen."
exit 1
