// Der Dienst meldet sich auf dem Schreibtisch (Welle E3, 7. November 2026).
//
// Befund im Spielstand des Inhabers (dokumentation/analyse_2026-11-05/bereiche/machtkreis_dienst.md): 15 Jahre keine Auslandsoperation,
// Kapazität 100 von 100 ungenutzt, 2 fremde Operationen gegen die Türkei, keine gemeldet. Die Operationen hatten keinen Zweck und einen
// negativen Erwartungswert. Fünf Vorgänge nach dem, was der echte MİT tut (Belege in sim/welt-dienst.ts bei VORGANG):
//
//   dienst_zugriff      Ein Gesuchter wurde im Ausland gesehen: Zugriff anordnen, die Auslieferung verlangen oder es lassen.
//   dienst_kader        Führungskader der PKK oder des IS geortet: gezielter Schlag, Festnahme am Boden oder abwarten.
//   dienst_kanal        Washington und Moskau suchen einen Ort für einen Austausch: ihn in Ankara ausrichten oder einem anderen überlassen.
//   dienst_aufgeflogen  Eine eigene Operation ist aufgeflogen: dementieren, Verantwortliche opfern, sich bekennen.
//   dienst_fremd        Der Dienst hat eine fremde Operation gegen die Türkei aufgedeckt (vorher verfiel sie bei vollem Schreibtisch).
//
// Gelegenheiten (Zugriff, Kader, Kanal) kommen höchstens eine im Quartal. Alle würfeln aus Samen, Vorlage und Tag (eigenerWurf) und
// konkurrieren ohne Zusatzplatz. Aussicht, Risiko und Folgen, die eine Antwort nennt, sind die Zahlen, die angeordnet und gebucht werden.

import { t, zahl as zahlFmt } from "../i18n";
import { opt } from "./ereignis-hilfen";
import type { Option, Vorlage } from "./ereignis-hilfen";
import { hashWert } from "./aufmerksamkeit";
import { vertrauenAendern, wirke } from "./wirkung";
import { aussenZustand } from "./diplomatie";
import { AKTEUR_IDS, akteurName, beziehungAendern, beziehungZurTuerkei } from "./welt-modell";
import { landFormen, landZahl } from "./ereignisse-krieg";
import {
  GEGENSPIONAGE_KAPAZITAET,
  OP_DEFS,
  VORGANG,
  beantworteEinfluss,
  dienst,
  kapazitaetMax,
  offeneFremde,
  ordneVorgangAn,
  vorgangAussicht,
  vorgangGrund,
  type KaderWeg,
} from "./welt-dienst";
import type { World } from "./types";
import type { OffenesEreignis } from "./spiel-typen";

// ---------------------------------------------------------------------------
// Spielparameter

