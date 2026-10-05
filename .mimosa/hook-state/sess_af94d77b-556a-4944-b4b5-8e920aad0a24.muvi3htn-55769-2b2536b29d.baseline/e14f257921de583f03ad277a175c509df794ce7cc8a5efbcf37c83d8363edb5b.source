// Länder-Eigeninitiative (AUS-1 aus VERBESSERUNGSPLAN_2026-09-30): Die Welt handelt von sich aus, statt nur zu reagieren.
// Einmal im Monat würfelt jedes Land mit wahrscheinlichkeitsgewichteten Treibern auf Eigeninitiative:
//   1. Rote Linie bedroht (Veto am Verhandlungstisch oder öffentlicher Druck aus Ankara) → Forderung
//   2. Konflikt über der Drohkulisse-Schwelle → Drohkulisse; darunter → Provokation/Druck
//   3. Vertrag vor dem Auslauf (< 12 Monate) → Verlängerung mit leicht geänderten Konditionen
//   4. Offene Anliegen, die der Spieler beeinflussen könnte → Forderung
//   5. Hohes Vertrauen → das Land macht von sich aus ein Paketangebot
//   6. Ausstrahlung eines frischen Vertrags mit einem Drittland → Forderung oder Angebot
//
// Die Initiative konkurriert im Ereignis-Wettbewerb (ZEI-1, sim/ereignisse.ts) um die Präsentations-Slots
// des Monats — der Schreibtisch bleibt begrenzt; eine Forderung, die es nicht auf den Tisch schafft,
// gärt weiter und kommt dringlicher zurück, ein Angebot verfällt. Dämpfung zusätzlich: höchstens eine
// Initiative pro Monat gesamt (Post-Filter im Wettbewerb) und 90 Tage Ruhe je Land.
// Jede Initiative ist ein Entscheidungs-Ereignis mit echten Optionen (Auto-Stopp Klasse A über
// spiel.ereignisse), nie eine bloße Meldung. Alle Schwellen, Gewichte und Chancen sind Spielparameter
// (Platzhalter der Kalibrierung), keine Tatsachen.
//
// Die fünf Vorlagen tragen die bewährten Kennungen der früheren generischen Ländervorlagen
// (land_fordert, land_angebot, vertrag_verlaengerung, land_provokation) plus land_drohkulisse.

import { addLog } from "./log";
import { clamp } from "./economy";
import { wirke, vertrauenAendern } from "./wirkung";
import { loyalitaetAendern } from "./figuren";
import { LAENDER, anliegenStand, land, landAendern, vertrauenZu, weltZustand, type LandDef, type LandZustand } from "./laender";
import {
  VERLAENGERUNG_PK,
  bewerte,
  heimWirkung,
  klauselSicht,
  klauselnFuer,
  laufende,
  pkFuer,
  pruefeAngebot,
  schliesse,
  verlaengere,
  vertragsName,
  vorschlagVomPartner,
  type Angebot,
  type KlauselSicht,
} from "./abkommen";
import { AUSSTRAHLUNG, KLAUSEL_NACH_ID, PROFILE, type Laufzeit } from "../data/abkommen";
import { beschr, kosten, opt, zusageAnlegen } from "./ereignis-hilfen";
import type { Vorlage } from "./ereignis-hilfen";
import { belastungEreignis, VERFASSUNG } from "./aufmerksamkeit";
import type { World } from "./types";

/** Die Regeln der Eigeninitiative als Spielparameter (Kalibrierung). */
export const INITIATIVE_REGELN = {
  /** Vor diesem Tag handelt die Welt noch nicht von sich aus (Ruhephase nach dem Amtsantritt) */
  startTag: 200,
  /** Tage Ruhe je Land nach einer Initiative */
  abkuehlungLand: 90,
  /** Höchstens so viele Initiativen pro Monat gesamt (Post-Filter im Ereignis-Wettbewerb) */
  maxProMonat: 1,
  /**
   * Monatschance einer Vorlage, für die Treiber vorliegen; der Wettbewerb sortiert danach nach Dringlichkeit.
   * Kalibriert (30.09.2026, test/spielbarkeit.test.ts „zwei bis zwölf Ereignisse im Jahr“ und
   * „Je härter, desto weniger Siege“): Die Eigeninitiative ergänzt die heimischen Vorgänge um etwa einen
   * im Jahr, statt die Dichtebremse (DICHTE_SCHWELLE) zu überrennen — 0,25 und mehr reißen die Jahresdecke,
   * unter ~0,1 kippt der Schwierigkeitsvergleich durch die veränderte Zufallsfolge.
   */
  monatsChance: 0.15,
  /** Konflikt-Schwellen: darüber Provokation, darüber Drohkulisse */
  konfliktProvokation: 70,
  konfliktDrohkulisse: 85,
  /** Ab diesem Vertrauen macht ein Land von sich aus Angebote */
  vertrauenAngebot: 70,
  /** Verträge mit weniger Restlaufzeit (in Tagen, zwölf Monate) treiben eine Verlängerung an */
  vertragRestlaufzeit: 360,
  /** So lange wirkt ein frischer Drittland-Vertrag als Ausstrahlungs-Treiber (Tage) */
  ausstrahlungFenster: 120,
  /** So lange wirkt ein Rote-Linie-Veto als Treiber nach (Tage) */
  rotFenster: 365,
  /** So lange wirkt öffentlicher Druck aus Ankara als Rote-Linie-Treiber nach (Tage) */
  druckFenster: 60,
  /** Relative Basisgewichte der Treiber (werden vor der Wahl auf die Summe normiert) */
  gewicht: { roteLinie: 3, drohkulisse: 2.6, verlaengerung: 2, forderung: 1.5, provokation: 1.4, angebot: 1.2, ausstrahlung: 1.2 },
} as const;

const R = INITIATIVE_REGELN;
const G = R.gewicht;

export const ANREDE: Record<string, string> = {
  USA: "Die US-Regierung", EU: "Die EU-Kommission", RUS: "Moskau", CHN: "Peking", AZE: "Baku", SAU: "Riad und die Golfstaaten", GRC: "Athen",
  IRN: "Teheran", SYR: "Damaskus", IRQ: "Bagdad", ARM: "Eriwan", ISR: "Jerusalem", UKR: "Kiew", GEO: "Tiflis", EGY: "Kairo", LBY: "Tripolis", KAZ: "Astana", CYP: "Nikosia",
};

