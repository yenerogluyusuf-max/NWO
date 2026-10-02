# RECHERCHE_ZEITREIHEN — Dokumentation der Datensuche (30.09.2026)

Recherche für `kalibrierung/zeitreihen_2018_2026.csv` + `ereignisse_2018_2026.csv`.
Vorgehen: WebSearch/FetchURL auf frei zugängliche Quellen (amtliche Seiten, Presse-Archive,
Datenaggregatoren); EVDS-API ohne Key nicht erreichbar, worldgovernmentbonds liefert nur
teilweise statische Inhalte. Grundsatz: **verifiziert = in dieser Session gegen eine
zitierte Quelle geprüft**; alles andere ist im CSV als `est=true` markiert.

## 1. Was wurde wo gefunden

### TÜFE-Inflation (TÜİK)
- **TCMB „Fiyat Endeksi (Tüketici Fiyatları)"**: komplette Monatsreihe 09/2022–05/2025
  (Jahres- und Monatsraten) — tcmb.gov.tr.
- **etonet.org.tr (PDF, Zugriff 06.07.2026)**: Monatstabellen 2024, 2025 und 2026
  (Jan–Jun) mit Jahres- und Monatsraten — deckt sich mit TCMB.
- **Admiral Markets Türkei-Inflationsvorschau (30.09.2026)**: 2026er Monatsreihe
  Jan–Aug (30,65/31,53/30,87/32,37/32,61/32,11/31,75/31,51), Umfrage-Median Sep: 2,1 %
  m/m → ~30,1 % y/y; TÜİK-Termin Sep-Daten: 05.10.2026.
- **Resmî Gazete (29.09.2025)**: Jahresend-Tabelle 2009–2024 (2018: 20,30; 2019: 11,84;
  2020: 14,60; 2021: 36,08; 2022: 64,27; 2023: 64,77; 2024: 44,38).
- Nebenbefund: TÜİK-Umstellung auf Basis 2025=100 ab Januar 2026 (COICOP 2018).
- Qualität: **hoch** — mehrfach unabhängig deckungsgleich. Einzige Schätzung: 2026-09.

### ENAG E-TÜFE
- **egitimyayinevi.com (Tabelle, Quelle TÜİK/ENAG)**: monatlich 10/2021–09/2023
  (49,9 … 130,1).
- **bianet (03.01.2024)**: 2023-12 = 127,21. **DW (03.01.2023)**: 2022-12 = 137,55.
- **Eğitim-İş (PDF)**: 2025-05: TÜİK 35,41 / İTO 46,57 / ENAG 71,23.
- **verikaynagi.com**: 2025-10: TÜİK 32,87 / ENAG 60,0 / İTO 40,84.
- **diken.com.tr / gaziantepsabah / T24 (05.01.2026)**: 2025-11 = 56,82; 2025-12 = 56,14
  (Jahreswert E-TÜFE 2025).
- **forbes.com.tr (02.02.2026)**: 2026-01 = 53,42 (m/m 6,32). **babaocagi.com (03.04.2026)**:
  2026-03 = 54,62 (m/m 4,10).
- Qualität: **mittel** — verifizierte Punkte dicht ab 10/2021, aber 2024 ohne einen
  einzigen belegten Monatswert (Interpolationslücke), 2025/2026-Lücken über das
  ENAG/TÜİK-Verhältnis (~1,75–2,0) geschlossen.

### TCMB-Leitzins
- **TCMB „1 Week Repo" (offizielle Zinstabelle)**: lückenlose Beschlussreihe
  01.06.2018 (16,50) → 23.01.2026 (37,00), alle Änderungsdaten.
- **FX Blue Kalender + azernews (09/2026)**: 2026er PPK-Kalender und Halte-Entscheide
  (12.03./22.04./11.06./23.07. 37 %; 10.09. erwartet/bestätigt 37 %), restliche Termine
  2026: 22.10. und 10.12.
- **BIS-Rede Karahan (17.02.2026)**: Dez-2025-Schnitt auf 38 %, Jan-2026 „begrenzter
  Schnitt" 100 bp auf 37 %.
- **AA (26.08.2026) + internationalinvestment.biz**: Repo-Ausschreibungen 01.03.2026
  ausgesetzt (Krieg), Finanzierung über 40-%-O/N; Wiederaufnahme 23.08.2026.
