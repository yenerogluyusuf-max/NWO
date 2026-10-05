// Behörden als ausbaubarer Bestand: Jede Behörde hat drei Ausbauwerte (Personal, Technik, Reichweite oder Fachwissen) mit Stufen 1 bis 5.
//
// Alle Zahlen hier sind Spielparameter (Platzhalter der Kalibrierung), keine Tatsachenbehauptungen: Startstufen, Kosten in Prozent
// des BIP, Bauzeiten, Unterhalt und Wirkungen. Stufe 3 bedeutet „wie heute“; die Startwerte sind eine spielerische Einordnung des
// heutigen Zustands (Richtung aus den Kernwerten des Spiels, etwa Justizrückstau oder Erdbebenvorsorge), nicht gemessen.
//
// Wirkungen sind dauerhafte Verschiebungen einer Größe des Politiknetzes in Punkten je Ertragseinheit; die Ertragseinheit wächst mit
// abnehmendem Ertrag (sim/behoerden.ts `ertrag`): Die erste Stufe über dem Start bringt viel, die fünfte wenig.

export type Achse = "personal" | "technik" | "reichweite";
export const ACHSEN: readonly Achse[] = ["personal", "technik", "reichweite"];

export type BehoerdeId =
  | "mit"
  | "polizei"
  | "justiz"
  | "steuer"
  | "afad"
  | "gesundheit"
  | "bildung"
  | "diplomatie"
  | "statistik"
  | "grenzschutz"
  | "cyber";

/** Bereich der Akte, in der die Behörde erscheint (gleiche Kennungen wie ui/akte/Bereiche.tsx). */
export type BehoerdeBereich = "gesellschaft" | "recht" | "regierung" | "sicherheit" | "aussen" | "land" | "wissen" | "medien";

/** Dauerhafte Verschiebung einer Größe des Netzes je Ertragseinheit (Punkte, Spielparameter). */
export interface BehoerdeWirkung {
  id: string;
  d: number;
}

/** Ein Sonderinstrument, das eine Behörde erst ab einer Ausbaustufe hat. */
export interface InstrumentDef {
  id: string;
  achse: Achse;
  ab: number;
  /** Politisches Kapital */
  pk: number;
  /** Einmalige Kosten in Prozent des BIP */
  bip: number;
  /** Abkühlzeit in Monaten */
  abkuehlung: number;
  /** Einmalige Stöße auf das Netz */
  stoss: BehoerdeWirkung[];
  /** Verstärkt die Gegenspionage des Dienstes für so viele Monate (nur Cyberabwehr) */
  abwehrMonate?: number;
}

export interface BehoerdeDef {
  id: BehoerdeId;
  bereich: BehoerdeBereich;
  /** Ressort für die Etats des Haushalts (Anbindung über sim/behoerden.ts `setzeEtatAnbindung`) */
  ressort: string;
  /** Rückfall ohne Ressortetat: der Haushaltsregler, dessen Stufe die Bauzeit beschleunigt oder bremst (sim/haushalt.ts) */
  posten: string;
  /** Startstufen (Spielparameter, 3 = wie heute) */
  start: Record<Achse, number>;
  wirkung: Record<Achse, BehoerdeWirkung[]>;
  /** Einmalige Kosten je Ausbauschritt in Prozent des BIP, wächst mit der Zielstufe */
  bip: number;
  /** Laufender Unterhalt je Stufe über dem Start in Prozent des BIP pro Jahr (unter dem Start: Ersparnis) */
  unterhalt: number;
  /** Grunddauer eines Ausbauschritts in Monaten */
  monate: number;
  /** Politisches Kapital je Ausbauschritt (Grundwert) */
  pk: number;
  instrument?: InstrumentDef;
}

const w = (id: string, d: number): BehoerdeWirkung => ({ id, d });

