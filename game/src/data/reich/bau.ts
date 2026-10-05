// Bausteine für die Kataloge: Effekte aus Zielwerten, Orte aus dem Erbekatalog.

import { NODES } from "../politiknetz";
import { decayVon } from "../../sim/netz";
import { ERBE_NACH_ID } from "../erbe";
import type { Effekt, Vorhaben } from "../../sim/reich-typen";

const DECAY = new Map(NODES.map((n) => [n.id, decayVon(n)]));

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

/**
 * Instandsetzung eines Bestandsstücks: Wartung und Erneuerung als Vorhaben mit Baukapazität, nicht mit Geld. Sie hebt den Zustand,
 * und der Zustand bestimmt, wie viel das Stück bringt (siehe `zustandsSkala` in sim/reich.ts); `stoesse` sind zusätzliche einmalige
 * Wirkungen. Sie lohnt erst, wenn der Zustand nachgelassen hat (Voraussetzung: höchstens 88). Die Kennung bleibt wie in älteren
 * Spielständen (`sanierung_…`), damit laufende Instandsetzungen weiterlaufen.
 */
export function instandsetzung(b: Vorhaben, o: { id: string; bau: number; monate: number; hub: number; stoesse?: Effekt[]; kehrseite: string }): Vorhaben {
  return {
    id: o.id,
    bereich: b.bereich,
    klasse: "restaurierung",
    name: `Instandsetzung: ${b.name}`,
    text: `Wartung und Erneuerung von ${b.name}: Der Zustand steigt um bis zu ${o.hub} Punkte. Ein Stück in schlechtem Zustand bringt dem Land weniger; die Zeilen darunter zeigen, wie viel mehr nach der Arbeit.`,
    ...(b.ort ? { ort: b.ort } : {}),
    ...(b.provinzen ? { provinzen: b.provinzen } : {}),
    voraus: [
      { art: "bestand", id: b.id },
      { art: "bestand-max", id: b.id, max: 88, text: `${b.name} nicht schon in bestem Zustand` },
    ],
    kosten: { pk: 2, bau: o.bau, monate: o.monate, verwaltung: 0.6 },
    abschluss: [{ t: "bestand", id: b.id, d: o.hub }, ...(o.stoesse ?? [])],
    kehrseite: o.kehrseite,
    pflegt: b.id,
    quelle: "Spielvorhaben",
  };
}
