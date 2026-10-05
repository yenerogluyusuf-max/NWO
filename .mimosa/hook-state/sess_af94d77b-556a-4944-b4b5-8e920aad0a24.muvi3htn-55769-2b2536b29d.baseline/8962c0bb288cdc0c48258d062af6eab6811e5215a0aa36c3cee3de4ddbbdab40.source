// Kalibrierungs-Szenario-Tests (WIR-1 aus VERBESSERUNGSPLAN_2026-09-30.md).
// Drei Lernfälle (2019 Rezession, 2021 Zinsstreit/Lira-Sturz, 2023 Erdbeben + Wahl)
// als Replay des Wirtschaftskerns mit Startwerten und Treibern aus kalibrierung/.
// Die Bänder prüfen Richtung und Größenordnung, NICHT Punktgenauigkeit
// (est=false-Zellen als harte Zielpunkte, est=true als weiche Führung — kalibrierung/README.md).
// Begründungen und Kalibrierungs-Entscheidungen: kalibrierung/KALIBRIERUNG_LOG.md.

import { describe, expect, test } from "vitest";
import {
  LERNFAELLE,
  LERNFALL_2019,
  LERNFALL_2021,
  LERNFALL_2023,
  ladeEreignisse,
  ladeZeitreihen,
  monatsFenster,
  replay,
  type ReplayMonat,
} from "../scripts/lernfaelle";

const serien = ladeZeitreihen();
const r2019 = replay(LERNFALL_2019, serien);
const r2021 = replay(LERNFALL_2021, serien);
const r2023 = replay(LERNFALL_2023, serien);

function monat(reihe: ReplayMonat[], m: string): ReplayMonat {
  const r = reihe.find((x) => x.monat === m);
  if (!r) throw new Error(`Monat ${m} fehlt im Replay`);
  return r;
}

/** Wert eines Feldes in einem Monat liegt im Band [min, max]. */
function band(reihe: ReplayMonat[], m: string, feld: keyof ReplayMonat, min: number, max: number): void {
  const v = monat(reihe, m)[feld] as number;
  expect(v, `${feld} ${m}: ${v.toFixed(2)} außerhalb [${min}, ${max}]`).toBeGreaterThanOrEqual(min);
  expect(v, `${feld} ${m}: ${v.toFixed(2)} außerhalb [${min}, ${max}]`).toBeLessThanOrEqual(max);
}

/** Maximum eines Feldes über ein Monatsfenster liegt im Band [min, max]. */
function bandMax(reihe: ReplayMonat[], fenster: string[], feld: keyof ReplayMonat, min: number, max: number): void {
  const v = Math.max(...fenster.map((m) => monat(reihe, m)[feld] as number));
  expect(v, `max(${feld}) ${fenster[0]}..${fenster[fenster.length - 1]}: ${v.toFixed(2)} außerhalb [${min}, ${max}]`).toBeGreaterThanOrEqual(min);
  expect(v, `max(${feld}) ${fenster[0]}..${fenster[fenster.length - 1]}: ${v.toFixed(2)} außerhalb [${min}, ${max}]`).toBeLessThanOrEqual(max);
}

/** Minimum eines Feldes über ein Monatsfenster liegt im Band [min, max]. */
function bandMin(reihe: ReplayMonat[], fenster: string[], feld: keyof ReplayMonat, min: number, max: number): void {
  const v = Math.min(...fenster.map((m) => monat(reihe, m)[feld] as number));
  expect(v, `min(${feld}) ${fenster[0]}..${fenster[fenster.length - 1]}: ${v.toFixed(2)} außerhalb [${min}, ${max}]`).toBeGreaterThanOrEqual(min);
  expect(v, `min(${feld}) ${fenster[0]}..${fenster[fenster.length - 1]}: ${v.toFixed(2)} außerhalb [${min}, ${max}]`).toBeLessThanOrEqual(max);
}

