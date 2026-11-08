// Karten-Animationen: Jahreszeit, Tinten-Animation (Warteschlange, Auswahl über Detailstufen) und Bewegungswerte der Kamera.

import { describe, expect, it } from "vitest";
import { effektFuer, jahreszeit, tagImJahr } from "../src/ui/atlas/jahreszeit";
import { animiereBesitzerwechsel, feinsteStufe, gemeinteFlaechen, huelle, setzeTintenSenke, tintenWartend, uebertrageUeberStufen, type TintenAuftrag } from "../src/ui/atlas/tinte";
import type { KFlaeche, KRing, KStufe } from "../src/ui/atlas/daten";

function quadrat(u0: number, v0: number, u1: number, v1: number, besitzer: number): KFlaeche {
  const uv = new Float32Array([u0, v0, u1, v0, u1, v1, u0, v1]);
  const ring: KRing = { uv, xyz: new Float32Array(12), n: 4, bb: [u0, v0, u1, v1] };
  return { besitzer, ringe: [ring], bb: [u0, v0, u1, v1] };
}

function stufe(fl: KFlaeche[], anzahl = 4): KStufe {
  const porBesitzer: KFlaeche[][] = Array.from({ length: anzahl }, () => []);
  for (const f of fl) porBesitzer[f.besitzer]!.push(f);
  return { flaechen: fl, porBesitzer, bogen: [] };
}

describe("Jahreszeit", () => {
  it("zählt Tage im Jahr", () => {
    expect(tagImJahr("2030-01-01")).toBe(1);
    expect(tagImJahr("2030-12-31")).toBe(365);
    expect(tagImJahr("2032-12-31")).toBe(366);
    expect(tagImJahr("kein Datum")).toBe(182);
  });
  it("Winter im Januar, Sommer im Juli, Frühling im April", () => {
    const jan = jahreszeit("2030-01-15");
    const jul = jahreszeit("2030-07-15");
    const apr = jahreszeit("2030-04-28");
    expect(jan.winter).toBeGreaterThan(0.9);
    expect(jul.winter).toBe(0);
    expect(jan.waerme).toBeLessThan(-0.95);
    expect(jul.waerme).toBeGreaterThan(0.95);
    expect(apr.fruehling).toBeGreaterThan(0.9);
    expect(jan.fruehling).toBeLessThan(0.1);
    expect(apr.winter).toBe(0);
  });
  it("Effektstufen schalten Zusätze zu", () => {
    const aus = effektFuer("aus", "2030-01-15");
    expect(aus).toMatchObject({ stufe: 0, winter: 0, fruehling: 0, waerme: 0, wolken: 0 });
    const mittel = effektFuer("mittel", "2030-01-15");
    expect(mittel.stufe).toBe(1);
    expect(mittel.winter).toBeGreaterThan(0.9);
    expect(mittel.wolken).toBe(0);
    expect(mittel.waerme).toBe(0);
    const hoch = effektFuer("hoch", "2030-07-15");
    expect(hoch.stufe).toBe(2);
    expect(hoch.wolken).toBe(1);
    expect(hoch.waerme).toBeGreaterThan(0.9);
  });
});

describe("Tinten-Animation: Auswahl und Übertrag", () => {
  const fein = () => stufe([quadrat(0.0, 0.0, 0.2, 0.2, 1), quadrat(0.5, 0.5, 0.7, 0.7, 1), quadrat(0.8, 0.8, 0.9, 0.9, 3)]);
  const grob = () => stufe([quadrat(0.01, 0.01, 0.19, 0.19, 1), quadrat(0.52, 0.52, 0.68, 0.68, 1), quadrat(0.82, 0.82, 0.88, 0.88, 3)]);

  it("findet die feinste geladene Stufe", () => {
    expect(feinsteStufe([null, null, null])).toBe(-1);
    expect(feinsteStufe([grob(), null, null])).toBe(0);
    expect(feinsteStufe([grob(), fein(), null])).toBe(1);
  });

  it("wählt die gemeinten Flächen nach Platz in der Liste des alten Besitzers", () => {
    const f = fein();
    const g = gemeinteFlaechen(f, 1, [1, 7]);
    expect(g).toHaveLength(1);
    expect(g[0]!.bb[0]).toBe(0.5);
  });

  it("überträgt in allen Stufen dieselbe Region und lässt den Rest", () => {
    const st = [grob(), fein()];
    const n = uebertrageUeberStufen(st, 1, 2, [0]);
    expect(n).toBe(1);
    expect(st[1]!.porBesitzer[1]).toHaveLength(1);
    expect(st[1]!.porBesitzer[2]).toHaveLength(1);
    expect(st[1]!.porBesitzer[2]![0]!.besitzer).toBe(2);
    // die grobe Stufe: die Fläche im Bereich 0 bis 0,2 wechselt, die andere nicht
    expect(st[0]!.porBesitzer[2]).toHaveLength(1);
    expect(st[0]!.porBesitzer[2]![0]!.bb[0]).toBeCloseTo(0.01, 5);
    expect(st[0]!.porBesitzer[1]).toHaveLength(1);
    // fremde Besitzer bleiben unberührt
    expect(st[0]!.porBesitzer[3]).toHaveLength(1);
  });

  it("tut nichts bei falschen Nummern oder gleichem Besitzer", () => {
    const st = [grob(), fein()];
    expect(uebertrageUeberStufen(st, 1, 2, [9])).toBe(0);
    expect(uebertrageUeberStufen(st, 1, 1, [0])).toBe(0);
    expect(st[1]!.porBesitzer[1]).toHaveLength(2);
  });

  it("berechnet die Hülle der Flächen (Radius in Texturbreiten, Höhe mit Seitenverhältnis)", () => {
    const h = huelle([quadrat(0.1, 0.1, 0.3, 0.3, 1)]);
    expect(h.u).toBeCloseTo(0.2, 6);
    expect(h.v).toBeCloseTo(0.2, 6);
    expect(h.r).toBeCloseTo(Math.hypot(0.2, 0.2) / 2, 6);
    const breit = huelle([quadrat(0.1, 0.1, 0.3, 0.3, 1)], 2);
    expect(breit.r).toBeLessThan(h.r);
    expect(huelle([]).r).toBe(0);
  });
});

describe("Tinten-Animation: Programmierschnittstelle", () => {
  it("wartet auf eine Karte und spielt dann ab; mit Karte sofort", async () => {
    setzeTintenSenke(null);
    const erhalten: TintenAuftrag[] = [];
    const p = animiereBesitzerwechsel([0, 2], 5, 6, { dauerMs: 100 });
    expect(tintenWartend()).toBe(1);
    setzeTintenSenke({
      starte: (a) => {
        erhalten.push(a);
        return Promise.resolve();
      },
    });
    await p;
    expect(tintenWartend()).toBe(0);
    expect(erhalten).toHaveLength(1);
    expect(erhalten[0]).toMatchObject({ von: 5, nach: 6, dauerMs: 100 });
    expect(erhalten[0]!.flaechenIds).toEqual([0, 2]);
    await animiereBesitzerwechsel([1], 6, 7);
    expect(erhalten).toHaveLength(2);
    setzeTintenSenke(null);
  });
});
