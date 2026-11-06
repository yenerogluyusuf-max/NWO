import { schuldenMonatsrechnung, type SchuldenRechnung } from "./staatsgeld";
// Wirtschaftsregeln nach WIRTSCHAFTSMODELL.md (Z1 bis Z9).
// Alle Parameter sind Platzhalter für die Kalibrierung, keine Messwerte.

import type { EconomyState, GovernorStance, MonthlySnapshot } from "./types";
import type { Rng } from "./rng";
import { t } from "../i18n";

export const PARAMS = {
  /** Neutraler Realzins in % */
  neutralRealRate: 3,
  /** Ausländische Inflation in % (für den Inflationsabstand beim Wechselkurs) */
  foreignInflation: 2.5,
  /** Z1: Wirkung des Realzinses auf die Auslastung (je Prozentpunkt, pro Monat) */
  rateOnGap: 0.02,
  /**
   * Z1: Sättigung des Zinskanals (Prozentpunkte Realzins): Bei extremen Realzinsen
   * (2021–2023: ex ante −30 bis −50) ist die Transmission über den Kreditkanal begrenzt
   * (KKM, Finanzrepression, staatliche Kreditgarantien). Kalibrierung WIR-1: Ohne Deckel
   * erzeugt der negative Realzins von 2022 einen Dauerstimulus von über +2 Punkten/Monat.
   */
  rateTransmissionCap: 15,
  /** Z1: Verzögerung in Monaten */
  rateLagMonths: 6,
  /**
   * Z1 (Spielparameter): Ein Schock im Risikoaufschlag verteuert Kredite für Firmen und Haushalte wie ein höherer Zins.
   * Übertragung 1:1 über denselben Zinskanal (rateOnGap). Gemessen wird gegen einen Anker, der dem Aufschlag mit 3 % je Monat folgt
   * (rund drei Jahre): Ein dauerhaft hoher Aufschlag ist eingepreist, ein plötzlicher (Krieg, Sanktion) bremst. Ohne diesen Kanal
   * wuchs die Wirtschaft im Krieg, obwohl der Aufschlag um 300 Basispunkte stieg (PRUEFUNG_GESAMT_2026-11-04).
   */
  riskOnRate: 1,
  /**
   * Z1/Z2 (Spielparameter): Fehlende Energie bremst die Produktion und treibt die Preise. Je Prozentpunkt Mangel (Öl und Gas)
   * −0,02 Auslastung im Monat und +0,15 Prozentpunkte im Inflationsanker. Ohne Beleg für einen Mangel dieser Größe in der Türkei
   * gewählt, damit ein jahrelanger Engpass sichtbar schadet (früher sank die Inflation dabei sogar leicht).
   */
  mangelAufGap: 0.02,
  mangelAufInflation: 0.15,
  /**
   * Welle H5 (Spielparameter): Ein dauerhafter Kostenstand hebt das Preisniveau einmal, nicht jeden Monat neu. Kostendruck des Netzes
   * (sim/world.ts) und Energiemangel wirken darum gegen einen Bezugswert, der ihnen mit diesem Anteil je Monat nachzieht: Halbwertszeit
   * etwa 6,6 Monate, nach zwei Jahren ist ein Schock zu 92 % in den Preisen. Vorher zählte der Abstand zum Start, und ein dauerhaft
   * hoher Stand trieb die Inflation ohne Ende (Spielstand des Inhabers, 2039).
   */
  preisAnpassung: 0.1,
  riskAnkerTempo: 0.03,
  /** Persistenz der Auslastung pro Monat */
  gapPersistence: 0.92,
  /** Z6: Wirkung zusätzlicher Staatsausgaben (% BIP) auf die Auslastung */
  fiscalOnGap: 0.1,
  /** Z2: Wirkung der Auslastung auf die Inflation */
  gapOnInflation: 0.5,
  /** Z5: Weitergabe einer übermäßigen Abwertung an die Inflation */
  fxPassThrough: 0.37,
  /** Anpassungsgeschwindigkeit der Inflation pro Monat */
  inflationSpeed: 0.22,
  /** Z3: Anpassungsgeschwindigkeit der Erwartungen pro Monat */
  expectationSpeed: 0.3,
  /** Z9: Okun-Koeffizient (monatlich) */
  okun: 0.07,
  /** Natürliche Arbeitslosenquote in % */
  naturalUnemployment: 9.4,
  /** Z4: Wirkung des Realzinses auf die Abwertung (% p. a. je Prozentpunkt) */
  carryOnFx: 1.0,
  /** Tägliche Schwankung des Wechselkurses (Standardabweichung, Anteil) */
  fxNoise: 0.0015,
  /** Langfristiges Inflationsziel der Zentralbank in % */
  longRunTarget: 5,
  /** Monatliche Annäherung der Zwischenziele an das langfristige Ziel (ergibt etwa 24, 15, 9, 5) */
  targetGlide: 0.04,
  /** Zusätzlicher laufender Finanzierungsbedarf aus Reformen und Haushalt nach Gegenfinanzierung.
   * Spielparameter: 130 Basispunkte je BIP-Punkt oberhalb von 2. Der Grundhaushalt
   * und Zinslasten werden nicht erneut als zusätzlicher Impuls angerechnet. */
  politiklastAufRisiko: 130,
  // WIR-2 (sim/devisen.ts): Bestands-Komponenten der Devisen-Lage. Alle vier wirken nur, wenn die
  // Devisen-Felder des EconomyState gefüllt sind; Lernfall-Replays (ohne Felder) bleiben unverändert.
  /**
   * Z7: Anteil der Schulden in Fremdwährung oder indexiert (Spielparameter, Größenordnung Türkei ~40–50 %).
   * Dieser Teil schmilzt nicht mit der Inflation, sondern folgt dem Wechselkurs — adressiert die
   * dokumentierte Modellgrenze „FX-Bewertung der Schuldenquote“ (KALIBRIERUNG_LOG §6.1).
   */
  fxSchuldAnteil: 0.4,
  /**
   * Z4: Abwertungsdruck bei leeren Reserven, Prozentpunkte Jahresdrift bei vollem Reserven-Druck (0–1).
   * Märkte testen eine Zentralbank ohne Pulver (KALIBRIERUNG_LOG §6.4: fehlende Bestände im Kurs).
   */
  fxReservenDruckMax: 12,
  /**
   * Z8: CDS-Zuschlag bei leeren Reserven, Basispunkte bei vollem Reserven-Druck (0–1)
   * (KALIBRIERUNG_LOG §6.5: Märkte preisen den Reservenbestand, nicht nur Niveaus).
   */
  cdsReservenDruckMax: 150,
  /** Täglicher Verbrauch des Interventions-Puffers (fxPuffer) als Kursstütze (Anteil je Tag) */
  interventionsPufferProTag: 0.0005,
  // Runde „Netz atmet“ (Spielparameter; wirken nur mit Politiknetz, sonst sind die Felder leer und die Terme 0):
  /** Auslastung (Prozentpunkte je Monat) je Indexpunkt Abweichung des Sektorenindex (Industrie, Export, Mittelstand, Investitionen, Bau, Tourismus) */
  sektorAufAuslastung: 0.012,
  /**
   * Welle H5 (Spielparameter): Die Branchen wirken über ihre Veränderung auf die Auslastung, gemessen an einem Anker, der dem Sektorenindex
   * mit diesem Anteil je Monat folgt (wie `riskAnker`). Eine dauerhaft starke Industrie ist mehr Angebot und mehr Nachfrage zugleich, keine
   * Überhitzung ohne Ende. Vorher schob ein Index von +28 (Spielstand 2039) die Auslastung jeden Monat um 0,34 Punkte, so viel wie
   * 17 Punkte Realzins zurücknehmen; 9 % Realzins konnten die Wirtschaft darum kaum abkühlen.
   */
  sektorAnpassung: 0.1,
  /** Halbe Staatsquoten-Elastizität: Entlastung des Haushalts in % des BIP je Prozentpunkt Überauslastung (automatische Stabilisatoren) */
  stabilisatoren: 0.3,
  /** Entlastung des Haushalts in % des BIP je Indexpunkt, den die Steuereinnahmen im Netz über dem Start liegen */
  steuerbasisAufHaushalt: 0.03,
  // Welle H5 (Spielparameter): Glaubwürdigkeit wächst bei anhaltend straffer Politik (Z3, `glaubwuerdigkeitsZuwachs`).
  /** Monate, über die die Bank straff sein muss und über die der Trend der Inflation gemessen wird */
  glaubFenster: 6,
  /** Höchster Zuwachs je Monat bei voller Glaubwürdigkeitslücke; er schrumpft mit (1 − Glaubwürdigkeit) */
  glaubZuwachs: 0.015,
  /** Prozentpunkte Realzins über dem neutralen, ab denen der Zuwachs voll ist (darunter anteilig, am neutralen null) */
  glaubStraffSpanne: 5,
  /**
   * Anteil des Zuwachses, wenn die Bank straff bleibt, die Inflation aber noch nicht fällt. Lernfall 2023 (scripts/lernfaelle.ts, 03/2024):
   * Die gelieferte Straffung stabilisierte die Erwartungen, obwohl die Inflation bis Mai 2024 auf 75 % stieg (TÜİK). Vorher war der Zuwachs
   * dann null, und ein Abwertungsschub hielt die Glaubwürdigkeit ein ganzes Jahr fest. Spielparameter.
   */
  glaubOhneTrend: 0.5,
} as const;

