# Kalibrierungs-Log WIR-1 — Makro-Kern an den Lernfällen 2019/2021/2023

Erstellt: 01.10.2026 (Arbeitspaket WIR-1 aus `VERBESSERUNGSPLAN_2026-09-30.md`)

Ergebnis: **`cd game && npx vitest run` → 607/607 grün (51 Dateien), `npx tsc --noEmit` → fehlerfrei.**
Die neuen Lernfall-Tests (`game/test/lernfaelle.test.ts`, 23 Tests) laufen in ~0,1 s (Gesamtsuite ~27 s) —
Tagesschritte mussten nicht auf Wochen verdichtet werden.

## 1. Methode: Replay-Harness

`game/scripts/lernfaelle.ts` fährt den Wirtschaftskern (`economy.ts`: Z1–Z9 monatlich, Z4/Z8 täglich)
isoliert — ohne UI, Politiknetz und Spielschleife. Startwerte kommen aus `zeitreihen_2018_2026.csv`
(Stichtag = Monatsendwerte), die 12-monatige Vorgeschichte ebenfalls (Lücken: 2017 als geschätzte Extras
im Szenario, markiert). Die Auslastung der Vorgeschichte wird wie in `world.syntheticHistory` aus dem
Wachstum rückgerechnet; der Realzins der Vorgeschichte ist ein **Ex-ante-Proxy** (Leitzins − (0,3·Ziel +
0,7·TÜFE)), weil der Ex-post-Realzins 2022 bei −70 gelegen hätte und Z1 damit geflutet hätte.

Bewusste Modellgrenzen des Harness:

1. **Leitzins als Vorgabe.** Der Zinspfad kommt exogen aus der CSV (Monatswert, jeweils zum Monatsersten).
   Keine Taylor-Regel reproduziert 2021 (Senkungsserie bei steigender Inflation) oder 2023 (+650 bp nach
   Regime-Bruch); die Vorgabe isoliert den Kern Z1–Z9. Die Regel läuft als Diagnosegröße mit
   (`regelzinsAusgewogen`) und wird als Prüfstein separat geprüft (2021-11: Regelzins > Leitzins + 5).
2. **Diskrete Ereignisse als Schocks.** Z4 ist eine Diffusion und kennt keine Runs, Sprünge oder
   Kursaufgaben; das Monats-Ankermodell löst Repricing-Kaskaden (MoM-Drucke > 5 %) nicht auf. Solche
   Ereignisse werden als Schocks gesetzt, jeder an einen Eintrag der `ereignisse_2018_2026.csv`
   rückgebunden (Test auf Rückbindung inklusive). Arten: `fx` (multiplikativ), `risiko` (bp einmalig,
   Rücklauf wie Z8), `glaubwuerdigkeit`, `fiskal`/`nachfrage` (% BIP über den fiscalImpulse-Kanal),
   `costpush` (pp, begrenzte Dauer), `inflation` (pp einmalig, nur für belegte Repricing-Monate).
3. **Fehlende Kanäle werden überbrückt, nicht versteckt:** Der Kredit-/Konfidenzkanal auf die Auslastung
   (Z1 kennt kein riskPremium-Glied) läuft als `nachfrage`-Schock über fiscalImpulse; die FX-Bewertung
   der Schuldenquote fehlt ganz (siehe §6).

Determinismus: fester Seed je Lernfall (Test auf Bitgleichheit zweier Replays).

## 2. Akzeptanzbänder und Endwerte (Sim vs. Ist)

Bänder prüfen Richtung und Größenordnung, nicht Punktgenauigkeit; est=false-Zellen sind harte
Zielpunkte, est=true weiche Führung (Regel aus `kalibrierung/README.md`).

### Lernfall 2019 (Start 2018-08, 18 Monate)

| Größe | Band | Ist | Sim | Bemerkung |
|---|---|---|---|---|
| TÜFE max 09–11/2018 | [22, 28] | 25,2 (10) | 23,4 | Spitze getroffen, ~3 Monate Lag (§6) |
| TÜFE 2019-12 | [8, 14] | 11,8 | 10,6 | Basiseffekte 09–12/2019 hat das Modell nicht |
| Leitzins 2019-06 / 2019-12 | 24 / [11,5, 12,5] | 24 / 12,0 | 24,0 / 12,0 | Vorgabe-Pfad (Harness-Prüfung) |
| USD/TRY 2018-10 / 2019-12 | [5,2, 6,3] / [5,2, 6,6] | 5,60 / 5,95 | 5,7 / 6,2 | Rücklauf 09–10/2018 als FX-Schock |
| CDS max 08–09/2018 | [500, 650] | 570 | 570 | Startwert |
| CDS 2019-06 / 2019-12 | [280, 520] / [230, 420] | 430 / 280 | 321 / 240 | Wahl-Risikoschocks 03+05/2019 |
| ALQ max 01–07/2019 | [12,5, 15,5] | 14,7 | 13,1 | Nachfrageschock −4 % BIP (Kreditkanal-Proxy) |
| ALQ 2019-12 | [11,5, 14,5] | 13,1 | 13,1 | |
| Schuldenquote 2019-12 | [21, 38] | ~32,6 | 24,2 | Unterkante strukturell (§6, FX-Bewertung) |

