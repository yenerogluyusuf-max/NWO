// Der Geheimdienst (MİT) als Spielebene: verdeckte Operationen gegenüber einem Staat und ihr Spiegelbild.
//
// Die Operationen sind Spielmechanik, keine Anleitung: Sie kosten politisches Kapital und einen Teil der knappen Dienstkapazität, laufen
// über Monate, gelingen nur mit niedriger bis mittlerer Wahrscheinlichkeit (abhängig vom Zielstaat: Sicherheitsapparat, Medienlage,
// Abstand zur Wahl, Vorbereitung) und können auffliegen. Auffliegen hat Folgen: Botschafter einbestellt, innenpolitischer Skandal,
// Partner gehen auf Distanz, Strafmaßnahmen, Gegenschlag. Gewürfelt wird deterministisch aus Seed und Operation (Speichern und Laden
// ändert nichts). Andere Staaten betreiben dasselbe gegen die Türkei; der Spieler erfährt davon nur, was aufgedeckt wird, und antwortet
// mit Gegenspionage, Öffentlichkeit oder Mediengesetzen — jedes mit Preis.
//
// Alle Zahlen sind Spielparameter (Platzhalter der Kalibrierung), keine Tatsachenbehauptungen. Historische Fälle von Einflussnahme in
// Wahlen dienten nur als Orientierung für die Größenordnung („selten gelingt es sauber, oft hat es Spätfolgen“), nicht für Werte.

import { weltbankRoh, WELT } from "../data/welt-daten";
import { WEITERE } from "../data/welt-weitere";
import { NET } from "./modell";
import { wirke } from "./wirkung";
import { addLog } from "./log";
import { Rng } from "./rng";
import {
  AKTEUR_IDS,
  akteurAkk,
  akteurDat,
  akteurDef,
  akteurName,
  beziehungAendern,
  beziehungZurTuerkei,
  eigenVon,
  haltungFuehrung,
  haltungWortVon,
  nf,
  paarVon,
  pAmtsfuehrung,
  setzeDienstHaken,
  startWerte,
  weltModell,
  weltNotiz,
  type BerichtEintrag,
  type DienstZustand,
  type EingehendeOp,
  type OpArt,
  type Operation,
  type WeltModell,
} from "./welt-modell";
import type { World } from "./types";
import { behoerdenMonat, mitStufen } from "./behoerden";
import { nationalAverage } from "./netz";
import { t } from "../i18n";
import { landFormen, landZahl } from "./ereignisse-krieg";
import { aussenZustand } from "./diplomatie";
import { datenTexte } from "../i18n/daten";

// ---------------------------------------------------------------------------
// Die Arten von Operationen

export interface OpDef {
  art: OpArt;
  name: string;
  text: string;
  /** Politisches Kapital */
  pk: number;
  /** Dienstkapazität, die die Operation bindet */
  kap: number;
  monate: number;
  /** Grunderfolg gegen einen durchschnittlichen Staat (vor Abzügen) */
  basis: number;
  /** Grundrisiko der Aufdeckung */
  aufdeckung: number;
  /** Schwere der Folgen bei Aufdeckung (1–3) */
  schwere: number;
  nurMitWahl?: boolean;
  defensiv?: boolean;
  /** Erst ab dieser Ausbaustufe des Dienstes (sim/behoerden.ts) */
  ab?: { achse: "personal" | "technik" | "reichweite"; stufe: number };
}

export const OP_DEFS: Record<OpArt, OpDef> = {
  kandidat: {
    art: "kandidat", name: "Ein Lager im Wahlkampf unterstützen", pk: 4, kap: 25, monate: 4, basis: 0.3, aufdeckung: 0.3, schwere: 3, nurMitWahl: true,
    text: "Geld, Medienzugang und Netzwerke für ein Lager im Zielstaat. Wirkt am stärksten in den Monaten vor der Wahl und auch dann nur begrenzt: Wähler entscheiden selbst, und ein aufgedecktes Engagement stärkt oft die andere Seite.",
  },
  desinfo: {
    art: "desinfo", name: "Desinformationskampagne", pk: 2, kap: 15, monate: 2, basis: 0.45, aufdeckung: 0.4, schwere: 2,
    text: "Gezielte Falschmeldungen und Gerüchte schwächen die Führung des Zielstaats. Billig und schnell, aber leicht zu entlarven.",
  },
  netz: {
    art: "netz", name: "Einflussnetzwerk aufbauen", pk: 3, kap: 20, monate: 6, basis: 0.5, aufdeckung: 0.25, schwere: 2,
    text: "Beziehungen zu Politik, Medien und Wirtschaft: Das dauert, bringt aber Zugang, der spätere Operationen erleichtert und seltener auffliegen lässt.",
  },
  cyber: {
    art: "cyber", name: "Aufklärung und Cyber", pk: 3, kap: 20, monate: 2, basis: 0.5, aufdeckung: 0.3, schwere: 2,
    text: "Einblick in Lage und Absichten des Zielstaats: Wahlaussichten, Stabilität — und ob fremde Operationen gegen die Türkei laufen.",
  },
  gegen: {
    art: "gegen", name: "Gegenspionage verstärken", pk: 2, kap: 15, monate: 6, basis: 1, aufdeckung: 0, schwere: 0, defensiv: true,
    text: "Hält fremde Operationen gegen die Türkei klein und macht ihre Entdeckung wahrscheinlicher. Wirkt gegen alle Staaten zugleich.",
  },
  gruppen: {
    art: "gruppen", name: "Gruppen im Ausland unterstützen", pk: 4, kap: 25, monate: 6, basis: 0.4, aufdeckung: 0.35, schwere: 3, ab: { achse: "reichweite", stufe: 4 },
    text: "Geld, Beratung und Rückhalt für eine Gruppe im Zielstaat, die dessen Führung zusetzt. Schwächt die Stabilität dort, ist schwer zu steuern und schlägt nicht selten zurück: Wer Gruppen stärkt, kontrolliert nicht, was sie später tun.",
  },
  cyberangriff: {
    art: "cyberangriff", name: "Cyberangriff auf Behörden", pk: 3, kap: 20, monate: 1, basis: 0.45, aufdeckung: 0.35, schwere: 2, ab: { achse: "technik", stufe: 4 },
    text: "Stört Verwaltung und Dienste des Zielstaats für eine Weile und bricht laufende Operationen von dort gegen die Türkei ab. Schnell, aber Spuren im Netz führen oft zurück, und der Gegenschlag trifft eigene Netze.",
  },
  // Welle E3: Vorgänge nach dem echten MİT (sim/ereignisse-dienst.ts). Sie entstehen nur aus einer Gelegenheit auf dem Schreibtisch, nicht aus
  // der Auswahlliste der Weltansicht. Preis, Dauer und Kapazität sind Spielparameter; Aussicht und Risiko rechnet `vorgangAussicht`.
  zugriff: {
    art: "zugriff", name: "Zugriff auf einen Gesuchten", pk: 2, kap: 25, monate: 2, basis: 0.6, aufdeckung: 0.4, schwere: 2,
    text: "Der Dienst bringt eine im Ausland gesuchte Person in die Türkei, meist mit Hilfe der Behörden dort.",
  },
  kader: {
    art: "kader", name: "Schlag gegen Kader", pk: 2, kap: 20, monate: 1, basis: 0.65, aufdeckung: 0.25, schwere: 1,
    text: "Ein gezielter Schlag gegen die Führung einer bewaffneten Gruppe in Syrien oder im Irak.",
  },
  kanal: {
    art: "kanal", name: "Austausch über Ankara", pk: 2, kap: 15, monate: 3, basis: 0.6, aufdeckung: 0, schwere: 0,
    text: "Der Dienst richtet einen Gefangenenaustausch zwischen zwei Mächten aus.",
  },
};

// Name und Beschreibung der Operationen dreisprachig (Katalog tag_t8.json); der Code vergleicht nur über `art`
datenTexte("dienst.op", Object.values(OP_DEFS), (x) => x.art, ["name", "text"]);