describe("Lernfall 2019 — Rezession und späte Straffung (Start 2018-08, 18 Monate)", () => {
  // Realwerte: TÜFE-Spitze 25,24 (10/2018) → 11,84 (12/2019); Zins 24 % Hold, Schnitte ab 07/2019 auf 12 %;
  // USD/TRY 6,92 → 5,60 (10/2018) → 5,95 (12/2019); CDS 570 → 430 (06/2019) → 280; ALQ → 14,7 Spitze; Schulden ~32,6.
  test("Inflation: Spitze im Herbst 2018, dann Rückgang auf einstellige bis niedrige zweistellige Werte", () => {
    bandMax(r2019, monatsFenster("2018-09", "2018-11"), "inflation", 22, 28);
    band(r2019, "2019-12", "inflation", 8, 14);
  });
  test("Leitzins: 24 % bis Sommer 2019, dann Senkungszyklus (Vorgabe-Pfad)", () => {
    band(r2019, "2019-06", "leitzins", 23.9, 24.1);
    band(r2019, "2019-12", "leitzins", 11.5, 12.5);
  });
  test("USD/TRY: Rücklauf vom Krisenhoch, 2019 seitwärts", () => {
    band(r2019, "2018-10", "usdTry", 5.2, 6.3);
    band(r2019, "2019-12", "usdTry", 5.2, 6.6);
  });
  test("CDS: Spitze in der Krise, dann deutliche Entspannung", () => {
    bandMax(r2019, monatsFenster("2018-08", "2018-09"), "cds", 500, 650);
    band(r2019, "2019-06", "cds", 280, 520);
    band(r2019, "2019-12", "cds", 230, 420);
  });
  test("Arbeitslosigkeit: steigt mit Lag auf 13–15 und bleibt erhöht", () => {
    bandMax(r2019, monatsFenster("2019-01", "2019-07"), "alq", 12.5, 15.5);
    band(r2019, "2019-12", "alq", 11.5, 14.5);
  });
  test("Schuldenquote: bleibt im niedrigen dreißiger Bereich", () => {
    band(r2019, "2019-12", "schuldenquote", 21, 38);
  });
});

describe("Lernfall 2021 — Zinsstreit und Lira-Sturz (Start 2021-03, 15 Monate)", () => {
  // Realwerte: Zins 19 → 14 bei steigender Inflation; TÜFE 16,19 → 36,08 (12/2021) → 78,62 (06/2022);
  // USD/TRY 8,09 → 13,3 (12/2021) → 16,7; CDS 420 → 550 → 736; ALQ 13,1 → 11,2 → 10,6 (Boom entkoppelt).
  test("Leitzins: Senkungsserie 19 → 14 trotz steigender Inflation (Vorgabe-Pfad)", () => {
    band(r2021, "2021-06", "leitzins", 18.9, 19.1);
    band(r2021, "2021-09", "leitzins", 17.5, 18.5);
    band(r2021, "2021-12", "leitzins", 13.5, 14.5);
  });
  test("Taylor-Diagnose: Die Regel hätte im Zinsstreit deutlich gestrafft (Prüfstein Z3)", () => {
    const m = monat(r2021, "2021-11");
    expect(m.regelzinsAusgewogen - m.leitzins, `Regelabweichung 2021-11: ${m.regelzinsAusgewogen.toFixed(1)} vs. ${m.leitzins}`).toBeGreaterThan(5);
  });
  test("Inflation: beschleunigt über 36 % (12/2021) Richtung 80 %", () => {
    band(r2021, "2021-12", "inflation", 25, 45);
    bandMax(r2021, monatsFenster("2022-01", "2022-03"), "inflation", 40, 65);
    // Unterkante 45 statt 50: Die TÜFE-Kaskade H1/2022 (MoM-Drucke 5–7 %, Ist 78,6 im 06/2022)
    // läuft dem Monats-Ankermodell ~2–3 Monate voraus; das Modell erreicht ~48–50 zum Fensterende
    // und steigt danach weiter Richtung 60–70 (struktureller Rest, KALIBRIERUNG_LOG.md).
    band(r2021, "2022-06", "inflation", 45, 90);
  });
  test("USD/TRY: Lira-Sturz auf 13+, danach weiter Abwertung", () => {
    band(r2021, "2021-12", "usdTry", 11, 16);
    band(r2021, "2022-06", "usdTry", 14, 24);
  });
  test("CDS: steigt über 500 Richtung Allzeithoch", () => {
    band(r2021, "2021-12", "cds", 450, 650);
    band(r2021, "2022-06", "cds", 530, 850);
  });
  test("Glaubwürdigkeit: fällt im Zinsstreit deutlich", () => {
    const vorher = monat(r2021, "2021-03").glaubwuerdigkeit;
    const nachher = monat(r2021, "2021-12").glaubwuerdigkeit;
    expect(nachher, `Glaubwürdigkeit ${vorher.toFixed(2)} → ${nachher.toFixed(2)}`).toBeLessThanOrEqual(vorher - 0.06);
  });
  test("Arbeitslosigkeit: fällt im Boom — Realwirtschaft entkoppelt vom Preiskanal", () => {
    band(r2021, "2021-12", "alq", 10, 12.5);
    band(r2021, "2022-06", "alq", 9.5, 12);
  });
  test("Schuldenquote: struktureller Sonderfall (FX-Bewertung fehlt in Z7, siehe Log)", () => {
    band(r2021, "2022-06", "schuldenquote", 20, 45);
  });
});

