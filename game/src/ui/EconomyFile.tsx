// Kennzahlen der Wirtschaft: Die Lage ist Teil der Wirtschaftsakte (`wirtschaft/`), in der jede Zahl anklickbar ist und zu einer Entscheidung führt.

import type { World } from "../sim/types";
import { WirtschaftAkte } from "./wirtschaft/Akte";

export function EconomyFile({ world, onGeaendert }: { world: World; onGeaendert?: () => void }) {
  return <WirtschaftAkte world={world} start="lage" onGeaendert={onGeaendert} />;
}
