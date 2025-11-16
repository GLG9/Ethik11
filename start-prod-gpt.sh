#!/usr/bin/env bash
set -Eeuo pipefail

# Basis-Pfade
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend/web"
MODELS_DIR="$ROOT_DIR/models"
VLLM_SCRIPT="$MODELS_DIR/scripts/serve_vllm.sh"
DOC_ROOT="/var/www/ethik-angular"

# GPT / vLLM Umgebung – WICHTIG: Python 3.12 für gpt-oss & friends
GPT_VENV="$ROOT_DIR/.venv_gpt"
GPT_PYTHON_BIN="${GPT_PYTHON_BIN:-python3.12}"

# Standalone-Python 3.12 (falls python3.12 nicht systemweit verfügbar ist)
STANDALONE_PYTHON_DIR="${STANDALONE_PYTHON_DIR:-$ROOT_DIR/.python312}"
PY_STANDALONE_URL="${PY_STANDALONE_URL:-https://github.com/indygreg/python-build-standalone/releases/download/20240415/cpython-3.12.3+20240415-x86_64-unknown-linux-gnu-install_only.tar.gz}"

# Torch aus stable cu128 Index (nicht nightly)
TORCH_INDEX_URL="${TORCH_INDEX_URL:-https://download.pytorch.org/whl/cu128}"

BACKEND_PID=""
VLLM_PID=""
RAG_PID=""

# Chat-/RAG-Konfiguration
export CHAT_MODEL_NAME="${CHAT_MODEL_NAME:-gpt-oss:20b}"
export CHAT_COMPLETIONS_URL="${CHAT_COMPLETIONS_URL:-http://127.0.0.1:9000/v1/chat/completions}"

RAG_HOST="${RAG_SERVICE_HOST:-127.0.0.1}"
RAG_PORT="${RAG_SERVICE_PORT:-9400}"
export RAG_SERVICE_URL="${RAG_SERVICE_URL:-http://${RAG_HOST}:${RAG_PORT}}"

log() {
  echo "[ethik-gpt] $*"
}

stop_processes_by_pattern() {
  local pattern="$1"
  local label="$2"
  local pids
  pids="$(pgrep -f "$pattern" 2>/dev/null || true)"
  if [[ -z "$pids" ]]; then
    return
  fi
  log "Stoppe laufende ${label}-Prozesse ($pids)..."
  for pid in $pids; do
    kill "$pid" 2>/dev/null || true
  done
  sleep 2
  for pid in $pids; do
    if kill -0 "$pid" >/dev/null 2>&1; then
      log "WARN: ${label}-Prozess $pid reagiert nicht – sende SIGKILL."
      kill -9 "$pid" 2>/dev/null || true
    fi
  done
}

ensure_port_free() {
  local port="$1"
  local name="$2"
  local pid_list=""
  if command -v lsof >/dev/null 2>&1; then
    pid_list="$(lsof -ti tcp:"$port" || true)"
  elif command -v fuser >/dev/null 2>&1; then
    pid_list="$(fuser -n tcp "$port" 2>/dev/null || true)"
  else
    log "WARN: Weder lsof noch fuser verfügbar – kann Portprüfung für $name nicht durchführen."
    return
  fi
  if [[ -n "$pid_list" ]]; then
    log "Port $port ($name) belegt (PIDs: $pid_list). Stoppe Prozesse..."
    for pid in $pid_list; do
      kill "$pid" 2>/dev/null || true
    done
    sleep 1
    if command -v lsof >/dev/null 2>&1; then
      lsof -ti tcp:"$port" >/dev/null 2>&1 && log "WARN: Port $port weiterhin belegt."
    elif command -v fuser >/dev/null 2>&1; then
      fuser -n tcp "$port" >/dev/null 2>&1 && log "WARN: Port $port weiterhin belegt."
    fi
  fi
}

ensure_root() {
  if [[ "$(id -u)" -ne 0 ]]; then
    log "Fehler: Bitte als root ausführen (z. B. via sudo)."
    exit 1
  fi
}

