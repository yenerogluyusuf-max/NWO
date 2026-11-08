// Operationsformen eines Krieges nach echten türkischen Vorbildern (Welle 3, K3; krieg.md Schritt 6).
//
// Eine Operationsform ist die erste Entscheidung im Krieg: wie die Türkei kämpft. Sie legt die Einsatzart fest, auf deren Grundwerte die
// Kalibrierung des Schauplatzes (data/schauplaetze.ts EINSATZ und TEMPO, sim/kriegsschauplatz.ts, sim/kriegspreis.ts) rechnet, und gibt darauf
// eigene Faktoren: wie tief sie trägt, wie schnell sie vorankommt, was sie an Leben kostet, was die Welt dazu sagt und wie das Land sie trägt.
// Die Grundwerte bleiben dort; hier stehen nur Faktoren (1 = Grundwert).
//
// Quellen (dokumentation/analyse_2026-11-05/bereiche/recherche_operationen.md, Tabelle „Zahlen fürs Spiel“):
//   - Luftschlag: Klauenschwert (Pençe-Kılıç), 20. bis rund 28.11.2022 (A7). Rund 70 Luftfahrzeuge, 89 Ziele, ein türkischer Gefallener
//     (SOHR), zehn zivile Tote in Syrien, zwei in der Türkei; eine Bodenoperation wurde angedroht, aber nicht ausgeführt. Die USA nannten die
//     Schläge legitime Selbstverteidigung (Kirby). Lira 0,0 %, kein Kriegsabschlag an der Börse.
//   - Begrenzte Bodenoperation: Schutzschild Euphrat (24.08.2016 bis 29.03.2017, 2.015 bis 2.055 km², 71 Gefallene, A1), Olivenzweig
//     (20.01. bis 24.03.2018, rund 2.000 km², 54 Gefallene, A2), Friedensquelle (09. bis 17.10.2019 Kampfphase, 2.419 bis 4.820 km², 12
//     Gefallene, A3). Zone laut Sotschi-Memorandum 32 km tief (A3). Zustimmung zur Operation 71,8 bis 79 %, Sammeleffekt für den Präsidenten
//     0 (KONDA) bis +4 Punkte (MetroPOLL), abklingend in zwei bis drei Monaten (A2, A3).
//   - Mit wem man kämpft: die Syrische Nationalarmee (SNA, vorher FSA) als Stellvertreter, 10.000 bis 12.000 Kämpfer bei Schutzschild Euphrat,
//     rund 14.000 bei Friedensquelle (A1, A3); heute 70.000 bis 90.000 in über 35 Fraktionen (HRW 29.02.2024, recherche_besatzung.md A).
//     Amnesty (02.08.2018) und HRW (29.02.2024) belegen schwere Übergriffe verbündeter Gruppen in Afrin und Ras al-Ain; die Türkei trägt als
//     Besatzer die Verantwortung (EGMR Loizidou, recherche_besatzung.md C).
//   - Großoffensive: kein türkisches Vorbild seit 1974. Die Richtung ist belegt: Je tiefer die Operation, desto härter die Reaktion (Arabische
//     Liga verlangte 2018 den Abzug aus Afrin, 2019 Exportstopps von neun EU-Staaten und US-Sanktionen schon für die 32-km-Zone, A2, A3).
//     Die Faktoren sind Spielparameter.
//   - Landung: Zypern 1974 (B). Atilla I am 20.07.1974, Waffenruhe am 22.07. nach Resolution 353 mit rund 3 % der Insel; Atilla II vom 14. bis
//     16.08. bis 36 bis 37 %. Rund 40.000 Mann; 568 (Çakmak 2008) bis 1.500 türkische Gefallene; 140.000 bis 200.000 vertriebene griechische
//     Zyprer; US-Waffenembargo vom 05.02.1975 bis 1978, also rund dreieinhalb Jahre.
//
// Alle Faktoren sind Spielparameter, wo nicht anders vermerkt: Die Recherche belegt Größenordnung und Richtung (wenige Verluste aus der Luft,
// Dutzende am Boden, Hunderte bei einer Landung), nicht einen Faktor auf die Rechnung des Spiels.

import type { EinsatzArt } from "./schauplaetze";

export type OperationsFormId = "luftschlag" | "begrenzt" | "grossoffensive" | "landung";
/** Wer an der Seite der Türkei am Boden kämpft: niemand (allein) oder die Syrische Nationalarmee (nur in Nordsyrien). */
export type VerbuendeteId = "allein" | "sna";

export interface OperationsForm {
  id: OperationsFormId;
  /** Einsatzart, auf deren Grundwerte gerechnet wird (data/schauplaetze.ts EINSATZ); mit der SNA eine eigene, siehe VERBUENDETE */
  einsatz: EinsatzArt;
  /** Bis zu welcher Tiefe der Regionen die Operation trägt (0 = kein Gelände, 1 = Grenzstreifen, 3 = ganzer Schauplatz) */
  tiefe: 0 | 1 | 2 | 3;
  /** Faktor auf einen eigenen Vorstoß und auf einen Rückschlag der Front */
  vorstoss: number;
  rueckschlag: number;
  /** Faktor auf die eigenen Wochenverluste (aus ihnen rechnet sim/kriegspreis.ts die Gefallenen) */
  verlust: number;
  /** Faktor auf den Abfluss des eigenen Rückhalts je Woche (Wirkung im Inland) */
  uhr: number;
  /** Zusätzlicher Abfluss des gegnerischen Rückhalts je Woche (Druck auf Infrastruktur und Führung) */
  druck: number;
  /** Faktor auf den Weltpreis je Woche (Konflikt mit EU und USA, Ansehen), wenn die Türkei angreift */
  welt: number;
  /** Ansehen in der Welt beim Beginn der Operation */
  ansehen: number;
  /** Zustimmung zu Hause beim Beginn, zusätzlich zur Sammlung um die Flagge (sim/krieg.ts KRIEG.beginnSammlung) */
  sammlung: number;
  /** Politisches Kapital für die Wahl; vor dem Krieg ist die Wahl frei, im Krieg kostet die Umstellung diesen Betrag */
  pk: number;
  /** Mindestens nötige Mobilmachung (0 keine, 1 teilweise) */
  mobil: 0 | 1;
  /** Nur auf diesen Schauplätzen (Landung: Inseln und Zypern) */
  nur?: string[];
  /** Eine Schlagwelle dauert so viele Kriegswochen; danach entscheidet der Präsident, wie es weitergeht (nur Luftschlag) */
  wellenWochen?: number;
}

