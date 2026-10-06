// Die übrigen Länder als Akteure: Jedes hat einen Steckbrief, vier Beziehungsdimensionen (Handel, Sicherheit, Vertrauen, Konflikt),
// eigene Anliegen an die Türkei und Handlungen, die der Präsident ihm gegenüber wählen kann (AUSSENPOLITIK.md, Abschnitte 1 bis 4).
// Das Vertrauen ist keine eigene Zahl, sondern das Vertrauen im Politiknetz (beziehungen_*) plus ein Versatz für dieses Land, damit
// Maßnahmen wie „Annäherung an die EU“ und Handlungen gegenüber einem Land dieselbe Wirklichkeit bewegen. Die Startwerte sind
// Spielparameter aus der qualitativen Matrix des Konzepts (hoch, mittel, niedrig), keine gemessenen Zahlen.
// Kalibrierung Stand 30.09.2026: RECHERCHE_REALWELT_LAENDERDOSSIERS.md, Teil III „Beziehungsmatrix 2026“ (Handel/Sicherheit/Vertrauen/
// Konflikt, jeweils 0–100); der Quellen-Kommentar steht direkt am Startwert des Landes, der alte Wert in Klammern dahinter.

import { NET } from "./modell";
import { nationalAverage, startAverage } from "./netz";
import { wirke, vertrauenAendern } from "./wirkung";
import { addLog } from "./log";
import { clamp } from "./economy";
import { pruefeBedingung, type Bedingung } from "./programme";
import { zusageAnlegen } from "./ereignis-hilfen";
import type { World } from "./types";
import { kannZahlen } from "./kapital";
import { AUFMERKSAMKEIT_KOSTEN, neuanfangGrund, verbrauche } from "./aufmerksamkeit";
import type { Vertrag } from "./abkommen-typen";
import { msg, t, tIn } from "../i18n";

export type Dimension = "handel" | "sicherheit" | "vertrauen" | "konflikt";
export type AktionId = "gipfel" | "handel" | "ruestung" | "druck" | "entspannen" | "hilfe";

export type LandBedingung = Bedingung | { art: "land"; dim: Dimension; min?: number; max?: number };

export interface Anliegen {
  id: string;
  titel: string;
  text: string;
  bedingung: LandBedingung;
}

export interface LandDef {
  id: string;
  name: string;
  /** „mit …“, „zu …“ (Dativ) und „auf …“, „für …“ (Akkusativ) mit Artikel */
  dat: string;
  akk: string;
  kurz: string;
  gruppe: "Große Mächte" | "Verbündete und Partner" | "Nachbarn";
  /** ISO-Kürzel für Weltbank-Daten und Karte (die EU steht für Deutschland als Maßstab) */
  iso: string;
  wdi?: string;
  text: string;
  knoten: string;
  /** Wie stark eine Handlung gegenüber diesem Land den Knoten bewegt (0 bis 1) */
  anteil: number;
  start: Record<Dimension, number>;
  anliegen: Anliegen[];
  aktionen: AktionId[];
}

const A = (id: string, titel: string, text: string, bedingung: LandBedingung): Anliegen => ({ id, titel, text, bedingung });

