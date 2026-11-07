# A4: Sicherheit (ohne den Krieg) und Medien

Analyse mit Umbauplan, kein Umbau. Stand: Code `b0ce3f3`, Spielstand des Inhabers vom 3. August 2043 (Tag 5537), dazu ein frisches Spiel (Seed 7, Juni 2028). Arbeitskopie `…/welle/a4/wt` (abgeräumt), Port 5234 (beendet). Bilder liegen in `…/welle/a4/bilder/`. Die Messsonde liegt in `…/welle/a4/werk/` (`sonde-inhaber.json`, `sonde-frisch.json`).

Alle Dateiangaben beziehen sich auf `game/src/`. Zahlen aus dem Code heißen „Spielparameter“, wenn der Code sie so führt. Echte Zahlen stehen mit Quelle in der Rechercheliste (Abschnitt 7).

---

## 0. Kurz

**Sicherheit:**
- Der Bereich stellt keine Frage. Er zeigt einen Index, „Kampfkraft +9 % gegenüber 2026“.
- Rüstung kauft man an drei Stellen: Gattungen, Bauliste und Politik. Alle drei zahlen sich nur im Krieg aus. Kriege gab es in 15 Jahren kaum.
- Ein Los Kampfflugzeuge kostet 8 Kapital. Es bewegt 24 Monate lang nichts und meldet sich nie.
- Zwei Fehler im Stand des Inhabers: Die CAATSA-Sanktion hält KAAN bis 2047 auf und ließ die F-16 elf Jahre nach Bauende liefern. In der Wirklichkeit genehmigten die USA beide trotz CAATSA.

**Medien:**
- Die Eingriffe sind ein Werkzeugkasten ohne Problem. Der sichtbare Preis ist „Pressefreiheitswert −3“, der Nutzen steht hinter „Einzelheiten“.
- Eine Aufgabe ergibt sich erst, wenn ein Sender angreift. Das geschah dreimal in 15 Jahren, ausgelöst durch die Welle H3.
- Die Zeitung ist eine Akte, die man lesen kann, aber nicht muss. 44 Ausgaben sind ungelesen, und keine verlangt etwas.

**Ziel:**
- Sicherheit beantwortet: „Hält meine Abschreckung, und was kaufe ich mit welchem Risiko?“ Dazu drei Entscheidungen: eine Beschaffung (wer liefert), der Wehrdienst als Gesetz und der Etat.
- Medien beantworten: „Wer erzählt meine Geschichte, und was kostet es, sie zu ändern?“ Dazu drei Entscheidungen: Antworten auf Angriffe, Druck auf ein Haus und die Dauerregler.
- Beide Bereiche kommen von selbst auf den Schreibtisch.

---

## 1. Ist-Zustand: was der Inhaber gespielt hat

Auswertung von `s2043.json`: Logbuch mit 5.515 Einträgen, Chronik mit 896, dazu der Zustand der Module.

### Sicherheit

| Was | In 15 Jahren | Beleg |
|---|---|---|
| Eigene Beschaffungen über Streitkräfte (Kaufen, Produzieren, Entwickeln, Modernisieren) | 4, alle am selben Tag (04.02.2035): eine Entwicklung „Drohnen“, eine Entwicklung „Personal“, zweimal Kampfwertsteigerung „Personal“. Danach nie wieder. | Logbuch; `streitkraefte.zaehler` = 4 |
| Neue Rüstungsvorhaben in der Bauliste (KAAN, TF35000, TF-2000, Hürjet, F-35, S-400 abgeben, Doktrinen) | 0 | `reich.laufend` enthält kein `mil_*` |
| Instandsetzungen von Rüstung | 2 (Drohnen, Anadolu, beide am 02.09.2029) | Logbuch |
| Rüstungsgesetz | 1 („Heimische Rüstungsindustrie“, 2041) | Logbuch |
| Wehrdienst | nie geändert (6 Monate) | `streitkraefte.wehrdienst` |
| Behörden (MİT, Polizei, Grenzschutz, Cyber) ausgebaut oder gekürzt | 0 von 11 Behörden, alle auf den Startstufen | `behoerden.stand` gegen `data/behoerden.ts` |
| Sicherheitsereignisse am Schreibtisch | 7 × Militärrat, 1 × Lieferverzug F-16, 0 Putsch | Chronik `vorlage` |
| Artikel über Rüstung in den letzten 12 Ausgaben | 0 von 135 | `zeitung.archiv` |

Der Tag 04.02.2035 zeigt das Muster: einmal ausprobiert, keine sichtbare Folge, nie wieder. Die Hälfte der Klicks ging dabei auf eine unsinnige Handlung: Für die Gattung „Personal“ bietet die Ansicht Entwickeln und Modernisieren an, als hätten Soldaten eine Technikgeneration (`ui/militaer/Streitkraefte.tsx:47`, alle vier Arten für jede Gattung). Seither steht das Personal auf „Generation 4“.

Zwei Fehler im Spielstand:
- **KAAN kommt 2047.** Das Vorhaben steht in diesem älteren Stand nicht in der Bauliste. Deshalb gilt das eigene Datum der Beschaffung, und die CAATSA-Sanktion schob es jeden Monat um 30 Tage (`sim/streitkraefte.ts:477-478`), bis zum Vertrag mit den USA 2041. Die Kachel zeigt im August 2043 „noch 44 Monate“, Liefertag ist der 22.02.2047. In der Wirklichkeit soll die erste Lieferung laut TUSAŞ 2028 erfolgen (andere Berichte nennen 2029), die Exportlizenz für das F110-Triebwerk passierte den Kongress am 09.07.2026 (Recherche R1).
- **F-16 zweimal fertig.** In der Bauliste wurde die F-16 am 01.06.2030 fertig, geliefert wurde sie erst am 01.06.2041. Auch das lag an der Sanktion. Die Genehmigung kam in der Wirklichkeit im Januar 2024 trotz CAATSA (R7).

### Medien

| Was | In 15 Jahren | Beleg |
|---|---|---|
| Medieneingriffe | 3: ein Interview (2040), zwei Aufsichtsstrafen (2041, 2042) | `medien.eingriffe` |
| Auslöser | jedes Mal der Vorgang „Die Freie Stimme greift an“ (Welle H3, `sim/ereignisse-bereiche.ts:166`) | Chronik `medien_kampagne` 3× |
| Dauerregler (Aufsicht, Internet, Staatsmedien) | nie verstellt (65, 60, 60) | `medien.regler` |
| Pressekonferenzen, Rohdaten, Übernahmen | 0 | `medien.eingriffe` |
| Zeitung | 44 ungelesene Ausgaben (Stand 2039: 87) | `zeitung.ungelesen` |
| Pressekonflikt (Ereignis) | 0 | Chronik |

### Bilder

| Bild | Was es zeigt |
|---|---|
| `bilder/inh-01-start.png` | Leiste: „Sicherheit“ ohne Zahl, „Medien 44“ als ruhige Zahl. |
| `bilder/inh-02-streitkraefte.png` | Kopf „Kampfkraft +9 % gegenüber 2026“. Radar, acht Kacheln mit Indexwerten, „Verteidigungsetat 101 %“, „Forschungsstand 100“. Keine Frage, kein Gegner. |
| `bilder/inh-03-kampfflugzeuge.png` | Kaufen, Produzieren, Entwickeln und Modernisieren mit „Generation 4“ statt Namen; „heimisch baubar: Generation 2“, obwohl Hürjet und KAAN fliegen. |
| `bilder/inh-05-ruestung.png`, `bilder/inh-06-ruestung-unten.png` | Zweiter Einkaufsort: Bauliste mit Pflege, Beschaffung und Doktrinen. „Verwaltungskraft aufgebraucht“. |
| `bilder/inh-11-politik-streitkraefte.png` | Dritter Ort: Politik › Streitkräfte. Der Regler „Heimische Rüstungsindustrie“ steht auf „11,7 Mrd. Dollar Export im Jahr“, als ließe sich der Export einstellen. |
| `bilder/inh-08-medien.png`, `bilder/inh-09-medien-unten.png` | Medien steuern: Leiste „Wem gehört die Öffentlichkeit“, sieben Häuser mit Selbstzensur, „n Eingriffe möglich“. |
| `bilder/inh-07-zeitung.png` | Aufmacher „Amtlich bestätigt: Mindestlohn: von 37.050 Lira … 12 Monate danach wirkt“. Ein Verwaltungssatz statt einer Schlagzeile, darin der Rest „(Stufe 0 auf 0)“. Im Kopf heißt der Abendkurier „regierungsnah“, in Medien steuern „privat“. |
| `bilder/inh-14-schreibtisch.png` | Sieben Entscheidungen, keine aus Sicherheit oder Medien. |
| `bilder/neu-02-streitkraefte.png` | Frisches Spiel: Kampfkraft „wie 2026“, fünf laufende Vorhaben, „4 Plätze frei“. |
| `bilder/neu-05-sicherheitslage.png`, `bilder/neu-11-behoerden.png` | Behörden: unter Sicherheitslage, ganz unten hinter dem Textlink „Behörden des Bereichs (4) ansehen und ausbauen“. |
| `bilder/neu-06-beschaffung.png` | Bauliste: „Die Kapazität ist verplant. Ein neuer Auftrag wartet, bis die F-16 in etwa 24 Monaten fertig ist.“ TF35000 steht mit „5 Jahre“, wird aber nach 132 Monaten fertig (Sonde). |
| `bilder/neu-08-medien-freie-stimme.png` | Eingriffe gegen ein Haus: Als Wirkung sichtbar ist nur der Preis „Pressefreiheitswert −3“, der Nutzen steht hinter „Einzelheiten“. |

