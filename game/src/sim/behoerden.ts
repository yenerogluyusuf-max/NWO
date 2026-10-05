// Behörden ausbauen: Personal, Technik, Reichweite je Behörde in Stufen 1 bis 5 (data/behoerden.ts).
//
// Ein Ausbauschritt kostet Kapital und Geld aus dem Ressortetat und braucht Monate; jede weitere Stufe bringt weniger als die vorige
// (abnehmender Ertrag) und kostet laufenden Unterhalt. Kürzen geht sofort, spart Unterhalt und kostet Erfahrung und Stimmung.
// Ab hohen Stufen gibt es ein Sonderinstrument. Der Dienst (MİT) liest seine Stufen hier ab und rechnet sie in sim/welt-dienst.ts
// in Kapazität, Erfolg, Netze und Lagebild um. Dieses Modul importiert sim/welt-dienst.ts nicht (kein Kreis).
//
// Geld: Jede Behörde gehört zu einem Ressort, das ein Haushaltsregler bezahlt (data/behoerden.ts `RESSORT_POSTEN`). Ein Teil des
// Mehretats über dem Haushaltsgesetz trägt Ausbau und Unterhalt ohne neue Schulden; der Rest geht aufs Defizit (`kosten`). Ist das
// Ressort gekürzt, kostet jeder Ausbau einen Punkt Kapital mehr und dauert länger. Alle Zahlen sind Spielparameter (data/behoerden.ts).

import { ACHSEN, AUSBAU, BEHOERDEN, BEHOERDE_NACH_ID, RESSORT_POSTEN, type Achse, type BehoerdeDef, type BehoerdeId, type BehoerdeBereich } from "../data/behoerden";
import { stuetze } from "../data/reich/bau";
import { NET } from "./modell";
import { wirke } from "./wirkung";
import { addLog } from "./log";
import { kannZahlen } from "./kapital";
import { kosten } from "./ereignis-hilfen";
import { stufeVon, POSTEN_NACH_ID } from "./haushalt";
import { neuerName } from "./figuren";
import { weltModell } from "./welt-modell";
import { Rng } from "./rng";
import { t } from "../i18n";
import type { World } from "./types";

// ---------------------------------------------------------------------------
// Zustand

export interface BauAuftrag {
  achse: Achse;
  ziel: number;
  start: number;
  fertig: number;
}

export interface BehoerdeStand {
  stufen: Record<Achse, number>;
  bau?: BauAuftrag;
  /** Tag, an dem das Sonderinstrument zuletzt eingesetzt wurde */
  instrumentTag?: number;
  leitung: { name: string; weiblich: boolean };
}

export interface BehoerdenZustand {
  v: 1;
  stand: Record<BehoerdeId, BehoerdeStand>;
  /** Was die Behörden im laufenden Jahr aus dem Mehretat ihres Ressorts schon verbraucht haben (Prozent des BIP je Haushaltsregler); fehlt in älteren Spielständen */
  etat?: { jahr: number; genutzt: Record<string, number> };
}

/** Zustand der Behörden; ältere Spielstände legen ihn beim ersten Zugriff mit den Startstufen an, neue Behörden werden ergänzt. */
export function behoerden(w: World): BehoerdenZustand {
  const sp = w.spiel;
  if (!sp) throw new Error("Behörden gibt es nur im Spiel.");
  sp.behoerden ??= { v: 1, stand: {} as Record<BehoerdeId, BehoerdeStand> };
  const z = sp.behoerden;
  const benutzt = new Set<string>([...sp.figuren.map((f) => f.name), ...Object.values(z.stand).map((s) => s.leitung.name)]);
  for (const def of BEHOERDEN) {
    if (z.stand[def.id]) continue;
    const rng = new Rng(hashInt(`${w.seed}|behoerde|${def.id}`));
    const weiblich = rng.next() < 0.35;
    z.stand[def.id] = { stufen: { ...def.start }, leitung: { name: neuerName(rng, benutzt, weiblich), weiblich } };
  }
  return z;
}

