// Welle 4, K7 (krieg.md Schritt 11): Innenpolitik des Krieges. Vollmacht als Zustand mit Verlängerung im Oktober, Mandat nach den
// belegten Haltungen der Fraktionen, Zusagen, gescheiterter Antrag mit Sperre, Kritik unterdrücken, Reservisten am Arbeitsmarkt.
import { describe, expect, test } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { advance, createWorld, load, save } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { startAfterElection, schnellProfil } from "../src/sim/prolog";
import { KRIEG, einsatzAnlass, fuehreKriegHandlungAus, handlungenFuer, kriegMit, kriseEroeffnen, reservistenUnterWaffen } from "../src/sim/krieg";
import { MANDAT, haltungVon, mandatSicht, zusageAngebote } from "../src/sim/mandat";
import { vollmachtAbgeleitet, vollmachtFuer, vollmachtStand } from "../src/sim/krieg-recht";
import { RESERVISTEN, reservistenLuecke } from "../src/sim/reservisten";
import { VORLAGEN, antworten, oeffne } from "../src/sim/ereignisse";
import { verlaengerungFaellig } from "../src/sim/ereignisse-mandat";
import { nationalAverage } from "../src/sim/netz";
import { NET } from "../src/sim/modell";
import { Rng } from "../src/sim/rng";
import type { World } from "../src/sim/types";
import type { KriegVorgang } from "../src/sim/krieg-typen";

function welt(seed = 6): World {
  const w = createWorld(turkey2026, seed);
  startAfterElection(w, schnellProfil());
  w.spiel!.ereignisse = [];
  w.spiel!.kapital = 200;
  return w;
}

/** Die Leiter bis kurz vor den Einsatz (wie test/krieg-leiter.test.ts): Krise, Drohkulisse, Kriegsziel, Ultimatum abgelehnt, Mindestdauer. */
function bisZumEinsatz(w0: () => World, landId: string, rahmung: "schutz" | "revision" = "schutz"): { w: World; k: KriegVorgang } {
  for (let seed = 1; seed < 40; seed++) {
    const w = w0();
    expect(kriseEroeffnen(w, landId).ok).toBe(true);
    const k = kriegMit(w, landId)!;
    advance(w, KRIEG.spannungMinTage);
    fuehreKriegHandlungAus(w, k.id, "drohkulisse");
    fuehreKriegHandlungAus(w, k.id, `ziel_${rahmung}`);
    fuehreKriegHandlungAus(w, k.id, "ultimatum", new Rng(seed));
    if (k.phase === "beendet") continue;
    advance(w, KRIEG.drohkulisseMinTage);
    w.spiel!.ereignisse = [];
    w.spiel!.kapital = 200;
    return { w, k };
  }
  throw new Error("kein abgelehntes Ultimatum");
}

const STAND_2043 = "../spielstand/staatsraeson_2043-08-03.json";
const ladeStand = (pfad: string) => load(JSON.stringify(JSON.parse(readFileSync(pfad, "utf8")).welt));

