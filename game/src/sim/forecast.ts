// „Folgen im Voraus“: Richtung und Bandbreite statt genauer Zahlen
// (Spieldesign, Abschnitt 5). Das Modell rechnet die Zukunft mehrfach mit
// unterschiedlichem Zufall durch, einmal mit und einmal ohne die Handlung.

import type { GovernorStance, World } from "./types";
import type { Unabhaengigkeit } from "./wirtschaft-typen";
import { advance, NET, criticizeCentralBank, replaceGovernor, setFiscalImpulse, setPolicy } from "./world";
import { nationalAverage } from "./netz";
import { wertIn } from "./wirkung";
import { defizitJetzt, zbZustand, zinsausgabenJetzt } from "./wirtschaft";
import { ernenneGouverneur, machDruck, setzeVorgabe, wendeStufeAn } from "./zentralbank";
import { setzePosten, wendePaketAn } from "./haushalt";

/**
 * Eine Handlung als Daten, damit die Vorschau in einem Web Worker rechnen kann
 * (Funktionen lassen sich nicht zwischen Threads schicken).
 */
export type Aktion =
  | { art: "massnahme"; id: string; stufe: number; provinzen?: number[] | null }
  | { art: "haushalt"; impuls: number }
  | { art: "kritik" }
  | { art: "zentralbank" }
  | { art: "zinsdruck"; richtung: -1 | 1; weg: "gespraech" | "rede" }
  | { art: "zinsvorgabe"; zins: number }
  | { art: "stufe"; ziel: Unabhaengigkeit }
  | { art: "gouverneur"; haltung: GovernorStance }
  | { art: "posten"; id: string; stufe: number }
  | { art: "paket"; id: string };

export function fuehreAus(w: World, a: Aktion): void {
  switch (a.art) {
    case "massnahme":
      setPolicy(w, a.id, a.stufe, a.provinzen);
      break;
    case "haushalt":
      setFiscalImpulse(w, w.economy.fiscalImpulse + a.impuls);
      break;
    case "kritik":
      criticizeCentralBank(w);
      break;
    case "zentralbank":
      replaceGovernor(w, "gefuegig", "eine neue, regierungsnahe Führung");
      break;
    // Die Vorschau prüft nicht, ob Kapital, Mehrheit oder Abkühlzeit es heute erlauben: Sie zeigt, was der Weg bewirkte
    case "zinsdruck":
      if (w.spiel) {
        w.spiel.kapital = Math.max(w.spiel.kapital, 50);
        delete zbZustand(w).gespraech;
        machDruck(w, a.richtung, a.weg);
      }
      break;
    case "zinsvorgabe":
      if (w.spiel) {
        if (zbZustand(w).stufe !== "C") wendeStufeAn(w, "C");
        setzeVorgabe(w, a.zins);
      }
      break;
    case "stufe":
      if (w.spiel) {
        const z = zbZustand(w);
        // stufenweise: A und C sind nur über B erreichbar
        if (z.stufe !== "B" && a.ziel !== "B") wendeStufeAn(w, "B");
        wendeStufeAn(w, a.ziel);
      }
      break;
    case "gouverneur":
      if (w.spiel) {
        delete zbZustand(w).gouverneurGeaendert;
        ernenneGouverneur(w, a.haltung);
      }
      break;
    case "posten":
      if (w.spiel) setzePosten(w, a.id, a.stufe, true);
      break;
    case "paket":
      wendePaketAn(w, a.id);
      break;
  }
}

/** Eine Größe des Wirtschaftsmodells oder ein Knoten des Politiknetzes („net:<id>“). */
/** Größen des Wirtschaftsmodells, Knoten im Landesdurchschnitt („net:<id>“) oder in einzelnen Provinzen („netin:<id>:<Kennziffern>“). */
export type Metric =
  | "inflation"
  | "growth"
  | "unemployment"
  | "usdTry"
  | "eurTry"
  | "policyRate"
  | "expectedInflation"
  | "riskPremium"
  | "debtRatio"
  | "defizit"
  | "zinsausgaben"
  | `net:${string}`
  | `netin:${string}`;

export function metricValue(world: World, metric: Metric): number {
  if (metric.startsWith("netin:")) {
    const [, id, liste] = metric.split(":");
    return wertIn(world, id!, liste!.split(",").map(Number));
  }
  if (metric.startsWith("net:")) return nationalAverage(NET, world.net, metric.slice(4));
  if (metric === "defizit") return defizitJetzt(world);
  if (metric === "zinsausgaben") return zinsausgabenJetzt(world);
  return world.economy[metric as "inflation"];
}

export interface Range {
  low: number;
  mid: number;
  high: number;
}

export interface Outlook {
  metric: Metric;
  months: number;
  withoutAction: Range;
  withAction: Range;
  /** Differenz der Mediane: Richtung der Wirkung */
  effect: number;
  direction: "hoeher" | "niedriger" | "unklar";
}

