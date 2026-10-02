# RECHERCHE_VERTIEFUNG: Wissenschaft, Forschung, Bildung, Kultur, Soft Power in Strategiespielen

**Zweck:** Vertiefung zu RECHERCHE_MECHANIKEN.md, RECHERCHE_KONKURRENZ_FACHBEREICHE.md (Kap. 5 „Kultur, Erbe, Wunder, Tourismus") und VERBESSERUNGSPLAN_2026-09-30.md. Jene Dateien decken Wunder, Erbe-Katalog, Tourismus-Rohdaten und Diplomatie bereits ab; diese Datei geht eine Ebene tiefer in **die Wissens- und Kulturmaschinerie** der Vorbildspiele: Was kostet Wissenschaft/Kultur, was bringt sie, wer gewinnt und verliert — und wie übertragen wir das auf Staatsräson (81 Provinzen, PISA-Startwerte 494/472/462, Kulturerbe-Katalog `game/src/data/erbe.ts` mit 53 Stätten, Reich-Bausystem, Haushalt-Regler, 4-Dimensionen-Beziehungsmatrix, Politiknetz mit „Abwanderung von Fachkräften").

**Kernfrage des Auftrags:** „Wissenschaft und Kultur sind sehr, sehr wichtig in Civilization. Wie funktionieren diese Systeme, was kosten sie, was bringen sie — und wie kann man das System ändern?"

**Schema je Mechanik:** Funktionsweise (mit Zahlen) · Kosten (Geld, Opportunität, Zeit, Währung) · Nutzen kurz- vs. langfristig · Wer gewinnt / wer verliert · Versteckte/Zweitrunden-Effekte · Übernahme für Staatsräson.

**Markierungen:** Zahlen ohne Herkunftsangabe im Satz stammen aus den am Abschnittende genannten Quellen. Mit **[unverifiziert]** markierte Angaben sind aus Sekundärquellen, Erinnerung oder älteren Versionen und vor Implementierung gegen die Primärquelle (Wiki-Seite zum aktuellen Patch bzw. Gamefiles) zu prüfen.

---

## Inhaltsverzeichnis

1. Civilization 6 — Wissenschaft im Detail (Tech-Tree, Eureka, Campus, Große Wissenschaftler, Forschungsallianz)
2. Civilization 6 — Kultur und Tourismus als Siegbedingung (Civics, Inspiration, Theater Square, Große Werke, Themenbonus, Reliquien, Archäologie, Rockbands, Nationalparks)
3. Civilization-Reihe allgemein — Golden/Dark Ages, Dedications, „We Love the King Day"
4. Stellaris — Drei Forschungsbäume, Karten-Alternativen, Wissenschaftler-Persönlichkeiten, Traditionen/Unity
5. Europa Universalis IV — Monarch Points, Tech vs. Ideas vs. Development, Institutionen, Universities
6. Victoria 3 — Innovation, Universitäten, Technology Spread, Alphabetisierung, Bildungsinstitution, Kunstakademien
7. Hearts of Iron 4 — Forschungslots, Ahead-of-Time-Malus, Spionage-Techklau, Design Companies/MIOs
8. Democracy 4 — Education als Policy-Feld, Science Funding, Space Program, Technological Advantage
9. Suzerain — Bildungsreform als Ereigniskette, Kulturpolitik als Konfliktlinie (Bludisch)
10. Tropico 6 — Weltwunder-Heists, Kulturbauten als Fraktions-/Tourismusmagnet
11. Anno 1800 — Einfluss als Kulturwährung, Zeitungspropaganda, Forschungsinstitut, Weltausstellung
12. Old World / Humankind / Millennia — Forschungsdesign-Varianten (kurz)
13. Power & Revolution — kulturelle Einflussnahme als diplomatisches Werkzeug
14. Kapitel A: „Der Zinseszins des Wissens" — Typologie langfristiger Bildungs-/Wissenschaftsinvestitionen
15. Kapitel B: „Soft Power als Staatsräson-Währung" — konkreter Mechanik-Vorschlag mit Zahlenrahmen
16. Top-15-Übernahmen (Tabelle nach Wert/Aufwand)
17. Unsicherheiten und offene Verifikationen

---

## 1. Civilization 6 — Wissenschaft im Detail

### 1.1 Tech-Tree und Eureka-System

**Funktionsweise:** Der Technologiebaum ist linear-vernetzt (Voraussetzungs-Techs), der Fortschritt läuft über die Rundenressource Wissenschaft. Die entscheidende Design-Neuerung von Civ 6 ist die **aktive Forschung**: Fast jede Technologie hat eine Boost-Bedingung („Eureka"), eine konkrete Spielhandlung — eine Stadt an der Küste gründen boostet Segeln, ein Steinbruch boostet Mauern. Erfüllt man sie, erhält man **40 % der Basiskosten** der Technologie geschenkt (vor dem Addon „Rise and Fall": 50 %). China erhält als Zivilisationsbonus 50 % statt 40 %, Babylon komplettiert per Eureka sogar die ganze Technologie. Fast alle Techs haben Eurekas; Ausnahmen sind die drei Start-Techs; Techs der Informations-/Zukunftsära lassen sich oft nur über Große Wissenschaftler und Spione boosten. Zusätzlich verteuert „Rise and Fall" das Vorausforschen: **+20 % Kosten je Epoche Abstand zur Weltepoche, multiplikativ stapelbar** (2 Epochen = +44 %) — ein eingebauter Gleichlauf-Regler gegen „Beelining" und zugleich eine Aufholhilfe für Zurückgebliebene (frühere Techs werden entsprechend billiger).

