import type { EconomyState, World } from "./types";
import { EINNAHMEN_ANTEIL, EINNAHMEN_ARTEN, PLAN_2026, type SteuerArt } from "../data/haushaltsplan";
// Nur innerhalb von Funktionen benutzt (economy.ts importiert dieses Modul; der Zyklus ist zur Ladezeit unschädlich)
import { PARAMS } from "./economy";

// ---------------------------------------------------------------------------
// Welle H1 (06.11.2026): Der Haushalt rechnet wie ein echter Staat. Rückmeldung des Inhabers: „Die Ausgaben und Einnahmen sind immer gleich,
// egal wie stark sich die Wirtschaft entwickelt.“ Vorher standen beide Seiten als Anteil am BIP, und nur ein gedeckelter Konjunktursaldo
// bewegte das Defizit.
//
// Ausgaben: Das Haushaltsgesetz legt die Primärausgaben einmal im Jahr in Lira fest. Grundlage ist das BIP, das der Haushalt für das Jahr
//   plant (Planpfad `Haushaltsetat`), mit den beschlossenen Stufen und Posten. Alle Ausgabenbeschlüsse (Grundhaushalt, Regler, Ereignisse,
//   Kosten der Maßnahmen) zählen als Anteil am Plan-BIP; was unter dem Jahr dazukommt (Nachtrag, Ereignis, Gesetz), wird zum Plan-BIP in
//   Lira umgerechnet. So bleiben die Lira-Ausgaben fest, solange niemand beschließt. Die Zinsen folgen weiter dem Zinsmodell (sim/haushalt.ts).
// Einnahmen: Satz mal Bemessungsgrundlage; die Grundlage jeder Steuerart folgt dem tatsächlichen nominalen BIP mit ihrer Elastizität
//   (data/haushaltsplan.ts, EINNAHMEN_ARTEN). Liegt die Wirtschaft über dem Plan, kommen Mehreinnahmen herein, und dieselben Lira-Ausgaben
//   sind ein kleinerer Anteil am BIP: Das Defizit sinkt. Eine Rezession reißt ein Loch. Inflation über Plan entwertet die Lira-Ausgaben real
//   (`kaufkraft`); daran messen die Wirkungen der Ressorts (sim/haushalt.ts).
// Jahreswechsel: Im Januar beginnt ein neues Haushaltsjahr mit dem BIP von heute als Grundlage. Liegt die Wirtschaft genau auf dem Plan,
//   rechnet alles wie vorher (Prüfung: test/haushalt-etat.test.ts).

/** Das Haushaltsgesetz des laufenden Jahres: der Planpfad des BIP, auf dem die Lira-Ansätze beruhen. */
export interface Haushaltsetat {
  /** Haushaltsjahr */
  jahr: number;
  /** Planpfad auf der Skala der Geldbasis: reale Leistung und Preise, mit den Planraten fortgeschrieben */
  real: number;
  preise: number;
  /** Planraten in % p. a.: reales Wachstum und Inflation, die das Haushaltsgesetz annimmt */
  wachstum: number;
  inflation: number;
  /** Letzter fortgeschriebener Monat (JJJJ-MM), im Takt der Geldbasis */
  letzterMonat: string;
  /** Inflationsausgleich durch einen Nachtragshaushalt: Faktor auf die Lira-Ausgaben (fehlt = 1), gilt bis zum Jahresende */
  ausgleich?: number;
}

/** Einnahmen des Haushaltsgesetzes 2026 in % des BIP (Grundhaushalt ohne Beschlüsse). */
export const START_EINNAHMEN_BIP = PLAN_2026.einnahmenGesamt / PLAN_2026.mrdProProzentBip;

const gueltigerEtat = (p: Haushaltsetat | undefined): p is Haushaltsetat => !!p
  && Number.isFinite(p.jahr) && positiv(p.real) && positiv(p.preise) && Number.isFinite(p.wachstum) && Number.isFinite(p.inflation)
  && /^\d{4}-\d{2}$/.test(p.letzterMonat);

