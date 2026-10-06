// Die Menschen um den Präsidenten mit Profil: Ressort, Stil, Fähigkeit, Ehrgeiz, Groll, Lager. Was eine Person sorgt, weiß und leistet,
// wird aus dem Weltzustand gerechnet, nicht erzählt. Das Profil wird beim ersten Zugriff aus Spielstand und Namen abgeleitet,
// damit ältere Spielstände ohne Umbau weiterlaufen.

import { NET } from "./modell";
import { nationalAverage, decayVon } from "./netz";
import { LAENDER, vertrauenZu } from "./laender";
import type { World } from "./types";
import type { Figur } from "./spiel-typen";
import type { Erinnerung, FigurEigen, LagerArt, Stil } from "./personen-typen";
import { aktuelleLocale, t as tx } from "../i18n";
import { datenTexte } from "../i18n/daten";

export const nf = (x: number, d = 1): string => x.toLocaleString(aktuelleLocale(), { minimumFractionDigits: d, maximumFractionDigits: d });

/** Größen, bei denen ein höherer Wert schlechter ist. */
export const HOCH_SCHLECHT = new Set([
  "kriminalitaet", "terrorgefahr", "korruption", "haftueberfuellung", "ausnahmerecht", "strassburg_druck", "polarisierung",
  "zinslast", "lebenshaltung", "energiepreise", "energieimporte", "armut", "ungleichheit", "stau", "mieten", "kostendruck",
]);

export interface AmtDef {
  amt: Figur["amt"];
  /** Ressortname für Anzeige und Erinnerung */
  ressort: string;
  /** Größen des Ressorts: an ihnen wird gemessen, sie bestimmen Sorge und Aufträge */
  fach: string[];
  /** Maßnahmen des Ressorts */
  massnahmen: string[];
  /** Monatliche Wirkung bei voller Leistung; bei Untätigkeit oder Sabotage kehrt sie sich um */
  wirkung: { id: string; d: number }[];
  stile: Stil[];
  faehigkeit: [number, number];
  ehrgeiz: [number, number];
  lager: LagerArt;
  /** Ob das Amt bei Rücktritt im Streit einen Nachfolger bekommt (Regierungsamt) */
  regierungsamt: boolean;
  /** Ob man ihn entlassen kann */
  entlassbar: boolean;
}

