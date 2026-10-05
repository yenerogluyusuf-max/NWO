// Der Haushalt als Entscheidung, wie in Democracy: ein Regler je Ressort (Renten, Bildung, Forschung, Verteidigung …) plus die drei großen
// Steuern. Jede Stufe kostet sofort Geld (Ausgabenimpuls → Nachfrage, Defizit, Schulden, Inflation) und wirkt mit Verzug über die Politikfelder
// des Netzes: Bildung braucht Jahre, bis Fachkräfte da sind, Infrastruktur und Rüstung brauchen Bau und Beschaffung. Mehr bringt immer weniger
// (abnehmender Ertrag), Kürzungen wirken voll. Forschung wirkt nur bis zur Innovationsgrenze voll, die die Bildung hebt (sim/wissensbasis.ts).
// Startanteile und Spannen: data/haushaltsplan.ts (RESSORTS_2026, abgeleitet oder als Spielparameter gekennzeichnet).
//
// WIR-3 (Haushalts-Zyklus mit Parallelität, Suzerain-Vorbild aus VERBESSERUNGSPLAN_2026-09-30):
//   - Die Regler bleiben jederzeit sichtbar; nur im Haushaltsfenster (Oktober, vier Wochen) sind Änderungen
//     kostenlos — sie gehen als Entwurf in ein einziges Haushaltsgesetz, das durchs Parlament muss.
//   - Außerhalb des Fensters ist jede Änderung ein „Nachtragshaushalt": doppelte Kapitalkosten und ein
//     kleiner Legitimitäts-Abzug, ehrlich so bezeichnet.
//   - Scheitert das Gesetz, läuft der Vorjahrshaushalt weiter; die Posten stehen in Prozent der
//     Wirtschaftsleistung und gleichen die Inflation damit automatisch aus (Legitimität leidet trotzdem).

import type { World } from "./types";
import type { Rng } from "./rng";
import { addLog, fmt } from "./log";
import { addDays, dayOfMonth, monthNumber } from "./dates";
import { clamp } from "./economy";
import { kannZahlen } from "./kapital";
import { wirke } from "./wirkung";
import { NET } from "./modell";
import { impulsKette, istGut, kettenZeile } from "./folgen";
import { ALTE_POSTEN, addMarke, defizitJetzt, haushaltZustand } from "./wirtschaft";
import { REGELN, STIMMEN_PUFFER, stimmenSicht } from "./handeln";
import { bildungsUeberhang, innovationsGrenze, wirksameForschung, WISSEN } from "./wissensbasis";
import { ministerFuer, stabilerWert } from "./ministerfluss-kern";
import type { Amt } from "./ministerfluss-typen";
import { PLAN_2026, RENTE_START, RESSORT_NACH_ID, ZINSSATZ_START } from "../data/haushaltsplan";
import { stuetze } from "../data/reich/bau";
import { t } from "../i18n";

export interface Ergebnis {
  ok: boolean;
  text: string;
  why?: string;
}

/** Eine Wirkung auf eine Größe des Netzes je Reglerstufe. */
export interface NetzWirkung {
  id: string;
  d: number;
}

export type PostenGruppe = "renten" | "soziales" | "dienste" | "sicherheit" | "wirtschaft" | "staat" | "steuern";

export interface PostenDef {
  id: string;
  name: string;
  seite: "ausgabe" | "einnahme";
  gruppe: PostenGruppe;
  text: string;
  /** Prozent des BIP je Stufe (bei Steuern: Mehreinnahmen; negativ, wenn eine höhere Stufe spart) */
  schritt: number;
  /** Spanne des Reglers in Stufen */
  min: number;
  max: number;
  /** Etat beim Start in % des BIP (nur Ressorts) */
  startBip?: number;
  /** Monate, bis eine Änderung voll wirkt */
  reifeMonate: number;
  /** Wer das Ressort im Kabinett vertritt */
  amt: Amt;
  /** In welche Richtung eine Änderung politisch teuer ist (+1: mehr, −1: weniger) */
  unbeliebt: 1 | -1;
  /** Zeile des Haushaltsplans 2026, die der Posten trifft */
  plan?: string;
  /** Einmalig je Stufe bei der Änderung (Stimmung der Gruppen) */
  sofort: NetzWirkung[];
  /** Jeden Monat je wirksamer Stufe: verschiebt das Gleichgewicht der Größen dauerhaft */
  dauer: NetzWirkung[];
  gewinner: string;
  verlierer: string;
  kehrseite: string;
  /** Kurze Wirkungszeile je Stufe nach oben („Fachkräfte steigen in etwa drei Jahren“) */
  wirkung: string;
  beleg?: string;
}

const s = (id: string, verschiebung: number): NetzWirkung => {
  const e = stuetze(id, verschiebung) as { id: string; d: number };
  return { id: e.id, d: e.d };
};
const st = (id: string, d: number): NetzWirkung => ({ id, d });

type Roh = Omit<PostenDef, "name" | "text" | "gewinner" | "verlierer" | "kehrseite" | "wirkung" | "schritt" | "min" | "max" | "reifeMonate"> & Partial<Pick<PostenDef, "schritt" | "min" | "max" | "reifeMonate">>;

/** Texte kommen aus dem Katalog (haushalt.posten.<id>.*); Spannen und Startanteile aus den Ressortdaten. */
function posten(r: Roh): PostenDef {
  const d = RESSORT_NACH_ID[r.id];
  const def = {
    ...r,
    schritt: d?.schritt ?? r.schritt ?? 0.3,
    min: d?.min ?? r.min ?? -4,
    max: d?.max ?? r.max ?? 4,
    reifeMonate: d?.reifeMonate ?? r.reifeMonate ?? 1,
    ...(d && d.id !== "rentenalter" ? { startBip: d.startBip } : {}),
    ...(d ? { beleg: d.beleg } : {}),
  } as PostenDef;
  for (const k of ["name", "text", "gewinner", "verlierer", "kehrseite", "wirkung"] as const) {
    Object.defineProperty(def, k, { get: () => t(`haushalt.posten.${r.id}.${k}`), enumerable: true });
  }
  return def;
}

