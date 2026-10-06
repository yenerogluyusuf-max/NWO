// Kriegsschauplätze mit Regionen, die im Krieg den Besitzer wechseln können, und der Bestand der Gegner.
//
// Grundsatz „Realismus verpackt in ein Spiel“: Ein Schauplatz besteht aus wenigen Regionen um echte Orte mit ihrem Gelände. Die Front
// rückt Region um Region vor oder zurück; Gelände und Einsatzart entscheiden, wie schwer das ist. Die Regionen sind keine Verwaltungsgrenzen
// (die Weltkarte kennt für Nachbarländer nur die Staatsfläche), sondern Räume um einen Ort; auf der Karte erscheinen sie als Fläche um den Ort.
//
// Quellen:
//   - Koordinaten der Orte: public/data/karte/orte.json (Natural Earth, gemeinfrei), gerundet; Kapan liegt in Armenien (Provinz Sjunik),
//     orte.json führt ihn unter AZE — hier richtig zugeordnet.
//   - Gelände, Akteure und Infrastruktur: RECHERCHE_GLM_10_KRIEGSSCHAUPAETZE.md, data/entwurf_glm/schauplaetze.ts (Stichtag Sept. 2026),
//     Lage korrigiert nach KORREKTUR_GLM_WELTBEFUNDE_2026-10-06.md (Syrien: Integrationsabkommen mit den SDF vom 30.01.2026;
//     Sjunik/TRIPP: US-Entwicklungsrechte über ein Gemeinschaftsunternehmen, 49 + 50 Jahre, Friedensvertrag nur paraphiert).
//   - Gegnerbestand: RECHERCHE_GLM_4_STREITKRAEFTE_RUESTUNG.md Abschnitt 3 (SIPRI-Ausgaben, Aktive, Kernplattformen). Stückzahlen der
//     Nachbarn sind dort nicht erhoben (IISS nicht offen). Der Bestand wird deshalb wie bei den eigenen Index-Gattungen als Index
//     (100 = Stand 2026) geführt; Generationen und Gewichte sind Spielparameter, ihre Richtung ist belegt, wo „quelle“ steht.
// Bevölkerungszahlen fehlen bewusst (Lückenliste in RECHERCHE_KRIEGSSCHAUPAETZE_2026-10-05.md Abschnitt 6).

export type Gelaende = "ebene" | "berge" | "stadt" | "insel" | "kueste";

export interface Region {
  id: string;
  /** Schauplatz-Kennung */
  schauplatz: string;
  /** Ort, um den die Region liegt (Längengrad, Breitengrad) */
  lon: number;
  lat: number;
  gelaende: Gelaende;
  /** 1 = an der Grenze, 3 = tief im Land; die Front rückt in dieser Reihenfolge vor */
  tiefe: 1 | 2 | 3;
  /** Bedeutung für Kriegsziel und Friedenspreis (1 bis 3, Spielparameter) */
  wert: 1 | 2 | 3;
  /** Was die Region trägt (Text im Katalog `krieg.ressource.*`) */
  ressource?: "oel" | "wasser" | "staudamm" | "hafen" | "korridor" | "stuetzpunkt";
  /** Wer zusätzlich reagiert, wenn die Türkei die Region nimmt (Länderkennung, Konfliktpunkte) */
  reizt?: { land: string; konflikt: number };
}

export interface Schauplatz {
  id: string;
  /** Gegner, gegen den dieser Schauplatz gilt */
  land: string;
  /** Mittelpunkt der Karte für die Kamera */
  lon: number;
  lat: number;
  /** Ob eine Seeblockade wirkt (Küste des Gegners erreichbar) */
  kueste: boolean;
  /** Ob verbündete Kräfte vor Ort als Stellvertreter kämpfen können (Spielannahme, im Text begründet) */
  stellvertreter: boolean;
  /** Türkische Grenzprovinzen (Plaka), auf die ein gegnerischer Vorstoß zielt */
  grenzprovinzen: number[];
}

