// Das Weltmodell: Die Staaten spielen und entwickeln sich auch ohne die Türkei.
//
// 41 Akteure (18 Hauptakteure aus sim/laender.ts und 23 weitere Staaten aus data/welt-weitere.ts) haben je einen Eigenzustand:
// Wachstum, Inflation, Schulden und Defizit, Rüstung, innere Stabilität, Rückhalt der Führung, Bedrohung, Kriegsbelastung, Regierungsform,
// Wahltermin. Zwischen je zwei Staaten steht ein Bündnis-, ein Handels- und ein Spannungswert, die sich selbst verändern. Monatlich
// schreibt das Modell alles fort: Wirtschaft (Rückkehr zum Trend, Streuung nach Gruppe, Mitnahme durch die großen Volkswirtschaften,
// Energiepreis), Politik (Wahlen, Machtwechsel, Krisen), Beziehungen (Bündnisse, Sanktionen, Rüstungswettlauf, Entspannung) und das
// Verhalten der Staaten nach ihren Zielen. Was davon die Türkei trifft, wirkt als kleine Verschiebung im Politiknetz (Export, Tourismus,
// Sicherheit) und bei großen Ereignissen als Entscheidung für den Spieler (sim/welt-ereignisse.ts).
//
// Regeln: Der Zustand liegt in EINEM Objekt (spiel.weltmodell). Die Zufallsquelle ist eigen (Seed und Monat), der Spielstrom wird nicht
// angezapft. Startwerte stammen aus den Weltbank-Daten und den Dossiers oder sind als Spielparameter gekennzeichnet (data/welt-daten.ts).
// Die Wahrheit der Drittkonflikte (Ukraine–Russland, Israel–Iran, Armenien–Aserbaidschan) bleibt die Vermittlung (spiel.vermittlung);
// das Weltmodell liest deren Konflikt-Index als Spannung des Paares.

import {
  HEISSE_PAARE,
  PAARE,
  VERMITTLUNG_PAARE,
  WELT,
  WELT_NACH_ID,
  WELT_REGELN,
  lagerBuendnis,
  startwert,
  weltbankMedian,
  weltbankRoh,
  type Code,
  type Regierungsform,
  type WeltDef,
} from "../data/welt-daten";
import { WEITERE, WEITERE_NACH_ID, type WeitereDef } from "../data/welt-weitere";
import { INSTITUTIONEN, INSTITUTION_NACH_ID, type TuerkeiStatus } from "../data/welt-institutionen";
import { AKTIONEN, land, landAendern, setzeWeltHaken, vertrauenZu, weltZustand, type AktionId } from "./laender";
import { NET } from "./modell";
import { addLog } from "./log";
import { addDays } from "./dates";
import { wirke } from "./wirkung";
import { Rng } from "./rng";
import type { World } from "./types";

// ---------------------------------------------------------------------------
// Typen

export type NotizArt = "aufdeckung" | "wahl" | "machtwechsel" | "krise" | "krise_ende" | "pakt" | "bruch" | "sanktion" | "entspannung" | "ruestung" | "hilfe" | "wirtschaft" | "gipfel" | "repression" | "institution" | "krieg" | "waffenstillstand" | "beitritt" | "beistand";
export type KriseArt = "waehrung" | "zahlungsausfall" | "unruhen" | "grenzkrise";

export interface WeltNotiz {
  tag: number;
  datum: string;
  art: NotizArt;
  /** Kennung des Akteurs, um den es geht */
  id: string;
  gegen?: string;
  titel: string;
  fakt: string;
  /** Bewertung für die Türkei: −1 (schlecht) bis +1 (gut); klein, weil es Nachrichten aus dem Ausland sind */
  wertung: number;
  /** Wichtigkeit für die Auswahl (0–1) */
  gewicht: number;
}

/** Der Gegenspieler der Amtsführung bei einer Wahl: seine Haltung zur Türkei und seine Stärke (50 = gleichauf). */
export interface Herausforderer {
  kurs: -1 | 0 | 1;
  staerke: number;
}

export interface Krise {
  art: KriseArt;
  seit: number;
  bis: number;
  gegen?: string;
}

export interface LandEigen {
  /** Wachstum der Wirtschaft in Prozent zum Vorjahr (laufender Wert, geglättet) */
  wachstum: number;
  inflation: number;
  /** Staatsschulden in Prozent des BIP */
  schulden: number;
  /** Haushaltssaldo in Prozent des BIP (negativ = Defizit) */
  defizit: number;
  /** Militärausgaben in Prozent des BIP */
  ruestung: number;
  stabilitaet: number;
  /** Rückhalt der Führung im Volk (bzw. in der Machtbasis) */
  rueckhalt: number;
  /** Empfundene Bedrohung durch Nachbarn und Rivalen */
  bedrohung: number;
  /** Belastung durch Krieg und Gewalt im eigenen Land oder gegen einen Gegner */
  krieg: number;
  /** Wirtschaftliche Last durch Sanktionen (0–3) */
  sanktion: number;
  form: Regierungsform;
  amtsMonate: number;
  /** Haltung der Führung zur Türkei seit dem letzten Machtwechsel: −1 härter, 0 unverändert, +1 näher */
  kurs: -1 | 0 | 1;
  wahl: { tag: number; datum: string; art: string; herausforderer?: Herausforderer } | null;
  /** Einfluss von außen auf die nächste Wahl: positiv zugunsten des Herausforderers, negativ zugunsten der Amtsführung (−3 bis 3) */
  einfluss?: number;
  krise?: Krise;
  /** Letzte Monate als [Wachstum, Inflation, Stabilität], neueste zuletzt */
  verlauf: [number, number, number][];
  /** Tag der letzten eigenen Handlung */
  handlung: number;
  /** Nur weitere Staaten: Beziehung zur Türkei (Hauptakteure führen sie in sim/laender.ts) und ihr Startwert */
  tr?: { handel: number; sicherheit: number; vertrauen: number; konflikt: number };
  trStart?: { vertrauen: number };
  /** Nur weitere Staaten: Abkühlzeiten der Gesten (Tag der letzten) */
  zuletzt?: Partial<Record<AktionId, number>>;
}

/** Eine verdeckte Operation des Dienstes oder eines fremden Dienstes gegen die Türkei (sim/welt-dienst.ts). */
export type OpArt = "kandidat" | "desinfo" | "netz" | "cyber" | "gegen" | "gruppen" | "cyberangriff";
export interface Operation {
  id: number;
  art: OpArt;
  ziel: string;
  /** Bei der Unterstützung im Wahlkampf: wessen Lager */
  lager?: "herausforderer" | "amtsfuehrung";
  start: number;
  ende: number;
  pk: number;
  kap: number;
}
export interface EingehendeOp {
  id: number;
  von: string;
  art: "einfluss" | "medien" | "abhoeren";
  start: number;
  ende: number;
  aufgedeckt: boolean;
}
export interface BerichtEintrag {
  tag: number;
  datum: string;
  titel: string;
  text: string;
  /** Ausgang für die Anzeige */
  ausgang: "erfolg" | "fehlschlag" | "aufgedeckt" | "info";
}
export interface DienstZustand {
  /** Frei verfügbare Kapazität des Dienstes (0–100); jede Operation bindet einen Teil, monatlich wächst sie nach */
  kapazitaet: number;
  ops: Operation[];
  eingehend: EingehendeOp[];
  bericht: BerichtEintrag[];
  /** Einflussnetz je Zielstaat (0–3): erhöht die Erfolgschance späterer Operationen */
  zugang: Record<string, number>;
  /** Gegenspionage: so viele Monate wirkt sie noch */
  abwehr: number;
  /** Lagebild aus der Aufklärung: Tag und Wahrscheinlichkeit, dass die Amtsführung die nächste Wahl gewinnt */
  lagebild: Record<string, { tag: number; pAmtsfuehrung: number }>;
  zaehler: number;
  /** Operationen im Inland (sim/welt-dienst.ts); ältere Spielstände haben das Feld nicht */
  inland?: { id: number; art: string; start: number; ende: number }[];
  /** Lagebild im Inland: Tag, Putschrisiko und Terrorgefahr zum Zeitpunkt der Aufklärung */
  inlandLage?: { tag: number; putsch: number; terror: number };
  /** Personenschutz des Präsidenten verstärkt bis zu diesem Tag */
  schutzBis?: number;
}

