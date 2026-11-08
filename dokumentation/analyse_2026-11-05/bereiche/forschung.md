# A1 · Forschung & Ziele: warum der Bereich nicht gespielt wird und wie er gut wird

Stand: 06.11.2026, Arbeitskopie `welle/a1/wt` (Stand b0ce3f3), Vite auf Port 5231. Analyse und Umbauplan, kein Umbau.
Grundlage: Spielstand des Inhabers vom 3. August 2043 (`scratchpad/spielstand/s2043.json`), dazu seine Stände vom Juli 2028 (`alt.json`) und Februar 2039 (`neu.json`) und ein frisches Spiel. Jede Zahl aus dem Spiel ist eine Messung (Sonde `wt/game/test/zz_a1_sonde.test.ts`, Ergebnis `a1/sonde*.json`) oder steht mit Datei:Zeile da. Zahlen aus der Wirklichkeit stehen mit Quelle in Abschnitt 6. Alle übrigen Werte im Plan heißen „Spielparameter“.

---

## 1. Ist-Zustand in Zahlen

Der Bereich „Forschung & Ziele“ (`ui/Stage.tsx:607–613`) hat vier Reiter und einen fünften Knopf. Darin stecken fünf Systeme mit zusammen rund 220 Entscheidungsstellen:

| System | Umfang | Datei | Nutzung durch den Inhaber (2028–2043) |
|---|---|---|---|
| Fokusbaum | 102 Foki in 7 Ästen | `sim/fokus.ts`, `data/fokusbaum.ts` | 11 vollendet, im Mittel einer alle 385 Tage; zuletzt Januar 2042; seitdem keiner |
| Große Ziele | 10 Ziele × 3 Stufen | `sim/grosseziele.ts` | 2 verfolgt; Nahost 1 Stufe (Teilerfolg 2034), danach 8 Jahre kein Versuch; Technologie 0 Versuche |
| Wissensbaum | 50 Knoten in 6 Zweigen | `sim/wissensbaum.ts`, `data/wissensbaum.ts` | 0 Knoten selbst begonnen, Schwerpunkt nie, 0 Lizenzen; fertig sind nur Altay und Stahlkuppel, beide schon vor Spielbeginn im Bau |
| Programme | 8 Programme, 36 Schritte | `sim/programme.ts` | 9 Schritte fertig (Preisstabilität 4, Erdbeben 5), 3 bereit, 0 laufen |
| Stand der Agenda (Amtsziele) | 2–3 Ziele je Amtszeit | `sim/ziele.ts` | Amtszeit 1: 3 gewählt, Amtszeit 2: keine, Amtszeit 3: 2 |

Aus der Sonde (Stand 3. August 2043):
- Forschungstempo ×1,8, Forschungsetat 1,0 % des BIP, Innovationsgrenze 1,6 %.
- 16 Knoten „möglich“. 15 davon sind gesperrt, weil die Verwaltungskraft bei 0 steht (Einkommen 19,2, Bau 9,2, Unterhalt 14,3, netto −4,3 im Monat).
- Die Verwaltung ist seit Januar 2038 leer. Damals lagen 21 Vorhaben in der Warteschlange, 18 davon ohne jeden Fortschritt, darunter 13 Restaurierungen aus dem Spätsommer 2036. Heute liegen dort noch 16 Vorhaben, 9 ohne Fortschritt.
- Große Ziele: Nahost Stufe 2 ist spätestens seit Februar 2039 versuchbar (Chance damals 28 %, heute 36 %). Technologie Stufe 1 ist versuchbar (Chance 44 % 2039, 52 % heute) und wurde nie versucht.
- Programme: 3 Schritte sind bereit, keiner läuft. Der Schritt „Zweistellige Inflation ist Vergangenheit“ ist bereit, seit die Inflation unter 15 % liegt (6,0 %).

### Bilder

Spielstand des Inhabers (2043):
- `a1/bilder/inhaber/02-wissen-akte.png`: Einstieg, Fokusbaum mit „Kein Fokus läuft: 14 Wege offen“. Die Navigation hat für diesen Bereich kein Zählabzeichen, anders als Schreibtisch (7), Land (2) und Medien (44).
- `a1/bilder/inhaber/05-große_ziele.png`: zehn Ziele, neun davon mit dem Wort „gut“, auch bei einer Chance von 26–46 %.
- `a1/bilder/inhaber/07-wissensbaum.png`: „Gerade läuft keine Forschung.“ Darunter „Als Nächstes möglich: Chip-Entwurfszentrum, 6 Kapital, etwa 42 Monate“. Kein Hinweis, dass alles gesperrt ist.
- `a1/bilder/inhaber/22-baum.png`: Baumfenster, oben 300 px leer, alle 16 Knoten in Gold als „möglich“.
- `a1/bilder/inhaber/23-zweig.png`: Schwerpunkt für 2 Kapital, versteckt hinter einem Klick auf den Zweignamen.
- `a1/bilder/inhaber/24-knoten.png`: Erst im vierten Klick steht „Die Verwaltung ist ausgelastet“. Alle drei Knöpfe sind grau.
- `a1/bilder/inhaber/43-fokus-blatt.png`: Fokus „Die 28-Nanometer-Fabrik“ mit Preis, Folgen, Reaktionen und Partnern auf einem Blatt. So sieht der Bereich aus, wenn er funktioniert.
- `a1/bilder/inhaber/08-programme.png`: Programme mit Schrittkette, „Danach: Kapital +10, Vertrauen +3“ und Knopf „Umsetzen“.
- `a1/bilder/inhaber/44-tisch-s1.png`: Schreibtisch mit sieben Entscheidungen, Fristen, Lage und Warnung „Verwaltungskraft aufgebraucht“. Forschung, Fokus und Große Ziele kommen nicht vor; Programme nur als eine Frist.
- `a1/bilder/inhaber/41-agenda.png`: Stand der Agenda. Fokus, Wissensbaum und Amtsziele stehen noch einmal untereinander.

