import type { VersorgungsProgramm } from "../sim/versorgungspolitik";
// Kennzahlen der Wirtschaft: Die Lage ist Teil der Wirtschaftsakte (`wirtschaft/`), in der jede Zahl anklickbar ist und zu einer Entscheidung führt.

import type { World } from "../sim/types";
import { WirtschaftAkte } from "./wirtschaft/Akte";
import type { Ziel } from "./schreibtisch/briefing";

/** `onGehe` führt aus der Akte zu einer Maßnahme im Politikbereich (die eine Stellgröße einer Steuer, Befund D-1). */
export function EconomyFile({ world, onGeaendert, start = "lage", posten, programm, onGehe }: { world: World; onGeaendert?: () => void; start?: "lage" | "haushalt" | "inventar"; posten?: string; programm?: VersorgungsProgramm; onGehe?: (z: Ziel) => void }) {
  return <WirtschaftAkte programm={programm} world={world} start={start} onGeaendert={onGeaendert} {...(posten ? { posten } : {})} {...(onGehe ? { onGehe } : {})} />;
}