export interface WeltModell {
  v: 1;
  /** Letzter fortgeschriebener Monat (YYYY-MM) */
  monat: string;
  laender: Record<string, LandEigen>;
  /** Je Paar (Schlüssel „A|B“ alphabetisch) [Bündnis, Handel, Spannung] */
  paare: Record<string, [number, number, number]>;
  /** Stand der Türkei in den Institutionen */
  institutionen: Record<string, { tuerkei: TuerkeiStatus; seit?: number; zuletzt?: number }>;
  /** Tag, an dem der Rat zuletzt wegen eines blockierten Kapitels ins Protokoll schrieb (je Kapitel) */
  ratHinweise?: Record<string, number>;
  nachrichten: WeltNotiz[];
  /** Tag des letzten Großereignisses, das dem Spieler vorgelegt wurde */
  ereignisTag: number;
  /** Vorgemerkte Großereignisse (Machtwechsel, Krisen, entdeckte Einflussversuche), aus denen sim/welt-ereignisse.ts höchstens eines vorlegt */
  ereignisKandidaten?: { art: "machtwechsel" | "krise" | "einfluss" | "beistand"; id: string; kurs?: -1 | 0 | 1; krise?: KriseArt; einfluss?: EingehendeOp["art"]; opId?: number; partner?: string; gegner?: string; pakt?: string; krieg?: string }[];
  /** Der Geheimdienst (sim/welt-dienst.ts); entsteht beim ersten Zugriff */
  dienst?: DienstZustand;
  /** Außenlage der Türkei (sim/diplomatie.ts): Flucht, Energie, Terror, Friedensprozess, Sanktionen, Diaspora; entsteht beim ersten Zugriff */
  aussen?: import("./diplomatie").AussenZustand;
  /** Kriege zwischen anderen Staaten (sim/pakte.ts); ältere Spielstände legen das Feld beim ersten Monatsschritt an */
  kriege?: import("./pakte-typen").DrittKrieg[];
  /** Beistandsrufe an die Türkei: Tag der letzten Vorlage je „Krieg|Partner“, damit der Ruf nicht doppelt kommt */
  rufe?: Record<string, number>;
}

// ---------------------------------------------------------------------------
// Akteure

const ALLE: WeltDef[] = [...WELT, ...WEITERE];
export const AKTEUR_IDS: string[] = ALLE.map((d) => d.id);
const DEFS = new Map(ALLE.map((d) => [d.id, d]));
const EU_MITGLIEDER = new Set(["EU", ...(INSTITUTION_NACH_ID.get("eu")?.mitglieder ?? [])]);
const NATO_MITGLIEDER = new Set(INSTITUTION_NACH_ID.get("nato")?.mitglieder ?? []);
const BRICS_MITGLIEDER = new Set(INSTITUTION_NACH_ID.get("brics")?.mitglieder ?? []);

export const istHauptakteur = (id: string): boolean => WELT_NACH_ID.has(id);
export const istWeiterer = (id: string): boolean => WEITERE_NACH_ID.has(id);

export function akteurDef(id: string): WeltDef {
  const d = DEFS.get(id);
  if (!d) throw new Error(`Unbekannter Akteur: ${id}`);
  return d;
}

export function akteurName(id: string): string {
  const w = WEITERE_NACH_ID.get(id);
  return w ? w.name : land(id).name;
}
/** „mit …“ / „zu …“ */
export function akteurDat(id: string): string {
  const w = WEITERE_NACH_ID.get(id);
  return w ? w.dat : land(id).dat;
}
/** „auf …“ / „für …“ */
export function akteurAkk(id: string): string {
  const w = WEITERE_NACH_ID.get(id);
  return w ? w.akk : land(id).akk;
}
export function weitereDef(id: string): WeitereDef | undefined {
  return WEITERE_NACH_ID.get(id);
}

// ---------------------------------------------------------------------------
// Kleine Hilfen

const clamp = (x: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, x));
const r2 = (x: number): number => Math.round(x * 100) / 100;
const r1 = (x: number): number => Math.round(x * 10) / 10;
export const nf = (x: number, d = 1): string => x.toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d });

export function hashInt(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  h ^= h >>> 13;
  h = Math.imul(h, 0x5bd1e995);
  h ^= h >>> 15;
  return h >>> 0;
}

export const paarSchluessel = (a: string, b: string): string => (a < b ? `${a}|${b}` : `${b}|${a}`);

/** Tag-Nummer eines ISO-Datums relativ zum Spieltag der Welt. */
function tagVon(w: World, iso: string): number {
  const [y, m, d] = iso.split("-").map(Number) as [number, number, number];
  const [wy, wm, wd] = w.date.split("-").map(Number) as [number, number, number];
  return w.day + Math.round((Date.UTC(y, m - 1, d) - Date.UTC(wy, wm - 1, wd)) / 86_400_000);
}

// ---------------------------------------------------------------------------
// Startwerte (rein aus den Daten; für Trends und Oberfläche)

export interface StartWerte {
  wachstum: number;
  inflation: number;
  schulden: number;
  defizit: number;
  ruestung: number;
  /** Trends, zu denen die laufenden Werte zurückkehren */
  wachstumTrend: number;
  inflationTrend: number;
  defizitTrend: number;
  ruestungTrend: number;
  /** Grundstabilität aus der Wirksamkeit der Regierung (Weltbank-WGI) */
  basis: number;
  /** Offenheit der Wirtschaft (Exporte in Prozent des BIP, geteilt durch 30) */
  offenheit: number;
  herkunft: Record<Code, string>;
}

const STARTCACHE = new Map<string, StartWerte>();

export function startWerte(id: string): StartWerte {
  const hit = STARTCACHE.get(id);
  if (hit) return hit;
  const d = akteurDef(id);
  const g = startwert(id, d.iso, "wachstum");
  const p = startwert(id, d.iso, "inflation");
  const s = startwert(id, d.iso, "schulden");
  const df = startwert(id, d.iso, "defizit");
  const rs = startwert(id, d.iso, "ruestung");
  const an = WELT_REGELN.trendAnteilLand;
  const ge = weltbankRoh("GOV_WGI_GE.EST", d.iso);
  const geRoh = ge && ge[1] >= 2023 ? ge[0] : d.klasse === "fortgeschritten" ? 1 : d.klasse === "aufstrebend" ? 0 : -1;
  // Datenbefund: Der Wert für Syrien im Datensatz (+1,5) ist unplausibel; fragile Staaten gelten höchstens mit −0,5 (Spielparameter)
  const geWert = d.klasse === "fragil" ? Math.min(geRoh, -0.5) : geRoh;
  const ex = weltbankRoh("NE.EXP.GNFS.ZS", d.iso);
  const out: StartWerte = {
    wachstum: g.wert,
    inflation: p.wert,
    schulden: s.wert,
    defizit: df.wert,
    ruestung: rs.wert,
    wachstumTrend: an * g.wert + (1 - an) * weltbankMedian("wachstum"),
    inflationTrend: an * p.wert + (1 - an) * weltbankMedian("inflation"),
    defizitTrend: an * df.wert + (1 - an) * weltbankMedian("defizit"),
    ruestungTrend: rs.wert,
    basis: clamp(50 + 22 * geWert, 15, 90),
    offenheit: clamp((ex ? ex[0] : 30) / 30, 0.3, 1.3),
    herkunft: { wachstum: g.herkunft, inflation: p.herkunft, schulden: s.herkunft, defizit: df.herkunft, ruestung: rs.herkunft },
  };
  STARTCACHE.set(id, out);
  return out;
}

/** Anfangslage eines Paares aus den bekannten Paaren und den Lagerregeln (Spielparameter, Quellen in data/welt-daten.ts). */
const PAAR_MAP = new Map(PAARE.map((p) => [paarSchluessel(p.a, p.b), p]));
const PAARCACHE = new Map<string, [number, number, number]>();

export function paarStart(a: string, b: string): [number, number, number] {
  const key = paarSchluessel(a, b);
  const hit = PAARCACHE.get(key);
  if (hit) return hit;
  const o = PAAR_MAP.get(key);
  let out: [number, number, number];
  if (o) out = [o.buendnis, o.handel, o.spannung];
  else {
    const da = akteurDef(a);
    const db = akteurDef(b);
    let bu = lagerBuendnis(da.lager, db.lager);
    let sp = 12;
    let ha = 30;
    if (EU_MITGLIEDER.has(a) && EU_MITGLIEDER.has(b)) [bu, sp, ha] = [70, 6, 60];
    else if (NATO_MITGLIEDER.has(a) && NATO_MITGLIEDER.has(b)) [bu, sp, ha] = [bu + 15, 8, 40];
    if (BRICS_MITGLIEDER.has(a) && BRICS_MITGLIEDER.has(b)) {
      bu += 15;
      ha += 10;
    }
    const gegenRussland = a === "RUS" ? b : b === "RUS" ? a : null;
    if (gegenRussland && (EU_MITGLIEDER.has(gegenRussland) || NATO_MITGLIEDER.has(gegenRussland))) {
      [bu, sp, ha] = gegenRussland === "HUN" ? [-20, 30, 40] : [-55, 55, 15];
    }
    out = [clamp(bu, -100, 100), clamp(ha, 0, 100), clamp(sp, 0, 100)];
  }
  PAARCACHE.set(key, out);
  return out;
}

// ---------------------------------------------------------------------------
// Zustand anlegen und lesen

