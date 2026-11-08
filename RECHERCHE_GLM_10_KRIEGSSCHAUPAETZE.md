# GLM-Recherche 10: Kriegsschauplätze (05.10.2026, vertieft)

Auftrag: GLM_AUFTRAG_RECHERCHE.md, Thema 10; baut auf RECHERCHE_KRIEGSSCHAUPAETZE_2026-10-05.md (Verwaltungsgliederung, belegt) und RECHERCHE_GLM_4 (Armeen) auf. Neu vertieft: Gelände, Infrastruktur, Akteure und Ressourcen je Theater. Primärquellen: UN OCHA, Iraq/KRG-Quellen, Lageberichte 2025/26, UNFICYP, Presse. Recherche-Stand: 05.10.2026. Lagezustände (Kontrolle, Verträge) sind datiert und im Spiel veränderbar.

## 1. Kurzfassung

Fünf Theater mit völlig verschiedenen Charakteren: **Nordsyrien** ist nach dem Machtwechsel von Dezember 2024 ein Land im Umbau — die Şara-Regierung und die SDF haben am 10. März 2025 einen 13-Punkte-Integrationsweg vereinbart, dessen Frist (31.12.2025) verstrich und dessen Scheitern Damaskus im Januar 2026 militärisch beantwortete; dazu die türkisch gestützten Zonen und das Wasser/Öl der Region. **Nordirak** ist Bergkrieg (Qandil) plus Ölstillstand (Kirkuk–Ceyhan seit der Arbitrage März 2023). **Die Ägäis** ist kein Bodenkrieg, sondern ein Luftraum- und Inselkonflikt mit F-35-Wettrüsten. **Zypern** ist ein eingefrorener Zustand mit Gasblöcken und britischen Basen. **Der Südkaukasus** hat sich 2025 gedreht: Friedensschluss vom 8. August (Washington) und der US-gepachtete Zangezur-Korridor haben Russlands Fuß gedrückt und den Mittleren Korridor verändert. Für das Spiel: Jedes Theater bekommt Kontrolle-Zustände, Akteure mit Zielen, Gelände-Boni und Ressourcen — die Kriegsrechnung (Welle K) rechnet daraus.

## 2. Befund je Theater

### 2.1 Nordsyrien

| Feld | Stand (datiert 2025/26) | Quelle |
|---|---|---|
| Verwaltungsgliederung | 14 Gouvernements (OCHA: 14→62 Distrikte→272 Unterdistrikte) — siehe RECHERCHE_KRIEGSSCHAUPAETZE Abschnitt 2 | UN OCHA |
| Zentrale Akteure | Übergangsstaat unter **Ahmed Şara** (seit Dez. 2024); **SDF** (Kern: Kobani-Legion, Kommandeur Mazlum Abdi) im Nordosten; türkisch gestützte SNA-Gruppen in Afrin–Azaz–Jarabulus-Gürtel; Restmilieus im Wüstenband | Lageberichte 2025/26 |
| Schlüsselvorgang | **10. März 2025: Şara–Abdi-Abkommen**, 13-Punkte-Integrationsweg (SDF in den syrischen Staat); Frist 31.12.2025 verstrichen; Januar 2026: Damaskus rückt militärisch nach (Berichtslage) | rupelanu/ilketv/welattv/hurhaber (Presseauswertungen) |
| Türkei-Sicht | SDF als PKK-Ableger (offizielle Linie); Angriffs- und Integrationsfragen gekoppelt | ensonhaber (März 2025) |
| Gelände | Euphrat-Tal und Fruchtbarer Halbmond flach; Qalamun- und Küstengebirge; M4-Highway als Operationsachse | Geobasis (Natural Earth) |
| Infrastruktur | **Alouk-Wasserstation** (Hassakeh — Versorgung strittig), **Tabqa-Staudamm**, M4, Rmeilan-Ölfelder (Nordost) | OCHA/Presse (Stand zu prüfen) |
| Ressourcen | Öl (Rmeilan/Karratchok), Wasser (Euphrat — Zustromkante GLM_7), Weizenböden, Lager (FLiechtlingssiedlungen) | OCHA/Lageberichte |
| Spielanker | Friedensprozess g_friedensprozess; Rückkehr g_rueckkehr (3,2+ Mio. Geflüchtete in der Türkei — STARTDATEN); Grenzkorridor (fok_sich_grenzkorridor) | Spiel-Daten |

