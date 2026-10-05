// Die Umfrage-Institute mit ihren Haus-Effekten (RECHERCHE_MEDIEN_UMFRAGEN.md, Kapitel B).
// Die Namen der Institute sind erfunden; die realen Vorbilder (KONDA, MetroPOLL, Optimar, GENAR,
// MAK, SONAR, ORC, Gezici, Avrasya, Areda u. a.) stehen nur in den Kommentaren.
// Alle Zahlen sind Spielparameter (Platzhalter der Kalibrierung), kalibriert auf die historischen
// Fehler 2018/2023/2024 (Recherche B.2 und B.4.4) — keine Tatsachenbehauptungen.

export type InstitutsTyp =
  | "neutral_goldstandard"
  | "oppo_codiert"
  | "regierungsnah"
  | "neutral_kommerziell"
  | "oppo_militant"
  | "online_grosspanel";

export type ErhebungsMethode = "F2F" | "CATI" | "F2F_CATI" | "online";

export interface PublikationsRegel {
  /** Publikationswahrscheinlichkeit, wenn das Ergebnis dem eigenen Lager gefällt */
  wennGuenstig: number;
  /** Publikationswahrscheinlichkeit sonst („Schubladen-Umfrage", Recherche B.4.2) */
  wennUnguenstig: number;
}

export interface UmfrageInstitut {
  id: string;
  /** Erfundener, neutraler Spielname */
  name: string;
  typ: InstitutsTyp;
  /**
   * Systematischer Haus-Bias zugunsten des Regierungslagers, in Prozentpunkten
   * (Recherche B.2.6: regierungsnah +1 bis +3, neutral 0, oppositionell −2,5 bis −6).
   */
  hausBias: number;
  /** Bei kommerziellen Häusern: instabiler Haus-Effekt, der von Welle zu Welle springen kann (± pp) */
  hausBiasInstabilitaet?: number;
  /** Streuung der Einzelumfrage (σ): 1,2 bei n>5000, 1,8 bei n≈2500, 2,5 bei Online-Panel (Recherche B.4.1) */
  sigma: number;
  /** Typische Stichprobengröße */
  stichprobe: number;
  methode: ErhebungsMethode;
  /** Wahrscheinlichkeit einer fetten Abweichung (zusätzlicher Offset ±4–9 pp, Recherche B.4.1) */
  fatTailP: number;
  /** false, wenn das Haus seine Stichprobe oft nicht offenlegt (~40 % der Umfragen, Sabancı-Studie 2023) */
  stichprobeTransparent: boolean;
  /** Wer publiziert wann (Recherche B.4.2: Veröffentlichungs-Ökonomie) */
  publikation: PublikationsRegel;
}

