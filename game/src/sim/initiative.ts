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
import { msg, t, tIn } from "../i18n";

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

/** Anrede in der aktuellen Sprache (Anzeige). */
const anredeVon = (id: string): string => (ANREDE[id] ? t(`ini.anrede.${id}`) : land(id).name);
/** Anrede auf Deutsch: Absender einer Zusage, den zusageBezug über Namen zuordnet (Logik liest nie übersetzten Text). */
const anredeDe = (id: string): string => ANREDE[id] ?? land(id).name;
/** Gerundete Zahl als Text, genau wie zuvor im Template-String (kein Tausenderpunkt, keine „-0“). */
const rund = (x: number): string => String(Math.round(x));

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
    t("ini.droh.log", { dat: land(u.land).dat, name: land(u.land).name, konflikt: rund(u.konflikt) }),
    t(eskaliert ? "ini.droh.uebergeben" : "ini.droh.naechstePruefung"),
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
    return { evId: e.id, vorlage: e.vorlage, titel: v ? v.titel(w, e) : t("ini.titel.fallback") };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Die fünf Vorlagen

const labelVon = (w: World, landId: string, id: string) => klauselSicht(w, landId, id)?.label ?? KLAUSEL_NACH_ID[id]?.label ?? id;

const paketText = (w: World, a: Angebot) => {
  const teile: string[] = [];
  const liste = (ids: string[]) => ids.map((id) => t("ini.paket.klausel", { label: labelVon(w, a.land, id) })).join(", ");
  if (a.gibt.length) teile.push(t("ini.paket.bietet", { liste: liste(a.gibt) }));
  if (a.will.length) teile.push(t("ini.paket.erhaelt", { liste: liste(a.will) }));
  return `${teile.join(". ")}. ${t("ini.paket.laufzeit", { jahre: a.jahre })}`;
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
  return k ? t("ini.klauselWert", { text: k.text }) : "";
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
    return klausel ? t("ini.fordert.titel_klausel", { wer: anredeVon(l.id), klausel: labelVon(w, l.id, klausel) }) : t("ini.fordert.titel_ohne", { wer: anredeVon(l.id) });
  },
  text: (w, ev) => {
    const l = land(String(ev.daten?.land));
    const z = weltZustand(w)[l.id]!;
    const anlass = String(ev.daten?.anlass ?? "anliegen");
    const klausel = String(ev.daten?.klausel ?? "");
    const wer = anredeVon(l.id);
    const k = { mit: klausel ? "ja" : "nein", klausel: klausel ? labelVon(w, l.id, klausel) : "" };
    let grund: string;
    if (anlass === "rot") {
      const rotText = PROFILE[l.id]?.rotText?.[String(ev.daten?.roteLinie)] ?? t("ini.fordert.rot_fallback", { wer });
      grund = t("ini.fordert.grund_rot", { rot: rotText, wer, ...k });
    } else if (anlass === "ausstrahlung") {
      grund = t("ini.fordert.grund_ausstrahlung", { anlass: String(ev.daten?.text ?? t("ini.fordert.ausstrahlung_fallback")), wer, ...k });
    } else {
      grund = t("ini.fordert.grund_anliegen", { wer, anliegen: String(ev.daten?.text ?? t("ini.fordert.anliegen_fallback")), wert: klausel ? klauselWert(w, l.id, klausel) : "", ...k });
    }
    const drohung = z.konflikt >= R.konfliktProvokation ? "ja" : "nein";
    return [grund, t("ini.fordert.lage", { vertrauen: rund(vertrauenZu(w, l.id)), konflikt: rund(z.konflikt), drohung })];
  },
  warum: () => t("ini.fordert.warum"),
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
        opt("gespraech", t("ini.fordert.opt.gespraech"), beschr(2, 0, t("ini.fordert.opt.gespraech.folge")), 2, (ww) => {
          landAendern(ww, l.id, { vertrauen: 4 }, "Gesprächsangebot nach einer Forderung");
          return t("ini.fordert.opt.gespraech.ergebnis", { wer: anredeVon(l.id) });
        }),
        opt("zusagen", t("ini.fordert.opt.zusagen"), beschr(3, 0, t("ini.fordert.opt.zusagen.folge", { wer: anredeVon(l.id) })), 3, (ww) => {
          landAendern(ww, l.id, { vertrauen: 6 }, "Zusage nach einer Forderung");
          if (m) {
            // Text und Absender bleiben deutsch (Logik und Erinnerung lesen sie); die Anzeige kommt aus der Meldung
            const text = ev.daten?.text;
            const de = { wer: anredeDe(l.id), was: String(text ?? tIn("de", "ini.fordert.opt.zusagen.anliegen")) };
            const p = { wer: anredeVon(l.id), was: String(text ?? t("ini.fordert.opt.zusagen.anliegen")) };
            zusageAnlegen(ww, { von: anredeDe(l.id), text: tIn("de", "ini.fordert.opt.zusagen.zusage", de), msg: msg("ini.fordert.opt.zusagen.zusage", p), tage: 240, massnahme: m.id });
          }
          return t("ini.fordert.opt.zusagen.ergebnis", { wer: anredeVon(l.id) });
        }),
        opt("zurueckweisen", t("ini.fordert.opt.zurueckweisen"), beschr(0, 0, t("ini.fordert.opt.zurueckweisen.folge")), 0, (ww) => {
          landAendern(ww, l.id, { vertrauen: -8, konflikt: 5 }, "Forderung zurückgewiesen");
          wirke(ww, "konservative", 1);
          vertrauenAendern(ww, 0.5);
          return t("ini.fordert.opt.zurueckweisen.ergebnis", { wer: anredeVon(l.id) });
        }),
      ];
    }
    const pk = pkFuer(paket);
    const pkGegen = gegen ? pkFuer(gegen) : pk;
    return [
      opt("erfuellen", t("ini.fordert.opt.erfuellen", { jahre: paket.jahre }), beschr(pk, 0, t("ini.fordert.opt.erfuellen.folge", { wer: anredeVon(l.id), klausel: labelVon(w, l.id, String(ev.daten?.klausel)) })), pk, (ww) => {
        const pruef = pruefeAngebot(ww, paket);
        if (pruef) return t("ini.fordert.opt.erfuellen.unmoeglich", { grund: pruef });
        schliesse(ww, paket);
        return t("ini.fordert.opt.erfuellen.ergebnis", { paket: paketText(ww, paket) });
      }),
      opt("gegenangebot", t("ini.fordert.opt.gegenangebot"), beschr(pkGegen, 0, gegen && gegen.will.length ? t("ini.fordert.opt.gegenangebot.folge_tausch", { gibt: labelVon(w, l.id, gegen.gibt[0]!), will: labelVon(w, l.id, gegen.will[0]!), land: l.name }) : t("ini.fordert.opt.gegenangebot.folge_kurz", { land: l.name })), pkGegen, (ww) => {
        if (!gegen) return t("ini.fordert.opt.gegenangebot.nichts");
        const b = bewerte(ww, gegen);
        if (b.urteil === "zustimmung") {
          schliesse(ww, gegen);
          return t("ini.fordert.opt.gegenangebot.ja", { wer: anredeVon(l.id), paket: paketText(ww, gegen) });
        }
        landAendern(ww, l.id, { vertrauen: -2 }, "Gegenangebot abgelehnt");
        return t("ini.fordert.opt.gegenangebot.nein", { wer: anredeVon(l.id) });
      }),
      opt("ablehnen", t("ini.opt.ablehnen"), beschr(0, 0, t("ini.fordert.opt.ablehnen.folge")), 0, (ww) => {
        landAendern(ww, l.id, { vertrauen: -8, konflikt: 5 }, "Forderung abgelehnt");
        wirke(ww, "konservative", 1);
        vertrauenAendern(ww, 0.5);
        return t("ini.fordert.opt.ablehnen.ergebnis", { wer: anredeVon(l.id) });
      }),
    ];
  },
  standard: (w, ev) => {
    const l = land(String(ev.daten?.land));
    landAendern(w, l.id, { vertrauen: -5, konflikt: 2 }, "Forderung unbeantwortet");
    return t("ini.fordert.standard", { wer: anredeVon(l.id) });
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
  titel: (_, ev) => t("ini.angebot.titel", { wer: anredeVon(String(ev.daten?.land)) }),
  text: (w, ev) => {
    const l = land(String(ev.daten?.land));
    const a = paketAus(ev);
    const anlass = String(ev.daten?.anlass ?? "vertrauen");
    const zeile = anlass === "ausstrahlung" ? t("ini.angebot.zeile_ausstrahlung", { anlass: String(ev.daten?.text ?? ""), wer: anredeVon(l.id) }) : t("ini.angebot.zeile", { wer: anredeVon(l.id) });
    return [
      `${zeile} ${paketText(w, a)}`,
      t("ini.angebot.lage", { vertrauen: rund(vertrauenZu(w, l.id)) }),
    ];
  },
  warum: () => t("ini.angebot.warum"),
  massnahmen: [],
  optionen: (w, ev) => {
    const l = land(String(ev.daten?.land));
    const a = paketAus(ev);
    const kurz = { ...a, jahre: 2 as Laufzeit };
    const zeilen = [...a.gibt, ...a.will].flatMap((id) => (KLAUSEL_NACH_ID[id] ? heimWirkung(KLAUSEL_NACH_ID[id]!).dauer.slice(0, 2).map((z) => z.text) : [])).slice(0, 4).join("; ");
    const preis = pkFuer(a);
    return [
      opt("annehmen", t("ini.angebot.opt.annehmen", { jahre: a.jahre }), beschr(preis, 0, zeilen ? t("ini.angebot.opt.annehmen.folge_zeilen", { zeilen }) : t("ini.angebot.opt.annehmen.folge")), preis, (ww) => {
        const pruef = pruefeAngebot(ww, a);
        if (pruef) return t("ini.angebot.unmoeglich", { grund: pruef });
        schliesse(ww, a);
        return t("ini.angebot.opt.annehmen.ergebnis", { land: l.name, paket: paketText(ww, a) });
      }),
      opt("verhandeln", t("ini.angebot.opt.verhandeln"), beschr(pkFuer(kurz), 0, t("ini.angebot.opt.verhandeln.folge")), pkFuer(kurz), (ww) => {
        const pruef = pruefeAngebot(ww, kurz);
        if (pruef) return t("ini.angebot.unmoeglich", { grund: pruef });
        schliesse(ww, kurz);
        return t("ini.angebot.opt.verhandeln.ergebnis", { land: l.name });
      }),
      opt("ablehnen", t("ini.opt.ablehnen"), beschr(0, 0, t("ini.angebot.opt.ablehnen.folge")), 0, (ww) => {
        landAendern(ww, l.id, { vertrauen: -3 }, "Vertragsvorschlag abgelehnt");
        return t("ini.angebot.opt.ablehnen.ergebnis", { wer: anredeVon(l.id) });
      }),
    ];
  },
  standard: (w, ev) => {
    merkeInitiative(w, String(ev.daten?.land)); // auch ausgesessen: Das Land hat gehandelt, der Vorschlag verfällt
    landAendern(w, String(ev.daten?.land), { vertrauen: -2 }, "Vertragsvorschlag verfallen");
    return t("ini.angebot.standard");
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
  titel: (_, ev) => t("ini.verl.titel", { wer: anredeVon(String(ev.daten?.land)) }),
  text: (w, ev) => {
    const l = land(String(ev.daten?.land));
    const v = laufende(w, l.id).find((x) => x.id === String(ev.daten?.vertrag));
    const rest = v ? Math.max(0, v.ablauf - w.day) : 0;
    const zugabe = String(ev.daten?.zugabe ?? "");
    return [
      t("ini.verl.text", {
        dat: l.dat,
        name: l.name,
        vertrag: v ? vertragsName(w, v) : t("ini.verl.vertrag_fallback"),
        monate: Math.max(1, Math.round(rest / 30)),
        wer: anredeVon(l.id),
        mit: zugabe ? "ja" : "nein",
        zugabe: zugabe ? labelVon(w, l.id, zugabe) : "",
      }),
      t("ini.verl.bilanz", { gehalten: v && v.verstoesse === 0 ? "ja" : "nein", vertrauen: rund(vertrauenZu(w, l.id)) }),
    ];
  },
  warum: () => t("ini.verl.warum"),
  massnahmen: [],
  optionen: (w, ev) => {
    const l = land(String(ev.daten?.land));
    const vid = String(ev.daten?.vertrag);
    const zugabe = String(ev.daten?.zugabe ?? "");
    const optionen = [
      ...(zugabe
        ? [
            opt("verlaengern_zugabe", t("ini.verl.opt.zugabe", { zugabe: labelVon(w, l.id, zugabe) }), beschr(VERLAENGERUNG_PK[5] + 2, 0, t("ini.verl.opt.zugabe.folge")), VERLAENGERUNG_PK[5] + 2, (ww) => {
              const r = verlaengere(ww, l.id, vid, 5, false);
              if (!r.ok) return r.text;
              const protokoll: Angebot = { land: l.id, gibt: [zugabe], will: [], jahre: 2 };
              if (!pruefeAngebot(ww, protokoll)) {
                schliesse(ww, protokoll);
                return t("ini.verl.opt.zugabe.ja", { r: r.text, zugabe: labelVon(ww, l.id, zugabe) });
              }
              return t("ini.verl.opt.zugabe.nein", { r: r.text });
            }),
          ]
        : [
            opt("verlaengern5", t("ini.verl.opt.fuenf"), beschr(VERLAENGERUNG_PK[5], 0, t("ini.verl.opt.fuenf.folge")), VERLAENGERUNG_PK[5], (ww) => verlaengere(ww, l.id, vid, 5, false).text),
          ]),
      opt("verlaengern2", t("ini.verl.opt.zwei"), beschr(VERLAENGERUNG_PK[2], 0, t("ini.verl.opt.zwei.folge")), VERLAENGERUNG_PK[2], (ww) => verlaengere(ww, l.id, vid, 2, false).text),
      opt("auslaufen", t("ini.verl.opt.auslaufen"), beschr(0, 0, t("ini.verl.opt.auslaufen.folge")), 0, (ww) => {
        landAendern(ww, l.id, { vertrauen: -2 }, "Verlängerung ausgeschlagen");
        return t("ini.verl.opt.auslaufen.ergebnis", { dat: l.dat, name: l.name });
      }),
    ];
    return optionen;
  },
  standard: (w, ev) => {
    const l = land(String(ev.daten?.land));
    merkeInitiative(w, l.id); // auch ausgesessen: Das Angebot des Landes verfällt
    landAendern(w, l.id, { vertrauen: -2 }, "Verlängerungsangebot verfristet");
    return t("ini.verl.standard", { wer: anredeVon(l.id), dat: l.dat, name: l.name });
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
  titel: (_, ev) => t("ini.prov.titel", { wer: anredeVon(String(ev.daten?.land)) }),
  text: (w, ev) => {
    const l = land(String(ev.daten?.land));
    return [
      t("ini.prov.text", { dat: l.dat, name: l.name, konflikt: rund(weltZustand(w)[l.id]!.konflikt) }),
      `${l.text.split(";")[0]}.`,
    ];
  },
  warum: () => t("ini.prov.warum"),
  massnahmen: [],
  optionen: (_, ev) => {
    const l = land(String(ev.daten?.land));
    return [
      opt("dulden", t("ini.prov.opt.dulden"), beschr(0, 0, t("ini.prov.opt.dulden.folge")), 0, (ww) => {
        vertrauenAendern(ww, -1);
        wirke(ww, "konservative", -1);
        landAendern(ww, l.id, { konflikt: 2 }, "Provokation geduldet");
        return t("ini.prov.opt.dulden.ergebnis", { land: l.name });
      }),
      opt("kontern", t("ini.prov.opt.kontern"), beschr(2, 0.05, t("ini.prov.opt.kontern.folge")), 2, (ww) => {
        kosten(ww, 0.05);
        landAendern(ww, l.id, { konflikt: 8, vertrauen: -4 }, "Provokation gekontert");
        wirke(ww, "militaer", 1);
        wirke(ww, "konservative", 1);
        vertrauenAendern(ww, 1);
        return t("ini.prov.opt.kontern.ergebnis", { dat: l.dat, name: l.name });
      }),
      opt("vermittlung", t("ini.prov.opt.vermittlung"), beschr(4, 0, t("ini.prov.opt.vermittlung.folge")), 4, (ww, e, rng) => {
        const aussicht = clamp(45 + (vertrauenZu(ww, l.id) - 30), 10, 80);
        if (rng.next() * 100 < aussicht) {
          landAendern(ww, l.id, { konflikt: -12, vertrauen: 4 }, "Vermittlung gelungen");
          wirke(ww, "ansehen", 1);
          loyalitaetAendern(ww, "aussen", 4);
          return t("ini.prov.opt.vermittlung.ja", { dat: l.dat, name: l.name });
        }
        landAendern(ww, l.id, { konflikt: 3 }, "Vermittlung gescheitert");
        wirke(ww, "ansehen", -1);
        return t("ini.prov.opt.vermittlung.nein", { wer: anredeVon(l.id) });
      }),
    ];
  },
  standard: (w, ev) => {
    landAendern(w, String(ev.daten?.land), { konflikt: 4 }, "Provokation unbeantwortet");
    vertrauenAendern(w, -0.5);
    return t("ini.prov.standard");
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
  titel: (_, ev) => t("ini.drohk.titel", { wer: anredeVon(String(ev.daten?.land)) }),
  text: (w, ev) => {
    const l = land(String(ev.daten?.land));
    const klausel = String(ev.daten?.klausel ?? forderungsKlausel(w, l.id)?.def.id ?? "");
    return [
      t("ini.drohk.text", { wer: anredeVon(l.id), mit: klausel ? "ja" : "nein", klausel: klausel ? labelVon(w, l.id, klausel) : "", konflikt: rund(weltZustand(w)[l.id]!.konflikt) }),
      t("ini.drohk.warnung"),
    ];
  },
  warum: () => t("ini.drohk.warum"),
  massnahmen: [],
  optionen: (w, ev) => {
    const l = land(String(ev.daten?.land));
    const klausel = String(ev.daten?.klausel ?? forderungsKlausel(w, l.id)?.def.id ?? "");
    const paket: Angebot | null = klausel ? { land: l.id, gibt: [klausel], will: [], jahre: 5 } : null;
    const pk = paket ? pkFuer(paket) : 2;
    return [
      opt(
        "nachgeben",
        paket ? t("ini.drohk.opt.nachgeben_klausel", { klausel: labelVon(w, l.id, klausel) }) : t("ini.drohk.opt.nachgeben_ohne"),
        beschr(pk, 0, t("ini.drohk.opt.nachgeben.folge")),
        pk,
        (ww) => {
          if (paket) {
            const pruef = pruefeAngebot(ww, paket);
            if (pruef) return t("ini.drohk.opt.nachgeben.unmoeglich", { grund: pruef });
            schliesse(ww, paket);
          }
          landAendern(ww, l.id, { konflikt: -15, vertrauen: -4 }, "Nachgegeben unter Drohung");
          wirke(ww, "konservative", -2);
          wirke(ww, "ansehen", -2);
          vertrauenAendern(ww, -1);
          return t("ini.drohk.opt.nachgeben.ergebnis", { mit: paket ? "ja" : "nein", klausel: paket ? labelVon(ww, l.id, klausel) : "" });
        },
      ),
      opt("standhalten", t("ini.drohk.opt.standhalten"), beschr(2, 0, t("ini.drohk.opt.standhalten.folge")), 2, (ww) => {
        landAendern(ww, l.id, { konflikt: 3, vertrauen: -3 }, "Drohkulisse standgehalten");
        wirke(ww, "militaer", 1);
        wirke(ww, "konservative", 1);
        vertrauenAendern(ww, 1);
        drohkulisseUebergabe(ww, { land: l.id, konflikt: weltZustand(ww)[l.id]!.konflikt, tag: ww.day, ausloeser: "standhalten" });
        return t("ini.drohk.opt.standhalten.ergebnis", { wer: anredeVon(l.id) });
      }),
      opt("vermittlung", t("ini.drohk.opt.vermittlung"), beschr(5, 0, t("ini.drohk.opt.vermittlung.folge")), 5, (ww, e, rng) => {
        const aussicht = clamp(40 + (vertrauenZu(ww, l.id) - 25), 10, 75);
        if (rng.next() * 100 < aussicht) {
          landAendern(ww, l.id, { konflikt: -18, vertrauen: 3 }, "Vermittlung in der Drohkulisse gelungen");
          wirke(ww, "ansehen", 2);
          loyalitaetAendern(ww, "aussen", 5);
          return t("ini.drohk.opt.vermittlung.ja", { wer: anredeVon(l.id) });
        }
        landAendern(ww, l.id, { konflikt: 4 }, "Vermittlung in der Drohkulisse gescheitert");
        wirke(ww, "ansehen", -1);
        drohkulisseUebergabe(ww, { land: l.id, konflikt: weltZustand(ww)[l.id]!.konflikt, tag: ww.day, ausloeser: "vermittlung_gescheitert" });
        return t("ini.drohk.opt.vermittlung.nein", { wer: anredeVon(l.id) });
      }),
    ];
  },
  standard: (w, ev) => {
    const l = land(String(ev.daten?.land));
    landAendern(w, l.id, { konflikt: 6, vertrauen: -4 }, "Drohkulisse verfristet");
    vertrauenAendern(w, -1.5);
    belastungEreignis(w, VERFASSUNG.eskalation, t("ini.drohk.belastung", { land: l.name }));
    drohkulisseUebergabe(w, { land: l.id, konflikt: weltZustand(w)[l.id]!.konflikt, tag: w.day, ausloeser: "verfristet" });
    return t("ini.drohk.standard", { wer: anredeVon(l.id) });
  },
};

export const INITIATIVE_VORLAGEN: Vorlage[] = [LAND_FORDERT, LAND_ANGEBOT, VERTRAG_VERLAENGERUNG, LAND_PROVOKATION, LAND_DROHKULISSE];
for (const v of INITIATIVE_VORLAGEN) VORLAGE_Lokal.set(v.id, v);
