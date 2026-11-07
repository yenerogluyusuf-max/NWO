// Welle E2: Forschung & Ziele zeigen ehrlich, was geht, und melden sich auf dem Schreibtisch.
// Geprüft wird: Blockierte Knoten stehen nicht unter „möglich“ und nennen ihren Grund mit Sprung; die Dauer rechnet mit dem Tempo und trifft
// die echte Bauzeit; der Forschungsrat, die wartende Forschung und die Gelegenheit bei einem Großen Ziel kommen, wenn die Lage es verlangt, und
// nicht sonst; die Antworten buchen, was die Plakette zeigt; ein Durchbruch bekommt Fenster, Zeitung und Wirkungsbericht; der Lauf ist
// deterministisch; der Spielstand des Inhabers (2043) zeigt 15 an der Verwaltung wartende Knoten und zwei aussichtsreiche Versuche.
import { describe, expect, test } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { advance, createWorld, load, save } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { schnellProfil, startAfterElection } from "../src/sim/prolog";
import { ansicht, antworten, entscheide, oeffne, vorlage } from "../src/sim/ereignisse";
import { baumSicht, beginneKnoten, dauerEcht, knotenSicht, verwaltungsLage } from "../src/sim/wissensbaum";
import { FORSCHUNGSDRUCK, forschungsAnliegen, gelegenheiten, ratAngebote } from "../src/sim/ereignisse-forschung";
import { GROSSE_ZIELE, WEGE, chanceVon, grosseZiele, zielDef } from "../src/sim/grosseziele";
import { reichZustand } from "../src/sim/reich";
import { ZWEIG_VON } from "../src/data/wissensbaum";
import { figur } from "../src/sim/figuren";
import { Rng } from "../src/sim/rng";
import type { World } from "../src/sim/types";

function welt(seed = 4): World {
  const w = createWorld(turkey2026, seed);
  startAfterElection(w, schnellProfil());
  w.spiel!.ereignisse = [];
  w.spiel!.kapital = 60;
  return w;
}

const alle = (w: World) => baumSicht(w).zweige.flatMap((z) => z.knoten);
const laufendImBaum = (w: World) => reichZustand(w).laufend.filter((l) => ZWEIG_VON[l.id] && !l.pausiert).length;

/** Im Baum läuft nichts mehr: laufende Knoten ruhen (so wie in einem Spielstand, in dem die Startvorhaben fertig sind). */
function baumLeer(w: World): void {
  for (const l of reichZustand(w).laufend) if (ZWEIG_VON[l.id]) l.pausiert = true;
}

/** Verfolgte Ziele mit voller Vorbereitung, damit eine Stufe aussichtsreich ist (wie in ereignisse-texte.test.ts). */
function zieleVerfolgt(w: World): void {
  const ziele = ["nahostordnung", "drehscheibe", "turkunion", "weltbuehne", "kornkammer", "seemacht", "technologie"];
  w.spiel!.grosseZiele = { verfolgt: ziele, stand: Object.fromEntries(ziele.map((z) => [z, { stufe: 0, vorbereitung: GROSSE_ZIELE.vorbereitungMax, versuche: 0 }])), vertretungen: {} };
}

describe("Ehrliche Anzeige im Wissensbaum", () => {
  test("Blockierte Knoten sind nicht startbar, die Übersicht nennt Grund, Zahl und Sprung", () => {
    const w = welt();
    reichZustand(w).verwaltung = 0;
    const ks = alle(w);
    const blockiert = ks.filter((k) => k.zustand === "moeglich" && k.hindernis === "verwaltung");
    expect(blockiert.length).toBeGreaterThan(0);
    for (const k of blockiert) expect(k.grund).toMatch(/Vorrat 0/);
    const g = baumSicht(w).sperren.find((x) => x.art === "verwaltung")!;
    expect(g.n).toBe(blockiert.length);
    expect(g.sprung).toEqual({ art: "verwaltung" });
    // Die Förderung sperrt im frischen Spiel die zivilen Zweige: eine Zeile mit Sprung zur Maßnahme und ihrem Zielwert
    const f = baumSicht(welt()).sperren.find((x) => x.art === "foerderung");
    expect(f?.sprung).toMatchObject({ art: "massnahme", id: "m_forschung" });
    expect(f!.n).toBeGreaterThan(0);
  });

  test("Die Dauer rechnet mit dem Tempo und trifft die echte Bauzeit", () => {
    const w = welt();
    // Forschung voll gefördert: Das Tempo steigt über 1, die Anzeige muss kürzer sein als die geplante Bauzeit
    w.net.targets.m_forschung = 100;
    for (let i = 0; i < 6; i++) advance(w, 30), (w.spiel!.ereignisse = []);
    w.spiel!.kapital = 60;
    const k = alle(w).find((x) => x.zustand === "moeglich" && !x.grund)!;
    expect(k).toBeDefined();
    const geschaetzt = k.monateEcht;
    expect(geschaetzt).toBe(dauerEcht(w, k.id));
    expect(beginneKnoten(w, k.id).ok).toBe(true);
    let monate = 0;
    while (!w.spiel!.reich!.bestand[k.id] && monate < 120) {
      advance(w, 30);
      w.spiel!.ereignisse = [];
      monate++;
    }
    expect(w.spiel!.reich!.bestand[k.id]).toBeDefined();
    // Die Schätzung kennt die Reihe hinter anderen Vorhaben nicht; sie liegt höchstens drei Monate daneben
    expect(geschaetzt).toBeDefined();
    expect(Math.abs(monate - geschaetzt!)).toBeLessThanOrEqual(3);
  }, 120_000);
});

