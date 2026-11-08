# A5 Die Karte: Ist-Zustand, Ursachen, Ziel und Umbauplan

Stand 07.11.2026, Arbeitskopie `welle/a5/wt` auf b0ce3f3, Port 5235. Gespielt mit dem Spielstand des Inhabers (`spielstand/s2043.json`, 3. August 2043) und einem frischen Spiel. Diese Arbeit ist eine Analyse mit Umbauplan. Code im Projekt ist nicht geändert.

Der Inhaber am 06.11.: „Auch die Karte bringt nichts … völlig sinnlos momentan.“ Und: „Die Karte hat keinen Mehrwert.“

---

## 0. Kurzfassung

**Entscheidung:** Die Karte wird **kein Dauerwerkzeug und keine Dauerkulisse**. Sie wird ein Werkzeug **genau im Moment einer Ortsentscheidung**: Wo baue ich, wo setze ich eine Maßnahme ein, wohin reise ich im Wahlkampf, wo helfe ich nach einem Beben, welches Gebiet fordere ich im Krieg. Im Leerlauf tritt sie zurück: weniger Linsen, keine festen Zahlen auf 81 Bannern, keine Angaben aus dem Jahr 2024. „Kein Mehrwert“ heißt hier beides: weniger Karte im Leerlauf, mehr Karte im Moment des Ortes.

**Die fünf wichtigsten Befunde:**

1. **Auf der großen Karte kann man nichts entscheiden.** Jeder Klick führt in eine Akte. Die Provinzkarte zeigt rund 20 Zahlen und hat einen Knopf („Hier bauen oder fördern …“). Er öffnet Politik › Wirkungsnetz mit der ersten Infrastrukturmaßnahme (Autobahn) und der Provinz vorgewählt, gleich was dort fehlt, und die Akte deckt die Karte zu (`ui/ProvinceCard.tsx:182`, `ui/Stage.tsx:1227–1231`, Bild `inh-06-hier-bauen.png`). Die einzige Handlung direkt an der großen Karte ist die Linse „Versorgungswege“ (`ui/gueter/TransportKarte.tsx:55`).
2. **Wo die Karte ein Werkzeug ist, wird sie genutzt, aber es ist nicht die große Karte.** Die Kleinkarte in Land › Netze färbt nach Auslastung, ein Klick wählt die Provinz, daneben stehen Wirkung, Preis und „Bauen“ (`ui/infrastruktur/Netze.tsx:53–67, 154`). Von den 7 regionalen Bauvorhaben im Spielstand des Inhabers kamen 6 von dort (`infra_netz_*@34/15/33/27`). Die Akten haben fünf eigene Kleinkarten gebaut, weil die große Karte unter der Akte verschwindet.
3. **Die Akte verdeckt die Karte fast immer.** In allen 8 gemessenen Bereichen bleiben bei 1440×900 nur **25 %** der Bildfläche frei (`ui/styles.css:361`, Liste der breiten Akten in `ui/Stage.tsx:931`). Auch Land, Außen und Sicherheit sind breit, obwohl W 3 dort ein Seitenfenster neben der Karte festlegt.
4. **Die Karte zeigt 2043 Daten von 2024 und eine falsche Wahl.** Die 81 Banner tragen Einwohnerzahl und Bürgermeisterpartei von 2024 (`ui/atlas/staedte.ts:122, 144`). Im Spiel hält das Lager des Inhabers aber seit der Kommunalwahl 2034 alle 81 Rathäuser. Die Provinzkarte nennt für İstanbul „Rathaus seit 2024: CHP“. Die Wahllinse heißt „Wahlausgang 2028 · Stand zum Amtsantritt“, zeigt aber die Sitze von 2038 (`ui/ebenen.ts:71`). 6 von 15 Linsen ändern sich im ganzen Spiel nie.
5. **Linsen beantworten nicht „Wo soll ich handeln?“.** 15 Linsen, aber keine öffnet sich im Moment einer Handlung (Civ VI, Tropico, HOI4 tun genau das). Die Linse „Lage der Regionen“ war im Spielstand ganz rot: 8 Netze überlastet, jede Provinz über 100 %. Eine Fläche ohne Unterschied sagt nicht, wo.

**Skripte:** `karte-rundgang.cjs`, `karte-rundgang-neu.cjs` und `akten-karten.cjs`/`akten-karten2.cjs` im selben Ordner; Protokolle in `lauf-*.json`.

**Schrittplan (je ein Agent und ein Tag):** K1 Ortswahl auf der großen Karte · K2 Politik, Bau und Restaurierung daran anschließen · K3 Provinzkarte wird Handlungskarte · K4 Linsen von 15 auf 6 und situative Linsen · K5 Wahlkarte · K6 Katastrophenkarte · K7 Wirkung sichtbar, Altdaten raus · K8 Schnittstelle für die Kriegskarte (W1) · K9 Abnahme. Einzelheiten in Abschnitt 7.

---

## 1. Ist-Zustand

### 1.1 Was die Karte zeigt

Bild `bilder/inh-01-karte.png` (Spielstand des Inhabers, Linse „Politisch“):
- Gelände, Meere, Nachbarländer, 81 Stadtbanner mit Einwohnerzahl in Millionen und einem Farbstreifen der Bürgermeisterpartei.
- Marken für offene Ereignisse mit Ort (`ui/Stage.tsx:355–367`), Bauvorhaben, Wunder und Stätten (`ui/atlas/marken.ts`).
- Flaggen der Nachbarn mit Beziehungston (`ui/Stage.tsx:380–390`).
- Unten links der Linsenknopf, unten rechts „Marken auf der Karte“, „Effekte“ und das Schild „Türkei · 81 Provinzen · Stand 2043“.

### 1.2 Was man auf der Karte tun kann

| Klick auf | Ergebnis | Spielhandlung direkt auf der Karte? |
|---|---|---|
| Provinz oder Stadt | Provinzkarte rechts (Bilder `inh-04-provinz-34.png`, `inh-05-provinz-34-unten.png`, Hatay `inh-04-provinz-31.png`) | nein: rund 20 Werte, 1 Knopf in die Politik-Akte |
| Ereignismarke | öffnet das Ereignis | nein, Entscheidung im Ereignisfenster |
| Bau-, Wunder-, Erbe-Marke | öffnet die Land-Akte (`ui/Stage.tsx:845–853`) | nein |
| Flagge eines Landes | kleine Länderkarte mit Wegen zum Verhandlungstisch (`ui/welt/LandPopover.tsx:159–162`) | nein, aber guter Einstieg in einen stark genutzten Bereich |
| Route in „Versorgungswege“ | Tafel mit Reparatur, Umleitung, Luftbrücke, Depot (`ui/gueter/TransportKarte.tsx:55`) | **ja, als einzige Stelle** |