export const LAENDER: LandDef[] = [
  {
    id: "USA", dat: t("sim2.sim.laender.bb87fdf"), akk: t("sim2.sim.laender.3c8c4c6"), name: "Vereinigte Staaten", kurz: "US", gruppe: "Große Mächte", iso: "USA", wdi: "USA", knoten: "beziehungen_usa", anteil: 1,
    text: t("sim2.sim.laender.0e9d697"),
    // Teil III: V↑ nach dem Trump-Reset, K↓ nach der CAATSA-Wende 07/2026, S↓ minimal (Iran-Krieg belastet die Incirlik-Logik); alt 70/65/45/55
    start: { handel: 70, sicherheit: 60, vertrauen: 52, konflikt: 45 },
    anliegen: [
      A("usa-nato", t("sim2.sim.laender.10ed2ce"), t("sim2.sim.laender.a85cc4a"), { art: "massnahme", id: "m_verteidigung", min: 55 }),
      A("usa-grenze", t("sim2.sim.laender.e1bb5a2"), t("sim2.sim.laender.0c7750a"), { art: "massnahme", id: "m_grenzschutz", min: 60 }),
    ],
    aktionen: ["gipfel", "handel", "ruestung", "druck", "entspannen"],
  },
  {
    id: "EU", dat: t("sim2.sim.laender.5167109"), akk: t("sim2.sim.laender.ecc6b69"), name: t("sim2.sim.laender.c24fb50"), kurz: "EU", gruppe: "Große Mächte", iso: "DEU", wdi: "DEU", knoten: "beziehungen_eu", anteil: 1,
    text: t("sim2.sim.laender.6925a44"),
    // Teil III: Code passt zum Two-Track-Stand (90/55/40/45 unverändert)
    start: { handel: 90, sicherheit: 55, vertrauen: 40, konflikt: 45 },
    anliegen: [
      A("eu-recht", t("sim2.sim.laender.22a3f46"), t("sim2.sim.laender.98b9dc3"), { art: "massnahme", id: "m_justizreform", min: 55 }),
      A("eu-medien", "Freie Medien", t("sim2.sim.laender.72d90d9"), { art: "massnahme-max", id: "m_medienaufsicht", max: 50 }),
      A("eu-annaeherung", t("sim2.sim.laender.86d3660"), t("sim2.sim.laender.4be68dc"), { art: "massnahme", id: "m_eu_annaeherung", min: 55 }),
    ],
    aktionen: ["gipfel", "handel", "druck", "entspannen"],
  },
  {
    id: "RUS", dat: "Russland", akk: "Russland", name: "Russland", kurz: "RU", gruppe: "Große Mächte", iso: "RUS", wdi: "RUS", knoten: "beziehungen_russland", anteil: 1,
    text: t("sim2.sim.laender.837a1ac"),
    // Teil III: H↓ leicht (Türkei senkt Russland-Öl, große Gasverträge laufen Ende 2026 aus); alt 75/40/45/50
    start: { handel: 72, sicherheit: 38, vertrauen: 45, konflikt: 52 },
    anliegen: [
      A("rus-akkuyu", "Akkuyu vollenden", t("sim2.sim.laender.f95f68d"), { art: "massnahme", id: "m_kernkraft", min: 50 }),
      A("rus-handel", t("sim2.sim.laender.d4ad777"), t("sim2.sim.laender.f3963f0"), { art: "massnahme-max", id: "m_zoelle", max: 45 }),
    ],
    aktionen: ["gipfel", "handel", "ruestung", "druck", "entspannen"],
  },
  {
    id: "GRC", dat: "Griechenland", akk: "Griechenland", name: "Griechenland", kurz: "GR", gruppe: "Nachbarn", iso: "GRC", wdi: "GRC", knoten: "beziehungen_eu", anteil: 0.4,
    text: t("sim2.sim.laender.4667f30"),
    // Teil III: K↓↓ (Dialogphase seit 2023, Hochrangiger Kooperationsrat 02/2026), V↑, H/S minimal ↑; alt 40/30/30/65
    start: { handel: 42, sicherheit: 32, vertrauen: 35, konflikt: 55 },
    anliegen: [
      A("grc-aegaeis", t("sim2.sim.laender.491f570"), t("sim2.sim.laender.9ca0328"), { art: "land", dim: "konflikt", max: 50 }),
      A("grc-migration", "Kontrollierte Migration", t("sim2.sim.laender.4a976ba"), { art: "massnahme", id: "m_grenzschutz", min: 60 }),
    ],
    aktionen: ["gipfel", "druck", "entspannen"],
  },
  {
    id: "IRN", dat: t("sim2.sim.laender.4413a05"), akk: t("sim2.sim.laender.4b767d3"), name: "Iran", kurz: "IR", gruppe: "Nachbarn", iso: "IRN", wdi: "IRN", knoten: "beziehungen_nahost", anteil: 0.3,
    text: t("sim2.sim.laender.c4406bc"),
    // Teil III: H↓↓ (Krieg, Snapback-Sanktionen, Gasvertrag ausgelaufen 07/2026), S↓ (Eskalationsrisiko Ostgrenze), K↑ (Hormus-Spillover); alt 55/40/40/45
    start: { handel: 42, sicherheit: 30, vertrauen: 40, konflikt: 55 },
    anliegen: [
      A("irn-handel", "Handel trotz Sanktionen", t("sim2.sim.laender.25f6c27"), { art: "land", dim: "handel", min: 55 }),
      A("irn-gas", t("sim2.sim.laender.3534f89"), t("sim2.sim.laender.89cc87c"), { art: "land", dim: "vertrauen", min: 45 }),
    ],
    aktionen: ["gipfel", "handel", "druck", "entspannen"],
  },
  {
    id: "SYR", dat: "Syrien", akk: "Syrien", name: "Syrien", kurz: "SY", gruppe: "Nachbarn", iso: "SYR", wdi: "SYR", knoten: "beziehungen_nahost", anteil: 0.3,
    text: t("sim2.sim.laender.fce7f13"),
    // Teil III (größte Korrektur): Assad-/Frontstaat-Ära ersetzt — Klientelpartnerschaft, SDF 08/2026 aufgelöst, Sanktionen aufgehoben, Handel +40 % 2025; alt 35/20/25/75
    start: { handel: 45, sicherheit: 55, vertrauen: 68, konflikt: 20 },
    anliegen: [
      A("syr-rueckkehr", t("sim2.sim.laender.2bff369"), t("sim2.sim.laender.b9506e1"), { art: "massnahme", id: "m_rueckkehr", min: 55 }),
      A("syr-grenze", t("sim2.sim.laender.6b8db41"), t("sim2.sim.laender.540b66b"), { art: "land", dim: "konflikt", max: 45 }),
    ],
    aktionen: ["gipfel", "hilfe", "druck", "entspannen"],
  },
  {
    id: "IRQ", dat: t("sim2.sim.laender.3bfc657"), akk: t("sim2.sim.laender.8d49299"), name: "Irak", kurz: "IQ", gruppe: "Nachbarn", iso: "IRQ", wdi: "IRQ", knoten: "beziehungen_nahost", anteil: 0.3,
    text: t("sim2.sim.laender.e89eccc"),
    // Teil III: K↓ (Pipeline-Protokoll 07/2026, Kurs der Regierung Zaidi), S↑ leicht, H↑ minimal; alt 60/35/40/55
    start: { handel: 62, sicherheit: 40, vertrauen: 45, konflikt: 42 },
    anliegen: [
      A("irq-wasser", t("sim2.sim.laender.3af289e"), t("sim2.sim.laender.e23400e"), { art: "land", dim: "vertrauen", min: 45 }),
      A("irq-souveraenitaet", t("sim2.sim.laender.53f7e70"), t("sim2.sim.laender.eff470e"), { art: "land", dim: "konflikt", max: 50 }),
    ],
    aktionen: ["gipfel", "handel", "hilfe", "entspannen"],
  },
  {
    id: "AZE", dat: "Aserbaidschan", akk: "Aserbaidschan", name: "Aserbaidschan", kurz: "AZ", gruppe: "Verbündete und Partner", iso: "AZE", wdi: "AZE", knoten: "beziehungen_nahost", anteil: 0.2,
    text: t("sim2.sim.laender.1346d8d"),
    // Teil III: Code ok — engste Beziehung der Türkei (75/85/85/15 unverändert)
    start: { handel: 75, sicherheit: 85, vertrauen: 85, konflikt: 15 },
    anliegen: [
      A("aze-korridor", t("sim2.sim.laender.a552d33"), t("sim2.sim.laender.5695a53"), { art: "massnahme", id: "m_bahn", min: 50 }),
      A("aze-gas", "Gasabnahme", t("sim2.sim.laender.b9f841b"), { art: "land", dim: "handel", min: 70 }),
    ],
    aktionen: ["gipfel", "handel", "ruestung", "hilfe"],
  },
  {
    id: "ARM", dat: "Armenien", akk: "Armenien", name: "Armenien", kurz: "AM", gruppe: "Nachbarn", iso: "ARM", wdi: "ARM", knoten: "ansehen", anteil: 0.2,
    text: t("sim2.sim.laender.f57b25e"),
    // Teil III: V↑ (THY-Direktflüge 03/2026, Direkthandel registriert 05/2026), K↓ (Wiederwahl Paschinjans 06/2026, Normalisierungskanal); alt 20/25/30/55
    start: { handel: 18, sicherheit: 28, vertrauen: 36, konflikt: 48 },
    anliegen: [
      A("arm-grenze", t("sim2.sim.laender.65122a9"), t("sim2.sim.laender.5e7de70"), { art: "land", dim: "vertrauen", min: 45 }),
      A("arm-frieden", t("sim2.sim.laender.5c10bb9"), t("sim2.sim.laender.c0f1e6a"), { art: "land", dim: "konflikt", max: 45 }),
    ],
    aktionen: ["gipfel", "entspannen", "hilfe"],
  },
  {
    id: "SAU", dat: t("sim2.sim.laender.4aa62ec"), akk: t("sim2.sim.laender.49e19bd"), name: t("sim2.sim.laender.5bf93cc"), kurz: "GO", gruppe: "Verbündete und Partner", iso: "SAU", wdi: "SAU", knoten: "beziehungen_nahost", anteil: 0.5,
    text: t("sim2.sim.laender.b737a96"),
    // Teil III: S↑↑ (Mekka-Beistandspakt 07.08.2026 mit Kollektivklausel, siehe START_VERTRAEGE unten), V↑; alt 55/50/55/30
    start: { handel: 55, sicherheit: 66, vertrauen: 62, konflikt: 28 },
    anliegen: [
      A("sau-invest", t("sim2.sim.laender.512f085"), t("sim2.sim.laender.fbeb7dd"), { art: "massnahme", id: "m_justizreform", min: 45 }),
      A("sau-partner", "Partnerschaft statt Konkurrenz", t("sim2.sim.laender.46a67a6"), { art: "land", dim: "vertrauen", min: 60 }),
    ],
    aktionen: ["gipfel", "handel", "ruestung", "hilfe"],
  },
  {
    id: "ISR", dat: "Israel", akk: "Israel", name: "Israel", kurz: "IL", gruppe: "Nachbarn", iso: "ISR", wdi: "ISR", knoten: "beziehungen_nahost", anteil: 0.3,
    text: t("sim2.sim.laender.d1748a4"),
    // Teil III (gravierende Korrektur): H↓↓ — die Handelssperre seit 05/2024 hat den Handel auf null gedrückt; K↑ (Haftbefehle 07/2026, Bombardierung eines für türkische Truppen vorgesehenen Stützpunkts 08/2026); alt 50/25/30/60.
    // Die Sperre selbst ist als Zustand abgebildet: handelssperre blockiert Handelsaktionen und -klauseln, bis die Klausel „ende_sperre“ vereinbart ist.
    start: { handel: 10, sicherheit: 22, vertrauen: 25, konflikt: 70 },
    anliegen: [
      A("isr-handel", t("sim2.sim.laender.ea83b31"), t("sim2.sim.laender.c4b70a4"), { art: "land", dim: "handel", min: 50 }),
      A("isr-ruhe", t("sim2.sim.laender.640e74f"), t("sim2.sim.laender.c6fd099"), { art: "land", dim: "konflikt", max: 55 }),
    ],
    aktionen: ["gipfel", "handel", "druck", "entspannen"],
  },
  {
    id: "CHN", dat: "China", akk: "China", name: "China", kurz: "CN", gruppe: "Große Mächte", iso: "CHN", wdi: "CHN", knoten: "ansehen", anteil: 0.3,
    text: t("sim2.sim.laender.f8807af"),
    start: { handel: 75, sicherheit: 30, vertrauen: 45, konflikt: 30 }, // nicht Teil der Beziehungsmatrix 2026 (kein Akteur der Recherche), Werte unverändert
    anliegen: [
      A("chn-invest", t("sim2.sim.laender.1b7a38d"), t("sim2.sim.laender.f28b6f9"), { art: "massnahme", id: "m_investitionsanreize", min: 45 }),
      A("chn-korridor", "Der Mittlere Korridor", t("sim2.sim.laender.1d9099c"), { art: "massnahme", id: "m_bahn", min: 50 }),
    ],
    aktionen: ["gipfel", "handel", "druck"],
  },
  {
    id: "UKR", dat: t("sim2.sim.laender.11d50a2"), akk: t("sim2.sim.laender.e81c2eb"), name: "Ukraine", kurz: "UA", gruppe: "Nachbarn", iso: "UKR", wdi: "UKR", knoten: "ansehen", anteil: 0.25,
    text: t("sim2.sim.laender.c0bb98d"),
    // Teil III: Code ok; H minimal ↑ (FTA-Entwurf 02/2026), S/V minimal ↑ (Türkei führt seit 07/2026 die maritime Komponente der Sicherheitsgarantien); alt 55/60/60/15
    start: { handel: 58, sicherheit: 62, vertrauen: 62, konflikt: 15 },
    anliegen: [
      A("ukr-meerengen", "Die Meerengen geschlossen halten", t("sim2.sim.laender.1d42724"), { art: "massnahme", id: "m_verteidigung", min: 50 }),
      A("ukr-vermittlung", "Ein ehrlicher Vermittler", t("sim2.sim.laender.c22af56"), { art: "land", dim: "vertrauen", min: 55 }),
    ],
    aktionen: ["gipfel", "handel", "ruestung", "hilfe"],
  },
  {
    id: "GEO", dat: "Georgien", akk: "Georgien", name: "Georgien", kurz: "GE", gruppe: "Nachbarn", iso: "GEO", wdi: "GEO", knoten: "ansehen", anteil: 0.15,
    text: t("sim2.sim.laender.279ebd4"),
    start: { handel: 65, sicherheit: 60, vertrauen: 65, konflikt: 20 }, // Teil III: Code ok (BTK-Volllast seit 06/2026 stützt die Werte), unverändert
    anliegen: [
      A("geo-transit", t("sim2.sim.laender.3526aba"), t("sim2.sim.laender.758c5d4"), { art: "massnahme", id: "m_bahn", min: 50 }),
      A("geo-westen", t("sim2.sim.laender.b9785b4"), t("sim2.sim.laender.d08f889"), { art: "land", dim: "vertrauen", min: 60 }),
    ],
    aktionen: ["gipfel", "handel", "hilfe"],
  },
  {
    id: "EGY", dat: t("sim2.sim.laender.df3ac08"), akk: t("sim2.sim.laender.df3ac08"), name: t("sim2.sim.laender.df3ac08"), kurz: "EG", gruppe: "Verbündete und Partner", iso: "EGY", wdi: "EGY", knoten: "beziehungen_nahost", anteil: 0.25,
    text: t("sim2.sim.laender.b1b7d33"),
    // Teil III: alles ↑ (Strategische Partnerschaft 04.02.2026, Verteidigungs-MoU, FSRU-Deal, Handelsziel 15 Mrd. bis 2028); alt 55/35/40/45
    start: { handel: 60, sicherheit: 45, vertrauen: 50, konflikt: 35 },
    anliegen: [
      A("egy-gas", t("sim2.sim.laender.40a10c6"), t("sim2.sim.laender.f43de3c"), { art: "land", dim: "konflikt", max: 40 }),
      A("egy-libyen", t("sim2.sim.laender.97a21d4"), "Abstimmung statt Stellvertreterkonkurrenz.", { art: "land", dim: "vertrauen", min: 50 }),
    ],
    aktionen: ["gipfel", "handel", "entspannen", "druck"],
  },
  {
    id: "LBY", dat: "Libyen", akk: "Libyen", name: "Libyen", kurz: "LY", gruppe: "Verbündete und Partner", iso: "LBY", knoten: "beziehungen_nahost", anteil: 0.15,
    text: t("sim2.sim.laender.682aa95"),
    // Teil III: H↑ (Türkei ist Libyens größte Importquelle 2025), S/V leicht ↑ (Annäherung an beide Lager, West und Ost); alt 45/55/55/35
    start: { handel: 50, sicherheit: 58, vertrauen: 58, konflikt: 32 },
    anliegen: [
      A("lby-seegrenze", "Das Seegrenz-Memorandum halten", t("sim2.sim.laender.7eaa1bb"), { art: "land", dim: "vertrauen", min: 50 }),
      A("lby-truppen", t("sim2.sim.laender.9dce8e7"), t("sim2.sim.laender.da984d3"), { art: "land", dim: "sicherheit", min: 50 }),
    ],
    aktionen: ["gipfel", "handel", "ruestung", "hilfe"],
  },
  {
    id: "KAZ", dat: "Kasachstan", akk: "Kasachstan", name: "Kasachstan", kurz: "KZ", gruppe: "Verbündete und Partner", iso: "KAZ", knoten: "ansehen", anteil: 0.1,
    text: t("sim2.sim.laender.dc980d3"),
    start: { handel: 55, sicherheit: 42, vertrauen: 65, konflikt: 10 }, // Teil III: Code ok, S minimal ↑ (alt 55/40/65/10)
    anliegen: [
      A("kaz-korridor", "Der Mittlere Korridor", t("sim2.sim.laender.d9a0222"), { art: "massnahme", id: "m_bahn", min: 50 }),
      A("kaz-partner", t("sim2.sim.laender.39147aa"), t("sim2.sim.laender.c1c6f9d"), { art: "land", dim: "vertrauen", min: 55 }),
    ],
    aktionen: ["gipfel", "handel", "hilfe"],
  },
  {
    id: "CYP", dat: "Zypern", akk: "Zypern", name: "Zypern", kurz: "CY", gruppe: "Nachbarn", iso: "CYP", knoten: "beziehungen_eu", anteil: 0.2,
    text: t("sim2.sim.laender.653f3d7"),
    // Teil III: V↑ minimal (Erhürman-Fenster: Norden seit 10/2025 föderationsorientiert, 5+1-Initiative bis 12/2026); alt 15/15/20/75
    start: { handel: 12, sicherheit: 15, vertrauen: 24, konflikt: 72 },
    anliegen: [
      A("cyp-hafen", t("sim2.sim.laender.3abe8b8"), t("sim2.sim.laender.571ce22"), { art: "land", dim: "vertrauen", min: 45 }),
      A("cyp-ruhe", t("sim2.sim.laender.3e0655e"), t("sim2.sim.laender.13b7d8d"), { art: "land", dim: "konflikt", max: 55 }),
    ],
    aktionen: ["gipfel", "entspannen", "druck"],
  },
];

