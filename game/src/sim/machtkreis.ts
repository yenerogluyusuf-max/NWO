// Der Machtkreis: Menschen statt Indizes an der Spitze. Neben den Ämtern (sim/personen.ts) stehen hier vier Figuren ohne Ressort
// (Kronprinz in der eigenen Partei, Fraktionschef, eine investigative Journalistin oder ein Journalist, die Präsidentin oder der Präsident
// des Verfassungsgerichts), dazu Beziehungen (Rivalen, Verbündete, Familie, Geschäfte), Geheimnisse und der Regierungsstil.
// Die Figuren handeln selbst (Monatsschritt), der Spieler hat wenige, gewichtige Hebel: befördern, kaltstellen, Deal, Bauernopfer,
// Untersuchung durch den Dienst, Begnadigung, Säuberung. Alle Namen sind erfunden; alle Zahlen sind Spielparameter.

import { msg, t, type Msg } from "../i18n";
import { NET } from "./modell";
import { nationalAverage } from "./netz";
import { addLog } from "./log";
import { vertrauenAendern, wirke } from "./wirkung";
import { AEMTER, eigenVon, grollVerschieben, hashZahl, loyalitaetVerschieben, merke } from "./personen";
import { neuerName } from "./figuren";
import { ausscheiden } from "./nachfolge";
import { mitStufen } from "./behoerden";
import { autoritaerScore, verfassungsZustand } from "./verfassung";
import { kannZahlen } from "./kapital";
import { Rng } from "./rng";
import type { LagerArt } from "./personen-typen";
import type { Figur } from "./spiel-typen";
import type { World } from "./types";

// ---------------------------------------------------------------------------
// Spielparameter

export const MACHTKREIS = {
  /** Nur für Vergleichsmessungen abschaltbar (Mess-Tor); im Spiel immer an */
  aktiv: true,
  /** Schwellen des Regierungsstils (0 offen … 100 autoritär) */
  offenBis: 40,
  autoritaerAb: 65,
  /** So schnell folgt die Angst im Apparat ihrem Ziel (Anteil je Monat) */
  angstTempo: 0.12,
  /** Fähigkeit, die unter Angst je Monat verloren geht (bei Angst 100) */
  kompetenzVerlust: 0.35,
  /** Ehrgeiz, der in offener Konkurrenz je Monat wächst */
  konkurrenz: 0.35,
  /** Wachstum einer Rivalität je Monat, wenn beide ehrgeizig sind */
  rivalitaet: 2.2,
  /** Nachfolgedruck: Grundzuwachs je Monat und Zuschläge */
  nachfolgeGrund: 0.4,
  /** Kosten der Hebel in Kapital */
  pk: { befoerdern: 2, kaltstellen: 1, deal: 3, bauernopfer: 1, untersuchung: 3, begnadigung: 2, saeuberung: 4 } as Record<Hebel, number>,
  /** Abkühlung je Person und Hebel in Tagen */
  abkuehlung: 90,
  /** Dauer einer Untersuchung in Tagen bei Personalstufe 3 des Dienstes */
  untersuchungTage: 75,
  /** So lange hält ein Deal, in Tagen */
  dealTage: 365,
  /** So lange bleibt jemand kaltgestellt, in Tagen */
  kaltTage: 360,
};

// ---------------------------------------------------------------------------
// Zustand

export type NebenArt = "kronprinz" | "fraktionschef" | "journalist" | "richter";
export const NEBEN_ARTEN: NebenArt[] = ["kronprinz", "fraktionschef", "journalist", "richter"];

export interface Nebenfigur {
  id: string;
  art: NebenArt;
  name: string;
  weiblich: boolean;
  alter: number;
  lager: LagerArt;
  ehrgeiz: number;
  loyalitaet: number;
  kompetenz: number;
  /** Gewicht in Partei, Fraktion, Öffentlichkeit oder Gericht, 0 bis 100 */
  einfluss: number;
  status: "aktiv" | "kaltgestellt" | "haft";
  /** Bis zu diesem Tag kaltgestellt oder in Haft */
  bis?: number;
  seit: number;
}

export type BeziehungArt = "rivalen" | "verbuendet" | "familie" | "geschaeft";

export interface Beziehung {
  /** Schlüssel der Personen: Kennung und Name (wer im Amt ersetzt wird, verliert seine Beziehungen) */
  a: string;
  b: string;
  art: BeziehungArt;
  /** 0 bis 100 */
  staerke: number;
  /** Ob der Präsident davon weiß (sonst nur durch eine Untersuchung sichtbar) */
  bekannt: boolean;
}

export type GeheimnisArt = "korruption" | "doppelspiel" | "auslandskontakt" | "putschzirkel" | "privat";

export interface Geheimnis {
  id: string;
  person: string;
  art: GeheimnisArt;
  /** 1 leicht, 2 ernst, 3 schwer */
  schwere: 1 | 2 | 3;
  /** Der Präsident kennt es (Untersuchung) */
  aufgedeckt: boolean;
  /** Es steht in der Zeitung */
  oeffentlich: boolean;
  seit: number;
}

export interface Untersuchung {
  person: string;
  beginn: number;
  ende: number;
}

export interface Szene {
  tag: number;
  art: string;
  msg: Msg;
  personen: string[];
  /** Stempel der Szene */
  stempel: string;
}

