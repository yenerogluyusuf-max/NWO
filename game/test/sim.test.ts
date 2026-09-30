import { describe, expect, test } from "vitest";
import { advance, createWorld, load, replaceGovernor, save, setFiscalImpulse } from "../src/sim/world";
import { outlook } from "../src/sim/forecast";
import { turkey2026 } from "../src/sim/scenario";
import type { World } from "../src/sim/types";

const SEEDS = [1, 2, 3, 4, 5, 6, 7, 8];

function mean(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

/** Mittelwert einer Größe nach `days` Tagen über mehrere Zufallsläufe. */
function averageAfter(days: number, metric: keyof World["economy"], setup?: (w: World) => void): number {
  return mean(
    SEEDS.map((seed) => {
      const w = createWorld(turkey2026, seed);
      setup?.(w);
      advance(w, days);
      return w.economy[metric] as number;
    }),
  );
}

describe("Reproduzierbarkeit (M1)", () => {
  test("gleicher Seed ergibt denselben Verlauf", () => {
    const a = createWorld(turkey2026, 42);
    const b = createWorld(turkey2026, 42);
    advance(a, 400);
    advance(b, 400);
    expect(save(a)).toEqual(save(b));
  });

  test("Speichern und Laden setzt den Verlauf exakt fort", () => {
    const straight = createWorld(turkey2026, 7);
    advance(straight, 500);

    const interrupted = createWorld(turkey2026, 7);
    advance(interrupted, 173);
    const resumed = load(save(interrupted));
    advance(resumed, 500 - 173);

    expect(save(resumed)).toEqual(save(straight));
  });
});

describe("Stilisierte Fakten (Wirtschaftsmodell, Abschnitt 7)", () => {
  test("eine gefügige Zentralbankführung bringt nach zwei Jahren mehr Inflation und eine schwächere Lira", () => {
    const dovish = (w: World) => replaceGovernor(w, "gefuegig", "Test");
    expect(averageAfter(730, "inflation", dovish)).toBeGreaterThan(averageAfter(730, "inflation") + 3);
    expect(averageAfter(730, "usdTry", dovish)).toBeGreaterThan(averageAfter(730, "usdTry") * 1.1);
  });

  test("der Eingriff lässt die Lira sofort fallen", () => {
    const w = createWorld(turkey2026, 3);
    const before = w.economy.usdTry;
    replaceGovernor(w, "gefuegig", "Test");
    expect(w.economy.usdTry).toBeGreaterThan(before);
  });

  test("mehr Staatsausgaben erhöhen zuerst das Wachstum und später die Inflation", () => {
    const spend = (w: World) => setFiscalImpulse(w, 3);
    expect(averageAfter(365, "growth", spend)).toBeGreaterThan(averageAfter(365, "growth"));
    expect(averageAfter(900, "inflation", spend)).toBeGreaterThan(averageAfter(900, "inflation"));
  });

  test("ohne Eingriff sinkt die Inflation über fünf Jahre", () => {
    expect(averageAfter(5 * 365, "inflation")).toBeLessThan(turkey2026.economy.inflation.value - 10);
  });
});

describe("Plausibilität", () => {
  test("zehn Jahre bleiben in plausiblen Grenzen, auch nach Eingriffen", () => {
    for (const seed of SEEDS) {
      for (const setup of [undefined, (w: World) => replaceGovernor(w, "gefuegig", "Test")]) {
        const w = createWorld(turkey2026, seed);
        setup?.(w);
        for (let year = 0; year < 10; year++) {
          advance(w, 365);
          const e = w.economy;
          for (const v of Object.values(e)) expect(Number.isFinite(v)).toBe(true);
          expect(e.inflation).toBeGreaterThan(-5);
          expect(e.inflation).toBeLessThan(250);
          expect(e.unemployment).toBeGreaterThanOrEqual(3);
          expect(e.unemployment).toBeLessThanOrEqual(30);
          expect(e.policyRate).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });
});

describe("Veröffentlichungen mit Verzögerung", () => {
  test("die Inflation des Vormonats erscheint am 3. des Folgemonats", () => {
    const w = createWorld(turkey2026, 11);
    while (!(w.date.endsWith("-03") && w.day > 0)) advance(w, 1);
    const snap = w.history[w.history.length - 1]!;
    expect(w.published.inflation.publishedOn).toBe(w.date);
    expect(w.published.inflation.period).toBe(snap.month);
    expect(w.published.inflation.value).toBe(snap.inflation);
  });
});

describe("Folgen im Voraus", () => {
  test("die Vorschau zeigt für eine gefügige Führung eher höhere Inflation", () => {
    const w = createWorld(turkey2026, 5);
    const o = outlook(w, (x) => replaceGovernor(x, "gefuegig", "Test"), "inflation", 24, 12);
    expect(o.direction).toBe("hoeher");
    expect(o.withAction.low).toBeLessThanOrEqual(o.withAction.mid);
    expect(o.withAction.mid).toBeLessThanOrEqual(o.withAction.high);
  });

  test("die Vorschau verändert den Spielstand nicht", () => {
    const w = createWorld(turkey2026, 5);
    const before = save(w);
    outlook(w, (x) => setFiscalImpulse(x, 2), "growth", 12, 6);
    expect(save(w)).toEqual(before);
  });
});
