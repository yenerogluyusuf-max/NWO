// Vorgangs-Ereignisse der Verfassungsreform (REC-1): Parlamentsabstimmung, Entscheidung des
// Verfassungsgerichts, Referendum-Nacht und die Proteste der Gegenreaktion. Sie werden nicht vom
// Zufallsmotor gezogen (chance 0), sondern vom Kern der Verfassungsfrage (sim/verfassung.ts) zum
// festgesetzten Tag geöffnet — jede Stufe ist ein Auto-Stopp der Klasse A, weil sie als
// Entscheidungs-Ereignis auf den Tisch kommt.

import { vertrauenAendern, wirke } from "./wirkung";
import { addDays, formatDateDe } from "./dates";
import type { Vorlage } from "./ereignis-hilfen";
import {
  VERFASSUNG_REGELN,
  aymEntscheiden,
  aymSicht,
  autoritaerScore,
  geaenderteArtikel,
  paketStimmen,
  referendumAuszaehlen,
  referendumPrognose,
  verfassungAbstimmen,
  zieheVerfassungZurueck,
} from "./verfassung";
import type { World } from "./types";
import { liste, t } from "../i18n";

// Texte (Befund A-1, 6. November 2026): alle aus dem Katalog (i18n/katalog/*/nacht_n5_kv.json, Schlüssel ev.<vorlage>.*).

/**
 * Die geänderten Artikel als Aufzählung „Artikel: Variante“. Ohne laufenden Vorgang (die Proteste öffnen, wenn das Paket schon
 * in Kraft ist) die geltende Fassung der Verfassung; ist nichts geändert, ein allgemeiner Name.
 */
const paketNamen = (w: World): string => {
  const z = w.spiel?.verfassungsvorgang;
  const paket = z?.laufend?.paket ?? z?.aktiv ?? {};
  const namen = geaenderteArtikel(paket).map((x) => t("ev.verfassung.paket_eintrag", { artikel: x.artikel.name, variante: x.variante.name }));
  return namen.length ? liste(namen) : t("ev.verfassung.paket_ersatz");
};

/** Aussicht einer Aufhebung durch das Gericht in Worten (Schwellen wie in sim/verfassung.ts, `pruefeVerfassung`). */
const aussicht = (p: number): string => (p < 0.12 ? "gering" : p < 0.25 ? "moeglich" : "hoch");

const ABSTIMMUNG: Vorlage = {
  id: "verfassung_abstimmung",
  szene: "parlament",
  titel: () => t("ev.verfassung_abstimmung.titel"),
  text: (w) => {
    const v = w.spiel?.verfassungsvorgang?.laufend;
    if (!v) return [t("ev.verfassung_abstimmung.text_erledigt")];
    const s = paketStimmen(w, v.paket, v.absprachen);
    return [
      t("ev.verfassung_abstimmung.text1", { paket: paketNamen(w) }),
      t("ev.verfassung_abstimmung.text2", {
        erwartet: s.erwartet,
        tief: s.tief,
        hoch: s.hoch,
        absprachen: v.absprachen,
        direkt: VERFASSUNG_REGELN.direkt,
        mehrheit: VERFASSUNG_REGELN.mehrheit,
        bis: VERFASSUNG_REGELN.direkt - 1,
      }),
    ];
  },
  warum: () => t("ev.verfassung_abstimmung.warum"),
  optionen: (w) => {
    const v = w.spiel?.verfassungsvorgang?.laufend;
    const s = v ? paketStimmen(w, v.paket, v.absprachen) : null;
    return [
      {
        id: "abstimmen",
        label: t("ev.verfassung_abstimmung.opt.abstimmen.label"),
        beschreibung: s
          ? t("ev.verfassung_abstimmung.opt.abstimmen.beschr", { erwartet: s.erwartet, tief: s.tief, hoch: s.hoch })
          : t("ev.verfassung_abstimmung.opt.abstimmen.beschr_erledigt"),
        pk: 0,
        wirkung: (w, _ev, rng) => verfassungAbstimmen(w, rng).text,
      },
      {
        id: "zurueckziehen",
        label: t("ev.verfassung_abstimmung.opt.zurueckziehen.label"),
        beschreibung: t("ev.verfassung_abstimmung.opt.zurueckziehen.beschr"),
        pk: 0,
        wirkung: (w) => zieheVerfassungZurueck(w).text,
      },
    ];
  },
  standard: (w, _ev, rng) => verfassungAbstimmen(w, rng).text,
  frist: 5,
  abkuehlung: 3650,
  wettbewerb: "aussitzen",
  schwere: 2,
  chance: () => 0,
  erzeuge: () => ({ provinzen: [], staerke: 0.6 }),
};

