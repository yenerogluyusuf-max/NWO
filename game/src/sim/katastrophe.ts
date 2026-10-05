// Katastrophen-Modul (INF-5 aus VERBESSERUNGSPLAN_2026-09-30, Entscheidung Block D —
// „Katastrophen als echtes Risiko"). Erdbeben steht im Zentrum; Flut, Dürre und Waldbrand
// laufen leichtgewichtig über dieselbe Fall-Maschinerie.
//
// Anker der Kalibrierung (Realzahlen, respektvoll und nie grotesk skaliert):
//   - Doppelbeben vom 06.02.2023: 53.537 Tote (AFAD), 11 Provinzen betroffen.
//   - Wohnungs-Versprechen danach: 319.000 versprochene vs. 201.431 gelieferte Wohnungen
//     (Stand Februar 2025) — die Mahnung der Versprechensschuld, s. unten.
//   - Sturzflut Bozkurt/Kastamonu 2021: ~80 Tote; Waldbrände Manavgat 2021: ~8 Tote.
//
// Risiko-Layer: Je Provinz ein Erdbeben-Risiko 1–5 aus kalibrierung/provinz_profile.csv
// (data/katastrophe_risiko.json), grob den Bruchzonen der GEM Global Active Faults
// (RECHERCHE_GITHUB_DATEN.md: cossatot/gem-global-active-faults, CC BY-SA 4.0) zugeordnet:
// Nordanatolische Verwerfung (KAF), Ostanatolische Verwerfung (DAF), westanatolische
// Grabensysteme (BAF). Die Zonenlisten sind grobe Spielparameter, keine Kartenwerke.
//
// Alle Schäden, Wahrscheinlichkeiten und Wirkungen sind Spielparameter der Kalibrierung,
// keine Tatsachenbehauptungen; Todeszahlen bleiben in der Größenordnung der Anker.

import { NET } from "./modell";
import { nationalAverage, PROVINCES } from "./netz";
import { PROVINZEN } from "./regional";
import { wirke, wertIn, vertrauenAendern } from "./wirkung";
import { addLog } from "./log";
import { t } from "../i18n";
import { clamp } from "./economy";
import { hashWert } from "./aufmerksamkeit";
import { addDays, formatDateDe } from "./dates";
import { beginne, laufBau, registriereVorhaben, vorhabenDef, reichZustand, warteschlange } from "./reich";
import type { Vergabe, Vorhaben } from "./reich-typen";
import type { Rng } from "./rng";
import type { World } from "./types";
import type { KatastropheFall, KatastrophenArt, KatastrophenZustand, NebelStufe } from "./spiel-typen";
import RISIKO_RAW from "../data/katastrophe_risiko.json";

// ---------------------------------------------------------------------------
// Spielparameter (Kalibrierung, keine Tatsachen)

export const KATASTROPHE = {
  /** Monatliche Auslösewahrscheinlichkeit eines Großbebens je Bruchzone (erwartet: alle 8–15 Jahre je Zone) */
  bebenChance: { kaf: 0.011, daf: 0.0095, baf: 0.006 },
  /** Tote je Einwohner der betroffenen Provinzen bei Vollstärke (Anker 2023: ~0,4–0,55 % in den Kernprovinzen) */
  toteBasis: 0.0055,
  /** Referenz-Bereitschaft für „was die Vorsorge verhindert hat" (Index 0–100) */
  bereitReferenz: 20,
  /** Wie stark die Bereitschaft die Opferzahlen drückt (1 − d × Stand/100) */
  bereitWirkung: 0.45,
  /** Verletzte und Obdachlose je Totem (Größenordnung 2023) */
  verletzteFaktor: 3.2,
  obdachlosFaktor: 15,
  /** Personen je Haushalt für die Umrechnung in Wohnungen */
  haushalt: 3.2,
  /** Flut (Sturzflut am Schwarzen Meer, Anker Bozkurt 2021): Tote je Einwohner und Stärke */
  flutToteBasis: 0.00011,
  /** Waldbrand: wenige Tote, großer Flächen- und Wirtschaftsschaden */
  brandToteBasis: 0.000006,
  /**
   * Zorn über zu wenig Hilfe (Messung 05.10.: bis zu 86.607 Tote ließen die Zustimmung nicht fallen, nur der kurze Rallye-Effekt blieb):
   * Ab so vielen Toten wächst der Unmut je Zehnerpotenz, solange die Hilfe hinter dem Schaden zurückbleibt …
   */
  zornTote: 2000,
  /** … um so viel Vertrauen je Monat und Zehnerpotenz, bei null Hilfe (Spielparameter) … */
  zornJeStufe: 0.25,
  /** … im Zeitfenster von so vielen Tagen nach dem Ereignis (vorher trägt der Zusammenhalt, nachher ist der Fall meist geschlossen) */
  zornVonTag: 30,
  zornBisTag: 270,
  brandWohnungenBasis: 0.00002,
  /**
   * Monatschancen der leichten Typen (saisonal). Seit die alten Einzelvorlagen (Überschwemmung, Waldbrand, Dürre) abgeschaltet sind,
   * tragen sie allein die Häufigkeit; Kalibrierung gemessen über 24 Seeds × 5 Jahre (vorher zusammen etwa 0,26 / 0,19 / 0,25 je Jahr).
   */
  flutChance: 0.06,
  brandChance: 0.06,
  duerreChance: 0.04,
  /** Abkühlung je Art in Monaten; und: keine neue Lage, solange eine andere frisch ist (Tage) */
  abkuehlung: { erdbeben: 36, flut: 12, waldbrand: 12, duerre: 18 },
  sperrTage: 30,
  /** Nebel der Schadenslage: Tage bis „vermutet" bzw. „bekannt" (mit Soforthilfe früher) */
  nebelVermutet: 3,
  nebelBekannt: 7,
  nebelBekanntMitHilfe: 3,
  /** Soforthilfe: Kostenanteil, den die Pflichtversicherung übernimmt (bei Stufe 100) */
  versicherungEntlastung: 0.25,
  /** Übergangsversorgung: Dauer in Tagen und Monatskosten je Stärke (% BIP) */
  uebergangTage: 210,
  uebergangKosten: 0.02,
  /** Private Erholung ohne Staatsprogramm: Anteil des Bedarfs je Monat, gedeckelt */
  privatQuote: 0.004,
  privatDeckel: 0.25,
  privatNachTagen: 90,
  /** Untergrenze für ein eigenes Wohnungsbau-Programm (verbliebener Bedarf in Wohnungen); darunter bleibt nur die Erholung vor Ort */
  wiederaufbauMin: 1000,
  /** Kleine Schäden (unter der Programmgrenze) und Brandschäden beheben Eigentümer, Versicherung und Behörde ohne Deckel: Anteil des Bedarfs je Monat (Größenordnung zwei Jahre) */
  privatQuoteKlein: 0.05,
  /** Frist in Monaten, nach der eine akute Lage als abgeklungen gilt, auch ohne volle Lieferung; offene Versprechen bleiben in der Versprechensschuld */
  fristMonate: { erdbeben: 60, flut: 24, waldbrand: 12, duerre: 18 },
  /** Dürre: frühestens nach so vielen Monaten und wenn der Wassermangel im Becken bis auf die Toleranz (Punkte) zur Ruhelage zurückgekehrt ist */
  duerreMindestMonate: 6,
  duerreToleranz: 3,
  /** Versprechensschuld: Stufen der öffentlichen Zusage (Anteil der zerstörten Wohnungen) */
  zusageStufen: { klein: 0.6, voll: 1.0, gross: 1.4 },
  /** Wahl-Malus je Punkt Unwucht (versprochen vs. geliefert), skaliert mit der Stärke der Lage */
  malusBasis: 5,
  malusDeckel: 8,
  /** Bauparameter des Wohnungsbau-Programms: Baupunkte/Mindestmonate je Wohnung, Schulden in % BIP je Wohnung */
  bauJeWohnung: 1 / 120,
  monateJeWohnung: 1 / 1200,
  schuldenJeWohnung: 0.000022,
} as const;

// ---------------------------------------------------------------------------
// Risiko-Daten und Zonen

interface RisikoEintrag {
  name: string;
  region: string;
  bevoelkerung: number;
  deprem: number;
  wasserstress: number;
  kueste: number;
  grenzland: number;
  hauptsektor: string;
}

const RISIKO = (RISIKO_RAW as { provinzen: Record<string, RisikoEintrag> }).provinzen;

/** Erdbeben-Risiko einer Provinz, 1–5 (provinz_profile.csv, Spalte deprem_risiko_1_5). */
export function depremRisiko(plaka: number): number {
  return RISIKO[String(plaka)]?.deprem ?? 1;
}

export type BebenZone = "kaf" | "daf" | "baf";

