# Kalibrierungs-Zeitreihen Türkei 2018-01 bis 2026-09

Arbeitsgrundlage für die Kalibrierung des Wirtschaftsmodells (`game/src/sim/economy.ts`)
an den drei Lernfällen **2019 (Rezession)**, **2021 (Zinsstreit/Lira-Sturz)** und
**2023 (Erdbeben + Wahl)**. Erstellt am 30.09.2026.

## Dateien

| Datei | Inhalt |
|---|---|
| `zeitreihen_2018_2026.csv` | 105 Monatszeilen, 10 Reihen + est-Flags + Quellen-/Notizspalten |
| `ereignisse_2018_2026.csv` | 57 Ereignis-Marker (zins/gouverneur/wahl/krise/katastrophe/aussen/sozial) |
| `build_zeitreihen.py` | Generatorskript; Werte sind dort mit den est-Mengen hinterlegt |
| `README.md` | diese Datei |

## Format und est-Flag-Regel

Eine Zeile pro Monat (`monat`, YYYY-MM). Jede Datenreihe hat eine Schwester-Spalte
`<reihe>_est`:

- `false` = Wert wurde **in dieser Recherche-Session gegen eine zitierte Quelle verifiziert**
  (oder ist ein amtlicher Beschluss/Wert, z. B. TCMB-Zinsentscheid, Mindestlohn).
- `true` = **Schätzung/Interpolation**: Wert stammt aus belegten Ankerpunkten, die
  dazwischen liegenden Monate sind linear oder nach Muster interpoliert, bzw. aus einer
  publizierten Standardreihe übernommen, aber **nicht zellweise verifiziert**.
- leer = keine Daten (z. B. ENAG vor 2021-10, Arbeitslosigkeit nach 2026-07, BIP ab 2026-Q3).

Faustregel für die Kalibrierung: **`est=false`-Zellen als harte Zielpunkte,
`est=true`-Zellen nur als weiche Führung** (Korridor, nicht Punkt).

## Reihen und Quellen

### `tuefe_yoy` — TÜFE-Jahresinflation (TÜİK), 105/105 Monate, 104 verifiziert
- 2021–2025 komplett monatlich verifiziert über TCMB-Seite „Fiyat Endeksi (Tüketici
  Fiyatları)" sowie unabhängige Drittquellen (etonet-Tabelle 2024–2026, investaz-Tabelle
  2020–2023, T24/Dünya/Forbes für 2025/2026).
- 2018–2020 Monatswerte aus der kanonischen TÜİK-Reihe; Jahresenden gegen die
  Resmî-Gazete-Tabelle verankert (2018: 20,30; 2019: 11,84; 2020: 14,60).
- 2026-09: **Schätzung 30,1** (TCMB-Umfrage-Median; TÜİK veröffentlicht erst am 05.10.2026).
- Achtung: TÜİK hat 2026 die Basis auf 2025=100 umgestellt (COICOP 2018); Ratenniveau
  bleibt vergleichbar.

### `enag_yoy` — ENAG E-TÜFE (Alternativmessung), 60 Monate belegt, 31 verifiziert
- Verifiziert: 2021-10 bis 2023-09 monatlich (Tabelle egitimyayinevi, Quelle TÜİK/ENAG),
  2023-12 (127,21), 2025-05 (71,23), 2025-10 (60,0), 2025-11 (56,82), 2025-12 (56,14),
  2026-01 (53,42), 2026-03 (54,62).
- 2024 komplett und 2025/2026-Lücken: interpoliert (Muster: ENAG/TÜİK-Verhältnis ~1,75–2,0,
  fallend). Diese Zellen nur als Größenordnung nutzen.
- 2018–2020: keine Reihe (ENAG publizierte damals keine durchgängig vergleichbare Serie).

### `leitzins` — TCMB 1W-Repo-Satz (Monatsende gültig), 105/105 verifiziert
- Komplette Beschlussreihe von der offiziellen TCMB-Seite „1 Week Repo" verifiziert
  (14.09.2018: 24,00 → 23.01.2026: 37,00; Halte-Entscheide 2026: 12.03./22.04./11.06./23.07./10.09.).
- 2018-01 bis 2018-05: Damals war die LLW der effektive Finanzierungssatz
  (12,75 → 13,50 am 25.04. → 16,50 am 23.05.); ab 01.06.2018 ist die 1W-Repo der Leitzins.
- 2026-03 bis 2026-08: Leitzins 37 %, aber **Repo-Ausschreibungen ausgesetzt (01.03.–23.08.)**;
  Banken wurden über die 40-%-O/N-Fazilität finanziert → effektive Geldbeschaffungskosten
  ~40 % (siehe `notiz`-Spalte; für die Kalibrierung ggf. als effektiver Zins 40 modellieren).

### `usdtry` — USD/TRY Monatsende, 105 Monate, 6 verifiziert
- Verifizierte Anker: 2025-09 (41,59), 2025-12 (43,03), 2026-01 (43,03), 2026-07 (47,53),
  2026-08 (48,25), 2026-09 (49,03; Rekord 49,08 am 30.09.).
