# NWO — Referenzanalyse der Kernspiele: HOI4, Democracy 4, Suzerain

Stand: 20. Oktober 2026. Ergänzung zu [REFERENZANALYSE.md](REFERENZANALYSE.md), [REFERENZ_SPIELGEFUEHL.md](REFERENZ_SPIELGEFUEHL.md) und [REFERENZ_METHODE.md](REFERENZ_METHODE.md). Grundlage sind öffentliche Wiki-Seiten, Handbücher, Store-Texte, Dev Diaries und datierte Reviews; **keine eigenen Spieltests**, keine Patchstand-Messungen. Wertungen sind als solche gekennzeichnet. Keine Rechtsberatung.

## 0. Warum diese drei Spiele?

NWO will drei Dinge gleichzeitig: **materielle Stratstrategie** (HOI4), **transparente Politikfolgen** (Democracy 4) und **Figuren/Ton** (Suzerain). Die drei Spiele sind keine Vorbilder für das Ganze, sondern jeweils für eine Achse. Wer sie kopiert, bekommt einen Klon; wer ihre Prinzipien isoliert, kann daraus ein eigenes Spiel bauen.

## 1. Hearts of Iron IV

### 1.1 Core Loop

HOI4 ist ein Grand-Strategy-Kriegsspiel: Land wählen, Fokusbaum abarbeiten, forschen, bauen, produzieren, Divisionen designen, Diplomatie und Krieg führen, Friedenskonferenz. Die Zeit läuft in Tagen; ein Fokus dauert typischerweise 35 oder 70 Tage, es läuft immer nur **ein** Fokus gleichzeitig, mit bis zu 10 Tagen Gnadenfrist ([HOI4 Wiki: National Focus](https://hoi4.paradoxwikis.com/National_focus)).

Die Minute-to-Minute-Entscheidung ist oft: „Welchen Fokus starte ich, welche Fabrik baue ich, welche Division ausrüsten, wo verschiebe ich Truppen?" Der Rhythmus entsteht weniger durch schnelle Entscheidungen als durch die Angst, die Vorbereitung falsch priorisiert zu haben.

### 1.2 Systeme

- **Fokusbäume:** Lineare Pfade mit exklusiven Ästen, 70-Tage-Timer, politische Punkte. Sie geben Richtung, aber auch Wartezeit.
- **Industrie:** Zivilfabriken erzeugen Bauleistung, Handel und Konsumgüter; Militärfabriken Ausrüstung; Werften Schiffe. Die Wirtschaft ist Kriegswirtschaft.
- **Division Designer:** Bataillone, Support, Organisation, Panzerung, Durchschlag; Änderungen kosten Armee-XP.
- **Versorgung:** Supply-Hubs, Eisenbahnen (15–35 Supply), Motorisierung (0/40/80 Trucks), Züge, Konvois. Ein Hub kostet 20.000 CIC; Infrastruktur 6.000 CIC pro Stufe; Rail-Konvertierung 5–10 Tage ([HOI4 Wiki: Logistics](https://hoi4.paradoxwikis.com/Logistics)).
- **Diplomatie:** Fraktionen, Garantien, Lend-Lease, Waffenmarkt.
- **Friedenskonferenz:** War Participation wird zu War Score; mehrere Runden; Forderungen kosten Staatswert × Modifikatoren; überbotene Forderungen werden zu Contests ([HOI4 Wiki: Peace Conference](https://hoi4.paradoxwikis.com/Peace_conference)).
- **KI:** Schwierigkeit ist explizit ein Bonus-/Malus-System; auf „Elite" erhält die KI u. a. mehr Supply und weniger Treibstoffverbrauch ([HOI4 Wiki: Difficulty](https://hoi4.paradoxwikis.com/Difficulty)).

### 1.3 Stärken

- **Materielle Rückkopplung:** Absichten kosten Fabriken, Ausrüstung, Zeit und Supply. Politik wird zur Ressourcenfrage.
- **Lesbare Mittelfristplanung:** Der Fokusbaum zeigt Meilensteine und exklusive Wege.
- **Wiederspielbarkeit:** 1936-Start, Alternativgeschichte, viele Nationen, Mods.
- **Markt:** 360.611 Steam-Reviews, 323.997 positiv (89,8 %); 35.867 gleichzeitig Spielende, Allzeit-Peak 93.196 (Oktober 2024); Monatsmittel 2026 stabil bei 34.000–39.000 ([SteamCharts](https://steamcharts.com/app/394360), [Steam API](https://store.steampowered.com/appreviews/394360?json=1), Abruf 20.10.2026).

### 1.4 Schwächen

- **Einstieg/UI:** Die Informationsdichte ist nicht hierarchisiert; wichtige und dekorative Zahlen konkurrieren. GameStar nennt die wiederkehrende Einarbeitungszeit als Hürde und vergibt 86/100 ([GameStar, 22.11.2024](https://www.gamestar.de/artikel/hearts-of-iron-4-dlc-goetterdaemmerung-test,3423260.html)).
- **Historische Determiniertheit:** Fokusbäume erzählen Geschichte als linearen Pfad und privilegieren militärische/politische Abkürzungen; soziale und kulturelle Phänomene fallen heraus (Pennington 2022, [DOI](https://doi.org/10.17870/bathspa.00014679); Si 2026, [DOI](https://doi.org/10.1177/15554120261489829)).
- **DLC-Power-Creep:** Die Basisversion hat nur für neun Nationen eigene Bäume; DLCs ergänzen Dutzende, teils mit exklusiven Mechaniken. Das ist inhaltliche Asymmetrie, kein sauber gemessener Power-Creep — der Verdacht ist begründet.
- **KI-Boni:** Schwierigkeit wird über Boni geregelt; das ersetzt Verhalten, nicht Intelligenz.
- **Friedenskonferenz:** Punkte, Runden und Überbietungslogik; Foren nennen sie „stupid" ([Steam-Diskussion](https://steamcommunity.com/app/394360/discussions/0/691994648689849233/)). Sie fühlt sich wie eine Auktion an, nicht wie eine Verhandlung.
- **Supply-Frust:** Das 1.11-System ist realistischer, aber intransparent; die Wiki selbst warnt vor Mikromanagement und marginalen Effekten.
- **Fokus-Linearität:** Ein Fokus gleichzeitig, 70 Tage, exklusive Äste; hohe Bindung, aber niedrige Entscheidungsdichte.
- **Late Game:** Performance und Mikroverwaltung werden zum Problem; das ist kein Messwert, sondern eine verbreitete Wahrnehmung.

### 1.5 Was NWO übernehmen sollte

1. **Karte als materielle Wirkungsfläche:** 81 Provinzen, Verkehr, Energie, Verwaltungsreichweite; keine Hexes.
2. **Fokus-/Ereignisstruktur als mittelfristige Selbstbindung:** Regierungsprogramm mit 90-Tage-Meilensteinen und exklusiven Reformpfaden, aber ohne 70-Tage-Timer.
3. **Versorgung als Engpasskette:** zivile Lieferketten (Kliniken, Lehrer, Busse), nicht Militär-Supply.
4. **Materialkette:** Absicht → Haushalt → Beschaffung → Ausbildung → Einsatz; jede Stufe mit Kapazität und Verzug.
5. **Geheimdienst als Informationsunsicherheit:** unzuverlässige Berichte, Medien, Opposition — nicht Kriegsnebel.
6. **Friedensverhandlung als Negativbeispiel:** Verhandlung mit Mandat, Vetospielern und Ratifikation statt Punkteauktion.
7. **KI als sichtbarer Akteur mit gleichen Regeln und erklärbaren Zielen.**

### 1.6 Was NWO nicht übernehmen darf

- Divisions-, Panzer- und Flugzeugdesigner.
- Friedenskonferenz-Punkte.
- 70-Tage-Fokus-Locks und lineare Bäume.
- KI-Boni.
- Krieg als einzigen Siegpfad.
- DLC-exklusive Kernmechaniken.
- Provinz-Supply-Mikromanagement.

### 1.7 NWO-Spezifikationen

- **Informationshierarchie:** drei Ebenen (Lagebild, Akte, Detail); höchstens sieben Primärkennzahlen; jede Zahl mit Quelle, Datum und Konfidenz; ein „Was ändert sich diese Woche?"-Digest.
- **Entscheidungsdichte:** mindestens eine echte Entscheidung pro fünf Minuten; höchstens drei offene Entscheidungen; zwei bis vier Optionen mit Kosten, Gewinnern/Verlierern, Verzug und Unsicherheit; keine „Weiter"-Buttons.
- **Peaceful Loop:** Legitimität, Haushalt, Koalition, Service Delivery, Wachstum, Ungleichheit; 90-Tage-Quartale, Jahresbudget, Wahlen, Krisen; Krieg ist eine Option, nicht die Achse.
- **KI:** gleiche Regeln, keine Ressourcen aus dem Nichts; begrenzte Rationalität; sichtbare Absichten; Erklärungen; Gedächtnis für Zusagen.
- **Content-Pipeline:** Datenschema + Event-Templates + Länderpakete; Baseline-Parität; keine Mechanik exklusiv hinter DLC; Simulation und Inhalt getrennt versionieren.
- **LLM-Schicht:** Intent → geprüfte Aktion; Vorbedingungen, Rechtsgrundlage, Kosten, Koalitionsverträglichkeit; keine erfundenen Zahlen; Ablehnung mit Begründung.
- **Messgrößen:** Time-to-first-meaningful-decision < 10 Min.; Anteil der Wochen mit echter Wahl; Klicks pro Quartal; Erklärungsabdeckung; LLM-Validierungsrate; Save/Load-Konsistenz.

## 2. Democracy 4

### 2.1 Core Loop

Runde = drei Monate; der Spieler setzt Politik über Slider, zahlt politisches Kapital, wartet Implementierung ab und stellt sich alle fünf Jahre zur Wahl. Das Spiel ist explizit als Sandbox gerahmt, nicht als Sieg-Zyklus: „not a game about simply winning an election, but about running the country" ([Steam](https://store.steampowered.com/app/1410710/Democracy_4/), Vollrelease 13.01.2022).

### 2.2 Systeme

- **Politiknetz:** Ein gerichteter Graph aus Objekten und Effekten, weitgehend in CSV geladen. Ein Effekt hat die Form `Ziel,0.04+(0.04*x),4`; die letzte Zahl ist die Trägheit („inertia 4" = Mitteilung über vier Runden). Die tatsächliche Wirkung wird zusätzlich durch Implementierungsstand und Ministerkompetenz gedämpft ([Positech: Modding Basics](https://www.positech.co.uk/democracy4/modding.html)).
- **Politikdatei:** `policies.csv` enthält je Politik Introduce/Cancel/Raise/Lower (Kosten in politischem Kapital), Department, Implementation, MinCost/MaxCost und `Opposites` — widersprüchliche Politiken werden beim Einführen automatisch storniert ([Positech: Modding Policies](https://www.positech.co.uk/democracy4/mod_policies.html)).
- **Wählergruppen:** Tausende virtuelle Wähler, überlappende Gruppen (Kapitalisten, Mittelverdiener, Reiche, Arme, Bauern, Pendler, Selbstständige), gruppenspezifische Reaktionen ([Guardian, 02.07.2024](https://www.theguardian.com/games/article/2024/jul/02/i-simulated-each-uk-partys-first-years-in-government-in-a-video-game-and-the-results-were-awful)).
- **Minister:** Zuständigkeit beeinflusst Kosten, Implementierungsdauer und Effektstärke; ein Community-Leitfaden beschreibt Loyalität, Kettenrücktritte und einen verdeckten Eignungswert ([Positech-Forum, 26.02.2022](https://forums.positech.co.uk/t/a-guide-to-minister-strategy-development-comments-for-ministers/18302)).
- **Medien/Haushalt:** Medienberichte, Koalitionen, Notstandsbefugnisse, Forderungen von Ministern/Donoren; der Haushalt ist eine Aggregation von Politik-Kosten und -Einnahmen plus GDP/Schulden/Kreditrating. Eine doppelte Buchführung ist nicht belegt.

### 2.3 Stärken

- **Schneller Loop:** Man kann in einer Stunde eine ganze Partie spielen.
- **Breites Politikmenü:** Viele Stellschrauben, klare Kosten, explizite Latenzen.
- **Minister als Reibung:** Zuständigkeit und Kompetenz verändern die Umsetzung.
- **Modbarkeit:** CSV, Steam Workshop; das Spiel ist als Lernmedium etabliert.
- **Markt:** 4.000 englische Reviews, 83 % positiv (Steam, 20.10.2026); Bildungslizenzen ([Positech](https://www.positech.co.uk/democracy4/)).

### 2.4 Schwächen

- **Optimale Strategie statt Zielkonflikt:** Cliff Harris räumte selbst ein, die perfekte Law-and-Order-Strategie sei, Härte zu behaupten, ohne zu handeln ([Washington-Post-Reprint, 04.08.2020](https://dailytimes.com.pk/649189/embrace-the-weird-career-of-a-politician-in-engrossing-government-sim-democracy-4/)).
- **UK-Zentrismus ohne Regionen:** Schottland und Wales werden nicht einzeln modelliert; regionale Parteien sind nicht abbildbar (Guardian).
- **Effekte ohne Bilanzidentität:** Additive Prozentboosts; deshalb „flach".
- **Versteckte Gewichte:** Die Oberfläche suggeriert Transparenz, die Parameter bleiben oft dunkel.
- **Automatische `Opposites`:** Widersprüchliche Politiken werden storniert, statt bepreist — das Gegenteil von „Wege statt Verbote".
- **Weiche Balance:** Ein Erstlauf gewann die erste Wahl mit 80 % ([Steam-Diskussion, 01.06.2023](https://steamcommunity.com/app/1410710/discussions/0/3843305519475531059)).
- **Die Formel „Fixed Britain in 1 hour"** ließ sich in den zugänglichen Quellen nicht belegen; belegt sind der 80-%-Erstlauf und der Thread „Is Democracy 4 too easy?".

### 2.5 Was NWO übernehmen sollte

- **Transparente Ketten:** Jede Zahl muss auf eine Quelle, eine Gleichung und einen Akteur zurückführbar sein.
- **Salienz und Verlierer:** Nicht „die Bevölkerung" reagiert, sondern Gruppen mit unterschiedlichen Prioritäten.
- **Minister als Akteure:** Aber mit eigenen Zielen, nicht als Modifikatoren.
- **Modding als Lebensdauer:** Datengetriebene Inhalte von Anfang an mitdenken.
- **Latenzen:** Dreistufig: Beschluss → Umsetzung (3–12 Runden) → Wirkung (2–8 Quartale); Sofortwirkungen nur bei Dekreten/Notstand.

### 2.6 Was NWO nicht übernehmen darf

- Slider als Hauptinteraktion.
- Versteckte Gewichte.
- Ein Land als Startwerte-Set.
- Automatische Stornierung von Widersprüchen.
- Prozentboosts ohne Bilanz.
- Die Annahme, dass eine Stunde Spielzeit eine ganze Staatsführung abbildet.

### 2.7 NWO-Spezifikationen

- **Politiknetz-Transparenz:** Jede Kante erhält Einheit, Vorzeichen, Verzögerung, Bedingung, Quelle und Konfidenz. Die Wirkungsakte zeigt Top-5-Treiber plus Restgröße, keine Punktprognose, sondern P10/P90-Band.
- **Regionalisierung:** 81 Provinzen; nationale Werte sind bevölkerungsgewichtete Aggregate provinzialer Bestände, kein separates Nationalmodell.
- **Wählergruppen:** 8–12 überlappende Gruppen mit regionaler Mitgliedschaft; eine Restgruppe „Alle" nur für universelle Lasten; Gedächtnis mit Halbwertszeit von 4–8 Quartalen.
- **Ministerkompetenz:** Drei sichtbare Werte (Fachkompetenz, Loyalität, Management), ein sichtbares Interesse; Kompetenz ändert Kosten, Dauer und Qualität, nicht die Wirkungsrichtung.
- **Feedback:** Quartalsbericht „Was hat sich geändert — und warum": Prognose vs. Ist, Abweichungslog, drei größte Fehlerquellen.
- **Wege statt Verbote:** Keine Auto-Stornierung; Widersprüche erzeugen Reibung (Kosten, Klagen, Koalitionsbruch).
- **Test:** Keine Einzelpolitik gewinnt > 60 % der Testläufe; 80 % der Testspieler benennen nach einer Krise die drei Haupttreiber.

## 3. Suzerain

### 3.1 Core Loop

Kapitelweise Gespräche, Kabinettssitzungen, Dekrete, Budgetentscheidungen; Ressourcen wie Budget und öffentliche Meinung werden über Szenen bewegt, nicht über Slider. Release 04.12.2020, Metacritic 81, laut Steam „1 Million+-word" Text, 50+ Figuren, 9 Haupt- und 25 Nebenenden ([Steam-API](https://store.steampowered.com/api/appdetails?appids=1207650), Abruf 20.10.2026).

**Vorsicht bei der Wortzahl:** Die Projektrecherche nannte früher 450.000 Wörter; Steam wirbt mit 1 Mio.+ Wörtern. Die Zahl ist marketingabhängig und nicht unabhängig verifiziert. Für NWO zählt die Größenordnung: Suzerain ist ein sehr großes Textspiel, kein Maßstab für eine Ein-Personen-Produktion.

### 3.2 Stärken

- **Figuren und Ton:** Minister, Berater, Gegner haben Stimme, Eigeninteresse und Geschichte.
- **Moralisches Gewicht:** Entscheidungen haben persönliche und politische Kosten.
- **Kabinettsgespräche:** Politik wird als Gespräch erlebt, nicht als Slider.
- **Dilemmas:** Es gibt nicht immer eine richtige Antwort; verschiedene Wege sind vertretbar.
- **Markt:** 7.264 englische Reviews, 93 % positiv; SteamSpy schätzt 500.000–1.000.000 Besitzer (**Schätzung**); Torpor nennt 1,8 Mio. Spieler, nicht Verkäufe ([Berlin.de, 08.10.2026](https://www.berlin.de/gamescapital/interviews/gcb-inside-with-ata-sergey-nowak-1722522.en.php)).
- **Erweiterbarkeit:** Rizia-DLC, „The Neutral Lens", Galmland, Strategiespinoff „Wars of Suzerain"; Rizia trippelte die Concurrents von 1.000 auf 3.400 ([RPS, 15.07.2026](https://www.rockpapershotgun.com/weve-seen-how-close-you-can-get-how-studio-closures-pushed-suzerains-maker-to-create-two-new-dlcs-and-a-turn-based-strategy-spinoff)).

### 3.3 Schwächen

- **Blackbox-Ökonomie:** Budgetposten, Dekrete, Staatsbetriebe, Wachstumsprognose; die Formeln sind nicht offengelegt. Spieler berichten, die Ökonomie kippe nach sachfremden Dekreten; die Community empfiehlt Guides, weil der „projected growth indicator" bewusst vage sei ([Steam-Diskussion, 02.04.2024](https://steamcommunity.com/app/1207650/discussions/0/4358995462056615367)).
- **Verdeckte Schwellen:** Der Fehler wird sichtbar, die Ursache nicht; das erzeugt Trial-and-Error.
- **Versteckter „richtiger Weg":** Wiederspielbarkeit entsteht stark aus Meta-Wissen („Reformist Run"-Guides).
- **Content-Kosten:** 50+ Figuren, 1 Mio.+ Wörter, viele Szenen; für eine Person nicht reproduzierbar.
- **Wenig System:** Karte, Wirtschaft und Militär sind Kulisse; die Welt reagiert, simuliert aber nicht.
- **Patchstand unsicher:** 3.1.0 Build 133 ist belegt, das genaue Datum war nicht sauber auslesbar.

### 3.4 Was NWO übernehmen sollte

- **Figuren und Ton:** Die Mentorin, Minister und Journalisten müssen wie Menschen klingen.
- **Moralisches Gewicht:** Entscheidungen müssen persönliche Kosten haben; nicht jede Folge ist eine Zahl.
- **Kabinettsgespräche als Kern:** Der Schreibtisch und das Gespräch sind die Heimat, nicht das Spreadsheet.
- **Autorisierte Schlüsselszenen:** Nicht alles procedural; die wichtigsten Momente werden geschrieben.
- **Deferred consequences:** Entscheidungen kehren später zurück; Figuren erinnern sich.

### 3.5 Was NWO nicht übernehmen darf

- Blackbox-Folgen.
- Versteckte richtige Pfade.
- 1-Mio.-Wörter-Content-Budget.
- Die Annahme, dass Erzählung Simulation ersetzt.
- Authored memory ohne systemisches Gedächtnis.

### 3.6 NWO-Spezifikationen

- **Figurengedächtnis:** Event-Sourced: Zusagen, Kränkungen, Schulden mit Tags; Szenenauswahl über Zustand, nicht über Kapitelnummer. Test: Ein Minister zitiert in Runde 30 eine Zusage aus Runde 6 korrekt.
- **Szenen-Grammatik:** Jede Szene muss mindestens eine Zustandsvariable oder eine Beziehung verändern, sonst wird sie gestrichen.
- **Erzählungsdosis:** 20–30 % Spielzeit in Szenen, 70–80 % Karte/Akte; eine große Dilemma-Entscheidung alle zwei bis drei Runden.
- **Content-Budget:** Pro Kampagne (20 Quartale): 40–60 große Dilemmata, 25 Krisen, 10 Figuren-Arcs, 120 Politiken, 200k Wörter authored + Templates (Schätzung).
- **Konsequenz-Transparenz:** Jede Folge zeigt Ursache, Beteiligte, Unsicherheit, Verlierer.

## 4. Synthese: Die NWO-Formel

| Achse | Stärkstes Vorbild | NWO-Übernahme | NWO-Grenze |
|---|---|---|---|
| Materielle Knappheit | HOI4 | Umsetzungskapazität, Lieferketten, Verzug | Keine Kriegswirtschaft, keine Unit-Spam |
| Politiktransparenz | Democracy 4 | Politikgraph, Latenzen, „Warum"-Ketten | Keine Slider, keine versteckten Gewichte |
| Raum | Civilization VI | Standortlogik, Projektwirkungen, Delegation | Keine Hex-Yields, keine Sieg-Rennen |
| Figuren/Ton | Suzerain | Character Bible, Kabinettsszenen, moralisches Gewicht | Keine Blackbox, kein 1-Mio.-Wörter-Budget |
| Aufmerksamkeit | Old World | Kabinettskapazität, Delegation | Kein 4X-Orders-System |
| Druck | Frostpunk | Krisenketten, irreversible Entscheidungen | Kein Survivalspiel |
| Erinnerung | CK3 | kleiner Figurenkreis, Zusagen, Kosten für Verrat | Keine Trait-Flut, kein Dynastie-Spiel |

**Die Formel:** NWO muss die **Kausalkette selbst zum Produkt** machen. Der Spieler soll nach jeder Entscheidung drei Fragen beantworten können: Wer zahlt? Wann? Warum? Wenn das Spiel diese drei Fragen nicht in höchstens fünf Gliedern beantworten kann, ist es entweder zu flach oder zu kompliziert.

## 5. Quellen und Unsicherheiten

- HOI4: [National Focus](https://hoi4.paradoxwikis.com/National_focus), [Peace Conference](https://hoi4.paradoxwikis.com/Peace_conference), [Logistics](https://hoi4.paradoxwikis.com/Logistics), [Difficulty](https://hoi4.paradoxwikis.com/Difficulty); [SteamCharts](https://steamcharts.com/app/394360); [Steam API](https://store.steampowered.com/appreviews/394360?json=1); [GameStar](https://www.gamestar.de/artikel/hearts-of-iron-4-dlc-goetterdaemmerung-test,3423260.html); Pennington 2022, [DOI](https://doi.org/10.17870/bathspa.00014679); Si 2026, [DOI](https://doi.org/10.1177/15554120261489829).
- Democracy 4: [Positech](https://www.positech.co.uk/democracy4/), [Modding Basics](https://www.positech.co.uk/democracy4/modding.html), [Modding Policies](https://www.positech.co.uk/democracy4/mod_policies.html); [Guardian](https://www.theguardian.com/games/article/2024/jul/02/i-simulated-each-uk-partys-first-years-in-government-in-a-video-game-and-the-results-were-awful); [Washington-Post-Reprint](https://dailytimes.com.pk/649189/embrace-the-weird-career-of-a-politician-in-engrossing-government-sim-democracy-4/); [Positech-Forum](https://forums.positech.co.uk/t/a-guide-to-minister-strategy-development-comments-for-ministers/18302).
- Suzerain: [Steam](https://store.steampowered.com/app/1207650/Suzerain/), [Steam-API](https://store.steampowered.com/api/appdetails?appids=1207650), [SteamSpy](https://steamspy.com/api.php?request=appdetails&appid=1207650), [Berlin.de](https://www.berlin.de/gamescapital/interviews/gcb-inside-with-ata-sergey-nowak-1722522.en.php), [RPS](https://www.rockpapershotgun.com/weve-seen-how-close-you-can-get-how-studio-closures-pushed-suzerains-maker-to-create-two-new-dlcs-and-a-turn-based-strategy-spinoff).

**Grenzen:** Keine eigenen Spieltests; Patch- und DLC-Stände können sich ändern; Verkaufszahlen sind Schätzungen; Reviewzahlen sind Momentaufnahmen vom 20.10.2026. Die Analysen beschreiben Designmuster, keine tagesaktuelle Balance.
