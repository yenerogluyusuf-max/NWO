# Krieg in Staatsräson: Analyse, Lücken und Bauplan (W1, 06.11.2026)

Stand des Codes: b0ce3f3, gelesen in `~/Desktop/Staatsraeson/game`; gespielt in einem eigenen Worktree auf Port 5218.
Bilder liegen in `/private/tmp/claude-501/-Users-yusufyeneroglu/904f44f4-7b5f-44c2-9447-c69e44ab880b/scratchpad/welle/w1/bilder/`, im Text kurz `bilder/…`.
Ich habe nichts am Projekt geändert. Die Prüfdateien liegen nur im W1-Ordner: `lib.cjs`, `phase*.cjs`, `bilder.cjs`, die vitest-Dateien in `tests/` (liefen im inzwischen entfernten Worktree unter `game/test/w1/`), die Protokolle `vitest-*.txt` und die gesicherten Stände `stand-*.json`, die man über Menü › Spielstände › Datei laden kann.

Die gründliche Recherche liegt in drei eigenen Dateien. Die Tabellen „Zahlen fürs Spiel“ dort sind die Quelle aller Realwerte in diesem Papier:
- `recherche_operationen.md`: türkische Operationen 1974 bis 2022, Art. 92, die Vollmachten (tezkere), die Gliederung der Streitkräfte.
- `recherche_besatzung.md`: Verwaltung Nordsyriens, Nordzypern, Krim, Hatay, Besatzungsrecht.
- `recherche_vorbilder.md`: HOI4, Victoria 3, Civ 6, Democracy 4 und Suzerain, dazu 12 übertragbare Muster und sieben Korrekturen am Projektbestand.

Grundsatz: Jede Zahl unten trägt eine Quelle oder ist ausdrücklich als „Spielparameter“ markiert. Messwerte aus meinen Läufen tragen den Namen des Laufs.

---

## 0. Kurzfassung

Das Kriegssystem ist im Kern mehr, als der Inhaber gesehen hat. Es kennt sechs Schauplätze mit Regionen, Gelände, Einsatzart, Tempo, Gegnerbestand, Koalitionen, Kriegspreis und Besatzung mit Annexion. Drei Dinge machen es trotzdem zu einem schlechten Spiel:

1. **Man kommt nicht hinein.** Den Knopf „Krise eröffnen“ gibt es, aber er ist unerreichbar. Ein erklärtes Kriegsziel verfliegt, bevor es wirkt. Gegen Irak und Armenien gibt es nicht einmal die Geste „Druck“.
2. **In der Mitte gibt es nichts zu entscheiden.** Im Krieg stehen vier Knöpfe, davon einer sinnvoll („Reserven“, alle 21 Tage). Die Front läuft von selbst. Ganz Nordsyrien samt Aleppo fällt in fünf Wochen, ganz Zypern gegen die EU in sieben Wochen.
3. **Das Ende ist eine Schleife, kein Frieden.** Bei Frontlage 96 kommt die Waffenruhe mit dem Satz „akzeptiert jedes Paket“. Der Siegerfrieden hat dann aber 29 % Aussicht. Also klickt man „Weiterkämpfen“, bis der Gegner nachgibt (im Spielstand des Inhabers zweimal, in meinem Zypern-Lauf siebenmal). Danach ist Annexion nur ein Etikett auf einer Fläche, ohne Bevölkerung, Wirtschaft oder Folgen für das eigene Land. Der annektierte Staat lebt im Weltmodell weiter. Ein Jahr später greift er an, und die Türkei „erobert“ ihre eigenen annektierten Regionen ein zweites Mal.

Der Krieg des Inhabers gegen Israel lief im Kleinen genau so ab. Ohne Schauplatz gab es nichts zu besetzen und keine Karte. Die Front lief trotzdem wie ein Landkrieg gegen ein Land ohne gemeinsame Grenze. An der Seite der Türkei kämpften die USA gegen Israel.

---

## 1. Ist-Zustand

### 1.1 Der Krieg des Inhabers (Spielstand 3. August 2043)

Aus `s2043.json` und dem Protokoll (`welt.spiel.kriege`, `welt.log`):

| Datum | Was geschah | Entscheidung des Spielers |
|---|---|---|
| 08.01.2043 | Ereignis „Jerusalem sucht den Streit“, Wahl „Kontern“ | 1 |
| 14.02. | Geste „Öffentlich Druck machen“ | 2 |
| 22.02. | Drohkulisse; im Ereignis „Teilmobilmachung“ gewählt | 3 |
| 02.03. | Kriegsziel „Schutz von Minderheiten“ | 4 |
| 03.03. | **Israel schlägt einen Tag später zu.** Das Kriegsziel hob die Eskalation um 10 auf über 95 (`sim/krieg.ts:797`, Angriff ab 95 in `:1442`). 6 Partner der Türkei, 0 des Gegners | — |
| 04.03. | „Partner um Beistand bitten“: UK, Niederlande, Spanien und **USA** sagen zu | 5 |
| 10.03. | „Reserven und Nachschub“ | 6 |
| 24.03. | Front 67; 12.05. 270 Gefallene; Front ≥ 96, „Israel ist erschöpft“ | — |
| 19.05. und 26.05. | Zweimal „Wiederaufnahme der Operationen“ (Rückhalt −5 je Klick) | 7, 8 |
| 03.06. | „Siegerfrieden“: Pufferzone „ohne Grenzänderung“, Reparationen (Schuldenquote −0,8), Garantien | 9 |

Endstand des Vorgangs `kv-ISR-5354`: Front 100, 12 Wochen, 318 Gefallene. Der Rückhalt stand bei **109,7**, also über dem Startwert 100. `regionen: {}`, `besatzung: []`. Zwischen Kriegsbeginn und Frieden senkte die Zentralbank den Leitzins viermal. Am Tag des Friedens stellte der Spieler noch eine weitere „Druck“-Geste gegen Israel.

Der Inhaber zählt etwa 4 Entscheidungen. Es waren 9 Klicks, aber nur zwei hatten eine echte Abwägung: Kriegsziel und Friedenspaket. Die übrigen waren Pflicht („Weiterkämpfen“) oder ohne Gegenwahl („Reserven“).

### 1.2 Wie beginnt man einen Krieg?

**Im Spiel selbst gibt es keinen Weg, einen Krieg direkt anzufangen.**

- `ui/welt/KriegDossier.tsx:134–149` bietet „Krise eröffnen · 4 Kapital“ an (`sim/krieg.ts:1571 kriseEroeffnen`, ab Konflikt 55).
- Das Dossier erscheint aber nur im Reiter „⚔ Konflikt“. Den zeigt `ui/Welt.tsx:218–222` **nur, wenn schon ein Vorgang läuft** (`kriegMit`). Der Knopf ist damit toter Code.
- Bild `bilder/w1-03-griechenland-vorher.png`: Griechenland mit Konflikt 62, aber nur die Reiter Überblick, Verhandlungstisch, Verträge und Gesten.

Der einzige Weg führt über **Außen › Land › Gesten › „Öffentlich Druck machen“** (2 Kapital, Konflikt +6, Abkühlung 60 Tage, `sim/laender.ts:281, 537`). Danach muss man warten, bis die Monatsprüfung bei Konflikt ≥ 73 und mindestens 3 über dem Ruhewert einen Vorgang „Spannung“ anlegt (`sim/krieg.ts:1503–1511`). Bilder: `bilder/w1-11-zypern-ueberblick.png`, `bilder/w1-12-zypern-gesten.png`, `bilder/w1-13-zypern-druck.png`.

Gemessen mit `test/w1/druck-weg.test.ts`: frisches Spiel, Samen 6, ein Spieler drückt, sobald die Geste frei ist.

| Gegner | Konflikt zu Beginn | Weg bis zum Vorgang |
|---|---|---|
| Zypern | 72 | 26 Tage, 1× Druck |
| Griechenland | 55 | 241 Tage, 5× Druck |
| Iran | 55 | 241 Tage, 5× Druck |
| Syrien | 20 | **726 Tage, 13× Druck** |
| Irak | 42 | **unmöglich**: keine Geste „Druck“ (`sim/laender.ts:134`) |
| Armenien | 48 | **unmöglich**: keine Geste „Druck“ (`sim/laender.ts:156`) |

