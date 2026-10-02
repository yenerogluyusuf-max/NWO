# SYNTHESE REALWELT + SPIELFLUSS — 30.09.2026

Fünf Parallelrecherchen mit Tagesdaten (jede Zahl mit Quelle/Datum, Unsicherheits-Register in jeder Datei):

| Datei | Inhalt | Umfang |
|---|---|---|
| `RECHERCHE_REALWELT_UKRAINE_RUSSLAND.md` | Kriegsstand, Diplomatie, RU/UA-Zustand, Türkei-Bezug, 3 Szenarien 2028 | 612 Zeilen |
| `RECHERCHE_REALWELT_NAHOST.md` | Iran-Krieg, Hormuz, Syrien nach Assad, Migration, Energie-Vertragsuhren | 761 Zeilen |
| `RECHERCHE_REALWELT_TUERKEI_2026.md` | Wirtschaft/Politik/Gesellschaft/Militär heute + Projektion Juni 2028 | 676 Zeilen |
| `RECHERCHE_REALWELT_LAENDERDOSSIERS.md` | 18 Akteure + 4 Bonus, Beziehungsmatrix 18×4, Konflikt-Topologie | 489 Zeilen |
| `RECHERCHE_SPIELFLUSS_UX.md` | Pacing, Informations-Architektur, Belohnungsrhythmus, Onboarding | 506 Zeilen |

---

## 1. Der Weltzustand, auf dem das Spiel aufbaut (Stand Sept. 2026)

Die Realität ist dramatischer als der bisherige Spielstand annimmt:

1. **US/israelischer Krieg gegen Iran seit 28.02.2026** — Khamenei sen. getötet, IRGC führt faktisch; **Straße von Hormuz seit März 2026 faktisch geschlossen** (Brent ~105 USD). Das ist der dominante globale Treiber des Spielzeitraums: Energiepreise, Inflation, Zinspausen, Bündnis-Verschiebungen.
2. **Ukraine-Krieg festgefahren, aber heiß**: ~90–100 km² Netto-Gewinn für Russland 2026, Drohnenkrieg gegen Raffinerien (25–35 % Kapazität zeitweise aus), Diplomatie (28-Punkte/20-Punkte-Pläne, Genf/Abu Dhabi) ohne Durchbruch; Kernfragen Rest-Donezk und AKW Saporischschja.
3. **Türkei im Zentrum von allem**: Montreux-Meerengen-Schließung wirkt; Gas-Vertragsuhren ticken (Russland-Kontrakte laufen 31.12.2026 aus, Iran-Gas lief 29.07.2026 ungelöst aus, Kirkuk-Ceyhan 01.08.2027); türkische Vermittlungsangebote aktiv, aber unangenommen.
4. **Innenpolitische Neuerung**: CHP-Parteitag annulliert (05/2026), Spaltung → **YENİ Parti** (07/2026) führt Umfragen mit 30–39 %, AKP 22–31 %, CHP kollabiert 3–5 %. PKK-Rahmengesetz mit 468/600 (08/2026); Kurdenfrage = Königsfrage von 2028. Frühwahl-Klausel, genannter Termin 16.04.2028 — kompatibel mit Spielstart 05.06.2028.
5. **Syrische Wende abgeschlossen**: SDF aufgelöst (08/2026), Sanktionsfreiheit vollständig; >700.000 Rückkehrer aus der Türkei. Mekka-Beistandspakt (SAU+TR+PAK, 08/2026) existiert — **fehlt im Code als Vertrag**.

## 2. Handlungsbedarf am Bestand (konkret)

**Falsch statt nur veraltet (Priorität 1):**
- `SYR`-Startwerte (35/20/25/75) beschreiben die Assad-Ära → Realität: Klientelpartnerschaft, empfohlen ~45/55/68/20.
- `ISR`-Handel 50 → Handels-/Hafen-/Luftraumsperre seit 05/2024 vollständig → ~10/22/25/70; `ende_sperre` als Vorbedingung jeder Israel-Handelsaktion.
- Mekka-Pakt bei SAU: Sicherheit 50 → ~66; darf nicht doppelt als verfügbare Beistands-Klausel existieren.
- `inflationTarget: 24` überholt → OVP-Pfad 28,4 → 21 → 13,5 % (2026–2028), Patch-Vorschlag liegt in der Türkei-Datei.

