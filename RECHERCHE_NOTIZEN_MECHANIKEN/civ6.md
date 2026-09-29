# Civilization VI (Firaxis/2K) — Spielmechanik-Bestandsaufnahme für „Staatsräson" (NWO)

**Zweck:** Quellennotizen für ein politisches Desktop-Strategiespiel (NWO): Wie löst Civ 6 Städte, Produktion, Nahrung, Technologie, Infrastruktur und Karte mechanisch/visuell? Alle Angaben Stand September 2026 (Civ 6 Anthology = Vanilla + Rise and Fall + Gathering Storm + New Frontier Pass + Leader Pass). Zahlen/Formeln soweit dokumentiert; als **[Spielerwissen]** markiert, was nicht durch Quellen belegt ist.

**Hauptquelle:** Civilization-Wiki (Fandom), Civ-6-Artikel (per Fandom-API abgerufen, Stand 29.09.2026). Sekundär: PC-Gamer-Review. CivFanatics-Formelthreads nur indirekt über Wiki-Zitate erreichbar (Cloudflare-Sperre); Lücken sind markiert.

---

## 1. Stadtproduktion (Produktions-Queue, Bauzeiten, Beschleunigung, Wunder)

### Überblick
Produktion ist die zentrale „Baustoff"-Währung pro Stadt: Jedes Bauprojekt (Gebäude, Einheit, Distrikt, Wunder, Projekt) hat feste Produktionskosten, wird in die **Produktions-Queue** der Stadt gesetzt und wird am Rundenende um die Produktionskraft der Stadt vorangetrieben. Es gibt drei Beschleuniger: Chop/Harvest (sofortige Einmal-Produktion), Gold-Kauf und politische Modifikatoren (Policy Cards). Wunder sind weltweit exklusive Megaprojekte auf eigenen Kacheln.

