// Prolog und Start nach der Wahl 2028 (Spieldesign, Abschnitt 3).
// Jede Antwort verändert einen konkreten Zustand; keine ist die beste.

import type { World } from "./types";
import { Rng } from "./rng";
import { NET } from "./modell";
import { initSpiel } from "./spiel";
import { PARTEI_NAME, forderungVon, fraktion, waehlePartner } from "./fraktionen";
import { partnerFigur } from "./figuren";
import { PROVINCES } from "./netz";
import { PROVINZEN, WEIGHTS, type ProvinceData } from "./regional";
import { t } from "../i18n";
import { KLASSISCHE_VOREINSTELLUNGEN, NULL_ACHSEN, PARTEI_ACHSEN, type Achsen } from "../data/linien";
import { STARTSZENARIO_NACH_ID, type StartszenarioId } from "../data/startszenarien";
import { naeheZuPartei, parteiAchsen, quellenAusAchsen, setzeLinie, voreinstellungAlsAngabe, type ParteiAngabe } from "./linie";
import { wendeBiografieAn } from "./biografie";
import { profilFuerSzenario, wendeStartszenarioAn } from "./start-szenario";

export type GroupId =
  | "rentner"
  | "arbeitnehmer"
  | "unternehmer"
  | "landwirte"
  | "junge"
  | "beamte"
  | "konservative"
  | "staedtische_saekulare";

/** Aussehen der Spielfigur (erstes Blatt des Prologs); das Porträt (ui/art/Portraet.tsx) zeichnet daraus das Gesicht. Alle Werte sind Zeichenparameter. */
export interface Aussehen {
  geschlecht: "f" | "m";
  /** Alter bei der Wahlnacht in Jahren (40 bis 66) */
  alter: number;
  /** Nummer der Gesichtsform (Teil des Samens: Kopfform, Augen, Nase, Hautton) */
  gesicht: number;
  /** Nummer der Frisur (0 bis 18, wird auf die Liste des Geschlechts gefaltet) */
  haare: number;
  brille: boolean;
  bart: "keiner" | "stoppel" | "schnurr" | "kinn" | "voll";
  kopftuch: boolean;
}

export interface PlayerProfile {
  name: string;
  /** Aussehen der Spielfigur; fehlt bei älteren Spielständen und Testprofilen, dann wählt der Name das Gesicht */
  aussehen?: Aussehen;
  heimat: string;
  /** Kfz-Kennziffer der Heimatprovinz */
  heimatPlaka: number;
  jugend: string;
  beruf: string;
  partner: string;
  motiv: string;
  partei: { name: string; kurz: string; farbe: string };
  /** Nähe der eigenen Partei zu den Wählergruppen, −10 bis +10 */
  naehe: Partial<Record<GroupId, number>>;
  /** Echte Partei, mit der ein Wahlbündnis besteht */
  buendnis?: string;
  versprechen: string[];
  wahl: { runde: 1 | 2; anteil: number };
  /** Linie der Partei auf den fünf Achsen (data/linien.ts); fehlt bei älteren Spielständen und Testprofilen, dann gilt die Linie nach Kürzel */
  achsen?: Achsen;
  /** Wie die Geschichte beginnt (data/startszenarien.ts); fehlt: Neugründung */
  startszenario?: StartszenarioId;
  /** Wie die Wahlnacht verlief; jeder Ausgang hat Vorteil und Preis (sim/biografie.ts) */
  wahlStil?: "knapp" | "klar" | "erste";
  /** Bündnis mit einer Partei außerhalb der klassischen Muster: Sie bekommt eine Zusage (Muster z-start-*) */
  buendnisZusage?: { partei: string };
  /** Saldo der Stammwählerschaft in Punkten Zustimmung (sim/linie.ts, reagiereStamm): wächst mit Linientreue, sinkt mit dem Bruch der Linie */
  stammSaldo?: number;
}

export interface Answer {
  label: string;
  text: string;
  /** Kennung des gezeichneten Wappens der Antwort (ui/prolog/Wappen.tsx): Stadt, Beruf, Motiv, Partei:KÜRZEL … */
  symbol?: string;
  /** Vorteil und Preis, die diese Antwort mitbringt (Anzeige; die Wirkung steht in sim/biografie.ts) */
  vorteil?: string;
  preis?: string;
  apply: (p: PlayerProfile) => void;
}