export const POSTEN: PostenDef[] = [
  posten({ id: "rentenniveau", seite: "ausgabe", gruppe: "renten", amt: "stab", unbeliebt: -1, plan: "uebertragungen",
    sofort: [st("rentner", 2), st("arbeitnehmer", 0.3)], dauer: [s("rentenniveau", 1.2), s("armut", -0.6), s("sozialkassen", 0.8)] }),
  posten({ id: "rentenalter", seite: "ausgabe", gruppe: "renten", amt: "stab", unbeliebt: 1, plan: "uebertragungen",
    sofort: [st("rentner", -1.5), st("arbeitnehmer", -2)], dauer: [s("sozialkassen", 0.8), s("fachkraefte", 0.3), s("jugendarbeitslosigkeit", 0.3)] }),
  posten({ id: "sozialhilfe", seite: "ausgabe", gruppe: "soziales", amt: "stab", unbeliebt: -1, plan: "uebertragungen",
    sofort: [st("arme", 1.5), st("arbeitnehmer", 0.5)], dauer: [s("armut", -1), s("ungleichheit", -0.4), s("geburtenrate", 0.2), s("informelle_arbeit", 0.2)] }),
  posten({ id: "gesundheit", seite: "ausgabe", gruppe: "dienste", amt: "stab", unbeliebt: -1,
    sofort: [st("rentner", 0.5), st("arbeitnehmer", 0.5)], dauer: [s("gesundheitsversorgung", 1), s("wartezeiten", -1.2), s("aerzte", 0.4), s("lebenserwartung", 0.3)] }),
  posten({ id: "bildung", seite: "ausgabe", gruppe: "dienste", amt: "stab", unbeliebt: -1,
    sofort: [st("junge", 1)], dauer: [s("bildungsqualitaet", 0.8), s("schulabbruch", -0.5), s("hochschule", 0.4), s("fachkraefte", 0.4)] }),
  posten({ id: "forschung", seite: "ausgabe", gruppe: "dienste", amt: "wirtschaft", unbeliebt: -1,
    sofort: [st("junge", 0.3), st("unternehmer", 0.3)], dauer: [s("hochschule", 0.5), s("produktivitaet", 0.3), s("abwanderung", -0.4), s("modernisierung", 0.2)] }),
  posten({ id: "verteidigung", seite: "ausgabe", gruppe: "sicherheit", amt: "generalstab", unbeliebt: -1,
    sofort: [st("konservative", 1), st("nationalisten", 1)], dauer: [s("militaer", 0.8), s("abschreckung", 0.6), s("bereitschaft_heer", 0.4), s("modernisierung", 0.3), s("ruestungsautarkie", 0.2), s("beziehungen_eu", -0.1)] }),
  posten({ id: "innere_sicherheit", seite: "ausgabe", gruppe: "sicherheit", amt: "inneres", unbeliebt: -1,
    sofort: [st("konservative", 0.5)], dauer: [s("kriminalitaet", -0.5), s("terrorgefahr", -0.4), s("pressefreiheit", -0.1)] }),
  posten({ id: "investitionen", seite: "ausgabe", gruppe: "wirtschaft", amt: "wirtschaft", unbeliebt: -1, plan: "investitionen",
    sofort: [st("unternehmer", 1)], dauer: [s("bauwirtschaft", 2), s("wachstum_regional", 0.6), s("verkehrsnetz", 0.8), s("produktivitaet", 0.4), s("stau", -0.3)] }),
  posten({ id: "wohnen", seite: "ausgabe", gruppe: "wirtschaft", amt: "wirtschaft", unbeliebt: -1,
    sofort: [st("junge", 0.5)], dauer: [s("wohnungsbau", 0.8), s("mieten", -0.6), s("erdbebenvorsorge", 0.3), s("bauwirtschaft", 0.3)] }),
  posten({ id: "landwirtschaft", seite: "ausgabe", gruppe: "wirtschaft", amt: "wirtschaft", unbeliebt: -1,
    sofort: [st("landwirte", 1.5)], dauer: [s("landwirtschaft_einkommen", 0.8), s("ernte", 0.3), s("landflucht", -0.3), s("lebensmittelpreise", -0.3)] }),
  posten({ id: "umwelt_energie", seite: "ausgabe", gruppe: "wirtschaft", amt: "wirtschaft", unbeliebt: -1,
    sofort: [st("junge", 0.3), st("staedtische_saekulare", 0.3)], dauer: [s("erneuerbare", 0.6), s("luftqualitaet", 0.4), s("klimaschutz", 0.6), s("stromversorgung", 0.2)] }),
  posten({ id: "kultur", seite: "ausgabe", gruppe: "staat", amt: "stab", unbeliebt: -1,
    sofort: [st("konservative", 0.3), st("staedtische_saekulare", 0.3)], dauer: [s("kulturerbe", 0.6), s("identitaet", 0.3), s("tourismus", 0.3)] }),
  posten({ id: "personal", seite: "ausgabe", gruppe: "staat", amt: "finanzen", unbeliebt: -1, plan: "personal",
    sofort: [st("beamte", 3)], dauer: [s("aerzte", 1), s("kostendruck", 0.4), s("korruption", -0.3)] }),
  posten({ id: "subventionen", seite: "ausgabe", gruppe: "staat", amt: "wirtschaft", unbeliebt: -1,
    sofort: [st("landwirte", 2), st("arbeitnehmer", 1)], dauer: [s("energiepreise", -2), s("lebensmittelpreise", -1.5), s("lebenshaltung", -1), s("landwirtschaft_einkommen", 1.5), s("klimaschutz", -0.4)] }),
  posten({ id: "einkommensteuer", seite: "einnahme", gruppe: "steuern", amt: "finanzen", schritt: 0.3, unbeliebt: 1, plan: "est",
    sofort: [st("arbeitnehmer", -3), st("unternehmer", -1)], dauer: [s("realeinkommen", -1.2), s("steuermoral", -0.6), s("schattenwirtschaft", 0.5), s("ungleichheit", -0.4)] }),
  posten({ id: "verbrauchsteuern", seite: "einnahme", gruppe: "steuern", amt: "finanzen", schritt: 0.3, unbeliebt: 1, plan: "mwst",
    sofort: [st("arbeitnehmer", -2), st("rentner", -2)], dauer: [s("lebenshaltung", 1.5), s("ungleichheit", 0.6), s("armut", 0.4), s("kostendruck", 0.3)] }),
  posten({ id: "unternehmensteuer", seite: "einnahme", gruppe: "steuern", amt: "finanzen", schritt: 0.3, unbeliebt: 1, plan: "kst",
    sofort: [st("unternehmer", -3)], dauer: [s("investitionen", -1), s("auslandskapital", -1.2), s("gruendungen", -0.5), s("ungleichheit", -0.3)] }),
];

