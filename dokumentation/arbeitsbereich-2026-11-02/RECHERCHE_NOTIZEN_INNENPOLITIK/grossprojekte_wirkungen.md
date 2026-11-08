# Wirkungsmodelle für Großprojekte (Mega-Infrastruktur) — Methoden, empirische Regelmäßigkeiten, Rechenmodelle

Stand: September 2026. Zweck: Grundlage für das politische Simulationspiel „NWO" (Spieler schlägt per Freitext Großprojekte vor; Simulation/KI berechnet Folgen inkl. Zweitrundeneffekte). Alle Zahlen mit Quelle und Bezugsjahr. Modellparameter als Schätzweiten mit Unsicherheit. Keine erfundenen Elastizitäten.

Hinweis zur Quellenlage (epistemische Ehrlichkeit): Suchmaschinen waren in dieser Session weitgehend blockiert (DuckDuckGo/Mojeek CAPTCHA, Bing lieferte unbrauchbare Treffer). Verifiziert per Webabruf: die unten mit Wikipedia-URLs belegten Türkei-Projekte, Hambantota, Montenegro, Cost-Overrun-Basisdaten. Fachliteraturangaben sind mit **[LK]** markiert (aus Literaturkenntnis des Modells, URL/DOI nicht in dieser Session abgerufen) und gehören in die Gaps-Prüfung des Report-Writers.

## 1. Handelsverlagerung und Hafenwettbewerb: Wie berechnet man „weniger Schiffe in Nachbarhäfen"?

### Takeaway
Handelsverlagerung wird mit dem Gravitationsmodell modelliert (Handel ~ Produkt / Distanz^ε, typische Distanzelastizität ≈ −0,6 bis −1,1, Grenzeffekte mehrfach verzerrend); Hafenkonkurrenz über diskrete Hafenwahlmodelle und Hinterland-Zugkosten. Die empirisch sauberste Messgröße für „Verlagerung" ist die Veränderung von TEU-Schiffseinsätzen/Anläufen je Hafen (AIS-/Alphaliner-Daten), nicht absolute Verkehrsmengen.

