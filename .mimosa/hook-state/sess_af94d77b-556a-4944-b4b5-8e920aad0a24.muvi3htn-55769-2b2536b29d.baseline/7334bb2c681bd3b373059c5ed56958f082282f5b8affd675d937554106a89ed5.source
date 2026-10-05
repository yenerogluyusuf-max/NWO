// Die Spielfigur im Prolog: Aussehen wählen oder würfeln, Namen vorschlagen und die Haltung der Figur mit den Antworten verändern.
// Das Gesicht zeichnet ui/art/Portraet.tsx; `portraetFuer` liefert dafür alle Angaben, damit es überall gleich aussieht (Prolog, Zeitung, Wahlnacht).

import type { Aussehen, PlayerProfile } from "../../sim/prolog";
import { ANZAHL_FRISUREN, type PortraetProps, type Stimmung } from "../art/Portraet";

/** Anzahl der wählbaren Gesichtsformen (jede ist ein anderer Samen: Kopfform, Augen, Nase, Haut) */
export const GESICHTSFORMEN = 16;
/** Frisuren je Geschlecht, die der Wähler durchblättert (Zeichenparameter; die Liste der Porträts ist etwas länger) */
export const FRISUREN = Math.floor(ANZAHL_FRISUREN / 2);
export const ALTER_VON = 40;
export const ALTER_BIS = 66;
export const BAERTE: Aussehen["bart"][] = ["keiner", "stoppel", "schnurr", "kinn", "voll"];

export function standardAussehen(): Aussehen {
  return { geschlecht: "f", alter: 52, gesicht: 3, haare: 0, brille: false, bart: "keiner", kopftuch: false };
}

const zahl = (rnd: () => number, von: number, bis: number): number => von + Math.floor(rnd() * (bis - von + 1));

/** Ein zufälliges Aussehen (Würfeln). */
export function wuerfleAussehen(rnd: () => number = Math.random): Aussehen {
  const geschlecht = rnd() < 0.5 ? "f" : "m";
  return {
    geschlecht,
    alter: zahl(rnd, ALTER_VON, ALTER_BIS),
    gesicht: zahl(rnd, 0, GESICHTSFORMEN - 1),
    haare: zahl(rnd, 0, FRISUREN - 1),
    brille: rnd() < 0.25,
    bart: geschlecht === "m" ? BAERTE[zahl(rnd, 0, BAERTE.length - 1)]! : "keiner",
    kopftuch: geschlecht === "f" && rnd() < 0.15,
  };
}

/** Alle Angaben für das Porträt der Figur (ohne Alter, Farbe und Miene: Die gibt der Aufrufer nach Lage mit). */
export function portraetFuer(name: string, a: Aussehen | undefined): Pick<PortraetProps, "seed" | "geschlecht" | "brille" | "kopftuch" | "bart" | "haare" | "alter"> {
  if (!a) return { seed: name || "Deniz" };
  return { seed: `ich-${a.gesicht}`, geschlecht: a.geschlecht, brille: a.brille, kopftuch: a.geschlecht === "f" && a.kopftuch, bart: a.geschlecht === "m" ? a.bart : "keiner", haare: a.haare, alter: a.alter };
}

// ---------------------------------------------------------------------------
// Namen (häufige Vornamen und Familiennamen; zufällige Paare, keine Personen)

/** Türkische Vornamen, nach Geschlecht getrennt und ohne Namen, die bei beiden Geschlechtern vorkommen (Deniz, Ege, Umut …): Name und Gesicht passen immer zusammen. */
export const VORNAMEN_F = ["Elif", "Zeynep", "Ayşe", "Selin", "Defne", "Melis", "Esra", "Hande", "Burcu", "Leyla", "Nilüfer", "Aylin", "Gül", "Sevgi", "İpek", "Pınar", "Ceren", "Yasemin", "Seda", "Nur"];
export const VORNAMEN_M = ["Emre", "Can", "Burak", "Kerem", "Murat", "Cem", "Tolga", "Barış", "Onur", "Serkan", "Selim", "Hakan", "Kaan", "Volkan", "Orhan", "Levent", "Mehmet", "Ahmet", "Mustafa", "Yusuf"];
const FAMILIENNAMEN = ["Aydın", "Yıldız", "Kaya", "Demir", "Şahin", "Çelik", "Arslan", "Koç", "Öztürk", "Aksoy", "Polat", "Erdem", "Güneş", "Tekin", "Özkan", "Korkmaz", "Başar", "Işık", "Duman", "Türkmen", "Yücel", "Sönmez"];

