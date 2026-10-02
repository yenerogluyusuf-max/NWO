// Auto-Stopp-Taxonomie (ui/autostopp.ts): C hält nie, B hält einmal (bis quittiert), A hält immer,
// und der Sammel-Hinweis akkumuliert C-Meldungen.

import { describe, expect, test } from "vitest";
import { createWorld } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { schnellProfil, startAfterElection } from "../src/sim/prolog";
import { quittiereFeier, reichZustand } from "../src/sim/reich";
import { bewerteHalt, hinweisKlasse, sammleUmlauf, UMLAUF_LIMIT, type UmlaufEintrag } from "../src/ui/autostopp";
import type { World } from "../src/sim/types";

function neu(): World {
  const w = createWorld(turkey2026, 6);
  startAfterElection(w, schnellProfil());
  w.spiel!.ereignisse = [];
  w.spiel!.hinweise = [];
  return w;
}

function hinweis(id: string) {
  return { id, titel: `Titel ${id}`, szene: "istanbul" as const, text: ["Zeile"] };
}

describe("Hinweis-Klassen", () => {
  test("jeder bekannte Auslöser hat seine Klasse", () => {
    expect(hinweisKlasse("pause-100")).toBe("C");
    expect(hinweisKlasse("starthilfe")).toBe("B");
    expect(hinweisKlasse("warnung-100")).toBe("B");
    expect(hinweisKlasse("bruch-100-MHP")).toBe("B");
    expect(hinweisKlasse("wahl-100")).toBe("B");
    expect(hinweisKlasse("programm-erdbeben1-100")).toBe("B");
    expect(hinweisKlasse("zusammenbruch-100")).toBe("B");
  });

  test("unbekannte Hinweise bleiben Wendepunkte (B), damit nichts Wichtiges verschluckt wird", () => {
    expect(hinweisKlasse("irgendwas-neues")).toBe("B");
  });
});

describe("Klasse C (Umlauf) hält nie", () => {
  test("ein ruhiger Tag (pause-*) stoppt die Zeit nicht, sondern wandert in den Umlauf", () => {
    const w = neu();
    w.spiel!.hinweise.push(hinweis(`pause-${w.day}`));
    const bw = bewerteHalt(w.spiel!, new Set());
    expect(bw.halt).toBe(false);
    expect(bw.klasse).toBeNull();
    expect(bw.umlaufHinweise.map((h) => h.id)).toEqual([`pause-${w.day}`]);
  });

  test("C-Hinweis neben B-Hinweis: gehalten wird für B, C geht in den Umlauf", () => {
    const w = neu();
    w.spiel!.hinweise.push(hinweis(`pause-${w.day}`), hinweis(`warnung-${w.day}`));
    const bw = bewerteHalt(w.spiel!, new Set());
    expect(bw.halt).toBe(true);
    expect(bw.klasse).toBe("B");
    expect(bw.umlaufHinweise.map((h) => h.id)).toEqual([`pause-${w.day}`]);
  });
});

describe("Klasse B (Wendepunkt) hält einmal", () => {
  test("Programm-Abschluss hält, bis das Banner quittiert ist — dann ist Ruhe", () => {
    const w = neu();
    w.spiel!.hinweise.push(hinweis(`programm-erdbeben1-${w.day}`));
    const gesehen = new Set<string>();
    const bw = bewerteHalt(w.spiel!, gesehen);
    expect(bw.halt).toBe(true);
    expect(bw.klasse).toBe("B");
    // Der Spieler quittiert das Banner
    w.spiel!.hinweise = w.spiel!.hinweise.filter((h) => h.id !== `programm-erdbeben1-${w.day}`);
    expect(bewerteHalt(w.spiel!, gesehen).halt).toBe(false);
  });

  test("Fertigstellung (Feier) hält einmal, bis sie quittiert ist", () => {
    const w = neu();
    reichZustand(w).feier.push("v_test");
    expect(bewerteHalt(w.spiel!, new Set()).halt).toBe(true);
    quittiereFeier(w, "v_test");
    expect(bewerteHalt(w.spiel!, new Set()).halt).toBe(false);
  });
});

describe("Klasse A (Entscheidung) hält immer", () => {
  test("jedes neue Ereignis hält; ein schon gesehenes hält nicht erneut", () => {
    const w = neu();
    const gesehen = new Set<string>();
    w.spiel!.ereignisse.push({ id: "ev-1", vorlage: "mindestlohn", tag: w.day, frist: w.day + 10, provinzen: [], staerke: 1 });
    let bw = bewerteHalt(w.spiel!, gesehen);
    expect(bw.halt).toBe(true);
    expect(bw.klasse).toBe("A");
    gesehen.add("ev-1");
    expect(bewerteHalt(w.spiel!, gesehen).halt).toBe(false);
    // Das nächste neue Ereignis hält wieder
    w.spiel!.ereignisse.push({ id: "ev-2", vorlage: "mindestlohn", tag: w.day, frist: w.day + 10, provinzen: [], staerke: 1 });
    bw = bewerteHalt(w.spiel!, gesehen);
    expect(bw.halt).toBe(true);
    expect(bw.klasse).toBe("A");
  });

  test("das Spielende hält (und schlägt B)", () => {
    const w = neu();
    w.spiel!.hinweise.push(hinweis(`warnung-${w.day}`));
    w.spiel!.ende = { tag: w.day, datum: w.date, art: "abwahl", titel: "Abgewählt", text: "..." };
    const bw = bewerteHalt(w.spiel!, new Set());
    expect(bw.halt).toBe(true);
    expect(bw.klasse).toBe("A");
  });
});

describe("Sammel-Hinweis", () => {
  test("akkumuliert C-Meldungen und kappt auf das Limit, die ältesten fallen heraus", () => {
    let liste: UmlaufEintrag[] = [];
    for (let i = 0; i < UMLAUF_LIMIT + 5; i++) liste = sammleUmlauf(liste, [{ id: `u-${i}`, datum: "1.1.2027", titel: `Meldung ${i}` }]);
    expect(liste).toHaveLength(UMLAUF_LIMIT);
    expect(liste[0]!.id).toBe("u-5");
    expect(liste[UMLAUF_LIMIT - 1]!.id).toBe(`u-${UMLAUF_LIMIT + 4}`);
  });
});
