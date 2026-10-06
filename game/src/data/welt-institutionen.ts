import { t } from "../i18n";
// Blöcke und Institutionen der Welt: EU, NATO, BRICS, Schanghaier Organisation (SOZ), Organisation der Turkstaaten, G20, Golfstaaten und der
// Beistandspakt von Mekka. Mitglieder stehen nur, soweit sie im Spiel als Akteure vorkommen; die Zahl der übrigen Mitglieder steht dabei.
//
// Regel des Projekts: Quelle oder Lücke. Die Mitgliedschaften sind öffentlich bekannte Tatsachen (Stand der Mitgliederlisten 2025/26);
// wo der Status offen ist (Saudi-Arabien bei den BRICS, die Türkei bei den BRICS), steht es so da.

export type TuerkeiStatus = "mitglied" | "kandidat" | "partner" | "dialog" | "beobachter" | "keiner";

export const STATUS_NAME: Record<TuerkeiStatus, string> = {
  mitglied: "Mitglied",
  kandidat: t("sim2.data.welt-institutionen.ddbfc16"),
  partner: "Partnerland",
  dialog: "Dialogpartner",
  beobachter: "Beobachter",
  keiner: t("sim2.data.welt-institutionen.44fd9cc"),
};

export type Beschlussregel = "einstimmig" | "mehrheit" | "konsens" | "keine";

export interface InstitutionDef {
  id: string;
  name: string;
  kurz: string;
  text: string;
  mitglieder: string[];
  partner?: string[];
  beobachter?: string[];
  /** Mitglieder, die im Spiel keine eigenen Akteure sind */
  weitereMitglieder: number;
  tuerkei: TuerkeiStatus;
  beschluss: Beschlussregel;
  /** Was die Türkei dort vertritt oder wo sie steht, in einem Satz */
  tuerkeiText: string;
  quelle: string;
}

export const INSTITUTIONEN: InstitutionDef[] = [
  {
    id: "eu", name: t("sim2.data.welt-institutionen.c24fb50"), kurz: "EU", weitereMitglieder: 14, tuerkei: "kandidat", beschluss: "einstimmig",
    mitglieder: ["DEU", "FRA", "ITA", "ESP", "POL", "NLD", "GRC", "CYP", "BGR", "HUN", "ROU", "AUT", "SWE"],
    text: t("sim2.data.welt-institutionen.5c3e07e"),
    tuerkeiText: t("sim2.data.welt-institutionen.7e61d16"),
    quelle: "Dossier 2; Verträge der EU",
  },
  {
    id: "nato", name: "Nordatlantikpakt", kurz: "NATO", weitereMitglieder: 18, tuerkei: "mitglied", beschluss: "konsens",
    mitglieder: ["USA", "DEU", "FRA", "ITA", "ESP", "POL", "NLD", "GRC", "BGR", "HUN", "ROU", "SWE", "GBR"],
    text: t("sim2.data.welt-institutionen.eaad30f"),
    tuerkeiText: t("sim2.data.welt-institutionen.f461d57"),
    quelle: "Dossier 1; Nordatlantikvertrag",
  },
  {
    id: "brics", name: "BRICS", kurz: "BRICS", weitereMitglieder: 0, tuerkei: "keiner", beschluss: "konsens",
    mitglieder: ["BRA", "RUS", "IND", "CHN", "ZAF", "EGY", "ETH", "IRN", "ARE", "IDN"],
    partner: ["KAZ", "UZB"],
    text: t("sim2.data.welt-institutionen.1d1a767"),
    tuerkeiText: t("sim2.data.welt-institutionen.51b0398"),
    quelle: "BRICS-Gipfelerklärungen 2023–2025",
  },
  {
    id: "sco", name: t("sim2.data.welt-institutionen.af45aa4"), kurz: "SOZ", weitereMitglieder: 3, tuerkei: "dialog", beschluss: "konsens",
    mitglieder: ["CHN", "RUS", "IND", "PAK", "IRN", "KAZ", "KGZ", "UZB"],
    partner: ["TUR", "EGY", "SAU", "ARE", "QAT", "ARM", "AZE"],
    text: t("sim2.data.welt-institutionen.9ecff07"),
    tuerkeiText: t("sim2.data.welt-institutionen.5b2f90d"),
    quelle: "Dossier B2 (China); Mitgliederliste der SOZ",
  },
  {
    id: "ots", name: t("sim2.data.welt-institutionen.b82e46a"), kurz: "Turkstaaten", weitereMitglieder: 0, tuerkei: "mitglied", beschluss: "konsens",
    mitglieder: ["AZE", "KAZ", "KGZ", "UZB"], beobachter: ["HUN", "TKM"],
    text: t("sim2.data.welt-institutionen.a190fd9"),
    tuerkeiText: t("sim2.data.welt-institutionen.6d551af"),
    quelle: "Dossiers 10, 16",
  },
  {
    id: "g20", name: "G20", kurz: "G20", weitereMitglieder: 8, tuerkei: "mitglied", beschluss: "keine",
    mitglieder: ["USA", "EU", "DEU", "FRA", "ITA", "GBR", "RUS", "CHN", "IND", "BRA", "ZAF", "IDN", "SAU"],
    text: t("sim2.data.welt-institutionen.41c890c"),
    tuerkeiText: t("sim2.data.welt-institutionen.032a595"),
    quelle: "Mitgliederliste der G20",
  },
  {
    id: "golf", name: "Golfstaaten (Golf-Kooperationsrat)", kurz: "Golf", weitereMitglieder: 3, tuerkei: "partner", beschluss: "einstimmig",
    mitglieder: ["SAU", "ARE", "QAT"],
    text: t("sim2.data.welt-institutionen.d0317a7"),
    tuerkeiText: t("sim2.data.welt-institutionen.f695892"),
    quelle: "Dossiers 12, B4; Teil IV B2",
  },
  {
    id: "mekka", name: t("sim2.data.welt-institutionen.0d2f816"), kurz: "Mekka-Pakt", weitereMitglieder: 0, tuerkei: "mitglied", beschluss: "konsens",
    mitglieder: ["SAU", "PAK"],
    text: t("sim2.data.welt-institutionen.467dfd0"),
    tuerkeiText: t("sim2.data.welt-institutionen.7b3d064"),
    quelle: "Dossier 12; sim/laender.ts START_VERTRAEGE",
  },
];

