// Das politische Spektrum: fünf Achsen, auf denen Parteien, Wählergruppen, Maßnahmen und die eigene Partei liegen.
// Alle Werte sind Spielparameter (Platzhalter der Kalibrierung), keine Tatsachenbehauptungen über echte Parteien oder Gruppen;
// sie folgen den Kurzbeschreibungen in sim/fraktionen.ts (AUSRICHTUNG) und tuerkei/ (Länderpaket), wo etwas belegt ist, sonst „zu prüfen“.
//
// Die Achsen laufen von −100 bis +100. Das Spiel wertet keine Richtung: Jede Lage hat Preis und Folgen (sim/linie.ts).
//   wirtschaft   −100 Umverteilung und Staatswirtschaft … +100 Markt und Privateigentum
//   gesellschaft −100 libertär und offen … +100 autoritär und ordnungsstaatlich
//   national     −100 supranational und international … +100 national und souverän
//   religion     −100 säkular und laizistisch … +100 religiös
//   zentral      −100 föderal und regional … +100 zentralistisch

export const ACHSEN_IDS = ["wirtschaft", "gesellschaft", "national", "religion", "zentral"] as const;
export type AchseId = (typeof ACHSEN_IDS)[number];
export type Achsen = Record<AchseId, number>;

export const NULL_ACHSEN: Achsen = { wirtschaft: 0, gesellschaft: 0, national: 0, religion: 0, zentral: 0 };

const A = (wirtschaft: number, gesellschaft: number, national: number, religion: number, zentral: number): Achsen => ({ wirtschaft, gesellschaft, national, religion, zentral });

// ---------------------------------------------------------------------------
// Parteien der Szene (sim/fraktionen.ts) und die vier klassischen Muster der eigenen Partei

/** Achsenwerte der acht Parteien im Parlament (Spielparameter; Ausrichtung nach AUSRICHTUNG in sim/fraktionen.ts). */
export const PARTEI_ACHSEN: Record<string, Achsen> = {
  AKP: A(35, 40, 50, 60, 50), // national-konservativ, bisherige Regierungspartei
  "YENİ": A(40, -20, -10, -10, -10), // liberal-zentristisch, wirtschaftsnah
  CHP: A(-40, -35, 0, -75, 5), // sozialdemokratisch, säkular
  MHP: A(10, 65, 85, 25, 70), // nationalistisch, sicherheitsorientiert
  "İYİ": A(30, 30, 70, -10, 40), // nationalistisch-liberal, grenzstreng
  DEM: A(-60, -45, -50, -30, -80), // linksgerichtet, für die kurdischen Regionen
  Zafer: A(20, 65, 95, -20, 60), // nationalistisch, migrationskritisch
  YRP: A(-10, 45, 40, 90, 30), // islamisch-konservativ, sozialpolitisch
};

export interface Voreinstellung {
  id: string;
  /** Kürzel der Partei im Parlament (darf nicht mit einer Partei der Szene kollidieren) */
  kurz: string;
  farbe: string;
  achsen: Achsen;
  /** Eines der vier klassischen Muster (AP, PG, PW, PR): Zufallsstart und ältere Spielstände verwenden nur diese */
  klassisch?: boolean;
}

/**
 * Voreinstellungen vom linken zum rechten Rand. Die Namen stehen im Katalog (`linie.preset.<id>.name`, `.text`).
 * Die vier klassischen Muster (Aufbruch der Mitte, Soziale Gerechtigkeit, Werte und Wohlstand, Die Regionen) stehen zuerst.
 */
export const VOREINSTELLUNGEN: Voreinstellung[] = [
  { id: "mitte", kurz: "AP", farbe: "#2f5d62", achsen: A(20, -20, -15, -35, -5), klassisch: true },
  { id: "gerechtigkeit", kurz: "PG", farbe: "#a8325e", achsen: A(-55, -25, 0, -20, -10), klassisch: true },
  { id: "werte", kurz: "PW", farbe: "#2e6b3f", achsen: A(20, 35, 30, 60, 25), klassisch: true },
  { id: "regionen", kurz: "PR", farbe: "#556b2f", achsen: A(-5, -10, -10, 0, -70), klassisch: true },
  { id: "sozialistisch", kurz: "SL", farbe: "#8e1b1b", achsen: A(-90, -35, -30, -60, 10) },
  { id: "gruen", kurz: "GRN", farbe: "#3f8f4f", achsen: A(-35, -65, -55, -55, -30) },
  { id: "liberal", kurz: "LIB", farbe: "#d6a21f", achsen: A(60, -60, -40, -50, -15) },
  { id: "libertaer", kurz: "LBT", farbe: "#5b6fb3", achsen: A(95, -70, -30, -40, -40) },
  { id: "konservativ", kurz: "KON", farbe: "#3a5a8c", achsen: A(35, 30, 30, 20, 30) },
  { id: "laizistisch", kurz: "LAI", farbe: "#7a4f9a", achsen: A(-20, 20, 20, -95, 50) },
  { id: "nationalistisch", kurz: "NAT", farbe: "#b4552d", achsen: A(10, 50, 85, 10, 60) },
  { id: "autoritaer", kurz: "AUT", farbe: "#4a4a4a", achsen: A(10, 90, 90, 20, 85) },
  { id: "islamistisch", kurz: "ISL", farbe: "#1f7a6a", achsen: A(-25, 60, 25, 95, 30) },
  { id: "kurdisch", kurz: "KFD", farbe: "#c23b3b", achsen: A(-40, -35, -50, -25, -90) },
  { id: "technokratisch", kurz: "TEK", farbe: "#6b7280", achsen: A(30, 55, 45, -40, 70) },
];