---

## 2. Ursachen, gemessen

### 2.1 Messung: was eine Handlung bewirkt

Sonde `werk/_sonde_a4.test.ts`, gelaufen in der Arbeitskopie:
- Jede Handlung wird auf einer Kopie desselben Stands ausgeführt, Ereignisse sind abgeschaltet.
- Gemessen wird die Differenz zum Lauf ohne Handlung nach 1, 12 und 24 Monaten.
- Die Tabelle zeigt das frische Spiel. Im Stand des Inhabers liegt das Rauschen bei etwa ±0,6 Zustimmung, weil jeder Eingriff den Zufallsstrom verschiebt; die Knotenwerte stimmen mit dem frischen Spiel überein.

| Handlung (Preis) | Sofort / nach 1 Monat | nach 24 Monaten | Meldet sich? |
|---|---|---|---|
| Kampfflugzeuge kaufen (8 Kapital, 0,35 % BIP) | nichts | nichts (Lieferung nach 36 Monaten), Zustimmung +0,01 | nein: ein Logeintrag, kein Bericht, keine Zeitung |
| Drohnen produzieren (3 Kapital) | nichts | Kampfkraft +2 %, Kriegsstärke +1 %, Abschreckung +0,27 | nein |
| Wehrdienst 12 statt 6 Monate (kostenlos, sofort) | Junge −1,27 | Kampfkraft +1 %, Abschreckung −0,13 | nein |
| TF35000 beginnen (7 Kapital) | – | Bauliste: fertig nach **132 Monaten** (angezeigt „5 Jahre“) | nein |
| MİT, Personal +1 (4 Kapital) | – | Terrorgefahr −0,31 | Logeintrag bei Fertigstellung |
| Polizei, Technik +1 (4 Kapital) | – | Kriminalität −0,70 | Logeintrag |
| **Gesetz** Verteidigungsausgaben +10 | – | Bereitschaft Luft +1,69, Modernisierung +1,30, Terror −1,10 | Abstimmung, Wirkungsbericht, Zeitung |
| **Gesetz** Mindestlohn +10 | – | Arbeitnehmer +2,67 | Abstimmung, Wirkungsbericht, Zeitung |
| Interview (1 Kapital) | Städtische +0,44, Ansehen +0,30 | fast null | nur Logeintrag |
| Aufsichtsstrafe (2 Kapital) | Vertrauen +0,43, Pressefreiheit −0,92, Städtische −0,34 | Vertrauen +0,16 | nur Logeintrag |
| Sendeverbot 10 Tage (5 Kapital) | Vertrauen +1,24, Pressefreiheit −2,76, Städtische −1,01, Zustimmung +0,12 | Zustimmung −0,08, Ansehen −0,55 | Chronik, keine Schlagzeile |
| Regler Medienaufsicht 65 → 90 | Zustimmung −0,03 | Zustimmung −1,57, Ansehen −9,0, Pressefreiheit −11,6, Städtische −10,0 | über die Lizenzsperre |

Schlüsse aus der Messung:
1. **Medien wirken in der Größenordnung eines Gesetzes.** Ein Sendeverbot bewegt in einem Monat das Vertrauen um 1,24; der Mindestlohn bewegt die Arbeitnehmer in zwei Jahren um 2,67. Zu klein ist die Wirkung also nicht. Sie ist **unsichtbar**: Es gibt keinen Wirkungsbericht und keine Schlagzeile („Ankara schaltet Sender ab“), und die Zustimmung bewegt sich nur um Zehntel.
2. **Rüstung wirkt im Frieden fast gar nicht.** Ein Los Kampfflugzeuge zählt in der Kampfkraft mit 0,4 (Gewicht der Gattung) × 20/235 Stück × 0,35 (Luftanteil). Das ergibt +1,5 % Kampfkraft, und die Kriegsstärke folgt mit 45 % davon (`sim/streitkraefte.ts:246`, `0,55 + 0,45 × Index`). Im Ganzen sind das +0,7 % Kriegsstärke für 8 Kapital. Nur mit gewählter Einsatzart zählt der Bestand stärker, mit 0,7 und 12 % je Generation Abstand (`sim/kriegsschauplatz.ts:57`, `:188`).
3. **Behörden wirken ein Drittel so stark wie ein Gesetz und melden sich nicht.** Dazu liegen sie drei Klicks tief am Ende einer Lageseite.

### 2.2 Ursachen je Bereich

**Rüstung:**

| Ursache | Befund mit Zahl |
|---|---|
| Wird nicht gebraucht, um zu gewinnen | Der Bestand wirkt nur im Krieg. Krieg mit den USA, China und der EU ist ausgeschlossen (ENTSCHEIDUNGEN U). Im Spiel des Inhabers gab es in 15 Jahren keinen Krieg mit Einsatz. Die Zustimmung reagiert auf Rüstung nicht, auch nicht auf den Rüstungsexport. |
| Wirkung unsichtbar und spät | Kauf: 36 Monate ohne Änderung. Kein Wirkungsbericht (`sim/berichte.ts` kennt keine Beschaffung). Die Zeitung schrieb in 12 Ausgaben 0 von 135 Artikeln über Rüstung. |
| Drei Orte für dieselbe Sache | (1) Streitkräfte › Gattung › Kaufen, Produzieren, Entwickeln, Modernisieren (`ui/militaer/Streitkraefte.tsx:47`); (2) Rüstung und Beschaffung › Bauliste mit benannten Programmen (`data/reich/militaer.ts`); (3) Politik › Streitkräfte › fünf Regler. Die abstrakte Beschaffung („Generation 4 aus den USA“) und die benannte (F-16 Block 70) laufen nebeneinander, mit eigener Kapazität (4 Plätze bzw. 60 Baupunkte). |
| Wehrdienst doppelt und gegen die Regel | Der Knopf in Streitkräfte (`sim/streitkraefte.ts:416`) ändert die Dauer sofort und kostenlos. Daneben gibt es die Maßnahme `m_wehrdienst` als Gesetz (`data/politiknetz.ts:1387`, `data/gesetzesvorhaben.ts:103`). Die Dauer steht im Wehrpflichtgesetz Nr. 7179 (R10) und gehört nach ENTSCHEIDUNGEN X und W-F1 ins Gesetz. |
| Unrealistische Sperren | Die CAATSA-Sanktion hält jede US-Lieferung an (`sim/streitkraefte.ts:457-478`). Wirklich gesperrt sind seit dem 14.12.2020 US-Exportlizenzen an die Rüstungsagentur SSB. Die F-16 genehmigte Washington trotzdem im Januar 2024, das F110 für KAAN im Juli 2026 (R6, R7, R1). ENTSCHEIDUNGEN R verlangt eine gezielte Sanktion. Das Ergebnis heute: KAAN 2047. |
| Zahlen ohne Bedeutung | „Kampfkraft +9 %“, „Generation 3,2“, „Forschungsstand 100“. Der Spieler erfährt nicht, ob das gegen Griechenland reicht. Die Frage „gegen wen?“ beantwortet nur der Krieg (Zielräume, `ui/militaer/Streitkraefte.tsx:94`). |
| Zeitangaben falsch | TF35000: Die Karte nennt 5 Jahre, die Bauliste liefert nach 132 Monaten. Die Rüstungskapazität ist bis 2030 mit F-16, Altay, Stahlkuppel, KAAN und Eurofighter belegt (`bilder/neu-06-beschaffung.png`). |
| Meldet sich selten | Zwei Vorlagen: Lieferverzug mit 2,5 % je Monat (`sim/ereignisse-reich.ts:696`) und Militärrat einmal im Jahr. Militärrat und Putsch handeln von Loyalität, nicht von Rüstung. |

