// Ereignisvorlagen des EU-Beitrittsvorgangs (AUS-2): die Auto-Stopps der Klasse A.
//   eu_veto      — ein benannter Mitgliedstaat (Griechenland, Zypern) legt sein Veto gegen eine
//                  Kapitel-Eröffnung: Zugeständnis oder ein Jahr Stillstand
//   eu_zollunion — Brüssel bietet das Mandat für das Zollunion-Update an: annehmen oder vertagen
// Beide werden nur vom EU-Motor geöffnet (chance 0) und rufen dieselben Funktionen wie das
// Dossier — der Kern (sim/eu.ts) bleibt die einzige Wahrheitsquelle.
// Alle sichtbaren Texte kommen aus dem Katalog (src/i18n/katalog/*/nacht_n5_welt.json, Schlüssel ev.<vorlage>.*).
// Alle Zahlen sind Spielparameter (Platzhalter der Kalibrierung), keine Tatsachenbehauptungen.

import { opt } from "./ereignis-hilfen";
import { EU_REGELN, KAPITEL_NACH_ID, vetoAbwarten, vetoBeantworten, zollunionAblehnen, zollunionAnnehmen, zypernBewegung } from "./eu";
import { landFormen, landZahl } from "./ereignisse-krieg";
import { t } from "../i18n";
import type { Vorlage } from "./ereignis-hilfen";
import type { World } from "./types";
import type { OffenesEreignis } from "./spiel-typen";

const landId = (ev: OffenesEreignis): string => String(ev.daten?.land ?? "GRC");
const kapitelId = (ev: OffenesEreignis): string => String(ev.daten?.kapitel ?? "k23");
/** Kapitel mit Nummer und Namen (der Name ist in den Daten schon übersetzt), sonst „das Kapitel“. */
const kapitelName = (ev: OffenesEreignis): string => {
  const def = KAPITEL_NACH_ID.get(kapitelId(ev));
  return def ? t("ev.eu_veto.kapitel", { nummer: def.nummer, name: def.name }) : t("ev.eu_veto.kapitel.ohne");
};
const params = (ev: OffenesEreignis) => ({ land: landFormen(landId(ev)), nz: landZahl(landId(ev)), kapitel: kapitelName(ev) });

/** Risikoaufschlag, um den das Zollunion-Update sinkt (dieselbe Zahl bucht zollunionAnnehmen in sim/eu.ts). */
const ZOLLUNION_RISIKO = 40;

const EU_VETO: Vorlage = {
  id: "eu_veto",
  szene: "istanbul",
  frist: 21,
  abkuehlung: 90,
  chance: () => 0,
  erzeuge: () => ({ provinzen: [], staerke: 0.5, daten: { land: "GRC", kapitel: "k23" } }),
  titel: (_, ev) => t("ev.eu_veto.titel", params(ev)),
  text: (w, ev) => {
    const zypern = landId(ev) === "CYP" ? zypernBewegung(w).text : "";
    return [[t("ev.eu_veto.text1", params(ev)), zypern].filter(Boolean).join(" "), t("ev.eu_veto.text2")];
  },
  warum: () => t("ev.eu_veto.warum"),
  optionen: (_, ev) => [
    opt("zugestaendnis", t("ev.eu_veto.opt.zugestaendnis.label"), t("ev.eu_veto.opt.zugestaendnis.beschr"), EU_REGELN.pkVetoZugestaendnis, (w) => vetoBeantworten(w, landId(ev), kapitelId(ev))),
    opt("abwarten", t("ev.eu_veto.opt.abwarten.label"), t("ev.eu_veto.opt.abwarten.beschr", { ...params(ev), jahre: EU_REGELN.vetoSperreTage / 365 }), 0, (w) => vetoAbwarten(w, landId(ev), kapitelId(ev))),
  ],
  standard: (w, ev) => vetoAbwarten(w, landId(ev), kapitelId(ev)),
};

const EU_ZOLLUNION: Vorlage = {
  id: "eu_zollunion",
  szene: "istanbul",
  frist: 30,
  abkuehlung: 365,
  chance: () => 0,
  erzeuge: () => ({ provinzen: [], staerke: 0.5 }),
  titel: () => t("ev.eu_zollunion.titel"),
  text: () => [t("ev.eu_zollunion.text1"), t("ev.eu_zollunion.text2")],
  warum: () => t("ev.eu_zollunion.warum", { n: EU_REGELN.zollunionKapitel }),
  optionen: () => [
    opt("annehmen", t("ev.eu_zollunion.opt.annehmen.label"), t("ev.eu_zollunion.opt.annehmen.beschr", { punkte: ZOLLUNION_RISIKO }), 0, (w) => zollunionAnnehmen(w)),
    opt("ablehnen", t("ev.eu_zollunion.opt.ablehnen.label"), t("ev.eu_zollunion.opt.ablehnen.beschr", { jahre: EU_REGELN.zollunionSperreTage / 365 }), 0, (w) => zollunionAblehnen(w)),
  ],
  standard: (w) => zollunionAblehnen(w),
};

export const EU_VORLAGEN: Vorlage[] = [EU_VETO, EU_ZOLLUNION];

/** Für Tests und die Oberfläche: die Kennungen der EU-Vorlagen. */
export const EU_VORLAGE_IDS = EU_VORLAGEN.map((v) => v.id);

// Typsicherheit: World-Import wird in den Wirkungen gebraucht
export type { World };
