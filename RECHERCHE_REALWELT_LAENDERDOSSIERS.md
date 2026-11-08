# RECHERCHE_REALWELT_LAENDERDOSSIERS.md — Akteurs-Dossiers für „Staatsräson"

**Erstellt:** 30. September 2026 · **Datenstichtag Spiel:** 25.09.2026 · **Spielstart:** Juni 2028
**Zweck:** Realwelt-Dossiers der 18 Verhandlungspartner (17 Länder + EU) als Kalibrierungsgrundlage für `game/src/sim/laender.ts` und `game/src/data/abkommen.ts`. Ergänzt `RECHERCHE_WELTDATEN.md` (Statistik-Seite) um die Akteurs-Seite.
**Konventionen:** Jede Zahl mit (Quelle, Datum). `[unverifiziert]` = plausible Größenordnung ohne harte Bestätigung in dieser Recherche. Echte Personennamen nur für die Recherche; im Spiel gilt: **[→ Spiel: erfundener Name nötig]**. Währung USD, wenn nicht anders angegeben. „Handel" = Warenhandel bilateral (Exporte + Importe).

## Inhaltsverzeichnis

- **Teil I — Dossiers der 18 Spiel-Akteure**
  1. USA · 2. EU · 3. Russland · 4. Griechenland · 5. Iran · 6. Syrien · 7. Irak · 8. Ukraine · 9. Georgien · 10. Aserbaidschan · 11. Armenien · 12. Saudi-Arabien · 13. Israel · 14. Ägypten · 15. Libyen · 16. Kasachstan · 17. Zypern
- **Teil II — Bonus-Dossiers (kurz):** Deutschland, China, Großbritannien, Katar
- **Teil III — Beziehungsmatrix 2026** (18 × 4 Dimensionen, Startwerte 0–100, mit Code-Abgleich)
- **Teil IV — Konflikt-Topologie** (Konflikte zwischen Dritten; Vermittlungs-Mechanik)
- **Teil V — Übertrag ins Spiel** (Code vs. Realität, Stichproben `abkommen.ts`/`laender.ts`)
- **Unsicherheits-Register**
- **Teil VI — Ereigniskalender bis Spielstart Juni 2028** (Wahlen, Vertragsläufe, Fristen)
- **Quellenverzeichnis (Auswahl)**

## Methodik und Weltlage in einem Absatz

