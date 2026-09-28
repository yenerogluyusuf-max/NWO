// Deterministischer Zufall (mulberry32). Der Zustand ist eine einzige Zahl,
// damit er im Spielstand gespeichert und exakt fortgesetzt werden kann.

export class Rng {
  constructor(public state: number) {}

  /** Gleichverteilt in [0, 1). */
  next(): number {
    this.state = (this.state + 0x6d2b79f5) | 0;
    let r = Math.imul(this.state ^ (this.state >>> 15), this.state | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  }

  /** Normalverteilt mit Mittelwert 0 und Standardabweichung sd. */
  normal(sd = 1): number {
    const u = Math.max(this.next(), 1e-12);
    const v = this.next();
    return sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  /** Gleichverteilt in [min, max]. */
  between(min: number, max: number): number {
    return min + (max - min) * this.next();
  }
}

export function seedToState(seed: number): number {
  return seed | 0;
}
