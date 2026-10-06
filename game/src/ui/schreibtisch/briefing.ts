// Das Tagesbriefing des Schreibtischs: Lage in einem Blick, was fällig ist, wovor das Spiel warnt, was der Beraterstab rät, was ansteht.
// Alles wird aus dem Weltzustand berechnet; nichts davon ist Text auf Vorrat. Jeder Eintrag führt zu einer Entscheidung
// (eine Akte, eine Maßnahme, ein Gespräch), damit der Schreibtisch nie nur Anzeige ist.

import { aussenTermine } from "../../sim/diplomatie";
import { NET } from "../../sim/modell";
import { nationalAverage } from "../../sim/netz";
import { formatDateDe, addDays } from "../../sim/dates";
import { vorlage } from "../../sim/ereignisse";
import { stimmenSicht, stufeIn, REGELN } from "../../sim/handeln";
import { kapitalEinkommen, SPIEL } from "../../sim/spiel";
import { VERFASSUNG, belastungsTreiber, verfassungVon, type VerfassungsStufe } from "../../sim/aufmerksamkeit";
import { fraktionsUebersicht } from "../../sim/verhandeln";
import { waehlerLage } from "../../sim/waehler";
import { anrede, figur } from "../../sim/figuren";
import { naechsterSchritt, schrittMitProgramm } from "../../sim/programme";
import { akuteProbleme, vorschlaege as berechneVorschlaege, type Vorschlag } from "../../sim/vorschlaege";
import { handlungsHebel } from "../../sim/wege";
import { reichZustand } from "../../sim/reich";
import { ERBE_NACH_ID } from "../../data/erbe";
import { haltungWort, dimensionZu } from "../../sim/laender";
import { LAENDER, aktionenFuer } from "../../sim/laender";
import type { Theme } from "../../data/politiknetz";
import { naechsteSitzung } from "../../sim/zentralbank";
import { akteurName, weltModell } from "../../sim/welt-modell";
import { t } from "../../i18n";
import type { World } from "../../sim/types";
import { zusageText, zusageVon } from "../../sim/zusagen";

/** Wohin ein Eintrag führt. Die Bühne übersetzt das in ein Fenster. */
export type Ziel =
  | { art: "akte"; akte: "wirtschaft" | "entscheidungen" | "parlament" | "waehler" | "welt" | "personen" | "chronik" | "programme" | "beschluesse" | "bereiche" | "reich_kultur" | "reich_recht" | "reich_militaer" | "reich_infra" | "reich_haushalt" | "zeitung" | "wirkungsbericht" }
  | { art: "politik"; theme?: Theme; massnahme?: { id: string; level?: number; ort?: number[] | null } }
  | { art: "ereignis"; id: string }
  | { art: "land"; id: string };

/** Was ein Knopf tut: hingehen oder gleich handeln. */
export type Knopf =
  | { art: "gehe"; label: string; ziel: Ziel }
  | { art: "einbringen"; label: string; vorschlag: Vorschlag }
  | { art: "gespraech"; label: string; partei: string; pk: number };

export type Ton = "gut" | "schlecht" | "neutral";

export interface Kennzahl {
  id: string;
  label: string;
  wert: string;
  zusatz: string;
  trend: "auf" | "ab" | "gleich";
  ton: Ton;
  ziel: Ziel;
}

export interface Faellig {
  id: string;
  art: "ereignis" | "gesetz" | "zusage" | "schritt" | "duldung";
  titel: string;
  /** Tage bis zur Frist; undefined = ohne feste Frist */
  tage?: number;
  dringend: boolean;
  unter: string;
  knopf: Knopf;
}

export interface Warnung {
  id: string;
  stufe: "rot" | "gelb";
  text: string;
  warum: string;
  ziel: Ziel;
}

export interface Empfehlung {
  id: string;
  /** Wer rät: Rolle im Beraterstab */
  rat: string;
  /** Name der Person, wenn es sie im Spiel gibt */
  wer?: string;
  titel: string;
  /** Die Begründung, aus der Lage berechnet */
  text: string;
  /** Was es kostet, in Worten */
  kosten?: string;
  knoepfe: Knopf[];
  gewicht: number;
}

export interface Termin {
  id: string;
  tage: number;
  datum: string;
  text: string;
  ziel?: Ziel;
  /** Kalenderhinweis ohne Entscheidung: weicht beim Kürzen des Terminblatts den Terminen mit Entscheidung */
  weich?: true;
}

/** Das Belastungs-/Aufmerksamkeitskonto des Präsidenten für die dezente Doppelanzeige. */
export interface VerfassungSicht {
  aufmerksamkeit: number;
  belastung: number;
  stufe: VerfassungsStufe;
  stufeName: string;
  /** Datum, bis zu dem die Zwangspause läuft (fehlt, wenn keine läuft) */
  pauseBis?: string;
  /** Die stärksten Treiber der Belastung der letzten Wochen */
  treiber: string[];
  /** Was das Konto gerade tut, in einem Satz */
  fluss: string;
}

export interface Briefing {
  datum: string;
  amtszeit: { nummer: number; wahltag: string; monateBisWahl: number };
  kennzahlen: Kennzahl[];
  verfassung: VerfassungSicht | null;
  faellig: Faellig[];
  warnungen: Warnung[];
  empfehlungen: Empfehlung[];
  termine: Termin[];
}

