// Replay-Harness für die Kalibrierungs-Lernfälle (WIR-1 aus VERBESSERUNGSPLAN_2026-09-30.md,
// Anleitung: kalibrierung/README.md). Fährt den Wirtschaftskern aus `src/sim/economy.ts`
// (Z1–Z9, Z4/Z8 täglich, Z2/Z3 monatlich) isoliert — ohne UI, ohne Politiknetz, ohne
// Spielschleife — mit den Startwerten des jeweiligen Stichtags aus
// `kalibrierung/zeitreihen_2018_2026.csv`.
//
// Modellgrenzen, die dieses Harness bewusst setzt (Details: kalibrierung/KALIBRIERUNG_LOG.md):
//
// 1. LEITZINS ALS VORGABE: Der Leitzins-Pfad kommt exogen aus der CSV (Monatswerte,
//    jeweils zum Monatsersten gesetzt). Keine Taylor-Regel reproduziert 2021
//    (Senkungsserie bei steigender Inflation) oder 2023 (Regime-Bruch mit +650 bp);
//    die Vorgabe isoliert den Kern Z1–Z9. Die Regel läuft als Diagnosegröße
//    (`regelzinsAusgewogen`) mit und wird separat geprüft.
// 2. DISKRETE MARKT-EREIGNISSE ALS SCHOCKS: Z4 (Wechselkurs) ist eine Diffusion und
//    kennt keine Runs, Sprünge oder Kursaufgaben. Lira-Stürze (11/2021), die Aufgabe
//    der Kursverteidigung (06/2023) und Overshoot-Rückläufe (09–10/2018) werden als
//    diskrete Schocks aus der Ereignis-CSV gesetzt — wie in kalibrierung/README.md
//    für 2023 gefordert („FX-Sprung als diskretes Ereignis statt Diffusion").
// 3. KANÄLE, DIE DAS MODELL NICHT HAT: Kredit-/Konfidenzkanal auf die Auslastung
//    (Z1 kennt kein riskPremium-Glied) wird als `nachfrage`-Schock über den
//    fiscalImpulse-Kanal gefahren; FX-Bewertungseffekte auf die Schuldenquote fehlen
//    komplett (Z7) — beides dokumentiert.
//
// Laufzeit: Tagesschritte, ca. 1.500 Ticks für alle drei Fälle zusammen — weit unter
// der 60-s-Schwelle, eine Verdichtung auf Wochenschritte ist nicht nötig.

import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { clamp, dailyDepreciation, dailyRiskPremium, monthlyUpdate, ppkZiel } from "../src/sim/economy";
import type { EconomyState, MonthlySnapshot } from "../src/sim/types";
import { Rng } from "../src/sim/rng";
import { addDays, dayOfMonth, monthOf, previousMonth } from "../src/sim/dates";

// ---------------------------------------------------------------------------
// CSV-Zugang (kalibrierung/ liegt neben game/). Der Pfad muss sowohl aus dem
// Quellbaum (scripts/, vitest) als auch aus dem gebündelten Skript (scripts/.build/)
// und vom Arbeitsverzeichnis game/ aus funktionieren.

function kalibrierungsPfad(datei: string): string {
  const kandidaten = [
    fileURLToPath(new URL(`../../kalibrierung/${datei}`, import.meta.url)),
    fileURLToPath(new URL(`../../../kalibrierung/${datei}`, import.meta.url)),
    `${process.cwd()}/../kalibrierung/${datei}`,
    `${process.cwd()}/kalibrierung/${datei}`,
  ];
  for (const p of kandidaten) if (existsSync(p)) return p;
  throw new Error(`kalibrierung/${datei} nicht gefunden (versucht: ${kandidaten.join(", ")})`);
}

export interface Zeitreihe {
  monat: string;
  tuefe?: number;
  tuefeEst?: boolean;
  leitzins?: number;
  usdtry?: number;
  cds?: number;
  bip?: number;
  alq?: number;
}

export interface Ereignis {
  datum: string;
  ereignis: string;
  kategorie: string;
  kurzbeschreibung: string;
}

