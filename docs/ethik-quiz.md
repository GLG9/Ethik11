# Ethik-Quiz Feature Guide

## Überblick
- 8 kuratierte Fragen zu Plessner, Löwith und Marx, 7 weitere Plätze sind bereits vorbereitet und als „bald verfügbar“ gekennzeichnet.
- Dark-Brown UI mit Sticky-Header, Off-Canvas-Sidebar, Philosophen-Thumbnails und optionalen Animationen (respektiert `prefers-reduced-motion`).
- Lokale Namensspeicherung via Modal beim ersten Besuch.
- Timer startet mit der ersten Frage, Bewertung erfolgt serverseitig mit exakt abgeglichenen Mehrfachantworten.
- Abschlussbildschirm zeigt Ergebnis, Zeit und Rank. CTA führt direkt ins Leaderboard oder erlaubt Neustart.

## Frontend (Angular)
- Einstieg: `http://localhost:4200/quiz`
  - Sidebar-Link zu `Leaderboard`.
  - Fortschrittsbalken, Multi-Select-Hinweise, Zurück/Weiter-Steuerung.
  - Nach Frage 8 erscheint eine Bestätigungskarte vor dem Einreichen.
- Leaderboard: `http://localhost:4200/quiz/leaderboard`
  - Tabelle inkl. Platz, Name, Richtig (x/8), Zeit (mm:ss), Datum.
  - Letztes eigenes Ergebnis wird hervorgehoben (lokal gespeichert).
- Admin-Panel: `http://localhost:4200/admin`
  - Einsicht der vollständigen Rangliste inkl. Zeit in ms.
  - Button „Leaderboard leeren“ löscht alle Einträge via Backend-API (mit Confirm-Dialog).

## Backend (Django)
- Datenmodell `quiz.models.QuizResult` speichert Einreichungen (Name, Score, Zeit, Antworten, Zeitstempel, UUID).
- Fragenkatalog & Antwortschlüssel liegen in `quiz/data.py`.
- Wichtige Endpunkte (`/api/quiz/…`):
  - `GET questions/` → Fragen + Metadaten + Platzhalter.
  - `POST submit/` → erwartet `{ name, timeMs, answers }`, validiert exakt, persistiert Ergebnis, liefert Rank & Top-10.
  - `GET leaderboard/` → gesamte Rangliste, optional `?limit=`.
  - `DELETE leaderboard/` → leert Leaderboard (vom Admin-Panel genutzt).
- Ranking: Mehr Punkte > kürzere Zeit > früheres Einreichungsdatum.
- Tests: `python manage.py test quiz`
- Migration: `python manage.py migrate`

## Deploy & Hosting
- Produktionsbuild: `npm run build` (Assets landen unter `frontend/web/dist/web/browser`).
- Apache-Setup siehe `docs/apache-angular-deployment.md` (DocumentRoot `/var/www/ethik-angular`).
- Bei neuen Builds: Dist-Verzeichnis auf den Server kopieren und Apache neustarten oder `graceful` ausführen.
