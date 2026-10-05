// Die Netze des Landes als Bestand mit Kapazität und Auslastung (sim/infrastruktur.ts).
//
// Belegt sind nur die Mengen aus OpenStreetMap je Provinz (data/provinz_infra.json: Straßen-, Schienenkilometer, Krankenhäuser,
// Flughäfen, Kraftwerke). Alles andere hier ist ein Spielparameter und als solcher gekennzeichnet: das Landesmittel der Auslastung
// beim Start, Wachstum der Nachfrage, induzierte Nachfrage, Preise der Ausbauten und die Stärke, mit der Überlast die Netzknoten bremst.
// Wo keine Kapazitätsmenge vorliegt (Strom, Wasser, Internet, Wohnungen), leitet sich die Startauslastung aus dem Startwert der
// zugehörigen Größe im Politiknetz ab (der Spielstand weiß, wie gut die Versorgung je Provinz ist), nicht aus erfundenen Zahlen.
// Texte stehen im Katalog (i18n/katalog/<sprache>/infrastruktur.json) unter infra.netz.<id>.* und infra.ausbau.<id>.*.

export type NetzId = "strasse" | "bahn" | "hafen" | "flughafen" | "strom" | "wasser" | "internet" | "wohnen" | "kliniken";

/** Wie sich die Startauslastung je Provinz ergibt */
export type StartArt =
  /** Nachfrage (Bevölkerung, gewichtet mit Wirtschaftskraft) gegen den Anteil an einer belegten Menge aus provinz_infra.json */
  | { art: "menge"; feld: "strasse_km" | "schiene_km" | "flughaefen" | "krankenhaeuser"; wirtschaft: number }
  /** Startwert einer Größe des Politiknetzes; `gut`: hoch heißt gute Versorgung, also niedrige Auslastung */
  | { art: "knoten"; knoten: string; gut: boolean }
  /** Ein Netz für das ganze Land (Korridor), ohne Werte je Provinz */
  | { art: "land" };

/** Ein Knoten des Politiknetzes, den Überlast bremst: Verschiebung je Monat bei voller Überlast (Spielparameter) */
export interface Bremse {
  knoten: string;
  d: number;
}

export interface NetzDef {
  id: NetzId;
  start: StartArt;
  /** Landesmittel der Auslastung beim Start (Anteil, Spielparameter) */
  mittel: number;
  /** Wachstum der Nachfrage je Jahr ohne Wirtschaftswachstum, in Prozent (Spielparameter: Bevölkerung, Verstädterung, Digitalisierung) */
  trend: number;
  /** Wie stark die Nachfrage dem Wirtschaftswachstum folgt (Elastizität, Spielparameter) */
  elast: number;
  /** Laufender Ausbau ohne eigenes Vorhaben (Erhaltungsbudget, Betreiber, Kommunen), Prozent der Kapazität je Jahr bei Etatstufe 0 (Spielparameter) */
  eigen: number;
  /** Größe des Politiknetzes, die die Nachfrage zusätzlich treibt (etwa der Tourismus die Flughäfen), mit Gewicht */
  treiber?: { knoten: string; gewicht: number };
  /** Induzierte Nachfrage: Anteil der neuen Kapazität, den neuer Verkehr binnen drei Jahren wieder füllt */
  induziert: number;
  /** Überlast bremst diese Knoten */
  bremsen: Bremse[];
  /** Größe, die beim Ausbau und in der Vorschau steht (Netzknoten) */
  hauptknoten: string;
  bild: "bahn" | "bruecke" | "turm" | "damm" | "flughafen" | "schiff" | "stadt" | "reaktor";
  /** Herkunft der Kapazitätsmenge */
  quelle: string;
}

/** Startauslastung höchstens / mindestens (Spielparameter) */
export const START_GRENZEN = { min: 0.3, max: 1.15 } as const;
/** Ab hier gilt ein Netz als ausgelastet; darüber bremst es (Spielparameter) */
export const SCHWELLE = { voll: 0.85, ueberlast: 1.0, leer: 0.5 } as const;
/** Auslastung kann nicht beliebig steigen: Wer im Stau steht, fährt irgendwann nicht mehr (Spielparameter) */
export const AUSLASTUNG_MAX = 1.4;