export const UMFRAGE_INSTITUTE: UmfrageInstitut[] = [
  {
    // Vorbild: KONDA — galt als „Goldstandard" (F2F, monatlich), historischer Bias −0,7 bis −1;
    // 2023 Ausreißer −5,8 pp auf den Regierungschef (n24, 05/2023).
    id: "anker",
    name: "Anker Stiftungsinstitut",
    typ: "neutral_goldstandard",
    hausBias: -0.8,
    sigma: 1.2,
    stichprobe: 2700,
    methode: "F2F",
    fatTailP: 0.1, // fette Abweichungen möglich trotz guter Methode (KONDA 2023)
    stichprobeTransparent: true,
    publikation: { wennGuenstig: 1, wennUnguenstig: 1 }, // Neutrale publizieren immer — Reputation ist ihr Kapital
  },
  {
    // Vorbild: MetroPOLL — oppositionell wahrgenommen („Türkiye'nin Nabzı", CATI+F2F);
    // 2018: −7,7 pp auf das Regierungsbündnis (Grokipedia/Selvi, C-Quelle).
    id: "kent",
    name: "Kent Meinungsforschung",
    typ: "oppo_codiert",
    hausBias: -3,
    sigma: 1.8,
    stichprobe: 2000,
    methode: "F2F_CATI",
    fatTailP: 0.1,
    stichprobeTransparent: true,
    publikation: { wennGuenstig: 0.9, wennUnguenstig: 0.6 },
  },
  {
    // Vorbild: Optimar/GENAR — regierungsnah, Staatsaufträge (Optimar: 16); punktuell die
    // genauesten Häuser 2023 (Optimar: +0,9 pp; GENAR: +1,9 pp auf den Regierungschef, n24, 05/2023).
    id: "meridyen",
    name: "Meridyen Araştırma",
    typ: "regierungsnah",
    hausBias: 2,
    sigma: 1.5,
    stichprobe: 3000,
    methode: "F2F",
    fatTailP: 0.08,
    stichprobeTransparent: true,
    // Publiziert fast immer, wenn das Regierungslager mindestens den wahren Wert −1 erreicht, sonst oft Schublade
    publikation: { wennGuenstig: 0.95, wennUnguenstig: 0.4 },
  },
  {
    // Vorbild: MAK/SONAR/AREA/ORC — neutral-kommerziell, instabiler Haus-Effekt
    // (ORC sprang 2017: +4 Regierung → 2023: +6,8 Opposition; Recherche B.2.6).
    id: "denge",
    name: "Denge Araştırma",
    typ: "neutral_kommerziell",
    hausBias: 0,
    hausBiasInstabilitaet: 1.5,
    sigma: 2,
    stichprobe: 3500,
    methode: "F2F",
    fatTailP: 0.12,
    stichprobeTransparent: true,
    publikation: { wennGuenstig: 1, wennUnguenstig: 1 },
  },
  {
    // Vorbild: Gezici/Avrasya — offen oppositionell; 2023: −3,6 bis −5,9 pp auf den Regierungschef;
    // meldete in 12 Fällen keine Stichprobengröße (Sabancı-Studie 2023).
    id: "yoruk",
    name: "Yörük Saha",
    typ: "oppo_militant",
    hausBias: -5,
    sigma: 2.2,
    stichprobe: 2400,
    methode: "CATI",
    fatTailP: 0.15,
    stichprobeTransparent: false,
    // Publiziert fast immer, wenn die Opposition vorn liegt
    publikation: { wennGuenstig: 0.9, wennUnguenstig: 0.6 },
  },
  {
    // Vorbild: Areda — riesige Online-Panels (bis n=25.000), Qualität umstritten [unverifiziert];
    // 2023: +1,8 pp auf den Regierungschef (n24, 05/2023).
    id: "ekran",
    name: "Ekran Onlinepanel",
    typ: "online_grosspanel",
    hausBias: 1.5,
    sigma: 2.5,
    stichprobe: 15000,
    methode: "online",
    fatTailP: 0.15,
    stichprobeTransparent: true,
    publikation: { wennGuenstig: 0.9, wennUnguenstig: 0.7 },
  },
];

/**
 * Der Fehler-Generator (Recherche B.4.1 und B.4.4): was zusätzlich zum Haus-Bias auf eine Prognose wirkt.
 * Alle Zahlen sind Spielparameter (Platzhalter der Kalibrierung).
 */
export const FEHLER_GENERATOR = {
  /**
   * Angstklima: Bei hohem Repressionslevel verweigern Regierungswähler die Antwort stärker
   * (~75 % der Verweigerer; Özkiraz-Eigenaussage via Grokipedia, C) → das Regierungslager
   * wird unterschätzt. Kann in mutigen Phasen (2024-Muster) ins Plus kippen.
   */
  angstklimaModifikator: { mittelAb: 40, hochAb: 75, mittel: -1, hoch: -2.5 },
  /** Umfrage vor einem Großereignis: veraltet um 1–4 pp (Recherche B.3, Punkt 7) */
  eventLagPp: { min: 1, max: 4 },
  /** p=0,10 je Umfrage: zusätzlicher Offset 4–9 pp, zu 70 % gegen das Regierungslager (KONDA 2023: −5,8; AKAM/REMRES 2018: −8/−9) */
  fatTail: { p: 0.1, offsetPp: { min: 4, max: 9 }, gegenRegierungP: 0.7 },
  /** σ ohne Institutsangabe (Baseline n≈2.500) */
  sigmaBasis: 1.8,
  /** Präferenz ≠ Stimmabgabe: separates Turnout-Modul je Lager (2024: Beteiligung −6,6 pp, alle Prognosen daneben) */
  turnoutModulPp: { min: -3, max: 3 },
  /** Diaspora ist in keiner Inlands-Umfrage enthalten → strukturelle Unterschätzung des Regierungslagers bei nationalen Wahlen */
  diasporaOffsetRegierungPp: 1.5,
  /** Gesetzliches Publikationsverbot für Umfragen vor dem Wahltag (Wahlgesetz) */
  publikationsverbotTage: 10,
} as const;

export function umfrageInstitut(id: string): UmfrageInstitut | undefined {
  return UMFRAGE_INSTITUTE.find((i) => i.id === id);
}
