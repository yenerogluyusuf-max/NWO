// Kern der gezeichneten Porträts: Zufall aus dem Samen, Farben, Kurvenhilfen, Auswahl der Merkmale (Alter und Geschlecht gelten strikt,
// der Samen entscheidet nur, was die Eingaben offen lassen) und die Mienen. Maße kommen aus portraet-proportionen.ts.

import { kopfformVon, raster, KOPFFORMEN, type Raster } from "./portraet-proportionen";

export type P = [number, number];
export const f = (x: number): string => (Math.round(x * 100) / 100).toString();
export const spiegel = (pts: P[]): P[] => pts.map(([x, y]) => [100 - x, y] as P);

export function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function zufall(seed: string): () => number {
  let a = hash(seed) || 1;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const waehle = <T,>(r: () => number, liste: readonly T[]): T => liste[Math.floor(r() * liste.length) % liste.length]!;
export const klemme = (x: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, x));

// ---------------------------------------------------------------------------
// Farben

export function rgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const v = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  return [parseInt(v.slice(0, 2), 16) || 0, parseInt(v.slice(2, 4), 16) || 0, parseInt(v.slice(4, 6), 16) || 0];
}
export function mische(a: string, b: string, t: number): string {
  const [r1, g1, b1] = rgb(a);
  const [r2, g2, b2] = rgb(b);
  const k = klemme(t, 0, 1);
  const c = (x: number, y: number) => Math.round(x + (y - x) * k).toString(16).padStart(2, "0");
  return `#${c(r1, r2)}${c(g1, g2)}${c(b1, b2)}`;
}
export const dunkler = (c: string, t: number): string => mische(c, "#1a110b", t);
export const heller = (c: string, t: number): string => mische(c, "#fff4dc", t);

/** Hauttöne von hell bis dunkel (warm, malerisch); die Zahl dahinter ist der Hautton 1 bis 5 der Rasterbilder */
export const HAUT = ["#f2ddca", "#edd1b6", "#e3c0a0", "#d5ab8c", "#c4916f", "#a97a5e", "#8b5d45", "#6b4434"] as const;
export const HAUT_TON = [1, 1, 2, 3, 3, 4, 5, 5] as const;
/** Häufigkeit der Töne beim Würfeln (Zeichenparameter; helle und mittlere Töne häufiger) */
const HAUT_GEWICHT = [3, 4, 4, 3.4, 2.2, 1.5, 0.9, 0.5];
export const HAARE = ["#17100b", "#271a12", "#3d281a", "#59391f", "#7a502c", "#946a3b"] as const;
export const IRIS = ["#4a2f1b", "#5e3a1f", "#3b4a2c", "#34505f", "#5a5f66", "#6a4a2a"] as const;
export const STOFFE = ["#7b2f2a", "#2f5d62", "#5c4a86", "#a8732b", "#3f6b45", "#2c3f66", "#8a3a5e", "#5b5a52"] as const;

export function hautWaehlen(r: () => number): number {
  const sum = HAUT_GEWICHT.reduce((s, x) => s + x, 0);
  let x = r() * sum;
  for (let i = 0; i < HAUT_GEWICHT.length; i++) {
    x -= HAUT_GEWICHT[i]!;
    if (x <= 0) return i;
  }
  return 2;
}

// ---------------------------------------------------------------------------
// Kurven

