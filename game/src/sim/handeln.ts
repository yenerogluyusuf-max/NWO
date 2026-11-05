// Wie ein Vorhaben zur Wirklichkeit wird: Ort, Politisches Kapital, Parlament, Verwaltungskapazität.
//
// Der Spieler verändert nicht einfach einen Regler. Jede Änderung
//   - kostet Politisches Kapital (knapp, wächst mit Vertrauen und Mehrheit),
//   - braucht ein Gesetz mit der Mehrheit der Anwesenden im Parlament (Art. 96, siehe PLENUM) oder, wo das Recht es erlaubt, einen
//     Erlass, einen Präsidialbeschluss oder die Mindestlohnkommission (data/rechtswege.ts),
//   - kann auf einzelne Provinzen beschränkt werden (Bau vor Ort),
//   - konkurriert mit allen anderen laufenden Vorhaben um die Verwaltungskapazität.
// Alle Werte sind Platzhalter der Kalibrierung.

import { politikGeaendert } from "./zynismus";
import { NET } from "./modell";
import { erfuelleZusage, schliesseZusageErinnerung, zusageStufen, zusageZielErreicht } from "./zusagenfolgen";
import { addDays, formatDateDe } from "./dates";
import { nationalAverage, PROVINCES, startAverage } from "./netz";
import type { NodeSpec } from "../data/politiknetz";
import { addLog, fmt } from "./log";
import { PROVINZEN } from "./regional";
import { clamp } from "./economy";
import { vertrauenAendern } from "./wirkung";
import { reagiereFiguren } from "./figuren";
import { rabattFuer } from "./programme";
import { beobachte } from "./berichte";
import { duldung, sachstimmen } from "./fraktionen";
import { jaAnteilLager, jaAnteilOpposition, linienFaktor, reagierePartner, reagiereStamm } from "./linie";
import { t, zahl } from "../i18n";
import type { Rng } from "./rng";
import type { World } from "./types";
import type { Gesetz, Weg } from "./spiel-typen";
import type { FassungId } from "../data/gesetzesvorhaben";
import { kannZahlen } from "./kapital";
import { krisenFuerMassnahme, type KrisenTreffer } from "./krisen";
import { starteUmsetzung } from "./umsetzung";
import { rechtswegVon, type Rechtsweg } from "../data/rechtswege";
import { stufenName } from "../data/skalen";
import { AUFMERKSAMKEIT_KOSTEN, VERFASSUNG, hashWert, neuanfangGrund, stufeVon, unsicherheitFaktor, verbrauche, verfassungVon } from "./aufmerksamkeit";

export const REGELN = {
  /** Gleichzeitig laufende Vorhaben, bevor die Verwaltung überlastet ist */
  kapazitaet: 8,
  /** Zuschlag je Vorhaben über der Kapazität (Umsetzungsdauer) */
  ueberlastStufe: 0.2,
  /** Tage vom Einbringen bis zur Abstimmung */
  tageBisAbstimmung: 21,
  /** Tage im Fachausschuss (vom Einbringen an); danach geht die Vorlage ins Plenum. Spielparameter (die Geschäftsordnung kennt Fristen,
   *  aber keine feste Dauer; RECHERCHE_GESETZGEBUNG_TUERKEI §3) */
  ausschussTage: 10,
  /** Absolute Mehrheit der Mitglieder (301 von 600): Wiederannahme nach einer Rücksendung (Art. 89) und Sitzmehrheit des Lagers.
   *  Für ein gewöhnliches Gesetz genügt die Mehrheit der Anwesenden (GESETZ_SCHWELLE). */
  mehrheit: 301,
  /** Frist des Präsidenten zum Verkünden oder Zurücksenden (Art. 89: „onbeş gün içinde“) */
  unterschriftTage: 15,
  /** Tage bis zur neuen Beratung nach einer Rücksendung (Spielparameter) */
  rueckgabeTage: 10,
  /** Kapital je gekaufter Stimme */
  kaufKostenProStimme: 0.5,
  /** Anteil des Kapitals, der beim Zurückziehen eines Gesetzes zurückkommt */
  rueckzugAnteil: 0.6,
  /** Ein Erlass kostet mehr Kapital und Vertrauen */
  erlassFaktor: 2,
  /** Allgemeiner Faktor auf alle Kapitalkosten von Änderungen (Kalibrierung der Knappheit) */
  kapitalFaktor: 1.8,
  kapitalMax: 150,
  /**
   * Vier-Preise-Regel (Spielparameter): Standard-Exit-Preis — das Zurücknehmen einer Politik
   * kostet das 1,6-Fache des Einführens, weil Besitzstände, Apparate und Lager sich wehren.
   * Maßnahmen können alle vier Preise einzeln setzen (data/politiknetz.ts, MassnahmePreise).
   */
  streichFaktor: 1.6,
} as const;

/**
 * Abstimmung im Plenum nach Art. 96 der Verfassung (Wortlaut mevzuat.gov.tr, TR-kanun-2709#art=96, abgerufen 06.11.2026): „Türkiye Büyük
 * Millet Meclisi … üye tamsayısının en az üçte biri ile toplanır. … toplantıya katılanların salt çoğunluğu ile karar verir; ancak karar
 * yeter sayısı hiçbir şekilde üye tamsayısının dörtte birinin bir fazlasından az olamaz.“ Also: Quorum 200, mehr Ja als die Hälfte der
 * Anwesenden, mindestens 151 Ja.
 * Die Anwesenheit ist ein Spielparameter: Wer eine Vorlage trägt, erscheint fast vollzählig (96 %), die Gegenseite zu 90 %, mit einer
 * kleinen Streuung je Abstimmung (±3 Punkte, aus Samen und Vorlage, ohne den Zufallsstrom zu berühren).
 */
export const PLENUM = { mitglieder: 600, quorum: 200, mindestJa: 151, anwesendJa: 0.96, anwesendNein: 0.9, streuung: 0.03 } as const;

export interface PlenumErgebnis {
  ja: number;
  nein: number;
  abwesend: number;
  angenommen: boolean;
}

/** Wie eine Abstimmung ausgeht, wenn `unterstuetzer` von 600 Mitgliedern die Vorlage tragen. */
export function plenumAus(unterstuetzer: number, anwesendNein: number = PLENUM.anwesendNein): PlenumErgebnis {
  const u = Math.min(PLENUM.mitglieder, Math.max(0, Math.round(unterstuetzer)));
  const ja = Math.round(u * PLENUM.anwesendJa);
  const nein = Math.round((PLENUM.mitglieder - u) * anwesendNein);
  const anwesend = ja + nein;
  return { ja, nein, abwesend: PLENUM.mitglieder - anwesend, angenommen: anwesend >= PLENUM.quorum && ja * 2 > anwesend && ja >= PLENUM.mindestJa };
}

/** So viele Unterstützer (von 600) braucht ein Gesetz bei üblicher Anwesenheit; daran messen Vorschau, Balken und Urteil. */
export const GESETZ_SCHWELLE: number = (() => {
  for (let x = 0; x <= PLENUM.mitglieder; x++) if (plenumAus(x).angenommen) return x;
  return PLENUM.mitglieder;
})();

/** Die Abstimmung am Tag: Anwesenheit der Gegenseite streut je Vorlage deterministisch. */
export function plenumAbstimmung(world: World, schluessel: string, unterstuetzer: number): PlenumErgebnis {
  const streu = (hashWert(`${world.seed}|${world.day}|${schluessel}|anwesenheit`) - 0.5) * 2 * PLENUM.streuung;
  return plenumAus(unterstuetzer, PLENUM.anwesendNein + streu);
}

