// Der Fokusbaum (Nationaler Fokus wie in HOI 4): Die Regierung verfolgt immer genau einen Fokus. Er kostet Kapital und Aufmerksamkeit,
// dauert Monate, verlangt Vorgänger und manchmal eine Lage in der Wirklichkeit, und er schließt Gegenwege aus (Markt gegen Staat,
// NATO gegen Eurasien, Dekret gegen Parlament). Vollendet wirkt er dauerhaft als Bestand im Politiknetz, bewegt Partner und Wählergruppen
// nach seiner Richtung, verschiebt Beziehungen und bereitet Gesetzesvorhaben oder Knoten des Wissensbaums vor.
// Das Spiel wertet keine Richtung: Jeder Ast hat Wege für jede Lage, der Preis folgt der Linie der eigenen Partei.
// Alle Zahlen sind Spielparameter (data/fokusbaum.ts), keine Tatsachenbehauptungen.

import { ABBILDUNG, AUSSEN, FOKI, FOKUS, FOKUS_VON, OEFFNET, type AussenDim, type FokusDefinition } from "../data/fokusbaum";
import { berechneFokusKosten, type FokusBedingung } from "../data/fokus";
import { GRUPPEN_ACHSEN, type Achsen } from "../data/linien";
import { NET } from "./modell";
import { decayVon, nationalAverage } from "./netz";
import { wirke, vertrauenAendern } from "./wirkung";
import { parteiAchsen, spielerAchsen } from "./linie";
import { figurLoyalitaetAendern } from "./figuren";
import { GRUPPEN } from "./gruppen";
import { beziehungAendern } from "./welt-modell";
import { aktiveKriege } from "./krieg";
import { kannZahlen } from "./kapital";
import { AUFMERKSAMKEIT_KOSTEN, neuanfangGrund, verbrauche } from "./aufmerksamkeit";
import { addLog } from "./log";
import { clamp } from "./economy";
import { t } from "../i18n";
import type { World } from "./types";

export interface FokusZustand {
  /** Der laufende Fokus (höchstens einer) */
  aktiv: { id: string; start: number; ende: number; pk: number } | null;
  /** Vollendete Foki mit Tag des Abschlusses */
  fertig: { id: string; tag: number }[];
  /** Dauerhafter Bestand je Knoten aus vollendeten Foki (Punkte über der Ruhelage), wird monatlich gehalten */
  bestand: Record<string, number>;
}

/** Zustand des Fokusbaums; ältere Spielstände legen ihn beim ersten Zugriff leer an. */
export function fokusZustand(w: World): FokusZustand {
  const sp = w.spiel!;
  sp.fokus ??= { aktiv: null, fertig: [], bestand: {} };
  sp.fokus.fertig ??= [];
  sp.fokus.bestand ??= {};
  sp.fokus.aktiv ??= null;
  return sp.fokus;
}

/** Nur lesen: Zustand ohne Anlegen (für die Anzeige). */
function lese(w: World): FokusZustand {
  return w.spiel?.fokus ?? { aktiv: null, fertig: [], bestand: {} };
}

export const fokusName = (id: string): string => t(`fokus.f.${id}.titel`);

// ---------------------------------------------------------------------------
// Richtung, Wirkung, Gegenspieler

/** Übereinstimmung einer Linie (Achsen −100 bis 100) mit der Richtung eines Fokus, −1 bis 1; 0 ohne Richtung. */
export function richtungsNaehe(f: FokusDefinition, achsen: Achsen): number {
  const v = f.wirkung.achsenVerschiebung;
  if (!v) return 0;
  let dot = 0;
  let betrag = 0;
  for (const [a, x] of Object.entries(v)) {
    dot += (x ?? 0) * ((achsen as Record<string, number>)[a] ?? 0);
    betrag += (x ?? 0) ** 2;
  }
  if (betrag === 0) return 0;
  return clamp(dot / (Math.sqrt(betrag) * 60), -1, 1);
}

export interface FokusFolge {
  knoten: string;
  delta: number;
}