Alle Angaben wurden am 30.09.2026 per Websuche gegen aktuelle Quellen (Reuters, AP, IWF WEO April/Juli 2026, OECD Economic Outlook Sept. 2026, Weltbank GEP Jan. 2026, EBRD Juni 2026, TÜİK, UN Comtrade u. a.) geprüft. Die Weltlage am Stichtag ist kriegsgeprägt: Seit dem 28.02.2026 führen USA und Israel Krieg gegen den Iran (Operation „Epic Fury"), Oberster Führer Ali Khamenei wurde bei der Eröffnungswelle getötet, die Straße von Hormus ist faktisch geschlossen (1 Transit/Tag vs. ~85 im Frieden, IMF PortWatch 20.09.2026), ein fragiles Waffenruhe-Memorandum (Islamabad, Juni 2026) hält, Gespräche laufen über Katar/Oman (House of Commons Library, 04.09.2026; straits.live, 26.09.2026). Brent ~104–105 $/bbl (Angel One/ straits.live, 28.09.2026). Der Russland-Ukraine-Krieg läuft im 5. Jahr ohne Waffenruhe (LIGA.net, 30.09.2026). Der Südkaukasus ist dagegen im Friedensprozess: Armenien–Aserbaidschan parafierten am 08.08.2025 einen Friedensvertrag inklusive TRIPP-Korridor (Carnegie, 06/2026).

---

# TEIL I — Dossiers der 18 Spiel-Akteure

## 1. USA

**Zustand Sept. 2026.** Präsidialrepublik; Präsident Donald Trump [→ Spiel: erfundener Name nötig], Außenminister Marco Rubio [→ Spiel]. Führt seit 28.02.2026 zusammen mit Israel Krieg gegen den Iran und hält eine Seeblockade iranischer Häfen; Kriegskosten offiziell 37,5 Mrd. $ (Hegseth, Senat Juli 2026), externe Schätzung bis 72 Mrd. $ (Center for International Policy, Mai 2026). Wirtschaft: BIP ~31,8 Bio. $, Wachstum 2,3–2,4 % 2026, Inflation ~3,2 % (IWF Art.-IV, 06/2026; WEO 04/2026); Defizit 7–8 % des BIP, Schulden Richtung 140 % BIP bis 2031 (IWF, 06/2026). Hauptbaustelle: Midterms 04.11.2026 bei Benzinpreisen über Vorkriegsniveau; Trump schließt neue Iran-Schläge vor den Midterms nicht aus (Fox News, 28.09.2026).

**Beziehung zur Türkei heute.** Handel 2025: Exporte der Türkei 16,33 Mrd. $ (3. größter Markt), Importe ~16 Mrd. $ → **~32 Mrd. $** (TÜİK, 01/2026; OEC, 09/2026); politisches Ziel 100 Mrd. $ unverändert. Konfliktlinien: (a) CAATSA-Sanktionen gegen die Rüstungsbehörde SSB seit 2020 — Trump sagte am 07.07.2026 beim NATO-Gipfel in Ankara deren Aufhebung zu, aber NDAA §1245 und der Kongress blockieren (CRS IN12710, 14.07.2026; JPost, 24.07.2026); (b) S-400-Verbleib — Washington prüft Formeln für Verlagerung/Einlagerung, Lawrow signalisierte am 27.09.2026 Offenheit für Verlegung in einen Drittstaat (GreekReporter, 27.09.2026); (c) Hamas-Finanznetzwerke in der Türkei; US-Sanktionen gegen Golden Global Yatırım Bankası am 04.09.2026 (US Treasury via Gregory Glaros, 28.09.2026). Kooperation: F110-Triebwerksdeal (~80 Triebwerke für KAAN, Kongress notifiziert 06/2026), US-LNG-Langfristverträge (Mercuria 4 bcm/a über 20 Jahre ab 2026, erste Cargos 09/2026), Vermittlungskanäle Ukraine und Gaza (Nordic Monitor, 02.09.2026). Zustand in einem Satz: Bester Stand seit Jahren auf Führungsebene (Trump-Erdoğan-Reset nach Weißes Haus 25.09.2025 und NATO-Gipfel Ankara 07/2026), aber das Sanktions- und Rüstungsrecht des Kongresses bremst die Umsetzung.

**Rote Linien (niemals akzeptieren):** (1) Betrieb/Behalt der S-400 bei F-35-Rückkehr (NDAA §1245); (2) türkische Banken als Sanktionsumgehungskanal für Iran/Russland; (3) Waffen für Hamas oder Hamas-Führungsstrukturen auf türkischem Boden in Richtung operativer Nutzung; (4) einseitige türkische Militäraktionen, die US-Truppen/Partner gefährden; (5) NATO-interne Blockade von Bündnisbeschlüssen als Erpressungsinstrument.

**Was die USA von der Türkei wollen:** S-400 aus dem Bestand; Ende der Iran-/Russland-Schattenfinanzierung; keine Eskalation mit Israel und Griechenland; NATO-Beitrag (Verteidigungsausgaben, Südfanke); Energiekäufe US-LNG statt Russland; Rückhalt für die Gaza-Nachkriegsordnung (Board of Peace).

**Was die Türkei von den USA will:** CAATSA-Aufhebung; F-35-Verkauf (40 Stück beantragt) bzw. Rückkehr ins Programm; F110-Freigabe dauerhaft; F-16-Modernisierungs-Ersatzteile (laut türkischer Seite ~20 Mrd. $ blockiert, CRS 07/2026); KEINE Sekundärsanktionen im Energiehandel; Anerkennung als Vermittler.

**2028-Projektion.** Juni 2028 regiert Trump im letzten halben Jahr (Amtsübergabe Jan. 2029), die Nachfolgedynamik dominiert; das S-400-/CAATSA-Paket ist wahrscheinlich 2027 gelöst (Formel: S-400 eingelagert/verlegt), F-35-Auslieferungen frühestens 2028–2029. Wendepunkte: Midterms 11/2026 (Kongressmehrheiten entscheiden über CAATSA-Waiver) und der Ausgang des Iran-Kriegs — ein dauerhafter Deal würde den US-Druck auf die Türkei in Energiefragen senken, ein Wiederaufflammen erhöht ihn.

## 2. EU (als Akteur)

**Zustand Sept. 2026.** 27 Mitgliedstaaten; Kommissionspräsidentin Ursula von der Leyen, Hohe Vertreterin Kaja Kallas, Erweiterungskommissarin Marta Kos [→ Spiel: erfundene Namen nötig]. Wirtschaft: Eurozone wächst nur 0,9–1,0 % 2026 (IWF 07/2026; OECD 23.09.2026), EU-Gesamt-BIP ~19–20 Bio. $ [unverifiziert], Inflation ~2,5–3 % energiegetrieben. Hauptbaustelle: Energiekosten durch Hormuz (TTF ~71–73 €/MWh, +118 % j/j), Aufrüstung (SAFE), Ukraine-Finanzierung (90 Mrd. € USL 2026–27) und Erweiterungsstreit.

**Beziehung zur Türkei heute.** Handel: EU ist mit Abstand größter Partner — 58,4 % der türkischen Warenexporte gehen nach Europa (Worldstopexports/TÜİK 2025); bilateral ~210 Mrd. € Waren 2024 [unverifiziert, Größenordnung]. Konfliktlinien: (a) Beitrittsprozess seit 2018 faktisch eingefroren, EP-Bericht 2026 erneut kritisch; (b) Zollunion-Modernisierung weiter ohne Mandat — Griechenland und Zypern als Bremser (Reuters, 05.02.2026; turkeyrecap, 29.12.2025); (c) Rechtsstaat: EGMR-Last, İmamoğlu-Prozesse. Kooperation: „Two-Track"-Ansatz — Hochrangige Dreier-Visite Kallas/Kos/Brunner in Ankara 30.06.2026 (Sicherheit, Migration, Energie, Korridore); Visa-Erleichterung seit 07/2025; Migrationsdeal 2016 trägt weiter (~3,5–4 Mio. Geflüchtete in der Türkei). Zustand: Transaktionale Kooperation ohne Beitrittsperspektive — Brüssel braucht Ankara für Sicherheit und Energiekorridore, hält aber die Rechtsstaatsklammer aufrecht.

**Rote Linien:** (1) Keine Zollunion-Modernisierung/Visaliberalisierung ohne Rechtsstaats-Mindestbewegung (formal: 2018er-Ratsbeschluss); (2) keine Anerkennung des Türkei-Libyen-Memorandums von 2019; (3) Solidarität mit Zypern/Griechenland bei Hoheitsgewässern (Drohung mit Sanktionsinstrumenten von 2019/2020); (4) keine türkische Teilnahme an EU-Verteidigungsprogrammen gegen Einstimmigkeit (Zypern-Veto); (5) Menschenrechts-„Kern" (EGMR-Umsetzung) als formale Vorbedingung.

**Was die EU von der Türkei will:** Migrationssteuerung; Beitrag zur europäischen Sicherheitsarchitektur (Schwarzes Meer, Korridore); Sanktions-Durchsetzung gegen Russland (kein Umgehungs-Drehkreuz); Deeskalation Ägäis/Zypern; Energietransit (TANAP-Ausbau, LNG).

**Was die Türkei von der EU will:** Zollunion-Modernisierung; Visafreiheit; SAFE-/Rüstungsprogramm-Zugang; positive Agenda unabhängig vom Beitrittsstillstand; Geld für Geflüchtete; Aufnahme in Konnektivitätsinitiativen (Mittlerer Korridor).

**2028-Projektion.** Juni 2028: Zollunion-Gespräche bestenfalls im Anfangsstadium, realistisch weiter blockiert; die Sicherheitskooperation (Rüstungs-Joint-Ventures wie Baykar-Leonardo, SAFE-ähnliche „islands of co-creation") wächst sektoral. Wendepunkte: türkische Präsidentschaftswahl 2028 (läuft zum Spielstart), EU-Ratspräsidentschaften und eine mögliche Zypern-Einigungsdynamik (siehe Dossier 17), die beide Seiten entblocken könnte — oder an der Zypern-Frage erneut zerbricht.

## 3. Russland

**Zustand Sept. 2026.** Zentralisierte Präsidialherrschaft; Wladimir Putin [→ Spiel: erfundener Name nötig]. Kriegswirtschaft im 5. Jahr: BIP ~2,66 Bio. $, Wachstum 2026 nur 0,4–1,1 % (Regierung 0,6 % am 24.09.2026; IWF 1,1 % 04/2026 dank Ölwindfall; Zentralbank 0–1 %), Inflation ~5,7–7 % (Bank of Russia 08/2026), Militär 6,3–7,5 % des BIP (statisticsoftheworld, 05/2026). Öleinnahmen erst kollabiert (Jan. 2026: −46 % j/j), dann durch Hormuz-Höchstpreise gerettet (Urals 112 $ im 04/2026). Hauptbaustelle: Krieg in der Ukraine ohne Siegperspektive, Budgetdefizit droht auf 3,5–4,4 % des BIP zu wachsen (Reuters via unn.ua, 04.02.2026).

**Beziehung zur Türkei heute.** Handel 2025: **~49 Mrd. $** (Importe der Türkei 42,37 Mrd., Exporte 6,7 Mrd.; TÜİK 01/2026) — massiv einseitig zulasten der Türkei. Konfliktlinien: (a) Ukraine — Türkei liefert Waffen an Kiew und übernimmt 2026 die maritime Komponente westlicher Sicherheitsgarantien; Moskau warnte öffentlich (Nordic Monitor, 19.08.2026); (b) Energie-Strukturwandel: Türkei senkt Russland-Öl (−25 % Juli/Juni 2026) und baut US-LNG aus; die großen Pipeline-Verträge (~22 bcm/a) laufen Ende 2026 aus — Neuverhandlung hängt (Nordic Monitor, 02.09.2026); (c) Südkaukasus: TRIPP verdrängt russische Transitmacht. Kooperation: Akkuyu (Block 1 im Anfahrbetrieb seit 06/2026, Inbetriebnahme 2026; 9 Mrd. $ Zusatzfinanzierung 12/2025), TurkStream läuft, Tourismus (Mio. Russen), Getreide-/Düngerkanal, S-400-Verbleib als Trumpfkarte. Zustand: Pragmatische asymmetrische Partnerschaft — beide brauchen einander, aber die Türkei verschiebt 2026 sichtbar Richtung Westen.

**Rote Linien:** (1) Keine türkische NATO-Integration „mit Inhalt" gegen Russland (dauerhafte NATO-Infrastruktur am Schwarzen Meer); (2) keine Aufkündigung von TurkStream/Akkuyu durch Ankara; (3) keine türkischen Truppen in der Ukraine als Kampftruppe; (4) Meerengen: keine Ausweitung von Montreux zugunsten der NATO-Kriegsmarine; (5) keine Rückgabe/Verlegung der S-400 an ein Feindland ohne Moskauer Mitbestimmung.

**Was Russland von der Türkei will:** Gasverträge verlängern (zu möglichst hohen Volumen); Zahlungswege offen halten (Banken); keine Sekundärsanktions-Compliance; Getreide-/Düngerexporte störungsfrei; Akkuyu vollenden + Folgeprojekte (Sinop); Vermittlerrolle, die Moskau schont.

**Was die Türkei von Russland will:** Preisnachlass + Zahlungsaufschub beim Gas; Akkuyu-Zahlungsweg und Brennstoff-Sicherheit; Zurückhaltung in Syrien (Post-Assad-Ordnung unter türkischer Führung); Getreidekorridor-Funktionsfähigkeit; keine Eskalation am Schwarzen Meer nahe türkischer Küste (Shadow-Fleet-Zwischenfälle).

**2028-Projektion.** Juni 2028: Wahrscheinlichstes Szenario ist ein eingefrorener Ukraine-Krieg (Waffenruhe ohne Friedensvertrag) bei anhaltenden Sanktionen; Russland ist wirtschaftlich geschwächt, aber stabil genug. Die Gasverträge mit der Türkei sind bis dahin neu verhandelt (kleineres Volumen, Preisnachlass gegen Flexibilität). Wendepunkte: Ukraine-Waffenruhe/Frieden (verändert Sanktionslage und Gaspreise), Akkuyu-Betriebsaufnahme aller vier Blöcke bis 2028, und die Frage, ob Russland die TRIPP-Realität im Südkaukasus akzeptiert oder subkutan stört.

## 4. Griechenland

**Zustand Sept. 2026.** Parlamentarische Republik, EU/Eurozone/NATO; Ministerpräsident Kyriakos Mitsotakis (ND) [→ Spiel: erfundener Name nötig], nächste Wahl spätestens 2027. Wirtschaft: BIP ~307,6 Mrd. $, Wachstum 1,8–1,9 % 2026, Inflation 4,2 % 2026 (Energieschock), Schulden sinkend 146 % → ~137 % BIP (OECD 06/2026; EK 05/2026); Verteidigung 2,6 % des BIP 2026. Hauptbaustelle: Energiekosten und die strategische Verankerung als US-/EU-Energiedrehkreuz (Revythoussa, Alexandroupoli).

**Beziehung zur Türkei heute.** Handel: türkische Exporte nach Griechenland 5,4 Mrd. $ 2025 (Rang 14), Gesamthandel ~6,5–7 Mrd. $ [Importe geschätzt]. Konfliktlinien: (a) Ägäis-Paket (Festlandsockel, 12 sm, Luftraum, Inselstatus, casus belli 1995); (b) Ostmediterrane Seegrenzen: Great Sea Interconnector seit 03/2025 wegen türkischer Einwände pausiert; Türkei kündigte 02/2026 seismische Erkundung südlich Kreta an — zeitgleich zum Mitsotakis-Besuch in Ankara (Greek City Times, 12.02.2026); Chevron-Konsortium erhielt 02/2026 vier griechische Tiefseeblöcke (LibyaReview, 28.06.2026); (c) Zypern. Kooperation: Dialogkanäle halten (6. Hochrangiger Kooperationsrat Ankara 11.02.2026, Migrationskooperation läuft, Erdbeben-Hilfe-Kanal), „positive Agenda" (Kultur, Handel, Technologie). Zustand: Kalte Entspannung — beide Seiten pflegen die Deeskalation, aber die Streitgegenstände sind unangetastet und die Rüstungsschraube (Eurofighter/Meteor für die Türkei, F-35/Rafale für Griechenland) dreht sich weiter.

**Rote Linien:** (1) Insel-Entmilitarisierungsforderung — Athen behandelt die Bewaffnung der Inseln als Selbstverteidigungsrecht, nicht verhandelbar; (2) keine Anerkennung des Türkei-Libyen-Memorandums; (3) keine türkischen Bohrungen in beanspruchtem Festlandsockel; (4) Zypern: keine Zwei-Staaten-Lösung; (5) keine einseitige Ausweitung türkischer Hoheitsgewässer/Kontinentalzone in der Ägäis.

**Was Griechenland von der Türkei will:** Casus belli ruhen lassen; Überflug-/NAVTEX-Zurückhaltung; Migrations-Rücknahme funktionsfähig; keine Bohrungen südlich Kreta; Unterstützung (oder Stille) bei Great Sea Interconnector; im EU-Rahmen keine Blockade der griechischen Positionen.

**Was die Türkei von Griechenland will:** Verhandlung aller Ägäis-Fragen als Paket; Anerkennung türkischer Interessen im Ostmediterranen Energiebild; kein EU-/NATO-Veto gegen die Türkei (Zollunion, SAFE); Migrationslasten geteilt; Schutz der türkischen Minderheit in Westthrakien.

**2028-Projektion.** Juni 2028: Dialog fortgesetzt, kein Durchbruch bei Seegrenzen; der Great Sea Interconnector ist der konkreteste Zündstoff (Wiederaufnahme = Krise). Wendepunkte: griechische Wahl 2027 (Mitsotakis-Nachfolgefrage), türkische Wahl 2028, und das Zypern-Verhandlungsfenster 2026/27 — ein Erfolg dort würde die Ägäis-Front spürbar entlasten, ein Scheitern sie vergiften.

## 5. Iran

**Zustand Sept. 2026.** Islamische Republik im Kriegszustand und nach der Tötung Ali Khameneis (28.02.2026) unter dem neuen Obersten Führer Mojtaba Khamenei [→ Spiel: erfundener Name nötig] — seit der Eröffnungswelle nie öffentlich gesehen, reale Macht bei IRGC und Nationalem Sicherheitsrat; Präsident Masoud Pezeshkian [→ Spiel]. Wirtschaft im Kollaps: BIP nur noch ~225–300 Mrd. $ (fallend), IWF-Prognose **−6,1 % 2026**, Inflation **68,9 %** (IWF WEO 04/2026), Lebensmittel +105 %, Rial 2,2 Mio./$ (Fortune, 06.09.2026; JISS, 18.05.2026). Hauptbaustelle: Überleben — Kriegsschäden ~270 Mrd. $ (Regierungssprecherin Mohajerani via RIA), Ölexporte kollabiert (1,85 → ~0,57 Mio. bpd im 04/2026), Benzinreserven ~2 Monate, Proteste 01/2026 mit Tausenden Toten niedergeschlagen.

**Beziehung zur Türkei heute.** Handel: türkische Exporte in den Iran 3,06 Mrd. $ 2025; Gesamthandel ~6 Mrd. $ [unverifiziert], kriegsbedingt einbrechend; der Gasvertrag (~9,6 bcm/a) lief Ende Juli 2026 aus — Verlängerung offen, Importe sprangen während des Krieges kurzzeitig +40 % (Türkiye Today via Glaros, 09/2026). Konfliktlinien: (a) Einflusskonkurrenz Irak/Syrien — pro-iranische Milizen schlugen trotz Bagdader Neutralität aus dem Irak zu (Crisis Group, 28.05.2026); (b) Kurdenfrage (PJAK/PKK-Reste, PKK-Selbstaflösung 2025 verändert die Karte); (c) TRIPP — Teheran verliert seine Transitmonopol-Rolle nach Nachitschewan und warnt vor NATO-Nähe an der Nordgrenze (CES Intelligence, 18.08.2026). Kooperation: Grenzhandel, Energie, gemeinsame Ablehnung eines Regimewechsels von außen, türkische Vermittlungsofferte (Hormus/Waffenruhe). Zustand: Koexistenz unter Stress — Ankara profitiert strategisch vom geschwächten Iran, fürchtet aber dessen Zerfall (Flucht, Grenze, Instabilität).

**Rote Linien:** (1) Keine türkische Unterstützung für US-/israelische Operationen (Basen, Luftraum, Logistik); (2) keine „Korridor"-Geometrie, die Iran vom Kaukasus abschneidet (TRIPP mit fremder Sicherheitspräsenz); (3) keine Unterstützung separatistischer Kurdenstrukturen an Irans Westgrenze; (4) Wasser/Grenzflüsse nicht als Druckmittel; (5) keine offene Konkurrenz um islamische Führungsansprüche in Richtung Regimesturz-Rhetorik.

**Was der Iran von der Türkei will:** Handels- und Zahlungskanal trotz Sanktionen (Gold, Devisen, Waren); Gasvertrag verlängern; politische Deckung gegen totalen Regimesturz (Vermittlung); Transitfunktion bei geschlossenem Hormus; Zurückhaltung bei TRIPP-Sicherheitsarchitektur.

**Was die Türkei vom Iran will:** Keine Destabilisierung Iraks/Syriens durch Milizen; Gaspreis-/Lieferbedingungen; PJAK-Kontrolle; geordnete Waffenruhe (Hormus offen = Energiepreise fallen); keine Flüchtlingswelle an der Ostgrenze.

**2028-Projektion.** Juni 2028 liegt zwischen zwei Polen: „Muddle-through" (Regime hält, sanktioniert, geschwächt; ~50–55 % Wahrscheinlichkeit laut JISS-Szenarien) oder Nach-Kriegs-Deal mit den USA (Öl gegen nukleare Schließung). Wendepunkte: Ergebnis der laufenden Gespräche (Katar/Oman-Kanal, Stand 29.09.2026 offen), Mojtaba-Nachfolge-/Legitimitätskrisen, erneute Massenproteste bei Hyperinflation. Für das Spiel: Iran ist der Akteur mit der größten Varianz — vom Verhandlungspartner bis zum Zerfallsszenario.

## 6. Syrien

**Zustand Sept. 2026.** Übergangsrepublik nach dem Sturz Assads (08.12.2024); Präsident Ahmed al-Sharaa [→ Spiel: erfundener Name nötig], fünfjährige Transition bis 2030 (Verfassungsdeklaration 03/2025). Wirtschaft am Boden, aber mit Zusagen: BIP ~21–22 Mrd. $ (von 67,5 Mrd. 2011), Wiederaufbau geschätzt 216 Mrd. $ (Weltbank 10/2025), Wachstum ~1 % (WB); Sanktionen weitgehend Geschichte: EU 28.05.2025, US-EO 30.06.2025, Caesar Act endgültig aufgehoben per NDAA 18.12.2025, „State Sponsor of Terrorism"-Aufhebung seit 08.07.2026 im Kongress-Review. Hauptbaustelle: Staatskonsolidierung — SDF nach Januar-Deal und August-Integration 2026 aufgelöst/in Armee überführt (Euronews, 28.08.2026), aber Sicherheit (67 % → 38 % Sicherheitsgefühl binnen Monaten) und Lebenshaltung krisenhaft; Strom in Damaskus 4–6 h/Tag.

**Beziehung zur Türkei heute.** Handel: 3,7 Mrd. $ 2025 (+40 %; türkische Exporte 3,49 Mrd., DEİK 04/2026), 2026 +16 % in 7 Monaten; Ziel 5 Mrd. kurzfristig. Türkei ist der dominante externe Akteur: 11 Mrd. $ Energie-/Infrastrukturverträge (12/2025), Kilis–Aleppo-Gasleitung (6 Mio. m³/Tag), Militär-Ausbildungs-MoU (08/2025), JETCO gegründet, Transithandel Richtung Golf wieder offen. Konfliktlinien: (a) Kurdenfrage — Rest-Autonomie-Erwartungen der Kurden vs. Ankaras Einheitsstaats-Maximalforderung; (b) Rückkehr-Tempo der ~3 Mio. Syrer aus der Türkei; (c) israelische Präsenz im Süden vs. türkische Basispläne (Israel bombardierte 08/2026 einen Stützpunkt, auf dem türkische Truppen erwartet wurden; Reuters, 19.08.2026). Kooperationsfelder: Wiederaufbau-Aufträge, Energie, Sicherheitssektor-Reform, Transitkorridor Golf–Europa. Zustand: Klientel-Partnerschaft — Damaskus hängt an Ankara, Ankara trägt Verantwortung für den Erfolg.

**Rote Linien:** (1) Keine Rückkehr zu PKK/YPG-Strukturen an der türkischen Grenze; (2) keine fremde (iranische/russische) Re-Militarisierung ohne Abstimmung; (3) syrische Souveränität formal wahren — keine offene türkische Annexion von Einflusszonen; (4) Minderheiten (Alawiten, Drusen, Kurden) dürfen nicht erneut zu Massakern führen — sonst kippt die internationale Sanktionsentlastung; (5) kein Vorgehen gegen türkische Stützpunkte im Norden.

**Was Syrien von der Türkei will:** Geld, Strom, Gas, Bauaufträge; Ausbildung/Ausrüstung der neuen Armee; diplomatischen Schirm (SST-Aufhebung, IWF/Weltbank-Wiederanschluss); Rückkehr-Programm mit Finanzierung; Beistand gegen israelische Expansion im Süden.

**Was die Türkei von Syrien will:** Stabile Zentralmacht ohne Kurden-Autonomie; Rückkehr der Geflüchteten; Aufträge und Einfluss; SDF-Integration vollenden; Transitfunktion (Entwicklungsstraße-Anschluss, Golf-Route); Kein Abschnitt für Hisbollah-/Iran-Rückkehr.

**2028-Projektion.** Juni 2028: Übergang in der Endphase vor den für 2029/30 erwarteten Wahlen; Wiederaufbau im Gange, aber nur ein Bruchteil der 216 Mrd. $ finanziert; Türkei weiter Schutzmacht. Wendepunkte: Scheitern/Gelingen der Armee-Integration (SDF-Reste, Kämpfe 01/2026 als Warnung), das Israel-Syrien-Sicherheitsabkommen (Paris-Rahmen 01/2026) und dessen Stabilität, sowie die Frage russischer Basen (al-Sharaa bei Putin 10/2025 und 01/2026 — Konditionen neu verhandelt).

## 7. Irak

**Zustand Sept. 2026.** Föderale, fragil geteilte Republik; seit 14.05.2026 Ministerpräsident Ali al-Zaidi [→ Spiel: erfundener Name nötig] — parteifremder Milliardär/Banker, Kompromisskandidat des schiitischen Koordinierungsrahmens nach den Wahlen vom 11/2025 und sechs Monaten Blockade; Trump hatte Maliki öffentlich verworfen (ABC/AP, 27.04.2026). Wirtschaft im Schock: BIP ~268–280 Mrd. $, IWF erwartet **−6,8 % 2026** (schärfster Rückgang der Region), Öleinnahmen von 6,8 Mrd. $ (02/2026) auf 1,96 Mrd. $ (03/2026) gefallen; Exporte über Hormuz brachen von 3,5 Mio. bpd auf 0,2–0,3 Mio. ein, Erholung auf >3 Mio. bpd Anfang 09/2026 (Ölminister Khudair via AGBI, 18.09.2026); kein verabschiedeter Haushalt 2025/2026 (1/12-Notregime); ~60 Mrd. $ Einnahmeverlust seit Kriegsbeginn (PM bei der UNGA, Al Jazeera, 28.09.2026). Hauptbaustelle: Milizen-Entwaffnung (US-Druck, Dollar-Cash-Lieferungen zeitweise gestoppt) + Wasserkrise.

**Beziehung zur Türkei heute.** Handel: Irak ist 5. größter Exportmarkt der Türkei (12,38 Mrd. $ 2025, TÜİK); Gesamthandel ~13–14 Mrd. $ [unverifiziert]. Konfliktlinien: (a) Wasser — Euphrat/Tigris: Bagdad will zugesagte Abflussmengen, Ankara bietet nur Öl-für-Wasser-Projektmechanismus (Rahmen beim Zaidi-Besuch 07/2026; Arab Center DC, 26.08.2026); (b) PKK — türkische Operationen/Basen im Norden bleiben Souveränitätsstreit, auch wenn Bagdad kooperiert; (c) ICC-Schiedsschuld ~1,5 Mrd. $ (Stillstand der Pipeline 2023–2025). Kooperation: 12-Monats-Übergangsprotokoll für Kirkuk–Ceyhan ab 27.07.2026 (~250.000 bpd, Ziel aus türkischer Sicht bis 1,5 Mio. bpd; discoveryalert, 13.07.2026), Entwicklungsstraße Basra–Faw–Türkei (~17 Mrd. $ Phase 1), TPAO steigt in Kirkuk-Produktion ein, Marsch-2026-Vorschlag: Pipeline-Verlängerung Basra–Haditha–Ceyhan als Hormuz-Umgehung (Hellenic Shipping, 21.07.2026). Zustand: Geopolitische Schicksalswende zugunsten Ankaras — der Hormuz-Schock macht Bagdad zum Bittsteller für den Nordkorridor.

**Rote Linien:** (1) Keine dauerhafte türkische Militärpräsenz ohne irakische Zustimmung; (2) Wasser: keine weiteren Staudamm-Füllungen ohne Abflussgarantie; (3) keine Wiederbelebung eines unabhängigen Energieexports der KRG hinter Bagdads Rücken; (4) keine türkische Parteinahme in schiitisch-innerirakischen Machtfragen; (5) Transitverträge nicht als Geisel für die ICC-Schuld.

**Was der Irak von der Türkei will:** Wasserzusagen in Kubikmetern; Pipeline-Vollaustattung und Transitgebühren-Moderation; Investitionen (Entwicklungsstraße, Wasser-Infrastruktur über Öleinnahmen finanziert); Strom; Rückhalt bei den USA (Zaidis Washington-Kanal); keine einseitigen Militäraktionen.

**Was die Türkei vom Irak will:** PKK-Entwaffnung irakisch mitgetragen (gesetzliche Schritte); Pipeline-Vertrag langfristig (5–10 Jahre) mit Mindestmengen; Entwicklungsstraße priorisiert; Wasser-Datei technisch, nicht politisch eskaliert; Zugang zu Energieprojekten (Gas, Petrochemie, Strom).

**2028-Projektion.** Juni 2028: Der Nordkorridor ist der neue Normalfall irakischer Exporte, das Langzeit-Energieabkommen 2027 unterzeichnet; Zaidi entweder etabliert oder ersetzt — die Koalitionslogik bleibt. Wendepunkte: Hormus-Dauerlösung (senkt den türkischen Hebel wieder), Milizen-Entwaffnung (US-Konditionen), Wasser-Dürrejahr 2027/28 (Eskalationsrisiko, Ilısu-Muster), KRG-Bagdad-Streit um Exportrechte.

## 8. Ukraine

**Zustand Sept. 2026.** Präsidialrepublik im 5. Kriegsjahr; Präsident Wolodymyr Selenskyj [→ Spiel: erfundener Name nötig], Kriegsrecht zuletzt 07/2026 um 90 Tage verlängert, keine Wahlen. Wirtschaft am Tropf: Wachstum nur ~1–2 % 2026 (IWF 01/2026), Haushaltsdefizit 18,4 % des BIP — dank EU-Ukraine Support Loan (90 Mrd. € 2026–27) auf 12,1 % gedrückt; externe Hilfe 51,4 Mrd. $ 2026 eingeplant; Reserven ~58–65 Mrd. $ (NBU 02/2026; mezha, 02/2026); Verteidigung ~27 % des BIP. Hauptbaustelle: Front im Donbas (russische Vorstöße Richtung Pokrovsk seit 12/2025), Energieinfrastruktur unter Beschuss, Stromdefizit bis 10 %.

**Beziehung zur Türkei heute.** Handel: Türkei ist 4. größter Handelspartner der Ukraine — 8,95 Mrd. $ 2025 (ukr. Zoll via Experts Club, 02/2026); FTA-Entwurf 02/2026 von Kiew gebilligt (0 %-Zölle auf 95 % der ukrainischen Exportpositionen). Konfliktlinien: (a) Ankaras Nicht-Sanktionierung Russlands und Grauzonen-Handel; (b) Meerengen-Balance (Montreux streng, aber eben auch gegen NATO-Präsenz); (c) gelegentliche Reibung um Gefangenen-/Getreide-Prioritäten. Kooperation: Rüstungs-Industrie-Parnerschaft (Ada-Korvetten — zweite Einheit Jungfernfahrt 2026, Übergabe Q1/2027; TB2/KIZILELMA; ukrainische Triebwerks-Knowhow für KAAN), Türkei übernahm 07/2026 die Führung der maritimen Komponente westlicher Sicherheitsgarantien und betreibt mit Bulgarien/Rumänien Minenräumung (ukr. Regierungsportal dia.dp.gov.ua, 28.08.2026); Istanbul bleibt Verhandlungsort (Runden 05–07/2025, Gefangenenaustausch 05/2026); Getreideplan der Türkei für das Schwarze Meer in Abstimmung mit beiden Seiten (Reuters, 31.08.2026). Zustand: Strategische Partnerschaft mit klarer Arbeitsteilung — Kiews engster Schwarzmeer-Partner außerhalb der EU.

**Rote Linien:** (1) Keine Anerkennung russischer Annexionen (Krim, vier Oblaste); (2) keine Öffnung der Meerengen für Kriegsschiffe der Kriegsparteien; (3) keine türkische Vermittlungslösung „über Kiews Kopf" (Territorialverzicht als vollendete Tatsache); (4) keine Lieferung kritischer Komponenten an Russland; (5) Wiederaufbau-Aufträge an Sicherheitsgaranten gekoppelt (Selenskyj 05/2026).

**Was die Ukraine von der Türkei will:** Montreux strikt; Drohnen/Schiffe/Munition weiter; Führung der maritimen Sicherheitskomponente; Wiederaufbau-Aufträge für türkische Firmen; Getreide-/Exportkorridor geschützt; Druck auf Moskau bei Gefangenen.

**Was die Türkei von der Ukraine will:** Vermittlerrolle mit Substanz (Istanbul-Format); Rüstungs-Kooperation (Triebwerke, Knowhow); Wiederaufbau-Anteile; Schwarzmeer-Stabilität ohne NATO-Maximalpräsenz; Getreidepreis-Stabilität für die eigene Lebensmittelinflation.

**2028-Projektion.** Juni 2028 ist das Basisszenario ein eingefrorener Konflikt entlang der damaligen Kontaktlinie mit europäischer Garantietruppe im Aufbau — oder ein zäher Abnutzungskrieg bei schwindender US-Last. Wendepunkte: die Sept.-2026-Gesprächsspur (Witkoff/Kushner in Moskau/Kiew 05./06.09.2026) und ihre Fortsetzung, US-Politik nach den Midterms, die EU-USL-Auszahlungsdisziplin, eine mögliche Wahl in der Ukraine nach Waffenruhe (Kriegsrecht).

## 9. Georgien

**Zustand Sept. 2026.** Parlamentarische Republik faktisch unter Einparteienherrschaft von Georgian Dream (Bidzina Iwanischwili [→ Spiel: erfundener Name nötig]); PM Irakli Kobakhidse, Präsident Micheil Kawelaschwili (vereidigt 29.12.2024, von der Opposition nicht anerkannt) [→ Spiel]. EU-Beitritt einseitig bis 2028 suspendiert; Proteste seit 10/2024 laufen klein weiter; Presse-/Versammlungsrecht 2025/26 weiter verschärft (US State Dept. Investment Climate, 29.09.2026). Wirtschaft robust: BIP ~42,7 Mrd. $, Wachstum 2025 +7,5 %, Prognose 2026 +5,5–6 % (ADB 04/2026; EBRD 06/2026), Inflation ~3,8–5,9 %, Tourismus 12,3 % des BIP. Hauptbaustelle: Legitimität — das Land ist außenpolitisch in der Schwebe zwischen EU-Markt und Russland-Annäherung.

**Beziehung zur Türkei heute.** Handel: 3,1 Mrd. $ 2025, Türkei ist Georgiens größter Handelspartner (Geostat via SteelOrbis, 22.01.2026). Konfliktlinien: (a) kaum bilaterale — eher indirekt: Ankaras Einfluss in Adjara/Muslimen; (b) georgische Sorge vor Überhöhung durch TRIPP (Umgehung Georgiens); (c) westliche Sanktions-/Isolationsdynamik gegen GD, die Ankara nicht mitträgt. Kooperation: BTC/TANAP-Transit, BTK-Bahn im Volllastbetrieb seit 02.06.2026 (abkommen.ts-Code-Stand, bestätigt durch Kontext), Strom-Interkonnektoren, Freihandel seit 2008. Zustand: Ruhige, gut funktionierende Nachbarschaft — Tiflis braucht Ankara als Tor nach Süden, während der Westen-Kanal politisch friert.

**Rote Linien:** (1) Keine Hinterhof-Deals über Abchasien/Südossetien; (2) keine türkische Militärpräsenz; (3) Transit-Souveränität (Tarife, Kontrolle) bleibt georgisch; (4) keine Einmischung in adjarische Angelegenheiten; (5) keine Erpressung via Grenzverkehr (Sarp).

**Was Georgien von der Türkei will:** Transitvolumen weiter über BTK/BTC; Marktzugang; Investitionen (Häfen, Energie); Rückhalt für territoriale Integrität; politische Normalität ohne Belehrung.

**Was die Türkei von Georgien will:** Reibungsloser Korridor nach Aserbaidschan/Zentralasien; Stabilität (kein zweiter Kaukasus-Brand); Mitwirkung am Mittleren Korridor; Option auf Hafen-Beteiligungen (Anaklia); keine russische Übernahme der Transitwege.

**2028-Projektion.** Juni 2028: GD weiter an der Macht (Wahl 2028 wird zum Ereignis), EU-Beitritt formell wieder „auf dem Tisch" oder endgültig beerdigt — beides möglich. Wendepunkte: Parlamentswahl 10/2028, TRIPP-Baufortschritt (verändert Georgiens Transitwert), russische Reaktion auf den Kaukasus-Umbau.

## 10. Aserbaidschan

**Zustand Sept. 2026.** Zentralisierte Präsidialrepublik; Präsident İlham Aliyev [→ Spiel: erfundener Name nötig]. Friedensdividende nach Karabach: Friedensvertrag mit Armenien am 08.08.2025 im Weißen Haus parafiert, TRIPP in Umsetzung (US-Beteiligung 74 %/49 Jahre, Implementation Framework 13./14.01.2026); Wiederaufbau Karabach läuft. Wirtschaft: BIP ~78,4 Mrd. $, Wachstum nur ~1,6–2 % 2026 (Ölsektor schrumpfte Q1 −0,3 %; EBRD 06/2026; ADB 07/2026), Inflation ~5,7 %, Staatsfonds+ZB-Reserven 112 % des BIP. Hauptbaustelle: Diversifikation weg vom Öl + Umsetzung des Friedens (Verfassungsbedingung Armeniens).

**Beziehung zur Türkei heute.** Handel: ~8 Mrd. $ 2025 (Handelsminister Bolat, 17.12.2025), Ziel 15 Mrd. $; gegenseitige Investitionen ~17 bzw. 21 Mrd. $. Konfliktlinien: praktisch keine bilateralen — eher Rivalitäts-Nullsummenlogik gegenüber Dritten (Iran, Russland); einzige Reibung: Tempo der armenischen Grenzöffnung, das Baku als Hebel behalten will. Kooperation: „Eine Nation, zwei Staaten" — Schuscha-Erklärung (Beistand), TANAP/TAP (Gas nach Europa, Ausbau Richtung 20 bcm), BTC, Iğdır–Nachitschewan-Pipeline (2025), BTK, Rüstung (Bayraktar, Ausbildung), OTS-Gipfel Gabala 10/2025. Zustand: Engste Beziehung der Türkei überhaupt — militärisch, energetisch, identitär.

**Rote Linien:** (1) Keine türkisch-armenische Grenzöffnung vor signiertem Friedensvertrag (Fidan bestätigte die Koppelung 11/2025); (2) keine internationalen Mechanismen, die Karabach neu aufs Tableau bringen; (3) TRIPP ohne armenische Hoheits-Sabotage; (4) keine türkische Nachsicht mit iranischen Drohungen gegen Baku; (5) Gaspreis-/Transitkonditionen nicht einseitig verändern.

**Was Aserbaidschan von der Türkei will:** Militärische Deckung (Schuscha-Beistand); Abnahme von Gas und Strom; Rüstungskooperation; diplomatische Arbeit für TRIPP und gegen die armenische „1915"-Kampagne; Investitionen in Karabach.

**Was die Türkei von Aserbaidschan will:** Gas (TANAP-Ausbau, Preis), Korridor nach Zentralasien (TRIPP + Nachitschewan), geordneten Frieden mit Armenien (ermöglicht die Grenzöffnung), Strom-Interkonnektion, gemeinsame Turkstaaten-Agenda.

**2028-Projektion.** Juni 2028: Friedensvertrag signiert und ratifiziert (nach armenischem Verfassungsreferendum, erwartet 2027), TRIPP im Bau, Gasexporte nach Europa steigen Richtung 20 bcm. Wendepunkte: das armenische Referendum, Iran-Kriegs-Auswirkungen auf die Nordgrenze Bakus, Aliyevs Nachfolgeplanung (kein Termindruck, aber Gerüchtekonstanz), Ölpreisnachhaltigkeit nach Hormus.

## 11. Armenien

**Zustand Sept. 2026.** Parlamentarische Republik; Premier Nikol Paschinjan [→ Spiel: erfundener Name nötig] gewann die Wahl vom 07.06.2026 mit 49,7 % (64 Sitze, Dreifünftel-, aber keine Verfassungsmehrheit; ZEK bestätigt 14.06.2026; AP/Washington Post). Regierungsprogramm 2026–2031 unter der Ideologie „Real Armenia"/„Vierte Republik" — explizit auf Frieden mit Aserbaidschan gebaut (Armenpress, 20.08.2026). Wirtschaft: BIP ~31,9 Mrd. $ (IWF 04/2026), Wachstum 2025 +7,2 %, Prognose 2026 +5,3–5,5 % (EBRD/WB), Inflation ~3–5 %, Reserven 5,7 Mrd. $. Hauptbaustelle: Verfassungsänderung (Baku-Vorbedingung) — Referendum frühestens 2027, innenpolitisch explosiv; dazu Kirchenkonflikt und Opposition (Strong Armenia 23,3 %, prorussisch).

**Beziehung zur Türkei heute.** Handel: historisch ~334–336 Mio. $ armenische Importe aus der Türkei 2024 über Drittwege; seit 11.05.2026 erstmals Direkthandel registrierungsrechtlich möglich (Zartonk/Asatutjun, 13.05.2026); THY-Direktflüge Istanbul–Eriwan seit 11.03.2026; e-Visa für Diplomatenpässe seit 01.01.2026; Ani-Brücken-Protokoll 04.05.2026; Achalkalaki–Kars-Verbindung für Armenien-EU-Waren seit 23.05.2026. **Grenze aber weiter geschlossen** (Stand 08/2026): Ankara koppelt die Öffnung an die Signatur des Friedensvertrags mit Baku (Fidan, 11/2025; Bloomberg via modern.az, 12/2025). Konfliktlinien: (a) Grenze/Diplomatie ohne Vorleistung; (b) 1915-Anerkennungskampagne; (c) TRIPP-Hoheitsfrage (Eriwan besteht auf armenischer Jurisdiktion). Kooperation: schrittweise Vertrauensmaßnahmen, Eisenbahn-Arbeitsgruppe (Kars–Gjumri, ~5 Monate Gleisarbeit), Stromleitung. Zustand: Normalisierung im Wartestand — der Schlüssel liegt in Bakus Signatur und Eriwans Referendum.

**Rote Linien:** (1) Verzicht auf die internationale 1915-Anerkennungsagenda käme einem Verrat an der Staatsidentität gleich — keine Regierung überlebt das; (2) kein „Korridor" ohne armenische Souveränität/Zollkontrolle (Ablehnung extraterritorialer Logik); (3) keine Öffnung, die Armenien zum bloßen Durchgang degradiert; (4) Syunik-Integrität ist unantastbar; (5) keine Rückkehr russischer Grenztruppen an die türkische Grenze (2026 übernommen).

**Was Armenien von der Türkei will:** Grenzöffnung + diplomatische Beziehungen; Marktzugang (Direkthandel ausbauen); Bahn Kars–Gjumri in Betrieb; Stromhandel; türkisches Schweigen zur 1915-Kampagne als De-facto-Duldung; Rückhalt in der EU-Annäherung (EU-Armenien-Gipfel 05/2026).

**Was die Türkei von Armenien will:** Signatur des Friedens mit Baku (Verfassung, TRIPP); keine 1915-Eskalation; Transit-Realität nach Nachitschewan; Entfernung aus der russischen Sicherheitsarchitektur (CSTO eingefroren — fortsetzen); Stabilität ohne Revanche.

**2028-Projektion.** Juni 2028: Wahrscheinlichster Zustand — Referendum hinter sich, Friedensvertrag signiert (2027), Grenze in schrittweiser Öffnung (Drittstaatler → Waren → volle Normalisierung), Direkthandel wächst von niedriger Basis steil. Wendepunkte: Referendum scheitert oder wird verschoben (dann bleibt die Grenze zu); russische Sabotage am Prozess; innenarmenische Krise um Kirche/Opposition.

## 12. Saudi-Arabien

**Zustand Sept. 2026.** Absolute Monarchie in De-facto-Regentschaft von Kronprinz Mohammed bin Salman [→ Spiel: erfundener Name nötig]. Wirtschaft im Hormuz-Stress: BIP ~1,31 Bio. $ (2025), Wachstum 2026 nur 3,1–3,2 % (IWF 04/2026; OECD 06/2026) nach 4,5 % 2025; Ölproduktion Q1 2026 auf ~7,8–9,3 Mio. bpd gefallen (Exporte über den Golf halbiert, Petroline-Umleitung Richtung Rotmeer), Q1-Haushaltsdefizit Rekord 33,5 Mrd. $ (SAMA/Nasser Saidi, 05/2026); PIF ~925 Mrd. $; Inflation 1,7 %. Hauptbaustelle: Vision 2030 ohne volle Öleinnahmen finanzieren — und die regionale Sicherheitsordnung neu bauen, nachdem Washingtons Schutzschirm Löcher zeigt; zusätzlich Bruch mit den VAE (Mukalla-Zwischenfall 12/2025; VAE-OPEC-Austritt 01.05.2026).

**Beziehung zur Türkei heute.** Handel: türkische Exporte 3,8 Mrd. $ 2025; Gesamthandel ~6–7 Mrd. $ [unverifiziert]; offizielles Ziel 10 Mrd. $ kurzfristig (Handelsministerium, 02/2026). Konfliktlinien: historisch geglättet (Khashoggi, Katar-Blockade überwunden); aktuell eher Rivalitätsreste um Führung im sunnitischen Lager und Riad's Vorsicht gegenüber türkischer Militärpräsenz am Golf. Kooperation: **Mekka-Beistandspakt 07.08.2026 (Saudi-Arabien + Türkei + Pakistan)** mit Kollektivverteidigungsklausel (ET Government/WION, 08./09.08.2026); R-4-Quartett (SA/PK/TR/EG) seit 19.03.2026; KAAN-Koproduktion in fortgeschrittenen Verhandlungen (02/2026, Erdoğan in Riad); Akıncı-Koproduktion Baykar–SAMI seit 2023; saudische Einlagen/Investitionen. Zustand: Strategische Allianz im Aufbau — der Iran-Krieg hat Riad in Ankaras Arme getrieben.

**Rote Linien:** (1) Keine türkische Achse mit dem Iran gegen den Golf; (2) keine Einmischung in inner-golfische Fragen (VAE-Konflikt) zugunsten Abu Dhabis; (3) keine Bedrohung der Monarchie-Legitimität (Muslimbrüder-Kanäle); (4) Hormuz/Bab al-Mandeb: keine türkische Marineaktion ohne Absprache; (5) Atomoption bleibt saudische/pakistanische Karte — keine türkische Eigenständigkeit in diesem Feld am Golf.

**Was Saudi-Arabien von der Türkei will:** Militärische Substanz des Mekka-Pakts (Übungen, Luftabwehr, Drohnen); KAAN-Beteiligung als Technologiekanal ohne US-Kongress; Investitionsklima und Rechtssicherheit für PIF-Geld; Abstimmung in Syrien (gemeinsamer Schirm für al-Sharaa); Mäßigung der Gaza-/Israel-Rhetorik in Richtung Lösung.

**Was die Türkei von Saudi-Arabien will:** Einlagen/Swaps und Aufträge; Öl über Petroline→Rotmeer→Mittelmeer-Kette stabil; Rückhalt im Mekka-Pakt als Prestige; Zugang zum Golf-Markt (Transit über Syrien ab 2026 wieder möglich); gemeinsame Linie gegen Israel-Maximalismus.

**2028-Projektion.** Juni 2028: Mekka-Pakt institutionalisiert (Kommandostrukturen, erste gemeinsame Übungen), KAAN-Vertrag unterzeichnet; saudische Wirtschaft erholt sich mit Hormus-Öffnung (IWF: +5,5 % 2027). Wendepunkte: Dauerlösung mit Iran (würde den Pakt-Zweck entschärfen oder als Erfolg rahmen), VAE-Bruch-Tiefe, Ölpreis nach Kriegsende (unter 70 $ = Vision-2030-Kassensturz), Thronfrage pro forma offen.

## 13. Israel

**Zustand Sept. 2026.** Parlamentarische Demokratie im Dauerkriegsmodus; Premierminister Benjamin Netanyahu [→ Spiel: erfundener Name nötig], **Wahl terminiert 27.10.2026** (Herausforderer Gadi Eisenkot führt Umfragen; GlobalSource, 20.03.2026). Wirtschaft elastisch: BIP ~530 Mrd. $, 2026 nach Q1-Einbruch (−3,3 % annualisiert) und Q2-Sprung (+15,4 %) Prognose 3,3–3,8 % (IWF/Bank of Israel/OECD), Defizit ~5,2–5,5 % des BIP; Gaza-Krieg kostete 57 Mrd. $ (8,6 % BIP; Bank of Israel 03/2026), Iran-Krieg zusätzlich ~11 Mrd. $ direkt. Hauptbaustelle: Gaza-Nachkriegsordnung (Board of Peace, Hamas-Entwaffnung ungelöst — Kushner-Mission ohne Durchbruch 08/2026), dazu Kriegsermüdung und Wahl.

**Beziehung zur Türkei heute.** Handel: **faktisch null** — die Türkei hält die Total-Handels-/Hafen-/Luftraumsperre seit 02.05.2024 vollständig aufrecht, verschärft 02/2026 (keine Zertifikate für Israel-Fracht; FDD, 24.02.2026; Akbank-Emissionsrundschreiben 2026). Ausnahme-Grauzone: aserbaidschanisches Öl für Israel (~die Hälfte israelischer Importe) läuft weiter über Ceyhan (CRS R44245). Konfliktlinien: (a) Gaza/Hamas — Ankara beherbergt Hamas-Figuren, erließ 07/2026 Haftbefehle gegen Netanyahu und strebt Interpol-Notices an (J Street, 22.09.2026); (b) Syrien — Israel sieht türkische Basen/Rüstung für Damaskus als Bedrohung, bombardierte 08/2026 einen für türkische Truppen vorgesehenen Stützpunkt; beide Seiten führen technische Deconfliction-Gespräche; (c) Israel erkannte 2026 den Völkermord an den Armeniern offiziell an — reine Provokation gegen Ankara. Kooperation: fast keine bilaterale; indirekt über Gaza-Waffenruhe-Architektur (Türkei Unterzeichner der Sharm-El-Sheikh-Deklaration 13.10.2025, Mitglied im Board of Peace). Zustand: Kalte Konfrontation mit Sicherheits-Feuerwehr — beide wollen keinen direkten Zusammenstoß, aber die Rhetorik ist kriegsähnlich.

**Rote Linien:** (1) Keine türkischen Truppen-/Waffenstationierung in Syrien südlich einer informellen Linie bzw. in Reichweite der Golan-Front; (2) keine Hamas-Kommando-Infrastruktur in der Türkei; (3) keine Lieferung strategischer Waffen (Luftabwehr, Langstrecken) an Damaskus; (4) keine physische Blockade-Operationen gegen israelische Schifffahrt jenseits der bestehenden Sperre; (5) Gas-/Energieprojekte Ostmediterran ohne israelische Einbindung werden sabotiert.

**Was Israel von der Türkei will:** Mäßigung im Board of Peace; Hamas-Kanal nutzen, aber zügeln; Deconfliction in Syrien institutionell; Ende der Handelssperre als Signal; keine NATO-/EU-Blockade israelischer Interessen.

**Was die Türkei von Israel will:** Ende der Gaza-Operationen und dauerhafte Waffenruhe mit Zwei-Staaten-Perspektive; Stopp der Angriffe auf syrische Infrastruktur; keine Sabotage der türkischen Syrien-Rolle; Rücknahme der Armenien-Anerkennung; Wiederherstellung minimaler diplomatischer Kanäle.

**2028-Projektion.** Juni 2028: Nach der Wahl 10/2026 regiert wohl Eisenkot oder eine Einheitsvariante — Ton milder, Interessen gleich; Handelssperre allenfalls teilweise gelockert, volle Normalisierung nicht vor Gaza-Regelung. Wendepunkte: Wahlausgang 10/2026; Gaza-Phase-2 (Entwaffnung scheitert/gelingt); Iran-Kriegs-Endzustand (ein geschwächter Iran entschärft die türkisch-israelische Rivalität nicht automatisch — beide konkurrieren um das Vakuum); Eskalationsunfall in Syrien.

## 14. Ägypten

**Zustand Sept. 2026.** Präsidialrepublik unter faktischer Militärherrschaft; Präsident Abdel Fattah al-Sisi [→ Spiel: erfundener Name nötig]. Wirtschaft im IWF-Korsett: Wachstum FY2025/26 ~4,6–4,7 %, IWF-Prognose 2026 zwischen 4,2 % (04/2026, Kriegsabschlag) und 4,6 % (07/2026); Inflation wieder steigend auf 14,9 % (07/2026); Pfund ~51/$; das 8-Mrd.-$-EFF-Programm läuft Ende 2026 aus; Suez-Einnahmen erholen sich (4,67 Mrd. $ FY25/26, +23 %, aber weit unter 10,2 Mrd. 2023). Hauptbaustelle: Lebenshaltung/Sozialstabilität + Schulden (Bruttofinanzierungsbedarf ~40 % des BIP).

**Beziehung zur Türkei heute.** Handel: ~8,8–9 Mrd. $ (2024/25), größter Afrika-Partner der Türkei; Ziel **15 Mrd. $ bis 2028** (Gemeinsame Erklärung Kairo, 04.02.2026); türkische Investitionen ~4 Mrd. $, ~100.000 Jobs (DEİK, 02/2026). Konfliktlinien: (a) Seegrenzen/Gas Ostmediterran — Ägypten steht formal im Griechenland-Abkommen-Lager von 2020 und vereinbarte 12/2025 mit Haftar eine ägyptisch-libysche Abgrenzung, die gegen das Türkei-Libyen-Memorandum zielt (Al Majalla, 30.12.2025); (b) Muslimbrüder-Exilfrage (entschärft, nicht gelöst); (c) Wettbewerb um Libyen-Einfluss. Kooperation: Strategische Partnerschaft inkl. Verteidigungskooperation (04.02.2026), R-4-Quartett, BOTAŞ-FSRU für Ägypten (Höegh Gandria, Q4/2026 Ain Suchna), Ro-Ro-Wiederbelebung, Gaza-Koordination. Zustand: Pragmatische Annäherung mit Energie-Signum — beide haben die Feindschaft von 2013–2023 begraben, das Meer zwischen ihnen ist aber noch ungeklärt.

**Rote Linien:** (1) Keine türkische Militär-/Seegrenzpolitik, die ägyptische AWZ-Ansprüche (Griechenland-Deal 2020) beschneidet; (2) keine Wiederbelebung der Muslimbrüder als politische Karte; (3) Nil-Wasser (GERD) ist Existenzfrage — keine türkische Instrumentalisierung Äthiopiens; (4) kein türkischer Alleingang in Libyen gegen ägyptische Westgrenz-Sicherheit; (5) Suez-/Rotmeer-Sicherheit nicht antasten.

**Was Ägypten von der Türkei will:** Investitionen und Industrieansiedlung; Handelsziel 15 Mrd. $ erreichen; Rüstungs-/Drohnenkooperation; LNG-/FSRU-Flexibilität; Abstimmung in Libyen (gemeinsame Linie statt Stellvertreter); türkische Zurückhaltung bei der Griechenland-Konfrontation.

**Was die Türkei von Ägypten will:** Anerkennung (oder Nicht-Blockade) des Libyen-Memorandums; Marktzugang/Visa für Unternehmer; gemeinsame Gaza-/Palästina-Linie; Energiekooperation (Strom, Gas); R-4 als anti-israelisches Gewicht ohne Krieg.

**2028-Projektion.** Juni 2028: IWF-Programm abgelöst durch Folgevereinbarung oder Marktzugang; Handel Richtung 12–15 Mrd. $; das entscheidende bilateral offene Thema bleibt die Seegrenze — ein Türkei-Ägypten-AWZ-Deal wäre der größte strukturelle Umbau des Ostmediterranen. Wendepunkte: Haftar-Nachfolge in Ostlibyen, GERD-Krisenzyklus mit Äthiopien, ägyptische Sozialstabilität bei erneuter Inflation, Gaza-Endzustand.

## 15. Libyen

**Zustand Sept. 2026.** Geteiltes Land: international anerkannte GNU unter Abdul Hamid Dbeibeh in Tripolis, gegenüber dem Haftar-Lager im Osten (HoR/Hammad, LNA) [→ Spiel: erfundene Namen nötig]. Paradox aus Ölboom und Staatszerfall: Förderung 1,43–1,5 Mio. bpd (13-Jahres-Hoch 06/2026, Ziel 1,6 Mio. Ende 2026), Öleinnahmen ~22 Mrd. $ 2025; BIP ~48,4 Mrd. $, Wachstum 6,4–6,7 % 2026 (WB/IWF), aber Dinar-Abwertung 14,7 % (01/2026), Inflation 12,4 % (03/2026), Fiskaldefizit ~30 % des BIP. Hauptbaustelle: die „Familien-Duopolie" — Saif al-Islam Gaddafi am 03.02.2026 ermordet; US-Vermittler Boulos schlägt Dbeibeh-PM + Saddam-Haftar-Präsidialrat vor (Rubio empfing Saddam 29.06.2026); Wahlen weiter ohne Termin. Russisches Africa Corps (800–1.200 Mann) im Osten/Süden (CES Intelligence, 18.08.2026).

**Beziehung zur Türkei heute.** Handel: Türkei ist Libyens größte Importquelle (26,4 % der Importe 2025; türkische Exporte 3,16 Mrd. $, Importe 0,38 Mrd. $ — UN Comtrade via TradingEconomics 2026). Konfliktlinien: (a) das 2019er-Seegrenz-Memorandum ist für Griechenland/Ägypten/Zypern/EU illegal — Tripolis hält daran fest, Ankara braucht die Tobruk-Ratifizierung; (b) türkische Militärpräsenz (Mitiga, Misrata) vs. russischer Präsenz im Osten; (c) Geldflüsse/Schmuggel parallel zur Diplomatie. Kooperation: NOC–TPAO-MoU 06/2025 über vier Offshore-Blöcke (teils überlappend mit griechischen Claims südlich Kreta), Ausbildung/Drohnen für den Westen, Bauaufträge, **Annäherung an Haftar seit 2025** (MİT-Chef in Bengasi 08/2025; Tobruk-HoR Richtung Ratifizierung des 2019er-Deals; Africa Confidential, 25.08.2025). Zustand: Ankara hat vom Parteigänger zum beidseitigen Patron aufgerüstet — einzigartige Position, aber an libysche Familienpolitik gekettet.

**Rote Linien:** (1) Kein Verkauf des 2019er-Memorandums in einem Gesamtdeal; (2) keine ausländische (türkische) Besatzung jenseits der Ausbildungsmission; (3) Öleinnahmen-Verteilung nicht einseitig (beide Lager); (4) keine türkische Unterstützung für militärische Eroberung des jeweils anderen Landesteils; (5) Souveräne Vertragshoheit der NOC wahren.

**Was Libyen (beide Lager) von der Türkei will:** Tripolis: militärische Abschreckung, Ausbildung, Aufträge, diplomatischen Schutz des Memorandums. Osten: Legitimität für die Haftar-Nachfolge, Waffen/Training, Ankaras Für-sprache bei der Ratifizierung. Beide: Investitionen, Strom, Visa-Kanäle.

**Was die Türkei von Libyen will:** Ratifizierung des Memorandums durch beide Parlamente/Lager; Offshore-Lizenzen für TPAO; Stabilität ohne neuen Bürgerkrieg; Bau-/Rekonstruktionsaufträge; Eindämmung russischer Expansion (Africa Corps); Migrationskontrolle über die Mittelmeerroute.

**2028-Projektion.** Juni 2028: wahrscheinlich formalisiertes Duopol (Boulos-Rahmen) mit erneut verschobenen Wahlen; Öl fließt (1,5–1,6 Mio. bpd); türkische Position West+Ost hält. Wendepunkte: Tod des 82-jährigen Haftar (Nachfolgechaos), Ratifizierung des Memorandums in Tobruk (= Krise mit Athen/Kairo), neuer Milizenkrieg um Tripolis, US-Rückzug aus der Boulos-Datei.

## 16. Kasachstan

**Zustand Sept. 2026.** Autoritäre Präsidialrepublik mit kontrollierter Reformagenda; Präsident Qassym-Schomart Tokajew [→ Spiel: erfundener Name nötig]. Wirtschaft: BIP ~270–290 Mrd. $ [unverifiziert, IWF-Reihe], Wachstum 2026 zwischen 4,5 % (Weltbank GEP 01/2026) und 5,5 % (EDB 12/2025) — Abkühlung nach 6 % 2025 wegen Ölpreis-/Förderschwankungen und CPC-Angriffen; Inflation ~9,7–10,7 % (IWF 04/2026). Hauptbaustelle: Export-Routen-Diversifikation (CPC-Pipeline durch Russland mehrfach angegriffen) und Distanzpflege zu Moskau ohne Bruch.

**Beziehung zur Türkei heute.** Handel: ~4,4–5 Mrd. $ (10 Monate 2025: 4,36 Mrd., kasachische Seite via Times of Central Asia 01/2026), offizielles Ziel 15 Mrd. $; Türkei unter den Top-5-Investoren. Konfliktlinien: keine nennenswerten bilateralen — eher strukturelle Grenzen (Größe des Marktes, russische/chinesische Vorrangstellung). Kooperation: Organisation der Turkstaaten (OTS-Gipfel Gabala 10/2025), Mittlerer Korridor (Bahnabkommen 07/2025), TRIPP als neue kasachische Öl-Option (Mazhilis-Debatte 14.01.2026), Uran-/Kupfer-/Getreide-Lieferungen, Rüstungs-/Drohneninteresse. Zustand: Herzliche, aber eher langsame strategische Partnerschaft — Astana spielt alle Korridorkarten parallel.

**Rote Linien:** (1) Keine türkische Politik, die Astana zur Wahl zwischen Moskau und Ankara zwingt; (2) keine pan-turkische Agenda, die innere Stabilität (russischsprachige Minderheit) berührt; (3) keine Sanktionsumgehungs-Verwicklungen, die kasachische Banken gefährden; (4) Kaspische Fragen (Status, Routen) nicht ohne Astana; (5) Uran-/Atom-Kooperation nur unter internationaler Aufsicht.

**Was Kasachstan von der Türkei will:** Transitkapazität über TRIPP/BTK ins Mittelmeer; Investitionen in Nicht-Rohstoffe; Rüstungstechnologie; Turkstaaten-Plattform als Balance zu EAEO/SCO; Marktzugang für Getreide, Kupfer, Uran.

**Was die Türkei von Kasachstan will:** Mittlerer Korridor mit Volumen; Öl-/Uran-Lieferoptionen (Ceyhan-Route über BTC); Abstimmung in der OTS; kasachisches Kapital; keine Unterstützung russischer Positionen im Kaukasus.

**2028-Projektion.** Juni 2028: unverändert stabiler Kurs; der Mittlere Korridor ist real gewachsen (TRIPP-Baufortschritt), Handel Richtung 6–8 Mrd. $. Wendepunkte: Tokajew-Nachfolgedebatte (keine Wahl vor 2029), russischer Druck bei Ukraine-Eskalation, CPC-Verfügbarkeit, chinesische Infrastrukturkonkurrenz.

## 17. Zypern

**Zustand Sept. 2026.** Geteilte Insel: Republik Zypern (EU-Mitglied, griechisch-zyprischer Süden) unter Präsident Nikos Christodoulides [→ Spiel: erfundener Name nötig]; im Norden die nur von der Türkei anerkannte TRNZ unter Tufan Erhürman (gewählt 10/2025, föderationsorientiert — Bruch mit der Zwei-Staaten-Linie seines Vorgängers) [→ Spiel]. Wirtschaft Süd: BIP ~35–38 Mrd. $ [unverifiziert], Wachstum 3,5 % 2025 bzw. ~3 % 2026–28, Inflation 1,7 % 2026, Schulden 56,2 % des BIP (Zentralbank Zypern via athloscapital, 02/2026). Hauptbaustelle: das neue UN-Verhandlungsfenster — Guterres (Mandat endet 12/2026) besuchte die Insel 28.07.2026 und strebt ein informelles 5+1-Treffen (beide Gemeinschaften + Garantiemächte Griechenland, Türkei, UK + UN) noch 2026 an; UN-Res. 2815 (01/2026) hält an der bizonalen, bizonnen Föderation fest; EU installierte mit Fitto einen Sonderbeauftragten (13.07.2026).

**Beziehung zur Türkei heute.** Handel: kein offizieller bilateraler Handel (türkische Embargopolitik, keine Anerkennung); TRNZ-Handel mit der Türkei ~2 Mrd. $ [unverifiziert]. Konfliktlinien: (a) Ankara-Protokoll (Häfen/Flughäfen für zyprische Schiffe) unerfüllt; (b) AWZ/Bohrungen und das Türkei-Libyen-Memorandum; (c) Varoscha, Truppenpräsenz, Garantien. Kooperation: indirekt — Verhandlungs-CBMs (neue Übergänge, gemeinsame Solaranlage, beschlossen 03/2025, Umsetzung schleppend); Erhürman eröffnet erstmals seit Jahren eine föderale Gesprächsoption. Zustand: Erstes echtes Verhandlungsfenster seit Crans-Montana 2017 — aber die Grundpositions-Kluft (Föderation vs. zwei Staaten) ist nur verkleidet, nicht geschlossen; Nikosia nutzte seine EU-Ratspräsidentschaft (H1/2026) als Hebel in der EU-Türkei-Datei.

**Rote Linien (Republik Zypern):** (1) Keine Anerkennung/Upgrade der TRNZ (Zwei-Staaten = Verletzung der UN-Beschlüsse); (2) Direkthandel/Direktflüge in den Norden = Grenzüberschreitung; (3) keine Bohrungen in der zyprischen AWZ; (4) Garantierechte 1960 + türkische Truppen müssen auf den Tisch; (5) kein EU-Schritt Richtung Türkei (Zollunion, SAFE) ohne Bewegung in der Zypernfrage.

**Was Zypern von der Türkei will:** Ankara-Protokoll umgesetzt; Verhandlungs-Rückkehr auf UN-Basis mit Substanz; Truppen-/Garantie-Modernisierung; keine Bohrschiffe; Varoscha-Rückgabe als Vertrauensmaßnahme.

**Was die Türkei von Zypern will:** Gleichberechtigung der Türkisch-Zyprer; Direkthandel-Option; AWZ-Teilung/Energiekonsortium mit Nordbeteiligung; Ende des zyprischen Vetos in EU-Fragen; internationale Aufwertung der TRNZ schrittweise.

**2028-Projektion.** Juni 2028: Nach dem Guterres-Fenster (5+1 bis Ende 2026) und unter einem neuen UN-Generalsekretär ist entweder ein Rahmenwerk in Verhandlung oder der Prozess erneut eingefroren — beides gleich plausibel. Wendepunkte: zyprische Präsidentschaftswahl 02/2028 (Christodoulides' Wiederwahl hängt am Prozess), türkische Wahl 2028, Erhürmans Durchhaltevermögen gegen Ankaras Zwei-Staaten-Reflex, und das Energie-Kräftespiel (AWZ-Funde, Great Sea Interconnector).

---

# TEIL II — Bonus-Dossiers (kurz)

## B1. Deutschland (wichtigster EU-Einzelstaat)

**Zustand Sept. 2026.** Bundesrepublik; Bundeskanzler Friedrich Merz (CDU, seit 05/2025) [→ Spiel: erfundener Name nötig]. Wirtschaft: BIP ~4,9–5,0 Bio. $ [unverifiziert], Wachstum nur ~0,8 % 2026 (IWF 07/2026), Inflation ~2,5 % energiebelastet; Fiskalpaket (Infrastruktur/Verteidigung) trägt ab 2027. Hauptbaustelle: Industrie-Schwäche + Energiekosten + Aufrüstungsfinanzierung.

**Beziehung zur Türkei.** Größter europäischer Einzelpartner: Handel 2025 **~52,3 Mrd. $** (Exporte 22,17 + Importe 30,11; TÜİK 01/2026); ~3 Mio. Menschen mit türkischem Hintergrund. Merz-Besuch Ankara 10/2025 markierte den Reset: Eurofighter-Freigabe (40 Jets: 20 Neubau + je 12 gebrauchte aus Katar/Oman; erste Katar-Maschinen 02/2026 geliefert), Rüstungs-Kooperation Richtung SAFE, Migrations-/Rücknahmekooperation (Kyiv Post, 01.11.2025; Defence Security Asia, 01/2026). Konfliktreste: Menschenrechts-Kritik (İmamoğlu), Wadephul-Diplomatie in Syrien-Fragen, griechisch-französischer Widerstand gegen Türkei-Integration in EU-Rüstung.
**Rote Linien:** keine Ausweisung/Verfolgung deutscher Staatsbürger politisch motiviert; keine Nutzung der Diaspora für Wahl-/Spitzeloperationen; Rechtsstaats-Mindeststandards als Bundestags-Bedingung für Rüstungsdeals; NATO-Kohäsion nicht gefährden.
**Will von der Türkei:** Rücknahme Abgelehnter; Deeskalation Ägäis; Industriekooperation (Rüstung, Energie); Stabilität als NATO-Südflanke.
**Türkei will:** Eurofighter/Meteor vollständig + Technologie; Zollunion-Stimme in Berlin; Investitionen; Visaleichter; politische Deckung gegen EP-Berichte.
**2028:** Koalitionslage nach der Bundestagswahl 2029 (noch nicht am Horizont zum Spielstart relevant) — 2028 ist Merz in der Sache festgefahren: pragmatischer Türkei-Kurs hält, solange keine Menschenrechts-Eskalation. Wendepunkte: SAFE-Entscheid 2027, Zypern-Dynamik, türkische Wahl 2028.

## B2. China

**Zustand Sept. 2026.** Einparteienstaat; Generalsekretär Xi Jinping [→ Spiel: erfundener Name nötig]. Wirtschaft: BIP ~19–20 Bio. $, Wachstum 4,4–4,6 % 2026 (IWF 04–07/2026), Inflation ~0–0,8 % (Deflationsdruck), Immobilienkrise ungelöst; Hauptbaustelle: Binnenkonjunktur + US-Zollregime + Energieimporte über Hormus (China größter Empfänger von Hormus-Öl, 5,4 Mio. bpd — Nasser Saidi, 03/2026).

**Beziehung zur Türkei.** Handel 2025: **~52,9 Mrd. $** — aber brutal einseitig: Importe 49,58 Mrd. (größte Importquelle), Exporte nur 3,28 Mrd.; Defizit ~46,3 Mrd. $ (TÜİK 01/2026; passt exakt zum `abkommen.ts`-Text). Konfliktlinien: (a) BYD-Debakel — 1-Mrd.-$-Werk Manisa pausiert, Türkei entzog 06/2026 Steuerprivilegien und droht mit Rückforderung (Nikkei via eletric-vehicles, 16.06.2026); (b) Uiguren-Frage (offiziell leise, ungelöst); (c) Zollunion-Umgehung vs. EU-„Made in Europe"-Regeln. Kooperation: Mittlerer Korridor (Landbrücke an Russland vorbei), RMB-Clearing seit 11/2025, SCO-Dialogpartnerschaft, Atom-/Infrastruktur-Optionen (Sinop-Gespräche).
**Rote Linien:** keine offizielle Uiguren-Eskalation (Anerkennung „Genozid"-Rahmen, Asyl-Aktionen); keine Taiwan-/Seidenstraßen-Sabotage; keine Diskriminierung chinesischer Firmen unter Erpressungsschwellen; Sicherheit chinesischer Investitionen.
**Will von der Türkei:** Korridor-Zuverlässigkeit (Bahnkapazität, Häfen); Marktzugang ohne Strafzölle; Rücknahme der BYD-Strafaktion; Rohstoffe (Bor, Seltene Erden-Optionen); politische Neutralität in US-China-Fragen.
**Türkei will:** Defizit-Ausgleich (Zölle, Quoten, Investitionen); Fabriken (Auto, Batterie); RMB-Swap-Aufstockung; Tourismus; Technologietransfer.
**2028:** China bleibt der strukturelle Gläubiger der türkischen Leistungsbilanz; nach dem BYD-Bruch entscheidet 2027 ein neues Investitionspaket (Batterie/EV) über die Richtung. Wendepunkte: US-China-Zollkriegs-Verlauf, Hormus-Dauerlösung (China-Energiepreis), Taiwan-Szenario (alles verändert sich).

## B3. Großbritannien

**Zustand Sept. 2026.** Parlamentarische Monarchie; Premierminister Keir Starmer (Labour) [→ Spiel: erfundener Name nötig]. Wirtschaft: BIP ~3,6–3,8 Bio. $ [unverifiziert], Wachstum ~1,0 % 2026 (IWF 07/2026), Inflation ~3 %; Hauptbaustelle: Produktivität, Energiekosten, Verteidigungsanstieg.

**Beziehung zur Türkei.** Handel: £28 Mrd. (~37 Mrd. $) inkl. Dienstleistungen (UK Gov. via Yeni Şafak, 12/2025); Waren: Exporte der Türkei 16,77 Mrd. $ 2025 (2. größter Markt). UK ist 7. größter ausländischer Investor. Die **erweiterte FTA** (über die Continuity-Vereinbarung hinaus: Dienstleistungen, Digital, Fintech) ist nach 5 Verhandlungsrunden (letzte: Ankara 06/2026) auf Inkrafttreten **H2 2026** ausgerichtet (GOV.UK, 18.03.2026). Rüstungs-Pate: UK orchestrierte den Eurofighter-Verkauf (MoU 23.07.2025) und Meteor-Freigabe (Frankreich stimmte zu). Kooperation zusätzlich: Zypern-Garantiemacht, Ukraine-„coalition of the willing".
**Rote Linien:** Souveräne Basen auf Zypern (Akrotiri/Dhekelia) unantastbar; keine Unterwanderung der Zypern-Verhandlungen; Rüstungs-Technologie nicht an Dritte weiterreichen; Finanzsanktions-Disziplin (London als Kanal).
**Will von der Türkei:** FTA abschließen; NATO-Südflanke; Migrationszusammenarbeit; Zypern-Mäßigung.
**Türkei will:** FTA (Dienstleistungen!); Eurofighter-Logistik dauerhaft; London-Finanzkanal; UK-Stimme für Zollunion/SAFE in Brüssel (indirekt).
**2028:** FTA in Kraft und erstes Reallab der post-Brexit-Türkei-Achse; Zypern-Verhandlungsfenster macht UK zum relevanten Garantiemacht-Akteur. Wendepunkte: UK-Wahl (spätestens 2029), Zypern 5+1-Ergebnis, Eurofighter-Auslieferungstempo (2030-Ziel).

## B4. Katar

**Zustand Sept. 2026.** Emirat; Emir Tamim bin Hamad Al Thani [→ Spiel: erfundener Name nötig]. Wirtschaft im Kriegsschaden: BIP ~217–240 Mrd. $ nominal; Weltbank/IWF sehen 2026 einen **Schrumpfungseinbruch von −5,7 bis −8,6 %** (Weltbank MPO 2026; IWF via Worldometer) — LNG-Exporte −96 % gegenüber Vorkrieg (FocusEconomics 08/2026), Ras Laffan durch iranische Angriffe 03/2026 um ~17 % Kapazität beschädigt (Reparatur 3–5 Jahre); QIA ~510–580 Mrd. $ Staatsfonds. Hauptbaustelle: physische Wiederherstellung der Exporte + Wiederaufbau der Vermittlerrolle (seit 24.03.2026 „nicht aktiv vermittelnd", Fokus Verteidigung — ME Council, 09/09.2026).

**Beziehung zur Türkei.** Handel klein (~2–3 Mrd. $ [unverifiziert]), dafür strategisch dicht: türkische Militärbasis in Doha, gemeinsame Gaza-Vermittlung (Sharm el-Sheikh 10/2025), QIA-Investitionen in der Türkei, Swap-Historie, Beistands-Kultur seit der Blockade 2017. Konfliktlinien: kaum bilaterale; Reibung höchstens über Hamas-Nähe beider. Kooperation: Energie (LNG-Langfrist + Rerouting über US-Cargos), Verteidigung (Eurofighter-Abgabe Katars an die Türkei 02/2026!), Mediation (Katar trägt den Iran-US-Kanal).
**Rote Linien:** keine türkische Parteinahme im GCC-internen Streit (Saudi-VAE-Bruch) gegen Doha; Al-Udeid-/US-Verhältnis nicht gefährden; keine Hamas-Operative-Funktion über Doha hinaus ausweiten.
**Will von der Türkei:** Militärische Abschirmung (Basis) während der Verwundbarkeit; Lebensmittel-/Warenlieferungen (Hormuz bedroht 80 % der GCC-Kalorienzufuhr); diplomatische Begleitung der Iran-Deeskalation.
**Türkei will:** QIA-Geld (Einlagen, Swaps, Assets); LNG-Langfristvertrag zu Freundschaftskonditionen; gemeinsame Vermittler-Marke; Golf-Zugang.
**2028:** Ras Laffan teilrepariert, LNG-Flüsse normalisieren sich 2027 (IEA-Schätzung), Katar kehrt zur aktiven Vermittlung zurück; die türkische Basis bleibt der harte Kern der Beziehung. Wendepunkte: Iran-Deal (Katar als Gewinner), GCC-Bruch-Tiefe, LNG-Markt 2027/28 (North Field East).

---

# TEIL III — Beziehungsmatrix 2026

**Methode:** Startwerte 0–100 je Dimension, kalibriert auf die recherchierte Lage zum Stichtag 25.09.2026. „Handel" misst Volumen/Trend/Instrumentalisierbarkeit, „Sicherheit" Kooperation vs. Bedrohung, „Vertrauen" die politische Beziehungsqualität, „Konflikt" die Intensität offener Streitpunkte (höher = schlimmer). Rechts steht der **aktuelle Code-Startwert** aus `laender.ts` zum Abgleich; Abweichungen > 5 Punkte sind **fett** und in Teil V kommentiert. Alle Werte sind Spielparameter-Empfehlungen, keine Messwerte.

| Akteur | Handel | Sicherheit | Vertrauen | Konflikt | Code (H/S/V/K) | Δ-Hinweis |
|---|---|---|---|---|---|---|
| USA | 70 | 60 | 52 | 45 | 70/65/45/55 | V↑ (Trump-Reset), K↓ (CAATSA-Wende 07/2026), S↓ minimal (Iran-Kriegs-Risiko für Incirlik-Logik) |
| EU | 90 | 55 | 40 | 45 | 90/55/40/45 | Code passt zum Two-Track-Stand |
| Russland | 72 | 38 | 45 | 52 | 75/40/45/50 | H↓ leicht (Öl-Shift), Rest ok |
| Griechenland | 42 | 32 | 35 | 55 | 40/30/30/65 | K↓↓ (Dialogphase 2023–2026, HLCC 02/2026), V↑ |
| Iran | 42 | 30 | 40 | 55 | 55/40/40/45 | H↓↓ (Krieg, Sanktionen, Gasvertrag ausgelaufen), S↓, K↑ (Hormus-Spillover) |
| Syrien | 45 | 55 | 68 | 20 | 35/20/25/75 | **Komplett falsch**: Assad-Ära-Werte; Realität 2026 = Klientelpartnerschaft |
| Irak | 62 | 40 | 45 | 42 | 60/35/40/55 | K↓ (Pipeline-Deal 07/2026, Zaidi), S↑ leicht |
| Ukraine | 58 | 62 | 62 | 15 | 55/60/60/15 | Code ok; H minimal ↑ (FTA-Entwurf 02/2026) |
| Georgien | 65 | 60 | 65 | 20 | 65/60/65/20 | Code ok (BTK-Volllast 06/2026 stützt) |
| Aserbaidschan | 75 | 85 | 85 | 15 | 75/85/85/15 | Code ok — engste Beziehung |
| Armenien | 18 | 28 | 36 | 48 | 20/25/30/55 | V↑ (Direkthandel/Flüge 2026), K↓ (Wahl Paschinjan, Normalisierungskanal) |
| Saudi-Arabien | 55 | 66 | 62 | 28 | 55/50/55/30 | **S↑↑** (Mekka-Pakt 07.08.2026!), V↑ |
| Israel | 10 | 22 | 25 | 70 | 50/25/30/60 | **H↓↓** (Handelssperre = null), K↑ (Haftbefehle, Basen-Bombardierung) |
| Ägypten | 60 | 45 | 50 | 35 | 55/35/40/45 | Alles ↑ (Strategische Partnerschaft 02/2026, Verteidigungs-MoU, FSRU) |
| Libyen | 50 | 58 | 58 | 32 | 45/55/55/35 | H↑ (Türkei #1 Importquelle Libyens 2025) |
| Kasachstan | 55 | 42 | 65 | 10 | 55/40/65/10 | Code ok |
| Zypern | 12 | 15 | 24 | 72 | 15/15/20/75 | V↑ minimal (Erhürman-Fenster), Rest ok |
| **Summen-Check** | — | — | — | — | — | 18 Akteure: 7 Code-Sätze ok, 11 mit Korrekturbedarf, davon 2 gravierend (SYR, ISR) |

**Begründungen zu den Kernkorrekturen (Auswahl):**
- **Syrien (Code 35/20/25/75 → 45/55/68/20):** Der Code spiegelt die Frontstaat-Ära. Realität 25.09.2026: al-Sharaa-Regierung von Ankara installiert/gestützt, 11 Mrd. $ Verträge (12/2025), Militär-MoU 08/2025, SDF 08/2026 aufgelöst, Sanktionen global aufgehoben, Handel +40 % 2025. Konflikt 75 ist heute ein Messfehler — Restrisiken (Israel, Minderheiten, Rückkehr) sind Konflikt ~20, nicht 75.
- **Israel (Code 50/25/30/60 → 10/22/25/70):** Handel ist seit 05/2024 null und wurde 02/2026 noch verschärft (Zertifikats-Stopp). Der Code-Wert 50 bildet eine Welt ab, die es seit über zwei Jahren nicht gibt.
- **Saudi-Arabien (Sicherheit 50 → 66):** Der Mekka-Beistandspakt (07.08.2026) ist ein förmlicher Verteidigungspakt mit Kollektivklausel — das muss in „Sicherheit" und als bestehendes Abkommen im Spielstand sichtbar sein.
- **Griechenland (Konflikt 65 → 55):** Seit der Erdbeben-Diplomatie 2023 und dem HLCC 02/2026 ist die Beziehung deeskaliert, aber ungelöst; 65 wäre 2020/22 angemessen gewesen, nicht 2026.
- **Iran (Handel 55 → 42):** Krieg, Snapback (09/2025), Blockade und der ausgelaufene Gasvertrag (07/2026) drücken Volumen und Berechenbarkeit; die Dimension „Sicherheit" (40 → 30) trägt das neue Eskalationsrisiko an der Ostgrenze.

---

# TEIL IV — Konflikt-Topologie (Konflikte zwischen Dritten)

Die Vermittlungs-Mechanik des Spiels braucht die Landkarte der Konflikte, an denen die Türkei **nicht** Hauptpartei ist, aber als Vermittler/Betroffener agiert. Stand: 25.09.2026.

## A. Aktive Kriege und blockierte Konflikte

**A1. USA/Israel ↔ Iran (Krieg seit 28.02.2026).** Zentraler Weltkonflikt des Stichtags. Eröffnungsschläge töteten Ali Khamenei; Iran schloss Hormuz; Islamabad-Memorandum (14.–17.06.2026) brachte 60-Tage-Waffenruhe + ~24 Mrd. $ freigegebene Gelder + Sanktions-Suspendierung im Fenster, aber die Hormus-Frage blieb ungelöst: Iran koppelt Öffnung an Blockade-Ende/Sanktionen/Waffenruhe, Trump lehnte den 7-Tage-Plan Ende 09/2026 ab („outsmarted themselves"), Katar/Oman-Kanal aktiv, keine US-Iran-Schläge seit 21.09.2026 (House of Commons Library 04.09.2026; straits.live 26.09.2026; militaryspend.org 29.09.2026). **Türkei-Rolle:** bisher Randvermittler (Angebot Hormus/Waffenruhe), potenziell Gastgeber; wirtschaftlich Hauptleidtragender des Ölpreises außerhalb der Kriegsparteien. Wendepunkt-Daten: US-Midterms 04.11.2026; Benzinpreis-Deadline Washingtons.

**A2. Russland ↔ Ukraine (Krieg seit 24.02.2022).** Front Donbas/Sumy/Cherson; russische Vorstöße Richtung Pokrovsk (12/2025 ff.). Diplomatie-Kette 2025/26: Istanbul-Runden (05–07/2025), Abu Dhabi trilateral (23.01./04.02.2026, 314-Gefangenen-Tausch), Genf (17.–18.02.2026, gescheitert an Territorialforderungen), 32-h-Oster-Waffenruhe (04/2026, gebrochen), 1000-für-1000-Austausch (05/2026), London-Treffen UK/F/D/Ukraine (07.06.2026), NATO-Gipfel Ankara (07/2026: Hilfszusagen), Witkoff/Kushner in Moskau und Kiew (05./06.09.2026) mit 72-h-Hauptstadt-Waffenruhe — danach „Hoffnungen verblasst" (LIGA.net, 30.09.2026). **Türkei-Rolle:** bewährter Austragungsort + Getreideplan in Schublade (Fidan 31.08.2026) + maritime Sicherheitskomponente. Ein Erfolg hier ist der größte Prestige-/Preis-Hebel des Spiels (Weizen, Dünger, Energie).

**A3. Armenien ↔ Aserbaidschan (Post-Krieg, Frieden parafiert).** Friedensvertragstext fertig seit 13.03.2025, parafiert 08.08.2025 (Weißes Haus), **nicht signiert**: Baku verlangt vorher armenische Verfassungsänderung (kein Territorialanspruch), Referendum wohl 2027; TRIPP-Bau soll H2/2026 beginnen (asero. Sektion fast fertig); Aserbaidschan hob 10/2025 das Warentransit-Verbot auf; bilateraler Kleinhandel läuft (Carnegie 06/2026; worldatlas 05/2026; Stratfor via parliament-wa 01/2026). **Türkei-Rolle:** Schutzmacht Bakus, aber Nutznießer des Friedens (Korridor!); hält die eigene Grenze zu Armenien als Druckhebel geschlossen. Bruchpunkt: armenische Innenpolitik (Referendum) oder russische Sabotage.

**A4. Armenien ↔ Türkei (Normalisierung im Wartestand).** Statuskette 2026: e-Visa Diplomaten (01.01.), THY-Direktflug (11.03.), Direkthandel registriert (11.05.), Ani-Brücke-Protokoll (04.05.), Achalkalaki–Kars-Warenweg (23.05.), Arbeitsgruppe Kars–Gjumri-Bahn (28.04., ~5 Monate Gleisarbeit) — **aber Grenze geschlossen**, gekoppelt an A3-Signatur (Fidan 11/2025). Erwartungshaltung: Teilöffnung (Drittstaatler) wurde mehrfach für 2026 erwartet, zuletzt 06/2026-Gerücht von Azertaj dementiert (Azatutyun, 13.05.2026). **Vermittlungsrelevanz:** Das ist faktisch ein Drei-Parteien-Deal (Eriwan–Baku–Ankara) — ideale Vorlage für eine Paket-Verhandlungsmechanik.

## B. Strukturelle Rivalitäten ohne offenen Schusswechsel

**B1. Griechenland ↔ Türkei ↔ Zypern (Dreieck).** Ägäis-Paket + Zypern-Frage verzahnt; Ruhephase seit 2023, aber 02/2026 zeigte die Fragilität (seismische Ankündigung südlich Kreta während des Mitsotakis-Besuchs). Neue Eskalationskante: Chevron-Blöcke südlich Kreta (02/2026) ↔ TPAO/NOC-Blöcke aus dem Libyen-MoU überlappen sich. Zypern-Fenster (5+1 bis Ende 2026) ist der einzige echte Entblocker.

**B2. Saudi-Arabien ↔ VAE (Bruch).** Mukalla-Bombardement (12/2025, Saudi schlug VAE-verlinkte Waffenlieferung), VAE-OPEC-Austritt (01.05.2026), rivalisierende Jemen-/Sudan-/Horn-von-Afrika-Positionen. **Türkei-Rolle:** steht im Mekka-Pakt auf Saudi-Seite; VAE-Kanal (28 Mrd. $ Handel) parallel pflegen — Balance-Mechanik.

**B3. Saudi-Arabien/Golf ↔ Huthis/Iran-Stellvertreter.** Raketen-/Drohnenangriffe auf Saudi (Taif, Yanbu) auch 09/2026 (Angel One, 28.09.2026); Bab al-Mandeb unter Huthi-Kontrolle (09/2026 eroberten Huthis Küstenabschnitte + Großbasis). Golf-Sicherheitsarchitektur in Auflösung → Mekka-Pakt als Antwort.

**B4. Israel ↔ Syrien (Post-Assad-Spannung).** Israel hält Pufferzonen im Südwesten, zerstörte syrische Strategiewaffen (12/2024 ff.), Sicherheits-/Wirtschaftsdeal in Paris vereinbart (01/2026, Finalisierung ausstehend); türkische Basenpläne sind Israels Hauptirritation (Bombardement 08/2026). Deconfliction Israel–Türkei läuft technisch weiter.

**B5. Libyen intern (Ost ↔ West) + externe Patrone.** Duopol Dbeibeh/Haftar; Türkei (Westen, zunehmend auch Osten) vs. russisches Africa Corps (Osten/Süden) vs. Ägypten (Grenzsicherung, Haftar-Seegrenz-Deal 12/2025) vs. VAE (Osten-Finanzierung). Kein Krieg seit 2020, aber kein Staat. Vermittlungsoption: Ankara als einziger Akteur mit Zugang zu beiden Lagern.

**B6. Russland ↔ Georgien (okkupierte Gebiete).** Abchasien/Südossetien weiter russisch besetzt; GD-Regierung rückt rhetorisch von der EU ab, Moskau hält die Besetzung leise. Fürs Spiel: Georgiens Transitwert wächst, solange Moskau nicht stört — ein „eingefrorener, aber aktivierbarer" Konflikt.

**B7. USA ↔ Russland (Sanktionsregime).** Rosneft/Lukoil-Sanktionen (11/2025), Shadow-Fleet-Jagd, Preisdeckel ~44–47 $ vs. Urals-Kriegspreis 112 $ (04/2026) — das Preisgefälle subventioniert faktisch Schattenkanäle; Türkei ist einer davon („ungenannte Herkunft", 7,27 Mrd. $ Q1/2026; TradeInt). Sekundärsanktions-Druck auf Ankara ist die Übertragungsleitung dieses Konflikts ins Spiel.

**B8. USA ↔ China (Zoll-Waffenruhe, Technologiekrieg).** Effektive US-Zollrate auf ~7–8,5 % gesunken (IWF 06/2026), AI-Investitionsboom beiderseits; für die Türkei relevant als Rahmen des Mittleren Korridors (China-Ausweichroute) und der Seltene-Erden-Option (Beylikova).

**B9. Ägypten ↔ Äthiopien (GERD/Nil).** Nicht im Spiel-Akteurskreis, aber Ägyptens Existenzthema; erwähnt, weil es Kairos Türkei-Kalkül (Stabilitätspartner gesucht) erklärt. [unverifiziert in dieser Runde — nicht neu recherchiert]

**B10. Iran-interne Sukzession/Instabilität.** Mojtaba-Legitimität, IRGC vs. Präsident (Pezeshkian-Bruch-Gerüchte 05/2026), Protestzyklus — kein zwischenstaatlicher Konflikt, aber die Variable mit dem größten Spieler-Einfluss auf 6 Nachbardossiers zugleich.

**Vermittlungs-Priorität für die Spielmechanik (Ertrag × Machbarkeit):** (1) A2 Ukraine-Russland — globaler Preishebel; (2) A3/A4 Kaukasus-Dreieck — Paket-Deal mit konkretem Geographie-Lohn (TRIPP + Grenze); (3) A1 Hormus-Iran — Energiepreis-Hebel, hohe Varianz; (4) B1 Ägäis/Zypern — EU-Hebel; (5) B5 Libyen — Memorandum-Ratifizierung als türkischer Zugewinn.

---

# TEIL V — Übertrag ins Spiel (Code vs. Realität 25.09.2026)

Stichproben-Abgleich von `game/src/sim/laender.ts` (Startwerte, Anliegen) und `game/src/data/abkommen.ts` (Klauseln, Profile, Ausstrahlung) mit der recherchierten Realität.

## 5.1 Startwerte `laender.ts` — dringende Korrekturen

1. **SYR — größte Diskrepanz.** Code: `start: { handel: 35, sicherheit: 20, vertrauen: 25, konflikt: 75 }` mit Text „Nachbar im Süden nach Jahren des Krieges". Das ist die Assad-/Frontstaat-Ära. Realität: Klientelpartnerschaft (siehe Matrix). Empfehlung: **45/55/68/20**, Text ersetzen (al-Sharaa-Äquivalent, SDF-Auflösung 08/2026, Wiederaufbau-Verflechtung). Die Anliegen „syr-rueckkehr" und „syr-grenze" bleiben nutzbar, sollten aber um „SDF-Integration vollenden" (abgeschlossen 08/2026 → als Erinnerung/Achievement) und „Wiederaufbau-Finanzierung" ergänzt werden.
2. **ISR — Handel 50 ist faktisch falsch.** Handelssperre seit 02.05.2024 vollständig in Kraft (Akbank-Emissionsdokument 2026). Empfehlung: **10/22/25/70**. Das Anliegen „isr-handel" („Wirtschaft von Politik trennen", Bedingung Handel ≥ 50) ist so **unerreichbar korrekt** als Ziel — aber dann muss die Klausel `ende_sperre` im Vordergrund stehen; aktuell ist sie nur eine von vielen. Erwägen: `ende_sperre` als Pflicht-Vorbedingung für jede ISR-Handelsaktion.
3. **SAU — Sicherheit 50 unterschreitet den Mekka-Pakt.** Empfehlung: **55/66/62/28** und der Pakt (07.08.2026, mit Pakistan) als **bestehender Vertrag im Spielstand** (`abkommen`-Liste zu Beginn), nicht nur als Klausel-Text. Die Klausel `beistand` für SAU sollte dann nicht mehr verfügbar, sondern als erfüllt markiert sein (sonst doppelt).
4. **EGY — Systematisch zu pessimistisch.** Strategische Partnerschaft 04.02.2026 + Verteidigungs-MoU + Handelsziel 15 Mrd. bis 2028 + FSRU-Deal: Empfehlung **60/45/50/35**. Das `w_libyen`-Anliegen (Konflikt-Max) bleibt richtig.
5. **GRC — Konflikt 65 zu hoch für die Dialogphase.** Empfehlung **42/32/35/55**. Achtung: Die Klausel `w_inseln` als `rot` bleibt absolut korrekt (Athen: Selbstverteidigungsrecht — bestätigt durch aktuelle Lektüre).
6. **IRN — Handel/Sicherheit zu optimistisch.** Krieg + Snapback + ausgelaufener Gasvertrag: Empfehlung **42/30/40/55**.
7. **IRQ — Konflikt 55 zu hoch.** Pipeline-Protokoll 07/2026 + Zaidi-Kurs: Empfehlung **62/40/45/42**.
8. **ARM/USA/RUS/CYP/LBY:** Feinjustierung per Matrix (ARM 18/28/36/48; USA 70/60/52/45; RUS 72/38/45/52; CYP 12/15/24/72; LBY 50/58/58/32).

## 5.2 `abkommen.ts` — was stimmt, was fehlt, was veraltet ist

**Bestätigt durch Recherche (Texte korrekt):** `s400` (NDAA §1245-Mechanik, CRS 07/2026), `w_ruestung` (F110-Notifizierung 06/2026), `gas_kauf@RUS` (Auslaufen Ende 2026, ~22 bcm), `gas_kauf@IRN` (ausgelaufen Ende 07/2026), `w_pipeline@IRQ` (Einjahresprotokoll 07/2026 — im Text „August 2026", real 27.07.–01.08.2026; Datum glattziehen), `w_transit@AZE` (TRIPP), `grenzoeffnung@ARM` (Direktflüge seit 03/2026 — Text sagt „seit 2026", korrekt), `w_defizit@CHN` (46,3 Mrd. $ 2025 — exakt), `w_werk@CHN` (BYD abgesagt/pausiert, Privilegien entzogen 06/2026 — Text „wurde abgesagt" passt), `w_swap@CHN` (RMB-Clearing 11/2026 → „November 2025" im Text, korrekt), `beistand@SAU` (Mekka 07.08.2026 — Text stimmt), `w_handelsziel@EGY` (8→15 Mrd. bis 2028 — stimmt), `seesicherheit@UKR` (Minenräumung mit BG/RO — stimmt; „Maritime Component Command 04/2026" plausibel zum Führungswechsel 07/2026), `v_casus`, `w_trnc`, `hafen_oeffnung` (Ankara-Protokoll), `wasser@IRQ`.

**Veraltet/zu schärfen:**
- `w_akkuyu`: Text „rund 2 Mrd. $ stecken fest" — Realität 09/2026: Block 1 im Anfahrbetrieb (seit 06/2026), 9 Mrd. $ Zusatzfinanzierung (12/2025), Inbetriebnahme 2026 geplant. Bis Spielstart 06/2028 ist Block 1 am Netz. Die Klausel sollte von „vollenden" auf „Blöcke 2–4 + Brennstoff-Sicherung + Sinop-Option" umgeschrieben werden.
- `ende_sperre@ISR`: Kehrseite korrekt, aber der Mechanik-Text sollte die 02/2026-Verschärfung (Zertifikate) und die Ceyhan-Grauzone (aserbaidschanisches Öl läuft weiter) enthalten — das ist ein spielbarer Skandal-/Risiko-Punkt.
- `PROFILE.IRN.rot`: leer — Realität legt mindestens eine Rote Linie nahe: keine türkische Basis-/Luftraumnutzung für US-Operationen (für Klauseln Richtung `militaerzugang` an USA gekoppelt). Analog `PROFILE.SYR.rot` könnte `w_stuetzpunkt`-Widerruf... — nein: SYR braucht die Stützpunkte; `rot` leer lassen ist ok, aber `w_rueckkehr`-Gewicht (−5) unterschätzen nicht: Rückkehr ist für Damaskus existenziell und für Ankara innenpolitisch brisant.

**Fehlende Klauseln/Verträge, die die Realität 2026 nahelegt:**
- **EU–Türkei „Two-Track"** (30.06.2026): sektorale Sicherheits-/Energiekooperation ohne Beitritt — als eigenes Paket abbildbar (keine neue Klausel nötig, aber als EU-Anliegen-Update).
- **UK-FTA** (H2/2026) — UK ist im Spiel kein Akteur; wenn je ergänzt: `handel`-Aktion mit Dienstleistungs-Text.
- **Irak-Energie-Rahmenwerk** (Öl, Gas, Petrochemie, Strom; Entwurf seit 08/2025, Verhandlung zum 07/2027-Ablauf des Protokolls): ideale Event-Kette „Verlängerung oder Pipeline-Kollaps".
- **TRIPP-Baufortschritt** als Welt-Event mit Ausstrahlung auf ARM/AZE/IRN/RUS/GEO (Georgien-Umgehung!). Die vorhandene AUSSTRAHLUNG `transit@KAZ → RUS −2` zeigt das Muster; TRIPP braucht dasselbe für IRN (stärker: −5 bis −6) und GEO (−2 bis −3).
- **Iran-Kriegs-Zustand** als Start-Modifier: Hormus geschlossen → Energiepreise, Irak/Saudi/Katar unter Druck, Türkei-Ölmix verschoben (US 21 % im 06/2026). Die `ereignisse-aussen.ts`-Seite sollte das als anhaltenden Zustand modellieren, nicht als einmaliges Ereignis.
- **AUSSTRAHLUNG-Ergänzungen:** `ruestung_koop@SAU` → IRN-Vertrauen bereits vorhanden (−4, ok); ergänzen: `beistand@SAU` → VAE-Frage ist im Akteurskreis nicht abgebildet (VAE kein Akteur — bewusst); `ruestung_koop@EGY` → GRC −3 (Athen sieht Kairo-Achse); `grenzoeffnung@ARM` → vorhanden (−6 AZE) bleibt realitätsnah (Baku-Koppelung bestätigt durch Fidan 11/2025).

## 5.3 Verhandlungstisch-Kalibrierung (Hebel-Werte)

Realitätsnähe der `hebel`-Werte aus `abkommen.ts`, kommentiert: USA −2 (ok — Kongress als Verstärker), EU 0 (ok), RUS 0 (ok, tendenziell +1 durch Gas-Auslaufen: Moskau braucht die Verlängerung mehr als 2022), GRC −1 (ok), IRN 0 (**→ +2: kriegsgebeutelter Iran braucht Ankara dringlicher**), SYR +4 (ok, eher +5), IRQ 0 (**→ +2: Hormuz macht Bagdad zum Bittsteller**), AZE +1 (ok), ARM 0 (**→ −1: nach Wahl stabilisiert, aber grenzabhängig**), SAU −2 (ok), ISR 0 (**→ +1: Sperre kostet Israel wenig, aber Syrien-Frage macht Ankara wichtiger**), CHN 0 (ok), UKR 0 (**→ +1: Sicherheitsgarantie-Rolle stärkt Ankara**), GEO +2 (ok), EGY 0 (**→ +1: IWF-Ende 2026 + Suez**), LBY +2 (ok), KAZ 0 (ok), CYP −1 (ok — EU-Ratspräsidentschaft H1/2026 bewiesen).

---

# Unsicherheits-Register

| # | Punkt | Art der Unsicherheit | Auswirkung bei Irrtum |
|---|---|---|---|
| U1 | Türkei-BIP nominal: Basisdatei 1,64 Bio. $ (IWF-Reihe) vs. ~1,3 Bio. $ (statisticsoftheworld-Tabelle 06/2026) | Methodik/Lira-Kurs-Diskrepanz | Matrix-Wert „Handel" für EU/USA marginal betroffen |
| U2 | EU–Türkei-Warenhandel ~210 Mrd. € (2024) | Nicht neu verifiziert in dieser Runde | Dossier EU, Zahl ggf. ±10 Mrd. |
| U3 | Gesamthandel Türkei–Iran ~6 Mrd. $ | Importseite (Gas) statistisch unscharf | Dossier Iran „Handel" ±2 Punkte |
| U4 | Gesamthandel Türkei–Saudi ~6–7 Mrd. $; Türkei–Katar ~2–3 Mrd. $; TRNZ–Türkei ~2 Mrd. $ | Nur Exportseite belegt (3,8 Mrd. Saudi 2025) | Klein |
| U5 | Irak-BIP 268 vs. 280 Mrd. $; Wachstum −2 % vs. −6,8 % (IWF 04/2026) | IWF-Wert ist jünger/amtlicher; −2 %-Quelle (statisticsoftheworld) schwächer | IWF-Wert verwendet |
| U6 | Katar-BIP 217–240 Mrd. $ und Wachstum −5,7 % (WB) vs. −8,6 % (IWF via Worldometer) | Kriegsschaden-Schätzungen divergieren stark | Dossier Katar Spanne dokumentiert |
| U7 | Libyen-Inflation 12,4 % (03/2026, Ecofin) vs. 2,5 % (WB-Prognose) | Währungspolitik unberechenbar | Spanne dokumentiert |
| U8 | „Maritime Component Command" 04/2026 (Code-Text) vs. belegte Führungsübernahme 07/2026 (Fidan) | Datums-Differenz | Spiel-Text ggf. auf 07/2026 |
| U9 | Pipeline-Protokoll-Datum Irak: 27.07. vs. 01.08.2026 | Quellen uneinheitlich (discoveryalert vs. atlasinstitute) | Trivial |
| U10 | Armenische Verfassungs-Referendum-Termin 2027 | Noch nicht angesetzt | 2028-Projektion Armenien/Aserbaidschan unsicher |
| U11 | Brent 98–115 $ Spanne (Basisdatei) vs. 104,32 $ (straits.live 26.09.2026) vs. 105,48 $ (Angel One 28.09.2026) | Tagesvolatilität | Keine — Spanne stehen lassen |
| U12 | US-Türkei-Gesamthandel 2025 ~32 Mrd. $ | Importseite 2025 nicht primär belegt (OEC 16 Mrd. $ = 2024er Reihe) | Klein |
| U13 | Georgien BTK „Volllastbetrieb seit 02.06.2026" nur aus Code-Text, nicht unabhängig verifiziert | Sekundärquelle fehlt | Dossier Georgien-Detail |
| U14 | Zypern-BIP 35–38 Mrd. $ [unverifiziert] | Nicht recherchiert | Klein |
| U15 | Kasachstan-BIP 270–290 Mrd. $ [unverifiziert] | Nicht primär recherchiert | Klein |
| U16 | Israel-Wahl 27.10.2026: Termin abhängig von Haushaltsannahme 03/2026 (durch) — ob die Wahl wie geplant stattfindet, ist nach dem 30.09. nicht verifiziert | Terminlogik | 2028-Projektion Israel |
| U17 | EU-Ratspräsidentschaft H2/2026 (Nachfolger Zyperns) | Nicht recherchiert | Keine |
| U18 | Saudi-VAE-Bruch (Mukalla 12/2025, OPEC-Austritt VAE 01.05.2026): aus einer einzigen B-Quellenkette (meforum/JINSA + statisticsoftheworld) | Mehrfachbestätigung fehlt | Konflikt-Topologie B2 ggf. abschwächen |

---

# TEIL VI — Ereigniskalender bis Spielstart Juni 2028

Konsolidierte Fristen und Wendepunkte aus allen Dossiers — das ist die Liste, aus der Event-Ketten und Deadline-Mechaniken gebaut werden können. Alle Angaben mit Beleg aus den Dossiers oben.

**2026 Q4 (Oktober–Dezember):**
- 27.10.2026: Parlamentswahl Israel (Netanyahu vs. Eisenkot-Lager) — entscheidet Ton der Türkei-Israel-Front.
- 04.11.2026: US-Midterms — Kongressmehrheiten entscheiden über CAATSA-Waiver und F-35/F110-Paket; Trump hat neue Iran-Schläge „vor den Midterms" nicht ausgeschlossen (Fox, 28.09.2026).
- November/Dezember 2026: Auslaufen des 8-Mrd.-$-IWF-Programms Ägypten — Folgevereinbarung oder Marktrückkehr.
- Bis Ende 2026: Guterres will das informelle 5+1-Zypern-Treffen vor seinem Amtsende (12/2026) — UN-Initiative mit EU-Sonderbeauftragtem Fitto.
- Ende 2026: Auslaufen der großen Türkei-Russland-Gasverträge (~22 bcm/a) — Neuverhandlung als Deadline-Event.
- H2/2026: erwartetes Inkrafttreten der erweiterten UK-Türkei-FTA; Beginn des TRIPP-Baus (armenischer Abschnitt).

**2027:**
- Q1 2027: Übergabe der zweiten Ada-Korvette (Hetman Ivan Vyhovskyi) an die Ukraine (STM-Zeitplan).
- 2027 (Termin offen): Armenisches Verfassungsreferendum — Vorbedingung Bakus für die Signatur des Friedensvertrags; danach türkische Grenzöffnung.
- 2027: IWF-Erwartung Hormus-Normalisierung (Juli-2026-WEO-Basisannahme: Rückkehr „broadly normal by early 2027") — Energiepreis-Pfad dreht.
- 2027: Griechische Parlamentswahl spätestens Mitte 2027; KAAN-Block-10-Produktion läuft (Auslieferung 2028–2030, 20 Stück); Russland: Budget-Review bei Urals < 60 $.
- Bis 27.07.2027: Ende des 12-Monats-Protokolls Kirkuk–Ceyhan — Langfrist-Energievertrag Irak–Türkei oder Pipeline-Kollaps.

**2028 bis Spielstart (Juni):**
- Februar 2028: Präsidentschaftswahl Zypern (Christodoulides' erste Amtszeit) — Zypern-Prozess-Wahlkampf.
- März 2028: 29.03.2025 + 5 Jahre → syrische Verfassungsdeklaration-Transition nähert sich dem Wahlhorizont 2029/30; SDF-Integration muss bis dahin konsolidiert sein.
- Frühjahr 2028: türkischer Präsidentschafts-/Parlamentswahlzyklus (Spielstart-Hintergrund, siehe LAENDERPAKET_TUERKEI.md).
- Laufend: Akkuyu Blöcke 1–2 am Netz, Blöcke 3–4 im Anlauf; Iğdır–Nachitschewan-Pipeline im Betrieb; Great Sea Interconnector — Wiederaufnahme oder endgültige Konservierung als Ägäis-Weichenstellung.

**Struktur-Termine ohne Datum:** Haftar-Sukzession (Alter 82+), Mojtaba-Legitimationskrise, Saudi-VAE-Konfliktverlauf, VAE-OPEC-Neuordnung, russische Ukraine-Offensivzyklen, BYD-Nachfolge-Investitionspaket Türkei.

---

# Quellenverzeichnis (Auswahl, alle abgerufen 30.09.2026)

Nachrichten/Agenturen: Reuters (05.02.2026 EU-Zollunion; 10.07.2026 CAATSA; 14.04.2026 IWF Russland/MENA; 31.08.2026 Getreideplan; 28.07.2026 Guterres-Zypern via US News) · AP/Washington Post (14.06.2026 Armenien-Wahl) · Al Jazeera (08.06.2026 Armenien; 28.09.2026 Irak-Hormus) · Anadolu (19.08.2026; 25.03.2026 Akkuyu) · Türkiye Today, Daily Sabah, Turkish Minute (diverse 2026) · Nordic Monitor (02.09.2026 Energie-Shift; 19.08.2026 Ukraine-Rüstung) · Greek City Times (12.02.2026) · JPost (24.07.2026; 11.05.2026; 28.09.2026) · France24 (29.07.2026) · Ahram Online (04.02.2026; 19.01.2026) · DEİK (02/2026 Ägypten; 04/2026 Syrien).

Institutionen: IWF WEO April 2026 & Juli-Update 2026 · IWF Art.-IV USA (06/2026) & Ägypten (2026) · OECD Economic Outlook 06/2026 & Interim 23.09.2026 · Weltbank GEP 01/2026 & Pink Sheet 09/2026 · EBRD Regional Economic Prospects 06/2026 · ADB ADO 04/2026 · TÜİK Außenhandel 2025 (30.01.2026) · UN Comtrade via TradingEconomics (2026) · SAMA Q1/2026 · Bank of Israel · Zentralbank Zypern · UK GOV.UK FTA-Updates (18.03./08.07.2026) · US Treasury (04.09.2026) · CRS IN12710 (14.07.2026) · House of Commons Library CBP-10636 (04.09.2026).

Think Tanks/Analyse: Carnegie Endowment (17.06.2026 TRIPP) · Crisis Group (09.12.2025 Irak-Türkei; 28.05.2026 Irak-Regierung; 25.03.2026 Georgien) · IISS (15.06.2026) · OSW (02.12.2025 Libyen; 06/2026 Armenien) · JISS (18.05.2026 Iran-Wirtschaft) · CIDOB (07/2025 Ukraine-Türkei) · ET Government/WION/Firstpost (08–09.08.2026 Mekka-Pakt) · CSIS (05.08.2026 LNG) · ME Council (09.09.2026 Katar) · CES Intelligence (18.08.2026 Aserbaidschan/Libyen).

Stand der Einzelbelege jeweils im Fließtext hinter der Zahl. Wo Quellen konfligierten, steht die Spanne; wo keine belastbare Quelle existierte, steht `[unverifiziert]` (15 Markierungen, davon 12 im Unsicherheits-Register konsolidiert).

---

*Ende der Datei. Erstellt 30.09.2026. Verwandte Dateien: RECHERCHE_WELTDATEN.md (Statistik), game/src/sim/laender.ts, game/src/data/abkommen.ts (Kalibrierungsziele).*