- 2018–2025: Werte der publizierten Standardreihe (ECB-Referenzkurse, Monatsende),
  **nicht zellweise verifiziert** (daher `est=true`), aber durch viele Ereignis-Anker
  gestützt (08/2018 ~6,9; 11/2020 7,8; 12/2021 13,3; 12/2022 18,7; 06/2023 26,0;
  12/2024 35,3). Ersetzbar über die Frankfurter-API (ECB) bei Bedarf 1:1.

### `rendite_10j` — 10J-Benchmark-Rendite TL (%), 105 Monate, 3 verifiziert
- Verifiziert: 2025-09 (~29,3, via TradingEconomics-Jahresdelta), 2026-06 (27,0,
  FT/BusinessStats-Snapshot), 2026-09 (32,84 am 30.09., TradingEconomics OTC-Interbank).
- Alles andere: Monatsband aus Marktberichten und Gedächtnis-Ankern interpoliert —
  **schwächste Reihe des Datensatzes**, für Kalibrierung nur als grober Korridor.
  Nachladeoption: EVDS (TP.BD.* / Benchmark-Serien) oder investing.com-Historie.

### `cds_5y` — 5Y-CDS (Basispunkte, Monatsende), 105 Monate, 13 verifiziert
- Verifizierte Punkte: 2018-01 (152,28 Tief am 05.01.18, worldgovernmentbonds),
  2022-06 (736, Reuters 07.06.22), 2022-07 (908,4 Allzeithoch am 18.07.22, wgb),
  2023-11 (364,64, Daily Sabah 15.11.23), 2025-04 (370 Spitze, turkiyetoday),
  2025-09 (240, Fünfjahrestief 17.09.25), 2025-12 (204–207 Band),
  2026: 01 (205), 02 (217 Tief), 03 (327 Kriegsspitze), 07 (237,8), 08 (217,3), 09 (250).
- 2026 ist die Reihe fast durchgehend belegt; 2018–2024 Monatsverläufe zwischen den
  Ankern interpoliert (`est=true`).

### `reserven_mrd_usd` — TCMB-Bruttoreserven inkl. Gold, 105 Monate, 6 verifiziert
- Verifiziert: 2021-12 (111,1; TCMB-Geschäftsbericht), 2025-09 (~180), 2025-10 (184 am
  31.10.), 2026-02 (208 am 06.02.), 2026-07 (163,3 am 10.07.), 2026-08 (188,2 am 28.08.;
  davon Gold 117,1).
- Übrige Monate: Interpolation zwischen Jahresend-Ankern (TCMB-Geschäftsberichte /
  EVDS TP.AB.TOPLAM als Source-of-Record). Intrajährliche Schwankungen (z. B. Einbruch
  03/2025 nach İmamoğlu-Festnahme, Kriegsverluste 03–06/2026) sind eingearbeitet, aber
  nur als Muster, nicht als Messwert.
- Hinweis: 2026 zeigt die Reihe Kriegsverluste (208 → 163) und Wiederaufbau nach
  Waffenruhe + Repo-Normalisierung (→ 188). Netto-Reserven ex Swaps: 02/2026 78 Mrd.,
  08/2026 56 Mrd. (nur als Kontext, nicht in der CSV).

### `bip_yoy_quartal` — BIP-Wachstum YoY (Quartalswert auf die 3 Quartalsmonate), 102 Monate, 30 verifiziert
- 2024–2026 verifiziert: 2024: 5,3/2,2/2,0/2,7; 2025: 2,6/4,0/4,4/3,5 (Jahr 3,6 %,
  US State Dept.); 2026: Q1 2,6 (rev.), Q2 2,3. Q3 2026 erscheint erst ~30.11.2026.
- 2018–2023: TÜİK-Reihe (Revisionsstand ~2024) aus Sekundärquellen; Jahresanker
  (2018: 3,0; 2019: 0,8–0,9; 2020: 1,8–1,9; 2021: 11,4; 2022: 5,5; 2023: 5,1) verifiziert,
  Quartalswerte `est=true` (Revisionsrisiko).

### `arbeitslosigkeit` — Quote %, saisonbereinigt (TÜİK HİA), 103 Monate, 21 verifiziert
- Verifiziert: 2021-06 (10,6), 2023-01 (9,7), 2023-02 (10,0), 2023-07 (9,4),
  2023-11 (9,0), 2024-04 (8,5), 2025-01..08 komplett (8,5/8,2/8,0/8,6/8,4/8,5/8,1/8,5),
  2026-01..07 komplett (8,1/8,4/8,1/8,2/8,1/7,6/8,1).
- Jahresdurchschnitte als Anker verifiziert: 2018: 10,9; 2019: 13,7; 2020: 13,1;
  2021: 12,0; 2022: 10,4; 2023: 9,4.
- Übrige Monatswerte: interpoliert bzw. aus der HİA-Reihe übernommen ohne Einzelprüfung.
- 2026-08/09 leer (Veröffentlichungslag ~6 Wochen).

