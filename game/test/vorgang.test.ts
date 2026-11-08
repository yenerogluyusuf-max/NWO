// Vorgänge: ein Vorhaben vom Versprechen bis zur Rechenschaft (Fall Hatay).

import { describe, expect, test } from "vitest";
import { advance, createWorld } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { schnellProfil, startAfterElection } from "../src/sim/prolog";
import { buergermeisterPartei, entscheideVorgang, offenerKonflikt, starteVorgang, vorgaenge, vorgaengeAbgleichen, vorgangZu, wegeFuer, zweiterAbschnitt } from "../src/sim/vorgaenge";
import { istLagerPartei } from "../src/sim/kommunen";
import { katalogVon, ladeSprache, platzhalter } from "../src/i18n";
import type { World } from "../src/sim/types";

function spiel(seed = 11): World {
  const w = createWorld(turkey2026, seed);
  let s = seed;
  const r = () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
  startAfterElection(w, schnellProfil("Test", (n) => Math.floor(r() * n)));
  return w;
}

/** Bis zur nächsten offenen Entscheidung vorspulen (höchstens `tage`). */
function bisKonflikt(w: World, id: string, tage = 400): void {
  for (let i = 0; i < tage; i++) {
    if (offenerKonflikt(vorgangZu(w, id)!)) return;
    advance(w, 1);
  }
}

describe("Vorgang Wohnungen in Hatay", () => {
  test("vom Versprechen über Finanzierung, Rathaus, Bau und Übergabe bis zur Rechenschaft", () => {
    const w = spiel();
    const v = starteVorgang(w, { ursprung: { art: "frei", ref: "test-hatay" }, plaka: 31, wohnungen: 8000, begruendung: "Sichere Wohnungen nach dem Beben." });
    expect(v.schritt).toBe("planung");
    expect(v.begruendung).toContain("Sichere");

    bisKonflikt(w, v.id);
    const k1 = offenerKonflikt(v)!;
    expect(k1.art).toBe("finanzierung");
    const wege = wegeFuer(w, v).map((x) => x.id);
    expect(wege).toEqual(["haushalt", "verdraengen", "partner"]);
    const schulden = w.economy.debtRatio;
    expect(entscheideVorgang(w, v.id, "haushalt").ok).toBe(true);
    expect(w.economy.debtRatio).toBeGreaterThan(schulden);

    // Das Rathaus: gehört es nicht zum Lager, blockiert es die Grundstücke (für den Test auf eine Oppositionspartei gesetzt)
    const g = w.spiel!.gesellschaft;
    if (g) g.kommunen.rathaus["31"] = { ...g.kommunen.rathaus["31"]!, partei: "OPP-TEST" };
    const partei = buergermeisterPartei(w, 31);
    const blockiert = !istLagerPartei(w, partei);
    expect(blockiert).toBe(true);
    if (blockiert) {
      bisKonflikt(w, v.id, 60);
      const k2 = offenerKonflikt(v)!;
      expect(k2.art).toBe("grundstuecke");
      expect(wegeFuer(w, v).map((x) => x.id)).toEqual(["kompromiss", "druck", "umgehung", "aufgeben"]);
      w.spiel!.kapital = Math.max(w.spiel!.kapital, 10);
      expect(entscheideVorgang(w, v.id, "kompromiss").ok).toBe(true);
    }

    // Bau, Übergabe, Wirkung
    for (let i = 0; i < 1000 && v.schritt !== "abgeschlossen"; i++) advance(w, 1);
    expect(v.schritt).toBe("abgeschlossen");
    expect(v.stoss!.wohnungsnot).toBeLessThan(0);
    const r = v.rechenschaft!;
    expect(r.erwartet.wohnungsnot).toBeLessThan(0);
    expect(Number.isFinite(r.eingetreten.wohnungsnot)).toBe(true);
    expect(Number.isFinite(r.eigen.wohnungsnot)).toBe(true);
    expect(["eigen", "gemischt", "andere", "unsicher"]).toContain(r.zuordnung);
    expect(r.korrektur.length).toBeGreaterThan(0);
    // Der Verlauf erzählt den ganzen Vorgang
    const ks = v.verlauf.map((e) => e.k);
    for (const s of ["vorgang.log.angelegt", "vorgang.log.weg.haushalt", "vorgang.log.schritt.bau", "vorgang.log.schritt.uebergabe", "vorgang.log.schritt.abgeschlossen"]) expect(ks).toContain(s);
    if (blockiert) expect(ks).toContain("vorgang.log.weg.kompromiss");

    // Korrektur: ein zweiter Bauabschnitt
    expect(zweiterAbschnitt(w, v.id).ok).toBe(true);
    expect(vorgaenge(w).length).toBe(2);
  });

  test("Aufgeben beendet den Vorgang ehrlich", () => {
    const w = spiel(13);
    const v = starteVorgang(w, { ursprung: { art: "frei", ref: "test-auf" }, plaka: 31, wohnungen: 3000 });
    bisKonflikt(w, v.id);
    entscheideVorgang(w, v.id, "haushalt");
    w.spiel!.gesellschaft && (w.spiel!.gesellschaft.kommunen.rathaus["31"] = { ...w.spiel!.gesellschaft.kommunen.rathaus["31"]!, partei: "ZZZ" });
    if (!istLagerPartei(w, buergermeisterPartei(w, 31))) {
      bisKonflikt(w, v.id, 60);
      expect(entscheideVorgang(w, v.id, "aufgeben").ok).toBe(true);
      expect(v.schritt).toBe("aufgegeben");
    }
  });

  test("Ohne Entscheidung greift der Standardweg nach der Frist", () => {
    const w = spiel(17);
    const v = starteVorgang(w, { ursprung: { art: "frei", ref: "test-std" }, plaka: 31, wohnungen: 2000 });
    for (let i = 0; i < 200 && !v.finanzierung; i++) advance(w, 1);
    expect(v.finanzierung?.weg).toBe("haushalt");
    expect(v.verlauf.map((e) => e.k)).toContain("vorgang.log.standard");
  });

  test("Wahlversprechen „Staatlicher Wohnungsbau“ legt automatisch einen Vorgang an", () => {
    const w = spiel(19);
    w.spiel!.zusagen.push({ id: "z-wahl-v_wohnen", von: "Wähler", text: "Im Wahlkampf versprochen: Staatlicher Wohnungsbau", faellig: w.day + 365, massnahme: "m_sozialwohnungen", richtung: 1, erfuellt: false, gebrochen: false });
    vorgaengeAbgleichen(w);
    vorgaengeAbgleichen(w);
    const vs = vorgaenge(w).filter((v) => v.ursprung.art === "wahlversprechen");
    expect(vs.length).toBe(1);
  });

  test("Migration: ältere Spielstände ohne Vorgänge laufen weiter", () => {
    const w = spiel(23);
    delete w.spiel!.vorgaenge;
    advance(w, 70);
    expect(Array.isArray(w.spiel!.vorgaenge)).toBe(true);
  });

  test("Katalog: gleiche Schlüssel und Platzhalter in drei Sprachen", async () => {
    await ladeSprache("tr");
    await ladeSprache("en");
    const de = katalogVon("de");
    const keys = Object.keys(de).filter((k) => k.startsWith("vorgang."));
    expect(keys.length).toBeGreaterThan(40);
    for (const l of ["tr", "en"] as const) {
      const kat = katalogVon(l);
      for (const k of keys) {
        expect(kat[k], `${l} ${k}`).toBeDefined();
        expect(platzhalter(kat[k]!), `${l} ${k}`).toEqual(platzhalter(de[k]!));
      }
    }
  });
});