export interface MachtkreisZustand {
  v: 1;
  neben: Nebenfigur[];
  beziehungen: Beziehung[];
  geheimnisse: Geheimnis[];
  /** Angst im Apparat, 0 bis 100 */
  angst: number;
  /** Druck in der eigenen Partei, die Nachfolge zu klären, 0 bis 100 */
  nachfolge: number;
  untersuchungen: Untersuchung[];
  /** Letzter Einsatz eines Hebels: "hebel|person" → Tag */
  zuletzt: Record<string, number>;
  /** Laufende Deals: Person → bis Tag */
  deals: Record<string, number>;
  /** Kaltgestellte Minister: Person → bis Tag */
  kalt: Record<string, number>;
  /** Fraktionsdisziplin, die schon in ein Gesetz eingerechnet ist: Gesetz → Stimmen */
  disziplin: Record<string, number>;
  /** Säuberungen der letzten Zeit (Tage) */
  saeuberungen: number[];
  szenen: Szene[];
}

export type Hebel = "befoerdern" | "kaltstellen" | "deal" | "bauernopfer" | "untersuchung" | "begnadigung" | "saeuberung";
export const HEBEL: Hebel[] = ["befoerdern", "kaltstellen", "deal", "bauernopfer", "untersuchung", "begnadigung", "saeuberung"];

// ---------------------------------------------------------------------------
// Hilfen

const klemme = (x: number, lo = 0, hi = 100): number => Math.min(hi, Math.max(lo, x));
const knoten = (w: World, id: string, standard: number): number => (NET.index.has(id) ? nationalAverage(NET, w.net, id) : standard);
const zufallVon = (w: World, s: string): number => hashZahl(`${w.seed}|mk|${w.day}|${s}`);

export const schluesselVon = (f: { id: string; name: string }): string => `${f.id}|${f.name}`;

/** Wer zum Kreis gehört: Regierung, Partner, Zentralbank und Opposition aus den Ämtern; dazu die Nebenfiguren. */
export interface Person {
  schluessel: string;
  id: string;
  name: string;
  weiblich: boolean;
  /** Amt oder Art der Nebenfigur */
  rolle: string;
  lager: LagerArt;
  loyalitaet: number;
  ehrgeiz: number;
  kompetenz: number;
  art: "amt" | "neben";
  figur?: Figur;
  neben?: Nebenfigur;
}

const ABHAENGIG: Figur["amt"][] = ["finanzen", "inneres", "aussen", "stab", "justiz", "generalstab", "wirtschaft"];

function amtPerson(w: World, f: Figur): Person {
  const e = eigenVon(w, f);
  return { schluessel: schluesselVon(f), id: f.id, name: f.name, weiblich: !!f.weiblich, rolle: f.amt, lager: e.lager, loyalitaet: f.loyalitaet, ehrgeiz: e.ehrgeiz, kompetenz: e.faehigkeit, art: "amt", figur: f };
}

function nebenPerson(n: Nebenfigur): Person {
  return { schluessel: schluesselVon(n), id: n.id, name: n.name, weiblich: n.weiblich, rolle: n.art, lager: n.lager, loyalitaet: n.loyalitaet, ehrgeiz: n.ehrgeiz, kompetenz: n.kompetenz, art: "neben", neben: n };
}

/** Alle Personen des Kreises, die gerade im Spiel sind. */
export function personen(w: World): Person[] {
  const sp = w.spiel;
  if (!sp) return [];
  const mk = machtkreis(w);
  const amt = sp.figuren.filter((f) => f.imAmt && (ABHAENGIG.includes(f.amt) || f.amt === "opposition" || f.amt === "zentralbank")).map((f) => amtPerson(w, f));
  // Von den Bündnispartnern nur der erste (sonst wird das Netz unlesbar)
  const partner = sp.figuren.find((f) => f.imAmt && f.amt === "partner");
  if (partner) amt.push(amtPerson(w, partner));
  return [...amt, ...mk.neben.map(nebenPerson)];
}

export function personVon(w: World, schluessel: string): Person | undefined {
  return personen(w).find((p) => p.schluessel === schluessel);
}

export const nebenVon = (w: World, art: NebenArt): Nebenfigur | undefined => machtkreis(w).neben.find((n) => n.art === art);

// ---------------------------------------------------------------------------
// Regierungsstil

/** Wie autoritär regiert wird, 0 (offen) bis 100 (autoritär): Pressefreiheit, unabhängige Justiz, Medienaufsicht, Versammlungsrecht, Ausnahmerecht, Verfassung. */
export function regimeGrad(w: World): number {
  let vf = 0;
  try {
    vf = autoritaerScore(verfassungsZustand(w).aktiv ?? {});
  } catch {
    vf = 0;
  }
  const r =
    0.3 * (100 - knoten(w, "pressefreiheit", 30)) +
    0.3 * (100 - knoten(w, "justiz_unabhaengigkeit", 32)) +
    0.15 * knoten(w, "m_medienaufsicht", 65) +
    0.1 * (100 - knoten(w, "m_versammlungsfreiheit", 35)) +
    0.15 * knoten(w, "ausnahmerecht", 10) +
    4 * vf;
  return Math.round(klemme(r));
}

export type RegimeStil = "offen" | "gelenkt" | "autoritaer";
export function regimeStil(grad: number): RegimeStil {
  return grad < MACHTKREIS.offenBis ? "offen" : grad >= MACHTKREIS.autoritaerAb ? "autoritaer" : "gelenkt";
}

// ---------------------------------------------------------------------------
// Anlegen

const NEBEN_LAGER: Record<NebenArt, LagerArt> = { kronprinz: "partei", fraktionschef: "partei", journalist: "opposition", richter: "justiz" };