### Zitierte Befunde
- Jedes Ding, das eine Stadt bauen kann, kostet eine bestimmte Menge Produktion; meist statisch, teils skalierend (z. B. Distrikte). Die UI zeigt Kosten als Rundenzahl, in Tooltips die Roh-Produktionskosten. — [Production (Civ6)](https://civilization.fandom.com/wiki/Production_(Civ6))
- Ablauf: In die Produktions-Queue legen → am Rundenende fließt die Produktionskraft ein → bei Erreichen der Kosten fertig. Projekte können **mitten in der Runde** fertig werden, wenn eine Spieleraktion (Ressource ernten, Feature entfernen) genug Produktion liefert. — [Production (Civ6)](https://civilization.fandom.com/wiki/Production_(Civ6))
- **Production Overflow:** Überhang bei Feature-Entfernung (Wald, Regenwald) oder Ressourcen-Harvest (Stein) sowie kleiner am Rundenende fließt in das nächste Projekt der Queue. — [Production (Civ6)](https://civilization.fandom.com/wiki/Production_(Civ6))
- Overflow-Exploit & Fix: Bis Gathering Storm konnten Policy-Boni (z. B. +100 % Mauern mit „Limes") auf den vollen Chop-Overflow angewendet und in wertvolle Projekte umgeleitet werden („Einheit auf 1 Runde vor Fertigstellung bauen, mit Policy choppen"). Februar-2019-Update: Policymodifizierter Overflow geht verloren, wenn das Projekt fertig wird; nur der tatsächlich verwendete Anteil wird geboostet. — [Production (Civ6)](https://civilization.fandom.com/wiki/Production_(Civ6))
- Produktionsquellen: Terrains/Kacheln (Plains +1, Hills +1, Woods +1; Regenwald gibt Food, nicht Produktion) — von Bürgern (Citizens) bewirtschaftet; dann Industriezone (District) inkl. Adjacency, Fabrik/Kraftwerk strahlen Produktion auf Städte im **6-Kachel-Radius** aus (Kohlekraftwerk in GS nur für eigene Stadt); Werft gibt Produktion = Gold-Adjacency des Hafens; Handelsrouten; Pantheons/Beliefs; Policy Cards. — [Production (Civ6)](https://civilization.fandom.com/wiki/Production_(Civ6))
- **Distrikt-Kostenformel (progressiv):** `District Cost = [1 + 9 * max(T, C)] * base_cost` mit T = Anteil Tech-Tree erforscht (0–1), C = Anteil Civic-Tree. Kosten steigen also über das Spiel um Faktor 10. Basiskosten meist **54 Produktion** (Aquädukt 36, Government/Diplomatic Plaza 30, Damm/Kanal 81, Spaceport 1800 ohne Skalierung, Unique Districts = halbe Kosten, meist 27). — [District (Civ6)](https://civilization.fandom.com/wiki/District_(Civ6))
- **Distrikt-Rabatt (40 %):** Ein Distrikttyp T ist rabattiert, wenn (1) Anzahl fertiger Specialty Districts ≥ Anzahl entsperrter Distrikttypen und (2) Anzahl Distrikte vom Typ T < Durchschnitt (B/A). Soll „Wide-Vielfalt" belohnen. Kosten werden beim Platzieren eingefroren. Quelle der Mechanik: CivFanatics-Resource „Civ VI District Discounts". — [District (Civ6)](https://civilization.fandom.com/wiki/District_(Civ6)); Mechanik-Detailquelle zitiert dort: [CivFanatics](https://forums.civfanatics.com/resources/civ-vi-district-discounts.27783/)
- Beschleuniger im Detail: Builder-Harvest/Feature-Removal als Sofort-Produktion; Aztec-Builder zahlen 20 % der Distriktkosten mit Build Charge; Militäringenieure (GS) 20 % bei Ingenieur-Distrikten; Qin Shi Huang: 1 Builder-Charge = 15 % der Wunderkosten. — [District (Civ6)](https://civilization.fandom.com/wiki/District_(Civ6)); [Production (Civ6)](https://civilization.fandom.com/wiki/Production_(Civ6))
- Harvest-Werte: Bonus-Ressource ernten = +20 Food oder +20 Produktion oder +40 Gold (skaliert mit Ära), 1 Build Charge, Ressource verschwindet dauerhaft. Modifikatoren richten sich in GS nach der *letztrundigen* Bauarbeit; Overflow genießt keine Gebäude-Modifikatoren mehr. — [Resource (Civ6)](https://civilization.fandom.com/wiki/Resource_(Civ6)); [Builder (Civ6)](https://civilization.fandom.com/wiki/Builder_(Civ6))
- **Gold-Kauf:** Gold ist die Standardwährung; Überschuss (Schatzkammer + Goldfluss oben links) kann für Käufe in Städten ausgegeben werden (Einheiten, Gebäude); Distrikte lassen sich mit Gold über Gouverneure (Reyna/Moksha) kaufen. — [Gold (currency) (Civ6)](https://civilization.fandom.com/wiki/Gold_(currency)_(Civ6)); [District (Civ6)](https://civilization.fandom.com/wiki/District_(Civ6))
- **Wunder:** Weltweit nur **einmal** existent → Bau ist ein Wettrennen. Trostpreis für Verlierer: **50 % der investierten Produktion** (nicht Gold wie in Civ 5). Wunder stehen auf **eigenen Kacheln** (konkurrieren mit Distrikten/Verbesserungen), haben spezifische Platzierungsbedingungen (Terrain, Adjacency, Gebäude-Voraussetzungen). Sobald eine Stadt „Baugrund bricht" (Wunder in Queue), kann keine andere Stadt desselben Spielers dasselbe Wunder bauen. Zerstörte Wunder sind für immer weg. Tourismus: 2 Basis, +1 pro durchlaufene Ära. — [Wonder (Civ6)](https://civilization.fandom.com/wiki/Wonder_(Civ6))
- Typische Bauzeiten sind nirgends als feste Zahl dokumentiert (hängen an Stadtproduktion/Ära/Tempo). **[Spielerwissen, unbelegt]:** Frühe Gebäude ~3–10 Runden (Standard), Distrikte ~6–15, Wunder mittelspiel ~15–40 Runden, späte Megaprojekte 30+; viele Spieler kaufen kleine Einheiten mit Gold und sparen Produktion für Wunder/Distrikte.

### Schlussfolgerungen
- Die Queue ist bewusst einfach (FIFO-Liste mit Sofort-Fertigstellung durch Harvest) — die strategische Tiefe kommt aus **Kosten-Skalierung + Rabattlogik + Overflow-Regeln**, nicht aus komplexer Planung.
- „Bauen, was man will" entsteht durch drei parallele Währungen (Produktion, Gold, Build-Charges) für dasselbe Ziel.
- Wunder-Mechanik (exklusiv, Konsolationspreis 50 %, Platzierungsregeln) ist direkt als **Großprojekt-System** übertragbar (NWO: Riesenhäfen, Autobahnen, Istanbuler Kanal etc.).

### Lücken
- Exakte CivFanatics-Formeln zu Unit-Kosten-Skalierung (Einheiten werden mit Anzahl gebauter Einheiten teurer) und Chop-Formel (Basiswert × Ären-/Tech-Skalierung) nicht direkt zugänglich — nur die Wiki-Angaben (+20/+20/+40, era-skaliert). **[Spielerwissen]:** Chop-Basis skaliert mit Anzahl erforschter Technologien, nicht linear mit Runden.
- Keine offizielle Aussage zu typischen Bauzeiten; Steam-/Forum-Konsens nicht geprüft (Quellensperre).

---

## 2. Nahrung und Landwirtschaft (Wachstum, Housing, Builders, Bewässerung)

### Überblick
Nahrung ist der Wachstumstreiber pro Stadt: Jeder Bürger frisst 2 Nahrung/Runde, Überschuss füllt den „Food Basket" (wird pro Bürger größer), Unterdefizit entvölkert die Stadt. Zwei harte Grenzen dämpfen das Wachstum: **Housing** (Wohnraum, 100/50/25/0 %-Wachstum) und **Amenities** (Zufriedenheit, ±% auf Wachstum). Landwirtschaft = Farm-Verbesserungen mit Cluster-Boni, Bewässerung/Flüsse als Standortfaktor, Builder als begrenzte Arbeitskraft (3 Charges).

### Zitierte Befunde
- Jeder Citizen verbraucht **2 Nahrung/Runde**. Überschuss → Food Basket → +1 Bevölkerung; Defizit → Basket leert → Bevölkerung sinkt (in Rise and Fall zusätzlich −4 Loyalität/Runde). — [Food (Civ6)](https://civilization.fandom.com/wiki/Food_(Civ6))
- Wachstumsschwelle (Standard-Tempo, pro aktueller Bevölkerung n): Pop 1→15, 2→24, 3→33, 4→44, 5→55, 6→66, 7→77, 8→89, 9→101 Nahrung. Exakte Formel auf der Wiki-Seite nicht publiziert (nur Tabelle). **[Spielerwissen, CivFanatics-abgeleitet]:** `Food(n) ≈ 15 + 8*(n-1) + (n-1)^1.5`. — [Population (Civ6)](https://civilization.fandom.com/wiki/Population_(Civ6))
- Terrain-Basiswerte: Grassland +2, Plains/Tundra/See/Küste/Ozean +1, Wüste/Schnee 0; Features: Wüsten-Überschwemmungsebene +3, Oase +3, Sumpf +1, Regenwald +1. Ressourcen u. a. Weizen/Reis/Fisch +1, Zitrus/Gewürze/Zucker +2. — [Food (Civ6)](https://civilization.fandom.com/wiki/Food_(Civ6))
- **Farm:** +1 Nahrung ab Spielbeginn; Civics/Techs erhöhen später. **Cluster-Boni:** Feudalismus/Replaceable Parts geben Farm-Adjacency; eine Farm kann bis zu **+7 Nahrung** erreichen (umgeben von 6 Farmen). Bewässerungstechnik: Reis/Weizen + Nahrung zusätzlich durch Water Mill (auch unverbessert). Fishing Boats +1 (Plastics +1 extra). — [Food (Civ6)](https://civilization.fandom.com/wiki/Food_(Civ6)); [Farm (Civ6)](https://civilization.fandom.com/wiki/Farm_(Civ6))
- **Housing (Wachstumsbremse):** Housing − Bevölkerung ≥ 2 → 100 % Wachstum; = 1 → 50 %; 0 bis −4 → 25 %; ≤ −5 → 0 % (Hard Cap bei Housing+5). Frischwasser (Fluss/See/Oase) = 5 Housing, Küste = 3, sonst = 2. Aquädukt setzt Wasser-Housing auf 6 bzw. +2 bei Frischwasser (muss an City Center + Berg/Frischwasser angrenzen). Damm (GS) +3, Neighborhood +2 bis +6 je nach Appeal, je +0,5 Housing pro Farm/Weide/Plantage/Camp/Fishing Boats im 3-Kachel-Radius. — [Housing (Civ6)](https://civilization.fandom.com/wiki/Housing_(Civ6))
- **Amenities (Zufriedenheit):** Formel Vanilla: `Amenities = ceil(Pop/2 − 1)`; GS: `ceil(Pop/2)`. Jede einzigartige Luxus-Ressource gibt +1 Amenity an bis zu **4 Städte** (Duplikate nutzlos außer Handel). Stufen von Ecstatic (+10–20 % Ausbeute/Wachstum) bis Revolt (−30 %, Rebelleneinheiten). Entertainment-Komplex/Wasserpark: lokal +1, höhere Gebäude wirken auf Städte im 6-/9-Kachel-Radius. — [Amenities (Civ6)](https://civilization.fandom.com/wiki/Amenities_(Civ6))
- Wachstumsmodifikatoren (Übersicht): Amenities +20 % (≥3 über Bedarf) bis −100 % (≥5 unter Bedarf); Housing wie oben; Hanging Gardens +15 %, „Fertility Rites" +10 %, Magnus (Gouverneur) +20 %; niedrige Loyalität −25/−75/−100 %. — [Population (Civ6)](https://civilization.fandom.com/wiki/Population_(Civ6))
- **Builder (ersetzt Worker):** 3 Build Charges (erhöherbar, z. B. Pyramiden), Aktionen: Verbesserung bauen (1 Charge), reparieren (0), Ressource ernten/Feature entfernen (1 Charge, Sofort-Ertrag), Wald pflanzen (ab Conservation). „Captured Builder" erhöhen die Kosten des nächsten Builders nicht. — [Builder (Civ6)](https://civilization.fandom.com/wiki/Builder_(Civ6))
- Spezialverbesserungen: Liang-Fishery (Nahrung je angrenzendem Fischreichtum), Stepwell (Indien, +1 Nahrung, +1 neben Farm), Terrace Farm (Inka, +Nahrung je Berg) etc.; Bewässerung im Spiel = eher Water Mill/Aquädukt/Flussnähe als ein separates „Irrigation"-System. — [Food (Civ6)](https://civilization.fandom.com/wiki/Food_(Civ6)); [Housing (Civ6)](https://civilization.fandom.com/wiki/Housing_(Civ6))

### Schlussfolgerungen
- Civ 6 trennt sauber drei Kurven: **Nahrung** (fließend, kann negativ werden), **Housing** (weiche bis harte Grenze, kein Bevölkerungsverlust bei Verlust), **Amenities** (Prozentmodifikator + politische Eskalation bis Rebellion). Für NWO-Provinzen als „Bevölkerungswachstum vs. Infrastruktur vs. Unzufriedenheit" übertragbar.
- „Arbeitskraft" ist doppelt begrenzt: Citizens (arbeiten Kacheln, max. 3 Hexes Radius) und Builder-Charges (Baukapazität auf der Karte).

### Lücken
- Exakte Wachstumsformel nur als Tabelle (Wiki) belegbar; die Exponentialformel ist **[Spielerwissen]**.
- Viehzucht/Ranching = „Pasture"-Verbesserung (Food +1 ab Exploration Civic); detaillierte Viehzucht-Ökonomie existiert in Civ 6 nicht — gap für NWO, das hier realistischer sein will.

---

## 3. Ressourcen und Wirtschaft (Typen, Handel, Gold, „keine Inflation")

### Überblick
Civ 6 hat vier Ressourcenklassen (Bonus, Luxus, Strategisch, Artefakte), ein reines **Fluss-Gold-Modell** (Einnahmen − Unterhalt pro Runde, Schatzkammer als Puffer) und Handelsrouten als wichtigsten Wirtschafts- und Infrastrukturhebel (inkl. Straßenbau). **Es gibt keine Inflation, keine Zinsen, keine Kredite, keine Währung** — Preise sind über die gesamte Partie nominal stabil.

### Zitierte Befunde
- Ressourcentypen: **Bonus** (reine Kachel-Erträge, harvestbar), **Luxus** (Amenities, +1 an bis zu 4 Städte; keine Distrikte/Wunder darauf), **Strategisch** (Einheiten/Brennstoff/Power; in Vanilla/R&F: 2 verbesserte Felder = Produktion in jeder Stadt, 1 Feld = nur in Militär-/Hafendistrikt; in GS: **Vorratssystem** — einmalige Kosten beim Start + permanenter Verbrauch als Fuel, ca. 3 Einheiten pro Quelle), **Artefakte** (Archäologie). Alle Ressourcen werden bei Kartengenerierung platziert. — [Resource (Civ6)](https://civilization.fandom.com/wiki/Resource_(Civ6))
- **Gold:** reichsweiter Pool; Schatzkammer + Goldfluss (Einnahmen − Ausgaben) werden zu Rundenbeginn verrechnet, UI oben links. Ausgaben: Unit-Unterhalt, Gebäude-Unterhalt. Einnahmen: Handelsrouten (international stark goldlastig), Gebäude (Markt, Bank), Policy Cards (z. B. „Free Market" +100 % auf Commercial-Hub-Gebäude, „Colonial Taxes" +25 % außer Heimkontinent), Deals mit KI (GPT oder Einmalzahlung). Keine Zins-/Inflationsmechanik. — [Gold (currency) (Civ6)](https://civilization.fandom.com/wiki/Gold_(currency)_(Civ6))
- **Handelsrouten:** Trader-Einheit; Kapazität wächst mit Commercial Hub/Hafen/Markt/Leuchtturm (je +1, nicht stapelbar pro Stadt) und Civics (Foreign Trade gibt die erste). Vorteile gelten immer für die **Herkunftsstadt** (Food/Produktion bei Domestic Routes, Gold/Science bei international; Modifikatoren der Herkunftsstadt zählen). Händler bauen Straßen (1 Feld/Runde, nutzt bestehende Infrastruktur), legen bei Routenende **Trading Posts** in Ziel- und Quellstadt an, die die Reichweite neu setzen (Basis-Reichweite Land: 15 Kacheln, nicht per Tech erweiterbar). Jeder Trading Post +1 Gold/Route. Routen sind ab Runde 1 aktiv, unabhängig davon, ob der Händler schon angekommen ist. — [Trade Route (Civ6)](https://civilization.fandom.com/wiki/Trade_Route_(Civ6))
- Inflation/Konjunktur/Arbeitslosigkeit existieren als Systeme **nicht**; die einzige „Inflation" ist die indirekte: Distrikt- und Einheitenkosten skalieren mit Spielstand (siehe Abschnitt 1), Goldpreise für Käufe ebenfalls **[Spielerwissen]** (Kaufpreise von Einheiten skalieren mit Anzahl gebauter Einheiten und Ära).

### Schlussfolgerungen
- **Lektion für NWO (negativ):** Civ 6 zeigt, dass ein 4X-Spiel ohne Inflation/Zinsen funktioniert — aber genau hier ist NWO ja politisch-ökonomisch ambitionierter. Civ 6 ersetzt Geldpolitik durch (a) unterhaltspflichtige Flotten/Armeen, (b) nominal steigende Baukosten, (c) Gold als Universalbeschleuniger.
- **Lektion (positiv):** Handelsrouten als „Alles-auf-einmal"-Mechanik (Gold + Food + Produktion + Straßen + diplomatische Sichtbarkeit + Reichweiten-Expansion über Trading Posts) sind ein elegantes, gut lesbares Modell — für NWO-Provinzhandel (Autobahn-Korridore, Hafenrouten) sehr übertragbar.

### Lücken
- Keine Quelle zu konkreten Kaufpreis-Formeln (Gold-Kauf) und Unit-Maintenance-Werten — Zahlen wären bei CivFanatics dokumentiert, hier nicht abrufbar.
- Handelsrouten-Ertragstabellen (exakte Goldwerte pro Route/Ära) nur bruchstückhaft erfasst.

---

## 4. Technologie und Zivilisation (Tech-Tree, Eureka/Inspiration, Future Tech)

### Überblick
Zwei Bäume (Technologie via Science, Civics via Culture) mit der Leitinnovation **Eurekas/Inspirations**: kleine Spielziele, die bei Erfüllung sofort 40 % (vanilla 50 %) der Forschungskosten gutschreiben. Bäume sind teils „blattartig" (nicht alles verbunden). Am Ende: Future Tech/Future Civic als beliebig oft wiederholbare Endlosschleife mit Boni.

### Zitierte Befunde
- **Eureka/Inspiration-Mechanik:** Bestimmte Handlungen (z. B. Quarry bauen → Eureka Masonry; Wunder bauen → Inspiration Drama and Poetry) geben **50 % der Kosten (40 % nach Rise and Fall)**; China +10 %, Babylonier: komplette Restkosten bei Eurekas; Ausnahme „Near Future Governance" (GS): 90 %. Kann jederzeit auslösen, solange Tech/Civic nicht fertig ist, und kann Forschung sogar abschließen. UI: **hohler Farbbalken** im Fortschrittsring des Tech-Icons zeigt den möglichen Boost. — [Boost (Civ6)](https://civilization.fandom.com/wiki/Boost_(Civ6))
- Fast alle Techs/Civics haben Boosts; Ausnahmen: die ersten drei Techs (Animal Husbandry, Mining, Pottery) und Code of Laws; Info-/Future-Era-Techs nur über Great Scientists/Spione; Future-Era-Civics nie. Weitere Boost-Quellen: Spionage (Tech stehlen), Research Alliances, tribal villages (Zufall). — [Boost (Civ6)](https://civilization.fandom.com/wiki/Boost_(Civ6))
- **Tech-Tree:** kontinuierliches Prerequisite-System, aber nicht alles ist verbunden (man kann Bereiche „hängen lassen"); „Leaf Techs" ohne Nachfolger (z. B. Celestial Navigation) sind optional. Jede Tech hat Science-Kosten, die pro Runde mit der gesamten Science-Ausbeute des Reiches abbezahlt werden. — [Technology (Civ6)](https://civilization.fandom.com/wiki/Technology_(Civ6)); [Science (Civ6)](https://civilization.fandom.com/wiki/Science_(Civ6))
- Science-Quellen: **0,5 Science pro Citizen** (seit Feb-2018-Update), Campus-District inkl. Adjacency, Gebäude (Bibliothek/Universität), Spezialisten (+2), Scientific City-States (bis +4/+6 pro Campus je nach Envoys). — [Science (Civ6)](https://civilization.fandom.com/wiki/Science_(Civ6))
- **Future Tech** (Information Era, 2500 Science; GS 2600; Voraussetzungen Robotics, Nuclear Fusion, Nanotechnology): beliebig oft erforschbar, +Score-Siegpunkte; GS: zusätzlich **+5 % Produktion für City Projects** pro Abschluss. **Future Civic** (3200 Culture; GS 3500): +Score; R&F: +1 Gouverneur-Titel; GS: +50 Diplomatic Favor. — [Future Tech (Civ6)](https://civilization.fandom.com/wiki/Future_Tech_(Civ6)); [Future Civic (Civ6)](https://civilization.fandom.com/wiki/Future_Civic_(Civ6))

### Schlussfolgerungen
- Eurekas/Inspirations sind das beste Civ-6-Designmuster für NWO: **„Lern-Boni durch Handlung"** — Forschung/Reformen beschleunigen sich, wenn der Spieler das Richtige tut (z. B. „Autobahn bauen → Eureka Verkehrsplanung"), statt nur passiv Punkte zu sammeln. Der hohle UI-Balken macht den Verlust durch „zu spätes Umschalten" sichtbar.
- Future Tech als Endlosschleife mit winzigen Bonus-Stacks ist ein einfaches Mittel, ein Spiel ohne hartes Ende „weiterspielen" zu lassen.

### Lücken
- Exakte Science-Kostenkurve pro Tech über die Ären hinweg (Skalierung nach Anzahl der Zivilisationen/Tempo) nicht erfasst.
- Vollständige Eureka-Liste (hunderte Einträge) nicht kopiert; die Mechanik reicht für NWO-Zwecke, Detailbeispiele auf [List of boosts in Civ6](https://civilization.fandom.com/wiki/List_of_boosts_in_Civ6) verlinkt.

---

## 5. Infrastruktur und Raum (Distrikte, Adjacency, Straßen, Stadtplanung)

### Überblick
Das Kern-Civ-6-Neuerung: **Specialty Districts** verlagern Stadtbestandteile auf eigene Kacheln der Karte — Campus, Industriezone, Hafen etc. sind physisch platziert, konkurrieren um Land mit Wundern/Farmen und bekommen **Adjacency-Boni** aus der Umgebung. Platzierung ist dauerhaft (kein Rückbau) und damit eine der wichtigsten strategischen Entscheidungen im Spiel.

### Zitierte Befunde
- Specialty Districts: visuelle Manifestation von Stadtteilen; Gebäude (Bibliothek, Uni) „wohnen" im District; Einheiten entstehen im passenden District (Marine im Hafen auch bei Binnenstadt). Districts sind fest mit der Stadt verbunden, nicht umziehbar, nur mit Stadtzerstörung weg. — [District (Civ6)](https://civilization.fandom.com/wiki/District_(Civ6))
- **Bevölkerungslimit:** 1 Specialty District ab Start, jeder weitere District braucht +3 Citizens (zwei ab Pop 4, drei ab Pop 7 …). Pro Stadt max. **ein** District je Typ. Ingenieur-Distrikte (Aquädukt, Damm, Kanal), Neighborhood, Spaceport zählen nicht zum Limit. — [District (Civ6)](https://civilization.fandom.com/wiki/District_(Civ6))
- **Platzierungsregeln:** Hafen nur auf Coast an Land; Aerodrom/Spaceport nur Flachland; Encampment/Preserve nicht neben City Center; Aquädukt muss an City Center **und** Fluss/See/Oase/Berg angrenzen; Damm (GS) auf Überschwemmungsebene desselben Flusses; Kanal verbindet Gewässer; keine Distrikte neben fremden City Centern. Native Kachel-Erträge werden ersetzt; in GS verfallen Katastrophen-Boni auf District-Kacheln. Versteckte strategische Ressourcen blockieren die Platzierung nicht. — [District (Civ6)](https://civilization.fandom.com/wiki/District_(Civ6))
- **Adjacency:** Distrikte erzeugen Yield-Boni aus Nachbarschaft (z. B. Campus an Bergen/Regenwald; Industriezone an Minen/Steinbrüchen); auch Wunder und Verbesserungen zählen. Die Platzierungs-Lens zeigt erlaubte Kacheln und Yield-Icons. — [District (Civ6)](https://civilization.fandom.com/wiki/District_(Civ6))
- **Gebäude-Tiers:** je District 3 Tiers; Tier 3 (GS) braucht **Power** und verstärkt Spezialisten-Erträge; Fabrik/Kraftwerk und fortgeschrittene Entertainment-Gebäude wirken regional (6 Kacheln; Water Park 9). — [District (Civ6)](https://civilization.fandom.com/wiki/District_(Civ6)); [Amenities (Civ6)](https://civilization.fandom.com/wiki/Amenities_(Civ6))
- **Unique Districts** (z. B. Hansa, Acropolis, Bath) kosten halb so viel, oft stärkere Adjacency; bei Stadteroberung durch Fremde in generisches Äquivalent ersetzt. — [District (Civ6)](https://civilization.fandom.com/wiki/District_(Civ6))
- **Straßen/Verbindungen:** Händler bauen/upgraden automatisch Straßen entlang ihrer Routen (Tempo 1 Kachel/Runde, Spiel nutzt vorhandene Infrastruktur, Pfad ist **nicht** wählbar); Militäringenieure bauen gezielt Straßen (und in GS: Railroads, Mountain Tunnels); Kanäle und Dämme als Ingenieur-Distrikte (in GS per Militäringenieur beschleunigbar). — [Trade Route (Civ6)](https://civilization.fandom.com/wiki/Trade_Route_(Civ6)); [District (Civ6)](https://civilization.fandom.com/wiki/District_(Civ6))
- Wunder konkurrieren um dieselben Kacheln; Unique-Improvements (Polder, Terrace Farm, Stepwell, Outback Station) verändern Regionen (Food/Housing/Adjacency). — [Wonder (Civ6)](https://civilization.fandom.com/wiki/Wonder_(Civ6)); [Food (Civ6)](https://civilization.fandom.com/wiki/Food_(Civ6))

### Schlussfolgerungen
- Distrikt-Logik = **„Infrastruktur als Kartenobjekt"**: Sichtbarkeit, Standortwahl, Adjacency-Puzzle, Unumkehrbarkeit. Für NWO-Provinzen ideal: Industriezone/Logistikzentrum/Hafen/Universität als platzierbare Provinz-Bauprojekte mit Nachbarschaftsboni (z. B. Hafen + Autobahn-Kreuz = +X Handel).
- Die Kombination aus Pop-Limit, Kosten-Skalierung und Ein-Distrikt-pro-Stadt verhindert „Alles-Bauen"-Dominanz — ein Pattern gegen Min-Maxing.

### Lücken
- Adjacency-Werte je District-Typ (konkrete +1/+2/+3-Regeln) nicht im Detail kopiert; eigene Übersichtsseite [Adjacency bonus (Civ6)](https://civilization.fandom.com/wiki/Adjacency_bonus_(Civ6)) existiert.
- Straßen-Level (Ancient Road → Rail Road) und Bewegungsboni nicht ausgeschrieben.

---

## 6. Umwelt und Katastrophen (Gathering Storm: Vulkan, Flut, Klima, Dämme)

### Überblick
Gathering Storm führt ein globales **Klimasystem** ein: Spieler verursachen CO₂-Emissionen (v. a. durch Power/Industrie, zusätzlich Abholzung), die Temperatur steigt phasenweise, Meeresspiegel steigt, Küstenflachland wird geflutet/versunken. Lokale **Katastrophen** (Vulkane, Fluten, Dürren, Stürme, Waldbrände) schaden, „befruchten" aber auch Böden (Fertilization) — Klimapolitik wird dadurch zum echten Spielthema.

### Zitierte Befunde
- **Katastrophentypen (GS):** Vulkanausbrüche, Flüsse-Hochwasser, Dürren, Stürme (Blizzard, Sandsturm, Hurrikan), Waldbrände (Maya & Gran Colombia Pack; breiten sich auf Nachbarkacheln aus); im Apocalypse-Game-Mode zusätzlich Solar Flares (zerstören Kraftwerke/Campuses reichsweit) und Kometeneinschläge (zerstören alles inkl. Städte/Wunder). Katastrophen sind **lokal** (Gruppe von Kacheln), oft an Fluss/Vulkan/Terrain gekoppelt, dauern bei Sturm/Dürre mehrere Runden, haben **Schweregrade** (Skala „Minimal" bis „Apocalypse", einstellbare Disaster Intensity 0–4). — [Disaster (Civ6)](https://civilization.fandom.com/wiki/Disaster_(Civ6))
- **Fertilization:** Überschwemmungen, Vulkanausbrüche und Stürme können Terrain-Boni geben (u. a. +Food/+Produktion); ab Klimaphase IV geben Sturm/Flut keine Fruchtbarkeit mehr, ab Phase V beginnt **Desertifikation** (Stürme/Dürren nehmen frühere Boni wieder weg). — [Disaster (Civ6)](https://civilization.fandom.com/wiki/Disaster_(Civ6)); [Climate (Civ6)](https://civilization.fandom.com/wiki/Climate_(Civ6)); [Production (Civ6)](https://civilization.fandom.com/wiki/Production_(Civ6))
- **Klima-Mechanik:** CO₂ wird **global und kumulativ** getrackt, jeder Spieler zahlt pro Runde dazu („kann Beiträge begrenzen, aber nicht zurücknehmen" — außer Projekt „Carbon Recapture"); CO₂-Quellen v. a. Power-Generierung (Kohle/Öl/Uran) + globale Entwaldung (entfernte Woods/Rainforest/Marsh). 7 Klimaphasen; jeder „Climate Change Point" = +0,5 °C; Kartengröße bestimmt CO₂-Menge pro Punkt. — [Climate (Civ6)](https://civilization.fandom.com/wiki/Climate_(Civ6))
- **Meeresspiegel:** Polareis schmilzt (Ice → Ocean); jedes Küsten-Flachland-Feld hat Rating 1–3 (1 = wird zuerst geflutet); in Wellen werden Felder geflutet bzw. **dauerhaft versunken**; Tempo hängt von globalen Emissionen ab. Gegenmittel: **Flood Barriers** (spätes Projekt), **Dämme** (schützen Flusstäler, +3 Housing). — [Climate (Civ6)](https://civilization.fandom.com/wiki/Climate_(Civ6)); [Housing (Civ6)](https://civilization.fandom.com/wiki/Housing_(Civ6))
- Kanäle verbinden Gewässer (Strategie für Seewege), Aquädukte sichern Wasserversorgung; Coal Power Plant (GS) gibt Produktion nur noch an die eigene Stadt (Regionalbonus gestrichen als Klima-Trade-off). — [District (Civ6)](https://civilization.fandom.com/wiki/District_(Civ6))
- Diplomatischer Anschluss: Nach schweren Katastrophen können **Aid Requests** im Weltkongress einberufen werden (Hilfswettbewerbe mit Diplomatie-Punkten). — [World Congress (Civ6)](https://civilization.fandom.com/wiki/World_Congress_(Civ6))

### Schlussfolgerungen
- Das Civ-6-Klimasystem ist die beste Blaupause für NWOs Katastrophensystem: **globaler Verursacherbeitrag + lokale Schäden + politische Eskalation** (Weltkongress-Hilfe, Migration, Versorgung). Übertragbar auf Türkei: Erdbeben (lokale Zerstörung + Baukodex-Politik), Dürre/Waldbrände (CO₂/Abholzung), Überschwemmung (Dämme als Großprojekt).
- Der „Fertilization"-Trade-off (Katastrophe = Chance) verhindert reines Punitiv-Design und erzeugt Wiederaufbau-Loops.

### Lücken
- Exakte Zahlen der Katastrophentabellen (Schaden pro Schweregrad, Turnus pro Phase) nur bruchstückhaft; die Wiki-Seiten haben vollständige Tabellen.
- Konkrete CO₂-Werte je Brennstoff (Wiki: Kohle ~3,28 Einheit/Ressource laut Climate-Screen-Anzeige) — Feinheiten ungeprüft.

---

## 7. Krieg und Diplomatie (kurz: Belagerung, Grievances, Weltkongress)

### Überblick
Civ 6 (GS) ersetzt das alte „Warmongering"-System durch ein bilaterales **Grievance-Konto** (Koordinatensystem zwischen je zwei Reichen) und einen **Weltkongress** mit Resolutionen, Wettbewerben und Diplomatic-Victory-Punkten. Stadtbelagerung/Eroberung ist der übliche Civ-1-Unit-Per-Tile-Krieg, hier nur kurz.

### Zitierte Befunde
- **Grievances:** Score zwischen zwei Zivilisationen auf einer Neutral-Achse; jede Aggression/Aktion schiebt den Score; ohne Krieg „natural decay" zurück zu 0. Basis-Decay: `10 − x` pro Runde (x = Ären nach Antike; Antike 10/Runde, Renaissance 7/Runde, Future Era 2/Runde) — spätere Ären erinnern länger. Casus Belli reduziert kriegsbezogene Grievances. Hohe Grievances senken **Diplomatic Favor** pro Runde; Effekt auf andere KIs tritt oft erst nach Friedensschluss ein. — [Grievances (Civ6)](https://civilization.fandom.com/wiki/Grievances_(Civ6))
- **Weltkongress (GS):** Session nach KI-Runden, vor Spieler-Runde (Spieler kann Panel schließen, aber nichts befehlen). Jede Regular Session: 2 Resolutionen (era-bezogen, wahrscheinlichkeitsgesteuert durch Weltgeschehen, z. B. Climate Accords häufiger bei Klimafortschritt); Beschlüsse gelten bis zur nächsten Session (30 Runden Standard). Scored Competitions (meist 30 Runden; Aid Request/Military Aid Request als Reaktion auf Katastrophen/Bullying). Special Sessions min. 15 Runden Abstand. Diplomatic Victory über gesammelte Punkte. — [World Congress (Civ6)](https://civilization.fandom.com/wiki/World_Congress_(Civ6))
- **Eroberung:** Bei Stadteroberung schrumpft Bevölkerung um ca. 25 %; mehrfacher Handwechsel kann Städte auf Pop 1 reduzieren. Unique Districts werden ersetzt/entfernt. — [Population (Civ6)](https://civilization.fandom.com/wiki/Population_(Civ6)); [District (Civ6)](https://civilization.fandom.com/wiki/District_(Civ6))
- **Loyalty (R&F):** Bevölkerungsverlust bei Hungersnot senkt Loyalität (−4/Runde); niedrige Loyalität bremst Wachstum (−25 % bis −100 %) — Druckmittel ohne Krieg. — [Food (Civ6)](https://civilization.fandom.com/wiki/Food_(Civ6)); [Population (Civ6)](https://civilization.fandom.com/wiki/Population_(Civ6))

### Schlussfolgerungen
- Grievance-Konto statt globaler „Warmonger"-Reputation ist präziser und für NWOs Politiknetz (bilaterale Beziehungen Türkei ↔ Akteure) gut adaptierbar.
- Weltkongress-Resolutionen als „zeitlich befristete Regeländerungen" (30 Runden) sind ein starkes Muster für internationale Abkommen/Embargos in NWO.

### Lücken
- Stadtbelagerungs-Mechanik (Districts vs. Walls, HP, Siege-Progress) nicht recherchiert (Scope „kurz"); siehe [City combat (Civ6)](https://civilization.fandom.com/wiki/City_combat_(Civ6)).
- Casus-Belli-Typen und exakte Grievance-Punktwerte nicht ausgeschrieben (Wiki-Tabelle auf Grievances-Seite vorhanden).

---

## 8. UI und Präsentation (Lens-System, Panels, Popups, Kritik)

### Überblick
Civ 6s UI-Leitidee: **die Karte selbst ist das Interface** — Distrikte, Wunder, Verbesserungen sind sichtbare Artefakte; farbige **Lenses** legen Informationsebenen über die Karte; Details stecken in City-Details-Panel mit Aufschlüsselungen (Citizen Growth, Housing-Quellen). Gelobt wird die Lesbarkeit der Karte und die Eingängigkeit von Eureka-Feedback; kritisiert werden Kunststil (Einheiten) und Lernkurve der Distriktplatzierung.

### Zitierte Befunde
- **Lens-System:** 11 Lenses, 10 manuell über Button neben der Minimap (nur einer gleichzeitig aktiv), 1 automatisch: **District/Wonder-Placement-Lens** zeigt Territorium, gültige Kacheln, Yield-Icons und (per Mouseover) die Adjacency-Herkunft. Appeal-Lens: Farbcode dunkelgrün (Breathtaking ≥4) bis rot (Disgusting ≤−4); weitere: Continent, Settler (Frischwasser dunkelgrün), Religious, Tourism etc. — [Lens (Civ6)](https://civilization.fandom.com/wiki/Lens_(Civ6)); [District (Civ6)](https://civilization.fandom.com/wiki/District_(Civ6)); [Housing (Civ6)](https://civilization.fandom.com/wiki/Housing_(Civ6))
- **Fortschritts-Balken:** Eureka/Inspiration als hohler Balken im Tech/Civic-Ring (zeigt „Boost steht bevor"); Food Basket und Wachstums-/Verlust-Runden in City Details „Citizen Growth"; Housing-Quellen-Aufschlüsselung im „Housing"-Abschnitt; Goldfluss + Schatzkammer oben links; Trade-Kapazität im Stats-Ribbon oben links. — [Boost (Civ6)](https://civilization.fandom.com/wiki/Boost_(Civ6)); [Population (Civ6)](https://civilization.fandom.com/wiki/Population_(Civ6)); [Housing (Civ6)](https://civilization.fandom.com/wiki/Housing_(Civ6)); [Gold (currency) (Civ6)](https://civilization.fandom.com/wiki/Gold_(currency)_(Civ6)); [Trade Route (Civ6)](https://civilization.fandom.com/wiki/Trade_Route_(Civ6))
- **Gelobt (PC Gamer):** Die Karte wirke „lebendiger als je zuvor"; man brauche „wirklich nie ein Overlay, um zu sehen, welche Kacheln bewirtschaftet werden" (lesbare Standardansicht); Terrain/Kacheln stünden „im Herzen von fast allem" in Civ 6; Distrikte/Wunder auf Kacheln machten Stadtplanung zur Kernaktivität; Eureka-Minziele als „halbe Kosten sofort" seien einprägsam. — [PC Gamer Review](https://www.pcgamer.com/civilization-6-review/)
- **Kritisiert (PC Gamer):** Kunststil-Reservationen (militärische Einheiten „goofy", „freemium mobile"-Anmutung); **Trial-and-Error-Frustation** bei der Distrikt-/Wunderplatzierung (falsche Kachel gewählt, Nationalpark-Zonen spät erst planbar). — [PC Gamer Review](https://www.pcgamer.com/civilization-6-review/)
- **„Zu viele Popups":** Diese spezifische Kritik ließ sich in den geprüften Quellen **nicht belegen** (siehe Lücken). Belegt ist dagegen das bekannte Problem der **Notification-/Turn-End-Last** („Next Turn"-Fluss) nicht durch meine Quellen.

### Schlussfolgerungen
- Das Lens-System ist 1:1 als **Karten-Layer-System** für NWO übertragbar (politisch/wirtschaftlich/Bevölkerung/Katastrophen-Risiko als überlagerte Farblinsen; Automatik-Lens beim Platzieren von Großprojekten).
- Die Kombination „Karte zeigt alles + Tooltip zeigt Formel + Panel zeigt Aufschlüsselung" ist die richtige Balance für komplexe Simulation; der hohle Eureka-Balken ist ein Muster für „Belohnung für gute Planung sichtbar machen".

### Lücken
- Keine belastbare Quelle zu Steam-Review-Sentiment („zu viele Popups", Spätspiel-Mikromanagement, UI-Mods wie „Sukritact's UI") — Steam/Reddit in dieser Recherche nicht erreichbar. **[Spielerwissen, unbelegt]:** In der Community werden oft (a) die fehlende Produktions-Queue-Ansicht über alle Städte, (b) Popup-Flut bei Forschungsabschlüssen/Gouverneuren und (c) der Zwang zu UI-Mods kritisiert; dem gegenüber ist der „Next Turn"-Flow selbst gelobt.
- Leader-Screens (animierte 3D-Hintergründe, diplomatische Dialoge) und Strategic View (Vereinfachte Kartenansicht) mechanisch nicht erfasst; Wiki-Seiten existieren, hier nicht abgerufen.
- Deutsche Fachpresse (GameStar/PC Games) nicht geprüft.

---

## 9. Übernahme für NWO (Konkrete Transferliste)

### Überblick
Civ 6 liefert für „Staatsräson" fünf starke Bausteine (Produktions-Queue, Distrikt/Adjacency-Logik, Eureka-Lernboni, Housing/Amenities als Wachstumsgrenzen, Klima/Katastrophen + Lens-System) und drei bewusst nicht übertragbare Systeme (Rundenkrieg mit 1-UPt, Builder-Charges als Mikromanagement, Sieg-Bedingungen als Zielscheiben).

### Zitierte Befunde (Belege siehe Abschnitte 1–8)
- Produktions-Queue + Baukosten-Skalierung + Rabattlogik + 50 %-Konsolationspreis bei Wundern — [Production (Civ6)](https://civilization.fandom.com/wiki/Production_(Civ6)); [District (Civ6)](https://civilization.fandom.com/wiki/District_(Civ6)); [Wonder (Civ6)](https://civilization.fandom.com/wiki/Wonder_(Civ6))
- Nahrung/Housing/Amenities-Dreiklang als Wachstumssteuerung — [Food (Civ6)](https://civilization.fandom.com/wiki/Food_(Civ6)); [Housing (Civ6)](https://civilization.fandom.com/wiki/Housing_(Civ6)); [Amenities (Civ6)](https://civilization.fandom.com/wiki/Amenities_(Civ6))
- Eureka/Inspiration = 40 % der Kosten durch Handlung — [Boost (Civ6)](https://civilization.fandom.com/wiki/Boost_(Civ6))
- Distrikte mit Adjacency + Unumkehrbarkeit + Pop-Limit — [District (Civ6)](https://civilization.fandom.com/wiki/District_(Civ6))
- Klima/Katastrophen mit globaler Verursachung, lokalen Schäden, Fertilization und Aid Requests — [Climate (Civ6)](https://civilization.fandom.com/wiki/Climate_(Civ6)); [Disaster (Civ6)](https://civilization.fandom.com/wiki/Disaster_(Civ6)); [World Congress (Civ6)](https://civilization.fandom.com/wiki/World_Congress_(Civ6))
- Lens-System für Karten-Ebenen + Automatik-Lens bei Projektplatzierung — [Lens (Civ6)](https://civilization.fandom.com/wiki/Lens_(Civ6))
- Grievance-Konto bilateral + Resolutionen mit 30-Runden-Laufzeit — [Grievances (Civ6)](https://civilization.fandom.com/wiki/Grievances_(Civ6)); [World Congress (Civ6)](https://civilization.fandom.com/wiki/World_Congress_(Civ6))

### Schlussfolgerungen (Transferliste)
**Übernehmen:**
1. **Bauprojekt-System = Produktions-Queue:** Provinz-Baukapazität („Produktion") aus Bevölkerung + Industrie + Infrastruktur; Queue pro Provinz; Overflow-Bewusstsein (nicht exploitbar machen — Civ-6-Fix Feb 2019 als Warnung); Gold-Kauf als Zweitwährung („Sofortbau").
2. **Großprojekte wie Wunder:** exklusiv (weltweit/pro Land), lange Bauzeiten, Konkurrenz um Standort, 50 %-Rückerstattung bei Scheitern, Standortbedingungen (Küste für Riesenhafen, Autobahn-Knoten, Erdbebenrisiko).
3. **Distrikt-Logik für Provinzen/Bezirke:** Infrastruktur als platzierbares Kartenobjekt mit Adjacency-Boni (Hafen neben Logistikpark, Uni neben Technologiepark), Unumkehrbarkeit als Commitment, Pop-/Größenlimit gegen „alles bauen".
4. **Eureka/Inspiration als Lern-Boni:** Politische/technologische Sprünge durch Handlung des Spielers („Bauprojekt X abschließen → +40 % Fortschritt in Politiknetz-Knoten Y"); hohler UI-Balken zur Vorhersage.
5. **Nahrung/Housing/Amenities-Grenzen auf Provinzebene:** Bevölkerungswachstum gegen Infrastruktur-Kapazität (Wohnraum ≈ Housing) und Zufriedenheit (≈ Amenities/Lira-Kaufkraft); Stufenmodell (100/50/25/0 %) statt harter Sperre.
6. **Klima-/Katastrophensystem:** globale Emissionen/Entscheidungen (Kohlekraft, Bauvorschriften) + lokale Erdbeben/Dürre/Flut inkl. „Fertilization"-Trade-off und internationaler Hilfsanfragen (→ Politiknetz-Events).
7. **Lens-System:** Karten-Ebenen (politisch, wirtschaftlich, Bevölkerung, Risiko, Verkehrsnetz) + automatische Platzierungs-Lens für Großprojekte.
8. **Handelsrouten-Muster:** eine Route liefert Gold + Waren + Infrastruktur (Straßen/Autobahnen) + Reichweiten-Expansion (Trading Posts ≈ Logistikhub-Projekte).

**Nicht übernehmen (bzw. stark abwandeln):**
1. **Runden-System + 1-Unit-per-Tile-Taktik:** passt nicht zu einem politischen Echtzeit- oder kontinuierlichen Turn-Modell; Civ-6-Kriegs-Mikromanagement ist für NWO zu spiel-lastig.
2. **Builder-Charges:** als „Bauarbeiter mit 3 Einsätzen" zu spielerisch; für NWO eher Budget/Bauzeit/Verzögerungen (Bauprojekt-Risiko) statt Chargenökonomie.
3. **Siege-Bedingungen als Zielmarken** (Science/Culture/Domination Victory): NWO will offene politische Simulation — nur interne Kennzahlen (Wiederwahl, Wirtschaftsstabilität), keine Sieg-Screens.
4. **Fehlende Geldpolitik:** Civ 6 hat keine Inflation/Zinsen — genau hier muss NWO eigenes Modell bauen (Inflation, Zinsen, Lira); Civ-6-Gold ist nur Inspiration für die UI (Schatzkammer/Fluss-Anzeige), nicht für die Makroökonomie.
5. **Religions-/Gouverneurs-/Great-People-Systeme** nur als lose Inspirationsquellen (Governor-Titel ≈ Ministerposten mit lokalen Boni wären adaptierbar, aber nicht 1:1).

### Lücken
- GDC-Talks/Soren Johnson zu Civ-Design und YouTube-Mechanik-Guides wurden nicht ausgewertet (Zeit-/Quellenlimit); für Design-Intent-Ebene empfehlenswert.
- UI-Kritik aus Steam/Reddit („zu viele Popups") unbelegt (siehe Abschnitt 8).
