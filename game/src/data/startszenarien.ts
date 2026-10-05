// Startszenarien: Wie die Geschichte beginnt. Alle Zahlen sind Spielparameter (Platzhalter der Kalibrierung), keine Tatsachen.
//
// Startzeitpunkt: Die Wirtschafts- und Umfragedaten des Spiels stammen vom 25.09.2026 (data/szenario_tuerkei_2026-09-25.json), das Spiel beginnt
// fiktiv nach der Wahl 2028 (5. Juni 2028). Frühere oder spätere Stände wären erfundene Zahlen; darum gibt es einen einzigen Startzeitpunkt, die
// Szenarien unterscheiden sich in Partei, Parlament, Erbe, Wirtschaftslage und Wahltermin.
// Die Namen und Texte stehen im Katalog (`start.<id>.name`, `.text`, `.status`).

export type StartszenarioId = "neugruendung" | "regierungspartei" | "uebergang" | "opposition";

export interface Startszenario {
  id: StartszenarioId;
  /** Ob das Szenario heute spielbar ist; sonst steht im Katalog unter `.status`, worauf es wartet */
  verfuegbar: boolean;
  /** Fest vorgegebene Partei (Regierungspartei übernehmen); sonst wählt der Spieler seine Linie */
  partei?: { name: string; kurz: string; farbe: string };
  /** Fest vorgegebenes Wahlbündnis */
  buendnis?: string;
  /** Wahlergebnis, mit dem das Spiel beginnt (statt der Wahlnacht des Prologs) */
  wahl?: { runde: 1 | 2; anteil: number };
  /** Versprechen, die das Spiel als Zusagen übernimmt (Erbe der Vorgängerregierung) */
  versprechen?: string[];
  /** Tage bis zur nächsten Wahl (sonst fünf Jahre) */
  wahltagTage?: number;
  /** Wirtschaftslage zu Beginn: Verschiebung gegenüber dem Szenario (Prozentpunkte, Basispunkte, Faktor) */
  krise?: { inflation: number; erwartung: number; arbeitslosigkeit: number; wachstum: number; risiko: number; kurs: number; glaubwuerdigkeit: number };
}

export const STARTSZENARIEN: Startszenario[] = [
  { id: "neugruendung", verfuegbar: true },
  {
    id: "regierungspartei",
    verfuegbar: true,
    partei: { name: "AKP", kurz: "AKP", farbe: "#e0a02a" },
    buendnis: "MHP",
    wahl: { runde: 2, anteil: 52.5 },
    versprechen: ["Der MHP wurde ein Mitspracherecht beim Friedensprozess zugesagt.", "Rentenerhöhung in den ersten hundert Tagen versprochen."],
    // Gut zweieinhalb Jahre bis zur nächsten Wahl (die Amtsübernahme fällt mitten in die Legislatur)
    wahltagTage: 913,
  },
  {
    id: "uebergang",
    verfuegbar: true,
    wahl: { runde: 2, anteil: 47 },
    // Etwa vierzehn Monate bis zur Wahl: eine Übergangsregierung nach einer Krise
    wahltagTage: 425,
    krise: { inflation: 18, erwartung: 12, arbeitslosigkeit: 3, wachstum: -3, risiko: 350, kurs: 1.35, glaubwuerdigkeit: -0.25 },
  },
  // Braucht die Oppositionsphase (Rolle als Oppositionsführer nach einem Machtwechsel), die der Strang „Nachfolge“ liefert
  { id: "opposition", verfuegbar: false },
];

export const STARTSZENARIO_NACH_ID: Record<StartszenarioId, Startszenario> = Object.fromEntries(STARTSZENARIEN.map((s) => [s.id, s])) as Record<StartszenarioId, Startszenario>;
