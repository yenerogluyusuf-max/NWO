// Typen der Kataloge des Reiches (Vorhaben, Vorteile). Die Vorhaben selbst stehen in `sim/reich-typen.ts`.

import type { Effekt, Voraussetzung } from "../../sim/reich-typen";

/** Ein Vorteil gilt, solange seine Bedingungen erfüllt sind; er verschwindet, wenn sie nicht mehr gelten. */
export interface VorteilDef {
  id: string;
  bereich: "kultur" | "recht" | "militaer" | "infrastruktur" | "haushalt";
  name: string;
  text: string;
  voraus: Voraussetzung[];
  /** Monatliche Dauerwirkung */
  dauer: Effekt[];
  kehrseite: string;
}