/** Einfacher CSV-Feld-Splitter mit Anführungszeichen (keine eingebetteten Zeilenumbrüche im Bestand). */
function splitFelder(zeile: string): string[] {
  const out: string[] = [];
  let cur = "";
  let q = false;
  for (const ch of zeile) {
    if (q) {
      if (ch === '"') q = false;
      else cur += ch;
    } else if (ch === '"') q = true;
    else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

function zahl(x: string | undefined): number | undefined {
  if (x === undefined || x.trim() === "") return undefined;
  const v = Number(x);
  return Number.isFinite(v) ? v : undefined;
}

let zeitreihenCache: Map<string, Zeitreihe> | null = null;

export function ladeZeitreihen(pfad = kalibrierungsPfad("zeitreihen_2018_2026.csv")): Map<string, Zeitreihe> {
  if (zeitreihenCache && pfad.endsWith("zeitreihen_2018_2026.csv")) return zeitreihenCache;
  const zeilen = readFileSync(pfad, "utf-8").split(/\r?\n/).filter((l) => l.trim() !== "");
  const kopf = splitFelder(zeilen[0]!);
  const idx = (name: string) => kopf.indexOf(name);
  const map = new Map<string, Zeitreihe>();
  for (const zeile of zeilen.slice(1)) {
    const f = splitFelder(zeile);
    const monat = f[idx("monat")]!;
    map.set(monat, {
      monat,
      ...(zahl(f[idx("tuefe_yoy")]) !== undefined ? { tuefe: zahl(f[idx("tuefe_yoy")]) } : {}),
      ...(f[idx("tuefe_est")] !== undefined ? { tuefeEst: f[idx("tuefe_est")] === "true" } : {}),
      ...(zahl(f[idx("leitzins")]) !== undefined ? { leitzins: zahl(f[idx("leitzins")]) } : {}),
      ...(zahl(f[idx("usdtry")]) !== undefined ? { usdtry: zahl(f[idx("usdtry")]) } : {}),
      ...(zahl(f[idx("cds_5y")]) !== undefined ? { cds: zahl(f[idx("cds_5y")]) } : {}),
      ...(zahl(f[idx("bip_yoy_quartal")]) !== undefined ? { bip: zahl(f[idx("bip_yoy_quartal")]) } : {}),
      ...(zahl(f[idx("arbeitslosigkeit")]) !== undefined ? { alq: zahl(f[idx("arbeitslosigkeit")]) } : {}),
    });
  }
  if (pfad.endsWith("zeitreihen_2018_2026.csv")) zeitreihenCache = map;
  return map;
}

export function ladeEreignisse(pfad = kalibrierungsPfad("ereignisse_2018_2026.csv")): Ereignis[] {
  const zeilen = readFileSync(pfad, "utf-8").split(/\r?\n/).filter((l) => l.trim() !== "");
  return zeilen.slice(1).map((zeile) => {
    const f = splitFelder(zeile);
    return { datum: f[0]!, ereignis: f[1]!, kategorie: f[2]!, kurzbeschreibung: f[3] ?? "" };
  });
}

// ---------------------------------------------------------------------------
// Szenario-Definition

export type SchockArt = "fx" | "risiko" | "glaubwuerdigkeit" | "fiskal" | "nachfrage" | "costpush" | "inflation";

export interface Schock {
  /** Monat JJJJ-MM; wird zum Monatsersten angewendet */
  monat: string;
  art: SchockArt;
  /**
   * fx: multiplikativ auf USD/TRY und EUR/TRY (0,1 = +10 % Sprung).
   * risiko: Basispunkte einmalig auf den CDS (Ziehpunkt-Ziel bleibt, täglicher Rücklauf wie Z8).
   * glaubwuerdigkeit: additiv auf credibility (0–1).
   * fiskal/nachfrage: % des BIP je Jahr als fiscalImpulse für `monate` Monate
   *   (fiskal = Staatsausgaben; nachfrage = privater Nachfrageeinbruch über denselben Kanal — das
   *   Modell hat keinen Kreditkanal in Z1, daher diese Brücke; Wirkung auf Z7 ist bei `nachfrage`
   *   ein bekannter, kleiner Fehler).
   * costpush: Prozentpunkte auf costPush für `monate` Monate (Mindestlohn-/Steuer-Impulse).
   * inflation: Prozentpunkte einmalig auf die Inflation — diskretes Repricing-Ereignis, das das
   *   Monatsmodell nicht auflöst (12/2021: +13,5 % MoM nach dem Lira-Run; dieselbe Klasse wie der
   *   FX-Sprung, den kalibrierung/README.md als diskretes Ereignis fordert). Sparsam einsetzen.
   */
  wert: number;
  /** Dauer in Monaten für fiskal/nachfrage/costpush (Standard 1) */
  monate?: number;
  /** Textanker in der Ereignis-CSV (kurzbeschreibung oder ereignis) — Herkunftsnachweis */
  ereignis: string;
  notiz?: string;
}

export interface IndexPfad {
  monat: string;
  wert: number;
}

export interface Lernfall {
  id: string;
  titel: string;
  /** Stichtag JJJJ-MM: Der Anfangszustand sind die Monatsendwerte dieses Monats */
  startMonat: string;
  /** Simulierte Monate nach dem Stichtag */
  monate: number;
  seed: number;
  /** EUR/USD am Stichtag (für eurTry; spielt im Kern kaum eine Rolle) */
  eurUsd: number;
  /** Inflationserwartung am Stichtag (Umfrage-Anker, geschätzt) */
  erwartungStart: number;
  /** Glaubwürdigkeit am Stichtag (0–1, geschätzt) */
  glaubwuerdigkeitStart: number;
  /** Auslastung am Stichtag (Schätzung aus Wachstumsdynamik) */
  gapStart: number;
  /** Schuldenquote am Stichtag (externe Anker, nicht in der CSV) */
  schuldenStart: number;
  /** Laufendes Defizit in % des BIP (ohne Schocks) */
  defizit: number;
  /** Potenzialwachstum in % p. a. */
  potenzial: number;
  /** Monatswerte vor dem CSV-Fenster (z. B. 2017), geschätzt */
  historyExtras: Zeitreihe[];
  /** Schuldenquoten-Anker für die Vorgeschichte (linear interpoliert) */
  schuldenAnker: IndexPfad[];
  /** Außenwelt-Indizes (100 = Stand am Stichtag), Stufenfunktion */
  oel: IndexPfad[];
  weltzins: IndexPfad[];
  euNachfrage: IndexPfad[];
  schocks: Schock[];
}

export interface ReplayMonat {
  monat: string;
  inflation: number;
  leitzins: number;
  usdTry: number;
  cds: number;
  schuldenquote: number;
  alq: number;
  wachstum: number;
  erwartung: number;
  glaubwuerdigkeit: number;
  fxChange12: number;
  /** Diagnose: Zielzins der Taylor-Regel bei Haltung „ausgewogen" (ohne Vorgabe) */
  regelzinsAusgewogen: number;
}

// ---------------------------------------------------------------------------
// Replay

function indexAm(pfad: IndexPfad[], monat: string, basis = 100): number {
  let wert = basis;
  for (const p of pfad) if (p.monat <= monat) wert = p.wert;
  return wert;
}

function schuldenAm(anker: IndexPfad[], monat: string): number {
  const sortiert = [...anker].sort((a, b) => (a.monat < b.monat ? -1 : 1));
  let vor = sortiert[0]!;
  for (const a of sortiert) {
    if (a.monat > monat) {
      const spanne = Date.parse(a.monat + "-01T00:00:00Z") - Date.parse(vor.monat + "-01T00:00:00Z");
      const fort = Date.parse(monat + "-01T00:00:00Z") - Date.parse(vor.monat + "-01T00:00:00Z");
      return vor.wert + ((a.wert - vor.wert) * fort) / Math.max(1, spanne);
    }
    vor = a;
  }
  return vor.wert;
}

/** Wendet Rate-Vorgabe, Schocks und Außenindizes eines Monats an (zum Monatsersten). */
function monatsTreiber(fall: Lernfall, e: EconomyState, monat: string, zeile: Zeitreihe | undefined, aktiv: { art: SchockArt; wert: number; bis: string }[]): void {
  if (zeile?.leitzins !== undefined) e.policyRate = zeile.leitzins;
  for (const s of fall.schocks.filter((x) => x.monat === monat)) {
    if (s.art === "fx") {
      e.usdTry *= 1 + s.wert;
      e.eurTry *= 1 + s.wert;
    } else if (s.art === "risiko") {
      e.riskPremium = clamp(e.riskPremium + s.wert, 50, 2000);
    } else if (s.art === "glaubwuerdigkeit") {
      e.credibility = clamp(e.credibility + s.wert, 0.05, 0.95);
    } else if (s.art === "inflation") {
      e.inflation = Math.max(-2, e.inflation + s.wert);
    } else {
      const dauer = s.monate ?? 1;
      aktiv.push({ art: s.art, wert: s.wert, bis: nextMonth(monat, dauer) });
    }
  }
  for (let i = aktiv.length - 1; i >= 0; i--) if (aktiv[i]!.bis < monat) aktiv.splice(i, 1);
  e.fiscalImpulse = aktiv.filter((a) => a.art === "fiskal" || a.art === "nachfrage").reduce((s, a) => s + a.wert, 0);
  e.costPush = aktiv.filter((a) => a.art === "costpush").reduce((s, a) => s + a.wert, 0);
  e.oel = indexAm(fall.oel, monat);
  e.weltzins = indexAm(fall.weltzins, monat);
  e.euNachfrage = indexAm(fall.euNachfrage, monat);
}

/**
 * Fährt einen Lernfall vom Stichtag an tageweise. Spiegelt die Schleife aus
 * `world.tick` ohne Spielschleife/Politiknetz: täglich Z4/Z8, monatlich Z1–Z9,
 * danach Vorgabe/Schocks/Indizes des neuen Monats.
 */
export function replay(fall: Lernfall, serien: Map<string, Zeitreihe> = ladeZeitreihen()): ReplayMonat[] {
  const S = fall.startMonat;
  const zeile = (m: string): Zeitreihe | undefined => serien.get(m) ?? fall.historyExtras.find((x) => x.monat === m);
  const start = zeile(S);
  if (!start?.tuefe || !start.leitzins || !start.usdtry || !start.cds || !start.bip || !start.alq) {
    throw new Error(`Lernfall ${fall.id}: Stichtag ${S} hat fehlende CSV-Werte`);
  }

  const e = {
    policyRate: start.leitzins,
    inflation: start.tuefe,
    expectedInflation: fall.erwartungStart,
    inflationTarget: 5,
    credibility: fall.glaubwuerdigkeitStart,
    outputGap: fall.gapStart,
    potentialGrowth: fall.potenzial,
    growth: start.bip,
    unemployment: start.alq,
    usdTry: start.usdtry,
    eurTry: start.usdtry * fall.eurUsd,
    riskPremium: start.cds,
    debtRatio: fall.schuldenStart,
    deficit: fall.defizit,
    fiscalImpulse: 0,
    fxChange12: 0,
    policyCost: 0,
    costPush: 0,
    potentialShift: 0,
    zinsMehrlast: 0,
    oel: indexAm(fall.oel, S),
    euNachfrage: indexAm(fall.euNachfrage, S),
    weltzins: indexAm(fall.weltzins, S),
  } as EconomyState;

  // Zwölf Monate Vorgeschichte aus der CSV (S-11 bis S), Lücken aus historyExtras.
  // Die Auslastung wird wie in world.syntheticHistory aus dem Wachstum rückgerechnet
  // und linear verteilt; der Realzins der Vorgeschichte ist ex post (Zins − TÜFE).
  const gap12 = fall.gapStart - (start.bip - fall.potenzial);
  const history: MonthlySnapshot[] = [];
  for (let k = 11; k >= 0; k--) {
    const m = previousMonth(S, k);
    const z = zeile(m);
    if (!z?.tuefe || !z.leitzins || !z.usdtry || !z.cds || !z.bip || !z.alq) {
      throw new Error(`Lernfall ${fall.id}: Vorgeschichte ${m} unvollständig`);
    }
    const share = (11 - k) / 11;
    // Ex-ante-Proxy für die Erwartung der Vorgeschichte (30 % Ziel + 70 % Spot):
    // ex post (Zins − TÜFE) läge der Realzins 2022 bei −70 und flutete Z1 mit Dauerstimulus
    const erwartungProxy = 0.3 * 5 + 0.7 * z.tuefe;
    history.push({
      month: m,
      inflation: z.tuefe,
      growth: z.bip,
      unemployment: z.alq,
      outputGap: gap12 + share * (fall.gapStart - gap12),
      realRate: z.leitzins - erwartungProxy,
      usdTry: z.usdtry,
      eurTry: z.usdtry * fall.eurUsd,
      policyRate: z.leitzins,
      riskPremium: z.cds,
      debtRatio: schuldenAm(fall.schuldenAnker, m),
    });
  }
  e.fxChange12 = (e.usdTry / history[0]!.usdTry - 1) * 100;

  const rng = new Rng(fall.seed);
  const aktiv: { art: SchockArt; wert: number; bis: string }[] = [];
  const reihe: ReplayMonat[] = [];
  const protokoll = (monat: string): void => {
    reihe.push({
      monat,
      inflation: e.inflation,
      leitzins: e.policyRate,
      usdTry: e.usdTry,
      cds: e.riskPremium,
      schuldenquote: e.debtRatio,
      alq: e.unemployment,
      wachstum: e.growth,
      erwartung: e.expectedInflation,
      glaubwuerdigkeit: e.credibility,
      fxChange12: e.fxChange12,
      regelzinsAusgewogen: ppkZiel(e, "ausgewogen"),
    });
  };

  protokoll(S);
  // Treiber des ersten Simulationsmonats greifen vor dem ersten Tagestick
  const ersterMonat = nextMonth(S);
  monatsTreiber(fall, e, ersterMonat, zeile(ersterMonat), aktiv);

  const ende = `${nextMonth(S, fall.monate + 1)}-01`;
  let date = `${ersterMonat}-01`;
  while (date < ende) {
    date = addDays(date, 1);
    const dep = dailyDepreciation(e, rng);
    e.usdTry *= 1 + dep;
    e.eurTry *= 1 + dep + rng.normal(0.002);
    e.riskPremium = clamp(dailyRiskPremium(e, rng), 50, 2000);
    if (dayOfMonth(date) === 1) {
      monthlyUpdate(e, history, rng);
      const abgelaufen = previousMonth(monthOf(date));
      history.push({
        month: abgelaufen,
        inflation: e.inflation,
        growth: e.growth,
        unemployment: e.unemployment,
        outputGap: e.outputGap,
        realRate: e.policyRate - e.expectedInflation,
        usdTry: e.usdTry,
        eurTry: e.eurTry,
        policyRate: e.policyRate,
        riskPremium: e.riskPremium,
        debtRatio: e.debtRatio,
      });
      protokoll(abgelaufen);
      monatsTreiber(fall, e, monthOf(date), zeile(monthOf(date)), aktiv);
    }
  }
  return reihe;
}

/** Monat JJJJ-MM um `ahead` Monate vorgerechnet (previousMonth aus dates.ts kann nur zurück). */
export function nextMonth(month: string, ahead = 1): string {
  let y = Number(month.slice(0, 4));
  let m = Number(month.slice(5, 7)) + ahead;
  while (m > 12) {
    m -= 12;
    y += 1;
  }
  return `${y}-${String(m).padStart(2, "0")}`;
}

/** Hilfe: Monatsliste JJJJ-MM von..bis (inklusive), für Fenster-Assertions. */
export function monatsFenster(von: string, bis: string): string[] {
  const out: string[] = [];
  let m = von;
  while (m <= bis) {
    out.push(m);
    m = nextMonth(m);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Die drei Lernfälle (Startwerte und Pfade: kalibrierung/zeitreihen_2018_2026.csv;
// Schocks: kalibrierung/ereignisse_2018_2026.csv; Analyse: KALIBRIERUNG_LOG.md)

export const LERNFALL_2019: Lernfall = {
  id: "2019",
  titel: "Rezession und späte Straffung",
  startMonat: "2018-08",
  monate: 18,
  seed: 201808,
  eurUsd: 1.16,
  erwartungStart: 17,
  glaubwuerdigkeitStart: 0.35,
  gapStart: -1,
  schuldenStart: 30.4,
  defizit: 3.8,
  potenzial: 4.5,
  // 2017 liegt vor dem CSV-Fenster; Anker aus der Standardreihe (geschätzt)
  historyExtras: [
    { monat: "2017-09", tuefe: 11.2, leitzins: 12.75, usdtry: 3.5, cds: 165, bip: 11.3, alq: 10.6 },
    { monat: "2017-10", tuefe: 11.9, leitzins: 12.75, usdtry: 3.75, cds: 160, bip: 7.4, alq: 10.3 },
    { monat: "2017-11", tuefe: 12.98, leitzins: 12.75, usdtry: 3.95, cds: 185, bip: 7.4, alq: 10.3 },
    { monat: "2017-12", tuefe: 11.92, leitzins: 12.75, usdtry: 3.79, cds: 175, bip: 7.4, alq: 10.4 },
  ],
  schuldenAnker: [
    { monat: "2017-09", wert: 28.3 },
    { monat: "2018-08", wert: 30.4 },
    { monat: "2019-12", wert: 32.6 },
    { monat: "2020-02", wert: 33.5 },
  ],
  // Brent: ~75 USD am Stichtag; Oktober-Spitze 86, Q4-Einbruch auf ~55, 2019 ~60-65
  oel: [
    { monat: "2018-09", wert: 105 },
    { monat: "2018-11", wert: 112 },
    { monat: "2019-01", wert: 78 },
    { monat: "2019-05", wert: 92 },
    { monat: "2019-09", wert: 85 },
  ],
  // Fed: Straffung bis 12/2018 (FF 2,5), dann Pivot und drei Schnitte 2019 (FF 1,75)
  weltzins: [
    { monat: "2018-09", wert: 105 },
    { monat: "2018-12", wert: 115 },
    { monat: "2019-04", wert: 95 },
    { monat: "2019-08", wert: 80 },
    { monat: "2019-11", wert: 80 },
  ],
  euNachfrage: [{ monat: "2019-03", wert: 96 }],
  schocks: [
    // Overshoot-Rücklauf nach Brunson-Freilassung und 625-bp-Schritt (Z4 hat keine Umkehr)
    { monat: "2018-09", art: "fx", wert: -0.14, ereignis: "TCMB hebt Leitzins auf 24 %", notiz: "Rücklauf 6,92 → ~6,0 (CSV 2018-09: 6,06)" },
    { monat: "2018-10", art: "fx", wert: -0.06, ereignis: "Pastor Brunson freigelassen", notiz: "Richtung 5,6 (CSV 2018-10)" },
    // Kredit- und Konfidenzschock der Krise: Z1 kennt keinen Risikokanal, Brücke über fiscalImpulse
    { monat: "2018-09", art: "nachfrage", wert: -4.0, monate: 10, ereignis: "Lira-Crash nach US-Stahlzöllen", notiz: "Kreditkanal-Proxy für die Rezession Q4/2018–Q2/2019 (Kreditvolumen brach zweistellig ein)" },
    // Politische Risikophase um die Kommunalwahlen (CDS blieb 2019 erhöht, obwohl die Inflation fiel)
    { monat: "2019-03", art: "risiko", wert: 80, ereignis: "Kommunalwahlen", notiz: "Istanbul-Annullierung, S-400-Streit: CDS-Prämie blieb erhöht" },
    { monat: "2019-05", art: "risiko", wert: 60, ereignis: "Wiederholungswahl Istanbul", notiz: "CDS-Spitze 470 (05/2019)" },
    { monat: "2019-10", art: "risiko", wert: 40, ereignis: "Friedensquelle", notiz: "US-Sanktionsdrohungen" },
  ],
};

export const LERNFALL_2021: Lernfall = {
  id: "2021",
  titel: "Zinsstreit und Lira-Sturz",
  startMonat: "2021-03",
  monate: 15,
  seed: 202103,
  eurUsd: 1.19,
  erwartungStart: 15,
  glaubwuerdigkeitStart: 0.3,
  gapStart: 2.5,
  schuldenStart: 40.5,
  defizit: 3.5,
  potenzial: 4.5,
  historyExtras: [],
  schuldenAnker: [
    { monat: "2020-03", wert: 33.5 },
    { monat: "2021-03", wert: 40.5 },
    { monat: "2022-06", wert: 40.0 },
  ],
  // Energiepreis-Index (Brent + regulierte Tarife: Strom/Gas stiegen 2022 schneller als Brent)
  oel: [
    { monat: "2021-10", wert: 125 },
    { monat: "2022-02", wert: 150 },
    { monat: "2022-03", wert: 195 },
    { monat: "2022-06", wert: 205 },
  ],
  // Fed: Taper ab 11/2021, Liftoff 03/2022, UST 10J 1,6 → 3,4
  weltzins: [
    { monat: "2021-11", wert: 115 },
    { monat: "2022-01", wert: 130 },
    { monat: "2022-03", wert: 155 },
    { monat: "2022-05", wert: 185 },
  ],
  euNachfrage: [{ monat: "2022-03", wert: 96 }],
  schocks: [
    // Glaubwürdigkeitsverlust je Senkung unter die Regel (ersetzt die umgangene zinssitzung-Mechanik:
    // abw < 0 kostet dort je Punkt 0,02 credibility; vier Schnitte Sep–Dez ≈ 5 Punkte unter der Regel)
    { monat: "2021-09", art: "glaubwuerdigkeit", wert: -0.04, ereignis: "Zinssenkung trotz 19,6 % Inflation", notiz: "1. Schnitt unter die Regel" },
    { monat: "2021-10", art: "glaubwuerdigkeit", wert: -0.05, ereignis: "Zinssenkung trotz 19,6 % Inflation", notiz: "2. Schnitt (−2 Punkte)" },
    { monat: "2021-11", art: "glaubwuerdigkeit", wert: -0.03, ereignis: "Leitzins 15 %; Lira im freien Fall", notiz: "3./4. Schnitt" },
    // Lira im freien Fall nach den Schnitten 09–11/2021 (9,6 → 13,4; Z4-Diffusion kann keinen Run)
    { monat: "2021-11", art: "fx", wert: 0.48, ereignis: "Leitzins 15 %; Lira im freien Fall", notiz: "11/2021: +39 % im Monat, Run auf die Lira" },
    // KKM stoppt den Run (20.12.); die Prämien sprangen vorher hoch
    { monat: "2021-11", art: "risiko", wert: 260, ereignis: "Leitzins 15 %; Lira im freien Fall", notiz: "CDS 350 → 520 um den Lira-Run" },
    { monat: "2021-12", art: "risiko", wert: 140, ereignis: "KKM eingeführt", notiz: "KKM-Chaoswoche (Intraday 18,4)" },
    // Dezember-Repricing: Der Einzelhandel schlug die Abwertung binnen Wochen auf die Preise um
    // (+13,5 % MoM, größter Monatsdruck seit Jahrzehnten) — das Monatsmodell löst das nicht auf;
    // diskretes Ereignis derselben Klasse wie der FX-Sprung (README-Prüfstein 2023)
    { monat: "2021-12", art: "inflation", wert: 10, ereignis: "Leitzins 15 %; Lira im freien Fall", notiz: "Repricing-Welle 1 nach dem Lira-Run (real: +13,5 % MoM)" },
    { monat: "2022-01", art: "inflation", wert: 11.5, ereignis: "KKM eingeführt", notiz: "Repricing-Welle 2 (real: +11,1 % MoM)" },
    // Mindestlohn +50 % zum 01/2022 und Energiepreise als Kostenschub
    { monat: "2022-01", art: "costpush", wert: 4.5, monate: 4, ereignis: "Mindestlohn", notiz: "Mindestlohn 2.826 → 4.253 TL (+50 %)" },
    // Regulierte Energietarife (Strom +50–127 % zu Jahresbeginn, weitere Schritte im Frühjahr)
    { monat: "2022-04", art: "costpush", wert: 2.0, monate: 3, ereignis: "Russland überfällt die Ukraine", notiz: "Energiepreisschock, regulierte Tarife" },
    // April-Repricing: +7,25 % MoM — zweite Tarifwelle und Ukraine-Effekte schlagen durch
    { monat: "2022-04", art: "inflation", wert: 4.0, ereignis: "Russland überfällt die Ukraine", notiz: "April-Repricing (real: +7,25 % MoM)" },
    // Kreditimpuls (KKM + KGF): hielt die Realwirtschaft 2022 trotz Negativzinsen heiß
    { monat: "2022-01", art: "nachfrage", wert: 2.8, monate: 6, ereignis: "KKM eingeführt", notiz: "Kreditboom H1/2022 (KKM-Subvention, KGF: TL-Kredite +50 % jahresweise); hält ALQ-Pfad fallend" },
    { monat: "2022-02", art: "risiko", wert: 90, ereignis: "Russland überfällt die Ukraine", notiz: "Globale Risikoaversion" },
    { monat: "2022-04", art: "risiko", wert: 85, ereignis: "CDS-Allzeithoch 908 bp", notiz: "Lauf zum Allzeithoch (07/2022): Negativzins + Reservenverluste" },
  ],
};

export const LERNFALL_2023: Lernfall = {
  id: "2023",
  titel: "Erdbeben, Wahl und Kurswechsel",
  startMonat: "2023-01",
  monate: 18,
  seed: 202301,
  eurUsd: 1.07,
  erwartungStart: 30,
  glaubwuerdigkeitStart: 0.12,
  gapStart: -0.5,
  schuldenStart: 31.5,
  defizit: 2.9,
  potenzial: 4.5,
  historyExtras: [],
  schuldenAnker: [
    { monat: "2022-01", wert: 40.0 },
    { monat: "2023-01", wert: 31.5 },
    { monat: "2024-06", wert: 28.5 },
  ],
  // Brent: ~82 → ~72–75 (H1/2023) → ~95 (09/2023, OPEC) → ~85
  oel: [
    { monat: "2023-04", wert: 90 },
    { monat: "2023-09", wert: 120 },
    { monat: "2024-01", wert: 105 },
  ],
  // Fed: FF 4,5 → 5,5 (07/2023), UST 10J 3,5 → 4,9 (10/2023) → 4,3
  weltzins: [
    { monat: "2023-07", wert: 120 },
    { monat: "2023-10", wert: 135 },
    { monat: "2024-01", wert: 118 },
    { monat: "2024-06", wert: 115 },
  ],
  euNachfrage: [{ monat: "2023-06", wert: 97 }],
  schocks: [
    // Kursverteidigung vor der Wahl: Die TCMB verkaufte ~50 Mrd. USD Reserven, um die Lira
    // zu halten (18,8–20,5 statt Marktpreis) — als kleine Gegenschocks abgebildet
    { monat: "2023-03", art: "fx", wert: -0.03, ereignis: "Erdbeben Kahramanmaraş", notiz: "Kursverteidigung mit Reserven (März)" },
    { monat: "2023-04", art: "fx", wert: -0.03, ereignis: "Erdbeben Kahramanmaraş", notiz: "Kursverteidigung mit Reserven (April)" },
    // Mindestlohn +100 % zum 01/2023 (8.507 TL) als Kostenschub, wirkt ab Februar
    { monat: "2023-02", art: "costpush", wert: 1.5, monate: 3, ereignis: "Mindestlohn", notiz: "Mindestlohn 5.500 → 8.507 TL (+100 % gegenüber 01/2022-Reihe)" },
    // Erdbeben: Wiederaufbau ~2,5 % des BIP je Jahr über den Simulationshorizont
    { monat: "2023-03", art: "fiskal", wert: 1.0, monate: 15, ereignis: "Erdbeben Kahramanmaraş", notiz: "Defizit-Effekt des Wiederaufbaus (2023: ~5,4 % statt ~2,9 % des BIP)" },
    // Risikoaufschlag vor der Wahl (CDS 540 → 700)
    { monat: "2023-05", art: "risiko", wert: 260, ereignis: "Parlaments-/Präsidentschaftswahl, 1. Runde", notiz: "CDS-Spitze 700 bp vor der Stichwahl" },
    // Aufgabe der Kursverteidigung nach der Wahl: diskreter FX-Sprung statt Diffusion (README-Prüfstein)
    { monat: "2023-06", art: "fx", wert: 0.22, ereignis: "Lira bricht nach der Wahl ein", notiz: "20,5 → 26,0 (CSV 06/2023); Rest Diffusion" },
    // Erkan/Şimşek: orthodoxe Wende — Glaubwürdigkeits- und Risiko-Sprung (Regime-Bruch, README-Prüfstein)
    { monat: "2023-06", art: "glaubwuerdigkeit", wert: 0.16, ereignis: "Erkan Gouverneurin; Şimşek Finanzminister", notiz: "Regime-Bruch; credibility-Sprung" },
    { monat: "2023-06", art: "risiko", wert: -90, ereignis: "Erkan Gouverneurin; Şimşek Finanzminister", notiz: "CDS-Rückgang nach der Wende" },
    // Mindestlohn +34 % zum 07/2023 (11.402 TL)
    { monat: "2023-07", art: "costpush", wert: 3.5, monate: 5, ereignis: "Mindestlohn", notiz: "Mindestlohn 8.507 → 11.402 TL (+34 %)" },
    // Steuerpaket nach der Wahl: KDV 18→20 %, ÖTV auf Kraftstoffe verdoppelt
    { monat: "2023-08", art: "costpush", wert: 1.5, monate: 3, ereignis: "Parlaments-/Präsidentschaftswahl, 1. Runde", notiz: "KDV-/ÖTV-Erhöhungen 07/2023 (Wahlrechnung)" },
    // Juli/August-Repricing: +9,5 % bzw. +9,1 % MoM — Mindestlohn, Steuerpaket und Lira-Sprung
    // schlugen binnen Wochen auf die Preise durch (diskret, wie 12/2021; Monatsmodell löst das nicht auf)
    { monat: "2023-07", art: "inflation", wert: 4.3, ereignis: "Mindestlohn", notiz: "Juli-Repricing (real: +9,5 % MoM)" },
    { monat: "2023-08", art: "inflation", wert: 8.0, ereignis: "Parlaments-/Präsidentschaftswahl, 1. Runde", notiz: "August-Repricing (real: +9,1 % MoM, stärkster August-Druck der Reihe)" },
    // Mindestlohn +49 % zum 01/2024 (17.002 TL) — treibt den Wiederanstieg zum 75-%-Gipfel
    { monat: "2024-01", art: "costpush", wert: 5.0, monate: 5, ereignis: "Mindestlohn", notiz: "Mindestlohn 11.402 → 17.002 TL (+49 %) + Indexierung" },
    // Januar-Repricing: +6,7 % MoM — Mindestlohn +49 % und Indexierung schlagen binnen Wochen durch
    { monat: "2024-01", art: "inflation", wert: 6.5, ereignis: "Mindestlohn", notiz: "Januar-Repricing (real: +6,7 % MoM)" },
    // Straffung geliefert: CDS fällt 480 → 365 (11/2023, verifiziert)
    { monat: "2023-11", art: "risiko", wert: -60, ereignis: "Leitzins 25 %", notiz: "Straffungszyklus läuft, CDS-Rückgang 480 → 365" },
    // Glaubwürdigkeitsanker: Die Straffung wird geliefert (45 % im 01/, 50 % im 03/2024),
    // Karahan betont Kontinuität — Erwartungen stabilisieren sich trotz steigender Spot-Inflation
    { monat: "2024-03", art: "glaubwuerdigkeit", wert: 0.15, ereignis: "Leitzins 50 %", notiz: "Karahan-Kontinuität, Straffung geliefert" },
    // Dezinflationspfad und Reservenaufbau: CDS fällt Richtung 250 (06/2024)
    { monat: "2024-05", art: "risiko", wert: -55, ereignis: "Leitzins 50 %", notiz: "Risikoprämie fällt mit gelieferter Straffung (CDS 265, 06/2024)" },
    // KKM-Abbau und Reservenaufbau stabilisieren die Lira im H1/2024 (gemanagter Crawl —
    // Z4 treibt mit Erwartungsinflation sonst über das Band hinaus)
    { monat: "2024-06", art: "fx", wert: -0.03, ereignis: "Leitzins 50 %", notiz: "Reale Stabilisierung: KKM-Abbau, Reservenaufbau" },
  ],
};

export const LERNFAELLE: Lernfall[] = [LERNFALL_2019, LERNFALL_2021, LERNFALL_2023];
