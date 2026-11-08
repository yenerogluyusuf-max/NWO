// Die Operationsform eines Krieges (Welle 3, K3; krieg.md Schritt 6): Luftschlag, begrenzte Bodenoperation, Großoffensive oder Landung,
// dazu die Wahl, ob die Syrische Nationalarmee am Boden mitkämpft. Daten und Belege in data/operationen.ts.
//
// Die Form setzt die Einsatzart des Schauplatzes (data/schauplaetze.ts) und gibt Faktoren auf deren Rechnung: Die Grundwerte für Gelände,
// Tempo, Verluste und Weltpreis rechnen sim/kriegsschauplatz.ts und sim/kriegspreis.ts; diese Datei multipliziert nur. Sie importiert
// sim/krieg.ts nicht (kein Ladezyklus); krieg.ts ruft `operationsVorstoss`, `operationNachSchauplatz`, `operationBeginn` und `operationsTiefe`.
// Ältere Spielstände ohne Form laufen wie bisher: Alle Faktoren sind dann 1.

import { OPERATIONSFORMEN, OPERATIONSFORM_IDS, OPERATION_WECHSEL, VERBUENDETE, type OperationsForm, type OperationsFormId, type VerbuendeteId } from "../data/operationen";
import type { EinsatzArt } from "../data/schauplaetze";
import { PREIS, REAKTION } from "./kriegspreis";
import { schauplatzFuer, umkaempfteRegion } from "./kriegsschauplatz";
import { istFernkonflikt } from "./fernkonflikt";
import { kannZahlen } from "./kapital";
import { land, landAendern, weltZustand } from "./laender";
import { addLog } from "./log";
import { wirke } from "./wirkung";
import { t } from "../i18n";
import type { KriegVorgang } from "./krieg-typen";
import type { World } from "./types";

const r2 = (x: number): number => Math.round(x * 100) / 100;

export function operationVon(k: KriegVorgang): OperationsForm | undefined {
  return k.operation ? OPERATIONSFORMEN[k.operation] : undefined;
}

/**
 * Die Einsatzart, auf deren Grundwerte die Form rechnet. Die SNA kämpft neben dem Heer und ändert sie nicht (data/operationen.ts VERBUENDETE).
 * Eine Landung auf Zypern kämpft nach dem Brückenkopf am Boden: 1974 landeten die Truppen bei Kyrenia, danach trugen rund 40.000 Mann mit
 * 160 bis 180 Panzern die Operation (recherche_operationen.md B). Dafür gilt „boden“, an dem K2 Zypern 1974 kalibriert hat
 * (test/krieg-kalibrierung.test.ts); den Preis der Landung trägt dort SCHAUPLATZ.landung. Mit „see“ (Seeblockade) kam die Front auf Zypern
 * nur 72 km² je Woche voran (Beleg 863 bis 887). Auf den Inseln der Ägäis bleibt es „see“: Ein Heer ohne Schiffe nimmt keine Insel.
 */
export function einsatzFuer(form: OperationsFormId, _mit: VerbuendeteId = "allein", schauplatz?: string): EinsatzArt {
  if (form === "landung" && schauplatz === "zypern") return "boden";
  return OPERATIONSFORMEN[form].einsatz;
}

/** Ob die SNA in diesem Krieg mit dieser Form kämpfen kann (nur Nordsyrien, nur am Boden). */
export function snaMoeglich(k: KriegVorgang, form: OperationsFormId): boolean {
  return k.land === VERBUENDETE.sna.land && VERBUENDETE.sna.formen.includes(form);
}

/** Die Türkei greift an (nicht Selbstverteidigung nach einem Angriff); dann trägt sie den Weltpreis voll (wie sim/kriegspreis.ts). */
export function tuerkeiGreiftAn(k: KriegVorgang): boolean {
  if (k.koalition) return k.koalition.aggressor === "tuerkei";
  return k.rahmung !== "verteidigung" || !!k.rahmungDuenn;
}

/** Faktoren der gewählten Form samt Verbündeten (alle 1 ohne Form). */
export function operationsFaktoren(k: KriegVorgang): { verlust: number; uhr: number; druck: number; welt: number } {
  const f = operationVon(k);
  if (!f) return { verlust: 1, uhr: 1, druck: 0, welt: 1 };
  const sna = k.verbuendete === "sna";
  return {
    verlust: f.verlust * (sna ? VERBUENDETE.sna.verlust : 1),
    uhr: f.uhr,
    druck: f.druck,
    welt: f.welt * (sna ? VERBUENDETE.sna.welt : 1),
  };
}

