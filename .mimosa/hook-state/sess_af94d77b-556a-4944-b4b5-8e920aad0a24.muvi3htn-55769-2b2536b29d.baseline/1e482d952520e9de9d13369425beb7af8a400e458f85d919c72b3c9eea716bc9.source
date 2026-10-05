// Außenlage als Zustand (sim/diplomatie.ts): Bestände, Anker, Instrumente mit Vorschau, Vorwarnungen, Sanktionen, Vertragsbruch,
// Wirkungsberichte, Speicherkompatibilität und Katalog.

import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { createWorld, advance } from "../src/sim/world";
import { addDays } from "../src/sim/dates";
import { turkey2026 } from "../src/sim/scenario";
import { startAfterElection, schnellProfil } from "../src/sim/prolog";
import { weltZustand } from "../src/sim/laender";
import { weltModell, weltModellMonat } from "../src/sim/welt-modell";
import {
  AUSSEN,
  aussenBerichte,
  aussenLage,
  aussenMonat,
  aussenTermine,
  aussenZustand,
  fuehreInstrumentAus,
  instrumente,
  konfliktAnker,
  vorschau,
  vorwarnungen,
} from "../src/sim/diplomatie";
import "../src/sim/welt-ereignisse";
import { platzhalter } from "../src/i18n";
import type { World } from "../src/sim/types";

function welt(seed = 6): World {
  const w = createWorld(turkey2026, seed);
  startAfterElection(w, schnellProfil());
  w.spiel!.ereignisse = [];
  w.spiel!.kapital = 200;
  return w;
}

/** Einen Monatsschritt der Außenlage erzwingen (Monat wird neu gesetzt). */
function monat(w: World): void {
  const a = aussenZustand(w);
  a.monat = "";
  w.date = addDays(w.date, 31);
  w.day += 31;
  aussenMonat(w, weltModell(w));
}

describe("Zustand", () => {
  test("entsteht beim ersten Zugriff mit belegten Startwerten", () => {
    const w = welt();
    const a = aussenZustand(w);
    expect(a.flucht.bestand).toBe(AUSSEN.fluchtStart);
    expect(Object.values(a.energie.anteile).reduce((x, y) => x + y, 0)).toBe(100);
    expect(a.energie.anteile.IRN).toBe(0);
  });

  test("liegt im Weltmodell und überlebt JSON (Spielstand)", () => {
    const w = welt();
    aussenZustand(w).flucht.bestand = 2.4;
    const kopie = JSON.parse(JSON.stringify(w)) as World;
    expect(aussenZustand(kopie).flucht.bestand).toBe(2.4);
  });

  test("ältere Stände ohne Außenlage laden und laufen weiter", () => {
    const w = welt();
    delete weltModell(w).aussen;
    expect(() => advance(w, 70)).not.toThrow();
    expect(aussenZustand(w).verlauf.length).toBeGreaterThan(0);
  });
});