/** Wirkung der Außenwelt (Indizes, Start = 100). Platzhalter der Kalibrierung. */
export const AUSSEN = {
  /** Prozentpunkte Inflation je Indexpunkt Energiepreis über 100 (Energieimporte) */
  oelAufInflation: 0.03,
  /** Auslastung (Prozentpunkte je Monat) je Indexpunkt Energiepreis */
  oelAufAuslastung: 0.004,
  /** Auslastung (Prozentpunkte je Monat) je Indexpunkt EU-Nachfrage */
  euAufAuslastung: 0.012,
  /** Basispunkte Risikoaufschlag je Indexpunkt Weltzins über 100 */
  weltzinsAufRisiko: 2,
} as const;

/** Potenzialwachstum einschließlich der Wirkung des Politiknetzes. */
export function potential(e: EconomyState): number {
  return e.potentialGrowth + e.potentialShift;
}

/** Realzins in Prozentpunkten. */
export function realRate(e: EconomyState): number {
  return e.policyRate - e.expectedInflation;
}

/** Zusätzlicher laufender Primärbedarf: Reformkosten plus beschlossene Etat-/Steueränderungen.
 * Zinsen und konjunkturelle Stabilisatoren werden nicht nochmals als neue Ausgabenpolitik bestraft. */
export const finanzierungsMehrbedarf = (e: EconomyState): number => e.policyCost + e.fiscalImpulse;