/** Bis zu welcher Tiefe der Regionen die Form trägt; ohne Form der ganze Schauplatz. */
export function operationsTiefe(k: KriegVorgang): number {
  return operationVon(k)?.tiefe ?? 3;
}

/** Ob die Operation an ihrer Grenze steht: Die nächste Region des Zielraums liegt tiefer, als die Form trägt. */
export function anDerGrenze(k: KriegVorgang): boolean {
  const f = operationVon(k);
  if (!f) return false;
  const r = umkaempfteRegion(k);
  return !!r && r.tiefe > f.tiefe;
}

/**
 * Faktor der Form auf die Frontbewegung einer Woche (sim/krieg.ts `kriegWoche`, nach Gelände und Tempo des Schauplatzes). Ein Vorstoß über
 * die Tiefe der Form hinaus findet nicht statt: Die Operation hält an ihrer Linie, bis der Präsident sie ausweitet. Sind alle Zielregionen
 * genommen, drückt die Front nur noch halb so stark weiter (Druck auf den Gegner, kein Gelände).
 */
export function operationsVorstoss(k: KriegVorgang, delta: number): number {
  const f = operationVon(k);
  if (!f) return 1;
  if (delta <= 0) return f.rueckschlag;
  if (f.tiefe === 0) return 0;
  const r = umkaempfteRegion(k);
  if (!r) return f.vorstoss * 0.5;
  return r.tiefe > f.tiefe ? 0 : f.vorstoss;
}

export interface FormSicht {
  id: OperationsFormId;
  moeglich: boolean;
  grund?: string;
  aktiv: boolean;
  /** Was die Wahl jetzt an Kapital kostet (vor dem Krieg nichts) */
  pk: number;
  /** Ob die SNA mitkämpfen kann */
  sna: boolean;
}

/** Welche Formen der Krieg anbietet; im Fernkonflikt ohne Schauplatz keine (dort gelten die Mittel aus sim/fernkonflikt.ts). */
export function formenFuer(w: World, k: KriegVorgang, ausWendepunkt = false): FormSicht[] {
  const s = schauplatzFuer(k.land);
  if (!s || istFernkonflikt(k.land)) return [];
  const offen = k.phase === "spannung" || k.phase === "drohkulisse" || k.phase === "beschluss" || k.phase === "krieg";
  const imKrieg = k.phase === "krieg";
  const rest = (k.operationSeit ?? -1e9) + OPERATION_WECHSEL.abkuehlungTage - w.day;
  return OPERATIONSFORM_IDS.map((id) => {
    const f = OPERATIONSFORMEN[id];
    const pk = imKrieg ? f.pk : 0;
    let grund: string | undefined;
    if (f.nur && !f.nur.includes(s.id)) grund = t("welle_k3.op.grund.nur");
    else if (k.mobilmachung < f.mobil) grund = t("welle_k3.op.grund.mobil");
    else if (!offen) grund = t("welle_k3.op.grund.vorbei");
    else if (imKrieg && k.operation && rest > 0 && k.operation !== id && !ausWendepunkt) grund = t("welle_k3.op.grund.abkuehlung", { tage: rest });
    else if (pk > 0 && w.spiel && !kannZahlen(w.spiel.kapital, pk)) grund = t("welle_k3.op.grund.kapital");
    return { id, moeglich: !grund, ...(grund ? { grund } : {}), aktiv: k.operation === id, pk, sna: snaMoeglich(k, id) };
  });
}

/**
 * Die Form wählen, wahlweise mit der SNA. Vor dem Krieg ist die Wahl frei und gilt ab dem Einsatz. Im Krieg kostet sie Kapital, die Truppe
 * verliert Moral, und das Ansehen der neuen Form wird sofort gebucht; danach ruht der Befehl drei Wochen. Aus einem Wendepunkt heraus (Ende einer
 * Schlagwelle) gilt die Ruhezeit nicht: Dort ist der neue Befehl gerade gefragt.
 */