/** Was die Ausbaustufen des Dienstes (1 bis 5, Stufe 3 = wie heute) bewirken. Spielparameter. */
export const MIT_STUFEN = {
  /** Personal: monatlicher Zuwachs und Obergrenze der Kapazität */
  zuwachs: [4, 6, 8, 10, 12],
  kapMax: [70, 85, 100, 115, 130],
  /** Technik: Zuschlag auf die Erfolgschance, Abschlag auf das Aufdeckungsrisiko, Faktor auf das Entdecken fremder Operationen */
  technikP: [-0.06, -0.03, 0, 0.03, 0.06],
  technikAuf: [0.06, 0.03, 0, -0.03, -0.06],
  fund: [0.6, 0.8, 1, 1.25, 1.5],
  /** Reichweite: höchste Stufe eines Einflussnetzes und wie lange ein Lagebild trägt (Tage) */
  netzMax: [1, 2, 3, 4, 5],
  lagebildTage: [90, 135, 180, 270, 365],
  /** Monatliche Grundchance je Netzstufe, dass ein Netz auffliegt (mal Stärke des fremden Apparats) */
  netzFund: 0.006,
  /** Wie oft eine unterstützte Gruppe zurückschlägt */
  rueckschlag: 0.3,
} as const;

const stufenWert = <T,>(reihe: readonly T[], s: number): T => reihe[clamp(Math.round(s), 1, 5) - 1]!;
/** Obergrenze der Dienstkapazität nach Personalstufe. */
export const kapazitaetMax = (w: World): number => stufenWert(MIT_STUFEN.kapMax, mitStufen(w).personal);
/** Höchste Netzstufe nach Reichweite. */
export const netzMax = (w: World): number => stufenWert(MIT_STUFEN.netzMax, mitStufen(w).reichweite);

export const DIENST = {
  /** Kapazität bei Spielbeginn und monatlicher Zuwachs */
  start: 60,
  zuwachs: 8,
  /** Höchstens so viele Operationen zugleich gegen denselben Staat */
  jeZiel: 2,
  /** Monatliche Grundchance einer fremden Operation je feindlich gesinntem Staat (mal Fähigkeit) */
  fremdChance: 0.003,
  /** Aufdeckungschance einer fremden Operation je Monat (mit Gegenspionage höher) */
  fundChance: 0.1,
  fundChanceAbwehr: 0.22,
  /** Fähigkeit der Staaten zu verdeckten Operationen gegen die Türkei (Spielparameter) */
  faehigkeit: { USA: 1.6, RUS: 1.6, CHN: 1.4, ISR: 1.4, EU: 1.0, IRN: 1.0, SAU: 0.8, GRC: 0.6, EGY: 0.6, CYP: 0.4 } as Record<string, number>,
} as const;

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
// Zustand

export function dienst(w: World): DienstZustand {
  const m = weltModell(w);
  m.dienst ??= { kapazitaet: DIENST.start, ops: [], eingehend: [], bericht: [], zugang: {}, abwehr: 0, lagebild: {}, zaehler: 0 };
  return m.dienst;
}

function berichte(w: World, dz: DienstZustand, titel: string, text: string, ausgang: BerichtEintrag["ausgang"]): void {
  dz.bericht.push({ tag: w.day, datum: w.date, titel, text, ausgang });
  if (dz.bericht.length > 30) dz.bericht.shift();
}

// ---------------------------------------------------------------------------
// Aussichten

/** Stärke der Spionageabwehr und des Sicherheitsapparats eines Staates (0–100). */
export function abwehrStaerke(id: string): number {
  const d = akteurDef(id);
  return clamp(startWerte(id).basis + (d.form === "autokratie" || d.form === "monarchie" ? 10 : 0), 10, 95);
}

/** Wie offen die Medien eines Staates sind (0 geschlossen bis 1 offen), aus „Mitsprache und Rechenschaft“ der Weltbank. */
export function medienOffenheit(id: string): number {
  const d = akteurDef(id);
  const va = weltbankRoh("GOV_WGI_VA.EST", d.iso);
  const wert = va && va[1] >= 2023 ? va[0] : d.klasse === "fortgeschritten" ? 1 : d.klasse === "aufstrebend" ? -0.3 : -0.8;
  return clamp((wert + 2.5) / 5, 0, 1);
}

export interface Aussicht {
  /** Erfolgschance */
  p: number;
  /** Aufdeckungsrisiko */
  pAuf: number;
  /** Stufe der Aussicht als Kennung (gering, maessig, mittel, gut, sicher) und als Wort der Sprache */
  stufe: string;
  wort: string;
  /** Stufe des Aufdeckungsrisikos als Kennung (gering, maessig, hoch, sehr_hoch, kein) und als Wort der Sprache */
  aufStufe: string;
  aufWort: string;
  faktoren: string[];
}

const stufe = (p: number): string => (p < 0.15 ? "gering" : p < 0.3 ? "maessig" : p < 0.5 ? "mittel" : "gut");
const stufeRisiko = (p: number): string => (p < 0.2 ? "gering" : p < 0.4 ? "maessig" : p < 0.6 ? "hoch" : "sehr_hoch");
const stufeWort = (s: string): string => t(`tag_t8.dienst.stufe.${s}`);
/** Faktor „Wahl in N Monaten“ ohne Zusatz (die Oberfläche blendet ihn aus, wenn die Wahlzeile des Zielstaats dasselbe sagt) */
export const wahlFaktor = (monate: number): string => t("tag_t8.dienst.faktor.wahl", { n: monate });

export function aussicht(w: World, art: OpArt, ziel: string, lager?: Operation["lager"]): Aussicht {
  const def = OP_DEFS[art];
  const dz = dienst(w);
  const apparat = abwehrStaerke(ziel);
  const offen = medienOffenheit(ziel);
  const vorb = dz.zugang[ziel] ?? 0;
  const e = eigenVon(w, ziel);
  const faktoren: string[] = [];
  faktoren.push(t("tag_t8.dienst.faktor.apparat", { stufe: apparat >= 65 ? "stark" : apparat >= 40 ? "mittel" : "schwach", n: Math.round(apparat) }));
  faktoren.push(t("tag_t8.dienst.faktor.medien", { stufe: offen >= 0.65 ? "offen" : offen >= 0.4 ? "teilweise" : "kontrolliert" }));
  let fenster = 1;
  if (art === "kandidat" || art === "desinfo") {
    const tage = e.wahl ? e.wahl.tag - w.day : null;
    if (tage !== null && tage > 0) {
      fenster = tage <= 150 ? 1 : tage <= 365 ? 0.7 : 0.4;
      faktoren.push(wahlFaktor(Math.max(1, Math.round(tage / 30))) + (tage <= 150 ? t("tag_t8.dienst.faktor.wahl.offen") : tage > 365 ? t("tag_t8.dienst.faktor.wahl.fern") : ""));
    } else {
      fenster = art === "kandidat" ? 0 : 0.8;
      faktoren.push(t(art === "kandidat" ? "tag_t8.dienst.faktor.keineWahl" : "tag_t8.dienst.faktor.keineWahl.stimmung"));
    }
  }
  faktoren.push(vorb > 0 ? t("tag_t8.dienst.faktor.netz", { n: vorb, max: netzMax(w) }) : t("tag_t8.dienst.faktor.keinNetz"));
  const st = mitStufen(w);
  if (st.technik !== 3) faktoren.push(t("behoerden.mit.faktor.technik", { stufe: st.technik }));
  let p = def.basis * (1 - 0.55 * (apparat / 100)) * fenster;
  if (art === "kandidat" || art === "desinfo") p *= 0.75 + 0.4 * offen;
  // Netze helfen mit abnehmendem Ertrag: die ersten drei Stufen voll, darüber halb
  const netzBonus = 0.08 * Math.min(vorb, 3) + 0.04 * Math.max(0, vorb - 3);
  const reichweite = art === "netz" || art === "gruppen" ? 0.03 * (st.reichweite - 3) : 0;
  p = clamp(p + netzBonus + stufenWert(MIT_STUFEN.technikP, st.technik) + reichweite, 0.03, 0.7);
  if (art === "kandidat" && lager === "amtsfuehrung" && e.wahl?.herausforderer) {
    // Wer die Amtsführung stützt, hat es etwas leichter: Sie kontrolliert den Apparat
    p = clamp(p + 0.04, 0.03, 0.7);
  }
  const andere = dz.ops.filter((o) => o.ziel === ziel).length;
  const pAuf = clamp(def.aufdeckung + 0.3 * (apparat / 100) + 0.15 * offen - 0.05 * Math.min(vorb, 3) - 0.02 * Math.max(0, vorb - 3) + 0.05 * andere + stufenWert(MIT_STUFEN.technikAuf, st.technik), 0.08, 0.85);
  if (art === "gegen") return { p: 1, pAuf: 0, stufe: "sicher", wort: stufeWort("sicher"), aufStufe: "kein", aufWort: stufeWort("kein"), faktoren: [] };
  return { p, pAuf, stufe: stufe(p), wort: stufeWort(stufe(p)), aufStufe: stufeRisiko(pAuf), aufWort: stufeWort(stufeRisiko(pAuf)), faktoren };
}

