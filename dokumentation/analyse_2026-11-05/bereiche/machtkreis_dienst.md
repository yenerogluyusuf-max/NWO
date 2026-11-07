# A2: Machtkreis und Dienst – warum sie ungenutzt bleiben und wie sie gut werden

Stand: 06.11.2026, Code `b0ce3f3` (welle/ein), Spielstand des Inhabers `s2043.json` (Defne Işık, 3. August 2043, 15 Spieljahre).
Diese Arbeit ist eine Analyse mit Umbauplan. Im Projekt wurde kein Code geändert.

Die Messungen wurden so gewonnen:
- **Im Browser gespielt:** Port 5232, Spielstand des Inhabers und frisches Spiel.
- **Kopflose Messung:** `a2mess/messung.test.ts` im eigenen Worktree, nicht eingecheckt. Rohdaten in `mess.json` und `mess-wirkung.json`.
- **Recherche:** zwei Rechercheläufe mit WebSearch und WebFetch, Liste am Ende.

---

## 1. Ist-Zustand

### 1.1 Machtkreis

**Wo er liegt:** Kabinett & Verwaltung › Ministerrat & Kabinett › vierter Unterreiter „Machtkreis“, also dritte Ebene (`ui/Personen.tsx:84`).

**Was dort zu sehen ist:**
- vier Werte: Regierungsstil, Angst, Nachfolgedruck, Fraktionsdisziplin
- ein Beziehungsnetz mit 14 Porträts
- rechts die gewählte Person mit bis zu sieben Hebeln: befördern, kaltstellen, Absprache, Bauernopfer, überprüfen, begnadigen, Säuberung (`sim/machtkreis.ts:43`)

**Im Spielstand des Inhabers (15 Jahre):**

| Größe | Wert | Quelle |
|---|---|---|
| Hebel gezogen | **0** (`zuletzt: {}`, keine Absprache, keine Kaltstellung, keine Untersuchung, keine Säuberung) | `s2043.json › spiel.machtkreis` |
| Nachfolgedruck | **89** von 100 | ebd. |
| Angst im Apparat | 49 | ebd. |
| Regierungsstil | autoritär (Grad 85) | Messung |
| Putschrisiko | 15 | `spiel.enden.putsch` |
| Ereignisse des Machtkreises | **7 in 15 Jahren:** 4× offene Rivalität, 3× Enthüllung durch die Presse. Alle aktiv entschieden (3× geschlichtet, 1× Partei ergriffen, 3× geopfert). | Logbuch |
| Nachfolgefrage, Parteitag, Seitenwechsel, Putschzirkel | **0** | Logbuch |
| Ministerwechsel zum Vergleich | 12 ehemalige Minister, 2 Entlassungen im Finanzministerium, 9 Rücktritte | Logbuch |

Der Inhaber hat den Machtkreis also nicht gemieden. Er hat die sieben Fälle entschieden, als sie auf dem Tisch lagen. Die Ansicht selbst hat er nie gebraucht.

**Bilder (Spielstand des Inhabers):**
- `bilder/01-kabinett.png`: Kabinett, der Reiter „Machtkreis“ ist klein in der dritten Ebene.
- `bilder/02-machtkreis.png` und `bilder/03-machtkreis-netz.png`:
  - Nachfolgedruck 89, und nichts geschieht.
  - Porträts überdecken sich (Çiftçi/Çetin, Bozkurt/Sarı).
  - Industrieminister Taş heißt dort „Wirtschaftsminister“.
- `bilder/04-machtkreis-hebel.png`: Die Hebel stehen gequetscht in der rechten Spalte, „1 Kapita“ ist abgeschnitten.
- `bilder/05-machtkreis-innen.png`: Innenministerin Sarı mit sechs Hebeln.
- `bilder/06-untersuchung-angeordnet.png`: Überprüfung angeordnet. Die Angst steigt von 49 auf 53, sonst geschieht nichts.
- `bilder/07-schreibtisch-nach-untersuchung.png`: drei Monate später. Auf dem Schreibtisch steht **nichts** zur Überprüfung.
- `bilder/08-machtkreis-nach-untersuchung.png`:
  - Ergebnis nur als Zeile im Machtkreis: „Der Bericht über Onur Bozkurt ist sauber.“
  - Bozkurt hat aber ein Geheimnis (`auslandskontakt`). Die Fundchance liegt bei 50 % (`sim/machtkreis.ts:683`).

**Frisches Spiel:**
- `bilder/21-neu-machtkreis.png`: Nachfolgedruck 10, Angst 23. Es gibt nichts zu tun und keinen Grund, die Ansicht zu öffnen.

### 1.2 Dienst

**Der Dienst liegt an drei Orten:**
1. **Außen › Länder und Diplomatie › Dienst:**
   - sechs Auslandsoperationen gegen einen von 43 Zielstaaten (Auswahlliste)
   - dazu „Gegenspionage verstärken“
   - Datei `ui/welt/Dienst.tsx`
2. **Sicherheit › Reiter „Sicherheitslage“ › „Behörden des Bereichs ansehen“ › MİT:**
   - Ausbau und vier Inlandsoperationen (Aufklärung, Terrorabwehr, Überwachung der Opposition, Schutz)
   - das ist die vierte Ebene, Dateien `ui/akte/Bereiche.tsx:424` und `ui/behoerden/Mit.tsx`
3. **Kabinett › Machtkreis › „Überprüfen lassen“:** Hier arbeitet der Dienst gegen die eigenen Leute.

**Im Spielstand des Inhabers:**

| Größe | Wert | Quelle |
|---|---|---|
| Auslandsoperationen angeordnet | **0** | `weltmodell.dienst.ops = []`, Bericht |
| „Die eine Operation“ | war **Gegenspionage verstärken** am 5. September 2035, also eine Abwehrmaßnahme und keine Operation gegen einen Staat | `dienst.bericht` |
| Fremde Operationen gegen die Türkei | 2 in 15 Jahren (`zaehler: 2`), **keine aufgedeckt**, kein Ereignis auf dem Tisch | ebd. |
| Dienstkapazität | 100 von 100, lag 15 Jahre ungenutzt | ebd. |

**Bilder:**
- `bilder/11-dienst.png` und `bilder/12-dienst-ops.png`:
  - Jede Karte zeigt eine „geringe“ oder „mäßige“ Aussicht und ein „hohes“ oder „sehr hohes“ Risiko.
  - Zwei von sechs Karten sind gesperrt.