/** Kapital je Stufenpunkt Änderung; heikle Themen kosten mehr. */
const GEWICHT_THEMA: Record<string, number> = {
  wirtschaft: 0.2,
  haushalt: 0.28,
  arbeit: 0.2,
  bildung: 0.18,
  gesundheit: 0.18,
  landwirtschaft: 0.18,
  energie: 0.2,
  infrastruktur: 0.15,
  wohnen: 0.2,
  sicherheit: 0.25,
  recht: 0.25,
  militaer: 0.25,
  kultur: 0.15,
  gesellschaft: 0.3,
  aussen: 0.28,
};
const GEWICHT_MASSNAHME: Record<string, number> = {
  m_einkommensteuer: 0.35,
  m_mwst: 0.35,
  m_kraftstoffsteuer: 0.32,
  m_justizreform: 0.35,
  m_internetsperren: 0.4,
  m_medienaufsicht: 0.35,
  m_friedensprozess: 0.4,
  m_religioese_schulen: 0.35,
  m_verteidigung: 0.3,
};

/** Präsidialbeschluss (Art. 73 Abs. 4): sofort und ohne Abstimmung, aber nur in den Grenzen des Gesetzes. Kostet etwas mehr Kapital als
 *  das Gesetz und ein wenig Vertrauen; vor das Verfassungsgericht kommt er nicht (Spielparameter). */
export const BESCHLUSS = { kapitalFaktor: 1.3, vertrauen: -0.5 } as const;

/** Mindestlohnkommission (Arbeitsgesetz Art. 39): Tage vom Ruf des Ministeriums bis zum Beschluss (Spielparameter). */
export const KOMMISSION = { tage: 14 } as const;

export function provinzName(plaka: number): string {
  return PROVINZEN[plaka - 1]?.name ?? `Provinz ${plaka}`;
}

/** „Hatay“, „Hatay und Adana“, „Hatay, Adana und Mersin“, bei vielen „12 Provinzen“. */
export function provinzenText(provinzen: number[] | null | undefined): string {
  if (!provinzen || provinzen.length === 0 || provinzen.length >= PROVINCES) return t("protokoll.ort.land");
  const namen = provinzen.map(provinzName);
  if (namen.length > 4) return t("protokoll.ort.viele", { n: namen.length });
  return t("protokoll.ort.liste", { namen });
}

function ortsListe(provinzen?: number[] | null): number[] | null {
  if (!provinzen || provinzen.length === 0 || provinzen.length >= PROVINCES) return null;
  return [...new Set(provinzen)].filter((p) => p >= 1 && p <= PROVINCES).sort((a, b) => a - b);
}

function anteil(world: World, ort: number[] | null): number {
  if (!ort) return 1;
  return ort.reduce((s, p) => s + world.net.weights[p - 1]!, 0);
}

/**
 * Umfang eines Vorhabens für den politischen Preis: ein fester Sockel (Abstimmung, Apparat) plus ein Teil, der mit dem
 * Bevölkerungsanteil wächst. Ohne Sättigung: Das ganze Land kostet immer mehr als eine Region, und eine Region mehr als eine
 * einzelne Provinz (Spielparameter; vorher zählte schon ein Drittel der Bevölkerung voll, die Region Marmara kostete so viel wie das Land).
 */
export function umfangFaktor(anteilBevoelkerung: number): number {
  return 0.2 + 0.8 * Math.pow(Math.min(1, Math.max(0, anteilBevoelkerung)), 0.8);
}

function knotenIndex(id: string): number {
  const i = NET.index.get(id);
  const node = i === undefined ? undefined : NET.nodes[i];
  if (i === undefined || !node || node.kind !== "massnahme") throw new Error(`Keine Maßnahme: ${id}`);
  return i;
}

/** Bevölkerungsgewichteter Mittelwert der Stufe in den Provinzen (oder im ganzen Land). */
export function stufeIn(world: World, id: string, ort: number[] | null): number {
  if (!ort) return nationalAverage(NET, world.net, id);
  const i = knotenIndex(id);
  let sum = 0;
  let w = 0;
  for (const p of ort) {
    const weight = world.net.weights[p - 1]!;
    sum += world.net.values[i * PROVINCES + p - 1]! * weight;
    w += weight;
  }
  return sum / w;
}

// ---------------------------------------------------------------------------
// Kapazität

/** Maßnahmen, die noch umgesetzt werden, plus Gesetze in der Beratung. */
export function offeneVorhaben(world: World): number {
  const ids = new Set<string>();
  for (const [id, target] of Object.entries(world.net.targets)) {
    if (Math.abs(nationalAverage(NET, world.net, id) - target) > 1) ids.add(id);
  }
  for (const id of Object.keys(world.net.ziele ?? {})) ids.add(id);
  for (const g of world.spiel?.gesetze ?? []) ids.add(g.massnahme);
  return ids.size;
}

export function ueberlast(world: World, zusaetzlich = 0): number {
  const ueber = Math.max(0, offeneVorhaben(world) + zusaetzlich - REGELN.kapazitaet);
  return 1 + REGELN.ueberlastStufe * ueber;
}

// ---------------------------------------------------------------------------
// Parlament

export interface StimmenSicht {
  /** Sitze des Regierungslagers */
  lager: number;
  /** Erwartete Ja-Stimmen ohne Absprachen */
  erwartet: number;
  low: number;
  high: number;
  /** Wie viele Stimmen bis zur Mehrheit der Anwesenden fehlen (erwartet; gemessen an GESETZ_SCHWELLE) */
  luecke: number;
  /** Ja-Stimmen von Fraktionen, die das Lager dulden (schon in „erwartet“ enthalten) */
  duldung: number;
  /** Sitze der duldenden Fraktionen (nicht im Lager) */
  duldungSitze: number;
  /** Ja-Stimmen von Fraktionen, deren Kernforderung dieses Gesetz erfüllt (schon in „erwartet“ enthalten) */
  sach: number;
  /** Welche Fraktionen aus diesem Grund mitstimmen */
  sachParteien: string[];
}

/** `gesetz` (Maßnahme und Richtung der Änderung) macht die Rechnung inhaltsbezogen: Fraktionen stimmen für das, was sie wollen. */
export function stimmenSicht(world: World, gesetz?: { massnahme: string; richtung: number }): StimmenSicht {
  const parl = world.parliament;
  const player = world.player;
  if (!parl || !player) return { lager: 600, erwartet: 600, low: 590, high: 600, luecke: 0, duldung: 0, duldungSitze: 0, sach: 0, sachParteien: [] };
  const parteien = [player.partei.kurz, ...(world.spiel?.lager ?? [])];
  const lager = parteien.reduce((s, p) => s + (parl.seats[p] ?? 0), 0);
  const dul = duldung(world);
  const sach = sachstimmen(world, gesetz?.massnahme, gesetz?.richtung ?? 0);
  const gegner = 600 - lager - dul.sitze - sach.sitze;
  const zustimmung = world.spiel?.umfrage.zustimmung ?? 50;
  // Ein Teil der Opposition stimmt mit, wenn der Präsident im Land beliebt ist
  const uebertritt = clamp(0.04 + (0.22 * (zustimmung - 35)) / 40, 0.02, 0.3);
  // Linie (sim/linie.ts): Was gegen die Linie einer Lagerpartei geht, stimmt ein Teil ihrer Sitze nicht mit; was zu einer Oppositionspartei
  // passt, gewinnt einen Teil ihrer Stimmen. Ohne Angabe des Gesetzes bleibt die Rechnung wie früher (alle Lagersitze stimmen mit).
  let lagerJa = lager;
  let oppositionJa = 0;
  if (gesetz && gesetz.richtung !== 0) {
    lagerJa = parteien.reduce((s, p) => s + Math.round((parl.seats[p] ?? 0) * jaAnteilLager(world, p, gesetz.massnahme, gesetz.richtung)), 0);
    for (const [partei, sitze] of Object.entries(parl.seats)) {
      if (parteien.includes(partei) || dul.parteien.includes(partei) || sach.parteien.includes(partei)) continue;
      oppositionJa += Math.round(sitze * jaAnteilOpposition(partei, gesetz.massnahme, gesetz.richtung));
    }
  }
  const erwartet = Math.min(600, lagerJa + dul.ja + sach.ja + Math.round(gegner * uebertritt) + oppositionJa);
  // Ist der Präsident angespannt, streut die Schätzung breiter: Das Konto der Aufmerksamkeit wirkt auf die Vorschau
  const band = Math.round((8 + Math.round(gegner * 0.02)) * unsicherheitFaktor(world));
  return { lager, erwartet, low: erwartet - band, high: Math.min(600, erwartet + band), luecke: Math.max(0, GESETZ_SCHWELLE - erwartet), duldung: dul.ja, duldungSitze: dul.sitze, sach: sach.ja, sachParteien: sach.parteien };
}

