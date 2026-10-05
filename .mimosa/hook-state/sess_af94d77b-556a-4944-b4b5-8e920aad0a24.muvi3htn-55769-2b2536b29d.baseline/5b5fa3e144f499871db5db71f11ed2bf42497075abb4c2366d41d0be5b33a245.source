// Bewegungssprache, Teil 1: Kurven. Alle Funktionen nehmen t von 0 bis 1 und liefern einen Wert von 0 bis 1
// (nur die Federkurven schwingen kurz darüber hinaus). Sie sind rein und ohne Browser prüfbar.

export const klemme = (x: number, lo = 0, hi = 1): number => Math.min(hi, Math.max(lo, x));
export const mische = (a: number, b: number, t: number): number => a + (b - a) * t;
export const weich = (a: number, b: number, x: number): number => {
  const t = klemme((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/** Gleichmäßig. */
export const linear = (t: number): number => klemme(t);
/** Sanftes Anfahren und Abbremsen (Kamerafahrten, Überblendungen). */
export const sanftInOut = (t: number): number => {
  const x = klemme(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
/** Schnell los, weich zum Ziel (Erscheinen, Hover). */
export const weichAus = (t: number): number => 1 - Math.pow(1 - klemme(t), 3);
/** Weich los, schnell am Ende (Verschwinden). */
export const weichEin = (t: number): number => Math.pow(klemme(t), 3);
/** Federt kurz über das Ziel hinaus (Marken, die auftauchen). `staerke` 1,70158 entspricht der üblichen Kurve. */
export const federAus = (t: number, staerke = 1.70158): number => {
  const x = klemme(t) - 1;
  return 1 + (staerke + 1) * x * x * x + staerke * x * x;
};
/** Gedämpfte Schwingung um 1: für Anstoßen und Nachfedern. */
export const nachfeder = (t: number, schwingungen = 2.5, daempfung = 5): number => {
  const x = klemme(t);
  // Mit (1 − x) läuft die Schwingung genau bei 1 aus
  return 1 - Math.exp(-daempfung * x) * Math.cos(2 * Math.PI * schwingungen * x) * (1 - x);
};
/** Atmen: gleichmäßiges Auf und Ab zwischen 0 und 1, `periodeMs` je Zyklus. */
export const atmen = (zeitMs: number, periodeMs: number): number => 0.5 - 0.5 * Math.cos((2 * Math.PI * zeitMs) / periodeMs);
/** Abklingende Zufallsfreie Erschütterung: Wert zwischen −1 und 1, in `dauerMs` auf 0 abklingend. */
export const erschuetterung = (zeitMs: number, dauerMs: number, frequenzHz = 17): number => {
  const t = klemme(zeitMs / dauerMs);
  if (t >= 1) return 0;
  const abkling = Math.pow(1 - t, 2);
  return Math.sin(2 * Math.PI * frequenzHz * (zeitMs / 1000)) * abkling;
};

export type Kurve = (t: number) => number;
export const KURVEN = { linear, sanftInOut, weichAus, weichEin, federAus, nachfeder } as const;
export type KurvenName = keyof typeof KURVEN;
