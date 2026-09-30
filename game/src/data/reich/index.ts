// Alle Kataloge des Reiches an einer Stelle.

import type { Vorhaben } from "../../sim/reich-typen";
import { KULTUR_VORHABEN, KULTUR_VORTEILE, STAETTEN_START } from "./kultur";
import { INFRA_VORHABEN, INFRA_VORTEILE } from "./infrastruktur";
import { RECHT_VORHABEN, RECHT_VORTEILE } from "./recht";
import { MILITAER_VORHABEN, MILITAER_VORTEILE } from "./militaer";
import { HAUSHALT_VORHABEN, HAUSHALT_VORTEILE } from "./haushalt";
import type { VorteilDef } from "./typen";

export { STAETTEN_START };
export const VORHABEN: Vorhaben[] = [...KULTUR_VORHABEN, ...INFRA_VORHABEN, ...RECHT_VORHABEN, ...MILITAER_VORHABEN, ...HAUSHALT_VORHABEN];
export const VORTEILE: VorteilDef[] = [...KULTUR_VORTEILE, ...INFRA_VORTEILE, ...RECHT_VORTEILE, ...MILITAER_VORTEILE, ...HAUSHALT_VORTEILE];
