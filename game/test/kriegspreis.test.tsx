// Der Preis eines Krieges (sim/kriegspreis.ts) und die Grenzen der Gegenwehr (sim/krieg.ts GEGNER_OFFENSIVE): Müdigkeit und Gefallene,
// Sanktionen nach einem Angriff auf ein EU-Mitglied, kein Krieg mit dem Westen aus dem Kriegspreis, ältere Spielstände, Kriegstexte in drei Sprachen.

import { afterAll, describe, expect, test } from "vitest";
import { createWorld, advance } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { startAfterElection, schnellProfil } from "../src/sim/prolog";
import { GEGNER_OFFENSIVE, KRIEG, fuehreKriegHandlungAus, handlungenFuer, kriegMit, kriegMonat } from "../src/sim/krieg";
import { PREIS, kriegspreisWoche } from "../src/sim/kriegspreis";
import { aussenZustand } from "../src/sim/diplomatie";
import { weltZustand } from "../src/sim/laender";
import { NET } from "../src/sim/modell";
import { nationalAverage } from "../src/sim/netz";
import { Rng } from "../src/sim/rng";
import { setzeSprache } from "../src/i18n";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { KriegDossier } from "../src/ui/welt/KriegDossier";
import type { World } from "../src/sim/types";
import type { KriegVorgang } from "../src/sim/krieg-typen";

function welt(seed = 6): World {
  const w = createWorld(turkey2026, seed);
  startAfterElection(w, schnellProfil());
  w.spiel!.ereignisse = [];
  w.spiel!.kapital = 200;
  w.parliament!.seats = { [w.player!.partei.kurz]: 400 };
  return w;
}

function krieg(w: World, landId: string): KriegVorgang {
  weltZustand(w)[landId]!.konflikt = 80;
  kriegMonat(w, new Rng(1));
  const k = kriegMit(w, landId)!;
  k.eskalation = 80;
  advance(w, 1);
  fuehreKriegHandlungAus(w, k.id, "ziel_verteidigung");
  fuehreKriegHandlungAus(w, k.id, "beschluss");
  advance(w, KRIEG.beschlussTage);
  expect(k.phase).toBe("krieg");
  w.spiel!.ereignisse = [];
  return k;
}

/** Bis zur nächsten Kriegswoche vorspulen. */
function woche(w: World, k: KriegVorgang): void {
  k.seit = w.day - 6;
  advance(w, 1);
}

afterAll(async () => {
  await setzeSprache("de");
});

describe("Kriegspreis", () => {
  test("Angriff auf Griechenland: die EU verhängt nach wenigen Wochen Handelssanktionen, ohne dass ein Konflikt mit der EU entsteht", () => {
    const w = welt();
    const k = krieg(w, "GRC");
    for (let i = 0; i < 5 && k.phase === "krieg"; i++) woche(w, k);
    expect(aussenZustand(w).sanktionen.some((s) => s.id === "eu_handel")).toBe(true);
    expect(weltZustand(w)["EU"]!.konflikt).toBeLessThan(KRIEG.anlageAb);
    expect(kriegMit(w, "EU")).toBeUndefined();
  });

  test("Gefallene zählen mit, die Müdigkeit wächst mit der Dauer und senkt das Vertrauen in die Regierung", () => {
    const w = welt();
    const k = krieg(w, "SYR");
    k.letzteWoche = { eigen: 0.5, gegner: 0.5 };
    k.woche = 10;
    const vorher = nationalAverage(NET, w.net, "vertrauen_regierung");
    kriegspreisWoche(w, k, 30);
    expect(k.gefallene).toBe(Math.round(0.5 * PREIS.gefalleneJeProzent));
    expect(nationalAverage(NET, w.net, "vertrauen_regierung")).toBeLessThan(vorher);
  });

  test("ältere Spielstände ohne Gefallenenzähler laufen weiter und zählen ab der nächsten Woche", () => {
    const w = welt();
    const k = krieg(w, "SYR");
    delete k.gefallene;
    woche(w, k);
    expect(Number.isFinite(k.gefallene ?? 0)).toBe(true);
    expect(k.gefallene ?? 0).toBeGreaterThanOrEqual(0);
  });

  test("Griechenland kann eine gescheiterte Landung kaum ins türkische Festland verlängern: der Gegenstoß ist gedämpft", () => {
    const w1 = welt();
    const k1 = krieg(w1, "GRC");
    k1.front = 30;
    woche(w1, k1);
    const verlustGrc = 30 - k1.front;
    expect(GEGNER_OFFENSIVE.GRC).toBeLessThan(1);
    expect(verlustGrc).toBeLessThan(KRIEG.frontMaxDelta * GEGNER_OFFENSIVE.GRC! + 0.01);
  });
});

describe("Kriegstexte in drei Sprachen", () => {
  test("Handlungen und Lagebild ohne deutsche Wörter auf Türkisch und Englisch", async () => {
    const w = welt();
    weltZustand(w)["GRC"]!.konflikt = 80;
    kriegMonat(w, new Rng(1));
    const k = kriegMit(w, "GRC")!;
    k.eskalation = 80;
    advance(w, 1);
    const deutsch = /\b(der|die|das|und|mit|gegen|Krieg|Waffenruhe|Kapital)\b/;
    for (const s of ["tr", "en"] as const) {
      await setzeSprache(s);
      const hs = handlungenFuer(w, k.id);
      expect(hs.length).toBeGreaterThan(3);
      for (const h of hs) {
        expect(h.label, `${s}:${h.id}`).not.toMatch(deutsch);
        expect(h.hinweis, `${s}:${h.id}`).not.toMatch(deutsch);
      }
    }
    await setzeSprache("de");
    expect(handlungenFuer(w, k.id).find((h) => h.id === "signal")?.label).toBe("Abschreckungs-Signal senden");
  });

  test("das Konflikt-Dossier im Krieg ohne deutsche Sätze auf Türkisch und Englisch", async () => {
    const w = welt();
    const k = krieg(w, "SYR");
    woche(w, k);
    const deutsch = /\b(der|die|das|und|mit|gegen|seit|Woche|Verluste|Eskalation|Lagebild|Stärke)\b/;
    for (const s of ["tr", "en"] as const) {
      await setzeSprache(s);
      const html = renderToStaticMarkup(createElement(KriegDossier, { world: w, landId: "SYR", refresh: () => {} }));
      const text = html.replace(/<[^>]+>/g, " ");
      expect(text, s).not.toMatch(/krieg\.[a-z_]+\.[a-z_.]+|undefined|NaN/);
      const treffer = text.match(deutsch);
      expect(treffer?.[0] ?? "", `${s}: ${text.slice(Math.max(0, (treffer?.index ?? 0) - 60), (treffer?.index ?? 0) + 60)}`).toBe("");
    }
    await setzeSprache("de");
  });
});