Für Irak und Armenien entsteht ein Krieg nur aus zufälligen Zwischenfällen (`sim/krieg.ts:1612`). Zwei der sechs Schauplätze sind für den Spieler also gesperrt.

### 1.3 Spannung → Drohkulisse: Das Kriegsziel verfliegt

Bild `bilder/w1-16-zypern-spannung.png`: Phasenleiter, Eskalation 73, Verlauf, vier Kriegsziele mit Preisen, Vermittlung, Beruhigen, Ultimatum, Bereitschaft. Das ist gut gemacht.

Der Fehler steckt im Ablauf. Das Kriegsziel hebt die Eskalation um 10 (`sim/krieg.ts:797`). In der Spannung folgt die Eskalation aber jeden Tag mit 6 % dem Konfliktwert des Landes (`:1354, :1425`). Die Drohkulisse verlangt mindestens 21 Tage Spannung und eine Eskalation ≥ 78 (`:107, :1429`). Lauf `vitest-zypern-verlauf.txt` im Stand des Inhabers mit einem Druck auf Zypern:
- Am Tag des Kriegsziels steht die Eskalation bei 83.
- Am 11. Tag sind es 78,7, am 21. Tag 75,7.
- Die Drohkulisse kommt nie. Der Vorgang „klingt ab“ und endet nach 5½ Monaten.

Mein erster Browserlauf (`phase2.cjs`) endete genauso, mit 8 Kapital für ein Kriegsziel, das verschwand. Wer Krieg will, muss am 19. bis 21. Tag Bereitschaft und Druck stapeln. Das steht nirgends.

Für den umgekehrten Fall gilt dasselbe Muster. Beim Inhaber stand die Eskalation schon bei 88, als er das Kriegsziel erklärte. Die +10 lösten den Angriff Israels am nächsten Tag aus. Wer ein Kriegsziel erklärt, wird also entweder angegriffen oder es passiert nichts.

### 1.4 Beschluss im Parlament

Die Abstimmung (`sim/krieg.ts:1067`) ist echt: 600 Sitze, Mehrheit 301, Bonus nach Rahmung.
- Stand des Inhabers: 327:273 für Zypern und ebenso für Syrien.
- Frisches Spiel (Samen 6, Zustimmung 33 %, keine Mehrheit): **20 Ablehnungen in Folge** (202:398 bis 229:371, `vitest-syrien-krieg.txt`). Der Bot konnte den Antrag alle 21 Tage für 10 Kapital neu einbringen, ohne steigenden Preis. Hebel für Stimmen (Zusage an die MHP, Fraktionsdeal) gibt es im Kriegsdossier nicht.

Realität laut `recherche_operationen.md` Abschnitt C:
- Die Türkei hat für Syrien und Irak eine **stehende Rahmenvollmacht**. Die letzte wurde am 21.10.2025 um drei Jahre bis 30.10.2028 verlängert; 2023 ging sie mit 357:164 durch.
- Ein neues Mandat braucht es nur für neue Länder (Zypern, Griechenland) oder nach Fristablauf.
- Der Präsident darf nach Art. 92 Abs. 2 nur bei einem plötzlichen Angriff **während der Parlamentsferien** allein entscheiden.
- Das Spiel kennt weder die Vollmacht noch die Bedingung der Ferien (`sim/krieg.ts:521 angriffAufTuerkei`).

### 1.5 Im Krieg: welche Entscheidungen je Woche?

Bild `bilder/w1-30-syrien-mitte-akte.png` (Woche 3, Front 79): Es gibt vier Knöpfe (`sim/krieg.ts:595–612`):

| Knopf | Kosten | Wirkung |
|---|---|---|
| Reserven und Nachschub | 6 Kapital | Front +3, alle 21 Tage |
| Waffenruhe anbieten | 5 Kapital | |
| Partner um Beistand bitten | 6 Kapital | |
| Vollmobilmachung nachziehen | 14 Kapital | |

Darunter stehen Einsatzart (vier Arten) und Tempo (drei Stufen) als Daueranweisung. Keiner der Knöpfe verlangt eine Abwägung.
- „Reserven“ hat keinen Nachteil außer 0,25 % des BIP.
- „Waffenruhe“ lohnt nicht, solange man gewinnt.
- Ein Zwischenfall, ein Gegenstoß oder eine Entscheidung mitten im Krieg kommt nicht.
- Der Schreibtisch zeigt den Krieg nicht, außer bei Nachschub unter 50 % oder in der Waffenruhe (`ui/schreibtisch/briefing.ts:441–452`). Bild `bilder/w1-30-syrien-mitte-karte.png` vor dem Schließen: sechs Entscheidungen „heute“, keine davon zum Krieg.

Der Zielraum (Grenzstreifen, tief, ganz) wird in einer anderen Ansicht gewählt (Sicherheit › Zielräume, `ui/militaer/Streitkraefte.tsx:90–125`, Bild `bilder/w1-18-sicherheit.png`). Das Konfliktdossier verweist nicht darauf. Ohne Wahl gilt nur die Grenzreihe (`sim/kriegsschauplatz.ts:101`).

### 1.6 Was zeigt die Karte?

**3D-Karte**, Bilder `bilder/w1-31-syrien-mitte-3d-karte.png` und `bilder/w1-32-syrien-waffenruhe-karte-nah.png`:
- Die Regionen sind Flächen um einen Ort; genommene sind rot, die umkämpfte hat einen gelben Rand, die gegnerischen sind gestrichelte Kreise.
- Ein Pfeil zeigt zur umkämpften Region.
- Die Flächen sind schematische Linsen um einen Ort und überlappen sich; sie folgen keiner Verwaltungsgrenze.
- Eine Frontlinie, Verbände oder bedrohte Provinzen habe ich in der 3D-Ansicht nicht gesehen.

**Vereinfachte 2D-Karte**, Bild `bilder/w1-30-syrien-mitte-karte.png`: Regionen als Kreise, eine gezackte Frontlinie und drei Marken (Heer 112 %, Luft 112 %, Gegner 89 %) aus `kriegsKarte` (`sim/kriegsschauplatz.ts:610–674`).

**Ohne Schauplatz zeigt die Karte nichts.** `kriegsKarte` gibt `null` zurück (`:619, :672`). So war es im Israel-Krieg des Inhabers.

### 1.7 Waffenruhe und Frieden: die Schleife

1. Bei Front ≥ 96 tritt die Waffenruhe von selbst ein (`sim/krieg.ts:1347–1350`). Der Text lautet: „Die Gegenseite akzeptiert jedes Paket mit Gesichtswahrung“ (`i18n/katalog/de/krieg.json:351`).
2. Die Aussicht der Pakete folgt aber `paketAnnahme` (`:409–416`) mit der Erschöpfung des Gegners, die in der Waffenruhe **stillsteht**, und einer Blockade durch dessen Partner (`sim/pakte.ts paketBlockade`).
3. Lauf `vitest-zypern-krieg.txt`: Ganz Zypern ist genommen, Front 99,6, der Siegerfrieden steht bei **29 %** (Bild `bilder/w1-35-zypern-waffenruhe-akte.png`: alle vier Regionen genommen, Frontlage 100, „Annahme etwa 29 %“). Der Gegner bietet nach 30 Tagen „Ausgewogen“ an, also Status quo.
4. Lehnt man ab, **friert** der Konflikt nach 120 Tagen ein: „keine Gebietsänderung, kein Vertrag“ (`:1222–1249`). Alle eroberten Regionen sind dann weg, denn das Einfrieren ruft `besatzungNachFrieden` nicht auf.
5. Wer siegen will, muss „Weiterkämpfen“ klicken (Rückhalt −5, `:913–919`). Dann fällt die Front in der nächsten Woche wieder auf ≥ 96, und es gibt wieder Waffenruhe.
6. Im Zypern-Lauf brauchte es **7× Weiterkämpfen** bis 62 % Aussicht, beim Inhaber zweimal.

