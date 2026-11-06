// Örtliche Stimmenanteile der Parteien je Provinz: Umfragen vom Stichtag, Quellparteien einer neuen Partei und die Hochburgen von 2023
// (data/provinzdaten.json, stimmen2023, belegt). Eigenes, schlankes Modul (Welle H2): Die Kommunalwahl (sim/kommunen.ts) braucht diese
// Rechnung, und ein Import aus sim/prolog.ts zog über sim/spiel.ts einen Ladezyklus nach sich (gespraeche ↔ nachfolge ↔ ressortpolitik).
// sim/prolog.ts reicht alles weiter, die bisherigen Importe bleiben gültig.

import { PROVINZEN, WEIGHTS, type ProvinceData } from "./regional";
import { parteiAchsen, quellenAusAchsen } from "./linie";
import type { Achsen } from "../data/linien";

/** Durchschnitt der Umfragen vom Stichtag (tuerkei/recherche/umfragen.md), Unentschlossene herausgerechnet. */
export const POLLS: Record<string, number> = {
  AKP: 33.7,
  YENİ: 23.1,
  DEM: 9.0,
  MHP: 7.5,
  İYİ: 6.9,
  CHP: 6.8,
  Zafer: 3.5,
  YRP: 2.8,
  Andere: 6.7,
};

/** Aus welchen Parteien die neue Partei Stimmen gewinnt, je nach Profil (Anteil am Zugewinn). */
const SOURCES: Record<string, Record<string, number>> = {
  AP: { YENİ: 0.35, CHP: 0.2, İYİ: 0.2, AKP: 0.15, Andere: 0.1 },
  PG: { YENİ: 0.3, CHP: 0.2, AKP: 0.25, DEM: 0.1, Andere: 0.15 },
  PW: { AKP: 0.5, MHP: 0.2, YRP: 0.15, İYİ: 0.1, Andere: 0.05 },
  PR: { DEM: 0.25, AKP: 0.25, YENİ: 0.2, MHP: 0.1, Andere: 0.2 },
};

/** Aus welchen Parteien eine Partei ihre Stimmen zieht: die klassischen Muster von Hand, jede andere Linie nach Nähe auf den Achsen. */
export function quellenFuer(eigene: string, achsen?: Achsen): Record<string, number> {
  const fest = SOURCES[eigene];
  if (fest) return fest;
  const a = achsen ?? parteiAchsen(eigene);
  return a ? quellenAusAchsen(a, POLLS) : { Andere: 1 };
}

/** Welche Partei von 2023 als regionales Muster für eine Partei von 2026 dient. */
const PATTERN: Record<string, "AKP" | "CHP" | "MHP" | "İYİ" | "YSP" | null> = {
  AKP: "AKP",
  YENİ: "CHP",
  CHP: "CHP",
  MHP: "MHP",
  İYİ: "İYİ",
  DEM: "YSP",
  Zafer: null,
  YRP: null,
  Andere: null,
};

/** Regionale Stärke einer Partei: Anteil 2023 in der Provinz im Verhältnis zum Landeswert (1 = Durchschnitt). */
export function regionalRatio(party: string, p: ProvinceData): number {
  const pattern = PATTERN[party];
  if (!pattern) return 1;
  const nat = NAT_2023[pattern];
  let local = p.stimmen2023[pattern];
  if (pattern === "CHP" && local === 0) {
    // 2023 trat die CHP in einigen Provinzen nicht mit eigener Liste an; dann das Oppositionslager insgesamt
    local = ((p.stimmen2023.CHP + p.stimmen2023.İYİ) / (NAT_2023.CHP + NAT_2023.İYİ)) * nat;
  }
  return nat > 0 ? local / nat : 1;
}

const NAT_2023 = (["AKP", "CHP", "MHP", "İYİ", "YSP"] as const).reduce(
  (acc, k) => {
    acc[k] = PROVINZEN.reduce((s, p, i) => s + p.stimmen2023[k] * WEIGHTS[i]!, 0);
    return acc;
  },
  {} as Record<"AKP" | "CHP" | "MHP" | "İYİ" | "YSP", number>,
);

/**
 * Örtliche Stimmenanteile aller Parteien bei gegebenen Landesanteilen: Jede Partei folgt dem Muster ihrer Hochburgen
 * von 2023 (regionalRatio; die eigene Partei dem Muster ihrer Quellparteien), danach wird jede Provinz auf 100 Prozent gebracht
 * und der Landesschnitt jeder Partei auf ihren Landesanteil nachgezogen. Für die Parlamentswahl nach dem Start (sim/wahl.ts).
 */
export function lokaleAnteile(shares: Record<string, number>, eigene: string): Record<string, number>[] {
  const parteien = Object.keys(shares);
  const quelle = eigene in POLLS ? undefined : quellenFuer(eigene);
  const ratio = (party: string, p: ProvinceData): number => {
    if (party === eigene && quelle) {
      let summe = 0;
      let gewicht = 0;
      for (const [src, w] of Object.entries(quelle)) {
        summe += w * regionalRatio(src, p);
        gewicht += w;
      }
      return gewicht > 0 ? summe / gewicht : 1;
    }
    return regionalRatio(party, p);
  };
  let local: Record<string, number>[] = PROVINZEN.map((p) => Object.fromEntries(parteien.map((k) => [k, Math.max(0.05, (shares[k] ?? 0) * ratio(k, p))])));
  // Zwei Durchgänge: Landesschnitt je Partei auf den Sollwert, dann jede Provinz auf 100
  for (let durchgang = 0; durchgang < 2; durchgang++) {
    const schnitt: Record<string, number> = {};
    for (const k of parteien) schnitt[k] = local.reduce((s, sh, i) => s + sh[k]! * WEIGHTS[i]!, 0);
    local = local.map((sh) => {
      const neu = Object.fromEntries(parteien.map((k) => [k, schnitt[k]! > 0 ? sh[k]! * ((shares[k] ?? 0) / schnitt[k]!) : sh[k]!]));
      const total = parteien.reduce((s, k) => s + neu[k]!, 0);
      return Object.fromEntries(parteien.map((k) => [k, total > 0 ? (neu[k]! / total) * 100 : 0]));
    });
  }
  return local;
}

