# SYNTHESE — Große Recherche-Runde 30.09.2026 (9 Aufgaben)

| # | Datei | Inhalt | Umfang |
|---|---|---|---|
| 1 | `RECHERCHE_ZEITREIHEN.md` + `kalibrierung/` (CSV, README, Skript) | Monatsdatensatz 2018–2026 (10 Reihen, 105 Monate, 57 Ereignisse) | Abdeckung: TÜFE/Leitzins/Mindestlohn voll echt; CDS/ENAG teils |
| 2 | `RECHERCHE_SUZERAIN_KRIEGSMATRIX.md` | Rumburg-Krieg komplett rekonstruiert (~26 Quellen, Vertrauensstufen) | 395 Zeilen |
| 3 | `RECHERCHE_REFERENZSPIELE_2.md` | CK3, Frostpunk, Papers Please, Football Manager | 300 Zeilen |
| 4 | `RECHERCHE_KI_BENCHMARK.md` + `game/scripts/` (jev-test.mjs, ki-benchmark.mjs, Testfälle) | Jev-Batterie (40 Fälle) + 21-Aufgaben-Benchmark, Ollama-Testlauf | ausführbar |
| 5 | `RECHERCHE_PROVINZDATEN.md` + `kalibrierung/provinz_profile.csv` | 81 Provinzen × 28 Spalten, 8 Archätypen, Delta-Matrix für Politiknetz | 3 Kerngrößen 81/81 echt |
| 6 | `RECHERCHE_MEDIEN_UMFRAGEN.md` | Medien-Eigentum (71 % bei 4 Holdings), RSF-Korrektur 159/180, Umfrage-Fehlermodell | 601 Zeilen |
| 7 | `RECHERCHE_ENERGIE.md` | Strom/Gas/Öl/EE/Atom, Hormuz-Kosten 14 Mrd. USD, Modell E1–E7 | 371 Zeilen |
| 8 | `RECHERCHE_DIASPORA.md` | Wahlverhalten, Döviz-Pfad, DITIB/UID-Konflikte, Spiel-Modell | 386 Zeilen |
| 9 | `RECHERCHE_DIDAKTIK_SPIELERSCHAFT.md` | Lernforschung (Mentorin-Pflicht), türkischer Markt/Lokalisierung | 489 Zeilen |

---

## 1. Querschnitts-Befunde (was mehrere Recherchen unabhängig bestätigen)