### `mindestlohn_netto` — Netto-Mindestlohn TL/Monat, 105/105 verifiziert
- 2018: 1.603,12 | 2019: 2.020,90 | 2020: 2.324,70 | 2021: 2.825,90 |
  2022: 4.253,40 (ab 07: 5.500,35) | 2023: 8.506,80 (ab 07: 11.402,32) |
  2024: 17.002,12 | 2025: 22.104,67 | 2026: 28.075,50 (ÇSGB, +27 %; brutto 33.030).
- Jahressprünge jeweils zum Januar (Zwischenerhöhungen Juli 2022/2023 berücksichtigt).

## Lernfälle: Ausschnitte und qualitative Zielverläufe

### Lernfall 2019 — Rezession und späte Straffung
- **Ausschnitt:** 2018-03 bis 2019-12 (Input-Fenster ab 2018-01 für Lags).
- **Verlauf, den das Modell treffen sollte:**
  - TÜFE: Spike 10→25 % (08–10/2018) nach Lira-Crash, dann Basiseffekt-Rückgang auf ~12 %.
  - Zins: LLW 12,75 → Notfall 16,5 → 24 % (09/2018), Hold bis 07/2019, dann 5 Schnitte auf 12 %.
  - USD/TRY: 4,1 → 6,9 (08/2018) → 5,3–6,0 Seitwärts 2019.
  - BIP: Q3/2018 +0,9 → Q4 −3,0 → Q1/Q2-2019 negativ (−2,3/−1,6), Erholung ab Q3.
  - Arbeitslosigkeit: 10 → 14,7 (Frühjahr 2019) mit ~2-Quartal-Lag zum BIP.
  - CDS: 150 → 570 → 300–400.
- **Prüfsteine fürs Modell:** Zins-Lag (rateLagMonths) an der 2019er-Rezession;
  fxPassThrough an der 2018er Inflationsspitze (Peak 25 % bei ~70 % 12M-Abwertung).

### Lernfall 2021 — Zinsstreit und Lira-Sturz
- **Ausschnitt:** 2021-03 bis 2022-03 (Input ab 2020-09).
- **Verlauf:**
  - Zins: 19 % Hold → Schnitte 09→12/2021 auf 14 % **bei steigender Inflation**.
  - USD/TRY: 8,3 → 13,4 (11/2021), Intraday 18,4 (20.12.), KKM-Rettung → ~13.
  - TÜFE: 16 → 36 % (12/2021) → 48,7 % (01/2022); ENAG: 50 → 83 → 115.
  - CDS: 350 → 550; Reserven: Netto-Reserven ex Swaps tief negativ (07/2022: −52 Mrd.).
  - Realwirtschaft bleibt stark (2021: +11,4 % BIP, ALQ fallend auf 11) — **Preis-/FX-
    Kanal entkoppelt von der Realwirtschaft**: wichtigster Test für Z4/Z5 (Wechselkurs-
    und Pass-through-Gleichungen) und für die Glaubwürdigkeitsvariable `credibility`.
- **Prüfsteine:** Erwartungs-Dynamik (Z3): Erwartungen liefen der offiziellen Inflation
  hinterher, ENAG-TÜİK-Spread als Proxy für Erwartungsfehler; carryOnFx-Vorzeichenwechsel
  bei negativem Realzins.

### Lernfall 2023 — Erdbeben, Wahl und Kurswechsel
- **Ausschnitt:** 2022-11 bis 2023-12.
- **Verlauf:**
  - Beben 02/2023: Fiskalimpuls ~100–120 Mrd. USD Wiederaufbau (fiscalImpulse), Zins bleibt
    vorerst 8,5 % (wahlbedingt), dann nach der Wahl orthodoxe Wende.
  - Zins: 8,5 → 15 (06) → 17,5 → 25 (08) → 30 → 35 → 40 → 42,5 (12).
  - USD/TRY: 18,8 → 20,5 (05) → **Sprung auf 26** (06, Aufgabe der Kursverteidigung) → 29,5.
  - TÜFE: Talsohle 38,2 (06) → Wiederanstieg 64,8 (12) — Mindestlohn +100 % (01) und +34 % (07)
    als costPush-Impulse; BIP robust (5,1 %), ALQ fallend 10 → 8,8.
  - CDS: 700 (05) → 340 (12); Reserven: 102 → 141 Mrd. (Wiederaufbau ab 06).
- **Prüfsteine:** Regime-Bruch (Modell muss mit Gouverneurswechsel/Ereignis-Marker
  `credibility`-Sprung vertragen); FX-Sprung um ~25 % in einem Monat als diskretes
  Ereignis statt Diffusion; Beben als kombinierter Angebots-/Fiskalschock.

## Bekannte Lücken (Details in `RECHERCHE_ZEITREIHEN.md`)

1. `rendite_10j`: nur 3 verifizierte Punkte — zuerst nachladen (EVDS).
2. `usdtry` 2018–2025: Standardreihe, nicht zellweise verifiziert — Frankfurter-API.
3. `reserven` monatlich: EVDS TP.AB.TOPLAM (wöchentlich) nachladen.
4. `enag` 2024: keine einzige verifizierte Monatszelle gefunden — ENAG-Archiv/X nachladen.
5. `tuefe` 2026-09: erscheint 05.10.2026, dann Schätzung ersetzen.
