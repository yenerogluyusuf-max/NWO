# Gesamtanalyse Staatsräson, 5. November 2026

Diese Analyse prüft alles im Spiel: jede Ansicht, jeden Knopf, jede Funktion und jedes Wort, dazu Schrift, Artwork, Erklärungen und die Möglichkeiten je Bereich.

Neun Prüfer haben parallel nach demselben Maßstab gearbeitet ([AUFTRAG.md](AUFTRAG.md)). Grundlage waren:
- der Code,
- 41 frisch fotografierte Ansichten,
- eigene Testläufe im Prüfbrowser, darunter ein ausgelöster Krieg, ein Haushaltsfenster sowie die englische und die türkische Fassung,
- die Recherchedateien des Projekts.

Die Einzelbefunde mit Fundstelle (`datei:zeile`), Zitat, Vorschlag und Neufassung stehen in `befund-A.md` bis `befund-I.md`.

## Zahlen

| Bereich | Befunde | Schwere 1 | Schwere 2 | Schwere 3 |
|---|---|---|---|---|
| A Einstieg, Schreibtisch, Ereignisse | 43 | 2 | 25 | 16 |
| B Politik, Parlament, Gesetze | 43 | 9 | 24 | 10 |
| C Kabinett, Personen | 40 | 6 | 26 | 8 |
| D Wirtschaft, Haushalt | 38 | 2 | 26 | 10 |
| E Wähler, Medien, Wahlen | 41 | 5 | 22 | 14 |
| F Land, Bau, Forschung, Ziele | 44 | 7 | 27 | 10 |
| G Außen, Militär, Krieg | 45 | 6 | 27 | 12 |
| H Gestaltung quer | 33 | 8 | 20 | 5 |
| **Zusammen A–H** | **327** | **45** | **197** | **85** |

Die Sprachprüfung I wird nicht nach Schwere gezählt, sondern in Kennzahlen gemessen:
- **Schlüssel:** 15.438 je Sprache, keiner fehlt.
- **Fest im Code:** rund 100 deutsche Texte, die in der englischen und türkischen Fassung erscheinen.
- **Ereignisvorlagen:** 64 von 109 enthalten deutsche Sätze.
- **Zahlenformat:** 79 Stellen mit erzwungenem deutschem Format.
- **Stichprobe** von 150 Texten:
  - Englisch: 133 richtig, 12 holprig, 4 falsch, 1 maschinell.
  - Türkisch: 139 richtig, 7 holprig, 3 falsch, 1 maschinell.

Dazu kommen etwa 120 fertige Neufassungen im Deutschen.

Die Messung des Rundgangs ist zu milde, weil er je Akte nur den ersten Unterreiter misst. Nachgemessen sind „Neue Vorhaben“ 15,9 Bildschirme und „Stätten pflegen“ 9,4 Bildschirme lang. Von den 41 gemessenen Ansichten verletzen 24 die Schwellen.

## Das Urteil in einem Satz

Das Spiel hat eine reiche, gut recherchierte Simulation und einzelne schöne Bilder (3D-Karte, Titelbild, Bildkarten der Vorhaben, Halbrund, Verfassungswerkstatt). Aber an zu vielen Stellen lügt die Oberfläche über die Simulation, dieselbe Sache wird an mehreren Orten anders gesteuert, und es fehlt ein gemeinsames Gestaltungssystem; deshalb wirkt es oft wie eine Behördenakte statt wie ein Spiel.

## Acht Grundprobleme (quer über alle Bereiche)

### 1. Preise und Wirkungen stimmen nicht (Regel 7, „keine Schau“)

Die Oberfläche verspricht Preise und Wirkungen, die der Code nicht einlöst:
- **Kabinett:** Beschlüsse zeigen „2 Kapital“ und „3 Kapital“ und buchen nichts ab (C-1).
- **Ereignisse:** Kanal Istanbul verspricht 6 Kapital und kostet 12, die Putschwarnung verspricht 3 und kostet 5 (A-4, A-5).
- **Haushalt und Zentralbank:**
  - „Ministerium will +2“ bewirkt nichts (D-4).
  - „Vertraulich zur Festigkeit raten“ kostet, ohne den Zins zu ändern (D-12).