export const AEMTER: Record<Figur["amt"], AmtDef> = {
  finanzen: {
    amt: "finanzen", ressort: "Finanzen", fach: ["steuereinnahmen", "vertrauen_maerkte", "zinslast", "steuermoral"],
    massnahmen: ["m_einkommensteuer", "m_mwst", "m_steuerfahndung", "m_verwaltungsdigital", "m_steueramnestie", "m_privatisierung"],
    wirkung: [{ id: "steuermoral", d: 0.12 }, { id: "steuereinnahmen", d: 0.1 }, { id: "vertrauen_maerkte", d: 0.1 }],
    stile: ["nuechtern", "vorsichtig", "streng"], faehigkeit: [58, 82], ehrgeiz: [30, 62], lager: "markt", regierungsamt: true, entlassbar: true,
  },
  inneres: {
    amt: "inneres", ressort: "Inneres", fach: ["kriminalitaet", "terrorgefahr"],
    massnahmen: ["m_polizei", "m_polizeitechnik", "m_grenzschutz", "m_versammlungsfreiheit"],
    wirkung: [{ id: "kriminalitaet", d: -0.12 }, { id: "terrorgefahr", d: -0.1 }],
    stile: ["streng", "machtbewusst", "loyal"], faehigkeit: [52, 78], ehrgeiz: [45, 78], lager: "apparat", regierungsamt: true, entlassbar: true,
  },
  aussen: {
    amt: "aussen", ressort: "Äußeres", fach: ["ansehen", "beziehungen_eu", "beziehungen_usa", "beziehungen_russland", "beziehungen_nahost"],
    massnahmen: ["m_eu_annaeherung", "m_integration", "m_handelssysteme", "m_grenzschutz"],
    wirkung: [{ id: "ansehen", d: 0.1 }],
    stile: ["vorsichtig", "eitel", "nuechtern"], faehigkeit: [55, 80], ehrgeiz: [35, 68], lager: "diplomatie", regierungsamt: true, entlassbar: true,
  },
  zentralbank: {
    amt: "zentralbank", ressort: "Zentralbank", fach: ["vertrauen_maerkte", "lebenshaltung"],
    massnahmen: ["m_bankenaufsicht"],
    wirkung: [],
    stile: ["vorsichtig", "streng", "nuechtern"], faehigkeit: [60, 84], ehrgeiz: [15, 40], lager: "markt", regierungsamt: false, entlassbar: false,
  },
  stab: {
    amt: "stab", ressort: "Präsidialamt", fach: ["vertrauen_regierung", "legitimitaet", "polarisierung"],
    massnahmen: ["m_digitale_oeffentlichkeit", "m_staatsmedien"],
    wirkung: [{ id: "vertrauen_regierung", d: 0.06 }],
    stile: ["loyal", "nuechtern", "machtbewusst"], faehigkeit: [55, 80], ehrgeiz: [35, 60], lager: "praesident", regierungsamt: true, entlassbar: true,
  },
  justiz: {
    amt: "justiz", ressort: "Justiz", fach: ["justiz_unabhaengigkeit", "justiz_effizienz", "haftueberfuellung", "urteilsbefolgung"],
    massnahmen: ["m_justizreform", "m_richterstellen", "m_haftvermeidung", "m_urteilsumsetzung", "m_antikorruption"],
    wirkung: [{ id: "justiz_effizienz", d: 0.1 }, { id: "justizvertrauen", d: 0.06 }],
    stile: ["nuechtern", "streng", "vorsichtig"], faehigkeit: [55, 80], ehrgeiz: [25, 60], lager: "justiz", regierungsamt: true, entlassbar: true,
  },
  generalstab: {
    amt: "generalstab", ressort: "Streitkräfte", fach: ["bereitschaft_heer", "bereitschaft_luft", "bereitschaft_see", "truppenmoral", "offiziersvertrauen"],
    massnahmen: ["m_verteidigung", "m_uebungen", "m_ruestungsindustrie", "m_offiziersauswahl", "m_wehrdienst"],
    wirkung: [{ id: "truppenmoral", d: 0.1 }, { id: "bereitschaft_heer", d: 0.06 }],
    stile: ["streng", "machtbewusst", "vorsichtig"], faehigkeit: [58, 82], ehrgeiz: [30, 70], lager: "streitkraefte", regierungsamt: true, entlassbar: true,
  },
  wirtschaft: {
    amt: "wirtschaft", ressort: "Wirtschaft", fach: ["investitionen", "industrie", "export", "auslandskapital"],
    massnahmen: ["m_investitionsanreize", "m_exportfoerderung", "m_kmu", "m_industrie_modernisierung", "m_kreditgarantien"],
    wirkung: [{ id: "investitionen", d: 0.08 }, { id: "industrie", d: 0.06 }],
    stile: ["eitel", "nuechtern", "machtbewusst"], faehigkeit: [52, 78], ehrgeiz: [40, 72], lager: "markt", regierungsamt: true, entlassbar: true,
  },
  partner: {
    amt: "partner", ressort: "Bündnispartei", fach: ["vertrauen_regierung"], massnahmen: [], wirkung: [],
    stile: ["machtbewusst", "nuechtern", "eitel"], faehigkeit: [50, 70], ehrgeiz: [55, 85], lager: "partei", regierungsamt: false, entlassbar: false,
  },
  opposition: {
    amt: "opposition", ressort: "Opposition", fach: ["polarisierung"], massnahmen: [], wirkung: [],
    stile: ["machtbewusst", "eitel"], faehigkeit: [50, 72], ehrgeiz: [70, 95], lager: "opposition", regierungsamt: false, entlassbar: false,
  },
};

