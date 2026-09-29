# NWO — Planerweiterung aus der Gesamtrecherche

Stand: 28. September 2026. Ergänzung zu [Projektplan](PROJEKTPLAN.md), [Entwicklungsplan](ENTWICKLUNGSPLAN.md) und [Länderpaket Türkei](LAENDERPAKET_TUERKEI.md). Grundlage: die umfassende Recherche [RECHERCHE_GESAMTBEDARF.md](RECHERCHE_GESAMTBEDARF.md) (Datenquellen, Technik, KI, Recht, Markt; Einzelnotizen in [RECHERCHE_NOTIZEN/](RECHERCHE_NOTIZEN/)). Dieses Dokument weitet den Plan aus; es ersetzt keine Entscheidung des Projektinhabers und keine anwaltliche Prüfung.

## 1. Was die Recherche am Plan ändert

**Die Gewichtung verschiebt sich: Nicht die Technik ist der kritische Pfad, sondern drei Vorlaufthemen, die den Prototyp überdauern.**

1. **Rechtliche Figur-Frage.** Ob fiktive Figuren auf reale türkische Amtsträger hinlesbar sind, bestimmt das Risiko — nicht die Engine. In der Türkei gilt Art. 299 TCK (Beleidigung des Präsidenten; 2014–2019 rund 128.872 Ermittlungen), ergänzt um Art. 301. Fiktive Namen schützen nicht, sobald Dialoge, Porträts oder Marketing-Assets eine reale Person erkennbar machen. Deshalb: nur fiktive Figuren, verfremdete Optik, keine realen Vita-Marker, Vertrieb Türkei zunächst mit Länder-Geoblock.
2. **Datenfreigaben.** TÜİK-Daten sind mit Quellenangabe frei nutzbar; **TCMB-Daten erfordern für kommerzielle Nutzung eine schriftliche Erlaubnis**, und die YSK-Lizenz des Open-Data-Portals ist unklar. Beide Anfragen brauchen Vorlauf — sie blockieren sonst das Startpaket.
3. **Steam-Klärung des BYO-Key-Modells.** Die Idee „Spieler bringt eigenen KI-Schlüssel mit" ist im Valve-Regelwerk nicht abgebildet; vor Design-Freeze ist die Klärung einzuholen. Ohne sie ist das Geschäftsmodell gefährdet.

Technik (Karte, Simulation, Blender, LLM-Anbindung) ist bewährte Handwerksarbeit mit belegten Bausteinen; die Kostenschätzung der KI-Sitzungen (~0,15–0,35 USD pro Spieltag, Schätzung) bestätigt das BYO-Key-Modell als tragfähig.

Marktseitig bestätigt die Recherche die Nische (Suzerain: geschätzt 500.000–1.000.000 Owner bei 18,99 €) und warnt vor dem Median (typischer Indie-Titel verdient fast nichts). Die bestehende Reihenfolge „erst Prototyp, dann Verkaufsentscheidung" bleibt risikooptimal, muss aber an harte Frühindikatoren geknüpft werden (Abschnitt 6).

## 2. Erweiterter Entwicklungsplan: neue und konkretisierte Arbeitspakete

Die IDs der Pakete aus dem [Entwicklungsplan](ENTWICKLUNGSPLAN.md), Abschnitt 3, bleiben bestehen. Neu kommt eine Vorlaufspur vor dem Spaß-Tor, weil sie kalendermäßig unabhängig läuft und nicht auf den Prototyp warten darf.

### Vorlaufspur (parallel ab sofort, P0)

