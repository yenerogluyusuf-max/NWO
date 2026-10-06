// Schauplätze (sim/kriegsschauplatz.ts): Regionen folgen der Front, Gelände und Reichweite der Einsatzart, Bestand beider Seiten entscheidet
// mit und zehrt sich auf, Besatzung nach dem Frieden (Pufferzone, Verwaltung, Annexion, Rückgabe), Karte, Migration älterer Spielstände.

import { describe, expect, test } from "vitest";
import { createWorld, advance } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { startAfterElection, schnellProfil } from "../src/sim/prolog";
import { KRIEG, eigenStaerke, fuehreKriegHandlungAus, gegnerStaerke, kriegMit, kriegMonat, kriege, waehleZielraum } from "../src/sim/krieg";
import {
  aendereBesatzung,
  besatzung,
  besatzungNachFrieden,
  einsatzSichten,
  gegnerBestand,
  kriegsFaktoren,
  kriegsKarte,
  regionenSetzen,
  waehleEinsatz,
  waehleTempo,
  zielRegionen,
} from "../src/sim/kriegsschauplatz";
import { REGIONEN, SCHAUPLAETZE, ZIELRAUM_REGIONEN } from "../src/data/schauplaetze";
import FLAECHEN from "../src/data/schauplatz-flaechen.json";
import { ZIELRAEUME } from "../src/data/streitkraefte";
import { streitkraefte } from "../src/sim/streitkraefte";
import { weltZustand } from "../src/sim/laender";
import { NET } from "../src/sim/modell";
import { nationalAverage } from "../src/sim/netz";
import { Rng } from "../src/sim/rng";
import type { World } from "../src/sim/types";
import type { KriegVorgang } from "../src/sim/krieg-typen";
import de from "../src/i18n/katalog/de/krieg.json";
import tr from "../src/i18n/katalog/tr/krieg.json";
import en from "../src/i18n/katalog/en/krieg.json";

function welt(seed = 6): World {
  const w = createWorld(turkey2026, seed);
  startAfterElection(w, schnellProfil());
  w.spiel!.ereignisse = [];
  w.spiel!.kapital = 200;
  w.parliament!.seats = { [w.player!.partei.kurz]: 400 };
  return w;
}

/** Ein Krieg gegen `landId` mit Zielraum, über Spannung, Drohkulisse und Parlamentsbeschluss. */
function krieg(w: World, landId: string, zielraum?: string): KriegVorgang {
  weltZustand(w)[landId]!.konflikt = 80;
  kriegMonat(w, new Rng(1));
  const k = kriegMit(w, landId)!;
  expect(k).toBeTruthy();
  k.eskalation = 80;
  advance(w, 1);
  expect(k.phase).toBe("drohkulisse");
  if (zielraum) expect(waehleZielraum(w, k.id, zielraum).ok).toBe(true);
  fuehreKriegHandlungAus(w, k.id, "ziel_verteidigung");
  fuehreKriegHandlungAus(w, k.id, "beschluss");
  advance(w, KRIEG.beschlussTage);
  expect(k.phase).toBe("krieg");
  w.spiel!.ereignisse = [];
  return k;
}