/**
 * Welle H5: der Teil des Mehrbedarfs, den nichts gegenfinanziert. Steuererhöhungen sind schon abgezogen (Steuermaßnahmen buchen in
 * `policyCost` negative Kosten, Einnahmeposten im Haushalt einen negativen `fiscalImpulse`). Mit dem Lira-Etat (Welle H1) kommt die dauerhaft
 * breitere oder schmalere Steuerbasis dazu (Steuermoral, Schattenwirtschaft, Verwaltung: `konjunkturSaldo`, ohne Sätze und Konjunktur).
 * Ohne Lira-Etat enthält der Saldo noch den Konjunkturteil; ein Boom deckt keine Dauerausgaben, darum zählt er dort nicht.
 */
export const ungedeckterMehrbedarf = (e: EconomyState): number => finanzierungsMehrbedarf(e) - (e.etat ? (e.konjunkturSaldo ?? 0) : 0);

/**
 * Z3 (Welle H5): Zuwachs der Glaubwürdigkeit in diesem Monat. Sie wächst, wenn die Bank über `glaubFenster` Monate durchgehend über dem
 * neutralen Realzins liegt und die Inflation im Trend fällt (unter dem Stand vor `glaubFenster` Monaten) oder unter der Erwartung liegt.
 * Ein einzelner Monat genügt nicht mehr: Vorher reichte ein Monat mit sinkender Inflation, und das Rauschen von ±0,3 Punkten machte den
 * Zuwachs zum Münzwurf. Der Zuwachs steigt mit der Straffheit bis `glaubStraffSpanne` über neutral und schrumpft, je glaubwürdiger die Bank
 * schon ist. `history` endet mit dem Vormonat.
 */