**Neue Weltuhren (Ereignis-Anker, Priorität 1)** — drei Vertragsausläufer mitten im Spielzeitraum: Gas RU (31.12.2026 → im Spiel: Verlängerung als Verhandlungspflicht vor Start bzw. Erbe), Iran-Gas (offen), Kirkuk-Ceyhan (01.08.2027 → im Spieljahr 2029 relevant, als bevorstehendes Ereignis einbauen), Israel-Wahl 27.10.2026, armenisches Verfassungsreferendum (~2027 → Kaukasus-Paketdeal-Bühne), Zypern-Fenster (5+1 bis 12/2026).

**Projektions-Basisband Juni 2028** (Türkei): Inflation 14–20 %, Leitzins 22–30 %, USD/TRY 58–68, CDS 180–280 bp, Wachstum ~4 %, Defizit 3,0–3,5 %; drei offene Krisen zum Start: Energie/Kriegsnachwehen, Kurdenprozess ohne Abschluss, EGMR-Dauerstreit.

## 3. Szenario-Architektur (Empfehlung)

Aus den drei Szenario-Sets der Regionalrecherchen eine gemeinsame Architektur:

- **S-Basis „Langer Krieg, teurer Frieden"** (~45–55 %): Ukraine-Abnutzung weiter, Hormuz halb offen, Brent 85–95, fragile Normalisierung Nahost. = Standardwelt.
- **S-Wandel „Einfrierungen"** (~30–40 %): Ukraine-Waffenruhe mit Garantie-Frage (türkische Vermittlungsbühne!), Iran-Erschöpfungsfrieden, Energiepreise fallen → Inflationspfad schneller, aber Sicherheitsarchitektur-Druck (NATO-Erwartungen).
- **S-Schock „Doppeltes Feuer"** (~10–20 %): Ukraine-Eskalation + Iran-Wiederaufflammen, Hormuz ganz zu, Brent > 130, Migrationsumkehr über Libyen/Kreta.

Jedes Szenario definiert: Startwerte-Deltas, Ereignis-Pools, Frühindikatoren (Zeitung/Briefing kann sie andeuten) — Szenario-JSON-Rohlinge liegen in den Regionaldateien. Designentscheidung nötig: Szenario wählbar beim Start („Weltlage: gespannt/unsicher/eskaliert") oder verborgen gezogen.

## 4. Spielfluss — die fünf Leitbefunde

1. **Der Abbruchpunkt ist der Einstieg, nicht die Länge** (Suzerain-Trichter: Prolog 91 % → Kapitel I 53 % → Ende 37 %): Der erste Spieltag muss tragen — „Irland-Prinzip": eine kleine, sofort lösbare erste Krise.
2. **„One more turn" ist Architektur**: überlappende Countdowns + sichtbarer Fortschritt (Meier: „You cannot reward and reflect progress too much").
3. **Auto-Stopp-Taxonomie** (A Entscheidung / B Wendepunkt / C Umlauf), Regel: **keine Pause ohne Entscheidung** — gegen die Vic3-Popup-Flut und das Suzerain-2.0-Debakel.
4. **Nested Tooltips (CK3-Standard)**: unsere 412 Warum-Sätze + Treiber-Zerlegung sind das fertige Datenfundament — nur noch UI. Plus „Stand der Dinge"-Blatt beim Laden (Genre-Lücke, billige Alleinstellung).
5. **Anti-Clippy-Kodex für die Mentorin**: nur bei Relevanz-Triggern, abschaltbar, Rat statt Befehl.

Konkreter Tagesrhythmus-Vorschlag (Kapitel „Der flüssige Tag" in der UX-Datei): Morgen-Briefing (3–5 Punkte) → Entscheidungsblock → Karte/Netz → Abend-Chronik; Anti-Leere-Regeln R1/R2 (max. 7 Tage ohne Neuigkeit, max. 21 Tage ohne Entscheidungsangebot — kalibrierungspflichtig).

## 5. Nächste sinnvolle Schritte

1. Daten-Patch `szenario_tuerkei_2026-09-25.json` + `laender.ts`/`abkommen.ts` aus den Realwelt-Dateien (S–M, sofort möglich).
2. Szenario-Architektur entscheiden (wählbar vs. verborgen) und die drei JSON-Rohlinge als Startvarianten bauen.
3. Ereignisvorlagen aus den Übertrag-Abschnitten übernehmen (insgesamt ~37 neue Vorlagen-Skizzen vorhanden).
4. Auto-Stopp-Taxonomie + „Stand der Dinge" beim Laden (beide S–M, großer Fluss-Gewinn).
