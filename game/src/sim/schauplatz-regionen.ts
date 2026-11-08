// Regionen eines Schauplatzes, ohne Ladezyklus (Welle 3, K5): sim/kriegsschauplatz.ts und sim/besatzung.ts lesen beide, welche Regionen
// zu einem Land gehören und in welcher Reihenfolge die Front sie nimmt. Reine Datenzugriffe; sim/kriegsschauplatz.ts reicht sie weiter.

import { REGIONEN, REGION_NACH_ID, SCHAUPLATZ_NACH_LAND, ZIELRAUM_REGIONEN, type Region, type Schauplatz } from "../data/schauplaetze";
import type { KriegVorgang } from "./krieg-typen";

export function schauplatzFuer(landId: string): Schauplatz | undefined {
  return SCHAUPLATZ_NACH_LAND[landId];
}

export function regionenVon(landId: string): Region[] {
  const s = schauplatzFuer(landId);
  return s ? REGIONEN.filter((r) => r.schauplatz === s.id) : [];
}

/** Die Zielregionen des Vorgangs in der Reihenfolge, in der die Front sie nimmt (Tiefe, dann Lage im Datensatz). */
export function zielRegionen(k: Pick<KriegVorgang, "land" | "zielraum">): Region[] {
  const ids = k.zielraum ? ZIELRAUM_REGIONEN[k.zielraum] : undefined;
  const alle = regionenVon(k.land);
  const liste = ids ? ids.map((id) => REGION_NACH_ID[id]).filter((r): r is Region => !!r) : alle.filter((r) => r.tiefe === 1);
  return [...liste].sort((a, b) => a.tiefe - b.tiefe);
}