const LAND = new Map(LAENDER.map((l) => [l.id, l]));
export const land = (id: string): LandDef => {
  const l = LAND.get(id);
  if (!l) throw new Error(`Unbekanntes Land: ${id}`);
  return l;
};

export interface AktionDef {
  id: AktionId;
  label: string;
  hinweis: string;
  pk: number;
  abkuehlung: number;
}

export const AKTIONEN: Record<AktionId, AktionDef> = {
  gipfel: { id: "gipfel", label: "Gipfeltreffen", hinweis: t("sim2.sim.laender.8570d13"), pk: 3, abkuehlung: 120 },
  handel: { id: "handel", label: "Handelsabkommen", hinweis: t("sim2.sim.laender.3917d4b"), pk: 5, abkuehlung: 180 },
  ruestung: { id: "ruestung", label: t("sim2.sim.laender.87923f2"), hinweis: t("sim2.sim.laender.198cadb"), pk: 4, abkuehlung: 150 },
  druck: { id: "druck", label: t("sim2.sim.laender.2269ff9"), hinweis: t("sim2.sim.laender.6fee07a"), pk: 2, abkuehlung: 60 },
  entspannen: { id: "entspannen", label: t("sim2.sim.laender.acdf666"), hinweis: t("sim2.sim.laender.4cf8cec"), pk: 4, abkuehlung: 120 },
  hilfe: { id: "hilfe", label: t("sim2.sim.laender.7ea86b6"), hinweis: t("sim2.sim.laender.5c0ba8a"), pk: 4, abkuehlung: 150 },
};