ensure_module_in_venv() {
  local venv_path="$1"
  local module="$2"
  local package="${3:-$2}"
  if [[ ! -d "$venv_path" ]]; then
    return
  fi
  # shellcheck disable=SC1090
  source "$venv_path/bin/activate"
  if ! python -c "import ${module}" >/dev/null 2>&1; then
    log "Installiere ${package} in ${venv_path}..."
    python -m pip install --upgrade "${package}"
  fi
  if command -v deactivate >/dev/null 2>&1; then
    deactivate
  fi
}

venv_has_cuda() {
  local venv_path="$1"
  if [[ ! -d "$venv_path" ]]; then
    return 1
  fi
  # shellcheck disable=SC1090
  source "$venv_path/bin/activate"
  python - <<'PY' >/dev/null 2>&1
import sys
try:
    import torch
    sys.exit(0 if torch.cuda.is_available() else 1)
except Exception:
    sys.exit(1)
PY
  local status=$?
  if command -v deactivate >/dev/null 2>&1; then
    deactivate
  fi
  return $status
}

install_standalone_python() {
  local target_dir="$STANDALONE_PYTHON_DIR"
  local bin_path="$target_dir/bin/python3.12"
  if [[ -x "$bin_path" ]]; then
    echo "$bin_path"
    return 0
  fi
  log "Lade Standalone-Python 3.12 (Quelle: $PY_STANDALONE_URL)..."
  local tmp_dir
  tmp_dir="$(mktemp -d "${TMPDIR:-/tmp}/py312.XXXXXX")"
  if ! curl -fsSL "$PY_STANDALONE_URL" -o "$tmp_dir/python312.tar.gz"; then
    log "Fehler: Download von $PY_STANDALONE_URL fehlgeschlagen."
    rm -rf "$tmp_dir"
    return 1
  fi
  mkdir -p "$tmp_dir/extracted"
  if ! tar -xzf "$tmp_dir/python312.tar.gz" -C "$tmp_dir/extracted"; then
    log "Fehler: Konnte Standalone-Archiv nicht entpacken."
    rm -rf "$tmp_dir"
    return 1
  fi
  rm -rf "$target_dir"
  mkdir -p "$target_dir"
  if [[ -d "$tmp_dir/extracted/python" ]]; then
    cp -a "$tmp_dir/extracted/python/." "$target_dir/"
  else
    cp -a "$tmp_dir/extracted/." "$target_dir/"
  fi
  rm -rf "$tmp_dir"
  if [[ -x "$bin_path" ]]; then
    echo "$bin_path"
    return 0
  fi
  log "Fehler: Standalone-Python nicht gefunden nach dem Entpacken."
  return 1
}

ensure_python_for_gpt() {
  if command -v "$GPT_PYTHON_BIN" >/dev/null 2>&1; then
    return
  fi
  if [[ "$GPT_PYTHON_BIN" == "python3.12" ]]; then
    if command -v apt-get >/dev/null 2>&1; then
      log "Versuche python3.12 via apt zu installieren..."
      DEBIAN_FRONTEND=noninteractive apt-get update || log "WARN: apt update fehlgeschlagen."
      if DEBIAN_FRONTEND=noninteractive apt-get install -y python3.12 python3.12-venv; then
        if command -v python3.12 >/dev/null 2>&1; then
          return
        fi
      else
        log "WARN: apt konnte python3.12 nicht installieren."
      fi
    fi
    local standalone_path=""
    if standalone_path="$(install_standalone_python)"; then
      GPT_PYTHON_BIN="$standalone_path"
      export GPT_PYTHON_BIN
      log "Verwende Standalone-Python unter $GPT_PYTHON_BIN."
      return
    fi
  fi
  if ! command -v "$GPT_PYTHON_BIN" >/dev/null 2>&1; then
    log "Fehler: $GPT_PYTHON_BIN nicht gefunden. Bitte Interpreter installieren oder GPT_PYTHON_BIN setzen."
    exit 1
  fi
}

