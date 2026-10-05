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
};

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
  wort: string;
  aufWort: string;
  faktoren: string[];
}

const stufe = (p: number): string => (p < 0.15 ? "gering" : p < 0.3 ? "mäßig" : p < 0.5 ? "mittel" : "gut");
const stufeRisiko = (p: number): string => (p < 0.2 ? "gering" : p < 0.4 ? "mäßig" : p < 0.6 ? "hoch" : "sehr hoch");

export function aussicht(w: World, art: OpArt, ziel: string, lager?: Operation["lager"]): Aussicht {
  const def = OP_DEFS[art];
  const dz = dienst(w);
  const apparat = abwehrStaerke(ziel);
  const offen = medienOffenheit(ziel);
  const vorb = dz.zugang[ziel] ?? 0;
  const e = eigenVon(w, ziel);
  const faktoren: string[] = [];
  faktoren.push(`Sicherheitsapparat: ${apparat >= 65 ? "stark" : apparat >= 40 ? "mittel" : "schwach"} (${Math.round(apparat)} von 100)`);
  faktoren.push(`Medienlage: ${offen >= 0.65 ? "offen, aber mit kritischer Presse" : offen >= 0.4 ? "teilweise frei" : "kontrolliert"}`);
  let fenster = 1;
  if (art === "kandidat" || art === "desinfo") {
    const tage = e.wahl ? e.wahl.tag - w.day : null;
    if (tage !== null && tage > 0) {
      fenster = tage <= 150 ? 1 : tage <= 365 ? 0.7 : 0.4;
      faktoren.push(`Wahl in ${Math.max(1, Math.round(tage / 30))} Monaten${tage <= 150 ? " — das Fenster ist offen" : tage > 365 ? " — noch weit entfernt" : ""}`);
    } else {
      fenster = art === "kandidat" ? 0 : 0.8;
      faktoren.push(art === "kandidat" ? "keine Wahl in Sicht" : "keine Wahl in Sicht: die Kampagne zielt auf die Stimmung");
    }
  }
  faktoren.push(`Einflussnetz: ${vorb > 0 ? `Stufe ${vorb} von ${netzMax(w)}` : "keines"}`);
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
  if (art === "gegen") return { p: 1, pAuf: 0, wort: "sicher", aufWort: "kein", faktoren: [] };
  return { p, pAuf, wort: stufe(p), aufWort: stufeRisiko(pAuf), faktoren };
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
    else if (spiel.kapital < def.pk) grund = "Dafür fehlt Kapital.";
    else if (dz.kapazitaet < def.kap) grund = "Dafür fehlt Dienstkapazität: laufende Operationen binden sie.";
    else if (dz.ops.filter((o) => o.ziel === ziel).length >= DIENST.jeZiel) grund = `Gegen diesen Staat laufen schon ${DIENST.jeZiel} Operationen.`;
    else if (def.nurMitWahl && !(e.wahl && e.wahl.tag - w.day > 0 && e.wahl.tag - w.day <= 365 && !/Zwischenwahlen|Parteitag/.test(e.wahl.art))) grund = "Es steht in den nächsten zwölf Monaten keine Wahl an, die sich beeinflussen ließe.";
    else if (akteurDef(ziel).form === "monarchie" && art === "kandidat") grund = "Eine Monarchie hat keine Wahl.";
    const lager =
      art === "kandidat" && e.wahl?.herausforderer
        ? [
            { id: "herausforderer" as const, label: `Herausforderer (${haltungWortVon(e.wahl.herausforderer.kurs)})` },
            { id: "amtsfuehrung" as const, label: `Amtsführung (${haltungWortVon(haltungFuehrung(w, ziel))})` },
          ]
        : art === "kandidat"
          ? [{ id: "herausforderer" as const, label: "Opposition" }, { id: "amtsfuehrung" as const, label: "Amtsführung" }]
          : undefined;
    return { def, moeglich: !grund, ...(grund ? { grund } : {}), aussicht: a, ...(lager ? { lager } : {}) };
  });
}