const OSM = "© OpenStreetMap-Mitwirkende (ODbL), Geofabrik-Auszug Türkei (data/provinz_infra.json)";
const NETZ = "Startwert der Größe im Politiknetz (Spielstand), auf das Landesmittel skaliert";

export const NETZE: NetzDef[] = [
  {
    id: "strasse",
    start: { art: "menge", feld: "strasse_km", wirtschaft: 0.6 },
    mittel: 0.72,
    trend: 0.8,
    elast: 0.9,
    eigen: 2.0,
    // Duranton und Turner (2011), American Economic Review 101(6): Der Verkehr wächst in US-Städten etwa im selben Maß wie die
    // Fahrspurkilometer (Elastizität nahe 1). Im Spiel gedämpft auf die Hälfte über drei Jahre (Spielparameter).
    induziert: 0.5,
    bremsen: [{ knoten: "stau", d: 0.7 }, { knoten: "logistik", d: -0.35 }, { knoten: "industrie", d: -0.15 }],
    hauptknoten: "verkehrsnetz",
    bild: "bruecke",
    quelle: OSM,
  },
  {
    id: "bahn",
    start: { art: "menge", feld: "schiene_km", wirtschaft: 0.4 },
    mittel: 0.68,
    trend: 1.2,
    elast: 0.7,
    eigen: 1.5,
    induziert: 0.3,
    bremsen: [{ knoten: "logistik", d: -0.3 }, { knoten: "export", d: -0.15 }, { knoten: "stau", d: 0.25 }],
    hauptknoten: "bahnnetz",
    bild: "bahn",
    quelle: OSM,
  },
  {
    id: "hafen",
    start: { art: "land" },
    mittel: 0.78,
    trend: 0.5,
    elast: 1.1,
    eigen: 2.0,
    treiber: { knoten: "export", gewicht: 0.6 },
    induziert: 0.2,
    bremsen: [{ knoten: "export", d: -0.35 }, { knoten: "logistik", d: -0.3 }],
    hauptknoten: "logistik",
    bild: "schiff",
    quelle: "Spielparameter (Korridor Seehäfen, keine Menge je Provinz im Datensatz)",
  },
  {
    id: "flughafen",
    start: { art: "menge", feld: "flughaefen", wirtschaft: 0.5 },
    mittel: 0.7,
    trend: 1.5,
    elast: 1.2,
    eigen: 2.5,
    treiber: { knoten: "tourismus", gewicht: 0.8 },
    induziert: 0.4,
    bremsen: [{ knoten: "tourismus", d: -0.45 }, { knoten: "export", d: -0.05 }],
    hauptknoten: "tourismus",
    bild: "flughafen",
    quelle: OSM,
  },
  {
    id: "strom",
    start: { art: "knoten", knoten: "stromversorgung", gut: true },
    mittel: 0.74,
    trend: 1.5,
    elast: 0.9,
    eigen: 2.5,
    treiber: { knoten: "industrie", gewicht: 0.5 },
    induziert: 0.1,
    bremsen: [{ knoten: "p_stromausfaelle", d: 0.6 }, { knoten: "industrie", d: -0.3 }, { knoten: "stromversorgung", d: -0.3 }],
    hauptknoten: "stromversorgung",
    bild: "turm",
    quelle: `${NETZ}; Kraftwerke je Provinz: ${OSM}`,
  },
  {
    id: "wasser",
    start: { art: "knoten", knoten: "wasserversorgung", gut: true },
    mittel: 0.7,
    trend: 1.0,
    elast: 0.3,
    eigen: 1.0,
    induziert: 0.1,
    bremsen: [{ knoten: "p_wassermangel", d: 0.6 }, { knoten: "wasserversorgung", d: -0.35 }],
    hauptknoten: "wasserversorgung",
    bild: "damm",
    quelle: NETZ,
  },
  {
    id: "internet",
    start: { art: "knoten", knoten: "internet", gut: true },
    mittel: 0.66,
    trend: 6.0,
    elast: 0.5,
    eigen: 5.0,
    induziert: 0.3,
    bremsen: [{ knoten: "internet", d: -0.4 }, { knoten: "gruendungen", d: -0.1 }],
    hauptknoten: "internet",
    bild: "turm",
    quelle: NETZ,
  },
  {
    id: "wohnen",
    start: { art: "knoten", knoten: "mieten", gut: false },
    mittel: 0.82,
    trend: 1.0,
    elast: 0.4,
    eigen: 1.2,
    induziert: 0.15,
    bremsen: [{ knoten: "mieten", d: 0.5 }, { knoten: "p_wohnungsnot", d: 0.4 }],
    hauptknoten: "mieten",
    bild: "stadt",
    quelle: NETZ,
  },
  {
    id: "kliniken",
    start: { art: "menge", feld: "krankenhaeuser", wirtschaft: 0.2 },
    mittel: 0.74,
    trend: 1.2,
    elast: 0.3,
    eigen: 1.0,
    induziert: 0.1,
    bremsen: [{ knoten: "wartezeiten", d: 0.6 }, { knoten: "gesundheitsversorgung", d: -0.3 }],
    hauptknoten: "wartezeiten",
    bild: "stadt",
    quelle: OSM,
  },
];

