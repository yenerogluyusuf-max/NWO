// Der Ministerrat (Bakanlar Kurulu): Kollegialorgan der Regierung nach Vorbild von Democracy 4 und Suzerain.
// Das Kabinett besteht aus den 7 Regierungsämtern (Finanzen, Inneres, Äußeres, Justiz, Generalstab, Wirtschaft, Stab).
// Die Minister erzeugen das Politische Kapital der Regierung, tragen Ressortkonflikte aus und beraten in Kabinettssitzungen.
// Alle Zahlen sind Spielparameter (Kalibrierungs-Platzhalter), keine Tatsachenbehauptungen.

import { NET } from "./modell";
import { nationalAverage } from "./netz";
import { wirke, vertrauenAendern } from "./wirkung";
import { addLog } from "./log";
import { clamp } from "./economy";
import { AEMTER, eigenVon, grollVerschieben, leistung, loyalitaetVerschieben, merke, schlechtesteGroesse, wertVon, nf } from "./personen";
import { LAGER_NAMEN, type LagerArt } from "./personen-typen";
import { Rng } from "./rng";
import type { World } from "./types";
import type { Figur } from "./spiel-typen";
import { t } from "../i18n";

export interface MinisterPosten {
  id: string;
  name: string;
  weiblich: boolean;
  amt: Figur["amt"];
  rolle: string;
  ressort: string;
  loyalitaet: number;
  faehigkeit: number;
  ehrgeiz: number;
  groll: number;
  stimmung: "treu" | "loyal" | "skeptisch" | "kritisch" | "meuternd";
  lager: LagerArt;
  lagerName: string;
  kapitalBeitrag: number;
  kapitalGrund: string;
  sorge: string;
  kommissarisch: boolean;
  auftragStatus?: "laeuft" | "erfuellt" | "verfehlt";
}

export interface KabinettStatus {
  minister: MinisterPosten[];
  kapitalSumme: number;
  schnittLoyalitaet: number;
  schnittFaehigkeit: number;
  disziplin: "geschlossen" | "geordnet" | "gespalten" | "rebellisch";
  disziplinText: string;
  ruecktrittGefahr: MinisterPosten[];
  letzteSitzungTag: number;
  sitzungMoeglich: boolean;
  tageBisSitzung: number;
}

export interface KabinettOption {
  id: string;
  titel: string;
  text: string;
  befuerworter: string[];
  gegner: string[];
  kostenPk?: number;
  effekteText: string[];
  ausfuehren: (w: World) => void;
}

export interface KabinettThema {
  id: string;
  titel: string;
  ressort: string;
  anlass: string;
  dringlichkeit: "hoch" | "normal";
  optionen: KabinettOption[];
}

const REIHENFOLGE_KABINETT: Figur["amt"][] = [
  "stab",
  "finanzen",
  "inneres",
  "aussen",
  "justiz",
  "generalstab",
  "wirtschaft",
];

export function stimmungVon(loyalitaet: number, groll: number): MinisterPosten["stimmung"] {
  if (loyalitaet < 25 || groll >= 70) return "meuternd";
  if (loyalitaet < 42 || groll >= 50) return "kritisch";
  if (loyalitaet < 58) return "skeptisch";
  if (loyalitaet >= 80 && groll < 25) return "treu";
  return "loyal";
}

/** Berechnet den monatlichen Kapital-Beitrag eines Ministers (Democracy-4-Mechanik) */
export function berechneMinisterKapital(w: World, f: Figur): { beitrag: number; grund: string } {
  const e = eigenVon(w, f);
  const loy = f.loyalitaet;
  const q = leistung(w, f); // 0 bis 1.3, Normwert ca. 0.65

  // Basis pro Ministerposten: 0.65 PK bei solider Leistung (q = 0.65)
  let beitrag = 0.65 * (q / 0.65);

  // Loyalitäts-Multiplikator: Rebellische Minister blockieren den Apparat
  if (loy < 25) beitrag -= 0.35;
  else if (loy < 40) beitrag -= 0.18;
  else if (loy >= 75) beitrag += 0.2;

  // Groll-Abzug: Durchstechereien und Sabotage zehren am Kapital
  if (e.groll >= 60) beitrag -= 0.25;
  else if (e.groll >= 40) beitrag -= 0.1;

  // Kommissarische Amtsführung: fehlt die Autorität im Ministerium
  if (e.kommissarisch) beitrag *= 0.55;

  // Runden auf eine Dezimalstelle
  beitrag = Math.round(clamp(beitrag, -0.3, 1.2) * 10) / 10;

  let grund = t("kab.grund.leistung", { p: Math.round(q * 100) });
  if (loy < 30) grund += t("kab.grund.verweigert");
  else if (e.groll >= 50) grund += t("kab.grund.groll");
  else if (loy >= 75) grund += t("kab.grund.treu");
  if (e.kommissarisch) grund += t("kab.grund.kommissarisch");

  return { beitrag, grund };
}

