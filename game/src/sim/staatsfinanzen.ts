import type { World } from "./types";
import { POSTEN } from "./haushalt";
import { migriereHaushalt } from "./wirtschaft";
import { START_EINNAHMEN_BIP, bipMrd, geldbasis, haushaltsRechnung, kassenbestand } from "./staatsgeld";
import { ertragJeArt, steuerZeilen } from "./haushalt-steuern";
import { PLAN_2026 } from "../data/haushaltsplan";

export interface FinanzZeile { id: string; quote: number; mrd: number }

/** Finanzierungsrechnung aus den bereits wirksamen Buchungen. Posten sind Änderungen gegenüber
 * dem Startetat, keine Summe über überlappende Funktions- und Personalausgaben. Keine Buchung beim Lesen.
 * Steuern stellt allein die Maßnahme (sim/haushalt-steuern.ts): Ihr Ertrag steht als Einnahme, nicht als kleinere Ausgabe (Befund D-1).
 * Welle H1: Einnahmen und Ausgaben werden getrennt summiert. Die Ausgaben stehen in Lira fest (Haushaltsgesetz, Plan-BIP); die Einnahmen
 * folgen der Wirtschaft, ihre Abweichung vom Plan ist eine eigene Zeile. Die Lücke ist der Kredit, keine Einnahme. */
export function staatsfinanzen(w: World) {
  const e = w.economy, basis = geldbasis(w), bip = bipMrd(w);
  const gespeichert = w.spiel?.wirtschaft?.haushalt;
  const stufen = gespeichert ? (gespeichert.fassung === 2 ? gespeichert : migriereHaushalt(structuredClone(gespeichert))).stufen : {};
  let ressorts = 0;
  for (const p of POSTEN) ressorts += (stufen[p.id] ?? 0) * p.schritt;
  // Gebucht ist e.policyCost (Monatsabschluss); die Einnahmenseite zeigt den Ertrag der Steuermaßnahmen, der Rest bleibt Ausgabe
  const ertrag = ertragJeArt(w);
  const r = haushaltsRechnung(e, ertrag);
  const steuern = Object.values(ertrag).reduce((s, x) => s + x, 0);
  const p = r.plan, pa = r.plan * r.ausgleich;
  const zeile = (id: string, quote: number): FinanzZeile => ({ id, quote, mrd: quote * bip / 100 });
  // Einnahmen beim Plan-BIP, dazu die Abweichung durch die Wirtschaft (Elastizität der Bemessungsgrundlagen)
  const einnahmen = [
    zeile("startEinnahmen", START_EINNAHMEN_BIP * p),
    zeile("steuern", steuern * p),
    zeile("konjunktur", (r.basis + r.uebergang) * p),
    zeile("wirtschaft", r.einnahmen - r.einnahmenPlan),
  ];
  // Ausgaben: Beschlüsse in % des Plan-BIP, also feste Lira; nur die Zinsen folgen dem Zinsmodell
  const ausgaben = [
    zeile("grundversorgung", (START_EINNAHMEN_BIP + e.deficit - PLAN_2026.zinsenProzentBip) * pa),
    zeile("ressorts", ressorts * pa),
    zeile("weitere", (e.fiscalImpulse - ressorts) * pa),
    zeile("reformen", (e.policyCost + steuern) * pa),
    zeile("zinsen", r.zinsen),
  ];
  const summe = (z: FinanzZeile[]) => z.reduce((s, x) => s + x.mrd, 0);
  const geld = (quote: number) => quote * bip / 100;
  const primaerMrd = geld(r.primaer);
  return {
    basis, bip, einnahmen, ausgaben, rechnung: r,
    /** Die Einnahmen nach Steuern: Satz mal Bemessungsgrundlage je Art, dazu der Ertrag jeder Steuermaßnahme */
    steuern: steuerZeilen(w, r),
    einnahmenMrd: summe(einnahmen), ausgabenMrd: summe(ausgaben),
    kreditMrd: geld(r.defizit),
    /** Welle H1: das Haushaltsjahr im Vollzug (Jahresraten in Mrd. Lira) */
    vollzug: {
      jahr: e.etat?.jahr,
      planWachstum: e.etat?.wachstum, planInflation: e.etat?.inflation,
      einnahmenPlanMrd: geld(r.einnahmenPlan),
      einnahmenMrd: geld(r.einnahmen),
      abweichungMrd: geld(r.einnahmen - r.einnahmenPlan),
      /** Die Primärausgaben sind fest; Inflation über Plan nimmt ihnen Kaufkraft */
      primaerMrd, kaufkraft: r.kaufkraft, kaufkraftVerlustMrd: primaerMrd * (1 - r.kaufkraft),
      /** Kredit, wenn die Wirtschaft genau dem Plan gefolgt wäre */
      kreditPlanMrd: geld(r.ausgaben) - geld(r.einnahmenPlan),
    },
    schuldenMrd: e.debtRatio * bip / 100,
    kasseMrd: kassenbestand(e),
    nettoSchuldenMrd: e.debtRatio * bip / 100 - kassenbestand(e),
    realeEinnahmenMrd: summe(einnahmen) / basis.preise,
    realesWachstum: (basis.real - 1) * 100,
    preisAnstieg: (basis.preise - 1) * 100,
  };
}