/** Ein zufälliger Name zum Geschlecht (nie derselbe zweimal hintereinander, wenn `nicht` gegeben ist). */
export function zufallsName(geschlecht: "f" | "m", rnd: () => number = Math.random, nicht = ""): string {
  const vor = geschlecht === "f" ? VORNAMEN_F : VORNAMEN_M;
  for (let i = 0; i < 12; i++) {
    const n = `${vor[Math.floor(rnd() * vor.length)]} ${FAMILIENNAMEN[Math.floor(rnd() * FAMILIENNAMEN.length)]}`;
    if (n !== nicht) return n;
  }
  return `${vor[0]} ${FAMILIENNAMEN[0]}`;
}

/**
 * Der Name nach einer Änderung des Aussehens: Hat die Spielerin oder der Spieler den Namen selbst getippt, bleibt er; sonst bekommt ein Wechsel des
 * Geschlechts (oder `immer`, etwa beim Würfeln) sofort einen neuen Namen aus dem Pool des neuen Geschlechts. So passen Name und Gesicht immer zusammen.
 */
export function nameNachAenderung(alt: Aussehen, neu: Aussehen, name: string, vonHand: boolean, immer = false, rnd: () => number = Math.random): string {
  if (vonHand) return name;
  if (!immer && alt.geschlecht === neu.geschlecht) return name;
  return zufallsName(neu.geschlecht, rnd, name);
}

// ---------------------------------------------------------------------------
// Haltung der Figur mit den Antworten

const BERUF_FARBE: Record<string, string> = { Anwalt: "#2c3f66", Arzt: "#2f6b6a", Unternehmer: "#5b4632", Ökonom: "#3f6b45" };
const MOTIV_MIENE: Record<string, Stimmung> = { Ehrgeiz: "selbstgefaellig", Korruption: "veraergert", Mentor: "sicher" };
const NACHT_MIENE: Record<string, Stimmung> = { knapp: "muede", klar: "sicher", erste: "selbstgefaellig" };

export interface FigurLage {
  alter: number;
  /** Farbe der Kleidung und des Grundes: erst neutral, dann die des Berufs, dann die der Partei */
  tint: string;
  stimmung: Stimmung;
}

/**
 * Wie die Figur nach `schritt` Stationen aussieht: jünger am Anfang (das Alter wächst bis zur Wahlnacht), Kleidung nach Beruf und Partei,
 * Miene nach Motiv und Wahlnacht. Vor den Stationen (Schritt unter 0) und nach der letzten zeigt sie ihr Alter bei der Wahlnacht.
 */
export function figurLage(p: PlayerProfile, a: Aussehen, schritt: number, gesamt: number): FigurLage {
  const zurueck = schritt >= 0 && schritt < gesamt ? Math.round(((gesamt - schritt) / gesamt) * 28) : 0;
  const alter = Math.max(20, a.alter - zurueck);
  let tint = "#7a6a52";
  if (p.beruf && BERUF_FARBE[p.beruf]) tint = BERUF_FARBE[p.beruf]!;
  if (p.partei.kurz) tint = p.partei.farbe;
  let stimmung: Stimmung = "neutral";
  if (p.motiv) stimmung = MOTIV_MIENE[p.motiv] ?? (p.motiv.startsWith("Unglück") ? "besorgt" : "neutral");
  if (p.wahlStil) stimmung = NACHT_MIENE[p.wahlStil] ?? stimmung;
  return { alter, tint, stimmung };
}
