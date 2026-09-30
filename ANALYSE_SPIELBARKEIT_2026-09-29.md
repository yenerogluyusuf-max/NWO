# Staatsräson — Analyse: Spielbarkeit, Karte, Detailtiefe

Stand: 29. September 2026, abends. Anlass: Der Projektinhaber hält das Spiel für unspielbar, die Karte für zu unscharf, das Design für noch nicht schön genug und den Detailgrad „in praktisch allem“ für zu flach (Beispiel: Man sieht nicht, wo es Probleme gibt und wo Straßen fehlen).

Belege liegen in [`analyse_2026-09-29/`](analyse_2026-09-29/): wiederholbare Messung ([`messungen.test.ts`](analyse_2026-09-29/messungen.test.ts), Ausgabe [`messungen_ausgabe.txt`](analyse_2026-09-29/messungen_ausgabe.txt)), Screenshots und die Browser-Skripte ([`belege/`](analyse_2026-09-29/belege/)). Nichts am Spiel wurde verändert.

## 0. Kurzurteil

1. **Das Urteil des Projektinhabers stimmt, und es lässt sich messen.** Das Spiel ist eine gut gebaute Simulation mit Oberfläche, aber noch kein Spiel: Es gibt keine Ereignisse, keine Ziele, keine Gegner, keinen Engpass und kein Ende. Wer fünf Jahre nichts tut, steht am Ende besser da als die meisten, die etwas tun.
2. **Die Unschärfe hat eine klare technische Ursache**, keine Geschmacksfrage: Linien, Grenzen und Beschriftung sind ein festes Bild (4800 Pixel breit), das beim Hineinzoomen vierfach vergrößert wird; das Relief hat eine Auflösung von etwa 1,5 km. Das lässt sich mit Nachschärfen nicht beheben, die Kartenbasis muss anders aufgebaut werden.
3. **Die fehlende Tiefe ist strukturell**, nicht nur fehlender Inhalt: Alle 90 Maßnahmen wirken auf das ganze Land gleich (0 von 90 haben einen Ort), von 199 Größen unterscheiden sich nur 37 zwischen den Provinzen, und es gibt keine Bezirke, keine Straßen, keine Objekte. Die Frage „Wo fehlt was?“ kann das Spiel heute nicht beantworten, weil die Daten dafür nicht existieren.
4. **Ursache im Vorgehen:** Breite vor Tiefe. 67.612 Wörter Plan, 199 Knoten in 12 Themenfeldern, aber 1.659 Zeilen Simulation und keine Spielschleife. Die Entscheidung „S1 vollständig bauen, dann testen“ (Entscheidungen D/G) hat genau das Risiko ausgelöst, das dort benannt wurde: Das Kernerlebnis wurde erst spät geprüft.
5. **Empfehlung** (Abschnitt 6): erst die drei Sofortfehler beheben, dann die Karte auf Kacheln umstellen (ein Versuch, eine Sitzung), dann **einen Bereich vollständig in die Tiefe bauen** („Bauen und Versorgen“: Straßen, Wasser, Strom, Krankenhäuser, Erdbebensicherheit, auf Bezirksebene, mit Ereignissen und Gegenspielern), statt weitere Themenfelder in die Breite zu ziehen.

## 1. Was geprüft wurde und wie

| Prüfung | Weg | Ergebnis |
|---|---|---|
| Code und Tests | Alle Simulations- und Oberflächendateien gelesen; `tsc --noEmit`; `vitest run` | Typprüfung sauber, 35 Tests grün |
| Spielverlauf | Simulationskern fünf Jahre lang ohne Oberfläche laufen lassen: ohne Eingabe, mit Extremen | Abschnitt 2 |
| Spielablauf im Browser | Playwright mit Chromium und GPU (Apple M4, Metal), Fenster 1512 × 982 wie im Screenshot des Projektinhabers (Kartenmessung mit Pixelfaktor 2, Spielablauf mit 1): Titel, Prolog, Karte, alle Ebenen, Tempo 3 | Abschnitte 2 und 4 |
| Karte | Übersicht und maximaler Zoom bei Adana/Hatay reproduziert; Textur-, Netz- und Kamerawerte aus dem Code | Abschnitt 4.1 |
| Gespräch | 40 natürliche Eingaben gegen die Befehlsauswertung | Abschnitt 4.4 |
| Plan gegen Code | Entscheidungen, Spieldesign (Säulen, Abschnitte 9–10), Szenarien gegen den Quelltext | Abschnitt 3 |

