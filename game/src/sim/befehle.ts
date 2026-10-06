// Freie Sprache wird hier in geprüfte Aktionen übersetzt (Spieldesign, Abschnitt 5 und 6).
// Der Kern bleibt die einzige Wahrheitsquelle: Diese Ebene erfindet keine Zahlen, sondern wählt aus einem
// festen Handlungskatalog und meldet, was der Kern protokolliert. Ein Sprachmodell kann später dieselbe
// Schnittstelle benutzen; ohne Schlüssel bleibt das Spiel über diese Regeln spielbar.
//
// Grundsätze: Wörter werden als Ganzes gelesen (nie als Teilstring); was nicht sicher verstanden wird, führt zu
// einer Rückfrage und nie zu einer ungewollten Ausführung; was es im Spiel noch nicht gibt, wird ehrlich gesagt.

import { advance, criticizeCentralBank, replaceGovernor } from "./world";
import { einfacherSchritt, setzePosten } from "./haushalt";
import { NET } from "./modell";
import { nationalAverage, PROVINCES } from "./netz";
import { formatDateDe } from "./dates";
import { PROVINZEN } from "./regional";
import { PARTEI_NAME } from "./fraktionen";
import { akuteOrte, bringeEin, provinzenText, pruefeVorhaben, stimmenSicht, stufeIn } from "./handeln";
import { entlasseFigur, sprichMitFigur } from "./eingriffe";
import { AktionId, aktionenFuer, anliegenStand, dimensionZu, fuehreAktionAus, haltungWort, land, weltZustand } from "./laender";
import { waehlerLage } from "./waehler";
import { naechsterSchritt, starteSchritt } from "./programme";
import { tunWort } from "../data/skalen";
import { hebel, MAKRO_WEGE } from "./wege";
import { haltung } from "./figuren";
import { zielStand } from "./ziele";
import { SPIEL, kapitalEinkommen } from "./spiel";
import { fraktionsUebersicht, verhandle, type Verhandlung } from "./verhandeln";
import {
  ARTIKEL,
  VERFASSUNG_REGELN,
  artikelDef,
  bringeVerfassungEin,
  kampagnenImpuls,
  paketStimmen,
  pruefeVerfassung,
  referendumPrognose,
  varianteDef,
  verfassungStand,
  verfassungStimmenKaufen,
  verfassungsZustand,
  zieheVerfassungZurueck,
} from "./verfassung";
import { antworten, entscheide, vorlage } from "./ereignisse";
import { aktiveKriege, fuehreKriegHandlungAus, handlungenFuer, kriegMit, PHASEN_NAME, type KriegHandlungId } from "./krieg";
import { entwirf, friedensAntwort, schaetzKurz, siehtNachGrossprojekt } from "./grossprojekt";
import { INITIATIVE_VORLAGE_IDS } from "./initiative";
import { Rng } from "./rng";
import type { World } from "./types";
import type { NodeSpec } from "../data/politiknetz";
import { t as tx } from "../i18n";

export interface ChatZeile {
  rolle: "spieler" | "spiel";
  text: string;
  why?: string;
}

export interface ChatAntwort {
  ok: boolean;
  text: string;
  why?: string;
}

const BEISPIELE = [
  tx("sim2.sim.befehle.a663a5a"),
  tx("sim2.sim.befehle.8fa88b4"),
  tx("sim2.sim.befehle.9e2af70"),
  tx("sim2.sim.befehle.db2f401"),
  tx("sim2.sim.befehle.d84d976"),
  tx("sim2.sim.befehle.af99023"),
  tx("sim2.sim.befehle.1648119"),
  tx("sim2.sim.befehle.e1a95a8"),
  tx("sim2.sim.befehle.7e5061d"),
  "Ein Monat weiter.",
];

export function willkommensText(): string {
  return (
    tx("sim2.sim.befehle.95a369f") +
    BEISPIELE.slice(0, 3).join(" · ") +
    tx("sim2.sim.befehle.0b52cab")
  );
}

// ---------------------------------------------------------------------------
// Vorverarbeitung

/** Kleinschreibung ohne Umlaute und Akzente; türkische Buchstaben werden zu ihren lateinischen Verwandten. */
export function fold(s: string): string {
  return s
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/ı/g, "i")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const STOPP = new Set(["und", "der", "die", "das", "den", "dem", "des", "fuer", "von", "auf", "mit", "gegen", "im", "in", "an", "zu", "zur", "zum", "bei", "eine", "einen", "ein", "ich", "will", "moechte", "bitte", "wir", "sollen", "soll", "muss", "mehr", "weniger"]);

function tokens(t: string): string[] {
  return t.split(" ").filter(Boolean);
}

const hat = (tk: string[], ...woerter: string[]) => woerter.some((w) => tk.includes(w));
const hatPrefix = (tk: string[], ...praefixe: string[]) => tk.some((t) => praefixe.some((p) => t.startsWith(p)));

// ---------------------------------------------------------------------------
// Orte

const PROV_FOLD = PROVINZEN.map((p) => ({ plaka: p.plaka, name: fold(p.name), region: p.region })).sort((a, b) => b.name.length - a.name.length);

const REGION_NAMEN: Record<string, string[]> = {
  marmara: ["Marmara"],
  aegaeis: ["Ege"],
  ege: ["Ege"],
  mittelmeer: ["Akdeniz"],
  akdeniz: ["Akdeniz"],
  zentralanatolien: ["İç Anadolu"],
  schwarzmeer: ["Karadeniz"],
  karadeniz: ["Karadeniz"],
  ostanatolien: ["Doğu Anadolu"],
  suedostanatolien: ["Güneydoğu Anadolu"],
  osten: ["Doğu Anadolu", "Güneydoğu Anadolu"],
  westen: ["Marmara", "Ege"],
  suedosten: ["Güneydoğu Anadolu"],
  norden: ["Karadeniz"],
  sueden: ["Akdeniz", "Güneydoğu Anadolu"],
};

export function ortAusText(t: string): number[] | null {
  const gefunden = new Set<number>();
  for (const p of PROV_FOLD) {
    if (new RegExp(`(^| )${p.name}( |$)`).test(t)) gefunden.add(p.plaka);
  }
  for (const [wort, regionen] of Object.entries(REGION_NAMEN)) {
    if (new RegExp(`(^| )(im |in |am |der |den )?${wort}( |$)`).test(t) && !(wort === "osten" && gefunden.size)) {
      for (const p of PROVINZEN) if (regionen.includes(p.region)) gefunden.add(p.plaka);
    }
  }
  return gefunden.size ? [...gefunden].sort((a, b) => a - b) : null;
}

// ---------------------------------------------------------------------------
// Maßnahmen finden

const SYNONYME: Record<string, string[]> = {
  rente: ["m_renten"],
  renten: ["m_renten"],
  rentner: ["m_renten"],
  schule: ["m_schulbau"],
  schulen: ["m_schulbau"],
  lehrer: ["m_lehrergehaelter"],
  krankenhaus: ["m_krankenhausbau"],
  krankenhaeuser: ["m_krankenhausbau"],
  klinik: ["m_krankenhausbau"],
  kliniken: ["m_krankenhausbau"],
  aerzte: ["m_aerztegehalt"],
  strasse: ["m_autobahnen"],
  strassen: ["m_autobahnen"],
  autobahn: ["m_autobahnen"],
  autobahnen: ["m_autobahnen"],
  bruecke: ["m_autobahnen"],
  bruecken: ["m_autobahnen"],
  bahn: ["m_bahn"],
  eisenbahn: ["m_bahn"],
  zug: ["m_bahn"],
  zuege: ["m_bahn"],
  wohnung: ["m_sozialwohnungen"],
  wohnungen: ["m_sozialwohnungen"],
  sozialwohnungen: ["m_sozialwohnungen"],
  miete: ["m_mietdeckel"],
  mieten: ["m_mietdeckel"],
  wasser: ["m_wasserleitungen"],
  strom: ["m_netzausbau"],
  stromnetz: ["m_netzausbau"],
  polizei: ["m_polizei"],
  justiz: ["m_justizreform"],
  gerichte: ["m_justizreform"],
  grenze: ["m_grenzschutz"],
  grenzen: ["m_grenzschutz"],
  eu: ["m_eu_annaeherung"],
  armee: ["m_verteidigung"],
  militaer: ["m_verteidigung"],
  soldaten: ["m_verteidigung"],
  export: ["m_exportfoerderung"],
  tourismus: ["m_tourismuswerbung"],
  internet: ["m_breitband"],
  breitband: ["m_breitband"],
  presse: ["m_medienaufsicht"],
  medien: ["m_medienaufsicht"],
  korruption: ["m_antikorruption"],
  erdbebensicher: ["m_stadterneuerung", "m_bauaufsicht"],
  erdbeben: ["m_stadterneuerung", "m_bauaufsicht"],
  erdbebenhilfe: ["m_stadterneuerung", "m_bauaufsicht"],
  erdbebenvorsorge: ["m_stadterneuerung", "m_bauaufsicht"],
  katastrophenschutz: ["m_afad_ausbau"],
  katastrophe: ["m_afad_ausbau"],
  afad: ["m_afad_ausbau"],
  fruehwarnung: ["m_fruehwarnsystem"],
  fruehwarnsystem: ["m_fruehwarnsystem"],
  warnsystem: ["m_fruehwarnsystem"],
  gebaeudeverstaerkung: ["m_gebaeudeverstaerkung"],
  ertuechtigung: ["m_gebaeudeverstaerkung"],
  versicherungspflicht: ["m_versicherungspflicht"],
  pflichtversicherung: ["m_versicherungspflicht"],
  loehne: ["m_mindestlohn"],
  lohn: ["m_mindestlohn"],
  bildung: ["m_schulbau", "m_lehrergehaelter"],
  gesundheit: ["m_krankenhausbau", "m_aerztegehalt"],
  steuer: ["m_einkommensteuer", "m_mwst", "m_koerperschaftsteuer", "m_kraftstoffsteuer", "m_immobiliensteuer"],
  steuern: ["m_einkommensteuer", "m_mwst", "m_koerperschaftsteuer", "m_kraftstoffsteuer", "m_immobiliensteuer"],
  landwirte: ["m_agrarsubventionen"],
  bauern: ["m_agrarsubventionen"],
  studenten: ["m_stipendien"],
  universitaeten: ["m_unigruendungen"],
  fluechtlinge: ["m_integration", "m_grenzschutz", "m_rueckkehr"],
  kinder: ["m_kindergeld", "m_kinderbetreuung"],
  familie: ["m_kindergeld"],
};

