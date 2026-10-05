// Kontext eines Ereignisfensters: Thema, sprechende Person, Kennzahlen „Worum es geht“, Sprung in die passende Akte.
// Reine Ansichtslogik aus vorhandenen Daten; nichts davon verändert den Spielstand.

import { NET } from "../../sim/world";
import { nationalAverage } from "../../sim/netz";
import { EREIGNIS_BEZUG } from "../../sim/gespraeche";
import { ratZuEreignis, type RessortRat } from "../../sim/personen-api";
import { angezeigteZustimmung } from "../../sim/medien";
import { t } from "../../i18n";
import type { Figur } from "../../sim/spiel-typen";
import type { World } from "../../sim/types";
import type { EreignisAnsicht } from "../../sim/ereignisse";

export type Thema = "haushalt" | "wirtschaft" | "aussen" | "sicherheit" | "gesellschaft" | "katastrophe" | "recht";

const MUSTER: [RegExp, Thema][] = [
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
};

const THEMA_AMT: Record<Thema, Figur["amt"]> = {
  haushalt: "finanzen",
  wirtschaft: "wirtschaft",
  aussen: "aussen",
  sicherheit: "generalstab",
  gesellschaft: "inneres",
  katastrophe: "inneres",
  recht: "justiz",
};

const SZENE_THEMA: Record<string, Thema> = { bank: "haushalt", parlament: "recht", istanbul: "gesellschaft", anatolien: "gesellschaft", wahlnacht: "gesellschaft" };

export function themaFuer(a: Pick<EreignisAnsicht, "vorlage" | "szene">): Thema {
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
  const reihenfolge: Figur["amt"][] = [...(bezug?.amt ?? []), THEMA_AMT[themaFuer(a)], "stab"];
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
}

const nf = (x: number, d = 1): string => x.toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d });

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
      const z = angezeigteZustimmung(w);
      return zahl("zustimmung", t("ereignis.kz.zustimmung"), `${Math.round(z.wert)} %`);
    },
    ansehen: knot("ansehen", t("ereignis.kz.ansehen")),
    eu: knot("beziehungen_eu", t("ereignis.kz.eu")),
    terror: knot("terrorgefahr", t("ereignis.kz.terror")),
    moral: knot("truppenmoral", t("ereignis.kz.moral")),
    polarisierung: knot("polarisierung", t("ereignis.kz.polarisierung")),
    vertrauen: knot("vertrauen_regierung", t("ereignis.kz.vertrauen")),
    justiz: knot("justiz_unabhaengigkeit", t("ereignis.kz.justiz")),
    presse: knot("pressefreiheit", t("ereignis.kz.presse")),
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
};

export function kennzahlenFuer(w: World, thema: Thema): Kennzahl[] {
  const b = bausteine(w);
  return THEMA_ZAHLEN[thema].map((id) => b[id]?.()).filter((k): k is Kennzahl => !!k);
}

export type AktenZiel = { dossier: "wirtschaft"; start: "lage" | "haushalt" } | { dossier: "welt" | "reich_militaer" | "katastrophe" | "waehler" | "reich_recht" };

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
      return { ziel: { dossier: "katastrophe" }, label: t("ereignis.akte.katastrophe") };
    case "recht":
      return { ziel: { dossier: "reich_recht" }, label: t("ereignis.akte.recht") };
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

/** Richtung einer Vorschauzeile aus ihrem Wortlaut (+, −, mehr, weniger, stärker, schwächer, Stufe a auf b). */
export function richtungVon(zeile: string): Richtung {
  const stufe = /Stufe (\d+) auf (\d+)/.exec(zeile);
  if (stufe) return Number(stufe[2]) > Number(stufe[1]) ? "auf" : "ab";
  if (/\+\d|\bmehr\b|stärker|steigt|höher/.test(zeile)) return "auf";
  if (/[−-]\d|\bweniger\b|schwächer|sinkt|niedriger/.test(zeile)) return "ab";
  return "neutral";
}
