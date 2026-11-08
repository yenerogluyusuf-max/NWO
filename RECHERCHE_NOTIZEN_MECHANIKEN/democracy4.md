# Democracy 4 (Positech Games, Cliff Harris) — Mechanik-Bestandsaufnahme für „Staatsräson" (NWO)

Stand: September 2026. Nur Spielmechaniken. Quellenlage: Offizielle Positech-Modding-Doku (primary source, sehr detailliert), SteamAH-Guides (offenbar aus cliffskis offiziellem Manual/FAQ übernommen, Credit an cliffski), Democracy-Wiki (Fandom), Steam-Diskussionen. Suchmaschinen (DuckDuckGo, Bing, Mojeek) waren gegen Ende captcha-gesperrt — siehe Gaps. Spielerwissen (aus Mod-CSVs/Community-Spielwissen) ist als solches markiert.

---

## 1. Politiknetz-Struktur: Knoten, Kanten, Gewichte, Dämpfung

### Takeaway
Die gesamte Simulation ist ein datengetriebenes neuronales Netz aus „Objekten" (Policies, Situations, Voter Groups, Simulation Values, Events) und „Effects" (Kanten mit Formel + Inertia). Alles steht in CSVs; nichts ist hardcodiert. Verbindungen sind keine konstanten Gewichte, sondern Gleichungen der Form `Ziel,Funktion(x),Inertia` mit Operatoren `+ - * / ^` und optionaler Skalierung durch andere Knoten — Kettenreaktionen werden über Inertia (zeitliche Glättung), Implementation-Delay, Min/Max-Clamps und die Tatsache gedämpft, dass Effekte meist kleine Werte (0.02–0.1) sind.