**Behörden:**
- **Nicht gefunden:** Sie liegen unter Politik › Bereich › Behörden oder Sicherheit › Sicherheitslage › Textlink am Seitenende (`ui/akte/Bereiche.tsx:427`).
- **Wirkung klein:** MİT Personal +1 senkt die Terrorgefahr in 24 Monaten um 0,31; das Gesetz zu den Verteidigungsausgaben senkt sie um 1,10.
- **Meldet sich nie:** Es gibt keinen Vorgang wie „Der Anschlag hätte verhindert werden können“.

**Medien:**

| Ursache | Befund |
|---|---|
| Unklar, was es bringt | Die Kachel zeigt nur den Preis („Pressefreiheitswert −3“). Den Nutzen (Vertrauen +1,24, Konservative +0,74) muss man in „Einzelheiten“ aufklappen (`sim/medien.ts:478-497`). Pressekonferenz und Interview bringen fast nichts (Ansehen +0,25, `sim/medien.ts:81`). |
| Werkzeug ohne Problem | Sieben Häuser bieten zusammen 28 anwendbare Eingriffe (gezählt mit `medienAktionen`, frisches Spiel), dazu Rohdaten, alle ohne Anlass. Die Simulation stellt nur bei der Kampagne (ab 300 Tagen Schweigen, `sim/ereignisse-bereiche.ts:39`) und beim Pressekonflikt eine Aufgabe. Das Spiel des Inhabers hat das bestätigt: Alle drei Eingriffe kamen aus dem Vorgang. |
| Wirkung unsichtbar | Ein Sendeverbot erscheint nicht als Schlagzeile. Die Wirkung der Zeitung auf die Gruppen (`sim/zeitung.ts:1389-1391`, höchstens 1,6 je Gruppe und Ausgabe) wird nirgends gezeigt. |
| Zeitung ohne Zweck | Sie verlangt nichts und meldet keinen Angriff auf den Präsidenten mit Antwortknopf. Die Aufmacher sind Verwaltungssätze aus der Wirkungsprüfung. Die Zahl ungelesener Ausgaben wächst ohne Folge. |
| Widersprüche | Der Abendkurier heißt in der Zeitung „regierungsnah“, in Medien steuern „privat/angepasst“. Zwei Rechnungen für dasselbe Lager: `framingFuer` zählt die kommerziellen Häuser zu den regierungsnahen (`sim/zeitung.ts:289-295`), `medienLager` zu den angepassten (`sim/medien.ts`, `medienLager`). |
| Dauerregler versteckt | Die drei Hebel mit der größten Wirkung (Aufsicht 90: Pressefreiheit −11,6, Ansehen −9 in 24 Monaten) stehen in der Kachel „Dauerhafte Hebel“ als Zahl. Verstellen kann man sie nur in Politik › Medien und Gesellschaft. |

---

## 3. Was die guten Bereiche gut macht, an Sicherheit und Medien gemessen

| Merkmal der guten Bereiche | Haushalt, Politik, Schreibtisch | Sicherheit | Medien |
|---|---|---|---|
| Eine klare Frage | „Wofür gebe ich das Geld aus?“ (Rad) | fehlt („Kampfkraft +9 %“) | ist da („Wem gehört die Öffentlichkeit …?“), hat aber keine Entscheidung darunter |
| Wenige echte Entscheidungen mit Preis | 1 Regler je Posten | 3 Orte: 40 Knöpfe an 8 Gattungen, 4 Wehrdienststufen, 27 Vorhaben in der Bauliste, 5 Regler in der Politik | 28 Eingriffe und Rohdaten, 3 Regler an anderer Stelle |
| Wirkung kommt an | Wirkungsbericht, Zeitung, Abstimmung | nichts davon | nur ein Logeintrag |
| Meldet sich selbst | Haushaltsfenster jedes Jahr, Vorlagen | Militärrat (Loyalität) | Kampagne alle ≥ 300 Tage |
| Karten statt Blatt | ja | ja (Kacheln) | ja |

---

## 4. Ziel der Bereiche

### 4.1 Sicherheit: „Hält meine Abschreckung, und was kostet sie mich?“

Die eine Frage wird mit einem Bild beantwortet, der **Lage an den Grenzen**. Für jeden möglichen Gegner (Griechenland, Zypern, Syrien, Irak, Iran, Armenien; ENTSCHEIDUNGEN U) steht ein Balken: eigene Stärke gegen seine. Sie kommen aus derselben Rechnung wie der Krieg (`eigenStaerke`, `gegnerStaerke`, `sim/krieg.ts:338`, `:368`), mit der Unsicherheit des Lagebilds. Dazu kommt die Uhr der Lieferungen.

Echte Entscheidungen (drei, statt bisher rund 75 Knöpfen an drei Orten). Das Muster folgt Suzerain: Eine Entscheidung erreicht den Spieler über den Minister und den Bericht (V2).

1. **Ein Rüstungsprogramm bestellen**
   - Nur benannte Programme der Wirklichkeit, die Bauliste ist der einzige Ort.
   - Jedes Programm hat einen Preis (Kapital und Geld), eine Dauer, einen Lieferanten und eine Abhängigkeit, die etwas kostet:
     - KAAN mit dem F110 aus den USA;
     - Altay mit koreanischem Antrieb oder dem eigenen BATU;
     - Eurofighter mit britischer und deutscher Zustimmung;
     - F-35 nur ohne S-400;
     - TF35000 als Weg aus der Abhängigkeit.
   - Die Wahl „kaufen oder selbst bauen“ ist die Wahl zwischen Lieferanten, nicht zwischen „Generation 4“ und „Generation 2“.
2. **Wehrdienst** als Gesetz (die Maßnahme `m_wehrdienst`):
   - 6 Monate mit Freikauf heute (Gesetz 7179, R10), länger oder Berufsarmee.
   - Der Preis sind die Jungen und das Geld aus dem Freikauf. Der Knopf in Streitkräfte entfällt.
3. **Verteidigungsetat** über den Haushaltsposten (F1, ist schon da). Er bestimmt Erhalt und Tempo. Die Sicherheitsseite zeigt ihn mit Ziel und echter Größe (NATO 2025: 2,33 % des BIP, R9).

Dazu als Folge, nicht als Knopf:
- Behörden (MİT, Polizei, Grenzschutz, Cyber) melden sich mit Vorgängen. Ausgebaut werden sie dort, wo der Vorgang hinführt.

Wie Rüstung im Krieg zählt (Übergabe an W1):
- Ein Programm bringt beim Abschluss **benannte Stückzahl und Generation** in die Gattung, etwa KAAN Block 10 mit 20 Maschinen der Generation 5. Das gilt in jeder Einsatzart, nicht nur mit gewählter.
- Die Kriegsstärke soll den Bestand **über den Generationsabstand zum Gegner** lesen. Heute ist er auf 0,6 bis 1,5 begrenzt, je Generation 12 % (Spielparameter, `sim/kriegsschauplatz.ts:57`, `:189`). Dazu kommt die Menge, heute zu 45 % gewichtet (`sim/streitkraefte.ts:246`, Spielparameter). Ziel: Ein Programm, das eine Generation Vorsprung in einer Gattung schafft, ist am Balken der Grenzlage **sichtbar**. Beispiel: KAAN gegen die F-16 Viper und Rafale Griechenlands.
- **Abhängigkeit zählt im Krieg:**
  - Liefert der Lieferant nicht mehr (Sanktion, Embargo), sinkt die Bereitschaft der Gattung mit jedem Kriegsmonat (Ersatzteile).
  - Ein Beleg dafür: Ein türkischer Vertreter sagte 2025, die Sanktionen blockierten F-16-Ersatzteile für 20 Mrd. USD (R6). Die Stärke des Effekts ist ein Spielparameter.
- Munition und Drohnen sind heimisch (82,3 % Lokalisierung laut Präsidialamt, R8) und daher sanktionsfest. Das ist der eigentliche Grund für die Doktrin Drohnenverbund.

### 4.2 Medien: „Wer erzählt meine Geschichte, und was kostet es mich, sie zu ändern?“

Die Frage steht schon oben in der Ansicht. Das Bild ist die Leiste „30 % regierungsnah · 26 % angepasst · 44 % kritisch“. Ergänzen soll man sie um die **Wirkung im letzten Monat**: Welche Häuser haben welche Gruppen um wie viel bewegt (aus `berechneWirkung`, `sim/zeitung.ts:1406`).