describe("Forschungsrat", () => {
  test("legt vor, wenn im Baum Platz ist, und nicht, wenn zwei Vorhaben laufen", () => {
    const w = welt();
    baumLeer(w);
    expect(ratAngebote(w).length).toBeGreaterThan(0);
    expect(vorlage("forschungsrat").chance(w)).toBe(FORSCHUNGSDRUCK.rat.chance);
    // Zwei Knoten laufen: kein Rat
    const k = load(save(w));
    for (const a of ratAngebote(k).filter((x) => !x.lizenz).slice(0, 2)) expect(beginneKnoten(k, a.knoten).ok).toBe(true);
    if (laufendImBaum(k) >= FORSCHUNGSDRUCK.rat.unterLaufend) expect(vorlage("forschungsrat").chance(k)).toBe(0);
  });

  test("höchstens drei Angebote, und wo ein Geber frei ist, steht die Lizenz daneben", () => {
    const w = welt();
    baumLeer(w);
    w.net.targets.m_forschung = 100;
    for (let i = 0; i < 3; i++) advance(w, 30), (w.spiel!.ereignisse = []);
    const a = ratAngebote(w);
    expect(a.length).toBeLessThanOrEqual(FORSCHUNGSDRUCK.rat.angebote);
    expect(new Set(a.map((x) => `${x.knoten}@${x.lizenz ?? ""}`)).size).toBe(a.length);
  }, 60_000);

  test("Die Antwort beginnt den Knoten zum Preis der Plakette; die Lizenz bindet an den Geber; Schweigen kostet Loyalität", () => {
    const w = welt();
    baumLeer(w);
    const ev = oeffne(w, "forschungsrat", new Rng(1))!;
    expect(ev).toBeTruthy();
    const a = ansicht(w, ev);
    expect(a.optionen.some((o) => o.id === "abwarten")).toBe(true);
    for (const o of a.optionen.filter((x) => x.id.startsWith("k") && !x.sperre)) {
      const k = load(save(w));
      const kap = k.spiel!.kapital;
      const id = String(ev.daten![`a${o.id.slice(1)}`]).split("@");
      expect(entscheide(k, ev.id, o.id, new Rng(1)).ok).toBe(true);
      expect(kap - k.spiel!.kapital).toBeCloseTo(o.preis.kapital, 1);
      expect(knotenSicht(k, id[0]!)!.zustand).toBe("laeuft");
      if (id[1]) expect(k.spiel!.wissensbaum!.lizenzen[id[0]!]).toBe(id[1]);
    }
    const s = load(save(w));
    const l0 = figur(s, "wirtschaft")!.loyalitaet;
    vorlage("forschungsrat").standard(s, s.spiel!.ereignisse.find((e) => e.id === ev.id)!, new Rng(1));
    expect(figur(s, "wirtschaft")!.loyalitaet).toBeLessThan(l0);
  });
});

describe("Die Forschung wartet auf die Verwaltung", () => {
  test("kommt nur, wenn mehrere Knoten allein an der Verwaltung hängen", () => {
    const w = welt();
    baumLeer(w);
    expect(vorlage("forschung_verwaltung").chance(w)).toBe(0);
    reichZustand(w).verwaltung = 0;
    // Ohne Vorhaben, die ohne Fortschritt Verwaltung ziehen, gibt es nichts ruhen zu lassen: kein Vorgang
    if (!verwaltungsLage(w).ohne.length) expect(vorlage("forschung_verwaltung").chance(w)).toBe(0);
  });
});

