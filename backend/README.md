## Backend-Entwicklung

Aktuell wird das Projekt per `uvicorn` gestartet. Für das lokale (Netzwerk-)Testing genügt:

```bash
cd backend
source .venv/bin/activate            # falls bereits eingerichtet
uvicorn server.asgi:application --host 0.0.0.0 --port 3000
```

- Django akzeptiert Anfragen von `0.0.0.0`, `localhost`, `127.0.0.1` sowie beliebigen IPv4-Adressen auf Port 4200 (für das Angular-Proxy-Setup).
- Das Admin-Interface ist unter `http://<HOST-IP>:3000/admin/` erreichbar; vorher einen Superuser mit `python manage.py createsuperuser` anlegen.
- Achtung: Für die LAN-Erreichbarkeit ist `ALLOWED_HOSTS = ['*']` aktiviert (nur für die Entwicklung gedacht).