export interface LandZustand {
  handel: number;
  sicherheit: number;
  konflikt: number;
  /** Versatz zum Vertrauen im Politiknetz für dieses Land */
  versatz: number;
  /** Letzter Tag je Handlung (Abkühlzeit) */
  zuletzt: Partial<Record<AktionId, number>>;
  /** Kurze Erinnerung an das, was zwischen den Ländern geschah, neueste zuletzt */
  erinnerung: string[];
  /** Abgeschlossene Abkommen */
  abkommen: string[];
  /** Verträge des Verhandlungstisches (laufende und beendete) */
  vertraege?: Vertrag[];
  /** Erinnerung an gebrochene Verträge: drückt die Bewertung späterer Angebote, klingt langsam ab */
  bruch?: number;
  /** Wie viele Verträge bis zum Ende gehalten wurden */
  gehalten?: number;
  /** Bis zu diesem Tag verhandelt das Land nicht mit der Türkei (nach einer Zurückweisung) */
  sperreBis?: number;
  /**
   * Vollständige Handels-/Hafen-/Luftraumsperre der Türkei gegen dieses Land: blockiert die Handlung „Handelsabkommen“
   * und die Handels-Klauseln am Verhandlungstisch (SPERRE_KLAUSELN in data/abkommen.ts), bis ein Vertrag mit der Klausel
   * „ende_sperre“ geschlossen wird. Stand 30.09.2026 nur Israel (Sperre seit 02.05.2024, verschärft 02/2026;
   * RECHERCHE_REALWELT_LAENDERDOSSIERS.md, Dossier 13 und Teil V §5.1 Nr. 2).
   */
  handelssperre?: boolean;
  /** Tag der letzten Eigeninitiative dieses Landes (Abkühlung, sim/initiative.ts); fehlt in älteren Spielständen */
  initiativeZuletzt?: number;
  /** Tag, an dem eine Rote Linie dieses Landes zuletzt bedroht wurde (Veto am Verhandlungstisch, sim/abkommen.ts); fehlt in älteren Spielständen */
  rotBedroht?: number;
  /** Konflikt-Anker aus Verträgen, Kurs der Führung und Sanktionen (sim/diplomatie.ts): Ziel des Konfliktwerts ohne Ereignisse, relativ zum Startwert */
  anker?: number;
}