export const SCHAUPLAETZE: Schauplatz[] = [
  { id: "nordsyrien", land: "SYR", lon: 38.6, lat: 36.3, kueste: true, stellvertreter: true, grenzprovinzen: [31, 79, 27, 63, 47] },
  { id: "nordirak", land: "IRQ", lon: 43.6, lat: 36.4, kueste: false, stellvertreter: true, grenzprovinzen: [73, 30] },
  { id: "aegaeis", land: "GRC", lon: 25.8, lat: 39.4, kueste: true, stellvertreter: false, grenzprovinzen: [22, 39, 17, 35, 48] },
  { id: "zypern", land: "CYP", lon: 33.3, lat: 35.0, kueste: true, stellvertreter: false, grenzprovinzen: [33, 1] },
  { id: "suedkaukasus", land: "ARM", lon: 45.0, lat: 40.0, kueste: false, stellvertreter: false, grenzprovinzen: [36, 76] },
  { id: "nordwestiran", land: "IRN", lon: 46.3, lat: 37.6, kueste: false, stellvertreter: false, grenzprovinzen: [65, 4, 30, 76] },
];

export const SCHAUPLATZ_NACH_LAND: Record<string, Schauplatz> = Object.fromEntries(SCHAUPLAETZE.map((s) => [s.land, s]));