const anredeVon = (id: string): string => ANREDE[id] ?? land(id).name;

// ---------------------------------------------------------------------------
// Kriegsmodul-Übergabe (AUS-1 ↔ MIL-1): die Drohkulisse ist die letzte Schwelle vor dem Krieg

export interface DrohkulisseUebergabe {
  land: string;
  konflikt: number;
  tag: number;
  ausloeser: "standhalten" | "vermittlung_gescheitert" | "verfristet";
}

/**
 * Die Brücke zum Konfliktvorgang (sim/krieg.ts): Das Kriegsmodul entscheidet, ob und wie aus der Drohkulisse
 * ein Krieg als politischer Vorgang wird. Registriert wird sie in sim/spiel.ts (dort sind beide Module
 * importiert) — bewusst NICHT als Direktimport, damit kein Modul-Ladezyklus initiative ↔ krieg ↔ ereignisse
 * entsteht. Ohne registrierte Brücke (ältere Spielstände, isolierte Tests) bleibt es beim Protokolleintrag.
 */
export interface KriegBruecke {
  /** Laufenden Konfliktvorgang des Landes in der Phase „spannung“ auf Drohkulisse-Niveau heben */
  eskaliere: (w: World, landId: string) => boolean;
}
let kriegBruecke: KriegBruecke | null = null;
export function setzeKriegBruecke(b: KriegBruecke): void {
  kriegBruecke = b;
}

/**
 * Übergabe an der Kriegsschwelle: Wer standhält, wessen Vermittlung scheitert oder wer die Frist verstreichen
 * lässt, gibt die Lage an den Konfliktvorgang weiter — es gibt weiterhin KEINEN automatischen Krieg: Der
 * Vorgang (Spannung → Drohkulisse → Beschluss → …) trägt die Folgen, zusätzlich zur Krise „Kriegsgefahr“
 * (sim/krisen.ts), die aus der Konflikt-Dimension ohnehin täglich neu gerechnet wird.
 */
export function drohkulisseUebergabe(w: World, u: DrohkulisseUebergabe): void {
  const eskaliert = kriegBruecke?.eskaliere(w, u.land) ?? false;
  addLog(
    w,
    "ereignis",
    `Drohkulisse mit ${land(u.land).dat}: Die Lage bleibt an der Kriegsschwelle (Konflikt ${Math.round(u.konflikt)} von 100).`,
    eskaliert
      ? "Übergeben an den Konfliktvorgang: Die Spannung mit diesem Land hebt auf Drohkulisse-Niveau — das Dossier steht in der Welt-Ansicht."
      : "Der Konfliktvorgang (sim/krieg.ts) greift die Lage bei der nächsten Monatsprüfung auf, solange der Konflikt über seiner Anlageschwelle steht; es gibt keinen automatischen Krieg.",
  );
}

// ---------------------------------------------------------------------------
// Treiber und Kandidaten

export type InitiativeTyp = "forderung" | "angebot" | "verlaengerung" | "provokation" | "drohkulisse";

export interface InitiativeKandidat {
  typ: InitiativeTyp;
  land: string;
  /** Relatives Gewicht in der Monatswahl */
  gewicht: number;
  /** Kennung der Ereignisvorlage, mit der der Vorgang geöffnet wird */
  vorlage: "land_fordert" | "land_angebot" | "vertrag_verlaengerung" | "land_provokation" | "land_drohkulisse";
  daten: Record<string, number | string>;
}

export const INITIATIVE_VORLAGE_IDS: ReadonlySet<string> = new Set(["land_fordert", "land_angebot", "vertrag_verlaengerung", "land_provokation", "land_drohkulisse"]);

/** Die Klausel, die das Land am stärksten von der Türkei will und die es noch nicht hat (nie eine Rote Linie). */
function forderungsKlausel(w: World, landId: string): KlauselSicht | null {
  const ks = klauselnFuer(w, landId).filter((k) => k.def.seite === "gibt" && !k.rot && !k.gesperrt && k.wert > 0);
  ks.sort((a, b) => b.wert - a.wert || a.def.id.localeCompare(b.def.id));
  return ks[0] ?? null;
}

/** Die Forderung, die die Türkei am ehesten zurückbekommen kann (für das Gegenangebot). */
function besteWillKlausel(w: World, landId: string): KlauselSicht | null {
  const ks = klauselnFuer(w, landId).filter((k) => k.def.seite === "will" && !k.rot && !k.gesperrt);
  ks.sort((a, b) => b.wert - a.wert || a.def.id.localeCompare(b.def.id));
  return ks[0] ?? null;
}

/** Eine kleine Zugabe für die Verlängerung: etwas, das den Partner wenig kostet und die Türkei nicht hart trifft. */
function zugabeKlausel(w: World, landId: string): KlauselSicht | null {
  const ks = klauselnFuer(w, landId).filter((k) => k.def.seite === "gibt" && !k.rot && !k.gesperrt && k.wert > 0 && k.wert <= 4 && (k.def.pk ?? 0) <= 2);
  ks.sort((a, b) => b.wert - a.wert || a.def.id.localeCompare(b.def.id));
  return ks[0] ?? null;
}

/** Ausstrahlung: Trifft ein frischer Vertrag eines anderen Landes dieses Land (positiv oder negativ)? */
function ausstrahlungAuf(w: World, landId: string): { von: string; d: number; text: string } | null {
  for (const andere of LAENDER) {
    if (andere.id === landId) continue;
    for (const v of laufende(w, andere.id)) {
      if (w.day - v.seit > R.ausstrahlungFenster) continue;
      for (const cid of [...v.gibt, ...v.will]) {
        for (const x of AUSSTRAHLUNG[`${cid}@${andere.id}`] ?? []) {
          if (x.land === landId) return { von: andere.id, d: x.d, text: x.text };
        }
      }
    }
  }
  return null;
}