function neueNebenfigur(w: World, art: NebenArt, rng: Rng, benutzt: Set<string>): Nebenfigur {
  const weiblich = rng.next() < (art === "journalist" ? 0.5 : 0.35);
  const name = neuerName(rng, benutzt, weiblich);
  benutzt.add(name);
  const r = (a: number, b: number) => Math.round(a + (b - a) * rng.next());
  const werte: Record<NebenArt, [number, number, number, number, number]> = {
    // ehrgeiz, loyalität, kompetenz, einfluss, alter
    kronprinz: [r(70, 92), r(45, 62), r(55, 80), r(40, 60), r(42, 56)],
    fraktionschef: [r(40, 65), r(55, 72), r(50, 78), r(45, 65), r(48, 64)],
    journalist: [r(55, 80), r(10, 25), r(60, 85), r(25, 45), r(34, 52)],
    richter: [r(25, 50), r(30, 55), r(65, 88), r(50, 70), r(55, 66)],
  };
  const [ehrgeiz, loyalitaet, kompetenz, einfluss, alter] = werte[art];
  return { id: `n-${art}`, art, name, weiblich, alter, lager: NEBEN_LAGER[art], ehrgeiz, loyalitaet, kompetenz, einfluss, status: "aktiv", seit: w.day };
}

const GEHEIMNIS_JE_AMT: Partial<Record<Figur["amt"], GeheimnisArt[]>> = {
  finanzen: ["korruption", "privat"],
  wirtschaft: ["korruption", "privat"],
  inneres: ["doppelspiel", "korruption"],
  aussen: ["auslandskontakt", "privat"],
  stab: ["doppelspiel", "privat"],
  justiz: ["korruption", "privat"],
  generalstab: ["putschzirkel", "korruption"],
};

/** Beziehungen und Geheimnisse für eine Person, die neu in den Kreis kommt. */
function verknuepfe(w: World, mk: MachtkreisZustand, p: Person, alle: Person[], rng: Rng): void {
  const andere = alle.filter((x) => x.schluessel !== p.schluessel);
  const hat = (b: Person, art?: BeziehungArt) => mk.beziehungen.some((x) => ((x.a === p.schluessel && x.b === b.schluessel) || (x.b === p.schluessel && x.a === b.schluessel)) && (!art || x.art === art));
  const neu = (b: Person, art: BeziehungArt, staerke: number, bekannt: boolean) => {
    if (!hat(b)) mk.beziehungen.push({ a: p.schluessel, b: b.schluessel, art, staerke: Math.round(staerke), bekannt });
  };
  // Rivalen: Ehrgeizige suchen sich einen Gegner, am liebsten aus einem anderen Lager
  if (p.ehrgeiz >= 55 && p.rolle !== "opposition") {
    const kand = andere.filter((b) => b.ehrgeiz >= 45 && b.lager !== p.lager && b.rolle !== "opposition" && !mk.beziehungen.some((x) => x.art === "rivalen" && (x.a === b.schluessel || x.b === b.schluessel) && x.staerke > 40));
    const b = kand[Math.floor(rng.next() * kand.length)];
    if (b) neu(b, "rivalen", 25 + rng.next() * 25, rng.next() < 0.7);
  }
  // Verbündete im selben Lager
  const gleich = andere.filter((b) => b.lager === p.lager && b.rolle !== "opposition");
  const v = gleich[Math.floor(rng.next() * gleich.length)];
  if (v && rng.next() < 0.7) neu(v, "verbuendet", 40 + rng.next() * 30, true);
  // Familie oder Geschäfte: selten, meist verborgen
  if (rng.next() < 0.22) {
    const b = andere[Math.floor(rng.next() * andere.length)];
    if (b) neu(b, rng.next() < 0.5 ? "familie" : "geschaeft", 50 + rng.next() * 30, rng.next() < 0.3);
  }
  // Geheimnisse: etwa jede dritte Person im Amt hat eines
  const arten = p.art === "amt" && p.figur ? GEHEIMNIS_JE_AMT[p.figur.amt] : p.neben?.art === "kronprinz" ? (["doppelspiel", "korruption"] as GeheimnisArt[]) : undefined;
  if (arten && rng.next() < 0.36) {
    let art = arten[Math.floor(rng.next() * arten.length)]!;
    if (art === "putschzirkel" && p.ehrgeiz < 60) art = "korruption";
    mk.geheimnisse.push({ id: `g-${p.id}-${w.day}-${mk.geheimnisse.length}`, person: p.schluessel, art, schwere: (1 + Math.floor(rng.next() * 3)) as 1 | 2 | 3, aufgedeckt: false, oeffentlich: false, seit: w.day });
  }
}

/** Der Machtkreis; ältere Spielstände legen ihn beim ersten Zugriff an. */
export function machtkreis(w: World): MachtkreisZustand {
  const sp = w.spiel;
  if (!sp) throw new Error("Den Machtkreis gibt es nur im Spiel.");
  if (sp.machtkreis) return sp.machtkreis;
  const rng = new Rng(Math.floor(hashZahl(`${w.seed}|machtkreis`) * 2147483647) || 1);
  const benutzt = new Set<string>(sp.figuren.map((f) => f.name));
  const mk: MachtkreisZustand = { v: 1, neben: [], beziehungen: [], geheimnisse: [], angst: 0, nachfolge: 10, untersuchungen: [], zuletzt: {}, deals: {}, kalt: {}, disziplin: {}, saeuberungen: [], szenen: [] };
  for (const art of NEBEN_ARTEN) mk.neben.push(neueNebenfigur(w, art, rng, benutzt));
  sp.machtkreis = mk;
  mk.angst = Math.round(klemme((regimeGrad(w) - 30) * 0.8));
  const alle = personen(w);
  for (const p of alle) verknuepfe(w, mk, p, alle, rng);
  // Kronprinz und Präsidialamt sind fast immer Rivalen: Wer den Zugang zum Präsidenten hat, steht dem Nachfolger im Weg
  const kp = alle.find((p) => p.rolle === "kronprinz");
  const stab = alle.find((p) => p.rolle === "stab");
  if (kp && stab && !mk.beziehungen.some((x) => (x.a === kp.schluessel && x.b === stab.schluessel) || (x.b === kp.schluessel && x.a === stab.schluessel))) mk.beziehungen.push({ a: kp.schluessel, b: stab.schluessel, art: "rivalen", staerke: 45, bekannt: true });
  return mk;
}

