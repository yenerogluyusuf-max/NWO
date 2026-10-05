// Verbindliche Proportionen der gezeichneten Porträts. Der Renderer (Portraet.tsx) rechnet jede Maße AUS DIESER DATEI (`raster`),
// die Tests (test/portraet-proportionen.test.ts) prüfen für alle Kopfformen und beide Geschlechter nach, dass jedes Element
// innerhalb der Toleranz liegt, und kunst.html blendet die Hilfslinien dieses Rasters über die Galerie.
//
// Maße des Erwachsenenkopfs (H = Höhe vom Scheitel einschließlich Haare bis zum Kinn), Vorgaben des Projektinhabers vom 05.10.2026:
//   Schädelbreite ≈ 0,72 H · Augenlinie 0,50 H (± 0,03) · Abstand zwischen den Augen = eine Augenbreite · Augenbreite ≈ 0,20 der Kopfbreite
//   Brauen ≈ 0,06 H über der Augenlinie · Nasenspitze ≈ 0,68 H · Mundlinie ≈ 0,80 H · Mundbreite ≈ 0,5 der Kopfbreite
//   Ohren zwischen Brauenlinie und Nasenunterkante am Kopfrand · Haaransatz ≈ 0,18 H · Kinn 1,0 H · Hals ≈ 0,5 der Kopfbreite
//   Schultern 2,2 bis 2,6 Kopfbreiten. Frauen und Männer unterscheiden sich in Kiefer, Brauen, Hals und Schulterbreite, nicht im Raster.
// Alle Zahlen sind Zeichenparameter, keine Tatsachenbehauptungen. Einheit: Bildpunkte des Porträt-Koordinatensystems (viewBox 124 × 144).

/** Das Oval, in das jedes Porträt geschnitten wird (Mitte und Halbachsen). */
export const OVAL = { cx: 50, cy: 64, rx: 50, ry: 64 } as const;

/** Kopfhöhe H und Lage des Scheitels (einschließlich Haare): der Kopf füllt etwa 70 Prozent der Ovalhöhe. */
export const KOPFHOEHE = 90;
export const KOPF_OBEN = 9;

export interface Soll {
  soll: number;
  tol: number;
}

export const SOLL = {
  /** Kopfhöhe im Verhältnis zur Höhe des Ovals (Vorgabe: etwa 72 Prozent) */
  kopfAnteil: { soll: 0.72, tol: 0.04 },
  /** Schädelbreite (Haut, ohne Haare) im Verhältnis zu H */
  schaedelBreite: { soll: 0.72, tol: 0.06 },
  /** Lage der Augenlinie in H, vom Scheitel gemessen */
  augenlinie: { soll: 0.5, tol: 0.03 },
  /** Augenbreite im Verhältnis zur Kopfbreite */
  augenBreite: { soll: 0.2, tol: 0.025 },
  /** Abstand zwischen den inneren Augenwinkeln in Augenbreiten */
  augenAbstand: { soll: 1.0, tol: 0.15 },
  /** Höhe der Brauen über der Augenlinie in H */
  braue: { soll: 0.06, tol: 0.015 },
  nasenspitze: { soll: 0.68, tol: 0.03 },
  mundlinie: { soll: 0.8, tol: 0.02 },
  /** Mundbreite im Verhältnis zur Kopfbreite */
  mundBreite: { soll: 0.47, tol: 0.06 },
  haaransatz: { soll: 0.18, tol: 0.03 },
  /** Halsbreite im Verhältnis zur Kopfbreite */
  hals: { soll: 0.5, tol: 0.06 },
  /** Schulterbreite in Kopfbreiten */
  schultern: { min: 2.2, max: 2.6 },
} as const;

export type Geschlecht = "f" | "m";

/**
 * Kopfformen: Sie verändern Breite, Wangen, Kiefer und Kinn innerhalb des Rasters, nie die Linien des Rasters.
 * `breite` ist ein Faktor auf die Sollbreite, `kiefer` die Kantigkeit (0,55 rund bis 0,95 eckig), `kinn` die Kinnbreite im
 * Verhältnis zur Kopfbreite, `wange` die Fülle der Wangen unter den Jochbeinen.
 */