export function glaubwuerdigkeitsZuwachs(e: EconomyState, history: MonthlySnapshot[]): number {
  return glaubwuerdigkeitsLage(e, history).zuwachs;
}

/** Schwelle des ungedeckten Mehrbedarfs in % des BIP, ab der die Glaubwürdigkeit sinkt (ZEI-4, Spielparameter) */
export const MEHRBEDARF_SCHWELLE = 1.75;

/**
 * Z3: Abzug von der Glaubwürdigkeit in diesem Monat. Negativer Realzins kostet 0,012. ZEI-4: Ungedeckter laufender Mehrbedarf schwächt
 * sie auch bei straffer Bank, 0,045 je BIP-Punkt über der Schwelle (höchstens 2,5 Punkte). Gegenfinanzierung zählt, bloße Ausgabenziele
 * nicht (`ungedeckterMehrbedarf`). Spielparameter.
 */
export function glaubwuerdigkeitsAbzug(e: EconomyState): { realzins: number; mehrbedarf: number } {
  const ungedeckt = ungedeckterMehrbedarf(e);
  return {
    realzins: realRate(e) < 0 ? 0.012 : 0,
    mehrbedarf: ungedeckt > MEHRBEDARF_SCHWELLE ? 0.045 * Math.min(2.5, ungedeckt - MEHRBEDARF_SCHWELLE) : 0,
  };
}

/** Die Rechnung hinter `glaubwuerdigkeitsZuwachs`, für die Erklärung in der Oberfläche (dieselben Zahlen, die gebucht werden). */
export interface GlaubwuerdigkeitsLage {
  /** Zuwachs dieses Monats (0 bis 1) */
  zuwachs: number;
  /** Wie viele der letzten `glaubFenster` Monate (der laufende eingeschlossen) der Realzins über dem neutralen lag */
  straffMonate: number;
  /** Mittlerer Realzins über das Fenster in % */
  mittelReal: number;
  /** Inflation vor `glaubFenster` Monaten (fehlt ohne Vorgeschichte) */
  inflationVorher?: number;
  /** Ob die Inflation im Trend fällt oder unter der Erwartung liegt */
  inflationGut: boolean;
}

export function glaubwuerdigkeitsLage(e: EconomyState, history: MonthlySnapshot[]): GlaubwuerdigkeitsLage {
  const n = PARAMS.glaubFenster;
  const realzinsen = [...history.slice(-(n - 1)).map((h) => h.realRate), realRate(e)];
  const straffMonate = realzinsen.filter((x) => x > PARAMS.neutralRealRate).length;
  const mittelReal = realzinsen.reduce((a, b) => a + b, 0) / realzinsen.length;
  const inflationVorher = history.length >= n ? history[history.length - n]!.inflation : undefined;
  const inflationGut = (inflationVorher !== undefined && e.inflation < inflationVorher) || e.inflation < e.expectedInflation;
  const straff = clamp((mittelReal - PARAMS.neutralRealRate) / PARAMS.glaubStraffSpanne, 0, 1);
  const zuwachs = history.length >= n && straffMonate === n ? PARAMS.glaubZuwachs * straff * (1 - e.credibility) * (inflationGut ? 1 : PARAMS.glaubOhneTrend) : 0;
  return { zuwachs, straffMonate, mittelReal, ...(inflationVorher !== undefined ? { inflationVorher } : {}), inflationGut };
}

