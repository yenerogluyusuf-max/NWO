// Vorgangs-Ereignisse der Verfassungsreform (REC-1): Parlamentsabstimmung, Entscheidung des
// Verfassungsgerichts, Referendum-Nacht und die Proteste der Gegenreaktion. Sie werden nicht vom
// Zufallsmotor gezogen (chance 0), sondern vom Kern der Verfassungsfrage (sim/verfassung.ts) zum
// festgesetzten Tag geöffnet — jede Stufe ist ein Auto-Stopp der Klasse A, weil sie als
// Entscheidungs-Ereignis auf den Tisch kommt.

import { fmt } from "./log";
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

const paketNamen = (w: World): string => {
  const v = w.spiel?.verfassungsvorgang?.laufend;
  if (!v) return "das Paket";
  const namen = geaenderteArtikel(v.paket).map((x) => `${x.artikel.name}: ${x.variante.name}`);
  return namen.length ? namen.join(", ") : "das Paket";
};

const ABSTIMMUNG: Vorlage = {
  id: "verfassung_abstimmung",
  szene: "parlament",
  titel: () => "Verfassungspaket: Die Abstimmung steht an",
  text: (w) => {
    const v = w.spiel?.verfassungsvorgang?.laufend;
    if (!v) return ["Die Große Nationalversammlung tritt zur Abstimmung über ein Verfassungspaket zusammen; der Vorgang selbst ist bereits abgeschlossen, die Stimmabgabe entfällt."];
    const s = paketStimmen(w, v.paket, v.absprachen);
    return [
      `Heute stimmt die Große Nationalversammlung über das Verfassungspaket ab: ${paketNamen(w)}.`,
      `Erwartet werden ${s.erwartet} Ja-Stimmen (Spanne ${s.tief} bis ${s.hoch}${v.absprachen ? `, darin ${v.absprachen} Absprachen` : ""}). Ab ${VERFASSUNG_REGELN.direkt} wird es direkt Gesetz; zwischen ${VERFASSUNG_REGELN.mehrheit} und ${VERFASSUNG_REGELN.direkt - 1} entscheidet das Volk; darunter ist es gescheitert, und ein Teil des Kapitals ist verbrannt.`,
    ];
  },
  warum: () => "Eine Verfassungsänderung braucht eine qualifizierte Mehrheit: Die Hürden entscheiden, ob das Volk mitreden muss.",
  optionen: (w) => {
    const v = w.spiel?.verfassungsvorgang?.laufend;
    const s = v ? paketStimmen(w, v.paket, v.absprachen) : null;
    return [
      {
        id: "abstimmen",
        label: "Zur Abstimmung bringen",
        beschreibung: s ? `Auszählen lassen: erwartet ${s.erwartet} Ja (Spanne ${s.tief} bis ${s.hoch}).` : "Auszählen lassen; der abgeschlossene Vorgang wird aus der Tagesordnung genommen.",
        pk: 0,
        wirkung: (w, _ev, rng) => verfassungAbstimmen(w, rng).text,
      },
      {
        id: "zurueckziehen",
        label: "Paket zurückziehen",
        beschreibung: `Ein Teil des Kapitals kommt zurück; die Amtszeit hat ihre Verfassungsdebatte hinter sich.`,
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
  titel: () => "Verfassungsgericht: Die Entscheidung fällt",
  text: (w) => {
    const v = w.spiel?.verfassungsvorgang?.laufend;
    if (!v) return ["Das Verfassungsgericht hätte über eine Anfechtung zu befinden; der Vorgang ist bereits abgeschlossen, das Verfahren wird eingestellt."];
    const s = aymSicht(w, v.paket);
    return [
      `Das Verfassungsgericht verkündet seine Entscheidung über die Anfechtung des Pakets: ${paketNamen(w)}.`,
      `Der Besetzungsstand — ${s.sitze.loyal} loyal, ${s.sitze.unabhaengig} unabhängig, ${s.sitze.reform} reformorientiert — lässt eine Kassation eher ${s.pKassation < 0.12 ? "unwahrscheinlich" : s.pKassation < 0.25 ? "möglich" : "wahrscheinlich"} erscheinen. Wird das Paket kassiert, ist es tot, und der Groll im Lager ist gewiss.`,
    ];
  },
  warum: () => "Die Kontrollinstanz entscheidet nach ihrem Besetzungsstand: Wer die Sitze prägt, prägt die Grenze der eigenen Macht.",
  optionen: () => [
    {
      id: "abwarten",
      label: "Die Verkündung abwarten",
      beschreibung: "Das Gericht entscheidet nach seinem Besetzungsstand; Einfluss hat jetzt niemand mehr.",
      pk: 0,
      wirkung: (w, _ev, rng) => aymEntscheiden(w, rng).text,
    },
    {
      id: "respektieren",
      label: "Die Unabhängigkeit des Gerichts öffentlich betonen",
      beschreibung: "Was auch kommt, die Regierung wird das Urteil achten: stärkt die Urteilsbefolgung im Land, bevor das Gericht entscheidet.",
      pk: 0,
      wirkung: (w, _ev, rng) => {
        wirke(w, "urteilsbefolgung", 1);
        return `Die Regierung kündigt an, jede Entscheidung zu achten. ${aymEntscheiden(w, rng).text}`;
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
  titel: () => "Referendum-Nacht: Das Volk entscheidet",
  text: (w) => {
    const v = w.spiel?.verfassungsvorgang?.laufend;
    if (!v) return ["Die Wahllokale hätten sich für eine Volksabstimmung öffnen sollen; der Vorgang ist bereits abgeschlossen, die Auszählung entfällt."];
    const p = referendumPrognose(w);
    if (!p) return ["Die Wahllokale schließen; der Vorgang ist bereits abgeschlossen."];
    return [
      `Die Wahllokale schließen, die Auszählung beginnt: ${paketNamen(w)}.`,
      `Die letzte Erwartung lag bei etwa ${fmt(p.mitte)} Prozent Ja (Spanne ${fmt(p.tief)} bis ${fmt(p.hoch)}): Zustimmung ${fmt(p.zustimmung)}, Themen der Artikel ${p.salienz >= 0 ? "+" : ""}${fmt(p.salienz)}, Kampagne +${fmt(p.kampagne)}. Ab 50 Prozent tritt das Paket in Kraft; ein Nein kostet schweres Vertrauen und stärkt die Opposition.`,
    ];
  },
  warum: () => "Eine Volksabstimmung ist eine Wahl über die Regierung selbst: Ihre Zustimmung trägt das Ja-Lager, die Artikel und die Kampagne verschieben es.",
  optionen: () => [
    {
      id: "auszaehlen",
      label: "Die Auszählung verfolgen",
      beschreibung: "Das Ergebnis bindet: Ja setzt das Paket in Kraft, Nein beendet es mit einem schweren Vertrauensverlust.",
      pk: 0,
      wirkung: (w, _ev, rng) => referendumAuszaehlen(w, rng).text,
    },
    {
      id: "ansprache",
      label: "Mit einer Ansprache in die Nacht gehen",
      beschreibung: "Der Präsident ruft zur Einheit auf, bevor das Ergebnis feststeht: dämpft die Polarisierung, kostet nichts.",
      pk: 0,
      wirkung: (w, _ev, rng) => {
        wirke(w, "polarisierung", -1);
        return `Die Ansprache beschwört die Einheit des Landes. ${referendumAuszaehlen(w, rng).text}`;
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
  titel: () => "Proteste gegen das Verfassungspaket",
  text: (w) => [
    `Auf den Plätzen der großen Städte versammeln sich Menschen gegen die neue Verfassung: ${paketNamen(w)}.`,
    "Die Bilder gehen um die Welt; Straßburg und die EU lesen das Paket als Richtungsentscheidung zugunsten des Palasts, und die Märkte werden nervös. Wer die Spielregeln zu seinen Gunsten schreibt, zahlt mit Legitimität.",
  ],
  warum: () => "Autoritäre Verfassungspakete erzeugen ihre Gegenreaktion: Straße, Ausland und Märkte antworten auf die Machtkonzentration.",
  optionen: () => [
    {
      id: "dialog",
      label: "Dialog anbieten",
      beschreibung: "Vertreter der Proteste empfangen: kostet Kapital, entspannt das Klima, gilt als Zeichen von Selbstsicherheit.",
      pk: 3,
      wirkung: (w) => {
        vertrauenAendern(w, 0.5);
        wirke(w, "polarisierung", -1);
        return "Das Gespräch mit Vertretern der Proteste nimmt den Bildern die Schärfe; das Klima entspannt sich etwas.";
      },
    },
    {
      id: "polizei",
      label: "Plätze polizeilich räumen lassen",
      beschreibung: "Schnell ruhig — und schnell neue Bilder: Ausnahmerecht und Polarisierung wachsen.",
      pk: 1,
      wirkung: (w) => {
        wirke(w, "ausnahmerecht", 1);
        wirke(w, "polarisierung", 1);
        wirke(w, "ansehen", -1);
        return "Die Polizei räumt die Plätze; die Nacht ist ruhig, die Bilder sind es nicht.";
      },
    },
  ],
  standard: (w) => {
    vertrauenAendern(w, -1);
    wirke(w, "polarisierung", 1);
    return "Die Proteste ziehen sich über Tage und verlieren sich erst allmählich; das Vertrauen hat gelitten.";
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