/** Alle Treiber eines Landes als gewichtete Kandidaten (ohne Dämpfung — die prüft initiativeKandidaten). */
function kandidatenFuerLand(w: World, l: LandDef, welt: Record<string, LandZustand>): InitiativeKandidat[] {
  const z = welt[l.id]!;
  const out: InitiativeKandidat[] = [];
  const vertrauen = vertrauenZu(w, l.id);
  const konflikt = z.konflikt;

  // 1. Rote Linie bedroht: Veto am Verhandlungstisch in jüngerer Zeit oder öffentlicher Druck aus Ankara
  const profil = PROFILE[l.id];
  if (profil?.rot.length) {
    const veto = w.day - (z.rotBedroht ?? -1e9) < R.rotFenster;
    const druck = w.day - (z.zuletzt.druck ?? -1e9) < R.druckFenster;
    if (veto || druck) {
      const klausel = forderungsKlausel(w, l.id);
      const roteId = profil.rot[0]!;
      out.push({
        typ: "forderung",
        land: l.id,
        gewicht: G.roteLinie,
        vorlage: "land_fordert",
        daten: { land: l.id, anlass: "rot", roteLinie: roteId, ...(klausel ? { klausel: klausel.def.id } : {}) },
      });
    }
  }

  // 2. Konflikt: Drohkulisse über der oberen Schwelle, Provokation darunter
  if (konflikt >= R.konfliktDrohkulisse) {
    out.push({ typ: "drohkulisse", land: l.id, gewicht: G.drohkulisse + (konflikt - R.konfliktDrohkulisse) / 10, vorlage: "land_drohkulisse", daten: { land: l.id } });
  } else if (konflikt >= R.konfliktProvokation) {
    out.push({ typ: "provokation", land: l.id, gewicht: G.provokation + (konflikt - R.konfliktProvokation) / 20, vorlage: "land_provokation", daten: { land: l.id } });
  }

  // 3. Vertrag vor dem Auslauf: Der Partner will früh Klarheit — und leicht bessere Konditionen
  for (const v of laufende(w, l.id)) {
    const rest = v.ablauf - w.day;
    if (rest > 30 && rest < R.vertragRestlaufzeit) {
      const zugabe = zugabeKlausel(w, l.id);
      out.push({
        typ: "verlaengerung",
        land: l.id,
        gewicht: G.verlaengerung * (1 + (R.vertragRestlaufzeit - rest) / R.vertragRestlaufzeit),
        vorlage: "vertrag_verlaengerung",
        daten: { land: l.id, vertrag: v.id, ...(zugabe ? { zugabe: zugabe.def.id } : {}) },
      });
      break; // ein auslaufender Vertrag je Land reicht als Treiber
    }
  }

  // 4. Offene Anliegen, die der Spieler beeinflussen könnte (Maßnahmen-Anliegen).
  // Wer gerade Gehör gefunden hat (Gipfel in jüngerer Zeit), wartet erst einmal ab — Regel aus dem Bestand
  // (früher sim/ereignisse-laender.ts), damit Hofieren und Fordern nicht im selben Atemzug kommen.
  const offene = anliegenStand(w, l.id).filter((s) => !s.erfuellt && (s.anliegen.bedingung.art === "massnahme" || s.anliegen.bedingung.art === "massnahme-max"));
  if (offene.length && w.day - (z.zuletzt.gipfel ?? -1e9) >= 150) {
    const a = offene[0]!;
    const klausel = forderungsKlausel(w, l.id);
    out.push({
      typ: "forderung",
      land: l.id,
      gewicht: G.forderung * (1 + offene.length * 0.5) * (0.6 + konflikt / 100),
      vorlage: "land_fordert",
      daten: { land: l.id, anlass: "anliegen", anliegen: a.anliegen.id, text: `${a.anliegen.titel}: ${a.anliegen.text}`, ...(klausel ? { klausel: klausel.def.id } : {}) },
    });
  }

  // 5. Hohes Vertrauen: Das Land macht von sich aus ein Paketangebot
  if (vertrauen >= R.vertrauenAngebot && konflikt < 60) {
    const paket = vorschlagVomPartner(w, l.id);
    if (paket) {
      out.push({
        typ: "angebot",
        land: l.id,
        gewicht: G.angebot + (vertrauen - R.vertrauenAngebot) / 15,
        vorlage: "land_angebot",
        daten: { land: l.id, gibt: paket.gibt.join(","), will: paket.will.join(","), anlass: "vertrauen" },
      });
    }
  }

  // 6. Ausstrahlung eines Drittland-Vertrags: Ärger treibt eine Forderung, ein Gewinn ein Angebot
  const spr = ausstrahlungAuf(w, l.id);
  if (spr) {
    const klausel = spr.d < 0 ? forderungsKlausel(w, l.id) : null;
    const paket = spr.d > 0 && vertrauen >= 55 ? vorschlagVomPartner(w, l.id) : null;
    if (spr.d < 0) {
      out.push({
        typ: "forderung",
        land: l.id,
        gewicht: G.ausstrahlung * Math.abs(spr.d) / 4,
        vorlage: "land_fordert",
        daten: { land: l.id, anlass: "ausstrahlung", quelle: spr.von, text: spr.text, ...(klausel ? { klausel: klausel.def.id } : {}) },
      });
    } else if (paket) {
      out.push({
        typ: "angebot",
        land: l.id,
        gewicht: G.ausstrahlung * Math.abs(spr.d) / 4,
        vorlage: "land_angebot",
        daten: { land: l.id, gibt: paket.gibt.join(","), will: paket.will.join(","), anlass: "ausstrahlung", quelle: spr.von, text: spr.text },
      });
    }
  }
  return out;
}

/**
 * Alle Kandidaten dieses Monats, nach Abzug der Dämpfung je Land: Ruhe (90 Tage) und kein zweiter
 * offener Vorgang desselben Landes. Reihenfolge ist die feste LAENDER-Reihenfolge — der Seed reproduziert so exakt.
 */
export function initiativeKandidaten(w: World): InitiativeKandidat[] {
  const spiel = w.spiel;
  if (!spiel || spiel.ende || w.day < R.startTag) return [];
  const welt = weltZustand(w);
  const out: InitiativeKandidat[] = [];
  for (const l of LAENDER) {
    const z = welt[l.id]!;
    if (w.day - (z.initiativeZuletzt ?? -1e9) < R.abkuehlungLand) continue;
    if (spiel.ereignisse.some((e) => INITIATIVE_VORLAGE_IDS.has(e.vorlage) && String(e.daten?.land) === l.id)) continue;
    out.push(...kandidatenFuerLand(w, l, welt));
  }
  return out;
}

