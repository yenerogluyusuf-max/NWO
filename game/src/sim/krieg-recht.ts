// Das Recht des Einsatzes (Welle 3, K1; krieg.md Schritt 1 und Befund B7): Art. 92 der Verfassung, die stehende Rahmenvollmacht der
// Großen Nationalversammlung für Syrien und Irak und die Parlamentsferien, in denen allein der Präsident nach Art. 92 Abs. 2 handeln darf.
//
// Quellen (dokumentation/analyse_2026-11-05/bereiche/recherche_operationen.md, Abschnitt C):
//   - Art. 92 Abs. 1: Die TBMM erklärt den Kriegszustand und erlaubt die Entsendung der Streitkräfte ins Ausland.
//     Art. 92 Abs. 2: „Türkiye Büyük Millet Meclisi tatilde veya ara vermede iken ülkenin ani bir silahlı saldırıya uğraması … halinde
//     Cumhurbaşkanı da, Türk Silahlı Kuvvetlerinin kullanılmasına karar verebilir.“ Nur in Ferien oder Sitzungspause und nur bei einem
//     plötzlichen bewaffneten Angriff entscheidet der Präsident allein. https://www.mevzuat.gov.tr/MevzuatMetin/1.5.2709.pdf
//   - Rahmenvollmacht (tezkere) Syrien und Irak: am 21.10.2025 um drei Jahre ab 30.10.2025 verlängert, also bis 30.10.2028
//     (Milliyet: https://www.milliyet.com.tr/gundem/son-dakika-irak-suriye-tezkeresi-meclisten-gecti-tsknin-gorev-suresi-3-yil-uzatildi-7468544).
//     Der Präsident bestimmt „Umfang, Ort, Stärke und Zeitpunkt“ (Bianet 2023:
//     https://bianet.org/haber/tsk-irak-ve-suriye-topraklarinda-kalmaya-devam-edecek-286495).
//   - Parlamentsferien: Nach Art. 93 der Verfassung und Art. 5 der Geschäftsordnung (İçtüzük) geht die TBMM am 1. Juli in die Ferien und
//     tritt am 1. Oktober wieder zusammen, wenn die Vollversammlung nichts anderes beschließt (2026 beschloss sie am 16. Juni weiterzuarbeiten
//     und ging am 10. August in die Ferien). Medyascope 12.08.2026: https://medyascope.tv/2026/08/12/meclis-tatile-girdi-ekimde-yeniden-toplanacak/ ;
//     NTV: https://www.ntv.com.tr/gundem/meclis-genel-kurulu-tatile-girdi-1736855
//     Das Spiel nimmt die Regel ohne Verlängerung an (1. Juli bis 30. September). Kürzere Sitzungspausen („ara verme“) bildet es nicht ab.
// Welle 4, K7 (krieg.md Schritt 11): Die Vollmacht ist ein Zustand der Partie. Im Oktober des Jahres, in dem sie ausläuft, legt der
// Präsident die Verlängerung vor (sim/ereignisse-mandat.ts), und die Fraktionen stimmen nach ihren belegten Haltungen ab (sim/mandat.ts).
// Verlauf der Wirklichkeit: jährlich 2014 bis 2020, 2021 und 2023 je zwei Jahre, 2025 drei Jahre (recherche_operationen.md C; TBMM-Tutanak
// 21.10.2025). Ältere Spielstände kannten keine Verlängerung. Für sie gilt die Vollmacht als jeweils um drei Jahre verlängert wie 2025, denn
// die Nationalversammlung hat sie seit 2014 jedes Mal verlängert (Spielparameter): Ein Stand vom August 2043 hat sie bis 30.10.2043 und
// entscheidet im Oktober 2043 selbst.

import { t } from "../i18n";
import type { World } from "./types";

export interface Vollmacht {
  id: string;
  laender: string[];
  /** Letzter Tag der Geltung (ISO) */
  bis: string;
  quelle: string;
}

export interface VollmachtAbstimmung {
  datum: string;
  jahre: number;
  ja: number;
  nein: number;
  enthaltung: number;
  angenommen: boolean;
}

