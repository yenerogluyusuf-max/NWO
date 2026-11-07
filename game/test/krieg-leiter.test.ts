// Welle 3, K1 (krieg.md Schritte 1 bis 3): die Eskalationsleiter (Druck → Drohkulisse → Ultimatum → Einsatz) mit Art. 92 und der stehenden
// Vollmacht für Syrien und Irak, das Ende ohne Klick-Schleife (erreichtes Kriegsziel, Rückzug des Gegners, Einfrieren mit Linie) und der
// Fernkonflikt ohne Landfront (Israel). Anlass ist der Krieg des Inhabers gegen Griechenland 2044 (Spielstand 2045-06-04): Front 96, viermal
// „Aussicht 47 %“, eingefroren, alle Eroberungen weg.

import { describe, expect, test } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { advance, createWorld, load } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { startAfterElection, schnellProfil } from "../src/sim/prolog";
import {
  KRIEG, PAKETE, eskalationsLeiter, fuehreKriegHandlungAus, handlungenFuer, kriegMit, kriseEroeffnen, kriseGrund, krisePreis, paketAussicht,
} from "../src/sim/krieg";
import { parlamentInFerien, vollmachtFuer } from "../src/sim/krieg-recht";
import { FERN, istFernkonflikt } from "../src/sim/fernkonflikt";
import { besatzung, einsatzSichten, kriegsKarte, waehleEinsatz } from "../src/sim/kriegsschauplatz";
import { aktionenFuer, weltZustand } from "../src/sim/laender";
import { Rng } from "../src/sim/rng";
import type { World } from "../src/sim/types";
import type { KriegVorgang } from "../src/sim/krieg-typen";

function welt(seed = 6): World {
  const w = createWorld(turkey2026, seed);
  startAfterElection(w, schnellProfil());
  w.spiel!.ereignisse = [];
  w.spiel!.kapital = 200;
  w.parliament!.seats = { [w.player!.partei.kurz]: 400 };
  return w;
}

/** Die Leiter bis kurz vor den Einsatz: Krise, Drohkulisse nach der Mindestdauer, Kriegsziel, Ultimatum (abgelehnt), Mindestdauer der Drohkulisse. */
function bisZumEinsatz(landId: string, rahmung: "schutz" | "revision" = "schutz"): { w: World; k: KriegVorgang } {
  // Ein Samen, bei dem der Gegner dem Ultimatum nicht nachgibt (der Wurf ist deterministisch, die Aussicht sichtbar)
  for (let seed = 1; seed < 40; seed++) {
    const w = welt(6);
    expect(kriseEroeffnen(w, landId).ok).toBe(true);
    const k = kriegMit(w, landId)!;
    advance(w, KRIEG.spannungMinTage);
    expect(fuehreKriegHandlungAus(w, k.id, "drohkulisse").ok).toBe(true);
    expect(fuehreKriegHandlungAus(w, k.id, `ziel_${rahmung}`).ok).toBe(true);
    fuehreKriegHandlungAus(w, k.id, "ultimatum", new Rng(seed));
    if (k.phase === "beendet") continue;
    advance(w, KRIEG.drohkulisseMinTage);
    w.spiel!.ereignisse = [];
    return { w, k };
  }
  throw new Error("kein abgelehntes Ultimatum");
}

