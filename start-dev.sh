#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend/web"
SQLITE_DIR="$ROOT_DIR/db/sqlite"
MODELS_DIR="$ROOT_DIR/models"
VLLM_SCRIPT="$ROOT_DIR/models/scripts/serve_vllm.sh"

BACKEND_PID=""
FRONTEND_PID=""
VLLM_PID=""

log() {
  echo "[ethik-start] $*"
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
  if [[ -n "$FRONTEND_PID" ]] && kill -0 "$FRONTEND_PID" >/dev/null 2>&1; then
    log "Stoppe Frontend (PID $FRONTEND_PID)..."
    kill "$FRONTEND_PID" >/dev/null 2>&1 || true
  fi
  local pids=()
  [[ -n "$VLLM_PID" ]] && pids+=("$VLLM_PID")
  [[ -n "$BACKEND_PID" ]] && pids+=("$BACKEND_PID")
  [[ -n "$FRONTEND_PID" ]] && pids+=("$FRONTEND_PID")
  if ((${#pids[@]} > 0)); then
    wait "${pids[@]}" 2>/dev/null || true
  fi
}

trap cleanup INT TERM EXIT

mkdir -p "$SQLITE_DIR"

if ! command -v python3 >/dev/null 2>&1; then
  log "Fehler: python3 nicht gefunden."
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  log "Fehler: npm nicht gefunden."
  exit 1
fi

if [[ ! -d "$BACKEND_DIR/.venv" ]]; then
  log "Erstelle Python-Umgebung in backend/.venv..."
  python3 -m venv "$BACKEND_DIR/.venv"
fi

source "$BACKEND_DIR/.venv/bin/activate"

if [[ -f "$BACKEND_DIR/requirements.txt" ]]; then
  REQUIREMENTS_HASH="$(sha256sum "$BACKEND_DIR/requirements.txt" | awk '{print $1}')"
  REQUIREMENTS_STAMP="$BACKEND_DIR/.venv/.requirements.sha256"
  CURRENT_HASH=""
  if [[ -f "$REQUIREMENTS_STAMP" ]]; then
    CURRENT_HASH="$(<"$REQUIREMENTS_STAMP")"
  fi
  if [[ "$REQUIREMENTS_HASH" != "$CURRENT_HASH" ]]; then
    log "Installiere/aktualisiere Backend-Abhängigkeiten..."
    python -m pip install --upgrade pip
    python -m pip install --upgrade -r "$BACKEND_DIR/requirements.txt"
    echo "$REQUIREMENTS_HASH" > "$REQUIREMENTS_STAMP"
  else
    log "Backend-Abhängigkeiten bereits aktuell."
  fi
else
  log "Hinweis: Kein backend/requirements.txt gefunden – überspringe Installation."
fi

log "Führe Datenbank-Migrationen aus..."
python "$BACKEND_DIR/manage.py" migrate --noinput

if command -v deactivate >/dev/null 2>&1; then
  deactivate
fi

log "Starte Backend via uvicorn (0.0.0.0:3000)..."
pushd "$BACKEND_DIR" >/dev/null
source ".venv/bin/activate"
uvicorn server.asgi:application --host 0.0.0.0 --port 3000 &
BACKEND_PID=$!
popd >/dev/null
if command -v deactivate >/dev/null 2>&1; then
  deactivate
fi

if [[ -x "$VLLM_SCRIPT" ]]; then
  # bevorzugte Reihenfolge: dedizierte vLLM-Umgebung, models/.venv, Trainings-venv
  if [[ -d "$ROOT_DIR/.venv_vllm" ]]; then
    MODELS_VENV="$ROOT_DIR/.venv_vllm"
  else
    MODELS_VENV="${MODELS_DIR}/.venv"
    if [[ ! -d "$MODELS_VENV" ]]; then
      ALT_VENV="$ROOT_DIR/.venv_r1"
      if [[ -d "$ALT_VENV" ]]; then
        MODELS_VENV="$ALT_VENV"
      fi
    fi
  fi
  if [[ -d "$MODELS_VENV" ]]; then
    log "Starte vLLM (0.0.0.0:9000) mit ${MODELS_VENV}..."
    (
      # run vLLM within models virtualenv so that vllm CLI is available
      source "$MODELS_VENV/bin/activate"
      HOST="${VLLM_HOST:-0.0.0.0}" PORT="${VLLM_PORT:-9000}" "$VLLM_SCRIPT"
    ) &
    VLLM_PID=$!
  else
    log "WARN: Kein Virtualenv unter $MODELS_VENV gefunden – vLLM-Start übersprungen."
  fi
else
  log "WARN: vLLM-Skript $VLLM_SCRIPT nicht gefunden oder nicht ausführbar – überspringe Start."
fi

log "Prüfe Frontend-Abhängigkeiten..."
pushd "$FRONTEND_DIR" >/dev/null
if [[ ! -d node_modules ]]; then
  log "Installiere Frontend-Abhängigkeiten (npm install)..."
  npm install
fi

log "Starte Angular-Dev-Server (0.0.0.0:4200)..."
npm run start &
FRONTEND_PID=$!
popd >/dev/null

log "Backend erreichbar unter http://0.0.0.0:3000/"
log "Frontend erreichbar unter http://0.0.0.0:4200/"
if [[ -n "$VLLM_PID" ]]; then
  log "vLLM erreichbar unter http://${VLLM_HOST:-0.0.0.0}:${VLLM_PORT:-9000}/"
fi
log "Beenden mit Strg+C – beende alle Prozesse."

if [[ -n "$VLLM_PID" ]]; then
  running_pids=("$BACKEND_PID" "$FRONTEND_PID" "$VLLM_PID")
else
  running_pids=("$BACKEND_PID" "$FRONTEND_PID")
fi

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