export function stand(w: World, id: BehoerdeId): BehoerdeStand {
  return behoerden(w).stand[id];
}

/** Die Stufen des Dienstes; ohne Spiel die Startstufen (für Werkzeuge und Weltläufe ohne Spieler). */
export function mitStufen(w: World): Record<Achse, number> {
  return w.spiel ? stand(w, "mit").stufen : { ...BEHOERDE_NACH_ID.mit.start };
}

function hashInt(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  h ^= h >>> 13;
  h = Math.imul(h, 0x5bd1e995);
  h ^= h >>> 15;
  return h >>> 0;
}
const clamp = (x: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, x));

// ---------------------------------------------------------------------------
// Ertrag und Geld

/** Summe der Erträge bis Stufe s: Die k-te Stufe bringt abnahme^(k−1). */
export function ertrag(s: number): number {
  let e = 0;
  for (let k = 1; k <= s; k++) e += AUSBAU.abnahme ** (k - 1);
  return e;
}

/** Ertrag gegenüber dem Start (0 beim Start, negativ nach Kürzungen). */
export const gewinn = (def: BehoerdeDef, achse: Achse, s: number): number => ertrag(s) - ertrag(def.start[achse]);

/** Anbindung an die Ressortetats des Haushalts. Ohne eigene Anbindung (Tests können eine setzen) gilt `HAUSHALT_ETAT`. */
export interface EtatAnbindung {
  /** Bucht einen Betrag (Prozent des BIP, negativ = Ersparnis) auf das Ressort; false, wenn der Etat ihn nicht trägt */
  belaste: (w: World, ressort: string, bip: number, zweck: string) => boolean;
  /** Ausstattung des Ressorts als Faktor (1 = normal); beschleunigt oder bremst den Ausbau */
  faktor?: (w: World, ressort: string) => number;
}

/** Der Haushaltsregler, der ein Ressort bezahlt (data/behoerden.ts `RESSORT_POSTEN`). */
export const etatPosten = (ressort: string): string | undefined => {
  const id = RESSORT_POSTEN[ressort];
  return id && POSTEN_NACH_ID[id] ? id : undefined;
};

function etatJahr(w: World): Record<string, number> {
  const z = behoerden(w);
  const jahr = Number(w.date.slice(0, 4));
  if (!z.etat || z.etat.jahr !== jahr) z.etat = { jahr, genutzt: {} };
  return z.etat.genutzt;
}

/** Freier Spielraum eines Ressorts im laufenden Jahr (Prozent des BIP): ein Teil dessen, was der Haushalt über dem Gesetz bewilligt hat. */
export function etatSpielraum(w: World, ressort: string): number {
  const id = etatPosten(ressort);
  if (!id || !w.spiel) return 0;
  const mehr = Math.max(0, stufeVon(w, id)) * POSTEN_NACH_ID[id]!.schritt * AUSBAU.etatSpielraum;
  return Math.max(0, mehr - (etatJahr(w)[id] ?? 0));
}

/** Ist das Ressort unter das Haushaltsgesetz gekürzt? Dann kostet jeder Ausbau Kapital zusätzlich (der Minister muss umschichten). */
export function ressortGekuerzt(w: World, ressort: string): boolean {
  const id = etatPosten(ressort);
  return !id || !w.spiel || stufeVon(w, id) < 0;
}

/**
 * Die Anbindung an den Haushalt: Was das Ressort über dem Haushaltsgesetz bewilligt bekommt, steckt schon im Ausgabenimpuls;
 * ein Teil davon trägt Ausbau und Unterhalt seiner Behörden ohne neue Schulden. Was darüber hinausgeht, geht aufs Defizit.
 */
