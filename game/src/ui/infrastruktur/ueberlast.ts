// Überlast der Netze je Provinz, so gemessen, dass die Karte Unterschiede zeigt (Welle 1, E5; karte.md Befund 5).
//
// Vorher färbten „Lage der Regionen“ und die Linse „Belastung“ nach dem am stärksten ausgelasteten Netz. Im Spielstand des Inhabers (2043)
// steht das Stromnetz in allen 81 Provinzen an der Obergrenze von 140 % (AUSLASTUNG_MAX), die Spanne war 139,4 bis 139,9 %: Das ganze
// Land war gleich rot, obwohl eine Provinz ein überlastetes Netz hatte und eine andere sechs. Jetzt zählt die Überlast aller Netze der
// Provinz zusammen: die Summe der Auslastung über dem Vollstand (SCHWELLE.voll). Netze, die überall überlastet sind, nennt die Legende
// eigens, weil ihr Ausbau kein Ort ist, sondern eine Aufgabe des ganzen Landes.

import { auslastung, NETZE, type NetzId } from "../../sim/infrastruktur";
import { AUSLASTUNG_MAX, SCHWELLE } from "../../data/infrastruktur-netze";
import { PROVINCES } from "../../sim/netz";
import type { World } from "../../sim/types";

export interface ProvinzUeberlast {
  plaka: number;
  /** Summe der Auslastung über dem Vollstand, über alle Netze der Provinz */
  summe: number;
  /** Zahl der Netze ab „überlastet“ (SCHWELLE.ueberlast) */
  anzahl: number;
  /** Überlastete Netze, die nicht im ganzen Land überlastet sind: was gerade diese Provinz von den anderen unterscheidet */
  eigene: number;
  /** Das am stärksten ausgelastete Netz */
  netz: NetzId;
  a: number;
  /** 0 (keine Überlast) bis 1 (die am stärksten belastete Provinz, mindestens zwei Netze an der Obergrenze): die Farbe */
  not: number;
}

/**
 * Untergrenze des Maßstabs: zwei Netze an der Obergrenze. Darunter wird nicht gestreckt, damit ein ruhiges Land nicht rot erscheint
 * (Spielparameter).
 */
export const UEBERLAST_MASSSTAB = 2 * (AUSLASTUNG_MAX - SCHWELLE.voll);

export function ueberlastJeProvinz(w: World): { provinzen: ProvinzUeberlast[]; ueberall: NetzId[] } {
  if (!w.spiel) return { provinzen: [], ueberall: [] };
  const regional = NETZE.filter((n) => n.start.art !== "land");
  const ueberallOk = new Map<NetzId, boolean>(regional.map((n) => [n.id, true]));
  const roh: (Omit<ProvinzUeberlast, "not" | "eigene"> & { ueber: NetzId[] })[] = [];
  for (let p = 1; p <= PROVINCES; p++) {
    let summe = 0;
    let anzahl = 0;
    const ueber: NetzId[] = [];
    let best: { netz: NetzId; a: number } | null = null;
    for (const n of regional) {
      const a = auslastung(w, n.id, p);
      if (a === null) continue;
      summe += Math.max(0, a - SCHWELLE.voll);
      if (a >= SCHWELLE.ueberlast) {
        anzahl++;
        ueber.push(n.id);
      }
      else ueberallOk.set(n.id, false);
      if (!best || a > best.a) best = { netz: n.id, a };
    }
    if (best) roh.push({ plaka: p, summe, anzahl, ueber, ...best });
  }
  const massstab = Math.max(UEBERLAST_MASSSTAB, ...roh.map((x) => x.summe));
  const ueberall = [...ueberallOk].filter(([, ok]) => ok).map(([id]) => id);
  return {
    provinzen: roh.map(({ ueber, ...x }) => ({ ...x, eigene: ueber.filter((id) => !ueberall.includes(id)).length, not: Math.min(1, x.summe / massstab) })),
    ueberall,
  };
}