export const KLASSISCHE_VOREINSTELLUNGEN = VOREINSTELLUNGEN.filter((v) => v.klassisch);

/** Kürzel aller Voreinstellungen (für ältere Spielstände und Zuordnung der Achsen). */
export const VOREINSTELLUNG_NACH_KURZ: Record<string, Voreinstellung> = Object.fromEntries(VOREINSTELLUNGEN.map((v) => [v.kurz, v]));

// ---------------------------------------------------------------------------
// Wählergruppen (sim/gruppen.ts, GroupId in sim/prolog.ts)

/** Achsenprofil der Wählergruppen (Spielparameter): Wo die Gruppe im Mittel steht. */
export const GRUPPEN_ACHSEN: Record<string, Achsen> = {
  arbeitnehmer: A(-40, 5, 10, 10, 0),
  rentner: A(-35, 25, 25, 25, 10),
  junge: A(-10, -50, -35, -35, -15),
  konservative: A(15, 45, 40, 70, 25),
  staedtische_saekulare: A(10, -45, -30, -80, -5),
  landwirte: A(-5, 25, 35, 40, 10),
  beamte: A(-5, 30, 25, -10, 45),
  unternehmer: A(75, -5, -5, -10, -5),
  arme: A(-70, 10, 10, 25, 0),
  nationalisten: A(5, 65, 90, 20, 65),
  minderheiten: A(-25, -45, -55, -25, -60),
};

// ---------------------------------------------------------------------------
// Maßnahmen (data/politiknetz.ts): Richtung auf den Achsen, wenn die Maßnahme ERHÖHT wird

/**
 * Achsenvektor je Maßnahme für das Erhöhen (Werte −1 bis +1, fehlende Achsen 0). Wer die Maßnahme senkt, geht in die Gegenrichtung.
 * Spielparameter nach der Bedeutung der Maßnahme im Politiknetz (Text und Skala in data/politiknetz.ts, data/skalen.ts); wo die Skala
 * mehrdeutig ist (Richterrat, Offiziersauswahl), gilt: höher = unabhängiger bzw. nach Leistung.
 * Reihenfolge: wirtschaft, gesellschaft, national, religion, zentral.
 */
const V = (w: number, g = 0, n = 0, r = 0, z = 0): Achsen => A(w, g, n, r, z);