describe("Gelegenheit bei einem Großen Ziel", () => {
  test("kommt bei verfolgter, versuchbarer, aussichtsreicher Stufe einmal, nicht ohne verfolgtes Ziel", () => {
    const w = welt();
    expect(vorlage("grossziel_gelegenheit").chance(w)).toBe(0);
    zieleVerfolgt(w);
    const g = gelegenheiten(w);
    expect(g.length).toBeGreaterThan(0);
    for (const x of g) expect(["aussichtsreich", "gut"]).toContain(chanceVon(w, x.ziel)!.wort);
    expect(vorlage("grossziel_gelegenheit").chance(w)).toBeGreaterThan(0);
    const ev = oeffne(w, "grossziel_gelegenheit", new Rng(1))!;
    expect(ev.daten!.ziel).toBe(g[0]!.ziel);
    // Einmal je Stufe: dasselbe Ziel steht nicht mehr unter den Gelegenheiten, bleibt aber für Menü und Fristen versuchbar
    expect(gelegenheiten(w).map((x) => x.ziel)).not.toContain(g[0]!.ziel);
    expect(forschungsAnliegen(w).versuche.map((x) => x.ziel)).toContain(g[0]!.ziel);
  });

  test("Mit geringer Chance kein Vorgang", () => {
    const w = welt();
    zieleVerfolgt(w);
    for (const st of Object.values(grosseZiele(w).stand)) st.vorbereitung = 0;
    for (const x of gelegenheiten(w)) expect(["aussichtsreich", "gut"]).toContain(chanceVon(w, x.ziel)!.wort);
    const ohne = gelegenheiten(w).length;
    // Ohne Vorbereitung fallen Ziele heraus, deren Chance erst durch sie aussichtsreich war
    zieleVerfolgt(w);
    expect(gelegenheiten(w).length).toBeGreaterThanOrEqual(ohne);
  });

  test("Wagen bucht den Preis der Stufe, Vorbereiten den Weg; die Vorschau verrät den Ausgang nicht; Schweigen kostet", () => {
    const w = welt();
    zieleVerfolgt(w);
    const ev = oeffne(w, "grossziel_gelegenheit", new Rng(1))!;
    const id = String(ev.daten!.ziel);
    const s = zielDef(id)!.stufen[0]!;
    const a = ansicht(w, ev);
    const wagen = a.optionen.find((o) => o.id === "wagen")!;
    expect(wagen.preis.kapital).toBe(s.pk);
    expect(wagen.vorschau.length).toBe(3);
    const k = load(save(w));
    const kap = k.spiel!.kapital;
    entscheide(k, ev.id, "wagen", new Rng(1));
    expect(kap - k.spiel!.kapital).toBeCloseTo(s.pk, 5);
    expect(grosseZiele(k).stand[id]!.versuche).toBe(1);
    const v = load(save(w));
    grosseZiele(v).stand[id]!.vorbereitung = 0;
    const evV = v.spiel!.ereignisse.find((e) => e.id === ev.id)!;
    const vor = antworten(v, evV).find((o) => o.id === "vorbereiten")!;
    expect(vor.label).toMatch(/Gipfel/);
    entscheide(v, ev.id, "vorbereiten", new Rng(1));
    expect(grosseZiele(v).stand[id]!.vorbereitung).toBe(WEGE.gipfel.vorbereitung);
    const std = load(save(w));
    const vb = grosseZiele(std).stand[id]!.vorbereitung;
    vorlage("grossziel_gelegenheit").standard(std, std.spiel!.ereignisse.find((e) => e.id === ev.id)!, new Rng(1));
    expect(grosseZiele(std).stand[id]!.vorbereitung).toBe(vb - FORSCHUNGSDRUCK.gelegenheit.verfliegt);
  });
});

