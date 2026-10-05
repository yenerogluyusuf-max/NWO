// Bewegungssprache, Teil 5: Farben mischen (für Überblendungen der Karte). Verstanden werden `#rgb`, `#rrggbb`, `rgb()` und `rgba()`.

export interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

export function parseFarbe(f: string): Rgba | null {
  const s = f.trim();
  let m = /^#([0-9a-f]{3})$/i.exec(s);
  if (m) {
    const h = m[1]!;
    return { r: parseInt(h[0]! + h[0]!, 16), g: parseInt(h[1]! + h[1]!, 16), b: parseInt(h[2]! + h[2]!, 16), a: 1 };
  }
  m = /^#([0-9a-f]{6})$/i.exec(s);
  if (m) {
    const h = m[1]!;
    return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16), a: 1 };
  }
  m = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/i.exec(s);
  if (m) return { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]), a: m[4] === undefined ? 1 : Number(m[4]) };
  return null;
}

export const farbeText = (c: Rgba): string => `rgba(${Math.round(c.r)}, ${Math.round(c.g)}, ${Math.round(c.b)}, ${Math.round(c.a * 1000) / 1000})`;

/** Mischt zwei Farben; ist eine nicht lesbar, springt das Ergebnis bei t = 0,5. */
export function mischeFarbe(a: string, b: string, t: number): string {
  const x = parseFarbe(a);
  const y = parseFarbe(b);
  if (!x || !y) return t < 0.5 ? a : b;
  const k = Math.min(1, Math.max(0, t));
  return farbeText({ r: x.r + (y.r - x.r) * k, g: x.g + (y.g - x.g) * k, b: x.b + (y.b - x.b) * k, a: x.a + (y.a - x.a) * k });
}

/** Setzt die Deckkraft einer Farbe (multipliziert die vorhandene). */
export function mitDeckkraft(f: string, a: number): string {
  const c = parseFarbe(f);
  return c ? farbeText({ ...c, a: c.a * a }) : f;
}
