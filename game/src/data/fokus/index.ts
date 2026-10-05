// Zentraler Index und Aggregation des Nationalen Fokusbaums („Agenda“).
// Exportiert alle 7 Äste, Metadaten und Hilfsfunktionen zur Prüfung von Vorbedingungen und Ausschlüssen.

import type { FokusAst, FokusAstMeta, FokusDefinition } from "./typen";
import { FOKUS_WIRTSCHAFT } from "./wirtschaft";
import { FOKUS_SICHERHEIT } from "./sicherheit";
import { FOKUS_GESELLSCHAFT } from "./gesellschaft";
import { FOKUS_AUSSEN } from "./aussen";
import { FOKUS_STAAT } from "./staat";
import { FOKUS_REGIONEN } from "./regionen";
import { FOKUS_WISSEN } from "./wissen";
import type { Achsen } from "../linien";

export * from "./typen";
export { FOKUS_WIRTSCHAFT } from "./wirtschaft";
export { FOKUS_SICHERHEIT } from "./sicherheit";
export { FOKUS_GESELLSCHAFT } from "./gesellschaft";
export { FOKUS_AUSSEN } from "./aussen";
export { FOKUS_STAAT } from "./staat";
export { FOKUS_REGIONEN } from "./regionen";
export { FOKUS_WISSEN } from "./wissen";

export const FOKUS_AESTE_META: Record<FokusAst, FokusAstMeta> = {
  wirtschaft: {
    id: "wirtschaft",
    titel: "Wirtschaftsordnung",
    titelTr: "Ekonomi Düzeni",
    titelEn: "Economic Order",
    beschreibung: "Von Marktliberalisierung bis staatlichem Dirigismus und Industrieautarkie.",
    farbe: "#d4a373",
    ikone: "bank",
  },
  sicherheit: {
    id: "sicherheit",
    titel: "Sicherheit & Streitkräfte",
    titelTr: "Güvenlik ve Silahlı Kuvvetler",
    titelEn: "Security & Armed Forces",
    beschreibung: "Drohnenschwärme, Mavi Vatan, Çelik Kubbe und strategische Bündnisse.",
    farbe: "#bc4749",
    ikone: "shield",
  },
  gesellschaft: {
    id: "gesellschaft",
    titel: "Gesellschaft & Kultur",
    titelTr: "Toplum ve Kültür",
    titelEn: "Society & Culture",
    beschreibung: "Laizismus vs. religiöse Werte, Frauenrechte und gesellschaftliche Aussöhnung.",
    farbe: "#6b705c",
    ikone: "people",
  },
  aussen: {
    id: "aussen",
    titel: "Außenpolitik & Bündnisse",
    titelTr: "Dış Politika ve İttifaklar",
    titelEn: "Foreign Policy & Alliances",
    beschreibung: "EU-Zollunion, Organisation der Türkischen Staaten und multipolare BRICS-Balance.",
    farbe: "#457b9d",
    ikone: "globe",
  },
  staat: {
    id: "staat",
    titel: "Staat, Justiz & Verfassung",
    titelTr: "Devlet, Yargı ve Anayasa",
    titelEn: "State, Justice & Constitution",
    beschreibung: "Präsidiale Dekretmacht vs. Parlamentarismus und richterliche Unabhängigkeit.",
    farbe: "#3d5a80",
    ikone: "landmark",
  },
  regionen: {
    id: "regionen",
    titel: "Land, Regionen & Megaprojekte",
    titelTr: "Bölgeler ve Mega Projeler",
    titelEn: "Regions & Mega-Projects",
    beschreibung: "Kanal Istanbul, GAP 2.0, Erdbebenfestung und Schnellbahntrassen.",
    farbe: "#2a9d8f",
    ikone: "map",
  },
  wissen: {
    id: "wissen",
    titel: "Wissenschaft & Zukunft",
    titelTr: "Bilim ve Gelecek",
    titelEn: "Science & Innovation",
    beschreibung: "Künstliche Intelligenz, Raumfahrtagentur, Chipfertigung und Brain-Drain-Umkehr.",
    farbe: "#7209b7",
    ikone: "sparkles",
  },
};

