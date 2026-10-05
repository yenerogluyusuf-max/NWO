// Typen der Verträge zwischen der Türkei und einem anderen Land (Verhandlungstisch, sim/abkommen.ts).

import type { Laufzeit } from "../data/abkommen";

export type VertragsStatus = "laeuft" | "ausgelaufen" | "gebrochen" | "gekuendigt";

export interface Vertrag {
  id: string;
  land: string;
  /** Was die Türkei leistet */
  gibt: string[];
  /** Was die Türkei erhält */
  will: string[];
  jahre: Laufzeit;
  /** Spieltag des Abschlusses und des Ablaufs */
  seit: number;
  ablauf: number;
  status: VertragsStatus;
  /** Wie oft die Türkei eine Pflicht verfehlt hat (zwei Verstöße brechen den Vertrag) */
  verstoesse: number;
  /** Letzter Tag der jährlichen Prüfung */
  letztePruefung: number;
  /** Text zum Ende: warum gebrochen, ausgelaufen, gekündigt */
  ende?: string;
}

export interface Angebot {
  land: string;
  gibt: string[];
  will: string[];
  jahre: Laufzeit;
}
