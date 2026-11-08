// Kriegsschauplätze mit Regionen, die im Krieg den Besitzer wechseln können, und der Bestand der Gegner.
//
// Grundsatz „Realismus verpackt in ein Spiel“: Ein Schauplatz besteht aus wenigen Regionen um echte Orte mit ihrem Gelände. Die Front
// rückt Fläche um Fläche vor oder zurück; Gelände und Einsatzart entscheiden, wie schwer das ist. Seit Welle 3 (K2, krieg.md Schritt 4) ist
// jede Region genau eine echte Verwaltungseinheit mit belegter Fläche, Einwohnerzahl samt Stichtag und ihren Ressourcen; ihre Umrisse stehen
// vereinfacht in data/schauplatz-flaechen.json (Erzeugung, Quellen und Lizenzen: tools/geodaten/schauplatz_flaechen.py).
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
//   - Verwaltungseinheit, Fläche, Einwohner und Ressourcen je Region: siehe QUELLE unten und die Felder der Regionen. Fläche: aus der
//     unvereinfachten Grenze der Quelle nachgerechnet (flächentreu, Abweichung zum Flächenfeld der OCHA unter 0,2 %), gerundet.

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
  /** Die Verwaltungseinheit, die die Region bildet (Welle 3, K2) */
  einheit: Verwaltung;
  /** Fläche in km², aus der Grenze der Quelle (QUELLE.flaeche) */
  flaecheKm2: number;
  /** Einwohner mit Stichtag und Quelle; `null` heißt belegte Lücke (nicht geschätzt) */
  einwohner: Einwohner | null;
  /** Belegte Ressourcen und Anlagen in der Einheit (Text im Katalog `welle_k2.res.<id>`); leer heißt: keine belegte Ressource */
  ressourcen: RessourceBeleg[];
}

export type VerwaltungsArt = "distrikt" | "regionaleinheit" | "bezirk" | "provinz" | "hauptstadt" | "schahrestan";

export interface Verwaltung {
  /** Art der Einheit (Katalog `welle_k2.einheit.<art>`) */
  art: VerwaltungsArt;
  /** Name in lateinischer Umschrift, wie ihn die Quelle der Grenze führt */
  name: string;
  /** P-Code der OCHA (Syrien, Irak, Iran, Armenien) */
  pcode?: string;
}

export interface Einwohner {
  zahl: number;
  /** Stichjahr der Zählung oder Erhebung */
  jahr: number;
  quelle: string;
}

export type RessourcenArt = "oel" | "gas" | "staudamm" | "wasser" | "hafen" | "flughafen" | "stuetzpunkt" | "korridor" | "grenze" | "bergbau" | "industrie" | "energie";