1. **Der Bestand ist solide, drei Zahlen müssen korrigiert werden**: RSF **159/180 statt 163**; `inflationTarget` und `deficit` im Szenario-JSON weichen vom OVP ab (Patch-Vorschläge liegen in RECHERCHE_ZEITREIHEN und RECHERCHE_REALWELT_TUERKEI_2026).
2. **2026 ist ein Kriegsregime, kein Normaljahr** — Energie (Hormuz, +14 Mrd. USD), Zeitreihen (CDS 205→327→250, effektive Finanzierung 40 % statt 37 %) und Türkei-Lage sagen das unisono. Die Kalibrierung muss 2026 als eigenes Ereignis-Regime behandeln, nicht als Rauschen.
3. **„Vorbereitung schlägt Kriegsraum"** (Suzerain-Matrix: ~25 Vorbereitungs-Flags, nur 4 Kriegsentscheidungen) deckt sich mit der Vic3-Blaupause aus der Kriegs-Vertiefung — MIL-1 bekommt damit zwei unabhängige Bestätigungen derselben Architektur: Eskalationsphase = Hauptspielfläche, Doktrin-Passung UND-verknüpft, Frieden mit gestaffelter Innenpreis-Liste (freie Presse verteuert Frieden!).
4. **Aufmerksamkeit + Selbstkosten sind die fehlenden Währungen** — Papers Please (Regel = Steuer auf Aufmerksamkeit), CK3 (Stress/Belastung), Macht-Recherche (verfallende Aufmerksamkeit) und UX-Recherche (keine Pause ohne Entscheidung) konvergieren auf denselben Punkt: ein **Belastungs-/Aufmerksamkeits-Konto** für den Präsidenten löst „alles gleichzeitig" eleganter als harte Limits.
5. **Unsicherheit zeigen statt verdecken oder erfinden** — FM-Intervalle („12–16 bei 38 % Wissen") bestätigen exakt unsere Mentorin-Regel „Richtung und Bandbreite, nie genaue Zahlen"; jetzt mit UI-Muster.

## 2. Direkt umsetzbare Artefakte (keine Recherche mehr nötig)

- `kalibrierung/zeitreihen_2018_2026.csv` + `ereignisse_2018_2026.csv` → Grundlage für WIR-1 (drei Lernfälle als Tests).
- `kalibrierung/provinz_profile.csv` (81×28) + Delta-Matrix → Archätyp-Schicht ins Politiknetz, ohne 81 Einzelkalibrierungen.
- `game/scripts/jev-test.mjs` + `ki-benchmark.mjs` (+ echter Katalog `katalog.json`, `runner.ts` bündelt den Spielkern in Node) → laufen mit einem Befehl, sobald Keys gesetzt sind. Ollama-Ergebnis bereits vorhanden: kleine lokale Modelle liefern 0 % valides JSON → lokaler Weg bleibt der Regel-Parser; Kosten-Ziel <0,30 USD erreichbar mit Flash-Modell + Caching.
- Medien-Cluster-Tabelle + Instituts-Bias-Tabelle (RSF 159, 4 Holdings/71 %, RTÜK-Preisliste) → REC-4 und Umfrage-Fehlermodell direkt baubar.
- Energie-Modell E1–E7 mit Startwerten und Ereignis-Hooks → Modul-Spezifikation fertig.
- Diaspora-Modul: Wählergruppe mit Länder-Modifiern (Stichwahl 2023: Ausland 59,7 % vs. Inland 52,2 %), Döviz-Pfad, YTB/DITIB-Ereigniskarten.

## 3. Änderungen am Verbesserungsplan (durch diese Runde)

1. **NEU (P0): Belastungs-/Aufmerksamkeits-Konto** (CK3-Stress + Papers-Please-Steuer + Macht-Recherche) — ersetzt/ergänzt „Aufmerksamkeit als Währung" aus der Vertiefung; mit Zusammenbruch-Ereignis und Coping-Hypothek.
2. **NEU (P1): Rubikon-Liste** irreversibler Maßnahmen (Frostpunk „crossed the line") + **neutraler Endabrechnung** ohne Wertung im Geschichtsbuch (China-Review-Bombing als Warnung: nicht „was it worth it?" fragen, sondern den Kontoauszug zeigen).
3. **NEU (P1): Posteingang des Präsidenten** (FM-Inbox als universelle Schnittstelle) — Alternative/Ergänzung zum Tagesbriefing.
4. **MIL-1 präzisiert**: Eskalationsphase mit ~Vorbereitungs-Flags wird Hauptspielfläche; Kriegsraum klein; Friedens-Innenpreis-Liste mit Medienkontroll-Kopplung.
5. **WIR-1 entsperrt**: Zeitreihen + Lernfall-Anleitung liegen vor (inkl. „2026 als Kriegsregime"-Regel).
6. **REC-4 entsperrt**: Medien-Modell mit Eigentümer-Empfindlichkeit statt Ideologie, RTÜK/BİK-Preisen, digitalem Cluster mit Plattform-Verwundbarkeit.
7. **Lernkonzept bestätigt + verschärft**: Mentorin-Nachbesprechung ist der wirksame Baustein (productive failure); Fading über 3 Stufen ändern nicht nur Frequenz, sondern Art der Hilfe; Score-System muss Wertung explizit rahmen (€CONOMIA-Warnung).
8. **Lokalisierung (P1, nicht P2)**: Türkisch (muttersprachlich redigiert) ist Erwartung, nicht Option; Regional Pricing ~25–30 % des US-Preises; Fiktionalisierungs-Regeln (keine Atatürk-/Erdoğan-Referenzen, keine „Kurdistan"-Karte) als harte Content-Policy.

## 4. Was weiterhin offen ist

- Jev/Cloud-Benchmarks brauchen API-Keys (Skripte fertig, `TYPESAFE_API_KEY` bzw. Anbieter-Keys setzen → ein Befehl).
- Suzerain-Matrix: 12 Punkte nur per Playthrough/Datamine (Liste in der Datei).
- Zeitreihen-Nachladungen: 10J-Rendite (EVDS), USD/TRY 2018–2025 zellweise, ENAG 2024, TÜFE 09/2026 am 05.10.2026.
- Türkische Steam-Review-Stichprobe per API (kein Zugang in dieser Runde).
- Weltlage-Monitoring weiterhin alle 4–6 Wochen.