const nf = (x: number, d = 1) => x.toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d });
const tageWort = (tage: number) => t("sk.tage", { n: Math.max(0, tage) });
const monateBis = (tage: number) => Math.max(0, Math.round(tage / 30.4));


/** Fester Kalender des Staatsjahres: Monat, ab welchem Jahr, und die Ereignisvorlage, die dort entsteht (siehe `ereignisse-innen.ts`). */
export const KALENDER: { id: string; vorlage: string; monat: number; abJahr: number; nurJahr?: number; text: (jahr: number) => string; ziel?: Ziel; /** Nur ein Hinweis im Terminblatt: keine Ereignisvorlage dahinter */ nurAnzeige?: true; /** Zählt nicht als „nächster fester Termin“ der Agenda und weicht beim Kürzen des Terminblatts den harten Terminen */ weich?: true }[] = [
  { id: "haushalt", vorlage: "haushaltsjahr", monat: 10, abJahr: 2028, text: (j) => t("sk.t.haushalt", { jahr: String(j + 1) }), ziel: { art: "akte", akte: "entscheidungen" } },
  { id: "mindestlohn", vorlage: "mindestlohn", monat: 12, abJahr: 2026, text: (j) => t("sk.t.mindestlohn", { jahr: String(j + 1) }), ziel: { art: "politik", theme: "arbeit" } },
  { id: "kommunal", vorlage: "kommunalwahl", monat: 3, abJahr: 2029, nurJahr: 2029, text: () => t("sk.t.kommunal"), ziel: { art: "akte", akte: "waehler" } },
  // Takt (sim/ereignisse-saison.ts): das Jahr hat Termine auch zwischen Januar und Juni; alle Texte über die Übersetzungsschicht
  { id: "jahresbilanz", vorlage: "saison_jahresbilanz", monat: 1, abJahr: 2029, text: () => t("takt.kalender.jahresbilanz") , weich: true },
  { id: "inflationsbericht-f", vorlage: "saison_inflationsbericht", monat: 2, abJahr: 2029, text: () => t("takt.kalender.inflationsbericht"), ziel: { art: "akte", akte: "wirtschaft" } , weich: true },
  { id: "rechnungshof", vorlage: "saison_rechnungshof", monat: 3, abJahr: 2029, text: () => t("takt.kalender.rechnungshof") , weich: true },
  { id: "souveraenitaetstag", vorlage: "saison_souveraenitaetstag", monat: 4, abJahr: 2029, text: () => t("takt.kalender.souveraenitaetstag") , weich: true },
  { id: "jugendtag", vorlage: "saison_jugendtag", monat: 5, abJahr: 2029, text: () => t("takt.kalender.jugendtag") , weich: true },
  { id: "inflationsbericht-m", vorlage: "saison_inflationsbericht", monat: 5, abJahr: 2029, text: () => t("takt.kalender.inflationsbericht"), ziel: { art: "akte", akte: "wirtschaft" } , weich: true },
  { id: "sommerpause", vorlage: "saison_sommerpause", monat: 6, abJahr: 2029, text: () => t("takt.kalender.sommerpause"), ziel: { art: "akte", akte: "parlament" } , weich: true },
  { id: "unesco", vorlage: "kalender_unesco", monat: 7, abJahr: 2028, text: () => t("takt.kalender.unesco") , nurAnzeige: true, weich: true },
  { id: "militaerrat", vorlage: "mil_militaerrat", monat: 8, abJahr: 2028, text: () => t("takt.kalender.militaerrat") , weich: true },
  { id: "ovp", vorlage: "kalender_ovp", monat: 9, abJahr: 2028, text: () => t("takt.kalender.ovp"), ziel: { art: "akte", akte: "wirtschaft" } , nurAnzeige: true, weich: true },
  { id: "eubericht", vorlage: "kalender_eubericht", monat: 11, abJahr: 2028, text: () => t("takt.kalender.eubericht"), ziel: { art: "land", id: "EU" } , nurAnzeige: true, weich: true },
];

/** Tage von heute bis zum ersten Tag des nächsten Auftretens von Monat/Jahr (mindestens ab `abJahr`), nie in der Vergangenheit. */
export function tageBisMonat(world: World, monat: number, abJahr: number, nurJahr?: number): { tage: number; jahr: number } | null {
  const [j, m] = world.date.split("-").map(Number) as [number, number];
  for (let jahr = Math.max(j, abJahr); jahr <= (nurJahr ?? j + 2); jahr++) {
    if (nurJahr !== undefined && jahr !== nurJahr) continue;
    const ziel = `${jahr}-${String(monat).padStart(2, "0")}-01`;
    const tage = Math.round((Date.parse(ziel) - Date.parse(world.date)) / 86_400_000);
    // Im laufenden Monat gilt der Termin noch als „läuft“, wenn das Ereignis erst entsteht
    const imMonat = jahr === j && monat === m;
    if (tage >= 0 || imMonat) return { tage: Math.max(0, tage), jahr };
  }
  return null;
}