Frisches Spiel (Juni 2028):
- `a1/bilder/frisch/06-wissensbaum.png`: Möglich sind nur drei Rüstungsknoten (Hürjet, KAAN-Triebwerk, TF-2000). Alle zivilen Zweige sind gesperrt, weil die Forschungsförderung bei 30 liegt und 42 verlangt ist (`data/reich/technologie.ts:351`, `data/politiknetz.ts:432`). Dazu fehlen Hochschulen und Fachkräfte.
- `a1/bilder/frisch/05-große_ziele.png`, `03-fokusbaum.png`, `07-programme.png`: Startzustand der drei anderen Reiter.

---

## 2. Was die guten Bereiche hier selbst vormachen

Im eigenen Bereich liegen zwei Systeme, die der Inhaber genutzt hat. An ihnen lässt sich ablesen, was funktioniert.

**Fokusbaum, 11 Mal genutzt:**
- Ein Klick auf ein Blatt zeigt Preis, Dauer, Folgen, Gewinner und Verlierer, die Partner und was er vorbereitet. Ein Knopf beginnt ihn (`43-fokus-blatt.png`).
- Er dauert 2 bis 5 Monate (60–150 Tage, `data/fokus*`). Das ist kürzer als ein Programm im Parlament.
- Beim Abschluss erscheint ein eigenes Fenster mit Zitat (`sim/fokus.ts:335`), eine Zeile in der Chronik, und Wählergruppen und Partner reagieren.
- Die Kopfzahl „Kein Fokus läuft“ steht im Bereich in Gelb (`ui/akte/Bereiche.tsx:153–154`).

**Programme, 9 Schritte:**
- Sie melden sich auf dem Schreibtisch unter Fristen (`ui/schreibtisch/briefing.ts:335, 624`) und als Kapsel oben (`ui/Stage.tsx:1498–1501`).
- Jeder Schritt bekommt Wirkungsberichte nach 6, 12 und 24 Monaten (Log ab Oktober 2033).

**Die drei Systeme, die er nicht genutzt hat, haben nichts davon:**
- Ein Durchbruch im Wissensbaum ist nur eine Logzeile (`sim/wissensbaum.ts:590`). Es gibt kein Fenster und keinen Hinweis.
- Die Zeitung meldet nur Wunder, Großprojekte und Serien (`sim/reich.ts:1129–1139`). Forschungsknoten sind „Ausbau“ und kommen dort nie vor.
- Rückblicke kennen nur Ereignis, Programm und Vertrag (`sim/berichte.ts:684`).
- Ein Großes Ziel meldet sich erst nach einem Versuch (`sim/grosseziele.ts:405`), nie davor.
- Weder Wissensbaum noch Große Ziele stehen in `briefing.ts` oder in den Kapseln von `Stage.tsx`.

---

## 3. Ursachen, gemessen

### U1. Der Fokusbaum erzählt die Forschung schon, schneller und mit Belohnung

9 der 14 Foki im Ast „Wissenschaft & Zukunft“ und 4 Foki im Ast Sicherheit tragen denselben Gegenstand wie ein Knoten im Wissensbaum (`data/fokusbaum.ts:159–189`, `OEFFNET`):

| Fokus | Knoten im Wissensbaum |
|---|---|
| TÜBİTAK Halbleiter-Fabrik, 28-Nanometer-Fabrik | Chip-Entwurf, Chipfabrik |
| Nationales Zentrum für KI, Rechenzentrum für das Land | KI-Strategie, KI-Rechenzentren |
| Türkische Raumfahrtagentur, Satelliten-Netzwerk | Raumfahrtbehörde, Satelliten, Weltraumbahnhof |
| Quantencomputing & Genom-Medizin | Quantenzentrum, Genomprogramm |
| Impfstoffwerk, Batteriezellen | Impfstoffwerk, Batteriezellfabrik |
| KAAN, Drohnen, Flotte, Stahlkuppel | die Rüstungsknoten |

Der Inhaber hat „TÜBİTAK Halbleiter-Fabrik“ im August 2039 vollendet. Der Text lautet: „Herstellung eigener Silizium- und Galliumnitrid-Chips beendet die Abhängigkeit von globalen Lieferketten.“ Im Wissensbaum steht die Chipfabrik bei 0 %.

Der Spieler hat also schon das Gefühl, geforscht zu haben: für 5 Monate statt 7 Jahre und mit einem Fenster statt einer Logzeile. Der Fokus bringt dem Baum nur einen Tempofaktor ×1,2 (`data/fokusbaum.ts:39`) und ×1,25 auf alle Knoten (`modifikatoren` im Spielstand: `fokus:forschung 0.25`). Davon kommt nichts an, weil nichts läuft.

### U2. Der Baum war nie offen, als der Inhaber die Mittel hatte

| Zeitraum | Was sperrte | Beleg |
|---|---|---|
| 2028–2038 | Forschungsförderung 30, verlangt 42 bis 55 je Knoten. Möglich waren nur Rüstungsknoten (2028: 4 frei, 5 durch Förderung gesperrt). | Sonde `lage_alt.json`, `data/politiknetz.ts:432` |
| ab Oktober 2038 | Das Gesetz zur Forschungsförderung (2,79 % des BIP) gilt, mit 39 Monaten Umsetzung. | Log 08.10.2038 |
| ab Januar 2038 | Die Verwaltungskraft ist 0. Ein Knoten verlangt das Dreifache seines Verwaltungsbedarfs als Vorrat (`sim/reich.ts:385`), beim Chip-Entwurf also 4,2. | Sonde: Februar 2039 waren 7 Knoten durch Verwaltung gesperrt, heute 15 von 16 |

Die Verwaltung aber teilt sich der Wissensbaum mit Bau und Land. Die 13 Restaurierungen von 2036 haben die Forschung bis heute blockiert, ohne dass die Forschungsseite das sagt.

Zur Probe: Restaurierungen pausieren, zwei Monate warten, dann starten. Dann beginnen KI-Strategie und Chip-Entwurf (Sonde `dauer`).

### U3. Die Ansicht verschweigt die Sperre und rechnet die Dauer falsch

