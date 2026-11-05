// Kontext eines Ereignisfensters: Thema, sprechende Person, Kennzahlen „Worum es geht“, Sprung in die passende Akte.
// Reine Ansichtslogik aus vorhandenen Daten; nichts davon verändert den Spielstand.

import { NET } from "../../sim/world";
import { nationalAverage } from "../../sim/netz";
import { EREIGNIS_BEZUG } from "../../sim/gespraeche";
import { ratZuEreignis, type RessortRat } from "../../sim/personen-api";
import { angezeigteZustimmung } from "../../sim/medien";
import { schlechtBeiHoch } from "../../sim/berichte";
import { LAENDER, vertrauenZu } from "../../sim/laender";
import { aktuelleSprache, t, zahl as zahlFmt } from "../../i18n";
import { stimmenSicht } from "../../sim/handeln";
import type { Figur } from "../../sim/spiel-typen";
import type { World } from "../../sim/types";
import type { EreignisAnsicht } from "../../sim/ereignisse";

export type Thema = "haushalt" | "wirtschaft" | "aussen" | "sicherheit" | "gesellschaft" | "katastrophe" | "recht" | "wohnen" | "partner";

/**
 * Ereignisse, in denen sich eine Partei meldet (Partner, Koalition, Duldung): Es geht um Sitze, den Rückhalt des Partners und offene
 * Zusagen, nicht um Justiz und Presse (Befund A-6: „AKP meldet sich“ zeigte Unabhängigkeit der Justiz und „Justiz öffnen“).
 */
const PARTNER_MUSTER = /^start_partner$|koalition|partner|duldung/;

const MUSTER: [RegExp, Thema][] = [
  // Wiederaufbau, Wohnungen, Mieten: Es geht um Wohnungsnot und Erdbebengefahr, nicht um Inflation (Spielerdurchlauf 5. November)
  [/wiederaufbau|wohnung|miet|bauaufsicht|sozialbau/, "wohnen"],
  [/beben|flut|brand|duerre|dürre|katastroph|ueberschwemm|hochwasser/, "katastrophe"],
  [/haushalt|mindestlohn|iwf|rating|lira|bank|steuer|zins|waehrung|schulden|rente/, "haushalt"],
  [/krieg|mil_|putsch|grenz|anschlag|terror|militaer/, "sicherheit"],
  [/^land_|^welt_|^eu_|nato|gipfel|botschaft|vermittlung|abkommen|beistand/, "aussen"],
  [/fabrik|industrie|export|energie|gas|wirtschaft|investor|tourismus/, "wirtschaft"],
  [/justiz|gericht|aym|verfassung|richter|anwalt/, "recht"],
];

const AMT_THEMA: Partial<Record<Figur["amt"], Thema>> = {
  finanzen: "haushalt",
  zentralbank: "haushalt",
  wirtschaft: "wirtschaft",
  aussen: "aussen",
  generalstab: "sicherheit",
  justiz: "recht",
  inneres: "gesellschaft",
  energie: "wirtschaft",
  handel: "wirtschaft",
  arbeit: "haushalt",
  umwelt: "wohnen",
  gesundheit: "gesellschaft",
  bildung: "gesellschaft",
  verteidigung: "sicherheit",
};

const THEMA_AMT: Record<Thema, Figur["amt"]> = {
  haushalt: "finanzen",
  wirtschaft: "wirtschaft",
  aussen: "aussen",
  sicherheit: "generalstab",
  gesellschaft: "inneres",
  katastrophe: "inneres",
  recht: "justiz",
  wohnen: "umwelt",
  partner: "partner",
};

const SZENE_THEMA: Record<string, Thema> = { bank: "haushalt", parlament: "recht", istanbul: "gesellschaft", anatolien: "gesellschaft", wahlnacht: "gesellschaft" };