// ---------------------------------------------------------------------------
// Prüfen

/** Die benannte Fassung, als die eine Änderung gilt (ENTSCHEIDUNGEN W, F4): Bonus, Erlassrecht und Sperren aus dem Gesetzeskatalog.
 *  Gerechnet in sim/gesetzgebung.ts und hier über einen Haken eingehängt, damit beide Module sich nicht gegenseitig laden. */
export interface FassungsInfo {
  vorhaben: string;
  fassung: FassungId;
  /** Stimmen, die die Fassung holt oder kostet (Opposition, Lager, Absprung der Partner) */
  bonus: number;
  /** Name des Gesetzes („Mindestlohngesetz“) */
  titel: string;
  /** Ob der Katalog einen Erlass zulässt (anfechtbar, ohne Grundrechte) */
  erlassErlaubt: boolean;
  /** Wahrscheinlichkeit, dass das Verfassungsgericht einen Erlass aufhebt (0, wenn niemand klagen darf) */
  gerichtP: number;
  /** Sperre aus dem Katalog: ruht nach einer Entscheidung, liegt beim Verfassungsgericht (G6) */
  grund?: string;
}

type FassungsRechner = (world: World, id: string, ziel: number, ort: number[] | null, wahl?: FassungId) => FassungsInfo | undefined;
let fassungsRechner: FassungsRechner | undefined;
export function setzeFassungsRechner(fn: FassungsRechner): void {
  fassungsRechner = fn;
}

/** Was nach dem Einbringen einer Fassung geschieht: als Gesetz die Ausgangsstufe merken, als Erlass Folgen und Prüfung (sim/gesetzgebung.ts). */
interface FassungsFolgen {
  eingebracht: (world: World, g: Gesetz, alteStufe: number) => void;
  erlassen: (world: World, pr: Pruefung, alteStufe: number) => Ergebnis;
}
let fassungsFolgen: FassungsFolgen | undefined;
export function setzeFassungsFolgen(f: FassungsFolgen): void {
  fassungsFolgen = f;
}

export interface Pruefung {
  ok: boolean;
  grund?: string;
  massnahme: string;
  name: string;
  stufe: number;
  provinzen: number[] | null;
  /** Mittlere Änderung in Stufenpunkten über die betroffenen Provinzen */
  aenderung: number;
  monate: number;
  /** Jährliche Kosten der Änderung in % des BIP (negativ = Einnahmen) */
  kostenBip: number;
  ueberlast: number;
  offen: number;
  kapital: number;
  gesetz: { pk: number; stimmen: StimmenSicht; tage: number; bezahlbar: boolean };
  /** Der schnelle Weg: Präsidialerlass (Art. 104 Abs. 17) oder, bei Sätzen, Präsidialbeschluss (Art. 73 Abs. 4) */
  erlass: { moeglich: boolean; pk: number; grund?: string; bezahlbar: boolean; art: "erlass" | "beschluss" };
  /** Welcher Rechtsweg die Änderung trägt (data/rechtswege.ts). „kommission“: Der Gesetzesknopf gibt der Mindestlohnkommission eine
   *  Vorgabe; „notstand“: nur über das Ausrufen des Ausnahmezustands (sim/notstand.ts). */
  rechtsweg: Rechtsweg;
  hinweise: string[];
  /** Aktive Krisen, die dieses Vorhaben treffen (MIL-3); bei „gesperrt" steht die Begründung mit Ausweg in „grund" */
  krisen: KrisenTreffer[];
  /** Multiplikator auf die Kapitalkosten aus Krisen („teuer"); 1 = keine Wirkung */
  krisenFaktor: number;
  /** Die vier Preise mit aufgelösten Defaults und der Preis, der bei diesem Vorhaben greift */
  preise: { einfuehren: number; aendern: number; streichen: number; unterhaltMonat: number; richtung: "einfuehren" | "streichen" };
  /** Hat die Maßnahme einen Eintrag im Gesetzeskatalog, gilt die Änderung als dessen Fassung (Stimmen enthalten den Bonus) */
  fassung?: FassungsInfo;
}

function pkKosten(world: World, id: string, delta: number, ort: number[] | null, weg: Weg): number {
  const node = NET.nodes[knotenIndex(id)]!;
  const gewicht = GEWICHT_MASSNAHME[id] ?? GEWICHT_THEMA[node.theme] ?? 0.2;
  const share = anteil(world, ort);
  const ortsfaktor = ort ? umfangFaktor(share) : 1;
  const rabatt = 1 - rabattFuer(world, node.theme);
  const preise = preisFaktoren(node);
  // Vier-Preise-Regel: Erhöhen zahlt den Einführungspreis, Senken den Exit-Preis
  const richtungsfaktor = preise.aendern * (delta >= 0 ? preise.einfuehren : preise.streichen);
  // Linie der eigenen Partei: mit ihr billiger, gegen sie teurer (Kurswechsel)
  const linie = linienFaktor(world, id, delta);
  const basis = Math.abs(delta) * gewicht * REGELN.kapitalFaktor * ortsfaktor * rabatt * richtungsfaktor * linie * (weg === "erlass" ? REGELN.erlassFaktor : 1);
  return Math.max(2, Math.round(basis));
}

/**
 * Die vier Preise einer Maßnahme mit aufgelösten Defaults (Spielparameter, keine Tatsachen):
 * einfuehren und aendern kosten wie bisher, streichen kostet standardmäßig das 1,6-Fache des
 * Einführens (Exit-Preis), Unterhalt fällt nur an, wenn die Maßnahme ihn ausdrücklich trägt.
 */
export function preisFaktoren(node: Pick<NodeSpec, "preise">): { einfuehren: number; aendern: number; streichen: number; unterhaltMonat: number } {
  const p = node.preise ?? {};
  const einfuehren = p.einfuehren ?? 1;
  return {
    einfuehren,
    aendern: p.aendern ?? 1,
    streichen: p.streichen ?? REGELN.streichFaktor * einfuehren,
    unterhaltMonat: p.unterhalt_monat ?? 0,
  };
}

