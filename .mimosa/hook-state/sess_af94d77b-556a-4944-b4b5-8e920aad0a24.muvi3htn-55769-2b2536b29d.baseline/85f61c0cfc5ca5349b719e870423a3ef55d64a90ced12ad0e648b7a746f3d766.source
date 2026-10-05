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

  let grund = `Leistung ${Math.round(q * 100)} %`;
  if (loy < 30) grund += ", verweigert Kooperation";
  else if (e.groll >= 50) grund += ", Reibungsverluste durch Groll";
  else if (loy >= 75) grund += ", treuer Rückhalt";
  if (e.kommissarisch) grund += " (kommissarisch)";

  return { beitrag, grund };
}

/** Ermittelt die dringendste Sorge eines Ministers aus den Kennzahlen seines Fachbereichs */
export function sorgeAusFach(w: World, f: Figur): string {
  const d = AEMTER[f.amt];
  if (!d.fach.length) return "Keine akute Ressortkrise";
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
  return `${name} (${wert} Pkt.)`;
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
  let disziplinText = "Die Regierungsmannschaft zieht geschlossen an einem Strang.";

  if (ruecktrittGefahr.length >= 2 || schnittLoyalitaet < 35) {
    disziplin = "rebellisch";
    disziplinText = "Offene Meuterei im Kabinett: Mehrere Minister drohen mit geschlossenem Rücktritt!";
  } else if (ruecktrittGefahr.length === 1 || schnittLoyalitaet < 48) {
    disziplin = "gespalten";
    disziplinText = "Tiefe Gräben im Ministerrat: Ressortstreitigkeiten lähmen den Reformkurs.";
  } else if (schnittLoyalitaet < 65) {
    disziplin = "geordnet";
    disziplinText = "Geordnete Regierungsarbeit mit vereinzelten Meinungsverschiedenheiten.";
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
    titel: "Haushaltskurs: Sparzwang vs. Wachstumsinvestitionen",
    ressort: "Finanzen & Wirtschaft",
    anlass: `${fin?.name ?? "Das Finanzministerium"} mahnt Haushaltsdisziplin und Inflationsbekämpfung an, während die Fachressorts zusätzliche Mittel fordern.`,
    dringlichkeit: w.economy.inflation > 20 || w.economy.deficit > 5 ? "hoch" : "normal",
    optionen: [
      {
        id: "sparen",
        titel: "Strikter Sparkurs (Finanzministerium stützen)",
        text: "Ausgabenstopp für Nebenressorts. Stärkt das Vertrauen der internationalen Finanzmärkte, verärgert jedoch Industrie und Militär.",
        befuerworter: [fin?.name ?? "Finanzminister"].filter(Boolean),
        gegner: [wirt?.name ?? "Wirtschaftsminister", gen?.name ?? "Chef des Generalstabs"].filter(Boolean),
        kostenPk: 0,
        effekteText: [
          `${fin?.name ?? "Finanzen"}: +12 Loyalität, Groll sinkt`,
          `${wirt?.name ?? "Wirtschaft"} & ${gen?.name ?? "Generalstab"}: -8 Loyalität, +10 Groll`,
          "Marktvertrauen +3 Pkt., Defizit sinkt um 0,6 % des BIP; Preis: die Nachfrage bremst",
        ],
        ausfuehren: (world) => {
          const fs = world.spiel?.figuren ?? [];
          const fFin = fs.find((x) => x.amt === "finanzen");
          const fWirt = fs.find((x) => x.amt === "wirtschaft");
          const fGen = fs.find((x) => x.amt === "generalstab");
          if (fFin) {
            loyalitaetVerschieben(fFin, 12);
            grollVerschieben(world, fFin, -15);
            merke(world, fFin, "Präsident stützt den strikten Sparkurs im Kabinett.");
          }
          if (fWirt) {
            loyalitaetVerschieben(fWirt, -8);
            grollVerschieben(world, fWirt, 10);
            merke(world, fWirt, "Kürzungen im Wirtschaftsetat verärgern die Industrie.");
          }
          if (fGen) {
            loyalitaetVerschieben(fGen, -8);
            grollVerschieben(world, fGen, 10);
            merke(world, fGen, "Verteidigungsetat gekürzt zugunsten der Schuldenbremse.");
          }
          wirke(world, "vertrauen_maerkte", 3);
          // Ausgabenstopp über den fiskalischen Impuls: Das Defizit sinkt, aber die Nachfrage fällt mit (Gegenrechnung über die Auslastung).
          // Der alte Eingriff in die Defizit-Grundlinie war kostenlos und alle 45 Tage wiederholbar. Gedeckelt auf ±3 % des BIP (Spielparameter).
          world.economy.fiscalImpulse = clamp(world.economy.fiscalImpulse - 0.6, -3, 3);
        },
      },
      {
        id: "investieren",
        titel: "Wachstumsimpuls & Rüstungsmodernisierung",
        text: "Kreditfinanzierte Mittel für heimische Industrieprojekte und Beschaffungen. Kurbelt die Konjunktur an, belastet aber Lira und Haushaltsdisziplin.",
        befuerworter: [wirt?.name ?? "Wirtschaftsminister", gen?.name ?? "Chef des Generalstabs"].filter(Boolean),
        gegner: [fin?.name ?? "Finanzminister"].filter(Boolean),
        kostenPk: 2,
        effekteText: [
          `${wirt?.name ?? "Wirtschaft"} & ${gen?.name ?? "Generalstab"}: +10 Loyalität`,
          `${fin?.name ?? "Finanzen"}: -12 Loyalität, sammelt Groll`,
          "Nachfrageimpuls von 0,4 % des BIP stützt das Wachstum; Preis: Defizit und Schulden steigen. Bereitschaft der Streitkräfte steigt",
        ],
        ausfuehren: (world) => {
          const fs = world.spiel?.figuren ?? [];
          const fFin = fs.find((x) => x.amt === "finanzen");
          const fWirt = fs.find((x) => x.amt === "wirtschaft");
          const fGen = fs.find((x) => x.amt === "generalstab");
          if (fFin) {
            loyalitaetVerschieben(fFin, -12);
            grollVerschieben(world, fFin, 15);
            merke(world, fFin, "Ausgabenrausch gegen das Votum des Finanzministeriums.");
          }
          if (fWirt) {
            loyalitaetVerschieben(fWirt, 10);
            merke(world, fWirt, "Präsident bewilligt Industriemittel im Kabinett.");
          }
          if (fGen) {
            loyalitaetVerschieben(fGen, 10);
            merke(world, fGen, "Zusätzliche Rüstungsbudgets beschlossen.");
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
        titel: "Präsidialer Kompromiss (Gleichmäßige Deckelung)",
        text: "Keine Einsparungen, aber auch keine Sonderbudgets. Hält den Kabinettsfrieden, löst jedoch keines der strukturellen Probleme.",
        befuerworter: ["Präsidialamt (Stab)"].filter(Boolean),
        gegner: [],
        effekteText: [
          "Kabinettsstimmung bleibt stabil (keine nennenswerten Verluste)",
          "Legitimität +1 Pkt. durch besonnenes Krisenmanagement",
        ],
        ausfuehren: (world) => {
          wirke(world, "legitimitaet", 1);
        },
      },
    ],
  });

  // Thema 2: Innere Sicherheit vs. Rechtsstaat (Inneres vs. Justiz)
  themen.push({
    id: "sicherheit_justiz",
    titel: "Sicherheitsdoktrin: Härte der Polizei vs. Rechtsstaatlichkeit",
    ressort: "Inneres & Justiz",
    anlass: `${inn?.name ?? "Das Innenministerium"} verlangt erweiterte Durchgriffsrechte bei Protesten, während ${jus?.name ?? "die Justiz"} vor Rügen des Verfassungsgerichts warnt.`,
    dringlichkeit: nationalAverage(NET, w.net, "kriminalitaet") > 50 || nationalAverage(NET, w.net, "polarisierung") > 60 ? "hoch" : "normal",
    optionen: [
      {
        id: "haerte",
        titel: "Rückendeckung für den Sicherheitsapparat",
        text: "Erweiterte Befugnisse für Polizei und Sicherheitskräfte. Senkt die Kriminalität, vertieft jedoch die gesellschaftliche Spaltung.",
        befuerworter: [inn?.name ?? "Innenministerin"].filter(Boolean),
        gegner: [jus?.name ?? "Justizministerin"].filter(Boolean),
        effekteText: [
          `${inn?.name ?? "Inneres"}: +14 Loyalität (Sicherheitslager jubelt)`,
          `${jus?.name ?? "Justiz"}: -12 Loyalität, +12 Groll (Rechtsstaatslager protestiert)`,
          "Kriminalität -3 Pkt., Polarisierung +2 Pkt.",
        ],
        ausfuehren: (world) => {
          const fs = world.spiel?.figuren ?? [];
          const fInn = fs.find((x) => x.amt === "inneres");
          const fJus = fs.find((x) => x.amt === "justiz");
          if (fInn) {
            loyalitaetVerschieben(fInn, 14);
            merke(world, fInn, "Präsident stärkt den Sicherheitskräften den Rücken.");
          }
          if (fJus) {
            loyalitaetVerschieben(fJus, -12);
            grollVerschieben(world, fJus, 12);
            merke(world, fJus, "Befugniserweiterung ignoriert rechtsstaatliche Bedenken.");
          }
          wirke(world, "kriminalitaet", -3);
          wirke(world, "polarisierung", 2);
        },
      },
      {
        id: "rechtsstaat",
        titel: "Priorität für Verfassungs- und Bürgerrechte",
        text: "Justizaufsicht verschärfen und Übergriffe untersuchen lassen. Erhöht das internationale Ansehen, schwächt aber die Ministerin des Innern.",
        befuerworter: [jus?.name ?? "Justizministerin"].filter(Boolean),
        gegner: [inn?.name ?? "Innenministerin"].filter(Boolean),
        effekteText: [
          `${jus?.name ?? "Justiz"}: +12 Loyalität, Justizunabhängigkeit steigt`,
          `${inn?.name ?? "Inneres"}: -12 Loyalität, sammelt Groll`,
          "Internationales Ansehen +2 Pkt.",
        ],
        ausfuehren: (world) => {
          const fs = world.spiel?.figuren ?? [];
          const fInn = fs.find((x) => x.amt === "inneres");
          const fJus = fs.find((x) => x.amt === "justiz");
          if (fJus) {
            loyalitaetVerschieben(fJus, 12);
            merke(world, fJus, "Rechtsstaatliche Leitplanken im Ministerrat verteidigt.");
          }
          if (fInn) {
            loyalitaetVerschieben(fInn, -12);
            grollVerschieben(world, fInn, 14);
            merke(world, fInn, "Innenministerium fühlt sich von der Staatsführung im Stich gelassen.");
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
      titel: "Kabinettskrise: Koalitionsfrieden und Amtsdisziplin",
      ressort: "Staatsführung & Präsidialamt",
      anlass: "Die wachsende Zerrüttung im Ministerrat gefährdet die Regierungsfähigkeit. Mehrere Ressorts arbeiten gegeneinander.",
      dringlichkeit: "hoch",
      optionen: [
        {
          id: "machtwort",
          titel: "Autoritäres Machtwort: Disziplin einfordern",
          text: "Der Präsident stellt klar, dass Quertreiber unverzüglich entlassen werden. Bringt vorsichtige Minister auf Linie, provoziert jedoch stolze Figuren.",
          befuerworter: ["Präsidialamt (Stab)"].filter(Boolean),
          gegner: status.ruecktrittGefahr.map((m) => m.name),
          effekteText: [
            "Loyale Minister gewinnen +6 Loyalität",
            "Bereits rebellische Minister könnten endgültig brechen (-8 Loyalität)",
            "Disziplin-Signal stärkt das Vertrauen in die Regierung (+2 Pkt.)",
          ],
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
          titel: "Ressort-Paket: Zusätzliche Mittel zur Befriedung",
          text: "Kostet 5 Politisches Kapital. Der Präsident stellt allen Ministerien zusätzliche Handlungsbudgets bereit, um die Gemüter zu beruhigen.",
          befuerworter: status.minister.map((m) => m.name),
          gegner: [],
          kostenPk: 5,
          effekteText: [
            "Alle 7 Kabinettsminister gewinnen +8 Loyalität",
            "Groll aller Minister sinkt um -15 Punkte",
            "Kostet 5 Politisches Kapital",
          ],
          ausfuehren: (world) => {
            const fs = world.spiel?.figuren ?? [];
            for (const f of fs) {
              if (!AEMTER[f.amt].regierungsamt) continue;
              loyalitaetVerschieben(f, 8);
              grollVerschieben(world, f, -15);
              merke(world, f, "Präsident stellt Sonderbudget zur Kabinettsbefriedung bereit.");
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
  const thema = themen.find((t) => t.id === themaId);
  if (!thema) return { erfolg: false, text: "Thema nicht gefunden.", effekteText: [] };

  const opt = thema.optionen.find((o) => o.id === optionId);
  if (!opt) return { erfolg: false, text: "Beschlussoption nicht gefunden.", effekteText: [] };

  if (opt.kostenPk && (w.spiel?.kapital ?? 0) + 20 < opt.kostenPk) {
    return { erfolg: false, text: "Dafür reicht das Politische Kapital nicht aus.", effekteText: [] };
  }

  opt.ausfuehren(w);

  if (w.spiel) {
    w.spiel.zuletzt = w.spiel.zuletzt ?? {};
    w.spiel.zuletzt.kabinettssitzung = w.day;
  }

  addLog(
    w,
    "entscheidung",
    `Kabinettssitzung beschlossen: ${thema.titel} – „${opt.titel}“.`,
    `Beschluss im Ministerrat: ${opt.effekteText.join("; ")}`
  );

  return {
    erfolg: true,
    text: `Der Ministerrat hat getagt: „${opt.titel}“ wurde als offizielle Regierungslinie beschlossen.`,
    effekteText: opt.effekteText,
  };
}
