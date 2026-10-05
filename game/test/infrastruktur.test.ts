// Infrastruktur als Bestand mit Belastung: Startauslastung aus Daten, Ausbau über das Reich, induzierte Nachfrage, Programme, Bitte, Migration.

import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { advance, createWorld, load } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { schnellProfil, startAfterElection } from "../src/sim/prolog";
import {
  auslastung,
  ausbauAngebot,
  belastungJeProvinz,
  belastungZeilen,
  druck,
  engpaesse,
  infraZustand,
  infrastrukturBitte,
  investiere,
  landesMittel,
  paketAngebot,
  starteProgramm,
} from "../src/sim/infrastruktur";
import { NETZE, START_GRENZEN } from "../src/data/infrastruktur-netze";
import { reichZustand } from "../src/sim/reich";
import { entscheideVorlage, ministerVorlagen } from "../src/sim/ministerfluss";
import { katalogVon, ladeSprache, platzhalter } from "../src/i18n";
import type { World } from "../src/sim/types";

function spiel(seed = 21): World {
  const w = createWorld(turkey2026, seed);
  startAfterElection(w, schnellProfil());
  return w;
}

/** Monate vorspulen, bis ein Vorhaben fertig im Bestand steht (höchstens `max` Monate). */
function bisFertig(w: World, id: string, max = 80): number {
  for (let m = 0; m < max; m++) {
    if (reichZustand(w).bestand[id]) return m;
    advance(w, 30);
  }
  return -1;
}

describe("Netze beim Start", () => {
  test("haben belegte oder abgeleitete Startauslastung in Grenzen, Istanbuls Straßen voller als das Land", () => {
    const w = spiel();
    const z = infraZustand(w);
    for (const n of NETZE) {
      for (const a of z.netze[n.id].start) {
        expect(Number.isFinite(a), n.id).toBe(true);
        if (a > 0) {
          expect(a).toBeGreaterThanOrEqual(START_GRENZEN.min);
          expect(a).toBeLessThanOrEqual(START_GRENZEN.max);
        }
      }
      const m = landesMittel(w, n.id);
      expect(Math.abs(m - n.mittel), n.id).toBeLessThan(0.12);
    }
    expect(auslastung(w, "strasse", 34)!).toBeGreaterThan(landesMittel(w, "strasse"));
    // Provinzen ohne Bahnstrecke im Datensatz haben kein Bahnnetz
    expect(z.netze.bahn.start.filter((a) => a === 0).length).toBeGreaterThan(10);
    expect(belastungJeProvinz(w)).toHaveLength(81);
    expect(belastungZeilen(w, 34).length).toBeGreaterThan(0);
  });

  test("Druck: nur Verschlechterung gegenüber dem Start bremst, Verbesserung entlastet", () => {
    expect(druck(0.7, 0.5)).toBe(0);
    expect(druck(1.1, 1.1)).toBe(0);
    expect(druck(1.2, 1.1)).toBeGreaterThan(0);
    expect(druck(0.8, 1.1)).toBeLessThan(0);
    expect(druck(2, 0.5)).toBe(1);
  });
});

describe("Investieren", () => {
  test("legt ein Vorhaben im Reich an; fertig wächst die Kapazität, neuer Verkehr füllt einen Teil wieder", () => {
    const w = spiel();
    w.spiel!.kapital = 60;
    const vorher = auslastung(w, "strasse", 34)!;
    const an = ausbauAngebot(w, "autobahn", 34);
    expect(an.ok).toBe(true);
    expect(an.nachher!).toBeLessThan(an.vorher!);
    const kapital = w.spiel!.kapital;
    const r = investiere(w, "autobahn", 34, "stammfirma");
    expect(r.ok, r.text).toBe(true);
    expect(w.spiel!.kapital).toBeLessThan(kapital);
    expect(reichZustand(w).laufend.some((l) => l.id === r.id)).toBe(true);
    expect(reichZustand(w).regional?.[r.id!]?.def.instanzVon).toBe("infra_netz");
    // Zweiter Ausbau am selben Ort wird abgelehnt, solange der erste läuft
    expect(investiere(w, "autobahn", 34).ok).toBe(false);
    const monate = bisFertig(w, r.id!);
    expect(monate).toBeGreaterThan(0);
    advance(w, 30);
    const z = infraZustand(w);
    expect(z.ausbau[r.id!]!.fertig).toBe(true);
    expect(z.netze.strasse.kap[33]!).toBeGreaterThan(1.1);
    const direkt = auslastung(w, "strasse", 34)!;
    expect(direkt).toBeLessThan(vorher);
    expect(z.netze.strasse.induziert[33]!).toBeGreaterThan(0);
    advance(w, 30 * 36);
    // Induzierte Nachfrage und Wachstum haben einen Teil des Gewinns wieder gefüllt
    expect(auslastung(w, "strasse", 34)!).toBeGreaterThan(direkt);
  });

  test("Schnellbahn nur, wo es Schienen gibt; Häfen gelten für das ganze Land", () => {
    const w = spiel();
    const ohne = infraZustand(w).netze.bahn.start.findIndex((a) => a === 0) + 1;
    expect(ausbauAngebot(w, "schnellbahn", ohne).ok).toBe(false);
    const hafen = ausbauAngebot(w, "hafen", 0);
    expect(hafen.ok).toBe(true);
    expect(hafen.def!.provinzen).toBeUndefined();
  });

  test("Programm: mehrere Provinzen in einem Vorhaben, günstiger als einzeln, höheres Risiko", () => {
    const w = spiel();
    w.spiel!.kapital = 80;
    const an = paketAngebot(w, "bahnoffensive");
    expect(an.ok).toBe(true);
    expect(an.provinzen.length).toBe(6);
    expect(an.pk!).toBeLessThan(an.einzelnPk!);
    expect(an.def!.ueberzug?.p).toBeGreaterThan(0.3);
    const r = starteProgramm(w, "bahnoffensive");
    expect(r.ok, r.text).toBe(true);
    expect(starteProgramm(w, "bahnoffensive").ok).toBe(false);
    expect(Object.values(infraZustand(w).ausbau).filter((e) => e.paket === "bahnoffensive")).toHaveLength(1);
  });
});

