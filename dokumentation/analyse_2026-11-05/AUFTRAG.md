# Gesamtanalyse Staatsräson, 5. November 2026: Auftrag und Maßstab

Der Projektinhaber will eine Analyse von allem, was es im Spiel gibt: jede Ansicht, jeder Knopf, jede Funktion und jedes Wort. Alles soll durchdacht und kritisiert werden, logisch sein und vor allem schön. Diese Datei ist der gemeinsame Maßstab. Jeder Prüfbereich schreibt seinen Befund nach `befund-<Kürzel>.md` in diesen Ordner.

## Das Spiel

Staatsräson ist ein Regierungsspiel. Man regiert die Türkei ab 2028 als Präsident: Ereignisse, Gesetze, Haushalt, Minister, Außenpolitik, Krieg und Wahlen.

- **Technik:** TypeScript, React 19 und Vite im Ordner `game/`.
- **Texte:** Sie liegen in `game/src/i18n/katalog/{de,en,tr}/*.json`. Die Oberfläche spricht den Spieler mit „Sie“ an.
- **Aufbau der Oberfläche:** Im Hintergrund liegt die Karte, links eine Leiste mit den Bereichen. Jeder Bereich öffnet eine Akte mit Reitern.

**Vorbilder:**
- Democracy 4: alle Politiken auf einem Bildschirm, Wählergruppen als Kreise, Preis am Regler, Ursache und Wirkung beim Darüberfahren
- Civilization 6: wenige große Bildschirme, klare Ikonen, Drill-down
- Suzerain: Personen und Entscheidungen erzählt
- Hearts of Iron 4: die Karte als Bühne für das Militär
- Tropico: der Almanach

Leitdokumente, die vorgehen:
- `ENTSCHEIDUNGEN.md`, besonders V und W mit den Nachträgen
- `PLAN_OBERFLAECHE_DETAIL_2026-11-05.md`
- `LEITBILD_UND_VORBILDER_2026-11-05.md`
- `PLANERWEITERUNG.md` §10 (aktueller Stand)

## Wörtliche Rückmeldungen des Projektinhabers (der Maßstab)

- „ES IST EIN SPIEL DAS AUCH GUT AUSSEHEN MUSS“; „das kann man viel schöner machen, viel interaktiver und einfach viel besser“
- „alles was keinen einfluss hat und nur show ist, ist für mich ein no go“; „hinter jeder entscheidung muss etwas stecken“
- „die regler müssen immer sinn ergeben. Bei steuererhöhungen müssen natürlich zahlen und prozente angegeben werden, aber bei einer cannabis legalisierung macht das keinen sinn“ (dort gehören benannte Zustände hin)
- „sieht wieder alles verschieden aus“: Gleiches muss gleich aussehen.
- „wo finde ich diese akten“: Jeder Hinweis führt direkt zur zuständigen Stelle.
- „hier fehlt ein erweitern … weiter ausbauen“: Was man begonnen hat, muss man fortsetzen, ändern und beenden können.
- „siehst du wie ich alles hinterfrage? und versuche zu verbessern sowohl die sinnhaftigkeit als auch das design“
- Ältere Rückmeldungen:
  - „zu kompliziert, nimm dir ein Beispiel an Democracy 4“
  - „extrem lang gezogen“
  - „gewisse Ansichten sind viel zu groß, andere viel zu klein, andere machen überhaupt keinen Sinn“
  - „hinterfrag jeden Klick“

## Feste Regeln (aus ENTSCHEIDUNGEN und der Projekterinnerung)