describe("Daten der Schauplätze", () => {
  test("jede Region hat Namen in drei Sprachen und liegt nahe ihrem Schauplatz", () => {
    for (const r of REGIONEN) {
      const key = `krieg.region.${r.id}` as keyof typeof de;
      expect(de[key], r.id).toBeTruthy();
      expect((tr as Record<string, string>)[key], r.id).toBeTruthy();
      expect((en as Record<string, string>)[key], r.id).toBeTruthy();
      const s = SCHAUPLAETZE.find((x) => x.id === r.schauplatz)!;
      expect(Math.abs(r.lon - s.lon), r.id).toBeLessThan(6);
      expect(Math.abs(r.lat - s.lat), r.id).toBeLessThan(4);
    }
  });

  test("jede Region hat eine Fläche aus der Karte, die ihren Ort umgibt (Annexion und Besetzung färben echtes Gebiet)", () => {
    const fl = FLAECHEN as unknown as Record<string, [number, number][][]>;
    for (const r of REGIONEN) {
      const ringe = fl[r.id];
      expect(ringe?.length, r.id).toBeGreaterThan(0);
      const pts = ringe!.flat();
      const lon = pts.map((p) => p[0]);
      const lat = pts.map((p) => p[1]);
      // Der Ort liegt in der Hülle seiner Fläche (Rahmen mit kleinem Spielraum für Küstenorte)
      expect(r.lon, r.id).toBeGreaterThan(Math.min(...lon) - 0.15);
      expect(r.lon, r.id).toBeLessThan(Math.max(...lon) + 0.15);
      expect(r.lat, r.id).toBeGreaterThan(Math.min(...lat) - 0.15);
      expect(r.lat, r.id).toBeLessThan(Math.max(...lat) + 0.15);
    }
  });

  test("jeder Zielraum hat Regionen seines Landes; Grenzprovinzen sind echte Kennziffern", () => {
    for (const z of ZIELRAEUME) {
      const ids = ZIELRAUM_REGIONEN[z.id];
      expect(ids?.length, z.id).toBeGreaterThan(0);
      const s = SCHAUPLAETZE.find((x) => x.land === z.land)!;
      for (const id of ids!) expect(REGIONEN.find((r) => r.id === id)?.schauplatz, `${z.id}:${id}`).toBe(s.id);
    }
    for (const s of SCHAUPLAETZE) for (const p of s.grenzprovinzen) expect(p >= 1 && p <= 81).toBe(true);
  });

  test("gleiche Schlüssel und Platzhalter in Deutsch, Türkisch, Englisch", () => {
    // Türkische Fallendungen ({land|dat}) zählen als derselbe Platzhalter; Zahlenformate ({n, number}) ebenso
    const platz = (s: string) => [...new Set([...s.matchAll(/\{(\w+)(?:\|\w+|, ?\w+[^}]*)?\}/g)].map((m) => m[1]))].sort().join(",");
    expect(Object.keys(tr).sort()).toEqual(Object.keys(de).sort());
    expect(Object.keys(en).sort()).toEqual(Object.keys(de).sort());
    for (const [k, v] of Object.entries(de)) {
      expect(platz((tr as Record<string, string>)[k]!), k).toBe(platz(v));
      expect(platz((en as Record<string, string>)[k]!), k).toBe(platz(v));
    }
  });
});

describe("Regionen folgen der Front", () => {
  test("mit einer Bodenoffensive fallen Regionen in der Reihenfolge der Tiefe", () => {
    const w = welt();
    const k = krieg(w, "SYR", "syr_tief");
    waehleEinsatz(w, k, "boden");
    k.front = 80;
    regionenSetzen(w, k);
    const ziel = zielRegionen(k);
    const eigene = ziel.filter((r) => k.regionen![r.id] === "eigen");
    expect(eigene.length).toBeGreaterThan(2);
    // Keine tiefere Region fällt vor einer flacheren
    const tiefsteEigene = Math.max(...eigene.map((r) => r.tiefe));
    for (const r of ziel) if (r.tiefe < tiefsteEigene) expect(k.regionen![r.id]).toBe("eigen");
    expect(ziel.some((r) => k.regionen![r.id] === "umkaempft")).toBe(true);
  });

  test("Luftschläge allein nehmen nur die Grenzreihe; dahinter kommt die Front kaum voran", () => {
    const w = welt();
    const k = krieg(w, "SYR", "syr_tief");
    expect(waehleEinsatz(w, k, "luft").ok).toBe(true);
    k.front = 90;
    regionenSetzen(w, k);
    for (const r of zielRegionen(k)) if (r.tiefe > 1) expect(k.regionen![r.id], r.id).not.toBe("eigen");
    const f = kriegsFaktoren(k);
    expect(f.ausserReichweite).toBe(true);
    expect(f.vorstoss).toBeLessThan(0.4);
  });

  test("Gelände zählt: Inseln brauchen die Marine, Ebenen die Panzer", () => {
    const w = welt();
    const k = krieg(w, "GRC", "grc_inseln");
    const sichten = einsatzSichten(w, k);
    const see = sichten.find((s) => s.id === "see")!;
    const boden = sichten.find((s) => s.id === "boden")!;
    expect(see.eignung).toBeGreaterThan(boden.eignung * 3);
    expect(sichten.find((s) => s.id === "stellvertreter")!.moeglich, "keine Stellvertreter in der Ägäis").toBe(false);
  });

  test("ein gegnerischer Vorstoß bedroht türkische Grenzprovinzen und erscheint auf der Karte", () => {
    const w = welt();
    const k = krieg(w, "SYR");
    k.front = 20;
    regionenSetzen(w, k);
    expect(k.bedroht!.length).toBeGreaterThan(0);
    const karte = kriegsKarte(w, kriege(w), () => [37, 37]);
    expect(karte).not.toBeNull();
    expect(karte!.bedroht.length).toBe(k.bedroht!.length);
    expect(karte!.pfeile.some((p) => p.seite === "gegner")).toBe(true);
  });
});

