// Forschung und Große Ziele melden sich auf dem Schreibtisch (Welle E2, 7. November 2026; Analyse dokumentation/analyse_2026-11-05/bereiche/forschung.md).
//
// Befund aus dem Spielstand des Inhabers (2028 bis 2043): Kein Ereignis, keine Vorlage und kein Rat führte je in den Wissensbaum oder zu einem
// Versuch bei einem Großen Ziel. Der Baum war ab 2038 durch die Verwaltung gesperrt, ohne dass es jemand sagte; Nahost Stufe 2 war spätestens seit
// Februar 2039 versuchbar, Technologie Stufe 1 ebenso, und beides lag brach. Drei Vorgänge:
//
//   forschungsrat          Der Forschungsrat legt drei Vorhaben vor, die jetzt beginnen können, eines davon, wo es geht, als Lizenz. Sprecher ist
//                          der Industrieminister (Amt `wirtschaft`, ENTSCHEIDUNGEN W). Vorbild: die drei Karten von Stellaris (Analyse, Abschnitt 6 C).
//   forschung_verwaltung   Die Forschung wartet auf die Verwaltung: Vorhaben ohne Fortschritt binden Verwaltungskraft, die jeder neue Knoten als
//                          Vorrat braucht. Antwort über den vorhandenen Weg der Baustelle (ruhen lassen, sim/reich.ts `pausiere`).
//   grossziel_gelegenheit  Eine verfolgte Stufe eines Großen Ziels ist versuchbar und die Chance mindestens „aussichtsreich“: einmal je Stufe eine
//                          Vorlage mit Versuch, Vorbereitung und „Später“. Danach steht die Stufe unter Fristen, bis sie versucht ist.
//
// Jede Antwort wirkt über die vorhandenen Wege (beginneKnoten, pausiere, versuche, geheWeg) und nennt die Stelle, an der man dasselbe selbst in der
// Hand hat. Alle Schwellen, Häufigkeiten und Folgen sind Spielparameter, keine Messwerte.
//
// Wirklichkeit hinter der Wahl „selbst oder Lizenz“ (Analyse forschung.md, R7): Wer mit fremder Technik baut, ist schneller, aber abhängig. CAATSA
// (14.12.2020) sperrte der Rüstungsbehörde SSB alle US-Exportlizenzen; das deutsche Embargo für Motor und Getriebe zwang den Altay auf einen
// koreanischen Antrieb; KAAN fliegt mit dem US-Triebwerk GE F110. Quellen: https://en.wikipedia.org/wiki/Countering_America's_Adversaries_Through_Sanctions_Act,
// https://en.wikipedia.org/wiki/Altay_(tank), https://en.wikipedia.org/wiki/TAI_TF_Kaan. Tempo und Sperre der Lizenz sind Spielparameter (data/wissensbaum.ts, BAUM).

import { t } from "../i18n";
import { BAUM, LIZENZ, RIVALEN, ZWEIG_VON, type Lizenzgeber } from "../data/wissensbaum";
import { baumSicht, beginneKnoten, beginnPreis, dauerEcht, heurekaErfuellt, knotenName, knotenSicht, verwaltungsBedarf, verwaltungsLage, type KnotenSicht } from "./wissensbaum";
import { partnerGesperrt } from "./wissensbaum-kern";
import { pausiere, reichZustand, vorhabenDef } from "./reich";
import { GROSSE_ZIELE, WEGE, chanceVon, geheWeg, grosseZiele, schwelleSicht, versuche, versuchGrund, wegGrund, zielDef, type WegId } from "./grosseziele";
import { anrede, figur, loyalitaetAendern } from "./figuren";
import { landAendern } from "./laender";
import { istHauptakteur } from "./welt-modell";
import { kannZahlen } from "./kapital";
import { NET } from "./modell";
import { nf, opt } from "./ereignis-hilfen";
import type { Option, Vorlage } from "./ereignis-hilfen";
import type { OffenesEreignis } from "./spiel-typen";
import type { World } from "./types";