// Eine fällige Zusage handelt von ihrer Maßnahme, nicht von der Szene (Spielerdurchlauf 5. November: Die Rentenzusage zeigte
// Justiz und Pressefreiheit unter „Worum es geht“)
const ZUSAGE_MUSTER: [RegExp, Thema][] = [
  [/sozialwohnung|mietdeckel|bauamnestie|stadterneuerung/, "wohnen"],
  [/rente|mwst|steuer|kindergeld|subvention|preiswahrheit/, "haushalt"],
  [/mindestlohn|kmu|kernkraft|autobahn|regionalfoerderung|gewerkschaft/, "wirtschaft"],
  [/polizei|verteidigung|grenzschutz|notstand|wehrdienst|friedensprozess/, "sicherheit"],
  [/justiz|richter|versammlung|internetsperren|medienaufsicht|antikorruption|minderheiten|wissenschaftsfreiheit/, "recht"],
];

export function themaFuer(a: Pick<EreignisAnsicht, "id" | "vorlage" | "szene">, w?: World): Thema {
  if (a.vorlage === "zusage" && w?.spiel) {
    const ev = w.spiel.ereignisse.find((e) => e.id === a.id);
    const m = w.spiel.zusagen.find((z) => z.id === String(ev?.daten?.zusage))?.massnahme ?? "";
    for (const [re, th] of ZUSAGE_MUSTER) if (re.test(m)) return th;
    const von = w.spiel.zusagen.find((z) => z.id === String(ev?.daten?.zusage))?.von;
    if (von && w.parliament?.seats[von] !== undefined) return "partner";
    return "gesellschaft";
  }
  if (PARTNER_MUSTER.test(a.vorlage)) return "partner";
  for (const [re, th] of MUSTER) if (re.test(a.vorlage)) return th;
  const bezug = EREIGNIS_BEZUG[a.vorlage];
  const amt = bezug?.amt[0];
  if (amt && AMT_THEMA[amt]) return AMT_THEMA[amt]!;
  return SZENE_THEMA[a.szene] ?? "gesellschaft";
}

export interface Sprecher {
  figur: Figur;
  rat?: RessortRat;
}

/** Wer im Fenster spricht: die Person des betroffenen Ressorts (aus dem Ereignisbezug), sonst die des Themas, sonst das Präsidialamt. */
export function sprecherFuer(w: World, a: Pick<EreignisAnsicht, "id" | "vorlage" | "szene">): Sprecher | null {
  const sp = w.spiel;
  if (!sp) return null;
  const im = sp.figuren.filter((f) => f.imAmt && f.amt !== "opposition");
  const raete = ratZuEreignis(w, a.id);
  const bezug = EREIGNIS_BEZUG[a.vorlage];
  // Meldet sich eine Partnerpartei (Zusage, Koalitionsangebot), spricht ihr Vorsitz, nicht das Ressort des Themas (Spielerdurchlauf 5. November:
  // „MHP meldet sich“ zeigte die Justizministerin)
  const partnerZuerst: Figur["amt"][] = /^start_partner$|koalition|partner/.test(a.vorlage) ? ["partner"] : [];
  // Wer mit Rücktritt droht oder aus Altersgründen geht, spricht selbst (Spielerdurchlauf 5. November: Beim Rücktrittsgesuch der
  // Justizministerin sprach die Innenministerin). Bei Intrige, Leck und Vorwürfen trägt weiter das zuständige Amt vor.
  if (a.vorlage === "person_ruecktritt" || a.vorlage === "person_altersruecktritt") {
    const ev = sp.ereignisse.find((e) => e.id === a.id);
    const selbst = im.find((f) => f.id === String(ev?.daten?.figur ?? ""));
    if (selbst) return { figur: selbst };
  }
  // Eine fällige Zusage trägt vor, wem sie gegeben wurde: der Vorsitz der Partei, bei Wählern das Präsidialamt
  if (a.vorlage === "zusage") {
    const ev = sp.ereignisse.find((e) => e.id === a.id);
    const von = sp.zusagen.find((z) => z.id === String(ev?.daten?.zusage))?.von;
    const chef = von ? im.find((f) => f.amt === "partner" && f.partei === von) : undefined;
    if (chef) return { figur: chef };
    if (von === "Wähler") partnerZuerst.push("stab");
  }
  const reihenfolge: Figur["amt"][] = [...partnerZuerst, ...(bezug?.amt ?? []), THEMA_AMT[themaFuer(a, w)], "stab"];
  for (const amt of reihenfolge) {
    const f = im.find((x) => x.amt === amt);
    if (f) {
      const rat = raete.find((r) => r.figurId === f.id);
      return rat ? { figur: f, rat } : { figur: f };
    }
  }
  return null;
}