/** Die Wirkung im Politiknetz, auf Knoten abgebildet und zusammengefasst (größte zuerst). */
export function fokusFolgen(f: FokusDefinition): FokusFolge[] {
  const summe = new Map<string, number>();
  const add = (k: string, d: number) => summe.set(k, (summe.get(k) ?? 0) + d);
  for (const [k, x] of Object.entries(f.wirkung.metriken ?? {})) {
    const ziele = ABBILDUNG[k] ?? (NET.index.has(k) ? [[k, 1] as [string, number]] : []);
    for (const [knoten, faktor] of ziele) if (NET.index.has(knoten)) add(knoten, x * faktor * FOKUS.skala);
  }
  const dp = f.wirkung.militaerDoktrinPunkte;
  if (dp) {
    add("modernisierung", dp * 0.5 * FOKUS.skala);
    add("truppenmoral", dp * 0.3 * FOKUS.skala);
  }
  if (f.wirkung.weltSpannungDelta) add("ansehen", -f.wirkung.weltSpannungDelta * 0.3 * FOKUS.skala);
  return [...summe]
    .map(([knoten, d]) => ({ knoten, delta: Math.round(clamp(d, -FOKUS.maxJeKnoten, FOKUS.maxJeKnoten) * 10) / 10 }))
    .filter((x) => Math.abs(x.delta) >= 0.2)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
}

export interface Reaktion {
  /** Wählergruppen, die gewinnen (+) oder verlieren (−), mit Punkten */
  gruppen: { id: string; delta: number }[];
  /** Partner im Lager mit Änderung der Loyalität */
  partner: { partei: string; delta: number }[];
}

/** Wer reagiert, und wie: Gruppen und Partner nach der Richtung des Fokus. */
export function fokusReaktion(w: World, f: FokusDefinition): Reaktion {
  const gruppen: Reaktion["gruppen"] = [];
  for (const g of GRUPPEN) {
    const a = GRUPPEN_ACHSEN[g.id];
    if (!a) continue;
    const n = richtungsNaehe(f, a);
    if (Math.abs(n) >= 0.15) gruppen.push({ id: g.id, delta: Math.round(FOKUS.gruppenStimmung * n * 10) / 10 });
  }
  const partner: Reaktion["partner"] = [];
  for (const fig of w.spiel?.figuren ?? []) {
    if (fig.amt !== "partner" || !fig.partei || !fig.imAmt) continue;
    const a = parteiAchsen(fig.partei);
    if (!a) continue;
    const n = richtungsNaehe(f, a);
    if (Math.abs(n) >= 0.15) partner.push({ partei: fig.partei, delta: Math.round(FOKUS.partnerLoyalitaet * n) });
  }
  gruppen.sort((a, b) => b.delta - a.delta);
  return { gruppen, partner };
}

// ---------------------------------------------------------------------------
// Bedingungen und Zustand

export interface BedingungSicht {
  text: string;
  erfuellt: boolean;
}

function knotenText(id: string): string {
  return t(`netz.knoten.${id}.name`);
}

function pruefe(w: World, b: FokusBedingung): BedingungSicht | null {
  switch (b.art) {
    case "massnahme":
    case "groesse": {
      if (!NET.index.has(b.id)) return null; // Eine Größe, die das Netz nicht kennt, sperrt nicht
      const x = nationalAverage(NET, w.net, b.id);
      const ok = (b.min === undefined || x >= b.min) && (b.max === undefined || x <= b.max);
      const text =
        b.min !== undefined && b.max !== undefined
          ? t("fokus.bed.zwischen", { name: knotenText(b.id), min: b.min, max: b.max, jetzt: Math.round(x) })
          : b.min !== undefined
            ? t("fokus.bed.min", { name: knotenText(b.id), min: b.min, jetzt: Math.round(x) })
            : t("fokus.bed.max", { name: knotenText(b.id), max: b.max ?? 100, jetzt: Math.round(x) });
      return { text, erfuellt: ok };
    }
    case "jahr": {
      const j = Number(w.date.slice(0, 4));
      return { text: t("fokus.bed.jahr", { jahr: b.min }), erfuellt: j >= b.min };
    }
    case "krieg": {
      const k = aktiveKriege(w).length > 0;
      return { text: t(b.aktiv ? "fokus.bed.krieg" : "fokus.bed.frieden"), erfuellt: k === b.aktiv };
    }
    case "achsen_naehe": {
      const a = (spielerAchsen(w) as Record<string, number>)[b.achse] ?? 0;
      return { text: t("fokus.bed.linie", { achse: t(`linie.achse.${b.achse}.name`) }), erfuellt: Math.abs(a - b.wert) <= b.toleranz };
    }
    default:
      return null;
  }
}