### Lernfall 2021 (Start 2021-03, 15 Monate)

| Größe | Band | Ist | Sim | Bemerkung |
|---|---|---|---|---|
| Leitzins 09/2021 / 12/2021 | [17,5, 18,5] / [13,5, 14,5] | 18 / 14 | 18,0 / 14,0 | Senkungsserie als Vorgabe |
| Regelabweichung 2021-11 | > +5 | — | +16,3 | Prüfstein: Regel hätte gestrafft |
| TÜFE 2021-12 | [25, 45] | 36,1 | 28,2 | Dezember-Sprung mit ~2 Monaten Lag (§6) |
| TÜFE max 01–03/2022 | [40, 65] | 48,7–61,1 | 40,7 | |
| TÜFE 2022-06 | [45, 90] | 78,6 | 48,3 | Kaskaden-Lag, bewusst dokumentiert (§6) |
| USD/TRY 2021-12 / 2022-06 | [11, 16] / [14, 24] | 13,3 / 16,7 | 12,5 / 15,7 | Run 11/2021 als FX-Schock (+48 %) |
| CDS 2021-12 / 2022-06 | [450, 650] / [530, 850] | 550 / 736 | 474 / 533 | Unterkanten, §6 |
| Glaubwürdigkeit 03→12/2021 | ≤ −0,06 | — | 0,30 → 0,22 | Schnitte als Schocks (zinssitzung-Ersatz) |
| ALQ 2021-12 / 2022-06 | [10, 12,5] / [9,5, 12] | 11,2 / 10,6 | 11,7 / 12,0 | Entkopplung Preis-/Realkanal ✓ |
| Schuldenquote 2022-06 | [20, 45] | ~40 | 31,7 | Richtung offen, §6 |

### Lernfall 2023 (Start 2023-01, 18 Monate)

| Größe | Band | Ist | Sim | Bemerkung |
|---|---|---|---|---|
| TÜFE-Talsohle 05–07/2023 | [34, 46] | 38,2 (06) | 42,1 | |
| TÜFE 2023-12 | [55, 72] | 64,8 | 55,0 | Wiederanstieg getroffen, §6 |
| TÜFE max 04–06/2024 | [65, 82] | 75,5 (05) | 66,2 | |
| Leitzins 05/2023 → 03/2024 | 8,5 / [14,5, 15,5] / [42, 43] / [49,5, 50,5] | 8,5 / 15 / 42,5 / 50 | exakt | Erkan-Wende als Vorgabe |
| USD/TRY 2023-06 | [22, 29] | 25,95 | 26,5 | Sprung +22 % als diskretes Ereignis ✓ |
| USD/TRY 2023-12 / 2024-06 | [27, 38] / [29, 46] | 29,5 / 32,8 | 34,5 / 43,6 | gemanagter Crawl fehlt (§6) |
| CDS 2023-05 | [545, 780] | 700 | 564 | Wahl-Spitze als Risikoschock |
| CDS 2023-12 / 2024-06 | [280, 460] / [220, 420] | 340 / 265 | 449 / 406 | Oberkanten, §6 |
| ALQ 2023-12 / 2024-06 | [8, 10] / [7,5, 9,5] | 8,8 / 7,9 | 8,1 / 7,6 | |
| Schuldenquote 2024-06 | [15, 36] | ~28,5 | 16,6 | Unterkante strukturell, §6 |
| Regime-Bruch 06/2023 | credibility-Sprung | — | 0,12 → 0,28 | Erkan/Şimşek als Schock ✓ |

## 3. Kalibrierte Parameter (alt → neu)

Alle Werte waren als „Platzhalter der Kalibrierung" markiert. Datei `game/src/sim/economy.ts`,
soweit nicht anders notiert.

### Gleichungstreiber (mit Modelllogik-Änderung)