// ---------------------------------------------------------------------------
// Anzeigehilfen

export function beziehungenVon(w: World, schluessel: string, nurBekannt = true): (Beziehung & { andere: string })[] {
  return machtkreis(w)
    .beziehungen.filter((b) => (b.a === schluessel || b.b === schluessel) && (b.bekannt || !nurBekannt))
    .map((b) => ({ ...b, andere: b.a === schluessel ? b.b : b.a }));
}

export function geheimnisVon(w: World, schluessel: string): Geheimnis | undefined {
  return machtkreis(w).geheimnisse.find((g) => g.person === schluessel);
}

export const verborgeneBeziehungen = (w: World): number => machtkreis(w).beziehungen.filter((b) => !b.bekannt).length;

function szene(w: World, art: string, m: Msg, personen: string[], stempel: string): void {
  const mk = machtkreis(w);
  mk.szenen.push({ tag: w.day, art, msg: m, personen, stempel });
  if (mk.szenen.length > 24) mk.szenen.splice(0, mk.szenen.length - 24);
}

function aendereLoyalitaet(w: World, p: Person, d: number): void {
  if (p.figur) loyalitaetVerschieben(p.figur, d);
  else if (p.neben) p.neben.loyalitaet = klemme(p.neben.loyalitaet + d);
}
function aendereEhrgeiz(w: World, p: Person, d: number): void {
  if (p.figur) {
    const e = eigenVon(w, p.figur);
    e.ehrgeiz = klemme(e.ehrgeiz + d);
  } else if (p.neben) p.neben.ehrgeiz = klemme(p.neben.ehrgeiz + d);
}
function aendereGroll(w: World, p: Person, d: number): void {
  if (p.figur) grollVerschieben(w, p.figur, d);
  else if (p.neben) p.neben.loyalitaet = klemme(p.neben.loyalitaet - d * 0.3);
}
function aendereKompetenz(w: World, p: Person, d: number): void {
  if (p.figur) {
    const e = eigenVon(w, p.figur);
    e.faehigkeit = klemme(e.faehigkeit + d);
  } else if (p.neben) p.neben.kompetenz = klemme(p.neben.kompetenz + d);
}

const anzeigeName = (p: Person | undefined): string => (p ? p.name : "?");
export const rolleText = (p: Pick<Person, "rolle">): string => t(`mk.rolle.${p.rolle}`);

// ---------------------------------------------------------------------------
// Hebel

export interface HebelSicht {
  hebel: Hebel;
  moeglich: boolean;
  grund?: string;
  pk: number;
  /** Ein Satz: was geschieht */
  folge: string;
}

function istRegierung(p: Person): boolean {
  return p.art === "amt" && !!p.figur && AEMTER[p.figur.amt].regierungsamt;
}

function pkVon(w: World, h: Hebel): number {
  const stil = regimeStil(regimeGrad(w));
  const basis = MACHTKREIS.pk[h];
  // Im autoritären Stil sind Dienst und Druck billiger, Deals teurer (niemand traut einem Wort)
  if (stil === "autoritaer" && (h === "untersuchung" || h === "saeuberung" || h === "kaltstellen")) return Math.max(1, basis - 1);
  if (stil === "autoritaer" && h === "deal") return basis + 1;
  return basis;
}

/** Was mit einer Person gerade möglich ist, mit Preis und Grund. */
export function hebelFuer(w: World, schluessel: string): HebelSicht[] {
  const sp = w.spiel;
  const p = personVon(w, schluessel);
  if (!sp || !p) return [];
  const mk = machtkreis(w);
  const stil = regimeStil(regimeGrad(w));
  const g = geheimnisVon(w, schluessel);
  const sperre = (h: Hebel): string | undefined => {
    const z = mk.zuletzt[`${h}|${schluessel}`];
    return z !== undefined && w.day - z < MACHTKREIS.abkuehlung ? t("mk.grund.abkuehlung", { tage: MACHTKREIS.abkuehlung - (w.day - z) }) : undefined;
  };
  const out: HebelSicht[] = [];
  const add = (h: Hebel, bedingung: string | undefined, folge: string) => {
    const pk = pkVon(w, h);
    const grund = bedingung ?? sperre(h) ?? (!kannZahlen(sp.kapital, pk) ? t("mk.grund.kapital", { pk }) : undefined);
    out.push({ hebel: h, moeglich: !grund, ...(grund ? { grund } : {}), pk, folge });
  };
  const opposition = p.rolle === "opposition";
  const haft = p.neben?.status === "haft";
  const kalt = (p.neben?.status === "kaltgestellt") || (mk.kalt[schluessel] ?? -1) > w.day;
  if (!opposition && !haft) add("befoerdern", kalt ? t("mk.grund.kalt") : undefined, t(`mk.hebel.befoerdern.folge.${p.art}`));
  if (!opposition && !haft && p.rolle !== "journalist") add("kaltstellen", kalt ? t("mk.grund.schonKalt") : p.rolle === "zentralbank" ? t("mk.grund.zentralbank") : undefined, t(`mk.hebel.kaltstellen.folge.${p.rolle === "richter" ? "richter" : p.art}`));
  if (!haft) add("deal", (mk.deals[schluessel] ?? -1) > w.day ? t("mk.grund.dealLaeuft") : undefined, t(`mk.hebel.deal.folge.${p.rolle === "kronprinz" ? "kronprinz" : p.rolle === "opposition" ? "opposition" : "allg"}`));
  if (istRegierung(p)) add("bauernopfer", p.figur && eigenVon(w, p.figur).kommissarisch ? t("mk.grund.kommissarisch") : undefined, g?.oeffentlich ? t("mk.hebel.bauernopfer.folge.skandal") : t("mk.hebel.bauernopfer.folge.ohne"));
  if (!haft) add("untersuchung", mk.untersuchungen.some((u) => u.person === schluessel) ? t("mk.grund.untersuchungLaeuft") : g?.aufgedeckt ? t("mk.grund.schonBekannt") : undefined, t("mk.hebel.untersuchung.folge", { tage: untersuchungDauer(w) }));
  if (haft) add("begnadigung", undefined, t("mk.hebel.begnadigung.folge"));
  if (p.rolle === "generalstab" || p.rolle === "inneres") add("saeuberung", stil === "offen" ? t("mk.grund.saeuberungOffen") : undefined, t("mk.hebel.saeuberung.folge"));
  return out;
}

