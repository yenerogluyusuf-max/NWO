// Datenentwurf GLM: Bildungskette und Innovationsgrenze (zu RECHERCHE_GLM_2, Thema 2).
// Kern laut Projektinhaber (05.10.2026): Der Forschungsetat wirkt nur bis zu einer Innovationsgrenze,
// die Bildung und Fachkräfte setzen; neue Waffengenerationen entwickeln sich nur mit dieser Basis schnell;
// Bildung ohne Forschung lässt Fachkräfte abwandern.
// Diese Datei wird NICHT vom Spiel geladen. Anschlusspunkte: ForschungsZustand.forschungsrate
// (data/forschung/typen.ts), Kanten an hochschule/fachkraefte (data/politiknetz.ts), Ausrüstungsgenerationen
// (data/krieg-daten.ts). Reine Funktionen ohne Importe; die Engine übergibt Bestände als Parameter.
// Alle Zahlen sind Spielparameter (Platzhalter der Kalibrierung), keine Tatsachenbehauptungen.

/** Bestände, die die Engine aus dem Weltzustand liefert (je 0–100, Antritt = Startwert). */
export interface BildungsBestaende {
  /** Bildungsbestand (Knoten hochschule + Qualitätszeichen) */
  bildung: number;
  /** Fachkräftebestand (Knoten fachkraefte) */
  fachkraefte: number;
  /** Forschungsetat-Wirkung, wie sie ohne Grenze ankommen würde (0–100) */
  forschungsetatWirkung: number;
}

/**
 * Die Innovationsgrenze: bis hier wirkt Forschung.
 * Bildung trägt doppelt (Qualität braucht beides), Fachkräfte einfach; beide Bestände
 * werden gemittelt und leicht gedämpft, damit die Grenze nie über den besseren der beiden steigt.
 */
export function innovationsGrenze(b: BildungsBestaende): number {
  const basis = 0.55 * b.bildung + 0.45 * b.fachkraefte;
  return Math.round(Math.min(basis, Math.max(b.bildung, b.fachkraefte) * 0.95));
}

/** Forschungswirkung nach der Grenze: Überschuss verpufft zu 70 % (Spielparameter) statt zu wirken. */
export function forschungsWirkung(b: BildungsBestaende): { wirksam: number; verpufft: number; ueberGrenze: boolean } {
  const grenze = innovationsGrenze(b);
  if (b.forschungsetatWirkung <= grenze) {
    return { wirksam: b.forschungsetatWirkung, verpufft: 0, ueberGrenze: false };
  }
  const ueberschuss = b.forschungsetatWirkung - grenze;
  return { wirksam: grenze + ueberschuss * 0.3, verpufft: ueberschuss * 0.7, ueberGrenze: true };
}

/**
 * Abwanderung: Bildung ohne Forschungsperspektive lässt Fachkräfte abwandern.
 * Rückgabe je Monat in Prozentpunkten Verlust am Fachkräftebestand (Spielparameter).
 */
export function abwanderungJeMonat(b: BildungsBestaende): { verlustProzentpunkte: number; grund: string } {
  const spanne = b.bildung - b.forschungsetatWirkung;
  if (spanne <= 10) {
    return { verlustProzentpunkte: 0, grund: "Perspektive passt zur Bildung" };
  }
  // Je größer die Lücke zwischen gebildetem Nachwuchs und Forschungsperspektive, desto mehr Abwanderung.
  const verlust = Math.min(0.6, spanne * 0.01);
  return {
    verlustProzentpunkte: verlust,
    grund: spanne >= 30
      ? "Der gut ausgebildete Nachwuchs sieht keine Forschungsperspektive und geht."
      : "Ein Teil des Nachwuchs geht, weil die Forschungsstellen hinter der Ausbildung zurückbleiben.",
  };
}

/** Rückholprogramm wirkt der Abwanderung nach 12–24 Monaten entgegen (Verzug als Spielparameter). */
export function rueckholprogrammWirkung(kapitalEingesetzt: number, monateLaufend: number): number {
  if (monateLaufend < 12) return 0;
  const volleWirkung = Math.min(0.5, kapitalEingesetzt * 0.05);
  const rampe = Math.min(1, (monateLaufend - 12) / 12);
  return volleWirkung * rampe;
}

/**
 * Waffengenerationen: Sprünge brauchen die Innovationsgrenze als Basis.
 * Unter der Mindestgrenze verdoppelt sich die Entwicklungszeit, weit darunter kann das Vorhaben scheitern.
 */
export function waffengenerationDauer(
  basisMonate: number,
  grenze: number,
  mindestGrenze: number
): { monate: number; risikoScheitern: number; hinweis: string } {
  if (grenze >= mindestGrenze) {
    return { monate: basisMonate, risikoScheitern: 0.1, hinweis: "Basis trägt die neue Generation." };
  }
  const rückstand = (mindestGrenze - grenze) / 100;
  const monate = Math.round(basisMonate * (1 + rückstand * 4)); // bis zu doppelter Vorlauf (Spielparameter)
  const risiko = Math.min(0.6, 0.1 + rückstand * 1.5);
  return {
    monate,
    risikoScheitern: risiko,
    hinweis: rückstand > 0.2
      ? "Die Bildungs- und Fachkräftebasis trägt diesen Sprung nicht; Vorlauf und Misserfolgsrisiko steigen deutlich."
      : "Die Basis ist knapp; Vorlauf verlängert sich.",
  };
}

/**
 * Technopark-Lizenz: Regionale Stütze für Fachkräfte und Forschungsrate (Vorschlag 5.5).
 * Wirkung tritt mit 24 Monaten Verzug ein (Spielparameter).
 */
export function teknoparkRegionWirkung(region: { bildung: number; fachkraefte: number }): { fachkraefteBonus: number; forschungsrateBonus: number; monateVerzug: number } {
  const qualitaet = Math.min(region.bildung, region.fachkraefte);
  return {
    fachkraefteBonus: qualitaet * 0.02,
    forschungsrateBonus: qualitaet * 0.015,
    monateVerzug: 24,
  };
}

/** Grenz-Leiste für die Wissensakte: Werte zum Anzeigen (0–100 je Spalte). */
export function grenzLeiste(b: BildungsBestaende): { grenze: number; etat: number; warnText?: string } {
  const w = forschungsWirkung(b);
  return {
    grenze: innovationsGrenze(b),
    etat: Math.round(b.forschungsetatWirkung),
    warnText: w.ueberGrenze
      ? `Ihr Forschungsetat wirkt nur bis zur Grenze aus Bildung und Fachkräften; rund ${Math.round(w.verpufft)} Punkte verpuffen, der Nachwuchs wandert ab.`
      : undefined,
  };
}
