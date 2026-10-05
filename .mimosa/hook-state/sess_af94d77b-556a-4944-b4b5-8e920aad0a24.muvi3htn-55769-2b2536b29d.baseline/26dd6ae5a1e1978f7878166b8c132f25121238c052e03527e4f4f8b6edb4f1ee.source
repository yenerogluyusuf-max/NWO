// Saisonereignisse: Das Jahr bekommt einen Rhythmus. Von Januar bis Juni brachte der Ereignismotor bisher nur etwa 0,6 Entscheidungen je
// Monat (Messung vom 05.10.2026, 40 Läufe); hier stehen die Termine, die ein Präsident in dieser Zeit tatsächlich hat: die Jahresbilanz,
// der Inflationsbericht der Zentralbank, der Bericht des Rechnungshofs, zwei Gedenktage (23. April, 19. Mai) und der Gesetzesstau vor der
// Sommerpause des Parlaments. Jedes Ereignis hat einen festen Kalendertag (`Vorlage.tag`), Antworten mit Preis und eine Standardfolge.
// Alle Zahlen sind Spielparameter; Tatsachen stehen nur in den Texten (Gedenktage, Parlamentspause) und sind breit bekannt.
// Texte: Übersetzungsschicht (i18n/katalog/<sprache>/takt.json, Schlüssel takt.saison.*).

import { wirke, vertrauenAendern } from "./wirkung";
import { nationalAverage } from "./netz";
import { NET } from "./modell";
import { opt, monatVon, kosten, zusageAnlegen } from "./ereignis-hilfen";
import type { Option, SzenenName, Vorlage } from "./ereignis-hilfen";
import type { World } from "./types";
import { neuwahlForderungFaellig } from "./takt";
import { t } from "../i18n";

interface OptDef {
  id: string;
  pk: number;
  /** Wirkung; gibt optional den Schlüssel-Zusatz des Ausgangs zurück (Standard: `ausgang`) */
  wirkung: (w: World) => string | void;
}

interface SaisonDef {
  id: string;
  monate: number[];
  tag: number;
  /** Wahrscheinlichkeit in einem passenden Monat */
  p: number;
  szene: SzenenName;
  frist: number;
  abkuehlung: number;
  /** Zusätzliche Bedingung (etwa laufende Gesetze) */
  gilt?: (w: World) => boolean;
  optionen: OptDef[];
  standard: (w: World) => void;
  folgen?: Vorlage["folgen"];
}

const knoten = (w: World, id: string): number => {
  const v = nationalAverage(NET, w.net, id);
  return Number.isFinite(v) ? v : 50;
};

function saison(d: SaisonDef): Vorlage {
  const k = (s: string) => `takt.saison.${d.id}.${s}`;
  const v: Vorlage = {
    id: d.id,
    szene: d.szene,
    frist: d.frist,
    abkuehlung: d.abkuehlung,
    tag: d.tag,
    chance: (w) => (w.spiel && w.day > 120 && d.monate.includes(monatVon(w)) && (d.gilt?.(w) ?? true) ? d.p : 0),
    erzeuge: () => ({ provinzen: [], staerke: 1 }),
    titel: () => t(k("titel")),
    text: () => [t(k("text"))],
    warum: () => t(k("warum")),
    optionen: (): Option[] =>
      d.optionen.map((o) =>
        opt(o.id, t(k(`opt.${o.id}.label`)), t(k(`opt.${o.id}.beschr`)), o.pk, (w) => {
          const zusatz = o.wirkung(w);
          return t(k(`opt.${o.id}.${zusatz ? zusatz : "ausgang"}`));
        }),
      ),
    standard: (w) => {
      d.standard(w);
      return t(k("standard"));
    },
  };
  if (d.folgen) v.folgen = d.folgen;
  return v;
}

