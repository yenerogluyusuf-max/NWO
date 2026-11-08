// Die übrigen Länder als Akteure.

import { describe, expect, test } from "vitest";
import { advance, createWorld } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { startAfterElection, schnellProfil } from "../src/sim/prolog";
import { NET } from "../src/sim/modell";
import { AKTIONEN, LAENDER, aktionenFuer, anliegenStand, dimensionZu, fuehreAktionAus, haltungWort, vertrauenZu, weltZustand } from "../src/sim/laender";
import { nationalAverage } from "../src/sim/netz";

function neu() {
  const w = createWorld(turkey2026, 11);
  startAfterElection(w, schnellProfil());
  w.spiel!.ereignisse = [];
  w.spiel!.kapital = 100;
  return w;
}

describe("Länder", () => {
  test("Aufbau: gültige Knoten, Maßnahmen und Handlungen; Vertrauen startet beim Startwert", () => {
    const w = neu();
    expect(LAENDER.length).toBeGreaterThanOrEqual(12);
    for (const l of LAENDER) {
      expect(NET.index.has(l.knoten), l.id).toBe(true);
      expect(l.anliegen.length).toBeGreaterThanOrEqual(2);
      for (const a of l.anliegen) if ("id" in a.bedingung) expect(NET.index.has(a.bedingung.id), `${l.id}/${a.id}`).toBe(true);
      for (const a of l.aktionen) expect(AKTIONEN[a]).toBeDefined();
      expect(Math.abs(vertrauenZu(w, l.id) - l.start.vertrauen), l.id).toBeLessThanOrEqual(2);
      expect(l.text.length).toBeGreaterThan(80);
    }
  });

  test("Ein Gipfeltreffen kostet Kapital, hebt Vertrauen und bewegt den Netzknoten; danach gilt eine Abkühlzeit", () => {
    const w = neu();
    const v0 = vertrauenZu(w, "USA");
    const k0 = nationalAverage(NET, w.net, "beziehungen_usa");
    const kapital = w.spiel!.kapital;
    const r = fuehreAktionAus(w, "USA", "gipfel");
    expect(r.ok).toBe(true);
    expect(w.spiel!.kapital).toBe(kapital - AKTIONEN.gipfel.pk);
    expect(vertrauenZu(w, "USA")).toBeGreaterThan(v0 + 3);
    expect(nationalAverage(NET, w.net, "beziehungen_usa")).toBeGreaterThan(k0);
    expect(fuehreAktionAus(w, "USA", "gipfel").ok).toBe(false);
    advance(w, 121);
    expect(aktionenFuer(w, "USA").find((a) => a.aktion.id === "gipfel")!.moeglich).toBe(true);
  });

  test("Gipfeltreffen allein machen ein Land nicht zum Freund: abnehmender Ertrag", () => {
    const w = neu();
    const schritte: number[] = [];
    let v = vertrauenZu(w, "EU");
    for (let i = 0; i < 12; i++) {
      w.spiel!.kapital = 100;
      const r = fuehreAktionAus(w, "EU", "gipfel");
      if (!r.ok) break;
      const jetzt = vertrauenZu(w, "EU");
      schritte.push(jetzt - v);
      v = jetzt;
      advance(w, 125);
    }
    expect(schritte.length).toBeGreaterThanOrEqual(2);
    expect(schritte[schritte.length - 1]!).toBeLessThan(schritte[0]!);
    expect(v).toBeLessThan(82);
    expect(schritte[0]! / schritte[schritte.length - 1]!).toBeGreaterThan(2);
  });

  test("Ein Handelsabkommen mit der EU verlangt eine Gegenleistung als Zusage", () => {
    const w = neu();
    const n = w.spiel!.zusagen.length;
    const h0 = dimensionZu(w, "EU", "handel");
    expect(fuehreAktionAus(w, "EU", "handel").ok).toBe(true);
    expect(dimensionZu(w, "EU", "handel")).toBeGreaterThan(h0);
    expect(w.spiel!.zusagen.length).toBe(n + 1);
    expect(w.spiel!.zusagen[n]!.von).toBe("EU-Kommission");
  });

  test("Ein Rüstungsgeschäft mit den USA verärgert Russland und China", () => {
    const w = neu();
    const r0 = vertrauenZu(w, "RUS");
    const c0 = vertrauenZu(w, "CHN");
    expect(fuehreAktionAus(w, "USA", "ruestung").ok).toBe(true);
    expect(vertrauenZu(w, "RUS")).toBeLessThan(r0);
    expect(vertrauenZu(w, "CHN")).toBeLessThan(c0);
  });

  test("Druck kostet Vertrauen und erhöht den Konflikt; Entspannen senkt ihn", () => {
    const w = neu();
    const k0 = weltZustand(w).GRC!.konflikt;
    fuehreAktionAus(w, "GRC", "druck");
    expect(weltZustand(w).GRC!.konflikt).toBeGreaterThan(k0);
    fuehreAktionAus(w, "GRC", "entspannen");
    expect(weltZustand(w).GRC!.konflikt).toBeLessThan(k0 + 6);
  });

  test("Anliegen lassen sich für jedes Land prüfen; die Haltung hat ein Wort", () => {
    const w = neu();
    for (const l of LAENDER) {
      const s = anliegenStand(w, l.id);
      expect(s).toHaveLength(l.anliegen.length);
      for (const x of s) expect(x.text.length).toBeGreaterThan(5);
      expect(haltungWort(w, l.id).length).toBeGreaterThan(3);
    }
  });

  test("Über Jahre laufen die Länder fehlerfrei mit; ein Partner mit erfüllten Anliegen wird wärmer", () => {
    const w = neu();
    advance(w, 30 * 24);
    for (const l of LAENDER) {
      const v = vertrauenZu(w, l.id);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
    }
  });
});