// ---------------------------------------------------------------------------
// Spielparameter

export const FORSCHUNGSDRUCK = {
  rat: {
    /** Der Rat meldet sich, wenn im Baum weniger als so viele Vorhaben laufen (HOI4 beginnt mit 2 bis 3 Plätzen, Analyse Abschnitt 6 C) */
    unterLaufend: 2,
    /** Chance je Monat, solange die Lage gilt; einmal im Jahr über die Abkühlung */
    chance: 0.35,
    abkuehlung: 330,
    frist: 30,
    /** Höchstens so viele Angebote */
    angebote: 3,
    /** Wer den Rat übergeht, verärgert den Industrieminister (Loyalität) */
    uebergangen: 3,
  },
  verwaltung: {
    /** So viele Knoten müssen allein an der Verwaltung hängen (im Spielstand des Inhabers 2043: 15 von 16; der sechzehnte, KAAN, braucht keine) */
    abKnoten: 3,
    chance: 0.35,
    abkuehlung: 360,
    frist: 30,
    /** Schweigen: Der Industrieminister sieht seine Forschung liegen (Loyalität) */
    uebergangen: 2,
  },
  gelegenheit: {
    chance: 0.5,
    /** Zwischen zwei Gelegenheiten (auch für verschiedene Ziele) */
    abkuehlung: 120,
    frist: 45,
    /** Ab diesem Wort der Chance meldet sich die Stufe (Entscheidung Q.6) */
    ab: ["aussichtsreich", "gut"] as readonly string[],
    /** Liegenlassen: Vorbereitung verfliegt, und die Partner merken das Zögern (Vertrauen der Hauptakteure unter den Partnern) */
    verfliegt: 5,
    vertrauen: -1,
  },
} as const;

const laufendImBaum = (w: World): number => reichZustand(w).laufend.filter((l) => ZWEIG_VON[l.id] && !l.pausiert).length;

// ---------------------------------------------------------------------------
// Forschungsrat: drei Angebote

export interface RatAngebot {
  knoten: string;
  lizenz?: Lizenzgeber;
}

/** Knoten, die jetzt beginnen können (Kapital zählt nicht: Fehlt es, zeigt die Antwort die Sperre). Keine Wunder: Sie sind Chefsache. */
function startbar(w: World): KnotenSicht[] {
  return baumSicht(w).zweige.flatMap((z) => z.knoten).filter((k) => k.zustand === "moeglich" && (!k.grund || k.hindernis === "kapital") && !k.wunder);
}

/** Ein Lizenzgeber, der gerade nicht sperrt (der erste in der Reihe der Daten). */
function freierGeber(w: World, id: string): Lizenzgeber | undefined {
  return (LIZENZ[id] ?? []).find((p) => !partnerGesperrt(w, p, id));
}

/**
 * Was der Rat vorlegt: zuerst, was ein vollendeter Fokus beschlossen hat (Modifikator `fokus:wissen:<id>`), dann Knoten mit erfülltem Heureka,
 * dann je Zweig der günstigste. Hat einer der ersten drei einen freien Lizenzgeber, steht er zweimal da, selbst entwickelt und mit Lizenz:
 * Das ist die Wahl „selbst oder kaufen“ (Analyse forschung.md, Abschnitt 4.3). Höchstens drei Angebote.
 */
