// Wirtschaftsregeln nach WIRTSCHAFTSMODELL.md (Z1 bis Z9).
// Alle Parameter sind Platzhalter für die Kalibrierung, keine Messwerte.

import type { EconomyState, GovernorStance, MonthlySnapshot } from "./types";
import type { Rng } from "./rng";

export const PARAMS = {
  /** Neutraler Realzins in % */
  neutralRealRate: 3,
  /** Ausländische Inflation in % (für den Inflationsabstand beim Wechselkurs) */
  foreignInflation: 2.5,
  /** Z1: Wirkung des Realzinses auf die Auslastung (je Prozentpunkt, pro Monat) */
  rateOnGap: 0.05,
  /** Z1: Verzögerung in Monaten */
  rateLagMonths: 6,
  /** Persistenz der Auslastung pro Monat */
  gapPersistence: 0.85,
  /** Z6: Wirkung zusätzlicher Staatsausgaben (% BIP) auf die Auslastung */
  fiscalOnGap: 0.12,
  /** Z2: Wirkung der Auslastung auf die Inflation */
  gapOnInflation: 0.5,
  /** Z5: Weitergabe einer übermäßigen Abwertung an die Inflation */
  fxPassThrough: 0.25,
  /** Anpassungsgeschwindigkeit der Inflation pro Monat */
  inflationSpeed: 0.12,
  /** Z3: Anpassungsgeschwindigkeit der Erwartungen pro Monat */
  expectationSpeed: 0.15,
  /** Z9: Okun-Koeffizient (monatlich) */
  okun: 0.035,
  /** Natürliche Arbeitslosenquote in % */
  naturalUnemployment: 9,
  /** Z4: Wirkung des Realzinses auf die Abwertung (% p. a. je Prozentpunkt) */
  carryOnFx: 0.5,
  /** Tägliche Schwankung des Wechselkurses (Standardabweichung, Anteil) */
  fxNoise: 0.0015,
  /** Langfristiges Inflationsziel der Zentralbank in % */
  longRunTarget: 5,
  /** Monatliche Annäherung der Zwischenziele an das langfristige Ziel (ergibt etwa 24, 15, 9, 5) */
  targetGlide: 0.04,
} as const;

/** Wirkung der Außenwelt (Indizes, Start = 100). Platzhalter der Kalibrierung. */
export const AUSSEN = {
  /** Prozentpunkte Inflation je Indexpunkt Energiepreis über 100 (Energieimporte) */
  oelAufInflation: 0.02,
  /** Auslastung (Prozentpunkte je Monat) je Indexpunkt Energiepreis */
  oelAufAuslastung: 0.004,
  /** Auslastung (Prozentpunkte je Monat) je Indexpunkt EU-Nachfrage */
  euAufAuslastung: 0.012,
  /** Basispunkte Risikoaufschlag je Indexpunkt Weltzins über 100 */
  weltzinsAufRisiko: 3,
} as const;

/** Potenzialwachstum einschließlich der Wirkung des Politiknetzes. */
export function potential(e: EconomyState): number {
  return e.potentialGrowth + e.potentialShift;
}

/** Realzins in Prozentpunkten. */
export function realRate(e: EconomyState): number {
  return e.policyRate - e.expectedInflation;
}

/** Z4: tägliche Veränderung des Wechselkurses (Anteil, z. B. 0,001 = 0,1 %). */
export function dailyDepreciation(e: EconomyState, rng: Rng): number {
  const inflationGap = e.inflation - PARAMS.foreignInflation;
  const carry = PARAMS.carryOnFx * (realRate(e) - PARAMS.neutralRealRate);
  const risk = (e.riskPremium - 250) / 100;
  const annual = inflationGap - carry + risk;
  const noise = rng.normal(PARAMS.fxNoise * (1.5 - e.credibility));
  return annual / 100 / 365 + noise;
}

/** Z8: täglicher Risikoaufschlag, zieht zum fundamentalen Wert. */
export function dailyRiskPremium(e: EconomyState, rng: Rng): number {
  const fundamental =
    150 +
    3 * Math.max(0, e.inflation - 10) +
    2 * Math.max(0, e.debtRatio - 40) +
    200 * (1 - e.credibility) +
    AUSSEN.weltzinsAufRisiko * ((e.weltzins ?? 100) - 100);
  return e.riskPremium + 0.02 * (fundamental - e.riskPremium) + rng.normal(2);
}

