// Bewegungssprache, Teil 3: Die Effektstufe (Hoch, Mittel, Aus) und die Systemeinstellung „Bewegung reduzieren“.
//   hoch   alle Bewegungen, weiche Lichter, Erschütterung, Jahreszeit, Wolkenschatten, bis 30 Bilder je Sekunde im Leerlauf der Effekte
//   mittel Übergänge und Hervorhebungen, ruhige Marken; Leerlauf der Effekte höchstens 15 Bilder je Sekunde (Standard)
//   aus    keine Bewegung: Übergänge springen, Hervorhebungen stehen still, Gelände ohne Zusatz
// Standard ist „mittel“, auch wenn das System „Bewegung reduzieren“ wünscht: Dann bleiben sanfte Hervorhebungen und Überblendungen (Farben,
// Helligkeit), aber Kamerafahrten springen, und Federn, Schweben, Atmen, Beben und Kranschwenk entfallen (`ruhigeBewegung`).
// Die Wahl wird im Browser gemerkt. Die Leerlauflast der Karte steigt dadurch nie über die der Stufe „aus“ plus die Kosten weniger Pfade.

export type Effektstufe = "hoch" | "mittel" | "aus";

export const EFFEKTSTUFEN: Effektstufe[] = ["hoch", "mittel", "aus"];
const SCHLUESSEL = "staatsraeson-effekte";

/** Wünscht das System weniger Bewegung? (Ohne Browser: nein.) */
export function bewegungReduziert(): boolean {
  try {
    return typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

function lesen(): Effektstufe {
  try {
    const s = localStorage.getItem(SCHLUESSEL);
    if (s === "hoch" || s === "mittel" || s === "aus") return s;
  } catch {
    /* kein Speicher: Standard */
  }
  return "mittel";
}

/** Wünscht das System weniger Bewegung, bleiben nur sanfte Farb- und Helligkeitsübergänge: keine Fahrten, Federn, Beben und Zierbewegung. */
export const ruhigeBewegung = (): boolean => bewegungReduziert();

let aktuell: Effektstufe = lesen();
const hoerer = new Set<() => void>();

export const effektstufe = (): Effektstufe => aktuell;

export function abonniereEffekte(f: () => void): () => void {
  hoerer.add(f);
  return () => hoerer.delete(f);
}

function anDokument(s: Effektstufe): void {
  try {
    document.documentElement.dataset.effekte = s;
  } catch {
    /* kein Dokument (Tests) */
  }
}
anDokument(aktuell);

export function setzeEffektstufe(s: Effektstufe): void {
  if (s === aktuell) return;
  aktuell = s;
  try {
    localStorage.setItem(SCHLUESSEL, s);
  } catch {
    /* ohne Speicher gilt die Wahl nur für diese Sitzung */
  }
  anDokument(s);
  for (const f of [...hoerer]) f();
}

/** Nächste Stufe im Kreis (für einen Knopf, der durchschaltet). */
export const naechsteStufe = (s: Effektstufe): Effektstufe => EFFEKTSTUFEN[(EFFEKTSTUFEN.indexOf(s) + 1) % EFFEKTSTUFEN.length]!;

/** Faktor auf alle Dauern: 0 heißt „sofort“. Farb- und Helligkeitsübergänge laufen auch bei „Bewegung reduzieren“. */
export const dauerFaktor = (s: Effektstufe = aktuell): number => (s === "aus" ? 0 : 1);

/** Faktor auf Kamerafahrten und Federbewegungen: bei „aus“ und bei „Bewegung reduzieren“ springen sie. */
export const bewegungsFaktor = (s: Effektstufe = aktuell): number => (s === "aus" || ruhigeBewegung() ? 0 : 1);

/** Höchste Bildrate der Effektschicht im Leerlauf (Bilder je Sekunde); bei Eingabe gilt immer die volle Rate. */
export const leerlaufBilder = (s: Effektstufe = aktuell): number => (s === "hoch" ? 30 : s === "mittel" ? 15 : 0);

/** Darf eine Zierbewegung laufen (Atmen, Schweben, Wolken)? Nur bei „hoch“ (und „mittel“ für die ruhigen). */
export const zierBewegung = (s: Effektstufe = aktuell, ruhig = false): boolean => !ruhigeBewegung() && (s === "hoch" || (ruhig && s === "mittel"));