export const INSTITUTION_NACH_ID = new Map(INSTITUTIONEN.map((i) => [i.id, i]));

/** Mitgliedschaften eines Akteurs: Mitglied, Partner oder Beobachter in welchen Institutionen. */
export function mitgliedschaften(id: string): { institution: InstitutionDef; rolle: "mitglied" | "partner" | "beobachter" }[] {
  const out: { institution: InstitutionDef; rolle: "mitglied" | "partner" | "beobachter" }[] = [];
  for (const i of INSTITUTIONEN) {
    if (i.mitglieder.includes(id)) out.push({ institution: i, rolle: "mitglied" });
    else if (i.partner?.includes(id)) out.push({ institution: i, rolle: "partner" });
    else if (i.beobachter?.includes(id)) out.push({ institution: i, rolle: "beobachter" });
  }
  return out;
}

/** Die Bildschirmgruppen der Länderansicht: ein Filter je Gruppe über die Kennungen der Akteure. */
export interface GruppenFilter {
  id: string;
  label: string;
  /** Kennungen der Akteure; leer = alle */
  ids: string[] | null;
}

const hauptNachbarn = ["GRC", "IRN", "SYR", "IRQ", "ARM", "ISR", "UKR", "GEO", "CYP"];
const hauptGross = ["USA", "EU", "RUS", "CHN"];

export const GRUPPEN_FILTER: GruppenFilter[] = [
  { id: "alle", label: "Alle", ids: null },
  { id: "nachbarn", label: "Nachbarn", ids: [...hauptNachbarn, "BGR", "AZE"] },
  { id: "gross", label: t("sim2.data.welt-institutionen.36d8358"), ids: [...hauptGross, "IND", "BRA", "GBR"] },
  { id: "eu", label: "EU-Staaten", ids: ["EU", ...(INSTITUTIONEN.find((i) => i.id === "eu")?.mitglieder ?? [])] },
  { id: "brics", label: "BRICS", ids: [...(INSTITUTIONEN.find((i) => i.id === "brics")?.mitglieder ?? []), ...(INSTITUTIONEN.find((i) => i.id === "brics")?.partner ?? [])] },
  { id: "golf", label: "Golf", ids: ["SAU", "ARE", "QAT", "PAK", "EGY"] },
  { id: "turk", label: "Turkstaaten", ids: ["AZE", "KAZ", "UZB", "KGZ", "TKM", "HUN"] },
  { id: "nato", label: "NATO", ids: (INSTITUTIONEN.find((i) => i.id === "nato")?.mitglieder ?? []) },
];
