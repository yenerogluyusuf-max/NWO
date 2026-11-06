// Nacht N6 (Befund F-1, F-3, F-4, F-16): ehrliche Baureihenfolge, Aufgeben mit Preis, Pause mit Folge, getrennte Engpässe.
import { describe, expect, test } from "vitest";
import { createWorld } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { startAfterElection, schnellProfil } from "../src/sim/prolog";
import {
  aufgabeFolgen,
  bauKapazitaet,
  bauplan,
  bauPool,
  beginne,
  gibAuf,
  laufBau,
  PAUSE_VERFALL,
  pausiere,
  reichMonat,
  reichZustand,
  ruestungsKapazitaet,
  spitzenPreis,
  vorhabenDef,
  VORZIEHEN_VERWALTUNG,
  warteschlange,
} from "../src/sim/reich";

function welt(seed = 4) {
  const w = createWorld(turkey2026, seed);
  startAfterElection(w, schnellProfil());
  w.spiel!.ereignisse = [];
  w.spiel!.kapital = 150;
  return w;
}

describe("Baureihenfolge", () => {
  test("Ein neuer Auftrag reiht sich hinten ein und kostet keine Verwaltungskraft", () => {
    const w = welt();
    const z = reichZustand(w);
    const vk = z.verwaltung;
    const vorher = warteschlange(w).filter((e) => e.pool === "land").map((e) => e.id);
    expect(beginne(w, "restaurierung_smyrna").ok).toBe(true);
    const nachher = warteschlange(w).filter((e) => e.pool === "land").map((e) => e.id);
    expect(nachher).toEqual([...vorher, "restaurierung_smyrna"]);
    expect(z.verwaltung).toBe(vk);
  });

  test("An die Spitze kostet so viel wie Vorziehen über alle Vorhaben desselben Engpasses", () => {
    const w = welt();
    const z = reichZustand(w);
    const preis = spitzenPreis(w, "restaurierung_smyrna");
    const land = warteschlange(w).filter((e) => e.pool === "land").length;
    expect(preis.kosten).toBe(land * VORZIEHEN_VERWALTUNG);
    const vk = z.verwaltung;
    const r = beginne(w, "restaurierung_smyrna", "ausschreibung", "spitze");
    expect(r.ok, r.text).toBe(true);
    expect(z.verwaltung).toBeCloseTo(vk - preis.kosten, 6);
    expect(warteschlange(w).find((e) => e.id === "restaurierung_smyrna")!.position).toBe(1);
    // ohne Vorrat kein Sprung an die Spitze
    z.verwaltung = 0;
    expect(beginne(w, "restaurierung_pergamon", "ausschreibung", "spitze").ok).toBe(false);
  });

  test("Die Rückmeldung nennt dieselbe Fertigstellung wie die Baustelle", () => {
    const w = welt();
    const r = beginne(w, "restaurierung_smyrna", "stammfirma");
    const m = warteschlange(w).find((e) => e.id === "restaurierung_smyrna")!.fertigIn!;
    expect(r.text).toContain(String(m));
  });
});

describe("Pausieren und Aufgeben", () => {
  test("Ein ruhender Bau verliert je Monat einen Teil seiner Baupunkte", () => {
    const w = welt();
    const z = reichZustand(w);
    const l = z.laufend[0]!;
    const v = vorhabenDef(l.id)!;
    const vorher = l.fortschritt;
    pausiere(w, l.id, true);
    reichMonat(w);
    expect(l.fortschritt).toBeCloseTo(vorher - laufBau(l, v) * PAUSE_VERFALL, 6);
  });

  test("Vor dem Spatenstich kommt die Hälfte des Kapitals zurück", () => {
    const w = welt();
    expect(beginne(w, "restaurierung_smyrna", "ausschreibung").ok).toBe(true);
    const k = w.spiel!.kapital;
    const f = aufgabeFolgen(w, "restaurierung_smyrna")!;
    expect(f.erstattung).toBeGreaterThan(0);
    expect(gibAuf(w, "restaurierung_smyrna").ok).toBe(true);
    expect(w.spiel!.kapital).toBeCloseTo(k + f.erstattung, 6);
    expect(reichZustand(w).laufend.some((l) => l.id === "restaurierung_smyrna")).toBe(false);
  });

  test("Nach dem Spatenstich ist das Erreichte verloren, und es gibt eine Vertragsstrafe", () => {
    const w = welt();
    const z = reichZustand(w);
    const akkuyu = z.laufend.find((l) => l.id === "infra_akkuyu")!;
    expect(akkuyu.fortschritt).toBeGreaterThan(0);
    const f = aufgabeFolgen(w, "infra_akkuyu")!;
    expect(f.erstattung).toBe(0);
    expect(f.ruine).toBe(true);
    const schulden = w.economy.debtRatio;
    expect(gibAuf(w, "infra_akkuyu").ok).toBe(true);
    if (f.strafe > 0) expect(w.economy.debtRatio).toBeGreaterThan(schulden);
    expect(z.bestand.infra_akkuyu).toBeUndefined();
    expect(z.laufend.some((l) => l.id === "infra_akkuyu")).toBe(false);
  });
});

describe("Getrennte Engpässe", () => {
  test("Kampfjets bauen mit der Rüstungsindustrie, Abkommen ohne Baukapazität", () => {
    expect(bauPool(vorhabenDef("mil_f16")!)).toBe("ruestung");
    expect(bauPool(vorhabenDef("welt_korridor_abkommen")!)).toBe("ohne");
    expect(bauPool(vorhabenDef("infra_akkuyu")!)).toBe("land");
    const w = welt();
    const plan = bauplan(w);
    const land = Object.entries(plan).filter(([id]) => bauPool(vorhabenDef(id)!) === "land").reduce((s, [, r]) => s + r, 0);
    const ruestung = Object.entries(plan).filter(([id]) => bauPool(vorhabenDef(id)!) === "ruestung").reduce((s, [, r]) => s + r, 0);
    expect(land).toBeLessThanOrEqual(bauKapazitaet(w) + 1e-6);
    expect(ruestung).toBeLessThanOrEqual(ruestungsKapazitaet(w) + 1e-6);
    expect(ruestung).toBeGreaterThan(0);
  });

  test("Die Teilung macht am Spielbeginn nichts schneller oder langsamer", () => {
    // Vorher teilten sich alle 133 Baupunkte; jetzt Land und Rüstung zusammen gleich viel
    const w = welt();
    expect(bauKapazitaet(w) + ruestungsKapazitaet(w)).toBeCloseTo(133, 0);
  });
});