const untersuchungDauer = (w: World): number => Math.max(30, Math.round(MACHTKREIS.untersuchungTage - 12 * (mitStufen(w).personal - 3)));

export interface HebelErgebnis {
  ok: boolean;
  text: string;
}

/** Einen Hebel ziehen. */
export function zieheHebel(w: World, schluessel: string, h: Hebel): HebelErgebnis {
  const sp = w.spiel;
  const p = personVon(w, schluessel);
  if (!sp || !p) return { ok: false, text: t("mk.grund.unbekannt") };
  const sicht = hebelFuer(w, schluessel).find((x) => x.hebel === h);
  if (!sicht) return { ok: false, text: t("mk.grund.nichtMoeglich") };
  if (!sicht.moeglich) return { ok: false, text: sicht.grund ?? t("mk.grund.nichtMoeglich") };
  const mk = machtkreis(w);
  sp.kapital -= sicht.pk;
  mk.zuletzt[`${h}|${schluessel}`] = w.day;
  const name = p.name;
  const rolle = rolleText(p);
  const rivalen = beziehungenVon(w, schluessel, false).filter((b) => b.art === "rivalen").map((b) => personVon(w, b.andere)).filter((x): x is Person => !!x);
  const verbuendete = beziehungenVon(w, schluessel, false).filter((b) => b.art === "verbuendet").map((b) => personVon(w, b.andere)).filter((x): x is Person => !!x);
  const brichtDeal = (mk.deals[schluessel] ?? -1) > w.day && (h === "kaltstellen" || h === "bauernopfer");
  let text = "";
  switch (h) {
    case "befoerdern": {
      aendereLoyalitaet(w, p, 10);
      aendereEhrgeiz(w, p, -10);
      aendereGroll(w, p, -15);
      if (p.figur) eigenVon(w, p.figur).mittelBis = w.day + 180;
      if (p.neben) p.neben.einfluss = klemme(p.neben.einfluss + 15);
      for (const r of rivalen) {
        aendereGroll(w, r, 10);
        aendereLoyalitaet(w, r, -4);
      }
      if (p.rolle === "kronprinz") mk.nachfolge = klemme(mk.nachfolge + 8);
      if (p.rolle === "richter") wirke(w, "justiz_unabhaengigkeit", -1.5);
      text = t("mk.log.befoerdern", { name, rolle, rivalen: rivalen.length });
      break;
    }
    case "kaltstellen": {
      aendereLoyalitaet(w, p, -10);
      aendereGroll(w, p, 22);
      aendereEhrgeiz(w, p, -12);
      if (p.neben) {
        p.neben.status = "kaltgestellt";
        p.neben.bis = w.day + MACHTKREIS.kaltTage;
        p.neben.einfluss = klemme(p.neben.einfluss - 25);
      } else mk.kalt[schluessel] = w.day + MACHTKREIS.kaltTage;
      for (const r of rivalen) aendereLoyalitaet(w, r, 5);
      for (const v of verbuendete) aendereLoyalitaet(w, v, -5);
      if (p.rolle === "kronprinz") mk.nachfolge = klemme(mk.nachfolge - 25);
      if (p.rolle === "richter") {
        wirke(w, "justiz_unabhaengigkeit", -4);
        wirke(w, "beziehungen_eu", -1.5);
      }
      text = t("mk.log.kaltstellen", { name, rolle });
      break;
    }
    case "deal": {
      aendereLoyalitaet(w, p, 15);
      aendereGroll(w, p, -20);
      mk.deals[schluessel] = w.day + MACHTKREIS.dealTage;
      if (p.rolle === "kronprinz") mk.nachfolge = klemme(mk.nachfolge - 30);
      if (p.rolle === "opposition") wirke(w, "polarisierung", -1.5);
      if (p.rolle === "journalist" && p.neben) p.neben.einfluss = klemme(p.neben.einfluss - 5);
      text = t(`mk.log.deal.${p.rolle === "kronprinz" ? "kronprinz" : p.rolle === "opposition" ? "opposition" : "allg"}`, { name, rolle });
      break;
    }
    case "bauernopfer": {
      const g = geheimnisVon(w, schluessel);
      const skandal = !!g?.oeffentlich;
      if (p.figur) {
        merke(w, p.figur, t("mk.merke.bauernopfer"));
        ausscheiden(w, p.figur, t("mk.grund.bauernopferGrund"));
      }
      vertrauenAendern(w, skandal ? 1.6 : -0.5);
      for (const v of verbuendete) aendereLoyalitaet(w, v, -6);
      for (const r of rivalen) aendereLoyalitaet(w, r, 3);
      // Wer opfert, zeigt allen: Niemand ist sicher
      for (const x of personen(w)) if (istRegierung(x) && x.schluessel !== schluessel) aendereLoyalitaet(w, x, -1.5);
      text = t(skandal ? "mk.log.bauernopfer.skandal" : "mk.log.bauernopfer.ohne", { name, rolle });
      break;
    }
    case "untersuchung": {
      mk.untersuchungen.push({ person: schluessel, beginn: w.day, ende: w.day + untersuchungDauer(w) });
      if (regimeStil(regimeGrad(w)) === "autoritaer") mk.angst = klemme(mk.angst + 4);
      text = t("mk.log.untersuchung", { name, rolle, tage: untersuchungDauer(w) });
      break;
    }
    case "begnadigung": {
      if (p.neben) {
        p.neben.status = "aktiv";
        delete p.neben.bis;
        p.neben.einfluss = klemme(p.neben.einfluss + 10);
        p.neben.loyalitaet = klemme(p.neben.loyalitaet + 8);
      }
      wirke(w, "pressefreiheit", 2);
      wirke(w, "beziehungen_eu", 2);
      wirke(w, "ansehen", 1);
      mk.angst = klemme(mk.angst - 4);
      // Die eigenen Hardliner murren
      const inneres = personen(w).find((x) => x.rolle === "inneres");
      if (inneres) aendereGroll(w, inneres, 8);
      text = t("mk.log.begnadigung", { name });
      break;
    }
    case "saeuberung": {
      saeubere(w, p);
      text = t("mk.log.saeuberung", { name, rolle });
      break;
    }
  }
  if (brichtDeal) {
    delete mk.deals[schluessel];
    for (const x of personen(w)) if (x.schluessel !== schluessel && x.rolle !== "opposition") aendereLoyalitaet(w, x, -4);
    vertrauenAendern(w, -0.6);
    text += " " + t("mk.log.wortbruch", { name });
  }
  addLog(w, "entscheidung", text, t(`mk.warum.${h}`));
  szene(w, h, msg(`mk.szene.${h}`, { name, rolle }), [schluessel], t(`mk.stempel.${h}`));
  return { ok: true, text };
}