Echte Entscheidungen (drei):
1. **Antworten, wenn man angegriffen wird.** Die Kampagne, der Pressekonflikt und neue Vorgänge (Abschnitt 5) kommen auf den Schreibtisch, mit drei Wegen:
   - Interview oder Gegendarstellung: billig, wirkt nur bei den eigenen Lesern;
   - Aufsicht einschalten: wirkt sofort, kostet Ansehen und die EU;
   - schweigen: kostet Vertrauen.
   Das ist das Muster der Kampagne aus H3, das funktioniert hat.
2. **Druck auf ein Haus**, nur an den kritischen Häusern und nur in vier echten Formen:
   - RTÜK-Strafe;
   - Sendeverbot;
   - Anzeigen- und Kreditentzug über die Eigentümer;
   - Treuhand oder Übernahme, nach dem Vorbild von Doğan an Demirören 2018 und den Häusern unter dem Einlagensicherungsfonds TMSF (M-R1).
   Wirkung und Preis stehen auf der Karte nebeneinander: „Vertrauen +1,2 · Städtische −1,0 · Ansehen −0,7 · Pressefreiheit −2,8“.
3. **Die Dauerregler** Aufsicht, Internetsperren und Staatsmedien. Sie werden hier gezeigt und gestellt; die Logik bleibt dieselbe Maßnahme. Jede Stufe nennt die echte Form, etwa „Sperre einzelner Plattformen wie Instagram 2024“ oder „Drosselung nach der Festnahme İmamoğlus 2025“, mit Quelle im Code (M-R4).

Was wegfällt:
- Pressekonferenz als Knopf ohne Anlass: Sie wird ein Weg im Vorgang.
- Staatsanzeigen und Eigentümerdruck als getrennte Knöpfe an regierungsnahen Häusern: Die sind schon auf Linie.
- Rohdaten bleiben, aber im Kopf der Zustimmung, wo sie gebraucht werden (F2).

---

## 5. Umbauplan

Jeder Schritt ist so geschnitten, dass ein Agent ihn an einem Tag bauen kann. Er hat einen Test und eine Migration, wenn der Spielstand sich ändert. Die Reihenfolge ist zugleich der Vorschlag.

### Schritt S1: Rüstung an einem Ort, Sanktion gezielt (Logik)
- **Dateien:**
  - `sim/streitkraefte.ts`
  - `data/streitkraefte.ts`
  - `data/reich/militaer.ts`
  - `ui/militaer/Streitkraefte.tsx`
  - `test/streitkraefte*.test.ts`
- **Was:**
  - Die abstrakten Beschaffungen (`beginneAusbau`, Kaufen, Produzieren, Entwickeln, Modernisieren) fallen weg. Bestellt wird nur über benannte Programme der Bauliste.
  - Jedes Programm erhält in `data/reich/militaer.ts` ein Feld `liefert: { gattung, menge, generation }`. Die Kacheln der Streitkräfte zeigen nur noch Bestand und „kommt: KAAN 2028“.
  - Ausmustern bleibt als einzige Handlung an der Gattung.
- **Sanktion nach ENTSCHEIDUNGEN R:**
  - CAATSA sperrt nur Programme, deren Abhängigkeit ausdrücklich eine US-Lizenz an die SSB braucht und keine Einzelgenehmigung hat.
  - Ein neues Feld am Programm, `lizenz: "usa_einzeln" | "usa_gesperrt" | …`, mit Quelle. F-16 (Genehmigung 01/2024) und KAAN-F110 (Kongress 07/2026) laufen; F-35 bleibt gesperrt (NDAA § 1245).
- **Migration:**
  - Laufende abstrakte Beschaffungen älterer Stände werden geliefert oder in Geld erstattet.
  - Beschaffungen mit `vorhaben`, deren Vorhaben fehlt (KAAN beim Inhaber), legen das Vorhaben in der Bauliste an. Ihr Datum wird auf das Startdatum des Programms gesetzt, nicht auf das aufgelaufene.
  - Prüfung am Spielstand des Inhabers: KAAN muss vor 2047 kommen.

### Schritt S2: Programme mit echten Daten
- **Dateien:** `data/reich/militaer.ts`, `i18n/katalog/*/…`.
- **Was:**
  - Programme und Werte nach R1 bis R7, Fehlendes als Spielparameter: KAAN Block 10, TF35000, Altay T1/T2 mit BATU, Eurofighter (20 neu, 2030), F-16 Block 70 (40 Stück), Stahlkuppel, MUGEM, Kızılelma, Hürjet.
  - Die Kosten in Geld kommen aus den Quellen. Die Dauer kommt aus den echten Fertigdaten, und die Rüstungskapazität wird so eingestellt, dass KAAN 2028 und Eurofighter 2030 kommen, nicht später.
- **Prüfung:**
  - Ein Test vergleicht das Fertigdatum der Startprogramme mit den Daten der Quelle (±12 Monate).
  - Die Karte zeigt die Dauer aus der Warteschlange (`warteschlange`), nicht `kosten.monate`. Das behebt die Anzeige „5 Jahre“ bei 132 Monaten.

### Schritt S3: Wehrdienst nur als Gesetz
- **Dateien:** `sim/streitkraefte.ts` (`setzeWehrdienst` entfernen), `ui/militaer/Streitkraefte.tsx` (Kachel öffnet Politik › Streitkräfte › Wehrdienst), `sim/handeln.ts`.
- **Was:**
  - `streitkraefte.wehrdienst` liest die Stufe von `m_wehrdienst` und wird nicht mehr selbst gesetzt.
  - Die Reglerstufen nennen die echten Formen nach Gesetz 7179: 6 Monate mit Freikauf, 12 Monate, Berufsarmee.
  - Der Freikaufpreis ist nur als Text belegt (Kanzleiseite, R10); im Spiel bleibt er ein Spielparameter.
- **Migration:** Älterer Wert ≠ 6 wird in die Maßnahme übernommen.

### Schritt S4: Ansicht „Lage an den Grenzen“ (Oberfläche)
- **Dateien:** neu `ui/militaer/Grenzlage.tsx`, `ui/militaer/Streitkraefte.tsx`, `ui/militaer/militaer.css`, `sim/krieg.ts` (nur lesend `eigenStaerke`/`gegnerStaerke` ohne laufenden Vorgang).
- **Was:**
  - Oben ein Bild: je möglichem Gegner ein Balken „wir gegen sie“, mit Band nach Lagebild (wie im Konfliktdossier), Spannung und Phase.
  - Darunter eine Zeile mit drei Kennzahlen, Rest im Aufklapper:
    - Verteidigungsetat in % des BIP;
    - Abhängigkeit („3 Programme hängen an US-Lizenzen“);
    - nächste Lieferung.
  - Darunter die Bauliste der Rüstung als Kartenreihe (Lieferkalender, `ui/militaer/Lieferkalender.tsx`, ist schon da).
  - Radar und „Kampfkraft +9 %“ wandern in den Reiter Hintergrund (Regel Z: Zahlen statt Sätze, ein Bild).
- **Prüfung:** Bildvergleich mit dem Spielstand des Inhabers und frisch; ≤ 1,5 Bildschirme (Y).

### Schritt S5: Rüstung meldet sich (Schreibtisch)
- **Dateien:** `sim/ereignisse-reich.ts` (neben `mil_lieferverzug`), neue Vorlagen in `sim/ereignisse-sicherheit.ts`, `i18n/katalog/*/welle_a4.json`.
- **Vorlagen, jede mit drei Wegen und gebuchtem Preis (Wächtertest `schau-antworten`):**
  - **Lieferant stellt Bedingungen:** USA, Deutschland beim Eurofighter oder Kanada bei der Optik verlangen etwas, etwa eine Zusage zu Schweden oder zum Ostmittelmeer.
    - Wege: nachgeben (Ansehen beim Partner, Ärger bei Nationalisten); Ersatz heimisch (teurer, später); verzichten.
    - Vorbild: kanadische Wescam-Sperre 2020/21, Altay-Motor 2010 bis 2021 (R2, R4).
  - **Exportanfrage:** Ein Land will Drohnen oder KAAN (Indonesien 48 KAAN, 2025; Pakistan, VAE).
    - Wege: liefern (Geld, Exportstärke, Ärger mit einem Nachbarn); liefern mit Auflagen; ablehnen.
    - Das bringt Rüstung zum ersten Mal Geld und Zustimmung (Arbeitsplätze).
  - **Programm im Verzug** mit Grund (Lieferkette, Prüfung). Wege: Geld nachschießen, umplanen, Abstriche bei der Stückzahl. Die Vorlage gibt es schon (`mil_lieferverzug`); sie bekommt ihren Grund und kommt auch zu benannten Programmen.
  - **Lücke wird sichtbar:** Wenn bei einem Gegner mit Spannung über 60 der Balken der Grenzlage unter seinen fällt, legt der Generalstabschef eine Vorlage mit dem passenden Programm vor.