export const DIENST_VORGAENGE = {
  /** Höchstens eine Gelegenheit (Zugriff, Kader, Kanal) in so vielen Tagen */
  quartal: 90,
  /** Erst nach dem ersten halben Jahr im Amt */
  ab: 180,
  zugriff: { chance: 0.07, frist: 21, abkuehlung: 360 },
  kader: { chance: 0.08, frist: 14, abkuehlung: 300, ab: 25 },
  kanal: { chance: 0.04, frist: 30, abkuehlung: 1095, vertrauen: 35 },
  /**
   * Gastländer eines Zugriffs. Belegte Fälle: Kosovo 2018, Moldau 2018, Mongolei 2018 (gescheitert), Kirgistan 2021, Kenia 2024 (Belege in
   * sim/welt-dienst.ts); diese Staaten führt das Spiel nicht. Gewählt sind Staaten des Spiels, in denen Ankara Gesuchte vermutet und
   * Auslieferungen verlangt hat, mit sehr verschiedener Mitwirkung (Spielparameter): Zentralasien, Aserbaidschan, Pakistan, Ukraine, Irak,
   * dazu Schweden und Deutschland, wo ein Zugriff kaum unbemerkt bliebe.
   */
  gastlaender: ["KGZ", "KAZ", "UZB", "TKM", "AZE", "PAK", "UKR", "IRQ", "SWE", "DEU"],
  /** Auslieferung verlangen: Druck auf das Gastland, Rückhalt im eigenen Lager */
  auslieferung: { pk: 1, vertrauen: -2, nationalisten: 0.5 },
  /** Einen Zugriff liegen lassen: Der Gesuchte setzt sich ab */
  zugriffLiegen: { nationalisten: -0.3 },
  /** Kader liegen lassen: Der Täterkreis plant weiter */
  kaderLiegen: { taeter: 3, terrorgefahr: 0.5 },
  /** Kanal liegen lassen: Ein anderer Vermittler übernimmt (Vorbild: Austausch Griner gegen Bout in Abu Dhabi am 08.12.2022, vermittelt von den Emiraten und Saudi-Arabien) */
  kanalLiegen: { ansehen: -0.3 },
  aufgeflogen: {
    frist: 14,
    /** Dementieren und zum Staatsgeheimnis erklären (Vorbild MİT-Lkw 2014: Nachrichtensperre, 2015 Anklage gegen Journalisten der Cumhuriyet) */
    dementieren: { pk: 1, pressefreiheit: -2, vertrauen: 0.4, land: -2 },
    /** Verantwortliche opfern: Abteilung aufgelöst, Kapazität verloren, das Gastland sieht ein Zeichen */
    opfern: { pk: 1, kapazitaet: -15, land: 4, vertrauen: -0.3 },
    /** Sich bekennen (Vorbild: Erdoğan stellte am 05.07.2021 den aus Kirgistan geholten Orhan İnandı selbst vor) */
    bekennen: { pk: 0, nationalisten: 1.5, ansehen: -1.5, land: -4, eu: -2 },
    /** Schweigen: Die Presse gräbt weiter */
    liegen: { vertrauen: -1 },
  },
} as const;

/** Vorzeichen und Zahl in der Sprache des Spiels (+1,5 / −0,3). */
const zahl = (x: number): string => `${x > 0 ? "+" : x < 0 ? "−" : ""}${zahlFmt(Math.abs(x), Number.isInteger(x) ? 0 : 1)}`;
const pz = (x: number): number => Math.round(x * 100);
const tageSeit = (w: World, tag: number | undefined): number => w.day - (tag ?? -1e9);
const zumDienst = (ev?: OffenesEreignis): NonNullable<Option["stelle"]> => ({ art: "dienst", ...(ev?.daten?.land ? { ziel: String(ev.daten.land) } : {}) });
const landVon = (ev: OffenesEreignis, ersatz = "KGZ"): string => String(ev.daten?.land ?? ersatz);
const lp = (ev: OffenesEreignis, ersatz?: string) => ({ land: landFormen(landVon(ev, ersatz)), nz: landZahl(landVon(ev, ersatz)), name: akteurName(landVon(ev, ersatz)) });

/** Ob eine Gelegenheit des Dienstes kommen darf: nach dem ersten halben Jahr und höchstens eine im Quartal. */
function gelegenheitFrei(w: World): boolean {
  if (!w.spiel || w.day < DIENST_VORGAENGE.ab) return false;
  return tageSeit(w, dienst(w).gelegenheit) >= DIENST_VORGAENGE.quartal;
}
const merkeGelegenheit = (w: World): void => {
  dienst(w).gelegenheit = w.day;
};

/** Eine Antwort, die einen Vorgang anordnet: Preis aus OP_DEFS, Aussicht und Risiko aus derselben Rechnung, die ihn auflöst. */
function vorgangOption(w: World, ev: OffenesEreignis, id: string, art: "zugriff" | "kader" | "kanal", ziel: string, daten: Record<string, string | number>, label: string, beschreibung: string, folgen: string[]): Option {
  const def = OP_DEFS[art];
  const a = vorgangAussicht(w, art, ziel, (daten.weg as KaderWeg | undefined) ?? "schlag");
  const grund = vorgangGrund(w, art);
  return {
    ...opt(id, label, beschreibung, def.pk, (ww) => ordneVorgangAn(ww, art, ziel, daten)),
    stelle: zumDienst(ev),
    bedingungen: [
      art === "kanal" ? t("welle_e3.dienst.aussicht_ohne", { p: pz(a.p) }) : t("welle_e3.dienst.aussicht", { p: pz(a.p), auf: pz(a.pAuf) }),
      t("welle_e3.dienst.bindet", { kap: def.kap, monate: def.monate }),
      ...folgen,
    ],
    ...(grund ? { sperre: grund } : {}),
  };
}