export function ratAngebote(w: World): RatAngebot[] {
  const mod = w.spiel?.modifikatoren ?? {};
  const ks = startbar(w);
  const rang = (k: KnotenSicht) => (mod[`fokus:wissen:${k.id}`] ? 0 : heurekaErfuellt(w, k.id) ? 1 : 2);
  ks.sort((a, b) => rang(a) - rang(b) || a.pk - b.pk || a.id.localeCompare(b.id));
  // Je Zweig erst einer, dann die übrigen: Der Rat legt eine Auswahl vor, nicht drei Rüstungsknoten
  const erst: KnotenSicht[] = [];
  const dann: KnotenSicht[] = [];
  const zweige = new Set<string>();
  for (const k of ks) (zweige.has(k.zweig) ? dann : erst).push(k), zweige.add(k.zweig);
  const reihe = [...erst, ...dann];
  const max = FORSCHUNGSDRUCK.rat.angebote;
  const lizenzK = reihe.slice(0, max).find((k) => freierGeber(w, k.id));
  if (!lizenzK) return reihe.slice(0, max).map((k) => ({ knoten: k.id }));
  const andere = reihe.filter((k) => k !== lizenzK).slice(0, max - 2);
  const paar: RatAngebot[] = [{ knoten: lizenzK.id }, { knoten: lizenzK.id, lizenz: freierGeber(w, lizenzK.id)! }];
  // Der vorderste Knoten bleibt vorn: Ist er nicht der mit Lizenz, steht er vor dem Paar
  return reihe[0] === lizenzK ? [...paar, ...andere.map((k) => ({ knoten: k.id }))] : [...andere.map((k) => ({ knoten: k.id })), ...paar];
}

const angebotAus = (ev: OffenesEreignis, i: number): RatAngebot | null => {
  const roh = String(ev.daten?.[`a${i}`] ?? "");
  if (!roh) return null;
  const [knoten, lizenz] = roh.split("@");
  return { knoten: knoten!, ...(lizenz ? { lizenz: lizenz as Lizenzgeber } : {}) };
};

/** Schweigen zum Rat: Der Industrieminister fühlt sich übergangen. */
function ratStandard(w: World): string {
  loyalitaetAendern(w, "wirtschaft", -FORSCHUNGSDRUCK.rat.uebergangen, t("welle_e2.rat.grund"));
  return t("welle_e2.rat.standard", { d: FORSCHUNGSDRUCK.rat.uebergangen });
}

/** Eine Antwort des Rats: ein Knoten, selbst oder mit Lizenz. Preis, Dauer und Sperre aus denselben Rechnungen wie im Baum. */
function ratAntwort(w0: World, i: number, a: RatAngebot): Option {
  const name = knotenName(a.knoten);
  const preis = beginnPreis(w0, a.knoten, a.lizenz ? { lizenz: a.lizenz } : {});
  const k = knotenSicht(w0, a.knoten);
  const monate = dauerEcht(w0, a.knoten, !!a.lizenz);
  const label = a.lizenz ? t("welle_e2.rat.opt.lizenz", { name, land: t(`wissen.partner.${a.lizenz}`) }) : t("welle_e2.rat.opt.selbst", { name });
  const o = opt(`k${i}`, label, t(`wissen.n.${a.knoten}.satz`), 0, (w) => {
    const r = beginneKnoten(w, a.knoten, a.lizenz ? { lizenz: a.lizenz } : {});
    if (!r.ok) return `${t("welle_e2.rat.gescheitert", { name, grund: r.text })} ${ratStandard(w)}`;
    return r.text;
  });
  const plan = k?.monate ?? 0;
  const bedingungen = [monate === undefined ? t("welle_e2.rat.dauerOffen", { plan }) : t("welle_e2.rat.dauer", { monate, plan })];
  if (a.lizenz) {
    const rivalen = RIVALEN[a.lizenz].map((r) => t(`wissen.partner.${r.id}`)).join(", ");
    bedingungen.push(t("welle_e2.rat.lizenzFolge", { tempo: nf(BAUM.lizenzTempo, 1), land: t(`wissen.partner.${a.lizenz}`), gesperrt: nf(BAUM.gesperrtTempo, 1), rivalen }));
  } else if (LIZENZ[a.knoten]?.length) bedingungen.push(t("welle_e2.rat.selbstFolge"));
  const sperre = !k || k.zustand !== "moeglich" ? (k?.grund ?? t("wissen.e.nichtMoeglich")) : !preis.ok ? preis.grund : undefined;
  return { ...o, anzeigePk: preis.pk, bedingungen, stelle: { art: "wissen", knoten: a.knoten }, ...(sperre ? { sperre } : {}) };
}