/** Gesamt-Dämpfung: In diesem Monat wurde schon eine Initiative vorgelegt (oder verfiel ausgesessen). */
function monatsSperre(w: World): boolean {
  return w.day - (w.spiel?.zuletzt["initiative#monat"] ?? -1e9) < 28;
}

/** Der dringlichste Kandidat einer Vorlage; steuert Chance und Erzeugung im Ereignis-Wettbewerb. */
export function besterKandidat(w: World, vorlage: InitiativeKandidat["vorlage"]): InitiativeKandidat | null {
  if (monatsSperre(w)) return null;
  return (
    initiativeKandidaten(w)
      .filter((k) => k.vorlage === vorlage)
      .sort((a, b) => b.gewicht - a.gewicht)[0] ?? null
  );
}

/** Buchhaltung einer vorgelegten Initiative: Ruhe je Land und Sperre des Monats. */
function merkeInitiative(w: World, landId: string): void {
  if (!w.spiel) return;
  weltZustand(w)[landId]!.initiativeZuletzt = w.day;
  w.spiel.zuletzt["initiative#monat"] = w.day;
}

// ---------------------------------------------------------------------------
// Lesen für die Oberfläche (Land-Popover: „Moskau fordert: …“)

export interface InitiativeSicht {
  evId: string;
  vorlage: string;
  titel: string;
}

const VORLAGE_Lokal = new Map<string, Vorlage>();

