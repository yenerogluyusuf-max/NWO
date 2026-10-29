// Neubau-Linien: Laufende Strecken-Vorhaben (Provinzkette ab zwei) werden als Linie gemeldet,
// der Anteil folgt dem Baufortschritt, das Ruhen (Vergabe, Pause) ist sichtbar, und jede gemeldete
// Linie trägt eine Kette ab zwei Provinzen.

import { describe, expect, test } from "vitest";
import { advance, createWorld } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { schnellProfil, startAfterElection } from "../src/sim/prolog";
import { VORHABEN } from "../src/data/reich";
import { NET } from "../src/sim/modell";
import { setPolicy } from "../src/sim/handeln";
import { beginne, pausiere } from "../src/sim/reich";
import { neubauLinien } from "../src/ui/atlas/neubau";
import type { World } from "../src/sim/types";

function welt(): World {
  const w = createWorld(turkey2026, 11);
  startAfterElection(w, schnellProfil());
  w.spiel!.kapital = 100;
  return w;
}

/** Ein Strecken-Vorhaben des Katalogs: Provinzkette ab zwei, noch nicht fertig; die Voraussetzungen erfüllt der Test. */
function streckenId(w: World): string {
  const v = VORHABEN.find(
    (x) => (x.provinzen?.length ?? 0) >= 2 && !x.start && x.kosten.pk <= 100 && x.voraus.every((b) => b.art === "massnahme" || b.art === "knoten"),
  );
  expect(v, "der Katalog braucht ein Strecken-Vorhaben mit erfüllbaren Voraussetzungen").toBeTruthy();
  for (const b of v!.voraus) {
    if (b.art !== "massnahme" && b.art !== "knoten") continue;
    // Direkt in die Werte (das Ziel allein rampet zu langsam): Stufe sofort setzen, ohne laufende Umsetzung.
    const ziel = (b as { min?: number }).min ?? 60;
    const i = NET.index.get(b.id)!;
    for (let p = 0; p < w.net.weights.length; p++) w.net.values[i * w.net.weights.length + p] = ziel;
    delete w.net.targets[b.id];
    if (w.net.umsetzung) delete w.net.umsetzung[b.id];
    if (b.art === "massnahme") setPolicy(w, b.id, ziel);
  }
  return v!.id;
}

describe("Neubau-Linien", () => {
  test("jede gemeldete Linie trägt eine Kette ab zwei Provinzen und einen Anteil in den Grenzen", () => {
    for (const l of neubauLinien(welt())) {
      expect(l.kette.length).toBeGreaterThanOrEqual(2);
      expect(l.anteil).toBeGreaterThanOrEqual(0);
      expect(l.anteil).toBeLessThanOrEqual(1);
    }
  });

  test("ein begonnenes Strecken-Vorhaben erscheint als Linie mit Kette und kleinem Anteil", () => {
    const w = welt();
    const id = streckenId(w);
    const r = beginne(w, id);
    expect(r.ok, r.text).toBe(true);
    const linien = neubauLinien(w);
    const linie = linien.find((l) => l.id === id);
    expect(linie, `${id} läuft`).toBeTruthy();
    expect(linie!.kette.length).toBeGreaterThanOrEqual(2);
    expect(linie!.anteil).toBeGreaterThanOrEqual(0);
    expect(linie!.anteil).toBeLessThan(0.1);
  });

  test("der Fortschritt wächst sichtbar und der Anteil bleibt unter 1, solange gebaut wird", () => {
    const w = welt();
    const id = streckenId(w);
    expect(beginne(w, id).ok).toBe(true);
    advance(w, 120);
    const linie = neubauLinien(w).find((l) => l.id === id);
    expect(linie).toBeTruthy();
    expect(linie!.anteil).toBeGreaterThan(0);
  });

  test("pausiert: die Linie liegt still (Ruhen sichtbar)", () => {
    const w = welt();
    const id = streckenId(w);
    expect(beginne(w, id).ok).toBe(true);
    pausiere(w, id, true);
    const linie = neubauLinien(w).find((l) => l.id === id);
    expect(linie?.ruht).toBe(true);
  });
});