export function ordneAn(w: World, art: OpArt, ziel: string, lager?: Operation["lager"]): { ok: boolean; text: string; why?: string } {
  const spiel = w.spiel;
  if (!spiel) return { ok: false, text: "Ohne Spielschleife gibt es keinen Dienst." };
  const dz = dienst(w);
  const def = OP_DEFS[art];
  if (art === "gegen") {
    if (spiel.kapital < def.pk) return { ok: false, text: "Dafür fehlt Kapital." };
    if (dz.kapazitaet < def.kap) return { ok: false, text: "Dafür fehlt Dienstkapazität." };
    spiel.kapital -= def.pk;
    dz.kapazitaet -= def.kap;
    dz.abwehr = Math.max(dz.abwehr, def.monate);
    berichte(w, dz, def.name, `Die Gegenspionage ist für ${def.monate} Monate verstärkt: Fremde Operationen werden eher entdeckt und wirken schwächer.`, "info");
    return { ok: true, text: `Die Gegenspionage ist für ${def.monate} Monate verstärkt.`, why: `Kostet ${def.pk} Kapital und ${def.kap} Dienstkapazität.` };
  }
  const opt = opsOptionen(w, ziel).find((o) => o.def.art === art);
  if (!opt) return { ok: false, text: "Diese Operation gibt es nicht." };
  if (!opt.moeglich) return { ok: false, text: opt.grund ?? "Das geht gerade nicht." };
  spiel.kapital -= def.pk;
  dz.kapazitaet -= def.kap;
  dz.zaehler += 1;
  const op: Operation = { id: dz.zaehler, art, ziel, start: w.day, ende: w.day + def.monate * 30, pk: def.pk, kap: def.kap, ...(art === "kandidat" ? { lager: lager ?? "herausforderer" } : {}) };
  dz.ops.push(op);
  const lagerText = art === "kandidat" ? (op.lager === "amtsfuehrung" ? " zugunsten der Amtsführung" : " zugunsten des Herausforderers") : "";
  berichte(w, dz, `${def.name}: ${akteurName(ziel)}`, `Angeordnet${lagerText}. Dauer ${def.monate} Monate, Aussicht ${opt.aussicht.wort}, Risiko der Aufdeckung ${opt.aussicht.aufWort}.`, "info");
  return {
    ok: true,
    text: `Der Dienst beginnt die Operation „${def.name}“ gegen ${akteurAkk(ziel)}${lagerText}.`,
    why: `Kostet ${def.pk} Kapital und ${def.kap} Dienstkapazität; Ergebnis in ${def.monate} Monaten. Aussicht ${opt.aussicht.wort}, Aufdeckungsrisiko ${opt.aussicht.aufWort}.`,
  };
}

// ---------------------------------------------------------------------------
// Ergebnis einer Operation

function folgenDerAufdeckung(w: World, m: WeltModell, dz: DienstZustand, op: Operation, erfolg: boolean, r: Rng): string[] {
  const out: string[] = [];
  const ziel = op.ziel;
  const def = OP_DEFS[op.art];
  beziehungAendern(w, ziel, { vertrauen: -6, konflikt: 5 });
  out.push(`${akteurName(ziel)} bestellt den türkischen Botschafter ein`);
  if (!erfolg || def.schwere >= 3) {
    wirke(w, "vertrauen_regierung", -1.5);
    wirke(w, "ansehen", -1);
    out.push("Innenpolitischer Skandal: Die Opposition spricht von Amtsmissbrauch");
  }
  if (!erfolg) {
    const partner = AKTEUR_IDS.filter((x) => x !== ziel && paarVon(w, ziel, x).buendnis >= 40)
      .sort((a, b) => paarVon(w, ziel, b).buendnis - paarVon(w, ziel, a).buendnis)
      .slice(0, 3);
    for (const x of partner) beziehungAendern(w, x, { vertrauen: -3 });
    if (partner.length) out.push(`Partner von ${akteurDat(ziel)} gehen auf Distanz: ${partner.map(akteurName).join(", ")}`);
    if ((ziel === "USA" || ziel === "EU") && NET.index.has("auslandskapital")) {
      wirke(w, "auslandskapital", -2);
      out.push("Strafmaßnahmen und Zurückhaltung der Investoren");
    }
  }
  if (r.next() < 0.4) {
    dz.zaehler += 1;
    dz.eingehend.push({ id: dz.zaehler, von: ziel, art: r.next() < 0.5 ? "medien" : "einfluss", start: w.day + 30, ende: w.day + 150, aufgedeckt: false });
    out.push(`Mit einem Gegenschlag ${akteurDat(ziel)} ist zu rechnen`);
  }
  // Öffentlich: Die Zeitung und die Länderansicht zeigen die Aufdeckung
  weltNotiz(w, m, {
    art: "aufdeckung", id: ziel,
    titel: `Spionagevorwürfe gegen die Türkei: ${akteurName(ziel)}`,
    fakt: `${akteurName(ziel)} wirft dem türkischen Geheimdienst vor, sich in die Politik des Landes eingemischt zu haben (${def.name}). ${out[0]}.`,
    wertung: -0.3, gewicht: 0.9,
  });
  addLog(w, "ereignis", `Spionagevorwürfe: ${akteurName(ziel)} deckt eine Operation auf`, out.join("; ") + ".");
  return out;
}