// ---------------------------------------------------------------------------
// Zugriff auf einen Gesuchten

/** Das Gastland: deterministisch aus Samen und Tag unter den Staaten des Spiels gewählt. */
function gastland(w: World): string {
  const liste = DIENST_VORGAENGE.gastlaender.filter((id) => AKTEUR_IDS.includes(id));
  return liste[Math.floor(hashWert(`${w.seed}|zugriff|land|${w.day}`) * liste.length)] ?? "KGZ";
}

const ZUGRIFF: Vorlage = {
  id: "dienst_zugriff",
  eigenerWurf: true,
  ohneZusatzplatz: true,
  szene: "istanbul",
  frist: DIENST_VORGAENGE.zugriff.frist,
  abkuehlung: DIENST_VORGAENGE.zugriff.abkuehlung,
  chance: (w) => (gelegenheitFrei(w) ? DIENST_VORGAENGE.zugriff.chance : 0),
  erzeuge: (w) => ({ provinzen: [], staerke: 1, daten: { land: gastland(w), gruppe: hashWert(`${w.seed}|zugriff|gruppe|${w.day}`) < 0.6 ? "guelen" : "pkk" } }),
  eroeffne: (w) => merkeGelegenheit(w),
  titel: (_w, ev) => t("welle_e3.zugriff.titel", lp(ev)),
  text: (w, ev) => {
    const id = landVon(ev);
    return [t(`welle_e3.zugriff.text1.${ev.daten?.gruppe === "pkk" ? "pkk" : "guelen"}`, lp(ev)), t("welle_e3.zugriff.text2", { ...lp(ev), vertrauen: Math.round(beziehungZurTuerkei(w, id).vertrauen) })];
  },
  warum: () => t("welle_e3.zugriff.warum"),
  stelle: (_w, ev) => zumDienst(ev),
  optionen: (w, ev) => {
    const id = landVon(ev);
    const q = VORGANG.zugriff;
    const a = DIENST_VORGAENGE.auslieferung;
    return [
      vorgangOption(w, ev, "zugriff", "zugriff", id, { gruppe: String(ev.daten?.gruppe ?? "guelen") }, t("welle_e3.zugriff.opt.zugriff.label"), t("welle_e3.zugriff.opt.zugriff.beschr", lp(ev)), [
        t("welle_e3.zugriff.opt.zugriff.erfolg", { kapital: zahl(q.erfolg.kapital), nat: zahl(q.erfolg.nationalisten) }),
        t("welle_e3.zugriff.opt.zugriff.auf", { ...lp(ev), vertrauen: zahl(q.aufgeflogen.vertrauen), ansehen: zahl(q.aufgeflogen.ansehen), eu: zahl(q.aufgeflogen.eu) }),
      ]),
      {
        ...opt("auslieferung", t("welle_e3.zugriff.opt.auslieferung.label"), t("welle_e3.zugriff.opt.auslieferung.beschr", lp(ev)), a.pk, (ww) => {
          beziehungAendern(ww, id, { vertrauen: a.vertrauen });
          wirke(ww, "nationalisten", a.nationalisten);
          return t("welle_e3.zugriff.opt.auslieferung.aus", lp(ev));
        }),
        stelle: zumDienst(ev),
        bedingungen: [t("welle_e3.zugriff.opt.auslieferung.zahlen", { ...lp(ev), vertrauen: zahl(a.vertrauen), nat: zahl(a.nationalisten) })],
      },
      { ...opt("abwarten", t("welle_e3.zugriff.opt.abwarten.label"), t("welle_e3.zugriff.opt.abwarten.beschr"), 0, (ww) => zugriffLiegen(ww)), stelle: zumDienst(ev), bedingungen: [t("welle_e3.zugriff.opt.abwarten.zahlen", { nat: zahl(DIENST_VORGAENGE.zugriffLiegen.nationalisten) })] },
    ];
  },
  standard: (w) => zugriffLiegen(w),
};

function zugriffLiegen(w: World): string {
  wirke(w, "nationalisten", DIENST_VORGAENGE.zugriffLiegen.nationalisten);
  return t("welle_e3.zugriff.opt.abwarten.aus");
}