**Nicht geprüft:** Spaß und Verständlichkeit durch echte Spieler (das kann ich nicht messen; es braucht Ihren Spieltest), die Kalibrierung gegen Realdaten, Ton, Sicherheit, die Chrome-Erweiterung (nicht verbunden, deshalb Playwright).

## 2. Befund A: Es gibt keine Spielschleife

### 2.1 Fünf Jahre ohne Eingabe (Seed 42, Messung 1)

| | Start Juni 2028 | Jahr 3 | Jahr 5 |
|---|---|---|---|
| Inflation | 31,5 % | 16,0 % | 7,5 % |
| Leitzins | 37 % | 22,5 % | 11,5 % |
| Vertrauen in die Regierung | 45,0 | 46,4 | 57,7 |
| Akute Probleme | 8 | 8 | 8 |
| Ereignisse, die den Spieler betreffen | 0 | 0 | 0 |

Die Welt beruhigt sich von selbst, es kommt kein Schock, und die acht akuten Probleme bleiben fünf Jahre lang unverändert. Von 183 Protokolleinträgen sind bis auf die zwei Startmeldungen alle Zinsentscheide oder Statistikmeldungen. **Nichts tun ist eine gute Strategie.**

### 2.2 Es gibt eine beste Strategie, und sie ist billig

Das Spieldesign verlangt: „Wenn Spieler nach drei Durchgängen eine beste Strategie gefunden haben, ist der Konflikt schlecht gebaut“ (Spieldesign 0, Säule 1). Gemessen:

| Fall | Ergebnis nach 5 Jahren |
|---|---|
| **Alle 90 Maßnahmen auf 100** | Vertrauen 100 (ab Jahr 3), akute Probleme 8 → 1, Wachstum 6,9 %, Schulden nur 23,8 → 37,3 % des BIP |
| **Preiskontrollen für Lebensmittel auf 100** (allein) | Vertrauen 47,0 → 63,9 nach 3 Jahren, Kosten 0,08 % des BIP |
| **Mietpreisbremse auf 100** (allein) | Vertrauen 58,5, Kosten 0,00 % des BIP |
| **Ausgaben +20 Prozentpunkte des BIP und gefügige Zentralbank** | Wachstum 18,5 % im ersten Jahr (unrealistisch); danach Inflation um 42 %, Lira 341, Vertrauen 23,7, aber kein Zusammenbruch, keine Krise, kein Ende |

Ursache: Die Kantengewichte sind klein (Median 0,03 je Monat, Maximum 0,10). Von 90 Maßnahmen haben 83 Kosten; die teuersten kosten bei Stufe 100 höchstens 1,2 % des BIP (die fünf teuersten: 1,2; 1,0; 1,0; 0,6; 0,6). Beispiel Preiskontrollen: Sie senken die Größe „Lebenshaltung“ schon nach einem Monat (Kante −0,04), und diese wiederum das Misstrauen in die Regierung (Kante −0,04, ein Monat). Die Gegenwirkungen sind vorhanden, wirken aber langsamer und schwächer: graue Märkte (Kante 0,03, nach 3 Monaten) und sinkende Einkommen der Landwirte (Kante −0,04, nach 6 Monaten). Dass die Schuldenquote bei hoher Inflation kaum steigt, folgt aus der Formel Z7: Nominales Wachstum senkt die Quote. Gegen das Designgebot „Härte des echten Lebens“ ist das Ergebnis weich. Alle Parameter sind laut Code Platzhalter (`economy.ts`), die Kalibrierung steht aus.

### 2.3 Was im Spiel nie passiert

| Element laut Plan | Im Code |
|---|---|
| 19 Ereignisvorlagen (Währungsrutsch, Erdbeben, Dürre, Anschlag, Korruptionsaffäre, Mietproteste …) | keine; es gibt genau zwei Ereignisquellen: die Amtsübergabe und die Zinssitzung |
| Parlament als Engpass („Gesetze brauchen 301 Stimmen“) | nur Anzeige; `setPolicy` prüft keine Mehrheit. Bei 124 von 600 Sitzen warnt die Kopfleiste, aber jede Maßnahme geht durch |
| Wahlen, Umfragen, Wiederwahl | Die Wahl 2028 ist der Startzustand; danach keine Umfrage, kein Wahltag. Die Titelzeile verspricht „fünf Jahre“, aber das Spiel endet nie |
| Figuren (mehr als 20, Kabinett, Rivalen, Zusagen-Gedächtnis) | keine; die Mentorin besteht aus vier Textbausteinen |
| Ziele, Agenda, Bilanz, Geschichtsbuchkapitel | nicht vorhanden |
| Außenwelt (Öl, EU-Nachfrage, Weltzinsen, Nachbarn, Militär, Diplomatie) | nicht vorhanden; die Türkei ist eine geschlossene Volkswirtschaft |
| Erster Spieltag mit drei drängenden Vorgängen (Entscheidungen E) | nach „An die Arbeit“ passiert nichts; man muss selbst wissen, was zu tun ist |
| Speichern und Laden | nicht in der Oberfläche; „Fortsetzen“ ist dauerhaft gesperrt. Ein Neuladen der Seite löscht die Partie |
| Schwierigkeit, Optionen, Ton | nicht vorhanden |

