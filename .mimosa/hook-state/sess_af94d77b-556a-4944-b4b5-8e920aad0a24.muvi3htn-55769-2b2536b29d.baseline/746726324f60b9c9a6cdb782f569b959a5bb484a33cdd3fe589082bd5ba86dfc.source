// Provinz-Archätypen: acht Typen aus der Cluster-Analyse der Provinz-Profile
// (RECHERCHE_PROVINZDATEN.md, Abschnitte 3 und 4), als zweite Schicht über den
// echten Provinzdaten (sim/regional.ts).
//
// Quellen der Cluster-Merkmale: STB SEGE-2025 (Ekim 2025), OSBÜK OSB-Zahlen
// (Abruf 30.09.2026), KTB YİGM Übernachtungen 2025, TÜİK İç Göç 2024/2025;
// Zuordnung Provinz → Archätyp aus kalibrierung/provinz_profile.csv
// (Spalten cluster_id/cluster_name), Stand 30.09.2026.
//
// Die Deltas sind additive Punkte auf der 0–100-Skala des Politiknetzes und werden
// beim Partie-Start auf die Katalog-Startwerte addiert, nach dem Faktor der
// Echtdaten-Schicht: start = clamp(katalog × faktor + delta, 0, 100).
// Richtung und Größe folgen den Cluster-Statistiken der Recherche; die Magnituden
// sind Spielparameter der Kalibrierung, keine Messwerte.

export interface Archetyp {
  /** cluster_id aus provinz_profile.csv (1–8) */
  id: number;
  /** Name aus der Cluster-Analyse (cluster_name) */
  name: string;
  /** Kfz-Kennziffern (plaka) der Mitgliedsprovinzen, aufsteigend */
  provinzen: number[];
}

export const ARCHETYPEN: Archetyp[] = [
  { id: 1, name: "Metropol-Industrie-Kern", provinzen: [6, 16, 34, 35, 41, 59] },
  { id: 2, name: "Industrie- und Hafen-Gürtel (2. Reihe)", provinzen: [1, 10, 17, 22, 31, 33, 39, 54, 55, 67, 77, 81] },
  { id: 3, name: "Tourismus-Küste", provinzen: [7, 9, 48, 50] },
  { id: 4, name: "Anatolische Mittelstädte / Tiger", provinzen: [5, 11, 14, 19, 20, 24, 25, 26, 37, 38, 40, 58, 60, 66, 71, 78, 80] },
  { id: 5, name: "Agrar-Steppe İç Ege/Zentralanatolien", provinzen: [3, 15, 32, 42, 43, 45, 51, 64, 68, 70] },
  { id: 6, name: "Karadeniz-Fındık-Peripherie", provinzen: [8, 28, 52, 53, 57, 61, 74] },
  { id: 7, name: "Südost/GAP: Grenz-Industrie & Trockenlandwirtschaft", provinzen: [2, 21, 23, 27, 36, 44, 46, 47, 63, 65, 72, 73, 76, 79] },
  { id: 8, name: "Ost-Anatolien peripher", provinzen: [4, 12, 13, 18, 29, 30, 49, 56, 62, 69, 75] },
];

/** Archätyp einer Provinz (Kfz-Kennziffer), für Anzeige und Startwerte. */
export function archetypVon(plaka: number): Archetyp | undefined {
  return ARCHETYPEN.find((a) => a.provinzen.includes(plaka));
}

/** Anzeigename des Archätyps einer Provinz (leer, falls keine Zuordnung). */
export function archetypName(plaka: number): string {
  return archetypVon(plaka)?.name ?? "";
}

/**
 * Delta-Matrix (RECHERCHE_PROVINZDATEN.md, Abschnitt 4): additive Punkte je
 * Politiknetz-Knoten, Index im Array = Archätyp-id − 1. Nur Knoten ohne echten
 * Provinz-Datenbeleg; `arbeitslosigkeit` bleibt absichtlich außen vor, denn dort
 * stehen echte Provinzwerte in provinzdaten.json (Empfehlung der Recherche).
 * Bei Doppelzeilen der Matrix („landflucht / p_landflucht“) tragen beide Knoten
 * dieselben Deltas, nur C1 unterscheidet sich (−15 / −20).
 */