const FORSCHUNGSRAT: Vorlage = {
  id: "forschungsrat",
  eigenerWurf: true,
  ohneZusatzplatz: true,
  szene: "istanbul",
  frist: FORSCHUNGSDRUCK.rat.frist,
  abkuehlung: FORSCHUNGSDRUCK.rat.abkuehlung,
  chance: (w) => (w.spiel && laufendImBaum(w) < FORSCHUNGSDRUCK.rat.unterLaufend && ratAngebote(w).length > 0 ? FORSCHUNGSDRUCK.rat.chance : 0),
  erzeuge: (w) => {
    const a = ratAngebote(w);
    if (!a.length) return null;
    const daten: Record<string, string | number> = { laufend: laufendImBaum(w), tempo: Math.round(baumSicht(w).tempo.gesamt * 10) / 10 };
    a.forEach((x, i) => (daten[`a${i + 1}`] = x.lizenz ? `${x.knoten}@${x.lizenz}` : x.knoten));
    return { provinzen: [], staerke: 1, daten };
  },
  titel: () => t("welle_e2.rat.titel"),
  text: (w, ev) => [
    t("welle_e2.rat.text1", { wer: anrede(figur(w, "wirtschaft")), laufend: Number(ev.daten?.laufend ?? 0), tempo: Number(ev.daten?.tempo ?? 1) }),
    t("welle_e2.rat.text2"),
  ],
  warum: (_, ev) => t("welle_e2.rat.warum", { laufend: Number(ev.daten?.laufend ?? 0) }),
  stelle: () => ({ art: "wissen" }),
  optionen: (w, ev) => {
    const out: Option[] = [];
    for (let i = 1; i <= FORSCHUNGSDRUCK.rat.angebote; i++) {
      const a = angebotAus(ev, i);
      if (a) out.push(ratAntwort(w, i, a));
    }
    out.push({ ...opt("abwarten", t("welle_e2.rat.opt.abwarten.label"), t("welle_e2.rat.opt.abwarten.beschr"), 0, () => t("welle_e2.rat.opt.abwarten.ausgang")), stelle: { art: "wissen" } });
    return out;
  },
  standard: (w) => ratStandard(w),
};

// ---------------------------------------------------------------------------
// Die Forschung wartet auf die Verwaltung

/** Knoten, die von der Sache her beginnen könnten, aber an der Verwaltung hängen. */
function anVerwaltung(w: World): KnotenSicht[] {
  return baumSicht(w).zweige.flatMap((z) => z.knoten).filter((k) => k.zustand === "moeglich" && k.hindernis === "verwaltung" && !k.wunder);
}

/** Monate, bis der Vorrat den Bedarf des günstigsten wartenden Knotens deckt, wenn die Vorhaben ohne Fortschritt ruhen (null: auch dann nie). */
export function monateBisForschung(w: World): number | null {
  const ks = anVerwaltung(w);
  if (!ks.length) return 0;
  const l = verwaltungsLage(w);
  const bedarf = Math.min(...ks.map((k) => verwaltungsBedarf(vorhabenDef(k.id)?.kosten.verwaltung ?? 0)));
  const netto = l.netto + l.frei;
  if (l.vorrat >= bedarf) return 0;
  if (netto <= 0) return null;
  return Math.ceil((bedarf - l.vorrat) / netto);
}

function verwaltungStandard(w: World): string {
  loyalitaetAendern(w, "wirtschaft", -FORSCHUNGSDRUCK.verwaltung.uebergangen, t("welle_e2.vw.grund"));
  return t("welle_e2.vw.standard", { d: FORSCHUNGSDRUCK.verwaltung.uebergangen });
}