- **Prüfung:** In drei Testpartien über 5 Jahre kommen 4 bis 8 Rüstungsvorgänge (Spielparameter).

### Schritt S6: Rüstung wirkt und wird berichtet
- **Dateien:** `sim/berichte.ts` (Wirkungsbericht für Rüstungsprogramme 6, 12 und 24 Monate nach Lieferung), `sim/zeitung.ts` (Ressort „Sicherheit“: Lieferung, Erstflug, Export, Lieferstopp als Vorgang mit Wertung), `data/reich/militaer.ts` (Abschluss).
- **Wirkung im Frieden** über bestehende Netzknoten: Exportstärke, Arbeitsplätze Industrie, Nationalisten oder Konservative, Ansehen.
  - Nur Richtung und Größe als Spielparameter.
  - Belegt sind die Größenordnungen: Exporte 2025 10,05 Mrd. USD, rund 100.000 Beschäftigte, Baykar 88 % Export (R8, R4).
- **Prüfung:**
  - Eine Lieferung erzeugt eine Schlagzeile und einen Wirkungsbericht.
  - Eine Messsonde wie in 2.1 zeigt für KAAN nach Lieferung eine sichtbare Änderung an der Grenzlage und an der Exportstärke.

### Schritt S7: Behörden als Folge von Vorgängen
- **Dateien:** `sim/behoerden.ts`, neue Vorlagen in `sim/ereignisse-sicherheit.ts`, `ui/behoerden/*`.
- **Vorlagen:**
  - „Anschlag vereitelt / nicht vereitelt“ (MİT, Polizei; Chance aus Terrorgefahr und Stufe);
  - „Cyberangriff auf eine Behörde“ (Cyber);
  - „Lage an der Grenze“ (Grenzschutz).
  - Der Weg „Behörde ausbauen“ ruft `baueAus` mit sichtbarem Preis auf.
- **Oberfläche:** Der Textlink am Seitenende fällt weg. Die vier Sicherheitsbehörden stehen als kleine Kartenreihe unter der Grenzlage.
- **Prüfung:** Der Ausbau einer Stufe senkt die Chance des passenden Vorgangs messbar.

### Schritt M1: Medien-Eingriffe zeigen Nutzen und Preis gleichrangig
- **Dateien:** `ui/MedienAkte.tsx`, `sim/medien.ts` (`vorschauVon`).
- **Was:**
  - Jede Eingriffskarte zeigt eine Zeile „bringt“ und eine „kostet“, mit denselben Zahlen, die `auswirkungen` bucht.
  - Die Knöpfe an regierungsnahen Häusern fallen weg, ebenso Eingriffe, die nach `passt` nichts bewirken. Je kritischem Haus bleiben höchstens vier.
- **Prüfung:** Wächtertest Plakette gegen Buchung.

### Schritt M2: Medien melden sich (Schreibtisch)
- **Dateien:** `sim/ereignisse-bereiche.ts`, `sim/ereignisse-innen.ts`, neue Vorlagen, `i18n/katalog/*/welle_a4.json`.
- **Vorlagen, jede mit drei Wegen:**
  - **Enthüllung:** Ein kritisches Haus bringt einen Skandal aus dem Kabinett. Die Quelle sind die Skandale, die es schon gibt (`sim/kabinett.ts`), sie werden aber zur Pressegeschichte.
  - **Plattform weigert sich:** X, YouTube oder Instagram löscht Konten nicht. Wege: Sperre (wie Instagram vom 2. bis 10. August 2024, M-R4), Drosselung, nachgeben. Gesetz 7253 erlaubt bis 90 % Drosselung.
  - **Lizenz für ein Auslandsmedium:** Vorbild sind DW und VOA, gesperrt am 30.06.2022 (M-R3). Wege: erteilen, verweigern (Ansehen, EU), verschleppen.
  - **Wahlkampf:** Verteilung der Sendezeit im Staatsrundfunk, ab dem Beginn des Wahlkampfs. Vorbild ist die Wahl 2023: TRT gab dem Lager Erdoğans 44 bis 45 % der Berichte, Kılıçdaroğlu 25 bis 28 % (OSZE, M-R7). Die Wirkung auf die Stimmen ist ein Spielparameter, denn ein bezifferter Effekt ist nicht belegt.
  - Die Kampagne aus H3 bleibt, ihre Ruhezeit sinkt auf 180 Tage (Spielparameter).
- **Prüfung:** In drei Testpartien über 5 Jahre kommen 5 bis 10 Medienvorgänge (Spielparameter), ohne dass das Kabinett weniger vorlegt (Wettbewerb `test/ereignis-wettbewerb.test.ts`).

### Schritt M3: Wirkung der Presse sichtbar
- **Dateien:** `sim/zeitung.ts`, `ui/Zeitung.tsx`, `ui/MedienAkte.tsx`.
- **Was:**
  - Jeder Medieneingriff wird ein Zeitungsvorgang. Ein Sendeverbot gegen „Die Freie Stimme“ erscheint in den regierungsnahen Blättern anders als im Netzportal.
  - Die Monatsausgabe trägt am Fuß einen Kasten „Wie die Presse diesen Monat wirkte“: je Gruppe die Summe aus `berechneWirkung`.
  - Die Medienseite zeigt dieselbe Summe als Balken unter der Leiste „Wem gehört die Öffentlichkeit“.
- **Prüfung:** Die Summe im Kasten ist die gebuchte (Test gegen `wendeWirkungAn`).

### Schritt M4: Zeitung als Titelseite, nicht als Archiv
- **Dateien:** `sim/zeitung.ts` (Schlagzeilen der Wirkungsprüfung), `ui/Zeitung.tsx`, `ui/navigation/RegierungsNavigation.tsx` (Zahl).
- **Was:**
  - Aufmacher aus Ereignissen und Angriffen statt aus Wirkungsprüfungen. Die Wirkungsprüfung wird eine Kurzmeldung.
  - Die Schlagzeile muss kurz sein (ein Test prüft ≤ 90 Zeichen). Der Rest „Stufe 0 auf 0“ verschwindet: Er entsteht in `sim/zeitung.ts:983` (Text `sim2.sim.zeitung.4c7f9a2`), weil `berichtZuVorgang` (`sim/zeitung.ts:959-963`) den übersetzten Berichtstitel per regulärem Ausdruck nach „Stufe X auf Y“ zerlegt. Seit die Regler Einheiten zeigen („37.050 Lira“, N9), greift der Ausdruck nicht mehr, und `von` und `auf` fallen auf 0. Das verstößt zugleich gegen ENTSCHEIDUNGEN U (Logik liest nie übersetzten Text). Der Bericht soll `von` und `auf` als Felder tragen.
  - Ein Artikel, der den Präsidenten angreift, trägt den Knopf „Antworten“, der zum Vorgang führt.
  - Die Zahl an „Medien“ zählt nur Ausgaben mit einem Angriff, nicht jede Monatsausgabe. 44 ungelesene Routineausgaben sind kein Signal.
  - Den Abendkurier überall gleich benennen (ein Lager, `medienLager`).
- **Prüfung:** Bild der Ausgabe 221 des Inhabers vorher und nachher.

### Schritt M5: Dauerregler mit echten Formen in der Medienansicht
- **Dateien:** `ui/MedienAkte.tsx`, `data/skalen.ts` bzw. `data/einheiten.ts` (Stufennamen mit Quelle), `sim/medien.ts` (`reglerLizenz`).
- **Was:**
  - Die drei Regler stehen als Zeilen mit Regler in der Medienansicht (Regel V). Gesetz oder Erlass laufen wie in der Politik.
  - Die Stufen tragen die echten Formen der Medienrecherche, mit Quelle im Code:
    - Gesetz 7253 von 2020 (lokaler Vertreter, Drosselung bis 90 %);
    - Desinformationsgesetz von Oktober 2022 (Art. 217/A);
    - Plattformsperre wie bei Instagram vom 2. bis 10. August 2024;
    - 42 Stunden Drosselung im März 2025 (M-R4, M-R5).
  - Die Kosten je Einzeleingriff sinken, die Wirkung läuft über den Regler (Kalibrierungshinweis M-R).

### Was wegfallen kann, weil es nur Schau ist