datenTexte("amt", Object.values(AEMTER), (a) => a.amt, ["ressort"]);

export const amtDef = (f: Figur): AmtDef => AEMTER[f.amt];

/** Ein deterministischer Zufall aus Text: verbraucht keinen Zufallsstrom des Spiels. */
export function hashZahl(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  h ^= h >>> 13;
  h = Math.imul(h, 0x5bd1e995);
  h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}

const zwischen = (a: number, b: number, u: number) => Math.round(a + (b - a) * u);

/** Das Profil einer Figur; wird angelegt, wenn es fehlt (ältere Spielstände, neue Nachfolger). */
export function eigenVon(w: World, f: Figur): FigurEigen {
  if (f.eigen) return f.eigen;
  const d = AEMTER[f.amt];
  const s = `${w.seed}|${f.id}|${f.name}`;
  const eigen: FigurEigen = {
    stil: d.stile[Math.floor(hashZahl(s + "|stil") * d.stile.length)]!,
    faehigkeit: zwischen(d.faehigkeit[0], d.faehigkeit[1], hashZahl(s + "|fae")),
    ehrgeiz: zwischen(d.ehrgeiz[0], d.ehrgeiz[1], hashZahl(s + "|ehr")),
    groll: 0,
    lager: d.lager,
    seit: w.day,
    erinnerung: [],
  };
  f.eigen = eigen;
  return eigen;
}

export function figurNachId(w: World, id: string): Figur | undefined {
  return w.spiel?.figuren.find((f) => f.id === id);
}

/** Alle, mit denen man sprechen kann: die Opposition gehört ins Parlament. */
export const sprechbar = (f: Figur): boolean => f.amt !== "opposition";

export function merke(w: World, f: Figur, text: string): void {
  const e = eigenVon(w, f);
  e.erinnerung.push({ tag: w.day, text });
  if (e.erinnerung.length > 10) e.erinnerung.shift();
}

export const erinnerungen = (f: Figur): Erinnerung[] => [...(f.eigen?.erinnerung ?? [])].reverse();

const klemme = (x: number, a = 0, b = 100) => Math.min(b, Math.max(a, x));

export function loyalitaetVerschieben(f: Figur, delta: number): void {
  f.loyalitaet = klemme(f.loyalitaet + delta);
}

export function grollVerschieben(w: World, f: Figur, delta: number): void {
  const e = eigenVon(w, f);
  e.groll = klemme(e.groll + delta);
}

/** Wie gut das Ressort läuft: 0 bis 1,3. Fähigkeit und Loyalität zählen, Zusatzmittel und Druck erhöhen. */
export function leistung(w: World, f: Figur): number {
  const e = eigenVon(w, f);
  const basis = (0.6 * e.faehigkeit + 0.4 * f.loyalitaet) / 100;
  const mittel = e.mittelBis !== undefined && e.mittelBis > w.day ? 1.25 : 1;
  const druck = e.druckBis !== undefined && e.druckBis > w.day ? 1.15 : 1;
  // Wer neu im Amt ist oder nur kommissarisch führt, leistet weniger
  const neu = (e.einarbeitungBis !== undefined && e.einarbeitungBis > w.day ? 0.75 : 1) * (e.kommissarisch ? 0.8 : 1);
  return klemme(basis * mittel * druck * neu, 0, 1.3);
}