function loeseAuf(w: World, m: WeltModell, dz: DienstZustand, op: Operation): void {
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
        ergebnis = `Die Unterstützung ${op.lager === "amtsfuehrung" ? "der Amtsführung" : "des Herausforderers"} wirkt: Der Einfluss auf die Wahl ${wucht > 0 ? "wächst" : "sinkt"} auf ${nf(e.einfluss ?? 0)}. Die Wahl bleibt offen.`;
        break;
      }
      case "desinfo":
        e.rueckhalt = clamp(Math.round((e.rueckhalt - 3.5) * 10) / 10, 0, 100);
        ergebnis = `Die Kampagne verfängt: Der Rückhalt der Führung ${akteurDef(op.ziel).inLand} sinkt auf ${Math.round(e.rueckhalt)} von 100.`;
        break;
      case "netz":
        dz.zugang[op.ziel] = Math.min(netzMax(w), (dz.zugang[op.ziel] ?? 0) + 1);
        ergebnis = `Das Einflussnetz wächst auf Stufe ${dz.zugang[op.ziel]}: Spätere Operationen gegen ${akteurAkk(op.ziel)} werden leichter.`;
        break;
      case "cyber": {
        const p = pAmtsfuehrung(w, op.ziel);
        dz.lagebild[op.ziel] = { tag: w.day, pAmtsfuehrung: p };
        const fremd = dz.eingehend.filter((x) => x.von === op.ziel && !x.aufgedeckt);
        for (const x of fremd) x.aufgedeckt = true;
        ergebnis = `Das Lagebild: Rückhalt der Führung ${Math.round(e.rueckhalt)} von 100, Stabilität ${Math.round(e.stabilitaet)} von 100${e.wahl ? `, die Amtsführung gewinnt die nächste Wahl mit etwa ${Math.round(p * 100)} Prozent` : ""}.${fremd.length ? ` Außerdem: ${fremd.length} Operation${fremd.length > 1 ? "en" : ""} von dort gegen die Türkei aufgedeckt.` : ""}`;
        if (fremd.length) m.ereignisKandidaten = [...(m.ereignisKandidaten ?? []), { art: "einfluss", id: op.ziel, einfluss: fremd[0]!.art, opId: fremd[0]!.id }];
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
    ergebnis = op.art === "kandidat" ? "Die Unterstützung bleibt ohne messbare Wirkung." : op.art === "cyber" ? "Der Zugang scheitert: kein verwertbares Lagebild." : "Die Operation verpufft.";
  }
  let folgen: string[] = [];
  if (entdeckt) folgen = folgenDerAufdeckung(w, m, dz, op, erfolg, r);
  if (op.art === "gruppen" && r.next() < MIT_STUFEN.rueckschlag - 0.04 * (mitStufen(w).reichweite - 3)) {
    // Rückschlag: Die Gruppe verselbständigt sich; die Folgen landen im eigenen Grenzgebiet
    wirke(w, "terrorgefahr", 3);
    if (NET.index.has("gefluechtete")) wirke(w, "gefluechtete", 1);
    folgen.push(t("behoerden.mit.gruppen.rueckschlag"));
    addLog(w, "ereignis", t("behoerden.mit.gruppen.rueckschlag_titel", { land: akteurName(op.ziel) }), t("behoerden.mit.gruppen.rueckschlag"));
  }
  berichte(
    w, dz, `${def.name}: ${akteurName(op.ziel)}`,
    `${erfolg ? "Erfolg" : "Fehlschlag"}${entdeckt ? ", aufgedeckt" : ", unentdeckt"}. ${ergebnis}${folgen.length ? ` Folgen: ${folgen.join("; ")}.` : ""}`,
    entdeckt ? "aufgedeckt" : erfolg ? "erfolg" : "fehlschlag",
  );
}

// ---------------------------------------------------------------------------
// Fremde Operationen gegen die Türkei

export const EINGEHEND_NAME: Record<EingehendeOp["art"], string> = {
  einfluss: "Einflussversuch vor der Wahl",
  medien: "Medienkampagne",
  abhoeren: "Abhöraktion",
};