/** Monatliche Fortschreibung der Realwirtschaft (Z1, Z2, Z3, Z5, Z6, Z7, Z9). */
export function monthlyUpdate(e: EconomyState, history: MonthlySnapshot[], rng: Rng): void {
  const lagged = history[history.length - PARAMS.rateLagMonths];
  const laggedRealRate = lagged ? lagged.realRate : realRate(e);

  // Z1 und Z6: Nachfrage und Auslastung
  e.outputGap =
    PARAMS.gapPersistence * e.outputGap -
    PARAMS.rateOnGap * (laggedRealRate - PARAMS.neutralRealRate) +
    PARAMS.fiscalOnGap * (e.fiscalImpulse + e.policyCost) +
    AUSSEN.euAufAuslastung * ((e.euNachfrage ?? 100) - 100) -
    AUSSEN.oelAufAuslastung * ((e.oel ?? 100) - 100) +
    rng.normal(0.25);

  // Z5: übermäßige Abwertung der letzten 12 Monate
  const yearAgo = history[history.length - 12];
  e.fxChange12 = yearAgo ? (e.usdTry / yearAgo.usdTry - 1) * 100 : e.inflation - PARAMS.foreignInflation;
  const excessDepreciation = e.fxChange12 - (e.inflation - PARAMS.foreignInflation);

  // Z2 und Z3: Inflation zieht zu Erwartung, Auslastung und Importpreisen
  const anchor =
    e.expectedInflation +
    PARAMS.gapOnInflation * e.outputGap +
    PARAMS.fxPassThrough * excessDepreciation +
    e.costPush +
    AUSSEN.oelAufInflation * ((e.oel ?? 100) - 100);
  const previousInflation = e.inflation;
  e.inflation += PARAMS.inflationSpeed * (anchor - e.inflation) + rng.normal(0.3);
  e.inflation = Math.max(-2, e.inflation);

  // Die Zentralbank senkt ihre Zwischenziele schrittweise zum langfristigen Ziel
  e.inflationTarget += PARAMS.targetGlide * (PARAMS.longRunTarget - e.inflationTarget);

  // Z3: Erwartungen zwischen Ziel und aktueller Inflation, gewichtet nach Glaubwürdigkeit
  const credibleAnchor = e.credibility * e.inflationTarget + (1 - e.credibility) * e.inflation;
  e.expectedInflation += PARAMS.expectationSpeed * (credibleAnchor - e.expectedInflation);

  // Z3: Glaubwürdigkeit wächst langsam und fällt schnell
  const r = realRate(e);
  if (r > 1 && e.inflation < previousInflation) e.credibility += 0.01;
  if (r < 0) e.credibility -= 0.02;
  e.credibility = clamp(e.credibility, 0.05, 0.95);

  // Wachstum zum Vorjahr aus der Veränderung der Auslastung
  const gapYearAgo = yearAgo ? yearAgo.outputGap : e.outputGap;
  e.growth = potential(e) + (e.outputGap - gapYearAgo);

  // Z9: Arbeitslosigkeit folgt dem Wachstum
  e.unemployment +=
    0.03 * (PARAMS.naturalUnemployment - e.unemployment) -
    PARAMS.okun * (e.growth - potential(e));
  e.unemployment = clamp(e.unemployment, 3, 30);

  // Z7: Defizite werden zu Schulden, nominales Wachstum senkt die Quote
  const nominalGrowth = (e.growth + e.inflation) / 100;
  e.debtRatio += (e.deficit + e.fiscalImpulse + e.policyCost + (e.zinsMehrlast ?? 0)) / 12 - (e.debtRatio * nominalGrowth) / 12;
  e.debtRatio = Math.max(0, e.debtRatio);
}

/** Gewichte der Reaktionsregel je Haltung der Führung. */
export const PPK_GEWICHTE: Record<GovernorStance, { infl: number; gap: number; bias: number }> = {
  vorsichtig: { infl: 0.8, gap: 0.2, bias: 0 },
  ausgewogen: { infl: 0.5, gap: 0.5, bias: 0 },
  gefuegig: { infl: 0.2, gap: 0.8, bias: -8 },
};

/** Der Zins, auf den die Regel der Bank zielt (vor der Glättung), in %. */
export function ppkZiel(e: EconomyState, stance: GovernorStance): number {
  const w = PPK_GEWICHTE[stance];
  return PARAMS.neutralRealRate + e.expectedInflation + w.infl * (e.inflation - e.inflationTarget) + w.gap * e.outputGap + w.bias;
}

/**
 * Reaktionsregel des Geldpolitischen Ausschusses (angelehnt an Taylor 1993): Die Bank geht die halbe Strecke zum Zielzins, höchstens
 * fünf Punkte je Sitzung. `druck` ist die Verschiebung des Beschlusses in Prozentpunkten durch politischen Einfluss (Zentralbank-Modul);
 * er kommt zur Regel hinzu und darf über die Höchstschrittweite hinausgehen. Ohne Einfluss bleibt es die reine Regel.
 */
export function ppkDecision(e: EconomyState, stance: GovernorStance, druck = 0): { newRate: number; why: string; target: number } {
  const target = ppkZiel(e, stance);
  const step = clamp((target - e.policyRate) * 0.5, -5, 5) + druck;
  const newRate = Math.max(0, Math.round((e.policyRate + step) * 2) / 2);

  let why: string;
  if (newRate > e.policyRate) why = "Die Inflation liegt deutlich über dem Ziel; der Ausschuss strafft.";
  else if (newRate < e.policyRate && stance === "gefuegig") why = "Der Ausschuss senkt und verweist auf Wachstum und Beschäftigung.";
  else if (newRate < e.policyRate) why = "Die Inflation sinkt; der Ausschuss lockert vorsichtig.";
  else why = "Der Ausschuss hält den Zins und will die Wirkung früherer Entscheidungen abwarten.";
  return { newRate, why, target };
}

export function clamp(x: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, x));
}
