# Hearts of Iron IV (Paradox) — Mechanik-Bestandaufnahme für NWO/Staatsräson

**Stand:** September 2026. Aktuelle Version/DLC laut Wikipedia (Review-Stand 27.09.2026): Patch **1.19 „Operation Postern"** mit Theater-Pack **„Thunder at our Gates"** (11.06.2026); davor **1.18 „Peace For Our Time"** (Focus Pack, Tschechoslowakei, 22.04.2026), **1.17 „No Compromise, No Surrender"** (Expansion, 20.11.2025 — Kohle/Strom-versorgte Fabriken, Fraktions-Mechaniken, Seewaffen), 1.16 „Graveyard of Empires" (04.03.2025), 1.15 „Götterdämmerung" (14.11.2024, Special Projects/Raids). „Together for Victory", „Death or Dishonor", „Waking the Tiger" (2024 integriert) und „Man the Guns" (2025 integriert) sind Basisspiel. — [Wikipedia: Hearts of Iron IV](https://en.wikipedia.org/wiki/Hearts_of_Iron_IV)

**Quellenlage:** Das hoi4.paradoxwikis.com blockiert automatisierte Zugriffe (JS-Challenge). Mechanik-Formeln stammen aus **Wayback-Snapshots vom 01.03.2024** der Wiki-Seiten (also Stand ~1.13–1.15); Formeln sind mit `[Wiki]` zitiert. Zahlen, die nur aus Spielerwissen/Training stammen, sind **`[SW]`** markiert und nicht wiki-verifiziert. Änderungen durch 1.17–1.19 (v. a. Kohle/Strom-System) konnten nicht in Formel-Detailtiefe verifiziert werden — siehe Gaps.

---

## 1. Produktionssystem

### Takeaway
HOI4s Kern-Schleife ist eine **Fabrik-zu-Equipment-Produktionslinie** mit einer Lernkurve („production efficiency") als wichtigster Spieler-Entscheidung: Linien lange unangetastet lassen vs. Technologie-Umstieg. Es gibt keine detaillierte Mikro-Produktion — alles wird über Fabrikanzahl × Output-Modifiern × Effizienz gelöst. Das UI zeigt dies als Liste von Linien mit Fabrik-Zuweisung, Effizienzbalken und Ressourcen-Warnungen.

### Cited Findings
- **Fabriktypen:** Zivile Fabriken (Bau, Handel, Konsumgüter, Geheimdienst), Baslsoutput **5 IC/Tag**; Militärfabriken (Ausrüstung, Panzer, Flugzeuge), Basisoutput **4,50/Tag**; Werften **2,5/Tag** bei immer 100 % Effizienz (keine Effizienz-Mechanik). — [Wiki: Production](https://web.archive.org/web/20240301id_/https://hoi4.paradoxwikis.com/Production)
- **Output-Formel:** `production = base output × (1 + factory output modifiers) × production efficiency`. Beispiel im Wiki: 4,50 × (1 + 0,10 (Export Focus) − 0,218 (Stabilität)) × 0,50 = 1,9845/Tag. — [Wiki: Production](https://web.archive.org/web/20240301id_/https://hoi4.paradoxwikis.com/Production)
- **Produktionslinien:** Jede Linie produziert einen Ausrüstungstyp; **max. 150 Fabriken pro Linie**; mehrere Linien desselben Typs möglich. Schiffs-Linien: max. 5 Werften (Großkampfschiffe), 10 (Zerstörer/U-Boote), 15 (Konvois); Eisenbahngeschütz max. 5 Mil-Fabriken, schwimmender Hafen 5 Werften. — [Wiki: Production](https://web.archive.org/web/20240301id_/https://hoi4.paradoxwikis.com/Production)
- **Production Efficiency (PE):** Startwert **10 %** (ohne Mod.), Deckel **50 %** (ohne Mod.). Tageswachstum: `0,001 × (PE-Cap)² / aktuelle PE`. Zeit bis Level x: `t = 500 × (PE/PE-Cap)²` Tage (max. 500 Tage bis Cap). — [Wiki: Production](https://web.archive.org/web/20240301id_/https://hoi4.paradoxwikis.com/Production)
- PE wird **pro Fabrik** getrackt: Neue Fabriken in bestehenden Linien starten bei Mindest-PE; alte Fabriken behalten ihren Wert. Bei Fabrikverlust fällt der Verlust auf die untersten Linien der Liste (Wiki rät, wichtige Linien nach oben zu sortieren). — [Wiki: Production](https://web.archive.org/web/20240301id_/https://hoi4.paradoxwikis.com/Production)
- **PE-Retention beim Linienwechsel:** 90 % (Variante desselben Modells), 70 % (anderes Modell, gleiches Chassis), 30 % (direkter Auf-/Abstieg desselben Typs), 20 % (indirekter Auf-/Abstieg), 10 % (jeder andere Wechsel). Formel mit Retentions-Bonus (Dispersed Industry I–IV, „Flexible Line" 1943): `PE_neu = CPE × (RET + (1−RET) × BON)`, Minimum ist Basis-PE. — [Wiki: Production](https://web.archive.org/web/20240301id_/https://hoi4.paradoxwikis.com/Production)
- **Baukosten (IC-Punkte):** Infrastruktur 6.000 (max. Stufe 5), Zivfabrik 10.800 (max. 20/State), Milfabrik 7.200 (max. 20), Werft 6.400, Synthetik-Raffinerie 14.500 (max. 3/State), Kraftstoff-Silo 5.000 (max. 3, +100.000 Kapazität), Raketenbasis 6.400 (max. 2), Kernreaktor 30.000 (max. 1, 1 Bombe/Jahr), Luftwaffenbasis 1.250 (max. 10, 200 Flugzeuge/Stufe), Flak 2.500 (max. 5), Radar 3.375 (max. 6). — [Wiki: Construction](https://web.archive.org/web/20240301id_/https://hoi4.paradoxwikis.com/Construction)
- **Construction-Speed-Formel:** Multiplikator `1 + (State-Infrastruktur × Max_Effect / Max_Level)` = `1 + Infra/5` (Defines-Wert INFRA_MAX_CONSTRUCTION_COST_EFFECT = 1), also ×1,6 bei Infra 3/5. Wird **nach** Tech-/Berater-/Spirit-Boni angewendet. — [Wiki: Construction](https://web.archive.org/web/20240301id_/https://hoi4.paradoxwikis.com/Construction)
- Infrastruktur lohnt sich für Bau-Speed allein nur mit offenen Slots (Break-even-Tabelle: z. B. Stufe 2 ab 7 offenen Zivfabrik-Slots bei Start 0); Wiki schlussfolgert, dass >2 Infra-Stufen selten allein fürs Tempo lohnen. — [Wiki: Construction](https://web.archive.org/web/20240301id_/https://hoi4.paradoxwikis.com/Construction)
- **Konsumgüter:** Anteil in % **aller** Fabriken (inkl. Militär und Handels-Fabriken, auch beschädigte), abgerundet; abhängig von Wirtschaftsgesetz, Spirits und Stabilität (−1 % je 10 % Stabilität über 50 %, bis −5 % bei 100 %). — [Wiki: Construction](https://web.archive.org/web/20240301id_/https://hoi4.paradoxwikis.com/Construction)
- **Fabrik-Konversion:** Ziv→Mil und umgekehrt möglich; Konversionskosten werden vom Wirtschaftsgesetz modifiziert (bis −30 % bei Total Mobilization). — [Wiki: Ideas (Economy laws)](https://web.archive.org/web/20240301id_/https://hoi4.paradoxwikis.com/Ideas)
- **Schaden/Reparatur:** Fabriken können durch Bombardement beschädigt werden; Reparatur läuft über zivile Fabriken (Free-Repair-Modifier je Gesetz). Kontrolle eines States erfordert Kontrolle von Provinzen mit ≥50 % der VP des States. — [Wiki: Construction](https://web.archive.org/web/20240301id_/https://hoi4.paradoxwikis.com/Construction)
- **UI:** Produktions-Tab zeigt Linien-Liste (Icon Equipment, zugewiesene Fabriken als Reihe von Fabrik-Icons, PE-Prozent, Durchschnitts-Penalty bei Ressourcenmangel), Fertigstellungs-Prognose als Tooltip; Bau-Tab mit Queue und direktem Klick auf die Karte (Bauobjekt wählen → State/Provinz anklicken); Eisenbahn-Bau über Bau-Tab oder Hub-Button. Ressourcen-Leiste oben zeigt Verbrauch/Verfügbarkeit je Ressource. — Beschreibungen aus [Wiki: Production](https://web.archive.org/web/20240301id_/https://hoi4.paradoxwikis.com/Production) und [Wiki: Supply](https://web.archive.org/web/20240301id_/https://hoi4.paradoxwikis.com/Supply); Layout-Details der Panels, Tooltips und Hotkeys **`[SW]`** (Produktions-Tab „Y"?, Konstruktion „T"? — nicht wiki-verifiziert).
- **Neu 1.17 (No Compromise, No Surrender, Nov. 2025):** Alle Fabriken müssen mit **Strom/Kohle** versorgt werden; Stromgewinn aus Kohle wird durch Technologien und Gebäude wie Dämme oder Kernkraftwerke beeinflusst. — [Wikipedia](https://en.wikipedia.org/wiki/Hearts_of_Iron_IV)

### Inferences
- Die PE-Lernkurve (500 Tage bis Cap) ist ein bewusster **Anti-Flip-Flop-Anreiz**: Spieler werden belohnt, Produktionslinien über Jahre stabil zu halten — genau die „Planwirtschaft mit Trägheit", die NWO für Großprojekte/Fabriken braucht.
- Der Retentions-Mechanismus (90/70/30/20/10 %) macht technologische Umstiege zu einer **kalkulierbaren Investitionsentscheidung** statt eines No-Brainers — übertragbar auf Maschinen-Generationen in NWO.
- „Fabrikverlust trifft die unterste Linie" ist eine elegante, implizite Priorisierungs-Regel ohne Mikromanagement-Bedingungen.

### Gaps
- Exakte Modifiertabellen der Industry-Techs (Concentrated/Dispersed Industry I–V: Output-Werte) waren im Snapshot nicht als saubere Tabelle extrahierbar; nur qualitativ belegt (Concentrated = Output, Dispersed = PE-Cap/Retention).
- Wie das 1.17-Stromsystem die Output-Formel konkret modifiziert (z. B. Penalty ohne Strom), ist nicht formelseitig verifiziert.
- Konkrete UI-Layout-Maße, Hotkeys und Tooltip-Tiefen sind nicht als Quelle auffindbar; nur aus Screenshots/Spielwissen rekonstruierbar.

---

## 2. Ressourcen

### Takeaway
Sechs strategische Ressourcen, die **nicht lagerbar** sind (Ausnahme Kraftstoff), sondern direkt in Produktion fließen. Mangel erzeugt eine **stufenweise, kumulierende Effizienzstrafe pro Fabrik** (−5 % pro fehlender Einheit, multiplikativ gestapelt) — ein hartes, aber gut kommuniziertes Signal im UI. Handel kostet zivile Fabriken („1 Fabrik = 8 Einheiten"), Handelsgesetze bestimmen Exportquote und Bonus-Output.

### Cited Findings
- **Ressourcen:** Öl (→ Kraftstoff, kein Fertigungsgut), Aluminium (Flugzeuge, Support), Kautschuk (Flugzeuge, Motorized/Mechanized), Wolfram (Artillerie/AT, mittlere Panzer, Jets, Eisenbahngeschütze), Stahl (Infanteriewaffen, Artillerie, Schiffe, Panzer, Züge), Chrom (schwere Panzer, Großkampfschiffe, Schiffe Stufe IV). — [Wiki: Production](https://web.archive.org/web/20240301id_/https://hoi4.paradoxwikis.com/Production)
- **Keine Lagerung:** Ressourcen fließen direkt in die Produktion, Überschuss ist verfallen. — [Wiki: Production](https://web.archive.org/web/20240301id_/https://hoi4.paradoxwikis.com/Production)
- **Mangelstrafe:** −5 % je fehlender Ressourceneinheit und Typ, auf die niedrigprioresten Linien gestaffelt; Penalty pro Fabrik multiplikativ gestapelt; Linie zeigt Durchschnitt. Wiki-Beispiel: 11 Fabriken, 2 Stahl/0 Aluminium statt benötigt 2/1 → Fabrik 1: −5 %, Fabrik 2: −10 %, … letzte: −100 %, Linienmittel −50 %. — [Wiki: Production](https://web.archive.org/web/20240301id_/https://hoi4.paradoxwikis.com/Production)
- **Ressourcengewinn:** Ausgrabungs-Technologie I–V je +10 % (max. +50 % auf extrahierte Ressourcen); Infrastruktur je Stufe +20 % (max. +100 %, ohne Raffinerie/Import); seit „No Step Back" +20 % wenn ein per Schiene/See mit der Hauptstadt verbundener Supply Hub im State liegt. — [Wiki: Production](https://web.archive.org/web/20240301id_/https://hoi4.paradoxwikis.com/Production)
- **Handelsgesetze:** Free Trade (80 % Exportquote, +15 % Factory/Construction-Output, +10 % Forschung), Export Focus (50 %, +10 %/+5 %), Limited Exports (25 %, +5 %/+1 %), Closed Economy (0 %, keine Boni), Embargoed Economy (25 %, +5 % Konsumgüter). Wechsel kostet 150 PP. — [Wiki: Ideas](https://web.archive.org/web/20240301id_/https://hoi4.paradoxwikis.com/Ideas)
- **Handels-Deals:** 1 zivile Fabrik = max. 8 Einheiten einer Ressource; von Vasallen: 1 Fabrik = 80 Einheiten (Kollaborationsregierung 80; Kolonie −50 %, Dominion −25 % Preis). Importierte Fabriken zählen zur Industrie des Exporteurs, können aber nicht selbst weiter gehandelt werden. — [Wiki: Trade](https://web.archive.org/web/20240301id_/https://hoi4.paradoxwikis.com/Trade)
- **Trade Influence:** Basis 150, modifiziert durch Distanz, Beziehungen, Ideologie-Popularität, Grenzdivisionen, Schiffe an der Küste, Vasallenstatus, Agenten-Missionen; verteilt verfügbare Exporte prozentual nach Einflussanteilen. — [Wiki: Trade](https://web.archive.org/web/20240301id_/https://hoi4.paradoxwikis.com/Trade)
- **Handelsrouten:** Landroute wenn Kapitalien verbunden und Distanz < `√(ln(2 + States_A + States_B)) × 7114 km`; sonst Seeweg über Häfen (Konvois). — [Wiki: Trade](https://web.archive.org/web/20240301id_/https://hoi4.paradoxwikis.com/Trade)
- **Kraftstoff:** Basis 2 Kraftstoff je Öl (Defines); Kapazität 50.000 + 100.000/Silo; Verbrauch Divisionen = 12× Nominalwert/Tag (doppelt bei Kampf in Bewegung), Flugzeuge 8,4×, Schiffe 2,4×; interner Vorrat Division 4 Tage; ab <25 % Vorrat Strafen bis 40 % Bewegungsgeschwindigkeit/10 % Kampfwerte; 50 % des Vorrats wird bei Kapitulation erbeutet, 25 % bei Annexion. — [Wiki: Fuel](https://web.archive.org/web/20240301id_/https://hoi4.paradoxwikis.com/Fuel)
- **International Market (AAT, 1.13):** Equipment-Kauf/Verkauf gegen „Economic Capacity" (EC), erzeugt von zivilen Fabriken; Normalpreis = 2× Produktionskosten (±25 % Preisstaffel); EC kann Bau-Beschleunigung bis +25 % (Defines CIC_BANK_SPEED_BOOST_FACTOR) kaufen; Kaufverträge laufen über Lieferungen mit Konvoikosten. — [Wiki: International market](https://web.archive.org/web/20240301id_/https://hoi4.paradoxwikis.com/International_market)

### Inferences
- Die Mangelstrafe pro Fabrik (nicht global) ist ein **feingranulares Priorisierungswerkzeug**: Hohe Linien werden bedient, niedrige leiden — das erzeugt automatisch „Rationierung" ohne Rationierungs-UI.
- Dass Ressourcen nicht lagerbar sind, eliminiert Vorratsspekulation und hält das Spiel im Tagesfluss — für NWO mit echten Märkten bewusst anders zu lösen (Lagerhaltung als Spielvariable).
- Trade Influence als relative Anteilsrechnung ist ein nettes Modell für „Marktmacht ohne Geldpreise".

### Gaps
- Aktuelle Ressourcenverteilung auf Regionen (Karte) und Ausbau-Entscheidungen („Resource prospecting decisions") nur qualitativ belegt, keine Zahlen.
- Ob 1.17 (Kohle) eine 7. strategische Ressource „Kohle/Strom" formell eingeführt hat oder Strom ein separater Wert ist, ist nicht formelseitig geklärt.

---

## 3. Wirtschaft und Geld

### Takeaway
HOI4 hat **kein Geld**. Drei Ersatzwährungen: (1) **Zivile Fabriken** als universelle Kaufkraft (Bau, Handel, Konsum), (2) **Political Power (PP)** als politische Handlungswährung (Gesetze, Berater, Foci), (3) seit AAT **EC** als Equipment-Marktwährung. Konsumgüter fungieren als stiller Steuersatz. Für NWO (Lira, Haushalt, Inflation) ist das ein Anti-Muster: HOI4 vermeidet Preisbildung komplett und büßt dafür makroökonomische Tiefe ein.

### Cited Findings
- Zivile Fabriken sind der Engpass für: Bau (Bauqueue), Handel (1 Fabrik = 8 Ressourcen), Konsumgüter (Prozentsatz nach Gesetz), Geheimdienst-Ausbau. — [Wiki: Production](https://web.archive.org/web/20240301id_/https://hoi4.paradoxwikis.com/Production); [Wiki: Trade](https://web.archive.org/web/20240301id_/https://hoi4.paradoxwikis.com/Trade)
- **PP:** Basis +2/Tag (Regular), ±50 % je Schwierigkeit; Stabilität modifiziert −50 % (0 %) bis +20 % (100 %); Speicher −500 bis 2.000; Ausgaben: Gesetzeswechsel 150 PP (Wirtschafts-, Handels-, Rekrutierungsgesetz), Foci (1 PP/Tag), Berater, Entscheidungen, Kriegsrechtfertigung. — [Wiki: Political power](https://web.archive.org/web/20240301id_/https://hoi4.paradoxwikis.com/Political_power)
- **Konsumgüter** als „versteckte Steuer": % aller Fabriken, je nach Wirtschaftsgesetz 50 % (Undisturbed Isolation) bis 10 % (Total Mobilization); Stabilität senkt den Satz um bis zu 5 %. — [Wiki: Ideas](https://web.archive.org/web/20240301id_/https://hoi4.paradoxwikis.com/Ideas); [Wiki: Construction](https://web.archive.org/web/20240301id_/https://hoi4.paradoxwikis.com/Construction)
- **Reparationen/Beute:** Peace Conference kann Zivfabriken zusprechen, Milfabriken des Verlierers entfernen, Ressourcenrechte übertragen; Kraftstoffbeute 50 % bei Kapitulation, 25 % bei Annexion. — [Wiki: Peace conference](https://web.archive.org/web/20240301id_/https://hoi4.paradoxwikis.com/Peace_conference); [Wiki: Fuel](https://web.archive.org/web/20240301id_/https://hoi4.paradoxwikis.com/Fuel)
- Handel ist **asynchron und zustimmungsfrei**: Exporteur wird nicht benachrichtigt, keine Zustimmung nötig; Handels-Fabriken des Exporteurs werden physisch addiert. — [Wiki: Trade](https://web.archive.org/web/20240301id_/https://hoi4.paradoxwikis.com/Trade)
- Lizenzeinnahmen: Tod oder Schande-DLC erlaubt Equipment-Lizenzen (Zahlung in PP/Ausrüstung) **`[SW]`**, im Wiki unter „Production licenses" erwähnt. — [Wiki: Production](https://web.archive.org/web/20240301id_/https://hoi4.paradoxwikis.com/Production)

### Inferences
- **Lektion für NWO:** HOI4s Fabrik-Währung ist stabil und exploit-arm, aber sie kann Inflation, Zinsen, Haushaltsdefizit nicht abbilden. NWO sollte die *Rolle* der Zivfabrik übernehmen (klare, knappe Planungswährung) und zusätzlich echte Geldflüsse modellieren: Haushaltsausgaben = Konsumgüter-Anteil analog, Importe = Devisenabfluss, EC-Markt als Vorbild für staatliche Auftragsvergabe.
- „Konsumgüter als % von ALLEN Fabriken" ist ein eleganter Anti-Snowball: Je mehr Militär man baut, desto mehr zahlt die Zivilbevölkerung — übertragbar als politischer Kostenfaktor (Wählergruppen-Unzufriedenheit).
- Fehlende Preise bedeuten: Ressourcenknappheit zeigt sich nur als Produktionsstrafe, nie als Preisverschiebung — für ein Spiel mit Inflation ein bewusst zu vermeidendes Muster.

### Gaps
- Konkrete Zahlen zu Lizenzzahlungen, Reparations-Transfers in der Peace Conference (wie viele Fabriken für wie viel Score) nicht extrahiert.
- EC-Wechselkurs-Logik (Fabrik-EC-Output pro Tag) nur angedeutet (Beispiel: 1 Fabrik = 5 EC/Tag im Subsidies-Abschnitt). — [Wiki: International market](https://web.archive.org/web/20240301id_/https://hoi4.paradoxwikis.com/International_market)

---

## 4. Kriegswirtschaft

### Takeaway
Die Kriegswirtschaft ist eine **Gesetzleiter** (Economy Laws von „Undisturbed Isolation" zu „Total Mobilization"), bezahlt mit PP und gebunden an War Support. Sie verschiebt Konsumgüter, Bau- und Konversionsgeschwindigkeit sowie Manpower. Ergänzt durch Rekrutierungsgesetze (Manpower gegen Output), ein Netzwerk-Nachschubsystem (Hubs, Schiene, Motoren) und ein Besatzungsmodell aus Compliance/Resistance. Peace Conferences sind Score-Auktionen in Runden — mechanistisch schwach und in der Community umstritten.

### Cited Findings
- **Wirtschaftsgesetze (Auswahl, vollständige Tabelle im Wiki):** Undisturbed Isolation: Konsumgüter +50 %, Zivbau −50 %, Milbau −50 %, Fuel Gain −60 %; … Partial Mobilization: Konsumgüter 25 %, Milbau +10 %, Konversion −10 %; **War Economy**: Konsumgüter 20 %, Milbau +20 %, Konversion −20 %; **Total Mobilization**: Konsumgüter 10 %, Milbau +30 %, Konversion −30 %, aber **Rekrutierte Bevölkerung −3 %**. Wechsel 150 PP, Voraussetzung u. a. War Support >15 %/25 %; für die Türkei (BfB) zusätzlich: „Devaluation of the Turkish Lira", „Worsening Recession", „Imminent Depression", „Rising Inflation" dürfen nicht aktiv sein. — [Wiki: Ideas](https://web.archive.org/web/20240301id_/https://hoi4.paradoxwikis.com/Ideas)
- **Rekrutierungsgesetze:** Recruitable Population 1,0 % (Disarmed) → 1,5 % (Volunteer) → 2,5 % (Limited) → 5 % (Extensive) → 10 % (Service by Requirement, −10 % Factory Output, +10 % Trainingszeit) → 20 % (All Adults Serve, −30 % Output) → 25 % (Scraping the Barrel, −40 % Output, +50 % Trainingszeit). — [Wiki: Ideas](https://web.archive.org/web/20240301id_/https://hoi4.paradoxwikis.com/Ideas)
- **Stabilität (0–100 %):** Bei 100 %: +10 % PP, +20 % Factory/Dockyard Output, −20 % Konsumgüter; bei 0 %: −50 % Output, −20 % PP; linear dazwischen (Nullpunkt 50 %). Krieg −20 %; War Support −0–30 % im Krieg; Parteipopularität +0–15 %. Niedrige Stabilität kann Krisen bis Bürgerkrieg auslösen. — [Wiki: Political power](https://web.archive.org/web/20240301id_/https://hoi4.paradoxwikis.com/Political_power)
- **War Support (0–100 %):** Bei 100 %: +30 % Mobilmachungsgeschwindigkeit, +10 % Angriff/Verteidigung auf Kerngebiet, +50 % Command-Power-Gain; bei 0 %: −30 % Kapitulationsschwelle, Krisenrisiko. Offensivkrieg −20 %, Defensivkrieg +20 %. — [Wiki: Political power](https://web.archive.org/web/20240301id_/https://hoi4.paradoxwikis.com/Political_power)
- **Nachschub (seit NSB 1.11):** Drei Quellen: Hub Supply (Netz aus Häfen/Supply Hubs/Schienen/Konvois), Aerial Supply (Transportflugzeuge), State Supply (fixer Grundwert je State; wird zuerst gezogen). Kapazität Hub: Schienenanschluss Stufe 1 = 15 Supply, +5 je weiteres Schienenlevel (max. 35); Hafen per Konvoi Basis 8, +3 je Hafenlevel; Hauptstadt-Hub = 5 + Fabriken/Weften. Reichweite fällt pro Provinz-Distanz ab, verbessert durch Motorisierung (0/40/80 Lkw je Hub), Schienenlevel, Infrastruktur. — [Wiki: Supply](https://web.archive.org/web/20240301id_/https://hoi4.paradoxwikis.com/Supply)
- **Baukosten Netzwerk:** Schiene je Provinz und Level 170/300/430/560/690 CIC (Stufe 1→5), Inland-Supply-Hub 20.000 CIC, Hafen 5.000 CIC (Stufe 1, +1.000 je weitere Stufe). Züge: 70 MIC (Basis), 50 MIC (Austerity), 105 MIC (gepanzert); Zugmangel reduziert Hub Supply prozentual. Eroberte Schienen: 10 Tage Umstellung (Nicht-Kernland), 5 (Kernland), 0 (Bürgerkrieg). — [Wiki: Supply](https://web.archive.org/web/20240301id_/https://hoi4.paradoxwikis.com/Supply)
- **Supply Map Mode (F4):** Provinzen-Farbskala hellblau (viel frei) → dunkelblau → violett (wenig/keins, keine leidenden Einheiten) → gelb (Unterversorgung) → rot (schwere Penalties); Shift = Hub-Reichweite, CTRL = Herkunftsaufschlüsselung. — [Wiki: Supply](https://web.archive.org/web/20240301id_/https://hoi4.paradoxwikis.com/Supply)
- **Besatzung:** Resistance startet bei 1 % und steigt gegen Resistance Target (Basis 35 %, modifiziert durch Claims −5 %, Frieden −10 %, VP 0–20 %, Compliance −0,5 %/% bis −50 %, Stabilität 0–20 %). Schwellen: 25 % „Organized Resistance" (Garrison-Penetration +50 %), 50 % (Garrison-Schaden +100 %), 75 % (Geschwindigkeit −50 %, Nachschub −50 %, Attrition +30 %), 90 % (Aufstand/Unabhängigkeit). — [Wiki: Occupation](https://web.archive.org/web/20240301id_/https://hoi4.paradoxwikis.com/Occupation)
- **Compliance-Formeln:** `Fabriken verfügbar = 25 % + 65 % × Compliance`; `Ressourcen = 35 % + 60 % × Compliance`; `Manpower = 2 % + 18 % × Compliance`. Raffinerien/Silos unbeeinflusst. — [Wiki: Occupation](https://web.archive.org/web/20240301id_/https://hoi4.paradoxwikis.com/Occupation)
- **Peace Conference:** Auslöser Kapitulation (VP-basiert; Majors müssen alle kapitulieren) oder Friedensangebot der Verlierer. Score = Kriegsanteil; Runden: Höchstscore beginnt, je Zug max. 30 % des Scores oder Abstand zum Zweitplatzierten; „Pass" bringt +20 % des Start-Scores. Aktionen: Territorium, Ideologie, Vasallisieren, Entmilitarisierung, Ressourcenrechte, Milfabriken entfernen, Zivfabriken übernehmen, Länder befreien, Score übertragen. Aktionen verursachen World Tension. AI-Verhalten ideologieabhängig (Demokratien: Befreien; Kommunisten: Vasallen; Faschisten: Annexion). — [Wiki: Peace conference](https://web.archive.org/web/20240301id_/https://hoi4.paradoxwikis.com/Peace_conference)
- **Kritik Peace Conference:** Der Mainsteam-Mod „Player-Led Peace Conferences" (voller Spieler-Kontrolle über Ergebnisse) gilt als „mainstay" der Community — indirekter Beleg für Unzufriedenheit mit dem Score-Auktions-System. — [Wikipedia](https://en.wikipedia.org/wiki/Hearts_of_Iron_IV)
- **Kriegszerstörung:** Bombardement beschädigt Fabriken/Infrastruktur/Schienen; „Scorched Earth" beim Rückzug; Reparatur über zivile Fabriken. — [Wiki: Construction](https://web.archive.org/web/20240301id_/https://hoi4.paradoxwikis.com/Construction); [Wiki: Supply](https://web.archive.org/web/20240301id_/https://hoi4.paradoxwikis.com/Supply)
- **Mobilmachung/Training:** Manpower-Ausbildung auf 75 % der Feldstärke oder 100.000 (was höher) begrenzt; Divisionen können unter Sollstärke gestartet werden. — [Wiki: Manpower](https://web.archive.org/web/20240301id_/https://hoi4.paradoxwikis.com/Manpower)

### Inferences
- Die Gesetzleiter ist das **beste Übernahmefragment für NWO**: eine gerichtete Stufenleiter (je stärker mobilisiert, desto mehr Output/Mil-Bau, desto weniger Zivilkonsum/Manpower-Komfort) mit PP-Kosten und War-Support-Schwellen. In NWO als Politiknetz-Maßnahmen mit Wählergruppen-Kosten darstellbar.
- Die türkischen Voraussetzungen („Lira-Abwertung nicht aktiv", „Inflation nicht aktiv") beweisen, dass Paradox selbst Wirtschaftskrisen-Spirits als Gesetzes-Blocker modelliert — exakt NWOs Domäne.
- Compliance/Resistance als zwei gegenläufige Kurven mit Schwellen-Effekten eignen sich für Besatzungs-/Regionalpolitik (Kurdengebiete, Ausnahmezustände), auch ohne Krieg.
- Die Peace-Conference-Kritik (Score-Auktion + Rundenlogik) ist eine dokumentierte Designschwäche: Besser für NWO wäre ein strukturiertes Verhandlungssystem mit fixierten Forderungskategorien und Abstimmung/Kosten statt Reihum-Auktion.

### Gaps
- Numerische Details der Trainings-/Deployment-Formeln (tägliche Trainingsrate) nicht extrahiert.
- Peace-Conference-Preise je Aktion (Score-Kosten von „Puppet" vs. „Annex") nicht als Tabelle auffindbar.
- Ob „No Compromise, No Surrender" (1.17) die Peace Conference oder Supply geändert hat (Wikipedia nennt „improved naval mechanics, doctrines, factions"), ist nicht formelseitig belegt.

---

## 5. Militär-Organisation

### Takeaway
Divisionen sind **Templates aus Bataillonen** (5 Regimenter × 5 Bataillone + 5 Support-Companies), geformt mit Armeerfahrung (XP). Kommandanten liefern Skalen-Boni (Generäle max. 24 Divisionen effektiv). Doktrinen sind vier exklusive Bäume mit XP-Kosten. Panzer-/Flugzeug-/Schiffs-Designer (DLCs) und MIOs (AAT) verknüpfen Industrie und Militär. Für NWO ist vor allem das Template/XP-Ökosystem relevant — nicht die Echtzeit-Taktik.

### Cited Findings
- **Template-System:** Bis 5 Kampf-Regimenter mit je bis zu 5 Bataillonen + bis zu 5 Support-Companies. Kosten: Bataillon hinzufügen 5 XP, Regiment neuen Typs 25 XP, entfernen 5 XP; Namens-/Icon-Änderung 0 XP. Template-Änderungen wirken sofort auf alle Divisionen (Nachbestellungen/Überschüsse). — [Wiki: Division](https://web.archive.org/web/20240301id_/https://hoi4.paradoxwikis.com/Division)
- **Sizing/Meta (Wiki-Strategieabschnitt):** Soft/Hard Attack und Defense/Breakthrough sind additiv, Organisation skaliert nicht mit Breite; nur 10 % der Angriffe wirken gegen gedeckte Defense, 40 % gegen erschöpfte. Faustregel: 20-width besser in der Verteidigung, 40-width besser im Angriff. — [Wiki: Division](https://web.archive.org/web/20240301id_/https://hoi4.paradoxwikis.com/Division)
- **Kampfwerte:** Soft/Hard Attack, Defense, Breakthrough, Organization, Recovery Rate, Hardness, Reconnaissance, Entrenchment, Initiative, Trickleback, Supply Use, Suppression, Armor, Piercing, Speed. — [Wiki: Equipment](https://web.archive.org/web/20240301id_/https://hoi4.paradoxwikis.com/Equipment); [Wiki: Division](https://web.archive.org/web/20240301id_/https://hoi4.paradoxwikis.com/Division)
- **Ausrüstungs-Hierarchie:** Archetype (z. B. medium tank) → Type (Panzer IV) → Family (gemeinsame Teile, besserer Linien-Wechsel) → Variant (mit XP modifizierbar). — [Wiki: Equipment](https://web.archive.org/web/20240301id_/https://hoi4.paradoxwikis.com/Equipment)
- **Kommandanten:** Anwerbung 5 Command Power je vorhandenem Kommandanten; General effektiv max. 24 Divisionen (72 im „Garrison Area"-Modus, sonst proportionale Bonus-Reduktion); Feldmarschall max. 5 Armeen (7 mit „Expert Delegator"); FM-Traits/Skill wirken auf untergebene Generäle mit 50 % Penalty; Background-Traits ohne Penalty; Beförderung General→FM kostet Command Power + 1 Skill-Level. — [Wiki: Commander](https://web.archive.org/web/20240301id_/https://hoi4.paradoxwikis.com/Commander)
- **Traits/Abilities:** Traits sind Spezialisierungen (Einheitentypen, Gelände, Situationen wie Festungsangriff); Abilities werden mit Command Power im Kampf aktiviert; XP-Gewinn aus Schlachten **`[SW]`** (im Wiki unter „Experience" verlinkt). — [Wiki: Commander](https://web.archive.org/web/20240301id_/https://hoi4.paradoxwikis.com/Commander)
- **Doktrinen:** Vier sich gegenseitig ausschließende Bäume (Mobile Warfare, Superior Firepower, Mass Assault, Grand Battleplan), je 1–2 exklusive Unterzweige, Freischaltung im Officer Corps mit Armeerfahrung. — [Wiki: Land doctrine](https://web.archive.org/web/20240301id_/https://hoi4.paradoxwikis.com/Land_doctrine)
- **MIOs (AAT):** Rüstungsfirmen mit Trait-Bäumen, Leveln über „Funds" (Forschung, Produktion, Foci), an Produktionslinien anhängbar, Richtlinien (Policies) bei hohem Level; mehrere MIOs desselben Typs möglich. — [Wiki: Military industrial organization](https://web.archive.org/web/20240301id_/https://hoi4.paradoxwikis.com/Military_industrial_organization)
- **Officer Corps (NSB):** Generalstab, Spirit-Auswahl (u. a. „Political Loyalty" + Stabilität), Army Command. — [Wiki: Officer corps](https://web.archive.org/web/20240301id_/https://hoi4.paradoxwikis.com/Officer_corps); [Wiki: Political power](https://web.archive.org/web/20240301id_/https://hoi4.paradoxwikis.com/Political_power)
- **Luftwaffe/Marine:** Flüge und Task Forces mit eigenen Missionen; Seetransport/Naval Invasion (max. 10 Divisionen mit Basis-Transporttech, 50 mit „Landing Craft"); strategische Umverlegung 5 km/h Basis (Infra) bzw. 15 km/h (Schiene) mit +10/+25 Bonus, Organisation −90 %. — [Wiki: Land warfare](https://web.archive.org/web/20240301id_/https://hoi4.paradoxwikis.com/Land_warfare)
- **Neu 1.19 (Thunder at our Gates, Juni 2026):** Militärische Hauptquartiere (HQs) und Schiffskapitäne. — [Wikipedia](https://en.wikipedia.org/wiki/Hearts_of_Iron_IV)

### Inferences
- Das XP-Ökosystem (Armeef-, Luft-, Marine-XP aus Manövern/Kampf; Ausgabe für Templates, Doktrinen, Varianten, MIOs) ist eine **einzige Fortschrittswährung fürs Militär** — für NWO brauchbar als „Militär-Erfahrung" für Reformen/Modernisierung.
- „General max. 24 Divisionen" ist eine natürliche Kommando-Skalengrenze — interessant für NWO: Organisationsform der TSK als begrenzende Größe.
- MIOs (Firmen mit Level-Bäumen an Produktionslinien) sind ein starkes Modell für NWO-Rüstungsindustrie/Großprojekt-Auftragnehmer.

### Gaps
- Konkrete XP-Kosten der Doktrin-Stufen und Fähigkeiten-Preise nicht extrahiert.
- Genauere Luftkampf-/Seekampf-Formeln (Interzeption, Sortien) nicht Teil der Recherche — für NWO vermutlich irrelevant.
- Division-Designer-UI (Drag&Drop-Bataillone, Stat-Vorschau) nur aus Spielwissen bekannt.

---

## 6. Focus Trees / National Spirits

### Takeaway
Langfristige Politik ist bei HOI4 ein **verzweigter Baum mit Zeit- und PP-Kosten** (ein Fokus gleichzeitig, ~35–70 Tage, 1 PP/Tag), ergänzt um Decisions (frei zugängliche Maßnahmen) und National Spirits (anhaltende Bonus/Malus-Modifikatoren). Damit löst HOI4 „Agenda" ohne Parlament — als inspirierendes Vorbild für NWOs 186-Knoten-Politiknetz, allerdings ohne Wähler-/Wahlmodell.

### Cited Findings
- **Focus-Mechanik:** Nur ein Fokus aktiv; 70-Tage-Fokus kostet 70 PP (−1 PP/Tag); nach Abschluss 10 Tage Schonfrist für die nächste Wahl; Abbruch verliert Fortschritt; Anforderungen/Bypass-Bedingungen; Tooltip zeigt Flavor, Voraussetzungen, Effekte. — [Wiki: National focus](https://web.archive.org/web/20240301id_/https://hoi4.paradoxwikis.com/National_focus)
- **Visuelle Indikatoren:** Klammernfarben (grau = verfügbar, braun = nicht verfügbar, golden = abgeschlossen, glänzend = laufend); Verbindungslinien grün (Vorgänger fertig)/hellblau; durchgezogen = UND, gepunktet = ODER; „mutually exclusive"-Icon zwischen exklusiven Pfaden. — [Wiki: National focus](https://web.archive.org/web/20240301id_/https://hoi4.paradoxwikis.com/National_focus)
- **Continuous Focus:** Nach 10 abgeschlossenen Foci freigeschaltet; 9 Optionen; permanenter Effekt für −1 PP/Tag, jederzeit wechselbar; verdrängt normalen Fokus. — [Wiki: National focus](https://web.archive.org/web/20240301id_/https://hoi4.paradoxwikis.com/National_focus)
- **Generischer Baum:** 5 Zweige (Army/Aviation/Naval/Industrial/Political Effort); Industrial Effort baut Fabriken/Infrastruktur und gibt Forschungsslots; Political Effort verzweigt politische Pfade. — [Wiki: National focus](https://web.archive.org/web/20240301id_/https://hoi4.paradoxwikis.com/National_focus)
- **National Spirits (Ideas):** Temporäre/permanente Modifikatoren, oft aus Foci/Events; Beispiele Türkei (BfB-Baum): „Etatism" −7 % Konsumgüter, „İnanç Vergisi" −10 % Konsumgüter, „Funkplan", „Privatized Infrastructure", „Devaluation of the Turkish Lira" (blockiert Wirtschaftsgesetze), „Worsening Recession", „Rising Inflation". — [Wiki: Ideas](https://web.archive.org/web/20240301id_/https://hoi4.paradoxwikis.com/Ideas)
- **Decisions:** Panel mit Kategorien (generisch: Resource Prospecting, Stability & War Support, Political Decisions, Formable Nations; nationenspezifisch inkl. „Turkish decisions"); kosten meist PP, teils mit Timer/Kosten-Aufbau **`[SW]`**; eingeführt mit „Waking the Tiger". — [Wiki: Decisions](https://web.archive.org/web/20240301id_/https://hoi4.paradoxwikis.com/Decisions); [Wikipedia](https://en.wikipedia.org/wiki/Hearts_of_Iron_IV)
- **Berater-System:** Politische Berater (Common/Individual Traits), Design Companies/MIOs, Theoretiker (Forschungsbonus), Militärchefs, High Command (Prozentboni auf Teilstreitkräfte) — alle gegen PP. — [Wiki: Ideas](https://web.archive.org/web/20240301id_/https://hoi4.paradoxwikis.com/Ideas)
- **World Tension (0–100):** globale Eskalationsmeter; aggressives Handeln erhöht sie; bestimmte Aktionen (Kriegsrechtfertigung, Volunteers) sind je Ideologie an Schwellen gebunden. — [Wikipedia](https://en.wikipedia.org/wiki/Hearts_of_Iron_IV)
- **Balance of Power:** zusätzliches Innenmacht-System (im Wiki-Mechanik-Index gelistet, Details nicht extrahiert). — [Wiki: Peace conference (Mechanik-Index)](https://web.archive.org/web/20240301id_/https://hoi4.paradoxwikis.com/Peace_conference)

### Inferences
- Focus-Bäume sind **narrativ konditionierte Politikpfade** mit exklusiven Weichen — genau NWOs Politiknetz-Logik (186 Knoten), nur zeitbasiert statt geld-/wählerbasiert. Die UND/ODER-Linien und Exklusivitäts-Marker sind ein bewährtes UI-Vokabular für ein Politiknetz.
- National Spirits als Stapel von Modifikator-Kacheln (mit Icon + Tooltip) sind die **einheitliche Darstellungssprache** für NWOs Maßnahmen-/Problemeffekte.
- Continuous Foci als „Dauereinstellung" (z. B. „Resistance Suppression" −5 % Resistance Target) sind ein gutes Muster für permanente Politikausrichtungen.

### Gaps
- Balance-of-Power-Mechanik (1.13+) nicht vertieft.
- Ereignis-Ketten/MTTH-Logik (Events) nicht formelseitig erfasst.

---

## 7. Fortschritt/Technologie

### Takeaway
Forschung läuft über **2–4 parallele Slots** (mehr durch Foci), Tageskosten in 50er-Schritten (Basis 100 Tage), additiven Speed-Boni und einem **Ahead-of-Time-Penalty von +200 % pro Jahr**. Die Industrie-Bäume (Machine Tools, Construction, Excavation, Concentrated/Dispersed Industry) sind die relevanten Vorlagen für NWO-Landwirtschafts-/Industriemaschinen.

### Cited Findings
- **Slots:** 4 für Deutschland/Italien/Japan/UK/USA; 3 für Frankreich/Sowjetunion/die meisten europäischen Länder; 2 für kleinere/Europa-außen; +1–3 via Foci, letzter Slot oft an 50+ Fabriken gekoppelt. „Days Saved": max. 30 Tage je Slot. — [Wiki: Research](https://web.archive.org/web/20240301id_/https://hoi4.paradoxwikis.com/Research)
- **Kosten:** Vielfache von 100 Tagen (50: Panzer-Submodelle; 150: Machine Tools I/II, Equipment Conversion, Oil/Rubber Processing; 200: Machine Tools III, Production Line I, Industry, Construction, Excavation; 250: Production Line II, Computing; 300: Fuel Refining, Synthetic Oil; 500: Atomic Research/Nuklearbombe). — [Wiki: Research](https://web.archive.org/web/20240301id_/https://hoi4.paradoxwikis.com/Research)
- **Speed-Formel:** `Tage = ⌈N / (1 + B%)⌉`; Speed-Boni stacken additiv; minimale Speed 10 %; tägliche Neuberechnung. — [Wiki: Research](https://web.archive.org/web/20240301id_/https://hoi4.paradoxwikis.com/Research)
- **Ahead-of-Time:** +200 % Penalty je Jahr vor dem Technologie-Datum; Formel (AOT=2): `365 × (T + 1/2) × (1 − e^(−(2N/365) × 1/(1+B%)))` Tage. Foci können AOT reduzieren. — [Wiki: Research](https://web.archive.org/web/20240301id_/https://hoi4.paradoxwikis.com/Research)
- **Industrie-Techs:** Machine Tools (I–III+, erhöht Factory Output/PE), „Flexible Line" (1943, PE-Retention), Production Line I/II, Construction (Baugeschwindigkeit), Excavation I–V (+10 % Ressourcen je Level), Concentrated vs. Dispersed Industry (Output vs. PE-Cap/Retention/Konversion), Synthetic Refinery-Techs (Kraftstoff/Kautschuk). — [Wiki: Production](https://web.archive.org/web/20240301id_/https://hoi4.paradoxwikis.com/Production); [Wiki: Research](https://web.archive.org/web/20240301id_/https://hoi4.paradoxwikis.com/Research)
- **Sonstige Forschungsquellen:** Lizenzen (Tod oder Schande), Technologie-Sharing (Together for Victory), Theoretiker/Design Companies, Research-Company-Boni. — [Wiki: Research](https://web.archive.org/web/20240301id_/https://hoi4.paradoxwikis.com/Research)
- **Special Projects (Götterdämmerung, 1.15):** Atombombe, Superheavy-Panzer, Interkontinentalbomber, Raketen erfordern eigene Forschungseinrichtungen/Gebäude. — [Wikipedia](https://en.wikipedia.org/wiki/Hearts_of_Iron_IV)

### Inferences
- Das **AOT-System** ist ein eleganter Mechanismus gegen „Tech-Rush": Früher Forschen ist möglich, aber teuer — übertragbar auf NWO-Technologie-/Modernisierungszyklen (z. B. zu frühe Maschinengeneration).
- „Concentrated vs. Dispersed Industry" ist ein Strategie-Weichensteller (viel Output vs. robust gegen Umstieg) — brauchbar als NWO-Entscheidung zwischen Skaleneffekten und Resilienz.
- Der Slot-Mangel (2–4 parallel) erzwingt Priorisierung — für NWO analog: begrenzte „Reformkapazität" des Präsidenten.

### Gaps
- Exakte Modifiertabellen der Machine-Tools-Stufen (Output +% pro Stufe) nicht extrahiert.
- Details der Agrar-/Landwirtschafts-Technologien existieren in HOI4 nicht (kein Agrarsektor) — für NWO Neuland.

---

## 8. UI und Präsentation

### Takeaway
HOI4s UI ist ein **map-first-Dashboard**: Karte mit Modus-Ebenen (Supply, Bau, Ressourcen …), schwimmende Panels rechts, Top-Bar mit Ressourcen/Industrie-Kennzahlen, extrem tiefe Tooltips. Gelobt wird die industrielle Schleife und der strategische Zoom, kritisiert die **Intransparenz des Kampfsystems**, die UI-Dichte und die KI im Schlachtplaner.

### Cited Findings
- **Kartenmodi:** Auswahl-Icons unten rechts; z. B. Supply Map Mode über F4; Farbverläufe zeigen hunderte Provinzen gleichzeitig (blau→violett→gelb→rot); Tooltip-Systeme mit Shift/CTRL für Zusatzebenen (Hub-Reichweite, Herkunftsaufschlüsselung). — [Wiki: Supply](https://web.archive.org/web/20240301id_/https://hoi4.paradoxwikis.com/Supply)
- **Tooltips als Kern-UI:** Supply-Map-Tooltips erklären Herkunft des Nachschubs, Zuggarnisonen, Hub-Auslastung, Bottlenecks der Schienenverbindung; Focus-Tooltips zeigen Voraussetzungen/Bypass/Effekte; PE-Tooltip zeigt Wachstum. — [Wiki: Supply](https://web.archive.org/web/20240301id_/https://hoi4.paradoxwikis.com/Supply); [Wiki: National focus](https://web.archive.org/web/20240301id_/https://hoi4.paradoxwikis.com/National_focus)
- **Theater/Combat Log:** Theater mit Command Groups, Alarme (low supply, Invasionen), Combat-Log mit Zeitfilter, Verluststatistik nach Template (TfV). — [Wiki: Land warfare](https://web.archive.org/web/20240301id_/https://hoi4.paradoxwikis.com/Land_warfare)
- **Gelobt (PC Gamer, 88/100):** „managing my production lines and army composition to be enormously satisfying"; die „high-level compromises between the army you want, the army you have, and the army you produce" als Kernfreude; Skala von Division-Mikro bis Hemisphären-Zoom. — [PC Gamer Review](https://www.pcgamer.com/hearts-of-iron-4-review/)
- **Kritisiert (PC Gamer):** Kampf-System „opaque" — zu viele Variablen, kryptische Stats, Effekte von Doktrinen/Signal-Companies schwer sichtbar; Schlachtplaner-AI bildet „dispersed blobs", Enzyklierungen mühsam; KI öffnet kaum neue Fronten/Invasionen; Industriekapazität determiniert lange Kriege. — [PC Gamer Review](https://www.pcgamer.com/hearts-of-iron-4-review/)
- **Score-Screen/Ledger:** In der Review als „score screen" erwähnt (Fabrikvergleich Alliierte vs. Italien). — [PC Gamer Review](https://www.pcgamer.com/hearts-of-iron-4-review/)
- **Zeitsteuerung:** Pause + 5 Geschwindigkeitsstufen, Tages-Tick **`[SW]`** (Paradox-Standard; nicht wiki-verifiziert).

### Inferences
- Der Erfolg der UI liegt in **drei Informationsschichten**: Karte (räumlich), Top-Bar (makro), Tooltip (kausal). NWO sollte dasselbe Dreischicht-Prinzip für die 81 Provinzen übernehmen.
- Die dokumentierte Kampf-Opacity ist eine Warnung: Jede NWO-Mechanik braucht **kausale Tooltips** („warum sinkt die Produktion?") statt bloßer Zahlen.
- PC Gamers Lob der Produktions-Kompromisse zeigt: Schleifen mit Opportunitätskosten machen Management „worryingly satisfying" — das ist die Zielqualität für NWOs Wirtschaftsboard.

### Gaps
- Keine systematische UI-Kritik aus neueren Quellen (2024–2026) gefunden; Reviews zur UI-Lage post-1.15 fehlten im Recherchebudget.
- Tastaturbelegung, Skalierungsoptionen, Accessibility nicht dokumentiert.
- Steam-/Reddit-Mechanik-Guides (Produktionsformeln der Community) konnten nicht verlässlich abgerufen werden (kein Suchzugriff); Formeln stammen daher aus dem Wiki, das sie selbst mit Defines-Quellen belegt.

---

## 9. Übernahme für NWO (Staatsräson)

### Takeaway
Von HOI4 übernehmbar sind: die **Produktionslinien-Metapher mit Lernkurve**, das **Mangelstrafen-System pro Einheit**, die **Gesetzleiter für Kriegswirtschaft**, das **Compliance/Resistance-Kurvenmodell**, das **Focus-Baum-Vokabular (UND/ODER/Exklusiv)** und die **Tooltip-Disziplin**. Nicht übernehmbar: Echtzeit-Kampf, Divisionstaktik, Flotten-/Luftkrieg im Detail. Peace Conferences sind ein Negativbeispiel.

### Cited Findings (Quellenbasis siehe Abschnitte 1–8)
- Produktionsformel + PE-Lernkurve + Retentions-Matrix: [Wiki: Production](https://web.archive.org/web/20240301id_/https://hoi4.paradoxwikis.com/Production)
- Ressourcenmangel-Penalty (−5 %/Einheit, gestaffelt pro Fabrik): [Wiki: Production](https://web.archive.org/web/20240301id_/https://hoi4.paradoxwikis.com/Production)
- Economy-/Conscription-/Trade-Law-Leitern inkl. türkischer Krisen-Blocker: [Wiki: Ideas](https://web.archive.org/web/20240301id_/https://hoi4.paradoxwikis.com/Ideas)
- Compliance-/Resistance-Formeln und Schwellen: [Wiki: Occupation](https://web.archive.org/web/20240301id_/https://hoi4.paradoxwikis.com/Occupation)
- Focus-Baum-Visuelle Sprache: [Wiki: National focus](https://web.archive.org/web/20240301id_/https://hoi4.paradoxwikis.com/National_focus)
- Peace-Conference-Score-Auktion + Community-Mod als Kritikbeleg: [Wiki: Peace conference](https://web.archive.org/web/20240301id_/https://hoi4.paradoxwikis.com/Peace_conference); [Wikipedia](https://en.wikipedia.org/wiki/Hearts_of_Iron_IV)
- UI-Dreischicht (Karte/Top-Bar/Tooltip) und Produktions-Lob vs. Kampf-Kritik: [PC Gamer Review](https://www.pcgamer.com/hearts-of-iron-4-review/); [Wiki: Supply](https://web.archive.org/web/20240301id_/https://hoi4.paradoxwikis.com/Supply)

### Konkrete Übernahmeliste
1. **Produktionslinien-UI für Industrie/Großprojekte:** Linien-Liste mit zugewiesener Kapazität („Fabriken"→„Werke/Bauteams"), Fortschrittsbalken, PE-äquivalente **Lernkurve pro Projekt** (`Wachstum = 0,001 × Cap²/aktuell`), Retentions-Matrix beim Projektwechsel (90/70/30/20/10 %).
2. **Ressourcen-Mangel-Regeln:** 5–6 strategische Ressourcen für NWO (Stahl, Zement, Energie/Strom, Öl, Kautschuk/Ersatzstoffe, Halbleiter o. ä.); Penalty **pro Produktionslinie gestaffelt** (−5 % je fehlender Einheit), Anzeige als Durchschnitts-Penalty; keine Lagerung (oder bewusst Lagerhaltung als Variable einführen).
3. **Mobilisierungsstufen als Politiknetz-Maßnahmen:** Leiter von „Friedenswirtschaft"→„Totaler Krieg" mit Konsumgüter-/Haushalts-Kosten, War-Support-Schwellen (in NWO: Wählerunterstützung/Kriegsbegeisterung), PP-Kosten (in NWO: politisches Kapital/„Präsidentenressource"), Türkei-Vorbild: Wirtschaftskrisen-Spirits („Lira-Abwertung", „Steigende Inflation") als Blocker für Reformen.
4. **Haushalt statt Fabrik-Währung:** HOI4s Zivfabrik = NWOs **Haushaltsmittel/Kreditaufnahme**; Konsumgüter-% = Sozialausgaben-Anteil; EC-Markt (AAT) = Vorbild für **staatliche Beschaffung/Rüstungsmarkt** mit Verträgen und Lieferungen.
5. **Compliance/Resistance-Kurven** für innenpolitische Konfliktzonen (Provinz-Unruhen, Ausnahmezustand): zwei gegenläufige Werte mit Schwellen (25/50/75/90 %) und abgeleiteten Effekten (Wirtschaftsleistung = 25 % + 65 % × Compliance).
6. **Focus-Baum-Vokabular** fürs Politiknetz: UND/ODER-Linien, goldene/gelbe Klammern, „sich ausschließend"-Icons, 10-Tage-Schonfrist nach Maßnahmen, Continuous-Focus als Dauerausrichtung (z. B. „Dauerhafte Propaganda").
7. **Forschung/Modernisierung:** Begrenzte Slots (2–4), AOT-Penalty (+200 %/Jahr) gegen Tech-Rush, „Days Saved"-Puffer (30), Machine-Tools-Analog für **Maschinengenerationen in Industrie/Landwirtschaft** (Ausrüstungs-Typ→Family→Variant).
8. **Nachschub/Infrastruktur-Netze** für Großprojekte/Logistik (Eisenbahnlevel-Kosten 170→690 je Stufe, Hub-Reichweite mit Distanz-Abfall, Motorisierung) — übertragbar auf regionale Versorgung der 81 Provinzen.
9. **Peace-Conference-Lektion:** Kein Score-Auktions-Modell! Stattdessen strukturierte Verhandlung mit fixen Forderungskategorien, transparenten Kosten und (bei Multiplayer/MP-Simulation) deterministischer Auflösung; „Player-Led Peace Conferences"-Mod als Beleg, dass Spieler Kontrolle statt Auktion wollen.
10. **UI-Regeln:** Drei Schichten (Karte/Top-Bar/Tooltip); Kausal-Tooltips für jede Zahl; Farbverlauf-Kartenmodi für Versorgung/Stabilität; Ledger/Score-Screen für Industrievergleich.

### Nicht übernehmen
- Echtzeit-Kampf, Divisionstemplate-Mikro (5×5-Bataillone), Battleplan-KI, Flotten-/Luftmissionen, Enzyklierungen, Strategische Umverlegung.
- Weltspannungs-Meter und Fokus-Bäume in historischer Narrativ-Dichte (NWO hat eigenes Politiknetz).
- Score-basierte Friedensverhandlungen (siehe Punkt 9).

### Inferences
- HOI4 beweist, dass **Trägheit (PE-Lernkurven, Bauzeiten, AOT)** die strategische Tiefe erzeugt — NWO sollte Großprojekte bewusst „langsam und teuer" modellieren.
- Die stärkste Übernahme ist das **Gesetzleiter-Prinzip** (klare Stufen, harte Trade-offs, Schwellen-Gates) gekoppelt mit NWOs realen Geldflüssen — das ist die Lücke, die HOI4 offen lässt.

### Gaps
- Kein Zugriff auf aktuelle 1.17–1.19 Formel-Details (Kohle/Strom, neue Doktrinen, HQs) — vor Implementierungsentscheidungen ggf. erneut gegen aktuelles Wiki/Defines prüfen.
- Keine gesicherten Zahlen zu Community-Meta (z. B. aktuelle Combat-Width-Breite nach 1.15-Änderungen am Kampfsystem) — nur Wiki-Stand 03/2024.
- UI-Maße/Hotkeys/„was Spieler täglich klicken" nur aus Spielwissen; für NWO-UI-Spezifikation eigene Erhebung nötig.