export const REGIONEN: Region[] = [
  // Nordsyrien
  { id: "syr_asas", schauplatz: "nordsyrien", lon: 37.04, lat: 36.59, gelaende: "ebene", tiefe: 1, wert: 1 },
  { id: "syr_manbidsch", schauplatz: "nordsyrien", lon: 37.96, lat: 36.53, gelaende: "ebene", tiefe: 1, wert: 1 },
  { id: "syr_qamischli", schauplatz: "nordsyrien", lon: 41.23, lat: 37.03, gelaende: "ebene", tiefe: 1, wert: 2 },
  { id: "syr_idlib", schauplatz: "nordsyrien", lon: 36.63, lat: 35.93, gelaende: "berge", tiefe: 2, wert: 2 },
  { id: "syr_tabqa", schauplatz: "nordsyrien", lon: 38.55, lat: 35.84, gelaende: "ebene", tiefe: 2, wert: 2, ressource: "staudamm" },
  { id: "syr_rakka", schauplatz: "nordsyrien", lon: 39.02, lat: 35.93, gelaende: "stadt", tiefe: 2, wert: 2 },
  { id: "syr_hasaka", schauplatz: "nordsyrien", lon: 40.75, lat: 36.48, gelaende: "ebene", tiefe: 2, wert: 2, ressource: "oel" },
  { id: "syr_aleppo", schauplatz: "nordsyrien", lon: 37.17, lat: 36.23, gelaende: "stadt", tiefe: 3, wert: 3 },
  { id: "syr_deir", schauplatz: "nordsyrien", lon: 40.13, lat: 35.33, gelaende: "ebene", tiefe: 3, wert: 2, ressource: "oel" },
  // Nordirak
  { id: "irq_zaxo", schauplatz: "nordirak", lon: 42.69, lat: 37.15, gelaende: "berge", tiefe: 1, wert: 1 },
  { id: "irq_dohuk", schauplatz: "nordirak", lon: 43.0, lat: 36.87, gelaende: "berge", tiefe: 1, wert: 1 },
  { id: "irq_tallafar", schauplatz: "nordirak", lon: 42.45, lat: 36.38, gelaende: "ebene", tiefe: 2, wert: 1 },
  { id: "irq_mossul", schauplatz: "nordirak", lon: 43.14, lat: 36.35, gelaende: "stadt", tiefe: 2, wert: 3 },
  { id: "irq_erbil", schauplatz: "nordirak", lon: 44.01, lat: 36.18, gelaende: "stadt", tiefe: 2, wert: 2 },
  { id: "irq_kirkuk", schauplatz: "nordirak", lon: 44.39, lat: 35.47, gelaende: "ebene", tiefe: 3, wert: 3, ressource: "oel" },
  { id: "irq_sulaimaniya", schauplatz: "nordirak", lon: 45.43, lat: 35.56, gelaende: "berge", tiefe: 3, wert: 2, reizt: { land: "IRN", konflikt: 4 } },
  // Ägäis und Thrakien
  { id: "grc_mytilini", schauplatz: "aegaeis", lon: 26.56, lat: 39.11, gelaende: "insel", tiefe: 1, wert: 2 },
  { id: "grc_chios", schauplatz: "aegaeis", lon: 26.14, lat: 38.37, gelaende: "insel", tiefe: 1, wert: 2 },
  { id: "grc_kos", schauplatz: "aegaeis", lon: 27.29, lat: 36.89, gelaende: "insel", tiefe: 1, wert: 2 },
  { id: "grc_rhodos", schauplatz: "aegaeis", lon: 28.22, lat: 36.44, gelaende: "insel", tiefe: 2, wert: 2, ressource: "hafen" },
  { id: "grc_alexandroupoli", schauplatz: "aegaeis", lon: 25.87, lat: 40.85, gelaende: "kueste", tiefe: 1, wert: 2, ressource: "hafen" },
  { id: "grc_komotini", schauplatz: "aegaeis", lon: 25.42, lat: 41.13, gelaende: "ebene", tiefe: 2, wert: 2 },
  { id: "grc_xanthi", schauplatz: "aegaeis", lon: 24.88, lat: 41.14, gelaende: "ebene", tiefe: 2, wert: 2 },
  { id: "grc_kavala", schauplatz: "aegaeis", lon: 24.4, lat: 40.94, gelaende: "kueste", tiefe: 3, wert: 2, ressource: "hafen" },
  { id: "grc_thessaloniki", schauplatz: "aegaeis", lon: 22.88, lat: 40.7, gelaende: "stadt", tiefe: 3, wert: 3 },
  // Zypern (Republik Zypern; der Norden steht unter türkischer Kontrolle)
  { id: "cyp_nikosia", schauplatz: "zypern", lon: 33.37, lat: 35.17, gelaende: "stadt", tiefe: 1, wert: 3 },
  { id: "cyp_larnaka", schauplatz: "zypern", lon: 33.64, lat: 34.92, gelaende: "kueste", tiefe: 2, wert: 2, ressource: "hafen" },
  { id: "cyp_limassol", schauplatz: "zypern", lon: 33.03, lat: 34.68, gelaende: "kueste", tiefe: 2, wert: 2, ressource: "hafen", reizt: { land: "EU", konflikt: 3 } },
  { id: "cyp_paphos", schauplatz: "zypern", lon: 32.42, lat: 34.76, gelaende: "kueste", tiefe: 3, wert: 1 },
  // Südkaukasus (Armenien)
  { id: "arm_gjumri", schauplatz: "suedkaukasus", lon: 43.85, lat: 40.79, gelaende: "ebene", tiefe: 1, wert: 2, ressource: "stuetzpunkt", reizt: { land: "RUS", konflikt: 10 } },
  { id: "arm_kapan", schauplatz: "suedkaukasus", lon: 46.41, lat: 39.2, gelaende: "berge", tiefe: 1, wert: 3, ressource: "korridor", reizt: { land: "USA", konflikt: 8 } },
  { id: "arm_jeghegnadsor", schauplatz: "suedkaukasus", lon: 45.33, lat: 39.76, gelaende: "berge", tiefe: 2, wert: 1 },
  { id: "arm_artaschat", schauplatz: "suedkaukasus", lon: 44.55, lat: 39.95, gelaende: "ebene", tiefe: 2, wert: 2 },
  { id: "arm_eriwan", schauplatz: "suedkaukasus", lon: 44.51, lat: 40.18, gelaende: "stadt", tiefe: 3, wert: 3 },
  // Nordwestiran
  { id: "irn_choi", schauplatz: "nordwestiran", lon: 44.97, lat: 38.53, gelaende: "berge", tiefe: 1, wert: 1 },
  { id: "irn_urmia", schauplatz: "nordwestiran", lon: 45.0, lat: 37.53, gelaende: "ebene", tiefe: 1, wert: 2 },
  { id: "irn_mahabad", schauplatz: "nordwestiran", lon: 45.72, lat: 36.77, gelaende: "berge", tiefe: 2, wert: 1 },
  { id: "irn_taebris", schauplatz: "nordwestiran", lon: 46.3, lat: 38.09, gelaende: "stadt", tiefe: 2, wert: 3 },
  { id: "irn_ardabil", schauplatz: "nordwestiran", lon: 48.3, lat: 38.25, gelaende: "berge", tiefe: 3, wert: 2 },
  { id: "irn_sandschan", schauplatz: "nordwestiran", lon: 48.5, lat: 36.67, gelaende: "ebene", tiefe: 3, wert: 2 },
];

