// Infrastruktur als Bestand mit Belastung (KI_PROJEKTE_UND_KARTE_2026-10-05, Teil 2: Nutzung → Überlast → Bitte → Entscheidung → neue Nutzung).
//
// Neun Netze je Provinz (Häfen als ein Korridor für das ganze Land) mit Kapazität und Auslastung. Die Nachfrage wächst mit der Wirtschaft,
// dem Tourismus und einem Trend; wo sie die Kapazität übersteigt, bremst die Überlast vorhandene Größen des Politiknetzes (Stau, Logistik,
// Export, Tourismus, Stromausfälle, Wassermangel, Mieten, Wartezeiten). Ausbau läuft über die Bauvorhaben des Reiches (sim/reich.ts:
// `beginne` mit Vergabe, Baukapazität, Kostenüberschreitung, Verfall und Instandsetzung); dieses Modul legt nur die Vorhaben an und rechnet
// die Kapazität, wenn sie fertig sind. Neue Kapazität zieht neuen Verkehr an (induzierte Nachfrage); leere Kapazität kostet Unterhalt.
//
// Grundsatz wie im Reich: Was beim Start schon überlastet ist, steckt in den Startwerten des Netzes. Es bremst nur, was sich gegenüber dem
// Start verschlechtert, und es entlastet, was sich verbessert. So erzeugt die Belastung keine Dauerkrise ab dem ersten Tag.
// Alle Zahlen außer den Mengen aus data/provinz_infra.json sind Spielparameter (data/infrastruktur-netze.ts).

import INFRA from "../data/provinz_infra.json";
import MITTEN from "../data/reich/provinzmitten.json";
import { ALTERNATIVEN, AUSBAUTEN, AUSBAU_NACH_ID, AUSLASTUNG_MAX, NETZE, NETZ_NACH_ID, PAKETE, SCHWELLE, START_GRENZEN, type AusbauDef, type NetzDef, type NetzId, type PaketDef } from "../data/infrastruktur-netze";
import { instandsetzung, stoss } from "../data/reich/bau";
import { NET } from "./modell";
import { PROVINCES } from "./netz";
import { PROVINZEN, WEIGHTS } from "./regional";
import { wirke } from "./wirkung";
import { addLog } from "./log";
import { grollVerschieben, loyalitaetVerschieben, merke } from "./personen";
import { kannZahlen } from "./kapital";
import { verbrauche, AUFMERKSAMKEIT_KOSTEN } from "./aufmerksamkeit";
import * as Haushalt from "./haushalt";
import { beginne, reichZustand, registriereVorhaben, vergabeAngebot } from "./reich";
import { t } from "../i18n";
import type { Vergabe, Vorhaben } from "./reich-typen";
import type { Amt, NutzenZeile, VorlageOption } from "./ministerfluss-typen";
import type { World } from "./types";

export type { NetzId } from "../data/infrastruktur-netze";

export interface NetzStand {
  /** Auslastung beim Start je Provinz (Index = Kfz-Kennziffer − 1); 0 = kein solches Netz in der Provinz. Häfen: ein Wert für das Land */
  start: number[];
  /** Nachfrage in Einheiten der Startkapazität */
  nachfrage: number[];
  /** Kapazität aus kleinen Eingriffen (Alternativen), Faktor auf die Startkapazität */
  basis: number[];
  /** Noch ausstehende induzierte Nachfrage (füllt sich über etwa drei Jahre) */
  induziert: number[];
  /** Wirksame Kapazität (Start = 1), jeden Monat aus Basis und fertigen Ausbauten neu gerechnet */
  kap: number[];
}

export interface AusbauEintrag {
  ausbau: string;
  netz: NetzId;
  /** Provinzen, deren Kapazität wächst; leer = das ganze Land (Häfen) */
  provinzen: number[];
  plus: number;
  paket?: string;
  fertig?: boolean;
}

export interface Bitte {
  id: string;
  netz: NetzId;
  /** 0 = das ganze Land */
  plaka: number;
  tag: number;
}

export interface InfrastrukturZustand {
  v: 1;
  netze: Record<NetzId, NetzStand>;
  /** Ausbauten nach Kennung des Reich-Vorhabens */
  ausbau: Record<string, AusbauEintrag>;
  /** Die eine offene Bitte eines Ministers (höchstens eine je Monat) */
  bitte?: Bitte;
  /** Wann zu welchem Thema zuletzt gebeten oder eingegriffen wurde */
  gebeten: Record<string, number>;
  /** Unterhalt für leer stehende Kapazität im letzten Monat (Prozentpunkte der Schuldenquote) */
  leerKosten: number;
  /** Zuletzt gemeldete Überlast je Netz (Tag), damit Meldungen nicht jeden Monat kommen */
  gemeldet: Record<string, number>;
  /** Liegengelassene Bitten: „netz:plaka“ → Tag, bis zu dem die Überlast dort stärker in Ärger umschlägt */
  vernachlaessigt?: Record<string, number>;
  /** Werke, deren Last schon in der Nachfrage steckt (einmal beim Fertigwerden) */
  werkLast?: Record<string, number>;
}

// ---------------------------------------------------------------------------
// Finanzierung: der Infrastrukturetat

let etatQuelle: ((w: World) => number) | null = null;
/** Stufe des Infrastrukturetats (−2 bis +2), etwa aus dem Ressorthaushalt; ohne Quelle gilt der Posten „Öffentliche Investitionen“. */
export const setzeEtatQuelle = (f: ((w: World) => number) | null): void => {
  etatQuelle = f;
};

const clamp = (x: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, x));
const r1 = (x: number): number => Math.round(x * 10) / 10;

/** Stufe des Etats und woher sie stammt. Der Ressorthaushalt (Fork HAUSHALT) kann `infrastrukturEtat(w)` bereitstellen; sonst Rückfall. */
export function etatStufe(w: World): { stufe: number; quelle: "etat" | "haushalt" | "posten" } {
  if (etatQuelle) return { stufe: clamp(etatQuelle(w), -2, 2), quelle: "etat" };
  const h = Haushalt as unknown as Record<string, unknown>;
  const f = h["infrastrukturEtat"];
  if (typeof f === "function") {
    const x = Number((f as (w: World) => number)(w));
    if (Number.isFinite(x)) return { stufe: clamp(x, -2, 2), quelle: "haushalt" };
  }
  return { stufe: clamp(Haushalt.stufeVon(w, "investitionen"), -2, 2), quelle: "posten" };
}

/** Wie der Etat den Preis verschiebt: Ein voller Etat trägt den Bau aus dem Haushalt (weniger Kapital, weniger neue Schulden). Spielparameter. */
export function finanzierung(w: World): { pk: number; schulden: number; stufe: number; quelle: "etat" | "haushalt" | "posten" } {
  const e = etatStufe(w);
  return { pk: 1 - 0.1 * e.stufe, schulden: 1 - 0.2 * e.stufe, ...e };
}

// ---------------------------------------------------------------------------
// Zustand