/**
 * Zum Spielstart (Tag 0 = 05.06.2028) bereits bestehende Verträge des Verhandlungstisches.
 * Mekka-Beistandspakt vom 07.08.2026 (Saudi-Arabien + Türkei + Pakistan, mit Kollektivverteidigungsklausel):
 * die Klausel „beistand“ läuft bei SAU bereits und wird am Verhandlungstisch nicht doppelt angeboten
 * (klauselnFuer sperrt Klauseln aus laufenden Verträgen). (RECHERCHE_REALWELT_LAENDERDOSSIERS.md, Dossier 12, Teil V §5.1 Nr. 3)
 */
const MEKKA_PAKT_SEIT = -668; // 07.08.2026 relativ zum Spielstart 05.06.2028
const START_VERTRAEGE: Record<string, (tag: number) => Vertrag[]> = {
  SAU: (tag) => [
    {
      id: "v-SAU-mekka-2026", land: "SAU", gibt: ["beistand"], will: [], jahre: 10,
      seit: tag + MEKKA_PAKT_SEIT, ablauf: tag + MEKKA_PAKT_SEIT + 3653, status: "laeuft",
      verstoesse: 0, letztePruefung: tag + MEKKA_PAKT_SEIT,
    },
  ],
};

/** Abkommen-Einträge, die zum Spielstart bereits bestehen (Anzeige im Ländersteckbrief). */
const START_ABKOMMEN: Record<string, string[]> = {
  SAU: [t("sim2.sim.laender.e18f829")],
};