- „Als Nächstes möglich“ filtert nur nach dem Zustand (`ui/wissen/Wissensbaum.tsx:33`). Es zeigt 16 Knoten mit Preis und Dauer, obwohl `k.grund` gesetzt ist. Den Grund sieht man erst im vierten Klick (`24-knoten.png`).
- Im Baumfenster leuchten dieselben Knoten golden als „möglich“ (`22-baum.png`).
- Die Dauer ist die geplante Bauzeit ohne Tempo (`sim/wissensbaum.ts:259`, `monate: angebot.monate`).
  - Angezeigt für den Chip-Entwurf: „etwa 42 Monate“.
  - Gemessen bei Tempo 2,6: 720 von 780 Baupunkten nach 21 Monaten, also etwa 23 Monate bis fertig.
  - Die 11 Foki und das Forschungsgesetz des Inhabers wirken also, aber die Ansicht zeigt es nicht.
- Das Wort der Chance bei den Großen Zielen: Der Wert `aussichtsreich` ist mit „gut“ übersetzt (`i18n/katalog/de/grosseziele.json:92`). Deshalb heißen 36 % und 70 % gleich. Entscheidung Q.6 verlangt „aussichtsreich, etwa 40–60 %“.

### U4. Er meldet sich nie

- Schreibtisch, Kapseln, Abzeichen in der Navigation: keine Zeile zu Forschung oder Großen Zielen (siehe Abschnitt 2).
- Kein Ereignis, keine Vorlage und kein Rat des Stabs führt in den Wissensbaum oder zu einem Versuch bei einem Großen Ziel (Suche nach `beginneKnoten`, `versuche`, `geheWeg` außerhalb der eigenen Dateien: kein Treffer). Der Inhaber hat über 900 Ereignisse entschieden, aber dieser Bereich war nie dabei.
- Nahost: Die Wege gingen 2033 bis 2035, der Teilerfolg kam im August 2034. Spätestens seit Februar 2039 ist Stufe 2 versuchbar, ohne dass das Spiel es je gesagt hat.

### U5. Die Wirkung ist zu klein und kommt nicht an

Gemessen: Zustimmung 12 Monate nach der Handlung, Stand 3. August 2043, gegen „nichts tun“ (64,1).

| Handlung | Zustimmung nach 12 Monaten | Sichtbare Folge |
|---|---|---|
| nichts | 64,1 | – |
| Programmschritt-Belohnung „Vertrauen +3“ | 64,3 (sofort 65,9) | Wirkungsbericht nach 6, 12 und 24 Monaten |
| Großes Ziel Technologie, Stufe 1 gelingt (12 PK) | 64,2 | Rüstungsautarkie +4, Export +2, Ansehen +2, ein Fenster |
| Großes Ziel Nahost, Stufe 2 gelingt (12 PK) | 64,1 | Terrorgefahr −4, Länderwerte; im Land nichts Sichtbares |
| Chip-Entwurfszentrum sofort fertig | 64,1 | Hochschule +0,8, Export +0,4 nach 12 Monaten, eine Logzeile |

Ein Knoten oder eine Zielstufe bewegt die Zustimmung um 0 bis 0,1 Punkte. Zum Vergleich: Das Forschungsgesetz des Inhabers bekam einen Wirkungsbericht („Ansehen +5,2“, Log 27.09.2040).

Die Zustimmung rechnet mit Vertrauen (45 %), Gruppen (25 %) und Wirtschaft (30 %) (`sim/spiel.ts:160–172`). Gründungen, Hochschule und Export erreichen davon kaum etwas.

### U6. Zu viele Systeme, ein Wort für vier Dinge

Fokusbaum („Agenda“ in ENTSCHEIDUNGEN N), Große Ziele, Programme („Ziele über mehrere Schritte“) und Amtsziele („Ziele erreicht 1/2“ im Kopf) heißen alle „Ziel“ oder „Agenda“.

Der Knopf „Stand der Agenda“ zeigt Fokus, Wissensbaum und Amtsziele noch einmal (`41-agenda.png`).

Der Wissensbaum bietet zudem Entscheidungen, die ohne laufende Forschung leer sind:
- Schwerpunkt für 2 Kapital mit Tempo ×1,25 und ×0,9 (`data/wissensbaum.ts:137–140`)
- Träger (Staat, Firma, Ausland)
- Standort aus bis zu vier Provinzen mit Strom, Wasser und Fachkräften

### U7. Zum Gewinnen nicht nötig

Der Inhaber hat drei Amtszeiten mit 61 % Zustimmung regiert, ohne einen Knoten zu beginnen. Die Sonde zeigt auch, warum: Das Spiel endet im Juni 2045 (Ende der letzten Amtszeit, Sonde `dauer.ende`). Ein im August 2043 begonnener Chip-Entwurf wird bis dahin nicht fertig.

Der Bereich belohnt eine Zukunft, die in der Spielzeit nicht ankommt, und sagt das nicht.

**Rangfolge der Ursachen:**
1. U1 Doppelung mit dem Fokusbaum
2. U2 und U3 Sperre durch fremde Systeme, verschwiegen
3. U4 meldet sich nie
4. U5 Wirkung zu klein
5. U6 zu viele Systeme
6. U7 zum Gewinnen nicht nötig

Zu wenig gefunden oder zu viel Text ist hier nicht der Kern. Der Bereich ist leicht zu finden, und die Fokusblätter werden ja gelesen.

---

## 4. Ziel des Bereichs

**Die eine Frage:** Welche Zukunft baut mein Land, und was bezahle ich heute dafür?

Sie verbindet beide Hälften: Forschung ist der Weg, ein Großes Ziel ist die Ankunft. Fokus und Programm sind die politischen Beschlüsse, die beides anstoßen.

**Vier echte Entscheidungen**, jede mit Preis und sichtbarer Wirkung:

1. **Wie viel Geld fließt in Forschung?**
   - Das ist der Forschungsetat in % des BIP, im Haushalt und als Gesetz zur Forschungsförderung.
   - Echter Anker: Die Türkei gab 2025 1,55 % des BIP aus (2024: 1,46 %). Das Ziel des 12. Entwicklungsplans sind 2,05 % bis 2028 (Abschnitt 6, R1).
   - Preis: Geld und Defizit. Wirkung: Zahl der gleichzeitigen Forschungsvorhaben und Tempo.
   - Das ist HOI4 mit festen Forschungsplätzen, an die Wirklichkeit gekoppelt.
