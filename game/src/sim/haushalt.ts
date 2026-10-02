// Der Haushalt als Entscheidung: Posten mit Reglern, deren Wirkung über Nachfrage, Defizit und die Politikfelder des Netzes
// weiterläuft, und der Zinsdienst des Staates, der den Marktzinsen mit Verzögerung folgt. Alle Zahlen sind Spielparameter (Platzhalter der
// Kalibrierung); die Größenordnungen des Haushalts stammen aus dem Haushaltsgesetz 2026 (`data/haushaltsplan.ts`).
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
import { addMarke, defizitJetzt, haushaltZustand } from "./wirtschaft";
import { REGELN, STIMMEN_PUFFER, stimmenSicht } from "./handeln";
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
  /** WIR-3: Wie der Haushalts-Zyklus diese Änderung einordnet (Entwurf kostenlos, Nachtrag teuer) */
  zyklus: { fensterOffen: boolean; modus: "entwurf" | "nachtrag"; faktor: number; hinweis: string };
}

/** Was eine Änderung des Postens sofort bedeutet; Folgewirkungen über zwölf Monate rechnet die Vorschau der Oberfläche. */
export function postenVorschau(w: World, id: string, stufe: number): PostenVorschau {
  const p = POSTEN_NACH_ID[id];
  const aktuell = stufeVon(w, id);
  const ziel = clamp(Math.round(stufe), -2, 2);
  const delta = ziel - aktuell;
  const impuls = delta * p!.schritt * vorzeichen(p!);
  const fenster = haushaltsfenster(w);
  // WIR-3: Im offenen Fenster geht die Änderung kostenlos in den Entwurf; sonst Nachtrag zum doppelten Preis
  const faktor = fenster.offen ? 0 : HAUSHALT_ZYKLUS.nachtragFaktor;
  const kapital = kapitalKosten(p!, delta) * faktor;
  const zyklus: PostenVorschau["zyklus"] = fenster.offen
    ? { fensterOffen: true, modus: "entwurf", faktor: 0, hinweis: "Haushaltsfenster: kostenlos — die Änderung geht in den Entwurf und wirkt mit dem Haushaltsgesetz." }
    : { fensterOffen: false, modus: "nachtrag", faktor: HAUSHALT_ZYKLUS.nachtragFaktor, hinweis: `Nachtragshaushalt außerhalb des Fensters: doppelte Kapitalkosten und ein kleiner Legitimitäts-Abzug. Nächstes Fenster: Oktober ${fenster.naechsterStart.slice(0, 4)}.` };
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
}

/** Einen Posten auf eine Stufe stellen (Nachtragshaushalt): kostet außerhalb des Fensters doppelt Kapital und etwas Legitimität, wirkt sofort auf die Stimmung und dauerhaft auf die Politikfelder. */
export function setzePosten(w: World, id: string, stufe: number, ohneKosten = false): Ergebnis {
  const spiel = w.spiel;
  const p = POSTEN_NACH_ID[id];
  if (!spiel || !p) return { ok: false, text: "Diesen Haushaltsposten gibt es nicht." };
  const v = postenVorschau(w, id, stufe);
  if (v.delta === 0) return { ok: false, text: "Der Posten steht schon auf dieser Stufe." };
  const z = haushaltZustand(w);
  // WIR-3: Im offenen Fenster (oder solange der Entwurf im Parlament liegt) läuft alles über das Haushaltsgesetz
  if (!ohneKosten && (v.zyklus.fensterOffen || z.gesetz)) {
    return {
      ok: false,
      text: z.gesetz
        ? "Der Haushaltsentwurf liegt schon im Parlament: Erst abstimmen lassen, dann ändern."
        : "Im Oktober läuft der Haushalt über den Entwurf: Regler hier kostenlos stellen und als Haushaltsgesetz einbringen.",
      why: "Das Haushaltsfenster bündelt alle Änderungen in einem parlamentarischen Akt (Suzerain-Parallelität).",
    };
  }
  if (!ohneKosten && !kannZahlen(spiel.kapital, v.kapital)) return { ok: false, text: `Das kostet ${v.kapital} Kapital; vorhanden sind ${Math.floor(spiel.kapital)}.` };
  const ziel = clamp(Math.round(stufe), -2, 2);
  if (!ohneKosten) {
    spiel.kapital -= v.kapital;
    // Nachtragshaushalt: kurzfristig wirksam, aber als Verfahrensverstoß sichtbar (Legitimität)
    wirke(w, "legitimitaet", HAUSHALT_ZYKLUS.nachtragLegitimitaet);
  }
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
  const nachtrag = ohneKosten ? "" : ` Nachtrag außerhalb des Fensters: ${v.kapital} Kapital (doppelt) und ein Abzug bei der Legitimität.`;
  addLog(w, "entscheidung", text, `Defizit ${fmt(v.defizitVorher)} auf ${fmt(v.defizitNachher)} % des BIP.${nachtrag} ${p.kehrseite}`);
  addMarke(w, "haushalt", text);
  return { ok: true, text, why: `${v.kapital ? `Kostet ${v.kapital} Kapital (Nachtrag, doppelter Preis). ` : ""}Defizit ${fmt(v.defizitVorher)} auf ${fmt(v.defizitNachher)} % des BIP.` };
}