describe("Bitte bei Überlast", () => {
  test("höchstens eine je Monat, mit drei Wegen und Nutzen-Zeilen; die Alternative wirkt sofort", () => {
    const w = spiel();
    w.spiel!.kapital = 60;
    let gesehen = 0;
    const ids = new Set<string>();
    for (let m = 0; m < 24; m++) {
      advance(w, 30);
      const b = infrastrukturBitte(w);
      if (b) {
        ids.add(b.id);
        gesehen++;
        expect(b.optionen.map((o) => o.id)).toEqual(["ausbau", "alternative", "nichts"]);
        for (const o of b.optionen) expect(o.nutzen?.length).toBe(1);
      }
      const offene = ministerVorlagen(w, { tiefe: 0, ungefiltert: true }).filter((v) => v.thema.startsWith("infra:"));
      expect(offene.length).toBeLessThanOrEqual(1);
    }
    expect(gesehen).toBeGreaterThan(0);
    expect(ids.size).toBeLessThanOrEqual(24);
    const b = infrastrukturBitte(w);
    const offen = w.spiel!.infrastruktur!.bitte;
    if (b && offen) {
      const vorher = auslastung(w, offen.netz, offen.plaka) ?? 0;
      const r = entscheideVorlage(w, b.id, "alternative");
      if (r.ok) {
        expect(auslastung(w, offen.netz, offen.plaka)!).toBeLessThan(vorher);
        expect(infrastrukturBitte(w)).toBeNull();
      }
    }
  });
});

describe("Migration", () => {
  test("ein Spielstand ohne Netze legt sie beim Laden an und läuft 24 Monate", () => {
    const w0 = spiel(5);
    advance(w0, 200);
    delete w0.spiel!.infrastruktur;
    const w = load(JSON.stringify(w0));
    expect(w.spiel!.infrastruktur).toBeUndefined();
    advance(w, 30 * 24);
    const z = w.spiel!.infrastruktur!;
    expect(z).toBeDefined();
    for (const n of NETZE) for (const a of z.netze[n.id].nachfrage) expect(Number.isFinite(a)).toBe(true);
    expect(Number.isFinite(w.spiel!.umfrage.zustimmung)).toBe(true);
    expect(engpaesse(w, "strasse", 3)).toHaveLength(3);
  });

  test("der alte Spielstand aus den Downloads (nur gelesen) läuft 24 Monate weiter", () => {
    const pfad = join(homedir(), "Downloads", "staatsraeson_2029-11-20.json");
    if (!existsSync(pfad)) return;
    const datei = JSON.parse(readFileSync(pfad, "utf8")) as { welt?: unknown };
    const w = load(JSON.stringify(datei.welt ?? datei));
    advance(w, 30 * 24);
    expect(w.spiel!.infrastruktur).toBeDefined();
    expect(Number.isFinite(landesMittel(w, "wohnen"))).toBe(true);
  });
});

describe("Katalog", () => {
  test("alle Schlüssel in Türkisch und Englisch mit denselben Platzhaltern", async () => {
    await ladeSprache("tr");
    await ladeSprache("en");
    const de = katalogVon("de");
    const keys = Object.keys(de).filter((k) => k.startsWith("infra.") || k === "karte.ebene.belastung");
    expect(keys.length).toBeGreaterThan(100);
    for (const l of ["tr", "en"] as const) {
      const kat = katalogVon(l);
      for (const k of keys) {
        expect(kat[k], `${l} ${k}`).toBeDefined();
        expect(platzhalter(kat[k]!), `${l} ${k}`).toEqual(platzhalter(de[k]!));
      }
    }
  });
});