2. **Welche drei Vorhaben erforschen wir jetzt?**
   - Einmal im Jahr und immer, wenn ein Platz frei wird, legt der Forschungsrat drei Karten vor.
   - Nach Stellaris: drei Angebote statt eines Baums mit 50 Knoten.
   - Preis: Kapital und Jahre. Wirkung: ein Durchbruch mit Fenster, Zeitung und Wirkungsbericht.
3. **Selbst entwickeln oder kaufen?**
   - Lizenz oder Partner: schneller, aber abhängig. Sperrt der Partner, steht alles still.
   - Das ist die echte Lage der Türkei (Abschnitt 6, R7):
     - Das deutsche Embargo für Motor und Getriebe zwang Altay auf einen koreanischen Antrieb.
     - CAATSA sperrte der Rüstungsbehörde SSB 2020 alle US-Exportlizenzen.
     - KAAN fliegt mit einem US-Triebwerk (GE F110).
   - Das ist die stärkste Entscheidung des Bereichs.
   - Der Code dafür ist schon gebaut, aber unerreichbar.
4. **Wann wagen wir den großen Schritt?**
   - Der Versuch bei einem Großen Ziel: Chance als Wort und Band, Scheitern mit Sperre.
   - Er muss sich melden und ein spürbares Ergebnis haben.

**Was dafür nicht gebraucht wird:**
- der Schwerpunkt als eigene Entscheidung (der Fokus „Nationale Innovationsinitiative“ ist schon ein Schwerpunkt)
- die Standortwahl unter vier Provinzen als Pflichtschritt
- die Trägerwahl Staat oder Firma als eigener Schritt (bleibt als Folge der Lizenzentscheidung: Ausland heißt Partner)

**Realismus:**
- Programme dauern in der Türkei vom Beschluss bis zum Nutzen (Abschnitt 6, R8):
  - zivile Großprojekte 5 bis 10 Jahre (TOGG rund 5, Satelliten 6 bis 10), Akkuyu bisher über 15
  - große Waffensysteme 13 bis 18 Jahre (KAAN: Beschluss 2010, Erstflug Februar 2024; Altay: Vertrag 2007, im Dienst Oktober 2025)
  - Verzögerungen von 2 bis 4 Jahren sind die Regel, meist durch ein fremdes Bauteil oder ein Embargo
- Ein Präsident erntet also oft, was ein Vorgänger gesät hat.
- Das Spiel soll das zeigen, statt Knoten in 12 Monaten fertig zu machen oder sie unsichtbar auf 7 Jahre zu legen. Dafür gibt es zwei Wege:
  1. **Zwischenernten:** Jeder lange Knoten hat einen Meilenstein mit eigener Meldung, etwa Prototyp, Erstflug, erster Wafer.
  2. **Vermächtnis:** Was bei Amtsende läuft, steht in der Bilanz als „angestoßen“.

---

## 5. Umbauplan

Jeder Schritt kann ein Agent an einem Tag bauen. Die Reihenfolge folgt der Ursachenliste. Alle neuen Zahlen sind Spielparameter, außer wo eine Quelle steht.

### Schritt 1: Ehrliche Anzeige (Ursache U3)

Was zu tun ist:
- „Als Nächstes möglich“ zeigt nur Knoten ohne `grund`. Gesperrte Knoten stehen darunter als eine Zeile mit dem einen Grund und dem Sprung.
  - Beispiel: „Forschung wartet: Die Verwaltung ist voll, 13 Restaurierungen binden sie. [Zur Baustelle]“
- Die Dauer rechnet mit dem Tempo: `monate / tempoTeile(w, id).gesamt`, gerundet, als „etwa 23 Monate“. Die Bauzeit ohne Tempo steht im Tooltip.
- Im Baumfenster werden möglich, aber blockiert, Knoten mit Schloss und ohne Gold dargestellt.
- Das leere obere Band im Baumfenster (`22-baum.png`) entfällt.
- Übersetzung: `gz2.wort.aussichtsreich` heißt „aussichtsreich“ in de, en und tr.

Dateien:
- `ui/wissen/Wissensbaum.tsx`
- `ui/wissen/BaumFenster.tsx`
- `ui/wissen/wissensbaum.css`
- `sim/wissensbaum.ts` (Feld `monateEcht`)
- `i18n/katalog/{de,en,tr}/grosseziele.json`
- Test `test/wissensbaum-ui.test.tsx`

Prüfung: Mit dem Spielstand des Inhabers zeigt die Übersicht 0 freie und 15 wartende Knoten mit Grund.

### Schritt 2: Forschung bekommt eigene Plätze statt der Bauverwaltung (Ursache U2)

Was zu tun ist:
- Knoten des Wissensbaums der Klassen „ausbau“ und „forschung“ brauchen keine Verwaltungskraft mehr. Sie belegen einen **Forschungsplatz**.
- Vorbild ist N6: Die Rüstung bekam eigene Baukapazität (ENTSCHEIDUNGEN X.6).
- Zahl der Plätze:
  - Spielparameter: 2 Plätze beim Startetat, ein weiterer je 0,25 % des BIP mehr staatlichem Forschungsetat, höchstens 5. HOI4 beginnt mit 2 oder 3 Plätzen (Abschnitt 6, C).
  - Anker zur Einordnung, nicht als Formel:
    - Der Startetat des Spiels von 0,4 % des BIP passt zum staatlich finanzierten Teil der echten F&E: 31,1 % von 1,55 % sind etwa 0,48 % (R1, eigene Rechnung).
    - Das Planziel 2,05 % bis 2028 entspräche dem gut Anderthalbfachen.
  - Mit dem Etat des Inhabers (1,0 %) wären es 5 Plätze; das zeigt, dass die Schwelle am Bot kalibriert werden muss.
- Werke (Chipfabrik, Batteriezellfabrik, Triebwerk) bleiben Bauvorhaben mit Verwaltung und Standort. Ihre Forschung davor belegt einen Platz.
- Der Kopf des Bereichs zeigt „Forschungsplätze 1 von 3 belegt“ statt „Hochschulen 75“.