type InfraZeile = { strasse_km: number; schiene_km: number; flughaefen: number; krankenhaeuser: number };
const infra = INFRA.provinzen as unknown as Record<string, InfraZeile>;
const MITTE_BIP = PROVINZEN.reduce((s, p, i) => s + p.bipProKopf * (WEIGHTS[i] ?? 0), 0);

const istLand = (n: NetzDef): boolean => n.start.art === "land";

function knotenStart(w: World, id: string, p: number): number {
  const i = NET.index.get(id);
  return i === undefined ? 50 : w.net.start[i * PROVINCES + p]!;
}
function knotenJetzt(w: World, id: string, p: number): number {
  const i = NET.index.get(id);
  return i === undefined ? 50 : w.net.values[i * PROVINCES + p]!;
}

/** Startauslastung je Provinz: Rohverhältnis aus Mengen oder Netzwerten, auf das Landesmittel des Netzes skaliert. */
export function startAuslastung(w: World, n: NetzDef): number[] {
  if (n.start.art === "land") return [n.mittel];
  const roh = new Array<number>(PROVINCES).fill(0);
  if (n.start.art === "menge") {
    const st = n.start;
    const nachfrage = PROVINZEN.map((p) => p.bevoelkerung * Math.pow(p.bipProKopf / MITTE_BIP, st.wirtschaft));
    const sN = nachfrage.reduce((a, b) => a + b, 0);
    const menge = PROVINZEN.map((p) => infra[String(p.plaka)]?.[st.feld] ?? 0);
    const sM = menge.reduce((a, b) => a + b, 0);
    for (let p = 0; p < PROVINCES; p++) {
      const m = menge[p] ?? 0;
      if (m <= 0 || sM <= 0) continue;
      roh[p] = Math.pow(nachfrage[p]! / sN / (m / sM), 0.25);
    }
  } else {
    const st = n.start;
    const werte = Array.from({ length: PROVINCES }, (_, p) => Math.max(5, knotenStart(w, st.knoten, p)));
    const mitte = werte.reduce((s, v, p) => s + v * (WEIGHTS[p] ?? 0), 0);
    for (let p = 0; p < PROVINCES; p++) roh[p] = Math.pow(st.gut ? mitte / werte[p]! : werte[p]! / mitte, 0.5);
  }
  let s = 0;
  let g = 0;
  for (let p = 0; p < PROVINCES; p++) {
    if (roh[p]! <= 0) continue;
    s += roh[p]! * (WEIGHTS[p] ?? 0);
    g += WEIGHTS[p] ?? 0;
  }
  const mittel = g > 0 ? s / g : 1;
  return roh.map((r) => (r > 0 ? Math.round(clamp((n.mittel * r) / mittel, START_GRENZEN.min, START_GRENZEN.max) * 1000) / 1000 : 0));
}

function neuerStand(w: World, n: NetzDef): NetzStand {
  const start = startAuslastung(w, n);
  return { start, nachfrage: [...start], basis: start.map(() => 1), induziert: start.map(() => 0), kap: start.map(() => 1) };
}

const leererZustand = (): InfrastrukturZustand => ({ v: 1, netze: {} as Record<NetzId, NetzStand>, ausbau: {}, gebeten: {}, leerKosten: 0, gemeldet: {} });

/** Der Zustand der Netze; ältere Spielstände legen ihn beim ersten Zugriff an (Startauslastung aus Daten und Startwerten des Netzes). */
export function infraZustand(w: World): InfrastrukturZustand {
  const sp = w.spiel;
  if (!sp) throw new Error("Ohne Spielschleife gibt es keine Netze.");
  sp.infrastruktur ??= leererZustand();
  const z = sp.infrastruktur;
  z.ausbau ??= {};
  z.gebeten ??= {};
  z.gemeldet ??= {};
  z.leerKosten ??= 0;
  z.vernachlaessigt ??= {};
  z.werkLast ??= {};
  // Netze, die ein späterer Stand hinzufügt, legen sich einzeln an
  for (const n of NETZE) z.netze[n.id] ??= neuerStand(w, n);
  return z;
}

const NUR_LESEN = new WeakMap<object, InfrastrukturZustand>();
/** Lesen ohne Anlegen: Karte, Linse und Ansichten verändern den Spielstand nicht (vor dem ersten Monat gilt ein berechneter Startzustand). */
function lies(w: World): InfrastrukturZustand {
  const sp = w.spiel;
  if (!sp) throw new Error("Ohne Spielschleife gibt es keine Netze.");
  if (sp.infrastruktur) return infraZustand(w);
  let z = NUR_LESEN.get(sp);
  if (!z) {
    z = leererZustand();
    for (const n of NETZE) z.netze[n.id] = neuerStand(w, n);
    NUR_LESEN.set(sp, z);
  }
  return z;
}
const laufendeIds = (w: World): Set<string> => new Set((w.spiel?.reich?.laufend ?? []).map((l) => l.id));

// ---------------------------------------------------------------------------
// Auslastung

/** Wie stark ein Treiber (Tourismus, Export, Industrie) die Nachfrage gegenüber dem Start verschiebt. */
function treiberFaktor(w: World, n: NetzDef, p: number): number {
  if (!n.treiber) return 1;
  const tr = n.treiber;
  if (p < 0) {
    let s = 0;
    let s0 = 0;
    for (let q = 0; q < PROVINCES; q++) {
      s += knotenJetzt(w, tr.knoten, q) * (WEIGHTS[q] ?? 0);
      s0 += knotenStart(w, tr.knoten, q) * (WEIGHTS[q] ?? 0);
    }
    return clamp(1 + tr.gewicht * (s / Math.max(5, s0) - 1), 0.6, 1.5);
  }
  return clamp(1 + tr.gewicht * (knotenJetzt(w, tr.knoten, p) / Math.max(5, knotenStart(w, tr.knoten, p)) - 1), 0.6, 1.5);
}

/** Auslastung eines Netzes in einer Provinz (Kfz-Kennziffer) oder im Land (`plaka` 0 bzw. Häfen); `null`, wo es das Netz nicht gibt. */
export function auslastung(w: World, netz: NetzId, plaka = 0): number | null {
  const n = NETZ_NACH_ID[netz];
  const s = lies(w).netze[netz];
  if (istLand(n)) return clamp((s.nachfrage[0]! * treiberFaktor(w, n, -1)) / Math.max(0.1, s.kap[0]!), 0, AUSLASTUNG_MAX);
  if (plaka <= 0) return landesMittel(w, netz);
  const p = plaka - 1;
  if (!(s.start[p]! > 0)) return null;
  return clamp((s.nachfrage[p]! * treiberFaktor(w, n, p)) / Math.max(0.1, s.kap[p]!), 0, AUSLASTUNG_MAX);
}

