## Frontend-Entwicklung

```bash
cd frontend/web
npm install          # Abhängigkeiten
npm run start        # ng serve auf 0.0.0.0:4200
```

Die Angular-Dev-Server-Instanz lauscht auf `0.0.0.0`, sodass sie innerhalb des lokalen Netzwerks über die Host-IP erreichbar ist. Die Proxy-Konfiguration (`proxy.conf.json`) reicht alle `/api`-Aufrufe an das Backend weiter.
