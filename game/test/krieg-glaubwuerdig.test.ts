// Krieg glaubwürdig (PRUEFUNG_GESAMT_2026-11-04): gemeinsame Kräfteskala, Nachschub ab Tag 1, Waffenruhe mit Gegenangebot und
// Frist, dünne Verteidigung, Ultimatum, eigene Krise, Zwischenfälle, keine neutralen Kriegsparteien, Risikoaufschlag bremst.

import { describe, expect, test } from "vitest";
import { createWorld, advance } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { startAfterElection, schnellProfil } from "../src/sim/prolog";
import {
  KRIEG, PAKETE, RAHMUNG, eigenStaerke, fuehreKriegHandlungAus, gegnerStaerke, handlungenFuer, kriegMit, kriegMonat,
  kriseEroeffnen, kriseGrund, krisePreis, paketAnnahme, rahmungWerte,
} from "../src/sim/krieg";
import { KRAFT, KRAFT_TUERKEI } from "../src/data/kraefte";
import { KEINE_KRIEGSPARTEI } from "../src/sim/pakte";
import { militaerVersorgung } from "../src/sim/versorgung";
import { weltZustand } from "../src/sim/laender";
import { monthlyUpdate } from "../src/sim/economy";
import { Rng } from "../src/sim/rng";
import type { World } from "../src/sim/types";
import type { KriegVorgang } from "../src/sim/krieg-typen";

function welt(seed = 6): World {
  const w = createWorld(turkey2026, seed);
  startAfterElection(w, schnellProfil());
  w.spiel!.ereignisse = [];
  w.spiel!.kapital = 120;
  w.parliament!.seats = { [w.player!.partei.kurz]: 400 };
  return w;
}
function drohkulisse(w: World, land: string): KriegVorgang {
  weltZustand(w)[land]!.konflikt = 85;
  kriegMonat(w, new Rng(1));
  const k = kriegMit(w, land)!;
  k.eskalation = 80;
  k.seit -= KRIEG.spannungMinTage; // Die Spannung läuft schon drei Wochen (Mindestdauer KRIEG.spannungMinTage, Befund G-2 vom 5. November)
  advance(w, 1);
  k.seit -= KRIEG.drohkulisseMinTage; // Die Drohkulisse steht schon zwei Wochen (Mindestdauer KRIEG.drohkulisseMinTage vor dem Einsatzbeschluss, Befund G-2)
  // Welle 3, K1: Vor einem eigenen Einsatz steht das Ultimatum (dritte Sprosse der Leiter); hier gilt es als gestellt und abgelehnt
  k.ultimatum = true;
  return k;
}
function angriffDurch(w: World, land: string): KriegVorgang {
  const k = drohkulisse(w, land);
  fuehreKriegHandlungAus(w, k.id, "mobil_voll");
  weltZustand(w)[land]!.konflikt = 97;
  k.eskalation = KRIEG.angriffAb;
  advance(w, 1);
  return k;
}