/** Landesmittel der Auslastung, nach Bevölkerung gewichtet, über die Provinzen mit diesem Netz. */
export function landesMittel(w: World, netz: NetzId): number {
  const n = NETZ_NACH_ID[netz];
  if (istLand(n)) return auslastung(w, netz, 0)!;
  let s = 0;
  let g = 0;
  for (let p = 1; p <= PROVINCES; p++) {
    const a = auslastung(w, netz, p);
    if (a === null) continue;
    s += a * (WEIGHTS[p - 1] ?? 0);
    g += WEIGHTS[p - 1] ?? 0;
  }
  return g > 0 ? s / g : 0;
}

/** Wie fertige Ausbauten nach ihrem Zustand wirken: neu (90) voll, verfallen nur noch zum Teil (Spielparameter). */
export const zustandFaktor = (zustand: number): number => clamp(0.4 + (0.6 * zustand) / 90, 0.4, 1.05);

/** Rechnet die wirksame Kapazität aus Basis und fertigen Ausbauten (nach Zustand im Bestand des Reiches). */
function rechneKapazitaet(w: World, z: InfrastrukturZustand): void {
  const bestand = reichZustand(w).bestand;
  for (const n of NETZE) {
    const s = z.netze[n.id];
    for (let p = 0; p < s.kap.length; p++) s.kap[p] = s.basis[p] ?? 1;
  }
  for (const [id, e] of Object.entries(z.ausbau)) {
    const b = bestand[id];
    if (!e.fertig || !b) continue;
    const s = z.netze[e.netz];
    const plus = e.plus * zustandFaktor(b.zustand);
    if (istLand(NETZ_NACH_ID[e.netz]) || !e.provinzen.length) s.kap[0] = (s.kap[0] ?? 1) + plus;
    else for (const pl of e.provinzen) s.kap[pl - 1] = (s.kap[pl - 1] ?? 1) + plus;
  }
}

// ---------------------------------------------------------------------------
// Der Monat

/** Druck der Überlast gegenüber dem Start: positiv bremst, negativ entlastet (−1 bis 1). */
export function druck(a: number, start: number): number {
  const ref = Math.max(SCHWELLE.voll, start);
  return clamp((Math.max(a, SCHWELLE.voll) - ref) / 0.3, -1, 1);
}

/** Stärke, mit der der Druck die Knoten bewegt (Spielparameter, kalibriert am Mess-Tor: bremst spürbar, keine Dauerkrise); für Messläufe veränderbar. */
export const INFRA_PARAMETER = { druck: 0.6 };

/**
 * Preis einer liegengelassenen Bitte (Spielparameter, am Mess-Tor so gesetzt, dass Nichtstun nicht besser abschneidet als eine
 * geprüfte Antwort): Das Vertrauen vor Ort sinkt, das bittende Ressort ist gekränkt, und ein Jahr lang schlägt die Überlast dort
 * stärker in Ärger um. Eine spätere Antwort (Ausbau oder Alternative) hebt den Aufschlag auf.
 */
export const IGNORIERT = { vertrauen: -5, landesweit: -0.5, loyalitaet: -3, groll: 4, druckFaktor: 2, dauer: 365 };

/** Überlastdruck an einem Ort; nach einer liegengelassenen Bitte schlägt er dort stärker durch (Entlastung bleibt unverändert). */
const ortsDruck = (z: InfrastrukturZustand, netz: NetzId, plaka: number, tag: number, d: number): number =>
  d > 0 && (z.vernachlaessigt?.[`${netz}:${plaka}`] ?? -1) > tag ? d * IGNORIERT.druckFaktor : d;

/** Die Frist einer Bitte ist ohne Antwort verstrichen (oder die Bitte wurde abgelehnt), und das Netz ist weiter überlastet. */
function liegenGelassen(w: World, z: InfrastrukturZustand, b: Bitte): void {
  const sp = w.spiel!;
  (z.vernachlaessigt ??= {})[`${b.netz}:${b.plaka}`] = w.day + IGNORIERT.dauer;
  // Vor Ort spürbar, landesweit als Nachricht „die Regierung lässt die Region im Stich“
  if (b.plaka > 0) wirke(w, "vertrauen_regierung", IGNORIERT.vertrauen, [b.plaka]);
  wirke(w, "vertrauen_regierung", IGNORIERT.landesweit);
  const netz = t(`infra.netz.${b.netz}`);
  const ort = ortName(b.plaka);
  const m = sp.figuren.find((f) => f.imAmt && f.amt === AMT_FUER[b.netz]);
  if (m) {
    loyalitaetVerschieben(m, IGNORIERT.loyalitaet);
    grollVerschieben(w, m, IGNORIERT.groll);
    merke(w, m, t("infra.ignoriert.merke", { netz, ort }));
  }
  addLog(w, "ereignis", t("infra.log.ignoriert", { netz, ort }), t(m ? "infra.log.ignoriert.warum" : "infra.log.ignoriert.warum_ohne", { name: m?.name ?? "" }));
}

/** Eine Antwort auf den Engpass hebt den Aufschlag der liegengelassenen Bitte auf. */
function beantwortet(z: InfrastrukturZustand, netz: NetzId, provinzen: number[]): void {
  if (!z.vernachlaessigt) return;
  for (const k of Object.keys(z.vernachlaessigt)) {
    const [n, pl] = k.split(":");
    if (n === netz && (!provinzen.length || provinzen.includes(Number(pl)))) delete z.vernachlaessigt[k];
  }
}

/**
 * Zusätzliche Last fertiger Werke auf die Netze (Spielparameter): Eine Chipfabrik braucht für Reinstwasser sehr viel Wasser; im Spiel
 * steigt die Wassernachfrage am Standort dauerhaft um einen Teil der Startnachfrage. Werke, die schon zu Beginn standen, stecken im Start.
 */
export const WERK_LAST: Record<string, { netz: NetzId; provinzen: number[]; plus: number }> = {
  ki_chipfab: { netz: "wasser", provinzen: [41], plus: 0.05 },
};