- **Wähler:** Die Schnellschätzungen widersprechen der eigenen Vorschau (E-4).
- **Bau:** Ein neuer Auftrag springt umsonst an die Spitze, während Vorziehen 10 Verwaltungskraft kostet; die versprochene Aufgabe fehlt (F-1).
- **Kabinett:** 12 von 17 Ministerien bewirken nichts im Land, zeigen aber „Leistung im Ressort 76 · gut“ (C).
- **Krieg:** Die Friedenspakete zeigen keinen Preis daheim, obwohl der Text sagt, er stehe fest (G).

**Gegenmittel:**
- Jeder Preis wird an einer Stelle gebucht, und der Text wird aus derselben Zahl erzeugt, nicht von Hand geschrieben.
- Ein Wächtertest vergleicht Hinweistext und Wirkung. Der heutige Test prüft nur, ob überhaupt etwas wirkt.

### 2. Dasselbe an mehreren Orten, jedes Mal anders

- **Steuern:** Sie werden im Haushalt ohne Satz gesteuert und in der Politik mit Satz, beides wirkt getrennt. Sechs Posten kosten doppelt, weil Entscheidung F1 nicht umgesetzt ist (D-1 bis D-3).
- **Gesetzgebung:** Es gibt fünf Wege zum Gesetz mit verschiedenen Regeln (B-7).
- **Maßnahmen:** Mindestens 10 Gruppen überschneiden sich (B-6).
- **Zahlen im Parlament:** Die Mehrheitszahl steht fünfmal auf einem Bildschirm.
- **Bau:** Es gibt drei Kataloge für dieselben Vorhaben (F).
- **Rüstung:** drei Modelle mit drei Fertigdaten; KAAN wird gekauft, obwohl er schon läuft (G).
- **Ziele:** Fokus, Programme, Große Ziele, Vorhaben und Vorteile behandeln dieselben Themen fünffach (F-2).
- **Schreibtisch:** Es gibt sieben verschieden benannte Eingangskörbe, und die Startzusage steht doppelt (A-3).
- **Außenpolitik:** Gipfeltreffen und Staatsbesuch sind zwei parallele Systeme (G).

**Gegenmittel:** Jede Größe hat genau einen Ort, an dem man sie stellt. Anderswo erscheint sie nur als Verweis mit Sprung dorthin.

### 3. Regler ohne Einheit

- **Maßnahmen:** 81 von 117 zeigen „NN % des Ausgangs“. Die Seite einer Maßnahme zeigt drei Einheiten zugleich (B-1).
- **Echte Sätze:** Sie springen sinnlos, etwa die Mehrwertsteuer 20 → 17 → 23 % und der Spitzensatz von 0 bis 80 % (B-2).
- **Streitkräfte:** Alle acht Gattungen zeigen „100 %“, das liest sich wie Einsatzbereitschaft (G).

`befund-B.md` §5 nennt für alle 117 Maßnahmen die richtige Einheit oder die benannten Zustände.

### 4. Staatsrecht stimmt nicht mit der Verfassung

- **Gesetzesinitiative:** Der Präsident bringt im Spiel Gesetze ein, das dürfen seit 2017 nur Abgeordnete (Art. 88).
- **Verfahren:** Es fehlen der Ausschuss und das Zurücksenden durch den Präsidenten (Art. 89).
- **Dekret und Gesetz sind vertauscht:**
  - Verteidigung und Polizei lassen sich per Dekret ändern, obwohl das Haushaltsgeld ist.
  - Für die Mehrwertsteuer verlangt das Spiel ein Gesetz, die Quelle im Code nennt einen Präsidialbeschluss.
  - Der Mindestlohn ist im Spiel ein Gesetz, in Wirklichkeit legt ihn eine Kommission fest (B-4).
- **Ausnahmezustand:** Die versprochene Grenze von sechs Monaten fehlt (B-5).
- **Krieg:** Ein Angriff per Erlass umgeht das Parlament. Art. 92 erlaubt das nur bei einem Angriff auf die Türkei (G).

### 5. Mechaniken ohne Gegenspiel