/** Die Felder eines Landes zu Spielstart, inklusive der bereits bestehenden Fakten (Quellen je Kommentar oben). */
function startFelder(w: World, l: LandDef): Omit<LandZustand, "versatz"> {
  const vertraege = START_VERTRAEGE[l.id]?.(w.day);
  return {
    handel: l.start.handel,
    sicherheit: l.start.sicherheit,
    konflikt: l.start.konflikt,
    zuletzt: {},
    erinnerung: [],
    abkommen: [...(START_ABKOMMEN[l.id] ?? [])],
    // Israel: Handels-, Hafen- und Luftraumsperre seit 02.05.2024 in Kraft (verschärft 02/2026) — Quelle s. Feld oben
    ...(l.id === "ISR" ? { handelssperre: true } : {}),
    ...(vertraege ? { vertraege } : {}),
  };
}

export function weltZustand(w: World): Record<string, LandZustand> {
  const spiel = w.spiel!;
  if (!spiel.welt) {
    spiel.welt = {};
    for (const l of LAENDER) {
      const knoten = startAverage(NET, w.net, l.knoten);
      spiel.welt[l.id] = { ...startFelder(w, l), versatz: clamp(l.start.vertrauen - knoten, -45, 45) };
    }
  }
  // Fehlt ein Land in einem älteren Spielstand ganz, wird es mit den Startwerten ergänzt (Fakten zum Spielstart inbegriffen)
  for (const l of LAENDER) spiel.welt[l.id] ??= { ...startFelder(w, l), versatz: 0 };
  return spiel.welt;
}

/** Das Vertrauen eines Landes: das Vertrauen im Politiknetz plus der Versatz für dieses Land. */
export function vertrauenZu(w: World, id: string): number {
  const l = land(id);
  const z = weltZustand(w)[id]!;
  return clamp(nationalAverage(NET, w.net, l.knoten) + z.versatz, 0, 100);
}

export function dimensionZu(w: World, id: string, dim: Dimension): number {
  const z = weltZustand(w)[id]!;
  return dim === "vertrauen" ? vertrauenZu(w, id) : z[dim];
}

export function haltungWort(w: World, id: string): string {
  const v = vertrauenZu(w, id);
  const k = weltZustand(w)[id]!.konflikt;
  if (v >= 75) return "enger Partner";
  if (v >= 55 && k < 50) return "Partner";
  if (v >= 40) return k >= 60 ? "angespannt" : "nüchtern";
  if (v >= 25) return "kühl";
  return "feindselig";
}

export interface AnliegenStand {
  anliegen: Anliegen;
  erfuellt: boolean;
  text: string;
  fortschritt: number;
}

