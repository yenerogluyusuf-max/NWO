// Jede Maßnahme hat eine passende Auswahl statt eines Prozentreglers.

import { describe, expect, test } from "vitest";
import { NET } from "../src/sim/modell";
import { echteHalte, naechsteStufe, rasteStufe, satzBei, skala, skalenArt, stufenName } from "../src/data/skalen";

const MASSNAHMEN = NET.nodes.filter((n) => n.kind === "massnahme");

describe("Skalen", () => {
  test("Alle Maßnahmen haben eine Skala mit mindestens drei Stufen", () => {
    expect(MASSNAHMEN.length).toBe(117); // 103 + 10 Energie + 4 Katastrophenschutz-Maßnahmen
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

  // N3 (06.11.2026, Befund B-2): Echte Sätze in ganzen Prozentpunkten zwischen echten Grenzen; beide Ansichten lesen dieselbe Liste.
  test("Echte Sätze gehen in ganzen Punkten; Tafel und Maßnahmenblatt lesen dieselbe Liste", () => {
    const s = skala("m_mwst", 60);
    expect(s.art).toBe("satz");
    expect(s.stufen.map((x) => stufenName("m_mwst", x.w))).toEqual(["18 %", "19 %", "20 %", "21 %", "22 %"]);
    const halte = echteHalte("m_mwst").map((h) => h.satz);
    expect(halte[0]).toBe(15);
    expect(halte.at(-1)).toBe(27);
    for (const st of s.stufen) expect(echteHalte("m_mwst").some((h) => h.w === st.w)).toBe(true);
    expect(echteHalte("m_einkommensteuer").map((h) => h.satz)).toEqual(Array.from({ length: 21 }, (_, i) => 30 + i));
    expect(stufenName("m_einkommensteuer", 50)).toBe("Spitzensatz 40 %");
    expect(echteHalte("m_koerperschaftsteuer").map((h) => h.satz)).toEqual(Array.from({ length: 21 }, (_, i) => 15 + i));
    // Ein Wert zwischen zwei Sätzen und einer jenseits der Grenze landen auf dem nächsten ganzen Satz in der Spanne
    expect(satzBei("m_mwst", rasteStufe("m_mwst", 63))).toBe(21);
    expect(satzBei("m_mwst", rasteStufe("m_mwst", 0))).toBe(15);
    expect(rasteStufe("m_krankenhausbau", 37)).toBe(37);
  });

  test("Mengen bieten Schritte um den heutigen Stand", () => {
    const t = skala("m_krankenhausbau", 10);
    expect(t.art).toBe("menge");
    expect(t.stufen.map((x) => x.w)).toEqual([10, 30, 50]);
  });

  test("Namen von Maßnahmen mit Auswahl sind neutral (kein „Strenge …“)", () => {
    for (const n of MASSNAHMEN) if (skalenArt(n.id) === "regime") expect(n.name, n.id).not.toMatch(/^Strenge /);
  });
});
