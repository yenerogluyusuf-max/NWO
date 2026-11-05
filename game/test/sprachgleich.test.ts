// Dieselbe Partie muss in jeder Sprache denselben Verlauf nehmen: Logik darf nie übersetzten Text lesen.
// Anlass (5. November 2026): Die Ereignisdichte zählte Chronik-Titel per deutschem Muster; auf Englisch kamen weniger Ereignisse.
import { afterAll, describe, expect, it } from "vitest";
import { setzeSprache } from "../src/i18n";
import { createWorld, advance, load, save } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { schnellProfil, startAfterElection } from "../src/sim/prolog";
import { migriereChronik } from "../src/sim/chronik";

async function verlauf(sprache: "de" | "en" | "tr", tage: number) {
  await setzeSprache(sprache);
  const w = createWorld(turkey2026, 2);
  startAfterElection(w, schnellProfil());
  advance(w, tage);
  const sp = w.spiel!;
  return {
    rng: w.rngState, datum: w.date, inflation: w.economy.inflation.toFixed(6), zustimmung: sp.umfrage.zustimmung.toFixed(6),
    chronik: sp.chronik.map((c) => `${c.tag}:${c.art ?? ""}:${c.vorlage ?? ""}:${c.ohneEntscheidung ? 1 : 0}`).join(","),
    ereignisse: sp.ereignisse.map((e) => e.vorlage).join(","), kapital: sp.kapital.toFixed(6),
  };
}

describe("Sprachgleichheit", () => {
  afterAll(async () => { await setzeSprache("de"); });
  it("Dieselbe Partie ergibt in de, en und tr denselben Verlauf (über den ersten Jahreswechsel hinaus)", async () => {
    const de = await verlauf("de", 400), en = await verlauf("en", 400), tr = await verlauf("tr", 400);
    expect(en).toEqual(de);
    expect(tr).toEqual(de);
  }, 300000);

  it("Ältere Spielstände bekommen die Chronik-Merkmale beim Laden", async () => {
    await setzeSprache("de");
    const w = createWorld(turkey2026, 3);
    startAfterElection(w, schnellProfil());
    w.spiel!.chronik.push(
      { tag: 1, datum: w.date, titel: "Wirkungsbericht: Mindestlohn", ausgang: "Wirkt." },
      { tag: 2, datum: w.date, titel: "Der Mindestlohn für 2029", ausgang: "Keine Entscheidung: Die Kommission setzt ihn fest." },
      { tag: 3, datum: w.date, titel: "Streik", ausgang: "Ausgesessen — der Vorgang kam nicht auf den Tisch: …" },
      { tag: 4, datum: w.date, titel: "Überlastung", ausgang: "Die Belastung ist über 70 gestiegen." },
    );
    const g = load(save(w)).spiel!.chronik.slice(-4);
    expect(g.map((c) => c.art ?? "")).toEqual(["bericht", "", "haken", "zustand"]);
    expect(g[1]).toMatchObject({ vorlage: "mindestlohn", ohneEntscheidung: true });
    expect(g[2]!.ohneEntscheidung).toBe(true);
    migriereChronik(w); // doppelt ist unschädlich
  });
});