- `bilder/15-sicherheit-mit.png`: Die Inlandsoperationen zeigen „**Aussicht 1 %**“ und „Schutz des Präsidenten: **0 %**“. Das ist ein Anzeigefehler (siehe 2.3).
- `bilder/22-neu-dienst-angeordnet.png` und `bilder/24-neu-dienst-bericht.png` (frisches Spiel):
  - Zwei Operationen angeordnet (Desinformation gegen Griechenland, Einflussnetz in Syrien).
  - Nach drei Monaten steht nur im Bericht: „Fehlschlag, unentdeckt. Die Operation verpufft.“
  - Der Schreibtisch (`bilder/23-neu-schreibtisch.png`) zeigt nichts davon.

---

## 2. Ursachen mit Zahlen

### 2.1 Gemessene Wirkung im Vergleich

Aufbau der Messung:
- Spielstand des Inhabers. Jede Handlung einzeln, danach 6 Monate Lauf mit Standardantwort auf jedes Ereignis.
- Verglichen wird mit einer Kontrolle aus demselben Stand ohne Handlung.
- Kapital wurde aufgefüllt, damit es kein Hindernis ist.

| Handlung | Δ Zustimmung | Δ Vertrauen | sonst spürbar |
|---|---|---|---|
| Machtkreis: Absprache mit dem Kronprinzen (4 Kapital) | **0,00** | **0,00** | Nachfolgedruck −33. Den Druck spürt man nirgends (siehe unten). |
| Machtkreis: Finanzminister befördern (2) | 0,00 | 0,00 | nichts außerhalb des Kreises |
| Machtkreis: Kronprinz kaltstellen (1) | 0,00 | 0,00 | Nachfolgedruck −29 |
| Machtkreis: Säuberung über den Generalstab (3) | 0,00 | 0,00 | Putschrisiko −18, Truppenmoral −3,1, Pressefreiheit −0,6 |
| Dienst: Desinformation gegen Griechenland (2) | **−0,27** | **−0,94** | flog auf. Die einzige spürbare Wirkung ist ein Schaden. |
| Dienst: Einflussnetz in Syrien (3) | 0,00 | 0,00 | nichts |
| Zum Vergleich: Finanzminister entlassen (4) | −0,06 | −0,16 | neuer Minister, Märkte +30 Punkte Risikoaufschlag |
| Zum Vergleich: Kindergeld +15 Stufen | +0,02 | −0,05 | Armut −0,07 |

**Lesart:**
- Im späten Spiel des Inhabers bewegt auch ein Gesetz die Zustimmung in sechs Monaten kaum.
- Die Größe der Wirkung allein erklärt die Nichtnutzung also nicht. Der Unterschied liegt woanders:
  - Gesetz und Entlassung zeigen ihre Folgen in Größen, Zeitung und Wirkungsbericht und haben einen Anlass auf dem Tisch.
  - Ein Hebel im Machtkreis verändert nur Zahlen, die der Spieler sonst nirgends sieht: Loyalität, Ehrgeiz, Groll, Nachfolgedruck.
  - Der Dienst wirkt nur auf Werte fremder Staaten, oder er schadet, wenn er auffliegt.

### 2.2 Machtkreis: Ursachen

1. **Er meldet sich kaum, und das Wichtigste nie.**
   - Die Nachfolgefrage hat eine Chance von 6 % im Monat, wenn der Druck ≥ 60 ist (`sim/ereignisse-machtkreis.ts:186`).
   - Dazu kommt der Wettbewerb um 2 Plätze je Monat (`sim/ereignisse.ts:1131`).
   - Gemessen: Im Stand des Inhabers lag der Druck 36 von 36 Monaten über 60, und es kam **kein** Ereignis. In 15 Jahren kam die Nachfolgefrage nie.
   - Frische Spiele (3 Seeds, etwa 5 Jahre bis zum Spielende): 1, 1 und 3 Ereignisse des Kreises.
   - Das Ergebnis einer Überprüfung geht nur ins Logbuch und in die Szenenzeile (`sim/machtkreis.ts:702–703`), nie auf den Schreibtisch.
2. **Die Drohung ist leer, solange man beliebt ist.**
   - Die Ansicht sagt bei Druck ≥ 60: „Antworten Sie, bevor es der Parteitag tut“ (`machtkreis.json`, `mk.ui.nachfolge.hoch`).
   - Der Parteitag kommt aber nur bei Druck ≥ 90 **und** Zustimmung < 45 **und** nicht im autoritären Stil (`sim/ereignisse-machtkreis.ts:257`).
   - Der Inhaber hatte 61–68 % Zustimmung und den Stil „autoritär“. Der Druck von 89 bedeutet für ihn nichts.
3. **Er wird zum Gewinnen nicht gebraucht.**
   - Putschrisiko 15. Gegen Seitenwechsel und Rücktritte reicht das Kabinett: Gespräch, Mittel zusagen, Entlassung.
   - Die Hebel für Minister **verdoppeln** Kabinettswerkzeuge:
     - „Befördern“ entspricht „Anerkennung und Mittel“ auf dem Schreibtisch (beide setzen `mittelBis`, `sim/gespraeche.ts:640`).
     - „Bauernopfer“ entspricht der Entlassung.
     - Die Absprache für Minister entspricht „Rückendeckung geben“.
4. **Er wird nicht gefunden.**
   - Er ist der vierte Unterreiter in der dritten Ebene.
   - Die sieben Ereignisse, die kamen, verweisen nicht auf ihn. Der Spieler lernt nie, dass sie zum Machtkreis gehören.
5. **Fehler, die Vertrauen kosten:**
   - **Namensdoppel:** Ernennungen schließen nur Namen der Ämter aus, nicht die Nebenfiguren (`sim/nachfolge.ts:72`, `:175`, `:210`; `sim/figuren.ts:298`, `:326`, `:347`).
     - Beim Inhaber war „Cem Bilgin“ von 2033 bis 2038 zugleich Finanzminister und Kronprinz der Partei.
   - **Journalist im Kabinettsstreit:** Die Rivalität schließt nur die Rolle `opposition` aus (`sim/machtkreis.ts:268`, `:712`). Die Journalistin bleibt drin.
     - Beim Inhaber kam dreimal „Mert Uysal (investigativer Journalist) gegen Damla Karaca (Präsidialamt): der Streit wird öffentlich“.
     - Der Präsident sollte sich für eine Seite entscheiden.
   - **Kaltstellen wirkt umgekehrt:**
     - Der Text sagt „das Ressort arbeitet schlechter“.
     - Der Code setzt aber `druckBis` (`sim/machtkreis.ts:594`), und das hebt die Ressortleistung um den Faktor 1,15 (`sim/personen.ts:203`).
     - Die Loyalität sinkt um 10, das kostet nur 0,04 Leistung. Unter dem Strich arbeitet ein kaltgestellter Minister **besser**.
   - **Überdeckte Porträts** im Netz (Bild 03) und eine falsche Rolle („Wirtschaftsministerium“ für den Industrieminister).

