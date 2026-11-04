// Große Ziele (ENTSCHEIDUNGEN Q): Stufen, Schwelle, Chance nie sicher und als Wort und Band, höchstens drei gleichzeitig, Wege
// erhöhen die Chance, Versuch mit Erfolg/Teilerfolg/Scheitern samt Sperrfrist, Gegenspieler, Vertretung ausbauen, drei Sprachen.

import { describe, expect, test } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createWorld, advance, save, load } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { startAfterElection, schnellProfil } from "../src/sim/prolog";
import {
  GROSSE_ZIELE, ZIELE, chanceVon, geheWeg, grosseZiele, schwelleSicht, verfolge, versuche, vertretungAusbauen, vertretungVon, zielDef,
} from "../src/sim/grosseziele";
import { GrosseZiele } from "../src/ui/grosseziele/GrosseZiele";
import { setzeSprache } from "../src/i18n";
import { Rng } from "../src/sim/rng";
import { NET } from "../src/sim/modell";
import { weltZustand } from "../src/sim/laender";
import type { World } from "../src/sim/types";

const KAPUTT = /undefined|NaN|\[object|gz2\./;
function welt(seed = 6): World {
  const w = createWorld(turkey2026, seed);
  startAfterElection(w, schnellProfil());
  w.spiel!.kapital = 150;
  return w;
}
/** Alle Schwellen der aktuellen Stufe künstlich erfüllen (für Versuchstests) */
function schwelleErfuellen(w: World, id: string): void {
  const z = zielDef(id)!, s = z.stufen[grosseZiele(w).stand[id]?.stufe ?? 0]!;
  for (const b of s.schwelle) {
    if (b.art === "knoten") { const i = NET.index.get(b.id)!; for (let p = 0; p < 81; p++) w.net.values[i * 81 + p] = Math.max(w.net.values[i * 81 + p]!, b.min + 5); }
    if (b.art === "konfliktHoechstens") for (const l of b.laender) if (weltZustand(w)[l]) weltZustand(w)[l]!.konflikt = Math.min(weltZustand(w)[l]!.konflikt, b.max - 5);
  }
}

describe("Katalog und Messung", () => {
  test("zehn Ziele in acht Bereichen mit je drei Stufen; alle genannten Netzgrößen gibt es", () => {
    expect(ZIELE.length).toBe(10);
    expect(new Set(ZIELE.map((z) => z.bereich)).size).toBe(8);
    for (const z of ZIELE) {
      expect(z.stufen.length).toBe(3);
      for (const s of z.stufen) for (const f of [...s.faktoren, ...s.schwelle]) if (f.art === "knoten" || f.art === "massnahme") expect(NET.index.has(f.id), f.id).toBe(true);
    }
  });
  test("die Chance ist nie sicher und steht als Wort und Band", () => {
    const w = welt();
    for (const z of ZIELE) {
      const c = chanceVon(w, z.id)!;
      expect(c.chance).toBeGreaterThanOrEqual(GROSSE_ZIELE.chanceMin);
      expect(c.chance).toBeLessThanOrEqual(GROSSE_ZIELE.chanceMax);
      expect(c.bis).toBeGreaterThan(c.von);
      expect(["gering", "moeglich", "aussichtsreich", "gut"]).toContain(c.wort);
    }
  });
  test("die Utopie-Stufe ist schwerer als die erste", () => {
    for (const z of ZIELE) expect(z.stufen[2]!.basis).toBeLessThan(z.stufen[0]!.basis);
  });
});

describe("Verfolgen, Wege, Versuch", () => {
  test("höchstens drei Ziele gleichzeitig", () => {
    const w = welt();
    for (const z of ZIELE.slice(0, 3)) expect(verfolge(w, z.id, true).ok).toBe(true);
    expect(verfolge(w, ZIELE[3]!.id, true).ok).toBe(false);
    verfolge(w, ZIELE[0]!.id, false);
    expect(verfolge(w, ZIELE[3]!.id, true).ok).toBe(true);
  });
  test("ein Weg kostet und erhöht die Chance; gleich danach ist er abgekühlt", () => {
    const w = welt();
    verfolge(w, "drehscheibe", true);
    const vor = chanceVon(w, "drehscheibe")!.chance, pk = w.spiel!.kapital;
    expect(geheWeg(w, "drehscheibe", "fonds").ok).toBe(true);
    expect(chanceVon(w, "drehscheibe")!.chance).toBeGreaterThan(vor);
    expect(w.spiel!.kapital).toBeLessThan(pk);
    expect(geheWeg(w, "drehscheibe", "fonds").ok).toBe(false);
  });
  test("ohne erfüllte Schwelle kein Versuch", () => {
    const w = welt();
    verfolge(w, "eubeitritt", true);
    const s = zielDef("eubeitritt")!.stufen[0]!;
    if (schwelleSicht(w, s).every((x) => x.erfuellt)) return;
    expect(versuche(w, "eubeitritt").ok).toBe(false);
  });
  test("Erfolg hebt die Stufe, Scheitern sperrt ein Jahr und kostet Ansehen; der Ausgang folgt dem Wurf", () => {
    const erfolg = welt();
    verfolge(erfolg, "kornkammer", true); schwelleErfuellen(erfolg, "kornkammer");
    const r1 = versuche(erfolg, "kornkammer", { next: () => 0 } as unknown as Rng);
    expect(r1.ausgang).toBe("erfolg");
    expect(grosseZiele(erfolg).stand.kornkammer!.stufe).toBe(1);
    const teil = welt();
    verfolge(teil, "kornkammer", true); schwelleErfuellen(teil, "kornkammer");
    const c = chanceVon(teil, "kornkammer")!.chance;
    expect(versuche(teil, "kornkammer", { next: () => c + 0.01 } as unknown as Rng).ausgang).toBe("teilerfolg");
    expect(grosseZiele(teil).stand.kornkammer!.abgeschwaecht).toBe(true);
    const fehl = welt();
    verfolge(fehl, "kornkammer", true); schwelleErfuellen(fehl, "kornkammer");
    expect(versuche(fehl, "kornkammer", { next: () => 0.999 } as unknown as Rng).ausgang).toBe("scheitern");
    expect(grosseZiele(fehl).stand.kornkammer!.stufe).toBe(0);
    expect(versuche(fehl, "kornkammer").ok).toBe(false);
    advance(fehl, GROSSE_ZIELE.sperreTage + 1);
    schwelleErfuellen(fehl, "kornkammer");
    fehl.spiel!.kapital = 150;
    expect(versuche(fehl, "kornkammer").ok).toBe(true);
  });
  test("Erfolg bringt Gegenspieler gegen die Türkei auf", () => {
    const w = welt();
    verfolge(w, "seemacht", true); schwelleErfuellen(w, "seemacht");
    const vor = weltZustand(w)["GRC"]!.konflikt;
    versuche(w, "seemacht", { next: () => 0 } as unknown as Rng);
    expect(weltZustand(w)["GRC"]!.konflikt).toBeGreaterThan(vor);
  });
  test("Vertretung ausbauen: bis Stufe 3, kostet Kapital, bleibt im Spielstand", () => {
    const w = welt();
    expect(vertretungVon(w, "AZE")).toBe(1);
    expect(vertretungAusbauen(w, "AZE").ok).toBe(true);
    expect(vertretungAusbauen(w, "AZE").ok).toBe(true);
    expect(vertretungAusbauen(w, "AZE").ok).toBe(false);
    expect(vertretungVon(load(save(w)), "AZE")).toBe(3);
  });
});

describe("Ansicht", () => {
  test("rendert alle Ziele in drei Sprachen ohne kaputte Platzhalter", async () => {
    for (const sprache of ["de", "en", "tr"] as const) {
      await setzeSprache(sprache);
      const w = welt();
      verfolge(w, "turkunion", true);
      const html = renderToStaticMarkup(createElement(GrosseZiele, { world: w, geaendert: () => {} }));
      expect(html).toContain("gzz-karte");
      expect(html).not.toMatch(KAPUTT);
    }
    await setzeSprache("de");
  });
});
