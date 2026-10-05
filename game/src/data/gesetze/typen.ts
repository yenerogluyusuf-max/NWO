// Typdefinitionen für Gesetzesbausteine (Vision 0.1 in VISION_IM_DETAIL_2026-10-05.md):
// Jede Maßnahme wird zu einem Gesetz mit Klauseln, die man am Verhandlungstisch wählt.
// Diese Datei ist reine Daten- und Typschicht: Die Engine (Stufe 2) kommt in einen eigenen Strang
// und liest von hier. Alle Zahlen sind Spielparameter (Platzhalter der Kalibrierung), keine Tatsachen.

import type { AchseId } from "../linien";

/** Wer eine Klausel-Stufe fordert oder ablehnt, mit je einem Satz Begründung. Keine echten Personen. */
export interface AkteursStimme {
  /** Institution, Fraktion, Verband oder Wählermilieu (Namen wie im Spiel üblich, erfunden oder organisch) */
  wer: string;
  /** Ein Satz Begründung aus der Sicht des Akteurs */
  grund: string;
}

/** Eine Stufe (Option) innerhalb einer Klausel. Jedes Gesetz braucht genau eine Stufe je Klausel. */
export interface KlauselStufe {
  id: string;
  name: string;
  /** Ein Satz: was diese Stufe bedeutet */
  text: string;
  /** Lage auf den fünf Achsen (data/linien.ts); Spieldaten, keine Wertung */
  achsen: Partial<Record<AchseId, number>>;
  /** Anker im bestehenden System: der Wert der Maßnahme im Politiknetz (0–100), den diese Stufe setzt */
  masse?: { massnahme: string; wert: number };
  /** Haushaltseffekt in Mrd. Lira je Jahr; positiv = Ausgaben oder Ausfälle, negativ = Einnahmen (Spielparameter) */
  haushaltMilliarden?: number;
  /** Umsetzungszeit in Monaten, bis die Wirkung vollständig sichtbar ist (Spielparameter) */
  monate?: number;
  /** Wer diese Stufe fordert */
  fuer: AkteursStimme[];
  /** Wer diese Stufe ablehnt */
  gegen: AkteursStimme[];
}

/** Eine Klausel: die Frage, die das Gesetz in diesem Punkt entscheidet. */
export interface GesetzesKlausel {
  id: string;
  titel: string;
  /** Die Frage, die diese Klausel beantwortet */
  frage: string;
  stufen: KlauselStufe[];
}

/** Ein Gesetzesentwurf: füllt eine Maßnahme des Politiknetzes mit Inhalt. */
export interface GesetzesEntwurf {
  id: string;
  /** Maßnahme-ID im Politiknetz (data/politiknetz.ts), die dieses Gesetz ausfüllt */
  massnahme: string;
  titel: string;
  thema: string;
  /** Ein Satz: warum dieses Gesetz immer wieder auf den Tisch kommt */
  dringlichkeit: string;
  /** Wer den Entwurf normalerweise einbringt */
  einbringer: string;
  /** Fester Kalender oder Auslöser, falls vorhanden (etwa „Dezember" beim Mindestlohn) */
  kalender?: string;
  klauseln: GesetzesKlausel[];
}