describe("Monatsschritt", () => {
  test("Krieg in Syrien treibt die Flucht, Stabilität bringt Rückkehr", () => {
    const w = welt();
    const syr = weltModell(w).laender["SYR"]!;
    syr.krieg = 80;
    syr.stabilitaet = 20;
    for (let i = 0; i < 6; i++) monat(w);
    const nachKrieg = aussenZustand(w).flucht.bestand;
    expect(nachKrieg).toBeGreaterThan(AUSSEN.fluchtStart);
    syr.krieg = 0;
    syr.stabilitaet = 90;
    delete syr.krise;
    const m = weltModell(w);
    m.laender["IRN"]!.stabilitaet = 60;
    m.laender["IRN"]!.krieg = 0;
    m.laender["IRQ"]!.krieg = 0;
    delete m.laender["IRQ"]!.krise;
    for (let i = 0; i < 12; i++) monat(w);
    expect(aussenZustand(w).flucht.bestand).toBeLessThan(nachKrieg);
  });

  test("Geflüchtete kosten den Haushalt; ein EU-Programm halbiert die Kosten", () => {
    const w = welt();
    monat(w);
    const ohne = aussenZustand(w).flucht.kostenJahr;
    expect(ohne).toBeGreaterThan(0);
    aussenZustand(w).bis.euHilfe = w.day + 400;
    monat(w);
    expect(aussenZustand(w).flucht.kostenJahr).toBeLessThan(ohne * 0.6);
  });

  test("Verträge und Kurs setzen den Konflikt-Anker statt des Startwerts", () => {
    const w = welt();
    const m = weltModell(w);
    m.laender["GRC"]!.kurs = -1;
    expect(konfliktAnker(w, "GRC")).toBeGreaterThan(0);
    m.laender["GRC"]!.kurs = 1;
    expect(konfliktAnker(w, "GRC")).toBeLessThan(0);
    monat(w);
    expect(weltZustand(w)["GRC"]!.anker).toBeLessThan(0);
  });

  test("anhaltender Streit mit Washington führt nach Vorwarnung zu Sanktionen, Entspannung hebt sie auf", () => {
    const w = welt();
    weltZustand(w)["USA"]!.konflikt = 90;
    weltZustand(w)["USA"]!.anker = 50;
    for (let i = 0; i < 4; i++) {
      weltZustand(w)["USA"]!.konflikt = 90;
      monat(w);
    }
    expect(aussenZustand(w).sanktionen.some((s) => s.id === "caatsa")).toBe(true);
    expect(w.spiel!.hinweise.some((h) => h.id.startsWith("aussen-sanktion-droht-caatsa"))).toBe(true);
    for (let i = 0; i < 7; i++) {
      weltZustand(w)["USA"]!.konflikt = 30;
      monat(w);
    }
    expect(aussenZustand(w).sanktionen.some((s) => s.id === "caatsa")).toBe(false);
  });

  test("Partner können Verträge brechen, wenn das Vertrauen zerfällt", () => {
    const w = welt();
    // Der Mekka-Pakt mit Saudi-Arabien läuft beim Start
    const welt0 = weltZustand(w)["SAU"]!;
    welt0.versatz = -60;
    let gebrochen = false;
    for (let i = 0; i < 60 && !gebrochen; i++) {
      monat(w);
      gebrochen = (weltZustand(w)["SAU"]!.vertraege ?? []).some((v) => v.status === "gebrochen");
    }
    expect(gebrochen).toBe(true);
  });

  test("Winterprüfung: zu wenig Versorgung warnt im November und schlägt im Januar zu", () => {
    const w = welt();
    const a = aussenZustand(w);
    a.energie.anteile = { RUS: 70, AZE: 5, LNG: 25, IRN: 0, HEIM: 0 };
    weltZustand(w)["RUS"]!.konflikt = 100;
    w.date = "2029-10-05";
    monat(w);
    expect(a.energie.versorgung).toBeLessThan(45);
    expect(w.spiel!.hinweise.some((h) => h.id.startsWith("aussen-winter-warn"))).toBe(true);
    w.date = "2029-12-05";
    monat(w);
    expect(w.spiel!.hinweise.some((h) => h.id.startsWith("aussen-winter-2030"))).toBe(true);
  });

  test("Verlauf wächst monatlich und ist auf 60 Monate begrenzt", () => {
    const w = welt();
    for (let i = 0; i < 65; i++) monat(w);
    expect(aussenZustand(w).verlauf.length).toBe(60);
  });
});