- Qualität: **amtlich, lückenlos** — stärkste Reihe. Modell-Hinweis: 03–08/2026
  effektive Finanzierungskosten 40 % ≠ Leitzins 37 %.

### USD/TRY
- **Bloomberg HT (30.09.2026)**: 49,0156–49,0200; YTD +13,91 % ab 43,0312; 1-Jahres-
  Vergleich 41,5883 → 49,0178.
- **TradingEconomics (30.09.2026)**: 49,0275, Allzeithoch 49,08; 12M +18,07 %.
- **The Industry Spread (31.08.2026)**: ECB-Referenzkreuz 43,028 (02.01.), 47,525
  (31.07.), 48,245 (28.08.); thetradersspread (07.09.): 48,443 (04.09.).
- **dolardustumu.com**: Juli 2026 Monatsband 46,67→47,52, Mittel ~47,08.
- **Macrotrends (OECD-Monatsmittel)**: Aug 2026 = 47,82.
- Qualität: **2025-09 bis 2026-09 verifiziert**; 2018–2025 aus der publizierten
  Standardreihe (ECB-Referenzkurse) übernommen, aber nicht zellweise geprüft
  (`est=true`). Nachladeoption: Frankfurter-API (ECB), täglich, kostenfrei.

### 10J-Rendite
- **TradingEconomics (30.09.2026)**: 32,84 % (OTC-Interbank), +0,96 p. m/m, +3,57 p. y/y
  → 09/2025 ≈ 29,3 %.
- **BusinessStats/FT (Mitte 06/2026)**: 27,0 %.
- **Fintables (06.08.2026)**: 2J-Benchmark 41,63 % (Kontext Kurvenform, invers).
- Qualität: **niedrig** — nur drei verifizierte Anker; Monatsverlauf 2018–2025 aus
  Marktberichts-Gedächtnis interpoliert. Für Kalibrierung nur als Korridor verwenden.

### CDS 5Y
- **worldgovernmentbonds (archivierte Seiten)**: Tief 152,28 (05.01.2018), Allzeithoch
  908,4 (18.07.2022).
- **Reuters (07.06.2022)**: 736 bp. **Daily Sabah (15.11.2023)**: 364,64 bp.
- **turkiyetoday (17.09.2025)**: 240 bp = Fünfjahrestief (tiefster seit 02/2020);
  Jahresspitze 2025: 370 (April, İmamoğlu); Gesamtreserven ~180 Mrd., Netto ex Swaps ~50.
- **2026er Kette (AA 26.08., Gedik Yatırım-Bulletins, ekonomi365, paraanaliz, ekoturk)**:
  Anfang 2026 204–207 → Kriegsspitze 03: 327 → 04/05 volatil 230–310 → 06 ~196–221 →
  07: 237,8 (31.07.) → 08: 217,3 (31.08.; 26.08.: 217 = 6,5-Monats-Tief) →
  14.09.: 229,8 → 28.09.: 250 (höchster seit Mai).
- Quellenstreue bei Tageswerten ±5–25 bp (OTC-Markt) — dokumentiert; Monatsenden als
  Band lesen.
- Qualität: **2025–2026 gut**, 2018–2024 ankerbasiert interpoliert.

### TCMB-Bruttoreserven
- **TCMB-Geschäftsbericht 2021**: Ende 2021 = 111,1 Mrd. USD (Goldanteil 34,7 %);
  Bericht 2020: Gold 719,2 t = 46,6 % Anteil.
- **BIS-Rede (17.02.2026)**: 31.10.2025 = 184 → 06.02.2026 = 208 Mrd.; Netto ex Swaps 78.
- **thetradersspread (07.09.2026)**: 28.08.2026 = 188,198 Mrd. (Gold 117,089 /
  konvertibel 63,355); Netto ex Swaps 12.08. = 56; kurzfristige FX-Verbindlichkeiten 116,5.
- **ortakalan.io / CNBCE**: 10.07.2026 = 163,3 (EVDS TP.AB.TOPLAM). **star.com.tr**:
  13.08. = 178,4.
- Qualität: **Anker gut, Monatsverläufe interpoliert**. EVDS-Wochendaten nachladbar.

