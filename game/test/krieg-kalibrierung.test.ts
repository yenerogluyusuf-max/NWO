// Kalibrierung des Landkriegs an echten Operationen (Welle 3, K2; krieg.md Schritt 5, Befunde B1 und B5).
//
// Je Vorbild ein Spielkrieg mit den Mitteln, die der Spieler hat (Krise, Drohkulisse, Kriegsziel, Ultimatum, Einsatz, Einsatzart, Tempo,
// Mobilmachung), und ein Zwilling ohne Krieg mit demselben Samen. Gemessen wird, was der Krieg kostet und bringt: Fläche je Woche, Gefallene
// je 1.000 km², Kurs der Lira und Zustimmung. Jeder Wert muss im belegten Band des Vorbilds liegen, mit einem Spielraum vom Faktor 2 nach
// beiden Seiten (Größenordnung; die Spielregionen sind Verwaltungseinheiten, nicht die Operationsgebiete von damals).
//
// Belege: dokumentation/analyse_2026-11-05/bereiche/recherche_operationen.md, Abschnitte A1 bis A7 und B sowie „Zahlen fürs Spiel“.
//   Schutzschild Euphrat 24.08.2016–29.03.2017: 2.000–2.055 km², 7 Monate (217 Tage), 71 Gefallene; Verbündete der FSA führten
//   Olivenzweig 20.01.–24.03.2018: rund 2.000 km² um Afrin (Bergland), 63 Tage, 54 bis 55 Gefallene
//   Friedensquelle 09.10.2019: 2.419–4.820 km², 9 Tage Kampf bis zur Pause bzw. 47 Tage bis zum Ende der Nachoperationen, 11 bis 12 Gefallene;
//     Lira +4,3 % bis zum Sanktionstag, danach noch +1,3 bis +1,7 %; Zustimmung zum Präsidenten 0 (KONDA) bis +4 Punkte (MetroPOLL)
//   Zypern 20.07.–16.08.1974: 36–37 % von 9.251 km² (3.330–3.423 km²) in 27 Tagen, 568 bis 1.500 Gefallene
//   Klauenschwert 20.–28.11.2022: Luft- und Drohnenschläge 7 bis 9 Tage, kein Gebiet, 1 Gefallener (SOHR), Lira 0,0 %; Kriegsbeginn ohne
//     Sanktionen in allen Operationen −1,3 % bis +1,1 %
//
// Die Spielkriege laufen gegen die Spielgegner (Syrien, Irak, Zypern), nicht gegen IS, YPG oder die Nationalgarde von 1974. Olivenzweig
// steht deshalb im Bergland des Nordirak (Zaxo und Dohuk, 2.418 km², ähnlich groß wie Afrin): Im Spiel gibt es keine syrische Bergregion an
// der Grenze.

import { describe, expect, test } from "vitest";
import { advance, createWorld } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { startAfterElection, schnellProfil } from "../src/sim/prolog";
import { KRIEG, fuehreKriegHandlungAus, kriegMit, kriegszielErreicht, kriseEroeffnen, waehleZielraum } from "../src/sim/krieg";
import { genommeneFlaeche, vorgerueckteFlaeche, waehleEinsatz, waehleTempo } from "../src/sim/kriegsschauplatz";
import { MARKT_DROHUNG } from "../src/sim/kriegspreis";
import { Rng } from "../src/sim/rng";
import type { World } from "../src/sim/types";
import type { KriegVorgang } from "../src/sim/krieg-typen";
import type { EinsatzArt, KriegsTempo } from "../src/data/schauplaetze";

const SPIELRAUM = 2;
const band = (lo: number, hi: number): [number, number] => [lo / SPIELRAUM, hi * SPIELRAUM];
const imBand = (wert: number, [lo, hi]: [number, number], was: string) => {
  expect(wert, `${was}: ${wert} außerhalb ${lo}…${hi}`).toBeGreaterThanOrEqual(lo);
  expect(wert, `${was}: ${wert} außerhalb ${lo}…${hi}`).toBeLessThanOrEqual(hi);
};