Gegen das schwache Syrien war der Siegerfrieden sofort zu haben, mit 59 % (Bild `bilder/w1-32-syrien-waffenruhe-akte.png`). Sein Text verspricht dort „Pufferzone … Die Grenze selbst bleibt, wo sie ist“. Tatsächlich besetzt er dann alle neun Regionen bis Deir ez-Zor (Lauf Syrien). Der Text widerspricht der Wirkung.

Die Pakete sind vier feste Bündel (`:440–461`). „Gebiet“ ist nur −1, 0 oder +1 (`sim/krieg-typen.ts:82–91`). Der Kommentar in `krieg-typen.ts:203–208` sagt es selbst: „Gebietsübertragung (Welle 2, noch nicht gebaut)“.

### 1.8 Besatzung und Annexion

Nach einem Siegerfrieden werden alle gehaltenen Regionen „Pufferzone“ (`sim/kriegsschauplatz.ts:420–439`). Den Besatzungsblock findet man an zwei Stellen: im Konfliktdossier ganz unten (nur, solange der Vorgang noch existiert) und unter Sicherheit › Besetzte Regionen. Dort gibt es je Region die Knöpfe Pufferzone, Zivilverwaltung, Annexion (14 Kapital) und Rückgabe (`ui/krieg/Besatzung.tsx`, Bilder `bilder/w1-33-*` und `bilder/w1-36-*`).

Was die Annexion tut (`:468–506`):
- Ansehen −8, EU −6, Nationalisten +4.
- Konflikt mit dem Land +20, mit EU +15, mit USA +8.
- Widerstand +15, dazu Ansehen −0,15 je Monat.
- Die Fläche wird auf der Karte kräftiger rot (`ui/atlas/kriegsfx.ts:113`). **Sonst nichts.**
- Keine Provinz entsteht, keine Bevölkerung, keine Steuer, keine Sitze, keine Wähler.
- Keine UN-Abstimmung, keine gestuften Sanktionen wie bei der Krim.
- Keine Integrationszeit, keine Siedlungs- oder Rückkehrfrage.

Lauf `vitest-syrien2043-krieg.txt`: Nach dem Frieden annektiert der Bot, sobald das Kapital reicht; im ersten Jahr sind es sechs der neun nordsyrischen Regionen. Der Widerstand steigt auf 58 bis 70, ein Aufstand kommt nicht (Schwelle 85 über drei Monate). Die Zustimmung liegt 1,8 Punkte unter dem Lauf ohne Krieg, das **Wachstum sogar höher** (7,12 % gegen 6,68 %).

**Der annektierte Staat lebt weiter und greift an.** Das ist der gröbste Befund der Läufe:
- Syrien: Elf Monate nach dem Frieden „schlägt Syrien zu“ (23.07.2044). Der neue Vorgang beginnt bei Front 50, und alle Regionen gelten wieder als gegnerisch. Die Türkei „nimmt“ Asas, Manbidsch und Qamischli ein zweites Mal, obwohl sie schon annektiert sind; Frankreich tritt an der Seite der Türkei bei.
- Zypern: Nach der Annexion von Nikosia, Larnaka und Limassol „schlägt Zypern zu“ (18.11.2044), einen Monat vor der Annexion des letzten Bezirks. Ungarn und Rumänien treten dem Krieg an der Seite der Türkei gegen ein EU-Mitglied bei. 2045 meldet das Spiel einen „Machtwechsel in Zypern“, obwohl die ganze Insel türkisch ist.
- Ursache: Annexion und neuer Vorgang kennen einander nicht. `regionenSetzen` (`sim/kriegsschauplatz.ts:356`) startet jeden Krieg mit allen Regionen beim Gegner. Das Weltmodell führt den Staat unverändert weiter.

Lauf Zypern: Die Annexion aller vier Bezirke eines EU-Staats (zusammen 14 × 4 = 56 Kapital über 5 Monate) brachte:
- EU-Konflikt 100.
- US-Sanktionen erst rund 15 Monate nach Kriegsbeginn.
- Anschläge (−0,3 Zustimmung je Fall).
- Zustimmung −6,6 Punkte gegenüber dem Lauf ohne Krieg, Wachstum −2,2 Punkte, Schuldenquote +2,9 Punkte.

### 1.9 Was ein Krieg kostet: Läufe im Vergleich

Mein Spieler-Bot (`test/w1/zypern-krieg.test.ts`) nutzt nur Handlungen, die die Oberfläche anbietet, mit dem Kapital wie im Spiel. Zu jedem Lauf gibt es einen Zwillingslauf ohne Krieg.

| Lauf | Kriegsdauer | Genommen | Gefallene | Zustimmung nach 1 J. (mit / ohne Krieg) | Wachstum | Lira je $ | Schuldenquote |
|---|---|---|---|---|---|---|---|
| Zypern (Stand 2043, gegen Zypern, Griechenland und 9 weitere EU-Staaten) | 14 Kampfwochen, 20 Wochen bis zum Frieden, 7× Weiterkämpfen | ganz Zypern | 413 | 56,8 / 63,4 | 5,29 / 7,45 | 161,8 / 158,6 | 8,92 / 5,97 |
| Syrien (Stand 2043, Abkürzung für 2 Jahre Druck) | 6 Wochen | alle 9 Regionen inkl. Aleppo und Deir ez-Zor | 125 (Akte bei der Waffenruhe) | 59,8 / 61,6 | 7,12 / 6,68 | 168,9 / 156,2 | 8,95 / 6,78 |
| Israel (Inhaber) | 12 Wochen | nichts (kein Schauplatz) | 318 | — | — | — | — |

Die Spalten „nach 1 Jahr“ enthalten den zweiten Krieg, den die Annexion auslöste (siehe 1.8). Die Abstände messen also zwei Kriege, nicht einen.

Wöchentlich bucht der Krieg (`sim/kriegsschauplatz.ts:72–76, :343–352`; `sim/kriegspreis.ts:51–71`):
- 0,006 bis 0,025 % des BIP an Operationskosten.
- Kriegsmüdigkeit bis 0,4 Zustimmungspunkte je Woche.
- 0,008 Punkte je Gefallenem.
- Risikoaufschläge, Tourismus.

Alles Spielparameter. Wehrpflichtige und Reservisten fehlen nicht am Arbeitsmarkt. Der Haushalt kennt keinen Nachtragshaushalt. Die Zentralbank reagiert nicht.

---

## 2. Lücken nach Schwere

**A = macht den Krieg kaputt oder unerreichbar · B = großer Realismus- oder Spielfehler · C = fehlt, wäre aber nötig für „wie HOI4“**

