// Streitkräfte als Bestand (sim/streitkraefte.ts, data/streitkraefte.ts):
//   - Startbestand mit Index 1 (Kalibrierung unverändert), belegte Zahlen, laufende Beschaffungen
//   - Ausbau: Kauf liefert, Sanktion sperrt und stoppt, Kapazität aus dem Verteidigungsetat, Entwicklung hängt an der Wissensbasis
//   - Wehrdienst, Ausmustern, Erhalt bei zu kleinem Etat
//   - Wirkung auf die Kriegsstärke und Zielräume auf die Gegenwehr
//   - Migration alter Spielstände (der Stand vom 20.11.2029 wird nur GELESEN), Katalog in drei Sprachen

import { describe, expect, test } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { createWorld, advance, load } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { startAfterElection, schnellProfil } from "../src/sim/prolog";
import type { World } from "../src/sim/types";
import {
  STREITKRAEFTE,
  beginneAusbau,
  bestandsFaktor,
  etatFaktor,
  innovationsGrenze,
  kampfkraftIndex,
  mustereAus,
  setzeEtatQuelle,
  setzeInnovationsQuelle,
  setzeWehrdienst,
  streitkraefte,
  streitkraefteMonat,
  vorschauAusbau,
} from "../src/sim/streitkraefte";
import { GATTUNGEN, START_BESCHAFFUNGEN, ZIELRAEUME } from "../src/data/streitkraefte";
import { aussenZustand } from "../src/sim/diplomatie";
import { gegnerStaerke, kriegMit, kriegMonat, waehleZielraum, zielraeumeFuer, eigenStaerke } from "../src/sim/krieg";
import { weltZustand } from "../src/sim/laender";
import { Rng } from "../src/sim/rng";
import de from "../src/i18n/katalog/de/militaer.json";
import tr from "../src/i18n/katalog/tr/militaer.json";
import en from "../src/i18n/katalog/en/militaer.json";

function welt(seed = 6): World {
  const w = createWorld(turkey2026, seed);
  startAfterElection(w, schnellProfil());
  w.spiel!.ereignisse = [];
  w.spiel!.kapital = 120;
  return w;
}

describe("Startbestand", () => {
  test("Index 1 beim Start, belegte Zahlen, laufende Beschaffungen aus der Recherche", () => {
    const w = welt();
    const z = streitkraefte(w);
    expect(kampfkraftIndex(w, z)).toBeCloseTo(1, 2);
    expect(bestandsFaktor(w)).toBeCloseTo(1, 2);
    expect(z.gattungen.kampfflugzeuge.menge).toBe(235);
    expect(z.gattungen.personal.menge).toBeGreaterThan(400_000);
    expect(z.laufend.length).toBe(START_BESCHAFFUNGEN.length);
    expect(z.wehrdienst).toBe(6);
    for (const g of GATTUNGEN) {
      expect(g.generation).toBeGreaterThanOrEqual(1);
      expect(g.generation).toBeLessThanOrEqual(5);
      expect(g.quelle.length).toBeGreaterThan(5);
    }
  });

  test("Etat und Wissensbasis stehen beim Start auf ihrem Bezugswert", () => {
    const w = welt();
    expect(etatFaktor(w)).toBeCloseTo(1, 2);
    expect(innovationsGrenze(w)).toBeCloseTo(0.5, 1);
  });
});