export const REGION_NACH_ID: Record<string, Region> = Object.fromEntries(REGIONEN.map((r) => [r.id, r]));

/** Welche Regionen ein Zielraum (data/streitkraefte.ts ZIELRAEUME) umfasst; ohne Zielraum gilt die Grenzreihe (Tiefe 1). */
export const ZIELRAUM_REGIONEN: Record<string, string[]> = {
  syr_grenzstreifen: ["syr_asas", "syr_manbidsch", "syr_qamischli"],
  syr_tief: ["syr_asas", "syr_manbidsch", "syr_qamischli", "syr_idlib", "syr_tabqa", "syr_rakka", "syr_hasaka"],
  syr_maximal: ["syr_asas", "syr_manbidsch", "syr_qamischli", "syr_idlib", "syr_tabqa", "syr_rakka", "syr_hasaka", "syr_aleppo", "syr_deir"],
  irq_berge: ["irq_zaxo", "irq_dohuk"],
  irq_tief: ["irq_zaxo", "irq_dohuk", "irq_tallafar", "irq_mossul", "irq_erbil"],
  irq_maximal: ["irq_zaxo", "irq_dohuk", "irq_tallafar", "irq_mossul", "irq_erbil", "irq_kirkuk", "irq_sulaimaniya"],
  grc_inseln: ["grc_mytilini", "grc_chios", "grc_kos", "grc_rhodos"],
  grc_thrakien: ["grc_alexandroupoli", "grc_komotini", "grc_xanthi", "grc_kavala"],
  grc_maximal: ["grc_mytilini", "grc_chios", "grc_kos", "grc_rhodos", "grc_alexandroupoli", "grc_komotini", "grc_xanthi", "grc_kavala", "grc_thessaloniki"],
  cyp_schutz: ["cyp_nikosia"],
  cyp_maximal: ["cyp_nikosia", "cyp_larnaka", "cyp_limassol", "cyp_paphos"],
  arm_korridor: ["arm_kapan", "arm_jeghegnadsor"],
  arm_maximal: ["arm_gjumri", "arm_kapan", "arm_jeghegnadsor", "arm_artaschat", "arm_eriwan"],
  irn_grenze: ["irn_choi", "irn_urmia"],
  irn_tief: ["irn_choi", "irn_urmia", "irn_mahabad", "irn_taebris", "irn_ardabil", "irn_sandschan"],
};

// ---------------------------------------------------------------------------
// Einsatzarten (Spielparameter): wie gut eine Art in welchem Gelände vorankommt, welche eigenen Gattungen sie trägt und was sie kostet

export type EinsatzArt = "luft" | "boden" | "see" | "stellvertreter";