/** Referenzpreise für die Anzeige an der Maßnahme: was kosten ±10 Stufen auf dem gewählten Weg, was kostet der Unterhalt. */
export function preisUebersicht(
  world: World,
  id: string,
  ort: number[] | null,
): { einfuehren10: number; streichen10: number; unterhaltMonat: number; faktorEinfuehren: number; faktorStreichen: number } {
  const node = NET.nodes[knotenIndex(id)]!;
  const preise = preisFaktoren(node);
  const krisenFaktor = world.spiel ? krisenFuerMassnahme(world, id).reduce((f, k) => (k.art === "teuer" ? f * k.faktor : f), 1) : 1;
  const einfuehren10 = Math.max(2, Math.round(pkKosten(world, id, 10, ort, "gesetz") * krisenFaktor));
  const streichen10 = Math.max(2, Math.round(pkKosten(world, id, -10, ort, "gesetz") * krisenFaktor));
  return { einfuehren10, streichen10, unterhaltMonat: preise.unterhaltMonat, faktorEinfuehren: preise.aendern * preise.einfuehren, faktorStreichen: preise.aendern * preise.streichen };
}

export interface UnterhaltPosten {
  id: string;
  name: string;
  /** Abzug in Politischem Kapital in diesem Monat */
  betrag: number;
  stufe: number;
}

/** Laufender Unterhalt aller Maßnahmen mit `unterhalt_monat`, anteilig zur aktuellen Stufe. */
export function unterhaltKosten(world: World): { summe: number; posten: UnterhaltPosten[] } {
  const posten: UnterhaltPosten[] = [];
  for (const node of NET.nodes) {
    const u = node.preise?.unterhalt_monat;
    if (node.kind !== "massnahme" || !u) continue;
    const stufe = nationalAverage(NET, world.net, node.id);
    if (stufe < 0.5) continue;
    posten.push({ id: node.id, name: node.name, betrag: (u * stufe) / 100, stufe });
  }
  return { summe: posten.reduce((s, p) => s + p.betrag, 0), posten };
}

/** Die Schätzung mit dem Bonus einer Fassung (Spanne und Lücke verschieben sich mit). */
function mitBonus(st: StimmenSicht, bonus: number): StimmenSicht {
  if (!bonus) return st;
  const z = (x: number) => Math.min(600, Math.max(0, x + bonus));
  const erwartet = z(st.erwartet);
  return { ...st, erwartet, low: z(st.low), high: z(st.high), luecke: Math.max(0, GESETZ_SCHWELLE - erwartet) };
}

/** Ob ein schneller Weg (Erlass oder Beschluss) die Änderung in diese Richtung tragen darf. */
export function erlassMoeglich(id: string, richtung = 1, ziel = 50): boolean {
  const node = NET.nodes[knotenIndex(id)]!;
  const w = rechtswegVon(node, richtung, ziel);
  return w === "erlass" || w === "beschluss";
}

export function pruefeVorhaben(world: World, id: string, stufe: number, provinzen?: number[] | null, wahl?: FassungId): Pruefung {
  const i = knotenIndex(id);
  const node = NET.nodes[i]!;
  const ort = ortsListe(provinzen);
  const ziel = clamp(Math.round(stufe), 0, 100);
  const aktuell = stufeIn(world, id, ort);
  const aenderung = ziel - aktuell;
  const share = anteil(world, ort);

  // Kosten: Änderung je Provinz, nach Bevölkerung gewichtet
  let kostenBip = 0;
  const liste = ort ?? Array.from({ length: PROVINCES }, (_, p) => p + 1);
  for (const p of liste) {
    kostenBip += (world.net.weights[p - 1]! * (ziel - world.net.values[i * PROVINCES + p - 1]!) * (node.cost ?? 0)) / 100;
  }

  const offen = offeneVorhaben(world);
  const ueberl = ueberlast(world, 1);
  const kapital = world.spiel?.kapital ?? Infinity;
  const roh = stimmenSicht(world, { massnahme: id, richtung: Math.sign(aenderung) });
  // Eine Stimmenzahl überall (G3): Gilt die Änderung als Fassung eines Katalogeintrags, zählt deren Bonus schon hier
  const fassung = world.spiel ? fassungsRechner?.(world, id, ziel, ort, wahl) : undefined;
  const stimmen = fassung ? mitBonus(roh, fassung.bonus) : roh;
  // Krisen-Blocker (MIL-3): gesperrte Vorhaben scheitern unten mit Begründung und Ausweg, verteuerte zahlen den Faktor
  const krisen = world.spiel ? krisenFuerMassnahme(world, id) : [];
  const krisenFaktor = krisen.reduce((f, k) => (k.art === "teuer" ? f * k.faktor : f), 1);
  const pkGesetz = Math.max(2, Math.round(pkKosten(world, id, aenderung, ort, "gesetz") * krisenFaktor));
  const pkErlass = Math.max(2, Math.round(pkKosten(world, id, aenderung, ort, "erlass") * krisenFaktor));
  const pkBeschluss = Math.max(2, Math.round(pkGesetz * BESCHLUSS.kapitalFaktor));
  const hinweise: string[] = [];
  // Die Linie der Partei sichtbar machen: Der Preis steht im Kapital, die Reaktion der Partner folgt nach dem Beschluss (sim/linie.ts)
  const linie = linienFaktor(world, id, aenderung);
  if (linie <= 0.93) hinweise.push(t("linie.hinweis.mit", { prozent: Math.round((1 - linie) * 100) }));
  else if (linie >= 1.12) hinweise.push(t("linie.hinweis.gegen", { prozent: Math.round((linie - 1) * 100) }));
  const rechtsweg = rechtswegVon(node, Math.sign(aenderung), ziel);
  if (ueberl > 1) hinweise.push(t("n4.hw.ueberlast", { n: offen, prozent: Math.round((ueberl - 1) * 100) }));
  if (stimmen.luecke > 0 && rechtsweg !== "kommission") hinweise.push(t("n4.hw.luecke", { n: stimmen.luecke }));
  if (ort && share < 0.05) hinweise.push(t("n4.hw.kleinerOrt"));
  if (ort) {
    const prozent = share * 100;
    hinweise.push(t(prozent < 1 ? "n4.hw.umfangKlein" : "n4.hw.umfang", { prozent: zahl(Math.round(prozent)), preis: Math.round(umfangFaktor(share) * 100), bip: zahl(kostenBip, 3) }));
  }
  for (const k of krisen) {
    if (k.art === "teuer") hinweise.push(`${k.krise.name}: ${k.krise.wirkung}`);
  }
  // Vier-Preise-Regel: Der Exit-Preis und der laufende Unterhalt stehen von Anfang an auf dem Preisschild.
  const preise = preisFaktoren(node);
  const richtung: "einfuehren" | "streichen" = aenderung >= 0 ? "einfuehren" : "streichen";
  if (aenderung < 0 && preise.streichen > preise.einfuehren) {
    hinweise.push(t("n4.hw.ruecknahme", { f: zahl(preise.streichen / preise.einfuehren, 1) }));
  }
  if (preise.unterhaltMonat > 0) {
    hinweise.push(t("n4.hw.dauerlast", { n: zahl(preise.unterhaltMonat, 1) }));
  }

  const base: Pruefung = {
    ok: true,
    massnahme: id,
    name: node.name,
    stufe: ziel,
    provinzen: ort,
    aenderung,
    monate: Math.max(1, Math.ceil((node.months ?? 1) * ueberl)),
    kostenBip,
    ueberlast: ueberl,
    offen,
    kapital,
    gesetz: { pk: pkGesetz, stimmen, tage: rechtsweg === "kommission" ? KOMMISSION.tage : REGELN.tageBisAbstimmung, bezahlbar: kannZahlen(kapital, pkGesetz) },
    // Der Rechtsweg (data/rechtswege.ts) geht vor: Haushaltsgeld nie per Erlass, Sätze per Beschluss. Sonst entscheidet ein Katalogeintrag
    // (er kennt Art. 104 Abs. 17 je Vorhaben), dann die Themenregel.
    erlass: rechtsweg === "beschluss"
      ? { moeglich: true, pk: pkBeschluss, bezahlbar: kannZahlen(kapital, pkBeschluss), art: "beschluss" }
      : rechtsweg === "haushalt"
      ? { moeglich: false, pk: pkErlass, bezahlbar: false, grund: t("n4.weg.grund.haushalt"), art: "erlass" }
      : rechtsweg === "kommission" || rechtsweg === "notstand"
      ? { moeglich: false, pk: pkErlass, bezahlbar: false, grund: t(`n4.weg.grund.${rechtsweg}`), art: "erlass" }
      : fassung && !fassung.erlassErlaubt
      ? { moeglich: false, pk: pkErlass, bezahlbar: false, grund: t("gesetz.grund.keinErlass"), art: "erlass" }
      : fassung || rechtsweg === "erlass"
      ? { moeglich: true, pk: pkErlass, bezahlbar: kannZahlen(kapital, pkErlass), art: "erlass" }
      : { moeglich: false, pk: pkErlass, bezahlbar: false, grund: t("n4.weg.grund.gesetz"), art: "erlass" },
    rechtsweg,
    hinweise,
    krisen,
    krisenFaktor,
    preise: { ...preise, richtung },
    ...(fassung ? { fassung } : {}),
  };
  if (Math.abs(aenderung) < 1) return { ...base, ok: false, grund: t("n4.grund.schonDa") };
  // Art. 119: Ab den Notstandsdekreten führt der Weg nur über das Ausrufen des Ausnahmezustands (sim/notstand.ts)
  if (rechtsweg === "notstand") return { ...base, ok: false, grund: t("n4.weg.grund.notstand") };
  if (fassung?.grund) return { ...base, ok: false, grund: fassung.grund };
  // Eine Sperre durch eine aktive Krise ist eine ehrliche Ablehnung: Grund und Alternativweg stehen immer dabei.
  const gesperrt = krisen.find((k) => k.art === "gesperrt");
  if (gesperrt) return { ...base, ok: false, grund: `${gesperrt.krise.name}: ${gesperrt.krise.grund} ${gesperrt.ausweg ?? ""}`.trim() };
  return base;
}