// ---------------------------------------------------------------------------
// Schlag gegen Kader

/** Der stärkere Täterkreis (PKK oder IS) und wo seine Führung sitzt. */
function kaderZiel(w: World): { taeter: "pkk" | "is"; land: string; wert: number } {
  const tz = aussenZustand(w).terror;
  if (tz.is > tz.pkk) return { taeter: "is", land: "SYR", wert: tz.is };
  // PKK-Kader meist im Nordirak (Kandil, Sulaimaniyya), seltener in Nordsyrien (Kamışlı)
  return { taeter: "pkk", land: hashWert(`${w.seed}|kader|land|${w.day}`) < 0.7 ? "IRQ" : "SYR", wert: tz.pkk };
}

const KADER: Vorlage = {
  id: "dienst_kader",
  eigenerWurf: true,
  ohneZusatzplatz: true,
  szene: "anatolien",
  frist: DIENST_VORGAENGE.kader.frist,
  abkuehlung: DIENST_VORGAENGE.kader.abkuehlung,
  chance: (w) => {
    if (!gelegenheitFrei(w)) return 0;
    const z = kaderZiel(w);
    return z.wert >= DIENST_VORGAENGE.kader.ab ? DIENST_VORGAENGE.kader.chance * Math.min(1.5, z.wert / 40) : 0;
  },
  erzeuge: (w) => {
    const z = kaderZiel(w);
    return { provinzen: [], staerke: 1, daten: { land: z.land, taeter: z.taeter } };
  },
  eroeffne: (w) => merkeGelegenheit(w),
  titel: (_w, ev) => t(`welle_e3.kader.titel.${ev.daten?.taeter === "is" ? "is" : "pkk"}`, lp(ev, "IRQ")),
  text: (w, ev) => {
    const taeter = ev.daten?.taeter === "is" ? "is" : "pkk";
    const az = aussenZustand(w);
    const frieden = taeter === "pkk" && az.friedens.phase >= 1;
    return [t(`welle_e3.kader.text1.${taeter}`, { ...lp(ev, "IRQ"), wert: Math.round(az.terror[taeter]) }), t(frieden ? "welle_e3.kader.text2.frieden" : "welle_e3.kader.text2", { phase: t(`aussen.frieden.name${az.friedens.phase}`) })];
  },
  warum: () => t("welle_e3.kader.warum"),
  stelle: (_w, ev) => zumDienst(ev),
  optionen: (w, ev) => {
    const id = landVon(ev, "IRQ");
    const taeter = ev.daten?.taeter === "is" ? "is" : "pkk";
    const q = VORGANG.kader;
    const frieden = taeter === "pkk" && aussenZustand(w).friedens.phase >= 1;
    const folgen = (weg: KaderWeg): string[] => [
      t(`welle_e3.kader.opt.erfolg.${weg}`, { punkte: zahl(-q.erfolg.taeter[weg]), terror: zahl(q.erfolg.terrorgefahr), nat: zahl(q.erfolg.nationalisten), ansehen: zahl(q.erfolg.ansehenFestnahme) }),
      ...(frieden ? [t("welle_e3.kader.opt.frieden", { punkte: zahl(q.erfolg.frieden[weg]), minderheiten: zahl(q.erfolg.minderheiten) })] : []),
      t("welle_e3.kader.opt.auf", { ...lp(ev, "IRQ"), vertrauen: zahl(q.aufgeflogen.vertrauen), konflikt: zahl(q.aufgeflogen.konflikt) }),
    ];
    const l = DIENST_VORGAENGE.kaderLiegen;
    return [
      vorgangOption(w, ev, "schlag", "kader", id, { taeter, weg: "schlag" }, t("welle_e3.kader.opt.schlag.label"), t(`welle_e3.kader.opt.schlag.beschr.${taeter}`, lp(ev, "IRQ")), folgen("schlag")),
      vorgangOption(w, ev, "festnahme", "kader", id, { taeter, weg: "festnahme" }, t("welle_e3.kader.opt.festnahme.label"), t(`welle_e3.kader.opt.festnahme.beschr.${taeter}`, lp(ev, "IRQ")), folgen("festnahme")),
      { ...opt("abwarten", t("welle_e3.kader.opt.abwarten.label"), t("welle_e3.kader.opt.abwarten.beschr"), 0, (ww, e) => kaderLiegen(ww, e)), stelle: zumDienst(ev), bedingungen: [t("welle_e3.kader.opt.abwarten.zahlen", { punkte: zahl(l.taeter), terror: zahl(l.terrorgefahr) })] },
    ];
  },
  standard: (w, ev) => kaderLiegen(w, ev),
};