export const BEHOERDEN: readonly BehoerdeDef[] = [
  {
    id: "mit", bereich: "sicherheit", ressort: "praesidialamt", posten: "sicherheit",
    start: { personal: 3, technik: 3, reichweite: 3 },
    // Die Wirkung des Dienstes läuft vor allem über seine Operationen (sim/welt-dienst.ts); hier nur der Grundschutz.
    wirkung: { personal: [w("terrorgefahr", -1.5)], technik: [w("terrorgefahr", -1)], reichweite: [] },
    bip: 0.03, unterhalt: 0.02, monate: 6, pk: 3,
  },
  {
    id: "polizei", bereich: "sicherheit", ressort: "inneres", posten: "sicherheit",
    start: { personal: 3, technik: 3, reichweite: 3 },
    wirkung: {
      personal: [w("kriminalitaet", -4), w("beamte", 1)],
      technik: [w("kriminalitaet", -2.5), w("korruption", -1)],
      reichweite: [w("kriminalitaet", -2), w("terrorgefahr", -1.5)],
    },
    bip: 0.06, unterhalt: 0.05, monate: 6, pk: 3,
    instrument: { id: "schwerpunkt", achse: "technik", ab: 4, pk: 3, bip: 0.02, abkuehlung: 12, stoss: [w("kriminalitaet", -4), w("korruption", -1.5), w("pressefreiheit", -0.5)] },
  },
  {
    id: "justiz", bereich: "recht", ressort: "justiz", posten: "personal",
    start: { personal: 2, technik: 3, reichweite: 3 },
    wirkung: {
      personal: [w("justiz_kapazitaet", 5), w("justiz_effizienz", 2), w("haftueberfuellung", -1.5)],
      technik: [w("justiz_effizienz", 3), w("rechtssicherheit", 1)],
      reichweite: [w("justizvertrauen", 2), w("rechtssicherheit", 2)],
    },
    bip: 0.04, unterhalt: 0.03, monate: 8, pk: 3,
    instrument: { id: "sonderkammern", achse: "personal", ab: 4, pk: 3, bip: 0.02, abkuehlung: 18, stoss: [w("justiz_effizienz", 5), w("haftueberfuellung", -2), w("justiz_unabhaengigkeit", -1)] },
  },
  {
    id: "steuer", bereich: "regierung", ressort: "finanzen", posten: "personal",
    start: { personal: 3, technik: 3, reichweite: 3 },
    wirkung: {
      personal: [w("steuereinnahmen", 2), w("schattenwirtschaft", -1.5)],
      technik: [w("steuereinnahmen", 2), w("schattenwirtschaft", -2), w("steuermoral", 1)],
      reichweite: [w("schattenwirtschaft", -1.5), w("informelle_arbeit", -1.5), w("mittelstand", -0.5)],
    },
    bip: 0.02, unterhalt: 0.015, monate: 6, pk: 2,
    instrument: { id: "datenabgleich", achse: "technik", ab: 4, pk: 3, bip: 0.01, abkuehlung: 12, stoss: [w("steuereinnahmen", 3), w("schattenwirtschaft", -3), w("unternehmer", -2)] },
  },
  {
    id: "afad", bereich: "land", ressort: "inneres", posten: "investitionen",
    start: { personal: 3, technik: 2, reichweite: 3 },
    wirkung: {
      personal: [w("katastrophenschutz", 4)],
      technik: [w("katastrophenschutz", 3), w("erdbebenvorsorge", 2)],
      reichweite: [w("katastrophenschutz", 2), w("erdbebenvorsorge", 2.5)],
    },
    bip: 0.03, unterhalt: 0.02, monate: 6, pk: 2,
    instrument: { id: "uebung", achse: "reichweite", ab: 4, pk: 2, bip: 0.01, abkuehlung: 12, stoss: [w("katastrophenschutz", 4), w("erdbebenvorsorge", 2), w("vertrauen_regierung", 0.5)] },
  },
  {
    id: "gesundheit", bereich: "gesellschaft", ressort: "gesundheit", posten: "gesundheit_bildung",
    start: { personal: 3, technik: 3, reichweite: 3 },
    wirkung: {
      personal: [w("aerzte", 4), w("wartezeiten", -2.5)],
      technik: [w("gesundheitsversorgung", 3), w("medikamente", 1)],
      reichweite: [w("gesundheitsversorgung", 2), w("wartezeiten", -1.5), w("landflucht", -0.5)],
    },
    bip: 0.08, unterhalt: 0.07, monate: 9, pk: 3,
    instrument: { id: "mobile_teams", achse: "reichweite", ab: 4, pk: 2, bip: 0.02, abkuehlung: 12, stoss: [w("wartezeiten", -3), w("gesundheitsversorgung", 2), w("arme", 1)] },
  },
  {
    id: "bildung", bereich: "wissen", ressort: "bildung", posten: "gesundheit_bildung",
    start: { personal: 3, technik: 2, reichweite: 3 },
    wirkung: {
      personal: [w("bildungsqualitaet", 3), w("schulabbruch", -2)],
      technik: [w("bildungsqualitaet", 2), w("fachkraefte", 1.5)],
      reichweite: [w("schulabbruch", -2.5), w("bildungsqualitaet", 1), w("frauenerwerb", 0.5)],
    },
    bip: 0.08, unterhalt: 0.07, monate: 12, pk: 3,
    instrument: { id: "brennpunkte", achse: "reichweite", ab: 4, pk: 2, bip: 0.02, abkuehlung: 12, stoss: [w("schulabbruch", -3), w("bildungsqualitaet", 2), w("junge", 1)] },
  },
  {
    id: "diplomatie", bereich: "aussen", ressort: "aussen", posten: "personal",
    start: { personal: 3, technik: 3, reichweite: 4 },
    wirkung: {
      personal: [w("ansehen", 2)],
      technik: [w("ansehen", 1), w("export", 0.5)],
      reichweite: [w("ansehen", 1.5), w("beziehungen_nahost", 1), w("export", 1)],
    },
    bip: 0.01, unterhalt: 0.01, monate: 6, pk: 2,
    instrument: { id: "vermittlung", achse: "reichweite", ab: 5, pk: 3, bip: 0.005, abkuehlung: 12, stoss: [w("ansehen", 3), w("beziehungen_nahost", 2), w("beziehungen_eu", 1)] },
  },
  {
    id: "statistik", bereich: "regierung", ressort: "finanzen", posten: "personal",
    start: { personal: 3, technik: 3, reichweite: 2 },
    // Reichweite heißt hier Unabhängigkeit und Fachwissen: Glaubwürdige Zahlen helfen den Märkten, schonen aber nicht die Regierung
    wirkung: {
      personal: [w("vertrauen_maerkte", 1)],
      technik: [w("vertrauen_maerkte", 1), w("produktivitaet", 0.3)],
      reichweite: [w("vertrauen_maerkte", 3), w("vertrauen_regierung", -0.5)],
    },
    bip: 0.003, unterhalt: 0.002, monate: 6, pk: 2,
    instrument: { id: "revision", achse: "reichweite", ab: 4, pk: 3, bip: 0.001, abkuehlung: 24, stoss: [w("vertrauen_maerkte", 4), w("auslandskapital", 2), w("vertrauen_regierung", -1.5)] },
  },
  {
    id: "grenzschutz", bereich: "sicherheit", ressort: "inneres", posten: "sicherheit",
    start: { personal: 3, technik: 3, reichweite: 3 },
    wirkung: {
      personal: [w("terrorgefahr", -1), w("gefluechtete", -1.5)],
      technik: [w("terrorgefahr", -1), w("schattenwirtschaft", -0.5), w("gefluechtete", -1)],
      reichweite: [w("terrorgefahr", -0.5), w("tourismus", 0.5)],
    },
    bip: 0.03, unterhalt: 0.02, monate: 8, pk: 2,
    instrument: { id: "grenzlage", achse: "technik", ab: 4, pk: 3, bip: 0.02, abkuehlung: 12, stoss: [w("gefluechtete", -3), w("terrorgefahr", -2), w("beziehungen_eu", 1)] },
  },
  {
    id: "cyber", bereich: "sicherheit", ressort: "praesidialamt", posten: "sicherheit",
    start: { personal: 2, technik: 2, reichweite: 2 },
    wirkung: {
      personal: [w("internet", 0.5)],
      technik: [w("auslandskapital", 0.5), w("internet", 0.5)],
      reichweite: [w("vertrauen_maerkte", 0.5)],
    },
    bip: 0.01, unterhalt: 0.01, monate: 6, pk: 2,
    instrument: { id: "schutzschirm", achse: "technik", ab: 4, pk: 2, bip: 0.005, abkuehlung: 12, stoss: [w("auslandskapital", 0.5)], abwehrMonate: 6 },
  },
];