Dateien:
- `sim/reich.ts` (`vorhabenSicht` Z. 385, `verwaltungBilanz`, `bauPool`)
- `sim/wissensbaum.ts` (`knotenSicht`, neues `forschungsPlaetze`)
- `data/wissensbaum.ts` (`BAUM.plaetze`)
- `ui/akte/Bereiche.tsx:152–158`
- Test `test/wissensbaum.test.ts`

Migration: Laufende Knoten in alten Ständen belegen Plätze, notfalls über die Grenze, und blockieren dann neue.

Prüfung: Im Spielstand des Inhabers sind drei Knoten sofort startbar, die Restaurierungen bleiben unberührt. Der Balance-Lauf des klugen Testspielers bleibt im bisherigen Band.

### Schritt 3: Fokus beschließt, Wissensbaum baut (Ursache U1)

Was zu tun ist:
- Die 13 doppelten Foki werden zum politischen Beschluss des Knotens. Bei Vollendung beginnt der zugehörige erste Knoten selbst, ohne Kapital für den Knoten, sofern ein Forschungsplatz frei ist. Sonst steht er als „beschlossen, wartet auf Platz“ obenauf.
- Die Texte der Foki sagen Beschluss, nicht Ergebnis.
  - „TÜBİTAK Halbleiter-Fabrik“ wird „Halbleiterstrategie beschlossen“.
  - Neuer Text: „Das Land will eigene Chips: Entwurfszentrum und später eine Fabrik werden geplant.“
- Was beim Fokus gilt, steht unter „Bereitet vor“ als „Startet: Chip-Entwurfszentrum (etwa 23 Monate)“.
- Der Wissensbaum-Schwerpunkt entfällt als eigene Entscheidung. Der Fokus „Nationale Innovationsinitiative“ und der Etat ersetzen ihn. Code und Spielstandfeld bleiben lesbar, die Oberfläche fällt weg.

Dateien:
- `data/fokusbaum.ts` (`OEFFNET` bekommt `startet`)
- `sim/fokus.ts` (`vollende`, Z. 324–329)
- `sim/wissensbaum.ts` (`beginneKnoten` mit `beschluss: true`)
- `i18n/katalog/{de,en,tr}/fokus.json` (13 Texte)
- `ui/wissen/BaumFenster.tsx` (Schwerpunkt-Knopf raus)
- Tests `test/fokusbaum.test.ts`, `test/fokus-daten.test.ts`

Prüfung: Fokus „Halbleiter“ vollendet, und der Chip-Entwurf läuft. Ein alter Spielstand mit vollendetem Fokus bekommt den Knoten als „beschlossen“ angeboten, nicht nachträglich geschenkt.

### Schritt 4: Der Forschungsrat legt vor (Ursache U4, Schreibtisch)

Was zu tun ist:
- Neue Vorlagenkarte auf dem Schreibtisch, gleiche Karte wie die Ressortvorlagen (`ui/schreibtisch/Tischkarte.tsx`, ENTSCHEIDUNGEN W).
  - Wann: einmal im Jahr, und wenn ein Forschungsplatz 30 Tage leer steht.
  - Was: drei Angebote aus den startbaren Knoten. Je Karte Name, Preis, Dauer, ein Satz Nutzen und als Knopf „Selbst“ oder „Mit Lizenz (Land)“.
  - Die Auswahl rechnet nach Lage. Fokus-Beschlüsse kommen zuerst, dann Knoten, deren Heureka erfüllt ist, dann der günstigste je Zweig.
  - Vierte Antwort: „Nichts beginnen“, kostenlos (ENTSCHEIDUNGEN L, immer eine kostenlose Antwort).
- Sprecher ist der Industrieminister (Amt `wirtschaft`, ENTSCHEIDUNGEN W).
- Kapsel oben und Zählabzeichen in der Navigation, wenn ein Platz frei ist.

Dateien:
- `sim/forschungsrat.ts` (neu, Plan der Karte)
- `ui/schreibtisch/briefing.ts`
- `ui/schreibtisch/Tischkarte.tsx`
- `ui/Stage.tsx` (Kapsel, `badge` im Menüeintrag Z. 607)
- `i18n/katalog/{de,en,tr}/welle_a1.json`
- Test `test/forschungsrat.test.ts`

Prüfung: Im Spielstand des Inhabers erscheint nach Schritt 2 die Karte am ersten Tag. Ein Klick beginnt einen Knoten. Danach ist die Karte weg.

### Schritt 5: Große Ziele melden sich, und Technologie hängt am Baum (Ursachen U4 und U1)

Was zu tun ist:
- **Gelegenheit:** Ist eine verfolgte Stufe versuchbar und die Chance mindestens „aussichtsreich“, kommt einmal je Stufe eine Vorlage.
  - Beispiel: „Golf und Irak sind bereit für einen Sicherheitspakt.“
  - Antworten: „Jetzt wagen (12 Kapital, Chance aussichtsreich)“, „Erst vorbereiten (Gipfel, 6 Kapital)“ und „Später“.
  - Danach steht die Stufe unter Fristen, bis sie versucht oder losgelassen ist.
- **Technologie an den Baum koppeln:** Neue Schwellenart `bestand` in `Bedingung`.
  - Stufe „autarkie“: 2 fertige Knoten aus Rüstung, Luft- und Raumfahrt
  - Stufe „halbleiter“: Chip-Entwurf fertig und Chipfabrik begonnen
  - Stufe „mond“: Trägerrakete fertig
- Die übrigen Ziele bekommen je einen Bestandsfaktor, wo es einen passenden Knoten oder ein Vorhaben gibt, etwa Energie mit Akkuyu und SMR, Seemacht mit U-Booten und TF-2000.
- So zahlt der Baum auf das Ziel ein, das der Inhaber seit Jahren verfolgt.

Dateien:
- `sim/grosseziele.ts` (`Bedingung`, `wert`, Katalog Z. 186–199)
- `sim/ereignisse.ts` oder `sim/forschungsrat.ts` (Vorlage)
- `ui/schreibtisch/briefing.ts`
- `ui/grosseziele/GrosseZiele.tsx` (Schwellenzeile mit Sprung in den Baum)
- Tests `test/grosseziele.test.tsx`