export function waehleOperation(w: World, k: KriegVorgang, id: OperationsFormId, mit: VerbuendeteId = "allein", ausWendepunkt = false): { ok: boolean; text: string } {
  const sicht = formenFuer(w, k, ausWendepunkt).find((x) => x.id === id);
  if (!sicht) return { ok: false, text: t("welle_k3.op.grund.keine") };
  const verb: VerbuendeteId = mit === "sna" && sicht.sna ? "sna" : "allein";
  if (sicht.aktiv && (k.verbuendete ?? "allein") === verb) return { ok: false, text: t("welle_k3.op.schon") };
  if (!sicht.moeglich && !sicht.aktiv) return { ok: false, text: sicht.grund ?? t("welle_k3.op.grund.keine") };
  const f = OPERATIONSFORMEN[id];
  const imKrieg = k.phase === "krieg";
  const wechsel = imKrieg && !!k.operation;
  if (imKrieg && w.spiel && !sicht.aktiv) w.spiel.kapital -= sicht.pk;
  if (wechsel) wirke(w, "truppenmoral", OPERATION_WECHSEL.moral);
  if (imKrieg && !sicht.aktiv) wirke(w, "ansehen", f.ansehen);
  k.operation = id;
  k.verbuendete = verb;
  k.einsatz = einsatzFuer(id, verb, schauplatzFuer(k.land)?.id);
  k.einsatzSeit = w.day;
  k.operationSeit = w.day;
  k.operationWoche = k.woche;
  const name = t(`welle_k3.op.${id}.name`);
  const text = t(verb === "sna" ? "welle_k3.op.gewaehlt_sna" : "welle_k3.op.gewaehlt", { form: name, land: land(k.land).name });
  addLog(w, "entscheidung", text, t(`welle_k3.op.${id}.vorbild`));
  return { ok: true, text };
}

/** Beim Einsatz (sim/krieg.ts `kriegsbeginn`): Ansehen und Sammeleffekt der Form; die Einsatzart folgt der Form. */
export function operationBeginn(w: World, k: KriegVorgang): void {
  const f = operationVon(k);
  if (!f) return;
  k.einsatz = einsatzFuer(f.id, k.verbuendete, schauplatzFuer(k.land)?.id);
  k.operationSeit = w.day;
  k.operationWoche = 0;
  wirke(w, "ansehen", f.ansehen);
  if (w.spiel && f.sammlung) w.spiel.umfrage.zustimmung = Math.min(100, w.spiel.umfrage.zustimmung + f.sammlung);
}

/**
 * Nach dem Schauplatz einer Kriegswoche, vor dem Kriegspreis (sim/krieg.ts `kriegWoche`): Die Form wirkt auf die Verluste der Woche (aus ihnen
 * rechnet der Kriegspreis die Gefallenen), auf den Abfluss des eigenen Rückhalts, auf den Druck gegen den Gegner und auf den Weltpreis.
 * `vor` ist der Rückhalt beider Seiten vor der Rechnung der Woche.
 */
export function operationNachSchauplatz(w: World, k: KriegVorgang, vor: { uhr: number; uhrGegner: number }): void {
  const f = operationVon(k);
  if (!f) return;
  const of = operationsFaktoren(k);
  // Beide Größen, aus denen sim/kriegspreis.ts die Gefallenen rechnet: im Landkrieg die Gefechtslast `last` (K2), sonst `eigen`. Vorher wirkte
  // der Faktor nur auf `eigen` und erreichte im Landkrieg die Gefallenen nicht mehr
  if (k.letzteWoche) {
    k.letzteWoche.eigen = r2(k.letzteWoche.eigen * of.verlust);
    if (k.letzteWoche.last !== undefined) k.letzteWoche.last = k.letzteWoche.last * of.verlust;
  }
  const verlust = vor.uhr - k.uhr;
  if (verlust > 0) k.uhr = vor.uhr - verlust * of.uhr;
  k.uhrGegner -= of.druck;
  if (!tuerkeiGreiftAn(k) || of.welt === 1) return;
  // Weltpreis: dieselben Größen wie sim/kriegspreis.ts (Konflikt mit EU und USA, Ansehen), um den Anteil der Form über oder unter dem Grundwert
  const r = REAKTION[k.land] ?? { eu: 0.4, usa: 0.3 };
  const extra = of.welt - 1;
  westen(w, "EU", r.eu * extra);
  westen(w, "USA", Math.max(0, r.usa) * extra);
  wirke(w, "ansehen", -0.15 * extra);
}

/** Wie sim/kriegspreis.ts: Der Konflikt mit dem Westen steigt nur bis unter die Schwelle eines eigenen Konfliktvorgangs. */
function westen(w: World, id: "EU" | "USA", d: number): void {
  if (!d) return;
  const jetzt = weltZustand(w)[id]?.konflikt ?? 45;
  const plus = d > 0 ? Math.min(d, Math.max(0, PREIS.westenDeckel - jetzt)) : d;
  if (plus) landAendern(w, id, { konflikt: plus });
}

/** Kriegswochen seit der Wahl der Form (für das Ende einer Schlagwelle). */
export function wochenDerForm(k: KriegVorgang): number {
  return k.woche - (k.operationWoche ?? 0);
}
