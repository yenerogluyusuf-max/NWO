// Tinten-Animation für Besitzerwechsel (Annexion, Besatzung, Teilabtretung): Die neue Landesfarbe läuft wie Tinte über die Fläche, am
// Ende wechselt der Besitzer in den Kartendaten (`uebertrageFlaechen`). Dieses Modul enthält die Auswahl über die Detailstufen, die
// Warteschlange und die Programmierschnittstelle `animiereBesitzerwechsel`; gezeichnet wird in fx.ts.
//
// Die Flächen werden über ihren Platz in der Liste des alten Besitzers angesprochen (`flaechenIds`: Index in `porBesitzer[von]` der
// Bezugsstufe, standardmäßig der feinsten geladenen). In gröberen Stufen gelten die Flächen als gemeint, deren Mittelpunkt in einer gewählten
// Fläche liegt (dieselbe Region, anders vereinfacht).

import { imPunkt, uebertrageFlaechen, type KFlaeche, type KStufe } from "./daten";

export interface TintenAuftrag {
  /** Indizes in `porBesitzer[von]` der Bezugsstufe */
  flaechenIds: readonly number[];
  /** Besitzerindex vorher und nachher (Index in `karte.json` → `besitzer`) */
  von: number;
  nach: number;
  /** Dauer in Millisekunden (Standard: DAUER.tinte), mit Effekte „aus“ sofort */
  dauerMs?: number;
  /** Farbe der Tinte; fehlt sie, gilt die Landesfarbe des neuen Besitzers */
  farbe?: string;
}

export interface TintenSenke {
  /** Spielt die Animation ab, wechselt am Ende den Besitzer und liefert, wenn alles fertig ist */
  starte(a: TintenAuftrag): Promise<void>;
}

let senke: TintenSenke | null = null;
const wartend: { a: TintenAuftrag; fertig: () => void; fehler: (e: unknown) => void }[] = [];

/** Meldet die Karte an, die Aufträge abspielt; wartende Aufträge laufen sofort an. */
export function setzeTintenSenke(s: TintenSenke | null): void {
  senke = s;
  if (!s) return;
  while (wartend.length) {
    const w = wartend.shift()!;
    s.starte(w.a).then(w.fertig, w.fehler);
  }
}

export const tintenWartend = (): number => wartend.length;

/**
 * Lässt eine oder mehrere Flächen von einem Besitzer zum anderen wechseln, mit Tinten-Animation auf der Karte.
 * Ist die Karte nicht sichtbar (keine Senke), wartet der Auftrag, bis eine Karte sich anmeldet.
 */
export function animiereBesitzerwechsel(flaechenIds: readonly number[], vonBesitzer: number, nachBesitzer: number, optionen: Pick<TintenAuftrag, "dauerMs" | "farbe"> = {}): Promise<void> {
  const a: TintenAuftrag = { flaechenIds, von: vonBesitzer, nach: nachBesitzer, ...optionen };
  if (senke) return senke.starte(a);
  return new Promise((fertig, fehler) => wartend.push({ a, fertig, fehler }));
}

// ---------------------------------------------------------------------------
// Auswahl und Übertrag über die Detailstufen (rein, ohne Browser prüfbar)

/** Die gemeinten Flächen der Bezugsstufe. */
export function gemeinteFlaechen(bezug: KStufe, von: number, ids: readonly number[]): KFlaeche[] {
  const liste = bezug.porBesitzer[von] ?? [];
  return ids.map((i) => liste[i]).filter((f): f is KFlaeche => !!f);
}

const mitte = (f: KFlaeche): [number, number] => [(f.bb[0] + f.bb[2]) / 2, (f.bb[1] + f.bb[3]) / 2];

/** Index der feinsten geladenen Stufe. */
export function feinsteStufe(stufen: readonly (KStufe | null)[]): number {
  for (let i = stufen.length - 1; i >= 0; i--) if (stufen[i]) return i;
  return -1;
}

/**
 * Überträgt die gemeinten Flächen in allen Stufen auf den neuen Besitzer und liefert die Zahl der Flächen der Bezugsstufe.
 * Gröbere Stufen übertragen die Flächen, deren Mittelpunkt in einer gemeinten Fläche der Bezugsstufe liegt.
 */
export function uebertrageUeberStufen(stufen: readonly (KStufe | null)[], von: number, nach: number, ids: readonly number[], bezugsStufe = feinsteStufe(stufen)): number {
  const bezug = stufen[bezugsStufe];
  if (!bezug) return 0;
  const gemeint = gemeinteFlaechen(bezug, von, ids);
  if (!gemeint.length) return 0;
  const gewaehlt = new Set(gemeint);
  let n = 0;
  stufen.forEach((st, i) => {
    if (!st) return;
    if (i === bezugsStufe) n = uebertrageFlaechen(st, von, nach, (f) => gewaehlt.has(f));
    else
      uebertrageFlaechen(st, von, nach, (f) => {
        const [u, v] = mitte(f);
        return gemeint.some((g) => imPunkt(g, u, v));
      });
  });
  return n;
}

/**
 * Mittelpunkt und Radius der Hülle mehrerer Flächen für den Tintenkreis. Der Radius ist in Texturbreiten gemessen; `aspekt` (Breite durch Höhe
 * der Karte in Welteinheiten) gleicht aus, dass eine Texturhöhe auf dem Boden eine andere Länge hat als eine Texturbreite.
 */
export function huelle(flaechen: readonly KFlaeche[], aspekt = 1): { u: number; v: number; r: number } {
  let u0 = Infinity;
  let v0 = Infinity;
  let u1 = -Infinity;
  let v1 = -Infinity;
  for (const f of flaechen) {
    u0 = Math.min(u0, f.bb[0]);
    v0 = Math.min(v0, f.bb[1]);
    u1 = Math.max(u1, f.bb[2]);
    v1 = Math.max(v1, f.bb[3]);
  }
  if (!Number.isFinite(u0)) return { u: 0.5, v: 0.5, r: 0 };
  return { u: (u0 + u1) / 2, v: (v0 + v1) / 2, r: Math.hypot(u1 - u0, (v1 - v0) / aspekt) / 2 };
}
