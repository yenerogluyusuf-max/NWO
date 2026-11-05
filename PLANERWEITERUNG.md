# NWO — Planerweiterung aus der Gesamtrecherche

Stand: 28. September 2026 (Hinweis 30.09.: Nach Entscheidung J, Priorität Spielbarkeit und lokal, sind die Abschnitte zu Steam, Anwalt und Marketing nachrangig; maßgeblich ist [ENTSCHEIDUNGEN.md](ENTSCHEIDUNGEN.md), Blöcke J bis L). Ergänzung zu [Projektplan](PROJEKTPLAN.md), [Entwicklungsplan](ENTWICKLUNGSPLAN.md) und [Länderpaket Türkei](LAENDERPAKET_TUERKEI.md). Grundlage: die umfassende Recherche [RECHERCHE_GESAMTBEDARF.md](RECHERCHE_GESAMTBEDARF.md) (Datenquellen, Technik, KI, Recht, Markt; Einzelnotizen in [RECHERCHE_NOTIZEN/](RECHERCHE_NOTIZEN/)). Dieses Dokument weitet den Plan aus; es ersetzt keine Entscheidung des Projektinhabers und keine anwaltliche Prüfung.

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


## 9. Nachtrag 29.09.2026: Stand der Implementierung

Im Ordner [`game/`](game/) läuft ein spielbarer Kern (Details im Arbeitsprompt, Abschnitt „Aktueller Stand“). Umgesetzt sind Teile von ECO-01 (Wirtschaftsmodell mit Zentralbank), NET-01/POL-01 (Politiknetz, je Provinz), PRO-01 (Prolog), ELE-01 (Parlamentswahl 2028) und GEO-01 (Karte). Die Oberfläche folgt Hearts of Iron (Karte) sowie Suzerain und Civilization (Akten, Ereignisse).

**Nächste Schritte (Implementierung), in dieser Reihenfolge:**

1. Spielschleife: Parlament als Engpass (Gesetze einbringen, Abstimmung, Bündnispartner, Überläufer), Umfragen laufend im Spiel.
2. Ereignisbibliothek nach [SZENARIEN.md](SZENARIEN.md) (SCEN-01): erste 20 bis 30 Ereignisse mit Voraussetzungen und Preis.
3. Speichern und Laden (SAVE-01).
4. Figuren und Kabinett, danach freie Sprachbefehle (ACT-01, CHAT-01) und Agenda (AGENDA-01).
5. Karte: Tag-und-Nacht-Grenze, Wetter, Markierungen für Probleme und Projekte.


## 10. Nächste Schritte (Stand 05.11.2026, Nachtarbeit)

**Nachtarbeit 4./5. November** (Leitbild: [LEITBILD_UND_VORBILDER_2026-11-05.md](LEITBILD_UND_VORBILDER_2026-11-05.md)):
- **Balance:** Regierungsmüdigkeit 0,30 → 0,15 je Monat mit Beleg (Kosten des Regierens); Testspieler beantworten Ministeranliegen; kluges Regieren gewinnt 7 von 8 ersten Wahlen, Nichtstun 1 von 8.
- **Neue Mechaniken nach Vorbildern:** Amtszeit-Epochen (Civ 6), Beobachter-Kränkungen (Civ 6), Zynismus bei Kehrtwenden und Wahlgeschenken (Democracy 4).
- **Inhalt:** vier weitere Große Ziele (zehn in acht Bereichen); zwei reale Großprojekte (Entwicklungsstraße Irak–Türkei, Konya-Ebene-Projekt).
- **Karte:** 2D-Ersatzkarte ohne WebGL; einklappbare Leiste; Legende zu bis zum Öffnen.
- **Alte Testfehler behoben:** Vorgang-Sprung, Transitabkommen, Nachtrag, Amtszeit-Tests, Extraktionsskript, Neutralität.
- **Sprachgleichheit (ENTSCHEIDUNGEN U):** Dieselbe Partie lief auf Englisch anders als auf Deutsch (Ereignisdichte las deutsche Titel). Chronik und Protokoll tragen jetzt Merkmale (`art`, `vorlage`, `ohneEntscheidung`, `presse`, `abstimmung`); `test/sprachgleich.test.ts` prüft de, en, tr. Übersetzt: Krisenbanner, Abstimmungen, Ortsangaben, Statistik- und Belastungsmeldungen, Namen im Reich, Ländernamen der 2D-Karte.
- **Balance, zweiter Schritt:** Müdigkeit 0,15 → 0,10 je Monat. Mit der korrigierten Dichte (Momente, Berichte und ausgesessene Vorgänge zählen nicht) gewinnt kluges Regieren 8 von 8 ersten Wahlen, Nichtstun verliert 7 von 8, blindes Hochdrehen 8 von 8; rund 12 bis 16 Entscheidungen im Jahr (Ziel unter 16 erreicht).
- **Vorbilder umgesetzt:** Wahlabend mit dem Urteil der Geschichte (Tropico, Epoche); Kriegslage auch auf der 2D-Karte (Vorgabe S); Schreibtisch zeigt das Dringende zuerst.
- **Gesamtbild (Vorgabe T):** Außenpolitik hat eine Lage statt zwei (die Außenlage steht im Reiter „Weltlage“); Kabinett zählt Vorlagen einheitlich; Land nennt den Katastrophenreiter nach seinem Inhalt; fünf neue Kopfbilder (Welt, Platz, Presse, Wissen, Amtssitz), keine zwei Bereiche teilen sich mehr ein Bild außer Recht/Parlament; eine Anrede („Sie“) in allen Systemtexten; letzte Größen auf der Stufenleiter.
- **Suzerain:** Minister erinnern sich an Ihre Antworten und nennen sie auf der nächsten Karte.
- **Fehler gefunden und behoben:** Der Wahlabend lag hinter einer offenen Akte (Ebene 12 gegen 50) und blieb unsichtbar, wenn man nach dem Laden „Zum Schreibtisch“ wählte.

