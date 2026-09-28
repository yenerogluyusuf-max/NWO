// „Folgen im Voraus“: Richtung und Bandbreite statt genauer Zahlen
// (Spieldesign, Abschnitt 5). Das Modell rechnet die Zukunft mehrfach mit
// unterschiedlichem Zufall durch, einmal mit und einmal ohne die Handlung.

import type { World } from "./types";
import { advance } from "./world";

export type Metric = "inflation" | "growth" | "unemployment" | "usdTry";

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
    base.push(a.economy[metric]);

    const b = structuredClone(world);
    b.rngState = seedState;
    action(b);
    advance(b, days);
    acted.push(b.economy[metric]);
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