export interface RessourceBeleg {
  /** Schlüssel des Namens im Katalog `welle_k2.res.<id>` */
  id: string;
  art: RessourcenArt;
  quelle: string;
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

/** Quellen der Regionendaten (Abruf 08.11.2026). Grenzen und Lizenzen: tools/geodaten/schauplatz_flaechen.py. */
export const QUELLE = {
  flaeche: "Aus der unvereinfachten Grenze nachgerechnet (flächentreue Lambert-Projektion, authalischer Erdradius): Syrien, Irak, Iran, Armenien OCHA COD-AB (CC BY 3.0 IGO); Griechenland geoBoundaries GRC ADM3 (CC0); Zypern geoBoundaries CYP ADM1 (ODbL), geschnitten mit dem Regierungsgebiet der Spielkarte",
  ewSyr: "IOM DTM Syrien, Baseline Assessment Runde 19 (August 2026), Summe „Total Population“ der erfassten Orte des Distrikts; https://data.humdata.org/dataset/syrian-arab-republic-displacement-data-iom-dtm",
  ewIrq: "COSIT (Planungsministerium Irak), Volks- und Wohnungszählung 2024, Tabelle 2/11, Annual Statistical Abstract 2024–2025 Teil 2; https://cosit.gov.iq/documents/AAS2024/02.pdf",
  ewIrn: "Statistical Centre of Iran, Zensus 2016, über OCHA COD-PS Iran (irn_admpop_adm2_2016_v2); https://data.humdata.org/dataset/cod-ps-irn",
  ewGrc: "ELSTAT, Volkszählung 2021 (Stichtag 22.10.2021), ständige Bevölkerung (μόνιμος πληθυσμός) der Regionaleinheit, ΦΕΚ Β' 2802/26.04.2023; https://www.statistics.gr/documents/20181/17286366/FEK-2023-Tefxos-B-02802.pdf",
  ewCyp: "CYSTAT, Volkszählung 2021 (Stichtag 01.10.2021), Endergebnis vom 09.08.2024, Bevölkerung mit üblichem Wohnsitz im Regierungsgebiet des Bezirks; https://census.cystat.mof.gov.cy",
  ewArm: "Armstat (Statistikamt Armenien), Bevölkerung 2021, über OCHA COD-PS Armenien (arm_admpop_adm1_2021); https://data.humdata.org/dataset/cod-ps-arm",
} as const;

const Q = QUELLE;
const ew = (zahl: number, jahr: number, quelle: string): Einwohner => ({ zahl, jahr, quelle });

export const REGIONEN: Region[] = [
  // Nordsyrien
  { id: "syr_asas", schauplatz: "nordsyrien", lon: 37.04, lat: 36.59, gelaende: "ebene", tiefe: 1, wert: 1,
    einheit: { art: "distrikt", name: "A'zaz", pcode: "SY0204" }, flaecheKm2: 1260, einwohner: ew(729383, 2026, Q.ewSyr), ressourcen: [
      { id: "syr_bab_salama", art: "grenze", quelle: "npasyria.com/en/120405; https://en.wikipedia.org/wiki/Azaz" },
      { id: "syr_menagh", art: "stuetzpunkt", quelle: "https://en.wikipedia.org/wiki/Menagh_Military_Airbase" },
    ] },
  { id: "syr_manbidsch", schauplatz: "nordsyrien", lon: 37.96, lat: 36.53, gelaende: "ebene", tiefe: 1, wert: 1,
    einheit: { art: "distrikt", name: "Menbij", pcode: "SY0205" }, flaecheKm2: 5183, einwohner: ew(681601, 2026, Q.ewSyr), ressourcen: [] },
  { id: "syr_qamischli", schauplatz: "nordsyrien", lon: 41.23, lat: 37.03, gelaende: "ebene", tiefe: 1, wert: 2,
    einheit: { art: "distrikt", name: "Quamishli", pcode: "SY0802" }, flaecheKm2: 4042, einwohner: ew(519902, 2026, Q.ewSyr), ressourcen: [
      { id: "syr_qamischli_flughafen", art: "flughafen", quelle: "https://en.wikipedia.org/wiki/Qamishli_Airport" },
    ] },
  { id: "syr_idlib", schauplatz: "nordsyrien", lon: 36.63, lat: 35.93, gelaende: "berge", tiefe: 2, wert: 2,
    einheit: { art: "distrikt", name: "Idleb", pcode: "SY0700" }, flaecheKm2: 1437, einwohner: ew(727709, 2026, Q.ewSyr), ressourcen: [
      { id: "syr_m4_m5", art: "korridor", quelle: "https://en.wikipedia.org/wiki/Saraqib" },
      { id: "syr_taftanaz", art: "stuetzpunkt", quelle: "https://en.wikipedia.org/wiki/Taftanaz_Military_Airbase" },
    ] },
  { id: "syr_tabqa", schauplatz: "nordsyrien", lon: 38.55, lat: 35.84, gelaende: "ebene", tiefe: 2, wert: 2, ressource: "staudamm",
    einheit: { art: "distrikt", name: "Ath-Thawrah", pcode: "SY1103" }, flaecheKm2: 5464, einwohner: ew(180123, 2026, Q.ewSyr), ressourcen: [
      { id: "syr_tabqa_damm", art: "staudamm", quelle: "https://en.wikipedia.org/wiki/Tabqa_Dam" },
      { id: "syr_tabqa_basis", art: "stuetzpunkt", quelle: "https://en.wikipedia.org/wiki/Battle_of_Tabqa_Airbase" },
    ] },
  { id: "syr_rakka", schauplatz: "nordsyrien", lon: 39.02, lat: 35.93, gelaende: "stadt", tiefe: 2, wert: 2,
    einheit: { art: "distrikt", name: "Ar-Raqqa", pcode: "SY1101" }, flaecheKm2: 7327, einwohner: ew(503322, 2026, Q.ewSyr), ressourcen: [] },
  { id: "syr_hasaka", schauplatz: "nordsyrien", lon: 40.75, lat: 36.48, gelaende: "ebene", tiefe: 2, wert: 2, ressource: "oel",
    einheit: { art: "distrikt", name: "Al-Hasakeh", pcode: "SY0800" }, flaecheKm2: 12644, einwohner: ew(569112, 2026, Q.ewSyr), ressourcen: [
      { id: "syr_schaddadi", art: "oel", quelle: "https://en.wikipedia.org/wiki/Al-Shaddadi + OCHA COD-AB Ebene 3 (Subdistrikt Shadadah, SY080002)" },
    ] },
  { id: "syr_aleppo", schauplatz: "nordsyrien", lon: 37.17, lat: 36.23, gelaende: "stadt", tiefe: 3, wert: 3,
    einheit: { art: "distrikt", name: "Jebel Saman", pcode: "SY0200" }, flaecheKm2: 3065, einwohner: ew(2903140, 2026, Q.ewSyr), ressourcen: [
      { id: "syr_scheich_naddschar", art: "industrie", quelle: "https://en.wikipedia.org/wiki/Shaykh_Najjar" },
      { id: "syr_aleppo_flughafen", art: "flughafen", quelle: "https://en.wikipedia.org/wiki/Aleppo_International_Airport" },
    ] },
  { id: "syr_deir", schauplatz: "nordsyrien", lon: 40.13, lat: 35.33, gelaende: "ebene", tiefe: 3, wert: 2, ressource: "oel",
    einheit: { art: "distrikt", name: "Deir-ez-Zor", pcode: "SY0901" }, flaecheKm2: 14389, einwohner: ew(710796, 2026, Q.ewSyr), ressourcen: [
      { id: "syr_conoco", art: "gas", quelle: "https://en.wikipedia.org/wiki/Mission_Support_Site_Conoco + OCHA COD-AB Ebene 3 (Subdistrikt Khasham, SY090105)" },
    ] },
  // Nordirak
  { id: "irq_zaxo", schauplatz: "nordirak", lon: 42.69, lat: 37.15, gelaende: "berge", tiefe: 1, wert: 1,
    einheit: { art: "distrikt", name: "Zakho", pcode: "IQG09Q04" }, flaecheKm2: 1382, einwohner: ew(398876, 2024, Q.ewIrq), ressourcen: [
      { id: "irq_ibrahim_khalil", art: "grenze", quelle: "https://en.wikipedia.org/wiki/Ibrahim_Khalil_border_crossing" },
    ] },
  { id: "irq_dohuk", schauplatz: "nordirak", lon: 43.0, lat: 36.87, gelaende: "berge", tiefe: 1, wert: 1,
    einheit: { art: "distrikt", name: "Duhok", pcode: "IQG09Q02" }, flaecheKm2: 1036, einwohner: ew(497029, 2024, Q.ewIrq), ressourcen: [
      { id: "irq_duhok_damm", art: "staudamm", quelle: "https://en.wikipedia.org/wiki/Duhok_Dam" },
    ] },
  { id: "irq_tallafar", schauplatz: "nordirak", lon: 42.45, lat: 36.38, gelaende: "ebene", tiefe: 2, wert: 1,
    einheit: { art: "distrikt", name: "Telafar", pcode: "IQG15Q08" }, flaecheKm2: 4743, einwohner: ew(546411, 2024, Q.ewIrq), ressourcen: [
      { id: "irq_tal_afar_basis", art: "stuetzpunkt", quelle: "https://en.wikipedia.org/wiki/Tal_Afar_Air_Base" },
      { id: "irq_rabia", art: "grenze", quelle: "https://en.wikipedia.org/wiki/Rabia,_Iraq" },
    ] },
  { id: "irq_mossul", schauplatz: "nordirak", lon: 43.14, lat: 36.35, gelaende: "stadt", tiefe: 2, wert: 3,
    einheit: { art: "distrikt", name: "Al-Mosul", pcode: "IQG15Q05" }, flaecheKm2: 4715, einwohner: ew(2346534, 2024, Q.ewIrq), ressourcen: [
      { id: "irq_mosul_flughafen", art: "flughafen", quelle: "https://en.wikipedia.org/wiki/Mosul_International_Airport" },
      { id: "irq_qayyarah", art: "oel", quelle: "https://en.wikipedia.org/wiki/Qayyarah_subdistrict" },
    ] },
  { id: "irq_erbil", schauplatz: "nordirak", lon: 44.01, lat: 36.18, gelaende: "stadt", tiefe: 2, wert: 2,
    einheit: { art: "distrikt", name: "Erbil", pcode: "IQG11Q02" }, flaecheKm2: 2729, einwohner: ew(1288538, 2024, Q.ewIrq), ressourcen: [
      { id: "irq_erbil_flughafen", art: "flughafen", quelle: "https://en.wikipedia.org/wiki/Erbil_International_Airport" },
    ] },
  { id: "irq_kirkuk", schauplatz: "nordirak", lon: 44.39, lat: 35.47, gelaende: "ebene", tiefe: 3, wert: 3, ressource: "oel",
    einheit: { art: "distrikt", name: "Kirkuk", pcode: "IQG13Q04" }, flaecheKm2: 2911, einwohner: ew(1549454, 2024, Q.ewIrq), ressourcen: [
      { id: "irq_kirkuk_feld", art: "oel", quelle: "https://en.wikipedia.org/wiki/Kirkuk_Field" },
    ] },
  { id: "irq_sulaimaniya", schauplatz: "nordirak", lon: 45.43, lat: 35.56, gelaende: "berge", tiefe: 3, wert: 2, reizt: { land: "IRN", konflikt: 4 },
    einheit: { art: "distrikt", name: "Al-Sulaymaniyah", pcode: "IQG06Q01" }, flaecheKm2: 2304, einwohner: ew(1056067, 2024, Q.ewIrq), ressourcen: [
      { id: "irq_sulaimaniya_flughafen", art: "flughafen", quelle: "https://en.wikipedia.org/wiki/Sulaimaniyah_International_Airport" },
    ] },
  // Ägäis und Thrakien
  { id: "grc_mytilini", schauplatz: "aegaeis", lon: 26.56, lat: 39.11, gelaende: "insel", tiefe: 1, wert: 2,
    einheit: { art: "regionaleinheit", name: "Lesvos" }, flaecheKm2: 1611, einwohner: ew(83755, 2021, Q.ewGrc), ressourcen: [
      { id: "grc_mytilini_flughafen", art: "flughafen", quelle: "https://en.wikipedia.org/wiki/Mytilene_International_Airport" },
    ] },
  { id: "grc_chios", schauplatz: "aegaeis", lon: 26.14, lat: 38.37, gelaende: "insel", tiefe: 1, wert: 2,
    einheit: { art: "regionaleinheit", name: "Chios" }, flaecheKm2: 906, einwohner: ew(51692, 2021, Q.ewGrc), ressourcen: [
      { id: "grc_chios_flughafen", art: "flughafen", quelle: "https://en.wikipedia.org/wiki/Chios_Island_National_Airport" },
    ] },
  { id: "grc_kos", schauplatz: "aegaeis", lon: 27.29, lat: 36.89, gelaende: "insel", tiefe: 1, wert: 2,
    einheit: { art: "regionaleinheit", name: "Kos" }, flaecheKm2: 349, einwohner: ew(38137, 2021, Q.ewGrc), ressourcen: [
      { id: "grc_kos_flughafen", art: "flughafen", quelle: "https://en.wikipedia.org/wiki/Kos_Island_International_Airport" },
    ] },
  { id: "grc_rhodos", schauplatz: "aegaeis", lon: 28.22, lat: 36.44, gelaende: "insel", tiefe: 2, wert: 2, ressource: "hafen",
    einheit: { art: "regionaleinheit", name: "Rodos" }, flaecheKm2: 1595, einwohner: ew(129521, 2021, Q.ewGrc), ressourcen: [
      { id: "grc_rhodos_flughafen", art: "flughafen", quelle: "https://en.wikipedia.org/wiki/Rhodes_International_Airport" },
    ] },
  { id: "grc_alexandroupoli", schauplatz: "aegaeis", lon: 25.87, lat: 40.85, gelaende: "kueste", tiefe: 1, wert: 2, ressource: "hafen",
    einheit: { art: "regionaleinheit", name: "Evros" }, flaecheKm2: 4144, einwohner: ew(133802, 2021, Q.ewGrc), ressourcen: [
      { id: "grc_lng_alexandroupoli", art: "gas", quelle: "lngprime.com/europe/gastrade-expects-to-launch-commercial-ops-at-greeces-first-fsru-in-october/116321" },
      { id: "grc_hafen_alexandroupoli", art: "hafen", quelle: "www.army.mil/article/248667" },
      { id: "grc_tap", art: "gas", quelle: "https://en.wikipedia.org/wiki/Trans_Adriatic_Pipeline" },
    ] },
  { id: "grc_komotini", schauplatz: "aegaeis", lon: 25.42, lat: 41.13, gelaende: "ebene", tiefe: 2, wert: 2,
    einheit: { art: "regionaleinheit", name: "Rodopi" }, flaecheKm2: 2464, einwohner: ew(104262, 2021, Q.ewGrc), ressourcen: [
      { id: "grc_igb", art: "gas", quelle: "https://en.wikipedia.org/wiki/Gas_Interconnector_Greece–Bulgaria" },
      { id: "grc_nymfaia", art: "grenze", quelle: "https://en.wikipedia.org/wiki/Makaza" },
    ] },
  { id: "grc_xanthi", schauplatz: "aegaeis", lon: 24.88, lat: 41.14, gelaende: "ebene", tiefe: 2, wert: 2,
    einheit: { art: "regionaleinheit", name: "Xanthi" }, flaecheKm2: 1827, einwohner: ew(108195, 2021, Q.ewGrc), ressourcen: [] },
  { id: "grc_kavala", schauplatz: "aegaeis", lon: 24.4, lat: 40.94, gelaende: "kueste", tiefe: 3, wert: 2, ressource: "hafen",
    einheit: { art: "regionaleinheit", name: "Kavala" }, flaecheKm2: 1764, einwohner: ew(116195, 2021, Q.ewGrc), ressourcen: [
      { id: "grc_kavala_flughafen", art: "flughafen", quelle: "https://en.wikipedia.org/wiki/Kavala_International_Airport; https://en.wikipedia.org/wiki/Nestos_(municipality)" },
    ] },
  { id: "grc_thessaloniki", schauplatz: "aegaeis", lon: 22.88, lat: 40.7, gelaende: "stadt", tiefe: 3, wert: 3,
    einheit: { art: "regionaleinheit", name: "Thessaloniki" }, flaecheKm2: 3750, einwohner: ew(1092919, 2021, Q.ewGrc), ressourcen: [
      { id: "grc_thessaloniki_hafen", art: "hafen", quelle: "https://en.wikipedia.org/wiki/Port_of_Thessaloniki" },
      { id: "grc_thessaloniki_flughafen", art: "flughafen", quelle: "https://en.wikipedia.org/wiki/Thessaloniki_Airport" },
    ] },
  // Zypern (Republik Zypern; der Norden steht unter türkischer Kontrolle)
  { id: "cyp_nikosia", schauplatz: "zypern", lon: 33.37, lat: 35.17, gelaende: "stadt", tiefe: 1, wert: 3,
    einheit: { art: "bezirk", name: "Nicosia" }, flaecheKm2: 1939, einwohner: ew(350035, 2021, Q.ewCyp), ressourcen: [] },
  { id: "cyp_larnaka", schauplatz: "zypern", lon: 33.64, lat: 34.92, gelaende: "kueste", tiefe: 2, wert: 2, ressource: "hafen",
    einheit: { art: "bezirk", name: "Larnaca" }, flaecheKm2: 907, einwohner: ew(155765, 2021, Q.ewCyp), ressourcen: [
      { id: "cyp_larnaka_flughafen", art: "flughafen", quelle: "https://en.wikipedia.org/wiki/Larnaca_International_Airport" },
      { id: "cyp_vasilikos", art: "energie", quelle: "https://en.wikipedia.org/wiki/Evangelos_Florakis_Naval_Base" },
    ] },
  { id: "cyp_limassol", schauplatz: "zypern", lon: 33.03, lat: 34.68, gelaende: "kueste", tiefe: 2, wert: 2, ressource: "hafen", reizt: { land: "EU", konflikt: 3 },
    einheit: { art: "bezirk", name: "Limassol" }, flaecheKm2: 1250, einwohner: ew(262157, 2021, Q.ewCyp), ressourcen: [
      { id: "cyp_limassol_hafen", art: "hafen", quelle: "https://en.wikipedia.org/wiki/Limassol_Port" },
      { id: "cyp_kouris", art: "staudamm", quelle: "https://en.wikipedia.org/wiki/Kouris_Dam" },
    ] },
  { id: "cyp_paphos", schauplatz: "zypern", lon: 32.42, lat: 34.76, gelaende: "kueste", tiefe: 3, wert: 1,
    einheit: { art: "bezirk", name: "Paphos" }, flaecheKm2: 1397, einwohner: ew(101106, 2021, Q.ewCyp), ressourcen: [
      { id: "cyp_paphos_flughafen", art: "flughafen", quelle: "https://en.wikipedia.org/wiki/Paphos_International_Airport" },
    ] },
  // Südkaukasus (Armenien)
  { id: "arm_gjumri", schauplatz: "suedkaukasus", lon: 43.85, lat: 40.79, gelaende: "ebene", tiefe: 1, wert: 2, ressource: "stuetzpunkt", reizt: { land: "RUS", konflikt: 10 },
    einheit: { art: "provinz", name: "Shirak", pcode: "AM08" }, flaecheKm2: 2717, einwohner: ew(230963, 2021, Q.ewArm), ressourcen: [
      { id: "arm_102_basis", art: "stuetzpunkt", quelle: "https://en.wikipedia.org/wiki/102nd_Military_Base" },
    ] },
  { id: "arm_kapan", schauplatz: "suedkaukasus", lon: 46.41, lat: 39.2, gelaende: "berge", tiefe: 1, wert: 3, ressource: "korridor", reizt: { land: "USA", konflikt: 8 },
    einheit: { art: "provinz", name: "Syunik", pcode: "AM09" }, flaecheKm2: 4492, einwohner: ew(135851, 2021, Q.ewArm), ressourcen: [
      { id: "arm_sangesur", art: "bergbau", quelle: "https://en.wikipedia.org/wiki/Zangezur_Copper_and_Molybdenum_Combine" },
      { id: "arm_agarak", art: "grenze", quelle: "https://en.wikipedia.org/wiki/Agarak,_Syunik" },
      { id: "arm_tripp", art: "korridor", quelle: "https://en.wikipedia.org/wiki/Trump_Route_for_International_Peace_and_Prosperity" },
    ] },
  { id: "arm_jeghegnadsor", schauplatz: "suedkaukasus", lon: 45.33, lat: 39.76, gelaende: "berge", tiefe: 2, wert: 1,
    einheit: { art: "provinz", name: "Vayots Dzor", pcode: "AM10" }, flaecheKm2: 2296, einwohner: ew(48124, 2021, Q.ewArm), ressourcen: [] },
  { id: "arm_artaschat", schauplatz: "suedkaukasus", lon: 44.55, lat: 39.95, gelaende: "ebene", tiefe: 2, wert: 2,
    einheit: { art: "provinz", name: "Ararat", pcode: "AM03" }, flaecheKm2: 2114, einwohner: ew(256630, 2021, Q.ewArm), ressourcen: [
      { id: "arm_ararat_werke", art: "industrie", quelle: "https://en.wikipedia.org/wiki/Ararat,_Armenia" },
    ] },
  { id: "arm_eriwan", schauplatz: "suedkaukasus", lon: 44.51, lat: 40.18, gelaende: "stadt", tiefe: 3, wert: 3,
    einheit: { art: "hauptstadt", name: "Yerevan", pcode: "AM01" }, flaecheKm2: 233, einwohner: ew(1091747, 2021, Q.ewArm), ressourcen: [
      { id: "arm_erebuni", art: "stuetzpunkt", quelle: "https://en.wikipedia.org/wiki/Erebuni_Airport" },
    ] },
  // Nordwestiran
  { id: "irn_choi", schauplatz: "nordwestiran", lon: 44.97, lat: 38.53, gelaende: "berge", tiefe: 1, wert: 1,
    einheit: { art: "schahrestan", name: "Khoy", pcode: "IR029005" }, flaecheKm2: 4448, einwohner: ew(348664, 2016, Q.ewIrn), ressourcen: [
      { id: "irn_razi", art: "grenze", quelle: "https://en.wikipedia.org/wiki/Razi,_West_Azerbaijan" },
    ] },
  { id: "irn_urmia", schauplatz: "nordwestiran", lon: 45.0, lat: 37.53, gelaende: "ebene", tiefe: 1, wert: 2,
    einheit: { art: "schahrestan", name: "Urumia", pcode: "IR029017" }, flaecheKm2: 5279, einwohner: ew(1040565, 2016, Q.ewIrn), ressourcen: [
      { id: "irn_serow", art: "grenze", quelle: "https://en.wikipedia.org/wiki/Serow,_Iran" },
      { id: "irn_urmia_flughafen", art: "flughafen", quelle: "https://en.wikipedia.org/wiki/Urmia_Airport" },
    ] },
  { id: "irn_mahabad", schauplatz: "nordwestiran", lon: 45.72, lat: 36.77, gelaende: "berge", tiefe: 2, wert: 1,
    einheit: { art: "schahrestan", name: "Mahabad", pcode: "IR029006" }, flaecheKm2: 2615, einwohner: ew(236849, 2016, Q.ewIrn), ressourcen: [
      { id: "irn_mahabad_damm", art: "staudamm", quelle: "https://en.wikipedia.org/wiki/Mahabad_Dam" },
    ] },
  { id: "irn_taebris", schauplatz: "nordwestiran", lon: 46.3, lat: 38.09, gelaende: "stadt", tiefe: 2, wert: 3,
    einheit: { art: "schahrestan", name: "Tabriz", pcode: "IR005019" }, flaecheKm2: 2251, einwohner: ew(1773033, 2016, Q.ewIrn), ressourcen: [
      { id: "irn_raffinerie_taebris", art: "oel", quelle: "www.eghtesadonline.com/en/news/786845" },
      { id: "irn_tab2", art: "stuetzpunkt", quelle: "https://en.wikipedia.org/wiki/Tabriz_International_Airport" },
    ] },
  { id: "irn_ardabil", schauplatz: "nordwestiran", lon: 48.3, lat: 38.25, gelaende: "berge", tiefe: 3, wert: 2,
    einheit: { art: "schahrestan", name: "Ardabil", pcode: "IR002001" }, flaecheKm2: 2166, einwohner: ew(605992, 2016, Q.ewIrn), ressourcen: [
      { id: "irn_ardabil_flughafen", art: "flughafen", quelle: "https://en.wikipedia.org/wiki/Ardabil_Airport" },
    ] },
  { id: "irn_sandschan", schauplatz: "nordwestiran", lon: 48.5, lat: 36.67, gelaende: "ebene", tiefe: 3, wert: 2,
    einheit: { art: "schahrestan", name: "Zanjan", pcode: "IR031008" }, flaecheKm2: 6488, einwohner: ew(521302, 2016, Q.ewIrn), ressourcen: [
      { id: "irn_sandschan_flughafen", art: "flughafen", quelle: "https://en.wikipedia.org/wiki/Zanjan_Airport" },
    ] },
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

/**
 * „cyber“ (Welle 3, K1): Angriffe auf Netze, Energie- und Kommandosysteme des Gegners. Nur im Fernkonflikt ohne gemeinsame Grenze
 * (sim/fernkonflikt.ts); nimmt kein Gelände, zehrt an der Ausdauer des Gegners. Getragen von der Behörde für Cybersicherheit
 * (data/behoerden.ts „cyber“), nicht von einer Waffengattung. Alle Werte Spielparameter.
 */
export type EinsatzArt = "luft" | "boden" | "see" | "stellvertreter" | "cyber";

export const EINSATZ: Record<EinsatzArt, {
  /** Fortschritt je Gelände (1 = normal) */
  gelaende: Record<Gelaende, number>;
  /** Grundtempo der Art unabhängig vom Gelände (fehlt: 1; Welle 3, K2) */
  tempo?: number;
  /** Eigene Gattungen und ihr Gewicht (data/streitkraefte.ts) */
  traeger: Partial<Record<"personal" | "panzer" | "kampfflugzeuge" | "drohnen" | "marine" | "luftabwehr" | "raketen" | "munition", number>>;
  /** Wogegen sie kämpft (Gegnergattungen und Gewicht) */
  gegen: Partial<Record<GegnerGattung, number>>;
  /** Eigene Verluste und Erschöpfung der Heimatfront (1 = normal) */
  verlust: number;
  uhr: number;
  /** Wie weit diese Art höchstens trägt (Tiefe); 0 heißt: nimmt kein Gebiet (Luftschläge, Welle 3 K2, Vorbild Klauenschwert 2022) */
  reichweite: 0 | 1 | 2 | 3;
  /** Zusätzlicher Abfluss der gegnerischen Uhr je Woche (Blockade, Luftschläge auf Infrastruktur) */
  druck: number;
  /** Ansehen-Kosten bei Beginn (Bodenoffensive sichtbarer, Stellvertreter verdeckt) */
  ansehen: number;
}> = {
  luft: {
    gelaende: { ebene: 1.0, berge: 0.75, stadt: 0.6, insel: 0.85, kueste: 0.9 },
    traeger: { drohnen: 0.45, kampfflugzeuge: 0.35, raketen: 0.1, munition: 0.1 },
    gegen: { luftabwehr: 0.4, luft: 0.25, heer: 0.35 },
    verlust: 0.2, uhr: 0.8, reichweite: 0, druck: 0.35, ansehen: -1,
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
  // Welle 3, K2 (Kalibrierung an Schutzschild Euphrat 2016/17: rund 2.000 km² in sieben Monaten, 71 türkische Gefallene): langsam
  // (Grundtempo 0,45), je Woche wenige eigene Tote, über die lange Dauer aber kein billiger Krieg. Vorher nahmen Verbündete den syrischen
  // Grenzstreifen (10.485 km²) in 13 Wochen mit 26 Gefallenen.
  stellvertreter: {
    gelaende: { ebene: 0.8, berge: 0.8, stadt: 0.55, insel: 0.1, kueste: 0.5 },
    tempo: 0.45,
    traeger: { drohnen: 0.4, munition: 0.3, personal: 0.3 },
    gegen: { heer: 0.8, drohnen: 0.2 },
    verlust: 1, uhr: 0.55, reichweite: 1, druck: 0.1, ansehen: -0.5,
  },
  cyber: {
    gelaende: { ebene: 0, berge: 0, stadt: 0, insel: 0, kueste: 0 },
    traeger: {},
    gegen: { luftabwehr: 0.4, see: 0.2, heer: 0.4 },
    verlust: 0.05, uhr: 0.5, reichweite: 1, druck: 0.45, ansehen: -0.5,
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