// ---------------------------------------------------------------------------
// Anordnen

export interface OpOption {
  def: OpDef;
  moeglich: boolean;
  grund?: string;
  aussicht: Aussicht;
  /** Für die Unterstützung im Wahlkampf: welche Lager zur Wahl stehen */
  lager?: { id: NonNullable<Operation["lager"]>; label: string }[];
}

export function opsOptionen(w: World, ziel: string): OpOption[] {
  const dz = dienst(w);
  const spiel = w.spiel!;
  const e = eigenVon(w, ziel);
  const st = mitStufen(w);
  return (["kandidat", "desinfo", "netz", "cyber", "gruppen", "cyberangriff"] as OpArt[]).map((art) => {
    const def = OP_DEFS[art];
    const a = aussicht(w, art, ziel, art === "kandidat" ? "herausforderer" : undefined);
    let grund: string | undefined;
    if (def.ab && st[def.ab.achse] < def.ab.stufe) grund = t("behoerden.mit.grund.stufe", { achse: t(`behoerden.mit.achse.${def.ab.achse}`), stufe: def.ab.stufe });
    else if (spiel.kapital < def.pk) grund = t("tag_t8.dienst.grund.kapital");
    else if (dz.kapazitaet < def.kap) grund = t("tag_t8.dienst.grund.kapazitaet");
    else if (dz.ops.filter((o) => o.ziel === ziel).length >= DIENST.jeZiel) grund = t("tag_t8.dienst.grund.jeZiel", { n: DIENST.jeZiel });
    else if (def.nurMitWahl && !(e.wahl && e.wahl.tag - w.day > 0 && e.wahl.tag - w.day <= 365 && !/Zwischenwahlen|Parteitag/.test(e.wahl.art))) grund = t("tag_t8.dienst.grund.keineWahl");
    else if (akteurDef(ziel).form === "monarchie" && art === "kandidat") grund = t("tag_t8.dienst.grund.monarchie");
    const lager =
      art === "kandidat" && e.wahl?.herausforderer
        ? [
            { id: "herausforderer" as const, label: t("tag_t8.dienst.lager.herausforderer.haltung", { haltung: haltungWortVon(e.wahl.herausforderer.kurs) }) },
            { id: "amtsfuehrung" as const, label: t("tag_t8.dienst.lager.amtsfuehrung.haltung", { haltung: haltungWortVon(haltungFuehrung(w, ziel)) }) },
          ]
        : art === "kandidat"
          ? [{ id: "herausforderer" as const, label: t("tag_t8.dienst.lager.opposition") }, { id: "amtsfuehrung" as const, label: t("tag_t8.dienst.lager.amtsfuehrung") }]
          : undefined;
    return { def, moeglich: !grund, ...(grund ? { grund } : {}), aussicht: a, ...(lager ? { lager } : {}) };
  });
}

export function ordneAn(w: World, art: OpArt, ziel: string, lager?: Operation["lager"]): { ok: boolean; text: string; why?: string } {
  const spiel = w.spiel;
  if (!spiel) return { ok: false, text: t("tag_t8.dienst.fehlt.spiel") };
  const dz = dienst(w);
  const def = OP_DEFS[art];
  if (art === "gegen") {
    if (spiel.kapital < def.pk) return { ok: false, text: t("tag_t8.dienst.grund.kapital") };
    if (dz.kapazitaet < def.kap) return { ok: false, text: t("tag_t8.dienst.grund.kapazitaetKurz") };
    spiel.kapital -= def.pk;
    dz.kapazitaet -= def.kap;
    dz.abwehr = Math.max(dz.abwehr, def.monate);
    berichte(w, dz, def.name, t("tag_t8.dienst.gegen.bericht", { n: def.monate }), "info");
    return { ok: true, text: t("tag_t8.dienst.gegen.text", { n: def.monate }), why: t("tag_t8.dienst.gegen.why", { pk: def.pk, kap: def.kap }) };
  }
  const opt = opsOptionen(w, ziel).find((o) => o.def.art === art);
  if (!opt) return { ok: false, text: t("tag_t8.dienst.fehlt.op") };
  if (!opt.moeglich) return { ok: false, text: opt.grund ?? t("tag_t8.verm.geht_nicht") };
  spiel.kapital -= def.pk;
  dz.kapazitaet -= def.kap;
  dz.zaehler += 1;
  const op: Operation = { id: dz.zaehler, art, ziel, start: w.day, ende: w.day + def.monate * 30, pk: def.pk, kap: def.kap, ...(art === "kandidat" ? { lager: lager ?? "herausforderer" } : {}) };
  dz.ops.push(op);
  const lagerText = art === "kandidat" ? t(op.lager === "amtsfuehrung" ? "tag_t8.dienst.zugunsten.amtsfuehrung" : "tag_t8.dienst.zugunsten.herausforderer") : "";
  berichte(w, dz, `${def.name}: ${akteurName(ziel)}`, t("tag_t8.dienst.angeordnet", { lager: lagerText, n: def.monate, aussicht: opt.aussicht.wort, risiko: opt.aussicht.aufWort }), "info");
  return {
    ok: true,
    text: t("tag_t8.dienst.beginnt", { op: def.name, land: landFormen(ziel), lager: lagerText }),
    why: t("tag_t8.dienst.beginnt.why", { pk: def.pk, kap: def.kap, n: def.monate, aussicht: opt.aussicht.wort, risiko: opt.aussicht.aufWort }),
  };
}

// ---------------------------------------------------------------------------
// Ergebnis einer Operation

function folgenDerAufdeckung(w: World, m: WeltModell, dz: DienstZustand, op: Operation, erfolg: boolean, r: Rng): string[] {
  const out: string[] = [];
  const ziel = op.ziel;
  const def = OP_DEFS[op.art];
  beziehungAendern(w, ziel, { vertrauen: -6, konflikt: 5 });
  out.push(t("tag_t8.dienst.folge.botschafter", { name: akteurName(ziel) }));
  if (!erfolg || def.schwere >= 3) {
    wirke(w, "vertrauen_regierung", -1.5);
    wirke(w, "ansehen", -1);
    out.push(t("tag_t8.dienst.folge.skandal"));
  }
  if (!erfolg) {
    const partner = AKTEUR_IDS.filter((x) => x !== ziel && paarVon(w, ziel, x).buendnis >= 40)
      .sort((a, b) => paarVon(w, ziel, b).buendnis - paarVon(w, ziel, a).buendnis)
      .slice(0, 3);
    for (const x of partner) beziehungAendern(w, x, { vertrauen: -3 });
    if (partner.length) out.push(t("tag_t8.dienst.folge.partner", { land: landFormen(ziel), liste: partner.map(akteurName).join(", ") }));
    if ((ziel === "USA" || ziel === "EU") && NET.index.has("auslandskapital")) {
      wirke(w, "auslandskapital", -2);
      out.push(t("tag_t8.dienst.folge.strafen"));
    }
  }
  if (r.next() < 0.4) {
    dz.zaehler += 1;
    dz.eingehend.push({ id: dz.zaehler, von: ziel, art: r.next() < 0.5 ? "medien" : "einfluss", start: w.day + 30, ende: w.day + 150, aufgedeckt: false });
    out.push(t("tag_t8.dienst.folge.gegenschlag", { land: landFormen(ziel) }));
  }
  // Öffentlich: Die Zeitung und die Länderansicht zeigen die Aufdeckung
  weltNotiz(w, m, {
    art: "aufdeckung", id: ziel,
    titel: t("tag_t8.dienst.aufdeckung.titel", { name: akteurName(ziel) }),
    fakt: t("tag_t8.dienst.aufdeckung.fakt", { name: akteurName(ziel), op: def.name, folge: out[0]! }),
    wertung: -0.3, gewicht: 0.9,
  });
  addLog(w, "ereignis", t("tag_t8.dienst.aufdeckung.log", { name: akteurName(ziel) }), out.join("; ") + ".");
  return out;
}