**Kosten:** Wissenschaft kommt aus Campus-Bezirken, Gebäuden, Bevölkerung (seit „Rise and Fall" 0,5 Wissenschaft je Bürger, vorher 0,7), Handelsrouten, Stadtstaaten-Boni. Die Währung ist **Zeit in Runden**: Eine Technologie kostet X Wissenschaft; der Zugewinn eines Eurekas entspricht X×0,4 Runden-Wissenschaft — sprich: ein Eureka spielt dir 40 % der Runden frei, die dein Reich sonst produzieren müsste.

**Nutzen kurzfristig:** frühere Einheiten (z. B. Armbrustschützen vor dem Nachbarn), frühere Bezirke/Wunder-Freischaltung, frühere Regierungsformen über den parallelen Civics-Baum. **Nutzen langfristig:** Zinseszins — wer früh Campus-Infrastruktur stehen hat, forscht jede folgende Tech schneller; die 40-%-Boosts verstärken das, weil sie prozentual auf die jeweils teurer werdenden Techs wirken.

**Wer gewinnt / wer verliert:** Gewinner sind Spieler, die ihre Spielhandlungen auf Boost-Bedingungen ausrichten (aktive Planung statt passivem Warten). Verlierer: wer die Boosts ignoriert, zahlt effektiv 66 % mehr Zeit pro Tech. Überraschende Verlierer-Mechanik: Forscht man eine Tech schon über 50 % hinaus und holt dann das Eureka, **verfällt der überschüssige Fortschritt** — Min-Maxer forschen deshalb absichtlich nur bis knapp unter den Boost und wechseln dann. Das ist ein Pacing-Instrument: Es erzeugt Mikro-Entscheidungen pro Runde.

**Versteckte/Zweitrunden-Effekte:** (1) Eurekas koppeln Forschung an die Welt — wer keine Küste hat, kann Segeln schwer boosten; Geografie wird zur Bildungspolitik. (2) Die Epochen-Verteuerung macht Vorsprung relativ teurer als Aufholen — eingebautes Catch-up. (3) Über den Weltenwunder-Effekt Chinas oder die Forschungsallianz (s. 1.4) werden Eurekas selbst zur handelbaren/diplomatischen Ressource.

**Übernahme für Staatsräson:** Das Eureka-Prinzip ist die eleganteste bekannte Lösung für unser Kernproblem „Bildung wirkt erst in 10 Jahren, wie bleibt das spannend?": **Reformbedingungen als Boost.** Beispiel: Die Modernisierungsleiter „MINT-Hochschulen" bekommt einen 40-%-Fortschrittsboost, wenn zuvor die Lehrerbildungs-Reform durch ist — genau wie in der Türkei-Realität (Lehrergehälter wirken in 3–8 Jahren auf PISA, siehe RECHERCHE_INNENPOLITIK). Und die Epochen-Verteuerung von Civ 6 übersetzen wir als **Reifegrad-Logik**: Technologiestufen, für die das Land noch keine Absolventenbasis hat (zu niedrige Alphabetisierung/zu wenige Ingenieure), kosten überproportional Umsetzungszeit — Nachholen mit Tutoren aus dem Ausland ist möglich, aber sichtbar teuer.

### 1.2 Campus-Bezirk und Adjacency: der Preis des Wissens

**Funktionsweise:** Der Campus ist ein **Bezirk**, der eine eigene Kachel auf der Karte belegt und einen Adjacency-Bonus erhält: +1 Wissenschaft je angrenzendem Berg, +1 je 2 Regenwaldkacheln, +1 je 2 angrenzenden Bezirken (seltene Geländemerkmale wie Geothermalspalten/Riffe geben je +2 [unverifiziert]). Gebäudekette: Bibliothek (+2 Wissenschaft), Universität (+4, +1 Wohnraum), Forschungslabor (+5); jedes Gebäude und der Bezirk selbst erzeugen je +1 Punkt für Große Wissenschaftler pro Runde. Freigeschaltet wird der Campus durch die Tech „Schrift" — Wissen braucht erst Schrift.

**Kosten — hier liegt die eigentliche Lektion:** Bezirke sind **knapp**. Die Bezirkszahl einer Stadt skaliert mit ihrer Bevölkerung [unverifiziert: 1 Bezirk je 3 Einwohner], die Baukosten steigen im Spielverlauf, und die Kachel ist unwiderruflich verbraucht. Jeder Campus ist **kein** Handelszentrum, **keine** Festung, **kein** Theaterbezirk. Civ 6 bepreist Wissenschaft also primär über **Opportunitätskosten**, nicht über Gold. Dazu kommt die Standort-Geiz-Falle: Der beste Campus (+3 bis +5 Adjacency) steht am Berg — genau da, wo auch Heilige Bezirke und Aquädukte hinwollen.

**Nutzen kurz vs. lang:** Kurzfristig fast nichts (der Campus selbst erzeugt nur Adjacency + 1 GW-Punkt); langfristig die komplette Wirtschafts- und Militärüberlegenheit. Civ 6 sagt dem Spieler damit ins Gesicht: **Wissenschaft ist eine Investitionsentscheidung mit 50–100 Runden Horizont.** Wer in Runde 30 keinen Campus baut, kann in Runde 150 nicht mehr „schnell nachziehen" — die Kosten steigen ja mit.

**Wer gewinnt / verliert:** Gewinner: frühe Campus-Bauer; Korea mit dem Spezialbezirk Seowon (pauschal +4, halbe Baukosten, aber ohne Adjacency) zeigt die „garantierte Basis statt Standortlotterie"-Variante. Verlierer: Reich mit falscher Geografie (kein Berg/Regenwald) — die Karte selbst wird zur Bildungsungerechtigkeit, exakt unser Ost-West-Gefälle in den 81 Provinzen.

**Zweitrundeneffekte:** Campus-Plätze verdrängen Nahrungs-/Produktionskacheln → Bevölkerungswachstum sinkt → langfristig weniger Bürger-Wissenschaft. Stadtstaaten koppeln Diplomatie an Wissenschaft: Genf gibt +15 % Wissenschaft **solange man mit niemandem Krieg führt** (Pazifismus-Prämie!), Seoul schenkt je Weltepoche ein Eureka, Stockholm +1 Große-Personen-Punkt je Bezirk. Wissenschaft wird so zur Friedens- und Diplomatiefrage.

**Übernahme für Staatsräson:** Unser Haushalt-Regler „Bildung" ist heute ein D4-artiger Prozentregler. Civ 6 zeigt, dass **Fläche und Slot-Knappheit** der ehrlichere Preis sind: Universitätsstandorte in den 81 Provinzen (Reich-Bausystem) konkurrieren mit Industrie, Wohnen, Energie um Baukapazität und um lokale Synergien (Campus neben Technopark/Istanbul vs. Campus in Hakkari mit Prestige- aber ohne Cluster-Bonus). Das Ost-West-Gefälle entsteht dann nicht aus einer Skript-Zahl, sondern aus Standortlogik — genau wie reale türkische Unis in Istanbul/Ankara Cluster-Effekte haben, die Şanlıurfa nicht einfach kopieren kann.

### 1.3 Große Wissenschaftler: das Talent als knappe, umworbene Ressource

**Funktionsweise:** Große Personen (Wissenschaftler, Schriftsteller, Künstler, Musiker, Generäle…) werden über Punkte pro Runde akquiriert; jede Zivilisation sammelt auf dieselbe weltweit sichtbare Person hin — ein **Wettlauf**. Wer die Schwelle zuerst erreicht, bekommt die Person und ihre individuellen, oft einmaligen Effekte (z. B. sofortige Eurekas, +Wissenschaft auf Gebäude). Alternativ kann man mit Gold/Glaube „patronieren" (überstürzt kaufen, teurer).

**Kosten:** Infrastruktur (Campus + Gebäude = 3–4 GW-Punkte/Runde), Politikkarten (+2 je Campus [unverifiziert]), Stadtstaat Stockholm; oder Gold/Glaube als Opportunitätswährung.

**Nutzen kurz/lang:** Kurzfristig ein spielbarer „Personen-Moment" (Einstein! Hypatia!) — die Abstraktion Wissenschaft bekommt ein Gesicht. Langfristig können einzelne Große Wissenschaftler den Tech-Verlauf kippen.

**Gewinner/Verlierer:** Der Wettlauf erzeugt echte Verlierer: Wer zweiter wird, bekommt **nichts** und die Punkte verfallen teilweise — ein Nullsummenelement in einem sonst positiv-summigen System. Brasilien bekommt 20 % der Punkte zurückerstattet — die Design-Einsicht dahinter: Verlieren im Talentwettlauf ohne Trostpreis frustriert.

**Zweitrundeneffekte:** Der Punktewettlauf macht Campus-Bau auch dann attraktiv, wenn man die Techs gerade nicht braucht — Verteidigung des Talentvorsprungs als Selbstzweck (Analogie: reale Hochschul-Rankings).

**Übernahme für Staatsräson:** Direkt anschlussfähig an POLITIKNETZ.md („Abwanderung von Fachkräften" als Problemknoten): **Spitzenkräfte als benannte Personen** (vgl. PERSONEN.md), die das Land über einen Talentmarkt gewinnt oder verliert. Brain Drain wird dadurch spielbar: nicht eine sinkende Zahl, sondern **die Abwanderung der Person „Prof. Dr. X, KI-Forschung, METU" an TU München** — mit sichtbarem Verlust ihres Bonus. Rückkehrprogramme (reale Maßnahme der Türkei, Wirkung 3–10 Jahre) werden zur „Rück-Patronage".

### 1.4 Forschungsabkommen bzw. Forschungsallianz: Wissen als Diplomatie

**Funktionsweise:** In „Rise and Fall"/„Gathering Storm" ersetzt die Allianz das alte Forschungsabkommen. Voraussetzung: Freundschaftserklärung + der Civic „Staatsdienst" (Civil Service). Die **Forschungsallianz** hat drei Stufen, die über Allianzpunkte wachsen (1 Punkt/Runde, +0,25 je aktive Handelsroute zum Verbündeten u. a.): Stufe 1: Handelsrouten zwischen den Verbündeten geben Zusatz-Wissenschaft (+2 hin, +1 zurück). Stufe 2: **Alle 30 Runden teilen die Verbündeten einen Tech-Boost** (ein Eureka für eine Tech, die der Partner hat oder geboostet hat). Stufe 3: Bonus-Wissenschaft, wenn beide dieselbe Tech forschen oder einer sie schon hat. Es gibt pro Allianztyp (Forschung, Kultur, Militär, Wirtschaft, Religion) nur **einen** Partner gleichzeitig — die Wahl des Forschungspartners ist exklusiv.

**Kosten:** Diplomatischer Preis: die Allianz bindet (kein Krieg untereinander möglich, Verteidigungspakt inkludiert); die Exklusivität schließt andere Partner aus.

**Nutzen:** Der Aufholeffekt ist der Kern — der **schwächere** Partner profitiert überproportional (er bekommt Boosts für Techs, die der stärkere schon hat). Wissenschaftsdiplomatie als Wissens-Transferkanal.

**Gewinner/Verlierer:** Gewinner: Nachzügler mit guter Diplomatie. Verlierer: Isolierte — wer keine Allianzen hat, forscht strukturell langsamer. Das spiegelt die reale Logik von Erasmus, CERN, Horizon Europe.

**Zweitrundeneffekte:** Die Kulturallianz teilt auf Stufe 3 **20 % des Tourismus und 10 % der Kultur** des Partners — Soft Power wird zwischen Verbündeten kontagios. Handelsrouten werden doppelt wertvoll (Gold + Allianzpunkte + Wissenschaft), was Handelsblockaden zur Wissenschaftssanktion macht.

**Übernahme für Staatsräson:** Passt direkt auf unsere 4-Dimensionen-Beziehungsmatrix (Handel/Sicherheit/Vertrauen/Konflikt): **Wissenschaftskooperation als fünfte, konditionale Schicht** — ein Forschungsabkommen (reale Vorbilder: Türkei in Horizon Europe assoziiert, CERN-Assoziierung 2015, TÜBİTAK-DUAL-Programme) erzeugt jedes Jahr einen „Boost" auf eine Modernisierungsleiter, die der Partner weiter oben ist; Abbruch (z. B. nach Konflikt-Eskalation) kappt den Transfer mit Verzögerung. Vertrauen-Dimension als Voraussetzung, Konflikt-Dimension als Risiko. [Verifikation der realen Assoziierungs-Stati vor Text-Übernahme nötig.]

**Quellen Abschnitt 1:** civilization.fandom.com/wiki/Boost_(Civ6); civilization.fandom.com/wiki/Chinese_(Civ6); eurogamer.net/civilization-6-science-explained-how-to-earn-science-and-how-it-works-4879; eurogamer.net/civilization-6-districts-best-tile-placement-adjacency-bonuses-4879; reddit.com/r/civ (Rise-and-Fall-Epochenkosten, 20 % multiplikativ); civilopedia.net/en-US/gathering-storm/concepts/alliances_1/; gamerant.com/civilization-6-how-to-form-alliances-guide/; civilization.fandom.com/wiki/Alliance_(Civ6); lonerstrategygames.com (Eureka-Timing-Verlust); hogogame.com (Adjacency-Details).

---

## 2. Civilization 6 — Kultur und Tourismus als Siegbedingung

### 2.1 Civics-Baum und Inspiration

**Funktionsweise:** Parallel zum Tech-Tree existiert der **Civics-Tree**, angetrieben von der Ressource Kultur. Er schaltet Regierungsformen, Politikkarten und diplomatische Fähigkeiten frei. Das Spiegel-System zum Eureka ist die **Inspiration: ebenfalls 40 %** der Civickosten für eine Kultur-Handlung (ein Wunder bauen boostet „Drama und Poesie", eine bestimmte Bevölkerungsgröße boostet den nächsten Regierungsschritt). Der Dedication „Pen, Brush and Voice" im Goldenen Zeitalter erhöht Inspirationen um weitere 10 Prozentpunkte und gibt je Spezialbezirk +1 Kultur.

**Kosten/Nutzen:** Kultur kommt aus Monumenten, Theaterbezirken, Wundern, Stadtstaaten. Kurzfristig: Politikkarten (die eigentliche „Gesetzgebung" von Civ 6 — Karten-Slots in Militär/Wirtschaft/Diplomatie/Wildcard). Langfristig: Regierungsformen mit mehr Slots und Legacy-Boni. **Die entscheidende Design-Aussage für uns: Kultur ist bei Civ 6 nicht Dekoration, sondern das Gesetzgebungssystem.** Wer Kultur vernachlässigt, regiert im Jahr 1900 noch mit der Regierungsform der Antike.

**Gewinner/Verlierer:** Gewinner: Kulturproduzenten schalten früher starke Regierungen frei (z. B. Monarchie lange vor der militärischen Konkurrenz). Verlierer: reine Wissenschafts-Beeline-Spieler, deren Regierung hinterherhinkt — die Doppelbaum-Struktur erzwingt Allokation zwischen zwei Fortschrittswährungen.

**Zweitrundeneffekte:** Politikkarten lassen sich fast frei wechseln (bei Regierungswechsel/Perioden) — Kultur erzeugt also **Adaptivität**, nicht nur Fortschritt. Und Kultur ist zugleich die **Verteidigungsressource gegen den Kultursieg der Gegner** (s. 2.2: Inlandstouristen).

**Übernahme für Staatsräson:** Wir haben Politikkarten bereits über das Politiknetz abgebildet; die Civ-6-Lektion ist die **Zweiwährungs-Allokation**: Wissenschaftlicher Fortschritt (Modernisierungsleitern) und institutioneller Fortschritt (Gesetzesleitern, Verwaltungsreformen) sollten aus **getrennten Ressourcen** gespeist werden — in unserem Fall: Modernisierung läuft über Absolventen/Forschungskapazität, Institutionen über Verwaltungskraft/Politisches Kapital. Wer die Kultur-Seite (Institutionen, Identität, Medien) hungern lässt, kann technologisch vorne sein und trotzdem an der Verfassungsreform scheitern — wie Suzerain es erzählt.

### 2.2 Tourismus: der Kultursieg als „umgekehrter Wettlauf"

**Funktionsweise:** Civ 6 trennt **Kultur** (eigene Stärke) von **Tourismus** (Ausstrahlung nach außen). Kultursieg = deine **Besucher-Touristen** übersteigen die **Inlandstouristen jeder anderen Zivilisation**. Inlandstouristen entstehen aus akkumulierter Kultur (gängige Angabe: 1 Inlandstourist je 100 Kultur, lebenslang akkumuliert); Auslandstouristen aus akkumuliertem Tourismus gegenüber der jeweiligen Civ [Formel-Konstante 200 je Spieleranzahl: unverifiziert]. Das System ist ein **umgekehrtes Wettrüsten**: Deine Kultur ist deine Verteidigung gegen fremde Ausstrahlung, dein Tourismus dein Angriff auf deren Heimatpublikum.

**Tourismus-Quellen mit Zahlen:**
- **Weltwunder:** 2 Tourismus/Runde, +1 je Epoche, die das Spiel über die Verfügbarkeits-Epoche des Wunders hinaus ist — ein antikes Wunder wie Stonehenge trägt am Endspiel 9 Tourismus/Runde bei. **Wunder altern nicht, sie reifen** — das ist der Zinseszins der Kultur.
- **Große Werke:** Schriftwerk 2 Kultur/4 Tourismus; Musikwerk 4/4; Artefakt 3/3; Kunstwerk ca. 3/3 [unverifiziert]. Erzeugt durch das Verbrauchen Großer Personen (Schriftsteller/Künstler/Musiker) bzw. Archäologen-Grabungen.
- **Themenbonus:** Museen mit kuratierter Sammlung **verdoppeln** Kultur- und Tourismus-Ertrag der enthaltenen Werke. Regel Archäologiemuseum: 3 Artefakte **derselben Epoche von verschiedenen Zivilisationen**; Kunstmuseum: 3 Kunstwerke desselben Genres von verschiedenen Künstlern [unverifiziert]. Der Spieler wird zum Kurator — Sammeln, Tauschen mit der KI, gezieltes Graben.
- **Reliquien:** 4 Glaube + **8 Tourismus** (der höchste Einzelwert unter den Basen); Quellen: Tribal Villages, Märtyrer-Apostel (Promotion „Märtyrer", Tod im theologischen Kampf). Religiöser Tourismus wird vom Civic „Aufklärung" halbiert und vom Wunder Cristo Redentor beeinflusst — **Säkularisierung als Tourismus-Politik**!
- **Nationalparks:** Tourismus = Summe der Attraktivität (Appeal) der vier Park-Kacheln; errichtet von einem Naturforscher (gekauft mit **Glaube** — Naturschutz als quasi-religiöses Projekt); Beispielrechnung aus der Community: Appeal 15 → 22 Tourismus mit den Multiplikatoren Computers/Environmentalismus, 45 mit Handelsroute.
- **Seebäder/Skigebiete:** Tourismus aus Kacheln mit hohem Appeal.
- **Rockbands:** Spätspiel-Einheiten (gekauft mit Glaube, Basis ca. 600 [unverifiziert]), die **Konzerte in fremden Wundern/Bezirken** spielen: Albumverkäufe erzeugen direkt Tourismus gegenüber der Ziel-Civ; Promotionen (Indie, Stadionrock etc.) steigern die Ausbeute; Bands können bei Flops „auflösen". **Die Popkultur-Invasion als aktive Einheit auf der Karte.**
- **Politik/Diplomatie als Multiplikatoren:** offene Grenzen, Handelsrouten, gleiche Regierungsformen, Politik „Online Communities", „Heritage Tourism" (Museen verdoppelt), Kulturallianz Stufe 3 (20 % des Partner-Tourismus).

**Kosten:** Alles obige frisst die gleichen knappen Ressourcen wie der Militär-/Wirtschaftsaufbau: Bezirksslots (Theaterbezirk!), Große-Personen-Punkte, Glaube (der für Rockbands/Nationalparks verbraucht wird statt für Siedler in „Monumentality"), Produktionszeit für Wunder.

**Nutzen kurz/lang:** Kurzfristig: wenig (Kultursieg ist das langsamste Rennen). Langfristig: ein Sieg ohne einen einzigen Schuss — und die einzige Siegbedingung, die **aktiv sabotiert** werden kann (Spione stehlen Große Werke; Krieg gegen den Kulturführer zerstört seine Museen).

**Gewinner/Verlierer:** Gewinner: friedliche, bauende Spielstile. Verlierer: Militärspieler, deren Eroberungen Inlandstouristen der Besiegten nicht löschen. Die feinste Verlierer-Mechanik: **Raubgrabung ist eingebaut** — Artefakte kann man auch aus fremdem (oder erobertem) Gebiet graben; Spione können Große Werke direkt stehlen. Kultur ist Beute.

**Zweitrundeneffekte:** (1) Themenboni machen **Kuration** zur Mechanik — es zählt nicht, was du hast, sondern wie es zusammenpasst. (2) Tourismus-Druck erzeugt Loyalitäts-/Beziehungsfolgen (Cultural Alliance verhindert gegenseitigen Loyalitätsdruck). (3) „Aufklärung" halbiert Reliquien-Tourismus: **eine einzelne Civics-Entscheidung entwertet eine ganze Strategie** — Politik als Meta-Hebel gegen Kulturstrategien. (4) Appeal-Verknüpfung: Industrie (Minen) senkt Appeal → Massenindustrie frisst den späten Tourismus. Umweltpolitik und Kultursieg sind dasselbe System.

**Übernahme für Staatsräson:** Die Trennung Kultur (innen) / Tourismus (außen) ist exakt unsere geplante Trennung „nationale Identität/Zusammenhalt" vs. „Ansehen im Ausland" aus RECHERCHE_KONKURRENZ_FACHBEREICHE Kap. 5. Neu aus dieser Vertiefung:
- **Reifender Ertrag der Erbe-Stätten:** Jede der 53 Stätten in `erbe.ts` erzeugt Ansehen/Tourismus, der mit **Zustand × Alter × Inszenierung** wächst — eine 1985 gelistete Stätte (Göreme, W(1985)) hat einen höheren „Epochen-Multiplikator" als eine neu erschlossene. Zustandspflege ist Zinszahlung auf ein historisches Asset.
- **Themenbonus = unsere Serien/Pilgerrouten** (bereits als Set-Bonus geplant): Die Civ-6-Regel „gleiche Epoche, verschiedene Zivilisationen" verfeinern wir zu „gleiche Themenwelt, verschiedene Bezüge" — die Kirchenroute der Sieben (Ephesos bis Laodikeia) gibt den Bonus nur, wenn Stätten mit **christlichem UND antikem UND islamischem Umfeld** im Zustand ≥ Schwelle sind. Kuration als politische Aufgabe (Minderheitengemeinden müssen zustimmen — bereits im Bestandsplan).
- **„Aufklärungs"-Moment:** Eine säkulare Bildungsreform kann den Pilgertourismus-Multiplikator der religiösen Stätten senken, während sie die Wissenschaftsleitern boostet — ein echter, spielbarer Trade-off zwischen zwei unserer Systeme (Bildung × Erbe), belegt durch die Civ-6-Mechanik.
- **Rockband-Äquivalent:** siehe Kapitel B (Dizi-Exporte als aktive „Einheit" auf der Beziehungskarte).

**Quellen Abschnitt 2:** civilopedia.net/en-US/gathering-storm/concepts/tourism_1/; civ6.fandom.com/wiki/Great_Works (Erträge Schrift 2/4, Musik 4/4, Artefakt 3/3, Reliquie 4F/8T, Themenregel); civilization.fandom.com/wiki/Tourism_(Civ6) (Theming verdoppelt; Nationalpark = Appeal-Summe; Kultursieg-Definition); airtel.in-Guide (100 Kultur = 1 Inlandstourist); steamcommunity.com/app/289070/discussions/0/764058062403194074/ (Nationalpark-Rechnung); youtube.com/Watch?v=BdXcD7uiegY (Rockband-/Museum-Phasen); thegamer.com/civilization-6-complete-guide-to-era-score-golden-dark-heroic-age/ (Dedication „Wish You Were Here": Wundertourismus +50 %, Nationalparks doppelt).

---

## 3. Civilization-Reihe allgemein — Golden/Dark Ages, Dedications, „We Love the King Day"

### 3.1 Golden Ages / Dark Ages (Civ 6: Rise and Fall)

**Funktionsweise:** Die Welt läuft in **Weltepochen**; am Epochenwechsel wird jede Civ nach ihrem **Era Score** eingestuft: Dark Age, Normal Age, Golden Age — und **Heroic Age**, wenn man direkt von Dark zu Golden springt. Era Score kommt aus **Historic Moments** (erste Religion, erstes Wunder, erste Einheit eines Typs, gewonnene Notstände…). Die Schwellen sind **adaptiv**: Nach einem Goldenen Zeitalter steigen die Anforderungen, nach einem Dunklen sinken sie (die Hürde für das nächste Goldene ist um 5 gesenkt) — ein Anti-Snowball- und Comeback-Regler in einem. Zu Epochenbeginn wählt jede Civ eine **Dedication** (Schwerpunkt), z. B.:
- *Free Inquiry* (Klassik/Mittelalter): Normal/Dark: Era Score je Eureka; Golden: **Eurekas geben +10 Prozentpunkte**, Handelszentren/Häfen produzieren zusätzlich Wissenschaft aus Adjacency.
- *Pen, Brush and Voice*: Golden: **Inspirationen +10 pp**, +1 Kultur je Spezialbezirk.
- *Monumentality*: Golden: Siedler/Baumeister mit Glaube kaufbar, billiger — der berühmte „Monumentality-Golden-Age-Expansionsspielzug".
- *Wish You Were Here* (Atom/Information): Golden: **+50 % Wundertourismus**, Nationalparks doppelt.
Im Heroic Age wählt man **drei** Dedications. Dark Ages senken die Loyalität der Städte (Risiko des Abfalls!), schalten aber spezielle Dark-Age-Politikkarten frei (Bonus hier, Malus dort) — und ebnen den Weg zum Heroic Age. Der optionale Modus „Dramatic Ages" lässt nur Gold oder Dunkel zu und ersetzt Dedications durch mächtige Gold-/Dunkel-Politikkarten.

**Kosten:** Keine direkten — die Währung ist **Vorleistung** (Era Score aus der abgelaufenen Epoche) plus der Opportunitätspreis der Schwerpunktwahl (eine Dedication, drei verzichtet).

**Nutzen kurz/lang:** Kurzfristig ein Epochen-Feuerwerk (Loyalitätsdruck nach außen, Boni). Langfristig: Das System erzeugt **Kapitel** — die Geschichte deiner Civ bekommt eine Dramaturgie aus Aufstieg und Fall, inklusive der Möglichkeit, Dunkelheit strategisch zu kaufen (Dark-Age-Karten + Heroic-Sprung).

**Gewinner/Verlierer:** Gewinner: Spieler, die Historic Moments **auf die Epochengrenze timen** (das Wunder genau dann fertigstellen). Verlierer: Passive — wer keine Momente erzeugt, driftet ins Dunkel und verliert womöglich Grenzstädte über Loyalität. Wichtig: Dark Age ist kein Game-over, sondern ein **Risikomodus mit Kaufoption auf Heroic** — Verlieren hat eine Design-Funktion.

**Zweitrundeneffekte:** Die adaptiven Schwellen verhindern, dass einmal Vorne-Liegen permanent goldene Zeiten kaskadiert — ein expliziter **Anti-Langweiligkeits-Regler**. Die Timeline (alle Historic Moments als bebilderte Chronik) erzeugt Erzählwert ohne Mechanik-Kosten.

**Übernahme für Staatsräson:** Das ist die fertige Blaupause für unsere **Legislatur-/Epochen-Dramaturgie**: Zwischen den Wahlen (2028, 2033, 2038…) wird die vergangene Periode anhand von „Historischen Momenten" (Kanal-Eröffnung, PISA-Sprung, Erdbebenbewältigung, EU-Durchbruch) bewertet; die neue Periode bekommt eine **Schwerpunkt-Dedication** („Goldene Ära der Bildung": Leiter-Boosts +10 %, aber Anforderungen fürs nächste Mal steigen). Ein dunkles Zeitalter (Krise, Brain Drain, Proteste) senkt Loyalität/Stabilität, erlaubt aber harte Reformkarten, die in goldenen Zeiten politisch undurchsetzbar wären — **Krisen als Reformfenster**, wie es die politische Realität der Türkei (1999–2002, 2018) kennt.

### 3.2 „We Love the King Day" (Civ 5)

**Funktionsweise:** Städte stellen periodisch einen **Wunsch** nach einer bestimmten Luxusressource. Erfüllt der Spieler ihn (Anbau, Handel, Stadtstaat), feiert die Stadt 20 Runden lang „We Love the King Day": **+25 % Wachstum** (Nahrungs-Boost) in dieser Stadt. Danach kommt der nächste Wunsch.

**Kosten/Nutzen:** Opportunität (die Ressource fehlt eventuell woanders / muss erhandelt werden); Nutzen ein punktuelles, **sichtbares** Wachstumsfest in einer Stadt — kein abstrakter Reichsbonus.

**Gewinner/Verlierer:** Gewinner: Handelsreiche mit breitem Luxus-Portfolio. Verlierer: autarke Reiche. Zweitrundeneffekt: Der Wunsch-Mechanismus erzeugt einen permanenten **Strom kleiner, erreichbarer Ziele** zwischen den großen Strategien.

**Übernahme für Staatsräson:** **Provinz-Wünsche** als Mikroziel-Generator über den 81 Provinzen: Diyarbakır „wünscht" die Elektrifizierung der Bahnstrecke, Rize den Tee-Preis-Stopp, Antalya das Nachtmuseum. Erfüllung gibt der Provinz für X Monate einen Fest-Modus (+Zustimmung der lokalen Wählergruppen, +Wachstum/Wanderungszuzug). Das verbindet LERNKONZEPT (kleine Erfolge zwischendurch) mit der Provinztiefe — und kostet uns nur einen Eintrag im Provinz-Datensatz plus Ereignistext.

**Quellen Abschnitt 3:** eurogamer.net/civilization-6-rise-and-fall-era-score-historic-moments-golden-ages-heroic-ages-dark-ages-dedications-explained-5003; thegamer.com/civilization-6-complete-guide-to-era-score-golden-dark-heroic-age/ (Dedication-Tabelle); avclub.com (Schwellen −5 nach Dark Age); civilization.fandom.com/wiki/Dramatic_Ages_(Civ6); well-of-souls.com/civ/civ6_riseandfall.html; civilization.fandom.com/wiki/We_Love_the_King_Day_(Civ5) (+25 %, 20 Runden); carlsguides.com/strategy/civilization5/cities/.

---

## 4. Stellaris — Forschung als Kartenhand, Kultur als Traditionen

### 4.1 Drei Forschungsbäume mit Alternativ-Karten-System

**Funktionsweise:** Forschung läuft in **drei parallelen Bäumen** (Physik, Gesellschaft, Ingenieurwesen), gespeist aus monatlicher Forschungsproduktion (Forscher-Jobs, Forschungsstationen). Der Baum ist kein sichtbarer Baum: Beim Abschluss einer Technologie zieht das Spiel eine **Hand von Technologie-Karten** (Standard: 3 Alternativen; modifizierbar) — gewichtet nach Voraussetzungen, Forschungsnähe und einer Vielzahl von Gewichtungsfaktoren: Expertise-Trait des Rats-Wissenschaftlers (×1,25/1,35/1,75 je Stufe), Civics (Dimensional Worship ×1,1), Ascension Perk „Technological Ascendancy" (seltene Techs ×1,5), Tradition „Subterfuge" (Cloaking ×5), Föderations-Perk (×2 wenn ein Mitglied die Tech hat). Nicht gewählte Karten wandern zurück in den Stapel — eine abgelehnte Tech kommt später wieder, ist aber bis dahin **gesperrt**. Seltene (rote) und gefährliche (violette) Techs sind als solche markiert.

**Kosten:** Forschungsproduktion × Zeit; Tech-Kosten steigen mit der **Empire Size** (Reichsgröße verteuert Fortschritt — Bürokratie-Malus). Die eigentliche strategische Währung ist die **Alternativen-Zahl**: mehr Alternativen = mehr Kontrolle über die Richtung.

**Nutzen kurz/lang:** Kurzfristig erzwingt das System Opportunismus (die beste Tech ist die, die du ziehen kannst); langfristig verhindert es den „Golden Path" — kein zwei Spiele laufen dieselbe Tech-Sequenz. Der Gewichtungsmechanismus macht **Personalpolitik zur Forschungspolitik**: Ein Rats-Wissenschaftler mit „Expertise: Particles III" macht Partikel-Techs nicht nur schneller (+50 %), sondern **wahrscheinlicher gezogen** (×1,75).

**Gewinner/Verlierer:** Gewinner: Reiche mit hohen Alternativen und passenden Experten (Inquisitive-Trait: +1 Alternative, +2/4/6 % Forschungstempo). Verlierer: Reiche mit „Narrow-Minded"-Forschern (−5 % Tempo, **−1 Alternative** auf Stufe II) — ein einzelner falscher Minister verengt die nationale Innovationspipeline. Das ist die eleganteste Spiel-Umsetzung von „Personal ist Politik".

**Zweitrundeneffekte:** (1) Das Karten-System erzeugt einen **Tech-Markt unter Imperfektion**: Man kann nicht „KI" erforschen, man kann nur die Wahrscheinlichkeit erhöhen, sie zu ziehen — über Experten, Civics, Föderationen. (2) Tech-Sharing über Föderationen macht Bündnisse zur Wissensallianz. (3) Gefährliche Techs (violett) als bewusstes Risikoangebot.

**Übernahme für Staatsräson:** Unser Forschungsdesign sollte **keinen sichtbaren Baum** bekommen (das ist Civ), sondern ein **Agenda-Deck**: Modernisierungsleitern rücken als „Forschungsagenden" nach, gewichtet durch Minister-Persönlichkeit (PERSONEN.md), Bürokratie-Kapazität, Zustand der Unis und Druck der Interessengruppen. Eine abgelehnte Agenda kommt später wieder — mit veränderten Gewichten. Der Wissenschaftsminister mit „Narrow-Minded"-Analogie (ideologischer Technokrat) verengt das Deck — die Türkei-Realität von YÖK-Reformen und Universitäts-Personalpolitik lässt sich so spielbar machen, ohne Namen zu nennen.

### 4.2 Wissenschaftler-Persönlichkeiten (Leader-Traits)

**Funktionsweise:** Wissenschaftler sind benannte Leader mit Leveln, Klassen (Explorer/Scholar/Analyst/Statistician) und Traits, die wirken, je nachdem **wo sie eingesetzt sind** (Forschungsschiff, Kolonie, **Reichsrat**). Ratseinsatz-Beispiele: „Spark of Genius" +3/6 % Forschungstempo und höhere Chance auf seltene Techs; Expertise-Traits +15/30/50 % Tempo und +25/35/75 % Options-Chance in ihrem Feld; „Great Researcher" pauschal +10 %. Negativtraits: Paranoia −5/10 %, Narrow-Minded −1 Alternative. Technokratie-Civic: Wissenschaftler starten mit zufälligem Expertise-Trait.

**Kosten:** Leader-Rekrutierung (Energie/Einfluss), Leader-Kapazität, und Opportunität: derselbe Wissenschaftler kann nicht gleichzeitig Anomalien erforschen und im Rat sitzen.

**Nutzen:** Personengebundene Prozentboni, die über Jahrzehnte wirken — der **Humankapital-Zinseszins in Person**.

**Gewinner/Verlierer:** Wer seine besten Köpfe im Rat parkt, verliert die Exploration; wer sie draußen lässt, verliert den Reichsbonus. Verlierer-Mechanik: Leader altern/sterben — der Nachruf auf den Star-Forscher ist ein eingebauter Generationswechsel.

**Übernahme für Staatsräson:** Direkt übertragbar auf unser Minister-/Bürokratiesystem: **TÜBİTAK-Präsident, YÖK-Vorsitz, MEB-Minister als benannte Figuren mit Traits** (aus PERSONEN.md), deren Zuteilung messbare Effekte auf die Wissenschaftsleitern hat. Und die Verlierer-Seite schreibt sich von selbst: Der beste Wissenschaftler, den das System nicht bindet, wandert ab (Brain Drain) — der Trait „arbeitet jetzt für den Rat eines anderen Reiches".

### 4.3 Unity und Traditionen: Kultur als Reichsidentität

**Funktionsweise:** **Unity** (Einheit) ist die Kultur-Analogon-Ressource, produziert von Monumenten, Tempeln, Bürokraten u. a. Sie kauft **Traditionen**: Bäume à 5 Traditionen plus Adoptions- und Abschlussbonus; jedes Reich darf maximal **7 Bäume** (von ~14). Der Preis jeder Tradition **steigt mit der Zahl bereits gekaufter Traditionen** und mit der Reichsgröße — der siebte Baum ist ungleich teurer als der erste. Abschluss eines Baums = Slot für ein **Ascension Perk** (max. 8; der achte über die seltene Tech „Ascension Theory"). Ascension-Perks sind spielverändernde, **unwiderrufliche** Identitätsentscheidungen (psionischer/biologischer/synthetischer Aufstieg, Galactic Wonders für Megastrukturen).

**Kosten:** Unity-Produktion konkurriert mit anderen Verwendungen (Edikte, Anführer); die steigende Preiskurve ist der eingebaute Spezialisierungsdruck.

**Nutzen kurz/lang:** Traditionen sind die **Verfassung des Spielstils** — kleine, permanente Boni, die sich zu einer Identität akkumulieren. Langfristig entscheiden die 7 Bäume mehr über das Reich als jede Einzeltech.

**Gewinner/Verlierer:** Gewinner: klar profilierte Reiche. Verlierer: wer Bäume anreißt und nie abschließt (kein Perk-Slot) — **Halbfertigkeit wird bestraft**, eine seltene und wertvolle Design-Entscheidung. Und wer 14 will, verliert: Die harte 7er-Grenze erzwingt **Verzicht als Identität**.

**Zweitrundeneffekte:** Unity-Gebäude sind zugleich Zufriedenheits-/Ethik-Infrastruktur — Kultur- und Stabilitätspolitik teilen sich Gebäude. Die Preiseskalation macht späte Identitätswechsel prohibitiv teuer (Pfadabhängigkeit).

**Übernahme für Staatsräson:** Das ist das beste bekannte Modell für unsere **Nationalprojekt-/Identitätsleisten** (vgl. ENTSCHEIDUNGEN.md „Das Reich"): Statt frei kombinierbarer Einzelboni gibt es **Traditions-Bäume** (z. B. „Bildungsrepublik", „Kulturerbe-Nation", „Technologischer Sprung", „Diaspora-Netzwerk"), je 5 Stufen, wachsender Preis in Verwaltungskraft/Politischem Kapital, Abschluss schaltet einen **Staatsräson-Perk** frei (z. B. „Dizi-Softpower-Maschine", „Nobelpreis-Ambition"). Harte Obergrenze (z. B. 5 Bäume pro Spielzeit) = Verzicht als Profil. Halbfertige Bäume ohne Abschluss = verbrannte Verwaltungskraft — exakt das Risiko realer Reformanfänge ohne Fortsetzung.

**Quellen Abschnitt 4:** stellaris.paradoxwikis.com/Technology (Karten, Gewichte, Beispielrechnung 26,5/13,3/60,2 %); stellaris.paradoxwikis.com/Scientist_traits (alle Trait-Zahlen); stellaris.paradoxwikis.com/Traditions (7 Bäume, 5 Traditionen, Kostenformel); stellaris.paradoxwikis.com/Ascension_perks (max 8, Ascension Theory); cbr.com (14 Bäume seit 3.6 Orion); gamingonlinux.com (2017er Dev-Diary: 7 Basisbäume).

---

## 5. Europa Universalis IV — Monarch Points und das berühmte Trilemma

### 5.1 ADM/DIP/MIL: eine Währung für alles

**Funktionsweise:** EU4 hat keine Forschungsproduktion, sondern **Monarch Points** in drei Farben (Administrativ/Diplomatisch/Militärisch), die monatlich aus Monarch (0–6 je Attribut), Basis (3) und Beratern (+1 bis +3 je Beraterlevel) fließen. Dieselben Punkte bezahlen **alles**: Technologie-Stufen (max. 32 je Farbe, Basiskosten ca. 600 Punkte [unverifiziert], verteuert bei Vorlauf vor dem historischen Jahr), **Ideen** aus Ideengruppen (pauschal **400 Punkte je Idee**, 7 Ideen + Abschlussbonus je Gruppe), **Development** (Provinzentwicklung per Klick: Steuer/Produktion/Manpower, Basiskosten 50, steigend mit Provinzgröße: +3 % je Entwicklungspunkt über 10), dazu Coring, Generäle, Stabilität, Kriegsentschädigungen. Alle 3 freigeschalteten Ideen aktivieren die nächste **Nationalidee**.

**Kosten — das Trilemma:** Ein Punkt kann nur einmal ausgegeben werden. Die ewige Debatte der EU4-Community „Tech oder Ideas oder Dev?" ist die reinste Form unserer Kernfrage: **Was kostet Fortschritt? Alles andere.** Berater sind der Engpass-Multiplikator: Ein Level-3-Berater kostet spürbar Geld/Monat und liefert +3 Punkte/Monat — **Geld wird in Fortschritt übersetzbar**, aber über den Umweg Personal.

**Nutzen kurz/lang:** Tech: Freischaltungen (Einheiten, Gebäude, Regierungsreformen) zu festen Stufen; Ideen: permanente Reichs-Boni (die „DNA" des Spielzugs); Development: direkte, sofortige und **dauerhafte** Verstärkung der Provinz (Steuerbasis, Handelsgüter, Rekruten). Kurzfristig gewinnt Dev (sofortige Rendite), langfristig gewinnen Ideas (Prozent-Multiplikatoren) — und wer Tech verschläft, verliert Kriege.

**Gewinner/Verlierer:** Gewinner: Spieler, die Punkte-Aggregation timen (Tech genau dann kaufen, wenn der Vorlauf-Malus wegfällt). Verlierer: Reiche mit schwachem Monarchen (0/1/1-Herrscher = Generation des Rückstands) — **EU4 macht die Qualität der Staatsspitze zur Schicksalslotterie**, die man mit Beratern teuer kompensiert. Der Verlierer ist immer die nicht gewählte Option.

**Zweitrundeneffekte:** (1) **Innovativeness** (seit 1.25): Wer Techs/Ideen als Erster kauft, sammelt Innovationskraft, die dauerhaft alle Punktkosten senkt — ein direkter Bonus aufs Erste-sein, der „Originalforschung" gegen „Abschreiben" bepreist. (2) Development-Klicks geben **Institutions-Fortschritt** (s. 5.2): Provinzausbau ist zugleich Wissensinfrastruktur — „Development als Schulbau". (3) Horrorszenario Horden: Plündern zerstört fremdes Development und wandelt es in eigene Punkte um — Wissenssystem als Kriegsbeute.

**Übernahme für Staatsräson:** Unser Politisches Kapital + Verwaltungskraft + Haushalt sind bereits ein Dreiklang; EU4 schärft die **Allokations-Ehrlichkeit**: Jede Reform, jede Provinzinvestition, jede Prestige-Tech (Raumfahrtagentur!) muss aus **derselben** sichtbaren Punkte-Kasse kommen, damit der Spieler das Trilemma fühlt. Konkret: „Bildungsreform (400 VK)", „Provinzentwicklung Şanlıurfa (50 VK × Stufe)", „Technologiestufe Hochgeschwindigkeitsnetz (600 VK)". Und Innovativeness als Metrik: Pioniermacht in einer Technologie (Bayraktar-Moment) senkt dauerhaft Folgekosten im selben Feld.

### 5.2 Institutionen: Wissen breitet sich geografisch aus

**Funktionsweise:** Sieben **Institutionen** (Feudalismus, Renaissance, Kolonialismus, Buchdruck, Globaler Handel, Manufakturwesen, Aufklärung) erscheinen zu historischen Zeitpunkten **an einem konkreten Ort** (Renaissance ~1450 in einer italienischen Provinz mit 20+ Development) und **diffundieren über die Karte** — schneller in hoch entwickelte Provinzen, über Grenzen bei positiven Beziehungen, über eine Seazone hinweg; wer eine Provinz per Development-Klick ausbaut, gibt ihr sofortigen Fortschritt auf eine fehlende Institution. Ab 10 % Verbreitung im eigenen Development kann man die Institution für Dukaten **umarmen** (Kosten skalieren mit dem Development-Anteil ohne Institution) — das gibt einen dauerhaften Bonus (Renaissance: −5 % Development- und Baukosten) und löscht den Malus. Der Malus wächst: **+1 % Tech-Kosten je Jahr** ohne Umarmung, bis zu institutionspezifischen Deckeln (Feudalismus 50 %, Renaissance 20 %).

**Kosten:** Umarmung = viele Dukaten für große Reiche; alternativ jahrelanger Malus; alternativ gezieltes „Dev-Pushen" einer Provinz als Brutkasten (der berühmte „Institution forcieren"-Spielzug).

**Nutzen:** Der Spieler **sieht Wissen wandern** — als Prozentbalken pro Provinz, als Farbe auf der Karte. Aufholen ist keine Zeitfrage, sondern eine Infrastruktur- und Geldfrage.

**Gewinner/Verlierer:** Gewinner: Hoch-Development-Zentren (Europa). Verlierer: Peripherie — **geografische Wissensungerechtigkeit als Mechanik**, exakt unser Thema (81 Provinzen, Ost-West-Gefälle). Der Umarmungs-Preis macht große, rückständige Reiche doppelt zu Verlierern (teurer UND langsamer).

**Zweitrundeneffekte:** Beziehungen wirken auf Diffusion (Wissen folgt Freundschaft); Gebäude **Universities** senken lokale Development-Kosten (−20 % [unverifiziert]) und beschleunigen so indirekt die Institution — Universitätsbau ist der einzige Hebel, der aktiv Wissen ins Land holt.

**Übernahme für Staatsräson:** **Das ist die Blaupause für unsere Modernisierungsleitern in Provinzauflösung.** Eine „Institution" (z. B. Breitband-Ökonomie, MINT-Pipeline, Batterie-Wertschöpfung, Präzisionslandwirtschaft) entsteht an einem Ortskern (İstanbul/Ankara/İzmir-Cluster) und diffundiert über die 81 Provinzen — Geschwindigkeit skaliert mit Provinz-Development (Infrastruktur, Schulqualität, Universität vor Ort), gesteuert über Beziehungs-/Handelsverbindungen zwischen Provinzen. Der Spieler kann sie **umarmen** (landesweite Regulierung/Förderung, teuer) oder **brüten** (Technopark in Gaziantep gezielt hochziehen = Dev-Klick). Die Ostprovinzen ohne Universität bleiben diffusionsarm — Brain Drain als Abfluss entlang der Diffusionskanten Richtung Kern und Ausland. Das macht unseren bestehenden Satz aus PROJEKTPLAN.md wahr: „Das Netz ist regional … ein Regler allein genügt nicht."

**Quellen Abschnitt 5:** thegamer.com/europa-universalis-4-eu4-absolute-beginners-guide-how-to-play/ (Tech-Stufen 32, Ideen 400, Embrace-Mechanik); store.steampowered.com Dev-Diary 1.18 (Institutionen: +1 %/Jahr Malus, 10 %-Schwelle, Boni/Mali 50/20 %, Auftrittsbedingungen Renaissance); steamah.com (Dev-Kosten +3 % über 10); eu4.paradoxwikis.com/Modifier_list (technology_cost, embracement_cost, innovativeness_gain); en.wikipedia.org/wiki/Europa_Universalis_IV (Institutionen-Überblick); fandomspot.com (Toskana −10 % Dev/−5 % Tech).

---

## 6. Victoria 3 — Bildung als Alphabetisierung, Wissenschaft als Innovation+Spread

### 6.1 Innovation und Universitäten

**Funktionsweise:** Drei Forschungsbäume (Produktion, Militär, Gesellschaft), **eine aktive Forschung gleichzeitig**. Die Währung **Innovation** fließt wöchentlich: Basis 50 + Ausstoß der **Universitäten** (Gebäude: 1–2 Innovation je Stufe je nach Produktionsmethode, skaliert mit Beschäftigung und Durchsatz; Universitäten brauchen Papier — vgl. die Papierfabrik-Vorbereitung als eigene Wertschöpfungskette). Es gibt eine **Investitions-Obergrenze**: max. Punkte pro Woche auf die aktive Tech = **50 + 1,5 × durchschnittliche Alphabetisierung** (Beispiel: 60 % Literacy → Cap 140; Firmenbonus Philips +15, Machtblock-Prinzip „Advanced Research III" +5 je Bildungsinstitutions-Stufe). Tech-Kosten je Ära: 7.500 / 10.000 / 12.500 / 15.000 / 17.500 Punkte, plus Aufschlag je unerforschter Tech früherer Ären **im selben Baum** (Springen wird bestraft).

**Kosten:** Universitäten sind teure Gebäude mit Facharbeiter-Bedarf (Akademiker) und Input (Papier) — Innovation frisst **Gebäudeplätze, Absolventen und laufende Subventionen**, nicht abstrakte Punkte. Der Cap macht **Alphabetisierung zur wahren Forschungswährung**: Über 140 hinaus kann ein Analphabetenreich gar nicht investieren, egal wie viele Unis es baut.

**Nutzen kurz/lang:** Techs schalten Produktionsmethoden, Gesetze, Einheiten frei — sofort spürbar. Langfristig zahlt die Literacy-Investition über Jahrzehnte doppelt: höherer Innovation-Cap **und** (s. 6.2) schnellerer Spread **und** bessere Qualifikationen für Arbeiter (Berufswechsel).

**Gewinner/Verlierer:** Gewinner: früh alphabetisierte Länder (Skandinavien-Effekt). Verlierer: Agrarreiche mit 20 % Literacy — deren Universitäten produzieren Innovation, die **über dem Cap verfällt**. Das ist die schärfste bekannte Modellierung von „ohne Basisbildung kein Spitzenforschungsland".

**Zweitrundeneffekte:** Über-Cap-Innovation und ungenutzte Innovation fließen in **Technology Spread** (6.2) — nichts verfällt völlig, aber ohne Steuerung. Zufriedene Interessengruppen geben Forschungstempo: Industrielle +10 % Produktionstechs, Streitkräfte +10 % Militär, Intelligenzija +10 % Gesellschaft (je verdoppelt, wenn die Gruppe mächtig ist) — **Forschungspolitik ist Gesellschaftspolitik**.

**Übernahme für Staatsräson:** Die Cap-Formel ist direkt übertragbar: **Forschungsinvestitions-Cap = f(PISA-Stand/Lehrerqualität)**. Der Haushalt-Regler „Bildung" erhöht nicht linear den Output, sondern hebt **die Obergrenze**, bis zu der Hochschul-/Forschungsausgaben überhaupt wirken — wer in der Türkei-Startlage 2028 (PISA 494/472/462, über OECD in Fen, unter OECD in Mathe) TÜBİTAK verdreifacht, ohne die Schulbasis zu heben, kauft verfallende Innovation. Und der Papier-Input der Vic3-Uni wird bei uns zur **Lehrer-Input-Kette**: Mehr Uni-Plätze ohne Lehrerausbildung = das dokumentierte Teacher-Shortage-Paradox (s. Democracy 4).

### 6.2 Technology Spread: der Aufhol-Kanal der Nachzügler

**Funktionsweise:** Neben der aktiven Forschung sammelt das Land je Woche und Baum Punkte auf eine **zufällige unerforschte Tech** — Stärke primär von der Alphabetisierung abhängig, plus Zufallsfaktor. Modifikatoren (Auswahl): Gesetz „Geschützte Rede" +25 %, „Zensur" −10 %, „Verbotene Opposition" −15 %; „Isolationismus" −15 %; Status „Unrecognized Power" −25 %; Interessengruppen-Traits (Rural Folk „Old Ways" −10/−20 %, Devout „Traditsye" −10/−20 %); Herrscher-Trait „Innovative" +10 %; Machtblock-Prinzip +5 % je Bildungsstufe.

**Kosten/Nutzen:** Kostenlos und ungesteuert — aber **steuerbar über Gesetze**: Pressefreiheit ist in Vic3 faktisch eine Forschungssubvention. Das ist eine der stärksten Design-Aussagen des Genres: **Freiheit produziert Wissen** — als nackte Zahl im Tooltip.

**Gewinner/Verlierer:** Gewinner: offene, alphabetisierte Nachzügler (Japan-Modell). Verlierer: Zensur-Regime — sie bezahlen Kontrolle mit Innovationsverfall; unanerkannte Mächte zahlen Status mit Spread-Malus (die Welt muss dich ernst nehmen, damit du ihr Wissen bekommst).

**Zweitrundeneffekte:** Da Spread auf eine zufällige Tech wirkt, füllt er genau die Lücken, die der Spieler strategisch nicht priorisiert hat — **Diffuse Bildung als Gegenmodell zur Eliten-Beeline**.

**Übernahme für Staatsräson:** **Technologie-Diffusion als passive Schicht unserer Modernisierungsleitern**, moduliert durch unsere realen Regler: Pressefreiheit (RSF 163/180, Score 27,94 — Startwert belegt in RECHERCHE_INNENPOLITIK), Internetsteuerung (Instagram 58,5 Mio. Nutzer vs. Sperren), akademische Freiheit, Diaspora-Rückkanäle. Wer Pressefreiheit beschneidet, senkt messbar den Spread auf alle Leitern — ein Preis, der im Spiel bisher nirgends eingepreist ist. Internationale Sanktionen/Isolationsstatus (CAATSA!) als Spread-Malus: **der S-400-Konflikt wird so zur Wissenschaftsfrage**.

### 6.3 Bildungssystem-Institution und Alphabetisierung

**Funktionsweise:** Alphabetisierung strebt pro Bevölkerungsgruppe (Pop) gegen deren **Education Access**: Basis +0,5 % je Wohlstandsstufe; Technologien (Rationalismus +1 %/Wealth, Akademie +0,5 %, Empirismus +0,5 %; „Pious Fiction" −10 %); Berufe mit Eigenzugang (Akademiker, Bürokraten, Geistliche +50 %; Clerks, Ingenieure +25 %); Dekret „Soziale Mobilität fördern" +25 %. Die **Bildungs-Institution** (Gesetz + Stufen 1–5, bezahlt aus der Institutionen-Kasse) addiert Zugang: Staatliche Schulen +12,5 % je Stufe, Religiöse Schulen +10 %, Privatschulen +0,5 %/Wealth. Übersteigt Literacy den Zugang, **sinkt** sie wieder (Absterben der Gebildeten) — ein Stock-Flow-Modell mit Verfall.

**Kosten:** Institution = laufende Bürokratie-Kosten je Stufe; Gesetzeswechsel (Schulgesetz!) ist ein politischer Großkampf mit Interessengruppen.

**Nutzen:** Dreifach: Innovation-Cap, Spread, **Qualifikationen** (Literacy steuert, welche Berufe Pops ergreifen können → welche Produktionsmethoden überhaupt betreibbar sind). Der dritte Kanal ist der tiefste: **Bildung entscheidet, ob deine Fabriken Arbeiter finden.**

**Gewinner/Verlierer:** Gewinner: Kinder zukünftiger Generationen — der Nutzen ist komplett verzögert. Verlierer: Geistliche (Religiöse Schulen stärken die Devout-IG), Landbesitzer (gebildete Pops verlassen die Landwirtschaft) — Vic3 lässt die Verlierer der Bildung **selbst politisch aktiv werden**, sie sabotieren das Schulgesetz.

**Zweitrundeneffekte:** Gebildete Pops werden politisch aktiver (höhere Erwartungen, Radikalisierungspotenzial) — **Bildung erzeugt Opposition**, das ehrlichste Bildungs-Nebenprodukt im Genre.

**Übernahme für Staatsräson:** Direkte Abbildung auf unsere Innenpolitik-Schicht: Education Access je Provinz (Wohlstand × Schulgesetz-Stufe × Dekrete wie „kostenlose Vorschule/Mittagessen/Transport" — Wirkung laut Recherche: Einschulung 1–3 J., PISA 8–15 J.), Literacy-Stock mit Verfall, Qualifikations-Gate für Wirtschaftssektoren (die Batteriefabrik in Kayseri braucht Techniker — keine Techniker ohne Meslek-lisesi-Pipeline). Und der Vic3-Verlierer-Effekt ist unser Bludisch-/Kopftuch-/İmam-Hatip-Konflikt in Mechanikform: **Das Schulgesetz ist ein Gesetzes-Großereignis** mit Gewinnern und saboteurischen Verlierern (vgl. Suzerain, Kap. 9).

### 6.4 Kunstakademien

**Funktionsweise:** Das Gebäude **Arts Academy** beschäftigt Akademiker (und je nach Methode weitere Berufe) und produziert das Luxusgut **Fine Art** für den Markt — Kultur ist bei Vic3 **Ware**: Angebot, Nachfrage, Preis, Export. Wohlhabende, gebildete Pops konsumieren Fine Art als Bedürfnis; Export schafft Devisen.

**Kosten/Nutzen:** Gebäude + Fachpersonal; Nutzen: Befriedigung von Oberschicht-Bedürfnissen (Zufriedenheit → weniger Radikale), Handelsgut, Beschäftigung für Akademiker (die sonst ins Ausland abwandern — Vic3 simuliert Pop-Migration inklusive Massenauswanderung aus Ländern mit niedrigem Lebensstandard: **Brain Drain ist bei Vic3 implizit eingebaut**).

**Übernahme für Staatsräson:** Kultur als **Wirtschaftssektor** statt als Bonus-Leiste: Die Dizi-/Film-/Spieleindustrie als produzierender Sektor (Input: Absolventen, Studio-Infrastruktur; Output: Konsumgut „Kulturprodukt", Exportgut, Soft-Power-Punkte — siehe Kapitel B). Vic3 beweist, dass man Kultur mit derselben Gebäude-Logik abbilden kann wie Stahl.

**Quellen Abschnitt 6:** vic3.paradoxwikis.com/Technology (alle Formeln: Cap 50+1,5×Literacy, Ära-Kosten, Spread-Modifikatoren, IG-Boni); vic3.paradoxwikis.com (Education access: +0,5 %/Wealth, Schulgesetze +12,5/+10 %, Berufs-Zugänge, Dekret +25 %); gamespew.com (Uni-Papier-Kette); thegamer.com/victoria-3-technology-tree-eras-best-spread/; Kunstakademie-Details teils [unverifiziert] (Gebäudebeschreibung aus Spielwissen, vor Implementierung gegen vic3.paradoxwikis.com/Building prüfen).

---

## 7. Hearts of Iron 4 — Forschung als knappe Slot-Kapazität

### 7.1 Forschungslots und Ahead-of-Time-Malus

**Funktionsweise:** Forschung läuft über **parallele Slots** (je nach Nation 2–3 für kleine Staaten, Majors mehr, erweiterbar über Nationale Foki um 1–2; exakte Verteilung [unverifiziert]). Jede Tech hat eine Basisdauer in Tagen (Vielfache eines Standards von ~85 Tagen). Der zentrale Regler: **Ahead-of-Time-Malus — 200 % Forschungszeit-Strafe je Jahr Vorlauf** vor dem historischen Jahr. Atomtechnologie der 40er Jahre 1936 anzufangen, heißt: jahrelang ein Slot blockiert für minimalen Fortschritt. Zusätzlich existiert ein **Speicher-Trick** (bis zu 30 Tage „voraufgeforschtes" Guthaben pro freiem Slot) und Forschungsboni aus Foki (typisch 1–2 × 50–100 % auf eine Kategorie), die gezielt den Vorlauf-Malus neutralisieren.

**Kosten:** Der Slot ist die Währung — **Parallelisierung ist der Engpass**, nicht Geld. Ein dritter Slot per Fokus ist nach Community-Konsens mehr wert als +50 % Tempo, weil er die einzige wirkliche Multiplikation ist.

**Nutzen kurz/lang:** Kurzfristig: die richtige Tech zum Kriegsbeginn (Infanterieausrüstung II rechtzeitig). Langfristig: Doktrin-Bäume, die sich über Jahre verzinsen. Der Malus bestraft Sprünge — **Industriezeit ist historische Zeit**; man kann die Zukunft kaufen, aber zu horrendem Zins.

**Gewinner/Verlierer:** Gewinner: Planer, die Forschungsboni auf zeitkritische Vorlauf-Techs legen. Verlierer: kleine Nationen mit wenigen Slots (Paradox-Game-Director Arheo verteidigt öffentlich die Slot-Ungleichheit: „It *feels* bad to have less though" — und begründet sie mit Schneeball-Balance: Slot-Parität würde Minors zu stark machen). Das ist die seltene Stelle, wo ein Studio **Ungleichheit als Realismus-Feature** verteidigt.

**Zweitrundeneffekte:** Handelsgesetz „Freier Handel" −10 % Forschungszeit — Öffnung lohnt wissenschaftlich; Forschung ohne Produktionskapazität ist wertlos (die beste Panzer-Tech ohne Fabriken = 0) — **HOI4 koppelt Wissen strikt an Industrie**, kein Elfenbeinturm-Bonus.

**Übernahme für Staatsräson:** Unsere Modernisierungsleitern brauchen einen **Vorlauf-Malus**: KAAN-Serienreife oder SMR-Kernkraft ohne vorherige Stufen (Fachkräfte, Zulieferer, Regulierung) verteuert sich überproportional — aber Staatsprojekte mit „Fokus-Bonus" (Sonderprogramm mit Politischem Kapital, z. B. das reale Milli Teknoloji Hamlesi) können den Malus einmal neutralisieren. Und die Slot-Debatte ist unsere Bürokratie-Kapazität: **parallele Reformvorhaben sind hart begrenzt** (Verwaltungskraft), ein Slot mehr ist der teuerste Posten des Spiels — exakt die HOI4-Erkenntnis.

### 7.2 Spionage: Tech-Steal (La Résistance)

**Funktionsweise:** Geheimdienst-Aufbau: 5 Zivilfabriken über 30 Tage; Agenten (max. 10) mit individuellen Traits und Leveln; Netzwerk-Aufbau im Zielland; dann **Operationen**: „Steal Industrial/Military/Naval/Aviation Blueprints" — Erfolg gibt Forschungsboni/ Fortschritt auf Techs, die das Ziel hat. Trait „Safe Cracker": +25 % Effektivität, −25 % Risiko. Gescheiterte Operationen: Agent gefangen (30-Tage-Sperre für Ersatz), diplomatischer Schaden. Chiffre-Minispiel: Entschlüsselungsstärke akkumuliert gegen Kryptologie-Level des Gegners (Basis 12.000 Punkte Pool, +4.250 je Upgrade).

**Kosten:** Fabriken (Opportunität Kriegsproduktion!), Agenten-Zeit, Upgrades; Risiko: Blamage/Eskalation.

**Nutzen:** **Aufholen durch Diebstahl** — die asymmetrische Wissenschaftsoption des Rückständigen. Kurzfristig ein Boost; langfristig: Der Gedanke zählt — Wissen ist **exfiltrabel**, kein abstrakter Kontostand.

**Gewinner/Verlierer:** Gewinner: schwache Spione gegen starke Forscher (Umkehrung der Kraftverhältnisse). Verlierer: das bestohlene Land — sein Vorsprung ist eine Angriffsfläche. Zweitrunde: Gegenspionage bindet dieselben knappen Agenten — Sicherheit kostet Aufklärung und umgekehrt.

**Übernahme für Staatsräson:** Als **Industriespionage-Ebene** auf den Modernisierungsleitern: MİT-Operationen (reale Referenz ohne Namensnennung) können Vorlauf-Mali auf einzelnen Leitern kaufen; Gegenoperationen der Partner (Vertrauen-Dimension sinkt bei Entdeckung) koppeln das an die Beziehungsmatrix. Wichtig fürs Lernkonzept: Die Mechanik zeigt dem Spieler, *dass* technologischer Vorsprung verteidigt werden muss (F&E-Sicherheit als Politikfeld).

### 7.3 Wissenschaftler-Räte: Design Companies und MIOs

**Funktionsweise:** **Design Companies** (z. B. ein Panzer-Konstruktionsbüro) werden gegen Politische Macht angeheuert und geben prozentuale Forschungs-/Produktionsboni auf eine Einheitenklasse [Kosten/Niveaus: unverifiziert, historisch 150 PP]. Mit „Arms Against Tyranny" wurden sie zu **Military Industrial Organizations (MIOs)**: Organisationen, die **mit deiner Produktion leveln** — je mehr du bei ihnen baust, desto mehr Boni (Forschungstempo, Effizienz, Spezialfähigkeiten) schalten sie frei [Detailwerte: unverifiziert].

**Kosten/Nutzen:** Politischer Preis + Pfadbindung: Wer bei einem MIO investiert, baut eine **industrie-politische Beziehung** auf — Wechsel kostet gelevelte Boni. Das ist die institutionalisierte Version von Stellaris' Wissenschaftler-Traits: **Institutionen statt Personen**, mit Lernkurve.

**Gewinner/Verlierer:** Gewinner: konsistente Doktrin. Verlierer: Doktrinwechsler — das System macht **Strategiewechsel teuer** (Konsistenz-Prämie). Zweitrundeneffekt: MIO-Level gehen bei Kriegsverlust/Annexion verloren oder wechseln den Besitzer — Industriewissen als Beute.

**Übernahme für Staatsräson:** Perfekte Vorlage für unseren Rüstungs-/Industriepart (vgl. VERBESSERUNGSPLAN MIL-4, Produktions-Effizienz): **ASELSAN/TAI/Baykar/Roketsan als MIO-artige Organisationen** mit Leveln, die durch Vergabe wachsen; Umschwenken auf ein neues Triebwerks-Konsortium kostet eingespielte Boni. Gleiche Logik zivil: TÜBİTAK-Institute, die mit Förderung leveln — institutionelles Gedächtnis statt abstrakter Forschungspunkte.

**Quellen Abschnitt 7:** hoi4.paradoxwikis.com/Research (200 % AOT je Jahr); hoi4.paradoxwikis.com/Operatives + /Intelligence_agency (Agentur 5 Fabriken/30 Tage, max. 10 Agenten, Steal-Operationen, Kryptologie 12.000/4.250, Safe Cracker ±25 %); paradoxinteractive.com (La-Résistance-Pressemitteilung); gaming.stackexchange.com/questions/308281 (AOT-Minmaxing, Speicher-Trick 30 Tage, Freier Handel −10 %); admin-forum.paradoxplaza.com (Arheo zur Slot-Ungleichheit); MIO-Details [unverifiziert].

---

## 8. Democracy 4 — Bildung und Wissenschaft im Kausalnetz

### 8.1 Education als Simulationsgröße mit Zeitkonstante

**Funktionsweise:** „Education" ist eine Simulationsgröße 0–100, gespeist aus Policies: **State Schools** (Großausgabe: in den USA-Startdaten die zweitteuerste Position nach Militär bzw. Pensionen), **University Grants**, **Adult Education Subsidies**, **Technology Colleges**, **Compulsory Foreign Language Classes**, Secularity of Schools u. a. Die Wirkungen laufen über das Kausalnetz mit **Trägheit** (Effekte bauen sich über Quartale auf): Education → **Productivity** → **GDP**; Education → weniger Crime, weniger Unemployment, gegen **Skills Shortage**; Fremdsprachen → International Trade + Foreign Investment (mit Patriot-Verärgerung als Gegenkante). Belegte Beispielrechnung aus einem Durchlauf: Produktivität +24 %, Gesundheit +28 %, Tourismus +27 % nach konsistenter Sozial-/Bildungsinvestition über eine Legislatur.

**Kosten:** Geld (State Schools = Top-3-Haushaltsposten) + **Politisches Kapital je Regleränderung** + Trägheitszeit. Wer den Kredit-Downgrade erleidet und die Schulen kürzt (dokumentierter Spielverlauf), kauft kurzfristig Haushaltsruhe mit langfristigem Produktivitätsverfall — das Spiel lässt beides passieren und zeigt beides im selben Graphen.

**Nutzen kurz/lang:** Kurzfristig: fast nichts Sichtbares außer Kosten und Wählergruppen-Reaktionen. Langfristig: GDP-Compound über Productivity; Situations verhindern (s. 8.2). D4 ist damit das **reinste Lag-Modell** des Genres: Bildung ist die Policy, deren Nutzen der aktuelle Amtsinhaber fast nie selbst erntet.

**Gewinner/Verlierer:** Gewinner: Folgeregierungen (und der Spieler über die Zeitachse). Verlierer: die Steuerzahler jetzt; Lehrer bei Kürzung (**Teacher Shortage** und **Teachers Strike** als rote Situationen); und per dokumentiertem Kausalitätshack: **University Grants verschärfen kurzfristig den Lehrermangel** — mehr Studierende binden Akademikerkapazität. Das ist der schönste Zweitrundeneffekt unseres gesamten Themas: **Expansion der Hochschulbildung kannibalisiert die Schulbildung**, solange die Lehrerpipeline nicht mitwächst.

**Zweitrundeneffekte:** Über Achievements spiegelt das Spiel die Pole: „Academic Paradise" (Education > 85 %, Science Funding > 80 %, Adult Education > 66 %, weltliche Schulen > 95 %, keine Lehrer-Probleme — über 4 Turns) vs. „Ignorance Is Bliss" (Education < 35 %, Science Funding < 25 %, **kein** Space Program, kein Mars Program — 4 Turns). Bildung ist in D4 **Identitätspolitik**, nicht nur Wirtschaftspolitik.

**Übernahme für Staatsräson:** Das ist unser direktes Vorbild (bereits in MECHANIKEN.md verankert) — die Vertiefung liefert drei Präzisierungen: (1) **Trägheit als sichtbare Zahl** („wirkt voll in 12 Quartalen") statt versteckter Verzögerung; (2) das **Teacher-Shortage-Paradox** als Standard-Zweitrundeneffekt all unserer Bildungs-Upgrades (Imam-Hatip-Ausbau vs. Fen-lisesi-Ausbau vs. Lehrerausbildung müssen konkurrieren); (3) Fremdsprachen-/Auslandssemester-Policies als Brücke zwischen Bildung und Außenwirtschaft (Erasmus-Effekt: D4 patchte EU-Staaten ein Erasmus-Programm mit Jugend-Einkommen + Bildung — ein realer EU-Mechanismus, direkt übertragbar auf unsere EU-Beziehungsdimension).

### 8.2 Science Funding, Space Program, „Technological Advantage"

**Funktionsweise:** **Science Funding** (Forschungsförderung-Regler) und **Technology Grants** treiben die Simulationsgröße Technology → Productivity/GDP; **Space Program** und **Mars Program** sind teure Prestige-Policies mit Technologie-Bonus (und Patriot-/Prestige-Effekten; im Achievement „Intergalactic Socialism" mit Sozialismus kombinierbar — Raumfahrt als ideologieübergreifendes Prestige). Über Schwellenwerte triggern **Situationen**: „**Technological Advantage**" (grün: GDP- und Produktivitätsbonus — laut Entwicklerblog die **meistgetriggerte Situation des gesamten Spiels**, später verschärft, weil zu leicht erreichbar), „**Skills Shortage**" (rot: GDP-Bremse, entsteht bei Bildungslücke), „**Brain Drain**" (rot: Abwanderung bei niedrigen Löhnen/Steuerdruck auf Hoheinkommen [Situation im Franchise-Bestand belegt; D4-Ausprägung: unverifiziert]), „High Productivity" (grün), „Tourism Boom" (grün).

**Kosten:** Space Program = teure Dauer-Policy mit geringem Kurzfrist-Output — der klassische Prestige-Kauf (Vergleich reale Debatte um die Türkische Raumfahrtagentur TUA, 2018 gegründet [unverifiziert, Jahr prüfen]).

**Nutzen:** Der **Situations-Mechanismus** ist die eigentliche Lektion: Der Zustand „technologischer Vorsprung" ist kein Reglerstand, sondern ein **diskretes, benanntes Ereignis mit eigenem Icon und eigenem Text**, das der Spieler erreicht oder verliert. Unsichtbare Akkumulation wird in einen sichtbaren Zustand übersetzt — die Antwort von D4 auf „wie macht man Zinseszins spielbar?".

**Gewinner/Verlierer:** Gewinner: Langzeit-Investoren. Verlierer: religiöse Wählergruppe bei Technology Grants (dokumentierter Nebeneffekt), Patrioten bei Fremdsprachen — D4 gibt **jeder** Wissenspolitik eine kulturelle Gegenkante.

**Übernahme für Staatsräson:** Unser Politiknetz hat Situationen bereits; die Vertiefung liefert den konkreten Katalog: **„Technologischer Vorsprung"** (grün, Schwellenwert aus Forschungs-Cap × Unis × Brain-Drain-Gegenrate), **„Fachkräftelücke"** (rot — existiert als Problem „Abwanderung von Fachkräften", jetzt mit Vic3-Literacy-Gate begründet), **„Raumfahrtprestige"** (TUA/Türksat-Programm als teurer, sichtbarer Prestige-Kauf mit Technologie-Nebenertrag — anschlussfähig an GROSSPROJEKTE.md).

**Quellen Abschnitt 8:** magazine.proqet.com (kompletter US-Spielverlauf mit Ausgabenrangfolge, Produktivität +24 %, University Grants 11,7 Mrd.); forums.positech.co.uk/t/16334 (Achievements Academic Paradise / Ignorance Is Bliss / Intergalactic Socialism); positech.co.uk/cliffsblog (Technological Advantage = meistgetriggerte Situation; Patch: EU/Erasmus, Situation schwieriger); forums.positech.co.uk/t/17341 (Teacher-Shortage-Paradox); democracygame.fandom.com (Situationsliste Brain Drain, Skills Shortage, Tourism Boom, High Productivity); steamcommunity.com Changelist (Trigger-Verschärfung).

---

## 9. Suzerain — Bildung als Ereigniskette, Kultur als Konflikt

### 9.1 Bildungsreform: Privatisierung vs. Qualität

**Funktionsweise:** Suzerain hat **keine Zahlenleisten für Bildung** — Bildungspolitik ist eine verzweigte **Ereignis-/Gesetzeskette**: Der Spieler entscheidet über Privatisierung von Schulen (Budget-Entlastung, Qualitäts-/Zugangsrisiken — dokumentierter Entscheidungspunkt „will not privatize education" mit Begründung „risks widening educational disparities"), über Bildungsbudget-Punkte (harte, knappe Währung: typisch 1–3 Budget-Punkte je Großentscheidung) und über Reform-Gesetze. Die Wirkungen erscheinen später als **Situationen im Tracker** (verbesserte/verschlechterte Bildung, Wirtschafts-Effekte am Spielende in der Epilog-Auswertung) und als Dialog-Reaktionen der Figuren.

**Kosten:** Budget-Punkte (die schmerzhafteste Währung des Spiels — Schulden sind möglich, aber folgenreich) plus **Koalitionskosten**: Reformen brauchen die Assembly; Kompromisse verwässern.

**Nutzen kurz/lang:** Kurzfristig: politische Reaktionen. Langfristig: Der Epilog rechnet vor, was die Bildungsentscheidungen aus der Wirtschaft gemacht haben — **die Abrechnung kommt nach der Amtszeit**, wie im echten Leben.

**Gewinner/Verlierer:** Gewinner: Privatwirtschaft/Konservative bei Privatisierung; Benachteiligte bei öffentlicher Qualitätsoffensive. Verlierer: jeweils die andere Seite — und der Spieler selbst, wenn er Wahlversprechen bricht (Suzerain speichert **Versprechen** als eigene Ressource).

**Zweitrundeneffekte:** Entscheidungen verketten sich über Figuren (Minister, Lobbyisten, Ehefrau!) — Bildungspolitik wird über **Beziehungen** verhandelt, nicht über Regler. Das Rizia-DLC ergänzt Dekrete mit drei Ressourcen (Authority/Budget/Energy) und verankert Universitäten in der Welt (Codex: „Toras Imperial University" mit Stipendien-Stiftung des Unternehmers Rusty Montoro — Philanthropie als Bildungs-Akteur). Eine „Konriana-Universität" ist in den Quellen **nicht belegt** — vermutlich Verwechslung; als [unverifiziert] zu streichen oder mit „United Contana/Lespia"-Lore zu ersetzen.

**Übernahme für Staatsräson:** Unser Suzerain-Vorbild bleibt die Entscheidungstiefe; die Vertiefung ergänzt: **Bildungsreform als mehrteilige Gesetzes-Saga** (YÖK-Reform, Müfredat, Zentralprüfung) mit Versprechens-Tracking gegenüber Wählergruppen, Budget-Punkten aus dem Haushalt-System und Epilog-Abrechnung (der 10-Jahres-Rückblick, den unser Zeitmodell in analyse/DESIGN_BESTANDSAUFNAHME.md bereits beschreibt: „Jahre: Bildung/Demografie/Institutionen").

### 9.2 Kulturpolitik als Konfliktlinie: das Bludisch-Verbot

**Funktionsweise:** Die **Unified Language Act / Unified Education Act** (sordische Einheitssprache in allen Institutionen) ist ein Gesetz mit realem Unterdrückungsgehalt: Es untersagt Bludisch als Unterrichts- und Predigtsprache (ohne Genehmigung des Erzpriesters) — die Community liest es einhellig als „attempt to suppress the Bludish language and thus Bludish identity, with the Bluds' education held hostage for their compliance". Die Blud-Frage läuft als eigener Meinungswert (Bludish opinion, im 3.0-Patch verschärft) und verknüpft Bildung, Minderheitenrechte, Sicherheit (BFF-Militanz) und Außenpolitik.

**Kosten/Nutzen:** Nutzen: nationalistische Zustimmung, administrative Vereinheitlichung. Kosten: Minderheiten-Radikalisierung, internationale Kritik, Radikalisierungs-Gegenschlag — Kulturpolitik als **Nullsummen-Identitätsspiel**, das in Sicherheit kippen kann.

**Gewinner/Verlierer:** Gewinner: nationalkonservative Wähler. Verlierer: die Minderheit (Bildung als Geisel), langfristig der Staat (Unruhe). Zweitrundeneffekt: Ein „harmoses" Verwaltungsgesetz wird zum Aufstandstreiber — die stärkste dokumentierte Warnung des Genres vor Sprachpolitik.

**Übernahme für Staatsräson:** Direkt übertragbar — und für die Türkei real geladen: **Kurdisch als Unterrichts-/Mediensprache** ist unser Äquivalent der Bludisch-Frage. Die Mechanik: Sprach-/Kulturpolitik als Gesetzesleiter (Verbot → Duldung → Wahlfach → gleichberechtigt), gekoppelt an Minderheiten-Zustimmung, Wählergruppen (Nationalisten ↔ Kurden), Sicherheitslage (Radikalisierungs-Druck) und die EU-Vertrauensdimension. Suzerain beweist, dass das ohne Zahlenfriedhof geht — drei Schieberegler-Stände und gute Texte. [Hinweis: sensible Modellierung, siehe LERNKONZEPT/Darstellungsregeln.]

**Quellen Abschnitt 9:** reddit.com/r/suzerain/1c0wcq3 (Privatisierungs-Entscheidung, Unified Language Act mit Begründungstext, Budget-Punkte); reddit.com/r/suzerain/16nt5v0 („suppress the Bludish language"); suzerain.fandom.com/wiki/Bill (Predigt-Genehmigung); reddit.com/r/suzerain/1bnjaim (3.0-Changelog: „Decreased starting Bludish opinion", Rizia-Ressourcen); neoseeker.com Rizia-Dekrete (Authority/Budget/Energy, Religions-Dekret mit Zustimmungsmatrix); codex.torporgames.com (Toras Imperial University); „Konriana-Universität": nicht gefunden → [unverifiziert].

---

## 10. Tropico 6 — Weltwunder-Heists und Kultur als Beute

**Funktionsweise:** Tropico 6 ersetzt Civs Wunder-Wettlauf durch **Heists**: Vier Raid-Gebäude (Pirate Cove, Commando Garrison, Spy Academy, Cyber Operations Center) erzeugen über Angestellte Raid-Punkte; damit schickt man Agenten los und **stiehlt Weltwunder** — 17 an der Zahl, von Stonehenge bis zum Weißen Haus, darunter die **Hagia Sophia** (Effekt: kein Bürger stirbt mehr an mangelnder Gesundheitsversorgung) und den **Registan von Samarkand** (Neugeborene erhalten High-School-Bildung). Weitere belegte Effekte: Brandenburger Tor (Besucher entwickeln keine extremistischen Ansichten), Taj Mahal (jeder Besucher spendet an die Staatskasse), Eiffelturm (Radio/TV senden inselweit + Tourismus), Neuschwanstein (Touristen bleiben länger, zahlen mehr), Große Pyramide (+50 % Bautempo aller Baumeister), Weißes Haus (Edikte halb so teuer).

**Kosten:** Raid-Gebäude + Personal + Raid-Punkte-Zeit; das Wunder muss danach auch **gebaut** werden.

**Nutzen kurz/lang:** Sofortige, dauerhafte, oft regelbiegende Spezialboni — Wunder als **Scherzartikel mit echter Mechanik** (Tropico-Humor: Soft Power per Piraterie). Tourismus-Rating und Entertainment steigen mit den meisten Wundern.

**Gewinner/Verlierer:** Der Witz ist die Verlierer-Seite: die bestohlenen Nationen (implizit) — Kultur als **Nullsummen-Beute**, die zynische Karikatur von Civs Themen-Museen. Gewinner: der Spieler mit der kürzesten Raid-Pipeline.

**Zweitrundeneffekte:** Wunder decken **Schwächen** ab (Hagia Sophia ersetzt das Gesundheitssystem, Brandenburger Tor ersetzt politische Stabilität) — Kulturgut als Pflaster für Politikversagen; und sie machen Tourismus unabhängig von echten Naturschönheiten.

**Übernahme für Staatsräson:** Der Heist ist als Mechanik zu zynisch für unseren Ton — aber die **Umkehrung** ist Gold wert: **Restitutions-Diplomatie**. Die Türkei führt real Restitutionsverfahren um anatolische Artefakte (Zeugma-Fresken, Bogazköy-Sphinx-Rückführung [Fälle bekannt, Detailbelege unverifiziert]). Im Spiel: „Artefakt-Rückholung" als Diplomatie-Minikette (Verhandlungstisch-Klausel „Rückgabe von Kulturgut"), deren Erfolg ein Museumsstück in unseren Erbe-Bestand einsortiert (neue Rubrik in `erbe.ts` naheliegend: „rückgeführte Objekte" mit Prestige- und Tourismuswert) — dieselbe Emotion wie Tropicos Heist, aber als **staatliche Seriösität**. Zudem: Tropicos „Wunder deckt Systemschwäche" warnt uns vor einem Designfehler — unsere Wunder (Reich-Bausystem) sollen **Multiplikatoren auf funktionierende Systeme** sein, keine Ersatzsysteme.

**Quellen Abschnitt 10:** supercheats.com (17 Wunder, Raid-Gebäude, komplette Effektliste); gamepressure.com/tropico-6/raids (Tabelle); thegamer.com/tropico-6-best-world-wonders (Ära-Empfehlungen, Brandenburger Tor = Stabilität); trueachievements.com (4 Heists parallel).

---

## 11. Anno 1800 — Einfluss als Kulturwährung, Forschung als Bevölkerungsschicht

### 11.1 Einfluss: die globale Ressource, die auch Propaganda bezahlt

**Funktionsweise:** **Einfluss** ist eine globale Ressource, gespeist aus Gesamtbevölkerung und Investoren-Zahl. Ausgaben sind **implizit gebündelt** in sechs Kategorien: Kultur (Zoo- und Museums-Items), Militär (Schiffe/Verteidigung), Handel (Handelsschiffe), Expansion (Inseln/Routen), Optimierung (Spezialitems) und **Propaganda**: Die **Zeitung** (periodische Ausgabe, drei editierbare Artikel) kostet Einfluss je gefälschtem/gebündeltem Artikel — Effekte: Konsumgüterverbrauch senken, Arbeitsnorm erhöhen, Verteidigungsbereitschaft, Konsumsteuer erheben. **Dauerpropaganda erhöht die Aufstandswahrscheinlichkeit** — Meinungsmache hat einen kumulierenden Preis.

**Kosten/Nutzen:** Einfluss wächst nur über Bevölkerungs- und Investorenaufbau — **Kulturkapital ist an Realwirtschaft gebunden**; wer die Zeitung zur Dauerbeschallung nutzt, zahlt mit Zufriedenheit. Kurzfristig: Krisen-Bonbons (Steuer per Zeitung). Langfristig: Die Kategorie-Bündelung macht jede Flottenexpansion zur Einfluss-Investition mit Schwellen-Boni.

**Gewinner/Verlierer:** Gewinner: große, ausgewogene Reiche. Verlierer: Propaganda-Süchtige (Aufstand) und reine Militär-Expander (Kategorie-Knappheit). Zweitrundeneffekt: **Zoo/Museums-Sets** — komplette Sammlungen geben Set-Boni: Kuration als Mechanik (wie Civs Themenbonus, aber für Artefakt-/Tiersets).

**Übernahme für Staatsräson:** Einfluss = unser **Politisches Kapital**, Annos Kategorien = unsere Politikfelder; die Zeitung mit Artikel-Kosten und Kumulations-Malus ist die präziseste Vorbild-Mechanik für unser Mediensystem (SPIELDESIGN.md: kontrollierte Medien berichten freundlicher, „aber ihnen wird weniger geglaubt") — Anno liefert die Dosierungsformel: Propaganda wirkt sofort, kostet Einfluss, und **ab einer Frequenz kippt sie** (Misstrauens-Stock statt linearer Abnutzung). Und die Set-Boni: Deckung mit unseren Serien/Pilgerrouten (Kap. 2.2).

### 11.2 Forschungsinstitut und Scholars (Land of Lions)

**Funktionsweise:** Die **Scholars** sind eine eigene **Bevölkerungsschicht** (hochverdichtete Wohnheime, eigene moderne Bedürfnisse — Radio!), freigeschaltet über die Enbesa-Kampagne (300 Elders). Sie erzeugen über Zeit **Forschungspunkte** (Menge/Geschwindigkeit skaliert mit Scholar-Zahl; zusätzlich kann man Items spenden: legendär = 50 Punkte). Das **Forschungsinstitut** — das dritte Monument des Spiels nach Weltausstellung und Luftschiffhafen, drei Bauphasen — tauscht Punkte gegen **gezielt ausgewählte Items** (statt Expeditions-Zufall) und gegen **Major Discoveries**: spielverändernde Effekte, z. B. **eine neue Fruchtbarkeit für eine Insel**.

**Kosten:** Monument-Bau (drei Phasen, Ressourcenketten), eine ganze Bevölkerungsschicht mit Luxusbedürfnissen — Forschung frisst hier **Stadtentwicklung**.

**Nutzen:** Ent-RNG-isierung des Endgames (Design-Antwort auf Spielerfrust) + gezielte Reich-Upgrades. Langfristig: Scholar-Ausbau ist der einzige Weg, die Punktedecke und -rate zu heben — **Bildung als einzige Forschungswährung**.

**Gewinner/Verlierer:** Gewinner: späte, breite Imperien. Verlierer: Rush-Strategien (Scholars brauchen die Enbesa-Vorleistung — kein Abkürzen). Zweitrundeneffekt: Item-Spenden konvertieren **Müll in Wissen** (Wirtschafts-Überschuss → Forschung).

**Übernahme für Staatsräson:** Die Scholars sind die spielbare **Akademiker-Schicht**: eine eigene Bevölkerungsgruppe (YÖK-Absolventen) mit eigenen Bedürfnissen (Gehälter, Freiheit, Auslandskontakte), die Forschungspunkte produziert — und **abwandert**, wenn die Bedürfnisse nicht erfüllt sind (Brain Drain als Schicht-Mechanik statt als Prozentzahl!). „Major Discoveries" = unsere Großprojekt-Freischaltungen durch Forschung (SMR, KAAN-Triebwerk): gezielt statt zufällig, aber erst nach Pipeline-Ausbau. Anno beweist: Eine Forschungsmechanik kann **komplett** auf einer Bevölkerungsschicht aufbauen — das ist unser PISA→Uni→Industrie-Pfad als Siedler-Logik.

### 11.3 Weltausstellung

**Funktionsweise:** Die **Weltausstellung** ist das erste Monument des Basisspiels (mehrere Bauphasen, große Kosten, Zeit) und hostet danach periodische **Expos** mit wählbaren Themen (z. B. Landwirtschaft, Wissenschaft), die je nach Vorbereitung Belohnungen (Items, Boni) liefern [Detailwerte: unverifiziert]. Prestige-Objekt mit Dauernutzen.

**Übernahme für Staatsräson:** **EXPO/ Großereignis als wiederkehrendes Reich-Event** (die Türkei hat reale Erfahrung: EXPO 2016 Antalya; İstanbul war für EXPO 2020 im Rennen [unverifiziert Details]) — ein vorbereitungsintensives Großereignis, das Ansehen (Beziehungsmatrix: Vertrauen), Tourismus und ein thematisches Paket (Wissenschafts-Expo → Innovations-Boost) liefert, bei schlechter Vorbereitung aber zum Prestige-Fiasko wird. Einordnung unter GROSSPROJEKTE.md.

**Quellen Abschnitt 11:** de.wikipedia.org/wiki/Anno_1800 (Einfluss, Zeitungspropaganda, Aufstandsrisiko); prodigygamers.com (sechs Einfluss-Kategorien); pcgamesn.com/anno-1800/land-of-lions-dlc-gameplay-preview (Scholars, Forschungsinstitut, Major Discoveries, drittes Monument); butwhytho.net (Scholar-Punkte, Item-Spende 50, 300-Elders-Freischaltung).

---

## 12. Old World / Humankind / Millennia — drei Design-Varianten (kurz)

### 12.1 Old World: das Technologie-Deck

**Funktionsweise:** Verfügbare Techs bilden einen **Kartenstapel**; bei jeder Forschungsentscheidung zieht der Spieler **4 Karten, wählt 1, legt 3 ab** — Abgelegtes kommt erst zurück, wenn der Ablagestapel neu gemischt wird (nach 3–4 weiteren Techs). Der Weg jeder Karte durch die Stapel ist **komplett transparent** (sichtbar, wann sie wieder drankommt). Designer-Begründung (Soren Johnson, Civ-IV-Chefdesigner): Es gibt „keinen Golden Path mehr", und jede Wahl wird schwerer, weil Nichtwählen die Tech real verzögert. Wunder belegen eine Kachel, geben Siegpunkte/Legitimität und wechseln mit der Stadt den Besitzer (Kultur als Kriegsbeute — bereits in RECHERCHE_KONKURRENZ_FACHBEREICHE vermerkt).

**Kosten/Nutzen/Gewinner:** Kosten: Opportunität der abgelegten Karten (die „nicht gewählte Zukunft"); Nutzen: wiederholbare Partien ohne auswendig gelernte Beeline; Gewinner: flexible Strategen; Verlierer: Planer — das System **bestraft** Routiniers absichtlich.

**Übernahme für Staatsräson:** Das **Reform-Deck**: Dem Spieler liegen je Legislatur nur 4–6 Reformkarten vor (gemischt aus Politiknetz, aktuellen Ereignissen, Minister-Agenden); nicht gewählte Reformen wandern unter den Stapel — das erzeugt die Suzerain-artige Erzählung „woran wir in dieser Amtszeit nicht gekommen sind" und verhindert Checklisten-Optimierung. Transparent bleibt, wann Karten zurückkehren (Lernkonzept-konform).

### 12.2 Humankind: Fame als einzige Siegwährung

**Funktionsweise:** Ein einziges Metaziel: **Fame**. Quellen: **Era Stars** (7 Kategorien — Einfluss, Technologie, Territorium, Geld, Kampf, Bevölkerung, Distrikte — je 3 Sterne mit Schwellen; 7 beliebige Sterne = Epochenaufstieg mit Kulturwechsel), Wunder (per Einfluss **beanspruchen** = exklusiv reservieren, dann als geteiltes Stadtprojekt bauen; +20 Stabilität/+100 Fame [Bestandsdatei]), Taten, Ereignisse. Höhere Sterne einer Kategorie geben **steigenden** Fame — Spezialisierung wird belohnt, Frühaufsteiger verlieren unwiederbringlich die Goldsterne der alten Epoche (Runaway-Leader-Dynamik, in der Community breit diskutiert).

**Kosten/Nutzen:** Die eigentliche Kostenfrage ist der **Epochenwechsel**: weiterziehen (Macht durch neue Techs/Einheiten) oder verweilen (Fame durch 3. Sterne) — ein explizites Macht-vs-Ruhm-Timing.

**Übernahme für Staatsräson:** Zwei Elemente: (1) **Wunder beanspruchen statt nur bauen** — die Ankündigung („Kanal İstanbul beschlossen") reserviert das Projekt weltexklusiv und erzeugt sofort Reaktionen (Beziehungsmatrix), lange bevor gebaut wird; (2) **Era Stars als Legislatur-Bilanz**: sieben Bilanzkategorien (Wirtschaft, Bildung/Wissenschaft, Kultur, Infrastruktur, Soziales, Sicherheit, Diplomatie) mit je 3 Schwellen — die Wahl-Debatte zeigt, in welchen Kategorien der Spieler „Sterne" geholt hat. Vorsicht: die steigende Sterne-Belohnung ist der dokumentierte Schneeball-Fehler — wir nehmen die **abflachende** Variante (s. Community-Debatte).

### 12.3 Millennia: Domänen-XP und Kultur als aktive Kräfte-Leiste

**Funktionsweise:** Mehrere **Domänen** (u. a. Regierung, Krieg, Entdeckung, Diplomatie, Ingenieurwesen, Kunst) sammeln **je eigene XP** durch passende Aktionen; XP kaufen domäneneigene Kräfte und Upgrades (die Regierungs-Domäne hat eigene Kräfte wie „Siedler erzeugen"). Daneben füllt sich eine nationale **Kultur-Leiste**; wenn sie voll ist, feuert der Spieler eine **Culture Power** — starke, sofortige Fähigkeiten (belegte Beispiele: ein **großer Forschungsboost** oder **alle laufenden Kriege sofort beenden**); die Leiste sammelt weiter im Hintergrund, auch wenn man nicht sofort auslöst (Timing-Freiheit). Regionen kosten Kultur-Upkeep — Kultur ist zugleich **Haltekosten-Währung des Reichs**. Religion entsteht als Option ab Zeitalter IV per Culture Power. **Ages** haben Varianten (Krisen-Alternativ-Zeitalter) [unverifiziert im Detail].

**Kosten/Nutzen/Gewinner:** Kultur ist hier keine passive Runde-zu-Runde-Ressource, sondern ein **Kondensator** — Geduld macht die Entladung größer. Verlierer: wer Regionen über die Kultur-Tragfähigkeit hinaus ausdehnt (Overextension als Kulturfrage!).

**Übernahme für Staatsräson:** Der **Kondensator** ist die eleganteste Lösung für unsere „Identität/Zusammenhalt"-Größe: Kulturpunkte sammeln (aus Erbe-Zustand, Festen, Bildung, Serien-Erfolgen), dann als **Kulturkraft** entladen — z. B. „Nationale Einigung" (Konflikt-Dimension mit Nachbarn ×0,8 für ein Jahr), „Akademischer Sprung" (Forschungsboost), „Willkommenskultur der Republik" (Minderheiten-Akzeptanz +). Und Millennias Overextension-Regel: **jede neue Großverpflichtung (81 Provinzen, Korridore, Pakte) kostet Kultur-Upkeep** — wer über sich hinaus expandiert, dem geht der Zusammenhalt aus.

**Quellen Abschnitt 12:** designer-notes.com/old-world-designer-notes-4-the-technology-deck (4-Karten-Regel, Golden-Path-Begründung, Transparenz); mohawkgames.com/oldworld/gameplay; pcgamer.com/humankind-fame-era-stars/ (7/21 Sterne, Wunder beanspruchen, Endbedingungen); community.amplitude-studios.com (steigende Stern-Fame-Debatte); culturedvultures.com (11 Fame-Quellen); wargamer.com/millennia/review (Kultur-Leiste, Forschungsboost/Kriegsende, Regierungs-Domäne); millennia.paradoxwikis.com/Resources (Kultur-Upkeep je Region, Kondensator); forum.paradoxplaza.com (Religion ab Age IV per Culture Power); reddit.com/r/millennia (Leiste sammelt weiter).

---

## 13. Power & Revolution — kulturelle Einflussnahme als Staatsaktion

**Funktionsweise:** Der „Geopolitical Simulator 4" (175 Länder, 600+ Datenelemente je Land, 1.000+ Aktionen) behandelt Kultur/Wissenschaft als ** diplomatische Aktionskategorie**: belegte Aktionen sind u. a. die Ausrichtung eines **internationalen Filmfestivals**, **Studentenaustausch-Programme**, ein **Kulturjahr** zu Ehren eines Gastlandes und **wissenschaftliche Kooperationsabkommen** (gemeinsame Forschung mit gepooltem Wissen und Geld), daneben transnationale Infrastruktur. Sprache, Religion und Zivilisationszugehörigkeit sind Simulationsfaktoren der Beziehungen (der Vorgänger bot das Szenario „Clash of Civilizations" mit acht Kulturblöcken). Die Engine wird von Organisationen **inkl. der NATO** für Schulung/Training genutzt — der Ernsthaftigkeits-Anspruch entspricht unserem.

**Kosten/Nutzen:** Diese Aktionen sind **billig und langsam**: sie verbessern bilateral relations über Zeit und erzeugen keinerlei Soforteffekt — Soft Power als Dauer-Aufgabe neben den harten Hebeln.

**Gewinner/Verlierer:** Gewinner: geduldige Diplomaten-Spieler. Verlierer: niemand direkt — P&R modelliert Soft Power ohne Verlierer-Seite, was sie didaktisch ehrlich, aber spielerisch flach macht (kein Backlash, keine Kulturpolitik-Gegenrede).

**Zweitrundeneffekte:** Die Kooperationsabkommen teilen Forschungs-Kosten — Wissenschaft als **Bündnis-Infrastruktur**; der Kulturblock-Faktor zeigt die andere Seite: Gemeinsamkeit erleichtert alles, Fremdheit verteuert alles.

**Übernahme für Staatsräson:** Als **Aktionskatalog** für Kapitel B: Filmfestival (İstanbul Film Festivali / Antalya Altın Portakal als jährliche Aktion), Kulturjahr (reale Praxis: Türkei-Japan-Jahr 2019 u. a. [unverifiziert]), Studentenaustausch (Türkiye Bursları: 117.367 Bewerbungen aus 163 Ländern allein 2023 — echte Pipeline mit Zahlen!), Wissenschaftskooperation (TÜBİTAK-Bilateralprogramme). P&R liefert die Erkenntnis, dass diese Aktionen **als Einzelklicks mit kleinen, langsam tickenden Effekten** modelliert werden können — wir geben ihnen über Kapitel B zusätzlich die fehlenden Verlierer (Kosten, Backlash, Spionage-Verdacht).

**Quellen Abschnitt 13:** gamespress.com (Eversim-Pressemitteilung 2021: Filmfestival, Studentenaustausch, Kulturjahr, Wissenschaftskooperation, 175 Länder/600 Daten); gamefaqs.gamespot.com Franchise-Liste; worldcrunch.com (NATO-Trainingseinsatz); ign.com (Modding-Tool, „Clash of Civilizations"-Szenario).

---

## 14. Kapitel A: „Der Zinseszins des Wissens" — Typologie und Spielbarkeit

### 14.1 Sechs Archetypen, wie Spiele Wissens-Investition modellieren

| # | Archetyp | Vorbild | Kernformel | Stärke | Schwäche |
|---|----------|---------|-----------|--------|----------|
| 1 | **Baum + Boost (aktive Forschung)** | Civ 6 | Kosten −40 % bei erfüllter Bedingung | Belohnt Welt-Interaktion | Lernbarer Golden Path |
| 2 | **Knappheits-Allokation** | EU4, HOI4 | Eine Währung (Punkte/Slots) für alles | Ehrliche Opportunität | Abstrakt, kein „Warum" |
| 3 | **Stock-Flow-Pipeline** | Vic3, Anno | Schicht/Stock (Literacy, Scholars) → Rate → Tech | Bildung als Substanz | Träge, schwer lesbar |
| 4 | **Kausalnetz mit Trägheit** | D4 | Regler → verzögerte Effekte → Situationen | Politische Ehrlichkeit | Unsichtbarer Nutzen |
| 5 | **Kartenwurf / Deck** | Stellaris, Old World | Gewichtete Zufallsangebote | Varianz, keine Beeline | Kontrollverlust-Gefühl |
| 6 | **Ereigniskette** | Suzerain | Entscheidung → Saga → Epilog | Narrative Tiefe | Nicht skalierbar auf 81 Provinzen |

Kein Vorbild kombiniert alle Stärken. Für Staatsräson ergibt sich eine **Schichten-Lösung**: Basis = 3+4 (Pipeline mit Trägheit: PISA→Absolventen→Innovation), Oberfläche = 1 (Boosts/Erfolgsmomente), Steuerung = 2+5 (Verwaltungskraft-Allokation auf ein Reform-Deck), Krone = 6 (Saga-Gesetze für die großen Reformen).

### 14.2 Das Lag-Problem: 10–20 Jahre, ohne den Spieler zu langweilen

Das reale Lag: Einschulungsmaßnahmen wirken in 1–3 Jahren auf Einschulung, in 8–15 Jahren auf PISA (belegt in RECHERCHE_INNENPOLITIK, PISA-Messzyklus 3 Jahre); Lehrergehälter 3–8 Jahre; Rückkehrprogramme 3–10 Jahre; Demografie eine Generation. Vier bewährte Spiel-Antworten:

1. **Zwischenmetriken statt Endmetrik (Vic3/D4):** Nicht „Bildung +", sondern eine **Kette sichtbarer Einzelstände**: Vorschulquote → Einschulung → Devamsızlık (Fehlzeiten) → PIRLS/PISA → Uni-Absolventen → Fachkräftepool → Innovations-Cap. Jede Stufe hat ihre eigene Zeitkonstante — der Spieler sieht **immer irgendwo Bewegung**, obwohl das Endziel 15 Jahre braucht. Vic3 macht es vor: Literacy bewegt sich **wöchentlich** minimal in Richtung Education Access.
2. **Eureka-Momente (Civ 6):** Diskrete Boosts bei Meilensteinen: „1.000. Schulfrühstücksprogramm vollendet → +40 % auf die Leiter ‚Schulqualität'". Der 40-%-Wert ist psychologisch kalibriert: groß genug zum Feiern, klein genug, um die Basisinvestition nicht zu ersetzen.
3. **Benannte Träger (Stellaris):** Personen (Minister, Rektorin, Star-Professor) verkörpern die Pipeline; ihr Altern/Wirken/Abwandern gibt der Dekade ein Gesicht — der Spieler pflegt **Beziehungen zur Zukunft**.
4. **Epochen-Rahmung (Civ 6 Ages):** Legislatur-Perioden als „Zeitalter" mit Dedication (Schwerpunkt) und Abschluss-Bilanz (Era Score = Wahlprogramm-Erfüllung). Das Dark-Age-Design lehrt: **Krisenperioden brauchen eigene Karten** (Reformfenster), sonst fühlt sich Lag nur als Versagen an.

### 14.3 Sichtbare Pipeline: Schule → Universität → Industrie

Vorbild-Ketten: Vic3 (Literacy → Qualifikation → Produktionsmethode: ohne Techniker keine Fabrik-Stufe), Anno (Scholars als eigene Schicht mit Bedürfnissen → Forschungspunkte → Major Discovery), D4 (Education → Productivity → GDP mit Trägheit), HOI4 (Forschung ohne Fabriken = null). Für Staatsräson konkret:

- **Stufe Schule:** Provinzgrößen Einschulung, PISA-Proxy (3-Jahres-Zyklus als Mess-Event mit Vorschau „Trend: steigend"), Ost-West-Spread.
- **Stufe Universität:** Absolventen-Stock je Fachrichtung (MINT-Lehrer-Paradox eingebaut: Uni-Ausbau ohne Lehrerausbildung → Teacher-Shortage), Uni-Standorte als Reich-Bauwerk mit Cluster-Adjacency (Technopark neben Uni = Civ-Adjacency-Übersetzung).
- **Stufe Industrie:** Innovations-Cap-Formel (Vic3-Übersetzung: Cap = f(PISA-Stock)) gatet die Modernisierungsleitern; jede Leiter zeigt an, **welcher Stock sie speist** („Hochgeschwindigkeitsbahn: braucht Ingenieur-Stock ≥ Schwelle").
- **Abfluss Brain Drain:** Abwanderung als **Stock-Leck** mit Gesicht (Stellaris-Personen + Anno-Schicht): Rate = f(Lohngefälle, Freiheitsgrad, Sprachkompatibilität Deutschland/EU — Diaspora als Kanal!). Rückfluss-Programme = Leck-Ventil mit 3–10-Jahres-Lag.

### 14.4 Die Verlierer-Frage des Zinseszins

Die Recherche zeigt eine Lücke: Kaum ein Vorbild benennt die **Verlierer der Bildungsinvestition** ehrlich. Ausnahmen, die wir übernehmen: Vic3 (Geistliche/Landbesitzer als sabotierende IGs; gebildete Pops werden anspruchsvoller), D4 (Steuerzahler heute vs. Produktivität morgen; religiöse Gruppe irritiert von Technology Grants), Suzerain (Bildung als Geisel der Identitätspolitik). Staatsräson sollte hinzufügen: **die kohleabhängige Provinz, die von der Wissensökonomie nicht erreicht wird** (Diffusions-Mechanik aus EU4-Institutionen), und die **Generation dazwischen** — die Kohorte, die die Reform bezahlt, aber deren Kinder erst profitieren (Wahl-Risiko des Zinseszins: Der Nutzen liegt hinter der nächsten Wahl — genau deshalb ist Bildung Staatsräson und nicht Parteipolitik. Das ist der didaktische Kern des Spiels).

---

## 15. Kapitel B: „Soft Power als Staatsräson-Währung" — Mechanik-Vorschlag mit Zahlenrahmen

### 15.1 Die reale Ausgangslage (belegt)

- **Dizi-Exporte:** von ~10 Mio. USD (frühe 2000er) auf **über 1 Mrd. USD/Jahr** (TRT World, 2026, unter Berufung auf Branchenverband); Reichweite 700–750 Mio. Zuschauer in 146–170+ Ländern. Rang: „zweitgrößter TV-Exporteur der Welt" (GQ/TRT/Medium-Quellen) **oder** „drittgrößter hinter USA und UK" (The Economist, 02/2024) — **Quellenkonflikt**, im Spieltext neutral formulieren („einer der drei größten"). Nachfrage +184 % 2020–2023. Einzelwirkung: „Uzak Şehir" brach Tourismus-Rekorde in Mardin (900.000 Übernachtungen 2024); „Muhteşem Yüzyıl" verkauft in 140 Länder, Topkapı-Besucheranstieg mit Serien-Bezug; Erdoğan-Angriff auf die Serie („Er verbrachte 30 Jahre zu Pferd, nicht im Harem") steigerte eher die Neugier.
- **Yunus Emre Enstitüsü:** gegründet 2007, Betrieb ab 2009; **93 Kulturzentren in 68 Ländern** (MEB-Minister Tekin, 10/2025); Türkisch-Prüfung mit ALTE-Q-Mark. [ältere Angaben: 58 Zentren/46 Länder — Wachstum belegt]
- **TİKA:** erste Afrika-Präsenz 2005 (Äthiopien), heute 22 Büros in Afrika, ~7.000 Projekte dort (AA-Zitat); Kirgisistan allein ~1.300 Projekte seit 1993; weltweit 57+ Koordinationsbüros [ältere Zahl, unverifiziert aktuell]. Heritage-Restaurierungen auf dem Balkan als eigenes Programm.
- **Maarif Vakfı:** **508 Schulen in 56 Ländern, 2 Universitäten, 14 Bildungszentren, über 60.000 Schüler** (MEB, 10/2025) — entstanden aus der Übernahme der Gülen-Schulen nach 2016 (Sensitivität beachten).
- **Türkiye Bursları:** 117.367 Bewerbungen aus 163 Ländern (2023); Zentralasien-Alumni als Eliten-Kanal („Great Student Project" seit 1992, über 172.000 ausländische Studierende bis 2016 [Quelle: academia.edu, Sammelzahl, unverifiziert]).
- **Weitere Kanäle:** Diyanet-Auslandsarbeit (Moscheebau Djibouti/Ghana/Sudan), TRT World, THY-Netz >120 Länder, Tourismus 2025: 52,78 Mio. Gäste / 65,23 Mrd. USD (Bestandsdaten), Archäologie-Offensive „Geleceğe Miras" (251 Grabungsstätten, 5.000+ Beschäftigte; Göbekli Tepe 750.000 Besucher 2024).
- **Somalia-Vorlage:** Dürre-Hilfe 2011 + Krankenhaus-Ausbildungszentrum = „Turkish-type aid model" — Soft Power durch **Krisen-Speed**.

### 15.2 Mechanik-Design: die „Ausstrahlung"-Währung

Neue Reichsgröße **Ausstrahlung (0–100 je Partnerland)** — das Soft-Power-Analogon zu Civ 6 Tourismus: nicht eine globale Zahl, sondern **pro Beziehung**. Produktion aus Instrumenten (s. 15.3), Wirkung auf die 4-Dimensionen-Matrix:

| Wirkung | Formel-Vorschlag (Kalibrierung offen) | Begründung |
|---|---|---|
| **Vertrauen** | +0,5/Jahr je 10 Ausstrahlung (cap +15) | Serien/Institute schaffen „emotionale Präzision statt Botschaft" (GQ) |
| **Handel** | Tourismus-Einnahmen ×(1+Ausstrahlung/200); Export-Plus in Ländern mit Dizi-Hit | Mardin-Effekt: Serien → Tourismus ist belegt |
| **Konflikt** | −0,3/Jahr je 10 Ausstrahlung (cap −10), **wirkt nicht unter Konflikt 60** | Soft Power löst keine Casus belli — Ehrlichkeit |
| **Sicherheit** | indirekt: Vertrauen ≥ 70 entsperrt Klauseln (Uni-Kooperation, Rüstungsgespräch) | Somalia→Krankenhaus→Sicherheitspartner-Kette |

**Verfall und Risiken:** Ausstrahlung verfällt −2/Jahr ohne laufende Instrumente; **Backlash-Ereignisse**: Verbote im Zielland (dokumentiert: arabische Sender-Bann → Publikum wich auf Satellit/Streaming — im Spiel: Verbot halbiert Ausstrahlung, erhöht aber Diaspora-/Streaming-Restwirkung), „Propaganda!"-Presse schlägt um (kontrollierte Inhalte wirken −50 %, Anno-Zeitungslogik), heimische Debatte („Die Serie entstellt unsere Geschichte" — Muhteşem-Yüzyıl-Ereignis mit Wählergruppen-Spaltung Konservative ↔ Liberale).

### 15.3 Instrumenten-Leiter (Kosten → Wirkung → Verlierer)

| Stufe | Instrument | Kosten/Jahr (Rahmen) | Ausstrahlung-Aufbau | Nebenwirkungen | Verlierer/Risiko |
|---|---|---|---|---|---|
| 1 | **Dizi-Förderung** (Steueranreize, Koproduktionen) | 0,1–0,3 Mrd. USD | +1–3 je Zielland-Cluster (Regionen: Balkan, MENA, LatAm, Zentralasien — belegte Märkte) | Tourismus-Plus auf Erbe-Stätten mit Drehort-Flag | Qualitätsverwässerung („exportierbar statt authentisch"), Konservative bei freizügigen Formaten |
| 1 | **TRT World / Auslandssender** | 0,2 Mrd. | +1 global, dauerhaft | Agenda-Setting bei Krisen (Gaza-Schiene) | Glaubwürdigkeits-Malus bei Staatsnähe (D4-Medienlogik) |
| 2 | **Yunus-Emre-Zentrum** (neu eröffnen) | 5–15 Mio. je Zentrum | +2 im Gastland, Sprachkanal (Diaspora-Verstärker) | Türkisch-Kurse = Eliten-Zugang | Schließung durch Gastland bei Konflikt (Instrument geht verloren — reale Fälle unverifiziert) |
| 2 | **Türkiye Bursları Aufstockung** | 0,1 Mrd. je 5.000 Stipendien | +1 global, **verzögert 10–15 Jahre** (Alumni werden Minister) | Der langsamste und stärkste Effekt (Great Student Project → 172.000 Alumni) | Brain-Gain des Heimatlandes vs. Abschiebedruck innenpolitisch |
| 3 | **TİKA-Projektserie** (Brunnen, Kliniken, Wiederaufbau) | 0,3–1 Mrd. je Region | +3–5 in armen Staaten, Krisen-Bonus ×3 (Somalia-Muster) | „Turkish-type aid model"-Flag, Gegenstück zu EU/US-Modell | Neosmanismus-Vorwurf auf dem Balkan (Insight-Turkey-Debatte); Abhängigkeit des Partners |
| 3 | **Maarif-Schulnetz-Ausbau** | 0,2 Mrd. je 20 Schulen | +2 je Land mit Schulen | Bildungsdiplomatie mit Absolventen-Kanal | Gülen-Historie als Konfliktstoff im Gastland (echte Übernahme-Historie 2016 ff.) |
| 4 | **Archäologie-Diplomatie** (Grabungen, Restitution, Leihgaben — gekoppelt an `erbe.ts` und „Geleceğe Miras") | 50–200 Mio. | +2 global, UNESCO-Track (neue Welterbe-Bewerbung als Event) | Erbe-Stätte bekommt „international"-Flag → Tourismus-Multiplikator | Fund-Konflikte (Hasankeyf-Trauma), Restitutions-Forderungen anderer Staaten |
| 4 | **Großereignis** (EXPO, Olympia-Bewerbung, Kulturjahr) | 1–5 Mrd. einmalig | +5 global einmalig, Vertrauen +5 bei Erfolg | Baukapazität gebunden (GROSSPROJEKTE) | Fiasko-Risiko (Anno-Weltausstellung-Logik: schlechte Vorbereitung = Prestige-Schaden) |

### 15.4 Wählergruppen-Kopplung (innen)

- **Nationalisten/Konservative:** Stolz-Effekt bei Ausstrahlung (+Zustimmung bei „Dizi erobert Pakistan"), aber Ablehnung bei liberalen Formaten oder Diaspora-Kritik („Almancılar mischen sich ein").
- **Liberale/Säkulare:** Bonus bei Uni-Kooperationen/Erasmus-Schiene; Misstrauen bei Diyanet-/Maarif-Schiene.
- **Diaspora (3,08 Mio. in Deutschland):** Doppelfunktion — Verstärker (Euro-Versionen, Wahlbrücken) **und** Konfliktquelle (Wahlkampf-Verbot-Ereignisse, „Doppelstaatler-Debatte"): die einzige Wählergruppe, die **gleichzeitig Instrument und Ziel** von Soft Power ist.
- **Wirtschaftslobby:** Dizi-Tourismus-Multiplikator macht Hoteliers (Antalya!) zu Verbündeten der Kulturpolitik — ein realer, spielbarer Interessen-Deal.

### 15.5 Warum diese Mechanik Staatsräson-würdig ist

Soft Power ist das einzige Machtinstrument, das **billiger wird, je besser das eigene Land funktioniert** (gute Schulen → gute Serien → gute Institute → Vertrauen → Handel → gute Schulen) — ein positiver Rückkopplungskreis, der unsere Kernbotschaft trägt: **Innenpolitik ist Außenpolitik.** Die Verlierer-Mechaniken (Backlash, Verbot, Schließung, Glaubwürdigkeitsverfall) verhindern, dass es ein Gratis-Buff wird. Und die 10–15-Jahres-Verzögerung der Stipendien-Schiene zwingt den Spieler zu überlebensgroßer Geduld — die eigentliche Staatsräson-Tugend.

---

## 16. Top-15-Übernahmen (sortiert nach Wert/Aufwand)

Wert = erwarteter Beitrag zu Tiefe, Einzigartigkeit, Türkei-Realismus; Aufwand = geschätzter Implementierungsaufwand (S/M/L). Bezug = unser bestehendes System.

| Rang | Übernahme | Vorbild | Wert | Aufwand | Bezug |
|---|---|---|---|---|---|
| 1 | **Innovations-Cap durch Bildungs-Stock** (Forschungsausgaben wirken nur bis Cap = f(PISA/Lehrer)) | Vic3 | Sehr hoch — macht Bildung zur echten Forschungswährung | S | Modernisierungsleitern, Haushalt-Regler Bildung |
| 2 | **Eureka-Boosts auf Reformen** (Bedingung erfüllt → +40 % Fortschritt) | Civ 6 | Sehr hoch — löst das Lag-Langeweile-Problem | S | Politiknetz, Lernkonzept |
| 3 | **Diffusion über Provinzen** (Institutionen wandern von Kern zu Peripherie, Dev-Klick brütet) | EU4 | Sehr hoch — macht Ost-West-Gefälle spielbar statt skriptiert | M | 81 Provinzen, provinz_infra.json |
| 4 | **Legislatur-Zeitalter mit Dedication** (Schwerpunkt + Era-Score-artige Bilanz; Krise = Reformfenster-Karten) | Civ 6 R&F | Hoch — Dramaturgie zwischen Wahlen | M | Zeitmodell, Wahlen |
| 5 | **Ausstrahlung je Partnerland + Instrumenten-Leiter** (Dizi/YEE/TİKA/Maarif/Stipendien mit Verfall & Backlash) | Civ 6 Tourismus + P&R | Hoch — neuartige, türkeispezifische Mechanik | M | Beziehungsmatrix, AUSSENPOLITIK §10 |
| 6 | **Brain Drain als Stock-Leck mit Gesicht** (abwandernde benannte Fachkräfte, Rückhol-Programme) | Stellaris/Anno/Vic3 | Hoch — macht das Politiknetz-Problem emotional | M | POLITIKNETZ „Abwanderung von Fachkräften", PERSONEN |
| 7 | **Teacher-Shortage-Paradox als Standard-Zweitrundeneffekt** (Uni-Ausbau kanibalisiert Schulbasis ohne Lehrerpipeline) | D4 (Forum, belegt) | Hoch — lehrt Systemdenken in einer Zeile | S | Bildungsfeld INNENPOLITIK §2.3 |
| 8 | **Reform-Deck** (4–6 gewichtete Reformkarten je Legislatur, Nichtwahl = weg in den Stapel) | Old World/Stellaris | Hoch — verhindert Checklisten-Spiel | M | Politiknetz-Steuerung |
| 9 | **Traditions-Bäume mit harter Obergrenze** (5 von ~8 National-Identitäten, Abschluss = Perk) | Stellaris | Mittel-hoch — Verzicht als Profil | M | ENTSCHEIDUNGEN „Das Reich" |
| 10 | **Vorlauf-Malus auf Modernisierungsleitern** (Sprünge ohne Basis überproportional teuer; Sonderprogramm neutralisiert einmal) | HOI4/EU4 | Mittel-hoch — realistische Tech-Politik | S | Modernisierungsleitern, GROSSPROJEKTE |
| 11 | **Kuration/Set-Bonus mit Erbe-Bezügen** (Themenroute bricht Bonus bei Nutzungsstreit) | Civ 6 Theming | Mittel — vertieft bestehende Serien-Idee | S | erbe.ts, FACHBEREICHE §6.1 |
| 12 | **Forschungsallianz-Stufen** (Kooperationsabkommen mit Transfer-Boosts, bricht bei Konflikt) | Civ 6 GS | Mittel — Diplomatie-Inhalt für Verhandlungstisch | S | abkommen.ts, Verhandlungstisch |
| 13 | **Provinz-Wünsche („We Love the King Day")** (Mikroziele mit Fest-Modus) | Civ 5 | Mittel — Zufriedenheits-Mikroloop | S | Provinzen, Wählergruppen |
| 14 | **Pressefreiheit als Spread-Multiplikator** (Zensur senkt Technologie-Diffusion messbar) | Vic3 | Mittel — koppelt Medienpolitik an Wissenschaft | S | Medienfeld, RSF-Startwert |
| 15 | **MIO-artige Institutions-Level** (TÜBİTAK/ASELSAN leveln durch Vergabe; Wechsel kostet Boni) | HOI4 MIO | Mittel — institutionelles Gedächtnis | M | VERBESSERUNGSPLAN MIL-4, Industrie |

**Bewusst nicht in den Top 15:** Tropico-Heists (Ton inkompatibel, nur als Restitutions-Umkehrung in Kapitel 10), Civ-6-Bezirks-Adjacency als Kartenmechanik (unser Karten-Scope ist Provinz, nicht Kachel — Adjacency wird zu Cluster-Logik), Anno-Einfluss-Kategorien (durch unser Politisches Kapital abgedeckt), Rockbands (durch Dizi-Instrument ersetzt).

---

## 17. Unsicherheiten und offene Verifikationen

1. **Civ-6-Kultursieg-Formel:** Konstante „200 Tourismus je Spieleranzahl pro Auslandstourist" sowie „1 Inlandstourist je 100 Kultur" stammen aus Sekundärguides; gegen civilization.fandom.com/wiki/Tourism_(Civ6) (in dieser Session HTTP 403) verifizieren. [unverifiziert]
2. **Civ 6 Kunstwerk-Ertrag (3/3?) und Kunstmuseum-Themenregel** (gleiches Genre, verschiedene Künstler): aus Spielwissen, Fandom-Seite nur teilweise abrufbar. [unverifiziert]
3. **Civ-6-Bezirkslimit** (1 je 3 Einwohner) und **Rockband-Preis** (600 Glaube): Spielwissen. [unverifiziert]
4. **HOI4 Slot-Verteilung** (2–3 Minors, Majors mehr, +1–2 per Fokus) und **MIO-Kosten/Boni**: Wiki-Abschnitte nicht vollständig abgerufen. [unverifiziert]
5. **EU4 University-Gebäude** (−20 % Dev-Kosten lokal) und **Embrace-Preisformel** (Dukaten je Dev): aus Guides/Spielwissen. [unverifiziert]
6. **Vic3 Kunstakademie** (Fine-Art-Gebäude): Gebäude existiert; Beschäftigungs-/Inputdetails gegen vic3.paradoxwikis.com/Building prüfen. [unverifiziert]
7. **Suzerain „Konriana-Universität":** in keiner Quelle gefunden — wahrscheinlich Fehlinformation; Rizia-Codex nennt „Toras Imperial University". Als [unverifiziert] behandeln bzw. streichen.
8. **Dizi-Rang:** „zweitgrößter" (GQ/TRT/Medium) vs. „drittgrößter" (Economist 02/2024) — Quellenkonflikt, im Spieltext neutral.
9. **TİKA-Gesamtzahlen** (Büros weltweit, Jahresbudget): nur Teilzahlen belegt (Afrika 22 Büros/7.000 Projekte; Kirgisistan 1.300). Jahresbudget offen (stand auch in RECHERCHE_INNENPOLITIK als Lücke).
10. **TUA-Gründungsjahr** (2018) und **EXPO-Kandidatur İstanbul**-Details: Spielwissen, vor Textübernahme prüfen. [unverifiziert]
11. **Anno-1800-Weltausstellungs-Details** (Expo-Themen/Belohnungen) und **Einfluss-Preise je Zeitungsartikel**: Wiki nicht abgerufen. [unverifiziert]
12. **Power & Revolution:** Sprach-/Religionsfaktoren in Beziehungen nur indirekt belegt (Szenario „Clash of Civilizations" im Vorgänger); kein Zahlenmodell öffentlich. [unverifiziert]
13. **Democracy-4-Situation „Brain Drain"** ist im Franchise-Wiki gelistet; die D4-spezifische Ausprägung (Trigger/Effekte) nicht im Detail verifiziert. [unverifiziert]
14. **Millennia:** Kultur-Upkeep je Region belegt; Variant-Ages und Domänen-Details nur aus Reviews. [unverifiziert]

---

*Erstellt: 2026-09-30. Vertieft: RECHERCHE_MECHANIKEN.md (Civ-6-/D4-Profile), RECHERCHE_KONKURRENZ_FACHBEREICHE.md Kap. 5 (Kultur/Erbe/Wunder), VERBESSERUNGSPLAN_2026-09-30.md. Keine Duplikation: Diese Datei behandelt die Wissens-/Kulturmaschinerie (Währungen, Pipelines, Zeitmodelle, Soft Power); jene behandeln Kataloge, Rohdaten und Bau-Inszenierung.*