### 2.4 Der einzige „Rhythmus“ stört

Alle 45 Tage hält das Spiel an und öffnet ein Fenster „Geldpolitischer Ausschuss“ (der Zins wird gesetzt, der Spieler kann nichts tun, Knopf: „Zur Kenntnis genommen“). Bei Tempo 3 stand in jeder der 24 Messungen im Abstand von 2,5 Sekunden ein solches Fenster, und das Tempo fällt jedes Mal auf Pause. Das Design sagt: „Vorspulen endet immer bei etwas Interessantem“ und „Aktenarbeit ohne Entscheidung tötet Spaß“. Hier ist es umgekehrt: Das Einzige, das passiert, ist das Uninteressanteste.

### 2.5 Die sieben Säulen des Spielspaßes gegen den Stand

| Säule (Spieldesign 0) | Stand |
|---|---|
| 1 Dilemmas statt Optimierung | nicht erfüllt: dominante Strategien (2.2) |
| 2 Figuren, an denen man hängt | nicht vorhanden |
| 3 Die Vergangenheit kommt zurück | nicht vorhanden (Zusagen aus dem Prolog werden nur angezeigt) |
| 4 Druck und Rhythmus | nicht vorhanden; nichts rückt näher |
| 5 Macht mit Preis statt Verbot | ansatzweise (Zentralbank, Vorschau mit Kosten), sonst weich |
| 6 Geschichten, die man weitererzählt | nicht möglich, weil nichts geschieht |
| 7 Verstehen, was man tut | teilweise: „Warum?“ an jeder Verbindung ist eine echte Stärke; die Mentorin ist zu dünn |

## 3. Befund B: Die Detailtiefe fehlt überall

Der Projektinhaber hat recht, dass Straßen nur ein Beispiel sind. Es ist dasselbe Muster in jedem Bereich: Der Plan beschreibt einen Bereich in Tiefe, der Code bildet eine Zahl ab.

### 3.1 Räumlich: Das Land hat keine Orte

- **Auflösung:** 81 Provinzen; keine Bezirke (0 Treffer im Code), obwohl Istanbul, Ankara und Izmir laut Entscheidungen aufklappbar sein sollen.
- **Objekte:** Straßen, Bahn, Häfen, Flughäfen, Kraftwerke, Talsperren, Krankenhäuser, Schulen, Baustellen existieren weder als Daten noch auf der Karte, obwohl das Spieldesign sie ausdrücklich für die Karte verlangt (Spieldesign 1, „Bildstil“).
- **Datenlage je Provinz:** 12 Felder (Kennziffer, Name, Region, NUTS-2-Gebiet, Einwohner, Wirtschaftskraft je Kopf, Arbeitslosigkeit mit Herkunftsangabe, Sitze, Ergebnis 2023 für fünf Parteien, Rathaus 2024, Großstadtmerkmal). Kein Feld zur Infrastruktur.
- **Das „je Provinz gerechnet“ ist überwiegend Schein:** Von 199 Größen unterscheiden sich beim Start nur 37 zwischen den Provinzen (20 von 86 Größen, 9 von 15 Problemen, alle 8 Wählergruppen, **0 von 90 Maßnahmen**). Die 29 Regionalformeln sind grobe Ableitungen (etwa Potenzen der Wirtschaftskraft, Listen von Erdbebenprovinzen), keine Messwerte; der Code sagt das selbst („sollen Unterschiede in die richtige Richtung zeigen, nicht messen“).
- **Maßnahmen haben keinen Ort:** `setPolicy(welt, maßnahme, stufe)` kennt keinen Ort. Beispiel Wasserleitungen: Wirkung auf die Wasserversorgung nach drei Jahren in jeder der 81 Provinzen exakt gleich (+17,17), auch dort, wo es kein Wasserproblem gibt. Die Entscheidung des Projektinhabers „Probleme können im Westen bestehen und im Osten nicht, vor Ort muss gebaut werden“ (Entscheidungen B) ist damit nicht umgesetzt.
- **Die Ebene „Akute Probleme“** färbt Provinzen nach der *Anzahl* der Probleme, ohne Legende und ohne Angabe, *welches* Problem wo herrscht; das steht nur im Kartenblatt einer angeklickten Provinz. „Wo gibt es keine Straßen?“ ist nicht beantwortbar.