const FORSCHUNG_VERWALTUNG: Vorlage = {
  id: "forschung_verwaltung",
  eigenerWurf: true,
  ohneZusatzplatz: true,
  szene: "parlament",
  frist: FORSCHUNGSDRUCK.verwaltung.frist,
  abkuehlung: FORSCHUNGSDRUCK.verwaltung.abkuehlung,
  chance: (w) => {
    if (!w.spiel || laufendImBaum(w) >= FORSCHUNGSDRUCK.rat.unterLaufend) return 0;
    return anVerwaltung(w).length >= FORSCHUNGSDRUCK.verwaltung.abKnoten && verwaltungsLage(w).ohne.length > 0 ? FORSCHUNGSDRUCK.verwaltung.chance : 0;
  },
  erzeuge: (w) => {
    const ks = anVerwaltung(w);
    const l = verwaltungsLage(w);
    if (!ks.length) return null;
    return { provinzen: [], staerke: 1, daten: { n: ks.length, knoten: ks[0]!.id, vorrat: Math.floor(l.vorrat), netto: l.netto, laufend: l.laufend, ohne: l.ohne.length, frei: l.frei } };
  },
  titel: (_, ev) => t("welle_e2.vw.titel", { n: Number(ev.daten?.n ?? 0) }),
  text: (w, ev) => {
    const d = { wer: anrede(figur(w, "wirtschaft")), n: Number(ev.daten?.n ?? 0), name: knotenName(String(ev.daten?.knoten ?? "")), vorrat: Number(ev.daten?.vorrat ?? 0), netto: Number(ev.daten?.netto ?? 0), laufend: Number(ev.daten?.laufend ?? 0), ohne: Number(ev.daten?.ohne ?? 0) };
    return [t("welle_e2.vw.text1", d), t("welle_e2.vw.text2", d)];
  },
  warum: (_, ev) => t("welle_e2.vw.warum", { n: Number(ev.daten?.n ?? 0) }),
  stelle: () => ({ art: "baustelle" }),
  optionen: (w) => {
    const l = verwaltungsLage(w);
    const monate = monateBisForschung(w);
    const ruhen = opt("ruhen", t("welle_e2.vw.opt.ruhen.label", { n: l.ohne.length }), t("welle_e2.vw.opt.ruhen.beschr"), 0, (ww) => {
      const lage = verwaltungsLage(ww);
      for (const x of lage.ohne) pausiere(ww, x.id, true);
      return t("welle_e2.vw.opt.ruhen.ausgang", { n: lage.ohne.length, frei: lage.frei });
    });
    const zeilen = [t("welle_e2.vw.opt.ruhen.frei", { frei: l.frei, netto: Math.round((l.netto + l.frei) * 10) / 10 })];
    zeilen.push(monate === null ? t("welle_e2.vw.opt.ruhen.nie") : t("welle_e2.vw.opt.ruhen.monate", { n: Math.max(1, monate) }));
    return [
      { ...ruhen, bedingungen: zeilen, stelle: { art: "baustelle" }, ...(l.ohne.length ? {} : { sperre: t("welle_e2.vw.opt.ruhen.keine") }) },
      { ...opt("abwarten", t("welle_e2.vw.opt.abwarten.label"), t("welle_e2.vw.opt.abwarten.beschr"), 0, () => t("welle_e2.vw.opt.abwarten.ausgang")), stelle: { art: "baustelle" } },
    ];
  },
  standard: (w) => verwaltungStandard(w),
};

// ---------------------------------------------------------------------------
// Große Ziele: eine Gelegenheit