**Provinzkarte im Einzelnen** (`ui/ProvinceCard.tsx`):

| Abschnitt | Beispiel İstanbul 2043 | Zustand |
|---|---|---|
| Kopf | Nr. 34, Marmara, Typ | fest |
| Einwohner, Wirtschaftskraft, Arbeitslosigkeit | 15.754.053; 802.669 ₺; 7,1 % (geschätzt) | fest, Stand 2024 |
| Rathaus seit 2024 | CHP (Hatay: AKP) | **falsch**: im Spiel hält PW alle 81 Rathäuser seit 2034 |
| Abgeordnete | 98 | fest |
| Infrastruktur (OSM) | 27.335 km Straße, 278 km Bahn, 409 Kliniken, 4 Flughäfen, 27 Kraftwerke | fest, ändert sich durch Bau nicht |
| Lage im Spiel | fünf Balken (Straßen 50, Gesundheit 82 …) | lebt |
| Sitze je Partei | AKP 31, PW 29, YENİ 25, CHP 13 | lebt (nach Wahlen) |
| Knopf | „Hier bauen oder fördern …“ | öffnet Politik › Wirkungsnetz, Thema Infrastruktur, Autobahnbau, Provinz vorgewählt |

Von rund 20 Werten bewegen sich 9 im Spiel. Es gibt eine Handlung, und sie führt aus der Karte heraus.

### 1.3 Die 15 Linsen

Bild `bilder/inh-02-linsen.png` und je Linse `bilder/inh-03-linse-*.png`. Definition `ui/ebenen.ts:50–66`, Färbung `ui/ebenen.ts:153–380`.

| Linse | Datenquelle | Ändert sich im Spiel? | Bereitet sie eine Entscheidung vor? |
|---|---|---|---|
| Politisch | – | – | nein (Grundansicht) |
| Regionen | feste Zuordnung | **nie** | nein |
| Wahlausgang „2028“ | Sitze je Provinz | nur am Wahltag; Name bleibt „2028“ (`ebenen.ts:71`) | kaum: zeigt nur die stärkste Partei, keinen Abstand |
| Rückhalt | Vertrauen je Provinz + Lagersitze | ja | ja, aber ohne Handlung daneben |
| Wirtschaftskraft | BIP je Kopf 2024 (`ebenen.ts:268–281`, `p.bipProKopf`) | **nie** (Bild `inh-03-linse-5.png`: „188 bis 803 Tsd. ₺“ im Jahr 2043) | nein |
| Arbeitslosigkeit | Netzwert | ja | schwach |
| Infrastruktur | OSM-Straßendichte (`ebenen.ts:316–330`) | **nie**, auch nicht nach Autobahnbau | nein |
| Ressourcen | Vorkommen (`gueter/linsen.ts`, ohne Spielstand) | **nie** | nein |
| Belastung | Auslastung der Netze | ja | ja: hier ist ein Netz voll; der Bau steht aber in der Akte |
| Versorgungswege | Routen, Depots | ja | **ja, mit Handlung** |
| Akute Probleme | Probleme über der Schwelle | ja | ja, aber ohne Handlung daneben |
| Katastrophenrisiko | Erdbeben 1–5 (`data/katastrophe_risiko.json`) | **nie** | schwach (Vorsorge ist landesweit) |
| Kulturerbe | Zustand der Stätten | ja | ja (Restaurierung) |
| Beziehungen | Vertrauen der Länder | ja | ja (Klick öffnet Länderkarte) |
| Strategische Orte | feste Liste | **nie** | nein |

6 von 15 Linsen ändern sich nie (Regionen, Wirtschaftskraft, Infrastruktur, Ressourcen, Katastrophenrisiko, Strategische Orte). Keine Linse öffnet sich von selbst, wenn eine Handlung einen Ort braucht. Geplant, aber nie gebaut: „Front und Besatzung“, „Bündnisse“, „Wahlkampf“, „Lage nach Beben“ (`ui/ebenen.ts:23–25`, `ui/linsen/linsen.ts:10–13`).

### 1.4 Wie viel Karte man beim Spielen sieht

Gemessen mit `akten-karten.cjs` (Ergebnis `lauf-akten.json`), 1440×900:

| Akte | Breite | Freie Kartenfläche |
|---|---|---|
| Schreibtisch, Politik, Land, Land › Regionen, Gesellschaft, Außen, Sicherheit | 1198 px | **25 %** |

Bilder `inh-10-akte-schreibtisch.png`, `inh-10-akte-politik.png`, `inh-10-akte-land.png`, `inh-10-akte-aussen.png`, `inh-10-akte-sicherheit.png`. Die freien 25 % sind die linke Leiste und ein Rand. Wer spielt, sieht die Karte praktisch nur zwischen zwei Akten.

### 1.4a Frisches Spiel (5. Juni 2028)

Bilder `neu-01-karte.png` bis `neu-10-akte-*.png`. Dieselben Befunde, nur noch ohne veraltete Daten, weil 2028 die Werte von 2024 noch fast passen.
- Die Kopfleiste meldet „10 akute Probleme“. Die Linse „Akute Probleme“ färbt fast das ganze Land rot, den Südosten am dunkelsten (`neu-03-linse-0.png`). Hier stellt die Karte die richtige Frage („wo brennt es?“). Ein Klick auf eine Provinz bietet aber keine Maßnahme gegen diese Probleme an. Er führt wie überall zum Autobahnbau (`neu-06-hier-bauen.png`).
- Die Wahllinse heißt am Spielbeginn zu Recht „Wahlausgang 2028“.
- Die Akten verdecken auch hier 75 % der Karte.

### 1.5 Die Kleinkarten in den Akten

Weil die große Karte verdeckt ist, haben die Akten eigene Karten gebaut:

| Ort | Datei | Klickbar? | Genutzt? |
|---|---|---|---|
| Land › Netze | `ui/infrastruktur/Netze.tsx:53–67` | **ja**: Klick wählt Provinz, daneben „Bahnstrecke ertüchtigen 140 % → 118 %, 2,1 Kapital, 28 Monate, Bauen“ | **ja: 6 der 7 regionalen Bauten des Inhabers** |
| Land › Lage der Regionen | `ui/reich/RegionenLage.tsx:111–116` (eigene Linsenknöpfe Netze, Erbe, Erdbebenrisiko, Baustellen) | ja | Bild `inh-10-akte-land-regionen.png`: ganz rot, keine Unterscheidung |
| Kultur › Stätten | `ui/reich/Staetten.tsx:110` | Punkte | – |
| Katastrophen › Lage | `ui/katastrophe/Lage.tsx:184` | nein | – |
| Wahlkampf | `ui/Wahlkampf.tsx:169` (`AtlasMap interactive={false}`), Reiseziel per Auswahlliste `:173` | **nein**: Bild der Karte, gewählt wird in einer Liste mit 81 Einträgen | – |

Das Muster von Land › Netze ist das beste Stück Karte im Spiel (Bild `inh-10-akte-land-netze.png`). Es folgt dem Prinzip, das alle Vergleichsspiele teilen (Abschnitt 3): eine Frage, eine Färbung nach Bedarf, ein Klick wählt den Ort, daneben Wirkung, Preis und Knopf.

---

## 2. Rolle der Karte in den stark genutzten Bereichen

Zahlen aus dem Spielstand des Inhabers (Auswertung mit Python über `s2043.json`).

| Bereich | Ortsentscheidung des Inhabers in 15 Jahren | Wo heute gewählt | Rolle der großen Karte heute | Rolle, die sie haben müsste |
|---|---|---|---|---|
| Maßnahmen je Region | 7 Maßnahmen regional gestellt (Kernkraft in 6 Provinzen, Mietdeckel 7, Baukredite 7, Rückkehr 5, Integration 4, Autobahnen, heimische Kohle) | Auswahlleiste `ui/OrtWahl.tsx` (Region, Provinzliste, „wo es akut ist“) | keine | Ort auf der Karte wählen; Färbung „hier akut“ aus `akuteOrte` (`sim/handeln.ts:933`); Preis lebt mit dem Umfang (`umfangFaktor`, `sim/handeln.ts:175`) |
| Bau und Land | 7 regionale Vorhaben, davon 6 aus der Kleinkarte Netze; 14 Restaurierungen laufen | Kleinkarte Netze; Liste | Kranmarke, Klick öffnet Akte | Netze-Muster auf der großen Karte |
| Katastrophen | 17 Fälle (5 Fluten, 4 Brände, 4 Beben, 4 Dürren), 76.690 Tote im Spiel; alle 5 Erdbeben-Programme durchlaufen | Ereignisfenster, Akte | Kamera fliegt hin, Ring, Zittern (`ui/Stage.tsx:641–651`) | Lagekarte des Falls mit Hilfsstand je Provinz (`hilfsStand`, `sim/katastrophe.ts:755`); Vorsorge dort, wo Gefahr × Einwohner hoch ist |
| Kommunalwahl | 3 Wahlen; 2034 gewann das Lager alle 81 Rathäuser | läuft von selbst; Zwangsverwalter in einer Liste (`ui/gesellschaft/GesellschaftAkte.tsx:316–360`), nie genutzt | Banner zeigen die Bürgermeister von 2024 | Wahlnacht auf der Karte: gewonnene und verlorene Rathäuser (`gewonnen`, `verloren`, `sim/kommunen.ts:173`); Banner aus dem Spielstand |
| Wahlkampf | Reisen vor drei Wahlen | Auswahlliste mit 81 Provinzen | keine | Linse „Wahlkampf“: wo eine Reise die meisten Sitze bewegt (`reiseVorschau`, `sim/wahlkampf.ts:261`), Klick = Reise |
| Krieg | 1 Krieg gegen Israel ohne Schauplatz | Akte | nichts: `kriegsKarte` liefert `null` (W1, `sim/kriegsschauplatz.ts:619, 672`) | Zielgebiet und Front auf der Karte (W1 Schritt 10), über dieselbe Ortswahl |
| Verträge | 18 laufend | Verhandlungstisch | Flagge → Länderkarte → Tisch | so lassen, gut |
| Ereignisse | über 900 entschieden | Schreibtisch | Marke und Kamerafahrt, wenn ein Ort dabei ist | so lassen; nach der Entscheidung zeigt die Karte die Folge am Ort |

**Folgerung:** Ortsentscheidungen gibt es (rund 14 regionale Maßnahmen und Bauten, 14 Restaurierungen, Reisen, 17 Katastrophen), und der Inhaber trifft sie. Er trifft sie in Listen und in einer Kleinkarte, nie auf der großen Karte.

---

## 3. Wie vergleichbare Spiele ihre Karte nutzen

Recherche mit Quellen in Abschnitt 9. Als Prinzip, nicht als Kopie.

| Spiel | Handlung auf der Karte | Linse, die eine Entscheidung vorbereitet | Lehre |
|---|---|---|---|
| **Democracy 4** | keine; **es gibt keine Karte**, sondern ein Wirkungsnetz, Symbolgröße zeigt den Zustand (gamepretty, positech) | – | Ohne Ortsentscheidung braucht ein erfolgreiches Politikspiel keine Karte |
| **Civilization VI** | Bezirk auf ein Feld setzen, Einheiten ziehen | Bezirkslinse **erscheint von selbst** beim Bau, zeigt gültige Felder und Nachbarschaftsboni; Religionslinse beim Wählen eines Missionars (civilopedia world_7) | Was gebaut wird, entscheidet das Menü; wo, entscheidet die Karte |
| **Hearts of Iron IV** | Front- und Angriffslinien zeichnen; Fabrikbau per Klick auf den Staat | Versorgungsmodus: gelb/rot heißt „hier zu wenig Nachschub“; Luftmodus öffnet sich beim Wählen eines Stützpunkts (HOI4-Wiki) | Farbe sagt „hier geht es / hier nicht“ |
| **Victoria 3** | „pick an action, then pick a target“; Krieg nur als Zuweisung von Generälen zu Fronten | jede Linse hat ihren Kartenmodus; Farben Grün (möglich), Orange (erfüllt), Blau (läuft), Rot (gerade nicht zulässig), Weiß (nicht zulässig) (Dev Diary 29/30, Vic3-Wiki) | Karte und Liste sind zwei Ansichten derselben Daten |
| **Europa Universalis IV** | Provinzentwicklung per Klick | rund 50 Modi; nur wenige nennen eine Entscheidung (Koalition, Kriegsgrund, Handel, Bauplätze) (EU4-Wiki) | Viele Linsen ohne Entscheidung sind Ballast |
| **Suzerain** | Grundspiel keine: Karte auf dem Schreibtisch, Ereignis-Symbole über dem Ort, entschieden wird im Text; erst im Krieg (Rizia) Einsätze auf der Karte (TheSixthAxis, Steam) | – | Karte als Ort der Ereignisse; Werkzeug nur im Krieg |
| **Tropico 6** | Gebäude setzen | das passende Overlay öffnet sich beim Setzen (Polizei → Sicherheit); ein falsches Overlay wurde als Fehler behoben (Kalypso-Patch) | Die Linse muss genau das zeigen, worauf die Handlung wirkt |