describe("Instrumente", () => {
  test("Staatsbesuch kostet, wirkt nach Tagesordnung und hat Abkühlzeit", () => {
    const w = welt();
    const k0 = w.spiel!.kapital;
    const vorher = weltZustand(w)["AZE"]!.handel;
    const r = fuehreInstrumentAus(w, "staatsbesuch", "AZE", "energie");
    expect(r.ok).toBe(true);
    expect(w.spiel!.kapital).toBe(k0 - AUSSEN.pk.staatsbesuch);
    expect(aussenZustand(w).energie.anteile.AZE).toBeGreaterThan(AUSSEN.anteileStart.AZE);
    expect(weltZustand(w)["AZE"]!.handel).toBeGreaterThan(vorher);
    expect(fuehreInstrumentAus(w, "staatsbesuch", "AZE", "handel").ok).toBe(false);
  });

  test("jede Vorschau nennt Folgen, ohne zu handeln", () => {
    const w = welt();
    for (const i of instrumente(w)) {
      const f = vorschau(w, i.id, i.laender[0], "handel");
      expect(f.length).toBeGreaterThan(0);
      for (const x of f) expect(x.text).not.toMatch(/⟦|\{/);
    }
    expect(w.spiel!.kapital).toBe(200);
  });

  test("Botschafter abberufen und zurückschicken; Sanktionen verhängen und aufheben", () => {
    const w = welt();
    expect(fuehreInstrumentAus(w, "botschafter_ab", "GRC").ok).toBe(true);
    expect(aussenZustand(w).abberufen).toContain("GRC");
    expect(konfliktAnker(w, "GRC")).toBeGreaterThan(-25);
    expect(fuehreInstrumentAus(w, "botschafter_zurueck", "GRC").ok).toBe(true);
    expect(fuehreInstrumentAus(w, "sanktion", "SYR").ok).toBe(true);
    expect(aussenZustand(w).eigeneSanktionen).toContain("SYR");
    expect(fuehreInstrumentAus(w, "sanktion_aufheben", "SYR").ok).toBe(true);
  });

  test("ohne Kapital gesperrt, mit Grund", () => {
    const w = welt();
    w.spiel!.kapital = -30;
    const i = instrumente(w).find((x) => x.id === "friedensschritt")!;
    expect(i.moeglich).toBe(false);
    expect(i.grund).toBeTruthy();
  });

  test("Wirkungsbericht nach 6 und 12 Monaten", () => {
    const w = welt();
    fuehreInstrumentAus(w, "grenzsicherung");
    expect(aussenBerichte(w)[0]!.stand).toBe("offen");
    w.day += 160;
    monat(w);
    expect(aussenBerichte(w)[0]!.stand).toBe("6");
    w.day += 170;
    monat(w);
    expect(aussenBerichte(w)[0]!.stand).toBe("12");
    expect(aussenBerichte(w)[0]!.zeilen.length).toBeGreaterThan(0);
  });

  test("Friedensschritte führen über Monate in neue Phasen", () => {
    const w = welt();
    const a = aussenZustand(w);
    const start = a.friedens.phase;
    for (let i = 0; i < 12; i++) {
      w.spiel!.kapital = 200;
      fuehreInstrumentAus(w, "friedensschritt");
      monat(w);
    }
    expect(a.friedens.phase).toBeGreaterThan(start);
  });
});

describe("Lesefunktionen", () => {
  test("Lage, Vorwarnungen und Termine", () => {
    const w = welt();
    monat(w);
    const l = aussenLage(w);
    expect(l.kennzahlen).toHaveLength(6);
    aussenZustand(w).energie.hormus = "geschlossen";
    expect(vorwarnungen(w).some((v) => v.id === "hormus")).toBe(true);
    const t = aussenTermine(w);
    expect(t.length).toBeGreaterThanOrEqual(3);
    for (const x of t) expect(x.tage).toBeGreaterThanOrEqual(0);
  });

  test("Weltmodell-Monat ruft die Außenlage", () => {
    const w = welt();
    const m = weltModell(w);
    m.monat = "";
    weltModellMonat(w);
    expect(aussenZustand(w).monat).toBe(w.date.slice(0, 7));
  });
});

describe("Katalog", () => {
  const lade = (l: string) => JSON.parse(readFileSync(new URL(`../src/i18n/katalog/${l}/aussen.json`, import.meta.url), "utf-8")) as Record<string, string>;
  test("Deutsch, Türkisch und Englisch haben dieselben Schlüssel und Platzhalter", () => {
    const de = lade("de");
    for (const l of ["tr", "en"]) {
      const x = lade(l);
      expect(Object.keys(x).sort()).toEqual(Object.keys(de).sort());
      for (const k of Object.keys(de)) expect(platzhalter(x[k]!)).toEqual(platzhalter(de[k]!));
    }
  });
});
