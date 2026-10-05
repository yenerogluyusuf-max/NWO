// Datenentwurf GLM: Haushalt nach Ressorts und Renten (zu RECHERCHE_GLM_1_HAUSHALT_RECHERCHE, Thema 1).
// Diese Datei wird NICHT vom Spiel geladen; der Haushalts-Strang (sim/haushalt.ts, data/haushaltsplan.ts)
// übernimmt die Basistabelle als Vorgabewerte. Nur lesen, nichts Bestehendes ändern.
// Alle Zahlen sind belegt mit Quelle oder ausdrücklich als Spielparameter markiert.

// ---------------------------------------------------------------------------
// Typen

/** Ein Ressort des Zentralhaushalts. */
export interface RessortEtat {
  id: string;
  name: string;
  /** Etat 2026 in Milliarden Lira (belegt, mit Quelle; sonst Spielparameter) */
  etat2026Milliarden: number;
  quelle?: string;
  /** Anteil an den Gesamtausgaben in Prozent, sofern belegt */
  anteilProzent?: number;
  /** Verzug bis die Wirkung sichtbar ist, in Monaten (Spielparameter) */
  wirkungsverzugMonate: number;
  /** Wählermilieus, die diesen Etat zuerst spüren (Namen wie in sim/gruppen.ts) */
  spuert: string[];
}

/** Rentenstatus: ererbter Berg, keine freien Regler. */
export interface RentenStatus {
  rentnerMillionen: number;
  rentnerQuelle?: string;
  /** Aktive Versicherte je Rentner (belegt: 1,61) */
  aktiveJeRentner: number;
  aktiveJeRentnerQuelle?: string;
  /** Rentenzahlungen je Jahr in Milliarden Lira (2023 belegt) */
  zahlungenMilliarden: number;
  zahlungenQuelle?: string;
  /** Mindestrente in Lira je Monat (Spielparameter bis Beleg) */
  mindestrente: number;
  /** Steuerbare Entscheidungsarten je Amtszeit */
  entscheidungen: Array<"erhoehung" | "eintritt" | "minimum" | "sondervereinbarung">;
}

// ---------------------------------------------------------------------------
// Basis 2026 (Bereinigung Oktober 2025; Finaltext im Resmî Gazete prüfen)

export const RESSORT_ETATEN_2026: RessortEtat[] = [
  {
    id: "bildung",
    name: "Bildung (MEB, YÖK, Universitäten)",
    etat2026Milliarden: 2896,
    quelle: "Yeni Asır 16.10.2025 (Cevdet Yılmaz); Finaltext prüfen",
    anteilProzent: 15.3,
    wirkungsverzugMonate: 72,
    spuert: ["Beschäftigte", "Familien", "Studenten"],
  },
  {
    id: "verteidigung",
    name: "Verteidigung (MSB)",
    etat2026Milliarden: 823,
    quelle: "savunmasanayi.org, Ministerrede zur Budgetbereinigung 2025",
    wirkungsverzugMonate: 12,
    spuert: ["Nationalisten", "Rüstungsindustrie"],
  },
  {
    id: "sicherheit",
    name: "Innere Sicherheit (Rest der 1.202 Mrd. Verteidigung und Sicherheit)",
    etat2026Milliarden: 379,
    quelle: "savunmasanayi.org (Gesamt 1.202 Mrd. minus MSB 823 Mrd.)",
    wirkungsverzugMonate: 6,
    spuert: ["Beschäftigte", "Nationalisten"],
  },
  {
    id: "forschung",
    name: "AR-GE-Zuweisungen (über Ressorts)",
    etat2026Milliarden: 309,
    quelle: "Budgetauswertungen Oktober 2025",
    wirkungsverzugMonate: 48,
    spuert: ["Studenten", "Wissenschafter-Milieus"],
  },
  {
    id: "gesundheit",
    name: "Gesundheit",
    etat2026Milliarden: 900, // Spielparameter: Auswertungsliteratur nennt keinen belegten Einzelwert
    wirkungsverzugMonate: 24,
    spuert: ["Beschäftigte", "Familien", "Rentner"],
  },
  {
    id: "landwirtschaft",
    name: "Landwirtschaft",
    etat2026Milliarden: 420, // Spielparameter
    wirkungsverzugMonate: 12,
    spuert: ["Landwirte"],
  },
  {
    id: "verwaltung",
    name: "Übrige Verwaltung (Justiz, Verkehr, Kultur, Ausland …)",
    etat2026Milliarden: 6500, // Spielparameter: Restposten, gegen Budgetgesetz zu prüfen
    wirkungsverzugMonate: 12,
    spuert: [],
  },
];

/** Nicht regelbar, aber sichtbar: Zinszahlungen 2026. */
export const ZINSEN_2026 = {
  milliarden: 2700,
  quelle: "İYİ-Parti-Auswertung der Budgetbereinigung (Presse, Oktober 2025); Finaltext prüfen",
};

/** Rentenstatus: belegte Ausgangslage. */
export const RENTEN_STATUS_2026: RentenStatus = {
  rentnerMillionen: 17.06,
  rentnerQuelle: "Samanyolu Haber mit SGK-Verweis; gegen SGK-Statistik prüfen",
  aktiveJeRentner: 1.61,
  aktiveJeRentnerQuelle: "Manşet Aydın, März 2025",
  zahlungenMilliarden: 1408.6,
  zahlungenQuelle: "Yeni Şafak-Auswertung des SGK-Tätigkeitsberichts 2024 (Wert 2023)",
  mindestrente: 12500, // Spielparameter: 2025-Wert nach Presse; 2026-Wert nicht gefunden
  entscheidungen: ["erhoehung", "eintritt", "minimum", "sondervereinbarung"],
};

// ---------------------------------------------------------------------------
// Reine Rechnungen (ohne Importe; Engine koppelt sie ans Netz)

/** Realer Etat: nominaler Etat aufgeteilt durch kumulierte Inflation seit Beschließung (Ausführungsquote als Härtefaktor). */
export function realerEtat(nominalMilliarden: number, inflationsfaktorSeitBeschluss: number, ausfuehrungsquote = 0.95): number {
  return (nominalMilliarden / inflationsfaktorSeitBeschluss) * ausfuehrungsquote;
}

/**
 * Effekt der EYT-artigen Sondervereinbarung: Rentnerzahl und Kassenlast springen.
 * Vorbild: EYT 2023, in zwei Jahren 2,9 Mio. neue Rentner (Manşet Aydın, März 2025) — hier als Spielparameter umgerechnet.
 */
export function sondervereinbarungSchock(rentnerMillionen: number, AntragstellerMio = 2.5): { rentnerNeu: number; zusatzMilliardenJeJahr: number } {
  return {
    rentnerNeu: rentnerMillionen + AntragstellerMio,
    zusatzMilliardenJeJahr: AntragstellerMio * 12 * (RENTEN_STATUS_2026.mindestrente / 1000) * 1.35, // 1,35 = über Mindestrente (Spielparameter)
  };
}
