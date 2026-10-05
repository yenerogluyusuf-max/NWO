// Güterbilanz (sim/gueter.ts) mit ihren Daten (data/gueter.ts, data/ressourcen.ts, data/strategie-orte.ts) und den Linsen
// „Ressourcen“ und „Strategische Orte“: Datenprüfung, ruhige Welt ohne Wirkung, Ausfälle über Krieg, Sanktion und Hormus,
// Lager als Puffer, Instrumente mit Preis, alter Spielstand ohne Inventar, Katalog in drei Sprachen.

import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { createWorld, advance } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { startAfterElection, schnellProfil } from "../src/sim/prolog";
import { NET } from "../src/sim/modell";
import { nationalAverage } from "../src/sim/netz";
import { akteurName } from "../src/sim/welt-modell";
import { aussenZustand } from "../src/sim/diplomatie";
import { UEBERZIEHUNG } from "../src/sim/kapital";
import { GUETER, GUT_NACH_ID, RESERVE_KOSTEN } from "../src/data/gueter";
import { VORKOMMEN } from "../src/data/ressourcen";
import { STRATEGIE_ORTE } from "../src/data/strategie-orte";
import { fuehreGutInstrumentAus, gueterMonat, gueterSicht, gueterZustand, gutInstrumente } from "../src/sim/gueter";
import { farbenFuerEbene } from "../src/ui/ebenen";
import { ressourcenMarken, strategieMarken } from "../src/ui/gueter/linsen";
import type { KriegVorgang } from "../src/sim/krieg-typen";
import type { World } from "../src/sim/types";

function welt(seed = 4): World {
  const w = createWorld(turkey2026, seed);
  startAfterElection(w, schnellProfil());
  w.spiel!.ereignisse = [];
  w.spiel!.kapital = 200;
  return w;
}

/** Einen Monatsschritt der Güterbilanz erzwingen */
function monat(w: World): void {
  gueterZustand(w).monat = "";
  gueterMonat(w);
}

function krieg(w: World, land: string): void {
  w.spiel!.kriege ??= [];
  w.spiel!.kriege.push({ id: `test_${land}`, land, phase: "krieg", seit: w.day, eskalation: 80 } as unknown as KriegVorgang);
}

const sicht = (w: World, id: string) => gueterSicht(w).find((s) => s.def.id === id)!;

describe("Daten", () => {
  test("16 Warengruppen, eindeutig, mit Quelle; Lieferanteile höchstens 100 %", () => {
    expect(GUETER).toHaveLength(16);
    expect(new Set(GUETER.map((g) => g.id)).size).toBe(16);
    for (const g of GUETER) {
      expect(g.quelle.length, g.id).toBeGreaterThan(20);
      expect(g.lieferanten.reduce((a, l) => a + l.anteil, 0), g.id).toBeLessThanOrEqual(100);
      expect(g.produktion, g.id).toBeGreaterThanOrEqual(0);
      expect(g.verbrauch, g.id).toBeGreaterThanOrEqual(0);
    }
  });

  test("Jedes Land ist ein Akteur des Weltmodells, jeder Knoten steht im Politiknetz", () => {
    const laender = new Set<string>();
    for (const g of GUETER) {
      g.lieferanten.forEach((l) => laender.add(l.land));
      g.kunden.forEach((k) => laender.add(k));
      for (const e of [...g.engpass, ...(g.produktionTreiber ?? []), ...(g.verbrauchTreiber ?? [])]) expect(NET.index.has(e.knoten), `${g.id}: ${e.knoten}`).toBe(true);
    }
    VORKOMMEN.forEach((v) => v.land && laender.add(v.land));
    STRATEGIE_ORTE.forEach((o) => o.kontrolle !== "TUR" && laender.add(o.kontrolle));
    for (const l of laender) expect(() => akteurName(l), l).not.toThrow();
    expect(NET.index.has("ruestungsautarkie")).toBe(true);
  });

  test("Vorkommen und Orte: Provinz 1 bis 81 oder Ausland, Lage im Kartenausschnitt, eindeutige Kennung", () => {
    for (const v of [...VORKOMMEN, ...STRATEGIE_ORTE]) {
      const plaka = v.plaka;
      if (plaka !== undefined) expect(plaka >= 1 && plaka <= 81, v.id).toBe(true);
      expect(v.lon > 10 && v.lon < 70 && v.lat > 5 && v.lat < 50, v.id).toBe(true);
    }
    expect(new Set(VORKOMMEN.map((v) => v.id)).size).toBe(VORKOMMEN.length);
    expect(new Set(STRATEGIE_ORTE.map((o) => o.id)).size).toBe(STRATEGIE_ORTE.length);
    for (const v of VORKOMMEN) expect(v.plaka !== undefined || v.land !== undefined, v.id).toBe(true);
    expect(STRATEGIE_ORTE.map((o) => o.id)).toEqual(expect.arrayContaining(["zypern", "hormus", "bosporus"]));
    for (const o of STRATEGIE_ORTE) expect(o.warum.length > 20 && o.wirkung.length > 20, o.id).toBe(true);
  });
});