- **Angriffe der Opposition:** Gegen sie gibt es keinen Gegenzug, sie kosten immer die vollen 6 Punkte (E-2).
- **Opposition und Wahl:** Eine geschwächte Opposition ändert die Wahl nicht. Die Rechnung dafür (`gesellschaftWahlDruck`) gibt es, sie wird aber nie aufgerufen (E-3).
- **Barometer:** Es zeigt Zustimmung als Stimmenanteil. 51 % Zustimmung brachten im Test 39,5 bis 50,8 % der Stimmen, 6 von 8 Wahlen gingen verloren (E-1).
- **Stimmenkauf:** Fehlende Stimmen kauft man anonym für 0,5 Kapital je Stimme (B-10).
- **Krieg:** Vom Frieden zum Krieg dauert es einen Tag (G).
- **Kabinett:**
  - Der Chat entlässt einen Minister ohne Rückfrage, mit einem zufälligen Nachfolger (C-2).
  - Wer der Partnerpartei zwei Ministerien gibt, entlässt dabei ohne Hinweis zwei Minister (C).

### 6. Drei Sprachen nur dem Schein nach

Die Kataloge sind vollständig. Trotzdem zeigen Englisch und Türkisch an vielen Stellen Deutsch, weil Texte fest im Code stehen (A-1, C-3, I-1 bis I-8):
- **Ereignisse:** 51 von 94 auslösbaren Ereignissen sind dort deutsch.
- **Weitere Stellen:**
  - Chat
  - Verfassungsvarianten
  - Zentralbank
  - Länder
  - Wirkungsnetz
  - Schwierigkeitsgrade
- **Weitere Mängel:**
  - Der Prolog duzt den Spieler in 63 Texten.
  - Interne Kürzel sind sichtbar, etwa Z1 bis Z9, WIR-2, „Dossier B2“ und „Reich“.
  - Die Begriffe sind uneinheitlich: Kapital und Politisches Kapital, Akte und Dossier.
  - Im Türkischen stehen Begriffe, die seit 2017/18 veraltet sind (Bakanlar Kurulu, tasarı, KHK).

### 7. Kein Gestaltungssystem (befund-H)

- **Farben und Bausteine:**
  - Im Code stehen 1.374 verschiedene Farbwerte, 138 Knopfklassen und über 35 Kartenbauarten.
  - Es gibt sechs Arten von Reitern, und 454 Mal wird Gleichheit mit `!important` erzwungen.
  - Vier von sieben gemeinsamen Bausteinen werden nicht benutzt.
- **„Gut“ hat keine Farbe:** Es erscheint in 23 Tönen, meist im Braun der Schrift. Sichtbar ist deshalb nur Schlechtes in Rot.
- **Schrift:**
  - Fünf Schriftfamilien werden geladen, eine davon wird nicht benutzt.
  - 31 % des Textes stehen in EB Garamond unter 14 px.
  - Courier lässt die Aktenköpfe wie Formulare wirken.
- **Bilder:**
  - Es gibt sieben Bildstile.
  - Kein einziges gemaltes Porträt ist vorhanden, die Gesichter wirken puppenhaft.
  - 19 Motive teilen sich etwa 100 Vorhaben, der Kampfpanzer Altay erscheint als Turm.
  - Auf fast jeder Provinz steht ein Warndreieck.
  - Den Präsidenten zeigt die Kopfleiste als Scherenschnitt.
- **Rückmeldung:** Es gibt kaum Rückmeldung und keine Feiermomente außer beim Wunder.
- **Fokusbaum:** Er ist die hässlichste Ansicht, weil alle Titel abgeschnitten sind.
- **Leere Zustände:** Leere Zeitung und leere Opposition wirken kaputt.

### 8. Die Welt ist flacher, als die Recherche erlaubt

- **Regionen:** In 214 von 262 Werten haben alle 81 Provinzen dieselbe Zahl. „Lage der Regionen“ zeigt keine Region (F-3).
- **Krieg:** Auf der Karte steht nur ein Pfeil mit drei Kreisen, ohne Front und ohne Verbände (G-1).
- **Gesetze:** Rund 1.900 Zeilen recherchierte Gesetzesmodule werden nie geladen (B-8).
- **Haushalt:** Die angelegte Datei mit den Ministeriumshaushalten wird nicht gelesen (D).

## Was gut ist und bleiben soll

