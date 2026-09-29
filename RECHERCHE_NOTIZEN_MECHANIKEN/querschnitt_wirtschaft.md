# Querschnitt Wirtschafts-, Industrie- und Landwirtschaftsmechaniken in Strategie-/Aufbauspielen

**Zweck:** Mechanik-Bestandssammlung als Quelle für „Staatsräson" (NWO) — Politikstrategiespiel Türkei, 81 Provinzen, Präsidentenrolle, bestehendes Wirtschaftsmodell (Inflation, Zins, Lira, Haushalt), Großprojekte. Zielvertiefung: Industrie, Landwirtschaft (inkl. High-Tech-Maschinen-Investition), Ressourcen, Subventionen, Kriegswirtschaft.
**Stand:** 29.09.2026 (Recherchestand). Notizen auf Deutsch, Quellenangaben englischsprachig wo Original.
**Quellenlage (wichtig):** Paradox-Wikis (vic3/hoi4.paradoxwikis.com) und Fandom-Wikis sind live per JS-Challenge/403 gesperrt; beschafft über **Wayback-Machine-Rohsnapshots** (Vic3-Stand überwiegend 08–09/2025, HOI4-Gesetze 2021, Anno-Fandom 2019–2025). Steam-Store/-Guides live abrufbar. Suchmaschinen waren größtenteils blockiert (DDG/Bing/Mojeek). YouTube-GDC-Talks, GameStar-Volltexte und Reddit-Diskussionen nicht abrufbar — wo nötig als Lücke markiert. **[S]** = Spielerwissen/Wiki-Basiswissen ohne direkt abrufbare Quelle in dieser Recherche. Zahlen/Formeln nur wo dokumentiert.

---

## 1. Victoria 3 (Paradox) — die detaillierteste volkswirtschaftliche Referenz