function loeseAuf(w: World, m: WeltModell, dz: DienstZustand, op: Operation): void {
  if (op.art === "zugriff" || op.art === "kader" || op.art === "kanal") {
    loeseVorgang(w, m, dz, op);
    return;
  }
  const def = OP_DEFS[op.art];
  const r = new Rng(hashInt(`${w.seed}|op|${op.id}|${op.ziel}|${op.art}`));
  const a = aussicht(w, op.art, op.ziel, op.lager);
  const erfolg = r.next() < a.p;
  const entdeckt = r.next() < a.pAuf;
  const e = eigenVon(w, op.ziel);
  let ergebnis = "";
  if (erfolg) {
    switch (op.art) {
      case "kandidat": {
        const wucht = (op.lager === "amtsfuehrung" ? -0.9 : 0.9) * (0.8 + 0.2 * (dz.zugang[op.ziel] ?? 0));
        e.einfluss = clamp((e.einfluss ?? 0) + wucht, -3, 3);
        ergebnis = t("tag_t8.dienst.erg.kandidat", { lager: op.lager === "amtsfuehrung" ? "amtsfuehrung" : "herausforderer", richtung: wucht > 0 ? "auf" : "ab", wert: nf(e.einfluss ?? 0) });
        break;
      }
      case "desinfo":
        e.rueckhalt = clamp(Math.round((e.rueckhalt - 3.5) * 10) / 10, 0, 100);
        ergebnis = t("tag_t8.dienst.erg.desinfo", { land: landFormen(op.ziel), n: Math.round(e.rueckhalt) });
        break;
      case "netz":
        dz.zugang[op.ziel] = Math.min(netzMax(w), (dz.zugang[op.ziel] ?? 0) + 1);
        ergebnis = t("tag_t8.dienst.erg.netz", { n: dz.zugang[op.ziel] ?? 0, land: landFormen(op.ziel) });
        break;
      case "cyber": {
        const p = pAmtsfuehrung(w, op.ziel);
        dz.lagebild[op.ziel] = { tag: w.day, pAmtsfuehrung: p };
        const fremd = dz.eingehend.filter((x) => x.von === op.ziel && !x.aufgedeckt);
        for (const x of fremd) x.aufgedeckt = true;
        ergebnis = t("tag_t8.dienst.erg.cyber", { rueckhalt: Math.round(e.rueckhalt), stabilitaet: Math.round(e.stabilitaet), wahl: e.wahl ? t("tag_t8.dienst.erg.cyber.wahl", { n: Math.round(p * 100) }) : "", fremd: fremd.length ? t("tag_t8.dienst.erg.cyber.fremd", { n: fremd.length }) : "" });
        // Welle E3: Aufgedeckte fremde Operationen kommen als Vorgang „dienst_fremd“ auf den Tisch (sim/ereignisse-dienst.ts), nicht mehr über
        // die Großereignisse der Welt, die bei vollem Schreibtisch verfielen (beim Inhaber 2 fremde Operationen in 15 Jahren, keine gemeldet)
        void fremd;
        break;
      }
      case "gruppen":
        e.stabilitaet = clamp(e.stabilitaet - 6, 0, 100);
        e.rueckhalt = clamp(e.rueckhalt - 2, 0, 100);
        ergebnis = t("behoerden.mit.gruppen.erfolg", { land: akteurDef(op.ziel).inLand, name: akteurName(op.ziel), stabilitaet: Math.round(e.stabilitaet) });
        break;
      case "cyberangriff": {
        e.stabilitaet = clamp(e.stabilitaet - 2, 0, 100);
        e.rueckhalt = clamp(e.rueckhalt - 1.5, 0, 100);
        const fremd = dz.eingehend.filter((x) => x.von === op.ziel && w.day < x.ende);
        for (const x of fremd) x.ende = w.day;
        ergebnis = t("behoerden.mit.cyberangriff.erfolg", { land: akteurDef(op.ziel).inLand, name: akteurName(op.ziel), n: fremd.length });
        break;
      }
      case "gegen":
        break;
    }
  } else {
    ergebnis = t(op.art === "kandidat" ? "tag_t8.dienst.erg.kandidat.nichts" : op.art === "cyber" ? "tag_t8.dienst.erg.cyber.nichts" : "tag_t8.dienst.erg.nichts");
  }
  let folgen: string[] = [];
  if (entdeckt) {
    folgen = folgenDerAufdeckung(w, m, dz, op, erfolg, r);
    merkeAufgeflogen(w, dz, op, erfolg);
  }
  if (op.art === "gruppen" && r.next() < MIT_STUFEN.rueckschlag - 0.04 * (mitStufen(w).reichweite - 3)) {
    // Rückschlag: Die Gruppe verselbständigt sich; die Folgen landen im eigenen Grenzgebiet
    wirke(w, "terrorgefahr", 3);
    if (NET.index.has("gefluechtete")) wirke(w, "gefluechtete", 1);
    folgen.push(t("behoerden.mit.gruppen.rueckschlag"));
    addLog(w, "ereignis", t("behoerden.mit.gruppen.rueckschlag_titel", { land: akteurName(op.ziel) }), t("behoerden.mit.gruppen.rueckschlag"));
  }
  berichte(
    w, dz, `${def.name}: ${akteurName(op.ziel)}`,
    t("tag_t8.dienst.ausgang", { erfolg: erfolg ? "ja" : "nein", entdeckt: entdeckt ? "ja" : "nein", ergebnis, folgen: folgen.length ? t("tag_t8.dienst.ausgang.folgen", { liste: folgen.join("; ") }) : "" }),
    entdeckt ? "aufgedeckt" : erfolg ? "erfolg" : "fehlschlag",
  );
}

// ---------------------------------------------------------------------------
// Welle E3: Vorgänge nach dem echten MİT (Zugriff, Schlag gegen Kader, Austausch). Sie entstehen aus einer Gelegenheit auf dem Schreibtisch
// (sim/ereignisse-dienst.ts). Die Aussicht wird bei der Anordnung festgehalten; der Ausgang würfelt gegen genau diese Zahlen.
//
// Größenordnung aus belegten Fällen (Spielparameter, keine Messwerte):
// - Zugriff: Der MİT brachte bis April 2018 80 Personen aus 18 Ländern zurück (Hürriyet Daily News; AP), später „über 100“ (SCF). Er gelang
//   fast immer dort, wo die Behörden des Gastlands mitwirkten (Kosovo 2018, Moldau 06.09.2018, Kirgistan/İnandı 2021, Kenia 18.10.2024), und
//   scheiterte, wo sie es nicht taten (Mongolei 27.07.2018: das Flugzeug blieb über acht Stunden am Boden und flog ohne Akçay). Aufgedeckt
//   wurde er dort, wo Presse und Gerichte frei arbeiten: Kosovo entließ Innenminister und Geheimdienstchef (RFE/RL 30.03.2018), der EGMR
//   verurteilte Moldau (Ozdil u. a., 11.06.2019), der UNHCR rügte Kenia (22.10.2024). Daher: Aussicht aus dem Vertrauen des Gastlands,
//   Risiko aus seiner Medienoffenheit (Weltbank, „Voice and Accountability“).
// - Schlag gegen Kader: gezielte Schläge des MİT gegen PKK-Kader im Irak und in Syrien sind regelmäßig gemeldet (Daily Sabah 14.12.2023:
//   Drohnenschlag bei Sulaimaniyya; CNN Türk 14.04.2023: Kamışlı); am 29.04.2023 starb der IS-Anführer Abu Hussein al-Quraschi bei einem
//   Zugriff des MİT in Dschindires (Erdoğan am 30.04.2023). Der Irak bestellte im Juni 2020 den Botschafter ein und sagte im August 2020 ein
//   Ministertreffen ab, nachdem ein Drohnenschlag zwei irakische Offiziere getötet hatte (Al Jazeera 12.08.2020): Das Risiko ist ein Zwischenfall.
// - Austausch: Am 01.08.2024 wickelte der MİT in Ankara den Austausch von 26 Gefangenen zwischen den USA, Deutschland, Polen, Slowenien,
//   Norwegen, Russland und Belarus ab (Außenministerium Nr. 155; AA).

export type VorgangArt = "zugriff" | "kader" | "kanal";
/** Wie der Schlag gegen Kader geführt wird: aus der Luft oder als Festnahme am Boden */
export type KaderWeg = "schlag" | "festnahme";

