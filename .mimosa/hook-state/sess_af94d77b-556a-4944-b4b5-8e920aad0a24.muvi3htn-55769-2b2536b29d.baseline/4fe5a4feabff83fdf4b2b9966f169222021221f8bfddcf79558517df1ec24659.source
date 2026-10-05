// Typen des Gesellschaftsmodells (Fork GESELLSCHAFT, 05.10.2026): Milieus mit Groll, Opposition als Akteur, Bewegungen auf der Straße,
// Rathäuser je Provinz. Der Zustand liegt in spiel.gesellschaft; ältere Spielstände legen ihn beim ersten Zugriff an (sim/gesellschaft.ts).
// Alles reines JSON, damit Speichern und Laden wie beim übrigen Weltzustand funktionieren.

export type MilieuId = "kurden" | "aleviten" | "frauen" | "gefluechtete" | "diaspora";

export interface MilieuZustand {
  /** Angestauter Groll, 0 bis 100: wächst, solange die Stimmung schlecht ist, und klingt nur langsam ab (Gedächtnis) */
  groll: number;
  /** Letzte Stimmung (0 bis 100), für Anzeige und Trend */
  stimmung: number;
}

export type OppZugArt = "kampagne" | "ausschuss" | "grossdemo" | "buendnis" | "boykott" | "anfrage";

export interface OppZug {
  tag: number;
  datum: string;
  art: OppZugArt;
  text: string;
}

export interface OppositionZustand {
  /** Kürzel der führenden Oppositionspartei (stärkste Fraktion außerhalb des Lagers) */
  partei: string;
  /** Mobilisierung und Glaubwürdigkeit der Opposition, 0 bis 100 */
  staerke: number;
  /** Parteien, mit denen sie ein Bündnis geschmiedet hat */
  buendnis: string[];
  /** Laufende Verfahren gegen die Führung (klingen ab) */
  verfahren: number;
  /** Mitgefühl durch Repression: stärkt sie später */
  maertyrer: number;
  immunitaetAufgehoben?: boolean;
  /** Verbotsverfahren vor dem Verfassungsgericht */
  verbot?: { seit: number; entscheidAm: number; ausgang?: "verboten" | "abgewiesen" };
  /** Offene Forderung nach einem Untersuchungsausschuss bis zu diesem Tag */
  ausschussBis?: number;
  /** Tag des nächsten eigenen Zuges */
  naechsterZug: number;
  zuege: OppZug[];
}

export type BewegungsArt = "teuerung" | "studenten" | "kurden" | "aleviten" | "frauen" | "arbeiter" | "nationalisten" | "opposition";
export type BewegungsPhase = "keimt" | "waechst" | "massen" | "abklingend";
export type BewegungsAntwort = "dialog" | "zugestaendnis" | "polizei" | "verbot";

export interface Bewegung {
  id: string;
  art: BewegungsArt;
  provinzen: number[];
  /** 0 bis 100: wie viele auf der Straße sind */
  groesse: number;
  /** 0 bis 100: wie unversöhnlich und gewaltbereit */
  radikalitaet: number;
  /** 0 bis 100: Mitgefühl durch Opfer und Verhaftungen; nährt Groll und neue Proteste */
  maertyrer: number;
  seit: number;
  phase: BewegungsPhase;
  /** Größe im Vormonat, für Trend und Phase */
  vorher: number;
  letzte?: { antwort: BewegungsAntwort; tag: number };
}

export interface Rathaus {
  partei: string;
  /** Zwangsverwaltung seit diesem Tag */
  verwalter?: { seit: number };
}

export interface KommunalwahlErgebnis {
  datum: string;
  lagerVorher: number;
  lagerNachher: number;
  gewonnen: number[];
  verloren: number[];
}

export interface KommunenZustand {
  rathaus: Record<string, Rathaus>;
  /** ISO-Datum der nächsten Kommunalwahl */
  naechste: string;
  wahlen: KommunalwahlErgebnis[];
}

export interface GesellschaftsMonat {
  monat: string;
  polarisierung: number;
  protest: number;
  opposition: number;
  repression: number;
  rathaeuserLager: number;
  grollMittel: number;
  bewegungen: number;
}

export interface GesellschaftZustand {
  v: 1;
  milieus: Record<MilieuId, MilieuZustand>;
  /** Gedächtnis der Repression, 0 bis 100: steigt mit harten Eingriffen, klingt langsam ab */
  repression: number;
  opposition: OppositionZustand;
  bewegungen: Bewegung[];
  /** Zuletzt aufgelöste Bewegungen (Chronik der Straße) */
  frueher: { art: BewegungsArt; von: string; bis: string; spitze: number; ende: BewegungsAntwort | "abgeklungen" }[];
  kommunen: KommunenZustand;
  verlauf: GesellschaftsMonat[];
  /** Letzter Tag je Instrument (Abkühlung) */
  zuletzt: Record<string, number>;
  /** Letzter verarbeiteter Monat (JJJJ-MM) */
  monat: string;
}