export function infrastrukturMonat(w: World): void {
  const sp = w.spiel;
  if (!sp || sp.ende) return;
  const z = infraZustand(w);
  const bestand = reichZustand(w).bestand;
  const wachstum = Number.isFinite(w.economy.growth) ? w.economy.growth : 0;

  // 1. Fertige Ausbauten: Kapazität dazu, induzierte Nachfrage vormerken
  for (const [id, e] of Object.entries(z.ausbau)) {
    if (e.fertig || !bestand[id]) continue;
    e.fertig = true;
    const n = NETZ_NACH_ID[e.netz];
    const s = z.netze[e.netz];
    const orte = istLand(n) || !e.provinzen.length ? [0] : e.provinzen.map((pl) => pl - 1);
    for (const p of orte) {
      const a = (s.nachfrage[p] ?? 0) / Math.max(0.1, s.kap[p] ?? 1);
      s.induziert[p] = (s.induziert[p] ?? 0) + n.induziert * e.plus * Math.min(1.2, a);
    }
    addLog(w, "entscheidung", t("infra.log.fertig", { name: reichName(w, id) }), t("infra.log.fertig.warum", { netz: t(`infra.netz.${e.netz}`) }));
  }
  for (const [id, last] of Object.entries(WERK_LAST)) {
    if (!bestand[id] || (z.werkLast ??= {})[id] !== undefined) continue;
    z.werkLast[id] = w.day;
    if (sp.wissensbaum?.start.includes(id)) continue;
    const s = z.netze[last.netz];
    for (const pl of last.provinzen) if ((s.start[pl - 1] ?? 0) > 0) s.nachfrage[pl - 1] = Math.round(s.nachfrage[pl - 1]! * (1 + last.plus) * 10000) / 10000;
  }
  rechneKapazitaet(w, z);

  // 2. Laufender Ausbau aus dem Etat (ohne eigenes Vorhaben): ein voller Etat hält mit, ein gekürzter lässt die Netze zurückfallen.
  //    Nachfrage: Trend und Wirtschaft; induzierte Nachfrage füllt neue Kapazität nach und nach
  const etat = clamp(1 + 0.4 * etatStufe(w).stufe, 0.2, 1.8);
  for (const n of NETZE) {
    const s = z.netze[n.id];
    const eigen = 1 + (n.eigen * etat) / 100 / 12;
    for (let p = 0; p < s.basis.length; p++) if (s.start[p]! > 0) s.basis[p] = Math.round(s.basis[p]! * eigen * 100000) / 100000;
    const f = 1 + (n.trend + n.elast * wachstum) / 100 / 12;
    const land = istLand(n);
    for (let p = 0; p < s.nachfrage.length; p++) {
      if (!(s.start[p]! > 0)) continue;
      let x = s.nachfrage[p]! * f;
      const ind = s.induziert[p] ?? 0;
      if (ind > 1e-4) {
        const d = ind * 0.04;
        s.induziert[p] = ind - d;
        x += d;
      }
      // Wer im Stau steht, fährt irgendwann nicht mehr: Die Nachfrage bleibt unter der Obergrenze der Auslastung
      const tr = treiberFaktor(w, n, land ? -1 : p);
      s.nachfrage[p] = Math.round(Math.min(x, (AUSLASTUNG_MAX * s.kap[p]!) / tr) * 10000) / 10000;
    }
  }
  rechneKapazitaet(w, z);

  // 3. Überlast bremst, Entlastung hilft; leere Kapazität kostet Unterhalt
  for (const n of NETZE) {
    const s = z.netze[n.id];
    if (istLand(n)) {
      const d = ortsDruck(z, n.id, 0, w.day, druck(auslastung(w, n.id)!, s.start[0]!));
      if (Math.abs(d) > 0.02) for (const b of n.bremsen) wirke(w, b.knoten, b.d * d * INFRA_PARAMETER.druck);
      continue;
    }
    // Provinzen mit demselben Druck bekommen einen gemeinsamen Stoß (spart Rechenzeit, gleiche Wirkung)
    const gruppen = new Map<number, number[]>();
    for (let p = 1; p <= PROVINCES; p++) {
      const a = auslastung(w, n.id, p);
      if (a === null) continue;
      const d = Math.round(ortsDruck(z, n.id, p, w.day, druck(a, s.start[p - 1]!)) * 50) / 50;
      if (Math.abs(d) < 0.02) continue;
      const g = gruppen.get(d);
      if (g) g.push(p);
      else gruppen.set(d, [p]);
    }
    for (const [d, orte] of gruppen) for (const b of n.bremsen) wirke(w, b.knoten, b.d * d * INFRA_PARAMETER.druck, orte);
  }
  let leer = 0;
  for (const [id, e] of Object.entries(z.ausbau)) {
    const b = bestand[id];
    if (!e.fertig || !b) continue;
    const orte = e.provinzen.length && !istLand(NETZ_NACH_ID[e.netz]) ? e.provinzen : [0];
    for (const pl of orte) {
      const a = auslastung(w, e.netz, pl) ?? 1;
      if (a < SCHWELLE.leer) leer += (e.plus * zustandFaktor(b.zustand) * (SCHWELLE.leer - a)) / SCHWELLE.leer / orte.length;
    }
  }
  z.leerKosten = Math.round(leer * 0.004 * 10000) / 10000;
  if (z.leerKosten > 0) w.economy.debtRatio += z.leerKosten;

  // 4. Meldung bei neuer Überlast (je Netz höchstens alle sechs Monate) und die eine Bitte des Monats
  for (const n of NETZE) {
    const top = engpaesse(w, n.id, 1)[0];
    if (!top || top.a < SCHWELLE.ueberlast || top.a <= top.start + 0.04) continue;
    if (w.day - (z.gemeldet[n.id] ?? -1e9) < 180) continue;
    z.gemeldet[n.id] = w.day;
    addLog(w, "ereignis", t("infra.log.ueberlast", { netz: t(`infra.netz.${n.id}`), ort: ortName(top.plaka), a: Math.round(top.a * 100) }), t("infra.log.ueberlast.warum"));
  }
  waehleBitte(w, z);
}

/** Die am stärksten belasteten Orte eines Netzes (für Hinweise, Bitten und Pakete). */
export function engpaesse(w: World, netz: NetzId, n = 5): { plaka: number; a: number; start: number }[] {
  const def = NETZ_NACH_ID[netz];
  const s = lies(w).netze[netz];
  if (istLand(def)) return [{ plaka: 0, a: auslastung(w, netz, 0)!, start: s.start[0]! }];
  const out: { plaka: number; a: number; start: number }[] = [];
  for (let p = 1; p <= PROVINCES; p++) {
    const a = auslastung(w, netz, p);
    if (a !== null) out.push({ plaka: p, a, start: s.start[p - 1]! });
  }
  return out.sort((x, y) => y.a - x.a || x.plaka - y.plaka).slice(0, n);
}

const ortName = (plaka: number): string => (plaka > 0 ? (PROVINZEN[plaka - 1]?.name ?? String(plaka)) : t("infra.ort.land"));
const reichName = (w: World, id: string): string => w.spiel?.reich?.regional?.[id]?.def.name ?? id;

// ---------------------------------------------------------------------------
// Ausbau über die Bauvorhaben des Reiches

/** Läuft oder steht in diesen Provinzen schon ein Ausbau desselben Netzes, der noch nicht fertig ist? */
function laeuftSchon(w: World, netz: NetzId, provinzen: number[]): string | null {
  const z = lies(w);
  const laufend = laufendeIds(w);
  for (const [id, e] of Object.entries(z.ausbau)) {
    if (e.netz !== netz || !laufend.has(id)) continue;
    if (!provinzen.length || !e.provinzen.length || e.provinzen.some((p) => provinzen.includes(p))) return id;
  }
  return null;
}

/** Größe der Provinz für den Preis: Wurzel des Bevölkerungsverhältnisses zur mittleren Provinz, begrenzt (Spielparameter). */
function groesse(provinzen: number[]): number {
  if (!provinzen.length) return 1;
  const mittel = PROVINZEN.reduce((s, p) => s + p.bevoelkerung, 0) / PROVINZEN.length;
  return provinzen.reduce((s, pl) => s + clamp(Math.sqrt((PROVINZEN[pl - 1]?.bevoelkerung ?? mittel) / mittel), 0.5, 3), 0);
}

