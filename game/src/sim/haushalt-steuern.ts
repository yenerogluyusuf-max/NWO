// Die Einnahmen des Haushalts nach Steuern (Befunde D-1, D-3, B-2): Jede Steuer hat genau eine Stellgröße, die Maßnahme im Politikbereich
// Haushalt (Mehrwertsteuer, Einkommensteuer, Körperschaftsteuer mit echtem Satz, dazu Kraftstoff, Immobilien und Zölle). Der Haushalt zeigt
// dieselbe Zahl: Satz und Ertrag in Lira, und springt zur Maßnahme. Das Aufkommen beim Start verteilt sich wie im Haushaltsgesetz 2026
// (STEUERN_2026); was eine Maßnahme seit dem Start bewegt, ist genau der Betrag, den `policyCost` bucht (Kosten je 100 Stufen, mit
// umgekehrtem Vorzeichen). Lesen bucht nichts.

import type { World } from "./types";
import { NET } from "./modell";
import { nationalAverage, startAverage } from "./netz";
import { bipMrd } from "./staatsgeld";
import { PLAN_2026, STEUERN_2026 } from "../data/haushaltsplan";
import { echterSatz, satzBei, STUFEN_JE_PUNKT, stufenName } from "../data/skalen";
import { t } from "../i18n";

export type SteuerId = "mwst" | "oetv" | "est" | "kst" | "uebrige" | "sonstige";

interface SteuerDef {
  id: SteuerId;
  /** Zeilen des Haushaltsgesetzes 2026, die zu dieser Zeile gehören */
  plan: string[];
  /** Die Stellgröße (Maßnahme im Politikbereich) und weitere Maßnahmen, deren Ertrag hier ankommt */
  massnahme?: string;
  weitere?: string[];
}

/** Reihenfolge wie im Rad: die vier großen Steuern, dann der Rest. */
export const STEUERN: SteuerDef[] = [
  { id: "mwst", plan: ["mwst"], massnahme: "m_mwst" },
  { id: "est", plan: ["est"], massnahme: "m_einkommensteuer" },
  { id: "oetv", plan: ["oetv"], massnahme: "m_kraftstoffsteuer" },
  { id: "kst", plan: ["kst"], massnahme: "m_koerperschaftsteuer" },
  { id: "uebrige", plan: ["bankensteuer", "gebuehren", "zoelle", "stempel", "kfz", "sonst"], weitere: ["m_immobiliensteuer", "m_zoelle", "m_co2_preis", "m_steueramnestie"] },
  { id: "sonstige", plan: [], weitere: ["m_privatisierung", "m_bauamnestie"] },
];

/** Maßnahmen, deren Ertrag auf der Einnahmenseite steht; alle übrigen Maßnahmenkosten bleiben Ausgaben. */
export const EINNAHME_MASSNAHMEN: string[] = STEUERN.flatMap((s) => [...(s.massnahme ? [s.massnahme] : []), ...(s.weitere ?? [])]);

/** Ertrag einer Maßnahme seit dem Start in % des BIP (positiv = mehr Einnahmen), dieselbe Rechnung wie `policyCost`. */
export function massnahmenErtrag(w: World, id: string): number {
  const i = NET.index.get(id);
  const node = i === undefined ? undefined : NET.nodes[i];
  if (!node?.cost) return 0;
  return -((nationalAverage(NET, w.net, id) - startAverage(NET, w.net, id)) / 100) * node.cost;
}

/** Summe aller Einnahmen-Maßnahmen in % des BIP. Für die Bilanz wird sie auf den gebuchten Monatswert umgelegt (sim/staatsfinanzen.ts). */
export const einnahmenAusMassnahmen = (w: World): number => EINNAHME_MASSNAHMEN.reduce((s, id) => s + massnahmenErtrag(w, id), 0);

export interface SteuerZeile {
  id: SteuerId;
  name: string;
  massnahme?: string;
  /** Satz in Prozent heute und beim Amtsantritt (nur Steuern mit echtem Satz) */
  satz?: number;
  satzStart?: number;
  /** Heutiger Stand in Worten („20 %“, „100 % des Ausgangs“) */
  stand?: string;
  /** Ertrag im Jahr in Mrd. Lira und davon seit dem Amtsantritt durch Beschlüsse */
  ertragMrd: number;
  aenderungMrd: number;
  /** Ertrag eines Prozentpunkts in Mrd. Lira im Jahr (nur echte Sätze) */
  mrdJePunkt?: number;
}

/**
 * Die Einnahmen nach Steuern. `grundMrd` ist das Aufkommen ohne Beschlüsse (Grundhaushalt und Konjunktur, aus der Bilanz); es verteilt sich
 * nach den Anteilen von 2026, die Beschlüsse kommen je Zeile dazu. Die Summe aller Zeilen ist genau `grundMrd` plus der Ertrag der Maßnahmen.
 */
export function steuerZeilen(w: World, grundMrd: number): SteuerZeile[] {
  const bip = bipMrd(w);
  const anteil = (ids: string[]) => STEUERN_2026.filter((x) => ids.includes(x.id)).reduce((s, x) => s + x.mrd, 0) / PLAN_2026.einnahmenGesamt;
  const steuernAnteil = STEUERN_2026.reduce((s, x) => s + x.mrd, 0) / PLAN_2026.einnahmenGesamt;
  return STEUERN.map((d) => {
    const ids = [...(d.massnahme ? [d.massnahme] : []), ...(d.weitere ?? [])];
    const aenderungMrd = ids.reduce((s, id) => s + massnahmenErtrag(w, id), 0) * bip / 100;
    const basis = d.id === "sonstige" ? grundMrd * (1 - steuernAnteil) : grundMrd * anteil(d.plan);
    const z: SteuerZeile = { id: d.id, name: t(`n3.steuer.${d.id}`), ertragMrd: basis + aenderungMrd, aenderungMrd };
    if (d.massnahme) {
      const jetzt = nationalAverage(NET, w.net, d.massnahme);
      z.massnahme = d.massnahme;
      z.stand = stufenName(d.massnahme, jetzt);
      const e = echterSatz(d.massnahme);
      if (e) {
        z.satz = satzBei(d.massnahme, jetzt)!;
        z.satzStart = e.satz;
        const node = NET.nodes[NET.index.get(d.massnahme)!]!;
        z.mrdJePunkt = -((node.cost ?? 0) * STUFEN_JE_PUNKT / 100) * bip / 100;
      }
    }
    return z;
  });
}
