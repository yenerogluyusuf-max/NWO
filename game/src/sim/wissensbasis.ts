// Die Wissensbasis des Landes: Bildung → Bildungsqualität, Hochschulen und Fachkräfte (über Jahre) → Innovationsgrenze → wirksame Forschung.
// Wer nur Geld in Forschung steckt, ohne Bildung, verpufft es: Über der Innovationsgrenze wirkt jede weitere Lira kaum noch. Wer nur Bildung
// finanziert, ohne Forschung, bildet für das Ausland aus (Abwanderung). Gelesen von Haushalt, Wissensbaum, Militär (neue Generationen) und Gütern
// (Chips, Medikamente). Alle Zahlen sind Spielparameter (Kalibrierung, keine Messwerte).

import type { World } from "./types";
import { NET } from "./modell";
import { PROVINCES, nationalAverage } from "./netz";
import { haushaltZustand } from "./wirtschaft";
import { RESSORT_NACH_ID } from "../data/haushaltsplan";

export const WISSEN = {
  /** Die Knoten, aus denen sich die Wissensbasis zusammensetzt, mit Gewicht */
  knoten: { bildungsqualitaet: 0.35, fachkraefte: 0.4, hochschule: 0.25 } as Record<string, number>,
  /** Forschung in % des BIP, die das Land beim Start voll aufnehmen kann (Startetat plus Spielraum) */
  grenzeStart: 0.7,
  /** So viel % des BIP hebt jeder Indexpunkt der Wissensbasis über dem Start die Grenze */
  grenzeJePunkt: 0.03,
  /** Untergrenze der Grenze in % des BIP */
  grenzeMin: 0.2,
  /** Wirkung jeder Lira über der Grenze (stark abnehmend) */
  ueberGrenze: 0.2,
  /** Ab so viel % des BIP, die die Bildung der Forschung voraus ist (Bildungszuwachs minus doppelter Forschungszuwachs), wandern Fachkräfte ab */
  abwanderungSchwelle: 0.4,
  /** Punkte, um die sich die Abwanderung je % des BIP Überhang dauerhaft verschiebt */
  abwanderungJeProzent: 3,
};

function startDurchschnitt(id: string, w: World): number {
  const i = NET.index.get(id);
  if (i === undefined) return NaN;
  let sum = 0;
  for (let p = 0; p < PROVINCES; p++) sum += w.net.start[i * PROVINCES + p]! * w.net.weights[p]!;
  return sum;
}

/** Index der Wissensbasis (Bildungsqualität, Fachkräfte, Hochschulen) und sein Abstand zum Start in Punkten. */
export function wissensIndex(w: World): { jetzt: number; start: number; abstand: number } {
  let jetzt = 0;
  let start = 0;
  for (const [id, g] of Object.entries(WISSEN.knoten)) {
    const a = nationalAverage(NET, w.net, id);
    const s = startDurchschnitt(id, w);
    if (!Number.isFinite(a) || !Number.isFinite(s)) continue;
    jetzt += a * g;
    start += s * g;
  }
  return { jetzt, start, abstand: jetzt - start };
}

/** Bis zu wie viel % des BIP Forschung voll wirkt. Bildung (über Jahre) hebt die Grenze, Abwanderung und Verfall senken sie. */
export function innovationsGrenze(w: World): number {
  return Math.max(WISSEN.grenzeMin, WISSEN.grenzeStart + WISSEN.grenzeJePunkt * wissensIndex(w).abstand);
}

/** Etat in % des BIP aus einer (wirksamen oder beschlossenen) Stufe. */
function etat(id: string, stufe: number): number {
  const r = RESSORT_NACH_ID[id];
  return r ? Math.max(0, r.startBip + stufe * r.schritt) : 0;
}

/** Wirksame Forschung in % des BIP: bis zur Grenze voll, darüber stark abnehmend. */
export function wirksameForschung(budget: number, grenze: number): number {
  return budget <= grenze ? budget : grenze + (budget - grenze) * WISSEN.ueberGrenze;
}

/** Was die Forschung des Landes gerade leistet (in % des BIP, schon gereift und gedeckelt). */
export function forschungsLeistung(w: World): number {
  const z = haushaltZustand(w);
  return wirksameForschung(etat("forschung", z.wirksam?.forschung ?? z.stufen.forschung ?? 0), innovationsGrenze(w));
}

/** Forschungsrate relativ zum Start (1 = wie 2026): für Wissensbaum, Rüstungsentwicklung und Güter. */
export function forschungsRate(w: World): number {
  const start = RESSORT_NACH_ID.forschung?.startBip ?? 0.4;
  return forschungsLeistung(w) / start;
}

/** Wie viel % des BIP die Bildung der Forschung voraus ist (Ausbau gemessen am Start); daraus speist sich die Abwanderung. */
export function bildungsUeberhang(w: World): number {
  const z = haushaltZustand(w);
  const w_ = z.wirksam ?? {};
  const bildung = etat("bildung", w_.bildung ?? 0) - etat("bildung", 0);
  const forschung = etat("forschung", w_.forschung ?? 0) - etat("forschung", 0);
  return bildung - 2 * forschung;
}

/** Die Wirkung für die Haushaltsansicht beim Forschungsetat. */
export function forschungsSicht(w: World, budget: number): { grenze: number; wirksam: number; verpufft: number } {
  const grenze = innovationsGrenze(w);
  const wirksam = wirksameForschung(budget, grenze);
  return { grenze, wirksam, verpufft: Math.max(0, budget - wirksam) };
}
