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
import { INITIATIVE_VORLAGE_IDS } from "./initiative";
import { Rng } from "./rng";
import type { World } from "./types";
import type { NodeSpec } from "../data/politiknetz";

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
  "Wie stehe ich in den Umfragen?",
  "Erhöhe den Mindestlohn.",
  "Baue Wasserleitungen in Hatay und Adana.",
  "Was ist das größte Problem?",
  "Wie ist das Verhältnis zu Russland?",
  "Gipfeltreffen mit der EU.",
  "Wie stehen die Rentner zu mir?",
  "Führe ein Gespräch mit der CHP.",
  "Was ist mein nächster Schritt?",
  "Ein Monat weiter.",
];

export function willkommensText(): string {
  return (
    "Sie haben das Wort. Schreiben Sie, was Sie tun wollen, etwa: " +
    BEISPIELE.slice(0, 3).join(" · ") +
    " Bei allem anderen sage ich, was es gibt und was nicht."
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
    ? " Die Amtszeit ist beendet."
    : offen > 0 && offen > offenVorher
      ? ` Halt: ${offen === 1 ? "Ein Ereignis wartet" : `${offen} Ereignisse warten`} auf Ihre Entscheidung.`
      : "";
  return {
    ok: true,
    text: `${vergangen} ${vergangen === 1 ? "Tag" : "Tage"} später: ${formatDateDe(w.date)} (vorher ${formatDateDe(start)}). ${zusammenfassung || "Nichts Außergewöhnliches ist passiert."}${halt}`,
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
      text: `Die Inflation liegt bei ${nf(p.inflation.value)} % (gemessen für ${p.inflation.period}, veröffentlicht am ${p.inflation.publishedOn}).`,
      why: `Statistiken erscheinen mit Verzögerung, Sie steuern mit Blick in den Rückspiegel. Die Inflationserwartung liegt bei ${nf(e.expectedInflation)} % (Umfrage, ungenau).`,
    };
  }
  if (hatPrefix(tk, "arbeitslos", "beschaeftig") || hat(tk, "jobs")) {
    return { ok: true, text: `Die Arbeitslosenquote liegt bei ${nf(p.unemployment.value)} % (gemessen für ${p.unemployment.period}).`, why: "Wachstum wirkt auf die Beschäftigung mit Verzögerung von Quartalen (Wirtschaftsmodell, Z9)." };
  }
  if (hat(tk, "lira", "waehrung", "wechselkurs", "dollar", "euro")) {
    return {
      ok: true,
      text: `Ein Dollar kostet ${nf(e.usdTry)} Lira, ein Euro ${nf(e.eurTry)} Lira. Die Lira hat in zwölf Monaten ${nf(e.fxChange12)} % verloren.`,
      why: "Zinsen und Vertrauen wirken auf die Währung mit Tagesverzögerung; eine schwächere Lira verteuert Importe, vor allem Energie (Z4/Z5).",
    };
  }
  if (hat(tk, "wachstum", "konjunktur", "wirtschaftsleistung", "bip")) {
    return { ok: true, text: `Das Wachstum liegt bei ${nf(p.growth.value)} % (gemessen für ${p.growth.period}).`, why: "Das ist der zuletzt veröffentlichte Wert; die aktuelle Lage hängt auch an Ihren Maßnahmen und am Weltmarkt." };
  }
  if (hat(tk, "zins", "leitzins", "zinsen")) {
    return { ok: true, text: `Der Leitzins liegt bei ${nf(e.policyRate)} %. Der Realzins liegt damit bei ${nf(e.policyRate - e.expectedInflation)} %.`, why: "Der Realzins ist der Leitzins abzüglich der erwarteten Inflation; er entscheidet über Kredite und Sparen (Z1)." };
  }
  if (hat(tk, "schulden", "defizit", "haushalt")) {
    return {
      ok: true,
      text: `Die Staatsschulden liegen bei ${nf(e.debtRatio)} % der Wirtschaftsleistung, das geplante Defizit bei ${nf(e.deficit)} %. Ihr zusätzliches Ausgabenprogramm: ${nf(e.fiscalImpulse)} % der Wirtschaftsleistung.`,
      why: "Defizite werden zu Schulden, Schulden zu Zinslast. Tragfähig ist das Verhältnis von Zins und Wachstum (Z7).",
    };
  }
  return null;
}