/** Alte Kennungen (Bündel vor den Ressortetats) zeigen auf das Ressort, das ihren Kern trägt. */
export const POSTEN_ALIAS: Record<string, string> = { soziales: "sozialhilfe", gesundheit_bildung: "bildung", sicherheit: "verteidigung" };
for (const alt of Object.keys(ALTE_POSTEN)) POSTEN_ALIAS[alt] ??= Object.keys(ALTE_POSTEN[alt]!)[0]!;

/** Die gültige Kennung eines Postens (alte Bündel-Kennungen werden übersetzt). */
export const postenId = (id: string): string => POSTEN_ALIAS[id] ?? id;

export const POSTEN_NACH_ID: Record<string, PostenDef> = Object.fromEntries(POSTEN.map((p) => [p.id, p]));
for (const [alt, neu] of Object.entries(POSTEN_ALIAS)) POSTEN_NACH_ID[alt] = POSTEN_NACH_ID[neu]!;

/** Vorzeichen der Wirkung auf die Nachfrage: Ausgaben stützen, Steuern dämpfen. */
const vorzeichen = (p: PostenDef): 1 | -1 => (p.seite === "ausgabe" ? 1 : -1);

/** Eine Stufe in die Spanne des Postens bringen. */
export const inSpanne = (p: PostenDef, stufe: number): number => clamp(Math.round(stufe), p.min, p.max);

/** Die Stufe eines Postens (0 = Haushaltsgesetz 2026). */
export function stufeVon(w: World, id: string): number {
  return haushaltZustand(w).stufen[postenId(id)] ?? 0;
}

/** Wie weit die Stufe schon wirkt (nähert sich der Stufe über die Reifezeit). */
export function wirksamVon(w: World, id: string): number {
  const z = haushaltZustand(w);
  const k = postenId(id);
  return z.wirksam?.[k] ?? z.stufen[k] ?? 0;
}

/** Was die Regler zusammen am Impuls (in % des BIP) ausmachen; der Rest kommt aus Ereignissen, Programmen und Beschlüssen. */
export function impulsAusPosten(w: World): number {
  const z = haushaltZustand(w);
  let sum = 0;
  for (const p of POSTEN) sum += (z.stufen[p.id] ?? 0) * p.schritt * vorzeichen(p);
  return sum;
}

/** Wie viele Milliarden Lira eine Stufe ungefähr bedeutet (Größenordnung, abgeleitet; negativ, wenn die Stufe spart). */
export const mrdJeStufe = (p: PostenDef): number => Math.round(p.schritt * PLAN_2026.mrdProProzentBip);

/** Etat eines Ressorts in % des BIP bei einer Stufe (Steuern: undefined). */
export function etatBip(p: PostenDef, stufe: number): number | undefined {
  return p.startBip === undefined ? undefined : Math.max(0, p.startBip + stufe * p.schritt);
}

/** Renten wie in Democracy: Rentenniveau (% des Durchschnittslohns) und Renteneintrittsalter (Jahre) als eigene Stellgrößen. */
export function rentenSicht(w: World, niveauStufe = stufeVon(w, "rentenniveau"), alterStufe = stufeVon(w, "rentenalter")): { niveau: number; alter: number; etat: number } {
  const n = POSTEN_NACH_ID.rentenniveau!;
  const a = POSTEN_NACH_ID.rentenalter!;
  return {
    niveau: RENTE_START.niveauProzent + niveauStufe * RENTE_START.niveauJeStufe,
    alter: RENTE_START.alterJahre + alterStufe * RENTE_START.alterJeStufe,
    etat: Math.max(0, (n.startBip ?? 0) + niveauStufe * n.schritt + alterStufe * a.schritt) * demografieFaktor(w),
  };
}

/** Forschungsetat in % des BIP (beschlossen): für Wissensbaum und Güter. */
export function forschungsBudget(w: World): number {
  return etatBip(POSTEN_NACH_ID.forschung!, stufeVon(w, "forschung")) ?? 0;
}

/** Verteidigungsetat in % des BIP (beschlossen): für die Streitkräfte (Beschaffung, Unterhalt, neue Generationen). */
export function verteidigungsEtat(w: World): number {
  return etatBip(POSTEN_NACH_ID.verteidigung!, stufeVon(w, "verteidigung")) ?? 0;
}

/** Spielparameter: Alterung verteuert dasselbe Rentenniveau jedes Jahr ein wenig (zu prüfen: TÜİK-Bevölkerungsprojektion). */
export const DEMOGRAFIE = { jeJahr: 0.012, startJahr: 2026 };
export function demografieFaktor(w: World): number {
  const jahre = Math.max(0, Number(w.date.slice(0, 4)) + (monthNumber(w.date) - 1) / 12 - DEMOGRAFIE.startJahr);
  return 1 + DEMOGRAFIE.jeJahr * jahre;
}

/**
 * Abnehmender Ertrag: Die ersten zwei Stufen nach oben wirken voll, die nächsten vier halb, alles darüber zu einem Viertel.
 * Kürzungen wirken voll. Spielparameter.
 */
export function ertrag(stufe: number): number {
  if (stufe <= 2) return stufe;
  if (stufe <= 6) return 2 + (stufe - 2) * 0.5;
  return 4 + (stufe - 6) * 0.25;
}

/** Kapital, das eine Änderung um `delta` Stufen kostet: Schritte in die unbeliebte Richtung doppelt. */
export function kapitalKosten(p: PostenDef, delta: number): number {
  const schritte = Math.abs(delta);
  const unbeliebt = Math.sign(delta) === p.unbeliebt;
  return schritte * (unbeliebt ? 2 : 1);
}

export interface PostenVorschau {
  ok: boolean;
  grund?: string;
  delta: number;
  kapital: number;
  /** Defizit in % des BIP vor und nach der Änderung (sofort, ohne Folgewirkungen) */
  defizitVorher: number;
  defizitNachher: number;
  impuls: number;
  /** Dauerwirkungen als Zeilen mit Richtung (gut/schlecht aus Sicht des Landes) */
  zeilen: { text: string; richtung: 1 | -1; gut: boolean | null; nach: number }[];
  /** WIR-3: Wie der Haushalts-Zyklus diese Änderung einordnet (Entwurf kostenlos, Nachtrag teuer) */
  zyklus: { fensterOffen: boolean; modus: "entwurf" | "nachtrag"; faktor: number; hinweis: string };
}

