# Das Spiel in jeder Facette durchdacht (Gesamtplan, 05.10.2026)

Grundlage: elf Prüfberichte (Wahl und Amtszeit; Kabinett und Personen; Parlament, Gesetz, Justiz; Gesellschaft, Opposition, Medien; Wirtschaft; Außen, Sicherheit, Migration; Land, Regionen, Katastrophen; Spielfluss und Lernen; Kopplungsanalyse mit Messwerten; Spektrum, Start, Partei) und die frühere Prüfung von Krieg, Bündnissen und Ansichten. Offen: die Messung der Simulationsläufe (Prüfer 10). Zahlen im Text sind Messwerte oder Verweise auf Codezeilen; Aussagen über die Wirklichkeit sind „zu prüfen“, bis sie im Projekt belegt sind.

## 1. Befund in einem Satz

Das Spiel besteht aus starken Einzelsystemen (Makrowirtschaft, Katastrophenkette, Wahlkampf, EU-Beitritt, Ministerfluss), aber die Verbindungen zwischen ihnen sind dünn, das Gedächtnis ist kurz, und die Gegenüber (Parlament, Kabinett, Opposition, Medien, Ausland) sind Statisten. Die Wahlnacht 2033 war nur das sichtbarste Beispiel.

## 2. Sieben Grundursachen (gelten quer durch alle Facetten)

**U1. Stoß statt Zustand.** Fast jede Wirkung ist ein Impuls, der innerhalb von 6 bis 24 Monaten zum Startwert zurückklingt (`wirkung.ts`, `netz.ts:255`). Räumung, Anschlag, Fluchtwelle, Katastrophe, Verhaftungen, Streikverbot: Nach zwei Jahren ist nichts übrig. Es fehlen **Bestände und Vorgänge**: Bewegungen, Verfahren, Flüchtlingsbestand, Narben der Region, Rathäuser, Friedensprozess. (Berichte 4, 6, 7, 9)

**U2. Ein Netz, das nur in eine Richtung wirkt.** Gemessen: 931 Kanten, keine einzige führt in eine Maßnahme; zwei Gesetze wirken immer nur addiert. Nur 2 einfache Schleifen, keine mit einem Hebel. Alle 11 Gesellschaftsgruppen sind Senken. 1.180 direkte Eingriffe laufen am Netz vorbei. Alle Maßnahmen auf 100: 92 von 135 Größen am Anschlag, es gibt keinen eigenen Gegendruck. (Bericht 9)

**U3. Statische Akteure.** Das Parlament wird einmal gewählt (`prolog.ts:330`), das Kabinett kennt keine Zeit (kein Alter, keine Neuzugänge), die Opposition ist keine Zustandsgröße, Medien sind Daten ohne Mechanik, Partner brechen nie, das Ausland ist ein Nachrichtengenerator. Fremde Staaten sind besser modelliert als die Türkei (Herausforderer, Kurs, Machtwechsel). (Berichte 1 bis 4, 6)

**U4. Keine Zäsuren, zu wenige Enden.** Wahl, Halbzeit, letzte Amtszeit, Rückschau: nichts davon ist eine Phase. Enden: Wiederwahl, Abwahl, Sturz, Amtszeitende. Putsch, Rücktritt, Amtsenthebung, Attentat fehlen; der Typ „wiederwahl“ ist definiert und wird nie gesetzt. (Berichte 1, 2, 8)

**U5. Ein schmaler politischer Korridor.** Der Start bietet vier Parteimuster der Mitte und zwei Bündnisse. Es fehlen ganze Pole (Verstaatlichung, Parteiverbot, Kopftuch, Autonomie, NATO-Austritt, Kriegsrecht). Es gibt keinen Regimetyp der Türkei. Reaktionen richten sich fast nur gegen „autoritär“; Repression ist billig, weil Nationalisten und Minderheiten keine ausgehenden Kanten haben. Der Test-Bot ist technokratisch kalibriert. (Bericht 11)

