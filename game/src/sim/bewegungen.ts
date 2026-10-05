// Bewegungen auf der Straße (Fork GESELLSCHAFT, 05.10.2026; Prüfbericht 4: „Proteste verpuffen, Repression ist billig“).
//
// Eine Bewegung hat Größe, Radikalität, Märtyrer und einen Ort. Sie entsteht aus Druck (Protestdruck, Teuerung, Groll eines Milieus,
// Streikneigung, Spannung um Geflüchtete), kündigt sich an (Vorwarnung), wächst, wird zur Massenbewegung oder klingt ab. Antworten:
// Dialog, Zugeständnis, Polizei, Verbot. Härte schrumpft sie kurz, macht sie radikaler und schafft Märtyrer, die Groll und neue
// Bewegungen nähren; Dialog und Zugeständnisse wirken langsamer und kosten das eigene Lager. Alle Zahlen sind Spielparameter.

import type { World } from "./types";
import type { Bewegung, BewegungsAntwort, BewegungsArt, GesellschaftZustand, MilieuId } from "./gesellschaft-typen";
import { NET } from "./modell";
import { wirke } from "./wirkung";
import { addLog } from "./log";
import { clamp } from "./economy";
import { kannZahlen } from "./kapital";
import { hashWert, verbrauche } from "./aufmerksamkeit";
import { marktSchock } from "./maerkte";
import { BORDER, PROVINZEN } from "./regional";
import { gesellschaftVon, grollAendern, knoten, kurdischeProvinzen, repressionBuchen } from "./gesellschaft";
import { t } from "../i18n";

export const BEWEGUNG = {
  maxAktiv: 3,
  /** Ab diesem Druck kann eine Bewegung entstehen (0 bis 100) */
  schwelle: 55,
  massen: 45,
  waechst: 20,
  aufloesung: 4,
  maertyrerVerfall: 0.95,
  abkuehlung: 30,
};

interface ArtDef {
  art: BewegungsArt;
  milieu?: MilieuId;
  /** Druck 0 bis 100 */
  druck: (w: World, g: GesellschaftZustand) => number;
  orte: (w: World) => number[];
  radikal: number;
  /** Gruppen, deren Laune mit der Bewegung sinkt oder steigt (Netz) */
  gruppen: string[];
  /** Wer sich durch Zugeständnisse übergangen fühlt */
  gegenlager: string[];
}

const STAEDTE = [34, 6, 35];
const INDUSTRIE = [34, 16, 41];
const inflation = (w: World): number => w.published?.inflation?.value ?? w.economy.inflation;

export const ARTEN: ArtDef[] = [
  {
    art: "teuerung",
    druck: (w) => clamp(0.6 * knoten(w, "protestdruck") + 1.2 * Math.max(0, inflation(w) - 15) + 0.2 * (60 - knoten(w, "realeinkommen")), 0, 100),
    orte: () => STAEDTE,
    radikal: 15,
    gruppen: ["arbeitnehmer", "rentner", "arme"],
    gegenlager: ["unternehmer"],
  },
  {
    art: "studenten",
    druck: (w) => clamp(0.5 * (100 - knoten(w, "junge")) + 0.3 * (60 - knoten(w, "pressefreiheit")) + 0.3 * knoten(w, "protestdruck"), 0, 100),
    orte: () => STAEDTE,
    radikal: 20,
    gruppen: ["junge", "staedtische_saekulare"],
    gegenlager: ["konservative"],
  },
  {
    art: "kurden",
    milieu: "kurden",
    druck: (w, g) => clamp(0.9 * g.milieus.kurden.groll + 0.2 * knoten(w, "protestdruck"), 0, 100),
    orte: () => kurdischeProvinzen(4),
    radikal: 25,
    gruppen: ["minderheiten"],
    gegenlager: ["nationalisten"],
  },
  {
    art: "aleviten",
    milieu: "aleviten",
    druck: (w, g) => clamp(0.9 * g.milieus.aleviten.groll + 0.15 * knoten(w, "protestdruck"), 0, 100),
    orte: () => STAEDTE,
    radikal: 12,
    gruppen: ["minderheiten", "staedtische_saekulare"],
    gegenlager: ["konservative"],
  },
  {
    art: "frauen",
    milieu: "frauen",
    druck: (w, g) => clamp(0.9 * g.milieus.frauen.groll + 0.15 * knoten(w, "protestdruck"), 0, 100),
    orte: () => STAEDTE,
    radikal: 8,
    gruppen: ["staedtische_saekulare", "junge"],
    gegenlager: ["konservative"],
  },
  {
    art: "arbeiter",
    druck: (w) => clamp(0.8 * knoten(w, "streikneigung") + 0.2 * knoten(w, "protestdruck"), 0, 100),
    orte: () => INDUSTRIE,
    radikal: 15,
    gruppen: ["arbeitnehmer"],
    gegenlager: ["unternehmer"],
  },
  {
    art: "nationalisten",
    milieu: "gefluechtete",
    druck: (w) => clamp(0.5 * knoten(w, "gefluechtete") + 0.4 * (100 - knoten(w, "nationalisten")) + 0.2 * (60 - knoten(w, "m_integration")), 0, 100),
    orte: () => [34, ...[...BORDER].slice(0, 2)],
    radikal: 30,
    gruppen: ["nationalisten"],
    gegenlager: ["minderheiten"],
  },
  {
    art: "opposition",
    druck: (w, g) => clamp(0.6 * g.opposition.staerke + 0.4 * g.repression, 0, 100),
    orte: () => STAEDTE,
    radikal: 15,
    gruppen: ["staedtische_saekulare"],
    gegenlager: ["konservative", "nationalisten"],
  },
];