const SCHLECHT_HOCH = new Set(["stau", "mieten", "wartezeiten", "p_stromausfaelle", "p_wassermangel", "p_wohnungsnot"]);

export interface AusbauAngebot {
  ok: boolean;
  grund?: string;
  def?: Vorhaben;
  pflege?: Vorhaben;
  /** Auslastung heute und nach dem Ausbau (bei heutiger Nachfrage, ohne induzierte Nachfrage) */
  vorher?: number;
  nachher?: number;
  pk?: number;
  monate?: number;
  schulden?: number;
}

function provinzenFuer(a: AusbauDef, plaka: number): number[] {
  return istLand(NETZ_NACH_ID[a.netz]) || plaka <= 0 ? [] : [plaka];
}

/** Baut die Definition eines Ausbaus (oder eines Pakets) als Vorhaben des Reiches. */
function baueDef(w: World, a: AusbauDef, provinzen: number[], paket?: PaketDef): { def: Vorhaben; pflege: Vorhaben } {
  const z = lies(w);
  const n = NETZ_NACH_ID[a.netz];
  const fin = finanzierung(w);
  const f = groesse(provinzen);
  const rabatt = paket ? 1 - paket.rabatt : 1;
  const schluessel = `infra_netz_${paket ? paket.id : a.id}@${provinzen.length ? provinzen.join("-") : "land"}`;
  let nr = 1;
  while (z.ausbau[`${schluessel}_${nr}`] || w.spiel?.reich?.regional?.[`${schluessel}_${nr}`]) nr++;
  const id = `${schluessel}_${nr}`;
  const zentrum = [...provinzen].sort((x, y) => (PROVINZEN[y - 1]?.bevoelkerung ?? 0) - (PROVINZEN[x - 1]?.bevoelkerung ?? 0))[0];
  const mitte = zentrum ? (MITTEN as unknown as Record<string, [number, number]>)[String(zentrum)] : undefined;
  const ortText = provinzen.length ? (provinzen.length === 1 ? ortName(provinzen[0]!) : t("infra.ort.mehrere", { n: provinzen.length, erste: ortName(zentrum!) })) : t("infra.ort.land");
  const name = paket ? t(`infra.paket.${paket.id}.name`) : `${t(`infra.ausbau.${a.id}.name`)}: ${ortText}`;
  const zeichen = SCHLECHT_HOCH.has(n.hauptknoten) ? -1 : 1;
  const def: Vorhaben = {
    id,
    bereich: "infrastruktur",
    klasse: paket ? "grossprojekt" : "ausbau",
    name,
    text: t("infra.vorhaben.text", { was: t(`infra.ausbau.${a.id}.text`), plus: Math.round(a.plus * 100), netz: t(`infra.netz.${a.netz}`), ort: ortText }),
    ...(provinzen.length ? { provinzen } : {}),
    ...(mitte && zentrum ? { ort: { lon: mitte[0], lat: mitte[1], plaka: zentrum, name: ortText } } : {}),
    voraus: [],
    kosten: {
      pk: r1((provinzen.length ? provinzen.reduce((x, pl) => x + a.pk * Math.sqrt(groesse([pl])), 0) : a.pk) * rabatt * fin.pk),
      bau: Math.max(40, Math.round(a.bau * f * rabatt)),
      monate: Math.max(6, Math.round(a.monate * (paket ? 1.3 : 1))),
      verwaltung: r1(a.verwaltung * (paket ? 1.5 : 1)),
      schulden: Math.round(a.schulden * f * rabatt * fin.schulden * 1000) / 1000,
    },
    abschluss: [stoss(n.hauptknoten, 1.5 * zeichen, provinzen.length ? provinzen : undefined)],
    bauwirkung: [{ t: "knoten", id: "bauwirtschaft", d: 0.05, ...(provinzen.length ? { provinzen } : {}) }],
    unterhalt: r1(a.unterhalt * Math.max(1, provinzen.length * 0.6)),
    kehrseite: t(`infra.ausbau.${a.id}.kehrseite`),
    ...(a.verlierer ? { verlierer: a.verlierer } : {}),
    bild: n.bild,
    ...(paket ? { ueberzug: paket.ueberzug } : {}),
    quelle: t("infra.vorhaben.quelle", { quelle: n.quelle }),
    instanzVon: "infra_netz",
  };
  const pflege = instandsetzung(def, {
    id: `sanierung_${id}`,
    bau: Math.max(30, Math.round(def.kosten.bau * 0.08)),
    monate: 6,
    hub: 26,
    stoesse: [stoss("wartungszustand", 2, provinzen.length ? provinzen : undefined)],
    kehrseite: t("infra.pflege.kehrseite"),
  });
  return { def, pflege };
}

/** Preis, Dauer und Wirkung eines Ausbaus in einer Provinz (Häfen: im ganzen Land), ohne etwas zu verändern. */
export function ausbauAngebot(w: World, ausbauId: string, plaka: number, vergabe: Vergabe = "ausschreibung"): AusbauAngebot {
  if (!w.spiel) return { ok: false, grund: t("infra.fehler.kein_spiel") };
  const a = AUSBAU_NACH_ID[ausbauId];
  if (!a) return { ok: false, grund: t("infra.fehler.unbekannt") };
  const provinzen = provinzenFuer(a, plaka);
  if (provinzen.length && a.braucht && !((infra[String(plaka)]?.[a.braucht] ?? 0) > 0)) return { ok: false, grund: t(`infra.fehler.braucht.${a.braucht}`, { ort: ortName(plaka) }) };
  const vorher = auslastung(w, a.netz, provinzen[0] ?? 0);
  if (vorher === null) return { ok: false, grund: t("infra.fehler.kein_netz", { ort: ortName(plaka) }) };
  const { def, pflege } = baueDef(w, a, provinzen);
  const s = lies(w).netze[a.netz];
  const k = s.kap[provinzen.length ? provinzen[0]! - 1 : 0] ?? 1;
  const angebot = vergabeAngebot(def, vergabe);
  return { ok: true, def, pflege, vorher, nachher: (vorher * k) / (k + a.plus), pk: angebot.pk, monate: angebot.vorlauf + angebot.monate, schulden: def.kosten.schulden ?? 0 };
}

/** Legt das Vorhaben im Reich an und beginnt es mit der gewählten Vergabe; scheitert der Beginn, bleibt nichts zurück. */
function lege(w: World, a: AusbauDef, provinzen: number[], def: Vorhaben, pflege: Vorhaben, vergabe: Vergabe, paket?: PaketDef): { ok: boolean; text: string; why?: string; id?: string } {
  const r = reichZustand(w);
  (r.regional ??= {})[def.id] = { vorlage: `infra_netz:${paket ? paket.id : a.id}`, provinzen, def, pflege, angelegt: w.date };
  registriereVorhaben(def);
  registriereVorhaben(pflege);
  const b = beginne(w, def.id, vergabe);
  if (!b.ok) {
    delete r.regional![def.id];
    return b;
  }
  const z = infraZustand(w);
  z.ausbau[def.id] = { ausbau: a.id, netz: a.netz, provinzen, plus: a.plus, ...(paket ? { paket: paket.id } : {}) };
  for (const p of provinzen.length ? provinzen : [0]) z.gebeten[`infra:${a.netz}:${p}`] = w.day;
  if (z.bitte && z.bitte.netz === a.netz && (provinzen.includes(z.bitte.plaka) || !provinzen.length)) delete z.bitte;
  beantwortet(z, a.netz, provinzen);
  return { ...b, id: def.id };
}

