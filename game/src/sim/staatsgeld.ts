import type { EconomyState, World } from "./types";
import { PLAN_2026 } from "../data/haushaltsplan";

/** Gemeinsame Jahresrechnung für Schulden, Politiknetz und Haushaltsanzeige, in % des BIP. */
export function defizitQuote(e: EconomyState, strukturell = false): number {
  return e.deficit + e.fiscalImpulse + e.policyCost + (e.zinsMehrlast ?? 0) - (strukturell ? 0 : (e.konjunkturSaldo ?? 0));
}

export interface Geldbasis {
  basisBipMrd: number;
  real: number;
  preise: number;
  seit: string;
  letzterMonat: string;
}

const positiv = (x: unknown): x is number => typeof x === "number" && Number.isFinite(x) && x > 0;

/** Altstände starten ohne erfundene Wachstumsgewinne; vorhandene gültige Konten bleiben erhalten. */
export function geldbasis(w: World): Geldbasis {
  const b = w.economy.geldbasis;
  if (b && positiv(b.basisBipMrd) && positiv(b.real) && positiv(b.preise) && positiv(b.basisBipMrd * b.real * b.preise)
    && /^\d{4}-\d{2}-\d{2}$/.test(b.seit) && /^\d{4}-\d{2}$/.test(b.letzterMonat)) return b;
  return {
    basisBipMrd: positiv(w.economy.bipTryTn) ? w.economy.bipTryTn * 1000 : PLAN_2026.mrdProProzentBip * 100,
    real: 1, preise: 1, seit: w.date, letzterMonat: w.date.slice(0, 7),
  };
}

export function initialisiereStaatsgeld(w: World): void {
  if (w.spiel) w.economy.geldbasis = { ...geldbasis(w) };
}

/** Ein Abrechnungsmonat: reale Wirtschaftsleistung und Preise getrennt fortschreiben.
 * Keine zweite Steuerbonus- oder Schuldenbuchung: dafür bleiben Konjunktursaldo und economy zuständig.
 * Jahresraten sind Modellraten; Inflation dient hier als vereinfachter Preisindex, nicht als gemessener BIP-Deflator. */
export function staatsgeldMonat(w: World): void {
  if (!w.spiel) return;
  const b = geldbasis(w), monat = w.date.slice(0, 7);
  if (monat <= b.letzterMonat) return;
  const faktor = (rate: number) => Math.pow(1 + Math.max(-99, Number.isFinite(rate) ? rate : 0) / 100, 1 / 12);
  const real = b.real * faktor(w.economy.growth), preise = b.preise * faktor(w.economy.inflation);
  if (!positiv(b.basisBipMrd * real * preise)) return;
  w.economy.geldbasis = { ...b, real, preise, letzterMonat: monat };
}

export function bipMrd(w: World, real = false): number {
  const b = geldbasis(w);
  return b.basisBipMrd * b.real * (real ? 1 : b.preise);
}

export const geldAusBip = (w: World, prozent: number): number => prozent * bipMrd(w) / 100;