1. **Eine Frage, ein Bild:** Jede Ansicht beantwortet zuerst die eine Frage, die der Spieler dort hat, mit einem Bild oben (Rad, Karte, Ring, Balken, Kurve, Halbrund). Darunter stehen die Stellgrößen, je eine Zeile.
2. **Länge:** höchstens 1,5 Bildschirme bei 1440×900. Ausnahmen sind Verlauf, Chronik und Quellen.
3. **Ebenen:** zwei Navigationsebenen. Einzelheiten öffnen sich per Klick (Drill-down) und stehen nicht alle offen untereinander.
4. **Preis und Wirkung am Regler:** Beides steht dort, wo man stellt.
5. **Echte Einheiten:** Regler zeigen echte Einheiten (Prozent, Lira, Jahre) oder benannte Zustände. „Stufe 50“ und „60 % des Ausgangs“ gelten als Mangel, wo es eine echte Größe gibt.
6. **Zahlen:** Echte Zahlen brauchen eine Quelle im Code oder in den Daten, sonst sind sie als „Lücke“ oder „Spielparameter“ gekennzeichnet. Keine erfundenen Zahlen. In der Oberfläche stehen keine Quellenangaben, Ausnahme ist die Kartenlizenz.
7. **Keine Schau:** Jede Antwort, jeder Knopf und jeder Regler hat eine echte Wirkung in der Simulation. Ein Text, der eine Wirkung verspricht („kostet 2 Kapital“, „senkt die Inflation“), muss stimmen.
8. **Nichts doppelt:** Dasselbe steht nicht an zwei Stellen. Übersicht ohne Scrollen, Kacheln plus Detail auf Klick.
9. **Voraussetzungen verlinken:** Jede fehlende Bedingung führt zur zuständigen Stelle, wo möglich mit einem Direktknopf.
10. **Sprache:**
    - Deutsch mit ä, ö, ü und ß, keine Emojis.
    - „Sie“ für den Spieler, kurze klare Sätze, kein Amtsdeutsch, keine internen Kürzel oder Codenamen (`m_mindestlohn`, „Z1“, „AP 4“).
    - Keine englischen Reste in der deutschen Fassung.
    - Indizes ohne Kommastelle.
11. **Drei Sprachen:** Englisch und Türkisch sind vollständig und gut, nicht maschinell holprig. Die Oberfläche enthält keine fest verdrahteten deutschen Wörter außerhalb der Kataloge.
12. **Determinismus:** gleicher Samen, gleicher Verlauf.

## Was alles geprüft wird (wörtlich: „wirklich alles, jeden Bereich, die Schriftart, das Artwork, alles, die Erklärungen, die Möglichkeiten in jedem Bereich“)

Jeder Bereich prüft für seine Ansichten alle sieben Ebenen:

1. **Möglichkeiten:**
   - Was kann der Spieler hier tun?
   - Ist das genug, zu viel oder das Falsche?
   - Was fehlt, das ein echter Präsident hier hätte oder das Democracy 4, Civilization 6, Suzerain oder Hearts of Iron 4 böte?
   - Lässt sich alles Begonnene fortsetzen, ändern und beenden?
   - Gibt es echte Abwägungen, also einen Preis, Verlierer und eine Verzögerung, oder nur eine richtige Antwort?
2. **Funktion und Logik:**
   - Hat jeder Knopf, Regler und jede Antwort eine Wirkung?
   - Stimmt der Text zur Wirkung?
   - Sind die Zahlen plausibel und belegt?
   - Stimmen die Ketten von Ursache und Wirkung?
3. **Erklärungen:**
   - Versteht ein neuer Spieler ohne Vorwissen, was hier geschieht und warum?
   - Wie gut sind Hinweistexte, „Warum“-Texte, die Wirkungsanzeige beim Darüberfahren und der Almanach: zu viel, zu wenig, zu trocken, richtig?
4. **Bild und Artwork:**
   - Gibt es oben ein Bild, das die Frage beantwortet?
   - Wie gut sind Illustrationen, Porträts, Wappen, Ikonen, Karte und Animation?
   - Passen sie zusammen, sind sie scharf und in derselben Bildsprache?
   - Wo fehlt ein Bild, wo ist eines nur Dekoration?
5. **Schrift und Satz:**
   - Schriftarten, Größen, Schnitte, Zeilenlänge, Abstände, Ausrichtung und Hierarchie der Überschriften
   - Lesbarkeit und Kontrast
   - Wirkt es wie ein Spiel oder wie ein Formular?
6. **Gestaltung und Einheitlichkeit:**
   - Sehen gleiche Dinge gleich aus (Karten, Knöpfe, Reiter, Regler, Ringe, Chips)?
   - Farben und ihre Bedeutung
   - Leerraum, Länge und Dichte
7. **Wörter:** jedes Wort der Ansicht, siehe Abschnitt 3 des Formats.

Die Noten der Ansichtskarte erweitern sich entsprechend:
- Möglichkeiten
- Logik
- Erklärung
- Bild/Artwork
- Schrift
- Gestaltung
- Sprache
- Spielgefühl