/** Investieren: ein Ausbau in einer Provinz (Häfen: `plaka` 0), gebaut über die Vorhaben des Reiches mit Vergabe, Preis und Dauer. */
export function investiere(w: World, ausbauId: string, plaka: number, vergabe: Vergabe = "ausschreibung"): { ok: boolean; text: string; why?: string; id?: string } {
  const an = ausbauAngebot(w, ausbauId, plaka, vergabe);
  if (!an.ok || !an.def || !an.pflege) return { ok: false, text: an.grund ?? t("infra.fehler.unbekannt") };
  const a = AUSBAU_NACH_ID[ausbauId]!;
  const provinzen = provinzenFuer(a, plaka);
  const schon = laeuftSchon(w, a.netz, provinzen);
  if (schon) return { ok: false, text: t("infra.fehler.laeuft", { name: reichName(w, schon) }) };
  return lege(w, a, provinzen, an.def, an.pflege, vergabe);
}

export interface PaketAngebot {
  ok: boolean;
  grund?: string;
  paket: PaketDef;
  provinzen: number[];
  def?: Vorhaben;
  pk?: number;
  schulden?: number;
  monate?: number;
  /** Was dieselben Ausbauten einzeln kosten würden (Kapital) */
  einzelnPk?: number;
}

/** Ein Großinvestitionsprogramm: derselbe Ausbau in den am stärksten belasteten Provinzen, mit Rabatt und höherem Risiko. */
export function paketAngebot(w: World, paketId: string, vergabe: Vergabe = "ausschreibung"): PaketAngebot {
  const paket = PAKETE.find((p) => p.id === paketId);
  if (!paket) return { ok: false, grund: t("infra.fehler.unbekannt"), paket: PAKETE[0]!, provinzen: [] };
  const a = AUSBAU_NACH_ID[paket.ausbau]!;
  const laufend = laufendeIds(w);
  const belegt = new Set<number>();
  for (const [id, e] of Object.entries(lies(w).ausbau)) if (e.netz === a.netz && laufend.has(id)) e.provinzen.forEach((p) => belegt.add(p));
  const kandidaten = engpaesse(w, a.netz, PROVINCES).filter((x) => x.plaka > 0 && !belegt.has(x.plaka) && (!a.braucht || (infra[String(x.plaka)]?.[a.braucht] ?? 0) > 0));
  const provinzen = kandidaten.slice(0, paket.provinzen).map((x) => x.plaka).sort((x, y) => x - y);
  if (provinzen.length < 2) return { ok: false, grund: t("infra.fehler.paket_orte"), paket, provinzen };
  const { def } = baueDef(w, a, provinzen, paket);
  const ang = vergabeAngebot(def, vergabe);
  const fin = finanzierung(w);
  const einzelnPk = r1(provinzen.reduce((s, p) => s + a.pk * Math.sqrt(groesse([p])) * fin.pk, 0));
  return { ok: true, paket, provinzen, def, pk: ang.pk, schulden: def.kosten.schulden ?? 0, monate: ang.vorlauf + ang.monate, einzelnPk };
}

export function starteProgramm(w: World, paketId: string, vergabe: Vergabe = "ausschreibung"): { ok: boolean; text: string; why?: string; id?: string } {
  const an = paketAngebot(w, paketId, vergabe);
  if (!an.ok || !an.def) return { ok: false, text: an.grund ?? t("infra.fehler.unbekannt") };
  const a = AUSBAU_NACH_ID[an.paket.ausbau]!;
  if ([...laufendeIds(w)].some((id) => id.startsWith(`infra_netz_${an.paket.id}@`))) {
    return { ok: false, text: t("infra.fehler.paket_laeuft") };
  }
  const { def, pflege } = baueDef(w, a, an.provinzen, an.paket);
  const r = lege(w, a, an.provinzen, def, pflege, vergabe, an.paket);
  if (r.ok) addLog(w, "entscheidung", t("infra.log.paket", { name: def.name, n: an.provinzen.length }), t("infra.log.paket.warum", { rabatt: Math.round(an.paket.rabatt * 100) }));
  return r;
}

/** Die günstigere Alternative eines Ministers: wirkt sofort und kleiner (Nachfrage lenken oder vorhandene Anlagen besser nutzen). */
export function alternative(w: World, netz: NetzId, plaka: number): { ok: boolean; text: string } {
  const sp = w.spiel;
  if (!sp) return { ok: false, text: t("infra.fehler.kein_spiel") };
  const alt = ALTERNATIVEN[netz];
  const z = infraZustand(w);
  const thema = `infra:${netz}:${plaka}`;
  if (w.day - (z.gebeten[`alt:${thema}`] ?? -1e9) < 720) return { ok: false, text: t("infra.fehler.alternative_frisch") };
  if (!kannZahlen(sp.kapital, alt.pk)) return { ok: false, text: t("infra.fehler.kapital", { pk: alt.pk }) };
  const s = z.netze[netz];
  const p = istLand(NETZ_NACH_ID[netz]) ? 0 : plaka - 1;
  if (!(s.start[p]! > 0)) return { ok: false, text: t("infra.fehler.kein_netz", { ort: ortName(plaka) }) };
  sp.kapital -= alt.pk;
  verbrauche(w, AUFMERKSAMKEIT_KOSTEN.programmSchritt, t(`infra.alt.${netz}.name`));
  if (alt.kap) s.basis[p] = Math.round(s.basis[p]! * alt.kap * 1000) / 1000;
  if (alt.nachfrage) s.nachfrage[p] = Math.round(s.nachfrage[p]! * alt.nachfrage * 10000) / 10000;
  for (const x of alt.wirk) if (NET.index.has(x.knoten)) wirke(w, x.knoten, x.d, plaka > 0 ? [plaka] : null);
  z.gebeten[`alt:${thema}`] = w.day;
  z.gebeten[thema] = w.day;
  if (z.bitte && z.bitte.netz === netz && z.bitte.plaka === plaka) delete z.bitte;
  beantwortet(z, netz, plaka > 0 ? [plaka] : []);
  rechneKapazitaet(w, z);
  addLog(w, "entscheidung", t("infra.log.alternative", { was: t(`infra.alt.${netz}.name`), ort: ortName(plaka) }), t(`infra.alt.${netz}.text`));
  return { ok: true, text: t("infra.alt.ok", { was: t(`infra.alt.${netz}.name`), ort: ortName(plaka) }) };
}