export interface Station {
  id: string;
  title: string;
  story: string;
  question: string;
  answers: Answer[];
  /** Die Parteistation ist ein Konfigurator (ui/prolog/Parteikonfigurator.tsx); `answers` sind die klassischen Muster für Zufallsstart und Tests */
  modus?: "konfigurator";
  /**
   * Antworten je nach bisherigem Profil (Bündnisse hängen von der Linie der Partei ab); ohne Angabe gelten `answers`.
   * `erweitert` (die Oberfläche): auch die klassischen Muster sehen alle nahen Parteien; ohne es (Zufallsstart, Tests) bleiben ihre vier festen Antworten,
   * damit gesetzte Zufallswerte dieselbe Wahl treffen wie früher.
   */
  dynamisch?: (p: PlayerProfile, erweitert?: boolean) => Answer[];
  /** Station entfällt (das Szenario legt sie fest); `auto` trägt dann ihre Wirkung ein */
  ueberspringen?: (p: PlayerProfile) => boolean;
  auto?: (p: PlayerProfile) => void;
}

/** Die Antworten einer Station für ein Profil (dynamisch oder fest). */
export const antwortenFuer = (st: Station, p: PlayerProfile, erweitert = false): Answer[] => st.dynamisch?.(p, erweitert) ?? st.answers;

const near = (p: PlayerProfile, g: GroupId, d: number) => {
  p.naehe[g] = (p.naehe[g] ?? 0) + d;
};

/** Eines der vier klassischen Muster der eigenen Partei: Name und Text aus dem Katalog, Linie und Gruppennähe aus data/linien.ts und sim/linie.ts. */
function klassisch(id: string): Answer {
  const v = KLASSISCHE_VOREINSTELLUNGEN.find((x) => x.id === id)!;
  return {
    symbol: `partei:${v.kurz}`,
    get label() {
      return t(`linie.preset.${id}.name`);
    },
    get text() {
      return t(`linie.preset.${id}.text`);
    },
    apply: (p) => setzeLinie(p, voreinstellungAlsAngabe(v, t(`linie.preset.${id}.name`))),
  };
}

/** Bündnis mit einer Partei der Szene: Wahl der Antworten nach Nähe der Linie (die klassischen Muster behalten ihre vier festen Antworten). */
const BUENDNIS_NAME: Record<string, string> = { AKP: "AKP", "YENİ": "YENİ Parti", CHP: "CHP", MHP: "MHP", "İYİ": "İYİ Parti", DEM: "DEM Parti", Zafer: "Zafer Partisi", YRP: "Yeniden Refah" };
function buendnisAntworten(p: PlayerProfile, feste: Answer[], erweitert = false): Answer[] {
  const kurz = p.partei.kurz;
  const klassisch = KLASSISCHE_VOREINSTELLUNGEN.some((v) => v.kurz === kurz);
  if (!kurz || (klassisch && !erweitert)) return feste;
  const achsen = p.achsen ?? parteiAchsen(kurz) ?? NULL_ACHSEN;
  const parteien = Object.keys(PARTEI_ACHSEN)
    .map((k) => ({ k, nah: naeheZuPartei(achsen, k), a: PARTEI_ACHSEN[k]! }))
    .sort((x, y) => y.nah - x.nah);
  // Klassische Muster behalten ihre zwei festen Bündnisse (YENİ, MHP) und sehen dazu die übrigen nahen Parteien
  const schon = klassisch ? new Set(["YENİ", "MHP"]) : new Set<string>();
  const kandidaten = parteien.filter((x) => x.nah >= (klassisch ? 1 : 0) && !schon.has(x.k)).slice(0, klassisch ? 2 : 4);
  if (!klassisch && kandidaten.length < 2) kandidaten.splice(0, kandidaten.length, ...parteien.slice(0, 2));
  const aus: Answer[] = kandidaten.map((c) => ({
    symbol: `partei:${c.k}`,
    get label() {
      return t("prolog.buendnis.label", { partei: BUENDNIS_NAME[c.k] ?? c.k });
    },
    get text() {
      return t("prolog.buendnis.text", { partei: BUENDNIS_NAME[c.k] ?? c.k, naehe: c.nah >= 1 ? "nah" : c.nah === 0 ? "mittel" : "fern" });
    },
    apply: (q) => {
      q.buendnis = c.k;
      q.buendnisZusage = { partei: c.k };
      q.versprechen.push(t("prolog.buendnis.versprechen", { partei: BUENDNIS_NAME[c.k] ?? c.k }));
    },
  }));
  return klassisch ? [...feste.slice(0, 2), ...aus, ...feste.slice(2)] : [...aus, ...feste.slice(2)];
}