export const artDef = (a: BewegungsArt): ArtDef => ARTEN.find((d) => d.art === a)!;

function hinweis(w: World, art: string, b: Bewegung, titel: string, text: string): void {
  w.spiel?.hinweise.push({ id: `gesellschaft-${art}-${b.id}-${w.day}`, titel, text: [text], szene: "istanbul" });
}

const ortName = (provinzen: number[]): string => provinzen.map((p) => PROVINZEN[p - 1]?.name ?? String(p)).slice(0, 3).join(", ");

/** Eine Bewegung beginnen (auch von außen, etwa die Großdemonstration der Opposition). */
export function starteBewegung(w: World, art: BewegungsArt, provinzen: number[], groesse: number): Bewegung | null {
  const g = gesellschaftVon(w);
  const vorhanden = g.bewegungen.find((b) => b.art === art);
  if (vorhanden) {
    vorhanden.groesse = clamp(vorhanden.groesse + groesse / 2, 0, 100);
    return vorhanden;
  }
  if (g.bewegungen.length >= BEWEGUNG.maxAktiv) return null;
  const d = artDef(art);
  const b: Bewegung = {
    id: `${art}-${w.day}`,
    art,
    provinzen,
    groesse: clamp(groesse, 0, 100),
    radikalitaet: d.radikal,
    maertyrer: 0,
    seit: w.day,
    phase: "keimt",
    vorher: 0,
  };
  g.bewegungen.push(b);
  hinweis(w, "warn", b, t("ges.bew.warn.titel", { art: t(`ges.bew.art.${art}`) }), t("ges.bew.warn.text", { art: t(`ges.bew.art.${art}`), orte: ortName(provinzen) }));
  addLog(w, "ereignis", t("ges.bew.warn.titel", { art: t(`ges.bew.art.${art}`) }), t("ges.bew.warn.warum"));
  return b;
}

function aufloesen(w: World, g: GesellschaftZustand, b: Bewegung, ende: BewegungsAntwort | "abgeklungen"): void {
  g.bewegungen = g.bewegungen.filter((x) => x !== b);
  g.frueher.push({ art: b.art, von: datumVon(w, b.seit), bis: w.date, spitze: Math.round(Math.max(b.groesse, b.vorher)), ende });
  if (g.frueher.length > 30) g.frueher.splice(0, g.frueher.length - 30);
  addLog(w, "ereignis", t("ges.bew.aufgeloest", { art: t(`ges.bew.art.${b.art}`) }));
}

function datumVon(w: World, tag: number): string {
  const d = new Date(Date.parse(w.date + "T00:00:00Z") - (w.day - tag) * 86_400_000);
  return d.toISOString().slice(0, 10);
}