export interface Kennzahl {
  id: string;
  label: string;
  wert: string;
  /** Monatswerte, älteste zuerst (nur wo es eine Zeitreihe gibt) */
  verlauf?: number[];
  /** Quelle unter der Zahl, wo sie von der Kopfleiste abweichen kann (Umfrage eines Instituts) */
  notiz?: string;
}

const nf = (x: number, d = 1): string => zahlFmt(x, d);

function knoten(w: World, id: string): number | undefined {
  return NET.index.has(id) ? nationalAverage(NET, w.net, id) : undefined;
}

function reihe(w: World, f: (h: World["history"][number]) => number | undefined): number[] | undefined {
  const r = w.history.slice(-12).map(f).filter((x): x is number => typeof x === "number" && Number.isFinite(x));
  return r.length >= 2 ? r : undefined;
}

function zahl(id: string, label: string, wert: string, verlauf?: number[]): Kennzahl {
  return verlauf ? { id, label, wert, verlauf } : { id, label, wert };
}

function bausteine(w: World): Record<string, () => Kennzahl | undefined> {
  const knot = (id: string, label: string) => () => {
    const v = knoten(w, id);
    return v === undefined ? undefined : zahl(id, label, `${Math.round(v)} / 100`);
  };
  return {
    schulden: () => zahl("schulden", t("ereignis.kz.schulden"), `${nf(w.economy.debtRatio)} %`, reihe(w, (h) => h.debtRatio)),
    inflation: () => zahl("inflation", t("ereignis.kz.inflation"), `${nf(w.published.inflation.value)} %`, reihe(w, (h) => h.inflation)),
    defizit: () => zahl("defizit", t("ereignis.kz.defizit"), `${nf(w.economy.deficit)} %`),
    lira: () => zahl("lira", t("ereignis.kz.lira"), nf(w.economy.usdTry), reihe(w, (h) => h.usdTry)),
    wachstum: () => zahl("wachstum", t("ereignis.kz.wachstum"), `${nf(w.economy.growth)} %`, reihe(w, (h) => h.growth)),
    arbeitslosigkeit: () => zahl("arbeitslosigkeit", t("ereignis.kz.arbeitslosigkeit"), `${nf(w.economy.unemployment)} %`, reihe(w, (h) => h.unemployment)),
    zustimmung: () => {
      if (!w.spiel) return undefined;
      // Die Kopfleiste zeigt die Messung des Stabs, hier steht die zuletzt veröffentlichte Umfrage; die Quelle erklärt den
      // Unterschied (Spielerdurchlauf 5. November: 47 % im Fenster, 50 % in der Leiste)
      const z = angezeigteZustimmung(w);
      const k = zahl("zustimmung", t("ereignis.kz.zustimmung"), `${Math.round(z.wert)} %`);
      return z.quelle === "institut" && z.institut ? { ...k, notiz: t("ereignis.kz.umfrageQuelle", { institut: z.institut, tage: z.alterTage }) } : k;
    },
    ansehen: knot("ansehen", t("ereignis.kz.ansehen")),
    eu: () => (w.spiel ? zahl("eu", t("ereignis.kz.eu"), `${Math.round(vertrauenZu(w, "EU"))} / 100`) : knot("beziehungen_eu", t("ereignis.kz.eu"))()),
    terror: knot("terrorgefahr", t("ereignis.kz.terror")),
    moral: knot("truppenmoral", t("ereignis.kz.moral")),
    polarisierung: knot("polarisierung", t("ereignis.kz.polarisierung")),
    vertrauen: knot("vertrauen_regierung", t("ereignis.kz.vertrauen")),
    justiz: knot("justiz_unabhaengigkeit", t("ereignis.kz.justiz")),
    presse: knot("pressefreiheit", t("ereignis.kz.presse")),
    wohnungsnot: knot("p_wohnungsnot", t("ereignis.kz.wohnungsnot")),
    erdbeben: knot("p_erdbebengefahr", t("ereignis.kz.erdbeben")),
    // Dieselbe Zahl wie in der Kopfleiste: Lager und Fraktionen, die es gerade dulden (ui/Stage.tsx)
    sitze: () => {
      if (!w.parliament || !w.spiel) return undefined;
      const s = stimmenSicht(w);
      return zahl("sitze", t("ev.kz.sitze"), t("ev.kz.sitzeWert", { n: s.lager + s.duldungSitze, von: Object.values(w.parliament.seats).reduce((a, b) => a + b, 0) }));
    },
    partner: () => {
      const p = partnerFigur(w);
      return p ? zahl("partner", t("ev.kz.partner", { partei: p.partei ?? "" }), `${Math.round(p.loyalitaet)} / 100`) : undefined;
    },
    zusagen: () => (w.spiel ? zahl("zusagen", t("ev.kz.zusagen"), String(w.spiel.zusagen.filter((z) => !z.erfuellt && !z.gebrochen).length)) : undefined),
  };
}