/**
 * Eine Antwort mit Texten aus dem Katalog (`prolog.st.<station>.<antwort>.label` und `.text`). Die Texte entstehen beim Lesen, damit ein Wechsel
 * der Sprache (und die Tests in jeder Sprache) greift. `symbol` ist die Kennung des gezeichneten Wappens (ui/prolog/Wappen.tsx).
 * Hat die Antwort ein Merkmal der Biografie (sim/biografie.ts FOLGEN), liefert `folge` dessen Schlüssel und `vorteil`/`preis` die Katalogtexte.
 */
function antwort(station: string, id: string, symbol: string, apply: (p: PlayerProfile) => void, folge?: string): Answer {
  const k = `prolog.st.${station}.${id}`;
  const a: Answer = {
    symbol,
    apply,
    get label() {
      return t(`${k}.label`);
    },
    get text() {
      return t(`${k}.text`);
    },
  };
  if (folge) {
    Object.defineProperties(a, {
      vorteil: { get: () => t(`biografie.${folge}.vorteil`), enumerable: true },
      preis: { get: () => t(`biografie.${folge}.preis`), enumerable: true },
    });
  }
  return a;
}

/** Eine Station mit Titel, Geschichte und Frage aus dem Katalog (`prolog.st.<id>.title|story|question`). */
function station(id: string, rest: Omit<Station, "id" | "title" | "story" | "question">): Station {
  return {
    id,
    get title() {
      return t(`prolog.st.${id}.title`);
    },
    get story() {
      return t(`prolog.st.${id}.story`);
    },
    get question() {
      return t(`prolog.st.${id}.question`);
    },
    ...rest,
  } as Station;
}