/** Säuberung im Apparat: Putschgefahr sinkt für ein Jahr, Fähigkeit und Moral sinken, die Angst steigt, das Ausland schaut zu. */
function saeubere(w: World, p: Person): void {
  const mk = machtkreis(w);
  mk.saeuberungen.push(w.day);
  mk.angst = klemme(mk.angst + 15);
  for (const x of personen(w)) {
    if (x.lager === "apparat" || x.lager === "streitkraefte") {
      aendereKompetenz(w, x, -8);
      aendereLoyalitaet(w, x, 6);
    }
  }
  // Wer ein Putsch-Geheimnis hatte, ist es los
  for (const g of mk.geheimnisse) if (g.art === "putschzirkel" && personVon(w, g.person)?.lager === "streitkraefte") g.schwere = 1;
  if (p.figur) eigenVon(w, p.figur).ehrgeiz = klemme(eigenVon(w, p.figur).ehrgeiz - 20);
  wirke(w, "truppenmoral", -4);
  wirke(w, "offiziersvertrauen", -3);
  wirke(w, "beziehungen_eu", -2);
  wirke(w, "beziehungen_usa", -1);
  wirke(w, "pressefreiheit", -1);
  const enden = w.spiel?.enden;
  if (enden) enden.putsch.geschuetztBis = Math.max(enden.putsch.geschuetztBis ?? 0, w.day + 365);
}

// ---------------------------------------------------------------------------
// Monat: Was die Menschen von selbst tun

