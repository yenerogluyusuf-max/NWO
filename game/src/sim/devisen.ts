// Außenwirtschaft minimal (WIR-2 aus VERBESSERUNGSPLAN_2026-09-30): die Devisen-Lage als zweite,
// nicht druckbare Staatswährung neben der Lira (RECHERCHE_VERTIEFUNG_WIRTSCHAFT, T7: „eine zweite,
// nicht selbst herstellbare Währung erzwingt Außenpolitik"; eine Stufe-C-Zentralbank deckt nur Lira).
//
//   - Leistungsbilanz: EU-Nachfrage, Energiepreis (Importrechnung, RECHERCHE_ENERGIE), Tourismus,
//     J-Kurve der Abwertung (erst teurere Importe, dann Wettbewerbsfähigkeit), Gold/Sonstiges pauschal.
//   - Reserven: ändern sich um Leistungsbilanz-Saldo plus Kapitalflüsse (auslandskapital-Knoten,
//     Risikoaufschlag, Weltzins) minus Interventionen. Brutto und Netto bewegen sich parallel;
//     der Abstand (Gold, Swaps, Mindestreserven der Banken) bleibt konstant — dokumentierte Modellgrenze.
//   - Interventionen: der Spieler verkauft Reserven gegen Abwertungsdruck (glättet den Kurs,
//     zweischneidige Glaubwürdigkeit, ehrliche Warnung bei niedrigen Netto-Reserven).
//   - Schwellen mit Hysterese: Netto < 25 Mrd. → Druck auf CDS und Kurs (economy.ts); Netto < 10 Mrd.
//     → Zahlungsbilanzkrise im Krisen-Modul (krisen.ts); IWF-Stand-by als Verhandlungsvorgang
//     mit Auflagen und drei Review-Raten.
//
// Alle Zahlen sind Spielparameter der Kalibrierung, keine Tatsachenbehauptungen; die Startwerte
// (Leistungsbilanz −2,3 %, Brutto 174,5 Mrd., Netto 29,1 Mrd.) sind belegte Daten des Szenarios.
// Zusammenhänge mit dem Makro-Kern und Modellgrenzen: kalibrierung/KALIBRIERUNG_LOG.md (WIR-2-Eintrag).

import type { EconomyState, World } from "./types";
import type { DevisenZustand, IwfProgramm } from "./wirtschaft-typen";
import { clamp } from "./economy";
import { NET } from "./modell";
import { nationalAverage, startAverage } from "./netz";
import { addLog, fmt } from "./log";
import { wirke } from "./wirkung";
import { addMarke, defizitJetzt, wirtschaftZustand } from "./wirtschaft";
import { Rng } from "./rng";

