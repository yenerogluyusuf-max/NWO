// Datenentwurf GLM: Diaspora (zu RECHERCHE_GLM_12). Wird NICHT vom Spiel geladen.
// Anschluss: sim/diplomatie.ts (Diaspora-Kanal gebaut — Audit-Prüfpunkt U6: Verbraucher fehlt),
// sim/wahl.ts (Auslandsurnen), sim/laender.ts (Gastland-Beziehungen). Belegte Zahlen mit Quelle.

export interface DiasporaRegion {
  /** Region oder Land-Kürzel */
  region: string;
  /** Registrierte Staatsbürger je Region (Mio.; belegt oder Spielparameter) */
  millionen: number;
  quelle?: string;
}

export const DIASPORA_2024 = {
  gesamtMio: 7.5, // Dışişleri Bakanlığı, April 2024
  westeuropaMio: 6.5,
  quelle: "Dışişleri Bakanlığı über sonhaber.eu (6.5.2024); Länderverteilung zu prüfen",
};

export const WAHL_AUSLAND_2023 = {
  registriert: 3416098,
  gewählt: 1912030,
  länder: 73,
  vertretungen: 151,
  ersteMal: 277646,
  vergleich2018Registriert: 3044837,
  quelle: "YSK-2023er-Ergebnisveröffentlichung (Auswertung)",
};

export const REGIONEN: DiasporaRegion[] = [
  { region: "Westeuropa (gesamt)", millionen: 6.5, quelle: "Dışişleri 2024" },
  { region: "DEU", millionen: 2.8, quelle: "Spielparameter — Dışişleri-Länderliste prüfen" },
  { region: "NLD", millionen: 0.5, quelle: "Spielparameter" },
  { region: "FRA", millionen: 0.7, quelle: "Spielparameter" },
  { region: "USA", millionen: 0.55, quelle: "Spielparameter" },
  { region: "Golf", millionen: 0.3, quelle: "Spielparameter" },
  { region: "Turkstaaten", millionen: 0.25, quelle: "Spielparameter" },
];

/** Bindung und Wohlbefinden je Region als Wortstufen (keine Prozent-Pseudo-Präzision). */
export type Wortstufe = "niedrig" | "mittel" | "hoch";

export interface RegionZustand {
  region: string;
  bindung: Wortstufe; // Nähe zur Heimat (Konsulatspolitik, Ereignisse)
  wohlbefinden: Wortstufe; // Diskriminierung, Rechtslage im Gastland
  überweisungen: Wortstufe; // Devisenlinie
}

/** Diskriminierungsfall: Wohlbefinden fällt sofort, Bindung kann steigen oder fallen je Reaktion (Spielkante). */
export function diskriminierungsfall(z: RegionZustand, reaktion: "laut_protest" | "stille_diplomatie" | "nichts"): RegionZustand {
  const niveau: Record<Wortstufe, number> = { niedrig: 0, mittel: 1, hoch: 2 };
  const stufe = (n: number): Wortstufe => (n <= 0 ? "niedrig" : n >= 2 ? "hoch" : "mittel");
  const wohlbefindenNeu = stufe(niveau[z.wohlbefinden] - 1);
  switch (reaktion) {
    case "laut_protest":
      return { ...z, wohlbefinden: wohlbefindenNeu, bindung: stufe(niveau[z.bindung] + 1) };
    case "stille_diplomatie":
      return { ...z, wohlbefinden: wohlbefindenNeu, bindung: z.bindung };
    case "nichts":
      return { ...z, wohlbefinden: wohlbefindenNeu, bindung: stufe(niveau[z.bindung] - 1) };
  }
}

/** Auslandsurnen-Schätzung für die Wahlnacht (Kalibrierung: 56 % Beteiligung 2023). */
export function auslandsstimmen(registriert: number, beteiligungProzent = 56): { gewählt: number; text: string } {
  const gewählt = Math.round((registriert * beteiligungProzent) / 100);
  return {
    gewählt,
    text: `Auslandsurnen: ${registriert.toLocaleString("de-DE")} registriert, mit ${beteiligungProzent} % Beteiligung rund ${gewählt.toLocaleString("de-DE")} Stimmen — genug, um eine Stichwahl zu kippen.`,
  };
}