### Cited Findings
- Der Simulations-Engine ist ein „neural network"; alles (Voter, Voter-Group, Policy, Event) ist ein Objekt, verbunden über „effects". Objekte und Effekte kommen komplett aus CSV-Dateien in `\data\simulation` — ohne SDK, ohne Code, editierbar in Excel/Notepad. — [Positech Modding Basics](https://www.positech.co.uk/democracy4/modding.html)
- Effect-Format (eine CSV-Zelle): `[target],[value1][operator1]([value2][operator2][values3])[operator3][value4],[inertia]` — Operator3/Value4 optional. Operatoren: `+ - * / ^` (`^` = Potenz für „fancy curves"). — [Positech Modding Basics](https://www.positech.co.uk/democracy4/modding.html)
- Konkretes Beispiel (Adult Education Subsidies → Education): `Education,0.04+(0.04*x),4` — bei Slider 0.5 über 4 Runden: `0.04+(0.04*0.5)=0.06`, also +6 % Education. `x` ist der Policy-Slider (0–1). — [Positech Modding Basics](https://www.positech.co.uk/democracy4/modding.html)
- Skalierung durch Fremdknoten: `Education,0.04+(0.04*x)*Technology,4` — der Effekt wird mit dem Technologiestand (0–1) multipliziert. „Es wird überall genutzt, besonders bei Steuern: die Alkoholsteuer hängt vom Alkoholkonsum ab." — [Positech Modding Basics](https://www.positech.co.uk/democracy4/modding.html)
- **Inertia** = drittes Feld jeder Kante: Anzahl Runden, über die gemittelt wird. „Es dauert bis zu 4 Runden, bis Slider-Änderungen voll durchschlagen." Die meisten Effekte haben Inertia 0 (sofort), manche „a huge amount". — [Positech Modding Basics](https://www.positech.co.uk/democracy4/modding.html); [SteamAH Basic Gameplay Guide](https://steamah.com/democracy-4-basic-gameplay-guide/)
- Verzögerung auf Kanten-Ebene UND Knoten-Ebene: Zusätzlich zur Inertia hat jede Policy einen `Implementation`-Wert (Runden bis zur vollen Umsetzung); auch Slider-Änderungen laufen langsam zum Ziel („ghost slider" zeigt Zielposition). — [Positech Modding Policies](https://www.positech.co.uk/democracy4/mod_policies.html); [SteamAH Basic Gameplay Guide](https://steamah.com/democracy-4-basic-gameplay-guide/)
- **Simulation Values** (`simulation.csv`, blaue Icons): Spalten Name, Zone, Default (0–1), Min/Max („generally 0 and 1.0"), Emotion (Färbung im Changes-Graphen), Icon (SVG), dann `#` = Start Inputs, zweites `#` = Start Outputs. Sprich: jeder Statistik-Knoten hat explizite Input-Kantenliste und Output-Kantenliste in derselben Zeile. — [Positech Modding Simulation](https://www.democracygame.com/mod_simulation.html)
- **Situations** (`situations.csv`): eigene Start- und Stop-Schwellen („start and stop triggers"); Default ist eine Lücke zwischen beiden, „im Allgemeinen ist es leichter, eine Situation zu starten als zu beenden — Situationen haben Momentum" (z.B. Rassenunruhen brauchen zum Beenden eine viel stärkere Gegenmaßnahme als zur Verhinderung). — [Positech Modding Situations via SteamAH](https://steamah.com/democracy-4-modding-guide/); [SteamAH Basic Gameplay Guide](https://steamah.com/democracy-4-basic-gameplay-guide/)
- Situationen haben Inputs (lösen Start/Stop aus, inkl. eines speziellen `default`-Objekts als Basispegel) und Outputs (Wirkung solange aktiv), plus `Cost per turn`/`Income per turn` (fix, multipliziert mit Länderskalar) und CostFunction/IncomeFunction (empfohlen linear `0+(1.0*x)`). — [SteamAH Modding Guide](https://steamah.com/democracy-4-modding-guide/)
- Situations können Situationen beeinflussen → potenzielle allgemeine Abwärtsspiralen; manche Policy-Effekte sind versteckt, bis eine Situation auslöst. — [SteamAH Basic Gameplay Guide](https://steamah.com/democracy-4-basic-gameplay-guide/)
- **Anti-Kettenreaktion-Mechanismen** (dokumentiert/nachweisbar): (a) Inertia-Mittelung, (b) Implementation-Delay, (c) Min/Max der Simulationswerte (0–1-Clamp), (d) kleine Effektkoeffizienten, (e) Grudge-Decay bei Events/Dilemmas (`Wert *= decay` pro Runde, z.B. 0.9 → exponentieller Auslauf), (f) Events erzeugen meist einen negativen Grudge gegen sich selbst, „um Wiederholung zu verhindern". — [SteamAH Modding Guide](https://steamah.com/democracy-4-modding-guide/); [Positech Modding](https://www.positech.co.uk/democracy4/modding.html)
- Voter-Groups als Knoten: 20 Gruppen + „Everyone" (100 % Einfluss auf alle, für Kriminalität/Krankheit etc.); Bürger gehören mehreren Gruppen mit variabler Identifikationsstärke (>50 % Schwelle, um als Mitglied zu gelten). — [SteamAH Basic Gameplay Guide](https://steamah.com/democracy-4-basic-gameplay-guide/); [Democracy Wiki: Voter groups](https://democracygame.fandom.com/wiki/Voter_groups)
- Zusammenhangsarchitektur im UI: „Everything affects everything else"; Hover über ein Icon zeigt die Verbindungslinien (grün = positiv, rot = negativ, schnellere Pfeile = stärkerer Effekt). Positiv/negativ sind rein numerisch, keine Wertung (positiver Effekt auf Arbeitslosigkeit = schlecht). — [SteamAH Basic Gameplay Guide](https://steamah.com/democracy-4-basic-gameplay-guide/)

### Inferences
- Das „Gewicht" einer Kante ist eine Funktion, kein Skalar — dadurch können z.B. Steuereinnahmen mit Konsum fallen (Laffer-ähnlich), was bei fixen Gewichten unmöglich wäre. Für NWO: Kantenformel mit Skalierungsknoten (`*Konsum`, `*BIP`) ist der Kern des Realismus, nicht die Zahl der Knoten.
- D4 verhindert Kettenreaktionen nicht durch harte Kausalsperren, sondern durch Trägheit (Zeit) und Clamps (Raum). Der Effekt: Krisen bauen sich langsam auf und klingen langsam aus — planbares Gameplay.
- Inertia ist das wichtigste Einzel-Feature für die Credibility eines Politiknetzes: Es macht „Politik braucht Zeit" mekanisch statt narrativ.

### Gaps
- Exakte Vollzahlen der Basis-D4-Knoten (n Policies, n Situations, n Simulation Values) fanden sich in keiner erreichbaren Quelle als Zahl; die SteamAH-Doku nennt nur „twenty groups (plus the everyone group)" für Voter Groups. Die Fandom-Wiki-Listen sind unvollständig (nur ausgewählte Policies). Spielerwissen: D4-Basis liegt grob bei ~100–130 Policies, ~30–50 Situationen, ~40–60 Simulationswerten (inkl. DLCs höher) — NICHT als Fakt verwendbar, nur als Größenordnung.
- Keine dokumentierte globale Cap-/Diminishing-Returns-Formel (z.B. „Effekte >x werden skaliert") gefunden. Wirkt über Min/Max-Clamps und Kleinkoeffizienten.

---

## 2. Policies im Detail: Typen, Kostenformeln, Wirkketten

### Takeaway
Jede Policy ist eine CSV-ZeiIe in `policies.csv` mit: internem Name, Slider-Typ, Flags, Opposites, Political-Capital-Kosten (Introduce/Cancel/Raise/Lower), Department, PreReqs, MinCost/MaxCost + CostFunction + CostMultiplier, Implementation-Runden, MinIncome/MaxIncome + IncomeFunction + IncomeMultiplier, nationalisation-GDP-Prozentsatz und einer Effects-Liste. Steuern, Subventionen, Verstaatlichung, Mindestlohn etc. sind formal derselbe Typ (Slider-Policy); sie unterscheiden sich nur durch Vorzeichen der Kosten/Einnahmen und ihre Effektketten.

### Cited Findings
- Vollständige policies.csv-Spalten (offizielle Doku): Name (intern), Slider (`default` oder Name in `sliders.csv` — dort sind Slider-Positions-Beschriftungen und optionales Clamping auf feste Optionen), Flags (`UNCANCELLABLE` = Cancel gesperrt, Policy fix auf 0.5; `MULTIPLYINCOME` = Income-Multiplikator-Eingänge multiplizieren statt addieren), Opposites (kommaseparierte widersprechende Policies; werden bei Implementierung automatisch gekündigt), Introduce/Cancel/Raise/Lower (Political-Capital-Kosten), Department (Screen-Zone, Kategorie, zuständiger Minister), PreReqs (aus `prereqs.txt`), MinCost/MaxCost, CostFunction (empfohlen `0+(1.0*x)` = linear), CostMultiplier (Liste `_default_` + Effekte, per `:` getrennt), Implementation (Runden bis voll wirksam, skaliert mit Minister-Kompetenz), MinIncome/MaxIncome, IncomeFunction, IncomeMultiplier, nationalisation GDP percentage (GDP-Anteil, der bei Verstaatlichung/Privatisierung gutgeschrieben wird), #Effects. — [Positech Modding Policies](https://www.positech.co.uk/democracy4/mod_policies.html)
- Kostenlogik: Fixwert (MinCost→MaxCost über Slider) × Länder-Multiplikator (in der Country-Datei) × Minister-Kompetenz × CostMultiplier. „Ein sehr schlechter Finanzminister bringt weniger Steuereinnahmen; ein guter Außenminister hält Militärkosten in Schach." — [Positech Modding Policies](https://www.positech.co.uk/democracy4/mod_policies.html); [SteamAH Basic Gameplay Guide](https://steamah.com/democracy-4-basic-gameplay-guide/)
- Externe Faktoren treiben Kosten/Einnahmen: Staatlicher Gesundheitsdienst + Asthma-/Infektionskrankheits-Situation → höhere Policy-Kosten; Steuern auf Aktivitäten hängen von deren Popularität/Konsum ab. „Man kann die Alkoholsteuer erhöhen und trotzdem weniger einnehmen, wenn der Konsum stärker sinkt." — [SteamAH Basic Gameplay Guide](https://steamah.com/democracy-4-basic-gameplay-guide/)
- Policy-Typen im Spiel: (a) Slider-Policies (Steuern, Ausgaben), (b) Gesetze/Positionen ohne Cancel („UNCANCELLABLE", z.B. Abtreibung: man muss Stellung beziehen, meist auf 0.5-Slider), (c) Budget-Policies sind nur Slider mit hohem Cost-Anteil. Policies sind grey-Icons, unterteilt in Bereiche (Transport, Law & Order, Public Services, Tax, Economy, Welfare, Foreign Policy). — [SteamAH Basic Gameplay Guide](https://steamah.com/democracy-4-basic-gameplay-guide/); [Democracy Wiki: Policies](https://democracygame.fandom.com/wiki/Policies)
- **Steuern** (Wiki-Listen D3-Basis + D4-Neuzugänge): Income Tax, Flat Income Tax, Corporation Tax, Capital Gains Tax, Inheritance Tax, Property Tax, Mansion Tax, Sales Tax, Payroll Tax (D4), Airline Tax, Frequent Flyer Tax (D4), Car Tax, Petrol Tax, Carbon Tax, Alcohol Tax, Tobacco Tax, Recreational Drugs Tax, Junk Food Tax, Plastics/Packaging Tax (D4), Luxury Goods Tax, Internet Tax, Financial Transactions Tax (D4), Diverted Profits Tax (D4), Solidarity Tax (D4), Empty Homes Tax (D4), Religious Tax (D4), Cryptocurrency Taxation (D4), Gambling (als Regulierung). „Sin Taxes" sind also Alkohol/Tabak/Drogen/Junk Food/Flug/Spritt — jeweils eigene Slider-Policies, deren Einnahme über Konsum-Simulationswerte skaliert wird. — [Democracy Wiki: Policies](https://democracygame.fandom.com/wiki/Policies)
- **Subventionen** („Subsidize X"): Adult Education Subsidies, Arts/Art Subsidies, Faith School Subsidies, Rail Subsidies, Bus Subsidies (D4), High-Speed Rail Subsidies (D4), Biofuel/Clean Fuel Subsidy (D4), Agriculture Subsidies, Organic Farming Subsidy, Oil Drilling Subsidies, Clean Energy Subsidies, Small Business Grants, Rural Development Grants, Technology Grants, Robotics Research Grants, Science Funding, Youth Club Subsidies, Bicycle Subsidies, Micro-Generation Grants, Health Food Subsidies, Winter Fuel Subsidy, State Housing. Muster: Slider = Höhe/Förderquote, MinCost>0, Effekte auf Simulationswerte (z.B. Education) mit Inertia (Beispiel: `Education,0.04+(0.04*x),4`) und typischerweise auf Voter-Group-Happiness. — [Democracy Wiki: Policies](https://democracygame.fandom.com/wiki/Policies); [Positech Modding](https://www.positech.co.uk/democracy4/modding.html)
- **Verstaatlichung/Privatisierung**: Eigene Spalte „nationalisation GDP percentage" — beim Kündigen einer verstaatlichten Policy (Privatisierung) bzw. Verstaatlichen wird ein GDP-Prozentwert als Einmal-Einnahme/-Ausgabe gebucht. D4-Beispiele: State Airline, State Rail Company, State Energy Company, State Telecoms Company, State Water Company, State Postal Service, State Broadcaster (D4); Private Prisons (Gegenrichtung). — [Positech Modding Policies](https://www.positech.co.uk/democracy4/mod_policies.html); [Democracy Wiki: Policies](https://democracygame.fandom.com/wiki/Policies)
- **Preiskontrollen/Mieterschutz**: Rent Controls (Welfare), Ban Sunday Shopping, Cap CEO Pay Multiplier (D3-Extremism), Minimum Wage (D4), Retirement Age (D4), Universal Basic Income (D4), Labor Laws, Maternity Leave, Workers On Board / Workers Dividends (D4). — [Democracy Wiki: Policies](https://democracygame.fandom.com/wiki/Policies)
- **Bildung/Gesundheit/Polizei/Militär**: State Schools, School Vouchers, Selective Schooling (D4), Free School Meals, University Grants, Technology Colleges, Creationism vs. Evolution (Slider-Position!); State Health Service, Healthcare Vouchers, Free Eye Tests, Drug Treatment Scheme (D4); Police Force, Armed Police, Community Policing, Prisons, Private Prisons, CCTV, Wire Tapping, Body Cameras (D4); Military Spending, National Service, Nuclear Weapons (D4), Border Navy (D4). — [Democracy Wiki: Policies](https://democracygame.fandom.com/wiki/Policies)
- Sonderfunktionen: Policy-Popularität kann im UI angezeigt werden (grün/rot-Icons) — „irreführend, da die Mehrheit oft gleichgültig ist"; versteckte Effekte bis Situation auslöst; Opposites-System erzwingt konsistente Politik (wer X einführt, verliert automatisch Anti-X). — [SteamAH Basic Gameplay Guide](https://steamah.com/democracy-4-basic-gameplay-guide/); [Positech Modding Policies](https://www.positech.co.uk/democracy4/mod_policies.html)
- Startwerte: In der Country-Datei legt `[policies]` pro Policy Startwert und Aktiv-Status fest; uncancellable Policies ohne Eintrag starten bei 0.5; alle Starteffekte werden vor Spielbeginn komplett durch die Simulation gerechnet. — [SteamAH Modding Guide](https://steamah.com/democracy-4-modding-guide/)

### Inferences
- D4 hat KEINE separate „Investitions"-Policy-Kategorie. Investitionen sind Subventions-Slider mit Inertia und Implementation-Delay — Sachkapital (Maschinen, Anlagen) existiert nicht als Bestand, nur als Fluss + Technologie-Simulationswert.
- Steuerlogik ist implizit Laffer-ähnlich, weil Einnahmen = `IncomeFunction(x) * Konsum/Situation` multiplizieren — ein ehrgeiziges Vorbild für die NWO-Wirtschaft.
- `sliders.csv`-Clamping (feste Optionen statt Gleitkomma) ist der Weg, Policies wie „Abtreibung: ja/nein/limitiert" oder „Wahlalter 16/18/21" abzubilden — direkt übernehmbar für rechtsstaatliche Ja/Nein-Gesetze in NWO.

### Gaps
- Konkrete Zahlen einzelner Policies (z.B. exakte MinCost/MaxCost der Income Tax, tatsächliche Effektkoeffizienten von Corporation Tax) ließen sich nicht aus der installierten CSV dokumentieren — die Doku erklärt nur das Format. Ein Blick in die echte `policies.csv` eines D4-Exports würde diese Werte liefern (empfehlenswert vor NWO-Balancing).
- Detaillierte Wirkketten je Policy („Einkommensteuer ↑ → Middle Income ↓, GDP ↓ …") sind nur exemplarisch dokumentiert; das Wiki listet Policies, aber selten die vollen Effektlisten.

---

## 3. Subventionen und Investitionen: „Wir fördern etwas"

### Takeaway
D4 modelliert Förderung ausschließlich als fortlaufenden Slider mit Kosten pro Runde und Inertia-verschobener Wirkung auf Simulationswerte — ohne Bestandsgrößen (Kapitalstock, Ausrüstung). Das ist die systematische Lücke: Es gibt „Technology"/„Science"-Werte und Grant-Policies, aber kein Investitionsmodell mit Akkumulation, Abschreibung und Produktivitätswirkung.

### Cited Findings
- Subventions-Policy-Muster (offizielles Beispiel): `AdultEducationSubsidies`, Effekt `Education,0.04+(0.04*x),4` — 4 Runden Inertia, Wirkung skaliert über Implementation-Fortschritt und Minister-Kompetenz. — [Positech Modding](https://www.positech.co.uk/democracy4/modding.html)
- Technologie-Förderung existiert als Policy-Cluster: Technology Grants, Robotics Research Grants, Science Funding, Technology Colleges, Synthetic Meat Research Grants, Human Cloning Research Grants, Anti-Gravity Research Grants, Mars/Space Program — alle wirken über (meist) den Technology-Simulationswert, der wiederum Policy-Effekte skaliert (siehe `*Technology`-Beispiel). — [Democracy Wiki: Policies](https://democracygame.fandom.com/wiki/Policies); [Positech Modding](https://www.positech.co.uk/democracy4/modding.html)
- Implementation-Delay trifft Investitionen am härtesten: „Man muss weit vorausdenken bei Science Spending und Bildung"; Slider bewegt sich langsam zum Ziel (Ghost-Slider), volle Kosten fallen sofort. — [SteamAH Basic Gameplay Guide](https://steamah.com/democracy-4-basic-gameplay-guide/)
- Die D3-Africa-DLC-Policy „Capital Equipment Subsidies" ist die einzige annähernd kapitalstock-nahe Policy — und bleibt trotzdem ein reiner Slider ohne Bestandssimulation. — [Democracy Wiki: Policies](https://democracygame.fandom.com/wiki/Policies)

### Inferences
- Lücke für NWO: „Investitionen in Technik/Maschinen" (Kapitalstock pro Sektor/Provinz, Abschreibung, Produktivitätsmultiplikator) hat in D4 kein Vorbild — hier kann NWO echte Differenzierung schaffen, insbesondere kombiniert mit regionalen Wirtschaftsdaten.
- Der Subventions-Slider ist aber genau richtig als UI-Muster: einstellbare Förderquote, transparente Kosten pro Quartal, verzögerte Wirkung.

### Gaps
- Ob es in DLCs (z.B. „Clones and Drones", Community-Mods) kapitalstock-ähnliche Mechaniken gibt, wurde nicht abschließend geprüft.

---

## 4. Geld und Haushalt

### Takeaway
Der Haushalt ist Quartals-Budget mit Einnahmen (v.a. Steuern, skaliert über Konsum/GDP) und Ausgaben (Policy-Kosten, Situations-Kosten), Staatsschuld mit Zinsen, Credit-Rating über Debt/GDP und einer globalen Konjunktur-Sinuskurve. Es gibt keinen Staatsbankrott — aber Zins-Dramatik (Rating-Downgrade → schnelle Zinsspirale) und Parteispenden/Fundraising als parallele Geldwirtschaft.

### Cited Findings
- Grundlogik: Alle Länder starten mit Staatsschuld; „es gibt keine Regel, die sie tilgen muss — man muss sich nur die Zinsen leisten können". Zinsen ändern sich mit globalen Zinsen und der Credit Rating der Märkte; Rating-Faktor v.a. Debt-to-GDP; „ein Rating-Wechsel kann sich sehr schnell eskalieren". — [SteamAH Basic Gameplay Guide](https://steamah.com/democracy-4-basic-gameplay-guide/)
- Country-Parameter (Country-Datei `[config]`): `starting_debt`, `wealth_mod` (Länderskalar für alle Kosten/Einnahmen), `min_gdp/max_gdp` (nur max: Skalar für Debt/GDP und Credit Ratings), `currency`, `fx_rate_to_pound`, `economic_cycle_start` (Startpunkt auf globaler Konjunktur-Sinuswelle, 0–1), `apathy` (Wahlbeteiligung), `population` = echte Bevölkerung / 2.000 simulierte Wähler. — [SteamAH Modding Guide](https://steamah.com/democracy-4-modding-guide/); [Positech Modding Countries](https://www.democracygame.com/mod_countries.html)
- Volkswirtschaftliche Kennzahlen als Simulationswerte: GDP („vast list of inputs and outputs"), Unemployment, Inflation (Spielerwissen: als eigener Stat-Knoten vorhanden), Health, Education, Crime, Poverty, CO2 u.v.m. — blau dargestellt, indirekt über Policies steuerbar, „Voter wissen von diesen Stats: steigende Ungleichkeit/Arbeitslosigkeit verärgert manche". — [SteamAH Basic Gameplay Guide](https://steamah.com/democracy-4-basic-gameplay-guide/)
- Globale Konjektur: Boom-Bust-Zyklus (Sinus), trifft v.a. Tourismus; „sudden market changes" außerhalb der Kontrolle; Anzeige auf dem Finance-Screen. — [SteamAH Basic Gameplay Guide](https://steamah.com/democracy-4-basic-gameplay-guide/)
- Krisen: Kapitalflucht wird nicht als eigenes System dokumentiert; existieren als Situationen/Events (z.B. via Credit Rating, „concerns about government stability"). Dilemmas/Events können gezielt Krisen (Arbeitslosigkeit, GDP-Schocks) setzen: `OnImplement = CreateGrudge(Unemployment,-0.080,0.650);CreateGrudge(GDP,0.030,0.880);…`. — [SteamAH Modding Guide](https://steamah.com/democracy-4-modding-guide/)
- Parteigeld (separat vom Staatshaushalt): Fundraising-Screen — Mitgliedsspenden + Großspenden von Wohlhabenden; Spender haben „eigene Policy-Ideen" und fordern gelegentlich Gegenleistungen; Wahlkampf-Budget beeinflusst Kampagnen-Erfolg und Turnout; Wahlkampf-Skill der Minister zählt. — [SteamAH Basic Gameplay Guide](https://steamah.com/democracy-4-basic-gameplay-guide/)
- Quartalsbericht: Jede Runde = ein Quartal; Berichts-Screen zeigt Stats-Auswahl, Events, Dilemmas. — [SteamAH Basic Gameplay Guide](https://steamah.com/democracy-4-basic-gameplay-guide/)

### Inferences
- Wirtschaftsmodell ist grob: einzelne aggregierte Simulationswerte (0–1 normalisiert) statt volkswirtschaftlicher Gleichungssysteme; keine Zentralbank getrennt vom Finanzminister (D4-Neuzugang „Quantitive Easing"/„Helicopter Money" als Policies, nicht als Institution). Für NWO mit Zins/Inflation/Lira ist D4 hier nur als Vorbild für die Oberfläche (Kennzahlen-Knoten + Politik-Kanten), nicht für die Tiefe geeignet.
- „Kein Bankrott, aber Rating-Spirale" ist ein bewusstes Design: Verlieren soll über Wahlen passieren, nicht über Game-Over-Screens — außer Attentat.

### Gaps
- Inflationsmechanik im Detail (Geldmenge? Phillips-Kurve?) nicht dokumentiert; `Quantitive Easing`-Effekte stehen nur als Policy-Namen im Wiki. Formeln der Zinsdynamik (wie genau Credit Rating berechnet wird) fehlen.
- Streiks/Kapitalflucht als Systeme: keine direkte Quelle; vermutlich über Situationen („Trade Unionist"-Unzufriedenheit → Situationen) abgebildet — nicht verifizierbar.

---

## 5. Politik/Innenleben: Political Capital, Kabinett, Lobbyisten, Wahlen

### Takeaway
Political Capital (PC) ist die zentrale Handlungswährung, erzeugt pro Runde aus Popularität, Wahlsieg-Marge, Minister-Loyalität und Notstandsregeln. Das Kabinett ist ein dreifaches System (PC-Produktion, Policy-Effizienz, Voter-Sympathie). Wahlen sind Turnout-basiert auf 2.000 simulierten Wählern mit Apathie, Aktivisten und Manifest-Versprechen; es gibt keine echte Oppositions-Politik. Lobby/Verbände existieren als Pressure Groups + Spender, nicht als interaktives Bestechungssystem.

### Cited Findings
- **Political Capital**: Neue Policies kosten PC (Spalten Introduce/Cancel/Raise/Lower pro Policy). PC pro Runde abhängig von Popularität, Electoral Majority, Loyalität der Minister, Emergency Powers (in Krisen) + Bonus zu Amtsbeginn. Icon in der Screen-Mitte zeigt Bestand; Policy-Icons haben Ringsegmente, die die PC-Kosten für +10 %/+25 % Slider-Schritte anzeigen (im Uhrzeigersinn Erhöhung, gegen Uhrzeigersinn Senkung; abschaltbar). — [SteamAH Basic Gameplay Guide](https://steamah.com/democracy-4-basic-gameplay-guide/); [Positech Modding Policies](https://www.positech.co.uk/democracy4/mod_policies.html)
- **Minister** (3 Rollen): (1) PC-Produktion nach Einfluss/Loyalität (Loyalität sinkt mit der Zeit nativ — „jaded"; Resignationen sind unpopulär; Entlassungen haben PR-Kosten, Reshuffle nicht); (2) Effectiveness (Erfahrung wächst mit Amtszeit + Neigung zu bestimmten Ressorts) skaliert Policy-Kosten/Einnahmen und Implementierungstempo; (3) Voter-Sympathie: Minister identifizieren sich mit Voter Groups (z.B. „commuters champion, religious") — diese Gruppen sind zufriedener, ABER die Minister-Loyalität hängt vom Glück dieser Gruppen (Zwei-Wege-Effekt). — [SteamAH Basic Gameplay Guide](https://steamah.com/democracy-4-basic-gameplay-guide/)
- **Lobby/Verbände**: Security-Screen listet Pressure Groups neben Terrororganisationen; unzufriedene Voter-Group-Mitglieder gehen in Pressure Groups, dann (bei Persistenz) in Terrorgruppen; Wohlhabende als Großspender fordern Policies; keine dedizierten Lobbyisten-Karten. — [SteamAH Basic Gameplay Guide](https://steamah.com/democracy-4-basic-gameplay-guide/)
- **Korruption**: Als Policy-Ebene (Anti-corruption Agency, Unexplained Wealth Orders, Banking Secrecy, Limit Corporate Donors, Party Donation Limits, State Funding of Parties — alle D4), nicht als durchlaufender Korruptions-Simulationswert dokumentiert. — [Democracy Wiki: Policies](https://democracygame.fandom.com/wiki/Policies)
- **Wahlen**: Feste Amtszeiten je Land (keine vorgezogenen Wahlen), Term Limits konfigurierbar; Sieg = Happy Voter; Opposition hat keine eigene Policy („opposes everything"); 2–3 Parteien; Koalition bei 3 Parteien ohne Mehrheit → weniger PC, Koalitionspartner bietet Deals (deren Policy gegen PC), Wähler machen Regierung für alles verantwortlich. — [SteamAH Basic Gameplay Guide](https://steamah.com/democracy-4-basic-gameplay-guide/)
- **Wahlmodell/Umfragewerte**: 2.000 simulierte Bürger (jeder mit liberal↔conservative, socialist↔capitalist-Spektrum + Einkommensgruppe, Mehrfach-Gruppenmitgliedschaften, individueller Volatilität — „young get angrier quicker"); Turnout hängt von Gefühlstärke + Apathie (länderspezifisch, an realen Wahlbeteiligungen kalibriert) + Aktivisten (Push nur Turnout) + Parteimitgliedschaft (garantiert Stimme) ab; Compulsory Voting als Länderoption. — [SteamAH Basic Gameplay Guide](https://steamah.com/democracy-4-basic-gameplay-guide/); [SteamAH Modding Guide](https://steamah.com/democracy-4-modding-guide/)
- **Cynicism**: Pro Voter Group; entsteht durch Populismus kurz vor der Wahl, Verärgern kurz nach der Wahl, Flip-Flops; klingt ab; im Polls- und Group-Detailscreen sichtbar. **Complacency**: Zufriedene Gruppen nehmen Politik als selbstverständlich hin; Max-Complacency steigt über aufeinanderfolgende Amtszeiten („nach jedem Wahlsieg wird es schwerer, Kernwähler zu halten"). — [SteamAH Basic Gameplay Guide](https://steamah.com/democracy-4-basic-gameplay-guide/)
- **Electioneering**: Manifesto Pledges (kostenlose Versprechen, Bruch schadet später), Speeches (Support von Gruppe A nach Gruppe B umschichten), Media Events/Perceptions (Persönlichkeitsbild; können backfire), Fundraising. — [SteamAH Basic Gameplay Guide](https://steamah.com/democracy-4-basic-gameplay-guide/)
- **Radikalisierung**: Voter → Pressure Group → Terrororganisation, reversibel; Attentat als zweiter Verlustweg neben der Wahl; Militär/Überwachung senken Erfolgswahrscheinlichkeit. — [SteamAH Basic Gameplay Guide](https://steamah.com/democracy-4-basic-gameplay-guide/)

### Inferences
- Das Cynicism/Complacency-Paar ist das cleverste Anti-Snowball-Feature für Wiederwahlen: es verhindert, dass eine einmal errungene Happy-Koalition ewig hält. Für NWO (Präsident mit 81 Provinzen) übernehmenswert auf Provinz-/Wählergruppen-Ebene.
- Fehlend in D4: aktive Opposition, Fraktionen im Parlament, Korruption als Fluss, persönliche Skandale außerhalb von Events. NWO-Lücke.

### Gaps
- Konkrete PC-Generierungsformel (wie viele PC pro Runde bei Popularität X) nicht dokumentiert.
- Skandal-System: Events/Dilemmas decken Skandale ab, aber es gibt kein persistentes Skandal-/Reputationsobjekt (nur Grudges) — Details unklar.
- „Kabinett/Minister als Karten" (im Auftrag erwähnt): D4 hat Minister als Charaktere mit Attributen, aber kein Kartenspiel-System (wie spätere Democracy-DLC-Versprechen?) — hierzu keine Quelle gefunden.

---

## 6. Probleme und Ereignisse: Entstehung, Schwellen, Zufall

### Takeaway
„Probleme" heißen in D4 **Situations**: dauerhafte, schwellwertgesteuerte Zustände mit Start/Stop-Triggern, Momentum und eigenen Kosten/Einnahmen. **Events** sind Einmal-Ereignisse, die alle 3 Runden als Wettbewerb aller Event-Kandidaten bewertet werden (bestes >70 % löst aus); **Dilemmas** sind erzwungene Entscheidungen mit 2–3 Optionen. Zufall existiert nur als `_random_`-Input in die Wahrscheinlichkeitsgleichungen.

### Cited Findings
- Situations-Trigger: Inputs (Effekte anderer Objekte) summieren sich zum Situations-Wert; Start- und Stop-Schwellen getrennt („leichter starten als beenden" = Momentum); Startwarnung möglich; Detailscreen zeigt Stärke, Ursachen, Auswirkungen. — [SteamAH Modding Guide](https://steamah.com/democracy-4-modding-guide/); [SteamAH Basic Gameplay Guide](https://steamah.com/democracy-4-basic-gameplay-guide/)
- Situationen-Beispiele (Wiki-Kategorie): Alcohol Abuse, Binge Drinking, Asthma Epidemic, Armed Robbery, Antisocial Behaviour, Armed Religious Communities, Ancient Wonder (grüne „gute" Situationen existieren ebenfalls; `Positive`-Spalte = grün/rot-Darstellung). — [Democracy Wiki: Situation-Kategorie](https://democracygame.fandom.com/wiki/Category:Situation); [SteamAH Modding Guide](https://steamah.com/democracy-4-modding-guide/)
- Events: Event-Manager bewertet **alle 3 Runden** jedes Event; höchster Score >70 % wird ausgelöst; Score = Summe von Influences (Effekte aus dem Netz) + optionalem `0 = _random_,0,0.3` (Zufallszuschlag 0–0.3); Ausführung per `OnImplement = CreateGrudge(...)`; jeder Grudge hat Ziel, Startwert und Decay (z.B. 0.65 = schnell, 0.97 = lang). „Sehr wenige Events sind wirklich zufällig." — [SteamAH Modding Guide](https://steamah.com/democracy-4-modding-guide/); [SteamAH Basic Gameplay Guide](https://steamah.com/democracy-4-basic-gameplay-guide/)
- Dilemmas: Erscheinen im Quartalsbericht, blockieren Rundenende; Trigger über `[influences]` (z.B. `1 = Health,0.8-(0.6*x)` = hohes Health senkt die Eintrittswahrscheinlichkeit); nach Auslösung 32 Runden Cooldown; Optionen 2–3, jede mit `OnImplement`-Grudge-Kette (Beispiel aus der Doku: `CreateGrudge(Health,-0.05,0.9f);CreateGrudge(Liberals,0.10,0.9f);CreateGrudge(Parents,-0.06,0.9f);CreateGrudge(Obesity,0.05,0.9f);`). — [SteamAH Modding Guide](https://steamah.com/democracy-4-modding-guide/)
- Zufriedenheitssystem: Happiness je Voter Group = Summe aller Policy-/Stat-/Situations-Einflüsse auf diese Gruppe + Cynicism + Complacency; Bürger-Zufriedenheit = wählend über alle Gruppenidentifikationen („87 % Happy bei Socialists heißt nicht 87 % Stimmen"). — [SteamAH Basic Gameplay Guide](https://steamah.com/democracy-4-basic-gameplay-guide/)

### Inferences
- Das 3-Runden-Event-Fenster + 70 %-Schwelle + Selbst-Negativ-Grudge ist eine elegante Anti-Spam-Logik für Ereignisse — für NWO („Ereignisse, die aus dem Netz entstehen") direkt übernehmbar.
- Situationen mit separaten Start/Stop-Schwellen sind das Vorbild für „Probleme" in NWO: Arbeitslosigkeit, Vertrauenskrise etc. sollten so als eigene Knoten mit Hysterese modelliert werden.

### Gaps
- Wie viele Situationen/Events/Dilemmas im Basis-D4 enthalten sind: keine belastbare Zahl gefunden (nur Wiki-Beispiele).
- Warn-Logik vor Situationen („you *may* get a warning") ist mechanisch nicht dokumentiert.

---

## 7. UI und Präsentation

### Takeaway
Hauptbildschirm ist ein einziges, in Zonen (Departments) gegliedertes Icon-Netzwerk ohne Karte — ein interaktiver Graph, bei dem Hover die Kanten zeigt. Farbcode: grün/rot = Richtung des Effekts (nicht „gut/schlecht"), blau = Statistik, grau = Policy, rot/grün gefüllt = Situation. Die UI ist bewusst „graph first", mit Detail-Tooltips pro Knoten; Kritikpunkte (Abstraktion, Informationsdichte) ließen sich aus Reviews nicht belegen (Gap).

### Cited Findings
- Hauptbildschirm: „iconic interface, no map or 3D world — a complex graphic of interconnections"; Zonen pro Department (Tax-Daten liegen im Tax-Bereich etc.); Hover zeigt Kanten (grün positiv, rot negativ, Pfeil-Geschwindigkeit = Effektstärke); Klick öffnet Detail-Screen mit Einfluss-Strips (Ursachen rein, Wirkungen raus) inkl. Inertia-Darstellung (heller Balken = Effekt bewegt sich noch). — [SteamAH Basic Gameplay Guide](https://steamah.com/democracy-4-basic-gameplay-guide/)
- Knotenfarben: Policies grau, Statistics/Simulation Values blau, Situations rot (schlecht) oder grün (gut) (`Positive`-Spalte in situations.csv), Policy-Icons mit PC-Ringsegmenten (+10 %/+25 %). — [SteamAH Basic Gameplay Guide](https://steamah.com/democracy-4-basic-gameplay-guide/); [Positech Modding Simulation](https://www.democracygame.com/mod_simulation.html)
- „Changes"-Graph („was hat sich seit der Wahl verändert"): jede Simulation hat eine `Emotion`-Eigenschaft, die festlegt, ob eine Änderung rot/grün/schwarz dargestellt wird („vermeide parteiische Wertungen" — offizielle Doku an Modder). — [Positech Modding Simulation](https://www.democracygame.com/mod_simulation.html)
- Policy-Detailscreen: Slider + Ghost-Slider (Zielposition), Implementierungsgrad-Balken, Popularität, Kosten/Einnahmen; Policy-Popularität separat als grün/rot-Overlay-Ansicht. — [SteamAH Basic Gameplay Guide](https://steamah.com/democracy-4-basic-gameplay-guide/)
- Weitere Screens: Quartalsbericht (Stats + Events + Dilemmas), Polls (Focus Group: Stichprobe simulierter Bürger mit Gruppen-Mitgliedschaftsbalken + Entscheidungsbeiträgen; Cynicism/Complacency-Listen), Partei-Screen (Rosette: Mitglieder, Aktivisten, Fundraising, Manifesto, Speeches, Perceptions), Security (Pressure Groups + Terror), Finance (Schuld, Zinsen, globale Konjunktur), Voter-Group-Detail (Graph-Tabs inkl. Membership-Verlauf). — [SteamAH Basic Gameplay Guide](https://steamah.com/democracy-4-basic-gameplay-guide/)
- Informationsdichte pro Screen: bewusst niedrig (ein Netz pro Bildschirm, Details auf Klick); Tooltips erklären Kanten, nicht Formeln — die zugrunde liegenden Gleichungen sind im Spiel nirgends sichtbar (nur in CSVs). — [SteamAH Basic Gameplay Guide](https://steamah.com/democracy-4-basic-gameplay-guide/); [Positech Modding](https://www.positech.co.uk/democracy4/modding.html)

### Inferences
- D4 zeigt den Spielern das Netz, aber nicht die Mathematik — genau umgekehrt zu NWOs Anspruch (186 Knoten mit Gewichten/Verzögerungen sichtbar). Eine „Formel-Tooltip"-Ebene wäre ein NWO-USP gegenüber D4.
- Die Zonen-Einteilung (Departments als Screen-Regionen) skaliert schlecht auf 186 Knoten — für NWO mit 81 Provinzen braucht es Filter/Layer, nicht ein einziges Netzbild.

### Gaps
- Konkrete Review-Kritik („zu abstrakt", UI-Beschwerden aus Steam-Reviews/YouTube): nicht belegbar, da Suchmaschinen captcha-gesperrt und Reviews-Seiten nicht erreichbar. Aus allgemeiner Spielerfahrung (SPIELERWISSEN, nicht als Fakt zitierfähig): Kritikpunkte lauten typischerweise „Excel-Charakter", „Overhead-UI auf kleinen Screens", „kaum Feedback, warum genau jemand wütend ist", „gleiche Netz-UI für jedes Land". Vor Verwendung in Reports bitte mit Reviews-Quellen verifizieren.
- Exakte Pixel-/Layout-Details, Farbwerte, Chart-Bibliothek: nicht dokumentiert.

---

## 8. Modding/Daten: CSV-Struktur und Mod-System

### Takeaway
D4 ist zu ~100 % CSV/TXT-getrieben: `policies.csv`, `situations.csv`, `simulation.csv`, `sliders.csv`, `prereqs.txt`, dazu pro Event/Dilemma eigene TXT-Dateien und pro Land ein Missionsordner. Mods sind nur Ordner, die die Spielstruktur spiegeln; jede Zeile mit `#` ist ein Objekt, ohne `#` Kommentar. Dieses Format ist nahezu 1:1 als Vorbild für ein NWO-Datenformat geeignet.

### Cited Findings
- Dateien in `\data\simulation`: `policies.csv`, `situations.csv`, `simulation.csv`, `sliders.csv`, `prereqs.txt`, Ordner `events/`, `dilemmas/`; Länderspezifisch `missions/<land>/` mit `<land>.txt` (`[config]`, `[options]`, `[stats]`, `[policies]`), `overrides/` (Kanten pro Mission ändern/löschen: TargetName, HostName, Equation oder `DELETE`, Inertia), `scripts/` (Start-Grudges, z.B. Voter-Group-Komposition je Land). — [SteamAH Modding Guide](https://steamah.com/democracy-4-modding-guide/); [Positech Modding](https://www.positech.co.uk/democracy4/modding.html)
- CSV-Konvention: Erste Spalte `#` = neues Objekt; Zeilen ohne `#` = Kommentar; Excel-tauglich, aber Speicherformat muss CSV bleiben (offizielle Warnung). — [Positech Modding](https://www.positech.co.uk/democracy4/modding.html)
- Policies.csv-Spalten siehe Frage 2; Effects als beliebig viele Spalten rechts von `#Effects`, eine Kante pro Zelle: `Ziel,Formel(x),Inertia`. — [Positech Modding Policies](https://www.positech.co.uk/democracy4/mod_policies.html)
- Situationen-Spalten: Name, Department, Pre-Reqs, Icon (SVG, Inkscape), Positive (1=grün), Start/Stop-Triggers, Cost/Income per turn, CostFunction/IncomeFunction, dann Inputs bis `#`, danach Outputs; `default`-Objekt als Basispegel. — [SteamAH Modding Guide](https://steamah.com/democracy-4-modding-guide/)
- Events: eine TXT pro Event in `events/`; `[config]` (Name, Texture 512×512 PNG, GUISound), `[influences]` (nummerierte Effects inkl. `_random_,min,max`), `OnImplement = CreateGrudge(Ziel,Wert,Decay);…`. Dilemmas analog in `dilemmas/` mit `[option0]`/`[option1]`/`[option2]`. — [SteamAH Modding Guide](https://steamah.com/democracy-4-modding-guide/)
- Neue Prereqs ab Build 1.38: eigene `prereqs.txt` im Mod (z.B. `_prereq_has_coast`, `_prereq_mining_industry`, `_prereq_royal_family` als Beispiele) — koppelbar an Events/Policies/Situations. — [Positech Modding](https://www.positech.co.uk/democracy4/modding.html)
- Mod-Infrastruktur: Mod-Ordner in `\My Games\democracy4\mods` spiegelt Spielstruktur (data/bitmaps, data/simulation, translations…); `config.txt` mit name/path/guiname/author/description; In-Game-Mod-Control-Panel; Steam-Workshop-Upload im Spiel; Übersetzungen getrennt im `translations`-Ordner des Mods. — [Positech Modding](https://www.positech.co.uk/democracy4/modding.html)
- Country-Modding: `population` = echte Bevölkerung / 2.000 (simulierte Wähler), `wealth_mod` als Länder-Skalierer aller Geldwerte, `apathy` an reale Wahlbeteiligung anpassbar, SVG-Kartenoutline, Namensdateien für Minister/Bürger. — [SteamAH Modding Guide](https://steamah.com/democracy-4-modding-guide/)

### Inferences
- Das CSV-Format ist der Grund für D4s Mod-Ökosystem und die interne Balancing-Geschwindigkeit — NWO sollte dasselbe Prinzip (eine Zeile pro Knoten, `#`-Marker, Effekt-Zellen mit Formel+Verzögerung) als Datenhaltung übernehmen, ergänzt um Regionen-Spalten.
- `overrides/` (Kanten pro Mission überschreiben/löschen) ist ein starkes Muster für NWO-Szenarien/Provinzvarianten: gleiche Mechanik, andere Gewichte pro Land/Region.

### Gaps
- Vollständige reale CSV-Zeilen aus der ausgelieferten `policies.csv` (mit echten Kosten/Effektwerten) ließen sich nicht beschaffen — nur das Format und das eine Education-Beispiel. Für das NWO-Datenformat wäre ein D4-Datendump (Spiel besitzen → CSVs öffnen) die beste Referenz.
- Slider-Clamp-Beispiele aus `sliders.csv` (feste Optionen) sind beschrieben, aber ohne konkrete Zeilen.

---

## 9. Übernahme für NWO („Staatsräson"): Was übernehmen, was besser machen

### Takeaway
Übernehmen: die Effekt-Kanten-Formel mit Inertia und Skalierungsknoten, das CSV-eine-Zeile-pro-Knoten-Format mit `#`-Markern, Policy-Typen-Taxonomie (Slider-Gesetz/Budget + UNCANCELLABLE-Positionen + Opposites), Subventions-Slider mit Kosten/Runde und Implementation-Delay, Probleme mit Start/Stop-Hysterese („Momentum"), Event-Wettbewerb mit Decay-Grudges, Cynicism/Complacency gegen Happy-Snowball, Minister als Drei-Rollen-System. Besser machen: regionale Tiefe (81 Provinzen), Kapitalstock/Investitionen, sichtbare Formeln, echte Wirtschaft (Zins/Inflation/Lira), Personal, freie Sprache als Bedienung.

### Cited Findings
- Übernahme-Kandidaten (belegt durch D4-Mechanik):
  1. **Kantenformel** `Ziel,Funktion(x[,Skalierer]),Inertia` mit `+ - * / ^` — [Positech Modding](https://www.positech.co.uk/democracy4/modding.html)
  2. **CSV-Datenhaltung** (eine Zeile = ein Knoten, `#`-Marker, Effekt-Zellen, Country-Overrides mit `DELETE`) — [Positech Modding](https://www.positech.co.uk/democracy4/modding.html); [SteamAH Modding Guide](https://steamah.com/democracy-4-modding-guide/)
  3. **Policy-Typen**: Slider-Policy, UNCANCELLABLE-Position (0.5-Default), Opposites-Auto-Cancel, Political-Capital-Kosten je Aktion (Introduce/Raise/Lower/Cancel) — [Positech Modding Policies](https://www.positech.co.uk/democracy4/mod_policies.html)
  4. **Subventionslogik**: Slider = Förderhöhe, Kosten/Runde × Länder-Skalar × Minister-Kompetenz, Wirkung mit Inertia + Implementation-Delay — [Positech Modding Policies](https://www.positech.co.uk/democracy4/mod_policies.html); [SteamAH Basic Gameplay Guide](https://steamah.com/democracy-4-basic-gameplay-guide/)
  5. **Problem-Schwellen** mit Hysterese (Start leichter als Stop) — [SteamAH Modding Guide](https://steamah.com/democracy-4-modding-guide/); [SteamAH Basic Gameplay Guide](https://steamah.com/democracy-4-basic-gameplay-guide/)
  6. **Voter-Group-Design**: 20 Gruppen + Everyone, Mehrfachmitgliedschaften mit Identifikationsstärke, dynamische Mitgliedschaft, Happiness theoretisch (nicht direkt Stimmen) — [SteamAH Basic Gameplay Guide](https://steamah.com/democracy-4-basic-gameplay-guide/)
  7. **Events/Dilemmas**: 3-Runden-Eval, 70 %-Schwelle, `_random_`-Zuschlag, Grudge-Decay, Selbst-Negativ gegen Wiederholung, 32-Runden-Dilemma-Cooldown — [SteamAH Modding Guide](https://steamah.com/democracy-4-modding-guide/)
  8. **Cynicism/Complacency** als Anti-Snowball bei Wahlen — [SteamAH Basic Gameplay Guide](https://steamah.com/democracy-4-basic-gameplay-guide/)
  9. **Minister-System** (PC-Produktion, Effectiveness, Voter-Sympathie zweiseitig) — [SteamAH Basic Gameplay Guide](https://steamah.com/democracy-4-basic-gameplay-guide/)
  10. **UI-Knotenfarben** (graue Policies, blaue Stats, rot/grüne Situationen, Effektpfeile grün/rot, Pfeilgeschwindigkeit = Stärke) — [SteamAH Basic Gameplay Guide](https://steamah.com/democracy-4-basic-gameplay-guide/); [Positech Modding Simulation](https://www.democracygame.com/mod_simulation.html)
- Fehlt in D4 (NWO-Differenzierungspotenzial): (a) regionale Tiefe — D4 hat nur eine Aggregat-Länderebene (Country-Overrides sind global, nicht pro Region) — [SteamAH Modding Guide](https://steamah.com/democracy-4-modding-guide/); (b) Kapitalstock/Investitionen — nur Subventions-Flüsse, kein Maschinen-/Anlagenbestand (siehe Frage 3) — [Democracy Wiki: Policies](https://democracygame.fandom.com/wiki/Policies); (c) sichtbare Formeln — UI zeigt Kanten, nie Gleichungen — [SteamAH Basic Gameplay Guide](https://steamah.com/democracy-4-basic-gameplay-guide/); (d) echte Opposition/Parlamentsfraktionen — „Opposition opposes everything" — [SteamAH Basic Gameplay Guide](https://steamah.com/democracy-4-basic-gameplay-guide/); (e) freie Sprachbefehle — kein Äquivalent; (f) Personal jenseits von Ministern (Beamte, Gouverneure) — nur Minister + simulierte Bürger (2.000) — [SteamAH Modding Guide](https://steamah.com/democracy-4-modding-guide/); (g) detaillierte Geldwirtschaft (Zins/Lira/Inflation als System) — nur Debt/Rating-Heuristik — [SteamAH Basic Gameplay Guide](https://steamah.com/democracy-4-basic-gameplay-guide/).

### Inferences
- NWOs 186-Knoten-Netz ist strukturell dasselbe wie D4s Objekt/Effect-Graph — der wichtigste qualitative Unterschied sollte sein: Kantenformeln für Spieler transparent machen (Tooltip „+0.06 Education über 4 Quartale, skaliert mit Technologie") statt D4s Blackbox.
- Für 81 Provinzen braucht NWO eine Hierarchie, die D4 nicht hat: Knotenwerte national + pro Provinz, Kanten mit räumlicher Dämpfung; D4s `overrides/`-Mechanismus ist die richtige Denkweise (gleiche Kante, anderer Kontext), aber pro Region statt pro Mission.
- Politisches Kapital als knappe Aktionsressource plus Minister-Kompetenz als Kostenmultiplikator ist ein robustes Doppel-System gegen Aktionismus — für NWOs Präsidenten-Rolle direkt adaptierbar (z.B. „Präsidentialer Erlass" vs. „Parlamentsweg" als zwei PC-Preisspalten).
- Die 2.000-simulierten-Wähler-Lösung (jeder eine gewichtete Kombi aus Gruppen) ist eine günstige Alternative zu Agenten-Simulation für NWO-Wahlen — skaliert auch auf 81 Provinzen (Stichprobe pro Provinz).

### Gaps
- Ob D4-Basis inzwischen (Sept 2026, nach Jahren von Updates/DLCs) mehr Knoten hat als die hier zitierten Listen: nicht verifiziert. Vor dem NWO-Balancing: aktuellen D4-Datendump ziehen und `policies.csv`/`simulation.csv`/`situations.csv` zählen — das liefert die in dieser Recherche fehlenden Vollzahlen und echten Koeffizienten.
- Review-/Community-Kritik und Cliff-Harris-Design-Postmortems konnten nicht belegt werden (Suchsperren) — für den Report-Teil „UI-Kritik" bitte separate Recherche.

---

## Quellenübersicht
- [Positech Modding Basics](https://www.positech.co.uk/democracy4/modding.html) (primär, Effektformel, CSV-Konvention, Prereqs)
- [Positech Modding Policies](https://www.positech.co.uk/democracy4/mod_policies.html) (primär, policies.csv-Spalten)
- [Positech/SteamAH Modding Guide — vollständig](https://steamah.com/democracy-4-modding-guide/) (Events, Dilemmas, Situations, Simulation, Countries, Overrides, Grudges; Spiegel der offiziellen Doku)
- [SteamAH Basic Gameplay Guide](https://steamah.com/democracy-4-basic-gameplay-guide/) (Manual-artig, Credit cliffski: UI, Voter, PC, Minister, Finanzen, Wahlen)
- [Positech Modding Simulation](https://www.democracygame.com/mod_simulation.html) (simulation.csv-Spalten)
- [Democracy Wiki: Policies](https://democracygame.fandom.com/wiki/Policies) (Policy-Listen D3/D4)
- [Democracy Wiki: Voter groups](https://democracygame.fandom.com/wiki/Voter_groups) (Gruppenliste)
- [Democracy Wiki: Situation-Kategorie](https://democracygame.fandom.com/wiki/Category:Situation) (Situations-Beispiele)