### 2.3 Dienst: Ursachen

1. **Kein Zweck.**
   - Die Operationen schwächen den Rückhalt oder die Stabilität eines fremden Staates oder verschieben dort eine Wahl.
   - Kein Ziel des Spielers hängt daran. Keine Vorlage, kein Fokus und kein Vertrag verlangt es.
   - Der Spieler müsste selbst erfinden, warum er Griechenland schwächen sollte.
2. **Der Erwartungswert ist negativ.**
   - Gemessen gegen Griechenland, Syrien, Israel, Iran und die USA: Bei **keiner** Operation liegt die Erfolgschance über dem Aufdeckungsrisiko.
   - Beispiele: Desinformation gegen Griechenland 13 % Erfolg zu 67 % Aufdeckung. Bester Fall: Netz im Iran 39 % zu 40 %.
   - Formeln: `sim/welt-dienst.ts:233` und `:244`.
3. **Erfolg verpufft.**
   - Desinformation zieht den Rückhalt im Zielstaat um 3,5 Punkte nach unten (`sim/welt-dienst.ts:378`).
   - Dieser Wert rauscht aber jeden Monat mit einer Standardabweichung von 1,6 und läuft zum Gleichgewicht zurück (`sim/welt-modell.ts:596`).
   - Der Wahleinfluss zerfällt um den Faktor 0,93 im Monat (`sim/welt-modell.ts:750`).
   - Der Spieler sieht davon nichts außer einer Berichtszeile.
4. **Er meldet sich nie.**
   - Fremde Operationen entstehen mit 0,003 je feindlichem Staat und Monat (`sim/welt-dienst.ts:140`).
   - Beim Inhaber: 2 in 15 Jahren, keine entdeckt, also nie das Ereignis „welt_einfluss“.
   - Frische Spiele: 0 bis 1 in 5 Jahren.
   - Ergebnisse eigener Operationen stehen nur im Bericht in Außen › Dienst.
5. **Zerstreut und verdeckt:**
   - Drei Orte (siehe 1.2). Die Inlandsoperationen liegen hinter einem Aufklapper in der vierten Ebene.
   - Zielauswahl aus 43 Staaten, ohne Hinweis, wo sich etwas lohnt.
6. **Anzeigefehler schreckt ab:**
   - `ui/behoerden/Mit.tsx:44` und `:89` geben Anteile (0,6) an das Format `{p, prozent, 0}`. Das erwartet aber Prozentwerte (`i18n/format.ts:200`).
   - Jede Inlandsoperation zeigt deshalb „Aussicht 1 %“, der Personenschutz „0 %“.
7. **Wirklichkeitsfern:**
   - Was der echte MİT im Ausland tut, hat im Spiel keine Entsprechung: Rückholungen Gesuchter, Schläge gegen PKK- und IS-Kader, Libyen 2019/20, Geiselbefreiung und Gefangenenaustausch (Belege in Abschnitt 5).
   - Das Spiel bietet dagegen Wahlkampfhilfe und Desinformation gegen beliebige Staaten.

### 2.4 Ursachen auf einen Blick

| Grund | Machtkreis | Dienst |
|---|---|---|
| Wird nicht gefunden | ja (dritte Ebene, Ereignisse ohne Verweis) | ja (drei Orte, vierte Ebene) |
| Unklar, was er bringt | ja (Nachfolgedruck ohne Folge) | **ja, Hauptgrund** (kein Zweck) |
| Wirkung zu klein oder unsichtbar | **ja, Hauptgrund** (0,00 außerhalb des Kreises) | ja (verpufft, oder schadet beim Auffliegen) |
| Zu viel Text | mäßig | mäßig (sechs Karten mit Absätzen) |
| Zu viele Klicks | mäßig | ja (Ziel aus 43 wählen) |
| Meldet sich nie | **ja** (Nachfolge 0×, Überprüfung nie auf dem Tisch) | **ja** (2 fremde Operationen in 15 Jahren) |
| Nicht nötig zum Gewinnen | ja (Kabinett genügt, kein Putsch) | ja |
| Fehler | 3 (Namensdoppel, Journalist, Kaltstellen) | 1 (Prozentanzeige) |

Kapital ist **kein** Hindernis:
- Die Hebel kosten 1 bis 4, die Operationen 2 bis 4.
- Der Inhaber bekam 9,2 je Monat (Gutschrift laut Kopfleiste) und hatte 17 auf dem Konto.

---

## 3. Ziel der Bereiche

Maßstab sind die guten Bereiche:
- eine klare Frage
- wenige echte Entscheidungen mit Preis
- sichtbare Wirkung
- Der Bereich meldet sich selbst auf dem Schreibtisch.
- Karten statt weißem Blatt (ENTSCHEIDUNGEN V, Y, Z)

### 3.1 Machtkreis

**Die Frage:** „Wer kann mir die Macht nehmen, und was zahle ich, damit es nicht geschieht?“

So wirkt Macht im echten Präsidialsystem seit 2018 (Belege in 5.1):
- Minister ernennt und entlässt der Präsident per Erlass, ohne Parlament (Verfassung Art. 104, 106). 2023 wurden 16 von 18 Ministern getauscht.
- **Minister sind deshalb keine Machtfrage, sondern eine Frage des Kabinetts.** Das Kabinett im Spiel deckt das schon ab, und der Inhaber nutzt es.
- Die echte Gefahr kommt aus drei Richtungen:
  1. **Aus der eigenen Partei:**
     - Kronprinzen, die man bricht, gründen eigene Parteien: Davutoğlu (Rücktritt Mai 2016, Gelecek 12.12.2019), Babacan (DEVA 09.03.2020).
     - Die Amtszeitgrenze (Art. 101) lässt sich nur über eine vom Parlament beschlossene Neuwahl umgehen (Art. 116).
  2. **Vom Bündnispartner:** Die MHP setzt Gesetze durch (Strafvollzug 2020) und gibt die Tagesordnung vor (Öcalan-Initiative 22.10.2024).
  3. **Aus dem Apparat:** Putschversuch 2016. Danach wurden nach Angaben des OHCHR mindestens 152.000 Staatsbedienstete entlassen und 159.506 Personen festgenommen. Folgen waren das Einfrieren der EU-Gespräche und eine Rüge der UN.