describe("Haltungen der Fraktionen (belegt)", () => {
  test("AKP, MHP und İYİ dafür; CHP dagegen, aber offen für eine Zusage; DEM immer dagegen", () => {
    expect(haltungVon("AKP")).toBe("dafuer");
    expect(haltungVon("MHP")).toBe("dafuer");
    expect(haltungVon("İYİ")).toBe("dafuer");
    expect(haltungVon("CHP")).toBe("dagegen");
    expect(haltungVon("DEM")).toBe("immer_dagegen");
    const w = welt();
    w.parliament!.seats = { [w.player!.partei.kurz]: 150, AKP: 200, MHP: 40, CHP: 130, DEM: 50, "YENİ": 30 };
    w.spiel!.lager = [];
    const m = mandatSicht(w, { art: "verlaengerung", jahre: 3 });
    const f = (p: string) => m.fraktionen.find((x) => x.partei === p)!;
    expect(f("AKP").ja).toBeGreaterThan(f("AKP").nein);
    expect(f("CHP").nein).toBeGreaterThan(f("CHP").ja);
    expect(f("DEM").ja).toBeLessThanOrEqual(1);
    // Mehrheit der Anwesenden (Art. 96), Enthaltungen zählen mit
    expect(m.anwesend).toBe(Object.values(w.parliament!.seats).reduce((s, n) => s + Math.round(n * MANDAT.beteiligung), 0));
    expect(m.noetig).toBe(Math.floor(m.anwesend / 2) + 1);
    // Zusage: CHP und YENİ sind offen, die DEM nicht
    const angebote = zusageAngebote(w, { art: "verlaengerung", jahre: 3 }).map((a) => a.partei);
    expect(angebote).toContain("CHP");
    expect(angebote).not.toContain("DEM");
    // Ein Jahr trägt die Mitte eher mit als drei (Kritik an der Laufzeit 2025)
    expect(mandatSicht(w, { art: "verlaengerung", jahre: 1 }).ja).toBeGreaterThan(m.ja);
  });

  test("der 1. März 2003 lässt sich nachrechnen: 264 Ja bei 533 Anwesenden reichen nicht", () => {
    // 533 Abstimmende, 264 Ja, 250 Nein, 19 Enthaltungen; nötig 267 (Art. 96)
    expect(264 >= Math.max(MANDAT.mindestJa, Math.floor(533 / 2) + 1)).toBe(false);
    expect(Math.floor(533 / 2) + 1).toBe(267);
  });
});

describe("Vollmacht für Syrien und den Irak", () => {
  test("ältere Stände: routinemäßig in Schritten von drei Jahren verlängert, festgeschrieben im ersten Monat", () => {
    expect(vollmachtAbgeleitet("2028-06-01")).toBe("2028-10-30");
    expect(vollmachtAbgeleitet("2039-02-02")).toBe("2040-10-30");
    expect(vollmachtAbgeleitet("2043-08-03")).toBe("2043-10-30");
    expect(vollmachtAbgeleitet("2045-06-04")).toBe("2046-10-30");
  });

  test("im Oktober 2028 liegt die Verlängerung auf dem Tisch; drei Jahre gehen durch, gebucht wird, was die Karte zeigt", () => {
    const w = welt();
    expect(w.spiel!.vollmacht, "ein frischer Stand schreibt erst im ersten Monat fest").toBeUndefined();
    while (w.date < "2028-10-01") advance(w, 1);
    expect(verlaengerungFaellig(w)).toBe(true);
    advance(w, 6);
    const ev = w.spiel!.ereignisse.find((e) => e.vorlage === "vollmacht_verlaengerung");
    expect(ev, "Termin am 5. Oktober").toBeDefined();
    const opts = antworten(w, ev!);
    expect(opts.map((o) => o.id)).toEqual(expect.arrayContaining(["jahre_3", "jahre_1", "auslaufen"]));
    const erwartet = mandatSicht(w, { art: "verlaengerung", jahre: 3 });
    const drei = opts.find((o) => o.id === "jahre_3")!;
    expect(drei.bedingungen![0]).toContain(String(erwartet.noetig));
    drei.wirkung(w, ev!, new Rng(1));
    const v = vollmachtStand(w);
    const letzte = v.verlauf.at(-1)!;
    expect(Math.abs(letzte.ja - erwartet.ja)).toBeLessThanOrEqual(erwartet.band * 2);
    if (letzte.angenommen) expect(v.bis).toBe("2031-10-30");
    else expect(v.bis).toBe("2028-10-30");
    expect(verlaengerungFaellig(w)).toBe(false);
  });

  test("liegen lassen: Die Vollmacht läuft aus, danach braucht Syrien ein eigenes Mandat", () => {
    const w = welt();
    while (w.date < "2028-10-06") advance(w, 1);
    const v = VORLAGEN.find((x) => x.id === "vollmacht_verlaengerung")!;
    const ev = w.spiel!.ereignisse.find((e) => e.vorlage === "vollmacht_verlaengerung")!;
    v.standard(w, ev, new Rng(1));
    w.spiel!.ereignisse = [];
    while (w.date <= "2028-10-30") advance(w, 1);
    expect(vollmachtFuer(w, "SYR")).toBeUndefined();
    advance(w, 40);
    expect(w.spiel!.ereignisse.some((e) => e.vorlage === "vollmacht_verlaengerung")).toBe(false);
  });

  test.skipIf(!existsSync(STAND_2043))("Stand des Inhabers 2043: Syrien ohne neue Abstimmung, Zypern mit Abstimmung und sichtbarer Opposition", () => {
    const w = ladeStand(STAND_2043);
    expect(vollmachtFuer(w, "SYR")?.bis).toBe("2043-10-30");
    const rund = save(w);
    expect(save(load(rund))).toBe(rund);
    const syr = bisZumEinsatz(() => { const x = ladeStand(STAND_2043); x.spiel!.kapital = 200; return x; }, "SYR");
    const ids = handlungenFuer(syr.w, syr.k.id).map((h) => h.id);
    expect(ids).toContain("beschluss_vollmacht");
    expect(ids).not.toContain("beschluss");
    const cyp = bisZumEinsatz(() => { const x = ladeStand(STAND_2043); x.spiel!.kapital = 200; return x; }, "CYP", "revision");
    const b = handlungenFuer(cyp.w, cyp.k.id).find((h) => h.id === "beschluss")!;
    expect(b.moeglich, b.grund).toBe(true);
    const m = mandatSicht(cyp.w, einsatzAnlass(cyp.k));
    expect(m.fraktionen.find((f) => f.partei === "CHP")!.nein).toBeGreaterThan(0);
    expect(fuehreKriegHandlungAus(cyp.w, cyp.k.id, "beschluss").ok).toBe(true);
    const chronik = cyp.w.spiel!.chronik.at(-1)!;
    expect(chronik.presse?.sparte).toBe("politik");
    expect(chronik.ausgang).toMatch(/CHP/);
  });
});

