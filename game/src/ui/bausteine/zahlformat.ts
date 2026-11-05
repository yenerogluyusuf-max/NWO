// Eine Formatierung für alle Ansichten (PLAN_OBERFLAECHE_DETAIL Teil 1, Q3): Indizes ganzzahlig, Geld in Mrd. oder Bio. Lira mit
// einer Stelle, Anteile in Prozent. Werte unter einer halben Einheit zeigen „0“ ohne Vorzeichen (kein „−0“).

import { t, zahl } from "../../i18n";

/** Ein Index (0 bis 100 und ähnliche Größen): immer ganzzahlig. */
export const index = (x: number): string => zahl(Math.round(x) === 0 ? 0 : Math.round(x), 0);

/** Geld in Milliarden Lira: ab 1.000 Mrd. als Billionen, jeweils mit einer Stelle. */
export const geld = (mrd: number): string =>
  Math.abs(mrd) >= 1000 ? t("bs.bio", { n: zahl(mrd / 1000, 1) }) : t("bs.mrd", { n: zahl(Math.abs(mrd) < 0.05 ? 0 : mrd, Math.abs(mrd) >= 100 ? 0 : 1) });

/** Ein Anteil in Prozent; `stellen` nur für Größen, die wirklich Nachkommastellen brauchen (Inflation, Defizit). */
export const anteil = (x: number, stellen = 0): string => t("bs.prozent", { n: zahl(Math.abs(x) < 0.5 * 10 ** -stellen ? 0 : x, stellen) });

/** Eine Änderung mit Vorzeichen (+3, −2); null ohne Vorzeichen. */
export const delta = (x: number, stellen = 0): string => {
  const r = Number(x.toFixed(stellen));
  if (r === 0) return zahl(0, stellen);
  return `${r > 0 ? "+" : "−"}${zahl(Math.abs(r), stellen)}`;
};
