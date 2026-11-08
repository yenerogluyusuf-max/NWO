// Sanktionen mit Wirkung (PRUEFUNG_GESAMT_2026-11-04): CAATSA im Startzustand, Last auf Märkte und Nachfrage, Klausel hebt die
// Sanktion wirklich auf und nur dort, wo sie besteht, Gegensanktion starker Partner, EU-Maßnahmen bleiben im Krieg, Energiemangel
// treibt Preise.

import { describe, expect, test } from "vitest";
import { createWorld, advance } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { startAfterElection, schnellProfil } from "../src/sim/prolog";
import { aussenZustand, fuehreInstrumentAus, sanktionsStaende, verhaengeSanktion, SANKTION_LAST } from "../src/sim/diplomatie";
import { klauselSicht, schliesse } from "../src/sim/abkommen";
import { breiteSanktionVon } from "../src/sim/sanktion-art";
import { partnerGesperrt } from "../src/sim/wissensbaum-kern";
import "../src/sim/wissensbaum";
import { energiePartnerGrund } from "../src/sim/versorgungspolitik";
import { KRAFT } from "../src/data/kraefte";
import { monthlyUpdate } from "../src/sim/economy";
import { Rng } from "../src/sim/rng";
import type { World } from "../src/sim/types";

function welt(seed = 6): World {
  const w = createWorld(turkey2026, seed);
  startAfterElection(w, schnellProfil());
  w.spiel!.kapital = 150;
  return w;
}

describe("Startzustand und Anzeige", () => {
  test("ein neues Spiel beginnt mit CAATSA der USA (seit Dezember 2020)", () => {
    const w = welt();
    const s = aussenZustand(w).sanktionen.find((x) => x.id === "caatsa");
    expect(s?.von).toBe("USA");
    expect(s!.seit).toBeLessThan(w.day);
  });
  test("jede Sanktion nennt Bedingung, Zählerstand und Wege zur Aufhebung", () => {
    const w = welt();
    const st = sanktionsStaende(w);
    expect(st.length).toBeGreaterThan(0);
    for (const s of st) { expect(s.bedingung.length).toBeGreaterThan(20); expect(s.wege.length).toBeGreaterThan(20); expect(s.noetig).toBe(6); }
  });
});

describe("Gezielt statt pauschal", () => {
  test("die Start-CAATSA ist eingepreist: keine zusätzliche Marktlast, ihre Aufhebung entlastet", () => {
    const w = welt();
    advance(w, 31);
    expect(w.economy.sanktionsLast?.risiko ?? 0).toBe(0);
    const a = aussenZustand(w);
    a.sanktionen = a.sanktionen.filter((s) => s.id !== "caatsa");
    advance(w, 31);
    expect(w.economy.sanktionsLast!.risiko).toBe(-SANKTION_LAST.caatsa.risiko);
  });
  test("CAATSA sperrt US-Lizenzen nur für Rüstung, nicht für Chips; LNG-Abkommen mit den USA bleibt möglich", () => {
    const w = welt();
    expect(partnerGesperrt(w, "USA", "chips_design")).toBe(false);
    expect(partnerGesperrt(w, "USA", "mil_kaan_motor")).toBe(true);
    expect(partnerGesperrt(w, "USA", "luft_triebwerke")).toBe(true);
    expect(breiteSanktionVon(aussenZustand(w), "USA")).toBe(false);
    expect(energiePartnerGrund(w, "USA") ?? "").not.toMatch(/Handelssperre/);
  });
});

describe("Last auf Märkte und Nachfrage", () => {
  test("EU-Handelsmaßnahmen heben den Risikoaufschlag und senken das Wachstum gegenüber einem Lauf ohne", () => {
    const ohne = welt(), mit = welt();
    aussenZustand(ohne).sanktionen = []; aussenZustand(mit).sanktionen = [];
    verhaengeSanktion(mit, "eu_handel", "EU");
    advance(ohne, 150); advance(mit, 150);
    expect(mit.economy.sanktionsLast?.nachfrage).toBeGreaterThan(0);
    expect(mit.economy.riskPremium).toBeGreaterThan(ohne.economy.riskPremium);
    expect(mit.economy.outputGap).toBeLessThan(ohne.economy.outputGap);
  });
  test("Energiemangel treibt die Inflation und drückt die Auslastung", () => {
    const w = welt();
    const a = structuredClone(w.economy), b = structuredClone(w.economy);
    a.energieMangel = 0; b.energieMangel = 0.3;
    for (let m = 0; m < 6; m++) { monthlyUpdate(a, [], new Rng(m)); monthlyUpdate(b, [], new Rng(m)); }
    expect(b.inflation).toBeGreaterThan(a.inflation);
    expect(b.outputGap).toBeLessThan(a.outputGap);
  });
});

describe("Wege aus der Sanktion", () => {
  test("die Klausel „Sanktionen aufheben“ gibt es nur, wo der Partner sanktioniert, und der Vertrag hebt die Sanktion auf", () => {
    const w = welt();
    expect(klauselSicht(w, "USA", "w_sanktion")?.gesperrt).toBeFalsy();
    schliesse(w, { land: "USA", gibt: ["s400"], will: ["w_sanktion"], jahre: 5 });
    expect(aussenZustand(w).sanktionen.some((s) => s.von === "USA")).toBe(false);
    expect(klauselSicht(w, "USA", "w_sanktion")?.gesperrt).toBeTruthy();
  });
  test("im Krieg gegen ein EU-Mitglied enden die EU-Maßnahmen nicht", () => {
    const w = welt();
    verhaengeSanktion(w, "eu_handel", "EU");
    (w.spiel!.kriege ??= []).push({ id: "t-grc", land: "GRC", phase: "krieg", seit: w.day, eskalation: 90, mobilmachung: 1, front: 50, frontVorher: 50, uhr: 90, uhrGegner: 90, woche: 0, verluste: 0, rahmung: "revision" });
    advance(w, 240);
    expect(aussenZustand(w).sanktionen.some((s) => s.id === "eu_handel")).toBe(true);
  });
});

describe("Sanktionen der Türkei", () => {
  test("ein starker Partner antwortet mit einer Gegensanktion, ein schwacher nicht", () => {
    const w = welt();
    expect(KRAFT.RUS!).toBeGreaterThanOrEqual(SANKTION_LAST.gegenAbStaerke);
    expect(fuehreInstrumentAus(w, "sanktion", "RUS").ok).toBe(true);
    expect(aussenZustand(w).gegenSanktionen).toContain("RUS");
    const v = welt();
    expect(KRAFT.ARM!).toBeLessThan(SANKTION_LAST.gegenAbStaerke);
    if (fuehreInstrumentAus(v, "sanktion", "ARM").ok) expect(aussenZustand(v).gegenSanktionen ?? []).not.toContain("ARM");
  });
  test("eine eigene Sanktion kostet Auslandsnachfrage; Aufheben beendet auch die Gegensanktion", () => {
    const w = welt();
    fuehreInstrumentAus(w, "sanktion", "RUS");
    expect(w.economy.sanktionsLast!.nachfrage).toBeGreaterThan(0);
    w.spiel!.kapital = 150;
    expect(fuehreInstrumentAus(w, "sanktion_aufheben", "RUS").ok).toBe(true);
    expect(aussenZustand(w).gegenSanktionen ?? []).not.toContain("RUS");
  });
});
