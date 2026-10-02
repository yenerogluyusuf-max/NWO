// Zustand eines Konfliktvorgangs (MIL-1 „Krieg als Vorgang“).
// Der Präsident bestellt und verantwortet, er kommandiert nicht: Es gibt keine Taktik, nur
// Vorbereitung, Beschlüsse, eine abstrakte Frontlage, eine Erschöpfungsuhr und den Preis des Friedens.
// Alles reines JSON, damit Speichern und Laden wie beim übrigen Weltzustand funktionieren.
// Alle Zahlen dieser Schicht sind Spielparameter (Platzhalter der Kalibrierung), keine Tatsachenbehauptungen.

/** Die sechs Zustände des Vorgangs (Suzerain-Ableitung, RECHERCHE_SUZERAIN_KRIEGSMATRIX.md §9.1). */
export type KriegPhase = "spannung" | "drohkulisse" | "beschluss" | "krieg" | "waffenruhe" | "frieden" | "beendet";

/**
 * Die Kriegs-Rahmung (Civ6-Prinzip, RECHERCHE_VERTIEFUNG_KRIEG.md §4.1): Die deklarierte Begründung
 * legt die Preise der Folgehandlungen fest — Parlament, Weltöffentlichkeit und Wähler rechnen danach ab.
 *   verteidigung — Selbstverteidigung nach Zwischenfall (billigste, braucht hohe Eskalation als Beleg)
 *   schutz       — Schutz von Minderheiten (mittlerer Preis)
 *   beistand     — vertragliche Beistandspflicht (braucht einen laufenden Vertrag als Beleg)
 *   revision     — offene Revision (ungerahmter Angriff: innen billig, außen sehr teuer)
 */
export type KriegsRahmung = "verteidigung" | "schutz" | "beistand" | "revision";

/** Mobilisierungsstufen: keine, teilweise, voll (Vic3: Hochfahren kostet, Runterfahren kostet noch einmal). */
export type Mobilmachung = 0 | 1 | 2;

export type KriegsAusgang = "sieg" | "niederlage" | "rueckzug" | "weisser_frieden" | "frieden";

/** Ein eingebrachter Einsatzbeschluss, der auf die Abstimmung wartet (Weg „parlament“) oder sofort galt („erlass“). */
export interface KriegBeschluss {
  weg: "parlament" | "erlass";
  /** Tag der Abstimmung (nur Weg „parlament“) */
  abstimmung: number;
  rahmung: KriegsRahmung;
}

/** Kriegs-Klauseln des Friedenspakets (schrittweiser Frieden, RECHERCHE_SUZERAIN_KRIEGSMATRIX.md §9.1 Zustand 5/6). */
export interface FriedensPaket {
  /** 1 = Gebiet an die Türkei (Sieglage), −1 = Gebietsabtretung der Türkei (Niederlage), 0 = Status quo */
  gebiet: -1 | 0 | 1;
  /** 1 = Reparationen an die Türkei, −1 = Reparationen von der Türkei, 0 = keine */
  reparation: -1 | 0 | 1;
  /** Sicherheitsgarantien / Entmilitarisierung der Grenze */
  garantien: boolean;
  /** Gegenseitiger Truppenrückzug (weißer Frieden) */
  rueckzug: boolean;
}

export interface KriegVorgang {
  id: string;
  /** Länder-Kennung aus sim/laender.ts */
  land: string;
  phase: KriegPhase;
  /** Tag des Eintritts in die aktuelle Phase */
  seit: number;
  /** Treiber der Eskalation (0–100), folgt träge der Konflikt-Dimension des Landes */
  eskalation: number;
  mobilmachung: Mobilmachung;
  /** „Truppen in Bereitschaft“ wurde angeordnet (kleiner, einmaliger Schub) */
  bereit?: boolean;
  rahmung?: KriegsRahmung;
  kriegszielDeklariert?: boolean;
  beschluss?: KriegBeschluss;
  /** Abstrakte Frontlage 0–100: 100 = die Türkei siegt, 0 = Zusammenbruch (kein Taktikspiel) */
  front: number;
  /** Stand der Vorwoche, für die Trendanzeige */
  frontVorher: number;
  /** Erschöpfungsuhr der eigenen Heimatfront (Start 100; Vic3-War-Support) */
  uhr: number;
  /** Erschöpfungsuhr des Gegners */
  uhrGegner: number;
  /** Verstrichene Kriegswochen */
  woche: number;
  /** Kumulierte Verluste (0–100, treibt die Uhr und die Wähler) */
  verluste: number;
  /** Einmaliger Front-Schub aus der Handlung „Verstärkung“, wird in der nächsten Woche verrechnet */
  frontSchub?: number;
  /** Letzter Tag der Verstärkung (Abkühlung) */
  verstaerkungZuletzt?: number;
  /** Letzter Tag eines Abschreckungs-Signals (Abkühlung) */
  signalZuletzt?: number;
  /** Der Gegner hat Waffenruhe angeboten (liegt als Ereignis auf dem Tisch) */
  gegnerAngebot?: boolean;
  /** Waffenruhe-Wochen ohne nennenswerte Bewegung (für Angebote und Stagnationsfolgen) */
  stagnation?: number;
  /** Demobilisierung läuft bis zu diesem Tag (Vic3: 90 Tage Auslauf mit vollen Kosten) */
  demobBis?: number;
  /** Bis zu diesem Tag ist eine erneute Mobilisierung gesperrt */
  demobSperreBis?: number;
  /** Innenpreis des Friedens, schon verrechnet (für Chronik und Bilanz) */
  friedenspreis?: number;
  ausgang?: KriegsAusgang;
  /** Putsch-Risiko-Ereignis wurde nach einer Niederlage bereits ausgelöst */
  putsch?: boolean;
}
