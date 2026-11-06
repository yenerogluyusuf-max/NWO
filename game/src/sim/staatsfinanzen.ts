import type { World } from "./types";
import { PLAN_2026 } from "../data/haushaltsplan";
import { POSTEN } from "./haushalt";
import { migriereHaushalt } from "./wirtschaft";
import { bipMrd, defizitQuote, geldbasis, zinsQuote, kassenbestand } from "./staatsgeld";
import { einnahmenAusMassnahmen, steuerZeilen } from "./haushalt-steuern";

export interface FinanzZeile { id: string; quote: number; mrd: number }

/** Finanzierungsrechnung aus den bereits wirksamen Buchungen. Posten sind Änderungen gegenüber
 * dem Startetat, keine Summe über überlappende Funktions- und Personalausgaben. Keine Buchung beim Lesen.
 * Steuern stellt allein die Maßnahme (sim/haushalt-steuern.ts): Ihr Ertrag steht als Einnahme, nicht als kleinere Ausgabe (Befund D-1). */
export function staatsfinanzen(w: World) {
  const e = w.economy, basis = geldbasis(w), bip = bipMrd(w);
  const gespeichert = w.spiel?.wirtschaft?.haushalt;
  const stufen = gespeichert ? (gespeichert.fassung === 2 ? gespeichert : migriereHaushalt(structuredClone(gespeichert))).stufen : {};
  let ressorts = 0;
  for (const p of POSTEN) ressorts += (stufen[p.id] ?? 0) * p.schritt;
  // Gebucht ist e.policyCost (Monatsabschluss); die Einnahmenseite zeigt den Ertrag der Steuermaßnahmen, der Rest bleibt Ausgabe
  const steuern = einnahmenAusMassnahmen(w);
  const startEinnahmen = PLAN_2026.einnahmenGesamt / PLAN_2026.mrdProProzentBip;
  const zeile = (id: string, quote: number): FinanzZeile => ({ id, quote, mrd: quote * bip / 100 });
  const einnahmen = [
    zeile("startEinnahmen", startEinnahmen),
    zeile("steuern", steuern),
    zeile("konjunktur", e.konjunkturSaldo ?? 0),
  ];
  const ausgaben = [
    zeile("grundversorgung", startEinnahmen + e.deficit - PLAN_2026.zinsenProzentBip),
    zeile("ressorts", ressorts),
    zeile("weitere", e.fiscalImpulse - ressorts),
    zeile("reformen", e.policyCost + steuern),
    zeile("zinsen", zinsQuote(e)),
  ];
  const summe = (z: FinanzZeile[]) => z.reduce((s, p) => s + p.mrd, 0);
  return {
    basis, bip, einnahmen, ausgaben,
    /** Die Einnahmen nach Steuern: Grundaufkommen ohne Beschlüsse nach den Anteilen von 2026, dazu der Ertrag jeder Steuermaßnahme */
    steuern: steuerZeilen(w, summe(einnahmen.filter((z) => z.id !== "steuern"))),
    einnahmenMrd: summe(einnahmen), ausgabenMrd: summe(ausgaben),
    kreditMrd: defizitQuote(e) * bip / 100,
    schuldenMrd: e.debtRatio * bip / 100,
    kasseMrd: kassenbestand(e),
    nettoSchuldenMrd: e.debtRatio * bip / 100 - kassenbestand(e),
    realeEinnahmenMrd: summe(einnahmen) / basis.preise,
    realesWachstum: (basis.real - 1) * 100,
    preisAnstieg: (basis.preise - 1) * 100,
  };
}
