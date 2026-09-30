// Die Wählergruppen mit ihrem Gewicht bei der Zustimmung. Die Gewichte sind Spielparameter (Platzhalter der Kalibrierung):
// Sie bilden nur ab, dass Beschäftigte und Rentner in der Türkei mehr Stimmen tragen als Beamte oder Unternehmer.

export const GRUPPEN: { id: string; gewicht: number }[] = [
  { id: "arbeitnehmer", gewicht: 1.4 },
  { id: "rentner", gewicht: 1.3 },
  { id: "junge", gewicht: 1.1 },
  { id: "konservative", gewicht: 1.1 },
  { id: "staedtische_saekulare", gewicht: 1.0 },
  { id: "landwirte", gewicht: 0.8 },
  { id: "beamte", gewicht: 0.6 },
  { id: "unternehmer", gewicht: 0.5 },
  // Weitere Gruppen (Block T1); Gewichte wie oben Spielparameter der Kalibrierung
  { id: "arme", gewicht: 1.0 },
  { id: "nationalisten", gewicht: 0.8 },
  { id: "minderheiten", gewicht: 0.7 },
];

export const GRUPPEN_SUMME = GRUPPEN.reduce((s, g) => s + g.gewicht, 0);