/** Monatlich: neue Bewegungen aus Druck, Wachstum und Schrumpfen, Phasen, Rückwirkung auf Netz und Märkte. */
export function bewegungenMonat(w: World, g: GesellschaftZustand): void {
  // 1. Entstehung
  for (const d of ARTEN) {
    if (d.art === "opposition") continue;
    if (g.bewegungen.some((b) => b.art === d.art) || g.bewegungen.length >= BEWEGUNG.maxAktiv) continue;
    const druck = d.druck(w, g);
    if (druck <= BEWEGUNG.schwelle) continue;
    const p = (druck - BEWEGUNG.schwelle) / 60;
    if (hashWert(`${w.seed}|bew|${d.art}|${w.date.slice(0, 7)}`) < p) starteBewegung(w, d.art, d.orte(w), 8 + 0.4 * (druck - BEWEGUNG.schwelle));
  }
  // 2. Entwicklung
  for (const b of [...g.bewegungen]) {
    const d = artDef(b.art);
    const druck = d.druck(w, g);
    const kuerzlichDialog = b.letzte && (b.letzte.antwort === "dialog" || b.letzte.antwort === "zugestaendnis") && w.day - b.letzte.tag < 90;
    const vorher = b.groesse;
    b.groesse = clamp(b.groesse + 0.3 * (druck - 50) + 0.15 * b.maertyrer - (kuerzlichDialog ? 3 : 0) - 0.5, 0, 100);
    b.radikalitaet = clamp(b.radikalitaet - 1 + 0.05 * b.maertyrer, 0, 100);
    b.maertyrer = clamp(b.maertyrer * BEWEGUNG.maertyrerVerfall, 0, 100);
    if (d.milieu && b.maertyrer > 10) grollAendern(w, d.milieu, 0.05 * b.maertyrer);
    b.vorher = vorher;
    const alt = b.phase;
    b.phase = b.groesse >= BEWEGUNG.massen ? "massen" : b.groesse < vorher - 1 ? "abklingend" : b.groesse >= BEWEGUNG.waechst ? "waechst" : b.phase === "keimt" ? "keimt" : "abklingend";
    if (b.phase === "massen" && alt !== "massen") {
      marktSchock(w, "notstand", 0.3);
      hinweis(w, "massen", b, t("ges.bew.massen.titel", { art: t(`ges.bew.art.${b.art}`) }), t("ges.bew.massen.text", { orte: ortName(b.provinzen) }));
    }
    // Rückwirkung (Netz, in den Orten der Bewegung)
    if (NET.index.has("protestdruck")) wirke(w, "protestdruck", 0.03 * b.groesse, b.provinzen);
    wirke(w, "polarisierung", 0.01 * b.radikalitaet);
    wirke(w, "vertrauen_regierung", -0.005 * b.groesse);
    for (const gr of d.gruppen) wirke(w, gr, -0.004 * b.groesse, b.provinzen);
    if (b.phase === "massen" && NET.index.has("tourismus")) wirke(w, "tourismus", -0.3, b.provinzen);
    if (b.radikalitaet > 70) wirke(w, "terrorgefahr", 0.4, b.provinzen);
    if (b.groesse < BEWEGUNG.aufloesung) aufloesen(w, g, b, "abgeklungen");
  }
}

// ---------------------------------------------------------------------------
// Antworten des Spielers

interface AntwortDef {
  kapital: number;
  aufmerksamkeit: number;
  groesse: number;
  radikal: number;
  maertyrer: number;
  groll: number;
  repression: number;
  folgen: string[];
}

export const ANTWORTEN: Record<BewegungsAntwort, AntwortDef> = {
  dialog: { kapital: 2, aufmerksamkeit: 5, groesse: -6, radikal: -12, maertyrer: 0, groll: -4, repression: -2, folgen: ["dialog_langsam", "radikal_runter", "lager_leicht"] },
  zugestaendnis: { kapital: 5, aufmerksamkeit: 6, groesse: -25, radikal: -5, maertyrer: 0, groll: -10, repression: -3, folgen: ["groesse_stark_runter", "groll_runter", "gegenlager"] },
  polizei: { kapital: 2, aufmerksamkeit: 4, groesse: -15, radikal: 12, maertyrer: 8, groll: 3, repression: 5, folgen: ["groesse_kurz_runter", "radikal_rauf", "maertyrer", "ansehen_runter"] },
  verbot: { kapital: 4, aufmerksamkeit: 5, groesse: -30, radikal: 22, maertyrer: 15, groll: 6, repression: 10, folgen: ["groesse_stark_kurz", "radikal_stark", "maertyrer", "legitimitaet_runter", "markt"] },
};

export interface BewegungsSicht {
  b: Bewegung;
  druck: number;
  antworten: { id: BewegungsAntwort; kapital: number; aufmerksamkeit: number; moeglich: boolean; grund?: string; folgen: string[]; vorschau: { groesse: number; radikal: number; maertyrer: number } }[];
}