| # | Schwere | Lücke | Beleg |
|---|---|---|---|
| A1 | A | „Krise eröffnen“ ist unerreichbar; der Spieler kann keinen Krieg selbst anfangen | `ui/Welt.tsx:218`, `ui/welt/KriegDossier.tsx:134` |
| A2 | A | Das Kriegsziel verfliegt vor der Mindestdauer, oder es löst den gegnerischen Angriff aus; es gibt keine verlässliche Leiter | `sim/krieg.ts:797, 1354, 1425, 1442`; Lauf `vitest-zypern-verlauf.txt` |
| A3 | A | Waffenruhe-Schleife: „akzeptiert jedes Paket“, Aussicht aber 29 %; nur „Weiterkämpfen“ hilft; Einfrieren löscht alle Eroberungen | `sim/krieg.ts:409, 913, 1222, 1347`; Lauf Zypern |
| A4 | A | Annexion ist nur ein Etikett: keine Provinz, keine Menschen, keine Wirtschaft, keine Rechtsfolge | `sim/kriegsschauplatz.ts:468–506` |
| A6 | A | Ein annektiertes Land existiert weiter, greift an und „verliert“ dieselben Regionen erneut; ein vollständig annektierter Staat (Zypern) hat weiter Regierung, Armee und Machtwechsel | Läufe Syrien und Zypern, Abschnitt 1.8; `sim/kriegsschauplatz.ts:356` |
| A5 | A | Krieg ohne Schauplatz (Israel, Russland, Ägypten …) läuft als Landfront ohne Karte und ohne mögliches Gebiet | `kriegsKarte` → `null`; `besatzungNachFrieden` ohne Regionen |
| B1 | B | Eroberung viel zu billig: ganz Nordsyrien in 6 Wochen mit 85 Gefallenen. Real je Bodenoperation 2.000–4.820 km² bei 12–71 Gefallenen, Dauer 9 Tage bis 7 Monate (`recherche_operationen.md`, Zahlen fürs Spiel) | Lauf Syrien |
| B2 | B | Koalitionen widersinnig: USA, UK, NL, ES kämpfen gegen Israel; gegen Zypern kämpfen 10 Staaten, und die Türkei gewinnt trotzdem in 7 Wochen. Real gab es 2019 nur nationale Exportstopps von 9 EU-Staaten, kein EU-Embargo und 9 Tage US-Sanktionen | Log Inhaber 03.03.2043; Lauf Zypern; `recherche_operationen.md` A3 |
| B3 | B | Israel ohne gemeinsame Grenze als Front mit Gefallenen wie bei einer Bodenoffensive; Israel „schlägt zu“ wie ein Nachbar | `sim/krieg.ts:1442`, `ZWISCHENFALL_ORT ISR "see"` `:1599` |
| B4 | B | Rückhalt steigt beim Siegen über den Startwert (Inhaber 109,7, Zypern-Lauf 120) | `sim/krieg.ts:1294` (Gewinn-Term) |
| B5 | B | Wirtschaft und Innenpolitik reagieren kaum; im Syrien-Lauf liegt das Wachstum mit Krieg über dem Wert ohne Krieg; keine Zentralbank-, Lira- oder Börsenreaktion auf eine Sanktionsdrohung (real 2019: Lira +4,3 %, BIST −7,7 %, nach 2 Wochen erholt) | Läufe; `recherche_operationen.md` A3 |
| B6 | B | Irak und Armenien haben keine Geste „Druck“; zwei Schauplätze sind nur per Zufall erreichbar | `sim/laender.ts:134, 156` |
| B7 | B | Keine stehende Vollmacht für Syrien und Irak; Art. 92 Abs. 2 ohne die Bedingung der Parlamentsferien; Neu-Abstimmen ohne steigenden Preis (20× in Folge möglich) | `sim/krieg.ts:521, 1067`; `recherche_operationen.md` C |
| B8 | B | Zielraum nur unter Sicherheit, nicht im Kriegsdossier und nicht auf der Karte | `ui/militaer/Streitkraefte.tsx:90` |
| B9 | B | Keine Entscheidung im Krieg mit Einsatz: keine Wendepunkte, kein Ereignis, kein Schreibtischeintrag | `sim/krieg.ts:595`, `ui/schreibtisch/briefing.ts:441` |
| C1 | C | Fronten als Linie je Region auf der 3D-Karte, Verbände mit Stärke, Offensiven je Achse | nur 2D zeigt Linie und Marken |
| C2 | C | Luftlage und Seelage je Schauplatz als eigener Zustand (heute nur über die Wahl der Einsatzart) | `data/schauplaetze.ts:139–180` |
| C3 | C | Nachschub als Achse mit Engpass (heute ein Versorgungsfaktor aus Gütern) | `sim/versorgung.ts` |
| C4 | C | Friedenskonferenz mit Forderungen je Region (Sicherheitszone, Rückzug 30 km, Patrouillen, Rückkehr, Reparationen) und Vermittler (USA, Russland) | `sim/krieg.ts:440`, `krieg-typen.ts:203` |
| C5 | C | Besatzungsverwaltung wie real: Stellvertreter (SNA), Zivilverwaltung über Grenzgouverneure, Lira, PTT, Schulen, Satellitenstaat (TRNZ-Modell) | `recherche_besatzung.md` A, B |
| C6 | C | Internationale Reaktion in Stufen: UN-Sicherheitsrat (Veto), Generalversammlung (Krim 100:11:58), Sanktionsleiter, Waffenexportstopps einzelner Staaten | `recherche_besatzung.md` C; `recherche_operationen.md` A3 |
| C7 | C | Regionen ohne Bevölkerung und Fläche (bewusste Lücke, `data/schauplaetze.ts:16`) | |
| C8 | C | Flucht und Vertreibung als Folge (real 137.000–300.000 je Syrien-Operation) | `recherche_operationen.md` |

**Was es halb gibt:** Regionen und Front (nur 6 Schauplätze, Fläche schematisch), Verbände (nur 2D), Luft und See (nur als Einsatzart), Nachschub (Versorgungsfaktor), Friedenspakete (4 feste Bündel), internationale Reaktion (EU/USA-Konflikt, zwei Sanktionsschwellen, Kränkung), Kriegsmüdigkeit (Zustimmung je Woche, gedeckelt), Besatzung und Widerstand (Formen und Anschläge, ohne Menschen und Verwaltung).

**Was es gar nicht gibt:** Offensiven je Region mit eigener Entscheidung, Wendepunkte im Krieg, Vermittler am Friedenstisch, Gebietsforderung als Liste, Annexion mit Folgen im eigenen Land, UN-Abstimmungen, Vertreibung, eine stehende Vollmacht.

---

## 3. Realismusfehler im Einzelnen

1. **Landkrieg ohne Grenze (Israel).** Zwischen der Türkei und Israel liegen Syrien und das Mittelmeer. Ein bewaffneter Konflikt wäre Luft, Raketen, See und Stellvertreter. Gebiet ist nicht zu nehmen. Das Spiel rechnet trotzdem Frontlage, „Geländegewinne“ (Log 24.03.2043) und 318 Gefallene wie in einer Bodenoffensive.
2. **NATO-Partner gegen Israel.** `koalitionenBeiKriegsbeginn` (`sim/pakte.ts:470`) prüft die Pflicht aus dem Pakt, aber nicht die Nähe des Partners zum Angreifer. Eine Kriegsbeteiligung der USA gegen Israel ist unrealistisch. Belegt ist das enge Bündnis USA–Israel, im Spiel selbst: `dk-IRN-ISR-26` mit den USA an Israels Seite.
3. **Zypern gegen die EU in sieben Wochen.** Gegen die Türkei standen Griechenland und neun weitere EU-Staaten, und sie gewann trotzdem schnell. 1974 genügten 568–1.500 Gefallene für 36–37 % der Insel (`recherche_operationen.md` B). Das Spiel nahm 100 % mit 413 Gefallenen, mit EU-Sanktionen ab Woche 4 und sonst wenig Wirkung.
4. **Gebiet zu billig, Verluste etwa richtig.** Die Gefallenen je Woche liegen in der belegten Größenordnung (Dutzende). Die Fläche je Woche ist um eine Größenordnung zu groß: Die neun nordsyrischen Regionen decken zusammen weit mehr als die 2.000–4.820 km² einer realen Operation. Exakte Flächen der Spielregionen fehlen (C7).
5. **Siege machen beliebt, Kriege kosten nichts.** Real: Zustimmung zur Operation 72–79 %, der Effekt für die Amtsführung aber klein, +4 bei MetroPOLL und 0 bei KONDA, abklingend in 2–3 Monaten (`recherche_operationen.md`). Im Spiel steigt der Rückhalt durch Siege über 100. Kriegsmüdigkeit ist bei 0,4 je Woche gedeckelt.
6. **Märkte.** Real bewegte der Kriegsbeginn die Lira kaum (±1 %). Die Sanktionsdrohung 2019 kostete 4,3 % und an der Börse 7,7 %, beides erholte sich nach der Pause binnen zwei Wochen. Im Spiel springt der Risikoaufschlag zu Beginn um 150–220 Basispunkte (`sim/krieg.ts:117`); eine Sanktionsdrohung als eigener Moment fehlt.
7. **Waffenstillstand.** Real: Pause mit Frist und Zonen. 2019 waren es 120 h (USA) und 150 h (Sotschi), 30 km Rückzug, gemeinsame Patrouillen 10 km tief. 2020 in Idlib ein Korridor von 6 km beiderseits der M4. Im Spiel steht die Waffenruhe 120 Tage und friert dann ein.
8. **Annexion.** Völkerrechtlich ist sie nichtig (UN-Charta Art. 2 Abs. 4; Erklärung über freundschaftliche Beziehungen 1970), und die Pflichten der Besatzungsmacht bleiben (GA IV Art. 47; `recherche_besatzung.md` C.4). Folgen bei der Krim: UN-Generalversammlung 100:11:58, Sanktionen in vier Stufen 2014, IWF-Schätzung 1–1,5 % des BIP sofort und bis 9 % mittelfristig. Im Spiel: Ansehen −8, kein Wirtschaftsschaden über die Monatskosten von 0,03 % des BIP je Region hinaus (Spielparameter).
9. **Vollmacht und Verfassung.** Siehe 1.4. Ein Einsatz in Syrien oder Irak braucht heute keine neue Abstimmung, ein Einsatz gegen Zypern oder Griechenland schon.