export const HAUSHALT_ETAT: EtatAnbindung = {
  belaste: (w, ressort, bip) => {
    if (bip <= 0) return false;
    const id = etatPosten(ressort);
    if (!id) return false;
    const frei = etatSpielraum(w, ressort);
    const traegt = Math.min(frei, bip);
    if (traegt > 0) etatJahr(w)[id] = (etatJahr(w)[id] ?? 0) + traegt;
    if (traegt < bip) kosten(w, bip - traegt);
    return traegt >= bip - 1e-12;
  },
  faktor: (w, ressort) => {
    const id = etatPosten(ressort);
    return id ? 1 + 0.15 * stufeVon(w, id) : 1;
  },
};

let anbindung: EtatAnbindung | null = null;
export const setzeEtatAnbindung = (a: EtatAnbindung | null): void => {
  anbindung = a;
};
const aktiv = (): EtatAnbindung => anbindung ?? HAUSHALT_ETAT;

/** Bucht auf den Ressortetat oder fällt auf das Defizit zurück; gibt zurück, ob der Ressortetat ganz getragen hat. */
function bezahle(w: World, def: BehoerdeDef, bip: number, zweck: string): boolean {
  if (bip === 0) return true;
  if (aktiv() === HAUSHALT_ETAT) return HAUSHALT_ETAT.belaste(w, def.ressort, bip, zweck);
  if (aktiv().belaste(w, def.ressort, bip, zweck)) return true;
  kosten(w, bip);
  return false;
}

/** Wie gut das Ressort ausgestattet ist: aus dem Haushalt, sonst aus der Stufe des zugehörigen Haushaltsreglers. */
export function etatFaktor(w: World, def: BehoerdeDef): number {
  const a = aktiv();
  if (a.faktor) return clamp(a.faktor(w, def.ressort), 0.5, 1.6);
  return clamp(1 + 0.15 * stufeVon(w, def.posten), 0.6, 1.4);
}

// ---------------------------------------------------------------------------
// Ausbau

export interface AusbauVorschau {
  achse: Achse;
  von: number;
  nach: number;
  ok: boolean;
  grund?: string;
  pk: number;
  /** Einmalige Kosten in Prozent des BIP */
  bip: number;
  monate: number;
  /** Unterhalt danach in Prozent des BIP pro Jahr, zusätzlich */
  unterhalt: number;
  /** Ertrag dieser Stufe als Anteil einer ganzen Stufe (1 = voll, abnehmend) */
  anteil: number;
  /** Was die Stufe bewirkt, in einem Satz */
  satz: string;
}

export function vorschau(w: World, id: BehoerdeId, achse: Achse): AusbauVorschau {
  const def = BEHOERDE_NACH_ID[id];
  const s = stand(w, id);
  const von = s.stufen[achse];
  const nach = Math.min(5, von + 1);
  const pk = def.pk + Math.max(0, nach - 3) + (ressortGekuerzt(w, def.ressort) ? AUSBAU.pkOhneEtat : 0);
  const bip = Math.round(def.bip * (nach / 3) * 10000) / 10000;
  const monate = Math.max(2, Math.round((def.monate * (1 + AUSBAU.dauerJeStufe * (nach - 1))) / etatFaktor(w, def)));
  const anteil = AUSBAU.abnahme ** (nach - 1);
  const v: AusbauVorschau = {
    achse, von, nach, ok: true, pk, bip, monate, unterhalt: def.unterhalt, anteil,
    satz: t(`behoerden.${id}.${achse}.wirkung`),
  };
  if (von >= 5) return { ...v, ok: false, grund: t("behoerden.grund.hoechste") };
  if (s.bau) return { ...v, ok: false, grund: t("behoerden.grund.laeuft") };
  if (!kannZahlen(w.spiel!.kapital, pk)) return { ...v, ok: false, grund: t("behoerden.grund.kapital") };
  return v;
}

export interface Antwort {
  ok: boolean;
  text: string;
  why?: string;
}

