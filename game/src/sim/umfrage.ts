// Die Umfrage-Messung: was ein Institut aus dem wahren Wert macht (RECHERCHE_MEDIEN_UMFRAGEN.md,
// Kapitel B.4: Fehler-Generator). Haus-Bias, Angstklima-Modifikator, Rauschen und fette Abweichungen.
// Rückwärtskompatibel: Ohne Institut und Zufallsquelle bleibt die monatliche Fortschreibung exakt
// die bisherige träge Annäherung (Faktor 0,35), und der Zufallsstrom des Spiels wird nicht angezapft.
// Alle Zahlen sind Spielparameter (Platzhalter der Kalibrierung).

import { clamp } from "./economy";
import type { Rng } from "./rng";
import { FEHLER_GENERATOR, umfrageInstitut } from "../data/umfrage_institute";

export interface UmfrageMessungOptionen {
  /** Kennung eines Instituts aus data/umfrage_institute; ohne Institut bleibt die Messung neutral */
  institutId?: string;
  /** Repressionslevel 0–100; ab Schwelle verbergen Befragte ihre Präferenz (Angstklima, Recherche B.3) */
  angstklima?: number;
}

/**
 * Eine einzelne publizierte Messung eines wahren Zustimmungswerts.
 * Verbraucht die Zufallsquelle — nur aufrufen, wenn eine Messung wirklich gezeigt wird.
 */
export function umfrageMessung(wahrerWert: number, rng: Rng, optionen: UmfrageMessungOptionen = {}): number {
  const institut = optionen.institutId ? umfrageInstitut(optionen.institutId) : undefined;
  let wert = wahrerWert + (institut?.hausBias ?? 0);

  // Angstklima: Je höher die Repression, desto mehr Verweigerung im Regierungslager → Unterschätzung
  const angst = optionen.angstklima ?? 0;
  const mod = FEHLER_GENERATOR.angstklimaModifikator;
  if (angst >= mod.hochAb) wert += mod.hoch;
  else if (angst >= mod.mittelAb) wert += mod.mittel;

  wert += rng.normal(institut?.sigma ?? FEHLER_GENERATOR.sigmaBasis);

  // Fette Abweichung (KONDA 2023: −5,8 pp; AKAM/REMRES 2018: −8/−9 pp), zu 70 % gegen das Regierungslager
  const fatP = institut?.fatTailP ?? FEHLER_GENERATOR.fatTail.p;
  if (rng.next() < fatP) {
    const { min, max } = FEHLER_GENERATOR.fatTail.offsetPp;
    const richtung = rng.next() < FEHLER_GENERATOR.fatTail.gegenRegierungP ? -1 : 1;
    wert += richtung * rng.between(min, max);
  }
  return clamp(wert, 0, 100);
}

/**
 * Monatliche Fortschreibung des Umfragestands in der Spielschleife.
 * Ohne Optionen: exakt das alte Verhalten (träge Annäherung an den Sollwert, kein Rauschen,
 * kein Verbrauch der Zufallsquelle). Mit institutId + rng: Messfehler gemäß Fehler-Generator.
 */
export function umfrageMonat(zustimmung: number, ziel: number, rng?: Rng, optionen: UmfrageMessungOptionen = {}): number {
  const wert = zustimmung + 0.35 * (ziel - zustimmung);
  if (!rng || !optionen.institutId) return wert;
  return umfrageMessung(wert, rng, optionen);
}