---

## 4. Wie viel muss man tun? Leitbild „wenige echte Entscheidungen mit Einsatz“

Ein Krieg mit vier Pflichtklicks ist kein Spiel. Ein Krieg mit 40 Klicks wäre Aktenarbeit, und genau die lehnt der Inhaber ab („keine Aktenarbeit“, `nwo_realismus_als_spiel.md`). Mein Ziel für einen Krieg von 2 bis 6 Monaten sind **8 bis 12 Entscheidungen**, jede mit einem sichtbaren Preis und einem Gegenüber, das antwortet:

| Phase | Entscheidung | Einsatz | Vorbild |
|---|---|---|---|
| Krise | **Forderung stellen** und Ziel auf der Karte markieren (Grenzstreifen 30 km, Stadt, Insel …) | Ansehen, Kränkung, Parlament; sichtbare Leiter mit Daten | Vic3 Diplomatic Play, HOI4 Rechtfertigung (`recherche_vorbilder.md` M1, M11) |
| Krise | Nachlegen, halten oder nachgeben (zwei bis drei Mal) | Eskalation, Märkte, Vermittler bieten Ausweg | Vic3 Eskalation |
| Mandat | Vollmacht nutzen oder neues Mandat; Stimmen erkaufen (Zusage an eine Fraktion) | Kapital, Zusage, Opposition | Tezkere 2003/2019/2023 |
| Beginn | **Operationsform** wählen: Luft- und Drohnenschläge (Klauenschwert), begrenzte Bodenoperation mit Verbündeten (Friedensquelle), Großoffensive, Landung (Atilla) | Dauer, Verluste, Gebiet, Reaktion | `recherche_operationen.md` A1–A7, B |
| Verlauf | 2–4 **Wendepunkte**: Gegenstoß („Reserven schicken oder Linie halten“), Ziviltote („untersuchen oder bestreiten“), Sanktionsdrohung („Pause mit Frist annehmen?“), Partner verlangt Halt | jeweils echter Tausch: Gebiet gegen Ansehen, Tempo gegen Leben | 2019: 120-h-Pause; Idlib 2020: 33 Gefallene an einem Tag |
| Ende | **Friedenstisch**: aus einem Punktebudget 3–5 Forderungen wählen (Zone, Rückzug, Patrouillen, Rückkehr, Reparationen), Vermittler schlägt Paket vor | Annahme gegen Härte; Innenpreis | HOI4-Punktebudget ohne Auktion (M8), Sotschi |
| Danach | **Form je Region**: Sicherheitszone mit Stellvertretern, Zivilverwaltung über die Grenzprovinz, Satellitenstaat, Annexion mit Eingliederung, Rückgabe | Kosten, Widerstand, Sanktionen, Rückkehr von Geflüchteten | HOI4-Besatzungsgesetze (M10), Vic3-Eingliederung (M9), TRNZ, Krim |

Der Rest läuft von selbst und wird gezeigt, nicht verlangt: Front auf der Karte, Verluste, Märkte, Stimmung.

---

## 5. Entwurf: Ein guter Krieg, in Tagesschritten

Jeder Schritt ist so geschnitten, dass ein Agent ihn an einem Tag bauen, testen und mit Bildern belegen kann. Die Reihenfolge ist die Abhängigkeit. Alle neuen Zahlen sind entweder aus den drei Recherchedateien belegt oder ausdrücklich Spielparameter. Jeder Schritt hält Spielstände ladbar (Migration mit `??=`) und testet mit dem Stand des Inhabers `s2043.json`.

### Schritt 1: Zugang und Leiter reparieren (A1, A2, B6, B8)
- **Was:**
  - Reiter „⚔ Konflikt“ immer zeigen, wenn `kriseGrund` nur am Konfliktwert scheitert oder ein Schauplatz besteht. Vorschlag: für alle Nachbarn mit Schauplatz.
  - Die Eskalation in der Spannung folgt nicht mehr nur dem Konfliktwert. Eigene Schritte (Kriegsziel, Bereitschaft, Mobilmachung) heben stattdessen einen **Sockel**, der bis zur Entspannung hält.
  - Die Mindestdauer bleibt.
  - Kriegsziel und Angriffsschwelle trennen: Der gegnerische Präventivschlag hängt an seiner Stärke und Lage, nicht an +10 Eskalation.
  - „Druck“ für Irak und Armenien; Zielraumwahl ins Dossier.
- **Dateien:** `ui/Welt.tsx`, `ui/welt/KriegDossier.tsx`, `sim/krieg.ts` (`eskalationTag`, `fuehreKriegHandlungAus`), `sim/laender.ts`, `ui/militaer/Streitkraefte.tsx` (Zielraum als Komponente auch im Dossier), `test/krieg-abklingen.test.ts`.
- **Abnahme:** In einem frischen Spiel führt der Weg Krise → Kriegsziel → Drohkulisse → Beschluss nur über Knöpfe des Dossiers zum Krieg. Der Lauf `zypern-verlauf` erreicht die Drohkulisse.

### Schritt 2: Ende ohne Schleife (A3, B4)
- **Was:**
  - Bei Frontlage ≥ 96 kommt keine automatische Waffenruhe mehr. Stattdessen wird **„Kriegsziel erreicht“** gemeldet, und der Spieler wählt: Waffenruhe anbieten oder weiter vorstoßen. Das ist das Vic3-Muster M7.
  - Ein Gegner, der „erschöpft“ gemeldet wird, nimmt ein Paket an, das seiner Lage entspricht.
  - Die Erschöpfung des Gegners steht in der Waffenruhe nicht still.
  - Das Einfrieren behält die gehaltenen Regionen als „umstrittene Linie“, statt sie zu löschen; Vorbild ist Zypern 1974.
  - Der Rückhalt wird auf 100 gedeckelt.
- **Dateien:** `sim/krieg.ts` (`kriegWoche`, `waffenruheTag`, `paketAnnahme`, Texte `krieg.k.erschoepft*`), `sim/kriegsschauplatz.ts` (`besatzungNachFrieden` auch beim Einfrieren), `i18n/katalog/{de,en,tr}/krieg.json`.
- **Abnahme:** Im Zypern-Lauf gibt es Frieden ohne „Weiterkämpfen“-Schleife. Ein eingefrorener Krieg hinterlässt die Linie.

### Schritt 3: Kein Landkrieg ohne Grenze, Bündnisse mit Verstand (A5, B2, B3)
- **Was:**
  - Gegner ohne Schauplatz bekommen einen **Fernkonflikt**: nur Luft, Raketen, See und Stellvertreter, ohne Gebiet. Ausgang über Erschöpfung und Ziele wie Infrastruktur oder Blockade, Gefallene nach Einsatzart. Die Karte zeigt Schlagziele und Seegebiet.
  - Koalitionen: Ein Partner tritt nicht gegen einen engen Verbündeten an (Vertrauen oder Pakt mit dem Gegner, im Spiel schon als `dk-IRN-ISR` mit den USA an Israels Seite modelliert).
  - Bei einem Angriff der Türkei auf ein EU-Mitglied kommen statt Kampfeintritt Sanktionen und Exportstopps einzelner Staaten. Real 2019: 9 Staaten, kein EU-Embargo (`recherche_operationen.md` A3).