export const MASSNAHME_VEKTOR: Record<string, Achsen> = {
  // Wirtschaft
  m_mindestlohn: V(-0.6),
  m_exportfoerderung: V(0.2, 0, 0.2),
  m_investitionsanreize: V(0.6),
  m_kreditgarantien: V(0.2),
  m_preiskontrollen: V(-0.8, 0.1),
  m_kmu: V(0.3),
  m_zoelle: V(-0.2, 0, 0.7),
  m_bankenaufsicht: V(-0.5),
  m_industrie_modernisierung: V(0.2, 0, 0.2),
  // Haushalt
  m_einkommensteuer: V(-0.7),
  m_mwst: V(0.2),
  m_koerperschaftsteuer: V(-0.7),
  m_kraftstoffsteuer: V(0.1),
  m_immobiliensteuer: V(-0.6),
  m_steueramnestie: V(0.4),
  m_steuerfahndung: V(-0.4, 0.2),
  m_privatisierung: V(0.9),
  m_verwaltungsdigital: V(0, 0, 0, 0, 0.3),
  // Arbeit und Soziales
  m_renten: V(-0.5),
  m_fruehrente: V(-0.5),
  m_kindergeld: V(-0.4, 0, 0.1, 0.3),
  m_sozialhilfe: V(-0.7),
  m_arbeitslosengeld: V(-0.6),
  m_gewerkschaftsrechte: V(-0.7, -0.3),
  m_kinderbetreuung: V(-0.4, -0.2, 0, -0.2),
  // Gesundheit
  m_krankenhausbau: V(-0.4),
  m_aerztegehalt: V(-0.2),
  m_hausarzt: V(-0.2),
  m_zuzahlungen: V(0.6),
  m_medizintechnik: V(0.2),
  // Bildung und Wissenschaft
  m_lehrergehaelter: V(-0.3),
  m_schulbau: V(-0.2),
  m_religioese_schulen: V(0, 0.4, 0, 0.9),
  m_berufsschulen: V(0.1),
  m_unigruendungen: V(-0.1, 0, 0, 0, -0.2),
  m_stipendien: V(-0.4),
  m_forschung: V(0, 0, 0.2),
  m_wissenschaftsfreiheit: V(0, -0.9),
  // Infrastruktur
  m_autobahnen: V(0.1, 0, 0.3),
  m_oepp_garantien: V(0.5),
  m_bahn: V(-0.2),
  m_nahverkehr: V(-0.2),
  m_regionalfoerderung: V(-0.3, 0, 0, 0, -0.6),
  m_smart_infrastruktur: V(0, 0.3),
  // Energie
  m_energiesubventionen: V(-0.4),
  m_solar_wind: V(0, 0, -0.2),
  m_kernkraft: V(0, 0, 0.2),
  m_gasfoerderung: V(0, 0, 0.3),
  m_umweltauflagen: V(-0.4),
  m_co2_preis: V(-0.2, 0, -0.3),
  m_lng_vertraege: V(0, 0, -0.1),
  m_yeka_serie: V(0.3),
  m_sakarya_phase3: V(0, 0, 0.3),
  m_heimische_kohle: V(-0.1, 0, 0.3),
  m_energieeffizienz: V(0, 0, -0.2),
  m_preiswahrheit: V(0.6),
  m_gashub: V(0, 0, 0.2),
  // Landwirtschaft und Wasser
  m_agrarsubventionen: V(-0.4, 0, 0.2),
  m_staudaemme: V(0, 0, 0.3, 0, 0.3),
  m_saatgut: V(0, 0, 0.2),
  // Wohnen
  m_bauindustrie: V(0.2),
  m_sozialwohnungen: V(-0.6),
  m_mietdeckel: V(-0.7),
  m_stadterneuerung: V(-0.1),
  m_bauaufsicht: V(-0.2, 0.2),
  m_baukredite: V(-0.1),
  m_bauamnestie: V(0.3),
  m_versicherungspflicht: V(0.1, 0.2),
  // Sicherheit
  m_polizeitechnik: V(0, 0.5),
  m_polizei: V(0, 0.8),
  m_friedensprozess: V(0, -0.4, -0.6, 0, -0.5),
  // Gesellschaft und Medien
  m_digitale_oeffentlichkeit: V(0, -0.4),
  m_medienaufsicht: V(0, 0.8),
  m_internetsperren: V(0, 0.9),
  m_staatsmedien: V(0, 0.8, 0.3),
  m_religionsbehoerde: V(0, 0.3, 0, 0.8),
  m_gewaltschutz: V(0, -0.2, 0, -0.4),
  m_versammlungsfreiheit: V(0, -0.9),
  // Außen und Migration
  m_handelssysteme: V(0.2, 0, -0.3),
  m_rueckkehr: V(0, 0.3, 0.8),
  m_integration: V(0, -0.2, -0.6),
  m_grenzschutz: V(0, 0.4, 0.8),
  m_eu_annaeherung: V(0, 0, -0.9),
  // Recht
  m_justizreform: V(0, -0.6),
  m_antikorruption: V(-0.1, -0.2),
  m_richterstellen: V(0, -0.2),
  m_richterrat: V(0, -0.5),
  m_haftvermeidung: V(0, -0.5),
  m_notstand: V(0, 1),
  m_urteilsumsetzung: V(0, -0.6),
  // Militär
  m_verteidigung: V(0, 0.2, 0.5),
  m_ruestungsindustrie: V(0, 0, 0.7),
  m_wehrdienst: V(0, 0.6, 0.4),
  m_uebungen: V(0, 0, 0.2),
  m_offiziersauswahl: V(0, -0.2),
  // Kultur
  m_denkmalschutz: V(0, 0, 0.2),
  m_kulturfoerderung: V(0, -0.3),
  m_archaeologie: V(0, 0, 0.2),
  m_minderheitenrechte: V(0, -0.6, -0.5, -0.2, -0.4),
  // Achsenneutral (Technik, Versorgung, Fachpolitik ohne Lagerbezug): Vektor 0, damit jede der 117 Maßnahmen eine Zuordnung hat
  m_tourismuswerbung: V(0),
  m_ausbildung: V(0),
  m_breitband: V(0),
  m_netzausbau: V(0),
  m_regas_ausbau: V(0),
  m_gasspeicher: V(0),
  m_akkuyu_ppa: V(0),
  m_bewaesserung: V(0),
  m_wasserleitungen: V(0),
  m_mechanisierung: V(0),
  m_agrarforschung: V(0),
  m_fachkraefteprogramm: V(0),
  m_bildungstechnik: V(0),
  m_speicher_smartgrid: V(0),
  m_gebaeudeverstaerkung: V(0),
  m_fruehwarnsystem: V(0),
  m_afad_ausbau: V(0),
  m_instandhaltung: V(0),
};
