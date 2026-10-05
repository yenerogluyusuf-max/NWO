// Affären wiederholen sich nicht wie Kopien: Vier Affären nacheinander erzählen vier verschiedene Geschichten.

import { describe, expect, test } from "vitest";
import { createWorld } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { startAfterElection, schnellProfil } from "../src/sim/prolog";
import { ansicht, oeffne } from "../src/sim/ereignisse";
import { Rng } from "../src/sim/rng";

describe("Vergabeaffäre in Varianten", () => {
  test("vier Affären in Folge haben vier verschiedene Titel und Texte", () => {
    for (const seed of [1, 2, 3, 4, 5, 6]) {
      const w = createWorld(turkey2026, seed);
      startAfterElection(w, schnellProfil());
      const rng = new Rng(seed * 7);
      const titel: string[] = [];
      const texte: string[] = [];
      for (let i = 0; i < 4; i++) {
        w.spiel!.ereignisse = [];
        const ev = oeffne(w, "korruptionsaffaere", rng)!;
        const a = ansicht(w, ev);
        titel.push(a.titel);
        texte.push(a.text[0]!);
        w.day += 500;
      }
      expect(new Set(titel).size, `Seed ${seed}: ${titel.join(" | ")}`).toBe(4);
      expect(new Set(texte).size).toBe(4);
    }
  });

  test("die fünfte Affäre beginnt wieder bei der am längsten zurückliegenden Geschichte", () => {
    const w = createWorld(turkey2026, 3);
    startAfterElection(w, schnellProfil());
    const rng = new Rng(21);
    const erste: string[] = [];
    for (let i = 0; i < 5; i++) {
      w.spiel!.ereignisse = [];
      const ev = oeffne(w, "korruptionsaffaere", rng)!;
      erste.push(ansicht(w, ev).titel);
      w.day += 500;
    }
    expect(erste[4]).toBe(erste[0]);
  });
});
