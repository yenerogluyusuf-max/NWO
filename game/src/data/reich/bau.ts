// Bausteine für die Kataloge: Effekte aus Zielwerten, Orte aus dem Erbekatalog.

import { NODES } from "../politiknetz";
import { ERBE_NACH_ID } from "../erbe";
import type { Effekt } from "../../sim/reich-typen";

const DECAY = new Map(NODES.map((n) => [n.id, n.decay]));

/**
 * Dauerhafte Verschiebung einer Größe um `verschiebung` Punkte: Das Netz zieht jeden Monat einen Teil der Abweichung zurück
 * (Trägheit), also braucht ein Dauerwirkung `verschiebung × Trägheit` je Monat, damit sich das Gleichgewicht um genau so viel verschiebt.
 */
export function stuetze(id: string, verschiebung: number, provinzen?: number[]): Effekt {
  const decay = DECAY.get(id);
  if (decay === undefined) throw new Error(`Unbekannte Größe: ${id}`);
  return { t: "knoten", id, d: Math.round(verschiebung * decay * 1000) / 1000, ...(provinzen ? { provinzen } : {}) };
}

/** Einmaliger Stoß auf eine Größe. */
export const stoss = (id: string, d: number, provinzen?: number[]): Effekt => ({ t: "knoten", id, d, ...(provinzen ? { provinzen } : {}) });

/** Ort eines Vorhabens aus dem Erbekatalog. */
export function ortVon(erbeId: string): { lat: number; lon: number; plaka: number; name: string } {
  const e = ERBE_NACH_ID[erbeId];
  if (!e) throw new Error(`Unbekannte Stätte: ${erbeId}`);
  return { lat: e.lat, lon: e.lon, plaka: e.plaka, name: e.name };
}

/** Die zehn Provinzen des Erdbebengebiets von 2023 (Kfz-Kennziffern). */
export const ERDBEBENGEBIET = [31, 46, 27, 44, 2, 80, 1, 21, 63, 79];
