# Arbeitslog Umsetzung (29.09.2026 abends)

Auftrag des Projektinhabers: „fixe alles was zu fixen ist und verbessere es“ (nach der Analyse `ANALYSE_SPIELBARKEIT_2026-09-29.md`).
Nicht committet (Commits nur auf Wunsch). Stand vor der Arbeit: Commit `9c0a93b`, 35 Tests grün.

## Entscheidungen der Umsetzung
- Karte: **Alternative der Analyse (Abschnitt 6.4)**: Three.js bleibt (Look erhalten), aber Linien, Flächen und Beschriftung werden in Geräte-Pixeln pro Bild gezeichnet; Relief bei Zoom 8 mit Pixel-Schattierung. Grund: keine Java-/Kachelwerkzeuge nötig, Look bleibt.
- Neue Simulationsmodule hängen an `world.spiel` (optional), damit alte Spielstände und Tests ohne Prolog weiter laufen.
- Alle neuen Wirkungsstärken sind Platzhalter der Kalibrierung, wie die bisherigen (Projektregel: keine erfundenen Zahlen als Fakten; Spielparameter sind keine Tatsachenbehauptungen).

## Daten (Werkzeuge in game/tools/geodaten, Rohdaten in ~/.cache/staatsraeson-geodaten)
- `relief.py` -> public/data/relief-z8.bin (5643 x 3512, 39,6 MB): erledigt
- `osm_extrakt.py` -> public/data/osm/* und src/data/provinz_infra.json: erledigt (2,17 Mio. Straßenabschnitte, 973 Bezirke, 2.029 Krankenhäuser)

## Schritte
1. Sofortfehler und Grundlagen (Gespräch, Kopfleiste, Vorschau, Speichern, Meldungen statt Pausen)
2. Ortsbezug, Politisches Kapital, Parlament, Kapazität
3. Ereignismotor, Außenwelt, Figuren, Umfrage/Wahl/Ende, Ziele, erster Spieltag
4. Karte (Relief, Vektor-Overlay, Straßen, Bezirke, Ebenen, Legende)
5. Regionale Startwerte aus OSM
6. Dokumente, Spielbarkeitstest, Endprüfung