/** Spielparameter der Devisen-Lage (Kalibrierung, keine Messwerte). */
export const DEVISEN = {
  /** Sonstige Leistungsbilanz (Warenhandel ohne Energie, Dienste ohne Tourismus, Transfers), % des BIP je Jahr */
  lbBasis: -1.8,
  /** Annäherung der Leistungsbilanz an ihren rechnerischen Zielwert pro Monat */
  lbTempo: 0.25,
  /** Prozentpunkte Leistungsbilanz je Indexpunkt EU-Nachfrage über 100 (EU ist der größte Abnehmer) */
  euAufLb: 0.045,
  /** Prozentpunkte Leistungsbilanz je Indexpunkt Energiepreis über 100 (Importrechnung ~5 % des BIP am Stichtag) */
  oelAufLb: -0.05,
  /** Prozentpunkte Leistungsbilanz je Indexpunkt Tourismus über dem Start */
  tourismusAufLb: 0.03,
  /** J-Kurve: Prozentpunkte je Prozent Abwertung der letzten 6 Monate (Importe werden sofort teurer) */
  jKurveKurz: 0.04,
  /** J-Kurve: Prozentpunkte je Prozent Abwertung der Monate 7–12 (Wettbewerbsfähigkeit wirkt verzögert) */
  jKurveLang: 0.03,
  /** Gold-Importe und Sonstiges, pauschal (% des BIP je Jahr) */
  goldPauschal: -0.35,
  /** Kapitalflüsse: Basiszufluss in % des BIP je Jahr (finanziert das Defizit in ruhigen Zeiten fast) */
  fluesseBasis: 2.2,
  /** Kapitalflüsse je Indexpunkt Auslandskapital (Politiknetz) über dem Start */
  auslandskapitalAufFluss: 0.04,
  /** Kapitalflüsse je 100 Basispunkte Risikoaufschlag über 250 (Flucht vor Risiko) */
  risikoAufFluss: -0.35,
  /** Kapitalflüsse je Indexpunkt Weltzins über 100 (Zinsdifferenz) */
  weltzinsAufFluss: -0.015,
  /** Zusätzlicher Abfluss je Jahr bei aktiver Zahlungsbilanzkrise */
  kriseFlucht: -1.2,
  /** Schwelle des Reserven-Drucks (Netto, Mrd. USD): darunter Zuschlag auf CDS und Abwertung … */
  druckAn: 25,
  /** … und Hysterese: Der Druck endet erst oberhalb dieser Marke wieder */
  druckAus: 30,
  /** Zahlungsbilanzkrise (krisen.ts) an/aus, Mrd. USD netto */
  kriseAn: 10,
  kriseAus: 14,
  /** Ehrliche Warnung der Oberfläche unter diesem Netto-Stand */
  warnungUnter: 20,
  /** Untergrenze der Netto-Reserven (2022 waren sie ohne Swaps zeitweise negativ) */
  nettoBoden: -80,
  intervention: {
    /** Höchstbetrag je Verkaufsaktion, Mrd. USD */
    maxJeSchritt: 10,
    /** Kursstütze je verkaufter Mrd. USD (Anteil; 5 Mrd. ≈ 2 %) */
    glaettungJeMrd: 0.004,
    /** Anteil der Stütze, der sofort im Kurs wirkt; der Rest glättet über die folgenden Wochen */
    sofortAnteil: 0.35,
    /** Glaubwürdigkeitsverlust je Mrd. — nur wenn die Netto-Reserven danach knapp sind (zweischneidig) */
    credibilityJeMrd: 0.004,
    /** Risikoaufschlag je Mrd. bei knappen Reserven (Basispunkte) */
    risikoJeMrd: 0.8,
  },
  iwf: {
    /** Sofortzufluss bei Unterzeichnung, Mrd. USD */
    sofortUsdMrd: 8,
    /** Jede bestandene Review bringt eine Tranche, Mrd. USD */
    trancheUsdMrd: 6,
    /** Anzahl der Review-Raten */
    reviews: 3,
    /** Abstand der Reviews in Tagen (etwa vier Monate) */
    reviewTage: 122,
    /** Auflage: Leitzins mindestens Erwartungsinflation plus dieser Realzins-Puffer */
    zinsPuffer: 3,
    /** Auflage: Defizit-Obergrenze in % des BIP */
    defizitMax: 3.5,
    /** Marktwirkung der Unterzeichnung */
    risikoStart: -40,
    credibilityStart: 0.04,
    /** Marktwirkung je bestandener Review */
    risikoReview: -15,
    /** Preis eines Bruchs (Review nicht bestanden oder Kündigung) */
    risikoBruch: 90,
    credibilityBruch: 0.08,
    /** Abkühlung nach Ende/Bruch, bevor erneut angefragt werden kann (Tage) */
    abkuehlung: 720,
  },
} as const;

const nf = (x: number, d = 1) => x.toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d });

/** Der Zustand der Devisen-Lage; ältere Spielstände legen ihn beim ersten Zugriff an. */
export function devisenZustand(w: World): DevisenZustand {
  const wz = wirtschaftZustand(w);
  wz.devisen ??= { interventionen: [], iwf: null };
  return wz.devisen;
}

/**
 * Migration: Die Spielgrößen der Devisen-Lage aus den Datenfeldern des Szenarios füllen
 * (ältere Spielstände und neue Welten gleichermaßen); die Zuschläge in economy.ts bleiben
 * neutral, solange die Felder fehlen (Lernfall-Replays fahren ohne sie).
 */
export function migriereDevisen(w: World): void {
  const e = w.economy;
  e.leistungsbilanzPctBip ??= e.currentAccountPctGdp ?? DEVISEN.lbBasis + DEVISEN.goldPauschal;
  e.reservenBruttoUsdMrd ??= e.grossReservesUsdBn ?? 0;
  e.reservenNettoUsdMrd ??= e.netReservesExSwapsUsdBn ?? e.reservenBruttoUsdMrd;
  e.reservenDruck ??= 0;
  e.fxPuffer ??= 0;
  aktualisiereReservenDruck(e);
}

