// Datenentwurf GLM: Tourismus (zu RECHERCHE_GLM_11). Wird NICHT vom Spiel geladen.
// Anschluss: sim/wirtschaft* (Devisenlinie), sim/diplomatie.ts (Herkunftsländer), sim/maerkte.ts (Stornoschock).
// Belegte Zahlen mit Quelle (TÜİK); Rest Spielparameter.

export interface Herkunftsland {
  land: string;
  besucherMio: number; // 2025
  quelle?: string;
}

export interface Tourismus {
  besucherMio: number;
  einnahmenMrdDollar: number;
  jahr: 2025;
  quelle: string;
  herkunft: Herkunftsland[];
  /** Saisonlast je Quartal (Spielparameter, summiert ~100) */
  saison: [number, number, number, number];
}

export const TURIZM_2025: Tourismus = {
  besucherMio: 63.94,
  einnahmenMrdDollar: 65.2,
  jahr: 2025,
  quelle: "TÜİK Q4-2025-Bulletin; OECD-konforme Presseauswertung",
  herkunft: [
    { land: "RUS", besucherMio: 6.9, quelle: "TÜİK-Monatsreihen (Presseauswertung)" },
    { land: "DEU", besucherMio: 6.75 },
    { land: "GBR", besucherMio: 4.6 },
  ],
  saison: [22, 18, 34, 26], // Spielparameter
};

/** Stornoschock: Ausfall eines Herkunftslands drückt Einnahmen proportional zum Anteil. */
export function stornoWirkung(t: Tourismus, land: string, ausfallAnteilProzent: number): { einnahmenNeuMrd: number; text: string } {
  const h = t.herkunft.find((x) => x.land === land);
  const anteil = h ? h.besucherMio / t.besucherMio : 0;
  const verlust = t.einnahmenMrdDollar * anteil * (ausfallAnteilProzent / 100);
  return {
    einnahmenNeuMrd: Math.round((t.einnahmenMrdDollar - verlust) * 10) / 10,
    text: h
      ? `Ausfall aus ${land} (${Math.round(anteil * 100)} % der Gäste, ${ausfallAnteilProzent} % davon): Einnahmen ${verlust.toFixed(1)} Mrd. $ niedriger.`
      : "Kein relevanter Herkunftsmarkt betroffen.",
  };
}

/** Diversifizierung: neue Märkte senken die Abhängigkeitsspitzen über Jahre (Spielparameter). */
export function diversifizierung(t: Tourismus, kampagneJahre: number): { spitzenanteilProzent: number; text: string } {
  const spitze = Math.max(...t.herkunft.map((h) => h.besucherMio / t.besucherMio));
  const neu = spitze * (1 - Math.min(0.25, kampagneJahre * 0.05)); // je Kampagnenjahr bis −5 % relativ (Spielparameter)
  return {
    spitzenanteilProzent: Math.round(neu * 100),
    text: `Nach ${kampagneJahre} Jahren Diversifizierung liegt der größte Herkunftsanteil bei rund ${Math.round(neu * 100)} % statt ${Math.round(spitze * 100)} %.`,
  };
}