export const STATIONS: Station[] = [
  station("kindheit", {
    answers: [
      antwort("kindheit", "izmir", "stadt_izmir", (p) => { p.heimat = "İzmir"; p.heimatPlaka = 35; near(p, "staedtische_saekulare", 3); }),
      antwort("kindheit", "konya", "stadt_konya", (p) => { p.heimat = "Konya"; p.heimatPlaka = 42; near(p, "konservative", 3); }),
      antwort("kindheit", "diyarbakir", "stadt_diyarbakir", (p) => { p.heimat = "Diyarbakır"; p.heimatPlaka = 21; near(p, "junge", 1); }),
      antwort("kindheit", "trabzon", "stadt_trabzon", (p) => { p.heimat = "Trabzon"; p.heimatPlaka = 61; near(p, "arbeitnehmer", 2); }),
    ],
  }),
  station("jugend", {
    answers: [
      antwort("jugend", "studenten", "jugend_studenten", (p) => { p.jugend = "Studentenbewegung"; near(p, "junge", 3); near(p, "staedtische_saekulare", 2); }, "studentenbewegung"),
      antwort("jugend", "betrieb", "jugend_betrieb", (p) => { p.jugend = "Familienbetrieb"; near(p, "unternehmer", 3); }, "familienbetrieb"),
      antwort("jugend", "moschee", "jugend_moschee", (p) => { p.jugend = "Moscheegemeinde"; near(p, "konservative", 3); }, "moscheegemeinde"),
      antwort("jugend", "sport", "jugend_sport", (p) => { p.jugend = "Sportverein"; near(p, "arbeitnehmer", 2); near(p, "junge", 1); }, "sportverein"),
    ],
  }),
  station("beruf", {
    answers: [
      antwort("beruf", "anwalt", "beruf_anwalt", (p) => { p.beruf = "Anwalt"; near(p, "staedtische_saekulare", 1); }, "anwalt"),
      antwort("beruf", "arzt", "beruf_arzt", (p) => { p.beruf = "Arzt"; near(p, "rentner", 2); }, "arzt"),
      antwort("beruf", "unternehmer", "beruf_unternehmer", (p) => { p.beruf = "Unternehmer"; near(p, "unternehmer", 3); near(p, "arbeitnehmer", -1); }, "unternehmer"),
      antwort("beruf", "oekonom", "beruf_oekonom", (p) => { p.beruf = "Ökonom"; near(p, "unternehmer", 1); near(p, "staedtische_saekulare", 1); }, "oekonom"),
    ],
  }),
  station("liebe", {
    answers: [
      antwort("liebe", "hoersaal", "liebe_hoersaal", (p) => { p.partner = "Richterin, eigene Karriere, eigene Meinung"; }, "richterin"),
      antwort("liebe", "hochzeit", "liebe_hochzeit", (p) => { p.partner = "Bauunternehmer, Aufträge vom Staat möglich"; near(p, "unternehmer", 1); }, "bauunternehmer"),
      antwort("liebe", "demo", "liebe_demo", (p) => { p.partner = "Journalistin, kritisch, gut vernetzt"; near(p, "staedtische_saekulare", 1); }, "journalistin"),
      antwort("liebe", "klinik", "liebe_klinik", (p) => { p.partner = "Krankenpfleger, bodenständig, meidet Kameras"; near(p, "arbeitnehmer", 1); }, "krankenpfleger"),
    ],
  }),
  station("politik", {
    answers: [
      antwort("politik", "unglueck", "motiv_unglueck", (p) => { p.motiv = "Unglück und Wut über Pfusch"; near(p, "rentner", 1); near(p, "staedtische_saekulare", 1); }, "unglueck"),
      antwort("politik", "korruption", "motiv_korruption", (p) => { p.motiv = "Korruption"; near(p, "junge", 2); }, "korruption"),
      antwort("politik", "mentor", "motiv_mentor", (p) => { p.motiv = "Mentor"; near(p, "konservative", 1); }, "mentor"),
      antwort("politik", "ehrgeiz", "motiv_ehrgeiz", (p) => { p.motiv = "Ehrgeiz"; }, "ehrgeiz"),
    ],
  }),
  station("partei", {
    modus: "konfigurator",
    answers: [
      klassisch("mitte"),
      klassisch("gerechtigkeit"),
      klassisch("werte"),
      klassisch("regionen"),
    ],
    ueberspringen: (p) => !!STARTSZENARIO_NACH_ID[p.startszenario ?? "neugruendung"].partei,
  }),
  station("wahlkampf", {
    dynamisch: (p, erweitert) => buendnisAntworten(p, STATIONS.find((s) => s.id === "wahlkampf")!.answers, erweitert),
    ueberspringen: (p) => !!STARTSZENARIO_NACH_ID[p.startszenario ?? "neugruendung"].buendnis,
    answers: [
      antwort("wahlkampf", "yeni", "partei:YENİ", (p) => { p.buendnis = "YENİ"; p.versprechen.push("Der YENİ Parti wurden zwei Ministerien zugesagt."); }),
      antwort("wahlkampf", "mhp", "partei:MHP", (p) => { p.buendnis = "MHP"; p.versprechen.push("Der MHP wurde ein Mitspracherecht beim Friedensprozess zugesagt."); near(p, "konservative", 2); }),
      antwort("wahlkampf", "allein_gross", "kampf_allein_gross", (p) => { p.versprechen.push("Rentenerhöhung in den ersten hundert Tagen versprochen."); near(p, "rentner", 3); }),
      antwort("wahlkampf", "allein_hart", "kampf_allein_hart", (p) => { p.versprechen.push("Offene Vergaben und Vermögenserklärungen aller Minister versprochen."); near(p, "junge", 2); near(p, "staedtische_saekulare", 2); }),
    ],
  }),
  station("wahlnacht", {
    // Keine Antwort ist strikt besser: Jede hat einen Vorteil und einen Preis (sim/biografie.ts, Schlüssel „wahl:…“)
    ueberspringen: (p) => !!STARTSZENARIO_NACH_ID[p.startszenario ?? "neugruendung"].wahl,
    answers: [
      antwort("wahlnacht", "knapp", "nacht_knapp", (p) => { p.wahl = { runde: 2, anteil: 50.6 }; p.wahlStil = "knapp"; }, "wahl_knapp"),
      antwort("wahlnacht", "klar", "nacht_klar", (p) => { p.wahl = { runde: 2, anteil: 54 }; p.wahlStil = "klar"; }, "wahl_klar"),
      antwort("wahlnacht", "erste", "nacht_erste", (p) => { p.wahl = { runde: 1, anteil: 51.2 }; p.wahlStil = "erste"; }, "wahl_erste"),
    ],
  }),
];

export function emptyProfile(): PlayerProfile {
  return {
    name: "",
    heimat: "",
    heimatPlaka: 6,
    jugend: "",
    beruf: "",
    partner: "",
    motiv: "",
    partei: { name: "", kurz: "", farbe: "#555" },
    naehe: {},
    versprechen: [],
    wahl: { runde: 2, anteil: 51 },
    startszenario: "neugruendung",
  };
}

// ---------------------------------------------------------------------------
// Parlament beim Start: aus den Umfragen, mit Zufall und Sperrklausel

/** Durchschnitt der Umfragen vom Stichtag (tuerkei/recherche/umfragen.md), Unentschlossene herausgerechnet. */
export const POLLS: Record<string, number> = {
  AKP: 33.7,
  YENİ: 23.1,
  DEM: 9.0,
  MHP: 7.5,
  İYİ: 6.9,
  CHP: 6.8,
  Zafer: 3.5,
  YRP: 2.8,
  Andere: 6.7,
};