// ---------------------------------------------------------------------------
// Anwenden

function wendeAn(world: World, id: string, level: number, provinzen: number[] | null): void {
  const i = knotenIndex(id);
  const node = NET.nodes[i]!;
  const ort = ortsListe(provinzen);
  const target = clamp(Math.round(level), 0, 100);
  const months = Math.max(1, (node.months ?? 1) * ueberlast(world));
  const vorher = stufeIn(world, id, ort);
  const s = world.net;
  beobachte(world, id, vorher, target, ort);

  if (!ort) {
    s.targets[id] = target;
    s.steps[id] = Math.max(Math.abs(target - nationalAverage(NET, s, id)) / months, 0.01);
    if (s.ziele) delete s.ziele[id];
    if (s.schritte) delete s.schritte[id];
  } else {
    s.ziele ??= {};
    s.schritte ??= {};
    const arr = (s.ziele[id] ??= new Array(PROVINCES).fill(-1));
    const st = (s.schritte[id] ??= new Array(PROVINCES).fill(100));
    // Ein bestehendes Landesziel gilt für die übrigen Provinzen weiter
    if (s.targets[id] !== undefined) {
      for (let p = 0; p < PROVINCES; p++) {
        if (!ort.includes(p + 1) && arr[p]! < 0) {
          arr[p] = s.targets[id]!;
          st[p] = s.steps[id] ?? 100;
        }
      }
      delete s.targets[id];
      delete s.steps[id];
    }
    for (const p of ort) {
      arr[p - 1] = target;
      st[p - 1] = Math.max(Math.abs(target - s.values[i * PROVINCES + p - 1]!) / months, 0.01);
    }
  }

  // INN-2: Der Beschluss startet die sichtbare Umsetzung (oder dämpft sie bei einer
  // Feinjustierung um höchstens eine Stufe); bis sie läuft, wirken die ausgehenden
  // Kanten nur anteilig (sim/umsetzung.ts). Gemessen wird gegen den Stand beim Beschluss.
  starteUmsetzung(NET, s, id, target - vorher, months);

  // Zusagen an Fraktionen und Figuren, die diese Änderung verlangen
  const richtung = Math.sign(target - vorher);
  for (const z of world.spiel?.zusagen ?? []) {
    if (z.erfuellt || z.gebrochen || z.massnahme !== id || !z.richtung) continue;
    Object.assign(z, zusageStufen(world, z));
    // Eine Teiländerung oder ein regionaler Beschluss löst keine landesweite Zusage ein.
    if (!ort && zusageZielErreicht(z, target) && erfuelleZusage(world, z)) {
      addLog(world, "ereignis", `Zusage erfüllt: ${z.text}`, t("zusage.gesetz.beschlossen"));
    }
  }
  reagiereFiguren(world, node.theme, id, richtung);
  // Die Parteien des Lagers messen die Änderung an ihrer Linie
  reagierePartner(world, id, richtung, Math.abs(target - vorher));
  reagiereStamm(world, id, richtung, Math.abs(target - vorher));
}

/**
 * Direkte Anwendung ohne Kapital und Abstimmung. Für Tests, den Kern und Fälle ohne Spielschleife;
 * die Oberfläche geht über `bringeEin`.
 */
export function setPolicy(world: World, id: string, level: number, provinzen?: number[] | null): void {
  const i = knotenIndex(id);
  const node = NET.nodes[i]!;
  const ort = ortsListe(provinzen);
  const target = clamp(Math.round(level), 0, 100);
  const current = stufeIn(world, id, ort);
  const months = node.months ?? 1;
  let costChange = 0;
  for (const p of ort ?? Array.from({ length: PROVINCES }, (_, k) => k + 1)) {
    costChange += (world.net.weights[p - 1]! * (target - world.net.values[i * PROVINCES + p - 1]!) * (node.cost ?? 0)) / 100;
  }
  wendeAn(world, id, target, ort);
  addLog(
    world,
    "entscheidung",
    t("n4.log.gesetzt", { name: node.name, ort: provinzenText(ort), von: stufenName(id, current), nach: stufenName(id, target) }),
    t(Math.abs(costChange) >= 0.0005 ? (costChange > 0 ? "n4.log.gesetztKostet" : "n4.log.gesetztBringt") : "n4.log.gesetztWarum", { text: node.text, monate: months, bip: fmt(Math.abs(costChange)) }),
  );
}

/** Wird nach jedem erfolgreich eingebrachten Vorhaben aufgerufen (Ereignisse schließen sich, wenn der Spieler die Ursache selbst regelt). */
let nachEinbringen: ((world: World, massnahmeId: string, text: string) => void) | null = null;
export function setzeEinbringHaken(fn: (world: World, massnahmeId: string, text: string) => void): void {
  nachEinbringen = fn;
}

export interface Ergebnis {
  ok: boolean;
  text: string;
  why?: string;
}

/** Ein Vorhaben einbringen: als Gesetz (die eigene Fraktion bringt es auf Bitte des Präsidenten ein, Art. 88), als Erlass oder
 *  Präsidialbeschluss, beim Mindestlohn als Vorgabe an die Kommission (data/rechtswege.ts). */