/** Bruchzonen (grob, Spielparameter; s. Kopfkommentar, Quelle gem-global-active-faults). */
export const ZONEN: Record<BebenZone, number[]> = {
  // Nordanatolische Verwerfung: Marmara, westliches und mittleres Schwarzmeer
  kaf: [5, 10, 14, 16, 17, 19, 22, 28, 34, 41, 52, 54, 55, 59, 60, 67, 74, 77, 81],
  // Ostanatolische Verwerfung und Südosten (das Gebiet von 2023)
  daf: [1, 2, 4, 12, 13, 23, 24, 25, 27, 30, 31, 33, 36, 44, 46, 49, 56, 62, 63, 65, 79, 80],
  // Westanatolische Grabensysteme: Ägäis und Hinterland
  baf: [3, 7, 9, 11, 15, 18, 20, 26, 32, 35, 40, 43, 45, 48, 64, 71, 78],
};

export const ZONEN_NAMEN: Record<BebenZone, string> = {
  kaf: "Nordanatolische Verwerfung",
  daf: "Ostanatolische Verwerfung",
  baf: "Westanatolische Grabensysteme",
};

/** Sturzflut-Gebiet: Karadeniz-Region (steile Täler, Starkregen). */
const FLUT_GEBIET = PROVINZEN.filter((p) => p.region === "Karadeniz").map((p) => p.plaka);
/** Großbrand-Gebiet: Ägäis und Mittelmeerküste (Sommer). */
const BRAND_GEBIET = PROVINZEN.filter((p) => (p.region === "Ege" || p.region === "Akdeniz") && (RISIKO[String(p.plaka)]?.kueste ?? 0) === 1).map((p) => p.plaka);
/** Konya-Becken: geschlossenes Trockenbecken, Kopplung an p_wassermangel. */
const DUERRE_BECKEN = PROVINZEN.filter((p) => p.region === "İç Anadolu" && (RISIKO[String(p.plaka)]?.wasserstress ?? 0) >= 4).map((p) => p.plaka);

export const ART_NAMEN: Record<KatastrophenArt, string> = { erdbeben: "Erdbeben", flut: "Sturzflut", waldbrand: "Großbrand", duerre: "Dürre und Wassernot" };

// ---------------------------------------------------------------------------
// Zustand

/** Der Katastrophen-Stand dieser Partie; ältere Spielstände legen ihn beim ersten Zugriff an. */
export function katastrophenZustand(w: World): KatastrophenZustand {
  const sp = w.spiel;
  if (!sp) throw new Error("Ohne Spielschleife gibt es kein Katastrophen-Modul.");
  sp.katastrophen ??= { faelle: [] };
  return sp.katastrophen;
}

/** Ältere Spielstände: Feld anlegen und dynamische Wohnbau-Vorhaben erneut im Reich registrieren. */
export function migriereKatastrophen(w: World): void {
  const sp = w.spiel;
  if (!sp) return;
  if (!sp.katastrophen) {
    sp.katastrophen = { faelle: [] };
    return;
  }
  for (const fall of sp.katastrophen.faelle) {
    if (fall.wohnbau && !vorhabenDef(fall.wohnbau.id)) registriereVorhaben(wohnbauVorhaben(fall, fall.wohnbau));
  }
}

export function fallMit(w: World, id: string): KatastropheFall | undefined {
  return w.spiel?.katastrophen?.faelle.find((f) => f.id === id);
}

/** Kommt ein eigenes Wohnungsbau-Programm in Frage? Nur Erdbeben und Fluten mit genug verbliebenem Bedarf. */
export function programmMoeglich(fall: KatastropheFall): boolean {
  return (fall.art === "erdbeben" || fall.art === "flut") && fall.wohnungen - fall.privatGeliefert >= KATASTROPHE.wiederaufbauMin;
}

/** Läuft das Wohnungsbau-Programm des Falls noch (angemeldet, nicht fertig)? */
function programmLaeuft(fall: KatastropheFall, reich: ReturnType<typeof reichZustand> | null): boolean {
  return !!fall.wohnbau && !!reich?.laufend.some((l) => l.id === fall.wohnbau!.id);
}

/** Vom Wohnungsbau-Programm gelieferte Wohnungen, auch ohne öffentliche Zusage, aus dem Stand im Reich gerechnet. */
function programmLieferung(fall: KatastropheFall, reich: ReturnType<typeof reichZustand> | null): number {
  if (!fall.wohnbau || !reich) return 0;
  if (reich.bestand[fall.wohnbau.id]) return Math.max(fall.wohnbau.bedarf, fall.zusage?.wohnungen ?? 0);
  const lauf = reich.laufend.find((l) => l.id === fall.wohnbau!.id);
  const def = vorhabenDef(fall.wohnbau.id);
  return lauf && def ? Math.round((lauf.fortschritt / laufBau(lauf, def)) * fall.wohnbau.bedarf) : 0;
}

/** Ruhelage eines Knotens in den Provinzen (Bevölkerungsgewicht), das Gegenstück zu `wertIn`. */
function ruheIn(w: World, id: string, provinzen: number[]): number {
  const i = NET.index.get(id);
  if (i === undefined) return NaN;
  let summe = 0;
  let gewicht = 0;
  for (const plaka of provinzen) {
    const g = w.net.weights[plaka - 1]!;
    summe += w.net.start[i * PROVINCES + plaka - 1]! * g;
    gewicht += g;
  }
  return gewicht > 0 ? summe / gewicht : NaN;
}

export type Abschluss = "geliefert" | "erholt" | "frist";

/**
 * Wann gilt ein Fall als abgeschlossen? (1) Der Bedarf an Wohnungen ist zu 95 % gedeckt, durch Programm oder Erholung vor Ort;
 * (2) die Dürre ist abgeklungen (Mindestdauer und Wassermangel zurück an der Ruhelage); (3) die Frist der Art ist verstrichen.
 * Solange das Programm oder die Übergangsversorgung läuft, schließt nichts. Versprechen bleiben auch nach dem Abschluss in der
 * Versprechensschuld (`versprechensLage` zählt jeden Fall mit Zusage).
 */
export function abschlussPruefen(w: World, fall: KatastropheFall): Abschluss | null {
  const reich = w.spiel?.reich ? reichZustand(w) : null;
  if (programmLaeuft(fall, reich)) return null;
  if (fall.hilfe.uebergangBis !== undefined && fall.hilfe.uebergangBis > w.day) return null;
  const monate = (w.day - fall.tag) / 30.4;
  const bedarf = fall.zusage?.wohnungen ?? fall.wohnungen;
  const geliefert = (fall.zusage ? fall.zusage.geliefert : programmLieferung(fall, reich)) + fall.privatGeliefert;
  if (bedarf > 0 && geliefert >= bedarf * 0.95) return fall.wohnbau ? "geliefert" : "erholt";
  if (fall.art === "duerre") {
    const wert = wertIn(w, "p_wassermangel", fall.provinzen);
    const ruhe = ruheIn(w, "p_wassermangel", fall.provinzen);
    const abgeklungen = Number.isFinite(wert) && Number.isFinite(ruhe) ? wert <= ruhe + KATASTROPHE.duerreToleranz : monate >= 12;
    if (monate >= KATASTROPHE.duerreMindestMonate && abgeklungen) return "erholt";
  }
  if (monate >= KATASTROPHE.fristMonate[fall.art]) return "frist";
  return null;
}

/** Die AFAD-Bereitschaft: Stand der Netz-Größe „katastrophenschutz" (0–100). */
export function bereitschaft(w: World): number {
  return nationalAverage(NET, w.net, "katastrophenschutz");
}

// ---------------------------------------------------------------------------
// Schadensmodell (Spielparameter; Anker im Kopfkommentar)

export interface Schaden {
  tote: number;
  verletzte: number;
  obdachlos: number;
  wohnungen: number;
  bereitschaft: number;
  /** Was die Bereitschaft gegenüber der Referenz (Stand 20) verhindert hat */
  verhindert: { tote: number; wohnungen: number };
}

function bevoelkerungVon(provinzen: number[]): number {
  return provinzen.reduce((s, p) => s + (PROVINZEN[p - 1]?.bevoelkerung ?? 0), 0);
}

/** Bereitschafts-Faktor auf die Opferzahlen: 1 − d × Stand/100. */
const bereitFaktor = (stand: number): number => 1 - KATASTROPHE.bereitWirkung * (stand / 100);

/**
 * Die Schadensrechnung eines Falls. Erdbeben: Gebäudebestand (Vorsorge und Bauqualität der
 * Provinzen) und Bereitschaft tragen die Opferzahlen; Flut und Brand laufen leichter, die
 * Dürre tötet nicht direkt. Alles respektvoll in der Größenordnung der Anker gehalten.
 */