| ID | Arbeitspaket | Abhängigkeit | Sichtbarer Abschluss |
|---|---|---|---|
| LIC-01 | Anwaltspaket DE + TR: Figurenerkennbarkeit (§ 22/23 KUG), Art. 299/301 TCK, Vertriebsentscheidung Türkei, KI-Kennzeichnung, Marken | keine | Schriftliche Einschätzung zu Figurenregeln und TR-Strategie liegt vor |
| NAME-01 | Markenrecherche für „Staatsräson" (DPMA/EUIPO/TÜRKPATENT/USPTO, Klassen 9/41) | keine | Name recherchiert und freigehalten |
| VALVE-01 | Bei Valve anfragen, ob BYO-API-Key akzeptabel ist | keine | Schriftliche Antwort oder dokumentierte Alternativstrategie |
| DATA-FREI | Freigaben einholen: TCMB (schriftlich), YSK-Lizenz, ggf. Umfrageinstitute | keine | Freigaben schriftlich vorhanden oder Verzicht dokumentiert |
| TR-DAT | Startdaten beschaffen: TÜİK-Vollinventar, EVDS3-Reihen, Wahldaten 2018/2019/2023/2024, mevzuat-Gesetzestexte | DATA-FREI | Quellenregister gefüllt, Lücken markiert |
| TR-GEO | Geodaten aufbereiten: İl-/İlçe-Grenzen aus OSM (ODbL-Attribution) oder Natural Earth; Relief aus SRTM/EU-DEM; Pipeline ogr2ogr → mapshaper → tippecanoe → .pmtiles | keine | Kartenrohdaten lizenzsauber, Bezirke topologisch sauber |

Wichtige Detailregeln aus der Recherche, die in die Arbeitsanweisungen gehören:

- **Nicht GADM** für ausgelieferte Grenzdaten (kommerzielle Nutzung untersagt); nur zum internen Abgleich.
- **TÜİK-Zellen mit weniger als 3 statistischen Einheiten sind geheim** — manche İlçe-Kreuztabellen fehlen; Mikrodaten sind tabu (Gesetz 5429). Fehlende Bezirkswerte werden nicht durch nationale Mittel ersetzt (bereits im Entwicklungsplan, Abschnitt 5).
- **Gesetzestexte** liegen nur auf Türkisch vor (Zentralbankgesetz Nr. **1211**, nicht 12116); das Spiel paraphrasiert und übersetzt selbst, amtliche DE-Fassungen existieren nicht.
- **Attribution ist Pflichtfeature:** ein Quellen-Menü im Spiel mit OSM-ODbL-Hinweis, „Made with Natural Earth", Copernicus-/SRTM-Zitat, Weltbank-Format und TÜİK-Quellenzeile („TÜİK, Thema, Periode"). Die Spiel-Oberfläche zeigt die deutschen Behördennamen („MB" statt „TCMB"); das Quellen-Menü nennt die echten Quellen, weil die Lizenzen die Nennung des Herausgebers verlangen. Die Umbenennung ersetzt keine Datenfreigabe: wer EVDS-Reihen im Spiel zeigt, braucht weiterhin die schriftliche TCMB-Erlaubnis oder zeigt eigene Ableitungen.
- **Stichtag** an die Veröffentlichungskalender von TÜİK und TCMB hängen; Datenstand höchstens ~3 Monate vor Spielstart, Quartalsende bevorzugt.

### Technikspur (ersetzt „durch Versuche zu entscheiden", Entwicklungsplan Abschnitt 9)

