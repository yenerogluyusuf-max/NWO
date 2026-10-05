// Das Parlament aus Sicht der Oberfläche: Fraktionen in der Reihenfolge des Halbrunds (eigene Partei, Lager, Duldung, Opposition).

import type { World } from "../../sim/types";
import { duldung, PARTEI_NAME } from "../../sim/fraktionen";

/** Neutrale Farben für die Parteien; keine Parteilogos (Länderpaket, Abschnitt 4). */
export const PARTY_COLORS: Record<string, string> = {
  AKP: "#e0892b",
  YENİ: "#6f82a3",
  DEM: "#8a6a93",
  MHP: "#a4524a",
  İYİ: "#6aa0a6",
  CHP: "#bb7462",
  Zafer: "#86845e",
  YRP: "#5f845a",
};

export type Rolle = "eigene" | "lager" | "duldung" | "opposition";

export interface Fraktionslage {
  partei: string;
  name: string;
  sitze: number;
  /** Anteil in Prozent, wie ihn das Parlament ausweist */
  anteil: number;
  rolle: Rolle;
  farbe: string;
}

export interface Parlamentslage {
  fraktionen: Fraktionslage[];
  /** Sitze der eigenen Partei und aller Partner */
  lager: number;
  /** Sitze der Fraktionen, die das Lager zurzeit dulden */
  duldung: number;
  opposition: number;
  gesamt: number;
  eigene: string;
  /** Ohne Spielschleife gibt es kein Lager; dann zählt die Wahlallianz */
  hatLager: boolean;
}

const RANG: Record<Rolle, number> = { eigene: 0, lager: 1, duldung: 2, opposition: 3 };

export function parlamentsLage(world: World): Parlamentslage | null {
  const parl = world.parliament;
  const spieler = world.player;
  if (!parl || !spieler) return null;
  const eigene = spieler.partei.kurz;
  const lager = world.spiel ? world.spiel.lager : spieler.buendnis ? [spieler.buendnis] : [];
  const duldet = world.spiel ? duldung(world).parteien : [];
  const rolleVon = (p: string): Rolle => (p === eigene ? "eigene" : lager.includes(p) ? "lager" : duldet.includes(p) ? "duldung" : "opposition");
  const fraktionen: Fraktionslage[] = Object.entries(parl.seats)
    .filter(([, s]) => s > 0)
    .map(([partei, sitze]) => {
      const rolle = rolleVon(partei);
      return {
        partei,
        name: partei === eigene ? spieler.partei.name : (PARTEI_NAME[partei] ?? partei),
        sitze,
        anteil: parl.shares[partei] ?? (sitze / 6),
        rolle,
        farbe: partei === eigene ? spieler.partei.farbe : (PARTY_COLORS[partei] ?? "#999"),
      };
    })
    .sort((a, b) => RANG[a.rolle] - RANG[b.rolle] || b.sitze - a.sitze);
  const summe = (r: Rolle[]) => fraktionen.filter((f) => r.includes(f.rolle)).reduce((s, f) => s + f.sitze, 0);
  return {
    fraktionen,
    lager: summe(["eigene", "lager"]),
    duldung: summe(["duldung"]),
    opposition: summe(["opposition"]),
    gesamt: fraktionen.reduce((s, f) => s + f.sitze, 0),
    eigene,
    hatLager: lager.length > 0,
  };
}

export const ROLLEN_WORT: Record<Rolle, string> = { eigene: "eigene Partei", lager: "im Lager", duldung: "duldet", opposition: "Opposition" };