export const SAISON_VORLAGEN: Vorlage[] = [
  // Januar: Die Jahresbilanz der Regierung
  saison({
    id: "saison_jahresbilanz",
    monate: [1],
    tag: 12,
    p: 0.5,
    szene: "parlament",
    frist: 14,
    abkuehlung: 330,
    optionen: [
      {
        id: "nuechtern",
        pk: 0,
        wirkung: (w) => {
          vertrauenAendern(w, 0.6);
          wirke(w, "legitimitaet", 0.5);
        },
      },
      {
        id: "erfolge",
        pk: 1,
        wirkung: (w) => {
          // Wer beschönigt, während der Alltag teuer ist, zahlt mit Glaubwürdigkeit
          if (w.economy.inflation > 15) {
            wirke(w, "legitimitaet", -0.6);
            vertrauenAendern(w, -0.4);
            return "ausgang_schlecht";
          }
          wirke(w, "vertrauen_regierung", 0.8);
        },
      },
      {
        id: "reformen",
        pk: 3,
        wirkung: (w) => {
          wirke(w, "vertrauen_regierung", 1);
          wirke(w, "unternehmer", 0.4);
          zusageAnlegen(w, { von: "Wähler", text: t("takt.saison.saison_jahresbilanz.zusage"), tage: 270 });
        },
      },
    ],
    standard: (w) => vertrauenAendern(w, -0.4),
  }),

  // Februar und Mai: Der Inflationsbericht der Zentralbank
  saison({
    id: "saison_inflationsbericht",
    monate: [2, 5],
    tag: 14,
    p: 0.45,
    szene: "bank",
    frist: 14,
    abkuehlung: 80,
    optionen: [
      {
        id: "stuetzen",
        pk: 0,
        wirkung: (w) => {
          wirke(w, "vertrauen_maerkte", 0.8);
        },
      },
      {
        id: "kritisieren",
        pk: 0,
        wirkung: (w) => {
          wirke(w, "vertrauen_maerkte", -1.2);
          wirke(w, "ansehen", -0.3);
        },
      },
      {
        id: "gespraech",
        pk: 1,
        wirkung: (w) => {
          wirke(w, "vertrauen_maerkte", 0.4);
          wirke(w, "legitimitaet", 0.2);
        },
      },
    ],
    standard: (w) => wirke(w, "vertrauen_maerkte", -0.2),
  }),

  // März: Der Bericht des Rechnungshofs über öffentliche Vergaben
  saison({
    id: "saison_rechnungshof",
    monate: [3],
    tag: 9,
    p: 0.5,
    szene: "parlament",
    frist: 20,
    abkuehlung: 330,
    optionen: [
      {
        id: "konsequenzen",
        pk: 2,
        wirkung: (w) => {
          wirke(w, "korruption", -3);
          wirke(w, "legitimitaet", 0.8);
          wirke(w, "unternehmer", -0.5);
        },
      },
      {
        id: "aussitzen",
        pk: 0,
        wirkung: (w) => {
          wirke(w, "korruption", 2);
          wirke(w, "legitimitaet", -0.6);
          vertrauenAendern(w, -0.6);
        },
      },
      {
        id: "gutachten",
        pk: 1,
        wirkung: (w) => {
          wirke(w, "korruption", 0.5);
          wirke(w, "justizvertrauen", -0.3);
        },
      },
    ],
    standard: (w) => {
      wirke(w, "korruption", 1.5);
      vertrauenAendern(w, -0.5);
    },
    // Ein ausgesessener Bericht kommt als Affäre zurück
    folgen: {
      aussitzen: { vorlage: "korruptionsaffaere", nach: [90, 240] },
      gutachten: { vorlage: "korruptionsaffaere", nach: [150, 330], bedingung: (w) => knoten(w, "korruption") > 45 },
    },
  }),

  // 23. April: Tag der Nationalen Souveränität und des Kindes
  saison({
    id: "saison_souveraenitaetstag",
    monate: [4],
    tag: 23,
    p: 0.6,
    szene: "parlament",
    frist: 8,
    abkuehlung: 330,
    optionen: [
      {
        id: "kinder",
        pk: 1,
        wirkung: (w) => {
          wirke(w, "junge", 1.2);
          wirke(w, "bildungsqualitaet", 0.5);
        },
      },
      {
        id: "einheit",
        pk: 0,
        wirkung: (w) => {
          wirke(w, "nationalisten", 1.5);
          wirke(w, "minderheiten", -1);
          wirke(w, "polarisierung", 0.8);
        },
      },
      {
        id: "schlicht",
        pk: 0,
        wirkung: (w) => {
          wirke(w, "vertrauen_regierung", 0.2);
        },
      },
    ],
    standard: (w) => wirke(w, "vertrauen_regierung", -0.2),
  }),

  // 19. Mai: Gedenktag an Atatürk, Jugend und Sport
  saison({
    id: "saison_jugendtag",
    monate: [5],
    tag: 19,
    p: 0.5,
    szene: "istanbul",
    frist: 8,
    abkuehlung: 330,
    optionen: [
      {
        id: "programm",
        pk: 3,
        wirkung: (w) => {
          kosten(w, 0.1);
          wirke(w, "junge", 2);
          wirke(w, "jugendarbeitslosigkeit", -1);
        },
      },
      {
        id: "sport",
        pk: 2,
        wirkung: (w) => {
          kosten(w, 0.05);
          wirke(w, "junge", 1.2);
          wirke(w, "ansehen", 0.3);
        },
      },
      {
        id: "rede",
        pk: 0,
        wirkung: (w) => {
          wirke(w, "junge", 0.3);
        },
      },
    ],
    standard: (w) => wirke(w, "junge", -0.5),
  }),

  // Juni: Gesetzesstau vor der Sommerpause des Parlaments
  saison({
    id: "saison_sommerpause",
    monate: [6],
    tag: 20,
    p: 0.6,
    szene: "parlament",
    frist: 8,
    abkuehlung: 330,
    gilt: (w) => (w.spiel?.gesetze.length ?? 0) > 0,
    optionen: [
      {
        id: "sondersitzung",
        pk: 3,
        wirkung: (w) => {
          // Alle offenen Gesetze kommen noch vor der Pause zur Abstimmung (die Opposition nennt es Durchpeitschen)
          for (const g of w.spiel!.gesetze) g.abstimmung = Math.min(g.abstimmung, w.day + 3);
          wirke(w, "polarisierung", 0.5);
        },
      },
      {
        id: "ordentlich",
        pk: 0,
        wirkung: () => undefined,
      },
      {
        id: "vertagen",
        pk: 0,
        wirkung: (w) => {
          // Die Abstimmung wartet bis zum Herbst; das Land sieht, dass nichts vorangeht
          for (const g of w.spiel!.gesetze) g.abstimmung = Math.max(g.abstimmung, w.day + 100);
          vertrauenAendern(w, -0.3);
        },
      },
    ],
    standard: () => undefined,
  }),
];