const sektorBezug = (e: EconomyState): number => (Number.isFinite(e.sektorAnker) ? e.sektorAnker! : 0);

/** Z1 (Welle H5): Wirkung der Branchen auf die Auslastung in Punkten je Monat, gemessen am Anker (0 ohne Politiknetz). */
export function sektorSchub(e: EconomyState): number {
  return e.sektorIndex === undefined ? 0 : PARAMS.sektorAufAuslastung * (e.sektorIndex - sektorBezug(e));
}

const mangelBezug = (e: EconomyState): number => (Number.isFinite(e.mangelRef) ? e.mangelRef! : 0);

/** Z2 (Welle H5): Preisschub aus fehlender Energie in Prozentpunkten, gemessen am Bezugswert, an den sich die Preise schon angepasst haben. */
export function mangelSchub(e: EconomyState): number {
  return e.energieMangel === undefined ? 0 : PARAMS.mangelAufInflation * 100 * (e.energieMangel - mangelBezug(e));
}

/** Z4: tägliche Veränderung des Wechselkurses (Anteil, z. B. 0,001 = 0,1 %). */
export function dailyDepreciation(e: EconomyState, rng: Rng): number {
  // Kapitalströme preisen die erwartete Inflationsdifferenz, nicht den rückblickenden
  // Spot-Druck (Kalibrierung WIR-1: mit Spot-Inflation lief der Kurs im Hochinflations-
  // regime 2023/2024 um das Dreifache zu schnell).
  const inflationGap = e.expectedInflation - PARAMS.foreignInflation;
  const carry = PARAMS.carryOnFx * (realRate(e) - PARAMS.neutralRealRate);
  const risk = (e.riskPremium - 250) / 100;
  // WIR-2: Leere Reserven laden zum Testen der Zentralbank ein (0, wenn keine Devisen-Lage geführt wird).
  const reserven = PARAMS.fxReservenDruckMax * (e.reservenDruck ?? 0);
  const annual = inflationGap - carry + risk + reserven;
  const noise = rng.normal(PARAMS.fxNoise * (1.5 - e.credibility));
  // WIR-2: Deviseninterventionen glätten den Kurs, bis der Puffer verbraucht ist (verbraucht sich täglich).
  const stuetze = Math.min(e.fxPuffer ?? 0, PARAMS.interventionsPufferProTag);
  if (stuetze > 0) e.fxPuffer = (e.fxPuffer ?? 0) - stuetze;
  return annual / 100 / 365 + noise - stuetze;
}

/** Z8: täglicher Risikoaufschlag, zieht zum fundamentalen Wert. */
export function dailyRiskPremium(e: EconomyState, rng: Rng): number {
  // Die Märkte bepreisen die erwartete Inflation (vorausschauend), nicht den aktuellen
  // Druck (Kalibrierung WIR-1: mit Spot-Inflation hing der CDS 2024 um ~130 bp zu hoch,
  // während die Märkte den Dezinflationspfad bereits einpreisten; Koeffizient 3 → 2,5).
  const fundamental =
    150 +
    2.5 * Math.max(0, e.expectedInflation - 10) +
    2 * Math.max(0, e.debtRatio - 40) +
    200 * (1 - e.credibility) +
    // ZEI-4 (Spielparameter): Wer dauerhaft über die Verhältnisse ausgibt, zahlt einen Nachhaltigkeitsaufschlag,
    // auch wenn die Schuldenquote (Z7) bei hoher Inflation kaum steigt — die Märkte sehen die Politiklast.
    PARAMS.politiklastAufRisiko * Math.max(0, ungedeckterMehrbedarf(e) - 2) +
    // WIR-2: Die Märkte preisen den Reservenbestand (0, wenn keine Devisen-Lage geführt wird;
    // adressiert KALIBRIERUNG_LOG §6.5 — der CDS hing 2024 strukturell zu hoch, weil Z8 keine Bestände kannte).
    PARAMS.cdsReservenDruckMax * (e.reservenDruck ?? 0) +
    AUSSEN.weltzinsAufRisiko * ((e.weltzins ?? 100) - 100) +
    // Runde „Netz atmet“: Politische Schocks (klingen ab) und die Lage der Institutionen preisen die Märkte ein (0 ohne Netz)
    (e.politikRisiko ?? 0) +
    (e.institutionenRisiko ?? 0) +
    // Laufende Sanktionen (sim/diplomatie.ts SANKTION_LAST)
    (e.sanktionsLast?.risiko ?? 0);
  return e.riskPremium + 0.02 * (fundamental - e.riskPremium) + rng.normal(2);
}