export const VORGANG = {
  zugriff: {
    /** Aussicht: Grund, Zuschlag bei voller Mitwirkung des Gastlands (Vertrauen 30 → 0, 80 → 1) */
    p: { basis: 0.4, koop: 0.4, min: 0.15, max: 0.85 },
    /** Risiko: Grund, Medienoffenheit, fehlende Mitwirkung */
    auf: { basis: 0.2, medien: 0.45, ohneKoop: 0.15, min: 0.1, max: 0.85 },
    /** Erfolg: Kapital und Rückhalt im eigenen Lager */
    erfolg: { kapital: 3, nationalisten: 1.5, konservative: 0.5 },
    /** Aufgeflogen: Gastland, Ansehen, Europa (Kritik von UNHCR und EU) */
    aufgeflogen: { vertrauen: -8, konflikt: 4, ansehen: -1.5, eu: -2 },
  },
  kader: {
    p: { schlag: 0.62, festnahme: 0.42, min: 0.2, max: 0.85 },
    auf: { schlag: 0.25, festnahme: 0.35, min: 0.08, max: 0.6 },
    /** Erfolg: Täterkreis, Terrorgefahr, Rückhalt; beim Schlag gegen die PKK leidet ein laufender Friedensprozess */
    erfolg: { taeter: { schlag: 7, festnahme: 5 }, terrorgefahr: -1.5, nationalisten: 1, frieden: { schlag: -20, festnahme: -8 }, minderheiten: -1.5, ansehenFestnahme: 1 },
    /** Zwischenfall: Gastland protestiert, Ansehen */
    aufgeflogen: { vertrauen: -4, konflikt: 4, ansehen: -0.5 },
  },
  kanal: {
    p: { basis: 0.55, jePunkt: 0.004, min: 0.3, max: 0.85 },
    erfolg: { ansehen: 2.5, vertrauen: 5 },
    fehlschlag: { vertrauen: -1 },
  },
} as const;

const technikP = (w: World): number => stufenWert(MIT_STUFEN.technikP, mitStufen(w).technik);
const technikAuf = (w: World): number => stufenWert(MIT_STUFEN.technikAuf, mitStufen(w).technik);

/** Mitwirkung des Gastlands, 0 bis 1, aus seinem Vertrauen zur Türkei. */
export const mitwirkung = (w: World, ziel: string): number => clamp((beziehungZurTuerkei(w, ziel).vertrauen - 30) / 50, 0, 1);

/** Aussicht und Risiko eines Vorgangs, wie sie die Antwort zeigt und die Auflösung würfelt. */
export function vorgangAussicht(w: World, art: VorgangArt, ziel: string, weg: KaderWeg = "schlag"): { p: number; pAuf: number } {
  if (art === "zugriff") {
    const q = VORGANG.zugriff;
    const koop = mitwirkung(w, ziel);
    return {
      p: clamp(q.p.basis + q.p.koop * koop + technikP(w), q.p.min, q.p.max),
      pAuf: clamp(q.auf.basis + q.auf.medien * medienOffenheit(ziel) + q.auf.ohneKoop * (1 - koop) + technikAuf(w), q.auf.min, q.auf.max),
    };
  }
  if (art === "kader") {
    const q = VORGANG.kader;
    return { p: clamp(q.p[weg] + 2 * technikP(w), q.p.min, q.p.max), pAuf: clamp(q.auf[weg] + technikAuf(w), q.auf.min, q.auf.max) };
  }
  const q = VORGANG.kanal;
  const v = Math.min(beziehungZurTuerkei(w, "USA").vertrauen, beziehungZurTuerkei(w, "RUS").vertrauen);
  return { p: clamp(q.p.basis + q.p.jePunkt * (v - 40) + 0.05 * (mitStufen(w).personal - 3), q.p.min, q.p.max), pAuf: 0 };
}

/** Warum ein Vorgang gerade nicht geht (Kapital, Kapazität), sonst `undefined`. */
export function vorgangGrund(w: World, art: VorgangArt): string | undefined {
  const def = OP_DEFS[art];
  if (dienst(w).kapazitaet < def.kap) return t("tag_t8.dienst.grund.kapazitaet");
  return undefined;
}

/** Ordnet einen Vorgang an: Kapazität wird gebunden, Aussicht und Risiko festgehalten. Das Kapital bucht der Ereignismotor (Option.pk). */
export function ordneVorgangAn(w: World, art: VorgangArt, ziel: string, daten: Record<string, string | number> = {}): string {
  const dz = dienst(w);
  const def = OP_DEFS[art];
  const a = vorgangAussicht(w, art, ziel, (daten.weg as KaderWeg | undefined) ?? "schlag");
  dz.kapazitaet = Math.max(0, dz.kapazitaet - def.kap);
  dz.zaehler += 1;
  dz.ops.push({ id: dz.zaehler, art, ziel, start: w.day, ende: w.day + def.monate * 30, pk: def.pk, kap: def.kap, p: a.p, pAuf: a.pAuf, daten });
  berichte(w, dz, `${def.name}: ${akteurName(ziel)}`, t("welle_e3.dienst.bericht.angeordnet", { monate: def.monate, p: Math.round(a.p * 100), auf: Math.round(a.pAuf * 100) }), "info");
  return t("welle_e3.dienst.angeordnet", { op: def.name, monate: def.monate });
}

function loeseVorgang(w: World, m: WeltModell, dz: DienstZustand, op: Operation): void {
  const def = OP_DEFS[op.art];
  const r = new Rng(hashInt(`${w.seed}|op|${op.id}|${op.ziel}|${op.art}`));
  const a = op.p !== undefined && op.pAuf !== undefined ? { p: op.p, pAuf: op.pAuf } : vorgangAussicht(w, op.art as VorgangArt, op.ziel, (op.daten?.weg as KaderWeg | undefined) ?? "schlag");
  const erfolg = r.next() < a.p;
  const entdeckt = r.next() < a.pAuf;
  const land = landFormen(op.ziel);
  let ergebnis = "";
  const folgen: string[] = [];
  if (op.art === "zugriff") {
    const q = VORGANG.zugriff;
    if (erfolg) {
      if (w.spiel) w.spiel.kapital += q.erfolg.kapital;
      wirke(w, "nationalisten", q.erfolg.nationalisten);
      wirke(w, "konservative", q.erfolg.konservative);
      ergebnis = t("welle_e3.dienst.zugriff.erfolg", { land, kapital: q.erfolg.kapital });
      weltNotiz(w, m, { art: "aufdeckung", id: op.ziel, titel: t("welle_e3.dienst.zugriff.notiz", { land }), fakt: ergebnis, wertung: 0.1, gewicht: 0.6 });
    } else ergebnis = t("welle_e3.dienst.zugriff.fehlschlag", { land });
    if (entdeckt) {
      beziehungAendern(w, op.ziel, { vertrauen: q.aufgeflogen.vertrauen, konflikt: q.aufgeflogen.konflikt });
      wirke(w, "ansehen", q.aufgeflogen.ansehen);
      if (op.ziel !== "EU") beziehungAendern(w, "EU", { vertrauen: q.aufgeflogen.eu });
      folgen.push(t("welle_e3.dienst.zugriff.aufgeflogen", { land }));
    }
  } else if (op.art === "kader") {
    const q = VORGANG.kader;
    const weg: KaderWeg = op.daten?.weg === "festnahme" ? "festnahme" : "schlag";
    const taeter = op.daten?.taeter === "is" ? "is" : "pkk";
    if (erfolg) {
      const az = aussenZustand(w);
      az.terror[taeter] = Math.max(0, Math.round((az.terror[taeter] - q.erfolg.taeter[weg]) * 10) / 10);
      wirke(w, "terrorgefahr", q.erfolg.terrorgefahr);
      wirke(w, "nationalisten", q.erfolg.nationalisten);
      if (weg === "festnahme") wirke(w, "ansehen", q.erfolg.ansehenFestnahme);
      if (taeter === "pkk" && az.friedens.phase >= 1) {
        az.friedens.fortschritt = Math.round((az.friedens.fortschritt + q.erfolg.frieden[weg]) * 10) / 10;
        wirke(w, "minderheiten", q.erfolg.minderheiten);
        folgen.push(t("welle_e3.dienst.kader.frieden", { punkte: -q.erfolg.frieden[weg] }));
      }
      ergebnis = t(`welle_e3.dienst.kader.erfolg.${taeter}.${weg}`, { land, punkte: q.erfolg.taeter[weg] });
      weltNotiz(w, m, { art: "aufdeckung", id: op.ziel, titel: t(`welle_e3.dienst.kader.notiz.${taeter}`, { land }), fakt: ergebnis, wertung: 0.05, gewicht: 0.5 });
    } else ergebnis = t("welle_e3.dienst.kader.fehlschlag", { land });
    if (entdeckt) {
      beziehungAendern(w, op.ziel, { vertrauen: q.aufgeflogen.vertrauen, konflikt: q.aufgeflogen.konflikt });
      wirke(w, "ansehen", q.aufgeflogen.ansehen);
      folgen.push(t("welle_e3.dienst.kader.zwischenfall", { land }));
    }
  } else {
    const q = VORGANG.kanal;
    if (erfolg) {
      wirke(w, "ansehen", q.erfolg.ansehen);
      beziehungAendern(w, "USA", { vertrauen: q.erfolg.vertrauen });
      beziehungAendern(w, "RUS", { vertrauen: q.erfolg.vertrauen });
      ergebnis = t("welle_e3.dienst.kanal.erfolg");
      weltNotiz(w, m, { art: "aufdeckung", id: "USA", titel: t("welle_e3.dienst.kanal.notiz"), fakt: ergebnis, wertung: 0.3, gewicht: 0.8 });
    } else {
      beziehungAendern(w, "USA", { vertrauen: q.fehlschlag.vertrauen });
      beziehungAendern(w, "RUS", { vertrauen: q.fehlschlag.vertrauen });
      ergebnis = t("welle_e3.dienst.kanal.fehlschlag");
    }
  }
  if (entdeckt) {
    weltNotiz(w, m, { art: "aufdeckung", id: op.ziel, titel: t("tag_t8.dienst.aufdeckung.titel", { name: akteurName(op.ziel) }), fakt: folgen.join(" "), wertung: -0.3, gewicht: 0.9 });
    merkeAufgeflogen(w, dz, op, erfolg);
  }
  addLog(w, "ereignis", `${def.name}: ${akteurName(op.ziel)}`, [ergebnis, ...folgen].join(" "));
  berichte(w, dz, `${def.name}: ${akteurName(op.ziel)}`, [ergebnis, ...folgen].join(" "), entdeckt ? "aufgedeckt" : erfolg ? "erfolg" : "fehlschlag");
}