/** Was das Ressort dieser Person dauerhaft bewirkt: um wie viele Punkte sich die Größen im Gleichgewicht verschieben (negativ: sie bremsen). */
export function ressortWirkungSicht(w: World, f: Figur): { id: string; name: string; punkte: number }[] {
  const q = leistung(w, f);
  const faktor = 2 * (q - 0.5);
  return AEMTER[f.amt].wirkung
    .filter((x) => NET.index.has(x.id))
    .map((x) => {
      const decay = decayVon(NET.nodes[NET.index.get(x.id)!]!) || 0.08;
      const schlecht = HOCH_SCHLECHT.has(x.id);
      // Bei Größen, bei denen hoch schlecht ist, zeigt die Zahl die Verbesserung (positiv = besser für das Land)
      const punkte = Math.round(((x.d * faktor) / decay) * (schlecht ? -1 : 1) * 10) / 10;
      return { id: x.id, name: nodeName(x.id), punkte };
    });
}

/** Ein Hinweis, womit man diese Person gerade am besten erreicht (aus Loyalität, Groll, Ehrgeiz, Auftrag). */
export function empfehlung(w: World, f: Figur): string | undefined {
  const e = eigenVon(w, f);
  if (f.amt === "opposition") return undefined;
  if (e.kommissarisch) return tx("person.rat.kommissarisch");
  if (f.loyalitaet < 25) return tx("person.rat.loyalitaet");
  if (e.groll >= 40) return tx("person.rat.groll");
  if (e.ehrgeiz >= 75 && f.loyalitaet < 60) return tx("person.rat.ehrgeiz");
  if (e.auftrag?.status === "laeuft") return tx("person.rat.auftrag");
  if (f.loyalitaet >= 60 && !e.auftrag) return tx("person.rat.folgt", { g: f.weiblich ? "f" : "m" });
  return undefined;
}

export function leistungWort(q: number): string {
  if (q >= 0.85) return tx("person.leistung.hervorragend");
  if (q >= 0.7) return tx("person.leistung.gut");
  if (q >= 0.55) return tx("person.leistung.solide");
  if (q >= 0.4) return tx("person.leistung.schwach");
  return tx("person.leistung.laehmend");
}

export function grollWort(g: number): string {
  if (g >= 70) return tx("person.groll.gekraenkt");
  if (g >= 40) return tx("person.groll.veraergert");
  if (g >= 15) return tx("person.groll.gereizt");
  return tx("person.groll.gelassen");
}

export function ehrgeizWort(e: number): string {
  if (e >= 75) return tx("person.ehrgeiz.spitze");
  if (e >= 55) return tx("person.ehrgeiz.mehr");
  if (e >= 35) return tx("person.ehrgeiz.zufrieden");
  return tx("person.ehrgeiz.ruhe");
}

// ---------------------------------------------------------------------------
// Lage im Ressort

export interface LageWert {
  id: string;
  name: string;
  wert: number;
  /** Ob der Wert für das Land gut, mittel oder schlecht steht (aus Richtung und Höhe) */
  ton: "gut" | "mittel" | "schlecht";
  schlechtWennHoch: boolean;
}

const nodeName = (id: string) => NET.nodes[NET.index.get(id) ?? -1]?.name ?? id;

export function wertVon(w: World, id: string): number {
  return NET.index.has(id) ? nationalAverage(NET, w.net, id) : NaN;
}

function tonVon(wert: number, schlechtWennHoch: boolean): LageWert["ton"] {
  const gut = schlechtWennHoch ? 100 - wert : wert;
  return gut >= 58 ? "gut" : gut >= 38 ? "mittel" : "schlecht";
}

export function lageIm(w: World, f: Figur): LageWert[] {
  return AEMTER[f.amt].fach
    .filter((id) => NET.index.has(id))
    .map((id) => {
      const wert = wertVon(w, id);
      const sw = HOCH_SCHLECHT.has(id);
      return { id, name: nodeName(id), wert, ton: tonVon(wert, sw), schlechtWennHoch: sw };
    });
}

