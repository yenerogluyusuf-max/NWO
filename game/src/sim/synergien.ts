// Das Zusammenspiel zweier Maßnahmen für die Oberfläche: Welche Partner hat eine Maßnahme, worauf wirken sie gemeinsam, und warum?
// Die Rechnung steht in sim/netz.ts (stepNet); die Daten in data/politiknetz.ts (SYNERGIEN), die Texte im Katalog (netz.synergie.*).

import { SYNERGIEN, type SynergieSpec } from "../data/politiknetz";

export interface ZusammenspielZeile {
  id: string;
  /** Die andere Maßnahme des Paares */
  partner: string;
  /** Der Zielknoten, auf den beide gemeinsam wirken */
  ziel: string;
  weight: number;
  lag: number;
  modus: SynergieSpec["modus"];
  why: string;
}

/** Alle Zusammenspiele, an denen eine Maßnahme beteiligt ist, nach Stärke geordnet. */
export function zusammenspielFuer(massnahmeId: string): ZusammenspielZeile[] {
  return SYNERGIEN.filter((s) => s.a === massnahmeId || s.b === massnahmeId)
    .map((s) => ({ id: s.id, partner: s.a === massnahmeId ? s.b : s.a, ziel: s.to, weight: s.weight, lag: s.lag, modus: s.modus, why: s.why }))
    .sort((x, y) => Math.abs(y.weight) - Math.abs(x.weight));
}

/** Alle Zusammenspiele, die auf einen Knoten wirken (für die Ansicht der Größe). */
export function zusammenspielAuf(zielId: string): ZusammenspielZeile[] {
  return SYNERGIEN.filter((s) => s.to === zielId)
    .map((s) => ({ id: s.id, partner: `${s.a}+${s.b}`, ziel: s.to, weight: s.weight, lag: s.lag, modus: s.modus, why: s.why }))
    .sort((x, y) => Math.abs(y.weight) - Math.abs(x.weight));
}
