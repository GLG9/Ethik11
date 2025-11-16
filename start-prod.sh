#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend/web"
DIST_DIR="$FRONTEND_DIR/dist/web/browser"
ROOT_ENV_FILE="$ROOT_DIR/.env"
BACKEND_ENV_FILE="$BACKEND_DIR/.env"
DOC_ROOT="${DOC_ROOT:-/var/www/ethik-angular}"
APACHE_RELOAD_CMD="${APACHE_RELOAD_CMD:-apachectl -k graceful}"

BACKEND_PID=""
BACKEND_HOST="${BACKEND_HOST:-0.0.0.0}"
BACKEND_PORT="${BACKEND_PORT:-3000}"

log() {
  echo "[ethik-prod] $*"
}

ensure_port_free() {
  local port="$1"
  local name="$2"
  local pid_list=""
  if command -v lsof >/dev/null 2>&1; then
    pid_list="$(lsof -ti tcp:"$port" || true)"
  elif command -v fuser >/dev/null 2>&1; then
    pid_list="$(fuser -n tcp "$port" 2>/dev/null || true)"
  fi
  if [[ -z "$pid_list" ]]; then
    return
  fi
  log "Port $port ($name) belegt – stoppe Prozesse ($pid_list)..."
  for pid in $pid_list; do
    kill "$pid" >/dev/null 2>&1 || true
  done
  sleep 1
  for pid in $pid_list; do
    kill -0 "$pid" >/dev/null 2>&1 && kill -9 "$pid" >/dev/null 2>&1 || true
  done
}

require_cmd() {
  local cmd="$1"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    log "Fehler: Benötigtes Kommando \"$cmd\" wurde nicht gefunden."
    exit 1
  fi
}

load_env_file() {
  local file="$1"
  if [[ -f "$file" ]]; then
    log "Lade Umgebungsvariablen aus ${file}..."
    # shellcheck disable=SC1090
    set -a
    source "$file"
    set +a
  fi
}

for env_candidate in "$ROOT_ENV_FILE" "$BACKEND_ENV_FILE" "$ROOT_DIR/../backend/.env"; do
  load_env_file "$env_candidate"
done

cleanup() {
  trap - INT TERM EXIT
  if [[ -n "$BACKEND_PID" ]] && kill -0 "$BACKEND_PID" >/dev/null 2>&1; then
    log "Stoppe Backend (PID $BACKEND_PID)..."
    kill "$BACKEND_PID" >/dev/null 2>&1 || true
  fi
  if [[ -n "$BACKEND_PID" ]]; then
    wait "$BACKEND_PID" 2>/dev/null || true
  fi
}

trap cleanup INT TERM EXIT

require_cmd python3
require_cmd npm

mkdir -p "$BACKEND_DIR/.venv"
if [[ ! -d "$BACKEND_DIR/.venv/bin" ]]; then
  log "Erstelle Python-Umgebung in backend/.venv..."
  python3 -m venv "$BACKEND_DIR/.venv"
fi

log "Installiere Backend-Abhängigkeiten falls nötig..."
source "$BACKEND_DIR/.venv/bin/activate"
if [[ -f "$BACKEND_DIR/requirements.txt" ]]; then
  REQ_HASH="$(sha256sum "$BACKEND_DIR/requirements.txt" | awk '{print $1}')"
  REQ_STAMP="$BACKEND_DIR/.venv/.requirements.sha256"
  CURRENT_HASH=""
  [[ -f "$REQ_STAMP" ]] && CURRENT_HASH="$(<"$REQ_STAMP")"
  if [[ "$REQ_HASH" != "$CURRENT_HASH" ]]; then
    python -m pip install --upgrade pip
    python -m pip install --upgrade -r "$BACKEND_DIR/requirements.txt"
    echo "$REQ_HASH" > "$REQ_STAMP"
  else
    log "Backend-Abhängigkeiten bereits aktuell."
  fi
fi

log "Führe Datenbank-Migrationen aus..."
python "$BACKEND_DIR/manage.py" migrate --noinput
deactivate

log "Baue Angular-Frontend (Production-Konfiguration)..."
pushd "$FRONTEND_DIR" >/dev/null
if [[ ! -d node_modules ]]; then
  log "Installiere Frontend-Abhängigkeiten (npm install)..."
  npm install
fi
npm run build -- --configuration production
popd >/dev/null

if [[ ! -d "$DIST_DIR" ]]; then
  log "Fehler: Build-Ordner $DIST_DIR wurde nicht erzeugt."
  exit 1
fi

log "Deploye Frontend nach ${DOC_ROOT}..."
mkdir -p "$DOC_ROOT"
if command -v rsync >/dev/null 2>&1; then
  rsync -a --delete "$DIST_DIR"/ "$DOC_ROOT"/
else
  log "WARN: rsync nicht gefunden – nutze cp -a (ohne Delete-Sync)."
  rm -rf "$DOC_ROOT"/*
  cp -a "$DIST_DIR"/. "$DOC_ROOT"/
fi

if command -v apachectl >/dev/null 2>&1 && [[ -n "$APACHE_RELOAD_CMD" ]]; then
  log "Apache-Reload (${APACHE_RELOAD_CMD})..."
  if ! bash -lc "$APACHE_RELOAD_CMD"; then
    log "WARN: Apache-Reload fehlgeschlagen."
  fi
fi

log "Starte Backend via uvicorn (${BACKEND_HOST}:${BACKEND_PORT})..."
ensure_port_free "$BACKEND_PORT" "Uvicorn"
pushd "$BACKEND_DIR" >/dev/null
source ".venv/bin/activate"
uvicorn server.asgi:application \
  --host "$BACKEND_HOST" \
  --port "$BACKEND_PORT" \
  --proxy-headers &
BACKEND_PID=$!
popd >/dev/null

log "Backend läuft auf http://${BACKEND_HOST}:${BACKEND_PORT}/"
log "Angular-Build liegt unter ${DOC_ROOT} und wird durch Apache ausgeliefert."
log "Beenden mit Strg+C"

wait "$BACKEND_PID"