const THEMA_ZAHLEN: Record<Thema, string[]> = {
  haushalt: ["schulden", "inflation", "defizit", "lira"],
  wirtschaft: ["wachstum", "arbeitslosigkeit", "inflation", "lira"],
  aussen: ["ansehen", "eu", "zustimmung"],
  sicherheit: ["terror", "moral", "zustimmung"],
  gesellschaft: ["zustimmung", "polarisierung", "inflation", "arbeitslosigkeit"],
  katastrophe: ["zustimmung", "vertrauen", "schulden"],
  recht: ["justiz", "presse", "zustimmung"],
  wohnen: ["wohnungsnot", "erdbeben", "vertrauen", "schulden"],
  partner: ["sitze", "partner", "zusagen"],
};

/** Der Vorsitz der Partei, die sich im offenen Ereignis meldet (sonst der schwächste Partnervorsitz im Lager). */
let partnerImEreignis: string | undefined;
function partnerFigur(w: World): Figur | undefined {
  const im = (w.spiel?.figuren ?? []).filter((f) => f.amt === "partner" && f.imAmt);
  return (partnerImEreignis ? im.find((f) => f.partei === partnerImEreignis) : undefined) ?? im.filter((f) => w.spiel?.lager.includes(f.partei ?? "")).sort((a, b) => a.loyalitaet - b.loyalitaet)[0] ?? im[0];
}

export function kennzahlenFuer(w: World, thema: Thema, ereignisId?: string): Kennzahl[] {
  const evOffen = w.spiel?.ereignisse.find((e) => e.id === ereignisId);
  const vonZusage = evOffen?.vorlage === "zusage" ? w.spiel?.zusagen.find((z) => z.id === String(evOffen.daten?.zusage))?.von : undefined;
  partnerImEreignis = String(evOffen?.daten?.partei ?? vonZusage ?? "") || undefined;
  const b = bausteine(w);
  // Geht es um ein bestimmtes Land, steht dessen Vertrauen statt dem der EU (Spielerdurchlauf 5. November: Währungskrise im Iran
  // zeigte „Vertrauen der EU“)
  const landId = String(w.spiel?.ereignisse.find((e) => e.id === ereignisId)?.daten?.land ?? "");
  const l = landId && landId !== "EU" ? LAENDER.find((x) => x.id === landId) : undefined;
  if (l && w.spiel) b.eu = () => zahl(`land-${l.id}`, t("ereignis.kz.landVertrauen", { land: l.name }), `${Math.round(vertrauenZu(w, l.id))} / 100`);
  return THEMA_ZAHLEN[thema].map((id) => b[id]?.()).filter((k): k is Kennzahl => !!k);
}

export type AktenZiel = { dossier: "wirtschaft"; start: "lage" | "haushalt" } | { dossier: "welt" | "reich_militaer" | "katastrophe" | "waehler" | "reich_recht" | "personen" };