- **Dateien:** `sim/krieg.ts` (`kriegWoche`, Faktoren), `sim/kriegsschauplatz.ts` (Fernschauplatz), `sim/pakte.ts` (`bewerteAlle`, `koalitionenBeiKriegsbeginn`), `data/schauplaetze.ts`, `ui/atlas/kriegsfx.ts`.
- **Abnahme:** Der Israel-Fall des Inhabers, nachgespielt, hat keine Landfront und keine USA an der Seite der Türkei.

### Schritt 4: Belegte Regionen (C7, Grundlage für B1)
- **Was:** Jede Region der sechs Schauplätze bekommt eine belegte Fläche (km²), Einwohner mit Stichtag und eine Bevölkerungsgruppe, wo belegt. Dazu ein belegtes Polygon statt der Linse: Distrikte und Unterdistrikte aus HDX/OCHA bzw. Natural Earth Admin 1/2. Was fehlt, wird als Lücke markiert, nicht geschätzt. Siehe Abschnitt 6.
- **Dateien:** `data/schauplaetze.ts`, `src/data/schauplatz-flaechen.json`, `test/krieg-daten.test.ts` (Quellen-Pflichtfeld).
- **Abnahme:** Keine Region ohne Quelle oder ausdrückliche Lücke. Die Karte zeigt sich nicht überlappende Flächen.

### Schritt 5: Kalibrierung an echten Operationen (B1, B5)
- **Was:**
  - Die Front nimmt je Woche Fläche statt „eine Region“. Zielbänder aus `recherche_operationen.md`: Dauer 9 Tage bis 7 Monate, 2.000–4.820 km², 12–71 Gefallene je Bodenoperation, Zypern 1974 mit 568–1.500 Gefallenen für 36–37 %.
  - Der Gegnerwiderstand wächst mit der Tiefe; Städte und Berge zehren.
  - Märkte bekommen einen eigenen Moment „Sanktionsdrohung“: Lira, Börse und Erholung nach der Pause, belegt 2019.
  - Die Zustimmung bekommt einen kleinen, abklingenden Sammeleffekt (0 bis +4, 2–3 Monate) statt eines steigenden Rückhalts.
  - Operationskosten bleiben Spielparameter (Lücke: keine belegten Kosten, `recherche_operationen.md`).
- **Dateien:** `sim/krieg.ts` (`KRIEG`), `sim/kriegsschauplatz.ts` (`SCHAUPLATZ`, `regionenSetzen`), `sim/kriegspreis.ts` (`PREIS`, `REAKTION`), neuer Kalibriertest `test/krieg-kalibrierung.test.ts` mit dem Bot aus `test/w1/zypern-krieg.test.ts`.
- **Abnahme:** Die Bot-Läufe Syrien, Zypern und Irak liegen in den belegten Bändern.

### Schritt 6: Operationsform und Wendepunkte (B9; das Herz des neuen Krieges)
- **Was:**
  - Die vier Einsatzarten werden zu **Operationsformen** mit realem Vorbild und klarer Konsequenz:
    - Luft- und Drohnenschlag: rund 1 Woche, kein Gebiet (Klauenschwert).
    - Begrenzte Bodenoperation mit Verbündeten: Zone bis 30 km (Friedensquelle).
    - Großoffensive: Tiefe, Verluste, Weltreaktion.
    - Landung: nur Inseln und Zypern (Atilla).
  - Dazu 4–6 Wendepunkt-Ereignisse, je zwei bis drei Optionen mit echtem Tausch, ausgelöst von Lage und Zeit statt am Monatsersten:
    - Gegenstoß: Reserven oder Linie halten.
    - Massenverlust an einem Tag, Vorbild Balyun 2020 mit 33 Gefallenen: Vergeltung, Pause oder Konsultation nach NATO Art. 4.
    - Ziviltote: Untersuchung oder bestreiten.
    - Sanktionsdrohung: Pause mit Frist (120 h) annehmen.
    - Partner verlangt Halt.
    - Vertriebene an der Grenze.
  - Der Schreibtisch zeigt den laufenden Krieg mit der offenen Entscheidung.
- **Dateien:** `sim/ereignisse-krieg.ts`, `sim/krieg.ts`, `data/schauplaetze.ts` (`EINSATZ` → Operationsformen), `ui/krieg/Schauplatz.tsx`, `ui/schreibtisch/briefing.ts`, Kataloge in drei Sprachen.
- **Abnahme:** Ein Krieg von 2–3 Monaten hat 8–12 Entscheidungen, jede mit sichtbarem Preis. Kein Wendepunkt kommt zweimal im selben Krieg.

### Schritt 7: Friedenstisch mit Gebietsforderungen (C4; schließt „Welle 2“ aus `krieg-typen.ts:203`)
- **Was:**
  - `FriedensPaket.gebiet` wird zu einer Liste von Forderungen je Region: halten als Zone, Rückzug des Gegners um X km, gemeinsame Patrouillen, Rückkehr von Geflüchteten, Reparationen, Garantien.
  - Das Punktebudget kommt aus Kontrolle und Erschöpfung (HOI4-Muster M8 ohne Auktion). Jede Forderung hat einen Preis in Punkten und einen Innen- und Außenpreis.
  - Ein Vermittler legt ein eigenes Paket vor (USA oder Russland je nach Nähe; Vorbild Pence–Erdoğan 17.10.2019 und Sotschi 22.10.2019).
- **Dateien:** `sim/krieg-typen.ts`, `sim/krieg.ts` (`PAKETE`, `paketAnnahme`, `paketPreis`, `friedenSchliessen`), neue `ui/krieg/Friedenstisch.tsx`, Wiederverwendung des Verhandlungstischs `ui/welt/Verhandlungstisch.tsx` als Muster, Spielstand-Migration alter `angebotPaket`.
- **Abnahme:** Ein Sieg kann eine 30-km-Zone verlangen und bekommen, ohne Annexion. Der Innenpreis wird vorher gezeigt (`paketPreis`-Prinzip).

### Schritt 8: Besatzung als Verwaltung (C5, C8)
- **Was:** Fünf Formen mit belegtem Vorbild:
  - **Sicherheitszone mit Stellvertretern**: SNA, Nordsyrien bis 2024. Gering an Kosten, hoch an Menschenrechtsrisiko (HRW, UN-Untersuchungskommission).
  - **Zivilverwaltung über die Grenzprovinz**: Gouverneure von Hatay, Kilis, Gaziantep und Şanlıurfa; Lira, PTT, Schulen.
  - **Satellitenstaat**: TRNZ-Modell; Haushaltshilfe, Handel zu 87–96 % mit der Türkei, Pro-Kopf-Einkommen 45 % des Südens.
  - **Annexion** (Schritt 9).
  - **Rückgabe**.
  - Je Region gibt es Einwohner (aus Schritt 4), Widerstand, Rückkehr von Geflüchteten (real 640.000–700.120 Rückkehrer aus der Türkei seit 08.12.2024) und Kosten. Die Kosten bleiben Spielparameter, solange die syrischen Zonenkosten eine Lücke sind.
- **Dateien:** neues `sim/besatzung.ts` (aus `sim/kriegsschauplatz.ts:405–542` herausgelöst), `data/schauplaetze.ts` (`BESATZUNG`), `ui/krieg/Besatzung.tsx`, `sim/diplomatie.ts` (Flucht), Migration `spiel.besatzung`.
- **Abnahme:** Jede Form hat eine andere Kurve aus Kosten, Widerstand und Ansehen über drei Jahre. Eine Stellvertreterverwaltung kann einen Skandal auslösen.

