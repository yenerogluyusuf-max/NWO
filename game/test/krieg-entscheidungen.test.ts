// Welle 3, K3 (krieg.md Schritt 6, Ziel „8 bis 12 echte Entscheidungen je Krieg“): Ein Spieler-Bot führt Kriege über die Leiter, die
// Operationsform und die Wendepunkte bis zum Frieden und zählt, was er entscheidet. Echte Entscheidungen haben mindestens zwei Wege mit
// verschiedenem Preis: Krise eröffnen, Kriegsziel samt Zielraum, Mobilmachung, Operationsform samt Verbündeten, jeder Wendepunkt, das Angebot
// der Waffenruhe und das Friedenspaket. Pflichtschritte der Leiter (Drohkulisse, Ultimatum, Einsatz) zählen getrennt: Sie sind Klicks, keine
// Abwägung (krieg.md 1.1: „9 Klicks, aber nur zwei hatten eine echte Abwägung“).

import { describe, expect, test } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { load } from "../src/sim/world";
import { WENDEPUNKT } from "../src/sim/ereignisse-wendepunkte";
import { fuehreKrieg, frisch } from "./k3-hilfe";
import type { World } from "../src/sim/types";

const SAVE43 = "../spielstand/staatsraeson_2043-08-03.json";

describe("Ein Krieg von drei bis sechs Monaten hat acht bis zwölf echte Entscheidungen", () => {
  const faelle: [string, () => World, Parameters<typeof fuehreKrieg>[1]][] = [
    ["Syrien frisch, begrenzt mit der SNA", () => frisch(), { land: "SYR", zielraum: "syr_grenzstreifen", form: "begrenzt", mit: "sna" }],
    ["Syrien frisch, Luftschlag, dann Boden", () => frisch(), { land: "SYR", zielraum: "syr_grenzstreifen", form: "luftschlag" }],
    // Nachauftrag 08.11.: Mit K2s Fläche statt Regionenzahl ist der tiefe Zielraum (syr_tief, 37.357 km², Schwierigkeit 1,2) ein Krieg von über
    // einem Jahr (384 km² je Woche, nach 57 Wochen 47 %); er liegt außerhalb der drei bis sechs Monate, um die es hier geht. Die Großoffensive
    // läuft deshalb mit der SNA im Grenzstreifen (10.485 km²): 15 Kriegswochen.
    ["Syrien frisch, Großoffensive mit der SNA im Grenzstreifen", () => frisch(), { land: "SYR", zielraum: "syr_grenzstreifen", form: "grossoffensive", mit: "sna", mobil: true }],
    ["Griechenland frisch, Landung auf den Inseln", () => frisch(), { land: "GRC", zielraum: "grc_inseln", form: "landung", mobil: true }],
  ];
  if (existsSync(SAVE43)) faelle.push(["Griechenland im Stand des Inhabers 2043, Landung", () => load(JSON.stringify(JSON.parse(readFileSync(SAVE43, "utf8")).welt)), { land: "GRC", zielraum: "grc_inseln", form: "landung", mobil: true }]);
  test.each(faelle)("%s", (_, welt, o) => {
    const r = fuehreKrieg(welt(), o);
    console.log(`${_}: ${r.echte.length} echte (${r.echte.join(", ")}), Pflicht ${r.pflicht.length}, ${r.monate.toFixed(1)} Monate, ${r.wochen} Kriegswochen, ${r.ausgang}, Gefallene ${r.gefallene}, genommen ${r.regionen.join(" ")}\n  ${r.log.join("\n  ")}`);
    expect(r.ausgang.startsWith("frieden") || r.ausgang.startsWith("beendet")).toBe(true);
    // Das Ziel aus krieg.md: acht bis zwölf echte Entscheidungen, jede mit Preis; die Pflichtschritte der Leiter kommen dazu
    expect(r.echte.length, r.echte.join(", ")).toBeGreaterThanOrEqual(8);
    expect(r.echte.length, r.echte.join(", ")).toBeLessThanOrEqual(12);
    expect(r.pflicht).toEqual(["drohkulisse", "ultimatum", "einsatz"]);
    expect(r.wendepunkte.length).toBeLessThanOrEqual(WENDEPUNKT.maxJeKrieg);
    expect(new Set(r.wendepunkte.map((x) => x.split(":")[0])).size).toBe(r.wendepunkte.length);
  }, 120_000);
});