export function bringeEin(world: World, id: string, stufe: number, provinzen: number[] | null | undefined, weg: Weg, wahl?: FassungId): Ergebnis {
  const pr = pruefeVorhaben(world, id, stufe, provinzen, wahl);
  if (!pr.ok) return { ok: false, text: pr.grund ?? t("n4.grund.nichtMoeglich") };
  const spiel = world.spiel;
  if (!spiel) {
    setPolicy(world, id, stufe, provinzen);
    const l = world.log[world.log.length - 1]!;
    return { ok: true, text: l.text, why: l.why };
  }
  if (spiel.ende) return { ok: false, text: t("n4.grund.ende") };
  const pause = neuanfangGrund(world);
  if (pause) return { ok: false, text: pause };

  if (weg === "erlass") {
    if (!pr.erlass.moeglich) return { ok: false, text: pr.erlass.grund!, why: t("n4.grund.wegeStattVerbote") };
    if (!pr.erlass.bezahlbar) return { ok: false, text: t(pr.erlass.art === "beschluss" ? "n4.grund.kapitalBeschluss" : "n4.grund.kapitalErlass", { n: pr.erlass.pk, da: Math.floor(spiel.kapital) }) };
    spiel.kapital -= pr.erlass.pk;
    verbrauche(world, AUFMERKSAMKEIT_KOSTEN.erlass, pr.name);
    const vorErlass = stufeIn(world, id, ortsListe(pr.provinzen));
    setPolicy(world, id, pr.stufe, pr.provinzen);
    politikGeaendert(world, id, vorErlass, pr.stufe);
    const l = world.log[world.log.length - 1]!;
    if (pr.erlass.art === "beschluss") {
      // Art. 73 Abs. 4: in den Grenzen des Gesetzes, ohne Normenkontrolle; kostet wenig Vertrauen
      vertrauenAendern(world, BESCHLUSS.vertrauen);
      const text = t("n4.beschluss.text", { name: pr.name, von: stufenName(id, vorErlass), nach: stufenName(id, pr.stufe) });
      const why = t("n4.beschluss.warum", { pk: pr.erlass.pk });
      l.text = text;
      l.why = why;
      nachEinbringen?.(world, id, text);
      return { ok: true, text, why };
    }
    vertrauenAendern(world, -(1 + Math.abs(pr.aenderung) / 40));
    nachEinbringen?.(world, id, t("n4.erlass.angeordnet", { text: l.text }));
    // Eine Fassung des Katalogs: Verbände, Straße und Verfassungsgericht folgen (sim/gesetzgebung.ts)
    if (pr.fassung && fassungsFolgen) return fassungsFolgen.erlassen(world, pr, vorErlass);
    return { ok: true, text: t("n4.erlass.text", { text: l.text }), why: t("n4.erlass.warum", { why: l.why ?? "", pk: pr.erlass.pk }) };
  }

  if (!pr.gesetz.bezahlbar) return { ok: false, text: t("n4.grund.kapitalGesetz", { n: pr.gesetz.pk, da: Math.floor(spiel.kapital) }), why: t("n4.grund.kapitalWarum") };
  if (spiel.gesetze.some((g) => g.massnahme === id)) return { ok: false, text: t("n4.grund.schonImParlament", { name: pr.name }) };
  spiel.kapital -= pr.gesetz.pk;
  verbrauche(world, AUFMERKSAMKEIT_KOSTEN.gesetz, pr.name);
  const kommission = pr.rechtsweg === "kommission";
  // Ist der Präsident angespannt, verzögert sich die Einbringung mitunter um ein paar Tage
  const verzug = stufeVon(verfassungVon(world).belastung) >= 1 && hashWert(`${world.seed}|${world.day}|${id}|verzug`) < VERFASSUNG.verzugChance ? VERFASSUNG.verzugTage : 0;
  const tag = world.day + (kommission ? KOMMISSION.tage : REGELN.tageBisAbstimmung) + verzug;
  const alteStufe = stufeIn(world, id, ortsListe(pr.provinzen));
  const fas = pr.fassung;
  const name = fas ? `${fas.titel} · ${t(`gesetz.fassung.${fas.fassung}`)}` : pr.name;
  const gesetz: Gesetz = {
    id: `g-${world.day}-${id}`,
    massnahme: id,
    name,
    stufe: pr.stufe,
    provinzen: pr.provinzen,
    eingebracht: world.day,
    abstimmung: tag,
    pk: pr.gesetz.pk,
    absprachen: 0,
    richtung: Math.sign(pr.aenderung),
    ...(kommission ? { weg: "kommission" as const } : { ausschussBis: world.day + REGELN.ausschussTage + verzug, ausschuss: "offen" as const }),
    ...(fas ? { vorhaben: fas.vorhaben, fassung: fas.fassung, stimmenBonus: fas.bonus } : {}),
  };
  spiel.gesetze.push(gesetz);
  if (fas) fassungsFolgen?.eingebracht(world, gesetz, alteStufe);
  // Dieselbe Fristregel für jeden Zugangsweg, auch ohne bereits offene Erinnerung.
  // Nur ein landesweiter Entwurf zum festen Zusagenziel begründet die Beratungszeit.
  for (const z of spiel.zusagen) {
    if (z.erfuellt || z.gebrochen || z.abgeschlossen !== undefined || z.massnahme !== id || !z.richtung) continue;
    Object.assign(z, zusageStufen(world, z));
    if (pr.provinzen?.length || !zusageZielErreicht(z, pr.stufe)) continue;
    const vorher = z.faellig;
    z.faellig = Math.max(vorher, tag + 15);
    schliesseZusageErinnerung(world, z);
    if (z.faellig !== vorher) addLog(world, "ereignis", t("zusage.gesetz.fristLog", {
      zusage: z.text, datum: formatDateDe(addDays(world.date, z.faellig - world.day)),
      votum: formatDateDe(addDays(world.date, tag - world.day)),
    }));
  }
  const datum = formatDateDe(addDays(world.date, tag - world.day));
  const ziel = stufenName(id, pr.stufe);
  const text = kommission
    ? t("n4.kommission.einberufen", { name: pr.name, ziel, datum })
    : t("n4.gesetz.eingebracht", { name, ort: provinzenText(pr.provinzen), ziel, datum, ausschuss: REGELN.ausschussTage, monate: pr.monate });
  const why = (kommission
    ? t("n4.kommission.warum", { pk: pr.gesetz.pk })
    : t("n4.gesetz.eingebrachtWarum", { pk: pr.gesetz.pk, ja: pr.gesetz.stimmen.erwartet, tief: pr.gesetz.stimmen.low, hoch: pr.gesetz.stimmen.high, noetig: GESETZ_SCHWELLE }))
    + (verzug > 0 ? ` ${t("n4.gesetz.verzug")}` : "");
  addLog(world, "entscheidung", text, why);
  nachEinbringen?.(world, id, text);
  return { ok: true, text, why };
}

/** In welchem Schritt ein Gesetz steht: Ausschuss, Plenum, Kommission, bei Rücksendung die neue Beratung. */
export type GesetzPhase = "ausschuss" | "plenum" | "kommission" | "rueckgabe";
export function gesetzPhase(world: World, g: Gesetz): GesetzPhase {
  if (g.weg === "kommission") return "kommission";
  if (g.rueckgabe) return "rueckgabe";
  return g.ausschussBis !== undefined && world.day < g.ausschussBis ? "ausschuss" : "plenum";
}

/** Wie es um ein laufendes Gesetz steht und was Absprachen bis zur Mehrheit kosten würden. */
export interface GesetzSicht {
  /** Erwartete Ja-Stimmen einschließlich Absprachen */
  ja: number;
  /** Fehlende Stimmen bis zur Mehrheit (0 = Mehrheit steht) */
  luecke: number;
  /** Nötige Unterstützer: Mehrheit der Anwesenden (GESETZ_SCHWELLE), nach einer Rücksendung die Mitgliedermehrheit (Art. 89) */
  schwelle: number;
  /** Stimmen, die bis zu einer sicheren Mehrheit (mit Puffer) zu kaufen wären */
  noetig: number;
  kosten: number;
  bezahlbar: boolean;
  /** Ohne Verhandlungen und mit dem vorhandenen Kapital nicht zu retten */
  aussichtslos: boolean;
  urteil: "sicher" | "knapp" | "verloren";
  /** Fraktionen, die nur wegen des Inhalts mitstimmen */
  sachParteien: string[];
}