export const OPERATIONSFORMEN: Record<OperationsFormId, OperationsForm> = {
  // Klauenschwert 2022: eine Woche, ein Gefallener, kein Gelände, keine Sanktionen. Die Verluste trägt die Einsatzart „luft“ des Schauplatzes,
  // die K2 an Klauenschwert kalibriert hat (test/krieg-kalibrierung.test.ts): Faktor 1, sonst zählte das Vorbild doppelt
  luftschlag: {
    id: "luftschlag", einsatz: "luft", tiefe: 0,
    vorstoss: 0, rueckschlag: 0.3, verlust: 1, uhr: 0.6, druck: 1.2, welt: 0.4,
    ansehen: -0.5, sammlung: 0, pk: 4, mobil: 0, wellenWochen: 1,
  },
  // Schutzschild Euphrat, Olivenzweig, Friedensquelle: 2.000 bis 4.820 km², eine Zone von 32 km, Dutzende Gefallene; die Grundwerte des
  // Schauplatzes sind an diesen Operationen ausgerichtet, also Faktor 1. Sammeleffekt: +1 zur allgemeinen Sammlung (+2), zusammen im Band 0 bis +4
  begrenzt: {
    id: "begrenzt", einsatz: "boden", tiefe: 1,
    vorstoss: 1, rueckschlag: 1, verlust: 1, uhr: 1, druck: 0, welt: 1,
    ansehen: -1, sammlung: 1, pk: 6, mobil: 0,
  },
  // Ohne Vorbild seit 1974: tiefer, blutiger, teurer in der Welt (Spielparameter, Richtung aus A2 und A3)
  grossoffensive: {
    id: "grossoffensive", einsatz: "boden", tiefe: 3,
    vorstoss: 1.15, rueckschlag: 1, verlust: 1.6, uhr: 1.4, druck: 0.3, welt: 2,
    ansehen: -3, sammlung: 0, pk: 10, mobil: 1,
  },
  // Zypern 1974: schneller Brückenkopf, Hunderte Gefallene, Resolution 353 am selben Tag, dreieinhalb Jahre US-Waffenembargo. Den Blutzoll
  // des Kampfs um Inseln und Zypern trägt schon der Grundwert des Schauplatzes (sim/kriegsschauplatz.ts SCHAUPLATZ.landung, an Zypern 1974
  // kalibriert): Faktor 1, sonst zählte das Vorbild doppelt
  landung: {
    id: "landung", einsatz: "see", tiefe: 2,
    vorstoss: 1.2, rueckschlag: 1.2, verlust: 1, uhr: 1.2, druck: 0.3, welt: 2.5,
    ansehen: -4, sammlung: 0, pk: 10, mobil: 1, nur: ["aegaeis", "zypern"],
  },
};

export const OPERATIONSFORM_IDS = Object.keys(OPERATIONSFORMEN) as OperationsFormId[];

/**
 * Verbündete am Boden. Die SNA kämpft nur in Nordsyrien und nur mit einer Bodenoperation, und zwar neben dem Heer: So liefen Olivenzweig
 * (rund 2.000 km² in 63 Tagen) und Friedensquelle (2.419 bis 4.820 km² in 9 Tagen, rund 15.000 türkische Soldaten neben rund 14.000 der SNA).
 * Die Einsatzart bleibt deshalb „boden“ mit deren Grundwerten. Die Einsatzart „stellvertreter“ des Schauplatzes steht für Schutzschild Euphrat
 * (Verbündete führen, 4.000 bis 8.000 türkische Soldaten, 65 km² je Woche); als Operationsform mit der SNA machte sie den Grenzstreifen zu einem
 * Krieg von fast zwei Jahren (Nachauftrag K3, 08.11.). Die SNA spart einen Teil der türkischen Verluste, und der Weltpreis steigt, weil die
 * Übergriffe der Fraktionen der Türkei angelastet werden (Amnesty 2018, HRW 2024). Beide Faktoren sind Spielparameter.
 */
export const VERBUENDETE = {
  sna: {
    land: "SYR",
    formen: ["begrenzt", "grossoffensive"] as OperationsFormId[],
    /** Faktor auf die eigenen Verluste (Spielparameter) */
    verlust: 0.6,
    /** Faktor auf den Weltpreis je Woche */
    welt: 1.25,
  },
};

/** Spielparameter der Umstellung im Krieg: Moral der Truppe sinkt, wenn der Befehl wechselt. */
export const OPERATION_WECHSEL = { moral: -1.5, abkuehlungTage: 21 };