| Was | Warum |
|---|---|
| Kaufen, Produzieren, Entwickeln und Modernisieren je Gattung | Ein zweiter Einkaufsweg ohne Namen, der die Bauliste doppelt (S1). Beim Personal ergibt er keinen Sinn („Entwicklung einer neuen Generation: Personal“). |
| Wehrdienst-Knopf in Streitkräfte | Doppelt zur Maßnahme, kostenlos und sofort gegen das Gesetz (S3). |
| „Forschungsstand 100“, „Innovation“ im Kopf | Bewegt nichts, was der Spieler entscheidet. |
| Radar „Kampfkraft und Bereitschaft“ als Kopfbild | Ersetzt durch die Grenzlage. Bleibt im Hintergrund. |
| Regler „Heimische Rüstungsindustrie“ mit „Mrd. Dollar Export“ als Stufe | Export ist ein Ergebnis, kein Stellwert. Die Stufe soll die Förderung benennen (Prüfauftrag für S2). |
| Staatsanzeigen und Eigentümerdruck an staatsnahen Häusern; Interview am Staatsfunk | Bewirkt nichts Sichtbares (M1). |
| Pressekonferenz als freier Knopf | Wird ein Weg in Vorgängen (M2). |
| Zahl „44“ ungelesene Routineausgaben | Signal ohne Bedeutung (M4). |

### Reihenfolge und Abhängigkeiten
- S1 → S2 → S6. S3 ist unabhängig.
- S4 braucht S1 und eine Absprache mit W1 zur Rechnung der Gegnerstärke ohne Krieg.
- S5 und S7 nach S4. M1 bis M5 sind unabhängig von S.
- M2 vor M4 (die Zeitung braucht die Vorgänge).
- Balance: Nach S5, S6 und M2 einmal der Balance-Lauf (`scripts/balance-strategien`). Medien und Rüstung bringen neue Vorgänge, Kapital und Zustimmung, die Siegquote darf sich nicht verschieben.

---

## 6. Offene Regelfragen an den Inhaber
1. Soll der Bestand an Stück (Panzer, Schiffe) Zahlen der Global-Firepower-Seite bekommen? Sie ist nur ein Notbehelf (R10). Oder bleibt er ein Anteil an 2026 (W-Nachtrag)?
2. Dürfen Rüstungsexporte die Zustimmung bewegen? Belegt ist nur die Größe der Branche, nicht der Effekt auf Wahlen.
3. Sollen Behörden einen eigenen Ort bekommen, oder nur über Vorgänge erreichbar sein (S7)?

---

## 7. Rechercheliste mit Quellen

Jede Zahl im Plan hat hier eine Quelle oder heißt im Text „Spielparameter“.
- **[Reg.]:** Regierungs- oder staatsnahe Quelle.
- **[Herst.]:** Herstellerangabe.
- **„eigene Rechnung“:** aus den genannten Zahlen abgeleitet.

### Rüstung

