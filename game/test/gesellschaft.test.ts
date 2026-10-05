// Gesellschaft mit Gedächtnis: Milieus und Groll, Opposition als Akteur, Bewegungen, Rathäuser und Kommunalwahl, Bots.
import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { advance, createWorld } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { startAfterElection, type PlayerProfile } from "../src/sim/prolog";
import { gesellschaftLage, gesellschaftMonat, gesellschaftVon, gesellschaftWahlDruck, milieuLage, MILIEU_IDS } from "../src/sim/gesellschaft";
import { oppositionInstrument, oppositionInstrumente, oppositionVon } from "../src/sim/opposition";
import { ARTEN, bewegungAntworten, bewegungenSicht, bewegungsOrte, starteBewegung } from "../src/sim/bewegungen";
import { kommunalwahlDurchfuehren, kommunenVon, rathaeuserLager, zwangsverwalterEinsetzen } from "../src/sim/kommunen";
import { wirke } from "../src/sim/wirkung";
import { entscheide, standardAntwort } from "../src/sim/ereignisse";
import { Rng } from "../src/sim/rng";
import type { World } from "../src/sim/types";

const profil = (): PlayerProfile => ({
  name: "Test",
  heimat: "Ankara",
  heimatPlaka: 6,
  jugend: "",
  beruf: "Ökonom",
  partner: "",
  motiv: "",
  partei: { name: "Partei der Werte", kurz: "PW", farbe: "#555" },
  naehe: {},
  versprechen: [],
  wahl: { runde: 2, anteil: 51 },
});

function welt(seed = 3): World {
  const w = createWorld(turkey2026, seed);
  startAfterElection(w, profil());
  return w;
}

const tage = (w: World, n: number, rng = new Rng(7)) => {
  for (let i = 0; i < n; i++) {
    advance(w, 1);
    for (const ev of [...(w.spiel?.ereignisse ?? [])]) {
      const id = standardAntwort(w, ev);
      if (id) entscheide(w, ev.id, id, rng);
    }
    if (w.spiel) w.spiel.hinweise = [];
    if (w.spiel?.ende) break;
  }
};

describe("Zustand und Migration", () => {
  test("ältere Spielstände ohne Feld bekommen einen Start aus der Lage", () => {
    const w = welt();
    delete w.spiel!.gesellschaft;
    const g = gesellschaftVon(w);
    expect(Object.keys(g.milieus).sort()).toEqual([...MILIEU_IDS].sort());
    expect(Object.keys(g.kommunen.rathaus)).toHaveLength(81);
    expect(g.kommunen.naechste >= w.date).toBe(true);
    expect(g.opposition.partei.length).toBeGreaterThan(0);
    expect(JSON.parse(JSON.stringify(g))).toEqual(g);
  });

  test("der Monatsschritt läuft mit der Spielschleife und schreibt den Verlauf", () => {
    const w = welt();
    tage(w, 100);
    const g = gesellschaftVon(w);
    expect(g.verlauf.length).toBeGreaterThanOrEqual(3);
    expect(gesellschaftLage(w)).toHaveLength(6);
    expect(milieuLage(w)).toHaveLength(5);
  });
});

describe("Milieus mit Gedächtnis", () => {
  test("Groll wächst bei schlechter Lage und vergeht nicht in einem guten Monat", () => {
    const w = welt();
    const g = gesellschaftVon(w);
    const vorher = g.milieus.kurden.groll;
    for (let i = 0; i < 6; i++) {
      wirke(w, "minderheiten", -15);
      wirke(w, "ausnahmerecht", 15);
      g.monat = "";
      gesellschaftMonat(w);
    }
    const hoch = g.milieus.kurden.groll;
    expect(hoch).toBeGreaterThan(vorher + 5);
    wirke(w, "minderheiten", 40);
    g.monat = "";
    gesellschaftMonat(w);
    expect(g.milieus.kurden.groll).toBeGreaterThan(hoch * 0.8);
  });
});

