# Prüfprotokoll Versorgung – 29. Oktober 2026

Die Ergebnisse unten kombinieren den vollständigen Lauf mit den anschließenden gezielten Nachprüfungen der zuletzt geänderten Dateien. Sie sind kein behaupteter erneuter Gesamtlauf nach jeder UI-Korrektur.

Ergebnis: 1.983 bestanden, 0 fehlgeschlagen, 1 übersprungen.

- Gesamtlauf: `npm test -- --maxWorkers=2 --exclude test/_extrakt.test.ts` — 1.982 bestanden, ein Test übersprungen, eine zwischenzeitlich erweiterte Verzugsprüfung fehlgeschlagen. Der laufende Prozess hatte das Militärmodul bereits vor der Korrektur geladen.
- Nachprüfung Versorgung und Streitkräfte nach der Korrektur: 27 bestanden, keine Fehler. Sie prüft auch die kumulierten Materialverzögerungen.
- Abschließende Nachprüfung nach den Anzeigeänderungen: 14 bestanden, keine Fehler; Versorgung einschließlich Rendern in drei Sprachen.
- Zusätzlich wurden Waren, Diplomatie, Devisen und die von der CSS-Korrektur betroffenen Wahlansichten zusammen geprüft: 85 bestanden.
- `npm run build`: erfolgreich, einschließlich TypeScript. Bestehende Hinweise auf große Bundles und den Infrastruktur-Fallback bleiben.
- `git diff --check`: ohne Fehler.
- Browser: Reserveauftrag bindet Kapital ohne sofortige Lagererhöhung; zweiter Auftrag gesperrt; Priorität umstellbar; Monatsabschluss im Juli; gespeicherter Stand nach Neuladen erhalten; Reichweitenanzeige korrigiert.

`test/_extrakt.test.ts` bleibt ausgenommen, weil eine schon vor der Änderung fehlende externe Claude-Scratchpad-Datei erforderlich wäre. Der vorhandene übersprungene Test wurde nicht neu übersprungen.