interface Kandidat {
  node: NodeSpec;
  schluessel: string[];
  name: string;
}

const KANDIDATEN: Kandidat[] = NET.nodes
  .filter((n) => n.kind === "massnahme")
  .map((n) => ({
    node: n,
    name: fold(n.name),
    schluessel: fold(n.name)
      .split(" ")
      .filter((w) => w.length >= 4 && !STOPP.has(w)),
  }));

function tokenTrifft(t: string, key: string): number {
  if (t === key) return 3;
  if (t.length >= 6 && key.length >= 6 && (t.startsWith(key) || key.startsWith(t))) return 2;
  if (t.length >= 5 && key.length >= 5 && t.slice(0, 5) === key.slice(0, 5)) return 1;
  return 0;
}

function findeMassnahmen(t: string, tk: string[]): { beste: Kandidat[]; punkte: number } {
  const wertung = KANDIDATEN.map((k) => {
    let p = 0;
    if (t.includes(k.name)) p += 6;
    for (const w of tk) {
      if (STOPP.has(w) || w.length < 3) continue;
      let best = 0;
      for (const key of k.schluessel) best = Math.max(best, tokenTrifft(w, key));
      p += best;
      if (SYNONYME[w]?.includes(k.node.id)) p += 3;
    }
    return { k, p };
  });
  const max = Math.max(...wertung.map((x) => x.p));
  const beste = wertung.filter((x) => x.p === max && max > 0).map((x) => x.k);
  // Ein Sammelwort wie „Steuern“ meint alle seine Maßnahmen, nicht nur die mit dem Wort im Namen
  for (const w of tk) {
    const syn = SYNONYME[w];
    if (syn && syn.length > 1 && beste.some((k) => syn.includes(k.node.id))) {
      return { beste: KANDIDATEN.filter((k) => syn.includes(k.node.id)), punkte: max };
    }
  }
  return { beste, punkte: max };
}

// ---------------------------------------------------------------------------
// Richtung und Menge

const RAUF = ["erhoeh", "anheb", "steiger", "staerk", "ausbau", "ausweit", "verbesser", "verschaerf", "einfuehr", "foerder", "investier", "aufstock", "verdoppel", "hoeher", "rauf", "baue", "bauen", "baut", "bau", "erricht", "schaff"];
const RUNTER = ["senk", "reduzier", "kuerz", "streich", "abschaff", "abbau", "runter", "verringer", "lockern", "aussetz", "halbier", "zurueckfahr", "niedriger", "abgeschafft"];

function richtung(tk: string[]): { rauf: boolean; runter: boolean } {
  const rauf = tk.some((t) => RAUF.some((p) => (p.length <= 4 ? t === p : t.startsWith(p)))) || tk.includes("mehr");
  const runter = tk.some((t) => RUNTER.some((p) => t.startsWith(p))) || tk.includes("weniger");
  return { rauf, runter };
}

// ---------------------------------------------------------------------------
// Antworten

const nf = (x: number, d = 1) => x.toLocaleString("de-DE", { maximumFractionDigits: d, minimumFractionDigits: d });

function zeitBefehl(t: string, tk: string[]): { tage: number } | { bisEreignis: true } | { pause: true } | null {
  if (/(bis zum naechsten (ereignis|vorfall|termin)|vorspulen|bis etwas passiert|bis es was gibt)/.test(t)) return { bisEreignis: true };
  if (hat(tk, "pause", "stopp", "halt") && tk.length <= 3) return { pause: true };
  const zahl: Record<string, number> = { ein: 1, eine: 1, einen: 1, einem: 1, zwei: 2, drei: 3, vier: 4, fuenf: 5, sechs: 6, zehn: 10 };
  const m = t.match(/(?:^| )(\d{1,3}|ein|eine|einen|einem|zwei|drei|vier|fuenf|sechs|zehn) (tag|tage|woche|wochen|monat|monate|jahr|jahre)(?: |$)/);
  if (m && /(weiter|spul|vor|warte|abwarten|verstreichen|vergehen|zeit)/.test(t)) {
    const n = /^\d+$/.test(m[1]!) ? parseInt(m[1]!, 10) : (zahl[m[1]!] ?? 1);
    const einheit = m[2]!;
    const faktor = einheit.startsWith("tag") ? 1 : einheit.startsWith("woche") ? 7 : einheit.startsWith("monat") ? 30 : 365;
    return { tage: n * faktor };
  }
  if (tk[0] === "weiter" || t === "weiter" || t.startsWith("zeit weiter") || t === "naechster tag") return { tage: 1 };
  return null;
}

export function laufeZeit(w: World, tage: number, bisEreignis: boolean): ChatAntwort {
  const start = w.date;
  const vorher = w.log.length;
  const offenVorher = w.spiel?.ereignisse.length ?? 0;
  const grenze = bisEreignis ? 120 : Math.min(tage, 366);
  let vergangen = 0;
  for (; vergangen < grenze; vergangen++) {
    advance(w, 1);
    if (w.spiel?.ende) break;
    const offen = w.spiel?.ereignisse.length ?? 0;
    if (offen > offenVorher) {
      vergangen++;
      break;
    }
  }
  const frisch = w.log.slice(vorher);
  const wichtig = frisch.filter((l) => l.kind === "ereignis" || l.kind === "entscheidung" || l.kind === "markt");
  const satz = (x: string) => (/[.!?]$/.test(x) ? x : `${x}.`);
  const zusammenfassung = (wichtig.length ? wichtig : frisch).slice(0, 3).map((l) => satz(l.text)).join(" ");
  const offen = w.spiel?.ereignisse.length ?? 0;
  const halt = w.spiel?.ende
    ? tx("sim2.sim.befehle.01ba95d")
    : offen > 0 && offen > offenVorher
      ? tx("sim2.sim.befehle.dd497c4", { p0: offen === 1 ? "Ein Ereignis wartet" : `${offen} Ereignisse warten` })
      : "";
  return {
    ok: true,
    text: tx("sim2.sim.befehle.e42e146", { p0: vergangen, p1: vergangen === 1 ? "Tag" : "Tage", p2: formatDateDe(w.date), p3: formatDateDe(start), p4: zusammenfassung || "Nichts Außergewöhnliches ist passiert.", p5: halt }),
    why: frisch[0]?.why,
  };
}

/** Kennzahlen: nur veröffentlichte Werte, denn Information ist unvollständig. */
function kennzahl(t: string, tk: string[], w: World): ChatAntwort | null {
  const p = w.published;
  const e = w.economy;
  const fragt = /(wie|was|stand|steht|hoch|wert|entwickl|aktuell|gerade|wieviel|ist)/.test(t) || t.endsWith("?");
  if (!fragt) return null;
  if (hat(tk, "inflation", "preise", "teuerung")) {
    return {
      ok: true,
      text: tx("sim2.sim.befehle.2fbdfa8", { p0: nf(p.inflation.value), p1: p.inflation.period, p2: p.inflation.publishedOn }),
      why: tx("sim2.sim.befehle.3f80dbd", { p0: nf(e.expectedInflation) }),
    };
  }
  if (hatPrefix(tk, "arbeitslos", "beschaeftig") || hat(tk, "jobs")) {
    return { ok: true, text: tx("sim2.sim.befehle.dbca046", { p0: nf(p.unemployment.value), p1: p.unemployment.period }), why: tx("sim2.sim.befehle.61325ce") };
  }
  if (hat(tk, "lira", "waehrung", "wechselkurs", "dollar", "euro")) {
    return {
      ok: true,
      text: tx("sim2.sim.befehle.450c23d", { p0: nf(e.usdTry), p1: nf(e.eurTry), p2: nf(e.fxChange12) }),
      why: tx("sim2.sim.befehle.04fe1a9"),
    };
  }
  if (hat(tk, "wachstum", "konjunktur", "wirtschaftsleistung", "bip")) {
    return { ok: true, text: tx("sim2.sim.befehle.faf6943", { p0: nf(p.growth.value), p1: p.growth.period }), why: tx("sim2.sim.befehle.e8cad60") };
  }
  if (hat(tk, "zins", "leitzins", "zinsen")) {
    return { ok: true, text: tx("sim2.sim.befehle.f57d7f7", { p0: nf(e.policyRate), p1: nf(e.policyRate - e.expectedInflation) }), why: tx("sim2.sim.befehle.3d14b0d") };
  }
  if (hat(tk, "schulden", "defizit", "haushalt")) {
    return {
      ok: true,
      text: tx("sim2.sim.befehle.4404f19", { p0: nf(e.debtRatio), p1: nf(e.deficit), p2: nf(e.fiscalImpulse) }),
      why: tx("sim2.sim.befehle.d2115fc"),
    };
  }
  return null;
}