export function baueAus(w: World, id: BehoerdeId, achse: Achse): Antwort {
  const v = vorschau(w, id, achse);
  if (!v.ok) return { ok: false, text: v.grund ?? t("behoerden.grund.nicht") };
  const def = BEHOERDE_NACH_ID[id];
  const s = stand(w, id);
  const sp = w.spiel!;
  sp.kapital -= v.pk;
  const name = t(`behoerden.${id}.name`);
  const achseName = t(`behoerden.${id}.achse.${achse}`);
  const ausEtat = bezahle(w, def, v.bip, `${name}: ${achseName}`);
  s.bau = { achse, ziel: v.nach, start: w.day, fertig: w.day + v.monate * 30 };
  const why = t(ausEtat ? "behoerden.ausbau.why_etat" : "behoerden.ausbau.why_defizit", { pk: v.pk, bip: v.bip, monate: v.monate });
  addLog(w, "entscheidung", t("behoerden.ausbau.log", { name, achse: achseName, stufe: v.nach }), why);
  return { ok: true, text: t("behoerden.ausbau.text", { name, achse: achseName, stufe: v.nach, monate: v.monate }), why };
}

export interface KuerzVorschau {
  ok: boolean;
  grund?: string;
  von: number;
  nach: number;
  /** Ersparnis pro Jahr in Prozent des BIP */
  ersparnis: number;
  pk: number;
}

export function kuerzVorschau(w: World, id: BehoerdeId, achse: Achse): KuerzVorschau {
  const def = BEHOERDE_NACH_ID[id];
  const von = stand(w, id).stufen[achse];
  const v: KuerzVorschau = { ok: true, von, nach: Math.max(1, von - 1), ersparnis: def.unterhalt, pk: 1 };
  if (von <= 1) return { ...v, ok: false, grund: t("behoerden.grund.niedrigste") };
  if (!kannZahlen(w.spiel!.kapital, v.pk)) return { ...v, ok: false, grund: t("behoerden.grund.kapital") };
  return v;
}

/** Kürzt eine Stufe sofort: Unterhalt sinkt, ein laufender Ausbau derselben Achse endet ohne Erstattung, Erfahrung geht verloren. */
export function kuerze(w: World, id: BehoerdeId, achse: Achse): Antwort {
  const v = kuerzVorschau(w, id, achse);
  if (!v.ok) return { ok: false, text: v.grund ?? t("behoerden.grund.nicht") };
  const def = BEHOERDE_NACH_ID[id];
  const s = stand(w, id);
  w.spiel!.kapital -= v.pk;
  s.stufen[achse] = v.nach;
  if (s.bau?.achse === achse) delete s.bau;
  // Der Verlust kommt schneller als der Aufbau: Wer geht, nimmt Wissen mit
  if (achse === "personal") wirke(w, "beamte", -AUSBAU.kuerzStoss);
  for (const x of def.wirkung[achse]) if (NET.index.has(x.id)) wirke(w, x.id, -0.5 * x.d);
  const name = t(`behoerden.${id}.name`);
  const achseName = t(`behoerden.${id}.achse.${achse}`);
  addLog(w, "entscheidung", t("behoerden.kuerzung.log", { name, achse: achseName, stufe: v.nach }), t("behoerden.kuerzung.why", { bip: v.ersparnis }));
  return { ok: true, text: t("behoerden.kuerzung.text", { name, achse: achseName, stufe: v.nach }), why: t("behoerden.kuerzung.why", { bip: v.ersparnis }) };
}

// ---------------------------------------------------------------------------
// Sonderinstrumente

export interface InstrumentSicht {
  id: string;
  name: string;
  text: string;
  achse: Achse;
  ab: number;
  pk: number;
  bip: number;
  frei: boolean;
  moeglich: boolean;
  grund?: string;
}