/** Monatliche Fortschreibung der Realwirtschaft (Z1, Z2, Z3, Z5, Z6, Z7, Z9). */
export function monthlyUpdate(e: EconomyState, history: MonthlySnapshot[], rng: Rng): SchuldenRechnung {
  const lagged = history[history.length - PARAMS.rateLagMonths];
  // Ein Schock im Risikoaufschlag wirkt wie ein höherer Realzins und läuft durch denselben Deckel: Liegt der Realzins tief unter
  // dem Deckel (2021/22: rund −50 %, Kredit über Staatsbanken), verpufft er, und der Boom läuft trotz CDS über 600 weiter (Lernfall 2021).
  const risikoSchock = PARAMS.riskOnRate * Math.max(0, (e.riskPremium - (e.riskAnker ?? e.riskPremium)) / 100);
  const laggedRealRate = clamp((lagged ? lagged.realRate : realRate(e)) + risikoSchock, -PARAMS.rateTransmissionCap, PARAMS.rateTransmissionCap);

  // Z1 und Z6: Nachfrage und Auslastung
  e.outputGap =
    PARAMS.gapPersistence * e.outputGap -
    PARAMS.rateOnGap * (laggedRealRate - PARAMS.neutralRealRate) +
    PARAMS.fiscalOnGap * (e.fiscalImpulse + e.policyCost) -
    PARAMS.mangelAufGap * 100 * (e.energieMangel ?? 0) +
    AUSSEN.euAufAuslastung * ((e.euNachfrage ?? 100) - 100 - (e.sanktionsLast?.nachfrage ?? 0)) -
    AUSSEN.oelAufAuslastung * ((e.oel ?? 100) - 100) * (e.energieFaktor ?? 1) +
    // Runde „Netz atmet“: Die Realwirtschaft der Branchen wirkt auf die Auslastung (0 ohne Netz)
    sektorSchub(e) +
    rng.normal(0.25);

  // Welle H5: Der Anker der Branchen zieht nach (ältere Spielstände beginnen bei 0, dem Stand beim Amtsantritt)
  if (e.sektorIndex !== undefined) e.sektorAnker = sektorBezug(e) + PARAMS.sektorAnpassung * (e.sektorIndex - sektorBezug(e));

  // Der Anker der Finanzierungsbedingungen passt sich langsam an (ältere Spielstände: Start beim heutigen Aufschlag)
  e.riskAnker = (e.riskAnker ?? e.riskPremium) + PARAMS.riskAnkerTempo * (e.riskPremium - (e.riskAnker ?? e.riskPremium));

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
    mangelSchub(e) +
    AUSSEN.oelAufInflation * ((e.oel ?? 100) - 100) * (e.energieFaktor ?? 1);
  e.inflation += PARAMS.inflationSpeed * (anchor - e.inflation) + rng.normal(0.3);
  e.inflation = Math.max(-2, e.inflation);
  // Welle H5: Der Bezugswert des Energiemangels zieht nach (ältere Spielstände beginnen bei 0, dem Stand beim Amtsantritt)
  if (e.energieMangel !== undefined) e.mangelRef = mangelBezug(e) + PARAMS.preisAnpassung * (e.energieMangel - mangelBezug(e));

  // Die Zentralbank senkt ihre Zwischenziele schrittweise zum langfristigen Ziel
  e.inflationTarget += PARAMS.targetGlide * (PARAMS.longRunTarget - e.inflationTarget);

  // Z3: Erwartungen zwischen Ziel und aktueller Inflation, gewichtet nach Glaubwürdigkeit
  const credibleAnchor = e.credibility * e.inflationTarget + (1 - e.credibility) * e.inflation;
  e.expectedInflation += PARAMS.expectationSpeed * (credibleAnchor - e.expectedInflation);

  // Z3: Glaubwürdigkeit wächst langsam bei anhaltend straffer Politik (Welle H5) und fällt schnell bei negativem Realzins
  // oder ungedecktem Mehrbedarf (`glaubwuerdigkeitsAbzug`)
  const abzug = glaubwuerdigkeitsAbzug(e);
  e.credibility += glaubwuerdigkeitsZuwachs(e, history) - abzug.realzins - abzug.mehrbedarf;
  e.credibility = clamp(e.credibility, 0.05, 0.95);

  // Wachstum zum Vorjahr aus der Veränderung der Auslastung
  const gapYearAgo = yearAgo ? yearAgo.outputGap : e.outputGap;
  e.growth = potential(e) + (e.outputGap - gapYearAgo);

  // Z9: Arbeitslosigkeit folgt dem Wachstum
  e.unemployment +=
    0.03 * (PARAMS.naturalUnemployment + (e.arbeitsmarktShift ?? 0) - e.unemployment) -
    PARAMS.okun * (e.growth - potential(e));
  e.unemployment = clamp(e.unemployment, 3, 30);

  // Z7: Gesamtdefizit und FX-Bewertung verändern den Bestand. Wachstum/Preise ändern
  // nur den Nenner; derselbe aufgezinst berechnete Monatsfaktor gilt in staatsgeldMonat.
  const rechnung = schuldenMonatsrechnung(e, history.at(-1)?.usdTry, PARAMS.fxSchuldAnteil);
  e.debtRatio = rechnung.nachherQuote;
  e.kassenbestandMrd = rechnung.kasseNachherMrd;
  return rechnung;
}

