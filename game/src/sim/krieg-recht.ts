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
// Die Verlängerung der Vollmacht im Oktober (Abstimmung, Lager) baut krieg.md Schritt 11; bis dahin läuft sie am 30.10.2028 aus.

import { t } from "../i18n";
import type { World } from "./types";

export interface Vollmacht {
  id: string;
  laender: string[];
  /** Letzter Tag der Geltung (ISO) */
  bis: string;
  quelle: string;
}

export const VOLLMACHTEN: Vollmacht[] = [
  { id: "syr_irq", laender: ["SYR", "IRQ"], bis: "2028-10-30", quelle: "TBMM-Beschluss vom 21.10.2025, drei Jahre ab 30.10.2025 (Milliyet)" },
];

/** Die geltende Rahmenvollmacht für einen Einsatz gegen dieses Land, sonst undefined. */
export function vollmachtFuer(w: World, landId: string): Vollmacht | undefined {
  return VOLLMACHTEN.find((v) => v.laender.includes(landId) && w.date <= v.bis);
}

/** Eine abgelaufene Vollmacht für dieses Land (für den ehrlichen Satz „lief am … aus“). */
export function vollmachtAbgelaufen(w: World, landId: string): Vollmacht | undefined {
  return VOLLMACHTEN.find((v) => v.laender.includes(landId) && w.date > v.bis);
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
