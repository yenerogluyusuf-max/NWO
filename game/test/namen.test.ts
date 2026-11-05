// Spielerdurchlauf 5. November: Finanz-, Außen- und Wirtschaftsminister hießen alle Erdem. Im Kabinett kommt kein Nachname doppelt vor.

import { describe, expect, test } from "vitest";
import { createWorld } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { startAfterElection, schnellProfil } from "../src/sim/prolog";

describe("Namen im Umfeld", () => {
  test("Beim Amtsantritt trägt keine Person im Umfeld denselben Nachnamen wie eine andere", () => {
    for (let seed = 1; seed <= 20; seed++) {
      const w = createWorld(turkey2026, seed);
      startAfterElection(w, schnellProfil());
      const nach = w.spiel!.figuren.map((f) => f.name.split(" ").at(-1));
      expect(new Set(nach).size, `Seed ${seed}: ${w.spiel!.figuren.map((f) => f.name).join(", ")}`).toBe(nach.length);
    }
  });
});