### 3.2 Systemisch

| Bereich | Plan | Code |
|---|---|---|
| Wirtschaft | Branchen wie im echten Leben (Tourismus, Industrie/Export, Landwirtschaft, Bau, Energie) mit regionalem Schwerpunkt | eine Volkswirtschaft mit Zinsen, Nachfrage, Inflation, Wechselkurs; keine Branchen, kein Außenhandel, kein Haushalt als Einnahmen und Ausgaben (nur ein „Impuls“ in Prozent des BIP) |
| Bauen | Auftrag → Ministerium → Ausschreibung → Baufirma → Bau → Abnahme, mit Verzögerung und Korruption, Fortschritt auf der Karte | ein Regler „Stufe 0–100“ mit Umsetzungsdauer in Monaten |
| Katastrophen | Erdbeben, Flut, Waldbrand nach realer Gefährdung, Vorsorge verändert die Folgen | ein Wert „Erdbebengefahr“; kein Beben tritt je auf, das Beben von 2023 kommt im Spiel nirgends vor (weder in Hatay noch in Kahramanmaraş) |
| Außenpolitik, Militär, Mediation, Großprojekte | vier ausgearbeitete Dokumente | nichts |
| Medien, Justiz, Geheimdienst, Opposition | eigene Akteure mit Zielen | nichts |
| Mentorin, Lernen | Gespräch, Randnotizen, Lern-Tor | vier feste Randnotizen ohne Gespräch |
| Politiknetz | Democracy-4-Logik: das ganze Netz sichtbar | 199 Knoten und 412 Verbindungen sind gerechnet, die Ansicht zeigt aber immer nur einen Knoten mit seinen direkten Nachbarn |

Die Dokumentenlage folgt dem nicht mehr: `POLITIKNETZ.md` und `README.md` nennen 186 Knoten und 363 (bzw. 77 Maßnahmen), der Code hat 199 Knoten, 412 Verbindungen und 90 Maßnahmen.

## 4. Befund C: Karte, Design und Bedienung

### 4.1 Warum die Karte unscharf ist (Ursache)

Die Karte ist eine 3D-Fläche (Three.js), auf die zwei feste Bilder gelegt werden (`overlay.ts`, `scene.ts`). Aus Kamera- und Texturwerten (Rechnung, bestätigt durch Screenshot `belege/02_karte_maximaler_zoom_hatay.jpg`):

| Ebene | Auflösung | Maßstab am Boden | Bei maximalem Zoom auf dem Bildschirm |
|---|---|---|---|
| Höhendaten (`relief.bin`, AWS Terrain Zoom 7) | 1800 × 1120 für 31° × 15° | etwa 1,5 km je Höhenpunkt | etwa 11-fach vergrößert |
| Gitternetz des Reliefs | 600 × 373 Eckpunkte | etwa 4,5 km je Eckpunkt | ein Eckpunkt entspricht etwa 33 Geräte-Pixeln: Schattierung als weiche Flecken |
| Bild für Grenzen, Flüsse, Flächen, Ländernamen | 4800 Pixel Breite | etwa 0,56 km je Bildpunkt | etwa 4,1 Geräte-Pixel je Bildpunkt: verwaschene, treppenförmige Linien |
| Wassertiefe (Küstenlinie) | 1800 × 1120 | etwa 1,5 km | gezackte Küste, versetzt zur Vektorküste |

In der Übersicht (Kameraabstand 13 bis 15,5) liegt etwa ein Geräte-Pixel auf einem Bildpunkt (0,9 bis 1,1): dort ist die Karte scharf. **Schärfe geht also genau dann verloren, wenn man hineinzoomt, um Details zu sehen.** Ein höherer Wert für `OVERLAY_W` verschiebt das Problem nur (Speicher wächst quadratisch, Höchstgrenze der Grafikkarte 16.384 Pixel, Zeichenzeit steigt). Das Prinzip „Vektordaten in ein festes Bild rastern“ trägt keine Kartentiefe.

