# Staatsräson als Mac-App

Die App ist eine Electron-Hülle um das gebaute Spiel. Sie liegt in `~/Applications/Staatsräson.app`, die schweren Dateien (Electron, Zwischenstand) in `~/.staatsraeson-app` (nicht im iCloud-Schreibtisch).

## Bauen

```
./app/bauen.sh                 # baut das Spiel neu, setzt die App zusammen und startet sie
NICHT_STARTEN=1 ./app/bauen.sh # baut, startet aber nicht
```

Läuft die App, **weigert sich das Skript** und bittet um Cmd+Q: Ein laufendes Spiel wird nie einfach beendet. `ERZWINGEN=1` beendet es geordnet (die App sichert beim Beenden selbst).

## Wo die Spielstände liegen

- Im Profil der App: `~/Library/Application Support/Staatsräson` (IndexedDB für die Stände, localStorage für kleine Angaben).
- **Nie** in einem Prüflauf anfassen. Playwright-Tests, die die App starten, müssen ein eigenes Profil benutzen:
  `env: { STAATSRAESON_PROFIL: <leerer Ordner> }` (siehe `main.cjs`). Ein Prüflauf im echten Profil hat am 04.10.2026 einen Stand kurz vor der Wahl 2033 überschrieben.
- Das Spiel hebt auf: den automatischen Stand, den **weitesten Stand** (höchstes Spieldatum) und drei rollierende Sicherungen (höchstens alle 15 Minuten). Das Laden einer älteren Datei oder „Neues Spiel“ überschreibt den weiten Stand nie. Sichtbar unter „Frühere Sicherungen“ im Titelbild und im Reiter „Spielstand“.
- Beim Beenden (Cmd+Q) sichert die App den Stand selbst (Wartezeit höchstens 8 Sekunden).

## KI

Schlüssel im Spiel eintragen oder in `~/Library/Application Support/Staatsräson/.env.local` (`MIMO_API_KEY=…`). Die Umgebungsvariablen der Shell liest die App nicht.

## Fehlersuche

- Protokoll: `~/Library/Logs/Staatsräson/spiel.log`.
- Leeres Fenster: Läuft noch eine alte Instanz? `pgrep -fl "Applications/Staatsr"` (Muster rein ASCII: macOS speichert den Umlaut zerlegt).
- Electron hängt den App-Namen an die Browserkennung; ein „ä“ darin lässt alle Anfragen am eigenen Protokoll scheitern. `main.cjs` setzt darum eine ASCII-Kennung.