Prüfung: Im Spielstand des Inhabers liegt am ersten Tag die Nahost-Vorlage auf dem Schreibtisch. Technologie zeigt „Schwelle: 2 von 2 Rüstungsknoten fertig“ (Altay, Stahlkuppel).

### Schritt 6: Wirkung, die man spürt (Ursache U5)

Was zu tun ist:
- **Durchbruch als Moment:**
  - eigenes Fenster wie beim Fokus (`sp.hinweise`) mit Bild des Zweigs
  - Eilmeldung der Zeitung (`zeitungEreignis` für Knoten des Baums, nicht nur für Wunder)
  - Wirkungsbericht nach 6, 12 und 24 Monaten (`rueckblickAnlegen` mit neuer Art „forschung“)
- **Meilensteine** in langen Knoten (ab 36 Monaten Planzeit): bei 50 % eine Meldung mit kleiner Sofortwirkung.
  - Beispiel: „KAAN: Erstflug“, Ansehen +1 (Spielparameter).
  - Vorbild sind die echten Zwischenschritte: KAAN-Rollout 03/2023 und Erstflug 21.02.2024, Start von Türksat 6A am 08.07.2024, Brennstoff in Akkuyu am 27.04.2023 (Abschnitt 6, R8).
- **Spürbarer Nutzen je Stufe eines Großen Ziels:** Jede Stufe gibt eine dauerhafte Regel statt nur Netzpunkten (Spielparameter, gemessen am Bot).
  - Nahost Pakt: Vermittlung kostet die Hälfte, und Ereignisse „Grenzzwischenfall“ werden seltener.
  - Technologie Halbleiter: Lizenzen werden nicht mehr gesperrt.
  - Turkunion Freihandel: Handel mit fünf Ländern +6.
- **Kalibrierung:** Ziel ist, dass eine Zielstufe etwa so viel bewegt wie ein großes Gesetz. Heute sind es +0,0 bis +0,1 Zustimmung nach 12 Monaten. Das wird mit der Sonde aus Abschnitt 3 gegen den Wirkungsbericht des Forschungsgesetzes gemessen; das genaue Ziel ist ein Spielparameter.
- **Vermächtnis:** Die Bilanz nennt „angestoßen: Chipfabrik (60 %)“, wenn die Amtszeit vorher endet.

Dateien:
- `sim/wissensbaum.ts` (`wissensbaumMonat`)
- `sim/reich.ts` (`schliesseAb`, Z. 1125–1139)
- `sim/berichte.ts` (Art `forschung`)
- `sim/zeitung.ts`
- `sim/grosseziele.ts` (`erfolg` mit `regel`)
- `sim/bilanz.ts`
- `data/wissensbaum.ts` (`meilenstein`)
- Tests `test/wissensbaum.test.ts`, `test/grosseziele.test.tsx`, `test/schau-antworten*` (Plakette gegen Buchung, ENTSCHEIDUNGEN X.4)

### Schritt 7: Aufräumen, was nur Schau ist (Ursache U6)

Was zu tun ist:
- Der Knopf **„Stand der Agenda“** entfällt. Er wiederholt Fokus, Wissensbaum und Amtsziele (`41-agenda.png`).
- Die Kopfzahlen des Bereichs zeigen dafür, ganz nach Vorbild Haushalt (Entscheidung Z):
  - **„Fokus läuft / frei“**
  - **„Forschungsplätze belegt“**
  - **„Nächster Versuch“**
- **Ein Wort je Sache:**
  - Fokusbaum heißt „Regierungsfokus“.
  - Große Ziele bleiben.
  - Programme heißen „Reformprogramme“.
  - Amtsziele heißen „Wahlversprechen der Amtszeit“ und ziehen in den Bereich Regierung um, wo die Wahl ist.
- Im Wissensbaum fallen weg:
  - die Standortwahl als Pflichtschritt (der erste Standort aus den Daten gilt, Wechsel bleibt unter „Einzelheiten“)
  - die Trägerwahl Staat oder Firma (die Lizenz- und Partnerwahl bleibt)
  - der Schwerpunkt (Schritt 3)
- Die Knoten bleiben, die Zahl der Knöpfe am Blatt sinkt von bis zu 9 (Selbst, 2 bis 3 Lizenzen, 3 Träger, 4 Standorte) auf 2 bis 4.
- Heureka bleibt als Randnotiz der Mentorin am Knoten. Der eigene Stempel entfällt.

Dateien:
- `ui/Stage.tsx` (Reiterleiste, Z. 612)
- `ui/akte/Bereiche.tsx` (Kopfzahlen, Lage)
- `ui/wissen/Detail.tsx`
- `i18n/katalog/{de,en,tr}/*.json`
- `ui/politik/zweck.ts`

**Zur Bestätigung durch den Inhaber, vor Schritt 7:**
- der Umzug der Amtsziele in den Bereich Regierung
- der Wegfall von Schwerpunkt und Trägerwahl

### Reihenfolge und Abhängigkeiten

- Schritte 1 und 2 zuerst, sie machen den Baum überhaupt spielbar.
- Schritt 3 braucht Schritt 2 (Platz).
- Schritt 4 braucht Schritt 2.
- Schritt 5 ist unabhängig und kann parallel zu 3 und 4 laufen.
- Schritt 6 danach.
- Schritt 7 zuletzt, nach Bestätigung.

Jeder Schritt prüft mit `npx tsc --noEmit`, den Tests des Bereichs und dem Spielstand des Inhabers.

---


## 6. Rechercheliste mit Quellen

Recherche vom 06.11.2026. Das Suchkontingent war während der Arbeit erschöpft, danach wurden nur bekannte Adressen direkt abgerufen. Was nicht belegt ist, steht so da. Wikipedia-Angaben gelten zum Abrufstand.

### R1 F&E-Ausgaben der Türkei (TÜİK, Erhebung zu F&E-Tätigkeiten)

