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
| Karte | **SVG** aus GeoJSON mit **d3-geo** | 81 Provinzen und später Bezirke sind wenige Tausend Linien; SVG lässt sich frei gestalten und später mit gezeichneten Ebenen überlagern. Eine Kachelkarten-Bibliothek ist dafür nicht nötig |
| Kartendaten | **Natural Earth** 1:10m, Verwaltungsebene 1 | Gemeinfrei, alle 81 Provinzen mit türkischen Namen und Kfz-Kennziffern |
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

- **Politiknetz** mit 186 Knoten und 363 Verbindungen, je Provinz gerechnet, mit eigener Ansicht (siehe [Politiknetz](POLITIKNETZ.md)).
- **Prolog** mit acht Stationen: Herkunft, Jugend, Beruf, Partnerschaft, Weg in die Politik, eigene Partei, Wahlkampf, Wahlnacht. Jede Antwort verändert Nähe zu Wählergruppen, Heimatprovinz, Familie, Versprechen oder Bündnis. Mit „Zufällig und schnell“ lässt er sich überspringen; `?schnellstart` in der Adresse startet ohne Prolog.
- **Parlament 2028** aus dem Umfragedurchschnitt: Die neue Partei zieht 15 bis 30 % an sich, jeder Anteil schwankt um bis zu 5 Punkte, dann Sperrklausel mit Bündnissen und D'Hondt. Vorerst landesweit; die Verteilung je Provinz folgt mit den Provinzdaten.
- **23 Tests**, darunter Prolog und Parlament (immer 600 Sitze, nur Parteien über der Hürde).

## Nächste Schritte

1. Provinzdaten einarbeiten: regionale Startwerte im Politiknetz und Sitzverteilung je Provinz.
2. Umfragen im Spiel: Wählergruppen und Parteien verbinden, monatliche Umfrage.
3. Parlament als Engpass: Gesetze brauchen 301 Stimmen, Absprachen mit anderen Fraktionen.
4. Figuren und Gespräche (CHAR-01, CHAT-01); dafür wird ein KI-Schlüssel für den Sprachversuch gebraucht.
5. Bildversuch mit einem Bildgenerator (ART-00).