export function instrumentSicht(w: World, id: BehoerdeId): InstrumentSicht | undefined {
  const def = BEHOERDE_NACH_ID[id];
  const ins = def.instrument;
  if (!ins) return undefined;
  const s = stand(w, id);
  const frei = s.stufen[ins.achse] >= ins.ab;
  const bereit = s.instrumentTag === undefined || w.day - s.instrumentTag >= ins.abkuehlung * 30;
  const base: InstrumentSicht = {
    id: ins.id, name: t(`behoerden.${id}.instrument.name`), text: t(`behoerden.${id}.instrument.text`),
    achse: ins.achse, ab: ins.ab, pk: ins.pk, bip: ins.bip, frei, moeglich: true,
  };
  if (!frei) return { ...base, moeglich: false, grund: t("behoerden.grund.instrument_stufe", { achse: t(`behoerden.${id}.achse.${ins.achse}`), stufe: ins.ab }) };
  if (!bereit) return { ...base, moeglich: false, grund: t("behoerden.grund.abkuehlung", { monate: Math.ceil((ins.abkuehlung * 30 - (w.day - s.instrumentTag!)) / 30) }) };
  if (!kannZahlen(w.spiel!.kapital, ins.pk)) return { ...base, moeglich: false, grund: t("behoerden.grund.kapital") };
  return base;
}

export function setzeInstrumentEin(w: World, id: BehoerdeId): Antwort {
  const v = instrumentSicht(w, id);
  const ins = BEHOERDE_NACH_ID[id].instrument;
  if (!v || !ins) return { ok: false, text: t("behoerden.grund.nicht") };
  if (!v.moeglich) return { ok: false, text: v.grund ?? t("behoerden.grund.nicht") };
  const def = BEHOERDE_NACH_ID[id];
  w.spiel!.kapital -= ins.pk;
  bezahle(w, def, ins.bip, v.name);
  for (const x of ins.stoss) if (NET.index.has(x.id)) wirke(w, x.id, x.d);
  if (ins.abwehrMonate) {
    const dz = weltModell(w).dienst;
    if (dz) dz.abwehr = Math.max(dz.abwehr, ins.abwehrMonate);
  }
  stand(w, id).instrumentTag = w.day;
  addLog(w, "entscheidung", t("behoerden.instrument.log", { name: v.name }), v.text);
  return { ok: true, text: t("behoerden.instrument.text", { name: v.name }), why: v.text };
}

// ---------------------------------------------------------------------------
// Monatsschritt (aus sim/welt-dienst.ts, gleich nach dem Dienst)

const IMPULS = new Map<string, number>();
/** Monatlicher Stoß, der eine Größe dauerhaft um `d` Punkte verschiebt (Trägheit des Knotens, data/reich/bau.ts). */
function impuls(id: string, d: number): number {
  let je = IMPULS.get(id);
  if (je === undefined) {
    je = (stuetze(id, 1) as { d: number }).d;
    IMPULS.set(id, je);
  }
  return je * d;
}

export function behoerdenMonat(w: World): void {
  if (!w.spiel) return;
  const z = behoerden(w);
  let defizit = 0;
  for (const def of BEHOERDEN) {
    const s = z.stand[def.id];
    if (s.bau && w.day >= s.bau.fertig) {
      s.stufen[s.bau.achse] = s.bau.ziel;
      const name = t(`behoerden.${def.id}.name`);
      const achseName = t(`behoerden.${def.id}.achse.${s.bau.achse}`);
      addLog(w, "ereignis", t("behoerden.fertig.log", { name, achse: achseName, stufe: s.bau.ziel }), t(`behoerden.${def.id}.${s.bau.achse}.wirkung`));
      if (def.instrument && def.instrument.achse === s.bau.achse && s.bau.ziel === def.instrument.ab) {
        w.spiel.hinweise.push({
          id: `behoerde-instrument-${def.id}-${w.day}`, szene: "istanbul",
          titel: t("behoerden.instrument.frei.titel", { name }),
          text: [t("behoerden.instrument.frei.text", { instrument: t(`behoerden.${def.id}.instrument.name`) }), t(`behoerden.${def.id}.instrument.text`)],
        });
      }
      delete s.bau;
    }
    let ueber = 0;
    for (const a of ACHSEN) {
      const g = gewinn(def, a, s.stufen[a]);
      ueber += s.stufen[a] - def.start[a];
      if (Math.abs(g) < 1e-9) continue;
      for (const x of def.wirkung[a]) if (NET.index.has(x.id)) wirke(w, x.id, impuls(x.id, g * x.d));
    }
    // Unterhalt: über dem Start zahlt der Etat, darunter spart er
    if (ueber !== 0) {
      const betrag = (ueber * def.unterhalt) / 12;
      if (betrag < 0) defizit += betrag;
      else bezahle(w, def, betrag, t(`behoerden.${def.id}.name`));
    }
  }
  if (defizit !== 0) kosten(w, defizit);
}