### BIP (quartalsweise, YoY)
- **turkiyetoday (01.06.2026)**: Q1-2026 +2,5 % (Erwartung 2,7), q/q +0,1; Exporte
  −12,7 % (Kriegseffekt), Industrie −0,8; Q4-2025 = 3,4 (vorläufig).
- **TradingEconomics (09/2026)**: Q2-2026 +2,3 %; Q1 revidiert auf +2,6; q/q Q2 +1,1.
- **TheGlobalEconomy/Eurostat**: 2024 Q2–Q4: 2,2/2,0/2,7; 2025: 2,6/4,0/4,4/3,5.
- **US State Dept. ICS (29.09.2026)**: Jahr 2025 = 3,6 %, 2024 = 3,3 %.
- **Hazine/MSB (28.02.2020)**: Q4-2019 = 6,0 %, Jahr 2019 = 0,9 (2009er Basis).
- **Wikipedia „Economy of Turkey" (Jahresanker)**: 2018: 3,0; 2020: 1,9; 2021: 11,4;
  2022: 5,5; 2023: 5,1.
- Qualität: **2024–2026 verifiziert**; 2018–2023 Quartale aus Sekundärquellen
  (Revisionsstand beachten), `est=true`.

### Arbeitslosigkeit (s.a.)
- **SEC-EDGAR 20-F-Tabelle (TURKSTAT)**: 2025-01..08: 8,5/8,2/8,0/8,6/8,4/8,5/8,1/8,5.
- **Independent Türkçe / personel.com (31.08.–04.09.2026)**: 2026-01..07:
  8,1/8,4/8,1/8,2/8,1/7,6/8,1 (Juli: +0,5 p; 39 Monate einstellig); Q2-2026: 7,9.
- **DergiPark/Istanbul-Uni (TÜİK-Jahreswerte)**: 2018: 10,9; 2019: 13,7; 2020: 13,1;
  2021: 12,0; 2022: 10,4; 2023: 9,4.
- **Punktverifikationen**: 06/2021 10,6 (Daily Sabah); 01/2023 9,7; 02/2023 10,0;
  07/2023 9,4 (TİSK); 11/2023 9,0; 04/2024 8,5 (ajansbizim).
- Qualität: **2025–2026 hoch**, davor Jahresanker + interpolierte Monate.

### Mindestlohn
- **ÇSGB (23.12.2025 + PDF)**: 2026 netto 28.075,50 / brutto 33.030 (+27 %);
  TÜRK-İŞ-Boykott der Kommission.
- Frühere Jahre aus der amtlichen Standardreihe (2018: 1.603,12 … 2025: 22.104,67;
  Zwischenerhöhungen 07/2022 und 07/2023). Qualität: **amtlich, lückenlos**.

