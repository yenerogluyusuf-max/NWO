# Detailplan Oberfläche (5. November 2026)

Dieser Plan setzt den Überblick [PLAN_OBERFLAECHE_2026-11-05.md](PLAN_OBERFLAECHE_2026-11-05.md) in Arbeit um: jede neue Ansicht mit Aufbau, Datenquellen im Code, jedem Klick, Zuständen, Übernahme und Löschung, Simulationsbedarf, Texten, Abnahme und Aufwand. Grundlage sind der Rundgang über alle Seiten (88 Bildschirme, Kritik in [dokumentation/rundgang_2026-11-05/](dokumentation/rundgang_2026-11-05/)) und die Entscheidungen ENTSCHEIDUNGEN V und W.

**Aufbau dieses Dokuments**
- Teil 1: Was für alle Ansichten gilt (Ministerien, Gesetzgebung, Bausteine, Navigation, Abnahme)
- Teil 2: Arbeitspakete in Reihenfolge
- Teil 3: Offene Fragen mit Empfehlung (gelten als beschlossen, wenn der Projektinhaber nicht widerspricht, außer den als **Entscheid nötig** markierten)
- Teil 4: Abgleich der vier Spezifikationen (wo sie sich widersprachen und was gilt)
- Anhang A: Einstieg, Schreibtisch, Hauptmenü, Politik, Parlament, Kabinett (14 Ansichten)
- Anhang B: Wirtschaft und Gesellschaft (7 Ansichten)
- Anhang C: Land und Forschung & Ziele (5 Ansichten)
- Anhang D: Außen, Sicherheit, Medien und Karte (10 Ansichten und Regeln)

Jeder Anhang folgt derselben Gliederung je Ansicht: 1 Frage und Erfolg, 2 Aufbau (Zonen), 3 Inhalte je Zone mit Datenquelle, 4 Zustände, 5 Klicks, 6 Übernommen/gelöscht, 7 Simulationsbedarf, 8 Texte, 9 Abnahme, 10 Aufwand und Abhängigkeiten. Am Ende jedes Anhangs stehen die Fehlerliste des Bereichs und seine offenen Fragen.

---

# Teil 1: Was für alle Ansichten gilt


## Q1. Die 17 Ministerien (ENTSCHEIDUNGEN W 1)

Heute: 8 Ämter mit Figuren (`AEMTER` in sim/personen.ts: finanzen, inneres, aussen, zentralbank, stab, justiz, generalstab, wirtschaft) plus Bündnispartei und Opposition. Gesundheit, Bildung, Renten, Sozialhilfe und Kultur hängen am Präsidialamt (`amt: "stab"` in `POSTEN`, sim/haushalt.ts), Forschung, Investitionen, Wohnen, Landwirtschaft, Umwelt/Energie und Subventionen am Wirtschaftsministerium.

Ziel: Die 17 Ministerien der Türkei (Präsidialerlass Nr. 1 von 2018 mit sechzehn, seit 2021 siebzehn). Präsidialamt, Zentralbank und Generalstab bleiben als Ämter mit Figur, sind aber keine Ministerien.

| Nr | Ministerium (türkisch) | id | Politikbereiche (`Theme`, data/politiknetz.ts) | Haushaltsposten heute (`POSTEN`) | Behörden (data/behoerden.ts) | heute bei |
|---|---|---|---|---|---|---|
| 1 | Justiz (Adalet) | justiz | recht | justiz | justiz | justiz |
| 2 | Familie und Soziales (Aile ve Sosyal Hizmetler) | familie | gesellschaft (Familie, Frauen, Minderheitenrechte) | sozialhilfe | – | stab |
| 3 | Arbeit und Sozialversicherung (Çalışma ve Sosyal Güvenlik) | arbeit | arbeit | rentenniveau, rentenalter | – | stab |
| 4 | Umwelt, Städtebau und Klima (Çevre, Şehircilik ve İklim Değişikliği) | umwelt | wohnen; Umweltteil von energie | wohnen; umwelt_energie (ein Stück mit Energie, bis zur Quelle) | – | wirtschaft |
| 5 | Äußeres (Dışişleri) | aussen | aussen | diplomatie | diplomatie | aussen |
| 6 | Energie und Rohstoffe (Enerji ve Tabii Kaynaklar) | energie | energie | umwelt_energie (ein Stück mit Umwelt, bis zur Quelle) | – | wirtschaft |
| 7 | Jugend und Sport (Gençlik ve Spor) | jugend | Teile von bildung (Stipendien, Jugend) | kein eigener Posten (Datenlücke) | – | – |
| 8 | Finanzen (Hazine ve Maliye) | finanzen | haushalt | personal (als „Öffentlicher Dienst“), alle Steuern | steuer, statistik | finanzen |
| 9 | Inneres (İçişleri) | inneres | sicherheit | innere_sicherheit | polizei, grenzschutz, afad | inneres |
| 10 | Kultur und Tourismus (Kültür ve Turizm) | kultur | kultur | kultur | – | stab |
| 11 | Bildung (Millî Eğitim) | bildung | bildung | bildung | bildung | stab |
| 12 | Verteidigung (Millî Savunma) | verteidigung | militaer | verteidigung | – | generalstab |
| 13 | Gesundheit (Sağlık) | gesundheit | gesundheit | gesundheit | gesundheit | stab |
| 14 | Industrie und Technologie (Sanayi ve Teknoloji) | industrie | wirtschaft | forschung | – | wirtschaft |
| 15 | Landwirtschaft und Forst (Tarım ve Orman) | landwirtschaft | landwirtschaft | landwirtschaft | – | wirtschaft |
| 16 | Handel (Ticaret) | handel | Außenhandel und Zölle aus wirtschaft | kein eigener Posten (Zölle sind Einnahmen) | – | wirtschaft |
| 17 | Verkehr und Infrastruktur (Ulaştırma ve Altyapı) | verkehr | infrastruktur | kein eigener Posten bis zur Quelle (investitionen bleibt ressortübergreifend) | – | wirtschaft |
| – | Präsidialamt | stab | – | – | mit, cyber | stab |
| – | Zentralbank | zentralbank | Geldpolitik | – | – | zentralbank |
| – | Generalstab | generalstab | militaer (Führung) | – | – | generalstab |

**Teilungen, die Daten brauchen:** `umwelt_energie` (Umwelt gegen Energie), `investitionen` (Kapitalausgaben aller Ressorts), `subventionen` (Industrie, Landwirtschaft, Energie), `personal` (Gehälter aller Ressorts). Bis die Anteile belegt sind, erscheinen `investitionen`, `subventionen` und `personal` als graue, benannte, ressortübergreifende Stücke im Gesamtrad (in keinem Ministeriumsrad), `umwelt_energie` als ein Stück „Energie und Umwelt (zwei Ressorts)“ (Teil 4). Quelle: Zentralhaushaltsgesetz 2026 (Gesetz Nr. 7567, Amtsblatt 31.12.2025), Tabelle A nach Einrichtungen und Ausgabenarten (Personal, Sozialbeiträge, Sachausgaben, laufende Transfers, Investitionen); Beispiel aus der Haushaltsdebatte: Bildungsministerium rund 1,944 Bio. ₺, davon rund 1,436 Bio. ₺ Personal (Einzelwerte vor dem Einbau an der Tabelle prüfen). Dazu die funktionale Gliederung und das Investitionsprogramm 2026.

**Simulation (sim/personen.ts, sim/figuren.ts, sim/haushalt.ts, data/behoerden.ts):**
1. `AEMTER` um zwölf neue Ämter erweitern (familie, arbeit, umwelt, energie, jugend, kultur, bildung, verteidigung, gesundheit, landwirtschaft, handel, verkehr) und wirtschaft in industrie umbenennen; mit justiz, aussen, finanzen und inneres ergibt das 17. Je Amt: Ressortname, Fachgrößen (`fach`, aus den Größen des zugeordneten Themes), Maßnahmen, Wirkung der Leistung.
2. `POSTEN[].amt` und `RESSORT_POSTEN` auf die neuen Ämter umstellen; `EREIGNIS_BEZUG` (sim/gespraeche.ts) und die Vorlagen des Ministerflusses nach Theme → Ministerium zuordnen, damit kein Ressort fremde Vorlagen einbringt.
3. Figuren: zwölf weitere Minister beim Amtsantritt; die Namensliste (`NACHNAMEN`, 24 Einträge) auf mindestens 60 verbreitete türkische Nachnamen erweitern, damit 17 Minister, Ämter und Behördenleitungen ohne Doppelung auskommen.
4. Alte Spielstände: Beim Laden fehlende Ämter mit festem Zufallsstrom aus dem Seed anlegen (Migration in `load`, wie bei `migriereChronik`); bestehende Figuren behalten Amt und Namen.
5. Kabinettssitzung, Loyalitätsmittel, Kapitalertrag des Kabinetts: auf 17 Köpfe umrechnen, ohne den Kapitalertrag zu verändern (Mittelwert statt Summe prüfen; Balance-Lauf `test/balance-strategien.test.ts` als Wächter).

## Q2. Ein Weg zum Gesetz (ENTSCHEIDUNGEN W 2)

Ausgeführt in Anhang A, Teil 1.1. Grundsatz: Eine Vorlage im Parlament ist immer eine Maßnahme auf einer Zielstufe (`bringeEin` in sim/handeln.ts). Die Katalogeinträge werden „Fassungen“: benannte Zielstufen oder Bündel mehrerer Maßnahmen mit Namen und Text. Das Parlament zeigt die Tagesordnung (`spiel.gesetze`), die Politik zeigt die Regler; beide rechnen mit derselben `pruefeVorhaben`-Prüfung, also mit derselben Stimmenzahl.

## Q3. Gemeinsame Bausteine

Damit „alles anders aussieht“ nicht wiederkehrt, baut jede Ansicht aus denselben Teilen:

| Baustein | heute | künftig (ui/bausteine/) | genutzt in |
|---|---|---|---|
| **Rad** (Ring mit Stücken, Mitte, Legende, Klick = Drill-down, Zoom-Übergang) | HaushaltsRad.tsx | `Rad` mit Stücken {id, name, wert, farbe, schraffiert, ziel} | Haushalt (3 Ebenen), Ministerakte, Medienmarkt |
| **Reglerzeile** (Name, Regler mit −/+, Wert vorher → nachher, Marke) | hd-zeile (Haushalt), mt-zeile (Politik) | `ReglerZeile` | Haushalt, Politik, Justiz, Verteidigung, Außen (Forderungen), Katastrophenvorsorge, Medien |
| **Preisfeld** (Kapital, Mehrheit, Dauer, Haushalt, Gewinner/Verlierer, Beschluss) | hd-panel, mt-panel | `Preisfeld` | unter jeder Reglerzeile |
| **Kreisfeld** (Kreise nach Größe und Wertung auf einer Achse) | – | `Kreisfeld` | Gesellschaft › Das Volk, Politik › Bereichskreise |
| **Tacho** (Halbkreis mit Zielband) | – | `Tacho` | Wirtschaft › Lage, Geld & Lira |
| **Halbrund** | parlament/Halbrund.tsx | bleibt, klickbare Blöcke | Parlament, Haushaltsabstimmung, Verfassungsdialog |
| **Zeitleiste** (Kurve mit Ereignispunkten) | Diagramm.tsx | `Zeitleiste` | Schreibtisch › Verlauf, Tacho-Drill-down |
| **Porträt-Chip** (Bild, Ring = Loyalität, Klick = Gespräch/Akte) | Portraet.tsx | `PersonChip` | überall statt Personenreiter |
| **Seitenfenster** (Akte neben der Karte) | – | `Seitenfenster` | Land, Außen, Sicherheit |
| **ⓘ-Erklärung** (Regeltext beim Antippen) | Absätze | `Erklaer` | statt Regel-Absätzen |

Regeln: Zahlen über eine Formatierfunktion (Indizes ganzzahlig, Geld in Mrd./Bio. ₺ mit einer Stelle, Anteile in %); Farben aus der Palette Kabinettstisch, rot heißt schlechter; jede Größe hat genau eine Quelle (Zustimmung: Messung des Stabs `umfrage.zustimmung`, Umfrage nur benannt mit Institut).

## Q4. Navigation

- Linke Leiste: 11 Bereiche wie heute (Schreibtisch, Politik, Parlament & Gesetze, Kabinett & Verwaltung, Wirtschaft, Gesellschaft, Land, Forschung & Ziele, Außen, Sicherheit, Medien).
- Je Bereich 1 bis 4 Ansichten als Reiter in der Titelzeile (wie heute beim Schreibtisch). Die linke Spalte „Ihr Arbeitsbereich / Bilanz & Hintergrund“ innerhalb der Akte entfällt.
- Hauptmenü ≡: Speichern, Laden, Datei, Einstellungen (Sprache, Effekte, KI), Über das Spiel (Quellen, Lizenzen), Hilfe. Öffnen hält die Zeit an.
- Sprungziele (`Ziel` in ui/schreibtisch/briefing.ts, `onGehe`) werden auf die neuen Ansichten umgestellt; eine Tabelle alt → neu gehört zur Umsetzung von AP 2.

## Q5. Abnahme für alle Ansichten (automatisch messbar)

Der Rundgang wird ein Werkzeug im Projekt (`game/scripts/rundgang.mjs`), das jede Ansicht öffnet, fotografiert und misst. Schwellen je Ansicht: Höhe höchstens 1,5 Bildschirme (Ausnahme: Verlauf), erste Bildschirmhöhe enthält das Hauptbild, kein Reiter mit weniger als 60 Wörtern oder ohne Knopf, keine Größe mit zwei Werten auf derselben Seite (Abgleich der Zahlen), keine Kommazahl bei Indizes, keine Schrift unter 11,5 px, Kontrast mindestens 4,5:1 für Text.


---

# Teil 2: Arbeitspakete in Reihenfolge

Größen: S bis 1 Tag, M 2 bis 4 Tage, L 5 bis 10 Tage Arbeit. Jedes Paket endet mit Vollsuite, Balance-Lauf (`test/balance-strategien.test.ts`), Sprachgleichheit (`test/sprachgleich.test.ts`) und einem Rundgang mit den Schwellen aus Q5; Entscheidungen gehen nach ENTSCHEIDUNGEN.

| AP | Inhalt | Ansichten / Dateien | hängt ab von | Größe | fertig, wenn |
|---|---|---|---|---|---|
| **0** | **Sofort-Fehler** aus den vier Fehlerlisten (Anhänge A Teil 6, B, C Teil C, D), Reihenfolge nach Schaden: Doppelzählung im Haushaltsrad; Tasten 1–4 und Pause bei Menü und Linsenwechsel; „Krieg läuft“ bei Spannung; Katastrophen-Layout; Wirkungsnetz-Layout; Quellen-Kontrast; abgeschnittene dritte Antwort; Ebenenordnung (Leiste über Linsenmenü, Provinzkarte unter Versorgungstafel); NATO-Mitglieder; Ja-Stimmen 373/362 (gemeinsame `gesetzesPrognose`); Stand der Dinge ±0; „Weitester Stand“; 666 Tage; Lage „ruhig“ bei 118 % Engpass; Fokusbaum-Schrift; Kapitaltabelle der Verwaltung; Baureihenfolge in fremden Lage-Ansichten; Behörden auf falschen Haushaltsreglern; interne Kürzel im Text | verstreut, Datei und Zeile je Eintrag in den Anhängen | – | M | jeder Eintrag mit Test oder Bild belegt |
| **1** | **Offene Fragen entscheiden** (Teil 3) und eintragen | ENTSCHEIDUNGEN | – | S | alle als „Entscheid nötig“ markierten Fragen beantwortet |
| **2** | **Recherche** mit Quellen: Haushaltsgesetz 2026 Tabelle A (Ausgaben je Einrichtung und Ausgabenart) für die 17 Ministerien, Präsidialamt und Hochschulen; Präsidialerlasse Nr. 1 und Nr. 4 für die Zuordnung der Behörden (TOKİ, DSİ, KGM, GAP, SSB, TÜBİTAK, YÖK, BTK, RTÜK, Diyanet); Investitionsprogramm 2026 für `investitionen`; Bevölkerungsanteile der Wählergruppen; Reichweiten der Mediengruppen | neue Datei `data/haushalt_ministerien_2026.ts` mit Beleg je Zahl; Recherchenotiz in RECHERCHE_NOTIZEN | – | M | jede Zahl mit Quelle; Lücken benannt |
| **3** | **Ministerienmodell** in der Simulation | `data/ministerien.ts` (neu, Zuordnung Posten, Maßnahmen, Behörden, Themes → 17 Ministerien), `ressortVon()`, `AEMTER` (sim/personen.ts) um 12 Ämter, `wirtschaft` → `industrie`, Figuren und Namensliste (sim/figuren.ts, mindestens 60 Nachnamen), Migration alter Stände (sim/world.ts `load`), Ministerfluss und `EREIGNIS_BEZUG` nach Ministerium, Kabinettskapital nach Teil 3 | 1, Zuordnung aus 2 | L | jede Vorlage kommt vom zuständigen Ministerium; Kapitalertrag der Strategiebots unverändert (±5 %); alter Stand lädt |
| **4** | **Ein Weg zum Gesetz** | `gesetzesPrognose` (gemeinsam für Politik und Parlament), Fassungen aus `data/gesetzesvorhaben.ts` als Knöpfe an der Maßnahmenzeile, `tagesordnung(w)` (Gesetze, Haushalt, Versorgung, Verfassung, Gericht), Katalogseite entfällt | 1 | M | eine Stimmenzahl überall; alle 26 Katalogeinträge als Fassung erreichbar |
| **5** | **Bausteine** (Q3) und Umzug von Haushalt und Politik darauf | `ui/bausteine/`: Rad, ReglerZeile, Preisfeld, Kreisfeld, Tacho, Zeitleiste, PersonChip, Seitenfenster, Erklaer, Zahlformat | – | M | Haushalt und Politik nutzen sie ohne Sichtänderung; Komponententests je Baustein |
| **6** | **Gerüst und Navigation** (Q4) | Pflichtreiter (Lage, Behörden, Bilanz, Personen) entfernen; Ansichten als Reiter in der Titelzeile; Hauptmenü mit Spielstand, Datei, Quellen, KI (hält die Zeit an); Sprungziele alt → neu; Rundgang als `game/scripts/rundgang.mjs` mit Schwellen | 5 | M | höchstens zwei Ebenen; Rundgang ohne Schwellenverletzung bei Gerüstseiten |
| **7** | **Einstieg und Schreibtisch** | Titel und Fortsetzen, Stand der Dinge (Vergleich mit vor 30 Tagen, drei Dinge, die warten), Ereignisfenster (drei Antworten ohne Scrollen, Folgen als Ikonen), Eingang (vollständig nach Anhang A), Verlauf als Zeitleiste | 4, 6 | M | Anhang A Abnahme je Ansicht |
| **8** | **Politik** | Bereichskreise, Maßnahmentafel als Seitenfeld, Wirkungsbild in der Zeile; Vollnetz nur als Knopf | 4, 5 | M | Anhang A |
| **9** | **Parlament** | Halbrund als Start (Parteiblock → Parteikarte), Tagesordnung, Justiz, Verfassungsdialog | 4, 5 | M | Anhang A |
| **10** | **Kabinett** | Kabinettstisch, Ministerakte mit Ressortrad, Verwaltung | 3, 5 | L | Anhang A |
| **11** | **Wirtschaft** | Lage (Tachos), Haushalt in drei Ebenen (Rad → Ministerium → Behörde), Geld & Lira, Handel | 2, 3, 5 | L | Anhang B; Außenring summiert genau auf die Ausgaben |
| **12** | **Gesellschaft** | Das Volk (Kreisfeld), Opposition & Straße, Wahlkampf nur ab 56 Tagen vor der Wahl | 5 | M | Anhang B |
| **13** | **Karte als Bühne** | Seitenakte statt Papier über der Karte (Stage.tsx), acht Linsen, Tasten und Pause, Provinzkarte, Ebenenordnung; 2D-Ersatzkarte bekommt Namen, Weltausschnitt und Linien | 0 (Tasten), 5 | L | Anhang D |
| **14** | **Land** | Karte mit Seitenfenster, Bauleiste (eine Warteschlange für zivil und militärisch), Katastrophen gekürzt | 13 | L | Anhang C |
| **15** | **Außen** | Welt (Karte in Beziehungen), Länderkarte mit Forderungen als Regler und Verhandlungstisch darin | 13 | M | Anhang D |
| **16** | **Sicherheit** | Lagekarte (Konflikte, Front, Zielräume, Einsatzart und Tempo auf der Karte), Streitkräfte & Bau (Bauleiste gefiltert) | 13, 14 | L | Anhang D |
| **17** | **Forschung & Ziele** | Bäume (Fokus und Technik umschaltbar, Etat-Regler oben), Vermächtnis (Große Ziele und Programme) | 5 | M | Anhang C |
| **18** | **Medien** | zwei Titelseiten, Ring des Medienmarkts, drei Regler | 2 (Reichweiten), 5 | M | Anhang D |
| **19** | **Texte** (laufend) | neue Schlüssel in de/en/tr; restliche Ereignistexte (ereignisse.ts, -reich, -personen, -katastrophe, -krieg, -verfassung, welt-ereignisse mit den Kasusformen der Länderdaten) | – | M | englische und türkische Oberfläche ohne deutsche Reste |
| **20** | **Abnahme** (laufend) | Rundgang nach jedem Paket; Bilder in die Doku; Bericht im Morgenbericht | – | – | keine Schwellenverletzung, Vollsuite grün |

Reihenfolge: 0 → 1 → (2, 5, 6 nebeneinander) → 3 → 4 → 7 bis 12 → 13 → 14 bis 18; 19 und 20 laufen mit. Die ersten sichtbaren Ergebnisse für den Spieler bringen 0, 6 und 7.

---

# Teil 3: Offene Fragen mit Empfehlung

Gesammelt aus den vier Spezifikationen (Anhang A Teil 7, B, C Teil D, D). „Entscheid nötig“ heißt: ändert Spielregeln oder Balance; der Rest gilt mit der Empfehlung, wenn nicht widersprochen wird.

| Nr | Frage | Empfehlung | Art |
|---|---|---|---|
| F1 | Haushaltsposten und gleichnamige Maßnahmen kosten beide Geld für dieselbe Sache (`verteidigung` und `m_verteidigung` u. a.) | Der Posten ist der Etat; die Maßnahme ist das Gesetz ohne eigene Kosten | **Entscheid nötig** |
| F2 | Was zeigt die Kopfleiste als Zustimmung: die wahre Zahl oder die veröffentlichte Umfrage? Heute die wahre, damit ist „Rohdaten kaufen“ wertlos | die veröffentlichte Umfrage mit Institut; die wahre Zahl nach Kauf der Rohdaten und am Wahlabend | **Entscheid nötig** |
| F3 | Kabinettskapital mit 17 statt 7 Ministern | Summe bleibt gleich (Beitrag je Minister × 7/17), keine Neukalibrierung | **Entscheid nötig** |
| F4 | Freie Reglerstufen: gelten sie als nächstliegende Fassung (Bonus, Verbandsfolgen)? | ja (Variante A), einheitlich | **Entscheid nötig** |
| F5 | Generalstabschef und Verteidigungsminister | zwei Figuren: Minister (Etat, Ressort), Generalstabschef (Loyalität, Putschgefahr) | **Entscheid nötig** |
| F6 | Personal: eigenes Stück „Öffentlicher Dienst“ oder auf die Ministerien verteilt? | eigenes Stück beim Finanzministerium bis Tabelle A; danach nur in der Anzeige auf die Ministerien verteilt, der Besoldungsregler bleibt einer | Empfehlung |
| F7 | Wehrdienst: Maßnahme `m_wehrdienst` oder `setzeWehrdienst` (0/6/12/18 Monate)? | die Maßnahme führt, ihre Stufen bilden die vier Monatswerte ab | Empfehlung |
| F8 | Rüstungsprojekte haben zwei Fertigdaten (Bau und Beschaffung) | ein Fertigdatum aus der Bauleiste | Empfehlung |
| F9 | AFAD als Maßnahme und als Behörde | eine Zeile, beide nebeneinander; keine Verschmelzung der Regeln | Empfehlung |
| F10 | Versorgungsprogramme als eigene Vorlagen | werden benannte Fassungen der passenden Maßnahmen | Empfehlung |
| F11 | Ministerien mit kaum Hebeln (Jugend und Sport, Handel) | sitzen am Tisch mit Porträt und Loyalität, aber ohne Kapitalbeitrag, bis Hebel recherchiert sind; kein Regler ohne Quelle | Empfehlung |
| F12 | Präsidialamt im Haushaltsrad | eigenes Stück, sobald Tabelle A die Zahl liefert (MİT, Kommunikation, Diyanet, SSB) | Empfehlung |
| F13 | Strittige Zuordnungen (Internetsperren, Medienaufsicht, Mietpreisbremse, Minderheitenrechte, Rüstungsindustrie, TOKİ, GAP, SSB) | nach Präsidialerlass Nr. 1 und Nr. 4 (AP 2) | Empfehlung |
| F14 | Programme und Große Ziele (`dient`) | nur anzeigen, keine Wirkung auf die Chance | Empfehlung |
| F15 | Bau unter Beschuss oder Besatzung | nicht in diesem Umbau | Empfehlung |
| F16 | Verlauf je Provinz speichern (Zeitregler auf der Karte) | vorerst nein (Spielstandgröße) | Empfehlung |
| F17 | Putschneigung als Dauerzahl | nein (wäre eine neue Regel) | Empfehlung |
| F18 | RTÜK und Kommunikationsdirektion als Personen | vorerst nein | Empfehlung |
| F19 | Provinzbesuch des Präsidenten außerhalb des Wahlkampfs | vorerst nein; Provinzkarte bietet Bauen und Problem angehen | Empfehlung |
| F20 | Jugend, Handel und Präsidialamt als Regler vor der Recherche | nein, erst mit Quelle | Empfehlung |

---

# Teil 4: Abgleich der vier Spezifikationen

| Thema | Anhang A | Anhang B | Es gilt |
|---|---|---|---|
| `investitionen` | ressortübergreifend, graues Stück | Verkehr | **ressortübergreifend**, bis Tabelle A und Investitionsprogramm die Aufteilung liefern (keine erfundene Zuordnung) |
| `subventionen` | ressortübergreifend | Energie (vorläufig) | **ressortübergreifend** bis zur Quelle |
| `umwelt_energie` | ein Stück „Energie und Umwelt (zwei Ressorts)“ | sofort in zwei Posten mit je 0,15 % BIP (Spielparameter) | **ein Stück** bis zur Quelle; die Teilung in zwei Posten kommt mit Tabelle A, dann mit belegten Anteilen |
| Ministerienzahl | 16 seit 2018, 17 seit 2021 | 17 | **17** (Stand 2021, so auch im Spiel ab 2028) |
| Behördenkennung Präsidialamt | `stab` | `praesidialamt` | **`stab`** (eine Kennung, `RESSORT_POSTEN` angepasst) |
| Rüstung | Kabinett: Verteidigung | – | Anhang C/D: **eine Bauleiste in Land**, begonnen in Sicherheit, Zeilen mit Ministeriumsabzeichen |



---

# Anhang A: Einstieg, Schreibtisch, Hauptmenü, Politik, Parlament, Kabinett

Grundlage: `PLAN_OBERFLAECHE_2026-11-05.md` (Abschnitte 2, 3, 4), ENTSCHEIDUNGEN W vom 5. November (17 Ministerien, ein Weg zum Gesetz, Karte als Bühne) und die Kritik `kritik-A.md`. Alle Pfade gelten relativ zu `/home/user/NWO/game/src`. Richtwert: Bildschirm 1440×900, Akteninhalt ca. 1150×750 px.

Für alle Ansichten gelten Regeln, die hier nicht bei jeder Ansicht wiederholt werden (**R1–R8**):

- **R1 Zahlen.** Indizes (0–100) werden als ganze Zahl gezeigt. Prozent haben höchstens eine Nachkommastelle, und nur wenn sie im echten Leben üblich ist (Inflation 19,2 %, Leitzins 23,5 %). Kapital ist immer eine ganze Zahl. Geld steht in Mrd. ₺ ohne Nachkommastelle und zusätzlich in % des BIP mit einer Stelle. Fristen bis 60 Tage stehen in Tagen, darüber in Monaten („in 22 Monaten“), über 24 Monaten in Jahren.
- **R2 Richtung.** Rot heißt schlechter, Grün besser. Es gibt **eine** Quelle für „hoch ist schlecht“, eine neue Funktion `hochIstSchlecht(id)` in `sim/wertung.ts`. Sie ersetzt drei heute getrennte Listen: `HOCH_SCHLECHT` in `sim/personen.ts:17`, `SCHLECHT_WENN_HOCH` in `ui/politik/bereiche.ts:58` und `EXTRA_SCHLECHT`/`schlechtBeiHoch` in `sim/berichte.ts:160–169`. Ein Pfeil ▲▼ zeigt nur den Trend, die Farbe zeigt die Wertung.
- **R3 Eine Größe, ein Wert.** Zustimmung hat genau zwei benannte Werte: „Stab misst“ (`spiel.umfrage.zustimmung`) und „Umfrage“ (`angezeigteZustimmung(w)` in `sim/medien.ts:863`). Wo beide stehen, stehen sie nebeneinander und tragen ihren Namen.
- **R4 Preis am Knopf.** Jeder Knopf, der etwas verändert, trägt Kapital, Aufmerksamkeit und Geld in seiner Beschriftung oder als Marke direkt daran („Einbringen · 6 Kapital“). Regeltext steht im ⓘ.
- **R5 Höchstens zwei Ebenen.** Bereich → Ansicht. Ein Drill-down öffnet sich **im** Bild (Seitenleiste oder Zoom), nicht als weiterer Reiter.
- **R6 Personen** erscheinen als klickbares Porträt (`PersonPortraet`/`Cameo` unter `ui/art`). Ein Klick öffnet die Ministerakte bzw. die Parteikarte.
- **R7 Loyalität** hat **eine** Skala mit fünf Worten aus `stimmungVon` in `sim/kabinett.ts:83`. Wegfallen `loyalWort` in `ui/akte/Bausteine.tsx:45` und die Schwellen 40/55 als Text in `sim/ministerfluss.ts:488/549`. Die Schwellen bleiben als Spielregel erhalten, ihr Wort kommt aber aus derselben Skala.
- **R8 Höhe.** Jede Ansicht ist höchstens 1,3 Bildschirme hoch (≤ 1.000 px Inhalt). Längere Listen sind Ausklapper oder Seitenleisten.

---

## Teil 1: Gemeinsame Grundlagen

### 1.1 Ein Weg zum Gesetz (Entscheidung W2)

**Heute** gibt es zwei Wege, die beide auf dasselbe Politiknetz wirken:

| | Weg „Maßnahme“ | Weg „Gesetzesvorhaben“ |
|---|---|---|
| Daten | `NET.nodes` mit `kind:"massnahme"` (117 Maßnahmen, `data/politiknetz.ts`) | `GESETZESVORHABEN` in `data/gesetzesvorhaben.ts` (26 Einträge mit je `massnahme`, `richtung`, `schritte` 30/18/8, `fuer`, `gegen`, `erlass`, `grundrechte`, `protest`, `kommunal`, `kalender`) |
| Einbringen | `bringeEin(w, id, stufe, ort, "gesetz"/"erlass")` in `sim/handeln.ts:497` aus `MassnahmenTafel` und Wirkungsnetz | `bringeVorhabenEin(w, id, fassung, weg)` in `sim/gesetzgebung.ts:332`. Ruft intern `bringeEin` auf und ergänzt `name`, `vorhaben`, `fassung`, `stimmenBonus` |
| Stimmen | `pruefeVorhaben(...).gesetz.stimmen.erwartet` | dieselbe Zahl **plus** `stimmenBonusFuer(w, v, fassung)` (`sim/gesetzgebung.ts:213`): Kompromiss holt Oppositionsstimmen, scharf verliert Partner |
| Folgen | Netzwirkung | zusätzlich `folgenNachBeschluss` (Verbände, Wählergruppen, Protest, Rathäuser), `ruhe`, Normenkontrolle (`pruefungen`, `klaeger`) |
| UI | `ui/politik/MassnahmenTafel.tsx`, Wirkungsnetz | `ui/gesetze/Gesetzesvorhaben.tsx` (Kachelwand „Mehrheit steht“) |

Hier liegt die Ursache für „373 gegen 362“: Die Kachel rechnet mit dem Bonus der Fassung „Kompromiss“, die Fraktionsseite ohne.

**Neu, Regel G1–G8:**

- **G1 Eine Eingangstür.** Gesetze bringt man nur noch an der Maßnahmenzeile ein (Politik → Bereich → Zeile → Prüfzeile). `ui/gesetze/Gesetzesvorhaben.tsx` entfällt als Ansicht, die Logik in `sim/gesetzgebung.ts` bleibt.
- **G2 Benannte Fassungen.** Hat eine Maßnahme einen Eintrag in `GESETZESVORHABEN`, zeigt ihre Prüfzeile über dem Regler drei Knöpfe: „Mindestlohngesetz: scharf · Kompromiss · verwässert“. Jeder Knopf setzt den Regler auf `stufe + richtung × schritte[i]`, so wie es `vorhabenSicht` (`sim/gesetzgebung.ts:241`) schon rechnet. Der Name kommt aus `t("gesetz.v.<id>.titel")`, der Satz aus `gesetz.v.<id>.satz`. Ohne Katalogeintrag zieht man den Regler frei. Die Zeile heißt dann „Änderung: Mindestlohn auf Stufe 60“.
- **G3 Eine Prognose.** Neue Funktion `gesetzesPrognose(w, massnahme, ziel, ort)` in `sim/gesetzgebung.ts`. Sie liefert `{ ja, luecke, urteil, fassung, stimmenBonus, dafuer, dagegen, erlass, gerichtP, pk, kostenBip, monate }`. `MassnahmenTafel.Pruefzeile`, `vorhabenSicht` und die Tagesordnung nutzen nur noch sie. Liegt die freie Stufe auf einer Fassungsstufe, gilt deren Bonus. Für freie Stufen schlage ich **Variante A** vor: die nächstliegende Fassung nach Betrag des Schritts (≥ scharf → scharf, ≥ Kompromiss → Kompromiss, sonst verwässert). **Variante B** wäre: kein Bonus, keine Verbandsfolgen. Das ist eine **Regeländerung** (Variante A gibt freien Entwürfen Verbandsfolgen, die sie heute nicht haben) und muss in ENTSCHEIDUNGEN entschieden werden (offene Frage 1).
- **G4 Dafür/Dagegen.** `lagerVon(w, v)` (`sim/gesetzgebung.ts:110`) erscheint in der Prüfzeile als zwei Porträt- bzw. Ikonenreihen. Wählergruppen tragen ihre Ikone aus `ui/waehler`, Verbände eine Wappenikone. Bei Maßnahmen ohne Katalog zeigt die Prüfzeile stattdessen die betroffenen Wählergruppen aus den Netzkanten (`NET.edges` mit `to` = Gruppenknoten).
- **G5 Erlass.** Den Knopf „Als Erlass · n Kapital · Gericht p %“ gibt es nur, wenn `erlassMoeglich(id)` (`sim/handeln.ts:311`) gilt und, bei einem Katalogeintrag, `v.erlass === "anfechtbar"` und nicht `grundrechte`. Das Risiko kommt aus `gerichtWahrscheinlichkeit` (`sim/gesetzgebung.ts:199`).
- **G6 Ruhe und Prüfung.** `ruhe[v.id]`, `pruefungen` und `neuanfangGrund` sperren den Einbringen-Knopf. Der Grund steht als Satz am gesperrten Knopf, z. B. „Ruht noch 4 Monate nach der Annahme“.
- **G7 Ministervorschläge** (`sim/vorschlaege.ts`, ministerfluss-Vorlagen mit Maßnahmenbezug) erscheinen an der Zeile nur als Marke „Murat Erdem rät: Stufe 60“ (heute `po2.vorschlag` in `MassnahmenTafel.tsx`). Als Entscheidung stehen sie im Eingang des Schreibtischs. Vorschläge, deren Vorschau keine Änderung ergibt (`nutzen.jetzt === nutzen.mit === nutzen.ohne`, Bild 003: „20 → 20 · ohne Eingriff 20“), werden nicht mehr erzeugt bzw. nicht gereiht (`sim/ministerfluss.ts`, `empfiehl`, und die Reihung in `sim/vorschlaege.ts:94`).
- **G8 Kalender.** `kalender` (z. B. Mindestlohn im Dezember, Renten im Juli) erzeugt wie bisher die Vorlage im Eingang. Der Klick darauf öffnet die Maßnahmenzeile mit vorgewählter Fassung „Kompromiss“.

**Was mit dem heutigen Parlament › Gesetzesvorhaben geschieht:**
- Die Kachelwand (Bild 006) entfällt.
- Die Suche wandert in die Politik-Ansicht als ein Suchfeld über den Bereichskreisen. Treffer sind Maßnahmen und Gesetzesnamen („Mietpreisbremse“ findet `m_mietdeckel`).
- „Auf dem Tisch“ (die ersten `GESETZGEBUNG.vorn` Vorhaben aus `gesetzesTisch`) wird im Bereichskreis zur Marke „Thema drängt“ (oranger Punkt) und im Eingang zu einer Zeile, wenn `akuteVorhaben(w)` (`sim/gesetzgebung.ts:312`) sie führt.
- Die Normenkontrolle (`laufendeVerfahren(w).gericht`) steht in der Tagesordnung.

**Was die Tagesordnung zeigt:** siehe Ansicht 3.2.

### 1.2 Die 17 Ministerien und die Zuordnung (Entscheidung W1)

**Recherchehinweis (vor dem Einbau belegen):** Der Präsidialerlass Nr. 1 vom 10.07.2018 (Cumhurbaşkanlığı Teşkilatı Hakkında CBK) schuf nach meiner Kenntnis **16** Ministerien. Die Zahl **17** entstand 2021: Das Ministerium für Familie, Arbeit und Soziales wurde in „Familie und Soziales“ und „Arbeit und Sozialversicherung“ geteilt, und „Umwelt und Städtebau“ bekam den Zusatz „Klima“. Die Zuordnung der Behörden (bağlı/ilgili/ilişkili kuruluşlar) steht im Präsidialerlass Nr. 4 (2018) und seinen Änderungen. Bitte am Text bei mevzuat.gov.tr prüfen, bevor die Liste und die Behördenzuordnung als Tatsache in die Daten gehen. Die Spalte „Behörden (real)“ unten ist **zu belegen**.

**Neue Amt-Kennungen** (`Figur["amt"]`, `sim/spiel-typen.ts`). Die vorhandenen Kennungen bleiben, damit alte Spielstände laden:

| # | Ministerium (de) | türkisch | `amt` | heute | Behörden (real, zu belegen) | Behörden im Spiel (`data/behoerden.ts`) |
|---|---|---|---|---|---|---|
| 1 | Justiz | Adalet | `justiz` | vorhanden | HSK (Vorsitz Minister), Strafvollzug | `justiz`, `sonderkammern` |
| 2 | Familie und Soziales | Aile ve Sosyal Hizmetler | `familie` | **neu** | – | – |
| 3 | Arbeit und Sozialversicherung | Çalışma ve Sosyal Güvenlik | `arbeit` | **neu** | SGK, İŞKUR | – |
| 4 | Umwelt, Städtebau und Klima | Çevre, Şehircilik ve İklim Değişikliği | `umwelt` | **neu** | TOKİ, İller Bankası | – |
| 5 | Äußeres | Dışişleri | `aussen` | vorhanden | Direktion für EU-Angelegenheiten | `diplomatie`, `vermittlung` |
| 6 | Energie und natürliche Ressourcen | Enerji ve Tabii Kaynaklar | `energie` | **neu** | BOTAŞ, MTA | – |
| 7 | Jugend und Sport | Gençlik ve Spor | `jugend` | **neu** | KYK (Stipendien, Wohnheime) | – |
| 8 | Finanzen | Hazine ve Maliye | `finanzen` | vorhanden | GİB, Privatisierungsverwaltung, (TÜİK, BDDK: Verhältnis prüfen) | `steuer`, `statistik`, `revision`, `datenabgleich` |
| 9 | Inneres | İçişleri | `inneres` | vorhanden | Polizei, Gendarmerie, AFAD, Migrationsverwaltung | `polizei`, `afad`, `grenzschutz`, `brennpunkte`, `mobile_teams`, `schwerpunkt` |
| 10 | Kultur und Tourismus | Kültür ve Turizm | `kultur` | **neu** | Stiftungsdirektion (Vakıflar) | – |
| 11 | Bildung | Millî Eğitim | `bildung` | **neu** | – (YÖK ist Verfassungsorgan, Art. 131) | `bildung` |
| 12 | Verteidigung | Millî Savunma | `verteidigung` | **neu** | Generalstab (seit 2018 dem Ministerium zugeordnet) | – |
| 13 | Gesundheit | Sağlık | `gesundheit` | **neu** | – | `gesundheit` |
| 14 | Industrie und Technologie | Sanayi ve Teknoloji | `industrie` (alias `wirtschaft`) | vorhanden als `wirtschaft` | TÜBİTAK, KOSGEB, Entwicklungsagenturen | – |
| 15 | Landwirtschaft und Forst | Tarım ve Orman | `landwirtschaft` | **neu** | DSİ, TAGEM | – |
| 16 | Handel | Ticaret | `handel` | **neu** | Zoll | – |
| 17 | Verkehr und Infrastruktur | Ulaştırma ve Altyapı | `verkehr` | **neu** | BTK, KGM, TCDD | – |
| – | Präsidialamt (kein Ministerium) | Cumhurbaşkanlığı | `stab` | vorhanden | Diyanet, Kommunikationsdirektion, MİT, SSB | `mit`, `cyber`, `schutzschirm`, `uebung`, `grenzlage` (prüfen) |
| – | Generalstab (Soldat, kein Minister) | Genelkurmay | `generalstab` | vorhanden | – | – |
| – | Zentralbank | TCMB | `zentralbank` | vorhanden | – | – |
| – | Bündnispartei, Opposition | – | `partner`, `opposition` | vorhanden | gehören ins Parlament, nicht ins Kabinett | – |

Die Behörden-Kennungen `sonderkammern`, `revision`, `datenabgleich`, `brennpunkte`, `mobile_teams`, `schwerpunkt`, `schutzschirm`, `uebung`, `grenzlage` und `vermittlung` sind in `data/behoerden.ts` laut `grep` Instrumente bzw. Unterkennungen. Ihre Zuordnung folgt der Mutterbehörde und ist beim Einbau am Feld `ressort` zu prüfen.

**Uneinheitliche Kennungen:** `data/behoerden.ts` nutzt `ressort: "praesidialamt"`, `sim/personen.ts` dagegen `amt: "stab"`. Eine Kennung (`stab`) für beides, `RESSORT_POSTEN` (`data/behoerden.ts:213`) wird angepasst.

**Maßnahmen je Ministerium** (alle 117 Maßnahmen aus `data/politiknetz.ts`, je genau ein Ministerium). Neues Feld `ressort: Amt` an `NodeSpec` oder eine Tabelle `MASSNAHME_RESSORT` in `data/ressorts.ts`. Das ersetzt `AmtDef.massnahmen` (`sim/personen.ts:42–99`):

| Ministerium | Maßnahmen | n |
|---|---|---|
| Justiz | m_justizreform, m_antikorruption, m_richterstellen, m_richterrat, m_haftvermeidung, m_urteilsumsetzung | 6 |
| Familie und Soziales | m_kindergeld, m_sozialhilfe, m_kinderbetreuung, m_gewaltschutz | 4 |
| Arbeit und Sozialversicherung | m_mindestlohn, m_renten, m_fruehrente, m_arbeitslosengeld, m_gewerkschaftsrechte, m_ausbildung, m_fachkraefteprogramm | 7 |
| Umwelt, Städtebau und Klima | m_umweltauflagen, m_co2_preis, m_bauindustrie, m_sozialwohnungen, m_mietdeckel, m_stadterneuerung, m_bauaufsicht, m_baukredite, m_bauamnestie, m_gebaeudeverstaerkung | 10 |
| Äußeres | m_eu_annaeherung (dazu die Diplomatie der Welt-Ansicht) | 1 |
| Energie und natürliche Ressourcen | m_energiesubventionen, m_solar_wind, m_kernkraft, m_gasfoerderung, m_netzausbau, m_lng_vertraege, m_regas_ausbau, m_gasspeicher, m_yeka_serie, m_sakarya_phase3, m_akkuyu_ppa, m_heimische_kohle, m_energieeffizienz, m_preiswahrheit, m_gashub, m_speicher_smartgrid | 16 |
| Jugend und Sport | m_stipendien | 1 |
| Finanzen | m_einkommensteuer, m_mwst, m_koerperschaftsteuer, m_kraftstoffsteuer, m_immobiliensteuer, m_steueramnestie, m_steuerfahndung, m_privatisierung, m_verwaltungsdigital, m_kreditgarantien, m_bankenaufsicht, m_versicherungspflicht | 12 |
| Inneres | m_polizei, m_polizeitechnik, m_fruehwarnsystem, m_afad_ausbau, m_versammlungsfreiheit, m_grenzschutz, m_integration, m_rueckkehr | 8 |
| Kultur und Tourismus | m_denkmalschutz, m_kulturfoerderung, m_archaeologie, m_tourismuswerbung | 4 |
| Bildung | m_lehrergehaelter, m_schulbau, m_religioese_schulen, m_berufsschulen, m_bildungstechnik, m_unigruendungen, m_wissenschaftsfreiheit | 7 |
| Verteidigung | m_verteidigung, m_wehrdienst, m_ruestungsindustrie, m_offiziersauswahl | 4 |
| Gesundheit | m_krankenhausbau, m_aerztegehalt, m_hausarzt, m_zuzahlungen, m_medizintechnik | 5 |
| Industrie und Technologie | m_investitionsanreize, m_kmu, m_industrie_modernisierung, m_forschung, m_regionalfoerderung | 5 |
| Landwirtschaft und Forst | m_agrarsubventionen, m_bewaesserung, m_staudaemme, m_wasserleitungen, m_saatgut, m_mechanisierung, m_agrarforschung | 7 |
| Handel | m_exportfoerderung, m_zoelle, m_preiskontrollen, m_handelssysteme | 4 |
| Verkehr und Infrastruktur | m_autobahnen, m_oepp_garantien, m_bahn, m_nahverkehr, m_breitband, m_smart_infrastruktur, m_instandhaltung, m_internetsperren | 8 |
| Präsidialamt | m_notstand, m_friedensprozess, m_digitale_oeffentlichkeit, m_medienaufsicht, m_staatsmedien, m_religionsbehoerde, m_minderheitenrechte | 7 |
| Generalstab | m_uebungen | 1 |
| **Summe** | | **117** |

**Fraglich und zu belegen:**
- `m_internetsperren`: Die Sperren laufen technisch über die BTK (Gesetz 5651). Politisch könnte man sie auch Präsidialamt oder Justiz zuordnen.
- `m_medienaufsicht`: Die RTÜK-Mitglieder wählt die TBMM. Hier steht sie beim Präsidialamt als politischem Träger.
- `m_mietdeckel`: Das Mietrecht steht im Obligationengesetz (Justiz).
- `m_wasserleitungen`: Gebaut wird von DSİ und den Kommunen bzw. der İller Bankası.
- `m_minderheitenrechte`: Die Zuordnung ist ausdrücklich offen.
- `m_bankenaufsicht`: Heute hängt sie am Amt `zentralbank` (`sim/personen.ts:63`). Die BDDK ist nicht die TCMB, darum wird sie verschoben.

**Datenlücke:** Für Jugend und Sport (1 Maßnahme) und Äußeres (1 Netzmaßnahme) hat das Netz kaum Hebel. Sportpolitik fehlt ganz. Vorschlag: Diese beiden Minister zeigen ihre Akte mit Behörden, Etat und Befehlen. Neue Maßnahmen gibt es erst nach einer Recherche, sie werden nicht erfunden.

**Politikbereiche → Leitministerium** (für das Porträt am Bereichskreis). „Mit“ heißt, dass Maßnahmen des Bereichs auch dort liegen:

| Thema (`Theme`) | Name | Leitministerium | mit |
|---|---|---|---|
| wirtschaft | Wirtschaft | Industrie und Technologie | Handel, Arbeit (Mindestlohn), Finanzen, Kultur und Tourismus |
| haushalt | Haushalt und Steuern | Finanzen | – |
| arbeit | Arbeit und Soziales | Arbeit und Sozialversicherung | Familie und Soziales |
| gesundheit | Gesundheit | Gesundheit | – |
| bildung | Bildung und Fachkräfte | Bildung | Jugend und Sport, Industrie und Technologie (Forschung) |
| wohnen | Wohnen, Bau und Erdbeben | Umwelt, Städtebau und Klima | Finanzen (Pflichtversicherung) |
| energie | Energie und Umwelt | Energie und natürliche Ressourcen | Umwelt, Städtebau und Klima |
| landwirtschaft | Landwirtschaft und Wasser | Landwirtschaft und Forst | – |
| infrastruktur | Infrastruktur und Verkehr | Verkehr und Infrastruktur | Industrie und Technologie (Regionalförderung) |
| sicherheit | Innere Sicherheit und Frieden | Inneres | Präsidialamt (Friedensprozess) |
| recht | Recht und Justiz | Justiz | Präsidialamt (Ausnahmezustand) |
| militaer | Streitkräfte | Verteidigung | Generalstab |
| kultur | Kultur und Erbe | Kultur und Tourismus | Präsidialamt (Minderheitenrechte) |
| gesellschaft | Medien und Gesellschaft | Präsidialamt | Familie (Gewaltschutz), Inneres (Versammlung), Verkehr (Internetsperren) |
| aussen | Außenpolitik und Migration | Äußeres | Inneres (Migration, Grenze), Handel (Zollsysteme) |

**Haushaltsposten → Ministerium** (`POSTEN[].amt` in `sim/haushalt.ts:108–147`). Diese Änderung schiebt Loyalitätsgewinne und -verluste bei Etatbeschlüssen auf andere Minister (`wende`, `sim/haushalt.ts:300–309`). Das ist eine sichtbare Regelfolge und gehört in ENTSCHEIDUNGEN:

| Posten | heute `amt` | neu | Anmerkung |
|---|---|---|---|
| rentenniveau, rentenalter | stab | arbeit | SGK |
| sozialhilfe | stab | familie | |
| gesundheit | stab | gesundheit | |
| bildung | stab | bildung | |
| forschung | wirtschaft | industrie | TÜBİTAK |
| verteidigung | generalstab | verteidigung | `ministerWunsch` (`sim/haushalt.ts:318`) prüft `p.amt === "generalstab"` für den doppelten Wunsch, das muss auf `verteidigung` umgestellt werden |
| innere_sicherheit | inneres | inneres | |
| investitionen | wirtschaft | **ressortübergreifend** | Datenlücke: Aufteilung nach Ressorts laut Investitionsprogramm (Yatırım Programı 2026) bzw. Tabelle A des Haushaltsgesetzes 2026 |
| wohnen | wirtschaft | umwelt | |
| landwirtschaft | wirtschaft | landwirtschaft | |
| umwelt_energie | wirtschaft | energie + umwelt | Datenlücke: Aufteilung offen; bis dahin ein Stück „Energie und Umwelt (zwei Ressorts)“ |
| kultur | stab | kultur | |
| justiz | justiz | justiz | |
| diplomatie | aussen | aussen | |
| personal | finanzen | **Öffentlicher Dienst** (kein Ressort) | Plan 4.1. Der Wunsch −1 bleibt beim Finanzminister |
| subventionen | wirtschaft | **ressortübergreifend** | Datenlücke |
| Steuern (einnahme) | finanzen | finanzen | |

**Ämter (`AEMTER`, `sim/personen.ts:42`) → neue Ordnung:**

| Amt heute | wird | `fach` (Leitgrößen) | Änderung |
|---|---|---|---|
| finanzen | Finanzen | unverändert | `massnahmen` laut Tabelle (+ m_kreditgarantien, m_bankenaufsicht, m_versicherungspflicht) |
| inneres | Inneres | + `protestdruck`? (nur falls Knoten vorhanden) | + m_fruehwarnsystem, m_afad_ausbau, m_integration, m_rueckkehr |
| aussen | Äußeres | unverändert | m_integration und m_grenzschutz fallen weg (gehen an Inneres), m_handelssysteme an Handel |
| justiz | Justiz | unverändert | + m_richterrat. m_antikorruption bleibt |
| stab | Präsidialamt | unverändert | Maßnahmen laut Tabelle |
| generalstab | Generalstab (Soldat) | bereitschaft_*, truppenmoral, offiziersvertrauen | bleibt Figur, aber **nicht** am Kabinettstisch, sondern als Gast. Maßnahmen bis auf m_uebungen gehen an Verteidigung |
| wirtschaft | Industrie und Technologie | investitionen, industrie | export → Handel, auslandskapital → Finanzen oder Handel (offen) |
| zentralbank | Zentralbank | unverändert | m_bankenaufsicht fällt weg |
| partner, opposition | Parlament | – | stehen nicht mehr unter „Verantwortliche“ (Bild 020) |
| – | 13 neue Ämter | `fach` = schlechteste Größen ihres Leitthemas aus `lageZeilen(w, theme)` (`ui/politik/bereiche.ts:174`) | `wirkung`: **leer bis zur Kalibrierung**. Die Werte d=0,06…0,12 der bestehenden Ämter sind Spielparameter, sie werden nicht ungeprüft kopiert |

**Wirkung auf das Politische Kapital (Regel, nicht stillschweigend ändern):** `kapitalEinkommen.kabinett = kabinettStatus(w).kapitalSumme` (`sim/spiel.ts:329`) summiert über alle Minister. Mit 17 statt 7 Ministern wüchse das Einkommen um mehr als das Doppelte. Vorschlag: `berechneMinisterKapital` (`sim/kabinett.ts:92`) wird mit 7/Ministerzahl gewichtet, damit die Summe gleich bleibt. Alternative: Gewichte nach Etatanteil. Das ist eine Entscheidung (offene Frage 2). Dasselbe gilt für `termineInfo` (`sim/gespraeche.ts:167`, 4 Termine in 30 Tagen bei jetzt 17 Ministern) und `kabinettStatus.disziplin`.

**Spielstand-Wanderung:** Alte Stände haben 7 Ministerfiguren. Nach dem Muster der `ZUSATZ_ROLLEN` in `sim/figuren.ts:37` werden die 13 neuen Figuren beim Laden mit einem **eigenen Zufallsstrom** erzeugt, damit der Hauptstrom gleich bleibt. `amt:"wirtschaft"` bleibt als Kennung und zeigt „Industrie und Technologie“. Namensvorrat: `NACHNAMEN` (`sim/figuren.ts:17`) hat 24 Einträge. Bei 17 Ministern, Generalstab, Zentralbank, Partei- und Nebenfiguren reicht das nicht. Er muss auf mindestens 60 türkische Nachnamen wachsen, sonst greift die Dopplungssperre in `name()` ins Leere. Vornamen sollen ebenfalls nicht doppelt sein (heute dreimal Cem).

### 1.3 Das gemeinsame Ressortrad

Eine Komponente `ui/wirtschaft/RessortRad.tsx`. Sie wird an drei Stellen genutzt: Haushalt Ebene 2 (Plan 4.2), Ministerakte und Eingang (Etatforderung eines Ministers).

- **Daten:** `POSTEN.filter(p => p.seite === "ausgabe" && ressortVon(p) === amt)`. Betrag je Stück: `etatBip(p, stufeVon(w, p.id))` × `staatsfinanzen(w).bip` / 100 (wie `radStuecke` in `ui/wirtschaft/HaushaltsRad.tsx:33`). Renten über `rentenSicht(w).etat`.
- **Stücke:** ein Stück pro Haushaltsposten des Ressorts, außen ein Ring mit den Behörden des Ressorts (`BEHOERDEN.filter(b => b.ressort === amt)`), deren Ausstattung als Punkte (Personal/Technik/Reichweite, `stand(w, id)` in `sim/behoerden.ts:67`).
- **Datenlücke (sichtbar):** Eine Aufteilung nach Ausgabenart (Personal, Betrieb, Investitionen, Programme) fehlt. Der Untertitel lautet „Aufteilung nach Haushaltsposten; Unterteilung nach Ausgabenart folgt mit der Quelle (Zentralhaushaltsgesetz 2026, Tabelle A)“. Hat ein Ministerium nur einen Posten (Justiz, Gesundheit, Bildung …), ist das Rad ein Vollkreis mit einem Stück. Das ist ehrlich, aber karg. Dann steht der Regler groß in der Mitte.
- **Regler je Stück:** Zeile mit −/+ und Stufe (`p.min…p.max`). Preis und Wirkung kommen aus `postenVorschau(w, id, stufe)` (`sim/haushalt.ts:256`) bzw. `haushaltsPostenEntscheidung` (`sim/haushaltsentscheidung.ts`). Gezeigt werden Kapital (0 im Haushaltsfenster), Mrd. ₺, Defizit vorher → nachher und die Loyalität des Ministers ±1. Im Fenster geht die Änderung in den Entwurf (`setzeEntwurf`), außerhalb als Nachtrag mit doppeltem Kapital (Regel wie heute).
- **Ressortübergreifende Posten** (investitionen, subventionen, personal) erscheinen in keinem Ministeriumsrad. Sie stehen nur im Gesamtrad als graue, benannte Stücke.

---

## Teil 2: Einstieg, Schreibtisch, Hauptmenü

#### Einstieg › Titel und Fortsetzen
1. **Frage und Erfolg:** „Weiterspielen oder neu?“ Erfolg: Nach 5 Sekunden weiß der Spieler, wo er stand (Datum, Zustimmung, Wahl in n Monaten) und klickt „Fortsetzen“.
2. **Aufbau (Zonen):** Wie Bild t01: Karte im Hintergrund, mittiger Rahmen 1000×630.
   - Z1 Siegel und Titel (oben, ~260 px)
   - Z2 Untertitel (40 px)
   - Z3 Knopfspalte 260 px breit (~250 px)
   - Z4 Fußzeile mit Datenstand (30 px)
   - Sprachwahl oben rechts.

   Alles passt auf einen Bildschirm.
3. **Inhalte je Zone:**
   - Z3a „Neues Spiel“ (Gold), führt zum Prolog `ui/Prologue.tsx`.
   - Z3b **Fortsetzen-Karte** statt Textknopf, 260×84. Inhalt: Porträt des Präsidenten (`world.player`, aus dem Spielstand nicht ohne Laden lesbar, deshalb neues Feld in `SpielstandInfo`), Name, Datum (`spielstandInfo().datum`), Zustimmung (`spielstandInfo().zustimmung` aus `snapshotVon`, `ui/speicher.ts:33`, ganze Zahl) und „Wahl in n Monaten“. **Datenlücke:** `SpielstandInfo` (`ui/speicher.ts:43`) kennt weder Porträt-Saat noch Wahltag. Neue Felder `portraet?: string`, `wahlInTagen?: number` werden beim Sichern geschrieben.
   - Z3c „Frühere Sicherungen (n)“ klappt `fruehereStaende()` (`ui/speicher.ts:321`) als Liste auf: Datum · Zustimmung · gesichert um.
   - Z3d „Aus Datei laden“ (`importiereSpielstandDatei`).
   - Z4 Datenstand und Kurzlizenz, Link „Quellen und Lizenzen“ öffnet `ui/quellen/Quellen.tsx` als Fenster.
4. **Zustände:**
   - Kein Spielstand: Z3b, Z3c und Z3d sind ausgeblendet, nur „Neues Spiel“ und „Aus Datei laden“ bleiben.
   - Spielstand mit `ende`: Die Karte zeigt „Amtszeit beendet · Rückblick“ und lädt den Rückblick.
   - Speicherfehler: `letzterSpeicherfehler()` erscheint als rote Zeile unter der Karte.
5. **Klicks:**

| Element | Aktion | Ergebnis | landet in |
|---|---|---|---|
| Sprache | Klick | Sprache wechselt, `ui/SprachWahl.tsx` | Titel |
| Neues Spiel | Klick | Rückfrage, falls ein Stand existiert („Ihr Stand vom 3. Februar 2030 bleibt unter Frühere Sicherungen“) | Prolog |
| Fortsetzen-Karte | Klick / Enter | `ladeSpielstand()` | Stand der Dinge |
| Frühere Sicherungen | Klick | klappt auf | Liste |
| Eintrag der Liste | Klick | `ladeRueck(key)` | Stand der Dinge |
| Aus Datei laden | Klick | Dateiauswahl, `importiereSpielstandDatei` | Stand der Dinge |
| Quellen und Lizenzen | Klick | Fenster `Quellen` | Titel (Fenster) |

6. **Übernommen / gelöscht:** `ui/App.tsx` (Titelblock um Zeile 139) wird umgebaut, `titel.fortsetzen_datum` wird zur Karte. Das Laden im Schreibtisch-Reiter „Spielstand“ (s4) entfällt (siehe Hauptmenü).
7. **Simulationsbedarf:** keiner. Nur `ui/speicher.ts` bekommt die Felder `portraet` und `wahlInTagen` in `SpielstandInfo` und `snapshotVon`.
8. **Texte:** „Fortsetzen · 3. Februar 2030“ entfällt. Neu: „3. Februar 2030 · 50 % · Wahl in 10 Monaten“. „Spielstand aus Datei laden“ wird zu „Aus Datei laden“.
9. **Abnahme:** keine Nachkommastelle auf der Karte; Höhe ≤ 1 Bildschirm; `test/speicher.test.ts` um die neuen Felder erweitern; ein Test „Titel ohne Spielstand zeigt keine Fortsetzen-Karte“.
10. **Aufwand und Abhängigkeiten:** S. Keine Vorbedingung.

#### Einstieg › Stand der Dinge
1. **Frage und Erfolg:** „Was wartet auf mich, seit ich weg war?“ Erfolg: Der eine Knopf führt direkt zur dringendsten Sache. Der Spieler sieht höchstens drei Dinge und ihre Frist.
2. **Aufbau (Zonen):** Fenster 640×520 über der Karte (heute 640×560, Bild t02).
   - Z1 Kopf mit Datum, Amtszeit und Wahlbalken (80 px)
   - Z2 „Seit Ihrem letzten Besuch“ (nur wenn sich etwas bewegt hat, 70 px)
   - Z3 „Drei Dinge, die warten“ (3 Zeilen à 64 px)
   - Z4 „Zuletzt beschlossen“ (≤ 3 Zeilen, nur wenn vorhanden)
   - Z5 Knopfleiste (60 px)
3. **Inhalte je Zone:**
   - Z1: `standDerDinge(w, vorsitzung)` (`ui/standderdinge.ts:107`): `datum`, `amtszeit`, `monateBisWahl`. Dazu ein Wahlbalken, der vom letzten Wahltag bis `spiel.wahltag` reicht (Zeitstrahl, Füllung = vergangene Zeit).
   - Z2: Kacheln Zustimmung, Inflation, Kapital mit Vergleich. **Fehler heute:** Verglichen wird mit dem Beginn der letzten Sitzung (`vorsitzungSnapshot()`, `ui/speicher.ts:553`). Liegt diese Sitzung am selben Spieltag, ist der Vergleich immer ±0. **Neu:** Als Vergleichsbasis gilt der *Spieltag*, nicht die Sitzung. Hat sich seit dem Snapshot das Spieldatum nicht geändert (`vorsitzung.tag === w.day`), entfällt Z2 ganz. Sonst steht „seit 1. Januar 2030: Zustimmung 52 → 50 (▼2)“. Der Zustimmungswert ist „Stab misst“ (R3) als ganze Zahl.
   - Z3: Die ersten drei Einträge aus `schreibtischArbeit(...).alle` (`ui/schreibtisch/arbeitsplatz.ts:30`). Das ist dieselbe Reihung wie der Eingang, nicht die heutige Mischung aus `laufendeVorgaenge` (Bauten) und `warnungen(w).slice(0,3)`. Je Zeile: Porträt bzw. Ikone, Titel, Fristbalken (`p.tage`, Füllung über 30 Tage), Ton als Farbe. Laufende Bauten erscheinen nur, wenn sie in den nächsten 30 Tagen fertig werden („F-16 Block 70 fertig in 4 Monaten“ gehört nicht hierher).
   - Z4: `abgestimmt` (schon vorhanden) als Zeilen „Angenommen · Gebäude-Verstärkungsprogramm · 366 : 234“.
   - Z5: Primärknopf „Weiter: \<Titel der dringendsten Sache\>“, sekundär „Zum Schreibtisch“, tertiär „Zur Karte“.
4. **Zustände:**
   - Leer (nichts wartet): Z3 zeigt „Nichts drängt. Nächster fester Termin: \<agenda\>“, der Primärknopf heißt „Zum Schreibtisch“.
   - Krise: Liegt ein Ereignis mit Frist ≤ 3 Tage an, wird Z3 rot umrandet und der Knopf öffnet das Ereignisfenster.
   - Krieg: Die erste Zeile ist immer der Kriegsvorgang.
   - Vor der Wahl (≤ 8 Wochen): Der Wahlbalken ist rot, darunter „Wahlkampf läuft“.
5. **Klicks:**

| Element | Aktion | Ergebnis | landet in |
|---|---|---|---|
| Weiter: … | Klick / Enter | öffnet die Sache: `p.sprung` (intern → Eingang mit offener Zeile; extern → Ziel; vorgang → Vorgang) | Eingang bzw. Ereignisfenster |
| Zeile in Z3 | Klick | wie oben für diese Zeile | Eingang |
| Zum Schreibtisch | Klick | schließt | Eingang |
| Zur Karte | Klick / Esc | schließt | Karte |
| Abstimmung in Z4 | Klick | öffnet den Verlauf an diesem Datum | Verlauf |

6. **Übernommen / gelöscht:** `ui/StandDerDingeBlatt.tsx` wird umgebaut. In `ui/standderdinge.ts` werden `deltas` und `laufendeVorgaenge` neu geschrieben, `probleme` (warnungen) entfällt zugunsten der Eingangsreihung. Bild t02.
7. **Simulationsbedarf:** keiner. `KennzahlenSnapshot` braucht `tag` (vorhanden, wird in `abgestimmt` genutzt).
8. **Texte:** „± 0 zuletzt 50,2“ entfällt. „Laufende Vorgänge“ wird zu „Was wartet“. „Dringendste Frist“ fällt weg, weil das jetzt Zeile 1 ist.
9. **Abnahme:** Kein Vergleich bei gleichem Spieltag (Test in `test/stand-der-dinge.test.ts`: Snapshot am selben Tag ergibt `deltas === null`). Die erste Zeile entspricht `schreibtischArbeit(...).alle[0]` (Test). Keine Nachkommastelle. Höhe ≤ 560 px.
10. **Aufwand und Abhängigkeiten:** S. Hängt vom Eingang ab (gleiche Reihung, vorhanden).

#### Einstieg › Ereignisfenster
1. **Frage und Erfolg:** „Was passiert, was kann ich tun, was kostet es?“ Erfolg: Alle Antworten sind ohne Scrollen sichtbar, jede mit Preis und höchstens drei Folgen als Ikonen.
2. **Aufbau (Zonen):** Fenster 1060×720 (heute 1050×800, Bild t03).
   - Z1 Kopfbild (140 px, heute 150)
   - Z2 links Sprecherspalte 220 px mit Porträt, Name, Rolle und **einem** Ratsatz
   - Z3 rechts Titel, Zitat (2 Zeilen) und „Worum es geht“ (3 Kacheln, 70 px)
   - Z4 **Antworten nebeneinander**, 2–4 Spalten gleicher Breite, je ~200 px hoch
   - Z5 Fußzeile mit Fristbalken und „Später entscheiden“

   Alles in der ersten Bildschirmhöhe.
3. **Inhalte je Zone:**
   - Z1: `EreignisSzene thema` (`ui/ereignis/Szenen.tsx`). Für Themen mit Ort (Zypern, Provinz) zeigt die Szene **eine Kartenkachel** des Orts statt Globus und leerer Fahnen. Quelle ist der Ortsbezug der Vorlage (zu prüfen: `ansicht.vorlage`/`szene`). Fehlt der Ort, bleibt die Szene.
   - Z2: `sprecherFuer(w, ansicht)` (`ui/ereignis/kontext.ts:82`). Vom Rat (`sprecher.rat.zeilen`) bleibt **eine** Zeile. Sätze mit Stufen und Kapitalrechnung („von Stufe 35 auf 55; das kostet 9 Kapital“) kommen ins ⓘ.
   - Z3: `kennzahlenFuer(w, thema, id)`. Zustimmung als Paar „Stab 50 % · Umfrage 54 % (Ekran, vor 2 Tagen)“ (R3), heute nur die Umfrage (`kontext.ts:154`).
   - Z4: `ansicht.optionen`. Je Karte: Titel, Preis-Marke (`anzeigePk ?? pk` Kapital, Geld in Mrd. ₺ statt „0,05 % des BIP“), höchstens drei Folgen als Ikone, Pfeil und Wort („Schulden ↑“, „Religiös-Konservative ↑“, „Streitkräfte ↑“). Die Zahl der Folge steht im Hover, als ganze Zahl. Bei mehr als drei Antworten scrollt Z4 waagrecht mit sichtbarem Pfeil am Rand. Die heutige Liste `ev2-optionen` mit abgeschnittener dritter Karte entfällt.
   - Z5: `fristAnteil` (vorhanden), Satz „Ohne Entscheidung in 12 Tagen: \<Standardfolge\>“ **mit Namen** der Standardoption.
4. **Zustände:**
   - 0 Kapital: Karten mit Preis sind grau und tragen „fehlt n Kapital“ (heute `knapp`, `EreignisFenster.tsx:69`).
   - Krieg: Kopfbild rot getönt.
   - Ein einziges Optionspaar: zwei Spalten à 50 %.
5. **Klicks:**

| Element | Aktion | Ergebnis | landet in |
|---|---|---|---|
| Antwortkarte | Klick | entscheidet sofort (wie heute). Bei Preis ≥ 5 Kapital oder Krieg eine Bestätigung in der Karte („Wirklich? 4 Kapital“) | Karte, Meldung |
| Antwortkarte | Hover / Fokus | Folgen mit Zahl und Verzögerung | – |
| Tasten 1–4 | Taste | wählt Karte n (vorher Kollision mit Tempo- und Ebenentasten prüfen, Plan 6) | – |
| Porträt | Klick | öffnet die Ministerakte im Hintergrund, das Fenster bleibt offen | Ministerakte |
| „Mehr dazu“ | Klick | klappt den Text auf | – |
| Später entscheiden | Klick / Esc | schließt, das Ereignis steht im Eingang | Karte |
| × | – | **entfällt** (doppelt mit „Später“) | – |

6. **Übernommen / gelöscht:** `ui/EreignisFenster.tsx` wird umgebaut (Optionsliste → Spaltenraster), `ui/ereignis/kontext.ts` (Zustimmungspaar), `ui/ereignis/Szenen.tsx` (Ortskachel). `ui/EventWindow.tsx`: prüfen, ob der Code noch genutzt wird, und ggf. löschen.
7. **Simulationsbedarf:** keiner. Für die Ortskachel muss die Vorlage eine Ortsangabe tragen. Wo es sie nicht gibt, ist das eine Datenlücke je Vorlage.
8. **Texte:** „Schulden +0,05 Prozentpunkte“ wird zu „Schulden ↑ (0,6 Mrd. ₺)“. Die Umrechnung `geldAusBip` existiert (`sim/haushaltsentscheidung.ts` nutzt sie). „Rat aus dem Ressort“ bleibt als Überschrift, mit höchstens einem Satz.
9. **Abnahme:** Bei 1440×900 sind alle Antworten von Ereignissen mit ≤ 3 Antworten ohne Scrollen sichtbar (Test in `test/ereignis-fenster.test.tsx` per Layoutprüfung oder Snapshot der Spaltenzahl). Keine Zahl mit zwei Nachkommastellen. Die Standardfolge ist benannt.
10. **Aufwand und Abhängigkeiten:** M. Die Tastenbelegung hängt von Plan 6 ab (Tasten 1–4).

#### Schreibtisch › Eingang
1. **Frage und Erfolg:** „Was muss ich heute entscheiden?“ Erfolg: Oben steht die dringendste Sache, offen, mit zwei bis drei Knöpfen samt Preis. Jede Sache steht **nur hier** als Entscheidung.
2. **Aufbau (Zonen):** Akteninhalt 1150×750.
   - Links Z1 **Liste** (760 px breit): Zeilen à 56 px; die offene Zeile ≤ 360 px.
   - Rechts Z2 **Kalenderstreifen** (360 px): 30 Tage als senkrechter Zeitstrahl mit Ikonen.
   - Z3 Fußleiste (40 px): „n weitere im Posteingang“.
   - Kein Kopf mit Kennzahlen (die obere Leiste reicht).

   Erste Bildschirmhöhe: die ersten 6 Zeilen und die offene Zeile.
3. **Inhalte je Zone:**
   - Z1 Liste: `schreibtischArbeit(w, tageslage(w), schreibtischMappe(w,5).mappe, gefaehrdeteZusagen(w)).alle` (heute `ui/schreibtisch/Schreibtisch.tsx`). **Neu dazu kommen:**
     - (a) Ereignisse, die mit „Später“ zurückgestellt wurden (heute Stage `spaeter`), als Zeile mit Frist. Ein Klick öffnet das Ereignisfenster.
     - (b) Ministervorschläge mit Maßnahmenbezug (G7), auch wenn sie heute in der Mappe stehen.
     - (c) Gesetzesfristen aus `regierungsVorgaenge(w)` nur dann, wenn eine Handlung möglich ist (Stimmen fehlen, Duldung läuft aus). Sonst stehen sie nur im Kalender.
   - Je Zeile:
     - Porträt (`Cameo` des Ministers) oder Ikone (Ereignis, Zusage, Vorgang)
     - Titel ≤ 60 Zeichen
     - Grund als eine Zeile
     - Fristbalken mit Text (R1, „in 9 Tagen“ / „überfällig“)
     - Ton-Punkt
   - Die offene Zeile zeigt `TischDetail` (vorhanden) **gekürzt**: Optionen als 2–3 Karten mit Preis am Knopf und einem „Entscheiden“ je Karte. Die Vorschau erscheint beim Darüberfahren bzw. Fokussieren, nicht erst nach „Antworten und Folgen vergleichen“ (Bild s1b). Regelsätze zu Groll und Beziehungspreis kommen ins ⓘ am Preisschild. Das Zitat des Ministers hat ganze Zahlen (heute „87,3“, `VorlageKarte.tsx`/`zahl()`; Indizes nach R1).
   - Z2 Kalender: dieselbe `fristen`-Liste wie heute (`Schreibtisch.tsx`, Aufbau aus `regierungsVorgaenge`, `faellig`, `termine`, Wahlkampfbeginn), aber **als Zeitstrahl**. Tage 0–30 senkrecht, Ikone je Termin (Waage = Abstimmung, Münze = Haushalt, Urne = Wahl, Globus = Wahl im Ausland). Ausländische Wahlen (`termine` mit `weich`) sind kleiner und grau. Darunter klein „Aufmerksamkeit 100 · Belastung 12“ (aus `verfassungSicht`, `briefing.ts:253`) mit ⓘ.
   - Wegfallen im Eingang:
     - Kopf-Kennzahlen (`KENNZAHLEN`, Zustimmung, Kapital, Mehrheit, Preise sind doppelt zur Leiste)
     - Ausklapper „In Arbeit“ und „Rückblick“ (gehen in den Verlauf bzw. in die Ministerakte)
     - Epochenband (geht in den Verlauf)
     - Mentorin-Block (wird zum ⓘ-Knopf in der Leiste)
     - Türen „Alle Vorlagen und Befehle“ und „Heute: Was jetzt ansteht“ (doppelt)
     - Der Krisenrat (`Krisenrat`) wandert in die Wirtschaftsakte. Er bleibt hier nur dann als Zeile, wenn eine Krise aktiv ist.
4. **Zustände:**
   - Leer: „Nichts liegt auf dem Tisch. Nächster Termin: …“ und ein Knopf „Zeit laufen lassen“.
   - Krise: Krisenzeile oben, rot.
   - Krieg: Kriegsvorgang immer an Platz 1.
   - Vor der Wahl: Der Wahltag steht im Kalender als großer roter Strich.
   - 0 Kapital: Knöpfe mit Preis sind grau und tragen „fehlt n“. Eine Zeile „Kapital: nächster Zufluss am 1. März (+10)“ zeigt `kapitalEinkommen(w).summe`/`naechste`.
5. **Klicks:**

| Element | Aktion | Ergebnis | landet in |
|---|---|---|---|
| Zeile (intern) | Klick | klappt auf bzw. zu (nur eine offen) | Eingang |
| Zeile (extern/vorgang) | Klick | springt (↗) | Zielansicht |
| Porträt in Zeile | Klick | Ministerakte | Kabinett › Ministerakte |
| Optionskarte | Hover / Fokus | Vorschau der Folgen | – |
| Entscheiden · n Kapital | Klick | entscheidet, Zeile verschwindet, nächste öffnet sich | Eingang |
| ⓘ am Preis | Klick | Regeltext | Popover |
| Kalendereintrag | Klick | springt zum Vorgang (Tagesordnung, Haushalt, Wahl) | Zielansicht |
| n weitere | Klick | Posteingang (`ui/minister/Posteingang.tsx`) als Seitenleiste | Eingang |
| Taste ↑/↓, Enter | Taste | bewegt die Auswahl, öffnet | – |

6. **Übernommen / gelöscht:**
   - Bleiben: `ui/schreibtisch/Schreibtisch.tsx` (Liste, `TischDetail`) und `arbeitsplatz.ts`.
   - Entfallen: `SchreibtischInArbeit`, `SchreibtischRueckblick` und `EpochenBand` aus dem Eingang. Die beiden ersten gehen in Verlauf bzw. Ministerakte, das Epochenband in den Verlauf.
   - `ui/minister/Mappe.tsx` und `VorlageKarte.tsx` werden auf Kartenform mit Preis am Knopf umgebaut.
   - Reiter Chronik, Berichte, Spielstand und Quellen der Schreibtisch-Akte (s2–s5) entfallen.
   - Bilder s1, s1b. Der Ministerfall erscheint nicht mehr in Parlament (007) und Ministerrat (015).
7. **Simulationsbedarf:**
   - `schreibtischArbeit` nimmt zurückgestellte Ereignisse auf. Dafür braucht es eine neue Quelle in der Simulation statt UI-Zustand (`spaeter` liegt heute in Stage). Neues Feld `spiel.zurueckgestellt: { id, frist }[]`. Prüfen, ob die Ereignisschlange (`sim/ereignisse.ts`) das schon führt.
   - Vorschläge ohne Wirkung werden gefiltert (G7).
8. **Texte:** „Auf dem Tisch 8“ wird zu „Zu entscheiden · 8“. „Erst vergleichen, dann entscheiden …“ entfällt. „Groll“ und „Beziehungspreis“ kommen nur im ⓘ vor, mit Erklärung. „1,0 Kapital“ wird zu „1 Kapital“.
9. **Abnahme:**
   - Eine Ministerangelegenheit (z. B. `rv-*`, `ra-*`) erscheint in keiner anderen Ansicht als Entscheidung (Test: Rendern von Halbrund, Kabinettstisch und Politik enthält ihren Titel nicht als Knopf).
   - Die offene Zeile ist ≤ 360 px hoch.
   - Kein Wert der oberen Leiste wird wiederholt.
   - `test/schreibtisch-arbeitsplatz.test.tsx`, `schreibtisch-lage-aktuell.test.tsx` und `schreibtisch-briefing.test.ts` anpassen (Kopfkennzahlen und Türen entfallen).
10. **Aufwand und Abhängigkeiten:** M. Vorbedingung: Ministerakte (für Porträtklick) und Verlauf (für das Ausgelagerte).

#### Schreibtisch › Verlauf
1. **Frage und Erfolg:** „Was ist passiert, und hat es gewirkt?“ Erfolg: Eine Kurve der Amtszeit mit Punkten. Ein Klick auf einen Punkt zeigt Vorher/Nachher und führt zur Maßnahme zurück.
2. **Aufbau (Zonen):**
   - Z1 Zeitleiste (1150×300): Zustimmungskurve über die ganze Amtszeit mit Ereignispunkten darauf, Wahltage als senkrechte Linien.
   - Z2 Filterleiste (40 px): Ikonen Ereignis · Gesetz · Bericht · Wirtschaft · Außen · Personen.
   - Z3 links Liste der Punkte im sichtbaren Ausschnitt (420 px breit), rechts Z4 Detail des gewählten Punkts (700 px).

   Erste Bildschirmhöhe: Z1, Z2 und die ersten 5 Einträge.
3. **Inhalte je Zone:**
   - Z1 Kurve: `spiel.umfrage.verlauf` (`{monat, wert}`, genutzt in `ui/akte/Bereiche.tsx:376`), ganze Amtszeit. **Achse 0–100 oder 30–70 mit markiertem Achsenbruch.** Die heutige Achse 50–52 (`VerlaufsDiagramm`) entfällt. Linie bei 50 („Mehrheit im Volk“ wie in `ui/Chronik.tsx`). Zweite, gestrichelte Linie für die veröffentlichten Umfragen, wo vorhanden (`institutsReihe`, `sim/medien.ts`).
   - Punkte kommen aus `world.log` (`LogEntry` mit `kind`, `abstimmung`, `day`, `date`, `text`, `why`).
     - Gesetze (`l.abstimmung`): Farbe angenommen/abgelehnt.
     - Wirkungsberichte (`spiel.berichte`, Typ `Bericht` in `sim/berichte.ts:110`): Farbe nach `phase` (wirkt = grün, gemischt = gelb, gegenlaeufig = rot, zu_frueh = grau).
     - Ereignisentscheidungen.
     - Historische Momente aus `epochenSicht(w).momente` (`sim/epoche.ts`).
   - Mehrere Punkte im selben Monat stapeln sich zu einer Zahl im Kreis.
   - Z3 Liste: Datum, Ikone, Titel. **Ohne** den doppelten Titel im Text (Bild s2: „Rentner fordern Ausgleich: …“ zweimal). Text = `bericht.kurz` bzw. `l.text`; der Titel wird abgeschnitten, wenn er den Text wiederholt.
   - Z4 Detail:
     - Bericht: `BerichtAkte` (`ui/politik/BerichtAkte.tsx`) gekürzt auf je Größe (`bericht.groessen`) ein Vorher/Nachher-Balkenpaar mit ganzen Zahlen, Phase als Wort, Umsetzungsstand (`reife`). „Was der Bericht nicht sagen kann“ steht nur noch als ⓘ.
     - Ereignis: gewählte Antwort und Folgen.
     - Gesetz: Ja/Nein als Mini-Halbrund.
   - Laufende Beschlüsse („In Arbeit“, heute `SchreibtischInArbeit`): kleiner Block über Z3, „Läuft: Gebäude-Verstärkungsprogramm 26 → 40, noch etwa 4 Jahre“, Quelle `umsetzungsStand`/`restMonate` (`sim/umsetzung.ts`). Das ersetzt Parlament › Umsetzung (Bild 008).
4. **Zustände:**
   - Erster Monat: „Noch kein Verlauf. Die Kurve beginnt mit Ihrer ersten Umfrage.“
   - Viele Punkte (> 200): Z1 zeigt Monatsbalken statt Einzelpunkten.
   - Nach der Wahl: Amtszeiten werden durch eine dicke Linie getrennt, beschriftet „2. Amtszeit“.
5. **Klicks:**

| Element | Aktion | Ergebnis | landet in |
|---|---|---|---|
| Punkt auf der Kurve | Klick | wählt den Eintrag, Z3 scrollt dorthin, Z4 zeigt das Detail | Verlauf |
| Punkt | Hover | Datum und Titel | – |
| Kurve ziehen / Mausrad | Ziehen | Ausschnitt verschieben bzw. zoomen | – |
| Filterikone | Klick | an/aus | – |
| Listeneintrag | Klick | wie Punkt | Verlauf |
| „Maßnahme nachjustieren“ (im Berichtdetail) | Klick | öffnet die Maßnahmenzeile mit offener Prüfzeile | Politik |
| Ministername im Detail | Klick | Ministerakte | Kabinett |

6. **Übernommen / gelöscht:**
   - `ui/Chronik.tsx` (Kurve und Liste) und `ui/politik/BerichtAkte.tsx` (Detail) gehen hierin auf.
   - Aus `SchreibtischRueckblick` stammen die Zeitung („Ausgabe lesen“ als Link zur Medienakte) und die Ziele (als Ausklapper unter Z1). `EpochenBand` wird über Z1 als Band „Ihre Epoche: heroisch · +12“ gezeigt.
   - `UmsetzungAkte` (`ui/politik/UmsetzungAkte.tsx`) wird in Teilen übernommen.
   - Entfallen: Schreibtisch › Chronik (s2), Schreibtisch › Berichte (s3), Parlament › Umsetzung (008), Gesetzesbilanz (012), Regierungsbilanz (019) und alle `VerlaufAnsicht`-Reiter (`ui/akte/Bereiche.tsx:394`).
7. **Simulationsbedarf:** keiner. Eine reine Lesefunktion `verlaufsPunkte(w)` in `sim/chronik.ts` führt Log, Berichte und Momente zusammen (mit Test).
8. **Texte:** „Wirkungsbericht:“ als Präfix entfällt (die Ikone sagt es). „Gemischte Bilanz“ wird zu „wirkt teilweise“ mit Farbe. Die Unterscheidung kommt aus `phase`, nicht aus `urteil`.
9. **Abnahme:** Die y-Achse umfasst mindestens 20 Punkte. Jeder Bericht ist genau einmal als Punkt da (Test über `verlaufsPunkte`). Kein Satz wiederholt den Titel. Höhe ≤ 1,3 Bildschirme. `test/berichte.test.ts` und `berichte-neu.test.ts` bleiben, die UI-Tests für Chronik werden neu geschrieben.
10. **Aufwand und Abhängigkeiten:** M–L. Keine Vorbedingung.

#### Hauptmenü (≡) › Spielstand, Datei, Quellen, KI
1. **Frage und Erfolg:** „Wie sichere oder lade ich, woher kommen die Daten, wie stelle ich die KI ein?“ Erfolg: Alles Technische liegt hinter ≡ oben rechts, nichts davon in einer Akte.
2. **Aufbau (Zonen):** Das vorhandene Menü (`KopfMenue`, `ui/kopf/Kopfleiste.tsx:182`) bleibt eine Tafel mit Einträgen: Sichern (Strg+S) · Spielstände … · Ton · Sprache · KI-Berater … · Quellen und Lizenzen · Zum Titel. „Spielstände …“, „KI-Berater …“ und „Quellen …“ öffnen ein **Fenster** (900×640) mit drei Reitern Spielstände | KI | Quellen. Das ist eine Ebene.
3. **Inhalte je Zone:**
   - Reiter Spielstände: `SpeicherDossier` (`ui/SpeicherDossier.tsx`) gekürzt.
     - Oben: „Aktueller Stand · 3. Februar 2030 · 50 %“ mit Knöpfen „Jetzt sichern“, „Als Datei sichern“ (ohne „.json“) und „Datei laden“.
     - Mitte: „Frühere Sicherungen“ (`fruehereStaende()`).
     - Unten: fünf feste Plätze, als Raster 5×1 mit leeren Plätzen als „＋“. Die Notiz erscheint erst nach Klick (heute fünf Zeilen mit Eingabefeld, Bild s4).
     - **Fehler:** „Weitester Stand“ steht auch dann da, wenn er älter ist als der aktuelle Stand. Behebung siehe Fehlerliste F14.
   - Reiter KI: `KiEinstellungen` (`ui/KiEinstellungen.tsx`) unverändert. Der Hinweis „Regelwerk · KI nicht eingerichtet“ aus dem Gespräch (Bild 016) steht nur hier.
   - Reiter Quellen: `Quellen` (`ui/quellen/Quellen.tsx`). **Kontrastfehler:** Die Farben in `ui/quellen/quellen.css` (#cdb98f, #a89a80, #d8c69a … in Zeilen 15–74) sind für dunklen Grund gewählt, stehen aber auf Pergament. Neu werden die Tokens des Pergaments verwendet (Text ≥ 4,5:1).
4. **Zustände:** Speicherfehler: ≡ trägt einen roten Punkt (vorhanden), der Reiter Spielstände zeigt den Grund. Keine früheren Sicherungen: Der Abschnitt entfällt.
5. **Klicks:**

| Element | Aktion | Ergebnis | landet in |
|---|---|---|---|
| ≡ | Klick / Esc | Tafel auf/zu; **hält die Zeit an** (Plan 6) | – |
| Sichern | Klick / Strg+S | `speichere(w)` | – |
| Spielstände … | Klick | Fenster, Reiter Spielstände | Menüfenster |
| Laden (Eintrag) | Klick | Rückfrage, dann `ladeRueck`/`ladeSlot` | Stand der Dinge |
| Platz n „＋“ | Klick | Notizfeld und Sichern | – |
| Als Datei sichern | Klick | `exportiereSpielstandDatei` | Download |
| KI-Berater … | Klick | Reiter KI | Menüfenster |
| Quellen … | Klick | Reiter Quellen | Menüfenster |
| Attributionstext kopieren | Klick | Zwischenablage | – |
| Zum Titel | Klick | Rückfrage („Ihr Stand ist gesichert“) | Titel |

6. **Übernommen / gelöscht:** `SpeicherDossier.tsx`, `KiEinstellungen.tsx` und `quellen/Quellen.tsx` werden wiederverwendet. Es entfallen die Schreibtisch-Reiter Spielstand (s4) und Quellen (s5) sowie das Akten-Ziel `speicher` in `Stage.tsx`.
7. **Simulationsbedarf:** keiner.
8. **Texte:** „Als Datei sichern (.json)“ wird zu „Als Datei sichern“. „Feste Speicher-Slots (1 bis 5)“ wird zu „Eigene Plätze“.
9. **Abnahme:** In keiner Akte steht ein Lade-, Sicher- oder Quellenknopf (Test über die Navigation: `test/aktennavigation.test.tsx`). Der Quellentext erreicht Kontrast ≥ 4,5:1 (`test/quellen.test.tsx` um eine Farbprüfung erweitern oder die Tokens prüfen). „Weitester Stand“ ist nie älter als der aktuelle Stand (Test in `test/speichern.test.ts`).
10. **Aufwand und Abhängigkeiten:** S.

---

## Teil 3: Politik

Die Politik ist **eine Ansicht** mit drei Stufen im selben Bild: Bereichskreise → Maßnahmentafel (Seitenfeld) → Wirkungsbild (in der offenen Zeile). Es gibt keine Reiter.

#### Politik › Bereichskreise
1. **Frage und Erfolg:** „Wo brennt es im Land?“ Erfolg: Ein Blick zeigt 15 Kreise. Die roten mit Ring sind sofort als Brennpunkte erkennbar, der größte rote Kreis ist das wichtigste Problem.
2. **Aufbau (Zonen):**
   - Z1 Suchfeld und Legende (1150×44).
   - Z2 **Kreisfeld** (links 640×700, wenn eine Tafel offen ist; sonst 1150×700): 15 Kreise in fester Anordnung nach `BEREICH_THEMEN` (`ui/politik/bereiche.ts:25`). Gruppiert sind sie in drei Bänder: „Was Menschen spüren“ (wirtschaft, haushalt, arbeit, gesundheit, bildung, wohnen), „Land und Versorgung“ (energie, landwirtschaft, infrastruktur), „Staat und Welt“ (sicherheit, recht, militaer, kultur, gesellschaft, aussen).
   - Z3 rechts **Maßnahmentafel** (500×700), sobald ein Kreis gewählt ist (siehe nächste Ansicht).
3. **Inhalte je Zone:**
   - Kreis: Ikone (`ui/politik/embleme.tsx`) und Name (`themeName`).
   - **Größe:** Bevölkerungsanteil, den die akuten Probleme des Bereichs berühren (Summe `ProblemZeile.last`, `problemeIn`). Ohne akutes Problem hat der Kreis die Mindestgröße.
     - **Datenlücke/Entscheid:** Democracy 4 skaliert nach Wählerzahl, hier gibt es keine „Betroffenen je Bereich“. Vorschlag: `max(last)` der Probleme, mindestens 0,15 (Anzeigeregel, kein Messwert).
   - **Farbe:** `ampel` aus `bereichKurz(w, theme)` (`ui/politik/bereiche.ts:308`): grün, gelb oder rot.
   - **Ring:** ein roter Ring je akutem Problem (`akut`, höchstens 3 Ringe).
   - **Punkt:** orange, wenn ein Vorhaben des Katalogs drängt (`akuteVorhaben`), blau, wenn etwas läuft (`laufend > 0`).
   - **Porträt** des Leitministeriums (Tabelle 1.2) klein an der Kreiskante, mit Loyalitätsring.
   - Hover: Tooltip mit `ampelGrund` und den drei `signale` (Name, ganze Zahl, Richtung nach R2).
   - Z1: Suchfeld über Maßnahmen-, Größen- und Gesetzesnamen (`GESETZESVORHABEN` → `t("gesetz.v.<id>.titel")`). Ein Treffer öffnet Kreis und Zeile.
   - Kriegsgefahr-Band (Bild 002) wird zu einer Marke am Kreis „Streitkräfte“ (rot pulsierend), wenn ein Konflikt > 65 (`krisenFuerMassnahme`/Konfliktlage). Der Regeltext „Endet, wenn …“ steht im ⓘ.
4. **Zustände:**
   - Alles ruhig: alle Kreise grün, Hinweis „Kein Bereich verlangt Aufmerksamkeit“.
   - Krise: Kreise mit gesperrten Maßnahmen (`blocker.art === "gesperrt"`) tragen ein Schloss.
   - Krieg: Der Kreis Streitkräfte steht in der Mitte.
   - 0 Kapital: keine Änderung am Bild, die Tafel zeigt die Preise grau.
5. **Klicks:**

| Element | Aktion | Ergebnis | landet in |
|---|---|---|---|
| Kreis | Klick | wählt den Bereich, die Tafel öffnet sich rechts, der Kreis wird hervorgehoben | Politik (Tafel) |
| Kreis | Hover | Tooltip | – |
| Ring (akutes Problem) | Klick | Karte mit Problemebene `problemId` (heute „Auf der Karte ansehen“) | Karte |
| Porträt am Kreis | Klick | Ministerakte | Kabinett |
| Suchtreffer | Enter | Kreis und Zeile offen | Politik |
| „Vollnetz“ (Knopf rechts oben) | Klick | `NetView` im Vollbild (`ui/NetView.tsx`) | Netz (Vollbild) |
| Esc | Taste | schließt die Tafel | Politik |

6. **Übernommen / gelöscht:**
   - `ui/politik/Politik.tsx` wird umgebaut: Die Reiter Bereiche, Vorschläge und Wirkungsnetz entfallen. Die Logik `alleBereiche`, `bereichKurz` und `vorschlaegeIn` bleibt.
   - Entfallen: Kachelwand und linke Liste (Bild 002), Vorschläge-Reiter (003; Vorschläge gehen in den Eingang und als Marke an die Zeile), Wirkungsnetz-Reiter (004; wird Wirkungsbild und Vollnetz-Knopf).
   - `ui/politik/VorschlagKarte.tsx` entfällt als Liste. Die Marke steht in `MassnahmenTafel`.
7. **Simulationsbedarf:** keiner (Anzeigeregeln für Größe und Farbe stehen in `ui/politik/bereiche.ts`).
8. **Texte:** Die Zählkacheln „7 angespannt / 4 Achtung / 4 ruhig / 10 akute Probleme“ entfallen. „Kriegsgefahr. …“ steht nur noch als Marke. Die Ampelworte bleiben (ruhig, Achtung, angespannt).
9. **Abnahme:**
   - 15 Kreise auf einem Bildschirm ohne Scrollen.
   - Keine Liste der Bereiche zusätzlich zum Bild.
   - Farbe = `ampel` (Test in `test/politik-bereiche.test.ts`: Kreisgröße monoton in `last`).
   - `test/politik-akten-ui.test.tsx` wird für die neue Ansicht neu geschrieben.
10. **Aufwand und Abhängigkeiten:** M. Vorbedingung für das Porträt ist 1.2 (Ministerien), sonst wird es ausgeblendet.

#### Politik › Maßnahmentafel (Seitenfeld) und Wirkungsbild (in der Zeile)
1. **Frage und Erfolg:** „Was kann ich in diesem Bereich tun, was kostet es, was bewirkt es?“ Erfolg: Alle Maßnahmen des Bereichs stehen als Zeilen mit Regler. Wer zieht, sieht Preis, Mehrheit, Dauer, Haushalt und die Wirkungspfeile an der Zeile und bringt das Gesetz dort ein.
2. **Aufbau (Zonen):** Seitenfeld 500×700 rechts neben dem Kreisfeld.
   - Z1 Kopf (80 px): Bereichsname, `ampelGrund`, Leitminister.
   - Z2 Lage (≤ 120 px): 3–6 Größen aus `lageZeilen(w, theme)` als Balken mit ganzer Zahl und Richtung (R2).
   - Z3 Zeilen (Rest, scrollt im Feld): je Maßnahme 44 px. Die offene Zeile wächst auf ≤ 420 px (Prüfzeile mit Wirkungsbild).
3. **Inhalte je Zone:**
   - Z2: `lageZeilen` (`ui/politik/bereiche.ts:174`), `bewertung` als Farbe, `delta` seit Amtsantritt als ▲▼ mit Zahl.
   - Z3 Zeile, wie `MassnahmenTafel` (`ui/politik/MassnahmenTafel.tsx`, schon umgebaut):
     - Name.
     - Stufe heute (`skala`/`naechsteStufe`, bei Prozentstufen nur „60“ statt „Stufe 60“).
     - Regler −/Schieber/+ (`stufenVon`).
     - Kleiner Strich der Marke „Ministervorschlag“ an der vorgeschlagenen Stufe (G7).
     - Laufend-Marke: im Parlament „Abstimmung in n Tagen“ oder Umsetzungsbalken `umsetzung.stand`/`rest`.
     - Schloss bei `blocker.gesperrt`, „teurer ×1,5“ bei `blocker.teuer`.
     - Rechts klein der Ressort-Kopf (Porträt 20 px) laut Tabelle 1.2.
   - Offene Zeile = **Prüfzeile** (heute `Pruefzeile`):
     - (a) **Fassungsknöpfe** (G2), wenn ein Katalogeintrag existiert.
     - (b) **Wirkungsbild**: links Ursachen (eingehende Kanten `NET.edges.filter(e => e.to === id)`, höchstens 3), Mitte die Maßnahme, rechts Wirkungen (ausgehende Kanten, die vier stärksten wie in `zielKanten` in `sim/berichte.ts:173`). Die Pfeildicke entspricht |weight|, die Farbe gut/schlecht nach R2 und Vorzeichen, ein Uhrsymbol steht für `lag` in Monaten. Die Beschriftung ist ganz (keine Überlappung: SVG mit fester Zeilenhöhe 22 px, Text abgeschnitten mit Tooltip). Das ersetzt den kaputten Block „Was folgt daraus?“ (Bild 004b).
     - (c) **Fakten**: Kapital, Mehrheit („348 erwartet, nötig 301“ bzw. „fehlen 12“), Dauer, Haushalt in Mrd. ₺ **und** % BIP. Quelle ist `gesetzesPrognose` (G3).
     - (d) **Dafür/Dagegen** (G4) als Ikonenreihen.
     - (e) **Wo** (nur wenn `akuteOrte(w, id)` (`sim/handeln.ts:715`) etwas liefert): Umschalter „ganzes Land · nur wo akut (n Provinzen)“. Die Provinzauswahl erfolgt auf der Karte („Provinzen wählen“ öffnet die Karte mit Mehrfachwahl). Die Listen „Region ▾“ und „Provinzen ▾“ (Bild 004) entfallen.
     - (f) Knöpfe: „Einbringen · n Kapital“, „Als Erlass · n Kapital · Gericht p %“ (G5) und „Verwerfen“. „Genauer einstellen“ entfällt (es führte ins Wirkungsnetz).
4. **Zustände:**
   - Maßnahme im Parlament: Regler gesperrt, Prüfzeile zeigt „Abstimmung in 12 Tagen · 348 Ja erwartet“ und „Zurückziehen“ (`zieheGesetzZurueck`, `sim/handeln.ts:634`).
   - Ruhe nach Annahme (G6): Knopf gesperrt mit Grund.
   - 0 Kapital: Einbringen grau, „fehlt n Kapital“.
   - Vor der Wahl: keine Änderung (keine neue Regel).
   - Krise: Schloss und Grund aus `blocker.titel` in einem Satz (heute bis zu 80 Zeichen Rohtext).
5. **Klicks:**

| Element | Aktion | Ergebnis | landet in |
|---|---|---|---|
| Regler / −/+ | Ziehen / Klick | wählt die Zielstufe, die Prüfzeile öffnet sich | Zeile |
| Fassungsknopf | Klick | setzt die Stufe auf die Fassung | Zeile |
| Vorschlagsmarke | Klick | setzt die Stufe auf den Vorschlag | Zeile |
| Wirkungspfeil | Hover | `e.why` als Satz, Verzögerung | – |
| Wirkungsziel (Größe) | Klick | wechselt zum Bereich dieser Größe, die Zeile der stärksten Maßnahme ist markiert | Politik |
| Einbringen | Klick | `bringeVorhabenEin` (mit Katalog) bzw. `bringeEin` | Zeile zeigt Rückmeldung; Tagesordnung bekommt einen Eintrag |
| Als Erlass | Klick | dito mit `weg:"erlass"` | Zeile |
| Zurückziehen | Klick | Rückfrage mit Kapitalrückgabe | Zeile |
| Porträt (Ressort) | Klick | Ministerakte | Kabinett |
| „Provinzen wählen“ | Klick | Karte mit Mehrfachwahl, „Übernehmen“ führt zurück | Karte → Zeile |
| Verwerfen / Esc | Klick | Prüfzeile zu | Tafel |

6. **Übernommen / gelöscht:**
   - Bleiben: `ui/politik/MassnahmenTafel.tsx` (Kern), `ui/politik/bereiche.ts` (`massnahmenZeilen`, `lageZeilen`).
   - Neu: Wirkungsbild-Komponente `ui/politik/Wirkungsbild.tsx`. Sie nutzt `NET.edges`, nicht `NetGraph`.
   - Entfallen: `ui/NetNavigator.tsx` als Reiter (die Navigation wird zur Suche), die Mentorin-Unterreiter „Erklärt / Weltvergleich / Was tun?“ (der Weltvergleich kommt als ⓘ an die Zeile, `ui/VergleichBalken.tsx` wird wiederverwendet) und `ui/gesetze/Gesetzesvorhaben.tsx` als Ansicht (G1).
7. **Simulationsbedarf:**
   - `gesetzesPrognose` (G3).
   - Fassungszuordnung freier Stufen (G3, Entscheid).
   - `ressortVon(massnahmeId)` (Tabelle 1.2).
   - Keine neuen Spielwerte.
8. **Texte:**
   - „Stufe 80 → Stufe 80“ erscheint nie, die Prüfzeile öffnet sich erst bei einer Änderung (das macht `setze` schon).
   - „Landesdurchschnitt 80,0 (Index 0–100 …)“ wird zu „heute 80 · bei Amtsantritt 50“.
   - „262 Knoten · 1.022 Verbindungen“ entfällt.
   - Gesetzesnamen kommen aus dem Katalog.
9. **Abnahme:**
   - Jede Zeile mit Regler zeigt nach einer Änderung Kapital, Mehrheit und Haushalt (Test).
   - Die Mehrheitszahl in der Prüfzeile ist gleich der Zahl in der Tagesordnung nach dem Einbringen ± Fristveränderung (Test: `gesetzesPrognose` vs. `gesetzPrognose`).
   - Das Wirkungsbild hat keine überlappenden Textrahmen (Test über Bounding-Boxen im DOM-Test oder feste Zeilenhöhen).
   - Höhe der offenen Zeile ≤ 420 px.
   - `test/gesetzgebung.test.ts` erweitern (Fassung aus freier Stufe), `test/politik-akten-ui.test.tsx` neu.
10. **Aufwand und Abhängigkeiten:** L. Vorbedingung ist der Entscheid G3 (Variante A/B).

---

## Teil 4: Parlament

Das Parlament hat drei Ansichten (Halbrund, Tagesordnung, Justiz) und einen seltenen Dialog (Verfassung). Der Aktenkopf zeigt nur noch Titel und **eine** Zeile „Lager 328 von 600 · nötig 301“. Die Kennzahlen „Gesetze im Verfahren“ und „Unabhängige Justiz“ entfallen dort, sie stehen in den Ansichten. Die Reiter Mehrheitslage, Gesetzesvorhaben, Umsetzung, Behörden, Gesetzesbilanz und Politische Akteure entfallen (Bilder 005, 006, 008, 011, 012, 013).

#### Parlament › Halbrund (Start)
1. **Frage und Erfolg:** „Habe ich eine Mehrheit, und wen muss ich gewinnen?“ Erfolg: Halbrund mit 301-Linie. Ein Klick auf einen Parteiblock zeigt, was die Partei will und was Duldung oder Koalition kostet.
2. **Aufbau (Zonen):**
   - Z1 links Halbrund (640×420) mit großer Zahl „328 · Lager“ und Balken Lager/Duldung/Opposition mit 301-Strich (heute in `ParlamentKopf`).
   - Z2 rechts Parteiliste (480×420): Zeile je Fraktion mit Farbe, Name, Sitze, Rolle und Bereitschaft als Ring.
   - Z3 unten Seitenleiste **Parteikarte** (öffnet sich rechts über Z2, 480×700).
   - Z4 unten links (640×280) „Letzte Abstimmungen“ (3 Zeilen) und „Duldung läuft aus“ (wenn ja).
3. **Inhalte je Zone:**
   - Z1: `Sitzplan` aus `ui/parlament/Halbrund.tsx`, Daten `parlamentsLage(w)` (`ui/parlament/lage.ts:45`): `lager`, `duldung`, `opposition`, `gesamt`.
   - Z2: `parlamentsLage(w).fraktionen` (`partei`, `name`, `sitze`, `rolle`, `farbe`). Die Spalte `anteil` (Stimmanteil, `parl.shares`) wird **beschriftet** als „Wahl 2028: 35,7 %“ oder entfällt. Die Bereitschaft kommt aus `fraktionsUebersicht(w)` (`sim/verhandeln.ts:83`): `bereitschaft`, `wort`.
   - Z3 Parteikarte, Daten `FraktionSicht`:
     - `vorsitz` (Porträt, Name, Haltung; bei Opposition **nicht** „Loyalität“, sondern „Bereitschaft“ aus `bereitschaft`, R7)
     - `ausrichtung` als Satz
     - `forderung` als Satz „will: …“
     - `zusagenziel` als Mini-Regler „Mindestlohn 50 → 70“ mit Link zur Maßnahmenzeile
     - `duldungBis` als Fristbalken
     - `aktionen` (`AktionSicht`, Arten `gespraech`, `zugestaendnis`, `duldung`, `koalition`, `abwerben`) als Knöpfe mit Preis. Ausführung über `verhandle(w, partei, aktion, rng)` (`sim/verhandeln.ts:200`)
     - `FraktionsAbkommen` (`ui/parlament/FraktionsAbkommen.tsx`) wird wiederverwendet
   - Z4: Log-Einträge mit `abstimmung` (letzte 3) und `auslaufend` aus `stimmenPrognose` (`sim/handeln.ts:618`).
4. **Zustände:**
   - Mehrheit fehlt: Die 301-Linie ist rot, die Zahl „fehlen 12“ ist groß.
   - Duldung läuft in ≤ 30 Tagen aus: Der Block der duldenden Partei pulsiert, die Zeile steht oben in Z4.
   - Wahl: Nach der Wahl zeigt das Halbrund für eine Woche die Verschiebung (vorher/nachher, `ui/wahl/Wahlabend.tsx` nutzt dasselbe).
   - Krieg: unverändert.
5. **Klicks:**

| Element | Aktion | Ergebnis | landet in |
|---|---|---|---|
| Parteiblock im Halbrund | Klick | Parteikarte | Halbrund (Seitenleiste) |
| Parteizeile | Klick | Parteikarte | dito |
| Parteiblock | Hover | Sitze, Rolle, Bereitschaft | – |
| Vorsitz-Porträt | Klick | Gespräch (`sprichMitFigur`, `sim/gespraeche.ts:808`) als Szene `ui/personen/GespraechSzene.tsx` | Gespräch (Fenster) |
| Aktionsknopf (Duldung …) | Klick | `verhandle`, Rückmeldung in der Karte | Parteikarte |
| Zusagenziel | Klick | Maßnahmenzeile | Politik |
| Letzte Abstimmung | Klick | Verlauf an diesem Datum | Verlauf |
| Reiter Tagesordnung | Klick | – | Tagesordnung |

6. **Übernommen / gelöscht:**
   - Wiederverwendet: `ui/parlament/Halbrund.tsx`, `ParlamentKopf.tsx` (Kopf und Liste), `FraktionsAbkommen.tsx` und die Verhandlungslogik aus `ui/Beschlussbuch.tsx` (Teil „parlament“, Zeilen um 136–176).
   - Aus Bild 007 entfallen: Ministerfälle (Turan, Karaca), „Versorgung auf der Tagesordnung“ (geht in die Tagesordnung), „Monatsbericht“, „Was Ihre Entscheidungen bewirken“, „Ihre Entscheidungen im Vergleich“ und „Warum die Parteien reagieren“ (als ⓘ an der Parteikarte).
   - Die Personenkarten aus 013 gehen in die Parteikarte auf.
7. **Simulationsbedarf:** keiner.
8. **Texte:** „Lager, Mehrheit steht“ wird zu „Lager · 328 von 600“. „Haltung: abtrünnig (24)“ beim Oppositionsführer wird zu „Bereitschaft: gering“.
9. **Abnahme:**
   - Duldung/Koalition erscheinen je Partei genau einmal (heute doppelt).
   - Keine Ministerangelegenheit in dieser Ansicht.
   - Höhe ≤ 1 Bildschirm.
   - `test/parlament.test.ts` und `parlament-prognose.test.tsx` anpassen.
10. **Aufwand und Abhängigkeiten:** M.

#### Parlament › Tagesordnung
1. **Frage und Erfolg:** „Was wird wann abgestimmt, und reicht es?“ Erfolg: Jede Vorlage hat einen Ja-Balken an der 301-Linie (bei der Verfassung 360/400), dazu die Abstimmung in n Tagen und eine Handlung, wenn es knapp ist.
2. **Aufbau (Zonen):**
   - Z1 Zeitstrahl (1150×70): die nächsten 60 Tage mit einer Marke je Abstimmung.
   - Z2 Liste (1150×Rest): eine Zeile je Vorlage, 72 px hoch, sortiert nach Abstimmungstag.
   - Z3 unten „Beim Verfassungsgericht“ (Normenkontrolle, nur wenn vorhanden).
   - Erste Bildschirmhöhe: bis zu 8 Vorlagen.
3. **Inhalte je Zone (Datenquellen je Art):**

| Art | Quelle | Ja-Prognose | Schwelle | Handlungen |
|---|---|---|---|---|
| Gesetz aus Maßnahme | `spiel.gesetze` (`Gesetz`, `sim/spiel-typen.ts:10`), Name `g.name` (Katalog: „Mindestlohngesetz · Kompromiss“) | `gesetzPrognose(w, g)` (`sim/handeln.ts:613`): `heuteJa`, `ja` am Votum, `fristDelta`, `auslaufend` | 301 | `stimmenKaufen(w, g.id, n)` (`handeln.ts:648`), `zieheGesetzZurueck` |
| Haushaltsgesetz | `spiel.wirtschaft.haushalt.gesetz`, `haushaltsGesetzSicht(w)` (`sim/haushalt.ts:545`) | dito (`stimmenPrognose`) | 301 | `haushaltsStimmenKaufen` (`haushalt.ts:584`), Link zum Haushalt |
| Versorgungsvorlage | `spiel.gueter.regierung.vorlagen` mit `status:"offen"`, `versorgungsStimmen(w, v, v.abstimmung)` (`sim/versorgungsmehrheit.ts:48`), Hindernis `versorgungsVorlageHindernis` | Summe `ja` | 301 | Link zur Wirtschaftsakte (Inventar) |
| Verfassungspaket | `spiel.verfassungsvorgang` (`VerfassungsZustand`), `paketStimmen(w, paket, absprachen)` (`sim/verfassung.ts:462`) | `erwartet` (tief–hoch als Spanne) | 360 / 400 | `verfassungStimmenKaufen`, `zieheVerfassungZurueck` |
| Normenkontrolle | `laufendeVerfahren(w).gericht` (`sim/gesetzgebung.ts:465`) | – | – | keine; Wahrscheinlichkeit `p` als Zahl, Urteil in n Tagen |

   - Diese Übersicht führt schon heute `regierungsVorgaenge` (`ui/schreibtisch/arbeitsplatz.ts:91`) für Haushalt, Versorgung und Programme. Die Tagesordnung nutzt eine gemeinsame neue Funktion `tagesordnung(w)` in `sim/tagesordnung.ts`. Sie fasst die fünf Quellen zusammen, und der Kalender des Eingangs liest dieselbe Funktion.
   - Zeile:
     - Titel
     - Art-Ikone
     - Balken 0–600 mit Ja-Anteil (grün bis 301, darüber dunkelgrün), Strich bei 301 (360/400), Spanne tief–hoch schraffiert
     - Text „348 Ja erwartet · Abstimmung 17. März (in 12 Tagen)“
     - Wenn `fristDelta ≠ 0`: „bis dahin −9 (Duldung der YENİ endet am 10. März)“
     - Knöpfe nur bei Bedarf: „Stimmen sichern · n Kapital“ (`mehrheitsSicht.kosten`), „Zurückziehen“
   - Programme ohne Abstimmung (`votum:false` in `regierungsVorgaenge`) gehören **nicht** in die Tagesordnung, sondern in die Wirtschaftsakte.
4. **Zustände:**
   - Leer: „Keine Vorlage im Parlament. Gesetze bringen Sie in der Politik ein.“ mit Link.
   - Knapp: Zeile gelb, Knopf „Stimmen sichern“.
   - Verloren: rot mit „aussichtslos“ (`aussichtslos`) und nur „Zurückziehen“.
   - Am Abstimmungstag: `AbstimmungsKarte` (`ui/parlament/AbstimmungsKarte.tsx`) wie heute als Animation.
5. **Klicks:**

| Element | Aktion | Ergebnis | landet in |
|---|---|---|---|
| Zeile | Klick | klappt auf: Fraktionen mit erwarteter Stimme (Mini-Halbrund) | Tagesordnung |
| Stimmen sichern | Klick | Rückfrage mit Preis, dann kaufen | Zeile |
| Zurückziehen | Klick | Rückfrage (Kapitalrückgabe laut `zieheGesetzZurueck`) | Zeile |
| Titel (Gesetz) | Klick | Maßnahmenzeile | Politik |
| Titel (Haushalt) | Klick | Haushalt | Wirtschaft |
| Titel (Verfassung) | Klick | Verfassungsdialog | Dialog |
| Zeitstrahl-Marke | Klick | scrollt zur Zeile | – |

6. **Übernommen / gelöscht:** Übernommen werden `ui/parlament/GesetzesPrognoseHinweis.tsx` und die Ja-Balken aus `Beschlussbuch.tsx:175–176`. Es entfallen die Gesetzesvorhaben-Kachelwand (006) und der Abschnitt „Beschlüsse“ von 008 (geht in den Verlauf).
7. **Simulationsbedarf:** `tagesordnung(w)` als reine Lesefunktion, mit Test, dass sie dieselben Zahlen liefert wie `gesetzPrognose` und `haushaltsGesetzSicht`. Keine Regeländerung.
8. **Texte:** „Mehrheit steht“ entfällt. Nur „knapp“ und „fehlt“ erscheinen als Wort, sonst die Zahl.
9. **Abnahme:**
   - Jede offene Abstimmung des Spiels erscheint genau einmal (Test: Gesetz + Haushalt + Versorgung + Verfassung).
   - Die Zahl ist gleich der Zahl in der Maßnahmenzeile (G3).
   - Höhe ≤ 1,3 Bildschirme bei 8 Vorlagen.
10. **Aufwand und Abhängigkeiten:** M. Vorbedingung: G3.

#### Parlament › Justiz
1. **Frage und Erfolg:** „Wie unabhängig und leistungsfähig ist die Justiz, und was kann ich ändern?“ Erfolg: Ein Punktebild der Gerichte und darunter 4–6 Zeilen mit Regler und Preis.
2. **Aufbau (Zonen):**
   - Z1 links Punktebild „Besetzung der Gerichte“ (560×260).
   - Z2 rechts vier Tachos bzw. Balken (560×260): Unabhängigkeit, Effizienz der Verfahren, Haftbelegung, Befolgung von Urteilen.
   - Z3 Zeilen der Justizmaßnahmen (1150×300).
   - Z4 Ausklapper „Einrichtungen und Gerichtsapparat“.
3. **Inhalte je Zone:**
   - Z1: `reichZustand(w).sitze` (Felder `loyal`, `reform`, `unabhaengig`; heute `Sitze` in `ui/Reich.tsx:318`). Punktfarben loyal = rot, reformorientiert = braun, unabhängig = gold, mit Legende und Zahl.
   - Z2: Netzgrößen `justiz_unabhaengigkeit`, `justiz_effizienz`, `haftueberfuellung`, `urteilsbefolgung` (Ämterfach Justiz, `sim/personen.ts:74`). Die Werte kommen aus `wertVon(w, id)` (`sim/personen.ts:236`), als ganze Zahl. Darunter je eine echte Messgröße, wo vorhanden. Heute stehen dort „17 Richter je 100.000 Einwohner, Schnitt 22“, „Strafgerichte 228 Tage (2024)“ und „etwa 142 % Belegung“. Quelle sind die `GROESSEN.recht` in `ui/reich/Groessen.tsx` bzw. `data/reich`. Sie behalten ihre Quellenangabe.
   - Z3: `massnahmenZeilen(w, "recht")` mit `MassnahmenTafel` (dieselbe Komponente wie in der Politik, Bereich „recht“) ohne m_notstand (Präsidialamt; erscheint im Bereich „recht“ mit Porträt Präsidialamt).
   - Z4:
     - Einrichtungen (`Institutionen`, `ui/Reich.tsx:~453`) und die Behörde `justiz` mit Instrument (`ui/behoerden/Instrument.tsx`) in Zeilenform „Gerichtsapparat · Personal ●●○○○ · Ausbau · Preis“.
     - Vorteile des Bereichs (`VorteileListe`, `ui/Reich.tsx:399`).
     - **Die Baureihenfolge entfällt hier.** Heute rendert `ui/Reich.tsx:553` die `Baureihenfolge` in **jeder** Lage-Ansicht. Sie gehört in die Verwaltung bzw. die Bauleiste der Land-Akte.
     - Auch die Kopfbalken „Verwaltungskraft / Baukapazität“ entfallen hier.
4. **Zustände:**
   - Straßburg-Druck hoch (`strassburg_druck` ≥ 60): rote Marke an Z2.
   - Ausnahmezustand aktiv (`m_notstand` > 0): Banner „Ausnahmezustand · seit …“ mit Link zum Präsidialamt.
5. **Klicks:**

| Element | Aktion | Ergebnis | landet in |
|---|---|---|---|
| Punkt (Richter) | Hover | Gericht und Ausrichtung | – |
| Gruppe „Verfassungsgericht“ | Klick | Maßnahme m_richterrat bzw. die Verfassungsvariante „Besetzung“ (Dialog) | Zeile / Dialog |
| Tacho | Klick | Bereich „recht“ in der Politik mit Zeile der stärksten Maßnahme | Politik |
| Zeile | wie Maßnahmentafel | – | – |
| Behörde „Ausbau“ | Klick | Behördeninstrument | Ausklapper |
| Justizministerin (Porträt im Kopf) | Klick | Ministerakte | Kabinett |

6. **Übernommen / gelöscht:**
   - Übernommen und umgebaut: `ui/Reich.tsx` (Bereich `recht`), Teile `Sitze`, `Institutionen` und `VorteileListe`.
   - Es entfallen der Unterreiter „Lage / Reformen und Vorhaben“ (Bild 010), der Behördenreiter des Parlaments (011) und „Was den Bau beschleunigt“.
7. **Simulationsbedarf:** keiner.
8. **Texte:** „Ausnahmerecht 10“ wird zu „Ausnahmezustand: keiner“. „Druck aus Straßburg 57“ bekommt ⓘ „EGMR-Urteile, die die Türkei nicht umgesetzt hat (Spielgröße)“.
9. **Abnahme:** Keine Bau- oder Rüstungsprojekte in dieser Ansicht (Test in `test/reich-ui.test.tsx`: `Baureihenfolge` nur im Bereich `haushalt`). Höhe ≤ 1,3 Bildschirme.
10. **Aufwand und Abhängigkeiten:** S–M.

#### Parlament › Verfassungsdialog (selten)
1. **Frage und Erfolg:** „Bekomme ich 360 oder 400 Stimmen für mein Paket?“ Erfolg: Ein Bildschirm. Wer eine Variante wählt, sieht die Zählung im Mini-Halbrund springen.
2. **Aufbau (Zonen):** Fenster 1150×720.
   - Z1 links Tafel (760×640): 6 Zeilen (Artikel), je drei Segmentknöpfe.
   - Z2 rechts fest (360×640): Mini-Halbrund mit erwarteter Zahl, Spanne tief–hoch, Linien 360 und 400. Darunter Kosten, Gericht und Referendum, dann „Einbringen“.
   - Z3 Fuß: Regelsatz in einer Zeile mit ⓘ.
3. **Inhalte je Zone:**
   - Z1: `ARTIKEL` (`sim/verfassung.ts:125`): Je Artikel `name`, `frage` (als Tooltip) und `varianten` als Segmente. Aktiv ist `verfassungAktiv(w, id)`, gesperrt `artikelSperre(w, id)` (Schloss mit Monaten). Je Segment eine kleine Marke „+55“ bzw. „−52“ für die Stimmenänderung gegen den Status quo. Rechenweg: `paketStimmen` mit und ohne die Variante.
   - **Parteien:** Die Variantentexte nennen Parteien aus einer festen Liste (`parteien` je Variante, `sim/verfassung.ts:144ff`: AKP, MHP, YRP, CHP, DEM, İYİ, YENİ, Zafer). Angezeigt werden **nur Parteien mit Sitzen** (`w.parliament.seats[p] > 0`). Heute nennt Bild 009 CHP, İYİ, Yeniden Refah und Zafer, die im Halbrund nicht vorkommen.
   - Z2: `paketStimmen(w, paket)` (`erwartet`, `tief`, `hoch`, `fraktionen[]`). Die Hürden kommen aus der Konstante (`mehrheit: 360`, `direkt: 400`, `sim/verfassung.ts:50–51`). `pruefeVerfassung` liefert Kapital und Gründe, `aymSicht` (`:708`) das Gerichtsrisiko, `ReferendumPrognose` (`:751`) die Volksabstimmung, `paketSalienz` (`:765`) die Wählergruppen, die es spüren.
   - Z3: „Eine Verfassungsfrage je Amtszeit · bis zu fünf Artikel · gescheiterte Artikel 12 Monate gesperrt“.
4. **Zustände:**
   - Schon genutzt in dieser Amtszeit: Dialog nur lesend, „Nächste Möglichkeit: nach der Wahl“.
   - Paket im Parlament: Z2 zeigt die Tagesordnungszeile mit „Stimmen sichern“.
   - Paket beim Gericht bzw. im Referendum: Fortschritt.
5. **Klicks:**

| Element | Aktion | Ergebnis | landet in |
|---|---|---|---|
| Knopf „Verfassungsänderung vorbereiten“ (in Halbrund/Tagesordnung, nur wenn erlaubt) | Klick | öffnet den Dialog | Dialog |
| Segment | Klick | wählt die Variante, Z2 rechnet neu | Dialog |
| Segment | Hover | Variantentext und Parteien mit Sitzen | – |
| Einbringen · n Kapital | Klick | `bringeVerfassungEin` | Tagesordnung |
| Schließen / Esc | Klick | Entwurf bleibt (lokal) | vorherige Ansicht |

6. **Übernommen / gelöscht:** `ui/Verfassung.tsx` (`VerfassungWerkstatt`) wird zur Tafel umgebaut. Es entfällt der Reiter Verfassung (Bild 009, 4.270 px).
7. **Simulationsbedarf:** keiner. **Kommentarfehler:** `sim/verfassung.ts:7–8` und `:451–453` sprechen noch von 301/360. Feldnamen `lueckeMehrheit`/`lueckeDirekt` gegen `VERFASSUNG.mehrheit/direkt` prüfen und Kommentare berichtigen.
8. **Texte:** „Der bisherige Stand.“ steht nur noch als Marke „bisher“ am Segment. Die Variantentexte bleiben kurz (ein Satz).
9. **Abnahme:** Höhe = 1 Bildschirm. Keine Partei ohne Sitze im Text (Test). Die Zählung in Z2 ist gleich `paketStimmen` (Test). `test/verfassung.test.ts` bleibt.
10. **Aufwand und Abhängigkeiten:** M.

---

## Teil 5: Kabinett

Zwei Ansichten: **Kabinettstisch** (Start) und **Verwaltung**. Die Ministerakte ist der Drill-down aus dem Tisch. Es entfallen Handlungsfähigkeit (014), Ministerrat als Vorlagenliste (015), Gespräch als Reiter (016; wird schwebender Berater), Behörden (018; gehen in die Ministerakte), Regierungsbilanz (019) und Verantwortliche (020; das ist der Tisch).

#### Kabinett › Kabinettstisch
1. **Frage und Erfolg:** „Wer in meinem Kabinett macht Ärger, und wer will etwas von mir?“ Erfolg: 17 Porträts um einen Tisch. Rote Ringe, Abzeichen und Blitze zeigen sofort, wo es brennt.
2. **Aufbau (Zonen):**
   - Z1 Tisch (1150×560): Oval mit 17 Ministerplätzen. Am Kopf der Präsident, daneben Präsidialamt (Stabschefin). Gäste am Rand sind Generalstab und Zentralbank (kleiner, mit Etikett „nicht im Kabinett“).
   - Z2 Leiste unter dem Tisch (1150×120): Kabinettssitzung (beschlussfähig/fällig, `sitzungMoeglich`, `tageBisSitzung`), Gesprächstermine „2 von 4 frei in 30 Tagen“ (`termineInfo`), Rücktrittsgefahr (Namen), Kapital aus dem Kabinett (`kapitalSumme`, ganze Zahl) und Disziplin (`disziplin`).
   - Z3 Seitenleiste **Ministerakte** (öffnet sich rechts über dem Tisch, 520×720), siehe unten.
3. **Inhalte je Zone:**
   - Z1 Platz je Minister, Daten aus `kabinettStatus(w).minister` (`MinisterPosten`, `sim/kabinett.ts:19`):
     - Porträt (`PersonPortraet`)
     - **Ring** = `stimmung` (treu/loyal/skeptisch/kritisch/meuternd → 5 Farben)
     - Name
     - Ressort (kurz)
     - **Abzeichen** = Zahl offener Angelegenheiten. Gezählt werden Einträge aus `schreibtischArbeit(...).alle`, deren `sprung` auf dieses `amt` zeigt, plus Mappe-Vorlagen mit `v.minister.id`.
     - **Blitz**, wenn in `ruecktrittGefahr`
     - „kommissarisch“ als graue Schärpe (`kommissarisch`)
     - Auftrag läuft: kleines Uhrsymbol (`auftragStatus`)
   - Sitzordnung: nach Etatgröße des Ressorts (aus dem Ressortrad) im Uhrzeigersinn. Das ist eine Anzeigeregel.
   - Z2: `kabinettStatus(w)`: `schnittLoyalitaet` (ganze Zahl, **kein** zweites Mal „49“ und „49 %“), `kapitalSumme`, `disziplin`/`disziplinText`, `tageBisSitzung`. Das Tableau „Termine 0 von 4 · Ihre Zeit ist knapp“ entfällt (Widerspruch). Neu steht dort „Gesprächstermine: 4 frei“ (`max − belegt`).
4. **Zustände:**
   - Rücktrittswelle: Blitze, und Z2 zeigt „Rücktritt droht: …“ rot.
   - Kommissarische Besetzung: Platz grau.
   - Nach einer Entlassung: leerer Stuhl mit „Nachfolge wählen“ (`ui/personen/NachfolgeAuswahl.tsx`).
   - Vor der Wahl: unverändert.
   - Krieg: Generalstab rückt an den Tisch (neben den Präsidenten).
   - Ohne Spiel (`!w.spiel`): Hinweis.
5. **Klicks:**

| Element | Aktion | Ergebnis | landet in |
|---|---|---|---|
| Porträt / Platz | Klick | Ministerakte | Tisch (Seitenleiste) |
| Porträt | Hover | Ressort, Stimmung, Sorge (`sorge`), Kapitalbeitrag | – |
| Abzeichen | Klick | Eingang, gefiltert auf diesen Minister | Schreibtisch |
| Leerer Stuhl | Klick | Nachfolgewahl | Fenster |
| „Kabinettssitzung einberufen“ (Z2) | Klick | `bereiteKabinettssitzungVor` → `MinisterratSaal` als Szene | Sitzung (Fenster) |
| Generalstab / Zentralbank | Klick | ihre Akte (Generalstab: Befehle und Bereitschaft; Zentralbank: Link zu Wirtschaft › Geld & Lira) | Seitenleiste / Wirtschaft |
| „Machtkreis“ (kleiner Knopf Z2) | Klick | `ui/personen/Machtkreis.tsx` als Fenster | Fenster |

6. **Übernommen / gelöscht:**
   - Übernommen: `ui/Personen.tsx` (Reiterleiste `kabinett|umfeld|machtkreis|zusagen` entfällt), `ui/personen/MinisterratSaal.tsx` (als Sitzungsszene, nicht als Seite), `Machtkreis.tsx` (als Fenster), `NachfolgeAuswahl.tsx`.
   - Gespräche & Umfeld (`ui/personen/Umfeld.tsx`) gehen in die Ministerakte, der Reiter Zusagen (`ZusagenAnsicht.tsx`) in den Eingang (gefährdete) und in die Parteikarte (Zusagen an Parteien).
   - Entfallen: Bilder 014, 015, 019, 020.
   - Der Chat (`ui/Chat.tsx`, Bild 016) wird ein schwebender Knopf „Berater“ (Porträt Präsidialamt) unten rechts in allen Ansichten.
7. **Simulationsbedarf:** 17 Ministerämter (1.2), Gewichtung des Kabinettskapitals (offene Frage 2), Nachnamensvorrat. `kabinettStatus` muss mit 17 Ministern laufen (Leistung prüfen: `berechneMinisterKapital` je Monat).
8. **Texte:** „Haltung: verlässlich (61)“ wird zu Ring und Wort aus `stimmungVon` (R7), die Zahl steht nur im Hover. „Verantwortliche“ entfällt.
9. **Abnahme:**
   - 17 Plätze sichtbar ohne Scrollen bei 1440×900.
   - Keine Vorlage als Karte auf dem Tisch (nur Abzeichen).
   - Kein Wert doppelt (Loyalität einmal).
   - `test/kabinett.test.ts` (17 Minister), `test/personen-ui.test.tsx` und `test/personen.test.ts` anpassen.
10. **Aufwand und Abhängigkeiten:** L. Vorbedingung ist 1.2 (Ämter, Spielstandwanderung).

#### Kabinett › Ministerakte (Seitenleiste, Drill-down vom Tisch, von Porträts überall, vom Haushaltsrad)
1. **Frage und Erfolg:** „Was macht dieses Ministerium, was will der Minister, wo gibt es sein Geld aus, und was kann ich ihm befehlen?“ Erfolg: Kopf mit Person, Ressortrad mit Kürzen/Aufstocken, Leitgrößen, Befehle. Alles in einer Leiste.
2. **Aufbau (Zonen):** Seitenleiste 520×720, scrollt innen.
   - Z1 Kopf (120 px): Porträt, Name, Ressort, Stimmung (Ring und Wort), Fähigkeit und Ehrgeiz als Worte (`leistungWort`, `ehrgeizWort`, `sim/personen.ts:200/215`), Wunsch („will …“, `figur.ziel`).
   - Z2 **Ressortrad** (520×260, Komponente 1.3).
   - Z3 Leitgrößen (≤ 140 px): `lageIm(w, f)` (`sim/personen.ts:245`) als Balken, `schlechtesteGroesse` hervorgehoben.
   - Z4 Offene Angelegenheiten (≤ 3 Zeilen mit Link in den Eingang).
   - Z5 Befehle (Ausklapper).
   - Z6 Behörden (Ausklapper).
   - Z7 Gespräch und Erinnerungen (Ausklapper).
   - Z8 Fuß: Entlassen bzw. Umbilden.
3. **Inhalte je Zone:**
   - Z2: Ressortrad, Stücke = Posten mit `ressortVon(p) === f.amt` (1.2), Behördenring. Je Stück ein Regler (`postenVorschau`), mit Kapital, Mrd. ₺, Defizit und Loyalität ±1. Ohne Posten (Äußeres hat nur `diplomatie`, Jugend und Sport hat **keinen** eigenen Posten) zeigt Z2 „Kein eigener Haushaltsposten im Spiel“. **Datenlücke:** Etat des Ministeriums laut Haushaltsgesetz 2026, Tabelle A. Die Zahl wird nicht erfunden.
   - Z3: Leitgrößen. Ein Klick führt zur Politik mit dem Bereich des Leitthemas.
   - Z4: aus `schreibtischArbeit(...).alle` gefiltert nach Amt, dazu `ressortAnliegen` (`RessortAnliegenKarten`) und Vorfälle. **Hier wird nicht entschieden, nur verlinkt** (eine Entscheidung, ein Ort).
   - Z5: `befehlAngebote(w, figurId)` (`sim/minister-befehle.ts:78`), `befehlVorschau` (`:130`) mit `verweigerungsChance` (`:66`) als %. `laufendeBefehle` (`:356`). Ausführung `erteileBefehl` (`:227`). UI aus `ui/minister/BefehlBlatt.tsx`.
   - Z6: `BEHOERDEN.filter(b => b.ressort === amt)`. Je Behörde eine Zeile mit Punkten für Personal, Technik und Reichweite (`stand(w, id)`), „Etat knapp“ (`sim/behoerden.ts:130`) sowie Ausbau/Kürzen über `ui/behoerden/Instrument.tsx` mit Preis. Was eine Stufe bringt, steht als Wirkung aus `BehoerdeDef.wirkung` (`data/behoerden.ts:30`).
   - Z7: `GespraechSzene` und `planeGespraech`/`ansaetzeFuer` (`sim/gespraeche.ts:346/475`), Termine `termineInfo`. Erinnerungen `erinnerungen(f)` (`sim/personen.ts:148`) als letzte 3 Sätze.
   - Z8: `entlasseFigur` (`sim/eingriffe.ts:106`), `umbildungErsetzen/Behalten/Entlassen` (`sim/amtszeit.ts:314ff`) mit Preis. Bei `entlassbar:false` gibt es keinen Knopf.
4. **Zustände:**
   - Minister kommissarisch: Kopf grau mit „Nachfolge wählen“.
   - Meuternd: Kopf rot, Z8 oben.
   - Haushaltsfenster offen: Regler im Rad wirken auf den Entwurf, mit Marke „Entwurf 2031“.
   - 0 Kapital: Befehle und Nachträge grau.
5. **Klicks:**

| Element | Aktion | Ergebnis | landet in |
|---|---|---|---|
| Radstück | Klick | Zeile mit Regler hervorgehoben | Akte |
| Regler | Ziehen | Vorschau | Akte |
| „Übernehmen · n Kapital“ | Klick | `haushaltsPostenEntscheidung`/`setzeEntwurf` | Akte |
| Behörde im Ring | Klick | Behördenzeile offen | Akte |
| Leitgröße | Klick | Politik, Bereich | Politik |
| Angelegenheit | Klick | Eingang, Zeile offen | Schreibtisch |
| Befehl wählen | Klick | Vorschau mit Verweigerungschance | Akte |
| Befehl erteilen · n Kapital | Klick | `erteileBefehl` | Akte |
| Gespräch | Klick | Szene | Fenster |
| Entlassen | Klick | Rückfrage mit Folgen | Tisch (leerer Stuhl) |
| Zurück / Esc | Klick | schließt die Leiste | Herkunft |

6. **Übernommen / gelöscht:**
   - Übernommen: `ui/minister/MinisterPult.tsx` (falls es den Kopf liefert), `BefehlBlatt.tsx`, `RessortAnliegen.tsx` (nur Anzeige), `RessortVerantwortung.tsx` (Rückblick als Ausklapper), `ui/personen/Umfeld.tsx`, `ui/behoerden/Behoerde.tsx` und `Instrument.tsx`.
   - Wird zur Ministerakte (nicht mehr eigener Reiter): `BehoerdenInstrument` in `ui/akte/Bereiche.tsx` mit `behoerdenOffen`.
   - Entfallen: Behördenreiter in allen Akten (Bilder 011, 018) und die Personenreiter (013, 020).
7. **Simulationsbedarf:**
   - `ressortVon(posten)` (1.2).
   - `RESSORT_POSTEN` (`data/behoerden.ts:213`) auf die neuen Posten umstellen (gesundheit → gesundheit, bildung → bildung bleiben; `praesidialamt` → `stab`).
   - Für Ministerien ohne Posten ist „Behördenausbau ohne Etat“ die heutige Rückfallregel (`AUSBAU.pkOhneEtat`), die gilt weiter.
8. **Texte:** „Groll“ heißt neu „Kränkung“ (`sim/kraenkung.ts` existiert, prüfen, welcher Begriff im Spiel führt) mit ⓘ. „Etat ohne Spielraum“ bleibt.
9. **Abnahme:** Dasselbe `RessortRad` rendert im Haushalt (Ebene 2) und in der Akte mit gleichen Summen (Test). Jede Behörde erscheint in genau einer Ministerakte (Test über `BEHOERDEN`). Höhe der Leiste ohne Ausklapper ≤ 720 px.
10. **Aufwand und Abhängigkeiten:** L. Vorbedingungen sind 1.2, 1.3 und die Haushaltsrecherche (Tabelle A) für die Unterteilung (optional).

#### Kabinett › Verwaltung
1. **Frage und Erfolg:** „Warum geht nichts schneller, und wo ist mein Engpass?“ Erfolg: Zwei Flussbilder (Verwaltungskraft, Politisches Kapital) und eine Bauwarteschlange, die man ziehen kann.
2. **Aufbau (Zonen):**
   - Z1 links Wasserfall Verwaltungskraft (560×260).
   - Z2 rechts Wasserfall Politisches Kapital je Monat (560×260).
   - Z3 Bauwarteschlange als Streifen (1150×260): Zeilen = Vorhaben, Balken = Restdauer, Reihenfolge per Ziehen.
   - Z4 Vorteile (Ausklapper).
3. **Inhalte je Zone:**
   - Z1: `verwaltungBilanz(w)` (`sim/reich.ts:203`): `vorrat` (Zahl oben), `einkommen` (+), `bau` (−), `unterhalt` (−), `netto` (Ergebnis), `personal` als Teil von `einkommen` (beschriftet „davon aus dem Personaletat“; bei 0 entfällt die Zeile, heute „0,0 Punkte …“). Ganze Zahlen.
   - Z2: `kapitalEinkommen(w)` (`sim/spiel.ts:320`): `grund`, `vertrauen`, `mehrheit`, `legitimitaet`, **`kabinett`**, **−`unterhalt`** (inkl. Verfassungs- und EU-Abzug), **−`altlast`** → `summe`. **Heute** zeigt `ui/Reich.tsx:377–381` nur vier Zeilen, aber `k.summe` als Summe, also 3,5 + 2,0 + 1,5 − 0,0 ≠ 9,6. Kabinett, Unterhalt und Altlast fehlen. Alle Zeilen müssen stehen. Eine Nachkommastelle ist hier erlaubt, weil Kapital monatlich in Zehnteln fließt. Besser: ganze Zahlen im Bild und Zehntel im Hover. „Nächster Zufluss am …“ kommt aus `naechste`, die Grenze aus `grenze`.
   - Z3: `reichZustand(w).laufend` mit `vorhabenSicht(w, id)` (`sim/reich.ts:330`), Reihenfolge `bauplan`, `verschiebe(w, id, ±1)` (`:817`, Preis 10 Verwaltungskraft je Position laut Text), `pausiere` (`:797`). Kapazität aus `bauKapazitaet(w)` (`:186`) als Linie „133 je Monat, 99 verplant“.
   - Rüstungsprojekte (F-16, Altay, Stahlkuppel) stehen hier mit Ikone „Sicherheit“. Laut Plan 5.4 gehören sie in die Bauleiste der Sicherheit. Bis zu dieser Entscheidung stehen sie hier einmal, **nicht** in Justiz, Infrastruktur und Kultur.
   - Z4: `VorteileListe` für `haushalt` (vorhanden: „Solide Verwaltung · noch nicht erreicht · Der Preis: …“).
   - Der Block „Haushalt und Märkte“ (Schulden, Leitzins, Lira, Risikoaufschlag; `ui/Reich.tsx:383–392`) entfällt. Das steht in der Wirtschaft.
4. **Zustände:**
   - Verwaltungskraft netto < 0: Z1 rot, „In n Monaten leer“ (`vorrat/−netto`).
   - Baukapazität voll: Streifen mit Warnstrich.
   - Kein Bau: Z3 „Nichts im Bau“ mit Link zur Bauleiste der Land-Akte.
5. **Klicks:**

| Element | Aktion | Ergebnis | landet in |
|---|---|---|---|
| Wasserfall-Stück | Hover | Erklärung und Herkunft (z. B. „Digitale Verwaltung: +0,05 je Stufe“) | – |
| Stück „Digitalisierung“ | Klick | Maßnahme m_verwaltungsdigital | Politik |
| Stück „Kabinett“ | Klick | Kabinettstisch | Kabinett |
| Vorhaben ziehen | Ziehen | `verschiebe` mit Rückfrage (Preis) | Verwaltung |
| Pausieren | Klick | `pausiere` | Verwaltung |
| Vorhaben-Titel | Klick | Ort auf der Karte (Land-Akte) | Karte |

6. **Übernommen / gelöscht:**
   - Übernommen und umgebaut: `ui/Reich.tsx` Bereich `haushalt` (`Haushalt`, `Baureihenfolge` an Zeile 137, `VorteileListe`).
   - Entfallen: der Unterreiter „Lage / Sonderrechte und Vorhaben“ (Bild 017). Die Sonderrechte gehen in eine Zeile „Sonderrechte (5)“, Ausklapper.
7. **Simulationsbedarf:** keiner.
8. **Texte:** „Was knapp ist, ist selten nur Geld“ bleibt als Untertitel. Neu: „Saldo“ statt „Summe“ (bei Kapital).
9. **Abnahme:** Die Wasserfälle summieren sichtbar zum Ergebnis (Test: Summe der Zeilen = `summe` bzw. `netto`). `Baureihenfolge` steht nur in dieser Ansicht (`test/reich-ui.test.tsx`). Kein `−0,0`.
10. **Aufwand und Abhängigkeiten:** M.

---

## Teil 6: Fehlerliste (sofort, unabhängig vom Umbau)

| # | Fehler | Ort | Behebung |
|---|---|---|---|
| F1 | Kapitaltabelle summiert nicht: vier Zeilen, Summe 9,6 | `ui/Reich.tsx:377–381` (`Haushalt`) | Zeilen `k.kabinett`, `−k.unterhalt`, `−k.altlast` ergänzen; Beschriftung „Saldo“ |
| F2 | „−0,0“ bei Legitimität | `ui/Reich.tsx:380` | Werte mit \|x\| < 0,05 als „0“ ohne Vorzeichen |
| F3 | Baureihenfolge mit Kampfjets in Justiz, Verwaltung, Infrastruktur, Kultur | `ui/Reich.tsx:553` (`<Baureihenfolge>` ohne Bedingung) | nur bei `bereich === "haushalt"` rendern |
| F4 | Wirkungsberichte „noch keine“ in Parlament und Kabinett trotz 21 Berichten | `ui/akte/Bereiche.tsx:351` (`BEREICH_THEMEN.recht = ["recht"]`, `regierung = ["haushalt","recht","gesellschaft"]`) | bis die Bilanzreiter entfallen: Leertext „In diesem Bereich noch keine; alle Berichte im Verlauf“ mit Link |
| F5 | Bilanzkurve Achse 50–52 | `VerlaufsDiagramm` in `ui/akte/Bereiche.tsx` | Mindestspanne 20 Punkte oder Achsenbruch |
| F6 | Zwei Konstanten heißen `BEREICH_THEMEN` mit anderer Bedeutung | `ui/politik/bereiche.ts:25` und `ui/akte/Bereiche.tsx:351` | die zweite in `AKTE_THEMEN` umbenennen |
| F7 | Drei Listen „hoch ist schlecht“ | `sim/personen.ts:17`, `ui/politik/bereiche.ts:58`, `sim/berichte.ts:160` | eine Funktion `hochIstSchlecht` (R2), Test, dass alle bisherigen Einträge enthalten sind |
| F8 | Drei Loyalitätsskalen (25/42/58/80, 30/50/70, 40/55) | `sim/kabinett.ts:83`, `ui/akte/Bausteine.tsx:45`, `sim/ministerfluss.ts:488/549` | Worte nur aus `stimmungVon`. Die Schwellen der Empfehlung bleiben, ihr Hinweistext nennt das Wort aus `stimmungVon` |
| F9 | Oppositionsführer „Haltung: abtrünnig (24)“ | `ui/akte/Bausteine.tsx:45` für `amt:"opposition"`/`"partner"` | für Parteifiguren `bereitschaftWort(fraktion(w,p).bereitschaft)` (`sim/fraktionen.ts:147`) statt Loyalität |
| F10 | 373 gegen 362 erwartete Ja-Stimmen | Kachel `ui/gesetze/Gesetzesvorhaben.tsx:118` (`f.ja` mit Bonus) gegen `Beschlussbuch` (ohne) | beide über `gesetzesPrognose` (G3); bis dahin in der Kachel „mit Kompromissfassung“ dazuschreiben |
| F11 | Verfassungstexte nennen Parteien ohne Sitze | `ui/Verfassung.tsx` (Ausgabe von `variante.parteien`) | nach `w.parliament.seats[p] > 0` filtern |
| F12 | Kommentare zu Hürden 301/360 veraltet | `sim/verfassung.ts:7–8`, `:451–453` | auf 360/400 berichtigen, Feldbedeutung prüfen |
| F13 | Quellen kaum lesbar | `ui/quellen/quellen.css:15–74` (Farben für dunklen Grund) | Pergament-Tokens, Kontrast ≥ 4,5:1 |
| F14 | „Weitester Stand“ älter als der aktuelle | `ui/speicher.ts:325` (`fruehereStaende`) | `hoechst` nur als „Weitester Stand“ beschriften, wenn `m.hoechst.datum > m.auto.datum`; sonst als „Frühere Sicherung“ |
| F15 | Stand der Dinge immer ±0 | `ui/standderdinge.ts:107` (`deltas` gegen `vorsitzung`) | ohne Vergleich, wenn `vorsitzung.tag === w.day` |
| F16 | „Frist in 666 Tagen“ | `i18n/katalog/de/buehne.json:203` (`vorlage.frist_in_tagen`) und Aufrufer | über 60 Tage in Monaten (R1), neue Schlüssel `vorlage.frist_in_monaten` |
| F17 | Nachkommastelle im Ministerzitat („87,3“) und „1,0 Kapital“ | Zitattext der Ressortanfrage (ministerfluss) und `ui/minister/VorlageKarte.tsx` (`zahl()`) | Indizes ganzzahlig; Kapital `Math.round` |
| F18 | Vorschlag mit null Wirkung auf Rang 1 (Bild 003) | `sim/ministerfluss.ts` (`empfiehl`, Vorschau `nutzen`) und Reihung | Vorlage nicht erzeugen oder ans Ende, wenn `nutzen[0].mit === nutzen[0].ohne` |
| F19 | Wirkungsnetz: Text überdruckt, ein Wort pro Zeile | Politik › Wirkungsnetz „Was folgt daraus?“ (`ui/NetView.tsx`/`NetNavigator.tsx`, Spalte „Preis und Gegenspieler“) | Mindestbreite der Spalte 240 px; Lag-Text in eigene Zeile; entfällt mit dem Wirkungsbild |
| F20 | Ereignis: dritte Antwort abgeschnitten | `ui/EreignisFenster.tsx:128` (`ev2-optionen`) | Spaltenraster, Fenster ohne inneres Scrollen bis 3 Antworten |
| F21 | Zustimmung 50 (Leiste) gegen 54 (Fenster) unbenannt | `ui/ereignis/kontext.ts:154` | beide Werte benennen (R3) |
| F22 | „Termine 0 von 4 · Ihre Zeit ist knapp“ | Ministerrat-Kopf (`ui/Personen.tsx`/`MinisterratSaal.tsx` mit `termineInfo`) | „4 frei“; „knapp“ nur bei `max − belegt ≤ 1` |
| F23 | „Schnitt Loyalität 49 %“ neben „49“ | Ministerrat-Kopf | ohne %, einmal |
| F24 | „0,44 % BIP …, davon 0,44 % wirksam“ | `ui/politik/UmsetzungAkte.tsx` | „davon“ nur zeigen, wenn verschieden |
| F25 | Bankenaufsicht beim Amt Zentralbank | `sim/personen.ts:63` | an Finanzen (1.2) |
| F26 | Nachnamensvorrat reicht nicht für 17 Ministerien | `sim/figuren.ts:17` (24 Nachnamen) | auf ≥ 60 erweitern (eigener Strom für neue Figuren), Vornamen ebenfalls ohne Dopplung |
| F27 | Behörden-Kennung `praesidialamt` gegen Amt `stab` | `data/behoerden.ts` (`ressort`), `RESSORT_POSTEN` | eine Kennung |

## Teil 7: Offene Fragen (höchstens fünf)

1. **Freie Gesetzesstufen (G3):**
   - **A:** Eine freie Stufe gilt als nächstliegende Fassung, mit Bonus, Verbandsfolgen und Ruhe. Das ist einheitlich, ändert aber die Regel für freie Entwürfe.
   - **B:** Freie Stufen haben keinen Bonus und keine Folgen.

   Ich empfehle A.
2. **Kabinettskapital mit 17 Ministern:** Wird `berechneMinisterKapital` auf 7/n gewichtet (Summe bleibt), nach Etatanteil gewichtet, oder bleibt die Summe von 17 Ministern (mehr Kapital, dann neu kalibrieren)?
3. **Ministerien mit kaum Hebeln** (Jugend und Sport mit 1 Maßnahme und ohne Posten, Äußeres mit 1 Netzmaßnahme): Sollen sie als volle Minister mit Loyalität und Kapitalbeitrag am Tisch sitzen? Oder bleiben sie „leichte“ Plätze, bis Maßnahmen recherchiert sind?
4. **Strittige Zuordnungen:** Internetsperren (Verkehr/BTK oder Präsidialamt), Medienaufsicht (Präsidialamt oder eigener Parlamentsbezug), Mietpreisbremse (Umwelt/Städtebau oder Justiz), Minderheitenrechte (Präsidialamt, Justiz oder Kultur), Rüstungsindustrie (Verteidigung oder Präsidialamt/SSB).
5. **Generalstab am Tisch:** Seit 2018 ist der Generalstab dem Verteidigungsministerium zugeordnet. Bleibt der Generalstabschef eine eigene Figur mit Loyalität und Putschgefahr (heute `generalstab`) neben einem zivilen Verteidigungsminister, oder werden beide zu einer Figur?


---

# Anhang B: Wirtschaft und Gesellschaft

Stand 5. November 2026. Grundlage: VORLAGE_SPEZ.md, PLAN_OBERFLAECHE_2026-11-05.md (Abschnitte 2 bis 4), kritik-B.md und der Code unter /home/user/NWO/game/src. Alle Pfade unten beziehen sich auf `game/src`, sofern nicht anders angegeben.

Gilt für alle Zahlen: Jede Zahl kommt aus einer genannten Funktion oder Datei. „Spielparameter“ heißt, dass ein Wert im Code ohne Quelle steht. „Datenlücke“ heißt, dass es den Wert noch nicht gibt; dann steht dabei, wo er zu suchen ist.

---

## 0. Gemeinsame Grundlagen beider Bereiche

### 0.1 Abhängigkeit: die 17 Ministerien (gemeinsam mit der Kabinetts-Spezifikation)
Haushalt Ebene 2, der Kabinettstisch und das Ressortrad brauchen **eine** Tabelle. Vorschlag: neue Datei `data/ministerien.ts`.

```ts
export type MinisteriumId =
  | "justiz" | "familie" | "arbeit" | "umwelt" | "aeusseres" | "energie" | "jugend" | "finanzen" | "inneres"
  | "kultur" | "bildung" | "verteidigung" | "gesundheit" | "industrie" | "landwirtschaft" | "handel" | "verkehr";
export type EtatTraeger = MinisteriumId | "praesidialamt";   // Präsidialamt: kein Ministerium, aber eigener Etat (MİT, Cyber, Religionsbehörde)
export interface MinisteriumDef {
  id: MinisteriumId; name: string; amtlich: string;           // amtlich: türkischer Name, z. B. „Sağlık Bakanlığı“
  icon: IconId; familie: "soziales" | "sicherheit" | "wirtschaft" | "staat";
  posten: string[];        // Haushaltsposten aus sim/haushalt.ts POSTEN
  behoerden: BehoerdeId[]; // aus data/behoerden.ts
  massnahmen: string[];    // Maßnahmen-IDs aus data/politiknetz.ts
}
```

`PostenDef` (sim/haushalt.ts) bekommt das Feld `traeger: EtatTraeger`, das `amt` ablöst. `RESSORT_POSTEN` (data/behoerden.ts) wird aus `MINISTERIEN[].posten` abgeleitet und nicht mehr von Hand gepflegt. `Figur.amt` (sim/spiel-typen.ts:36) muss die 17 Ministerien kennen; das regelt die Kabinetts-Spezifikation. Bis dahin gilt der heutige Rückfall `ministerFuer(w, amt)` aus sim/ministerfluss-kern.ts:65, der unbesetzte Ämter an „stab“ gibt. Die Oberfläche zeigt das dann ehrlich als „kommissarisch: Präsidialamt“.

### 0.2 Zuordnung der heutigen Haushaltsposten (sim/haushalt.ts `POSTEN`, Zeilen 108–150)

| Posten (id) | Start % BIP (data/haushaltsplan.ts `RESSORTS_2026`) | Beleg | Ministerium | Bemerkung |
|---|---|---|---|---|
| `rentenniveau` | 3,0 (2.329 / 783) | abgeleitet (SGK-Zuschuss) | arbeit | Etat über `rentenSicht(w).etat` (mit `demografieFaktor`) |
| `rentenalter` | 0 | Spielparameter | arbeit | spart je Stufe 0,15 % BIP; Regler ohne eigenes Stück |
| `sozialhilfe` | 1,0 | Spielparameter | familie | |
| `gesundheit` | 1,0 | Spielparameter | gesundheit | |
| `bildung` | 3,0 | Spielparameter | bildung | Hochschulen (YÖK) sind kein Ministerium; vorerst hier mit ⓘ |
| `forschung` | 0,4 | Spielparameter | industrie | TÜBİTAK hängt am Industrieministerium (zu prüfen) |
| `verteidigung` | 1,9 | Spielparameter | verteidigung | |
| `innere_sicherheit` | 1,0 | Spielparameter | inneres | trägt heute über `RESSORT_POSTEN.praesidialamt` auch MİT und Cyberabwehr (siehe Fehler F6) |
| `investitionen` | 1,7 (1.312 / 783) | abgeleitet: **alle** Kapitalausgaben | verkehr | ökonomische Art, keine Aufgabe; ⓘ „enthält Investitionen aller Ressorts, Aufteilung folgt mit der Quelle“ |
| `wohnen` | 0,3 | Spielparameter | umwelt | TOKİ steht außerhalb des Zentralhaushalts (zu prüfen) |
| `landwirtschaft` | 0,5 | Spielparameter | landwirtschaft | |
| `umwelt_energie` | 0,3 | Spielparameter | **wird geteilt:** `umwelt` → umwelt, `energie` → energie | neue Posten, siehe 0.3 |
| `kultur` | 0,2 | Spielparameter | kultur | |
| `justiz` | 0,35 | Spielparameter | justiz | |
| `diplomatie` | 0,15 | Spielparameter | aeusseres | |
| `personal` | 7,0 (5.507 / 783) | abgeleitet: **alle** Personalausgaben | finanzen (nur als Regler „Besoldung“) | eigenes Stück „Öffentlicher Dienst“, siehe 2.2 |
| `subventionen` | 0,8 | Spielparameter | energie (vorläufig) | stärkste Dauerwirkung `energiepreise −2`; siehe offene Frage 2 |
| `einkommensteuer`, `verbrauchsteuern`, `unternehmensteuer` | Einnahmen | | finanzen (Innenring) | |
| Zinsen | `zinsausgabenJetzt(w)` (sim/wirtschaft.ts) | | finanzen, **gesperrt** | |
| — | — | — | jugend, handel | **kein Posten im Spiel (Datenlücke)** |
| — | — | — | praesidialamt | kein eigener Posten; MİT und Cyber hängen heute an `innere_sicherheit` |

### 0.3 Neue Posten und Daten
1. **`umwelt` und `energie` statt `umwelt_energie`.** Je 0,15 % BIP Start, Schritt 0,05, Spanne wie heute (−3 bis 8), Reifezeit 24 Monate. Das alles ist Spielparameter, sichtbar gekennzeichnet. Die Dauerwirkungen werden aufgeteilt:
   - `umwelt`: `klimaschutz 0,6`, `luftqualitaet 0,4`
   - `energie`: `erneuerbare 0,6`, `stromversorgung 0,2`
   - Sofortwirkung wie heute auf `umwelt` (`junge`, `staedtische_saekulare`); `energie` hat keine Sofortwirkung.
   - Spielstand: `migriereHaushalt` (sim/wirtschaft.ts) übernimmt `stufen.umwelt_energie` für beide neuen Posten. `POSTEN_ALIAS.umwelt_energie` zeigt auf `umwelt`, und `energie` bekommt dieselbe Stufe.
   - Die Kataloge für die Texte unter `haushalt.posten.<id>.*` sind neu anzulegen.
2. **`jugend` und `handel`:** Ohne Quelle für den Startanteil **kein neuer Regler**. Beide Ministerien erscheinen unter dem Rad als graue Chips „noch kein eigener Etat im Spiel“. Ihre Maßnahmen (Liste 0.4) stehen auf Ebene 2 trotzdem.
3. **`praesidialamt`:** vorerst kein Regler, also ebenfalls Chip. MİT und Cyberabwehr bleiben über `innere_sicherheit` bezahlt, bis ein eigener Etat belegt ist.
4. **Kosten je Maßnahme:** `policyCost` (sim/netz.ts:487) summiert über alle Maßnahmen. Neu ist `massnahmeMehrkosten(model, s, id)`, die dieselbe Rechnung für einen Knoten zurückgibt: `(nationalAverage − startAverage) / 100 × node.cost` in % BIP. `policyCost` wird daraus summiert, damit die Spielregel gleich bleibt.

### 0.4 Zuordnung der kostenwirksamen Maßnahmen (data/politiknetz.ts) zu den Ministerien
Grundsatz: Das Thema bestimmt das Ministerium. Ausnahmen sind einzeln genannt. „(prüfen)“ heißt, dass die Zuordnung zur Behörde vor der Umsetzung zu belegen ist.

- **arbeit:** m_renten, m_fruehrente, m_arbeitslosengeld, m_gewerkschaftsrechte, m_ausbildung (İŞKUR, prüfen), m_fachkraefteprogramm, m_mindestlohn
- **familie:** m_sozialhilfe, m_kindergeld, m_kinderbetreuung, m_gewaltschutz
- **gesundheit:** m_krankenhausbau, m_aerztegehalt, m_hausarzt, m_zuzahlungen, m_medizintechnik
- **bildung:** m_lehrergehaelter, m_schulbau, m_religioese_schulen, m_berufsschulen, m_unigruendungen, m_wissenschaftsfreiheit, m_bildungstechnik
- **jugend:** m_stipendien (KYK, prüfen)
- **industrie:** m_investitionsanreize, m_kmu, m_industrie_modernisierung, m_forschung, m_regionalfoerderung (Entwicklungsagenturen, prüfen)
- **handel:** m_exportfoerderung, m_zoelle, m_preiskontrollen, m_handelssysteme
- **energie:** alle 16 Maßnahmen des Themas „energie“ außer m_umweltauflagen
- **umwelt:** m_umweltauflagen und das ganze Thema „wohnen“ (m_sozialwohnungen, m_mietdeckel, m_stadterneuerung, m_bauaufsicht, m_baukredite, m_bauamnestie, m_gebaeudeverstaerkung, m_versicherungspflicht, m_bauindustrie)
- **verkehr:** m_autobahnen, m_oepp_garantien, m_bahn, m_nahverkehr, m_breitband, m_smart_infrastruktur, m_instandhaltung, m_internetsperren (BTK, prüfen)
- **landwirtschaft:** das ganze Thema „landwirtschaft“ (DSİ bei m_staudaemme, prüfen)
- **kultur:** m_tourismuswerbung, m_denkmalschutz, m_kulturfoerderung, m_archaeologie
- **justiz:** das ganze Thema „recht“ außer m_notstand, dazu m_minderheitenrechte (prüfen)
- **inneres:** m_polizei, m_polizeitechnik, m_fruehwarnsystem, m_afad_ausbau, m_grenzschutz, m_rueckkehr, m_integration, m_versammlungsfreiheit
- **verteidigung:** m_verteidigung, m_wehrdienst, m_uebungen, m_offiziersauswahl
- **aeusseres:** m_eu_annaeherung
- **finanzen:** das ganze Thema „haushalt“, dazu m_kreditgarantien und m_bankenaufsicht (BDDK unabhängig, prüfen)
- **praesidialamt:** m_notstand, m_friedensprozess, m_ruestungsindustrie (SSB, prüfen), m_religionsbehoerde, m_staatsmedien, m_medienaufsicht (RTÜK, prüfen), m_digitale_oeffentlichkeit

**Behörden** (data/behoerden.ts):
- inneres: polizei, grenzschutz, afad
- justiz: justiz
- finanzen: steuer, statistik (TÜİK, prüfen)
- gesundheit: gesundheit
- bildung: bildung
- aeusseres: diplomatie
- praesidialamt: mit, cyber

### 0.5 Regeln, die beide Bereiche betreffen
- **Zustimmung:** Überall erscheint derselbe Wert, `angezeigteZustimmung(w).wert` (sim/medien.ts:863), benannt mit dem Institut („Ekran 54 %“). Den wahren Wert `spiel.umfrage.zustimmung` zeigt die Oberfläche nur, wenn `quelle === "rohdaten"`, und dann mit dem Etikett „Rohdaten“. Betroffen: Leiste (ui/Stage.tsx:429), Aktenkopf Gesellschaft (ui/akte/Bereiche.tsx:86) und Krisenrat (`sozialeKrisenlage`). Siehe Fehler F2.
- **Veröffentlicht statt wahr:** Kennzahlen mit Veröffentlichungsdatum (Inflation, Wachstum) zeigen immer `aktuellerWert(w, id)` aus sim/wirtschaft-kennzahlen.ts, nie `w.economy.*`.
- **Zahlenformat:** Indizes 0–100 als ganze Zahl. Prozent mit einer Nachkommastelle. Lira mit einer Nachkommastelle. Beträge in „Bio. ₺“ mit einer Nachkommastelle, unter 1 Bio. in „Mrd. ₺“ ganzzahlig. Datum mit `formatDateDe`, nie ISO.
- **Preisschild** an jedem Knopf, der etwas kostet, als einheitlicher Baustein `<Preis kapital aufmerksamkeit bip legitimitaet loyalitaet />`. Neu in ui/akte/Bausteine.tsx, ersetzt die verstreuten Regeltexte.
- **Bilder:** Tacho, Rad und Kreisfeld werden als eigene Bausteine in ui/akte/Bildkarten.tsx gebaut (diese Datei gibt es schon), damit Kabinett und Politik sie wiederverwenden.
- **Farben** prüft der Palettenprüfer wie beim heutigen Rad (Kommentar in ui/wirtschaft/HaushaltsRad.tsx, Zeile 4).

---

## Wirtschaft (sieben Reiter werden vier Ansichten: Lage · Haushalt · Geld & Lira · Handel)

**Aktenkopf Wirtschaft:** Die drei Kopfzahlen dürfen nicht in der Leiste stehen. Statt Inflation, Wachstum und Lira (ui/wirtschaft/Akte.tsx:56–58) kommen Arbeitslosigkeit (`aktuellerWert(w,"arbeitslosigkeit")`), Wachstum veröffentlicht (`aktuellerWert(w,"wachstum")`) und Netto-Reserven (`w.economy.reservenNettoUsdMrd`). Die Reiter stehen in einer Zeile. Es gibt keine rechte Reitergruppe mehr; „Bilanz & Entwicklung“ und „Wirtschaftskabinett“ entfallen.

#### Wirtschaft › Lage
1. **Frage und Erfolg:** „Was brennt in der Wirtschaft, und was kann ich tun?“ In 5 Sekunden sieht man, welche der sechs Größen rot ist, ohne zu scrollen und ohne Text zu lesen.
2. **Aufbau (Zonen), Akteninhalt 1150 × 750:**
   - Z1, Tachoband (1150 × 300, zwei Reihen à drei Kacheln von je ~370 × 140): ganz in der ersten Bildschirmhöhe.
   - Z2, Alltagszeile (1150 × 60): drei kleine Balken.
   - Z3, Detail (1150 × ~380, öffnet beim Klick auf eine Kachel und schiebt sich unter Z1, ohne die Seite neu aufzubauen): links die Kurve (700 px), rechts Ursachen und Handlungen (430 px).
   - Z4, zugeklappte Reiter: „Alle Kennzahlen“ · „Weltvergleich“.
3. **Inhalte je Zone:**
   - Z1, Tachos als Halbkreis 180° mit Zeiger, großer Zahl, Pfeil und „seit Amtsantritt“ (`startWert(w,id)`) in Grün oder Rot nach `bewertung(k, jetzt, start)` (sim/wirtschaft-kennzahlen.ts:493). Darunter eine 12-Monats-Linie mit fester Achse.

     | Tacho | Wert | Bänder (Quelle) |
     |---|---|---|
     | Inflation | `aktuellerWert(w,"inflation")` | grün < 10, gelb < 25, rot ≥ 25 (heutige Schwellen in ui/wirtschaft/Akte.tsx:56); Zielmarke `w.economy.inflationTarget` |
     | Arbeitslosigkeit | `aktuellerWert(w,"arbeitslosigkeit")` | keine Schwelle im Code. Neu als Spielparameter: grün ≤ Startwert, gelb bis +1 Punkt, rot darüber; gekennzeichnet |
     | Wachstum | `aktuellerWert(w,"wachstum")` (veröffentlicht) | grün ≥ 3, gelb ≥ 0, rot < 0 (Akte.tsx:57); Marke Potenzialwachstum `potential(w.economy)` |
     | Lira je Dollar | `aktuellerWert(w,"usd")` | keine Schwelle. Zeiger zeigt die reale Abwertung über 12 Monate: `fxChange12 − (inflation − PARAMS.foreignInflation)` (wie der Treiber in wirtschaft-kennzahlen.ts:131); grün ≤ 0, gelb ≤ 10, rot darüber (neuer Spielparameter) |
     | Defizit | `aktuellerWert(w,"defizit")` | Zielmarke 3,1 % BIP (Mittelfristprogramm 2027–2029, Kommentar zu `PLAN_2026.defizitProzentBip` in data/haushaltsplan.ts); bei IWF-Programm `iwfAuflagen(w).defizitMax` (sim/devisen.ts:366) |
     | Netto-Reserven | `w.economy.reservenNettoUsdMrd` | rot < `DEVISEN.kriseAn` (10), gelb < `DEVISEN.druckAn` (25) (sim/devisen.ts:65–69). Heute steht der Wert bei 23,9, also **gelb** (Zuschlag läuft). Die heutige Seite verschweigt das |

   - Z2, Alltag: `krisenAlltag(w)` (sim/krisengesetze.ts:17) für Lebenshaltung, Realeinkommen und Armut, als ganzzahlige Indizes mit Lesehilfe ⓘ „0–100, 50 = Stand 2026“ und Trendpfeil. Ersetzt den Kasten „Preise, Einkommen & Arbeit“ des Krisenrats.
   - Z3, Detail:
     - Kurve: `Diagramm` (ui/wirtschaft/Diagramm.tsx) mit `verlauf(w,id)`, `berechneReihen` (ui/wirtschaft/prognose.ts) und `alleMarken(w)`. Die Marken sind anklickbar.
     - Ursachen: `kennzahl(id).treiber(w).zeilen`, die drei mit dem größten Betrag, als waagrechte Balken.
     - Handlungen: `kennzahl(id).handlungen`, höchstens drei. Jede ist ein Knopf mit Preisschild. Der Preis kommt bei Haushaltsposten aus `postenVorschau(w, posten, stufe)` (`kapital`, `defizitNachher`), bei der Zinssitzung aus `druckOptionen(w)`. Der Knopf zeigt die Wirkung als gestrichelte Prognose auf derselben Kurve (heutiges `vorschau` in ui/wirtschaft/Lage.tsx:206).
   - Z4, „Alle Kennzahlen“: die heutige Liste der `KENNZAHLEN` als Tabelle (Name, Wert, Einheit, Pfeil, kein Sparkline-Wald). „Weltvergleich“: eine Zeile je Größe aus `VergleichBalken` und `ZUORDNUNG`/`spielWert` (ui/vergleich), mit Rang und Weltwert, ohne Balkenliste.
   - Wirkungsberichte: als Marken in der Kurve. Datenquelle ist `berichteFuer(w, themen)` (genutzt in ui/akte/Bereiche.tsx `VerlaufAnsicht`); ein Klick zeigt den Bericht in einer Sprechblase.
4. **Zustände:**
   - Ohne Verlauf (erster Monat): Tachos ohne Linie, „seit Amtsantritt“ entfällt.
   - Krise (ein Tacho rot): Diese Kachel ist beim Öffnen vorgewählt, Z3 ist offen.
   - IWF-Programm aktiv: Die Defizitmarke wird zur Auflage, ein Siegel „IWF“ steht an der Kachel.
   - 0 Kapital: Handlungsknöpfe deaktiviert mit Grund aus `kannZahlen` (sim/kapital.ts).
5. **Klicks:**

   | Element | Aktion | Ergebnis | landet in |
   |---|---|---|---|
   | Tacho | Klick | öffnet Z3 für diese Größe | Lage, Z3 |
   | Tacho | Hover | Tooltip: Wert, Band, Quelle der Messung (`kennzahl.gemessen`) | – |
   | Kurvenmarke | Klick | Sprechblase Bericht oder Ereignis | – |
   | Handlung Haushalt | Klick | Haushalt Ebene 2 des zuständigen Ministeriums, Zeile vorgewählt | Haushalt › Ministerium |
   | Handlung Zentralbank | Klick | Geld & Lira, Zone Sitzung | Geld & Lira |
   | Handlung Vorschau | Hover | gestrichelte Prognose in der Kurve | – |
   | „Alle Kennzahlen“ | Klick | klappt Tabelle auf; Zeile → Z3 | Lage |
   | Alltagsbalken | Klick | Z3 mit Kurve dieser Größe (über `netzKennzahl`) | Lage |
6. **Übernommen / gelöscht:**
   - Umgebaut wird ui/wirtschaft/Lage.tsx: Die Liste wird zum Reiter „Alle Kennzahlen“, das Detail bleibt erhalten.
   - Übernommen: ui/wirtschaft/Diagramm.tsx, prognose.ts, ui/VergleichBalken.tsx.
   - Gelöscht wird ui/wirtschaft/Akte.tsx der Reiter „verlauf“ (026.png) und „personen“ (027.png).
   - Hier gehen auf: Wirtschaftslage (021), Bilanz & Entwicklung (026) und der Alltagskasten aus dem Krisenrat (022b).
7. **Simulationsbedarf:** keiner außer dem neuen Spielparameter für die Bänder von Arbeitslosigkeit und Lira, als `WIRTSCHAFT_BAENDER` in sim/wirtschaft-kennzahlen.ts, gekennzeichnet.
8. **Texte:**
   - Die Verweise „(Z1)“ bis „(Z5)“ fallen aus allen Texten von i18n/katalog/de/kennzahlen.json (10 Stellen).
   - „Index“-Werte bekommen die Lesehilfe „0–100, 50 = Stand 2026“.
   - Aus „Gefühlte Teuerung“ und „Lebenshaltungskosten“ wird ein Begriff, „Lebenshaltung“.
9. **Abnahme:**
   - Erste Bildschirmhöhe zeigt sechs Tachos und die Alltagszeile.
   - Gesamthöhe ohne aufgeklappte Reiter ≤ 1,3 × 750 px.
   - Kein Wert steht zweimal (Kopf ≠ Tachos ≠ Leiste).
   - Wachstum im Kopf = Wachstum im Tacho.
   - Keine Zeichenkette „(Z“ im Katalog.
   - Tests: test/akte-lage.test.tsx und test/wirtschaft.test.ts anpassen; neuer test/wirtschaft-tachos.test.tsx (Bänder je Tacho, Reserven 23,9 ergibt gelb).
10. **Aufwand:** M. Vorbedingung: der Baustein Tacho; Haushalt Ebene 2 für die Sprungziele.

#### Wirtschaft › Haushalt
Drei Ebenen in **einer** Ansicht. Die Ebenen wechseln durch Hineinzoomen (Animation 300 ms), nicht durch neue Reiter.

**Ebene 1, Gesamtrad**
1. **Frage und Erfolg:** „Wohin geht das Geld, woher kommt es, wie groß ist die Lücke?“ In 5 Sekunden zeigt das Rad das größte Ressort, den Kreditanteil (schraffiert) und das Defizit in der Mitte.
2. **Aufbau:**
   - Z1, Kopf (1150 × 60): Defizit, Fensterstatus, Finanzminister.
   - Z2, Rad links (520 × 520).
   - Z3, rechte Tafel (600 × 520): Auswahl und Fertige Pakete.
   - Z4, Fußzeile (1150 × 120): Schulden, Zinsen, Mehrheit des Haushaltsgesetzes, Chips der Ministerien ohne Etat.
   - Z5, zugeklappte Reiter: Alle Posten · Verfahren · Bisher · Rechnung.
   - In der ersten Bildschirmhöhe: Z1 bis Z3.
3. **Inhalte je Zone:**
   - Z1:
     - „Defizit 2,9 % des BIP“ aus `defizitJetzt(w)` (sim/wirtschaft.ts).
     - Fenster aus `haushaltsfenster(w)` (sim/haushalt.ts): „Haushaltsfenster offen bis …“ oder „Nächstes Fenster Oktober 2030 · in 8 Monaten · Änderungen jetzt als Nachtrag: Kapital ×2“. Der Faktor kommt aus `HAUSHALT_ZYKLUS.nachtragFaktor`.
     - Porträt Finanzminister `ministerFuer(w,"finanzen")` mit Ring = Loyalität. Liegt das Defizit über der Zielmarke 3,1 %, sagt er einen Satz (neuer Katalogtext).
   - Z2, Rad:
     - Außenring: ein Stück je Etatträger mit Etat > 0. Betrag = Summe von `etatBip(p, stufeVon(w,p.id))` über `MINISTERIEN[id].posten` (Arbeit: `rentenSicht(w).etat`) × `staatsfinanzen(w).bip / 100`.
     - Dazu „Zinsen“ (`zinsausgabenJetzt(w)`), grau, mit Schloss.
     - Dazu „Öffentlicher Dienst und Übriges (nicht zugeordnet)“ als Rest, grau schraffiert, siehe 2.2.
     - Farbe nach `familie` in vier Farbtönen, in Hellstufen gestaffelt; Ikone und Name auf dem Ring ab 4 % Anteil, darunter nur Ikone.
     - Innenring: die heutigen Einnahmestücke aus `radStuecke` (ui/wirtschaft/HaushaltsRad.tsx), mit fünf deutlich unterscheidbaren Tönen statt fünf Brauntönen, dazu „Neue Schulden“ schraffiert (`staatsfinanzen(w).kreditMrd`).
     - Mitte: Defizit, beim Hover das Stück.
     - Die Summe des Außenrings ist **genau** `staatsfinanzen(w).ausgabenMrd`.
   - Z3, Tafel:
     - Ohne Auswahl: „Fertige Pakete“, sieben Knöpfe: `PAKETE` (sim/haushalt.ts:380: konsolidieren, investieren, zukunft, aufruestung) und `KRISENPAKETE` (sim/krisenpaket.ts:18: entlastung, umschichten, dienste).
     - Jeder Paketknopf trägt ein Preisschild: Kapital aus `krisenPaketPlan(w,id).pk` bzw. Summe `postenVorschau`, Saldo in % BIP und Mehrheit `prognose`.
     - Hover über ein Paket färbt das Rad als Vorschau um (wachsende Stücke kräftig, schrumpfende blass). Klick übernimmt es: im Fenster `paketInEntwurf`, außerhalb `bringeKrisenPaketEin` (nur Krisenpakete; die vier Finanzpakete sind außerhalb des Fensters gesperrt, mit Grund).
     - Mit Auswahl (Hover oder Klick auf ein Stück): Name, Betrag in Bio. ₺, Anteil am Haushalt, % BIP, Minister, Veränderung seit 2026 in Stufen und Lira, Knopf „Öffnen“.
   - Z4:
     - „Schulden 23,0 % · Zinsen 3,1 % des BIP“ (heutiges `hd-kern`).
     - Mehrheit als kleines Halbrund mit 301-Linie aus `haushaltsEntwurfsSicht(w)` oder `haushaltsGesetzSicht(w)`, Knopf „Haushaltsgesetz einbringen“ (heutige Komponente ui/wirtschaft/HaushaltsMehrheit.tsx).
     - Chips für Etatträger ohne Posten: Jugend und Sport, Handel, Präsidialamt („noch kein eigener Etat im Spiel“).
   - Z5:
     - „Alle Posten“: die heutige Reglerliste (ui/wirtschaft/Haushalt.tsx `seite()`), nach Ministerium statt nach Gruppe geordnet.
     - „Verfahren“: heutige `_zyklus` und `_plan`.
     - „Bisher“: `_bisher` und `_abschluss`.
     - „Rechnung“: ui/wirtschaft/Staatsfinanzen.tsx.

**Ebene 2, Ministeriumsrad** (Klick auf ein Stück)
1. **Frage und Erfolg:** „Wofür gibt dieses Ministerium sein Geld aus, wo kann ich kürzen, und wer schreit dann?“ In 5 Sekunden sieht man das größte Stück, den Wunsch des Ministers und den Preis einer Kürzung am ersten Regler.
2. **Aufbau:**
   - Z1, Kopf (1150 × 90): zurück, Name, Minister, Etat.
   - Z2, Rad links (380 × 380).
   - Z3, rechts (720 × 520): Zeilen mit Regler.
   - Z4, unter dem Rad (380 × 140): „Wen es trifft“, betroffene Wählergruppen als kleine Kreise.
   - Alles in der ersten Bildschirmhöhe; bei mehr als sechs Zeilen scrollt nur Z3.
3. **Inhalte je Zone:**
   - Z1: „← Gesamthaushalt“, Ikone, Name (z. B. „Gesundheit · Sağlık Bakanlığı“).
   - Z1, Minister: Porträt der Figur des Ministeriums. Bis Kabinett-17 umgesetzt ist, `ministerFuer(w, amt)` mit Hinweis „kommissarisch“, wenn `f.amt !== amt`. Ring = Loyalität, Satz = Wunsch: `ministerWunsch(w, posten)` (sim/haushalt.ts:313), dargestellt als „will +2 Stufen = +x % BIP = +y Mrd. ₺“ über `schritt` und `mrdJeStufe(p, w)` (Beispiel Bildung: 2 × 0,2 = 0,4 % BIP).
   - Z1, Etat: Bio. ₺ · % BIP · % des Haushalts.
   - Z2, Stücke in drei Arten:
     - (a) **Grundetat je Haushaltsposten** des Ministeriums: `etatBip × bip`.
     - (b) **Programme**: die Maßnahmen des Ministeriums mit Mehrkosten > 0 gegenüber 2026, aus `massnahmeMehrkosten` (0.3 Punkt 4).
     - (c) **Behörden**: dünner Innenring im Stück des bezahlenden Postens, Anteil = `behoerdenVerbrauch(w)` (`ausEtat`) des Jahres plus laufender Mehrunterhalt `behoerdeSicht(w,id).unterhalt`.
     - Programme mit negativen Mehrkosten (Einsparung) stehen als Liste neben dem Rad, nicht im Rad.
     - Unter dem Rad als ⓘ: „Aufteilung nach Haushaltsposten und Maßnahmen. Die Unterteilung nach Ausgabenart (Personal, Betrieb, Investitionen, Übertragungen) folgt mit dem Haushaltsgesetz 2026 nach Einrichtungen.“ Steht bei einem Posten `beleg === SPIEL`, erscheint ein Siegel „Startanteil geschätzt“.
   - Z3, Zeilen je Stück:
     - Haushaltsposten: Name, Betrag (Mrd. ₺ und % BIP, vorher → nachher), Regler −/+ (heutige Zeile aus Haushalt.tsx).
     - Preisschild am Regler aus `postenVorschau(w,id,stufe)`: `kapital`, im Nachtrag `zyklus.faktor` und Legitimität `HAUSHALT_ZYKLUS.nachtragLegitimitaet`, Loyalität ±1 des Ministers (Regel in `wende`, sim/haushalt.ts:300).
     - Wirkung: `vorschau.zeilen` mit Reifezeit `reifeMonate`, Gewinner und Verlierer aus dem Katalog `haushalt.posten.<id>.gewinner/verlierer/kehrseite`.
     - Maßnahme: die Zeile der Maßnahmentafel (ui/politik/MassnahmenTafel.tsx `MassnahmenTafel` mit `massnahmen` gefiltert auf das Ministerium), damit der Weg zum Gesetz derselbe bleibt (Entscheidung 2). Keine zweite Reglerlogik.
     - Behörde: Name, Leitung, drei Achsen als Punkte, Knopf „Öffnen“ (Ebene 3).
   - Z4: Gruppen aus `p.sofort` (Stimmung sofort) der gewählten Zeile als kleine Kreise in den Farben des Kreisfelds (G1). Beim Verschieben des Reglers blinken sie rot oder grün auf.
   - Wirkung auf die Gesamtlage: Unten rechts steht immer „Defizit vorher → nachher“ (`defizitVorher`, `defizitNachher`).

**Ebene 3, Behörde** (Klick auf eine Behörde)
- Die vorhandene Behördenkarte (ui/behoerden/Behoerde.tsx `BehoerdenListe` und die Detailtafel; beim MİT zusätzlich `MitZusatz` aus ui/behoerden/Mit.tsx) erscheint als Tafel rechts. Das Ministeriumsrad bleibt links sichtbar und zeigt das Behördenstück hervorgehoben.
- Ausbau und Kürzung nutzen `vorschau`, `baueAus`, `kuerzVorschau` und `kuerze` (sim/behoerden.ts).
- „Etat ohne Spielraum“ wird zur Zeile „Spielraum 0 % BIP. Ressortetat +1 Stufe gibt X % BIP Spielraum“. X = `schritt × AUSBAU.etatSpielraum`. Dazu ein direkter +1-Knopf am Posten mit Preis.

**Für alle drei Ebenen**

4. **Zustände:**
   - Fenster offen: Regler stellen den Entwurf (`setzeEntwurf`); das Preisschild sagt „kostenlos, wirkt mit dem Haushaltsgesetz“.
   - Fenster zu: Nachtrag (`setzePosten`); das Preisschild zeigt Kapital ×2 und Legitimität.
   - Gesetz im Parlament: Regler gesperrt mit Grund `haushalt.fehler.im_parlament`.
   - 0 Kapital: Regler zur unbeliebten Seite gesperrt (`kannZahlen`), die beliebte Seite bleibt offen, sofern bezahlbar.
   - Krieg: Verteidigung oben in der Paketliste; das Paket „aufruestung“ ist hervorgehoben.
   - IWF aktiv: Defizitgrenze als roter Strich im Mittelfeld.
   - Rest negativ (Konsistenzfehler): ⓘ-Warnung, siehe 2.2.
5. **Klicks:**

   | Element | Aktion | Ergebnis | landet in |
   |---|---|---|---|
   | Stück Außenring | Hover | Tafel Z3 zeigt Ressort | Ebene 1 |
   | Stück Außenring | Klick | Zoom in das Ministeriumsrad | Ebene 2 |
   | Zinsen | Klick | Tooltip „nicht kürzbar: Schuld × Zins“, Verweis Geld & Lira | Ebene 1 |
   | Öffentlicher Dienst | Klick | Ebene 2 Finanzen, Zeile „Besoldung“ vorgewählt | Ebene 2 |
   | Innenring Steuer | Klick | Ebene 2 „Einnahmen“: Rad aus `STEUERN_2026` (zehn Steuerarten), drei Steuerregler | Ebene 2 |
   | Schraffur Schulden | Klick | Tooltip und Verweis auf Lage, Tacho Defizit | Lage |
   | Paketknopf | Hover | Vorschau im Rad | Ebene 1 |
   | Paketknopf | Klick | Entwurf oder Einbringen, Rückmeldung | Ebene 1 |
   | Chip ohne Etat | Klick | Ebene 2 dieses Ministeriums, nur Maßnahmen | Ebene 2 |
   | „← Gesamthaushalt“ / Esc | Klick oder Taste | Zoom zurück | Ebene 1 |
   | Regler −/+ | Klick | Vorschau, danach Bestätigung (ui/wirtschaft/Bestaetigung.tsx) | Ebene 2 |
   | Ministerporträt | Klick | Ministerakte am Kabinettstisch | Kabinett |
   | Behördenzeile | Klick | Behördenkarte | Ebene 3 |
   | Maßnahmenzeile | Klick | Zeile klappt auf (Maßnahmentafel), „Als Gesetz einbringen“ | Ebene 2 |
   | Gruppenkreis Z4 | Klick | Seitenleiste dieser Gruppe | Gesellschaft › Das Volk |
   | „Haushaltsgesetz einbringen“ | Klick | heutiger Ablauf HaushaltsMehrheit | Ebene 1 |
6. **Übernommen / gelöscht:**
   - Umgebaut: ui/wirtschaft/HaushaltsRad.tsx (Ministerien, Rest, Zoom), ui/wirtschaft/Haushalt.tsx (Zeile wird Baustein, Liste wird Reiter „Alle Posten“).
   - Übernommen: HaushaltsMehrheit.tsx, HaushaltsBericht.tsx, Staatsfinanzen.tsx, Bestaetigung.tsx, ui/behoerden/*.
   - Ui/wirtschaft/Krisenrat.tsx entfällt: Pakete nach Z3, Alltag nach Lage. ui/wirtschaft/KrisenGesetze.tsx entfällt: Die drei Krisengesetze `KRISENGESETZE` (m_mindestlohn, m_arbeitslosengeld, m_ausbildung) werden benannte Fassungen dieser Maßnahmen in der Politik (Entscheidung 2).
   - Behördenreiter: Der Reiter „behoerden“ in ui/akte/Bereiche.tsx (Zeilen 439–449) entfällt für alle Akten.
   - Hier gehen auf: Haushalt (023), Krisenrat (022), Behörden (031) und die Behördenreiter der anderen Bereiche.
7. **Simulationsbedarf:**
   - `data/ministerien.ts` und `PostenDef.traeger` (0.1).
   - Posten `umwelt`/`energie` mit Migration (0.3).
   - `massnahmeMehrkosten` (0.3).
   - Neu `sim/ministerien.ts` mit `ministeriumSicht(w, id)`: `{ etatMrd, etatBip, anteil, minister, wunsch, posten: PostenVorschau[], programme: {id, mehrkostenBip}[], behoerden: BehoerdeSicht[] }`, gemeinsam genutzt vom Kabinettstisch.
   - `ministerWunsch` und `wende` lesen den Minister über `traeger` statt `amt`. Die Spielregel ±1 Loyalität bleibt gleich.
   - Behörden-Rückfallposten korrigieren (Fehler F6).
   - Keine neue Kostenregel.
8. **Texte:**
   - „Staat und Preise“ entfällt.
   - „Personal“ heißt „Besoldung im öffentlichen Dienst (alle Ressorts)“.
   - „Ministerium will +2“ heißt „{Name} will +2 Stufen (+0,4 % BIP)“.
   - „Ein Klick führt zu den Reglern“ heißt „Klicken Sie ein Ressort an, um seinen Etat zu öffnen“.
   - Die Preisregel als Absatz unter dem Rad entfällt (steht im Preisschild).
   - Stufen immer mit Lira-Gegenwert.
9. **Abnahme:**
   - Summe Außenring = `ausgabenMrd` (±0,1 %).
   - Die Prozente beider Ringe ergeben je 100.
   - Kein Posten in zwei Stücken.
   - Ebene 1 bis 3 ohne Seitenscroll in 1440 × 900.
   - Jeder Regler hat ein Preisschild.
   - Keine zwei Posten mit identischem Betrag ohne Siegel „geschätzt“.
   - Zoom zurück mit Esc.
   - Tests:
     - neu test/haushaltsrad.test.ts (Summen, Personal nur im Reststück)
     - neu test/ministerien.test.ts (jeder Ausgabeposten genau einem Träger, jede kostenwirksame Maßnahme genau einem Träger, jede Behörde genau einem Träger)
     - anpassen: test/haushalt-ressorts.test.ts, test/haushaltszyklus.test.ts, test/krisenpaket.test.tsx, test/krisengesetze.test.tsx (Ziel wandert), test/behoerden.test.ts (Rückfallposten), test/staatsfinanzen.test.tsx
10. **Aufwand:**
    - L insgesamt.
    - Der Personal-Fix (2.2) ist S und sofort machbar.
    - Ebene 2 setzt `data/ministerien.ts` voraus (Abstimmung mit der Kabinetts-Spezifikation).
    - Die volle Ausgabenart-Gliederung setzt die Recherche (2.3) voraus.

##### 2.2 Behebung der Doppelzählung beim Personal (ui/wirtschaft/HaushaltsRad.tsx), sofort und vor dem Umbau
**Befund mit Zahlen vom Bildschirm (023):**
- Die sieben Außenstücke ergeben 4,0 + 1,3 + 5,6 + 3,7 + 3,6 + 10,8 + 3,9 = **32,9 Bio. ₺**. Die Überschrift nennt **29,2 Bio. ₺** (`staatsfinanzen(w).ausgabenMrd`).
- Ursache: `radStuecke` summiert die absoluten Etats aller Ausgabeposten je Gruppe, darunter `personal` mit 7,0 % BIP (data/haushaltsplan.ts: „überschneidet sich mit den Fachressorts“). `staatsfinanzen` (sim/staatsfinanzen.ts) rechnet dagegen ausdrücklich keine „Summe über überlappende Funktions- und Personalausgaben“.
- Weil `summeAussen = Math.max(ausgabenMrd, Σ Stücke)` gilt, beziehen sich die Prozente auf 32,9 statt auf 29,2. Renten sind dann „12 %“ statt rund 14 %.

**Änderung in `radStuecke`:**
1. Die Gruppensummen (Zeile ~37) lassen `p.id === "personal"` aus.
2. Nach den Zinsen wird `rest = fin.ausgabenMrd − bekannt` gerechnet. Ist `rest ≥ 0`, kommt das Stück `{ id: "oeffentlicher_dienst", name: t("hd.rad.oeffentlich"), mrd: rest, farbe: UEBRIG, ziel: "staat" }` hinzu; „Öffentlicher Dienst und Übriges (nicht zugeordnet)“ mit ⓘ-Aufschlüsselung:
   - Personaländerung seit 2026 `stufeVon(w,"personal") × schritt × bip`
   - Reformen `w.economy.policyCost × bip`
   - weitere Impulse aus `staatsfinanzen(w).ausgaben` (Zeile „weitere“)
3. Ist `rest < 0`, wird `konsistent: false` zurückgegeben, ein Hinweis „Die geschätzten Ressortanteile übersteigen die Ausgaben um X Bio. ₺“ angezeigt und das Stück weggelassen.
4. `summeAussen = r.ausgabenMrd` (das `Math.max` entfällt). Dasselbe gilt für den Innenring: `einnahmenMrd + kreditMrd`.
5. Die Gruppe „staat“ heißt danach „Justiz, Äußeres, Kultur, Preisstützung“, bis die Ministeriumsansicht sie auflöst.

Rechnerische Größenordnung aus den Bildschirmwerten: Ressortstücke ohne Personal ≈ 20,1 Bio., mit Zinsen ≈ 24,0 Bio. Das Reststück liegt damit bei etwa 5,2 Bio. ₺. Das ist keine neue Zahl, sondern Folge der vorhandenen Startanteile; der Test prüft die Summe, nicht den Betrag.

##### 2.3 Nötige Recherche: Ministeriumshaushalte 2026
1. **Zentralhaushaltsgesetz 2026** (2026 Yılı Merkezi Yönetim Bütçe Kanunu, Resmî Gazete), **Tabelle (A)**: Mittel je Einrichtung (kurumsal sınıflandırma) und darin nach ökonomischer Art (Personal, Sozialbeiträge, Waren und Dienstleistungen, Zinsen, laufende Übertragungen, Investitionen, Kapitaltransfers, Darlehen, Reserve). Liefert die 17 Ministerien × Ausgabenart und beendet die Schätzung „Spielparameter“ für 13 Posten.
2. **Haushaltsbegründung** (Bütçe Gerekçesi) des Strategie- und Haushaltsamts (SBB) und **funktionale Gliederung** (fonksiyonel sınıflandırma, COFOG) der Muhasebat Genel Müdürlüğü. Daraus ergibt sich die Gliederung nach Aufgaben (Gesundheit, Bildung …) einschließlich Personal.
3. **Programmhaushalt** des SBB (Programme je Einrichtung), für Programmstücke statt Maßnahmen-Näherung. Zu prüfen ist, ob die Gliederung nutzbar ist.
4. **Abgrenzung außerhalb des Zentralhaushalts:** SGK, TOKİ, BOTAŞ, TMO und Kommunen. Das bestimmt, was im Rad nur als Zuschuss erscheint (Renten heute schon richtig als SGK-Zuschuss 2.329 Mrd.).
5. **Zugeordnete Einrichtungen** (bağlı, ilgili, ilişkili kuruluşlar), zur Prüfung der Behörden- und Maßnahmenzuordnung in 0.4: TÜBİTAK, KOSGEB, DSİ, AFAD, Diyanet, MİT, SSB, BTK, RTÜK, TÜİK, Zoll.

**Was die Ansicht bis dahin zeigt:**
- Ebene 1 mit den Etatträgern aus den vorhandenen Posten (Stücke mit Spielparameter tragen das Siegel „geschätzt“) und dem ehrlichen Reststück.
- Ebene 2 mit Posten, Programmen und Behörden statt Ausgabenarten, mit dem ⓘ-Satz aus Ebene 2, Zone Z2.
- Jugend und Sport, Handel und Präsidialamt als Chips.
- Keine erfundene Aufteilung.

#### Wirtschaft › Geld & Lira
1. **Frage und Erfolg:** „Was macht die Bank bei der nächsten Sitzung, mische ich mich ein, und wie viel Reserve habe ich?“ In 5 Sekunden sieht man den Zins heute, was die Bank beschließen will, das Datum und die Tankfüllung.
2. **Aufbau:**
   - Z1, links (330 × 520): Gouverneurin.
   - Z2, Mitte (480 × 520): Halbrund Leitzins mit Sitzung und Einmischung.
   - Z3, rechts (340 × 520): Reserventank mit Intervention.
   - Z4, zugeklappte Reiter (1150 × 40): Zentralbankgesetz · IWF · Beschlüsse.
   - Alles in der ersten Bildschirmhöhe. Ziel ≤ 900 px gesamt (heute 4.798).
3. **Inhalte je Zone:**
   - Z1, Gouverneurin:
     - Porträt aus `figur(w,"zentralbank")` (sim/figuren.ts), Name aus `w.governor.name`.
     - Zwei getrennt benannte Werte: „Linie: streng / ausgewogen / gefügig“ (`w.governor.stance`, Typ `GovernorStance` = vorsichtig | ausgewogen | gefuegig, Anzeige „streng“ für vorsichtig) und „Loyalität zu Ihnen: 50“ (`figurHaltung`).
     - Glaubwürdigkeit `glaubwuerdigkeitWort(w.economy.credibility)`.
     - Unabhängigkeit: Stufe aus `zbZustand(w)` mit Namen aus `STUFEN`.
     - Knopf „Ersetzen ▾“ öffnet die drei Typen mit `ernenneGouverneur`, Preis (Marktvertrauen) und Sperrfrist (`zb.neubesetzung`).
   - Z2, Halbrund 0–40 %:
     - Zeiger 1 „Leitzins 23,5 %“ (`w.economy.policyRate`).
     - Marke „Inflation 19,2 %“ (veröffentlicht); der Bogen dazwischen ist der Realzins, eingefärbt (`realRate(e)`, sim/economy.ts:115).
     - Zeiger 2 gestrichelt „Bank will 23,0 %“ = `ppkDecision(e, stance, druck).newRate`.
     - Darunter: Sitzung „17. März 2030 · in 42 Tagen“ (`naechsteSitzung(w)`).
     - Einmischung als vier Knöpfe aus `druckOptionen(w)`: keiner, gespraech_senken, rede_senken, gespraech_straffen, rede_straffen. Ist der Zins weisungsgebunden, kommt die Vorgabe dazu (`setzeVorgabe`).
     - Jeder Knopf mit `neu` (Beschluss danach), `kosten` als Preisschild und `moeglich`/Grund. Hover setzt Zeiger 2 auf `neu`.
     - Risikoaufschlag `e.riskPremium` als kleine Zahl unter dem Bogen.
   - Z3, Tank:
     - Netto-Reserven als Füllstand (`reservenNettoUsdMrd`) mit Marken `DEVISEN.druckAn` 25 und `kriseAn` 10, brutto als Zahl daneben.
     - Monatsfluss aus `leistungsbilanzZerlegung` und `kapitalflussZerlegung` als Pfeil ±.
     - Drei Knöpfe 2, 5 und 10 Mrd. $ mit `interventionsVorschau(w, x)` als Preisschild und Wirkung auf den Kurs; Ausführen mit `interveniere`.
     - Unter der Gelbmarke erscheint die Notfallkarte IWF: `iwfAnfrageMoeglich`, `iwfSicht`, „Beim IWF anfragen“ mit `iwfAuflagen` als Preis.
   - Z4:
     - Zentralbankgesetz: `stufenWechsel`, `aendereStufe`.
     - IWF, wenn aktiv: `iwfSicht`, `iwfKuendigen`.
     - Beschlüsse: Verlauf der Sitzungen aus `zbZustand(w)`.
4. **Zustände:**
   - Sitzung in weniger als 7 Tagen: Z2 hervorgehoben.
   - Weisungsgebunden: Zeiger 2 ist vom Spieler ziehbar.
   - Reserven < 25: Tank gelb, IWF-Karte sichtbar.
   - Reserven < 10: rot, Warnung `zb.warnung`.
   - IWF aktiv: Auflagen als Marken im Halbrund (`zinsMindest`).
   - 0 Kapital: Knöpfe mit Kapitalpreis gesperrt, „Nicht einmischen“ bleibt.
5. **Klicks:**

   | Element | Aktion | Ergebnis | landet in |
   |---|---|---|---|
   | Einmischungsknopf | Hover | Zeiger 2 auf neuen Beschluss | Geld & Lira |
   | Einmischungsknopf | Klick | Bestätigung, `machDruck` | Geld & Lira |
   | Porträt | Klick | Gespräch und Personenakte | Kabinett |
   | „Ersetzen ▾“ | Klick | drei Typen mit Preis | Geld & Lira |
   | Interventionsknopf | Klick | Bestätigung, `interveniere` | Geld & Lira |
   | IWF-Karte | Klick | Anfrage mit Auflagen | Geld & Lira |
   | Halbrund | Klick | Lage mit Tacho Inflation und Kurve Leitzins | Lage |
   | Reiter Z4 | Klick | klappt auf | Geld & Lira |
6. **Übernommen / gelöscht:**
   - Umgebaut: ui/wirtschaft/Zentralbank.tsx (486 Zeilen, neun Abschnitte, wird drei Zonen und drei Reiter).
   - Gelöscht: die Kurve „Was danach kommt“ mit fünf Unterreitern (doppelt zur Lage) und der Satz „Reformen und Haushalt benötigen zusätzlich …“ (`finanzierungsMehrbedarf`; er gehört als ⓘ an das Defizit im Haushalt).
   - Hier gehen auf: Zentralbank und Devisen (025) sowie die Gouverneurskarte aus dem Wirtschaftskabinett (027).
7. **Simulationsbedarf:** keiner.
8. **Texte:**
   - „Haltung“ für die Gouverneurin heißt „Linie“, „Haltung“ für die Loyalität heißt überall „Loyalität“ (betrifft auch ui/Personen.tsx).
   - Risikoaufschlag in „Punkten“ (ganzzahlig).
9. **Abnahme:**
   - Höhe ≤ 900 px ohne Reiter.
   - Jeder Eingriff mit Preisschild.
   - Das Wort „Haltung“ kommt auf der Seite nicht vor.
   - Tests: test/devisen.test.ts unverändert. Neuer test/geld-lira.test.tsx (Zeiger 2 = `ppkDecision`, Tank-Farbe bei 23,9 gelb).
10. **Aufwand:** M. Keine Vorbedingung außer den Bausteinen Halbrund und Preisschild.

#### Wirtschaft › Handel
1. **Frage und Erfolg:** „Fehlt etwas, von wem bin ich abhängig, was verdiene ich am Export?“ In 5 Sekunden sieht man, ob eine Ware unter 100 % liegt und welches Lieferland gefährdet ist.
2. **Aufbau:**
   - Z1, Warenband (1150 × 130): 16 Warenikonen als Füllstände, in vier Gruppen nach `art`.
   - Z2, Handelsbild (1150 × 420): Sankey, links die Lieferländer, Mitte Türkei, rechts die Abnehmer, für die gewählte Ware oder alle.
   - Z3, nur im Engpass (1150 × 160): Vorrang und Instrumente.
   - Z4, Reiter: Mengenrechnung · Versorgungsprogramme.
3. **Inhalte je Zone:**
   - Z1: `gueterSicht(w)` (sim/gueter.ts:259) je Gut. Füllstand = Deckung `warenDeckung(w,id)` (sim/versorgung.ts:51), Farbe = `ampel` (grün, gelb, rot, keine). Darunter Reichweite `reichweiteJetzt` in Tagen, wenn endlich. Lebensmittel, Energie, Industrie, Rohstoffe und Rüstung als Gruppen (Getreide ist eine Ikone in der Gruppe Nahrung, kein eigener Abschnitt).
   - Z2: Linke Bänder aus `GutDef.lieferanten` (data/gueter.ts: Land und Anteil in %; Rest „übrige Welt“), gefährdet rot nach `fluss.wege[].grund` (krieg, sanktion). Rechte Bänder aus `GutDef.kunden`.
     - **Datenlücke:** Die Kunden haben keine Anteile. Bis zur Quelle (TÜİK-Außenhandel nach Ländern und Warengruppen) werden die Abnehmer als gleich breite Bänder mit ⓘ „Anteile folgen“ gezeichnet.
     - Breite links = Einfuhrwert, wo `importUsdMrd` vorliegt, sonst Menge. Wert und Saldo: `letzteVersorgung(w).handelsDeltaUsdMrd`.
     - Knopf „Auf der Weltkarte“ öffnet die vorhandene `TransportTafel` (ui/gueter/TransportKarte.tsx).
   - Z3, nur wenn eine Ware `fehlProzent > 0` hat oder `militaerVersorgung(w).faktor < 1`:
     - Vorrang (ausgewogen, zivil, militaer) mit `setzeVersorgungsPrioritaet`; Preis wie heute „3 Kapital, 30 Tage Bindung“ als Preisschild.
     - Je Ware im Engpass die Instrumente `gutInstrumente(w,gut)` (reserve, freigabe, foerderung, stopp, quelle), jeweils mit `pk`, `bip` und `wirkung`.
     - Die Wahl „militaer“ ist nur im Krieg sichtbar.
   - Z4: Mengenrechnung (`WarenFluss`, heute Inventar). Versorgungsprogramme (`VersorgungsProgramm` schutz, energie, netz) als Verweis auf die Maßnahmen, siehe offene Frage 5.
4. **Zustände:**
   - Frieden ohne Engpass: Z3 fehlt, die Seite endet nach Z2.
   - Engpass: Ikone rot, Z3 offen, Kopfhinweis.
   - Krieg: zusätzlich Kachel „Treibstoff für die Front“ (`militaerVersorgung`).
   - Hormus gesperrt: Bänder mit `hormusAnteil` gestrichelt.
5. **Klicks:**

   | Element | Aktion | Ergebnis | landet in |
   |---|---|---|---|
   | Warenikone | Klick | Sankey nur dieser Ware, Z3 dieser Ware | Handel |
   | Lieferland | Klick | Länderkarte | Außen › Welt (Seitenfenster neben Karte) |
   | „Auf der Weltkarte“ | Klick | TransportTafel auf der Karte | Karte |
   | Vorrang | Klick | Bestätigung, Preis | Handel |
   | Instrument | Klick | `fuehreGutInstrumentAus` | Handel |
6. **Übernommen / gelöscht:**
   - Umgebaut: ui/gueter/Inventar.tsx.
   - Übernommen: TransportKarte.tsx, VersorgungsKursKarte.tsx (als Z3).
   - Gelöscht aus der Ansicht: VersorgungsMonatsbericht.tsx, also der Block „Was Ihre Entscheidungen bewirken / im Vergleich / Warum die Parteien reagieren“. Er steht doppelt auf Parlament 007 und wird höchstens ein Eintrag im Verlauf.
   - Hier geht auf: Versorgung & Handel (024).
7. **Simulationsbedarf:** keiner. Daten: Kundenanteile (Datenlücke, s. o.).
8. **Texte:**
   - Der Kicker „KABINETT · VERSORGUNG & SICHERHEIT“ entfällt.
   - „Zivile Bedarfsdeckung¹“ heißt „Versorgung“.
   - „Treibstoff für den Einsatz —“ entfällt im Frieden.
9. **Abnahme:**
   - Im Frieden ohne Engpass ≤ 650 px Höhe.
   - Kein Knopf ohne Wirkung im Frieden (Vorrang ausgeblendet).
   - Kein Wert „0,00“ sichtbar.
   - Tests: test/gueter.test.ts unverändert; test/versorgung.test.tsx und test/versorgungsbericht.test.tsx an den neuen Ort anpassen.
10. **Aufwand:** M. Recherche Kundenanteile (S).

---

## Gesellschaft (sieben Reiter werden: Das Volk · Opposition & Straße · Wahlkampf nur zeitweise)

**Aktenkopf Gesellschaft:** Zustimmung steht in der Leiste, also nicht im Kopf. Stattdessen:
- Stärke der Opposition (`gesellschaftLage(w)` id `opposition`)
- Protestdruck (`protest`)
- Rathäuser im Lager (`rathaeuserLager(w)`)

Das Urteil „Lage: ruhig“ (ui/akte/Bereiche.tsx:266–268, nur drei Kopfwerte) entfällt.

#### Gesellschaft › Das Volk
1. **Frage und Erfolg:** „Würde ich gewinnen, wer trägt mich, wen verliere ich, und was hilft?“ In 5 Sekunden sieht man auf einer Achse, wie viel Fläche rechts der Trägerlinie steht und welcher Kreis nach links wandert.
2. **Aufbau:**
   - Z1, Band oben (1150 × 70): Umfrage, Ziel und Wahl.
   - Z2, Kreisfeld (1150 × 430): elf Wählergruppen.
   - Z3, Milieuleiste (1150 × 90): fünf Milieus.
   - Z4, Seitenleiste rechts (400 × 600, überlagert Z2 rechts, wenn eine Gruppe gewählt ist).
   - Z5, Reiter: Verlauf · Abwanderung.
   - Z1 bis Z3 in der ersten Bildschirmhöhe.
3. **Inhalte je Zone:**
   - Z1:
     - „Umfrage {Institut} 54 %“ aus `angezeigteZustimmung(w)` (`wert`, `institut`, `streuung` als ± und `alterTage`).
     - Bei `quelle === "rohdaten"` steht daneben „Rohdaten 50 %“.
     - Zielwert „strebt zu {n} %“ aus `koalition(w).zielZustimmung`.
     - Wahl: „Wahl am 5. Dezember 2030 · in 10 Monaten“ (`zustimmungsBilanz(w).wahlDatum` mit `formatDateDe`, `wahlIn`).
     - Koalitionsbalken (heute gut) mit `traeger`, `schwankend` und `gegner`.
     - Mini-Kurve der Umfrage aus `institutsReihe(w)` mit fester Achse 30–70.
   - Z2, Kreisfeld nach Democracy 4:
     - Daten: `koalition(w).gruppen: GruppeKurz[]` (sim/waehler-detail.ts:519). Waagrechte Achse 0–100 = `laune` (Stimmung, `nationalAverage(NET, w.net, id)`), mit senkrechten Linien bei `SCHWELLE_SCHWANKEND` 45 und `SCHWELLE_TRAEGER` 58 (waehler-detail.ts:31–32). Beschriftet sind die Bereiche links „gegen Sie“, Mitte „schwankend“ und rechts „trägt Sie“.
     - **Kreisfläche** ∝ `anteil` = `gewicht / GRUPPEN_SUMME` (sim/gruppen.ts). Das ist ausdrücklich das Gewicht in der Zustimmung und ein Spielparameter (Werte 0,5 bis 1,4); die Legende sagt „Größe = Gewicht in der Umfrage“, nicht Bevölkerungsanteil.
     - **Füllfarbe** = `laune` auf einer Skala rot (0) über grau (50) bis grün (100).
     - **Rand** = `rolle` (`rolleVon`): voll bei Träger, gestrichelt bei schwankend, rot bei Gegner.
     - **Pfeil** vom Kreis zu `ziel` (Tendenz, `tendenz(w,id).ziel`) als blasser Schatten des Kreises am Zielort.
     - **Zahl** im Kreis ist `laune` ganzzahlig, mit kleinem ▲▼ `trend` (Veränderung zu vor 3 Monaten, `vorMonaten`).
     - Senkrechte Lage: Kraftlayout (Beeswarm) nur gegen Überlappung, ohne Bedeutung.
     - Hervorhebungen: `gewinnbar` mit goldenem Ring und Etikett „am ehesten zu gewinnen“, `gefaehrdet` mit rotem Puls.
     - Hover über einen Kreis: die drei stärksten `treiber(w,id)` (waehler-detail.ts:112) als Linien zu kleinen Ikonen am oberen Rand (Maßnahme oder Größe), grün oder rot wie in Democracy 4.
   - Z3, Milieus: `milieuLage(w)` (sim/gesellschaft.ts:259) für alle **fünf** (kurden, aleviten, frauen, gefluechtete, diaspora), als gleich große Kreise (keine belegte Größe: Datenlücke).
     - Farbe = `stimmung`, Dicke des roten Zackenrings = `groll`, Pfeil = `trend` (steigt, fällt, gleich).
     - Eine dünne Linie zum Gruppenkreis, auf den der Groll zurückwirkt (`MilieuDef.gruppe`: kurden und aleviten → minderheiten, frauen → staedtische_saekulare; gefluechtete und diaspora haben keine Linie).
   - Z4, Seitenleiste der gewählten Gruppe (`gruppenDetail(w,id)`):
     - drei Ursachen (`treiber`) als Balken mit Klartext statt Netzkette
     - drei Wünsche aus `praeferenzen(w,id).will` und `hasst`, je eine Zeile mit Stufe „von 50 auf 70“ (statt „+20 Stufen“)
     - „Was jetzt helfen würde“: `hilfen(w,id,3)` als `HilfeKarte` (ui/waehler/HilfeKarte.tsx) mit Preis `pk`, `kostenBip`, `monate`, `mehrheitFehlt` und Wirkung `zustimmung`; Knopf „Einbringen“ (Maßnahmenweg)
     - „wechselt zu …“ aus `wanderung(w,id)` als Pfeil mit Parteifarbe
     - Region: `regionen(w,id)` als Mini-Karte (`Karte2D`, ui/atlas/Karte2D.tsx, Füllung je Provinz)
   - Z5: Verlauf aus `zustimmungsVerlauf(w)` und `gesellschaftLage(w).reihe` mit festen Achsen 0–100 und Zustimmung 30–70; Abwanderung aus `abwanderung(w)`.
   - **Datenlücke Gruppengröße:** echte Größen fehlen. Mögliche Quellen:
     - Beschäftigte, Landwirte und Unternehmer: TÜİK-Arbeitskräfteerhebung
     - Rentner: SGK-Statistik
     - Junge: TÜİK-Bevölkerung nach Alter
     - Beamte: Personalstatistik des öffentlichen Dienstes
     - Arme: TÜİK-Armutsquote
     - Konservative, Säkulare, Nationalisten und Minderheiten: Umfragen zur Selbstverortung (prüfen)

     Die Gruppen überschneiden sich. Bis dahin bleibt „Gewicht in der Umfrage“ als Größe, offen benannt.
4. **Zustände:**
   - Vor dem ersten Umfragemonat: `quelle === "start"`, Band zeigt „noch keine Umfrage“.
   - Publikationsverbot (`publikationsverbot(w)`): Zahl eingefroren, Siegel „Verbot“.
   - Wahl in weniger als 56 Tagen (`WAHLKAMPF.beginnTage`): Band wird rot umrandet, Knopf „Zum Wahlkampf“.
   - Krise (Gruppe unter 30): Kreis pulsiert.
   - 0 Kapital: Einbringen-Knöpfe gesperrt mit Grund.
5. **Klicks:**

   | Element | Aktion | Ergebnis | landet in |
   |---|---|---|---|
   | Gruppenkreis | Hover | Linien zu den Treibern | Das Volk |
   | Gruppenkreis | Klick | Seitenleiste | Das Volk Z4 |
   | Treiber-Ikone | Klick | Maßnahmenzeile im Politikkreis | Politik |
   | Milieukreis | Klick | Seitenleiste Milieu: Ursachen `milieuLage().ursachen`, Groll, verknüpfte Gruppe | Das Volk Z4 |
   | Wunschzeile | Klick | Maßnahmenzeile aufgeklappt | Politik |
   | „Einbringen“ (HilfeKarte) | Klick | Gesetzesweg der Maßnahme | Parlament › Tagesordnung |
   | Umfragezahl | Klick | Rohdaten kaufen und Institute | Medien |
   | „Zum Wahlkampf“ | Klick | Wahlkampf | Gesellschaft › Wahlkampf |
   | Esc / ✕ | Taste oder Klick | schließt Seitenleiste | Das Volk |
6. **Übernommen / gelöscht:**
   - Umgebaut: ui/Waehler.tsx (`Barometer` wird Z1, `KoalitionsBalken` bleibt, die Kartenliste wird zum Kreisfeld), ui/waehler/GruppenDetail.tsx (wird Seitenleiste, vier Aufklapper werden drei Blöcke).
   - Übernommen: HilfeKarte.tsx, Sparkline.tsx, Kette.tsx (nur für das ⓘ „Warum genau?“).
   - Gelöscht: die Lageansicht der Gesellschaft mit „Lage: ruhig“ und „Milieus“ (Bereiche.tsx `lageZeilen` für gesellschaft), der Verlaufsreiter (032), der Personenreiter (033) und der Unterreiter „Gesellschaft, Opposition, Straße“ in ui/Waehler.tsx:213.
   - Hier gehen auf: Stimmung im Land (028), Wählerkoalition (029), Gesellschaft im Wandel (032).
7. **Simulationsbedarf:** keiner für die Anzeige. Optional `GRUPPEN[].bevoelkerung?` (sim/gruppen.ts) für die echte Größe nach Recherche, getrennt vom Gewicht, damit die Zustimmungsrechnung unverändert bleibt.
8. **Texte:**
   - „Stimmung“ statt „Laune“ in der Oberfläche.
   - „Gewicht“-Wörter (`gewichtWort`) entfallen, die Größe zeigt es.
   - „+20 Stufen“ heißt „von 50 auf 70“.
   - Datum deutsch.
   - Der Verweis „Rohdaten gibt es im Reiter ‚Medien‘ der Zeitung“ wird ein Knopf an der Zahl.
9. **Abnahme:**
   - Erste Bildschirmhöhe: Band, Kreisfeld und Milieus.
   - Höhe ohne Reiter ≤ 900 px (heute 4.086).
   - Alle elf Gruppen und alle fünf Milieus sichtbar, kein „1 weiterer Eintrag“.
   - Die Zustimmung zeigt in Kopf, Leiste und Band denselben Wert.
   - Kein ISO-Datum.
   - Tests: test/waehler-ui.test.tsx umschreiben (Kreisfeld statt Karten), test/waehler-detail.test.ts unverändert. Neu test/kreisfeld.test.tsx (Fläche ∝ `anteil`, Rand nach `rolle`, Schwellen 45/58).
10. **Aufwand:** L (Kreisfeld mit Layout und Hover-Linien). Vorbedingung: Regel 0.5 Zustimmung.

#### Gesellschaft › Opposition & Straße
1. **Frage und Erfolg:** „Wie stark ist die Opposition, wo brennt die Straße, wo habe ich Rathäuser verloren, und was tue ich dagegen, zu welchem Preis?“ In 5 Sekunden sieht man Arıkans Stärke, die Brandherde auf der Karte und die Zahl verlorener Rathäuser.
2. **Aufbau:**
   - Z1, links (400 × 560): Gegner und Instrumente gegen die Opposition.
   - Z2, rechts (730 × 560): Provinzkarte mit Rathäusern und Bewegungen.
   - Z3, Leiste unter der Karte (730 × 90): drei Tachos.
   - Z4, Reiter: Frühere Bewegungen · Züge der Opposition · Kommunalwahl.
3. **Inhalte je Zone:**
   - Z1:
     - Porträt der Oppositionsführung: Figur `amt === "opposition"` (heute Cem Arıkan), Partei `parteiName(o.partei)`, Bündnis `o.buendnis`.
     - Stärketacho 0–100 aus `oppositionVon(w).staerke`, mit Marke `zielStaerke(w,o)` (sim/opposition.ts:66).
     - Marken: `verfahren`, `maertyrer`, `immunitaetAufgehoben`, `verbot`, `ausschussBis`.
     - Instrumente aus `oppositionInstrumente(w)` (gespraech, ausschuss_zulassen, ermittlung, immunitaet, verbot), je eine Zeile mit Preisschild (`kapital`, `aufmerksamkeit`), Folgen-Chips (`folgen`), Vorschau `staerkeSofort` und `moeglich`/`grund`.
     - Nächster Zug „Die Opposition plant: …“ aus `naechsterZugArt(w,o)` und `o.naechsterZug`.
   - Z2, Karte `Karte2D` (ui/atlas/Karte2D.tsx):
     - Füllung je Provinz = Partei des Rathauses aus `kommunenVon(w)` (Lager oder Opposition; Zwangsverwaltung schraffiert).
     - Seit Amtsantritt verlorene Rathäuser rot umrandet: Vergleich mit `kommunenStart(w)` (sim/kommunen.ts:35).
     - Bewegungen als Brandherd-Marken aus `bewegungsOrte(w)` (sim/bewegungen.ts:332) in der Größe `groesse`.
     - Zähler „Rathäuser im Lager 19 (beim Amtsantritt 32)“.
     - Klick auf eine Provinz mit Bewegung öffnet eine Karte mit `bewegungenSicht(w)`: Antworten dialog, zugestaendnis, polizei, verbot, je mit Preis `antwortKapital` (wächst mit der Größe) und Vorschau (Größe, Radikalität, Märtyrer).
     - Klick auf ein Rathaus öffnet Zwangsverwalter einsetzen oder abziehen (`zwangsverwalterEinsetzen`/`zwangsverwalterAbziehen`, Preis `VERWALTER_KOSTEN`).
   - Z3, Tachos mit fester Achse 0–100 und gut/schlecht-Farbe:
     - Polarisierung (`knoten(w,"polarisierung")`)
     - Protestdruck (`protestdruck`)
     - Repression (`g.repression`)

     Daneben das kleine Porträt der Innenministerin (`ministerFuer(w,"inneres")`) mit ihrem Wunsch.
   - Z4: frühere Bewegungen (heute `ges.bew.frueher`), Zugliste `o.zuege`, Kommunalwahlstand `ges.kom.stand`.
4. **Zustände:**
   - Keine Bewegung: Karte ohne Brandherde, Satz „Keine Bewegung auf der Straße“.
   - Verbotsverfahren läuft: Banner mit Entscheidungsdatum.
   - Kommunalwahl fällig (`kommunalwahlFaellig`): Hinweis mit Datum.
   - 0 Kapital: Instrumente gesperrt mit Grund (`ges.grund.kapital`).
   - Krieg und Ausnahmezustand: Instrumente mit Zusatzfolgen nach heutiger Logik.
5. **Klicks:**

   | Element | Aktion | Ergebnis | landet in |
   |---|---|---|---|
   | Instrument | Klick | Bestätigung, `oppositionInstrument(w,id)` | Opposition & Straße |
   | Porträt Opposition | Klick | Gegnerprofil (`gegnerProfil`) | Opposition & Straße |
   | Provinz mit Bewegung | Klick | Bewegungskarte mit Antworten | Opposition & Straße |
   | Antwort | Klick | `bewegungAntworten` | Opposition & Straße |
   | Rathaus | Klick | Zwangsverwalter-Karte | Opposition & Straße |
   | Provinz | Doppelklick | Provinzkarte | Land › Karte |
   | Innenministerin | Klick | Ministerakte | Kabinett |
6. **Übernommen / gelöscht:**
   - Umgebaut: ui/gesellschaft/GesellschaftAkte.tsx. Die vier Unterreiter (lage, opposition, strasse, kommunen) entfallen; Opposition wird Z1, Straße und Kommunen werden Z2.
   - Übernommen: Karte2D.
   - Gelöscht: Politische Akteure (033).
   - Hier geht der versteckte Unterreiter „Gesellschaft, Opposition, Straße“ aus 029 auf.
7. **Simulationsbedarf:** keiner. Hilfsfunktion `rathausVerluste(w)`: Provinzen, deren Rathaus seit `kommunenStart` vom Lager zur Opposition ging. Sie liest nur vorhandene Felder.
8. **Texte:**
   - „Haltung: abtrünnig (24)“ beim Oppositionsführer entfällt; dort steht „Stärke 65“.
   - Bewegungsarten mit Ikone.
9. **Abnahme:**
   - Höhe ≤ 750 px ohne Reiter.
   - Jedes Instrument mit Preis.
   - Die Zahl der Rathäuser stimmt mit `rathaeuserLager(w)` überein.
   - Tests: test/gesellschaft.test.ts unverändert. Neu test/opposition-strasse.test.tsx (Karte färbt nach `kommunenVon`, Brandherde = `bewegungsOrte`).
10. **Aufwand:** M. Vorbedingung: Karte2D im Aktenrahmen (Größe 730 × 560).

#### Gesellschaft › Wahlkampf (nur ab `WAHLKAMPF.beginnTage` = 56 Tage vor der Wahl)
1. **Frage und Erfolg:** „Wo setze ich diese Woche meine 10 Aktionspunkte ein, und lohnt sich das Duell?“ In 5 Sekunden sieht man die Punkte, die Karte mit den knappen Provinzen und das Duelldatum.
2. **Aufbau:**
   - Z1, Band (1150 × 70): Punkte, Woche, Duell, Tage bis zur Wahl.
   - Z2, Karte (760 × 520).
   - Z3, rechts (390 × 520): Versprechen, Diaspora-Touren, Duell.
   - Z4, Ticker (1150 × 60).
3. **Inhalte je Zone:** alles aus `wahlkampfSicht(w)` (sim/wahlkampf.ts:824).
   - Z1:
     - `ap`/`apMax` als zehn Münzen, `resetIn`, `tageBisWahl`.
     - Duell `duell.datum` mit Zustand `vorbereitet`.
     - Gegner `gegner` (`gegnerProfil`).
     - Bei Rolle „nachfolger“ der Nachfolger (`nachfolger.name`, `staerke`).
   - Z2, Karte2D:
     - Füllung je Provinz = Abstand zur Mehrheit aus der Umfrage je Region (`regionen` bzw. `regionenMitProvinzen()`).
     - Ein Klick auf eine Provinz zeigt `reiseVorschau(w, plaka)` (stärke, risiko, probleme, relevant, abnutzung) und `reiseKosten(plaka)` in Punkten.
     - Münze auf die Provinz ziehen oder Knopf „Reisen“ (`reise`).
     - Bereits besuchte Provinzen `reisen` mit Haken.
   - Z3:
     - Versprechen aus `versprechen` (`versprechenAngebot`, `verspreche`) mit Glaubwürdigkeit `glaubwuerdigkeit` als Leiste.
     - Diaspora: `diaspora` (beitrag, beteiligung) mit Tour-Knöpfen (`auslandstour`).
     - Duell vorbereiten (`duellVorbereiten`) mit Preis.
     - Schwachstelle `schwachstelle(w)` als Warnung.
   - Z4: `ticker` und Wirkungssumme `effekte.gesamt` mit `teile` als ⓘ.
4. **Zustände:**
   - **Vor der Phase:** keine Ansicht und kein Reiter. Stattdessen im Band von „Das Volk“: „Wahl am 5. Dezember 2030 · Wahlkampf ab 10. Oktober 2030“ (`beginntIn`).
   - In der Phase: Reiter sichtbar mit Zähler „noch {tageBisWahl} Tage“.
   - 0 Punkte: Aktionen gesperrt mit „neue Punkte in X Tagen“.
   - Publikationsverbot: Ticker ohne Umfragewerte.
   - Kommunalwahl: Sie zeigt keinen Wahlkampf, sondern nur den Hinweis in Opposition & Straße (heute gibt es keine Kampagnenmechanik dafür).
5. **Klicks:**

   | Element | Aktion | Ergebnis | landet in |
   |---|---|---|---|
   | Provinz | Klick | Reisevorschau | Wahlkampf |
   | Münze auf Provinz / „Reisen“ | Ziehen oder Klick | `reise` | Wahlkampf |
   | Versprechen | Klick | `verspreche` mit Preis | Wahlkampf |
   | Tour | Klick | `auslandstour` | Wahlkampf |
   | „Duell vorbereiten“ | Klick | `duellVorbereiten` | Wahlkampf |
   | Gegnerporträt | Klick | Gegnerprofil | Opposition & Straße |
6. **Übernommen / gelöscht:**
   - Umgebaut: ui/Wahlkampf.tsx (286 Zeilen, Abschnitte werden die Zonen; die Karte ersetzt die Provinzliste) und ui/Wahlversprechen.tsx.
   - Gelöscht: der Platzhaltertext „Der Wahlkampf steht noch bevor“ (030).
7. **Simulationsbedarf:** keiner.
8. **Texte:** „Aktionspunkte“ heißt „Wahlkampfpunkte“; Tage statt Wochen in der Countdown-Zeile.
9. **Abnahme:**
   - Der Reiter existiert nur bei `wahlkampfAktiv(w)` (sim/wahlkampf.ts:124).
   - Höhe ≤ 750 px.
   - Jede Aktion zeigt ihre Punkte.
   - Tests: test/wahlkampf.test.ts und test/wahlkampf-reisen.test.tsx anpassen (Reise über die Karte). Neu: Reiter fehlt bei `beginntIn > 0`.
10. **Aufwand:** M. Vorbedingung: Karte2D im Aktenrahmen (dieselbe wie Opposition & Straße).

---

## Fehlerliste (aus kritik-B, mit Ort und Behebung)

| Nr | Fehler | Ort | Behebung |
|---|---|---|---|
| F1 | Haushaltsrad zählt das Personal doppelt; Stücke ergeben 32,9 statt 29,2 Bio., Prozente auf falscher Basis | ui/wirtschaft/HaushaltsRad.tsx `radStuecke` (Gruppensummen ~Z. 37), `summeAussen` (~Z. 116) | wie 2.2; Test test/haushaltsrad.test.ts |
| F2 | Zustimmung 50 / 50,2 / 54 / 54,2: Leiste und Kopf zeigen den wahren Wert, die Wählerkoalition die Umfrage; das hebelt die Rohdaten-Mechanik aus | ui/Stage.tsx:429 und :699, ui/akte/Bereiche.tsx:86, sim/krisenpaket.ts `sozialeKrisenlage` (Anzeige), ui/SpeicherDossier.tsx:131 | überall `angezeigteZustimmung(w).wert`; wahr nur mit `quelle==="rohdaten"` |
| F3 | Wachstum 3,6 im Kopf gegen 4,1 in der Liste (Kopf zeigt den unveröffentlichten wahren Wert) | ui/wirtschaft/Akte.tsx:57 (`w.economy.growth`) | `aktuellerWert(w,"wachstum")`; ebenso Inflation in Zeile 56 auf den veröffentlichten Wert prüfen |
| F4 | Unter „Arbeitslosigkeit 9,7 %“ steht „Inflation: 19,2 % pro Jahr“ (und nutzt `economy.inflation`) | ui/wirtschaft/KrisenGesetze.tsx:19, Katalog `kg.inflation` (i18n/katalog/de/krisenpaket.json:70) | Unterzeile auf Trend der Arbeitslosigkeit; entfällt mit dem Umbau |
| F5 | Interne Kürzel „(Z1)“ bis „(Z5)“ im Spielertext | i18n/katalog/de/kennzahlen.json (10 Stellen, z. B. `wk.cf1d329`) | Klammern streichen; Katalogtest gegen `\(Z\d\)` |
| F6 | Behörden-Rückfallposten falsch: Gesundheitswesen `posten: "gesundheit_bildung"` → Alias auf **bildung**; Polizei und Grenzschutz `"sicherheit"` → **verteidigung**; MİT und Cyber über `RESSORT_POSTEN.praesidialamt` aus **innere_sicherheit** | data/behoerden.ts:84, 128, 173, 184, 214; sim/haushalt.ts:152 (`POSTEN_ALIAS`) | Gesundheit → `gesundheit`, Polizei und Grenzschutz → `innere_sicherheit`; Präsidialamt als offener Punkt (Frage 3); `RESSORT_POSTEN` aus `data/ministerien.ts` ableiten |
| F7 | Wahldatum im ISO-Format „2030-12-05“ | sim/waehler.ts:170 (`wahlDatum`), Ausgabe in ui/Waehler.tsx (`medien.barometer.text_*`) | `formatDateDe` beim Einsetzen |
| F8 | „Lage: ruhig“, obwohl die Opposition auf 65 gestiegen ist und 13 Rathäuser verloren sind | ui/akte/Bereiche.tsx:260–268 (Urteil nur aus drei Kopfwerten) | entfällt mit dem Umbau; bis dahin Urteil auch aus `gesellschaftLage` (opposition, rathaeuser gegen Start) |
| F9 | Fünftes Milieu (Kurden) hinter „1 weiterer Eintrag“ | ui/akte/Bereiche.tsx `lageZeilen` gesellschaft und Begrenzung in `LageAnsicht` | alle fünf zeigen; entfällt mit dem Umbau |
| F10 | „Haltung“ meint bei der Gouverneurin die Linie und auf Personenkarten die Loyalität | ui/wirtschaft/Zentralbank.tsx (`zb.haltung`), ui/akte (`PersonenListe`) | „Linie“ gegen „Loyalität“ |
| F11 | Drei Wirtschaftsminister heißen Erdem | Namensvergabe der Figuren (sim/personen.ts bzw. Startszenario) | keine doppelten Nachnamen im Kabinett, Test über alle `figuren` |
| F12 | Drei Posten exakt „1.270 Mrd. · 1,0 % BIP“ ohne Hinweis | data/haushaltsplan.ts `RESSORTS_2026` (sozialhilfe, gesundheit, innere_sicherheit `startBip: 1`) | Siegel „geschätzt“ bei `beleg === SPIEL`; Werte mit Recherche 2.3 ersetzen |
| F13 | Leiste nennt das Defizit „2,9 % Haushalt“ | Kopfleiste (ui/kopf) | Etikett „Defizit“ |
| F14 | Bilanzkurven auf Minimum bis Maximum skaliert (50–52 wirkt wie Absturz) | ui/akte/Bereiche.tsx `VerlaufAnsicht` / `VerlaufsDiagramm` | feste Achse oder Zielband; entfällt mit dem Umbau |
| F15 | Haushaltsposten und Maßnahmen zahlen dieselbe Sache doppelt (Verteidigung gegen m_verteidigung, Sozialhilfe gegen m_sozialhilfe, Subventionen gegen m_energiesubventionen und m_agrarsubventionen, Forschung gegen m_forschung, Renten gegen m_renten) | sim/haushalt.ts `POSTEN`, data/politiknetz.ts (cost), sim/netz.ts `policyCost` | keine stille Änderung; im Ministeriumsrad getrennt als „Grundetat“ und „Programm“ zeigen, Entscheidung offen (Frage 2) |
| F16 | Der Monatsbericht-Block steht doppelt (Versorgung 024 und Parlament 007) und zeigt im Frieden nur Nullen | ui/gueter/VersorgungsMonatsbericht.tsx | aus Handel entfernen, als Verlaufseintrag führen |

## Offene Fragen (höchstens fünf)
1. **Personal:** Bleibt „Öffentlicher Dienst“ nach der Recherche ein eigenes Stück (Besoldungsregler beim Finanzministerium), oder wird der Personalanteil auf die 17 Ministerien verteilt und der Regler `personal` je Ressort geteilt? Das ist eine Spielregeländerung.
2. **Doppelte Geldhebel (F15):** Sollen Haushaltsposten und gleichnamige Maßnahmen zu einem Hebel verschmelzen? Vorschlag: Der Haushaltsposten ist der Etat, die Maßnahme ist nur noch Gesetz ohne eigene Kosten. Und wohin gehört `subventionen` (Energie, Landwirtschaft oder geteilt)?
3. **Präsidialamt:** Bekommt es einen eigenen Etatträger im Rad (MİT, Cyber, Religionsbehörde, Kommunikation, Rüstungsamt), obwohl es kein Ministerium ist?
4. **Jugend und Sport, Handel:** neue Regler erst mit Quelle (Vorschlag) oder vorher als Spielparameter?
5. **Versorgungsprogramme** (schutz, energie, netz in sim/versorgungspolitik.ts) gehen als eigene Vorlagen durchs Parlament. Werden sie nach Entscheidung 2 benannte Fassungen von Maßnahmen (etwa m_lng_vertraege, m_netzausbau, m_preiskontrollen)?


---

# Anhang C: Land und Forschung & Ziele

Grundlage: Kritik C (kritik-C.md), PLAN_OBERFLAECHE_2026-11-05.md (Abschnitte 2, 3, 5), Entscheidungen W (17 Ministerien; ein Weg zum Gesetz über die Maßnahme; Karte als Bühne für Land, Außen und Sicherheit). Alle Pfade relativ zu `/home/user/NWO/game/src`. Richtwert 1440×900. Alle Größen in px sind Gestaltungsvorgaben, keine Spielzahlen. Spielzahlen kommen nur aus den genannten Funktionen. Wo sie fehlen, steht eine Datenlücke.

**Bühne für Land (gilt für Karte, Bauleiste und Katastrophen):** Die Karte (`ui/atlas/AtlasMap.tsx`) bleibt bildschirmfüllend und wird nicht mehr `sparsam` gezeichnet (Stage.tsx:810 setzt heute `sparsam={!!dossier}`; für Land, Außen und Sicherheit entfällt das). Rechts liegt ein **Seitenfenster** von 480 px Breite, 56 px unter der Kopfleiste bis 16 px über dem unteren Rand, also etwa 828 px hoch. Die linke Leiste klappt beim Öffnen von Land auf ihre Ikonenbreite (56 px) zusammen. Freie Kartenfläche: etwa 1440 − 56 − 480 = 904 px breit. Die Kamera zentriert über den vorhandenen Prop `randRechts={480}` (AtlasMap.tsx, heute nur im Prolog genutzt). Kopf des Seitenfensters: Bereichsname, drei Ansichtsreiter **Karte · Bauleiste · Katastrophen**, Schließen. Der alte Aktenkopf mit drei Kennzahlkästen und zwei Reiterzeilen entfällt für Land.

---

## A. Entscheidungen mit Begründung

### A1. Wohin die Rüstungsprojekte gehören

**Befund im Code:**
- Rüstungsprojekte sind Vorhaben des Reiches mit `bereich: "militaer"` (`data/reich/militaer.ts`: `mil_drohnen`, `mil_anadolu`, `mil_s400`, `mil_f16`, `mil_stahlkuppel`, `mil_altay`, `mil_kaan`, `mil_kaan_motor`, `mil_eurofighter`, `mil_f35`, `mil_tf2000`, `mil_huerjet`, dazu Doktrinen).
- Es gibt genau **eine** Baureihenfolge für alle Bereiche: `reichZustand(w).laufend` (sim/reich.ts:60). Alle Vorhaben teilen dieselbe `bauKapazitaet(w)` (sim/reich.ts:186), verteilt in Reihenfolge durch `bauplan(w)` (sim/reich.ts:377).
- Der Wissensbaum ist **keine eigene Welt**: Seine Knoten *sind* diese Vorhaben (data/wissensbaum.ts, Kopfkommentar; Zweig `ruestung` mit `mil_drohnen`, `mil_huerjet`, `mil_altay`, `mil_kaan_motor`, `mil_stahlkuppel`, `ki_militaer`, `meer_uwdrohnen`, `mil_kaan`, `mil_tf2000`, `meer_uboote`). `forschungsTempo(w, id)` multipliziert die Baurate (sim/reich.ts:391). Beschaffungen (`mil_f16`, `mil_eurofighter`, `mil_f35`, `mil_s400`) stehen nicht im Baum.
- Deshalb erscheint Altay heute in Forschung und in jeder Reich-Akte: `Reich.tsx:553` rendert `<Baureihenfolge>` ungefiltert in Infrastruktur, Kultur, Recht, Haushalt und Militär.

**Entscheidung:**
1. **Eine Bauleiste für das ganze Land**, als Ansicht der Akte Land. Rüstung, Netze, Kultur, Justizbauten und Reformen erscheinen dort gemeinsam, weil sie wirklich um dieselbe Kapazität konkurrieren. Wer Rüstung herausfiltert, verschweigt, warum der Wiederaufbau langsamer geht. Jede Zeile trägt ihr **Ministerium** als Abzeichen (siehe A3), Rüstung zusätzlich ein Schild-Ikon.
2. **Beginnen** werden Rüstungsprojekte in **Sicherheit › Streitkräfte & Bau** (Katalog `vorhabenListe(w, "militaer")`). Dort steht dieselbe Bauleisten-Komponente im Modus `filter="ruestung"` (gleiche Daten, gleiche Reihenfolge, nur Ausschnitt), mit dem Satz „Rüstung belegt 63 von 133 Baupunkten“ (Summe `bauplan(w)` der `militaer`-Vorhaben gegen `bauKapazitaet(w)`; die Zahlen dienen nur als Beispiel des Formats).
3. **Im Technologiebaum** bleibt der Zweig `ruestung`, weil die Entscheidungen Lizenz, Werkstandort und Schwerpunkt dort leben (sim/wissensbaum.ts: `kaufeLizenz`, `standortSichten`, `setzeSchwerpunkt`). Ein laufender Rüstungsknoten zeigt **keine eigene Restzeit**. Er zeigt „Bauleiste Platz 3 · fertig in 31 Monaten“ aus `warteschlange(w)` (`position`, `fertigIn`) und einen Knopf „In der Bauleiste zeigen“. So gibt es eine Zahl an einem Ort.
4. **Kultur, Recht und Haushalt zeigen keine Baureihenfolge mehr.** `Reich.tsx:553` entfällt dort.

**Begründung:** Eine Ressource braucht eine Warteschlange, und eine Zahl gehört an einen Ort (Leitsatz 4). Die Trennung nach Ort des Beginnens (Sicherheit) gegen Ort des Wartens (Land) entspricht der Wirklichkeit: Beschafft wird über das Präsidium der Verteidigungsindustrie (SSB, seit 2018 beim Präsidenten angesiedelt, *Quelle zu prüfen*: Präsidialdekret Nr. 1, 10.7.2018), gebaut wird mit denselben Firmen und Fachkräften wie im Zivilbau.

### A2. Wie Programme und Fokusbaum zusammenhängen

**Befund im Code:**
- **Fokus** (sim/fokus.ts): genau **einer** läuft. Er kostet Kapital und Aufmerksamkeit, dauert Tage, braucht Vorgänger, schließt **Gegenwege** aus (`ausschluesse`) und verschiebt die Richtung (Achsen, Partner, Gruppen). Er öffnet Gesetze und Knoten (`OEFFNET`, data/fokusbaum.ts:153).
- **Programme** (sim/programme.ts): **höchstens 2 Schritte** gleichzeitig (`MAX_LAUFEND = 2`). Ketten mit Bedingungen *in der Wirklichkeit* (Maßnahme auf Stufe, Problem gelöst, Inflation unter X), ohne Gegenwege und ohne Richtung, mit dauerhafter Wirkung, Rabatt (`rabattFuer`) und Schutz (`schutzFuer`).
- **Große Ziele** (sim/grosseziele.ts): höchstens 3 verfolgt (`GROSSE_ZIELE.maxVerfolgt`), Stufen mit Schwelle und gewürfeltem Versuch (`versuche`), Wege (`gipfel`, `fonds`, `kampagne`).

**Entscheidung:** Programme **gehen nicht im Fokusbaum auf**. Sie werden mit den Großen Zielen zur Ansicht **Vermächtnis** zusammengelegt. Der Fokusbaum bleibt in **Bäume** neben dem Technologiebaum.

**Begründung:**
1. Ein Einbau würde Spielregeln stillschweigend ändern: Ein Fokus läuft allein, Programmschritte laufen zu zweit; Foki schließen einander aus, Programmschritte nicht. Beides gleichzumachen ist eine Balance-Entscheidung, keine Oberflächenfrage.
2. Die Fragen sind verschieden. Der Fokusbaum beantwortet „Wohin steuere ich das Land?“ (Richtung, Verzicht). Programme und Große Ziele beantworten „Was liefere ich und was hinterlasse ich?“ (Bedingungen erfüllen, Ergebnis).
3. In der Oberfläche werden die Verbindungen sichtbar statt verschmolzen. Ein Fokus zeigt, welche Technologien und Gesetzesfassungen er öffnet (`OEFFNET`). Ein Programm zeigt, welchem Großen Ziel es dient: neues **Datenfeld** `dient?: string[]` an `Programm`, rein darstellend, ohne Wirkung. Vorschlag zur Abnahme durch den Projektinhaber: „Wasser und Energie der Zukunft“ → Energieunabhängigkeit; „Rechtsstaat und Vertrauen“ → EU-Vollmitgliedschaft und Versöhnung im Innern; „Sicherheit und Frieden“ → Ordnung im Nahen Osten; „Die Türkei in der Welt“ → Die Welt ist größer als fünf; „Starke Regionen“ → Kornkammer des Nahen Ostens. Die übrigen ohne Zuordnung. Das ist eine inhaltliche Zuordnung, keine Zahl.
4. **Ziele der Amtszeit** (sim/ziele.ts, `zielStand`) sind ein drittes Ding. Sie wandern in den Schreibtisch (dort steht `zielStand` schon, ui/schreibtisch/Schreibtisch.tsx:89) und verschwinden aus Forschung (Kopfkennzahl „Ziele erreicht 1 / 3“, Bereiche.tsx:139–140).

### A3. Ministerien in Land und Forschung (Zuordnung zu den 17)

Neue reine Funktion `ressortVon(v: Vorhaben): MinisteriumId` in einer neuen Datei `sim/ressorts.ts`. Sie leitet aus `v.bereich`, `v.thema`, `v.klasse`, Netz (`AusbauEintrag.netz`) und Zweig (`ZWEIG_VON`) ab, ohne den Katalog zu ändern. Die Zuordnung nach der Ressortverteilung der Türkei ist überall *zu prüfen* an Präsidialdekret Nr. 1 (Ministerien) und Nr. 4 (zugeordnete Einrichtungen, Cumhurbaşkanlığı Kararnamesi No. 4):

| Gegenstand im Spiel | Ministerium | Einrichtung (real) |
|---|---|---|
| Netze `strasse`, `bahn`, `hafen`, `flughafen`, `internet`; Kanal Istanbul; Bahn Kars–Tiflis; Themen `verkehr` | Verkehr und Infrastruktur | Straßenbauamt KGM, TCDD, BTK |
| Netz `strom`; Ost-West-Stromachse; Akkuyu; Gas Sakarya; Thema `energie` | Energie und Rohstoffe | — |
| Netz `wohnen`; Wohnungsbau-Vorlagen; Gebäudeverstärkung; Bauaufsicht; Thema `stadt` | Umwelt, Städtebau und Klima | TOKİ (Zuordnung prüfen) |
| Netz `wasser`; Dämme; Bewässerung; Dürre | Landwirtschaft und Forst | DSİ |
| Netz `klinik` | Gesundheit | — |
| `bereich: "kultur"`; Restaurierungen; Stätten | Kultur und Tourismus | — |
| AFAD (Behörde und Maßnahme `m_afad_ausbau`) | Inneres | AFAD (data/behoerden.ts:117 sagt schon `ressort: "inneres"`) |
| `bereich: "militaer"`, Beschaffung | Verteidigung (Nutzer) / Präsidium (SSB) | SSB beim Präsidenten (prüfen) |
| Wissensbaum außer `ruestung`; Raumfahrt; Thema `technologie`, `ki` | Industrie und Technologie | TÜBİTAK, Raumfahrtagentur TUA |
| Hochschulen, Bildungsverwaltung | Bildung | YÖK ist eigenständig; Bildung als Näherung, sichtbar benannt |
| `bereich: "recht"` | Justiz | — |
| `bereich: "haushalt"` | Finanzen | — |

Die Personen (`Figur["amt"]`) für die 17 Ressorts gehören zur Spezifikation Kabinett. Bis sie da sind, zeigt das Abzeichen nur den Ressortnamen, kein Porträt. Die fest verdrahteten `BEREICH_AEMTER.land = ["inneres","wirtschaft"]` und `.wissen = ["stab","wirtschaft"]` (Bereiche.tsx:369–370) entfallen.

### A4. AFAD doppelt (Maßnahme und Behörde)

Zwei Hebel wirken heute auf denselben Netzknoten `katastrophenschutz`: die Maßnahme `m_afad_ausbau` (data/politiknetz.ts:779, 812) und die Behörde `afad` mit Personal, Technik und Reichweite (data/behoerden.ts:117–125). Daraus ergibt sich `bereitschaft(w)` (sim/katastrophe.ts:248). **Entscheidung für die Oberfläche:** eine Zeile „AFAD“ in Katastrophen › Vorsorge. Ihr Regler ist die Maßnahme (Weg Gesetz, Entscheidung W2). Darunter klappen die drei Behördenachsen mit „Ausbauen“ und „Kürzen“ auf (`BehoerdeDetail`, ui/behoerden/Behoerde.tsx). Ob beide Mechaniken zu einer verschmelzen, ist eine Regelfrage (offene Frage 2). Bis dahin bleiben beide, aber an einem Ort.

---

## B. Ansichten

#### Land › Karte

1. **Frage und Erfolg:** „Wo im Land muss ich bauen, pflegen oder helfen, und was kostet es?“ In 5 Sekunden muss sichtbar sein: die drei schlimmsten Orte (rot markiert auf der Karte und als drei Zeilen oben im Seitenfenster), alle laufenden Baustellen als Kräne mit Fortschrittsring und die möglichen Großprojekte als gestrichelte Umrisse.

2. **Aufbau (Zonen):**
   - **K0 Karte** (Bühne, etwa 904 × 844 px): eingefärbt nach der gewählten Ebene, Marken darüber.
   - **K1 Ebenenleiste** (auf der Karte unten links, 4 Ikonenknöpfe à 56 × 56 px, Abstand 8 px): **Bauen · Netze · Kulturerbe · Gefährdung**. Bei „Netze“ erscheint daneben eine Chipreihe der 9 Netze (je 28 px hoch).
   - **K2 Kapazitätsstreifen** (unten über der Kartenbreite, 904 × 48 px): Miniatur der Bauleiste (Balken der Baukapazität, farbig je Vorhaben). Klick führt in die Bauleiste.
   - **S1 Seitenfenster-Kopf** (480 × 64 px): Reiter Karte · Bauleiste · Katastrophen.
   - **S2 „Hier brennt es“** (480 × etwa 180 px): drei Zeilen à 56 px.
   - **S3 Legende der Ebene** (480 × etwa 72 px): Farbverlauf mit Endtexten und ein Satz.
   - **S4 Drill-down-Fläche** (Rest, etwa 500 px, scrollt allein): ohne Auswahl die Zeilen „Laufend an Orten“ (höchstens 6). Mit Auswahl die **Provinzkarte** oder die **Ortkarte** (siehe 3.).
   - In der ersten Bildschirmhöhe stehen K0, K1, K2, S1, S2 und S3 vollständig. S4 beginnt sichtbar.

3. **Inhalte je Zone:**
   - **K0, Färbung je Ebene:**
     - *Bauen*: Gelände ohne Einfärbung (`ebene="gelaende"`), damit die Marken lesbar sind.
     - *Netze*: vorhandene Linse `belastung` (ui/infrastruktur/linse.ts, `belastungFarben` aus `belastungJeProvinz(w)`: höchste Auslastung aller Netze je Provinz). Mit gewähltem Netz-Chip die neue Funktion `netzFarben(w, netz)` mit `auslastung(w, netz, plaka)` (sim/infrastruktur.ts:226) und derselben Farbskala `belastungsFarbe` (grün bis 60 %, gelb bis `SCHWELLE.voll` = 0,85, rot ab 1,1; data/infrastruktur-netze.ts:54).
     - *Kulturerbe*: Linse `erbe`.
     - *Gefährdung*: Linse `risiko` (Erdbebengefährdung je Provinz über `depremRisiko(plaka)`, sim/katastrophe.ts:129, dazu Flut und Brand).
   - **K0, Marken** über `reichMarken(w, ebene)` (ui/atlas/marken.ts) mit den Arten `bau` (Kran mit goldenem Ring = `fortschritt`), `wunder` (fertiges Stück, Zustand als Farbe nach `ZUSTAND_VERFALL` 60 und `ZUSTAND_GEFAHR` 40) und `erbe`. **Neu: Art `plan`** (gestrichelter Umriss, halbtransparent) für Vorhaben mit `v.ort`, Status `verfuegbar`, und Klasse `wunder`, `grossprojekt`, `serie` oder `ausbau`. **Neu: Art `gesperrt`** (grau mit Schloss) für Status `gesperrt`. Datenquelle: neue Funktion `planOrte(w)` neben `kartenOrte(w)` (sim/reich.ts:1352) über `vorhabenListe(w, b)` für alle fünf Bereiche. `kartenOrte` bleibt unverändert, damit Tests stabil bleiben. `plan` und `gesperrt` erscheinen nur in der Ebene „Bauen“, mit `dmax` 15 wie die Stätten.
   - **K0, Neubau-Linien** aus `ui/atlas/neubau.ts` (gestrichelte Trasse, vergoldet nach Fortschritt), für `plan` zusätzlich als graue gestrichelte Trasse, wenn `v.provinzen` eine Kette ergibt.
   - **K1:** Ikonen `kran`, `strasse`, `kuppel`, `beben` (aus `ui/icons.tsx`, schon für die Linsen vergeben: `belastung`, `infrastruktur`, `erbe`, `risiko`, ui/ebenen.ts:57–62). Die Tasten folgen der globalen Linsentabelle (`LINSEN_TASTEN`, ui/linsen/linsen.ts). Keine neuen Tasten, damit es keine Doppelbelegung gibt (Plan 6: Tasten 1–4).
   - **K2:** wie Bauleiste Zone B1 in Klein. Segmente = `bauplan(w)[id] / bauKapazitaet(w)`, Rest „frei“. Farbe je Ministerium aus A3. Höhe 20 px plus Zeile „99 von 133 Baupunkten verplant · Verwaltungskraft 99 (+2 im Monat)“ (`verwaltungBilanz(w).vorrat`, `.netto` auf ganze Zahlen gerundet).
   - **S2 „Hier brennt es“:** die drei dringendsten Orte, gemischt und nach Rang sortiert:
     1. laufende Katastrophenfälle (`katastrophenZustand(w).faelle` mit `!bewaeltigt`, sim/katastrophe.ts:164);
     2. Provinzen mit Überlast `auslastung ≥ SCHWELLE.ueberlast` aus `engpaesse(w, netz, 1)` je Netz (sim/infrastruktur.ts:444);
     3. Stücke oder Stätten mit Zustand unter `ZUSTAND_GEFAHR`.

     Zeile: Ikone, „İstanbul: Straßen 109 %“, rechts der Knopf „Zeigen“. Ohne Treffer steht dort *eine* Zeile „Kein Ort über der Schwelle“. Kein Urteil „Lage: ruhig“.
   - **S3:** `legende` aus `farbenFuerEbene` (ui/ebenen.ts) bzw. `belastungFarben(w).legende`.
   - **S4 Provinzkarte** (neue reine Funktion `provinzSicht(w, plaka)` in `sim/provinz.ts`, die vorhandene Quellen bündelt):
     - Kopf: Name, Region (`PROVINZEN[plaka-1]`, `REGION_DE`, sim/regional.ts), Einwohner (ganze Tausend).
     - **Netze dieser Provinz**: 9 Mini-Balken (je 20 px hoch) mit Marke bei 100 %, aus `auslastung(w, netz, plaka)`; null heißt „kein Netz dieser Art“ und wird ausgelassen.
     - **Gefährdung**: Erdbebenrisiko 1–5 als fünf Punkte (`depremRisiko(plaka)`), Erdbebenvorsorge der Provinz (Netzknoten `erdbebenvorsorge`, Wert der Provinz), Hinweis Flut/Brand/Dürre, wenn die Provinz in `FLUT_GEBIET`, `BRAND_GEBIET` oder `DUERRE_BECKEN` (sim/katastrophe.ts) liegt.
     - **Hier im Bau / fertig**: Vorhaben mit `v.ort.plaka === plaka` oder `v.provinzen` enthält `plaka`, mit Status aus `vorhabenSicht`.
     - **Kulturerbe hier**: `ERBE.filter(e => e.plaka === plaka)` mit Zustand `z.staetten[id].zustand`.
     - **Handlungen** (je Zeile Preis am Knopf):
       - „Netz ausbauen“ je überlastetem Netz über `ausbautenFuer(netz)` und `ausbauAngebot(w, id, plaka)` mit Vorher/Nachher-Auslastung (`vorher`, `nachher`), `pk`, `monate`, `schulden`;
       - „Programm hier anlegen“ (Wohnungsbau, Schulen, Wasser) über `regionalVorschau(w, vorlageId, [plaka])` und `beginneRegional` (sim/reich.ts:1293, 1324);
       - „Restaurieren“ je Stätte über `vorhabenSicht(w, "restaurierung_"+id)`.
     - Heute steckt ein Teil davon in `ui/ProvinceCard.tsx`. Die Provinzkarte ersetzt dort den Knopf „Bauen“ (`onBauen`, Zeile 178).
   - **S4 Ortkarte** (Klick auf eine Marke):
     - **Kopf** 480 × 160 px: Bild `WunderBild` (ui/reich/WunderBild.tsx, Zustand `entwurf`, `bau` oder `fertig`), Name, Klasse (`KLASSEN_NAMEN`), Ministerium.
     - **Preis-Zeile** mit **beschrifteten** Ikonen statt nackter Zahlen: „12 Kapital · 3.200 Baupunkte · 60 Monate · 3 Verwaltung je Monat · +0,9 Pp. Schuldenquote“ aus `v.kosten`. Die Schuldenquote behält eine Nachkommastelle, weil sie kein Index ist.
     - **Wirkung**: höchstens drei Zeilen aus `effektZeile(e, "sofort", w)` (sim/reich.ts:500). Länderkürzel werden über `akteurName` ausgeschrieben (heute „GEO“, „AZE“, „RUS“).
     - **Kehrseite**: ein Satz `v.kehrseite`; Verlierer aus `v.verlierer`.
     - **Vergabe**: drei Knöpfe nebeneinander aus `vergabeAngebot(v, vergabe)` (sim/reich.ts:126), je mit pk, Baupunkten, Monaten und Vorlauf. Beginnen mit `beginne(w, id, vergabe)`.
     - **Voraussetzungen**: Häkchenzeilen aus `pruefeVoraus`, jede mit Sprungziel.
     - **Im Bau**: „Bauleiste Platz 2 · 36 Baupunkte im Monat · fertig in 16 Monaten“ aus `warteschlange(w)`, dazu die Knöpfe „Pausieren“ (`pausiere`) und „In der Bauleiste zeigen“.
     - **Fertig**: `pflegeStand(w, id)` mit Zustand, „in fünf Jahren ohne Pflege: Zustand X, es fehlt …“ (`verfall`) und „Instandsetzen“ mit Preis (`pflege`).
     - **Stätte**: Zustand, Restaurieren mit `nach.zustand`.
   - **Datenlücken:** (a) Verlauf je Provinz für Netze und Infrastruktur ist nicht gespeichert (`NetzStand` hat nur Start und jetzt). Einen Zeitregler gibt es also nicht; er bleibt Lücke, möglich über einen Monatsring in `infrastrukturMonat`. (b) Geometrie der Verwerfungslinien fehlt; `ZONEN` sind Provinzlisten (sim/katastrophe.ts:136). Mögliche Quelle: MTA, Aktive Störungskarte der Türkei (Diri Fay Haritası), Lizenz prüfen. Bis dahin färbt „Gefährdung“ nur Provinzen.

4. **Zustände:**
   - *Kein Spielstand*: Karte ohne Marken, Seitenfenster „Erst ein Spiel beginnen“.
   - *Normal*: wie oben.
   - *Katastrophe läuft*: S2 zeigt den Fall zuerst (rot), die Karte springt einmal über `ereignis` (Art `beben`) zum Ort. Der Reiter „Katastrophen“ bekommt einen roten Punkt.
   - *Krieg*: Marken in Provinzen der Front (`krieg`-Prop, `kriegsKarte`) werden blass. Hinweis in der Ortkarte: „Im Kriegsgebiet: Bau ruht“, nur wenn das Modell das so führt. Heute ist im Reich-Code keine Kriegssperre zu sehen, also ohne Hinweis; das ist eine offene Frage für Sicherheit.
   - *0 Kapital*: Knöpfe mit pk > Vorrat sind gesperrt und zeigen „fehlen 4 Kapital“ (`kannZahlen`, sim/kapital.ts).
   - *Verwaltungskraft 0*: K2 zeigt „Bau halbiert: Verwaltungskraft erschöpft“ (`verzug = 0.5` in `bauplan`).

5. **Klicks:**

| Element | Aktion | Ergebnis | landet in |
|---|---|---|---|
| Provinz | Klick | Auswahl, Provinzkarte in S4, Provinz hervorgehoben (`selected`) | S4 Provinzkarte |
| Provinz | Hover | Zeiger mit Name und `belastungZeilen(w, plaka)` (`hoverZeilen`) | — |
| Marke Kran/Wunder/Plan/Stätte | Klick | Ortkarte in S4, Kamera fährt zur Marke | S4 Ortkarte |
| Marke | Hover | Tafel aus `marken.ts` (Name, Lage, Rest, nächste Entscheidung) | — |
| Ebenenknopf (4) | Klick/Taste | wechselt die Färbung, S3 neu | K0 |
| Netz-Chip (9) | Klick | Färbung nur dieses Netzes (`netzFarben`) | K0 |
| Zeile in S2 | Klick „Zeigen“ | Kamera zur Provinz, Provinzkarte öffnet | S4 |
| K2 Streifen / Segment | Klick | wechselt zur Bauleiste, Zeile des Segments markiert | Bauleiste |
| „Bauen: Ausschreibung / Stammfirma / Sparvergabe“ | Klick | `beginne`; Marke wird Kran; Meldung mit Preis | bleibt; K2 wächst |
| „Netz ausbauen“ | Klick | `investiere(w, id, plaka, vergabe)` | bleibt |
| „Programm hier anlegen“ | Klick | `beginneRegional(w, vorlage, [plaka])` | bleibt |
| „Restaurieren“ / „Instandsetzen“ | Klick | `beginne(w, pflegeId)` | bleibt |
| „Pausieren“ | Klick | `pausiere(w, id, true)` | bleibt |
| Voraussetzung (rot) | Klick | Sprung zur Maßnahme (Politik), zum Knoten (Bäume) oder zur Behörde | Zielansicht; „Zurück“ oben links bringt hierher |
| Ministeriumsabzeichen | Klick | Ministerakte (Kabinett, Ressortrad) | Kabinett |
| × in S4 | Klick/Esc | Auswahl aufheben | S4 Grundzustand |
| Schließen Seitenfenster | Klick/Esc | Karte ohne Fenster | Karte |

6. **Übernommen / gelöscht:**
   - **Wiederverwendet:** `ui/atlas/AtlasMap.tsx` (Props `orte`, `onOrt`, `onSelect`, `hoverZeilen`, `neubau`, `randRechts`, `ereignis`), `ui/atlas/marken.ts` (erweitert um `plan` und `gesperrt`), `ui/infrastruktur/linse.ts`, `ui/linsen/*`, `ui/reich/WunderBild.tsx`, `ui/reich/Regional.tsx` (Ortswahl entfällt, der Ort ist die Provinz), `ui/reich/Pflege.tsx` (Zeilenbaustein `Zeilen`).
   - **Umgebaut:** `ui/ProvinceCard.tsx` (wird Provinzkarte im Seitenfenster statt schwebendem Blatt über der Provinz; Plan 6: „Provinzfenster verdeckt die Provinz“), `ui/reich/WunderFenster.tsx` (Inhalt wird Ortkarte).
   - **Gelöscht:** `ui/akte/Bildkarten.tsx` (die vier Karten von 034; ihr Inhalt ist die Ortkarte), `ui/infrastruktur/Netze.tsx` als Seite (die Kacheln entfallen; die Detailtexte gehen in die Provinzkarte), die Kultur-Ansicht von `ui/Reich.tsx` für `bereich="kultur"`.
   - **Gehen hier auf:** 034 Lage der Regionen, 036 Netze, 037 Kultur und Erbe, 039 Behörden (AFAD → Katastrophen), 040 Entwicklung des Landes, 041 Zuständige Minister (→ Abzeichen), 042 Bau & Umsetzung (→ Bauleiste).

7. **Simulationsbedarf:**
   - `planOrte(w)` in sim/reich.ts (neu, rein).
   - `provinzSicht(w, plaka)` in sim/provinz.ts (neu, rein, bündelt nur vorhandene Funktionen).
   - `netzFarben(w, netz)` in ui/infrastruktur/linse.ts (neu).
   - `ressortVon(v)` in sim/ressorts.ts (neu, siehe A3).
   - In `reichMarken` die Restzeit aus `vorhabenSicht(w, id).restMonate` statt `monate * (1 − p)` (marken.ts, Zweig `art === "bau"`), damit Karte und Bauleiste dieselbe Zahl zeigen.
   - `KartenOrt.art` um `plan` und `gesperrt` erweitern (AtlasMap.tsx:40) samt Zeichnung in `MarkenForm.tsx`.
   - Keine Spielregel ändert sich.

8. **Texte:**
   - Neu: „Hier brennt es“, „Bauen / Netze / Kulturerbe / Gefährdung“, „Programm hier anlegen“, „In der Bauleiste zeigen“.
   - Es entfallen: „Lage: ruhig“, „Was Sie jetzt in Auftrag geben können“, „Infrastruktur und Bau öffnen“, „Baustelle ansehen →“, „Woher die Zahlen kommen“.
   - Kopfkennzahl „Infrastruktur 60“ entfällt. Sie war in Wahrheit der Netzknoten `verkehrsnetz` (Bereiche.tsx:133).
   - Auslastung in ganzen Prozent, Zustände und Indizes ganzzahlig, Monate ganzzahlig, Schuldenquote mit einer Nachkommastelle und „Pp.“.

9. **Abnahme:**
   - Seitenfenster ohne Scrollen bis einschließlich S3 (≤ 828 px). Keine Ansicht dieser Akte länger als 1,3 Bildschirme.
   - Jede Marke führt zur Ortkarte *dieses* Vorhabens (Test: Klick auf `v:kanal_istanbul` öffnet die Ortkarte mit diesem Namen).
   - Restzeit einer Baustelle gleich in Tafel, Ortkarte und Bauleiste (Test gegen `warteschlange(w).fertigIn`).
   - „Hier brennt es“ nennt jede Provinz mit `auslastung ≥ 1,0`, wenn sie unter den drei schlimmsten ist; der Widerspruch „0 Netze überlastet“ ist ausgeschlossen.
   - Keine Ikone ohne Beschriftung in der Preiszeile; keine Länderkürzel im Text.
   - Tests anpassen: `test/karte-marken.test.tsx` (neue Arten, Restzeit), `test/linsen.test.tsx` (Netz-Chips ohne neue Tasten), `test/akte-bildkarten.test.tsx` (entfällt), `test/akte-lage.test.tsx` und `test/akte-bereiche.test.tsx` (Land ohne Lage, Behörden, Bilanz, Personen), `test/aktennavigation.test.tsx` (drei Reiter), `test/infrastruktur.test.ts` (unverändert, nur UI-Teile prüfen).
   - Neu: `test/provinzsicht.test.ts`, `test/planorte.test.ts`.

10. **Aufwand und Abhängigkeiten:** L. Vorbedingung: Entscheidung W3 umgesetzt im Gerüst (Seitenfenster-Rahmen in Stage.tsx), Behebung „Linke Leiste verdeckt Ebenenmenü“ (Plan 6). Die Zuordnung A3 braucht eine Prüfung der Dekrete. Das Porträt im Abzeichen hängt an der Kabinett-Spezifikation.

#### Land › Bauleiste

1. **Frage und Erfolg:** „Was baut das Land gerade, in welcher Reihenfolge, wann ist es fertig, und was kostet mich eine andere Reihenfolge?“ In 5 Sekunden: der Kapazitätsbalken zeigt, wer wie viel bekommt und wie viel frei ist; die oberste Zeile ist klar die, die zuerst baut.

2. **Aufbau (Zonen)** (Seitenfenster 480 px; mit dem Knopf „Breit“ 960 px über der Karte, dann zweispaltig):
   - **B1 Kapazität** (480 × 120 px): gestapelter Balken, darunter zwei Zahlen (Baupunkte verplant, Verwaltungskraft).
   - **B2 Filterchips** (480 × 36 px): Alle · Zivil · Rüstung · Pflege · Ressort ▾.
   - **B3 Warteschlange** (480 × Rest, eine Zeile 64 px; bei 8 laufenden Vorhaben 512 px): ziehbare Zeilen.
   - **B4 Verfällt** (zugeklappt, Zahl im Kopf): Bestandsstücke unter der Schwelle.
   - **B5 Neu beginnen ohne Ort** (zugeklappt): Vorhaben ohne `ort` (Reformen, Institutionen, Forschung ohne Werk, Vorlagen).
   - **B6 Vorteile** (eine Zeile Siegel, 48 px).
   - **B7 Zuletzt** (zugeklappt).
   - In der ersten Höhe: B1, B2 und mindestens fünf Zeilen von B3.

3. **Inhalte je Zone:**
   - **B1:** Gesamt `bauKapazitaet(w)` (ganzzahlig gerundet). Je laufendem Vorhaben ein Segment mit Breite `bauplan(w)[id] / bauKapazitaet(w)` und Farbe des Ministeriums (`ressortVon`). Rüstung schraffiert. Grauer Rest „frei“. Pausierte Vorhaben und solche in der Vergabephase haben Rate 0 und erscheinen nicht als Segment, sondern als Punkt unter dem Balken. Darunter: „Verwaltungskraft 99 · +2 im Monat“ aus `verwaltungBilanz(w)` (`vorrat`, `netto`), aufklappbar in `einkommen`, `bau`, `unterhalt`. Ein ⓘ erklärt, wie die Kapazität entsteht: `110 + 0,35 × m_bauindustrie + 0,25 × m_industrie_modernisierung + 0,15 × m_fachkraefteprogramm + Bestand` (sim/reich.ts:188). Das sind Spielparameter, hier nur als Satz „wächst mit Bauindustrie, Industriemodernisierung, Fachkräften“ mit Sprung zu den drei Maßnahmen. Ersetzt den zugeklappten Kasten „Was den Bau beschleunigt“.
   - **B3 Zeile** aus `warteschlange(w)` (sim/reich.ts:862) und `vorhabenSicht(w, id)`:
     - links Griff ⠿ und Platzziffer (`position`);
     - Ikone nach Klasse bzw. Ministerium;
     - Name, darunter Ressortname;
     - Fortschrittsbalken (`fortschritt`);
     - rechts „36 Bp./Monat“ (`rate`, ganzzahlig) und „fertig in 16 Mon.“ (`fertigIn`); wenn `startIn > 0`: „beginnt in 3 Mon.“; in der Vergabephase: Uhr-Ikone „Ausschreibung läuft: 2 Mon.“ (`vergabeMonate`);
     - ganz rechts „Pausieren/Weiter“.

     Die Vergabe steht **nur als kleines Ikon mit Hover** (Ausschreibung, Stammfirma, Sparvergabe; `VERGABE_NAMEN`), nicht als gelber Stempel in jeder Zeile. Kostenüberschreitung oder Scheiterrisiko (`v.ueberzug`, `v.scheitern`) als Warnpunkt mit Hover, ohne Prozentangabe, wenn nicht schon im Katalog angezeigt.
   - **B3 Ziehen:** Beim Ziehen nach oben steht am Griff „Vorziehen um 2 Plätze: 20 Verwaltungskraft · verdrängt: F-16 Block 70, Stahlkuppel“. Preis = `VORZIEHEN_VERWALTUNG × überholte Plätze` (sim/reich.ts:805). Die Vorschau der neuen Restzeiten aller Zeilen rechnet eine Kopie von `warteschlange` mit neuer Reihenfolge (neue reine Funktion `warteschlangeMit(w, reihenfolge)`). Loslassen ruft die neue Funktion `verschiebeNach(w, id, zielPosition)`. Sie prüft die Verwaltungskraft für den Gesamtpreis vorab und entspricht sonst genau n Aufrufen von `verschiebe` (gleiche Regel). Nach hinten ziehen kostet nichts (wie heute). Tastatur: Pfeil hoch/runter auf fokussierter Zeile.
   - **B2 Filter:** Zivil = `bereich !== "militaer"`; Rüstung = `"militaer"`; Pflege = Vorhaben mit `pflegt` oder Klasse `restaurierung`; Ressort nach `ressortVon`. Im Filter bleiben Platzziffern die echten Positionen (Lücken erlaubt), damit niemand meint, es gäbe getrennte Schlangen.
   - **B4 Verfällt:** `pflegeStand(w, id)` für alle `z.bestand`, sortiert nach `dringlichkeit`, die ersten 5. Zeile: Name, Zustand, „in 5 Jahren: Zustand X“ (`verfall.zustand`), Knopf „Instandsetzen · 2 Kapital · 150 Bp. · 8 Mon.“ (`pflege.v.kosten`). Der Rest steht auf der Karte (Marken mit Lage `verfallen` oder `gefahr`).
   - **B5 Neu beginnen ohne Ort:** `vorhabenListe(w, b)` für alle Bereiche, Status `verfuegbar`, ohne `v.ort`, gruppiert nach Ressort, Zeile mit Preis und „Beginnen“ (mit Vergabewahl). Vorhaben mit Ort werden hier nicht angeboten; sie beginnen auf der Karte (Leitsatz: Orte auf der Karte). Rüstungsvorhaben erscheinen hier nicht, sie beginnen in Sicherheit (A1).
   - **B6 Vorteile:** `aktiveVorteile(w)` und alle `VorteilDef` (data/reich/typen.ts) als Siegel: aktiv golden, nicht erreicht grau. Hover zeigt Bedingungen (`voraus`), Dauerwirkung und `kehrseite`.
   - **B7 Zuletzt:** `z.meldungen` und abgeschlossene `Eingriff`e (sim/reich-typen.ts:368) mit Vorher/Nachher, höchstens 5.
   - **Vorgänge** (heute Reiter 042, `VorgaengePlatz`): Wohnungsbau aus Zusagen erscheint als normale Zeile in B3 mit Siegel „versprochen bis März 2031“ aus `versprechensLage(w)` (sim/katastrophe.ts:645) bzw. den Vorgängen (`sim/vorgaenge.ts`). Kein eigener Reiter.

4. **Zustände:**
   - *Leer* (nichts im Bau): B1 ganz grau „133 Baupunkte frei“, B3 eine Zeile „Nichts im Bau. Auf der Karte bauen“ mit Sprung zur Karte, Ebene Bauen.
   - *Verwaltungskraft 0*: B1 rot gerahmt „Bau halbiert“, das Vorziehen gesperrt mit Grund.
   - *Krise*: Wiederaufbau-Zeilen aus Katastrophen mit roter Frist.
   - *Vor der Wahl*: Versprechens-Zeilen mit Frist vor dem Wahltag rot.
   - *0 Kapital*: Beginnen und Instandsetzen gesperrt mit „fehlen X Kapital“. Ziehen bleibt möglich (kostet Verwaltung, nicht Kapital).

5. **Klicks:**

| Element | Aktion | Ergebnis | landet in |
|---|---|---|---|
| Segment in B1 | Klick | Zeile in B3 markiert und sichtbar gescrollt | B3 |
| Segment | Hover | Name, Rate, Anteil | — |
| ⓘ Kapazität | Klick | Satz und drei Sprünge | Politik › Maßnahme |
| Filterchip | Klick | Filter an/aus | B3 |
| Zeile | Klick | Ortkarte (mit Ort: Kamera fährt hin; ohne Ort: Ortkarte ohne Kamera) | Karte S4 |
| Griff ⠿ | Ziehen | Preisvorschau, Restzeiten aller Zeilen live | — |
| Griff | Loslassen | `verschiebeNach`; Meldung „kostet 20 Verwaltungskraft, verdrängt …“ | B3 |
| Pfeil hoch/runter | Taste | ein Platz, gleiche Regel | B3 |
| „Pausieren/Weiter“ | Klick | `pausiere` | B3 |
| Rüstungszeile | Klick | Ortkarte mit Knopf „In Sicherheit öffnen“ | Sicherheit › Streitkräfte & Bau |
| „Instandsetzen“ (B4) | Klick | `beginne(w, pflegeId)` | B3 (neue Zeile) |
| „Beginnen“ (B5) | Klick | Vergabewahl, dann `beginne` | B3 |
| Siegel (B6) | Hover/Klick | Bedingungen; Klick springt zur ersten fehlenden | Zielansicht |
| „Breit“ | Klick | Seitenfenster 960 px | — |

6. **Übernommen / gelöscht:**
   - **Wiederverwendet aus `ui/Reich.tsx`:** die Logik von `Baureihenfolge` (Zeile 137), `ImBau`, `VorteileListe`, `Verlauf`; `ui/reich/Pflege.tsx`; `ui/reich/Neues.tsx` (wird B5); `ui/reich/Schaetzblatt.tsx` (freie Großprojekte, als Knopf „Eigenes Großprojekt schätzen“ am Ende von B5).
   - **Gelöscht:** die Mehrfachdarstellung `Reich.tsx:553` in allen Bereichen; die Unterreiter „Lage / Bauwerke pflegen / Neue Vorhaben“ (035, 037); `Bauhilfe` und `Groessen` als Blöcke (die Werte stehen in der Provinzkarte bzw. als Netzbalken); `ui/akte/Vorgaenge.tsx` als Reiter.
   - **Gehen hier auf:** 035 Infrastruktur und Bau, Baureihenfolge aus 037, 042 Bau & Umsetzung; die Baureihenfolge aus Justiz und Verwaltung (Kritik A/B).

7. **Simulationsbedarf:**
   - `verschiebeNach(w, id, ziel)` und `warteschlangeMit(w, reihenfolge)` in sim/reich.ts (neu; Regel unverändert, `VORZIEHEN_VERWALTUNG` je überholtem Platz).
   - `ressortVon` (A3).
   - Keine neue Regel.

8. **Texte:**
   - „Bauleiste“ ersetzt „Baureihenfolge“ und „Bau & Umsetzung“.
   - „Bp.“ als Abkürzung für Baupunkte mit ⓘ.
   - Es entfällt der Absatz „Die Schätzungen gelten, solange …“ (wird ⓘ am Kopf von B3) und der Stempel „TRANSPARENTE AUSSCHREIBUNG“ je Zeile.
   - Zahlen ganzzahlig.

9. **Abnahme:**
   - Die Baureihenfolge erscheint im ganzen Spiel genau einmal (Komponente); Sicherheit nutzt dieselbe mit Filter (Test: kein `Baureihenfolge`-Render in Kultur, Recht, Haushalt).
   - Ziehen um n Plätze kostet genau `n × VORZIEHEN_VERWALTUNG` und ergibt dieselbe Reihenfolge wie n Einzelschritte (Unit-Test).
   - Restzeit je Zeile = `warteschlange(w).fertigIn`.
   - Höhe bei 8 Vorhaben ≤ 828 px ohne aufgeklappte Abschnitte.
   - Tests anpassen: `test/reich-ui.test.tsx` (Baureihenfolge, Unterreiter), `test/reich.test.ts` (neue Funktionen).

10. **Aufwand und Abhängigkeiten:** M. Abhängig von A1 (Rüstung), A3 (Ressortfarben) und dem Seitenfenster-Rahmen. Sicherheit › Streitkräfte & Bau (Kritik/Spezifikation D) nutzt die Komponente.

#### Land › Katastrophen

1. **Frage und Erfolg:** „Wie gut bin ich auf das nächste Beben vorbereitet, wo droht es, und was kann ich jetzt tun?“ In 5 Sekunden: Halbrund „Bereitschaft 45 von 100“ mit Referenzmarke, die Karte färbt die Gefährdung, fünf Vorsorge-Zeilen mit Regler und Preis sind sichtbar.

2. **Aufbau (Zonen):** Die Karte färbt automatisch in der Ebene `risiko`.
   - **C1 Halbrund** (480 × 140 px).
   - **C2 Gefahren** (480 × 6 Zeilen à 44 px = 264 px).
   - **C3 Vorsorge** (480 × 5 Zeilen à 72 px = 360 px; Zeile aufklappbar).
   - **C4 Beben simulieren** (Knopf in C1 und auf der Karte unten links; öffnet über der Karte eine Leiste 904 × 160 px).
   - **C5 Laufende Fälle** (nur bei Fällen, dann ganz oben vor C1).
   - **C6 Versprechen** (zugeklappt, Zahl im Kopf).
   - **C7 Chronik** (zugeklappt).
   - Ziel: ≤ 1,3 Bildschirmhöhen bei geschlossenen Klappen (heute 3.596 px).

3. **Inhalte je Zone:**
   - **C1:** `bereitschaft(w)` (sim/katastrophe.ts:248, Landesmittel des Knotens `katastrophenschutz`), ganzzahlig, als Halbrund 0–100. Marke „Referenz“ aus dem heute angezeigten Referenzwert (Lage.tsx:46, `marke ref`). Darunter ein Satz aus `bereitSenkung(stand)` und `bereitGegenReferenz(stand)` (sim/katastrophe.ts:857, 862): „Bei einem schweren Beben etwa 20 % weniger Tote als ohne Vorsorge“. Nur ganze Prozent; die heutige Nachkommastelle entfällt.
   - **C2:** `risikoUebersicht(w)` (sim/katastrophe.ts:925): je Zeile Ikone nach `art`, Titel, „etwa 12 % in 12 Monaten“ (`jahresChance`, ganze Prozent; unter 1 % „unter 1 %“), Saison, Kennzahl (`kennzahl`: Vorsorge im Gebiet bzw. Wassermangel, mit Ampel nach `gut`). Die Provinzliste steht nicht als Text. Hover oder Klick hebt die Provinzen aus `gebiet` auf der Karte hervor, die Zeile zeigt nur „17 Provinzen · 16,6 Mio. Einwohner“ (`bevoelkerung`, eine Nachkommastelle bei Millionen).
   - **C3:** `hebel(w)` (ui/katastrophe/daten.ts, `HEBEL_IDS`: `m_afad_ausbau`, `m_fruehwarnsystem`, `m_versicherungspflicht`, `m_gebaeudeverstaerkung`, `m_bauaufsicht`). Je Zeile:
     - Name;
     - **echter Regler** Stufe 0–100, Ausgangspunkt `stufe`, vorgeschlagenes Ziel `ziel`;
     - am Regler Preis „9 Kapital · 0,012 % des BIP im Jahr“ (`pk`, `bip`; drei Nachkommastellen nur, weil der Wert so klein ist, sonst zwei) und „volle Wirkung nach 12 Monaten“ (`monate`);
     - Umsetzungsbalken, wenn `umsetzung < 100` (`restMonate`);
     - „liegt im Parlament“, wenn `imParlament`;
     - Knopf „Beschließen“ = Weg Gesetz über `bringeEin` (wie heute „Als Gesetz einbringen“, Entscheidung W2).

     Die AFAD-Zeile klappt die Behörde `afad` auf (Achsen Personal, Technik, Reichweite je 1–5, Ausbauen/Kürzen mit Preis aus `BehoerdeDetail`, dazu der Einsatz der Übung `instrument.uebung`), siehe A4. „Im Politikfenster ansehen“ entfällt; die Maßnahme ist hier dieselbe.
   - **C4:** `szenario(w, art, provinzen, staerke, staende)` (sim/katastrophe.ts:1003). Bedienung: auf der Karte eine Zone wählen (Klick auf eine gefärbte Provinz setzt `provinzen` auf die Zone aus `ZONEN`), Regler Stärke. Ergebnis als Tabelle mit drei Spalten „heute / Referenz / mit vollem Ausbau“ und den Zeilen aus `SzenarioZeile` (Tote, Verletzte, Obdachlose, Schaden). Die Rechnung steckt im Modell; die Tabelle zeigt nur dessen Zeilen. Dazu ein Wellenring über `ereignis` (Art `beben`, `kamera: false`) als Vorschau.
   - **C5:** `dossier(w).sichten` (`FallSicht`, sim/katastrophe.ts:808–846) mit `ui/katastrophe/Faelle.tsx` und `Hilfskette.tsx`. Handlungen `soforthilfe`, `zusageFestlegen`, `starteUebergang`, `beginneWiederaufbau` mit Preis am Knopf. Die Fallprovinzen sind auf der Karte rot umrandet (`marken` mit Art `krise`).
   - **C6:** `versprechensLage(w)` und `versprechensschuldMalus(w)`.
   - **C7:** Chronik der Fälle (heute Reiter „Chronik“).

4. **Zustände:**
   - *Kein Fall* (Normalfall): C5 fehlt.
   - *Fall läuft*: C5 oben, rote Marke im Ansichtsreiter, die Karte fliegt beim ersten Öffnen zum Ort.
   - *Mehrere Fälle*: C5 als Liste, jeder Fall klappbar.
   - *Vor der Wahl*: C6 offen, wenn `versprechensschuldMalus(w).punkte > 0`.
   - *0 Kapital*: „Beschließen“ gesperrt, Regler bleibt bedienbar (zeigt Preis).
   - *Gesetz im Parlament*: Regler gesperrt, Hinweis mit Sprung zur Tagesordnung.

5. **Klicks:**

| Element | Aktion | Ergebnis | landet in |
|---|---|---|---|
| Gefahrenzeile | Hover/Klick | Provinzen des Gebiets hervorgehoben, Kamera passt Ausschnitt an | Karte |
| Provinz (Ebene Gefährdung) | Klick | Provinzkarte mit Gefährdungsteil | Karte S4 |
| Regler Vorsorge | Ziehen | Preis und Wirkung live | — |
| „Beschließen“ | Klick | `bringeEin(…,"gesetz")`; Zeile zeigt „im Parlament“ | bleibt; Parlament › Tagesordnung bekommt den Eintrag |
| AFAD ▾ | Klick | Behördenachsen | C3 |
| „Ausbauen“ / „Kürzen“ (AFAD) | Klick | `baueAus` / `kuerze` (sim/behoerden.ts) | C3 |
| „Beben simulieren“ | Klick | Leiste C4 über der Karte | Karte |
| Zone auf der Karte (in C4) | Klick | Szenario neu gerechnet | C4 |
| Stärke-Regler (C4) | Ziehen | Tabelle neu | C4 |
| Fallhandlung (C5) | Klick | wie heute (Faelle.tsx) | C5 |
| Versprechen ▾ / Chronik ▾ | Klick | aufklappen | C6/C7 |

6. **Übernommen / gelöscht:**
   - **Umgebaut:** `ui/katastrophe/Lage.tsx` (Dreispalten-Raster entfällt, daher kein Überlappen mehr; `Szenario` bleibt als Logik), `ui/katastrophe/daten.ts`, `Faelle.tsx`, `Hilfskette.tsx`, `Versprechen.tsx`; `ui/Katastrophe.tsx` (innere Reiter entfallen).
   - **Gelöscht:** innere Reiterleiste „Lage und Vorsorge / Laufende Fälle / Versprechen / Chronik“ (038), die Kennzahlpillen (doppelt zum Kopf), der Scheinbalken `kr-hebel-stufen` (Lage.tsx:120–124).
   - **Gehen hier auf:** 038 und 039 (AFAD).

7. **Simulationsbedarf:** keiner für die Ansicht. Für die Karte: hervorgehobene Provinzmenge als Prop (`AtlasMap` kann heute nur `selected` für eine Provinz; neu `hervor?: number[]`). Verwerfungslinien als Datenlücke (siehe Karte).

8. **Texte:**
   - Neu: „Bereitschaft“, „Beben simulieren“, „Beschließen“.
   - Es entfällt: „Szenario: Was wäre, wenn …“ als Überschrift, „Im Politikfenster ansehen“, der Erklärabsatz zur Bereitschaft (wird ⓘ).
   - Prozente ganzzahlig, BIP-Anteile mit so wenigen Nachkommastellen wie nötig, um nicht 0 zu zeigen.

9. **Abnahme:**
   - Höhe ohne Fälle und mit geschlossenen Klappen ≤ 1,3 × 828 px.
   - Kein Text überlappt (Prüfung im Bildschirmfoto 1440×900 und 1280×800).
   - Jeder Hebel hat einen bedienbaren Regler mit Preis.
   - Ein AFAD-Hebel, nicht zwei Orte.
   - Tests anpassen: `test/katastrophe-ansicht.test.ts`; unverändert `test/katastrophe.test.ts`, `test/katastrophe-abschluss.test.ts`.

10. **Aufwand und Abhängigkeiten:** M. Abhängig von W2 (Weg Gesetz über Maßnahme, Tagesordnung im Parlament) und vom Seitenfenster-Rahmen. Prop `hervor` in AtlasMap.

#### Forschung & Ziele › Bäume

1. **Frage und Erfolg:** „Welchen Weg schlage ich als Nächstes ein (Fokus), was forsche ich (Technik), und was verbaue ich mir?“ In 5 Sekunden: Oben stehen der laufende Fokus und die laufende Forschung mit Ring und Restzeit (oder ein leuchtendes „Fokus wählen“). Im Baum leuchten nur die jetzt wählbaren Knoten golden, lesbar ohne Zoom.

2. **Aufbau (Zonen):** Vollbild über der Karte, ohne Aktenkopf (Akteninhalt 1150 × 750 px wird hier überschrieben: 1384 × 828 px).
   - **T1 Leiste** (Breite × 88 px): drei Felder à 1/3. Fokus (Ring, Name, „noch 4 Monate“) · Forschung (laufende Technik mit Ring; bei mehreren die erste plus „+1“) · Forschungsetat (Regler).
   - **T2 Umschalter** (unter T1 links, 2 Knöpfe à 160 × 36 px): **Fokus** · **Technik**. Daneben Zoom „+ − Ganz“.
   - **T3 Baum** (Breite − 380 × Rest, etwa 1000 × 700 px).
   - **T4 Detail** (rechts 380 × 700 px), leer mit Satz „Knoten wählen“.

3. **Inhalte je Zone:**
   - **T1 Fokus:** `fokusUeberblick(w)` (sim/fokus.ts:236): `aktiv` (Name `fokusName`, `lauf`, `restTage` → ganze Monate), sonst „Kein Fokus · 7 Wege offen“ (`moeglich`) als goldener, pulsierender Knopf.
   - **T1 Forschung:** `baumSicht(w)` (sim/wissensbaum.ts:276): Knoten mit `zustand === "laeuft"`. Bei Rüstung aus der Bauleiste (A1), Restzeit immer aus `warteschlange(w).fertigIn`. Tempo „×1,0“ aus `tempo.gesamt` mit einer Nachkommastelle (Faktor, kein Index).
   - **T1 Etat:** Regler über dem Haushaltsposten `forschung` (`stufeVon(w,"forschung")`, Vorschau `postenVorschau(w,"forschung",stufe)`, Setzen `setzePosten`, sim/haushalt.ts:256, 323). Am Regler: Etat in % des BIP (`forschungsBudget(w)`), Innovationsgrenze (`forschungsSicht(w, budget).grenze`), „verpufft“ (`verpufft`) rot, wenn > 0, und Kapitalpreis aus der Vorschau. Daneben die Zahl Hochschulen (Netzknoten `hochschule`, Landesmittel, ganzzahlig) mit Sprung zur Bildungsverwaltung (`BehoerdeDetail` für `bildung`, aufgeklappt in T4). Damit entfällt der Reiter Behörden (048).
   - **T3 Fokus:** `FOKI` (data/fokusbaum.ts) in 7 Ästen nach `FOKUS_AESTE_META` (data/fokus/index.ts:23; hat `farbe` und `ikone`). Status je Knoten aus `fokusSicht(w, id)` (sim/fokus.ts:192):
     - `moeglich` golden mit Glanz;
     - `laeuft` mit Ring;
     - `fertig` voll farbig mit Haken;
     - `gesperrt` blass;
     - `ausgeschlossen` grau mit Schloss und dem Namen des Gegenwegs (`durch`).

     Knoten als runde Ikone 48 px mit Beschriftung **mindestens 12 px**. Wenn der Platz nicht reicht, steht im Zoom „Ganz“ nur die Ikone, der Name im Hover. Nie wieder 5-px-Schrift. Startausschnitt: nicht der ganze Baum, sondern die Wurzeln aller 7 Äste mit ihren ersten wählbaren Stufen (die Spalten bis „erste nicht-fertige Ebene + 1“). Verbindungen: Vorgänger als Linie, Gegenwege nur beim Darüberfahren als rote gestrichelte Bögen (heute dauerhaft gekreuzt).
   - **T3 Technik:** der vorhandene Civ-6-Baum aus `ui/wissen/BaumFenster.tsx` (Zweige als farbige Bahnen, Epochen als Zeitstrahl, Symbole aus `ui/wissen/symbole.tsx`), **eingebettet statt als Portal**. Daten: `baumSicht(w).zweige` (6 Zweige aus `ZWEIGE`). Rüstungsknoten mit Schild-Ikon. Laufend zeigen sie „Bauleiste Platz 3“ (A1).
   - **Querverbindungen:** Ist ein Fokus gewählt, der Knoten öffnet (`OEFFNET[id].wissen`), zeigt T4 „öffnet in Technik: Kampfjet KAAN, Triebwerk“ mit Sprung (Umschalter wechselt, Knoten blinkt). Umgekehrt nennt ein Technikknoten die Foki, die ihn öffnen. Gesetzesöffnungen (`OEFFNET[id].gesetze`, Kennungen `gv_*`) verweisen nach W2 auf die benannte Fassung an der Maßnahme. Die Abbildung `gv_* → Maßnahme + Fassung` kommt aus der Spezifikation Parlament.
   - **T4 Fokus-Detail:** Logik und Texte aus `ui/fokus/Fokusbaum.tsx` (Zeilen 100–230): Titel, Untertitel, Preis „12 Kapital · 4 Monate · Aufmerksamkeit“ (`pk`, `monate`, `def.aufmerksamkeit`), Bedingungen als Häkchen (`bedingungen`), Folgen (`fokusFolgen`), Reaktion der Partner und Gruppen (`fokusReaktion`), Gegenwege mit Namen, Knöpfe „Beginnen“ (`beginneFokus`) bzw. „Abbrechen“ (`brichFokusAb`).
   - **T4 Technik-Detail:** `ui/wissen/Detail.tsx`: Voraussetzungen mit `sprung`, Lizenz (`lizenzgeber`, `kaufeLizenz`), Werk und Standort (`standortSichten`), Heureka (`heureka`), Preis (`beginnPreis`), „Beginnen“ (`beginneKnoten`). Schwerpunkt des Zweigs (`setzeSchwerpunkt`, Sperre `schwerpunktSperre`) als Knopf am Zweigkopf.

4. **Zustände:**
   - *Kein Fokus*: T1-Fokusfeld pulsiert, Umschalter steht auf Fokus.
   - *Fokus läuft*: wählbare Knoten bleiben golden, aber „Beginnen“ ist gesperrt mit Grund „Fokus X läuft noch 4 Monate“ (`fokusSicht.grund`).
   - *0 Kapital*: „Beginnen“ gesperrt mit Fehlbetrag.
   - *Krieg*: Foki mit Bedingung `krieg` werden wählbar bzw. gesperrt wie im Modell; Lizenzgeber im Krieg oder mit Sanktion zeigen „gesperrt“ (`partnerGesperrt`).
   - *Abwanderung*: T1 zeigt Warnung, wenn `baumSicht(w).abwanderung`.
   - *Spielende*: alles lesbar, nichts startbar.

5. **Klicks:**

| Element | Aktion | Ergebnis | landet in |
|---|---|---|---|
| T1 Fokusfeld | Klick | Umschalter Fokus, laufender oder erster wählbarer Knoten zentriert | T3/T4 |
| T1 Forschungsfeld | Klick | Umschalter Technik, Knoten zentriert | T3/T4 |
| Etat-Regler | Ziehen/Loslassen | Vorschau, dann `setzePosten` | bleibt; Haushalt gleicher Stand |
| Hochschulen | Klick | Bildungsverwaltung in T4 | T4 |
| Umschalter Fokus/Technik | Klick, Taste F/T | Baum wechselt | T3 |
| + / − / Ganz | Klick, Mausrad | Zoom | T3 |
| Astkopf / Zweigkopf | Klick | Ausschnitt auf Ast; am Zweig zusätzlich „Schwerpunkt setzen“ | T3/T4 |
| Knoten | Hover | Weg bis zum Knoten hervorgehoben, Gegenwege rot | — |
| Knoten | Klick | Detail | T4 |
| „Beginnen“ | Klick | `beginneFokus` / `beginneKnoten`; Ring erscheint, T1 neu | bleibt |
| „Lizenz kaufen (EU)“ | Klick | `kaufeLizenz` mit Preis und Rivalen-Folge | bleibt |
| Voraussetzung (rot) | Klick | Sprung: Knoten (im Baum), Maßnahme (Politik, Zielstufe), Bildung, Land (Außen) | Zielansicht, „Zurück“ |
| „öffnet in Technik: …“ | Klick | Umschalter, Knoten blinkt | T3 |
| Rüstungsknoten „Bauleiste Platz 3“ | Klick | Bauleiste, Zeile markiert | Land › Bauleiste |
| Esc | Taste | schließt Vollbild | Karte |

6. **Übernommen / gelöscht:**
   - **Wiederverwendet:** `ui/fokus/Fokusbaum.tsx` (Logik und Detail; Anordnung neu), `ui/wissen/BaumFenster.tsx` (eingebettet), `ui/wissen/Detail.tsx`, `ui/wissen/symbole.tsx`, `ui/behoerden/Behoerde.tsx` (`BehoerdeDetail`).
   - **Gelöscht:** `ui/wissen/Wissensbaum.tsx` als Kurzansicht (046; ihr Inhalt ist T1), die Lage-Ansicht von Forschung (043) samt `lageZeilen` Zweig `wissen` (Bereiche.tsx:221–241), Behörden-Reiter (048), Fortschritt (049), Forschungskabinett (050).
   - **Gehen hier auf:** 043, 044, 046, 048, 049, 050.

7. **Simulationsbedarf:** keiner an Regeln.
   - Reine Hilfsfunktion `geoeffnetVon(knotenId): string[]` (Umkehrung von `OEFFNET`) in sim/fokus.ts.
   - Ein Layout-Wert je Fokus-Knoten (Spalte = Tiefe der Vorgänger), analog zu `spalteVon` (sim/wissensbaum.ts:191), ebenfalls rein.
   - Die Abbildung `gv_*` → Maßnahme hängt an W2 (Spezifikation Parlament).

8. **Texte:**
   - „Bäume“ als Ansichtsname, Umschalter „Fokus“ und „Technik“ (statt „Wissensbaum“, der kein Baum war).
   - Es entfällt „Stand der Agenda“, „Lage: gemischt“, „Woher die Zahlen kommen“, „und 1 weitere“ (toter Text), „Forschungskabinett“.
   - Monate ganzzahlig, Tempo mit einer Nachkommastelle und „×“.

9. **Abnahme:**
   - Keine Knotenbeschriftung unter 12 px in irgendeiner Zoomstufe (Test über die berechnete Schriftgröße im Layout).
   - Die wählbaren Knoten sind ohne Zoom im Startausschnitt sichtbar (Test: alle `fokusSicht.status === "moeglich"` liegen im Startrahmen).
   - Restzeit eines Rüstungsknotens = Bauleiste.
   - Etat-Regler und Haushalt zeigen nach dem Setzen dieselbe Stufe.
   - Tests anpassen: `test/fokusbaum.test.ts` (Layout), `test/wissensbaum-ui.test.tsx` (eingebettet statt Portal, Kurzansicht entfällt), `test/akte-bereiche.test.tsx` (Forschung ohne Lage, Behörden, Bilanz, Personen).

10. **Aufwand und Abhängigkeiten:** L (Fokus-Layout neu, BaumFenster entportalisieren). Abhängig von A1 (Rüstungsrestzeit). Die Gesetzesverweise hängen an W2.

#### Forschung & Ziele › Vermächtnis

1. **Frage und Erfolg:** „Was will ich in dieser Amtszeit und darüber hinaus erreicht haben, wie groß ist die Chance, und was muss ich dafür jetzt tun?“ In 5 Sekunden: oben die belegten und freien Plätze (3 Ziele, 2 Programmschritte), darunter zehn Monumente mit Stufenring und Chance, darunter acht Programmzeilen mit dem nächsten Schritt in Grün oder Rot.

2. **Aufbau (Zonen):** Seitenfenster bzw. Akteninhalt 1150 × 750 px (Forschung ist keine Kartenbühne).
   - **V1 Sockel** (1150 × 96 px): 3 Zielsockel und 2 Programmplätze nebeneinander, je 200 × 80 px.
   - **V2 Monumente** (links 760 × etwa 300 px): 10 Medaillons à 140 × 140 px in zwei Reihen à 5.
   - **V3 Programme** (links 760 × 8 Zeilen à 48 px = 384 px).
   - **V4 Detail** (rechts 370 × 650 px), Inhalt nach Auswahl.
   - In der ersten Höhe: V1, V2 vollständig, V3 mindestens fünf Zeilen. Gesamthöhe ≤ 1,3 Bildschirme.

3. **Inhalte je Zone:**
   - **V1:**
     - Zielsockel aus `grosseZiele(w).verfolgt` (höchstens `GROSSE_ZIELE.maxVerfolgt`). Belegt: Bild und Name; frei: „Ziel hierher ziehen“.
     - Programmplätze aus `programmZustand(w).laufend` (höchstens `MAX_LAUFEND`). Belegt: Schrittname und Ring (`lauf`, `restTage` → Monate); frei: „Bereiter Schritt: 2“ (Zahl der Schritte mit Status `bereit`).
     - Kosten in Aufmerksamkeit als ⓘ (`AUFMERKSAMKEIT_KOSTEN.programmSchritt`, sim/aufmerksamkeit.ts:79).
   - **V2:** `ZIELE` aus sim/grosseziele.ts (10 Einträge; Bild `bild`, Bereich `bereich`). Je Medaillon:
     - Strichbild;
     - Name;
     - **Stufenring** mit 3 Segmenten (`stand.stufe` von `stufen.length`), das nächste Segment beschriftet beim Hover;
     - Chance als **ganze Zahl in der Mitte** aus `chanceVon(w, id).chance × 100` mit Spannweite als feiner Bogen (`von`, `bis`).

     Das Wort aus `wort` entfällt im Medaillon. „aussichtsreich“ bei 34–54 % war missverständlich; im Detail steht „34 bis 54 von 100“. Verfolgte Ziele haben einen goldenen Rand; gesperrte (`verfolgeGrund`) sind blass.
   - **V3:** `PROGRAMME` (sim/programme.ts:57, 8 Programme). Zeile:
     - Ikone;
     - Titel;
     - 5 Punkte für die Schritte (fertig gefüllt, laufend mit Ring, bereit golden, offen hohl, gesperrt grau) aus `schrittSicht(w, s)` je Schritt;
     - nächster Schritt mit seinem Status als Text: „Gefährdete Gebäude erfassen · bereit“ bzw. „Straßen und Brücken · fehlt: Autobahnbau Stufe 55 von 60“;
     - rechts „Starten · 3 Kapital · 2 Mon.“ (`kapital`, `tage` → Monate);
     - optional das Ziel-Abzeichen aus `dient` (A2).
   - **V4 Ziel-Detail:**
     - Leitsatz;
     - Stufenleiter mit Namen;
     - Schwellen als Häkchen (`schwelleSicht(w, stufe)`);
     - Dafür und Dagegen als grüne und rote Chips (`chanceVon.dafuer`, `.dagegen`);
     - Wege als drei Knöpfe mit Preis (`WEGE.gipfel/fonds/kampagne`: `pk`, `aufmerksamkeit`, `bip`; `geheWeg`, `wegGrund`);
     - Vertretungen der Partnerländer (`vertretungVon`, `vertretungAusbauen` mit `GROSSE_ZIELE.vertretungPk`);
     - Knöpfe „Verfolgen/Loslassen“ (`verfolge`) und „Versuch wagen“ (`versuche`, `versuchGrund`) mit Preis der Stufe (`pk`, `aufmerksamkeit`) und deutlichem Hinweis „Ausgang ungewiss“.
   - **V4 Programm-Detail:**
     - Leitbild;
     - alle Schritte als senkrechte Kette mit `ergebnis` je Schritt;
     - Bedingungen (`pruefeBedingung`) mit Sprung zur Maßnahme samt Zielstufe;
     - „Starten“ (`starteSchritt`) mit Preis;
     - Rabatt und Schutz, falls vorhanden (`rabatt`, `schutz` am Schritt).

4. **Zustände:**
   - *Nichts verfolgt, nichts läuft*: Sockel leer mit Hinweis „Bis zu 3 Ziele: Ziehen oder Verfolgen“.
   - *Alle Plätze voll*: „Verfolgen“ und „Starten“ gesperrt mit Grund (`verfolgeGrund`, `programm.fehler.maxLaufend`).
   - *0 Kapital*: Knöpfe gesperrt mit Fehlbetrag.
   - *Aufmerksamkeit erschöpft*: Grund aus `neuanfangGrund(w)`.
   - *Krieg*: Ziele, deren Faktoren daran hängen, zeigen den Faktor im Dagegen (aus `chanceVon`, nichts Eigenes).
   - *Versuch läuft ab / Sperrzeit*: Medaillon mit Uhr (`stand.sperreBis`).
   - *Erfolg/Scheitern*: Stempel im Medaillon für die Dauer einer Meldung.

5. **Klicks:**

| Element | Aktion | Ergebnis | landet in |
|---|---|---|---|
| Medaillon | Klick | Ziel-Detail | V4 |
| Medaillon | Ziehen auf Sockel | `verfolge(w, id, true)` | V1 |
| Sockel (belegt) | Klick | Ziel-Detail; „Loslassen“ dort | V4 |
| Programmzeile | Klick | Programm-Detail | V4 |
| „Starten“ (Zeile/Detail) | Klick | `starteSchritt`; Platz in V1 belegt | V1 |
| Schrittpunkt | Klick | Detail auf diesen Schritt gescrollt | V4 |
| Bedingung (rot) | Klick | Politik › Maßnahme mit Zielstufe | Politik, „Zurück“ |
| Weg-Knopf | Klick | `geheWeg`; Chance im Medaillon neu | V2/V4 |
| „Versuch wagen“ | Klick | Bestätigung mit Preis und Chance, dann `versuche` | V4, Meldung |
| Vertretung ausbauen | Klick | `vertretungAusbauen` | V4 |
| Ziel-Abzeichen am Programm | Klick | Ziel-Detail | V4 |

6. **Übernommen / gelöscht:**
   - **Umgebaut:** `ui/grosseziele/GrosseZiele.tsx` (Karten werden Medaillons, Logik der Knöpfe Zeilen 67–98 bleibt); `ui/Programme.tsx` und seine Unterteile (Karten werden Zeilen).
   - **Gelöscht:** die Erklärkästen „Pläne für Jahre“ und „Ziele über Jahre, bis zur Utopie“ (werden ⓘ), die zwei gestrichelten Kästen „PLATZ FREI“ (werden Sockel), „Alle 5 Schritte ansehen“ (die Punkte genügen), der Pfeil „→“ an „Als Ziel verfolgen“.
   - **Gehen hier auf:** 045 Große Ziele, 047 Programme; die Abschnitte „Ziele der Amtszeit“ und „Programmschritte in Arbeit“ aus 043 (Amtszeitziele → Schreibtisch).

7. **Simulationsbedarf:**
   - Feld `dient?: string[]` an `Programm` (sim/programme.ts:48), rein darstellend (A2).
   - Für die Bedingungstexte: Maßnahmenname plus „Stufe 55 von 60“ statt „Autobahn- und Brückenbau mindestens auf Stufe 60 (jetzt 55)“. Das ist ein Textbaustein in `pruefeBedingung`, keine Regel.
   - Keine Änderung an Chancen, Plätzen oder Preisen.

8. **Texte:**
   - „Vermächtnis“ als Ansichtsname.
   - „Ziel verfolgen“ ohne Pfeil.
   - Chance als „34 bis 54 von 100“ im Detail, ganze Zahl im Medaillon.
   - Es entfallen die Wortstufen „gering / möglich / aussichtsreich / gut“ als Hauptangabe (bleiben höchstens als Farbe).
   - Monate ganzzahlig.

9. **Abnahme:**
   - Höhe ≤ 1,3 Bildschirme (heute 2.264 und 2.657 px).
   - Jede Bedingung führt mit einem Klick zur Maßnahme.
   - Das Wort „Ziele“ bezeichnet in Forschung nur noch Große Ziele; die Kopfkennzahl „Ziele erreicht“ (Amtszeit) steht nicht mehr hier (Test auf den Kern von Bereich `wissen`).
   - Tests anpassen: `test/grosseziele.test.tsx`, `test/programme.test.ts` (Text der Bedingung), `test/akte-bereiche.test.tsx`.

10. **Aufwand und Abhängigkeiten:** M. Abhängig von A2 (Zuordnung `dient` durch den Projektinhaber) und von der Schreibtisch-Spezifikation (Aufnahme der Amtszeitziele).

---

## C. Fehlerliste (sofort behebbar, unabhängig vom Umbau)

| # | Fehler | Ort | Behebung |
|---|---|---|---|
| 1 | Alle vier Bildkarten-Knöpfe öffnen denselben Reiter statt des Vorhabens | `ui/akte/Bildkarten.tsx:68` (`onClick={oeffnen}`) | `oeffnen(id)` übergeben und das WunderFenster bzw. die Ortkarte des Vorhabens öffnen |
| 2 | „0 Netze überlastet“ zählt nur das Landesmittel, obwohl Provinzen bei 109–118 % liegen | `ui/infrastruktur/Netze.tsx:52` (`ton(x.mittel)`) | zählen, wenn ein Eintrag in `x.engpaesse` `≥ SCHWELLE.ueberlast` liegt; Text „3 Netze mit Überlast in Provinzen“ |
| 3 | Finanzierungsstufe 0 als graue Fußnote | `ui/infrastruktur/Netze.tsx:160` | als Zeile mit Regler auf den Posten `investitionen` (`setzePosten`), Preis am Regler |
| 4 | Kopfkennzahl „Infrastruktur“ ist in Wahrheit der Knoten `verkehrsnetz` | `ui/akte/Bereiche.tsx:133` | in „Verkehrsnetz“ umbenennen, bis der Kopf entfällt |
| 5 | Land-Abzeichen „4“ zählt laufende Bauten als Alarm | `ui/Stage.tsx:578` | nur offene Fälle und Fristen unter 60 Tagen zählen |
| 6 | Bilanzkurve „Zustimmung“ auf Land und Forschung, Achse 50–52 | `ui/akte/Bereiche.tsx` `verlaufsReihen` (nur `zustimmung` für `land`, `wissen`) und `VerlaufsDiagramm` | Reiter entfernen; bis dahin y-Achse mindestens ±10 Punkte um den Mittelwert |
| 7 | Feste, fachfremde Minister | `ui/akte/Bereiche.tsx:369–370` | Reiter entfernen; Zuordnung über `ressortVon` (A3) |
| 8 | Katastrophen: linke Spalte leer, Text überlappt und bricht im Wort | `ui/katastrophe/Lage.tsx:294–315` (Raster `kr-lage`/`kr-abschnitt`) und `katastrophe.css` | Raster einspaltig bis zum Umbau; `min-width: 0` und `overflow-wrap` in den Spalten |
| 9 | Scheinregler der Vorsorge | `ui/katastrophe/Lage.tsx:120–124` (`kr-hebel-stufen`) | durch einen echten Regler ersetzen oder als beschrifteten Balken „Stufe 40 → 60“ ohne Griff zeichnen |
| 10 | Baureihenfolge mit Rüstung in Kultur, Recht, Haushalt | `ui/Reich.tsx:553` | nur noch in Infrastruktur (später Bauleiste) rendern |
| 11 | Stempel „TRANSPARENTE AUSSCHREIBUNG“ in jeder Zeile | `ui/Reich.tsx` `Baureihenfolge` (ab Zeile 137) | nur während `vergabePhase`, als kleines Ikon |
| 12 | Restzeit der Kartenmarke anders gerechnet als in der Reihenfolge | `ui/atlas/marken.ts`, Zweig `art === "bau"` (`monate * (1 - p)`) | `vorhabenSicht(w, id).restMonate` (aus `warteschlange`) verwenden |
| 13 | Länderkürzel im Wirkungstext („GEO: Vertrauen +3“) | `sim/reich.ts:500` `effektZeile`, Effekt `land` | `akteurName(land)` |
| 14 | Satzbruch „Keine Einträge in Programmschritte in Arbeit.“ | `i18n/katalog/de/gestaltung.json:36` (`gz.lage.ruhig`) mit `akte.b.lage.programme` | Vorlage „Derzeit nichts bei: {abschnitte}.“ oder leere Abschnitte ganz weglassen |
| 15 | Kopfkennzahl „Ziele erreicht 1/3“ (Amtszeitziele) in Forschung | `ui/akte/Bereiche.tsx:139–140` | aus Bereich `wissen` entfernen, im Schreibtisch zeigen |
| 16 | Fokusbaum-Schrift etwa 5 px in „Ganzer Baum“ | `ui/fokus/Fokusbaum.tsx:361` (`passend()`) | Mindestmaßstab, bei dem Beschriftungen ≥ 12 px bleiben; darunter nur Ikonen |
| 17 | „aussichtsreich“ bei 34–54 % | `sim/grosseziele.ts:295` (`wort`) bzw. Anzeige in `GrosseZiele.tsx` | Zahlenspanne zeigen; Wort nur als Farbe |
| 18 | Pfeil an „Als Ziel verfolgen →“ suggeriert Navigation | `ui/grosseziele/GrosseZiele.tsx:98` | Pfeil streichen |
| 19 | Behördenkarte klickbar, aber nicht erkennbar | `ui/behoerden/Behoerde.tsx` (`BehoerdenListe`) | sichtbarer Knopf „Ausbauen“ mit Preis an der Karte |
| 20 | Gleichnamige, verschiedene Größen: „Straßen und Autobahnen 60“ (Zustand) gegen „Autobahnbau Stufe 55“ (Maßnahme) gegen „74 %“ (Auslastung) | Reich-Größen (`ui/reich/Groessen.tsx`), `sim/programme.ts` `pruefeBedingung`, Netze | Benennung je Art: „Zustand Straßennetz“, „Maßnahme Autobahnbau: Stufe“, „Auslastung Straßen“ |

## D. Offene Fragen (höchstens fünf)

1. **Zuordnung A3:** Bestätigt der Projektinhaber die Ressorttabelle? Insbesondere TOKİ (Umwelt und Städtebau oder Präsidium), GAP-Regionalentwicklung (Industrie und Technologie) und SSB (Präsidium statt Verteidigung). Recherche an den Präsidialdekreten Nr. 1 und Nr. 4 nötig.
2. **AFAD:** Sollen Maßnahme `m_afad_ausbau` und Behörde `afad` zu einer Mechanik verschmelzen (Regeländerung) oder in einer Zeile nebeneinander bleiben (diese Spezifikation)?
3. **Programme → Große Ziele (`dient`):** Ist die vorgeschlagene Zuordnung in A2 richtig, und soll sie nur anzeigen oder später auch die Chance heben (Regeländerung, braucht Kalibrierung)?
4. **Bau im Krieg:** Ruht Bau in Provinzen unter Beschuss oder Besatzung? Im Reich-Code ist dazu nichts zu sehen. Falls ja, braucht die Bauleiste eine Anzeige; falls nein, bleibt sie ohne.
5. **Verlauf je Provinz:** Sollen Netzauslastung und Infrastruktur je Provinz monatlich gespeichert werden (Spielstandgröße: 81 Provinzen × 9 Netze × Monate), damit die Karte einen Zeitregler bekommt? Ohne diese Daten bleibt „Entwicklung des Landes“ ersatzlos gestrichen.


---

# Anhang D: Außen, Sicherheit, Medien und Karte

## Grundlage und Geltung

- **Grundlage:** Kritik D (`kritik-D.md`, Bilder 051–065, k00–k-v, m01, p01), PLAN_OBERFLAECHE_2026-11-05.md (Abschnitte 2 und 3) und ENTSCHEIDUNGEN W:
  - 17 Ministerien.
  - Ein Weg zum Gesetz (die Maßnahme).
  - Karte als Bühne für Land, Außen und Sicherheit.
- **Pfade:** Alle Pfade gelten relativ zu `/home/user/NWO/game/src`, außer `test/…` (relativ zu `/home/user/NWO/game`).
- **Richtwerte:** 1440×900 px, Kopfleiste 56 px.

**Was ENTSCHEIDUNGEN W für diesen Teil heißt:**

| Entscheidung | Folge hier |
|---|---|
| 17 Ministerien | Außen gehört zum **Ministerium des Äußeren** (Figur-Amt `aussen`). Sicherheit hat zwei Ressorts: **Verteidigung** (neues Amt, siehe Simulationsbedarf) und **Inneres** (Polizei und Gendarmerie, Grenzschutz). MİT und Cyberabwehr stehen in `data/behoerden.ts` heute unter `ressort: "praesidialamt"`. Sie bleiben dort, weil sie kein Ministerium sind; die Anzeige lautet „untersteht dem Präsidenten“. Medien haben kein Ministerium. Zuständig sind Präsidialamt (Amt `stab`) und Inneres. Die Rundfunkaufsicht ist keine Figur (offene Frage 4). |
| Ein Weg zum Gesetz | Jeder Regler in diesen Ansichten ist eine **Maßnahme** aus `data/politiknetz.ts`. Gestellt wird über dieselbe Zeile wie in der Maßnahmentafel (`ui/politik/MassnahmenTafel.tsx` mit `pruefeVorhaben`, `bringeEin` in `sim/handeln.ts`). Es gibt keinen eigenen Gesetzesweg und keine Sonderregler. |
| Karte als Bühne | Außen, Sicherheit (und Land, Teil C) öffnen als **Seitenakte rechts neben der lebenden Karte** (Ansicht 1). Medien bleiben eine Papierakte über der Karte, weil sie kein Ort sind. |

**Ansichten dieses Teils:** 1 Bühne › Seitenakte (Architektur) · 2 Außen › Welt · 3 Außen › Länderkarte (Drill-down) · 4 Sicherheit › Lagekarte · 5 Sicherheit › Streitkräfte & Bau · 6 Medien › Medien · 7 Karte › Acht Linsen · 8 Karte › Tasten, Zeit, Pause · 9 Karte › Provinzkarte · 10 Karte › Ebenenordnung. Danach folgen Fehlerliste und offene Fragen.

---

#### Bühne › Seitenakte (Architektur, gilt für Außen, Sicherheit und Land)

1. **Frage und Erfolg**
   - **Frage:** „Wo auf der Karte passiert das, worüber ich gerade entscheide?“
   - **Erfolg:** Bei offener Akte Außen oder Sicherheit bleibt ein zusammenhängendes Kartenfeld von mindestens 760 × 740 px sichtbar und bedienbar (klicken, ziehen, zoomen). Jede Auswahl in der Akte bewegt die Karte und umgekehrt, ohne dass die Akte schließt.

2. **Aufbau (Zonen) bei 1440×900**

   | Zone | Lage | Größe | Inhalt |
   |---|---|---|---|
   | K | oben | 0–56 px | Kopfleiste (unverändert) |
   | M | unter der Kopfleiste | 60–96 px | Meldungschips, links ab x = 80 |
   | N | links | x 12–64 | Navigation als **Symbolleiste** (48-px-Knöpfe, Namen beim Darüberfahren). Sie klappt automatisch ein, solange eine Seitenakte offen ist. Die heutige Breite 200 px gilt nur ohne Seitenakte. |
   | B | Mitte | x 76–864, y 60–900 | **Bühne**: die Karte mit der Linse der Akte |
   | L | unten in der Bühne | x 76–864, y 836–888 | Linsenleiste (Ansicht 7) |
   | S | rechts | x 872–1428, y 64–888 | **Seitenakte**, 556 px breit, eigener Bildlauf |

   - **Breiten:** Zwischen 1100 und 1365 px Fensterbreite ist S 40 vw breit (mindestens 440 px). Unter 900 px wird S ein Bodenblatt mit 55 % der Höhe; die Karte bleibt darüber sichtbar (heutiges Handy-Verhalten der `.dossier`, nur von unten).
   - **Erste Bildschirmhöhe von S:** Aktenkopf mit Titel, 3 Kennzahlen und Porträt (≤ 96 px), danach der Inhalt der Ansicht. Die Seitenakte hat keine Reiter. Die Zugänge der Akte (heute `zugaenge` in `ui/akte/Akte.tsx`) stehen als 2–3 Umschalter im Kopf.

3. **Inhalte je Zone und Technik**
   - **Stage:** `ui/Stage.tsx` Zeile 902–1140 rendert heute jede Akte als `<section className="dossier frame …">` über der Karte (`styles.css` Zeile 241: `left: 86px`, `z-index: 50`, `.wide` = `min(1160px, 100vw − 110px)`). Neu:
     - Eine Tabelle `BUEHNEN: Partial<Record<BereichId, BuehnenDef>>` in einer neuen Datei `ui/buehne/buehnen.ts`.
     - Eintrag `aussen` → Linse `welt`, Kamera „Weltausschnitt“.
     - Eintrag `sicherheit` → Linse `lage` (neu, Ansicht 7), Kamera „Schauplatz des schwersten Konflikts“ aus `SCHAUPLATZ_NACH_LAND` (data/schauplaetze.ts) oder, ohne Konflikt, die Türkei (`START_D = 15`, ui/atlas/AtlasMap.tsx Zeile 140).
     - Eintrag `land` → Linse `bau` (Teil C).
     - Ist `gruppe.akte` in `BUEHNEN`, rendert Stage statt `<section className="dossier">` ein `<aside className="seitenakte">` mit demselben Kind (`BereichsAkte` aus `ui/akte/Bereiche.tsx` im Modus `seite`).
   - **Linse beim Öffnen und Schließen:** `oeffneDossier` (Stage.tsx Zeile 666) merkt sich vor dem Öffnen die laufende Linse (`ebeneVorher`) und setzt `setEbene(BUEHNEN[b].ebene)`. Beim Schließen setzt es `ebeneVorher` zurück.
   - **Karte bleibt lebendig:** `AtlasMap` bekommt `sparsam={!!dossier && !istBuehne}` (heute Stage.tsx Zeile 810: `sparsam={!!dossier}`).
   - **Sichtrand:** Neue Eigenschaft `sichtRand={{ links, oben, rechts, unten }}` an `AtlasMap` und `Karte2D`. Damit zentriert `starteFlug` (AtlasMap.tsx Zeile 512) auf die Mitte des freien Feldes statt auf die Fenstermitte. Heute wird das von Hand verschoben (Stage.tsx `waehleTransport`: `lon + 2`); diese Verschiebung entfällt. `UI_SPERREN` (AtlasMap.tsx Zeile 144) bekommt `.seitenakte`, damit Beschriftungen ausweichen.
   - **Klicks auf der Karte bei offener Seitenakte:**
     - Provinzklick öffnet die Provinzkarte in Zone B (Ansicht 9).
     - Länderklick (`onLand`) öffnet bei Außen die Länderkarte **in S** statt des schwebenden `LandPopover` (Stage.tsx Zeile 1295). Bei anderen Akten bleibt das Popover.
     - Klick auf eine Konflikt- oder Zielraumfläche wählt bei Sicherheit den Konflikt in S.
   - **2D-Ersatzkarte:** `ui/atlas/Karte2D.tsx` bekommt heute nur `fill`, `selected`, `laenderFarben`, `onLand` und `krieg` (AtlasMap.tsx Zeile 1335). Für die Bühne braucht sie zusätzlich:
     - `labels` (Provinznamen ab der Breite, die das freie Feld erlaubt).
     - `laenderPins` (LAND_PINS, ui/ebenen.ts Zeile 459).
     - `linien`, `ringe` und `sichtRand`.
     - `rahmen` für den Weltausschnitt. Datenlücke: `data/nachbarn.json` endet bei 17,5–52,5° O und 29–48° N (Karte2D.tsx Zeile 19). Für den Weltausschnitt in 2D fehlen Ländergrenzen. Mögliche Quelle: dieselbe Weltgeometrie wie die 3D-Karte (`public/data/karte/karte-W0.bin`/`W1.bin`, Format prüfen) oder Natural Earth 1:110m (gemeinfrei). Bis dahin zeigt 2D ferne Mächte nur als Flaggenleiste (Ansicht 2, Zone B3).

4. **Zustände**
   - **Ohne Spiel** (`!w.spiel`): Es gibt keine Seitenakte, die Navigation zeigt die Bereiche gesperrt (wie heute).
   - **Normal:** wie oben.
   - **Ereignisfenster offen:** Die Seitenakte bleibt stehen, das Fenster liegt darüber (Ebene 80, Ansicht 10).
   - **Krieg:** Die Sicherheit öffnet direkt im Kriegsplan (Ansicht 4, Zustand Krieg).
   - **Handy:** Bodenblatt; die Karte reagiert über dem Blatt.

5. **Klicks**

   | Element | Aktion | Ergebnis | landet in |
   |---|---|---|---|
   | Navigation: Außen, Sicherheit, Land | Klick | Seitenakte öffnet; Linse und Kamera wechseln; Zeit hält an (wie heute `beendeZeit` in `oeffneDossier`) | S + B |
   | Navigation: anderer Bereich | Klick | Seitenakte schließt; Papierakte öffnet | Vollakte |
   | × in der Seitenakte / Esc | Klick / Taste | schließt; Linse kehrt zu `ebeneVorher` zurück | Karte |
   | Karte ziehen oder zoomen | Maus | Die Karte bewegt sich, die Akte bleibt | B |
   | Eintrag in S, der einen Ort hat | Klick | Die Kamera fliegt hin (`setKamera`), der Ort pulsiert 2 s | B |

6. **Übernommen / gelöscht**
   - **Umgebaut:** `ui/Stage.tsx` (Dossier-Block Zeile 902–1140, `oeffneDossier`, Linsenwechsel), `ui/akte/Akte.tsx` (Modus `seite`: kein Reiterband, Kopf ≤ 96 px), `ui/navigation/RegierungsNavigation.tsx` (Modus `eng`).
   - **Neu:** `ui/buehne/buehnen.ts` und `ui/buehne/seitenakte.css`.
   - **Gelöscht für die Bühnen-Akten:** die Pflichtreiter `lage`, `verlauf`, `personen` (`BereichsAkte`, Bereiche.tsx Zeile 433–451). Für die übrigen Bereiche regelt das Teil A/B.

7. **Simulationsbedarf:** keiner (rein Oberfläche).

8. **Texte**
   - Neu: „Zur Karte“ (Handy-Umschalter).
   - Entfallen: „Lage“, „Bilanz & Hintergrund“ und „Diplomatie & Dienste“ als Reiternamen.

9. **Abnahme**
   - Mit offener Seitenakte bei 1440×900 sind ≥ 760 × 740 px Karte frei und klickbar.
   - Der Provinzklick funktioniert (Test: ein neuer `test/seitenakte.test.tsx` prüft, dass `onSelect` bei offener Akte `aussen` die Provinzkarte rendert und `.seitenakte` nicht über der Karte liegt).
   - `test/aktennavigation.test.tsx` und `test/regierungsnavigation.test.tsx` werden an den Modus `eng` angepasst.
   - `test/karte2d.test.tsx` prüft die neuen Eigenschaften `labels`, `laenderPins` und `linien`.

10. **Aufwand und Abhängigkeiten:** **M**. Vorbedingung für die Ansichten 2–5 und Teil C (Land). Keine Recherche nötig außer der Weltgeometrie für 2D.

---

#### Außen › Welt

1. **Frage und Erfolg**
   - **Frage:** „Wer ist mir gut, wer ist mir feind, und wo muss ich jetzt handeln?“
   - **Erfolg:** In 5 Sekunden nennt der Spieler die zwei Länder mit dem größten Konflikt und das Land mit der dringendsten Forderung. Beides ist auf der Karte farbig markiert und steht oben in der Seitenakte.

2. **Aufbau (Zonen)**

   | Zone | Ort | Größe | Inhalt |
   |---|---|---|---|
   | B1 | Bühne | ganzes freies Feld | Weltausschnitt (Lissabon bis Kasachstan, Moskau bis Rotes Meer) |
   | B2 | Bühne | Linien über der Karte | Beziehungsnetz |
   | B3 | Bühne, oben am rechten Rand vor S | 72 px breit | Leiste „Ferne Mächte“: USA, China, Indien, Brasilien, Indonesien, Südafrika, Äthiopien |
   | B4 | Bühne, unten links über der Linsenleiste | ≤ 300 × 90 px | Legende |
   | S1 | Seitenakte | 96 px | Aktenkopf |
   | S2 | Seitenakte | 40 px | Ticker „Vorwarnungen“ |
   | S3 | Seitenakte | ≈ 330 px | **Brennpunkte**: höchstens 5 Zeilen |
   | S4 | Seitenakte | ≈ 260 px | **Stellgrößen**: 4 Zeilen mit Regler |
   | S5 | Seitenakte, zugeklappt | — | „Blöcke und Vermittlung“, „Energie und Flucht“ |

   In der ersten Bildschirmhöhe stehen S1–S4 vollständig. Mit gewähltem Land ersetzt die Länderkarte (Ansicht 3) S2–S5.

3. **Inhalte je Zone**
   - **B1 Weltausschnitt:**
     - Kamera-Abstand zwischen `START_D = 15` und `MAX_D = 220` (AtlasMap.tsx Zeile 140–143). Den Wert in der Umsetzung so kalibrieren, dass Brüssel (LAND_PINS `EU` 4,3° O) und Aserbaidschan (49,9° O) im freien Feld liegen.
     - Färbung: `laenderFarben(w)` (ui/ebenen.ts Zeile 438) mit `beziehungsFarbe(vertrauen, konflikt)` aus `beziehungZurTuerkei(w, id)` (sim/welt-modell.ts Zeile 434).
     - Die Türkei selbst bleibt neutral, nur die Grenze wird betont.
     - Flaggen: `laenderPins` (Stage.tsx Zeile 368, `LAND_PINS`, 41 Akteure) mit `ton` nach Vertrauen (≥ 55 gut, ≥ 35 mittel, sonst schlecht). Diese Schwellen sind heute in Stage.tsx fest verdrahtet; in `ui/ebenen.ts` neben `BEZIEHUNG_FARBEN` zusammenführen.
   - **B2 Beziehungsnetz:** neue Eigenschaft `linien` an AtlasMap, gezeichnet in der Effektschicht `ui/atlas/fx.ts` wie `kriegsfx.ts`, also gebogene Linien zwischen LAND_PINS und Ankara.
     - **Vertrag:** Goldlinie, Strichstärke 2 px. Quelle `alleLaufenden(w)` (sim/abkommen.ts Zeile 59), Feld `land`.
     - **Konflikt:** rote Linie, Stärke 1–5 px. Zuerst `kriegMit(w, id)?.eskalation` (sim/krieg.ts Zeile 193), sonst `weltZustand(w)[id].konflikt` (sim/laender.ts Zeile 358), angezeigt ab `ANGESPANNT_AB = 50` (ui/akte/Konfliktlage.tsx Zeile 10; die Konstante wandert nach `sim/krieg.ts` neben `KRISE_AB = 55`, damit Karte und Liste dieselbe Schwelle haben).
     - **Sanktion gegen die Türkei:** rote Strichlinie mit Schloss-Symbol. Quelle `aussenZustand(w).sanktionen` (sim/diplomatie.ts Zeile 70, Feld `von`); `breiteSanktionVon` aus sim/sanktion-art.ts entscheidet „breit“ oder „gezielt“.
     - **Eigene Sanktion:** graue Strichlinie. Quelle `aussenZustand(w).eigeneSanktionen`.
     - **Fremdkonflikt** (Ukraine–Russland, Israel–Iran): graue gekreuzte Klingen zwischen den beiden Hauptstädten mit Zahl „Intensität 80“. Quelle `vermittlungen(w)` (sim/abkommen.ts Zeile 547) aus `KONFLIKTE` (data/konflikte.ts). Ein Klick öffnet die Vermittlung in S.
     - **Initiative eines Landes:** pulsierender Ring um die Flagge. Quelle `initiativeGegen(w, id)` (sim/initiative.ts Zeile 348).
   - **B3 Ferne Mächte:** Flaggen der LAND_PINS mit Längengrad < −10° oder > 60°, je mit Vertrauen als Ring und der Zahl. Ein Klick wählt das Land, als würde man es auf der Karte anklicken.
   - **B4 Legende:** Farbstufen aus `BEZIEHUNG_FARBEN` (Partner, Nüchtern, Kühl/Angespannt, Feindselig) und vier Linienarten. Sie folgt aus `farbenFuerEbene(w, "welt")` und erscheint automatisch mit der Linse (heute nur hinter „Marken auf der Karte ?“).
   - **S1 Aktenkopf:**
     - **Ansehen:** `knotenKern(w, "ansehen")` als ganze Zahl mit Sparkline über 12 Monate. Datenlücke: Für Knoten gibt es keine Monatsreihe im Spielstand (`verlaufsReihen` in Bereiche.tsx liefert nur die Zustimmung). Neu: `w.spiel.verlauf.knoten[id]` als Monatsreihe (Simulationsbedarf).
     - **Vertrauen der EU:** `vertrauenZu(w, "EU")` (sim/laender.ts Zeile 373).
     - **Laufende Verträge:** `alleLaufenden(w).length`.
     - **Porträt Ministerium des Äußeren:** `sp.figuren.find(f => f.amt === "aussen" && f.imAmt)` mit Loyalitätsring. Ein Klick öffnet die Ministerakte (Teil B, Kabinettstisch).
   - **S2 Ticker:** `vorwarnungen(w)` (sim/diplomatie.ts Zeile 741) und `weltNachrichten(w, seitTag, 6)` (sim/welt-modell.ts Zeile 1107). Er läuft als eine Zeile; ein Klick auf eine Meldung mit Land wählt das Land. Hormus mit Preis: „Hormus geschlossen · LNG-Anteil 38 % · Versorgung 100“ aus `aussenZustand(w).energie` (`hormus`, `anteile.LNG`, `versorgung`). Den Preisaufschlag in Lira gibt es im Zustand nicht. Datenlücke: Ein Gaspreis-Aufschlag müsste aus sim/wirtschaft-*.ts kommen; bis dahin kein Lira-Betrag.
   - **S3 Brennpunkte:** höchstens 5 Zeilen, sortiert nach Dringlichkeit = max(Konflikt, offene Initiative mit Frist, unerfülltes Anliegen mit Frist).
     - Je Zeile: Flagge, Name (`akteurName`), `haltungWortAlle(w, id)` (sim/welt-sicht.ts Zeile 67), „Vertrauen 28 · Konflikt 53“ als ganze Zahlen aus `beziehungZurTuerkei`.
     - Dazu ein Symbol für den Grund: Schwert = Konflikt, Brief = Initiative, Haken = Anliegen.
     - Rechts eine Zahl der offenen Anliegen (`anliegenStand(w, id).filter(a => !a.erfuellt).length`, sim/laender.ts Zeile 408).
     - Bei laufendem Konfliktvorgang zusätzlich die Phase als Stempel (`PHASEN_NAME[k.phase]`).
   - **S4 Stellgrößen:** 4 Zeilen, jede als `MassnahmeZeile` aus `ui/politik/MassnahmenTafel.tsx` (Regler, Stufenname, Preis aus `pruefeVorhaben`, Wirkung, Knopf „Einbringen“ über `bringeEin` mit Weg Gesetz oder Erlass).
     1. `m_eu_annaeherung` „Annäherung an die EU“ (data/politiknetz.ts Zeile 935). Marke am Regler: die EU-Forderung „mindestens 55“, wenn ein EU-Anliegen mit `art: "massnahme"` darauf zeigt (aus `anliegenStand(w, "EU")`).
     2. `m_grenzschutz` „Grenzschutz“ (Zeile 934).
     3. `m_rueckkehr` „Rückkehrprogramm für Geflüchtete“ (Zeile 932). Neben dem Regler stehen „Geflüchtete 2,20 Mio. · Kosten 0,55 % des BIP im Jahr“ aus `aussenZustand(w).flucht.bestand` und `.kostenJahr`, als Mio. mit zwei Nachkommastellen bzw. % des BIP mit zwei.
     4. **Diplomatischer Dienst** (Behörde `diplomatie`, data/behoerden.ts Zeile 150): drei Punktbalken (Personal, Technik, Reichweite) aus `stand(w, "diplomatie")` (sim/behoerden.ts Zeile 67). Dazu die Knöpfe „Ausbauen“ und „Kürzen“ mit Preis aus `vorschau(w, id, achse)` (Zeile 204) bzw. `KuerzVorschau` (Zeile 245). Der Etat-Spielraum kommt aus `etatSpielraum(w, "aussen")` (Zeile 123). Datenlücke: der Etat des Dienstes in Lira, siehe PLAN Abschnitt 4 (Zentralhaushalt 2026, Tabelle A).
   - **S5 aufklappbar:**
     - „Blöcke“: `institutionenVon("TUR")` und `institutionSicht(w, id)` (sim/welt-bloecke.ts Zeile 151/251). Die Mitgliederzahl ist `mitglieder.length + weitereMitglieder` (data/welt-institutionen.ts, z. B. NATO 14 + 18 = 32).
     - „Vermittlung“: Liste aus `vermittlungen(w)` mit Knopf `vermittle` (Preis aus der Sicht).
     - „Energie und Flucht“: Lieferanteile als Kreis aus `energie.anteile` (Russland, Aserbaidschan, LNG, Iran, Heimisch) und Fluchtzahlen.

4. **Zustände**
   - **Leer** (Spielbeginn ohne Konflikt ≥ 50): S3 zeigt „Keine Spannung über 50“ und darunter die drei Länder mit dem geringsten Vertrauen.
   - **Krise** (Hormus geschlossen, Sanktion neu): Der Ticker steht rot, die betroffene Linie pulsiert.
   - **Krieg:** Die Konfliktlinie zum Gegner wird zur Frontlinie (Ansicht 4). S3 zeigt den Krieg als erste Zeile mit dem Knopf „Zur Lagekarte“, der zur Sicherheit wechselt.
   - **Vor der EU-Wahl oder einer Wahl im Partnerland:** Das Land bekommt eine Wahlurne an der Flagge (`wahlSicht(w, id)`, sim/welt-sicht.ts Zeile 93), aber nur ≤ 6 Monate vor dem Termin (heute steht die Europawahl 53 Monate vorher als großer Kasten).
   - **0 Kapital:** Regler und Knöpfe bleiben sichtbar. Der Preis steht rot mit Grund aus `pruefeVorhaben` bzw. `aktionenFuer` („Kapital fehlt“); es gibt keinen ausgegrauten Knopf ohne Grund.

5. **Klicks**

   | Element | Aktion | Ergebnis | landet in |
   |---|---|---|---|
   | Land auf der Karte / Flagge / Ferne-Mächte-Leiste | Klick | Land gewählt, Kamera fliegt hin, Länderkarte | S (Ansicht 3) |
   | Land | Darüberfahren | Kärtchen: Name, Haltung, Vertrauen, Konflikt, Verträge | B |
   | Konfliktlinie | Klick | Länderkarte im Abschnitt Konflikt | S |
   | Fremdkonflikt-Klingen | Klick | Vermittlung dieses Konflikts aufgeklappt | S5 |
   | Brennpunkt-Zeile | Klick | wie Land | S |
   | Ticker-Meldung | Klick | Land wählen oder, ohne Land, Meldung aufklappen | S |
   | Regler S4 | Ziehen | Vorschau von Preis und Wirkung (`pruefeVorhaben`) | S4 |
   | „Einbringen“ | Klick | `bringeEin`; die Meldung erscheint im Eingang | Schreibtisch-Eingang (Teil A) |
   | Ausbauen / Kürzen (Dienst) | Klick | `baueAus` / Kürzung mit Preis | S4 |
   | Porträt Außenminister | Klick | Ministerakte | Kabinett (Teil B) |
   | Esc | Taste | erst die Länderwahl lösen, dann die Akte schließen | — |

6. **Übernommen / gelöscht**
   - **Übernommen:** `laenderFarben`, `LAND_PINS` und `beziehungsFarbe` (ui/ebenen.ts), `ui/welt/Block.tsx` (als S5-Inhalt), `ui/welt/Vermittlung.tsx` (S5), `MassnahmeZeile` (ui/politik/MassnahmenTafel.tsx).
   - **Umgebaut:** `ui/Welt.tsx` wird zur Steuerung der Seitenakte. Liste, Filterchips und Suchfeld entfallen; die Suche bleibt als Tastatur-Schnellwahl `/` in S1.
   - **Gelöscht:**
     - Der Reiter „Weltlage“ mit Kacheln (Bild 051): `ui/welt/Aussenlage.tsx` in eingebetteter Form und `WeltLage.tsx` als eigener Reiter. Was bleibt, wandert nach S2/S5.
     - „Behörden“ (053), „Diplomatische Bilanz“ (054), „Diplomatie & Dienste“ (055).
     - Die Unterreiter „Staaten / Blöcke / Dienst / Vermittlung“ (052).
     - Der Knopf „Länder und Diplomatie öffnen“.
   - **Wandert nach Sicherheit:** Terror (`aussenZustand.terror`) und Friedensprozess (`friedens`, Maßnahme `m_friedensprozess`, Zeile 835).

7. **Simulationsbedarf**
   - Monatsreihe der Knoten `ansehen` und EU-Vertrauen im Spielstand (z. B. `sp.verlauf.knoten: Record<string, number[]>`, je 36 Monate). Ohne sie gibt es keine Sparkline.
   - Eine Funktion `brennpunkte(w): { id; grund: "konflikt" | "initiative" | "anliegen"; dringlichkeit: number }[]` in `sim/welt-sicht.ts` (rein lesend). Die Rangregel ist neu: Sie ordnet nur die Anzeige und ändert keine Spielregel.
   - `ANGESPANNT_AB` nach `sim/krieg.ts` verlegen (heute in ui/akte/Konfliktlage.tsx).
   - Zuordnung zu den 17 Ministerien: Maßnahmen `m_eu_annaeherung` und `m_handelssysteme` → Äußeres bzw. Handel; `m_grenzschutz` → Inneres; `m_rueckkehr` und `m_integration` → Inneres (Präsidium für Migration). Diese Zuordnung als Feld `ministerium` an `m(...)` in data/politiknetz.ts führt Teil B ein. Hier wird sie nur gelesen, für das Porträt neben dem Regler.

8. **Texte**
   - Neu: „Welt“ (Ansichtsname), „Brennpunkte“, „Ferne Mächte“, „Stellgrößen“.
   - Entfallen: „Lage: angespannt“ und „Auffällig: …“; „Die Staatsführungen“ (stattdessen Porträt in der Länderkarte); „Instrumente“ als Wort.
   - Zahlen: Vertrauen und Konflikt als ganze Zahlen ohne „/ 100“; Geflüchtete in Mio. mit zwei Stellen; Anteile in ganzen Prozent.

9. **Abnahme**
   - S1–S4 passen ohne Bildlauf in 824 px.
   - Kein Wert steht zweimal (Ansehen und EU-Vertrauen nur im Kopf).
   - Jeder Regler zeigt Preis und Wirkung.
   - NATO zeigt 32 Mitglieder.
   - Klick auf USA in der Ferne-Mächte-Leiste öffnet die Länderkarte USA.
   - Tests: `test/aussenlage-ui.test.tsx` wird auf die neue S-Struktur umgeschrieben; `test/karte-welt.test.ts` prüft `linien` (Vertrag, Konflikt, Sanktion); neuer Test „Brennpunkte sortiert, höchstens 5“.

10. **Aufwand und Abhängigkeiten:** **L**. Vorbedingung: Ansicht 1 (Seitenakte), `linien` in fx.ts und Karte2D, Teil B (Feld `ministerium`) nur für die Porträts. Recherche: Weltgeometrie 2D (Ansicht 1).

---

#### Außen › Länderkarte (Drill-down aus Welt)

1. **Frage und Erfolg**
   - **Frage:** „Was will dieses Land von mir, was kann ich ihm geben, und was kostet mich das daheim?“
   - **Erfolg:** In 5 Sekunden sieht der Spieler die offenen Forderungen mit Ist und Soll und einen Regler je Forderung, ohne die Seite zu wechseln.

2. **Aufbau (Zonen, in S, 556 px breit, ≤ 1,3 Bildschirmhöhen)**

   | Zone | Höhe | Inhalt |
   |---|---|---|
   | L1 Kopf | 110 px | Flagge, Name, Haltung, Porträt der Führung, 3 Zahlen: Vertrauen, Handel, Konflikt |
   | L2 „Was sie wollen“ | ≈ 260 px | höchstens 4 Forderungen |
   | L3 „Was wir anbieten“ | ≈ 300 px | der Verhandlungstisch, direkt in der Karte |
   | L4 „Gesten“ | 1 Zeile, 6 Knöpfe | Gipfel, Handel, Rüstung, Druck, Entspannen, Hilfe |
   | L5 aufklappbar | — | „Konflikt“ (falls vorhanden), „Verdeckt (MİT)“, „Verträge“, „Hintergrund“ |

3. **Inhalte je Zone**
   - **L1 Kopf:**
     - `land(id)` (sim/laender.ts Zeile 262) für Name und Gruppe, `Flagge` (ui/art/Flaggen).
     - Haltung: `haltungWortAlle(w, id)`.
     - Zahlen: `beziehungZurTuerkei(w, id)` (`vertrauen`, `handel`, `konflikt`) als ganze Zahlen mit Pfeil gegen den Vormonat. Datenlücke: Für den Vormonat fehlt eine Reihe. `LandZustand.erinnerung` speichert nur Texte; ergänzen um `verlauf: {monat, v, k}[]` (Simulationsbedarf).
     - Porträt der Staatsführung: heute im Raster „Die Staatsführungen“ (Bild 051b), Quelle `lage(w, id)` (sim/welt-modell.ts Zeile 1063). Dazu Stabilität und Führung als Wort (`stabilitaetWort`, `haltungFuehrung`).
   - **L2 „Was sie wollen“:** `anliegenStand(w, id)` (sim/laender.ts Zeile 408). Je Anliegen eine Zeile mit Titel (`anliegen.titel`), Ist/Soll-Balken (`fortschritt`) und dem Text (`text`).
     - Hat die Bedingung `art: "massnahme"` oder `"massnahme-max"` (Typ `Bedingung` in sim/programme.ts Zeile 16), erscheint **darunter die Maßnahmenzeile dieser Maßnahme** mit Regler (Muster wie Welt S4).
       - Die Soll-Marke liegt auf dem Regler („EU will mindestens 55“).
       - Der Inlandspreis steht am Regler (aus `pruefeVorhaben`), die betroffenen Wählergruppen aus `betroffene(massnahmeId, richtung)` (sim/wege.ts Zeile 43) als Kreise mit Plus oder Minus.
       - Beispiele aus Bild 052b: Justizreform 35 → 55, Medienaufsicht 65 → höchstens 50, Annäherung an die EU 35 → 55.
     - Hat die Bedingung `art: "land"` (eine Dimension), erscheint nur der Balken mit dem Hinweis, welche Geste ihn hebt (aus `AKTIONEN`).
     - Datenlücke: keine. Die Bedingungen stehen in `LAENDER[].anliegen`.
   - **L3 „Was wir anbieten“:** `ui/welt/Verhandlungstisch.tsx` (Zeile 84), umgebaut zu einer einspaltigen Form für 556 px:
     - Oben die Stimmung der Gegenseite (`bewerte(w, angebot)` mit `STIMMUNG_WORT`, sim/abkommen.ts Zeile 127/225) als Halbrund-Zeiger mit 5 Stufen.
     - Darunter „Wir geben“ und „Wir verlangen“ als zwei Spalten mit Klauselchips (`klauselnFuer(w, landId)`, Zeile 65). Jeder Chip zeigt die Heimwirkung aus `heimWirkung(def)` (Zeile 90) beim Darüberfahren.
     - Laufzeit 2, 5 oder 10 Jahre (`VERTRAGSLAUFZEITEN`).
     - Knopf „Angebot unterbreiten · x Kapital“ (`pkFuer(a)`, Zeile 130; `verhandle`, Zeile 323). Gegenangebote werden mit „Annehmen“ übernommen (`nimmGegenangebot`, Zeile 355).
     - Sperre: `sperreRest(w, landId)` als „wieder möglich in x Tagen“.
     - Liegt ein Vorschlag des Partners vor (`vorschlagVomPartner`, Zeile 488), steht er vorausgefüllt da.
   - **L4 Gesten:** `aktionenFuer(w, id)` (sim/laender.ts Zeile 428) für Hauptakteure, `gestenFuerWeitere(w, id)` (sim/welt-modell.ts Zeile 1128) für weitere Staaten. Knopf mit Kapitalpreis (`AKTIONEN[a].pk`) und Grund als Hinweis.
   - **L5 aufklappbar:**
     - **Konflikt:** Phase, Eskalation, Front und drei Haupthandlungen aus `handlungenFuer(w, k.id)` (sim/krieg.ts Zeile 448), dazu „Zur Lagekarte →“ (Sicherheit). Das ist der einzige Querweg; das Konfliktdossier lebt in der Lagekarte.
     - **Verdeckt (MİT):** `opsOptionen(w, ziel)` (sim/welt-dienst.ts Zeile 249) mit `aussicht` (Zeile 197) und `ordneAn` (Zeile 277). Heute Unterreiter „Dienst“ und Knopf „Verdeckte Optionen“.
     - **Verträge:** `ui/welt/Vertraege.tsx` (laufende mit Kündigen und Verlängern, `VERLAENGERUNG_PK`).
     - **Hintergrund:** Wirtschaftszahlen (`lage(w, id)`), Wahlen (`wahlSicht`, `letzteWahl`), letzte Nachrichten (`jungeNachrichten(w, id, 4)`). Die Vergleichstabelle aus `data/vergleich.json` (Stand 2025) entfällt: Ihre Türkei-Spalte widerspricht dem laufenden Spiel (Inflation 34,9 % gegen 19,2 %).
     - Für die EU zusätzlich `ui/welt/EuDossier.tsx` (Ratsstimmen `ratStimmen`, Beitrittskapitel) als eigener Aufklapper „Beitritt“.

4. **Zustände**
   - **Weiterer Staat ohne Verhandlungstisch** (`!istHauptakteur(id)`): L3 entfällt, an seiner Stelle steht der Satz aus `SONDERTEXTE` bzw. „Kein eigener Verhandlungstisch“ (ui/welt/LandPopover.tsx Zeile 24).
   - **Handelssperre** (Israel): Die Geste „Handel“ ist gesperrt mit Grund (sim/laender.ts Zeile 437).
   - **Krieg mit dem Land:** L1 rot, L3 ersetzt durch die Friedenspakete `PAKETE` (sim/krieg.ts Zeile 366) mit `paketAnnahme`.
   - **0 Kapital:** Knöpfe mit rotem Preis und Grund.

5. **Klicks**

   | Element | Aktion | Ergebnis | landet in |
   |---|---|---|---|
   | Regler einer Forderung | Ziehen / Einbringen | wie Maßnahmentafel; die Soll-Marke färbt sich grün, wenn erreicht | L2 |
   | Klauselchip | Klick | in das Angebot oder heraus; die Stimmung aktualisiert sich ohne Kosten (Prüfen ist frei) | L3 |
   | „Angebot unterbreiten“ | Klick | `verhandle`; Ergebnis als Satz in L3 und im Eingang | L3 |
   | Geste | Klick | `fuehreAktionAus` / `fuehreGesteAus` | L4 |
   | „Zur Lagekarte →“ | Klick | Sicherheit öffnet mit diesem Konflikt | Ansicht 4 |
   | Verdeckte Operation | Klick | `ordneAn` mit Aussicht und Preis | L5 |
   | ← Zurück / Esc / Klick auf leeres Meer | Klick | zurück zur Welt-Übersicht | Ansicht 2 |

6. **Übernommen / gelöscht**
   - **Übernommen und umgebaut:** `ui/welt/Verhandlungstisch.tsx`, `Vertraege.tsx`, `EuDossier.tsx`, `Dienst.tsx` (nur Teil Ziel), `KriegDossier.tsx` (nur Kopf und drei Handlungen).
   - **`LandPopover.tsx`:** bleibt für Klicks auf Länder außerhalb der Akte Außen, zeigt aber nur L1 und „In der Akte Welt öffnen“.
   - **Gelöscht:** die Unterreiter „Überblick / Verhandlungstisch / Verträge / Gesten / ★ Beitritt“ (052); die BIP-Kacheln der Gegenseite; der doppelte Text „Letzte Wahl“; die Knöpfe „Zum Verhandlungstisch“, „Verdeckte Optionen“ und „Zum EU-Rat“.

7. **Simulationsbedarf:** `LandZustand.verlauf` (Vertrauen und Konflikt je Monat, 24 Einträge) für die Pfeile im Kopf. Sonst nichts; alle Funktionen gibt es schon.

8. **Texte**
   - Neu: „Was sie wollen“, „Was wir anbieten“, „Gesten“, „Verdeckt“.
   - Entfallen: „Überblick“, „Verhandlungstisch“ als Reitername, „Zum Vergleich (letzter Wert)“.

9. **Abnahme**
   - Die Länderkarte der EU ist ≤ 1,3 Bildschirmhöhen hoch, solange L5 zugeklappt ist.
   - Jede Forderung vom Typ Maßnahme hat einen Regler mit Soll-Marke und Preis.
   - Kein Wert aus `data/vergleich.json` erscheint.
   - Tests: neuer Test „Länderkarte EU: drei Forderungen mit Regler (m_justizreform, m_medienaufsicht, m_eu_annaeherung)“; `test/verhandlung.test.ts` und `test/abkommen.test.ts` bleiben unverändert.

10. **Aufwand und Abhängigkeiten:** **L**. Vorbedingung: Ansichten 1 und 2 sowie die Maßnahmenzeile als wiederverwendbares Bauteil (Teil A, Politik).

---

#### Sicherheit › Lagekarte

1. **Frage und Erfolg**
   - **Frage:** „Droht Krieg, wo steht die Front, und was befehle ich?“
   - **Erfolg:**
     - Ohne Krieg: In 5 Sekunden sieht man jeden Konflikt als Ring auf der Karte mit Eskalationszahl und Phase.
     - Im Krieg: Front, Zielräume und die eigene Erfolgsaussicht stehen auf der Karte, Einsatzart und Tempo sind mit einem Klick stellbar.

2. **Aufbau (Zonen)**

   | Zone | Ort | Inhalt |
   |---|---|---|
   | B1 | Bühne | Linse `lage` (neu): die Türkei und ihre Nachbarn, die Kamera auf dem schwersten Konflikt |
   | B2 | Bühne | Konfliktringe (Frieden bis Beschluss) bzw. Kriegslage (Krieg, Waffenruhe) |
   | B3 | Bühne, nur im Krieg | **Kriegsleiste** unten über der Linsenleiste, 788 × 120 px: Einsatzart (4 große Symbole), Tempo (3er-Schalter), Erfolgsbalken |
   | S1 | Seitenakte | Kopf (96 px): Konflikte, Spannung, Abschreckung, Bereitschaft; Porträts Generalstab, Verteidigung, Inneres |
   | S2 | Seitenakte | **Konfliktliste**, eine Zeile je Konflikt (höchstens 6) |
   | S3 | Seitenakte | **Gewählter Konflikt**: Phase als Leiter, Handlungen mit Preis |
   | S4 | Seitenakte | Innere Sicherheit: 3 Zeilen mit Regler (Polizei, Friedensprozess, Terror-Lage) |

   In der ersten Bildschirmhöhe stehen S1, S2 und der Kopf von S3. Der Umschalter im Kopf „Lagekarte · Streitkräfte & Bau“ ersetzt die heutigen Reiter.

3. **Inhalte je Zone**
   - **B1 Kamera:**
     - Ohne Konflikt: die Türkei (`START_D`).
     - Mit Konflikt: `SCHAUPLATZ_NACH_LAND[land]` (data/schauplaetze.ts Zeile 62, Felder `lon` und `lat`) des Vorgangs mit der höchsten `eskalation`.
     - Israel hat keinen Schauplatz (`ZWISCHENFALL_ORT` „fern“, sim/krieg.ts Zeile 1342/1350). Es erscheint in der Ferne-Leiste wie in Ansicht 2.
     - Die Grenzprovinzen des gewählten Schauplatzes (`grenzprovinzen`) bekommen einen dünnen Rand.
   - **B2 Konfliktringe:** neue Eigenschaft `ringe` an AtlasMap, Zeichnung in `ui/atlas/fx.ts` neben `zeichneKrieg` (kriegsfx.ts).
     - **Laufende Vorgänge:** für jeden Vorgang aus `aktiveKriege(w)` (sim/krieg.ts Zeile 189) mit Phase `spannung`, `drohkulisse` oder `beschluss` ein Ring um den Schauplatzmittelpunkt.
       - Radius nach `eskalation` (0–100).
       - Farbe: Ocker bei Spannung, Rot gestrichelt bei Drohkulisse, Rot voll bei Beschluss.
       - Daneben eine Zahlplakette „72“ und der Phasenname (`PHASEN_NAME`).
       - Ab `KRISE_AB = 55` (Zeile 1290) ein kleines Ausrufezeichen „Krise möglich“, aber nur wenn `kriseGrund(w, land)` (Zeile 1294) leer ist, die Krise also eröffnet werden kann.
     - **Angespannt ohne Vorgang:** `weltZustand(w)[id].konflikt ≥ ANGESPANNT_AB` mit `!ohneKriegsvorgang(id)` als dünner, gestrichelter Ring ohne Zahl. Die EU (`ohneKriegsvorgang("EU")` ist wahr) bekommt **keinen** Ring. Ihre Spannung 53 gehört in Außen, nicht in die Lagekarte.
     - **Krieg und Waffenruhe:** `kriegsKarte(w, kriege(w), provinceLonLat)` (sim/kriegsschauplatz.ts Zeile 568, heute schon in Stage.tsx Zeile 851) wird wie heute von `zeichneKrieg` gezeichnet:
       - Regionen eigen, umkämpft, beim Gegner oder besetzt.
       - Pfeile eigen und gegnerisch.
       - Bedrohte Grenzprovinzen (`bedroht`) blinken rot auf der türkischen Seite.
     - **Zielräume** (nur Phasen Drohkulisse, Beschluss und Krieg): Je Zielraum aus `zielraeumeFuer(land)` (sim/krieg.ts Zeile 1370, Daten `ZIELRAEUME` in data/streitkraefte.ts Zeile 74) eine schraffierte, anklickbare Fläche aus den Regionen `ZIELRAUM_REGIONEN[zielId]` (data/schauplaetze.ts Zeile 116), Flächen aus `data/schauplatz-flaechen.json`.
       - Beschriftung: Name (`militaer.zielraum.<id>`), Schwierigkeit als 1–3 Schilde (aus `schwierigkeit`) und Bedeutung als 1–3 Sterne (`bedeutung`).
       - Der gewählte Zielraum (`k.zielraum`) ist voll umrandet.
   - **B3 Kriegsleiste** (nur Phase `krieg`, bei `beschluss` als Vorplanung ohne Kosten):
     - **Einsatzart:** 4 Symbole aus `einsatzSichten(w, k)` (sim/kriegsschauplatz.ts Zeile 253): Luft, Boden, See, Stellvertreter. Je Symbol: Eignung für das Gelände der umkämpften Region (`eignung`, als „gut / schwer / kaum“ mit drei Stufen statt Zahl), eigene Kraft (`kraft`, ganze Zahl × 100) und ein Grund, falls gesperrt (`grund`: Küste, Stellvertreter, Abkühlung, Kapital). Im Krieg kostet die Umstellung `SCHAUPLATZ.einsatzPk` Kapital und 1 Truppenmoral; das steht am Symbol.
     - **Tempo:** Vorsichtig, Normal, Hart aus `TEMPO` (data/schauplaetze.ts Zeile 185). Die Wirkung steht als drei kleine Pfeile (Front, Verluste, Munition) aus den Faktoren `front`, `verlust` und `munition`.
     - **Erfolgsbalken:** links „eigene Stärke 37“ (`eigenStaerke(w, k)`, sim/krieg.ts Zeile 299), rechts „Gegenwehr 14“ (`gegnerStaerke(w, land)`, Zeile 316), als zwei gegeneinander laufende Balken.
     - Darunter eine Zeile: Front `k.front` (0–100) mit Trend gegen `k.frontVorher`, Heimatfront `k.uhr`, Gegner `k.uhrGegner`, Gefallene `k.gefallene`, Munition in Tagen (`streitkraefteSicht(w).gattungen` Gattung `munition`).
     - Lagebild: `lagebild(w)` (Zeile 328) als Wort („bekannt / vermutet / unsicher“), das die Gegnerzahl abschwächt („≈ 14, vermutet“).
   - **S1 Kopf:**
     - **Konflikte:** zwei Zahlen statt einer, damit Kopf und Liste übereinstimmen: „Konflikte 2 · Spannung 5“. Erste Zahl = Vorgänge (`aktiveKriege(w).length`), zweite = angespannte Länder ohne Vorgang (dieselbe Filterregel wie die Ringe).
     - **Abschreckung** und **Bereitschaft Heer:** `knotenKern(w, "abschreckung" | "bereitschaft_heer")` (ui/akte/Bereiche.tsx Zeile 111–115).
     - **Porträts:** Generalstab (`amt === "generalstab"`), Ministerium für Verteidigung (neues Amt, Simulationsbedarf) und Ministerium des Inneren (`amt === "inneres"`), je mit Loyalitätsring. Datenlücke: Eine Putschneigung des Generalstabs gibt es als `putsch` nur am Kriegsvorgang (krieg-typen.ts). Eine dauernde Anzeige braucht eine Sim-Größe (offene Frage 3).
   - **S2 Konfliktliste:** dieselbe Menge wie die Ringe (eine gemeinsame Funktion `konfliktLage(w)`, siehe Simulationsbedarf).
     - Je Zeile: Flagge, Land, Phase als Stempel, Eskalation bzw. Front als ganze Zahl, kleiner Trendpfeil.
     - Die ganze Zeile ist der Klick. Der Knopf „Konfliktdossier öffnen →“ (7-mal in Bild 056) entfällt.
     - Heute steht die Liste in `ui/akte/Konfliktlage.tsx` (Zeile 13–47), sortiert nach Konfliktwert, höchstens 6.
   - **S3 Gewählter Konflikt:**
     - Phasenleiter Spannung → Drohkulisse → Beschluss → Krieg → Waffenruhe → Frieden als 6 Punkte, der aktuelle groß.
     - Darunter die Handlungen der Phase aus `handlungenFuer(w, k.id)` (sim/krieg.ts Zeile 448): `label`, Kapitalpreis `pk`, `hinweis`, `grund`. Knopf „Ausführen“ ruft `fuehreKriegHandlungAus` (Zeile 543).
     - Rahmung (Verteidigung, Schutz, Beistand, Revision) als vier Karten mit Preisschild aus `RAHMUNG` (Zeile 131): Stimmen, Ansehen, Uhr, Nationalisten.
     - Ohne Vorgang (nur angespannt): „Krise eröffnen · x Kapital“ (`kriseEroeffnen`, Zeile 1311, Preis `KRISE_PK = 4`), sofern `kriseGrund` leer ist.
     - Koalition: `k.koalition` mit Partnern (`koalition_rufen`).
   - **S4 Innere Sicherheit** (aus Außen hierher):
     - **`m_polizei`** (data/politiknetz.ts Zeile 832) als Maßnahmenzeile. Dazu die Behörde `polizei` als drei Punktbalken mit Ausbauen und Kürzen (sim/behoerden.ts).
     - **`m_friedensprozess`** (Zeile 835) als Maßnahmenzeile. Daneben die Phase des Prozesses aus `aussenZustand(w).friedens.phase` als 6-Punkte-Leiter (Stufen wie in Bild 051b), `fortschritt` als Balken.
     - **Terror-Lage:** `aussenZustand(w).terror` (IS, PKK, Links) als drei Balken, nur lesend. Dazu die MİT-Inlandsaufträge aus `inlandOptionen(w)` (sim/welt-dienst.ts Zeile 574) mit `ordneInlandAn`.

4. **Zustände**
   - **Ruhe** (keine Spannung ≥ 50): Die Karte zeigt die Türkei ohne Ringe. S2 sagt „Keine Spannung über 50“ (`gz.konflikt.ruhig`). S3 entfällt; S4 rückt nach oben.
   - **Spannung / Drohkulisse:** Ringe; Zielräume ab Drohkulisse.
   - **Beschluss:** Zielräume wählbar ohne Kosten; die Kriegsleiste erscheint in der Vorplanung ohne Preis.
   - **Krieg:** Die Kamera fliegt zum Schauplatz. Die Kriegsleiste ist aktiv, Vorstöße laufen als Animation (Effekte „aus“ hält still), bedrohte Provinzen blinken.
   - **Waffenruhe:** Die Frontlinie steht gestrichelt; S3 zeigt die Friedenspakete (`PAKETE`, `paketAnnahme`), `waffenruheFuerAngebot`.
   - **Besatzung nach dem Frieden:** `besatzungsSicht(w)` (sim/kriegsschauplatz.ts Zeile 460) als schraffierte Fläche. S3 zeigt je Gebiet Form, Widerstand und `aendereBesatzung` (heute `ui/krieg/Besatzung.tsx`).
   - **0 Kapital:** Einsatzwechsel und Zielraumwechsel im Krieg (4 Kapital, sim/krieg.ts Zeile 1388) sind gesperrt, mit rotem Grund am Symbol.

5. **Klicks**

   | Element | Aktion | Ergebnis | landet in |
   |---|---|---|---|
   | Konfliktring / Land / Zeile in S2 | Klick | Konflikt gewählt, Kamera auf den Schauplatz | S3 + B |
   | Zielraumfläche | Klick | `waehleZielraum(w, k.id, zielId)`; im Krieg mit Bestätigung „4 Kapital, −2 Moral“ | B (Umrandung) |
   | Zielraumfläche | Darüberfahren | Schwierigkeit, Bedeutung, Regionen, wer gereizt wird (`Region.reizt`) | B |
   | Einsatzsymbol | Klick | `waehleEinsatz` | B3 |
   | Temposchalter | Klick | `waehleTempo` | B3 |
   | Handlung in S3 | Klick | `fuehreKriegHandlungAus`; Ergebnis als Satz und im Eingang | S3 |
   | Region im Krieg | Darüberfahren | Name, Gelände, Lage, Ressource (`Region.ressource`) | B |
   | Bedrohte Provinz | Klick | Provinzkarte mit „Bedroht von …“ | Ansicht 9 |
   | Porträt | Klick | Ministerakte bzw. Gespräch | Kabinett (Teil B) |
   | Umschalter „Streitkräfte & Bau“ | Klick | Ansicht 5 in derselben Seitenakte; die Karte bleibt | S |
   | Esc | Taste | Konfliktwahl lösen, dann die Akte schließen | — |

6. **Übernommen / gelöscht**
   - **Übernommen:** `ui/atlas/kriegsfx.ts` und `sim/kriegsschauplatz.ts` `kriegsKarte` (unverändert). `ui/welt/KriegDossier.tsx` wird in S3 zerlegt (Kopf, Handlungen, Pakete). `ui/krieg/Schauplatz.tsx` wird zur Kriegsleiste B3. `ui/krieg/Besatzung.tsx` wird S3 im Zustand Besatzung. `ui/akte/Konfliktlage.tsx` wird S2 (ohne Knöpfe).
   - **Gelöscht:**
     - Die Schublade „Zielräume“ in `ui/militaer/Streitkraefte.tsx` (Funktion `Zielraeume`, Zeile 79–112, Bild 057).
     - Der Kasten „Lage: angespannt · Streitkräfte öffnen“ (056).
     - „Bündnisse der Türkei“ als Kacheln (056b). Die Bündnisse gehören nach Außen S5 bzw. werden auf der Karte als Umschalter gezeigt.
     - Die Reiter „Sicherheitsbilanz“ (060) und „Führung & Zuständigkeit“ (061).

7. **Simulationsbedarf**
   - `konfliktLage(w): { land; vorgang?: KriegVorgang; wert: number; art: "vorgang" | "angespannt" }[]` in `sim/krieg.ts` (lesend). Kopf, Liste und Ringe nutzen sie. Behebt „Laufende Konflikte 2“ gegen 7 Zeilen.
   - `ANGESPANNT_AB` nach `sim/krieg.ts` (siehe Ansicht 2).
   - Neues Figur-Amt `verteidigung` (Ministerium für Verteidigung) in `sim/figuren.ts` / `sim/personen-typen.ts` und in `BEREICH_AEMTER.sicherheit` (Bereiche.tsx Zeile 367). Das ist Teil des 17-Ministerien-Umbaus (Teil B); hier nur der Bedarf.
   - Für Israel ist kein Schauplatz vorhanden (`SCHAUPLAETZE`, data/schauplaetze.ts Zeile 53). Das bleibt so; die Lagekarte zeigt Israel ohne Zielräume („nur das allgemeine Ziel“, wie heute). Es wird nichts erfunden.

8. **Texte**
   - Neu: „Lagekarte“, „Spannung“ (als Zähler im Kopf), „Gegenwehr“, „Erfolgsaussicht“.
   - Geändert: Die Marke „Krieg läuft“ erscheint nur in Phase `krieg` (siehe Fehlerliste).
   - Gelöscht: „Konfliktdossier öffnen →“, „Was Sie jetzt in Auftrag geben können“ (wandert nach Ansicht 5).
   - Grammatik: „Das Kriegsziel umfasst 1 Region“ (Pluralform im Katalog `militaer.*`).
   - Zahlen: Eskalation und Front als ganze Zahlen ohne „/ 100“; Eignung als Wort.

9. **Abnahme**
   - Die Kopfzahl „Konflikte“ und die Zeilen von S2 stammen aus derselben Funktion (Test in `test/krieg.test.ts`: `konfliktLage(w).filter(art==="vorgang").length === aktiveKriege(w).length`).
   - Ohne Phase `krieg` erscheint kein „Krieg läuft“ (Test in `test/streitkraefte-ansicht.test.tsx` anpassen).
   - Die EU hat keinen Ring.
   - Ein Zielraumklick ruft `waehleZielraum` (UI-Test).
   - Kriegsleiste und Ringe erscheinen auch in Karte2D (`test/karte2d.test.tsx`).
   - `test/kriegsschauplatz.test.ts` und `test/krieg-*.test.ts` bleiben grün.
   - Erste Bildschirmhöhe ohne Bildlauf bis Ende S2.

10. **Aufwand und Abhängigkeiten:** **L**. Vorbedingung: Ansicht 1, `ringe` in fx.ts und Karte2D, Linse `lage` (Ansicht 7), Teil B (Amt Verteidigung) nur für das Porträt.

---

#### Sicherheit › Streitkräfte & Bau

1. **Frage und Erfolg**
   - **Frage:** „Wie stark bin ich, wo bin ich schwach, was wird gebaut, und was kostet mehr?“
   - **Erfolg:** In 5 Sekunden sieht der Spieler die schwächste Teilstreitkraft (Radar), das nächste fertige Vorhaben (Bauliste oben) und den Verteidigungsetat als Regler.

2. **Aufbau (Zonen, in S, Karte bleibt links)**

   | Zone | Höhe | Inhalt |
   |---|---|---|
   | T1 Kopf | 96 px | wie die Lagekarte, Umschalter „Lagekarte · Streitkräfte & Bau“ |
   | T2 Radar | 220 px | 3 Achsen (Heer, Luft, See) mit zwei Flächen: Kampfkraft und Bereitschaft |
   | T3 Stellgrößen | ≈ 280 px | 5 Zeilen mit Regler |
   | T4 Bauliste | ≈ 300 px | eine Liste aller laufenden Vorhaben (militärisch und zivil), Kapazitätsbalken oben |
   | T5 aufklappbar | — | „Neu beginnen“, „Instand setzen“, „Gattungen im Einzelnen“, „Behörden“ |

   In der ersten Bildschirmhöhe stehen T1–T3 und der Kopf von T4.

   Auf der Karte (B) zeigt die Linse `lage` zusätzlich Stützpunkte und Baustellen der Rüstung als Marken (`reichMarken(w, ebene)`, Stage.tsx Zeile 391). Ein Klick auf eine Marke wählt das Vorhaben in T4.

3. **Inhalte je Zone**
   - **T2 Radar:**
     - Kampfkraft je Teil: `streitkraefteSicht(w).teile` (sim/streitkraefte.ts Zeile 514) für `heer`, `luft` und `see` (1,0 = Stand 2026), Anzeige × 100 als ganze Zahl.
     - Bereitschaft je Teil: Knoten `bereitschaft_heer`, `bereitschaft_luft`, `bereitschaft_marine` (die Namen in 058 lauten „Einsatzbereitschaft des Heeres / der Luftwaffe / der Marine“). Die genauen Knoten-IDs in `data/politiknetz.ts` prüfen; `bereitschaft_heer` und `bereitschaft_luft` sind belegt (Bereiche.tsx Zeile 112, data/reich/militaer.ts Zeile 297).
     - Mitte: Gesamtwert `streitkraefteSicht(w).index` (`kampfkraftIndex`: Heer 45 %, Luft 35 %, See 20 %).
     - Am Rand: Modernisierung (Knoten) und Autarkie (`autarkie(z)`, Zeile 198) als zwei kleine Zahlen.
     - Raketen und Cyber sind keine Teilstreitkraft: `Teilstreitkraft` = heer | luft | see (data/streitkraefte.ts). Raketen zählen zu See (`raketen.teil = "see"`). Fünf Achsen wie in Kritik D vorgeschlagen sind deshalb **nicht** möglich, ohne die Sim zu ändern. Es bleiben 3 Achsen.
     - Zahlen nur dort, wo sie vom Stand 2026 abweichen. Bei 100 steht „wie 2026“.
   - **T3 Stellgrößen** (Maßnahmenzeilen, Ministerium Verteidigung):
     1. `m_verteidigung` „Verteidigungsausgaben“ (data/politiknetz.ts Zeile 838). Daneben der Etatfaktor `etatFaktor(w)` (sim/streitkraefte.ts Zeile 108) als „Etat 100 % von 2026“ und `verteidigungsEtat(w)` (sim/haushalt.ts Zeile 212) in % des BIP. Datenlücke: Ein Lira-Betrag fehlt; er kommt mit dem Ministeriumsrad (PLAN Abschnitt 4). Warnung, wenn `unterdeckung > 0` (Erhalt unter `erhaltSchwelle 0,8`): „Ältestes Gerät wird ausgemustert in x Monaten“.
     2. `m_wehrdienst` „Wehrdienst“ (Zeile 1373). **Achtung:** Zusätzlich gibt es `setzeWehrdienst(w, 0|6|12|18)` (sim/streitkraefte.ts Zeile 381) mit eigenem Feld `wehrdienst`. Zwei Hebel für dieselbe Sache. Vor dem Umbau auf einen Hebel festlegen (offene Frage 2). Bis dahin zeigt die Zeile die Maßnahme und die Monate aus `streitkraefteSicht(w).wehrdienst` lesend.
     3. `m_ruestungsindustrie` „Heimische Rüstungsindustrie“ (Zeile 839), dazu Autarkie in Prozent.
     4. `m_uebungen` „Ausbildung und Übungen“ (Zeile 1374).
     5. `m_offiziersauswahl` „Beförderung im Obersten Militärrat“ (Zeile 1375), mit dem Termin im August als Hinweis.
   - **T4 Bauliste:**
     - Eine einzige Liste aus `warteschlange(w)` (sim/reich.ts Zeile 862), gefiltert auf das Ministerium (Bereich `militaer`) und darüber hinaus alle Vorhaben, die dieselbe Baukapazität nutzen, ausgegraut mit „zivil“.
     - Je Zeile: Bild (`WunderBild`), Name, Fortschrittsbalken, „fertig in etwa x Monaten“ (aus `bauplan(w)`, Zeile 377), Vergabe als kleines Etikett (`laufVergabe`, einmal statt 4-mal gelb), Griff zum Umordnen (`verschiebe(w, id, ±1)`, Zeile 817, Preis `VORZIEHEN_VERWALTUNG = 10` am Griff) und **einmal** Pausieren (`pausiere`, Zeile 797).
     - Oben ein gestapelter Balken „Baukapazität 99 / 133“ (`bauKapazitaet(w)`, Zeile 186; die Anteile je Vorhaben aus `bauplan`), militärische Stücke dunkel, zivile hell. Daneben „Verwaltungskraft 99 · +2,4 im Monat“ (`verwaltungBilanz(w)`, Zeile 203).
     - **Zwei Modelle für dasselbe Gerät:** Altay T1, Stahlkuppel, F-16 Block 70, Eurofighter und KAAN stehen zweimal in der Sim:
       - als Reich-Vorhaben `mil_altay`, `mil_stahlkuppel`, `mil_f16`, `mil_eurofighter`, `mil_kaan` (data/reich/militaer.ts)
       - und als Beschaffung in `START_BESCHAFFUNGEN` (data/streitkraefte.ts) mit eigenem `fertig`-Tag.

       Daher „Altay noch 11 Monate“ (Beschaffung, 30 Monate ab 2026) gegen „fertig in etwa 25 Monaten“ (Reich-Baupunkte). Die Bauliste darf nur **ein** Datum zeigen. Festlegung (Simulationsbedarf): Das Reich-Vorhaben ist führend; die Beschaffung übernimmt `fertig` aus dem Vorhaben.
   - **T5 aufklappbar:**
     - **Neu beginnen:** `kartenAuswahl(w, "militaer")` (ui/akte/Bildkarten.tsx Zeile 29) **nur** Zustand `moeglich` und `verlangt`, ohne `bau`.
       - Kosten beschriftet: „Kapital 8 · Bau 2.000 · 48 Monate · Haushalt +0,7 Pp. · Verwaltung 2,5“. Die Bedeutung der fünf heutigen Symbolchips des KAAN steht in `vergabeAngebot(v, vergabe)` (sim/reich.ts Zeile 126: `pk`, `bau`, `monate`, `vorlauf`). Die Zuordnung „+0,7 Pp.“ und „2,5“ in der Umsetzung aus `VorhabenSicht` (Zeile 330) prüfen und beschriften.
       - Knopf „Prüfen und beginnen“ mit Vergabeart (`beginne(w, id, vergabe)`, Zeile 724).
       - Dazu Beschaffung je Gattung aus `vorschauAusbau(w, gattung, art)` (sim/streitkraefte.ts Zeile 293) und `beginneAusbau` (Zeile 338): Kauf, Produktion, Entwicklung, Modernisierung mit Preis in % des BIP je Monat (`bipMonat`), Lieferland und Risiko (`scheitert`).
     - **Instand setzen:** `pflegeStand(w, id)` (sim/reich.ts Zeile 628), wie in Bild 058 („Hier lohnt sich Pflege“). Das Muster bleibt unverändert.
     - **Gattungen im Einzelnen:** Tabelle aus `streitkraefteSicht(w).gattungen`: Menge (nur bei `einheit: "stueck"`, sonst „wie 2026“ oder ± x %), Generation als Ziffer 1–5 statt Punkte, heimisch in Prozent, Lieferland mit Flagge. „Generation“ entfällt bei `personal` und `munition`.
     - **Behörden:** MİT, Polizei und Gendarmerie, Grenzschutz und Küstenwache, Cyberabwehr (data/behoerden.ts) als 4 Zeilen: drei Punktbalken, Ressort (Präsidialamt bzw. Inneres aus `ressort`), Etat-Spielraum (`etatSpielraum`), Ausbauen und Kürzen mit Preis (`vorschau`, `baueAus`, Kürzung). Ein Klick auf den Ressortnamen öffnet das Ministeriumsrad (PLAN Abschnitt 4, Teil B).

4. **Zustände**
   - **Leer** (keine Bauten): T4 zeigt „Nichts im Bau“ und klappt T5 „Neu beginnen“ auf.
   - **Krieg:** Das Radar zeigt die Verluste der letzten Woche als rote Kerbe (`k.letzteWoche.eigen`). Die Munition steht rot unter 20 Tagen. Ausmustern (`mustereAus`) ist gesperrt; die Demobilisierungssperre (`demobSperreBis`) steht im Kopf.
   - **Lieferstopp** (Sanktion, z. B. CAATSA): Betroffene Vorhaben tragen ein Schloss mit Lieferland und Grund (`gestoppt`, `versorgungsVerzug`).
   - **0 Kapital:** Preise rot, der Griff zum Umordnen ist gesperrt, wenn die Verwaltungskraft unter 10 liegt.

5. **Klicks**

   | Element | Aktion | Ergebnis | landet in |
   |---|---|---|---|
   | Radarachse | Klick | „Gattungen im Einzelnen“ öffnet gefiltert auf diesen Teil | T5 |
   | Regler T3 | Ziehen / Einbringen | Maßnahme | T3 / Eingang |
   | Zeile Bauliste | Klick | Kamera auf den Bauort (falls vorhanden), Details aufgeklappt | T4 + B |
   | Griff ▲▼ / Ziehen | Klick / Ziehen | `verschiebe` mit Preis 10 Verwaltungskraft je Platz | T4 |
   | Pausieren | Klick | `pausiere` | T4 |
   | „Prüfen und beginnen“ | Klick | `beginne` / `beginneAusbau` | T4 (neue Zeile) |
   | Instand setzen | Klick | Pflege | T5 |
   | Behörde Ausbauen / Kürzen | Klick | `baueAus` / Kürzung | T5 |
   | Ressortname | Klick | Ministeriumsrad | Wirtschaft › Haushalt (Teil B) |

6. **Übernommen / gelöscht**
   - **Umgebaut:** `ui/militaer/Streitkraefte.tsx` (Radar und Gattungstabelle; Zielräume entfernt). Die Reich-Akte Militär (`reich_militaer`, Bauliste und Pflege aus `ui/reich/*`). `ui/akte/Bildkarten.tsx` (nur mögliche Vorhaben).
   - **Gelöscht:**
     - Die Kacheln „Index 100“ (057).
     - Die doppelte Liste „Im Bau“ plus „Baureihenfolge“ (058b wird eine Liste).
     - Die 8 Kennzahlbalken in „Rüstung › Lage“ (058) und die Unterreiter „Lage / Rüstung pflegen / Beschaffung und Doktrinen“.
     - „Behörden“ als eigener Reiter (059).
     - Die Vorteilskarten „Noch nicht erreicht“. Vorteile (`aktiveVorteile`, sim/reich.ts Zeile 915) erscheinen erst, wenn sie erreicht sind, als Abzeichen im Kopf.
   - **Doktrinen** (`doktrin_*` in data/reich/militaer.ts) bleiben als „Neu beginnen“-Karten.

7. **Simulationsbedarf**
   - **Ein Datum je Gerät:** `START_BESCHAFFUNGEN` und die Reich-Vorhaben `mil_*` koppeln (Feld `vorhaben?: string` an `Beschaffung`; `fertig` folgt `bauplan`). Das ändert Lieferzeiten. Die Abweichung zwischen beiden Modellen dokumentieren und in ENTSCHEIDUNGEN eintragen, nicht stillschweigend.
   - **Wehrdienst:** einen der beiden Hebel streichen oder koppeln (`m_wehrdienst`-Stufe ↔ `setzeWehrdienst`-Monate).
   - **Zuordnung zu den Ministerien:** `m_verteidigung`, `m_ruestungsindustrie`, `m_uebungen`, `m_offiziersauswahl` und `m_wehrdienst` → Verteidigung. Die Rüstungsindustrie ist umstritten (Präsidium der Verteidigungsindustrie SSB untersteht dem Präsidenten, Zuordnung prüfen). `m_polizei` → Inneres.

8. **Texte**
   - Neu: „Streitkräfte & Bau“, „wie 2026“, „Baukapazität“, „zivil“.
   - Entfallen: „Index“, „Kampfkraft 100“ als Kachel, „Transparente Ausschreibung“ in Großbuchstaben (stattdessen das Etikett „Ausschreibung“), „Wunder“ für Rüstungsgüter (Klasse `wunder` im Katalog umbenennen: „Großvorhaben“).
   - Generation als Ziffer „Gen. 4“.

9. **Abnahme**
   - Kein Vorhaben steht zweimal.
   - Jedes Gerät hat genau ein Fertigdatum in allen Ansichten (Test: Altay in Bauliste, Gattungstabelle und Zeitung gleich).
   - Keine Kachel mit unverändertem Wert 100.
   - T1–T3 passen in die erste Bildschirmhöhe, die ganze Ansicht ohne T5 ≤ 1,3 Bildschirme.
   - Tests: `test/streitkraefte-ansicht.test.tsx`, `test/reich-ui.test.tsx` und `test/akte-bildkarten.test.tsx` anpassen; `test/streitkraefte.test.ts` und `test/reich.test.ts` für die Kopplung erweitern.

10. **Aufwand und Abhängigkeiten:** **L**. Vorbedingung: Ansicht 1, Entscheidung zu Wehrdienst und Datumskopplung, Teil B (Ministeriumsrad) nur für den Drill-down.

---

#### Medien › Medien

1. **Frage und Erfolg**
   - **Frage:** „Was schreiben sie über mich, wer schreibt es, und wie viel Kontrolle kaufe ich mir zu welchem Preis?“
   - **Erfolg:** In 5 Sekunden sieht man dieselbe Nachricht in zwei Schlagzeilen (regierungsnah gegen oppositionell), den Anteil der regierungsnahen Reichweite im Ring und den Pressefreiheitswert mit Rang.

2. **Aufbau (Zonen, Papierakte über der Karte, `.dossier.wide` 1160 × 790 px)**

   | Zone | Ort | Größe | Inhalt |
   |---|---|---|---|
   | M1 Kopf | oben | 1160 × 80 | Pressefreiheit (Wert und Rang, Sparkline), veröffentlichte Umfrage gegen eigene Kenntnis, Ausweichen in soziale Netze; Porträts Präsidialamt und Inneres |
   | M2 Titelseiten | links | 720 × 560 | zwei Titelseiten nebeneinander, je 350 px; in Monaten mit drittem Blatt (digital) ein schmaler Streifen darunter |
   | M3 Ring | rechts oben | 400 × 300 | Medienmarkt als Ring aus 7 Gruppen |
   | M4 Regler | rechts unten | 400 × 260 | 3 Maßnahmenzeilen |
   | M5 | unten über die volle Breite | 1160 × 60 | „Nicht in dieser Ausgabe“ (durchgestrichen) und Archiv als Zeitleiste der letzten 12 Ausgaben |

   Alles steht in der ersten Bildschirmhöhe. Der Artikeltext jeder Titelseite klappt beim Klick auf.

3. **Inhalte je Zone**
   - **M1 Kopf:**
     - **Pressefreiheit:** `rsfSicht(w)` (sim/medien.ts Zeile 727): `score` mit einer Stelle (29,4), `rang` („Rang 159“), Sparkline aus `verlauf`.
     - **Umfrage:**
       - Veröffentlicht: `angezeigteZustimmung(w)` (Zeile 863), Wert, Institut und Streuung („Ekran 54,2 % ± 2,0“).
       - Wahr: `sp.umfrage.zustimmung`, die die Kopfleiste heute zeigt (Stage.tsx Zeile 429).
       - Beide nebeneinander und benannt: „Ihre Zahl 50 % · veröffentlicht 54,2 % (Ekran)“. Wie viel der Spieler wissen darf, ist offene Frage 1.
     - **Ausweichen:** `medienVon(w).ausweich` (0–100) nur, wenn > 0. „Gesperrte Medien 0“ entfällt bei 0 und erscheint als rote Zahl, sobald `lizenzVon(w, id) === "gesperrt"` für ein Blatt gilt.
     - **Porträts:** Präsidialamt (`amt === "stab"`) und Inneres (`amt === "inneres"`), wie `BEREICH_AEMTER.medien`.
   - **M2 Titelseiten:** die neueste Monatsausgabe `zeitungVon(w).archiv.at(-1)` (sim/zeitung.ts Zeile 617).
     - Links das regierungsnahe, rechts das oppositionelle Blatt (`ausgabe.blaetter`, Auswahl `blattAuswahl` Zeile 454: ein regierungsnahes, ein oppositionelles, in geraden Monaten zusätzlich `digital_frei`).
     - Je Seite die Komponente `Frontseite` aus `ui/Zeitung.tsx` (Zeile 337) in Schmalform: Masthead, Aufmacher (`artikel[0]`), Einordnung, Kommentar (`kommentar`).
     - Gleiche Vorgänge stehen auf gleicher Höhe, damit der Kontrast sichtbar wird (Zuordnung über die Vorgangs-ID im Artikel).
     - Fehlt ein Blatt, weil es gesperrt ist (`ausgabe.gesperrt`), steht an seiner Stelle eine graue Seite „Erscheint nicht · Lizenzentzug bis …“.
     - „Zahlen des Monats“ (`ausgabe.zahlen`) entfällt in M2; die Zahlen stehen in der Kopfleiste und in M1.
   - **M3 Ring:** 7 Segmente aus `MEDIEN_CLUSTER` (data/medien.ts).
     - **Segmentgröße = Reichweite jetzt.** `reichweiteJetzt(w, id)` (sim/medien.ts Zeile 263) ist ein Faktor (1 = Start). Die Grundreichweite je Gruppe steht in `reichweiteSegmente` (Anteil je Wählersegment: ländlich-konservativ, urban-alt, urban-jung, kurdisch, akademisch).
       - Datenlücke: Für eine Gesamtreichweite fehlt der Bevölkerungsanteil je Medien-Segment. Die Kommentare in data/medien.ts ordnen die Segmente den Wählergruppen zu („≈ GRUPPEN konservative, landwirte, rentner“ …). Deren Größen stehen in `sim/gruppen.ts`.
       - Vorschlag: Gewicht je Segment = Summe der zugeordneten Gruppenanteile, als neue Tabelle `SEGMENT_GEWICHT` mit genau diesen Kommentaren als Beleg.
       - Bis zur Festlegung zeigt der Ring gleich große Segmente und sagt sichtbar: „Größe nach Reichweite folgt“.
     - **Farbe** nach wirksamer Ausrichtung `wirksamerCluster(w, c).ausrichtung` (Zeile 286), von staatlich (dunkelrot) bis unabhängig-digital (blau). Ein gekipptes opportunistisches Blatt (`gekippt`) wechselt sichtbar die Farbe.
     - **Innenring:** Selbstzensur (`ClusterZustand.selbstzensur`, 0–100) als Füllhöhe. Ein Schloss bei Lizenz `gedraengt`, ein Kreuz bei `gesperrt` (`lizenzVon`).
     - **Mitte:** Anteil der regierungsnahen Reichweite in Prozent (aus denselben Segmentgrößen; erst nach Schließen der Datenlücke, vorher „—“).
   - **M4 Regler** (die drei Dauerkanäle laut sim/medien.ts Zeile 15):
     1. `m_medienaufsicht` „Medienaufsicht“ (data/politiknetz.ts Zeile 888, Start 65).
        - Marken auf dem Regler aus `reglerLizenz` (sim/medien.ts Zeile 231): 65 = Rundfunk unter Druck, 90 = Opposition gesperrt.
        - Dazu die EU-Forderung „höchstens 50“, falls im EU-Anliegen vorhanden (`anliegenStand(w, "EU")`).
     2. `m_internetsperren` „Internetsperren“ (Zeile 891, Start 60). Marken: 60 = digital unter Druck, 90 = digital gesperrt.
     3. `m_staatsmedien` „Staatliche Medien und Werbung“ (Zeile 892, Start 60). Marke 60: Darüber steigt die Abhängigkeit der Regierungsnahen (sim/medien.ts Zeile 775–777).

     Je Zeile Preis und Wirkung aus `pruefeVorhaben`. Zusätzlich ein Satz: „Pressefreiheit sinkt (Kante −0,05 je Monat, Verzug 3 Monate)“, aus den Kanten `e(...)` in data/politiknetz.ts Zeile 899–904.
   - **Eingriffe am Segment (Drill-down M3):** `medienAktionen(w)` (sim/medien.ts Zeile 503) gefiltert auf `clusterAktion` für das gewählte Cluster: Eigentümerdruck, Staatsanzeigen, Anzeigenstopp, Aufsichtsstrafe, Blackout, Lizenzentzug, Verfahren, Kontosperrung, Übernahme, Interview.
     - Preis: Kapital und Aufmerksamkeit (`AKTIONEN[id].kapital`, `.aufmerksamkeit`); Pressefreiheitsverlust aus `REGULIERUNG_PREISE[preis].rsfMalus` bzw. `rsf`; Märtyrer-Effekt `maertyrer`.
     - Ausführen: `fuehreMedienAktionAus(w, aktionId, clusterId)` (Zeile 586).
     - „Pressekonferenz“ (keine Clusteraktion) und „Rohdaten kaufen“ (`rohdatenKaufen`, Zeile 902, 3 Kapital) stehen in M1 als Knöpfe.
   - **M5:**
     - „Nicht in dieser Ausgabe“ aus `ZeitungBlatt.verschwiegen` des regierungsnahen Blatts, als durchgestrichene rote Zeilen. Ein Klick führt zum Vorgang (`handlungFuer`, sim/zeitung.ts Zeile 344).
     - Archiv: 12 Ausgaben (`ARCHIV_MAX = 12`, Zeile 253) als Punkte auf einer Zeitleiste. Beim Darüberfahren erscheint die Schlagzeile.

4. **Zustände**
   - **Keine Ausgabe** (erster Monat): M2 zeigt „Die erste Ausgabe erscheint am 1. des Monats“. Ring und Regler sind da.
   - **Publikationsverbot vor der Wahl** (`publikationsverbot(w)`, Zeile 852): M1 zeigt „Keine neuen Umfragen bis zur Wahl“ und die letzte Zahl grau.
   - **Pressekrise** (Sperre oder Lizenzentzug): Das Segment ist durchgekreuzt, die gesperrte Titelseite grau.
   - **Eilmeldung** (`anlass: "eilmeldung"`): Sie ersetzt die linke Titelseite, mit Banner.
   - **0 Kapital:** Eingriffe mit rotem Preis.

5. **Klicks**

   | Element | Aktion | Ergebnis | landet in |
   |---|---|---|---|
   | Ringsegment | Klick | Eingriffe dieses Clusters, Eigentümer (`eigentuemer`), Abhängigkeit, Selbstzensur | M3 als Aufklapper |
   | Artikel | Klick | Volltext klappt auf; „Zur …“ führt zum Vorgang (`Handlung`, Zeitung.tsx Zeile 44) | Ziel-Akte |
   | Regler | Ziehen / Einbringen | Maßnahme | M4 / Eingang |
   | „Nicht in dieser Ausgabe“-Zeile | Klick | Vorgang | Ziel-Akte |
   | Archivpunkt | Klick | Ausgabe ersetzt M2 (Kopf „Ausgabe Nr. 17 · 1. September 2029 · zurück zur neuesten“) | M2 |
   | Rohdaten kaufen | Klick | `rohdatenKaufen` | M1 |
   | Porträt | Klick | Ministerakte | Kabinett (Teil B) |

6. **Übernommen / gelöscht**
   - **Übernommen:** `ui/Zeitung.tsx` (`Frontseite`, `Masthead`, `Artikel`, `Kommentar`, `Einordnung`). `ui/MedienAkte.tsx` (Eingriffe) wird zum Segment-Aufklapper.
   - **Gelöscht:**
     - „Medienlage“ (062) mit dem Kasten „Lage: angespannt“ und „Zeitung öffnen“.
     - „Pressebilanz“ (064), „Zuständige Akteure“ (065).
     - Die Unterreiter „Ausgaben / Medien“ und „Der Staatsbote / Der Widerspruch“ (063).
     - „Zahlen des Monats“, „Parlament“ und „Lage im Land“ als Kästen der Zeitung. Sie wiederholen Kopfleiste, Parlament und Land; bleiben darf je ein Satz im Artikel.
   - **Sidebar-Zähler** „Medien 22“ (`umlauf: spiel.zeitung.ungelesen`, Stage.tsx Zeile 598): nur noch ein ruhiger Punkt ohne Zahl, bei neuer Ausgabe.

7. **Simulationsbedarf**
   - `SEGMENT_GEWICHT: Record<MedienSegment, number>` (Datenlücke, siehe M3) für Ringgröße und Mittelzahl. Recherche: Anteile der Segmente an der Wahlbevölkerung oder Ableitung aus `sim/gruppen.ts` mit Beleg.
   - Eine Lesefunktion `medienMarkt(w): { id; reichweite; ausrichtung; selbstzensur; lizenz }[]` in sim/medien.ts.
   - Keine Regeländerung.

8. **Texte**
   - Neu: „Ihre Zahl“, „veröffentlicht“, „Erscheint nicht“, „Nicht in dieser Ausgabe“ (bleibt).
   - Entfallen: „Medien nach Gruppen“, „Gesperrte Medien 0“ bei 0, „3 weitere Einträge“.
   - Zahlen: Pressefreiheit mit einer Nachkommastelle (Format der Quelle RSF), alle übrigen als ganze Zahlen.

9. **Abnahme**
   - Die ganze Ansicht ohne Aufklapper ist ≤ 1 Bildschirmhöhe.
   - Die regierungsnahe und die oppositionelle Titelseite stehen gleichzeitig sichtbar.
   - Kein Wert der Kopfleiste steht in der Zeitung noch einmal mit anderem Wert ohne Benennung (Test: Wenn `angezeigteZustimmung.wert ≠ umfrage.zustimmung`, tragen beide Werte ihr Etikett).
   - Jeder Regler hat Schwellenmarken aus `reglerLizenz`.
   - Tests: `test/zeitung.test.ts` und `test/zeitung-inhalt.test.ts` bleiben; `test/medien.test.ts` für `medienMarkt`; neuer UI-Test „zwei Titelseiten nebeneinander“.

10. **Aufwand und Abhängigkeiten:** **M**. Vorbedingung: Maßnahmenzeile als Bauteil (Teil A); offene Frage 1 (Umfrage gegen Wahrheit); Recherche `SEGMENT_GEWICHT`.

---

#### Karte › Acht Linsen

1. **Frage und Erfolg**
   - **Frage:** „Welche Sicht auf mein Land brauche ich gerade?“
   - **Erfolg:** Jede Linse ist mit einem Klick oder einer Taste erreichbar und an Farbe und Symbol eindeutig erkennbar. Keine zwei Linsen nutzen dieselbe Farbskala.

2. **Aufbau**
   - **Linsenleiste** unten in der Bühne: 8 runde Symbole zu je 44 px mit Tastenziffer darunter (≈ 420 × 64 px), links ab x = 76 (rechts der eingeklappten Navigation) bzw. x = 224 (ausgeklappt).
   - Über dem aktiven Symbol eine **Unterleiste** mit 2–5 Umschaltern, falls die Linse Teile hat.
   - **Legende:** rechts neben der Leiste, immer sichtbar, solange die Linse eine Färbung hat.
   - Die heutige Tafel mit 15 Kacheln und Beschreibungen (`ui/linsen/LinsenWahl.tsx`, Bild k01) entfällt. Die Beschreibung (`kurz`) erscheint beim Darüberfahren.

3. **Inhalte: aus 15 werden 8**

   | Taste | Linse (neu) | aus heutigen Ebenen (`Kartenebene`, ui/ebenen.ts Zeile 26) | Unterleiste | Farbfamilie | Darstellung |
   |---|---|---|---|---|---|
   | 1 | **Rückhalt** (Grundlinse) | `rueckhalt`, `wahl` | Rückhalt · Wahl 2028 (`ebeneName("wahl", w)`) | Purpur ↔ Grün (Rückhalt), Parteifarben (Wahl) | Fläche |
   | 2 | **Wirtschaft** | `wirtschaft`, `arbeitslosigkeit` | Leistung je Kopf · Arbeitslosigkeit | Blau/Türkis | Fläche |
   | 3 | **Netze** | `infrastruktur`, `belastung`, `versorgung` | Straße · Bahn · Belastung · Warenwege · Gas | Grün ↔ Gelb ↔ Rot nur für Belastung; Linien für Straße, Bahn und Wege | Linien und Symbole |
   | 4 | **Krisen** | `probleme`, `risiko` | Akute Probleme · Beben · Flut · Brand | Rot (einzige Rotfamilie) | Problemsymbole je Provinz; Risiko als 5 Stufen |
   | 5 | **Rohstoffe & Orte** | `ressourcen`, `strategie` | Rohstoffe · Strategische Orte | ohne Fläche | Symbole an echten Orten (`ressourcenMarken()`, `strategieMarken()`, Stage.tsx Zeile 397) |
   | 6 | **Bauen** (Bühne der Akte Land, Teil C) | `erbe` und Bau-Marken (`reichMarken`) | Baustellen · Kulturerbe | Ocker | Marken und Großprojekt-Umrisse |
   | 7 | **Welt** (Bühne der Akte Außen) | `welt` | Beziehungen · Bündnisse | `BEZIEHUNG_FARBEN` | Länderfläche, Linien, Flaggen |
   | 8 | **Lage** (Bühne der Akte Sicherheit, neu) | — (neu, aus `kriegsKarte` und `konfliktLage`) | Konflikte · Stützpunkte | Ocker/Rot für Ringe, kriegsfx-Farben | Ringe, Front, Zielräume |

   - **Entfallen:**
     - `gelaende` („Politisch“, ohne Färbung) als Linse. Grenzen, Städte und Namen liegen in jeder Linse. Wer gar keine Färbung will, schaltet die aktive Linse durch erneuten Druck auf ihre Taste aus.
     - `regionen` wird eine dauernde Grenzlinie der 7 Großregionen (dünn, ab mittlerem Zoom), keine Linse.
   - **Politiknetz (`netz`):** bleibt ohne Taste und ohne Platz in der Leiste (wie heute, `gruppe` undefiniert).
   - **Datenquellen der Färbung:** unverändert `farbenFuerEbene(w, id, …)` (ui/ebenen.ts). Neu ist nur die Zuordnung Linse → Teil-Ebene. Netze in der 3D-Karte: `versorgung` (`transportKartenDaten`) zeichnet schon Linien. In Karte2D fehlen sie; das ist dort nachzubauen.
   - **Belastung je Netz:** `belastungZeilen(w, p)` (Stage.tsx `hoverZeilen`) liefert die Netze je Provinz. Das Symbol des höchsten Netzes steht in der Provinz.

4. **Zustände**
   - Eine Linse ohne Daten fehlt nicht. Sie ist ausgegraut mit Grund beim Darüberfahren (die Regeln in `ui/linsen/linsen.ts` Zeile 14 bleiben; `lage` ist ohne Konflikt verfügbar und zeigt die Stützpunkte).
   - Bei offener Bühnen-Akte ist die Linse der Akte gesetzt. Ein Wechsel ist möglich; beim Schließen gilt `ebeneVorher`.

5. **Klicks**

   | Element | Aktion | Ergebnis | landet in |
   |---|---|---|---|
   | Linsensymbol / Taste 1–8 | Klick / Taste | Linse wechselt; ein zweiter Druck schaltet die Färbung aus | B |
   | Unterleisten-Umschalter | Klick | Teil-Ebene | B |
   | Legende | Darüberfahren über einen Eintrag | gleichfarbige Provinzen leuchten auf | B |
   | Problemsymbol (Krisen) | Klick | Provinzkarte mit diesem Problem oben | Ansicht 9 |
   | Chip „10 akute Probleme“ | Klick | Linse Krisen | B |

6. **Übernommen / gelöscht**
   - **Umgebaut:** `ui/linsen/linsen.ts` (neue Tabelle der 8 Linsen mit Teilen; `TASTE`, Zeile 33; `LINSEN_TASTEN = "12345678"`), `ui/linsen/LinsenWahl.tsx` (Leiste statt Tafel), `ui/ebenen.ts` (`LINSEN_GRUPPEN` entfällt, `KARTENEBENEN` behält die Teil-Ebenen).
   - **Gelöscht:** die Tafel (k01), der Kasten „Marken auf der Karte ?“ (`MarkenLegende` geht in die Legende über), `Plakette` („TÜRKİYE · 81 Provinzen“, Stage.tsx Zeile 1155), `Effekte` auf der Karte (Stage.tsx Zeile 1159; bleibt im Hauptmenü).

7. **Simulationsbedarf:** Für „Lage“ siehe `konfliktLage`. Für Risiko „Flut und Brand“: Prüfen, ob `data/katastrophe_risiko.json` diese Arten enthält. Wenn nicht, ist das eine Datenlücke, und die Umschalter entfallen.

8. **Texte**
   - Neu: „Rückhalt“ als Grundlinse, „Netze“, „Krisen“, „Rohstoffe & Orte“, „Bauen“, „Lage“.
   - Entfallen: „Kartenebene“, „Politisch“, „Belastung“ und „Versorgungswege“ als eigene Namen (werden Unterleiste).

9. **Abnahme**
   - Genau 8 Linsen.
   - Keine zwei Linsen mit gleicher Verlaufsfarbe (Test in `test/linsen.test.tsx`: `streifenFuer` je Linse paarweise verschieden).
   - Taste 1–8 wählt je eine Linse.
   - Grundlinse beim Spielstart ist `rueckhalt`.
   - `test/linsen.test.tsx` (Zeile 66–78 erwartet heute `"1" → gelaende`, `"0" → probleme`, `r`, `k`, `b`, `s`) wird neu geschrieben; `test/karte-marken.test.tsx` anpassen.

10. **Aufwand und Abhängigkeiten:** **M**. Vorbedingung: Linse `lage` (Ansicht 4), Linien in Karte2D.

---

#### Karte › Tasten, Zeit und Pause

1. **Frage und Erfolg**
   - **Frage:** „Ich drücke eine Taste, um etwas anzusehen. Läuft dabei die Zeit weiter?“
   - **Erfolg:** Keine Taste hat zwei Bedeutungen. Ansehen (Linse, Menü, Akte) lässt die Zeit nie anlaufen.

2. **Aufbau: Belegung**

   | Taste | Neu | Heute |
   |---|---|---|
   | Leertaste | Pause / Weiter (letztes Tempo) | Pause ↔ Tempo 1 (Stage.tsx Zeile 329–338) |
   | `+` / `=` und `−` | Tempo hoch / runter (1 → 2 → 3 → „bis zum nächsten Ereignis“) | — |
   | 1–8 | Linsen | 1–4 Tempo (`useTempoTasten`, ui/kopf/Kopfleiste.tsx Zeile 112–128) **und** 1–9 Linsen (`LinsenWahl.tsx` Zeile 100–113) |
   | 9, 0, R, K, B, S, V | frei (keine Belegung) | Linsen |
   | Esc | schließt die oberste Ebene (Ansicht 10) | je Fenster einzeln |
   | ⌘S / Strg+S | sichern (unverändert) | ebenso |
   | `/` | in Außen: Land suchen | — |

   Im Rundgang (k-1 bis k-4) griff nur das Tempo. Beide Listener hängen an `window`, und die Linsenwahl bricht ab, solange `gesperrt` wahr ist (Stage.tsx Zeile 1151: offenes Ereignis, Hinweis, Land-Popover …). `useTempoTasten` kennt keine Sperre. Folge: Zwei Spielmonate liefen, eine Entscheidung verfiel.

3. **Regeln für Zeit und Pause**
   - **Akte öffnen** hält an (heute `oeffneDossier` → `beendeZeit`, unverändert).
   - **Hauptmenü öffnen** hält an und merkt sich das Tempo. Schließen setzt das gemerkte Tempo fort, sofern der Spieler im Menü nichts am Tempo änderte. Technik: `Kopfleiste` bekommt `onMenue?: (offen: boolean) => void` (Zustand `offen`, Kopfleiste.tsx Zeile 183). Stage hält `tempoVorMenue`.
   - **Linsenwechsel** hält an (Vorgabe des Inhabers) und zeigt 2 s „Angehalten · Leertaste: weiter“. Abschaltbar im Menü unter „Beim Kartenwechsel anhalten“ (Standard an). Technik: In `onEbene` (Stage.tsx Zeile 1148) vor `setEbene` `setSpeed(0)`, wenn die Einstellung an ist.
   - **Tempo per Taste** ist gesperrt, solange ein Textfeld Fokus hat (wie heute) oder ein modales Fenster offen ist (Ereignis, Wahlabend, Umbildung). Neu ist, dass dieselbe Sperrfunktion für beide gilt: `tasteDarfWaehlen` (ui/linsen/linsen.ts Zeile 100) wird nach `ui/tasten.ts` verlegt und von Kopfleiste und Linsenwahl benutzt.
   - **Tempowechsel** zeigt 1,5 s eine Einblendung „Tempo 2“ an der Datumsanzeige.

4. **Zustände**
   - Mit Text im Fokus wirkt keine Taste außer Esc.
   - Bei modalem Fenster wirken nur Esc und ⌘S.
   - Ohne Spiel (Titel) keine.

5. **Klicks / Tasten:** siehe Tabelle unter 2. Zusätzlich zeigen die Tempo-Knöpfe der Kopfleiste die Tastenhilfe als Tooltip („Weiter: Leertaste · schneller: +“).

6. **Übernommen / gelöscht**
   - **Umgebaut:** `ui/kopf/Kopfleiste.tsx` (`useTempoTasten` auf `+`/`−`; `onMenue`), `ui/Stage.tsx` (Leertaste setzt das letzte Tempo fort; Pause bei Menü und Linse), `ui/linsen/LinsenWahl.tsx` (1–8).
   - **Gelöscht:** die Ziffern 1–4 als Tempo; die Tasten 9, 0, R, K, B, S und V für Linsen.

7. **Simulationsbedarf:** keiner. Die Einstellung „Beim Kartenwechsel anhalten“ liegt in den Oberflächen-Einstellungen (wie `Effekte`).

8. **Texte**
   - Neu: „Angehalten · Leertaste: weiter“, „Tempo 1/2/3/bis zum nächsten Ereignis“ (bestehend `st.tempo.*`), „Beim Kartenwechsel anhalten“.
   - Die Kopfzeile der Linsentafel „Tasten 1 bis 9, 0 und B“ entfällt mit der Tafel.

9. **Abnahme**
   - `test/kopfleiste.test.tsx`: Taste „2“ ändert das Tempo **nicht**, „+“ erhöht es.
   - `test/linsen.test.tsx`: „2“ wählt Linse 2 auch dann, wenn die Kopfleiste montiert ist (ein gemeinsamer Test mit beiden Listenern).
   - Neuer Test: Öffnen des Hauptmenüs setzt das Tempo auf 0, Schließen stellt es wieder her.
   - Neuer Test: Ein Linsenwechsel setzt bei aktiver Einstellung das Tempo auf 0.

10. **Aufwand und Abhängigkeiten:** **S**. Keine Vorbedingung; kann sofort umgesetzt werden (PLAN Abschnitt 6).

---

#### Karte › Provinzkarte

1. **Frage und Erfolg**
   - **Frage:** „Was ist in dieser Provinz los, und was kann ich hier tun?“
   - **Erfolg:** Ein Klick auf eine Provinz zeigt immer eine Karte, ohne dass sie die Provinz verdeckt. In der ersten Zeile steht der Wert der aktiven Linse, darunter mindestens eine Handlung.

2. **Aufbau**
   - Schwebende Karte, 320 × höchstens 420 px.
   - Sie dockt an der Seite der Provinz an, die zur Mitte des freien Feldes zeigt, mit 16 px Abstand zum Umriss. Liegt der Umriss nahe am rechten Rand der Bühne, öffnet sie links davon.
   - Sie liegt nie über der Seitenakte und nie über der Navigation.

   | Zone | Höhe | Inhalt |
   |---|---|---|
   | P1 | 56 px | Name, Region, Nr. (Plaka), × |
   | P2 | 48 px | **Linsenwert**, z. B. „Rückhalt 41“, „Arbeitslosigkeit 10,7 % (geschätzt)“, „Belastung: Wohnungen überlastet“ |
   | P3 | ≤ 120 px | **Probleme hier** als Symbole mit Namen (je Klick zur Maßnahme) |
   | P4 | ≤ 80 px | **Hier im Bau** und Vorgänge |
   | P5 | 48 px | Handlungen: „Bauen“, „Problem angehen“, ggf. „Besuch“ (offene Frage 5) |
   | P6 | — | „Daten ▸“ (aufklappbar): Einwohner, Wirtschaftskraft, Arbeitslosigkeit, Rathaus, Abgeordnete, Infrastruktur, Lage-Balken |

3. **Inhalte**
   - **Daten:** wie heute in `ui/ProvinceCard.tsx`:
     - `PROVINZEN[plaka − 1]` (sim/regional.ts): `bevoelkerung`, `bipProKopf`, `arbeitslosigkeit`, `arbeitslosigkeitHerkunft`, `buergermeister2024`, `grossstadt`, `sitze`.
     - Infrastruktur: `data/provinz_infra.json`.
     - Werte: `world.net.values` je `WERTE`.
     - Sitze: `world.parliament.byProvince[plaka]`.
     - Probleme: Knoten `kind === "problem"` über `threshold`.
     - Bau: `world.net.ziele`.
     - Vorgänge: `vorgaengeIn(world, plaka)`.
   - **P2 Linsenwert:** derselbe Wert, mit dem `farbenFuerEbene(w, ebene, …)` (ui/ebenen.ts) die Provinz einfärbt. Neue Hilfsfunktion `linsenWert(w, ebene, plaka): { text: string; ton } | null` in `ui/ebenen.ts`, damit Farbe und Zahl eine Quelle haben.
   - **P3:** Jedes Problem führt mit `gehe({ art: "politik", massnahme, theme })` (Stage.tsx `gehe`) zur passenden Maßnahme. Die Zuordnung Problem → Maßnahme stammt aus `handlungsHebel` (sim/wege.ts Zeile 108), der stärkste Hebel zuerst.
   - **P5:**
     - „Bauen“ = `onBauen(plaka)` (heute ganz unten, nur nach Bildlauf erreichbar; Bild p01 zeigt ihn nicht).
     - „Problem angehen“ = Sprung wie P3 für das schwerste Problem.
     - Im Krieg bei bedrohter Provinz zusätzlich „Zur Lagekarte“.

4. **Zustände**
   - **Ohne Probleme:** P3 entfällt.
   - **In der Linse Netze:** P2 zeigt das Netz mit der höchsten Auslastung (`belastungZeilen`).
   - **Bei offener Seitenakte:** Die Karte liegt im freien Feld.
   - **Handy:** Bodenblatt über der Linsenleiste.

5. **Klicks**

   | Element | Aktion | Ergebnis | landet in |
   |---|---|---|---|
   | Provinz | Klick | Provinzkarte (immer, in jeder Linse, auch bei offener Transporttafel) | Ansicht 9 |
   | Andere Provinz | Klick | Die Karte wandert | Ansicht 9 |
   | Problemsymbol | Klick | Maßnahme in der Politik | Politik (Teil A) |
   | Bauen | Klick | Netzansicht mit Ort (`setNetOrt([p])`, `setDossier("netz")`) | Land / Netze |
   | Vorgang | Klick | `zeigeVorgang(id)` | Land › Vorgänge |
   | Daten ▸ | Klick | aufklappen | Ansicht 9 |
   | × / Esc / Klick ins Meer | — | schließt | Karte |

6. **Übernommen / gelöscht:** `ui/ProvinceCard.tsx` wird umgebaut (Reihenfolge, Andocken, `linsenWert`). Die feste Lage `right: 22px; top: 84px; z-index: 4` (styles.css Zeile 259) entfällt.

7. **Simulationsbedarf:** keiner.

8. **Texte:** „Probleme hier“, „Hier im Bau“, „Daten“, „Problem angehen“. Zahlen wie in der Quelle (Einwohner mit Punkt, Prozent mit einer Stelle).

9. **Abnahme**
   - Die Karte verdeckt den Umriss der gewählten Provinz nicht (Test: Begrenzungsrechteck der Provinz und der Karte schneiden sich nicht, bei drei Testprovinzen am Rand: Edirne 22, Hakkari 30, Hatay 31).
   - Ein Provinzklick bei offener Transporttafel zeigt die Karte (Behebung von p01).
   - „Bauen“ steht ohne Bildlauf.

10. **Aufwand und Abhängigkeiten:** **M**. Vorbedingung: Ebenenordnung (Ansicht 10).

---

#### Karte › Ebenenordnung (z-order) und Überdeckung

1. **Frage und Erfolg**
   - **Frage:** „Warum verdeckt das eine das andere?“
   - **Erfolg:** Kein Bedienelement liegt über einem anderen, das gleichzeitig gebraucht wird. Jede Ebene hat eine feste Zahl, und Esc schließt immer die oberste.

2. **Aufbau: feste Ebenen** (neue CSS-Variablen in `ui/styles.css`, `--z-…`)

   | Ebene | z | Elemente (heutiger Wert) |
   |---|---|---|
   | Karte | 0 | `AtlasMap`, `Karte2D` |
   | Kartenschichten | 5 | `.atlas-transport` (5), Effektschicht |
   | Kartenwerkzeuge | 10 | Linsenleiste (`.linsen`, heute 8), Legende, `.karten-werkzeuge` (6) |
   | Schwebende Kartenkarten | 20 | Provinzkarte (`.province-card-float`, heute **4**), Land-Popover, Hover-Kärtchen |
   | Seitenakte | 30 | `.seitenakte` (neu); die Transporttafel `.tr-tafel` (heute 9) wird Inhalt der Linse Netze und rückt als Teil der Bühne auf 30 |
   | Navigation | 40 | `.regierungs-navigation` (heute 100) |
   | Papierakte | 50 | `.dossier` (heute 50, Handy 8) |
   | Kopfleiste | 60 | `.hud.kf` (heute 160 mit offenem Menü) |
   | Tafeln | 70 | Hauptmenü, Werte-Tafel (`.hud-wahl-tafel` 60) |
   | Modale Fenster | 80 | Ereignis, Wahlabend, Umbildung, Wunderfenster |
   | Meldungen | 90 | Chips und Toasts (heute 120) |

3. **Regeln**
   - **R1:** Eine Tafel öffnet nie unter der Navigation. Die Linsenleiste beginnt rechts der Navigation (`left` = Breite der Navigation + 12 px). Heute: `.linsen { left: 96px; z-index: 8 }` (ui/linsen/linsen.css Zeile 5) unter der Navigation (z 100, Breite 200), daher ist die erste Spalte verdeckt (Bild k01).
   - **R2:** Höchstens eine schwebende Kartenkarte zugleich (Provinzkarte **oder** Land-Popover). Die neue schließt die alte.
   - **R3:** Eine schwebende Karte verdeckt nie ihren eigenen Gegenstand (Ansicht 9).
   - **R4:** Die Seitenakte und die Papierakte schließen sich gegenseitig aus.
   - **R5:** Kartenwerkzeuge weichen der Seitenakte aus. Ihr rechter Rand ist der linke Rand der Seitenakte.
   - **R6:** Esc schließt in dieser Reihenfolge: Tafel → modales Fenster (nur wenn es schließbar ist) → schwebende Karte → Länder- oder Konfliktwahl in der Seitenakte → Seitenakte oder Papierakte.
   - **R7:** `UI_SPERREN` (AtlasMap.tsx Zeile 144) enthält alle Ebenen ab 10, damit Kartenbeschriftungen ausweichen.

4. **Zustände:** Handy (≤ 720 px). Die Navigation ist Schalter plus Blatt (heute z 150, navigation.css Zeile 10); sie liegt auf Ebene 40 und unter modalen Fenstern (die Kommentarzeile in navigation.css Zeile 11 beschreibt genau diesen Fehler).

5. **Klicks:** keine eigenen; siehe R6 für Esc.

6. **Übernommen / gelöscht:** Die verstreuten `z-index`-Werte in `styles.css` (Zeile 223, 241, 259, 1741), `navigation/navigation.css`, `linsen/linsen.css`, `atlas/marken.css` (Zeile 105), `gueter/transport.css` (Zeile 15) und `kopf/kopf.css` (Zeile 8) ersetzt die Variablentabelle.

7. **Simulationsbedarf:** keiner.

8. **Texte:** keine.

9. **Abnahme**
   - Neuer Test `test/ebenen-ordnung.test.ts` liest die CSS-Dateien und prüft, dass jeder `z-index` eine der Variablen ist.
   - UI-Test: Linsenleiste und Navigation überschneiden sich nicht (Begrenzungsrechtecke, 1440×900).
   - Provinzkarte und `.karten-werkzeuge` überschneiden sich nicht.

10. **Aufwand und Abhängigkeiten:** **S**. Sofort umsetzbar; Vorbedingung für die Ansichten 1 und 9.

---

## Fehlerliste (aus Kritik D, mit Ort und Behebung)

| # | Fehler | Ort | Behebung |
|---|---|---|---|
| 1 | „Krieg läuft“ schon in Phase Spannung | `ui/militaer/Streitkraefte.tsx` Zeile 179: `...(kriege.length ? { …marke: krieg_laeuft } : {})` | Marke nur bei `kriege.some(k => k.phase === "krieg")`. Sonst `PHASEN_NAME[k.phase]` des schwersten Vorgangs als Marke. |
| 2 | Kopf „Laufende Konflikte 2“, Liste 7 Zeilen | `ui/akte/Bereiche.tsx` Zeile 111–115 (Kopf `aktiveKriege(w).length`) gegen `ui/akte/Konfliktlage.tsx` Zeile 13–21 (Vorgänge plus angespannte) | Beide aus `konfliktLage(w)`. Kopf „Konflikte 2 · Spannung 5“. |
| 3 | EU als Konfliktgegner in der Sicherheitslage | `ui/akte/Konfliktlage.tsx` Zeile 16 | Filter `!ohneKriegsvorgang(l.id)` (sim/krieg.ts Zeile 1350) auch für die Liste der angespannten Länder. Die EU-Spannung bleibt in Außen. |
| 4 | NATO „14 Mitglieder“ statt 32 | `ui/akte/Bereiche.tsx` Zeile 205: `t("akte.b.lage.paktMitglieder", { n: p.mitglieder.length })` | `n = p.mitglieder.length + (institution.weitereMitglieder ?? 0)` aus `data/welt-institutionen.ts` (Zeile 47: NATO `weitereMitglieder: 18`). Gleiches für G20. |
| 5 | Altay „noch 11 Monate“ gegen „fertig in 25 Monaten“ | doppeltes Modell `START_BESCHAFFUNGEN` (data/streitkraefte.ts) gegen Reich-Vorhaben `mil_altay` (data/reich/militaer.ts Zeile 95) | Kopplung (Ansicht 5, Simulationsbedarf). Bis dahin zeigt die Streitkräfte-Karte das Datum aus `bauplan`. |
| 6 | „Was Sie jetzt in Auftrag geben können“ zeigt Vorhaben im Bau | `ui/akte/Bildkarten.tsx` Zeile 29–32 (`rang: bau 0, moeglich 1, verlangt 2`) | Für diesen Block `z !== "bau"` filtern. Die Zahl in „Alle 16 Vorhaben“ (Zeile 81) muss dieselbe Zählweise wie das Unterreiter-Abzeichen haben (heute 16 gegen 8). |
| 7 | KAAN-Kosten als unbeschriftete Symbole (8 · 2.000 · 48 · +0,7 · 2,5) | `ui/akte/Bildkarten.tsx` (Kostenchips) | Jedes Symbol mit Wort: Kapital, Bau, Monate, Haushalt, Verwaltung. |
| 8 | Tasten 1–4 doppelt (Tempo und Linse); die Linse ist bei offenem Ereignis gesperrt, das Tempo nie | `ui/kopf/Kopfleiste.tsx` Zeile 112–128; `ui/linsen/linsen.ts` Zeile 32–33; `ui/Stage.tsx` Zeile 1151 | Tempo auf `+`/`−`/Leertaste; Linsen 1–8; eine gemeinsame Sperrfunktion (Ansicht 8). |
| 9 | Hauptmenü und Linsenwechsel halten die Zeit nicht an | `ui/kopf/Kopfleiste.tsx` Zeile 183 (`offen` ohne Rückmeldung); Stage.tsx `onEbene` Zeile 1148 | `onMenue` mit Pause und Fortsetzen; Pause bei Linsenwechsel (Ansicht 8). |
| 10 | Linsentafel unter der Navigation | `ui/linsen/linsen.css` Zeile 5 (`left: 96px; z-index: 8`) gegen `navigation.css` Zeile 3 (`z-index: 100`, Breite 200) | Ebenenordnung R1. |
| 11 | Provinzklick bei offener Versorgungstafel zeigt nichts | `.province-card-float` z 4 (styles.css Zeile 259) unter `.tr-tafel` z 9 (gueter/transport.css Zeile 15), gleiche Ecke rechts oben | Ebenenordnung und Andocken an der Provinz (Ansicht 9). |
| 12 | Provinzkarte verdeckt die gewählte Provinz (Mardin) und wird von „Marken auf der Karte“ überdeckt | `.province-card-float` (rechts fest) und `.karten-werkzeuge` z 6 (atlas/marken.css Zeile 105) | Andocken (Ansicht 9), Ebene 20 über den Werkzeugen. |
| 13 | 2D-Karte: keine Namen, keine Flaggen, keine Warenwege, kein Weltausschnitt | `ui/atlas/AtlasMap.tsx` Zeile 1335 reicht nur 6 Eigenschaften an `Karte2D` durch; `data/nachbarn.json` endet bei 17,5–52,5° O | `labels`, `laenderPins`, `linien`, `ringe`, `versorgung` und `sichtRand` an Karte2D. Weltgeometrie als Datenlücke (Ansicht 1). Im Rundgang war die 2D-Karte aktiv („Vereinfachte Karte“); viele Befunde in k00–k-v gehen darauf zurück. |
| 14 | Kopfleiste zeigt die wahre Zustimmung (50 %), die Zeitung die veröffentlichte (54,2 %) | `ui/Stage.tsx` Zeile 429 (`spiel.umfrage.zustimmung`) gegen `angezeigteZustimmung(w)` (sim/medien.ts Zeile 863, „Was die Oberfläche als Zustimmung zeigt“) | Entscheidung nötig (offene Frage 1). Bis dahin beide Werte benennen. |
| 15 | „Zum Vergleich“ mit Türkei-Werten von 2025 (Inflation 34,9 %) | `ui/Welt.tsx` (`daten from "../data/vergleich.json"`) | Die Türkei-Spalte entfällt oder nimmt die Spielwerte (Kopfleiste); die Gegenseite bleibt mit Jahresangabe unter „Hintergrund“. |
| 16 | Wiederholter Text „Letzte Wahl“ = „Was sich zuletzt geändert hat“ | `ui/welt/WeltLage.tsx` (`letzteWahl` und `jungeNachrichten` zeigen denselben Machtwechsel) | Den Eintrag aus `jungeNachrichten` mit `art: "machtwechsel"` nicht zeigen, wenn `letzteWahl` denselben Tag hat. |
| 17 | Bilanzkurven zeigen in Außen und Sicherheit nur die Zustimmung, Achse 50–52 | `ui/akte/Bereiche.tsx` `verlaufsReihen` (Zeile 374–392) | Reiter entfällt (Ansicht 1). Bis dahin beginnt die y-Achse bei 0 oder trägt das Etikett „Ausschnitt“. |
| 18 | Zwei Wehrdienst-Hebel | `m_wehrdienst` (data/politiknetz.ts Zeile 1373) und `setzeWehrdienst` (sim/streitkraefte.ts Zeile 381) | Auf einen festlegen (offene Frage 2). |
| 19 | „Das Kriegsziel umfasst 1 Regionen“ | Katalog `militaer.*` (i18n/katalog/de/militaer.json) | Pluralform (`_one`/`_other` bzw. Zahlwort). |
| 20 | Sidebar-Zähler Medien zählt jede ungelesene Ausgabe (22, 24 …) | `ui/Stage.tsx` Zeile 598 (`umlauf: spiel.zeitung.ungelesen`) | ruhiger Punkt ohne Zahl. |
| 21 | Linsen Arbeitslosigkeit, Akute Probleme und Katastrophenrisiko gleich rot | `ui/ebenen.ts` `farbenFuerEbene` (Verläufe) | Farbfamilien je Linse (Ansicht 7), Test auf Verschiedenheit. |
| 22 | Versorgungswege: „24 Korridore“, aber keine Linie (2D) | Karte2D ohne `versorgung` | siehe 13. |

## Offene Fragen (höchstens fünf)

1. **Zustimmung in der Kopfleiste.** Die Sim unterscheidet bewusst zwischen der wahren Zustimmung (`umfrage.zustimmung`) und der veröffentlichten (`angezeigteZustimmung`, mit Institut, Streuung und gekauften Rohdaten). Die Kopfleiste zeigt heute die wahre Zahl und macht damit die Mechanik „Rohdaten kaufen“ wertlos. Soll die Kopfleiste die veröffentlichte Zahl zeigen (mit Institut) und die wahre nur nach dem Kauf der Rohdaten?
2. **Wehrdienst.** Gilt die Maßnahme `m_wehrdienst` (Stufe 0–100) oder `setzeWehrdienst` (0, 6, 12 oder 18 Monate)? Vorschlag: Die Maßnahme ist führend, die Stufen werden auf die vier Monatswerte abgebildet.
3. **Putschneigung des Generalstabs.** Soll sie als dauernde Zahl im Kopf der Sicherheit stehen? Heute gibt es sie nur als `putsch`-Ereignis nach einer Niederlage (krieg-typen.ts). Eine Dauergröße wäre eine neue Spielregel.
4. **Rundfunkaufsicht (RTÜK) und Kommunikationsdirektion** als Personen? Beide sind keine Ministerien. Ohne Figur bleiben in den Medien nur Präsidialamt und Inneres als Porträts.
5. **„Besuch“ in der Provinzkarte.** Soll es einen Provinzbesuch des Präsidenten geben (heute nur im Wahlkampf, `test/wahlkampf-reisen.test.tsx`)? Wenn nicht, hat die Provinzkarte nur „Bauen“ und „Problem angehen“.
