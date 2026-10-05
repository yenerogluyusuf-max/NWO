// Blöcke und Institutionen der Welt: EU, NATO, BRICS, Schanghaier Organisation (SOZ), Organisation der Turkstaaten, G20, Golfstaaten und der
// Beistandspakt von Mekka. Mitglieder stehen nur, soweit sie im Spiel als Akteure vorkommen; die Zahl der übrigen Mitglieder steht dabei.
//
// Regel des Projekts: Quelle oder Lücke. Die Mitgliedschaften sind öffentlich bekannte Tatsachen (Stand der Mitgliederlisten 2025/26);
// wo der Status offen ist (Saudi-Arabien bei den BRICS, die Türkei bei den BRICS), steht es so da.

export type TuerkeiStatus = "mitglied" | "kandidat" | "partner" | "dialog" | "beobachter" | "keiner";

export const STATUS_NAME: Record<TuerkeiStatus, string> = {
  mitglied: "Mitglied",
  kandidat: "Beitrittskandidat (Gespräche eingefroren)",
  partner: "Partnerland",
  dialog: "Dialogpartner",
  beobachter: "Beobachter",
  keiner: "kein Status",
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
    id: "eu", name: "Europäische Union", kurz: "EU", weitereMitglieder: 14, tuerkei: "kandidat", beschluss: "einstimmig",
    mitglieder: ["DEU", "FRA", "ITA", "ESP", "POL", "NLD", "GRC", "CYP", "BGR", "HUN", "ROU", "AUT", "SWE"],
    text: "27 Mitgliedstaaten. Über die Eröffnung von Beitrittskapiteln entscheidet der Rat einstimmig; ein Handelsmandat wie das Zollunion-Update braucht eine qualifizierte Mehrheit. Die Kommission verhandelt, die Staaten entscheiden.",
    tuerkeiText: "Beitrittskandidat seit 1999, Verhandlungen seit 2018 faktisch eingefroren; die Zollunion besteht seit 1995.",
    quelle: "Dossier 2; Verträge der EU",
  },
  {
    id: "nato", name: "Nordatlantikpakt", kurz: "NATO", weitereMitglieder: 18, tuerkei: "mitglied", beschluss: "konsens",
    mitglieder: ["USA", "DEU", "FRA", "ITA", "ESP", "POL", "NLD", "GRC", "BGR", "HUN", "ROU", "SWE", "GBR"],
    text: "32 Mitglieder; Beschlüsse im Konsens, also mit dem Einverständnis jedes Mitglieds. Die Türkei ist seit 1952 dabei und stellt die zweitgrößte Armee des Bündnisses.",
    tuerkeiText: "Mitglied seit 1952; Gastgeber des Gipfels im Juli 2026 in Ankara (Dossier 1).",
    quelle: "Dossier 1; Nordatlantikvertrag",
  },
  {
    id: "brics", name: "BRICS", kurz: "BRICS", weitereMitglieder: 0, tuerkei: "keiner", beschluss: "konsens",
    mitglieder: ["BRA", "RUS", "IND", "CHN", "ZAF", "EGY", "ETH", "IRN", "ARE", "IDN"],
    partner: ["KAZ", "UZB"],
    text: "Zehn Mitglieder (seit 2024/25 mit Ägypten, Äthiopien, Iran, den Emiraten und Indonesien) und eine Reihe von Partnerländern. Saudi-Arabien ist eingeladen, sein Status ist offen. Die BRICS entscheiden im Konsens und sind kein Bündnis, aber ein Gegengewicht zu den westlichen Foren.",
    tuerkeiText: "Die Türkei hat ein Partnerland-Angebot, aber keinen Status. Ein Antrag kostet Rückhalt in NATO und EU und bringt Märkte und Finanzierung im Süden.",
    quelle: "BRICS-Gipfelerklärungen 2023–2025",
  },
  {
    id: "sco", name: "Schanghaier Organisation für Zusammenarbeit (SOZ)", kurz: "SOZ", weitereMitglieder: 3, tuerkei: "dialog", beschluss: "konsens",
    mitglieder: ["CHN", "RUS", "IND", "PAK", "IRN", "KAZ", "KGZ", "UZB"],
    partner: ["TUR", "EGY", "SAU", "ARE", "QAT", "ARM", "AZE"],
    text: "Sicherheits- und Wirtschaftsorganisation Eurasiens; Beschlüsse im Konsens. Die Türkei ist Dialogpartner (seit 2012) und bleibt zugleich NATO-Mitglied.",
    tuerkeiText: "Dialogpartner seit 2012; Gespräche über eine Vollmitgliedschaft gibt es nicht (Dossier B2).",
    quelle: "Dossier B2 (China); Mitgliederliste der SOZ",
  },
  {
    id: "ots", name: "Organisation der Turkstaaten", kurz: "Turkstaaten", weitereMitglieder: 0, tuerkei: "mitglied", beschluss: "konsens",
    mitglieder: ["AZE", "KAZ", "KGZ", "UZB"], beobachter: ["HUN", "TKM"],
    text: "Zusammenschluss der Turkstaaten Zentralasiens und des Kaukasus mit der Türkei; Beobachter sind Ungarn und Turkmenistan. Gipfel und Fachminister treffen Absprachen im Konsens; der Mittlere Korridor ist das Kernprojekt.",
    tuerkeiText: "Gründungsmitglied (2009) und Sitz des Sekretariats in Istanbul.",
    quelle: "Dossiers 10, 16",
  },
  {
    id: "g20", name: "G20", kurz: "G20", weitereMitglieder: 8, tuerkei: "mitglied", beschluss: "keine",
    mitglieder: ["USA", "EU", "DEU", "FRA", "ITA", "GBR", "RUS", "CHN", "IND", "BRA", "ZAF", "IDN", "SAU"],
    text: "Forum der großen Volkswirtschaften ohne bindende Beschlüsse: Abschlusserklärungen im Konsens, Wirkung über Politikabstimmung und Prestige.",
    tuerkeiText: "Gründungsmitglied (1999); die Rolle als Vermittler zwischen Ost und West stärkt hier das Ansehen.",
    quelle: "Mitgliederliste der G20",
  },
  {
    id: "golf", name: "Golfstaaten (Golf-Kooperationsrat)", kurz: "Golf", weitereMitglieder: 3, tuerkei: "partner", beschluss: "einstimmig",
    mitglieder: ["SAU", "ARE", "QAT"],
    text: "Sechs Monarchien am Golf; der Kooperationsrat entscheidet einstimmig. Der Streit zwischen Saudi-Arabien und den Emiraten (Dossier Teil IV B2) spaltet den Block; die Türkei pflegt beide Kanäle.",
    tuerkeiText: "Strategische Partnerschaft mit dem Rat (seit 2008); Militärbasis in Katar.",
    quelle: "Dossiers 12, B4; Teil IV B2",
  },
  {
    id: "mekka", name: "Beistandspakt von Mekka", kurz: "Mekka-Pakt", weitereMitglieder: 0, tuerkei: "mitglied", beschluss: "konsens",
    mitglieder: ["SAU", "PAK"],
    text: "Beistandspakt vom 7. August 2026 zwischen Saudi-Arabien, Pakistan und der Türkei mit Kollektivverteidigungsklausel (Dossier 12). Der Angriff auf einen gilt als Angriff auf alle.",
    tuerkeiText: "Gründungsmitglied; die Klausel steht in der Beziehung zu Saudi-Arabien als laufender Vertrag.",
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
  { id: "gross", label: "Große Mächte", ids: [...hauptGross, "IND", "BRA", "GBR"] },
  { id: "eu", label: "EU-Staaten", ids: ["EU", ...(INSTITUTIONEN.find((i) => i.id === "eu")?.mitglieder ?? [])] },
  { id: "brics", label: "BRICS", ids: [...(INSTITUTIONEN.find((i) => i.id === "brics")?.mitglieder ?? []), ...(INSTITUTIONEN.find((i) => i.id === "brics")?.partner ?? [])] },
  { id: "golf", label: "Golf", ids: ["SAU", "ARE", "QAT", "PAK", "EGY"] },
  { id: "turk", label: "Turkstaaten", ids: ["AZE", "KAZ", "UZB", "KGZ", "TKM", "HUN"] },
  { id: "nato", label: "NATO", ids: (INSTITUTIONEN.find((i) => i.id === "nato")?.mitglieder ?? []) },
];
