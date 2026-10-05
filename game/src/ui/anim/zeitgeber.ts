// Bewegungssprache, Teil 4: Zeitgeber. `Tween` ist ein reiner Verlauf von einem Wert zum anderen über eine Dauer mit Kurve; der Aufrufer
// reicht die Zeit hinein (so ist alles ohne Browser prüfbar und mit dem Zeichenzyklus der Karte teilbar). `Takt` begrenzt Bilder je Sekunde.

import { klemme, mische, sanftInOut, type Kurve } from "./easing";

export interface TweenOptionen {
  von: number;
  nach: number;
  dauerMs: number;
  kurve?: Kurve;
  /** Startzeit; fehlt sie, gilt die erste abgefragte Zeit */
  startMs?: number;
}

export class Tween {
  private start: number | undefined;
  constructor(private o: TweenOptionen) {
    this.start = o.startMs;
  }
  /** Wert zur Zeit `jetztMs`; bei Dauer 0 sofort das Ziel. */
  wert(jetztMs: number): number {
    if (this.o.dauerMs <= 0) return this.o.nach;
    this.start ??= jetztMs;
    const t = klemme((jetztMs - this.start) / this.o.dauerMs);
    return mische(this.o.von, this.o.nach, (this.o.kurve ?? sanftInOut)(t));
  }
  fertig(jetztMs: number): boolean {
    if (this.o.dauerMs <= 0) return true;
    return this.start !== undefined && jetztMs - this.start >= this.o.dauerMs;
  }
  /** Fortschritt 0 bis 1 ohne Kurve. */
  fortschritt(jetztMs: number): number {
    if (this.o.dauerMs <= 0) return 1;
    this.start ??= jetztMs;
    return klemme((jetztMs - this.start) / this.o.dauerMs);
  }
}

/** Lässt höchstens `bilderJeSekunde` Durchläufe zu (0 = nie, Infinity = immer). */
export class Takt {
  private letzter = -Infinity;
  constructor(public bilderJeSekunde: number) {}
  /** Gibt wahr zurück, wenn jetzt ein Durchlauf stattfinden darf, und merkt sich die Zeit. */
  darf(jetztMs: number): boolean {
    if (this.bilderJeSekunde <= 0) return false;
    if (!Number.isFinite(this.bilderJeSekunde)) return true;
    const abstand = 1000 / this.bilderJeSekunde;
    // kleine Toleranz, damit 60-Hz-Bildschirme 30 Bilder je Sekunde sauber treffen
    if (jetztMs - this.letzter < abstand - 3) return false;
    this.letzter = jetztMs;
    return true;
  }
  zuruecksetzen(): void {
    this.letzter = -Infinity;
  }
}

/** Gleitender Zielwert: nähert sich exponentiell, unabhängig von der Bildrate (Zeitkonstante in Millisekunden). */
export function naehere(aktuell: number, ziel: number, dtMs: number, zeitkonstanteMs: number): number {
  if (zeitkonstanteMs <= 0) return ziel;
  const k = 1 - Math.exp(-Math.max(0, dtMs) / zeitkonstanteMs);
  return aktuell + (ziel - aktuell) * k;
}