describe("Ausbau", () => {
  test("Kauf kostet Kapital, braucht Zeit und hebt bei Lieferung Bestand und Generation", () => {
    const w = welt();
    const z = streitkraefte(w);
    z.laufend = [];
    const vorher = { ...z.gattungen.panzer };
    const v = vorschauAusbau(w, "panzer", "kauf");
    expect(v.ok).toBe(true);
    const kapital = w.spiel!.kapital;
    expect(beginneAusbau(w, "panzer", "kauf").ok).toBe(true);
    expect(w.spiel!.kapital).toBe(kapital - v.pk);
    for (let i = 0; i < v.monate + 1; i++) {
      w.day += 30;
      streitkraefteMonat(w, false);
    }
    expect(z.gattungen.panzer.menge).toBeGreaterThan(vorher.menge);
    expect(z.gattungen.panzer.generation).toBeGreaterThan(vorher.generation);
    expect(z.gattungen.panzer.heimisch).toBeLessThan(vorher.heimisch);
  });

  test("Sanktionen des Lieferlands sperren den Kauf und halten laufende Lieferungen auf", () => {
    const w = welt();
    aussenZustand(w).sanktionen.push({ id: "caatsa", von: "USA", seit: w.day });
    const v = vorschauAusbau(w, "kampfflugzeuge", "kauf");
    expect(v.ok).toBe(false);
    const z = streitkraefte(w);
    const f16 = z.laufend.find((b) => b.name?.startsWith("F-16"))!;
    const fertig = f16.fertig;
    streitkraefteMonat(w, false);
    expect(f16.fertig).toBe(fertig + 30);
    expect(w.spiel!.hinweise.some((h) => h.id.startsWith("militaer-lieferstopp"))).toBe(true);
  });

  test("Mehr Verteidigungsetat erlaubt mehr Vorhaben zugleich, weniger Etat verzögert", () => {
    const w = welt();
    const z = streitkraefte(w);
    setzeEtatQuelle(() => 0.5);
    try {
      const kap = Math.round(STREITKRAEFTE.kapazitaet * 0.5);
      for (let i = 0; i < kap; i++) expect(beginneAusbau(w, (["drohnen", "raketen", "munition"] as const)[i]!, "produktion").ok).toBe(true);
      expect(vorschauAusbau(w, "marine", "produktion").ok).toBe(false);
      setzeEtatQuelle(() => 1.5);
      expect(vorschauAusbau(w, "marine", "produktion").ok).toBe(true);
      expect(beginneAusbau(w, "marine", "produktion").ok).toBe(true);
      // Der Etat sinkt wieder: das jüngste Vorhaben über der Kapazität verschiebt sich
      setzeEtatQuelle(() => 0.5);
      const marine = z.laufend.find((b) => b.gattung === "marine" && !b.name)!;
      const fertig = marine.fertig;
      streitkraefteMonat(w, false);
      expect(marine.fertig).toBe(fertig + 30);
    } finally {
      setzeEtatQuelle(null);
    }
  });

  test("Zu wenig Etat für den Erhalt mustert nach einigen Monaten altes Gerät aus", () => {
    const w = welt();
    const z = streitkraefte(w);
    z.laufend = [];
    setzeEtatQuelle(() => 0.6);
    try {
      const vorher = kampfkraftIndex(w, z);
      for (let i = 0; i < STREITKRAEFTE.erhaltMonate; i++) streitkraefteMonat(w, false);
      expect(kampfkraftIndex(w, z)).toBeLessThan(vorher);
    } finally {
      setzeEtatQuelle(null);
    }
  });

  test("Entwicklung: hohe Wissensbasis ist schneller und sicherer als keine", () => {
    const w = welt();
    setzeInnovationsQuelle(() => 1);
    const gut = vorschauAusbau(w, "drohnen", "entwicklung");
    setzeInnovationsQuelle(() => 0);
    const schlecht = vorschauAusbau(w, "drohnen", "entwicklung");
    setzeInnovationsQuelle(null);
    expect(gut.monate).toBeLessThan(schlecht.monate);
    expect(gut.risiko!).toBeLessThan(schlecht.risiko!);
    expect(gut.generation).toBe(5);
  });

  test("Wehrdienst und Ausmustern ändern den Bestand", () => {
    const w = welt();
    const z = streitkraefte(w);
    const personal = z.gattungen.personal.menge;
    expect(setzeWehrdienst(w, 12).ok).toBe(true);
    expect(z.gattungen.personal.menge).toBeGreaterThan(personal);
    expect(setzeWehrdienst(w, 12).ok).toBe(false);
    const panzer = z.gattungen.panzer.menge;
    expect(mustereAus(w, "panzer").ok).toBe(true);
    expect(z.gattungen.panzer.menge).toBeLessThan(panzer);
  });
});