/** Was eine Änderung des Postens sofort bedeutet; Folgewirkungen über zwölf Monate rechnet die Vorschau der Oberfläche. */
export function postenVorschau(w: World, id: string, stufe: number): PostenVorschau {
  const p = POSTEN_NACH_ID[id]!;
  const aktuell = stufeVon(w, id);
  const ziel = inSpanne(p, stufe);
  const delta = ziel - aktuell;
  const impuls = delta * p.schritt * vorzeichen(p);
  const fenster = haushaltsfenster(w);
  // WIR-3: Im offenen Fenster geht die Änderung kostenlos in den Entwurf; sonst Nachtrag zum doppelten Preis
  const faktor = fenster.offen ? 0 : HAUSHALT_ZYKLUS.nachtragFaktor;
  const kapital = kapitalKosten(p, delta) * faktor;
  const zyklus: PostenVorschau["zyklus"] = fenster.offen
    ? { fensterOffen: true, modus: "entwurf", faktor: 0, hinweis: t("haushalt.zyklus.hinweis.entwurf") }
    : { fensterOffen: false, modus: "nachtrag", faktor: HAUSHALT_ZYKLUS.nachtragFaktor, hinweis: t("haushalt.zyklus.hinweis.nachtrag", { jahr: fenster.naechsterStart.slice(0, 4) }) };
  const defizitVorher = defizitJetzt(w);
  const zeilen: PostenVorschau["zeilen"] = [];
  if (delta !== 0) {
    for (const e of [...p.sofort, ...p.dauer]) {
      const node = NET.nodes[NET.index.get(e.id) ?? -1];
      if (!node || !e.d) continue;
      const richtung = (Math.sign(e.d * delta) || 1) as 1 | -1;
      if (zeilen.some((z) => z.text === node.name)) continue;
      zeilen.push({ text: node.name, richtung, gut: gutFuer(node.id, richtung), nach: 0 });
    }
  }
  const spiel = w.spiel;
  const ok = !!spiel && delta !== 0 && kannZahlen(spiel.kapital, kapital);
  return {
    ok,
    ...(delta === 0 ? { grund: t("haushalt.grund.keine") } : !spiel ? { grund: t("haushalt.grund.ohne_spiel") } : !kannZahlen(spiel.kapital, kapital) ? { grund: t("haushalt.grund.kapital", { kosten: kapital, da: Math.floor(spiel.kapital) }) } : {}),
    delta,
    kapital,
    defizitVorher,
    // Mehr Ausgaben (positiver Impuls) vergrößern das Defizit, höhere Steuern (negativer Impuls) verkleinern es
    defizitNachher: defizitVorher + impuls,
    impuls,
    zeilen,
    zyklus,
  };
}

/** Ob die Bewegung einer Größe für das Land gut ist; Gruppen sind zufrieden, wenn ihr Wert steigt. */
function gutFuer(id: string, richtung: 1 | -1): boolean | null {
  return istGut(id, richtung);
}

function wende(w: World, p: PostenDef, delta: number): void {
  const e = w.economy;
  e.fiscalImpulse += delta * p.schritt * vorzeichen(p);
  for (const x of p.sofort) wirke(w, x.id, x.d * delta);
  // Der Minister des Ressorts merkt sich, ob sein Etat wächst oder schrumpft (Ausgaben; Spielparameter ±1 Loyalität je Beschluss)
  if (p.seite === "ausgabe" && w.spiel) {
    const f = ministerFuer(w, p.amt);
    if (f && f.amt === p.amt) f.loyalitaet = clamp(f.loyalitaet + Math.sign(delta * (p.schritt > 0 ? 1 : -1)), 0, 100);
  }
}

/** Was der zuständige Minister sich für sein Ressort wünscht (Stufe, deterministisch je Spiel; Spielparameter). */
export function ministerWunsch(w: World, id: string): number {
  const p = POSTEN_NACH_ID[id];
  if (!p || p.seite !== "ausgabe") return 0;
  if (p.id === "rentenalter") return 0;
  if (p.id === "personal") return -1; // das Finanzministerium will den eigenen Apparat schlanker
  const basis = p.amt === "generalstab" ? 2 : 1;
  return Math.min(p.max, basis + Math.floor(stabilerWert(w, `hh-wunsch|${p.id}`) * 3));
}

/** Einen Posten auf eine Stufe stellen (Nachtragshaushalt): kostet außerhalb des Fensters doppelt Kapital und etwas Legitimität, wirkt sofort auf die Stimmung und dauerhaft auf die Politikfelder. */
export function setzePosten(w: World, idRoh: string, stufe: number, ohneKosten = false): Ergebnis {
  const spiel = w.spiel;
  const id = postenId(idRoh);
  const p = POSTEN_NACH_ID[id];
  if (!spiel || !p) return { ok: false, text: t("haushalt.fehler.unbekannt") };
  const v = postenVorschau(w, id, stufe);
  if (v.delta === 0) return { ok: false, text: t("haushalt.fehler.gleich") };
  const z = haushaltZustand(w);
  // WIR-3: Im offenen Fenster (oder solange der Entwurf im Parlament liegt) läuft alles über das Haushaltsgesetz
  if (!ohneKosten && (v.zyklus.fensterOffen || z.gesetz)) {
    return {
      ok: false,
      text: z.gesetz ? t("haushalt.fehler.im_parlament") : t("haushalt.fehler.im_fenster"),
      why: t("haushalt.fehler.im_fenster_warum"),
    };
  }
  if (!ohneKosten && !kannZahlen(spiel.kapital, v.kapital)) return { ok: false, text: t("haushalt.grund.kapital", { kosten: v.kapital, da: Math.floor(spiel.kapital) }) };
  const ziel = inSpanne(p, stufe);
  if (!ohneKosten) {
    spiel.kapital -= v.kapital;
    // Nachtragshaushalt: kurzfristig wirksam, aber als Verfahrensverstoß sichtbar (Legitimität)
    wirke(w, "legitimitaet", HAUSHALT_ZYKLUS.nachtragLegitimitaet);
  }
  z.stufen[id] = ziel;
  if (ziel === 0) delete z.stufen[id];
  wende(w, p, v.delta);
  z.letzteAenderung = w.day;
  const text = t("haushalt.beschluss.nachtrag", { posten: p.name, richtung: richtungsWort(p, v.delta), mrd: Math.round(Math.abs(v.delta * mrdJeStufe(p))).toLocaleString("de-DE") });
  const folgen = [
    ...impulsKette(v.impuls).slice(0, 4).map(kettenZeile),
    ...v.zeilen.slice(0, 4).map((x) => `${x.text} ${x.richtung > 0 ? "▲" : "▼"} (${t("haushalt.dauerhaft")})`),
  ];
  z.aenderungen.push({ tag: w.day, datum: w.date, posten: p.name, text, folgen });
  if (z.aenderungen.length > 12) z.aenderungen.shift();
  const nachtrag = ohneKosten ? "" : ` ${t("haushalt.beschluss.nachtrag_kosten", { kosten: v.kapital })}`;
  addLog(w, "entscheidung", text, `${t("haushalt.beschluss.defizit", { vorher: fmt(v.defizitVorher), nachher: fmt(v.defizitNachher) })}${nachtrag} ${p.kehrseite}`);
  addMarke(w, "haushalt", text);
  return { ok: true, text, why: `${v.kapital ? `${t("haushalt.beschluss.kostet", { kosten: v.kapital })} ` : ""}${t("haushalt.beschluss.defizit", { vorher: fmt(v.defizitVorher), nachher: fmt(v.defizitNachher) })}` };
}