**Abgeleitete Regeln für Staatsräson:**
1. Eine Linse lohnt sich nur, wenn sie „Wo soll ich handeln?“ beantwortet, und sie erscheint im Moment der Handlung von selbst.
2. Auf der Karte wird der Ort gewählt, im Seitenfenster das Wie und Wie-viel.
3. Die Farbe sagt „lohnt sich / möglich / nicht möglich“, nicht nur eine Rohzahl.
4. Karte und Akte zeigen dieselben Daten und springen zueinander. Kein Wert steht nur auf der Karte.
5. Ereignisse und Folgen eigener Entscheidungen bekommen einen Ort.
6. Wo keine Entscheidung am Ort hängt, tritt die Karte zurück (Democracy 4, Suzerain).

---

## 4. Welche Daten je Provinz belegt sind und was schon im Spiel liegt

| Datum | Belegte Quelle (Abschnitt 9) | Im Spiel? | Taugt als Linse für … |
|---|---|---|---|
| Einwohner je Provinz | TÜİK ADNKS 2024 | ja (`data/provinzdaten.json`) | Gewicht, nicht als eigene Linse |
| BIP je Kopf | TÜİK İl Bazında GSYH 2024 | ja, fest | nein (ändert sich im Spiel nicht) |
| Arbeitslosigkeit | TÜİK İşgücü 2024 **je Provinz** (Hakkari 18,3 %, Burdur und Kastamonu 4,0 %) | 17 belegt, Rest geschätzt (`provinzdaten.json`, Feld `arbeitslosigkeitHerkunft`) | Beschäftigungsprogramme; Daten nachziehen |
| Stimmen 2023 je Provinz | YSK, acikveri.ysk.gov.tr | ja (`stimmen2023`, genutzt in `sim/lokale-anteile.ts`) | **Wahlkampf** (Abstand × Sitze) |
| Sitze je Wahlkreis | YSK `getMilletvekiliSayisi`: 87 Wahlkreise, 600 Sitze (Bayburt 1, İstanbul 35 + 25 + 36) | ja (`sitze`) | Wahlkampf |
| Bürgermeister 2024 | YSK Kommunalwahl 31.03.2024 | ja, nur als Startwert; Spielstand in `gesellschaft.kommunen.rathaus` | Rathauskarte, aus dem Spielstand |
| SEGE-2025, Stufen 1–6 | Industrieministerium, Oktober 2025 (8/13/17/11/15/17 Provinzen) | nur in `kalibrierung/provinz_profile.csv` (`sege_kademe`), nicht im Spiel | Förderregion, s. Frage F2 |
| Förderregionen 1–6 | Präsidialbeschluss Nr. 9903, Resmî Gazete 30.05.2025, Anhang EK-2; deckungsgleich mit SEGE-2025 | nein | wo Ansiedlungsförderung wirkt (Frage F2) |
| Erdbebengefährdung | AFAD TDTH 2018, nur je Koordinate, kein freier Massenabruf | eigene Stufe 1–5 (`data/katastrophe_risiko.json`, „grob an den Bruchzonen der GEM Global Active Faults“) | Vorsorge-Linse; Stufe bleibt Spielparameter |
| Schäden 6. Februar 2023 je Provinz | SBB-Bericht 2023, Tab. 20 (11 Provinzen; z. B. Hatay 215.255 Wohnungen) | nein | Kalibrierung der Bebenschäden |
| Klinikbetten je Provinz | Gesundheitsministerium, Jahrbuch 2024, Tab. 7.20 | nein (OSM-Zählung in `provinz_infra.json`) | Katastrophe, Gesundheit |
| Syrer unter Schutz je Provinz | Migrationsbehörde, Stand 29.10.2026 (Kilis 22,07 %) | nur grob über Netz | Rückkehr- und Integrationsmaßnahme |
| Stromverbrauch je Provinz | EPDK 2025, Excel | nein | Netzausbau |
| Flut, Waldbrand, Bahn je Provinz | **nicht belegt** in Provinzauflösung | – | keine eigene Linse |

---

## 5. Ursachen mit Zahlen