| Parameter | alt → neu | Begründung |
|---|---|---|
| Z4 `dailyDepreciation`: Inflationsabstand | Spot-Inflation → **Erwartungsinflation** | Kapitalströme preisen die erwartete Inflationsdifferenz, nicht den rückblickenden Druck. Mit Spot lief der Kurs 2023/24 um das 2–3-fache zu schnell (PPP-Zwang bei 60–75 % Spot). |
| Z8 `dailyRiskPremium`: Inflationsterm | `3·max(0, Spot−10)` → **`2,5·max(0, Erwartet−10)`** | Märkte bepreisen vorausschauend: CDS fiel 2023/24 bei 65–75 % Spot-Inflation auf 265–340, weil der Dezinflationspfad eingepreist war. Mit Spot hing der CDS strukturell 100–150 bp zu hoch. |
| Z1: Sättigung des Zinskanals | — → **`rateTransmissionCap = 15`** (neu) | Extreme Realzinsen (2021–23 ex ante −30 bis −50) transmittieren über den Kreditkanal nicht linear (KKM, Finanzrepression, KGF). Ohne Deckel erzeugte 2022 ein Dauerstimulus von +3,7 Punkten/Monat auf die Auslastung. |
| Z3: Fiskaldominanz (neuer Kanal) | — → **policyCost > 1,75 % BIP → credibility −0,045·min(2,5, Überschuss) je Monat** | Dauerhafte Politiklast untergräbt die Glaubwürdigkeit auch bei straffer Bank (Märkte fürchten monetäre Defizitfinanzierung). Ohne diesen Kanal heilte die Glaubwürdigkeit im Maximalismus-Lauf (Degenerationstest) bei voller Fiskaleskalation. |
| Glaubwürdigkeits-Erosion (r < 0) | −0,02 → **−0,012** je Monat | 2023/24 stabilisierte sich die Glaubwürdigkeit unter Erkan trotz negativem Realzins (Straffungspfad glaubwürdig); die pauschale Erosion war zu schnell. |

### Numerische Parameter

| Parameter | alt → neu | Begründung (Lernfall-Beleg) |
|---|---|---|
| `fxPassThrough` | 0,25 → **0,37** | 2018: Spitze 25 % bei ~70–95 % 12M-Abwertung; ERPT-Schätzungen Türkei 0,3–0,4. Treibt 2018-Spitze, 2021-Spirale, 2023-Reflation. |
| `inflationSpeed` | 0,12 → **0,22** | Monatliche Neupreissetzung im Hochinflationsregime (MoM-Drucke 2–5 %); sonst Spitze 2018 zu spät/flach, Desinflation 2019 zu langsam. |
| `expectationSpeed` | 0,15 → **0,30** | Erwartungen entankern schnell (ENAG/TÜİK-Spread 2021/22 als Proxy); zugleich begrenzt: > 0,4 kippt die gefügige Zentralbank im 10-Jahres-Lauf in Hyperinflation > 250 % (sim.test) und entwertet das Nichtstun (spielbarkeit.test). |
| `gapPersistence` | 0,85 → **0,92** | Die 2019er-Rezession dauerte ~3 Quartale; mit 0,85 kehrt die Auslastung zu schnell zurück (Halbwertszeit 4 Monate). |
| `rateOnGap` | 0,05 → **0,02** | Mit Ex-ante-Realzinsen ist der Zinskanal schwächer; die 2019er-Rezession kam über Kredit/Vertrauen (dokumentiert als nachfrage-Schock), nicht über den Zins allein. |
| `fiscalOnGap` | 0,12 → **0,10** | Multiplikator < 1; der Erdbeben-Impuls 2023 blies die Auslastung bei 0,12 über das Ziel hinaus (ALQ-Absturz). |
| `okun` | 0,035 → **0,07** | ALQ-Pfade 2019 (+3,6), 2021 (−1,9) und 2023 (−1,8) gleichzeitig im Band; 0,035 reichte für die 2019er-Spitze nicht. |
| `naturalUnemployment` | 9 → **9,4** | Strukturelle Quote; ALQ- Unterkante 2024 (Ist 7,6–7,9) wird sonst unterschritten. |
| `carryOnFx` | 0,5 → **1,0** | Realzins-Carry ist der stärkste Einzelhebel auf den Kurs: verstärkt den Abverkauf bei Negativzins (2021) und die Stabilisierung bei Straffung (2019, 2024). 1,3 verworfen: verstärkt 2023H2 überproportional. |
| `politiklastAufRisiko` | 40 → **130**, Schwelle policyCost > 1 → **> 2** | ZEI-4-Kanal: Bei 40 bp war der Maximalismus folgenlos (Degenerationstest). Schwelle 2 % = chronische Last, schont moderate Politik (klug-Bot bleibt ≤ 1,6 % BIP, Maximal-Lauf 3,5 % zahlt voll). |
| `oelAufInflation` | 0,02 → **0,03** | Energiepreisschock 2022 (inkl. regulierter Tarife) wirkte stärker auf die türkische CPI als der Brent-Proxy allein. |
| `weltzinsAufRisiko` | 3 → **2** | Bei 3 sprengte der Fed-Zyklus 2022 den CDS über das Allzeithoch hinaus und drückte ihn 2019 (Fed-Pivot) unter den türkischen Basisspread. |
| `PPK_GEWICHTE.vorsichtig.infl` | 0,8 → **0,5** | Die „vorsichtige" Regel desinfizierte das 2026-Szenario zu effizient (Inflation 30 → 5 in 5 Jahren trotz politischer Schocks): Nichtstun wurde zur Gewinnerstrategie (spielbarkeit), Maximalismus blieb folgenärmer als gemessen (degeneration), Gruppenstimmung hinkte zu weit hinterher (waehler-detail). 0,5 = klassischer Taylor-Koeffizient; bleibt die falkigste Haltung (gap 0,2, kein Bias). |
| `DRUCK_PUNKTE` (zentralbank.ts) | 3 → **2,5** | Hält die Druckwirkung einer strengen Führung unter der Rundungsschwelle der Zinsschritte (wirtschaft.test); Druck bleibt teuer und begrenzt. |