/** Nominales BIP in Mrd. USD (abgeleitet aus dem Szenario-Feld bipTryTn und dem aktuellen Kurs). */
export function bipUsdMrd(e: EconomyState): number {
  return ((e.bipTryTn ?? 84) * 1000) / Math.max(1, e.usdTry);
}

/** Treiber der Leistungsbilanz in Prozentpunkten des BIP je Jahr (für Modell und „Warum?“-Zerlegung). */
export interface LbTreiber {
  name: string;
  wert: number;
  text: string;
}

export interface LbZerlegung {
  ziel: number;
  zeilen: LbTreiber[];
}

/** Die rechnerische Zielmarke der Leistungsbilanz und ihre Bausteine. */
export function leistungsbilanzZerlegung(w: World): LbZerlegung {
  const e = w.economy;
  const zeilen: LbTreiber[] = [{ name: "Sonstige Leistungsbilanz", wert: DEVISEN.lbBasis, text: "Warenhandel ohne Energie, Dienste ohne Tourismus, Transfers (pauschal)." }];
  const eu = DEVISEN.euAufLb * ((e.euNachfrage ?? 100) - 100);
  zeilen.push({ name: "Nachfrage aus der EU", wert: eu, text: "Die EU ist der wichtigste Handelspartner; ihre Nachfrage trägt die Exporte." });
  const oel = DEVISEN.oelAufLb * ((e.oel ?? 100) - 100);
  zeilen.push({ name: "Energie-Importrechnung", wert: oel, text: "Öl und Gas werden in Dollar bezahlt; der Preis treibt die Importrechnung (Hormuz-Zuschlag)." });
  const startTourismus = w.spiel ? startAverage(NET, w.net, "tourismus") : 65;
  const tourismus = w.spiel ? DEVISEN.tourismusAufLb * (nationalAverage(NET, w.net, "tourismus") - startTourismus) : 0;
  zeilen.push({ name: "Tourismus", wert: tourismus, text: "Gäste bringen Devisen; eine schwache Lira macht den Urlaub billiger." });
  // J-Kurve: Die Abwertung der jüngsten sechs Monate verteuert Importe sofort (negativ),
  // die der Monate 7–12 stärkt inzwischen die Wettbewerbsfähigkeit (positiv).
  const h = w.history;
  let jKurve = 0;
  let jKurz = 0;
  let jLang = 0;
  if (h.length >= 12) {
    const jetzt = e.usdTry;
    const vor6 = h[h.length - 6]!.usdTry;
    const vor12 = h[h.length - 12]!.usdTry;
    jKurz = -DEVISEN.jKurveKurz * (jetzt / vor6 - 1) * 100;
    jLang = DEVISEN.jKurveLang * (vor6 / vor12 - 1) * 100;
    jKurve = jKurz + jLang;
  }
  zeilen.push({ name: "Abwertung (J-Kurve)", wert: jKurve, text: "Erst verteuert eine schwache Lira die Importe (6 Monate), dann stützt sie Exporte und Tourismus." });
  zeilen.push({ name: "Gold und Sonstiges", wert: DEVISEN.goldPauschal, text: "Gold-Importe der Haushalte als Inflationsschutz, pauschal angesetzt." });
  return { ziel: zeilen.reduce((s, z) => s + z.wert, 0), zeilen };
}

/** Kapitalflüsse in % des BIP je Jahr (positiv = Zufluss) und ihre Bausteine. */
export function kapitalflussZerlegung(w: World): LbZerlegung {
  const e = w.economy;
  const zeilen: LbTreiber[] = [{ name: "Basiszufluss", wert: DEVISEN.fluesseBasis, text: "Kredite, Direktinvestitionen und Portfolio-Zuflüsse in ruhiger Lage." }];
  let auslandskapital = 0;
  if (w.spiel) {
    auslandskapital = DEVISEN.auslandskapitalAufFluss * (nationalAverage(NET, w.net, "auslandskapital") - startAverage(NET, w.net, "auslandskapital"));
  }
  zeilen.push({ name: "Auslandskapital (Politiknetz)", wert: auslandskapital, text: "Investorenfreundliche Politik zieht Geld an; das Netz misst es." });
  const risiko = DEVISEN.risikoAufFluss * Math.max(0, (e.riskPremium - 250) / 100);
  zeilen.push({ name: "Risikoflucht", wert: risiko, text: "Je höher der Risikoaufschlag, desto schneller zieht sich Kapital zurück." });
  const weltzins = DEVISEN.weltzinsAufFluss * ((e.weltzins ?? 100) - 100);
  zeilen.push({ name: "Weltzinsen", wert: weltzins, text: "Hohe Zinsen in den USA und Europa lassen Schwellenländer bluten." });
  if (w.spiel?.krisen?.some((k) => k.id === "zahlungsbilanz")) {
    zeilen.push({ name: "Zahlungsbilanzkrise", wert: DEVISEN.kriseFlucht, text: "Wer die Reserven schwinden sieht, flüchtet zuerst." });
  }
  return { ziel: zeilen.reduce((s, z) => s + z.wert, 0), zeilen };
}