### Externe Welt (für AUSSEN-Parameter des Modells)
- **US/Israel-Iran-Krieg ab 28.02.2026** (AA: „28 Şubat'ta başlayan ABD/İsrail-İran
  Savaşı"); Waffenruhe ~18.06.2026; Interimsabkommen ~31.07.2026; Brent <80 USD (07/2026).
- **Globaler Zinsschub 2026**: EZB +25 bp 11.06. und 10.09. (Einlage 2,50 %);
  Fed +25 bp 16.09. auf 3,75–4,00 %; US-10J 5,26 % (29.09., 52W-Hoch); BoJ 1,25 %.
- **Ölpreis**: Kriegsspitze >110 USD (03/2026), nach Waffenruhe <80–83 USD (07–08/2026).
- Konsequenz fürs Modell: 2026 ist ein Lehrstück für `weltzins`- und `oel`-Kanäle
  (Zinsschub + Energieschock gleichzeitig, dazwischen Rohstoff-Entspannung).

## 2. Abgleich mit `game/src/data/szenario_tuerkei_2026-09-25.json`

| Szenario-Feld | JSON-Wert | Recherche-Befund | Status |
|---|---|---|---|
| policyRate 37 (10.09.2026) | 37 | PPK 10.09.2026 hält 37 % (5. Mal in Folge); AA-Umfrage: 24/25 Ökonomen erwarteten Hold | ✅ passt |
| inflation 31,51 (08/2026) | 31,51 | TÜİK 08/2026 = 31,51 (m/m 1,84), Basis 2025=100 | ✅ exakt |
| usdTry 48,95 (25.09.) | 48,95 | 21.09.: 48,80; 30.09.: 49,02 — 25.09. dazwischen | ✅ plausibel |
| eurTry 55,75 | 55,75 | 30.09.: 55,69–55,71 | ✅ passt |
| riskPremium 250 | 250 | CDS 28.09.2026: 250 bp (höchster seit Mai) | ✅ exakt |
| growth 2,3 (Q2 2026) | 2,3 | TÜİK Q2-2026 = +2,3 % y/y | ✅ exakt |
| unemployment 8,1 (07/2026) | 8,1 | TÜİK 07/2026 = 8,1 (s.a.) | ✅ exakt |
| expectedInflation 28 („Platzhalter") | 28 | TCMB-Umfrage 09/2026: Jahresende 29,6; 12M 23,7; CBRT-Prognose 28 % für End-2026 | ✅ guter Platzhalter |
| inflationTarget 24 („Zwischenziel 2026") | 24 | **Diskrepanz**: OVP (09/2025) nennt 16 % für 2026, CBRT-Inflationsbericht 28 % (End-2026), MTP-Pfad 16/9/8 (2026/27/28). 24 liegt dazwischen — vermutlich aktualisiertes OVP 09/2026; nicht verifiziert | ⚠️ Quelle klären |
| debtRatio 23,8 (Ende 2025, EU-Def.) | 23,8 | nicht geprüft (Größenordnung plausibel, ~25 %) | ⚪ ungeprüft |
| deficit 3,1 (Ziel 2026) | 3,1 | OVP 2026–2028 (09/2025): Defizitziel 3,5 % f. 2026, 2,8 % f. 2028; 3,1 evtl. aus neuem OVP | ⚠️ leicht abweichend |
| credibility 0,45 / outputGap −1 / potentialGrowth 4 | — | Modell-Interna, keine Messgrößen; Kalibrierungsobjekte dieser Datei | ⚪ per Definition |

**Fazit des Abgleichs:** Die harten Marktdaten des Szenarios (Inflation, Zins, FX, CDS,
Wachstum, ALQ) sind durch diese Recherche voll bestätigt. Zwei Felder (inflationTarget,
deficit) weichen von den zuletzt veröffentlichten OVP-Zahlen ab und sollten mit dem
dokumentierten Stand in `tuerkei/STARTDATEN.md` harmonisiert werden.

## 3. Offene Lücken und Nachladeoptionen (Priorität)

1. **`rendite_10j` monatlich** — EVDS (TP.BD.10Y / Benchmark-Serien) oder
   investing.com-Historie; aktuell nur 3 verifizierte Anker.
2. **`usdtry` 2018–2025 zellweise** — Frankfurter-API (ECB-Referenzkurse, täglich,
   kostenfrei, keine Auth): Monatsende = letzter Fixing des Monats.
3. **`reserven` monatlich** — EVDS TP.AB.TOPLAM (wöchentlich), frei nach Registrierung;
   alternativ ortakalan.io-Reihe.
4. **`enag` 2024 + frühe Monate** — ENAG-Archiv (enag.org.tr / @ENAGRUP auf X);
   einzige größere Lücke in der Inflations-Gegenüberstellung.
5. **`tuefe` 2026-09** — TÜİK veröffentlicht am 05.10.2026; Schätzung (30,1) dann ersetzen.
6. **Industrieproduktion** (optional, wurde zugunsten BIP-Quartale weggelassen) —
   TÜİK SÜİ monatlich; nützlich als hochfrequenter Output-Gap-Proxy für Lernfall 2019.
7. **Arbeitslosigkeit 2026-08/09** — erscheint ~Mitte Oktober bzw. November.

## 4. Methodische Notizen

- est-Flag-Semantik steht in `kalibrierung/README.md`; verifizierte Zellen sind im
  Generatorskript als eigene Mengen hinterlegt, damit Nachladungen gezielt ersetzen können.
- CDS-/Rendite-Tageswerte streuen je nach Anbieter (OTC); für Monatsenden wurden
  möglichst datierte Presse-Notierungen desselben Tages verwendet.
- Die 2026er Kriegsepisode erzeugt strukturelle Brüche in fast allen Reihen
  (Reserven −45 Mrd. 02→07, CDS +120 bp, Exporte −12,7 %, 10J +~6 p. 06→09) — für die
  Kalibrierung als eigenes Ereignis-Regime behandeln, nicht als Rauschen.