export function anliegenStand(w: World, id: string): AnliegenStand[] {
  return land(id).anliegen.map((a) => {
    const b = a.bedingung;
    if (b.art === "land") {
      const jetzt = dimensionZu(w, id, b.dim);
      const namen: Record<Dimension, string> = { handel: "Handel", sicherheit: "Sicherheit", vertrauen: "Vertrauen", konflikt: "Konflikt" };
      const ok = (b.min === undefined || jetzt >= b.min) && (b.max === undefined || jetzt <= b.max);
      return { anliegen: a, erfuellt: ok, text: t("sim2.sim.laender.a07d8e3", { p0: namen[b.dim], p1: b.min !== undefined ? `mindestens ${b.min}` : `höchstens ${b.max}`, p2: Math.round(jetzt) }), fortschritt: ok ? 1 : 0.4 };
    }
    const s = pruefeBedingung(w, b);
    return { anliegen: a, erfuellt: s.erfuellt, text: s.text, fortschritt: s.fortschritt };
  });
}

export interface AktionSicht {
  aktion: AktionDef;
  moeglich: boolean;
  grund?: string;
}

export function aktionenFuer(w: World, id: string): AktionSicht[] {
  const l = land(id);
  const z = weltZustand(w)[id]!;
  const spiel = w.spiel!;
  return l.aktionen.map((a) => {
    const def = AKTIONEN[a];
    const rest = (z.zuletzt[a] ?? -1e9) + def.abkuehlung - w.day;
    let grund: string | undefined;
    if (rest > 0) grund = t("sim2.sim.laender.66c2b2d", { p0: rest });
    else if (!kannZahlen(spiel.kapital, def.pk)) grund = t("sim2.sim.laender.2d06e23");
    // Solange eine Handelssperre gilt (Stand 30.09.2026: Israel), ist ein Handelsabkommen erst nach ihrem Ende per Vertrag möglich
    else if (a === "handel" && z.handelssperre) grund = t("sim2.sim.laender.0b7ee04");
    else if (a === "handel" && vertrauenZu(w, id) < 40) grund = t("sim2.sim.laender.3df5b43");
    else if (a === "ruestung" && z.sicherheit < 35) grund = t("sim2.sim.laender.3ac8acc");
    else if (a === "entspannen" && z.konflikt < 30) grund = t("sim2.sim.laender.e98fc41");
    else if (a === "gipfel" && z.konflikt >= 80) grund = t("sim2.sim.laender.3aaa86a");
    else if (a === "gipfel" && vertrauenZu(w, id) >= 82) grund = t("sim2.sim.laender.8a2a1d2");
    else if (a === "hilfe" && z.handel >= 88 && vertrauenZu(w, id) >= 82) grund = t("sim2.sim.laender.963b148");
    return { aktion: def, moeglich: !grund, ...(grund ? { grund } : {}) };
  });
}

/** Wirkung auf ein Land: Dimension und Netzknoten zugleich, damit beides eine Wirklichkeit bleibt. */
export function landAendern(w: World, id: string, delta: Partial<Record<Dimension, number>>, notiz?: string): void {
  const l = land(id);
  const z = weltZustand(w)[id]!;
  // Abnehmender Ertrag: Wer schon nah an 100 ist, gewinnt mit jeder Geste weniger; Verluste kommen ungebremst
  const ertrag = (dim: Dimension, d: number): number => (d > 0 ? d * clamp((100 - dimensionZu(w, id, dim)) / 55, 0.1, 1.2) : d);
  if (delta.handel) delta = { ...delta, handel: ertrag("handel", delta.handel) };
  if (delta.sicherheit) delta = { ...delta, sicherheit: ertrag("sicherheit", delta.sicherheit) };
  if (delta.vertrauen) delta = { ...delta, vertrauen: ertrag("vertrauen", delta.vertrauen) };
  if (delta.handel) z.handel = clamp(z.handel + delta.handel, 0, 100);
  if (delta.sicherheit) z.sicherheit = clamp(z.sicherheit + delta.sicherheit, 0, 100);
  if (delta.konflikt) z.konflikt = clamp(z.konflikt + delta.konflikt, 0, 100);
  if (delta.vertrauen) {
    z.versatz = clamp(z.versatz + delta.vertrauen * 0.6, -60, 60);
    wirke(w, l.knoten, delta.vertrauen * 0.4 * l.anteil);
  }
    if (notiz) {
    z.erinnerung.push(`${w.date}: ${notiz}`);
    if (z.erinnerung.length > 6) z.erinnerung.shift();
  }
}

const GEGENSPIELER: Record<string, string[]> = { USA: ["RUS", "CHN"], RUS: ["USA", "UKR"], CHN: ["USA"], GRC: ["EU"], ARM: ["AZE"], AZE: ["ARM"], UKR: ["RUS"] };

