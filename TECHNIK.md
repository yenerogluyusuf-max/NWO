# Technik und erste Versuche

Stand: 28. September 2026. Ergänzung zum [Entwicklungsplan](ENTWICKLUNGSPLAN.md), Abschnitt 6 (Arbeitspaket TECH-00).

## Entscheidung (vorläufig, bis der Sprach- und der Bildversuch laufen)

| Baustein | Wahl | Begründung |
|---|---|---|
| Sprache | **TypeScript** für Simulationskern und Oberfläche | Eine Sprache für alles; strenge Typen passen zum Datenmodell mit vielen Objekten; Claude schreibt und prüft sie zuverlässig; leicht zu testen |
| Simulationskern | Reines TypeScript ohne Oberfläche und ohne Sprachmodell (`game/src/sim`) | Trennung von Weltmodell und Darstellung (Entwicklungsplan, Abschnitt 6); der Kern läuft auch in Tests und in der Vorschau |
| Zufall | Eigener deterministischer Zufallsgenerator, Zustand im Spielstand | Gleicher Seed, gleicher Verlauf; Speichern und Laden setzen exakt fort |
| Speichern | Der ganze Weltzustand ist reines JSON | Einfach, prüfbar, versionierbar; eiserner Modus später über einen einzigen Speicherplatz |
| Oberfläche | **React** mit **Vite** | Schnelle Entwicklung, gute Werkzeuge; Akten, Tabellen und Gespräche sind Text- und Formularoberflächen, dafür ist Web-Technik stark |
| Karte | **Three.js** für das Gelände (Half-Float-Höhentextur, Pixel-Shading) und ein **Screen-Space-Vektor-Overlay** auf Canvas (Grenzen, Straßen, Bahn, Orte, Beschriftung; scharf bei jedem Zoom, Detailstufe nach Pixeln je Texturkoordinate) | Die erste SVG-Wahl (Entwicklungsstand 28.09.) war zu unscharf und zu langsam für 81 Provinzen mit 973 Bezirken und Straßen; das Overlay wird pro Bild aus den Geodaten gezeichnet |
| Kartendaten | **Natural Earth** 1:10m (Provinzen, Nachbarländer), **AWS Terrarium** (Höhen, Zoom 8), **OpenStreetMap** (Straßen in vier Rängen, Bahn, Krankenhäuser, Kraftwerke, Staudämme; 973 Bezirke mit Straßendichte) | Gemeinfrei bzw. ODbL mit Quellenangabe; werden mit `game/tools/geodaten/` erzeugt, die großen Binärdateien stehen nicht im Repository |
| Vergleichsdaten | **Weltbank** (WDI und WGI, CC BY 4.0), 40 Indikatoren, 30 Länder | `game/tools/vergleich/weltbank.py`; jeder Wert trägt sein Jahr (Quelle oder Lücke) |
| Desktop | Zunächst im Browser; später in einer Desktop-Hülle (**Tauri** oder Electron) | Die Wahl der Hülle ändert nichts am Spiel und fällt, wenn ein Installationspaket gebraucht wird |
| Tests | **Vitest** | Reproduzierbarkeit, stilisierte Fakten und Leistung werden automatisch geprüft |

Keine dieser Entscheidungen beruht allein auf Beliebtheit; jede ist durch einen Versuch oder durch die Anforderungen begründet. Sie lassen sich früh noch ändern, weil der Simulationskern von der Oberfläche getrennt ist.

## Ergebnisse der Versuche

| Versuch | Ergebnis | Status |
|---|---|---|
| **Simulationsversuch:** Politiknetz mit 150 Knoten × 81 Provinzen, 400 Verbindungen mit bis zu 12 Monaten Verzögerung, 10 Spieljahre | 46 Millisekunden. Rechenleistung ist kein Engpass | bestanden |
| **Reproduzierbarkeit:** gleicher Seed, Speichern nach 173 Tagen, Laden, weiterrechnen | identischer Zustand wie ohne Unterbrechung | bestanden |
| **Kartenversuch:** 81 Provinzen als SVG, Auswahl, Hervorhebung der 30 Großstadtkommunen | flüssig, klickbar | bestanden (Bezirke folgen) |
| **Sprachversuch:** Anweisungen auf einen Handlungskatalog abbilden, mit mindestens zwei Anbietern | braucht einen KI-Schlüssel | offen |
| **Bildversuch:** Porträts und Kartenausschnitt per KI-Bildgenerierung | braucht Zugang zu einem Bildgenerator | offen |