/** Eine aufgeflogene eigene Operation kommt als Vorgang „dienst_aufgeflogen“ auf den Tisch (dementieren, opfern, bekennen). */
function merkeAufgeflogen(w: World, dz: DienstZustand, op: Operation, erfolg: boolean): void {
  if (op.art === "gegen" || op.art === "kanal") return;
  (dz.aufgeflogen ??= []).push({ op: op.id, art: op.art, ziel: op.ziel, tag: w.day, erfolg });
  if (dz.aufgeflogen.length > 3) dz.aufgeflogen.shift();
}

// ---------------------------------------------------------------------------
// Fremde Operationen gegen die Türkei

export const EINGEHEND_NAME: Record<EingehendeOp["art"], string> = {
  get einfluss() { return t("tag_t8.dienst.eingehend.einfluss"); },
  get medien() { return t("tag_t8.dienst.eingehend.medien"); },
  get abhoeren() { return t("tag_t8.dienst.eingehend.abhoeren"); },
};

function wirkeEingehend(w: World, art: EingehendeOp["art"], faktor: number): void {
  if (art === "abhoeren") wirke(w, "ansehen", -0.5 * faktor);
  else wirke(w, "vertrauen_regierung", -(art === "einfluss" ? 1.2 : 0.8) * faktor);
}

function eingehendeMonat(w: World, m: WeltModell, dz: DienstZustand, rng: Rng): void {
  const spiel = w.spiel!;
  // Neue Operationen
  zusaetzlicheFremde(w, dz);
  if (w.day >= 150 && dz.eingehend.filter((x) => x.ende > w.day).length < 2) {
    const wahlNah = spiel.wahltag > w.day && spiel.wahltag - w.day <= 240 ? 0.5 : 0;
    for (const d of WELT) {
      if (d.id === "SYR" || d.id === "UKR" || d.id === "GEO" || d.id === "ARM" || d.id === "LBY" || d.id === "IRQ" || d.id === "AZE" || d.id === "KAZ") continue;
      const b = beziehungZurTuerkei(w, d.id);
      const feind = clamp((60 - b.vertrauen) / 40, 0, 1.5) + (b.konflikt >= 60 ? 0.3 : 0);
      const faehig = DIENST.faehigkeit[d.id] ?? 0.4;
      if (rng.next() < DIENST.fremdChance * (feind + wahlNah) * faehig) {
        dz.zaehler += 1;
        const art: EingehendeOp["art"] = wahlNah > 0 && rng.next() < 0.6 ? "einfluss" : rng.next() < 0.5 ? "medien" : "abhoeren";
        dz.eingehend.push({ id: dz.zaehler, von: d.id, art, start: w.day, ende: w.day + 120, aufgedeckt: false });
        break;
      }
    }
  }
  // Laufende
  for (const x of dz.eingehend) {
    if (x.aufgedeckt || w.day >= x.ende) continue;
    if (rng.next() < (dz.abwehr > 0 ? DIENST.fundChanceAbwehr : DIENST.fundChance) * stufenWert(MIT_STUFEN.fund, mitStufen(w).technik)) {
      x.aufgedeckt = true;
      berichte(w, dz, t("ev.welt_einfluss.titel", { land: landFormen(x.von), art: t(`ev.welt_einfluss.art.${x.art}`) }), t(`ev.welt_einfluss.text1.${x.art}`, { land: landFormen(x.von), nz: landZahl(x.von) }), "info");
    }
  }
  // Abgelaufene unentdeckte wirken still
  const rest: EingehendeOp[] = [];
  for (const x of dz.eingehend) {
    if (w.day < x.ende) {
      rest.push(x);
      continue;
    }
    if (!x.aufgedeckt) wirkeEingehend(w, x.art, dz.abwehr > 0 ? 0.6 : 1);
  }
  dz.eingehend = rest.filter((x) => !(x.aufgedeckt && w.day >= x.ende + 120));
}

/**
 * Welle E3: Fremde Dienste arbeiten öfter gegen die Türkei, als das Spiel bisher zeigte (beim Inhaber 2 Operationen in 15 Jahren). Belegte
 * Fälle: Im Januar 2024 nahmen MİT und Istanbuler Staatsanwaltschaft 34 Verdächtige eines Mossad-Netzes fest (Razzien in acht Provinzen;
 * The New Arab, 02.01.2024); im Juni 2022 vereitelte der MİT Anschlagspläne iranischer Zellen gegen Israelis in Istanbul (Al Jazeera,
 * 23.06.2022). Ein zusätzlicher Wurf je feindlich gesinntem Staat und Monat, aus Samen, Staat und Tag (nie aus dem Strom der Welt), mit
 * derselben Obergrenze von zwei laufenden. Häufigkeit und Dauer sind Spielparameter.
 */
export const FREMD_ZUSATZ = { chance: 0.006, ab: 150, dauer: 120, hoechstens: 2 } as const;

function zusaetzlicheFremde(w: World, dz: DienstZustand): void {
  if (w.day < FREMD_ZUSATZ.ab) return;
  for (const d of WELT) {
    if (dz.eingehend.filter((x) => x.ende > w.day).length >= FREMD_ZUSATZ.hoechstens) return;
    if (["SYR", "UKR", "GEO", "ARM", "LBY", "IRQ", "AZE", "KAZ"].includes(d.id)) continue;
    const b = beziehungZurTuerkei(w, d.id);
    const feind = clamp((60 - b.vertrauen) / 40, 0, 1.5) + (b.konflikt >= 60 ? 0.3 : 0);
    const faehig = DIENST.faehigkeit[d.id] ?? 0.4;
    const u = (hashInt(`${w.seed}|fremd+|${d.id}|${w.day}`) % 1000003) / 1000003;
    if (u >= FREMD_ZUSATZ.chance * feind * faehig) continue;
    const u2 = (hashInt(`${w.seed}|fremd+art|${d.id}|${w.day}`) % 1000003) / 1000003;
    dz.zaehler += 1;
    dz.eingehend.push({ id: dz.zaehler, von: d.id, art: u2 < 0.4 ? "abhoeren" : u2 < 0.7 ? "einfluss" : "medien", start: w.day, ende: w.day + FREMD_ZUSATZ.dauer, aufgedeckt: false });
    return;
  }
}

/** Die älteste aufgedeckte fremde Operation, die noch nicht als Vorgang vorlag (Welle E3, sim/ereignisse-dienst.ts). */
export function offeneFremde(w: World): EingehendeOp | undefined {
  return dienst(w).eingehend.find((x) => x.aufgedeckt && !x.gemeldet);
}

/** Die Antworten des Spielers auf eine aufgedeckte fremde Operation (Ereignis „welt_einfluss“). */
export type EinflussAntwort = "gegenspionage" | "oeffentlich" | "mediengesetz" | "nichts";

/** Was die Gegenspionage dem Dienst an Kapazität abzieht (die Beschreibung im Ereignis rechnet mit derselben Zahl). */
export const GEGENSPIONAGE_KAPAZITAET = 15;