const PROBLEM_REZEPT: Record<string, string[]> = {
  p_wassermangel: ["m_wasserleitungen", "m_bewaesserung"],
  p_wohnungsnot: ["m_sozialwohnungen", "m_baukredite"],
  p_aerztemangel: ["m_aerztegehalt", "m_krankenhausbau"],
  p_erdbebengefahr: ["m_stadterneuerung", "m_bauaufsicht"],
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
      text: `Ihre Zustimmung liegt bei ${nf(spiel.umfrage.zustimmung, 0)} %${vor !== undefined ? ` (vor drei Monaten ${nf(vor, 0)} %)` : ""}. Die nächste Wahl ist in etwa ${monateBisWahl} Monaten.`,
      why: "Die Zustimmung folgt dem Vertrauen, der Stimmung der Wählergruppen, der Wirtschaftslage und den akuten Problemen; jeden Monat im Amt kostet sie etwas.",
    };
  }
  if (frage && (hatPrefix(tk, "mehrheit", "parlament", "sitze", "abstimmung", "fraktion") || hat(tk, "lager"))) {
    const s = stimmenSicht(w);
    const teile = [w.player?.partei.kurz, ...spiel.lager].filter(Boolean).map((k) => `${k} ${w.parliament?.seats[k!] ?? 0}`).join(" + ");
    return {
      ok: true,
      text: `Ihr Lager hat ${s.lager} von 600 Sitzen (${teile}). Für Gesetze braucht es 301. Erwartet werden bei einer Abstimmung ${s.erwartet} Ja-Stimmen.`,
      why: s.luecke > 0 ? `Es fehlen etwa ${s.luecke} Stimmen. Der beste Weg sind Verhandlungen mit den Fraktionen („Wie verhandle ich mit der Opposition?“); Stimmen zu kaufen ist teurer.` : "Die Mehrheit steht, solange kein Partner das Lager verlässt.",
    };
  }
  if (frage && (hatPrefix(tk, "problem", "sorge", "krise", "schwaech", "defizit") || hat(tk, "groesste", "groessten", "dringend", "brennt"))) {
    const liste = probleme(w);
    if (!liste.length) return { ok: true, text: "Aktuell ist in keiner Provinz ein Problem akut.", why: "Akut heißt: Der Wert liegt in einer Provinz über der Schwelle. Das ändert sich mit der Zeit." };
    const zeilen = liste.slice(0, 4).map((x) => `${x.node.name} in ${x.provinzen.length} ${x.provinzen.length === 1 ? "Provinz" : "Provinzen"} (vor allem ${groessteEinwohner(x.provinzen, 3).map((p) => PROVINZEN[p - 1]!.name).join(", ")})`);
    return { ok: true, text: `Am schwersten wiegt ${zeilen[0]}. Weiter: ${zeilen.slice(1).join("; ")}.`, why: "Sortiert nach dem Anteil der Bevölkerung, der in betroffenen Provinzen lebt. Die Ebene „Akute Probleme“ der Karte zeigt, wo." };
  }
  if (frage && hatPrefix(tk, "kapital", "einfluss")) {
    const k = kapitalEinkommen(w);
    return {
      ok: true,
      text: `Sie haben ${nf(spiel.kapital, 0)} Politisches Kapital. Am ${formatDateDe(k.naechste)} kommen etwa ${nf(k.summe)} dazu (Grundeinkommen ${nf(k.grund)}, Vertrauen ${nf(k.vertrauen)}${k.mehrheit > 0 ? `, Mehrheit ${nf(k.mehrheit)}` : ", Mehrheit 0, weil dem Lager Sitze fehlen"}). Mehr als ${k.grenze} sammeln sich nicht an.`,
      why: "Ja, es lädt sich auf, aber langsam: jeden Monatsersten. Jede Änderung, jede Verhandlung und jede Antwort auf ein Ereignis kostet Kapital; wer alles auf einmal will, steht am Monatsende leer da.",
    };
  }
  if (frage && hatPrefix(tk, "ziel", "agenda", "vermaechtnis")) {
    const z = zielStand(w);
    if (!z.length) return { ok: true, text: "Sie haben sich noch keine Ziele gesetzt." };
    return { ok: true, text: z.map((x) => `${x.erreicht ? "erreicht" : "offen"}: ${x.def.titel} (${x.stand})`).join(" · "), why: "Die Bilanz am Ende der Amtszeit misst diese Ziele." };
  }
  if (frage && (hatPrefix(tk, "ereignis", "steht an", "offen", "anstehend", "termin") || t.includes("was steht an"))) {
    const e = spiel.ereignisse.map((x) => vorlage(x.vorlage).titel(w, x));
    const g = spiel.gesetze.map((x) => `${x.name} (Abstimmung in ${Math.max(0, x.abstimmung - w.day)} Tagen)`);
    if (!e.length && !g.length) return { ok: true, text: "Nichts Dringendes: kein offenes Ereignis, kein Gesetz in der Beratung." };
    return { ok: true, text: `Offen: ${e.length ? e.join(", ") : "keine Ereignisse"}. Im Parlament: ${g.length ? g.join(", ") : "kein Gesetz"}.` };
  }
  if (frage && (hatPrefix(tk, "minister", "kabinett", "berater", "figur") || t.includes("wer ist") || hat(tk, "team"))) {
    const f = spiel.figuren.filter((x) => x.amt !== "opposition");
    return { ok: true, text: f.map((x) => `${x.rolle} ${x.name} (${haltung(x)})`).join(" · "), why: "Entlassen können Sie den Finanzminister, die Innenministerin, den Außenminister und die Zentralbankführung. Das kostet Kapital." };
  }
  if (frage && hatPrefix(tk, "opposition", "gegner", "rivale")) {
    const o = spiel.figuren.find((x) => x.amt === "opposition");
    const stark = w.parliament ? Object.entries(w.parliament.seats).filter(([k]) => k !== w.player?.partei.kurz && !spiel.lager.includes(k)).sort((a, b) => b[1] - a[1])[0] : undefined;
    return { ok: true, text: `${o ? `${o.rolle} ${o.name} ist ${haltung(o)}. ` : ""}${stark ? `Die stärkste Fraktion außerhalb Ihres Lagers ist die ${stark[0]} mit ${stark[1]} Sitzen.` : ""}`, why: "Die Opposition will die nächste Wahl gewinnen; sie profitiert von jedem Problem, das Sie nicht lösen." };
  }
  if (/(was soll ich|was muss ich|was raetst|rat |empfehl|naechste schritte|womit anfangen|was tun)/.test(t) || (hat(tk, "tun") && hat(tk, "was"))) {
    const tipps: string[] = [];
    if (spiel.ereignisse.length) tipps.push(`Zuerst wartet ${spiel.ereignisse.length === 1 ? "ein Ereignis" : `${spiel.ereignisse.length} Ereignisse`} auf Sie („${vorlage(spiel.ereignisse[0]!.vorlage).titel(w, spiel.ereignisse[0]!)}“).`);
    if (!spiel.ersterTagErledigt) tipps.push("Wählen Sie Ihre drei Ziele der Amtszeit.");
    const lage = probleme(w)[0];
    if (lage) {
      const rezept = (PROBLEM_REZEPT[lage.node.id] ?? [])[0];
      const n = rezept ? NET.nodes[NET.index.get(rezept)!] : undefined;
      if (n) tipps.push(`Das größte Problem ist ${lage.node.name}. Ein Weg: „${n.name}“ ${provinzenText(groessteEinwohner(lage.provinzen, 3))} erhöhen.`);
    }
    const s = stimmenSicht(w);
    if (s.luecke > 0) tipps.push(`Dem Lager fehlen für eine Mehrheit etwa ${s.luecke} Stimmen: Verhandeln Sie mit den Fraktionen (Duldung oder Bündnis), bevor Sie Gesetze einbringen.`);
    if (!tipps.length) tipps.push("Es liegt nichts an. Lassen Sie die Zeit laufen („Ein Monat weiter“) und beobachten Sie die Lage.");
    void rng;
    return { ok: true, text: tipps.join(" "), why: "Rat des Präsidialamts, aus dem Zustand der Welt gerechnet." };
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
      return { ok: false, text: `Die ${info.name} ist kein Regler, sondern eine Folge Ihrer Politik. Wege: ${info.wege[gewuenscht > 0 ? "rauf" : "runter"]}`, why: "Wirtschaftsmodell: Diese Größe ergibt sich aus Zinsen, Nachfrage, Erwartungen und Wechselkurs." };
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
  const vorschlaege = [...h.map(nenne), ...rezept.filter((r) => !h.some((x) => x.node.id === r.id)).map((r) => `„${r.name}“ erhöhen`)].slice(0, 3);
  if (!vorschlaege.length) return { ok: false, text: `„${beste.node.name}“ ist ein Wert und kein Regler, und ich finde keinen direkten Hebel dafür.` };
  return {
    ok: false,
    text: `„${beste.node.name}“ ist ein Wert, den Sie nicht selbst einstellen, sondern über Maßnahmen bewegen. Wege ${gewuenscht > 0 ? "nach oben" : "nach unten"}: ${vorschlaege.join(", ")}. Sagen Sie zum Beispiel: „${vorschlaege[0]!.replace(/[„“]/g, "")}${w.spiel ? " in Hatay" : ""}“.`,
    why: "Aus den Verbindungen des Politiknetzes gerechnet (direkte Wirkungen und solche über eine Zwischengröße).",
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
        "Mit den Fraktionen verhandeln Sie in vier Stufen: ein Gespräch (1 Kapital) macht sie offener; Zugeständnisse wie Kontrollrechte (3 Kapital) noch mehr; eine Duldung liefert sechs Monate lang ihre Stimmen bei Gesetzen; ein Bündnis holt sie dauerhaft ins Lager. Jede Unterstützung kostet eine Zusage, die Sie halten müssen. " +
        `Der Stand: ${zeilen}. Sagen Sie zum Beispiel „Führe ein Gespräch mit der ${uebersicht[0]?.name ?? "CHP"}“, oder öffnen Sie im Parlament-Fenster den Bereich „Fraktionen und Verhandlungen“.`,
      why: "Ohne eigene Mehrheit scheitern Gesetze, und Stimmen zu kaufen ist teurer als ein Partner. Wer Zusagen bricht, verliert die Fraktion und ihre Stimmen.",
    };
  }
  const f = uebersicht.find((x) => x.partei === partei);
  if (!f) return { ok: false, text: `Die ${PARTEI_NAME[partei] ?? partei} hat in diesem Parlament keine Sitze; mit ihr lässt sich nichts verhandeln.` };
  const optionen = f.aktionen.map((a) => `${a.label} (${a.pk} Kapital${a.moeglich ? "" : `, gerade nicht: ${a.grund}`})`).join("; ");

  let wahl: Verhandlung | null = aktion;
  if (!wahl) {
    // „Verhandle mit der X“: ein günstiges Gespräch, wenn sie noch nicht offen genug ist; sonst die Möglichkeiten nennen
    const gespraech = f.aktionen.find((a) => a.id === "gespraech");
    if (f.bereitschaft < 40 && gespraech?.moeglich) wahl = "gespraech";
    else
      return {
        ok: true,
        text: `Die ${f.name} (${f.sitze} Sitze) ist ${f.wort} und will ${f.forderung}. Möglich: ${optionen}. Sagen Sie, was Sie tun wollen, etwa „Handle eine Duldung mit der ${f.name} aus“.`,
        why: "Ich führe nichts aus, was Kapital kostet, ohne dass Sie es ausdrücklich sagen.",
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
      if (!f) return { ok: false, text: "Diese Person gibt es in Ihrer Partie nicht." };
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
    text: `${v.titel(w, ev)}. Möglich: ${antworten(w, ev)
      .map((o) => `${o.label} (${o.pk} Kapital)`)
      .join("; ")}. Sagen Sie etwa „Annehmen“ oder „Ablehnen“.`,
    why: "Ich führe nichts aus, solange unklar ist, welche Antwort Sie meinen.",
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
      text: "Es gibt keinen aktiven Konfliktvorgang. Ein Vorgang entsteht, wenn der Konflikt mit einem Land die Schwelle überschreitet (Konflikt-Dimension im Ländersteckbrief, Zwischenfälle); dann stehen im Dossier des Landes Mobilmachung, Rahmung, Vermittlung und der Einsatzbeschluss zur Wahl. Schlachten und Taktik gibt es nicht: Der Präsident bestellt und verantwortet, er kommandiert nicht.",
      why: "Ehrlich statt vorgetäuscht: Konflikte laufen als Vorgang in den Phasen Spannung, Drohkulisse, Beschluss, Krieg, Waffenruhe, Frieden.",
    };
  }
  const l = land(k.land);
  const frage = /^(wie|was|wo|wer|zeig|nenne|sag|steht|stehen|ist|sind)/.test(t) || hatPrefix(tk, "lage", "stand", "dossier", "front");
  if (frage && !hatPrefix(tk, "mobil", "beschluss", "waffenruhe", "kriegsziel")) {
    const hb = handlungenFuer(w, k.id)
      .filter((x) => x.moeglich)
      .map((x) => `${x.label} (${x.pk} Kapital)`);
    const front = k.phase === "krieg" || k.phase === "waffenruhe" ? `, Frontlage ${Math.round(k.front)} von 100 (${k.front > k.frontVorher + 0.5 ? "steigend" : k.front < k.frontVorher - 0.5 ? "fallend" : "stabil"}), Rückhalt im Land ${Math.round(k.uhr)}` : "";
    return {
      ok: true,
      text: `${PHASEN_NAME[k.phase]} mit ${l.name}: Eskalation ${Math.round(k.eskalation)} von 100${front}. ${hb.length ? `Möglich: ${hb.join(", ")}.` : "Gerade ist keine Handlung möglich."}`,
      why: "Das vollständige Dossier mit allen Preisen und dem Lagebild steht in der Welt-Ansicht beim Land.",
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
      text: `Konfliktvorgang mit ${l.name} (${PHASEN_NAME[k.phase]}). Befehle je nach Phase: „Teilmobilmachung“ oder „Vollmobilmachung“, „Abschreckungssignal“, „Vermittlung rufen“, „Kriegsziel deklarieren“, „Einsatzbeschluss einbringen“ (oder „per Erlass“), „Verstärkung schicken“, „Waffenruhe anbieten“, „Friedenspaket“, „Lage beruhigen“.`,
      why: "Das Dossier in der Welt-Ansicht zeigt alle Handlungen dieser Phase mit Preisen und Gründen.",
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
      const moeglich = aktionenFuer(w, id).filter((a) => a.moeglich).map((a) => `${a.aktion.label} (${a.aktion.pk} Kapital)`);
      return {
        ok: true,
        text:
          `${l.name}: ${haltungWort(w, id)}. Handel ${Math.round(z.handel)}, Sicherheit ${Math.round(z.sicherheit)}, Vertrauen ${Math.round(dimensionZu(w, id, "vertrauen"))}, Konflikt ${Math.round(z.konflikt)}. ` +
          (offen.length ? `Sie will von der Türkei: ${offen.map((x) => x.anliegen.titel).join("; ")}. ` : "Ihre Anliegen sind erfüllt. ") +
          (moeglich.length ? `Möglich: ${moeglich.join(", ")}.` : "Gerade ist keine Handlung möglich."),
        why: "Sagen Sie zum Beispiel „Gipfeltreffen mit der EU“ oder „Handelsabkommen mit Aserbaidschan“. Die Übersicht steht im Fenster „Die Welt“.",
      };
    }
    return {
      ok: true,
      text: `Mit ${l.name} können Sie ein Gipfeltreffen, ein Handelsabkommen, ein Rüstungsgeschäft, öffentlichen Druck, eine Entschärfung oder Wirtschaftshilfe verabreden, soweit das Land dafür offen ist. Sagen Sie, was Sie wollen, etwa „Gipfeltreffen mit ${l.name}“.`,
    };
  }

  // Wähler
  const gruppe = tk.map((x) => GRUPPEN_WORT[x]).find(Boolean);
  if (gruppe && frage) {
    const g = waehlerLage(w).find((x) => x.id === gruppe)!;
    return {
      ok: true,
      text: `${g.name} sind ${g.wort} (Stimmung ${Math.round(g.laune)}${g.trend !== null && Math.abs(g.trend) >= 0.4 ? `, ${g.trend > 0 ? "steigend" : "fallend"}` : ""}). ${g.gruende.slice(0, 2).map((r) => `${r.richtung > 0 ? "Für Sie" : "Gegen Sie"}: ${r.name} (${r.text.replace(/\.$/, "")})`).join("; ")}. Sie wollen: ${g.forderungen.map((f) => `${f.name} ${tunWort(f.massnahme, f.richtung)}`).join(", ")}.`,
      why: "Die vollständige Übersicht steht im Fenster „Wähler“.",
    };
  }
  if (frage && hatPrefix(tk, "waehler", "verbuendet", "veraerger", "unzufrieden", "koalition") && !hatPrefix(tk, "fraktion", "parlament")) {
    const lage = waehlerLage(w);
    const gut = lage.filter((g) => g.laune >= 58).map((g) => g.name);
    const schlecht = [...lage].filter((g) => g.laune < 45).map((g) => `${g.name} (${Math.round(g.laune)})`);
    return {
      ok: true,
      text: `${gut.length ? `Zufrieden sind ${gut.join(", ")}. ` : "Keine Gruppe ist ausgesprochen zufrieden. "}${schlecht.length ? `Verärgert sind ${schlecht.join(", ")}.` : "Verärgert ist niemand."}`,
      why: "Gründe und Forderungen jeder Gruppe stehen im Fenster „Wähler“.",
    };
  }

  // Programme
  if (hatPrefix(tk, "programm", "plan", "fokus") || (t.includes("naechste") && hatPrefix(tk, "schritt"))) {
    const s = naechsterSchritt(w);
    if (hatPrefix(tk, "starte", "beginn", "los", "umsetz") && s && s.status === "bereit") {
      const r = starteSchritt(w, s.schritt.id);
      return { ok: r.ok, text: r.text, ...(r.why ? { why: r.why } : {}) };
    }
    if (!s) return { ok: true, text: "Alle Programmschritte sind erledigt oder laufen." };
    const offen = s.bedingungen.find((b) => !b.erfuellt);
    return {
      ok: true,
      text: `Als Nächstes im Programm: ${s.schritt.titel}. ${s.schritt.text} ${s.status === "bereit" ? `Er ist bereit und kostet ${s.schritt.kapital} Kapital („Starte den nächsten Programmschritt“).` : `Dafür fehlt noch: ${offen?.text ?? "eine Voraussetzung"}.`}`,
      why: "Programme und ihre Schritte stehen unter Politik, Reiter „Programme“.",
    };
  }
  return null;
}