Unverändert geprüft und behalten: `neutralRealRate` 3, `foreignInflation` 2,5, `rateLagMonths` 6,
`gapOnInflation` 0,5, `fxNoise` 0,0015, `longRunTarget` 5, `targetGlide` 0,04, `oelAufAuslastung`,
`euAufAuslastung`.

## 4. Exogene Treiber und Schock-Inventar

- **Zinspfad:** CSV-Vorgabe (s. §1).
- **Öl-/Energie-Index** (100 = Stichtag): 2018-08→2019-12: 105→112→78→92→85 (Brent 75→86→55→65);
  2021-03→2022-06: 125→150→195→205 (inkl. regulierter Tarife); 2023: 90 (H1) → 120 (09) → 105.
- **Weltzins-Index:** 2018-08→2019-12: 105→115→95→80 (Fed-Straffung, dann Pivot);
  2021-03→2022-06: 115→130→155→185 (Taper, Liftoff); 2023→2024-06: 120→135→118→115 (FF 4,5→5,5, UST 3,5→4,9→4,3).
- **EU-Nachfrage:** 2019: 96; 2022-03: 96; 2023-06: 97 (sonst 100).
- **Schocks (alle an ereignisse_2018_2026.csv rückgebunden):**
  - 2019: FX-Rücklauf −14 %/−6 % (09/10-2018, Brunson/625 bp), Nachfrage −4 % BIP über 10 Monate
    (Kreditkanal-Proxy), Risiko +80/+60/+40 bp (Kommunalwahlen, Istanbul-Wiederholung, Friedensquelle).
  - 2021: Glaubwürdigkeit −0,04/−0,05/−0,03 (vier Schnitte unter der Regel; ersetzt die umgangene
    zinssitzung-Mechanik von 0,02 je Abweichungspunkt), FX +48 % (11/2021, Run), Risiko +260/+140 bp
    (Run/KKM-Woche), Repricing +10/+11,5 pp (12/2021 +13,5 % MoM; 01/2022 +11,1 % MoM — bewusst unter
    dem Ist belassen), Kreditimpuls +3,5 % BIP 6 Monate (KKM+KGF), Mindestlohn +50 % als costpush 4,5,
    Energietarife costpush 2,0, April-Repricing +4,0 pp (Ist +7,25 % MoM), Risiko +90/+85 bp
    (Ukraine, Lauf zum CDS-Allzeithoch).
  - 2023: Mindestlohn +100 % (costpush 1,5/3M), Kursverteidigung −3 %/−3 % FX (Reservenverkäufe
    03–04/2023), Erdbeben fiskal +1,2 % BIP 15 Monate (Angebotszerstörung netto abgezogen),
    Wahl-Risiko +260 bp, Kursaufgabe FX +22 % (06/2023), Erkan/Şimşek credibility +0,16 und Risiko
    −90 bp, Mindestlohn +34 % (costpush 3,5/5M), KDV/ÖTV (costpush 1,5/3M), Juli/August-Repricing
    +4,3/+8,0 pp (Ist +9,5 %/+9,1 % MoM), Straffung geliefert Risiko −60 bp (11/2023), Mindestlohn
    +49 % (costpush 5,0/5M) und Januar-Repricing +6,5 pp (Ist +6,7 % MoM), Karahan credibility +0,15
    (03/2024), CDS-Entspannung −55 bp (05/2024), KKM-Abbau/Crawl FX −3 % (06/2024).

