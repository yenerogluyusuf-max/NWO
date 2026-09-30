// Der Haushalt als Entscheidung: Posten mit Reglern (Nachtragshaushalt), deren Wirkung über Nachfrage, Defizit und die Politikfelder des Netzes
// weiterläuft, und der Zinsdienst des Staates, der den Marktzinsen mit Verzögerung folgt. Alle Zahlen sind Spielparameter (Platzhalter der
// Kalibrierung); die Größenordnungen des Haushalts stammen aus dem Haushaltsgesetz 2026 (`data/haushaltsplan.ts`).

import type { World } from "./types";
import { addLog, fmt } from "./log";
import { clamp } from "./economy";
import { kannZahlen } from "./kapital";
import { wirke } from "./wirkung";
import { NET } from "./modell";
import { impulsKette, istGut, kettenZeile } from "./folgen";
import { addMarke, defizitJetzt, haushaltZustand } from "./wirtschaft";
import { PLAN_2026, ZINSSATZ_START } from "../data/haushaltsplan";
import { stuetze } from "../data/reich/bau";

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

export interface PostenDef {
  id: string;
  name: string;
  seite: "ausgabe" | "einnahme";
  text: string;
  /** Prozent des BIP je Stufe (bei Steuern: Mehreinnahmen) */
  schritt: number;
  /** In welche Richtung eine Änderung politisch teuer ist (+1: mehr, −1: weniger) */
  unbeliebt: 1 | -1;
  /** Zeile des Haushaltsplans 2026, die der Posten trifft */
  plan?: string;
  /** Einmalig je Stufe bei der Änderung (Stimmung der Gruppen) */
  sofort: NetzWirkung[];
  /** Jeden Monat je Stufe: verschiebt das Gleichgewicht der Größen dauerhaft */
  dauer: NetzWirkung[];
  gewinner: string;
  verlierer: string;
  kehrseite: string;
}

const s = (id: string, verschiebung: number): NetzWirkung => {
  const e = stuetze(id, verschiebung) as { id: string; d: number };
  return { id: e.id, d: e.d };
};
const st = (id: string, d: number): NetzWirkung => ({ id, d });