export function schadenBerechnen(w: World, art: KatastrophenArt, provinzen: number[], s: number): Schaden {
  const bev = bevoelkerungVon(provinzen);
  const bereit = bereitschaft(w);
  const bf = bereitFaktor(bereit);
  const bfRef = bereitFaktor(KATASTROPHE.bereitReferenz);
  let tote = 0;
  let wohnungen = 0;
  if (art === "erdbeben") {
    const vorsorge = (wertIn(w, "erdbebenvorsorge", provinzen) + wertIn(w, "bauqualitaet", provinzen)) / 200;
    const gebaeude = clamp(1.35 - 0.7 * vorsorge, 0.3, 1.35);
    tote = bev * s * s * KATASTROPHE.toteBasis * gebaeude * bf;
    const toteRef = bev * s * s * KATASTROPHE.toteBasis * gebaeude * bfRef;
    const obdachlos = tote * KATASTROPHE.obdachlosFaktor;
    wohnungen = obdachlos / KATASTROPHE.haushalt;
    const wohnungenRef = (toteRef * KATASTROPHE.obdachlosFaktor) / KATASTROPHE.haushalt;
    return {
      tote: Math.round(tote),
      verletzte: Math.round(tote * KATASTROPHE.verletzteFaktor),
      obdachlos: Math.round(obdachlos),
      wohnungen: Math.round(wohnungen),
      bereitschaft: Math.round(bereit),
      verhindert: { tote: Math.max(0, Math.round(toteRef - tote)), wohnungen: Math.max(0, Math.round(wohnungenRef - wohnungen)) },
    };
  }
  if (art === "flut") {
    tote = bev * s * KATASTROPHE.flutToteBasis * bf;
    wohnungen = (tote * 25) / 3.5;
  } else if (art === "waldbrand") {
    tote = bev * s * KATASTROPHE.brandToteBasis * bf;
    wohnungen = bev * s * KATASTROPHE.brandWohnungenBasis;
  }
  // Dürre: keine direkten Opfer, kein zerstörter Wohnbestand
  return {
    tote: Math.round(tote),
    verletzte: Math.round(tote * KATASTROPHE.verletzteFaktor),
    obdachlos: Math.round(tote * (art === "flut" ? 25 : 8)),
    wohnungen: Math.round(wohnungen),
    bereitschaft: Math.round(bereit),
    verhindert: { tote: Math.max(0, Math.round(tote * (bfRef / bf - 1))), wohnungen: 0 },
  };
}

// ---------------------------------------------------------------------------
// Auslösen (deterministisch: ein Hash-Wurf je Zone und Monat, Stärke aus dem Rng)

/** Der Monats-Wurf des Risiko-Layers: gleiche Partie, gleicher Monat → gleicher Wert. */
export function monatsWurf(seed: number, schluessel: string, monat: string): number {
  return hashWert(`${seed}|${schluessel}|${monat}`);
}

const monat = (w: World): string => w.date.slice(0, 7);
const monatszahl = (w: World): number => Number(w.date.slice(5, 7));

interface Ausloeser {
  art: KatastrophenArt;
  zone?: BebenZone;
  provinzen: number[];
}

/** Welcher Katastrophen-Auslöser in diesem Monat an der Reihe wäre (null = Ruhe). Rein lesend. */
export function geplanterAusloeser(w: World): Ausloeser | null {
  const sp = w.spiel;
  if (!sp || sp.ende) return null;
  const z = katastrophenZustand(w);
  // Keine neue Lage, solange eine andere frisch ist
  if (z.faelle.some((f) => !f.bewaeltigt && w.day - f.tag < KATASTROPHE.sperrTage)) return null;
  const m = monat(w);
  const mZahl = monatszahl(w);
  const zuletztArt = (art: KatastrophenArt): number => z.faelle.filter((f) => f.art === art).reduce((a, f) => Math.max(a, f.tag), -1e9);
  const kuehl = (art: KatastrophenArt): boolean => (w.day - zuletztArt(art)) / 30.4 >= KATASTROPHE.abkuehlung[art];

  // 1. Erdbeben: ein Wurf je Bruchzone; die dringlichste Zone (höchstes Risiko × Einwohner) gewinnt
  if (kuehl("erdbeben")) {
    for (const zone of ["kaf", "daf", "baf"] as BebenZone[]) {
      if (monatsWurf(w.seed, `beben|${zone}`, m) < KATASTROPHE.bebenChance[zone]) return { art: "erdbeben", zone, provinzen: [] };
    }
  }
  // 2. Sturzflut am Schwarzen Meer (Herbst)
  if (kuehl("flut") && mZahl >= 8 && mZahl <= 11 && monatsWurf(w.seed, "flut", m) < KATASTROPHE.flutChance) return { art: "flut", provinzen: [] };
  // 3. Großbrand an Ägäis und Mittelmeer (Sommer)
  if (kuehl("waldbrand") && mZahl >= 6 && mZahl <= 9 && monatsWurf(w.seed, "brand", m) < KATASTROPHE.brandChance) return { art: "waldbrand", provinzen: [] };
  // 4. Dürre im Konya-Becken, gekoppelt an den Wassermangel dort
  if (kuehl("duerre") && mZahl >= 5 && mZahl <= 9) {
    const mangel = isFinite(wertIn(w, "p_wassermangel", DUERRE_BECKEN)) ? wertIn(w, "p_wassermangel", DUERRE_BECKEN) / 60 : 0.5;
    if (monatsWurf(w.seed, "duerre", m) < KATASTROPHE.duerreChance * (0.5 + mangel)) return { art: "duerre", provinzen: [] };
  }
  return null;
}

/** Gewichteter Zug der betroffenen Provinzen: Risiko² × Einwohner (Beben) bzw. Einwohner (Rest). */
function zieheBetroffene(rng: Rng, kandidaten: number[], gewicht: (plaka: number) => number, n: number): number[] {
  const g = kandidaten.map((p) => Math.max(0, gewicht(p)));
  const out: number[] = [];
  for (let k = 0; k < n && k < kandidaten.length; k++) {
    const summe = g.reduce((a, b) => a + b, 0);
    if (summe <= 0) break;
    let r = rng.next() * summe;
    for (let i = 0; i < kandidaten.length; i++) {
      r -= g[i]!;
      if (r <= 0) {
        out.push(kandidaten[i]!);
        g[i] = 0;
        break;
      }
    }
  }
  return out;
}

// Der Ereignismotor (sim/ereignisse.ts) öffnet die Entscheidungs-Lage über diesen Haken —
// Importrichtung bleibt einseitig, das Modul kennt den Motor nicht.
type Oeffner = (w: World, vorlageId: string, rng: Rng, params: { provinzen: number[]; staerke: number; daten?: Record<string, number | string> }) => unknown;
let oeffner: Oeffner | null = null;
export function setzeKatastrophenOeffner(f: Oeffner): void {
  oeffner = f;
}

const VORLAGE_IDS: Record<KatastrophenArt, string> = { erdbeben: "grossbeben", flut: "katastrophe_flut", waldbrand: "katastrophe_waldbrand", duerre: "katastrophe_duerre" };

/** Löst die geplante Lage aus: Fall anlegen, Schaden rechnen, Entscheidungs-Ereignis öffnen (Auto-Stopp A). */
export function loeseAus(w: World, rng: Rng, a: Ausloeser): KatastropheFall | null {
  const z = katastrophenZustand(w);
  let provinzen: number[];
  let s: number;
  if (a.art === "erdbeben") {
    const kandidaten = ZONEN[a.zone!];
    // Epizentrum nach Risiko² × Einwohner, dann bis zu zwei Nachbarn der Zone mit Risiko ≥ 3
    provinzen = zieheBetroffene(rng, kandidaten, (p) => depremRisiko(p) ** 2 * (PROVINZEN[p - 1]?.bevoelkerung ?? 1), 1);
    const rest = kandidaten.filter((p) => !provinzen.includes(p) && depremRisiko(p) >= 3);
    provinzen.push(...zieheBetroffene(rng, rest, (p) => depremRisiko(p) * (PROVINZEN[p - 1]?.bevoelkerung ?? 1), rng.next() < 0.7 ? 2 : 1));
    s = 0.55 + rng.next() ** 1.2 * 0.45;
  } else if (a.art === "flut") {
    provinzen = zieheBetroffene(rng, FLUT_GEBIET, (p) => PROVINZEN[p - 1]?.bevoelkerung ?? 1, 1 + (rng.next() < 0.5 ? 1 : 0));
    s = 0.45 + rng.next() * 0.5;
  } else if (a.art === "waldbrand") {
    provinzen = zieheBetroffene(rng, BRAND_GEBIET, (p) => PROVINZEN[p - 1]?.bevoelkerung ?? 1, 1 + (rng.next() < 0.4 ? 1 : 0));
    s = 0.5 + rng.next() * 0.5;
  } else {
    provinzen = [...DUERRE_BECKEN];
    s = 0.5 + rng.next() * 0.5;
  }
  if (!provinzen.length) return null;
  const schaden = schadenBerechnen(w, a.art, provinzen, s);
  const fall: KatastropheFall = {
    id: `kat-${a.art}-${w.day}`,
    art: a.art,
    provinzen: [...provinzen].sort((x, y) => x - y),
    tag: w.day,
    datum: w.date,
    staerke: Math.round(s * 100) / 100,
    tote: schaden.tote,
    verletzte: schaden.verletzte,
    obdachlos: schaden.obdachlos,
    wohnungen: schaden.wohnungen,
    bereitschaft: schaden.bereitschaft,
    verhindert: schaden.verhindert,
    hilfe: { soforthilfe: false },
    privatGeliefert: 0,
  };
  z.faelle.push(fall);
  oeffner?.(w, VORLAGE_IDS[a.art], rng, { provinzen: fall.provinzen, staerke: s, daten: { fall: fall.id } });
  return fall;
}