/** Reserven-Druck 0–1 mit Hysterese: an unter 25 Mrd., aus erst über 30 Mrd. — kein Flackern an der Grenze. */
export function aktualisiereReservenDruck(e: EconomyState): void {
  const netto = e.reservenNettoUsdMrd;
  if (netto === undefined) return;
  const war = e.reservenDruck ?? 0;
  if (netto < DEVISEN.druckAn) {
    e.reservenDruck = clamp((DEVISEN.druckAn - netto) / DEVISEN.druckAn, 0, 1);
  } else if (netto >= DEVISEN.druckAus) {
    e.reservenDruck = 0;
  } else {
    e.reservenDruck = war;
  }
}

/** Ein Monat Devisen-Lage: Leistungsbilanz, Reserven, IWF-Review. Läuft nur mit Spielschleife. */
export function devisenMonat(w: World): void {
  if (!w.spiel) return;
  migriereDevisen(w);
  const e = w.economy;
  // Eigener, abgeleiteter Zufallsstrom: Die gemeinsame Folge (Lernfälle, Alttests) bleibt unberührt.
  const rng = new Rng(w.rngState ^ Math.imul(w.day + 7, 0x9e3779b1));

  // Leistungsbilanz zieht zu ihrer Zielmarke
  const lb = leistungsbilanzZerlegung(w);
  e.leistungsbilanzPctBip = (e.leistungsbilanzPctBip ?? lb.ziel) + DEVISEN.lbTempo * (lb.ziel - (e.leistungsbilanzPctBip ?? lb.ziel)) + rng.normal(0.04);

  // Reserven um Saldo und Flüsse fortschreiben (Brutto und Netto parallel; der Abstand bleibt konstant)
  const fluesse = kapitalflussZerlegung(w);
  const deltaUsd = ((e.leistungsbilanzPctBip + fluesse.ziel) / 100 / 12) * bipUsdMrd(e);
  e.reservenBruttoUsdMrd = Math.max(0, (e.reservenBruttoUsdMrd ?? 0) + deltaUsd);
  e.reservenNettoUsdMrd = Math.max(DEVISEN.nettoBoden, (e.reservenNettoUsdMrd ?? 0) + deltaUsd);
  aktualisiereReservenDruck(e);

  // Ehrliche Warnung, wenn die Netto-Reserven knapp werden (mit Spam-Bremse)
  const z = devisenZustand(w);
  if ((e.reservenNettoUsdMrd ?? 99) < DEVISEN.warnungUnter && w.day - (z.warnung ?? -1e9) > 90) {
    z.warnung = w.day;
    addLog(
      w,
      "markt",
      `Die Netto-Reserven der Zentralbank liegen nur noch bei ${nf(e.reservenNettoUsdMrd ?? 0)} Mrd. Dollar.`,
      `Unter ${DEVISEN.druckAn} Mrd. verlangen die Märkte einen Zuschlag auf Kurs und Risikoaufschlag; unter ${DEVISEN.kriseAn} Mrd. droht die Zahlungsbilanzkrise. Devisen lassen sich nicht drucken: Kapital anziehen (Zins, Vertrauen), die Leistungsbilanz bessern — oder der IWF.`,
    );
  }

  iwfReview(w);
}

// ---------------------------------------------------------------------------
// Interventionen: Reserven gegen Abwertungsdruck verkaufen (Spieler-Handlung)