export function outlook(
  world: World,
  action: (w: World) => void,
  metric: Metric,
  months = 12,
  runs = 24,
): Outlook {
  const days = months * 30;
  const base: number[] = [];
  const acted: number[] = [];
  for (let i = 0; i < runs; i++) {
    const seedState = (world.rngState ^ Math.imul(i + 1, 0x9e3779b1)) | 0;
    const a = structuredClone(world);
    a.rngState = seedState;
    advance(a, days);
    base.push(metricValue(a, metric));

    const b = structuredClone(world);
    b.rngState = seedState;
    action(b);
    advance(b, days);
    acted.push(metricValue(b, metric));
  }
  const withoutAction = range(base);
  const withAction = range(acted);
  const effect = withAction.mid - withoutAction.mid;
  const spread = (withAction.high - withAction.low) / 2;
  const direction = Math.abs(effect) < spread * 0.25 ? "unklar" : effect > 0 ? "hoeher" : "niedriger";
  return { metric, months, withoutAction, withAction, effect, direction };
}

function range(values: number[]): Range {
  const s = [...values].sort((x, y) => x - y);
  const q = (p: number) => s[Math.min(s.length - 1, Math.floor(p * (s.length - 1)))] ?? NaN;
  return { low: q(0.1), mid: q(0.5), high: q(0.9) };
}

/** Mehrere Größen aus denselben Läufen: spart Rechenzeit in der Oberfläche. */
export function outlookMany(
  world: World,
  aktion: Aktion | ((w: World) => void),
  metrics: Metric[],
  months = 12,
  runs = 12,
): Outlook[] {
  const action = typeof aktion === "function" ? aktion : (w: World) => fuehreAus(w, aktion);
  return outlookManyFn(world, action, metrics, months, runs);
}

function outlookManyFn(
  world: World,
  action: (w: World) => void,
  metrics: Metric[],
  months = 12,
  runs = 12,
): Outlook[] {
  const days = months * 30;
  const base: number[][] = metrics.map(() => []);
  const acted: number[][] = metrics.map(() => []);
  for (let i = 0; i < runs; i++) {
    const seedState = (world.rngState ^ Math.imul(i + 1, 0x9e3779b1)) | 0;
    const a = structuredClone(world);
    a.rngState = seedState;
    advance(a, days);
    const b = structuredClone(world);
    b.rngState = seedState;
    action(b);
    advance(b, days);
    metrics.forEach((m, k) => {
      base[k]!.push(metricValue(a, m));
      acted[k]!.push(metricValue(b, m));
    });
  }
  return metrics.map((metric, k) => {
    const withoutAction = range(base[k]!);
    const withAction = range(acted[k]!);
    const effect = withAction.mid - withoutAction.mid;
    const spread = Math.max((withAction.high - withAction.low) / 2, 0.5);
    const direction = Math.abs(effect) < spread * 0.25 ? "unklar" : effect > 0 ? "hoeher" : "niedriger";
    return { metric, months, withoutAction, withAction, effect, direction };
  });
}


// ---------------------------------------------------------------------------
// Verlauf der Prognose: Band aus Zufallsläufen, Monat für Monat

export interface Band {
  low: number;
  mid: number;
  high: number;
}

export interface PrognoseReihe {
  metric: Metric;
  monate: number;
  /** Ohne die Handlung; Index 0 = nach einem Monat */
  ohne: Band[];
  /** Mit der Handlung; leer, wenn es keine gibt */
  mit: Band[];
}

/** Die Prognose als Band je Monat, einmal ohne und einmal mit einer Handlung: Grundlage der Diagramme der Wirtschaftsakte. */
export function prognoseReihen(
  world: World,
  aktion: Aktion | null,
  metrics: Metric[],
  months = 12,
  runs = 10,
): PrognoseReihe[] {
  const ohne: number[][][] = metrics.map(() => Array.from({ length: months }, () => []));
  const mit: number[][][] = metrics.map(() => Array.from({ length: months }, () => []));
  for (let i = 0; i < runs; i++) {
    const seedState = (world.rngState ^ Math.imul(i + 1, 0x9e3779b1)) | 0;
    const a = structuredClone(world);
    a.rngState = seedState;
    const b = aktion ? structuredClone(world) : null;
    if (b) {
      b.rngState = seedState;
      fuehreAus(b, aktion!);
    }
    for (let m = 0; m < months; m++) {
      advance(a, 30);
      if (b) advance(b, 30);
      metrics.forEach((metric, k) => {
        ohne[k]![m]!.push(metricValue(a, metric));
        if (b) mit[k]![m]!.push(metricValue(b, metric));
      });
    }
  }
  const bandVon = (werte: number[]): Band => {
    const r = range(werte);
    return { low: r.low, mid: r.mid, high: r.high };
  };
  return metrics.map((metric, k) => ({
    metric,
    monate: months,
    ohne: ohne[k]!.map(bandVon),
    mit: aktion ? mit[k]!.map(bandVon) : [],
  }));
}