const AYM: Vorlage = {
  id: "verfassung_aym",
  szene: "parlament",
  titel: () => t("ev.verfassung_aym.titel"),
  text: (w) => {
    const v = w.spiel?.verfassungsvorgang?.laufend;
    if (!v) return [t("ev.verfassung_aym.text_erledigt")];
    const s = aymSicht(w, v.paket);
    return [
      t("ev.verfassung_aym.text1", { paket: paketNamen(w) }),
      t("ev.verfassung_aym.text2", { loyal: s.sitze.loyal, unabhaengig: s.sitze.unabhaengig, reform: s.sitze.reform, aussicht: aussicht(s.pKassation) }),
    ];
  },
  warum: () => t("ev.verfassung_aym.warum"),
  optionen: () => [
    {
      id: "abwarten",
      label: t("ev.verfassung_aym.opt.abwarten.label"),
      beschreibung: t("ev.verfassung_aym.opt.abwarten.beschr"),
      pk: 0,
      wirkung: (w, _ev, rng) => aymEntscheiden(w, rng).text,
    },
    {
      id: "respektieren",
      label: t("ev.verfassung_aym.opt.respektieren.label"),
      beschreibung: t("ev.verfassung_aym.opt.respektieren.beschr"),
      pk: 0,
      wirkung: (w, _ev, rng) => {
        wirke(w, "urteilsbefolgung", 1);
        return t("ev.verfassung_aym.opt.respektieren.ausgang", { urteil: aymEntscheiden(w, rng).text });
      },
    },
  ],
  standard: (w, _ev, rng) => aymEntscheiden(w, rng).text,
  frist: 5,
  abkuehlung: 3650,
  wettbewerb: "aussitzen",
  schwere: 2,
  chance: () => 0,
  erzeuge: () => ({ provinzen: [], staerke: 0.6 }),
};

const REFERENDUM: Vorlage = {
  id: "verfassung_referendum",
  szene: "wahlnacht",
  titel: () => t("ev.verfassung_referendum.titel"),
  text: (w) => {
    const v = w.spiel?.verfassungsvorgang?.laufend;
    if (!v) return [t("ev.verfassung_referendum.text_erledigt")];
    const p = referendumPrognose(w);
    if (!p) return [t("ev.verfassung_referendum.text_ohne_prognose")];
    return [
      t("ev.verfassung_referendum.text1", { paket: paketNamen(w) }),
      t("ev.verfassung_referendum.text2", {
        mitte: p.mitte,
        tief: p.tief,
        hoch: p.hoch,
        zustimmung: p.zustimmung,
        vz: p.salienz >= 0 ? "+" : "",
        salienz: p.salienz,
        kampagne: p.kampagne,
      }),
    ];
  },
  warum: () => t("ev.verfassung_referendum.warum"),
  optionen: () => [
    {
      id: "auszaehlen",
      label: t("ev.verfassung_referendum.opt.auszaehlen.label"),
      beschreibung: t("ev.verfassung_referendum.opt.auszaehlen.beschr"),
      pk: 0,
      wirkung: (w, _ev, rng) => referendumAuszaehlen(w, rng).text,
    },
    {
      id: "ansprache",
      label: t("ev.verfassung_referendum.opt.ansprache.label"),
      beschreibung: t("ev.verfassung_referendum.opt.ansprache.beschr"),
      pk: 0,
      wirkung: (w, _ev, rng) => {
        wirke(w, "polarisierung", -1);
        return t("ev.verfassung_referendum.opt.ansprache.ausgang", { ergebnis: referendumAuszaehlen(w, rng).text });
      },
    },
  ],
  standard: (w, _ev, rng) => referendumAuszaehlen(w, rng).text,
  frist: 3,
  abkuehlung: 3650,
  wettbewerb: "aussitzen",
  schwere: 2.5,
  chance: () => 0,
  erzeuge: () => ({ provinzen: [], staerke: 0.8 }),
};

const PROTESTE: Vorlage = {
  id: "verfassung_proteste",
  szene: "istanbul",
  titel: () => t("ev.verfassung_proteste.titel"),
  text: (w) => [t("ev.verfassung_proteste.text1", { paket: paketNamen(w) }), t("ev.verfassung_proteste.text2")],
  warum: () => t("ev.verfassung_proteste.warum"),
  optionen: () => [
    {
      id: "dialog",
      label: t("ev.verfassung_proteste.opt.dialog.label"),
      beschreibung: t("ev.verfassung_proteste.opt.dialog.beschr"),
      pk: 3,
      wirkung: (w) => {
        vertrauenAendern(w, 0.5);
        wirke(w, "polarisierung", -1);
        return t("ev.verfassung_proteste.opt.dialog.ausgang");
      },
    },
    {
      id: "polizei",
      label: t("ev.verfassung_proteste.opt.polizei.label"),
      beschreibung: t("ev.verfassung_proteste.opt.polizei.beschr"),
      pk: 1,
      wirkung: (w) => {
        wirke(w, "ausnahmerecht", 1);
        wirke(w, "polarisierung", 1);
        wirke(w, "ansehen", -1);
        return t("ev.verfassung_proteste.opt.polizei.ausgang");
      },
    },
  ],
  standard: (w) => {
    vertrauenAendern(w, -1);
    wirke(w, "polarisierung", 1);
    return t("ev.verfassung_proteste.standard");
  },
  frist: 6,
  abkuehlung: 300,
  wettbewerb: "eskalieren",
  schwere: 1.5,
  chance: () => 0,
  erzeuge: () => ({ provinzen: [], staerke: 0.7 }),
};

export const VERFASSUNG_VORLAGEN: Vorlage[] = [ABSTIMMUNG, AYM, REFERENDUM, PROTESTE];

/** Datumstexte für die Oberfläche der Kampagne (für die Werkstatt). */
export function referendumDatumText(w: World): string {
  const v = w.spiel?.verfassungsvorgang?.laufend;
  if (!v?.referendumTag) return "";
  return formatDateDe(addDays(w.date, v.referendumTag - w.day));
}

/** Autoritäre Richtung des laufenden Pakets für Texte der Oberfläche. */
export function laufendesPaketScore(w: World): number {
  const v = w.spiel?.verfassungsvorgang?.laufend;
  return v ? autoritaerScore(v.paket) : 0;
}
