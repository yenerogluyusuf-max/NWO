// Wie ein Vorhaben zur Wirklichkeit wird: Ort, Politisches Kapital, Parlament, Verwaltungskapazität.
//
// Der Spieler verändert nicht einfach einen Regler. Jede Änderung
//   - kostet Politisches Kapital (knapp, wächst mit Vertrauen und Mehrheit),
//   - braucht ein Gesetz mit Mehrheit im Parlament (301 von 600) oder, wo das Recht es erlaubt, einen Erlass,
//   - kann auf einzelne Provinzen beschränkt werden (Bau vor Ort),
//   - konkurriert mit allen anderen laufenden Vorhaben um die Verwaltungskapazität.
// Alle Werte sind Platzhalter der Kalibrierung.

import { rasteStufe } from "../data/skalen";
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
import { t } from "../i18n";
import type { Rng } from "./rng";
import type { World } from "./types";
import type { Gesetz, Weg } from "./spiel-typen";
import type { FassungId } from "../data/gesetzesvorhaben";
import { kannZahlen } from "./kapital";
import { krisenFuerMassnahme, type KrisenTreffer } from "./krisen";
import { starteUmsetzung } from "./umsetzung";
import { AUFMERKSAMKEIT_KOSTEN, VERFASSUNG, hashWert, neuanfangGrund, stufeVon, unsicherheitFaktor, verbrauche, verfassungVon } from "./aufmerksamkeit";

export const REGELN = {
  /** Gleichzeitig laufende Vorhaben, bevor die Verwaltung überlastet ist */
  kapazitaet: 8,
  /** Zuschlag je Vorhaben über der Kapazität (Umsetzungsdauer) */
  ueberlastStufe: 0.2,
  /** Tage vom Einbringen bis zur Abstimmung */
  tageBisAbstimmung: 21,
  mehrheit: 301,
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

/** Wo das Recht einen Erlass des Präsidenten zulässt (Verwaltung, Sicherheit, Außenbeziehungen). */
const ERLASS_THEMEN = new Set(["sicherheit", "aussen", "militaer"]);
const ERLASS_MASSNAHMEN = new Set(["m_steuerfahndung", "m_verwaltungsdigital"]);

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
  /** Wie viele Stimmen bis zur Mehrheit fehlen (erwartet) */
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
  return { lager, erwartet, low: erwartet - band, high: Math.min(600, erwartet + band), luecke: Math.max(0, REGELN.mehrheit - erwartet), duldung: dul.ja, duldungSitze: dul.sitze, sach: sach.ja, sachParteien: sach.parteien };
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
  erlass: { moeglich: boolean; pk: number; grund?: string; bezahlbar: boolean };
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
  return { ...st, erwartet, low: z(st.low), high: z(st.high), luecke: Math.max(0, REGELN.mehrheit - erwartet) };
}

export function erlassMoeglich(id: string): boolean {
  const node = NET.nodes[knotenIndex(id)]!;
  return ERLASS_THEMEN.has(node.theme) || ERLASS_MASSNAHMEN.has(id);
}