const PROBLEM_REZEPT: Record<string, string[]> = {
  p_wassermangel: ["m_wasserleitungen", "m_bewaesserung"],
  p_wohnungsnot: ["m_sozialwohnungen", "m_baukredite"],
  p_aerztemangel: ["m_aerztegehalt", "m_krankenhausbau"],
  p_erdbebengefahr: ["m_stadterneuerung", "m_bauaufsicht", "m_gebaeudeverstaerkung", "m_afad_ausbau"],
  p_armut: ["m_sozialhilfe", "m_mindestlohn"],
  p_jugendarbeitslosigkeit: ["m_ausbildung", "m_berufsschulen"],
  p_landflucht: ["m_regionalfoerderung", "m_breitband"],
  p_migrationsdruck: ["m_integration", "m_grenzschutz"],
  p_korruption: ["m_antikorruption", "m_justizreform"],
  p_kriminalitaet: ["m_polizei"],
  p_stromausfaelle: ["m_netzausbau", "m_speicher_smartgrid"],
  p_luftverschmutzung: ["m_umweltauflagen"],
  p_streiks: ["m_gewerkschaftsrechte", "m_mindestlohn"],
  p_abwanderung: ["m_fachkraefteprogramm"],
  p_polarisierung: ["m_versammlungsfreiheit", "m_zivilgesellschaft"],
};

function akutProvinzen(w: World, id: string): number[] {
  const i = NET.index.get(id);
  const node = i === undefined ? undefined : NET.nodes[i];
  if (i === undefined || !node?.threshold) return [];
  const out: number[] = [];
  for (let p = 0; p < PROVINCES; p++) if (w.net.values[i * PROVINCES + p]! >= node.threshold) out.push(p + 1);
  return out;
}

function probleme(w: World): { node: NodeSpec; provinzen: number[]; last: number }[] {
  return NET.nodes
    .filter((n) => n.kind === "problem")
    .map((n) => {
      const provinzen = akutProvinzen(w, n.id);
      const last = provinzen.reduce((s, p) => s + w.net.weights[p - 1]!, 0);
      return { node: n, provinzen, last };
    })
    .filter((x) => x.provinzen.length > 0)
    .sort((a, b) => b.last - a.last);
}

function groessteEinwohner(provinzen: number[], n = 3): number[] {
  return [...provinzen].sort((a, b) => (PROVINZEN[b - 1]?.bevoelkerung ?? 0) - (PROVINZEN[a - 1]?.bevoelkerung ?? 0)).slice(0, n);
}

function statusFrage(t: string, tk: string[], w: World, rng: Rng): ChatAntwort | null {
  const spiel = w.spiel;
  if (!spiel) return null;
  const frage = t.endsWith(" ") || /^(wie|was|wer|wo|welche|welcher|habe|hab|gibt|zeig|nenne|sag)/.test(t) || hat(tk, "umfragen", "umfrage", "mehrheit", "kapital", "ziele", "agenda");

  if (frage && (hatPrefix(tk, "umfrage", "zustimm", "beliebt", "stimmung") || (hat(tk, "stehe", "stehen") && hat(tk, "ich", "wir")))) {
    const v = spiel.umfrage.verlauf;
    const vor = v.length >= 4 ? v[v.length - 4]!.wert : undefined;
    const monateBisWahl = Math.round((spiel.wahltag - w.day) / 30.4);
    return {
      ok: true,
      text: tx("sim2.sim.befehle.ead278d", { p0: nf(spiel.umfrage.zustimmung, 0), p1: vor !== undefined ? ` (vor drei Monaten ${nf(vor, 0)} %)` : "", p2: monateBisWahl }),
      why: tx("sim2.sim.befehle.4010418"),
    };
  }
  if (frage && (hatPrefix(tk, "mehrheit", "parlament", "sitze", "abstimmung", "fraktion") || hat(tk, "lager"))) {
    const s = stimmenSicht(w);
    const teile = [w.player?.partei.kurz, ...spiel.lager].filter(Boolean).map((k) => `${k} ${w.parliament?.seats[k!] ?? 0}`).join(" + ");
    return {
      ok: true,
      text: tx("sim2.sim.befehle.372eb52", { p0: s.lager, p1: teile, p2: s.erwartet }),
      why: s.luecke > 0 ? tx("sim2.sim.befehle.7c529bd", { p0: s.luecke }) : tx("sim2.sim.befehle.3411c1e"),
    };
  }
  if (frage && (hatPrefix(tk, "problem", "sorge", "krise", "schwaech", "defizit") || hat(tk, "groesste", "groessten", "dringend", "brennt"))) {
    const liste = probleme(w);
    if (!liste.length) return { ok: true, text: tx("sim2.sim.befehle.6f27e00"), why: tx("sim2.sim.befehle.61796c3") };
    const zeilen = liste.slice(0, 4).map((x) => tx("sim2.sim.befehle.8e24d0d", { p0: x.node.name, p1: x.provinzen.length, p2: x.provinzen.length === 1 ? "Provinz" : "Provinzen", p3: groessteEinwohner(x.provinzen, 3).map((p) => PROVINZEN[p - 1]!.name).join(", ") }));
    return { ok: true, text: `Am schwersten wiegt ${zeilen[0]}. Weiter: ${zeilen.slice(1).join("; ")}.`, why: tx("sim2.sim.befehle.235dbd8") };
  }
  if (frage && hatPrefix(tk, "kapital", "einfluss")) {
    const k = kapitalEinkommen(w);
    return {
      ok: true,
      text: tx("sim2.sim.befehle.b3ec2eb", { p0: nf(spiel.kapital, 0), p1: formatDateDe(k.naechste), p2: nf(k.summe), p3: nf(k.grund), p4: nf(k.vertrauen), p5: k.mehrheit > 0 ? `, Mehrheit ${nf(k.mehrheit)}` : ", Mehrheit 0, weil dem Lager Sitze fehlen", p6: k.kabinett ? `, Ministerrat ${k.kabinett > 0 ? "+" : ""}${nf(k.kabinett)}` : "", p7: k.grenze }),
      why: tx("sim2.sim.befehle.409f418"),
    };
  }
  if (frage && hatPrefix(tk, "ziel", "agenda", "vermaechtnis")) {
    const z = zielStand(w);
    if (!z.length) return { ok: true, text: tx("sim2.sim.befehle.0f7c677") };
    return { ok: true, text: z.map((x) => `${x.erreicht ? "erreicht" : "offen"}: ${x.def.titel} (${x.stand})`).join(" · "), why: tx("sim2.sim.befehle.5b504bb") };
  }
  if (frage && (hatPrefix(tk, "ereignis", "steht an", "offen", "anstehend", "termin") || t.includes("was steht an"))) {
    const e = spiel.ereignisse.map((x) => vorlage(x.vorlage).titel(w, x));
    const g = spiel.gesetze.map((x) => tx("sim2.sim.befehle.f6256f2", { p0: x.name, p1: Math.max(0, x.abstimmung - w.day) }));
    if (!e.length && !g.length) return { ok: true, text: tx("sim2.sim.befehle.81540ec") };
    return { ok: true, text: `Offen: ${e.length ? e.join(", ") : "keine Ereignisse"}. Im Parlament: ${g.length ? g.join(", ") : "kein Gesetz"}.` };
  }
  if (frage && (hatPrefix(tk, "minister", "kabinett", "berater", "figur") || t.includes("wer ist") || hat(tk, "team"))) {
    const f = spiel.figuren.filter((x) => x.amt !== "opposition");
    return { ok: true, text: f.map((x) => `${x.rolle} ${x.name} (${haltung(x)})`).join(" · "), why: tx("sim2.sim.befehle.894eaec") };
  }
  if (frage && hatPrefix(tk, "opposition", "gegner", "rivale")) {
    const o = spiel.figuren.find((x) => x.amt === "opposition");
    const stark = w.parliament ? Object.entries(w.parliament.seats).filter(([k]) => k !== w.player?.partei.kurz && !spiel.lager.includes(k)).sort((a, b) => b[1] - a[1])[0] : undefined;
    return { ok: true, text: `${o ? `${o.rolle} ${o.name} ist ${haltung(o)}. ` : ""}${stark ? `Die stärkste Fraktion außerhalb Ihres Lagers ist die ${stark[0]} mit ${stark[1]} Sitzen.` : ""}`, why: tx("sim2.sim.befehle.91e6b3c") };
  }
  if (/(was soll ich|was muss ich|was raetst|rat |empfehl|naechste schritte|womit anfangen|was tun)/.test(t) || (hat(tk, "tun") && hat(tk, "was"))) {
    const tipps: string[] = [];
    if (spiel.ereignisse.length) tipps.push(tx("sim2.sim.befehle.6fb2065", { p0: spiel.ereignisse.length === 1 ? "ein Ereignis" : `${spiel.ereignisse.length} Ereignisse`, p1: vorlage(spiel.ereignisse[0]!.vorlage).titel(w, spiel.ereignisse[0]!) }));
    if (!spiel.ersterTagErledigt) tipps.push(tx("sim2.sim.befehle.0d7eb70"));
    const lage = probleme(w)[0];
    if (lage) {
      const rezept = (PROBLEM_REZEPT[lage.node.id] ?? [])[0];
      const n = rezept ? NET.nodes[NET.index.get(rezept)!] : undefined;
      if (n) tipps.push(tx("sim2.sim.befehle.46accdc", { p0: lage.node.name, p1: n.name, p2: provinzenText(groessteEinwohner(lage.provinzen, 3)) }));
    }
    const s = stimmenSicht(w);
    if (s.luecke > 0) tipps.push(tx("sim2.sim.befehle.f70ad8e", { p0: s.luecke }));
    if (!tipps.length) tipps.push(tx("sim2.sim.befehle.d7e5a80"));
    void rng;
    return { ok: true, text: tipps.join(" "), why: tx("sim2.sim.befehle.5a50bed") };
  }
  return null;
}