| Mögliche Ursache | Befund | Beleg |
|---|---|---|
| Wird nicht gefunden | Gefunden schon, sie liegt immer da. Aber beim Spielen sind 75 % von ihr verdeckt | 1.4; `ui/styles.css:361` |
| Unklar, was sie bringt | 15 Linsen, 6 davon fest; keine sagt „hier handeln“ | 1.3 |
| Wirkung zu klein oder unsichtbar | Eigene Bauten ändern die Linse „Infrastruktur“ nicht, Kommunalwahlen ändern die Banner nicht | `ebenen.ts:316`, `staedte.ts:122` |
| Zu viel Text | Provinzkarte rund 20 Werte, 1 Handlung | `ProvinceCard.tsx` |
| Zu viele Klicks | Nicht der Kern. Von der Karte aus sind es zwei Klicks bis zu einer Maßnahme mit vorgewählter Provinz (Bild `inh-06-hier-bauen.png`). Aber es ist immer der Autobahnbau, nicht das, was in der Provinz akut ist, und danach ist die Karte weg. Über die Akte: Politik → Thema → Maßnahme → Ortswahl → Liste mit 81 Provinzen | `ui/OrtWahl.tsx`, `ui/Stage.tsx:1227–1231` |
| Meldet sich nie | Es gibt drei Sprünge in eine Linse: Problemkarte aus Vorlagen und Meldungsleiste, Versorgungswege vom Schreibtisch (`ui/Stage.tsx:785–788, 820–829, 917`). Keiner kommt im Moment einer Ortswahl, und danach liegt die Akte wieder über der Karte | 1.3 |
| Nicht nötig zum Gewinnen | Stimmt heute: Jede Ortsentscheidung geht auch ohne Karte. Der Preis einer Maßnahme in einer Provinz ist 20 bis 23 % des Landespreises (Hatay 1,9 % der Einwohner → 23 %, Bayburt → 20 %, İstanbul → 41 %; `umfangFaktor` `sim/handeln.ts:175`, Spielparameter). Das ist ein echter Grund, gezielt zu handeln, nur die Karte hilft dabei nicht | Rechnung in 5 |
| Falsche Angaben | Banner und Provinzkarte zeigen 2024er Bürgermeister, die Wahllinse heißt „2028“ | 1.2, 1.3 |

**Die Hauptursache:** Die Karte wurde als Bühne und Anblick gebaut (Konzept vom 04.10., `KARTE_KONZEPT_2026-10-04.md`: Linsen, Animationen, Weltkarte). Die Ortsentscheidungen der Simulation wurden in Listen und Kleinkarten der Akten gebaut. Beide Stränge haben sich nie getroffen.

---

## 6. Ziel des Bereichs

**Die eine Frage:** „**Wo** handle ich, und was hat es dort bewirkt?“

**Die echten Entscheidungen** (jede mit Preis und sichtbarer Wirkung):
1. **Wo setze ich eine Maßnahme oder einen Bau ein?** Ganz Land oder gezielt. Preis: Kapital und Geld nach Umfang (`umfangFaktor`), Baukapazität. Realismus: Die Türkei steuert Ansiedlung tatsächlich nach Regionen (Förderregionen 1–6, Beschluss Nr. 9903 von 2025).
2. **Wo kämpfe ich um Stimmen?** Reisen vor Parlaments- und Kommunalwahl. Preis: Aktionspunkte, Abnutzung je Besuch (`reiseVorschau`). Realismus: Sitze werden je Wahlkreis vergeben (87 Wahlkreise, 1 bis 36 Sitze).
3. **Wo helfe und sichere ich?** Hilfe nach einer Katastrophe, Vorsorge vorher. Preis: Geld, Baukapazität, Zorn bei Verzug. Realismus: 6. Februar 2023, 11 Provinzen, 53.537 Tote.
4. **Welches Gebiet fordere oder halte ich?** Nur im Krieg (W1).

Was nicht Aufgabe der Karte ist: Haushalt, Gesetze, Kabinett, Medien, Forschung. Diese Bereiche haben keinen Ort und bleiben Akten (Democracy-4-Prinzip).

---

## 7. Umbauplan in Tagesschritten

Reihenfolge K1 → K2 → K3 zuerst, weil sie den Mehrwert stiften; K4 und K7 räumen auf; K5 und K6 hängen an K1. K8 stimmt mit W1 ab.

### K1 Ortswahl auf der großen Karte (Grundgerüst)
- **Was:**
  - Ein Kartenmodus „Ort wählen“. Ihn öffnet eine Handlung aus einer Akte oder aus der Provinzkarte. Der Ablauf ist „erst Handlung, dann Ort“ (Victoria 3).
  - Die Akte schrumpft zum Seitenfenster rechts (Breite wie die Provinzkarte, 330 bis 420 px). Die Karte wird frei.
  - Jede Provinz trägt eine Bewertung: gut, möglich, schon erfüllt, gesperrt. Gesperrte Provinzen werden blass, gute kräftig. Die Farben ergeben sich aus der Bewertung, nicht aus einer Rohzahl.
  - Ein Klick wählt oder streicht eine Provinz. Das Seitenfenster zeigt die Auswahl, den Preis und die Wirkung live. Mit „Übernehmen“ gehen die Provinzen an den Aufrufer zurück, mit Esc wird abgebrochen.
  - Ziele sind allgemein: `p:34` für Provinzen, `r:<regionId>` für Kriegsregionen, `l:SYR` für Länder.
- **Dateien:**
  - neu: `ui/atlas/ortswahl.ts` (Zustand, Bewertung, reine Logik), `ui/atlas/OrtswahlLeiste.tsx`
  - ändern: `ui/Stage.tsx` (Modus, Akte als Seitenfenster), `ui/atlas/AtlasMap.tsx` (mehrere gewählte Flächen, Bewertungsfarben, Klick im Modus), `ui/atlas/Karte2D.tsx` (dasselbe in 2D), `ui/styles.css`
  - Sprachen: `i18n/katalog/{de,en,tr}/karte_ortswahl.json`
- **Abnahme:**
  - Test der Bewertungslogik.
  - Bild bei 1440×900: Mindestens 70 % der Karte frei.
  - Esc stellt die Akte wieder her.

### K2 Politik, Bau und Restaurierung an die Ortswahl
- **Was:**
  - `OrtWahl` (Politik, `ui/reich/Regional.tsx`, Wirkungsnetz) bekommt den Knopf „Auf der Karte wählen“.
  - Bewertung „gut“ = Provinz in `akuteOrte` (`sim/handeln.ts:933`). Bei Netzen: Auslastung über 100 %, wie in Netze. Bei Restaurierung: gefährdete Stätte.
  - Preis und Dauer kommen unverändert aus `pruefeVorhaben` bzw. `regionalVorschau`.
  - Land › Netze: Die Kleinkarte bleibt als Vorschau. Ein Klick „Groß zeigen“ öffnet dieselbe Wahl auf der großen Karte. Wegfallen kann sie erst, wenn K1 im Spiel bestätigt ist.
- **Dateien:** `ui/OrtWahl.tsx`, `ui/reich/Regional.tsx`, `ui/NetView.tsx`, `ui/infrastruktur/Netze.tsx`, `ui/atlas/ortswahl.ts`.
- **Abnahme:**
  - Mit dem Spielstand des Inhabers „Mietdeckel nur in den 7 akuten Provinzen“ von der Karte aus beschließen.
  - Höchstens so viele Klicks wie über die Liste.
  - Gleicher Preis wie über die Liste (Test).

