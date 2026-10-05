// Wort halten: Was eine Antwort ankündigt, geschieht auch (Ministerien, Alter, Friedenspakete, Beschlüsse mit Dauer, Biografie).

import { describe, expect, test } from "vitest";
import { createWorld } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { startAfterElection, type PlayerProfile } from "../src/sim/prolog";
import { antworten, entscheide, oeffne } from "../src/sim/ereignisse";
import { loeseZusageEin } from "../src/sim/zusagen";
import { figur } from "../src/sim/figuren";
import { startAlter } from "../src/sim/enden";
import { PAKETE } from "../src/sim/krieg";
import { FOLGEN } from "../src/sim/biografie";
import { stufeIn } from "../src/sim/handeln";
import { Rng } from "../src/sim/rng";
import { readFileSync } from "node:fs";
import { tIn } from "../src/i18n";
import type { World } from "../src/sim/types";

const profil = (extra: Partial<PlayerProfile> = {}): PlayerProfile => ({
  name: "Test",
  heimat: "Ankara",
  heimatPlaka: 6,
  jugend: "",
  beruf: "",
  partner: "",
  motiv: "",
  partei: { name: "Aufbruchspartei", kurz: "AP", farbe: "#2f5d62" },
  naehe: {},
  buendnis: "YENİ",
  versprechen: ["Der YENİ Parti wurden zwei Ministerien zugesagt."],
  wahl: { runde: 2, anteil: 51 },
  ...extra,
});

function spiel(p: PlayerProfile = profil(), seed = 7): World {
  const w = createWorld(turkey2026, seed);
  startAfterElection(w, p);
  return w;
}

const ministerZusage = (w: World) => w.spiel!.zusagen.find((z) => z.id === "z-ministerien")!;
const yeniMinister = (w: World) => w.spiel!.figuren.filter((f) => f.partei === "YENİ" && f.amt !== "partner").length;

describe("Zusage „zwei Ministerien“", () => {
  test("„Zwei Ministerien abgeben“ übergibt wirklich zwei Ressorts und erfüllt die Zusage", () => {
    const w = spiel();
    const ev = w.spiel!.ereignisse.find((e) => e.vorlage === "start_partner") ?? oeffne(w, "start_partner", new Rng(3))!;
    const opt = antworten(w, ev).find((o) => o.id === "grosszuegig")!;
    expect(opt.label).toMatch(/Ministerien/);
    w.spiel!.kapital = 50;
    const vorher = yeniMinister(w);
    const r = entscheide(w, ev.id, "grosszuegig", new Rng(1));
    expect(r.ok).toBe(true);
    expect(yeniMinister(w) - vorher).toBe(2);
    expect(ministerZusage(w).erfuellt).toBe(true);
  });

  test("„Ein Ministerium jetzt“ übergibt eins und lässt die Zusage offen", () => {
    const w = spiel();
    const ev = w.spiel!.ereignisse.find((e) => e.vorlage === "start_partner") ?? oeffne(w, "start_partner", new Rng(3))!;
    w.spiel!.kapital = 50;
    const vorher = yeniMinister(w);
    entscheide(w, ev.id, "knapp", new Rng(1));
    expect(yeniMinister(w) - vorher).toBe(1);
    expect(ministerZusage(w).erfuellt).toBe(false);
  });

  test("Einlösen der Zusage im Zusagen-Reiter übergibt ebenfalls zwei Ressorts", () => {
    const w = spiel();
    const vorher = yeniMinister(w);
    const r = loeseZusageEin(w, ministerZusage(w));
    expect(r.ok).toBe(true);
    expect(yeniMinister(w) - vorher).toBe(2);
    expect(ministerZusage(w).erfuellt).toBe(true);
  });
});

describe("Alter der Spielfigur", () => {
  test("das im Prolog gewählte Alter ist maßgeblich, über mehrere Seeds", () => {
    for (const seed of [1, 2, 3]) {
      const w = spiel(profil({ aussehen: { geschlecht: "f", alter: 40, gesicht: 1, haare: 1, brille: false, bart: "keiner", kopftuch: false } }), seed);
      expect(startAlter(w)).toBe(40);
    }
  });

  test("ältere Stände ohne gewähltes Alter behalten den gespeicherten Wert", () => {
    const w = spiel(profil());
    const a = startAlter(w);
    expect(startAlter(w)).toBe(a);
  });
});

describe("Friedenspakete versprechen keinen Gebietswechsel, den es nicht gibt", () => {
  test("kein Paket spricht von Gebietsgewinn oder Gebietsabtretung", () => {
    for (const p of Object.values(PAKETE)) expect(p.text).not.toMatch(/Gebietsgewinn|Gebietsabtretung/);
    expect(PAKETE.paket_sieg!.text).toMatch(/Pufferzone/);
  });
});

describe("Beschlüsse mit Dauer", () => {
  test("ein Streikverbot senkt die Gewerkschaftsrechte dauerhaft", () => {
    const w = spiel();
    w.spiel!.kapital = 50;
    const ev = oeffne(w, "streikwelle", new Rng(2), { provinzen: [34], staerke: 1 })!;
    const vorher = stufeIn(w, "m_gewerkschaftsrechte", null);
    expect(entscheide(w, ev.id, "verbot", new Rng(2)).ok).toBe(true);
    expect(w.net.targets["m_gewerkschaftsrechte"]).toBe(Math.max(0, Math.round(vorher) - 25)); // Ziel, das schrittweise erreicht wird
  });
});

describe("Biografie: jede Wirkung hat einen Grund", () => {
  test("der Arzt senkt nicht mehr die Fähigkeit des Finanzministers", () => {
    expect(FOLGEN.arzt!.preis.some((x) => x.art === "faehigkeit")).toBe(false);
    expect(FOLGEN.krankenpfleger!.preis.some((x) => x.art === "faehigkeit")).toBe(false);
    expect(tIn("de", "biografie.arzt.preis")).toMatch(/verlässt du dich/);
  });
});

describe("Katalog „wort“ in drei Sprachen", () => {
  test("gleiche Schlüssel und Platzhalter", () => {
    const lade = (l: string) => JSON.parse(readFileSync(new URL(`../src/i18n/katalog/${l}/wort.json`, import.meta.url), "utf8")) as Record<string, string>;
    const platz = (s: string) => [...s.matchAll(/\{(\w+)/g)].map((m) => m[1]).sort().join(",");
    const de = lade("de");
    expect(Object.keys(de).length).toBeGreaterThan(30);
    for (const l of ["tr", "en"]) {
      const k = lade(l);
      expect(Object.keys(k).sort()).toEqual(Object.keys(de).sort());
      for (const key of Object.keys(de)) expect(platz(k[key]!), `${l}:${key}`).toBe(platz(de[key]!));
    }
  });
});

test("ein frischer Partnerminister bleibt eine Figur mit Amt", () => {
  const w = spiel();
  loeseZusageEin(w, ministerZusage(w));
  expect(figur(w, "wirtschaft")?.partei).toBe("YENİ");
});