/** Ermittelt die dringendste Sorge eines Ministers aus den Kennzahlen seines Fachbereichs */
export function sorgeAusFach(w: World, f: Figur): string {
  const d = AEMTER[f.amt];
  if (!d.fach.length) return t("kab.keineKrise");
  let schlimmsterWert = -1e9;
  let sorgeKnoten = d.fach[0]!;

  for (const id of d.fach) {
    const val = wertVon(w, id);
    // Bei hoch_schlecht ist ein hoher Wert eine Sorge, sonst ein niedriger
    const isBadHigh = ["kriminalitaet", "terrorgefahr", "korruption", "haftueberfuellung", "zinslast", "lebenshaltung", "polarisierung"].includes(id);
    const score = isBadHigh ? val : 100 - val;
    if (score > schlimmsterWert) {
      schlimmsterWert = score;
      sorgeKnoten = id;
    }
  }

  const name = NET.nodes[NET.index.get(sorgeKnoten) ?? -1]?.name ?? sorgeKnoten;
  const wert = Math.round(wertVon(w, sorgeKnoten));
  return t("kab.sorge", { name, wert });
}

/** Gibt den vollständigen Zustand des Ministerrats zurück */
export function kabinettStatus(w: World): KabinettStatus {
  const spiel = w.spiel;
  const fs = (spiel?.figuren ?? []).filter((f) => f.imAmt && AEMTER[f.amt].regierungsamt);
  fs.sort((a, b) => REIHENFOLGE_KABINETT.indexOf(a.amt) - REIHENFOLGE_KABINETT.indexOf(b.amt));

  const minister: MinisterPosten[] = fs.map((f) => {
    const e = eigenVon(w, f);
    const def = AEMTER[f.amt];
    const { beitrag, grund } = berechneMinisterKapital(w, f);
    return {
      id: f.id,
      name: f.name,
      weiblich: f.weiblich ?? false,
      amt: f.amt,
      rolle: f.rolle,
      ressort: def.ressort,
      loyalitaet: f.loyalitaet,
      faehigkeit: e.faehigkeit,
      ehrgeiz: e.ehrgeiz,
      groll: e.groll,
      stimmung: stimmungVon(f.loyalitaet, e.groll),
      lager: e.lager,
      lagerName: LAGER_NAMEN[e.lager] ?? e.lager,
      kapitalBeitrag: beitrag,
      kapitalGrund: grund,
      sorge: sorgeAusFach(w, f),
      kommissarisch: e.kommissarisch ?? false,
      auftragStatus: e.auftrag?.status,
    };
  });

  const kapitalSumme = Math.round(minister.reduce((sum, m) => sum + m.kapitalBeitrag, 0) * 10) / 10;
  const schnittLoyalitaet = minister.length
    ? Math.round(minister.reduce((sum, m) => sum + m.loyalitaet, 0) / minister.length)
    : 50;
  const schnittFaehigkeit = minister.length
    ? Math.round(minister.reduce((sum, m) => sum + m.faehigkeit, 0) / minister.length)
    : 50;

  const ruecktrittGefahr = minister.filter((m) => m.loyalitaet < 25);

  let disziplin: KabinettStatus["disziplin"] = "geschlossen";
  let disziplinText = t("kab.disziplin.geschlossen");

  if (ruecktrittGefahr.length >= 2 || schnittLoyalitaet < 35) {
    disziplin = "rebellisch";
    disziplinText = t("kab.disziplin.rebellisch");
  } else if (ruecktrittGefahr.length === 1 || schnittLoyalitaet < 48) {
    disziplin = "gespalten";
    disziplinText = t("kab.disziplin.gespalten");
  } else if (schnittLoyalitaet < 65) {
    disziplin = "geordnet";
    disziplinText = t("kab.disziplin.geordnet");
  }

  const letzteSitzung = spiel?.zuletzt?.kabinettssitzung ?? -999;
  const tageSeit = w.day - letzteSitzung;
  const ABSTAND_TAGE = 45;
  // Auch bei offener Meuterei gibt es nicht beliebig oft eine Sitzung (Messung: 313 Sitzungen je Lauf, weil „rebellisch“ die Sperre aufhob)
  const ABSTAND_MEUTEREI = 14;
  const sitzungMoeglich = tageSeit >= ABSTAND_TAGE || (disziplin === "rebellisch" && tageSeit >= ABSTAND_MEUTEREI);
  const tageBisSitzung = Math.max(0, ABSTAND_TAGE - tageSeit);

  return {
    minister,
    kapitalSumme,
    schnittLoyalitaet,
    schnittFaehigkeit,
    disziplin,
    disziplinText,
    ruecktrittGefahr,
    letzteSitzungTag: letzteSitzung,
    sitzungMoeglich,
    tageBisSitzung,
  };
}

