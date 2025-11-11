#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend/web"
MODELS_DIR="$ROOT_DIR/models"
VLLM_SCRIPT="$MODELS_DIR/scripts/serve_vllm.sh"
DOC_ROOT="/var/www/ethik-angular"
APACHE_SITE="ethik-angular.conf"
BACKEND_PID=""
VLLM_PID=""
START_VLLM="${START_VLLM:-1}"

log() {
  echo "[ethik-prod] $*"
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

ensure_module_in_venv() {
  local venv_path="$1"
  local module="$2"
  local package="${3:-$2}"
  if [[ ! -d "$venv_path" ]]; then
    return
  fi
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

cleanup() {
  trap - INT TERM EXIT
  if [[ -n "$VLLM_PID" ]] && kill -0 "$VLLM_PID" >/dev/null 2>&1; then
    log "Stoppe vLLM (PID $VLLM_PID)..."
    kill "$VLLM_PID" >/dev/null 2>&1 || true
  fi
  if [[ -n "$BACKEND_PID" ]] && kill -0 "$BACKEND_PID" >/dev/null 2>&1; then
    log "Stoppe Backend (PID $BACKEND_PID)..."
    kill "$BACKEND_PID" >/dev/null 2>&1 || true
  fi
  local pids=()
  [[ -n "$VLLM_PID" ]] && pids+=("$VLLM_PID")
  [[ -n "$BACKEND_PID" ]] && pids+=("$BACKEND_PID")
  if ((${#pids[@]} > 0)); then
    wait "${pids[@]}" 2>/dev/null || true
  fi
}

trap cleanup INT TERM EXIT

ensure_root

mkdir -p "$DOC_ROOT"

if [[ ! -d "$BACKEND_DIR/.venv" ]]; then
  log "Erstelle Python-Umgebung in backend/.venv..."
  python3 -m venv "$BACKEND_DIR/.venv"
fi

source "$BACKEND_DIR/.venv/bin/activate"

REQUIREMENTS_FILE="$BACKEND_DIR/requirements.txt"
if [[ -f "$REQUIREMENTS_FILE" ]]; then
  REQ_HASH="$(sha256sum "$REQUIREMENTS_FILE" | awk '{print $1}')"
  REQ_STAMP="$BACKEND_DIR/.venv/.requirements.sha256"
  CURRENT_HASH=""
  [[ -f "$REQ_STAMP" ]] && CURRENT_HASH="$(<"$REQ_STAMP")"
  if [[ "$REQ_HASH" != "$CURRENT_HASH" ]]; then
    log "Installiere/aktualisiere Backend-Abhängigkeiten..."
    python -m pip install --upgrade pip
    python -m pip install --upgrade -r "$REQUIREMENTS_FILE"
    echo "$REQ_HASH" > "$REQ_STAMP"
  else
    log "Backend-Abhängigkeiten bereits aktuell."
  fi
fi

log "Führe Datenbank-Migrationen aus..."
python "$BACKEND_DIR/manage.py" migrate --noinput

if command -v deactivate >/dev/null 2>&1; then
  deactivate
fi

log "Baue Produktions-Frontend (npm run build)..."
pushd "$FRONTEND_DIR" >/dev/null
if [[ ! -d node_modules ]]; then
  log "Installiere Frontend-Abhängigkeiten (npm install)..."
  npm install
fi
npm run build
popd >/dev/null

log "Deploye Frontend nach $DOC_ROOT..."
rm -rf "$DOC_ROOT"/*
cp -r "$FRONTEND_DIR/dist/web/browser/"* "$DOC_ROOT/"
chown -R www-data:www-data "$DOC_ROOT"

if systemctl is-enabled apache2 >/dev/null 2>&1; then
  log "Apache graceful reload..."
  apachectl -k graceful
fi

log "Starte Backend via uvicorn (127.0.0.1:3000)..."
ensure_port_free 3000 "Uvicorn/Django"
pushd "$BACKEND_DIR" >/dev/null
source ".venv/bin/activate"
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

if [[ "$START_VLLM" == "1" ]]; then
  if [[ -x "$VLLM_SCRIPT" ]]; then
    if [[ -d "$ROOT_DIR/.venv_vllm" ]]; then
      MODELS_VENV="$ROOT_DIR/.venv_vllm"
    elif [[ -d "$MODELS_DIR/.venv" ]]; then
      MODELS_VENV="$MODELS_DIR/.venv"
    elif [[ -d "$ROOT_DIR/.venv_r1" ]]; then
      MODELS_VENV="$ROOT_DIR/.venv_r1"
    else
      MODELS_VENV=""
    fi

    if [[ -n "$MODELS_VENV" ]]; then
      ensure_module_in_venv "$MODELS_VENV" pyairports "pyairports @ git+https://github.com/NICTA/pyairports.git"
      if ! venv_has_cuda "$MODELS_VENV"; then
        log "WARN: Keine CUDA-Unterstützung gefunden – KI-Modelle werden nicht gestartet."
        MODELS_VENV=""
      fi
    fi

    if [[ -n "$MODELS_VENV" ]]; then
      VLLM_HOST="${VLLM_HOST:-127.0.0.1}"
      VLLM_PORT="${VLLM_PORT:-9000}"
      stop_processes_by_pattern "/bin/vllm serve" "vLLM"
      stop_processes_by_pattern "models/scripts/serve_vllm.sh" "vLLM-Wrapper"
      ensure_port_free "$VLLM_PORT" "vLLM"
      log "Starte vLLM (${VLLM_HOST}:${VLLM_PORT})..."
      (
        source "$MODELS_VENV/bin/activate"
        HOST="$VLLM_HOST" PORT="$VLLM_PORT" bash "$VLLM_SCRIPT"
      ) &
      VLLM_PID=$!
    else
      log "WARN: Keine vLLM-Umgebung gefunden – KI-Modelle werden nicht gestartet."
    fi
  else
    log "WARN: $VLLM_SCRIPT nicht gefunden – KI-Modelle werden nicht gestartet."
  fi
else
  log "Hinweis: START_VLLM=0 – KI-Server wird nicht gestartet."
fi

log "Produktions-Setup aktiv."
log "Frontend:  http://<domain>/"
log "API:       http://<domain>/api/"
if [[ "$START_VLLM" == "1" ]]; then
  log "KI-Server: PID ${VLLM_PID:-n/a} (${VLLM_HOST:-127.0.0.1}:${VLLM_PORT:-9000})"
else
  log "KI-Server: deaktiviert"
fi
log "Quiz/Chat erreichbar, sobald Backend (PID $BACKEND_PID) und ggf. KI-Server laufen."
log "Beenden mit Strg+C."

running_pids=("$BACKEND_PID")
[[ -n "$VLLM_PID" ]] && running_pids+=("$VLLM_PID")

if command -v wait -n >/dev/null 2>&1; then
  wait -n "${running_pids[@]}"
else
  for pid in "${running_pids[@]}"; do
    wait "$pid"
  done
fi

exit_code=$?
cleanup
exit "$exit_code"