function welt(seed: number): World {
  const w = createWorld(turkey2026, seed);
  startAfterElection(w, schnellProfil());
  w.spiel!.ereignisse = [];
  w.spiel!.kapital = 300;
  w.parliament!.seats = { [w.player!.partei.kurz]: 400 };
  return w;
}

interface Aufbau { land: string; ziel: string; einsatz: EinsatzArt; tempo: KriegsTempo; mobil?: "mobil_teil" | "mobil_voll" }

/** Der Weg in den Krieg wie im Spiel; der Zwilling ohne Krieg läuft dieselben Tage mit. */
function inDenKrieg(a: Aufbau, seed = 6): { w: World; z: World; k: KriegVorgang; vor: { kurs: number; zust: number; tag: number } } {
  for (let wurf = 1; wurf < 40; wurf++) {
    const w = welt(seed);
    const z = welt(seed);
    const tag0 = w.day;
    expect(kriseEroeffnen(w, a.land).ok).toBe(true);
    const k = kriegMit(w, a.land)!;
    advance(w, KRIEG.spannungMinTage);
    fuehreKriegHandlungAus(w, k.id, "drohkulisse");
    fuehreKriegHandlungAus(w, k.id, "ziel_schutz");
    waehleZielraum(w, k.id, a.ziel);
    if (a.mobil) fuehreKriegHandlungAus(w, k.id, a.mobil);
    fuehreKriegHandlungAus(w, k.id, "ultimatum", new Rng(wurf));
    if (k.phase === "beendet") continue;
    advance(w, Math.max(KRIEG.drohkulisseMinTage, a.mobil ? KRIEG.mobilTage[a.mobil === "mobil_voll" ? 2 : 1] : 0));
    w.spiel!.ereignisse = [];
    waehleEinsatz(w, k, a.einsatz);
    waehleTempo(w, k, a.tempo);
    // Vor dem Einsatz messen: Der Sammeleffekt beim Kriegsbeginn gehört zum Krieg
    const vor = { kurs: w.economy.usdTry, zust: w.spiel!.umfrage.zustimmung, tag: w.day };
    fuehreKriegHandlungAus(w, k.id, ["SYR", "IRQ"].includes(a.land) ? "beschluss_vollmacht" : "beschluss");
    if (k.phase === "beschluss") advance(w, KRIEG.beschlussTage);
    expect(k.phase).toBe("krieg");
    advance(z, vor.tag - tag0);
    const zVor = { kurs: z.economy.usdTry, zust: z.spiel!.umfrage.zustimmung };
    advance(z, w.day - vor.tag);
    return { w, z, k, vor: { ...vor, kurs: vor.kurs / zVor.kurs, zust: vor.zust - zVor.zust } };
  }
  throw new Error("kein abgelehntes Ultimatum");
}

interface Messung {
  wochen: number; km2: number; genommen: number; gefallene: number; kursDiff: number[]; zustDiff: number[]; front: number;
  /** Kurs am Tag der Drohung und am Tag der Erholung, jeweils gegen den Zwilling am selben Tag (Prozent) */
  drohungTag?: number; erholungTag?: number;
}