**U6. Anzeige ohne Wirkung, Wirkung ohne Anzeige.** Medien-Preise und Verwundbarkeit, 45 Größen ohne Schreiber, Diaspora-Daten, `katastrophenMarken`, `DIASPORA_EREIGNISSE` haben keinen Verbraucher; umgekehrt zeigt das Provinzblatt nicht, was das Spiel tatsächlich rechnet. (Berichte 4, 7, 9)

**U7. Fehler, die sich als Design tarnen.** Siehe Abschnitt 4.

## 3. Wellenplan

**Welle 2 „Wahl und Neuanfang“** (Auslöser dieses Plans)
- Wahlergebnis-Objekt, Herausforderer, Stichwahl, **Parlamentswahl am selben Tag** mit Sitzrechnung, Hürde und Koalitionsrunde, Provinzergebnisse.
- Wahlabend als Ansicht (Hochrechnungslauf, Karte, Sitze vorher und nachher, Reaktionen von Opposition, Ausland, Märkten, Siegesrede als Entscheidung).
- **Amtszeit 2 beginnt:** Umbildungsfenster (behalten, versetzen, entlassen, Partnerressorts), neue Ziele (`ZielWahl`), Zwischenbilanz, Müdigkeit je Amtszeit.
- Letzte Amtszeit: Kronprinzen-Tableau, Nachfolger-Kampagne, Vermächtnis in der Bilanz; Wahl 2 getrennt kalibrieren.
- Außenpolitik in Wahlversprechen und Ziele (heute keines von 22).

**Welle 3 „Das Netz atmet“**
- Kanten aus Bericht 9 (Rezession, Energiepreis, Migration und Wohnen, Polarisierung und Sicherheit, Senken anbinden).
- Protestdruck als Größe mit Schleife aus Repression; Gruppen als Quellen; Produktkanten für gemeinsam wirkende Maßnahmen; Gewöhnung und Sättigung; Marktschocks bei Politik (Wahl, Verhaftung, Notstand).
- Jede Änderung mit Vorher-Nachher-Messung (Bot, mehrere Seeds) gegen die Kalibrierung.

**Welle 4 „Lebendige Gegenüber“**
- Opposition als Zustand (Führung, Kandidat, Bündnis, Bürgermeister), Kommunalwahl alle fünf Jahre mit Rathäusern je Provinz, Zwangsverwalter als Ortszustand.
- Bewegungen (Größe, Radikalität, Märtyrer, Groll), Medienzustand je Cluster (Lizenz, Selbstzensur, Reichweite).
- Figuren mit Zeit (Alter, Krankheit, Aufsteiger-Pool), Ehemalige als Akteure, Vizepräsident, Partei-Ebene mit Flügeln.
- AYM-Kontrolle normaler Gesetze, inhaltsabhängige Fraktionsabstimmung, Koalitionsleben, Notstand mit Frist.

**Welle 5 „Das ganze Spektrum“**
- Parteikonfigurator mit fünf Achsen; Startszenarien (Neugründung, Regierungspartei, Opposition nach Machtwechsel, Übergangsregierung nach Krise).
- Regimemodell der Türkei (Demokratie, hybrid, autoritär, Militär) mit Hysterese; fehlende Pole als Maßnahmen; Reaktionsmatrix je Pol (Armee, Justiz, Märkte, Ausland, Straße, Putsch); Neutralitätstest je Pol.

**Welle 6 „Welt und Gebiet“**
- Weltmodell mit Türkei koppeln (Öl, EU-Nachfrage, Flucht, Terror, Energie), Friedensprozess als Vorgang, Terror mit Tätern, Energie-Außenseite, Außenkalender.
- Krieg mit Regionen, Besatzung, Annexion und Friedenskonferenz; Oberfläche für Pakte und Koalitionen; Karten-Linsen für Front und Bündnisse.

**Welle F „Agenda und Wissen“** (nach Welle 3): Fokusbaum, Forschungsbaum mit Eureka, Doktrinen; Baumansichten und Abschlussszenen. Konzept: `FOKUS_FORSCHUNG_KRIEG_KONZEPT_2026-10-05.md`.