/** Bereitet die Beratungs-Themen für eine Kabinettssitzung vor */
export function bereiteKabinettssitzungVor(w: World): KabinettThema[] {
  const themen: KabinettThema[] = [];
  const status = kabinettStatus(w);

  // Thema 1: Haushaltsstreit (Finanzen vs. Wirtschaft / Generalstab)
  const fin = status.minister.find((m) => m.amt === "finanzen");
  const wirt = status.minister.find((m) => m.amt === "wirtschaft");
  const gen = status.minister.find((m) => m.amt === "generalstab");
  const inn = status.minister.find((m) => m.amt === "inneres");
  const jus = status.minister.find((m) => m.amt === "justiz");
  const aus = status.minister.find((m) => m.amt === "aussen");

  themen.push({
    id: "haushalt_prioritaet",
    titel: t("kab.hh.titel"),
    ressort: t("kab.hh.ressort"),
    anlass: t("kab.hh.anlass", { wer: fin?.name ?? t("kab.fb.finanzministerium") }),
    dringlichkeit: w.economy.inflation > 20 || w.economy.deficit > 5 ? "hoch" : "normal",
    optionen: [
      {
        id: "sparen",
        titel: t("kab.hh.sparen.titel"),
        text: t("kab.hh.sparen.text"),
        befuerworter: [fin?.name ?? t("kab.fb.finanzminister")].filter(Boolean),
        gegner: [wirt?.name ?? t("kab.fb.wirtschaftsminister"), gen?.name ?? t("kab.fb.generalstabschef")].filter(Boolean),
        kostenPk: 0,
        effekteText: [
          t("kab.hh.sparen.e1", { name: fin?.name ?? t("kab.fb.finanzen") }),
          t("kab.hh.sparen.e2", { a: wirt?.name ?? t("kab.fb.wirtschaft"), b: gen?.name ?? t("kab.fb.generalstab") }),
          t("kab.hh.sparen.e3"),
        ],
        ausfuehren: (world) => {
          const fs = world.spiel?.figuren ?? [];
          const fFin = fs.find((x) => x.amt === "finanzen");
          const fWirt = fs.find((x) => x.amt === "wirtschaft");
          const fGen = fs.find((x) => x.amt === "generalstab");
          if (fFin) {
            loyalitaetVerschieben(fFin, 12);
            grollVerschieben(world, fFin, -15);
            merke(world, fFin, t("kab.hh.sparen.m1"));
          }
          if (fWirt) {
            loyalitaetVerschieben(fWirt, -8);
            grollVerschieben(world, fWirt, 10);
            merke(world, fWirt, t("kab.hh.sparen.m2"));
          }
          if (fGen) {
            loyalitaetVerschieben(fGen, -8);
            grollVerschieben(world, fGen, 10);
            merke(world, fGen, t("kab.hh.sparen.m3"));
          }
          wirke(world, "vertrauen_maerkte", 3);
          // Ausgabenstopp über den fiskalischen Impuls: Das Defizit sinkt, aber die Nachfrage fällt mit (Gegenrechnung über die Auslastung).
          // Der alte Eingriff in die Defizit-Grundlinie war kostenlos und alle 45 Tage wiederholbar. Gedeckelt auf ±3 % des BIP (Spielparameter).
          world.economy.fiscalImpulse = clamp(world.economy.fiscalImpulse - 0.6, -3, 3);
        },
      },
      {
        id: "investieren",
        titel: t("kab.hh.invest.titel"),
        text: t("kab.hh.invest.text"),
        befuerworter: [wirt?.name ?? t("kab.fb.wirtschaftsminister"), gen?.name ?? t("kab.fb.generalstabschef")].filter(Boolean),
        gegner: [fin?.name ?? t("kab.fb.finanzminister")].filter(Boolean),
        kostenPk: 2,
        effekteText: [
          t("kab.hh.invest.e1", { a: wirt?.name ?? t("kab.fb.wirtschaft"), b: gen?.name ?? t("kab.fb.generalstab") }),
          t("kab.hh.invest.e2", { name: fin?.name ?? t("kab.fb.finanzen") }),
          t("kab.hh.invest.e3"),
        ],
        ausfuehren: (world) => {
          const fs = world.spiel?.figuren ?? [];
          const fFin = fs.find((x) => x.amt === "finanzen");
          const fWirt = fs.find((x) => x.amt === "wirtschaft");
          const fGen = fs.find((x) => x.amt === "generalstab");
          if (fFin) {
            loyalitaetVerschieben(fFin, -12);
            grollVerschieben(world, fFin, 15);
            merke(world, fFin, t("kab.hh.invest.m1"));
          }
          if (fWirt) {
            loyalitaetVerschieben(fWirt, 10);
            merke(world, fWirt, t("kab.hh.invest.m2"));
          }
          if (fGen) {
            loyalitaetVerschieben(fGen, 10);
            merke(world, fGen, t("kab.hh.invest.m3"));
          }
          wirke(world, "investitionen", 4);
          wirke(world, "bereitschaft_heer", 3);
          // Kreditfinanzierter Nachfrageimpuls über den fiskalischen Impuls: stützt die Auslastung (Wachstum folgt aus ihr, ein direkter Eingriff
          // ins Wachstum würde im nächsten Monat überschrieben) und treibt Defizit und Schulden hoch. Gedeckelt auf ±3 % des BIP (Spielparameter).
          world.economy.fiscalImpulse = clamp(world.economy.fiscalImpulse + 0.4, -3, 3);
        },
      },
      {
        id: "ausgleich",
        titel: t("kab.hh.ausgleich.titel"),
        text: t("kab.hh.ausgleich.text"),
        befuerworter: [t("kab.fb.stab")].filter(Boolean),
        gegner: [],
        effekteText: [t("kab.hh.ausgleich.e1"), t("kab.hh.ausgleich.e2")],
        ausfuehren: (world) => {
          wirke(world, "legitimitaet", 1);
        },
      },
    ],
  });

  // Thema 2: Innere Sicherheit vs. Rechtsstaat (Inneres vs. Justiz)
  themen.push({
    id: "sicherheit_justiz",
    titel: t("kab.si.titel"),
    ressort: t("kab.si.ressort"),
    anlass: t("kab.si.anlass", { inn: inn?.name ?? t("kab.fb.innenministerium"), jus: jus?.name ?? t("kab.fb.justiz") }),
    dringlichkeit: nationalAverage(NET, w.net, "kriminalitaet") > 50 || nationalAverage(NET, w.net, "polarisierung") > 60 ? "hoch" : "normal",
    optionen: [
      {
        id: "haerte",
        titel: t("kab.si.haerte.titel"),
        text: t("kab.si.haerte.text"),
        befuerworter: [inn?.name ?? t("kab.fb.innenministerin")].filter(Boolean),
        gegner: [jus?.name ?? t("kab.fb.justizministerin")].filter(Boolean),
        effekteText: [
          t("kab.si.haerte.e1", { name: inn?.name ?? t("kab.fb.inneres") }),
          t("kab.si.haerte.e2", { name: jus?.name ?? t("kab.fb.justizKurz") }),
          t("kab.si.haerte.e3"),
        ],
        ausfuehren: (world) => {
          const fs = world.spiel?.figuren ?? [];
          const fInn = fs.find((x) => x.amt === "inneres");
          const fJus = fs.find((x) => x.amt === "justiz");
          if (fInn) {
            loyalitaetVerschieben(fInn, 14);
            merke(world, fInn, t("kab.si.haerte.m1"));
          }
          if (fJus) {
            loyalitaetVerschieben(fJus, -12);
            grollVerschieben(world, fJus, 12);
            merke(world, fJus, t("kab.si.haerte.m2"));
          }
          wirke(world, "kriminalitaet", -3);
          wirke(world, "polarisierung", 2);
        },
      },
      {
        id: "rechtsstaat",
        titel: t("kab.si.recht.titel"),
        text: t("kab.si.recht.text"),
        befuerworter: [jus?.name ?? t("kab.fb.justizministerin")].filter(Boolean),
        gegner: [inn?.name ?? t("kab.fb.innenministerin")].filter(Boolean),
        effekteText: [
          t("kab.si.recht.e1", { name: jus?.name ?? t("kab.fb.justizKurz") }),
          t("kab.si.recht.e2", { name: inn?.name ?? t("kab.fb.inneres") }),
          t("kab.si.recht.e3"),
        ],
        ausfuehren: (world) => {
          const fs = world.spiel?.figuren ?? [];
          const fInn = fs.find((x) => x.amt === "inneres");
          const fJus = fs.find((x) => x.amt === "justiz");
          if (fJus) {
            loyalitaetVerschieben(fJus, 12);
            merke(world, fJus, t("kab.si.recht.m1"));
          }
          if (fInn) {
            loyalitaetVerschieben(fInn, -12);
            grollVerschieben(world, fInn, 14);
            merke(world, fInn, t("kab.si.recht.m2"));
          }
          wirke(world, "justiz_unabhaengigkeit", 3);
          wirke(world, "ansehen", 2);
        },
      },
    ],
  });

  // Thema: der größte Ressortkonflikt. Das Ressort mit der schlechtesten Lage verlangt Gehör und Mittel; das Thema wechselt mit der Lage
  // des Landes, statt immer dieselben zwei Fragen zu stellen (Prüfer 2: Kabinettssitzung statisch, drei feste Themen).
  const brenn = (w.spiel?.figuren ?? [])
    .filter((f) => AEMTER[f.amt].regierungsamt && f.imAmt)
    .map((f) => ({ f, g: schlechtesteGroesse(w, f) }))
    .filter((x): x is { f: Figur; g: NonNullable<ReturnType<typeof schlechtesteGroesse>> } => !!x.g)
    .map((x) => ({ ...x, schlecht: x.g.schlechtWennHoch ? x.g.wert : 100 - x.g.wert }))
    .sort((a, b) => b.schlecht - a.schlecht)[0];
  if (brenn && brenn.schlecht >= 55) {
    const { f, g } = brenn;
    const richtung = g.schlechtWennHoch ? -1 : 1;
    themen.push({
      id: `ressortkonflikt_${f.amt}`,
      titel: t("takt.kabinett.konflikt.titel", { rolle: f.rolle, groesse: g.name }),
      ressort: f.rolle,
      anlass: t("takt.kabinett.konflikt.anlass", { rolle: f.rolle, name: f.name, groesse: g.name, wert: nf(g.wert, 0) }),
      dringlichkeit: brenn.schlecht >= 75 ? "hoch" : "normal",
      optionen: [
        {
          id: "mittel",
          titel: t("takt.kabinett.konflikt.mittel.titel"),
          text: t("takt.kabinett.konflikt.mittel.text"),
          befuerworter: [f.name],
          gegner: [],
          kostenPk: 3,
          effekteText: [t("takt.kabinett.konflikt.mittel.effekt1", { name: f.name }), t("takt.kabinett.konflikt.mittel.effekt2", { groesse: g.name }), t("takt.kabinett.konflikt.mittel.effekt3")],
          ausfuehren: (world) => {
            const fig = world.spiel?.figuren.find((x) => x.id === f.id);
            if (fig) {
              loyalitaetVerschieben(fig, 10);
              grollVerschieben(world, fig, -12);
              merke(world, fig, t("takt.kabinett.konflikt.mittel.merke", { groesse: g.name }));
            }
            wirke(world, g.id, 2.5 * richtung);
            world.economy.debtRatio += 0.1;
          },
        },
        {
          id: "reihenfolge",
          titel: t("takt.kabinett.konflikt.reihenfolge.titel"),
          text: t("takt.kabinett.konflikt.reihenfolge.text"),
          befuerworter: [],
          gegner: [f.name],
          effekteText: [t("takt.kabinett.konflikt.reihenfolge.effekt1", { name: f.name }), t("takt.kabinett.konflikt.reihenfolge.effekt2")],
          ausfuehren: (world) => {
            const fig = world.spiel?.figuren.find((x) => x.id === f.id);
            if (fig) {
              loyalitaetVerschieben(fig, -3);
              grollVerschieben(world, fig, 5);
              merke(world, fig, t("takt.kabinett.konflikt.reihenfolge.merke", { groesse: g.name }));
            }
          },
        },
        {
          id: "ruege",
          titel: t("takt.kabinett.konflikt.ruege.titel"),
          text: t("takt.kabinett.konflikt.ruege.text"),
          befuerworter: [],
          gegner: [f.name],
          effekteText: [t("takt.kabinett.konflikt.ruege.effekt1", { name: f.name }), t("takt.kabinett.konflikt.ruege.effekt2")],
          ausfuehren: (world) => {
            const fig = world.spiel?.figuren.find((x) => x.id === f.id);
            if (fig) {
              loyalitaetVerschieben(fig, -8);
              grollVerschieben(world, fig, 12);
              merke(world, fig, t("takt.kabinett.konflikt.ruege.merke"));
            }
            vertrauenAendern(world, 0.3);
          },
        },
      ],
    });
  }

  // Thema 3: Geschlossenheitspakt & Koalitionsdisziplin
  if (status.disziplin === "gespalten" || status.disziplin === "rebellisch") {
    themen.unshift({
      id: "vertrauenskrise",
      titel: t("kab.kr.titel"),
      ressort: t("kab.kr.ressort"),
      anlass: t("kab.kr.anlass"),
      dringlichkeit: "hoch",
      optionen: [
        {
          id: "machtwort",
          titel: t("kab.kr.machtwort.titel"),
          text: t("kab.kr.machtwort.text"),
          befuerworter: [t("kab.fb.stab")].filter(Boolean),
          gegner: status.ruecktrittGefahr.map((m) => m.name),
          effekteText: [t("kab.kr.machtwort.e1"), t("kab.kr.machtwort.e2"), t("kab.kr.machtwort.e3")],
          ausfuehren: (world) => {
            const fs = world.spiel?.figuren ?? [];
            for (const f of fs) {
              if (!AEMTER[f.amt].regierungsamt) continue;
              if (f.loyalitaet >= 50) loyalitaetVerschieben(f, 6);
              else loyalitaetVerschieben(f, -8);
            }
            vertrauenAendern(world, 2);
          },
        },
        {
          id: "ressort_zugestaendnis",
          titel: t("kab.kr.paket.titel"),
          text: t("kab.kr.paket.text"),
          befuerworter: status.minister.map((m) => m.name),
          gegner: [],
          kostenPk: 5,
          effekteText: [t("kab.kr.paket.e1"), t("kab.kr.paket.e2"), t("kab.kr.paket.e3")],
          ausfuehren: (world) => {
            const fs = world.spiel?.figuren ?? [];
            for (const f of fs) {
              if (!AEMTER[f.amt].regierungsamt) continue;
              loyalitaetVerschieben(f, 8);
              grollVerschieben(world, f, -15);
              merke(world, f, t("kab.kr.paket.m1"));
            }
            if (world.spiel) world.spiel.kapital = Math.max(-20, world.spiel.kapital - 5);
          },
        },
      ],
    });
  }

  return themen;
}

