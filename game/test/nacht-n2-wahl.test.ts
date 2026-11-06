// N2, 6. November (befund-E): Das Barometer rechnet wie die Wahl, Angriffe lassen sich beantworten, Reisen zählen sofort,
// die Opposition wirkt auf die Wahl. Jede angezeigte Zahl ist dieselbe, die der Code bucht.

import { describe, expect, test } from "vitest";
import { advance, createWorld, save, load } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { schnellProfil, startAfterElection } from "../src/sim/prolog";
import { wahlPrognose, wahlRechnung, oppositionsEinfluss } from "../src/sim/wahl";
import { angriffAntworten, angriffBeantworten, angriffsAussicht, reise, reiseWirkungVorschau, WAHLKAMPF, wahlkampfSicht } from "../src/sim/wahlkampf";
import { oppositionInstrument, oppositionInstrumente, oppositionWahlwirkung } from "../src/sim/opposition";
import { gesellschaftVon, gesellschaftWahlDruck } from "../src/sim/gesellschaft";
import { zielZustimmung } from "../src/sim/spiel";
import { Rng } from "../src/sim/rng";
import type { World } from "../src/sim/types";

function neu(seed = 4): World {
  const w = createWorld(turkey2026, seed);
  startAfterElection(w, schnellProfil());
  w.spiel!.ereignisse = [];
  return w;
}

/** Bis in den Wahlkampf (ohne Ereignisse), mit einem Angriff im Protokoll. */
function imWahlkampf(seed = 4): World {
  const w = neu(seed);
  const sp = w.spiel!;
  while (sp.wahltag - w.day > 40) {
    sp.ereignisse = [];
    advance(w, Math.min(60, sp.wahltag - w.day - 40));
  }
  sp.ereignisse = [];
  return w;
}

describe("Erwartetes Ergebnis (E-1)", () => {
  test("Die Vorschau ist die Wahlrechnung ohne Würfel, von der angezeigten Zustimmung aus, mit Band um die Mitte", () => {
    const w = neu();
    const p = wahlPrognose(w);
    const r = wahlRechnung(w, p.zustimmung, false);
    expect(p.erwartet).toBeCloseTo(Math.round(r.amt * 10) / 10, 6);
    expect(p.von).toBeLessThan(p.erwartet);
    expect(p.bis).toBeGreaterThan(p.erwartet);
    // Die Treppe geht auf: Zustimmung plus Einflüsse ergibt das Erwartete
    const summe = p.zustimmung + p.einfluesse.reduce((s, e) => s + e.punkte, 0);
    expect(summe).toBeCloseTo(p.erwartet, 0);
    // Die Vorschau würfelt nicht und ändert nichts
    const vor = save(w);
    wahlPrognose(w);
    expect(save(w)).toBe(vor);
  });

  test("Die Vorwarnung nennt das Thema der Angriffe und rechnet wie die Woche des Wahlkampfs", () => {
    const w = neu();
    const a = angriffsAussicht(w);
    expect(a.wochen).toBe(Math.floor(WAHLKAMPF.beginnTage / WAHLKAMPF.wocheTage));
    expect(a.summe).toBeLessThanOrEqual(0);
    expect(a.summe).toBeGreaterThanOrEqual(-WAHLKAMPF.angriffDeckelGesamt);
    if (a.thema) expect(a.orte.length).toBeGreaterThan(0);
  });
});