export const NETZ_NACH_ID = Object.fromEntries(NETZE.map((n) => [n.id, n])) as Record<NetzId, NetzDef>;

/**
 * Ein Ausbau: Kapazität dazu (Anteil der heutigen Kapazität in der Provinz), Preis und Dauer für eine Provinz mittlerer Größe.
 * Der Preis wächst mit der Größe der Provinz (Wurzel des Bevölkerungsverhältnisses, begrenzt). Alles Spielparameter, in der Größenordnung
 * der kleinen Ausbauten des Reiches (data/reich/infrastruktur.ts, etwa Bahn Kars–Tiflis: 3 Kapital, 260 Baupunkte, 12 Monate).
 */
export interface AusbauDef {
  id: string;
  netz: NetzId;
  plus: number;
  pk: number;
  bau: number;
  monate: number;
  schulden: number;
  verwaltung: number;
  /** Verwaltungskraft je Monat im Bestand */
  unterhalt: number;
  /** Nur wo es die Menge schon gibt (etwa Schnellbahn nur mit Schienen) */
  braucht?: "schiene_km" | "flughaefen";
  verlierer?: string;
}

export const AUSBAUTEN: AusbauDef[] = [
  { id: "autobahn", netz: "strasse", plus: 0.25, pk: 3, bau: 380, monate: 24, schulden: 0.1, verwaltung: 0.6, unterhalt: 0.1, verlierer: "landwirte" },
  { id: "bahn", netz: "bahn", plus: 0.3, pk: 3, bau: 360, monate: 26, schulden: 0.1, verwaltung: 0.6, unterhalt: 0.1, braucht: "schiene_km" },
  { id: "schnellbahn", netz: "bahn", plus: 0.65, pk: 6, bau: 1100, monate: 48, schulden: 0.3, verwaltung: 1.2, unterhalt: 0.25, braucht: "schiene_km", verlierer: "landwirte" },
  { id: "hafen", netz: "hafen", plus: 0.15, pk: 3, bau: 420, monate: 30, schulden: 0.12, verwaltung: 0.8, unterhalt: 0.12 },
  { id: "flughafen", netz: "flughafen", plus: 0.35, pk: 3, bau: 340, monate: 30, schulden: 0.1, verwaltung: 0.6, unterhalt: 0.1, braucht: "flughaefen", verlierer: "landwirte" },
  { id: "kraftwerk", netz: "strom", plus: 0.25, pk: 3, bau: 400, monate: 30, schulden: 0.12, verwaltung: 0.7, unterhalt: 0.12, verlierer: "landwirte" },
  { id: "wasser", netz: "wasser", plus: 0.25, pk: 2, bau: 300, monate: 24, schulden: 0.08, verwaltung: 0.5, unterhalt: 0.08, verlierer: "landwirte" },
  { id: "glasfaser", netz: "internet", plus: 0.4, pk: 2, bau: 200, monate: 18, schulden: 0.05, verwaltung: 0.4, unterhalt: 0.05 },
  { id: "wohnungen", netz: "wohnen", plus: 0.1, pk: 3, bau: 420, monate: 30, schulden: 0.12, verwaltung: 0.7, unterhalt: 0.08 },
  { id: "klinik", netz: "kliniken", plus: 0.2, pk: 3, bau: 320, monate: 30, schulden: 0.1, verwaltung: 0.6, unterhalt: 0.12 },
];