### K3 Provinzkarte wird Handlungskarte
- **Was:**
  - Oben stehen drei lebende Werte: Rückhalt vor Ort, akute Probleme, Rathaus aus dem Spielstand.
  - Darunter stehen nur die Handlungen, die hier möglich sind, je mit Preis:
    - „Maßnahme nur hier …“: Ortswahl mit dieser Provinz vorgewählt, Liste der hier akuten Maßnahmen
    - „Hier bauen“: Netze dieser Provinz mit Wirkung vorher → nachher
    - „Reise hierher“: nur in der Wahlkampfzeit, mit `reiseWirkungVorschau`
    - „Hilfe“: nur bei offenem Katastrophenfall
    - „Zwangsverwalter“: nur bei Rathaus der Opposition, Preis `VERWALTER_KOSTEN` (`sim/kommunen.ts:233`)
    - „Vorgang“: wie heute
  - Steckbrief (OSM-Infrastruktur, Einwohner, Abgeordnete) hinter einem Aufklapper (Regel Z).
- **Dateien:** `ui/ProvinceCard.tsx`, neu `ui/provinz-handlungen.ts` (welche Handlung wann, prüfbar ohne Browser), Sprachen.
- **Abnahme:**
  - Test: Jede angebotene Handlung hat Preis und Ziel, keine tote Handlung.
  - Bild İstanbul und Hatay im Spielstand des Inhabers.

### K4 Linsen ausdünnen und an Entscheidungen koppeln
- **Was:**
  - Stehende Linsen (6):

    | Linse | Herkunft |
    |---|---|
    | Politisch | bleibt |
    | Rückhalt | bleibt |
    | Akute Probleme | nimmt Arbeitslosigkeit auf |
    | Belastung | nimmt Infrastruktur auf, aus Netzwerten statt OSM |
    | Kulturerbe | bleibt |
    | Beziehungen | bleibt |

  - Situative Linsen, nur solange ihr Anlass besteht (Regel in `ui/linsen/linsen.ts`):
    - Wahlkampf (K5)
    - Lage nach Katastrophe (K6)
    - Front und Besatzung (K8)
    - Versorgungswege (im Krieg oder bei Schaden)
  - Entfallen:
    - Regionen
    - Wirtschaftskraft (fest)
    - Ressourcen und Strategische Orte: fest; die Marken bleiben in Wirtschaft › Güter
    - Katastrophenrisiko: geht in die Vorsorge-Wahl von K6
  - Wahllinse: Name aus der letzten Wahl im Spielstand statt `start.datum` (`ebenen.ts:71`).
- **Dateien:** `ui/ebenen.ts`, `ui/linsen/linsen.ts`, `ui/linsen/LinsenWahl.tsx`, Tasten in `linsen.ts`, Tests unter `test/linsen*.test.ts`.
- **Abnahme:**
  - Keine Linse ohne Änderung im Spiel; ein Test prüft das nach 12 Monaten.
  - Alte Spielstände mit gespeicherter Linse laden.

### K5 Wahlkarte
- **Was:**
  - Linse „Wahlkampf“ ab acht Wochen vor der Wahl.
  - Farbe: Abstand des eigenen Lagers je Provinz (aus `lokaleAnteile`) mal Sitze im Wahlkreis. Bedeutung: „hier entscheidet sich viel“ gegen „sicher“ oder „verloren“.
  - Klick auf eine Provinz: Reise mit Vorschau aus `reiseWirkungVorschau`.
  - Ersetzt in `ui/Wahlkampf.tsx` die nicht klickbare Karte (`:169`) und die Liste (`:173`) durch „Auf der Karte reisen“.
  - Wahlnacht der Kommunalwahl: Die Karte zeigt gewonnene und verlorene Rathäuser (`gewonnen`, `verloren` in `sim/kommunen.ts:173`).
  - Banner-Streifen aus `gesellschaft.kommunen.rathaus` statt `buergermeister2024`.
- **Dateien:** `ui/ebenen.ts`, `ui/Wahlkampf.tsx`, `ui/atlas/staedte.ts`, `ui/ProvinceCard.tsx`, `ui/wahl/Wahlabend.tsx`, Sprachen.
- **Abnahme:**
  - Im Spielstand des Inhabers sind alle 81 Banner PW.
  - Ein Wahlkampf mit drei Reisen nur über die Karte.

### K6 Katastrophe auf der Karte
- **Was:**
  - Linse „Lage nach Katastrophe“, solange ein Fall offen ist. Betroffene Provinzen zeigen den Hilfsstand (`hilfsStand`, `sim/katastrophe.ts:755`) als Füllung.
  - Klick öffnet die Fallkarte (`ui/katastrophe/Faelle.tsx:66`) im Seitenfenster neben der Karte.
  - Vorsorge als Ortswahl: Erdbebenrisiko (`depremRisiko`) mal Einwohner. Diese Gewichtung ist ein Spielparameter.
  - Die Kleinkarte in `ui/katastrophe/Lage.tsx:184` wird ein Sprung auf die große Karte.
- **Dateien:** `ui/ebenen.ts`, `ui/linsen/linsen.ts`, `ui/katastrophe/Lage.tsx`, `ui/katastrophe/Faelle.tsx`, `ui/Stage.tsx`.
- **Abnahme:** Bild eines Bebenfalls im Spielstand des Inhabers mit Hilfsstand je Provinz.

### K7 Wirkung sichtbar, Altdaten raus
- **Was:**
  - Nach einer Ortsentscheidung pulst die Provinz einmal. Eine kleine Marke zeigt die Änderung des betroffenen Werts, etwa „Bahn 140 → 118 %“ bei Fertigstellung.
  - Einträge im Wirkungsbericht mit Ort bekommen „Auf der Karte zeigen“.
  - Banner zeigen statt der festen Einwohnerzahl den Wert der aktiven Linse oder nichts.
  - Provinzkarte und Banner lesen Rathaus, Sitze und Werte nur aus dem Spielstand.
- **Dateien:** `ui/atlas/staedte.ts`, `ui/atlas/AtlasMap.tsx`, `ui/atlas/marken.ts`, Wirkungsbericht (`ui/` Bereich Wirkungsbericht), `ui/ProvinceCard.tsx`.
- **Abnahme:** Kein Wert auf der Karte mit Stand „2024“, der sich im Spiel ändern kann. Ein Test vergleicht Banner und Spielstand.

