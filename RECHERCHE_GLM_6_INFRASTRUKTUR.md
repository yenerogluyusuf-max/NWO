# GLM-Recherche 6: Infrastruktur und Belastung (05.10.2026)

Auftrag: GLM_AUFTRAG_RECHERCHE.md, Thema 6. Primärquellen: KGM, TCDD/Taşımacılık, DHMİ, TEİAŞ, TÜİK, TOKİ/ÇŞB, Sağlık Bakanlığı, Denizcilik ve Haberleşme Bakanlığı/TÜRKLİM. Recherche-Stand: 05.10.2026. Belastungszahlen (Auslastung je Region) sind weitgehend Lücken — die Netz-/Kapazitätsbasis ist belegt; die Auslastungslogik wird im Spiel aus dem Belastungsmuster (KI_PROJEKTE_UND_KARTE_2026-10-05.md, Abschnitt 8) gerechnet.

## 1. Kurzfassung

Das Netzskelett ist groß und jung: 3.796 Kilometer Autobahn (fast die dreifache Länge von 2002), 29.730 Kilometer getrennte Fahrbahnen, 13.919 Kilometer Bahn mit 2.251 Kilometern Hochgeschwindigkeit, 214 Millionen Flugpassagiere im Jahr bei 84 Millionen allein am İstanbul-Flughafen, 13,5 Millionen TEU Hafenumschlag. Dagegen stehen drei Engpässe mit Namen: Der Schienengüterverkehr ist marginal (die Bahn trägt einen Bruchteil der Fracht), das Stromnetz wächst gegen einen steigenden Bedarf mit importierten Brennstoffen (GLM_3), und der Wohnbestand von rund 42 Millionen Wohnungen wird durch Zuwanderung, Bebenrisiko und Investitionsleere auseinandergezogen — 904.000 Wohnungen warten unverkauft, während die Mieten (Wohnen im Konsumkorb +39,8 %) die Straßenmitte bestimmen. Kliniken: 270.829 Betten, ~3 je 1.000 Einwohner, unter OECD-Niveau, Ungleichheit zwischen Metropol und Provinz. Für das Spiel: Jedes Netz bekommt einen Bestand, eine Kapazität und eine Last — die Vorschläge übertragen das Belastungsmuster auf diese Basis.

## 2. Befund: Zahlen mit Quellen

### 2.1 Netze (Bestand)

