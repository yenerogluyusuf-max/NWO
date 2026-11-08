// Vorgänge des Machtkreises aus Welle M1 (8. November 2026): Abspaltung und Säuberung mit Anlass.
//
//   kreis_abspaltung  Der gebrochene Kronprinz sammelt Getreue für eine eigene Partei: versöhnen, den Ausschluss beschleunigen oder
//                     gewähren lassen. Regeln und Belege (Gelecek 2019, DEVA 2020, İYİ 2017) in sim/abspaltung.ts.
//   kreis_saeuberung  Nach einem gescheiterten Putschversuch: den Apparat säubern, nur die Verschwörer vor Gericht stellen oder die
//                     Gerichte arbeiten lassen. Die Säuberung ist kein freier Hebel mehr (machtkreis_dienst.md, M4).
//
// Beide kommen fest, wenn der Anlass besteht (eigener Platz, fester Tag, eigener Wurf: keine Zahl aus dem Strom der Partie). Jede Zahl unter
// einer Antwort ist die Zahl, die sie bucht.

import { t, zahl as zahlFmt } from "../i18n";
import { opt } from "./ereignis-hilfen";
import type { Option, Vorlage } from "./ereignis-hilfen";
import { wirke } from "./wirkung";
import { ABSPALTUNG, abspaltungGroesse, beschleunige, drohendeAbspaltung, gruendungsDatum, kuendigeAn, versoehne } from "./abspaltung";
import { SAEUBERUNG_FOLGEN, machtkreis, nebenVon, saeubere, schluesselVon, zeigeSzene } from "./machtkreis";
import { msg } from "../i18n";
import type { World } from "./types";
import type { OffenesEreignis } from "./spiel-typen";

const zahl = (x: number): string => `${x > 0 ? "+" : x < 0 ? "−" : ""}${zahlFmt(Math.abs(x), Number.isInteger(x) ? 0 : 1)}`;
const zumKreis = (ev: OffenesEreignis): NonNullable<Option["stelle"]> => ({ art: "machtkreis", ...(ev.daten?.a ? { person: String(ev.daten.a) } : {}) });

// ---------------------------------------------------------------------------
// Abspaltung