export function akteFuer(thema: Thema): { ziel: AktenZiel; label: string } {
  switch (thema) {
    case "haushalt":
      return { ziel: { dossier: "wirtschaft", start: "haushalt" }, label: t("ereignis.akte.haushalt") };
    case "wirtschaft":
      return { ziel: { dossier: "wirtschaft", start: "lage" }, label: t("ereignis.akte.wirtschaft") };
    case "aussen":
      return { ziel: { dossier: "welt" }, label: t("ereignis.akte.welt") };
    case "sicherheit":
      return { ziel: { dossier: "reich_militaer" }, label: t("ereignis.akte.militaer") };
    case "katastrophe":
    case "wohnen":
      return { ziel: { dossier: "katastrophe" }, label: t("ereignis.akte.katastrophe") };
    case "recht":
      return { ziel: { dossier: "reich_recht" }, label: t("ereignis.akte.recht") };
    case "partner":
      return { ziel: { dossier: "personen" }, label: t("ev.akte.partner") };
    default:
      return { ziel: { dossier: "waehler" }, label: t("ereignis.akte.waehler") };
  }
}

/** Teilt den ersten Absatz in ein Zitat (erster Satz) und den Rest. */
export function zitatAus(text: string[]): { zitat: string; rest: string[] } {
  const erster = text[0] ?? "";
  const m = /^(.+?[.!?])(\s+|$)(.*)$/s.exec(erster);
  if (!m) return { zitat: erster, rest: text.slice(1) };
  const rest = m[3]!.trim();
  return { zitat: m[1]!, rest: rest ? [rest, ...text.slice(1)] : text.slice(1) };
}

export type Richtung = "auf" | "ab" | "neutral";

/** Richtung einer Vorschauzeile aus ihrem Wortlaut (+, −, mehr, weniger, stärker, schwächer, Stufe a auf b), in allen drei Sprachen. */
export function richtungVon(zeile: string): Richtung {
  const stufe = /(?:Stufe|level|seviye) (\d+) (?:auf|to|→) (\d+)/i.exec(zeile);
  if (stufe) return Number(stufe[2]) > Number(stufe[1]) ? "auf" : "ab";
  if (/\+\d|\bmehr\b|stärker|steigt|höher|\bmore\b|stronger|daha fazla|güçlü/.test(zeile)) return "auf";
  if (/[−-]\d|\bweniger\b|schwächer|sinkt|niedriger|\bless\b|weaker|daha az|zayıf/.test(zeile)) return "ab";
  return "neutral";
}

export type Wertung = "gut" | "schlecht" | "neutral";

let schlechteNamen: { sprache: string; namen: string[] } | undefined;

/** Namen der Größen, bei denen mehr schlechter ist (Polarisierung, Druck aus Straßburg, Kriminalität …), in der aktuellen Sprache. */
function hochSchlechtNamen(): string[] {
  const sprache = aktuelleSprache();
  if (schlechteNamen?.sprache !== sprache) schlechteNamen = { sprache, namen: NET.nodes.filter((n) => !n.input && schlechtBeiHoch(n.id)).map((n) => n.name) };
  return schlechteNamen.namen;
}

/**
 * Ob eine Vorschauzeile für das Land gut oder schlecht ist, nicht nur, wohin sie zeigt (Spielerdurchlauf 5. November:
 * „Druck aus Straßburg −2“ stand rot da). Stufen von Maßnahmen sind weder noch; bei Schulden, Risikoaufschlag und
 * Größen wie Polarisierung ist mehr schlechter.
 */
export function wertungVon(zeile: string): Wertung {
  const r = richtungVon(zeile);
  if (r === "neutral" || /(?:Stufe|level|seviye) \d+ (?:auf|to|→) \d+/i.test(zeile)) return "neutral";
  const mehrSchlecht = /^(Schulden|Debt|Borç|Risikoaufschlag|Risk premium|Risk primi)\b/.test(zeile) || hochSchlechtNamen().some((n) => zeile.startsWith(`${n} `));
  return (r === "auf") !== mehrSchlecht ? "gut" : "schlecht";
}