export type FokusStatus = "fertig" | "laeuft" | "moeglich" | "ausgeschlossen" | "gesperrt";

export interface FokusSicht {
  def: FokusDefinition;
  status: FokusStatus;
  /** Ein Satz, warum es nicht geht (bei gesperrt/ausgeschlossen, oder warum es gerade nicht beginnen kann) */
  grund?: string;
  /** Gegenweg, der diesen Fokus ausschließt */
  durch?: string;
  bedingungen: BedingungSicht[];
  pk: number;
  monate: number;
  bezahlbar: boolean;
  /** Kann jetzt begonnen werden */
  startbar: boolean;
  /** Anteil 0–1 bei laufendem Fokus */
  lauf?: number;
  restTage?: number;
  /** Tag des Abschlusses (fertig) */
  fertigAm?: number;
}

export function fokusPreis(w: World, f: FokusDefinition): number {
  return Math.max(1, Math.round(berechneFokusKosten(f, spielerAchsen(w)) * FOKUS.kapitalFaktor));
}

export function fokusSicht(w: World, id: string): FokusSicht {
  const f = FOKUS_VON[id]!;
  const z = lese(w);
  const fertig = new Set(z.fertig.map((x) => x.id));
  const pk = fokusPreis(w, f);
  const monate = Math.max(1, Math.round(f.tage / 30));
  const bedingungen = (f.bedingungen ?? []).map((b) => pruefe(w, b)).filter((x): x is BedingungSicht => x !== null);
  const bezahlbar = kannZahlen(w.spiel?.kapital ?? 0, pk);
  const basis = { def: f, bedingungen, pk, monate, bezahlbar, startbar: false };
  if (fertig.has(id)) return { ...basis, status: "fertig", fertigAm: z.fertig.find((x) => x.id === id)!.tag };
  if (z.aktiv?.id === id)
    return {
      ...basis,
      status: "laeuft",
      lauf: clamp((w.day - z.aktiv.start) / Math.max(1, z.aktiv.ende - z.aktiv.start), 0, 1),
      restTage: Math.max(0, z.aktiv.ende - w.day),
    };
  // Gegenweg: vollendet oder laufend schließt aus (beide Seiten der Paare kennen sich nicht immer, deshalb auch rückwärts)
  const gegen = FOKI.filter((g) => (f.ausschluesse ?? []).includes(g.id) || (g.ausschluesse ?? []).includes(id)).map((g) => g.id);
  const durch = gegen.find((g) => fertig.has(g) || z.aktiv?.id === g);
  if (durch) return { ...basis, status: "ausgeschlossen", durch, grund: t("fokus.grund.ausgeschlossen", { name: fokusName(durch) }) };
  const fehlt = f.voraus.filter((v) => !fertig.has(v));
  if (fehlt.length) return { ...basis, status: "gesperrt", grund: t("fokus.grund.vorgaenger", { liste: fehlt.map(fokusName).join(", ") }) };
  const offen = bedingungen.filter((b) => !b.erfuellt);
  if (offen.length) return { ...basis, status: "gesperrt", grund: t("fokus.grund.bedingung", { liste: offen.map((b) => b.text).join("; ") }) };
  let grund: string | undefined;
  if (w.spiel?.ende) grund = t("fokus.grund.ende");
  else if (z.aktiv) grund = t("fokus.grund.belegt", { name: fokusName(z.aktiv.id) });
  else if (!bezahlbar) grund = t("fokus.grund.kapital", { noetig: pk, da: Math.floor(w.spiel?.kapital ?? 0) });
  else grund = neuanfangGrund(w);
  return { ...basis, status: "moeglich", startbar: grund === undefined, ...(grund ? { grund } : {}) };
}

export interface BaumUeberblick {
  aktiv: FokusSicht | null;
  fertig: number;
  gesamt: number;
  moeglich: number;
  /** Ein Satz zur Lage */
  satz: string;
  /** Zuletzt vollendet, solange der Stempel steht */
  stempel?: { id: string; tag: number };
}