describe("Gemeinsame Kräfteskala", () => {
  test("Rangfolge aus SIPRI-Ausgaben und Personal: Großmächte vor der Türkei, die Türkei vor Iran und Griechenland", () => {
    expect(KRAFT.USA!).toBeGreaterThan(KRAFT.TUR!);
    expect(KRAFT.RUS!).toBeGreaterThan(KRAFT.TUR!);
    expect(KRAFT.TUR!).toBeGreaterThan(KRAFT.IRN!);
    expect(KRAFT.TUR!).toBeGreaterThan(KRAFT.GRC!);
    for (const v of Object.values(KRAFT)) { expect(v).toBeGreaterThan(0); expect(v).toBeLessThan(100); }
  });
  test("im Normalstand mit Teilmobilmachung ist die Türkei so stark wie ihr Grundwert", () => {
    const w = welt();
    const k = drohkulisse(w, "GRC");
    fuehreKriegHandlungAus(w, k.id, "mobil_teil");
    // Die Teilmobilmachung steht erst nach KRIEG.mobilTage[1] Tagen voll (Befund G-2); hier ist sie fertig
    k.mobilSeit! -= KRIEG.mobilTage[1];
    expect(eigenStaerke(w, k) / KRAFT_TUERKEI).toBeGreaterThan(0.85);
    expect(eigenStaerke(w, k) / KRAFT_TUERKEI).toBeLessThan(1.2);
  });
  test("greift Iran an, verliert die Türkei mit ihren Bündnispartnern nicht binnen 20 Wochen", () => {
    const w = welt();
    const k = angriffDurch(w, "IRN");
    expect(k.phase).toBe("krieg");
    for (let i = 0; i < 20 && k.phase === "krieg"; i++) advance(w, 7);
    expect(k.ausgang).not.toBe("niederlage");
    expect(k.front).toBeGreaterThan(40);
  });
  test("neutrale Staaten und die EU sind nie Kriegspartei", () => {
    const w = welt();
    const k = angriffDurch(w, "GRC");
    for (const p of k.koalition?.partner ?? []) expect(KEINE_KRIEGSPARTEI.has(p.id)).toBe(false);
  });
});

describe("Nachschub ab dem ersten Kriegstag", () => {
  test("eine neue Front bekommt bis zur ersten Monatsbuchung die tatsächliche Öldeckung, nicht null", () => {
    const w = welt();
    const k = angriffDurch(w, "SYR");
    expect(k.phase).toBe("krieg");
    expect(militaerVersorgung(w, "SYR").treibstoff).toBeGreaterThan(0.8);
  });
});

describe("Waffenruhe mit Ende", () => {
  test("Gegenangebot nach 30 Tagen, das er sicher annimmt; nach der Frist ist die Waffenruhe vorbei", () => {
    const w = welt();
    const k = angriffDurch(w, "SYR");
    k.uhrGegner = 30;
    expect(fuehreKriegHandlungAus(w, k.id, "waffenruhe").ok).toBe(true);
    expect(k.phase).toBe("waffenruhe");
    advance(w, KRIEG.gegenangebotTage + 1);
    expect(k.angebotPaket).toBeTruthy();
    expect(paketAnnahme(w, k, PAKETE[k.angebotPaket!]!.paket(k.front), k.angebotPaket)).toBeGreaterThanOrEqual(90);
    expect(handlungenFuer(w, k.id).some((h) => h.id === k.angebotPaket)).toBe(true);
    advance(w, KRIEG.waffenruheFrist);
    expect(k.phase).not.toBe("waffenruhe");
  });
  test("ohne Einigung friert ein unentschiedener Konflikt ein", () => {
    const w = welt();
    const k = angriffDurch(w, "SYR");
    k.uhrGegner = 30;
    fuehreKriegHandlungAus(w, k.id, "waffenruhe");
    k.front = 55;
    advance(w, KRIEG.waffenruheFrist + 2);
    expect(k.ausgang).toBe("eingefroren");
  });
});