export interface InterventionsVorschau {
  ok: boolean;
  grund?: string;
  usdMrd: number;
  /** Kursstütze insgesamt (%) und davon sofort */
  glaettung: number;
  sofort: number;
  nettoNachher: number;
  bruttoNachher: number;
  /** Warnung, wenn die Netto-Reserven danach knapp sind (zweischneidige Aktion) */
  warnung?: string;
}

export function interventionsVorschau(w: World, usdMrd: number): InterventionsVorschau {
  const e = w.economy;
  migriereDevisen(w);
  const betrag = clamp(usdMrd, 0, DEVISEN.intervention.maxJeSchritt);
  const brutto = e.reservenBruttoUsdMrd ?? 0;
  const netto = e.reservenNettoUsdMrd ?? 0;
  const glaettung = betrag * DEVISEN.intervention.glaettungJeMrd;
  const base: InterventionsVorschau = {
    ok: false,
    usdMrd: betrag,
    glaettung: glaettung * 100,
    sofort: glaettung * DEVISEN.intervention.sofortAnteil * 100,
    nettoNachher: netto - betrag,
    bruttoNachher: brutto - betrag,
  };
  if (!w.spiel) return { ...base, grund: "Ohne Spielschleife gibt es keine Interventionen." };
  if (betrag <= 0) return { ...base, grund: "Kein Betrag gewählt." };
  if (brutto - betrag < 0) return { ...base, grund: `So viel ist nicht da: Die Bruttoreserven liegen bei ${nf(brutto)} Mrd. Dollar.` };
  if (netto - betrag < DEVISEN.nettoBoden) return { ...base, grund: "Die Netto-Reserven sind längst verbraucht; der Markt würde einen Verkauf als Verzweiflung lesen." };
  const knapp = netto - betrag < DEVISEN.warnungUnter;
  return {
    ...base,
    ok: true,
    ...(knapp
      ? {
          warnung: `Danach lägen die Netto-Reserven bei ${nf(netto - betrag)} Mrd. Dollar — unter der Marke von ${DEVISEN.warnungUnter} Mrd. Die Glättung wirkt Wochen, der Verkauf signalisiert Verbrauch: Glaubwürdigkeit und Risikoaufschlag reagieren.`,
        }
      : {}),
  };
}

/**
 * Devisenverkauf zur Kursglättung: kostet Reserven, stützt den Kurs sofort ein Stück und dämpft die
 * Abwertung über die folgenden Wochen (fxPuffer in economy.ts). Bei knappen Netto-Reserven kostet es
 * zusätzlich Glaubwürdigkeit und Risikoaufschlag — die zweischneidige Seite der Verteidigung.
 */
export function interveniere(w: World, usdMrd: number): { ok: boolean; text: string; why?: string } {
  const v = interventionsVorschau(w, usdMrd);
  if (!v.ok) return { ok: false, text: v.grund ?? "Nicht möglich." };
  const e = w.economy;
  const betrag = v.usdMrd;
  e.reservenBruttoUsdMrd = (e.reservenBruttoUsdMrd ?? 0) - betrag;
  e.reservenNettoUsdMrd = (e.reservenNettoUsdMrd ?? 0) - betrag;
  const glaettung = betrag * DEVISEN.intervention.glaettungJeMrd;
  const sofort = glaettung * DEVISEN.intervention.sofortAnteil;
  e.usdTry *= 1 - sofort;
  e.eurTry *= 1 - sofort;
  e.fxPuffer = (e.fxPuffer ?? 0) + glaettung * (1 - DEVISEN.intervention.sofortAnteil);
  const knapp = (e.reservenNettoUsdMrd ?? 0) < DEVISEN.warnungUnter;
  if (knapp) {
    e.credibility = clamp(e.credibility - DEVISEN.intervention.credibilityJeMrd * betrag, 0.05, 0.95);
    e.riskPremium += DEVISEN.intervention.risikoJeMrd * betrag;
  }
  aktualisiereReservenDruck(e);
  const z = devisenZustand(w);
  const text = `Devisenintervention: Die Zentralbank verkauft ${nf(betrag, 0)} Mrd. Dollar und stützt die Lira (etwa ${nf(glaettung * 100)} % Kursstütze über einige Wochen).`;
  const why = knapp
    ? `Netto-Reserven danach ${nf(e.reservenNettoUsdMrd ?? 0)} Mrd. Dollar — unter ${DEVISEN.warnungUnter} Mrd.: Die Märkte lesen den Verkauf als Verbrauch; Glaubwürdigkeit und Risikoaufschlag verschlechtern sich. Die Stütze wirkt nur Wochen, die Reserven sind dauerhaft weg.`
    : `Netto-Reserven danach ${nf(e.reservenNettoUsdMrd ?? 0)} Mrd. Dollar. Die Stütze wirkt einige Wochen; die Reserven sind dauerhaft verkauft.`;
  z.interventionen.push({ tag: w.day, datum: w.date, usdMrd: betrag, text });
  if (z.interventionen.length > 12) z.interventionen.shift();
  addLog(w, "entscheidung", text, why);
  addMarke(w, "eingriff", text);
  return { ok: true, text, why };
}

