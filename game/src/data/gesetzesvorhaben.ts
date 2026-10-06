// Gesetzesvorhaben: 26 Gesetze, die der Spieler in die Große Nationalversammlung (TBMM) einbringen kann, je in drei Fassungen.
// Grundlage: die Bausteine in data/gesetze/ (GLM, 05.10.2026) und RECHERCHE_GLM_8_GESETZGEBUNG.md; Konfliktlinien sind dort hergeleitet.
// Jedes Vorhaben füllt eine vorhandene Maßnahme des Politiknetzes (data/politiknetz.ts) und verschiebt sie in eine Richtung.
// Die Fassung bestimmt, wie weit: scharf (großer Schritt, hält die eigene Linie, weckt Widerstand), Kompromiss (mittlerer Schritt,
// holt Stimmen der Opposition) oder verwässert (kleiner Schritt, leicht durchzubringen, enttäuscht die Befürworter).
//
// Recht (Rahmen, als Spielregel umgesetzt, nicht als Rechtssatz):
// - Präsidialerlasse (Cumhurbaşkanlığı Kararnamesi) ersetzen seit 2018 die Notverordnungen mit Gesetzeskraft. Grundrechte, Strafnormen und
//   Gegenstände, die die Verfassung dem Gesetz vorbehält (etwa Steuern), sind ausgeschlossen. Fundstelle: RECHERCHE_GESETZGEBUNG_TUERKEI_2026-10-05.md
//   Abschnitt 5; dort als Art. 106 geführt, nach der Verfassung von 1982 in der Fassung von 2017 steht die Erlassbefugnis in Art. 104 Abs. 17 (zu prüfen).
// - Gesetze und Erlasse kann das Verfassungsgericht (AYM) auf Antrag aufheben (Art. 150 und 151; Antragsberechtigte und Fristen zu prüfen).
// Im Spiel: Erlass nur, wo `erlass` "anfechtbar" ist; Vorhaben mit `grundrechte` kippt das Gericht eher, und die größte Oppositionsfraktion
// kann sie nach der Annahme vor das Gericht bringen.
//
// Alle Zahlen hier (Schritte, Protest, Wirkungen) sind Spielparameter (Platzhalter der Kalibrierung), keine Tatsachen.

export type FassungId = "scharf" | "kompromiss" | "verwaessert";
export const FASSUNGEN: readonly FassungId[] = ["scharf", "kompromiss", "verwaessert"];

/** Verbände und Institutionen, die sich zu Gesetzen äußern. `gruppe`: die Wählergruppe des Netzes, deren Stimmung mitzieht (oder keine). */
export const VERBAENDE: Record<string, { gruppe?: string }> = {
  gewerkschaften: { gruppe: "arbeitnehmer" },
  beamtengewerkschaften: { gruppe: "beamte" },
  arbeitgeber: { gruppe: "unternehmer" },
  esnaf: { gruppe: "unternehmer" },
  bauwirtschaft: { gruppe: "unternehmer" },
  eigentuemer: {},
  mieter: { gruppe: "arme" },
  rentnerverbaende: { gruppe: "rentner" },
  bauernverband: { gruppe: "landwirte" },
  anwaltskammern: { gruppe: "staedtische_saekulare" },
  ingenieurkammern: { gruppe: "staedtische_saekulare" },
  menschenrechtsvereine: { gruppe: "staedtische_saekulare" },
  frauenverbaende: { gruppe: "staedtische_saekulare" },
  journalisten: { gruppe: "staedtische_saekulare" },
  umweltverbaende: { gruppe: "junge" },
  studenten: { gruppe: "junge" },
  religioese_verbaende: { gruppe: "konservative" },
  alevitische_verbaende: { gruppe: "minderheiten" },
  kurdische_verbaende: { gruppe: "minderheiten" },
  veteranen: { gruppe: "nationalisten" },
  generalstab: {},
  finanzministerium: {},
  zentralbank: {},
  eu: {},
};

export interface GesetzesVorhaben {
  id: string;
  /** Maßnahme im Politiknetz */
  massnahme: string;
  /** +1: das Gesetz erhöht die Maßnahme, −1: es senkt sie */
  richtung: 1 | -1;
  /** Schritt in Stufenpunkten je Fassung (scharf, Kompromiss, verwässert); Standard 30/18/8 */
  schritte?: readonly [number, number, number];
  /** Wählergruppen (Netzknoten) oder Verbände (VERBAENDE), die dafür sind */
  fuer: readonly string[];
  gegen: readonly string[];
  /** Ob der Präsident es ersatzweise per Erlass regeln kann (dann mit dem Risiko, dass das Verfassungsgericht ihn aufhebt) */
  erlass: "nein" | "anfechtbar";
  /** Berührt Grundrechte: Das Gericht kippt eher, die Opposition klagt nach der Annahme */
  grundrechte?: boolean;
  /** Straßendruck bei scharfer Fassung (0 bis 1) */
  protest: number;
  /** Wird in den Rathäusern umgesetzt; Oppositionsrathäuser bremsen sichtbar */
  kommunal?: boolean;
  /** Monat (1 bis 12), in dem das Thema auf den Tisch drängt (Mindestlohn im Dezember) */
  kalender?: number;
  /** Baustein in data/gesetze/, aus dem die Konfliktlinien stammen */
  baustein?: string;
}