**Welle K „Krieg wie HOI4“** (ersetzt den Kriegsteil von Welle 6): Regionen, Verbände, Fronten, Nachschub, Besatzung, Annexion, Friedenskonferenz, Fertigung; Kriegs-Linse und Akte.

**Welle A „Animationen wie Civ 6“** (läuft mit F und K): Karte, Baum- und Abschlussszenen, Diplomatieszenen.

**Quer dazu laufen:** Karte und Animationen (Konzept `KARTE_KONZEPT_2026-10-04.md`), Türkisch und Englisch (`SPRACHEN_KONZEPT_2026-10-04.md`: ab sofort laufen alle neuen Texte über `t()` und `msg()`), Lernen (Wirkungsberichte für Ereignisse, Jahres- und Halbzeitbilanz, Mentorin).

## 4. Sofort-Reparaturen (Fehler aus den Berichten)

1. **Katastrophen schließen nicht:** `privatDeckel` 0,25 gegen Schwelle 0,95 (`katastrophe.ts:75,653,659`); betroffen sind alle Fluten, Dürren, Waldbrände und Beben unter 1000 Wohnungen; bei 500 bis 999 wird eine Zusage angeboten, obwohl der Bau verboten ist (`katastrophe.ts:504`). Zähler und Badge bleiben dauerhaft.
2. **Doppelquellen:** alte Ereignisse für Beben, Waldbrand, Überschwemmung, Dürre laufen neben dem Modul weiter (`ereignisse.ts:1001-1003`).
3. **Ereignis „Lira rutscht“, Option „Reserven“:** Der Text sagt „Reserven sinken“, der Code ändert sie nicht (`ereignisse.ts:220-226`); `interveniere()` kostet für 4 % rund 10 Mrd.
4. **Kabinettshebel:** `economy.growth += 0.4` wird im nächsten Monat überschrieben, `deficit −0.6` ist kostenlos (`kabinett.ts:274,309`).
5. **Hürden widersprechen sich:** Code 301/360 (`verfassung.ts:43`), Oberfläche und Prolog 360/400 (`Parliament.tsx:44`, `ParlamentKopf.tsx:66`).
6. **Texte gegen Entscheidung:** „kostet später Gegenleistungen“ (`handeln.ts:328`) gegen „Stimmenkauf ohne Nachspiel“ (`ENTSCHEIDUNGEN.md:153`).
7. **Kleinfehler:** AYM-Sitzbug (`ereignisse-reich.ts:320`), HSK ohne Ereignis, `figur("partner")` liefert nur den ersten, Gouverneurname bleibt (`eingriffe.ts:34`), „von 2“ hartkodiert (`Chronik.tsx:36`), Doppelkante `industrie>arbeitsplaetze_industrie`, `anwaltsautonomie` ohne Anschluss, Ziel „Schulden 30“ ist beim Start erfüllt, in der Prolog-Wahlnacht ist „54 %“ strikt besser als „50,6 %“, Zinssitzungen und OVP fehlen im Terminblatt.

## 5. Prinzipien für alles Folgende

- **Zustand vor Stoß:** Was über Monate gilt, wird als Bestand oder Vorgang geführt.
- **Jede Entscheidung hat Preis, Ort und Gegenwirkung**, in jeder politischen Richtung gleich glaubhaft.
- **Jede Anzeige hat ein Verbraucher, jede Wirkung eine Anzeige.**
- **Jedes neue Modul bringt**: Spielstand-Migration (Vorgabewerte beim Laden), Tests, Messung (Bot, Seeds), Texte über `t()`.
- **Neutralität:** keine Richtung wird belohnt oder verboten; Moral ist nicht eingebaut, Folgen sind es.

## 6. Messwerte aus 100 Simulationsläufen ohne Oberfläche (Prüfer 10)

