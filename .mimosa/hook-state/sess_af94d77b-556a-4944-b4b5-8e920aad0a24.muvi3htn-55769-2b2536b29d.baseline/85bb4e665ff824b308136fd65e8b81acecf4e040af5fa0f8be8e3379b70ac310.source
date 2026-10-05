// Was die Wirtschaftsakte jeden Monat tut: Haushaltsregler wirken, der Zinsdienst folgt den Märkten, die Verläufe werden fortgeschrieben.

import type { World } from "./types";
import { haushaltMonat } from "./haushalt";
import { zeichneAuf } from "./wirtschaft";

export function wirtschaftMonat(world: World): void {
  if (!world.spiel) return;
  haushaltMonat(world);
  zeichneAuf(world);
}