export const DELTAS: Record<string, number[]> = {
  // C1 Metro, C2 Gürtel, C3 Tourismus, C4 Tiger, C5 Steppe, C6 Karadeniz, C7 Südost, C8 Ost
  mieten: [15, 4, 8, 2, 0, -2, -4, -10],
  p_wohnungsnot: [12, 4, 6, 2, 0, -2, -2, -8],
  lebenshaltung: [8, 3, 4, 0, 0, 0, 3, 3],
  abwanderung: [-5, 0, 0, 3, 8, 10, 8, 12],
  p_abwanderung: [-8, -2, -2, 2, 8, 10, 8, 15],
  landflucht: [-15, -5, -3, 2, 8, 10, 8, 15],
  p_landflucht: [-20, -5, -3, 2, 8, 10, 8, 15],
  p_wassermangel: [8, 2, 5, 0, 15, -10, 5, 0],
  wasserversorgung: [-5, 0, -3, 0, -10, 5, -5, 0],
  industrie: [5, 8, -3, 5, 2, -5, 2, -10],
  export: [5, 8, 2, 3, 0, -5, 2, -10],
  logistik: [10, 8, 3, 2, 0, -3, 2, -8],
  tourismus: [5, 2, 20, 0, -3, 3, 0, -5],
  landwirtschaft_einkommen: [-5, 2, 3, 2, 5, 5, 5, 0],
  jugendarbeitslosigkeit: [3, 0, 3, 0, 3, 5, 15, 10],
  p_jugendarbeitslosigkeit: [3, 0, 3, 0, 3, 5, 15, 10],
  p_armut: [-3, -2, -2, 0, 3, 5, 10, 12],
  schattenwirtschaft: [0, 0, 5, 2, 3, 5, 10, 8],
  p_migrationsdruck: [3, 2, 3, 0, 0, 0, 15, 3],
  p_erdbebengefahr: [5, 8, 5, 3, -8, -3, 8, 3],
  erdbebenvorsorge: [3, 0, 0, 0, 0, 0, -8, -3],
  stromversorgung: [-5, 0, 2, 0, 0, 2, 0, -3],
  p_aerztemangel: [-8, -3, 0, 0, 3, 5, 8, 10],
  ungleichheit: [10, 3, 3, 0, 0, 0, 5, 3],
  terrorgefahr: [0, 0, 0, 0, 0, 0, 10, 5],
  p_luftverschmutzung: [10, 6, -3, 2, 0, -3, 2, -3],
};

/**
 * Ausreißer-Overrides: zusätzliche Punkte je Provinz und Knoten, auf das
 * Archätyp-Delta addiert. Nur füllen, wenn ein Fall in kalibrierung/provinz_profile.csv
 * markiert ist (derzeit keine Markierung — die Matrix allein trägt, vgl.
 * RECHERCHE_PROVINZDATEN.md, Abschnitt 4: Gaziantep-Industrie, İstanbul-Miete wären
 * die ersten Kandidaten).
 */
export const AUSREISSER: Record<number, Record<string, number>> = {};

/**
 * Die Archätyp-Schicht, fertig für createNet: additive Punkte je Knoten
 * (Index = Kfz-Kennziffer − 1), über der Echtdaten-Schicht aus sim/regional.ts.
 */
export const ARCHETYP_DELTAS: Record<string, number[]> = (() => {
  const out: Record<string, number[]> = {};
  for (const [knoten, deltas] of Object.entries(DELTAS)) {
    const arr = new Array<number>(81).fill(0);
    for (const a of ARCHETYPEN) {
      const d = deltas[a.id - 1] ?? 0;
      for (const plaka of a.provinzen) arr[plaka - 1] = d;
    }
    out[knoten] = arr;
  }
  for (const [plaka, jeKnoten] of Object.entries(AUSREISSER)) {
    const p = Number(plaka) - 1;
    for (const [knoten, d] of Object.entries(jeKnoten)) {
      (out[knoten] ??= new Array<number>(81).fill(0))[p] = (out[knoten]![p] ?? 0) + d;
    }
  }
  return out;
})();