describe("Bilanz", () => {
  test("Ausgangslage: Bor und Strom autark, Erdgas fast ganz Einfuhr, Lager aus den Lagermonaten", () => {
    const w = welt();
    expect(sicht(w, "bor").autarkie).toBe(100);
    expect(sicht(w, "erdgas").autarkie).toBeLessThan(15);
    expect(sicht(w, "erdgas").einfuhr).toBeGreaterThan(40);
    const g = GUT_NACH_ID.get("getreide")!;
    expect(sicht(w, "getreide").lager).toBeCloseTo((g.verbrauch / 12) * g.lagerMonate, 5);
    expect(sicht(w, "obst_gemuese").def.beispiel?.name).toBe("Bananen");
  });

  test("Kriegsampel: Reichweite des Lagers in Tagen; Strom und Wasser ohne Ampel, Krieg macht sie rot", () => {
    const w = welt();
    expect(sicht(w, "strom").ampel).toBe("keine");
    expect(sicht(w, "wasser").ampel).toBe("keine");
    expect(sicht(w, "getreide").ampel).toBe("gruen");
    expect(sicht(w, "erdgas").reichweiteTage).toBeLessThan(90);
    monat(w);
    krieg(w, "RUS");
    gueterZustand(w).lager.getreide = 0.1;
    expect(sicht(w, "getreide").reichweiteJetzt).toBeLessThan(30);
    expect(sicht(w, "getreide").ampel).toBe("rot");
  });

  test("Ruhige Welt: der erste Monat setzt die Ausgangslage, das Netz bleibt unberührt", () => {
    const w = welt();
    const vorher = Float64Array.from(w.net.values);
    monat(w);
    monat(w);
    expect(Array.from(w.net.values)).toEqual(Array.from(vorher));
    expect(gueterZustand(w).verlauf).toHaveLength(2);
  });

  test("Krieg mit Russland: Getreideeinfuhr fällt aus, das Lager deckt zuerst, danach steigen die Lebensmittelpreise", () => {
    const w = welt();
    monat(w);
    krieg(w, "RUS");
    expect(sicht(w, "getreide").blockiert).toBeCloseTo(0.65, 5);
    const preis0 = nationalAverage(NET, w.net, "lebensmittelpreise");
    monat(w);
    expect(sicht(w, "getreide").lager).toBeLessThan((GUT_NACH_ID.get("getreide")!.verbrauch / 12) * 3);
    gueterZustand(w).lager.getreide = 0;
    monat(w);
    expect(sicht(w, "getreide").fehlProzent).toBeGreaterThan(0);
    expect(nationalAverage(NET, w.net, "lebensmittelpreise")).toBeGreaterThan(preis0);
    expect(sicht(w, "getreide").satz).toMatch(/fehlen/);
  });

  test("Hält ein Ausfall an, leitet der Handel binnen eines Jahres bis auf ein Drittel um", () => {
    const w = welt();
    monat(w);
    krieg(w, "RUS");
    const anfang = sicht(w, "getreide").zusatz;
    for (let i = 0; i < 13; i++) monat(w);
    expect(sicht(w, "getreide").zusatz).toBeCloseTo(anfang / 3, 5);
  });

  test("Sanktionen und Hormus treffen die Einfuhr; Erdgas wirkt nur über das Außenmodul", () => {
    const w = welt();
    const a = aussenZustand(w);
    a.energie.hormus = "offen";
    const oel0 = sicht(w, "erdoel").blockiert;
    a.energie.hormus = "geschlossen";
    expect(sicht(w, "erdoel").blockiert).toBeGreaterThan(oel0);
    a.sanktionen.push({ id: "caatsa", von: "USA", seit: w.day });
    expect(sicht(w, "erdgas").blockiert).toBeGreaterThanOrEqual(0.16);
    // Erdgas allein (Lager leer) verschiebt kein Netz
    const w2 = welt();
    monat(w2);
    aussenZustand(w2).sanktionen.push({ id: "caatsa", von: "USA", seit: w2.day });
    for (const g of GUETER) gueterZustand(w2).lager[g.id] = g.id === "erdgas" ? 0 : 1e9;
    const vorher = Float64Array.from(w2.net.values);
    monat(w2);
    expect(Array.from(w2.net.values)).toEqual(Array.from(vorher));
  });
});