/** Ereignisse, die der Monatsschritt anstößt, öffnet der Ereignistakt (sim/ereignisse-machtkreis.ts liest den Zustand). */
export function machtkreisMonat(w: World): void {
  const sp = w.spiel;
  if (!sp || !MACHTKREIS.aktiv) return;
  const mk = machtkreis(w);
  const grad = regimeGrad(w);
  const stil = regimeStil(grad);
  // 1. Wer gegangen ist, verliert Beziehungen und Geheimnisse; Neue werden verknüpft
  const alle = personen(w);
  const da = new Set(alle.map((p) => p.schluessel));
  mk.beziehungen = mk.beziehungen.filter((b) => da.has(b.a) && da.has(b.b));
  mk.geheimnisse = mk.geheimnisse.filter((g) => da.has(g.person));
  for (const k of Object.keys(mk.kalt)) if (!da.has(k) || mk.kalt[k]! <= w.day) delete mk.kalt[k];
  for (const k of Object.keys(mk.deals)) if (!da.has(k) || mk.deals[k]! <= w.day) delete mk.deals[k];
  const bekannt = new Set([...mk.beziehungen.flatMap((b) => [b.a, b.b]), ...mk.geheimnisse.map((g) => g.person)]);
  const rng = new Rng(Math.floor(zufallVon(w, "neu") * 2147483647) || 1);
  for (const p of alle) if (!bekannt.has(p.schluessel) && w.day - (p.figur ? eigenVon(w, p.figur).seit : p.neben!.seit) > 60) verknuepfe(w, mk, p, alle, rng);
  // 2. Angst folgt dem Stil und den Säuberungen der letzten zwei Jahre
  mk.saeuberungen = mk.saeuberungen.filter((d) => w.day - d < 730);
  const ziel = klemme((grad - 30) * 0.9 + 12 * mk.saeuberungen.length);
  mk.angst = klemme(mk.angst + (ziel - mk.angst) * MACHTKREIS.angstTempo);
  // 3. Stil prägt die Menschen
  for (const p of alle) {
    if (!istRegierung(p)) continue;
    const kalt = (mk.kalt[p.schluessel] ?? -1) > w.day;
    if (mk.angst > 40) {
      // Unter Angst sagt niemand mehr, was nicht geht: die Fähigkeit schwindet, die gezeigte Loyalität bleibt hoch
      aendereKompetenz(w, p, -MACHTKREIS.kompetenzVerlust * (mk.angst - 40) / 60);
      if (p.loyalitaet < 45) aendereLoyalitaet(w, p, 0.4);
    }
    if (stil === "offen" && p.ehrgeiz >= 50) aendereEhrgeiz(w, p, MACHTKREIS.konkurrenz);
    if (kalt) {
      aendereGroll(w, p, 1.5);
      if (p.figur) eigenVon(w, p.figur).druckBis = w.day + 31;
    }
    // Verborgene Doppelspiele und Putschzirkel wachsen im Dunkeln
    const g = geheimnisVon(w, p.schluessel);
    if (g && !g.aufgedeckt && (g.art === "doppelspiel" || g.art === "putschzirkel")) {
      aendereEhrgeiz(w, p, 0.5);
      if (stil === "autoritaer" && p.loyalitaet > 30) aendereLoyalitaet(w, p, -0.4);
    }
  }
  // Ein Doppelspiel entsteht, wo Angst auf Kränkung trifft
  for (const p of alle) {
    if (!istRegierung(p) || geheimnisVon(w, p.schluessel)) continue;
    const groll = p.figur ? eigenVon(w, p.figur).groll : 0;
    const chance = (mk.angst / 100) * (groll / 100) * 0.06;
    if (zufallVon(w, `doppel|${p.schluessel}`) < chance) mk.geheimnisse.push({ id: `g-${p.id}-${w.day}`, person: p.schluessel, art: p.lager === "streitkraefte" ? "putschzirkel" : "doppelspiel", schwere: 2, aufgedeckt: false, oeffentlich: false, seit: w.day });
  }
  // 4. Rivalitäten wachsen, wenn beide ehrgeizig sind, und schlafen sonst ein
  for (const b of mk.beziehungen) {
    if (b.art !== "rivalen") continue;
    const pa = personVon(w, b.a);
    const pb = personVon(w, b.b);
    if (!pa || !pb) continue;
    const wachsen = pa.ehrgeiz >= 55 && pb.ehrgeiz >= 45;
    b.staerke = klemme(b.staerke + (wachsen ? MACHTKREIS.rivalitaet * (stil === "offen" ? 1.2 : 1) : -1));
    if (b.staerke >= 60 && !b.bekannt) b.bekannt = true;
  }
  // 5. Nebenfiguren
  for (const n of mk.neben) {
    if ((n.status === "kaltgestellt" || n.status === "haft") && (n.bis ?? 0) <= w.day) {
      n.status = "aktiv";
      delete n.bis;
    }
    if (n.status !== "aktiv") continue;
    if (n.art === "journalist") {
      // Reichweite folgt der Pressefreiheit
      const ziel2 = 20 + 0.6 * knoten(w, "pressefreiheit", 30);
      n.einfluss = klemme(n.einfluss + (ziel2 - n.einfluss) * 0.08);
    }
    if (n.art === "richter") {
      const unabh = (100 - n.loyalitaet) / 100;
      wirke(w, "justiz_unabhaengigkeit", 0.04 * (unabh - 0.5));
    }
    if (n.art === "fraktionschef") disziplinMonat(w, n);
  }
  // 6. Nachfolgedruck in der eigenen Partei: schlechte Zahlen, lange Amtszeit, ein ehrgeiziger Kronprinz
  const kp = nebenVon(w, "kronprinz");
  const zust = sp.umfrage.zustimmung;
  const zuwachs =
    MACHTKREIS.nachfolgeGrund +
    Math.max(0, (45 - zust) * 0.12) +
    Math.max(0, (sp.amtszeit - 1) * 0.35) +
    (kp && kp.status === "aktiv" ? Math.max(0, (kp.ehrgeiz - 60) * 0.03) : -0.5) -
    ((mk.deals[kp ? schluesselVon(kp) : ""] ?? -1) > w.day ? 1 : 0) -
    Math.max(0, (zust - 55) * 0.1);
  mk.nachfolge = klemme(mk.nachfolge + zuwachs * (stil === "autoritaer" ? 0.5 : 1));
  // 7. Untersuchungen enden
  for (const u of [...mk.untersuchungen]) if (u.ende <= w.day) schliesseUntersuchung(w, u);
}

/** Der Fraktionschef hält die Reihen oder lässt sie laufen: Laufende Gesetze bekommen einmal Stimmen dazu oder verlieren welche. */
function disziplinMonat(w: World, n: Nebenfigur): void {
  const sp = w.spiel!;
  const mk = machtkreis(w);
  const wert = disziplinStimmen(w);
  for (const g of sp.gesetze) {
    if (mk.disziplin[g.id] !== undefined) continue;
    mk.disziplin[g.id] = wert;
    g.stimmenBonus = (g.stimmenBonus ?? 0) + wert;
  }
  // Abgestimmte Gesetze vergessen
  const offen = new Set(sp.gesetze.map((g) => g.id));
  for (const k of Object.keys(mk.disziplin)) if (!offen.has(k)) delete mk.disziplin[k];
  void n;
}

/** Wie viele Stimmen der Fraktionschef einem Gesetz dazugibt (positiv) oder kostet (negativ). */
export function disziplinStimmen(w: World): number {
  const n = nebenVon(w, "fraktionschef");
  if (!n || n.status !== "aktiv") return -4;
  return Math.round(((n.loyalitaet + n.kompetenz) / 2 - 55) / 5);
}

