// Alle Kataloge des Reiches an einer Stelle.

import type { Vorhaben } from "../../sim/reich-typen";
import { KULTUR_VORHABEN, KULTUR_VORTEILE, STAETTEN_START } from "./kultur";
import { INFRA_VORHABEN, INFRA_VORTEILE, INSTANDZUSETZEN, sanierung } from "./infrastruktur";
import { RECHT_VORHABEN, RECHT_VORTEILE } from "./recht";
import { MILITAER_VORHABEN, MILITAER_VORTEILE, MIL_PFLEGBAR, militaerInstandsetzung } from "./militaer";
import { HAUSHALT_VORHABEN, HAUSHALT_VORTEILE } from "./haushalt";
import { ZUKUNFT_ALLE, ZUKUNFT_VORTEILE } from "./zukunft";
import { TECH_ALLE } from "./technologie";
import { REGIONAL_VORLAGEN } from "./regional";
import type { VorteilDef } from "./typen";

export { STAETTEN_START };
export { katalogFuerEingabe } from "./katalog";

/** Zukunftskatalog und Technologie: Ketten von Großvorhaben (Raumfahrt, KI, Verkehr, Städte, Energie, Technologiefelder). */
const NEU: Vorhaben[] = [...ZUKUNFT_ALLE, ...TECH_ALLE];
/** Jedes gebaute Stück mit Wirkung lässt sich instand setzen: auch die Vorhaben des Zukunftskatalogs. */
const NEU_PFLEGE: Vorhaben[] = [
  ...NEU.filter((v) => v.bereich === "infrastruktur" && INSTANDZUSETZEN(v)).map(sanierung),
  ...NEU.filter((v) => v.bereich === "militaer" && MIL_PFLEGBAR(v)).map(militaerInstandsetzung),
];

export const VORHABEN: Vorhaben[] = [...KULTUR_VORHABEN, ...INFRA_VORHABEN, ...RECHT_VORHABEN, ...MILITAER_VORHABEN, ...HAUSHALT_VORHABEN, ...NEU, ...REGIONAL_VORLAGEN, ...NEU_PFLEGE];
export const VORTEILE: VorteilDef[] = [...KULTUR_VORTEILE, ...INFRA_VORTEILE, ...RECHT_VORTEILE, ...MILITAER_VORTEILE, ...HAUSHALT_VORTEILE, ...ZUKUNFT_VORTEILE];