export function beantworteEinfluss(w: World, opId: number, von: string, art: EingehendeOp["art"], antwort: EinflussAntwort): string {
  const dz = dienst(w);
  const m = weltModell(w);
  const x = dz.eingehend.find((y) => y.id === opId);
  if (x) dz.eingehend = dz.eingehend.filter((y) => y.id !== opId);
  // Texte aus dem Katalog (nacht_n5.json): Land mit Fällen und Zahl des Verbs, die Art der Operation je Schlüssel
  const p = { land: landFormen(von), nz: landZahl(von) };
  let text = "";
  switch (antwort) {
    case "gegenspionage":
      dz.kapazitaet = Math.max(0, dz.kapazitaet - GEGENSPIONAGE_KAPAZITAET);
      dz.abwehr = Math.max(dz.abwehr, 6);
      wirkeEingehend(w, art, 0.3);
      text = t(`ev.welt_einfluss.opt.gegenspionage.ausgang.${art}`, p);
      break;
    case "oeffentlich":
      beziehungAendern(w, von, { vertrauen: -5, konflikt: 3 });
      wirke(w, "ansehen", 0.3);
      wirke(w, "vertrauen_regierung", 0.4);
      wirkeEingehend(w, art, 0.3);
      weltNotiz(w, m, { art: "aufdeckung", id: von, titel: t("ev.welt_einfluss.notiz.titel", p), fakt: t("ev.welt_einfluss.notiz.fakt", { ...p, art: t(`ev.welt_einfluss.art.${art}`) }), wertung: 0.05, gewicht: 0.8 });
      text = t(`ev.welt_einfluss.opt.oeffentlich.ausgang.${art}`, p);
      break;
    case "mediengesetz":
      if (NET.index.has("pressefreiheit")) wirke(w, "pressefreiheit", -3);
      beziehungAendern(w, "EU", { vertrauen: -2 });
      text = t("ev.welt_einfluss.opt.mediengesetz.ausgang");
      break;
    case "nichts":
      wirkeEingehend(w, art, 1);
      text = t(`ev.welt_einfluss.standard.${art}`, p);
      break;
  }
  berichte(w, dz, t("ev.welt_einfluss.bericht.antwort", { ...p, art: t(`ev.welt_einfluss.art.${art}`) }), text, "info");
  return text;
}

// ---------------------------------------------------------------------------
// Netze im Ausland: Sie tragen, solange sie unentdeckt bleiben

function netzeMonat(w: World, m: WeltModell, dz: DienstZustand): void {
  const technik = mitStufen(w).technik;
  const schutz = [1.4, 1.2, 1, 0.85, 0.7][clamp(technik, 1, 5) - 1]!;
  for (const ziel of Object.keys(dz.zugang).sort()) {
    const n = dz.zugang[ziel] ?? 0;
    if (n <= 0) continue;
    const r = new Rng(hashInt(`${w.seed}|netzfund|${ziel}|${w.day}`));
    if (r.next() >= MIT_STUFEN.netzFund * n * (abwehrStaerke(ziel) / 50) * schutz) continue;
    dz.zugang[ziel] = Math.max(0, n - 2);
    beziehungAendern(w, ziel, { vertrauen: -4, konflikt: 2 });
    const titel = t("behoerden.mit.netz.aufgeflogen_titel", { land: akteurName(ziel) });
    const text = t("behoerden.mit.netz.aufgeflogen_text", { land: akteurName(ziel), stufe: dz.zugang[ziel] ?? 0 });
    berichte(w, dz, titel, text, "aufgedeckt");
    weltNotiz(w, m, { art: "aufdeckung", id: ziel, titel, fakt: text, wertung: -0.2, gewicht: 0.6 });
  }
}

// ---------------------------------------------------------------------------
// Der Dienst im Inland: Aufklärung, Terrorabwehr, Überwachung der Opposition, Schutz des Präsidenten

export type InlandArt = "aufklaerung" | "terror" | "ueberwachung" | "schutz";

export interface InlandDef {
  art: InlandArt;
  pk: number;
  kap: number;
  monate: number;
  /** Grunderfolg bei Stufe 3 */
  basis: number;
  /** Grundrisiko, dass etwas an die Öffentlichkeit dringt */
  leck: number;
}

/** Spielparameter der Inlandsoperationen. */
export const INLAND_DEFS: Record<InlandArt, InlandDef> = {
  aufklaerung: { art: "aufklaerung", pk: 2, kap: 15, monate: 3, basis: 0.6, leck: 0 },
  terror: { art: "terror", pk: 2, kap: 20, monate: 4, basis: 0.5, leck: 0 },
  ueberwachung: { art: "ueberwachung", pk: 1, kap: 15, monate: 3, basis: 0.6, leck: 0.3 },
  schutz: { art: "schutz", pk: 3, kap: 25, monate: 1, basis: 1, leck: 0 },
};

export interface InlandOption {
  def: InlandDef;
  name: string;
  text: string;
  moeglich: boolean;
  grund?: string;
  /** Erfolgschance und Risiko eines Lecks */
  p: number;
  pLeck: number;
}

function inlandAussicht(w: World, art: InlandArt): { p: number; pLeck: number } {
  const def = INLAND_DEFS[art];
  const st = mitStufen(w);
  const p = art === "schutz" ? 1 : clamp(def.basis + 0.08 * (st.personal - 3) + 0.05 * (st.technik - 3), 0.15, 0.9);
  // Wo die Presse frei ist, dringt mehr nach außen; gute Technik verwischt Spuren
  const presse = NET.index.has("pressefreiheit") ? nationalAverage(NET, w.net, "pressefreiheit") : 40;
  const pLeck = def.leck ? clamp(def.leck + 0.003 * (presse - 40) - 0.04 * (st.technik - 3), 0.08, 0.7) : 0;
  return { p, pLeck };
}

export function inlandOptionen(w: World): InlandOption[] {
  const dz = dienst(w);
  const spiel = w.spiel!;
  const laufend = new Set((dz.inland ?? []).map((x) => x.art));
  return (Object.keys(INLAND_DEFS) as InlandArt[]).map((art) => {
    const def = INLAND_DEFS[art];
    const a = inlandAussicht(w, art);
    let grund: string | undefined;
    if (laufend.has(art)) grund = t("behoerden.mit.inland.grund.laeuft");
    else if (art === "schutz" && (dz.schutzBis ?? -1) > w.day) grund = t("behoerden.mit.inland.grund.schutz", { monate: Math.ceil(((dz.schutzBis ?? 0) - w.day) / 30) });
    else if (spiel.kapital < def.pk) grund = t("tag_t8.dienst.grund.kapital");
    else if (dz.kapazitaet < def.kap) grund = t("tag_t8.dienst.grund.kapazitaet");
    return { def, name: t(`behoerden.mit.inland.${art}.name`), text: t(`behoerden.mit.inland.${art}.text`), moeglich: !grund, ...(grund ? { grund } : {}), p: a.p, pLeck: a.pLeck };
  });
}

export function ordneInlandAn(w: World, art: InlandArt): { ok: boolean; text: string; why?: string } {
  if (!w.spiel) return { ok: false, text: t("tag_t8.dienst.fehlt.spiel") };
  const opt = inlandOptionen(w).find((o) => o.def.art === art);
  if (!opt) return { ok: false, text: t("tag_t8.dienst.fehlt.op") };
  if (!opt.moeglich) return { ok: false, text: opt.grund ?? t("tag_t8.verm.geht_nicht") };
  const dz = dienst(w);
  const def = opt.def;
  w.spiel.kapital -= def.pk;
  dz.kapazitaet -= def.kap;
  dz.zaehler += 1;
  const why = t("behoerden.mit.inland.why", { pk: def.pk, kap: def.kap, monate: def.monate });
  if (art === "schutz") {
    // Sofort wirksam: Personenschutz und Abschirmung, die die Offiziere als Misstrauen lesen
    const tage = 150 + 30 * (mitStufen(w).personal - 3);
    dz.schutzBis = w.day + tage;
    const enden = w.spiel.enden;
    if (enden) enden.putsch.geschuetztBis = Math.max(enden.putsch.geschuetztBis ?? -1, w.day + tage);
    wirke(w, "offiziersvertrauen", -2);
    wirke(w, "legitimitaet", -0.5);
    berichte(w, dz, opt.name, t("behoerden.mit.inland.schutz.bericht", { monate: Math.round(tage / 30) }), "info");
    return { ok: true, text: t("behoerden.mit.inland.schutz.bericht", { monate: Math.round(tage / 30) }), why };
  }
  (dz.inland ??= []).push({ id: dz.zaehler, art, start: w.day, ende: w.day + def.monate * 30 });
  if (art === "ueberwachung") {
    // Der Preis fällt sofort an, auch wenn nichts herauskommt
    if (NET.index.has("pressefreiheit")) wirke(w, "pressefreiheit", -1);
    if (NET.index.has("zivilgesellschaft")) wirke(w, "zivilgesellschaft", -1);
  }
  berichte(w, dz, opt.name, t("behoerden.mit.inland.angeordnet", { monate: def.monate }), "info");
  return { ok: true, text: t("behoerden.mit.inland.angeordnet", { monate: def.monate }), why };
}