/** Gewichte der Reaktionsregel je Haltung der Führung. */
export const PPK_GEWICHTE: Record<GovernorStance, { infl: number; gap: number; bias: number }> = {
  vorsichtig: { infl: 0.5, gap: 0.2, bias: 0 },
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
 * fünf Punkte je Sitzung im Normalfall. Bei stark negativem Realzins kann eine regelgebundene Führung
 * bis zu 12,5 Punkte aufholen. Senkungen bleiben auf fünf Punkte begrenzt. Spielparameter, keine Prognose realer Banken.
 * `druck` ist die Verschiebung des Beschlusses in Prozentpunkten durch politischen Einfluss (Zentralbank-Modul);
 * er kommt zur Regel hinzu und darf über die Höchstschrittweite hinausgehen. Ohne Einfluss bleibt es die reine Regel.
 */
export function ppkDecision(e: EconomyState, stance: GovernorStance, druck = 0): { newRate: number; why: string; target: number } {
  const target = ppkZiel(e, stance);
  const step = clamp((target - e.policyRate) * 0.5, -5, ppkSchrittweite(e, stance)) + druck;
  const newRate = Math.max(0, Math.round((e.policyRate + step) * 2) / 2);

  let why: string;
  if (newRate > e.policyRate) why = t("sim2.sim.economy.0fbefd3");
  else if (newRate < e.policyRate && stance === "gefuegig") why = t("sim2.sim.economy.a06609f");
  else if (newRate < e.policyRate) why = t("sim2.sim.economy.484e1fd");
  else why = t("sim2.sim.economy.9401f8e");
  return { newRate, why, target };
}

/** Aufholen einer stark hinter den Erwartungen liegenden Verzinsung; kein sprunghafter Inflationsschwellenwert. */
export function ppkSchrittweite(e: EconomyState, stance: GovernorStance): number {
  return stance === "gefuegig" ? 5 : 5 + Math.round(clamp((-realRate(e) - 15) / 3, 0, 7.5) * 2) / 2;
}

export function clamp(x: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, x));
}
