// Zahlen und Wörter für die Wähleransicht (Format der Spielsprache, echtes Minuszeichen).

import { aktuelleLocale, aktuelleSprache, formatiere, t } from "../../i18n";

export const nf = (x: number, d = 1) => x.toLocaleString(aktuelleLocale(), { minimumFractionDigits: d, maximumFractionDigits: d });

/** Vorzeichenzahl: „+3,1“ oder „−3,1“; eine unmerkliche Bewegung heißt „±0“. */
export const vz = (x: number, d = 1) => {
  const r = Math.round(Math.abs(x) * 10 ** d) / 10 ** d;
  return r === 0 ? "±0" : (x >= 0 ? "+" : "−") + nf(r, d);
};

export const prozent = (x: number, d = 0) => formatiere(`{p, prozent, ${d}}`, { p: Math.round(x * 100 * 10 ** d) / 10 ** d }, aktuelleSprache());

const MONATE = ["Jan.", "Feb.", "März", "Apr.", "Mai", "Juni", "Juli", "Aug.", "Sep.", "Okt.", "Nov.", "Dez."];
/** „2028-06“ als „Juni 2028“. */
export function monatText(monat: string): string {
  const [j, m] = monat.split("-");
  if (aktuelleSprache() !== "de") return new Date(Number(j), Number(m) - 1, 15).toLocaleDateString(aktuelleLocale(), { month: "short", year: "numeric" });
  return `${MONATE[Number(m) - 1] ?? m} ${j}`;
}

export function gewichtWort(anteil: number): string {
  if (anteil >= 0.16) return t("wa.gewicht.sehrGross");
  if (anteil >= 0.12) return t("wa.gewicht.gross");
  if (anteil >= 0.09) return t("wa.gewicht.mittel");
  return t("wa.gewicht.klein");
}

/** Manche Größen tragen denselben Namen wie das Problem daraus („Armut“): Probleme bekommen einen Zusatz. */
export const anzeigeName = (name: string, art: string) => (art === "problem" ? t("wa.alsProblem", { name }) : name);