| Netz | Bestand | Trend | Quelle |
|---|---|---|---|
| Autobahn (Otoyol) | **3.796 km** (Nov. 2024; 2002: 1.714) | Ziel 2028: weiterer Ausbau | KGM-Angaben (Presseauswertung) |
| Getrennte Fahrbahnen | **~29.730 km** (2002: 6.101) | Ziel 2028: 31.250 km | KGM-Angaben |
| Bahnetz | **13.919 km** | Langfristplan: bis 28.590 km (2053-Skala, „zu prüfen") | TCDD Taşımacılık 2024–2028-Strategieplan |
| Hochgeschwindigkeitsbahn (YHT) | **2.251 km** (Dez. 2024) | Ziel 2028: 5.343 km | ebenda |
| Flughäfen | ~56 offen für Zivil (DHMİ-Liste; exakte Zahl zu prüfen) | — | DHMİ |
| Flugpassagiere | **214 Mio. (2024, +7,5 %)** (teils 230,2 Mio. mit Transit abweichend gezählt) | İstanbul Airport 2024: ~80 Mio; **2025: 84,4 Mio (Weltrang 8)** | DHMİ 10.12.2024; haber.aero 16.7.2026 |
| Hafenumschlag | **13,5 Mio. TEU Container (2024)**; Gesamtfracht 531,7 Mio. t | — | TÜRKLİM; Weltbank (13.507.070 TEU) |
| Stromnetz | Erzeugung siehe GLM_3 (348,9 TWh); installierte Leistung und Netz-km **Lücke** (TEİAŞ-Jahresbericht auswerten, Größenordnung >110 GW / ~75.000 km) | Spitzenlast **Lücke** | TEİAÜ-Jahresbericht (auszuwerten) |
| Wasser | Pro Kopf verfügbar ~1.300 m³ je Jahr (gewöhnlich zitiert; TÜİK-Wert **zu prüfen**) — Wasserstress-Schwelle nahe | Dürrekette gebaut (sim/katastrophe.ts) | TÜİK/DSİ (zu prüfen) |
| Internet | Breitband-/Mobilabonnements **zu prüfen** (TÜİK/KT); 5G: Auktion 2025 abgeschlossen, Start angekündigt (Einzelheiten **zu prüfen**) | Glasfaserausbau als Hebel m_breitband | BTK/TÜİK (auszuwerten) |

### 2.2 Wohnen

| Posten | Wert | Quelle |
|---|---|---|
| Wohnungsbestand | **~42 Mio.** (Haushalte ~26 Mio.; „47 Mio." nicht bestätigt — TÜİK-Binazensus 2021 als Basis auswerten) | Mahalle-Portal-Auswertung; TÜİK NİP |
| Verkauferwartende Bestände | ~904.000 (2024) | kendievim-Auswertung |
| Verkäufe August 2026 | 44.378 Erst- und 83.032 Zweitverkäufe je Monat | TÜİK 17.9.2026 |
| Sozialwohnungen (TOKİ) | **1,77 Mio. geliefert gesamt** (1.365.610 in 22 Jahren nach Ministerangabe Mai 2024); Programm „Yüzyılın Konutu": **500.000 Ziel in 81 Provinzen** | toki.gov.tr; csb.gov.tr; AA |
| Bebenrisiko | Großteil des Bestands vor den neuen Baunormen (Bauamnestie-Historie — siehe Gesetzesbaustein g_bauamnestie) | qualitativ |

### 2.3 Gesundheit (Kliniken)

| Posten | Wert | Quelle |
|---|---|---|
| Aktive Krankenhausbetten | **270.829 (2025)** — 172.079 Ministerium, 45.740 Universität, ~53.000 privat | medimagazin/Sağlık-Yıllığı-Auswertung |
| Betten je 1.000 Einwohner | **~3,1 (2024; 10k: 31,3)** — OECD-Vergleichsliteratur nennt ~2,7 vs. OECD-Schnitt 4,7 (Abgrenzungsunterschied, offen gelegt) | Sigorta Gazetesi Feb. 2026; dergipark-Analyse |
| Regionale Schiefe | İstanbul ~30 Betten je 10.000; Provinz-Spitzen/Nullen **Lücke** (Sağlık-Yıllığı je Provinz auswerten) | Sigorta Gazetesi |

### 2.4 Großprojekte (Kosten = Planungs- oder Schätzwerte, alle „zu prüfen" gegen Auftragsunterlagen)

| Projekt | Stand/Kosten (Schätzbänder, zu prüfen) | Betreibermodell | Quelle |
|---|---|---|---|
| Kanal İstanbul | Kostenschätzungen in der Öffentlichkeit weit auseinander (zehn bis über 70 Mrd. $); Umweltsachen laufen | ÖİB/PPP, Erträge aus Durchfahrt | Presse (Ausschreibungslage zu prüfen) |
| 1915 Çanakkale-Brücke | ~2,8 Mrd. $, eröffnet 2022 | PPP mit Gewinn-/Verlustgarantie (Garantieauszahlungen bekannt geworden — zu prüfen) | Presse |
| Eurasia-Tunnel | ~1,3 Mrd. $, eröffnet 2016 | PPP | Presse |
| İstanbul-Flughafen | ~11 Mrd. $ (Bau), Erweiterung läuft | TAV/İGA-Konzession | Presse |
| Akkuyu | 20–25 Mrd. $ (Bau-Betrieb-Eigentum beim Partner) | siehe Gesetzesbaustein g_kernkraft | GLM_2/3 |
| TANAP | ~8,5 Mrd. $, in Betrieb (16 → 31 Mrd. m³ Ausbau) | Konzortium | GLM_3 |
| İstanbul–İzmir Otoyol | ~6,4 Mrd. $ | PPP mit Schattenmaut | Presse |
| Filyos/Çandarlı-Häfen | Planungsphase | ÖİB/PPP | Presse (Stand zu prüfen) |

**Härtebefund (belegt):** Die PPP-Garantiebrücke (Çanakkale als Fall) zeigt das Betreibermodell-Risiko: Der Staat zahlt bei Ausbleiben der Nutzung — genau die „Garantien für Betreiberprojekte" (m_oepp_garantien) des Netzes.

## 3. Zusammenhänge (Richtung, Verzug)

| Kante | Richtung | Verzug | Beleg/Lücke |
|---|---|---|---|
| Autobahnbau → Logistikkosten → Exporte | + | 2–5 Jahre | 3.796 km Bestand; Elastizität Lücke |
| YHT-Ausbau → Innenverkehr/Bahnanteil | + | 3–8 Jahre | 2.251 km; Güterbahnteil marginal (Lücke: exakter Anteil) |
| Flughafenkapazität → Tourismus | + | 1–3 Jahre | 214 Mio. Passagiere; Tourismuszahlen in Ausweitung (Abschlussbericht) |
| Schattenmautgarantien → Haushaltsausgaben | − | vertragsgebunden | Çanakkale-Fall (zu prüfen) |
| Mieten (Wohnen +39,8 % im Korb) → Sozialspannung | − | sofort | TÜİK 8/2026 (GLM_1/9); Mietkante gesetzesnah |
| Betten je 1.000 unter OECD → Wartelisten/Milieu | − | 2–5 Jahre | 3,1 vs. 4,7 (Abgrenzung offen) |
| Stromnetz-Verspätung → Versorgungswarnung | − | sofort bis 1 Jahr | GLM_3; Energie-Außenstrang gebaut |
| Bebenrisiko des Bestands → Sanierungspflicht | − | Ereignisgetrieben | g_bauamnestie/g_stadterneuerung (Gesetzesbausteine) |
| Wasserdürre → Landwirtschaft → Preise | − | 1 Saison | GLM_3 Weizenkalkulation |

## 4. Anschluss im Code

- `data/reich/infrastruktur.ts` (137 Vorhaben mit Beständen) und `sim/reich.ts`: Die Netzzahlen kalibrieren die Infrastruktur-Vorhaben (Autobahn-, Bahn-, Hafenserien wie fok2_reg_hafentrio).
- `sim/grossprojekt.ts`: Schätzbänder (Kanal, Hafen, Korridor) sind die Kalibrieranker für freie Großprojekte; PPP-Garantien als Vergabeart.
- `sim/katastrophe.ts`: Bebenrisiko des Wohnbestands (Baujahre vor/nach Normen) verbindet g_bauamnestie/g_stadterneuerung mit der Katastrophenkette.
- `sim/diplomatie.ts` (Energie-Außenstrang): Netz-Auslastung speist die Versorgungssicherheitswarnung.
- Karte: Netze sind bereits gezeichnet (OSM-Basis, ui/atlas/vector.ts); Neubau wächst laut KI_PROJEKTE_UND_KARTE Abschnitt 2 (Baustein A).
- Haushalt: Ulaştırma 525,3 Mrd. TL (GLM_1) ist der Etatanker; 2.003 Baustellen als Sichtbarkeitszähler.

## 5. Integrationsvorschläge

### 5.1 Netzlast als Belastungsgröße je Netz (Kernbaustein, schließt an das Belastungsmuster an)

- **Entscheidung:** Keine direkt; sechs Netze (Straße, Bahn, Luft, See, Strom, Wohnen/Klinik) tragen Last- und Kapazitätswerte, die aus Wachstum, Handel, Tourismus und Bevölkerung wachsen. Der Spieler entscheidet an Erweiterungspunkten, die die Bitten-Mechanik (Ministerfluss) ansagt.
- **Folgen:** Überlast erzeugt Reibung im Netz (Wirtschaft, Milieus); Ausbau kostet Kapital, Verwaltung und Jahre (Dauern: PPP vs. Eigenbau). Verlierer bei Nichtausbau: Regionen mit Klemmen; bei Ausbau: kurz Haushalt.
- **Gegenspieler:** Verkehrsministerium, KGM/TCDD-Führung, Betreiber (Garantieforderung), Anwohner (Trassenproteste), Kommunen.
- **Anzeige:** Karte: Belastungsfärbung (KI_PROJEKTE_UND_KARTE Abschnitt 11); Infrastruktur-Akte: Last-/Kapazitätsbalken je Netz; Schreibtisch-Bitten.
- **Daten:** `game/src/data/entwurf_glm/infrastruktur.ts` (Netzobjekte mit belegtem Bestand, Last-Startwerten, Ausbauten).
- **Aufwand:** mittel.
- **Spieltest:** Spaß, wenn eine Überlast sichtbar entsteht (Farbwechsel auf der Autobahn), der Spieler die Bitte bekommt und zwei Jahre später die Entlastung misst; Misserfolg: Balken ohne sichtbare Reibung.

### 5.2 PPP mit Garantiepreisschild (Çanakkale als Kalibrierfall)

- **Entscheidung:** Bei jeder Vergabe (freie Großprojekte und Serien) die Art wählen: Etatbau (teuer, kein Risiko), Schattenmaut-PPP (schnell, Garantiekosten bei zu geringer Nutzung), Konzession mit Einnahmenteilung. Das Spiel zeigt die Garantierisiken offen als Haushaltszeile.
- **Folgen:** Kurz: Bau beginnt schneller; lang: Garantieauszahlungen bei schwachem Verkehr (Beleganker: Çanakkale-Auszahlungen, Beträge zu prüfen). Verlierer: Steuerzahler bei Fehlplanung; Gewinner: Bauindustrie.
- **Gegenspieler:** Betreiberkonsortien (verhandeln Garantien), Rechnungshof (prüft Zahlungen), Opposition („Straßenzins an Konzerne").
- **Anzeige:** Großprojekt-Karte mit Vergabeart und Garantiezeile; Wirkungsbericht nennt Zahlungen.
- **Daten:** `pppModelle` im Entwurfsfile.
- **Aufwand:** klein bis mittel.
- **Spieltest:** Spaß, wenn der Spieler eine schnelle PPP vor einer Wahl wählt und die Garantiezeile zwei Jahre später im Haushalt auftaucht.

### 5.3 Wohnungsrisiko-Karte (Baujahre gegen Normen)

- **Entscheidung:** Stadterneuerungsfahrplan (Provinzweise Priorität: Bebengefahr × Dichte) mit drei Tempi (Marktanreize / Pflichtquote / Anamnestie-Pfad) — Kopplung an g_bauamnestie und g_stadterneuerung.
- **Folgen:** Sanierung senkt Bebenverluste (Katastrophenkette), drückt Mieten kurzfristig hoch (Verdrängung); Anamnestie-Pfad macht alles billiger und riskanter. Verlierer: Mieter in Sanierungsquartieren; Gewinner: Bauwirtschaft.
- **Gegenspieler:** Immobilienwirtschaft, Mieterverbände, Bebeningenieure, Kommunen.
- **Anzeige:** Karte: Risikofärbung je Provinz (Baujahre); Katastrophen-Akte: erwartete Verluste je Szenario.
- **Daten:** `wohnungsrisiko` im Entwurfsfile.
- **Aufwand:** mittel.
- **Spieltest:** Spaß, wenn ein Bebenereignis die Vorarbeit sichtbar honoriert (weniger Tote in sanierten Provinzen) — und eine Anamnestie später their Preis zeigt.

### 5.4 Kliniklücken-Karte (Betten je 1.000 nach Provinz)

- **Entscheidung:** Klinikbau-Serien nach Lückenliste (Metropol-Erweiterung vs. Provinz-Neubau) mit Personal-Kopplung (Ärztemigration als Gegenspieler, GLM_2-Abwanderungskante).
- **Folgen:** Betten je 1.000 steigt lokal, Wartelisten sinken mit Verzug; Neubau ohne Personal bleibt leer (Härte!). Verlierer: kurz Haushalt; Gewinner: Provinz-Milieus.
- **Gegenspieler:** Ärztekammer, Gesundheitsministerium, private Kliniken.
- **Anzeige:** Gesundheit-Linie im Bereichssystem (Existiert); Karte: Betten-Dichte.
- **Daten:** `klinikLücken` im Entwurfsfile.
- **Aufwand:** klein.
- **Spieltest:** Erfolgreich, wenn der Spieler eine Klinik ohne Personalkonzept baut und das Ereignis „Betten ohne Ärzte" es zurückmeldet.

### 5.5 Bahngüterverkehr als Umwelthebel

- **Entscheidung:** Güterverkehr von der Straße auf die Schiene schieben (Kapazitätsausbau, Terminalbau, Frachtzölle): drei Stufen. Beleganker: 13.919 km Netz bei marginaler Güterrolle (Anteil zu prüfen).
- **Folgen:** Straße entlastet (Belastungsgröße 5.1), Unfälle/Abgase −, Industrie logistisch umgestellt; kurz Kosten +. Verlierer: Speditionen; Gewinner: Bahnindustrie, Umwelt-Milieus.
- **Gegenspieler:** Speditionsverbände, LKW-Lobby, TCDD-Führung.
- **Anzeige:** Infrastruktur-Akte: Modal-Split-Balken; Karte: Güterkorridore.
- **Daten:** `modalSplit` im Entwurfsfile.
- **Aufwand:** mittel.
- **Spieltest:** Erfolgreich, wenn die Verlagerung nach fünf Jahren den Autobahn-Belastungsbalken sichtbar senkt.

## 6. Verworfen

- **Feinvermessung aller Straßen je Fahrstreifen:** Provinz-/Netzauflösung reicht; OSM-Basis zeichnet bereits.
- **Eigene Tourismusrechnung hier:** Tourismus als eigener Ausweitungsblock (siehe Abschlussbericht), nicht im Infrastrukturthema versteckt.
- **Fluglinien-Wettbewerbssimulation (THY als Firma):** THY bleibt Realanker; ein Firmenmodell wäre Deko.
- **Wassernetz je Bezirk simulieren:** DSİ-Staudämme als Vorhaben reichen; Bezirkswassernetz ist Verwaltung.
- **Eigene CO₂- und CBAM-Rechnung:** als Kante in GLM_3 (Strommix → Exporte) geführt, keine zweite Umweltmaschinerie.

## 7. Vorbilder

- **Civ 6:** Straßen-/Bahnausbau mit sichtbarer Karte — genau der Neubau-als-Kartenobjekt-Weg (Baustein A).
- **Cities: Skylines (Impression):** Last sichtbar machen (Stau als Farbe) — übernommen in Belastungsfärbung, ohne Mikromanagement.
- **HOI 4:** Infrastruktur-Level je Provinz mit Nachschubwirkung — passt zur Kriegskopplung (Welle K).
- **Victoria 3:** Bahnbau mit Marktanteil der Güter — verworfen in Detail, übernommen als Modal-Split-Balken.

## 8. Unsicher oder unbelegt

1. Stromnetz: installierte Leistung, Netz-km, Spitzenlast — TEİAŞ-Jahresbericht auswerten (Suche lief in Timeout).
2. Flughafenanzahl exakt und Internet/Breitband/5G-Stand — DHMİ/BTK auswerten.
3. Wohnungsbestand: „~42 Mio." aus Portal-Auswertung; TÜİK-Binazensus als Primärquelle einziehen.
4. Pro-Kopf-Wasser (~1.300 m³): gewöhnlich zitiert, TÜİK/DSİ-Primärwert prüfen.
5. Güterbahnteil am Modal-Split: exakte Zahl nicht erhoben.
6. Alle Großprojektkosten (Kanal, Çanakkale-Garantien, Akkuyu): Schätzbänder aus Presse, gegen Auftrags-/Konsortiumsunterlagen prüfen.
7. Betten je 1.000: zwei Lesarten (3,1 Ministeriumszählung vs. ~2,7 OECD-Abgrenzung) — im Quellenmenü beide zeigen.
8. Regionale Betten-/Klinikverteilung je Provinz: Sağlık-Yılligung auswerten.
