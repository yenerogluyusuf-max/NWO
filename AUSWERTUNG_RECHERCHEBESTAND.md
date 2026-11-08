# Auswertung des Recherche- und Analysebestands (Stand: 30.09.2026)

Vollständige Auswertung von: REFERENZANALYSE.md, RECHERCHE_MECHANIKEN.md, RECHERCHE_KONKURRENZ_FACHBEREICHE.md, ANALYSE_SPIELBARKEIT_2026-09-29.md, RECHERCHE_GESAMTBEDARF.md, RECHERCHE_WELTDATEN.md, RECHERCHE_INNENPOLITIK.md, analyse_2026-09-29/ (alle Dateien), PROJEKTPLAN.md, ENTWICKLUNGSPLAN.md, PLANERWEITERUNG.md. Ergänzend herangezogen für den Umsetzungsstand: NACHTARBEIT_2026-09-29.md, NACHTARBEIT_2026-09-30.md.

Zweck: Grundlage für einen neuen Verbesserungsplan, der auf dem Bestand aufsetzt statt ihn zu duplizieren.

---

## 1. Referenz-Spiele-Mechaniken

### 1.1 Hearts of Iron IV (Paradox)

Analysierter Stand: Patch 1.19 „Operation Postern" + „Thunder at our Gates" (11.06.2026); Formeln teils aus Wayback-Snapshots 03/2024 bzw. 2021.

Wichtigste analysierte Mechaniken:

1. **Gesetzleitern (Economy/Conscription Laws)**: Stufen von „Undisturbed Isolation" (Konsumgüter +50 %) bis „Total Mobilization" (Konsumgüter 10 %, Militärbau +30 %, Rekrutierte −3 %); Wechsel je 150 Politische Macht, gebunden an War Support. Wehrpflicht-Leiter 1,0 % (Disarmed) bis 25 % Manpower (Scraping the Barrel, −40 % Factory Output). Besonders relevant: Die Türkei (Battle for the Bosporus) ist über Krisen-Spirits („Devaluation of the Turkish Lira", „Worsening Recession", „Rising Inflation") für Gesetzeswechsel gesperrt — exakt NWOs Domäne. Übernehmbar: **sofort** (Mobilisierungs-Gesetzleiter, Krisen-Blocker für Reformen).
2. **Produktionslinien mit Production Efficiency**: Start 10 %, Cap 50 %, Wachstum `0,001 × (PE-Cap)² / PE` pro Tag, max. 500 Tage bis Cap; Linienwechsel behält je nach Nähe 90/70/30/20/10 % der Effizienz. Produktionsformel: `base output × (1 + Modifikatoren) × PE`. Übernehmbar: **sofort** (Lernkurve + Retentions-Matrix als Anti-Flip-Flop-Anreiz für Fabriken, Maschinengenerationen, Großprojekt-Teams).
3. **Ressourcenmangel gestaffelt**: −5 % je fehlender Einheit und Typ, pro Fabrik gestaffelt, multiplikativ — automatische Rationierung ohne Rationierungs-UI. Übernehmbar: **sofort** (5–6 strategische Ressourcen).
4. **Fokusbaum**: ein Fokus gleichzeitig, ~35–70 Tage, 1 PP/Tag, 10 Tage Schonfrist; National Spirits als Modifikator-Kacheln. Übernehmbar: **sofort** als Vokabular (UND/ODER-Linien, Exklusiv-Icons) für Agenda-Pfade und Regierungsprogramme.
5. **Politische Macht** (+2/Tag) als Aktionswährung für Fokus, Ideen, Gesetze; Kommandomacht Cap 80.
6. **Bauen**: Zivfabrik 10.800 IC, Milfabrik 7.200, Infrastruktur 6.000; Baugeschwindigkeit `1 + Infra/5`; Infrastruktur 0–5 je Staat (+20 % Baugeschwindigkeit je Stufe), Bombenschaden schaltet Gebäude ab.
7. **Versorgung und Führung (No Step Back)**: Nachschub-Hubs, Reichweitenabfall, Generalstab aus Offizieren. Übertrag: Einsatzfähigkeit aus Versorgung + Material + Personal + Führung; Berichte zeigen den begrenzenden Faktor. Detailtiefe (Hubs, Motorisierung) **abgelehnt**, Abstraktion „Logistikstatus pro Provinz".
8. **Rüstungswirtschaft (Arms Against Tyranny)**: spezialisierbare Rüstungsunternehmen (MIOs mit Trait-Bäumen, Level über Funds), internationaler Waffenmarkt. Übernehmbar: später (Auftragnehmer/Rüstungsindustrie mit Erfahrungslevel).
9. **Besatzung**: `Fabriken verfügbar = 25 % + 65 % × Compliance`, Schwellen bei Resistance 25/50/75/90 %. Übernehmbar: später (Compliance/Resistance-Kurven für Regionalpolitik auch ohne Krieg).
10. **Forschung**: `Tage = ⌈N / (1 + B%)⌉`, Ahead-of-Time-Penalty +200 % pro Jahr, 2–4 Slots.
11. **Diplomatie**: Garantie 15 PP (+15 je weitere), Nichtangriffspakt 12 Monate unbrechbar (endet nach 48), Weltspannung als Freischaltung, Fraktionsaustritt −75; Trade Influence (1 Fabrik = 8 Einheiten).
12. **UI**: Drei-Schichten-Regel (Karte räumlich / Top-Bar makro / Tooltip kausal), Farbverlauf-Kartenmodi (hellblau → violett → gelb → rot), Shift/CTRL-Zusatzebenen.

Bewusst ausgeschlossen: Echtzeit-Kriegstaktik, Divisionsdesigner (5×5 + Support), Einheiten-/Fahrzeug-Designer, **Score-Auktion als Friedensverhandlung** (Peace Conference — dokumentierte Designschwäche, Community-Mod „Player-Led Peace Conferences" als Beleg, dass Spieler Kontrolle statt Auktion wollen). Systematische Lücken des Vorbilds: kein Geld/Preise/Inflation, kein Parlament, keine persönliche Ebene; Kampfsystem intransparent (PC Gamer 88/100).

### 1.2 Democracy 4 (Positech/Cliff Harris)

1. **Kantenformel mit Inertia**: `[Ziel],[f(x[,Skalierer])],[Inertia]` mit Operatoren `+ - * / ^`; Beispiel `Education,0.04+(0.04*x),4`; Skalierung über Fremdknoten (`*BIP`, `*Technology`). Inertia = Zeitkonstante je Kante. Übernehmbar: **sofort** für alle Politiknetz-Kanten — die strukturelle Identität zu NWOs Netz.
2. **Problem-Hysterese (Situations)**: getrennte Start-/Stop-Schwellen („leichter starten als beenden"), `Cost per turn`, Momentum, Startwarnung. Übernehmbar: **sofort** — mechanische Umsetzung von „Härte des echten Lebens".
3. **Implementierungs-Delay + Ghost-Slider**: Slider laufen langsam zum Ziel, Kosten fallen sofort an; Implementation-Wert je Policy; Ministerkompetenz skaliert Tempo. Übernehmbar: **sofort** („Gesetz verabschiedet ≠ wirksam").
4. **Political Capital**: Produktion aus Beliebtheit, Wahlmehrheit, Ministerloyalität; Preise je Aktion (Introduce/Raise/Lower/Cancel); Kontroverses kostet ein Vielfaches. Übernehmbar: **sofort** (zwei Preisspalten „Präsidentialer Erlass" vs. „Parlamentsweg").
5. **Minister-Drei-Rollen**: PC-Produktion + Effectiveness + Wähler-Sympathie gleichzeitig; Loyalität sinkt von selbst („jaded"); Reshuffle statt Feuern (Entlassung senkt Loyalität aller übrigen). Übernehmbar: **sofort**.
6. **Event-Wettbewerb + Grudge-Decay**: Events werden alle 3 Runden bewertet (Score > 70 % löst aus), wirken via `CreateGrudge(Ziel, Wert, Decay)` mit exponentiellem Auslauf (0,65–0,97), negativer Selbst-Grudge gegen Wiederholung; Dilemmas mit 32-Runden-Cooldown. Übernehmbar: **sofort**.
7. **Wählersimulation**: 2.000 simulierte Wähler, ~20 Gruppen + „Everyone", Mehrfachmitgliedschaften, Turnout aus Apathie + Aktivisten + Parteimitgliedschaft; Cynicism/Complacency gegen ewige Happy-Koalitionen (Übernahme: später).
8. **Opposites + UNCANCELLABLE**: Gegensätze kündigen sich automatisch; manche Positionen fix; Slider-Clamp mit benannten festen Positionen (z. B. für Rechtsfragen; später).
9. **Schuld/Rating-Spirale statt Bankrott**: Zinsen über Debt-to-GDP, Rating-Sprünge eskalieren schnell; Verlieren über Wahlen, nicht Game-Over (Übernahme: später, an Lira/Inflation binden).
10. **Globale Konjunktur als Sinus**: Boom/Bust-Zyklus, „sudden market changes" (später).
11. **CSV-Datenhaltung**: eine Zeile = ein Knoten, Effekte als Formelzellen, Region-Overrides (`missions/<land>/overrides/` mit `DELETE`/neuer Formel), Country-Dateien (`[config]/[stats]/[policies]`). Übernehmbar: **sofort** — Modding-fähiges Datenformat für NWOs Knoten + Provinz-Varianten.
12. **UI**: „Graph first", Wirkungslinien bei Hover (grün/rot, Pfeilgeschwindigkeit = Stärke), Knotenfarben (grau Policy, blau Statistik, rot/grün Situation), PC-Ringsegmente an Icons, Inertia-Balken, Changes-Graph, Quartalsbericht pro Runde. Übernehmbar: **sofort** (allesamt in der Übernahmeliste).

Systematische Lücken des Vorbilds (als NWO-Chancen markiert): keine regionale Tiefe, kein Kapitalstock, keine sichtbaren Formeln (NWO-Chance: Formel-Tooltip als USP), keine echte Opposition, keine Inflationsmechanik; Militär nur ein Ausgaben-Regler (Gegenbeispiel „alles ist Geld"). Community-Befund aus Review-Mining: „Fixed Britain in 1 hour" — Warnung vor dominanten Lösungswegen.

### 1.3 Suzerain (Torpor Games)

1. **Turn-Struktur**: Prolog + 12 Turns à 4 Monate + Epilog + Summary-Screen; 1–3 Entscheidungscluster je Turn (Berichte → Gespräche → Dekrete/Verträge/Gesetze); kein Echtzeit-Timer. Basis-Kampagne ~450.000 Wörter, < 12 Stunden.
2. **Entscheidungslabels mit Kostenklammern**: Multiple Choice 2–4 Optionen, Kosten direkt im Label („(−1 Budget)"), Stat-Folgen bewusst indirekt/verdeckt. Übernehmbar: **sofort** (In-Character-Labels mit Tonalitätsskala).
3. **Zeitung als Soft-Dashboard**: Stat-Änderungen als erzählerische Presse-Rückmeldung (hunderte News-Events); zentraler Feedback-Kanal. Übernehmbar: **sofort** — NWO-Steigerung: türkische Pressevielfalt mit Tendenzen (staatlich/oppositionell).
4. **Flags/Trigger-Condition-Effect**: spätere Optionen hängen an früheren Wahlen; Verträge, Vetos, Investitionen öffnen/schließen Pfade. Übernehmbar: **sofort** (datengetriebene Entscheidungs-Kataloge, gilt auch für KI-Intents).
5. **Verdeckte Beziehungsstatistik**: Gunst verdeckt, nur Reaktionen sichtbar; Connections-Panel ohne Zahlen. Übernehmbar: **sofort** (Figurenprofile sichtbar, aktuelle Gunst verdeckt).
6. **Institutionen als Spielregeln**: 10-%-Sperrklausel, Verfassungsänderung braucht 2/3 der Nationalversammlung plus Mehrheit im Obersten Gericht (mit benannten Richtern und Lagern, kann Gesetze/Dekrete kassieren), absolutes Präsidentenveto, Minister aus der Mitte der Parlamentarier. Parlament 250 Sitze [Spielerwissen, zu verifizieren].
7. **Bauvergabe an Firmen**: drei Optionen (Staatskonzern / privat teuer-professionell / privat billig-mittel) mit späteren Flag-Folgen — Korruptions-Ebene. Übernehmbar: **sofort**.
8. **Verträge mit harten Exklusivitäten**: wer mit A handelt, verliert B; Supermacht-Nähe = Geld gegen Putsch-/Sanktionsrisiko. Übernehmbar: **sofort** bzw. später (Lagerwahl mit Innen-Risiko).
9. **Figuren**: Kabinett mit eigenen Überzeugungen, Privatleben mit Auswirkungen, Personal Wealth (1–3 Punkte aus dem Prolog), Prolog-Skill-Boni (Geschichte = Verhandlungen, Jura = Verfassung, Ökonomie = Rezession), Beraterprofile mit eigener Agenda, Gefallen-Ökonomie, Journal als Notizsystem, Save-Import (Rizia) für Figurenkontinuität. Übernehmbar: großteils **sofort**.
10. **Ton**: zusammen mit der Serie Borgen Ton-Vorbild (ernst mit trockenem Humor); Metacritic 81, Steam 93 % positiv, Spiegel „vielleicht das realistischste Spiel über Politik".

Systematische Lücken: kein freies System-Management, keine freie Spracheingabe, kein Umfrage-Dashboard, Wirtschaft grob (Ganzzahl-Budget). Warnungen: 2.0-UI-Redesign („Mobile-Game-Optik", Notifikations-Flut) — NWO bleibt Desktop-first; Review-Kritik an Blackbox („disconnect between decisions and events") und Trial-and-Error-Härte.

### 1.4 Civilization VI (Firaxis/2K)

1. **Distrikte als räumliche Entscheidung**: physisch auf der Karte, Adjacency-Boni, Unumkehrbarkeit, Bevölkerungslimit (+3 Citizens je weiterer Distrikt); Kosten `[1 + 9 × max(T,C)] × base` (Basis meist 54, Faktor 10 über das Spiel), 40 %-Rabatt für vernachlässigte Typen. Übertrag (REFERENZANALYSE): politische Vorhaben erhalten einen Ort; Standortbedingungen, betroffene Menschen, Kapazitätsengpässe.
2. **Wunderlogik**: weltweit exklusiv, harte Standortregeln (Panama-Kanal 920 Produktion; Eiffelturm 1620, +2 Reiz; Hagia Sophia 710, +4 Glaube, neben Heiligem Bezirk), **50 %-Rückerstattung der investierten Produktion bei verlorenem Wettlauf**. Übernehmbar: **sofort** für Großprojekte/Riesenhafen-Wettrennen.
3. **Wunder-Inszenierung**: gerenderte Wunderfilme (Zeitraffer, Tag-Nacht, Zitat) — von den Entwicklern zurückgeholt, weil Spieler sie als Belohnung vermissten. Übertrag: Eröffnungsfeier mit Kartenfahrt, Datum, Zitat, Fanfare; danach Wahrzeichen im Inventar.
4. **Lens-System**: 10 manuelle Farblinsen + automatische Platzierungs-Lens mit gültigen Standorten und Bonus-Herkunft. Übernehmbar: **sofort** als Karten-Ebenen.
5. **Eureka/Inspiration**: kleine Spielziele schreiben 40 % (Vanilla 50 %) der Forschungskosten gut; hohler Boost-Balken als Vorhersage. Übernehmbar: später (Agenda-Feedback), UI-Element **sofort**.
6. **Produktions-Queue**: FIFO, Overflow ins nächste Projekt (Exploit-Fix 2/2019); drei Beschleuniger (Harvest, Gold-Kauf, Policy Cards). Übernehmbar: **sofort** als Provinz-Bauqueue mit Baukapazität aus Bevölkerung/Industrie/Infrastruktur.
7. **Bevölkerungs-Dreiklang**: Nahrung (2/Bürger), Housing (Wachstumsstufen 100/50/25/0 %), Amenities (`ceil(Pop/2)`, Stufen Ecstatic +20 % bis Revolt −30 % + Rebellion).
8. **Mehrwährungs-Inventar**: Gold als reines Fluss-Modell (keine Inflation/Zinsen/Kredite); Glaube, Kultur, Wissenschaft, Annehmlichkeiten, Loyalität je Stadt, Diplomatische Gunst kaufen je etwas anderes; Politikkarten = Inventar mit Slots.
9. **Diplomatie**: Sichtbarkeit in 5 Stufen; Agenden ±4 bis ±15; Freundschaft/Denunziation sperren je 30 Runden; Allianzen mit Bündnispunkten Stufe 1–3; **Grievances** als bilaterales Konto mit Decay `10 − x`/Runde (Antike 10, Future Era 2). Grievance-Konten übernehmbar: **sofort**.
10. **Gathering Storm**: globales CO₂-Konto, 7 Klimaphasen, lokale Katastrophen mit „Fertilization"-Trade-off, Desertifikation ab Phase V, Weltkongress (Resolutionen gelten 30 Runden, Aid Requests nach Katastrophen, Emergencies). Übertrag: Naturgefahren mit regionaler Exposition/Vorsorge/Wiederaufbau; keine universelle Weltregierung.
11. **Militär-Ökonomie**: Unterhalt je Einheit nach Ära, strategische Ressourcen (Salpeter 20/10, Treibstoff 1 je Panzer und Runde), Kriegsmüdigkeit (−1 Annehmlichkeit je 400 Punkte).
12. **Tourismus/Kultur**: Wunder-Ertrag 2 Tourismus/Runde + 1 je überschrittener Epoche, Historic Moments, Kultursieg als Besucher-Bilanz, Museen-Thematisierung (verdoppelt).

Systematische Lücken: keine Geldpolitik, keine Personal-/Kabinettsebene, Siegbedingungen als Zielscheiben (NWO: offene Simulation). Abgelehnt: Builder-Charges, 1-Unit-per-Tile-Krieg (mikrolastig), Popup-Flut [Spielerwissen, unbelegt].

### 1.5 Civilization VII

1. **Städte vs. kleinere Siedlungen**: Spezialisierung, geringerer Verwaltungsaufwand für unterstützende Orte. Übertrag: Delegation — Kommunen verwalten ihren Alltag selbst, nationale Politik setzt Förderbedingungen/Mindeststandards; Darstellungsdetail vom Simulationszustand getrennt (beim Zoomen darf die KI keine Aktivität erfinden).
2. **Zeitalter (Antiquity/Exploration/Modern)**: Übertrag: Wahlperioden und politische Karrieren als verständliche Kampagnenabschnitte; keine erzwungenen Epochenwechsel — Schulden, Verträge, Infrastruktur bestehen fort.
3. **Einfluss als diplomatische Ressource**, Kriegsunterstützung/Kriegsmüdigkeit. Übertrag: diplomatischer Handlungsspielraum aus konkreten Beziehungen erklärt (Verhandlungsteams, Glaubwürdigkeit, Abhängigkeiten), nicht frei austauschbar.

### 1.6 Victoria 3

1. **Drei Kapazitäten**: Bürokratie (Defizit: bis +100 % Steuerverschwendung), Autorität (Defizit: −10 Zustimmung Opposition, +20 % Radikale), Einfluss (Defizit: −50 % Prestige). Steuerstufe ändert Legitimität +10/0/−10. Kernübertrag in der Fachbereichs-Recherche: „Engpässe statt Kontostand".
2. **Institutionen**: durch Gesetze freigeschaltet, mit Bürokratie hochgestuft (1 Bürokratie je 100.000 Einwohner, mindestens 10, ein Jahr je Stufe); Legitimität unter 25 blockiert Gesetze; jedes Gesetz hat Befürworter/Gegner.
3. **Preisformel**: `price = Base × [1 + 0,75 × clamp((BUY−SELL)/min(BUY,SELL), ±1)]` — Preise schwanken 25–175 % des Basispreises; Market Access (0–100 %) je State aus Infrastruktur vs. Nutzung (MAPI-Lokalpreise). Übernehmbar: **sofort** (Knappheit als Preisverschiebung statt Strafe).
4. **Production Methods**: 3–5-stufige Leiter pro Building-Gruppe, farbcodierte Kategorien (Base/Secondary/Automation/Organisation/Militär), Freischaltung über Technologie/Gesetze/Güter, automatischer Rückfall; Agrarleiter „Simple → Soil-Enriching → Fertilizers (+5 % Dürre-Impact) → Chemical Fertilizers (+10 %)": jede Modernisierungsstufe kauft Output mit neuem Risiko. Übernehmbar: **sofort**.
5. **Bau**: nationale Construction Queue, geteilt staatlich (Haushalt)/privat (Investment Pool aus Eigentümer-Dividenden); Baupunkte (Basis 10/Woche); wer ein Projekt aus der Schlange nimmt, verliert den Fortschritt; ungenutzte Baukapazität wird wöchentlich vergeudet (Leerverbrauch-Warnung). Übernehmbar: später (zweigeteilte Queue).
6. **Haushalt**: Goldreserve mit Soft-Cap 20 % des jährlichen BIP; Subventionen = gezielte Building-Stützung (nicht pauschal). Subventionen **sofort**, Reserve später.
7. **Pollution-Kopplung**: je 1 % Pollution Impact: −0,25 % Migration, +0,5 % Katastrophen-Impact, −0,03 Lebensstandard, +0,5 % Mortalität (später).
8. **Militär**: Kasernen 1.000 Beschäftigte/Stufe; Armeemodell-Gesetze (Peasant Levies +4 %/Erfahrung −25 %; Professional Army +1 %/+100 %; Mass Conscription +3 %); Nachschubmangel deckelt Organisation; Generäle stützen Interessengruppen.
9. **Verträge**: aus Artikeln (gegenseitig: Bündnis, Verteidigungspakt; gerichtet: Handelsprivilegien, Geldtransfer, Transitrechte, Militärzugang, Garantie), Bindung 5/10/15/25/99 Jahre; KI bewertet das Paket (> +30 immer Zustimmung, ≤ 0 nie, dazwischen Zufall); Pflicht anbieten +30, fordern −40; schwerer Bruch = Infamie, leichter = Gegenseite inaktiv; Neuverhandlung mit Gegenvorschlag.
10. **Akzeptanz**: 0–100 in fünf Stufen; neue Kulturgemeinschaft startet mit −30, baut sich um 0,25/Monat ab. Übertrag in Kultur: Zahl × Akzeptanz, „kein Spektakel" für Minderheiten.

Warnung: Tabellendichte („Excel als Haupt-UI") — abgelehnt; Pop-Individualität (tausende Pops) abgelehnt, Klassenaggregate genügen. Vic3-Zahlen versionsabhängig, überwiegend Wayback 08–09/2025.

### 1.7 Anno 1800

1. **Produktionsketten 1:1**: 1 t Vorgut → 1 t Folgegut pro Zyklus; perfekte Gebäudeverhältnisse (Stahl: 2 Hochöfen + 3 Stahlwerke; Brot: 2 Bäckereien + 1 Mühle + 2 Getreidefarmen = 110 Arbeiter-Residenzen); jede Kette „versorgt" N Residenzen (Kettenplanung = indirekte Bevölkerungsplanung); Wiki-Warnung vor Blindflug auf Ratios ohne Kostenblick. Übernehmbar: **sofort** (2–4-stufige Ketten je türkischem Industriezweig pro Provinz).
2. **Ketten-Diagramme** als UI-Goldstandard: Icon-Reihe mit Mengenverhältnis, Versorgungszahl, Ampel für Engpässe. Übernehmbar: **sofort**.
3. **Tractor Barn (Bright Harvest)**: +200 % Produktivität, −50 % Arbeitskraft, +50 % Felder, 1 Fuel/5 Minuten, max. ein Traktor je Farm, eigene Straße zur Fuel Station. Übernehmbar: **sofort** (Maschinen-Investitionsdialog).
4. Abgelehnt: Items/Experten-Slots (Sammler-Mikro), Insel-Bedürfnisse (ersetzt durch Bedarfsaggregate).

### 1.8 Workers & Resources: Soviet Republic

1. **Maschinen als echte Investitionsgüter**: Felder (small/medium/big) + Farms mit Fahrzeugen + Crop Storages; Felder starten bei 70 % Fertility; **„Set minimal fertility"-Schwellenregler** (Traktor düngt automatisch unter Schwelle); Fahrzeugstats und Lernkurven; Saison-Modus = eine Ernte/Jahr. Schwellenregel übernehmbar: später.
2. **Realistic Mode**: reale Baustellenlogik statt Instant-Bau (später: Material/LKW-Abstraktion als Verzögerungsrisiko).
3. Warnsignal: Community-Excel-Kalkulatoren (Excel-UI abgelehnt).

### 1.9 Tropico 6

1. **Weltwunder mit politischer Wirkung**: 17 Wunder, z. B. Eiffelturm (Radio-/TV-Reichweite), Freiheitsstatue (Einwanderer mit 100 % Zustimmung), Weißes Haus (halbiert Edikt-/Industriekosten). Beste Vorlage für „Vorteil ohne Geld" (Fachbereichs-Recherche).
2. **Zweikonten-Modell**: Schatzkammer vs. Schweizer Konto; Edikte in Stufen, zeitlich begrenzt („Tax Cut" im Wahljahr); Fraktionen wollen bestimmte Gebäude (Balancing: jede Fraktion 50–60 % Approval).
3. **Verfassungsparagraphen** mit begrenzten Plätzen; echte Gewaltenteilung macht Edikte langsamer, erhöht Freiheit.
4. **Gebäude-Modi**: 2–3 Modi je Betrieb, teils Bildungsbedarf („HS") (später).

### 1.10 Crusader Kings 3

1. **Annahme als Faktorenliste**: transparente Gründe (Militär, Rang, Meinung, Freund +25, Krieg in 12 Jahren −100, Nemesis −300). Vorlage für das Verhandlungsfenster (Gründeliste grün/rot).
2. **Haken (Hooks)**: schwach (einmal begünstigend) / stark (erzwingt Annahme, 5 Jahre Abklingzeit); Krieg gegen Verbündeten −25 Volksmeinung für 3 Jahre.
3. **Kronautorität** in vier Stufen (mehr Rechte gegen sinkende Vasallenmeinung); Rat aus Personen mit Fertigkeit und Beziehung.
4. **Bauen**: ein Bauplatz je Baronie plus Sonderbau-Slot; heilige Bauten 1.000 Gold und 6 Jahre; Hagia Sophia +20 Entwicklungswachstum (für christliche wie islamische Besitzer nutzbar).
5. **Kultur-Traditionen**: fünf Traditionsplätze, je 2.000 Prestige, Wechsel +50 %.
6. In REFERENZANALYSE v0.3 als noch zu analysierende Spielspaß-Referenz markiert (Figuren, entstehende Geschichten).

### 1.11 Weitere Referenzen (belegt)

- **Cities: Skylines 2**: Cluster-Politik „subsidize, then tax" (Subventionen etablieren, dann besteuern — Vorlage für Provinz-Spezialisierung); Waren-Inspector (Gut anklicken → Umwandlungskette, Import/Export-Bilanz; später); Monumente erst am letzten Meilenstein mit sechs vorherigen Einzigartigen Gebäuden; Straßenverschleiß/Wartungsdepots; stille Lagerengpässe.
- **Humankind**: Wunder per Einfluss beansprucht, dann gemeinsames Stadtprojekt; je +20 Stabilität, +100 Ruhm.
- **Old World**: Wunder belegt Kachel, gibt Siegpunkte und Legitimität, wechselt mit Stadtbesitz („Kultur als Kriegsbeute"); Unity-basiert.
- **Frostpunk**: exklusiver Gesetzespfad (jedes Gesetz verlangt das vorherige); schlechtes Ende im Totalitarismus; in REFERENZANALYSE v0.3 als Spielspaß-Referenz (Druck, moralischer Preis) vorgemerkt.
- **Stellaris**: Edikte in Einheit statt Geld, begrenzte Plätze.
- **SimCity / Port Royal**: genannt, aber ohne Primärquellen (Beleglücke). Railroad Tycoon: in den Dokumenten nicht ausgewertet.
- **Brettspiele Versailles 1919 / Weimar**: Interessenkonflikte, Verhandlungen, Mehrheiten (PROJEKTPLAN Einflussliste).
- **Diplomacy / Cicero (Meta FAIR, Science 2022)**: Sprachmodell + strategisches Reasoning auf menschlichem Spitzenniveau — Architektur-Blaupause für NWOs Verhandlungs-KI (Intent-Extraktion → ZOPA-Matching → Strategiemodell).
- **Papers, Please / Football Manager**: in REFERENZANALYSE v0.3 als noch zu analysierende Spielspaß-Referenzen (kleine Entscheidungen mit Tragweite; Posteingang als Heimat).
- **Technik-Referenzen**: SillyTavern (BYO-Key-Handling), POTUS Election Sim („No cloud, no key" als Offline-Fallback-Muster), Mem0/Generative Agents (Figuren-Gedächtnis), LangGraph (Human-in-the-Loop), Clausewitz-Kartenpipeline (provinces.bmp etc., entmystifiziert via Wayback).

---

## 2. Bestehende Übernahmelisten und Umsetzungsstand

### 2.1 Die Übernahmeliste aus RECHERCHE_MECHANIKEN

- Insgesamt **~50 konkrete Übernahmepunkte**, davon **~25 als „sofort"** priorisiert.
- **Top-10**: (1) D4-Kantenformel für alle Netz-Verbindungen; (2) D4-Problem-Hysterese; (3) HOI4-Gesetzleitern mit Schwellen-Gates; (4) HOI4-PE-Lernkurve + Retentions-Matrix; (5) Vic3/Anno/W&R-Maschinen-Stufenleiter (Traktoren/Mähdrescher); (6) Civ-6-Wunderlogik (Exklusivität, Standort, 50 %-Trostpreis); (7) Suzerain-Zeitung + Kostenlabels; (8) Civ-6-Lens-System; (9) D4-Political Capital + Minister-Drei-Rollen + Cynicism/Complacency; (10) D4-CSV-Datenhaltung mit Region-Overrides.
- Weitere „sofort"-Punkte je Bereich: Opposites/UNCANCELLABLE, Fokusbaum-Vokabular, National-Spirits-Kacheln, Event-Wettbewerb + Grudge-Decay (Politiknetz); Preisband 25–175 %, Subventionen als Budgetposten, Haushalts-Parallelität Staat/privat (Wirtschaft); PM-Stufenleiter, Traktor-Investitionsgut, Produktionsketten, Ressourcen-Mangelstrafe (Industrie/Landwirtschaft); Wunderlogik, Produktions-Queue, Bauvergabe an Firmen, Bauverzögerung (Großprojekte); Mobilisierungs-Gesetzleiter, Krisen-Blocker (Militär); Vertrags-Exklusivitäten, Grievance-Konten, Mediation als Alleinstellung (Diplomatie); Kostenlabels, verdeckte Beziehungsstatistik, Minister-Rollen, Reshuffle, Gefallen-Ökonomie, Berater-Agenda, Journal, Prolog-Mentoring (Figuren); Lens-System, Ketten-Diagramme, Wirkungslinien, Zeitung, Drei-Schichten, kausale Tooltips, Ghost-Slider, Boost-Balken, Knotenfarbcode, PC-Ringsegmente, Quartalsbericht (UI); CSV-Format, Region-Overrides, Provinz-Dateien, Entscheidungs-Kataloge, Event-TXT-Dateien (Datenhaltung).
- **Vier Bauklumpen als Konsequenz**: (1) Datenformat + Kantenformel + Hysterese; (2) PM-Leiter + Traktor + Ketten; (3) Wunderlogik + Bauqueue + Bauvergabe; (4) Zeitung + Labels + Lens + Tooltips. Zuerst zu schließen: Kernschleife „Agenda → Maßnahme → verzögerte Wirkung → Presse-Feedback".
- **Vier Alleinstellungen NWOs ohne jedes Vorbild** (zu schützen): freie Sprachbefehle, Agenda-Empfehlungen, berechnete Großprojekt-Folgen über Provinzen hinweg, Mediation zwischen Drittstaaten.
- **Negativliste (bewusst ausgeschlossen)**: Echtzeit-Kriegstaktik, Einheiten-/Fahrzeug-Designer, Score-Auktion-Friedensverhandlungen, detailliertes Nachschub-Netz, Popup-Flut, Excel-als-Haupt-UI, Mobile-first, Siegbedingungen als Zielscheiben, HOI4-Weltspannungs-Meter/Fokus-Narrativdichte, D4-Wahlkampf-Loop als Hauptziel, Anno-Insel-Bedürfnisse/Item-Slots, Vic3-Pop-Individualität, Civ-6-Builder-Charges; plus: Knappheit darf nie nur Produktionsstrafe sein (Preise/Inflation/Lira als NWO-Stärke).

### 2.2 Übernahme-Entscheidungen aus REFERENZANALYSE (mit „Nachweis im Prototyp"-Kriterien)

Civ 6: Vorhaben mit Ort, Standortbedingungen; Gathering Storm: regionale Naturgefahren-Exposition, Energie als Kopplung. Civ 7: Delegation an Kommunen, Wahlperioden statt Epochen, Beziehungs-erklärte Diplomatie. HOI4: Fähigkeiten-begrenzte Sicherheitspolitik (Beschaffung/Training/Wartung/Transport), vollwertiges Friedensspiel; Versorgung/Führung als begrenzende Faktoren; Rüstungsverträge mit Geld/Finanzierung/Lieferplänen statt Fabrik-Tausch. Suzerain: Gespräche mit Figuren-Gedächtnis, eigene Themen einberufbar, keine Pflichtdialoge. D4: sichtbares Netz (150+ Knoten) + Schreibfläche, regional je Provinz, Wirkungsansicht je Bereich, versioniertes Wirkungsmodell mit Voraussetzungen/Einheit/Zeitverzug/Begründung, bilanzierte Bestände/Zahlungsströme, keine Korrelation als Kausalität dargestellt; Länderpakete brauchen eigene Institutionen, nicht nur Startwerte.

### 2.3 Umsetzungsstand laut Dokumenten (Commit-Historie-/Log-Kommentare)

- **PLANERWEITERUNG §9 (Nachtrag 29.09.)**: Spielbarer Kern in `game/`; umgesetzt sind Teile von ECO-01 (Wirtschaft + Zentralbank), NET-01/POL-01 (Politiknetz je Provinz), PRO-01 (Prolog), ELE-01 (Parlamentswahl 2028), GEO-01 (Karte). Nächste Schritte: 1. Parlament als Engpass + Umfragen; 2. Ereignisbibliothek (SCEN-01, 20–30 Ereignisse); 3. Speichern/Laden (SAVE-01); 4. Figuren/Kabinett, dann Sprachbefehle (ACT-01, CHAT-01) und Agenda (AGENDA-01); 5. Karte: Tag/Nacht, Wetter, Markierungen.
- **ARBEITSLOG 29.09. abends** (nach der Spielbarkeitsanalyse, Auftrag „fixe alles"): Karten-Entscheidung = **Alternative aus Analyse 6.4** (Three.js bleibt, Linien/Beschriftung in Geräte-Pixeln pro Bild, Relief Zoom 8) statt MapLibre-Umbau; neue Module an `world.spiel` (alte Saves kompatibel); Geodaten erledigt: relief-z8.bin (5643×3512, 39,6 MB), OSM-Extrakt: **2,17 Mio. Straßenabschnitte, 973 Bezirke, 2.029 Krankenhäuser**; Schrittplan: 1. Sofortfehler (Gespräch, Kopfleiste, Vorschau, Speichern, Meldungen statt Pausen), 2. Ortsbezug/Politisches Kapital/Parlament/Kapazität, 3. Ereignismotor/Außenwelt/Figuren/Umfrage-Wahl-Ende/Ziele/erster Spieltag, 4. Karte, 5. Regionale Startwerte aus OSM, 6. Doku/Tests.
- **NACHTARBEIT 29./30.09.** (abgehakt): Zusage-Dauerfeuer behoben (Vertrösten max. 2×/3 Monate); **Wählerkoalition** (8 Gruppen mit Laune/Trend/Gründen/Forderungen, Wahlbarometer — D4-Muster); **Regierungsprogramme** (Fokusbaum-Analog: 8 Programme, 36 Schritte mit Bedingung/Dauer/Belohnung/Rabatt/Schutz); **Wirkungsberichte** nach 6/12 Monaten; **Länder als Akteure** (12 Länder, vier Beziehungsdimensionen, Anliegen, sechs Handlungen, Kartenebene „Beziehungen"); Ereignismarken auf der Karte; Einstieg „Nächster Schritt"; Handlungsfeld für Größen/Probleme/Gruppen mit Hebel-Stärke; **231 neue Politiknetz-Verbindungen** (jede Maßnahme ≥ 3 Folgen, Geld zuletzt); Balance-Modi Entspannt/Normal/Hart; Bot-Befunde behoben (Gipfel-Dauerschleife → Abkühlzeit 120 Tage, Sperre ab Vertrauen 82; Problemlöser-Vielfalt/Obergrenze 80; Riesenfraktion-Verbot; Vergabeaffären-Varianten + Sperrzeit 420 Tage; Länder-Forderungen 9 Monate gesperrt).
- **NACHTARBEIT 30.09.** (Blöcke N0–R): FACHBEREICHE.md (Konzept je Bereich: Größen, Inventar, Projekte, Wunder, Vorteile, Zielkonflikte, Ereignisse); `reich.ts` (Fachbereichswerte, Bestand, Projekte mit Bauzeit, Doktrinen/Reformen als Vorteile, Unterhalt/Verfall); Fenster „Reich" mit Reitern Recht/Militär/Infrastruktur/Kultur/Haushalt, Wundermarken, Fertigstellungs-Animation; Verhandlungstisch mit Klauseln (VERHANDLUNGSTISCH.md), Länder antippbar; Karte 2 aus OSM/geoBoundaries in voller Auflösung, Distanzfeld-Küste, Nachbarländer mit Städten; Parlament als animiertes Halbrund; Block M: KI mit mehreren Anbietern, neuer Schreibtisch, Kapital-Überziehung, Wirtschaft mit anklickbaren Kennzahlen. Offen darin: DEM z9, Rundflaggen-Pins, gemalte Porträts, Gesamtdurchlauf-Lesetest, Ton/Musik.
- **Nicht bestätigt umgesetzt** (aus den Dokumenten nicht ablesbar): D4-Kantenformel-Syntax/CSV-Datenhaltung als Datenformat, Problem-Hysterese mit getrennten Schwellen, PE-Lernkurve, Preisband 25–175 %, Grievance-Konten als bilaterale Konten (es gibt Beziehungsdimensionen), Mediation, Sprachmodell-Anbindung. Commit „Langpartie: Erwartungen an echte Umsetzungsdauern angepasst" deutet auf Umsetzungsdauer-Arbeit hin; die Dirty-Files (ki/aktionen.ts, parlament/*, reich/wunder, verhandeln) zeigen laufende Arbeit an KI, Parlament, Wundern.

---

## 3. Spielbarkeits-Analyse 29.09. (Kernbefunde)

**Kurzurteil**: gut gebaute Simulation mit Oberfläche, aber noch kein Spiel; die Kritik des Projektinhabers ist messbar richtig.

### 3.1 Keine Spielschleife (Befund A)

- **5 Jahre ohne Eingabe (Seed 42)**: Inflation 31,5 % → 7,5 %, Leitzins 37 → 11,5, Vertrauen 45,0 → 57,7, akute Probleme konstant 8, **0 spielerrelevante Ereignisse**; von 183 Logeinträgen alle bis auf 2 nur Zins/Statistik. „Nichts tun ist eine gute Strategie."
- **Dominante Strategien**: alle 90 Maßnahmen auf 100 → Vertrauen 100 ab Jahr 3, Probleme 8 → 1, Schulden nur 37,3 % BIP; Preiskontrollen allein → Vertrauen 63,9 für 0,08 % BIP; Mietpreisbremse → 58,5 für 0,00 % BIP. Extremfall (+20 %-Punkte Ausgaben + gefügige Zentralbank): unrealistisches Wachstum 18,5 %, danach Inflation 42 %, Lira 341 — aber **kein Zusammenbruch, kein Ende**.
- Ursache: Kantengewichte klein (Median 0,03/Monat, Max 0,10); 83 von 90 Maßnahmen mit Kosten, teuerste max. 1,2 % BIP; Gegenwirkungen langsamer/schwächer; Schuldenquote sinkt bei Inflation über nominelles Wachstum (Formel Z7). Alle Parameter Platzhalter (`economy.ts`), Kalibrierung ausstehend.
- **Was nie passiert** (Plan vs. Code): 19 Ereignisvorlagen → 0 (nur Amtsübergabe + Zinssitzung); Parlament als Engpass → `setPolicy` prüft keine Mehrheit (124/600 Sitze: Warnung, aber alles geht durch); keine Umfragen/Wahl nach Start; keine Figuren (Mentorin = 4 Textbausteine); keine Ziele/Agenda/Bilanz; keine Außenwelt (geschlossene Volkswirtschaft); erster Spieltag ohne Vorgänge; **kein Speichern/Laden in der UI** (Neuladen löscht die Partie); keine Schwierigkeit/Optionen.
- **Einziger Rhythmus stört**: Zinssitzung alle 45 Tage als blockierendes Fenster ohne Spieleroption; bei Tempo 3 alle 2,5 s ein Fenster, Tempo fällt auf Pause.
- **Sieben Säulen**: 1 Dilemmas (nicht erfüllt), 2 Figuren (fehlt), 3 Vergangenheit kehrt zurück (fehlt), 4 Druck/Rhythmus (fehlt), 5 Macht mit Preis (ansatzweise), 6 Geschichten (unmöglich), 7 Verstehen (teilweise; „Warum?"-Links echte Stärke).

### 3.2 Fehlende Detailtiefe (Befund B)

- 81 Provinzen, **0 Bezirke**, 0 Objekte (Straßen/Bahn/Häfen/Kraftwerke/Krankenhäuser weder Daten noch Karte).
- Provinzen haben nur 12 Felder; **kein Infrastrukturfeld**.
- Regionale Tiefe überwiegend Schein: nur **37 von 199 Größen** unterscheiden sich je Provinz (20/86 Größen, 9/15 Probleme, 8/8 Wählergruppen, **0/90 Maßnahmen**); 29 Regionalformeln sind grobe Ableitungen, keine Messwerte.
- `setPolicy` kennt keinen Ort: Wasserleitungen +90 wirken nach 3 Jahren in allen 81 Provinzen identisch (+17,17) — Entscheidung B („vor Ort muss gebaut werden") nicht umgesetzt.
- Ebene „Akute Probleme" färbt nach Anzahl, ohne Legende, ohne welches Problem wo.
- Systemisch: keine Branchen/Außenhandel/Haushalt als Einnahmen-Ausgaben; Bauen = Regler 0–100; Katastrophen treten nie auf (Beben 2023 existiert im Spiel nirgends); Außenpolitik/Militär/Medien/Justiz = nichts; Politiknetz 199 Knoten/412 Kanten gerechnet, aber Ansicht zeigt nur 1 Knoten + 8 Nachbarn.
- **Doku-Drift**: POLITIKNETZ.md/README nennen 186 Knoten/363 Kanten/77 Maßnahmen; Code hat 199/412/90.

### 3.3 Karte, Design, Bedienung (Befund C)

- **Unschärfe-Ursache**: festes Bild (4800 px) auf 3D-Fläche; Relief ~1,5 km/Höhenpunkt, Mesh 600×373; bei Max-Zoom 4,1 Geräte-Pixel je Bildpunkt (verwaschen), Höhenpunkt ~11-fach vergrößert, ~33 px je Mesh-Eckpunkt (weiche Flecken); Küste gezackt/versetzt. Übersicht ist scharf — Schärfe geht genau beim Zoomen verloren. `OVERLAY_W` erhöhen verschiebt nur das Problem (16.384-px-Limit).
- Plan-Widerspruch: TECHNIK.md beschloss „SVG aus GeoJSON mit d3-geo", Entwicklungsplan nennt MapLibre GL — gebaut wurde etwas Drittes (Three.js).
- Weitere Mängel: sichtbarer Kartenrand Ost/Süd; Städtenamen 8–10 px; „TÜRKİYE"-Schriftzug unscharf; nur 30/81 Provinzen mit Etikett; einfarbig kupferne Türkei; Relief wie „zerknittertes Leder"; keine Kartenobjekte/Meldungen; Akten-Fenster bedecken die Karte (kein gleichzeitiges Sehen von Entscheidung + Wirkung).
- UI: Kopfleiste bricht um/schneidet ab; **Vorschau blockiert 3.358 ms** (128 Vollkopien des Weltzustands à 15 ms/1,6 MB im Hauptthread); Vorschau sagt oft „kaum Unterschied"; „−0,0 %" mit Vorzeichen; NetGraph MAX = 8; **ASCII-Umlaute** („Moeglich", „Kanzlei") gegen eigene Regeln.

### 3.4 Gespräch (Befund, Kernidee des Spiels)

- Nur Schlüsselwortregeln in `befehle.ts`, kein Sprachmodell (0 Treffer). **40 Eingaben: 15 angenommen, davon 4 falsch ausgeführt, 25 abgelehnt → nur 11/40 korrekt.**
- Schwerwiegende Fehlausführungen: „Senke die Mehrwertsteuer" **erhöht** sie 60 → 85 („Mehrwertsteuer" enthält „mehr"); „Rede an die Nation halten" → Zeitstopp („halt"); „Erdbebenhilfe für Hatay" → Hilfetext („Hilfe").
- Nicht verstanden: Krieg, Verhandeln, Neuwahlen, Minister entlassen, Bauprojekte, Steuern, Umfragen, „Was soll ich als Nächstes tun?". Ehrliche Antwort „Das gibt es nicht" + Liste der Möglichkeiten wäre sofort besser.

### 3.5 Was gut ist

Simulationskern sauber getrennt, deterministisch, sehr schnell (1 Jahr in wenigen ms), JSON-speicherbar; 412 Kanten mit „Warum"-Satz; Startdaten mit Herkunft/Stichtag; geschlossene Oberflächensprache (Messing/Papier/Siegel), 60 fps ohne Konsolenfehler; Prolog verändert echten Zustand; tsc sauber, 35 Tests grün, Playwright-Durchlauf existiert.

### 3.6 Ursachen

Breite vor Tiefe (12 Themenfelder parallel); Plan überholt Code (67.612 Wörter Doku vs. 1.659 Zeilen Simulation, 32 Commits in ~31 h); Spaß-Tor nie durchlaufen (Entscheidungen D/G: „S1 vollständig bauen, dann testen" — das dokumentierte Risiko ist eingetreten); Tests prüfen „läuft", nicht „ist ein Spiel"; Platzhalter-Parameter; falsche Kartenbasis; **zwei Ordner** (alter Ordner `~/Desktop/NWO NEW WORLD ORDER/` mit veralteter ENTSCHEIDUNGEN.md, ARBEITSPROMPT zeigt dorthin); PLANERWEITERUNG führt Anwalt/Steam/Marketing als „P0" gegen Entscheidung J (lokal, kein Vertrieb).

### 3.7 Empfehlung (Stufen 0–5)

- **Stufe 0 Sofortfehler** (1 Sitzung): Befehlsauswertung, Kopfleiste, Vorschau in Web Worker/Änderungsverfolgung (< 200 ms), Zinssitzung als Meldung, Speichern/Laden, Ordner zusammenführen, Block K eintragen, messungen.test.ts ins Repo.
- **Stufe 1 Kartenbasis**: ein Sitzungs-Versuch Kachelkarte (MapLibre + PMTiles) an Adana/Hatay, Kriterium „mindestens so schön wie heute, scharf bei jedem Zoom"; Alternative: Three.js mit Geräte-Pixel-Neuzeichnung (gewählt wurde laut ARBEITSLOG die Alternative).
- **Stufe 2 Vertikaler Schnitt „Bauen und Versorgen"**: Bezirke als Recheneinheit, Objekte mit Erreichbarkeit, ortsbezogene Bauaufträge (Ausschreibung/Verzögerung/Korruption), Erdbeben/Dürre als Ereignisse, Ebene „Wo fehlt was?".
- **Stufe 3 Spielschleife**: Ereignismotor (19 Vorlagen), Außenwelt (Öl/EU-Nachfrage/Weltzinsen), Parlament als Engpass, 8–10 Figuren mit Zusagen-Gedächtnis, Ziele/Umfragen/Wahl/Ende. Prüfmaß: 5 Jahre ohne Eingabe keine gute Strategie; ≥ 1 Ereignis/Spielmonat.
- **Stufe 4 Gespräch**: Sprachmodell mit eigenem Schlüssel + geschlossener Aktionskatalog; Regeln als Fallback; Ziel ≥ 35/40 korrekt, 0 Fehlausführungen.
- **Stufe 5 Kalibrierung/Härte**: Lernfälle Zentralbankwechsel 2019, Lira 2021/22, Erdbeben 2023.
- Datenlage geprüft: Höhenkacheln Zoom 10 abrufbar (~1.350 Kacheln, ~115 MB für die Türkei, Schätzung); OSM-Extrakt 648 MB vorhanden; Bezirke via OSM/HDX (GADM ausgeschlossen); TÜİK-Zellen < 3 Einheiten geheim. Mengenrechnung: 973 Bezirke × 199 Größen ≈ 12× Weltzustand → Vorschau muss auf Änderungsverfolgung umgestellt werden.
- **analyse_2026-09-29/**: `messungen.test.ts` (5 Messungen: Verläufe, Kosten/Einzelwirkung, 40-Eingaben-Gesprächstest, regionale Tiefe, Leistung) + Ausgabe; `logik_audit.test.ts` (Bots passiv/klug/staatsmann über 7 Startprofile, Ereignishäufigkeit je Vorlage); `belege/` (4 Screenshots + 2 Playwright-Skripte); ARBEITSLOG.md (Umsetzungsplan).

---

## 4. Projektplan-Stand

### 4.1 Phasen (PROJEKTPLAN §18)

- **Phase 0 – Spielspaß beweisen**: optional S0 Papiertest (vorbereitet in S0_PAPIERTEST/, „Die Klinikum-Affäre", fiktive Republik Estravia; Bestehen: 3/5 Testpersonen wollen nach 45 min weiterspielen), dann **S1 lebendige Welt** (Türkei zum Stichtag, Präsident, 1 Jahr, volles Politiknetz 150+ Knoten, gezeichnete Karte, 20+ Figuren, ~10 Ereignisvorlagen; kein Militär/Außenpolitik). **S1 wird vollständig gebaut und dann getestet** (Entscheidung; Risiko dokumentiert und eingetreten laut Spielbarkeitsanalyse). Spaß-Tor: 60 % wollen weiterspielen, ≥ 3 Figuren namentlich bekannt, ≥ 1× > 1 Minute gerungen, keine beste Strategie in 3 Durchgängen, ≥ 1 frühere Entscheidung kehrt zurück, niemand nennt es „Akten lesen"; plus Oberflächen-Prüfkriterium. Lern-Tor zusätzlich (60 % erklären Wirtschaftszusammenhang korrekt; Volkswirt findet keine Fehler).
- **Phase 1**: Spielregeln/Ländergrundlage (Land, Stichtag, Regelmodell, Datenübersicht mit Lücken).
- **Phase 2**: Durchgängiger Prototyp (1 Regierungsquartal, Kabinett, Opposition, Medien, 81 Provinzen + aufklappbare Großstadt, 1 Bauprojekt, wenige Außenpartner; verbindet Wirtschaftsproblem + Skandal + Verhandlung; Abnahme: freie Anweisung korrekt verstanden → Verfahren → nachvollziehbare Folgen).
- **Phase 3**: erste vollständige Kampagne (Legislatur, Wahlen, Regierungswechsel, Personalentwicklung, Opposition als Einstieg).
- **Phase 4**: Verträge, Beschaffung, Sicherheitskrisen vertiefen.
- **Phase 5**: zweites Land (Deutschland als Kandidat), längere Weltentwicklung.
- Projekt läuft nebenbei (ExamLab hat Vorrang); Team = Projektinhaber + Claude; Verkaufsentscheidung nach Prototyp.

### 4.2 Meilensteine (ENTWICKLUNGSPLAN §2)

Reihenfolge: **Spaß-Tor (S0/S1) → M0 Szenario/Regeln belegbar → M1 Welt ohne Gespräche (Zeit, Haushalt, Speichern/Laden, reproduzierbar) → M2 Absichten → Handlungen (Handlungskatalog, Rückfragen; keine Zustandsänderung aus unbelegter Modellaussage) → M3 politische/regionale Folgen (Spaß-Tor erneut) → M4 Außenpolitik/Verträge/Verteidigung** (M1–M4 = 90-Tage-Prototyp) **→ M5 volle Kampagne → M6 Übertragbarkeit/Veröffentlichung**. Technikwahl (TECH-00) vor S1; Stand 28.09.: Simulations- und Kartenversuch bestanden (TypeScript/React/Vite/SVG-Karte laut TECHNIK.md), **Sprach- und Bildversuch offen** (brauchen Schlüssel/Bildgenerator).

### 4.3 Arbeitspakete und Prioritäten (ENTWICKLUNGSPLAN §3)

P0 (Voraussetzung Prototyp): TR-00, ECO-00, CB-01, MENTOR-01, EVT-00, TECH-00, ART-00, NET-01, FUN-01, CHAR-01, UI-00, KEY-01, DATA-01, RULE-01, SIM-01, ECO-01, ACT-01, GEO-01, BUILD-01, POP-01, PER-01, EFF-01, CHAT-01, UI-01, EVT-01, DIP-01, TR-01, DEF-01, WAR-01, QA-01, SECT-01, DIS-01, PRO-01, SAVE-01. P1: ELE-01, ELE-02 (Wahlmanipulation als Stufenleiter), OPP-01, LONG-01, POW-01 (Medien/Justiz/Verfassung/Geheimdienst als Stufenleitern), LEGACY-01, COUNTRY-02. P2: FUN-00, MOD-01.

### 4.4 PLANERWEITERUNG (aus Gesamtrecherche)

- Gewichtung: nicht Technik ist der kritische Pfad, sondern drei Vorlaufthemen: **Rechtsfigur-Frage** (Art. 299/301 TCK; 128.872 Ermittlungen 2014–2019; nur fiktive Figuren, TR-Geoblock), **Datenfreigaben** (TCMB schriftliche Erlaubnis nötig, YSK-Lizenz unklar), **Steam-Klärung BYO-Key**.
- **Vorlaufspur P0**: LIC-01 (Anwalt DE+TR), NAME-01 (Markenrecherche), VALVE-01 (BYO-Key-Anfrage), DATA-FREI (TCMB/YSK), TR-DAT (Startdaten), TR-GEO (Geodaten-Pipeline ogr2ogr → mapshaper → tippecanoe → .pmtiles).
- **Technikspur**: TECH-00, SIM-00 (ganzzahliger Tagesschritt, RNG-Seeds, Event-Log, JSON + SQLite, keine ECS), KI-00 (geschlossener Aktionskatalog, Strict-Schema, Reparatur-Loop max. 2–3, clarify-Tool, Zwei-Pass-Erzählen), KI-01 (drei Modi: BYO-Key / lokal / Offline-Vorlagen), KI-02 (Fakten-Ledger-Gedächtnis, Mentorin als RAG mit `unknown`-Flag), ART-01 (Bildpipeline mit verbindlicher Nachbearbeitung).
- **Drei neue Tore vor Veröffentlichung**: Rechts-Tor, Daten-Tor, Markt-Tor (Wishlists ~15.000 als Schwelle, Demo-Retention, Next-Fest-Score).
- **Entscheidungsvorlagen**: Engine entlang der Versuche; TR-Vertrieb mit Geoblock; Figurenkanon nur fiktiv; Name **entschieden: „Staatsräson"**; KI-Modi als Pflicht; Preis 19,99 € / DLCs 9,99–14,99 €, **kein Early Access**; Stichtag Quartalsende; Scope „ein Land + eine Amtszeit".
- Kostenschätzung KI: ~0,15–0,35 USD/Spieltag (Schätzung), Kostenziel < 0,30 USD/Sitzung.
- **Nachtrag 29.09.**: neue Dokumente INNENPOLITIK.md, AUSSENPOLITIK.md, GROSSPROJEKTE.md, SZENARIEN.md (18 Ereignisvorlagen); neue Pakete POL-01, GRO-01, GRO-02, MED-01, SCEN-01, HART-01, AGENDA-01; Datenbasis-Parameter (Gravitationselastizität −0,8…−1,1; Agglomeration +3–8 %/Verdopplung; Kostenüberschreitung Schiene ~45 %/Straße ~20 %; Verkehrsprognosen 25–60 %; Getreideabkommen 33 Mio. t).
- **Nachtrag-Implementierungsstand + Hinweis 30.09.**: nach Entscheidung J (Priorität Spielbarkeit, lokal) sind Steam/Anwalt/Marketing nachrangig — die Spielbarkeitsanalyse kritisiert, dass PLANERWEITERUNG diese dennoch als „P0" führt (Angleichung offen).

### 4.5 Versionierte Planänderungen

v0.3: Spielspaß an die Spitze (Säulen, Spaß-Tor). v0.4: Lernspiel, keine Szenarien, Lern-Tor. v0.5: S1 enthält volles Politiknetz + Karte, Technikwahl vor S1, „S1 vollständig bauen, dann testen".

---

## 5. Konkurrenz/Fachbereiche (RECHERCHE_KONKURRENZ_FACHBEREICHE)

Anlass: Kritik „alles mit Geld gemessen", „keine Vorteile, kein Inventar". Kernbefund: In allen Vorbildern ist Geld nur eine von 4–6 Währungen; jede hat eigene Quelle, Deckel, Defizitfolge. Ergebnis je Bereich (floss in FACHBEREICHE.md und `reich.ts` ein):

1. **Geld/Haushalt/Nebenwährungen**: Vorbilder D4 (Politisches Kapital, Kreditrating), Vic3 (drei Kapazitäten mit Defizitfolgen), Civ 6 (jede Währung kauft etwas anderes, Politikkarten als Slots), HOI4 (Politische Macht, Fabrikslots), Tropico 6 (Schatzkammer/Schweizer Konto). Übertrag: **Verwaltungskraft, Baukapazität mit Warteschlange, Legitimität** (skaliert alle Erträge, sinkt durch Ausnahmerecht), **Devisen/Marktvertrauen, Außenhebel**; Inventar: Institutionen (Stufen), Projekte, Kader (Slots mit Loyalität), Sonderrechte/Verträge, Staatsunternehmen; Dauervorteile („Landesgeister") über Meilensteine, immer mit Kehrseite. **Regel: Jeder Besitz nennt mindestens zwei Ressourcen und einen Verlierer.**
2. **Recht/Justiz/Institutionen**: Vorbilder D4, Vic3 (Institutionen/Legitimität 25), CK3 (Kronautorität 4 Stufen), Tropico 6 (Verfassungsplätze), Suzerain (Oberstes Gericht mit Lagern, Verfassung 2/3 + Gericht), Frostpunk (exklusiver Pfad), Stellaris (Edikte in Einheit). Türkei-Fakten: AYM 15 Mitglieder (12 Präsident/3 Parlament), Individualbeschwerde seit 2012, Verfahrensdauer 512 Tage 2024 (+61 %); HSK 13 Mitglieder, Vorsitz Justizminister; „Gesetz braucht 301" real nur für Veto-Rückannahme (Art. 89), sonst Art. 96 (einfache Mehrheit, min. 151); Verfassung Art. 175 (360 mit/400 ohne Volksabstimmung); OHAL 2016–18: 32 Dekrete, 125.678 Entlassungen, 4.296 Richter/Staatsanwälte; EGMR 74 Urteile 2025 (66 mit Verletzung), 22.566 anhängig; Haft 433.520 bei 304.956 Plätzen (~142 %). Übertrag: Größen Justizkapazität, Unabhängigkeit, Effizienz, Rechtssicherheit, Urteilsbefolgung, Haftauslastung, Ausnahmegrad 0–3, Straßburg-Druck; **Reformen kosten kein Geld, sondern Politisches Kapital, Stimmen, Umsetzungsrunden, Bürokratie-Zeit — jede mit Nebenwirkung.**
3. **Militär**: Vorbilder HOI4 (Manpower-Gesetze, Divisionsdesigner, PE-Linien, Lizenzmali −25/−35/−50 %, Stockpile, Doktrinen 100 Erfahrung, Fokus 70 Tage/70 PP), Civ 6 (Unterhalt, strategische Ressourcen, Kriegsmüdigkeit), Vic3 (Kasernen, Armeemodelle); D4 als Gegenbeispiel („alles ist Geld"). **Tiefe auf Präsidentenebene: bestellen und verantworten, nicht kommandieren.** Türkei: 481.000 aktiv/380.000 Reserve, Budget ~25 Mrd. USD (2,09 % BIP 2024), Jandarma ~198.000 beim Innenministerium, YAŞ/SSIK/SSB-Hebel, Wehrpflicht 6 Monate + Bedelli (280.850 TL), NATO-Zweitgrößte, Rüstungsexporte 10,05 Mrd. USD 2025 (+48 %), Programm-Tabelle (KAAN, Eurofighter, F-16 Block 70, F-35 blockiert, S-400/CAATSA, Stahlkuppel/Siper, Altay T1, TB2/TB3). Übertrag: je Teilstreitkraft Einsatzbereitschaft/Modernisierung, Industrie-Unabhängigkeit je Sektor, Wehrdienst-Regler, Lebenszyklus (Bedarf → Angebot → Vertrag → Fertigung → Tranchen → Einführung → einsatzbereit → Alterung), Sonderzustände (blockiert/eingelagert/verzögert/storniert), Doktrinen 3 Äste × 3 Stufen sich ausschließend.
4. **Infrastruktur/Großprojekte**: Vorbilder Civ 6 (Distrikte, Wunder mit Standortregeln, 50 %-Trostpreis, Wettlauf, Wunderfilme), HOI4 (Infrastruktur 0–5, nur Zivfabriken), Vic3 (Infrastruktur-Kapazität, Marktzugang, Baupunkte, Fortschrittverlust), Cities/Anno (Monument-Gates, Wartung), Tropico 6 (Wunder mit politischer Wirkung), CK3 (Bauplätze). Türkei-Tabelle: Marmaray (Verzug ~4 Jahre, Fund Yenikapı), Osmangazi (BOT-Garantie 40.000 Fz/Tag, Nutzung darunter), Flughafen Istanbul (BOT 25 Jahre, 90 Mio. Pax Phase 1, 657.950 Bäume, 27 Arbeitertote), YHT 1.385 km, Kanal Istanbul (angekündigt 2011, Aushub nicht begonnen; Trinkwasser/Montreux), GAP (22 Dämme/19 Kraftwerke; Ilısu/Hasankeyf), Akkuyu (Rosatom BOO, 4×1.114 MW ≈ 10 % Strom), Çanakkale-Brücke (Garantie 16,425 Mio. Fahrten vs. real 1,464 Mio.), BTK-Bahn, Erdbebenwiederaufbau (319.000 versprochen vs. 201.431 geliefert — „Versprechensschuld"), TEİAŞ 72.000 km. Übertrag: **fünf Netze (Straße/Schiene/Strom/Wasser/Daten) je Provinz mit Kapazität/Nutzung**, Engpass = min(1, Kap/Nutz); Wartung bindet Baukapazität statt Kasse; Baukapazität als knappe Landesgröße mit Warteschlange/Priorität (Pausieren kostet keinen Fortschritt); Lebenszyklus Vorschlag → Machbarkeit → Beschluss → Bau → Eröffnung → Betrieb → Verschleiß → Sanierung; **Wunder = dauerhafte Regeländerung statt Geldzuschlag**, ortsgebunden, einmalig, mit Eröffnungsfeier; bei schlechtem Zustand fällt der Vorteil aus.
5. **Kultur/Erbe/Wunder/Tourismus**: Vorbilder Civ 6 (Wunder-Tourismus, Kultursieg, Wunderfilme), Humankind (Einfluss-Beanspruchung, +20 Stabilität/+100 Ruhm), Old World (Wunder = Siegpunkte/Beute), Vic3 (Akzeptanz), CK3 (Traditionen), D4 (Tourismus bis +12 % BIP). Warum Wunder funktionieren: Knappheit, Standortbedingung, langer Ertrag, Bauinszenierung, Erzählwert. Türkei: **Katalog von 53 Stätten** (maschinenlesbar in `game/src/data/erbe.ts`), alle 22 Welterbestätten, die sieben Kirchen der Offenbarung; Bedrohungen (Erdbeben Antakya > 50 %, Raubgrabung Gesetz 2863, Massentourismus Pamukkale 1,4 Mio./Jahr, Nutzungsstreit Hagia Sophia, Hasankeyf); Tourismus 2025: 52,78 Mio. Gäste, 65,23 Mrd. USD; Vorbild-Projekt „Geleceğe Miras" (251 Grabungsstätten). Übertrag: Kulturgrößen (Erhaltung, Tourismus, Identität/Zusammenhalt, Ansehen, Minderheitenvielfalt-Akzeptanz); Inventar je Stätte (Zustand, Risiko, Kapazität, Nutzungsmodus); Projekte Restaurierung/Ausbau/**Serien und Pilgerrouten mit Set-Bonus**/Riesenprojekte mit Zwischensequenz/Ausgrabung; Kopplungen (Zustand ↔ Tourismus ↔ Überlast); statt Rivalen-Wettlauf: Haushaltskonkurrenz, Baukapazität, Erdbebenrisiko, Zeitfenster; Vorteile ohne Geld (Ansehen, Legitimität, Diplomatiekarten, Feste, Tourismus-Multiplikator).
6. **Diplomatie/Verhandlung**: Vorbilder Civ 6 (Sichtbarkeit 5 Stufen, Agenden ±4 bis ±15, Allianzen Stufe 1–3), HOI4 (PP-Kosten, Weltspannung), Vic3 (Vertragsartikel, Paketbewertung > +30/≤ 0, Pflicht +30/−40), CK3 (Faktorenliste, Haken), Suzerain (Warnungen im Dialog statt Zahlen). **Vermittlung zwischen Dritten: in keinem Spiel gefunden — NWO-Alleinstellung.** Übertrag: Klauselkatalog (Türkei bietet: Zollsenkung, Transit, Meerengenzusage, Militärzugang, Rüstungskooperation, Bauaufträge, Gas, Visa, Grenzöffnung, Vermittlung; verlangt: Sanktions-/Technologiefreigabe, Zahlungsweg, Preisnachlass, rote Linie, PKK/PJAK, Kredit/Swap); Bewertung = Interessengewicht × Klauselwert + Vertrauen + Hebel − Strafen für Brüche; **rote Linie = Veto**; Gründeliste grün/rot; Gegenangebote (knapp unter Schwelle: eine Änderung; weit darunter: rote Linie); Prüfereignisse je Runde; Vermittlung mit Vermittlungskapital + Paket für A und B. Dazu 16 belegte Länder-Verhandlungsdossiers (USA/F-35, EU/Zollunion, Russland/Gas Ende 2026, China, Griechenland/Casus belli, Iran, Syrien, Irak/Kirkuk-Ceyhan, Aserbaidschan, Armenien, Golf/Mecca-Pakt, Israel, Ukraine, Georgien, Ägypten).

---

## 6. Offene Punkte (vollständige Liste aus allen Dokumenten)

### 6.1 Aus RECHERCHE_MECHANIKEN („Gaps und offene Fragen")

Beleglücken: HOI4-Formeln aus Snapshots 03/2024 bzw. 2021 — Patches 1.17–1.19 (Kohle/Strom) nicht verifiziert; D4: reale Koeffizienten der `policies.csv`, PC-Generierungsformel, Credit-Rating-Formel, Inflationsmechanik fehlen (Empfehlung: D4-Datendump); D4-Review-Kritik nicht belegbar (Suchsperren); Civ 6: Kaufpreis-/Unit-Kostenformeln, Adjacency-Werte, Science-Kostenkurven; „Popup-Flut"-Kritik unbelegt; Suzerain: Parlamentssitze 250/~167 [Spielerwissen] zu verifizieren, Entscheidungslänge/Turn undokumentiert; Vic3-Werte aus Wayback 08–09/2025; Anno-Item-Werte jenseits Tractor Barn unvollständig; SimCity/Port Royal ohne Primärquellen; GDC-Talks, YouTube-Guides, GameStar nicht ausgewertet.

Acht offene Designfragen: (1) militärischer Handlungsraum unspezifiziert — Kriegs-/Krisen-Mechaniken brauchen eigene Recherche; (2) Intent-Vollständigkeit der Sprachbefehle (kein Positivvorbild); (3) Transparenz vs. Realismus (Regler für sichtbare/verdeckte Werte?); (4) Wahltermin: feste Legislatur oder freie Neuwahl?; (5) Balancing-Werte ohne Playtests nicht seriös schätzbar; (6) Timer/Fristen als optionale Spannungsebene; (7) Lagerhaltung vs. Fluss-Verfall (Grundentscheidung Wirtschaftsmodell); (8) Korruption als Simulationswert vs. Event-System.

### 6.2 Aus REFERENZANALYSE (§7)

Eigene Spieltests der Referenzen (Gesprächslänge, Warnmeldungen, Kartenwechsel, Delegation, Langkampagnen-Last); Patch-/Erweiterungsstand vor Versionsvergleichen protokollieren; für das erste Land Institutionen, Datenlizenzen, Verwaltungsebenen, Datenlücken separat prüfen; NWO-Regeln durch Prototypen testen; **v0.3 neu**: Spielspaß-Referenzen analysieren (Crusader Kings III, Frostpunk, Papers, Please, Football Manager) — Leitfrage „Wie erzeugen sie den Wunsch weiterzuspielen?" — **bisher nicht durchgeführt**.

### 6.3 Aus RECHERCHE_GESAMTBEDARF („Offene Punkte und Gaps" + To-do-Listen)

- Datenquellen: TÜİK-REST-API-Inventar offen; EVDS3-Doku/Key; YSK-Exportformate/Lizenz; mevzuat-Rechtsmitteilung; amtliche TR-Geodaten-Lizenzen; IWF/OECD-Terms; Umfrage-Lizenzen (KONDA/MetroPOLL/ORC/ASAL/AREA/Optimar/PİAR/SONAR); Stichtagstermine je Indikator; Geodaten-Sonderfälle (Seen, geteilte İlçe-Polygone).
- Technik: Tauri-vs-Electron-Benchmarks; Painterly-Look-Rezept für MapLibre fehlt; fps auf Low-End ungemessen; Eevee vs. Cycles; Save-Serialisierung ohne Leistungsdaten; Tool-Formate nur Anthropic-seitig belegt; Kosten-/Latenz-Messwerte Dialoglast fehlen.
- KI: deutsche Dialogqualität je Modell ohne Benchmark; Valve-AI-Policy nur indirekt; EU-Code-of-Practice-Finalstand (damals offen, in WELTDATEN geschlossen: final 10.06.2026); Kostenrunaway-Fälle bei BYO-Key undokumentiert.
- Recht/Vertrieb: keine deutschen Urteile zu Politiker-Ähnlichkeit in Spielen; Deep-Fake-Dimension; postmortales Persönlichkeitsrecht (Atatürk/Gesetz 5816); BTK-Sperrpraxis für Spiele unbelegt; Markenrecherche nicht durchgeführt; Epic/GOG-Richtlinien; AI-Act-Durchsetzung DE; BYO-Key-AGB-Muster; TR-Digital-Service-Tax (7,5 %) unverifiziert.
- Markt: keine offiziellen Verkaufszahlen (SteamSpy-Schätzungen); kein systematisches Review-Mining damals (in WELTDATEN nachgeholt); keine BYO-Key-Kundenreaktionen; keine EA-Postmortems; Next-Fest-Konversion der Nische unbekannt.
- To-do: 7 Beschaffungs-, 7 Antrags-, 10 Entscheidungs-, 7 Anwaltspunkte (s. konsolidierte Liste; größtenteils in PLANERWEITERUNG übernommen; nach Entscheidung J teilweise nachrangig).

### 6.4 Aus RECHERCHE_WELTDATEN („Verbleibende Gaps", Stand 29.09.)

Drei fehlende Datenklassen vor Balancing: (1) **Bevölkerung (ADNKS je İl/İlçe) und Militär-/Verteidigungsdaten** (in keiner Recherche erhoben); (2) regionale Feinwerte (WRI-Aqueduct-ZIP vorhanden aber nicht ausgelesen, SPEI/PDSI je Becken, Agrarmengen in Tonnen, Kupfer-Reserven, Goldproduktion, Energierechnung 2025/26); (3) Justiz-Basisraten (AYM-Statistik, Richterdichte, Verfahrensdauern, EGMR-Umsetzungsstatus, Vertrauensumfragen). Dazu die detaillierte Gap-Liste je Feld (Rohstoffe, Energie, Wasser, Rechtsstaat, Datenquellen) und To-dos: TÜİK-/EVDS3-Keys beantragen, YSK-JSON sichern, Stichtag final festlegen (Empfehlung 31.12.), Rohdaten als ETL-Fixtures versionieren; technisch: Save-Architektur, Regel-Schicht mit Audit, ≤ 20 Strict-Tools, DE-Eval-Suite, Bildpipeline, AI-Act-Umsetzung.

### 6.5 Aus RECHERCHE_INNENPOLITIK

- **To-do Beschaffen (9)**: TÜİK-Regionaldaten je İl; IO-Multiplikatoren aus VGR-Tafeln; YSK-Wahlbeteiligungsreihen; Suç-İstatistikleri-Vollreihe; Terrorismus-Jahresreihe; DASK-Quote/AMATEM-Plätze; Miet-/Baupreisindizes; UCDP/Mediationsdaten; TEU-Reihen Nachbarhäfen.
- **Verifizieren (5)**: [LK]-Literatur-URLs (Disdier & Head, Silva & Tenreyro, Hummels & Schaur, Flyvbjerg, Rosenthal & Strange, Duranton & Turner, Faber, Green-Book-Uplifts, EIB/WB-KBA); Bechtel/Svåleboeg-Referenz (mögliche Verwechslung); Mecca-Abkommen-Primärtext; Rechtsnormen gegen Resmî Gazete; Quellenkonflikte (SGK-Haushalt, Adipositas, Beben-1999-Opfer, Waldbrand 2021, GHG 600 vs. 646 Mt).
- **Entscheiden (8)**: Doppelkennzahlen verpflichtend; Default „halbherzige Einhaltung"; Unsicherheitsband immer sichtbar; Crowd-out-Gewicht −50 %; Verkehrsrealisierung 25–60 %; Beziehungs-Matrix als Schätzung labeln; Medienfilter zwei Kanäle; LLM-Schnittstelle nach Cicero-Muster.
- **Datenlücken** (7 Gruppen, ausführlich): u. a. Reallohnentwicklung, Mindestlohnbezieher-Anteil, Armutsquote, regionale Einkommensdezile, SGK-Defizit; Gesundheitsausgaben % BIP, Ärztedichte aktuell, Brain Drain, Eigentumsquote, Obdachlosigkeit nur Schätzung; Aufklärungsquoten, regionale Kriminalitätsraten, OHAL-Bilanz, Polizeistärke; Haushaltsgröße, Auswanderung, Parteimitgliedszahlen, Demonstrationsstatistik (strukturelle Lücke), Institutionsvertrauen; PM2.5 je Metropole, DASK-Quote, AFAD-Gefährdungskarte, İstanbul-Bebenwahrscheinlichkeit, Stau-Index; Handelsvolumina je Partner, Mecca-Wortlaut, NATO-Primärstatistik, Truppenstärken je Einsatz, SIPRI-Rang, TB2/Akıncı-Stückpreise; Panamakanal-Verlagerungsstudien, Hafenwahl-Elastizitäten, IO-Multiplikatoren Türkei; historische Implementierungsgrade von Abkommen, Mediations-Erfolgsquoten.
- **Methodenwarnung**: TÜİK-Portale sind JS-Apps (nicht maschinell auslesbar) — TÜİK-Zahlen derzeit nur über Presse zweitbelegt, vor Spielintegration gegenprüfen; Schlagzeilen-Belege nur mit Vorbehalt; [LK]-Literatur ohne verifizierte URLs.

### 6.6 Aus ANALYSE_SPIELBARKEIT (offene Fragen an den Projektinhaber)

1. Kartenbasis: Einverständnis mit Kachelkarten-Versuch (mit Three.js-Alternative als Rückfall)? — **faktisch entschieden: Alternative gewählt (ARBEITSLOG)**.
2. Reihenfolge: Stufe 0 → Karte → Schnitt „Bauen und Versorgen"? Oder anderer Bereich zuerst (Wasser/Dürre, Energie, Gesundheit)?
3. Aufräumen: Block K in ENTSCHEIDUNGEN.md eintragen (war noch nicht eingetragen), alten Ordner zu Verweis machen, PLANERWEITERUNG an Entscheidung J angleichen.
4. Gespräch mit Sprachmodell braucht Schlüssel + Kostenrahmen (Freigabe vor bezahlten Läufen).
- Stufen 0–5 als offenes Umsetzungsprogramm (teils in Nachtarbeiten begonnen/erledigt, s. 2.3).

### 6.7 Aus PLANERWEITERUNG / ENTWICKLUNGSPLAN

- Sofortmaßnahmen (8): TCMB anschreiben; YSK anschreiben; Valve anfragen; TÜİK-Vollinventar; Geodaten beschaffen; Namen-Shortlist + Markenrecherche; Art-Bible „Figurenregeln"; Anwaltstermin LIC-01. — Nach Entscheidung J (30.09.) teilweise nachrangig; Widerspruch PLANERWEITERUNG-P0 vs. Entscheidung J unaufgelöst dokumentiert.
- Vor M0 zu konkretisieren: Datenstichtag, räumliche Auflösung je Provinz/Bezirk, kleinste belastbare institutionelle Abbildung.
- Durch Versuche zu entscheiden: **Sprachversuch und Bildversuch offen**; Anzahl Bevölkerungsgruppen; militärische Detailtiefe; unterstützte KI-Anbieter/Kosten; Tauglichkeit KI-Bildgenerierung.
- Nach Prototyp: Verkauf, Vertriebsweg, Datenaktualisierung, Support, Erweiterungswerkzeuge.

### 6.8 Aus NACHTARBEIT_2026-09-29 („Was ehrlich noch fehlt")

1. **Sprachmodell** für Gespräch/Mentorin (mittel; braucht Schlüssel + Kostenfreigabe).
2. **Krieg, Militär, Verträge mit Klauseln, Vermittlung** (AUSSENPOLITIK 4–6; groß).
3. **Freie Großprojekte** (ENTSCHEIDUNGEN I; groß).
4. **Weitere Länder spielbar** (sehr groß; offene Rückfrage: „übrige Länder" als Gegenüber umgesetzt — gemeint oder Spiel länder?).
5. **Szenarien und Schwierigkeitsgrade** (mittel).
6. **Ton und Musik, gemalte Porträts** (mittel; Zeichnung bisher Scherenschnitt).
7. **Kalibrierung an echten Spielern** (fortlaufend; alle Zahlen Platzhalter, Bots zeigen nur Richtung).
- Offen aus Nacht 30.09.: DEM Zoom 9, Rundflaggen als Pins, Gesamtdurchlauf bis zur Wahl lesen, Ton.