export const POSTEN: PostenDef[] = [
  {
    id: "soziales", name: "Renten und Sozialleistungen", seite: "ausgabe", schritt: 0.4, unbeliebt: -1, plan: "uebertragungen",
    text: "Zuschüsse an die Sozialversicherung, Renten, Sozialhilfe und Familienleistungen.",
    sofort: [st("rentner", 3), st("arbeitnehmer", 1)],
    dauer: [s("rentenniveau", 2), s("armut", -1.5), s("sozialkassen", 1.5)],
    gewinner: "Rentner, arme Haushalte", verlierer: "Steuerzahler, Märkte (mehr Defizit)",
    kehrseite: "Mehr Leistungen ohne Gegenfinanzierung treiben das Defizit; wer später kürzt, verliert die, die sich darauf verlassen haben.",
  },
  {
    id: "personal", name: "Gehälter im öffentlichen Dienst", seite: "ausgabe", schritt: 0.4, unbeliebt: -1, plan: "personal",
    text: "Löhne für Beamte, Lehrer, Ärzte, Polizei; Personalausgaben sind der zweitgrößte Posten.",
    sofort: [st("beamte", 3)],
    dauer: [s("aerzte", 1), s("kostendruck", 0.4), s("korruption", -0.3)],
    gewinner: "Staatsbedienstete, Krankenhäuser", verlierer: "Privatwirtschaft (Lohndruck), Haushalt",
    kehrseite: "Höhere Gehälter im Staat ziehen die Löhne im Privatsektor nach und treiben die Preise.",
  },
  {
    id: "investitionen", name: "Öffentliche Investitionen", seite: "ausgabe", schritt: 0.4, unbeliebt: -1, plan: "investitionen",
    text: "Straßen, Brücken, Wasser, Schulen: Bauten, die Jahrzehnte halten.",
    sofort: [st("unternehmer", 1)],
    dauer: [s("bauwirtschaft", 2), s("wachstum_regional", 0.6), s("verkehrsnetz", 0.8), s("produktivitaet", 0.4)],
    gewinner: "Bauwirtschaft, Regionen, Unternehmer", verlierer: "Haushalt (Schulden heute)",
    kehrseite: "Die Kosten stehen sofort im Haushalt, die Erträge kommen erst nach Jahren; in der Zwischenzeit steigt die Bauwirtschaft schneller als die Preise.",
  },
  {
    id: "gesundheit_bildung", name: "Gesundheit und Bildung (laufende Mittel)", seite: "ausgabe", schritt: 0.4, unbeliebt: -1,
    text: "Betrieb von Krankenhäusern, Schulen und Hochschulen: Personal, Material, Wartung.",
    sofort: [st("junge", 1), st("arbeitnehmer", 0.5)],
    dauer: [s("gesundheitsversorgung", 1.2), s("wartezeiten", -1.5), s("bildungsqualitaet", 1), s("hochschule", 0.5)],
    gewinner: "Patienten, Familien, junge Menschen", verlierer: "Haushalt",
    kehrseite: "Mittel allein bauen keine Ärzte und Lehrer: Ohne Ausbildung und Stellen verpufft ein Teil.",
  },
  {
    id: "sicherheit", name: "Sicherheit und Verteidigung", seite: "ausgabe", schritt: 0.4, unbeliebt: -1,
    text: "Streitkräfte, Polizei, Grenzschutz und Nachrichtendienste im laufenden Betrieb.",
    sofort: [st("konservative", 1.5)],
    dauer: [s("militaer", 1.5), s("abschreckung", 1.2), s("kriminalitaet", -0.5), s("terrorgefahr", -0.5)],
    gewinner: "Sicherheitskräfte, Religiös-Konservative", verlierer: "Haushalt, Säkulare Städter, Beziehungen im Nachbarraum",
    kehrseite: "Mehr Rüstung beruhigt im Land und beunruhigt Nachbarn.",
  },
  {
    id: "subventionen", name: "Preisstützen und Subventionen", seite: "ausgabe", schritt: 0.4, unbeliebt: -1,
    text: "Verbilligter Strom und Diesel, Agrarhilfen, gedeckelte Preise: der Staat zahlt, damit der Alltag billiger bleibt.",
    sofort: [st("landwirte", 2), st("arbeitnehmer", 1)],
    dauer: [s("energiepreise", -2), s("lebensmittelpreise", -1.5), s("lebenshaltung", -1), s("landwirtschaft_einkommen", 1.5), s("klimaschutz", -0.4)],
    gewinner: "Verbraucher, Landwirte", verlierer: "Haushalt, Klima",
    kehrseite: "Preise, die der Staat drückt, verschwinden nicht: Sie tauchen im Haushalt wieder auf, und wer Subventionen streicht, sieht sofort die Rechnung.",
  },
  {
    id: "einkommensteuer", name: "Lohn- und Einkommensteuer", seite: "einnahme", schritt: 0.3, unbeliebt: 1, plan: "est",
    text: "Was Beschäftigte und Selbständige von ihrem Einkommen abgeben.",
    sofort: [st("arbeitnehmer", -3), st("unternehmer", -1)],
    dauer: [s("realeinkommen", -1.2), s("steuermoral", -0.6), s("schattenwirtschaft", 0.5), s("ungleichheit", -0.4)],
    gewinner: "Haushalt", verlierer: "Beschäftigte, Selbständige",
    kehrseite: "Die Lohnabzüge treffen Beschäftigte, die sich nicht wehren können; wer kann, weicht in die Schattenwirtschaft aus.",
  },
  {
    id: "verbrauchsteuern", name: "Mehrwert- und Sonderverbrauchsteuern", seite: "einnahme", schritt: 0.3, unbeliebt: 1, plan: "mwst",
    text: "Steuern auf Konsum, Kraftstoffe, Tabak und Autos; zusammen die größte Einnahmequelle des Staates.",
    sofort: [st("arbeitnehmer", -2), st("rentner", -2)],
    dauer: [s("lebenshaltung", 1.5), s("ungleichheit", 0.6), s("armut", 0.4), s("kostendruck", 0.3)],
    gewinner: "Haushalt", verlierer: "Alle Verbraucher, besonders Arme und Rentner",
    kehrseite: "Steuern auf den Konsum sind schnell erhoben und treffen die Ärmsten am stärksten; sie treiben außerdem die Preise.",
  },
  {
    id: "unternehmensteuer", name: "Körperschaftsteuer", seite: "einnahme", schritt: 0.3, unbeliebt: 1, plan: "kst",
    text: "Steuer auf die Gewinne von Kapitalgesellschaften.",
    sofort: [st("unternehmer", -3)],
    dauer: [s("investitionen", -1), s("auslandskapital", -1.2), s("gruendungen", -0.5), s("ungleichheit", -0.3)],
    gewinner: "Haushalt, Beschäftigte (relativ)", verlierer: "Unternehmen, Investoren",
    kehrseite: "Höhere Gewinnsteuern vertreiben Kapital in andere Länder; niedrigere ziehen es an, kosten aber Einnahmen.",
  },
];

