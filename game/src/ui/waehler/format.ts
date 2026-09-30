// Zahlen und Wörter für die Wähleransicht (deutsches Format, echtes Minuszeichen).

export const nf = (x: number, d = 1) => x.toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d });

/** Vorzeichenzahl: „+3,1“ oder „−3,1“; eine unmerkliche Bewegung heißt „±0“. */
export const vz = (x: number, d = 1) => {
  const r = Math.round(Math.abs(x) * 10 ** d) / 10 ** d;
  return r === 0 ? "±0" : (x >= 0 ? "+" : "−") + nf(r, d);
};

export const prozent = (x: number, d = 0) => `${nf(x * 100, d)} %`;

const MONATE = ["Jan.", "Feb.", "März", "Apr.", "Mai", "Juni", "Juli", "Aug.", "Sep.", "Okt.", "Nov.", "Dez."];
/** „2028-06“ als „Juni 2028“. */
export function monatText(monat: string): string {
  const [j, m] = monat.split("-");
  return `${MONATE[Number(m) - 1] ?? m} ${j}`;
}

export function gewichtWort(anteil: number): string {
  if (anteil >= 0.16) return "sehr großes Gewicht";
  if (anteil >= 0.12) return "großes Gewicht";
  if (anteil >= 0.09) return "mittleres Gewicht";
  return "kleines Gewicht";
}