/** Weiche Kurve durch Punkte (Catmull-Rom nach Bézier); geschlossen oder offen. */
export function glatt(pts: P[], zu = true, k = 0.19): string {
  const n = pts.length;
  const at = (i: number): P => (zu ? pts[((i % n) + n) % n]! : pts[Math.max(0, Math.min(n - 1, i))]!);
  let d = `M${f(pts[0]![0])} ${f(pts[0]![1])}`;
  const last = zu ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    const c1: P = [p1[0] + (p2[0] - p0[0]) * k, p1[1] + (p2[1] - p0[1]) * k];
    const c2: P = [p2[0] - (p3[0] - p1[0]) * k, p2[1] - (p3[1] - p1[1]) * k];
    d += ` C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
  }
  return zu ? d + " Z" : d;
}

// ---------------------------------------------------------------------------
// Eingaben und Mienen

export type Stimmung = "neutral" | "ernst" | "sicher" | "laechelnd" | "besorgt" | "veraergert" | "selbstgefaellig" | "muede" | "ueberrascht";
export const STIMMUNGEN: Stimmung[] = ["neutral", "ernst", "sicher", "laechelnd", "besorgt", "veraergert", "selbstgefaellig", "muede", "ueberrascht"];
export type Bartform = "keiner" | "stoppel" | "schnurr" | "kinn" | "voll";
export type Brillenform = "rund" | "oval" | "eckig" | "halb";

/** Die Rollen, die Kleidung und Hintergrund bestimmen (Ressorts und Ämter des Spiels). */
export type Rolle = "finanzen" | "inneres" | "aussen" | "zentralbank" | "stab" | "opposition" | "justiz" | "generalstab" | "wirtschaft" | "partner" | (string & {});

export interface PortraetProps {
  /** Samen, meist der Name der Person */
  seed: string;
  /** Breite in Bildpunkten; die Höhe folgt (Seitenverhältnis 1 : 1,18) */
  size?: number;
  /** Das Geschlecht der Eingabe gilt strikt; fehlt es, entscheidet der Samen */
  geschlecht?: "f" | "m";
  /** Alter in Jahren; maßgeblich für Haut, Falten, Haarfarbe und Glatze; fehlt es, wählt der Samen (Spielparameter, 26 bis 70) */
  alter?: number;
  /** Farbe von Kleidung und Grund, etwa Parteifarbe oder Ressortfarbe */
  tint?: string;
  stimmung?: Stimmung;
  /** true = Brille; eine Form erzwingt sie */
  brille?: boolean | Brillenform;
  /** Kopftuch; fehlt die Angabe, tragen etwa 12 von 100 Frauen eines (aus dem Samen) */
  kopftuch?: boolean;
  bart?: Bartform;
  /** Frisur erzwingen (Index 0 bis 9, je Geschlecht) */
  haare?: number;
  /** Kopfform erzwingen (0 bis 11) */
  kopfform?: number;
  /** Rolle: bestimmt Kleidung (Uniform, Robe, Anzug) und den Hintergrund */
  rolle?: Rolle;
  /** Hintergrund der Rolle zeichnen (Standard: ja bei mindestens 56 px) */
  hintergrund?: boolean;
  rahmen?: "messing" | "tinte" | "keiner";
  /** Namensschild am unteren Rand (nur ab 190 px sichtbar) */
  namensschild?: string;
  /** Bewegung zulassen (Standard ja; bei kleinen Bildern ohnehin still) */
  lebendig?: boolean;
  /** Gemalte Rasterbilder verwenden, wenn das Manifest passende kennt (Standard: ja) */
  raster?: boolean;
  /** Kennzeichnung für Hilfstechnik; fehlt sie, bleibt das Bild stumm */
  titel?: string;
  /** Hilfslinien des Proportionsrasters einblenden (Prüfbild in kunst.html) */
  hilfslinien?: boolean;
  className?: string;
}

export interface Miene {
  brauI: number;
  brauA: number;
  bogen: number;
  dick: number;
  /** linke Braue zusätzlich verschoben (negativ = höher) */
  einseitig: number;
  /** Lidöffnung (1 = normal) */
  lid: number;
  unterlid: number;
  mundL: number;
  mundR: number;
  wolbung: number;
  oeffnung: number;
  zaehne: boolean;
  duenn: number;
  wange: number;
  lach: number;
  stirn: number;
  zorn: number;
  taschen: number;
  nasenfl: number;
}

const M0: Miene = { brauI: 0, brauA: 0, bogen: 1, dick: 1, einseitig: 0, lid: 1, unterlid: 0, mundL: 0, mundR: 0, wolbung: 0.4, oeffnung: 0, zaehne: false, duenn: 0.1, wange: 0, lach: 0, stirn: 0, zorn: 0, taschen: 0, nasenfl: 0 };
const mi = (o: Partial<Miene>): Miene => ({ ...M0, ...o });

/** Mienen: Unterschiede in Brauen, Lidern, Wangen und Mund, deutlich genug für 100 px (Spielparameter) */
export const MIENEN: Record<Stimmung, Miene> = {
  neutral: mi({}),
  ernst: mi({ brauI: 0.8, brauA: 0.5, bogen: 0.55, dick: 1.12, lid: 0.94, mundL: 0.5, mundR: 0.5, wolbung: -0.1, duenn: 0.45, stirn: 0.1, zorn: 0.2 }),
  sicher: mi({ brauI: -0.4, brauA: -0.7, bogen: 1.25, lid: 0.95, unterlid: 0.2, mundL: -1.4, mundR: -1.4, wolbung: 1.5, wange: 0.4, lach: 0.3 }),
  laechelnd: mi({ brauI: -0.3, brauA: -1.0, bogen: 1.25, lid: 0.8, unterlid: 0.7, mundL: -3.3, mundR: -3.3, wolbung: 3.0, oeffnung: 2.8, zaehne: true, duenn: 0, wange: 1, lach: 1 }),
  besorgt: mi({ brauI: -3.6, brauA: 1.2, bogen: 0.35, dick: 0.9, lid: 1.06, mundL: 1.9, mundR: 1.9, wolbung: -1.0, duenn: 0.35, stirn: 1, zorn: 0.35, taschen: 0.25 }),
  veraergert: mi({ brauI: 3.6, brauA: -1.8, bogen: 0.15, dick: 1.4, lid: 0.76, unterlid: 0.25, mundL: 2.4, mundR: 2.4, wolbung: -2.2, duenn: 0.75, zorn: 1, nasenfl: 1 }),
  selbstgefaellig: mi({ brauI: -0.4, brauA: -0.5, bogen: 1.5, einseitig: -3.6, lid: 0.7, mundL: 0.8, mundR: -3.0, wolbung: 1.0, wange: 0.35 }),
  muede: mi({ brauI: 0.9, brauA: 2.2, bogen: 0.4, lid: 0.5, mundL: 1.2, mundR: 1.2, wolbung: -0.6, taschen: 1, stirn: 0.1 }),
  ueberrascht: mi({ brauI: -5.2, brauA: -4.8, bogen: 1.9, lid: 1.5, mundL: 0, mundR: 0, wolbung: 0, oeffnung: 4.2, stirn: 1 }),
};

/** Die Miene einer Person aus ihrem Zustand: Groll, Amt auf Zeit, Ehrgeiz, Loyalität (Spielparameter der Schwellen). */
export function stimmungAus(z: { groll?: number; kommissarisch?: boolean; ehrgeiz?: number; loyalitaet?: number }): Stimmung {
  const groll = z.groll ?? 0;
  const ehrgeiz = z.ehrgeiz ?? 0;
  const loyal = z.loyalitaet ?? 55;
  if (groll >= 40) return "veraergert";
  if (z.kommissarisch) return "besorgt";
  if (ehrgeiz >= 65 && loyal < 70) return "selbstgefaellig";
  if (loyal >= 70) return "sicher";
  if (loyal < 40) return "besorgt";
  if (loyal < 50) return "muede";
  return "neutral";
}

// ---------------------------------------------------------------------------
// Auswahl der Merkmale

export interface Auswahl {
  rs: Raster;
  form: number;
  geschlecht: "f" | "m";
  alter: number;
  /** Faltenstärke 0 bis 1 aus dem Alter: unter 30 glatt, 30 bis 44 kaum, 45 bis 59 sichtbar, ab 60 tief */
  falten: number;
  /** Anteil grauer Haare insgesamt (0 bis 1) und nur an den Schläfen */
  grau: number;
  schlaefen: number;
  tonIdx: number;
  haut: string;
  hautS: string;
  hautL: string;
  hautW: string;
  haarBasis: string;
  haarFarbIdx: number;
  stil: number;
  glatze: boolean;
  iris: string;
  nasenBreite: number;
  nasenRuecken: number;
  spitze: number;
  augenform: number;
  neigung: number;
  lidfalte: number;
  brauForm: number;
  brauDick: number;
  lippen: number;
  ohr: number;
  brille: false | Brillenform;
  bart: Bartform;
  kopftuch: boolean;
  stoff: string;
  krawatte: boolean;
  tempo: number;
}

export function waehleAus(p: PortraetProps): Auswahl {
  const r = zufall(p.seed);
  const geschlecht = p.geschlecht ?? (r() < 0.5 ? "m" : "f");
  // feste Reihenfolge der Würfe: Eingaben ändern einzelne Merkmale, ohne die übrigen zu verschieben
  const alterS = Math.round(26 + r() * 44);
  const formS = Math.floor(r() * KOPFFORMEN.length);
  const tonIdx = hautWaehlen(r);
  const stilIdx = Math.floor(r() * 1000);
  const haarFarbIdx = Math.floor(r() * HAARE.length);
  const brilleS = r() < 0.24;
  const brillenform = waehle(r, ["rund", "oval", "eckig", "halb"] as const);
  const bartIdx = r();
  const kopftuchS = r() < 0.12;
  const iris = waehle(r, IRIS);
  const nasenBreite = 0.9 + r() * 0.22;
  const nasenRuecken = r();
  const spitze = r();
  const augenform = Math.floor(r() * 3);
  const neigung = r();
  const lidfalte = r();
  const brauForm = Math.floor(r() * 3);
  const brauDick = 0.85 + r() * 0.5;
  const lippen = r();
  const ohr = 0.9 + r() * 0.25;
  const stoff = waehle(r, STOFFE);
  const krawatte = r() < 0.72;
  const tempo = r();
  const glatzeWurf = r();

  const alter = Math.round(klemme(p.alter ?? alterS, 18, 95));
  const form = p.kopfform ?? formS;
  const rs = raster(form, geschlecht);
  const haut = HAUT[tonIdx]!;

  // Alter: Falten und Haarfarbe aus dem gewählten Alter, nie aus dem Samen
  const falten = alter < 30 ? 0 : alter < 45 ? ((alter - 30) / 15) * 0.22 : alter < 60 ? 0.22 + ((alter - 45) / 15) * 0.42 : 0.64 + Math.min(0.36, ((alter - 60) / 20) * 0.36);
  const grau = alter < 38 ? 0 : klemme((alter - 38) / 26, 0, 1);
  const schlaefen = alter < 40 ? 0 : klemme((alter - 40) / 14, 0, 1);

  // Haartracht: je Geschlecht zehn Stile; Glatze (Stil 3 der Männer) nur Männer ab 40, Geheimratsecken (Stil 4) nur ab 45
  let stil = (p.haare ?? stilIdx) % 10;
  let glatze = false;
  if (geschlecht === "m") {
    const pGlatze = alter < 40 ? 0 : klemme((alter - 38) / 70, 0, 0.34);
    if (p.haare === undefined) {
      if (glatzeWurf < pGlatze) stil = 3;
      else if (stil === 3) stil = 0;
      if (stil === 4 && alter < 45) stil = 1;
    } else if (stil === 3 && alter < 40) stil = 0;
    else if (stil === 4 && alter < 45) stil = 1;
    glatze = stil === 3;
  } else if (p.haare === undefined && alter >= 62 && stil % 5 === 3) {
    // ältere Frauen tragen selten den langen Zopf oder den Pferdeschwanz
    stil = 1;
  }

  const bartA = p.bart ?? (geschlecht === "m" ? (bartIdx < 0.55 ? "keiner" : bartIdx < 0.7 ? "stoppel" : bartIdx < 0.84 ? "schnurr" : bartIdx < 0.92 ? "kinn" : "voll") : "keiner");
  const brille: false | Brillenform = typeof p.brille === "string" ? p.brille : (p.brille ?? brilleS) ? brillenform : false;

  return {
    rs,
    form,
    geschlecht,
    alter,
    falten,
    grau,
    schlaefen,
    tonIdx,
    haut,
    hautS: mische(haut, "#7a4524", 0.34),
    hautL: heller(haut, 0.34),
    hautW: mische(haut, "#c4584a", 0.3),
    haarBasis: HAARE[haarFarbIdx]!,
    haarFarbIdx,
    stil,
    glatze,
    iris,
    nasenBreite,
    nasenRuecken,
    spitze,
    augenform,
    neigung,
    lidfalte,
    brauForm,
    brauDick,
    lippen,
    ohr,
    brille,
    bart: bartA,
    kopftuch: p.kopftuch ?? (geschlecht === "f" && kopftuchS),
    stoff,
    krawatte,
    tempo,
  };
}

export { kopfformVon };