Dazu passt eine Abweichung im Plan: `TECHNIK.md` beschließt „SVG aus GeoJSON mit d3-geo“ und die Entwicklungsplanung nennt MapLibre GL; gebaut wurde etwas Drittes.

### 4.2 Weitere Kartenmängel (gesehen in den Screenshots)

- **Der Kartenrand ist sichtbar:** Im Osten und Süden endet die Weltfläche mit einem Streifenmuster bzw. einer harten Kante (Screenshot des Projektinhabers, Übersicht).
- **Beschriftung:** Städtenamen sind in der Übersicht etwa 8 bis 10 Pixel groß (11,5 px Schrift, mit dem Zoom auf 0,62 bis 1,5 skaliert) und kaum lesbar. Der Schriftzug „TÜRKİYE“ liegt halbtransparent und unscharf über den Städten. Nur 30 von 81 Provinzen (die Großstadtkommunen) tragen ein Etikett.
- **Farbe:** Die Türkei ist im „Politisch“-Modus einfarbig kupfern (`NATION_COLOR`); Provinzen sind nur durch dünne gestrichelte Linien getrennt. Das Relief wirkt wie zerknittertes Leder, nicht wie ein gemalter Atlas.
- **Keine Kartenobjekte,** keine Straßen, keine Bezirke, keine Meldungen auf der Karte, wo etwas geschieht.
- **Fenster bedecken die Karte:** Jede Akte öffnet ein großes Fenster über der Karte; es ist immer nur eines offen. Man kann in der Akte etwas beschließen und die Wirkung nicht gleichzeitig auf der Karte sehen.

### 4.3 Oberfläche und Bedienung

| Befund | Beleg |
|---|---|
| **Kopfleiste bricht um und schneidet Werte ab**: Zahl, Pfeil und Änderung stehen dreizeilig, „124 / 600 Sitze“ bricht in zwei Zeilen, „Lira je $“ in drei | Screenshot `belege/04_...`, Screenshots des Projektinhabers |
| **Die Vorschau blockiert die Oberfläche.** Klick auf eine Entscheidungskarte bis zum nächsten Bild: 3.358 ms im Browser (2.200 ms im Kern allein). Ursache: 128 Kopien des Weltzustands (je 15 ms, 1,6 MB) im Hauptthread | Messung 5 und Browser-Messung |
| **Die Vorschau sagt oft nichts.** Bei Stufe 54 gegen 55 lautet jede Zeile „kaum Unterschied“; „Änderung −0,0 % BIP/Jahr“ erscheint mit Vorzeichen bei null | Screenshots des Projektinhabers |
| **Der Graph des Politiknetzes** zeigt nur einen Knoten mit höchstens 8 Ursachen und 8 Wirkungen (`NetGraph.tsx`, `MAX = 8`) und lässt große Flächen leer; einen Überblick über das ganze Netz gibt es nicht | Screenshots des Projektinhabers, Code |
| **ASCII-Umlaute im Spieltext** („Moeglich“, „Erhoehe“, „Kanzlei“ statt „Mentorin“) gegen die Regel „Umlaute statt ae/oe/ue“ | `befehle.ts`, Screenshot |

### 4.4 Das Gespräch (die Kernidee des Spiels)

Das „freie Sprachgespräch“ besteht aus Schlüsselwortregeln in `befehle.ts`; ein Sprachmodell ist nicht angebunden (0 Treffer). Messung 3 mit 40 natürlichen Eingaben:

| Ergebnis | Anzahl |
|---|---|
| angenommen | 15 |
| davon **falsch ausgeführt** | 4 |
| abgelehnt („nicht als Auftrag verstanden“) | 25 |
| **korrekt ausgeführt** | **11 von 40** |

Die vier Fehlausführungen sind schwerwiegend, weil sie dem eigenen Prinzip widersprechen („Unklare Anweisungen führen zu einer Rückfrage, nie zu einer ungewollten Ausführung“):

- **„Senke die Mehrwertsteuer“ und „Mehrwertsteuer senken“ erhöhen sie von 60 auf 85.** Ursache: „Mehrwertsteuer“ enthält „mehr“ und zählt als Erhöhen-Wort.
- „Rede an die Nation halten“ wird als Zeitstopp gelesen („halt“) und antwortet „Die Zeit läuft nicht“.
- „Erdbebenhilfe für Hatay“ wird als „Hilfe“ gelesen und gibt den Hilfetext aus.

Nicht verstanden werden: Krieg, Truppen, Verhandeln, Neuwahlen, Minister entlassen, Bauprojekte, Steuern erhöhen, Schulen bauen, „Wie stehe ich in den Umfragen?“, „Was soll ich als Nächstes tun?“, „Was ist das größte Problem?“.