**Vier Entscheidungen:**
1. **Nachfolger: aufbauen, hinhalten oder brechen.**
   - Aufbauen: Druck sinkt, Legitimität sinkt leicht, Minister schauen zum Nächsten.
   - Hinhalten: Posten oder Absprache, Kapital, Frist ein Jahr.
   - Brechen: Kaltstellen oder Ausschluss. Nach einer Frist entsteht eine **Abspaltung**, die Stimmen aus dem eigenen Lager zieht. Die Größe ist ein Spielparameter, das Vorbild sind Gelecek und DEVA.
2. **Partner: den Preis zahlen oder den Bruch riskieren.**
   - Er fordert ein Gesetz oder einen Posten. Das ist die Brücke zu Parlament und Zusagen, keine Doppelung.
3. **Mitwisser: das Geheimnis nutzen, opfern oder decken.**
   - Das Ergebnis einer Überprüfung kommt als Karte mit drei Antworten.
   - Nutzen ist ein Druckmittel: Loyalität gesichert, droht aber zu platzen.
   - Opfern bedeutet Rücktritt, Vertrauen kehrt zurück.
   - Decken stellt die Person ruhig, das Risiko einer Enthüllung bleibt.
4. **Apparat: säubern, nur nach einem Anlass.**
   - Anlässe: Putschzirkel aufgedeckt oder Putschversuch.
   - Säubern ist ein großer Eingriff mit langen Folgen: Fähigkeit, Ansehen, EU.
   - Als freier Knopf ohne Anlass fällt es weg.

### 3.2 Dienst

**Die Frage:** „Was kann der MİT im Ausland erledigen, das Diplomatie und Armee nicht können, und was kostet es, wenn es auffliegt?“

**Was der echte MİT tut (Belege in 5.2):**
- Er ist seit 2017 dem Präsidenten unmittelbar unterstellt (Gesetz 2937, Art. 3, KHK 694).
- Ermittlungen gegen MİT-Personal brauchen die Erlaubnis des Präsidenten (Art. 26).
- Er holt Gesuchte aus dem Ausland zurück: 80 aus 18 Ländern bis April 2018, später „über 100“.
- Das kostet Partner:
  - Kosovo entließ 2018 Innenminister und Geheimdienstchef.
  - In der Mongolei scheiterte 2018 ein Versuch.
  - In Kenia folgte 2024 eine Rüge des UNHCR.
- Er schlägt gegen PKK- und IS-Kader in Syrien und Irak zu.
- Er war 2019/20 in Libyen der erste vor Ort.
- Er vermittelt: Geiseln von Mossul 2014 nach 101 Tagen frei, Gefangenenaustausch Ankara 1.8.2024 mit 26 Personen.
- Wenn er auffliegt, folgt ein Inlandsskandal: MİT-Lkw 2014 mit verhafteten Staatsanwälten und Journalisten, Dündar im Exil.

**Vier Entscheidungen**, jede nur mit einem Anlass auf dem Schreibtisch (Gelegenheit mit Frist):
1. **Zugriff:**
   - Anlass: Eine gesuchte Person wurde in Land X gesehen.
   - Gewinn: Rückhalt im eigenen Lager, Kapital.
   - Preis beim Auffliegen: Beziehung zum Gastland, Ansehen. Das Risiko steigt mit der Rechtsstaatlichkeit des Gastlandes; die Medienoffenheit nach Weltbank-Indikator ist schon im Code, `sim/welt-dienst.ts:182`.
2. **Schlag gegen Kader:**
   - Anlass: PKK- oder IS-Führung in Syrien oder Irak geortet.
   - Wirkung: auf `weltmodell.terror` und die Größe Terrorgefahr.
   - Preis: Rückschlag im Friedensprozess (`weltmodell.friedens`). Das ist ein echter Zielkonflikt wie 2024/25.
3. **Kanal öffnen:**
   - Anlass: Austausch oder Geiseln.
   - Gewinn: Ansehen und Beziehungen zu den Großmächten.
   - Die Brücke zur Vermittlung, die ebenfalls ungenutzt ist.
4. **Seite stützen:**
   - Verdeckte Hilfe für eine Partei in einem Bürgerkrieg wie in Libyen.
   - Das bindet sich an die Kriege der Welt und wird mit W1 abgestimmt.
   - Auffliegen kann einen Inlandsskandal wie die MİT-Lkw auslösen.

**Abwehr:**
- Die Gegenspionage wird eine Ausbaustufe statt eines Knopfes.
- Fremde Operationen kommen öfter und sichtbar als Ereignis. Die Häufigkeit ist ein Spielparameter, gedeckelt.

**Was die Vorbilder lehren (Belege in 5.3):**
- **Schwelle mit Countdown statt stillem Wert** (CK3-Fraktionen): Unmut ab 80 %, Ultimatum bei 100 %.
- **Loyalität speist die Hauptwährung** (Democracy 4: Minister erzeugen Kapital; im Spiel schon als „Kabinett +2,6“).
- **Ein Geheimnis hat zwei Ausgänge:**
  - enthüllen oder als Druckmittel nutzen (CK3 Secrets und Hooks)
  - Lehnt der Erpresste ab, wird das Geheimnis enthüllt.
- **Netz vor Operation** und **Erfolg und Entdeckung gleich groß zeigen** (HoI4, Stellaris; CK3-Spieler übersehen sonst die Geheimhaltung).
- **Spürbares Ergebnis statt Prozentbonus:** Regierung kippt, Kader fällt (Victoria 3, HoI4).
- **Wenige große Meldungen statt vieler kleiner:** CK3 höchstens ein Ereignis je Jahr und Ratsmitglied.
- **Ursache immer nennen:** Suzerains „you are not even told WHY“ ist das Gegenbeispiel.

---