function wirkeEingehend(w: World, art: EingehendeOp["art"], faktor: number): void {
  if (art === "abhoeren") wirke(w, "ansehen", -0.5 * faktor);
  else wirke(w, "vertrauen_regierung", -(art === "einfluss" ? 1.2 : 0.8) * faktor);
}

function eingehendeMonat(w: World, m: WeltModell, dz: DienstZustand, rng: Rng): void {
  const spiel = w.spiel!;
  // Neue Operationen
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
      berichte(w, dz, `${EINGEHEND_NAME[x.art]} aufgedeckt`, `Der Dienst entdeckt: ${akteurName(x.von)} betreibt eine ${EINGEHEND_NAME[x.art].toLowerCase()} gegen die Türkei.`, "info");
      m.ereignisKandidaten = [...(m.ereignisKandidaten ?? []), { art: "einfluss", id: x.von, einfluss: x.art, opId: x.id }];
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

/** Die Antworten des Spielers auf eine aufgedeckte fremde Operation (Ereignis „welt_einfluss“). */
export type EinflussAntwort = "gegenspionage" | "oeffentlich" | "mediengesetz" | "nichts";

export function beantworteEinfluss(w: World, opId: number, von: string, art: EingehendeOp["art"], antwort: EinflussAntwort): string {
  const dz = dienst(w);
  const m = weltModell(w);
  const x = dz.eingehend.find((y) => y.id === opId);
  if (x) dz.eingehend = dz.eingehend.filter((y) => y.id !== opId);
  const name = akteurName(von);
  let text = "";
  switch (antwort) {
    case "gegenspionage":
      dz.kapazitaet = Math.max(0, dz.kapazitaet - 15);
      dz.abwehr = Math.max(dz.abwehr, 6);
      wirkeEingehend(w, art, 0.3);
      text = `Der Dienst verstärkt die Gegenspionage und fängt den Großteil der ${EINGEHEND_NAME[art].toLowerCase()} ${akteurDat(von)} ab; der Rest verpufft.`;
      break;
    case "oeffentlich":
      beziehungAendern(w, von, { vertrauen: -5, konflikt: 3 });
      wirke(w, "ansehen", 0.3);
      wirke(w, "vertrauen_regierung", 0.4);
      wirkeEingehend(w, art, 0.3);
      weltNotiz(w, m, { art: "aufdeckung", id: von, titel: `Die Türkei beschuldigt ${akteurAkk(von)} der Einmischung`, fakt: `Ankara macht eine ${EINGEHEND_NAME[art].toLowerCase()} ${akteurDat(von)} öffentlich und bestellt den Botschafter ein.`, wertung: 0.05, gewicht: 0.8 });
      text = `Ankara macht die ${EINGEHEND_NAME[art].toLowerCase()} öffentlich und bestellt den Botschafter von ${name} ein: Die Regierung gewinnt Rückhalt, das Verhältnis kühlt ab.`;
      break;
    case "mediengesetz":
      if (NET.index.has("pressefreiheit")) wirke(w, "pressefreiheit", -3);
      beziehungAendern(w, "EU", { vertrauen: -2 });
      text = `Ein verschärftes Mediengesetz macht ausländische Kampagnen schwerer; Kritiker und Brüssel sehen darin einen Schritt gegen die Pressefreiheit.`;
      break;
    case "nichts":
      wirkeEingehend(w, art, 1);
      text = `Ankara reagiert nicht: Die ${EINGEHEND_NAME[art].toLowerCase()} läuft weiter und kostet Rückhalt.`;
      break;
  }
  berichte(w, dz, `${EINGEHEND_NAME[art]} ${akteurDat(von)}: Antwort`, text, "info");
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
    else if (spiel.kapital < def.pk) grund = "Dafür fehlt Kapital.";
    else if (dz.kapazitaet < def.kap) grund = "Dafür fehlt Dienstkapazität: laufende Operationen binden sie.";
    return { def, name: t(`behoerden.mit.inland.${art}.name`), text: t(`behoerden.mit.inland.${art}.text`), moeglich: !grund, ...(grund ? { grund } : {}), p: a.p, pLeck: a.pLeck };
  });
}

export function ordneInlandAn(w: World, art: InlandArt): { ok: boolean; text: string; why?: string } {
  if (!w.spiel) return { ok: false, text: "Ohne Spielschleife gibt es keinen Dienst." };
  const opt = inlandOptionen(w).find((o) => o.def.art === art);
  if (!opt) return { ok: false, text: "Diese Operation gibt es nicht." };
  if (!opt.moeglich) return { ok: false, text: opt.grund ?? "Das geht gerade nicht." };
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