describe("Bewegungen", () => {
  test("eine neue Bewegung kündigt sich an (Vorwarnung) und erscheint auf der Karte", () => {
    const w = welt();
    const b = starteBewegung(w, "teuerung", [34, 6], 15)!;
    expect(b.phase).toBe("keimt");
    expect(w.spiel!.hinweise.some((h) => h.id.startsWith("gesellschaft-warn-"))).toBe(true);
    expect(bewegungsOrte(w).map((o) => o.plaka)).toEqual([34, 6]);
  });

  test("Polizei schrumpft kurz und radikalisiert, Dialog senkt die Radikalität", () => {
    const w = welt();
    w.spiel!.kapital = 100;
    const a = starteBewegung(w, "studenten", [34], 30)!;
    const r0 = a.radikalitaet;
    expect(bewegungAntworten(w, a.id, "polizei").ok).toBe(true);
    expect(a.groesse).toBeLessThan(30);
    expect(a.radikalitaet).toBeGreaterThan(r0);
    expect(gesellschaftVon(w).repression).toBeGreaterThan(0);
    const b = starteBewegung(w, "frauen", [35], 30)!;
    const rb = b.radikalitaet;
    bewegungAntworten(w, b.id, "dialog");
    expect(b.radikalitaet).toBeLessThan(rb);
    // Abkühlung
    expect(bewegungAntworten(w, b.id, "polizei").ok).toBe(false);
  });

  test("ohne Antwort wächst eine Bewegung bei hohem Druck zur Massenbewegung", () => {
    const w = welt();
    const b = starteBewegung(w, "teuerung", [34], 30)!;
    const g = gesellschaftVon(w);
    for (let i = 0; i < 8; i++) {
      wirke(w, "protestdruck", 20);
      b.maertyrer = 40;
      g.monat = "";
      gesellschaftMonat(w);
    }
    expect(["massen", "waechst"]).toContain(b.phase);
    expect(bewegungenSicht(w)[0]!.antworten).toHaveLength(4);
  });
});

describe("Opposition", () => {
  test("handelt innerhalb eines Jahres selbst", () => {
    const w = welt();
    tage(w, 365);
    expect(oppositionVon(w).zuege.length).toBeGreaterThan(0);
  });

  test("Ermittlungen schwächen sofort und stärken über Märtyrer; Verbot entscheidet nach 180 Tagen", () => {
    const w = welt();
    w.spiel!.kapital = 100;
    const o = oppositionVon(w);
    const s0 = o.staerke;
    expect(oppositionInstrument(w, "ermittlung").ok).toBe(true);
    expect(o.staerke).toBeLessThan(s0);
    expect(o.maertyrer).toBeGreaterThan(0);
    expect(oppositionInstrumente(w).find((i) => i.id === "ermittlung")!.moeglich).toBe(false);
    expect(oppositionInstrument(w, "verbot").ok).toBe(true);
    expect(o.verbot?.ausgang).toBeUndefined();
    tage(w, 230);
    expect(o.verbot?.ausgang).toMatch(/verboten|abgewiesen/);
    expect(gesellschaftWahlDruck(w)).toBeGreaterThanOrEqual(-4);
  });
});

describe("Rathäuser und Kommunalwahl", () => {
  test("Start aus den Bürgermeistern 2024, Wahl im März 2029 verteilt Rathäuser, Verwalter enden", () => {
    const w = welt();
    w.spiel!.kapital = 100;
    const k = kommunenVon(w);
    expect(k.naechste).toBe("2029-03-25");
    const opp = Object.entries(k.rathaus).find(([, r]) => r.partei === "CHP")!;
    expect(zwangsverwalterEinsetzen(w, Number(opp[0])).ok).toBe(true);
    expect(k.rathaus[opp[0]]!.verwalter).toBeDefined();
    const r = kommunalwahlDurchfuehren(w, 0);
    expect(r.ergebnis.lagerNachher).toBe(rathaeuserLager(w));
    expect(k.rathaus[opp[0]]!.verwalter).toBeUndefined();
    expect(k.naechste).toBe("2034-03-26");
  });

  test("die Kommunalwahl findet im Spielverlauf 2029 statt", () => {
    const w = welt(5);
    tage(w, 330);
    expect(w.date >= "2029-04-01").toBe(true);
    expect(kommunenVon(w).wahlen.length).toBe(1);
  });
});