export const POSTEN_NACH_ID: Record<string, PostenDef> = Object.fromEntries(POSTEN.map((p) => [p.id, p]));

/** Vorzeichen der Wirkung auf die Nachfrage: Ausgaben stützen, Steuern dämpfen. */
const vorzeichen = (p: PostenDef): 1 | -1 => (p.seite === "ausgabe" ? 1 : -1);

/** Die Stufe eines Postens (−2 bis +2). */
export function stufeVon(w: World, id: string): number {
  return haushaltZustand(w).stufen[id] ?? 0;
}

/** Was die Regler zusammen am Impuls (in % des BIP) ausmachen; der Rest kommt aus Ereignissen, Programmen und Beschlüssen. */
export function impulsAusPosten(w: World): number {
  const z = haushaltZustand(w);
  let sum = 0;
  for (const p of POSTEN) sum += (z.stufen[p.id] ?? 0) * p.schritt * vorzeichen(p);
  return sum;
}

/** Wie viele Milliarden Lira eine Stufe ungefähr bedeutet (Größenordnung, abgeleitet). */
export const mrdJeStufe = (p: PostenDef): number => Math.round(p.schritt * PLAN_2026.mrdProProzentBip);

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
}

/** Was eine Änderung des Postens sofort bedeutet; Folgewirkungen über zwölf Monate rechnet die Vorschau der Oberfläche. */
export function postenVorschau(w: World, id: string, stufe: number): PostenVorschau {
  const p = POSTEN_NACH_ID[id];
  const aktuell = stufeVon(w, id);
  const ziel = clamp(Math.round(stufe), -2, 2);
  const delta = ziel - aktuell;
  const impuls = delta * p!.schritt * vorzeichen(p!);
  const kapital = kapitalKosten(p!, delta);
  const defizitVorher = defizitJetzt(w);
  const zeilen: PostenVorschau["zeilen"] = [];
  if (delta !== 0) {
    for (const e of [...p!.sofort, ...p!.dauer]) {
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
    ...(delta === 0 ? { grund: "Keine Änderung." } : !spiel ? { grund: "Ohne Spielschleife." } : !kannZahlen(spiel.kapital, kapital) ? { grund: `Das kostet ${kapital} Kapital; vorhanden sind ${Math.floor(spiel.kapital)}.` } : {}),
    delta,
    kapital,
    defizitVorher,
    defizitNachher: defizitVorher - impuls,
    impuls,
    zeilen,
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
}

/** Einen Posten auf eine Stufe stellen (Nachtragshaushalt): kostet Kapital, wirkt sofort auf die Stimmung und dauerhaft auf die Politikfelder. */
export function setzePosten(w: World, id: string, stufe: number, ohneKosten = false): Ergebnis {
  const spiel = w.spiel;
  const p = POSTEN_NACH_ID[id];
  if (!spiel || !p) return { ok: false, text: "Diesen Haushaltsposten gibt es nicht." };
  const v = postenVorschau(w, id, stufe);
  if (v.delta === 0) return { ok: false, text: "Der Posten steht schon auf dieser Stufe." };
  if (!ohneKosten && !kannZahlen(spiel.kapital, v.kapital)) return { ok: false, text: `Das kostet ${v.kapital} Kapital; vorhanden sind ${Math.floor(spiel.kapital)}.` };
  const z = haushaltZustand(w);
  const ziel = clamp(Math.round(stufe), -2, 2);
  if (!ohneKosten) spiel.kapital -= v.kapital;
  z.stufen[id] = ziel;
  if (ziel === 0) delete z.stufen[id];
  wende(w, p, v.delta);
  z.letzteAenderung = w.day;
  const mrd = Math.round(Math.abs(v.delta) * mrdJeStufe(p));
  const richtung = v.delta > 0 ? (p.seite === "ausgabe" ? "erhöht" : "angehoben") : p.seite === "ausgabe" ? "gekürzt" : "gesenkt";
  const text = `Nachtragshaushalt: ${p.name} ${richtung} (etwa ${mrd.toLocaleString("de-DE")} Mrd. Lira im Jahr).`;
  const folgen = [
    ...impulsKette(v.impuls).slice(0, 4).map(kettenZeile),
    ...v.zeilen.slice(0, 4).map((x) => `${x.text} ${x.richtung > 0 ? "▲" : "▼"} (dauerhaft)`),
  ];
  z.aenderungen.push({ tag: w.day, datum: w.date, posten: p.name, text, folgen });
  if (z.aenderungen.length > 12) z.aenderungen.shift();
  addLog(w, "entscheidung", text, `Defizit ${fmt(v.defizitVorher)} auf ${fmt(v.defizitNachher)} % des BIP. ${p.kehrseite}`);
  addMarke(w, "haushalt", text);
  return { ok: true, text, why: `${v.kapital ? `Kostet ${v.kapital} Kapital. ` : ""}Defizit ${fmt(v.defizitVorher)} auf ${fmt(v.defizitNachher)} % des BIP.` };
}

/** Pakete für das Haushaltsjahr: mehrere Regler auf einmal. */
export const PAKETE: Record<string, { name: string; schritte: Record<string, number> }> = {
  konsolidieren: { name: "Konsolidieren", schritte: { personal: -1, subventionen: -1, einkommensteuer: 1 } },
  investieren: { name: "Investieren", schritte: { investitionen: 2 } },
};

/** Ein Paket des Haushaltsjahres anwenden (die Kosten trägt das Ereignis). */
export function wendePaketAn(w: World, id: string): void {
  const paket = PAKETE[id];
  if (!paket || !w.spiel) return;
  for (const [posten, delta] of Object.entries(paket.schritte)) {
    const ziel = clamp(stufeVon(w, posten) + delta, -2, 2);
    if (ziel !== stufeVon(w, posten)) setzePosten(w, posten, ziel, true);
  }
}

/** Einmal im Monat: Dauerwirkungen der Regler und der Zinsdienst des Staates. */
export function haushaltMonat(w: World): void {
  if (!w.spiel) return;
  const z = haushaltZustand(w);
  for (const p of POSTEN) {
    const stufe = z.stufen[p.id] ?? 0;
    if (!stufe) continue;
    for (const x of p.dauer) wirke(w, x.id, x.d * stufe);
  }
  // Zinsdienst: Der Durchschnittszins auf die Schuld folgt nur einem Teil der Marktzinsänderung und nur langsam
  const e = w.economy;
  const markt = e.policyRate + e.riskPremium / 100;
  const ziel = ZINSSATZ_START + 0.25 * (markt - z.marktStart);
  z.zinssatz = clamp(z.zinssatz + 0.06 * (ziel - z.zinssatz), 3, 60);
  e.zinsMehrlast = (e.debtRatio / 100) * (z.zinssatz - ZINSSATZ_START);
}