// ---------------------------------------------------------------------------
// Die Bitte des Ministers (sim/ministerfluss.ts legt sie als Vorlage auf den Tisch)

/** Welche Ressorts für welches Netz bitten (die vorhandenen Ämter des Kabinetts) */
const AMT_FUER: Record<NetzId, Amt> = {
  strasse: "wirtschaft", bahn: "wirtschaft", hafen: "wirtschaft", flughafen: "wirtschaft", strom: "wirtschaft",
  wasser: "inneres", internet: "wirtschaft", wohnen: "inneres", kliniken: "inneres",
};

/** Welcher Ausbau zu einer Bitte passt (bei der Bahn der gewöhnliche Ausbau; die Schnellbahn steht in der Netzansicht) */
const AUSBAU_FUER: Record<NetzId, string> = {
  strasse: "autobahn", bahn: "bahn", hafen: "hafen", flughafen: "flughafen", strom: "kraftwerk", wasser: "wasser", internet: "glasfaser", wohnen: "wohnungen", kliniken: "klinik",
};

/** Einmal im Monat: Bleibt die offene Bitte gültig, oder kommt der neue größte Engpass auf den Tisch? */
function waehleBitte(w: World, z: InfrastrukturZustand): void {
  const alt = z.bitte;
  if (alt) {
    const a = auslastung(w, alt.netz, alt.plaka);
    if (a !== null && a >= SCHWELLE.ueberlast && w.day - alt.tag < 60) return;
    if (a !== null && a >= SCHWELLE.ueberlast) liegenGelassen(w, z, alt);
    delete z.bitte;
  }
  if (z.vernachlaessigt) for (const [k, bis] of Object.entries(z.vernachlaessigt)) if (bis <= w.day) delete z.vernachlaessigt[k];
  let best: { netz: NetzId; plaka: number; wert: number } | null = null;
  for (const n of NETZE) {
    for (const e of engpaesse(w, n.id, 6)) {
      if (e.a < SCHWELLE.ueberlast) continue;
      const thema = `infra:${n.id}:${e.plaka}`;
      if (w.day - (z.gebeten[thema] ?? -1e9) < 240) continue;
      if (laeuftSchon(w, n.id, e.plaka > 0 ? [e.plaka] : [])) continue;
      // Rang: Überlast, Anstieg seit dem Start, Gewicht der Provinz
      const wert = (e.a - 1) + 1.5 * Math.max(0, e.a - e.start) + 0.6 * (e.plaka > 0 ? (WEIGHTS[e.plaka - 1] ?? 0) : 0.2);
      if (!best || wert > best.wert) best = { netz: n.id, plaka: e.plaka, wert };
    }
  }
  if (!best) return;
  const thema = `infra:${best.netz}:${best.plaka}`;
  z.gebeten[thema] = w.day;
  z.bitte = { id: `${thema}:${w.date.slice(0, 7)}`, netz: best.netz, plaka: best.plaka, tag: w.day };
}

export interface BitteEntwurf {
  id: string;
  thema: string;
  amt: Amt;
  titel: string;
  anlass: string[];
  optionen: VorlageOption[];
  tag: number;
  frist: number;
  tragweite: number;
}

/** Aktion einer Option der Bitte; ausgeführt über `fuehreAus`. */
export type InfraAktion = { art: "infrastruktur"; weg: "ausbau" | "alternative"; netz: NetzId; plaka: number; ausbau?: string };

function zeile(netz: NetzId, plaka: number, jetzt: number, ohne: number, mit: number, monate: number): NutzenZeile {
  return {
    id: `infra_${netz}`,
    name: t("infra.nutzen.zeile", { netz: t(`infra.netz.${netz}`), ort: ortName(plaka) }),
    art: "groesse",
    einheit: "von 100",
    jetzt: Math.round(jetzt * 100),
    ohne: Math.round(ohne * 100),
    mit: Math.round(mit * 100),
    monate,
    schlechtWennHoch: true,
    besser: mit < ohne - 0.01 ? true : mit > ohne + 0.01 ? false : null,
  };
}

