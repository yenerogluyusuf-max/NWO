// Das Tagesbriefing: Kennzahlen, Fälliges, Warnungen, Empfehlungen und Termine kommen aus dem Weltzustand und führen zu Entscheidungen.

import { describe, expect, test } from "vitest";
import { advance, createWorld } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { startAfterElection, schnellProfil } from "../src/sim/prolog";
import { NET } from "../src/sim/modell";
import { bringeEin } from "../src/sim/handeln";
import { oeffne, vorlage } from "../src/sim/ereignisse";
import { verhandle } from "../src/sim/verhandeln";
import { Rng } from "../src/sim/rng";
import { KALENDER, briefing, empfehlungen, faellig, kennzahlen, tageBisMonat, termine, warnungen, type Knopf, type Ziel } from "../src/ui/schreibtisch/briefing";
import type { World } from "../src/sim/types";

function welt(seed = 6): World {
  const w = createWorld(turkey2026, seed);
  startAfterElection(w, schnellProfil());
  w.spiel!.ereignisse = [];
  w.spiel!.kapital = 60;
  return w;
}

function pruefeZiel(z: Ziel, wo: string) {
  if (z.art === "politik" && z.massnahme) expect(NET.index.has(z.massnahme.id), `${wo}: ${z.massnahme.id}`).toBe(true);
  if (z.art === "politik" && z.theme) expect(NET.nodes.some((n) => n.theme === z.theme), `${wo}: ${z.theme}`).toBe(true);
}
function pruefeKnopf(k: Knopf, wo: string) {
  expect(k.label.length, wo).toBeGreaterThan(2);
  if (k.art === "gehe") pruefeZiel(k.ziel, wo);
}

