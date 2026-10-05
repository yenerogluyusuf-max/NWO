// Vom Problem zur Lösung: Vorschläge sind berechnet, wechseln mit der Lage und sind einbringbar.

import { describe, expect, test } from "vitest";
import { advance, createWorld } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { startAfterElection, schnellProfil } from "../src/sim/prolog";
import { akuteProbleme, vorschlaege } from "../src/sim/vorschlaege";
import { bringeEin } from "../src/sim/handeln";
import { forderungVon } from "../src/sim/fraktionen";
import { NET } from "../src/sim/modell";
import { nationalAverage } from "../src/sim/netz";

function neu(seed = 3) {
  const w = createWorld(turkey2026, seed);
  startAfterElection(w, schnellProfil());
  w.spiel!.ereignisse = [];
  return w;
}

describe("Problemlöser", () => {
  test("Zu jedem akuten Problem gibt es konkrete Vorhaben mit Kosten und Ort", () => {
    const w = neu();
    expect(akuteProbleme(w).length).toBeGreaterThan(0);
    const vs = vorschlaege(w, 6);
    expect(vs.length).toBeGreaterThanOrEqual(3);
    for (const v of vs) {
      expect(NET.index.has(v.massnahme)).toBe(true);
      expect(v.pk).toBeGreaterThan(0);
      expect(Math.abs(v.ziel - v.stufeJetzt)).toBeGreaterThanOrEqual(5);
      expect(v.grund).toMatch(/akut/);
      expect(v.ort === null || v.ort.length > 0).toBe(true);
    }
  });

  test("Ein eingebrachtes Vorhaben verschwindet aus der Liste, die Liste bleibt gefüllt", () => {
    const w = neu();
    const erste = vorschlaege(w, 5)[0]!;
    expect(bringeEin(w, erste.massnahme, erste.ziel, erste.ort, "gesetz").ok).toBe(true);
    const danach = vorschlaege(w, 5);
    expect(danach.some((v) => v.massnahme === erste.massnahme)).toBe(false);
    expect(danach.length).toBeGreaterThanOrEqual(3);
    advance(w, 40);
    expect(vorschlaege(w, 5).some((v) => v.massnahme === erste.massnahme)).toBe(false); // wird umgesetzt
  });

  test("Über Jahre schlägt das Spiel verschiedene Vorhaben vor, nicht immer dieselben", () => {
    const w = neu();
    const gesehen = new Set<string>();
    for (let runde = 0; runde < 10; runde++) {
      const vs = vorschlaege(w, 5);
      for (const v of vs) gesehen.add(v.massnahme);
      const v = vs[0];
      if (v) bringeEin(w, v.massnahme, v.ziel, v.ort, "gesetz");
      w.spiel!.kapital = 80;
      w.spiel!.ereignisse = [];
      advance(w, 45);
    }
    expect(gesehen.size).toBeGreaterThanOrEqual(8);
  });

  test("Mietpreisbremse und Preiskontrollen werden nur bis zur Grenze vorgeschlagen", () => {
    const w = neu();
    for (const v of vorschlaege(w, 30)) if (v.massnahme === "m_mietdeckel" || v.massnahme === "m_preiskontrollen") expect(v.ziel).toBeLessThanOrEqual(55);
  });
});

describe("Forderungen der Fraktionen wechseln", () => {
  test("Eine Forderung bleibt zunächst stehen und wird nach der Frist durch eine andere ersetzt", () => {
    const w = neu();
    const partei = Object.keys(w.parliament!.seats).find((p) => p !== w.player!.partei.kurz)!;
    const a = forderungVon(w, partei);
    expect(forderungVon(w, partei).massnahme).toBe(a.massnahme);
    w.day += 300;
    const b = forderungVon(w, partei);
    expect(b.massnahme).not.toBe(a.massnahme);
  });

  test("Ist die Forderung erfüllt (Stufe 90), wechselt sie sofort", () => {
    const w = neu();
    const partei = Object.keys(w.parliament!.seats).find((p) => p !== w.player!.partei.kurz)!;
    const a = forderungVon(w, partei);
    const i = NET.index.get(a.massnahme)!;
    for (let p = 0; p < 81; p++) w.net.values[i * 81 + p] = 95;
    expect(nationalAverage(NET, w.net, a.massnahme)).toBeGreaterThan(90);
    expect(forderungVon(w, partei).massnahme).not.toBe(a.massnahme);
  });
});