// ---------------------------------------------------------------------------
// Sofortige Wirkung beim Eintreten (wird von der Ereignisvorlage als `eroeffne` gerufen)

const nf = (x: number, d = 0) => x.toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d });

/** Kurzbezeichnung der Stärke im Wortlaut. */
export function staerkeWort(s: number): string {
  return s >= 0.85 ? "verheerend" : s >= 0.65 ? "schwer" : "spürbar";
}

export function eroeffnungEffekte(w: World, fall: KatastropheFall): void {
  const s = fall.staerke;
  const pv = fall.provinzen;
  if (fall.art === "erdbeben") {
    wirke(w, "wohnungsbau", -14 * s, pv);
    wirke(w, "p_wohnungsnot", 16 * s, pv);
    wirke(w, "bauwirtschaft", -5 * s, pv);
    wirke(w, "lebenshaltung", 5 * s, pv);
    wirke(w, "wachstum_regional", -6 * s, pv);
    wirke(w, "p_erdbebengefahr", 10 * s, pv);
    vertrauenAendern(w, -2.5 * s);
  } else if (fall.art === "flut") {
    wirke(w, "verkehrsnetz", -8 * s, pv);
    wirke(w, "ernte", -5 * s, pv);
    wirke(w, "wohnungsbau", -4 * s, pv);
    wirke(w, "p_wohnungsnot", 5 * s, pv);
    vertrauenAendern(w, -1.2 * s);
  } else if (fall.art === "waldbrand") {
    wirke(w, "tourismus", -6 * s, pv);
    wirke(w, "landwirtschaft_einkommen", -4 * s, pv);
    wirke(w, "luftqualitaet", -6 * s, pv);
    vertrauenAendern(w, -0.8 * s);
  } else {
    wirke(w, "p_wassermangel", 12 * s, pv);
    wirke(w, "wasserversorgung", -8 * s, pv);
    wirke(w, "ernte", -6 * s, pv);
    wirke(w, "lebensmittelpreise", 4 * s, pv);
  }
  // Märkte: Risikoaufschlag und Lira reagieren sofort, die Realwirtschaft über den Auslastungsgrad
  w.economy.riskPremium = clamp(w.economy.riskPremium + 12 + 38 * s, 50, 2000);
  w.economy.usdTry *= 1 + 0.004 * s;
  w.economy.eurTry *= 1 + 0.004 * s;
  w.economy.outputGap -= 0.25 * s;
  // Migration: Wer das Dach verloren hat, zieht weiter — in die Metropolen steigt der Druck
  if (fall.wohnungen > 0) {
    wirke(w, "landflucht", 4 * s, pv);
    wirke(w, "p_landflucht", 3 * s, pv);
    wirke(w, "p_wohnungsnot", 2.5 * s, [34, 6, 35]);
    wirke(w, "mieten", 1.5 * s, [34, 6, 35]);
  }
  // Kurzfristig schließt sich das Land zusammen (Rallye-Effekt; verfliegt von selbst)
  const sp = w.spiel;
  if (sp) sp.umfrage.zustimmung = clamp(sp.umfrage.zustimmung + 1 + 1.5 * s, 0, 100);
}

// ---------------------------------------------------------------------------
// Hilfskette: Soforthilfe, Übergangsversorgung, Wiederaufbau

/** Soforthilfe (schnell, teuer, kostet Aufmerksamkeit): Rettung, Zelte, Feldlazarette. */
export function soforthilfe(w: World, fallId: string): string {
  const fall = fallMit(w, fallId);
  if (!fall || fall.hilfe.soforthilfe) return "Die Soforthilfe läuft bereits.";
  fall.hilfe.soforthilfe = true;
  const s = fall.staerke;
  const versicherung = nationalAverage(NET, w.net, "m_versicherungspflicht") / 100;
  const anteil = (0.1 * s + 0.04) * (1 - KATASTROPHE.versicherungEntlastung * versicherung);
  w.economy.debtRatio += anteil;
  w.economy.outputGap += 0.08 * anteil;
  if (fall.art === "erdbeben" || fall.art === "flut") {
    wirke(w, "p_wohnungsnot", -3 * s, fall.provinzen);
    wirke(w, "gesundheitsversorgung", -2 * s, fall.provinzen);
  }
  if (fall.art === "duerre") {
    wirke(w, "landwirtschaft_einkommen", 3 * s, fall.provinzen);
    wirke(w, "wasserversorgung", 3 * s, fall.provinzen);
  }
  vertrauenAendern(w, 1.5 * s);
  addLog(w, "entscheidung", `Soforthilfe nach ${ART_NAMEN[fall.art]} in ${namenVon(fall.provinzen)} angelaufen.`, `Kostet ${nf(anteil, 2)} % des BIP${versicherung > 0.3 ? " — die Pflichtversicherung trägt einen spürbaren Anteil" : ""}. Rettung, Zelte und Feldlazarette sind unterwegs.`);
  return "Rettungskräfte, Zelte und Feldlazarette sind unterwegs; die Schadenslage klärt sich schneller auf.";
}

/** Höhe der öffentlichen Wohnungs-Zusage: mehr versprechen bringt Zustimmung jetzt — und Schuld später. */
export function zusageFestlegen(w: World, fallId: string, stufe: keyof typeof KATASTROPHE.zusageStufen): string {
  const fall = fallMit(w, fallId);
  if (!fall || fall.wohnungen <= 0) return "Es gibt keinen zerstörten Wohnbestand, für den man versprechen könnte.";
  if (fall.zusage) return "Das öffentliche Versprechen steht bereits.";
  // Ein Versprechen, das kein Programm einlösen kann, wäre eine Falle mit garantiertem Wahlmalus
  if (!programmMoeglich(fall)) return t("katastrophe.zusage_unmoeglich");
  const wohnungen = Math.max(500, Math.round((fall.wohnungen * KATASTROPHE.zusageStufen[stufe]) / 500) * 500);
  fall.zusage = { wohnungen, geliefert: 0 };
  const zustimmung = stufe === "gross" ? 2.5 : stufe === "voll" ? 1.5 : 0.5;
  vertrauenAendern(w, zustimmung);
  const sp = w.spiel!;
  sp.umfrage.zustimmung = clamp(sp.umfrage.zustimmung + zustimmung * 0.6, 0, 100);
  addLog(
    w,
    "entscheidung",
    `Öffentliches Versprechen: ${nf(wohnungen)} neue Wohnungen für ${namenVon(fall.provinzen)}.`,
    "Was heute Applaus bringt, wird später gemessen: Geliefert wird, was das Wohnungsbau-Programm und die private Erholung tatsächlich fertigstellen.",
  );
  return `Der Präsident verspricht öffentlich ${nf(wohnungen)} neue Wohnungen. Das Land wird es sich merken.`;
}

/** Übergangsversorgung (Container, Heizung, Mietzuschüsse) über Monate; läuft im Monatsschritt. */
export function starteUebergang(w: World, fallId: string): { ok: boolean; text: string } {
  const fall = fallMit(w, fallId);
  if (!fall) return { ok: false, text: "Diesen Fall gibt es nicht." };
  if (fall.hilfe.uebergangBis !== undefined && fall.hilfe.uebergangBis > w.day) return { ok: false, text: "Die Übergangsversorgung läuft bereits." };
  if (!fall.hilfe.soforthilfe) return { ok: false, text: "Erst muss die Soforthilfe stehen." };
  fall.hilfe.uebergangBis = w.day + KATASTROPHE.uebergangTage;
  const bis = formatDateDe(addDays(w.date, KATASTROPHE.uebergangTage));
  addLog(w, "entscheidung", `Übergangsversorgung für ${namenVon(fall.provinzen)} bis ${bis}.`, `Container, Heizung und Mietzuschüsse kosten rund ${nf(KATASTROPHE.uebergangKosten * fall.staerke, 2)} % des BIP je Monat.`);
  return { ok: true, text: `Containerstädte, Heizung und Mietzuschüsse sind bis ${bis} gesichert.` };
}