function startEigen(w: World, d: WeltDef): LandEigen {
  const s = startWerte(d.id);
  const wahl = naechsteWahl(w, d);
  const e: LandEigen = {
    wachstum: r2(s.wachstum),
    inflation: r2(s.inflation),
    schulden: r2(s.schulden),
    defizit: r2(s.defizit),
    ruestung: r2(s.ruestung),
    stabilitaet: r1(clamp(s.basis - 0.2 * d.krieg0, 5, 95)),
    rueckhalt: 52,
    bedrohung: 30,
    krieg: d.krieg0,
    sanktion: d.id === "RUS" ? 1.5 : d.id === "IRN" ? 2.2 : d.id === "SYR" ? 0.3 : 0,
    form: d.form,
    amtsMonate: d.amtsMonate0,
    kurs: 0,
    wahl,
    verlauf: [],
    handlung: -1e9,
  };
  const wd = WEITERE_NACH_ID.get(d.id);
  if (wd) {
    e.tr = { ...wd.tr };
    e.trStart = { vertrauen: wd.tr.vertrauen };
    e.zuletzt = {};
  }
  return e;
}

/**
 * Der nächste Wahltermin: der nächste künftige aus der Liste der Dossiers/Verfassungen; ist die Liste durch, wiederholt sich der letzte Termin
 * im Zyklus der Regierungsform (Spielparameter: Demokratie und hybride Regime vier Jahre, Autokratien sechs; Übergangs- und Kriegsstaaten
 * und Monarchien haben keine Wiederholung).
 */
const ZYKLUS_JAHRE: Partial<Record<Regierungsform, number>> = { demokratie: 4, hybrid: 4, autokratie: 6 };

function naechsteWahl(w: World, d: WeltDef): LandEigen["wahl"] {
  for (const x of d.wahlen) {
    const tag = tagVon(w, x.datum);
    if (tag > w.day) return { tag, datum: x.datum, art: x.art };
  }
  const zyklus = ZYKLUS_JAHRE[d.form];
  const letzte = d.wahlen[d.wahlen.length - 1];
  if (!zyklus || !letzte || d.id === "UKR") return null;
  // Europawahl und Parteitage laufen im Fünfjahresrhythmus
  const jahre = /Europawahl|Parteitag/.test(letzte.art) ? 5 : zyklus;
  let datum = letzte.datum;
  for (let i = 0; i < 20; i++) {
    datum = `${Number(datum.slice(0, 4)) + jahre}${datum.slice(4)}`;
    const tag = tagVon(w, datum);
    if (tag > w.day) return { tag, datum, art: letzte.art };
  }
  return null;
}

/** Das Weltmodell; ältere Spielstände legen es beim ersten Zugriff an (Migration). */
export function weltModell(w: World): WeltModell {
  const spiel = w.spiel!;
  let m = spiel.weltmodell;
  if (!m) {
    m = { v: 1, monat: "", laender: {}, paare: {}, institutionen: {}, nachrichten: [], ereignisTag: -1e9 };
    spiel.weltmodell = m;
  }
  for (const d of ALLE) m.laender[d.id] ??= startEigen(w, d);
  for (const i of INSTITUTIONEN) m.institutionen[i.id] ??= { tuerkei: i.tuerkei };
  return m;
}

export function eigenVon(w: World, id: string): LandEigen {
  return weltModell(w).laender[id]!;
}

/** Wert eines Paares (mit Anfangslage, falls noch nicht verändert). */
export function paarVon(w: World, a: string, b: string): { buendnis: number; handel: number; spannung: number } {
  const m = weltModell(w);
  const v = m.paare[paarSchluessel(a, b)] ?? paarStart(a, b);
  return { buendnis: v[0], handel: v[1], spannung: v[2] };
}

export function setzePaar(m: WeltModell, a: string, b: string, d: { buendnis?: number; handel?: number; spannung?: number }): void {
  const key = paarSchluessel(a, b);
  const v = (m.paare[key] ??= [...paarStart(a, b)] as [number, number, number]);
  if (d.buendnis !== undefined) v[0] = Math.round(clamp(v[0] + d.buendnis, -100, 100));
  if (d.handel !== undefined) v[1] = Math.round(clamp(v[1] + d.handel, 0, 100));
  if (d.spannung !== undefined) v[2] = Math.round(clamp(v[2] + d.spannung, 0, 100));
}

/** Die Beziehung eines Akteurs zur Türkei in den vier Dimensionen, gleich ob Haupt- oder weiterer Akteur. */
export function beziehungZurTuerkei(w: World, id: string): { handel: number; sicherheit: number; vertrauen: number; konflikt: number } {
  if (istHauptakteur(id)) {
    const z = weltZustand(w)[id]!;
    return { handel: z.handel, sicherheit: z.sicherheit, vertrauen: vertrauenZu(w, id), konflikt: z.konflikt };
  }
  return { ...eigenVon(w, id).tr! };
}

/** Beziehung ändern, gleich ob Haupt- oder weiterer Akteur (die Ränder wirken im Politiknetz nur bei Hauptakteuren). */
export function beziehungAendern(w: World, id: string, delta: Partial<Record<"handel" | "sicherheit" | "vertrauen" | "konflikt", number>>, grund?: string): void {
  if (istHauptakteur(id)) {
    landAendern(w, id, delta, grund);
    return;
  }
  const e = eigenVon(w, id);
  const tr = e.tr!;
  const ertrag = (v: number, d: number): number => (d > 0 ? d * clamp((100 - v) / 55, 0.1, 1.2) : d);
  if (delta.handel) tr.handel = r1(clamp(tr.handel + ertrag(tr.handel, delta.handel), 0, 100));
  if (delta.sicherheit) tr.sicherheit = r1(clamp(tr.sicherheit + ertrag(tr.sicherheit, delta.sicherheit), 0, 100));
  if (delta.vertrauen) tr.vertrauen = r1(clamp(tr.vertrauen + ertrag(tr.vertrauen, delta.vertrauen), 0, 100));
  if (delta.konflikt) tr.konflikt = r1(clamp(tr.konflikt + delta.konflikt, 0, 100));
  // Wer mit Deutschland spricht, spricht auch mit der EU: ein Teil der Wirkung geht an den Hauptakteur, an den das Land gebunden ist
  const anker = WEITERE_NACH_ID.get(id)?.anker;
  if (anker && delta.vertrauen) landAendern(w, anker.id, { vertrauen: delta.vertrauen * anker.kopplung * 0.4 });
}

// ---------------------------------------------------------------------------
// Haltung zur Türkei: Führung und Herausforderer

export const HALTUNG_WORT: Record<"-1" | "0" | "1", string> = { "-1": "türkeifeindlich", "0": "neutral", "1": "türkeifreundlich" };
export const haltungWortVon = (k: -1 | 0 | 1): string => HALTUNG_WORT[String(k) as "-1" | "0" | "1"];

/** Die Haltung der amtierenden Führung, abgelesen am Verhältnis zur Türkei (Spielparameter-Schwellen). */
export function haltungFuehrung(w: World, id: string): -1 | 0 | 1 {
  const b = beziehungZurTuerkei(w, id);
  if (b.vertrauen >= 58 && b.konflikt < 45) return 1;
  if (b.vertrauen <= 36 || b.konflikt >= 65) return -1;
  return 0;
}

/**
 * Wahrscheinlichkeit, dass die Amtsführung die nächste Wahl gewinnt: aus Rückhalt, Stärke des Herausforderers und dem Einfluss von außen.
 * Spielparameter; die Wirkung von außen ist bewusst begrenzt (höchstens etwa ein Viertel der Wahrscheinlichkeit).
 */
export function pAmtsfuehrung(w: World, id: string): number {
  const e = eigenVon(w, id);
  const d = akteurDef(id);
  const ch = e.wahl?.herausforderer;
  const ein = e.einfluss ?? 0;
  if (d.form === "autokratie" || d.form === "monarchie") return clamp(0.97 - 0.05 * Math.max(0, ein) - 0.01 * Math.max(0, 50 - e.stabilitaet), 0.55, 0.99);
  if (d.form === "uebergang") return 0.7;
  const faktor = d.form === "demokratie" ? 0.35 : 0.3;
  const logit = (e.rueckhalt - 47) / 9 + (d.form === "hybrid" ? 0.6 : 0) - ((ch?.staerke ?? 50) - 50) / 20 - faktor * ein;
  return clamp(logistik(logit), 0.02, 0.98);
}

// ---------------------------------------------------------------------------
// Nachrichten

function notiz(w: World, m: WeltModell, n: Omit<WeltNotiz, "tag" | "datum">): void {
  m.nachrichten.push({ ...n, tag: w.day, datum: w.date });
  if (m.nachrichten.length > 80) {
    // Zuerst fliegen unwichtige alte Meldungen heraus
    const i = m.nachrichten.findIndex((x) => x.gewicht < 0.4);
    m.nachrichten.splice(i >= 0 ? i : 0, 1);
  }
}

export const weltNotiz = notiz;

/** Der Monatsschritt wird seltener als die Stufen lang: Nachrichten nur, wenn sie etwas bedeuten. */
const WICHTIG_FUER_TUERKEI = new Set(["USA", "EU", "RUS", "GRC", "IRN", "SYR", "IRQ", "AZE", "ARM", "SAU", "ISR", "CHN", "UKR", "GEO", "EGY", "LBY", "CYP"]);

