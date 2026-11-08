import { describe, expect, test } from "vitest";
import { electParliament, emptyProfile, startAfterElection, STATIONS, type PlayerProfile } from "../src/sim/prolog";
import { Rng } from "../src/sim/rng";
import { createWorld } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";

function profile(answerIndex: number): PlayerProfile {
  const p = emptyProfile();
  p.name = "Test";
  for (const s of STATIONS) s.answers[Math.min(answerIndex, s.answers.length - 1)]!.apply(p);
  return p;
}

describe("Prolog", () => {
  test("jede Antwort verändert das Profil", () => {
    for (const station of STATIONS) {
      for (const answer of station.answers) {
        const p = emptyProfile();
        const before = JSON.stringify(p);
        answer.apply(p);
        expect(JSON.stringify(p), `${station.id}: ${answer.label}`).not.toBe(before);
      }
    }
  });

  test("das Parlament hat immer 600 Sitze, und nur Parteien über der Hürde sitzen darin", () => {
    for (let seed = 1; seed <= 40; seed++) {
      for (const idx of [0, 1, 2, 3]) {
        const p = profile(idx);
        const parl = electParliament(p, new Rng(seed));
        const total = Object.values(parl.seats).reduce((a, b) => a + b, 0);
        expect(total).toBe(600);
        const shareSum = Object.values(parl.shares).reduce((a, b) => a + b, 0);
        expect(shareSum).toBeCloseTo(100, 5);
        const ally = p.buendnis ? parl.shares[p.partei.kurz]! + parl.shares[p.buendnis]! : 0;
        for (const party of Object.keys(parl.seats)) {
          const inAlliance = p.buendnis && (party === p.partei.kurz || party === p.buendnis);
          expect(parl.shares[party]! >= 7 || (inAlliance && ally >= 7)).toBe(true);
        }
      }
    }
  });

  test("die eigene Partei landet meist bei 10 bis 35 Prozent", () => {
    const shares = Array.from({ length: 60 }, (_, i) => {
      const p = profile(i % 4);
      return electParliament(p, new Rng(i + 1)).shares[p.partei.kurz]!;
    });
    expect(Math.min(...shares)).toBeGreaterThan(8);
    expect(Math.max(...shares)).toBeLessThan(40);
  });

  test("der Amtsantritt legt Spielerin, Parlament und Einträge an", () => {
    const w = createWorld(turkey2026, 5);
    startAfterElection(w, profile(1));
    expect(w.player?.name).toBe("Test");
    expect(w.parliament).toBeDefined();
    expect(w.log.some((l) => l.text.includes("Präsidentschaftswahl"))).toBe(true);
  });
});
