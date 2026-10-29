// Neubau-Linien auf der Karte: Laufende Vorhaben mit Provinzkette (Autobahnen, Bahnen, Leitungen, Serien)
// erscheinen als gestrichelte Planlinie, die mit dem Baufortschritt von Ende zu Ende vergoldet wird.
// Einzelorte (Häfen, Kraftwerke) bleiben Marken am Banner. Rein und ohne Browser prüfbar; gezeichnet wird
// in AtlasMap.placeLabels über die Provinz-Mitten der Szene (c.centers).
// Alle Werte sind Spielparameter oder aus dem Spielstand gerechnet; keine Tatsachenbehauptungen.

import { PROVINCES } from "../../sim/netz";
import { laufBau, reichZustand, vorhabenDef } from "../../sim/reich";
import type { World } from "../../sim/types";

export interface NeubauLinie {
  id: string;
  name: string;
  /** Provinzkette in Kfz-Kennziffern, in der Reihenfolge des Verlaufs */
  kette: number[];
  /** Baufortschritt 0 bis 1: der vergoldete Anteil der Strecke */
  anteil: number;
  /** Vergabephase oder pausiert: die Linie liegt still */
  ruht: boolean;
}

const klemme = (x: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, x));

/** Laufende Strecken-Vorhaben als Linien; Einzelorte und Vorhaben ohne Kette tauchen hier nicht auf. */
export function neubauLinien(w: World): NeubauLinie[] {
  if (!w.spiel) return [];
  const z = reichZustand(w);
  const linien: NeubauLinie[] = [];
  for (const l of z.laufend) {
    const def = vorhabenDef(l.id) ?? z.regional?.[l.id]?.def ?? z.frei?.[l.id]?.def;
    if (!def) continue;
    const kette = (def.provinzen ?? []).filter((p) => p >= 1 && p <= PROVINCES);
    if (kette.length < 2) continue;
    linien.push({
      id: l.id,
      name: def.name,
      kette,
      anteil: klemme(l.fortschritt / Math.max(1, laufBau(l, def)), 0, 1),
      ruht: !!l.pausiert || (!!l.vergabeBis && l.vergabeBis > (w.day ?? 0) && l.fortschritt <= 0),
    });
  }
  return linien;
}