/**
 * Die Planraten eines neuen Haushaltsgesetzes. Reales Wachstum: das Potenzial, dazu die Erholung oder Abkühlung, die das Modell selbst
 * erwartet (die Auslastung bildet sich je Monat um den Faktor `gapPersistence` zurück, sim/economy.ts). Inflation: die Erwartung von
 * Haushalten und Firmen. Beides ist eine Spielannahme, keine Prognose der türkischen Regierung (Zur Bestätigung durch den Inhaber).
 */
export function planRaten(e: EconomyState): { wachstum: number; inflation: number } {
  const erholung = e.outputGap * (Math.pow(PARAMS.gapPersistence, 12) - 1);
  return { wachstum: e.potentialGrowth + e.potentialShift + erholung, inflation: e.expectedInflation };
}

function neuesEtat(e: EconomyState, b: Geldbasis, jahr: number): Haushaltsetat {
  return { jahr, real: b.real, preise: b.preise, ...planRaten(e), letzterMonat: b.letzterMonat };
}

/**
 * Plan-BIP / tatsächliches BIP (kleiner 1: die Wirtschaft liegt nominal über dem Plan), der Inflationsausgleich eines Nachtrags und die
 * Kaufkraft der Lira-Ausgaben (Planpreise / Preise, mal Ausgleich).
 */
export function planVerhaeltnis(e: EconomyState): { plan: number; ausgleich: number; kaufkraft: number } {
  const b = e.geldbasis, p = e.etat;
  if (!gueltigeBasis(b) || !gueltigerEtat(p)) return { plan: 1, ausgleich: 1, kaufkraft: 1 };
  const ausgleich = positiv(p.ausgleich) ? p.ausgleich : 1;
  return { plan: (p.real * p.preise) / (b.real * b.preise), ausgleich, kaufkraft: (p.preise / b.preise) * ausgleich };
}

/** Reale Kaufkraft der beschlossenen Lira-Ausgaben (1 = wie geplant; 0,97 = drei Prozent weniger, weil die Preise schneller stiegen). */
export const kaufkraft = (e: EconomyState): number => planVerhaeltnis(e).kaufkraft;

const nullJeArt = (): Record<SteuerArt, number> => Object.fromEntries(EINNAHMEN_ARTEN.map((a) => [a.id, 0])) as Record<SteuerArt, number>;

export interface HaushaltsRechnung {
  /** Plan-BIP / BIP, Inflationsausgleich und Kaufkraft (planVerhaeltnis) */
  plan: number;
  ausgleich: number;
  kaufkraft: number;
  /** Primärausgaben der Beschlüsse in % des Plan-BIP */
  primaerPlan: number;
  /** Alle folgenden Größen in % des tatsächlichen BIP */
  primaer: number;
  zinsen: number;
  ausgaben: number;
  /** Ertrag der Steuermaßnahmen je Art in % des Plan-BIP (Beschlüsse seit dem Amtsantritt) */
  ertrag: Record<SteuerArt, number>;
  /** Aufkommen je Art: tatsächlich und so, wie es beim Plan-BIP wäre */
  steuern: Record<SteuerArt, number>;
  steuernPlan: Record<SteuerArt, number>;
  /** Steuerbasis jenseits von Sätzen und Konjunktur (konjunkturSaldo) und Übergang älterer Spielstände */
  basis: number;
  uebergang: number;
  einnahmen: number;
  einnahmenPlan: number;
  defizit: number;
}

/**
 * Die Jahresrechnung des Haushalts in % des BIP. `ertrag` ist der Ertrag der Steuermaßnahmen je Art; ohne Angabe gilt der im Monatsabschluss
 * gebuchte Stand (EconomyState.steuerErtrag). Lesen bucht nichts.
 */
