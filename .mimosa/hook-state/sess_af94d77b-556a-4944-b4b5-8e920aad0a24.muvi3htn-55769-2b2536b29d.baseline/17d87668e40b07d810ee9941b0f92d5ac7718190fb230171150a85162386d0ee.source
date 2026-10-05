// Wirkungsberichte: Einstieg des Reiters „Wirkungsberichte“. Die Akte selbst steht in BerichtAkte.tsx.
// Die Schnittstelle bleibt, wie Stage.tsx sie aufruft: gewählter Bericht (aus einer Meldung) und der Sprung zur Maßnahme.

import type { World } from "../../sim/types";
import type { Bericht } from "../../sim/berichte";
import { BerichtAkte } from "./BerichtAkte";

interface Props {
  world: World;
  gewaehlterBericht?: Bericht | null;
  onMassnahmeOeffnen?: (massnahmeId: string) => void;
  onClose?: () => void;
}

export function WirkungsberichtDossier({ world, gewaehlterBericht, onMassnahmeOeffnen }: Props) {
  return <BerichtAkte world={world} start={gewaehlterBericht ?? null} {...(onMassnahmeOeffnen ? { onGehe: onMassnahmeOeffnen } : {})} />;
}