function nichtVorhanden(t: string, tk: string[], w: World): ChatAntwort | null {
  if (hatPrefix(tk, "krieg", "truppe", "armee", "angriff", "einmarsch", "invasion", "rakete", "bombardier", "militaerisch", "kampf", "waffen", "soldat")) {
    return {
      ok: false,
      text: "Konflikte laufen als Vorgang: Spannung, Drohkulisse, Einsatzbeschluss (mit Parlamentsmehrheit oder teurem Erlass), Krieg mit Frontlage und Erschöpfungsuhr, Waffenruhe, Frieden mit Innenpreis. Das Dossier steht in der Welt-Ansicht beim betroffenen Land; Befehle wie „Teilmobilmachung“ oder „Kriegsziel deklarieren“ wirken dort. Schlachten, Raketen und Taktik gibt es nicht — der Präsident bestellt und verantwortet, er kommandiert nicht.",
      why: "Ehrlich statt vorgetäuscht: Ich führe nur aus, was der Kern rechnen kann.",
    };
  }
  if (hatPrefix(tk, "vertragsklausel", "mediation", "vermittl", "abkommen", "vertrag")) {
    return {
      ok: true,
      text: "Verträge mit Klauseln stehen am Verhandlungstisch: In der Welt ein Land wählen (oder es auf der Karte antippen) und „Verhandeln“ öffnen; Sie stellen zusammen, was die Türkei bietet und verlangt, und sehen sofort, was das Land davon hält. Vermittlung zwischen Ukraine und Russland oder Armenien und Aserbaidschan finden Sie in der Welt unter „Zwischen Dritten“.",
      why: "Ein Vertrag wirkt jeden Monat, wird jedes Jahr geprüft und kann gebrochen werden.",
    };
  }
  if (hatPrefix(tk, "diplomat", "botschaft", "sanktion") || hat(tk, "nato")) {
    return {
      ok: false,
      text: "Gipfeltreffen, Handelsabkommen, Rüstungsgeschäfte, Druck, Entschärfung und Wirtschaftshilfe gibt es mit 18 Ländern („Gipfeltreffen mit der EU“), Verträge am Verhandlungstisch in der Welt. Was noch fehlt: Sanktionen und Bündnisfragen wie die NATO (sie kommt als Ereignis).",
      why: "Diplomatie ist in Stufen gebaut (Außenpolitik, Abschnitte 4 und 6); die Länder sehen Sie im Fenster „Die Welt“.",
    };
  }
  if (hatPrefix(tk, "neuwahl", "ruecktritt")) {
    const monate = w.spiel ? Math.round((w.spiel.wahltag - w.day) / 30.4) : 0;
    return {
      ok: false,
      text: `Neuwahlen kann der Präsident nicht selbst ausrufen. Der einzige Weg ist die Verfassungsfrage: Der Artikel „Amtszeit und Wiederwahl“ erlaubt als Variante eine vorgezogene Neuwahl („Verfassungsänderung einbringen: vorgezogene Neuwahl“) — das Paket läuft über Parlament, Verfassungsgericht und gegebenenfalls eine Volksabstimmung. Die nächste Wahl ist in etwa ${monate} Monaten. Einen Rücktritt gibt es nicht.`,
      why: "Mehrstufiger Vorgang statt Einzelentscheid: Die Werkstatt im Parlament-Fenster schnürt das Paket und zeigt die Stimmen-Prognose je Variante.",
    };
  }
  if (hatPrefix(tk, "kabinett", "minister") && hatPrefix(tk, "bilde", "ernenn", "berufe")) {
    return { ok: false, text: "Ein neues Kabinett bilden können Sie nicht; Sie können einzelne Mitglieder entlassen („Entlasse den Finanzminister“). Ihr Team steht unter „Wer sind meine Minister?“.", why: "Entlassungen kosten 4 Kapital." };
  }
  if (hatPrefix(tk, "rede", "ansprache", "fernseh", "interview") || (hat(tk, "nation") && hatPrefix(tk, "halten", "halt"))) {
    return { ok: false, text: "Reden und Ansprachen sind noch keine eigene Handlung. Sie kommen als Antwort auf Ereignisse vor, etwa bei einer Krise.", why: "Ansprachen sind für die nächste Ausbaustufe geplant." };
  }
  if (hat(tk, "kanal", "hafen", "flughafen", "tunnel", "staudamm", "kraftwerk", "grossprojekt", "megaprojekt", "riesenprojekt")) {
    return {
      ok: false,
      text: "Freie Großprojekte (ein neuer Flughafen, ein Hafen, ein Kanal, ein Kraftwerk an einem bestimmten Ort) gibt es noch nicht. Nah dran sind: Autobahn- und Brückenbau, Bahnausbau, Staudämme und Speicher, Stromnetzausbau, jeweils vor Ort mit „… in Hatay“.",
      why: "Freie Vorhaben sind für später geplant (Großprojekte).",
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
    return { ok: false, text: `Meinen Sie ${namen}${ortText}? Nennen Sie die Maßnahme genauer, zum Beispiel „erhöhe ${beste[0]!.node.name}${ortText}“.`, why: "Bei mehreren Möglichkeiten frage ich lieber nach, als etwas Ungewolltes auszuführen." };
  }
  const k = beste[0]!;
  const node = k.node;
  const { rauf, runter } = richtung(tk);
  let ort = ortAusText(t);
  const akut = /(akut|wo es noetig|wo noetig|wo betroffen|wo das problem|dort wo|betroffene)/.test(t);
  if (akut) {
    ort = akuteOrte(w, node.id);
    if (!ort) return { ok: false, text: `Zu „${node.name}“ ist aktuell nirgends ein verbundenes Problem akut; nennen Sie eine Provinz („… in Hatay“) oder das ganze Land.` };
  }
  const aktuell = stufeIn(w, node.id, ort);
  const absolut = t.match(/(?:auf|bis) (\d{1,3})(?: |$)/);
  const relativ = t.match(/(?:um|von) (\d{1,3})(?: punkte| stufen| prozent)?(?: |$)/);
  let ziel: number;
  if (absolut) ziel = parseInt(absolut[1]!, 10);
  else if (/(abschaff|streich|ganz weg)/.test(t)) ziel = 0;
  else if (/verdoppel/.test(t)) ziel = aktuell * 2;
  else if (/halbier/.test(t)) ziel = aktuell / 2;
  else if (rauf && runter) return { ok: false, text: `Bei „${node.name}“ ist unklar, ob Sie erhöhen oder senken wollen.` };
  else if (rauf || runter) {
    const d = relativ ? parseInt(relativ[1]!, 10) : 25;
    ziel = aktuell + (rauf ? d : -d);
  } else {
    return { ok: false, text: `„${node.name}“ verstanden${ort ? ` (${provinzenText(ort)})` : ""}, aber in welche Richtung? Sagen Sie etwa „erhöhe ${node.name}“ oder „${node.name} auf 70“.`, why: node.text };
  }
  ziel = Math.min(100, Math.max(0, Math.round(ziel)));
  const pr = pruefeVorhaben(w, node.id, ziel, ort);
  if (!pr.ok) return { ok: false, text: `„${node.name}“ ${provinzenText(ort)}: ${pr.grund ?? "keine Änderung"}.` };
  const alsErlass = /(erlass|dekret|per verordnung|sofort)/.test(t) && pr.erlass.moeglich;
  const r = bringeEin(w, node.id, ziel, ort, alsErlass ? "erlass" : "gesetz");
  const extra = !r.ok && pr.erlass.moeglich && !alsErlass ? ` Alternativ als Erlass für ${pr.erlass.pk} Kapital („… per Erlass“).` : "";
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
    return { ok: false, text: "Wen? Sie können den Finanzminister, die Innenministerin, den Außenminister oder die Zentralbankführung entlassen (jeweils 4 Kapital, die Zentralbankführung mit größeren Folgen).", why: "Ich entlasse niemanden auf Verdacht." };
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
    if (!v) return { ok: false, text: "Es liegt kein Verfassungspaket zur Abstimmung vor." };
    const sicht = paketStimmen(w, v.paket, v.absprachen);
    const ziel = sicht.erwartet >= VERFASSUNG_REGELN.mehrheit ? VERFASSUNG_REGELN.direkt + VERFASSUNG_REGELN.stimmenPuffer : VERFASSUNG_REGELN.mehrheit + VERFASSUNG_REGELN.stimmenPuffer;
    const noetig = Math.max(0, ziel - sicht.erwartet);
    if (!noetig) return { ok: true, text: `Die Prognose steht bei ${sicht.erwartet} Ja-Stimmen; die nächste Hürde gilt als gesichert.` };
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
        text: `Welche Artikel soll das Paket ändern? Zur Wahl stehen: ${liste}. Sagen Sie etwa „Verfassungsänderung einbringen: Wahlhürde auf fünf Prozent und Verfassungsgericht acht plus sieben“ — oder stellen Sie das Paket in der Werkstatt im Parlament-Fenster zusammen; dort sehen Sie je Variante die Stimmen-Prognose.`,
        why: "Ein Paket braucht mindestens einen Artikel, der vom bisherigen Recht abweicht. Eine Verfassungsfrage je Amtszeit.",
      };
    }
    const pr = pruefeVerfassung(w, paket);
    if (!pr.ok) return { ok: false, text: pr.grund ?? "Das Paket lässt sich so nicht einbringen." };
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
      why: "Eine Volksabstimmung ist eine Wahl über die Regierung selbst; die Auszählung streut wie eine Wahl.",
    };
  }
  if (v) {
    const sicht = paketStimmen(w, v.paket, v.absprachen);
    return {
      ok: true,
      text: `${stand.zeile} Erwartet werden ${sicht.erwartet} Ja-Stimmen (Spanne ${sicht.tief} bis ${sicht.hoch}): Ab ${VERFASSUNG_REGELN.direkt} wird das Paket direkt Gesetz, ab ${VERFASSUNG_REGELN.mehrheit} entscheidet das Volk, darunter scheitert es. Möglich: „Stimmen für die Verfassung kaufen“, „Verfassungspaket zurückziehen“.`,
      why: "Die Hürden sind hart: Einmal eingebracht, zählt jede Stimme — Absprachen kosten bei der Verfassungsfrage das Doppelte.",
    };
  }
  const aktiv = Object.entries(z.aktiv);
  const sperren = Object.entries(z.sperren).filter(([, bis]) => bis > w.day);
  return {
    ok: true,
    text:
      `${stand.zeile} Zur Wahl stehen die Artikel ${ARTIKEL.map((a) => `„${a.name}“`).join(", ")}. ` +
      `Ein Paket kostet ${VERFASSUNG_REGELN.pkBasis} Kapital plus ${VERFASSUNG_REGELN.pkJeArtikel} je geändertem Artikel; das Parlament braucht ${VERFASSUNG_REGELN.mehrheit} Stimmen (dann Volksabstimmung) oder ${VERFASSUNG_REGELN.direkt} (direkt Gesetz); das Verfassungsgericht kann anfechtbar sein. ` +
      (aktiv.length ? `Beschlossen ist bisher: ${aktiv.map(([a, vId]) => `${artikelDef(a)?.name ?? a}: ${varianteDef(vId)?.name ?? vId}`).join(", ")}. ` : "") +
      (sperren.length ? `Gesperrt nach einem Scheitern: ${sperren.map(([a]) => artikelDef(a)?.name ?? a).join(", ")}. ` : "") +
      `Sagen Sie etwa „Verfassungsänderung einbringen: Wahlhürde auf fünf Prozent“, oder öffnen Sie die Werkstatt im Parlament-Fenster.`,
    why: "Eine Verfassungsfrage je Amtszeit; gescheiterte Artikel sind zwölf Monate gesperrt. Die Werkstatt zeigt je Variante, welche Fraktionen und Wählergruppen sie trägt.",
  };
}

