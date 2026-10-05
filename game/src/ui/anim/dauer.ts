// Bewegungssprache, Teil 2: Dauern und Staffelung. Alle Werte sind Gestaltungsmaße (Spielparameter), keine Messwerte.
// Gemeinsame Grundlage für Karte, Fenster und spätere Baum- und Abschlussszenen, damit sich alles gleich anfühlt.

import { klemme } from "./easing";

export const DAUER = {
  /** Klick, Umschalten, Tastendruck */
  klick: 120,
  /** Hover: Hervorheben und Zurücknehmen */
  hover: 160,
  /** Überblendung der Kartenfarben beim Ebenenwechsel */
  blende: 400,
  /** Marke erscheint */
  marke: 420,
  /** Kamerafahrt: kürzeste und längste */
  flugMin: 600,
  flugMax: 1700,
  /** Tinte läuft über eine Fläche (Besitzerwechsel) */
  tinte: 1100,
  /** Ereignisring auf der Karte */
  ring: 1500,
  /** Beben: Erschütterung der Kamera */
  beben: 800,
  /** Funken bei Fertigstellung */
  funken: 1100,
  /** Abschlussszene (Fokus, Technologie, Wunder): Staffelung der Teile */
  abschluss: 2600,
} as const;

/** Verzögerung des i-ten Elements einer Staffelung: nie länger als `maxMs` insgesamt. */
export function staffel(i: number, anzahl: number, schrittMs = 40, maxMs = 240): number {
  if (anzahl <= 1) return 0;
  const schritt = Math.min(schrittMs, maxMs / (anzahl - 1));
  return Math.round(i * schritt);
}

/**
 * Dauer einer Kamerafahrt: wächst mit der Strecke (in Anteilen der Bildbreite) und dem Zoomunterschied, bleibt zwischen Minimum und Maximum.
 * `strecke` 0 = gleiche Stelle, 1 = einmal quer über das Bild; `zoomFaktor` ist das Verhältnis der Abstände (größer durch kleiner).
 */
export function flugDauer(strecke: number, zoomFaktor = 1): number {
  const z = Math.abs(Math.log(Math.max(1e-3, zoomFaktor)));
  const x = klemme(0.35 * Math.sqrt(Math.max(0, strecke)) + 0.28 * z, 0, 1.4);
  return Math.round(DAUER.flugMin + (DAUER.flugMax - DAUER.flugMin) * klemme(x));
}

/**
 * Höhe des Bogens einer Kamerafahrt: Bei einer weiten Strecke fährt die Kamera kurz heraus und dann hinein (Faktor auf den Abstand),
 * bei einer kurzen bleibt sie fast gleich.
 */
export function flugBogen(strecke: number): number {
  return 1 + 0.55 * klemme(Math.sqrt(Math.max(0, strecke)) * 0.9, 0, 1);
}