function richtungsWort(p: PostenDef, delta: number): string {
  const k = p.id === "rentenalter" ? (delta > 0 ? "angehoben" : "gesenkt") : delta > 0 ? (p.seite === "ausgabe" ? "erhoeht" : "angehoben") : p.seite === "ausgabe" ? "gekuerzt" : "gesenkt";
  return t(`haushalt.richtung.${k}`);
}

/** Ein einfacher Schritt für Sprachbefehle und die KI, wenn kein bestimmter Posten genannt wird: mehr ausgeben oder sparen. */
export function einfacherSchritt(w: World, art: "mehr" | "sparen"): { id: string; stufe: number } | null {
  const kandidaten = art === "mehr" ? ["investitionen", "sozialhilfe", "bildung", "gesundheit"] : ["personal", "subventionen", "verteidigung"];
  for (const id of kandidaten) {
    const p = POSTEN_NACH_ID[id]!;
    const ziel = stufeVon(w, id) + (art === "mehr" ? 1 : -1);
    if (ziel >= p.min && ziel <= p.max) return { id, stufe: ziel };
  }
  return null;
}

/** Pakete für das Haushaltsjahr: mehrere Regler auf einmal. */
export const PAKETE: Record<string, { readonly name: string; schritte: Record<string, number> }> = {
  konsolidieren: { get name() { return t("haushalt.paket.konsolidieren"); }, schritte: { personal: -1, subventionen: -1, einkommensteuer: 1 } },
  investieren: { get name() { return t("haushalt.paket.investieren"); }, schritte: { investitionen: 2 } },
  zukunft: { get name() { return t("haushalt.paket.zukunft"); }, schritte: { bildung: 3, forschung: 3, subventionen: -1 } },
  aufruestung: { get name() { return t("haushalt.paket.aufruestung"); }, schritte: { verteidigung: 4, verbrauchsteuern: 1 } },
};

/** Ein Paket des Haushaltsjahres anwenden (die Kosten trägt das Ereignis). */
export function wendePaketAn(w: World, id: string): void {
  const paket = PAKETE[id];
  if (!paket || !w.spiel) return;
  for (const [posten, delta] of Object.entries(paket.schritte)) {
    const p = POSTEN_NACH_ID[posten]!;
    const ziel = inSpanne(p, stufeVon(w, posten) + delta);
    if (ziel !== stufeVon(w, posten)) setzePosten(w, posten, ziel, true);
  }
}

/** Einmal im Monat: Reifung der Etats, Dauerwirkungen (abnehmender Ertrag, Innovationsgrenze), Abwanderung, Demografie und der Zinsdienst. */
export function haushaltMonat(w: World): void {
  if (!w.spiel) return;
  const z = haushaltZustand(w);
  const wirksam = (z.wirksam ??= {});
  for (const p of POSTEN) {
    const stufe = z.stufen[p.id] ?? 0;
    // Reifung: Die wirksame Stufe nähert sich der beschlossenen über die Reifezeit (Ausbildung, Bau, Beschaffung)
    const alt = wirksam[p.id] ?? 0;
    const neu = Math.abs(stufe - alt) < 0.02 ? stufe : alt + (stufe - alt) / Math.max(1, p.reifeMonate);
    if (neu === 0) delete wirksam[p.id];
    else wirksam[p.id] = neu;
    if (!neu) continue;
    let wirkt = ertrag(neu);
    if (p.id === "forschung") {
      // Forschung wirkt nur bis zur Innovationsgrenze voll; was darüber liegt, verpufft größtenteils
      const grenze = innovationsGrenze(w);
      wirkt = (wirksameForschung(etatBip(p, neu)!, grenze) - wirksameForschung(p.startBip ?? 0, grenze)) / p.schritt;
    }
    for (const x of p.dauer) wirke(w, x.id, x.d * wirkt);
  }
  // Bildung ohne Forschung: Wer ausbildet, aber keine Stellen in Labor und Hochschule schafft, bildet für das Ausland aus
  const ueberhang = bildungsUeberhang(w) - WISSEN.abwanderungSchwelle;
  if (ueberhang > 0) wirke(w, "abwanderung", ABWANDERUNG_JE_PROZENT * ueberhang);
  // Demografie: Dasselbe Rentenniveau kostet mit jedem Jahr Alterung etwas mehr (über den Ausgabenimpuls)
  const e = w.economy;
  const r = rentenSicht(w);
  const aufschlag = r.etat - r.etat / demografieFaktor(w);
  e.fiscalImpulse += aufschlag - (z.demografie ?? 0);
  z.demografie = aufschlag;
  // Zinsdienst: Der Durchschnittszins auf die Schuld folgt nur einem Teil der Marktzinsänderung und nur langsam
  const markt = e.policyRate + e.riskPremium / 100;
  const ziel = ZINSSATZ_START + 0.25 * (markt - z.marktStart);
  z.zinssatz = clamp(z.zinssatz + 0.06 * (ziel - z.zinssatz), 3, 60);
  e.zinsMehrlast = (e.debtRatio / 100) * (z.zinssatz - ZINSSATZ_START);
}

/** Monatlicher Schub, der die Abwanderung je % des BIP Bildungsüberhang um `WISSEN.abwanderungJeProzent` Punkte verschiebt. */
const ABWANDERUNG_JE_PROZENT = s("abwanderung", WISSEN.abwanderungJeProzent).d;