export function bewegungenSicht(w: World): BewegungsSicht[] {
  const g = gesellschaftVon(w);
  const kap = w.spiel?.kapital ?? 0;
  return g.bewegungen.map((b) => ({
    b,
    druck: Math.round(artDef(b.art).druck(w, g)),
    antworten: (Object.keys(ANTWORTEN) as BewegungsAntwort[]).map((id) => {
      const a = ANTWORTEN[id];
      let grund: string | undefined;
      if (b.letzte && w.day - b.letzte.tag < BEWEGUNG.abkuehlung) grund = t("ges.grund.abkuehlung", { tage: BEWEGUNG.abkuehlung - (w.day - b.letzte.tag) });
      else if (!kannZahlen(kap, a.kapital)) grund = t("ges.grund.kapital", { kapital: a.kapital });
      return {
        id,
        kapital: a.kapital,
        aufmerksamkeit: a.aufmerksamkeit,
        moeglich: !grund,
        ...(grund ? { grund } : {}),
        folgen: a.folgen.map((f) => t(`ges.bew.folge.${f}`)),
        vorschau: {
          groesse: Math.round(clamp(b.groesse + a.groesse, 0, 100)),
          radikal: Math.round(clamp(b.radikalitaet + a.radikal, 0, 100)),
          maertyrer: Math.round(clamp(b.maertyrer + a.maertyrer, 0, 100)),
        },
      };
    }),
  }));
}

export function bewegungAntworten(w: World, id: string, antwort: BewegungsAntwort): { ok: boolean; text: string } {
  const sp = w.spiel;
  if (!sp) return { ok: false, text: "" };
  const g = gesellschaftVon(w);
  const b = g.bewegungen.find((x) => x.id === id);
  if (!b) return { ok: false, text: t("ges.bew.unbekannt") };
  const s = bewegungenSicht(w).find((x) => x.b === b)!.antworten.find((a) => a.id === antwort)!;
  if (!s.moeglich) return { ok: false, text: s.grund ?? "" };
  const a = ANTWORTEN[antwort];
  const d = artDef(b.art);
  sp.kapital -= a.kapital;
  verbrauche(w, a.aufmerksamkeit, `Bewegung: ${antwort}`);
  b.groesse = clamp(b.groesse + a.groesse, 0, 100);
  b.radikalitaet = clamp(b.radikalitaet + a.radikal, 0, 100);
  let maertyrer = a.maertyrer;
  // Bei harten Einsätzen kann es Verletzte und Tote geben: der Märtyrer-Wert springt (Spielparameter)
  const opfer = (antwort === "polizei" || antwort === "verbot") && hashWert(`${w.seed}|opfer|${b.id}|${w.day}`) < 0.3;
  if (opfer) maertyrer += 12;
  b.maertyrer = clamp(b.maertyrer + maertyrer, 0, 100);
  if (d.milieu) grollAendern(w, d.milieu, a.groll);
  repressionBuchen(w, a.repression);
  b.letzte = { antwort, tag: w.day };
  switch (antwort) {
    case "dialog":
      wirke(w, "polarisierung", -0.5);
      for (const gl of d.gegenlager) wirke(w, gl, -0.4);
      break;
    case "zugestaendnis":
      for (const gr of d.gruppen) wirke(w, gr, 1.2, b.provinzen);
      for (const gl of d.gegenlager) wirke(w, gl, -1);
      break;
    case "polizei":
      wirke(w, "ansehen", -1.5);
      wirke(w, "beziehungen_eu", -1);
      for (const gl of d.gegenlager) wirke(w, gl, 0.5);
      break;
    case "verbot":
      wirke(w, "legitimitaet", -2);
      wirke(w, "ansehen", -2.5);
      wirke(w, "beziehungen_eu", -1.5);
      marktSchock(w, "notstand", 0.5);
      for (const gl of d.gegenlager) wirke(w, gl, 0.8);
      break;
  }
  const text = t(`ges.bew.ergebnis.${antwort}`, { art: t(`ges.bew.art.${b.art}`) }) + (opfer ? " " + t("ges.bew.opfer") : "");
  addLog(w, "entscheidung", text, t("ges.log.kapital", { kapital: a.kapital }));
  if (b.groesse < BEWEGUNG.aufloesung) aufloesen(w, g, b, antwort);
  return { ok: true, text };
}

/** Für die Karte (Fork ANIM): Orte der laufenden Bewegungen mit Art, Größe, Phase und Text. */
export function bewegungsOrte(w: World): { id: string; plaka: number; art: BewegungsArt; groesse: number; phase: Bewegung["phase"]; text: string }[] {
  if (!w.spiel) return [];
  const g = gesellschaftVon(w);
  return g.bewegungen.flatMap((b) =>
    b.provinzen.map((plaka) => ({
      id: `${b.id}|${plaka}`,
      plaka,
      art: b.art,
      groesse: Math.round(b.groesse),
      phase: b.phase,
      text: t("ges.bew.karte", { art: t(`ges.bew.art.${b.art}`), groesse: Math.round(b.groesse), phase: t(`ges.bew.phase.${b.phase}`) }),
    })),
  );
}