describe("Rahmung und eigener Einstieg", () => {
  test("„Verteidigung“ vor dem unmittelbaren Angriff zählt nur wie „Schutz“", () => {
    const w = welt();
    const k = drohkulisse(w, "GRC");
    expect(k.eskalation).toBeLessThan(KRIEG.verteidigungGlaubhaftAb);
    fuehreKriegHandlungAus(w, k.id, "ziel_verteidigung");
    expect(k.rahmungDuenn).toBe(true);
    expect(rahmungWerte(k).stimmen).toBe(RAHMUNG.schutz.stimmen);
  });
  test("wer angegriffen wird, verteidigt sich glaubhaft", () => {
    const w = welt();
    const k = angriffDurch(w, "IRN");
    expect(k.rahmungDuenn).toBeFalsy();
    expect(rahmungWerte(k).stimmen).toBe(RAHMUNG.verteidigung.stimmen);
  });
  test("Ultimatum: entweder gibt der Gegner nach oder die Krise eskaliert; nur einmal je Krise", () => {
    let nachgegeben = 0, eskaliert = 0;
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
      const w = welt(seed);
      const k = drohkulisse(w, "SYR");
      delete k.ultimatum; // hier wird das Ultimatum selbst geprüft
      const vorher = k.eskalation;
      expect(handlungenFuer(w, k.id).find((h) => h.id === "ultimatum")?.moeglich).toBe(true);
      expect(fuehreKriegHandlungAus(w, k.id, "ultimatum", new Rng(seed)).ok).toBe(true);
      if (k.ausgang === "nachgegeben") nachgegeben++;
      else { expect(k.eskalation).toBeGreaterThan(vorher); eskaliert++; expect(handlungenFuer(w, k.id).find((h) => h.id === "ultimatum")?.moeglich).toBe(false); }
    }
    expect(nachgegeben + eskaliert).toBe(8);
  });
  test("eine eigene Krise geht auch aus ruhiger Lage, kostet dort aber mehr, und legt einen Vorgang an", () => {
    // Welle 3, K1 (krieg.md 1.2): Früher war die Krise unter Konflikt 55 gesperrt; gegen Syrien (20) führte der Weg über 13 Gesten in zwei
    // Jahren. Jetzt geht sie immer, aber eine Krise aus ruhiger Lage braucht einen Vorwand und kostet sichtbar mehr.
    const w = welt();
    weltZustand(w)["GRC"]!.konflikt = 40;
    const ruhig = krisePreis(w, "GRC");
    weltZustand(w)["GRC"]!.konflikt = 60;
    const gespannt = krisePreis(w, "GRC");
    expect(ruhig.pk).toBeGreaterThan(gespannt.pk);
    expect(ruhig.ansehen).toBeLessThan(gespannt.ansehen);
    expect(ruhig.aufschlag).toBe(true);
    weltZustand(w)["GRC"]!.konflikt = 40;
    const pk = w.spiel!.kapital;
    expect(kriseGrund(w, "GRC")).toBeUndefined();
    expect(kriseEroeffnen(w, "GRC").ok).toBe(true);
    expect(kriegMit(w, "GRC")?.phase).toBe("spannung");
    expect(pk - w.spiel!.kapital, "der Knopf bucht den angezeigten Preis").toBe(ruhig.pk);
    expect(kriseEroeffnen(w, "GRC").ok, "nur ein Vorgang je Land").toBe(false);
  });
  test("Zwischenfälle verschärfen angespannte Lagen auch ohne den Spieler", () => {
    let mehr = 0;
    for (const seed of [1, 2, 3]) {
      const w = welt(seed);
      weltZustand(w)["CYP"]!.konflikt = 72;
      // Echte Monate durchlaufen: Die Zwischenfälle würfeln aus einem eigenen, vom Spieltag abgeleiteten Strom
      for (let m = 0; m < 36 && !kriegMit(w, "CYP") && (weltZustand(w)["CYP"]!.konflikt ?? 0) <= 72; m++) { weltZustand(w)["CYP"]!.konflikt = Math.max(weltZustand(w)["CYP"]!.konflikt, 72); advance(w, 30); }
      if ((weltZustand(w)["CYP"]!.konflikt ?? 0) > 72 || kriegMit(w, "CYP")) mehr++;
    }
    expect(mehr).toBeGreaterThan(0);
  });
});

describe("Märkte bremsen die Wirtschaft", () => {
  test("ein plötzlicher Anstieg des Risikoaufschlags senkt die Auslastung gegenüber dem ruhigen Verlauf", () => {
    const ruhig = welt(), schock = welt();
    for (const w of [ruhig, schock]) { w.economy.riskAnker = w.economy.riskPremium; }
    schock.economy.riskPremium += 300;
    const a = structuredClone(ruhig.economy), b = structuredClone(schock.economy);
    for (let m = 0; m < 6; m++) { monthlyUpdate(a, [], new Rng(m)); monthlyUpdate(b, [], new Rng(m)); b.riskPremium = a.riskPremium + 300; }
    expect(b.outputGap).toBeLessThan(a.outputGap);
  });
});