export function kennzahlen(world: World): Kennzahl[] {
  const spiel = world.spiel;
  if (!spiel) return [];
  const z = spiel.umfrage.zustimmung;
  const vor = spiel.umfrage.verlauf.length > 3 ? spiel.umfrage.verlauf[spiel.umfrage.verlauf.length - 4]!.wert : undefined;
  const dz = vor === undefined ? 0 : z - vor;
  const einkommen = kapitalEinkommen(world);
  const stimmen = stimmenSicht(world);
  const mehrheit = stimmen.lager + stimmen.duldungSitze;
  const infl = world.published.inflation.value;
  const dInfl = infl - spiel.start.inflation;
  const arbeitslos = world.published.unemployment.value;
  const dArbeit = arbeitslos - spiel.start.arbeitslosigkeit;
  const akut = akuteProbleme(world).length;
  const dAkut = akut - spiel.start.akut;
  const trend = (d: number, schwelle = 0.5): Kennzahl["trend"] => (d > schwelle ? "auf" : d < -schwelle ? "ab" : "gleich");
  return [
    {
      id: "zustimmung",
      label: t("sk.kz.zustimmung"),
      wert: t("sk.wert.prozent0", { x: Math.round(z) }),
      zusatz: vor === undefined ? t("sk.kz.zustimmung.start") : t("sk.kz.zustimmung.vor", { x: Math.round(vor) }),
      trend: trend(dz, 0.7),
      ton: z >= 50 ? "gut" : z < 35 ? "schlecht" : "neutral",
      ziel: { art: "akte", akte: "waehler" },
    },
    {
      id: "kapital",
      label: t("sk.kz.kapital"),
      wert: `${Math.floor(spiel.kapital)}`,
      zusatz: `${t("sk.kz.kapital.monat", { vz: einkommen.summe >= 0 ? "+" : "−", x: Math.abs(einkommen.summe) })}${
        einkommen.unterhalt > 0 || einkommen.altlast >= 0.05
          ? t("sk.kz.kapital.davon", { liste: [einkommen.unterhalt > 0 ? t("sk.kz.kapital.unterhalt", { x: einkommen.unterhalt }) : "", einkommen.altlast >= 0.05 ? t("takt.briefing.altlast", { x: nf(einkommen.altlast) }) : ""].filter(Boolean).join(", ") })
          : ""
      }${spiel.kapital > 100 ? ` · ${t("takt.briefing.verfall", { x: nf((spiel.kapital - 100) * 0.3, 0) })}` : ""}`,
      trend: "gleich",
      ton: spiel.kapital < 0 ? "schlecht" : spiel.kapital < 8 ? "schlecht" : "neutral",
      ziel: { art: "akte", akte: "bereiche" },
    },
    {
      id: "mehrheit",
      label: t("sk.kz.mehrheit"),
      wert: t("sk.kz.mehrheit.wert", { n: mehrheit }),
      zusatz: stimmen.luecke > 0 ? t("sk.kz.mehrheit.fehlt", { fehlt: stimmen.luecke, noetig: REGELN.mehrheit }) : t("sk.kz.mehrheit.noetig", { noetig: REGELN.mehrheit }),
      trend: "gleich",
      ton: stimmen.luecke > 0 ? "schlecht" : "gut",
      ziel: { art: "akte", akte: "parlament" },
    },
    {
      id: "preise",
      label: t("sk.kz.preise"),
      wert: t("sk.wert.prozent1", { x: infl }),
      zusatz: t("sk.kz.preise.zusatz", { start: spiel.start.inflation, kurs: world.economy.usdTry }),
      trend: trend(dInfl, 0.5),
      ton: dInfl > 1 ? "schlecht" : dInfl < -1 ? "gut" : "neutral",
      ziel: { art: "akte", akte: "wirtschaft" },
    },
    {
      id: "arbeit",
      label: t("sk.kz.arbeit"),
      wert: t("sk.wert.prozent1", { x: arbeitslos }),
      zusatz: t("sk.kz.arbeit.zusatz", { x: world.published.growth.value }),
      trend: trend(dArbeit, 0.3),
      ton: dArbeit > 0.5 ? "schlecht" : dArbeit < -0.5 ? "gut" : "neutral",
      ziel: { art: "akte", akte: "wirtschaft" },
    },
    {
      id: "probleme",
      label: t("sk.kz.probleme"),
      wert: `${akut}`,
      zusatz: t("sk.kz.probleme.zusatz", { n: spiel.start.akut }),
      trend: trend(dAkut, 0.5),
      ton: dAkut > 1 ? "schlecht" : dAkut < -1 ? "gut" : "neutral",
      ziel: { art: "politik" },
    },
  ];
}

/** Das Konto des Präsidenten: Aufmerksamkeit und Belastung mit Stufe, Pause und den Treibern der Belastung. */
export function verfassungSicht(world: World): VerfassungSicht | null {
  const spiel = world.spiel;
  if (!spiel) return null;
  const v = verfassungVon(world);
  const pauseBis = v.pauseBis !== undefined && v.pauseBis > world.day ? formatDateDe(addDays(world.date, v.pauseBis - world.day)) : undefined;
  const treiber = belastungsTreiber(world).map((x) => t("sk.vf.treiber", { text: x.text, p: x.punkte }));
  const fluss =
    v.aufmerksamkeit < VERFASSUNG.erschoepfungAb
      ? t("sk.vf.erschoepft", { n: VERFASSUNG.erschoepfungProTag })
      : v.aufmerksamkeit > VERFASSUNG.erholungAb
        ? t("sk.vf.erholung", { n: VERFASSUNG.erholungProTag })
        : t("sk.vf.gleich");
  return {
    aufmerksamkeit: Math.round(v.aufmerksamkeit),
    belastung: Math.round(v.belastung),
    stufe: v.stufe,
    stufeName: t(`sk.vf.stufe.${v.stufe}`),
    ...(pauseBis ? { pauseBis } : {}),
    treiber,
    fluss,
  };
}