/** Krieg und Zwilling Woche für Woche bis zum Kriegsziel oder bis `bis` Wochen; das Angebot einer Waffenruhe schlägt der Bot aus. */
function fuehre(a: Aufbau, bis: number, opts: { tage?: number } = {}): Messung & { k: KriegVorgang } {
  const { w, z, k, vor } = inDenKrieg(a);
  const start = { tag: w.day };
  const kursDiff: number[] = [];
  const zustDiff: number[] = [];
  const tage = opts.tage ?? bis * 7;
  let drohungTag: number | undefined;
  let erholungTag: number | undefined;
  for (let d = 1; d <= tage; d++) {
    const vorher = { w: w.economy.usdTry, z: z.economy.usdTry, drohung: !!k.marktDrohung, erholt: !!k.marktDrohung?.erholt };
    advance(w, 1);
    advance(z, 1);
    const tagesDiff = ((w.economy.usdTry / vorher.w) / (z.economy.usdTry / vorher.z) - 1) * 100;
    if (!vorher.drohung && k.marktDrohung) drohungTag = tagesDiff;
    if (!vorher.erholt && k.marktDrohung?.erholt) erholungTag = tagesDiff;
    w.spiel!.ereignisse = w.spiel!.ereignisse.filter((e) => e.vorlage !== "krieg_waffenruhe");
    if (d % 7 === 0) {
      kursDiff.push((w.economy.usdTry / z.economy.usdTry / vor.kurs - 1) * 100);
      zustDiff.push(w.spiel!.umfrage.zustimmung - z.spiel!.umfrage.zustimmung - vor.zust);
    }
    if (kriegszielErreicht(k) || k.phase !== "krieg") break;
  }
  const wochen = (w.day - start.tag) / 7;
  return {
    k, wochen, km2: Math.max(genommeneFlaeche(k), vorgerueckteFlaeche(k)), genommen: genommeneFlaeche(k), gefallene: k.gefallene ?? 0, kursDiff, zustDiff,
    front: k.front, ...(drohungTag !== undefined ? { drohungTag } : {}), ...(erholungTag !== undefined ? { erholungTag } : {}),
  };
}

const je1000 = (m: Messung) => (m.gefallene / Math.max(1, m.km2)) * 1000;