describe("Krieg: Bestand und Zielraum", () => {
  test("Mehr Bestand hebt die eigene Stärke, ein schwerer Zielraum die Gegenwehr", () => {
    const w = welt();
    weltZustand(w)["GRC"]!.konflikt = 80;
    kriegMonat(w, new Rng(1));
    const k = kriegMit(w, "GRC")!;
    expect(k).toBeTruthy();
    const e0 = eigenStaerke(w, k);
    streitkraefte(w).gattungen.kampfflugzeuge.menge *= 1.5;
    expect(eigenStaerke(w, k)).toBeGreaterThan(e0);
    const g0 = gegnerStaerke(w, "GRC");
    const leicht = zielraeumeFuer("GRC").sort((a, b) => a.schwierigkeit - b.schwierigkeit);
    expect(waehleZielraum(w, k.id, leicht.at(-1)!.id).ok).toBe(true);
    expect(gegnerStaerke(w, "GRC")).toBeGreaterThan(g0);
    expect(waehleZielraum(w, k.id, "syr_tief").ok).toBe(false);
  });

  test("Jeder Zielraum hat einen Namen und plausible Werte", () => {
    for (const z of ZIELRAEUME) {
      expect(de[`militaer.zielraum.${z.id}` as keyof typeof de]).toBeTruthy();
      expect(z.schwierigkeit).toBeGreaterThanOrEqual(0.6);
      expect(z.schwierigkeit).toBeLessThanOrEqual(1.4);
      expect([1, 2, 3]).toContain(z.bedeutung);
    }
  });
});

describe("Katalog", () => {
  test("Gleiche Schlüssel und Platzhalter in Deutsch, Türkisch, Englisch", () => {
    const platz = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(",");
    expect(Object.keys(tr).sort()).toEqual(Object.keys(de).sort());
    expect(Object.keys(en).sort()).toEqual(Object.keys(de).sort());
    for (const [k, v] of Object.entries(de)) {
      expect(platz((tr as Record<string, string>)[k]!), k).toBe(platz(v));
      expect(platz((en as Record<string, string>)[k]!), k).toBe(platz(v));
    }
  });
});

describe("Speicherkompatibilität", () => {
  const datei = `${homedir()}/Downloads/staatsraeson_2029-11-20.json`;

  test.skipIf(!existsSync(datei))("Der Stand vom 20.11.2029 bekommt passenden Bestand und läuft 24 Monate (Datei nur gelesen)", () => {
    const d = JSON.parse(readFileSync(datei, "utf8")) as { welt: unknown };
    const w = load(JSON.stringify(d.welt));
    expect(w.spiel!.streitkraefte).toBeUndefined();
    const z = streitkraefte(w);
    expect(z.v).toBe(1);
    const idx = kampfkraftIndex(w, z);
    expect(idx).toBeGreaterThan(0.5);
    expect(idx).toBeLessThan(1.6);
    for (let i = 0; i < 24; i++) {
      advance(w, 30);
      w.spiel!.ereignisse = [];
      if (w.spiel!.ende) break;
    }
    expect(Number.isFinite(bestandsFaktor(w))).toBe(true);
    for (const g of GATTUNGEN) expect(Number.isFinite(streitkraefte(w).gattungen[g.id].menge)).toBe(true);
  });

  test("Ein Stand ohne Streitkräfte legt sie beim ersten Zugriff an", () => {
    const w = welt();
    delete w.spiel!.streitkraefte;
    const z = streitkraefte(w);
    expect(w.spiel!.streitkraefte).toBe(z);
    expect(kampfkraftIndex(w, z)).toBeCloseTo(1, 1);
  });
});