export function faellig(world: World): Faellig[] {
  const spiel = world.spiel;
  if (!spiel) return [];
  const out: Faellig[] = [];
  for (const e of spiel.ereignisse) {
    const tage = Math.max(0, e.frist - world.day);
    out.push({
      id: `e-${e.id}`,
      art: "ereignis",
      titel: vorlage(e.vorlage).titel(world, e),
      tage,
      dringend: tage <= 7,
      unter: t("sk.f.ereignis.unter", { wann: tageWort(tage) }),
      knopf: { art: "gehe", label: t("sk.f.ereignis.knopf"), ziel: { art: "ereignis", id: e.id } },
    });
  }
  for (const g of spiel.gesetze) {
    const tage = Math.max(0, g.abstimmung - world.day);
    const s = stimmenSicht(world, { massnahme: g.massnahme, richtung: g.richtung ?? 1 });
    out.push({
      id: `g-${g.id}`,
      art: "gesetz",
      titel: t("sk.f.gesetz.titel", { name: g.name }),
      tage,
      dringend: tage <= 14 && s.luecke > 0,
      unter: `${t("sk.f.gesetz.unter", { wann: tageWort(tage), ja: s.erwartet, noetig: REGELN.mehrheit })}${s.luecke > 0 ? t("sk.f.gesetz.fehlt", { n: s.luecke }) : ""}`,
      knopf: { art: "gehe", label: s.luecke > 0 ? t("sk.f.gesetz.suchen") : t("sk.f.ansehen"), ziel: { art: "akte", akte: "parlament" } },
    });
  }
  for (const z of spiel.zusagen.filter((x) => !x.erfuellt && !x.gebrochen)) {
    const tage = Math.max(0, z.faellig - world.day);
    const richtung = (z.richtung ?? 1) >= 0 ? 1 : -1;
    out.push({
      id: `z-${z.id}`,
      art: "zusage",
      titel: t("sk.f.zusage.titel", { von: zusageVon(z.von), text: zusageText(z) }),
      tage,
      dringend: tage <= 20,
      unter: `${t("sk.f.zusage.unter", { wann: tageWort(tage) })}${z.massnahme ? t("sk.f.zusage.vorhaben") : ""}`,
      knopf: z.massnahme
        ? { art: "gehe", label: t("sk.f.vorhabenAnsehen"), ziel: { art: "politik", massnahme: { id: z.massnahme, level: Math.max(0, Math.min(100, Math.round(stufeIn(world, z.massnahme, null)) + 20 * richtung)) } } }
        : { art: "gehe", label: t("sk.f.ansehen"), ziel: { art: "akte", akte: "personen" } },
    });
  }
  for (const [partei, f] of Object.entries(spiel.fraktionen ?? {})) {
    if (f.duldungBis === undefined || f.duldungBis <= world.day || spiel.lager.includes(partei)) continue;
    const tage = f.duldungBis - world.day;
    if (tage > 60) continue;
    out.push({
      id: `d-${partei}`,
      art: "duldung",
      titel: t("sk.f.duldung.titel", { partei }),
      tage,
      dringend: tage <= 20,
      unter: t("sk.f.duldung.unter", { wann: tageWort(tage) }),
      knopf: { art: "gehe", label: t("sk.f.duldung.knopf"), ziel: { art: "akte", akte: "parlament" } },
    });
  }
  const schritt = naechsterSchritt(world);
  const sp = schritt ? schrittMitProgramm(schritt.schritt.id) : undefined;
  if (schritt && sp && schritt.status === "bereit") {
    out.push({
      id: `s-${schritt.schritt.id}`,
      art: "schritt",
      titel: t("sk.f.schritt.titel", { titel: schritt.schritt.titel }),
      dringend: false,
      unter: t("sk.f.schritt.unter", { programm: sp.programm.titel, k: schritt.schritt.kapital }),
      knopf: { art: "gehe", label: t("sk.zumProgramm"), ziel: { art: "akte", akte: "programme" } },
    });
  }
  return out.sort((a, b) => (a.tage ?? 9999) - (b.tage ?? 9999));
}