// ---------------------------------------------------------------------------
// WIR-3: Haushalts-Zyklus mit Parallelität (Suzerain): Oktober-Fenster, Entwurf, parlamentarischer Akt

/** Spielparameter des Haushalts-Zyklus (Kalibrierung, keine Tatsachen). */
export const HAUSHALT_ZYKLUS = {
  /** Kalendermonat des Haushaltsfensters (Oktober) */
  fensterMonat: 10,
  /** Länge des Fensters in Tagen (vier Wochen) */
  fensterTage: 28,
  /** Kapitalkosten-Faktor außerhalb des Fensters („Nachtragshaushalt") */
  nachtragFaktor: 2,
  /** Legitimitäts-Abzug je Nachtrags-Änderung (Verfahrensverstoß, ehrlich bepreist) */
  nachtragLegitimitaet: -0.4,
  /** Legitimitäts-Abzug bei gescheitertem Haushaltsgesetz */
  scheiternLegitimitaet: -2,
} as const;

export interface FensterSicht {
  /** Das Kalenderfenster ist geöffnet (1. bis 28. Oktober) */
  kalenderOffen: boolean;
  /** Der Entwurf kann gestellt werden (Fenster offen, Zyklus nicht erledigt, kein Gesetz unterwegs) */
  offen: boolean;
  /** Das Jahr des laufenden oder nächsten Fensters */
  jahr: number;
  /** Resttage des geöffneten Fensters */
  tageRest: number;
  /** Startdatum des nächsten Fensters (JJJJ-MM-TT) */
  naechsterStart: string;
  /** Monate bis zum nächsten Fenster (0 im Oktober) */
  monateBis: number;
  /** Der Zyklus dieses Jahres ist entschieden (Gesetz beschlossen/gescheitert oder fortgeschrieben) */
  erledigt: boolean;
  /** Der Entwurf liegt im Parlament */
  gesetzUnterwegs: boolean;
  letztesErgebnis?: "angenommen" | "gescheitert" | "fortgeschrieben";
}

/** Der Stand des Haushalts-Zyklus: Fenster offen/geschlossen, Countdown, Ergebnis des letzten Durchgangs. */
export function haushaltsfenster(w: World): FensterSicht {
  const z = haushaltZustand(w);
  const jahr = Number(w.date.slice(0, 4));
  const monat = monthNumber(w.date);
  const tag = dayOfMonth(w.date);
  const kalenderOffen = monat === HAUSHALT_ZYKLUS.fensterMonat && tag <= HAUSHALT_ZYKLUS.fensterTage;
  const vorbei = monat > HAUSHALT_ZYKLUS.fensterMonat || (monat === HAUSHALT_ZYKLUS.fensterMonat && tag > HAUSHALT_ZYKLUS.fensterTage);
  const jahrNaechstes = vorbei ? jahr + 1 : jahr;
  const naechsterStart = `${jahrNaechstes}-10-01`;
  const monateBis = kalenderOffen ? 0 : ((HAUSHALT_ZYKLUS.fensterMonat - monat + 12) % 12 || (tag > 1 ? 12 : 0));
  const erledigt = z.zyklusJahr === (kalenderOffen ? jahr : monat === HAUSHALT_ZYKLUS.fensterMonat ? jahr : jahrNaechstes - 1);
  const gesetzUnterwegs = !!z.gesetz;
  const offen = kalenderOffen && !erledigt && !gesetzUnterwegs;
  return {
    kalenderOffen,
    offen,
    jahr: kalenderOffen ? jahr : jahrNaechstes,
    tageRest: kalenderOffen ? HAUSHALT_ZYKLUS.fensterTage - tag + 1 : 0,
    naechsterStart,
    monateBis,
    erledigt,
    gesetzUnterwegs,
    ...(z.letztesErgebnis ? { letztesErgebnis: z.letztesErgebnis } : {}),
  };
}

/** Den Entwurf im offenen Fenster stellen: kostenlos; wirkt erst, wenn das Haushaltsgesetz das Parlament passiert. */
export function setzeEntwurf(w: World, idRoh: string, stufe: number): Ergebnis {
  const spiel = w.spiel;
  const id = postenId(idRoh);
  const p = POSTEN_NACH_ID[id];
  if (!spiel || !p) return { ok: false, text: "Diesen Haushaltsposten gibt es nicht." };
  const z = haushaltZustand(w);
  const fenster = haushaltsfenster(w);
  if (z.gesetz) return { ok: false, text: "Der Entwurf liegt schon im Parlament und lässt sich nicht mehr ändern." };
  if (!fenster.offen) return { ok: false, text: `Der Entwurf ist nur im Haushaltsfenster möglich (Oktober, ${HAUSHALT_ZYKLUS.fensterTage} Tage); nächstes Fenster: Oktober ${fenster.naechsterStart.slice(0, 4)}.` };
  const ziel = inSpanne(p, stufe);
  z.entwurf ??= {};
  if (ziel === (z.stufen[id] ?? 0)) delete z.entwurf[id];
  else z.entwurf[id] = ziel;
  const geaendert = Object.keys(z.entwurf).length;
  const text = ziel === (z.stufen[id] ?? 0) ? t("haushalt.entwurf.unveraendert", { posten: p.name }) : t("haushalt.entwurf.gestellt", { posten: p.name, stufe: `${ziel > 0 ? "+" : "−"}${Math.abs(ziel)}` });
  return { ok: true, text, why: `Kostenlos im Haushaltsfenster. Wirkt erst, wenn das Haushaltsgesetz das Parlament passiert — der Entwurf umfasst jetzt ${geaendert} ${geaendert === 1 ? "Posten" : "Posten"}.` };
}

/** Die Paketvorschläge des Finanzministeriums als Entwurf übernehmen (ersetzt den bisherigen Entwurf). */
export function paketInEntwurf(w: World, id: string): Ergebnis {
  const paket = PAKETE[id];
  if (!paket) return { ok: false, text: "Dieses Paket gibt es nicht." };
  const z = haushaltZustand(w);
  const fenster = haushaltsfenster(w);
  if (!fenster.offen || z.gesetz) return { ok: false, text: "Das geht nur im offenen Haushaltsfenster, bevor der Entwurf im Parlament liegt." };
  z.entwurf = {};
  for (const [posten, delta] of Object.entries(paket.schritte)) {
    const ziel = inSpanne(POSTEN_NACH_ID[posten]!, stufeVon(w, posten) + delta);
    if (ziel !== stufeVon(w, posten)) z.entwurf[posten] = ziel;
  }
  const text = `Entwurf übernommen: Paket „${paket.name}“ (${Object.keys(z.entwurf).length} Posten).`;
  return { ok: true, text, why: "Die Regler stehen jetzt im Entwurf; Sie können sie einzeln nachjustieren, bevor das Gesetz eingebracht wird." };
}