**R1 KAAN**
- **Beschluss** des Exekutivkomitees für Rüstung am 15.12.2010. Entwicklungsvertrag 08/2016 über 1,18 Mrd. USD (Wikipedia „TAI TF Kaan“, https://en.wikipedia.org/wiki/TAI_TF_Kaan).
- **Erstflug** am 21.02.2024.
- **F110 von GE:**
  - 10 Triebwerke für die Prototypen, 80 für die Serie.
  - Die Exportlizenz passierte den Kongress am 09.07.2026; Lieferung ab 2027.
  - Erste Auslieferung an die Luftwaffe laut TUSAŞ 2028, das TF35000 ab 2032 (Breaking Defense, 22.07.2026, https://breakingdefense.com/2026/07/turkish-aerospace-ceo-us-cleared-kaan-fighter-engines-for-export/).
  - Wert rund 705 Mio. USD (Wikipedia mit Verweis auf Reuters/WSJ, Juni 2026).
- **Vertrag über 20 Stück Block 10** auf der SAHA 2026, Wert nicht belegt (Breaking Defense, 08.05.2026, https://breakingdefense.com/2026/05/turkish-air-force-contracts-its-first-batch-of-indigenous-kaan-jets/).
- **Indonesien bestellt 48 Stück**, Vertrag 07/2025, Lieferung in 120 Monaten [Herst.] (Jakarta Post, 29.07.2025, https://www.thejakartapost.com/world/2025/07/29/indonesia-signs-contract-with-turkey-to-buy-48-kaan-fighter-jets).
- **Programmdauer** rund 18 Jahre bis zur ersten Lieferung (eigene Rechnung).

**R2 Altay**
- **Entwicklung und Technik:** Entwicklungsvertrag 30.03.2007 über rund 500 Mio. USD; Technologietransfer mit Hyundai Rotem 2008 über rund 540 Mio. USD (Wikipedia „Altay (tank)“).
- **Serienvertrag:**
  - Am 09.11.2018 an BMC über 250 Stück, insgesamt 1.000 geplant.
  - Der Antrieb von MTU/Renk scheiterte am deutschen Embargo (Defense News, 08.03.2021, https://www.defensenews.com/industry/techwatch/2021/03/08/at-long-last-turkeys-altay-tank-finds-an-engine-from-south-korea/).
- **Antrieb aus Korea:** Doosan DV27K und SNT EST15K, Exportgenehmigung DAPA am 22.10.2021. Getriebevertrag 30.01.2023 über 74,9 Mio. USD (Defense News, 03.02.2023).
- **Auslieferung:**
  - Die ersten 2 Serienpanzer am 28.10.2025.
  - Das Werk schafft 8 Stück im Monat. T1: 85 Stück; der eigene Motor BATU ab 2028 (Euro-SD, 31.10.2025, https://euro-sd.com/2025/10/major-news/47502/altay-serial-production-begins/).
- **Programmdauer** rund 18,5 Jahre (eigene Rechnung).

**R3 TCG Anadolu und MUGEM**
- **Anadolu:**
  - Vertrag am 07.05.2015, rund 1 Mrd. USD.
  - Indienststellung am 10.04.2023 statt 2021.
  - Die 32 geplanten F-35B entfielen 2019.
  - Die TB3 landete erstmals am 19.11.2024 auf dem Schiff (Wikipedia „TCG Anadolu“).
- **MUGEM:** Baubeginn am 02.01.2025, 285 m lang, Lieferung 2032 (Wikipedia „MUGEM-class“, nach Naval News 2026).

**R4 Drohnen**
- **Exportländer:** Die TB2 ging in 36 Länder, die Akıncı in 16 [Herst.].
- **Baykar-Exporte:** 2024 1,8 Mrd. USD, 2025 2,2 Mrd. USD bei 2,5 Mrd. USD Umsatz [Herst.] (https://www.baykartech.com/en/press/baykar-remains-global-ucav-export-leader-in-2025/).
- **Kızılelma:** in Serie seit 08/2025 mit dem ukrainischen Triebwerk AI-322F (The Defense Post, 06.08.2025).
- **Kanada (Wescam-Optik):** Die Genehmigungen wurden 10/2020 ausgesetzt und 04/2021 widerrufen (29 Genehmigungen, Al Jazeera, 12.04.2021). Im Januar 2024 hob Kanada die Kontrollen wieder auf (Cyprus Mail, 30.01.2024).
- **Rotax:** Der Lieferstopp vom Oktober 2020 ist nur sekundär belegt.

**R5 Stahlkuppel**
- **Beschluss** am 06.08.2024.
- **Erste Lieferung** am 27.08.2025: 47 Systeme für 460 Mio. USD (Defense News, 14.10.2025, https://www.defensenews.com/global/europe/2025/10/14/turkey-sees-nascent-steel-dome-as-deterrent-export-money-maker/).
- **Weitere Verträge:** 25.11.2025 über 6,5 Mrd. USD (Hürriyet DN).
- **Gesamtkosten** nicht belegt.

**R6 S-400 und CAATSA**
- **Kauf:** Vertrag 29.12.2017, rund 2,5 Mrd. USD (Arms Control Association, 01/2018). Lieferung ab 12.07.2019.
- **Ausschluss aus dem F-35-Programm** am 17.07.2019 (Military Times, 17.07.2019).
- **CAATSA-Sanktion vom 14.12.2020 gegen die SSB:**
  - keine US-Exportlizenzen, Kreditgrenzen;
  - Sperren gegen vier Personen;
  - die SSB selbst steht nicht auf der Liste der gesperrten Personen (SDN-Liste) (Paul Weiss, 21.12.2020, https://www.paulweiss.com/insights/client-memos/united-states-imposes-sanctions-on-turkey-under-caatsa-section-231-for-purchase-of-russian-missile-system).
- **NDAA 2020 § 1245.** Laut einem türkischen Vertreter (2025) blockieren die Sanktionen F-16-Ersatzteile für 20 Mrd. USD (CRS IN12710, 14.07.2026, https://www.everycrsreport.com/files/2026-07-14_IN12710_2941521227c8368b55f7997741b2e31df2fe95a7.html).

**R7 F-16 und Eurofighter**
- **F-16 Block 70:**
  - Mitteilung der DSCA am 26.01.2024: 40 F-16 Block 70 und 79 Nachrüstsätze für rund 23 Mrd. USD (Euro-SD, 01/2024).
  - Im November 2024 strich die Türkei die Nachrüstsätze; die Modernisierung übernimmt sie selbst als ÖZGÜR. Bestand: 238 F-16 (FlightGlobal, 28.11.2024; The Aviationist, 30.11.2024).
- **Eurofighter:** 27.10.2025, 20 neue Maschinen für bis zu 8 Mrd. GBP, erste Lieferung 2030 (Defense News, 27.10.2025). Dazu je 12 gebrauchte aus Katar und Oman (TurDef).

**R8 Industrie**
- **Exporte:**
  - 2023: 5,55 Mrd. USD (TİM, Hürriyet DN, 04.01.2024).
  - 2024: 7,154 Mrd. USD (SSB).
  - 2025: 10,054 Mrd. USD; neue Verträge 17,8 Mrd. USD; Branchenumsatz 2024 20,2 Mrd. USD; rund 100.000 Beschäftigte [Herst.] (Defence Turkey, 07.02.2026).
- **Lokalisierung:** 82,3 % im Jahr 2025 [Reg.] (Daily Sabah).
- **SIPRI Top 100 (2024):** Aselsan Rang 47 mit 3,47 Mrd. USD, TUSAŞ 65, Baykar 73, Roketsan 87, MKE 93 (Hürriyet DN, 01.12.2025).

**R9 Verteidigungshaushalt**
- **NATO** („Defence Expenditure of NATO Countries 2014–2025“, 06/2025, https://nato.int/content/dam/nato/webready/documents/finance/def-exp-2025-en.pdf):
  - Anteil am BIP: 2014 1,45 %, 2022 1,36 %, 2023 1,48 %, 2024 2,13 % (geschätzt), 2025 2,33 % (geschätzt).
  - 2025: 32,6 Mrd. USD; 27,0 % davon für Ausrüstung; 494.500 Personal nach NATO-Definition.
- **SIPRI:**
  - 2024: 25,0 Mrd. USD, 1,9 % des BIP (Fact Sheet 04/2025).
  - 2025: 30,0 Mrd. USD (Hürriyet DN, 27.04.2026).
  - Waffenexporte 2021–2025: 1,8 % Weltanteil, Rang 11 (Hürriyet DN, 09.03.2026).

**R10 Personal und Wehrpflicht**
- **Personal:** IISS 355.200 Aktive, nur sekundär belegt. Global Firepower 2026 (Notbehelf): 481.000 aktiv, 201 Kampfflugzeuge, 2.284 Panzer.
- **Wehrpflichtgesetz Nr. 7179** vom 25.06.2019: 6 Monate, als Reserveoffizier 12 Monate, bezahlter Freikauf nach Art. 9 (https://www.mevzuat.gov.tr/mevzuatmetin/1.5.7179.pdf).
- **Freikaufbetrag:** 2. Halbjahr 2026 472.653,60 TL, nicht amtlich (Kanzleiseite).

### Medien

- **[S]:** nur aus einem Suchauszug bekannt, Seite nicht selbst geöffnet.

**M-R1 Eigentümer und Reichweite**
- **Doğan an Demirören (2018):** Betriebswert 1,1 Mrd. USD, Anteilswert 890 Mio. USD; die Wettbewerbsbehörde genehmigte am 07.05.2018 (Hürriyet DN, https://hurriyetdailynews.com/competition-authority-approves-sale-of-dogans-media-assets-to-demiroren-131471). Danach gehörten nach RSF 9 der 10 meistgesehenen Sender und 9 der 10 meistgelesenen Zeitungen regierungsnahen Eigentümern (RSF, 22.03.2018, https://rsf.org/en/dogan-media-group-sale-completes-government-control-turkish-media).
- **Turkuvaz an die Kalyon-Gruppe (2013):** Sabah und ATV, Preis nicht genannt (Hürriyet DN, 20.12.2013).
- **Habertürk und Show TV:** heute bei der Can Holding unter Zwangsverwaltung des Einlagensicherungsfonds TMSF (Reuters Institute DNR 2026).
- **Media Ownership Monitor (RSF/Bianet):** 42 % des TV-Publikums sehen Sender regierungsnaher Eigentümer (Daten 2020) [S] (https://turkey.mom-rsf.org/en/findings/concentration/).
- **RSF 2026:** „90 % der nationalen Medien unter Regierungskontrolle“ (https://rsf.org/en/country/turkey).
- **Vertrauen in Nachrichten (Reuters Institute, Digital News Report):** 35 % (2024), 33 % (2025), 28 % (2026, weltweit 37 %). 2026 meiden 60 % Nachrichten; Plattformen befolgen Sperranordnungen zu 91,8 % (TikTok), 85,7 % (X) und 79,2 % (Instagram) (https://reutersinstitute.politics.ox.ac.uk/digital-news-report/2026/turkey).

**M-R2 TRT**
- **Führung:** Vorstand und Generaldirektor nominiert der Präsident (OSZE/ODIHR, Abschlussbericht 2023, Fn. 109).
- **Finanzierung:** Bis 2021 kamen 2 % der Stromrechnung an TRT, 2019 rund 1,05 Mrd. von 3,17 Mrd. TL Einnahmen (bianet, 11/2021). Der Anteil wurde 2022 abgeschafft [S].

**M-R3 RTÜK**
- **Zusammensetzung:** 9 Mitglieder, vom Parlament nach Sitzanteilen gewählt [S]. 2023: 5 AKP, 1 MHP, 2 CHP, 1 HDP (OSZE/ODIHR 2023, Fn. 105).
- **Strafen gegen kritische und regierungsnahe Sender:**
  - 2019 bis Mai 2020 trafen 28 Geldstrafen und 27 Sendeverbote kritische Sender (Halk TV, Tele1, Fox, KRT), keine A Haber, TV Net oder Kanal 7. Die Zählung stammt vom CHP-Mitglied İlhan Taşcı, ist also parteilich (bianet, 18.05.2020).
  - 2021 bis September: Halk TV 18, Tele1 15, Fox 9 Sanktionen, die regierungsnahen Sender je 0 (Duvar English, 27.09.2021).
  - Wahlkampf 2023: 8 von 10 Sanktionen gegen kritische Sender (OSZE, Fn. 106).
  - 2025: 99 Sanktionen, rund 5,3 Mio. USD; Sözcü TV 16 Sanktionen und 10 Tage Abschaltung (Advanced Television, 05.01.2026).
  - Sözcü TV: 10 Tage Abschaltung am 27.03.2025 [S]. Eine Abschaltung von Halk TV stoppte im Juli 2025 ein Gericht [S].
- **Lizenz für Online-Sender:** Die Verordnung erschien am 01.08.2019. DW und VOA verweigerten die Lizenz und wurden am 30.06.2022 gesperrt (Friedensstrafgericht Ankara, Beschluss 2022/7982; Hürriyet DN, 01.07.2022).

**M-R4 Internetsperren**
- **Gesperrte Seiten:**
  - Bis Ende 2024 waren 1.264.506 Websites und Domains gesperrt [S]; 2024 allein rund 311.000, ein Rekord [S] (İFÖD/EngelliWeb nach Turkish Minute, 02.09.2025).
  - Freedom House: über 953.000 Domains (Dez. 2023).
- **Wikipedia:** gesperrt 04/2017. Das Verfassungsgericht nannte die Sperre am 26.12.2019 mit 10:6 grundrechtswidrig; frei seit 15.01.2020 [S].
- **Twitter nach dem Erdbeben:** am 08.02.2023 rund 9 Stunden gefiltert (Duvar English).
- **İmamoğlu-Festnahme März 2025:** 42 Stunden Drosselung von X, Instagram, YouTube, TikTok, WhatsApp und Signal (Freedom House FOTN 2025; OONI, 20.11.2025, https://ooni.org/post/2025-turkiye-throttling-social-media/).
- **Plattformsperren:** Instagram vom 02. bis 10.08.2024 (9 Tage); Discord seit 09.10.2024 [S].
- **Gesetz 7253:** Amtsblatt Nr. 31202 vom 31.07.2020. Es verlangt einen lokalen Vertreter und erlaubt Strafen von 10 Mio. TL bis zu 90 % Drosselung der Bandbreite (Erdem & Erdem).
- **Folge der Sperren:** Nach der Festnahme İmamoğlus 2025 stiegen die Anmeldungen bei Proton VPN um 1.100 % [S]; 2026 blockieren die Behörden auch VPN (Reuters Institute DNR 2026).

**M-R5 Desinformationsgesetz**
- **Inhalt:** Seit Oktober 2022 ist die Verbreitung falscher Informationen strafbar (Art. 217/A des Strafgesetzbuchs).
- **Verfassungsgericht:** bestätigte es am 08.11.2023 (MLSA).
- **Bilanz 18.10.2022 bis 10.10.2024:** 4.188 Ermittlungen gegen 4.590 Personen, 33 Verhaftungen, 12 Verurteilungen, 146 Freisprüche. Die Zahlen nannte ein AKP-Abgeordneter (MLSA, 20.11.2024, https://mlsaturkey.com/en/4590-investigations-33-arrests-under-turkeys-censorship-law-in-two-years).
- **Nicht belegt:** Strafrahmen und Gesetzesnummer. Im Plan steht deshalb „Desinformationsgesetz Oktober 2022 (Art. 217/A)“ ohne Nummer.

**M-R6 Indizes**
- **RSF-Pressefreiheitsindex** (Wikipedia „World Press Freedom Index“; RSF, Länderseite):

| Jahr | Rang | Punkte |
|---|---|---|
| 2020 | 154 | 49,98 |
| 2022 | 149 | 41,25 |
| 2023 | 165 | 33,97 |
| 2024 | 158 | 31,60 |
| 2025 | 159 | 29,40 |
| 2026 | 163 | 27,94 |

  Das Spiel startet mit dem Wert von 2025, Rang 159 und 29,4 (`data/medien.ts:189`).
- **Freedom on the Net:** 31 von 100 (2024, 2025).
- **Inhaftierte Journalisten (CPJ, Stichtag 1. Dezember):** 81 (2016, Höchststand) [S], 40 (2022) [S], 13 (2023) [S].
- **EU-Zählung:** 54 inhaftierte Medienschaffende im Juni 2024 (EU-Kommission, Türkiye Report 2024).

**M-R7 Wirkung auf Wahlen und Ansehen**
- **OSZE/ODIHR zur Wahl 2023** (Abschlussbericht vom 29.09.2023, https://odihr.osce.org/odihr/elections/turkiye/553966):
  - TRT-1 und TRT Haber gaben dem Lager Erdoğans 44 bzw. 45 % der politischen Berichterstattung, überwiegend positiv. Kılıçdaroğlu bekam 28 bzw. 25 %, überwiegend negativ.
  - In der Stichwahl: 64 bzw. 73 % gegen 36 bzw. 27 %.
  - Ein Interview Erdoğans lief gleichzeitig auf 29 Sendern.
- **EU-Bericht 2024:** „keine Fortschritte“. Social-Media- und Desinformationsgesetz seien mit EU-Recht und der Menschenrechtskonvention unvereinbar.
- **V-Dem 2026:** Wahlautokratie, Liberaler Demokratieindex 0,11.
- **Effekt auf das Wahlergebnis:** Eine Studie, die die Wirkung der Mediensteuerung auf das Ergebnis beziffert, ist **nicht belegt**. Die Wirkung im Spiel bleibt deshalb Spielparameter. Belegt sind nur die Richtung (Sendezeit ungleich, Vertrauen in Nachrichten sinkt, Ausweichen ins Netz und auf VPN) und die Folgen für das Ansehen (EU-Bericht, RSF-Rang).

**Hinweise zur Kalibrierung (Prüfauftrag, keine Festlegung)**
- **Strafen:** 2025 gab es 99 RTÜK-Sanktionen, und der RSF-Wert fiel im selben Jahr nur von 29,40 auf 27,94. Im Spiel kostet eine einzige Aufsichtsstrafe einen ganzen Punkt (`data/medien.ts:179`, Spielparameter). Je Handlung ist das um ein Vielfaches stärker als in der Wirklichkeit. Die Wirkung sollte eher über den Dauerregler laufen (Aufsicht hoch = viele Strafen) und der einzelne Eingriff weniger kosten, dafür aber sichtbar berichtet werden.
- **Anteil regierungsnah:** Im Spiel liegt er bei 30 %. Der MOM nennt 42 % des TV-Publikums (2020) [S], RSF spricht von 90 % der nationalen Medien. Der Startwert ist an diesen Quellen zu prüfen.

### Vergleich mit anderen Spielen

**V1 Democracy 4 (Positech, Modding-Dokumentation, https://www.positech.co.uk/democracy4/mod_events.html und Folgeseiten)**
- **Was es gibt:**
  - Ereignisse werden alle 3 Runden geprüft und feuern ab einer Wertung von 70 %.
  - Dilemmata haben 2 bis 3 Wege und danach 32 Runden Sperre.
  - Situationen haben getrennte Start- und Stoppschwellen und stehen grün oder rot auf dem Hauptbildschirm.
  - Jede Politik hat getrennte Kapitalpreise für Einführen und Nachjustieren und wirkt träge (Durchschnitt der letzten n Stände).
- **Übertragbar:**
  - Situationen wie „Lieferstopp“, „Medienmonopol“ oder „Lücke an der Grenze“ dauerhaft sichtbar machen (S4, M3).
  - Die Trägheit anzeigen.
- **Nicht übernehmen:** Die Folgen von Ereignissen sind in Democracy 4 verborgen. Genau das ist hier das Problem.

**V2 Suzerain (Torpor Games, https://www.suzeraingame.com, Rezension VICE 08.02.2021)**
- **Was es gibt:**
  - Entscheidungen kommen über Gespräche mit Ministern und über einen ständigen Strom aus Berichten und Zeitungsartikeln.
  - Budgetpunkte (−4 bis +4) schalten Vorhaben frei, die neue Ereignisse und Gespräche bringen.
  - In der Erweiterung Rizia gibt es Ressourcen mit Zu- und Abgang je Runde, Dekrete und einen rundenbasierten Krieg mit Aufbau der Streitkräfte.
- **Übertragbar, die Kernlösung für beide Bereiche:** Eine Beschaffung oder ein Mediengesetz löst Gespräche und Vorgänge aus. Der Minister kommt mit dem Thema (S5, M2). Die Zeitung ist die Rückmeldung (S6, M3).

**V3 Tropico 6 (Kalypso, Handbuch, https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/492720/manuals/T6_Manual_PC_USA_ONLINE.pdf)**
- **Was es gibt:**
  - Fraktionen nennen offen, was sie mögen: Militaristen mögen Militärgebäude, Intellektuelle keine militärischen Traditionen.
  - Im Kalten Krieg braucht man Militär gegen Aufstände.
  - Gebäude haben Arbeitsmodi.
- **Übertragbar:**
  - Rüstung bekommt eine sichtbare Lobby (Generalstab, Nationalisten, Industrie), die sich meldet (S5).
  - TRT als Haus mit Modus „ausgewogen“ oder „Regierungslinie“ statt vieler Einzelknöpfe (M5).

**V4 Hearts of Iron IV und Victoria 3 (Community-Wikis, https://hoi4.paradoxwikis.com/Production, https://vic3.paradoxwikis.com/Laws)**
- **HoI4:**
  - Produktionslinien mit Anlaufkurve: Die Effizienz startet bei 10 % und braucht rund 250 Tage von 25 % auf 75 % der Obergrenze.
  - Lizenzfertigung mit 25 bis 35 % Abschlag.
  - Übertragbar: Lizenzfertigung als eigene Lieferantenwahl, etwa Altay mit koreanischem Antrieb, und Anlaufzeit statt Sprung (S2).
- **Victoria 3:**
  - Gesetze in drei Phasen mit Prüfpunkten, an denen ein Ereignis kommt; nach drei Rückschlägen scheitert das Gesetz.
  - Übertragbar für Mediengesetze (Internetsperren, Aufsicht): Ein Gesetz meldet sich unterwegs mit Ereignissen (M2, M5).

---

## 8. Messdaten und Werkzeuge
- **Sonde:** `…/welle/a4/werk/_sonde_a4.test.ts` (Kopie des Tests; die Arbeitskopie ist abgeräumt). Ergebnisse in `werk/sonde-inhaber.json` und `werk/sonde-frisch.json`.
- **Rundgänge:** `werk/rundgang.cjs` (Spielstand des Inhabers), `werk/frisch.cjs`, `werk/handeln.cjs`. Protokolle in `werk/rundgang-inh.json` und `werk/frisch.json`.