export function warnungen(world: World): Warnung[] {
  const spiel = world.spiel;
  if (!spiel) return [];
  const out: Warnung[] = [];
  const z = spiel.umfrage.zustimmung;
  const stimmen = stimmenSicht(world);
  // Das Konto des Präsidenten: Zwangspause und Belastungsstufen als Warnung
  const vf = verfassungVon(world);
  if (vf.pauseBis !== undefined && vf.pauseBis > world.day) {
    out.push({ id: "zwangspause", stufe: "rot", text: t("sk.w.zwangspause.text", { datum: formatDateDe(addDays(world.date, vf.pauseBis - world.day)) }), warum: t("sk.w.zwangspause.warum"), ziel: { art: "akte", akte: "chronik" } });
  } else if (vf.stufe === 2) {
    out.push({ id: "ueberlastet", stufe: "rot", text: t("sk.w.ueberlastet.text", { b: Math.round(vf.belastung) }), warum: t("sk.w.ueberlastet.warum", { ab: VERFASSUNG.zusammenbruchAb, erholung: VERFASSUNG.erholungAb }), ziel: { art: "akte", akte: "chronik" } });
  } else if (vf.stufe === 1) {
    out.push({ id: "angespannt", stufe: "gelb", text: t("sk.w.angespannt.text", { b: Math.round(vf.belastung) }), warum: t("sk.w.angespannt.warum"), ziel: { art: "akte", akte: "chronik" } });
  }
  if (spiel.tiefstand > 0) {
    out.push({ id: "sturz", stufe: "rot", text: t("sk.w.sturz.text", { n: spiel.tiefstand, s: SPIEL.sturzSchwelle }), warum: t("sk.w.sturz.warum", { m: SPIEL.sturzMonate }), ziel: { art: "akte", akte: "waehler" } });
  } else if (z < 35) {
    out.push({ id: "zustimmung", stufe: z < 30 ? "rot" : "gelb", text: t("sk.w.zustimmung.text", { z: Math.round(z) }), warum: t("sk.w.zustimmung.warum", { s: SPIEL.sturzSchwelle }), ziel: { art: "akte", akte: "waehler" } });
  }
  if (spiel.kapital < 0) {
    out.push({ id: "pump", stufe: "rot", text: t("sk.w.pump.text", { k: Math.floor(spiel.kapital) }), warum: t("sk.w.pump.warum"), ziel: { art: "akte", akte: "bereiche" } });
  } else if (spiel.kapital < 8) {
    out.push({ id: "kapital", stufe: "gelb", text: t("sk.w.kapital.text", { k: Math.floor(spiel.kapital) }), warum: t("sk.w.kapital.warum"), ziel: { art: "akte", akte: "bereiche" } });
  }
  if (stimmen.luecke > 0) {
    out.push({ id: "mehrheit", stufe: "gelb", text: t("sk.w.mehrheit.text", { n: stimmen.luecke }), warum: t("sk.w.mehrheit.warum"), ziel: { art: "akte", akte: "parlament" } });
  }
  const dInfl = world.published.inflation.value - spiel.start.inflation;
  if (dInfl > 3) {
    out.push({ id: "inflation", stufe: dInfl > 8 ? "rot" : "gelb", text: t("sk.w.inflation.text", { d: dInfl }), warum: t("sk.w.inflation.warum", { jetzt: world.published.inflation.value, start: spiel.start.inflation }), ziel: { art: "akte", akte: "entscheidungen" } });
  }
  const dSchuld = world.economy.debtRatio - spiel.start.schulden;
  if (dSchuld > 6) {
    out.push({ id: "schulden", stufe: "gelb", text: t("sk.w.schulden.text", { d: dSchuld }), warum: t("sk.w.schulden.warum"), ziel: { art: "akte", akte: "entscheidungen" } });
  }
  const akut = akuteProbleme(world).length;
  if (akut > spiel.start.akut + 2) {
    out.push({ id: "probleme", stufe: "gelb", text: t("sk.w.probleme.text", { n: akut, m: akut - spiel.start.akut }), warum: t("sk.w.probleme.warum"), ziel: { art: "politik" } });
  }
  const verstimmt = waehlerLage(world).filter((g) => g.laune < 40).sort((a, b) => a.laune - b.laune)[0];
  if (verstimmt) {
    out.push({ id: `gruppe-${verstimmt.id}`, stufe: verstimmt.laune < 32 ? "rot" : "gelb", text: t("sk.w.gruppe.text", { name: verstimmt.name, s: Math.round(verstimmt.laune) }), warum: t("sk.w.gruppe.warum", { gruende: verstimmt.gruende.slice(0, 2).map((g) => g.name).join(", ") || t("sk.w.gruppe.lage") }), ziel: { art: "akte", akte: "waehler" } });
  }
  const wackelig = spiel.figuren.find((f) => f.amt === "partner" && spiel.lager.includes(f.partei ?? "") && f.loyalitaet < 32);
  if (wackelig) {
    out.push({ id: "partner", stufe: "rot", text: t("sk.w.partner.text", { rolle: wackelig.rolle, name: wackelig.name }), warum: t("sk.w.partner.warum", { l: Math.round(wackelig.loyalitaet) }), ziel: { art: "akte", akte: "personen" } });
  }
  for (const e of spiel.ereignisse) {
    const tage = e.frist - world.day;
    if (tage <= 4) out.push({ id: `frist-${e.id}`, stufe: "rot", text: t("sk.w.frist.text", { wann: tageWort(tage), titel: vorlage(e.vorlage).titel(world, e) }), warum: t("sk.w.frist.warum"), ziel: { art: "ereignis", id: e.id } });
  }
  if (spiel.reich) {
    const z2 = reichZustand(world);
    const schwach = Object.entries(z2.staetten).filter(([, s]) => s.zustand < 30).sort((a, b) => a[1].zustand - b[1].zustand)[0];
    if (schwach) {
      const name = ERBE_NACH_ID[schwach[0]]?.name ?? schwach[0];
      out.push({ id: `staette-${schwach[0]}`, stufe: "gelb", text: t("sk.w.staette.text", { name, z: Math.round(schwach[1].zustand) }), warum: t("sk.w.staette.warum"), ziel: { art: "akte", akte: "reich_kultur" } });
    }
    if (z2.verwaltung <= 0 && z2.laufend.length > 0) {
      out.push({ id: "verwaltung", stufe: "gelb", text: t("sk.w.verwaltung.text"), warum: t("sk.w.verwaltung.warum"), ziel: { art: "akte", akte: "reich_haushalt" } });
    }
  }
  const monateWahl = monateBis(spiel.wahltag - world.day);
  if (monateWahl <= 12 && z < 46) {
    out.push({ id: "wahl", stufe: "gelb", text: t("sk.w.wahl.text", { n: monateWahl, z: Math.round(z) }), warum: t("sk.w.wahl.warum"), ziel: { art: "akte", akte: "waehler" } });
  }
  return out.sort((a, b) => Number(b.stufe === "rot") - Number(a.stufe === "rot"));
}