export function fokusUeberblick(w: World): BaumUeberblick {
  const z = lese(w);
  const aktiv = z.aktiv ? fokusSicht(w, z.aktiv.id) : null;
  const moeglich = FOKI.filter((f) => fokusSicht(w, f.id).status === "moeglich").length;
  const letzter = z.fertig[z.fertig.length - 1];
  const stempel = letzter && w.day - letzter.tag <= FOKUS.stempelTage ? letzter : undefined;
  const satz = aktiv
    ? t("fokus.satz.aktiv", { name: fokusName(aktiv.def.id), monate: Math.max(1, Math.round((aktiv.restTage ?? 0) / 30)) })
    : moeglich > 0
      ? t("fokus.satz.frei", { n: moeglich })
      : t("fokus.satz.nichts");
  return { aktiv, fertig: z.fertig.length, gesamt: FOKI.length, moeglich, satz, ...(stempel ? { stempel } : {}) };
}

// ---------------------------------------------------------------------------
// Handeln

export interface FokusErgebnis {
  ok: boolean;
  text: string;
}

export function beginneFokus(w: World, id: string): FokusErgebnis {
  const sp = w.spiel;
  const f = FOKUS_VON[id];
  if (!sp || !f) return { ok: false, text: t("fokus.grund.unbekannt") };
  const s = fokusSicht(w, id);
  if (!s.startbar) return { ok: false, text: s.grund ?? t("fokus.grund.unbekannt") };
  const z = fokusZustand(w);
  sp.kapital -= s.pk;
  verbrauche(w, AUFMERKSAMKEIT_KOSTEN.programmSchritt, fokusName(id));
  z.aktiv = { id, start: w.day, ende: w.day + f.tage, pk: s.pk };
  const text = t("fokus.log.beginnt", { name: fokusName(id) });
  addLog(w, "entscheidung", text, t("fokus.log.kostet", { pk: s.pk, monate: s.monate }));
  return { ok: true, text };
}

/** Bricht den laufenden Fokus ab: Ein Teil des Kapitals kommt zurück, die Zeit ist verloren. */
export function brichFokusAb(w: World): FokusErgebnis {
  const sp = w.spiel;
  const z = sp ? fokusZustand(w) : null;
  if (!sp || !z?.aktiv) return { ok: false, text: t("fokus.grund.keinAktiver") };
  const zurueck = Math.floor(z.aktiv.pk * FOKUS.abbruchErstattung);
  const name = fokusName(z.aktiv.id);
  sp.kapital += zurueck;
  z.aktiv = null;
  const text = t("fokus.log.abgebrochen", { name, pk: zurueck });
  addLog(w, "entscheidung", text);
  return { ok: true, text };
}

