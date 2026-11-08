// Reservisten fehlen am Arbeitsmarkt (Welle 4, K7; krieg.md Schritt 11, Befund B5). Vorher kostete eine Mobilmachung nur einmal Geld
// (0,3 bzw. 0,7 % des BIP) und Stimmung; die einberufenen Reservisten arbeiteten weiter.
//
// Quellen:
//   - Reserve der Streitkräfte: rund 380.000 (Wikipedia, Turkish Armed Forces, Infobox; recherche_operationen.md D, deckt sich mit GLM_4).
//   - Erwerbspersonen 2025: 35.533.000 (TÜİK, İşgücü İstatistikleri 2025, berichtet von Alomaliye 25.03.2026:
//     https://www.alomaliye.com/2026/03/25/tuik-2025-isgucu-istatistikleri-issizlik-yuzde-8-3e-geriledi-atil-isgucu-yuzde-29-7ye-yukseldi/).
//   Die volle Reserve sind also 1,07 % der Erwerbspersonen.
// Spielparameter: Eine Teilmobilmachung ruft die Hälfte der Reserve ein. Die Lücke drückt das Potenzialwachstum, solange sie besteht, um ihren
// Anteil an den Erwerbspersonen mal 0,6 (Anteil der Arbeit an der Wertschöpfung, als runder Spielwert). Die Reservisten kommen über die
// Demobilisierung (KRIEG.demobTage) gleichmäßig zurück.

import type { World } from "./types";
import type { KriegVorgang } from "./krieg-typen";

export const RESERVISTEN = {
  /** Reserve der Streitkräfte (Wikipedia-Infobox, recherche_operationen.md D) */
  gesamt: 380_000,
  /** Erwerbspersonen 2025 (TÜİK) */
  erwerbspersonen: 35_533_000,
  /** Anteil der Reserve je Mobilmachungsstufe (keine, teilweise, voll; Spielparameter) */
  stufe: [0, 0.5, 1] as const,
  /** Wachstumspunkte je Prozent fehlender Erwerbspersonen (Spielparameter) */
  wachstumJeProzent: 0.6,
};

/** Mobilmachungsstufe und Stärkefaktor der Stufen (aus sim/krieg.ts übergeben, damit dieses Modul krieg.ts nicht lädt). */
export interface MobilAngabe {
  faktor: number;
  faktoren: readonly number[];
  demobTage: number;
}

/** Reservisten eines Vorgangs heute: aus dem Stand der Mobilmachung (die Stärke wächst über die Tage der Einberufung) oder im Auslauf. */
export function reservistenVon(w: World, k: KriegVorgang, m: MobilAngabe): number {
  const R = RESERVISTEN;
  if (k.phase === "beendet" && (k.demobBis === undefined || w.day >= k.demobBis)) return 0;
  if (k.mobilmachung > 0) {
    // Stärkefaktor auf die Zahl der Einberufenen abbilden: zwischen den Stufen linear
    const [f0, f1, f2] = m.faktoren as [number, number, number];
    const n1 = R.gesamt * R.stufe[1];
    const n2 = R.gesamt * R.stufe[2];
    const f = m.faktor;
    if (f <= f1) return Math.round(Math.max(0, (n1 * (f - f0)) / (f1 - f0)));
    return Math.round(n1 + ((n2 - n1) * Math.min(1, (f - f1) / (f2 - f1))));
  }
  if (k.demobBis !== undefined && w.day < k.demobBis && k.demobVon) return Math.round((k.demobVon * (k.demobBis - w.day)) / m.demobTage);
  return 0;
}

/** Anteil an den Erwerbspersonen in Prozent und der Abzug vom Potenzialwachstum in Punkten. */
export function reservistenLuecke(n: number): { anteil: number; wachstum: number } {
  const anteil = (Math.min(n, RESERVISTEN.gesamt) / RESERVISTEN.erwerbspersonen) * 100;
  return { anteil, wachstum: anteil * RESERVISTEN.wachstumJeProzent };
}