export function termine(world: World): Termin[] {
  const spiel = world.spiel;
  if (!spiel) return [];
  const out: Termin[] = [];
  const wahl = spiel.wahltag - world.day;
  if (wahl >= 0) out.push({ id: "wahl", tage: wahl, datum: formatDateDe(addDays(world.date, wahl)), text: t("sk.t.wahl", { n: spiel.amtszeit }), ziel: { art: "akte", akte: "waehler" } });
  for (const g of spiel.gesetze) {
    const tg = Math.max(0, g.abstimmung - world.day);
    out.push({ id: `g-${g.id}`, tage: tg, datum: formatDateDe(addDays(world.date, tg)), text: t("sk.f.gesetz.titel", { name: g.name }), ziel: { art: "akte", akte: "parlament" } });
  }
  for (const z of spiel.zusagen.filter((x) => !x.erfuellt && !x.gebrochen)) {
    const tg = Math.max(0, z.faellig - world.day);
    out.push({ id: `z-${z.id}`, tage: tg, datum: formatDateDe(addDays(world.date, tg)), text: t("sk.t.zusage", { von: zusageVon(z.von) }), ziel: { art: "akte", akte: "personen" } });
  }
  for (const k of KALENDER) {
    const r = tageBisMonat(world, k.monat, k.abJahr, k.nurJahr);
    if (!r) continue;
    // Kommunalwahlen und ähnliche Einmaltermine nur, solange sie nicht stattgefunden haben
    if (k.nurJahr !== undefined && (spiel.zuletzt[k.vorlage] ?? -1) >= 0) continue;
    out.push({ id: k.id, tage: r.tage, datum: t("sk.wert.monat", { d: `${r.jahr}-${String(k.monat).padStart(2, "0")}-01` }), text: k.text(r.jahr), ...(k.ziel ? { ziel: k.ziel } : {}), ...(k.weich ? { weich: true as const } : {}) });
  }
  // Zinssitzungen der Zentralbank (heute stand der Termin nur in der Wirtschaftsakte)
  const zins = naechsteSitzung(world);
  if (zins) out.push({ id: "zins", tage: zins.tage, datum: formatDateDe(zins.datum), text: t("takt.kalender.zinssitzung"), ziel: { art: "akte", akte: "wirtschaft" }, weich: true });
  // Wahlen in anderen Ländern (Weltmodell): die zwei nächsten innerhalb eines Jahres, nur Hauptakteure
  const haupt = new Set(LAENDER.map((l) => l.id));
  const fremd = Object.entries(weltModell(world).laender)
    .filter(([id, e]) => haupt.has(id) && e.wahl && e.wahl.tag - world.day >= 0 && e.wahl.tag - world.day <= 365)
    .sort((a, b) => a[1].wahl!.tag - b[1].wahl!.tag)
    .slice(0, 2);
  for (const [id, e] of fremd) {
    const tage = e.wahl!.tag - world.day;
    out.push({ id: `wahl-${id}`, tage, datum: formatDateDe(addDays(world.date, tage)), text: t("takt.kalender.auslandswahl", { land: akteurName(id) }), ziel: { art: "land", id }, weich: true });
  }
  // Außenkalender (sim/diplomatie.ts): Gipfel und Generalversammlung als Kalenderhinweise
  for (const a of aussenTermine(world)) out.push({ id: a.id, tage: a.tage, datum: formatDateDe(a.datum), text: a.text, ziel: { art: "akte", akte: "welt" }, weich: true });
  // Termine mit Entscheidung (Wahl, Abstimmungen, Zusagen, Haushalt) werden nie von Kalenderhinweisen verdrängt
  const alle = out.filter((x) => x.tage >= 0).sort((a, b) => a.tage - b.tage);
  const hart = alle.filter((x) => !x.weich).slice(0, 8);
  const weich = alle.filter((x) => x.weich).slice(0, Math.max(3, 10 - hart.length));
  return [...hart, ...weich].sort((a, b) => a.tage - b.tage);
}