Fair gelesen betrifft ein Teil davon Funktionen, die es im Spiel noch gar nicht gibt (Krieg, Kabinett, Wahlen). Das Gespräch sagt das aber nicht, sondern antwortet mit „Das habe ich nicht als Auftrag verstanden“ und drei Beispielen. Der Spieler kann nicht unterscheiden, ob er sich falsch ausgedrückt hat oder ob das Spiel es nicht kann, und wird in dem Moment enttäuscht, in dem er dem Spiel das erste Mal traut. Ein ehrliches „Das gibt es in diesem Stand des Spiels nicht“ und eine Liste der vorhandenen Handlungen wäre sofort besser.

### 4.5 Was gut ist (damit es nicht verloren geht)

- Der Simulationskern ist **sauber getrennt, deterministisch, sehr schnell** (ein Spieljahr in wenigen Millisekunden) und speicherbar (Weltzustand ist reines JSON). Das trägt jeden weiteren Ausbau.
- Jede der 412 Verbindungen hat einen „Warum“-Satz: das beste Fundament für Lernen und Erklären.
- Die Startdaten haben Herkunft (belegt, abgeleitet, geschätzt) und einen Stichtag; die Provinzdaten stammen aus Quellen.
- Die Oberflächensprache (Messing, Papier, Siegel, Randnotizen) ist geschlossen und wiedererkennbar; die Karte läuft mit 60 Bildern pro Sekunde, ohne Konsolenfehler.
- Der Prolog ist gut geschrieben und verändert echten Zustand (Wählergruppen, Heimat, Bündnis, Parlament).
- Typprüfung sauber, 35 Tests grün, ein Playwright-Durchlauf existiert bereits (`e2e/spiel.mjs`).

## 5. Ursachen: Warum es so gekommen ist

| Ursache | Beleg |
|---|---|
| **Breite vor Tiefe.** 12 Themenfelder mit 199 Knoten wurden gleichzeitig angelegt, statt einen Bereich zu Ende zu bauen | 199 Knoten, davon 37 mit Regionalwerten; 0 Objekte |
| **Plan überholt Code.** 67.612 Wörter Dokumente (davon 27.212 Recherche), 1.659 Zeilen Simulation, 32 Commits in etwa 31 Stunden (28.09. 13:02 bis 29.09. 20:32) | Dokumente und `git log` |
| **Das Spaß-Tor wurde nie durchlaufen.** Entscheidung: „S1 wird vollständig gebaut und dann getestet“; das dokumentierte Risiko („Trägt das Kernerlebnis nicht, zeigt sich das erst spät“) ist eingetreten | Entscheidungen D und G |
| **Tests prüfen „läuft“, nicht „ist ein Spiel“.** 35 Tests: Reproduzierbarkeit, Plausibilität, Vorschau. Keiner prüft dominante Strategien, Ereignisdichte oder die Richtigkeit von Befehlen | `test/` |
| **Platzhalter-Parameter bleiben.** Alle Kopplungen sind unkalibriert; ohne Ereignisse fällt das nicht auf | `economy.ts`, `world.ts` (COUPLING) |
| **Falsche Kartenbasis für die gewünschte Tiefe.** Ein festes Bild kann keine Straßen, Bezirke und Hunderttausende Objekte scharf tragen | 4.1 |
| **Zwei Ordner, veraltete Entscheidungen.** `~/Desktop/NWO NEW WORLD ORDER/` (ohne Code) enthält eine ältere `ENTSCHEIDUNGEN.md` (5.205 statt 13.640 Bytes: Blöcke I und J fehlen) und `ARBEITSPROMPT.md` nennt diesen alten Ordner als Projektordner. Eine neue Sitzung dort arbeitet mit überholten Regeln | Dateigrößen |
| **Der Plan widerspricht der Priorität.** `PLANERWEITERUNG.md` führt Anwaltspaket, Steam-Anfrage und Markenrecherche als „P0“, obwohl Entscheidung J (29.09.) sagt: lokal, kein Vertrieb, kein Anwalt als Voraussetzung | `PLANERWEITERUNG.md`, `ENTSCHEIDUNGEN.md` J |

## 6. Empfehlung

### 6.1 Leitgedanke

Kein weiteres Themenfeld, keine weitere Maßnahme, bevor **ein** Bereich so tief ist, dass man ihn gern spielt. Tiefe heißt: Orte und Objekte auf einer scharfen Karte, Dinge, die geschehen, Gegenspieler, ein Preis für jede Entscheidung und eine Messung, die das prüft.