function inlandMonat(w: World, dz: DienstZustand): void {
  const sp = w.spiel;
  if (!sp || !dz.inland?.length) return;
  const fertig = dz.inland.filter((x) => w.day >= x.ende);
  dz.inland = dz.inland.filter((x) => w.day < x.ende);
  for (const op of fertig) {
    const art = op.art as InlandArt;
    if (!INLAND_DEFS[art]) continue;
    const r = new Rng(hashInt(`${w.seed}|inland|${op.id}|${art}`));
    const a = inlandAussicht(w, art);
    const erfolg = r.next() < a.p;
    const leck = r.next() < a.pLeck;
    const name = t(`behoerden.mit.inland.${art}.name`);
    let text = "";
    switch (art) {
      case "aufklaerung": {
        const putsch = sp.enden?.putsch.risiko ?? 0;
        const terror = NET.index.has("terrorgefahr") ? nationalAverage(NET, w.net, "terrorgefahr") : 0;
        if (erfolg) {
          dz.inlandLage = { tag: w.day, putsch, terror: Math.round(terror) };
          wirke(w, "terrorgefahr", -1.5);
          text = t("behoerden.mit.inland.aufklaerung.erfolg", { putsch, terror: Math.round(terror) });
        } else text = t("behoerden.mit.inland.aufklaerung.fehlschlag");
        break;
      }
      case "terror":
        if (erfolg) wirke(w, "terrorgefahr", -5);
        text = t(erfolg ? "behoerden.mit.inland.terror.erfolg" : "behoerden.mit.inland.terror.fehlschlag");
        break;
      case "ueberwachung":
        if (erfolg) {
          sp.kapital += 4;
          if (NET.index.has("protestdruck")) wirke(w, "protestdruck", -2);
        }
        text = t(erfolg ? "behoerden.mit.inland.ueberwachung.erfolg" : "behoerden.mit.inland.ueberwachung.fehlschlag");
        if (leck) {
          wirke(w, "vertrauen_regierung", -3);
          wirke(w, "legitimitaet", -3);
          wirke(w, "staedtische_saekulare", -3);
          if (NET.index.has("strassburg_druck")) wirke(w, "strassburg_druck", 3);
          // Unabhängige Gerichte stoppen die Maßnahme; das gewonnene Material ist dann wertlos
          const gericht = NET.index.has("justiz_unabhaengigkeit") ? nationalAverage(NET, w.net, "justiz_unabhaengigkeit") : 40;
          if (gericht >= 40 && erfolg) sp.kapital -= 4;
          const folge = t(gericht >= 40 ? "behoerden.mit.inland.ueberwachung.gericht" : "behoerden.mit.inland.ueberwachung.leck");
          text += ` ${folge}`;
          sp.hinweise.push({ id: `mit-leck-${op.id}`, titel: t("behoerden.mit.inland.ueberwachung.leck_titel"), szene: "istanbul", text: [folge] });
          addLog(w, "ereignis", t("behoerden.mit.inland.ueberwachung.leck_titel"), folge);
        }
        break;
      case "schutz":
        break;
    }
    berichte(w, dz, name, text, leck ? "aufgedeckt" : erfolg ? "erfolg" : "fehlschlag");
  }
}

/** Wie scharf das Lagebild des Dienstes ist (0 bis 100): Technik, Reichweite, frische Lagebilder und Netze. */
export function lagebildQualitaet(w: World): { wert: number; wort: string } {
  const dz = dienst(w);
  const st = mitStufen(w);
  const tage = stufenWert(MIT_STUFEN.lagebildTage, st.reichweite);
  const frisch = Object.values(dz.lagebild).filter((l) => w.day - l.tag <= tage).length;
  const netze = Object.values(dz.zugang).filter((n) => n > 0).length;
  const inland = dz.inlandLage && w.day - dz.inlandLage.tag <= tage ? 6 : 0;
  const wert = Math.round(clamp(10 * st.technik + 6 * st.reichweite + 4 * Math.min(5, frisch) + 2 * Math.min(5, netze) + inland, 0, 100));
  return { wert, wort: t(wert < 35 ? "behoerden.mit.lage.duenn" : wert < 55 ? "behoerden.mit.lage.brauchbar" : wert < 75 ? "behoerden.mit.lage.gut" : "behoerden.mit.lage.scharf") };
}

/** Wie gut der Präsident geschützt ist (0 bis 1): Personal des Dienstes und verstärkter Personenschutz. */
export function praesidentenSchutz(w: World): number {
  const dz = dienst(w);
  return clamp(0.4 + 0.1 * (mitStufen(w).personal - 3) + ((dz.schutzBis ?? -1) > w.day ? 0.3 : 0), 0, 1);
}

// ---------------------------------------------------------------------------
// Monatsschritt

function dienstMonat(w: World, m: WeltModell, rng: Rng): void {
  const dz = dienst(w);
  const st = mitStufen(w);
  dz.kapazitaet = Math.min(kapazitaetMax(w), dz.kapazitaet + stufenWert(MIT_STUFEN.zuwachs, st.personal));
  dz.abwehr = Math.max(0, dz.abwehr - 1);
  const fertig = dz.ops.filter((o) => w.day >= o.ende);
  dz.ops = dz.ops.filter((o) => w.day < o.ende);
  for (const op of fertig) loeseAuf(w, m, dz, op);
  eingehendeMonat(w, m, dz, rng);
  netzeMonat(w, m, dz);
  inlandMonat(w, dz);
  behoerdenMonat(w);
}

setzeDienstHaken(dienstMonat);

// ---------------------------------------------------------------------------
// Sicht für die Oberfläche

export interface DienstSicht {
  kapazitaet: number;
  kapazitaetMax: number;
  inland: { id: number; art: InlandArt; name: string; restTage: number }[];
  netze: { id: string; stufe: number; max: number }[];
  abwehr: number;
  laufend: { op: Operation; name: string; ziel: string; restTage: number }[];
  bericht: BerichtEintrag[];
  aufgedeckteFremde: { von: string; art: EingehendeOp["art"]; bis: number }[];
}

export function dienstSicht(w: World): DienstSicht {
  const dz = dienst(w);
  return {
    kapazitaet: dz.kapazitaet,
    kapazitaetMax: kapazitaetMax(w),
    inland: (dz.inland ?? []).map((x) => ({ id: x.id, art: x.art as InlandArt, name: t(`behoerden.mit.inland.${x.art}.name`), restTage: Math.max(0, x.ende - w.day) })),
    netze: Object.entries(dz.zugang).filter(([, n]) => n > 0).map(([id, n]) => ({ id, stufe: n, max: netzMax(w) })).sort((a, b) => b.stufe - a.stufe || a.id.localeCompare(b.id)),
    abwehr: dz.abwehr,
    laufend: dz.ops.map((op) => ({ op, name: OP_DEFS[op.art].name, ziel: op.ziel, restTage: Math.max(0, op.ende - w.day) })),
    bericht: [...dz.bericht].reverse(),
    aufgedeckteFremde: dz.eingehend.filter((x) => x.aufgedeckt).map((x) => ({ von: x.von, art: x.art, bis: x.ende })),
  };
}

/** Das Lagebild zu einer Wahl, falls die Aufklärung es in den letzten 180 Tagen geliefert hat. */
export function lagebildZu(w: World, id: string): { tag: number; pAmtsfuehrung: number } | undefined {
  const l = dienst(w).lagebild[id];
  return l && w.day - l.tag <= stufenWert(MIT_STUFEN.lagebildTage, mitStufen(w).reichweite) ? l : undefined;
}

/** Alle Staaten, gegen die sich eine Operation anordnen lässt (nach Namen sortiert). */
export const ZIEL_IDS: string[] = [...WELT.map((d) => d.id), ...WEITERE.map((d) => d.id)];