### K8 Schnittstelle für die Kriegskarte (mit W1)
- **Was:**
  - Die Ortswahl aus K1 nimmt `r:<regionId>` aus `src/data/schauplatz-flaechen.json`. Damit setzt W1 in Schritt 10 das Kriegsziel durch Anklicken der Regionen und in der Krise die Forderung auf der Karte.
  - Die Linse „Front und Besatzung“ bekommt ihre Regel (nur bei laufendem Krieg oder Besatzung) und färbt nach `kriegsKarte`.
  - Feste Fronten bleiben verboten (Nachtrag zu S).
  - Abgrenzung:

    | Wer | Gehört dazu |
    |---|---|
    | W1 | Simulation, `kriegsfx.ts`, Regionsflächen |
    | A5 | Ortswahl, Linsenplatz, Seitenfenster |

- **Dateien:** `ui/atlas/ortswahl.ts`, `ui/linsen/linsen.ts`, `ui/ebenen.ts`. Lesend: `sim/kriegsschauplatz.ts:610`.
- **Abnahme:** Mit `w1/stand-syrien2043-droh.json` eine Zielregion auf der Karte wählen. W1 liest die Wahl über eine Funktion.

### K9 Abnahme im Spiel
- **Was:**
  - Spielstand des Inhabers und frisches Spiel, je zwei Jahre.
  - Gezählt werden die Ortsentscheidungen über die Karte gegenüber der Liste.
  - Freie Kartenfläche bei offener Ortswahl.
  - Bilder aller neuen Zustände.
- **Dateien:** `e2e/karte-*.cjs`, Bericht `dokumentation/analyse_2026-11-05/welle/a5.md`.

### Was wegfallen kann, weil es nur Schau ist

| Element | Grund | Wo |
|---|---|---|
| 5 Linsen mit festen Daten (Regionen, Wirtschaftskraft, Ressourcen, Strategische Orte, Infrastruktur alt) | ändern sich nie, bereiten nichts vor | `ui/ebenen.ts` |
| Einwohnerzahl auf 81 Bannern | fest, keine Entscheidung | `ui/atlas/staedte.ts:144` |
| Bürgermeister 2024 auf Bannern und Karte | falsch nach der ersten Kommunalwahl | `staedte.ts:122`, `ProvinceCard.tsx:74` |
| OSM-Infrastrukturblock offen in der Provinzkarte | fest; hinter Aufklapper | `ProvinceCard.tsx:84–107` |
| Nicht klickbare Karte im Wahlkampf | Bild ohne Handlung | `ui/Wahlkampf.tsx:169` |
| Eigene Linsenknöpfe in „Lage der Regionen“ | Doppel der großen Linsen | `ui/reich/RegionenLage.tsx:111` |
| Schild „Türkei · 81 Provinzen · Stand 2043“ (nur Linse Politisch) | Zierde im Atlasstil; nur entfernen, wenn es eine Ortswahl verdeckt (Geschmack des Inhabers, Nachtrag zu T) | `ui/Kartenlegende.tsx:13` |

Nicht anfassen: Gelände, Meere und Stil der Karte (Nachtrag zu T: „Das bestehende Design mit Karte und Meeren ist besser“).

---

## 8. Fragen an den Inhaber

- **F1 Weniger Linsen:** Einverstanden, dass von 15 Linsen 6 stehen bleiben und 4 nur bei Anlass erscheinen?
- **F2 Förderregionen:** Sollen die sechs Förderregionen (Beschluss Nr. 9903, 2025) eine Spielregel werden? Eine Ansiedlungsmaßnahme würde dann in Region 6 mehr bewirken und mehr kosten. Das wäre eine echte Ortsentscheidung mit belegtem Hintergrund. Die Wirkungsgrößen wären Spielparameter.
- **F3 Seitenfenster:** Soll die Akte bei einer Ortswahl zum Seitenfenster schrumpfen? Oder sollen Land, Außen und Sicherheit grundsätzlich als Seitenfenster neben der Karte öffnen (W 3)?
- **F4 Banner:** Sollen die Banner statt der Einwohnerzahl den Wert der aktiven Linse zeigen oder nur Name und Rathausfarbe?
- **F5 Kommunalwahl:** Im Spielstand gewann das Lager 2034 alle 81 Rathäuser. Das liegt außerhalb dieser Analyse, sieht aber nach zu starker Kopplung an die Landesstimmung aus (`sim/kommunen.ts`, `schwung` und `ortsgewicht`). Prüfen?

---

## 9. Rechercheliste mit Quellen

**Vergleichsspiele**

- Democracy 4 ohne Karte, Wirkungsnetz: https://gamepretty.com/?p=12159, https://positech.co.uk/democracy4
- Kritik an der Oberfläche: https://jumpdashroll.com/article/first-impressions-democracy-4, https://www.gameshedge.com/review-democracy-4/
- Civilization VI:
  - Linsen, Bezirkslinse beim Bau: https://www.civilopedia.net/standard-rules/concepts/world_7
  - Bezirke: https://www.civilopedia.net/rise-and-fall/concepts/cities_10
  - Entflochtene Städte: https://en.wikipedia.org/wiki/Civilization_VI
- Hearts of Iron IV:
  - Kartenmodi: https://hoi4.paradoxwikis.com/Map_modes
  - Versorgung: https://hoi4.paradoxwikis.com/Supply
  - Schlachtplan: https://hoi4.paradoxwikis.com/Battle_plan
  - Bau: https://hoi4.paradoxwikis.com/Construction
  - Überarbeitung 2021: https://www.pcgamesn.com/hearts-of-iron-iv/supply-changes
- Victoria 3:
  - Dev Diary 29 (UX), nur Suchauszug, Wortlaut ungeprüft: https://admin-forum.paradoxplaza.com/forum/developer-diary/victoria-3-dev-diary-29-user-experience.1506484
  - Dev Diary 30 (UI), nur Suchauszug, Wortlaut ungeprüft: https://admin-forum.paradoxplaza.com/forum/developer-diary/victoria-3-dev-diary-30-user-interface-overview.1507166/page-2
  - Kartenmodi und Farben: https://vic3.paradoxwikis.com/Map_modes
  - Rezensionen: https://destructoid.com/reviews/review-victoria-3-pc-paradox-interactive-strategy, https://exputer.com/reviews/victoria-3/