export interface Kopfform {
  breite: number;
  kiefer: number;
  kinn: number;
  wange: number;
}

export const KOPFFORMEN: readonly Kopfform[] = [
  { breite: 1.0, kiefer: 0.78, kinn: 0.36, wange: 1.0 },
  { breite: 0.96, kiefer: 0.62, kinn: 0.3, wange: 0.98 },
  { breite: 1.04, kiefer: 0.9, kinn: 0.44, wange: 1.02 },
  { breite: 0.98, kiefer: 0.7, kinn: 0.4, wange: 1.04 },
  { breite: 1.02, kiefer: 0.58, kinn: 0.34, wange: 1.03 },
  { breite: 1.05, kiefer: 0.84, kinn: 0.38, wange: 0.99 },
  { breite: 0.95, kiefer: 0.74, kinn: 0.32, wange: 0.97 },
  { breite: 1.01, kiefer: 0.94, kinn: 0.46, wange: 1.0 },
  { breite: 0.97, kiefer: 0.66, kinn: 0.42, wange: 1.05 },
  { breite: 1.03, kiefer: 0.8, kinn: 0.31, wange: 0.96 },
  { breite: 0.99, kiefer: 0.88, kinn: 0.35, wange: 1.02 },
  { breite: 1.06, kiefer: 0.72, kinn: 0.45, wange: 1.0 },
];

/** Alle Maße eines Kopfes in Bildpunkten, abgeleitet aus Kopfform und Geschlecht. */
export interface Raster {
  H: number;
  oben: number;
  kinnY: number;
  /** Breite der Haut des Schädels an den Jochbeinen (Kopfbreite) */
  kopfBreite: number;
  halbBreite: number;
  ey: number;
  augenBreite: number;
  /** Abstand zwischen den inneren Augenwinkeln */
  augenLuecke: number;
  /** Abstand der Augenmitten von der Mittellinie */
  ex: number;
  braueY: number;
  nasenspitzeY: number;
  nasenbasisY: number;
  mundY: number;
  mundBreite: number;
  ohrenOben: number;
  ohrenUnten: number;
  /** Abstand der Ohren (Kopfrand) von der Mittellinie */
  ohrX: number;
  haaransatzY: number;
  halsBreite: number;
  schulterBreite: number;
  /** Höhe der Schulterlinie am Halsansatz */
  schulterY: number;
  kopfform: Kopfform;
  geschlecht: Geschlecht;
}

export const kopfformVon = (i: number): Kopfform => KOPFFORMEN[((Math.floor(i) % KOPFFORMEN.length) + KOPFFORMEN.length) % KOPFFORMEN.length]!;

/** Das Raster eines Kopfes. Frauen und Männer unterscheiden sich nur in Hals und Schulterbreite (und im Zeichnen von Kiefer und Brauen). */
export function raster(formIndex: number, geschlecht: Geschlecht): Raster {
  const kf = kopfformVon(formIndex);
  const H = KOPFHOEHE;
  const oben = KOPF_OBEN;
  const kopfBreite = SOLL.schaedelBreite.soll * H * kf.breite;
  const ey = oben + SOLL.augenlinie.soll * H;
  const augenBreite = SOLL.augenBreite.soll * kopfBreite;
  const augenLuecke = SOLL.augenAbstand.soll * augenBreite;
  const nasenspitzeY = oben + SOLL.nasenspitze.soll * H;
  const braueY = ey - SOLL.braue.soll * H;
  const nasenbasisY = nasenspitzeY + 0.012 * H;
  const halsAnteil = geschlecht === "f" ? 0.47 : 0.53;
  const schulterAnteil = geschlecht === "f" ? 2.3 : 2.5;
  return {
    H,
    oben,
    kinnY: oben + H,
    kopfBreite,
    halbBreite: kopfBreite / 2,
    ey,
    augenBreite,
    augenLuecke,
    ex: augenLuecke / 2 + augenBreite / 2,
    braueY,
    nasenspitzeY,
    nasenbasisY,
    mundY: oben + SOLL.mundlinie.soll * H,
    mundBreite: SOLL.mundBreite.soll * kopfBreite * (geschlecht === "f" ? 0.96 : 1.02),
    ohrenOben: braueY,
    ohrenUnten: nasenbasisY,
    ohrX: kopfBreite / 2 + 0.4,
    haaransatzY: oben + SOLL.haaransatz.soll * H,
    halsBreite: halsAnteil * kopfBreite,
    schulterBreite: schulterAnteil * kopfBreite,
    schulterY: oben + H * 1.1,
    kopfform: kf,
    geschlecht,
  };
}