/** Ein einfacher Schritt für Sprachbefehle und die KI, wenn kein bestimmter Posten genannt wird: mehr ausgeben oder sparen. */
export function einfacherSchritt(w: World, art: "mehr" | "sparen"): { id: string; stufe: number } | null {
  const kandidaten = art === "mehr" ? ["investitionen", "soziales", "gesundheit_bildung"] : ["personal", "subventionen", "sicherheit"];
  for (const id of kandidaten) {
    const ziel = stufeVon(w, id) + (art === "mehr" ? 1 : -1);
    if (Math.abs(ziel) <= 2) return { id, stufe: ziel };
  }
  return null;
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
export function setzeEntwurf(w: World, id: string, stufe: number): Ergebnis {
  const spiel = w.spiel;
  const p = POSTEN_NACH_ID[id];
  if (!spiel || !p) return { ok: false, text: "Diesen Haushaltsposten gibt es nicht." };
  const z = haushaltZustand(w);
  const fenster = haushaltsfenster(w);
  if (z.gesetz) return { ok: false, text: "Der Entwurf liegt schon im Parlament und lässt sich nicht mehr ändern." };
  if (!fenster.offen) return { ok: false, text: `Der Entwurf ist nur im Haushaltsfenster möglich (Oktober, ${HAUSHALT_ZYKLUS.fensterTage} Tage); nächstes Fenster: Oktober ${fenster.naechsterStart.slice(0, 4)}.` };
  const ziel = clamp(Math.round(stufe), -2, 2);
  z.entwurf ??= {};
  if (ziel === (z.stufen[id] ?? 0)) delete z.entwurf[id];
  else z.entwurf[id] = ziel;
  const geaendert = Object.keys(z.entwurf).length;
  const text = ziel === (z.stufen[id] ?? 0) ? `Entwurf: ${p.name} bleibt unverändert.` : `Entwurf: ${p.name} auf Stufe ${ziel > 0 ? "+" : "−"}${Math.abs(ziel)} gestellt.`;
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
    const ziel = clamp(stufeVon(w, posten) + delta, -2, 2);
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
    const aktuell = z.stufen[id] ?? 0;
    const delta = clamp(zielStufe, -2, 2) - aktuell;
    if (!delta) continue;
    if (zielStufe === 0) delete z.stufen[id];
    else z.stufen[id] = clamp(zielStufe, -2, 2);
    wende(w, p, delta);
    angewendet += 1;
    const mrd = Math.round(Math.abs(delta) * mrdJeStufe(p));
    const richtung = delta > 0 ? (p.seite === "ausgabe" ? "erhöht" : "angehoben") : p.seite === "ausgabe" ? "gekürzt" : "gesenkt";
    const impuls = delta * p.schritt * vorzeichen(p);
    const folgen = [
      ...impulsKette(impuls).slice(0, 3).map(kettenZeile),
      ...p.dauer.slice(0, 3).map((x) => {
        const node = NET.nodes[NET.index.get(x.id) ?? -1];
        return node ? `${node.name} ${Math.sign(x.d * delta) > 0 ? "▲" : "▼"} (dauerhaft)` : "";
      }).filter(Boolean),
    ];
    z.aenderungen.push({ tag: w.day, datum: w.date, posten: p.name, text: `Haushaltsgesetz ${jahr + 1}: ${p.name} ${richtung} (etwa ${mrd.toLocaleString("de-DE")} Mrd. Lira im Jahr).`, folgen });
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
