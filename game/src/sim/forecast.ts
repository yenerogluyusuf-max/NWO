// „Folgen im Voraus“: Richtung und Bandbreite statt genauer Zahlen
// (Spieldesign, Abschnitt 5). Das Modell rechnet die Zukunft mehrfach mit
// unterschiedlichem Zufall durch, einmal mit und einmal ohne die Handlung.

import type { World } from "./types";
import { advance, NET } from "./world";
import { nationalAverage } from "./netz";

/** Eine Größe des Wirtschaftsmodells oder ein Knoten des Politiknetzes („net:<id>“). */
export type Metric = "inflation" | "growth" | "unemployment" | "usdTry" | `net:${string}`;

export function metricValue(world: World, metric: Metric): number {
  if (metric.startsWith("net:")) return nationalAverage(NET, world.net, metric.slice(4));
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