describe("Kalibrierung an echten Operationen", () => {
  test("Schutzschild Euphrat 2016/17: Verbündete vor Ort nehmen langsam Fläche, je Woche wenige Gefallene, über die Dauer kein billiger Krieg", () => {
    const m = fuehre({ land: "SYR", ziel: "syr_grenzstreifen", einsatz: "stellvertreter", tempo: "normal" }, 31);
    imBand(m.km2 / m.wochen, band(2000 / 31, 2055 / 31), "km² je Woche");
    imBand(je1000(m), band(71 / 2055 * 1000, 71 / 2000 * 1000), "Gefallene je 1.000 km²");
  }, 120_000);

  test("Olivenzweig 2018: Bodenoffensive im Bergland, rund 2.000 km² in Wochen, Dutzende Gefallene", () => {
    const m = fuehre({ land: "IRQ", ziel: "irq_berge", einsatz: "boden", tempo: "normal", mobil: "mobil_teil" }, 40);
    expect(m.genommen, "das Kriegsziel (Zaxo und Dohuk) fällt").toBe(2418);
    imBand(m.km2 / m.wochen, band(2000 / 9, 2000 / 9), "km² je Woche");
    imBand(je1000(m), band(54 / 2000 * 1000, 55 / 2000 * 1000), "Gefallene je 1.000 km²");
    imBand(m.wochen, band(9, 9), "Wochen bis zum Kriegsziel");
  }, 120_000);

  test("Friedensquelle 2019: schnell in der Ebene, wenige Gefallene je Fläche; die Sanktionsdrohung kostet die Lira 4,3 % und erholt sich", () => {
    const m = fuehre({ land: "SYR", ziel: "syr_grenzstreifen", einsatz: "boden", tempo: "normal", mobil: "mobil_teil" }, 40);
    expect(m.genommen, "der ganze Grenzstreifen fällt").toBe(10485);
    imBand(m.km2 / m.wochen, band(2419 / (47 / 7), 4820 / (9 / 7)), "km² je Woche");
    imBand(je1000(m), band(11 / 4820 * 1000, 12 / 2419 * 1000), "Gefallene je 1.000 km²");
    if (process.env.K2_ZEIG) console.log("FQ", JSON.stringify({ w: m.wochen, kia: m.gefallene, d: m.drohungTag, e: m.erholungTag, kurs: m.kursDiff.map((x) => Math.round(x * 100) / 100), zust: m.zustDiff.map((x) => Math.round(x * 10) / 10) }));
    // Lira gegen den Zwilling: der Sprung am Tag der Drohung (erste Kriegswoche), die Erholung zwei Wochen später bis auf den bleibenden Teil.
    // Gemessen am jeweiligen Tag, denn über Wochen läuft das Rauschen des Kurses zwischen den Zwillingen auseinander (±2 %)
    expect(m.k.marktDrohung?.erholt).toBe(true);
    imBand(m.drohungTag!, band(4.3, 4.3), "Lira am Tag der Drohung (%)");
    imBand(((1 + m.drohungTag! / 100) * (1 + m.erholungTag! / 100) - 1) * 100, band(1.3, 1.7), "Lira nach der Erholung (%)");
    imBand(m.kursDiff[3]!, [0, 4.3 * SPIELRAUM], "Lira nach vier Wochen gegen den Zwilling (%)");
    // Zustimmung gegen den Zwilling: kleiner Sammeleffekt (0 bis +4), der abklingt; ±1 Punkt Spielraum für das Rauschen des Zwillings
    imBand(m.zustDiff[1]!, [0 - 1, 4 + 1], "Zustimmung nach zwei Wochen");
    imBand(m.zustDiff[3]!, [0 - 1, 4 + 1], "Zustimmung nach vier Wochen");
    expect(m.zustDiff[11]!, "nach drei Monaten ist der Sammeleffekt verflogen").toBeLessThan(m.zustDiff[1]!);
  }, 120_000);

  test("Zypern 1974: Landung über das Meer, ein Drittel der Insel in Wochen, Hunderte Gefallene", () => {
    const m = fuehre({ land: "CYP", ziel: "cyp_maximal", einsatz: "boden", tempo: "hart", mobil: "mobil_teil" }, 40);
    expect(m.genommen).toBe(5493);
    imBand(m.km2 / m.wochen, band(3330 / (27 / 7), 3423 / (27 / 7)), "km² je Woche");
    imBand(je1000(m), band(568 / 3423 * 1000, 1500 / 3330 * 1000), "Gefallene je 1.000 km²");
  }, 120_000);

  test("Klauenschwert 2022: Luft- und Drohnenschläge über neun Tage nehmen kein Gebiet, kosten kaum Leben und bewegen die Lira kaum", () => {
    const m = fuehre({ land: "SYR", ziel: "syr_grenzstreifen", einsatz: "luft", tempo: "normal" }, 2, { tage: 9 });
    expect(m.km2).toBe(0);
    expect(m.gefallene).toBeLessThanOrEqual(1 * SPIELRAUM);
    imBand(m.kursDiff[0]!, [-1.3, 1.1], "Lira nach einer Woche (%)");
    expect(m.k.marktDrohung, "keine Sanktionsdrohung bei Luftschlägen").toBeUndefined();
  }, 120_000);

  test("Befund B1: Ganz Nordsyrien fällt nicht mehr in sechs Wochen", () => {
    // Vorher (Lauf W1): alle neun Regionen in sechs Wochen mit 125 Gefallenen. Jetzt nimmt eine Bodenoffensive in einem Jahr nicht alles
    const m = fuehre({ land: "SYR", ziel: "syr_maximal", einsatz: "boden", tempo: "normal", mobil: "mobil_teil" }, 52);
    expect(m.genommen).toBeLessThan(55000 * 0.6);
    expect(m.gefallene).toBeGreaterThan(125);
  }, 120_000);

  test("Bleibender Kursabschlag nach der Erholung entspricht dem Beleg", () => {
    expect(MARKT_DROHUNG.kurs * MARKT_DROHUNG.bleibt * 100).toBeGreaterThanOrEqual(1.3);
    expect(MARKT_DROHUNG.kurs * MARKT_DROHUNG.bleibt * 100).toBeLessThanOrEqual(1.7);
  });
});