const ABSPALTUNG_VORGANG: Vorlage = {
  id: "kreis_abspaltung",
  eigenerWurf: true,
  eigenerPlatz: true,
  tag: 2,
  szene: "parlament",
  frist: 30,
  abkuehlung: 60,
  chance: (w) => {
    const a = drohendeAbspaltung(w);
    return a && !a.gemeldet ? 1 : 0;
  },
  erzeuge: (w) => {
    const a = drohendeAbspaltung(w);
    const kp = nebenVon(w, "kronprinz");
    if (!kp) return null;
    return { provinzen: [], staerke: 2, daten: { a: schluesselVon(kp), name: a?.gruender ?? kp.name } };
  },
  eroeffne: (w) => {
    // Im Spiel öffnet der Vorgang nur bei angekündigtem Bruch; wird er ohne geöffnet (Textprüfung), kündigt der Kronprinz ihn jetzt an
    const kp = nebenVon(w, "kronprinz");
    const a = drohendeAbspaltung(w) ?? (kp ? kuendigeAn(w, kp) : undefined);
    if (a) a.gemeldet = true;
  },
  titel: (w, ev) => t("welle_m1.abspaltung.titel", { name: String(ev.daten?.name ?? drohendeAbspaltung(w)?.gruender ?? "") }),
  text: (w, ev) => {
    const a = drohendeAbspaltung(w);
    if (!a) return [t("welle_m1.abspaltung.text_vorbei", { name: String(ev.daten?.name ?? "") })];
    const g = abspaltungGroesse(a.einfluss);
    return [
      t("welle_m1.abspaltung.text1", { name: a.gruender, tage: Math.max(0, a.gruendung - w.day), datum: gruendungsDatum(w, a) }),
      t("welle_m1.abspaltung.text2", { anteil: g.anteil, n: g.abgeordnete, eigene: Math.round(w.parliament?.seats[w.player?.partei.kurz ?? ""] ?? 0) }),
    ];
  },
  warum: () => t("welle_m1.abspaltung.warum"),
  stelle: (_w, ev) => zumKreis(ev),
  optionen: (w, ev) => {
    const a = drohendeAbspaltung(w);
    const einfluss = a?.einfluss ?? 50;
    const voll = abspaltungGroesse(einfluss);
    const klein = abspaltungGroesse(einfluss, ABSPALTUNG.beschleunigen.faktor);
    const druck = Math.round(machtkreis(w).nachfolge);
    const q = ABSPALTUNG;
    return [
      {
        ...opt("versoehnen", t("welle_m1.abspaltung.versoehnen.label"), t("welle_m1.abspaltung.versoehnen.beschr", { name: a?.gruender ?? "" }), q.versoehnen.pk, (ww) => versoehne(ww)),
        stelle: zumKreis(ev),
        bedingungen: [t("welle_m1.abspaltung.versoehnen.zahlen", { vorher: druck, nachher: Math.min(100, druck + q.versoehnen.druck), loy: zahl(q.versoehnen.loyalitaet) })],
      },
      {
        ...opt("beschleunigen", t("welle_m1.abspaltung.beschleunigen.label"), t("welle_m1.abspaltung.beschleunigen.beschr"), q.beschleunigen.pk, (ww) => beschleunige(ww)),
        stelle: zumKreis(ev),
        bedingungen: [t("welle_m1.abspaltung.zahlen", { anteil: klein.anteil, n: klein.abgeordnete }), t("welle_m1.abspaltung.beschleunigen.zahlen", { angst: zahl(q.beschleunigen.angst), druck: zahl(q.nachher.druck) })],
      },
      {
        // Ehrliches Nichtstun: Die Gründung kommt zum angekündigten Tag
        ...opt("abwarten", t("welle_m1.abspaltung.gewaehren.label"), t("welle_m1.abspaltung.gewaehren.beschr", { datum: a ? gruendungsDatum(w, a) : w.date }), 0, (ww) => t("welle_m1.abspaltung.gewaehren.aus", { name: drohendeAbspaltung(ww)?.gruender ?? "" })),
        stelle: zumKreis(ev),
        bedingungen: [t("welle_m1.abspaltung.zahlen", { anteil: voll.anteil, n: voll.abgeordnete }), t("welle_m1.abspaltung.gewaehren.zahlen", { druck: zahl(q.nachher.druck), vertrauen: zahl(q.nachher.vertrauen) })],
      },
    ];
  },
  standard: (w) => t("welle_m1.abspaltung.gewaehren.aus", { name: drohendeAbspaltung(w)?.gruender ?? "" }),
};

// ---------------------------------------------------------------------------
// Säuberung nach einem gescheiterten Putschversuch

/**
 * Vorbild 15.07.2016: Nach Angaben des OHCHR (Bericht vom März 2018, zitiert bei SCF, stockholmcf.org/?p=23999) wurden per Notstandsdekret
 * rund 152.000 Staatsbedienstete entlassen. Das Europäische Parlament forderte am 24.11.2016 mit 479 zu 37 Stimmen bei 107 Enthaltungen,
 * die Beitrittsgespräche vorübergehend einzufrieren (OEIL, Verfahrensakte, Dokument 1465590). Die Größen im Spiel sind Spielparameter.
 */
export const SAEUBERUNG = {
  /** So lange nach dem Versuch kommt der Vorgang (Tage) */
  fenster: 90,
  /** Den Apparat säubern: die Folgen von `saeubere` (sim/machtkreis.ts) und dazu */
  saeubern: { pk: 2, eu: -3, pressefreiheit: -2, schutzTage: 730 },
  /** Nur die Verschwörer vor Gericht */
  gericht: { pk: 1, angst: 4, offiziersvertrauen: 2, eu: 1, schutzTage: 365 },
  /** Die Gerichte arbeiten lassen (ohne eigene Weisung) */
  liegen: { offiziersvertrauen: -2 },
} as const;

/** Tag des Putschversuchs, auf den noch keine Antwort kam. */
function offenerVersuch(w: World): number | undefined {
  const sp = w.spiel;
  const tag = sp?.enden?.putsch.letzterVersuch;
  if (!sp?.machtkreis || tag === undefined || sp.ende) return undefined;
  if (w.day - tag > SAEUBERUNG.fenster || sp.machtkreis.putschAntwort === tag) return undefined;
  return tag;
}

function schuetze(w: World, tage: number): void {
  const enden = w.spiel?.enden;
  if (enden) enden.putsch.geschuetztBis = Math.max(enden.putsch.geschuetztBis ?? 0, w.day + tage);
}