/** Aus welchen Parteien die neue Partei Stimmen gewinnt, je nach Profil (Anteil am Zugewinn). */
const SOURCES: Record<string, Record<string, number>> = {
  AP: { YENİ: 0.35, CHP: 0.2, İYİ: 0.2, AKP: 0.15, Andere: 0.1 },
  PG: { YENİ: 0.3, CHP: 0.2, AKP: 0.25, DEM: 0.1, Andere: 0.15 },
  PW: { AKP: 0.5, MHP: 0.2, YRP: 0.15, İYİ: 0.1, Andere: 0.05 },
  PR: { DEM: 0.25, AKP: 0.25, YENİ: 0.2, MHP: 0.1, Andere: 0.2 },
};

/** Aus welchen Parteien eine Partei ihre Stimmen zieht: die klassischen Muster von Hand, jede andere Linie nach Nähe auf den Achsen. */
function quellenFuer(eigene: string, achsen?: Achsen): Record<string, number> {
  const fest = SOURCES[eigene];
  if (fest) return fest;
  const a = achsen ?? parteiAchsen(eigene);
  return a ? quellenAusAchsen(a, POLLS) : { Andere: 1 };
}

export interface Parliament {
  /** Landesweite Stimmenanteile in % */
  shares: Record<string, number>;
  seats: Record<string, number>;
  /** Sitze je Provinz (Kfz-Kennziffer) */
  byProvince?: Record<number, Record<string, number>>;
}

/** Welche Partei von 2023 als regionales Muster für eine Partei von 2026 dient. */
const PATTERN: Record<string, "AKP" | "CHP" | "MHP" | "İYİ" | "YSP" | null> = {
  AKP: "AKP",
  YENİ: "CHP",
  CHP: "CHP",
  MHP: "MHP",
  İYİ: "İYİ",
  DEM: "YSP",
  Zafer: null,
  YRP: null,
  Andere: null,
};

/** Regionale Stärke einer Partei: Anteil 2023 in der Provinz im Verhältnis zum Landeswert (1 = Durchschnitt). */
function regionalRatio(party: string, p: ProvinceData): number {
  const pattern = PATTERN[party];
  if (!pattern) return 1;
  const nat = NAT_2023[pattern];
  let local = p.stimmen2023[pattern];
  if (pattern === "CHP" && local === 0) {
    // 2023 trat die CHP in einigen Provinzen nicht mit eigener Liste an; dann das Oppositionslager insgesamt
    local = ((p.stimmen2023.CHP + p.stimmen2023.İYİ) / (NAT_2023.CHP + NAT_2023.İYİ)) * nat;
  }
  return nat > 0 ? local / nat : 1;
}

const NAT_2023 = (["AKP", "CHP", "MHP", "İYİ", "YSP"] as const).reduce(
  (acc, k) => {
    acc[k] = PROVINZEN.reduce((s, p, i) => s + p.stimmen2023[k] * WEIGHTS[i]!, 0);
    return acc;
  },
  {} as Record<"AKP" | "CHP" | "MHP" | "İYİ" | "YSP", number>,
);

/**
 * Parlament 2028 je Provinz: Umfragedurchschnitt, regional verteilt nach den
 * Ergebnissen von 2023. Die neue Partei zieht 15 bis 30 % an sich, dort, wo
 * ihre Quellparteien stark sind, und in der Heimatprovinz. Jeder landesweite
 * Anteil schwankt um bis zu ±5 Punkte. Hürde 7 % landesweit (Bündnisse
 * gemeinsam), dann D'Hondt je Provinz (Wahlgesetz Art. 33, 34).
 */