export const EINSATZ: Record<EinsatzArt, {
  /** Fortschritt je Gelände (1 = normal) */
  gelaende: Record<Gelaende, number>;
  /** Eigene Gattungen und ihr Gewicht (data/streitkraefte.ts) */
  traeger: Partial<Record<"personal" | "panzer" | "kampfflugzeuge" | "drohnen" | "marine" | "luftabwehr" | "raketen" | "munition", number>>;
  /** Wogegen sie kämpft (Gegnergattungen und Gewicht) */
  gegen: Partial<Record<GegnerGattung, number>>;
  /** Eigene Verluste und Erschöpfung der Heimatfront (1 = normal) */
  verlust: number;
  uhr: number;
  /** Wie weit diese Art höchstens trägt (Tiefe) */
  reichweite: 1 | 2 | 3;
  /** Zusätzlicher Abfluss der gegnerischen Uhr je Woche (Blockade, Luftschläge auf Infrastruktur) */
  druck: number;
  /** Ansehen-Kosten bei Beginn (Bodenoffensive sichtbarer, Stellvertreter verdeckt) */
  ansehen: number;
}> = {
  luft: {
    gelaende: { ebene: 1.0, berge: 0.75, stadt: 0.6, insel: 0.85, kueste: 0.9 },
    traeger: { drohnen: 0.45, kampfflugzeuge: 0.35, raketen: 0.1, munition: 0.1 },
    gegen: { luftabwehr: 0.4, luft: 0.25, heer: 0.35 },
    verlust: 0.45, uhr: 0.8, reichweite: 1, druck: 0.35, ansehen: -1,
  },
  boden: {
    gelaende: { ebene: 1.25, berge: 0.7, stadt: 0.75, insel: 0.25, kueste: 1.0 },
    traeger: { panzer: 0.35, personal: 0.3, munition: 0.2, drohnen: 0.15 },
    gegen: { heer: 0.7, drohnen: 0.3 },
    verlust: 1.3, uhr: 1.2, reichweite: 3, druck: 0, ansehen: -2,
  },
  see: {
    gelaende: { ebene: 0.35, berge: 0.15, stadt: 0.3, insel: 1.3, kueste: 1.05 },
    traeger: { marine: 0.6, raketen: 0.25, kampfflugzeuge: 0.15 },
    gegen: { see: 0.65, drohnen: 0.35 },
    verlust: 0.7, uhr: 0.9, reichweite: 2, druck: 0.8, ansehen: -1.5,
  },
  stellvertreter: {
    gelaende: { ebene: 0.8, berge: 0.8, stadt: 0.55, insel: 0.1, kueste: 0.5 },
    traeger: { drohnen: 0.4, munition: 0.3, personal: 0.3 },
    gegen: { heer: 0.8, drohnen: 0.2 },
    verlust: 0.25, uhr: 0.55, reichweite: 1, druck: 0.1, ansehen: -0.5,
  },
};

export type KriegsTempo = "vorsichtig" | "normal" | "hart";

/** Tempo: Fortschritt, Verluste, Erschöpfung, zusätzliche Munition je Monat (Spielparameter). */
export const TEMPO: Record<KriegsTempo, { front: number; verlust: number; uhr: number; munition: number }> = {
  vorsichtig: { front: 0.7, verlust: 0.6, uhr: 0.8, munition: 0 },
  normal: { front: 1, verlust: 1, uhr: 1, munition: 0 },
  hart: { front: 1.3, verlust: 1.6, uhr: 1.25, munition: 4 },
};

// ---------------------------------------------------------------------------
// Bestand der Gegner (Index 100 = Stand 2026)

export type GegnerGattung = "heer" | "luft" | "luftabwehr" | "see" | "drohnen";

export interface GegnerBestandDef {
  /** Gewicht und Generation (1 bis 5, Skala wie data/streitkraefte.ts) je Gattung */
  gattungen: Record<GegnerGattung, { gewicht: number; generation: number }>;
  /** Wie schnell Verluste ersetzt werden, Anteil der Lücke je Monat (Spielparameter; höhere Ausgaben, schnellerer Ersatz) */
  ersatz: number;
  /** Bereits belegter Zulauf: Generation einer Gattung steigt ab dem Jahr */
  zulauf?: { gattung: GegnerGattung; ab: number; generation: number; quelle: string }[];
  quelle: string;
}