ensure_backend_env() {
  if [[ ! -d "$BACKEND_DIR/.venv" ]]; then
    log "Erstelle Python-Umgebung in backend/.venv..."
    python3 -m venv "$BACKEND_DIR/.venv"
  fi
  # shellcheck disable=SC1090
  source "$BACKEND_DIR/.venv/bin/activate"
  local requirements="$BACKEND_DIR/requirements.txt"
  if [[ -f "$requirements" ]]; then
    local req_hash
    req_hash="$(sha256sum "$requirements" | awk '{print $1}')"
    local req_stamp="$BACKEND_DIR/.venv/.requirements.sha256"
    local current_hash=""
    [[ -f "$req_stamp" ]] && current_hash="$(<"$req_stamp")"
    if [[ "$req_hash" != "$current_hash" ]]; then
      log "Installiere/aktualisiere Backend-Abhängigkeiten..."
      python -m pip install --upgrade pip
      python -m pip install --upgrade -r "$requirements"
      echo "$req_hash" > "$req_stamp"
    else
      log "Backend-Abhängigkeiten bereits aktuell."
    fi
  fi
  python "$BACKEND_DIR/manage.py" migrate --noinput
  if command -v deactivate >/dev/null 2>&1; then
    deactivate
  fi
}

# *** WICHTIGER BLOCK: GPT / vLLM env (Python 3.12, pip, vllm --no-deps) ***
ensure_gpt_env() {
  ensure_python_for_gpt

  # Falls alte venv mit anderem Interpreter existiert -> wegwerfen
  if [[ -d "$GPT_VENV" && -x "$GPT_VENV/bin/python" ]]; then
    if ! "$GPT_VENV/bin/python" -c 'import sys; sys.exit(0 if sys.version_info[:2] == (3, 12) else 1)'; then
      log "Bestehende GPT-Umgebung nutzt nicht Python 3.12 – entferne $GPT_VENV..."
      rm -rf "$GPT_VENV"
    fi
  fi

  # Neue venv anlegen, falls nötig
  if [[ ! -d "$GPT_VENV" || ! -x "$GPT_VENV/bin/python" ]]; then
    log "Erstelle Python-Umgebung für GPT/vLLM in $GPT_VENV (Interpreter: $GPT_PYTHON_BIN)..."
    "$GPT_PYTHON_BIN" -m venv "$GPT_VENV"
  fi

  local deps_stamp="$GPT_VENV/.deps.sha256"
  # Hash – wenn du hier etwas änderst, werden Abhängigkeiten neu installiert
  local deps_hash="torch==2.9.0+cu128|vllm==0.10.1+gptoss|gpt-oss|sentence-transformers==3.2.1|fastapi==0.115.0|uvicorn==0.30.6|transformers==4.55.0|tokenizers==0.21.4|pydantic>=2.11.7,<3"

  local current_hash=""
  [[ -f "$deps_stamp" ]] && current_hash="$(<"$deps_stamp")"

  if [[ "$deps_hash" == "$current_hash" ]]; then
    log "GPT/vLLM/RAG-Abhängigkeiten bereits aktuell."
    return
  fi

  log "Installiere GPT/vLLM/RAG-Abhängigkeiten (Python 3.12, torch stable, vllm --no-deps, GPT-OSS-Stack)..."
  # shellcheck disable=SC1090
  source "$GPT_VENV/bin/activate"

  python -m pip install --upgrade pip

  # 1) Torch stable 2.9.0+cu128 aus stable cu128-Index
  python -m pip install --upgrade \
    "torch==2.9.0+cu128" \
    --index-url "${TORCH_INDEX_URL:-https://download.pytorch.org/whl/cu128}"

  # Optional: Audio/Vis (stabile cu128 Builds, keine dev-Versionen)
  python -m pip install --upgrade \
    "torchaudio==2.9.0+cu128" \
    "torchvision==0.24.0+cu128" \
    --index-url "${TORCH_INDEX_URL:-https://download.pytorch.org/whl/cu128}" || true

  # 2) Basis-Runtime (transformers, tokenizers, FastAPI, Pydantic, OpenAI, SentenceTransformers)
  python -m pip install --upgrade \
    numpy==2.1.3 \
    cloudpickle \
    "transformers==4.55.0" \
    "tokenizers==0.21.4" \
    "sentencepiece==0.2.0" \
    "safetensors==0.4.4" \
    fastapi==0.115.0 \
    "uvicorn[standard]==0.30.6" \
    "pydantic>=2.11.7,<3" \
    "openai-harmony>=0.0.3" \
    "openai>=1.87.0" \
    "sentence-transformers==3.2.1"

  # 3) vLLM GPT-OSS Wheel – OHNE automatische deps, damit kein Versuch,
  #    torch==2.9.0.dev20250804+cu128 etc. zu ziehen.
  python -m pip install --upgrade --no-deps \
    "vllm==0.10.1+gptoss" \
    --extra-index-url "https://wheels.vllm.ai/gpt-oss/"

  # 4) vLLM-/GPT-OSS-Laufzeitabhängigkeiten (ohne Torch)
  python -m pip install --upgrade \
    aiohttp \
    blake3 \
    cachetools \
    cbor2 \
    "compressed-tensors==0.10.2" \
    "depyf==0.19.0" \
    "diskcache==5.6.3" \
    einops \
    "gguf>=0.13.0" \
    "gpt-oss" \
    "lark==1.2.2" \
    "llguidance>=0.7.11,<0.8.0" \
    "lm-format-enforcer>=0.10.11,<0.11" \
    mcp \
    "mistral_common[audio,image]>=1.8.2" \
    msgspec \
    ninja \
    "numba==0.61.2" \
    "opencv-python-headless>=4.11.0" \
    "outlines_core==0.2.10" \
    partial-json-parser \
    "prometheus_client>=0.18.0" \
    "prometheus-fastapi-instrumentator>=7.0.0" \
    protobuf \
    psutil \
    py-cpuinfo \
    pybase64 \
    python-json-logger \
    "pyzmq>=25.0.0" \
    "ray[cgraph]>=2.48.0" \
    setproctitle \
    "tiktoken>=0.6.0" \
    "xgrammar==0.1.21"

  echo "$deps_hash" > "$deps_stamp"

  if command -v deactivate >/dev/null 2>&1; then
    deactivate
  fi
}

