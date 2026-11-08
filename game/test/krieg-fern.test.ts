// Mit fernen Großmächten und der EU entsteht kein militärischer Vorgang (ENTSCHEIDUNGEN, Nachtrag zu U vom 5. November):
// Spielerdurchlauf 5. November, die Spannung mit den USA stieg durch Zwischenfälle auf 71, ab 73 hätte ein Kriegsvorgang begonnen.

import { describe, expect, test } from "vitest";
import { createWorld } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { startAfterElection, schnellProfil } from "../src/sim/prolog";
import { kriegMit, kriegMonat, kriseGrund, ohneKriegsvorgang } from "../src/sim/krieg";
import { weltZustand } from "../src/sim/laender";
import { Rng } from "../src/sim/rng";

function welt() {
  const w = createWorld(turkey2026, 6);
  startAfterElection(w, schnellProfil());
  w.spiel!.ereignisse = [];
  w.spiel!.kapital = 120;
  return w;
}

describe("Kein Kriegsvorgang mit fernen Mächten", () => {
  test("USA, China und EU bleiben bei hoher Spannung ohne Vorgang; Griechenland nicht", () => {
    const w = welt();
    const z = weltZustand(w);
    for (const id of ["USA", "CHN", "EU"]) z[id]!.konflikt = 85;
    z["GRC"]!.konflikt = 80;
    kriegMonat(w, new Rng(1));
    for (const id of ["USA", "CHN", "EU"]) expect(kriegMit(w, id), id).toBeFalsy();
    expect(kriegMit(w, "GRC")).toBeTruthy();
  });

  test("Selbst eröffnen lässt sich eine Krise mit den USA nicht; Zwischenfälle treiben sie nicht über die Schwelle", () => {
    const w = welt();
    weltZustand(w)["USA"]!.konflikt = 70;
    expect(kriseGrund(w, "USA")).toMatch(/keine Option/);
    expect(ohneKriegsvorgang("GRC")).toBe(false);
    for (let m = 0; m < 24; m++) kriegMonat(w, new Rng(m + 3));
    expect(weltZustand(w)["USA"]!.konflikt).toBeLessThan(73);
  });
});