### Cited Findings
- Standard-Gravitationsgleichung: T_ij ≈ (Y_i·Y_j)/d_ij^ε mit ε ≈ −1; geschätzte Grenzeffekte (US-Bundesstaaten vs. Staaten) ca. Faktor 4,5; Handel fällt mit Distanz um etwa eine Größenordnung pro Dekade Distanz — Anderson & van Wincoop, „Gravity with Gravitas", AER 93(1), 2003 [LK, DOI 10.1257/000282803321455214].
- Meta-Analyse der Gravity-Literatur über 50 Jahre: Median-Distanzelastizität ≈ −0,9, bemerkenswert stabil; Grenzeffekte 3–8-fach — Disdier & Head, Review of Economics and Statistics 90(3), 2008 [LK].
- PPML-Schätzungen (Verzerrung durch Log-Null-Probleme): BIP-Elastizitäten ≈ 1, Distanzelastizität −0,8±0,3 — Silva & Tenreyro, REStat 88(4), 2006 [LK].
- **Zeit kostet wie Zoll**: ein zusätzlicher Tag Schiffs-/Transitzeit ≙ Zolläquivalent von ca. 0,6–2,1 % des Warenwerts (Durchschnittswerte); Hummels & Schaur, „Time as a Trade Barrier", AER 103(7), 2013 [LK]. Für Hafen-/Kanalprojekte heißt das: Zeitgewinne pro Hafenanlauf sind die wichtigste Nutzenkomponente.
- Hafenwahl ist disaggregiert modellierbar (Verlader/Hinterland/Reeder): Malchow & Kanafani, „A disaggregate analysis of port selection", Transportation Research Part E 40(3), 2004 [LK]; Hafenwahl-Elastizitäten gegenüber Hafengebühren klein, gegenüber Hinterland-Transportkosten und Verlässlichkeit größer [LK, allgemeine Literatur].
- Hafenwettbewerb umschreibt Verlagerungen im Mittelmeerraum als Transshipment-Hub-Wettbewerb (Rotterdam–Antwerpen–Hamburg um Hinterland; Algeciras–Gibraltar–Tanger Med–Piräus um Transshipment); Piräus nach COSCO-Konzession (2008, Mehrheit 2016) starkes TEU-Wachstum — Details/TEU-Reihen [LK, nicht verifiziert; Gaps].
- Panamakanal-Ausbau 2016 (Neopanamax bis ~14.000 TEU): Studien in Journal of Transport Geography/Transportation Research sagten Verlagerung von der US-Westküste (LA/LB) zur Ostküste (Savannah, NY/NJ) über All-Water-Routen voraus; tatsächlich gewannen Ostküstenhäfen Anteile, parallel wuchs der Suez-Weg Asien–Ostküste. Quantitative Verlagerungsstudien [LK, nicht verifiziert; Gaps].
- Verlagerung indirekt belegt am Beispiel Hambantota: Die srilankische Hafenbehörde wies 2012 alle Fahrzeug-Transshipments gezielt von Colombo nach Hambantota um (Entlastung Colombo); 9M/2014 >100.000 Fahrzeuge (+300 % y/y), Anläufe verdoppelten sich auf 161 — [Wikipedia: Hambantota International Port](https://en.wikipedia.org/wiki/Hambantota_International_Port) (Bezugsjahre 2012–2014). Belegt: Eine neu gebaute Kapazität zieht Verkehre nur mit (a) politischer Umweisung oder (b) massivem Kosten-/Zeitvorteil; der ursprüngliche Machbarkeitsbericht (SNC-Lavalin 2002) wurde u. a. verworfen, weil er die Konkurrenz zu Colombo (Container) ignorierte — ebd.
- Bosporus-Verkehr als „Marktgröße" für Kanal İstanbul: 2006–2025 jährlich ca. 41.000 Schiffe; 2019 Rekord bei 638,9 Mio. BRZ und 4.400 Schiffen >200 m; 2025: 619,3 Mio. BRZ, 4.314 große Schiffe (Quelle: türk. Generaldirektion Seeschifffahrt, zit. n. [Wikipedia: Istanbul Canal](https://en.wikipedia.org/wiki/Istanbul_Canal)). Der Kanal ist mit 160 Transits/Tag dimensioniert — d. h. realistisch eine Verlagerung/Umleitung des Bosporus-Verkehrs, kein neuer Weltmarkt.
- „Port hierarchy"/cumulative causation: Hafenrangbildung über Hinterlandgröße, Frequenz und Umwegkosten (detour cost); Richtwerte für Umwegkosten als Zuschlag auf Seefracht (~0,8 %/Tag Umwegzeit, abgeleitet aus Hummels & Schaur) [LK].
- Messung von „weniger Schiffen in Nachbarhäfen": (a) Anläufe (ship calls) und BRZ je Hafen aus Hafenstatistiken/UNCTAD, (b) AIS-basierte Routenverschiebungen (MarineTraffic, Kpler), (c) Containerdaten Alphaliner/Lloyd's List Intelligence (kostenpflichtig), (d) UNCTAD Review of Maritime Transport (jährlich, [UNCTAD](https://unctad.org/topic/transport-and-trade-logistics/review-of-maritime-transport)).

### Inferences
- Für NWO reicht ein „Gravity + Umwegkosten"-Kernel: Δ log(Handel_ij) ≈ ε·Δ log(Transportkosten_ij) + ε_t·Δ log(Transitzeit_ij) mit ε ≈ −0,8…−1,1 und ε_t entsprechend dem Tageszolläquivalent. Verlagerung „Nachbarhafen" = Umverteilung innerhalb des Einzugsgebiets, nicht Schrumpfung des Gesamtverkehrs.
- Hafenprojekte wirken in zwei Märkten: (1) Hinterland-Logistik (gewinnt die Region mit besseren Anschlusskosten), (2) Transshipment-Wettbewerb (Nullsumme über Hubs). Ein „größter Hafen der Welt" ohne Hinterland-/Routenvorteil verschiebt kaum etwas (siehe Hambantota-Fehlplanung: Projiziert wurden 36.000 Schiffe/Jahr entlang der Route vorbei; real blieb der Durchsatz lange gering).
- Empirisch realistische Zweitrundenregel: Neue Hafenkapazität an einer vorhandenen Route entlastet Nachbarhäfen um einen Teil ihres Transshipment-Anteils, wenn Transitzeit/Preis besser; sonst bleibt es Brachkapazität (Fehlinvestition).

### Gaps
- Konkrete Verlagerungsstudien Panamakanal-Ausbau (Journal of Transport Geography etc.) nicht abgerufen — Zahlen zur Ost-/Westküsten-Verschiebung fehlen.
- Piräus-TEU-Reihen, Tanger-Med-TEU, Rotterdam/Antwerpen/Hamburg-Vergleichszahlen nicht verifiziert (Alphaliner/Lloyd's paywalled).
- Empirische Hafenwahl-Elastizitäten (Werte je Zeiteinheit/€) nur qualitativ, keine gesicherten Punktwerte zitierbar.

## 2. Agglomeration und Crowd-out: regionale Gewinner und Verlierer

### Takeaway
Infrastruktur verändert Marktzugänge und damit die regionale Größenverteilung der Wirtschaft: Agglomerationseffekte sind empirisch klein, aber real (Produktivität +3–8 % je Verdopplung der Stadtgröße), und Verlagerungen sind belegt (China-Highway-Netz verlagerte Industrie aus der Peripherie). Neue Kapazität erzeugt oft induzierte statt verlagerte Nachfrage (Straßenverkehr: VKT-Elastizität ≈ 1).

### Cited Findings
- Agglomerations-Elastizität der Produktivität gegenüber Stadtgröße: ca. 3–8 % je Verdopplung (Meta-Schätzung) — Rosenthal & Strange, Journal of Urban Economics 55(2), 2004 [LK].
- Standard-KBA unterschlägt Agglomerations- und Einkommenseffekte; deren Einbeziehung erhöht Nutzen-Kosten-Verhältnisse erheblich — Graham, „Agglomeration economies and transport appraisal", Journal of Transport Economics and Policy, 2007 [LK]; Venables, JTEP 2007 (BIP-Effekte urbaner Verkehrsinvestitionen über dem klassischen Konsumentenüberschuss) [LK].
- Induzierte Nachfrage: „Fundamental Law of Road Congestion" — US-Städte 1983–2003; Autobahn-Kapazität (lane-km) → Fahrleistung (VKT) mit Elastizität ≈ 0,9–1,1; d. h. Neubauten entlasten kurzfristig, füllen sich dann — Duranton & Turner, AER 102(6), 2012 [LK].
- Gewinner/Verlierer-Regionen (empirisch am härtesten belegt): Chinas National Trunk Highway System; verbesserte Marktzugänge zentraler Lagen verlagerten Industrieproduktion aus peripheren Kreisen ab — Faber, „Trade Integration, Market Size, and Industrialization: Evidence from China's National Trunk Highway System", Review of Economic Studies 81(3), 2014 [LK]. Kernbotschaft für NWO: Infrastruktur ist nicht nur positiv-Summe, sie reorganisiert Raum.
- China-Hochgeschwindigkeitsbahn integriert Märkte und Immobilienpreise, verstärkt Zweitrangstädte im Einzugsbereich — Zheng & Kahn, PNAS, 2013 [LK]; Effekte auf breite Regionalindikatoren aber gemischt.
- Deutsche ICE-/spanische AVE-Effekte: Studienlage zeigt kleine bis gemischte makroregionale Effekte; entscheidend ist die Kombination mit Standortfaktoren („Investition allein erzeugt kein Wachstum" — Banister & Berechman, Transport Policy, 2001 [LK]); Spanien: Zeitgewinne wirkten v. a. bei Intermediate-City-Standorten — Ureña et al., Cities, 2009 [LK]. Deutsche ICE-Stadtbilanz-Effekte schwach [LK, Details nicht verifiziert].
- Tourismus: HSR/Flughäfen verlagern Tourismusströme in Metropolen (zunehmende Tagesausflüge), periphere Zielorte können verlieren — qualitative Literatur [LK, ohne verifizierte Zahlen].
- Immobilienpreise: Bahn-/Metrozugang kapitalisiert sich in Grundstückspreisen typischerweise zweistellig in % im Nahbereich — Gibbons & Machin (valuing rail access) [LK].
- Beleg für regionales Crowd-out in der Türkei: GAP-Bewässerung steigerte die Baumwollproduktion der Region Şanlıurfa von 150.000 auf 400.000 t, während andere Regionen zurückgingen — die nationale Gesamtproduktion blieb konstant ([Wikipedia: Southeastern Anatolia Project](https://en.wikipedia.org/wiki/Southeastern_Anatolia_Project), USDA-Daten zit., Bezugsjahr unklar). Direktbeleg: Regionale Investition verlagert Produktion, statt sie zu schaffen.

### Inferences
- Für NWO: Große Infrastruktur sollte immer ein Raum-Umverteilungsmodul haben (Marktzugang-Index je Region; ΔProduktivität ∝ Agglomerationselastizität × Δlog(Marktgröße); Umverteilung entlang einer Kern-Peripherie-Struktur). Ohne dieses Modul fehlt das „Nachbarstädte nehmen ab"-Szenario der Projektvision.
- Induzierte vs. verlagerte Nachfrage trennen: Straßen projizieren ~1:1 induzierte Nachfrage, Häfen/Kanäle eher Verlagerung (Nullsummen-Charakter), Bahn/HSR Mischung.
- Empirisch ehrliche Default-Erwartung für ein Megaprojekt: makroregionale Nettoeffekte kleiner als Proponenten behaupten; Verteilungswirkungen (Gewinner/Verlierer) größer als die Aggregatwirkung.

### Gaps
- Quantifizierte Tourismuseffekte, Immobilienpreiselastizitäten türkischer Projekte (Marmaray, Metro) nicht abgerufen.
- ICE-/AVE-Studien nur qualitativ; keine belastbaren Punktschätzungen zitierbar.

## 3. Kosten-Nutzen von Megaprojekten: Flyvbjerg, Reference Class Forecasting, KBA-Leitlinien

### Takeaway
Empirisch gesetztes „Eisernes Gesetz der Megaprojekte": über Budget, über Zeit, unter Nutzen — „over and over again". Referenzklassen-Kostenüberschreitungen: Schiene ~45 %, Straßen ~20 %, Brücken/Tunnel ~34 % (258 Projekte); Ursachen: Optimism Bias, strategische Fehlkalkulation („survival of the unfittest"), Scope Creep. Gegenmittel der Leitlinien: Reference Class Forecasting, Optimism-Bias-Zuschläge, Szenario-/Sensitivitätsanalyse.

### Cited Findings
- Empirische Grundlage (transport): 258 Verkehrsinfrastrukturprojekte (1927–1998): 9 von 10 Projekten über Budget; mittlere Kostenüberschreitungen: Schiene 44,7 %, feste Querungen (Brücken/Tunnel) 33,8 %, Straßen 20,4 %; kein Lernen über die Zeit; Nachfrageprognosen (v. a. Bahn-Passagiere) systematisch zu hoch — Flyvbjerg, Holm, Buhl, „How Common and How Large Are Cost Overruns in Transport Infrastructure Projects?", JAPA 69(2), 2003 [LK, URL nicht verifiziert, s. Gaps].
- Zweitquelle (abgerufen, enthält dieselbe Literatur): systematische Unterkalkulation in öffentlichen Bauwerken, Ursachentypologie (technisch/psychologisch/politisch-ökonomisch/Value Engineering), politische Erklärungen historisch dominant; IT-Projekte Ø +33–43 %; Sydney Opera House +1.357 % Budget / 10 Jahre später; Berlin BER 1 → 6 Mrd. €; Boston Big Dig +190 %; schottisches Parlament £40 Mio. → £400 Mio.; Olkiluoto 3 Mrd. → 8,5 Mrd. € — [Wikipedia: Cost overrun](https://en.wikipedia.org/wiki/Cost_overrun) (Bezugsjahre jeweils im Eintrag).
- „Underestimating Costs in Public Works Projects: Error or Lie?" — Fehler vs. strategische Fehlkalkulation; arXiv-Version verfügbar: [arXiv:1303.6604](https://arxiv.org/abs/1303.6604); JAPA 68(3), 2002, DOI [10.1080/01944360208976273](https://doi.org/10.1080/01944360208976273) (beide Links via Wikipedia-Eintrag verifiziert).
- Kosten-Überschreitungserklärungen in der Übersicht (theoretisch verankert: Optimi­sm Bias, strategische Fehlkalkulation, Lern-/Lock-in-Effekte) — Cantarelli, Flyvbjerg, Molin, van Wee, EJTIR 10(1), 2010, [arXiv:1307.2176](https://arxiv.org/abs/1307.2176) (via Wikipedia verifiziert).
- Flyvbjerg-Übersicht „What You Should Know About Megaprojects and Why: An Overview", Project Management Journal 45(2), 2014: „Eisernes Gesetz" (over budget, over time, under benefits, over and over again); Nutzenminderungen (benefit shortfalls) und Verzögerungen als gleichgewichtiges Risiko [LK, DOI 10.1002/pmj.21431].
- „Survival of the Unfittest": Projekte mit ex ante überschätztem Nutzen setzen sich im Wettbewerb um Aufmerksamkeit/Budget durch (Winner's Curse bei politischen Projekten) — Flyvbjerg, Oxford Review of Economic Policy 25(2), 2009 [LK].
- Reference Class Forecasting (Kahneman/Flyvbjerg): Prognose über Referenzklasse ähnlicher realisierter Projekte statt Inside-View; Eingang in UK Treasury Green Book (2003/2004, Flyvbjerg & COWI-Bericht „Procedures for Dealing with Optimism Bias in Transport Planning") [LK].
- Optimism-Bias-Zuschläge (Mott MacDonald 2002, Basis der Green-Book-Uplifts) [LK]: Standardgebäude +24 %, Sondergebäude +51 %, Standard-Tiefbau +44 %, Sonder-Tiefbau +66 % (Kosten); Zeitzuschläge +4–20 %. Diese Größenordnungen sind die realistischsten Spielparameter für Kostenexplosion.
- KBA-Methodik (EIB/World Bank): NPV, Nutzen-Kosten-Quotient, interner Zinsfuß (EIRR); Risiko über Szenarien, Sensitivitäts- und Wahrscheinlichkeitsanalyse; Verteilungs- und Umweltwirkungen; Preisanpassung (SHADOWWTP) — EIB „Guide to Cost-Benefit Analysis of Investment Projects" (Ausgaben 2008/2014/2022) [LK, URL nicht verifiziert; Gaps]; World Bank: Project Appraisal Documents / Economic Analysis of Investment Operations [LK].

### Inferences
- Rechenregel für NWO (Kosten): Realisierungskosten = geplante Kosten × (1 + UB + SB), wobei UB ~ Optimism-Bias-Zuschlag (je Projekttyp 20–70 %, zufällig) und SB strategische Fehlkalkulation (abhängig von politischer Dringlichkeit des Spielers: je mehr Prestige, desto höhere systematische Unterkalkulation). Verzögerung: typische Bauzeitüberschreitung +20–100 % bei First-of-a-Kind (Sydney, BER, Marmaray: +4 Jahre wegen Archäologie).
- Nutzenminderung genauso wichtig wie Kostenüberschreitung: Prognostizierte Verkehrsmengen realistisch auf 50–80 % der Vorhersage fallen lassen (siehe Abschnitt 5: YSS-Brücke, Osmangazi-Brücke).
- RCF im Spiel: Wenn Spieler exotische Projekte vorschlagen („größter Hafen der Welt"), Referenzklasse = bisherige Welthafenprojekte inkl. Misserfolge (Hambantota) — die Wahrscheinlichkeitsverteilung der Ergebnisse sollte Schiefverteilung sein (Misserfolg häufig, Ausreißer nach oben selten).

### Gaps
- Die genauen Flvbjerg-2003-Parameter (44,7/33,8/20,4) stammen aus LK; der Abruf bei Taylor & Francis war 403-geblockt. Vor Publikation mit der JAPA-Erstquelle abgleichen (URL/DOI verifizieren).
- EIB- und World-Bank-Leitlinien-URLs nicht abgerufen; Editionsstand 2022/2025 prüfen.

## 4. Finanzierung großer Projekte: Haushalt, PPP, BRI, Schuldenfallen

### Takeaway
Finanzierungsformen verteilen Risiken — und erzeugen eigene politische Zweitrundeneffekte: PPP mit Verkehrsgarantien verschiebt Ausfallrisiko an den Staat (türkische Belegfälle), chinesische Exim-Kredite verbinden Bauvergabe mit Krediten und können in Souveränitätsverlust münden (Hambantota), aber die „debt-trap"-Narrative ist empirisch umstritten. Milliardenprojekte können Staatsanleihen-/Schuldenkrisen antreiben (Montenegro, Sri Lanka).

### Cited Findings
- Türkische BOT/PPP-Muster (abgerufen, Abschnitt 5): Verkehrsgarantien → Staat zahlt bei Verkehrsunterschreitung nach; Yavuz-Sultan-Selim-Brücke: Projekt verfehlte Prognosen, Ankara musste Betreibereinnahmen aus der Staatskasse aufstocken; 2018 Umstrukturierung von 2,3 Mrd. USD Schulden; ICBC refinanzierte 2,7 Mrd. USD; Astaldi verkaufte Anteil für 467 Mio. USD — [Wikipedia: Yavuz Sultan Selim Bridge](https://en.wikipedia.org/wiki/Yavuz_Sultan_Selim_Bridge) (Bezugsjahr 2018).
- Flughafen Istanbul: Konzessionsausschreibung 2013 — 25-Jahres-Betriebspacht von 26,142 Mrd. € inkl. MwSt. (Konsortium Cengiz-Kolin-Limak-Mapa-Kalyon); Projektkostenschätzung 22 Mrd. € (alle Phasen) — [Wikipedia: Istanbul Airport](https://en.wikipedia.org/wiki/Istanbul_Airport) (Bezugsjahr 2013/Planung).
- Hambantota (Sri Lanka): Phase 1 finanziert durch China Exim: 306,7 Mio. USD, 15 Jahre, 6,3 % Zins, Bauvergabe an China Harbour vertraglich festgezurrt; Phase 2: 757 Mio. USD zu 2 %; 2016 kumulierter Hafenverlust 46,7 Mrd. LKR (~696 Mio. USD); 2017 Verkauf von 70–85 % an China Merchants Port für 1,12 Mrd. USD plus 99-Jahres-Pacht — [Wikipedia: Hambantota International Port](https://en.wikipedia.org/wiki/Hambantota_International_Port) (Bezugsjahre 2006–2017). Die Erlöse dienten der Tilgung nicht projektbezogener Auslandsschulden (ebd.).
- „Debt trap"-Debatte: umstritten — die verbreitete Erzählung, China habe Sri Lanka planmäßig in die Übergabe getrieben, wird von Brautigam & Rithmire (The Atlantic, 2021) und Brautigam, Area Development and Policy 5(1), 2019, DOI [10.1080/23792949.2019.1689828](https://doi.org/10.1080/23792949.2019.1689828) empirisch zurückgewiesen (s. Literaturverzeichnis im Wikipedia-Eintrag); dagegen die strategische Lesart (Chellaney u. a.). Für NWO: beide Pfade modellieren (Kreditfall = Mischung aus Projektfehler und Gläubigermacht).
- Montenegro Autobahn Bar–Boljare: 41-km-Abschnitt Smokovac–Mateševo, Kosten ~1 Mrd. USD (>20 Mio. €/km), finanziert über China Exim in USD (Währungsrisiko!), Fertigstellung Juli 2022 vs. geplant 2019 (Verzug); genannte Überschreitungsgründe: USD-Wechselkurs, Verzögerungen, lokale Korruption, chinesische Kreditpraxis; der nächste Abschnitt (Mateševo–Andrijevica, ~22 km, ~700 Mio. €) wird nun von EBRD/EU/Montenegro finanziert, Bau durch chinesisches Konsortium — [Wikipedia: A-1 motorway (Montenegro)](https://en.wikipedia.org/wiki/A-1_motorway_(Montenegro)) (Bezugsjahre 2015–2026).
- PPP-Ökonomie (Theorie): optimale Risikoallokation; Wettbewerb „um das Feld" (Demsetz-Auktion) vs. „im Feld"; Auktion meist überlegen — Engel, Fischer, Galetovic, NBER WP 8869 (2002), [DOI 10.3386/w8869](https://doi.org/10.3386/w8869) (abgerufen); dieselben Autoren haben die Standard-PPP-Lehrbuchanalyse (Buch „The Economics of Public-Private Partnerships") [LK].
- Chinas BRI-Hafeninvestitionen: Boston University Global Development Policy Center führt eine Datenbank chinesischer Auslandsinfrastrukturkredite und Hafeninvestitionen — [BU GDP](https://www.bu.edu/gdp/) (nicht in Session verifiziert; empfohlene Datenquelle für Zahlen).
- Fall Gwadar (CPEC): China Exim/Bau durch China Overseas Ports Holding, 40-Jahres-Betriebskonzession; Nachnutzung bislang gering [LK, nicht verifiziert; Gaps].

### Inferences
- NWO-Finanzierungslogik als Risikomatrix: Haushalt (volles Kostenrisiko Staat, politische Sichtbarkeit hoch), PPP/BOT (Verkehrsrisiko formal privat, aber Garantien sozialisieren es — türkische Belege), ausländische Kreditfinanzierung (Bauvergabe an Gläubigerfirmen, Währungsrisiko, im Default Souveränitätsverlust). Der Spieler sollte die Wahl treffen und die Zweitrunden (Haushaltsloch, Gläubigereinfluss, Garantiezahlungen) erleben.
- Muster aus den Fällen: Projekte mit Verkehrsgarantien erzeugen im Misserfolg stille Staatsschulden (YSS, Osmangazi) — für die Simulation ein kontinuierlicher Haushaltsabfluss statt einmaliger Kosten.

### Gaps
- Gwadar-Zahlen, Umfang chinesischer Hafeninvestitionen (BU-GCI-Datenbank), Weltbank-PPP-Leitfäden (Value-for-Money-Methodik) nicht abgerufen.
- Zins-/Konditionsvergleich EU/EIB vs. chinesische Exim-Bank nur für Hambantota (6,3 %/2 %) belegt.

## 5. Realbeispiele Türkei: Kosten, Verkehr, Wirkung, Quellen

### Takeaway
Die türkische Megaprojekt-Ära (2013–2026) liefert einen fast vollständigen Belegkatalog der Spielmechaniken: Kostenexplosion/Verzögerung (Marmaray ~2×), Verkehrsprognose-Fehlschlag und Garantiezahlungen (YSS, Osmangazi), Korruption- und Arbeitsskandale (Flughafen), umstrittene Ökonomie und Geopolitik (Kanal İstanbul), regionale Umverteilung (GAP), BRI-Nachbarschaftseffekte (Montenegro-Vorbild für Kaukasus-Korridore).

### Cited Findings
- **Kanal İstanbul** (45 km, geplante Kapazität 160 Transits/Tag, Einweihung Baustart Juni 2021): offizielle Kostenangabe ₺75 Mrd. (~10 Mrd. USD, 2019/2021); frühere Budgets 12 Mrd. USD wurden von Stratfor (2013) als „nicht realistisch" bezeichnet; erwartete Einnahmen 8 Mrd. USD/Jahr (Regierungsangabe), von Ökonomen (Boratav) als möglich negativ kritisiert; Finanzierung BOT/PPP geplant; Montreux-Frage: die Regierung erklärte 2018, der Kanal falle nicht unter die Straßendurchfahrtskonvention, was die Mautfrage aufmacht (Kritiker: Solange Bosporus-Durchfahrt frei ist, sind Gebühren unrealistisch); wissenschaftliche IMM-Kritik (Görür/Orhon/Sözen 2020): Erdbeben-/Liquefaktionsrisiko auf 16,2 km Alluvialstrecke, Trinkwasser-/Versalzungsrisiken für Terkos und Sazlıdere, Entsorgung von 53 Mio. m³ Schlick, Marmara-Salinitäts-/Stickstoffveränderung, Flächenverbrauch; Umfrage Istanbul (MAK 2020): 80,4 % dagegen, 7,9 % dafür; Grundstückskäufe von Politikern (Albayrak/Qatar) entlang der Trasse als Korruptions-/Interessenbeleg; Verkehrstabelle Bosporus 2006–2025 siehe Abschnitt 1 — [Wikipedia: Istanbul Canal](https://en.wikipedia.org/wiki/Istanbul_Canal).
- **Marmaray** (76,6 km S-Bahn + Bosporus-Immersed-Tube): Erstschätzung 4,5 Mrd. USD, „final cost almost twice that" (~9 Mrd. USD); Finanzierung JICA (111 Mrd. Yen, 2006) und EIB (1,05 Mrd. €, 2006); Fertigstellung 2013 (Abschnitt 1) bzw. März 2019 (Vollausbau) statt 2009/2015; Verzug u. a. durch Archäologie (Hafen von Theodosius, 8.000 Jahre, 4 Jahre); Nutzung 2019: 124 Mio. Fahrgäste; Fracht: 1. China-Zug durch den Tunnel Nov. 2019 („Iron Silk Road", Transitzeit China–Türkei 30 → 12 Tage) — [Wikipedia: Marmaray](https://en.wikipedia.org/wiki/Marmaray).
- **Yavuz-Sultan-Selim-Brücke** (3. Bosporus-Brücke, eröffnet Aug. 2016): Budget 4,5 Mrd. TRY (~2,5 Mrd. USD, 2013); Erwartung ≥135.000 Fahrzeuge/Tag/Richtung (Projektschätzung); Realität: „failed to meet projections", Staatsaufstockung der Betreibereinnahmen, 2018 Refinanzierung/Verkauf (Abschnitt 4); Maut 2024: ₺70/Pkw; Trassen-/Forstflächen-Kontroverse (75 % Waldflächen), lokale Wasser-/Ökologie-Kritik; Namenskontroverse — [Wikipedia: Yavuz Sultan Selim Bridge](https://en.wikipedia.org/wiki/Yavuz_Sultan_Selim_Bridge).
- **Osmangazi-Brücke** (İzmit-Bucht, eröffnet Juli 2016): Brückenbaukosten ~1,2 Mrd. USD; Gesamtautobahn Gebze–Bursa ~₺11 Mrd. (2010-Vertrag), BOT-Tender 2009, Betreibergesellschaft NOMAYG (Nurol/Özaltın/Makyol/Yüksel/Gocay + Astaldi); Reisezeit Istanbul–İzmir 6 → 5 h (Fahrtlänge −140 km); Realverkehr lt. technischer Dokumentation ~6.000 Pkw-Einheiten/Tag (gegenüber Planwerten weit darunter); geplante Bahntrasse in der Brücke wurde zugunsten einer 4. Fahrspur gestrichen (Lobbyismus-Kritik); Maut 2023 ₺184,50/Pkw; IHI-Unfall 2015 mit Todesfall des japanischen Chefingenieurs — [Wikipedia: Osman Gazi Bridge](https://en.wikipedia.org/wiki/Osmangazi_Bridge) (Bezugsjahre 2009–2023).
- **Flughafen Istanbul** (Eröffnung Okt. 2018, Umzug April 2019): Projektkosten geschätzt 22 Mrd. € (alle Phasen; zweitteuerster Flughafenbau der Welt lt. Eintrag); Pacht 26,142 Mrd. € / 25 Jahre (2013); Verkehr 2025: 84,5 Mio. Passagiere (weltweit Platz 8), 2,09 Mio. t Fracht; Ausbaustufen bis 200 Mio. Pax; Skandale: Arbeitstote (offiziell 55 Stand 2019, inoffiziell >400; Cumhuriyet 2018: >400), Massenproteste Sept. 2018, Gerichtsstillstand 2014 wegen Umweltverträglichkeit; CO₂ 2023: 9,5 Mio. t (Climate TRACE; zweitgrößter Emittent der Türkei) — [Wikipedia: Istanbul Airport](https://en.wikipedia.org/wiki/Istanbul_Airport).
- **GAP (Südostanatolien-Projekt)**: 22 Talsperren, 19 Wasserkraftwerke; installierte Leistung 7.483 MW, Erzeugung 27.166 GWh/a (Tabellen Stand Dez. 2024/März 2026); Bewässerungsziel 17.000 km²; Gesamtkosten ~32 Mrd. USD bzw. ₺190 Mrd. (2020-angepasst); regionale Exporte 2023: 13,66 Mrd. USD (2002: 0,69 Mrd.); Region seit 2004 Nettoexporteur; Baumwollverschiebung (Abschnitt 2); Ilısu: Überflutung Hasankeyf, ~25.000 Umgesiedelte, 50–68 Dörfer; PKK-Anschläge/Finanzkrisen/UN-Embargo Irak als Verzögerungsursachen; staatliche GAP-Investition 2023: ₺84 Mrd. (18,6 % der gesamtstaatlichen Investitionen desselben Jahres) — [Wikipedia: Southeastern Anatolia Project](https://en.wikipedia.org/wiki/Southeastern_Anatolia_Project).
- **Konya-Ovası-Bewässerung (KOP)**: Teil der regionalen Bewässerungsprogramme analog GAP; Zahlen in dieser Session nicht verifiziert (Gaps).
- **Mersin/İskenderun/Çandarlı**: türkische Hafenexpansionen; Çandarlı (nordägäischer Tiefwasserhafen, geplanter Containerhub) als Beispiel für geplante Hafenkonkurrenz zu Piräus/İzmir; Zahlen nicht verifiziert (Gaps).
- **Korridore Richtung Kaukasus/Zentralasien (TRACECA, „Middle Corridor")**: Marmaray und Baku–Tbilisi–Kars als Elemente; geopolitisches Argument (Umgehung Russlands, seit 2022 verstärkt); BTK-Bahn seit 2017; quantifizierte Verkehrswirkung nicht verifiziert (Gaps).
- Veröffentlichungsorte für türkische Zahlen: Verkehrsministerium (UDH Bakanlığı) mit Ausschreibungs-/BOT-Daten, DHMİ (Flughafenstatistik), TCDD, GAP-BKI (gap.gov.tr, Jahresberichte), TÜİK, ÇED-Berichte (Umweltverträglichkeit, z. B. Kanal-İstanbul-ÇED 2019), KGM (Straßenstatistik).

### Inferences
- Türkische Fälle decken alle NWO-Mechaniken ab: (1) Kosten-/Terminrisiko real (Marmaray 2×, +4 Jahre); (2) Verkehrsrisiko real (YSS/Osmangazi weit unter Prognose; Staat zahlt); (3) politische Ökonomie real (Korruption, Landkäufe, Lobbyismus); (4) Verteilung real (GAP-Umverteilung der Landwirtschaft; Istanbul-Konzentration); (5) Umwelt-/Gefahrenkosten real (Erdbeben, Wasser, CO₂). Ein plausibles Spiel sollte jeden dieser fünf Kanäle andocken.
- Nützliche Vorlage „Verkehrsprognose-Fehlschlag": Plan 135.000 Kfz/Tag (YSS) vs. real wenige zehntausend; Osmangazi ~6.000 Pkw-e/Tag. Spielregel: ex-ante-Prognosen ~2–4× über Realität bei prestigeträchtigen PPP-Projekten.

### Gaps
- KOP-Zahlen, Çandarlı-Bauplan/Kosten, Mersin/İskenderun-TEU, TRACECA-Verkehrsstudien: nicht abgerufen.
- Offizielle türkische Evaluierungsstudien (Wirkungsanalysen des Verkehrsministeriums) oft nur auf Türkisch; hier nicht gesichtet.

## 6. Zweitrundeneffekte-Modellierung für Spiele: IO, CGE, System Dynamics, vereinfachte Rechenregeln

### Takeaway
Der akademische Standardweg ist: Transportkostenänderung → Marktzugang → regionale Sektorallokation (CGE/„New Economic Geography") mit Multiplikatoren aus Input-Output-Tabellen für Beschäftigung; für Echtzeit-Spiele genügt ein elastizitätsbasiertes Drei-Modul-System (Verkehr, Region, Haushalt) mit empirischen Schätzweiten als Parametern.

### Cited Findings
- Methodenkanon: (a) Input-Output-Multiplikatoren (BEA RIMS II, europäische VGR-Tafeln; Typ-I/II-Multiplikatoren Beschäftigung/Produktion typ. 1,2–2,5 je Sektor) [LK]; (b) CGE-Modelle (GTAP, TERM, MONASH, REMI) für allgemeine Gleichgewichts- und Verdrängungseffekte [LK]; (c) Regionalmodelle/Marktzugangs-Modelle in der Tradition von Redding & Turner, „Transport Costs and the Spatial Organization of Economic Activity", Handbook of Urban and Regional Economics, 2015 [LK]; (d) System Dynamics (Vensim) für Feedback-Schleifen (Kostensteigerung ↔ Politik ↔ Verkehrsnachfrage) — [Vensim](https://vensim.com); (e) Verkehrsnetzmodelle (4-Stufen-Modell) für Verlagerung zwischen Korridoren.
- Empirische Basisparameter (aus Abschnitten 1–2, hier als Spielregeln): Distanzelastizität Handel −0,8…−1,1; Zeit≈Zoll 0,6–2,1 %/Tag; Agglomeration +3–8 %/Verdopplung Marktgröße; induzierte Straßennachfrage ~1; Kostenüberschreitung Typen s. Abschnitt 3 (Zuschläge 20–70 %).
- Umwelt-/Flächenkosten: Emissionsfaktor Bau (embodied carbon) und Betrieb; Belegwert Flughafen Istanbul 9,5 Mio. t CO₂/a (2023, Climate TRACE, via [Wikipedia: Istanbul Airport](https://en.wikipedia.org/wiki/Istanbul_Airport)); Flächenverbrauch als Spielvariable über Hektar-Bedarf je Projekttyp (Bewässerung GAP: 17.000 km² Ziel; Kanal: Trasse + Baufläche; Hafen: Terminal+Hinterland).
- Nutzen-Kosten-Formel nach Leitlinienpraxis (EIB/World Bank) [LK]: NPV = Σ_t (B_t − C_t)/(1+r)^t mit r ≈ 3,5–5 % Sozialzeitpräferenz (EIB-Standard ~3 % real + Risikozuschläge), Nutzen aus Zeitersparnis (Wert der Zeit × Verkehr), Betriebskostenersparnis, externe Effekte (CO₂, Unfälle, Lärm) mit Standardpreisen („Handbook on External Costs of Transport", European Commission/JRC, 2019) [LK].

### Inferences
- Vorgeschlagene NWO-Heuristik (elastizitätsbasiert, deterministisch + Rauschen):
  1. **Verkehrsmodul**: ΔKosten/Zeit je Korridor → ΔVerkehr je Gravity/Umwegkosten (Verlagerung); induzierte Nachfrage auf Straße (Elastizität ~1), Nullsumme bei Häfen (Transshipment), gemischt bei Bahn.
  2. **Regionalmodul**: ΔMarktzugang je Region → ΔBeschäftigung über Sektor-Multiplikatoren (1,2–2,5) plus Agglomerationsbonus (3–8 %/Verdopplung); Nachbarregionen mit halbem Gewicht negativ (Crowd-out, empirisch: GAP-Baumwolle, Faber-China).
  3. **Projekt-Risikomodul**: Kosten × (1 + UB + SB), UB 20–70 % je Typ, Bauzeit +20–100 %, Verkehr realistisch 25–60 % der Prognose bei Prestigeprojekten; Korruptionsereignis mit Wahrscheinlichkeit steigend mit Budget und Zeitdruck.
  4. **Haushaltsmodul**: BOT-Garantien als kontinuierliche Zahlungsverpflichtung bei Verkehrsunterschreitung; ausländische Kredite als Währungs-/Souveränitätsrisiko.
  5. **Umweltmodul**: CO₂ (Bau + Betrieb), Flächenverbrauch, Wasser; als Kostenposten und politischer Stimmungstreiber.
- Unsicherheit im Spiel als sichtbare Konfidenzbandbreite pro Vorschlag darstellen (RCF-Prinzip): „Erwartete Kosten: 12–25 Mrd. USD (Referenzklasse: Welthäfen), Überschreitungswahrscheinlichkeit ~90 %".

### Gaps
- IO-Multiplikatoren für die türkische Volkswirtschaft (TÜİK-VGR-Tafeln) nicht beschafft; RIMS-II/EC-Preise für externe Effekte nicht abgerufen (Referenzen [LK]).
- Keine CGE-Studie zur Türkei (Wirkung von GAP/Infrastruktur auf regionale Verteilung) gesichtet.

## 7. Spiele-Praxis: Großprojekte in Strategiespielen

### Takeaway
Etablierte Strategiespiele bauen Großprojekte als deterministische Kosten/Nutzen-Setzkästen (Civilization-Wunder, HOI4-Infrastruktur, Anno-Ketten); Städtesimulationen (Cities Skylines, Workers & Resources) sind bei Bau-Logistik realistisch, aber ohne makroökonomischen Zweitrunden-CBA. Ein Spiel mit freier Projekt-Eingabe und berechneten Folgen ist im bekannten Marktumfeld nicht dokumentiert — NWOs Freitext+KI-Ansatz wäre neu (Stand der Sichtung: Sept. 2026, Marktrecherche nicht vollständig möglich, s. Gaps).

### Cited Findings
- Civilization-Reihe: Wunder als einmalige, teure Bauten mit festen Effekten (ohne Crowd-out, ohne Kostenüberschreitung); CIV6-Politik-Karten/Kongresse erzeugen diplomatische Zweitrunden; kein dynamisches Wirtschaftsmodell der Regionen [LK, Genre-Wissen].
- Hearts of Iron IV: Infrastruktur/Bahn als level-basierte Versorgungssysteme (Supply), Wirkung deterministisch auf Armeelogistik; keine privaten Verlagerungseffekte [LK].
- Cities: Skylines / Workers & Resources: Soviet Republic: realistische Bau-Logistik (Material, Arbeitskräfte, Transportketten in W&R), aber Mikro-Stadtebene, keine nationalen Handels-/Verlagerungsmodelle; Transport Fever 2: Netzwerkeffekte auf Frachtrouten (nah an Hafenwettbewerb) [LK].
- Anno 1800: Produktionsketten und Frachtlogistik, elegante Zweitrunden in der Versorgung, aber keine Verkehrsprojekt-Kosten-Nutzen-Rechnung [LK].
- Politiksimulationen (Democracy-Reihe): Maßnahmen mit vorgegebenen Parametern und Feedback über Umfragewerte/Budget; keine freien Großprojekteingaben [LK].
- Spiele mit freier Text-/Projekteingabe und berechneten Folgen: keine belastbar dokumentierte Ausprägung im Strategiespielbereich gefunden; experimentelle LLM-Spiele (z. B. KI-generierte Ereignisse) existieren, aber nicht mit ökonomischem Kalkül; Recherche unvollständig (Suchmaschinen blockiert) — Gaps.

### Inferences
- Differenzierungsmerkmal für NWO: der „Projektvorschlag als Text → Referenzklassenschätzung (Kosten, Zeit, Verkehr) → Zweitrunden (Verlagerung, Crowd-out, Haushalt, Korruption, Umwelt) → sichtbare Verlierer"-Loop. Die Härte des echten Lebens kommt aus dem Risikomodul (Abschnitt 3/6), nicht aus Menge an Einträgen.
- Lernkurve aus Spiele-UI: Wunder/Ereignisse brauchen (a) ex-ante-Prognoseanzeige mit Konfidenzband, (b) ex-post-Evaluierung („Ist-Kosten vs. Prognose"), (c) regionale Gewinner/Verlierer-Karte.

### Gaps
- Systematische Game-Design-Literatur zu Großprojekten (GDC-Vorträge, „Playing with Realism") nicht gesichtet; Marktübersicht 2025/26 (LLM-gestützte Strategiespiele) nicht verifizierbar gewesen.

## Quellenstatus (Kurzübersicht für den Report-Writer)

**Per Webabruf verifiziert (Wikipedia mit Originalreferenzen, Stand 2026):** Istanbul Canal, Marmaray, Yavuz Sultan Selim Bridge, Osman Gazi Bridge, Istanbul Airport, Southeastern Anatolia Project, Hambantota International Port, A-1 motorway (Montenegro), Cost overrun (inkl. Flyvbjerg-2002-/Cantarelli-arXiv-Links), NBER WP 8869 (Engel/Fischer/Galetovic).

**[LK] — aus Literaturkenntnis, URL/DOI nicht abgerufen, vor Publikation verifizieren:** Anderson & van Wincoop 2003; Disdier & Head 2008; Silva & Tenreyro 2006; Hummels & Schaur 2013; Flyvbjerg/Holm/Buhl 2003 (JAPA 69(2)); Flyvbjerg 2014 (PMJ 45(2)); Flyvbjerg 2009 (OREP 25(2)); Mott MacDonald/Green-Book-Uplifts; Rosenthal & Strange 2004; Graham 2007; Venables 2007; Duranton & Turner 2012; Faber 2014 (REStud 81(3)); Zheng & Kahn 2013; Banister & Berechman 2001; Ureña et al. 2009; Malchow & Kanafani 2004; EIB/World-Bank-Leitlinien; BU-GCI; UNCTAD-RMT/Alphaliner-Verkehrsdaten; Genre-Wissen Spiele.