/** Das Wohnungsbau-Programm als dynamisches Reich-Vorhaben: Es konkurriert wie jedes Großprojekt um Baukapazität — und verdrängt, was hinten steht. */
function wohnbauVorhaben(fall: KatastropheFall, p: NonNullable<KatastropheFall["wohnbau"]>): Vorhaben {
  const wo = namenVon(fall.provinzen);
  return {
    id: p.id,
    bereich: "infrastruktur",
    klasse: "grossprojekt",
    name: `Wohnungsbau-Programm ${wo}`,
    text: `Neubau von ${nf(p.bedarf)} Wohnungen im Katastrophengebiet (${ART_NAMEN[fall.art]} vom ${formatDateDe(fall.datum)}). Läuft über die gewöhnliche Bauvergabe: Es bindet Baukapazität und Verwaltungskraft wie jedes andere Großvorhaben.`,
    provinzen: fall.provinzen,
    voraus: [],
    kosten: { pk: 6, bau: p.bau, monate: p.monate, verwaltung: 2, schulden: p.schulden },
    abschluss: [
      { t: "knoten", id: "wohnungsbau", d: 8, provinzen: fall.provinzen },
      { t: "knoten", id: "p_wohnungsnot", d: -6, provinzen: fall.provinzen },
      { t: "knoten", id: "erdbebenvorsorge", d: 5, provinzen: fall.provinzen },
      { t: "knoten", id: "vertrauen_regierung", d: 2 },
    ],
    dauer: [{ t: "knoten", id: "wohnungsbau", d: 2, provinzen: fall.provinzen }],
    unterhalt: 0.4,
    kehrseite: "Verdrängt andere Bauvorhaben: Was hier zuerst baut, fehlt anderswo. Und jede Verzögerung wird als gebrochenes Versprechen gelesen.",
    verlierer: "Übrige Bauprogramme des Landes",
    bild: "stadt",
  };
}

/** Meldet das Wohnungsbau-Programm an und beginnt es (Vergabe wie bei jedem Reich-Vorhaben wählbar). */
export function beginneWiederaufbau(w: World, fallId: string, vergabe: Vergabe): { ok: boolean; text: string; why?: string } {
  const fall = fallMit(w, fallId);
  if (!fall) return { ok: false, text: "Diesen Fall gibt es nicht." };
  if (fall.art === "duerre" || fall.art === "waldbrand") return { ok: false, text: "Hier geht es nicht um zerstörte Wohnungen — Hilfe läuft über Sofort- und Übergangsversorgung." };
  if (fall.wohnbau) return { ok: false, text: "Das Wohnungsbau-Programm läuft bereits." };
  const bedarf = Math.max(fall.zusage?.wohnungen ?? 0, fall.wohnungen - fall.privatGeliefert);
  if (bedarf < KATASTROPHE.wiederaufbauMin) return { ok: false, text: "Der verbliebene Bedarf ist zu klein für ein eigenes Programm." };
  const versicherung = nationalAverage(NET, w.net, "m_versicherungspflicht") / 100;
  const p = {
    id: `kat_wohnbau_${fall.id}`,
    bedarf,
    bau: Math.max(60, Math.round(bedarf * KATASTROPHE.bauJeWohnung)),
    monate: Math.max(12, Math.round(bedarf * KATASTROPHE.monateJeWohnung)),
    schulden: Math.round(bedarf * KATASTROPHE.schuldenJeWohnung * (1 - KATASTROPHE.versicherungEntlastung * versicherung) * 100) / 100,
    vergabe,
  };
  fall.wohnbau = p;
  registriereVorhaben(wohnbauVorhaben(fall, p));
  const r = beginne(w, p.id, vergabe);
  if (!r.ok) {
    fall.wohnbau = undefined;
    return r;
  }
  addLog(w, "entscheidung", `Wohnungsbau-Programm für ${namenVon(fall.provinzen)} beschlossen (${nf(bedarf)} Wohnungen).`, `Es konkurriert mit allen anderen Bauvorhaben um die Baukapazität des Landes; Kosten rund ${nf(p.schulden, 2)} % des BIP über die Bauzeit.`);
  return r;
}

// ---------------------------------------------------------------------------
// Nebel der ersten Tage: bekannt / vermutet / unsicher

export function nebelStufe(w: World, fall: KatastropheFall): NebelStufe {
  const dt = w.day - fall.tag;
  const bekanntAb = fall.hilfe.soforthilfe ? KATASTROPHE.nebelBekanntMitHilfe : KATASTROPHE.nebelBekannt;
  if (dt >= bekanntAb) return "bekannt";
  if (dt >= KATASTROPHE.nebelVermutet) return "vermutet";
  return "unsicher";
}

/** Eine Zahl der Schadenslage, wie sie der Stand der Aufklärung zeigt (Bandbreite, nie erfundene Genauigkeit). */
export function schaetzung(w: World, fall: KatastropheFall, wert: number): string {
  const stufe = nebelStufe(w, fall);
  if (stufe === "bekannt") return nf(wert);
  if (stufe === "vermutet") return `${nf(Math.round(wert * 0.7))} bis ${nf(Math.round(wert * 1.35))} (vermutet)`;
  return "noch unklar";
}

// ---------------------------------------------------------------------------
// Versprechensschuld: Fortschritt, Bilanz, Wahl-Malus
// (Mahnung als Referenz: 2023 versprach die Regierung 319.000 Wohnungen in einem Jahr;
//  im Februar 2025 waren 201.431 übergeben — wer verspricht, wird gemessen.)

export interface VersprechenZeile {
  fallId: string;
  art: KatastrophenArt;
  ort: string;
  versprochen: number;
  geliefert: number;
  /** 0 bis 1 */
  quote: number;
  imBau: boolean;
}

export function versprechensLage(w: World): VersprechenZeile[] {
  const z = w.spiel?.katastrophen;
  if (!z) return [];
  const out: VersprechenZeile[] = [];
  const reich = w.spiel?.reich;
  for (const f of z.faelle) {
    if (!f.zusage) continue;
    out.push({
      fallId: f.id,
      art: f.art,
      ort: namenVon(f.provinzen),
      versprochen: f.zusage.wohnungen,
      geliefert: Math.min(f.zusage.wohnungen, f.zusage.geliefert + f.privatGeliefert),
      quote: clamp((f.zusage.geliefert + f.privatGeliefert) / f.zusage.wohnungen, 0, 1),
      imBau: !!f.wohnbau && !!reich?.laufend.some((l) => l.id === f.wohnbau!.id),
    });
  }
  return out;
}

/** Wahl-Malus aus der Unwucht zwischen Zusage und Lieferung (Amtsende, sim/spiel.ts). */
export function versprechensschuldMalus(w: World): { punkte: number; text: string } {
  const zeilen = versprechensLage(w);
  let punkte = 0;
  const teile: string[] = [];
  for (const z of zeilen) {
    const fall = fallMit(w, z.fallId)!;
    if (w.day - fall.tag < 180) continue; // Was gerade erst geschah, wird nicht schon gemessen
    const unwucht = 1 - z.quote;
    if (unwucht <= 0.05) continue;
    const anteil = unwucht * KATASTROPHE.malusBasis * (0.5 + 0.5 * fall.staerke) * (z.imBau ? 0.6 : 1);
    punkte += anteil;
    teile.push(`${z.ort}: ${nf(z.geliefert)} von ${nf(z.versprochen)} versprochenen Wohnungen geliefert${z.imBau ? " (das Programm läuft noch)" : ""}`);
  }
  punkte = Math.min(KATASTROPHE.malusDeckel, punkte);
  const text =
    punkte > 0
      ? `Die Versprechen nach ${teile.length === 1 ? "der Katastrophe" : "den Katastrophen"} holen die Regierung ein: ${teile.join("; ")}. Die Wähler erinnern sich — Zustimmung −${nf(punkte, 1)} Punkte.`
      : "";
  return { punkte: Math.round(punkte * 10) / 10, text };
}