### 6.2 Reihenfolge

| Stufe | Inhalt | Aufwand (Schätzung) | Fertig, wenn |
|---|---|---|---|
| **0 Sofortfehler** | Befehlsauswertung (Mehrwertsteuer, „halt“, „Hilfe“, ASCII-Umlaute); Kopfleiste ohne Umbruch; Vorschau nebenläufig (Web Worker) und ohne Vollkopie; Zinssitzung als Meldung statt als Pause; Speichern und Laden anbinden; Ordner zusammenführen und Entscheidungen K eintragen; `messungen.test.ts` als feste Prüfung ins Repo | 1 Sitzung | Messung 3 ohne Fehlausführung, Vorschau unter 200 ms, „Fortsetzen“ geht |
| **1 Kartenbasis** | Zuerst ein Versuch in einer Sitzung an Adana/Hatay: Vektorkacheln (Provinzen, Bezirke, Straßen, Flüsse, Beschriftung) und Höhenkacheln statt eines festen Bildes; danach Umbau | Versuch 1 Sitzung, Umbau mehrere | Grenze und Straße bei maximalem Zoom scharf, 60 Bilder pro Sekunde, Aussehen mindestens so schön wie heute |
| **2 Vertikaler Schnitt „Bauen und Versorgen“** | Bezirke als Recheneinheit; Straße, Bahn, Wasser, Strom, Krankenhaus, Schule als Objekte mit Erreichbarkeit; ortsbezogene Bauaufträge mit Ausschreibung, Verzögerung, Korruption; Erdbeben und Dürre als Ereignisse aus Gefährdung; Ebene „Wo fehlt was?“ | mehrere Sitzungen | Man sieht auf der Karte, wo Straßen und Versorgung fehlen, beauftragt dort einen Bau und erlebt Folgen (Verzug, Affäre, Beben) |
| **3 Spielschleife** | Ereignismotor mit den 19 Vorlagen als Muster; Außenwelt (Öl, EU-Nachfrage, Weltzinsen); Parlament und Koalitionspartner als Engpass; erste 8 bis 10 Figuren mit Zielen und Zusagen-Gedächtnis; Ziele, Umfragen, Wahl, Ende mit Bilanz | mehrere Sitzungen, teils parallel zu 2 | Fünf Jahre ohne Eingabe sind keine gute Strategie; „alles auf 100“ ist keine mehr; mindestens ein Ereignis je Spielmonat |
| **4 Gespräch** | Sprachmodell mit dem Schlüssel des Spielers über einen geschlossenen Aktionskatalog; die Regeln bleiben als Rückfall, dazu Auswahlknöpfe statt freiem Text ohne Schlüssel | 1 bis 2 Sitzungen | 40-Eingaben-Test: mindestens 35 korrekt, keine Fehlausführung |
| **5 Kalibrierung und Härte** | Kosten und Gegenwirkungen gegen Lernfälle (Zentralbankwechsel 2019, Lira 2021/22, Erdbeben 2023) prüfen | fortlaufend | Fälle reproduzierbar |

Warum „Bauen und Versorgen“ als erster Schnitt: Er ist die Frage des Projektinhabers (Straßen, Probleme sichtbar), er ist bereits entschieden (Entscheidungen B: „vor Ort muss gebaut werden“), er braucht dieselben Bausteine wie alles Weitere (Bezirke, Objekte, Erreichbarkeit, Bauabwicklung, Ereignisse), und er erzeugt von selbst Dilemmas: Wahlkreis oder Bedarf, billig oder sauber, schnell vor der Wahl oder solide.

### 6.3 Datenlage für Stufe 1 und 2 (geprüft, nicht heruntergeladen)

