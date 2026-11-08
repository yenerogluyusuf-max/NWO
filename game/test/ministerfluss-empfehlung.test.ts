// Empfehlung und Vorschau der Ministervorlagen: Ein Ausbau darf in der Vorschau nicht schlechter dastehen als Nichtstun,
// nur weil die neue Umsetzung beginnt (Fall „Haftvermeidung 58 → 78“: Überfüllung ohne 41,7, mit 47,6), und kein Minister
// empfiehlt, was laut eigener Vorschau die Leitgröße verschlechtert.

import { describe, expect, test } from "vitest";
import { advance, createWorld } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { schnellProfil, startAfterElection } from "../src/sim/prolog";
import { ministerVorlagen, nutzenVerdienst } from "../src/sim/ministerfluss";
import { nutzenVorschau } from "../src/sim/ministerfluss-vorschau";
import { NET } from "../src/sim/modell";
import { nationalAverage } from "../src/sim/netz";
import { starteUmsetzung, umsetzungMonat } from "../src/sim/umsetzung";
import type { NutzenZeile } from "../src/sim/ministerfluss-typen";
import type { World } from "../src/sim/types";

function welt(): World {
  const w = createWorld(turkey2026, 11);
  startAfterElection(w, schnellProfil());
  return w;
}

/** Eine Maßnahme schon früher ausgebaut und voll umgesetzt: Stufe sofort setzen, ohne laufende Rampe. */
function schonAusgebaut(w: World, id: string, stufe: number): void {
  const i = NET.index.get(id)!;
  const prov = w.net.weights.length;
  for (let p = 0; p < prov; p++) w.net.values[i * prov + p] = stufe;
  delete w.net.targets[id];
  if (w.net.umsetzung) delete w.net.umsetzung[id];
}

describe("Vorschau: eine neue Rampe dämpft nur die neue Änderung", () => {
  test("hoch ist schlecht: Haftvermeidung weiter ausbauen senkt die Überfüllung gegenüber Nichtstun", () => {
    const w = welt();
    schonAusgebaut(w, "m_haftvermeidung", 58);
    advance(w, 120);
    const [z] = nutzenVorschau(w, [{ id: "m_haftvermeidung", ziel: 78, ort: null }], ["haftueberfuellung"], 10);
    expect(z!.schlechtWennHoch).toBe(true);
    expect(z!.mit).toBeLessThan(z!.ohne);
    expect(z!.besser).toBe(true);
  });

  test("hoch ist gut: dieselbe Maßnahme hebt das Vertrauen in die Justiz nicht unter Nichtstun", () => {
    const w = welt();
    schonAusgebaut(w, "m_haftvermeidung", 58);
    advance(w, 120);
    const [z] = nutzenVorschau(w, [{ id: "m_haftvermeidung", ziel: 78, ort: null }], ["justizvertrauen"], 20);
    expect(z!.schlechtWennHoch).toBe(false);
    expect(z!.mit).toBeGreaterThanOrEqual(z!.ohne - 0.05);
  });

  test("Rampe: das schon Erreichte wirkt weiter, gedämpft wird nur der Zuwachs", () => {
    const w = welt();
    const id = "m_haftvermeidung";
    schonAusgebaut(w, id, 58);
    const i = NET.index.get(id)!;
    starteUmsetzung(NET, w.net, id, 20, 12);
    expect(w.net.umsetzung![id]).toBe(0);
    const basis = w.net.umsetzungBasis![id]!;
    expect(basis[0]).toBeCloseTo(58, 6);
    // Bis die Umsetzung fertig ist, bleibt die Bezugsstufe; danach räumt sich alles auf
    for (let m = 0; m < 13; m++) umsetzungMonat(w.net);
    expect(w.net.umsetzung?.[id]).toBeUndefined();
    expect(w.net.umsetzungBasis?.[id]).toBeUndefined();
    expect(nationalAverage(NET, w.net, id)).toBeCloseTo(w.net.values[i * w.net.weights.length]!, 0);
  });

  test("alte Stände ohne Bezugsstufe laufen wie bisher", () => {
    const w = welt();
    advance(w, 30);
    delete w.net.umsetzungBasis;
    expect(() => advance(w, 60)).not.toThrow();
  });
});

describe("Empfehlung", () => {
  const z = (besser: boolean | null): NutzenZeile => ({ id: "x", name: "x", art: "groesse", einheit: "von 100", jetzt: 50, ohne: 50, mit: 50, monate: 12, schlechtWennHoch: false, besser });

  test("die Leitgröße zählt doppelt", () => {
    expect(nutzenVerdienst([z(false), z(true)])).toBeLessThan(0.5);
    expect(nutzenVerdienst([z(true), z(false)])).toBeGreaterThan(0.5);
    expect(nutzenVerdienst([z(null)])).toBe(0.5);
  });

  test("keine empfohlene Maßnahme verschlechtert laut eigener Vorschau ihre Leitgröße", () => {
    const w = welt();
    let gezaehlt = 0;
    for (let m = 0; m < 4; m++) {
      advance(w, 30);
      w.spiel!.ereignisse = [];
      for (const v of ministerVorlagen(w, { tiefe: 12 })) {
        const o = v.optionen.find((x) => x.id === v.empfehlung?.optionId);
        if (!o || o.aktion.art !== "massnahme" || !o.nutzen?.length) continue;
        gezaehlt++;
        expect(o.nutzen[0]!.besser, `${v.titel}: ${o.label}`).not.toBe(false);
      }
    }
    expect(gezaehlt).toBeGreaterThan(0);
  }, 240_000);
});