| ID | Arbeitspaket | Abhängigkeit | Sichtbarer Abschluss |
|---|---|---|---|
| TECH-00 | Drei Versuche nach Entwicklungsplan Abschnitt 6 — jetzt mit konkreten Kandidaten: **Kartenversuch** (MapLibre GL + Tauri vs. Unity), **Simulationsversuch** (90 Tage reproduzierbar), **Sprachversuch** (Anweisungen auf Aktionskatalog) | TR-GEO (Kartenversuch) | Engine-Entscheidung mit schriftlicher Begründung |
| SIM-00 | Simulationskern-Regeln festlegen: ganzzahliger Tagesschritt, feste Subsystem-Reihenfolge, RNG-Seeds im Save, Event-Log + Snapshots, JSON für Regeln/Inhalte, SQLite für Saves; kleine Wenn-Dann-Regelschicht statt vollem Prolog; kein ECS | TECH-00 | Reproduzierbarer 90-Tage-Lauf als Golden-Test |
| KI-00 | Aktions-API entwerfen: geschlossener Tool-Katalog (`set_policy`, `appoint`, `start_investigation`, `advance_to_day` …) mit Strict-Schema, Validierung im Sim-Kern, Reparatur-Loop (max. 2–3), `clarify`-Tool bei Mehrdeutigkeit; Zwei-Pass-Erzählen (Fakten zuerst, Text danach) | SIM-00 | 50-Anweisungen-Testkatalog besteht ohne Zustandsänderung aus unbelegten Modellaussagen |
| KI-01 | Drei KI-Modi: (a) eigener Key (OpenRouter/Anthropic/OpenAI/Google), (b) lokales Modell (Ollama, OpenAI-kompatibel), (c) Offline-Vorlagen; Key nur lokal (OS-Keychain), Budget-Warnung, Kostenanzeige im Setup | KI-00 | Alle drei Modi spielbar, Ausfall des Sprachdienstes bricht das Spiel nicht |
| KI-02 | Figuren-Gedächtnis als Fakten-Ledger im Spiel (Zusagen, Kränkungen, Wissensstand als Events) + Hintergrund-Extraktion + Top-k-Retrieval; Mentorin als RAG über den Spielzustand mit `unknown`-Flag und der Formel „Das steht nicht in den Akten." | KI-00 | Frühere Zusage kehrt in einer Testpartie korrekt zurück |
| ART-01 | Bildpipeline: Stil-Referenzsheet, Stil-LoRA/-Referenz, Charakter-Sheets pro Figur; **Nachbearbeitung (Overpaint, Komposition) ist verbindlicher Produktionsschritt** (Grundlage für Urheberrechtsschutz); Midjourney nur manuell, API-Batches über OpenAI/Google/FLUX | NAME-01 (Art-Bible) | Erste Figurenreihe im einheitlichen Stil, Nachbearbeitung je Asset dokumentiert |

Hinweis zur Kostenkontrolle: Modelle tieringmäßig einsetzen (klein für Parsing/Nebenfiguren, Mittelklasse für Mentorin/Kernfiguren), Prompt Caching nutzen, Kostenziel unter 0,30 USD pro Sitzung (Schätzung). Lokale Modelle kosten null — der Offline-Modus ist zugleich Risikostopper und Merkmal.

### Inhaltspur (bestehende Pakete konkretisiert)

- **TR-00** wird durch TR-DAT und TR-GEO konkretisiert; das Quellenregister aus Abschnitt 5 des Entwicklungsplans ist jetzt mit den belegten Quellen (TÜİK, EVDS3, YSK acikveri, mevzuat, Weltbank CC BY 4.0) zu füllen.
- **CHAR-01 / Figurenkanon (Entscheidung vorzubereiten):** nur fiktive Figuren in echten Ämtern; verbindliche Art-Bible-Regeln: keine realen Vita-Marker (wahre Amtszeiten, echte Zitate, reale Skandale), keine Namensvetternschaft, verfremdete Partei-Icons statt Original-Logos, keine Staatssymbole in Store-Assets. **Behörden tragen deutsche Namen statt türkischer Amtskürzel: die Zentralbank heißt „MB", nicht „TCMB"** (entsprechend für andere Behörden); türkische Originale nur im Notizbuch (Länderpaket, Abschnitt 6).
- **ECO-00** übernimmt die Lernfälle des Länderpakets (2019 Zentralbankwechsel, 2021/22 Lira und Inflation, 2023 Kurswechsel, 2023 Erdbeben, 2024 Kommunalwahlen) als Kalibrierungs-Prüfsteine — jetzt mit den belegten Datenquellen beschaffbar.
- **UI-01** bekommt das Quellen-Menü und die KI-Kennzeichnung (AI Act Art. 50: KI-Interaktion erkennbar, Hinweis in Credits/Store genügt bei offensichtlich fiktiven Werken) als feste Anforderung.