/** Der offene Eigeninitiative-Vorgang gegen dieses Land, falls einer wartet. */
export function initiativeGegen(w: World, landId: string): InitiativeSicht | null {
  const spiel = w.spiel;
  if (!spiel) return null;
  for (const e of spiel.ereignisse) {
    if (!INITIATIVE_VORLAGE_IDS.has(e.vorlage) || String(e.daten?.land) !== landId) continue;
    const v = VORLAGE_Lokal.get(e.vorlage);
    return { evId: e.id, vorlage: e.vorlage, titel: v ? v.titel(w, e) : "Eigeninitiative" };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Die fünf Vorlagen

const labelVon = (w: World, landId: string, id: string) => klauselSicht(w, landId, id)?.label ?? KLAUSEL_NACH_ID[id]?.label ?? id;

const paketText = (w: World, a: Angebot) => {
  const teile: string[] = [];
  if (a.gibt.length) teile.push(`Die Türkei bietet: ${a.gibt.map((id) => `„${labelVon(w, a.land, id)}“`).join(", ")}`);
  if (a.will.length) teile.push(`Die Türkei erhält: ${a.will.map((id) => `„${labelVon(w, a.land, id)}“`).join(", ")}`);
  return `${teile.join(". ")}. Laufzeit ${a.jahre} Jahre.`;
};

function paketAus(ev: { daten?: Record<string, number | string> }): Angebot {
  const liste = (x: unknown) => String(x ?? "").split(",").filter(Boolean);
  return { land: String(ev.daten?.land), gibt: liste(ev.daten?.gibt), will: liste(ev.daten?.will), jahre: 5 };
}

/** Forderungspaket: die verlangte Klausel als einseitiger Vertrag (die Gegenseite stimmt immer zu, sie bekommt ja etwas). */
function forderungsPaket(ev: { daten?: Record<string, number | string> }, jahre: Laufzeit = 5): Angebot | null {
  const klausel = String(ev.daten?.klausel ?? "");
  if (!klausel) return null;
  return { land: String(ev.daten?.land), gibt: [klausel], will: [], jahre };
}

/** Gegenangebotspaket: die verlangte Klausel gegen die beste Gegenleistung; ohne Gegenleistung nur kürzer gebunden. */
function gegenPaket(w: World, ev: { daten?: Record<string, number | string> }): Angebot | null {
  const klausel = String(ev.daten?.klausel ?? "");
  if (!klausel) return null;
  const will = besteWillKlausel(w, String(ev.daten?.land));
  if (will) return { land: String(ev.daten?.land), gibt: [klausel], will: [will.def.id], jahre: 5 };
  return { land: String(ev.daten?.land), gibt: [klausel], will: [], jahre: 2 };
}

/** Der Schlusssatz einer Forderung: was sie dem Land konkret wert ist. */
const klauselWert = (w: World, landId: string, klausel: string) => {
  const k = klauselSicht(w, landId, klausel);
  return k ? `Was das bedeutet: ${k.text}` : "";
};

const LAND_FORDERT: Vorlage = {
  id: "land_fordert",
  szene: "parlament",
  frist: 25,
  abkuehlung: 240,
  chance: (w) => (besterKandidat(w, "land_fordert") ? R.monatsChance : 0),
  eroeffne: (w, ev) => merkeInitiative(w, String(ev.daten?.land)),
  erzeuge: (w) => {
    const k = besterKandidat(w, "land_fordert");
    return k ? { provinzen: [], staerke: 1, daten: { ...k.daten, gewicht: k.gewicht } } : null;
  },
  titel: (w, ev) => {
    const l = land(String(ev.daten?.land));
    const klausel = String(ev.daten?.klausel ?? "");
    return `${anredeVon(l.id)} fordert${klausel ? `: „${labelVon(w, l.id, klausel)}“` : " Gehör"}`;
  },
  text: (w, ev) => {
    const l = land(String(ev.daten?.land));
    const z = weltZustand(w)[l.id]!;
    const anlass = String(ev.daten?.anlass ?? "anliegen");
    const klausel = String(ev.daten?.klausel ?? "");
    let grund: string;
    if (anlass === "rot") {
      const rotText = PROFILE[l.id]?.rotText?.[String(ev.daten?.roteLinie)] ?? `${anredeVon(l.id)} sieht eine Rote Linie berührt.`;
      grund = `${rotText} ${anredeVon(l.id)} verlangt nun ein sichtbares Zeichen, dass die Türkei die Linie respektiert${klausel ? ` — konkret: „${labelVon(w, l.id, klausel)}“` : ""}.`;
    } else if (anlass === "ausstrahlung") {
      grund = `${ev.daten?.text ?? "Ein Vertrag der Türkei mit einem Drittland trifft das Land."} ${anredeVon(l.id)} verlangt Klarheit${klausel ? ` und ein Entgegenkommen: „${labelVon(w, l.id, klausel)}“` : ""}.`;
    } else {
      grund = `${anredeVon(l.id)} lässt ausrichten, dass die Geduld schwindet: ${ev.daten?.text ?? "Ein offenes Anliegen wartet."}${klausel ? ` Am Verhandlungstisch hieße das: „${labelVon(w, l.id, klausel)}“. ${klauselWert(w, l.id, klausel)}` : ""}`;
    }
    const drohung = z.konflikt >= R.konfliktProvokation ? " Zwischen den Zeilen klingt mit, dass es Alternativen zum guten Verhältnis gibt." : "";
    return [grund, `Das Verhältnis steht bei Vertrauen ${Math.round(vertrauenZu(w, l.id))} und Konflikt ${Math.round(z.konflikt)}. Eine Antwort wird erwartet.${drohung}`];
  },
  warum: () => "Andere Staaten haben eigene Interessen und eigene Fristen. Wer ihre Anliegen ignoriert, bekommt sie als Forderung zurück — mit Preis auf beide Antworten.",
  massnahmen: [],
  optionen: (w, ev) => {
    const l = land(String(ev.daten?.land));
    const paket = forderungsPaket(ev);
    const gegen = paket ? gegenPaket(w, ev) : null;
    const m = (() => {
      const a = l.anliegen.find((x) => x.id === String(ev.daten?.anliegen));
      return a && "id" in a.bedingung ? a.bedingung : null;
    })();
    if (!paket) {
      // Kein verhandelbarer Wunsch: Das Land will Gehör und Zusagen statt Klauseln
      return [
        opt("gespraech", "Ein Gespräch anbieten", beschr(2, 0, "kauft Zeit, ohne etwas zu ändern."), 2, (ww) => {
          landAendern(ww, l.id, { vertrauen: 4 }, "Gesprächsangebot nach einer Forderung");
          return `${anredeVon(l.id)} nimmt das Gesprächsangebot an, wartet aber weiter auf Taten.`;
        }),
        opt("zusagen", "Eine Zusage machen", beschr(3, 0, `${anredeVon(l.id)} bekommt ein Versprechen, das in acht Monaten eingefordert wird.`), 3, (ww) => {
          landAendern(ww, l.id, { vertrauen: 6 }, "Zusage nach einer Forderung");
          if (m) zusageAnlegen(ww, { von: anredeVon(l.id), text: `${anredeVon(l.id)} wurde zugesagt: ${String(ev.daten?.text ?? "das Anliegen")}`, tage: 240, massnahme: m.id });
          return `Die Regierung sagt ${anredeVon(l.id)} zu, das Anliegen anzugehen.`;
        }),
        opt("zurueckweisen", "Zurückweisen", beschr(0, 0, "Beifall zu Hause, Ärger im Ausland."), 0, (ww) => {
          landAendern(ww, l.id, { vertrauen: -8, konflikt: 5 }, "Forderung zurückgewiesen");
          wirke(ww, "konservative", 1);
          vertrauenAendern(ww, 0.5);
          return `Die Regierung weist die Forderung von ${anredeVon(l.id)} zurück.`;
        }),
      ];
    }
    const pk = pkFuer(paket);
    const pkGegen = gegen ? pkFuer(gegen) : pk;
    return [
      opt("erfuellen", `Die Forderung erfüllen (Vertrag über ${paket.jahre} Jahre)`, beschr(pk, 0, `${anredeVon(l.id)} bekommt „${labelVon(w, l.id, String(ev.daten?.klausel))}“ als Vertrag; das Verhältnis entspannt sich, aber der Vertrag bindet und wird jedes Jahr geprüft.`), pk, (ww) => {
        const pruef = pruefeAngebot(ww, paket);
        if (pruef) return `Die Forderung lässt sich nicht mehr erfüllen: ${pruef}`;
        schliesse(ww, paket);
        return `Die Türkei erfüllt die Forderung: ${paketText(ww, paket)}`;
      }),
      opt("gegenangebot", "Gegenangebot: Entgegenkommen gegen Gegenleistung", beschr(pkGegen, 0, gegen && gegen.will.length ? `die Türkei gibt „${labelVon(w, l.id, gegen.gibt[0]!)}“ und verlangt „${labelVon(w, l.id, gegen.will[0]!)}“; stimmt ${l.name} nicht, war die Verhandlung umsonst.` : `dieselbe Klausel, aber nur zwei Jahre gebunden; stimmt ${l.name} nicht, war die Verhandlung umsonst.`), pkGegen, (ww) => {
        if (!gegen) return "Es gibt nichts, wogegen sich verhandeln ließe.";
        const b = bewerte(ww, gegen);
        if (b.urteil === "zustimmung") {
          schliesse(ww, gegen);
          return `${anredeVon(l.id)} lässt sich auf den Tausch ein: ${paketText(ww, gegen)}`;
        }
        landAendern(ww, l.id, { vertrauen: -2 }, "Gegenangebot abgelehnt");
        return `${anredeVon(l.id)} besteht auf der vollen Forderung und lehnt den Tausch ab. Der Verhandlungstisch bleibt geöffnet.`;
      }),
      opt("ablehnen", "Ablehnen", beschr(0, 0, "Beifall zu Hause, aber die Beziehung kühlt ab und der Streit wächst."), 0, (ww) => {
        landAendern(ww, l.id, { vertrauen: -8, konflikt: 5 }, "Forderung abgelehnt");
        wirke(ww, "konservative", 1);
        vertrauenAendern(ww, 0.5);
        return `Die Regierung lehnt die Forderung von ${anredeVon(l.id)} ab.`;
      }),
    ];
  },
  standard: (w, ev) => {
    const l = land(String(ev.daten?.land));
    landAendern(w, l.id, { vertrauen: -5, konflikt: 2 }, "Forderung unbeantwortet");
    return `${anredeVon(l.id)} wertet das Schweigen als Antwort.`;
  },
};

const LAND_ANGEBOT: Vorlage = {
  id: "land_angebot",
  szene: "bank",
  frist: 30,
  abkuehlung: 300,
  chance: (w) => (besterKandidat(w, "land_angebot") ? R.monatsChance : 0),
  eroeffne: (w, ev) => merkeInitiative(w, String(ev.daten?.land)),
  erzeuge: (w) => {
    const k = besterKandidat(w, "land_angebot");
    return k ? { provinzen: [], staerke: 1, daten: { ...k.daten, gewicht: k.gewicht } } : null;
  },
  titel: (_, ev) => `${anredeVon(String(ev.daten?.land))} schlägt einen Vertrag vor`,
  text: (w, ev) => {
    const l = land(String(ev.daten?.land));
    const a = paketAus(ev);
    const anlass = String(ev.daten?.anlass ?? "vertrauen");
    const zeile = anlass === "ausstrahlung" ? `${ev.daten?.text ?? ""} ${anredeVon(l.id)} will den Moment nutzen und legt ein Paket auf den Tisch.` : `${anredeVon(l.id)} legt ein Paket auf den Tisch.`;
    return [
      `${zeile} ${paketText(w, a)}`,
      `Das Verhältnis ist gut (Vertrauen ${Math.round(vertrauenZu(w, l.id))}); es ist die Zeit, daraus etwas zu machen. Was das Paket bei uns bewirkt, zeigen die Antworten.`,
    ];
  },
  warum: () => "Vertrauen ist Kapital, das man nur einlösen kann, wenn ein Angebot kommt. Wer es nie einlöst, hat es umsonst aufgebaut. Ein Vertrag bindet aber beide Seiten und wird jedes Jahr geprüft.",
  massnahmen: [],
  optionen: (w, ev) => {
    const l = land(String(ev.daten?.land));
    const a = paketAus(ev);
    const kurz = { ...a, jahre: 2 as Laufzeit };
    const zeilen = [...a.gibt, ...a.will].flatMap((id) => (KLAUSEL_NACH_ID[id] ? heimWirkung(KLAUSEL_NACH_ID[id]!).dauer.slice(0, 2).map((z) => z.text) : [])).slice(0, 4).join("; ");
    const preis = pkFuer(a);
    return [
      opt("annehmen", `Annehmen: ${a.jahre} Jahre`, beschr(preis, 0, zeilen ? `bei uns: ${zeilen}; ein Vertrag bindet und wird jedes Jahr geprüft.` : "ein Vertrag bindet und wird jedes Jahr geprüft."), preis, (ww) => {
        const pruef = pruefeAngebot(ww, a);
        if (pruef) return `Das Paket ist nicht mehr möglich: ${pruef}`;
        schliesse(ww, a);
        return `Die Türkei und ${l.name} schließen den Vertrag: ${paketText(ww, a)}`;
      }),
      opt("verhandeln", "Verhandeln: nur zwei Jahre binden", beschr(pkFuer(kurz), 0, "schwächere Dauerwirkung, dafür weniger Bindung."), pkFuer(kurz), (ww) => {
        const pruef = pruefeAngebot(ww, kurz);
        if (pruef) return `Das Paket ist nicht mehr möglich: ${pruef}`;
        schliesse(ww, kurz);
        return `Die Türkei und ${l.name} schließen einen Vertrag auf zwei Jahre.`;
      }),
      opt("ablehnen", "Ablehnen", beschr(0, 0, "wahrt die Unabhängigkeit, kostet etwas Wärme."), 0, (ww) => {
        landAendern(ww, l.id, { vertrauen: -3 }, "Vertragsvorschlag abgelehnt");
        return `Die Türkei lehnt den Vorschlag von ${anredeVon(l.id)} höflich ab.`;
      }),
    ];
  },
  standard: (w, ev) => {
    merkeInitiative(w, String(ev.daten?.land)); // auch ausgesessen: Das Land hat gehandelt, der Vorschlag verfällt
    landAendern(w, String(ev.daten?.land), { vertrauen: -2 }, "Vertragsvorschlag verfallen");
    return "Der Vorschlag verfällt ungenutzt.";
  },
};

const VERTRAG_VERLAENGERUNG: Vorlage = {
  id: "vertrag_verlaengerung",
  szene: "bank",
  frist: 40,
  abkuehlung: 60,
  chance: (w) => (besterKandidat(w, "vertrag_verlaengerung") ? R.monatsChance : 0),
  eroeffne: (w, ev) => merkeInitiative(w, String(ev.daten?.land)),
  erzeuge: (w) => {
    const k = besterKandidat(w, "vertrag_verlaengerung");
    return k ? { provinzen: [], staerke: 1, daten: { ...k.daten, gewicht: k.gewicht } } : null;
  },
  titel: (_, ev) => `${anredeVon(String(ev.daten?.land))} will den Vertrag verlängern`,
  text: (w, ev) => {
    const l = land(String(ev.daten?.land));
    const v = laufende(w, l.id).find((x) => x.id === String(ev.daten?.vertrag));
    const rest = v ? Math.max(0, v.ablauf - w.day) : 0;
    const zugabe = String(ev.daten?.zugabe ?? "");
    return [
      `Der Vertrag mit ${l.dat} (${v ? vertragsName(w, v) : "Vertrag"}) läuft in etwa ${Math.max(1, Math.round(rest / 30))} Monaten aus. ${anredeVon(l.id)} kommt früh auf die Türkei zu und bietet eine Verlängerung an${zugabe ? ` — für die lange Bindung erwartet es eine kleine Zugabe: „${labelVon(w, l.id, zugabe)}“` : ""}.`,
      `${v && v.verstoesse === 0 ? "Der Vertrag wurde bisher gehalten; das zählt für eine Verlängerung." : "Es gab Verstöße; eine Verlängerung ist damit fraglich."} Das Vertrauen liegt bei ${Math.round(vertrauenZu(w, l.id))}.`,
    ];
  },
  warum: () => "Verträge, die auslaufen, hören nicht auf zu wirken, weil man sie vergisst: Die Dauerwirkungen enden, und das Land fragt sich, ob man es ernst gemeint hat. Wer früh kommt, handelt aus Interesse, nicht aus Freundlichkeit.",
  massnahmen: [],
  optionen: (w, ev) => {
    const l = land(String(ev.daten?.land));
    const vid = String(ev.daten?.vertrag);
    const zugabe = String(ev.daten?.zugabe ?? "");
    const optionen = [
      ...(zugabe
        ? [
            opt("verlaengern_zugabe", `Verlängern mit Zugabe: fünf Jahre plus „${labelVon(w, l.id, zugabe)}“`, beschr(VERLAENGERUNG_PK[5] + 2, 0, "die Dauerwirkungen laufen fünf Jahre weiter; die Zugabe ist ein kleines Zusatzprotokoll auf zwei Jahre."), VERLAENGERUNG_PK[5] + 2, (ww) => {
              const r = verlaengere(ww, l.id, vid, 5, false);
              if (!r.ok) return r.text;
              const protokoll: Angebot = { land: l.id, gibt: [zugabe], will: [], jahre: 2 };
              if (!pruefeAngebot(ww, protokoll)) {
                schliesse(ww, protokoll);
                return `${r.text} Als Zugabe unterschreiben beide Seiten ein Zusatzprotokoll: „${labelVon(ww, l.id, zugabe)}“.`;
              }
              return `${r.text} Die Zugabe entfällt; sie ist nicht mehr möglich.`;
            }),
          ]
        : [
            opt("verlaengern5", "Um fünf Jahre verlängern", beschr(VERLAENGERUNG_PK[5], 0, "die Dauerwirkungen laufen weiter, die Bindung auch."), VERLAENGERUNG_PK[5], (ww) => verlaengere(ww, l.id, vid, 5, false).text),
          ]),
      opt("verlaengern2", "Um zwei Jahre verlängern", beschr(VERLAENGERUNG_PK[2], 0, "kürzere Bindung ohne Zugabe, die Wirkungen laufen weiter."), VERLAENGERUNG_PK[2], (ww) => verlaengere(ww, l.id, vid, 2, false).text),
      opt("auslaufen", "Auslaufen lassen", beschr(0, 0, "die Wirkungen enden mit dem Vertrag; das Land merkt sich die Zurückhaltung."), 0, (ww) => {
        landAendern(ww, l.id, { vertrauen: -2 }, "Verlängerung ausgeschlagen");
        return `Der Vertrag mit ${l.dat} läuft aus.`;
      }),
    ];
    return optionen;
  },
  standard: (w, ev) => {
    const l = land(String(ev.daten?.land));
    merkeInitiative(w, l.id); // auch ausgesessen: Das Angebot des Landes verfällt
    landAendern(w, l.id, { vertrauen: -2 }, "Verlängerungsangebot verfristet");
    return `Das Angebot von ${anredeVon(l.id)} verfällt; der Vertrag mit ${l.dat} läuft ohne Verlängerung aus.`;
  },
};

const LAND_PROVOKATION: Vorlage = {
  id: "land_provokation",
  szene: "anatolien",
  frist: 12,
  abkuehlung: 240,
  chance: (w) => (besterKandidat(w, "land_provokation") ? R.monatsChance : 0),
  eroeffne: (w, ev) => merkeInitiative(w, String(ev.daten?.land)),
  erzeuge: (w) => {
    const k = besterKandidat(w, "land_provokation");
    return k ? { provinzen: [], staerke: 1, daten: { ...k.daten, gewicht: k.gewicht } } : null;
  },
  titel: (_, ev) => `${anredeVon(String(ev.daten?.land))} sucht den Streit`,
  text: (w, ev) => {
    const l = land(String(ev.daten?.land));
    return [
      `Der Dauerstreit mit ${l.dat} verschärft sich von der anderen Seite: Erklärungen, Manöver, Vorwürfe — offenbar soll die Türkei aus der Reserve gelockt werden. Der Konflikt liegt bei ${Math.round(weltZustand(w)[l.id]!.konflikt)} von 100.`,
      `${l.text.split(";")[0]}.`,
    ];
  },
  warum: () => "Provokationen sind Angebote zum Fehler: Wer duldet, verliert Gesicht; wer kontert, heizt den Streit an; wer vermitteln lässt, braucht Geduld und etwas Ansehen.",
  massnahmen: [],
  optionen: (_, ev) => {
    const l = land(String(ev.daten?.land));
    return [
      opt("dulden", "Dulden und nicht anbeißen", beschr(0, 0, "keine Eskalation, aber ein Gesichtsverlust im Inland."), 0, (ww) => {
        vertrauenAendern(ww, -1);
        wirke(ww, "konservative", -1);
        landAendern(ww, l.id, { konflikt: 2 }, "Provokation geduldet");
        return `Die Regierung schweigt zu den Vorwürfen aus ${l.name}; zu Hause lesen das manche als Schwäche.`;
      }),
      opt("kontern", "Kontern: scharfe Antwort und Manöver", beschr(2, 0.05, "ein starker Auftritt im Inland, der den Streit anheizt und Geld kostet."), 2, (ww) => {
        kosten(ww, 0.05);
        landAendern(ww, l.id, { konflikt: 8, vertrauen: -4 }, "Provokation gekontert");
        wirke(ww, "militaer", 1);
        wirke(ww, "konservative", 1);
        vertrauenAendern(ww, 1);
        return `Ankara antwortet scharf und lässt Truppen auffahren; die Spannung mit ${l.dat} steigt.`;
      }),
      opt("vermittlung", "Internationale Vermittlung rufen", beschr(4, 0, "dritte Vermittler sollen die Lage beruhigen; misslingt es, steht die Türkei schwächer da."), 4, (ww, e, rng) => {
        const aussicht = clamp(45 + (vertrauenZu(ww, l.id) - 30), 10, 80);
        if (rng.next() * 100 < aussicht) {
          landAendern(ww, l.id, { konflikt: -12, vertrauen: 4 }, "Vermittlung gelungen");
          wirke(ww, "ansehen", 1);
          loyalitaetAendern(ww, "aussen", 4);
          return `Vermittler legen beide Seiten auf Eis: Der Streit mit ${l.dat} beruhigt sich.`;
        }
        landAendern(ww, l.id, { konflikt: 3 }, "Vermittlung gescheitert");
        wirke(ww, "ansehen", -1);
        return `${anredeVon(l.id)} lässt die Vermittler abblitzen; der Versuch wirkt wie ein Eingeständnis.`;
      }),
    ];
  },
  standard: (w, ev) => {
    landAendern(w, String(ev.daten?.land), { konflikt: 4 }, "Provokation unbeantwortet");
    vertrauenAendern(w, -0.5);
    return "Ohne Antwort verschärft sich der Ton.";
  },
};

const LAND_DROHKULISSE: Vorlage = {
  id: "land_drohkulisse",
  szene: "anatolien",
  frist: 10,
  abkuehlung: 120,
  chance: (w) => (besterKandidat(w, "land_drohkulisse") ? R.monatsChance : 0),
  eroeffne: (w, ev) => merkeInitiative(w, String(ev.daten?.land)),
  erzeuge: (w) => {
    const k = besterKandidat(w, "land_drohkulisse");
    return k ? { provinzen: [], staerke: 1, daten: { ...k.daten, gewicht: k.gewicht } } : null;
  },
  titel: (_, ev) => `${anredeVon(String(ev.daten?.land))} baut eine Drohkulisse auf`,
  text: (w, ev) => {
    const l = land(String(ev.daten?.land));
    const klausel = String(ev.daten?.klausel ?? forderungsKlausel(w, l.id)?.def.id ?? "");
    return [
      `${anredeVon(l.id)} lässt Geduld und Diplomatie hinter sich: Truppenbewegungen, scharfe Worte, und dazu eine konkrete Forderung${klausel ? ` — „${labelVon(w, l.id, klausel)}“` : ""}. Der Konflikt liegt bei ${Math.round(weltZustand(w)[l.id]!.konflikt)} von 100, knapp unter der Schwelle, ab der aus Krise Krieg werden kann.`,
      `Der Generalstab warnt, dass jede falsche Antwort die Lage kippen lässt; die Auslandspresse spricht von der schwersten Krise dieser Amtszeit.`,
    ];
  },
  warum: () => "An der Kriegsschwelle hat jede Antwort zwei Preise: den sofortigen für die Beziehung und den inneren für das Gesicht des Präsidenten. Nachgeben beruhigt und beschämt, Standhalten ehrt und riskiert, Vermittlung kostet Ansehen und Zeit.",
  massnahmen: [],
  optionen: (w, ev) => {
    const l = land(String(ev.daten?.land));
    const klausel = String(ev.daten?.klausel ?? forderungsKlausel(w, l.id)?.def.id ?? "");
    const paket: Angebot | null = klausel ? { land: l.id, gibt: [klausel], will: [], jahre: 5 } : null;
    const pk = paket ? pkFuer(paket) : 2;
    return [
      opt(
        "nachgeben",
        paket ? `Nachgeben: „${labelVon(w, l.id, klausel)}“ als Vertrag erfüllen` : "Nachgeben und beruhigen",
        beschr(pk, 0, "die Krise entspannt sich sofort, aber der Verzicht unter Drohung kostet Ansehen im Ausland und Stimmen im nationalen Lager."),
        pk,
        (ww) => {
          if (paket) {
            const pruef = pruefeAngebot(ww, paket);
            if (pruef) return `Das Zugeständnis lässt sich nicht mehr geben: ${pruef}`;
            schliesse(ww, paket);
          }
          landAendern(ww, l.id, { konflikt: -15, vertrauen: -4 }, "Nachgegeben unter Drohung");
          wirke(ww, "konservative", -2);
          wirke(ww, "ansehen", -2);
          vertrauenAendern(ww, -1);
          return `Die Türkei gibt der Drohkulisse nach${paket ? ` und erfüllt „${labelVon(ww, l.id, klausel)}“ per Vertrag` : ""}; die Lage beruhigt sich, doch der Verzicht unter Druck bleibt in Erinnerung.`;
        },
      ),
      opt("standhalten", "Standhalten", beschr(2, 0, "Härte zeigen: Das Land rückt zusammen, doch die Drohkulisse bleibt — und die Kriegsgefahr rückt näher."), 2, (ww) => {
        landAendern(ww, l.id, { konflikt: 3, vertrauen: -3 }, "Drohkulisse standgehalten");
        wirke(ww, "militaer", 1);
        wirke(ww, "konservative", 1);
        vertrauenAendern(ww, 1);
        drohkulisseUebergabe(ww, { land: l.id, konflikt: weltZustand(ww)[l.id]!.konflikt, tag: ww.day, ausloeser: "standhalten" });
        return `Ankara weist die Forderung von ${anredeVon(l.id)} zurück und bleibt an der Schwelle standhaft.`;
      }),
      opt("vermittlung", "Vermittlung unter Freunden suchen", beschr(5, 0, "teuer und ungewiss: Gelingt sie, entspannt sich die Lage spürbar; scheitert sie, wächst die Drohkulisse."), 5, (ww, e, rng) => {
        const aussicht = clamp(40 + (vertrauenZu(ww, l.id) - 25), 10, 75);
        if (rng.next() * 100 < aussicht) {
          landAendern(ww, l.id, { konflikt: -18, vertrauen: 3 }, "Vermittlung in der Drohkulisse gelungen");
          wirke(ww, "ansehen", 2);
          loyalitaetAendern(ww, "aussen", 5);
          return `Vermittler erreichen eine Deeskalation: ${anredeVon(l.id)} zieht die Drohkulisse ab.`;
        }
        landAendern(ww, l.id, { konflikt: 4 }, "Vermittlung in der Drohkulisse gescheitert");
        wirke(ww, "ansehen", -1);
        drohkulisseUebergabe(ww, { land: l.id, konflikt: weltZustand(ww)[l.id]!.konflikt, tag: ww.day, ausloeser: "vermittlung_gescheitert" });
        return `Die Vermittlung scheitert; ${anredeVon(l.id)} liest den Versuch als Schwäche und baut die Drohkulisse weiter aus.`;
      }),
    ];
  },
  standard: (w, ev) => {
    const l = land(String(ev.daten?.land));
    landAendern(w, l.id, { konflikt: 6, vertrauen: -4 }, "Drohkulisse verfristet");
    vertrauenAendern(w, -1.5);
    belastungEreignis(w, VERFASSUNG.eskalation, `Ungelöste Drohkulisse mit ${l.name}`);
    drohkulisseUebergabe(w, { land: l.id, konflikt: weltZustand(w)[l.id]!.konflikt, tag: w.day, ausloeser: "verfristet" });
    return `Ohne Antwort hält ${anredeVon(l.id)} die Drohkulisse aufrecht; die Krise „Kriegsgefahr“ trägt die Folgen.`;
  },
};

export const INITIATIVE_VORLAGEN: Vorlage[] = [LAND_FORDERT, LAND_ANGEBOT, VERTRAG_VERLAENGERUNG, LAND_PROVOKATION, LAND_DROHKULISSE];
for (const v of INITIATIVE_VORLAGEN) VORLAGE_Lokal.set(v.id, v);
