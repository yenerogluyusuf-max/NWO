// Die Einnahmen des Haushalts nach Steuern (Befunde D-1, D-3, B-2): Jede Steuer hat genau eine Stellgröße, die Maßnahme im Politikbereich
// Haushalt (Mehrwertsteuer, Einkommensteuer, Körperschaftsteuer mit echtem Satz, dazu Kraftstoff, Immobilien und Zölle). Der Haushalt zeigt
// dieselbe Zahl: Satz und Ertrag in Lira, und springt zur Maßnahme. Das Aufkommen beim Start verteilt sich wie im Haushaltsgesetz 2026
// (STEUERN_2026); was eine Maßnahme seit dem Start bewegt, ist genau der Betrag, den `policyCost` bucht (Kosten je 100 Stufen, mit
// umgekehrtem Vorzeichen), bezogen auf das Plan-BIP. Unter dem Jahr folgt die Bemessungsgrundlage dem nominalen BIP (Welle H1,
// sim/staatsgeld.ts `haushaltsRechnung`). Lesen bucht nichts.

import type { World } from "./types";
import { NET } from "./modell";
import { nationalAverage, startAverage } from "./netz";
import { bipMrd } from "./staatsgeld";
import { EINNAHMEN_ANTEIL, EINNAHMEN_ARTEN, type SteuerArt } from "../data/haushaltsplan";
import type { HaushaltsRechnung } from "./staatsgeld";
import { echterSatz, satzBei, STUFEN_JE_PUNKT, stufenName } from "../data/skalen";
import { t } from "../i18n";

export type SteuerId = SteuerArt;

interface SteuerDef {
  id: SteuerId;
  /** Zeilen des Haushaltsgesetzes 2026, die zu dieser Zeile gehören */
  plan: string[];
  /** Die Stellgröße (Maßnahme im Politikbereich) und weitere Maßnahmen, deren Ertrag hier ankommt */
  massnahme?: string;
  weitere?: string[];
}

/** Die Zeilen des Haushaltsgesetzes je Steuerart stehen mit der Elastizität in data/haushaltsplan.ts (eine Quelle). */
const planVon = (id: SteuerArt): string[] => EINNAHMEN_ARTEN.find((a) => a.id === id)!.plan;

/** Reihenfolge wie im Rad: die vier großen Steuern, dann der Rest. */
export const STEUERN: SteuerDef[] = [
  { id: "mwst", plan: planVon("mwst"), massnahme: "m_mwst" },
  { id: "est", plan: planVon("est"), massnahme: "m_einkommensteuer" },
  { id: "oetv", plan: planVon("oetv"), massnahme: "m_kraftstoffsteuer" },
  { id: "kst", plan: planVon("kst"), massnahme: "m_koerperschaftsteuer" },
  { id: "uebrige", plan: planVon("uebrige"), weitere: ["m_immobiliensteuer", "m_zoelle", "m_co2_preis", "m_steueramnestie"] },
  { id: "sonstige", plan: planVon("sonstige"), weitere: ["m_privatisierung", "m_bauamnestie"] },
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

/** Ertrag der Maßnahmen je Steuerart in % des (Plan-)BIP, dieselbe Rechnung wie `policyCost` (Welle H1: Grundlage der Elastizitäten). */
export function ertragJeArt(w: World): Record<SteuerId, number> {
  return Object.fromEntries(STEUERN.map((d) => [d.id, [...(d.massnahme ? [d.massnahme] : []), ...(d.weitere ?? [])].reduce((s, id) => s + massnahmenErtrag(w, id), 0)])) as Record<SteuerId, number>;
}

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
  /** Welle H1: was das Haushaltsgesetz bei diesem Satz eingeplant hat (Plan-BIP), in Mrd. Lira im Jahr */
  planMrd: number;
  /** Elastizität der Bemessungsgrundlage gegenüber dem nominalen BIP (data/haushaltsplan.ts) */
  elastizitaet: number;
  /** Ertrag eines Prozentpunkts in Mrd. Lira im Jahr (nur echte Sätze) */
  mrdJePunkt?: number;
}

/**
 * Die Einnahmen nach Steuern aus der Jahresrechnung (sim/staatsgeld.ts `haushaltsRechnung`): je Art Satz mal Bemessungsgrundlage, die
 * Grundlage folgt dem nominalen BIP mit der Elastizität der Art. Die Steuerbasis jenseits der Sätze (Steuermoral, Verwaltung) verteilt sich
 * nach den Anteilen von 2026. Die Summe aller Zeilen ist genau die Einnahmenseite der Rechnung.
 */
export function steuerZeilen(w: World, r: HaushaltsRechnung): SteuerZeile[] {
  const bip = bipMrd(w), zusatz = r.basis + r.uebergang;
  return STEUERN.map((d) => {
    const art = EINNAHMEN_ARTEN.find((a) => a.id === d.id)!, faktor = Math.pow(r.plan, 1 - art.elastizitaet);
    const aenderungMrd = r.ertrag[d.id] * faktor * bip / 100;
    const z: SteuerZeile = { id: d.id, name: t(`n3.steuer.${d.id}`), elastizitaet: art.elastizitaet,
      ertragMrd: (r.steuern[d.id] + zusatz * EINNAHMEN_ANTEIL[d.id]) * bip / 100,
      planMrd: (r.steuernPlan[d.id] + zusatz * EINNAHMEN_ANTEIL[d.id] * r.plan) * bip / 100, aenderungMrd };
    if (d.massnahme) {
      const jetzt = nationalAverage(NET, w.net, d.massnahme);
      z.massnahme = d.massnahme;
      z.stand = stufenName(d.massnahme, jetzt);
      const e = echterSatz(d.massnahme);
      if (e) {
        z.satz = satzBei(d.massnahme, jetzt)!;
        z.satzStart = e.satz;
        const node = NET.nodes[NET.index.get(d.massnahme)!]!;
        z.mrdJePunkt = -((node.cost ?? 0) * STUFEN_JE_PUNKT / 100) * faktor * bip / 100;
      }
    }
    return z;
  });
}