## 4. Umbauplan

Jeder Schritt ist für einen Agenten an einem Tag gedacht. Alle neuen Zahlen sind Spielparameter, sofern unten keine Quelle steht. Alte Spielstände laden weiter: Neue Felder bekommen Standardwerte, alte Operationsarten laufen aus.

### Schritt 0: Fehler beheben (halber Tag, zuerst)

1. **Prozentanzeige MİT:** `ui/behoerden/Mit.tsx:44` und `:89` müssen `p * 100` übergeben, auch `pLeck`.
2. **Namensdoppel:**
   - In `sim/nachfolge.ts:72`, `:175`, `:210` und `sim/figuren.ts:298`, `:326`, `:347` die Namen der Nebenfiguren (`spiel.machtkreis.neben`) in `benutzt` aufnehmen.
   - Beim Laden prüfen, ob ein Doppel besteht, und den Kronprinzen umbenennen. Mit `s2043.json` testen (Cem Bilgin).
3. **Journalist aus der Rivalität:** `sim/machtkreis.ts:268` und `:712` schließen auch `journalist` und `richter` aus.
4. **Kaltstellen:**
   - Eine eigene Marke `kaltBis` mit Leistungsfaktor unter 1 in `sim/personen.ts:leistung`, statt `druckBis` zu setzen (`sim/machtkreis.ts:594`).
   - Den Text so lassen, wie er ist.
5. **Rollenname:** In der Machtkreis-Ansicht soll das Amt `wirtschaft` „Industrie und Technologie“ heißen (Katalog `mk.rolle.wirtschaft`, heute „Wirtschaftsministerium“).
6. **Tests:** `test/machtkreis.test.tsx` erweitern (für den Dienst ein neuer Test), `npx tsc --noEmit`.

### Machtkreis

**M1: Der Kreis meldet sich auf dem Schreibtisch.**
- Ein Überprüfungsergebnis wird zur Tischkarte mit drei Antworten: Druckmittel, opfern, decken. Neue Vorlage `kreis_befund` in `sim/ereignisse-machtkreis.ts`, Aufruf aus `schliesseUntersuchung` (`sim/machtkreis.ts:676`).
- Nachfolgedruck in Stufen 60, 80 und 95:
  - Bei jeder Stufe kommt einmal eine Karte „Der Kronprinz sammelt Unterstützer“ mit Countdown zum Parteitag. Das ersetzt die 6-%-Chance durch ein festes Auslösen beim Überschreiten.
  - Der Parteitag droht auch bei hoher Zustimmung, sobald der Druck 100 erreicht. Die Gewinnchance hängt weiter von der Zustimmung ab (`parteitagChance`).
- Gruppe „Parteien“ in `ui/schreibtisch/arbeitsplatz.ts`, Karte über `Tischkarte.tsx`.
- Jede Karte und jedes Ereignis des Kreises bekommt den Knopf „Zum Machtkreis →“.
- Kataloge `machtkreis.json` in de, en und tr.

**M2: Wirkung, die man spürt.**
- **Abspaltung:**
  - Wer als Kronprinz kaltgestellt oder ausgebootet wird oder die Seite wechselt, gründet nach einer Frist (Spielparameter) eine Partei.
  - Sie zieht Wähler aus dem eigenen Lager und Sitze bei der nächsten Wahl. Vorbild sind Gelecek und DEVA, die Größe ist ein Spielparameter.
  - Dateien: `sim/machtkreis.ts`, Wähler und Parteien (`sim/waehler*`, `sim/fraktionen*`).
- **Kapitalzeile „Partei und Fraktion“** in `kapitalEinkommen` (`sim/spiel.ts:332`), gespeist aus Loyalität von Kronprinz und Fraktionschef, sichtbar im Kapital-Tooltip. Die Summe bleibt kalibriert (Balance-Lauf).
- **Fraktionsdisziplin in der Abstimmung zeigen:** „Fraktionsvorsitz: +1 Stimme“ in der Abstimmungsanzeige (`ui/parlament/*`).
- Hebel und Ereignisse schreiben eine Zeitungsmeldung, und der Wirkungsbericht nennt Nachfolgedruck und Disziplin vorher und nachher.

**M3: Die Ansicht als Karten.**
- **Kopf nach dem Vorbild Haushalt:** drei große Kennzahlen mit Etikett:
  - Nachfolgedruck mit Frist bis zum Parteitag
  - Fraktionsdisziplin in Stimmen
  - „Gefahr“: wer wechseln könnte
- **Darunter 3 bis 5 Personenkarten:** Kronprinz, Fraktionschef, Bündnispartner, dazu wer gerade ein bekanntes Geheimnis oder Wechselgefahr hat.
  - Je Karte 2 bis 3 Knöpfe mit Preis und Wirkung in Zahlen.
- **Hebel für Minister fallen weg.** Die Karte verweist auf Kabinett, Gespräch und Entlassung.
- **Beziehungsnetz hinter einem Aufklapper** „Beziehungen“, ohne Überdeckung.
- Den Balken „Regierungsstil“ ersetzt ein Satz mit Verweis auf die Verfassung.
- Den Reiter in `ui/Personen.tsx` an die zweite Stelle setzen. Im Kopf des Kabinetts ein Chip „Nachfolgedruck 89“ als Sprung.
- Dateien: `ui/personen/Machtkreis.tsx`, `ui/personen/machtkreis.css`, `ui/Personen.tsx`.

**M4: Säuberung nur mit Anlass.**
- Der freie Hebel „Säuberung“ entfällt (`sim/machtkreis.ts:407`).
- Säubern geht nur über Ereignisse: Putschzirkel aufgedeckt (gibt es schon) und neu nach einem Putschversuch.
- Die Folgen bleiben, dazu „EU-Gespräche eingefroren“ als Größe (Vorbild: EP-Beschluss vom 24.11.2016).
- Dateien: `sim/machtkreis.ts`, `sim/ereignisse-machtkreis.ts`, `sim/enden*`.

### Dienst

**D1: Operationen nach dem echten MİT.**
- Neue Arten in `OP_DEFS` (`sim/welt-dienst.ts:75`): `zugriff`, `kader`, `kanal`, `stuetzen`.
- **Wirkung an Größen, die der Spieler sieht:**
  - `kader` wirkt auf `weltmodell.terror.pkk/is` und den Knoten `terrorgefahr`. Rückschlag im Friedensprozess, wenn dieser läuft.
  - `zugriff` bringt Kapital und Rückhalt der eigenen Wähler. Beim Auffliegen leiden die Beziehung zum Gastland und das Ansehen.
  - `kanal` bringt Ansehen und Beziehungen zu USA und Russland.
  - `stuetzen` wirkt auf die Stärke einer Kriegspartei, mit W1 abgestimmt.