export const GEGNER_BESTAND: Record<string, GegnerBestandDef> = {
  GRC: {
    gattungen: { heer: { gewicht: 0.3, generation: 3 }, luft: { gewicht: 0.35, generation: 3 }, luftabwehr: { gewicht: 0.15, generation: 3 }, see: { gewicht: 0.15, generation: 3 }, drohnen: { gewicht: 0.05, generation: 2 } },
    ersatz: 0.05,
    zulauf: [{ gattung: "luft", ab: 2029, generation: 4, quelle: "F-35A: bis zu 40 genehmigt, erster Vertrag über 20 (DW, 25.07.2024; RECHERCHE_GLM_4 Abschnitt 3)" }],
    quelle: "SIPRI etwa 14 Mrd. $ (2024), etwa 140.000 Aktive (RECHERCHE_GLM_4)",
  },
  IRN: {
    gattungen: { heer: { gewicht: 0.3, generation: 2 }, luft: { gewicht: 0.1, generation: 1 }, luftabwehr: { gewicht: 0.2, generation: 3 }, see: { gewicht: 0.1, generation: 2 }, drohnen: { gewicht: 0.3, generation: 3 } },
    ersatz: 0.04,
    quelle: "etwa 600.000 Aktive, Drohnenexporteur und Raketen (RECHERCHE_GLM_4); Ausgaben: Lücke",
  },
  SYR: {
    gattungen: { heer: { gewicht: 0.55, generation: 2 }, luft: { gewicht: 0.1, generation: 1 }, luftabwehr: { gewicht: 0.1, generation: 1 }, see: { gewicht: 0.05, generation: 1 }, drohnen: { gewicht: 0.2, generation: 2 } },
    ersatz: 0.02,
    quelle: "Staat im Umbau, Bestände unklar (RECHERCHE_GLM_4, Lücke); Generationen als Spielparameter",
  },
  IRQ: {
    gattungen: { heer: { gewicht: 0.5, generation: 2 }, luft: { gewicht: 0.15, generation: 2 }, luftabwehr: { gewicht: 0.1, generation: 1 }, see: { gewicht: 0.05, generation: 1 }, drohnen: { gewicht: 0.2, generation: 2 } },
    ersatz: 0.03,
    quelle: "Bestände nicht erhoben (RECHERCHE_GLM_4); Spielparameter",
  },
  ARM: {
    gattungen: { heer: { gewicht: 0.55, generation: 2 }, luft: { gewicht: 0.1, generation: 1 }, luftabwehr: { gewicht: 0.2, generation: 2 }, see: { gewicht: 0, generation: 1 }, drohnen: { gewicht: 0.15, generation: 2 } },
    ersatz: 0.03,
    quelle: "etwa 45.000 Aktive, Ausgaben etwa 1,5 Mrd. $ (2024, zu prüfen; RECHERCHE_GLM_4)",
  },
  CYP: {
    gattungen: { heer: { gewicht: 0.5, generation: 2 }, luft: { gewicht: 0.05, generation: 1 }, luftabwehr: { gewicht: 0.25, generation: 2 }, see: { gewicht: 0.1, generation: 2 }, drohnen: { gewicht: 0.1, generation: 1 } },
    ersatz: 0.03,
    quelle: "klein, Bestände nicht erhoben (RECHERCHE_GLM_4, Lücke)",
  },
};

/** Für Gegner ohne eigene Zeile: gleich gewichtet, Generation 3 (Spielparameter). */
export const GEGNER_BESTAND_STANDARD: GegnerBestandDef = {
  gattungen: { heer: { gewicht: 0.3, generation: 3 }, luft: { gewicht: 0.25, generation: 3 }, luftabwehr: { gewicht: 0.15, generation: 3 }, see: { gewicht: 0.15, generation: 3 }, drohnen: { gewicht: 0.15, generation: 3 } },
  ersatz: 0.04,
  quelle: "Spielparameter",
};

// ---------------------------------------------------------------------------
// Besatzung (Spielparameter)

export type BesatzungsForm = "pufferzone" | "verwaltung" | "annexion";

export const BESATZUNG = {
  /** Kosten je Region und Monat in % des BIP */
  kosten: { pufferzone: 0.012, verwaltung: 0.025, annexion: 0.03 } as Record<BesatzungsForm, number>,
  /** Ziel des Widerstands je Form (0 bis 100); Gelände „berge“ und „stadt“ erhöhen ihn */
  widerstandZiel: { pufferzone: 35, verwaltung: 22, annexion: 60 } as Record<BesatzungsForm, number>,
  gelaendeWiderstand: { ebene: 0, berge: 12, stadt: 10, insel: -5, kueste: 0 } as Record<Gelaende, number>,
  /** Ab diesem Widerstand drohen Anschläge; ab `aufstand` über drei Monate fällt die Region zurück */
  anschlagAb: 50,
  aufstand: 85,
  /** Kapital für einen Formwechsel, Annexion teurer */
  pkWechsel: 6,
  pkAnnexion: 14,
};