// ---------------------------------------------------------------------------
// IWF-Stand-by: Devisen-Zufluss und Rating-Stützung gegen Auflagen, drei Review-Raten

/** Ob gerade ein Programm läuft. */
export function iwfAktiv(w: World): boolean {
  return !!w.spiel?.wirtschaft?.devisen?.iwf;
}

/** Ob der IWF (wieder) angefragt werden kann — das Angebot selbst kommt als Ereignis auf den Tisch. */
export function iwfAnfrageMoeglich(w: World): { moeglich: boolean; grund?: string } {
  const e = w.economy;
  if (!w.spiel) return { moeglich: false, grund: "Ohne Spielschleife." };
  if (iwfAktiv(w)) return { moeglich: false, grund: "Ein Programm läuft bereits." };
  const z = w.spiel.wirtschaft?.devisen;
  const rest = (z?.iwfAbkuehlung ?? -1e9) - w.day;
  if (rest > 0) return { moeglich: false, grund: `Nach dem letzten Programm frühestens in ${rest} Tagen wieder.` };
  if (e.riskPremium < 300 && (e.reservenNettoUsdMrd ?? 99) >= DEVISEN.warnungUnter) {
    return { moeglich: false, grund: "Der IWF verhandelt nur, wenn die Lage ernst ist (hoher Risikoaufschlag oder knappe Reserven)." };
  }
  return { moeglich: true };
}

/** Die Auflagen, die der IWF heute stellen würde (für Ereignis und Anzeige). */
export function iwfAuflagen(w: World): { zinsMindest: number; defizitMax: number } {
  const e = w.economy;
  return { zinsMindest: Math.ceil((e.expectedInflation + DEVISEN.iwf.zinsPuffer) * 2) / 2, defizitMax: DEVISEN.iwf.defizitMax };
}

/**
 * Das Stand-by-Abkommen beginnt: Devisen fließen sofort, die Märkte beruhigen sich (Rating-Stützung);
 * dafür gelten Zinsvorgabe-Mindestniveau und Defizit-Obergrenze, geprüft in drei Review-Raten.
 */
export function iwfStarten(w: World): void {
  const spiel = w.spiel;
  if (!spiel) return;
  migriereDevisen(w);
  const e = w.economy;
  const auflagen = iwfAuflagen(w);
  const z = devisenZustand(w);
  z.iwf = {
    rate: 1,
    naechsteReview: w.day + DEVISEN.iwf.reviewTage,
    zinsMindest: auflagen.zinsMindest,
    defizitMax: auflagen.defizitMax,
    mittelUsdMrd: DEVISEN.iwf.sofortUsdMrd,
    bestanden: 0,
  };
  e.reservenBruttoUsdMrd = (e.reservenBruttoUsdMrd ?? 0) + DEVISEN.iwf.sofortUsdMrd;
  e.reservenNettoUsdMrd = (e.reservenNettoUsdMrd ?? 0) + DEVISEN.iwf.sofortUsdMrd;
  e.riskPremium = Math.max(50, e.riskPremium + DEVISEN.iwf.risikoStart);
  e.credibility = clamp(e.credibility + DEVISEN.iwf.credibilityStart, 0.05, 0.95);
  wirke(w, "vertrauen_maerkte", 6);
  aktualisiereReservenDruck(e);
  spiel.hinweise.push({
    id: `iwf-start-${w.day}`,
    titel: "Stand-by-Abkommen mit dem IWF",
    szene: "bank",
    text: [
      `Der IWF stellt sofort ${DEVISEN.iwf.sofortUsdMrd} Mrd. Dollar bereit; die Märkte lesen das Programm als Anker.`,
      `Die Auflagen: Leitzins mindestens ${fmt(auflagen.zinsMindest)} % und Defizit höchstens ${fmt(auflagen.defizitMax)} % des BIP. Drei Reviews prüfen das im Abstand von etwa vier Monaten; wer die Auflagen reißt, verliert das Programm und das Vertrauen der Märkte.`,
    ],
  });
  addLog(
    w,
    "entscheidung",
    `Stand-by-Abkommen mit dem IWF: ${DEVISEN.iwf.sofortUsdMrd} Mrd. Dollar sofort, zwei weitere Tranchen nach Reviews.`,
    `Auflagen: Leitzins ≥ ${fmt(auflagen.zinsMindest)} %, Defizit ≤ ${fmt(auflagen.defizitMax)} % des BIP. Devisen-Zufluss und Rating-Stützung gegen politische Fesseln.`,
  );
  addMarke(w, "eingriff", "Stand-by-Abkommen mit dem IWF");
}

