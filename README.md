Ethik-Projekt — Grundgerüste und Dev-Server.
- frontend/web        -> Angular-App (ng serve auf 0.0.0.0:4200)
- backend/server      -> Django/DRF (uvicorn auf 0.0.0.0:3000)
- db/sqlite/db.sqlite3-> Platzhalter für lokale DB
- docker/*            -> Platzhalter für Container-Setup

## Entwicklung starten

### Alles auf einmal
```bash
./start-dev.sh
```
Der Helfer richtet bei Bedarf `backend/.venv`, führt Migrationen aus, startet `uvicorn` auf `0.0.0.0:3000` und `ng serve` auf `0.0.0.0:4200`. Strg+C beendet beide Prozesse.

### Frontend
```bash
cd frontend/web
npm install          # nur beim ersten Mal bzw. nach Änderungen an package.json
npm run start        # läuft auf http://0.0.0.0:4200/ (von außen über Host-IP erreichbar)
```

### Backend
```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate  # falls noch kein venv existiert
pip install -r requirements.txt                     # sobald verfügbar
uvicorn server.asgi:application --host 0.0.0.0 --port 3000
```

Das Django-Admin-Interface ist unter `http://<HOST-IP>:3000/admin/` erreichbar (vorher `python manage.py createsuperuser` ausführen). Angular nutzt weiterhin die Proxy-Konfiguration auf `/api`, sodass Frontend und Backend auch aus dem Netzwerk heraus zusammenspielen.
