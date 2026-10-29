// Freie Großprojekte (INF-4, Entscheidung Block I; GRO-01/02 in PLANERWEITERUNG.md; GROSSPROJEKTE.md).
// Der Spieler tippt ein beliebiges Vorhaben („größter Hafen der Welt", „Autobahn bis China").
// Ein regelbasierter Interpreter zerlegt die Eingabe in Typ, Ort/Strecke, Maßstab und Merkmale — KEIN
// KI-Zwang; das Sprachmodell bleibt optional über die bestehende Chat-Aktionsstruktur (RECHERCHE_VERTIEFUNG_SYNTHESE.md, KI-3).
// Die Schätzung folgt dem 3-Ebenen-Modell: direkte Effekte, Zweitrundeneffekte (Gravitation −0,8…−1,1,
// Agglomeration +3–8 %, Verkehrsillusion 25–60 %) und politische Folgen (Kostenüberschreitung je Typ,
// Korruption, Verlierer). Grenzübertritte werden zur Bagdadbahn-Verhandlungsserie am Verhandlungstisch.
// Alle Zahlen sind Spielparameter (Platzhalter der Kalibrierung), keine Tatsachenbehauptungen.

import { NET } from "./modell";
import { PROVINZEN } from "./regional";
import { LAENDER, land, type Dimension } from "./laender";
import { VERMITTLUNGEN, klauselnFuer, verhandle as verhandleVertrag, vermittlungen } from "./abkommen";
import type { Angebot } from "./abkommen-typen";
import { beginne, reichZustand } from "./reich";
import { addLog } from "./log";
import { Rng } from "./rng";
import { stoss, stuetze } from "../data/reich/bau";
import type { World } from "./types";
import type { Band, FreiEintrag, Massstab, ProjektTyp, Schaetzung, TransitSchritt, Vergabe, Vorhaben, WirkungsBand } from "./reich-typen";
import { MASSSTAB_NAMEN, PROJEKT_TYP_NAMEN } from "./reich-typen";

// ---------------------------------------------------------------------------
// Vorverarbeitung (deckungsgleich mit `fold` in befehle.ts; bewusst getrennt,
// damit zwischen Parser und Interpreter keine Import-Schleife entsteht)

function falte(s: string): string {
  return s
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/ı/g, "i")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const woerter = (t: string): string[] => t.split(" ").filter(Boolean);
const hatWort = (tk: string[], liste: string[]) => tk.some((w) => liste.includes(w));
const hatPrefix = (tk: string[], ...praefixe: string[]) => tk.some((t) => praefixe.some((p) => t.startsWith(p)));

// ---------------------------------------------------------------------------
// Orte (Provinzen und Regionen; deckungsgleich mit den Tabellen in befehle.ts)

const PROV_FALTE = PROVINZEN.map((p) => ({ plaka: p.plaka, name: falte(p.name), region: p.region })).sort((a, b) => b.name.length - a.name.length);

const REGION_NAMEN: Record<string, string[]> = {
  marmara: ["Marmara"],
  aegaeis: ["Ege"],
  ege: ["Ege"],
  mittelmeer: ["Akdeniz"],
  akdeniz: ["Akdeniz"],
  zentralanatolien: ["İç Anadolu"],
  schwarzmeer: ["Karadeniz"],
  karadeniz: ["Karadeniz"],
  ostanatolien: ["Doğu Anadolu"],
  suedostanatolien: ["Güneydoğu Anadolu"],
  osten: ["Doğu Anadolu", "Güneydoğu Anadolu"],
  westen: ["Marmara", "Ege"],
  suedosten: ["Güneydoğu Anadolu"],
  norden: ["Karadeniz"],
  sueden: ["Akdeniz", "Güneydoğu Anadolu"],
};

const REGION_TITEL: Record<string, string> = {
  Marmara: "Marmara",
  Ege: "der Ägäis",
  Akdeniz: "dem Mittelmeer",
  "İç Anadolu": "Zentralanatolien",
  Karadeniz: "dem Schwarzen Meer",
  "Doğu Anadolu": "Ostanatolien",
  "Güneydoğu Anadolu": "Südostanatolien",
};

/** Küstenprovinzen (Kfz-Kennziffern) — Häfen brauchen eine davon, und ihre Rivalen liegen hier. */
const KUESTE = new Set([1, 7, 8, 9, 10, 17, 22, 31, 33, 34, 35, 39, 41, 48, 52, 53, 55, 57, 59, 61, 67, 74, 77, 81]);

function orteAusText(t: string): { provinzen: number[]; region: string | null } {
  const gefunden = new Set<number>();
  let region: string | null = null;
  for (const p of PROV_FALTE) {
    if (new RegExp(`(^| )${p.name}( |$)`).test(t)) gefunden.add(p.plaka);
  }
  for (const [wort, regionen] of Object.entries(REGION_NAMEN)) {
    if (new RegExp(`(^| )(im |in |am |der |den )?${wort}( |$)`).test(t) && !(wort === "osten" && gefunden.size)) {
      region = regionen[0]!;
      for (const p of PROVINZEN) if (regionen.includes(p.region)) gefunden.add(p.plaka);
    }
  }
  return { provinzen: [...gefunden].sort((a, b) => a - b), region };
}

// ---------------------------------------------------------------------------
// Länder (für Grenzübertritte)

const LAND_ALIAS: Record<string, string> = {
  usa: "USA", amerika: "USA", washington: "USA",
  eu: "EU", europa: "EU", bruessel: "EU",
  russland: "RUS", moskau: "RUS",
  china: "CHN", peking: "CHN",
  aserbaidschan: "AZE", baku: "AZE",
  armenien: "ARM", eriwan: "ARM",
  georgien: "GEO", tiflis: "GEO",
  griechenland: "GRC", athen: "GRC",
  iran: "IRN", teheran: "IRN",
  syrien: "SYR", damaskus: "SYR",
  irak: "IRQ", bagdad: "IRQ",
  israel: "ISR", jerusalem: "ISR",
  ukraine: "UKR", kiew: "UKR",
  aegypten: "EGY", kairo: "EGY",
  saudi: "SAU", riad: "SAU",
  kasachstan: "KAZ", astana: "KAZ",
  libyen: "LBY", tripolis: "LBY",
  zypern: "CYP", nikosia: "CYP",
};

/** Korridor-Schätzungen: Genanntes Ziel → vermutete Zwischenländer (Reihenfolge). Spielparameter, keine Geografie-Behauptung. */
const KORRIDORE: Record<string, string[]> = {
  CHN: ["GEO", "AZE", "KAZ", "CHN"],
  KAZ: ["GEO", "AZE", "KAZ"],
  EGY: ["ISR", "EGY"],
  LBY: ["ISR", "EGY", "LBY"],
  SAU: ["SYR", "IRQ", "SAU"],
};