export const BEHOERDE_NACH_ID: Record<BehoerdeId, BehoerdeDef> = Object.fromEntries(BEHOERDEN.map((b) => [b.id, b])) as Record<BehoerdeId, BehoerdeDef>;

/** Spielparameter des Ausbaus. */
export const AUSBAU = {
  /** Abnehmender Ertrag: Die k-te Stufe bringt `abnahme^(k−1)` einer ganzen Ertragseinheit */
  abnahme: 0.75,
  /** Bauzeit wächst je Zielstufe um diesen Anteil */
  dauerJeStufe: 0.25,
  /** Kürzen: Anteil der laufenden Arbeit, der verloren geht (Stöße auf Beamte und die Leitung) */
  kuerzStoss: 1.5,
  /** Wie viel Kapital zusätzlich fällig wird, wenn der Haushalt keinen Ressortetat anbietet (Rückfall) */
  pkOhneEtat: 1,
  /** Anteil des Mehretats eines Ressorts (Haushaltsstufe über dem Haushaltsgesetz), der im Jahr Ausbau und Unterhalt seiner Behörden trägt */
  etatSpielraum: 0.5,
} as const;

/** Welcher Haushaltsregler (sim/haushalt.ts, Ressortetats) die Behörden eines Ressorts bezahlt (Spielparameter der Zuordnung). */
export const RESSORT_POSTEN: Record<string, string> = {
  praesidialamt: "innere_sicherheit",
  inneres: "innere_sicherheit",
  justiz: "personal",
  finanzen: "personal",
  gesundheit: "gesundheit",
  bildung: "bildung",
  aussen: "personal",
};