/** Alle nationalen Foki in einer flachen Liste */
export const ALLE_FOKI: FokusDefinition[] = [
  ...FOKUS_WIRTSCHAFT,
  ...FOKUS_SICHERHEIT,
  ...FOKUS_GESELLSCHAFT,
  ...FOKUS_AUSSEN,
  ...FOKUS_STAAT,
  ...FOKUS_REGIONEN,
  ...FOKUS_WISSEN,
];

/** Index nach Fokus-ID */
export const FOKUS_NACH_ID: Record<string, FokusDefinition> = Object.fromEntries(
  ALLE_FOKI.map((f) => [f.id, f])
);

/** Foki gruppiert nach Ast */
export const FOKUS_NACH_AST: Record<FokusAst, FokusDefinition[]> = {
  wirtschaft: FOKUS_WIRTSCHAFT,
  sicherheit: FOKUS_SICHERHEIT,
  gesellschaft: FOKUS_GESELLSCHAFT,
  aussen: FOKUS_AUSSEN,
  staat: FOKUS_STAAT,
  regionen: FOKUS_REGIONEN,
  wissen: FOKUS_WISSEN,
};

/**
 * Prüft, ob ein Fokus bereits durch einen gewählten gegensätzlichen Fokus ausgeschlossen ist.
 */
export function istFokusAusgeschlossen(
  fokusId: string,
  abgeschlosseneFoki: string[]
): { ausgeschlossen: boolean; grundFokusId?: string } {
  const f = FOKUS_NACH_ID[fokusId];
  if (!f || !f.ausschluesse || f.ausschluesse.length === 0) {
    return { ausgeschlossen: false };
  }
  for (const ausschluss of f.ausschluesse) {
    if (abgeschlosseneFoki.includes(ausschluss)) {
      return { ausgeschlossen: true, grundFokusId: ausschluss };
    }
  }
  return { ausgeschlossen: false };
}

/**
 * Prüft, ob alle Voraussetzungen (Vorgänger im Baum) erfüllt sind.
 */
export function sindVoraussetzungenErfuellt(
  fokusId: string,
  abgeschlosseneFoki: string[]
): boolean {
  const f = FOKUS_NACH_ID[fokusId];
  if (!f) return false;
  if (!f.voraus || f.voraus.length === 0) return true;
  return f.voraus.every((vorId) => abgeschlosseneFoki.includes(vorId));
}

/**
 * Berechnet die tatsächlichen Kapitalkosten eines Fokus unter Berücksichtigung der Parteiausrichtung.
 * Eine passende Parteilinie senkt die Kosten um bis zu 30 %, eine unpassende erhöht sie um bis zu 40 %.
 */
export function berechneFokusKosten(
  fokus: FokusDefinition,
  parteiAchsen?: Achsen
): number {
  if (!parteiAchsen || !fokus.wirkung.achsenVerschiebung) {
    return fokus.kapital;
  }
  let anpassung = 1.0;
  for (const [achse, shift] of Object.entries(fokus.wirkung.achsenVerschiebung)) {
    const parteiWert = (parteiAchsen as Record<string, number>)[achse] ?? 0;
    // Wenn Partei in dieselbe Richtung zeigt wie der Fokus: Rabatt
    if ((shift > 0 && parteiWert > 20) || (shift < 0 && parteiWert < -20)) {
      anpassung -= 0.15;
    }
    // Wenn Partei in die entgegengesetzte Richtung tendiert: Zuschlag
    else if ((shift > 0 && parteiWert < -20) || (shift < 0 && parteiWert > 20)) {
      anpassung += 0.2;
    }
  }
  anpassung = Math.max(0.6, Math.min(1.5, anpassung));
  return Math.round(fokus.kapital * anpassung);
}