### Schritt 9: Annexion mit Folgen (A4, C6)
- **Was:**
  - **Außen:** Die Annexion löst einen Vorgang mit Stufen aus. Erst UN-Sicherheitsrat (Veto der Partner möglich), dann Abstimmung in der Generalversammlung; die Stimmen werden aus den Beziehungen gerechnet, Vergleichswerte Krim 100:11:58 und Oblaste 2022 143:5:35.
  - Danach Sanktionen in Stufen nach dem Krim-Muster: März, Juli, September, Dezember 2014. Die Folgekosten liegen im IWF-Band (1–1,5 % sofort, bis 9 % mittelfristig) als Obergrenze für einen Großstaat. Für die Türkei bleibt die Skalierung ein Spielparameter.
  - **Innen:** **Eingliederungszeit** in Jahren nach dem Vic3-Muster M9. Danach wird die Region eine Provinz bzw. zählt zu einer Provinz: Einwohner, Steuern, Wahlberechtigte, Sitze erst nach einer Wahl. Die Haltung der Bevölkerung (Kerngebiet ja oder nein) bestimmt den Widerstand.
  - Hatay 1939 ist der einzige türkische Präzedenzfall. Er gelang mit Zustimmung Frankreichs (`recherche_besatzung.md` C.3), also gibt es den Weg „Annexion mit Zustimmung“ über einen Vertrag.
- **Dateien:** `sim/besatzung.ts`, `sim/diplomatie.ts` (Sanktionen), `sim/provinzen*` bzw. Provinzdaten (neue Plaka-Erweiterung oder Zuschlag zur Grenzprovinz; Entscheid des Inhabers nötig), `sim/wahl*` (Sitze), `ui/krieg/Besatzung.tsx`, `ui/atlas/*` (Grenze ziehen), Migration.
- **Dazu (A6):** Annektierte oder verwaltete Regionen bleiben in jedem späteren Vorgang türkisch. Ein Revanchekrieg zielt auf ihre Rückeroberung, nicht auf ihre zweite Eroberung. Ein vollständig annektierter Staat bekommt einen eigenen Zustand im Weltmodell: Exilregierung, Nichtanerkennung, Sanktionen. Machtwechsel und Angriffe wie bisher gibt es dann nicht mehr.
- **Abnahme:** Die Annexion von Asas verändert Einwohnerzahl, Haushalt und Außenlage messbar und belegt. Der Spieler sieht vor dem Klick die Folgen. Ein späterer Krieg mit Syrien beginnt mit Asas als türkischer Region.

### Schritt 10: Karte wie HOI4, ohne Einheiten zu schieben (C1, C2, C3)
- **Was:**
  - In 3D wird die Front als Linie entlang der Regionsgrenzen gezeichnet; genommene Flächen sind bündig.
  - Verbände als Marken mit Stärke: Heer, Luft, See, Verbündete.
  - Je Schauplatz eine **Luftlage-Ampel** (HOI4-Muster M4: rot, gelb, grün) und eine **Nachschubachse** mit Engpass. Bahn und Häfen werden im Frieden gebaut, im Krieg gibt es nur die Vorrangfrage (M5).
  - Das Kriegsziel wird auf der Karte durch Anklicken der Regionen gesetzt.
- **Dateien:** `ui/atlas/kriegsfx.ts`, `ui/atlas/AtlasMap.tsx`, `ui/atlas/Karte2D.tsx`, `sim/kriegsschauplatz.ts` (`kriegsKarte`), `sim/versorgung.ts`, `sim/infrastruktur*`.
- **Abnahme:** Bild aus der Mac-App-Größe (1440×900) mit sichtbarer Front, Luftlage und Marken. Gleiche Lage in 2D und 3D.

### Schritt 11: Innenpolitik des Krieges (B5, B7)
- **Was:**
  - **Vollmacht:** Für Syrien und Irak gilt eine stehende Vollmacht bis 30.10.2028 mit Verlängerungsabstimmung im Oktober. Neue Länder brauchen ein eigenes Mandat.
  - Ein gescheiterter Antrag kostet mehr als heute und sperrt (Vorbild 1. März 2003: 264 Ja bei 267 nötig).
  - Stimmen lassen sich mit Zusagen an Fraktionen holen; die Lager haben belegte Haltungen: CHP 2019 dafür, 2021 bis 2025 dagegen; HDP/DEM immer dagegen.
  - Art. 92 Abs. 2 nur in den Parlamentsferien.
  - Opposition und Presse: Festnahmen von Kritikern 2019 (über 120 online, mindestens 151 HDP-Mitglieder) als Option „Kritik unterdrücken“ mit Preis.
  - Reservisten (380.000, `recherche_operationen.md` D) fehlen bei Teil- und Vollmobilmachung am Arbeitsmarkt.
- **Dateien:** `sim/krieg.ts` (`beschlussAbstimmen`, `angriffAufTuerkei`), `sim/parlament*`, `sim/handeln.ts` (`stimmenSicht`), `sim/wirtschaft*`/`sim/economy.ts`, `data/` (Vollmacht).
- **Abnahme:** Im Stand des Inhabers beginnt ein Syrien-Einsatz ohne neue Abstimmung. Ein Zypern-Einsatz braucht eine, und die Opposition reagiert sichtbar.

### Schritt 12: Durchspielen und Abnahme
- **Was:**
  - Bot-Läufe für alle sechs Schauplätze plus den Fernkonflikt mit Israel, je mit Zwillingslauf ohne Krieg; Zielbänder aus der Recherche.
  - Ein Durchlauf im Browser mit Bildern jeder Phase.
  - Der Stand des Inhabers lädt; sein beendeter Israel-Krieg bleibt lesbar.
- **Dateien:** `test/krieg-kalibrierung.test.ts`, `e2e/krieg.spec.*`, `dokumentation/…`.

---

## 6. Was belegte Daten braucht

Nichts davon darf geschätzt werden. Fehlt eine Quelle, bleibt das Feld eine Lücke, und die Mechanik nutzt einen benannten Spielparameter.

| Bereich | Was | Quellenhinweis | Stand |
|---|---|---|---|
| Regionen Syrien | Fläche und Einwohner je Unterdistrikt (Asas, Afrin, al-Bab, Manbidsch, Tal Abyad, Ras al-Ain, Qamischli, Hasaka, Rakka, Tabqa, Idlib, Aleppo-Stadt, Deir ez-Zor) | OCHA Syria HNO und HDX „Syrian Arab Republic – Subnational Population Statistics“; Zensus 2004 (Bevölkerung der Unterdistrikte, s. `recherche_operationen.md` A3); CCCM/IOM für Vertriebene | Lücke, in `recherche_operationen.md` nur Teilwerte |
| Türkisch kontrollierte Zonen | 1,4 Mio. Einwohner; Afrin 442.000, davon 285.550 Vertriebene von anderswo | HRW 29.02.2024; ACAPS via HRW Dez. 2020 (`recherche_besatzung.md`) | belegt |
| Regionen Nordirak | Einwohner der Gouvernements Dohuk, Ninive, Erbil, Kirkuk, Sulaimaniya | Iraq CSO / Kurdistan Region Statistics Office; IOM DTM | Lücke |
| Regionen Ägäis/Thrakien | Einwohner Lesbos, Chios, Kos, Rhodos, Evros, Rhodope, Xanthi, Kavala, Thessaloniki | ELSTAT Zensus 2021 | Lücke |
| Zypern | Einwohner der Bezirke Nikosia, Larnaka, Limassol, Paphos; TRNZ 383.000–590.000 | CYSTAT Zensus 2021; KKTC İstatistik Kurumu (`recherche_besatzung.md` B) | Süden Lücke, Norden Band belegt |
| Armenien | Einwohner Schirak, Sjunik, Wajoz Dsor, Ararat, Eriwan | Armstat Zensus 2022 | Lücke |
| Nordwestiran | Einwohner West-/Ost-Aserbaidschan, Ardabil, Sandschan | Statistical Centre of Iran, Zensus 2016 | Lücke |
| Polygone | Verwaltungsgrenzen Ebene 1/2 | Natural Earth Admin 1 (gemeinfrei), HDX COD-AB (OCHA), geoBoundaries (CC BY 4.0) | vorhanden: nur Linsen |
| Operationen | Dauer, Fläche, Kräfte, Verluste, Vertriebene, Märkte, Umfragen, Waffenpausen | `recherche_operationen.md` A1–A7, B, Tabelle „Zahlen fürs Spiel“ | belegt mit Bändern; Kosten und Tourismus Lücke |
| Verfassung und Mandat | Art. 92, 104, 117, 118; Vollmachten 2003–2025 | mevzuat.gov.tr; Bianet, Milliyet (`recherche_operationen.md` C) | belegt; Stimmen 2019/21/25 Lücke |
| Truppen | Aktive 355.000–481.000, Gendarmerie 198.000, Reserve 380.000, 4 Armeen, TB2 > 200, Akıncı ≥ 18 | `recherche_operationen.md` D; IISS Military Balance (Bezahlschranke, Lücke) | Band belegt |
| Gegnerbestand | Ausgaben und Aktive je Gegner | SIPRI, schon in `data/kraefte.ts`; Reserven der Gegner (etwa Israel) fehlen: **Lücke**, Quelle IISS Military Balance | teils |
| Völkerrecht | UN-Charta Art. 2 Abs. 4 und 51; HLKO Art. 42–56; GA IV Art. 47–49; UN-SR 541/550 (je 13:1:1); UN-GV 68/262 (100:11:58), ES-11/4 (143:5:35); Garantievertrag 1960; Adana-Abkommen 1998 (im Sotschi-Memorandum bekräftigt) | `recherche_besatzung.md` C.4; `recherche_operationen.md` A3, B | belegt |
| Sanktionen | 2019: EO 13894 (14.–23.10.), Exportstopps von 9 EU-Staaten; CAATSA Dez. 2020 (S-400); US-Embargo 1975–78; Krim-Stufen 2014 | `recherche_operationen.md` A3, A8, B; `recherche_besatzung.md` C.1 | belegt |
| Besatzungskosten | Ausgaben der Türkei für die syrischen Zonen; TRNZ-Hilfe heute | — | **Lücke** (TRNZ 2010: 32,6 % des Haushalts) |
| Rückkehr | 640.000 (UNHCR, 30.04.2026) bis 700.120 (Göç İdaresi, 27.06.2026) seit 08.12.2024 | `recherche_besatzung.md` A.5 | belegt |