| Jahr | F&E in % des BIP | Personal in VZÄ | Quelle |
|---|---|---|---|
| 2021 | 1,40 % | 221.811 | 12. Entwicklungsplan, Tab. 25: https://www.sbb.gov.tr/wp-content/uploads/2023/12/On-Ikinci-Kalkinma-Plani_2024-2028_11122023.pdf |
| 2022 | 1,32 % (erster Rückgang seit 9 Jahren) | 272.638 | https://www.bloomberght.com/turkiyede-ar-ge-nin-gsyhdeki-payi-9-yil-sonra-ilk-kez-geriledi-2342189 |
| 2023 | 1,39 % (revidiert) | – | https://www.alomaliye.com/2025/10/20/arastirma-gelistirme-faaliyetleri-arastirmasi-2024/ |
| 2024 | 1,46 % (651,8 Mrd. TL) | 310.473 | ebd. |
| 2025 | 1,55 % (980,4 Mrd. TL) | 317.982 | https://www.alomaliye.com/2026/10/30/ar-ge-harcamalari-980-milyar-lirayi-asti-2025/ |

Weitere Angaben:
- **Wer finanziert (2025):** Firmen 52,5 %, Staat 31,1 %, Hochschulen 14,1 %, Ausland 2,3 %. Quelle wie 2025.
- **Ziel des 12. Entwicklungsplans 2024–2028:** 2,05 % des BIP bis 2028, 440.000 VZÄ (SBB, Tab. 25).
- **Planziele werden verfehlt:**
  - Der 12. Plan rechnete für 2023 mit 1,55 %; erreicht wurden die 1,55 % erst 2025.
  - Der 11. Plan peilte 1,8 % bis 2023 an.
  - Quelle: Bericht der Fachkommission, SBB 2025: https://www.sbb.gov.tr/wp-content/uploads/2025/08/Ar-Ge-ve-Yenilik-Ekosisteminin-Guclendirilmesi-OIK-Raporu_01082025.pdf

### R2 TÜBİTAK
- **Gründung und Größe:** gegründet 1963, 15 Institute (darunter BİLGEM, SAGE, UZAY). https://en.wikipedia.org/wiki/Scientific_and_Technological_Research_Council_of_Turkey
- **Industrieprogramme:** 1501, 1505, 1507, 1511, 1514, 1602, 1707, 1711 und BiGG. https://www.tubitak.gov.tr/tr/destekler/sanayi/ulusal-destek-programlari
- **Programm 1501:** Förderquote 75 % für die ersten fünf Projekte, danach 60 %. Höchstens 20 Mio. TL je Projekt, höchstens 36 Monate. https://www.tubitak.gov.tr/tr/destekler/sanayi/ulusal-destek-programlari/1501
- **Nicht belegt:** das aktuelle Gesamtbudget von TÜBİTAK.

### R3 Technoparks und F&E-Zentren
- **Gesetz 4691 vom 26.06.2001:** Gewinne aus F&E in Technoparks sind von Einkommen- und Körperschaftsteuer befreit, Löhne des F&E-Personals von der Lohnsteuer, befristet bis 31.12.2028. https://www.mevzuat.gov.tr/MevzuatMetin/1.5.4691.pdf
- **Stand September 2025:** 115 ausgewiesene Zonen, davon 97 in Betrieb, 13.673 Firmen, 135.321 Beschäftigte (AA): https://www.foreks.com/haber/detay/6addf198422c786f3f7a9822/AA/tr/turkiye-nin-teknoloji-uretimine-teknoparklardan-tam-destek-25-10-26/
- **Gesetz 5746 vom 28.02.2008:** Ein F&E-Zentrum braucht mindestens 50 VZÄ, absenkbar auf 15. https://www.mevzuat.gov.tr/MevzuatMetin/1.5.5746.pdf
- **Zahl der Zentren:** 1.363 F&E-Zentren und 342 Designzentren Ende 2025. https://www.milliyet.com.tr/ekonomi/teknoloji-ve-tasarimda-harita-hizli-genisliyor-7551700

### R4 Rüstungsforschung und Rüstungsindustrie
- **Export:**
  - 2022: 4,4 Mrd. USD (12. Plan).
  - 2024: 7,154 Mrd. USD.
  - 2025: etwa 10,05 Mrd. USD (die Quelle nennt auch 10,016 und 10,54).
  - Quelle: https://defenceturkey.com/news/general-assessment-of-the-turkish-defense-and-aerospace-industry-in-2025-and-targets-for-2026
- **Heimischer Anteil:** 2022 73,4 %, Planziel 2028 85 % (12. Plan); heute 82 bis 84 % (Defence Turkey).
- **ASELSAN 2024:** 3,48 Mrd. USD Umsatz. https://en.wikipedia.org/wiki/Aselsan
- **Nicht belegt:** die F&E-Ausgaben von ASELSAN, TUSAŞ, Roketsan und Baykar.

### R5 Raumfahrt
- **TUA:** gegründet per Präsidialdekret am 13.12.2018. Die erste Mondmission AYAP-1 ist für 2027 geplant. https://en.wikipedia.org/wiki/Turkish_Space_Agency
- **Nicht belegt:** die zehn Ziele des Nationalen Raumfahrtprogramms vom 09.02.2021.

### R6 Nationaler Technologievorstoß und HIT-30
- **„Milli Teknoloji Hamlesi“:** Der 12. Entwicklungsplan nennt ihn (Ziffer 557) mit KI, Robotik und Mikroelektronik. Quelle wie R1.
- **HIT-30:** 30 Mrd. USD Förderung für Hightech-Investitionen bis 2030 in acht Feldern, darunter Halbleiter, Mobilität, grüne Energie, Gesundheit, Raumfahrt. https://hit30.sanayi.gov.tr
- **Nicht belegt:** das Datum von HIT-30 und der Inhalt der Industrie- und Technologiestrategie 2030 (Seite nicht abrufbar).

### R7 Abhängigkeit und Sperren
- **CAATSA vom 14.12.2020:** Verbot aller US-Exportlizenzen für die Rüstungsbehörde SSB und Ausschluss aus dem F-35-Programm. Eine angekündigte Aufhebung im Juli 2026 ist nicht als umgesetzt belegt. https://en.wikipedia.org/wiki/Countering_America's_Adversaries_Through_Sanctions_Act
- **KAAN:** fliegt mit dem US-Triebwerk GE F110. Das heimische TF35000 soll nach 2030 kommen. https://en.wikipedia.org/wiki/TAI_TF_Kaan
- **Altay:** Wegen des deutschen Embargos (MTU/Renk) gibt es einen koreanischen Antrieb. https://en.wikipedia.org/wiki/Altay_(tank)
- **TB2:** Rotax und der kanadische Optiklieferant stoppten 2020, danach wurden heimische Teile eingebaut. https://en.wikipedia.org/wiki/Baykar_Bayraktar_TB2
- **Nicht belegt:** Zahlen zur Abwanderung von Hochschulabsolventen (TÜİK-Portal nicht abrufbar).