### 2.2 Nordirak

| Feld | Stand | Quelle |
|---|---|---|
| Verwaltungsgliederung | 18 Gouvernements (+Halabja als 19.); KRG: Erbil, Sulaymaniyah, Dohuk (+Halabja) | RECHERCHE_KRIEGSSCHAUPAETZE Abschnitt 3 |
| Akteure | Irakische Bundesregierung (Bagdad), **KRG** (Erbil), **PKK** (Qandil, Metina, Zap, Sinjar-Band), Irakische Armee, PMF-Einheiten; Türkiye: ~Dutzend Stellungen im Norden (Zahl zu prüfen) | Lageberichte (zu prüfen) |
| Gelände | **Qandil/Metina/Zap: Hochgebirge** (1.500–3.000 m) — Bergkrieg, schwer zugänglich; Sinjar-Ebene; Mossul-Ebene | Geobasis |
| Infrastruktur/Ressourcen | **Kirkuk–Ceyhan-Pipeline (still seit März 2023, Arbitrage; Neustartverhandlungen 2025; 58-Mrd.-TL-Debatte Aug. 2025)**; KRG-Ölfelder; Erbil-Flughafen; BTK-Verbindung am Rand | DergiPark (Akkaya); Presse |
| Wasser | Großer Zab/Tigris-Zustrom (Kante zu GLM_7-Dämme) | DSİ/UN (Lücke) |
| Spielanker | Rüstungs-/Grenzoperationen (GLM_4-Stellungen), Pipeline-Neustart (Vorschlag 5.2 GLM_7), Terrorankopplung (sim/diplomatie.ts: PKK-Täter) | Spiel-Daten |

### 2.3 Ägäis