function laenderAusText(t: string, tk: string[]): string[] {
  const out: string[] = [];
  for (const w of tk) {
    const id = LAND_ALIAS[w];
    if (id && !out.includes(id)) out.push(id);
  }
  // Mehrwort-Namen der Länder („Vereinigte Staaten“) über den Fließtext
  for (const l of LAENDER) {
    const f = falte(l.name);
    if (f.length >= 6 && new RegExp(`(^| )${f}( |$)`).test(t) && !out.includes(l.id)) out.push(l.id);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Der Interpreter

const TYP_WOERTER: [ProjektTyp, string[]][] = [
  ["schiene", ["bahn", "eisenbahn", "schiene", "schienen", "gleis", "gleise", "hochgeschwindigkeit", "metro", "bagdadbahn", "transsibirien"]],
  ["strasse", ["autobahn", "autobahnen", "strasse", "fernstrasse", "schnellstrasse", "schnellweg", "highway", "bruecke", "bruecken", "tunnel"]],
  ["hafen", ["hafen", "haefen", "seehafen", "containerhafen", "tiefwasserhafen"]],
  ["flughafen", ["flughafen", "flughaefen", "airport", "flugplatz"]],
  ["kanal", ["kanal", "kanaele", "wasserstrasse", "suez"]],
  ["stadt", ["stadt", "hauptstadt", "megacity", "satellitenstadt", "planstadt", "neustadt"]],
  ["energie", ["kraftwerk", "atomkraft", "kernkraft", "reaktor", "solar", "solarpark", "windpark", "windkraft", "staudamm", "wasserkraft", "pipeline"]],
  ["prestige", ["palast", "denkmal", "monument", "statue", "weltwunder", "moschee", "riesenrad", "fernsehturm", "olympiastadion", "stadion"]],
  ["wasser", ["bewaesserung", "entsalzung", "wasserwerk", "stausee"]],
];

/** Worte, die auch ohne Maßstabsangabe ein Bauvorhaben meinen (sie haben kein Maßnahmen-Pendant). */
const EXKLUSIV_WOERTER = new Set([
  "hafen", "haefen", "seehafen", "flughafen", "airport", "kanal", "kanaele", "wasserstrasse",
  "kraftwerk", "reaktor", "atomkraft", "denkmal", "monument", "palast", "statue", "hauptstadt",
  "planstadt", "megacity", "pipeline", "weltwunder", "bagdadbahn",
]);

/** Was jenseits der Physik (und jeder Amtszeit) liegt: ehrliche Absage statt erfundener Rechnung. */
const ABSURD = ["mond", "mars", "venus", "jupiter", "weltraum", "weltall", "sonne", "atlantis", "zeitmaschine", "teleport", "schwebend", "fliegende", "unterwasser", "hohlerde", "narnia", "hogwarts", "wolkenstadt", "regenbogen"];

const BAUWORTE = ["baue", "bauen", "baut", "bau", "erricht", "erschaff", "leg", "grab", "zieh"];

function typTreffer(t: string, tk: string[]): ProjektTyp[] {
  const treffer: { typ: ProjektTyp; n: number }[] = [];
  for (const [typ, liste] of TYP_WOERTER) {
    let n = 0;
    for (const wort of liste) {
      if (new RegExp(`(^| )${wort}( |$)`).test(t)) n += 2;
      else if (wort.length >= 4 && tk.some((x) => x.length > wort.length && x.length <= wort.length + 8 && x.includes(wort))) n += 1;
    }
    if (n > 0) treffer.push({ typ, n });
  }
  const max = Math.max(0, ...treffer.map((x) => x.n));
  return treffer.filter((x) => x.n === max).map((x) => x.typ);
}

function istFriedensWunsch(t: string, tk: string[]): boolean {
  if (hatWort(tk, ["frieden", "friede", "friedensvertrag", "waffenstillstand", "friedensschluss"])) return true;
  if (hatPrefix(tk, "vermittl", "schlicht") && hatWort(tk, ["zwischen", "krieg", "streit"])) return true;
  if (hatWort(tk, ["krieg"]) && hatPrefix(tk, "beend", "stoppt", "stoppe")) return true;
  return false;
}

export interface ProjektDeutung {
  art: "projekt";
  typ: ProjektTyp;
  provinzen: number[];
  /** Länder-IDs in Streckenreihenfolge (inkl. vermuteter Zwischenländer) */
  transit: string[];
  /** davon vom Interpreter ergänzt (Korridor-Schätzung) */
  transitVermutet: string[];
  massstab: Massstab;
  merkmale: string[];
  /** Ortsangabe in Worten, so wie sie der Spieler meinte */
  ortName: string | null;
}

export type Deutung =
  | ProjektDeutung
  | { art: "rueckfrage"; frage: string }
  | { art: "absage"; grund: string; alternativ: string }
  | { art: "frieden"; paar: [string, string] | null; vermittlungId?: string };

/** Ob der Text den Interpreter überhaupt braucht (Auslöser für den Parser in befehle.ts). */
export function siehtNachGrossprojekt(text: string): boolean {
  const t = falte(text);
  const tk = woerter(t);
  if (!t) return false;
  if (hatWort(tk, ABSURD)) return true;
  if (istFriedensWunsch(t, tk)) return true;
  const typen = typTreffer(t, tk);
  if (typen.length) {
    if (hatPrefix(tk, "groesst", "hoechst", "laengst", "schnellst", "tiefst", "weltrekord", "mega", "giga", "riesig", "gewaltig", "monumental", "national", "landesweit", "kontinental", "interkontinental", "neu", "neue", "neuen", "neuer", "neues")) return true;
    if (/(bis|nach|richtung|durch) \w/.test(t) && laenderAusText(t, tk).length > 0) return true;
    if (tk.some((w) => EXKLUSIV_WOERTER.has(w))) return true;
    return false;
  }
  // „Baue etwas von X nach Y“: Bauwort plus Strecke, aber ohne Typwort → Rückfrage des Interpreters
  if (hatPrefix(tk, ...BAUWORTE) && /(von|zwischen) \w+ (nach|bis) /.test(t)) return true;
  return false;
}

/** Zerlegt eine freie Eingabe in Typ, Ort/Strecke, Maßstab und Merkmale — oder in Absage, Rückfrage, Friedens-Routing. */
export function interpretiere(text: string): Deutung {
  const t = falte(text);
  const tk = woerter(t);

  // 1. Ehrlichkeit zuerst: Unsinn bekommt eine Absage mit Begründung und Alternativweg
  const absurd = tk.find((w) => ABSURD.includes(w));
  if (absurd) {
    return {
      art: "absage",
      grund: `„${text.trim()}“ — das liegt jenseits der Physik und jenseits jeder Amtszeit. Ich rechne ehrlich nur, was eine Regierung wirklich versuchen könnte; dafür gibt es weder Baukapazität noch einen Mond, der zur Türkei gehört.`,
      alternativ: "Nah dran ist ein Prestige-Vorhaben im eigenen Land, etwa „Baue ein Denkmal in Ankara“ oder „Größte Moschee der Welt in Istanbul“ — das schätze ich gern. Auch ein Forschungsprogramm („Forschung erhöhen“) geht in diese Richtung.",
    };
  }

  // 2. Frieden ist kein Bauwerk: Routing auf die Vermittlungs-Mechanik statt auf ein Projekt
  if (istFriedensWunsch(t, tk)) {
    const laender = laenderAusText(t, tk);
    const paar: [string, string] | null = laender.length >= 2 ? [laender[0]!, laender[1]!] : null;
    const vermittlung = paar ? VERMITTLUNGEN.find((v) => (v.a === paar[0] && v.b === paar[1]) || (v.a === paar[1] && v.b === paar[0])) : undefined;
    return { art: "frieden", paar, ...(vermittlung ? { vermittlungId: vermittlung.id } : {}) };
  }

  // 3. Typ
  const typen = typTreffer(t, tk);
  if (typen.length > 1) {
    const namen = typen.map((x) => PROJEKT_TYP_NAMEN[x]).join(" oder ");
    return { art: "rueckfrage", frage: `Meinen Sie ${namen}? Nennen Sie eines davon genauer — beides zugleich schätze ich nicht, damit die Rechnung ehrlich bleibt.` };
  }
  if (typen.length === 0) {
    return { art: "rueckfrage", frage: "Was für ein Vorhaben meinen Sie: Schiene oder Straße, Hafen oder Flughafen, Kanal, Stadt, Energie, Wasser oder ein Prestigebau? Sagen Sie es in einem Satz, etwa „Baue eine Eisenbahn von Ankara nach Konya“." };
  }
  const typ = typen[0]!;

  // 4. Ort/Strecke
  const { provinzen, region } = orteAusText(t);
  if (typ === "hafen" && !provinzen.length) {
    return { art: "rueckfrage", frage: "Ein Hafen braucht einen Ort an der Küste — Mersin, İzmir, Trabzon, Hatay? Nennen Sie die Provinz, dann schätze ich das Vorhaben." };
  }
  if (typ === "hafen" && provinzen.every((p) => !KUESTE.has(p))) {
    return { art: "rueckfrage", frage: `In ${PROVINZEN[provinzen[0]! - 1]?.name ?? "der Provinz"} liegt keine Küste; ein Seehafen geht dort nicht. Meinen Sie einen Hafen an der Küste (etwa Mersin) oder eine Binnenverbindung (Schiene, Straße)?` };
  }
  if ((typ === "stadt" || typ === "kanal") && !provinzen.length) {
    return { art: "rueckfrage", frage: typ === "stadt" ? "Wo soll die neue Stadt entstehen — Zentralanatolien, im Osten, an der Küste? Der Ort entscheidet über Preis und Wirkung." : "Wo soll der Kanal verlaufen? Nennen Sie die Provinz oder das Gewässer." };
  }

  // 5. Grenzübertritt: genannte Länder, bei einem „bis <Land>“-Ziel der vermutete Korridor (Bagdadbahn-Logik)
  const genannt = laenderAusText(t, tk);
  let transit = genannt;
  let transitVermutet: string[] = [];
  const zielMuster = t.match(/(?:bis|nach|richtung) (\w+)/);
  if (genannt.length === 1 && zielMuster) {
    const ziel = LAND_ALIAS[zielMuster[1]!];
    const korridor = ziel !== undefined && ziel === genannt[0] ? KORRIDORE[ziel] : undefined;
    if (ziel && korridor) {
      transitVermutet = korridor.filter((x: string) => x !== ziel);
      transit = [...korridor];
    }
  }
  if (hatWort(tk, ["bagdadbahn"]) && !genannt.length) {
    transit = ["SYR", "IRQ"];
    transitVermutet = ["SYR", "IRQ"];
  }

  // 6. Maßstab
  const superlativ = hatPrefix(tk, "groesst", "hoechst", "laengst", "schnellst", "tiefst") || hatWort(tk, ["weltrekord"]);
  const weltWeit = /(der welt|aller zeiten|weltweit|weltgroesste)/.test(t);
  let massstab: Massstab;
  if (superlativ && weltWeit) massstab = "weltgroesste";
  else if (transit.length > 0 || hatWort(tk, ["kontinental", "interkontinental", "eurasien", "seidenstrasse"])) massstab = "kontinental";
  else if (hatWort(tk, ["national", "landesweit"]) || /(ganzes land|ganze tuerkei)/.test(t)) massstab = "national";
  else if (hatWort(tk, ["klein", "kleine", "kleiner", "kleinen", "bescheiden", "lokal"])) massstab = "klein";
  else if (provinzen.length > 0) massstab = provinzen.length > 2 ? "national" : "regional";
  else massstab = "national";

  // 7. Merkmale
  const merkmale: string[] = [];
  if (hatWort(tk, ["bruecke", "bruecken"])) merkmale.push("Brücke");
  if (hatWort(tk, ["tunnel"])) merkmale.push("Tunnel");
  if (superlativ) merkmale.push("Rekordanspruch");
  if (hatWort(tk, ["bagdadbahn"])) merkmale.push("Bagdadbahn");

  const ortName = provinzen.length
    ? provinzen.length <= 2
      ? provinzen.map((p) => PROVINZEN[p - 1]?.name ?? String(p)).join("–")
      : region
        ? (REGION_TITEL[region] ?? region)
        : `${provinzen.length} Provinzen`
    : null;

  return { art: "projekt", typ, provinzen, transit, transitVermutet, massstab, merkmale, ortName };
}

// ---------------------------------------------------------------------------
// Die Schätzung (3-Ebenen-Modell aus GROSSPROJEKTE.md §4 und PLANERWEITERUNG.md §8)

interface TypWirkung {
  knoten: string;
  /** Mittlere Verschiebung des Gleichgewichts (mit Vorzeichen) auf nationalem Maßstab */
  d: number;
}

interface TypParam {
  bau: number;
  monate: number;
  pk: number;
  schulden: number;
  verwaltung: number;
  unterhalt: number;
  /** Eintrittswahrscheinlichkeit der Kostenüberschreitung */
  ueberzugP: number;
  /** Größe der Überschreitung als Anteil der Baukosten [tief, hoch]; Schiene ~45 %, Straße ~20 %, Prestige bis ~70 % (Flyvbjerg-Kalibrierung) */
  ueberzugBand: [number, number];
  /** Verkehrsabhängig: reale Verkehre liegen bei 25–60 % der Planung (Verkehrsillusion) */
  illusion: boolean;
  bild?: Vorhaben["bild"];
  wirkung: TypWirkung[];
  /** Internationale Zweitrundeneffekte: Nachbarländer nehmen ab (Gravitation) */
  nachbarLaender?: { land: string; dim: Dimension; d: number }[];
}

const TYP_PARAM: Record<ProjektTyp, TypParam> = {
  schiene: {
    bau: 1500, monate: 40, pk: 7, schulden: 0.35, verwaltung: 2, unterhalt: 0.8,
    ueberzugP: 0.6, ueberzugBand: [0.3, 0.6], illusion: true, bild: "bahn",
    wirkung: [{ knoten: "bahnnetz", d: 5 }, { knoten: "logistik", d: 2 }, { knoten: "stau", d: -2 }, { knoten: "wachstum_regional", d: 2 }],
  },
  strasse: {
    bau: 1100, monate: 32, pk: 6, schulden: 0.3, verwaltung: 1.5, unterhalt: 0.6,
    ueberzugP: 0.45, ueberzugBand: [0.1, 0.3], illusion: true, bild: "bruecke",
    wirkung: [{ knoten: "verkehrsnetz", d: 5 }, { knoten: "logistik", d: 2 }, { knoten: "stau", d: -2.5 }, { knoten: "wachstum_regional", d: 1.5 }],
  },
  hafen: {
    bau: 1300, monate: 36, pk: 7, schulden: 0.4, verwaltung: 2, unterhalt: 0.8,
    ueberzugP: 0.5, ueberzugBand: [0.2, 0.45], illusion: true, bild: "schiff",
    wirkung: [{ knoten: "logistik", d: 5 }, { knoten: "export", d: 2.5 }, { knoten: "wachstum_regional", d: 2.5 }, { knoten: "tourismus", d: 1 }],
    nachbarLaender: [
      { land: "GRC", dim: "handel", d: -3 },
      { land: "GRC", dim: "vertrauen", d: -2 },
      { land: "GEO", dim: "handel", d: -2 },
      { land: "EGY", dim: "handel", d: -2 },
    ],
  },
  flughafen: {
    bau: 1400, monate: 34, pk: 7, schulden: 0.4, verwaltung: 2, unterhalt: 0.8,
    ueberzugP: 0.5, ueberzugBand: [0.2, 0.45], illusion: true, bild: "flughafen",
    wirkung: [{ knoten: "tourismus", d: 3 }, { knoten: "logistik", d: 3.5 }, { knoten: "export", d: 1.5 }],
  },
  kanal: {
    bau: 3200, monate: 60, pk: 12, schulden: 0.9, verwaltung: 3, unterhalt: 1.2,
    ueberzugP: 0.65, ueberzugBand: [0.3, 0.6], illusion: true, bild: "kanal",
    wirkung: [{ knoten: "logistik", d: 6 }, { knoten: "export", d: 2 }, { knoten: "ansehen", d: 1.5 }],
    nachbarLaender: [
      { land: "RUS", dim: "vertrauen", d: -4 },
      { land: "GRC", dim: "handel", d: -2 },
    ],
  },
  stadt: {
    bau: 3800, monate: 72, pk: 14, schulden: 1.2, verwaltung: 3.5, unterhalt: 1.5,
    ueberzugP: 0.55, ueberzugBand: [0.3, 0.6], illusion: false, bild: "stadt",
    wirkung: [{ knoten: "wachstum_regional", d: 6 }, { knoten: "landflucht", d: -3 }, { knoten: "mieten", d: 2.5 }, { knoten: "ungleichheit", d: 1.5 }],
  },
  energie: {
    bau: 2000, monate: 48, pk: 9, schulden: 0.7, verwaltung: 2.5, unterhalt: 1,
    ueberzugP: 0.55, ueberzugBand: [0.25, 0.55], illusion: false, bild: "reaktor",
    wirkung: [{ knoten: "stromversorgung", d: 7 }, { knoten: "energieimporte", d: -4 }, { knoten: "energiepreise", d: -2 }],
  },
  prestige: {
    bau: 900, monate: 24, pk: 8, schulden: 0.15, verwaltung: 1.5, unterhalt: 0.5,
    ueberzugP: 0.8, ueberzugBand: [0.45, 0.7], illusion: false, bild: "kuppel",
    wirkung: [{ knoten: "ansehen", d: 4 }, { knoten: "tourismus", d: 2 }, { knoten: "identitaet", d: 2.5 }],
  },
  wasser: {
    bau: 800, monate: 24, pk: 5, schulden: 0.2, verwaltung: 1, unterhalt: 0.5,
    ueberzugP: 0.4, ueberzugBand: [0.15, 0.35], illusion: false, bild: "damm",
    wirkung: [{ knoten: "wasserversorgung", d: 6 }, { knoten: "duerre", d: -4 }],
  },
  sonstig: {
    bau: 1000, monate: 30, pk: 6, schulden: 0.3, verwaltung: 1.5, unterhalt: 0.6,
    ueberzugP: 0.5, ueberzugBand: [0.2, 0.45], illusion: false,
    wirkung: [{ knoten: "ansehen", d: 2 }, { knoten: "wachstum_regional", d: 2 }],
  },
};

/** Maßstab → Faktor auf Kosten und Wirkungen (Spielparameter). */
const MASSSTAB_FAKTOR: Record<Massstab, number> = { klein: 0.35, regional: 0.7, national: 1, kontinental: 2.4, weltgroesste: 3.2 };

/** Knoten, bei denen ein höherer Wert schlecht ist (für die Färbung der Wirkungszeilen). */
const SCHLECHT_WENN_HOCH = new Set(["stau", "mieten", "ungleichheit", "energieimporte", "energiepreise", "landflucht", "duerre", "korruption"]);

const r1 = (x: number) => Math.round(x * 10) / 10;
const band = (mitte: number, tiefF: number, hochF: number): Band => {
  const m = r1(mitte);
  let t = r1(mitte * tiefF);
  let h = r1(mitte * hochF);
  if (t >= m && m > 0) t = Math.max(0, Math.round((m - 0.1) * 10) / 10);
  if (h <= m && m > 0) h = Math.round((m + 0.1) * 10) / 10;
  return { tief: t, mitte: m, hoch: h };
};
const bandText = (b: Band): string => `${b.tief.toLocaleString("de-DE")} bis ${b.hoch.toLocaleString("de-DE")}`;

const TYP_TITEL: Record<ProjektTyp, string> = {
  schiene: "Bahn", strasse: "Straße", hafen: "Hafen", flughafen: "Flughafen", kanal: "Kanal",
  stadt: "Neue Stadt", energie: "Energieprojekt", prestige: "Prestigebau", wasser: "Wasserprojekt", sonstig: "Großvorhaben",
};

const GROESSTE_TITEL: Record<ProjektTyp, string> = {
  schiene: "Längste Bahn der Welt", strasse: "Längste Straße der Welt", hafen: "Größter Hafen der Welt",
  flughafen: "Größter Flughafen der Welt", kanal: "Größter Kanal der Welt", stadt: "Größte neue Stadt der Welt",
  energie: "Größtes Kraftwerk der Welt", prestige: "Größtes Bauwerk der Welt", wasser: "Größtes Wasserprojekt der Welt", sonstig: "Größtes Vorhaben der Welt",
};

function projektName(d: ProjektDeutung): string {
  if (d.merkmale.includes("Bagdadbahn")) return "Neue Bagdadbahn";
  if (d.massstab === "weltgroesste") return GROESSTE_TITEL[d.typ];
  if (d.transit.length) return `${TYP_TITEL[d.typ]} bis ${land(d.transit[d.transit.length - 1]!).name}`;
  if (d.ortName) return `${TYP_TITEL[d.typ]} ${d.ortName}`;
  return `${TYP_TITEL[d.typ]} (landesweit)`;
}

/** Rivalen der Gravitation: Provinzen, die relativ abnehmen, weil der Ort gewinnt. */
function rivalen(d: ProjektDeutung): number[] {
  if (!d.provinzen.length) return [];
  const ziel = new Set(d.provinzen);
  if (d.typ === "hafen" || d.typ === "flughafen") {
    return PROVINZEN.filter((p) => KUESTE.has(p.plaka) && p.grossstadt && !ziel.has(p.plaka))
      .sort((a, b) => b.bevoelkerung - a.bevoelkerung)
      .slice(0, 3)
      .map((p) => p.plaka);
  }
  const nuts = new Set(d.provinzen.map((p) => PROVINZEN[p - 1]?.nuts2));
  return PROVINZEN.filter((p) => nuts.has(p.nuts2) && !ziel.has(p.plaka))
    .sort((a, b) => b.bevoelkerung - a.bevoelkerung)
    .slice(0, 3)
    .map((p) => p.plaka);
}

const knotenName = (id: string): string => NET.nodes[NET.index.get(id) ?? -1]?.name ?? id;

/** Das Schätzblatt: Kosten-, Zeit- und Wirkungsbänder, Risiken, Zweitrundeneffekte, Mentorin-Text. Rein rechnerisch, ohne Nebenwirkungen. */
export function schaetze(w: World, d: ProjektDeutung, eingabe: string): Schaetzung {
  void w; // die Schätzung liest nur Datenbestände; der Weltzustand ändert die Bänder (noch) nicht
  const p = TYP_PARAM[d.typ];
  const faktor = MASSSTAB_FAKTOR[d.massstab] + (d.massstab === "kontinental" ? 0.3 * d.transit.length : 0);
  const regional = (d.massstab === "klein" || d.massstab === "regional") && d.provinzen.length > 0;
  const ziel = regional ? d.provinzen : undefined;
  const wo = regional ? ` in ${d.provinzen.length} ${d.provinzen.length === 1 ? "Provinz" : "Provinzen"}` : "";

  const wirkungen: WirkungsBand[] = [];
  for (const x of p.wirkung) {
    // Ebene 1: direkte Effekte. Agglomeration (+3–8 % je Verdopplung der Dichte) steckt im oberen Bandende;
    // die Verkehrsillusion (25–60 % der Planung) zieht das untere Bandende bei verkehrsabhängigen Typen nach unten
    const v = r1(x.d * Math.pow(faktor, 0.75));
    if (Math.abs(v) < 0.3) continue;
    const b = band(Math.abs(v), p.illusion ? 0.5 : 0.75, 1.25);
    wirkungen.push({
      name: knotenName(x.knoten),
      richtung: x.d > 0 ? 1 : -1,
      gut: SCHLECHT_WENN_HOCH.has(x.knoten) ? x.d < 0 : x.d > 0,
      band: b,
      wert: v,
      vorlage: stuetze(x.knoten, v, ziel),
      ...(wo ? { wo } : {}),
    });
  }

  // Ebene 2: Zweitrundeneffekte. Gravitation (Elastizität −0,8…−1,1): was der neue Ort anzieht,
  // verlieren rivalisierende Orte; die Bandbreite der Wirkung ist die Bandbreite der Elastizität.
  const nachbarn: Schaetzung["nachbarn"] = [];
  const riv = rivalen(d);
  if (riv.length && (d.typ === "hafen" || d.typ === "flughafen" || d.typ === "schiene" || d.typ === "strasse" || d.typ === "kanal")) {
    const host = Math.abs(p.wirkung.find((x) => x.knoten === "wachstum_regional")?.d ?? 2) * Math.pow(faktor, 0.75);
    const v = r1(Math.max(0.4, host * 0.3));
    const namen = riv.map((x) => PROVINZEN[x - 1]?.name ?? String(x));
    wirkungen.push({
      name: `Regionale Wirtschaft (${namen.join(", ")})`,
      richtung: -1,
      gut: false,
      band: band(v, 0.8, 1.1),
      wert: -v,
      vorlage: stuetze("wachstum_regional", -v, riv),
      wo: " rivalisierende Orte",
    });
    nachbarn.push({ name: namen.join(", "), art: "provinz", text: "Verkehr wandert zum neuen Ort — die Rivalen verlieren spürbar (Gravitation −0,8…−1,1)." });
  }
  for (const n of p.nachbarLaender ?? []) {
    const v = r1(n.d * Math.pow(faktor, 0.6));
    if (Math.abs(v) < 0.4) continue;
    const dimNamen: Record<Dimension, string> = { handel: "Handel", sicherheit: "Sicherheit", vertrauen: "Vertrauen", konflikt: "Konflikt" };
    wirkungen.push({
      name: `${land(n.land).name}: ${dimNamen[n.dim]}`,
      richtung: n.d > 0 ? 1 : -1,
      gut: n.dim === "konflikt" ? n.d < 0 : n.d > 0,
      band: band(Math.abs(v), 0.6, 1.3),
      wert: v,
      vorlage: { t: "land", land: n.land, dim: n.dim, d: v },
    });
    if (!nachbarn.some((x) => x.name === land(n.land).name)) nachbarn.push({ name: land(n.land).name, art: "land", text: "Ein Korridor dieser Größe verschiebt Verkehre auch über die Grenze — Nachbarn ohne Anschluss nehmen ab und werden unzufrieden." });
  }
  if (d.transit.length) {
    for (const lId of d.transit) {
      const v = r1(1.5 * Math.pow(faktor, 0.5));
      wirkungen.push({
        name: `${land(lId).name}: Handel`,
        richtung: 1,
        gut: true,
        band: band(v, 0.5, 1.4),
        wert: v,
        vorlage: { t: "land", land: lId, dim: "handel", d: v },
      });
    }
    const ausserhalb = ["GRC", "IRN"].filter((x) => !d.transit.includes(x));
    for (const lId of ausserhalb) {
      wirkungen.push({
        name: `${land(lId).name}: Vertrauen`,
        richtung: -1,
        gut: false,
        band: band(1, 0.5, 1.5),
        wert: -1,
        vorlage: { t: "land", land: lId, dim: "vertrauen", d: -1 },
      });
    }
    nachbarn.push({ name: ausserhalb.map((x) => land(x).name).join(", "), art: "land", text: "Wer keinen Anschluss an den Korridor hat, nimmt ab — und reagiert." });
  }

  const ueberzugErwartung = (p.ueberzugBand[0] + p.ueberzugBand[1]) / 2;
  const risiken: Schaetzung["risiken"] = [
    {
      name: "Kostenüberschreitung",
      wert: `${Math.round(p.ueberzugP * 100)} % Wahrscheinlichkeit`,
      text: `Erfahrungsgemäß wird es bei solchen Vorhaben um etwa ${Math.round(ueberzugErwartung * 100)} % teurer als geplant; die Überschreitung kommt mitten im Bau, nicht am Anfang.`,
    },
    {
      name: "Korruptionsanfälligkeit",
      wert: faktor >= 2 ? "hoch" : faktor >= 1 ? "mittel" : "niedrig",
      text: "Je größer die Vergabe-Oberfläche, desto größer die Versuchung; die Stammfirma baut schneller und näher — und nährere Aufträge nähren das Risiko.",
    },
  ];
  if (p.illusion) {
    risiken.push({
      name: "Verkehrsillusion",
      wert: "25 bis 60 % der Planung",
      text: "Prognosen solcher Projekte werden optimistisch präsentiert; was wirklich fährt und läuft, liegt erfahrungsgemäß darunter — rechnen Sie mit dem unteren Bandende.",
    });
  }
  if (d.transit.length) {
    risiken.push({
      name: "Veto auf der Strecke",
      wert: `${d.transit.length} ${d.transit.length === 1 ? "Land" : "Länder"} am Tisch`,
      text: "Jedes Transitland verhandelt ein eigenes Paket; ein einziges Nein macht die Strecke tot oder den Umweg spürbar teurer (Bagdadbahn-Regel).",
    });
  }

  const transitSchritte: TransitSchritt[] = d.transit.map((lId) => ({ land: lId, name: land(lId).name, ...(d.transitVermutet.includes(lId) ? { vermutet: true } : {}) }));

  // Die Mentorin erklärt Richtung und Bandbreite — nie exakte Zahlen
  const staerkste = [...wirkungen].filter((x) => x.gut).sort((a, b) => b.band.mitte - a.band.mitte)[0];
  const mentorSaetze = [
    `Ein Vorhaben dieser Art (${PROJEKT_TYP_NAMEN[d.typ].toLowerCase()}, ${MASSSTAB_NAMEN[d.massstab]}) bindet über Jahre Baukapazität und Verwaltungskraft; was es kostet und wie lange es dauert, lässt sich ehrlich nur als Band angeben.`,
    staerkste
      ? `Es stärkt vor allem ${staerkste.name} spürbar${staerkste.wo ? ` ${staerkste.wo.trim()}` : ""}${p.illusion ? "; wie viel Verkehr wirklich kommt, liegt erfahrungsgemäß zwischen einem Viertel und gut der Hälfte der Prognose" : ""}.`
      : "Die Wirkung ist begrenzt und unsicher.",
    nachbarn.length ? "Wo Verkehr und Wachstum hinwandern, fehlen sie anderswo: Rivalen im eigenen Land und Nachbarn ohne Anschluss nehmen ab — das ist der Zweitrundeneffekt, über den später verhandelt wird." : "",
    "Überschreitungen sind bei solchen Vorhaben eher die Regel als die Ausnahme; die Wahl der Vergabe entscheidet, wie nah Korruption und loyale Firmen kommen.",
    d.transit.length ? "Über die Grenze hinaus gilt die Bagdadbahn-Regel: Jedes Land auf der Strecke sitzt mit am Tisch, und ein einziges Nein macht den Umweg teurer oder die Strecke tot." : "",
    d.massstab === "weltgroesste" ? "Ein Rekordanspruch ist ein Signal an alle Nachbarn — und die teuerste Form des Bauens, die es gibt." : "",
  ].filter(Boolean);

  return {
    eingabe,
    typ: d.typ,
    massstab: d.massstab,
    klasse: d.massstab === "weltgroesste" || d.typ === "kanal" || d.typ === "stadt" || (d.typ === "prestige" && d.massstab !== "klein" && d.massstab !== "regional") ? "wunder" : "grossprojekt",
    name: projektName(d),
    pk: band(p.pk * (0.6 + 0.4 * faktor), 0.8, 1.3),
    bau: band(p.bau * faktor, 0.85, 1 + p.ueberzugBand[1]),
    monate: band(p.monate * Math.sqrt(faktor), 0.9, 1.35),
    schulden: band(p.schulden * faktor, 0.8, 1.4),
    verwaltung: Math.max(1, Math.round(p.verwaltung)),
    unterhalt: r1(p.unterhalt * Math.min(faktor, 2)),
    wirkungen,
    risiken,
    nachbarn,
    ...(transitSchritte.length ? { transit: transitSchritte } : {}),
    ueberzugP: p.ueberzugP,
    ueberzugBand: p.ueberzugBand,
    mentor: mentorSaetze.join(" "),
  };
}

// ---------------------------------------------------------------------------
// Vom Entwurf ins Reich

function baueDef(id: string, d: ProjektDeutung, s: Schaetzung): Vorhaben {
  const abschluss: Vorhaben["abschluss"] = [];
  const dauer: Vorhaben["dauer"] = [];
  for (const wkg of s.wirkungen) {
    if (wkg.vorlage.t === "knoten") {
      abschluss.push(stoss(wkg.vorlage.id, r1(wkg.wert * 0.5), wkg.vorlage.provinzen));
      dauer.push(wkg.vorlage);
    } else if (wkg.vorlage.t === "land") {
      abschluss.push(wkg.vorlage);
    }
  }
  const kehrseite = [
    "Geschätzt, nicht festgepreist: Kosten und Dauer können im Bau steigen.",
    d.typ === "hafen" || d.typ === "kanal" ? "Nachbarhäfen und ihre Städte verlieren Verkehre — innenpolitisch wie bei den Anrainern." : "",
    d.typ === "stadt" ? "Neue Städte verteuern Wohnraum und ziehen Menschen aus alten Zentren ab." : "",
    d.typ === "schiene" || d.typ === "strasse" ? "Landwirte an der Trasse verlieren Flächen." : "",
    d.transit.length ? "Ohne die Zusage jedes Transitlandes bleibt die Strecke ein Plan." : "",
  ].filter(Boolean).join(" ");
  return {
    id,
    bereich: "infrastruktur",
    klasse: s.klasse,
    name: s.name,
    text: `Frei eingegebenes Vorhaben: „${s.eingabe}“. ${PROJEKT_TYP_NAMEN[s.typ]}, ${MASSSTAB_NAMEN[s.massstab]}${d.ortName ? `, ${d.ortName}` : ""}. Kosten, Dauer und Wirkungen sind Schätzungen aus dem 3-Ebenen-Modell.`,
    ...(d.provinzen.length ? { provinzen: d.provinzen } : {}),
    voraus: [],
    kosten: { pk: Math.round(s.pk.mitte), bau: Math.round(s.bau.mitte), monate: Math.max(1, Math.round(s.monate.mitte)), verwaltung: s.verwaltung, schulden: s.schulden.mitte },
    abschluss,
    dauer,
    unterhalt: s.unterhalt,
    kehrseite,
    ...(d.typ === "schiene" || d.typ === "strasse" || d.typ === "stadt" ? { verlierer: "landwirte" } : {}),
    einmalig: true,
    ...(TYP_PARAM[d.typ].bild ? { bild: TYP_PARAM[d.typ].bild } : {}),
    frei: true,
  };
}

export type EntwurfErgebnis = { art: "entwurf"; id: string; eintrag: FreiEintrag } | { art: "antwort"; deutung: Exclude<Deutung, ProjektDeutung> };

/** Legt ein Schätzblatt ins Reich (oder meldet Absage, Rückfrage, Friedens-Routing). Verbraucht kein Kapital — der Entwurf ist kostenlos, der Beginn nicht. */
export function entwirf(w: World, eingabe: string): EntwurfErgebnis {
  const d = interpretiere(eingabe);
  if (d.art !== "projekt") return { art: "antwort", deutung: d };
  const s = schaetze(w, d, eingabe.trim());
  const z = reichZustand(w);
  const n = Object.keys(z.frei ?? {}).length + 1;
  const id = `frei_${d.typ}_${w.day}_${n}`;
  const eintrag: FreiEintrag = {
    def: baueDef(id, d, s),
    schaetzung: s,
    stand: "entwurf",
    ...(s.transit?.length ? { transit: Object.fromEntries(s.transit.map((x) => [x.land, "offen" as const])) } : {}),
  };
  (z.frei ??= {})[id] = eintrag;
  reichZustand(w); // Registrierung der dynamischen Vorhaben-Definition synchronisieren
  addLog(w, "entscheidung", `Schätzblatt: ${s.name}`, `Frei eingegeben („${s.eingabe}“). Kosten ${bandText(s.pk)} Kapital, Bau ${bandText(s.bau)} Punkte, ${bandText(s.monate)} Monate — Bänder, keine Festpreise.`);
  return { art: "entwurf", id, eintrag };
}

/** Alle freien Vorhaben des Reichs (Entwürfe und Begonnene). */
export function freieEntwuerfe(w: World): { id: string; eintrag: FreiEintrag }[] {
  return Object.entries(reichZustand(w).frei ?? {}).map(([id, eintrag]) => ({ id, eintrag }));
}

/** Nimmt einen Entwurf an: verwirklicht die Bänder (zieht die Wirkungen im Band) und beginnt das Vorhaben mit der gewählten Vergabe. */
export function beginneFrei(w: World, id: string, vergabe: Vergabe = "ausschreibung"): { ok: boolean; text: string; why?: string } {
  const z = reichZustand(w);
  const e = z.frei?.[id];
  if (!e) return { ok: false, text: "Dieses freie Vorhaben liegt nicht vor." };
  if (e.stand === "begonnen") return { ok: false, text: `„${e.def.name}“ wurde bereits begonnen.` };
  const offen = Object.entries(e.transit ?? {}).filter(([, s]) => s === "offen");
  if (offen.length) return { ok: false, text: `Erst fehlen die Zusagen auf der Strecke: ${offen.map(([lId]) => land(lId).name).join(", ")}. Jedes Transitland und seine Durchfahrt verhandeln Sie im Schätzblatt.` };
  const veto = Object.entries(e.transit ?? {}).filter(([, s]) => s === "veto");
  if (veto.length) return { ok: false, text: `${veto.map(([lId]) => land(lId).name).join(", ")} verweigert die Durchfahrt. Wählen Sie im Schätzblatt den Umweg — oder verwerfen Sie das Vorhaben.` };

  // Die Verwirklichung: Aus den Bändern werden Zahlen — die Verkehrsillusion und die Gravitation fallen so aus, wie sie fallen
  const rng = new Rng(w.rngState);
  const abschluss: Vorhaben["abschluss"] = [];
  const dauer: Vorhaben["dauer"] = [];
  for (const wkg of e.schaetzung.wirkungen) {
    const x = r1(rng.between(wkg.band.tief, wkg.band.hoch) * Math.sign(wkg.wert || 1));
    if (wkg.vorlage.t === "knoten") {
      abschluss.push(stoss(wkg.vorlage.id, r1(x * 0.5), wkg.vorlage.provinzen));
      dauer.push(stuetze(wkg.vorlage.id, x, wkg.vorlage.provinzen));
    } else if (wkg.vorlage.t === "land") {
      abschluss.push({ t: "land", land: wkg.vorlage.land, dim: wkg.vorlage.dim, d: x });
    }
  }
  w.rngState = rng.state;
  e.def.abschluss = abschluss;
  e.def.dauer = dauer;
  e.stand = "begonnen";
  const r = beginne(w, id, vergabe);
  if (!r.ok) {
    e.stand = "entwurf";
    return r;
  }
  return { ok: true, text: r.text, ...(r.why ? { why: `${e.schaetzung.mentor} ${r.why}` } : { why: e.schaetzung.mentor }) };
}

/** Verwirft einen Entwurf; nichts war je beschlossen, also kostet es nichts. */
export function verwerfeFrei(w: World, id: string): { ok: boolean; text: string } {
  const z = reichZustand(w);
  const e = z.frei?.[id];
  if (!e) return { ok: false, text: "Dieses freie Vorhaben liegt nicht vor." };
  if (e.stand === "begonnen") return { ok: false, text: "Was läuft, lässt sich hier nicht verwerfen (pausieren Sie es in der Baureihenfolge)." };
  delete z.frei![id];
  addLog(w, "entscheidung", `Verworfen: ${e.def.name}`, "Der Entwurf ist vom Tisch; geschätzt wurde umsonst, gebaut wurde nichts.");
  return { ok: true, text: `„${e.def.name}“ ist vom Tisch.` };
}

// ---------------------------------------------------------------------------
// Bagdadbahn-Verhandlungsserie: je Transitland ein Paket am Verhandlungstisch

/** Klauseln, über die die Türkei Durchfahrt verlangen kann (je nach Profil des Landes). */
const TRANSIT_WILL = ["w_transit", "w_pipeline", "w_hafen", "w_luftraum"];

/** Das Paket für ein Transitland: die Türkei bietet seine zwei wertvollsten Klauseln und verlangt die Durchfahrt. */
export function transitPaket(w: World, landId: string): Angebot | null {
  const kl = klauselnFuer(w, landId);
  const will = TRANSIT_WILL.map((id) => kl.find((k) => k.def.id === id)).find((k) => k && !k.gesperrt && !k.rot);
  if (!will) return null;
  const gibt = kl
    .filter((k) => k.def.seite === "gibt" && !k.gesperrt && !k.rot && k.wert > 0)
    .sort((a, b) => b.wert - a.wert)
    .slice(0, 2)
    .map((k) => k.def.id);
  if (!gibt.length) return null;
  return { land: landId, gibt, will: [will.def.id], jahre: 10 };
}

/** Verhandelt mit einem Transitland über die Durchfahrt. Zusage öffnet die Strecke; ein Veto macht sie tot oder den Umweg teurer. */
export function transitVerhandeln(w: World, id: string, landId: string): { ok: boolean; text: string; why?: string } {
  const e = reichZustand(w).frei?.[id];
  if (!e) return { ok: false, text: "Dieses freie Vorhaben liegt nicht vor." };
  if (e.stand === "begonnen") return { ok: false, text: "Der Bau läuft bereits; die Verhandlungen sind Geschichte." };
  const stand = e.transit?.[landId];
  if (!stand) return { ok: false, text: `${land(landId).name} liegt nicht auf dieser Strecke.` };
  if (stand === "zusage") return { ok: false, text: `${land(landId).name} hat die Durchfahrt bereits zugesagt.` };
  if (stand === "umgangen") return { ok: false, text: `Die Strecke umgeht ${land(landId).name} bereits.` };
  if (stand === "veto") return { ok: false, text: `${land(landId).name} hat ein Veto eingelegt; übrig bleibt der Umweg.` };
  const angebot = transitPaket(w, landId);
  if (!angebot) {
    e.transit![landId] = "veto";
    return { ok: false, text: `${land(landId).name} verhandelt über keine Durchfahrt — das kommt einem Veto gleich. Übrig bleiben Umweg oder Aufgabe.` };
  }
  const r = verhandleVertrag(w, angebot);
  if (r.vertrag) {
    e.transit![landId] = "zusage";
    delete e.transitGegen?.[landId];
    const rest = Object.entries(e.transit ?? {}).filter(([, s]) => s === "offen").map(([x]) => land(x).name);
    return { ok: true, text: `${land(landId).name} sagt die Durchfahrt zu. ${rest.length ? `Noch am Tisch: ${rest.join(", ")}.` : "Die Strecke ist frei — der Bau kann beginnen."}` };
  }
  if (r.urteil === "gegenangebot" && r.bewertung?.gegenangebote[0]) {
    (e.transitGegen ??= {})[landId] = r.bewertung.gegenangebote[0].angebot;
    return { ok: false, text: `${land(landId).name} macht ein Gegenangebot: ${r.bewertung.gegenangebote[0].text} Sie können es im Schätzblatt annehmen.` };
  }
  if (r.urteil === "veto" || r.urteil === "ablehnung") {
    e.transit![landId] = "veto";
    return { ok: false, text: `${land(landId).name} verweigert die Durchfahrt${r.bewertung?.veto ? `: ${r.bewertung.veto}` : "."} Ein Veto macht die Strecke tot — oder den Umweg teurer.` };
  }
  return { ok: false, text: r.text };
}

/** Nimmt das gespeicherte Gegenangebot eines Transitlandes an. */
export function transitGegenAnnehmen(w: World, id: string, landId: string): { ok: boolean; text: string; why?: string } {
  const e = reichZustand(w).frei?.[id];
  const g = e?.transitGegen?.[landId];
  if (!e || !g) return { ok: false, text: "Es liegt kein Gegenangebot dieses Landes vor." };
  const r = verhandleVertrag(w, g);
  if (r.vertrag) {
    e.transit![landId] = "zusage";
    delete e.transitGegen![landId];
    const rest = Object.entries(e.transit ?? {}).filter(([, s]) => s === "offen").map(([x]) => land(x).name);
    return { ok: true, text: `${land(landId).name} sagt die Durchfahrt zu (nachgebessertes Paket). ${rest.length ? `Noch am Tisch: ${rest.join(", ")}.` : "Die Strecke ist frei — der Bau kann beginnen."}` };
  }
  return { ok: false, text: `Das Gegenangebot trägt nicht mehr: ${r.text}` };
}

/** Faktor des Umwegs auf Bau, Zeit und Schulden (Bagdadbahn-Härte; Spielparameter). */
export const UMWEG_FAKTOR = 1.35;

/** Umgeht ein Land nach seinem Veto: die Strecke bleibt, wird aber teurer und länger. */
export function transitUmweg(w: World, id: string, landId: string): { ok: boolean; text: string; why?: string } {
  const e = reichZustand(w).frei?.[id];
  if (!e) return { ok: false, text: "Dieses freie Vorhaben liegt nicht vor." };
  if (e.transit?.[landId] !== "veto") return { ok: false, text: "Nur nach einem Veto kommt der Umweg in Frage." };
  e.transit![landId] = "umgangen";
  delete e.transitGegen?.[landId];
  const skaliere = (b: Band, f: number): Band => ({ tief: r1(b.tief * f), mitte: r1(b.mitte * f), hoch: r1(b.hoch * f) });
  e.schaetzung.bau = skaliere(e.schaetzung.bau, UMWEG_FAKTOR);
  e.schaetzung.monate = skaliere(e.schaetzung.monate, 1.25);
  e.schaetzung.schulden = skaliere(e.schaetzung.schulden, 1.3);
  e.def.kosten.bau = Math.round(e.def.kosten.bau * UMWEG_FAKTOR);
  e.def.kosten.monate = Math.max(1, Math.round(e.def.kosten.monate * 1.25));
  if (e.def.kosten.schulden) e.def.kosten.schulden = r1(e.def.kosten.schulden * 1.3);
  e.def.text += ` Umweg um ${land(landId).name}.`;
  addLog(w, "entscheidung", `Umweg um ${land(landId).name}: ${e.def.name}`, `Das Veto steht; die Strecke umgeht das Land. Bau +${Math.round((UMWEG_FAKTOR - 1) * 100)} %, Zeit +25 %, Schulden +30 %.`);
  return { ok: true, text: `Umweg um ${land(landId).name}: Die Strecke bleibt möglich, wird aber spürbar teurer und länger (neu geschätzt: Bau ${bandText(e.schaetzung.bau)} Punkte, ${bandText(e.schaetzung.monate)} Monate).` };
}

// ---------------------------------------------------------------------------
// Friedens-Routing: Verweis auf die Vermittlungs-Mechanik statt eines Bauwerks

export function friedensAntwort(w: World, d: Extract<Deutung, { art: "frieden" }>): { ok: boolean; text: string; why?: string } {
  if (d.vermittlungId) {
    const sicht = vermittlungen(w).find((x) => x.def.id === d.vermittlungId)!;
    const def = sicht.def;
    return {
      ok: false,
      text: `Frieden wird nicht gebaut, sondern vermittelt. Dafür gibt es einen eigenen Weg: ${def.titel} — ${def.text} Die Aussicht liegt derzeit bei etwa ${sicht.aussicht} Prozent; der Versuch kostet ${def.pk} Kapital.${sicht.moeglich ? "" : ` Gerade blockiert: ${sicht.grund}`} Sie finden die Vermittlung in der Welt-Ansicht unter „Zwischen Dritten“.`,
      why: "Routing statt Projekt: Die Vermittlungs-Mechanik rechnet Interessen, Vertrauen und Konfliktstand — ein Schätzblatt kann das nicht leisten.",
    };
  }
  if (d.paar) {
    return {
      ok: false,
      text: `Zwischen ${land(d.paar[0]).name} und ${land(d.paar[1]).name} gibt es in diesem Spiel noch keine Vermittlungsmechanik. Gebaut sind die Wege Ukraine–Russland und Armenien–Aserbaidschan; für andere Paare bleiben Ihnen die üblichen Beziehungswege (Gipfel, Entschärfung, Verträge am Verhandlungstisch).`,
      why: "Ehrlich statt vorgetäuscht: Ich führe nur aus, was der Kern rechnen kann.",
    };
  }
  return {
    ok: false,
    text: "Frieden ist kein Bauwerk, sondern eine Vermittlung zwischen zwei Parteien — nennen Sie beide, etwa „Frieden zwischen Ukraine und Russland“. Die Vermittlung finden Sie in der Welt-Ansicht unter „Zwischen Dritten“.",
    why: "Routing statt Projekt.",
  };
}

// ---------------------------------------------------------------------------
// Texte für Parser und Oberfläche

/** Kurzfassung des Schätzblatts für den Chat; das vollständige Blatt liegt im Reich-Fenster. */
export function schaetzKurz(s: Schaetzung): string {
  const transit = s.transit?.length ? ` Grenzübertritt über ${s.transit.map((x) => x.name + (x.vermutet ? " (vermuteter Korridor)" : "")).join(", ")} — jedes Land muss am Verhandlungstisch zustimmen, ein Veto macht die Strecke tot oder den Umweg teurer.` : "";
  return `Schätzblatt „${s.name}“ (${PROJEKT_TYP_NAMEN[s.typ]}, ${MASSSTAB_NAMEN[s.massstab]}): voraussichtlich ${bandText(s.pk)} Kapital beim Beginn, ${bandText(s.bau)} Baupunkte über ${bandText(s.monate)} Monate, dazu etwa ${s.schulden.mitte.toLocaleString("de-DE")} Prozentpunkte Schulden — alles Bänder, keine Festpreise; die Überschreitung kommt erfahrungsgemäß erst im Bau.${transit} Das vollständige Blatt mit Wirkungen, Risiken und der Mentorin-Einschätzung liegt im Reich-Fenster unter „Infrastruktur“; dort entscheiden Sie über Vergabe und Beginn.`;
}