describe("Schritt 1: Zugang und Eskalationsleiter", () => {
  test("gegen Syrien (Konflikt 20) führt ein sichtbarer Weg in vier Sprossen zum Krieg, auf die Vollmacht ohne Abstimmung", () => {
    const w = welt();
    expect(weltZustand(w)["SYR"]!.konflikt).toBeLessThan(30);
    // Erste Sprosse: Druck. Aus ruhiger Lage teurer, aber offen
    expect(kriseGrund(w, "SYR")).toBeUndefined();
    const preis = krisePreis(w, "SYR");
    expect(preis.aufschlag).toBe(true);
    const pk = w.spiel!.kapital;
    expect(kriseEroeffnen(w, "SYR").ok).toBe(true);
    expect(pk - w.spiel!.kapital).toBe(preis.pk);
    const k = kriegMit(w, "SYR")!;
    expect(k.phase).toBe("spannung");
    // Zweite Sprosse: Drohkulisse erst nach der Mindestdauer; das Ultimatum gehört nicht in die Spannung
    expect(handlungenFuer(w, k.id).find((h) => h.id === "drohkulisse")!.moeglich).toBe(false);
    expect(handlungenFuer(w, k.id).some((h) => h.id === "ultimatum")).toBe(false);
    advance(w, KRIEG.spannungMinTage);
    expect(k.phase, "die eigene Krise verfliegt nicht in der Mindestdauer").toBe("spannung");
    expect(fuehreKriegHandlungAus(w, k.id, "drohkulisse").ok).toBe(true);
    expect(k.phase).toBe("drohkulisse");
    expect(eskalationsLeiter(w, k).map((s) => s.stand)).toEqual(["vorbei", "vorbei", "jetzt", "kommt"]);
    // Vollmacht statt Abstimmung (bis 30.10.2028); ohne Kriegsziel und Ultimatum noch gesperrt
    expect(vollmachtFuer(w, "SYR")?.bis).toBe("2028-10-30");
    fuehreKriegHandlungAus(w, k.id, "ziel_schutz");
    const vor = handlungenFuer(w, k.id).find((h) => h.id === "beschluss_vollmacht")!;
    expect(vor.moeglich).toBe(false);
    expect(handlungenFuer(w, k.id).some((h) => h.id === "beschluss"), "keine Abstimmung, solange die Vollmacht gilt").toBe(false);
  });

  test("auf die Vollmacht beginnt der Einsatz sofort, ohne Abstimmung", () => {
    const { w, k } = bisZumEinsatz("SYR");
    const h = handlungenFuer(w, k.id).find((x) => x.id === "beschluss_vollmacht")!;
    expect(h.moeglich, h.grund).toBe(true);
    expect(fuehreKriegHandlungAus(w, k.id, "beschluss_vollmacht").ok).toBe(true);
    expect(k.phase).toBe("krieg");
  });

  test("Griechenland braucht den Beschluss der Großen Nationalversammlung; erst nach dem Ultimatum", () => {
    const { w, k } = bisZumEinsatz("GRC");
    expect(vollmachtFuer(w, "GRC")).toBeUndefined();
    const b = handlungenFuer(w, k.id).find((x) => x.id === "beschluss")!;
    expect(b.moeglich, b.grund).toBe(true);
    expect(fuehreKriegHandlungAus(w, k.id, "beschluss").ok).toBe(true);
    expect(k.phase).toBe("beschluss");
    advance(w, KRIEG.beschlussTage);
    expect(k.phase).toBe("krieg");
  });

  test("ohne Ultimatum kein eigener Einsatz", () => {
    const w = welt();
    kriseEroeffnen(w, "GRC");
    const k = kriegMit(w, "GRC")!;
    advance(w, KRIEG.spannungMinTage);
    fuehreKriegHandlungAus(w, k.id, "drohkulisse");
    fuehreKriegHandlungAus(w, k.id, "ziel_schutz");
    advance(w, KRIEG.drohkulisseMinTage);
    const b = handlungenFuer(w, k.id).find((x) => x.id === "beschluss")!;
    expect(b.moeglich).toBe(false);
    expect(b.grund).toMatch(/Ultimatum/);
  });

  test("nach dem 30.10.2028 braucht auch Syrien eine Abstimmung", () => {
    const w = welt();
    w.date = "2028-11-15";
    expect(vollmachtFuer(w, "SYR")).toBeUndefined();
    kriseEroeffnen(w, "SYR");
    const k = kriegMit(w, "SYR")!;
    k.seit -= KRIEG.spannungMinTage;
    fuehreKriegHandlungAus(w, k.id, "drohkulisse");
    fuehreKriegHandlungAus(w, k.id, "ziel_schutz");
    const ids = handlungenFuer(w, k.id).map((h) => h.id);
    expect(ids).toContain("beschluss");
    expect(ids).not.toContain("beschluss_vollmacht");
  });

  test("Art. 92 Abs. 2: allein entscheidet der Präsident nur in den Parlamentsferien (1. Juli bis 30. September)", () => {
    const w = welt();
    for (const [d, ferien] of [["2027-06-30", false], ["2027-07-01", true], ["2027-09-30", true], ["2027-10-01", false]] as const) {
      w.date = d;
      expect(parlamentInFerien(w), d).toBe(ferien);
    }
  });

  test("das Kriegsziel verfliegt nicht: Der Sockel trägt die Eskalation zur Drohkulisse (Lauf zypern-verlauf aus krieg.md 1.3)", () => {
    const w = welt();
    for (const l of Object.values(weltZustand(w))) l.konflikt = Math.min(l.konflikt, 45);
    weltZustand(w)["CYP"]!.konflikt = 74;
    kriseEroeffnen(w, "CYP");
    const k = kriegMit(w, "CYP")!;
    expect(fuehreKriegHandlungAus(w, k.id, "ziel_schutz").ok).toBe(true);
    const nachZiel = k.eskalation;
    for (let i = 0; i < KRIEG.spannungMinTage + 2 && k.phase === "spannung"; i++) {
      advance(w, 1);
      expect(k.eskalation).toBeGreaterThanOrEqual(nachZiel - 0.01);
    }
    expect(k.phase, "vorher klang die Spannung nach 5½ Monaten ab").toBe("drohkulisse");
    // und hält weiter, ohne dass der Gegner deshalb angreift (sein Konflikt steht unter der Schwelle)
    fuehreKriegHandlungAus(w, k.id, "mobil_voll");
    w.spiel!.ereignisse = [];
    for (let i = 0; i < 120; i++) advance(w, 1);
    expect(k.phase).toBe("drohkulisse");
    expect(k.eskalation).toBeGreaterThanOrEqual(nachZiel);
    // Beruhigen löst den Sockel
    fuehreKriegHandlungAus(w, k.id, "deeskalation");
    expect(k.sockel).toBeUndefined();
  });

  test("Druck gibt es auch gegen Irak und Armenien", () => {
    const w = welt();
    for (const id of ["IRQ", "ARM"]) expect(aktionenFuer(w, id).some((a) => a.aktion.id === "druck"), id).toBe(true);
  });
});

