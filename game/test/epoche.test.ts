// Amtszeit-Epochen (sim/epoche.ts): Momente aus dem Spielzustand, Bewertung bei der Wiederwahl, heroisch nach dunkel, Speichern.
import { describe, expect, test } from "vitest";
import { advance, createWorld, load, save } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { schnellProfil, startAfterElection } from "../src/sim/prolog";
import { EPOCHE, bewerteEpoche, epocheMonat, epochenSicht, epochenZustand, stufeVon } from "../src/sim/epoche";
import { aussenZustand } from "../src/sim/diplomatie";
import { setzeSprache, t } from "../src/i18n";
import type { World } from "../src/sim/types";

function welt(): World {
  const w = createWorld(turkey2026, 3);
  startAfterElection(w, schnellProfil());
  epocheMonat(w);
  return w;
}

describe("Momente", () => {
  test("Startbestand und Start-Sanktion zählen nicht; Inflation unter 20 ist ein Moment", () => {
    const w = welt();
    expect(epochenZustand(w).momente).toHaveLength(0);
    w.economy.inflation = 18;
    epocheMonat(w);
    expect(epochenZustand(w).momente.map((m) => m.id)).toContain("inflation_gebrochen");
    expect(epochenZustand(w).wert).toBe(3);
    epocheMonat(w);
    expect(epochenZustand(w).momente.filter((m) => m.id === "inflation_gebrochen")).toHaveLength(1);
  });
  test("Aufgehobene Start-Sanktion und eine neue Sanktion sind Momente mit Vorzeichen", () => {
    const w = welt();
    const a = aussenZustand(w);
    a.sanktionen = a.sanktionen.filter((s) => s.id !== "caatsa");
    epocheMonat(w);
    a.sanktionen.push({ id: "eu_handel", von: "EU", seit: w.day });
    epocheMonat(w);
    const ids = epochenZustand(w).momente.map((m) => `${m.id}:${m.wert}`);
    expect(ids).toContain(`sanktion_aufgehoben:3`);
    expect(ids).toContain(`sanktion:-3`);
  });
  test("Momente stehen in der Chronik und überleben Speichern und Laden", () => {
    const w = welt();
    w.economy.inflation = 18;
    epocheMonat(w);
    expect(w.spiel!.chronik.some((c) => /Historischer Moment/.test(c.titel))).toBe(true);
    expect(load(save(w)).spiel!.epoche!.wert).toBe(3);
  });
});

describe("Bewertung", () => {
  test("Schwellen: golden, normal, dunkel; heroisch nach dunkel", () => {
    expect(stufeVon(EPOCHE.goldenAb)).toBe("golden");
    expect(stufeVon(0)).toBe("normal");
    expect(stufeVon(EPOCHE.dunkelBis)).toBe("dunkel");
    expect(stufeVon(EPOCHE.heroischAb, "dunkel")).toBe("heroisch");
    expect(stufeVon(EPOCHE.goldenAb, "dunkel")).toBe("heroisch");
  });
  test("Die Bewertung setzt Folgen, beginnt die nächste Amtszeit bei null und läuft nur einmal", () => {
    const w = welt();
    const z = epochenZustand(w);
    z.wert = 9;
    const kap = w.spiel!.kapital;
    expect(bewerteEpoche(w, 1)).toBe("golden");
    expect(w.spiel!.kapital).toBe(kap + EPOCHE.folgen.golden.kapital);
    expect(z.wert).toBe(0);
    expect(bewerteEpoche(w, 1)).toBe("golden");
    expect(w.spiel!.kapital).toBe(kap + EPOCHE.folgen.golden.kapital);
    expect(w.spiel!.hinweise.some((h) => h.id === "epoche-1")).toBe(true);
  });
  test("Eine echte Wiederwahl bewertet die Amtszeit", () => {
    const w = welt();
    w.spiel!.umfrage.zustimmung = 80;
    w.spiel!.kalibrierung += 33;
    advance(w, w.spiel!.wahltag - w.day + 1);
    if (w.spiel!.wahl?.stichwahl) advance(w, 16);
    if (w.spiel!.amtszeit === 2) expect(epochenZustand(w).bewertungen.map((b) => b.amtszeit)).toEqual([1]);
  });
});

describe("Anzeige und Sprachen", () => {
  test("Sicht und Texte in drei Sprachen ohne Platzhalter", async () => {
    for (const sp of ["de", "en", "tr"] as const) {
      await setzeSprache(sp);
      const w = welt();
      w.economy.inflation = 18;
      epocheMonat(w);
      const e = epochenSicht(w)!;
      expect(e.momente[0]!.titel).not.toMatch(/\{|epoche\./);
      for (const s of ["golden", "normal", "dunkel", "heroisch"]) for (const k of ["", ".text", ".folge"]) expect(t(`epoche.stufe.${s}${k}`, { wert: 1 })).not.toMatch(/\{|epoche\./);
    }
    await setzeSprache("de");
  });
});

describe("Bilanz", () => {
  test("Der Rückblick nennt Epochen und prägende Momente", async () => {
    const { erstelleBilanz } = await import("../src/sim/bilanz");
    const w = welt();
    w.economy.inflation = 18;
    epocheMonat(w);
    epochenZustand(w).wert = 9;
    bewerteEpoche(w, 1);
    w.economy.inflation = 9;
    epocheMonat(w);
    const text = erstelleBilanz(w, "zwischen").absaetze.join(" ");
    expect(text).toContain("Amtszeit 1: Goldene Amtszeit (+9)");
    expect(text).toContain("Die Inflation ist einstellig");
    expect(text).not.toMatch(/\{|bilanz\./);
  });
});