/** Wie es um das eingebrachte Haushaltsgesetz steht (Mehrheitslogik wie bei Gesetzen). */
export interface HaushaltsGesetzSicht {
  ja: number;
  luecke: number;
  noetig: number;
  kosten: number;
  bezahlbar: boolean;
  urteil: "sicher" | "knapp" | "verloren";
  abstimmungTag: number;
  tageBis: number;
}

export function haushaltsGesetzSicht(w: World): HaushaltsGesetzSicht | null {
  const z = haushaltZustand(w);
  const g = z.gesetz;
  if (!g) return null;
  const sicht = stimmenSicht(w);
  const ja = sicht.erwartet + g.absprachen;
  const luecke = Math.max(0, REGELN.mehrheit - ja);
  const noetig = ja >= REGELN.mehrheit + STIMMEN_PUFFER ? 0 : REGELN.mehrheit + STIMMEN_PUFFER - ja;
  const kosten = Math.ceil(noetig * REGELN.kaufKostenProStimme);
  const kapital = w.spiel?.kapital ?? 0;
  const bezahlbar = kannZahlen(kapital, kosten);
  const urteil = ja >= REGELN.mehrheit + STIMMEN_PUFFER ? "sicher" : luecke > 0 && !bezahlbar ? "verloren" : "knapp";
  return { ja, luecke, noetig, kosten, bezahlbar, urteil, abstimmungTag: g.abstimmung, tageBis: Math.max(0, g.abstimmung - w.day) };
}

/** Das Haushaltsgesetz (Summe der Entwurfs-Änderungen) ins Parlament einbringen. */
export function bringeHaushaltsgesetzEin(w: World): Ergebnis {
  const spiel = w.spiel;
  if (!spiel) return { ok: false, text: "Ohne Spielschleife gibt es kein Parlament." };
  const z = haushaltZustand(w);
  const fenster = haushaltsfenster(w);
  if (z.gesetz) return { ok: false, text: "Der Entwurf liegt schon im Parlament." };
  if (!fenster.kalenderOffen) return { ok: false, text: `Das Haushaltsfenster ist geschlossen; es öffnet jedes Jahr im Oktober (${HAUSHALT_ZYKLUS.fensterTage} Tage).` };
  if (fenster.erledigt) return { ok: false, text: "Der Haushalt dieses Jahres ist bereits entschieden; der nächste Entwurf beginnt im kommenden Oktober." };
  const entwurf = z.entwurf ?? {};
  const aenderungen = Object.entries(entwurf).filter(([id, s]) => (z.stufen[id] ?? 0) !== s);
  if (!aenderungen.length) return { ok: false, text: "Der Entwurf ist leer: Erst Regler stellen — im Fenster kostenlos.", why: "Ohne Änderung braucht es kein Gesetz; der Vorjahrshaushalt läuft von selbst weiter." };
  const jahr = Number(w.date.slice(0, 4));
  z.gesetz = { jahr, schritte: { ...entwurf }, eingebracht: w.day, abstimmung: w.day + REGELN.tageBisAbstimmung, absprachen: 0 };
  z.entwurf = {};
  const sicht = stimmenSicht(w);
  const text = `Haushaltsgesetz ${jahr + 1} eingebracht: ${aenderungen.length} ${aenderungen.length === 1 ? "Posten" : "Posten"} geändert; die Abstimmung ist in ${REGELN.tageBisAbstimmung} Tagen.`;
  const why = `Erwartet werden ${sicht.erwartet} Ja-Stimmen (Spanne ${sicht.low} bis ${sicht.high}), nötig sind ${REGELN.mehrheit}. Fehlende Stimmen lassen sich wie bei jedem Gesetz mit Kapital sichern. Scheitert der Haushalt, läuft der Vorjahrshaushalt weiter — die Posten stehen in Prozent der Wirtschaftsleistung und gleichen die Inflation von selbst aus —, aber die Regierung verliert Legitimität.`;
  addLog(w, "entscheidung", text, why);
  return { ok: true, text, why };
}

/** Stimmen für das eingebrachte Haushaltsgesetz kaufen (Absprachen mit Fraktionen, wie bei Gesetzen). */
export function haushaltsStimmenKaufen(w: World, anzahl: number): Ergebnis {
  const spiel = w.spiel;
  const z = haushaltZustand(w);
  const g = z.gesetz;
  if (!spiel || !g) return { ok: false, text: "Es liegt kein Haushaltsgesetz zur Abstimmung vor." };
  const n = Math.max(1, Math.round(anzahl));
  const kosten = Math.ceil(n * REGELN.kaufKostenProStimme);
  if (!kannZahlen(spiel.kapital, kosten)) return { ok: false, text: `Für ${n} Stimmen fehlt Politisches Kapital (nötig ${kosten}, vorhanden ${Math.floor(spiel.kapital)}).` };
  spiel.kapital -= kosten;
  g.absprachen += n;
  const text = `${n} Stimmen für das Haushaltsgesetz gesichert.`;
  addLog(w, "entscheidung", text, `Kostet ${kosten} Kapital, sofort bezahlt; danach schuldet niemand jemandem etwas.`);
  return { ok: true, text, why: `Kostet ${kosten} Kapital.` };
}