/** Der Beraterstab: konkrete Vorschläge, jeder aus dem Weltzustand gerechnet. */
export function empfehlungen(world: World, vorschlaege?: Vorschlag[]): Empfehlung[] {
  const spiel = world.spiel;
  if (!spiel) return [];
  const out: Empfehlung[] = [];
  const stab = figur(world, "stab");
  const finanzen = figur(world, "finanzen");
  const aussen = figur(world, "aussen");

  // 1. Fachstab: die wirksamsten Vorhaben gegen die akuten Probleme
  for (const v of (vorschlaege ?? berechneVorschlaege(world, 3)).slice(0, 2)) {
    out.push({
      id: `v-${v.massnahme}`,
      rat: t("sk.e.rat.fachstab"),
      ...(stab ? { wer: anrede(stab) } : {}),
      titel: v.zielName ? t("sk.e.v.titelName", { name: v.name, jetzt: v.jetztName ?? "", ziel: v.zielName }) : t("sk.e.v.titelStufe", { name: v.name, jetzt: v.stufeJetzt, ziel: v.ziel }),
      text: v.grund,
      kosten: t("sk.e.v.kosten", { pk: v.pk, bip: v.kostenBip, m: v.monate, urteil: t(v.urteil === "sicher" ? "sk.e.urteil.sicher" : v.urteil === "knapp" ? "sk.e.urteil.knapp" : "sk.e.urteil.verloren") }),
      knoepfe: [
        { art: "gehe", label: t("sk.e.v.einstellen"), ziel: { art: "politik", massnahme: { id: v.massnahme, level: v.ziel, ort: v.ort } } },
        ...(v.bezahlbar && v.urteil !== "verloren" ? [{ art: "einbringen" as const, label: t("sk.e.v.einbringen", { pk: v.pk }), vorschlag: v }] : []),
      ],
      gewicht: 60 - out.length * 5 + Math.min(20, v.punkte / 200),
    });
  }

  // 2. Fraktionen: fehlt die Mehrheit, empfiehlt sich das günstigste Gespräch mit der offensten Fraktion
  const stimmen = stimmenSicht(world);
  if (stimmen.luecke > 0) {
    const kandidaten = fraktionsUebersicht(world)
      .filter((f) => f.status === "opposition")
      .map((f) => ({ f, a: f.aktionen.find((x) => x.id === "gespraech") }))
      .filter((x): x is { f: (typeof x)["f"]; a: NonNullable<(typeof x)["a"]> } => !!x.a && x.a.moeglich)
      .sort((a, b) => b.f.bereitschaft * Math.sqrt(b.f.sitze) - a.f.bereitschaft * Math.sqrt(a.f.sitze));
    const k = kandidaten[0];
    if (k) {
      out.push({
        id: `f-${k.f.partei}`,
        rat: t("sk.e.rat.fraktionsbuero"),
        titel: t("sk.e.f.titel", { name: k.f.name }),
        text: t("sk.e.f.text", { n: stimmen.luecke, name: k.f.name, sitze: k.f.sitze, wort: k.f.wort, forderung: k.f.forderung }),
        kosten: t("sk.e.kapital", { pk: k.a.pk }),
        knoepfe: [
          { art: "gespraech", label: t("sk.e.f.gespraech", { pk: k.a.pk }), partei: k.f.partei, pk: k.a.pk },
          { art: "gehe", label: t("sk.e.f.alle"), ziel: { art: "akte", akte: "parlament" } },
        ],
        gewicht: 70,
      });
    }
  }

  // 3. Wähler: die verärgerte Gruppe und das Vorhaben, das sie sich wünscht
  const grp = waehlerLage(world).filter((g) => g.laune < 45).sort((a, b) => a.laune - b.laune)[0];
  if (grp) {
    const f = grp.forderungen[0];
    if (f) {
      out.push({
        id: `w-${grp.id}`,
        rat: t("sk.e.rat.wahlkampf"),
        ...(stab ? { wer: anrede(stab) } : {}),
        titel: t("sk.e.w.titel", { gruppe: grp.name, vorhaben: f.name }),
        text: t("sk.e.w.text", { gruppe: grp.name, wort: grp.wort, s: Math.round(grp.laune), vorhaben: f.name, richtung: f.richtung > 0 ? "auf" : "ab" }),
        knoepfe: [{ art: "gehe", label: t("sk.f.vorhabenAnsehen"), ziel: { art: "politik", massnahme: { id: f.massnahme, level: Math.max(0, Math.min(100, Math.round(stufeIn(world, f.massnahme, null)) + 20 * f.richtung)) } } }],
        gewicht: 50 + (45 - grp.laune),
      });
    }
  }

  // 4. Außenamt: das Land mit dem größten Gesprächsbedarf, dessen Gipfel möglich und bezahlbar ist
  const land = LAENDER.map((l) => {
    const aktionen = aktionenFuer(world, l.id);
    const gipfel = aktionen.find((a) => a.aktion.id === "gipfel" && a.moeglich);
    const entspannen = aktionen.find((a) => a.aktion.id === "entspannen" && a.moeglich);
    const bedarf = (60 - dimensionZu(world, l.id, "vertrauen")) * l.anteil + Math.max(0, dimensionZu(world, l.id, "konflikt") - 55) * l.anteil * 0.6;
    return { l, gipfel, entspannen, bedarf };
  })
    .filter((x) => (x.gipfel || x.entspannen) && x.bedarf > 8)
    .sort((a, b) => b.bedarf - a.bedarf)[0];
  if (land) {
    const a = land.gipfel ?? land.entspannen!;
    out.push({
      id: `l-${land.l.id}`,
      rat: t("sk.e.rat.aussenamt"),
      ...(aussen ? { wer: anrede(aussen) } : {}),
      titel: t("sk.e.l.titel", { land: land.l.name, aktion: a.aktion.label }),
      text: t("sk.e.l.text", { dat: land.l.dat, land: land.l.name, haltung: haltungWort(world, land.l.id), v: Math.round(dimensionZu(world, land.l.id, "vertrauen")), k: Math.round(dimensionZu(world, land.l.id, "konflikt")), hinweis: a.aktion.hinweis }),
      kosten: t("sk.e.kapital", { pk: a.aktion.pk }),
      knoepfe: [{ art: "gehe", label: t("sk.e.l.knopf"), ziel: { art: "land", id: land.l.id } }],
      gewicht: 40 + Math.min(20, land.bedarf / 3),
    });
  }

  // 5. Finanzen: Inflation über dem Amtsantritt
  const dInfl = world.published.inflation.value - spiel.start.inflation;
  if (dInfl > 2) {
    out.push({
      id: "finanzen-inflation",
      rat: t("sk.e.rat.finanzen"),
      ...(finanzen ? { wer: anrede(finanzen) } : {}),
      titel: t("sk.e.inf.titel"),
      text: t("sk.e.inf.text", { jetzt: world.published.inflation.value, start: spiel.start.inflation }),
      knoepfe: [{ art: "gehe", label: t("sk.e.inf.knopf"), ziel: { art: "akte", akte: "entscheidungen" } }],
      gewicht: 45 + Math.min(20, dInfl * 2),
    });
  }

  // 6. Kulturbehörde: eine verfallende Stätte
  if (spiel.reich) {
    const z2 = reichZustand(world);
    const schwach = Object.entries(z2.staetten).filter(([, s]) => s.zustand < 45).sort((a, b) => a[1].zustand - b[1].zustand)[0];
    if (schwach) {
      const e = ERBE_NACH_ID[schwach[0]];
      if (e) {
        out.push({
          id: `k-${schwach[0]}`,
          rat: t("sk.e.rat.kultur"),
          titel: t("sk.e.k.titel", { name: e.name }),
          text: t("sk.e.k.text", { z: Math.round(schwach[1].zustand) }),
          knoepfe: [{ art: "gehe", label: t("sk.e.k.knopf"), ziel: { art: "akte", akte: "reich_kultur" } }],
          gewicht: 35 + (45 - schwach[1].zustand) / 2,
        });
      }
    }
  }

  // 7. Programmstab: Was dem nächsten Programmschritt noch fehlt, wenn es eine Maßnahme ist, die man einstellen kann
  const schritt = naechsterSchritt(world);
  const sp = schritt ? schrittMitProgramm(schritt.schritt.id) : undefined;
  if (schritt && sp && schritt.status === "offen") {
    const fehlt = schritt.bedingungen.find((b) => !b.erfuellt);
    const b = fehlt?.bedingung;
    if (fehlt && b && (b.art === "massnahme" || b.art === "massnahme-max")) {
      out.push({
        id: `p-${schritt.schritt.id}`,
        rat: t("sk.e.rat.programm"),
        titel: t("sk.e.p.titel", { titel: schritt.schritt.titel }),
        text: t("sk.e.p.text", { programm: sp.programm.titel, fehlt: fehlt.text, k: schritt.schritt.kapital }),
        knoepfe: [
          { art: "gehe", label: t("sk.e.p.einstellen"), ziel: { art: "politik", massnahme: { id: b.id, level: b.art === "massnahme" ? Math.min(100, b.min + 5) : Math.max(0, b.max - 5) } } },
          { art: "gehe", label: t("sk.zumProgramm"), ziel: { art: "akte", akte: "programme" } },
        ],
        gewicht: 48,
      });
    }
  }

  // 8. Mit Kapital im Überfluss: nicht horten
  if (spiel.kapital >= 45 && out.every((o) => !o.id.startsWith("v-"))) {
    const h = handlungsHebel((id) => nationalAverage(NET, world.net, id), "vertrauen_regierung", 1, 1)[0];
    if (h) {
      out.push({
        id: "kapital-nutzen",
        rat: t("sk.e.rat.finanzen"),
        ...(finanzen ? { wer: anrede(finanzen) } : {}),
        titel: t("sk.e.n.titel", { name: h.name }),
        text: t("sk.e.n.text", { k: Math.floor(spiel.kapital), name: h.name }),
        knoepfe: [{ art: "gehe", label: t("sk.f.ansehen"), ziel: { art: "politik", massnahme: { id: h.massnahme, level: Math.max(0, Math.min(100, Math.round(h.jetzt) + 20 * h.richtung)) } } }],
        gewicht: 30,
      });
    }
  }
  return out.sort((a, b) => b.gewicht - a.gewicht).slice(0, 5);
}

export function briefing(world: World, vorschlaege?: Vorschlag[]): Briefing {
  const spiel = world.spiel;
  const wahltage = spiel ? spiel.wahltag - world.day : 0;
  return {
    datum: formatDateDe(world.date),
    amtszeit: { nummer: spiel?.amtszeit ?? 1, wahltag: spiel ? formatDateDe(addDays(world.date, wahltage)) : "", monateBisWahl: monateBis(wahltage) },
    kennzahlen: kennzahlen(world),
    verfassung: verfassungSicht(world),
    faellig: faellig(world),
    warnungen: warnungen(world),
    empfehlungen: empfehlungen(world, vorschlaege),
    termine: termine(world),
  };
}