- **Die Erfolgschance übersteigt beim Standardfall das Aufdeckungsrisiko.** Der Erwartungswert muss lohnen, das Scheitern bleibt hart.
- `kandidat`, `desinfo` und `cyberangriff` kommen aus der Auswahl. Der Typ `OpArt` bleibt, damit alte Stände laden und laufende Operationen enden.
- Dateien: `sim/welt-dienst.ts`, `sim/welt-modell.ts`, neuer Katalog `welle_a2.json` (de, en, tr).

**D2: Der Dienst meldet sich.**
- **Gelegenheiten als Tischkarten „Der Dienst meldet“ mit Frist:**
  - Gruppe „Land“ in `ui/schreibtisch/arbeitsplatz.ts`.
  - Auslöser aus der Weltlage: Terrorwerte, Kriege, Beziehungen, Gesuchte. Höchstens eine Karte im Quartal, Spielparameter.
- **Ergebnis und Aufdeckung als Ereignis mit Antworten:**
  - dementieren und zum Staatsgeheimnis erklären (Vorbild MİT-Lkw 2014)
  - Verantwortliche opfern
  - sich öffentlich bekennen (Vorbild İnandı, 05.07.2021)
- Fremde Operationen werden häufiger (`DIENST.fremdChance`, `sim/welt-dienst.ts:140`, Spielparameter) und erscheinen beim Fund sicher als Ereignis.
- Dateien: `sim/welt-dienst.ts`, `sim/welt-ereignisse.ts`, `ui/schreibtisch/*`.

**D3: Eine Dienst-Akte statt drei Orten.**
- **Kopf:** Kapazität, laufende Operationen, Lagebild, Schutz des Präsidenten, als große Kennzahlen.
- **Darunter vier Karten** (Zugriff, Kader, Kanal, Stützen). Ziele kommen aus den Gelegenheiten statt aus einer Liste mit 43 Staaten.
- **Ausbau und Inland darunter**, nicht mehr hinter dem Behörden-Aufklapper.
- Die Länderakte zeigt „Dienst: Gelegenheit“, wenn eine besteht.
- Machtkreis › Überprüfen bleibt dort, zeigt aber die Kapazität des Dienstes.
- Dateien: `ui/welt/Dienst.tsx`, `ui/behoerden/Mit.tsx`, `ui/Welt.tsx`, `ui/akte/Bereiche.tsx`.

**D4: Wirkung sichtbar machen.**
- Ergebnis als Zeitungsmeldung (aufgeflogen oder öffentlich bekannt) und im Wirkungsbericht.
- Zahlen im Kopf der Außenpolitik (Ansehen, Beziehungen) und der Sicherheit (Terrorgefahr) bewegen sich mit Pfeil.
- Kann mit D2 zusammenfallen, wenn der Tag reicht.

### Was als Schau wegfallen kann

- Zielauswahl aus 43 Staaten ohne Anlass, dazu die Operationen Wahlkampfhilfe, Desinformation und Cyberangriff. Es gibt keinen Beleg für die Türkei und keinen Zweck im Spiel.
- „Gegenspionage verstärken“ als eigener Knopf. Er wird eine Ausbaustufe.
- Im Machtkreis entfallen die Hebel für Minister (befördern, Absprache, Bauernopfer). Sie doppeln Kabinett und Gespräch.
- Der Balken Regierungsstil. Er doppelt die Verfassung.
- Das Beziehungsnetz als Hauptbild. Es kommt hinter einen Aufklapper.
- Die freie Säuberung.

### Reihenfolge

Schritt 0 → M1 → D1 → D2 → M2 → M3 → D3 → M4 → D4.
- Zuerst kommen Tisch und Zweck, denn ohne sie hilft keine schönere Ansicht.

---

## 5. Rechercheliste mit Quellen

Abrufstand: 06.11.2026. Das Suchkontingent der Sitzung war nach den Läufen erschöpft. Lücken sind markiert. Auszüge aus den Gesetzestexten liegen in `…/scratchpad/mit/`.

### 5.1 Macht im Präsidialsystem