/** Verfolgte Ziele, deren nächste Stufe jetzt versucht werden kann (Kapital zählt nicht) und deren Chance mindestens „aussichtsreich“ ist, noch nicht gemeldet. */
export function gelegenheiten(w: World): { ziel: string; stufe: number; chance: number }[] {
  if (!w.spiel) return [];
  const g = grosseZiele(w);
  const gemeldet = g.gelegenheit ?? {};
  const out: { ziel: string; stufe: number; chance: number }[] = [];
  for (const id of g.verfolgt) {
    const st = g.stand[id];
    if (!st || gemeldet[id] === st.stufe) continue;
    if (!versuchbar(w, id)) continue;
    const c = chanceVon(w, id);
    if (!c || !FORSCHUNGSDRUCK.gelegenheit.ab.includes(c.wort)) continue;
    out.push({ ziel: id, stufe: st.stufe, chance: c.chance });
  }
  return out.sort((a, b) => b.chance - a.chance || a.ziel.localeCompare(b.ziel));
}

/** Versuchbar bis auf das Kapital: verfolgt, keine Sperrfrist, Schwelle erfüllt (dieselben Prüfungen wie `versuchGrund` in sim/grosseziele.ts). */
export function versuchbar(w: World, id: string): boolean {
  const g = grosseZiele(w);
  const st = g.stand[id];
  const s = zielDef(id)?.stufen[st?.stufe ?? 0];
  if (!s || !g.verfolgt.includes(id)) return false;
  if ((st?.sperreBis ?? -1) > w.day) return false;
  return schwelleSicht(w, s).every((x) => x.erfuellt);
}

/** Der beste Weg zur Vorbereitung, der gerade geht (Gipfel, Fonds, Kampagne); sonst der Gipfel mit seinem Grund. */
function besterWeg(w: World, id: string): WegId {
  return (["gipfel", "fonds", "kampagne"] as WegId[]).find((x) => !wegGrund(w, id, x)) ?? "gipfel";
}

/** Was eine Stufe bei Erfolg bewirkt, als Zeilen aus den Daten (dieselben Effekte, die `versuche` bucht). */
function erfolgZeilen(id: string, stufe: number): string[] {
  const s = zielDef(id)?.stufen[stufe];
  if (!s) return [];
  return s.erfolg.map((e) => {
    const d = `${e.d > 0 ? "+" : "−"}${nf(Math.abs(e.d), 0)}`;
    if (e.art === "knoten") return `${NET.nodes[NET.index.get(e.id) ?? -1]?.name ?? e.id} ${d}`;
    return t("welle_e2.gz.landEffekt", { dim: t(`n6.dim.${e.dim}`), d, n: e.laender.length });
  });
}

function gelegenheitStandard(w: World, ev: OffenesEreignis): string {
  const id = String(ev.daten?.ziel ?? "");
  const z = zielDef(id);
  const st = grosseZiele(w).stand[id];
  // Was wirklich verfliegt (nie unter null): Diese Zahl steht im Text
  const p = Math.min(FORSCHUNGSDRUCK.gelegenheit.verfliegt, st?.vorbereitung ?? 0);
  if (st) st.vorbereitung -= p;
  for (const l of z?.partner ?? []) if (istHauptakteur(l)) landAendern(w, l, { vertrauen: FORSCHUNGSDRUCK.gelegenheit.vertrauen }, t("welle_e2.gz.notiz"));
  return t(p > 0 ? "welle_e2.gz.standard" : "welle_e2.gz.standardOhne", { ziel: t(`gz2.ziel.${id}.titel`), v: Math.abs(FORSCHUNGSDRUCK.gelegenheit.vertrauen), p });
}