| Quelle | Befund |
|---|---|
| Höhenkacheln (dieselbe Quelle wie bisher, AWS Terrain, Terrarium) | Zoom 10 und 12 sind abrufbar (je eine Testkachel von 80 bis 90 KB). Rechnerisch etwa 950 m je Pixel bei Zoom 7, etwa 120 m bei Zoom 10 auf 39° Nord. Die heutige Datei ist zusätzlich auf 1,5 km heruntergerechnet. Schätzung für die Türkei bei Zoom 10: etwa 1.350 Kacheln, rund 115 MB (aus Kachelraster und gemessener Kachelgröße, nicht heruntergeladen) |
| OSM-Extrakt Türkei (Geofabrik) | vorhanden, Stand 28.09.2026, 648 MB; enthält nach allgemeiner Kenntnis Straßen, Bahn, Verwaltungsgrenzen, Häfen, Krankenhäuser und Schulen (Inhalt nicht geprüft, Umfang je Bezirk zu prüfen). ODbL: Namensnennung nötig (im Plan als Quellen-Menü vorgesehen) |
| Bezirksgrenzen (İlçe) | im OSM-Extrakt oder über das humanitäre Datenportal der UN (HDX), beides zu prüfen; das Projekt schließt GADM aus (Lizenz) |
| Statistik auf Bezirksebene | TÜİK: Zellen unter drei Einheiten sind geheim; die Belegregel („fehlender Wert wird nicht durch Landesmittel ersetzt“) gilt weiter. Manches auf Bezirksebene wird abgeleitet und als geschätzt gekennzeichnet werden müssen |

Mengenbedarf der Rechnung: 973 Bezirke × 199 Größen sind etwa zwölfmal so viele Werte wie heute (81 × 199). Der Kern bleibt schnell (heute wenige Millisekunden je Jahr), aber der Weltzustand wird zwölfmal so groß (Kopie heute 15 ms, 1,6 MB). Deshalb gehört die Vorschau in Stufe 0 auf Änderungsverfolgung statt Vollkopie (Schätzung, nicht gemessen).

### 6.4 Kartenbasis: Empfehlung und Risiko

**Empfehlung:** Kachelkarte mit MapLibre GL (im Plan bereits als Kandidat genannt) und lokalem PMTiles-Archiv. Vektorkacheln bleiben bei jedem Zoom scharf, tragen Millionen Linien und Objekte, färben Bezirke nach jedem Wert ein (Ebene „Wo fehlt was?“) und setzen Beschriftungen ohne Überlappung. Das ist genau die Anforderung „in allem tiefer ins Detail“.

**Risiko:** Der Look. Der heutige gemalte 3D-Atlas ist durch eigene Shader entstanden; die Kachelkarte muss ihn über Stil, Papiertextur und Geländeschattierung nachbauen. Deshalb der eine Sitzung lange Versuch **vor** dem Umbau, mit dem Kriterium „mindestens so schön wie heute, scharf bei jedem Zoom“.

**Alternative:** Bei Three.js bleiben, Linien und Beschriftung in Geräte-Pixeln pro Bild neu zeichnen, Höhenkacheln nachladen. Der Look bleibt erhalten, aber Straßen, Bezirke, Kacheln und Beschriftungslogik müssen selbst gebaut werden; das ist mehr Arbeit für weniger Ergebnis.

## 7. Was ich von Ihnen brauche

1. **Kartenbasis:** Sind Sie mit dem Versuch einer Kachelkarte (Stufe 1) einverstanden, mit der Alternative als Rückfall? Ich empfehle das.
2. **Reihenfolge:** Stufe 0, dann Kartenversuch, dann der Schnitt „Bauen und Versorgen“ mit dem Kern der Spielschleife? Oder soll ein anderer Bereich der erste in voller Tiefe sein (etwa Wasser und Dürre, Energie, Gesundheit)?
3. **Aufräumen:** Darf ich die Beobachtungen als Block K in `ENTSCHEIDUNGEN.md` eintragen (Qualitätsurteil, Detailgrad in allem, scharfe Karte, Spielbarkeit als Prüfung), den Ordner `NWO NEW WORLD ORDER` zu einem Verweis auf dieses Repository machen und `PLANERWEITERUNG.md` an Entscheidung J angleichen?
4. **Später:** Für das Gespräch mit Sprachmodell wird ein Schlüssel und ein Kostenrahmen gebraucht. Vor jeder Messung mit bezahlter Schnittstelle frage ich.

### Vorschlag für Block K in ENTSCHEIDUNGEN.md (noch nicht eingetragen)

| Thema | Vorschlag |
|---|---|
| Qualitätsurteil 29.09. | Das Spiel gilt als unspielbar, die Karte als zu unscharf, das Design als noch nicht schön genug, der Detailgrad in praktisch allem als zu flach |
| Detailgrad | Der Spieler muss sehen können, wo Probleme bestehen und wo Versorgung fehlt (Straßen usw.); Tiefe vor Breite: ein Bereich vollständig, bevor der nächste beginnt |
| Karte | Scharf bei jedem Zoom; Bezirke, Straßen, Bahn, Häfen und Bauprojekte als echte Objekte |
| Prüfung | Spielbarkeit wird gemessen (dominante Strategie, Ereignisdichte, Richtigkeit der Befehle), nicht angenommen |