// ---------------------------------------------------------------------------
// Einstieg

/** Führt einen Befehl aus und meldet, was der Kern daraufhin protokolliert. */
export function befehl(text: string, w: World): ChatAntwort {
  const t = fold(text);
  const tk = tokens(t);
  if (!t) return { ok: false, text: "Sie haben nichts geschrieben." };
  if (w.spiel?.ende) return { ok: false, text: "Die Amtszeit ist beendet; die Bilanz steht im Schreibtisch." };

  if (hat(tk, "hilfe", "befehle", "beispiele") && tk.length <= 3) {
    return {
      ok: true,
      text:
        "Ich verstehe: Maßnahmen benennen (auch vor Ort, „… in Hatay und Adana“, „… im Osten“, „… wo es akut ist“), Fragen zur Lage (Inflation, Umfragen, Mehrheit, Probleme, Kapital, Ziele, Minister, Wähler), Länder (Verhältnis erfragen, Gipfeltreffen, Handelsabkommen, Druck, Entschärfung, Hilfe), Fraktionen im Parlament (Gespräch, Duldung, Bündnis), Programme („Was ist mein nächster Schritt?“, „Starte den nächsten Programmschritt“), Zeit („Ein Monat weiter“, „bis zum nächsten Ereignis“) und Eingriffe (Zentralbank kritisieren, Minister entlassen). Beispiele: " +
        BEISPIELE.join(" · "),
      why: "Alles, was Sie schreiben, wird geprüft und nur ausgeführt, wenn der Kern es hergibt.",
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
    replaceGovernor(w, "gefuegig", "eine neue, regierungsnahe Führung");
    const l = w.log[before];
    return { ok: true, text: l?.text ?? "Die Zentralbankführung wurde ersetzt.", ...(l?.why ? { why: l.why } : {}) };
  }
  if (hat(tk, "zentralbank", "bank", "notenbank") && hatPrefix(tk, "kriti", "druck", "angreif", "attackier", "oeffentlich")) {
    const before = w.log.length;
    criticizeCentralBank(w);
    const l = w.log[before];
    return { ok: true, text: l?.text ?? "Sie haben die Zentralbank öffentlich kritisiert.", ...(l?.why ? { why: l.why } : {}) };
  }
  if (hatPrefix(tk, "leitzins", "zinsen", "zinspolitik", "geldpolitik") && (richtung(tk).rauf || richtung(tk).runter || hatPrefix(tk, "bestimm", "festleg", "mach"))) {
    return {
      ok: false,
      text: "Den Leitzins bestimmt die Zentralbank, nicht die Regierung. Wege, die es gibt: öffentliche Kritik („Kritisiere die Zentralbank“), ihre Führung ersetzen („Entlasse den Zentralbankchef“) oder ein Haushalt, der die Inflation dämpft. Jeder Weg hat seinen Preis.",
      why: "Formell ist die Zentralbank unabhängig; Eingriffe kosten Glaubwürdigkeit und wirken über die Währung und die Erwartungen.",
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

  const laenderAntwort = laenderBefehl(t, tk, w);
  if (laenderAntwort) return laenderAntwort;

  // Haushalt: gesamtwirtschaftlich, nicht als einzelne Maßnahme
  if (/(mehr ausgeben|ausgaben erhoeh|konjunkturpaket|konjunkturprogramm|stimulus|investitionsprogramm|ausgabenprogramm)/.test(t)) {
    const schritt = einfacherSchritt(w, "mehr");
    if (!schritt) return { ok: false, text: "Alle Ausgabenposten stehen schon auf der höchsten Stufe." };
    const r = setzePosten(w, schritt.id, schritt.stufe);
    return { ok: r.ok, text: r.text, ...(r.why ? { why: r.why } : {}) };
  }
  if (/(sparen|sparpaket|ausgaben senk|ausgaben kuerz|haushalt konsolid|einsparen)/.test(t) && !hatPrefix(tk, "steuer")) {
    const schritt = einfacherSchritt(w, "sparen");
    if (!schritt) return { ok: false, text: "Alle Ausgabenposten stehen schon auf der niedrigsten Stufe." };
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
      "Das habe ich nicht als Auftrag verstanden. Ich kenne Maßnahmen (nennen Sie sie beim Namen, auch vor Ort), Fragen zur Lage, Zeitbefehle und Eingriffe. Zum Beispiel: " +
      BEISPIELE.slice(0, 4).join(" · ") +
      " „Hilfe“ zeigt alles.",
    why: "Unklare Anweisungen führen zu einer Rückfrage, nie zu einer ungewollten Ausführung (Entwicklungsplan, Abschnitt 7).",
  };
}
