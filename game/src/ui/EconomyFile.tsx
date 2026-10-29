// Kennzahlen der Wirtschaft: Die Lage ist Teil der Wirtschaftsakte (`wirtschaft/`), in der jede Zahl anklickbar ist und zu einer Entscheidung führt.

import type { World } from "../sim/types";
import { WirtschaftAkte } from "./wirtschaft/Akte";

export function EconomyFile({ world, onGeaendert, start = "lage", posten }: { world: World; onGeaendert?: () => void; start?: "lage" | "haushalt"; posten?: string }) {
  return <WirtschaftAkte world={world} start={start} onGeaendert={onGeaendert} {...(posten ? { posten } : {})} />;
}
