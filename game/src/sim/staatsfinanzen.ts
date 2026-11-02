import type { World } from "./types";
import { PLAN_2026 } from "../data/haushaltsplan";
import { POSTEN } from "./haushalt";
import { migriereHaushalt } from "./wirtschaft";
import { bipMrd, defizitQuote, geldbasis, zinsQuote, kassenbestand } from "./staatsgeld";

export interface FinanzZeile { id: string; quote: number; mrd: number }

/** Finanzierungsrechnung aus den bereits wirksamen Buchungen. Posten sind Änderungen gegenüber
 * dem Startetat, keine Summe über überlappende Funktions- und Personalausgaben. Keine Buchung beim Lesen. */
export function staatsfinanzen(w: World) {
  const e = w.economy, basis = geldbasis(w), bip = bipMrd(w);
  const gespeichert = w.spiel?.wirtschaft?.haushalt;
  const stufen = gespeichert ? (gespeichert.fassung === 2 ? gespeichert : migriereHaushalt(structuredClone(gespeichert))).stufen : {};
  let steuern = 0, ressorts = 0;
  for (const p of POSTEN) {
    const d = (stufen[p.id] ?? 0) * p.schritt;
    if (p.seite === "einnahme") steuern += d; else ressorts += d;
  }
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
    zeile("weitere", e.fiscalImpulse - ressorts + steuern),
    zeile("reformen", e.policyCost),
    zeile("zinsen", zinsQuote(e)),
  ];
  const summe = (z: FinanzZeile[]) => z.reduce((s, p) => s + p.mrd, 0);
  return {
    basis, bip, einnahmen, ausgaben,
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
