// Heureka-System: Berechnung von Forschungsrabatten und Prüfung von Meilensteinen.
// Inspiriert durch Civilization VI: 40 % Forschungsrabatt bei Erfüllung realer Vorgaben.

import type { TechnologieDef } from "./typen";

export const EUREKA_RABATT_FAKTOR = 0.4; // 40 % Zeit-/Punkteersparnis

/**
 * Berechnet die verbleibenden Forschungspunkte unter Berücksichtigung eines ausgelösten Heureka-Moments.
 */
export function berechneTechBedarf(tech: TechnologieDef, eurekaAusgeloest: boolean): number {
  if (!eurekaAusgeloest) {
    return tech.forschungspunkte;
  }
  return Math.round(tech.forschungspunkte * (1 - EUREKA_RABATT_FAKTOR));
}

export interface EurekaPruefKontext {
  abgeschlosseneVorhaben?: string[];
  abgeschlosseneFoki?: string[];
  massnahmenWerte?: Record<string, number>;
  metrikenWerte?: Record<string, number>;
  aktiveAbkommenKategorien?: string[];
  bewaeltigteKatastrophen?: string[];
}

/**
 * Bewertet, ob die Eureka-Bedingung einer Technologie im aktuellen Spielzustand erfüllt ist.
 */
export function pruefeEureka(
  tech: TechnologieDef,
  kontext: EurekaPruefKontext
): boolean {
  const e = tech.eureka;
  if (!e) return false;

  switch (e.art) {
    case "vorhaben":
      return kontext.abgeschlosseneVorhaben?.includes(e.zielId) ?? false;

    case "fokus":
      return kontext.abgeschlosseneFoki?.includes(e.zielId) ?? false;

    case "massnahme": {
      const wert = kontext.massnahmenWerte?.[e.zielId] ?? 0;
      return e.zielWert !== undefined ? wert >= e.zielWert : wert > 0;
    }

    case "metrik": {
      const wert = kontext.metrikenWerte?.[e.zielId] ?? 0;
      return e.zielWert !== undefined ? wert >= e.zielWert : wert > 0;
    }

    case "abkommen":
      return kontext.aktiveAbkommenKategorien?.includes(e.zielId) ?? false;

    case "katastrophe":
      return kontext.bewaeltigteKatastrophen?.includes(e.zielId) ?? false;

    default:
      return false;
  }
}

/**
 * Gibt eine lokalisierte Eureka-Benachrichtigung für das UI zurück.
 */
export function eurekaMeldung(
  tech: TechnologieDef,
  sprache: "de" | "tr" | "en"
): { titel: string; text: string } {
  if (sprache === "tr") {
    return {
      titel: "Buldum! (Heureka)",
      text: `${tech.nameTr}: ${tech.eureka.beschreibungTr} — Araştırma süresi %40 kısaldı!`,
    };
  }
  if (sprache === "en") {
    return {
      titel: "Eureka!",
      text: `${tech.nameEn}: ${tech.eureka.beschreibungEn} — Research cost reduced by 40%!`,
    };
  }
  return {
    titel: "Heureka!",
    text: `${tech.name}: ${tech.eureka.beschreibung} — Forschungsaufwand um 40 % gesenkt!`,
  };
}
