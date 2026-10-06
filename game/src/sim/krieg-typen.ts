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

/**
 * Wer an der Seite der Türkei oder des Gegners kämpft (sim/pakte.ts): Die Koalition ersetzt die frühere Pauschale
 * „Beistands-Klausel gibt höchstens +15 Prozent“. Pflicht entsteht nur aus Pakten (Klausel „kollektiv“ oder „beistand“) und nur, wenn ein
 * Mitglied ANGEGRIFFEN wird; wer selbst angreift, löst keinen Bündnisfall aus (und sitzt der Pakt mit beiden Streitparteien am Tisch,
 * spaltet der Krieg den Pakt, statt ihn zu verpflichten). Alle Zahlen sind Spielparameter.
 */
export interface KoalitionsPartner {
  /** Akteur-Kennung (Hauptakteur oder weiterer Staat) */
  id: string;
  seite: "eigen" | "gegner";
  /** Tag des Beitritts */
  seit: number;
  /** Warum er mitmacht, in einem Satz */
  grund: string;
  /** Pakt, aus dem die Pflicht stammt (Institutions-Kennung oder „bilateral-<Land>“) */
  pakt?: string;
  /** Ob eine Beistandspflicht bestand (sonst reines Eigeninteresse) */
  pflicht: boolean;
  /** Verbleibende Kampfkraft 0 bis 1; sinkt, wenn die Seite verliert, der Partner steigt bei 0 aus */
  rest: number;
  /** Einsatzgrad 0,4 bis 1: wie voll der Partner mitmacht */
  einsatz: number;
}

export interface KoalitionsAbwesender {
  id: string;
  seite: "eigen" | "gegner";
  /** Ob eine Pflicht bestand und nicht erfüllt wurde (kostet die Türkei Vertrauen, falls sie die Seite ist) */
  pflicht: boolean;
  grund: string;
  /** Punkte der letzten Bewertung (für die Anzeige „zögert“: zwischen Zögerschwelle und Beitrittsschwelle) */
  punkte: number;
  /** Ob er noch zögert (wird weiter geprüft) oder endgültig draußen bleibt */
  zoegert: boolean;
}

export interface KriegKoalition {
  /** Wer zuerst angriff: die Türkei (Beschluss, Erlass) oder der Gegner (Schlag aus der Drohkulisse) */
  aggressor: "tuerkei" | "gegner";
  partner: KoalitionsPartner[];
  abwesend: KoalitionsAbwesender[];
  /** Pakt, der durch den Krieg zwischen zwei Mitgliedern gespalten wurde (keine automatische Pflicht) */
  spaltung?: string;
  /** Tag der letzten Bewertung und der letzten Bitte um Beistand (Abkühlung) */
  bewertet: number;
  gerufen?: number;
}

/** Kriegs-Klauseln des Friedenspakets (schrittweiser Frieden, RECHERCHE_SUZERAIN_KRIEGSMATRIX.md §9.1 Zustand 5/6). */
export interface FriedensPaket {
  /** 1 = Pufferzone unter türkischer Kontrolle (Sieglage, kein Besitzerwechsel), −1 = Grenzzugeständnisse der Türkei (Niederlage), 0 = Status quo */
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
  /** Gewählter Zielraum (data/streitkraefte.ts ZIELRAEUME); Vorstufe der Regionen mit Besitzerwechsel */
  zielraum?: string;
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
  /** Koalitionen beider Seiten (sim/pakte.ts); ältere Spielstände haben das Feld nicht, es entsteht beim ersten Zugriff */
  koalition?: KriegKoalition;
  /** Der Vorgang entstand aus einem Beistandsruf eines Pakt-Partners (Pakt und Partner, für Anzeige und Beleg der Rahmung „beistand“) */
  beistandFuer?: { partner: string; pakt: string };
  /**
   * Schauplatz (sim/kriegsschauplatz.ts, data/schauplaetze.ts): Einsatzart und Tempo als die zwei Entscheidungen der Kriegsführung,
   * Lage jeder Region, Bestand des Gegners und die Verluste der letzten Woche. Ältere Spielstände haben die Felder nicht: Dann gilt
   * „gemischt“ und „normal“ (alle Faktoren 1), der Gegnerbestand entsteht beim ersten Zugriff mit Stand 2026.
   */
  einsatz?: EinsatzWahl;
  /** Tag der letzten Umstellung der Einsatzart (Abkühlung) */
  einsatzSeit?: number;
  tempo?: KriegsTempoWahl;
  regionen?: Record<string, RegionLage>;
  gegnerBestand?: Record<GegnerGattungId, { menge: number; generation: number }>;
  /** Verluste der letzten Kriegswoche in Prozent des jeweiligen Bestands (Anzeige) */
  letzteWoche?: { eigen: number; gegner: number; region?: string };
  /** Türkische Grenzprovinzen (Plaka), auf die der Gegner gerade vorstößt */
  bedroht?: number[];
}

export type EinsatzWahl = "luft" | "boden" | "see" | "stellvertreter";
export type KriegsTempoWahl = "vorsichtig" | "normal" | "hart";
export type GegnerGattungId = "heer" | "luft" | "luftabwehr" | "see" | "drohnen";
/** Lage einer Region im Krieg: beim Gegner, umkämpft (die Front steht dort) oder unter türkischer Kontrolle */
export type RegionLage = "gegner" | "umkaempft" | "eigen";

/** Eine besetzte Region nach dem Frieden (sim/kriegsschauplatz.ts): Form, Widerstand, Kosten. */
export interface BesatzungsGebiet {
  region: string;
  land: string;
  seit: number;
  form: "pufferzone" | "verwaltung" | "annexion";
  /** 0 bis 100 */
  widerstand: number;
  /** Monate in Folge über der Aufstandsschwelle */
  aufstand: number;
}

// Gebietsübertragung (Welle 2, noch nicht gebaut): Der Hebel liegt in sim/krieg.ts, Funktion `friedenSchliessen`: Dort steht heute
// `p.gebiet` (+1 Pufferzone unter türkischer Kontrolle, −1 Grenzzugeständnisse) und ändert nur Beziehungswerte und Stimmung;
// die Texte sagen das ehrlich (kein Besitzerwechsel, Katalog `wort.krieg.*`, Stand 05.10.2026). Sobald Regionen anderer Länder als Daten existieren,
// ersetzt das Paket das Feld `gebiet` durch eine Liste der Regionen (Kriegsziele, die der Vorgang vorher festlegt); `friedenSchliessen`
// überträgt dann den Besitzer jeder Region und startet die Integrationsphase. Diese Typen und `paketAnnahme` (Härte des Pakets)
// bleiben die Schnittstelle; die Koalitionspartner (`koalition`) verhandeln am Friedenstisch mit und dürfen eigene Regionen als Ziel haben.