/** Wendet einen beschlossenen Entwurf an: Regler-Stufen, Nachfrage-Impuls und Sofortwirkungen je Posten. */
function wendeEntwurfAn(w: World, schritte: Record<string, number>, jahr: number): number {
  const z = haushaltZustand(w);
  let angewendet = 0;
  for (const [id, zielStufe] of Object.entries(schritte)) {
    const p = POSTEN_NACH_ID[id];
    if (!p) continue;
    const aktuell = z.stufen[p.id] ?? 0;
    const ziel = inSpanne(p, zielStufe);
    const delta = ziel - aktuell;
    if (!delta) continue;
    if (ziel === 0) delete z.stufen[p.id];
    else z.stufen[p.id] = ziel;
    wende(w, p, delta);
    angewendet += 1;
    const mrd = Math.round(Math.abs(delta * mrdJeStufe(p)));
    const richtung = richtungsWort(p, delta);
    const impuls = delta * p.schritt * vorzeichen(p);
    const folgen = [
      ...impulsKette(impuls).slice(0, 3).map(kettenZeile),
      ...p.dauer.slice(0, 3).map((x) => {
        const node = NET.nodes[NET.index.get(x.id) ?? -1];
        return node ? `${node.name} ${Math.sign(x.d * delta) > 0 ? "▲" : "▼"} (dauerhaft)` : "";
      }).filter(Boolean),
    ];
    z.aenderungen.push({ tag: w.day, datum: w.date, posten: p.name, text: t("haushalt.beschluss.gesetz", { jahr: String(jahr + 1), posten: p.name, richtung, mrd: mrd.toLocaleString("de-DE") }), folgen });
    z.letzteAenderung = w.day;
  }
  while (z.aenderungen.length > 12) z.aenderungen.shift();
  return angewendet;
}

/**
 * Täglicher Schritt des Haushalts-Zyklus (aus der Spielschleife): die Abstimmung über das
 * Haushaltsgesetz und das stille Schließen des Fensters, wenn niemand etwas einbringt.
 */
export function haushaltszyklusTag(w: World, rng: Rng): void {
  const spiel = w.spiel;
  if (!spiel || spiel.ende) return;
  const z = haushaltZustand(w);
  const jahr = Number(w.date.slice(0, 4));

  // Fenster-Ende ohne Entscheidung: Der Vorjahrshaushalt schreibt sich fort (inflationsausgeglichen)
  if (monthNumber(w.date) === HAUSHALT_ZYKLUS.fensterMonat && dayOfMonth(w.date) === HAUSHALT_ZYKLUS.fensterTage + 1 && z.zyklusJahr !== jahr && !z.gesetz) {
    z.zyklusJahr = jahr;
    z.letztesErgebnis = "fortgeschrieben";
    addLog(
      w,
      "ereignis",
      `Das Haushaltsfenster schließt ungenutzt: Der Haushalt ${jahr} läuft weiter.`,
      "Die Posten stehen in Prozent der Wirtschaftsleistung und gleichen die Inflation damit automatisch aus. Wer etwas ändern will, nutzt den (teuren) Nachtragshaushalt oder wartet auf den nächsten Oktober.",
    );
  }

  const g = z.gesetz;
  if (!g || g.abstimmung > w.day) return;
  z.gesetz = null;
  const sicht = stimmenSicht(w);
  const ja = Math.min(600, Math.max(0, sicht.erwartet + g.absprachen + Math.round(rng.normal(6))));
  const nein = 600 - ja;
  const angenommen = ja >= REGELN.mehrheit;
  z.zyklusJahr = g.jahr;
  if (angenommen) {
    const n = wendeEntwurfAn(w, g.schritte, g.jahr);
    z.letztesErgebnis = "angenommen";
    const text = `Das Parlament nimmt das Haushaltsgesetz ${g.jahr + 1} an (${ja} zu ${nein}): ${n} ${n === 1 ? "Posten" : "Posten"} geändert.`;
    addLog(w, "entscheidung", text, `Das Defizit liegt jetzt bei ${fmt(defizitJetzt(w))} % des BIP. Die Änderungen wirken ab sofort; die Dauerwirkungen entfalten sich über die nächsten Monate.`);
    addMarke(w, "haushalt", `Haushaltsgesetz ${g.jahr + 1} beschlossen`);
    spiel.chronik.push({ tag: w.day, datum: w.date, titel: `Haushaltsgesetz ${g.jahr + 1}`, ausgang: `Mit ${ja} zu ${nein} Stimmen angenommen.` });
  } else {
    z.letztesErgebnis = "gescheitert";
    wirke(w, "legitimitaet", HAUSHALT_ZYKLUS.scheiternLegitimitaet);
    spiel.umfrage.zustimmung = Math.max(0, spiel.umfrage.zustimmung - 0.8);
    addLog(
      w,
      "entscheidung",
      `Das Parlament lehnt das Haushaltsgesetz ${g.jahr + 1} ab (${ja} zu ${nein}).`,
      `Der Vorjahrshaushalt läuft weiter: Die Posten stehen in Prozent der Wirtschaftsleistung und gleichen die Inflation automatisch aus. Die Regierung wirkt geschwächt (Legitimität ${HAUSHALT_ZYKLUS.scheiternLegitimitaet}). Es fehlten ${REGELN.mehrheit - ja} Stimmen.`,
    );
    spiel.chronik.push({ tag: w.day, datum: w.date, titel: `Haushaltsgesetz ${g.jahr + 1}`, ausgang: `Mit ${ja} zu ${nein} Stimmen abgelehnt; der Vorjahrshaushalt läuft weiter.` });
  }
}

/** Staatskalender-Markierung: die nächsten festen Haushaltstermine ab heute (Fenster, Abstimmung). */
export function naechsteHaushaltstermine(w: World): { datum: string; text: string }[] {
  const fenster = haushaltsfenster(w);
  const z = haushaltZustand(w);
  const out: { datum: string; text: string }[] = [];
  if (z.gesetz) out.push({ datum: addDays(w.date, z.gesetz.abstimmung - w.day), text: `Abstimmung über das Haushaltsgesetz ${z.gesetz.jahr + 1}` });
  if (!fenster.kalenderOffen) out.push({ datum: fenster.naechsterStart, text: `Haushaltsfenster öffnet (Oktober, ${HAUSHALT_ZYKLUS.fensterTage} Tage)` });
  return out;
}

/** Den Vorjahrshaushalt ausdrücklich fortschreiben (Wahl im Oktober-Ereignis): keine Änderung, keine Abstimmung. */
export function schreibeHaushaltFort(w: World): void {
  const z = haushaltZustand(w);
  const jahr = Number(w.date.slice(0, 4));
  z.zyklusJahr = jahr;
  z.letztesErgebnis = "fortgeschrieben";
  z.entwurf = {};
  addLog(
    w,
    "entscheidung",
    `Der Haushalt ${jahr + 1} wird fortgeschrieben.`,
    "Die Posten bleiben unverändert und laufen mit der Inflation automatisch mit; wer später ändern will, nutzt den (teuren) Nachtragshaushalt oder wartet auf den nächsten Oktober.",
  );
}