### 1.1 Buildings, Beschäftigung, Eigentum
- Buildings sind die ökonomische Basis; sie beschäftigen Pops im jeweiligen State, produzieren Güter (teils andere Effekte: Prestige, Bürokratie, Militäreinheiten). Jede Building-Stufe hat einen Eigentümer: Regierung, Beschäftigte, Company oder Upper-Strata-Pops. — [Building](https://vic3.paradoxwikis.com/Building)
- Alle Stufen einer Building im selben State nutzen denselben Production Method; Buildings im Land können unterschiedliche PMs haben; Umschaltung landesweit im Building-Tab möglich. — [Production method](https://vic3.paradoxwikis.com/Production_method)

### 1.2 Construction Queue / nationale Bauprojekte
- Bausystem: Jedes Land hat Basis +10 Konstruktionspunkte, „construction sector"-Gebäude liefern mehr; Herrscher-Trait „engineer" +5. Jedes Bauprojekt läuft über eine **Construction Queue**, geteilt in **staatliche Queue (Haushalt)** und **private Queue (Investment Pool)**; Aufteilung nach „Economic System"-Law. Ungenutzte Punkte der einen Queue fließen automatisch in die andere. — [Building](https://vic3.paradoxwikis.com/Building)
- Baukosten: reguläre Buildings 100–800 Konstruktionspunkte, Unique Buildings 2500, Kanäle 5000. Wöchentliche Fortschrittsbegrenzung („max weekly construction progress"), per Technologie steigerbar. Government-Queue jederzeit umsortierbar/pausierbar; Abbruch verwirft Fortschritt ohne Ersatz. — [Building](https://vic3.paradoxwikis.com/Building)
- Kosten: Löhne + Material der Construction Sectors (im Budget als „Construction Goods" und „Government Wages"); private Konstruktion zahlt Güter aus dem Investment Pool, Löhne immer aus dem Haushalt. **Überschüssige Baukapazität wird wöchentlich vergeudet, Löhne fallen trotzdem an** — Leerverbrauch als Designfalle. — [Building](https://vic3.paradoxwikis.com/Building)
- **Construction efficiency** (Bau-Punkte-Multiplikator pro State): lokal durch construction sectors (höhere PMs = mehr Effizienz), Dekret „Road Maintenance" +10%, Überschuss-Bürokratie bis +10%, State Traits (Berge, Wüsten negativ), nicht eingegliederte States −20% (Schwerindustrie −50%), Unruhe, Verwüstung, Bankrott −75%; Untergrenze 5%. — [Building](https://vic3.paradoxwikis.com/Building)

### 1.3 Production Methods (Kernreferenz für „High-Tech-Maschinen-Stufen")
- PMs definieren Input/Output-Güter, Kapazität, Effekte und Berufsstruktur einer Building. Viele PMs sind technikgestufte Produktionsweisen, andere Alternativproduktion (Luxus vs. Grundgüter) oder Organisation. — [Production method](https://vic3.paradoxwikis.com/Production_method)
- **PM-Gruppen mit Icon-Farben** (eine aktive PM pro Gruppe): Base (braun, Haupt-Input/Output, Basis-Belegschaft, höhere PMs brauchen bessere Bildung), Secondary (violett, Nebenoutput gegen weniger Hauptoutput), **Automation (grün: weniger unqualifizierte Arbeitskraft gegen mehr Inputgüter)**, Organisation (blau), Militär (rot). — [Production method](https://vic3.paradoxwikis.com/Production_method)
- Freischaltung: Technologie, Laws, teils andere PMs oder Güterverfügbarkeit im State/Markt. Entfallen die Voraussetzungen, schaltet die Building automatisch auf die erste gültige PM der Gruppe um. — [Production method](https://vic3.paradoxwikis.com/Production_method)
- Effekt-Skalierung: level-scaled (z. B. Arbeiterzahl pro Stufe), workforce-scaled (Input/Output, skaliert mit Beschäftigung + Throughput), unscaled (z. B. Eigentumsanteile). — [Production method](https://vic3.paradoxwikis.com/Production_method)
- **Beispielkette Landwirtschaft (Getreidefarmen)** PM-Leiter: „Simple Farming" → „Soil-Enriching Farming" (Intensive Agriculture) → „Fertilizers" (Improved Fertilizer, +5% Drought Impact) → „Chemical Fertilizers" (Nitrogen Fixation, +10% Drought Impact). Reihenfolge der Stufen steigt Input/Output/Personal (Rohzahlen in Tabellen: z. B. Weizenfarmen +4000/+1000 bei Simple Farming bis +2500/+2500 bei Chemical Fertilizers; Reisfarmen in höheren Dimensionen). — [List of production methods](https://vic3.paradoxwikis.com/List_of_production_methods) *(Tabellenzellen ohne Spaltenköpfe extrahiert, Einheiten siehe Wiki — Zuordnung [S])*
- **Viehzucht:** „Open Air Stockyards" → „Butchering Tools" → „Slaughterhouses" → „Mechanized Slaughterhouses"/„Mechanized Farming" (letztere mit +10–15 Generated Pollution). — [List of production methods](https://vic3.paradoxwikis.com/List_of_production_methods)
- **Pollution** als Koppelung von Industrie/Landwirtschaft an Bevölkerung: Zielwert = Gesamtpollution / (50 + 1,5·√(Ackerland)) · (1/255); je 1% Pollution Impact: −0,25% Migrationsattraktion, +0,5% Naturkatastrophen-Impact, −0,03 Lebensstandard, +0,5% Mortalität; reduzierbar durch Health-System-Institution und „Modern Sewerage". Schwerindustrie verschmutzt am meisten, Landwirtschaft am wenigsten. — [Production method](https://vic3.paradoxwikis.com/Production_method)

### 1.4 Märkte, Preise, Handel
- Jedes Land gehört zu einem Markt (eigener Markt oder Zollunion); Preis je Gut ergibt sich aus Buy-/Sell-Orders des Marktes. — [Market](https://vic3.paradoxwikis.com/Market)
- **Preisformel (dokumentiert):** `price = Base Price · [1 + 0,75 · clamp((BUY−SELL)/min(BUY,SELL), ±1)]` → Preis schwankt zwischen **25% und 175% des Basispreises**. Beispiel: Holz Basispreis 20, 100 Buy vs. 120 Sell Orders → Preis 17 (−15%). — [Market](https://vic3.paradoxwikis.com/Market)
- Buy- und Sell-Orders werden voll bezahlt/erlöst; Differenz wird von der Simulation erzeugt/vernichtet (bei Überschuss entsteht Wert, bei Knappheit verschwindet Wert). — [Market](https://vic3.paradoxwikis.com/Market)
- **Market Access** (0–100%) je State: Infrastruktur vs. Infrastruktur-Usage; Übersee-States brauchen Ports/Convoys; isolierte States 0%. Market Access beeinflusst zusätzlich die **MAPI (Market Access Price Impact)** auf Lokalpreise. — [Market](https://vic3.paradoxwikis.com/Market)
- Lokalpreise, Oversupply/Undersupply, Shortages, Supply Network und Convoys als Untermodule. — [Market](https://vic3.paradoxwikis.com/Market)

### 1.5 Subventionen, Haushalt, Investment Pool
- Budgetposten (Treasury-Seite): „**Subsidies** – The cost of subsidizing specific buildings to ensure they remain competitive" und „**Welfare Payments** – subsidies paid to pops with wages below the threshold defined by the Social Security institution". Subventionen sind damit **gezielte Building-Stützung**, nicht pauschale Sektorhilfe. — [Treasury](https://vic3.paradoxwikis.com/Treasury) (via [Investment pool](https://vic3.paradoxwikis.com/Investment_pool))
- Goldreserve: Soft-Cap bei **20% des jährlichen BIP**, darüber abnehmende Erträge je Überschuss-Pfund. — [Treasury](https://vic3.paradoxwikis.com/Investment_pool)
- **Investment Pool:** Einzahlungen aus Dividenden bestimmter Eigentümer-Pops (Capitalists, Aristocrats, Farmers, Clergymen, Shopkeepers) mit prozentualen Contribution-Sätzen; Verwendung für private Bauqueue oder Privatisierung staatlicher Buildings. „Command Economy" konfisziert den Pool als Einmalzahlung. Effizienz-Booster: Interest-Group-Traits (Industrialists/Landowners), Technologie „Postal Savings" +15% (Farmers/Shopkeepers); unter £50M BIP skaliert Contribution-Effizienz bis ×3. Dividendensteuern beeinflussen den Pool nicht (Abzug vor Steuern). — [Treasury](https://vic3.paradoxwikis.com/Investment_pool)

**WV-Dichte-Urteil:** Vic3 ist das detaillierteste Markt-/Beschäftigungs-/Technikstufen-System der Auswahl (Formeln, PM-Gruppen, MAPI, Pollutions-Formel). UI: Building-Panel mit Gesamtübersicht, PM-Wechsel landesweit; Kritikpunkte in der Community: Management vieler Buildings repetitiv, Ökonomie „unsichtbar" über mehrere Menüs [S].

---

## 2. Anno 1800 (Ubisoft) — Maßstab für Produktionsketten-Darstellung

### 2.1 Kettenlogik und Balancing
- Regel: **1 t jedes Vorguterguts wird pro Zyklus zu 1 t des Folgeguts**; daraus rechenbare **perfekte Gebäudeverhältnisse** (z. B. Stahlträger: 2 Hochöfen + 3 Stahlwerke im vollen Ausbau; früh genügt 1+1). Das Wiki listet je Kette Verhältnisse, Bau-/Unterhaltskosten und Versorgungszahlen. — [Production chains](https://anno1800.fandom.com/wiki/Production_chains) (Wayback-Snapshot 18.05.2024)
- Beispielketten mit Versorgungsleistung: Brot = 2 Bäckereien + 1 Mühle + 2 Getreidefarmen → versorgt 110 Arbeiter-Residenzen; Seife = 1 Seifenfabrik + 2 Rendering Works + 2 Schweinefarmen → 240 Arbeiter-Residenzen; Waffenkette etc. — [Production chains](https://anno1800.fandom.com/wiki/Production_chains)
- Warum „bestes Ketten-Spiel": Ketten sind vollständig, ikonisch und rechenbar; das Wiki selbst warnt aber vor Blindflug auf „perfect ratios" (Unterhalts-/Personalkosten können unprofitabel sein) und verweist auf den **Produktions-Tab der Statistik** und Community-Bedarfsrechner. — [Production chains](https://anno1800.fandom.com/wiki/Production_chains)

### 2.2 Arbeitskräfte-Klassen / Bevölkerungsbedürfnisse
- Bedarfsdeckung ist klassenspezifisch (Farmers → Workers → Artisans → Engineers/Investors, New/Old World, DLC-Tiers wie Jornaleros/Obreros, Explorers/Technicians). Jede Kette „versorgt" N Residenzen einer Klasse — Kettenplanung ist indirekt Bevölkerungsplanung. — [Production chains](https://anno1800.fandom.com/wiki/Production_chains)
- Gebäude sind an Workers-Klassen gekoppelt (z. B. Tractor Barn/Werkstätten erst mit Engineers; Schiffswerft/Goldraffinerie etc.). — [Tractor Barn](https://anno1800.fandom.com/wiki/Tractor_Barn)

### 2.3 High-Tech-Maschinen: Traktoren, Silos, Items (sehr relevant!)
- **Bright Harvest DLC:** „Take your empire's farming efforts to the next level … featuring new innovations such as tractors. … Carefully plan your network of oil refineries and farms to make sure your tractors don't run out of fuel. New fodder silos increase the efficiency of animal farms." — [Anno 1800 – Bright Harvest (Steam)](https://store.steampowered.com/app/1314950/Anno_1800__Bright_Harvest/)
- **Tractor Barn (konkrete Zahlen):** Modul direkt am Farmgebäude, eigene Straße zur **Fuel Station**; **+200% Produktivität**, **Extra-Gut alle 3 Zyklen**, **−50% benötigte Arbeitskraft**, dafür **+50% Felder** für Maximalproduktivität; **Verbrauch 1 Fuel alle 5 Minuten**; max. 1 Tractor Barn je Farm. — [Tractor Barn](https://anno1800.fandom.com/wiki/Tractor_Barn) (Snapshot 09.08.2020)
- **Item-System:** Items (auch Traktor-/Spezialisten-Items) in Slots: **Trade Unions (3 Slots, Boost für Produktionsgebäude)**, Town Halls (3), Harbourmaster (3), Schiffe, Museen/Zoos/Botanische Gärten; Raritätsstufen (common → legendary), Beschaffung via Handel, Quests, Expeditionen, Weltausstellung; Anzahl Slots über Influence limitiert. — [Items](https://anno1800.fandom.com/wiki/Items) (Snapshot 03.12.2019)
- Viehwirtschaft: Fodder Silos (Silos) steigern Tierfarm-Effizienz (Bright Harvest), Getreide als Futter nötig [S, gestützt durch DLC-Text].

### 2.4 Inseln/Regionen, Handel
- Mehrere Regionen (Old World, New World, Arctic, Enbesa …) mit unterschiedlichen Ketten/Bewohnern; Schifffahrt/Handelsrouten verbinden Märkte; „Commuter Pier" verknüpft Insel-Arbeitskräfte. — [Tractor Barn](https://anno1800.fandom.com/wiki/Tractor_Barn) (Gebäudelisten), [Production chains](https://anno1800.fandom.com/wiki/Production_chains)

**WV-Dichte-Urteil:** Anno = rein wirtschaftliches Ketten-Balancing ohne makroökonomische Preissimulation (Preise/Aufträge stark vereinfacht, Fokus auf physische Ketten + Bedürfnisse). Der Ketten-Look (Icons, Ratio-Anzeige, Versorgungsangaben) gilt als Genre-Goldstandard [S; gestützt durch Aufbau des Wiki-Artikels und Review-Zitate].

---

## 3. Tropico 6 (Limbic/Kalypso) — Politik + Produktion in einem Loop

### 3.1 Produktionslogik (Gebäude-„Modi" als Technikstufen)
- Community-Übersicht aller Produzenten: pro Arbeitstag bei 100% Effektivität: Arbeiterzahl, Konsumgüter, Produktionsgüter, **Gewinn pro Arbeitstag = Produktion·Handelspreis − Konsum·Handelspreis** (unmodifizierte Handelspreise bei 100%). — [Industry Profits (Steam-Guide)](https://steamcommunity.com/sharedfiles/filedetails/?id=1720095953)
- Konkrete Zahlen: Sägewerk (4 Arbeiter): 4 Logs → 10 Planks = $15/Tag; mit Modus „Hasty Debarking": 6,8 Logs → 13 Planks = $17,1. Zigarrenfabrik mit „Climate Control" (+$2,58/Tag), Plastik „High Speed Fabrication" 1,6 Öl → 11,5 Plastics = $18,06, Textilien „Unified Weaving" (Baumwolle+Wolle gemischt) $11,76. „HS" = High-School-Bildung nötig. — [Industry Profits](https://steamcommunity.com/sharedfiles/filedetails/?id=1720095953)
- **Damit besitzt Tropico ein PM-artiges Modus-System pro Gebäude** (2–3 Modi je Betrieb) — kompakter als Vic3, direkter vergleichbar mit „Maschinenstufe wählen".

### 3.2 Industrie-Baum nach Ären
- 4 Ären: Colonial → World Wars → Cold War → Modern. — [Tropico 6 (Steam)](https://store.steampowered.com/app/492720/Tropico_6/)
- Empfohlene Ketten je Ära (Community-Guide): Colonial: Zucker→Rum, Holz→Bretter, Gold-Rohexport; WWII: Tabak→Zigarren, Gold→Schmuck, Baumwolle→Stoff→Fashion; Cold War: Öl→Plastik→Elektronik, Bauxit→Aluminium→Autos; Modern: …→Smart Devices, Luxusautos, Uran. — [Best Industry Chains (Steam-Guide)](https://steamcommunity.com/sharedfiles/filedetails/?id=3556170314)

### 3.3 Edikte, Subventionen, Politik-Produktions-Kopplung
- Edikte wirken als temporäre, politisch teure Wirtschaftseingriffe: „Urban Development" + „Industrialization" (Baukostenrabatte, Strategie: alles vorbauen, dann Edikt abwählen und Rabatt behalten), „Tax Cut" (−Steuern, +5 Zufriedenheit), „Global Market" (Exportzeitpunkt gegen Preiszyklen), Budget-Slider für Dienste (Gesundheit, Unterhaltung, Wohnen) je nach Wahljahr. — [Best Industry Chains](https://steamcommunity.com/sharedfiles/filedetails/?id=3556170314)
- Fraktions-Management (Faction Balancer): jede Fraktion bei 50–60% Approval halten, gezielt für Wahlen hochziehen; Fraktions-Edikte als Reparaturinstrument. — [Best Industry Chains](https://steamcommunity.com/sharedfiles/filedetails/?id=3556170314)
- Politik-Kopplung an Produktion: Umweltverschmutzung der Schwerindustrie vs. Tourismuszonen (Standortpolitik als Wirtschaftspolitik); Tourismus als preisunabhängiger Zweiterlös („unaffected by global price drops"). — [Best Industry Chains](https://steamcommunity.com/sharedfiles/filedetails/?id=3556170314)
- Handel: Exportrouten 3–5 aktiv halten, Routen bei Preisspitzen neu abschließen („Trade Route Exploit"); Korruption/Befriedigung als Politikvariablen [S, gestützt durch Guide-Kontext].

**WV-Dichte-Urteil:** Tropico zeigt, wie **Edikte+Budget-Slider+Fraktionsdruck** die Produktion steuern, ohne mikromanagement-Last — die Brücke zwischen Politiknetz und Wirtschaft, die NWO sucht. Es fehlt: echte Makroökonomie (keine Inflation/Zins), Preise stark vereinfacht.

---

## 4. Workers & Resources: Soviet Republic — Maschinenlogik und Realismus

### 4.1 Realistische Lieferketten
- Steam-Beschreibung: „realistic supply-chain management with over 30 commodities to acquire, manufacture, and transport. Raw materials, processed goods, and waste material all have specific places where they can be stored, with **specific vehicles needed for their transportation, and specific structures needed for loading and unloading**. Liquids are stored in tanks and moved with pipes/pumps … Mined ores are stored in aggregate storage facilities…". — [Workers & Resources (Steam)](https://store.steampowered.com/app/784150/Workers__Resources_Soviet_Republic/)
- Ökonomie je Fabrik (Community-Excel-Kalkulator als „Factory Profitability Guide"): Kosten = Importpreis oder entgangener Exporterlös; „profit for production chain" summiert Vorproduktfabriken inkl. Arbeiterbedarf (Beispiel: Kleidungskette 1 Kleidungsfabrik + 2,4 Stofffabriken = 145,8 Arbeiter, 1366 ₽ Gewinn). Startpreise Stand 1960 (Version 0.8.9.12). — [Factory Profitability Guide (Steam)](https://steamcommunity.com/sharedfiles/filedetails/?id=3002581675)

### 4.2 Landwirtschaft mit Maschinen als Fahrzeuge (Kern-Lernquelle)
- Farmaufbau: **Fields** (small/medium/big) + **Farms** (beherbergen Fahrzeuge) + **Crop Storages**; Felder werden von **Sowing Tractors** gesät, von **Harvestern** geerntet, mit **Covered Hull Trucks** abtransportiert; **Fuel** treibt die Fahrzeuge; Feldarbeit kann ohne Arbeiter erfolgen, Gebäude brauchen Arbeiter/Fahrzeuge. — [Farming (Fandom-Wiki)](https://workers-resources.fandom.com/wiki/Farming) (Snapshot 13.06.2025)
- **Fruchtbarkeits-/Düngelogik:** Felder starten mit **70% Fertility**, steigen langsam, steigern durch Dünger (fest in Containern, flüssig in Tanks); ein Traktor düngt automatisch, wenn ein in der Farm-UI gesetzter **„Set minimal fertility"-Schwellenwert** unterschritten wird; „Nutrient Level" (Fortschrittsbalken) steigt durch Düngen, sinkt durch Wachstum. — [Farming](https://workers-resources.fandom.com/wiki/Farming)
- Saison-Einstellung: mit Seasons nur **eine Ernte pro Jahr**; optional Water Management (Qualität 93%, Abwasser). — [Farming](https://workers-resources.fandom.com/wiki/Farming)
- Fahrzeuge haben Stats und Lernkurven: Patchnotes korrigieren „tractors' stats and rebalanced their **sowing skills**", „Stalinets-1 **combine** balance (level 26 → 23)", „horse-powered combine harvester" — Landmaschinen sind **Fahrzeug-Objekte mit Stufen**, nicht abstrakte Boni. — [Patchnotes (Steam-Store-Seite)](https://store.steampowered.com/app/784150/Workers__Resources_Soviet_Republic/)
- Bauprozesse im Realistic Mode [S, Spielmechanik-Standallgemeinwissen, im Store nur indirekt]: Gebäude brauchen reale Baustellenlogik (LKW/Kräne/Material/Arbeiter/Zeit) statt Instant-Bau gegen Geld.

### 4.3 Einordnung
- Reviews (auf Store-Seite zitiert): Canard PC „pinnacle of the genre"; RPS lobt „conceptual commitment to a planned economy"; GameStar: „Workers & Resources fills the gap left by Cities: Skylines 2". — [Steam](https://store.steampowered.com/app/784150/Workers__Resources_Soviet_Republic/)
- **Lernziel für NWO:** „High-Tech-Maschine" als **Investitionsgut mit Anschaffung, Betriebsstoff (Fuel), Wartung/Fahrzeugstatistik und Schwellenwert-Steuerung** (Düngelogik) — plus realer Bauvorlauf für Fabriken.

---

## 5. Cities: Skylines 1&2 / SimCity

### 5.1 Cities: Skylines II (Economy-Update-Logik)
- Wirtschafts-Loop der CS2-Simulation: Unternehmen entstehen je nach lokalem Angebot („If I produce a surplus of grain … grain can turn into petrol … I import a lot of it … zone new industry and/or demolish companies until I find one that creates petrol from grain"). **Ketten-Click-Through:** Gut anklicken → Umwandlungsketten zeigen → Import/Export-Bilanz. Zusammenfassung im Infoview. — [„Not enough customers?" (Steam-Guide)](https://steamcommunity.com/sharedfiles/filedetails/?id=3063701120)
- **Steuern + Subventionen als Industrieshaping:** „you can subsidize automobiles to attract those companies to your city … domino effect … Once established, you can tax automobiles"; Vorprodukte mit-subventionieren beschleunigt den Effekt. Zonierung gedrosselt halten gegen Übersättigung (Beispiel: zu viele Möbelläden durch Holzüberschuss). — [Not enough customers?](https://steamcommunity.com/sharedfiles/filedetails/?id=3063701120)
- UI: Infoviews (commercial customer density als grüner Gradient), Production-Chain-Ansicht pro Gut. — [Not enough customers?](https://steamcommunity.com/sharedfiles/filedetails/?id=3063701120)

### 5.2 Cities: Skylines 1 — Industries DLC
- Farming/Forestry/Oil/Ore als Industries-Specializations mit Produktionsketten, Lagerhallen, Truck-Routen, Unique Factories [S; DLC-Reviews: „Running meaningful industries in your city is like playing a game within a game … like an entire county builder" — [Cities: Skylines – Industries (Steam)](https://store.steampowered.com/app/715194/Cities_Skylines__Industries/)]
- Steuern je Sektor/Warengruppe, keine echten Subventionen in CS1 [S].

### 5.3 SimCity (2013)
- Industriespezialisierung (Norm/Öl/Erz/Tourismus), Global-Market-Preise, Verschmutzung/Arbeitslosen-UI [S]. In dieser Recherche keine belastbaren Primärquellen erreichbar (Gap).

**WV-Dichte-Urteil:** CS2 zeigt das modernste **„Warenkette + Steuer/Subvention als Lenkungsinstrument ohne Mikromanagement"**-Modell — politisch gut in ein Präsidenten-Spiel übersetzbar.

---

## 6. Handelsspiele: Patrician IV, Port Royal, The Guild 3

### 6.1 Patrician IV (Hanse)
- „You start bargaining with common goods, **build up your own production** and establish a merchant fleet. … balance competing interests, **trade routes**, political turmoil, disease, weather, piracy … fight with economic competition, **price wars** or … sabotage". Aufstieg vom Händler zum Alderman; Städtegründung/-ausbau. — [Patrician IV (Steam)](https://store.steampowered.com/app/57620/Patrician_IV/)
- Mechanik-Kern [S]: Stadtwirtschaften mit Angebot/Nachfrage pro Gut, Werkstätten als Vorproduktveredelung (z. B. Getreide→Mehl→Brot [S]), Preisunterschiede zwischen Städten als Handelsanreiz, Flotten als Logistik.

### 6.2 The Guild 3
- Dynastie 1400, „complex skill tree", Berufe/Handwerk/Produktion, Ämter im Stadtrat, Intrigen; Echtzeit-3D-Wirtschaftssimulation mit NPC-Wirtschaft. — [The Guild 3 (Steam)](https://store.steampowered.com/app/311260/The_Guild_3/)
- Produktion: gewerbliche Betriebe mit Lieferanten/Arbeitern, lokale Märkte, Standort-/Amtsboni [S].

### 6.3 Port Royal
- Karibik-Handel, Preis-/Angebotssysteme je Hafen, Produktionsketten in Kolonien, Konvois/Preiskämpfe [S; in Recherche nur via Store-Suche verifiziert, keine Detailquelle abgerufen — Gap].

**WV-Dichte-Urteil:** Diese Spiele liefern **regionale Preisdisparitäten, Handelsrouten als Logistik- und Machtinstrument** und „Produktion im Ort" als langfristige Investition — brauchbar für NWO-Provinzwirtschaft und regionale Disparitäten (Türkei-West/Ost).

---

## 7. Democracy 4 — Subventionen als Politik-Instrument

- **Policies als Kern-Interface:** Jede Policy hat einen **Intensity-Slider** (Stärke der Umsetzung; bei Ausgaben = Höhe/Coverage, bei Steuern = Satz); Kosten/Einnahmen sind stark an den Slider gekoppelt. — [Basic Gameplay Guide (cliffski, Dev) (Steam)](https://steamcommunity.com/sharedfiles/filedetails/?id=2242836711)
- **Political Capital:** Neue/veränderte Policies kosten politisches Kapital (Aufwand/Schwierigkeit), unkontroverse Änderungen günstig. — [Basic Gameplay Guide](https://steamcommunity.com/sharedfiles/filedetails/?id=2242836711)
- **Implementation Delay + Trägheit:** Manche Policies wirken sofort (einfache Steuern), andere verzögert (Wissenschaft, Bildung); selbst Slider-Änderungen laufen langsam zum Zielwert („new tanks and soldiers will not appear overnight"). Effekte haben generell „inertia or 'lag'". — [Basic Gameplay Guide](https://steamcommunity.com/sharedfiles/filedetails/?id=2242836711)
- **UI-Prinzip:** Keine Karte, sondern **Icon-Netzwerk**, in dem „everything affects everything else"; Hover zeigt Verbindungslinien (grün = positiver, roter = negativer Effekt, Pfeilgeschwindigkeit = Stärke) — beste visuelle Kausalitätsdarstellung der Auswahl. — [Basic Gameplay Guide](https://steamcommunity.com/sharedfiles/filedetails/?id=2242836711)
- Wirtschaftspolitische Instrumente im Angebot (D4-Store): u. a. **Helicopter Money, Quantitative Easing, Capital Controls, Carbon Capture**, Anti-Corruption Agency; Spendengeber/Minister fordern Policies; Emergency Powers in Krisen. — [Democracy 4 (Positech)](https://www.positech.co.uk/democracy4/)
- Benannte „Subsidize"-Policies (z. B. Agrarsubventionen) mit exakten Werten: in den abrufbaren Quellen **nicht dokumentiert** (Gap); das Policy-Modell oben (Slider=Intensität, Kosten proportional, Delay, Political Capital, verzögerte Wirkung) ist die übertragbare Mechanik.

---

## 8. Kriegswirtschaft (HOI4 als Hauptreferenz, Vic3 als Ergänzung)

### 8.1 HOI4 — Mobilisierungsstufen
- **Economy Laws** (Wechsel: 150 Political Power): „Civilian Economy" (Default) → „Early Mobilization"/„Partial Mobilization" → „War Economy" → „Total Mobilization"; bestimmen u. a. Anteil der Zivilfabriken an **Consumer Goods**, Bauspeed von Zivil-/Militärfabriken, Konversionskosten, Fuel-Produktion, Manpower. — [Economy law (Wiki, Snapshot 2021)](https://hoi4.paradoxwikis.com/Economy_law)
- **Conscription Laws** (ebenfalls 150 PP pro Stufe): „Disarmed Nation" → „Volunteer Only" (Default) → „Limited Conscription" → „Extensive Conscription" → „Service by Requirement" → „Scraping the Barrel"; beeinflussen Manpower (auch Non-Core-Manpower) und teils Fabrikoutput/Bauzeit. — [Conscription law (Wiki, Snapshot 2021)](https://hoi4.paradoxwikis.com/Conscription_law)
- **Rüstungsproduktion:** Militärfabriken: Basis-Output **4,5** (× Production Efficiency), Naval Dockyards 2,5 (immer 100% Effizienz); **Produktionslinien** (je Linie ein Gerätetyp, bis 150 Fabriken pro Linie); **Production Efficiency** startet bei 10% (ohne Modifier), Cap 50%, wächst täglich mit abnehmender Rate; Ressourcen (Stahl, Wolfram, Öl …) je State, Mangel drosselt Output. — [Production (Wiki, Snapshot 2021)](https://hoi4.paradoxwikis.com/Production)
- Spielerische Kriegswirtschaft: Priorisierung von Linien, Umwidmung ziviler Fabriken (Conversion), Lend-Lease/Importe, Mangelmanagement — kein vollständiges Inflationssystem [S].

### 8.2 Victoria 3 — Krieg im Wirtschaftssystem
- Militär-Gebäude (Barracks, Conscription Centers, Naval Bases) mit eigener PM-Gruppe (rot) für Training/Doktrin. — [Production method](https://vic3.paradoxwikis.com/Production_method)
- Priorisierung über die staatliche Construction Queue (militärische Buildings ohne Bau-Effizienz-Malus in unincorporated States). — [Building](https://vic3.paradoxwikis.com/Building)
- Kriegswirtschaft indirekt über Markt: Rüstung zieht Stahl/Eisen, Preise steigen via Buy-Orders (Preisformel §1.4), Bevölkerungskosten via Wöhne/Lebensstandard [S, abgeleitet aus Market-/Building-Mechanik].

**WV-Dichte-Urteil:** HOI4s „Gesetze als Stufen + Produktionslinien + Effizienz" ist das spielerischste Kriegswirtschaftsmodell; Vic3 zeigt die Integration in einen zivilen Markt. Für NWO: Mobilisierungsstufen als Politiknetz-Knoten + Priorisierung von Rüstungs-Ketten in Provinzen.

---

## 9. UI und Darstellung komplexer Wirtschaft

| Spiel | Darstellungsform | Bewertung (Belege) |
|---|---|---|
| Anno 1800 | **Ketten-Icons mit Verhältnissen** (Gebäude-Ratios, Versorgungszahlen), Statistikmenü „Production tab", Items in Slots | Ketten-Doku als Genre-Vorbild; Ratios aber „nicht immer gut" (Kostenwarnung) — [Production chains](https://anno1800.fandom.com/wiki/Production_chains) |
| Victoria 3 | Buildings-Panel (Gesamtübersicht), PM-Tabs (farbige Gruppen), Markt-/Gütertabellen, Preis-Gauges | Detailreichtum gelobt, „Excel-Nähe"/Repetitivität kritisiert [S] |
| Democracy 4 | **Kausalitäts-Netzwerk** (Icons, grün/rot-Linien, Hover-Pfade) | Dev-Guide: „everything affects everything else" — [Basic Gameplay Guide](https://steamcommunity.com/sharedfiles/filedetails/?id=2242836711) |
| Cities: Skylines II | **Infoviews** (z. B. Customer-Density-Gradient), Ketten-Click (Gut → Umwandlung), Steuer-/Subventions-UI pro Warengruppe | „Hands-off"-Steuerung lobend beschrieben — [Not enough customers?](https://steamcommunity.com/sharedfiles/filedetails/?id=3063701120) |
| Workers & Resources | **Property-Windows** je Feld/Farm („Mechanisms working for this farm", Set minimal fertility), Fahrzeuglisten, Import/Export-Panels | Tiefe gelobt, Zugänglichkeit hart; Community baut **Excel-Kalkulatoren** (Factory Profitability Guide) — [Steam-Guide](https://steamcommunity.com/sharedfiles/filedetails/?id=3002581675), [Farming](https://workers-resources.fandom.com/wiki/Farming) |
| Tropico 6 | Gebäude-Modi-Schalter, Budget-Slider, Edikt-Listen, Fraktions-Übersichten | Community-Tabellen (Gewinn pro Arbeitstag) = außerspielische „Excel"-Ebene — [Industry Profits](https://steamcommunity.com/sharedfiles/filedetails/?id=1720095953) |

- „Excel-Simulator"-Kritik: typisch für Spiele, deren Kernzahlen nur in Tabellen lesbar sind (Vic3-Community-Debatte, W&R-Community-Tools) [S/Review-Synthese]. Gegenmittel in den gelobten Spielen: **visuelle Ketten, farbcodierte Gruppen, Kausalitätslinien, in-place-Tooltips** (Hover zeigt Preis-/Mengenherleitung).
- Nicht abrufbar (Gaps): GDC-Talks zum Anno-Produktionsdesign, GameStar/PC-Gamer-Volltexte, YouTube-Mechanik-Guides.

---

## 10. Übernahme für NWO („Staatsräson") — konkrete Empfehlungen

### 10.1 Produktionsketten-Logik (Anno/Vic3)
- **Kettenmodell nach Anno:** Jeder türkische Industriezweig (z. B. Textil, Automobil, Weizen→Mehl→Brot, Stahl, Chemie, Rüstung) als 2–4-stufige Kette mit **Mengenverhältnis 1:1 pro Zyklus** und Gebäudeverhältnissen (z. B. 2 Mühlen : 3 Bäckereien), dargestellt als **Ketten-Diagramm mit Icons + Ratio + Versorgungs-/Exportwirkung pro Provinz**.
- **Marktmodell nach Vic3 (Auszug):** Basispreis + Preisband 25–175% über Buy-/Sell-Orders (Formel in §1.4 übernehmbar), regionaler Marktzugang als Provinz-Infrastruktur-Modifier (MAPI-Analogon), nationale Bauqueue (staatliche Großprojekte = Government Queue; private Investitionen = Investment-Pool-Analogon, im NWO-Modell evtl. „Privatsektor-Investitionen der Provinz").
- **Subventionen nach Vic3:** pro Building/Sektor abschaltbare Stützung (Budgetposten „Subventionen"), die Wettbewerbsfähigkeit sichert — nicht flächendeckend.

### 10.2 „Production Methods"/Maschinen-Stufen für Landwirtschafts-Modernisierung (Vic3 + W&R + Anno)
- **3–5 Stufenleiter je Kulturpflanze/Tierhaltung** (Vic3-PM-Prinzip):
  1. Traditionell (Handarbeit, hoher Arbeitskräftebedarf, niedriger Output)
  2. Bodenverbessernd (Düngemittel-Input, +Output) — Vic3 „Soil-Enriching Farming"
  3. Chemiedünger/Kunstdünger (mehr Output, Dürre-Risiko +10% wie in Vic3)
  4. **Mechanisierung (Traktoren/Mähdrescher):** −50% Arbeitskraft, +200% Output (Anno-Tractor-Barn-Werte), **aber**: Investitionskosten Maschinenpark, laufender **Dieselbedarf** (W&R: Fuel als eigene Lieferkette), Wartung/Lebensdauer (W&R-Fahrzeugstats), +Flächenbedarf/Flächenbindung
  5. **High-Tech (Precision Farming/Drohnen/Sensoren):** Input: Maschinen + Elektrizität + Bildung („HS"-Analogon wie Tropico), Output-Boni + Fruchtbarkeits-Steuerung (W&R-Schwellenwert „Set minimal fertility" als Spieler-Regler).
- **Freischaltung** wie Vic3: Technologie-/Forschungsknoten im Politiknetz (186 Knoten), teils Gesetze (Bildung, Importe), teils Vorbedingung (Stromnetz, Straßenqualität = Market-Access-Analogon).
- **Wirkung auf Politik:** Stufen reduzieren Beschäftigung in der Landwirtschaft (Wanderung in die Städte, Urbanisierungsdruck — wie Vic3-Pops) und erhöhen Export-/Haushaltsbasis.

### 10.3 Subventions-Mechaniken (D4 + Tropico + CS2)
- **D4-Instrument:** Policy-Knoten mit **Intensitäts-Slider** (z. B. „Agrarsubventionen" 0–100%: Kosten ∝ Slider), **Political-Capital-Kosten** für Einführung/Änderung, **Verzögerung** (Wirkung 2–6 Quartale, Slider-Lauf wie D4-„inertia"), transparente Kausalitätsanzeigen (grün/rot) im Politiknetz.
- **Tropico-Logik:** Edikte als **zeitlich begrenzte Programme** (Baukostenrabatt = „Großprojekt-Beschleunigung", Wahljahr-Dämpfe wie „Tax Cut"), Fraktions-/Wählergruppen-Druck als Nebenbedingung.
- **CS2-Logik:** Subvention **pro Warengruppe/Branchenklasse** („Autos subventionieren → Firmen siedeln sich an → Nachfrage nach Vorprodukten"), danach in Besteuerung überführen („subsidize then tax"). Ideal für gezielte **Cluster-Politik** (z. B. Automobilprovinz Kocaeli, Textilprovinz Bursa).
- Steuerung über bestehende NWO-Haushaltsmechanik: Subventionsposten als %-Anteil Haushalt mit automatischer Rückkopplung auf Inflation (Importgüter-Subventionen wirken preisdämpfend — Modellierungsidee, [S]).

### 10.4 Kriegswirtschaft (HOI4)
- **Mobilisierungsstufen als Politiknetz-Äste:** Zivile Wirtschaft → Teil-Mobilisierung → Kriegswirtschaft → Total-Mobilisierung; Wirkungen: Anteil Industrie für Rüstung, Bauumwidmungskosten, Manpower/Wehrpflicht-Stufen (HOI4-Consription-Leiter als Vorbild), Arbeitskräftemangel in der Zivilwirtschaft.
- **Rüstungsproduktion:** Produktionslinien je Gerätetyp mit **Effizienz-Aufbau über Zeit** (HOI4: Start 10%, Cap 50% — übernehmbar als „Umstellungsdauer der Fabriken"), Priorisierung durch den Spieler (Präsidenten-Direktive), Ressourcen-Engpässe (Stahl, Öl, Elektronik) über Provinzproduktion.
- **Mangelwirtschaft:** Knappheit erhöht Preise (Vic3-Formel), Subventionen+Rationierung als Gegeninstrument; Schwarzmarkt/Korruption als Tropico-artiger Nebeneffekt [S].

### 10.5 UI-Ideen
1. **Ketten-Lens (Anno):** Provinz-/Sektoransicht mit Produktionsketten-Icons, Ratios, Ampel für Engpässe.
2. **Waren-Inspector (CS2):** Gut anklicken → Umwandlungskette, Import/Export-Bilanz, empfohlene Subvention.
3. **Kausalitätsnetz (D4):** Für Politiknetz (186 Knoten) Hover-Linien in bestehendem NWO-UI.
4. **Maschinen-Investitionsdialog (W&R/Anno):** Anschaffungskosten, Dieselverbrauch, Flächenbedarf, Beschäftigungswirkung, Amortisation — als „Großprojekt"-Untertyp.
5. **Provinz-Property-Panel (W&R):** Fruchtbarkeit, Mechanisierungsgrad, Mindestfruchtbarkeits-Schwellenwert als Spielerregler.
6. Vermeidung von „Excel-Simulator": Kernzahlen (Gewinn/Tag, Beschäftigte, Input/Output) in Tooltips; Tabellen nur als Drill-Down.

### 10.6 Was nicht übernommen werden sollte
- **Echtzeit-Bauplatz-Logik** (Anno/CS/W&R Platzieren, Wegefindung) — NWO ist Runden-/Präsidial-Abstraktion; stattdessen Bauzeiten + Kosten (Vic3-Queue-Prinzip).
- **Einheiten-/Fahrzeug-Mikrologistik** (W&R-LKW-Routen, HOI4-Linien-Mikro) — abstrahieren zu „Logistikstatus pro Provinz" (Marktaccess/Infrastruktur), nur bei Kriegswirtschaft schärfen.
- **Isel-/City-Level-Bevölkerungsbedürfnisse (Anno)** — ersetzen durch nationale/regionale Bedarfsaggregate (Inflation/Lira-Modell bereits vorhanden).
- **Vic3-Pop-Individualität** (tausende Pops) — für 81 Provinzen zu teuer; Klassenaggregate (Landbevölkerung, Industriearbeiter, Bildungselite) genügen.
- **D4-Rein-KI-Wahlkampf-Loop** — nur als Nebenmechanik (Wiederwahl), nicht als Hauptspielziel.

---

## Lücken (Gaps) dieser Recherche
- Paradox-Wikis nur über Wayback (Vic3 Stand 2025, HOI4-Gesetze 2021) — spätere Patches (1.9+/DLCs) können Zahlen geändert haben; exakte Subventions-Werte (Vic3 Building-Button, D4-Policies mit Namen/Verzögerungswerten) nicht abrufbar.
- Anno: Item-Listen mit konkreten Bonuswerten (Traktor-Item-Stats jenseits Tractor Barn), DLC-Ketten (Land of Lions, New World Rising) nur ansatzweise.
- SimCity und Port Royal: keine Primärquellen abrufbar, Abschnitte auf [S]-Niveau.
- GDC-Talks, YouTube-Guides, GameStar/PC-Gamer-Volltexte, Reddit-Diskussionen (r/victoria3, r/Workers_And_Resources) nicht abrufbar — Review-Urteile nur als Steam-Store-Zitate.
- HOI4-Produktionswerte (Output 4,5, Effizienz 10→50%) stammen aus Snapshot 2021 und können seither balanciert worden sein.