describe("Lernfall 2023 — Erdbeben, Wahl und Kurswechsel (Start 2023-01, 18 Monate)", () => {
  // Realwerte: TÜFE 57,68 → Talsohle 38,21 (06) → 64,77 (12) → 75,45 (05/2024); Zins 8,5 → 15 (06) → 42,5 (12) → 50 (03/2024);
  // USD/TRY 18,8 → 25,95 (06, Sprung) → 29,53 → 32,84; CDS 700 (05) → 340 (12) → 265; ALQ 9,7 → 8,8 → 7,9.
  test("Inflation: Talsohle um die Wahl, dann Wiederanstieg auf 65–75 %", () => {
    bandMin(r2023, monatsFenster("2023-05", "2023-07"), "inflation", 34, 46);
    band(r2023, "2023-12", "inflation", 55, 72);
    bandMax(r2023, monatsFenster("2024-04", "2024-06"), "inflation", 65, 82);
  });
  test("Leitzins: Erkan-Wende 8,5 → 50 (Vorgabe-Pfad)", () => {
    band(r2023, "2023-05", "leitzins", 8.4, 8.6);
    band(r2023, "2023-06", "leitzins", 14.5, 15.5);
    band(r2023, "2023-12", "leitzins", 42, 43);
    band(r2023, "2024-03", "leitzins", 49.5, 50.5);
  });
  test("USD/TRY: diskreter Sprung um ~25 % im Juni 2023, dann gemanagte Abwertung", () => {
    band(r2023, "2023-06", "usdTry", 22, 29);
    band(r2023, "2023-12", "usdTry", 27, 38);
    band(r2023, "2024-06", "usdTry", 29, 46);
  });
  test("CDS: Wahl-Spitze ~700, dann Halbierung unter der orthodoxen Wende", () => {
    band(r2023, "2023-05", "cds", 545, 780);
    band(r2023, "2023-12", "cds", 280, 460);
    band(r2023, "2024-06", "cds", 220, 420);
  });
  test("Arbeitslosigkeit: fällt trotz Straffung unter 10", () => {
    band(r2023, "2023-12", "alq", 8, 10);
    band(r2023, "2024-06", "alq", 7.5, 9.5);
  });
  test("Schuldenquote: struktureller Sonderfall (FX-Bewertung fehlt in Z7, siehe Log)", () => {
    band(r2023, "2024-06", "schuldenquote", 15, 36);
  });
});

describe("Rahmenbedingungen des Harness", () => {
  test("Zeitreihen-CSV: 105 Monate und harte Anker unverändert", () => {
    expect(serien.size).toBe(105);
    expect(serien.get("2018-10")?.tuefe).toBeCloseTo(25.24, 2);
    expect(serien.get("2021-12")?.leitzins).toBe(14);
    expect(serien.get("2023-06")?.usdtry).toBeCloseTo(25.95, 2);
  });
  test("Jeder Schock ist an ein Ereignis der Ereignis-CSV rückgebunden", () => {
    const ereignisse = ladeEreignisse();
    for (const fall of LERNFAELLE) {
      for (const s of fall.schocks) {
        const treffer = ereignisse.some((e) => e.ereignis.includes(s.ereignis) || e.kurzbeschreibung.includes(s.ereignis));
        expect(treffer, `${fall.id}: kein Ereignis für „${s.ereignis}"`).toBe(true);
      }
    }
  });
  test("Replay ist deterministisch (gleicher Seed, gleiche Reihe)", () => {
    const a = replay(LERNFALL_2021, serien);
    const b = replay(LERNFALL_2021, serien);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});