export function fuehreAktionAus(w: World, id: string, aktion: AktionId): { ok: boolean; text: string; why?: string } {
  const spiel = w.spiel;
  if (!spiel) return { ok: false, text: t("sim2.sim.laender.4f623c0") };
  const l = land(id);
  const sicht = aktionenFuer(w, id).find((x) => x.aktion.id === aktion);
  if (!sicht) return { ok: false, text: t("sim2.sim.laender.b24406f") };
  if (!sicht.moeglich) return { ok: false, text: sicht.grund ?? t("sim2.sim.laender.dbc20ad") };
  const pause = neuanfangGrund(w);
  if (pause) return { ok: false, text: pause };
  const def = sicht.aktion;
  const z = weltZustand(w)[id]!;
  spiel.kapital -= def.pk;
  verbrauche(w, AUFMERKSAMKEIT_KOSTEN.landAktion[aktion], `${def.label}: ${l.name}`);
  z.zuletzt[aktion] = w.day;
  let text = "";
  let why = "";
  switch (aktion) {
    case "gipfel":
      landAendern(w, id, { vertrauen: 8, konflikt: -3 }, "Gipfeltreffen");
      wirke(w, "ansehen", 1);
      text = t("sim2.sim.laender.917859d", { p0: l.dat, p1: Math.round(vertrauenZu(w, id)) });
      why = t("sim2.sim.laender.2310288", { p0: def.pk });
      break;
    case "handel": {
      landAendern(w, id, { handel: 12, vertrauen: 3 }, "Handelsabkommen");
      wirke(w, "export", 2);
      wirke(w, "auslandskapital", 1);
      z.abkommen.push(`Handelsabkommen ${w.date.slice(0, 4)}`);
      text = t("sim2.sim.laender.36a65b4", { p0: l.dat, p1: Math.round(z.handel) });
      why = t("sim2.sim.laender.6ae7385", { p0: def.pk });
      if (id === "EU") {
        zusageAnlegen(w, { von: "EU-Kommission", text: tIn("de", "sim2.sim.laender.836ef30"), msg: msg("sim2.sim.laender.836ef30"), tage: 240, massnahme: "m_justizreform" });
        why += t("sim2.sim.laender.58b8573");
      } else if (id === "USA") {
        zusageAnlegen(w, { von: "US-Regierung", text: tIn("de", "sim2.sim.laender.2ee6296"), msg: msg("sim2.sim.laender.2ee6296"), tage: 240, massnahme: "m_verteidigung" });
        why += t("sim2.sim.laender.d30ee50");
      }
      break;
    }
    case "ruestung":
      landAendern(w, id, { sicherheit: 12, vertrauen: 4 }, t("sim2.sim.laender.87923f2"));
      wirke(w, "militaer", 2);
      w.economy.debtRatio += 0.1;
      for (const g of GEGENSPIELER[id] ?? []) landAendern(w, g, { vertrauen: -6 }, t("sim2.sim.laender.02724b5", { p0: l.dat }));
      text = t("sim2.sim.laender.be935a5", { p0: l.dat, p1: Math.round(z.sicherheit) });
      why = t("sim2.sim.laender.0e162e9", { p0: def.pk, p1: (GEGENSPIELER[id] ?? []).length ? ` ${(GEGENSPIELER[id] ?? []).map((g) => land(g).name).join(" und ")} sieht das mit Sorge.` : "" });
      break;
    case "druck":
      landAendern(w, id, { vertrauen: -8, konflikt: 6 }, t("sim2.sim.laender.2b34c0f"));
      wirke(w, "konservative", 1);
      vertrauenAendern(w, 0.5);
      text = t("sim2.sim.laender.c1ef856", { p0: l.akk });
      why = t("sim2.sim.laender.6ae7385", { p0: def.pk });
      break;
    case "entspannen":
      landAendern(w, id, { konflikt: -12, vertrauen: 4 }, t("sim2.sim.laender.a6a79e5"));
      wirke(w, "konservative", -0.5);
      text = t("sim2.sim.laender.8fdb0e9", { p0: l.dat, p1: Math.round(z.konflikt) });
      why = t("sim2.sim.laender.4a6498b", { p0: def.pk });
      break;
    case "hilfe":
      landAendern(w, id, { vertrauen: 6, handel: 8, konflikt: -4 }, t("sim2.sim.laender.7ea86b6"));
      w.economy.debtRatio += 0.1;
      wirke(w, "bauwirtschaft", 1);
      text = t("sim2.sim.laender.40182d6", { p0: l.akk, p1: Math.round(vertrauenZu(w, id)) });
      why = t("sim2.sim.laender.56d3387", { p0: def.pk });
      break;
  }
  addLog(w, "entscheidung", text, why);
  return { ok: true, text, why };
}

/**
 * Haken für das Weltmodell (sim/welt-modell.ts): Es registriert sich beim Laden und läuft am Ende jedes Monatsschritts der Länder.
 * Kein Direktimport, damit kein Ladezyklus laender ↔ welt-modell entsteht; ohne Registrierung (isolierte Tests) läuft nur der Teil unten.
 */
let weltHaken: ((w: World) => void) | undefined;
export function setzeWeltHaken(f: (w: World) => void): void {
  weltHaken = f;
}

/** Einmal im Monat: Konflikte kühlen ab oder schwelen; zufriedene Länder werden warm. */
export function weltMonat(w: World): void {
  if (!w.spiel) return;
  const z = weltZustand(w);
  for (const l of LAENDER) {
    const s = z[l.id]!;
    const ziel = clamp(l.start.konflikt + (s.anker ?? 0), 0, 100);
    s.konflikt = clamp(s.konflikt + Math.sign(ziel - s.konflikt) * Math.min(1, Math.abs(ziel - s.konflikt)), 0, 100);
    const stand = anliegenStand(w, l.id);
    const erfuellt = stand.filter((x) => x.erfuellt).length;
    if (erfuellt === stand.length) s.versatz = clamp(s.versatz + 0.8, -60, 60);
    else if (erfuellt === 0) s.versatz = clamp(s.versatz - 0.3, -60, 60);
  }
  weltHaken?.(w);
}
