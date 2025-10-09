#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend/web"
SQLITE_DIR="$ROOT_DIR/db/sqlite"

BACKEND_PID=""
FRONTEND_PID=""

log() {
  echo "[ethik-start] $*"
}

cleanup() {
  trap - INT TERM EXIT
  if [[ -n "$BACKEND_PID" ]] && kill -0 "$BACKEND_PID" >/dev/null 2>&1; then
    log "Stoppe Backend (PID $BACKEND_PID)..."
    kill "$BACKEND_PID" >/dev/null 2>&1 || true
  fi
  if [[ -n "$FRONTEND_PID" ]] && kill -0 "$FRONTEND_PID" >/dev/null 2>&1; then
    log "Stoppe Frontend (PID $FRONTEND_PID)..."
    kill "$FRONTEND_PID" >/dev/null 2>&1 || true
  fi
  wait "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
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
  log "Installiere Backend-Abhängigkeiten..."
  python -m pip install -r "$BACKEND_DIR/requirements.txt"
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
log "Beenden mit Strg+C – beende alle Prozesse."

if command -v wait -n >/dev/null 2>&1; then
  wait -n "$BACKEND_PID" "$FRONTEND_PID"
else
  wait "$BACKEND_PID"
  wait "$FRONTEND_PID"
fi

exit_code=$?
cleanup
exit "$exit_code"
