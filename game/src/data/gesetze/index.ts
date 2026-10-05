// Zentrales Verzeichnis der Gesetzesbausteine (Stufe 2: Engine-Strang liest von hier).
// Einbindung: `import { ALLE_GESETZE, GESETZE_NACH_MASSNAHME } from "../gesetze";`
// Die Engine bildet pro Maßnahme einen Entwurf; mehrere Entwürfe je Maßnahme sind möglich und erlaubt.

import type { GesetzesEntwurf } from "./typen";
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