const innerhalb = (wert: number, s: Soll, name: string, fehler: string[]): void => {
  if (Math.abs(wert - s.soll) > s.tol + 1e-9) fehler.push(`${name}: ${wert.toFixed(3)} außerhalb ${s.soll} ± ${s.tol}`);
};

/** Prüft ein Raster gegen die Sollwerte; die Liste ist leer, wenn alles innerhalb der Toleranz liegt. */
export function pruefe(r: Raster): string[] {
  const fehler: string[] = [];
  innerhalb(r.H / (2 * OVAL.ry), SOLL.kopfAnteil, "Kopfanteil an der Ovalhöhe", fehler);
  innerhalb(r.kopfBreite / r.H, SOLL.schaedelBreite, "Schädelbreite/H", fehler);
  innerhalb((r.ey - r.oben) / r.H, SOLL.augenlinie, "Augenlinie/H", fehler);
  innerhalb(r.augenBreite / r.kopfBreite, SOLL.augenBreite, "Augenbreite/Kopfbreite", fehler);
  innerhalb(r.augenLuecke / r.augenBreite, SOLL.augenAbstand, "Augenabstand/Augenbreite", fehler);
  innerhalb((r.ey - r.braueY) / r.H, SOLL.braue, "Braue über Augenlinie/H", fehler);
  innerhalb((r.nasenspitzeY - r.oben) / r.H, SOLL.nasenspitze, "Nasenspitze/H", fehler);
  innerhalb((r.mundY - r.oben) / r.H, SOLL.mundlinie, "Mundlinie/H", fehler);
  innerhalb(r.mundBreite / r.kopfBreite, SOLL.mundBreite, "Mundbreite/Kopfbreite", fehler);
  innerhalb((r.haaransatzY - r.oben) / r.H, SOLL.haaransatz, "Haaransatz/H", fehler);
  innerhalb(r.halsBreite / r.kopfBreite, SOLL.hals, "Halsbreite/Kopfbreite", fehler);
  if (Math.abs(r.kinnY - (r.oben + r.H)) > 1e-9) fehler.push("Kinn nicht bei 1,0 H");
  const sb = r.schulterBreite / r.kopfBreite;
  if (sb < SOLL.schultern.min - 1e-9 || sb > SOLL.schultern.max + 1e-9) fehler.push(`Schultern: ${sb.toFixed(2)} Kopfbreiten`);
  if (r.ohrenOben < r.braueY - 1e-9 || r.ohrenUnten > r.nasenbasisY + 1e-9 || r.ohrenOben >= r.ohrenUnten) fehler.push("Ohren außerhalb von Brauenlinie und Nasenunterkante");
  // Reihenfolge der Linien von oben nach unten
  const reihe = [r.oben, r.haaransatzY, r.braueY, r.ey, r.nasenspitzeY, r.mundY, r.kinnY];
  for (let i = 1; i < reihe.length; i++) if (reihe[i]! <= reihe[i - 1]!) fehler.push("Linien des Rasters nicht aufsteigend");
  // Der Kopf liegt im Oval: Scheitel unter dem Ovalrand, Kinn über dem unteren Rand mit Platz für den Hals
  if (r.oben <= OVAL.cy - OVAL.ry || r.kinnY >= OVAL.cy + OVAL.ry - 10) fehler.push("Kopf liegt nicht im Oval");
  // Blick leicht über der Mitte des Ovals
  if (!(r.ey < OVAL.cy && r.ey > OVAL.cy - 0.2 * OVAL.ry)) fehler.push("Blick nicht leicht über der Ovalmitte");
  return fehler;
}