function kaderLiegen(w: World, ev: OffenesEreignis): string {
  const taeter = ev.daten?.taeter === "is" ? "is" : "pkk";
  const az = aussenZustand(w);
  az.terror[taeter] = Math.min(100, Math.round((az.terror[taeter] + DIENST_VORGAENGE.kaderLiegen.taeter) * 10) / 10);
  wirke(w, "terrorgefahr", DIENST_VORGAENGE.kaderLiegen.terrorgefahr);
  return t(`welle_e3.kader.opt.abwarten.aus.${taeter}`);
}

// ---------------------------------------------------------------------------
// Kanal: ein Austausch über Ankara

const KANAL: Vorlage = {
  id: "dienst_kanal",
  eigenerWurf: true,
  ohneZusatzplatz: true,
  szene: "istanbul",
  frist: DIENST_VORGAENGE.kanal.frist,
  abkuehlung: DIENST_VORGAENGE.kanal.abkuehlung,
  chance: (w) => {
    if (!gelegenheitFrei(w)) return 0;
    const g = DIENST_VORGAENGE.kanal.vertrauen;
    return beziehungZurTuerkei(w, "USA").vertrauen >= g && beziehungZurTuerkei(w, "RUS").vertrauen >= g ? DIENST_VORGAENGE.kanal.chance : 0;
  },
  erzeuge: () => ({ provinzen: [], staerke: 1, daten: { land: "USA" } }),
  eroeffne: (w) => merkeGelegenheit(w),
  titel: () => t("welle_e3.kanal.titel"),
  text: (w) => [t("welle_e3.kanal.text1"), t("welle_e3.kanal.text2", { usa: Math.round(beziehungZurTuerkei(w, "USA").vertrauen), rus: Math.round(beziehungZurTuerkei(w, "RUS").vertrauen) })],
  warum: () => t("welle_e3.kanal.warum"),
  stelle: () => zumDienst(),
  optionen: (w, ev) => {
    const q = VORGANG.kanal;
    return [
      vorgangOption(w, ev, "ausrichten", "kanal", "USA", {}, t("welle_e3.kanal.opt.ausrichten.label"), t("welle_e3.kanal.opt.ausrichten.beschr"), [
        t("welle_e3.kanal.opt.ausrichten.erfolg", { ansehen: zahl(q.erfolg.ansehen), vertrauen: zahl(q.erfolg.vertrauen) }),
        t("welle_e3.kanal.opt.ausrichten.fehlschlag", { vertrauen: zahl(q.fehlschlag.vertrauen) }),
      ]),
      { ...opt("abwarten", t("welle_e3.kanal.opt.abwarten.label"), t("welle_e3.kanal.opt.abwarten.beschr"), 0, (ww) => kanalLiegen(ww)), stelle: zumDienst(), bedingungen: [t("welle_e3.kanal.opt.abwarten.zahlen", { ansehen: zahl(DIENST_VORGAENGE.kanalLiegen.ansehen) })] },
    ];
  },
  standard: (w) => kanalLiegen(w),
};

function kanalLiegen(w: World): string {
  wirke(w, "ansehen", DIENST_VORGAENGE.kanalLiegen.ansehen);
  return t("welle_e3.kanal.opt.abwarten.aus");
}

// ---------------------------------------------------------------------------
// Eine eigene Operation ist aufgeflogen