## Wie geprüft wird

- **Bilder:** Der aktuelle Stand jeder Ansicht liegt unter `dokumentation/analyse_2026-11-05/rundgang/`.
  - Die Bilder sind `NNN.png` (Teil zwei `NNN-2.png`).
  - `seiten.json` ordnet Nummer, Pfad, Höhe in Bildschirmen, Wörter und Knöpfe zu, `bericht.md` enthält die Messung.
  - Sehen Sie sich jedes Bild Ihres Bereichs selbst an (Read-Werkzeug auf die PNG-Datei).
- **Code und Texte:** Lesen Sie die Komponenten unter `game/src/ui/…` und die zugehörigen Kataloge unter `game/src/i18n/katalog/de/…` vollständig. Englisch und Türkisch prüfen Sie stichprobenweise, ob die Schlüssel vorhanden sind und sinngemäß stimmen. Lesen Sie die Simulation unter `game/src/sim/…` dort, wo ein Text eine Wirkung behauptet oder eine Zahl zeigt.
- **Ausprobieren:** Das ist erlaubt mit einem eigenen kopflosen Playwright-Browser gegen `http://localhost:5173/?schnellstart`.
  - Vorlagen sind die Skripte `blick*.cjs` im Scratchpad `/private/tmp/claude-501/-Users-yusufyeneroglu/904f44f4-7b5f-44c2-9447-c69e44ab880b/scratchpad/`.
  - Eigene Skripte und Bilder legen Sie in einen eigenen Unterordner dort.
  - Klicken Sie Knöpfe und prüfen Sie, ob etwas geschieht.

**Verboten:**
- Dateien unter `game/src` ändern
- committen
- Server starten oder beenden
- die Mac-App oder Safari des Inhabers anfassen
- die volle Testsuite laufen lassen
- bezahlte externe Programmierschnittstellen aufrufen

## Format des Befunds (`befund-<Kürzel>.md`)

**1. Ansichten:** Je Ansicht eine kurze Karte.
- **Kopf:** Name und Bildnummer
- **Frage der Seite:** Welche Frage hat der Spieler hier?
- **Antwort:** Beantwortet das Bild oben sie (ja, teilweise, nein)?
- **Länge:** in Bildschirmen
- **Noten 1 bis 5** (1 = sehr gut, wie in der Schule): Schönheit, Verständlichkeit, Sinn und Spielgefühl
- **Urteil:** in einem Satz

**2. Befunde:** Eine Tabelle oder nummerierte Liste mit diesen Feldern:
- `ID` (Kürzel-Nummer, etwa B-17)
- `Ort`: Ansicht › Element sowie `datei:zeile` oder der Katalogschlüssel
- `Art`: Sinn | Logik | Funktion | Zahl | Design | Konsistenz | Sprache | Übersetzung
- `Befund`: konkret, mit wörtlichem Zitat des Textes
- `Warum es stört`: aus Sicht des Spielers
- `Vorschlag`: konkret umsetzbar, bei Sprache mit fertiger Neufassung des Satzes
- `Schwere`: 1 = bricht Sinn oder Spiel, 2 = deutlich störend, 3 = Feinschliff
- `Aufwand`: klein, mittel oder groß

**3. Wortprüfung:** Alle Sprachfunde des Bereichs als Liste „Schlüssel: alt → neu“. Gesucht werden:
- unklare, zu lange oder amtsdeutsche Sätze
- Fachjargon ohne Erklärung
- uneinheitliche Begriffe für dasselbe
- Tippfehler
- falsche Zahlen- und Pluralformen
- interne Kürzel
- englische Reste
- fehlende oder falsche Übersetzungen

**4. Die fünf wichtigsten Verbesserungen des Bereichs:** Geordnet nach Wirkung auf Spielgefühl und Schönheit, je mit einer Skizze der besseren Lösung. Die Skizze darf ASCII sein oder eine Beschreibung von Bild, Klick und Wirkung.

**Haltung:** Streng und ehrlich, aber gerecht. Gutes wird kurz genannt, damit es bleibt. Vermutungen werden als Vermutung gekennzeichnet. Jede Behauptung über eine Wirkung oder ihr Fehlen ist im Code belegt (`datei:zeile`).