const SAEUBERUNG_VORGANG: Vorlage = {
  id: "kreis_saeuberung",
  eigenerWurf: true,
  eigenerPlatz: true,
  tag: 2,
  szene: "istanbul",
  frist: 20,
  abkuehlung: 30,
  chance: (w) => (offenerVersuch(w) !== undefined ? 1 : 0),
  // Im Spiel nur nach einem Putschversuch (chance); ohne Versuch geöffnet (Textprüfung) zählt der heutige Tag als Anlass
  erzeuge: (w) => (w.spiel ? { provinzen: [], staerke: 3, daten: { versuch: offenerVersuch(w) ?? w.day } } : null),
  eroeffne: (w, ev) => {
    const mk = machtkreis(w);
    mk.putschAntwort = Number(ev.daten?.versuch ?? w.day);
  },
  titel: () => t("welle_m1.saeuberung.titel"),
  text: (w) => [t("welle_m1.saeuberung.text1", { angst: Math.round(machtkreis(w).angst) }), t("welle_m1.saeuberung.text2")],
  warum: () => t("welle_m1.saeuberung.warum"),
  stelle: () => ({ art: "machtkreis" }),
  optionen: (w) => {
    const q = SAEUBERUNG;
    const euOffen = !!w.spiel?.eu && w.spiel.eu.phase !== "eingefroren";
    return [
      {
        ...opt("saeubern", t("welle_m1.saeuberung.saeubern.label"), t("welle_m1.saeuberung.saeubern.beschr"), q.saeubern.pk, (ww) => {
          saeubere(ww);
          wirke(ww, "beziehungen_eu", q.saeubern.eu);
          wirke(ww, "pressefreiheit", q.saeubern.pressefreiheit);
          schuetze(ww, q.saeubern.schutzTage);
          const eu = ww.spiel?.eu;
          if (eu && eu.phase !== "eingefroren") eu.phase = "eingefroren";
          zeigeSzene(ww, "saeuberung", msg("welle_m1.saeuberung.szene"), [], t("mk.stempel.saeuberung"));
          return t("welle_m1.saeuberung.saeubern.aus");
        }),
        stelle: { art: "machtkreis" },
        bedingungen: [
          t("welle_m1.saeuberung.saeubern.zahlen", { monate: Math.round(q.saeubern.schutzTage / 30), angst: zahl(SAEUBERUNG_FOLGEN.angst), kompetenz: zahl(SAEUBERUNG_FOLGEN.kompetenz), eu: zahl(q.saeubern.eu + SAEUBERUNG_FOLGEN.eu), presse: zahl(q.saeubern.pressefreiheit + SAEUBERUNG_FOLGEN.pressefreiheit) }),
          t(euOffen ? "welle_m1.saeuberung.saeubern.eu_friert" : "welle_m1.saeuberung.saeubern.eu_schon"),
        ],
      },
      {
        ...opt("gericht", t("welle_m1.saeuberung.gericht.label"), t("welle_m1.saeuberung.gericht.beschr"), q.gericht.pk, (ww) => {
          const mk = machtkreis(ww);
          mk.angst = Math.min(100, mk.angst + q.gericht.angst);
          wirke(ww, "offiziersvertrauen", q.gericht.offiziersvertrauen);
          wirke(ww, "beziehungen_eu", q.gericht.eu);
          schuetze(ww, q.gericht.schutzTage);
          return t("welle_m1.saeuberung.gericht.aus");
        }),
        stelle: { art: "machtkreis" },
        bedingungen: [t("welle_m1.saeuberung.gericht.zahlen", { monate: Math.round(q.gericht.schutzTage / 30), angst: zahl(q.gericht.angst), eu: zahl(q.gericht.eu) })],
      },
      {
        ...opt("abwarten", t("welle_m1.saeuberung.abwarten.label"), t("welle_m1.saeuberung.abwarten.beschr"), 0, (ww) => saeuberungLiegen(ww)),
        stelle: { art: "machtkreis" },
        bedingungen: [t("welle_m1.saeuberung.abwarten.zahlen", { offiziere: zahl(q.liegen.offiziersvertrauen) })],
      },
    ];
  },
  standard: (w) => saeuberungLiegen(w),
};

function saeuberungLiegen(w: World): string {
  wirke(w, "offiziersvertrauen", SAEUBERUNG.liegen.offiziersvertrauen);
  return t("welle_m1.saeuberung.abwarten.aus");
}

export const M1_VORLAGEN: Vorlage[] = [ABSPALTUNG_VORGANG, SAEUBERUNG_VORGANG];