build_frontend() {
  log "Baue Produktions-Frontend (npm run build)..."
  pushd "$FRONTEND_DIR" >/dev/null
  if [[ ! -d node_modules ]]; then
    log "Installiere Frontend-Abhängigkeiten (npm install)..."
    npm install
  fi
  npm run build
  popd >/dev/null
  log "Deploye Frontend nach $DOC_ROOT..."
  mkdir -p "$DOC_ROOT"
  rm -rf "$DOC_ROOT"/*
  cp -r "$FRONTEND_DIR/dist/web/browser/"* "$DOC_ROOT/"
  chown -R www-data:www-data "$DOC_ROOT"
  if systemctl is-enabled apache2 >/dev/null 2>&1; then
    log "Apache graceful reload..."
    apachectl -k graceful
  fi
}

start_backend() {
  log "Starte Backend via uvicorn (127.0.0.1:3000)..."
  ensure_port_free 3000 "Uvicorn/Django"
  pushd "$BACKEND_DIR" >/dev/null
  # shellcheck disable=SC1090
  source ".venv/bin/activate"
  export RAG_SERVICE_URL
  export CHAT_COMPLETIONS_URL
  UVICORN_CMD=(
    uvicorn server.asgi:application
    --host 127.0.0.1
    --port 3000
    --workers "${UVICORN_WORKERS:-4}"
    --proxy-headers
    --forwarded-allow-ips='*'
    --limit-concurrency 200
  )
  "${UVICORN_CMD[@]}" &
  BACKEND_PID=$!
  popd >/dev/null
  if command -v deactivate >/dev/null 2>&1; then
    deactivate
  fi
}

start_rag_service() {
  if [[ ! -d "$ROOT_DIR/rag_service" ]]; then
    log "WARN: rag_service nicht gefunden – überspringe RAG-Service."
    export RAG_SERVICE_URL=""
    return
  fi
  ensure_port_free "$RAG_PORT" "RAG-Service"
  log "Starte RAG-Service (${RAG_HOST}:${RAG_PORT})..."
  (
    # shellcheck disable=SC1090
    source "$GPT_VENV/bin/activate"
    export PYTHONPATH="$ROOT_DIR${PYTHONPATH:+:$PYTHONPATH}"
    export RAG_SERVICE_HOST="$RAG_HOST"
    export RAG_SERVICE_PORT="$RAG_PORT"
    python -m rag_service.server
  ) &
  RAG_PID=$!
}

start_vllm() {
  if [[ ! -x "$VLLM_SCRIPT" ]]; then
    log "WARN: $VLLM_SCRIPT nicht gefunden – KI-Modelle werden nicht gestartet."
    return
  fi
  if ! venv_has_cuda "$GPT_VENV"; then
    log "WARN: CUDA nicht verfügbar – vLLM wird nicht gestartet."
    return
  fi
  ensure_module_in_venv "$GPT_VENV" pyairports "pyairports @ git+https://github.com/NICTA/pyairports.git"
  VLLM_HOST="${VLLM_HOST:-127.0.0.1}"
  VLLM_PORT="${VLLM_PORT:-9000}"
  stop_processes_by_pattern "/bin/vllm serve" "vLLM"
  stop_processes_by_pattern "models/scripts/serve_vllm.sh" "vLLM-Wrapper"
  ensure_port_free "$VLLM_PORT" "vLLM"
  log "Starte vLLM (${VLLM_HOST}:${VLLM_PORT})..."
  (
    # shellcheck disable=SC1090
    source "$GPT_VENV/bin/activate"
    HOST="$VLLM_HOST" PORT="$VLLM_PORT" MODEL_ID="${MODEL_ID:-gpt-oss:20b}" bash "$VLLM_SCRIPT"
  ) &
  VLLM_PID=$!
}

cleanup() {
  trap - INT TERM EXIT
  if [[ -n "$VLLM_PID" ]] && kill -0 "$VLLM_PID" >/dev/null 2>&1; then
    log "Stoppe vLLM (PID $VLLM_PID)..."
    kill "$VLLM_PID" >/dev/null 2>&1 || true
  fi
  if [[ -n "$RAG_PID" ]] && kill -0 "$RAG_PID" >/dev/null 2>&1; then
    log "Stoppe RAG-Service (PID $RAG_PID)..."
    kill "$RAG_PID" >/dev/null 2>&1 || true
  fi
  if [[ -n "$BACKEND_PID" ]] && kill -0 "$BACKEND_PID" >/dev/null 2>&1; then
    log "Stoppe Backend (PID $BACKEND_PID)..."
    kill "$BACKEND_PID" >/dev/null 2>&1 || true
  fi
  local pids=()
  [[ -n "$VLLM_PID" ]] && pids+=("$VLLM_PID")
  [[ -n "$RAG_PID" ]] && pids+=("$RAG_PID")
  [[ -n "$BACKEND_PID" ]] && pids+=("$BACKEND_PID")
  if ((${#pids[@]} > 0)); then
    wait "${pids[@]}" 2>/dev/null || true
  fi
}

trap cleanup INT TERM EXIT

ensure_root
ensure_backend_env
build_frontend
ensure_gpt_env
start_rag_service
start_backend
start_vllm

log "Produktionssetup aktiv."
log "Frontend:  http://<domain>/"
log "API:       http://<domain>/api/"
if [[ -n "$RAG_PID" ]]; then
  log "RAG-Service: PID $RAG_PID (${RAG_HOST}:${RAG_PORT})"
else
  log "RAG-Service: deaktiviert"
fi
if [[ -n "$VLLM_PID" ]]; then
  log "KI-Server: PID $VLLM_PID (${VLLM_HOST:-127.0.0.1}:${VLLM_PORT:-9000})"
else
  log "KI-Server: deaktiviert"
fi
log "Backend PID: ${BACKEND_PID:-n/a}"
log "Beenden mit Strg+C."

running_pids=()
[[ -n "$BACKEND_PID" ]] && running_pids+=("$BACKEND_PID")
[[ -n "$RAG_PID" ]] && running_pids+=("$RAG_PID")
[[ -n "$VLLM_PID" ]] && running_pids+=("$VLLM_PID")

if command -v wait -n >/dev/null 2>&1 && ((${#running_pids[@]} > 0)); then
  wait -n "${running_pids[@]}"
else
  for pid in "${running_pids[@]}"; do
    wait "$pid"
  done
fi

exit_code=$?
cleanup
exit "$exit_code"