/** Krieg gegen Griechenland über die Leiter, Frontlage gesetzt, eine Woche weiter. */
function griechenlandkrieg(front: number): { w: World; k: KriegVorgang } {
  const { w, k } = bisZumEinsatz("GRC");
  fuehreKriegHandlungAus(w, k.id, "beschluss");
  advance(w, KRIEG.beschlussTage);
  expect(k.phase).toBe("krieg");
  w.spiel!.ereignisse = [];
  k.front = front;
  k.frontVorher = front;
  advance(w, 7);
  return { w, k };
}

describe("Schritt 2: Ende ohne Schleife", () => {
  test("ein erreichtes Kriegsziel macht den Gegner verhandlungsbereit: Waffenruhe und Frieden entlang der Linie", () => {
    const { w, k } = griechenlandkrieg(95);
    const genommen = Object.entries(k.regionen ?? {}).filter(([, l]) => l === "eigen").map(([id]) => id);
    expect(genommen.length, "die Grenzreihe ist genommen").toBe(4);
    expect(k.zielErreicht).toBeDefined();
    expect(k.angebotPaket).toBe("paket_linie");
    // Ging die Front in derselben Woche über die Siegschwelle, steht die Waffenruhe schon (Rückzug des Gegners)
    if (k.phase === "krieg") expect(fuehreKriegHandlungAus(w, k.id, "waffenruhe").ok).toBe(true);
    expect(k.phase).toBe("waffenruhe");
    const h = handlungenFuer(w, k.id).find((x) => x.id === "paket_linie")!;
    expect(h.moeglich).toBe(true);
    expect(fuehreKriegHandlungAus(w, k.id, "paket_linie").ok).toBe(true);
    expect(k.phase).toBe("frieden");
    const b = besatzung(w).filter((x) => x.land === "GRC");
    expect(b.map((x) => x.region).sort()).toEqual([...genommen].sort());
    expect(b.every((x) => x.grundlage === undefined)).toBe(true);
  });

  test("Rückzug des Gegners: das Lagepaket hat hohe Aussicht, die Rechnung nennt ihre Posten, und Abgelehntes lässt sich nicht vorlegen", () => {
    const { w, k } = griechenlandkrieg(KRIEG.siegFront + 2);
    expect(k.phase).toBe("waffenruhe");
    expect(k.rueckzugGegner).toBe(true);
    expect(k.angebotPaket).toBe("paket_linie");
    // Auch ohne das eigene Angebot läge die Linie über der Schwelle; die Posten ergeben die Zahl
    const ohne = { ...k, angebotPaket: undefined } as KriegVorgang;
    const a = paketAussicht(w, ohne, PAKETE.paket_linie!.paket(k.front), "paket_linie");
    expect(a.prozent).toBeGreaterThanOrEqual(KRIEG.paketNoetig);
    expect(a.gruende.map((g) => g.id)).toContain("rueckzug");
    expect(Math.round(Math.min(98, Math.max(5, a.gruende.reduce((s, g) => s + g.wert, 0))))).toBe(a.prozent);
    // Jedes vorlegbare Paket nimmt der Gegner an; jedes unter der Schwelle ist gesperrt (keine Klick-Schleife)
    for (const h of handlungenFuer(w, k.id).filter((x) => x.id.startsWith("paket_"))) {
      const p = paketAussicht(w, k, PAKETE[h.id]!.paket(k.front), h.id).prozent;
      if (p < KRIEG.paketNoetig) expect(h.moeglich, h.id).toBe(false);
    }
  });

  test("ein eingefrorener Konflikt behält die gehaltene Linie als De-facto-Kontrolle", () => {
    const { w, k } = griechenlandkrieg(95);
    if (k.phase === "krieg") fuehreKriegHandlungAus(w, k.id, "waffenruhe");
    delete k.angebotPaket;
    k.front = 70;
    for (let i = 0; i <= KRIEG.waffenruheFrist + 1 && k.phase === "waffenruhe"; i++) advance(w, 1);
    expect(k.ausgang).toBe("eingefroren");
    const linie = besatzung(w).filter((x) => x.land === "GRC");
    expect(linie.length).toBe(4);
    expect(linie.every((x) => x.grundlage === "linie")).toBe(true);
    expect(w.log.some((e) => e.text.includes("ohne Vertrag"))).toBe(true);
  });

  test("ein späterer Krieg mit demselben Land erobert die Linie nicht ein zweites Mal", () => {
    const { w, k } = griechenlandkrieg(95);
    if (k.phase === "krieg") fuehreKriegHandlungAus(w, k.id, "waffenruhe");
    expect(fuehreKriegHandlungAus(w, k.id, "paket_linie").ok).toBe(true);
    const ids = besatzung(w).map((b) => b.region);
    // Ein neuer Vorgang: alle besetzten Regionen gelten von Beginn an als türkisch
    advance(w, 40);
    const k2: KriegVorgang = { ...k, id: "kv-GRC-neu", phase: "krieg", front: 50, regionen: {} };
    w.spiel!.kriege!.push(k2);
    advance(w, 7);
    for (const id of ids) expect(k2.regionen?.[id], id).toBe("eigen");
  });

  test.skipIf(!existsSync("../spielstand/staatsraeson_2045-06-04.json"))("Spielstand des Inhabers 2045: die eingefrorene Linie mit Griechenland lädt als Besatzung", () => {
    const w = load(JSON.stringify(JSON.parse(readFileSync("../spielstand/staatsraeson_2045-06-04.json", "utf8")).welt));
    const linie = besatzung(w).filter((b) => b.land === "GRC");
    expect(linie.map((b) => b.region).sort()).toEqual(["grc_alexandroupoli", "grc_chios", "grc_kos", "grc_mytilini"]);
    expect(linie.every((b) => b.grundlage === "linie")).toBe(true);
    // und das Spiel läuft weiter
    advance(w, 35);
    expect(besatzung(w).filter((b) => b.land === "GRC").length).toBeGreaterThan(0);
  });
});