// ---------------------------------------------------------------------------
// Monatsschritt

export function weltModellMonat(w: World): void {
  const spiel = w.spiel;
  if (!spiel || spiel.ende) return;
  const m = weltModell(w);
  const monat = w.date.slice(0, 7);
  if (m.monat === monat) return;
  m.monat = monat;
  const rng = new Rng(hashInt(`${w.seed}|welt|${monat}`));
  const R = WELT_REGELN;

  spiegleVermittlung(w, m);

  // Gemeinsame Größen aus dem Zustand des Vormonats
  const oelAbw = (w.economy.oel ?? 100) - 100;
  const abw = (id: string): number => {
    const e = m.laender[id]!;
    return e.wachstum - startWerte(id).wachstumTrend;
  };
  const weltAbw = 0.45 * abw("USA") + 0.35 * abw("EU") + 0.2 * abw("CHN");

  // 1. Wirtschaft, Stabilität, Rückhalt, Rüstung
  for (const d of ALLE) {
    const e = m.laender[d.id]!;
    const s = startWerte(d.id);
    const sdG = R.sdWachstum[d.klasse] * Math.sqrt(R.kappaWachstum * (2 - R.kappaWachstum));
    const sdI = R.sdInflation[d.klasse] * Math.sqrt(R.kappaInflation * (2 - R.kappaInflation)) * Math.min(3, 1 + 0.03 * e.inflation);
    const oelG = d.energie > 0 ? R.oelWachstumExporteur * oelAbw : d.energie < 0 ? R.oelWachstumImporteur * oelAbw : 0;
    const krise = e.krise;
    const kriseG = krise ? { waehrung: -1.5, zahlungsausfall: -4, unruhen: -2, grenzkrise: -0.8 }[krise.art] : 0;
    const kriseP = krise ? { waehrung: 6, zahlungsausfall: 8, unruhen: 1, grenzkrise: 0.5 }[krise.art] : 0;
    const stabAbschlag = e.stabilitaet < 35 ? -((35 - e.stabilitaet) / 35) * 3 : 0;

    // Wachstum
    const zielG = s.wachstumTrend + oelG + R.mitnahme * 12 * s.offenheit * weltAbw * 0.5 + stabAbschlag - 0.04 * e.krieg - 0.8 * e.sanktion + kriseG / 3;
    e.wachstum = r2(clamp(e.wachstum + R.kappaWachstum * (zielG - e.wachstum) + rng.normal(sdG) + kriseG * 0.12, -15, 15));

    // Inflation
    const oelP = d.energie < 0 ? R.oelInflationImporteur * oelAbw : 0.01 * oelAbw;
    const defizitDruck = 0.5 * Math.max(0, -e.defizit - 4) * (1.4 - (s.basis - 15) / 100);
    const stabP = e.stabilitaet < 35 ? (35 - e.stabilitaet) * 0.15 : 0;
    const zielP = s.inflationTrend + oelP + 0.8 * e.sanktion + 0.1 * (e.wachstum - s.wachstumTrend) + defizitDruck + stabP + kriseP / 3;
    e.inflation = r2(clamp(e.inflation + R.kappaInflation * (zielP - e.inflation) + rng.normal(sdI) + kriseP * 0.1, -2, 150));

    // Defizit und Schulden
    const zielD = s.defizitTrend + 0.35 * (e.wachstum - s.wachstumTrend) - 0.1 * (e.ruestung - s.ruestungTrend);
    e.defizit = r2(clamp(e.defizit + 0.05 * (zielD - e.defizit) + rng.normal(0.12), -40, 12));
    e.schulden = r2(clamp(e.schulden - e.defizit / 12 - (e.schulden * (e.wachstum + e.inflation)) / 1200, 0, 400));

    // Stabilität
    const zielS =
      s.basis -
      0.6 * Math.max(0, e.inflation - 10) -
      2.5 * Math.max(0, -e.wachstum) -
      0.25 * Math.max(0, e.schulden - 100) -
      0.25 * e.krieg * (d.form === "demokratie" || d.form === "hybrid" ? 0.5 : 1) -
      4 * e.sanktion +
      0.12 * (e.rueckhalt - 50) +
      (d.form === "autokratie" || d.form === "monarchie" ? 5 : 0);
    e.stabilitaet = r1(clamp(e.stabilitaet + R.kappaStabilitaet * (zielS - e.stabilitaet) + rng.normal(1.1) + (krise?.art === "unruhen" ? -1.2 : 0), 0, 100));

    // Rückhalt der Führung
    const ermuedung = Math.min(15, 0.06 * e.amtsMonate) * (d.form === "demokratie" || d.form === "hybrid" ? 1 : 0.3);
    const rally = d.form === "demokratie" ? 0 : 0.1 * e.krieg;
    const zielR = 50 + 3.5 * (e.wachstum - s.wachstumTrend) - 0.7 * (e.inflation - s.inflationTrend) + 0.15 * (e.stabilitaet - 50) - ermuedung + rally;
    e.rueckhalt = r1(clamp(e.rueckhalt + R.kappaRueckhalt * (zielR - e.rueckhalt) + rng.normal(1.6), 0, 100));
    e.amtsMonate += 1;
    e.sanktion = r2(Math.max(0, e.sanktion * 0.985 - 0.005));
  }

  // 2. Bedrohung, Kriegsbelastung, Rüstung (brauchen die Spannungen)
  for (const d of ALLE) {
    const e = m.laender[d.id]!;
    const s = startWerte(d.id);
    const spannungen: number[] = [];
    for (const o of ALLE) {
      if (o.id === d.id) continue;
      const v = paarVon(w, d.id, o.id);
      if (v.buendnis < 20 || v.spannung >= 40) spannungen.push(v.spannung * (v.buendnis <= -30 ? 1.1 : 0.8));
    }
    spannungen.sort((a, b) => b - a);
    const top3 = spannungen.slice(0, 3);
    const zielB = top3.length ? (top3.reduce((a, b) => a + b, 0) / 3) * 0.9 + 0.2 * e.krieg : 0.2 * e.krieg;
    e.bedrohung = r1(clamp(e.bedrohung + 0.2 * (zielB - e.bedrohung), 0, 100));

    let zielK = d.id === "LBY" || d.id === "ETH" || d.id === "PAK" || d.id === "IRQ" ? d.krieg0 : 0;
    for (const h of HEISSE_PAARE) {
      if (h.a !== d.id && h.b !== d.id) continue;
      zielK = Math.max(zielK, paarVon(w, h.a, h.b).spannung * h.faktor);
    }
    // Kriege zwischen anderen Staaten (sim/pakte.ts): Die Belastung der Beteiligten folgt der Intensität; die Hauptparteien nehmen den Faktor
    // des heißen Paares (sonst 0,6), hineingezogene Staaten die Hälfte davon (Spielparameter).
    for (const k of m.kriege ?? []) {
      if (k.ende !== undefined) continue;
      const haupt = k.a === d.id || k.b === d.id;
      if (!haupt && !k.seiteA.includes(d.id) && !k.seiteB.includes(d.id)) continue;
      const heiss = HEISSE_PAARE.find((h) => paarSchluessel(h.a, h.b) === paarSchluessel(k.a, k.b));
      zielK = Math.max(zielK, k.intensitaet * (haupt ? (heiss?.faktor ?? 0.6) : 0.3));
    }
    e.krieg = r1(clamp(e.krieg + 0.08 * (zielK - e.krieg), 0, 100));

    const zielRu = s.ruestungTrend + 0.02 * (e.bedrohung - 40) + 0.03 * e.krieg;
    e.ruestung = r2(clamp(e.ruestung + WELT_REGELN.kappaRuestung * (zielRu - e.ruestung) + rng.normal(0.03), 0.3, 40));
  }

  // 3. Wahlen, Krisen, Machtwechsel
  for (const d of ALLE) {
    wahlPruefen(w, m, d, rng);
    krisePruefen(w, m, d, rng);
  }

  // 4. Handeln der Staaten
  for (const d of ALLE) handeln(w, m, d, rng);

  // 5. Beziehungen driften zur Anfangslage zurück; Sanktionslast der Paare klingt ab
  for (const key of Object.keys(m.paare)) {
    const v = m.paare[key]!;
    const [a, b] = key.split("|") as [string, string];
    const st = paarStart(a, b);
    v[0] = Math.round(v[0] + 0.015 * (st[0] - v[0]));
    v[1] = Math.round(v[1] + 0.01 * (st[1] - v[1]));
    v[2] = Math.round(v[2] + 0.02 * (st[2] - v[2]));
  }
  spiegleVermittlung(w, m);

  // 5b. Kriege zwischen anderen Staaten und die Beistandsrufe an die Türkei (sim/pakte.ts)
  kriegHaken?.(w, m);

  // 6. Beziehung weiterer Staaten zur Türkei: folgt dem Anker, Kurs der Führung, kleines Rauschen
  for (const wd of WEITERE) {
    const e = m.laender[wd.id]!;
    const tr = e.tr!;
    const anker = wd.anker;
    const ankerDelta = anker ? vertrauenZu(w, anker.id) - land(anker.id).start.vertrauen : 0;
    const zielV = wd.tr.vertrauen + (anker ? anker.kopplung * ankerDelta : 0) + 4 * e.kurs;
    tr.vertrauen = r1(clamp(tr.vertrauen + 0.04 * (zielV - tr.vertrauen) + rng.normal(0.3), 0, 100));
    tr.konflikt = r1(clamp(tr.konflikt + 0.02 * (wd.tr.konflikt - tr.konflikt) + rng.normal(0.2), 0, 100));
    tr.handel = r1(clamp(tr.handel + 0.015 * (wd.tr.handel - tr.handel), 0, 100));
    tr.sicherheit = r1(clamp(tr.sicherheit + 0.015 * (wd.tr.sicherheit - tr.sicherheit), 0, 100));
  }

  // 6b. Verdeckte Operationen: die des Dienstes und die fremder Dienste gegen die Türkei (sim/welt-dienst.ts)
  dienstHaken?.(w, m, rng);

  // 7. Verlauf für die Anzeige (24 Monate), dann die Rückwirkung auf die Türkei
  for (const d of ALLE) {
    const e = m.laender[d.id]!;
    e.verlauf.push([r1(e.wachstum), r1(e.inflation), r1(e.stabilitaet)]);
    if (e.verlauf.length > 24) e.verlauf.shift();
  }
  rueckwirkung(w, m);
  // 7b. Außenlage der Türkei als Zustand (sim/diplomatie.ts)
  aussenHaken?.(w, m);
  // Große Ereignisse legt sim/welt-ereignisse.ts dem Spieler vor (höchstens eines in 150 Tagen)
  ereignisHaken?.(w, m, rng);
  m.ereignisKandidaten = [];
}