/** Führt eine Kabinettssitzung mit dem gewählten Beschluss durch */
export function halteKabinettssitzungAb(
  w: World,
  themaId: string,
  optionId: string
): { erfolg: boolean; text: string; effekteText: string[] } {
  const themen = bereiteKabinettssitzungVor(w);
  const thema = themen.find((x) => x.id === themaId);
  if (!thema) return { erfolg: false, text: t("kab.e.thema"), effekteText: [] };

  const opt = thema.optionen.find((o) => o.id === optionId);
  if (!opt) return { erfolg: false, text: t("kab.e.option"), effekteText: [] };

  if (opt.kostenPk && (w.spiel?.kapital ?? 0) + 20 < opt.kostenPk) {
    return { erfolg: false, text: t("kab.e.kapital"), effekteText: [] };
  }

  opt.ausfuehren(w);

  if (w.spiel) {
    w.spiel.zuletzt = w.spiel.zuletzt ?? {};
    w.spiel.zuletzt.kabinettssitzung = w.day;
  }

  addLog(
    w,
    "entscheidung",
    t("kab.log", { thema: thema.titel, option: opt.titel }),
    t("kab.log.warum", { folgen: opt.effekteText.join("; ") })
  );

  return {
    erfolg: true,
    text: t("kab.ergebnis", { option: opt.titel }),
    effekteText: opt.effekteText,
  };
}