describe("Schritt 3: Fernkonflikt ohne Gebiet", () => {
  test("Israel hat keine Landfront: kein Schauplatz, keine Bodenoffensive, Cyber als Mittel", () => {
    expect(istFernkonflikt("ISR")).toBe(true);
    expect(istFernkonflikt("RUS")).toBe(true);
    for (const id of ["GRC", "SYR", "IRQ", "IRN", "ARM", "CYP", "GEO"]) expect(istFernkonflikt(id), id).toBe(false);
  });

  test("ein Fernkonflikt mit Israel endet mit Abschreckung statt Gebiet, mit wenigen Gefallenen und ohne die USA an der Seite der Türkei", () => {
    const w = welt();
    weltZustand(w)["ISR"]!.konflikt = 80;
    kriseEroeffnen(w, "ISR");
    const k = kriegMit(w, "ISR")!;
    k.seit -= KRIEG.spannungMinTage;
    fuehreKriegHandlungAus(w, k.id, "drohkulisse");
    // Der Gegner greift an (eigener Konflikt an der Schwelle): wie im Spielstand des Inhabers 2043
    weltZustand(w)["ISR"]!.konflikt = 97;
    k.eskalation = KRIEG.angriffAb + 1;
    advance(w, 1);
    expect(k.phase).toBe("krieg");
    expect(k.koalition!.partner.some((p) => p.id === "USA" && p.seite === "eigen"), "die USA kämpfen nicht gegen Israel").toBe(false);
    const mittel = einsatzSichten(w, k).map((e) => e.id);
    expect(mittel).toEqual(FERN.mittel);
    expect(mittel).not.toContain("boden");
    expect(waehleEinsatz(w, k, "luft").ok).toBe(true);
    w.spiel!.ereignisse = [];
    for (let i = 0; i < 12 && k.phase === "krieg"; i++) {
      advance(w, 7);
      w.spiel!.ereignisse = [];
    }
    expect(Object.keys(k.regionen ?? {})).toHaveLength(0);
    // Über Meer und Luft bricht keine Front zusammen: verlieren kann die Türkei hier über die Erschöpfung, nicht über einen Durchbruch
    expect(k.ausgang).not.toBe("niederlage");
    expect(k.front).toBeGreaterThan(KRIEG.zusammenbruchFront + 5);
    expect(kriegsKarte(w, [k], () => [0, 0])).toBeNull();
    // Gefallene in der Größenordnung eines Luftkriegs, nicht einer Bodenoffensive (Inhaber 2043: 318 in 12 Wochen)
    expect(k.gefallene ?? 0).toBeLessThan(120);
    // Kein Paket mit Gebiet
    if (k.phase === "waffenruhe") {
      const ids = handlungenFuer(w, k.id).map((h) => h.id);
      expect(ids).not.toContain("paket_sieg");
      expect(ids).not.toContain("paket_linie");
    }
  });

  test("ein erreichtes Fernziel macht den Gegner verhandlungsbereit, der Frieden bringt kein Gebiet", () => {
    const w = welt();
    weltZustand(w)["ISR"]!.konflikt = 97;
    kriseEroeffnen(w, "ISR");
    const k = kriegMit(w, "ISR")!;
    k.seit -= KRIEG.spannungMinTage;
    fuehreKriegHandlungAus(w, k.id, "drohkulisse");
    k.eskalation = KRIEG.angriffAb + 1;
    advance(w, 1);
    expect(k.phase).toBe("krieg");
    k.woche = FERN.minWochen;
    k.front = 70;
    k.uhrGegner = 60;
    advance(w, 7);
    expect(k.zielErreicht).toBeDefined();
    expect(k.angebotPaket).toBe("paket_fern_abschreckung");
    expect(fuehreKriegHandlungAus(w, k.id, "waffenruhe").ok).toBe(true);
    expect(fuehreKriegHandlungAus(w, k.id, "paket_fern_abschreckung").ok).toBe(true);
    expect(k.phase).toBe("frieden");
    expect(besatzung(w).filter((b) => b.land === "ISR")).toHaveLength(0);
  });
});

describe("Determinismus", () => {
  test("gleicher Samen, gleicher Weg durch die Leiter und den Krieg", () => {
    const lauf = () => {
      const { w, k } = griechenlandkrieg(80);
      for (let i = 0; i < 6 && k.phase === "krieg"; i++) advance(w, 7);
      return JSON.stringify({ f: k.front, u: k.uhrGegner, g: k.gefallene, r: k.regionen, p: k.phase });
    };
    expect(lauf()).toBe(lauf());
  });
});