const GROSSZIEL_GELEGENHEIT: Vorlage = {
  id: "grossziel_gelegenheit",
  eigenerWurf: true,
  ohneZusatzplatz: true,
  szene: "istanbul",
  frist: FORSCHUNGSDRUCK.gelegenheit.frist,
  abkuehlung: FORSCHUNGSDRUCK.gelegenheit.abkuehlung,
  chance: (w) => (gelegenheiten(w).length ? FORSCHUNGSDRUCK.gelegenheit.chance : 0),
  erzeuge: (w) => {
    const g = gelegenheiten(w)[0];
    return g ? { provinzen: [], staerke: 1, daten: { ziel: g.ziel, stufe: g.stufe } } : null;
  },
  // Einmal je Stufe: Wer die Gelegenheit gesehen hat, findet die Stufe danach unter den Fristen des Schreibtischs (ui/schreibtisch/briefing.ts)
  eroeffne: (w, ev) => {
    (grosseZiele(w).gelegenheit ??= {})[String(ev.daten?.ziel ?? "")] = Number(ev.daten?.stufe ?? 0);
  },
  titel: (_, ev) => {
    const id = String(ev.daten?.ziel ?? "");
    const s = zielDef(id)?.stufen[Number(ev.daten?.stufe ?? 0)];
    return t("welle_e2.gz.titel", { stufe: s ? t(`gz2.ziel.${id}.${s.id}`) : "" });
  },
  text: (w, ev) => {
    const id = String(ev.daten?.ziel ?? "");
    const s = zielDef(id)?.stufen[Number(ev.daten?.stufe ?? 0)];
    const c = chanceVon(w, id);
    const p = { wer: anrede(figur(w, "stab")), ziel: t(`gz2.ziel.${id}.titel`), stufe: s ? t(`gz2.ziel.${id}.${s.id}`) : "", wort: c ? t(`gz2.wort.${c.wort}`) : "", von: c?.von ?? 0, bis: c?.bis ?? 0 };
    const gruende = c ? [c.dafuer.length ? t("welle_e2.gz.dafuer", { liste: c.dafuer.join(", ") }) : "", c.dagegen.length ? t("welle_e2.gz.dagegen", { liste: c.dagegen.join(", ") }) : ""].filter(Boolean).join(" ") : "";
    return [t("welle_e2.gz.text1", p), gruende || t("welle_e2.gz.text2")];
  },
  warum: () => t("welle_e2.gz.warum"),
  stelle: (_, ev) => ({ art: "grossziel", ziel: String(ev.daten?.ziel ?? "") }),
  optionen: (w, ev) => {
    const id = String(ev.daten?.ziel ?? "");
    const st = grosseZiele(w).stand[id];
    const s = zielDef(id)?.stufen[st?.stufe ?? 0];
    const c = chanceVon(w, id);
    const stelle = { art: "grossziel" as const, ziel: id };
    if (!s || !c) return [{ ...opt("spaeter", t("welle_e2.gz.opt.spaeter.label"), t("welle_e2.gz.opt.spaeter.beschr"), 0, () => t("welle_e2.gz.opt.spaeter.ausgang")), stelle }];
    // Jetzt wagen: derselbe Versuch wie in der Ansicht; das Ergebnis würfelt erst die echte Antwort, die Vorschau nennt nur die drei Ausgänge
    const wagenGrund = versuchGrund(w, id);
    const erfolg = erfolgZeilen(id, st?.stufe ?? 0);
    const wagen: Option = {
      ...opt("wagen", t("welle_e2.gz.opt.wagen.label"), t("welle_e2.gz.opt.wagen.beschr"), 0, (ww) => versuche(ww, id).text),
      anzeigePk: s.pk,
      aufmerksamkeit: s.aufmerksamkeit,
      bedingungen: [t("welle_e2.gz.opt.wagen.chance", { wort: t(`gz2.wort.${c.wort}`), von: c.von, bis: c.bis })],
      sofortfolgen: [
        t("welle_e2.gz.opt.wagen.erfolg", { liste: erfolg.join(" · ") }),
        t("welle_e2.gz.opt.wagen.teil"),
        t("welle_e2.gz.opt.wagen.scheitern", { tage: GROSSE_ZIELE.sperreTage, ansehen: nf(Math.abs(GROSSE_ZIELE.ansehenScheitern), 0) }),
      ],
      stelle,
      ...(wagenGrund ? { sperre: wagenGrund } : {}),
    };
    // Erst vorbereiten: der beste Weg, der gerade geht (Gipfel, Fonds, Kampagne), mit seinem Preis aus WEGE
    const weg = besterWeg(w, id);
    const wg = wegGrund(w, id, weg);
    const vorbereiten: Option = {
      ...opt("vorbereiten", t(`welle_e2.gz.opt.vorbereiten.${weg}`), t("welle_e2.gz.opt.vorbereiten.beschr"), 0, (ww) => geheWeg(ww, id, weg).text),
      anzeigePk: WEGE[weg].pk,
      aufmerksamkeit: WEGE[weg].aufmerksamkeit,
      bedingungen: [t("welle_e2.gz.opt.vorbereiten.plus", { plus: WEGE[weg].vorbereitung, max: GROSSE_ZIELE.vorbereitungMax })],
      stelle,
      ...(wg ? { sperre: wg } : {}),
    };
    const spaeter: Option = { ...opt("spaeter", t("welle_e2.gz.opt.spaeter.label"), t("welle_e2.gz.opt.spaeter.beschr"), 0, () => t("welle_e2.gz.opt.spaeter.ausgang")), stelle };
    return [wagen, vorbereiten, spaeter];
  },
  standard: (w, ev) => gelegenheitStandard(w, ev),
};