/** Der Bruch des Programms (Review verfehlt oder selbst gekündigt): Der Preis fällt sofort an. */
function iwfBruch(w: World, grund: string): void {
  const spiel = w.spiel!;
  const e = w.economy;
  const z = devisenZustand(w);
  z.iwf = null;
  z.iwfAbkuehlung = w.day + DEVISEN.iwf.abkuehlung;
  e.riskPremium += DEVISEN.iwf.risikoBruch;
  e.credibility = clamp(e.credibility - DEVISEN.iwf.credibilityBruch, 0.05, 0.95);
  wirke(w, "vertrauen_maerkte", -10);
  spiel.hinweise.push({
    id: `iwf-bruch-${w.day}`,
    titel: "Das IWF-Programm ist gescheitert",
    szene: "bank",
    text: [`${grund} Der IWF friert die verbleibenden Tranchen ein; die Märkte beantworten den Bruch mit einem Sprung des Risikoaufschlags.`, "Wer den Anker wegwirft, zahlt den Preis zweimal: bei den Zinsen und beim Vertrauen."],
  });
  addLog(w, "ereignis", `Das IWF-Programm ist gescheitert: ${grund}`, `Risikoaufschlag +${DEVISEN.iwf.risikoBruch}, Glaubwürdigkeit leidet, das Vertrauen der Märkte bricht ein.`);
}

/** Der Spieler kündigt das Programm vorzeitig — derselbe Preis wie ein verfehlter Review-Termin. */
export function iwfKuendigen(w: World): { ok: boolean; text: string; why?: string } {
  if (!w.spiel || !iwfAktiv(w)) return { ok: false, text: "Es läuft kein IWF-Programm." };
  iwfBruch(w, "Die Regierung kündigt das Programm vorzeitig.");
  const text = "Das Stand-by-Abkommen wird vorzeitig beendet.";
  return { ok: true, text, why: `Die verbleibenden Tranchen entfallen; Risikoaufschlag +${DEVISEN.iwf.risikoBruch} Punkte, das Vertrauen der Märkte bricht ein.` };
}