const AUFGEFLOGEN: Vorlage = {
  id: "dienst_aufgeflogen",
  eigenerWurf: true,
  // Entscheidung des Koordinators (Welle E3): eigener Platz, an einem festen Tag des Monats (zieht keine Zahl aus dem Takt)
  eigenerPlatz: true,
  tag: 2,
  szene: "istanbul",
  frist: DIENST_VORGAENGE.aufgeflogen.frist,
  abkuehlung: 20,
  chance: (w) => (w.spiel && (dienst(w).aufgeflogen?.length ?? 0) > 0 ? 1 : 0),
  erzeuge: (w) => {
    const a = w.spiel ? dienst(w).aufgeflogen?.[0] : undefined;
    // Ohne offenen Fall (Textprüfung, Wächter gegen Schau): eine Desinformation in Griechenland
    return { provinzen: [], staerke: 1, daten: a ? { land: a.ziel, art: a.art, op: a.op } : { land: "GRC", art: "desinfo", op: 0 } };
  },
  eroeffne: (w, ev) => {
    const dz = dienst(w);
    dz.aufgeflogen = (dz.aufgeflogen ?? []).filter((x) => x.op !== Number(ev.daten?.op ?? -1));
  },
  titel: (_w, ev) => t("welle_e3.auf.titel", { ...lp(ev, "GRC"), op: OP_DEFS[String(ev.daten?.art ?? "desinfo") as keyof typeof OP_DEFS]?.name ?? "" }),
  text: (_w, ev) => [t("welle_e3.auf.text1", { ...lp(ev, "GRC"), op: OP_DEFS[String(ev.daten?.art ?? "desinfo") as keyof typeof OP_DEFS]?.name ?? "" }), t("welle_e3.auf.text2")],
  warum: () => t("welle_e3.auf.warum"),
  stelle: (_w, ev) => zumDienst(ev),
  optionen: (w, ev) => {
    const id = landVon(ev, "GRC");
    const q = DIENST_VORGAENGE.aufgeflogen;
    return [
      {
        ...opt("dementieren", t("welle_e3.auf.dementieren.label"), t("welle_e3.auf.dementieren.beschr"), q.dementieren.pk, (ww) => {
          wirke(ww, "pressefreiheit", q.dementieren.pressefreiheit);
          vertrauenAendern(ww, q.dementieren.vertrauen);
          beziehungAendern(ww, id, { vertrauen: q.dementieren.land });
          return t("welle_e3.auf.dementieren.aus", lp(ev, "GRC"));
        }),
        stelle: zumDienst(ev),
        bedingungen: [t("welle_e3.auf.dementieren.zahlen", { ...lp(ev, "GRC"), presse: zahl(q.dementieren.pressefreiheit), vertrauen: zahl(q.dementieren.vertrauen), bez: zahl(q.dementieren.land) })],
      },
      {
        ...opt("opfern", t("welle_e3.auf.opfern.label"), t("welle_e3.auf.opfern.beschr"), q.opfern.pk, (ww) => {
          const dz = dienst(ww);
          dz.kapazitaet = Math.max(0, dz.kapazitaet + q.opfern.kapazitaet);
          beziehungAendern(ww, id, { vertrauen: q.opfern.land });
          vertrauenAendern(ww, q.opfern.vertrauen);
          return t("welle_e3.auf.opfern.aus", lp(ev, "GRC"));
        }),
        stelle: zumDienst(ev),
        bedingungen: [t("welle_e3.auf.opfern.zahlen", { ...lp(ev, "GRC"), kap: zahl(q.opfern.kapazitaet), bez: zahl(q.opfern.land), vertrauen: zahl(q.opfern.vertrauen) })],
      },
      {
        ...opt("bekennen", t("welle_e3.auf.bekennen.label"), t("welle_e3.auf.bekennen.beschr"), q.bekennen.pk, (ww) => {
          wirke(ww, "nationalisten", q.bekennen.nationalisten);
          wirke(ww, "ansehen", q.bekennen.ansehen);
          beziehungAendern(ww, id, { vertrauen: q.bekennen.land });
          if (id !== "EU") beziehungAendern(ww, "EU", { vertrauen: q.bekennen.eu });
          return t("welle_e3.auf.bekennen.aus", lp(ev, "GRC"));
        }),
        stelle: zumDienst(ev),
        bedingungen: [t("welle_e3.auf.bekennen.zahlen", { ...lp(ev, "GRC"), nat: zahl(q.bekennen.nationalisten), ansehen: zahl(q.bekennen.ansehen), bez: zahl(q.bekennen.land), eu: zahl(q.bekennen.eu) })],
      },
      { ...opt("abwarten", t("welle_e3.auf.abwarten.label"), t("welle_e3.auf.abwarten.beschr"), 0, (ww) => aufLiegen(ww)), stelle: zumDienst(ev), bedingungen: [t("welle_e3.auf.abwarten.zahlen", { vertrauen: zahl(q.liegen.vertrauen) })] },
    ];
  },
  standard: (w) => aufLiegen(w),
};