/**
 * Für Menüpunkt und Alarm: was im Bereich Forschung & Ziele gerade Handeln verlangt. Ein Versuch, der aussichtsreich ist (auch schon gemeldet),
 * und die stehende Forschung (kein Vorhaben läuft, aber eines könnte beginnen oder wartet nur auf die Verwaltung).
 */
export interface ForschungsAnliegen {
  versuche: { ziel: string; wort: string }[];
  /** Forschung steht: so viele Knoten könnten beginnen (0, wenn etwas läuft) */
  startbar: number;
  /** Forschung steht, und alles wartet auf die Verwaltung: so viele Knoten */
  anVerwaltung: number;
}

let anliegenGemerkt: { schluessel: string; wert: ForschungsAnliegen } | null = null;

export function forschungsAnliegen(w: World): ForschungsAnliegen {
  if (!w.spiel || w.spiel.ende) return { versuche: [], startbar: 0, anVerwaltung: 0 };
  // Die Kopfleiste fragt bei jedem Zeichnen: einmal je Tag, Kapital, Baustelle und Zielstand rechnen
  const sp = w.spiel;
  const schluessel = `${w.seed}|${w.day}|${Math.floor(sp.kapital)}|${reichZustand(w).laufend.map((l) => `${l.id}${l.pausiert ? "p" : ""}`).join(",")}|${Math.floor(reichZustand(w).verwaltung)}|${JSON.stringify(sp.grosseZiele ?? {})}`;
  if (anliegenGemerkt?.schluessel === schluessel) return anliegenGemerkt.wert;
  const wert = anliegenRechnen(w);
  anliegenGemerkt = { schluessel, wert };
  return wert;
}

function anliegenRechnen(w: World): ForschungsAnliegen {
  const g = grosseZiele(w);
  const versuche: ForschungsAnliegen["versuche"] = [];
  for (const id of g.verfolgt) {
    if (!versuchbar(w, id)) continue;
    const c = chanceVon(w, id);
    if (c && FORSCHUNGSDRUCK.gelegenheit.ab.includes(c.wort)) versuche.push({ ziel: id, wort: c.wort });
  }
  const steht = laufendImBaum(w) === 0;
  const frei = steht ? startbar(w).filter((k) => !k.grund).length : 0;
  return { versuche, startbar: frei, anVerwaltung: steht && !frei ? anVerwaltung(w).length : 0 };
}

/** Kapital reicht für den Versuch? (Für die Zeile unter den Fristen.) */
export const versuchBezahlbar = (w: World, id: string): boolean => kannZahlen(w.spiel?.kapital ?? 0, zielDef(id)?.stufen[grosseZiele(w).stand[id]?.stufe ?? 0]?.pk ?? 0);

export const FORSCHUNG_VORLAGEN: Vorlage[] = [FORSCHUNGSRAT, FORSCHUNG_VERWALTUNG, GROSSZIEL_GELEGENHEIT];