describe("Tagesbriefing", () => {
  test("Sechs Kennzahlen mit endlichen Werten, alle führen zu einer Akte", () => {
    const w = welt();
    const k = kennzahlen(w);
    expect(k.map((x) => x.id)).toEqual(["zustimmung", "kapital", "mehrheit", "preise", "arbeit", "probleme"]);
    for (const x of k) {
      expect(x.wert, x.id).not.toMatch(/NaN|undefined|Infinity/);
      expect(x.zusatz, x.id).not.toMatch(/NaN|undefined|Infinity/);
      pruefeZiel(x.ziel, x.id);
    }
  });

  test("Das Briefing eines frischen Spiels ist vollständig und ohne kaputte Zahlen", () => {
    const w = welt();
    const b = briefing(w);
    expect(b.datum).toMatch(/2028/);
    expect(b.amtszeit.monateBisWahl).toBeGreaterThan(30);
    expect(b.empfehlungen.length).toBeLessThanOrEqual(5);
    for (const e of b.empfehlungen) {
      expect(e.knoepfe.length, e.id).toBeGreaterThan(0);
      e.knoepfe.forEach((k) => pruefeKnopf(k, e.id));
      expect(`${e.titel}${e.text}${e.kosten ?? ""}`, e.id).not.toMatch(/NaN|undefined|Infinity/);
    }
    for (const x of b.warnungen) {
      pruefeZiel(x.ziel, x.id);
      expect(x.text + x.warum).not.toMatch(/NaN|undefined|Infinity/);
    }
    for (const t of b.termine) expect(t.tage).toBeGreaterThanOrEqual(0);
  });

  test("Warnungen folgen dem Zustand: Pump, knappes Kapital, fehlende Mehrheit, Sturzgefahr", () => {
    const w = welt();
    const ids = () => warnungen(w).map((x) => x.id);
    w.spiel!.kapital = -4;
    expect(ids()).toContain("pump");
    expect(warnungen(w).find((x) => x.id === "pump")!.stufe).toBe("rot");
    w.spiel!.kapital = 5;
    expect(ids()).toContain("kapital");
    expect(ids()).not.toContain("pump");
    w.spiel!.kapital = 60;
    expect(ids()).not.toContain("kapital");
    w.spiel!.lager = [];
    w.spiel!.fraktionen = {};
    const s = warnungen(w).find((x) => x.id === "mehrheit");
    expect(s).toBeTruthy();
    w.spiel!.tiefstand = 2;
    expect(warnungen(w)[0]!.id).toBe("sturz");
    expect(warnungen(w)[0]!.stufe).toBe("rot");
  });

  test("Fälliges: Ereignis mit Frist, Gesetz mit Abstimmung und Zusage stehen nach Dringlichkeit geordnet da", () => {
    const w = welt();
    const r = bringeEin(w, "m_krankenhausbau", 70, null, "gesetz");
    expect(r.ok, r.text).toBe(true);
    oeffne(w, "streikwelle", new Rng(3));
    w.spiel!.zusagen.push({ id: "z-test", von: "AKP", text: "Rentenerhöhung", faellig: w.day + 40, massnahme: "m_renten", richtung: 1, erfuellt: false, gebrochen: false });
    const f = faellig(w);
    const arten = f.map((x) => x.art);
    expect(arten).toContain("ereignis");
    expect(arten).toContain("gesetz");
    expect(arten).toContain("zusage");
    const mitTage = f.filter((x) => x.tage !== undefined).map((x) => x.tage!);
    expect([...mitTage].sort((a, b) => a - b)).toEqual(mitTage);
    const z = f.find((x) => x.art === "zusage")!;
    expect(z.knopf.art).toBe("gehe");
    if (z.knopf.art === "gehe" && z.knopf.ziel.art === "politik") expect(z.knopf.ziel.massnahme?.id).toBe("m_renten");
    // Das Ereignis meldet seine Frist
    const e = f.find((x) => x.art === "ereignis")!;
    expect(e.tage).toBeLessThanOrEqual(30);
  });

  test("Fehlt die Mehrheit, rät das Fraktionsbüro zu einem Gespräch, und das Gespräch lässt sich wirklich führen", () => {
    const w = welt();
    w.spiel!.lager = [];
    const emp = empfehlungen(w);
    const f = emp.find((x) => x.rat === "Fraktionsbüro");
    expect(f, "kein Rat zur Mehrheit").toBeTruthy();
    const knopf = f!.knoepfe.find((k) => k.art === "gespraech");
    expect(knopf).toBeTruthy();
    if (knopf?.art !== "gespraech") return;
    const vorher = w.spiel!.kapital;
    const r = verhandle(w, knopf.partei, "gespraech", new Rng(9));
    expect(r.ok, r.text).toBe(true);
    expect(w.spiel!.kapital).toBeCloseTo(vorher - knopf.pk, 5);
  });

  test("Der Fachstab schlägt Vorhaben vor, die es im Netz gibt und die sich einbringen lassen", () => {
    const w = welt();
    const emp = empfehlungen(w).filter((x) => x.rat === "Fachstab");
    expect(emp.length).toBeGreaterThan(0);
    for (const e of emp) {
      const einbringen = e.knoepfe.find((k) => k.art === "einbringen");
      if (einbringen?.art === "einbringen") {
        const r = bringeEin(w, einbringen.vorschlag.massnahme, einbringen.vorschlag.ziel, einbringen.vorschlag.ort, "gesetz");
        expect(r.ok, r.text).toBe(true);
        break;
      }
    }
  });

  test("Die Empfehlungen ändern sich mit der Lage: ein eingebrachtes Vorhaben verschwindet aus der Liste", () => {
    const w = welt();
    const vorher = empfehlungen(w).find((x) => x.rat === "Fachstab");
    expect(vorher).toBeTruthy();
    const k = vorher!.knoepfe.find((x) => x.art === "einbringen");
    if (k?.art !== "einbringen") return;
    expect(bringeEin(w, k.vorschlag.massnahme, k.vorschlag.ziel, k.vorschlag.ort, "gesetz").ok).toBe(true);
    expect(empfehlungen(w).some((x) => x.id === vorher!.id)).toBe(false);
  });

  test("Termine: Wahl, Abstimmungen und der Kalender des Staatsjahres, aufsteigend nach Tagen", () => {
    const w = welt();
    bringeEin(w, "m_krankenhausbau", 70, null, "gesetz");
    const t = termine(w);
    expect(t.some((x) => x.id === "wahl")).toBe(true);
    expect(t.some((x) => x.id.startsWith("g-"))).toBe(true);
    expect(t.map((x) => x.tage)).toEqual([...t.map((x) => x.tage)].sort((a, b) => a - b));
  });

  test("Kalender: Die Ereignisvorlagen gibt es, und die Monatsrechnung trifft den ersten des Monats", () => {
    for (const k of KALENDER) expect(() => vorlage(k.vorlage), k.vorlage).not.toThrow();
    const w = welt();
    w.date = "2028-06-05";
    expect(tageBisMonat(w, 10, 2028)).toEqual({ tage: 118, jahr: 2028 });
    expect(tageBisMonat(w, 3, 2029, 2029)).toEqual({ tage: 269, jahr: 2029 });
    // Im Zielmonat selbst gilt der Termin als laufend (das Ereignis entsteht jetzt)
    w.date = "2028-10-15";
    expect(tageBisMonat(w, 10, 2028)).toEqual({ tage: 0, jahr: 2028 });
    // Nach dem Zielmonat: nächstes Jahr
    w.date = "2028-11-02";
    expect(tageBisMonat(w, 10, 2028)?.jahr).toBe(2029);
  });

  test("Über mehrere Jahre bleibt das Briefing stabil (keine Ausnahmen, keine kaputten Zahlen)", () => {
    const w = welt(3);
    w.spiel!.ereignisse = [];
    for (let i = 0; i < 36; i++) {
      advance(w, 30);
      if (w.spiel!.ende) break;
      const b = briefing(w);
      for (const e of b.empfehlungen) expect(`${e.titel}${e.text}`).not.toMatch(/NaN|undefined/);
      for (const x of b.kennzahlen) expect(x.wert).not.toMatch(/NaN/);
      w.spiel!.ereignisse = [];
    }
  });
});