/** Bilanz-Absatz der Katastrophen dieser Amtszeit (sim/bilanz.ts). */
export function katastrophenBilanz(w: World): string | null {
  const z = w.spiel?.katastrophen;
  if (!z || !z.faelle.length) return null;
  const tote = z.faelle.reduce((s, f) => s + f.tote, 0);
  const namen = z.faelle.map((f) => `${ART_NAMEN[f.art]} in ${namenVon(f.provinzen)} (${formatDateDe(f.datum)})`).join("; ");
  const zeilen = versprechensLage(w);
  const offen = zeilen.filter((x) => x.quote < 0.95);
  let satz = `Katastrophen der Amtszeit: ${namen}. Insgesamt ${nf(tote)} Todesopfer zu beklagen.`;
  if (zeilen.length) {
    const summe = (f: (x: VersprechenZeile) => number) => zeilen.reduce((s, x) => s + f(x), 0);
    satz += ` Von ${nf(summe((x) => x.versprochen))} versprochenen Wohnungen wurden ${nf(summe((x) => x.geliefert))} geliefert.`;
    // Die Mahnung bleibt die Referenz: 2023 waren 319.000 Wohnungen versprochen, 201.431 geliefert.
    if (offen.length) satz += " Das Versprechen von damals — 319.000 versprochene, 201.431 gelieferte Wohnungen — holt jede Regierung ein, die mehr verspricht, als sie baut.";
  }
  return satz;
}

// ---------------------------------------------------------------------------
// Monatsschritt: Auslöser, Hilfskette, Lieferfortschritt

export function katastropheMonat(w: World, rng: Rng): void {
  const sp = w.spiel;
  if (!sp || sp.ende) return;
  const z = katastrophenZustand(w);

  // 1. Neuer Fall? (deterministisch geplant, Stärke und Orte aus dem Rng)
  const geplant = geplanterAusloeser(w);
  if (geplant) loeseAus(w, rng, geplant);

  const reich = sp.reich ? reichZustand(w) : null;
  for (const fall of z.faelle) {
    if (fall.bewaeltigt) continue;
    // 2. Übergangsversorgung: Monatskosten, kleine Linderung vor Ort
    if (fall.hilfe.uebergangBis !== undefined && fall.hilfe.uebergangBis > w.day) {
      const kosten = KATASTROPHE.uebergangKosten * fall.staerke;
      w.economy.debtRatio += kosten;
      wirke(w, "p_wohnungsnot", -0.6, fall.provinzen);
      if (w.day - fall.tag === 60) vertrauenAendern(w, 0.4);
    }
    // 3. Lieferfortschritt des Wohnungsbau-Programms (geliefert X von Y Wohnungen); die Zusage zieht mit, soweit es eine gibt
    if (fall.zusage && fall.wohnbau && reich) {
      const lieferung = programmLieferung(fall, reich);
      if (lieferung > 0) fall.zusage.geliefert = Math.min(fall.zusage.wohnungen, lieferung);
    }
    // 4. Private Erholung ohne (oder neben) dem Programm: bei großen Schäden gedeckelt (der Staat muss bauen), bei kleinen und bei
    //    Bränden ohne Deckel und schneller, weil dort kein Programm in Frage kommt
    const kleinfall = fall.art === "waldbrand" || fall.wohnungen < KATASTROPHE.wiederaufbauMin;
    const deckel = fall.wohnungen * (kleinfall ? 1 : KATASTROPHE.privatDeckel);
    const quote = kleinfall ? KATASTROPHE.privatQuoteKlein : KATASTROPHE.privatQuote;
    if (fall.wohnungen > 0 && w.day - fall.tag >= KATASTROPHE.privatNachTagen && fall.privatGeliefert < deckel) {
      fall.privatGeliefert = Math.min(deckel, fall.privatGeliefert + fall.wohnungen * quote);
    }
    // 4b. Zorn über zu wenig Hilfe: je mehr Tote, desto weniger verzeiht das Land eine schleppende Antwort
    zornMonat(w, fall, reich);
    // 5. Abgeschlossen: Bedarf gedeckt, Dürre abgeklungen oder Frist verstrichen
    const ausgang = abschlussPruefen(w, fall);
    if (ausgang) schliesse(w, fall, ausgang);
  }
}

/**
 * Hilfsstand eines Falls (0 bis 1): Soforthilfe und Übergangsversorgung zählen als Anfang, der Rest ist der gedeckte Wohnungsbedarf.
 * Fälle ohne Wohnungsbedarf (Dürre, kleine Brände) gelten als versorgt.
 */
export function hilfsStand(w: World, fall: KatastropheFall, reich: ReturnType<typeof reichZustand> | null): number {
  if (fall.wohnungen <= 0) return 1;
  const geliefert = (fall.zusage ? fall.zusage.geliefert : reich ? programmLieferung(fall, reich) : 0) + fall.privatGeliefert;
  const deckung = clamp(geliefert / fall.wohnungen, 0, 1);
  const anfang = (fall.hilfe.soforthilfe ? 0.25 : 0) + (fall.hilfe.uebergangBis !== undefined ? 0.15 : 0);
  return clamp(anfang + 0.6 * deckung, 0, 1);
}

export function zornMonat(w: World, fall: KatastropheFall, reich: ReturnType<typeof reichZustand> | null): void {
  const alter = w.day - fall.tag;
  if (fall.tote < KATASTROPHE.zornTote || alter < KATASTROPHE.zornVonTag || alter > KATASTROPHE.zornBisTag) return;
  const stufe = Math.log10(fall.tote / KATASTROPHE.zornTote);
  const zorn = KATASTROPHE.zornJeStufe * stufe * (1 - hilfsStand(w, fall, reich));
  if (zorn < 0.01) return;
  vertrauenAendern(w, -zorn);
  wirke(w, "legitimitaet", -0.4 * zorn);
  wirke(w, "vertrauen_regierung", -2 * zorn, fall.provinzen);
}

/** Schließt einen Fall und schreibt Protokoll und Chronik. */
function schliesse(w: World, fall: KatastropheFall, ausgang: Abschluss): void {
  const bedarf = fall.zusage?.wohnungen ?? fall.wohnungen;
  const reich = w.spiel?.reich ? reichZustand(w) : null;
  const geliefert = Math.round((fall.zusage ? fall.zusage.geliefert : programmLieferung(fall, reich)) + fall.privatGeliefert);
  const ort = namenVon(fall.provinzen);
  fall.bewaeltigt = w.day;
  if (ausgang === "frist") {
    const monate = Math.round((w.day - fall.tag) / 30.4);
    const mitZusage = !!fall.zusage && geliefert < bedarf * 0.95;
    addLog(
      w,
      "ereignis",
      t("katastrophe.frist_titel", { art: ART_NAMEN[fall.art], ort }),
      t(mitZusage ? "katastrophe.frist_text_zusage" : "katastrophe.frist_text", { monate, geliefert, bedarf }),
    );
    w.spiel!.chronik.push({ tag: w.day, datum: w.date, titel: t("katastrophe.frist_chronik_titel", { art: ART_NAMEN[fall.art] }), ausgang: t("katastrophe.frist_chronik_text", { ort, monate }) });
    return;
  }
  if (bedarf > 0) {
    addLog(w, "ereignis", `${ART_NAMEN[fall.art]} in ${ort}: Die Lage gilt als bewältigt.`, `${nf(geliefert)} von ${nf(bedarf)} Wohnungen sind wieder fertig; die Region steht wieder auf eigenen Beinen.`);
    w.spiel!.chronik.push({ tag: w.day, datum: w.date, titel: `${ART_NAMEN[fall.art]} bewältigt`, ausgang: `${ort} steht wieder: ${nf(geliefert)} von ${nf(bedarf)} Wohnungen geliefert.` });
    return;
  }
  addLog(w, "ereignis", `${ART_NAMEN[fall.art]} in ${ort}: Die Lage gilt als bewältigt.`, t("katastrophe.erholt_text", { ort }));
  w.spiel!.chronik.push({ tag: w.day, datum: w.date, titel: `${ART_NAMEN[fall.art]} bewältigt`, ausgang: t("katastrophe.erholt_chronik", { ort }) });
}

// ---------------------------------------------------------------------------
// Ansicht fürs Dossier (Oberfläche liest nur diese Sicht)

export function namenVon(provinzen: number[]): string {
  const n = provinzen.map((p) => PROVINZEN[p - 1]?.name ?? String(p));
  if (n.length === 1) return n[0]!;
  return `${n.slice(0, -1).join(", ")} und ${n[n.length - 1]}`;
}

export interface FallSicht {
  fall: KatastropheFall;
  titel: string;
  nebel: NebelStufe;
  /** Was die Bereitschaft nach Modellrechnung verhindert hat (Richtung und Bandbreite) */
  verhindertText: string;
  uebergang: { aktiv: boolean; restTage: number; kostenMonat: number };
  wiederaufbau: { moeglich: boolean; grund?: string; gestartet: boolean };
}