describe("Katalog", () => {
  test("alle Schlüssel in drei Sprachen, auch die zusammengesetzten", () => {
    const lade = (l: string) => JSON.parse(readFileSync(`src/i18n/katalog/${l}/gesellschaft.json`, "utf-8")) as Record<string, string>;
    const de = lade("de");
    const en = lade("en");
    const tr = lade("tr");
    expect(Object.keys(en).sort()).toEqual(Object.keys(de).sort());
    expect(Object.keys(tr).sort()).toEqual(Object.keys(de).sort());
    const noetig = [
      ...ARTEN.map((a) => `ges.bew.art.${a.art}`),
      ...["keimt", "waechst", "massen", "abklingend"].map((p) => `ges.bew.phase.${p}`),
      ...["dialog", "zugestaendnis", "polizei", "verbot"].flatMap((a) => [`ges.bew.antwort.${a}`, `ges.bew.ergebnis.${a}`, `ges.bew.ende.${a}`]),
      ...["kampagne", "ausschuss", "grossdemo", "buendnis", "boykott", "anfrage"].flatMap((z) => [`ges.opp.zug.${z}.titel`, `ges.opp.zug.${z}.text`, `ges.opp.zugart.${z}`]),
      ...["gespraech", "ausschuss_zulassen", "ermittlung", "immunitaet", "verbot"].map((i) => `ges.opp.instrument.${i}`),
      ...MILIEU_IDS.map((m) => `ges.milieu.${m}`),
      ...["polarisierung", "protest", "opposition", "repression", "rathaeuser", "groll"].flatMap((k) => [`ges.kz.${k}`, `ges.kz.${k}.text`]),
    ];
    for (const k of noetig) expect(de[k], k).toBeTruthy();
  });
});

// Messung mit Bots (GESELLSCHAFT_BOTS=1 für die Tabelle): repressiv, dialogisch, passiv über drei Jahre
const BOTS = process.env.GESELLSCHAFT_BOTS === "1";
describe.runIf(BOTS)("Bots", () => {
  type Bot = (w: World) => void;
  const repressiv: Bot = (w) => {
    for (const s of bewegungenSicht(w)) bewegungAntworten(w, s.b.id, "polizei");
    oppositionInstrument(w, "ermittlung");
  };
  const dialogisch: Bot = (w) => {
    for (const s of bewegungenSicht(w)) bewegungAntworten(w, s.b.id, s.b.groesse > 30 ? "zugestaendnis" : "dialog");
    oppositionInstrument(w, "gespraech");
    oppositionInstrument(w, "ausschuss_zulassen");
  };
  const passiv: Bot = () => {};
  test("Tabelle", () => {
    const zeilen: string[] = [];
    for (const [name, bot] of [["passiv", passiv], ["repressiv", repressiv], ["dialogisch", dialogisch]] as const) {
      const werte: number[][] = [];
      for (const seed of [1, 2, 3, 4, 5, 6]) {
        const w = welt(seed);
        let bewegungen = 0;
        let massen = 0;
        for (let m = 0; m < 36 && !w.spiel!.ende; m++) {
          tage(w, 30);
          bot(w);
          const g = gesellschaftVon(w);
          bewegungen += g.bewegungen.length;
          massen += g.bewegungen.filter((b) => b.phase === "massen").length;
        }
        const g = gesellschaftVon(w);
        const groll = MILIEU_IDS.reduce((s, id) => s + g.milieus[id].groll, 0) / MILIEU_IDS.length;
        werte.push([w.spiel!.umfrage.zustimmung, g.opposition.staerke, g.repression, groll, bewegungen / 36, massen, rathaeuserLager(w)]);
      }
      const mittel = werte[0]!.map((_, i) => werte.reduce((s, r) => s + r[i]!, 0) / werte.length);
      zeilen.push(`${name}: Zustimmung ${mittel[0]!.toFixed(1)} · Opposition ${mittel[1]!.toFixed(1)} · Repression ${mittel[2]!.toFixed(1)} · Groll ${mittel[3]!.toFixed(1)} · Bewegungen/Monat ${mittel[4]!.toFixed(2)} · Massenmonate ${mittel[5]!.toFixed(1)} · Rathäuser ${mittel[6]!.toFixed(1)}`);
    }
    console.log(zeilen.join("\n"));
  }, 600_000);
});