describe("Mandat für ein neues Land", () => {
  test("ein gescheiterter Antrag kostet und sperrt einen neuen für 90 Tage; eine Zusage holt die fehlenden Stimmen", () => {
    const knapp = () => {
      const w = welt();
      w.parliament!.seats = { [w.player!.partei.kurz]: 180, CHP: 200, DEM: 80, AKP: 20, "YENİ": 120 };
      w.spiel!.lager = [];
      return w;
    };
    const { w, k } = bisZumEinsatz(knapp, "GRC");
    const vor = mandatSicht(w, einsatzAnlass(k));
    expect(vor.angenommen, `erwartet ${vor.ja} von ${vor.noetig}`).toBe(false);
    const zusagen = handlungenFuer(w, k.id).filter((h) => h.id.startsWith("zusage_"));
    expect(zusagen.length).toBeGreaterThan(0);
    // Ohne Zusage: Abstimmung scheitert
    const ohne = load(save(w));
    const kOhne = kriegMit(ohne, "GRC")!;
    const zustimmung = ohne.spiel!.umfrage.zustimmung;
    fuehreKriegHandlungAus(ohne, kOhne.id, "beschluss");
    advance(ohne, KRIEG.beschlussTage);
    expect(kOhne.phase).toBe("drohkulisse");
    expect(ohne.spiel!.mandatSperre?.GRC).toBeDefined();
    expect(ohne.spiel!.mandatSperre!.GRC! - ohne.day).toBeGreaterThan(MANDAT.scheitern.sperreTage - KRIEG.beschlussTage - 2);
    expect(ohne.spiel!.umfrage.zustimmung).toBeLessThan(zustimmung);
    const b = handlungenFuer(ohne, kOhne.id).find((h) => h.id === "beschluss")!;
    expect(b.moeglich).toBe(false);
    // Mit Zusagen an die offenen Fraktionen reicht es
    // Zusagen gibt es nur, solange das Mandat wackelt: nach der ersten, die reicht, keine weitere
    const zahl = w.spiel!.zusagen.length;
    let n = 0;
    for (let z = handlungenFuer(w, k.id).find((h) => h.id.startsWith("zusage_")); z; z = handlungenFuer(w, k.id).find((h) => h.id.startsWith("zusage_"))) {
      expect(fuehreKriegHandlungAus(w, k.id, z.id).ok).toBe(true);
      n++;
    }
    expect(n).toBeGreaterThan(0);
    expect(w.spiel!.zusagen.length).toBe(zahl + n);
    const nach = mandatSicht(w, einsatzAnlass(k));
    expect(nach.ja).toBeGreaterThan(vor.ja);
    expect(nach.ja).toBeGreaterThanOrEqual(nach.noetig + nach.band);
  });
});