export function haushaltsRechnung(e: EconomyState, ertragJeArt: Partial<Record<SteuerArt, number>> = (e.steuerErtrag ?? {}) as Partial<Record<SteuerArt, number>>): HaushaltsRechnung {
  const { plan, ausgleich, kaufkraft } = planVerhaeltnis(e);
  const ertrag = nullJeArt(), steuern = nullJeArt(), steuernPlan = nullJeArt();
  let ertragSumme = 0, einnahmenPlan = 0, steuerSumme = 0;
  for (const a of EINNAHMEN_ARTEN) {
    const x = ertragJeArt[a.id] ?? 0;
    ertrag[a.id] = x;
    ertragSumme += x;
    const q = START_EINNAHMEN_BIP * EINNAHMEN_ANTEIL[a.id] + x;
    // Lira = q × Plan-BIP × (BIP / Plan-BIP)^ε; als Anteil am BIP: q × plan^(1 − ε)
    steuern[a.id] = q * Math.pow(plan, 1 - a.elastizitaet);
    steuernPlan[a.id] = q * plan;
    steuerSumme += steuern[a.id];
    einnahmenPlan += steuernPlan[a.id];
  }
  const primaerPlan = e.deficit + START_EINNAHMEN_BIP - PLAN_2026.zinsenProzentBip + e.fiscalImpulse + e.policyCost + ertragSumme;
  // Die Lira-Ausgaben: Plan-BIP mal Beschlüsse, ein Nachtrag zum Inflationsausgleich erhöht sie; die Einnahmen berührt er nicht
  const primaer = primaerPlan * plan * ausgleich, zinsen = zinsQuote(e), ausgaben = primaer + zinsen;
  const basis = e.konjunkturSaldo ?? 0, uebergang = e.konjunkturUebergang?.rest ?? 0;
  const einnahmen = steuerSumme + basis + uebergang;
  return { plan, ausgleich, kaufkraft, primaerPlan, primaer, zinsen, ausgaben, ertrag, steuern, steuernPlan, basis, uebergang,
    einnahmen, einnahmenPlan: einnahmenPlan + (basis + uebergang) * plan, defizit: ausgaben - einnahmen };
}

/**
 * Gemeinsame Jahresrechnung für Schulden, Politiknetz und Haushaltsanzeige, in % des BIP. Liegt die Wirtschaft auf dem Plan, ist sie
 * Grunddefizit + Impuls + Maßnahmen + Mehrzinsen − Steuerbasis, wie vor Welle H1. Strukturell (IWF-Auflagen): ohne jede Abweichung durch
 * die Wirtschaft und ohne Steuerbasis, unverändert.
 */
export function defizitQuote(e: EconomyState, strukturell = false, ertrag?: Partial<Record<SteuerArt, number>>): number {
  if (strukturell) return e.deficit + e.fiscalImpulse + e.policyCost + (e.zinsMehrlast ?? 0);
  return haushaltsRechnung(e, ertrag).defizit;
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
  if (!w.spiel) return;
  const e = w.economy, neu = !gueltigeBasis(e.geldbasis);
  e.geldbasis = { ...geldbasis(w) };
  // Ältere Spielstände ohne Lira-Etat (und eine neu angelegte Geldbasis) bekommen ein Haushaltsgesetz aus den heutigen Quoten: Plan = heute,
  // das Defizit springt beim Laden nicht.
  if (neu || !gueltigerEtat(e.etat)) e.etat = neuesEtat(e, e.geldbasis, Number(e.geldbasis.letzterMonat.slice(0, 4)));
}

/** Den Planpfad einen Monat fortschreiben; im Januar beginnt ein neues Haushaltsjahr mit dem heutigen BIP als Grundlage. */
function etatMonat(e: EconomyState, monat: string): void {
  const p = e.etat, b = e.geldbasis;
  if (!gueltigerEtat(p) || !gueltigeBasis(b) || monat <= p.letzterMonat) return;
  const jahr = Number(monat.slice(0, 4));
  if (jahr > p.jahr) { e.etat = neuesEtat(e, b, jahr); return; }
  e.etat = { ...p, real: p.real * monatsfaktor(p.wachstum), preise: p.preise * monatsfaktor(p.inflation), letzterMonat: monat };
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
  etatMonat(w.economy, monat);
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