function vollende(w: World, f: FokusDefinition): void {
  const sp = w.spiel!;
  const z = fokusZustand(w);
  z.aktiv = null;
  z.fertig.push({ id: f.id, tag: w.day });
  // Bestand im Politiknetz: sofort erreicht, danach monatlich gehalten (fokusMonat)
  for (const { knoten, delta } of fokusFolgen(f)) {
    const alt = z.bestand[knoten] ?? 0;
    const neu = clamp(alt + delta, -FOKUS.maxBestand, FOKUS.maxBestand);
    if (neu === alt) continue;
    z.bestand[knoten] = Math.round(neu * 100) / 100;
    wirke(w, knoten, neu - alt);
  }
  const wk = f.wirkung;
  if (wk.sofortKapital) sp.kapital = Math.min(150, sp.kapital + wk.sofortKapital);
  if (wk.sofortVertrauen) vertrauenAendern(w, wk.sofortVertrauen * 0.5);
  if (wk.rabattThema) {
    const k = `rabatt:${wk.rabattThema.thema}`;
    sp.modifikatoren = { ...(sp.modifikatoren ?? {}), [k]: (sp.modifikatoren?.[k] ?? 0) + wk.rabattThema.anteil };
  }
  const forschung = wk.metriken?.forschungsrate;
  if (forschung) {
    const alt = sp.modifikatoren?.["fokus:forschung"] ?? 0;
    sp.modifikatoren = { ...(sp.modifikatoren ?? {}), "fokus:forschung": Math.min(FOKUS.forschungMax, alt + forschung * FOKUS.forschungJePunkt) };
  }
  // Gegenspieler und Verbündete: Partner und Wählergruppen messen die Richtung
  const r = fokusReaktion(w, f);
  for (const g of r.gruppen) wirke(w, g.id, g.delta);
  for (const p of r.partner) {
    const fig = sp.figuren.find((x) => x.amt === "partner" && x.partei === p.partei);
    figurLoyalitaetAendern(w, fig, p.delta, t(p.delta > 0 ? "fokus.partner.plus" : "fokus.partner.minus", { name: fokusName(f.id) }));
  }
  // Außen
  for (const [land, d] of Object.entries(AUSSEN[f.id] ?? {})) beziehungAendern(w, land, d as Partial<Record<AussenDim, number>>, fokusName(f.id));
  const west = wk.metriken?.vertrauen_westen;
  if (west && !AUSSEN[f.id]) for (const land of ["EU", "USA"]) beziehungAendern(w, land, { vertrauen: Math.round(west * FOKUS.aussenSkala) }, fokusName(f.id));
  const ost = wk.metriken?.vertrauen_osten;
  if (ost && !AUSSEN[f.id]) for (const land of ["RUS", "CHN"]) beziehungAendern(w, land, { vertrauen: Math.round(ost * FOKUS.aussenSkala) }, fokusName(f.id));
  // Vorbereitet: Gesetze und Wissensknoten
  const o = OEFFNET[f.id];
  for (const g of o?.gesetze ?? []) sp.modifikatoren = { ...(sp.modifikatoren ?? {}), [`fokus:gesetz:${g}`]: FOKUS.gesetzStimmen };
  for (const k of o?.wissen ?? []) sp.modifikatoren = { ...(sp.modifikatoren ?? {}), [`fokus:wissen:${k}`]: FOKUS.wissenTempo };
  const titel = t("fokus.log.vollendet", { name: fokusName(f.id) });
  const satz = t(`fokus.f.${f.id}.text`);
  sp.chronik.push({ tag: w.day, datum: w.date, titel, ausgang: satz });
  addLog(w, "ereignis", titel, satz);
  const zeilen = [satz];
  if (f.zitat) zeilen.push(t("fokus.zitat", { text: t(`fokus.f.${f.id}.zitat`), von: t(`fokus.f.${f.id}.urheber`) }));
  sp.hinweise.push({ id: `fokus-${f.id}-${w.day}`, titel, szene: "parlament", text: zeilen });
}

/** Täglich: einen fälligen Fokus vollenden. */
export function fokusTag(w: World): void {
  const z = w.spiel?.fokus;
  if (!z?.aktiv || z.aktiv.ende > w.day) return;
  const f = FOKUS_VON[z.aktiv.id];
  if (!f) {
    z.aktiv = null;
    return;
  }
  vollende(w, f);
}

/** Monatlich: den Bestand der vollendeten Foki gegen den Rücklauf des Netzes halten. */
export function fokusMonat(w: World): void {
  const z = w.spiel?.fokus;
  if (!z) return;
  for (const [knoten, wert] of Object.entries(z.bestand ?? {})) {
    const i = NET.index.get(knoten);
    if (i === undefined || wert === 0) continue;
    const r = decayVon(NET.nodes[i]!);
    if (r > 0) wirke(w, knoten, r * wert);
  }
}

// ---------------------------------------------------------------------------
// Für Bots und den Schreibtisch

/** Der nächste beginnbare Fokus nach einer einfachen Regel: passend zur Linie, günstig, kurz; Wurzeln zuerst. */
export function naechsterFokus(w: World): FokusSicht | null {
  if (lese(w).aktiv) return null;
  const achsen = spielerAchsen(w);
  let beste: { s: FokusSicht; wert: number } | null = null;
  for (const f of FOKI) {
    const s = fokusSicht(w, f.id);
    if (!s.startbar) continue;
    const wert = 2 * richtungsNaehe(f, achsen) - s.pk / 10 - f.tage / 120 + (f.voraus.length === 0 ? 0.5 : 0);
    if (!beste || wert > beste.wert) beste = { s, wert };
  }
  return beste?.s ?? null;
}