export interface VollmachtZustand {
  /** Letzter Tag der Geltung (ISO); liegt er in der Vergangenheit, ist die Vollmacht ausgelaufen */
  bis: string;
  /** Für diese Frist ist entschieden (verlängert, abgelehnt oder auslaufen lassen): keine zweite Vorlage */
  entschieden?: string;
  verlauf: VollmachtAbstimmung[];
}

export const VOLLMACHT_LAENDER = ["SYR", "IRQ"];
/** Am 21.10.2025 um drei Jahre ab 30.10.2025 verlängert (Milliyet 21.10.2025; Tutanak 21.10.2025, Antrag 3/1200) */
export const VOLLMACHT_START = "2028-10-30";
/** Verlängerung älterer Spielstände ohne eigene Entscheidung, in Jahren (wie 2025; Spielparameter) */
export const VOLLMACHT_TAKT = 3;

/** Die Frist, die ein Spielstand ohne eigenen Eintrag hat: 30.10.2028, danach in Schritten von drei Jahren bis zum ersten Termin ab heute. */
export function vollmachtAbgeleitet(datum: string): string {
  let jahr = Number(VOLLMACHT_START.slice(0, 4));
  while (`${jahr}${VOLLMACHT_START.slice(4)}` < datum) jahr += VOLLMACHT_TAKT;
  return `${jahr}${VOLLMACHT_START.slice(4)}`;
}

/** Der Stand der Vollmacht, ohne etwas zu schreiben. */
export function vollmachtStand(w: World): VollmachtZustand {
  return w.spiel?.vollmacht ?? { bis: vollmachtAbgeleitet(w.date), verlauf: [] };
}

/** Schreibt den abgeleiteten Stand fest (im ersten Monat nach dem Laden), damit die Frist nicht mit dem Kalender weiterwandert. */
export function vollmachtFestschreiben(w: World): void {
  if (w.spiel) w.spiel.vollmacht ??= { bis: vollmachtAbgeleitet(w.date), verlauf: [] };
}

/** Verlängert um so viele Jahre ab dem bisherigen Ende (wie die Beschlüsse „30/10/2025 tarihinden itibaren üç yıl“). */
export function vollmachtVerlaengert(bis: string, jahre: number): string {
  return `${Number(bis.slice(0, 4)) + jahre}${bis.slice(4)}`;
}

/** Die geltende Rahmenvollmacht für einen Einsatz gegen dieses Land, sonst undefined. */
export function vollmachtFuer(w: World, landId: string): Vollmacht | undefined {
  if (!VOLLMACHT_LAENDER.includes(landId)) return undefined;
  const s = vollmachtStand(w);
  if (w.date > s.bis) return undefined;
  return { id: "syr_irq", laender: VOLLMACHT_LAENDER, bis: s.bis, quelle: "TBMM" };
}

/** Eine abgelaufene Vollmacht für dieses Land (für den ehrlichen Satz „lief am … aus“). */
export function vollmachtAbgelaufen(w: World, landId: string): Vollmacht | undefined {
  if (!VOLLMACHT_LAENDER.includes(landId)) return undefined;
  const s = vollmachtStand(w);
  if (w.date <= s.bis) return undefined;
  return { id: "syr_irq", laender: VOLLMACHT_LAENDER, bis: s.bis, quelle: "TBMM" };
}

/** Ob die Große Nationalversammlung gerade in den Ferien ist (1. Juli bis 30. September, Art. 93 Verfassung, Art. 5 İçtüzük). */
export function parlamentInFerien(w: World): boolean {
  const monat = Number(w.date.slice(5, 7));
  return monat >= 7 && monat <= 9;
}

/** Der Satz, warum der Präsident gerade nicht allein entscheiden darf (Art. 92 Abs. 2), oder undefined, wenn er es darf. */
export function erlassGrund(w: World, angriff: boolean): string | undefined {
  if (!angriff) return t("nacht_n7.krieg.erlass.art92");
  if (!parlamentInFerien(w)) return t("welle_k1.recht.erlass_sitzung");
  return undefined;
}