/** Haken für die Außenlage; sim/diplomatie.ts registriert ihn. */
let aussenHaken: ((w: World, m: WeltModell) => void) | undefined;
export function setzeAussenHaken(f: (w: World, m: WeltModell) => void): void {
  aussenHaken = f;
}

/** Haken für den Geheimdienst; sim/welt-dienst.ts registriert ihn. */
let dienstHaken: ((w: World, m: WeltModell, rng: Rng) => void) | undefined;
export function setzeDienstHaken(f: (w: World, m: WeltModell, rng: Rng) => void): void {
  dienstHaken = f;
}

/** Haken für die Drittkriege und Pakte; sim/pakte.ts registriert ihn (der Weltmodell-Code bleibt frei vom Ladezyklus mit krieg.ts). */
let kriegHaken: ((w: World, m: WeltModell) => void) | undefined;
export function setzeKriegHaken(f: (w: World, m: WeltModell) => void): void {
  kriegHaken = f;
}

/** Haken für die Großereignisse; sim/welt-ereignisse.ts registriert ihn (vermeidet den Ladezyklus mit sim/ereignisse.ts). */
let ereignisHaken: ((w: World, m: WeltModell, rng: Rng) => void) | undefined;
export function setzeEreignisHaken(f: (w: World, m: WeltModell, rng: Rng) => void): void {
  ereignisHaken = f;
}

// ---------------------------------------------------------------------------
// Vermittlung: Spannung der Konfliktpaare folgt ihrem Konflikt-Index

function spiegleVermittlung(w: World, m: WeltModell): void {
  const vz = w.spiel?.vermittlung;
  if (!vz) return;
  for (const p of VERMITTLUNG_PAARE) {
    const z = vz[p.id];
    if (!z || !Number.isFinite(z.konfliktIndex)) continue;
    const key = paarSchluessel(p.a, p.b);
    const v = (m.paare[key] ??= [...paarStart(p.a, p.b)] as [number, number, number]);
    v[2] = Math.round(clamp(z.konfliktIndex, 0, 100));
  }
}

// ---------------------------------------------------------------------------
// Wahlen und Machtwechsel

