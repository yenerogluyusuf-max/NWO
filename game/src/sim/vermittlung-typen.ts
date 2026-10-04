// Persistenter Zustand der Vermittlung zwischen Drittstaaten (AUS-4), je Konfliktpaar aus data/konflikte.ts.
// Reines JSON, damit Speichern und Laden wie beim übrigen Spielzustand funktionieren.

import type { GarantieArtId, VorbereitungId } from "../data/konflikte";

export interface KonfliktZustand {
  /** Reifegrad (0–100): Schmerz des Patts gegen Schmerz des Kompromisses */
  reif: number;
  /** Intensität des Drittkonflikts (0–100); sinkt nach einer Einigung über Monate */
  konfliktIndex: number;
  /** Aktive türkische Garantie (nach einer Einigung mit Garantiepaket) */
  garantie?: GarantieArtId;
  /** Seit wann die Garantie steht */
  garantieSeit?: number;
  /** Angebotene, noch nicht vereinbarte Garantie (hebt die Aussicht des nächsten Versuchs) */
  garantieAngebot?: GarantieArtId;
  /** Tag der Einigung (Abkommen zwischen den Dritten steht) */
  einigung?: number;
  /** Tag des letzten Spoiler-Ereignisses (Abkühlung) */
  spoilerZuletzt?: number;
  /** Letzter Tag je Vorbereitungshandlung (Abkühlung) */
  vorbereitet: Partial<Record<VorbereitungId, number>>;
  /** Zuletzt gemeldetes Reif-Band (Auto-Stopp B an den Kipppunkten) */
  reifBand?: number;
  /** Monatlicher Reif-Verlauf für die Kurve in der Anzeige (neueste zuletzt, höchstens 24 Einträge) */
  reifVerlauf: { monat: string; wert: number }[];
}