function aufLiegen(w: World): string {
  vertrauenAendern(w, DIENST_VORGAENGE.aufgeflogen.liegen.vertrauen);
  return t("welle_e3.auf.abwarten.aus");
}

// ---------------------------------------------------------------------------
// Eine fremde Operation gegen die Türkei ist aufgedeckt (Antworten wie bisher aus sim/welt-dienst.ts, `beantworteEinfluss`)

type EinflussArt = "einfluss" | "medien" | "abhoeren";
const artVon = (ev: OffenesEreignis): EinflussArt => (["einfluss", "medien", "abhoeren"].includes(String(ev.daten?.art)) ? String(ev.daten?.art) : "einfluss") as EinflussArt;

const FREMD: Vorlage = {
  id: "dienst_fremd",
  eigenerWurf: true,
  ohneZusatzplatz: true,
  szene: "istanbul",
  frist: 30,
  abkuehlung: 45,
  chance: (w) => (w.spiel && offeneFremde(w) ? 1 : 0),
  erzeuge: (w) => {
    const x = w.spiel ? offeneFremde(w) : undefined;
    return { provinzen: [], staerke: 0.5, daten: x ? { land: x.von, art: x.art, opId: x.id } : { land: "RUS", art: "einfluss", opId: 0 } };
  },
  eroeffne: (w, ev) => {
    const x = dienst(w).eingehend.find((y) => y.id === Number(ev.daten?.opId ?? -1));
    if (x) x.gemeldet = true;
  },
  titel: (_w, ev) => t("ev.welt_einfluss.titel", { ...lp(ev, "RUS"), art: t(`ev.welt_einfluss.art.${artVon(ev)}`) }),
  text: (_w, ev) => [t(`ev.welt_einfluss.text1.${artVon(ev)}`, lp(ev, "RUS")), t("welle_e3.fremd.text2")],
  warum: () => t("welle_e3.fremd.warum"),
  stelle: () => zumDienst(),
  optionen: (w, ev) => {
    const von = landVon(ev, "RUS");
    const art = artVon(ev);
    const op = Number(ev.daten?.opId ?? 0);
    const anteil = (100 * GEGENSPIONAGE_KAPAZITAET) / Math.max(1, kapazitaetMax(w));
    return [
      { ...opt("gegenspionage", t("ev.welt_einfluss.opt.gegenspionage.label"), t("ev.welt_einfluss.opt.gegenspionage.beschr", { anteil }), 2, (ww) => beantworteEinfluss(ww, op, von, art, "gegenspionage")), stelle: zumDienst() },
      { ...opt("oeffentlich", t("ev.welt_einfluss.opt.oeffentlich.label"), t("ev.welt_einfluss.opt.oeffentlich.beschr", lp(ev, "RUS")), 1, (ww) => beantworteEinfluss(ww, op, von, art, "oeffentlich")), stelle: zumDienst() },
      { ...opt("mediengesetz", t("ev.welt_einfluss.opt.mediengesetz.label"), t("ev.welt_einfluss.opt.mediengesetz.beschr"), 3, (ww) => beantworteEinfluss(ww, op, von, art, "mediengesetz")), stelle: zumDienst() },
      { ...opt("abwarten", t("welle_e3.fremd.abwarten.label"), t("welle_e3.fremd.abwarten.beschr"), 0, (ww) => beantworteEinfluss(ww, op, von, art, "nichts")), stelle: zumDienst() },
    ];
  },
  standard: (w, ev) => beantworteEinfluss(w, Number(ev.daten?.opId ?? 0), landVon(ev, "RUS"), artVon(ev), "nichts"),
};

export const DIENST_VORLAGEN: Vorlage[] = [ZUGRIFF, KADER, KANAL, AUFGEFLOGEN, FREMD];