// ---------------------------------------------------------------------------
// Sicht für die Oberfläche

export interface BehoerdeSicht {
  id: BehoerdeId;
  bereich: BehoerdeBereich;
  name: string;
  text: string;
  leitung: { name: string; weiblich: boolean; titel: string };
  achsen: { achse: Achse; name: string; stufe: number; start: number; ausbau: AusbauVorschau; kuerzen: KuerzVorschau }[];
  bau?: { achse: Achse; name: string; ziel: number; restMonate: number; anteil: number };
  instrument?: InstrumentSicht;
  /** Laufender Mehr- oder Minderunterhalt gegenüber dem Start (Prozent des BIP pro Jahr) */
  unterhalt: number;
  /** Der Ressortetat, der die Behörde bezahlt: Name des Haushaltsreglers, freier Spielraum im Jahr, gekürzt unter das Gesetz */
  etat?: { posten: string; name: string; spielraum: number; gekuerzt: boolean };
}

export function behoerdeSicht(w: World, id: BehoerdeId): BehoerdeSicht {
  const def = BEHOERDE_NACH_ID[id];
  const s = stand(w, id);
  const ins = instrumentSicht(w, id);
  return {
    id, bereich: def.bereich,
    name: t(`behoerden.${id}.name`),
    text: t(`behoerden.${id}.text`),
    leitung: { ...s.leitung, titel: t(`behoerden.${id}.leitung${s.leitung.weiblich ? "_f" : ""}`) },
    achsen: ACHSEN.map((a) => ({ achse: a, name: t(`behoerden.${id}.achse.${a}`), stufe: s.stufen[a], start: def.start[a], ausbau: vorschau(w, id, a), kuerzen: kuerzVorschau(w, id, a) })),
    ...(s.bau
      ? { bau: { achse: s.bau.achse, name: t(`behoerden.${id}.achse.${s.bau.achse}`), ziel: s.bau.ziel, restMonate: Math.max(1, Math.ceil((s.bau.fertig - w.day) / 30)), anteil: clamp((w.day - s.bau.start) / Math.max(1, s.bau.fertig - s.bau.start), 0, 1) } }
      : {}),
    ...(ins ? { instrument: ins } : {}),
    unterhalt: Math.round(ACHSEN.reduce((x, a) => x + (s.stufen[a] - def.start[a]) * def.unterhalt, 0) * 1000) / 1000,
    ...(etatPosten(def.ressort)
      ? { etat: { posten: etatPosten(def.ressort)!, name: t(`haushalt.posten.${etatPosten(def.ressort)}.name`), spielraum: Math.round(etatSpielraum(w, def.ressort) * 1000) / 1000, gekuerzt: ressortGekuerzt(w, def.ressort) } }
      : {}),
  };
}

export function behoerdenImBereich(bereich: string): BehoerdeId[] {
  return BEHOERDEN.filter((b) => b.bereich === bereich).map((b) => b.id);
}