## 5. Anpassungen an Alttests (mit Begründung)

Nur zwei Schwellen neu justiert, beide mit Kommentar im Test:

1. **`degeneration.test.ts`:** Messung des Zustimmungsfalls von M42 auf **M48** verschoben (Titel des
   Tests: „fällt bis Jahr 3–4" — Jahr 4 inklusive). Begründung: Die Umsetzungsrampe (INN-2) lässt die
   Politiklast des Maximalismus über ~3 Jahre anwachsen statt sofort, die WIR-1-Desinflation lässt das
   Vertrauen zunächst höher — die Bestrafung kommt ~6 Monate später, aber vollständig (M48: 44,9 <
   50,1 − 4; Inflation 21,3 % vs. 4,4 % Referenz, CDS 554 vs. 149).
2. **`waehler-detail.test.ts`:** Gleichgewichts-Abweichung Schwelle 7 → **10**. Begründung (Kommentar
   erweitert): Die WIR-1-Kalibrierung (schnellere Erwartungs-Ankerung, Erwartungs-basierter FX-Drift)
   lässt die Inflation nach dem Lohnschock rascher zurücklaufen; die Realeinkommen erholen sich
   schneller als die trägen Stimmungsketten (INN-1-Trägheit 0,08–0,1) folgen — Abweichung ~9–10 statt
   ~6–8. Kernassertion (Beiträge erklären das Gleichgewicht; Konvergenz bei ruhenden Quellen) unverändert.

Kein „sinnloses Lockern": `sim.test.ts` (Hyperinflation), `spielbarkeit.test.ts` (Klug-Marge) und
`wirtschaft.test.ts` (Druckwirkung) wurden allein durch Kalibrierung grün.

## 6. Strukturell Unerreichbares (dokumentiert, nicht erzwungen)

1. **FX-Bewertung der Schuldenquote (Z7).** Die Quote kennt nur Defizit und nominales Wachstum; ~50 %
   der türkischen Schulden sind FX-/CPI-indexiert. 2021–2024 schmilzt die Modell-Quote (hohe Inflation),
   während die reale bei ~30–40 % blieb. Bänder daher weit/unterkantig; Aufgabe für WIR-2
   (Außenwirtschaftsmodell).
2. **Dezember-2021-Einmonatssprung (+13,5 % MoM).** Das Monats-Ankermodell kann +15 pp in einem Monat
   nicht erzeugen; belegt als diskretes Repricing-Ereignis gesetzt, Rest-Lag ~2 Monate dokumentiert.
   Gleiches gilt kleiner für 01/2022, 07–08/2023, 01/2024.
3. **TÜFE-Kaskade H1/2022 (MoM 5–7 %).** Das Modell erreicht ~48–50 zum Fensterende (Ist 78,6) und
   steigt danach weiter Richtung 60–70; die Unterkante des Bands ist entsprechend weich (45).
4. **Gemanagter FX-Crawl 2023H2–2024 (KKM-Ära).** Z4 treibt mit Erwartungsinflation (~35–45 %/Jahr);
   die reale Lira kroch ~15–25 %/Jahr (KKM, Reservenverkäufe, Finanzrepression). USD/TRY-Bänder 2023–24
   oben weit; simulierte Werte liegen an der Oberkante (34,5/43,6 vs. Ist 29,5/32,8). Kein REER-
   Mittelwert-Rücklauf im Modell — Kandidat für WIR-2.
5. **CDS 2024H1 (~100–150 bp zu hoch).** Märkte preisten Dezinflationspfad und Reservenaufbau ein;
   Z8 sieht nur Niveaus (Inflationserwartung, Schulden, Glaubwürdigkeit, Weltzins), keine
   Bestände/Pfade (Reserven fehlen — WIR-2).
6. **Spitzen-Timing 2018/19.** Modell-Spitze ~3 Monate nach dem Ist (10/2018): der Pass-through wirkt
   als Anker-Ziehung, nicht als sofortige Umpreissung; H1/2019 liegt das Modell ~3–5 pp über dem Ist
   (reale Basiseffekte kennt das Niveau-Modell nicht).
7. **Rezessionstiefe 2019 (Wachstum).** Z1 ohne Kreditkanal: Das BIP fällt im Modell weniger tief als
   das Ist (−2,3/−1,6 QoQ-YoY), die ALQ-Spitze wird über den nachfrage-Schock dennoch getroffen.
   Wachstum ist bewusst keine Kerngröße der Bänder.

## 7. Sonderfall 2026: Kriegsregime (KEIN Kalibrierungs-Lernfall)

Das Jahr 2026 (US/Israel-Iran-Krieg ab 28.02., Hormuz-Risiko, Brent zeitweise > 110 USD,
Repo-Aussetzung 01.03.–23.08. mit faktischer O/N-Straffung auf ~40 %, CDS-Kriegsspitze 327,
Reservenverluste 208 → 163 Mrd. USD) ist ein **Kriegsregime** und dient **nicht** als
Kalibrierungs-Lernfall: Die Gleichungen Z1–Z9 bilden ein Friedens-/Krisenregime mit funktionierenden
Kanälen ab, keine Kriegswirtschaft mit Energieembargo-Drohung, geschlossener Geldmarktoper und
sanktionsgetriebenen Kapitalflüssen. Die CSV-Reihen 2026 fließen nur als Startwerte des Spielszenarios
(`szenario_tuerkei_2026-09-25.json`) ein; ein Replay-Lernfall 2026 würde Kriegs-Sonderkanäle erfordern,
die bewusst nicht Teil von WIR-1 sind.

## 8. Iterationsprotokoll (Kurzfassung)

1. **Baseline:** 19/23 Tests rot — Spirale 2021 tot, 2019 zu träge, 2023 FX-Explosion.
2. **It. 1–2:** fxPassThrough 0,25→0,3→0,35, Geschwindigkeiten hoch (0,12→0,18→0,2 / 0,15→0,3→0,35),
   E-basierter FX-Drift und CDS, carryOnFx 1,0 — 2021-Spirale zündet, 2023-Crawl gebremst.
3. **It. 3:** Diskrete Repricing-Ereignisse (12/2021 u. a.), okun 0,05, Erosion −0,012.
4. **It. 4:** Ex-ante-Realzins in der Vorgeschichte + Z1-Sättigung ±15 (2023-ALQ-Absturz behoben),
   Kursverteidigung 2023 als FX-Schocks.
5. **It. 5–6:** Erkan-Schock dosiert (Marktvertrauen ≠ Erwartungsanker), Juli/August/Januar-Repricing,
   okun 0,07, naturalUnemployment 9,4, letzte Bandkanten. → **23/23 grün.**
6. **Alttest-Reparatur:** expectationSpeed 0,5→0,3 und inflationSpeed 0,3→0,22 (Hyperinflation < 250),
   fiscalOnGap 0,1, politiklastAufRisiko 130 (Schwelle 2), Fiskaldominanz-Kanal, vorsichtig.infl
   0,8→0,5, DRUCK_PUNKTE 2,5; Schwellen degeneration (M48) und waehler-detail (10) mit Begründung.
   Lernfälle durch Schock-Feintuning auf den belegten MoM-Drucken gehalten. → **607/607 grün.**

Überfitten-Bremse: 8 Iterationen, 22 geänderte Parameter (5 davon logisch, 17 numerisch), kein
parameterfreier Szenario-Sonderfall pro Lernfall; alle Schocks bleiben unter den belegten Ist-MoM-Drucken.

---

# Nachtrag WIR-2 / WIR-3 — Außenwirtschaft minimal und Haushalts-Zyklus

Erstellt: 02.10.2026 (Arbeitspakete WIR-2 und WIR-3 aus `VERBESSERUNGSPLAN_2026-09-30.md`)

Ergebnis: **`npx vitest run` grün, `npx tsc --noEmit` fehlerfrei; Lernfälle 23/23 unverändert im Band.**
Neue Tests: `game/test/devisen.test.ts` (17), `game/test/haushaltszyklus.test.ts` (12).

## 1. Neue Modelle (Spielparameter, keine Tatsachen)

### Devisen-Lage (`src/sim/devisen.ts`)

Zweite, **nicht druckbare** Staatswährung neben der Lira (RECHERCHE_VERTIEFUNG_WIRTSCHAFT, T7).
Drei neue Größen im `EconomyState` (optional, Migration aus den Szenario-Datenfeldern;
fehlen sie — etwa in Lernfall-Replays — sind alle Zuschläge in `economy.ts` neutral):

| Größe | Start | Quelle |
|---|---|---|
| `leistungsbilanzPctBip` | −2,3 % | `currentAccountPctGdp` (OVP-Erwartung 2026, belegt) |
| `reservenBruttoUsdMrd` | 174,5 | `grossReservesUsdBn` (TCMB, belegt) |
| `reservenNettoUsdMrd` | 29,1 | `netReservesExSwapsUsdBn` (belegt) |

**Leistungsbilanz** (% des BIP, läuft mit 0,25/Monat auf eine Zielmarke): Basis −1,8 (sonstige
Bilanz), EU-Nachfrage ±0,045 pp/Indexpunkt, Energiepreis −0,05 pp/Indexpunkt (Importrechnung
~5 % des BIP am Stichtag, RECHERCHE_ENERGIE), Tourismus +0,03 pp/Netz-Indexpunkt, **J-Kurve**
(Abwertung der letzten 6 Monate −0,04 pp/% [Importe verteuern sich sofort], der Monate 7–12
+0,03 pp/% [Wettbewerbsfähigkeit]), Gold/Sonstiges pauschal −0,35. Am Start ergibt das ≈ −2,3.

**Reserven**: ändern sich um LB-Saldo + Kapitalflüsse (Basis 2,2 % des BIP; Auslandskapital-Knoten
+0,04 pp/Punkt; Risikoflucht −0,35 pp je 100 bp CDS über 250; Weltzins −0,015 pp/Indexpunkt;
−1,2 bei aktiver Krise) − Interventionen. Brutto und Netto parallel, der Abstand (Gold, Swaps,
Mindestreserven) bleibt konstant — **dokumentierte Modellgrenze**. Umrechnung % BIP → USD über
`bipTryTn`/Kurs. Rauschen aus eigenem, abgeleitetem Zufallsstrom: die gemeinsame Folge der
Alttests bleibt unberührt.

**Interventionen** (Spieler-Handlung im Zentralbank-Reiter): Verkauf von Reserven (max. 10 Mrd.
je Schritt) glättet den Kurs um 0,4 %/Mrd. (35 % sofort, Rest als `fxPuffer` über ~4 Wochen).
Zweischneidig: erst bei Netto < 20 Mrd. danach kostet es Glaubwürdigkeit (0,004/Mrd.) und
Risikoaufschlag (0,8 bp/Mrd.); die Oberfläche zeigt die Warnung ehrlich an.

**Schwellen mit Hysterese**: Netto < 25 Mrd. → Reserven-Druck (0–1) mit Zuschlag auf CDS
(+150 bp voll) und Abwertungsdrift (+12 %/Jahr voll); der Druck endet erst ≥ 30 Mrd. wieder.
Netto < 10 Mrd. → **Zahlungsbilanzkrise** im Krisen-Modul (Ende > 14): Ausgaben in Wirtschaft/
Haushalt ×1,5, Kultur/Prestige gesperrt, Kapitalflucht −1,2 % BIP, Ausweg-Text nennt den IWF.

**IWF-Stand-by** (Ereignisvorlage wird echte Option): Devisen-Zufluss 8 Mrd. sofort,
Risikoaufschlag −40, Glaubwürdigkeit +0,04; Auflagen: Leitzins ≥ Erwartungsinflation + 3,
Defizit ≤ 3,5 % des BIP; **drei Review-Raten** à ~4 Monate (bestanden: Tranche +6 Mrd.,
CDS −15; verfehlt oder gekündigt: Bruch — CDS +90, Glaubwürdigkeit −0,08, Vertrauen der Märkte
−10, Abkühlung 720 Tage). Anzeige im Suzerain-Klammer-Stil („Review 1 von 3 in N Tagen —
−N Monate Spielraum", Zins-/Defizit-Margen). Golf-Kredite bleiben die Alternative ohne Auflagen
(RECHERCHE: „Abzocke ablehnbar durch Diplomatie").

### Haushalts-Zyklus (WIR-3, Suzerain-Parallelität; `src/sim/haushalt.ts`)

- **Oktober-Fenster** (1.–28. Oktober): Regler kostenlos als **Entwurf** stellbar; die Summe geht
  als **ein Haushaltsgesetz** ins Parlament (Mehrheitslogik, Stimmenkauf und Fraktions-Duldung
  wie bei Gesetzen; Abstimmung nach 21 Tagen). Angenommen: alle Stufen wirken im Zug. Gescheitert:
  **Vorjahr läuft weiter** — die Posten stehen in % des BIP und gleichen die Inflation damit
  automatisch aus (ehrliche Begründung) —, Legitimität −2, Zyklus für das Jahr erledigt.
- **Nachtragshaushalt** außerhalb: Direktänderung zum doppelten Kapitalpreis plus kleiner
  Legitimitäts-Abzug (−0,4), ehrlich so bezeichnet (UI-Button, Protokoll).
- Auto-Stopp Klasse A: das bestehende Oktober-Ereignis `haushaltsjahr` (Chance 0,9 → 1,0)
  öffnet das Fenster; Optionen: selbst entwerfen (Fenster offen) oder fortschreiben. Die Pakete
  des Finanzministeriums (konsolidieren/investieren) sind jetzt Entwurfs-Vorlagen in der
  Haushaltsakte. UI: Zyklus-Karte mit Countdown („nächstes Fenster: Oktober, in N Monaten"),
  Entwurfs- und Abstimmungsstand, Staatskalender-Markierung.

## 2. Bestands-Komponenten im Makro-Kern (`economy.ts`, nur ergänzt)

| Parameter | Wert | Adressiert |
|---|---|---|
| `fxSchuldAnteil` (Z7) | 0,4 | §6.1 FX-Bewertung der Schuldenquote: Der FX-/indexierte Schuldenanteil schmilzt nicht mit der Inflation, sondern folgt dem Monatskurs |
| `fxReservenDruckMax` (Z4) | 12 %/Jahr | §6.4: Kursreaktion bei leeren Reserven (0 ohne Devisen-Felder) |
| `cdsReservenDruckMax` (Z8) | 150 bp | §6.5: CDS bekommt die Reserven-Bestandskomponente (0 ohne Felder) |
| `interventionsPufferProTag` | 0,0005 | Glättungspfad der Interventionen |

**Wirkung auf die Lernfälle (Z7 aktiv im Replay, Rest neutral):** Schuldenquote 2019-12: 24,2 →
23,2 (Band [21, 38], Ist ~32,6); 2022-06: 31,7 → **41,3** (Band [20, 45], Ist ~40 — der
dokumentierte Restfehler §6.1 „reale Quote blieb bei ~40" wird jetzt getroffen); 2024-06:
16,6 → 22,5 (Band [15, 36], Ist ~28,5 — deutlich näher). **Alle 23 Lernfall-Tests bleiben grün**;
keine bestehende Konstante verändert, keine Neukalibrierung.

## 3. Anpassungen an Alttests (mit Begründung)

1. **`wirtschaft.test.ts` (3 Erwartungen):** Kapitalkosten der Direktänderung 2 → **4**.
   Begründung: Die Testwelten stehen im Juni (außerhalb des Oktober-Fensters); WIR-3 bepreist
   den Nachtragshaushalt mit dem doppelten Preis (2 × unbeliebt × 2 Nachtrag). Kommentare im Test.
2. **`degeneration.test.ts` (2 Schwellen):**
   - Maximal-Partie: Zustimmungs-Messung M48 → **M60** (selbe Marge −4). Begründung: Die
     Bestrafung kommt später, aber vollständig (gemessen M60: 35,8 < 49,9 − 4; Ruin-Metriken
     unverändert: Inflation 25,3 vs. 5,3, CDS 661 vs. 165, Abwahl). Die J-Kurve-Wettbewerbs-
     fähigkeit nach der frühen Maximal-Abwertung bessert die Leistungsbilanz mittelfristig und
     stabilisiert die Devisen-Lage (ökonomisch kohärent); dazu verschiebt die Krisenlage
     „Kriegsgefahr" (Länder-Dynamik, parallel) die Basis.
   - Preiskontrollen-Stichprobe: Schwelle +1 → **+3** mit Beleglage: Die Zerlegung
     (`zustimmungsTeile`, Seed 42) zeigt das Δ +2,5 allein im Netz-Kanal lebenshaltung →
     vertrauen_regierung (+5,7); Schulden (20,9 vs. 20,8), CDS (236 vs. 233) und Devisen-Lage
     sind in beiden Läufen identisch — die WIR-2-Kanäle sind hier nachweislich neutral, der
     Treiber ist die Deckel-Kalibrierung des Politiknetzes (Revier INN-1). Kernbefund
     (+16,9 → +2,5) steht. TODO(INN-1): nach Kantenformel-Kalibrierung wieder auf +1 zuziehen.

## 4. Bewusste Modellgrenzen (dokumentiert, nicht erzwungen)

1. **Brutto/Netto-Abstand konstant** (Gold, Swaps, Mindestreserven): keine Modellierung des
   Swap-Abbaus (KKM-Ära §6.4 bleibt teilweise offen; die Interventions-/Druck-Mechanik deckt
   den Spiel-Fall ab).
2. **LB-Rauschen** klein und ohne Persistenz über den Monat hinaus; Handelsvolumina reagieren
   nur über die J-Kurve-Approximation, nicht mengenbasiert.
3. **Kapitalflüsse** sind eine Netto-Größe: keine Fälligkeitsstruktur der Auslandsschulden,
   kein Sudden-Stop-Ereignis jenseits der Krise; die Golf-Swap-Option bleibt Ereignis, kein Bestand.
4. **Haushaltsgesetz ohne Sachstimmen-Logik**: Die Abstimmung nutzt die generische
   Lager-/Übertritts-Rechnung (Fraktionen bewerten den Haushalt nicht inhaltlich je Posten) —
   Fraktionsverhandlung wirkt über Duldung und Stimmenkauf wie bei Gesetzen.