describe("Kritik unterdrücken und Reservisten", () => {
  test("Kritik unterdrücken bucht den angezeigten Preis und halbiert die Kriegsmüdigkeit", () => {
    const { w, k } = bisZumEinsatz(() => { const x = welt(); x.parliament!.seats = { [x.player!.partei.kurz]: 400 }; return x; }, "SYR");
    fuehreKriegHandlungAus(w, k.id, "beschluss_vollmacht");
    expect(k.phase).toBe("krieg");
    advance(w, 35);
    const kr = handlungenFuer(w, k.id).find((h) => h.id === "kritik")!;
    expect(kr.moeglich, kr.grund).toBe(true);
    const mit = load(save(w));
    const presse = nationalAverage(NET, mit.net, "pressefreiheit");
    expect(fuehreKriegHandlungAus(mit, kriegMit(mit, "SYR")!.id, "kritik").ok).toBe(true);
    expect(nationalAverage(NET, mit.net, "pressefreiheit")).toBeLessThan(presse);
    expect(handlungenFuer(mit, kriegMit(mit, "SYR")!.id).find((h) => h.id === "kritik")!.moeglich, "nicht gleich wieder").toBe(false);
    // Müdigkeit: Zustimmung über vier Wochen fällt mit unterdrückter Kritik weniger (gleicher Verlauf sonst)
    const ohne = load(save(w));
    const z0 = mit.spiel!.umfrage.zustimmung;
    const z1 = ohne.spiel!.umfrage.zustimmung;
    advance(mit, 28);
    advance(ohne, 28);
    expect(z0 - mit.spiel!.umfrage.zustimmung).toBeLessThan(z1 - ohne.spiel!.umfrage.zustimmung + 1e-9);
  });

  test("eine Vollmobilmachung holt 380.000 Reservisten aus den Betrieben und drückt das Potenzialwachstum", () => {
    const { w, k } = bisZumEinsatz(() => { const x = welt(); x.parliament!.seats = { [x.player!.partei.kurz]: 400 }; return x; }, "SYR");
    const zwilling = load(save(w));
    const h = handlungenFuer(w, k.id).find((x) => x.id === "mobil_voll")!;
    expect(h.hinweis).toContain("380");
    fuehreKriegHandlungAus(w, k.id, "mobil_voll");
    advance(w, KRIEG.mobilTage[2]);
    expect(reservistenUnterWaffen(w)).toBe(RESERVISTEN.gesamt);
    advance(w, 35);
    advance(zwilling, KRIEG.mobilTage[2] + 35);
    expect(w.economy.reservistenAnteil).toBeCloseTo(reservistenLuecke(RESERVISTEN.gesamt).anteil, 6);
    expect(w.economy.reservistenAnteil!).toBeCloseTo(1.07, 2);
    expect(w.economy.potentialShift).toBeLessThan(zwilling.economy.potentialShift);
  });

  test("deterministisch: gleicher Samen, gleicher Verlauf bis über die Verlängerung", () => {
    const lauf = () => {
      const w = welt(9);
      while (w.date < "2028-11-15") advance(w, 1);
      return JSON.stringify([w.spiel!.vollmacht, w.spiel!.umfrage.zustimmung, w.rngState]);
    };
    expect(lauf()).toBe(lauf());
  });
});