### R8 Wie lange echte Programme dauern

| Programm | Beschluss bis Nutzen | Verzug gegen den Plan | Kosten | Quelle |
|---|---|---|---|---|
| KAAN | Beschluss 15.12.2010, Erstflug 21.02.2024 | Phase 1 vier Jahre später; Serie für 2028 geplant | 1,18 Mrd. USD Entwicklungsvertrag 2016 | https://en.wikipedia.org/wiki/TAI_TF_Kaan |
| TOGG | Gründung 25.06.2018, Verkauf ab 03/2023 | – | Werk 22 Mrd. TL (etwa 1,2 Mrd. USD) | https://en.wikipedia.org/wiki/Togg |
| Akkuyu | Abkommen 05/2010, erster Beton 03.04.2018 | Block 1 für 2023 geplant, Stand 12/2025: 2026 | 24–25 Mrd. USD (Rosatom, Bau-Besitz-Betrieb) | https://en.wikipedia.org/wiki/Akkuyu_Nuclear_Power_Plant |
| Türksat 6A | Vertrag 15.12.2014, Start 08.07.2024 | etwa 9,5 Jahre | etwa 250 Mio. USD | https://en.wikipedia.org/wiki/Türksat_6A |
| İMECE | Projektstart 01/2017, Start 15.04.2023 | etwa 6 Jahre | nicht belegt | https://en.wikipedia.org/wiki/İMECE |
| Altay | Vertrag 30.03.2007, im Dienst 28.10.2025 | Serie 7 Jahre nach dem Serienvertrag (Antrieb) | nicht vollständig belegt | https://en.wikipedia.org/wiki/Altay_(tank) |
| Kızılelma | Konzept 2013, Erstflug 14.12.2022 | früher als geplant (2023) | nicht belegt | https://en.wikipedia.org/wiki/Baykar_Bayraktar_Kızılelma |

**Folgerung für das Spiel:**
- Spannweiten: zivil 5 bis 10 Jahre, große Waffensysteme 13 bis 18 Jahre.
- Verzug: 2 bis 4 Jahre, fast immer wegen fremder Bauteile oder Embargos.
- Ein Präsident sieht die Ernte oft nicht selbst. Das trägt die Meilensteine und das Vermächtnis in Schritt 6.

### C Wie andere Spiele Forschung und Ziele lösen

| Spiel | Mechanik | Gleichzeitig | Quelle |
|---|---|---|---|
| Hearts of Iron IV | Feste Forschungsplätze (2 oder 3 zu Beginn, mehr nur über Fokusse). Vorausforschung kostet 200 % Aufschlag je Jahr. Ein leerer Platz sammelt höchstens 30 Tage Vorrat. Der Nationalfokus läuft immer einzeln, 70 Tage, mit sich ausschließenden Ästen | 2 bis 5 Forschungen und 1 Fokus | https://hoi4.paradoxwikis.com/Research, https://hoi4.paradoxwikis.com/National_focus |
| Stellaris | Je Gebiet eine Hand von 3 Karten, nach jedem Abschluss neu gezogen. Nicht gewählte Karten zählen danach halb. Seltene Techs haben etwa ein Achtel des Gewichts | 3, je Gebiet 1 | https://stellaris.paradoxwikis.com/Technology |
| Victoria 3 | Innovation aus Universitäten, gedeckelt durch Alphabetisierung. Verbreitung abhängig von Gesetzen. Journal-Einträge mit Bedingung, Frist (5 oder 10 Jahre) und Folgen bei Erfolg, Scheitern und Ablauf | 1 Forschung und Verbreitung | https://vic3.paradoxwikis.com/Technology, https://vic3.paradoxwikis.com/Journal_entries |
| Civilization VI | Zwei Bäume (Technik und Kultur). Eurekas beschleunigen eine Technik nach einer bestimmten Tat | je Baum 1 | https://en.wikipedia.org/wiki/Civilization_VI |
| Democracy 4, Suzerain | Kein Forschungssystem beschrieben. In Suzerain kommt die Wirkung über Nachrichten und Berichte an | – | Steam-Seiten 1410710 und 1207650 |

**Nicht belegt** (Fandom-Wiki gesperrt):
- die Höhe des Eureka-Bonus in Civilization VI (40 % ist nur Spielkenntnis; der Code nennt ihn in `data/wissensbaum.ts:158`)
- die Erinnerung „Forschung wählen“ in Civilization VI, Stellaris und HOI4

**Übertragen in den Plan:**
- Wenige Plätze und echte Knappheit, mehr Plätze über eine Strukturentscheidung (HOI4): **Schritt 2**.
- Drei Karten statt eines Katalogs, gewichtet nach Lage (Stellaris): **Schritt 4**.
- Beschleuniger durch Taten (Civilization VI): Heureka bleibt, als Randnotiz.
- Ziele als Eintrag mit Bedingung, Frist und eigener Folge bei Erfolg und Scheitern (Victoria 3): **Schritt 5**.
- Ein Fokus zur Zeit, als politischer Beschluss (HOI4): **Schritt 3**.

---

## 7. Messwerkzeuge und Aufräumen

Werkzeuge:
- Sonde `wt/game/test/zz_a1_sonde.test.ts` mit Ergebnissen in `a1/sonde.json` bis `sonde4.json`
- Browserläufe `a1/rundgang.cjs`, `a1/baum.cjs`, `a1/agenda.cjs` mit Protokollen in `a1/*-inhaber.json` und `a1/rundgang-frisch.json`

Am Ende entfernt: der Worktree `a1/wt` (die Sonde liegt als Kopie in `a1/zz_a1_sonde.test.ts`) und der Server auf Port 5231.