describe("Durchbruch", () => {
  test("bekommt eigenes Fenster, Eilmeldung und Wirkungsbericht", () => {
    const w = welt();
    w.net.targets.m_forschung = 100;
    for (let i = 0; i < 3; i++) advance(w, 30), (w.spiel!.ereignisse = []);
    w.spiel!.kapital = 60;
    const k = alle(w).filter((x) => x.zustand === "moeglich" && !x.grund).sort((a, b) => (a.monateEcht ?? 999) - (b.monateEcht ?? 999))[0]!;
    expect(beginneKnoten(w, k.id).ok).toBe(true);
    w.spiel!.hinweise = [];
    const zeitung0 = w.spiel!.zeitung?.warteschlange.length ?? 0;
    for (let m = 0; m < 120 && !w.spiel!.reich!.bestand[k.id]; m++) advance(w, 30), (w.spiel!.ereignisse = []);
    advance(w, 30);
    expect(w.spiel!.hinweise.some((h) => h.id.startsWith(`durchbruch-${k.id}`))).toBe(true);
    expect((w.spiel!.zeitung?.warteschlange.length ?? 0) + (w.spiel!.zeitung?.archiv?.length ?? 0)).toBeGreaterThan(zeitung0);
    expect(w.spiel!.rueckblicke?.some((r) => r.art === "forschung" && r.id === `forschung:${k.id}`)).toBe(true);
  }, 120_000);
});

describe("Determinismus", () => {
  test("Gleicher Samen, gleicher Verlauf mit den neuen Vorgängen", () => {
    const lauf = () => {
      const w = welt(7);
      baumLeer(w);
      zieleVerfolgt(w);
      for (let i = 0; i < 14; i++) advance(w, 30);
      return { chronik: JSON.stringify(w.spiel!.chronik.map((c) => [c.tag, c.vorlage ?? c.titel])), stand: save(w).length };
    };
    const a = lauf();
    const b = lauf();
    expect(a.chronik).toBe(b.chronik);
    expect(a.stand).toBe(b.stand);
  }, 180_000);
});

const datei = new URL("../../spielstand/staatsraeson_2043-08-03.json", import.meta.url);
describe.skipIf(!existsSync(datei))("Spielstand des Inhabers (2043)", () => {
  const laden = () => {
    const d = JSON.parse(readFileSync(datei, "utf8")) as { welt?: unknown };
    return load(JSON.stringify(d.welt ?? d));
  };

  test("15 Knoten warten an der Verwaltung, nur KAAN ist startbar, zwei Versuche sind aussichtsreich", () => {
    const w = laden();
    const g = baumSicht(w).sperren.find((x) => x.art === "verwaltung")!;
    expect(g.n).toBe(15);
    const chip = knotenSicht(w, "chips_design")!;
    expect(chip.grund).toBeTruthy();
    // Vorher „etwa 42 Monate“ (geplante Bauzeit); jetzt mit Tempo und hinten in der Reihe der 16 laufenden Vorhaben
    expect(chip.monate).toBe(42);
    expect(chip.monateEcht).toBeLessThan(chip.monate);
    expect(alle(w).filter((k) => k.zustand === "moeglich" && !k.grund).map((k) => k.id)).toEqual(["mil_kaan"]);
    expect(forschungsAnliegen(w).versuche.map((x) => x.ziel).sort()).toEqual(["nahostordnung", "technologie"]);
    expect(vorlage("grossziel_gelegenheit").chance(w)).toBeGreaterThan(0);
    expect(vorlage("forschung_verwaltung").chance(w)).toBeGreaterThan(0);
  });

  test("Ruhen lassen gibt die Verwaltung frei; danach legt der Rat Vorhaben vor", () => {
    const w = laden();
    const ev = oeffne(w, "forschung_verwaltung", new Rng(1))!;
    const ohne = verwaltungsLage(w).ohne.map((x) => x.id);
    expect(ohne.length).toBe(9);
    entscheide(w, ev.id, "ruhen", new Rng(1));
    for (const id of ohne) expect(reichZustand(w).laufend.find((l) => l.id === id)!.pausiert).toBe(true);
    expect(verwaltungsLage(w).netto).toBeGreaterThan(0);
    const vorher = knotenSicht(w, "chips_design")!.monateEcht!;
    for (let i = 0; i < 6; i++) advance(w, 30), (w.spiel!.ereignisse = []);
    expect(ratAngebote(w).length).toBeGreaterThan(1);
    // Mit freier Baustelle und vollem Vorrat ist der Chip-Entwurf schneller fertig als vorher hinten in der vollen Reihe
    const chip = knotenSicht(w, "chips_design")!;
    expect(chip.zustand).toBe("moeglich");
    expect(chip.grund).toBeUndefined();
    expect(chip.monateEcht!).toBeLessThan(vorher);
  }, 120_000);
});