/** Die schlechteste Größe des Ressorts (der Anlass für Sorge, Kritik und Aufträge). */
export function schlechtesteGroesse(w: World, f: Figur): LageWert | undefined {
  const l = lageIm(w, f);
  if (!l.length) return undefined;
  return l.reduce((a, b) => ((a.schlechtWennHoch ? a.wert : 100 - a.wert) >= (b.schlechtWennHoch ? b.wert : 100 - b.wert) ? a : b));
}

/** Was eine Person gerade umtreibt, aus dem Weltzustand gerechnet (mit Zahlen). */
export function sorgeText(w: World, f: Figur): string {
  const e = w.economy;
  const sp = w.spiel!;
  switch (f.amt) {
    case "finanzen": {
      const g = f.weiblich ? "f" : "m";
      if (e.riskPremium > 450) return tx("person.sorge.finanzen.risiko", { r: Math.round(e.riskPremium) });
      if (e.deficit > 4.5) return tx("person.sorge.finanzen.defizit", { d: nf(e.deficit), s: nf(e.debtRatio), g });
      return tx("person.sorge.finanzen.schulden", { d: nf(e.deficit), s: nf(e.debtRatio), g });
    }
    case "inneres": {
      const k = wertVon(w, "kriminalitaet");
      const t = wertVon(w, "terrorgefahr");
      return tx("person.sorge.inneres", { k: Math.round(k), t: Math.round(t), g: f.weiblich === false ? "m" : "f" });
    }
    case "aussen": {
      const rang = LAENDER.map((l) => ({ l, v: vertrauenZu(w, l.id) })).sort((a, b) => a.v - b.v)[0];
      const g = f.weiblich ? "f" : "m";
      return rang ? tx("person.sorge.aussen", { land: { nom: rang.l.name, dat: rang.l.dat }, v: Math.round(rang.v), g }) : tx("person.sorge.aussenLeer", { g });
    }
    case "zentralbank":
      return tx("person.sorge.zentralbank", { i: nf(e.inflation), z: nf(e.inflationTarget), l: nf(e.policyRate), g: f.weiblich === false ? "m" : "f" });
    case "stab":
      return tx("person.sorge.stab", { z: nf(sp.umfrage.zustimmung), o: sp.zusagen.filter((z) => !z.erfuellt && !z.gebrochen).length, n: sp.gesetze.length, g: f.weiblich === false ? "m" : "f" });
    case "justiz": {
      const h = wertVon(w, "haftueberfuellung");
      const u = wertVon(w, "justiz_unabhaengigkeit");
      return tx("person.sorge.justiz", { h: Math.round(h), u: Math.round(u), g: f.weiblich === false ? "m" : "f" });
    }
    case "generalstab": {
      const m = wertVon(w, "truppenmoral");
      const v = wertVon(w, "offiziersvertrauen");
      return tx("person.sorge.generalstab", { m: Math.round(m), v: Math.round(v), g: f.weiblich ? "f" : "m" });
    }
    case "wirtschaft":
      return tx("person.sorge.wirtschaft", { i: Math.round(wertVon(w, "investitionen")), w: nf(e.growth), g: f.weiblich ? "f" : "m" });
    case "partner": {
      const offen = sp.zusagen.filter((z) => !z.erfuellt && !z.gebrochen && z.von === f.partei);
      const g = f.weiblich ? "f" : "m";
      return offen.length ? tx("person.sorge.partner", { n: offen.length, text: offen[0]!.text.replace(/^Die [^ ]+ erwartet /, ""), g }) : tx("person.sorge.partnerLeer", { g });
    }
    case "opposition":
      return tx("person.sorge.opposition", { p: Math.round(wertVon(w, "polarisierung")), g: f.weiblich ? "f" : "m" });
  }
}

/** Zahl der Sitze und Rückhalt: wie viel Gewicht ein Partner im Parlament hat (für Anzeige und Entlassungsfolgen). */
export function partnerSitze(w: World, f: Figur): number {
  return f.partei ? (w.parliament?.seats[f.partei] ?? 0) : 0;
}