export function fallSicht(w: World, fall: KatastropheFall): FallSicht {
  const nebel = nebelStufe(w, fall);
  const v = fall.verhindert;
  const verhindertText =
    v.tote > 0 || v.wohnungen > 0
      ? `Die Bereitschaft (Stand ${fall.bereitschaft}) hat nach Modellrechnung etwa ${nf(v.tote)} Todesopfer${v.wohnungen > 0 ? ` und ${nf(v.wohnungen)} zerstörte Wohnungen` : ""} verhindert (Bandbreite ±25 %, Referenz: Bereitschaft 20).`
      : `Die Bereitschaft stand bei ${fall.bereitschaft} von 100 — eine bessere Vorsorge hätte die Opferzahlen spürbar gedrückt.`;
  const uebergangAktiv = fall.hilfe.uebergangBis !== undefined && fall.hilfe.uebergangBis > w.day;
  const wiederaufbauMoeglich = !fall.wohnbau && programmMoeglich(fall);
  return {
    fall,
    titel: `${ART_NAMEN[fall.art]} in ${namenVon(fall.provinzen)}`,
    nebel,
    verhindertText,
    uebergang: {
      aktiv: uebergangAktiv,
      restTage: uebergangAktiv ? fall.hilfe.uebergangBis! - w.day : 0,
      kostenMonat: Math.round(KATASTROPHE.uebergangKosten * fall.staerke * 1000) / 1000,
    },
    wiederaufbau: {
      moeglich: wiederaufbauMoeglich,
      ...(wiederaufbauMoeglich ? {} : { grund: fall.wohnbau ? "Das Programm läuft bereits." : fall.art !== "erdbeben" && fall.art !== "flut" ? "Hier geht es nicht um zerstörte Wohnungen." : "Der verbliebene Bedarf ist zu klein für ein eigenes Programm." }),
      gestartet: !!fall.wohnbau,
    },
  };
}

/** Dossier-Übersicht: Bereitschaft, offene und vergangene Fälle. */
export function dossier(w: World): { bereitschaft: number; sichten: FallSicht[]; versprechen: VersprechenZeile[] } {
  const z = katastrophenZustand(w);
  const sichten = [...z.faelle].sort((a, b) => b.tag - a.tag).map((f) => fallSicht(w, f));
  return { bereitschaft: Math.round(bereitschaft(w)), sichten, versprechen: versprechensLage(w) };
}

// ---------------------------------------------------------------------------
// Auskünfte für die Krisenstab-Ansicht (ui/katastrophe/*)
// Reine Lesefunktionen: Sie ändern nichts am Spielzustand und benutzen dieselben Spielparameter wie die Mechanik oben.

/** Um wie viel Prozent die Bereitschaft die Opferzahlen gegenüber einer Lage ohne Vorsorge (Stand 0) drückt. */
export function bereitSenkung(stand: number): number {
  return Math.round(KATASTROPHE.bereitWirkung * clamp(stand, 0, 100) * 10) / 10;
}

/** Um wie viel Prozent die Opferzahlen gegenüber der Referenz-Bereitschaft (Stand 20) niedriger (positiv) oder höher (negativ) ausfallen. */
export function bereitGegenReferenz(stand: number): number {
  return Math.round((1 - bereitFaktor(clamp(stand, 0, 100)) / bereitFaktor(KATASTROPHE.bereitReferenz)) * 1000) / 10;
}

const MONATSNAMEN = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];

export interface RisikoGebiet {
  plaka: number;
  name: string;
  /** Erdbeben-Risiko 1–5 (nur bei Beben) */
  risiko?: number;
  bevoelkerung: number;
}

export interface RisikoSicht {
  id: string;
  art: KatastrophenArt;
  titel: string;
  /** Gefährdete Provinzen, die am stärksten gefährdeten zuerst */
  gebiet: RisikoGebiet[];
  bevoelkerung: number;
  /** Ungefähre Wahrscheinlichkeit, dass sich die Lage in den nächsten zwölf Monaten ereignet (0 bis 1; Spielparameter) */
  jahresChance: number;
  saison: string;
  /** Monate seit dem letzten Fall dieser Art (undefined: noch nie) und Monate, bis die Abkühlzeit endet */
  letzteVor?: number;
  freiIn: number;
  /** Eine Kennzahl, die das Risiko trägt (Vorsorge im Gebiet bzw. Wassermangel) */
  kennzahl?: { name: string; wert: number; gut: "hoch" | "niedrig" };
}

function letzterFall(w: World, art: KatastrophenArt): KatastropheFall | undefined {
  return [...(w.spiel?.katastrophen?.faelle ?? [])].filter((f) => f.art === art).sort((a, b) => b.tag - a.tag)[0];
}

/** Überlebenswahrscheinlichkeit über die nächsten zwölf Monate, mit Saison und Abkühlzeit wie in `geplanterAusloeser`. */
function jahresChance(w: World, art: KatastrophenArt, pMonat: (monatszahl: number) => number): number {
  const letzter = letzterFall(w, art);
  const aktuell = monatszahl(w);
  let ueberlebt = 1;
  for (let k = 1; k <= 12; k++) {
    const vergangen = letzter ? (w.day + k * 30.4 - letzter.tag) / 30.4 : Infinity;
    if (vergangen < KATASTROPHE.abkuehlung[art]) continue;
    ueberlebt *= 1 - clamp(pMonat(((aktuell - 1 + k) % 12) + 1), 0, 1);
  }
  return Math.round((1 - ueberlebt) * 1000) / 1000;
}

function gebietListe(plakas: number[], mitRisiko: boolean): RisikoGebiet[] {
  const gewicht = (g: RisikoGebiet) => (mitRisiko ? (g.risiko ?? 1) ** 2 : 1) * g.bevoelkerung;
  return plakas
    .map((p) => ({
      plaka: p,
      name: PROVINZEN[p - 1]?.name ?? String(p),
      bevoelkerung: PROVINZEN[p - 1]?.bevoelkerung ?? 0,
      ...(mitRisiko ? { risiko: depremRisiko(p) } : {}),
    }))
    .sort((a, b) => gewicht(b) - gewicht(a));
}

const saisonText = (von: number, bis: number): string => `${MONATSNAMEN[von - 1]} bis ${MONATSNAMEN[bis - 1]}`;

/** Die Gefährdungslage des Landes: je Bruchzone und je leichter Gefahr eine Zeile (Chance, Saison, Abkühlzeit, tragende Kennzahl). */
export function risikoUebersicht(w: World): RisikoSicht[] {
  const out: RisikoSicht[] = [];
  const abk = (art: KatastrophenArt) => {
    const letzter = letzterFall(w, art);
    const seit = letzter ? Math.round(((w.day - letzter.tag) / 30.4) * 10) / 10 : undefined;
    return { ...(seit !== undefined ? { letzteVor: seit } : {}), freiIn: seit === undefined ? 0 : Math.max(0, Math.ceil(KATASTROPHE.abkuehlung[art] - seit)) };
  };
  const summe = (g: RisikoGebiet[]) => g.reduce((s, x) => s + x.bevoelkerung, 0);

  for (const zone of ["kaf", "daf", "baf"] as BebenZone[]) {
    const gebiet = gebietListe(ZONEN[zone], true);
    const hoch = gebiet.filter((g) => (g.risiko ?? 0) >= 4).map((g) => g.plaka);
    const ziel = hoch.length ? hoch : gebiet.map((g) => g.plaka);
    const vorsorge = (wertIn(w, "erdbebenvorsorge", ziel) + wertIn(w, "bauqualitaet", ziel)) / 2;
    out.push({
      id: `beben-${zone}`,
      art: "erdbeben",
      titel: `Erdbeben: ${ZONEN_NAMEN[zone]}`,
      gebiet,
      bevoelkerung: summe(gebiet),
      jahresChance: jahresChance(w, "erdbeben", () => KATASTROPHE.bebenChance[zone]),
      saison: "ganzjährig",
      ...abk("erdbeben"),
      ...(Number.isFinite(vorsorge) ? { kennzahl: { name: "Vorsorge in den Hochrisiko-Provinzen", wert: Math.round(vorsorge), gut: "hoch" as const } } : {}),
    });
  }
  const flut = gebietListe(FLUT_GEBIET, false);
  out.push({
    id: "flut",
    art: "flut",
    titel: "Sturzflut am Schwarzen Meer",
    gebiet: flut,
    bevoelkerung: summe(flut),
    jahresChance: jahresChance(w, "flut", (m) => (m >= 8 && m <= 11 ? KATASTROPHE.flutChance : 0)),
    saison: saisonText(8, 11),
    ...abk("flut"),
  });
  const brand = gebietListe(BRAND_GEBIET, false);
  out.push({
    id: "waldbrand",
    art: "waldbrand",
    titel: "Großbrand an Ägäis und Mittelmeer",
    gebiet: brand,
    bevoelkerung: summe(brand),
    jahresChance: jahresChance(w, "waldbrand", (m) => (m >= 6 && m <= 9 ? KATASTROPHE.brandChance : 0)),
    saison: saisonText(6, 9),
    ...abk("waldbrand"),
  });
  const duerre = gebietListe(DUERRE_BECKEN, false);
  const mangel = wertIn(w, "p_wassermangel", DUERRE_BECKEN);
  out.push({
    id: "duerre",
    art: "duerre",
    titel: "Dürre im Konya-Becken",
    gebiet: duerre,
    bevoelkerung: summe(duerre),
    jahresChance: jahresChance(w, "duerre", (m) => (m >= 5 && m <= 9 ? KATASTROPHE.duerreChance * (0.5 + (Number.isFinite(mangel) ? mangel / 60 : 0.5)) : 0)),
    saison: saisonText(5, 9),
    ...abk("duerre"),
    ...(Number.isFinite(mangel) ? { kennzahl: { name: "Wassermangel im Becken", wert: Math.round(mangel), gut: "niedrig" as const } } : {}),
  });
  return out;
}