---

## 7. Rechercheliste mit Quellen (Auswahl; vollständig in den drei Dateien)

**Operationen und Recht** (`recherche_operationen.md`):
- UN-Brief S/2019/804 (Art. 51, Friedensquelle): https://digitallibrary.un.org/record/3830966
- Gemeinsame Erklärung USA–Türkei 17.10.2019 (120 h): https://www.aljazeera.com/news/2019/10/full-text-turkey-statement-northeast-syria-191017191203481.html
- Sotschi-Memorandum 22.10.2019: https://www.iletisim.gov.tr/english/haberler/detay/memorandum-of-understanding-between-turkey-and-the-russian-federation
- EU-Ratsschlussfolgerungen 14.10.2019 (ST 13090/19): https://data.consilium.europa.eu/doc/document/ST-13090-2019-INIT/en/pdf
- US-Finanzministerium, Sanktionen nach EO 13894: https://home.treasury.gov/news/press-releases/sm792
- CRS IN11185: https://www.everycrsreport.com/files/20191023_IN11185_17cce64c9a41e02687f622e9e96a70629137a592.pdf
- Verfassung (Art. 92, 104, 117, 118): https://www.mevzuat.gov.tr/MevzuatMetin/1.5.2709.pdf
- Vollmacht 2023, 357:164: https://bianet.org/haber/tsk-irak-ve-suriye-topraklarinda-kalmaya-devam-edecek-286495
- Vollmacht 2025 bis 2028: https://www.milliyet.com.tr/gundem/son-dakika-irak-suriye-tezkeresi-meclisten-gecti-tsknin-gorev-suresi-3-yil-uzatildi-7468544
- 1. März 2003: https://tr.wikipedia.org/wiki/1_Mart_tezkeresi

**Besatzung und Annexion** (`recherche_besatzung.md`):
- HRW-Bericht zu Nordsyrien vom 29.02.2024 (Verwaltung, SNA, Standorte).
- UN-Untersuchungskommission zu Syrien.
- UN-SR 541 und 550.
- EGMR Loizidou (1996/1998) und Zypern gegen Türkei (2014, 90 Mio. €).
- Annan-Plan 2004.
- UN-GV 68/262 und ES-11/4.
- IWF Country Report 15/211 (Kosten der Sanktionen gegen Russland).
- KKTC İstatistik Kurumu; IWF WEO.
- UNHCR und Göç İdaresi (Rückkehr).

Die URLs stehen je Befund in der Datei.

**Spielvorbilder** (`recherche_vorbilder.md`):
- HOI4: https://hoi4.paradoxwikis.com/War_goal, …/Peace_conference, …/Occupation, …/Supply, …/La_R%C3%A9sistance
- Victoria 3: https://vic3.paradoxwikis.com/Patch_1.15
- Civ 6: https://www.civilopedia.net/en-US/gathering-storm/concepts/combat_3/
- Hersteller von Suzerain und Rizia: https://www.torporgames.com/press-releases
- Dort stehen auch sieben Korrekturen am Projektbestand: Widerstand kam in HOI4 mit La Résistance; Victoria 3 hat seit 1.15 keine automatische Kapitulation mehr; Civ-6-Kriegsmüdigkeit wiegt im Ausland schwerer.

**Recherchelücken, die vor dem Bau der Schritte 4, 5, 8 und 9 zu schließen sind:**
- Bevölkerung und Fläche je Region für alle sechs Schauplätze.
- Kosten der Operationen und der syrischen Zonen (Sayıştay, Haushaltsnachträge).
- Tourismuseffekt 2019.
- IISS-Eintrag Türkei.
- Stimmenzahlen der Vollmachten 2019, 2021 und 2025.
- Aktuelle TRNZ-Hilfsprotokolle.
- Israels Reserve.

---

## 8. Bilder

| Datei | Zeigt |
|---|---|
| `bilder/w1-02-israel-konflikt.png` | Israel im Stand des Inhabers nach dem Krieg: kein Reiter „Konflikt“, keine Besatzung, keine Bilanz des Krieges; nur das Protokoll erinnert an ihn |
| `bilder/w1-10-frisch-start.png` | Frisches Spiel (Juni 2028), Ausgangslage |
| `bilder/w1-20-zypern-ziel-erklaert.png` | Kriegsziel „Schutz“ erklärt, Eskalation 83; drei Wochen später ist sie verflogen (Abschnitt 1.3) |
| `bilder/w1-03-griechenland-vorher.png` | Griechenland, Konflikt 62: kein Reiter „Konflikt“, kein Weg zur Krise |
| `bilder/w1-11-zypern-ueberblick.png`, `w1-12-zypern-gesten.png`, `w1-13-zypern-druck.png` | Der einzige Einstieg: Gesten › Druck |
| `bilder/w1-15-aussen-banner.png` | Banner „Spannung mit Zypern: zur Akte“ |
| `bilder/w1-16-zypern-spannung.png`, `w1-17-zypern-spannung-unten.png` | Dossier in der Spannung: Leiter, Verlauf, Kriegsziele, Kriegspreis, Schauplatz |
| `bilder/w1-18-sicherheit.png`, `w1-19-zielraum-ganz-zypern.png` | Zielräume nur unter Sicherheit |
| `bilder/w1-30-syrien-mitte-akte.png`, `-akte2.png` | Woche 3 in Nordsyrien: vier Knöpfe, Regionenkette, Einsatzart |
| `bilder/w1-30-syrien-mitte-karte.png` | 2D-Karte: Kreise, Frontlinie, Marken |
| `bilder/w1-31-syrien-mitte-3d-karte.png`, `-karte-nah.png` | 3D-Karte: Regionsflächen, Pfeil, keine Frontlinie |
| `bilder/w1-32-syrien-waffenruhe-*.png` | Waffenruhe: alle 9 Regionen genommen, Pakete |
| `bilder/w1-33-syrien-annexion-*.png` | Nach Frieden und erster Annexion: Besatzungsblock |
| `bilder/w1-34-zypern-mitte-*.png`, `w1-35-zypern-waffenruhe-*.png`, `w1-36-zypern-annexion-*.png` | Zypern-Krieg und Annexion |

(Läuft ein 3D-Bild nicht durch, steht es in der Liste unten unter „fehlt“.)
