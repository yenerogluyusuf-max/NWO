// Regierungsprogramme: Einstieg des Reiters „Programme“. Die Akte selbst (Karten, Pfad, Schritte) steht in politik/ProgrammeAkte.tsx;
// die Regeln stehen in sim/programme.ts.

import type { World } from "../sim/types";
import { ProgrammeAkte } from "./politik/ProgrammeAkte";

export function Programme(props: { world: World; refresh: () => void; onMassnahme?: (id: string, richtung: 1 | -1) => void }) {
  return <ProgrammeAkte {...props} />;
}