// ---------------------------------------------------------------------------
// Ziele in Größen: „Senke die Wohnungsnot“ ist kein Regler, sondern ein Wunsch

function groessenBefehl(t: string, tk: string[], w: World): ChatAntwort | null {
  const { rauf, runter } = richtung(tk);
  if (rauf === runter) return null;
  const gewuenscht: 1 | -1 = rauf ? 1 : -1;
  for (const [id, info] of Object.entries(MAKRO_WEGE)) {
    if (tk.some((x) => x.startsWith(id.slice(0, 7)))) {
      return { ok: false, text: tx("sim2.sim.befehle.c9ed7e2", { p0: info.name, p1: info.wege[gewuenscht > 0 ? "rauf" : "runter"] }), why: tx("sim2.sim.befehle.87f927c") };
    }
  }
  let beste: { node: NodeSpec; p: number } | undefined;
  for (const node of NET.nodes) {
    if (node.kind === "massnahme" || node.input) continue;
    const keys = fold(node.name).split(" ").filter((x) => x.length >= 6 && !STOPP.has(x));
    let p = 0;
    for (const x of tk) for (const key of keys) p = Math.max(p, tokenTrifft(x, key));
    if (t.includes(fold(node.name))) p += 3;
    if (p >= 2 && (!beste || p > beste.p)) beste = { node, p };
  }
  if (!beste) return null;
  const gewuenschtNode: 1 | -1 = gewuenscht;
  const h = hebel(beste.node.id, gewuenschtNode, 4);
  const rezept = beste.node.kind === "problem" && gewuenscht === -1 ? (PROBLEM_REZEPT[beste.node.id] ?? []).map((id) => NET.nodes[NET.index.get(id)!]!).filter(Boolean) : [];
  const nenne = (x: { node: NodeSpec; richtung: 1 | -1 }) => `„${x.node.name}“ ${x.richtung > 0 ? "erhöhen" : "senken"}`;
  const vorschlaege = [...h.map(nenne), ...rezept.filter((r) => !h.some((x) => x.node.id === r.id)).map((r) => tx("sim2.sim.befehle.37ba87d", { p0: r.name }))].slice(0, 3);
  if (!vorschlaege.length) return { ok: false, text: tx("sim2.sim.befehle.22b0326", { p0: beste.node.name }) };
  return {
    ok: false,
    text: tx("sim2.sim.befehle.78684fd", { p0: beste.node.name, p1: gewuenscht > 0 ? "nach oben" : "nach unten", p2: vorschlaege.join(", "), p3: vorschlaege[0]!.replace(/[„“]/g, ""), p4: w.spiel ? " in Hatay" : "" }),
    why: tx("sim2.sim.befehle.0882f67"),
  };
}

// ---------------------------------------------------------------------------
// Verhandlungen mit den Fraktionen des Parlaments

const PARTEI_WORT: Record<string, string> = { akp: "AKP", yeni: "YENİ", chp: "CHP", mhp: "MHP", iyi: "İYİ", dem: "DEM", zafer: "Zafer", yrp: "YRP", refah: "YRP" };

function verhandlungsBefehl(roh: string, tk: string[], w: World): ChatAntwort | null {
  const spiel = w.spiel;
  if (!spiel || !w.parliament) return null;
  // „dem“ ist ein deutscher Artikel: Als Partei zählt nur „DEM“ in Großbuchstaben
  const partei = tk.map((x) => (x === "dem" && !/\bDEM\b/.test(roh) ? undefined : PARTEI_WORT[x])).find(Boolean);
  const gruppe = hat(tk, "opposition", "oppositionsparteien", "fraktion", "fraktionen", "parteien", "parlament", "parlamentarier", "partner");
  const aktion: Verhandlung | null = hatPrefix(tk, "abwerb", "ueberlauf")
    ? "abwerben"
    : hatPrefix(tk, "duld", "toleri", "stillhalt")
      ? "duldung"
      : hatPrefix(tk, "koalition", "buendnis") || (hat(tk, "lager") && hatPrefix(tk, "hol", "gewinn", "aufnehm"))
        ? "koalition"
        : hatPrefix(tk, "zugestaendnis", "kontrollrecht", "untersuchungsausschuss", "redezeit")
          ? "zugestaendnis"
          : hatPrefix(tk, "sprech", "gespraech", "rede", "treff", "kontakt")
            ? "gespraech"
            : null;
  const verhandelt = aktion !== null || hatPrefix(tk, "verhandl", "einig", "ueberzeug", "zusammenarbeit") || (hatPrefix(tk, "gewinn") && !!(partei || gruppe) && hat(tk, "wie", "wen"));
  if (!verhandelt || !(partei || gruppe)) return null;
  const uebersicht = fraktionsUebersicht(w);

  if (!partei) {
    const zeilen = uebersicht.map((f) => `${f.name} (${f.sitze} Sitze, ${f.wort}, will ${f.forderung})`).join("; ");
    return {
      ok: true,
      text:
        tx("sim2.sim.befehle.a0a768e") +
        tx("sim2.sim.befehle.a08dd2e", { p0: zeilen, p1: uebersicht[0]?.name ?? "CHP" }),
      why: tx("sim2.sim.befehle.2284e5e"),
    };
  }
  const f = uebersicht.find((x) => x.partei === partei);
  if (!f) return { ok: false, text: tx("sim2.sim.befehle.2d1c1f6", { p0: PARTEI_NAME[partei] ?? partei }) };
  const optionen = f.aktionen.map((a) => tx("sim2.sim.befehle.b1499d5", { p0: a.label, p1: a.pk, p2: a.moeglich ? "" : `, gerade nicht: ${a.grund}` })).join("; ");

  let wahl: Verhandlung | null = aktion;
  if (!wahl) {
    // „Verhandle mit der X“: ein günstiges Gespräch, wenn sie noch nicht offen genug ist; sonst die Möglichkeiten nennen
    const gespraech = f.aktionen.find((a) => a.id === "gespraech");
    if (f.bereitschaft < 40 && gespraech?.moeglich) wahl = "gespraech";
    else
      return {
        ok: true,
        text: tx("sim2.sim.befehle.2d4b100", { p0: f.name, p1: f.sitze, p2: f.wort, p3: f.forderung, p4: optionen, p5: f.name }),
        why: tx("sim2.sim.befehle.b702332"),
      };
  }
  const r = verhandle(w, partei, wahl, new Rng(w.rngState));
  w.rngState = (w.rngState + 1) | 0;
  return { ok: r.ok, text: r.text, ...(r.why ? { why: r.why } : {}) };
}