export function electParliament(profile: PlayerProfile, rng: Rng): Parliament {
  const own = profile.partei.kurz || "EIGENE";
  // Eine Partei der Szene (Regierungspartei übernehmen) tritt mit ihrem Umfrageanteil an; nur eine neue Partei zieht Stimmen von anderen
  const bestehend = own in POLLS;
  const parties = bestehend ? Object.keys(POLLS) : [...Object.keys(POLLS), own];
  const gain = rng.between(15, 30);
  const sources = quellenFuer(own, profile.achsen);
  const swing: Record<string, number> = {};
  for (const party of Object.keys(POLLS)) swing[party] = POLLS[party]! > 5 ? rng.between(-5, 5) : rng.between(-1, 1);
  if (!bestehend) swing[own] = rng.between(-3, 3);

  const local: Record<string, number>[] = PROVINZEN.map((p) => {
    const sh: Record<string, number> = {};
    for (const party of Object.keys(POLLS)) sh[party] = Math.max(0.2, (POLLS[party]! + swing[party]!) * regionalRatio(party, p));
    if (!bestehend) {
      let ownShare = 0;
      for (const [src, w] of Object.entries(sources)) {
        const take = Math.min(sh[src]! * 0.8, (gain + swing[own]!) * w * regionalRatio(src, p));
        sh[src] = sh[src]! - take;
        ownShare += take;
      }
      if (p.plaka === profile.heimatPlaka) ownShare += 8;
      sh[own] = ownShare;
    }
    for (const party of parties) sh[party] = Math.max(0.1, sh[party]! + rng.between(-1, 1));
    const total = parties.reduce((s, k) => s + sh[k]!, 0);
    for (const party of parties) sh[party] = (sh[party]! / total) * 100;
    return sh;
  });

  const shares: Record<string, number> = {};
  for (const party of parties) shares[party] = local.reduce((s, sh, i) => s + sh[party]! * WEIGHTS[i]!, 0);

  const allianceShare = profile.buendnis ? shares[own]! + (shares[profile.buendnis] ?? 0) : 0;
  const eligible = parties.filter(
    (party) =>
      party !== "Andere" &&
      (shares[party]! >= 7 ||
        (!!profile.buendnis && (party === own || party === profile.buendnis) && allianceShare >= 7)),
  );

  const { seats, byProvince } = verteileSitze(local, eligible);
  return { shares, seats, byProvince };
}

/** D'Hondt je Provinz (Wahlkreis): Die Sitze jeder Provinz gehen an die zugelassenen Parteien nach ihren örtlichen Stimmen. */
export function verteileSitze(local: Record<string, number>[], eligible: string[]): { seats: Record<string, number>; byProvince: Record<number, Record<string, number>> } {
  const seats: Record<string, number> = Object.fromEntries(eligible.map((p) => [p, 0]));
  const byProvince: Record<number, Record<string, number>> = {};
  PROVINZEN.forEach((p, i) => {
    const sh = local[i]!;
    const got: Record<string, number> = Object.fromEntries(eligible.map((x) => [x, 0]));
    for (let s = 0; s < p.sitze; s++) {
      let best = eligible[0]!;
      let bestQ = -1;
      for (const party of eligible) {
        const q = (sh[party] ?? 0) / (got[party]! + 1);
        if (q > bestQ) {
          bestQ = q;
          best = party;
        }
      }
      got[best]! += 1;
      seats[best]! += 1;
    }
    byProvince[p.plaka] = got;
  });
  return { seats, byProvince };
}

/**
 * Örtliche Stimmenanteile aller Parteien bei gegebenen Landesanteilen: Jede Partei folgt dem Muster ihrer Hochburgen
 * von 2023 (regionalRatio; die eigene Partei dem Muster ihrer Quellparteien), danach wird jede Provinz auf 100 Prozent gebracht
 * und der Landesschnitt jeder Partei auf ihren Landesanteil nachgezogen. Für die Parlamentswahl nach dem Start (sim/wahl.ts).
 */
export function lokaleAnteile(shares: Record<string, number>, eigene: string): Record<string, number>[] {
  const parteien = Object.keys(shares);
  const quelle = eigene in POLLS ? undefined : quellenFuer(eigene);
  const ratio = (party: string, p: ProvinceData): number => {
    if (party === eigene && quelle) {
      let summe = 0;
      let gewicht = 0;
      for (const [src, w] of Object.entries(quelle)) {
        summe += w * regionalRatio(src, p);
        gewicht += w;
      }
      return gewicht > 0 ? summe / gewicht : 1;
    }
    return regionalRatio(party, p);
  };
  let local: Record<string, number>[] = PROVINZEN.map((p) => Object.fromEntries(parteien.map((k) => [k, Math.max(0.05, (shares[k] ?? 0) * ratio(k, p))])));
  // Zwei Durchgänge: Landesschnitt je Partei auf den Sollwert, dann jede Provinz auf 100
  for (let durchgang = 0; durchgang < 2; durchgang++) {
    const schnitt: Record<string, number> = {};
    for (const k of parteien) schnitt[k] = local.reduce((s, sh, i) => s + sh[k]! * WEIGHTS[i]!, 0);
    local = local.map((sh) => {
      const neu = Object.fromEntries(parteien.map((k) => [k, schnitt[k]! > 0 ? sh[k]! * ((shares[k] ?? 0) / schnitt[k]!) : sh[k]!]));
      const total = parteien.reduce((s, k) => s + neu[k]!, 0);
      return Object.fromEntries(parteien.map((k) => [k, total > 0 ? (neu[k]! / total) * 100 : 0]));
    });
  }
  return local;
}