- Europa Universalis IV: https://eu4.paradoxwikis.com/Map_modes, https://eu4.paradoxwikis.com/Development
- Suzerain:
  - Rezension: https://www.thesixthaxis.com/?p=355217
  - Kingdom of Rizia: https://store.steampowered.com/app/2352340/Suzerain_Kingdom_of_Rizia/
  - Weitere: https://www.superjumpmagazine.com/its-good-to-be-king-suzerains-kingdom-of-rizia/, https://www.torporgames.com/2023-broadcasts
- Tropico 6:
  - Overlay beim Setzen: https://www.kalypsomedia.com/post/tropico-6-nintendo-switch-update-1-0-5
  - Rezension: https://newgamenetwork.com/article/2099/tropico-6-review

**Türkei je Provinz**

- TÜİK:
  - Bevölkerung ADNKS 2024: https://www.alomaliye.com/2025/02/06/turkiye-nufusu-aciklandi/ (Wiedergabe)
  - Regionaldatenbank: https://biruni.tuik.gov.tr/bolgeselistatistik/
  - BIP je Provinz 2024 (Wiedergabe, vor Übernahme an TÜİK prüfen): https://www.alomaliye.com/2025/12/11/il-bazinda-gayrisafi-yurt-ici-hasila-2024/
  - Arbeitsmarkt 2024 je Provinz (Wiedergabe): https://www.alomaliye.com/2025/03/20/isgucu-istatistikleri-2024/
- SEGE-2025: https://bebka.org.tr/wp-content/uploads/2025/10/2025-il-sege.pdf (heruntergeladen unter `scratchpad/dl_sege/`)
- Förderregionen, Beschluss Nr. 9903:
  - Resmî Gazete 30.05.2025: https://www.resmigazete.gov.tr/eskiler/2025/05/20250530-2.pdf
  - Anhang EK-2: http://orgtr.org/wp-content/uploads/Karar-9903-EK2.pdf
- YSK:
  - Offene Daten: https://acikveri.ysk.gov.tr/
  - Sitze je Wahlkreis (`/api/getMilletvekiliSayisi`, abgerufen als `scratchpad/pages/mv.json`)
  - Ersatzquelle R-Paket: https://search.r-project.org/CRAN/refmans/turkeyelections/html/genel_secim_2023_il.html
- AFAD:
  - TDTH 2018: https://www.afad.gov.tr/turkiye-deprem-tehlike-haritasi, https://tdth.afad.gov.tr/ (Anmeldung über e-Devlet)
  - Katastrophenstatistik: https://www.afad.gov.tr/afet-istatistikleri
- 6. Februar 2023:
  - SBB-Bericht: https://www.sbb.gov.tr/wp-content/uploads/2023/03/2023-Kahramanmaras-ve-Hatay-Depremleri-Raporu.pdf
  - 53.537 Tote: https://www.dailysabah.com/turkiye/turkiye-remembers-53537-lives-lost-in-feb-6-quakeminister/news
- Klinikbetten je Provinz, Jahrbuch 2024: https://dosyamerkez.saglik.gov.tr/Eklenti/52859/0/siy2024tr31122025pdf.pdf
- Stromverbrauch je Provinz, EPDK 2025: https://www.epdk.gov.tr/Detay/Icerik/3-0-24/elektrikyillik-sektor-raporu
- Syrer unter vorübergehendem Schutz je Provinz: https://www.goc.gov.tr/gecici-koruma5638
- Straßen je Provinz, KGM: https://www.kgm.gov.tr/Sayfalar/KGM/SiteTr/Istatistikler/DevletveIlYolEnvanteri.aspx

**Nicht belegt** in Provinzauflösung: Flut (DSİ), Waldbrandrisiko (OGM), Bahnnetz je Provinz (TCDD), Erdbebenzonen 1996 je Provinz.

**Spielparameter in diesem Plan (keine belegten Zahlen):**
- Gewichtung Gefahr × Einwohner
- Bewertungsschwellen der Ortswahl
- Breite des Seitenfensters
- „acht Wochen vor der Wahl“ (aus dem bestehenden Plan übernommen)

---

## 10. Bilder

Alle unter `…/scratchpad/welle/a5/bilder/`.

**Spielstand des Inhabers (2043):**
- `inh-01-karte.png`: Grundansicht, Abstimmungskarte über der Karte
- `inh-02-linsen.png`: Linsenwahl mit 15 Kacheln
- `inh-03-linse-{2..9,v,0,r,k,b,s}.png`: jede Linse; `-3` Wahl „2028“ im Jahr 2043, `-5` Wirtschaftskraft mit Zahlen von 2024, `-7` Infrastruktur fest, `-0` Akute Probleme
- `inh-04-provinz-34.png`, `inh-05-provinz-34-unten.png`: Provinzkarte İstanbul, „Rathaus seit 2024: CHP“, ein Knopf
- `inh-04-provinz-31.png`, `inh-05-provinz-31-unten.png`: Hatay, „Rathaus seit 2024: AKP“
- `inh-06-hier-bauen.png`: „Hier bauen oder fördern“ öffnet Politik › Wirkungsnetz mit Autobahnbau in Hatay; die Karte ist zugedeckt
- `inh-07-schreibtisch.png`: Schreibtisch über der Karte
- `inh-10-akte-*.png`: Akten über der Karte, 25 % frei
- `inh-10-akte-land-netze.png`: das gute Muster (Kleinkarte, Wirkung, Preis, Bauen)
- `inh-10-akte-land-regionen.png`: ganz rote Kleinkarte
- `inh-10-akte-land-katastrophen.png`: laufender Fall (Sturzflut Amasya und Zonguldak) mit Schritten und Knopf; kein Ortsbezug zur großen Karte

**Frisches Spiel (2028):** `neu-01-karte.png`, `neu-02-linsen.png`, `neu-03-linse-3.png` (Wahl), `neu-03-linse-0.png` (Akute Probleme), `neu-04/05-provinz-34/31*.png`, `neu-06-hier-bauen.png`, `neu-07-schreibtisch.png`, `neu-10-akte-land-netze.png`, `neu-10-akte-land-katastrophen.png`