## 3. Anpassung der Tore vor jeder Veröffentlichung

Spaß-Tor und Lern-Tor bleiben unverändert. Vor einer **öffentlichen Veröffentlichung** kommen drei weitere Tore hinzu, die nicht übersprungen werden:

1. **Rechts-Tor:** Schriftliche anwaltliche Freigabe (DE + TR) zu Figurenerkennbarkeit, Store-/Marketing-Texten und Vertriebsstrategie Türkei; Markenrecherche des finalen Namens abgeschlossen.
2. **Daten-Tor:** Jeder Startwert hat Herkunft, Bezugszeitraum und Lizenzstatus; TCMB- und YSK-Freigaben liegen schriftlich vor oder die betroffenen Werte sind ersetzt/verzichtet; Attributionstexte im Spiel geprüft.
3. **Markt-Tor:** Go/No-Go anhand harter Frühindikatoren — Wishlists 6 Monate vor Launch (unter ~15.000 deutet auf Median-Szenario, dann Umfang oder Veröffentlichung neu bewerten), Demo-Retention, Review-Score der Next-Fest-Demo.

## 4. Entscheidungsvorlagen für den Projektinhaber

Aus der Recherche mit Empfehlung; jede Entscheidung ist vor dem angegebenen Zeitpunkt fällig.

| Thema | Empfehlung | Fällig bis |
|---|---|---|
| Engine | Entlang der drei Versuche entscheiden; im Web-Stack (Tauri + MapLibre) den Simulationskern als Rust-Sidecar einplanen | vor Prototyp-Code (M1) |
| Vertrieb Türkei | Start mit Länder-Geoblock über Steam-Region-Filter (risikoärmster Pfad); entschärfte Fassung erst später prüfen | vor Store-Präsenz |
| Figurenkanon | Endgültig nur fiktive Figuren; Art-Bible-Regeln verbindlich | vor erster Asset-Produktion |
| Name | **Entschieden: „Staatsräson"** (engl. *Raison d'État*), „NWO" bleibt Projektkürzel; offene Markenprüfung (DPMA/EUIPO/TÜRKPATENT/USPTO, Klassen 9/41) abschließen | vor jeder öffentlichen Nennung |
| KI-Modi | Drei Modi (BYO-Key / lokal / Offline) als Pflichtfeature, Default Mini/Flash-Klasse | vor S1 |
| Preis | 19,99 €, DLCs 9,99–14,99 €; **kein Early Access** (Konversionsverlust rund ein Drittel), sondern Demo + Next Fest + 1.0; MENA-USD-Preis unter US-Niveau | vor Store-Präsenz |
| Stichtag | Quartalsende mit vollständigen Vorjahresdaten, Datenstand max. ~3 Monate vor Spielstart | vor M0 |
| Scope-Regel | Ein Land + eine Amtszeit als Veröffentlichungsumfang; weitere Länder nur als DLC nach Beweis | dauerhaft |

## 5. Erweiterte Risikoliste

Zu den Risiken aus Projektplan Abschnitt 19 treten:

| Risiko | Gegenmaßnahme |
|---|---|
| Figuren sind auf reale Amtsträger hinlesbar → Art. 299/301 TCK, Persönlichkeitsrecht | Art-Bible-Regeln, deutsche Institutionsnamen („MB" statt „TCMB"), anwaltliche Prüfung anhand konkreter Character-Sheets, TR-Geoblock |
| BYO-Key von Steam nicht akzeptiert | VALVE-01 früh anfragen; Plan B: lokaler Modus als Werbe-Kern („No cloud, no key") und Key nur als Option |
| TCMB-/YSK-Freigaben bleiben aus | Frühe Anfragen; Fallback: interne Kalibrierung, im Spiel nur unproblematische Quellen zeigen |
| Markenkonflikt des Namens | NAME-01 vor öffentlicher Nennung |
| Indie-Markt-Median (typische Titel verdienen fast nichts) | Harte Markt-Tore, Scope-Disziplin, Wishlist-Momentum statt versunkener Arbeit als Entscheidungsgrundlage |
| Endlose Entwicklung („Grey-Eminence-Falle") | Scope „ein Land, eine Amtszeit", S1 bleibt klein, jedes Tor muss bestanden werden bevor Umfang wächst |
| KI-Kosten oder Support-Last für Spieler | Kostenanzeige, Budget-Warnung, Offline-Modus, ehrliche AGB (Verhältnis Spieler ↔ KI-Anbieter) |

## 6. Sofortmaßnahmen (nächste vier Wochen)

Diese Liste ist bewusst klein und läuft parallel zur weiteren Konzeptarbeit (Fragerunden aus [ENTSCHEIDUNGEN.md](ENTSCHEIDUNGEN.md), Block C):

1. **TCMB anschreiben:** schriftliche Erlaubnis für kommerzielle Nutzung von EVDS-/Website-Daten anfragen; parallel EVDS3-API-Dokumentation sichten.
2. **YSK anschreiben:** Lizenz des Açık-Veri-Portals schriftlich bestätigen lassen; Exportformate (CSV/XLSX/JSON) testen.
3. **Valve anfragen:** BYO-API-Key über das Content-Survey-Formular vorlegen.
4. **TÜİK-Vollinventar abziehen:** Tabellencodes der Kernreihen (TÜFE/ÜFE, ADNKS nach İl/İlçe, Arbeitsmarkt, Vertrauensindizes, İl-Göstergeleri) dokumentieren; Veröffentlichungskalender in das Datenschema übernehmen.
5. **Geodaten beschaffen:** İl-/İlçe-Grenzen aus OSM oder Natural Earth, Relief aus SRTM/EU-DEM, inklusive Zitatformeln für das Quellen-Menü.
6. **Name:** Shortlist von 10–20 Kandidaten erstellen; Markenrecherche in die Wege leiten.
7. **Art-Bible-Eintrag** „Figurenregeln" schreiben (keine realen Vita-Marker, verfremdete Optik, nur fiktive Namen) und als Vorgabe für ART-01 festlegen.
8. **Anwaltstermin** für das Paket LIC-01 vorbereiten (Unterlagen: Character-Sheets, Store-Textentwürfe, Länderpaket-Abschnitt 4/5).

## 7. Was unverändert bleibt

Die Leitprinzipien, das Spaß-Tor und das Lern-Tor, „Wege statt Verbote", die Mentorin, das Wirtschaftsmodell und die Reihenfolge S0 → S1 → M0–M6 aus den bisherigen Dokumenten bleiben gültig. Die Recherche bestätigt sie mehrheitlich und füllt die offenen Punkte aus Entwicklungsplan Abschnitt 9 („durch Versuche zu entscheiden", „vor M0 zu konkretisieren") mit konkreten Kandidaten und Quellen. Ungeprüft und offen bleiben die in [RECHERCHE_GESAMTBEDARF.md](RECHERCHE_GESAMTBEDARF.md), Abschnitt „Offene Punkte und Gaps", gesammelten Fragen — sie werden Schritt für Schritt mit den Maßnahmen aus Abschnitt 6 abgearbeitet.

## 8. Nachtrag 29.09.2026: Weltdaten, Innenpolitik, Großprojekte, Mediation

Die zweite und dritte Rechercherunde ([RECHERCHE_WELTDATEN.md](RECHERCHE_WELTDATEN.md), [RECHERCHE_INNENPOLITIK.md](RECHERCHE_INNENPOLITIK.md)) und die Projektinhaber-Entscheidungen („Härte des echten Lebens", „freie Großprojekte mit KI-Folgenberechnung") erweitern den Plan um vier neue Dokumente:

- **[INNENPOLITIK.md](INNENPOLITIK.md):** zwölf Politikfelder mit belegten Startwerten (Arbeitslosigkeit 8,1 %, Jugend 14,5 %, Mindestlohn 28.075 TL, Gini 0,410, PISA 2025, Gefängnisse 434.681, Drogenereignisse 311.793 usw.), Problem-/Maßnahmenkatalog, sieben Wählergruppen. Arbeitet die Entscheidung „Tiefe wie Democracy 4 und Suzerain" aus.
- **[AUSSENPOLITIK.md](AUSSENPOLITIK.md):** Beziehungs-Matrix mit Startwerten (Handel 273/365 Mrd. $, Militär 481k, Budget 27,3 Mrd. $), Verträge, Rüstung, **Mediationsmodell** (Istanbul-2022- und Getreideabkommen-Kalibrierung) für die Entscheidung „Friedensvermittlung Ukraine/Russland".
- **[GROSSPROJEKTE.md](GROSSPROJEKTE.md):** die Mechanik „alles eingeben, Folgen berechnen" — dreistufiges Wirkungsmodell mit elastizitätsbasierten Zweitrundeneffekten (das Hafen-Beispiel des Projektinhabers ist durchgerechnet), Härte-Regeln (Kostenüberschreitung, Verkehrsillusion, Verlierer).
- **[SZENARIEN.md](SZENARIEN.md):** 18 Ereignisvorlagen (Währungskrise, Hormuz-Schock, Erdbeben, Dürre, Drogenwelle, Terror, Gefängniskrise, Korruption, Justizkonflikt, Wahl, Grenze, Flüchtlinge, Mediation, Großprojekt-Proteste, Mietproteste, Jugend, Pandemie) — jeweils mit Voraussetzungen, Handlungsspielraum und Preis.

**Neue Arbeitspakete** (in die Logik des Entwicklungsplans, Abschnitt 3):

| ID | Arbeitspaket | Abhängigkeit | Sichtbarer Abschluss |
|---|---|---|---|
| POL-01 | Politiknetz zwölf Felder (Maßnahmen, Probleme, Latenzen) | ECO-00, POP-01 | Jede Maßnahme hat Zielkonflikt und Verzögerung |
| GRO-01 | Großprojekt-Pipeline (Parse → Prüfung → Wirkungsmodell) | ACT-01, ECO-01 | Freie Eingabe erzeugt Kosten/Dauer/Gewinner/Verlierer |
| GRO-02 | Zweitrundeneffekt-Rechner (Gravitation, Agglomeration, Crowd-out) | GRO-01, GEO-01 | Hafen-Beispiel reproduzierbar berechnet |
| MED-01 | Mediationsmodell (Parteien, ZOPA, Spoiler, Garantien) | DIP-01, PER-01 | Drei-Parteien-Verhandlung durchspielbar |
| SCEN-01 | Ereignisvorlagen-Bibliothek (18 Vorlagen) | EVT-00, EFF-01 | Verschiedene Partien erzeugen verschiedene Krisen |
| HART-01 | Härte-Regeln (Kostenüberschreitung, Verkehrsillusion, Verlierer) | GRO-01, POL-01 | Kein Projekt ohne Preis; Scheitern ist möglich |
| AGENDA-01 | Agenda-System: freie Zielvorgaben → Priorisierung + Maßnahmen-Empfehlungen (siehe [AGENDA.md](AGENDA.md)) | ACT-01, POL-01, CHAT-01 | Agenda-Eingabe strukturiert, Empfehlungen agenda-konform, Abweichungen vermerkt |

**Datenbasis:** Die Startwerte der Politikfelder, Beziehungs-Matrix, Großprojekt-Parameter (Gravitationselastizität ≈ −0,8…−1,1, Agglomeration +3–8 %/Verdopplung, Kostenüberschreitung Schiene ~45 %/Straße ~20 %, Verkehrsprognosen 25–60 %) und Mediations-Kalibrierung (Getreideabkommen 33 Mio. t) stammen aus den beiden Rechercheberichten und gehen vor M0 ins Quellenregister.