describe("Instrumente", () => {
  test("Reserve anlegen kostet Kapital und BIP und füllt das Lager um einen Monatsbedarf", () => {
    const w = welt();
    const kap = w.spiel!.kapital;
    const schuld = w.economy.debtRatio;
    const lager = sicht(w, "getreide").lager;
    const r = fuehreGutInstrumentAus(w, "getreide", "reserve");
    expect(r.ok).toBe(true);
    expect(w.spiel!.kapital).toBeLessThan(kap);
    expect(w.economy.debtRatio).toBeGreaterThan(schuld);
    expect(sicht(w, "getreide").lager).toBeCloseTo(lager + GUT_NACH_ID.get("getreide")!.verbrauch / 12, 5);
  });

  test("Ausfuhrstopp senkt Ausfuhr auf null und lässt sich aufheben; Quellenwechsel halbiert den Ausfall", () => {
    const w = welt();
    expect(fuehreGutInstrumentAus(w, "getreide", "stopp").ok).toBe(true);
    expect(sicht(w, "getreide").ausfuhr).toBe(0);
    expect(fuehreGutInstrumentAus(w, "getreide", "stopp").ok).toBe(true);
    expect(sicht(w, "getreide").ausfuhr).toBeGreaterThan(0);
    krieg(w, "RUS");
    const b = sicht(w, "getreide").blockiert;
    expect(fuehreGutInstrumentAus(w, "getreide", "quelle").ok).toBe(true);
    expect(sicht(w, "getreide").blockiert).toBeCloseTo(b / 2, 5);
    expect(gutInstrumente(w, "getreide").some((i) => i.id === "quelle")).toBe(false);
  });

  test("Ohne Kapital (auch nach Überziehung) ist nichts möglich; Reserve gibt es nur für lagerfähige Güter", () => {
    const w = welt();
    w.spiel!.kapital = -UEBERZIEHUNG;
    expect(gutInstrumente(w, "getreide").every((i) => !i.moeglich)).toBe(true);
    expect(fuehreGutInstrumentAus(w, "getreide", "reserve").ok).toBe(false);
    expect(gutInstrumente(w, "elektronik").some((i) => i.id === "reserve")).toBe(RESERVE_KOSTEN.elektronik !== undefined);
  });
});

describe("Spielstand", () => {
  test("Alter Stand ohne Inventar: wird beim ersten Zugriff angelegt und läuft 24 Monate", () => {
    const w = welt();
    delete (w.spiel as unknown as { gueter?: unknown }).gueter;
    const kopie = JSON.parse(JSON.stringify(w)) as World;
    expect((kopie.spiel as unknown as { gueter?: unknown }).gueter).toBeUndefined();
    expect(() => advance(w, 730)).not.toThrow();
    const z = gueterZustand(w);
    expect(z.v).toBe(1);
    expect(z.verlauf.length).toBeGreaterThanOrEqual(23);
    expect(z.verlauf.length).toBeLessThanOrEqual(24);
    for (const s of gueterSicht(w)) expect(Number.isFinite(s.autarkie) && Number.isFinite(s.lager), s.def.id).toBe(true);
  });
});

describe("Linsen", () => {
  test("Ressourcen und Strategie färben Provinzen mit Vorkommen und Orten und haben Legende und Marken", () => {
    const w = welt();
    const r = farbenFuerEbene(w, "ressourcen", null, "p_wassermangel");
    expect(r.fill?.[26]).toBeDefined(); // Eskişehir: Bor
    expect(r.legende?.eintraege?.length).toBe(4);
    const s = farbenFuerEbene(w, "strategie", null, "p_wassermangel");
    expect(s.fill?.[34]).toBeDefined(); // Istanbul: Bosporus
    expect(s.legende?.hinweis).toMatch(/Zypern/);
    expect(ressourcenMarken()).toHaveLength(VORKOMMEN.length);
    expect(strategieMarken().find((m) => m.id === "so:zypern")!.artText).toMatch(/Kontrolle/);
  });
});

describe("Katalog", () => {
  test("gueter.json hat in allen drei Sprachen dieselben Schlüssel und deckt alle Gruppen", () => {
    const lade = (l: string) => JSON.parse(readFileSync(new URL(`../src/i18n/katalog/${l}/gueter.json`, import.meta.url), "utf8")) as Record<string, string>;
    const de = lade("de");
    for (const l of ["tr", "en"]) expect(Object.keys(lade(l)).sort()).toEqual(Object.keys(de).sort());
    for (const g of GUETER) {
      expect(de[`gueter.gut.${g.id}`], g.id).toBeDefined();
      expect(de[`gueter.art.${g.art}`], g.art).toBeDefined();
    }
  });
});