/** Wirkung des Prologs auf den Weltzustand. */
export function applyProfile(world: World, profile: PlayerProfile): void {
  for (const [group, d] of Object.entries(profile.naehe)) {
    const i = NET.index.get(group);
    if (i === undefined) continue;
    for (let p = 0; p < PROVINCES; p++) {
      const k = i * PROVINCES + p;
      world.net.values[k] = Math.min(100, Math.max(0, world.net.values[k]! + d));
      // Die Nähe bleibt: Auch der Ruhewert, zu dem die Stimmung zurückkehrt, verschiebt sich (früher klang sie auf den Mittelwert ab)
      world.net.start[k] = Math.min(100, Math.max(0, world.net.start[k]! + d));
    }
  }
  // Heimatbonus: In der Heimatprovinz ist man beliebter
  for (const group of ["arbeitnehmer", "rentner", "konservative", "staedtische_saekulare", "junge", "landwirte", "unternehmer", "beamte"]) {
    const i = NET.index.get(group);
    if (i === undefined) continue;
    const k = i * PROVINCES + profile.heimatPlaka - 1;
    world.net.values[k] = Math.min(100, world.net.values[k]! + 5);
  }
  world.net.history = world.net.history.map(() => world.net.values.slice());
}

/** Amtsantritt nach der Wahl 2028: Profil übernehmen, Parlament wählen, erste Einträge. */
export function startAfterElection(world: World, eingabe: PlayerProfile): void {
  const rng = new Rng(world.rngState);
  // Ein vorgegebenes Szenario legt Partei, Bündnis, Wahl und Erbe fest (data/startszenarien.ts)
  const profile = profilFuerSzenario(eingabe);
  const szenario = STARTSZENARIO_NACH_ID[profile.startszenario ?? "neugruendung"];
  world.player = structuredClone(profile);
  world.parliament = electParliament(profile, rng);
  applyProfile(world, profile);

  const own = profile.partei.kurz;
  const ownSeats = world.parliament.seats[own] ?? 0;
  const allySeats = profile.buendnis ? (world.parliament.seats[profile.buendnis] ?? 0) : 0;
  // Das Spiel beginnt mit einer Regierungsmehrheit: Reicht das eigene Lager nicht, kommen Partner nach Nähe und Größe hinzu
  let weitere = waehlePartner(world.parliament.seats, own, profile.buendnis, profile.achsen);
  // Ein Riese im Lager ließe kaum eine Opposition übrig: Er duldet die Regierung zunächst nur, statt ihr anzugehören
  const duldender = weitere.find((p) => (world.parliament!.seats[p] ?? 0) >= 200 && ownSeats + allySeats + weitere.reduce((n, q) => n + (world.parliament!.seats[q] ?? 0), 0) > 520);
  if (duldender) weitere = weitere.filter((p) => p !== duldender);
  const weitereSeats = weitere.reduce((s, p) => s + (world.parliament!.seats[p] ?? 0), 0);
  const bloc = ownSeats + allySeats + weitereSeats;
  const partnerNamen = [profile.buendnis, ...weitere].filter(Boolean).map((k) => PARTEI_NAME[k!] ?? k!);
  world.log.push({
    day: world.day,
    date: world.date,
    kind: "ereignis",
    text:
      szenario.id !== "neugruendung"
        ? t(`start.log.${szenario.id}`, { name: profile.name, partei: profile.partei.name, eigene: ownSeats, bloc })
        : `${profile.name} gewinnt die Präsidentschaftswahl ${profile.wahl.runde === 1 ? "im ersten Wahlgang" : "in der Stichwahl"} ` +
      `mit ${profile.wahl.anteil.toLocaleString("de-DE")} %. Die ${profile.partei.name} erhält ${ownSeats} von 600 Sitzen` +
      (partnerNamen.length
        ? `; zusammen mit ${partnerNamen.length === 1 ? "dem Bündnispartner" : "den Bündnispartnern"} ${partnerNamen.join(" und ")} hat das Regierungslager ${bloc} Sitze.`
        : ".") +
      (duldender ? ` Die ${PARTEI_NAME[duldender] ?? duldender} (${world.parliament.seats[duldender] ?? 0} Sitze) bleibt formal Opposition und duldet die Regierung zunächst für acht Monate.` : ""),
    why:
      bloc >= 301
        ? `Eine Regierungsmehrheit: Gesetze und Haushalt sind möglich, solange die Partner im Lager bleiben. Sie erwarten ihre Forderungen erfüllt; wer Zusagen bricht, verliert sie. Verfassungsänderungen brauchen trotzdem 360 Stimmen.`
        : `Keine eigene Mehrheit: Für Gesetze fehlen ${301 - bloc} Stimmen. Es braucht Partner, Absprachen oder Überläufer.`,
  });
  for (const v of profile.versprechen) {
    world.log.push({ day: world.day, date: world.date, kind: "ereignis", text: `Offene Zusage aus dem Wahlkampf: ${v}` });
  }
  // Die Spielschleife beginnt: Kapital, Figuren, Zusagen, drei Vorgänge des ersten Tages
  initSpiel(world, profile, rng);
  weitere.forEach((partei, i) => {
    const spiel = world.spiel!;
    const forderung = forderungVon(world, partei);
    const name = PARTEI_NAME[partei] ?? partei;
    spiel.lager.push(partei);
    if (forderung) {
      spiel.zusagen.push({ id: `z-start-${partei}`, von: partei, text: `Die ${name} erwartet ${forderung.text}`, faellig: 120 + 60 * i, massnahme: forderung.massnahme, richtung: 1, erfuellt: false, gebrochen: false });
    }
    const figur = partnerFigur(world, partei, `Vorsitz der ${name}`, forderung?.text ?? "Einfluss und Ämter", rng);
    // Eine Fraktion, die allein fast so groß ist wie das übrige Lager, hat Gewicht und Ansprüche: Ihre Treue ist brüchig
    if ((world.parliament?.seats[partei] ?? 0) >= 200) figur.loyalitaet = 38;
    spiel.figuren.push(figur);
  });
  if (duldender && world.spiel) {
    const f = fraktion(world, duldender);
    f.duldungBis = world.day + 240;
    f.bereitschaft = Math.max(f.bereitschaft, 55);
    const forderung = forderungVon(world, duldender);
    world.spiel.zusagen.push({ id: `z-duldung-${duldender}`, von: duldender, text: `Die ${PARTEI_NAME[duldender] ?? duldender} erwartet für ihre Duldung ${forderung.text}`, faellig: 200, massnahme: forderung.massnahme, richtung: 1, erfuellt: false, gebrochen: false });
  }
  // Bündnis mit einer Partei außerhalb der klassischen Muster: Sie erwartet ihre Kernforderung (Muster z-start-*)
  const bz = profile.buendnisZusage;
  if (bz && world.spiel && !world.spiel.zusagen.some((z) => z.id === `z-start-${bz.partei}`)) {
    const forderung = forderungVon(world, bz.partei);
    const name = PARTEI_NAME[bz.partei] ?? bz.partei;
    world.spiel.zusagen.push({ id: `z-start-${bz.partei}`, von: bz.partei, text: `Die ${name} erwartet ${forderung.text}`, faellig: 90, massnahme: forderung.massnahme, richtung: 1, erfuellt: false, gebrochen: false });
  }
  // Szenario (Wahltag, Krise) und Biografie (Beruf, Jugend, Motiv, Partner, Wahlnacht) wirken auf Figuren, Kapital und Lage
  wendeStartszenarioAn(world, profile);
  wendeBiografieAn(world, profile);
  world.rngState = rng.state;
}

/**
 * Ein vollständiges Profil ohne Prolog: für den Schnellstart und Tests. `waehle(n)` gibt den Index der Antwort bei n Möglichkeiten.
 * Mit `linie` bekommt die Partei diese Linie (Voreinstellung oder frei) statt eines der vier klassischen Muster; der Zufallsstrom bleibt
 * derselbe, damit zwei Linien mit denselben Zufallswerten dieselbe Lebensgeschichte haben (gepaarter Vergleich).
 */
export function schnellProfil(name = "Deniz Aydın", waehle: (n: number) => number = () => 0, linie?: ParteiAngabe, szenario?: StartszenarioId): PlayerProfile {
  const p = emptyProfile();
  p.name = name;
  if (szenario) p.startszenario = szenario;
  for (const st of STATIONS) {
    if (st.ueberspringen?.(p)) continue;
    const antworten = antwortenFuer(st, p);
    const i = Math.min(antworten.length - 1, waehle(antworten.length));
    if (linie && st.modus === "konfigurator") setzeLinie(p, linie);
    else antworten[i]!.apply(p);
  }
  return p;
}
