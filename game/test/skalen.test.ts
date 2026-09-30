// Jede Maßnahme hat eine passende Auswahl statt eines Prozentreglers.

import { describe, expect, test } from "vitest";
import { NET } from "../src/sim/modell";
import { skala, skalenArt, naechsteStufe } from "../src/data/skalen";

const MASSNAHMEN = NET.nodes.filter((n) => n.kind === "massnahme");

describe("Skalen", () => {
  test("Alle Maßnahmen haben eine Skala mit mindestens drei Stufen", () => {
    expect(MASSNAHMEN.length).toBe(103);
    for (const n of MASSNAHMEN) {
      const s = skala(n.id, n.start);
      expect(s.stufen.length, n.id).toBeGreaterThanOrEqual(3);
      expect(s.stufen.map((x) => x.w).sort((a, b) => a - b), n.id).toEqual(s.stufen.map((x) => x.w));
      for (const st of s.stufen) {
        expect(st.w).toBeGreaterThanOrEqual(0);
        expect(st.w).toBeLessThanOrEqual(100);
        expect(st.name.length).toBeGreaterThan(2);
      }
    }
  });

  test("Bei benannten Zuständen entspricht der Startwert einer Stufe", () => {
    for (const n of MASSNAHMEN) {
      if (skalenArt(n.id) !== "regime") continue;
      const s = skala(n.id, n.start);
      expect(naechsteStufe(s, n.start).genau, `${n.id} (${n.start})`).toBe(true);
    }
  });

  test("Sätze und Mengen bieten Schritte um den heutigen Stand", () => {
    const s = skala("m_mwst", 60);
    expect(s.art).toBe("satz");
    expect(s.stufen.map((x) => x.w)).toEqual([20, 40, 60, 80, 100]);
    const t = skala("m_krankenhausbau", 10);
    expect(t.art).toBe("menge");
    expect(t.stufen.map((x) => x.w)).toEqual([10, 30, 50]);
  });

  test("Namen von Maßnahmen mit Auswahl sind neutral (kein „Strenge …“)", () => {
    for (const n of MASSNAHMEN) if (skalenArt(n.id) === "regime") expect(n.name, n.id).not.toMatch(/^Strenge /);
  });
});
