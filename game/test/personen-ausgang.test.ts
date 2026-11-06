// Personalereignisse nennen im Ausgang die Person, die vorher im Amt war (Befund A-2, 5. November 2026): `ausscheiden()` setzt die Nachfolge
// in dasselbe Figurenobjekt; ein Text, der erst danach entsteht, nannte sonst den Nachfolger statt der gehenden Person.
import { describe, expect, test } from "vitest";
import { createWorld, load, save } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { startAfterElection, schnellProfil } from "../src/sim/prolog";
import { entscheide, oeffne, vorlage } from "../src/sim/ereignisse";
import { Rng } from "../src/sim/rng";
import type { World } from "../src/sim/types";

function basis(seed: number): string {
  const w = createWorld(turkey2026, seed);
  startAfterElection(w, schnellProfil());
  w.spiel!.ereignisse = [];
  w.spiel!.kapital = 100;
  return save(w);
}

/** Antworten (und „standard“ für die Folge ohne Antwort), bei denen die Person das Amt verlässt oder verlassen kann. */
const FAELLE: [string, string][] = [
  ["person_ruecktritt", "annehmen"],
  ["person_ruecktritt", "standard"],
  ["person_skandal", "fallenlassen"],
  ["person_skandal", "pruefen"],
  ["person_intrige", "entlassen"],
  ["person_altersruecktritt", "verabschieden"],
  ["person_altersruecktritt", "standard"],
];

const figur = (w: World, id: string) => w.spiel!.figuren.find((f) => f.id === id)!;

describe("Ausgang der Personalereignisse", () => {
  for (const [vid, antwort] of FAELLE) {
    test(`${vid}:${antwort} nennt die Person, die vorher im Amt war`, () => {
      let gegangen = 0;
      // Ob die Untersuchung die Vorwürfe bestätigt, hängt vom Samen ab: genug Samen, damit beide Ausgänge vorkommen
      for (let seed = 1; seed <= 16; seed++) {
        const w = load(basis(seed));
        const ziel = w.spiel!.figuren.find((f) => f.amt === "finanzen")!;
        const ev = oeffne(w, vid, new Rng(seed * 7), { provinzen: [], staerke: 1, daten: { figur: ziel.id } });
        expect(ev, `${vid} öffnet`).toBeTruthy();
        const alt = ziel.name;
        const text = antwort === "standard" ? vorlage(vid).standard(w, ev!, new Rng(5)) : entscheide(w, ev!.id, antwort, new Rng(5)).text;
        const neu = figur(w, ziel.id).name;
        if (neu === alt) continue; // die Untersuchung hat entlastet: niemand ist gegangen
        gegangen++;
        expect(text, `Samen ${seed}`).toContain(alt);
        expect(text, `Samen ${seed}`).not.toContain(neu);
      }
      expect(gegangen, "mindestens ein Fall, in dem die Person geht").toBeGreaterThan(0);
    });
  }
});