**Verfassung und Präsidialamt:**
- **Verfassung Art. 104, 106:** Der Präsident ernennt und entlässt Vizepräsidenten und Minister. Ein Abgeordneter, der Minister wird, verliert sein Mandat. Präsidialerlasse (CBK) dürfen keine Grundrechte regeln, das Gesetz geht vor. [mevzuat.gov.tr, Anayasa](https://www.mevzuat.gov.tr/MevzuatMetin/1.5.2709.pdf)
- **Art. 101:** höchstens zwei Wahlen.
- **Art. 116:** Eine vom Parlament mit drei Fünfteln beschlossene Neuwahl in der zweiten Amtszeit erlaubt eine weitere Kandidatur. Drei Fünftel von 600 sind 360. Quelle wie oben.
- **CBK Nr. 1 (RG 10.07.2018):** Organisation des Präsidialamts, Politikräte (Art. 20), dem Präsidenten unterstellt sind u. a. MİT und SSB (Art. 37), Chefberater und Sonderbeauftragte als Posten (Art. 3–4/A). [mevzuat.gov.tr](https://www.mevzuat.gov.tr/MevzuatMetin/19.5.1.pdf)

**Ministerwechsel:**
- Kabinett IV, 2018–2023, mit Wechseln 2020–2022: [Wikipedia: Cabinet Erdoğan IV](https://en.wikipedia.org/wiki/Cabinet_Erdoğan_IV)
- Albayrak trat am 08.11.2020 per Instagram zurück: [Duvar English](https://www.duvarenglish.com/amp/finance-minister-berat-albayrak-announces-resignation-on-instagram-news-48585); [Al Jazeera, 10.11.2020](https://www.aljazeera.com/news/2020/11/10/albayrak-resignation-what-it-means-for-turkeys-government)
- Kabinett V am 03.06.2023, 16 von 18 Ministern ersetzt: [Al Jazeera](https://www.aljazeera.com/news/2023/6/3/turkeys-president-erdogan-announces-new-cabinet); [ThePrint/ANI](https://theprint.in/world/turkish-president-erdogan-unveils-new-cabinet-line-up-replaces-16-of-18-previous-ministers/1614955); [Hürriyet Daily News](https://hurriyetdailynews.com/turkiye-announces-new-cabinet-183679)

**Partei und Fraktion:**
- Personalunion von Partei- und Präsidentenamt seit Mai 2017: [AA, 02.05.2017](https://aa.com.tr/en/turkey/turkish-president-erdogan-rejoins-ruling-ak-party-/809638); [Daily Sabah, 21.05.2017](https://www.dailysabah.com/politics/2017/05/21/erdogan-re-elected-chairman-of-ak-party-after-998-days-in-historic-congress)
- Fraktionsdisziplin und belegte Abweichler: **keine Quelle gefunden.** Der Disziplinwert im Spiel bleibt ein Spielparameter.

**Bündnispartner MHP:**
- Strafvollzugsgesetz 2020, Freilassung Çakıcı: [Duvar English, 17.04.2020](https://www.duvarenglish.com/politics/2020/04/17/mafia-leader-thanks-nationalist-party-leader-erdogan-after-being-released-from-jail)
- Öcalan-Initiative vom 22.10.2024: [Rudaw](https://www.rudaw.net/english/middleeast/turkey/22102024); [Duvar English](https://duvarenglish.com/bahceli-invites-pkk-leader-ocalan-to-parliament-to-end-terrorism-hints-at-his-potential-release-from-prison-news-65140)
- PKK-Auflösung am 12.05.2025: [Dawn](https://www.dawn.com/news/1910519). Waffen verbrannt am 11.07.2025: [Turkish Minute](https://www.turkishminute.com/2025/07/11/turkish-leaders-hail-irreversible-turning-point-after-pkk-ceremony-to-burn-weapons-in-northern-iraq/)
- Bahçeli fordert eine vorgezogene Wahl 2028 für eine erneute Kandidatur: [Hürriyet Daily News, 06.10.2026](https://www.hurriyetdailynews.com/bahceli-calls-early-2028-vote-for-erdogan-to-run-again-227794)
- Posten oder Ministerien für die MHP: **keine Quelle gefunden.**

**Kronprinzen und Brüche:**
- Pelikan-Akte vom 01.05.2016, Davutoğlu tritt im Mai 2016 zurück: [Wikipedia: Pelican files](https://en.wikipedia.org/wiki/Pelican_files); [CIDOB](https://www.cidob.org/en/publications/three-questions-raised-davutoglus-departure)
- Gelecek gegründet am 12.12.2019: [Wikipedia: Future Party](https://en.wikipedia.org/wiki/Future_Party_(Turkey))
- Babacan tritt 2019 aus, DEVA gegründet am 09.03.2020: [Hürriyet Daily News](https://hurriyetdailynews.com/former-deputy-pm-babacan-launches-party-152905)

**Säuberungen nach dem 15.07.2016:**
- [OHCHR-Bericht, März 2018](https://www.ohchr.org/sites/default/files/Documents/Countries/TR/2018-03-19_Second_OHCHR_Turkey_Report.pdf): 22 Notstandsdekrete, mindestens 152.000 Entlassene, über 4.200 Richter und Staatsanwälte, 159.506 Festnahmen bis Ende 2017, 166 Medien geschlossen; [UN News](https://news.un.org/en/story/2018/03/1005442)
- 103 Generäle und Admirale festgesetzt, 2.745 Richter suspendiert, EP-Votum vom 24.11.2016: [Wikipedia: 2016–present purges](https://en.wikipedia.org/wiki/2016–present_purges_in_Turkey)
- Kompetenzverluste in Zahlen: **keine Quelle gefunden.**

**Weitere Mittel:**
- 17./25.12.2013 und 350 versetzte Polizeiführer am 07.01.2014: [Wikipedia: 2013 corruption scandal](https://en.wikipedia.org/wiki/2013_corruption_scandal_in_Turkey)
- İmamoğlu am 19.03.2025 festgenommen, danach Massenproteste: [Al Jazeera](https://www.aljazeera.com/news/2025/3/19/turkiye-police-detain-erdogan-rival-imamoglu-in-corruption-terror-probe)
- Zwangsverwalter in 149 Gemeinden seit 2016: [Duvar English, 06.11.2024](https://www.duvarenglish.com/turkish-government-appoints-149-trustees-to-municipalities-since-2016-news-65204)
- RSF-Rang 163 von 180 (2026): [Turkish Minute, 30.04.2026](https://turkishminute.com/2026/04/30/turkey-plunges-to-163rd-in-rsf-press-freedom-index-amid-deepening-authoritarianism/)
- CPJ: 81 inhaftierte Journalisten (2016), 13 (2023): [CPJ](https://cpj.org/reports/2016/12/journalists-jailed-record-high-turkey-crackdown/); [Turkish Minute, 25.01.2024](https://turkishminute.com/2024/01/25/turkey-still-among-top-10-offender-cpj-census-imprisoned-journalists/)
- Can Atalay, Kassationshof gegen Verfassungsgericht 2023: [Bianet](https://bianet.org/haber/prosecutor-appointed-regarding-complaint-against-nine-constitutional-court-members-288258)

### 5.2 Nachrichtendienst MİT

**Rechtsgrundlage:**
- **Gesetz 2937:** Unterstellung unter den Präsidenten (Art. 3, KHK 694 von 2017), Aufgaben im Ausland (Art. 4 h/i, Gesetz 6532 von 2014), Befugnisse (Art. 6), Erlaubnisvorbehalt für Ermittlungen (Art. 26), Gefangenentausch mit Zustimmung des Präsidenten (Art. 26 a. E.), geheimer Haushaltstitel (Art. 20). [mevzuat.gov.tr](https://www.mevzuat.gov.tr/MevzuatMetin/1.5.2937.pdf)
- Eine MİT-Gesetzesänderung 2022: **keine Quelle gefunden.**

**Rückholungen:**
- 80 Personen aus 18 Ländern (April 2018): [Hürriyet Daily News](https://hurriyetdailynews.com/turkey-brings-back-80-feto-suspects-from-abroad-130338); [AP über Courthouse News](https://courthousenews.com/turkish-spy-agency-has-snatched-80-people-from-18-countries/)
- „über 100“: [SCF](https://stockholmcf.org/turkeys-intelligence-agency-confirms-abduction-of-more-than-100-people-with-alleged-links-to-gulen-movement/)
- „über 110“ und 72 % mehr Personalkosten: [Turkish Minute, 29.09.2021](https://turkishminute.com/2021/09/29/personnel-costs-have-risen-by-72-pct-since-2016-due-to-efforts-to-bring-gulenists-back-to-turkey/)

**Kosten im Gastland:**
- Kosovo, 30.03.2018: Entlassung von Innenminister und Geheimdienstchef. [RFE/RL](https://www.rferl.org/a/kosovo-turkey-interior-minister-secret-police-chief-ousted-over-gulen-arrests/29135357.html)
- Kirgistan: İnandı, von Erdoğan am 05.07.2021 bekanntgegeben. [The Diplomat](https://thediplomat.com/2021/07/abducted-from-kyrgyzstan-educator-orhan-inandi-paraded-in-turkey-as-a-terrorist)
- Kenia, 18.10.2024: Rüge des UNHCR. [EWN/AFP](https://www.ewn.co.za/2024/10/22/un-deeply-concerned-by-kenyas-return-of-turkish-refugees)

**Syrien, Irak, Libyen und Vermittlung:**
- Gezielte Schläge in Syrien und Irak, Mongolei 2018 gescheitert: [Wikipedia: MİT](https://en.wikipedia.org/wiki/National_Intelligence_Organization_(Turkey))
- Libyen 2019/20: [Wikipedia: Turkish intervention in Libya](https://en.wikipedia.org/wiki/Turkish_military_intervention_in_the_Second_Libyan_Civil_War)
- Geiseln von Mossul 2014: 49 Personen, frei nach 101 Tagen. [Wikipedia: Fall of Mosul](https://en.wikipedia.org/wiki/Fall_of_Mosul)
- Austausch in Ankara am 01.08.2024: 26 Personen, Abwicklung durch den MİT. [Wikipedia: 2024 Ankara prisoner exchange](https://en.wikipedia.org/wiki/2024_Ankara_prisoner_exchange)

**Auffliegen:**
- MİT-Lkw 2014 und Cumhuriyet 2015: [Wikipedia: MİT trucks scandal](https://en.wikipedia.org/wiki/MİT_trucks_scandal)
- Spionagefälle in Deutschland, Österreich, Schweiz und Schweden: Wikipedia: MİT (siehe oben)

**Leitung und Haushalt:**
- Leitung: Fidan von 2010 bis 2023, Kalın seit 05.06.2023. [Wikipedia: Hakan Fidan](https://en.wikipedia.org/wiki/Hakan_Fidan); [Wikipedia: İbrahim Kalın](https://en.wikipedia.org/wiki/İbrahim_Kalın)
- Haushalt 2020: 2,18 Mrd. TL bewilligt (Rechnungshof, über Turkish Minute, siehe oben).
- Ein amtlicher Betrag aus dem Haushaltsgesetz: **keine Quelle gefunden.**

### 5.3 Spielvorbilder

**Crusader Kings III:**
- Komplotte mit Agenten, Vorteil, Geheimhaltung und Lücken: [Schemes](https://ck3.paradoxwikis.com/Schemes)
- Geheimnisse und Druckmittel: [Secret](https://ck3.paradoxwikis.com/Secret); [Hooks](https://ck3.paradoxwikis.com/Hooks)
- Furcht: [Dread](https://ck3.paradoxwikis.com/Dread)
- Fraktionen mit Schwellen bei 80 % und 100 %: [Factions](https://ck3.paradoxwikis.com/Factions)
- Spionagemeister, höchstens ein Ereignis im Jahr: [Council](https://ck3.paradoxwikis.com/Council)
- Kritik, Komplotte blieben liegen: [guildorder](https://guildorder.com/games/ck3/guides/schemes-choosing-the-right-plot)

**Suzerain:**
- Minister ohne Parlament ernannt: [Cabinet](https://suzerain.wiki.gg/wiki/Cabinet)
- Warnzeichen vor dem Putsch: [Steam](https://steamcommunity.com/app/1207650/discussions/0/3032599335596354754)
- Kritik „not even told WHY“: [Steam](https://steamcommunity.com/app/1207650/discussions/0/2962769352279331267)

**Tropico 6:**
- Fraktionen mit Ultimatum: [GameRant](https://gamerant.com/tropico-6-every-faction-explained-guide/)
- Beseitigung und Wahlfälschung: [gamepressure](https://www.gamepressure.com/tropico-6/politics-and-constitution/z8c0a4)
- „no major downside“ (PC Gamer): [Wikipedia](https://en.wikipedia.org/wiki/Tropico_6)

**Democracy 4:**
- Minister erzeugen Kapital, Entlassung macht die übrigen illoyaler: [Basic Gameplay Guide](https://steamcommunity.com/sharedfiles/filedetails/?id=2242836711)
- Radikalisierung: [Guide](https://steamcommunity.com/sharedfiles/filedetails/?id=2370932090); [FAQ](https://www.positech.co.uk/democracy4/faq.html)

**HoI4, Stellaris, Victoria 3:**
- HoI4: Agentur, Netz und drei Phasen mit offenen Risikostufen. [Operations](https://hoi4.paradoxwikis.com/Operations)
- Stellaris: Infiltration und Zwischenereignisse. [Espionage](https://stellaris.paradoxwikis.com/Espionage)
- Victoria 3: Staatsstreich als diplomatische Handlung mit Schande. [Diplomacy](https://vic3.paradoxwikis.com/Diplomacy)

---

## 6. Messverfahren (zur Nachprüfung)

- `wt/game/a2mess/messung.test.ts`, inzwischen mit dem Worktree entfernt:
  - Spielstand laden, Monate vorlaufen, Standardantwort auf jedes Ereignis.
  - Wirkungsvergleich gegen eine Kontrolle aus demselben Stand.
  - Ergebnisse in `…/welle/a2/mess.json` und `…/welle/a2/mess-wirkung.json`.
- Browserläufe: `…/welle/a2/skripte/erkunde.cjs` mit den Schrittdateien `s*.json`, Bilder in `…/welle/a2/bilder/`.
- Einschränkung: In den frischen Spielen endet die Partie mit der Standardantwort nach etwa fünf Jahren (Wahl verloren). Die Zählungen gelten für diesen Zeitraum.