function gespraechMit(t: string, tk: string[], w: World): ChatAntwort | null {
  const spiel = w.spiel;
  if (!spiel || !(hatPrefix(tk, "sprech", "gespraech", "rede") && hat(tk, "mit", "dem", "der", "den"))) return null;
  const rolle: Record<string, string> = { zentralbank: "zentralbank", gouverneur: "zentralbank", notenbank: "zentralbank", finanz: "finanzen", innen: "inneres", aussen: "aussen", stabs: "stab", praesidialamt: "stab", opposition: "opposition", oppositionsfuehrer: "opposition", partner: "partner", koalition: "partner" };
  for (const [wort, amt] of Object.entries(rolle)) {
    if (t.includes(wort)) {
      const f = spiel.figuren.find((x) => x.amt === amt);
      if (!f) return { ok: false, text: tx("sim2.sim.befehle.ccddf6f") };
      const r = sprichMitFigur(w, f.id);
      return { ok: r.ok, text: r.text, ...(r.why ? { why: r.why } : {}) };
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Länder, Wähler, Programme

const LAND_WORT: Record<string, string> = {
  usa: "USA", amerika: "USA", washington: "USA", vereinigt: "USA",
  eu: "EU", europa: "EU", bruessel: "EU", europaeisch: "EU", kommission: "EU",
  russland: "RUS", moskau: "RUS", putin: "RUS",
  china: "CHN", peking: "CHN",
  aserbaidschan: "AZE", baku: "AZE",
  saudi: "SAU", golf: "SAU", riad: "SAU", katar: "SAU", emirate: "SAU",
  griechenland: "GRC", athen: "GRC",
  iran: "IRN", teheran: "IRN",
  syrien: "SYR", damaskus: "SYR",
  irak: "IRQ", bagdad: "IRQ",
  armenien: "ARM", eriwan: "ARM",
  israel: "ISR", jerusalem: "ISR",
  ukraine: "UKR", kiew: "UKR",
  georgien: "GEO", tiflis: "GEO",
  aegypten: "EGY", kairo: "EGY",
};

const GRUPPEN_WORT: Record<string, string> = {
  rentner: "rentner", rentnerinnen: "rentner", senioren: "rentner",
  arbeitnehmer: "arbeitnehmer", beschaeftigte: "arbeitnehmer", arbeiter: "arbeitnehmer", angestellte: "arbeitnehmer",
  unternehmer: "unternehmer", unternehmen: "unternehmer", wirtschaft: "unternehmer",
  landwirte: "landwirte", bauern: "landwirte",
  junge: "junge", jugend: "junge", studenten: "junge", studierende: "junge",
  beamte: "beamte",
  konservative: "konservative", religioese: "konservative", glaeubige: "konservative",
  saekulare: "staedtische_saekulare", staedter: "staedtische_saekulare", staedtische: "staedtische_saekulare",
};

// ---------------------------------------------------------------------------
// Antworten auf die Eigeninitiative der Länder (AUS-1): „Russland ablehnen“, „Angebot der EU annehmen“

function initiativeBefehl(t: string, tk: string[], w: World): ChatAntwort | null {
  const spiel = w.spiel;
  if (!spiel) return null;
  const offene = spiel.ereignisse.filter((e) => INITIATIVE_VORLAGE_IDS.has(e.vorlage));
  if (!offene.length) return null;
  const id = tk.map((x) => LAND_WORT[x] ?? [...Object.entries(LAND_WORT)].find(([k]) => x.startsWith(k) && k.length >= 5)?.[1]).find(Boolean);
  const TYP_WORT: [wort: string, vorlage: string][] = [
    ["forderung", "land_fordert"],
    ["ultimatum", "land_drohkulisse"],
    ["drohkulisse", "land_drohkulisse"],
    ["angebot", "land_angebot"],
    ["verlaengerung", "vertrag_verlaengerung"],
    ["provokation", "land_provokation"],
  ];
  const wort = TYP_WORT.find(([x]) => hat(tk, x));
  if (!id && !wort && !hatPrefix(tk, "initiative")) return null;
  // Das gemeinte Vorgehen: das Land, sonst das benannte Thema, sonst der erste offene Vorgang
  const ev = (id ? offene.find((e) => String(e.daten?.land) === id) : undefined) ?? (wort ? offene.find((e) => e.vorlage === wort[1]) : undefined) ?? (id || wort ? undefined : offene[0]);
  if (!ev) return null; // kein offener Vorgang mit diesem Land oder Thema: die übrigen Parser entscheiden
  const optionen = antworten(w, ev).map((o) => o.id);
  // Antwortwort → bevorzugte Options-Kennungen (die erste vorhandene gewinnt)
  const wege: [passt: boolean, ids: string[]][] = [
    [hatPrefix(tk, "annehmen", "akzeptier", "zustimm", "erfuel", "nachgeb"), ["annehmen", "erfuellen", "nachgeben", "verlaengern_zugabe", "verlaengern5", "zusagen"]],
    [hatPrefix(tk, "gegenangebot", "entgegenkomm", "kompromiss"), ["gegenangebot", "verhandeln", "verlaengern2", "gespraech"]],
    [hatPrefix(tk, "vermittl", "schlicht"), ["vermittlung"]],
    [hatPrefix(tk, "dulden", "hinnehm", "ignorier") || hat(tk, "stillschweigen"), ["dulden"]],
    [hatPrefix(tk, "konter", "standhalt", "zurueckschlag"), ["kontern", "standhalten"]],
    [hatPrefix(tk, "verlaenger", "erneuer"), ["verlaengern_zugabe", "verlaengern5", "verlaengern2"]],
    [hatPrefix(tk, "ablehn", "zurueckweis", "weiger"), ["ablehnen", "zurueckweisen"]],
    [hatPrefix(tk, "auslauf", "verfall"), ["auslaufen"]],
  ];
  for (const [passt, ids] of wege) {
    if (!passt) continue;
    const wahl = ids.find((x) => optionen.includes(x));
    if (!wahl) continue;
    const r = entscheide(w, ev.id, wahl, new Rng(w.rngState));
    w.rngState = (w.rngState + 1) | 0;
    return { ok: r.ok, text: r.text };
  }
  if (!wort && !hatPrefix(tk, "initiative")) return null; // Land genannt, aber kein Antwortwort: die übrigen Parser entscheiden
  const v = vorlage(ev.vorlage);
  return {
    ok: true,
    text: tx("sim2.sim.befehle.d6ac69a", { p0: v.titel(w, ev), p1: antworten(w, ev)
      .map((o) => `${o.label} (${o.pk} Kapital)`)
      .join("; ") }),
    why: tx("sim2.sim.befehle.e577f2a"),
  };
}

// MIL-1: Konfliktvorgänge (Krieg als Vorgang). Der Parser kennt dieselben Handlungen wie das Dossier
// in der Welt-Ansicht und die KI — der Kern prüft und führt aus, diese Ebene übersetzt nur.
const KRIEG_WOERTER = ["krieg", "truppe", "armee", "mobil", "drohkulisse", "waffenruhe", "kriegsziel", "beschluss", "angriff", "einmarsch", "invasion", "verstaerk", "abschreck"];

function kriegBefehl(t: string, tk: string[], w: World): ChatAntwort | null {
  if (!w.spiel) return null;
  if (!hatPrefix(tk, ...KRIEG_WOERTER)) return null;
  const id = tk.map((x) => LAND_WORT[x] ?? [...Object.entries(LAND_WORT)].find(([k]) => x.startsWith(k) && k.length >= 5)?.[1]).find(Boolean);
  const k = id ? kriegMit(w, id) : aktiveKriege(w)[0];
  if (!k) {
    return {
      ok: false,
      text: tx("sim2.sim.befehle.c9da59d"),
      why: tx("sim2.sim.befehle.35fc6a7"),
    };
  }
  const l = land(k.land);
  const frage = /^(wie|was|wo|wer|zeig|nenne|sag|steht|stehen|ist|sind)/.test(t) || hatPrefix(tk, "lage", "stand", "dossier", "front");
  if (frage && !hatPrefix(tk, "mobil", "beschluss", "waffenruhe", "kriegsziel")) {
    const hb = handlungenFuer(w, k.id)
      .filter((x) => x.moeglich)
      .map((x) => tx("sim2.sim.befehle.0137c44", { p0: x.label, p1: x.pk }));
    const front = k.phase === "krieg" || k.phase === "waffenruhe" ? tx("sim2.sim.befehle.9606f3f", { p0: Math.round(k.front), p1: k.front > k.frontVorher + 0.5 ? "steigend" : k.front < k.frontVorher - 0.5 ? "fallend" : "stabil", p2: Math.round(k.uhr) }) : "";
    return {
      ok: true,
      text: tx("sim2.sim.befehle.308ec9f", { p0: PHASEN_NAME[k.phase], p1: l.name, p2: Math.round(k.eskalation), p3: front, p4: hb.length ? `Möglich: ${hb.join(", ")}.` : "Gerade ist keine Handlung möglich." }),
      why: tx("sim2.sim.befehle.0255d3b"),
    };
  }
  let hid: KriegHandlungId | null = null;
  if (hatPrefix(tk, "mobil")) hid = hatPrefix(tk, "voll", "general", "total") ? "mobil_voll" : "mobil_teil";
  else if (hatPrefix(tk, "bereitschaft")) hid = "bereitschaft";
  else if (hatPrefix(tk, "signal", "abschreck")) hid = "signal";
  else if (hatPrefix(tk, "vermittl", "schlicht")) hid = "vermittlung";
  else if (hatPrefix(tk, "kriegsziel") || (hatPrefix(tk, "ziel") && hatPrefix(tk, "deklarier", "erklaer"))) {
    hid = hatPrefix(tk, "revision") ? "ziel_revision" : hatPrefix(tk, "schutz") ? "ziel_schutz" : hatPrefix(tk, "beistand") ? "ziel_beistand" : "ziel_verteidigung";
  } else if (hatPrefix(tk, "beschluss", "einsatzbeschluss") || (hatPrefix(tk, "krieg") && hatPrefix(tk, "erklaer", "beschliess", "angreif", "einbring"))) {
    hid = /(erlass|dekret|verordnung)/.test(t) ? "beschluss_erlass" : "beschluss";
  } else if (hatPrefix(tk, "waffenruhe")) hid = "waffenruhe";
  else if (hatPrefix(tk, "frieden", "paket")) hid = hatPrefix(tk, "weiss") ? "paket_weiss" : hatPrefix(tk, "hart", "sieg") ? "paket_sieg" : "paket_ausgewogen";
  else if (hatPrefix(tk, "verstaerk", "nachschub", "reserv")) hid = "verstaerkung";
  else if (hatPrefix(tk, "weiterkampf", "weiterkaempf")) hid = "weiterkaempfen";
  else if (hatPrefix(tk, "deeskal", "beruhig", "entspann", "entschaerf")) hid = "deeskalation";
  else if (hatPrefix(tk, "rueckzug", "zurueckzieh")) hid = "rueckzug";
  else if (hatPrefix(tk, "angriff", "einmarsch", "invasion", "angreif")) {
    hid = k.kriegszielDeklariert ? "beschluss" : "ziel_verteidigung";
  }
  if (!hid) {
    return {
      ok: true,
      text: tx("sim2.sim.befehle.b2aea26", { p0: l.name, p1: PHASEN_NAME[k.phase] }),
      why: tx("sim2.sim.befehle.e970ad6"),
    };
  }
  const r = fuehreKriegHandlungAus(w, k.id, hid);
  return { ok: r.ok, text: r.text, ...(r.why ? { why: r.why } : {}) };
}

function laenderBefehl(t: string, tk: string[], w: World): ChatAntwort | null {
  if (!w.spiel) return null;
  // Krieg und Truppen laufen als Konfliktvorgang; der Kriegs-Parser weiter oben entscheidet diese Fälle
  if (hatPrefix(tk, "krieg", "truppe", "armee", "angriff", "einmarsch", "invasion", "rakete", "bombardier", "militaerisch", "kampf", "soldat")) return null;
  const id = tk.map((x) => LAND_WORT[x] ?? [...Object.entries(LAND_WORT)].find(([k]) => x.startsWith(k) && k.length >= 5)?.[1]).find(Boolean);
  const aktion: AktionId | null = hatPrefix(tk, "gipfel", "treffen", "besuch", "reis", "einlad", "trefft")
    ? "gipfel"
    : hatPrefix(tk, "handelsabkommen", "zollabkommen", "wirtschaftsabkommen") || (hatPrefix(tk, "abkommen", "handel") && !!id)
      ? "handel"
      : hatPrefix(tk, "ruestung", "waffengeschaeft", "waffenlieferung")
        ? "ruestung"
        : hatPrefix(tk, "druck", "warne", "drohe", "kritisier", "verurteil")
          ? "druck"
          : hatPrefix(tk, "entspann", "deeskal", "schlicht", "beruhig", "versoehn")
            ? "entspannen"
            : hatPrefix(tk, "wiederaufbau", "wirtschaftshilfe", "aufbauhilfe", "unterstuetz")
              ? "hilfe"
              : null;
  const frage = /^(wie|was|wo|wer|zeig|nenne|sag|steht|stehen|ist|sind)/.test(t) || t.endsWith(" ");

  if (id) {
    const l = land(id);
    if (aktion) {
      const r = fuehreAktionAus(w, id, aktion);
      return { ok: r.ok, text: r.text, ...(r.why ? { why: r.why } : {}) };
    }
    if (frage || hatPrefix(tk, "verhaeltnis", "beziehung", "lage", "stand", "haltung")) {
      const z = weltZustand(w)[id]!;
      const offen = anliegenStand(w, id).filter((x) => !x.erfuellt);
      const moeglich = aktionenFuer(w, id).filter((a) => a.moeglich).map((a) => tx("sim2.sim.befehle.0137c44", { p0: a.aktion.label, p1: a.aktion.pk }));
      return {
        ok: true,
        text:
          `${l.name}: ${haltungWort(w, id)}. Handel ${Math.round(z.handel)}, Sicherheit ${Math.round(z.sicherheit)}, Vertrauen ${Math.round(dimensionZu(w, id, "vertrauen"))}, Konflikt ${Math.round(z.konflikt)}. ` +
          (offen.length ? tx("sim2.sim.befehle.7addf2c", { p0: offen.map((x) => x.anliegen.titel).join("; ") }) : tx("sim2.sim.befehle.5b2fef7")) +
          (moeglich.length ? tx("sim2.sim.befehle.1e9d94e", { p0: moeglich.join(", ") }) : tx("sim2.sim.befehle.a4e1197")),
        why: tx("sim2.sim.befehle.724b4e4"),
      };
    }
    return {
      ok: true,
      text: tx("sim2.sim.befehle.d9789b5", { p0: l.name, p1: l.name }),
    };
  }

  // Wähler
  const gruppe = tk.map((x) => GRUPPEN_WORT[x]).find(Boolean);
  if (gruppe && frage) {
    const g = waehlerLage(w).find((x) => x.id === gruppe)!;
    return {
      ok: true,
      text: tx("sim2.sim.befehle.1c87a19", { p0: g.name, p1: g.wort, p2: Math.round(g.laune), p3: g.trend !== null && Math.abs(g.trend) >= 0.4 ? `, ${g.trend > 0 ? "steigend" : "fallend"}` : "", p4: g.gruende.slice(0, 2).map((r) => `${r.richtung > 0 ? "Für Sie" : "Gegen Sie"}: ${r.name} (${r.text.replace(/\.$/, "")})`).join("; "), p5: g.forderungen.map((f) => `${f.name} ${tunWort(f.massnahme, f.richtung)}`).join(", ") }),
      why: tx("sim2.sim.befehle.8b060fe"),
    };
  }
  if (frage && hatPrefix(tk, "waehler", "verbuendet", "veraerger", "unzufrieden", "koalition") && !hatPrefix(tk, "fraktion", "parlament")) {
    const lage = waehlerLage(w);
    const gut = lage.filter((g) => g.laune >= 58).map((g) => g.name);
    const schlecht = [...lage].filter((g) => g.laune < 45).map((g) => `${g.name} (${Math.round(g.laune)})`);
    return {
      ok: true,
      text: `${gut.length ? `Zufrieden sind ${gut.join(", ")}. ` : "Keine Gruppe ist ausgesprochen zufrieden. "}${schlecht.length ? `Verärgert sind ${schlecht.join(", ")}.` : "Verärgert ist niemand."}`,
      why: tx("sim2.sim.befehle.ef5eff9"),
    };
  }

  // Programme
  if (hatPrefix(tk, "programm", "plan", "fokus") || (t.includes("naechste") && hatPrefix(tk, "schritt"))) {
    const s = naechsterSchritt(w);
    if (hatPrefix(tk, "starte", "beginn", "los", "umsetz") && s && s.status === "bereit") {
      const r = starteSchritt(w, s.schritt.id);
      return { ok: r.ok, text: r.text, ...(r.why ? { why: r.why } : {}) };
    }
    if (!s) return { ok: true, text: tx("sim2.sim.befehle.ffd3733") };
    const offen = s.bedingungen.find((b) => !b.erfuellt);
    return {
      ok: true,
      text: tx("sim2.sim.befehle.bddc079", { p0: s.schritt.titel, p1: s.schritt.text, p2: s.status === "bereit" ? `Er ist bereit und kostet ${s.schritt.kapital} Kapital („Starte den nächsten Programmschritt“).` : `Dafür fehlt noch: ${offen?.text ?? "eine Voraussetzung"}.` }),
      why: tx("sim2.sim.befehle.f23c813"),
    };
  }
  return null;
}

function nichtVorhanden(t: string, tk: string[], w: World): ChatAntwort | null {
  if (hatPrefix(tk, "krieg", "truppe", "armee", "angriff", "einmarsch", "invasion", "rakete", "bombardier", "militaerisch", "kampf", "waffen", "soldat")) {
    return {
      ok: false,
      text: tx("sim2.sim.befehle.776bddc"),
      why: tx("sim2.sim.befehle.655d7a2"),
    };
  }
  if (hatPrefix(tk, "vertragsklausel", "mediation", "vermittl", "abkommen", "vertrag")) {
    return {
      ok: true,
      text: tx("sim2.sim.befehle.c3edf99"),
      why: tx("sim2.sim.befehle.a4dca28"),
    };
  }
  if (hatPrefix(tk, "diplomat", "botschaft", "sanktion") || hat(tk, "nato")) {
    return {
      ok: false,
      text: tx("sim2.sim.befehle.546d8fa"),
      why: tx("sim2.sim.befehle.88b0cc8"),
    };
  }
  if (hatPrefix(tk, "neuwahl", "ruecktritt")) {
    const monate = w.spiel ? Math.round((w.spiel.wahltag - w.day) / 30.4) : 0;
    return {
      ok: false,
      text: tx("sim2.sim.befehle.0757c45", { p0: monate }),
      why: tx("sim2.sim.befehle.a137921"),
    };
  }
  if (hatPrefix(tk, "kabinett", "minister") && hatPrefix(tk, "bilde", "ernenn", "berufe")) {
    return { ok: false, text: tx("sim2.sim.befehle.a9bc14a"), why: tx("sim2.sim.befehle.ae1e559") };
  }
  if (hatPrefix(tk, "rede", "ansprache", "fernseh", "interview") || (hat(tk, "nation") && hatPrefix(tk, "halten", "halt"))) {
    return { ok: false, text: tx("sim2.sim.befehle.2ced25d"), why: tx("sim2.sim.befehle.e90390a") };
  }
  if (hat(tk, "kanal", "hafen", "flughafen", "tunnel", "staudamm", "kraftwerk", "grossprojekt", "megaprojekt", "riesenprojekt")) {
    return {
      ok: false,
      text: tx("sim2.sim.befehle.667a8eb"),
      why: tx("sim2.sim.befehle.839b987"),
    };
  }
  return null;
}

function massnahmeBefehl(t: string, tk: string[], w: World): ChatAntwort | null {
  const { beste, punkte } = findeMassnahmen(t, tk);
  if (!beste.length || punkte < 3) return null;
  if (beste.length > 1) {
    const namen = beste.slice(0, 5).map((k) => `„${k.node.name}“`).join(", ");
    const wo = ortAusText(t);
    const ortText = wo ? ` ${provinzenText(wo)}` : "";
    return { ok: false, text: tx("sim2.sim.befehle.c674d41", { p0: namen, p1: ortText, p2: beste[0]!.node.name, p3: ortText }), why: tx("sim2.sim.befehle.8a82e93") };
  }
  const k = beste[0]!;
  const node = k.node;
  const { rauf, runter } = richtung(tk);
  let ort = ortAusText(t);
  const akut = /(akut|wo es noetig|wo noetig|wo betroffen|wo das problem|dort wo|betroffene)/.test(t);
  if (akut) {
    ort = akuteOrte(w, node.id);
    if (!ort) return { ok: false, text: tx("sim2.sim.befehle.4bd768d", { p0: node.name }) };
  }
  const aktuell = stufeIn(w, node.id, ort);
  const absolut = t.match(/(?:auf|bis) (\d{1,3})(?: |$)/);
  const relativ = t.match(/(?:um|von) (\d{1,3})(?: punkte| stufen| prozent)?(?: |$)/);
  let ziel: number;
  if (absolut) ziel = parseInt(absolut[1]!, 10);
  else if (/(abschaff|streich|ganz weg)/.test(t)) ziel = 0;
  else if (/verdoppel/.test(t)) ziel = aktuell * 2;
  else if (/halbier/.test(t)) ziel = aktuell / 2;
  else if (rauf && runter) return { ok: false, text: tx("sim2.sim.befehle.81a853d", { p0: node.name }) };
  else if (rauf || runter) {
    const d = relativ ? parseInt(relativ[1]!, 10) : 25;
    ziel = aktuell + (rauf ? d : -d);
  } else {
    return { ok: false, text: tx("sim2.sim.befehle.ee71ceb", { p0: node.name, p1: ort ? ` (${provinzenText(ort)})` : "", p2: node.name, p3: node.name }), why: node.text };
  }
  ziel = Math.min(100, Math.max(0, Math.round(ziel)));
  const pr = pruefeVorhaben(w, node.id, ziel, ort);
  if (!pr.ok) return { ok: false, text: `„${node.name}“ ${provinzenText(ort)}: ${pr.grund ?? "keine Änderung"}.` };
  const alsErlass = /(erlass|dekret|per verordnung|sofort)/.test(t) && pr.erlass.moeglich;
  const r = bringeEin(w, node.id, ziel, ort, alsErlass ? "erlass" : "gesetz");
  const extra = !r.ok && pr.erlass.moeglich && !alsErlass ? tx("sim2.sim.befehle.de5d0ef", { p0: pr.erlass.pk }) : "";
  const result: ChatAntwort = { ok: r.ok, text: r.text + extra };
  if (r.why) result.why = r.why;
  return result;
}

function figurEntlassen(t: string, tk: string[], w: World): ChatAntwort | null {
  if (!hatPrefix(tk, "entlass", "feuer", "absetz", "ersetz")) return null;
  const rng = new Rng(w.rngState);
  const ergebnis = (a: "finanzen" | "inneres" | "aussen") => {
    const r = entlasseFigur(w, a, rng);
    w.rngState = rng.state;
    return r;
  };
  if (hatPrefix(tk, "finanzminister", "finanzen")) return ergebnis("finanzen");
  if (hatPrefix(tk, "innenminister")) return ergebnis("inneres");
  if (hatPrefix(tk, "aussenminister")) return ergebnis("aussen");
  if (hatPrefix(tk, "minister", "kabinett", "berater")) {
    return { ok: false, text: tx("sim2.sim.befehle.e4ad0a7"), why: tx("sim2.sim.befehle.394f1b9") };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Verfassungsfrage (REC-1): Paket einbringen, Absprachen, Kampagne, Stand

function verfassungsBefehl(t: string, tk: string[], w: World): ChatAntwort | null {
  const spiel = w.spiel;
  if (!spiel) return null;
  const thema = hatPrefix(tk, "verfassung", "grundgesetz", "referendum", "volksabstimmung", "wahlhuerde", "sperrklausel", "prozenthuerde", "notstandsartikel");
  if (!thema) return null;
  const z = verfassungsZustand(w);
  const v = z.laufend;

  // Rückzug, Absprachen und Kampagne betreffen den laufenden Vorgang
  if (hatPrefix(tk, "zurueckzieh", "zuruecknehm", "stoppt", "stoppe")) {
    const r = zieheVerfassungZurueck(w);
    return { ok: r.ok, text: r.text, ...(r.why ? { why: r.why } : {}) };
  }
  if (hatPrefix(tk, "werb", "kampagne", "impuls") || (hat(tk, "fuer") && hatPrefix(tk, "stimm"))) {
    const r = kampagnenImpuls(w);
    return { ok: r.ok, text: r.text, ...(r.why ? { why: r.why } : {}) };
  }
  if (hatPrefix(tk, "kauf", "sicher") && hatPrefix(tk, "stimm", "mehrheit")) {
    if (!v) return { ok: false, text: tx("sim2.sim.befehle.87d82bd") };
    const sicht = paketStimmen(w, v.paket, v.absprachen);
    const ziel = sicht.erwartet >= VERFASSUNG_REGELN.mehrheit ? VERFASSUNG_REGELN.direkt + VERFASSUNG_REGELN.stimmenPuffer : VERFASSUNG_REGELN.mehrheit + VERFASSUNG_REGELN.stimmenPuffer;
    const noetig = Math.max(0, ziel - sicht.erwartet);
    if (!noetig) return { ok: true, text: tx("sim2.sim.befehle.a994a74", { p0: sicht.erwartet }) };
    const r = verfassungStimmenKaufen(w, noetig);
    return { ok: r.ok, text: r.text, ...(r.why ? { why: r.why } : {}) };
  }

  // Einbringen: Artikel aus dem Text lesen
  const einbringen = hatPrefix(tk, "einbring", "bring", "reform", "aender", "aendern", "schnuer") || (hat(tk, "verfassung") && richtung(tk).rauf);
  if (einbringen && !hat(tk, "wie", "was", "welche")) {
    const paket: Record<string, string> = {};
    if (hat(tk, "amtszeit", "amtsperiode", "wiederwahl") || hatPrefix(tk, "neuwahl", "vorgezogen")) {
      paket.amtszeit = hatPrefix(tk, "neuwahl", "vorgezogen") ? "neuwahl_jetzt" : "wiederwahl_plus";
    }
    if (hat(tk, "wahlhuerde", "huerde", "wahlrecht", "sperrklausel", "prozenthuerde")) {
      if (hat(tk, "fuenf", "5")) paket.wahlrecht = "fuenf";
      else if (hat(tk, "zehn", "10")) paket.wahlrecht = "zehn";
    }
    if (hat(tk, "verfassungsgericht", "aym", "justizbesetzung") || (hat(tk, "justiz") && hat(tk, "besetzung", "ernennung"))) {
      if (hat(tk, "acht", "8")) paket.justiz = "acht_sieben";
      else if (hat(tk, "parlament") && hatPrefix(tk, "staerk", "mehrheit", "waehlt")) paket.justiz = "parlament_staerkt";
      else paket.justiz = "acht_sieben";
    }
    if (hat(tk, "notstand", "ausnahmezustand", "notstandsartikel")) {
      if (hatPrefix(tk, "eng", "begrenz", "einschraenk")) paket.notstand = "eng";
      else if (hatPrefix(tk, "weit", "ausweit", "verschaerf")) paket.notstand = "weit";
    }
    if (hat(tk, "immunitaet") && hatPrefix(tk, "aufheb", "abschaff", "aufgehoben", "streicht", "streich")) paket.immunitaet = "aufgehoben";
    if (Object.keys(paket).length === 0) {
      const liste = ARTIKEL.map((a) => `„${a.name}“ (${a.varianten.filter((x) => !x.statusQuo).map((x) => x.name).join(" oder ")})`).join("; ");
      return {
        ok: false,
        text: tx("sim2.sim.befehle.751391b", { p0: liste }),
        why: tx("sim2.sim.befehle.9ff3095"),
      };
    }
    const pr = pruefeVerfassung(w, paket);
    if (!pr.ok) return { ok: false, text: pr.grund ?? tx("sim2.sim.befehle.02a314a") };
    const r = bringeVerfassungEin(w, paket);
    return { ok: r.ok, text: r.text, ...(r.why ? { why: r.why } : {}) };
  }

  // Stand und Erklärung
  const stand = verfassungStand(w);
  if (v?.phase === "kampagne") {
    const p = referendumPrognose(w);
    return {
      ok: true,
      text: `${stand.zeile}${p ? ` Erwartet werden etwa ${nf(p.mitte)} Prozent Ja: Zustimmung ${nf(p.zustimmung)}, Themen der Artikel ${p.salienz >= 0 ? "+" : ""}${nf(p.salienz)}, Kampagne +${nf(p.kampagne)}. Mit „Für das Referendum werben“ investieren Sie Kapital in die Kampagne.` : ""}`,
      why: tx("sim2.sim.befehle.55a7058"),
    };
  }
  if (v) {
    const sicht = paketStimmen(w, v.paket, v.absprachen);
    return {
      ok: true,
      text: tx("sim2.sim.befehle.e871681", { p0: stand.zeile, p1: sicht.erwartet, p2: sicht.tief, p3: sicht.hoch, p4: VERFASSUNG_REGELN.direkt, p5: VERFASSUNG_REGELN.mehrheit }),
      why: tx("sim2.sim.befehle.e2cf15b"),
    };
  }
  const aktiv = Object.entries(z.aktiv);
  const sperren = Object.entries(z.sperren).filter(([, bis]) => bis > w.day);
  return {
    ok: true,
    text:
      tx("sim2.sim.befehle.980bd28", { p0: stand.zeile, p1: ARTIKEL.map((a) => `„${a.name}“`).join(", ") }) +
      tx("sim2.sim.befehle.16be8fe", { p0: VERFASSUNG_REGELN.pkBasis, p1: VERFASSUNG_REGELN.pkJeArtikel, p2: VERFASSUNG_REGELN.mehrheit, p3: VERFASSUNG_REGELN.direkt }) +
      (aktiv.length ? tx("sim2.sim.befehle.f48c10e", { p0: aktiv.map(([a, vId]) => `${artikelDef(a)?.name ?? a}: ${varianteDef(vId)?.name ?? vId}`).join(", ") }) : "") +
      (sperren.length ? tx("sim2.sim.befehle.f76ebb9", { p0: sperren.map(([a]) => artikelDef(a)?.name ?? a).join(", ") }) : "") +
      tx("sim2.sim.befehle.7ff9477"),
    why: tx("sim2.sim.befehle.afd03b6"),
  };
}

// ---------------------------------------------------------------------------
// Einstieg

/** Führt einen Befehl aus und meldet, was der Kern daraufhin protokolliert. */
export function befehl(text: string, w: World): ChatAntwort {
  const t = fold(text);
  const tk = tokens(t);
  if (!t) return { ok: false, text: tx("sim2.sim.befehle.6711caf") };
  if (w.spiel?.ende) return { ok: false, text: tx("sim2.sim.befehle.f6bcf8e") };

  if (hat(tk, "hilfe", "befehle", "beispiele") && tk.length <= 3) {
    return {
      ok: true,
      text:
        tx("sim2.sim.befehle.1ddce1b") +
        BEISPIELE.join(" · "),
      why: tx("sim2.sim.befehle.ac3506e"),
    };
  }

  const zeit = zeitBefehl(t, tk);
  if (zeit) {
    if ("pause" in zeit) return { ok: true, text: `Die Zeit steht (${formatDateDe(w.date)}).` };
    if ("bisEreignis" in zeit) return laufeZeit(w, 0, true);
    return laufeZeit(w, zeit.tage, false);
  }

  // Zentralbank: Der Spieler setzt den Leitzins nicht selbst (Wirtschaftsmodell, Abschnitt 5)
  if (hatPrefix(tk, "gouverneur", "bankchef", "zentralbankchef", "zentralbankfuehrung", "notenbank") && hatPrefix(tk, "entlass", "ersetz", "absetz", "neu", "gefuegig", "gefaellig")) {
    const before = w.log.length;
    replaceGovernor(w, "gefuegig", tx("sim2.sim.befehle.54f843e"));
    const l = w.log[before];
    return { ok: true, text: l?.text ?? tx("sim2.sim.befehle.7acc17d"), ...(l?.why ? { why: l.why } : {}) };
  }
  if (hat(tk, "zentralbank", "bank", "notenbank") && hatPrefix(tk, "kriti", "druck", "angreif", "attackier", "oeffentlich")) {
    const before = w.log.length;
    criticizeCentralBank(w);
    const l = w.log[before];
    return { ok: true, text: l?.text ?? tx("sim2.sim.befehle.9ecd1b2"), ...(l?.why ? { why: l.why } : {}) };
  }
  if (hatPrefix(tk, "leitzins", "zinsen", "zinspolitik", "geldpolitik") && (richtung(tk).rauf || richtung(tk).runter || hatPrefix(tk, "bestimm", "festleg", "mach"))) {
    return {
      ok: false,
      text: tx("sim2.sim.befehle.c3a1b94"),
      why: tx("sim2.sim.befehle.ee813f1"),
    };
  }

  const entlassung = figurEntlassen(t, tk, w);
  if (entlassung) return entlassung;

  const fraktionsBefehl = verhandlungsBefehl(text, tk, w);
  if (fraktionsBefehl) return fraktionsBefehl;

  const initiative = initiativeBefehl(t, tk, w);
  if (initiative) return initiative;

  const verfassung = verfassungsBefehl(t, tk, w);
  if (verfassung) return verfassung;

  const kriegAntwort = kriegBefehl(t, tk, w);
  if (kriegAntwort) return kriegAntwort;

  if (siehtNachGrossprojekt(text)) {
    const er = entwirf(w, text);
    if (er.art === "entwurf") {
      return {
        ok: true,
        text: schaetzKurz(er.eintrag.schaetzung),
        why: er.eintrag.schaetzung.mentor,
      };
    }
    const d = er.deutung;
    if (d.art === "absage") {
      return {
        ok: false,
        text: d.grund,
        why: d.alternativ,
      };
    }
    if (d.art === "frieden") {
      return friedensAntwort(w, d);
    }
    if (d.art === "rueckfrage") {
      return {
        ok: false,
        text: d.frage,
        why: tx("sim2.sim.befehle.b07a9c5"),
      };
    }
  }

  const laenderAntwort = laenderBefehl(t, tk, w);
  if (laenderAntwort) return laenderAntwort;

  // Haushalt: gesamtwirtschaftlich, nicht als einzelne Maßnahme
  if (/(mehr ausgeben|ausgaben erhoeh|konjunkturpaket|konjunkturprogramm|stimulus|investitionsprogramm|ausgabenprogramm)/.test(t)) {
    const schritt = einfacherSchritt(w, "mehr");
    if (!schritt) return { ok: false, text: tx("sim2.sim.befehle.9859f80") };
    const r = setzePosten(w, schritt.id, schritt.stufe);
    return { ok: r.ok, text: r.text, ...(r.why ? { why: r.why } : {}) };
  }
  if (/(sparen|sparpaket|ausgaben senk|ausgaben kuerz|haushalt konsolid|einsparen)/.test(t) && !hatPrefix(tk, "steuer")) {
    const schritt = einfacherSchritt(w, "sparen");
    if (!schritt) return { ok: false, text: tx("sim2.sim.befehle.145b015") };
    const r = setzePosten(w, schritt.id, schritt.stufe);
    return { ok: r.ok, text: r.text, ...(r.why ? { why: r.why } : {}) };
  }

  const massnahme = massnahmeBefehl(t, tk, w);
  if (massnahme) return massnahme;

  const zahl = kennzahl(t, tk, w);
  if (zahl) return zahl;

  const rng = new Rng(w.rngState);
  const status = statusFrage(t, tk, w, rng);
  if (status) return status;

  const gespraech = gespraechMit(t, tk, w);
  if (gespraech) return gespraech;

  const groesse = groessenBefehl(t, tk, w);
  if (groesse) return groesse;

  const fehlt = nichtVorhanden(t, tk, w);
  if (fehlt) return fehlt;

  return {
    ok: false,
    text:
      tx("sim2.sim.befehle.88282a5") +
      BEISPIELE.slice(0, 4).join(" · ") +
      " „Hilfe“ zeigt alles.",
    why: tx("sim2.sim.befehle.9c310e0"),
  };
}