/** Puffer über der Mehrheit, damit die Streuung der Abstimmung nicht alles kippt. */
export const STIMMEN_PUFFER = 8;

export function gesetzRichtung(world: World, g: Gesetz): number {
  return g.richtung ?? Math.sign(g.stufe - stufeIn(world, g.massnahme, g.provinzen));
}

export function gesetzSicht(world: World, g: Gesetz): GesetzSicht {
  const sicht = stimmenSicht(world, { massnahme: g.massnahme, richtung: gesetzRichtung(world, g) });
  return mehrheitsSicht(world, sicht.erwartet + g.absprachen + (g.stimmenBonus ?? 0), sicht.sachParteien, schwelleFuer(g));
}

/** Nach einer Rücksendung braucht die unveränderte Wiederannahme die absolute Mehrheit der Mitglieder (Art. 89), sonst Art. 96.
 *  Die Mitgliedermehrheit zählt anwesende Ja-Stimmen; umgerechnet auf Unterstützer liegt sie über 301. */
export function schwelleFuer(g?: Pick<Gesetz, "rueckgabe">): number {
  return g?.rueckgabe ? Math.ceil(REGELN.mehrheit / PLENUM.anwesendJa) : GESETZ_SCHWELLE;
}

function mehrheitsSicht(world: World, erwartet: number, sachParteien: string[], schwelle = GESETZ_SCHWELLE): GesetzSicht {
  const ja = Math.min(600, Math.max(0, erwartet));
  const luecke = Math.max(0, schwelle - ja);
  const noetig = ja >= schwelle + STIMMEN_PUFFER ? 0 : schwelle + STIMMEN_PUFFER - ja;
  const kosten = Math.ceil(noetig * REGELN.kaufKostenProStimme);
  const kapital = world.spiel?.kapital ?? 0;
  const bezahlbar = kannZahlen(kapital, kosten);
  const urteil = ja >= schwelle + STIMMEN_PUFFER ? "sicher" : luecke > 0 && !bezahlbar ? "verloren" : "knapp";
  return { ja, luecke, schwelle, noetig, kosten, bezahlbar, aussichtslos: luecke > 0 && !bezahlbar, urteil, sachParteien };
}

/** Nur bekannte Fristen fortschreiben, keine künftigen Entscheidungen oder Monatsfolgen simulieren. */
export function gesetzWeltAmVotum(world: World, g: Pick<Gesetz,"abstimmung">): World {
  const day = Math.max(world.day, g.abstimmung);
  return day === world.day ? world : { ...world, day, date: addDays(world.date, day - world.day) };
}

/** Gemeinsame Vorschau laufender Gesetze; tatsächliche Abstimmungen rechnen weiterhin am jeweiligen Spieltag. */
export function gesetzPrognose(world: World, g: Gesetz) {
  return stimmenPrognose(world,g.abstimmung,g.absprachen+(g.stimmenBonus??0),{massnahme:g.massnahme,richtung:gesetzRichtung(world,g)},schwelleFuer(g));
}

/** Auch Haushaltsgesetze verwenden dieselben Fristen, Grenzen und Preise; ohne inhaltliche Sachstimmen. */
/** Der Haushalt zählt (noch) gegen die Mitgliedermehrheit von 301 (sim/haushalt.ts, Bereich N3); gewöhnliche Gesetze geben
 *  GESETZ_SCHWELLE mit (gesetzPrognose). */
export function stimmenPrognose(world:World, abstimmung:number, zusatz=0, vorhaben?:{massnahme:string;richtung:number}, schwelle:number=REGELN.mehrheit) {
  const stand = gesetzWeltAmVotum(world, {abstimmung});
  const heute = stimmenSicht(world,vorhaben);
  const basis = stimmenSicht(stand,vorhaben);
  const votum = mehrheitsSicht(world,basis.erwartet+zusatz,basis.sachParteien,schwelle);
  const heuteJa = Math.min(600,Math.max(0,heute.erwartet+zusatz));
  const auslaufend = duldung(world).parteien.flatMap(partei => {
    const bis = world.spiel?.fraktionen?.[partei]?.duldungBis;
    const sitze = world.parliament?.seats[partei] ?? 0;
    return bis !== undefined && bis <= stand.day && sitze > 0
      ? [{ partei, sitze, tag: bis, datum: addDays(world.date, bis - world.day) }] : [];
  }).sort((a,b) => a.tag - b.tag || a.partei.localeCompare(b.partei));
  return { ...votum, tag: stand.day, datum: stand.date, heuteJa, fristDelta: votum.ja - heuteJa, auslaufend };
}

/** Ein Gesetz vor der Abstimmung zurückziehen: ein Teil des Kapitals kommt zurück, gekaufte Stimmen sind verloren. */
export function zieheGesetzZurueck(world: World, gesetzId: string): Ergebnis {
  const spiel = world.spiel;
  const g = spiel?.gesetze.find((x) => x.id === gesetzId);
  if (!spiel || !g) return { ok: false, text: t("n4.grund.nichtMehrDa") };
  const zurueck = Math.floor(g.pk * REGELN.rueckzugAnteil);
  spiel.gesetze = spiel.gesetze.filter((x) => x.id !== gesetzId);
  spiel.kapital = Math.min(REGELN.kapitalMax, spiel.kapital + zurueck);
  const text = t("n4.rueckzug.text", { name: g.name });
  const why = t("n4.rueckzug.warum", { zurueck, pk: g.pk });
  addLog(world, "entscheidung", text, why);
  return { ok: true, text, why };
}

/** Stimmen für ein laufendes Gesetz gewinnen: nicht mehr anonym, sondern über benannte Abgeordnete mit Preis und Risiko
 *  (befund-B B-10, sim/fraktionen-absprachen.ts). Wer eine Zahl verlangt (Chat, Ressortvorlagen), bekommt die günstigsten
 *  Angebote, bis die Zahl erreicht ist. */
export function stimmenKaufen(world: World, gesetzId: string, anzahl: number): Ergebnis {
  const spiel = world.spiel;
  const g = spiel?.gesetze.find((x) => x.id === gesetzId);
  if (!spiel || !g) return { ok: false, text: t("n4.grund.nichtMehrDa") };
  if (!absprachenHaken) return { ok: false, text: t("n4.grund.nichtMoeglich") };
  return absprachenHaken.kaufe(world, g, Math.max(1, Math.round(anzahl)));
}

/** Was es kostet, `anzahl` Stimmen über die günstigsten Absprachen zu gewinnen (Anzeige; dieselbe Rechnung wie stimmenKaufen). */
export function stimmenPreis(world: World, g: Gesetz, anzahl: number): { kapital: number; stimmen: number } {
  return absprachenHaken?.preis(world, g, anzahl) ?? { kapital: Math.ceil(anzahl * REGELN.kaufKostenProStimme), stimmen: anzahl };
}

interface AbsprachenHaken {
  kaufe: (world: World, g: Gesetz, anzahl: number) => Ergebnis;
  preis: (world: World, g: Gesetz, anzahl: number) => { kapital: number; stimmen: number };
}
let absprachenHaken: AbsprachenHaken | undefined;
export function setzeAbsprachenHaken(h: AbsprachenHaken): void {
  absprachenHaken = h;
}