describe("Angriffe mit Gegenzug (E-2)", () => {
  test("Jede Antwort bucht genau den angezeigten Betrag, kostet ihre Aktionspunkte und gilt nur einmal", () => {
    for (const id of ["gegendarstellung", "gegenangriff"] as const) {
      const w = imWahlkampf();
      const k = w.spiel!.wahlkampf!;
      expect(k.angriffeLog.length).toBeGreaterThan(0);
      const i = k.angriffeLog.length - 1;
      const sicht = angriffAntworten(w, i).find((x) => x.id === id)!;
      expect(sicht.moeglich).toBe(true);
      const ap = k.ap;
      const vor = k.angriffe;
      const r = angriffBeantworten(w, i, id, new Rng(1));
      expect(r.ok).toBe(true);
      expect(k.ap).toBe(ap - sicht.ap);
      expect(k.angriffe - vor).toBeCloseTo(sicht.zurueck, 2);
      expect(sicht.zurueck).toBeGreaterThan(0);
      expect(angriffBeantworten(w, i, id, new Rng(1)).ok).toBe(false);
      expect(wahlkampfSicht(w).effekte.teile.some((t) => t.punkte === k.angriffe)).toBe(true);
    }
  });

  test("Der Ortstermin kann missglücken und kostet dann den angezeigten Rückschlag", () => {
    const w = imWahlkampf();
    const k = w.spiel!.wahlkampf!;
    const i = k.angriffeLog.length - 1;
    const sicht = angriffAntworten(w, i).find((x) => x.id === "ortstermin")!;
    const vor = k.angriffe;
    angriffBeantworten(w, i, "ortstermin", { next: () => 0 } as unknown as Rng);
    expect(k.angriffe - vor).toBeCloseTo(sicht.rueckschlag, 2);
    expect(k.angriffeLog[i]!.antwort).toBe("ortstermin");
  });
});

describe("Reisen zählen sofort (E-5)", () => {
  test("Die Reise hebt Sollwert und Zustimmung um denselben, vorher angezeigten Betrag", () => {
    const w = imWahlkampf();
    const sp = w.spiel!;
    const plaka = 6;
    const p = reiseWirkungVorschau(w, plaka);
    const z0 = sp.umfrage.zustimmung;
    const soll0 = zielZustimmung(w);
    const r = reise(w, plaka, { next: () => 0.999 } as unknown as Rng);
    expect(r.ok).toBe(true);
    const dz = sp.umfrage.zustimmung - z0;
    expect(dz).toBeCloseTo(p.wahlErfolg, 6);
    expect(zielZustimmung(w) - soll0).toBeCloseTo(dz, 6);
    expect(sp.wahlkampf!.reisen.at(-1)!.zustimmung).toBeCloseTo(dz, 2);
    expect(wahlkampfSicht(w).reisenZustimmung).toBeCloseTo(dz, 2);
    // Der Stand übersteht Speichern und Laden
    expect(load(save(w)).spiel!.wahlkampf!.reisen.at(-1)!.zustimmung).toBeCloseTo(dz, 2);
  });
});

describe("Opposition in der Wahl (E-3)", () => {
  test("Zum Amtsantritt ist die Opposition eingepreist; eine stärkere Opposition kostet am Wahltag Stimmen", () => {
    const w = neu();
    expect(oppositionsEinfluss(w)).toBe(0);
    const g = gesellschaftVon(w);
    const vor = gesellschaftWahlDruck(w);
    g.opposition.staerke += 10;
    expect(gesellschaftWahlDruck(w)).toBeGreaterThan(vor);
    expect(oppositionsEinfluss(w)).toBeLessThan(0);
    expect(wahlPrognose(w).einfluesse.some((e) => e.punkte === oppositionsEinfluss(w))).toBe(true);
  });

  test("Die Karte des Instruments nennt die Wirkung, die das Instrument heute wirklich bucht", () => {
    const w = neu();
    w.spiel!.kapital = 80;
    const s = oppositionInstrumente(w).find((x) => x.id === "ermittlung")!;
    expect(s.wahl).toEqual(oppositionWahlwirkung(w, "ermittlung"));
    const vor = oppositionsEinfluss(w);
    expect(oppositionInstrument(w, "ermittlung").ok).toBe(true);
    expect(oppositionsEinfluss(w) - vor).toBeCloseTo(s.wahl.heute, 1);
  });
});