export interface SzenarioZeile {
  name: string;
  stand: number;
  tote: number;
  verletzte: number;
  obdachlos: number;
  wohnungen: number;
}

/**
 * „Was wäre, wenn …“: der Schaden einer Lage bei verschiedenen Bereitschaftsständen. Rechnet mit `schadenBerechnen` für den heutigen Stand
 * und skaliert für die übrigen Stände mit dem Bereitschafts-Faktor (alle Opferzahlen sind in diesem Modell proportional dazu).
 * Dürre fordert keine direkten Opfer und liefert nur Nullen.
 */
export function szenario(w: World, art: KatastrophenArt, provinzen: number[], staerke: number, staende: { name: string; stand: number }[]): SzenarioZeile[] {
  const heute = schadenBerechnen(w, art, provinzen, staerke);
  const fHeute = bereitFaktor(bereitschaft(w));
  return staende.map(({ name, stand }) => {
    const f = bereitFaktor(clamp(stand, 0, 100)) / fHeute;
    return {
      name,
      stand,
      tote: Math.round(heute.tote * f),
      verletzte: Math.round(heute.verletzte * f),
      obdachlos: Math.round(heute.obdachlos * f),
      wohnungen: Math.round(heute.wohnungen * f),
    };
  });
}

export type KettenStatus = "erledigt" | "laeuft" | "offen" | "gesperrt" | "entfaellt";

export interface KettenStufe {
  id: "nothilfe" | "uebergang" | "wiederaufbau" | "bewaeltigt";
  name: string;
  status: KettenStatus;
  /** Ein Satz zum Stand */
  detail: string;
  /** 0 bis 1, wo es einen Fortschritt gibt */
  fortschritt?: number;
}

/** Die Hilfskette eines Falls als Stufen mit Stand: Nothilfe, Übergangsversorgung, Wiederaufbau, Bewältigung. */
export function hilfsketteSicht(w: World, fall: KatastropheFall): KettenStufe[] {
  const ketten: KettenStufe[] = [];
  const kostenMonat = nf(KATASTROPHE.uebergangKosten * fall.staerke, 3);

  ketten.push({
    id: "nothilfe",
    name: "Nothilfe",
    status: fall.hilfe.soforthilfe ? "erledigt" : "offen",
    detail: fall.hilfe.soforthilfe ? "Rettung, Zelte und Feldlazarette sind geleistet." : "Rettung, Zelte und Feldlazarette stehen aus; ohne Hilfe bleibt die Schadenslage länger im Nebel.",
  });

  const uebergangAktiv = fall.hilfe.uebergangBis !== undefined && fall.hilfe.uebergangBis > w.day;
  const uebergangVorbei = fall.hilfe.uebergangBis !== undefined && fall.hilfe.uebergangBis <= w.day;
  const monate = Math.round(KATASTROPHE.uebergangTage / 30);
  ketten.push({
    id: "uebergang",
    name: "Übergangsversorgung",
    status: uebergangAktiv ? "laeuft" : uebergangVorbei ? "erledigt" : fall.hilfe.soforthilfe ? "offen" : "gesperrt",
    detail: uebergangAktiv
      ? (() => {
          const rest = Math.max(1, Math.round((fall.hilfe.uebergangBis! - w.day) / 30));
          return `Noch ${rest} ${rest === 1 ? "Monat" : "Monate"}, etwa ${kostenMonat} % des BIP je Monat.`;
        })()
      : uebergangVorbei
        ? "Ausgelaufen: Container, Heizung und Mietzuschüsse sind beendet."
        : fall.hilfe.soforthilfe
          ? `Container, Heizung und Mietzuschüsse: etwa ${kostenMonat} % des BIP je Monat über ${monate} Monate.`
          : "Erst nach der Nothilfe möglich.",
    ...(uebergangAktiv ? { fortschritt: clamp(1 - (fall.hilfe.uebergangBis! - w.day) / KATASTROPHE.uebergangTage, 0, 1) } : {}),
  });

  const reich = w.spiel?.reich ? reichZustand(w) : null;
  const lauf = fall.wohnbau && reich ? reich.laufend.find((l) => l.id === fall.wohnbau!.id) : undefined;
  const def = fall.wohnbau ? vorhabenDef(fall.wohnbau.id) : undefined;
  const fertig = !!fall.wohnbau && !!reich?.bestand[fall.wohnbau.id];
  const braucht = (fall.art === "erdbeben" || fall.art === "flut") && fall.wohnungen > 0;
  if (!braucht) {
    ketten.push({ id: "wiederaufbau", name: "Wiederaufbau", status: "entfaellt", detail: "Kein zerstörter Wohnbestand: Hier hilft die Versorgung, ein Bauprogramm gibt es nicht." });
  } else if (fertig) {
    ketten.push({ id: "wiederaufbau", name: "Wiederaufbau", status: "erledigt", detail: "Das Wohnungsbau-Programm ist fertiggestellt.", fortschritt: 1 });
  } else if (lauf && def) {
    const eintrag = warteschlange(w).find((e) => e.id === lauf.id);
    const anteil = clamp(lauf.fortschritt / laufBau(lauf, def), 0, 1);
    ketten.push({
      id: "wiederaufbau",
      name: "Wiederaufbau",
      status: "laeuft",
      detail: `Im Bau zu ${Math.round(anteil * 100)} Prozent${eintrag ? `, Position ${eintrag.position} der Baureihenfolge${eintrag.fertigIn !== undefined ? `, fertig in etwa ${eintrag.fertigIn} Monaten` : ""}` : ""}.`,
      fortschritt: anteil,
    });
  } else if (fall.wohnbau) {
    ketten.push({ id: "wiederaufbau", name: "Wiederaufbau", status: "laeuft", detail: "Das Programm ist angemeldet und wartet in der Baureihenfolge." });
  } else if (fall.wohnungen - fall.privatGeliefert >= KATASTROPHE.wiederaufbauMin) {
    ketten.push({ id: "wiederaufbau", name: "Wiederaufbau", status: "offen", detail: `Noch nicht angemeldet: Bedarf etwa ${nf(Math.round(fall.wohnungen - fall.privatGeliefert))} Wohnungen. Das Programm bindet Baukapazität und verdrängt, was hinten steht.` });
  } else {
    ketten.push({ id: "wiederaufbau", name: "Wiederaufbau", status: "entfaellt", detail: "Der verbliebene Bedarf ist zu klein für ein eigenes Programm." });
  }

  const bedarf = fall.zusage?.wohnungen ?? fall.wohnungen;
  const geliefert = (fall.zusage ? fall.zusage.geliefert : programmLieferung(fall, reich)) + fall.privatGeliefert;
  const frist = KATASTROPHE.fristMonate[fall.art];
  if (fall.bewaeltigt) {
    ketten.push({ id: "bewaeltigt", name: "Bewältigt", status: "erledigt", detail: "Die Region steht wieder auf eigenen Beinen.", fortschritt: 1 });
  } else if (bedarf > 0) {
    ketten.push({
      id: "bewaeltigt",
      name: "Bewältigt",
      status: "offen",
      detail: t("katastrophe.kette_bewaeltigt", { geliefert: Math.round(geliefert), bedarf, frist }),
      fortschritt: clamp(geliefert / bedarf, 0, 1),
    });
  } else {
    // Dürre und Brände ohne zerstörten Wohnbestand: Die Lage klingt ab
    const monate = clamp((w.day - fall.tag) / 30.4 / frist, 0, 1);
    ketten.push({
      id: "bewaeltigt",
      name: "Bewältigt",
      status: "offen",
      detail: t(fall.art === "duerre" ? "katastrophe.kette_duerre" : "katastrophe.kette_ohne_bedarf", { min: KATASTROPHE.duerreMindestMonate, frist }),
      fortschritt: monate,
    });
  }
  return ketten;
}
