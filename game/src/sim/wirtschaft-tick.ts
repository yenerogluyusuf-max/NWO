// Was die Wirtschaftsakte jeden Monat tut: Haushaltsregler wirken, der Zinsdienst folgt den Märkten, die Verläufe werden fortgeschrieben.

import type { World } from "./types";
import { haushaltMonat } from "./haushalt";
import { zeichneAuf } from "./wirtschaft";
import { haushaltsReifungVorbereiten, haushaltsReifungBelegen } from "./haushaltsreifung";

export function wirtschaftMonat(world: World): void {
  if (!world.spiel) return;
  const vergleich=haushaltsReifungVorbereiten(world);
  haushaltMonat(world);
  haushaltsReifungBelegen(world,vergleich);
  zeichneAuf(world);
}