export const AUSBAU_NACH_ID = Object.fromEntries(AUSBAUTEN.map((a) => [a.id, a])) as Record<string, AusbauDef>;

/**
 * Großinvestitionsprogramme: ein Ausbau in den am stärksten belasteten Provinzen auf einmal. Günstiger je Provinz (Rabatt),
 * dafür ein höheres Risiko der Kostenüberschreitung (über die Mechanik des Reiches: `ueberzug`). Spielparameter.
 */
export interface PaketDef {
  id: string;
  ausbau: string;
  provinzen: number;
  rabatt: number;
  ueberzug: { p: number; band: [number, number]; an: number[] };
}

export const PAKETE: PaketDef[] = [
  { id: "bahnoffensive", ausbau: "bahn", provinzen: 6, rabatt: 0.15, ueberzug: { p: 0.45, band: [0.15, 0.4], an: [0.35, 0.7] } },
  { id: "wohnungsoffensive", ausbau: "wohnungen", provinzen: 6, rabatt: 0.15, ueberzug: { p: 0.4, band: [0.1, 0.35], an: [0.35, 0.7] } },
  { id: "klinikoffensive", ausbau: "klinik", provinzen: 5, rabatt: 0.12, ueberzug: { p: 0.35, band: [0.1, 0.3], an: [0.4] } },
];

/**
 * Die günstigere Alternative zum Ausbau, die ein Minister vorlegt: wirkt sofort, aber kleiner und mit eigenem Preis.
 * `kap`: Kapazität mal, `nachfrage`: Nachfrage mal, `wirk`: einmalige Stöße auf Netzknoten in der Provinz. Spielparameter.
 */
export interface AlternativeDef {
  netz: NetzId;
  pk: number;
  kap?: number;
  nachfrage?: number;
  wirk: { knoten: string; d: number }[];
}

export const ALTERNATIVEN: Record<NetzId, AlternativeDef> = {
  strasse: { netz: "strasse", pk: 1.5, nachfrage: 0.93, wirk: [{ knoten: "arbeitnehmer", d: -1 }] },
  bahn: { netz: "bahn", pk: 1, kap: 1.08, wirk: [{ knoten: "wartungszustand", d: -0.8 }] },
  hafen: { netz: "hafen", pk: 1, kap: 1.06, wirk: [{ knoten: "korruption", d: -0.3 }] },
  flughafen: { netz: "flughafen", pk: 1, nachfrage: 0.92, wirk: [{ knoten: "tourismus", d: -0.4 }] },
  strom: { netz: "strom", pk: 1.5, nachfrage: 0.94, wirk: [{ knoten: "industrie", d: -0.4 }] },
  wasser: { netz: "wasser", pk: 1, kap: 1.08, wirk: [{ knoten: "bauwirtschaft", d: 0.3 }] },
  internet: { netz: "internet", pk: 1, kap: 1.12, wirk: [{ knoten: "unternehmer", d: 0.5 }] },
  wohnen: { netz: "wohnen", pk: 2, nachfrage: 0.96, wirk: [{ knoten: "wohnungsbau", d: -1.2 }, { knoten: "mieten", d: -1 }] },
  kliniken: { netz: "kliniken", pk: 1.5, kap: 1.08, wirk: [{ knoten: "ungleichheit", d: 0.4 }] },
};