**Als Nächstes:** (a) übersetzt sind jetzt Protokoll, Verträge, Initiativen, Ländernamen und Ereignispreise; offen bleiben einzelne Texte aus Datenmodulen (Profile der Länder, Ausstrahlungstexte, heimWirkung), (b) endogene Gruppengröße (Democracy 4), (c) Befehle auf der Karte (Vorgabe S; die Lage steht jetzt auf beiden Karten), (d) Besatzungsverwaltung (HOI4), (e) Wahlkampf sichtbarer machen: Ohne Wahlkampf kosten unbeantwortete Angriffe der Opposition 6 Punkte, TV-Duell und schwaches Lager rund 2 (Wahltest: 51 % Zustimmung ergaben 39–42 % der Stimmen); der Schreibtisch sollte das vor der heißen Phase ankündigen, (f) die Zeitung und das Halbrund bleiben bewusst außerhalb der Palette.

## 10a. Stand 04.11.2026


**Neu (Vorgabe S):** Karte als Hauptbühne in allen Bereichen; Vorschlag und Fragen gehen an den Projektinhaber, danach Umsetzung. Dazu gehört eine einfache 2D-Karte für Geräte ohne WebGL (heute bleibt die Karte dort leer).

**Stand 04.11. spät:** Die neun neu aufgetretenen Testfehler sind behoben, vor allem durch gezielte statt pauschale Sanktionen und einen eingepreisten Startzustand (ENTSCHEIDUNGEN R) sowie eine Ausnahme von der Kriegsgrenze bei akuter Angriffsgefahr. Die Vollsuite zeigt danach nur noch die Fehler, die schon vor dieser Arbeit bestanden. Es bleiben die Balancetests, die schon vorher scheiterten: Der kluge Testspieler gewinnt die erste Wahl nur in 2 von 8 Partien (Ziel: 70 %), und es kommen rund 19 statt höchstens 16 Ereignisse im Jahr. Das ist die nächste Aufgabe (a). Außerdem offen: die Arbeitslosigkeit im Lernfall 2021 liegt etwa 1,7 Punkte zu hoch, weil der Kreditboom über Staatsbanken fehlt (KALIBRIERUNG_LOG §4.5).

**Stand 04.11. abends:** Die sechs Punkte der Gesamtprüfung sind umgesetzt (Abschnitt 8 dort, mit Vorher-Nachher-Zahlen). Als Nächstes: (a) die 13 schon vorher scheiternden Spielbarkeits- und Balancetests klären, (b) weitere große Ziele und Großprojekte für Landwirtschaft, See, Handel, Logistik (Q.4), (c) Krieg mit Verbänden und Generälen, (d) eigene Kopfmotive und Medienpolitik-Zugang.

**Vorher:** Die Gesamtprüfung [PRUEFUNG_GESAMT_2026-11-04.md](PRUEFUNG_GESAMT_2026-11-04.md) legte die Reihenfolge fest: (1) Krieg glaubwürdig machen, (2) Sanktionen mit Wirkung, (3) Warnen und hinführen, (4) Ordnung der Navigation, (5) Preise schärfen und Putsch erreichbar, (6) große Ziele nach [GROSSE_ZIELE_2026-11-04.md](GROSSE_ZIELE_2026-11-04.md).

Die Liste in Abschnitt 9 ist großteils umgesetzt (Parlament, Ereignisse, Speichern, Kabinett, KI-Befehle, Agenda). Laufend gilt:

1. **Gestaltung nach Vorgabe P** ([ENTSCHEIDUNGEN.md](ENTSCHEIDUNGEN.md#p-vorgabe-04112026-das-spiel-muss-schöner-werden)): Bestandsaufnahme liegt in [GESTALTUNG_2026-11-04.md](GESTALTUNG_2026-11-04.md) (acht Befunde B1–B8, Stufen G1–G6); G1–G3 sind im Spiel umgesetzt (Abschnitt 6 dort): Rahmen für alle Akten, Zeichensprache, Bildkarten in Sicherheit und Land. Als Nächstes: eigene Kopfmotive für Gesellschaft, Medien, Regierung, Wissen; Bildkarten für Kultur, Recht, Wissensbaum; dann G4 (Entscheidungskarten).
2. **Offene Testfehler** (bestehen unabhängig von der Gestaltung): `reich-katalog` (Transitabkommen: Vertrauen Kasachstan knapp unter der Erwartung) und `vorgang-ui` (Schreibtisch nennt den Vorgang „Wohnungen in Hatay“ nicht): Kalibrierung oder Erwartung prüfen.
3. **Balance:** harter Inflationsverlauf vor der Wahl ([KRISENRAT_REGIERUNGSARBEIT_2026-11-03.md](KRISENRAT_REGIERUNGSARBEIT_2026-11-03.md)).
4. **Browserprüfung ausweiten:** 3D-Karte und Animationen auf einem Rechner mit Grafikkarte; Safari und Firefox. Die Prüfung `e2e/wahlkampf-oberflaeche-pruef.mjs` dient als Muster für weitere Ansichten.