/**
 * Gegenkraft: Hat das Lager lange keine Mehrheit und liegt die Zustimmung darunter, fordert die Opposition Neuwahlen (sim/takt.ts zählt die
 * Monate). Der Präsident hat kein Misstrauensvotum zu fürchten, aber der Druck der Straße und des Parlaments ist real; ein Wahltermin binnen
 * sechzig Tagen ist ein Weg, ihn aufzulösen (wie das Verfassungspaket „vorgezogene Neuwahl“).
 */
export const NEUWAHLFORDERUNG: Vorlage = (() => {
  const k = (s: string) => `takt.saison.neuwahlforderung.${s}`;
  const gesehen = (w: World) => {
    const g = (w.spiel!.gegenkraft ??= {});
    g.neuwahlTag = w.day;
  };
  return {
    id: "neuwahlforderung",
    szene: "parlament",
    frist: 20,
    abkuehlung: 365,
    chance: (w) => (w.spiel && neuwahlForderungFaellig(w) ? 0.4 : 0),
    erzeuge: () => ({ provinzen: [], staerke: 1 }),
    titel: () => t(k("titel")),
    text: () => [t(k("text"))],
    warum: () => t(k("warum")),
    wettbewerb: "eskalieren",
    schwere: 2,
    optionen: (): Option[] => [
      opt("ablehnen", t(k("opt.ablehnen.label")), t(k("opt.ablehnen.beschr")), 0, (w) => {
        wirke(w, "polarisierung", 1);
        wirke(w, "legitimitaet", -0.8);
        gesehen(w);
        return t(k("opt.ablehnen.ausgang"));
      }),
      opt("dialog", t(k("opt.dialog.label")), t(k("opt.dialog.beschr")), 3, (w) => {
        wirke(w, "polarisierung", -0.8);
        wirke(w, "legitimitaet", 0.4);
        vertrauenAendern(w, 0.3);
        gesehen(w);
        return t(k("opt.dialog.ausgang"));
      }),
      opt("neuwahl", t(k("opt.neuwahl.label")), t(k("opt.neuwahl.beschr")), 0, (w) => {
        const sp = w.spiel!;
        sp.wahltag = Math.min(sp.wahltag, w.day + 60);
        wirke(w, "legitimitaet", 1.5);
        wirke(w, "polarisierung", -1);
        gesehen(w);
        return t(k("opt.neuwahl.ausgang"));
      }),
    ],
    standard: (w) => {
      wirke(w, "polarisierung", 1.2);
      wirke(w, "legitimitaet", -1.2);
      gesehen(w);
      return t(k("standard"));
    },
  };
})();
SAISON_VORLAGEN.push(NEUWAHLFORDERUNG);