describe("Bestand entscheidet und zehrt sich auf", () => {
  test("mehr und modernere Drohnen machen einen Luftkrieg spürbar stärker", () => {
    const w1 = welt();
    const k1 = krieg(w1, "SYR");
    waehleEinsatz(w1, k1, "luft");
    const w2 = welt();
    const k2 = krieg(w2, "SYR");
    waehleEinsatz(w2, k2, "luft");
    const d = streitkraefte(w2).gattungen.drohnen;
    d.menge *= 1.8;
    d.generation = 5;
    expect(eigenStaerke(w2, k2) / eigenStaerke(w1, k1)).toBeGreaterThan(1.2);
  });

  test("ein ausgebluteter Gegner ist deutlich schwächer", () => {
    const w = welt();
    const k = krieg(w, "SYR");
    waehleEinsatz(w, k, "boden");
    const vorher = gegnerStaerke(w, "SYR");
    gegnerBestand(w, k).heer.menge = 40;
    expect(gegnerStaerke(w, "SYR")).toBeLessThan(vorher * 0.75);
  });

  test("Kriegswochen kosten beide Seiten Bestand; hartes Tempo kostet mehr", () => {
    const lauf = (tempo: "vorsichtig" | "hart") => {
      const w = welt();
      const k = krieg(w, "SYR", "syr_grenzstreifen");
      waehleEinsatz(w, k, "boden");
      waehleTempo(w, k, tempo);
      const panzer0 = streitkraefte(w).gattungen.panzer.menge;
      advance(w, 7 * 8);
      return { panzer: panzer0 - streitkraefte(w).gattungen.panzer.menge, gegner: 100 - gegnerBestand(w, k).heer.menge, k };
    };
    const v = lauf("vorsichtig");
    const h = lauf("hart");
    expect(v.panzer).toBeGreaterThan(0);
    expect(v.gegner).toBeGreaterThan(0);
    expect(h.panzer).toBeGreaterThan(v.panzer);
  });
});

describe("Besatzung nach dem Frieden", () => {
  function besetzt(w: World): KriegVorgang {
    const k = krieg(w, "SYR", "syr_grenzstreifen");
    waehleEinsatz(w, k, "boden");
    k.front = 95;
    regionenSetzen(w, k);
    k.phase = "waffenruhe";
    besatzungNachFrieden(w, k, 1);
    return k;
  }

  test("gehaltene Regionen werden Pufferzone und kosten jeden Monat", () => {
    const w = welt();
    besetzt(w);
    const liste = besatzung(w);
    expect(liste.length).toBeGreaterThan(0);
    expect(liste.every((b) => b.form === "pufferzone")).toBe(true);
    const schuld = w.economy.debtRatio;
    kriegMonat(w, new Rng(3));
    expect(w.economy.debtRatio).toBeGreaterThan(schuld);
  });

  test("Annexion kostet Ansehen und das Verhältnis zur EU; Rückgabe beendet die Besatzung", () => {
    const w = welt();
    besetzt(w);
    const id = besatzung(w)[0]!.region;
    const ansehen = nationalAverage(NET, w.net, "ansehen");
    const euKonflikt = weltZustand(w)["EU"]!.konflikt;
    expect(aendereBesatzung(w, id, "annexion").ok).toBe(true);
    expect(nationalAverage(NET, w.net, "ansehen")).toBeLessThan(ansehen);
    expect(weltZustand(w)["EU"]!.konflikt).toBeGreaterThan(euKonflikt);
    expect(aendereBesatzung(w, id, "rueckgabe").ok).toBe(true);
    expect(besatzung(w).some((b) => b.region === id)).toBe(false);
  });

  test("ohne Gebietsgewinn kehren alle Regionen zurück", () => {
    const w = welt();
    const k = krieg(w, "SYR", "syr_grenzstreifen");
    k.front = 90;
    regionenSetzen(w, k);
    besatzungNachFrieden(w, k, 0);
    expect(Object.values(k.regionen!).every((l) => l === "gegner")).toBe(true);
    expect(besatzung(w)).toHaveLength(0);
  });
});

describe("Migration und Nichtkrieg", () => {
  test("ein Konfliktvorgang ohne die neuen Felder rechnet wie zuvor und legt den Gegnerbestand an", () => {
    const w = welt();
    const k = krieg(w, "GRC");
    delete k.einsatz;
    delete k.tempo;
    delete k.gegnerBestand;
    delete k.regionen;
    expect(() => eigenStaerke(w, k)).not.toThrow();
    expect(gegnerStaerke(w, "GRC")).toBeGreaterThan(0);
    expect(k.gegnerBestand).toBeTruthy();
    advance(w, 14);
    expect(k.regionen).toBeTruthy();
  });

  test("ohne Krieg und Besatzung zeigt die Karte nichts", () => {
    const w = welt();
    expect(kriegsKarte(w, kriege(w), () => [0, 0])).toBeNull();
    delete w.spiel!.besatzung;
    expect(besatzung(w)).toEqual([]);
  });
});