export const STANDARD_SCHRITTE = [30, 18, 8] as const;

export const GESETZESVORHABEN: readonly GesetzesVorhaben[] = [
  // Arbeit, Steuern, Soziales
  { id: "gv_mindestlohn", massnahme: "m_mindestlohn", richtung: 1, fuer: ["gewerkschaften", "arbeitnehmer", "arme"], gegen: ["arbeitgeber", "esnaf", "zentralbank"], erlass: "nein", protest: 0.1, kalender: 12, baustein: "g_mindestlohn" },
  { id: "gv_einkommensteuer", massnahme: "m_einkommensteuer", richtung: -1, schritte: [24, 14, 6], fuer: ["arbeitnehmer", "beamte", "unternehmer"], gegen: ["finanzministerium", "zentralbank"], erlass: "nein", protest: 0, baustein: "g_einkommensteuer" },
  { id: "gv_vermoegen", massnahme: "m_immobiliensteuer", richtung: 1, fuer: ["arme", "gewerkschaften", "finanzministerium"], gegen: ["eigentuemer", "unternehmer", "konservative"], erlass: "nein", protest: 0.2 },
  { id: "gv_mwst", massnahme: "m_mwst", richtung: -1, schritte: [20, 12, 5], fuer: ["arme", "rentner", "esnaf"], gegen: ["finanzministerium", "zentralbank"], erlass: "nein", protest: 0, baustein: "g_mwst" },
  { id: "gv_unternehmensteuer", massnahme: "m_koerperschaftsteuer", richtung: -1, fuer: ["arbeitgeber", "unternehmer"], gegen: ["gewerkschaften", "finanzministerium", "arme"], erlass: "nein", protest: 0.2, baustein: "g_koerperschaftsteuer" },
  { id: "gv_renten", massnahme: "m_renten", richtung: 1, fuer: ["rentner", "rentnerverbaende"], gegen: ["finanzministerium", "zentralbank", "junge"], erlass: "nein", protest: 0, kalender: 7, baustein: "g_renten" },
  { id: "gv_gewerkschaft", massnahme: "m_gewerkschaftsrechte", richtung: 1, fuer: ["gewerkschaften", "arbeitnehmer", "eu"], gegen: ["arbeitgeber", "esnaf"], erlass: "nein", grundrechte: true, protest: 0.1 },
  // Energie und Wohnen
  { id: "gv_energiepreisbremse", massnahme: "m_energiesubventionen", richtung: 1, fuer: ["arme", "rentner", "esnaf"], gegen: ["finanzministerium", "umweltverbaende", "eu"], erlass: "anfechtbar", protest: 0, kalender: 11, baustein: "g_energiesubventionen" },
  { id: "gv_preiswahrheit", massnahme: "m_preiswahrheit", richtung: 1, fuer: ["umweltverbaende", "zentralbank", "finanzministerium"], gegen: ["arme", "rentner", "esnaf"], erlass: "anfechtbar", protest: 0.7, baustein: "g_preiswahrheit" },
  { id: "gv_kernenergie", massnahme: "m_kernkraft", richtung: 1, fuer: ["arbeitgeber", "unternehmer"], gegen: ["umweltverbaende", "junge"], erlass: "anfechtbar", protest: 0.4, kommunal: true, baustein: "g_kernkraft" },
  { id: "gv_mietdeckel", massnahme: "m_mietdeckel", richtung: 1, fuer: ["mieter", "junge", "arme"], gegen: ["eigentuemer", "bauwirtschaft"], erlass: "nein", protest: 0.1, kommunal: true, baustein: "g_mietdeckel" },
  { id: "gv_wohnungsbau", massnahme: "m_sozialwohnungen", richtung: 1, fuer: ["arme", "junge", "bauwirtschaft"], gegen: ["finanzministerium", "umweltverbaende"], erlass: "anfechtbar", protest: 0, kommunal: true, baustein: "g_sozialwohnungen" },
  { id: "gv_bauamnestie", massnahme: "m_bauamnestie", richtung: 1, fuer: ["eigentuemer", "bauwirtschaft", "arme"], gegen: ["ingenieurkammern", "umweltverbaende", "staedtische_saekulare"], erlass: "nein", protest: 0.3, kommunal: true, baustein: "g_bauamnestie" },
  // Sicherheit und Freiheit
  { id: "gv_polizei", massnahme: "m_polizei", richtung: 1, fuer: ["nationalisten", "konservative", "beamtengewerkschaften"], gegen: ["menschenrechtsvereine", "anwaltskammern", "minderheiten"], erlass: "anfechtbar", grundrechte: true, protest: 0.5, baustein: "g_polizei" },
  { id: "gv_versammlung", massnahme: "m_versammlungsfreiheit", richtung: 1, fuer: ["studenten", "menschenrechtsvereine", "gewerkschaften"], gegen: ["nationalisten", "konservative"], erlass: "nein", protest: 0, baustein: "g_versammlungsfreiheit" },
  { id: "gv_netzinhalte", massnahme: "m_internetsperren", richtung: 1, fuer: ["nationalisten", "konservative"], gegen: ["junge", "journalisten", "unternehmer", "eu"], erlass: "anfechtbar", grundrechte: true, protest: 0.6, baustein: "g_internetsperren" },
  { id: "gv_medienaufsicht", massnahme: "m_medienaufsicht", richtung: 1, fuer: ["konservative", "nationalisten"], gegen: ["journalisten", "staedtische_saekulare", "eu"], erlass: "nein", grundrechte: true, protest: 0.4, baustein: "g_medienaufsicht" },
  { id: "gv_wehrdienst", massnahme: "m_wehrdienst", richtung: -1, schritte: [24, 14, 6], fuer: ["junge", "studenten"], gegen: ["generalstab", "veteranen", "nationalisten"], erlass: "nein", protest: 0 },
  // Recht und Staat
  { id: "gv_justizreform", massnahme: "m_justizreform", richtung: 1, fuer: ["anwaltskammern", "unternehmer", "eu"], gegen: ["beamte", "nationalisten"], erlass: "nein", protest: 0, baustein: "g_justizreform" },
  { id: "gv_richterstellen", massnahme: "m_richterstellen", richtung: 1, fuer: ["anwaltskammern", "unternehmer", "beamte"], gegen: ["finanzministerium"], erlass: "nein", protest: 0, baustein: "g_richterstellen" },
  { id: "gv_antikorruption", massnahme: "m_antikorruption", richtung: 1, fuer: ["staedtische_saekulare", "unternehmer", "eu"], gegen: ["bauwirtschaft", "beamte"], erlass: "nein", protest: 0 },
  // Gesellschaft, Glaube, Minderheiten
  { id: "gv_imamhatip", massnahme: "m_religioese_schulen", richtung: 1, fuer: ["konservative", "religioese_verbaende"], gegen: ["staedtische_saekulare", "alevitische_verbaende"], erlass: "nein", protest: 0.4 },
  { id: "gv_gewaltschutz", massnahme: "m_gewaltschutz", richtung: 1, fuer: ["frauenverbaende", "staedtische_saekulare", "eu"], gegen: ["religioese_verbaende", "konservative"], erlass: "nein", protest: 0.2 },
  { id: "gv_minderheiten", massnahme: "m_minderheitenrechte", richtung: 1, fuer: ["minderheiten", "kurdische_verbaende", "alevitische_verbaende", "eu"], gegen: ["nationalisten", "veteranen"], erlass: "nein", grundrechte: true, protest: 0.4 },
  // Frieden und Migration
  { id: "gv_friedensprozess", massnahme: "m_friedensprozess", richtung: 1, fuer: ["kurdische_verbaende", "minderheiten", "eu"], gegen: ["nationalisten", "veteranen", "generalstab"], erlass: "nein", protest: 0.5, baustein: "g_friedensprozess" },
  { id: "gv_rueckkehr", massnahme: "m_rueckkehr", richtung: 1, fuer: ["nationalisten", "arbeitnehmer", "konservative"], gegen: ["menschenrechtsvereine", "arbeitgeber", "eu"], erlass: "anfechtbar", grundrechte: true, protest: 0.2, baustein: "g_rueckkehr" },
];

export const VORHABEN_NACH_ID = new Map(GESETZESVORHABEN.map((v) => [v.id, v]));

/** Spielparameter der Fassungen: Stimmen, Stimmung der Lager, Straßendruck, Gericht. */
export const FASSUNG_WERTE: Record<FassungId, {
  /** Anteil der Oppositionssitze, der zusätzlich mitstimmt */
  opposition: number;
  /** Anteil der eigenen Lagersitze, der abspringt */
  lager: number;
  /** Stimmungsstoß bei den Befürwortern und Gegnern nach der Annahme (Netzpunkte) */
  fuer: number;
  gegen: number;
  /** Faktor auf den Straßendruck */
  protest: number;
  /** Faktor auf die Wahrscheinlichkeit, dass das Gericht aufhebt */
  gericht: number;
}> = {
  scharf: { opposition: 0, lager: 0.02, fuer: 2.5, gegen: -2.5, protest: 6, gericht: 1.2 },
  kompromiss: { opposition: 0.04, lager: 0, fuer: 1.5, gegen: -1, protest: 3, gericht: 0.8 },
  verwaessert: { opposition: 0.09, lager: 0, fuer: -0.5, gegen: -0.3, protest: 1, gericht: 0.4 },
};