/** Wird nach jeder Abstimmung aufgerufen (Folgen der Gesetzesvorhaben, sim/gesetzgebung.ts). */
let nachAbstimmung: ((world: World, g: Gesetz, angenommen: boolean) => void) | null = null;
export function setzeAbstimmungsHaken(fn: (world: World, g: Gesetz, angenommen: boolean) => void): void {
  nachAbstimmung = fn;
}

/** Angenommene Gesetze, die der Ausschuss verändert hat, legt das Plenum dem Präsidenten vor (Art. 89, sim/gesetzgebung.ts).
 *  Gibt der Haken `true` zurück, wartet das Gesetz auf Unterschrift oder Rücksendung statt sofort zu gelten. */
let zurUnterschrift: ((world: World, g: Gesetz, e: PlenumErgebnis) => boolean) | null = null;
export function setzeUnterschriftHaken(fn: (world: World, g: Gesetz, e: PlenumErgebnis) => boolean): void {
  zurUnterschrift = fn;
}

export interface Abstimmung {
  gesetz: string;
  angenommen: boolean;
  ja: number;
  nein: number;
}

/** Ein angenommenes Gesetz verkünden: Es gilt ab heute, die Umsetzung beginnt. */
export function verkuende(world: World, g: Gesetz, e: Pick<PlenumErgebnis, "ja" | "nein" | "abwesend">, unterschrieben = false): void {
  const vorGesetz = stufeIn(world, g.massnahme, ortsListe(g.provinzen));
  wendeAn(world, g.massnahme, g.stufe, g.provinzen);
  politikGeaendert(world, g.massnahme, vorGesetz, g.stufe);
  const node = NET.nodes[knotenIndex(g.massnahme)]!;
  const monate = Math.max(1, Math.ceil((node.months ?? 1) * ueberlast(world)));
  const ort = provinzenText(g.provinzen);
  const zielName = stufenName(g.massnahme, g.stufe);
  const why = t("protokoll.gesetz.ja_warum", { text: node.text, monate });
  if (unterschrieben) {
    addLog(world, "entscheidung", t("n4.unterschrift.text", { name: g.name, ziel: zielName }), why);
    return;
  }
  addLog(world, "entscheidung", t("protokoll.gesetz.ja", { name: g.name, ort, ja: e.ja, nein: e.nein, stufe: zielName }), why).abstimmung = { art: "gesetz", name: g.name, ort, ja: e.ja, nein: e.nein, abwesend: e.abwesend, angenommen: true, stufe: g.stufe };
}

/** Am Abstimmungstag wird entschieden: Unterstützer aus Lager, Übertritten, Absprachen und Zufall; gezählt nach Art. 96 unter den
 *  Anwesenden. Bei der Mindestlohnkommission entscheidet die Kommission, nicht das Parlament. */
export function gesetzeAbstimmen(world: World, rng: Rng): Abstimmung[] {
  const spiel = world.spiel;
  if (!spiel) return [];
  const out: Abstimmung[] = [];
  const faellig = spiel.gesetze.filter((g) => g.abstimmung <= world.day);
  if (faellig.length === 0) return out;
  spiel.gesetze = spiel.gesetze.filter((g) => g.abstimmung > world.day);
  for (const g of faellig) {
    if (g.weg === "kommission") {
      kommissionEntscheidet(world, g);
      out.push({ gesetz: g.name, angenommen: true, ja: 10, nein: 5 });
      nachAbstimmung?.(world, g, true);
      continue;
    }
    const sicht = stimmenSicht(world, { massnahme: g.massnahme, richtung: gesetzRichtung(world, g) });
    const unterstuetzer = Math.min(600, Math.max(0, sicht.erwartet + g.absprachen + (g.stimmenBonus ?? 0) + Math.round(rng.normal(6))));
    const e = plenumAbstimmung(world, g.id, unterstuetzer);
    // Nach einer Rücksendung gilt das Gesetz nur, wenn es die absolute Mehrheit der Mitglieder erneut annimmt (Art. 89)
    const angenommen = g.rueckgabe ? e.ja >= REGELN.mehrheit : e.angenommen;
    const { ja, nein } = e;
    out.push({ gesetz: g.name, angenommen, ja, nein });
    if (angenommen) {
      if (g.rueckgabe) {
        verkuende(world, g, e);
        addLog(world, "ereignis", t("n4.rueckgabe.ueberstimmt", { name: g.name, ja, noetig: REGELN.mehrheit }), t("n4.rueckgabe.ueberstimmtWarum"));
        vertrauenAendern(world, -0.8);
      } else if (!zurUnterschrift?.(world, g, e)) verkuende(world, g, e);
    } else if (g.rueckgabe) {
      addLog(world, "entscheidung", t("n4.rueckgabe.gescheitert", { name: g.name, ja, noetig: REGELN.mehrheit }), t("n4.rueckgabe.gescheitertWarum")).abstimmung = { art: "gesetz", name: g.name, ort: "", ja, nein, abwesend: e.abwesend, angenommen: false };
    } else {
      vertrauenAendern(world, -1.2);
      spiel.umfrage.zustimmung = Math.max(0, spiel.umfrage.zustimmung - 0.8);
      addLog(world, "entscheidung", t("protokoll.gesetz.nein", { name: g.name, ja, nein }), t("n4.gesetz.neinWarum", { pk: g.pk, gerettet: Math.floor(g.pk * REGELN.rueckzugAnteil), anwesend: ja + nein })).abstimmung = { art: "gesetz", name: g.name, ort: "", ja, nein, abwesend: e.abwesend, angenommen: false };
    }
    nachAbstimmung?.(world, g, angenommen);
  }
  return out;
}

/** Die Mindestlohnkommission (Asgari Ücret Yönetmeliği Art. 8): Die fünf Vertreter des Staates stimmen nach der Vorgabe; bei einer
 *  Erhöhung schließen sich die Arbeitnehmer an, bei einer Senkung die Arbeitgeber. Zehn von fünfzehn Stimmen entscheiden. */
function kommissionEntscheidet(world: World, g: Gesetz): void {
  const von = stufeIn(world, g.massnahme, ortsListe(g.provinzen));
  wendeAn(world, g.massnahme, g.stufe, g.provinzen);
  politikGeaendert(world, g.massnahme, von, g.stufe);
  const erhoehung = g.stufe > von;
  addLog(world, "entscheidung", t(erhoehung ? "n4.kommission.erhoeht" : "n4.kommission.gesenkt", { name: g.name, von: stufenName(g.massnahme, von), nach: stufenName(g.massnahme, g.stufe) }), t(erhoehung ? "n4.kommission.erhoehtWarum" : "n4.kommission.gesenktWarum"));
}

/** Wie stark sich eine Maßnahme vom Startwert entfernt hat, für Anzeigen. */
export function abweichung(world: World, id: string): number {
  return nationalAverage(NET, world.net, id) - startAverage(NET, world.net, id);
}

/** Provinzen, in denen ein mit der Maßnahme verbundenes Problem akut ist (direkt oder über eine Zwischengröße). */
export function akuteOrte(world: World, id: string): number[] | null {
  const verbunden = new Set<string>();
  for (const e of NET.edges) if (e.from === id) verbunden.add(e.to);
  for (const e of NET.edges) if (verbunden.has(e.from)) verbunden.add(e.to);
  const provinzen = new Set<number>();
  for (const n of NET.nodes) {
    if (n.kind !== "problem" || !n.threshold || !verbunden.has(n.id)) continue;
    const i = NET.index.get(n.id)!;
    for (let p = 0; p < PROVINCES; p++) if (world.net.values[i * PROVINCES + p]! >= n.threshold) provinzen.add(p + 1);
  }
  return provinzen.size ? [...provinzen].sort((a, b) => a - b) : null;
}