Methode: Prolog-Start Juni 2028 bis Juni 2038; Bot „passiv“ (erste Antwort, 40 Seeds) und „fleißig“ (Ministerempfehlung, Vorlagen, ein Gesetz je Quartal, Wahlkampf; 12 Seeds); dazu Schwierigkeit „hart“ und eine Kriegsprobe. Rohdaten: Scratchpad `telemetrie/`. Nicht abgebildet: Karte, Gespräche, Haushaltsentwurf, Reich-Projekte, EU-Verhandlung, Erlass, Stimmenkauf.

- **Nichtstun gewinnt:** Passiv 37 von 40 Wiederwahlen (93 %), fleißig 12 von 12. Ein Sturz kam in 100 Läufen nie vor (tiefste Zustimmung 42, Schwelle 25). Die Inflation fällt ohne Zutun von 23 auf 5 % in zehn Jahren (Realismus zu prüfen). Das Kapital liegt in 74 % der Monate am Deckel von 150.
- **Das Parlament bewegt sich nie:** 0 Sitzänderungen in 100 Läufen; das Regierungslager wechselt in 1 von 40 passiven Läufen; das Kabinett wechselt passiv in 3 von 40.
- **Nach der Wiederwahl ändert sich nichts:** Entscheidungen 9,9 in den 12 Monaten davor, 2,4 in den 3 Monaten danach; Kabinettswechsel und Sitze 0. Das nächste Entscheidungsereignis kommt im Mittel nach 39 Tagen.
- **Starrer Takt:** 97 % der Ereignisse öffnen am Monatsersten; Januar bis Juni nur 0,6 Entscheidungen je Monat, Oktober und Dezember 1,8 und 1,7. 39 % der Monate haben kein Entscheidungsereignis; 26 Lücken über 60 Tage je Lauf.
- **Wiederholung:** 61 % der Entscheidungen wiederholen eine Kennung desselben Laufs; vier Kennungen (haushaltsjahr, mindestlohn, welt_machtwechsel, welt_krise) machen ein Drittel aus. 21 % der 87 definierten Ereignisse lösen nie aus (u. a. eu_veto, eu_zollunion, krieg_waffenruhe, person_intrige).
- **Zusage-Flut:** Alle Wahlversprechen werden 365 Tage nach der Wahl am selben Tag fällig (21 Entscheidungen in Jahr 7 beim fleißigen Bot).
- **Sättigung:** Am Ende stehen Vertrauen, Legitimität, Produktivität und Realeinkommen auf 100, Armut und Streikneigung auf 0; `m_mindestlohn` steht in 51 von 52 Läufen auf 100, ohne sichtbare Gegenwirkung (Arbeitslosigkeit bleibt bei 9 %).
- **Katastrophen ohne Folge:** Bis 86.607 Tote lassen die Zustimmung nicht einbrechen (drei Monate danach +0,26 gegen +0,07 in der Kontrolle; ob gewollt, zu prüfen).
- **Krieg:** 0 von 76 Läufen ohne eigenen Beschluss. Die Falkenprobe verlor 10 von 10 Kriegen gegen Iran nach 98 bis 126 Tagen bei kaum fallender Zustimmung (1 bis 5 Punkte); Balance zu prüfen.
- **Personal erstarrt:** Die Ereignisse `person_*` brauchen Unmut und bleiben aus. 313 Kabinettssitzungen je Lauf, weil „rebellisch“ die 45-Tage-Sperre aufhebt, bei nur drei Themen.
- **Hinweisflut:** 148 Hinweise der Klasse C je Lauf; fast die Hälfte der B-Hinweise ist der jährliche EU-Bericht.

Folgerungen für die Wellen: In Welle 2 gehören Staffelung der Zusagen und eine Saison-Füllung (Januar bis Juni) dazu; in Welle 3 Gegenkräfte (wachsende Altlasten, Kapitalverfall über 100, Fristen mit Folgen, Misstrauensvotum), Katastrophenfolgen nach Toten und Hilfsstand, die Prüfung der Kriegsbalance und ein Messskript als Regressionstest mit Schwellen.