## Der erste Prototyp

Der Ordner [`game/`](game/) enthält einen ersten spielbaren Kern. Er ist ein Entwicklungsstand, noch nicht S1.

- **Wirtschaftsmodell** mit den Zusammenhängen Z1 bis Z9 aus dem [Wirtschaftsmodell](WIRTSCHAFTSMODELL.md): Leitzins, Nachfrage, Inflation, Erwartungen, Glaubwürdigkeit, Wechselkurs, Risikoaufschlag, Wachstum, Arbeitslosigkeit, Schulden. Die Startwerte stammen vom Stichtag 25.09.2026; das Spiel beginnt im Juni 2028.
- **Zentralbank auf Stufe B:** Der Geldpolitische Ausschuss entscheidet nach einer Reaktionsregel und begründet jede Entscheidung. Der Spieler kann die Führung austauschen oder öffentlich Druck machen, aber nicht selbst den Zins festlegen.
- **Statistiken mit Verzögerung:** Die Inflation erscheint am 3. des Folgemonats, die Arbeitslosigkeit mit zwei Monaten Verzug, das Wachstum quartalsweise.
- **Folgen im Voraus:** Vor jeder Entscheidung rechnet das Modell die Zukunft mehrfach durch und zeigt Richtung und Bandbreite, keine genauen Zahlen.
- **Oberfläche:** Schreibtisch mit Morgenbriefing (höchstens fünf Punkte), Randnotizen der Mentorin, Wirtschaftsakte mit „Was heißt das?“, Karte der 81 Provinzen, Entscheidungen mit Vorschau. Beschlüsse haben einen durchgezogenen roten Rand, Gemessenes eine gefüllte Fläche, Absichten einen gestrichelten Rand.
- **11 automatische Tests:** Reproduzierbarkeit, Speichern und Laden, stilisierte Fakten (eine gefügige Zentralbankführung bringt mehr Inflation und eine schwächere Lira; mehr Ausgaben bringen erst Wachstum, dann Inflation; ohne Eingriff sinkt die Inflation), Plausibilität über zehn Jahre, Veröffentlichungsverzug, Vorschau, Leistung des Politiknetzes.

Alle Modellparameter sind Platzhalter für die Kalibrierung (`game/src/sim/economy.ts`).

### Starten

```
cd game
npm install
npm run dev      # Spiel im Browser unter http://localhost:5173
npm test         # automatische Tests
```

### Seitdem hinzugekommen

- **Politiknetz** mit 199 Knoten und 643 Verbindungen, je Provinz gerechnet, mit eigener Ansicht (siehe [Politiknetz](POLITIKNETZ.md)).
- **Prolog** mit acht Stationen: Herkunft, Jugend, Beruf, Partnerschaft, Weg in die Politik, eigene Partei, Wahlkampf, Wahlnacht. Jede Antwort verändert Nähe zu Wählergruppen, Heimatprovinz, Familie, Versprechen oder Bündnis. Mit „Zufällig und schnell“ lässt er sich überspringen; `?schnellstart` in der Adresse startet ohne Prolog.
- **Parlament 2028** aus dem Umfragedurchschnitt: Die neue Partei zieht 15 bis 30 % an sich, jeder Anteil schwankt um bis zu 5 Punkte, dann Sperrklausel mit Bündnissen und D'Hondt. Vorerst landesweit; die Verteilung je Provinz folgt mit den Provinzdaten.
- **221 Tests**, darunter Prolog und Parlament, Spielschleife, Verhandlung, Programme, Länder, Wähler, Wirkungsberichte, Chat, Speichern und Laden, eine Bot-Messung der Schwierigkeit (`test/spielbarkeit.test.ts`) und die Prüfung aller 44 Ereignisvorlagen auf lesbare Texte.

## Nächste Schritte

