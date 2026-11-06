// Zentrales Verzeichnis der Gesetzesbausteine (Stufe 2: Engine-Strang liest von hier).
// Einbindung: `import { ALLE_GESETZE, GESETZE_NACH_MASSNAHME } from "../gesetze";`
// Die Engine bildet pro Maßnahme einen Entwurf; mehrere Entwürfe je Maßnahme sind möglich und erlaubt.

import type { GesetzesEntwurf } from "./typen";
import { datenFelder } from "../../i18n/daten";
import { GESETZE_KERN1 } from "./kern1";
import { GESETZE_KERN2 } from "./kern2";

export * from "./typen";
export { GESETZE_KERN1 } from "./kern1";
export { GESETZE_KERN2 } from "./kern2";

/** Alle zwanzig Gesetzesentwürfe in einer flachen Liste. */
export const ALLE_GESETZE: GesetzesEntwurf[] = [...GESETZE_KERN1, ...GESETZE_KERN2];

/** Entwürfe nach Maßnahme-ID des Politiknetzes gruppiert. */
export const GESETZE_NACH_MASSNAHME: Record<string, GesetzesEntwurf[]> = ALLE_GESETZE.reduce(
  (map, g) => {
    (map[g.massnahme] ??= []).push(g);
    return map;
  },
  {} as Record<string, GesetzesEntwurf[]>
);

// Sichtbar im Spiel (befund-B B-8): Die Titel der Klauseln erscheinen als Streitpunkte im Ausschuss und im Gesetzeskatalog der
// Tagesordnung; Türkisch und Englisch kommen aus dem Katalog (daten.gesetzbaustein.<entwurf>.<klausel>.titel in nacht_n4.json).
datenFelder("gesetzbaustein", ALLE_GESETZE.flatMap((g) => g.klauseln.map((k) => ({ id: `${g.id}.${k.id}`, obj: k, feld: "titel" }))));

/** Die Klauseltitel eines Bausteins (Streitpunkte), in der aktuellen Sprache. */
export function streitpunkte(baustein: string | undefined): string[] {
  return ALLE_GESETZE.find((g) => g.id === baustein)?.klauseln.map((k) => k.titel) ?? [];
}