/** Die Review am Fälligkeitstag: Auflagen prüfen, Tranche zahlen oder das Programm brechen. */
export function iwfReview(w: World): void {
  const spiel = w.spiel;
  const z = spiel?.wirtschaft?.devisen;
  const p = z?.iwf;
  if (!spiel || !z || !p || w.day < p.naechsteReview) return;
  const e = w.economy;
  const zinsOk = e.policyRate >= p.zinsMindest;
  const defizitOk = defizitJetzt(w) <= p.defizitMax;
  if (zinsOk && defizitOk) {
    p.bestanden += 1;
    e.riskPremium = Math.max(50, e.riskPremium + DEVISEN.iwf.risikoReview);
    if (p.bestanden >= DEVISEN.iwf.reviews) {
      z.iwf = null;
      z.iwfAbkuehlung = w.day + DEVISEN.iwf.abkuehlung;
      e.credibility = clamp(e.credibility + 0.03, 0.05, 0.95);
      wirke(w, "vertrauen_maerkte", 4);
      spiel.hinweise.push({
        id: `iwf-ende-${w.day}`,
        titel: "Das IWF-Programm ist abgeschlossen",
        szene: "bank",
        text: ["Alle Reviews sind bestanden; die letzte Tranche ist geflossen. Das Land steht wieder auf eigenen Beinen — die Märkte honorieren die gelieferte Disziplin."],
      });
      addLog(w, "ereignis", "Das IWF-Programm endet nach drei bestandenen Reviews.", "Der Anker hat gehalten: Vertrauen und Glaubwürdigkeit steigen.");
    } else {
      p.rate += 1;
      p.naechsteReview = w.day + DEVISEN.iwf.reviewTage;
      e.reservenBruttoUsdMrd = (e.reservenBruttoUsdMrd ?? 0) + DEVISEN.iwf.trancheUsdMrd;
      e.reservenNettoUsdMrd = (e.reservenNettoUsdMrd ?? 0) + DEVISEN.iwf.trancheUsdMrd;
      p.mittelUsdMrd += DEVISEN.iwf.trancheUsdMrd;
      aktualisiereReservenDruck(e);
      addLog(
        w,
        "ereignis",
        `IWF-Review bestanden (${p.bestanden} von ${DEVISEN.iwf.reviews}): Die nächste Tranche von ${DEVISEN.iwf.trancheUsdMrd} Mrd. Dollar fließt.`,
        "Die Prüfer bestätigen die Auflagen; die Märkte beruhigen sich weiter.",
      );
    }
  } else {
    const fehl: string[] = [];
    if (!zinsOk) fehl.push(`der Leitzins liegt bei ${fmt(e.policyRate)} % statt mindestens ${fmt(p.zinsMindest)} %`);
    if (!defizitOk) fehl.push(`das Defizit liegt bei ${fmt(defizitJetzt(w))} % statt höchstens ${fmt(p.defizitMax)} %`);
    iwfBruch(w, `Die Review scheitert: ${fehl.join(" und ")}.`);
  }
}

/** Anzeige des laufenden Programms (Suzerain-Klammer: Was fehlt noch, wie viel Spielraum bleibt). */
export interface IwfSicht {
  aktiv: boolean;
  rate: number;
  reviews: number;
  tageBisReview: number;
  zinsMindest: number;
  zinsJetzt: number;
  zinsOk: boolean;
  /** Spielraum in Prozentpunkten (positiv = erfüllt) */
  zinsSpielraum: number;
  defizitMax: number;
  defizitJetzt: number;
  defizitOk: boolean;
  /** Spielraum in Prozentpunkten (positiv = erfüllt) */
  defizitSpielraum: number;
  mittelUsdMrd: number;
  bestanden: number;
  /** Ein Satz, der Lage und Spielraum zusammenfasst */
  zeile: string;
}

export function iwfSicht(w: World): IwfSicht | null {
  const p = w.spiel?.wirtschaft?.devisen?.iwf;
  if (!p) return null;
  const e = w.economy;
  const defizit = defizitJetzt(w);
  const zinsOk = e.policyRate >= p.zinsMindest;
  const defizitOk = defizit <= p.defizitMax;
  const tage = Math.max(0, p.naechsteReview - w.day);
  const monate = Math.floor(tage / 30.4);
  const spielraumZins = e.policyRate - p.zinsMindest;
  const spielraumDefizit = p.defizitMax - defizit;
  const teile: string[] = [];
  teile.push(zinsOk ? `Zins ${fmt(spielraumZins)} Punkte über der Auflage` : `Zins ${fmt(-spielraumZins)} Punkte unter der Auflage`);
  teile.push(defizitOk ? `Defizit ${fmt(spielraumDefizit)} Punkte unter der Obergrenze` : `Defizit ${fmt(-spielraumDefizit)} Punkte über der Obergrenze`);
  const zeile = `Review ${p.rate} von ${DEVISEN.iwf.reviews} in ${tage} Tagen (${monate > 0 ? `−${monate} ${monate === 1 ? "Monat" : "Monate"} Spielraum` : "weniger als ein Monat Spielraum"}): ${teile.join(", ")}.`;
  return {
    aktiv: true,
    rate: p.rate,
    reviews: DEVISEN.iwf.reviews,
    tageBisReview: tage,
    zinsMindest: p.zinsMindest,
    zinsJetzt: e.policyRate,
    zinsOk,
    zinsSpielraum: spielraumZins,
    defizitMax: p.defizitMax,
    defizitJetzt: defizit,
    defizitOk,
    defizitSpielraum: spielraumDefizit,
    mittelUsdMrd: p.mittelUsdMrd,
    bestanden: p.bestanden,
    zeile,
  };
}