export function pruefeVorhaben(world: World, id: string, stufe: number, provinzen?: number[] | null, wahl?: FassungId): Pruefung {
  const i = knotenIndex(id);
  const node = NET.nodes[i]!;
  const ort = ortsListe(provinzen);
  // Steuern mit echtem Satz nur in ganzen Prozentpunkten zwischen echten Grenzen (Befund B-2, data/skalen.ts)
  const ziel = rasteStufe(id, clamp(Math.round(stufe), 0, 100));
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
  const erlassOk = erlassMoeglich(id);
  const pkErlass = Math.max(2, Math.round(pkKosten(world, id, aenderung, ort, "erlass") * krisenFaktor));
  const hinweise: string[] = [];
  // Die Linie der Partei sichtbar machen: Der Preis steht im Kapital, die Reaktion der Partner folgt nach dem Beschluss (sim/linie.ts)
  const linie = linienFaktor(world, id, aenderung);
  if (linie <= 0.93) hinweise.push(t("linie.hinweis.mit", { prozent: Math.round((1 - linie) * 100) }));
  else if (linie >= 1.12) hinweise.push(t("linie.hinweis.gegen", { prozent: Math.round((linie - 1) * 100) }));
  if (ueberl > 1) hinweise.push(`Die Verwaltung ist mit ${offen} laufenden Vorhaben überlastet: Die Umsetzungsdauer steigt um ${Math.round((ueberl - 1) * 100)} %.`);
  if (stimmen.luecke > 0) hinweise.push(`Dem Lager fehlen für eine Mehrheit voraussichtlich ${stimmen.luecke} Stimmen; sie lassen sich mit Kapital kaufen (${REGELN.kaufKostenProStimme} Kapital je Stimme, sofort bezahlt; danach schuldet niemand jemandem etwas).`);
  if (ort && share < 0.05) hinweise.push("Ein kleiner Ort: Die Wirkung auf die Landeswerte ist gering, die vor Ort deutlich.");
  if (ort) {
    const prozent = share * 100;
    hinweise.push(
      `Umfang: ${prozent < 1 ? "unter 1" : Math.round(prozent).toLocaleString("de-DE")} Prozent der Bevölkerung betroffen. Der politische Preis liegt bei ${Math.round(umfangFaktor(share) * 100)} Prozent des landesweiten Preises, die Haushaltskosten folgen der Bevölkerung (${kostenBip.toLocaleString("de-DE", { maximumFractionDigits: 3 })} Prozent des BIP im Jahr).`,
    );
  }
  for (const k of krisen) {
    if (k.art === "teuer") hinweise.push(`${k.krise.name}: ${k.krise.wirkung}`);
  }
  // Vier-Preise-Regel: Der Exit-Preis und der laufende Unterhalt stehen von Anfang an auf dem Preisschild.
  const preise = preisFaktoren(node);
  const richtung: "einfuehren" | "streichen" = aenderung >= 0 ? "einfuehren" : "streichen";
  if (aenderung < 0 && preise.streichen > preise.einfuehren) {
    const f = (preise.streichen / preise.einfuehren).toLocaleString("de-DE", { maximumFractionDigits: 1 });
    hinweise.push(`Exit-Preis: Das Zurücknehmen kostet das ${f}-Fache des Einführens — Besitzstände, Apparate und Lager wehren sich.`);
  }
  if (preise.unterhaltMonat > 0) {
    hinweise.push(`Politische Dauerbelastung: etwa ${preise.unterhaltMonat.toLocaleString("de-DE")} Kapital im Monat bei voller Stufe, anteilig zur aktuellen Stufe.`);
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
    gesetz: { pk: pkGesetz, stimmen, tage: REGELN.tageBisAbstimmung, bezahlbar: kannZahlen(kapital, pkGesetz) },
    // Hat die Maßnahme einen Katalogeintrag, entscheidet der Katalog (er kennt Art. 104 Abs. 17 je Vorhaben), sonst die Themenregel
    erlass: fassung && !fassung.erlassErlaubt
      ? { moeglich: false, pk: pkErlass, bezahlbar: false, grund: t("gesetz.grund.keinErlass") }
      : fassung || erlassOk
      ? { moeglich: true, pk: pkErlass, bezahlbar: kannZahlen(kapital, pkErlass) }
      : { moeglich: false, pk: pkErlass, bezahlbar: false, grund: "Dafür braucht der Präsident ein Gesetz; ein Erlass ist nur in Sicherheit und Außenbeziehungen zulässig." },
    hinweise,
    krisen,
    krisenFaktor,
    preise: { ...preise, richtung },
    ...(fassung ? { fassung } : {}),
  };
  if (Math.abs(aenderung) < 1) return { ...base, ok: false, grund: "Das ist schon die aktuelle Stufe." };
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
    `${node.name} ${provinzenText(ort)}: von Stufe ${Math.round(current)} auf ${target} ${target > current ? "erhöht" : "gesenkt"}.`,
    `${node.text} Umsetzung läuft über etwa ${months} ${months === 1 ? "Monat" : "Monate"}` +
      (Math.abs(costChange) >= 0.0005 ? `; ${costChange > 0 ? "kostet" : "bringt"} jährlich etwa ${fmt(Math.abs(costChange))} % der Wirtschaftsleistung.` : "."),
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

/** Ein Vorhaben einbringen: als Gesetz (mit Abstimmung) oder als Erlass. */
export function bringeEin(world: World, id: string, stufe: number, provinzen: number[] | null | undefined, weg: Weg, wahl?: FassungId): Ergebnis {
  const pr = pruefeVorhaben(world, id, stufe, provinzen, wahl);
  if (!pr.ok) return { ok: false, text: pr.grund ?? "Nicht möglich." };
  const spiel = world.spiel;
  if (!spiel) {
    setPolicy(world, id, stufe, provinzen);
    const l = world.log[world.log.length - 1]!;
    return { ok: true, text: l.text, why: l.why };
  }
  if (spiel.ende) return { ok: false, text: "Die Amtszeit ist beendet." };
  const pause = neuanfangGrund(world);
  if (pause) return { ok: false, text: pause };

  if (weg === "erlass") {
    if (!pr.erlass.moeglich) return { ok: false, text: pr.erlass.grund!, why: "Wege statt Verbote: Der Weg über ein Gesetz steht offen." };
    if (!pr.erlass.bezahlbar) return { ok: false, text: `Für den Erlass fehlt Politisches Kapital (nötig ${pr.erlass.pk}, vorhanden ${Math.floor(spiel.kapital)}).` };
    spiel.kapital -= pr.erlass.pk;
    verbrauche(world, AUFMERKSAMKEIT_KOSTEN.erlass, pr.name);
    const vorErlass = stufeIn(world, id, ortsListe(pr.provinzen));
    setPolicy(world, id, pr.stufe, pr.provinzen);
    politikGeaendert(world, id, vorErlass, pr.stufe);
    vertrauenAendern(world, -(1 + Math.abs(pr.aenderung) / 40));
    const l = world.log[world.log.length - 1]!;
    nachEinbringen?.(world, id, `Per Erlass angeordnet: ${l.text}`);
    // Eine Fassung des Katalogs: Verbände, Straße und Verfassungsgericht folgen (sim/gesetzgebung.ts)
    if (pr.fassung && fassungsFolgen) return fassungsFolgen.erlassen(world, pr, vorErlass);
    return { ok: true, text: `Erlass: ${l.text}`, why: `${l.why} Ein Erlass umgeht das Parlament und kostet ${pr.erlass.pk} Kapital sowie etwas Vertrauen.` };
  }

  if (!pr.gesetz.bezahlbar) return { ok: false, text: `Für dieses Gesetz fehlt Politisches Kapital (nötig ${pr.gesetz.pk}, vorhanden ${Math.floor(spiel.kapital)}).`, why: "Kapital wächst mit Vertrauen und Mehrheit; nicht alles auf einmal." };
  if (spiel.gesetze.some((g) => g.massnahme === id)) return { ok: false, text: `Zu „${pr.name}“ liegt schon ein Gesetzentwurf im Parlament.` };
  spiel.kapital -= pr.gesetz.pk;
  verbrauche(world, AUFMERKSAMKEIT_KOSTEN.gesetz, pr.name);
  // Ist der Präsident angespannt, verzögert sich die Einbringung mitunter um ein paar Tage
  const verzug = stufeVon(verfassungVon(world).belastung) >= 1 && hashWert(`${world.seed}|${world.day}|${id}|verzug`) < VERFASSUNG.verzugChance ? VERFASSUNG.verzugTage : 0;
  const tag = world.day + REGELN.tageBisAbstimmung + verzug;
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
  const tageBis = tag - world.day;
  const monate = pr.monate;
  const text = `Gesetzentwurf „${name}“ ${provinzenText(pr.provinzen)} auf Stufe ${pr.stufe} eingebracht. Die Abstimmung ist in ${tageBis} Tagen; nach der Annahme läuft die Umsetzung über etwa ${monate} ${monate === 1 ? "Monat" : "Monate"}.`;
  const why = `${pr.gesetz.pk} Kapital gezahlt. Erwartet werden ${pr.gesetz.stimmen.erwartet} Ja-Stimmen (Spanne ${pr.gesetz.stimmen.low} bis ${pr.gesetz.stimmen.high}), nötig sind ${REGELN.mehrheit}.${verzug > 0 ? " Die Einbringung verzögert sich um zwei Tage: Dem Präsidenten fehlt unter Anspannung die Konzentration." : ""}`;
  addLog(world, "entscheidung", text, why);
  nachEinbringen?.(world, id, text);
  return { ok: true, text, why };
}

/** Wie es um ein laufendes Gesetz steht und was Absprachen bis zur Mehrheit kosten würden. */
export interface GesetzSicht {
  /** Erwartete Ja-Stimmen einschließlich Absprachen */
  ja: number;
  /** Fehlende Stimmen bis zur Mehrheit (0 = Mehrheit steht) */
  luecke: number;
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
  return mehrheitsSicht(world, sicht.erwartet + g.absprachen + (g.stimmenBonus ?? 0), sicht.sachParteien);
}

function mehrheitsSicht(world: World, erwartet: number, sachParteien: string[]): GesetzSicht {
  const ja = Math.min(600, Math.max(0, erwartet));
  const luecke = Math.max(0, REGELN.mehrheit - ja);
  const noetig = ja >= REGELN.mehrheit + STIMMEN_PUFFER ? 0 : REGELN.mehrheit + STIMMEN_PUFFER - ja;
  const kosten = Math.ceil(noetig * REGELN.kaufKostenProStimme);
  const kapital = world.spiel?.kapital ?? 0;
  const bezahlbar = kannZahlen(kapital, kosten);
  const urteil = ja >= REGELN.mehrheit + STIMMEN_PUFFER ? "sicher" : luecke > 0 && !bezahlbar ? "verloren" : "knapp";
  return { ja, luecke, noetig, kosten, bezahlbar, aussichtslos: luecke > 0 && !bezahlbar, urteil, sachParteien };
}

/** Nur bekannte Fristen fortschreiben, keine künftigen Entscheidungen oder Monatsfolgen simulieren. */
export function gesetzWeltAmVotum(world: World, g: Pick<Gesetz,"abstimmung">): World {
  const day = Math.max(world.day, g.abstimmung);
  return day === world.day ? world : { ...world, day, date: addDays(world.date, day - world.day) };
}

/** Gemeinsame Vorschau laufender Gesetze; tatsächliche Abstimmungen rechnen weiterhin am jeweiligen Spieltag. */
export function gesetzPrognose(world: World, g: Gesetz) {
  return stimmenPrognose(world,g.abstimmung,g.absprachen+(g.stimmenBonus??0),{massnahme:g.massnahme,richtung:gesetzRichtung(world,g)});
}

/** Auch Haushaltsgesetze verwenden dieselben Fristen, Grenzen und Preise; ohne inhaltliche Sachstimmen. */
export function stimmenPrognose(world:World, abstimmung:number, zusatz=0, vorhaben?:{massnahme:string;richtung:number}) {
  const stand = gesetzWeltAmVotum(world, {abstimmung});
  const heute = stimmenSicht(world,vorhaben);
  const basis = stimmenSicht(stand,vorhaben);
  const votum = mehrheitsSicht(world,basis.erwartet+zusatz,basis.sachParteien);
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
  if (!spiel || !g) return { ok: false, text: "Dieses Gesetz liegt nicht mehr zur Abstimmung vor." };
  const zurueck = Math.floor(g.pk * REGELN.rueckzugAnteil);
  spiel.gesetze = spiel.gesetze.filter((x) => x.id !== gesetzId);
  spiel.kapital = Math.min(REGELN.kapitalMax, spiel.kapital + zurueck);
  const text = `„${g.name}“ wird zurückgezogen.`;
  const why = `${zurueck} von ${g.pk} Kapital kommen zurück. Ein Rückzug vor der Abstimmung ist billiger als eine verlorene Abstimmung.`;
  addLog(world, "entscheidung", text, why);
  return { ok: true, text, why };
}

/** Stimmen für ein laufendes Gesetz kaufen (Absprachen mit Fraktionen). */
export function stimmenKaufen(world: World, gesetzId: string, anzahl: number): Ergebnis {
  const spiel = world.spiel;
  const g = spiel?.gesetze.find((x) => x.id === gesetzId);
  if (!spiel || !g) return { ok: false, text: "Dieses Gesetz liegt nicht mehr zur Abstimmung vor." };
  const n = Math.max(1, Math.round(anzahl));
  const kosten = Math.ceil(n * REGELN.kaufKostenProStimme);
  if (!kannZahlen(spiel.kapital, kosten)) return { ok: false, text: `Für ${n} Stimmen fehlt Politisches Kapital (nötig ${kosten}, vorhanden ${Math.floor(spiel.kapital)}).` };
  spiel.kapital -= kosten;
  verbrauche(world, AUFMERKSAMKEIT_KOSTEN.stimmenkauf, `Absprachen zu „${g.name}“`);
  g.absprachen += n;
  const text = `${n} Stimmen für „${g.name}“ gesichert.`;
  const why = `Kostet ${kosten} Kapital, sofort bezahlt; danach schuldet niemand jemandem etwas. Dauerhafte Unterstützung gibt es nur über Verhandlungen mit einer Fraktion.`;
  addLog(world, "entscheidung", text, why);
  return { ok: true, text, why };
}

/** Wird nach jeder Abstimmung aufgerufen (Folgen der Gesetzesvorhaben, sim/gesetzgebung.ts). */
let nachAbstimmung: ((world: World, g: Gesetz, angenommen: boolean) => void) | null = null;
export function setzeAbstimmungsHaken(fn: (world: World, g: Gesetz, angenommen: boolean) => void): void {
  nachAbstimmung = fn;
}

export interface Abstimmung {
  gesetz: string;
  angenommen: boolean;
  ja: number;
  nein: number;
}

/** Am Abstimmungstag wird entschieden: Ja-Stimmen aus Lager, Übertritten, Absprachen und Zufall. */
export function gesetzeAbstimmen(world: World, rng: Rng): Abstimmung[] {
  const spiel = world.spiel;
  if (!spiel) return [];
  const out: Abstimmung[] = [];
  const faellig = spiel.gesetze.filter((g) => g.abstimmung <= world.day);
  if (faellig.length === 0) return out;
  spiel.gesetze = spiel.gesetze.filter((g) => g.abstimmung > world.day);
  for (const g of faellig) {
    const sicht = stimmenSicht(world, { massnahme: g.massnahme, richtung: gesetzRichtung(world, g) });
    const ja = Math.min(600, Math.max(0, sicht.erwartet + g.absprachen + (g.stimmenBonus ?? 0) + Math.round(rng.normal(6))));
    const nein = 600 - ja;
    const angenommen = ja >= REGELN.mehrheit;
    out.push({ gesetz: g.name, angenommen, ja, nein });
    if (angenommen) {
      const vorGesetz = stufeIn(world, g.massnahme, ortsListe(g.provinzen));
      wendeAn(world, g.massnahme, g.stufe, g.provinzen);
      politikGeaendert(world, g.massnahme, vorGesetz, g.stufe);
      const node = NET.nodes[knotenIndex(g.massnahme)]!;
      const monate = Math.max(1, Math.ceil((node.months ?? 1) * ueberlast(world)));
      const ort = provinzenText(g.provinzen);
      addLog(world, "entscheidung", t("protokoll.gesetz.ja", { name: g.name, ort, ja, nein, stufe: g.stufe }), t("protokoll.gesetz.ja_warum", { text: node.text, monate })).abstimmung = { art: "gesetz", name: g.name, ort, ja, nein, angenommen: true, stufe: g.stufe };
    } else {
      vertrauenAendern(world, -1.2);
      spiel.umfrage.zustimmung = Math.max(0, spiel.umfrage.zustimmung - 0.8);
      addLog(world, "entscheidung", t("protokoll.gesetz.nein", { name: g.name, ja, nein }), t("protokoll.gesetz.nein_warum", { pk: g.pk, fehlen: REGELN.mehrheit - ja, gerettet: Math.floor(g.pk * REGELN.rueckzugAnteil) })).abstimmung = { art: "gesetz", name: g.name, ort: "", ja, nein, angenommen: false };
    }
    nachAbstimmung?.(world, g, angenommen);
  }
  return out;
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