1. Provinzdaten einarbeiten: regionale Startwerte im Politiknetz und Sitzverteilung je Provinz.
2. Umfragen im Spiel: Wählergruppen und Parteien verbinden, monatliche Umfrage.
3. Parlament als Engpass: Gesetze brauchen 301 Stimmen, Absprachen mit anderen Fraktionen.
4. Figuren und Gespräche (CHAR-01, CHAT-01); dafür wird ein KI-Schlüssel für den Sprachversuch gebraucht.
5. Bildversuch mit einem Bildgenerator (ART-00).

## Gerenderte Oberflächenteile (Blender)

Messing, Emaille und Wachs der Oberfläche (Warnmedaillons, Kartenebenen-Knöpfe,
Porträtrahmen, Kompass, Datumsplakette, Siegel) sind keine CSS-Verläufe, sondern
mit Blender (Cycles) gerendert. Das Skript `game/tools/blender/ui_assets.py` baut
jedes Teil aus Grundformen, beleuchtet von oben links wie der Rest der Oberfläche,
und schreibt transparente PNGs nach `game/public/ui/`.

    pip install bpy            # Blender als Python-Modul, etwa 375 MB
    python game/tools/blender/ui_assets.py game/public/ui [teil ...]

Teile: `medaillon`, `rahmen`, `siegel`, `kompass`, `plakette`. Ein Durchlauf
dauert auf der CPU unter einer Minute.

## Stand 30.09.2026 (Nachtarbeit)

Simulationskern (`game/src/sim`): Spielschleife mit Kapital, Gesetz und Erlass, Fraktionen und Verhandlungen, Ereignismotor (44 Vorlagen mit Akteuren und Wirkungsvorschau), Figuren, Wählerkoalition, Regierungsprogramme (8 mit 37 Schritten), Wirkungsberichte, zwölf bis fünfzehn Länder als Akteure (`laender.ts`), Problemlöser (`vorschlaege.ts`), Bilanz. Oberfläche (`game/src/ui`): sieben Menüpunkte mit Reitern, Karte mit Ebenen, Ereignismarken und Beziehungsebene, Fenster für Wähler, Welt, Programme, Parlament. Ein Browser-Skript, das das Spiel wie ein Nutzer spielt, und eine Überschneidungsprüfung liegen im Scratchpad der Sitzung (Verfahren: [Nachtarbeit](NACHTARBEIT_2026-09-29.md)). **Kein Sprachmodell eingebaut** (Gespräch und Mentorin regelbasiert).


## Stand 30.09.2026 (nachmittags)

- **Sprachmodell eingebaut** (`game/src/ki/`): neun Anbieter (`anbieterliste.ts`), Wege „server“ (Schlüssel in `game/.env.local` als ANTHROPIC_API_KEY, MIMO_API_KEY, DEEPSEEK_API_KEY, OPENAI_API_KEY, GEMINI_API_KEY, OPENROUTER_API_KEY, MISTRAL_API_KEY oder KI_EIGEN_API_KEY; die Weiterleitung `/api/ki/relay` steckt in `vite.config.ts`), „relay“ (eigener Schlüssel, Weg über den Entwicklungsserver, umgeht CORS) und „direkt“ (Claude und lokaler Server). Das Modell antwortet mit JSON und schlägt geprüfte Aktionen vor; ohne Schlüssel antwortet das Regelwerk. Getestet ohne Netz mit Ersatz-Anbieter (`test/ki.test.ts`).
- **Simulation:** Reich (`reich.ts`), Verhandlungstisch (`abkommen.ts`), Personen (`personen*.ts`, `gespraeche.ts`), Wirtschaft (`wirtschaft*.ts`, `zentralbank.ts`, `haushalt.ts`), Wähler (`waehler-detail.ts`), 67 Ereignisvorlagen. 444 Tests.
- **Karte 2:** Küste als Distanzfeld im Shader, Länder und Bezirke aus einem gemeinsamen Bogennetz, Beschriftung mit Kollisionsauflösung (`ui/atlas/`, Pipeline `tools/geodaten/karte2/`).
- **Oberfläche:** Halbrund-Parlament mit Abstimmungs-Animation, Wunder-Animationen, Welt mit Flaggen (SVG) und Verhandlungstisch, Politik nach Bereichen, Schreibtisch als Tagesbriefing, Wirtschaftsakte mit anklickbaren Kennzahlen.
