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
const gueltigeBasis = (b: Geldbasis | undefined): b is Geldbasis => !!b
  && positiv(b.basisBipMrd) && positiv(b.real) && positiv(b.preise) && positiv(b.basisBipMrd * b.real * b.preise)
  && /^\d{4}-\d{2}-\d{2}$/.test(b.seit) && /^\d{4}-\d{2}$/.test(b.letzterMonat);
const startBipMrd = (e: EconomyState): number => positiv(e.bipTryTn) ? e.bipTryTn * 1000 : PLAN_2026.mrdProProzentBip * 100;

/** Gemeinsamer Geldwert, auch für Module, die nur EconomyState kennen. Lesen bucht nichts. */
export function bipWertMrd(e: EconomyState, real = false): number {
  const b = e.geldbasis;
  return gueltigeBasis(b) ? b.basisBipMrd * b.real * (real ? 1 : b.preise) : startBipMrd(e);
}

export const bipUsdMrd = (e: EconomyState): number => bipWertMrd(e) / Math.max(1, e.usdTry);

/** Jahresraten werden in denselben Monatsfaktor für Geldbeträge und Schuldenquoten übersetzt. */
export const monatsfaktor = (rate: number): number => Math.pow(1 + Math.max(-99, Number.isFinite(rate) ? rate : 0) / 100, 1 / 12);

export interface SchuldenRechnung {
  bipVorherMrd: number;
  bipNachherMrd: number;
  vorherMrd: number;
  defizitMrd: number;
  wechselkursMrd: number;
  /** Überschuss jenseits vollständiger Tilgung, wird im Kassenbestand erhalten. */
  restUeberschussMrd: number;
  /** Optional für gespeicherte Abschlüsse vor Einführung des Kassenbestands. */
  kasseVorherMrd?: number;
  kasseEntnahmeMrd?: number;
  kasseNachherMrd?: number;
  nachherMrd: number;
  vorherQuote: number;
  nachherQuote: number;
}

/** Bestandsrechnung: alter Bestand + Wechselkursbewertung + Gesamtdefizit (Zinsen bereits enthalten).
 * Der Monatsfluss beträgt 1/12 der Jahresquote beim aktuellen Monats-BIP. Nur der vorhandene
 * FX-Schuldenbestand wird umbewertet, neue Schulden nicht rückwirkend für den gesamten Monat.
 * Ohne vorgegebenen Kursvergleich ist dies eine Rechnung bei unverändertem Wechselkurs. */
export function schuldenMonatsrechnung(e: EconomyState, vorherUsdTry = e.usdTry, fxAnteil = 0): SchuldenRechnung {
  const bipVorherMrd = bipWertMrd(e);
  const bipNachherMrd = bipVorherMrd * monatsfaktor(e.growth) * monatsfaktor(e.inflation);
  const vorherMrd = Math.max(0, e.debtRatio) * bipVorherMrd / 100;
  const wechselkursMrd = positiv(vorherUsdTry) && positiv(e.usdTry)
    ? vorherMrd * Math.max(0, Math.min(1, fxAnteil)) * (e.usdTry / vorherUsdTry - 1) : 0;
  const defizitMrd = defizitQuote(e) * bipNachherMrd / 100 / 12;
  const kasseVorherMrd = kassenbestand(e);
  const kasseEntnahmeMrd = Math.min(kasseVorherMrd, Math.max(0, defizitMrd));
  const saldo = vorherMrd + wechselkursMrd + defizitMrd - kasseEntnahmeMrd;
  const nachherMrd = Math.max(0, saldo);
  return { bipVorherMrd, bipNachherMrd, vorherMrd, defizitMrd, wechselkursMrd,
    restUeberschussMrd: Math.max(0, -saldo), nachherMrd, kasseVorherMrd, kasseEntnahmeMrd,
    kasseNachherMrd: kasseVorherMrd - kasseEntnahmeMrd + Math.max(0, -saldo),
    vorherQuote: e.debtRatio, nachherQuote: nachherMrd / bipNachherMrd * 100 };
}

/** Gebuchter Zinsdienst; Haushalt, Defizit und Kennzahl zeigen denselben Monatsansatz. */
export const zinsQuote = (e: EconomyState): number => PLAN_2026.zinsenProzentBip + (e.zinsMehrlast ?? 0);

/** Altstände starten ohne erfundene Wachstumsgewinne; vorhandene gültige Konten bleiben erhalten. */
export function geldbasis(w: World): Geldbasis {
  const b = w.economy.geldbasis;
  if (gueltigeBasis(b)) return b;
  return {
    basisBipMrd: startBipMrd(w.economy),
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
  const real = b.real * monatsfaktor(w.economy.growth), preise = b.preise * monatsfaktor(w.economy.inflation);
  if (!positiv(b.basisBipMrd * real * preise)) return;
  w.economy.geldbasis = { ...b, real, preise, letzterMonat: monat };
}

export function bipMrd(w: World, real = false): number {
  return bipWertMrd(w.economy, real);
}

export const geldAusBip = (w: World, prozent: number): number => prozent * bipMrd(w) / 100;

/** Unverzinste Kasse in nominalen Mrd. Lira; Altstände erhalten kein erfundenes Guthaben. */
export const kassenbestand = (e: EconomyState): number => positiv(e.kassenbestandMrd) ? e.kassenbestandMrd : 0;

/** Einmaliger Finanzierungssaldo: Guthaben vor neuen Krediten verwenden, Einnahmen zuerst tilgen.
 * Nur Finanzierung, keine Nachfrage-/Vertrauenswirkung: diese bleibt beim jeweiligen Spielereignis.
 * Politisches Kapital und der laufende Jahresetat bleiben getrennt. */
export function bucheFinanzsaldo(e: EconomyState, prozentBip: number): void {
  const bip = bipWertMrd(e), kasse = kassenbestand(e), betrag = prozentBip * bip / 100;
  const entnahme = Math.min(kasse, Math.max(0, betrag));
  const saldo = Math.max(0, e.debtRatio) * bip / 100 + betrag - entnahme;
  e.debtRatio = Math.max(0, saldo) / bip * 100;
  e.kassenbestandMrd = kasse - entnahme + Math.max(0, -saldo);
}
