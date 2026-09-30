// Speichern und Laden mit allen Systemen der Spielschleife: Nach dem Laden läuft die Partie identisch weiter.

import { describe, expect, test } from "vitest";
import { advance, createWorld, load, save } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { startAfterElection, schnellProfil } from "../src/sim/prolog";
import { bringeEin, setPolicy } from "../src/sim/handeln";
import { fraktionsUebersicht, verhandle } from "../src/sim/verhandeln";
import { fuehreAktionAus } from "../src/sim/laender";
import { PROGRAMME, schrittSicht, starteSchritt } from "../src/sim/programme";
import { entscheide, standardAntwort } from "../src/sim/ereignisse";
import { waehleZiele } from "../src/sim/spiel";
import { Rng } from "../src/sim/rng";
import type { World } from "../src/sim/types";

function spiele(w: World, monate: number, rng: Rng) {
  for (let m = 0; m < monate && !w.spiel!.ende; m++) {
    for (const ev of [...w.spiel!.ereignisse]) {
      const id = standardAntwort(w, ev);
      if (id) entscheide(w, ev.id, id, rng);
    }
    w.spiel!.kapital = Math.max(w.spiel!.kapital, 30);
    if (m % 3 === 0) fuehreAktionAus(w, "EU", "gipfel");
    for (const p of PROGRAMME) for (const s of p.schritte) if (schrittSicht(w, s).status === "bereit") starteSchritt(w, s.id);
    const f = fraktionsUebersicht(w)[0];
    if (f && m % 4 === 0) verhandle(w, f.partei, "gespraech", rng);
    if (m === 2) setPolicy(w, "m_mindestlohn", 85);
    if (m === 5) bringeEin(w, "m_wasserleitungen", 70, [31], "gesetz");
    advance(w, 30);
  }
}

describe("Speichern und Laden", () => {
  test("Der Rundlauf über JSON erhält den Zustand, und beide Welten laufen gleich weiter", () => {
    const a = createWorld(turkey2026, 21);
    startAfterElection(a, schnellProfil());
    waehleZiele(a, ["inflation15", "wohnen"]);
    spiele(a, 20, new Rng(4));
    // Neue Felder sind belegt
    expect(a.spiel!.programm).toBeDefined();
    expect(a.spiel!.welt).toBeDefined();
    expect(a.spiel!.fraktionen).toBeDefined();
    expect((a.spiel!.beobachtungen ?? []).length).toBeGreaterThan(0);

    const text = save(a);
    const b = load(text);
    expect(JSON.stringify(b.spiel)).toBe(JSON.stringify(a.spiel));

    spiele(a, 12, new Rng(9));
    spiele(b, 12, new Rng(9));
    expect(JSON.stringify(b.spiel)).toBe(JSON.stringify(a.spiel));
    expect(b.date).toBe(a.date);
  });

  test("Ein alter Spielstand ohne die neuen Felder lässt sich weiterspielen", () => {
    const a = createWorld(turkey2026, 22);
    startAfterElection(a, schnellProfil());
    const alt = JSON.parse(save(a)) as { spiel: Record<string, unknown> };
    for (const k of ["programm", "welt", "fraktionen", "beobachtungen", "berichte", "modifikatoren", "salz"]) delete alt.spiel[k];
    const b = load(JSON.stringify(alt));
    expect(() => advance(b, 30 * 14)).not.toThrow();
    expect(b.spiel!.welt).toBeDefined();
  });
});