| Feld | Stand | Quelle |
|---|---|---|
| Kernkonflikt | 12-Meilen-Frage (Türkiye: „Kriegsgrund" bei Ausdehnung), Festlandsockel-/EEZ-Grenzen, Inselbewaffnung (Lausanne/Paris-Regime, Auslegungssreit), Luftraum (Athens-FIR-Abgrenzung) | Vertrags-/Doktrinlage; Mavi Vatan (GLM_7) |
| Wettrüsten | Griechenland: **F-35A bis 40 genehmigt (~8,6 Mrd. $), erster Vertrag 20 (Juli 2024)**; Türkiye: F-16-Viper + KAAN (GLM_4) | DW 25.7.2024 |
| Gelände | Inselkette (Hundertfunkeln), enge Meerengen zwischen Inseln und Festland — Marine-/Luftraum-Theater, kein Bodenkrieg | Geobasis |
| Ressourcen | Fischerei, Forschungsbohrdispute (Seismik-Kampagnen beidseitig — zu prüfen) | Lageberichte |
| Spielanker | Luftraum-Zwischenfälle als Ereigniskette, NATO-Kopplung, Migrationsroute (Küstenwache GLM_5) | Spiel-Daten |

### 2.4 Zypern

| Feld | Stand | Quelle |
|---|---|---|
| Zustand | Grüne Linie 1974, UN-Pufferzone (~180 km), 6+6 Distrikte (RECHERCHE_KRIEGSSCHAUPAETZE Abschnitt 4), Garantievertrag 1960, britische Souveränitätsbasen (Akrotiri, Dhekelia) | UNFICYP; Vertragstexte |
| Ressourcen | Gasblöcke 1–13 (Südosten), Bohrdispute, EEZ-Ansprüche; EU-Sanktionsdrohungen gegen Bohrer | Lageberichte (Stand zu prüfen) |
| Gelände | Kyrenia-Kette (Nord), Mesaoria-Ebene, Troodos (Süd) | Geobasis |
| Spielanker | EU-Beitrittsblocker (sim/eu.ts gebaut), Montreux-Bezug irrelevant, Basisnetz (GLM_7 2.4) | Spiel-Daten |

### 2.5 Südkaukasus

| Feld | Stand (2025/26) | Quelle |
|---|---|---|
| Drehpunkt | **8.8.2025 Washington-Friedensschluss** (Armenien–Aserbaidschan); **Zangezur-Korridor 99 Jahre an USA verpachtet („Trump Road")**; Karayol/Bahn/Pipeline-Pläne im Korridor | modern.az (11.3.2026, Paşinyan); Presse 8.2025 |
| Nachgang | Fidan (Nov. 2025): Normalisierung mit Armenien beim endgültigen Abkommen; Russland verliert Fuß (Friedenstruppe-Abzug 2024 vorausgehend) | Presse (Nov. 2025) |
| Infrastruktur | **BTK-Bahn (Baku–Tiflis–Kars)** als bestehender Mittlerer Korridor; Erzurum/Kars-Knoten (welt_autobahn_china, welt_hsr_china in zukunft.ts); Anaklia-Hafen (Georgien, Tenderlage zu prüfen) | TCDD/BTK; Presseausswertungen |
| Akteure | Aserbaidschan (stark, ölfreundlich), Armenien (Umorientierung nach Westen), USA (Pachtherr), Iran (gegen Korridor-Nordrand), Russland (Fuß im Abzug), Georgien (Korridor-Land) | Lageberichte |
| Gelände | **Sjunik/Zangezur: Bergland (2.000–3.900 m)** — Kapazität der Korridorvarianten hängt an Pässen und Tunneln; Aras-Tal | Geobasis |
| Ressourcen | Kaspisches Öl/Gas (Terminal-Bäckchen), Transitgebühren, fruchtbares Aras-Tal | GLM_3/7 |
| Spielanker | fok_aus_zangezur (Neutext mit US-Pacht), fok2_aus_kaspische_pipeline, Mittlerer-Korridor-Vorhaben (welt_korridor_*) — alle um den Pacht-Fall erweitern | Spiel-Daten |

## 3. Zusammenhänge (Richtung, Verzug)

| Kante | Richtung | Verzug | Beleg |
|---|---|---|---|
| SDF-Integrationsbruch → Grenzoperationen + Friedensprozess g_friedensprozess | − | sofort bis 1 Jahr | 10.3.2025-Abkommen, Frist 31.12.2025, Jan. 2026-Lage |
| Rückkehrprogramm (g_rueckkehr) ↔ Syrienstabilität | + | 12–24 Monate | STARTDATEN (Fluchtbestand); Abkommen GLM_5-Form |
| Pipeline-Neustart → KRG-Bagdad-Balance → Devisen | + | 6–18 Monate | Arbitrage-Geschichte 2023–2025 |
| Zangezur-US-Pacht → Mittlerer-Korridor-Wert | ± | 1–3 Jahre | 8.8.2025 |
| Griechenland-F-35 → Luftraumdruck → eigene Luftrüstung | − | 3–5 Jahre | DW 25.7.2024; GLM_4 |
| Zypern-Gas → EU-Kapitel + Türkei-Bohrreaktionen | − | sofort | EU-Berichte; sim/eu.ts-Blocker |
| Dammzustrom (GLM_7) → Euphrat-Theater-Frage | ± | 1 Saison | 1987/1990-Abkommen |
| Qandil-Bergkrieg → Terror- und Truppenlast | − | dauerhaft | GLM_4-Stellungen (Zahl zu prüfen) |

## 4. Anschluss im Code

- `data/krieg-daten.ts` (Schauplätze ab Zeile ~315): Die fünf Theater mit ihren Akteuren, Gelände- und Infrastrukturwerten kalibrieren die Regionenliste; Korrekturen aus RECHERCHE_KRIEGSSCHAUPAETZE (14 statt 15 Gouvernements Syrien) einarbeiten.
- `sim/krieg.ts` (Friedenspakete, Kriegsgründe) und `sim/pakte.ts`: Akteure je Theater mit Zielen; Welle K (Verbände/Fronten) rechnet auf diesen Karten.
- `sim/diplomatie.ts`: Terror-Täter (PKK), Grenz- und Fluchtkanten; SDF-Frage koppelt an g_friedensprozess.
- `sim/laender.ts` / `sim/welt-modell.ts`: Armenien-/Aserbaidschan-Zustände nach dem 8.8.2025-Fall aktualisieren (Weltstart im Sept. 2026 liegt NACH dem Washington-Fall).
- `data/fokus/erweiterungen.ts`: fok_aus_zangezur und fok2_aus_kaspische_pipeline um den US-Pacht-Fall erweitern (Textänderung, keine Änderung der Mechanik).
- Karte: Kriegs-Linse (geplant) zeichnet die Theater; Kontrollzustände als Tinten-Ebenen.

## 5. Integrationsvorschläge

### 5.1 Theater-Akte mit Kontrollzuständen (Kernbaustein)

- **Entscheidung:** Keine Einzelregler; je Theater fünf Zustandsfelder (Kontrolle je Akteur, Gelände-Boni, Infrastrukturzustand, Ressourcen, dringendste Frage). Der Spieler entscheidet je Theater an 2–3 Instrumenten (aus dem Außenstrang: Staatsbesuch, Sanktion, Grenzschutz, Friedensschritt — bereits gebaut).
- **Folgen:** Kontrollverschiebungen ändern Kriegs-/Friedensrechnung; Infrastrukturzustand (M4, Pipeline, BTK) steuert Militär- und Handelswerte. Verlierer: Zivilmilieus in den Theatern (Flucht, Versorgung).
- **Gegenspieler:** Alle Akteure je Theater (Tabelle 2), USA/Russland als Drehgeber, EU (Zypern/Syrien-Fragen).
- **Anzeige:** Kriegs-Linse + Kriegsakte: Theater-Karten mit Akteur-Färbung; Ereignisse an Fristen (31.12.2025-Muster: datierte Fragen im Terminkalender).
- **Daten:** `game/src/data/entwurf_glm/schauplaetze.ts`.
- **Aufwand:** mittel bis groß (mit Welle K).
- **Spieltest:** Spaß, wenn der Spieler die Syrien-Frist auf dem Schreibtisch sieht und vor dem Datum entscheiden muss, nicht danach.

### 5.2 SDF-Frage als Friedensprozess-Gabel

- **Entscheidung:** Drei Wege im g_friedensprozess-Feld: Damaskus-Integration unterstützen (über Şara), eigenes Nordsyrien-Pfand halten, Abwarten mit Grenzdruck.
- **Folgen:** Integration: PKK-Frage entschärft, türkischer Einfluss in Damaskus fragil; Pfand: Dauerlast (Kosten, Internationalität), Migrationskante; Abwarten: Ereignisdruck. Beleganker: 10.3.2025-Abkommen und sein Scheitern.
- **Gegenspieler:** Şara-Regierung, SDF/Führung, USA (Vermittler der Integration), oppositionelle Milieus (Kurdisch-Milieu im Spiel).
- **Anzeige:** Kriegs-/Welt-Akte: Theater Nordsyrien mit Abkommen-Frist; Wirkungsberichte über Terror- und Fluchtzahlen.
- **Daten:** schauplaetze-Entwurf (`nordsyrien`).
- **Aufwand:** mittel.
- **Spieltest:** Spaß, wenn die Gabel zwei Amtszeiten trägt und der Spieler 2029/2032 die Folgen seines 2028er-Wegs liest.

### 5.3 Zangezur-Nachjustierung (die Welt hat sich bewegt)

- **Entscheidung:** Mit dem US-Pacht-Fall (8.8.2025) neu kalkulieren: BTK-Ausbau als Eigenweg, Transit-Zusammenarbeit mit der US-Korridorverwaltung, Iran-Kanalisierung (Sanktionsrisiko).
- **Folgen:** Korridorwert je Route verschiebt sich (GLM_7); Iran-Beziehung belastet bei Kanalisierung; Friedensdividende senkt Kriegskosten in der Region.
- **Gegenspieler:** USA (Pacht), Iran, Russland, Aserbaidschan (Gegenleistungen), Armenien (Souveränitätsfragen).
- **Anzeige:** Karte: zwei Korridorpfeile; Welt-Akte: Transitwert je Route; Ereignis „Korridor-Termine".
- **Daten:** schauplaetze-Entwurf (`suedkaukasus`).
- **Aufwand:** klein.
- **Spieltest:** Erfolgreich, wenn der Spieler den Unterschied zwischen „Korridor besitzen" und „Korridor mitbenutzen" als Politik spürt.

### 5.4 Ägäis als Krisenleiter (kein Bodenkrieg)

- **Entscheidung:** Leiter zwischen Signal und Eskalation (FIR-Verhalten, Seismik-Kampagnen, Luftraum-Zwischenfälle, Inselberichte) mit vier Stufen und festen Rückstufen (Dekontaktierung als NATO-Angebot).
- **Folgen:** Stufe 3+ mobilisiert Luftrüstung (GLM_4), Tourismus im Sommer leidet, NATO nervös; Stufe 1 öffnet Handels- und Entspannungsgewinne. Verlierer: Inselmilieus (beide Seiten).
- **Gegenspieler:** Griechenland, NATO, EU, eigene Marine-Führung, Tourismusbranche.
- **Anzeige:** Kriegs-/Welt-Akte: Ägäis-Leiste mit Ereigniskette; Karte: Luftraum-/Seismic-Marken.
- **Daten:** schauplaetze-Entwurf (`aegaeis`).
- **Aufwand:** mittel.
- **Spieltest:** Spaß, wenn Sommer-Tourismusrechnung und Luftraumkrisen im selben Monat um Aufmerksamkeit konkurrieren.

### 5.5 Qandil-Bergkrieg als Abnutzungsrechnung

- **Entscheidung:** Operationsmodus (Stellungskrieg / Tiefeinsätze / Friedenskante mit Abzugspfad) — Kopplung an g_friedensprozess und die Terror-Kante (sim/diplomatie.ts).
- **Folgen:** Bergkrieg: dauerhafte Verluste und Kriegsmüdigkeit, Terror drückt Tourismus/Investitionen; Friedenskante: Terror −, Militär- und Parteinachwuchs-Politik sichtbar. Verlierer je Weg: Soldaten (Berg) oder Konservative (Abzug).
- **Gegenspieler:** PKK-Führung, KRG (Bedenken), Bagdad, Irak-Milieus.
- **Anzeige:** Kriegsakte: Abnutzungsuhr je Modus; Wirkungsberichte über Terror-/Verlustzahlen.
- **Daten:** schauplaetze-Entwurf (`nordirak`).
- **Aufwand:** mittel.
- **Spieltest:** Erfolgreich, wenn der Moduswechsel sichtbar drei Zahlen bewegt (Terror, Tourismus, Truppenlast) und die Politik ihn trotzdem schwer macht.

## 6. Verworfen

- **Frontverlauf im Detail je Gouvernement (14 Regionen Syrien einzeln):** Theater-Kontrolle in Wortstufen reicht; Feinkartierung kommt mit Welle K, wenn die Verbände stehen.
- **Eigene Flüchtlingslager-Simulation:** Die Fluchtkette (Außenstrang) ist gebaut; Theater-Ressource „Lager" ist Anzeigewert.
- **Zypern-Friedensplan-Fenster:** EU-Kapitel-Blocker trägt den Konflikt; ein zweites Friedensmodul wäre Duplizierung.
- **Wettrüsten als eigenes Spiel im Spiel:** GLM_4-Fahrpläne + Nachbarreaktion reichen.

## 7. Vorbilder

- **HOI 4:** Theatergruppierung mit Fronten und Gelände-Boni — übernommen (Gelände, Kontrolle, Akteure); keine Gefechtskarte (Entscheidung des Projektinhabers).
- **Civ 6:** City-States und City-Zustände — übernommen als Akteure mit Zielen je Theater.
- **Victoria 3:** Diplomatische Spiesse („Hoheit über Korridor") — der Zangezur-Pacht ist ein reales Beispiel; übernommen als Zustand.
- **Suzerain:** Grenzkrisen als politische Szenen mit Wahlzwang vor Fristen — übernommen (datierte Theaterfragen).

## 8. Unsicher oder unbelegt

1. Türkische Stellungszahl im Nordirak: keine offizielle Quelle (Pressebände auseinander).
2. Syrien-Lage nach Januar 2026 (Damaskus-SDF): aktive Lageberichte nachziehen; das Spiel startet Sept. 2026 — Zustand zum Stichtag festlegen.
3. Zangezur-Pachtvertragsdetails: Presseausswertung; Vertragstext **zu prüfen**.
4. Anaklia-Hafen-Tender (Georgien): Stand zu prüfen.
5. Rmeilan-Ölmenge und Alouk-Versorgungsstand: OCHA/Zahlen aktualisieren.
6. Seismik- und Bohrdiskrepanz Ägäis ( aktuelle Kampagnen): Lageberichte.
7. Zypern-Gasblock-Status: EU-/Republik-Quellen.
8. Bevölkerungszahlen je Theater (außer Verwaltungsgliederung, die belegt ist): OCHA/UNFPA-Reihen mit Bezugsjahr beschaffen.
