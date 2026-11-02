// Gemeinsame, gespeicherte Monatsbilanz für Waren, Außenhandel und Streitkräfte.
// Nur Typen und lesende Ableitungen: keine zweite Buchhaltung und keine Initialisierung beim Lesen.
import type { GutId } from "../data/gueter";
import type { World } from "./types";

export type VersorgungsPrioritaet = "ausgewogen" | "zivil" | "militaer";
export interface Lieferweg {
  land: string;
  anteil: number;
  verfuegbar: number;
  grund: "offen" | "krieg" | "sanktion";
}
export interface WarenFluss {
  zusatzImport?: { land: "AZE" | "USA"; menge: number; aufpreisUsdMrd: number };
  anfang: number;
  produktion: number;
  produktionsFaktor: number;
  bestellt: number;
  importiert: number;
  reserveLieferung: number;
  exportiert: number;
  exportSoll: number;
  bedarf: number;
  geliefert: number;
  militaerBedarf: number;
  militaerGeliefert: number;
  ende: number;
  verlust: number;
  fehl: number;
  transport: number;
  hormus: number;
  wege: Lieferweg[];
  importUsdMrd: number;
  exportUsdMrd: number;
  handelsDeltaUsdMrd: number;
}
export interface VersorgungsBilanz {
  monat: string;
  tag: number;
  waren: Partial<Record<GutId, WarenFluss>>;
  handelsDeltaUsdMrd: number;
}

export function letzteVersorgung(w: World): VersorgungsBilanz | undefined {
  return w.spiel?.gueter?.bilanz;
}

/** Anteil erfüllter ziviler Nachfrage. Vor der ersten Abrechnung gilt die Ausgangsversorgung. */
export function warenDeckung(w: World, id: GutId): number {
  const f = letzteVersorgung(w)?.waren[id];
  return f && f.bedarf > 0 ? Math.max(0, Math.min(1, f.geliefert / f.bedarf)) : 1;
}

/** Vorprodukte begrenzen die Produktion im nächsten Monat; keine rekursive Rechnung im selben Schritt. */
export function produktionsVersorgung(w: World, id: GutId): number {
  if (id === "strom") return 0.46 + 0.19 * warenDeckung(w, "erdgas") + 0.35 * warenDeckung(w, "kohle");
  if (id === "stahl" || id === "elektronik" || id === "medikamente") return Math.min(warenDeckung(w, "strom"), 0.7 + 0.3 * warenDeckung(w, "erdgas"));
  if (id === "duenger") return Math.min(warenDeckung(w, "strom"), warenDeckung(w, "erdgas"));
  if (id === "getreide" || id === "obst_gemuese") return 0.6 + 0.2 * warenDeckung(w, "wasser") + 0.2 * warenDeckung(w, "duenger");
  return 1;
}

export function militaerVersorgung(w: World, land?: string): { treibstoff: number; material: number; faktor: number; monat?: string } {
  const b = letzteVersorgung(w);
  const oel = b?.waren.erdoel;
  let treibstoff = oel && oel.militaerBedarf > 0 ? Math.min(1, oel.militaerGeliefert / oel.militaerBedarf) : 1;
  const depots = Object.values(w.spiel?.transport?.bilanz?.depots ?? {}).filter(d => (!land || d.land === land) && w.spiel?.kriege?.some(k => k.land === d.land && (k.phase === "krieg" || k.phase === "waffenruhe")));
  if (depots.length) treibstoff = depots.reduce((n,d)=>n+d.verbraucht,0)/Math.max(1e-9,depots.reduce((n,d)=>n+d.bedarf,0));
  const material = Math.min(warenDeckung(w, "stahl"), warenDeckung(w, "elektronik"), warenDeckung(w, "strom"));
  return { treibstoff, material, faktor: 0.25 + 0.75 * treibstoff, monat: b?.monat };
}

/** Menge und Referenzpreise sind Spielparameter, keine Echtzeit-Rohstoffpreise.
 * Mrd. USD je Dateneinheit; wertbasierte Güter bereits in Mrd. USD. */
export const WAREN_PREIS: Record<GutId, number> = {
  getreide: 0.25, obst_gemuese: 0.7, fleisch_milch: 1.2, zucker_oele: 0.8,
  wasser: 0, strom: 0.08, erdgas: 0.35, erdoel: 0.6, kohle: 0.1,
  stahl: 0.65, bor: 0.5, erze: 0.7, elektronik: 1, medikamente: 1, duenger: 0.4, ruestung: 0,
};