- 3D-Karte
- Titelbild
- Bildkarten der Vorhaben
- Halbrund mit 600 Sitzen
- Verfassungswerkstatt (Waage und Stimmzettel bei jedem Knopf)
- Maßnahmenzeile mit Fassungen und Preisfeld
- Wunderfeier
- Kreisfeld der Wähler
- Kabinettstisch als Idee
- Netze und Gefahren als Ringe mit Karte
- der Wächtertest gegen Antworten ohne Wirkung
- die Vollständigkeit der Kataloge

## Arbeitsplan

Der Plan geht in Wellen vor. Jede Welle wird eingecheckt, getestet und gepusht.

**Welle 1, in dieser Nacht:** alles der Schwere 1, das ohne neue Recherche und ohne Grundsatzentscheidung lösbar ist.
- **N1 Kabinett und Personen:**
  - Kapital wirklich abbuchen (C-1).
  - Der Chat führt nie sofort aus (C-2).
  - Partnerministerien nur mit Wahl.
  - Vorlagen richtig zuordnen.
  - Leistungsanzeige nur bei echter Wirkung.
  - Personentexte in die Kataloge (C-3).
- **N2 Wähler und Wahl:**
  - Das Barometer zeigt den erwarteten Stimmenanteil (E-1).
  - Gegenzug zu Angriffen der Opposition (E-2).
  - Die Opposition wirkt auf die Wahl (E-3).
  - Schätzungen gleich der Vorschau (E-4).
  - Wahlkampfreisen zählen (E-5).
  - Speichern und Kopfleiste nach Aktionen.
- **N3 Haushalt:**
  - Eine Steuerung je Steuer (D-1 bis D-3, F1).
  - Kreditwürdigkeit sichtbar.
  - Schauknöpfe weg.
  - Kürzel und „2.029“ weg.
  - Rad und Regler aus derselben Zahl.
- **N4 Gesetzgebung:**
  - Dekret und Gesetz nach Verfassung (B-4).
  - Grenze für den Ausnahmezustand (B-5).
  - Echte Schritte bei den echten Sätzen (B-2).
  - Stimmen sichern mit Gesichtern statt anonymem Kauf (B-10).
  - Mehrheitsanzeige einmal statt fünfmal (B-3).
  - Gesetzeskatalog sichtbar (B-8).
- **N5 Ereignisse und Sprache:**
  - Alle Ereignistexte in die Kataloge (A-1, I-1).
  - Preistexte aus dem Code erzeugt (A-4, A-5).
  - Rücktrittsereignisse nennen die richtige Person (A-2).
  - Prolog mit „Sie“.
  - Interne Kürzel weg.
  - Begriffsregel umgesetzt.
- **N6 Bau und Land:**
  - Baureihenfolge mit Preis, Aufgeben möglich (F-1).
  - Ein Katalog statt drei.
  - Fokusbaum lesbar (F-2).
  - Bild passend zum Vorhaben.
  - Deutsche Reste weg.
- **N7 Krieg und Rüstung:**
  - Kriegseintritt mit Vorlauf und Parlament (Art. 92).
  - Ein Rüstungsmodell mit einem Fertigdatum.
  - Kriegsdossier mit Front und Befehlen oben.
  - Ergebnis jedes Klicks sichtbar.
  - Streitkräfte als Zustände.
- **N8 Gestaltungssystem:**
  - Farbtokens mit eigener Farbe für „gut“.
  - Drei Schriftfamilien und sieben Größen.
  - Globale Knopfregel weg.
  - Reiter vereinheitlicht.
  - Leere Zustände gestaltet.
  - Warndreiecke nur bei echtem Fall.
  - Rückmeldung bei Klicks.

**Welle 2, braucht Recherche:**
- echte Einheiten und Startwerte 2026 für die 81 Regler (B-1, Tabelle in befund-B §5),
- Unterschiede der Provinzen aus den Recherchedateien (F-3),
- Ministeriumshaushalte aus der angelegten Datei (D).

**Welle 3, braucht eine Entscheidung des Projektinhabers:**
- gemalte Porträts: bezahlte Bilderzeugung oder Zeichnung,
- Krieg als Kartenbühne wie Hearts of Iron 4 mit Front und Verbänden (groß),
- Zusammenlegen von Fokus, Programmen und Großen Zielen,
- Kosten für das Stoppen einer Maßnahme.