function logistik(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

/** Der Herausforderer entsteht rund fünf Monate vor der Wahl: Haltung zur Türkei (Pendel gegenüber der Führung, Grundneigung des Landes) und Stärke. */
function ziehHerausforderer(w: World, d: WeltDef, rng: Rng): Herausforderer {
  const neigung = WEITERE_NACH_ID.get(d.id)?.eu?.neigung ?? 0;
  const fuehrung = haltungFuehrung(w, d.id);
  let pFreund = 0.3 + 0.2 * neigung + (fuehrung === -1 ? 0.12 : 0);
  let pFeind = 0.3 - 0.2 * neigung + (fuehrung === 1 ? 0.12 : 0);
  pFreund = clamp(pFreund, 0.1, 0.6);
  pFeind = clamp(pFeind, 0.1, 0.6);
  const x = rng.next();
  const kurs: -1 | 0 | 1 = x < pFeind ? -1 : x < pFeind + pFreund ? 1 : 0;
  return { kurs, staerke: r1(clamp(50 + rng.normal(8), 30, 70)) };
}

function wahlPruefen(w: World, m: WeltModell, d: WeltDef, rng: Rng): void {
  const e = m.laender[d.id]!;
  e.einfluss = r2((e.einfluss ?? 0) * 0.93);
  if (e.wahl && !e.wahl.herausforderer && e.wahl.tag - w.day <= 150 && !/Zwischenwahlen|Parteitag/.test(e.wahl.art)) {
    e.wahl.herausforderer = ziehHerausforderer(w, d, rng);
  }
  if (e.wahl && w.day >= e.wahl.tag) {
    const wahl = e.wahl;
    const ch = wahl.herausforderer;
    // Zwischenwahlen bewegen den Rückhalt, wechseln aber nicht die Führung
    const nurRueckhalt = /Zwischenwahlen/.test(wahl.art);
    let bleibt: boolean;
    if (nurRueckhalt) {
      e.rueckhalt = r1(clamp(e.rueckhalt - 3, 0, 100));
      bleibt = true;
    } else bleibt = rng.next() < pAmtsfuehrung(w, d.id);
    const stand = `Rückhalt ${Math.round(e.rueckhalt)} von 100; Wachstum ${nf(e.wachstum)} Prozent, Inflation ${nf(e.inflation)} Prozent`;
    const haltungText = ch ? ` Der Herausforderer galt als ${haltungWortVon(ch.kurs)}.` : "";
    e.einfluss = 0;
    if (bleibt) {
      notiz(w, m, {
        art: "wahl", id: d.id, titel: `${wahl.art} ${d.inLand}: ${d.regierung} bleibt`,
        fakt: `Bei der ${wahl.art} ${d.inLand} setzt sich die bisherige Führung durch (${stand}).${haltungText}`,
        wertung: 0, gewicht: WICHTIG_FUER_TUERKEI.has(d.id) ? 0.6 : 0.35,
      });
    } else {
      machtwechsel(w, m, d, rng, `bei der ${wahl.art}`, ch?.kurs);
    }
    e.wahl = naechsteWahl(w, d);
    // Eine Übergangsphase, die nicht endet, wird verlängert: zwei Jahre später steht der nächste Anlauf an
    if (!e.wahl && d.form === "uebergang" && d.wahlen.length > 0) {
      const tag = w.day + 730;
      e.wahl = { tag, datum: addDays(w.date, 730), art: "Wahl nach verlängerter Übergangsphase" };
    }
    return;
  }
  // Wechsel außerhalb der Wahlen: Basisrate, bei Instabilität deutlich höher
  const basis = WELT_REGELN.wechselMonat[e.form];
  const hebel = 1 + 4 * Math.max(0, (40 - e.stabilitaet) / 40) + (e.krise?.art === "unruhen" ? 4 : 0);
  if (rng.next() < basis * hebel) machtwechsel(w, m, d, rng, e.stabilitaet < 30 ? "nach Unruhen und Machtkampf" : e.form === "monarchie" ? "durch die Thronfolge" : "durch einen Machtwechsel im Inneren");
}

function machtwechsel(w: World, m: WeltModell, d: WeltDef, rng: Rng, wie: string, kursVorgabe?: -1 | 0 | 1): void {
  const e = m.laender[d.id]!;
  const p = rng.next();
  e.kurs = kursVorgabe ?? (p < 0.3 ? -1 : p < 0.65 ? 0 : 1);
  e.amtsMonate = 0;
  e.rueckhalt = r1(clamp(55 + rng.normal(4), 35, 75));
  const plötzlich = d.form !== "demokratie";
  e.stabilitaet = r1(clamp(e.stabilitaet - (plötzlich ? 6 : 2), 0, 100));
  if (e.krise?.art === "unruhen") e.krise = undefined;
  // Die Beziehung zur Türkei bewegt sich sofort
  beziehungAendern(w, d.id, { vertrauen: e.kurs * 6, konflikt: -e.kurs * 4 });
  const kursText = e.kurs === 1 ? "Die neue Führung sucht die Annäherung an Ankara." : e.kurs === -1 ? "Die neue Führung schlägt einen härteren Ton gegenüber Ankara an." : "Die neue Führung hält an der bisherigen Linie gegenüber Ankara fest.";
  notiz(w, m, {
    art: "machtwechsel", id: d.id, titel: `Machtwechsel ${d.inLand}`,
    fakt: `Die Führung ${d.inLand} wechselt ${wie}. ${kursText} Die Lage: Rückhalt der neuen Führung ${Math.round(e.rueckhalt)} von 100, Wachstum ${nf(e.wachstum)} Prozent, Inflation ${nf(e.inflation)} Prozent.`,
    wertung: 0.25 * e.kurs, gewicht: WICHTIG_FUER_TUERKEI.has(d.id) ? 0.95 : 0.5,
  });
  addLog(w, "ereignis", `Machtwechsel ${d.inLand}`, kursText);
  m.ereignisKandidaten = [...(m.ereignisKandidaten ?? []), { art: "machtwechsel", id: d.id, kurs: e.kurs }];
}

// ---------------------------------------------------------------------------
// Krisen

function finanzdruck(e: LandEigen): number {
  return clamp(40 * (e.schulden / 120) + 3 * Math.max(0, -e.defizit) + 0.8 * Math.max(0, e.inflation - 10), 0, 100);
}
export { finanzdruck };

function krisePruefen(w: World, m: WeltModell, d: WeltDef, rng: Rng): void {
  const e = m.laender[d.id]!;
  const k = e.krise;
  if (k) {
    if (w.day < k.bis) return;
    // Ende der Krise
    e.krise = undefined;
    if (k.art === "unruhen") {
      if (e.stabilitaet < 25 && d.form !== "demokratie") {
        machtwechsel(w, m, d, rng, "nach den Unruhen");
        return;
      }
      e.stabilitaet = r1(clamp(e.stabilitaet + 8, 0, 100));
    } else if (k.art === "grenzkrise" && k.gegen) {
      setzePaar(m, d.id, k.gegen, { spannung: -12 });
    }
    notiz(w, m, {
      art: "krise_ende", id: d.id, titel: `${KRISE_NAME[k.art]} ${d.inLand} klingt ab`,
      fakt: `Die Lage ${d.inLand} beruhigt sich: Stabilität ${Math.round(e.stabilitaet)} von 100, Inflation ${nf(e.inflation)} Prozent.`,
      wertung: 0.1, gewicht: WICHTIG_FUER_TUERKEI.has(d.id) ? 0.5 : 0.25,
    });
    return;
  }
  const fd = finanzdruck(e);
  const gewicht = WICHTIG_FUER_TUERKEI.has(d.id) ? 0.9 : 0.4;
  let art: KriseArt | null = null;
  if (e.inflation > 25 && e.defizit < -4 && rng.next() < 0.012 * Math.min(2.5, e.inflation / 30)) art = "waehrung";
  else if (e.schulden > 90 && fd > 70 && e.wachstum < 1 && rng.next() < (d.klasse === "fortgeschritten" ? 0.0012 : 0.004)) art = "zahlungsausfall";
  else if (e.stabilitaet < 25 && rng.next() < 0.006 + (0.03 * (25 - e.stabilitaet)) / 25) art = "unruhen";
  if (!art) return;
  const dauer = art === "zahlungsausfall" ? 18 : art === "waehrung" ? 9 : 6;
  e.krise = { art, seit: w.day, bis: w.day + dauer * 30 };
  if (art === "waehrung") {
    e.inflation = r2(clamp(e.inflation + 6, -2, 150));
    e.stabilitaet = r1(clamp(e.stabilitaet - 6, 0, 100));
  } else if (art === "zahlungsausfall") {
    e.schulden = r2(Math.max(0, e.schulden - 20));
    e.stabilitaet = r1(clamp(e.stabilitaet - 10, 0, 100));
    e.inflation = r2(clamp(e.inflation + 5, -2, 150));
  } else {
    e.rueckhalt = r1(clamp(e.rueckhalt - 10, 0, 100));
    e.stabilitaet = r1(clamp(e.stabilitaet - 8, 0, 100));
  }
  const fakt =
    art === "waehrung"
      ? `Die Inflation ${d.inLand} springt auf ${nf(e.inflation)} Prozent, das Defizit liegt bei ${nf(-e.defizit)} Prozent des BIP.`
      : art === "zahlungsausfall"
        ? `${akteurName(d.id)} kann seine Schulden von zuletzt ${nf(e.schulden + 20, 0)} Prozent des BIP nicht mehr bedienen; die Gläubiger verhandeln über einen Schuldenschnitt.`
        : `Die Stabilität ${d.inLand} fällt auf ${Math.round(e.stabilitaet)} von 100, der Rückhalt der Führung auf ${Math.round(e.rueckhalt)}.`;
  notiz(w, m, { art: "krise", id: d.id, titel: `${KRISE_NAME[art]} ${d.inLand}`, fakt, wertung: -0.3 * gewicht, gewicht });
  addLog(w, "ereignis", `${KRISE_NAME[art]} ${d.inLand}`, fakt);
  m.ereignisKandidaten = [...(m.ereignisKandidaten ?? []), { art: "krise", id: d.id, krise: art }];
}

export const KRISE_NAME: Record<KriseArt, string> = {
  waehrung: "Währungskrise",
  zahlungsausfall: "Staatsbankrott",
  unruhen: "Unruhen",
  grenzkrise: "Grenzgefechte",
};

// ---------------------------------------------------------------------------
// Handeln der Staaten

type Handlung = "gipfel" | "handelspakt" | "hilfe" | "ruestung" | "druck" | "sanktion" | "buendnis" | "entspannung" | "repression";

function handeln(w: World, m: WeltModell, d: WeltDef, rng: Rng): void {
  const e = m.laender[d.id]!;
  if (rng.next() >= WELT_REGELN.handlungChance[d.klasse]) return;
  const s = startWerte(d.id);
  const not = clamp((s.wachstumTrend - e.wachstum) / 3 + (e.inflation - s.inflationTrend) / 10, 0, 2);
  const freunde: string[] = [];
  const rivalen: string[] = [];
  for (const o of ALLE) {
    if (o.id === d.id) continue;
    const v = paarVon(w, d.id, o.id);
    if (v.buendnis >= 25 && v.spannung < 40) freunde.push(o.id);
    if (v.spannung >= 40 || v.buendnis <= -30) rivalen.push(o.id);
  }
  const kandidaten: { h: Handlung; wgt: number }[] = [];
  if (freunde.length) {
    kandidaten.push({ h: "gipfel", wgt: 1 + 0.5 * not });
    kandidaten.push({ h: "handelspakt", wgt: 0.8 + 1.2 * not });
    if (e.stabilitaet > 55 && freunde.some((f) => m.laender[f]!.stabilitaet < 40)) kandidaten.push({ h: "hilfe", wgt: 0.5 });
    kandidaten.push({ h: "buendnis", wgt: 0.25 });
  }
  if (rivalen.length) {
    const hoechste = Math.max(...rivalen.map((r) => paarVon(w, d.id, r).spannung));
    kandidaten.push({ h: "druck", wgt: 0.3 + 0.01 * hoechste + (d.form !== "demokratie" && e.rueckhalt < 40 ? 0.4 : 0) });
    kandidaten.push({ h: "ruestung", wgt: Math.max(0.05, 0.2 + 0.015 * (e.bedrohung - 30)) * (finanzdruck(e) < 70 ? 1 : 0.3) });
    if (d.id === "USA" || d.id === "EU" || d.id === "CHN") kandidaten.push({ h: "sanktion", wgt: hoechste > 55 ? 0.3 : 0 });
    if (not > 0.3 && rivalen.some((r) => paarVon(w, d.id, r).spannung > 50)) kandidaten.push({ h: "entspannung", wgt: 0.2 + 0.4 * not });
  }
  if (d.form !== "demokratie" && e.stabilitaet < 40) kandidaten.push({ h: "repression", wgt: 0.8 });
  const summe = kandidaten.reduce((a, b) => a + b.wgt, 0);
  if (summe <= 0) return;
  let r = rng.next() * summe;
  let gewaehlt = kandidaten[kandidaten.length - 1]!.h;
  for (const c of kandidaten) {
    r -= c.wgt;
    if (r <= 0) {
      gewaehlt = c.h;
      break;
    }
  }
  e.handlung = w.day;
  const wahlAus = (liste: string[]): string => liste[Math.floor(rng.next() * liste.length)]!;
  const wichtig = (...ids: string[]): number => (ids.some((i) => WICHTIG_FUER_TUERKEI.has(i)) ? 0.7 : 0.3);

  switch (gewaehlt) {
    case "gipfel": {
      const p = wahlAus(freunde);
      setzePaar(m, d.id, p, { buendnis: 5, spannung: -2 });
      if (WICHTIG_FUER_TUERKEI.has(d.id) && WICHTIG_FUER_TUERKEI.has(p) && rng.next() < 0.5) {
        notiz(w, m, { art: "gipfel", id: d.id, gegen: p, titel: `Gipfel: ${akteurName(d.id)} und ${akteurName(p)}`, fakt: `${akteurName(d.id)} und ${akteurName(p)} vertiefen ihre Zusammenarbeit (Bündnis ${paarVon(w, d.id, p).buendnis}).`, wertung: 0, gewicht: 0.3 });
      }
      break;
    }
    case "handelspakt": {
      const p = wahlAus(freunde);
      const vorher = paarVon(w, d.id, p).handel;
      setzePaar(m, d.id, p, { handel: 8, buendnis: 2 });
      e.wachstum = r2(clamp(e.wachstum + 0.05, -15, 15));
      m.laender[p]!.wachstum = r2(clamp(m.laender[p]!.wachstum + 0.05, -15, 15));
      if (vorher < 60 && wichtig(d.id, p) > 0.5) {
        notiz(w, m, { art: "gipfel", id: d.id, gegen: p, titel: `Handelsabkommen: ${akteurName(d.id)} und ${akteurName(p)}`, fakt: `Der Handel zwischen ${akteurDat(d.id)} und ${akteurDat(p)} wächst (Handelsverflechtung ${paarVon(w, d.id, p).handel} von 100).`, wertung: 0, gewicht: 0.3 });
      }
      break;
    }
    case "hilfe": {
      const p = freunde.filter((f) => m.laender[f]!.stabilitaet < 40)[0] ?? wahlAus(freunde);
      setzePaar(m, d.id, p, { buendnis: 6, handel: 3 });
      m.laender[p]!.stabilitaet = r1(clamp(m.laender[p]!.stabilitaet + 2.5, 0, 100));
      e.schulden = r2(e.schulden + 0.1);
      notiz(w, m, { art: "hilfe", id: d.id, gegen: p, titel: `${akteurName(d.id)} hilft ${akteurDat(p)}`, fakt: `${akteurName(d.id)} stützt ${akteurAkk(p)} mit Finanzhilfe; deren Stabilität steigt auf ${Math.round(m.laender[p]!.stabilitaet)} von 100.`, wertung: 0, gewicht: wichtig(d.id, p) * 0.7 });
      break;
    }
    case "ruestung": {
      const p = wahlAus(rivalen);
      const plus = r2(0.1 + rng.next() * 0.2);
      e.ruestung = r2(clamp(e.ruestung + plus, 0.3, 40));
      setzePaar(m, d.id, p, { spannung: 2 });
      if (plus > 0.22 && WICHTIG_FUER_TUERKEI.has(d.id)) {
        notiz(w, m, { art: "ruestung", id: d.id, gegen: p, titel: `${akteurName(d.id)} rüstet auf`, fakt: `Die Rüstungsausgaben ${d.inLand} steigen auf ${nf(e.ruestung)} Prozent des BIP; ${akteurName(p)} gilt als wichtigster Rivale.`, wertung: -0.1, gewicht: 0.45 });
      }
      break;
    }
    case "druck": {
      const p = wahlAus(rivalen);
      setzePaar(m, d.id, p, { spannung: 3, buendnis: -3 });
      if (d.form !== "demokratie" && e.rueckhalt < 40) {
        e.rueckhalt = r1(clamp(e.rueckhalt + 1.5, 0, 100));
        if (WICHTIG_FUER_TUERKEI.has(d.id) && rng.next() < 0.4) {
          notiz(w, m, { art: "bruch", id: d.id, gegen: p, titel: `${akteurName(d.id)} sucht den Streit mit ${akteurDat(p)}`, fakt: `Bei einem Rückhalt von nur ${Math.round(e.rueckhalt)} von 100 lenkt ${d.regierung} von den Problemen im Inneren ab; die Spannung mit ${akteurDat(p)} steigt auf ${paarVon(w, d.id, p).spannung}.`, wertung: -0.1, gewicht: 0.45 });
        }
      }
      break;
    }
    case "sanktion": {
      const p = rivalen.reduce((a, b) => (paarVon(w, d.id, b).spannung > paarVon(w, d.id, a).spannung ? b : a));
      const t = m.laender[p]!;
      t.sanktion = r2(clamp(t.sanktion + (d.id === "USA" ? 0.6 : d.id === "EU" ? 0.5 : 0.3), 0, 3));
      setzePaar(m, d.id, p, { spannung: 3, handel: -8, buendnis: -3 });
      notiz(w, m, { art: "sanktion", id: d.id, gegen: p, titel: `${akteurName(d.id)} verschärft die Sanktionen gegen ${akteurAkk(p)}`, fakt: `Der Handel zwischen den beiden fällt auf ${paarVon(w, d.id, p).handel} von 100; die Sanktionslast ${p === "RUS" || p === "IRN" ? "des Zielstaats" : "für " + akteurAkk(p)} steigt auf ${nf(t.sanktion)} von 3.`, wertung: p === "RUS" || p === "IRN" || p === "CHN" ? -0.15 : -0.05, gewicht: wichtig(d.id, p) });
      break;
    }
    case "buendnis": {
      const p = wahlAus(freunde);
      const gemeinsam = rivalen.filter((r) => r !== p && paarVon(w, p, r).spannung >= 40);
      if (gemeinsam.length === 0) break;
      const vor = paarVon(w, d.id, p).buendnis;
      setzePaar(m, d.id, p, { buendnis: 7 });
      for (const r of gemeinsam.slice(0, 1)) {
        setzePaar(m, d.id, r, { spannung: 2 });
        setzePaar(m, p, r, { spannung: 2 });
      }
      const nach = paarVon(w, d.id, p).buendnis;
      if (vor < 60 && nach >= 60) {
        notiz(w, m, { art: "pakt", id: d.id, gegen: p, titel: `${akteurName(d.id)} und ${akteurName(p)} schließen enger zusammen`, fakt: `Das Bündnis zwischen den beiden steigt auf ${nach}; gemeinsamer Gegenspieler ist ${akteurName(gemeinsam[0]!)}.`, wertung: 0, gewicht: wichtig(d.id, p) });
      }
      break;
    }
    case "entspannung": {
      const p = rivalen.reduce((a, b) => (paarVon(w, d.id, b).spannung > paarVon(w, d.id, a).spannung ? b : a));
      const vz = VERMITTLUNG_PAARE.some((v) => paarSchluessel(v.a, v.b) === paarSchluessel(d.id, p));
      if (vz) break;
      setzePaar(m, d.id, p, { spannung: -6, handel: 3 });
      notiz(w, m, { art: "entspannung", id: d.id, gegen: p, titel: `${akteurName(d.id)} und ${akteurName(p)} nähern sich an`, fakt: `Wirtschaftliche Not drängt zur Entspannung: Die Spannung zwischen den beiden sinkt auf ${paarVon(w, d.id, p).spannung}.`, wertung: 0.1, gewicht: wichtig(d.id, p) * 0.8 });
      break;
    }
    case "repression": {
      e.stabilitaet = r1(clamp(e.stabilitaet + 4, 0, 100));
      e.rueckhalt = r1(clamp(e.rueckhalt - 2.5, 0, 100));
      if (WICHTIG_FUER_TUERKEI.has(d.id)) {
        notiz(w, m, { art: "repression", id: d.id, titel: `${akteurName(d.id)} verschärft den Kurs im Inneren`, fakt: `Bei einer Stabilität von ${Math.round(e.stabilitaet)} von 100 setzt ${d.regierung} auf Härte; der Rückhalt sinkt auf ${Math.round(e.rueckhalt)}.`, wertung: -0.05, gewicht: 0.4 });
      }
      break;
    }
  }
}

// ---------------------------------------------------------------------------
// Rückwirkung auf die Türkei

const EXPORT_GEWICHT: Record<string, number> = { EU: 0.34, USA: 0.07, GBR: 0.07, IRQ: 0.06, RUS: 0.05, SAU: 0.03, ARE: 0.03, EGY: 0.02, CHN: 0.02, ISR: 0, ITA: 0.03, ESP: 0.03, FRA: 0.04 };

function rueckwirkung(w: World, m: WeltModell): void {
  // Nachfrage: Wie sich das Wachstum der Abnehmer gegenüber dem Vorjahr verändert hat (ohne Anfangsausschlag)
  let nachfrage = 0;
  for (const [id, g] of Object.entries(EXPORT_GEWICHT)) {
    const e = m.laender[id];
    if (!e || e.verlauf.length < 13) continue;
    const vor = e.verlauf[e.verlauf.length - 13]![0];
    nachfrage += g * (e.wachstum - vor);
  }
  if (nachfrage !== 0) wirke(w, "export", clamp(0.12 * nachfrage, -0.35, 0.35));

  // Unruhe in der Nachbarschaft: Sicherheit und Gäste
  let unruhe = 0;
  for (const id of ["SYR", "IRQ", "IRN", "GEO", "ARM", "UKR", "LBY", "AZE", "GRC", "CYP"]) {
    const e = m.laender[id];
    if (!e?.krise) continue;
    unruhe += e.krise.art === "grenzkrise" || e.krise.art === "unruhen" ? 1 : 0.5;
  }
  if (unruhe > 0 && NET.index.has("terrorgefahr")) wirke(w, "terrorgefahr", Math.min(0.3, 0.1 * unruhe));
  if (unruhe > 0 && NET.index.has("tourismus")) wirke(w, "tourismus", -Math.min(0.2, 0.05 * unruhe));
}

// ---------------------------------------------------------------------------
// Lesefunktionen für Oberfläche und Zeitung

export interface LageSicht {
  id: string;
  wachstum: number;
  inflation: number;
  schulden: number;
  defizit: number;
  ruestung: number;
  stabilitaet: number;
  rueckhalt: number;
  bedrohung: number;
  krieg: number;
  stabilitaetWort: string;
  regierungsform: string;
  wahlText: string;
  krise?: { art: KriseArt; name: string; bisTag: number };
  verlauf: [number, number, number][];
  herkunft: Record<Code, string>;
}

export const FORM_NAME: Record<Regierungsform, string> = {
  demokratie: "Demokratie",
  hybrid: "Hybrides Regime",
  autokratie: "Autokratie",
  monarchie: "Monarchie",
  uebergang: "Übergangsregierung",
};

export function stabilitaetWort(s: number): string {
  if (s >= 75) return "stabil";
  if (s >= 55) return "gefestigt";
  if (s >= 40) return "angespannt";
  if (s >= 25) return "brüchig";
  return "am Rand des Zerfalls";
}

export function lage(w: World, id: string): LageSicht {
  const e = eigenVon(w, id);
  const d = akteurDef(id);
  const wahlText = e.wahl ? `${e.wahl.art} am ${e.wahl.datum.split("-").reverse().join(".")}` : d.wahlen.length === 0 && (d.form === "monarchie" || d.id === "UKR" || d.id === "LBY") ? "keine Wahl vorgesehen" : "kein Termin";
  return {
    id,
    wachstum: e.wachstum,
    inflation: e.inflation,
    schulden: e.schulden,
    defizit: e.defizit,
    ruestung: e.ruestung,
    stabilitaet: e.stabilitaet,
    rueckhalt: e.rueckhalt,
    bedrohung: e.bedrohung,
    krieg: e.krieg,
    stabilitaetWort: stabilitaetWort(e.stabilitaet),
    regierungsform: FORM_NAME[e.form],
    wahlText,
    ...(e.krise ? { krise: { art: e.krise.art, name: KRISE_NAME[e.krise.art], bisTag: e.krise.bis } } : {}),
    verlauf: e.verlauf,
    herkunft: startWerte(id).herkunft,
  };
}

/** Die jüngsten Veränderungen eines Akteurs, neueste zuerst. */
export function jungeNachrichten(w: World, id: string, n = 4): WeltNotiz[] {
  return [...weltModell(w).nachrichten].filter((x) => x.id === id || x.gegen === id).reverse().slice(0, n);
}

export interface WeltNachricht {
  /** Kennung des Akteurs */
  id: string;
  /** Name des Landes für die Anzeige */
  land: string;
  titel: string;
  fakt: string;
  wertung: number;
  tag: number;
}

/**
 * Nachrichten aus der Welt seit einem Tag, die wichtigsten zuerst (nur Fakten mit Zahlen aus dem Zustand).
 * Die Zeitung hängt sie in die Rubrik „Ausland“; die Bewertung ist klein, weil es Auslandsnachrichten sind.
 */
export function weltNachrichten(w: World, seitTag: number, max = 6): WeltNachricht[] {
  const m = w.spiel?.weltmodell;
  if (!m) return [];
  return [...m.nachrichten]
    .filter((n) => n.tag > seitTag)
    .sort((a, b) => b.gewicht - a.gewicht || b.tag - a.tag)
    .slice(0, max)
    .map((n) => ({ id: n.id, land: akteurName(n.id), titel: n.titel, fakt: n.fakt, wertung: n.wertung, tag: n.tag }));
}

// ---------------------------------------------------------------------------
// Gesten gegenüber weiteren Staaten (schlanker als der Verhandlungstisch der Hauptakteure)

export interface GesteSicht {
  aktion: (typeof AKTIONEN)[AktionId];
  moeglich: boolean;
  grund?: string;
}

export const WEITERE_AKTIONEN: AktionId[] = ["gipfel", "handel", "ruestung", "druck", "entspannen", "hilfe"];

export function gestenFuerWeitere(w: World, id: string): GesteSicht[] {
  const e = eigenVon(w, id);
  const tr = e.tr!;
  const spiel = w.spiel!;
  return WEITERE_AKTIONEN.map((a) => {
    const def = AKTIONEN[a];
    const rest = (e.zuletzt?.[a] ?? -1e9) + def.abkuehlung - w.day;
    let grund: string | undefined;
    if (rest > 0) grund = `Wieder möglich in ${rest} Tagen.`;
    else if (spiel.kapital < def.pk) grund = "Dafür fehlt Kapital.";
    else if (a === "handel" && tr.vertrauen < 40) grund = "Dafür ist das Vertrauen noch zu gering.";
    else if (a === "ruestung" && tr.sicherheit < 35) grund = "Dafür ist die Sicherheitszusammenarbeit zu dünn.";
    else if (a === "entspannen" && tr.konflikt < 30) grund = "Es gibt keinen Streit, der entschärft werden müsste.";
    else if (a === "gipfel" && tr.konflikt >= 80) grund = "Solange der Konflikt so heftig ist, kommt kein Treffen zustande.";
    else if (a === "gipfel" && tr.vertrauen >= 82) grund = "Das Verhältnis ist so gut, wie es allein durch Treffen wird.";
    else if (a === "hilfe" && tr.handel >= 88 && tr.vertrauen >= 82) grund = "Mehr Hilfe würde das Verhältnis nicht mehr verbessern.";
    return { aktion: def, moeglich: !grund, ...(grund ? { grund } : {}) };
  });
}

export function fuehreGesteAus(w: World, id: string, aktion: AktionId): { ok: boolean; text: string; why?: string } {
  const spiel = w.spiel;
  if (!spiel) return { ok: false, text: "Ohne Spielschleife gibt es keine Außenpolitik." };
  const sicht = gestenFuerWeitere(w, id).find((x) => x.aktion.id === aktion);
  if (!sicht) return { ok: false, text: "Diese Geste gibt es diesem Land gegenüber nicht." };
  if (!sicht.moeglich) return { ok: false, text: sicht.grund ?? "Das geht gerade nicht." };
  const def = sicht.aktion;
  const e = eigenVon(w, id);
  const dat = akteurDat(id);
  const akk = akteurAkk(id);
  spiel.kapital -= def.pk;
  (e.zuletzt ??= {})[aktion] = w.day;
  let text = "";
  let why = `Kostet ${def.pk} Kapital.`;
  switch (aktion) {
    case "gipfel":
      beziehungAendern(w, id, { vertrauen: 8, konflikt: -3 });
      text = `Gipfeltreffen mit ${dat}: Das Verhältnis wird wärmer (Vertrauen ${Math.round(e.tr!.vertrauen)}).`;
      break;
    case "handel":
      beziehungAendern(w, id, { handel: 12, vertrauen: 3 });
      wirke(w, "export", 1.2);
      text = `Handelsabkommen mit ${dat}: Der Handel wächst (Handel ${Math.round(e.tr!.handel)}).`;
      break;
    case "ruestung":
      beziehungAendern(w, id, { sicherheit: 12, vertrauen: 4 });
      w.economy.debtRatio += 0.1;
      text = `Rüstungsgeschäft mit ${dat}: Die Zusammenarbeit wächst (Sicherheit ${Math.round(e.tr!.sicherheit)}).`;
      why += " Etwa 0,1 % des BIP.";
      break;
    case "druck":
      beziehungAendern(w, id, { vertrauen: -8, konflikt: 6 });
      wirke(w, "konservative", 0.8);
      text = `Ankara macht öffentlich Druck auf ${akk}: Zu Hause gibt es Beifall, im Ausland Ärger.`;
      break;
    case "entspannen":
      beziehungAendern(w, id, { konflikt: -12, vertrauen: 4 });
      text = `Gespräche mit ${dat} entschärfen den Streit (Konflikt ${Math.round(e.tr!.konflikt)}).`;
      why += " Nationalisten zu Hause sehen darin Schwäche.";
      break;
    case "hilfe":
      beziehungAendern(w, id, { vertrauen: 6, handel: 8, konflikt: -4 });
      w.economy.debtRatio += 0.1;
      text = `Wirtschaftshilfe für ${akk}: Das Land rückt näher (Vertrauen ${Math.round(e.tr!.vertrauen)}).`;
      why += " Etwa 0,1 % des BIP.";
      break;
  }
  addLog(w, "entscheidung", text, why);
  return { ok: true, text, why };
}

// ---------------------------------------------------------------------------
// Anbindung an den Monatsschritt der Länder (sim/laender.ts ruft den Haken am Ende von weltMonat)

setzeWeltHaken(weltModellMonat);

/** Alle Mitglieder-Kennungen der EU für Tests und Oberfläche. */
export const EU_KENNUNGEN: string[] = [...EU_MITGLIEDER];