function schliesseUntersuchung(w: World, u: Untersuchung): void {
  const mk = machtkreis(w);
  mk.untersuchungen = mk.untersuchungen.filter((x) => x !== u);
  const p = personVon(w, u.person);
  if (!p) return;
  const st = mitStufen(w);
  const g = geheimnisVon(w, u.person);
  const fund = 0.5 + 0.08 * (st.technik - 3) + 0.05 * (st.personal - 3);
  const gefunden = !!g && zufallVon(w, `fund|${u.person}`) < fund;
  // Verborgene Beziehungen der Person werden sichtbar
  let neu = 0;
  for (const b of mk.beziehungen) if ((b.a === u.person || b.b === u.person) && !b.bekannt && zufallVon(w, `bez|${b.a}|${b.b}`) < fund + 0.2) {
    b.bekannt = true;
    neu++;
  }
  if (gefunden && g) g.aufgedeckt = true;
  // Die Untersuchung kann durchsickern: in offenen Zeiten eher als unter Angst
  const leck = (regimeStil(regimeGrad(w)) === "offen" ? 0.3 : regimeStil(regimeGrad(w)) === "gelenkt" ? 0.18 : 0.08) - 0.03 * (st.technik - 3);
  const sickert = zufallVon(w, `leck|${u.person}`) < leck;
  if (sickert) {
    aendereGroll(w, p, 25);
    aendereLoyalitaet(w, p, -10);
    vertrauenAendern(w, -0.5);
  }
  const art = gefunden && g ? t(`mk.geheimnis.${g.art}`) : "";
  const text = gefunden ? t("mk.log.fund", { name: p.name, art, neu }) : t("mk.log.keinFund", { name: p.name, neu });
  addLog(w, "ereignis", sickert ? `${text} ${t("mk.log.gesickert", { name: p.name })}` : text, t("mk.warum.untersuchungEnde"));
  szene(w, gefunden ? "fund" : "keinFund", msg(gefunden ? "mk.szene.fund" : "mk.szene.keinFund", { name: p.name, art }), [u.person], t(gefunden ? "mk.stempel.fund" : "mk.stempel.keinFund"));
}

// ---------------------------------------------------------------------------
// Für Ereignisse und Anzeige

/** Die stärkste bekannte Rivalität zweier Personen, die beide im Kreis sind. */
export function heftigsteRivalitaet(w: World): Beziehung | undefined {
  return machtkreis(w)
    .beziehungen.filter((b) => b.art === "rivalen" && personVon(w, b.a) && personVon(w, b.b) && personVon(w, b.a)!.rolle !== "opposition" && personVon(w, b.b)!.rolle !== "opposition")
    .sort((a, b) => b.staerke - a.staerke)[0];
}

/** Wer kurz davor ist, die Seite zu wechseln: kaum Loyalität, viel Groll, Ehrgeiz, und ein Draht zur Opposition oder zum Kronprinzen. */
export function wechselKandidat(w: World): Person | undefined {
  const mk = machtkreis(w);
  const kp = nebenVon(w, "kronprinz");
  const opp = personen(w).find((p) => p.rolle === "opposition");
  return personen(w)
    .filter((p) => istRegierung(p) && p.loyalitaet < 22 && (p.figur ? eigenVon(w, p.figur).groll >= 45 : false) && p.ehrgeiz >= 50)
    .filter((p) => mk.beziehungen.some((b) => (b.a === p.schluessel || b.b === p.schluessel) && (b.a === opp?.schluessel || b.b === opp?.schluessel || (kp && (b.a === schluesselVon(kp) || b.b === schluesselVon(kp))))) || p.loyalitaet < 15)
    .sort((a, b) => a.loyalitaet - b.loyalitaet)[0];
}

/** Ein Geheimnis, das die Presse gerade erreichen kann: Groll der Person, ein Rivale mit Wissen, Reichweite der Journalistin. */
export function geheimnisFuerPresse(w: World): Geheimnis | undefined {
  const mk = machtkreis(w);
  const j = nebenVon(w, "journalist");
  if (!j || j.status !== "aktiv") return undefined;
  return mk.geheimnisse
    .filter((g) => !g.oeffentlich && personVon(w, g.person) && istRegierung(personVon(w, g.person)!))
    .map((g) => {
      const p = personVon(w, g.person)!;
      const groll = p.figur ? eigenVon(w, p.figur).groll : 0;
      const rivale = mk.beziehungen.some((b) => b.art === "rivalen" && (b.a === g.person || b.b === g.person) && b.staerke >= 50);
      return { g, s: g.schwere * 10 + groll * 0.3 + (rivale ? 20 : 0) + j.einfluss * 0.3 };
    })
    .filter((x) => x.s >= 45)
    .sort((a, b) => b.s - a.s)[0]?.g;
}

/** Das Putsch-Geheimnis im Generalstab, falls es aufgedeckt ist. */
export function aufgedeckterPutschzirkel(w: World): Geheimnis | undefined {
  return machtkreis(w).geheimnisse.find((g) => g.art === "putschzirkel" && g.aufgedeckt && g.schwere >= 2 && personVon(w, g.person));
}

export function macheOeffentlich(w: World, g: Geheimnis): void {
  g.oeffentlich = true;
  g.aufgedeckt = true;
}

export const zeigeSzene = szene;

/** Kurzer Lagesatz für die Kopfzeile des Kreises. */
export function lageSatz(w: World): string {
  const mk = machtkreis(w);
  const grad = regimeGrad(w);
  const stil = regimeStil(grad);
  const r = heftigsteRivalitaet(w);
  const teile = [t(`mk.lage.${stil}`, { angst: Math.round(mk.angst) })];
  if (mk.nachfolge >= 60) teile.push(t("mk.lage.nachfolge", { druck: Math.round(mk.nachfolge) }));
  else if (r && r.staerke >= 55 && r.bekannt) teile.push(t("mk.lage.rivalen", { a: anzeigeName(personVon(w, r.a)), b: anzeigeName(personVon(w, r.b)) }));
  return teile.join(" ");
}