/** Die Bitte als Entwurf einer Vorlage: ausbauen, die günstigere Alternative oder nichts tun, mit Nutzen-Zeilen. */
export function infrastrukturBitte(w: World): BitteEntwurf | null {
  const sp = w.spiel;
  if (!sp || sp.ende || !sp.infrastruktur?.bitte) return null;
  const b = sp.infrastruktur.bitte;
  const a = auslastung(w, b.netz, b.plaka);
  if (a === null) return null;
  const n = NETZ_NACH_ID[b.netz];
  const s = lies(w).netze[b.netz];
  const p = istLand(n) ? 0 : b.plaka - 1;
  const monate = 24;
  const wachstum = Number.isFinite(w.economy.growth) ? w.economy.growth : 0;
  const ohne = Math.min(AUSLASTUNG_MAX, a * Math.pow(1 + (n.trend + n.elast * wachstum) / 100, monate / 12));
  const ausbauId = AUSBAU_FUER[b.netz];
  const an = ausbauAngebot(w, ausbauId, b.plaka);
  const ausbau = AUSBAU_NACH_ID[ausbauId]!;
  const k = s.kap[p] ?? 1;
  const ohneInduziert = (ohne * k) / (k + ausbau.plus);
  // Der Ausbau steht erst nach der Bauzeit; in zwei Jahren wirkt er nur, wenn er dann fertig ist, und neuer Verkehr füllt einen Teil
  const fertigBis = (an.monate ?? 99) <= monate;
  const mitAusbau = fertigBis ? ohneInduziert + (ohne - ohneInduziert) * n.induziert * 0.5 : ohne;
  const alt = ALTERNATIVEN[b.netz];
  const mitAlt = (ohne * (alt.nachfrage ?? 1)) / (alt.kap ?? 1);
  const ort = ortName(b.plaka);
  const netzName = t(`infra.netz.${b.netz}`);
  const altFrisch = w.day - (sp.infrastruktur.gebeten[`alt:infra:${b.netz}:${b.plaka}`] ?? -1e9) < 720;
  const optionen: VorlageOption[] = [
    {
      id: "ausbau",
      label: t("infra.bitte.ausbau.label", { was: t(`infra.ausbau.${ausbauId}.name`), ort }),
      text: an.ok ? t("infra.bitte.ausbau.text", { monate: an.monate ?? 0, schulden: Math.round((an.schulden ?? 0) * 100) / 100 }) : (an.grund ?? ""),
      kosten: { pk: an.pk ?? 0, aufmerksamkeit: AUFMERKSAMKEIT_KOSTEN.reichVorhaben },
      folgen: [t("infra.bitte.ausbau.folge1", { plus: Math.round(ausbau.plus * 100) }), t("infra.bitte.ausbau.folge2", { induziert: Math.round(n.induziert * 100) })],
      nutzen: [zeile(b.netz, b.plaka, a, ohne, mitAusbau, monate)],
      dafuer: [t("infra.bitte.ausbau.dafuer")],
      dagegen: [t("infra.bitte.ausbau.dagegen")],
      verlierer: ausbau.verlierer ? [ausbau.verlierer] : [],
      aktion: { art: "infrastruktur", weg: "ausbau", netz: b.netz, plaka: b.plaka, ausbau: ausbauId },
      moeglich: an.ok && kannZahlen(sp.kapital, an.pk ?? 0),
      ...(an.ok ? (kannZahlen(sp.kapital, an.pk ?? 0) ? {} : { grund: t("infra.fehler.kapital", { pk: an.pk ?? 0 }) }) : { grund: an.grund ?? "" }),
      eigenesRessort: true,
    },
    {
      id: "alternative",
      label: t(`infra.alt.${b.netz}.name`),
      text: t(`infra.alt.${b.netz}.text`),
      kosten: { pk: alt.pk, aufmerksamkeit: AUFMERKSAMKEIT_KOSTEN.programmSchritt },
      folgen: [t("infra.bitte.alt.folge")],
      nutzen: [zeile(b.netz, b.plaka, a, ohne, mitAlt, monate)],
      dafuer: [t("infra.bitte.alt.dafuer")],
      dagegen: [t(`infra.alt.${b.netz}.dagegen`)],
      verlierer: [],
      aktion: { art: "infrastruktur", weg: "alternative", netz: b.netz, plaka: b.plaka },
      moeglich: !altFrisch && kannZahlen(sp.kapital, alt.pk),
      ...(altFrisch ? { grund: t("infra.fehler.alternative_frisch") } : kannZahlen(sp.kapital, alt.pk) ? {} : { grund: t("infra.fehler.kapital", { pk: alt.pk }) }),
    },
    {
      id: "nichts",
      label: t("infra.bitte.nichts.label"),
      kosten: { pk: 0, aufmerksamkeit: 0 },
      folgen: [t("infra.bitte.nichts.folge", { netz: netzName, ort, a: Math.round(ohne * 100) }), t("infra.bitte.nichts.folge2")],
      nutzen: [zeile(b.netz, b.plaka, a, ohne, ohne, monate)],
      dafuer: [t("infra.bitte.nichts.dafuer")],
      dagegen: [t("infra.bitte.nichts.dagegen")],
      verlierer: [],
      aktion: { art: "nichts" },
      moeglich: true,
    },
  ];
  return {
    id: b.id,
    thema: `infra:${b.netz}:${b.plaka}`,
    amt: AMT_FUER[b.netz],
    titel: t("infra.bitte.titel", { netz: netzName, ort }),
    anlass: [t("infra.bitte.anlass", { netz: netzName, ort, a: Math.round(a * 100), start: Math.round((s.start[p] ?? 0) * 100), ohne: Math.round(ohne * 100) })],
    optionen,
    tag: b.tag,
    frist: b.tag + 60,
    tragweite: clamp(0.25 + (a - 1) * 1.5 + (b.plaka > 0 ? (WEIGHTS[b.plaka - 1] ?? 0) * 2 : 0.2), 0.2, 0.8),
  };
}

/** Führt die Option einer Bitte aus (gerufen aus sim/ministerfluss.ts). */
export function fuehreAus(w: World, a: InfraAktion): { ok: boolean; text: string; why?: string } {
  if (a.weg === "alternative") return alternative(w, a.netz, a.plaka);
  return investiere(w, a.ausbau ?? AUSBAU_FUER[a.netz], a.plaka, "ausschreibung");
}

// ---------------------------------------------------------------------------
// Sichten für Oberfläche und Linse

export interface NetzSicht {
  id: NetzId;
  name: string;
  mittel: number;
  start: number;
  engpaesse: { plaka: number; name: string; a: number }[];
  laufend: number;
  fertig: number;
  quelle: string;
  land: boolean;
}

export function netzSichten(w: World): NetzSicht[] {
  const z = lies(w);
  const laufend = laufendeIds(w);
  return NETZE.map((n) => {
    const s = z.netze[n.id];
    let st = 0;
    let g = 0;
    for (let p = 0; p < s.start.length; p++) {
      if (!(s.start[p]! > 0)) continue;
      const gew = istLand(n) ? 1 : (WEIGHTS[p] ?? 0);
      st += s.start[p]! * gew;
      g += gew;
    }
    const eintraege = Object.entries(z.ausbau).filter(([, e]) => e.netz === n.id);
    return {
      id: n.id,
      name: t(`infra.netz.${n.id}`),
      mittel: landesMittel(w, n.id),
      start: g > 0 ? st / g : 0,
      engpaesse: engpaesse(w, n.id, 5).map((e) => ({ plaka: e.plaka, name: ortName(e.plaka), a: e.a })),
      laufend: eintraege.filter(([id]) => laufend.has(id)).length,
      fertig: eintraege.filter(([, e]) => e.fertig).length,
      quelle: n.quelle,
      land: istLand(n),
    };
  });
}

/** Höchste Auslastung je Provinz über alle Netze der Provinz (für die Linse „Belastung“). */
export function belastungJeProvinz(w: World): { plaka: number; a: number; netz: NetzId }[] {
  const out: { plaka: number; a: number; netz: NetzId }[] = [];
  for (let p = 1; p <= PROVINCES; p++) {
    let best: { a: number; netz: NetzId } | null = null;
    for (const n of NETZE) {
      if (istLand(n)) continue;
      const a = auslastung(w, n.id, p);
      if (a !== null && (!best || a > best.a)) best = { a, netz: n.id };
    }
    if (best) out.push({ plaka: p, ...best });
  }
  return out;
}

/** Zeilen für den Hover der Linse: die drei am stärksten belasteten Netze und laufende Ausbauten der Provinz. */
export function belastungZeilen(w: World, plaka: number): string[] {
  if (!w.spiel) return [];
  const z = lies(w);
  const netze = NETZE.filter((n) => !istLand(n))
    .map((n) => ({ n, a: auslastung(w, n.id, plaka) }))
    .filter((x): x is { n: NetzDef; a: number } => x.a !== null)
    .sort((x, y) => y.a - x.a)
    .slice(0, 3);
  const zeilen = netze.map((x) => t("infra.hover.netz", { netz: t(`infra.netz.${x.n.id}`), a: Math.round(x.a * 100), kap: Math.round((z.netze[x.n.id].kap[plaka - 1] ?? 1) * 100) }));
  const laufend = laufendeIds(w);
  const baut = Object.entries(z.ausbau).filter(([id, e]) => laufend.has(id) && e.provinzen.includes(plaka));
  for (const [id] of baut.slice(0, 2)) zeilen.push(t("infra.hover.bau", { name: reichName(w, id) }));
  return zeilen;
}

/** Alle Ausbauten, die in einer Provinz möglich sind (für die Netzansicht). */
export function ausbautenFuer(netz: NetzId): AusbauDef[] {
  return AUSBAUTEN.filter((a) => a.netz === netz);
}

export { PAKETE, NETZE, AUSBAUTEN };
