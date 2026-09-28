// Prolog und Start nach der Wahl 2028 (Spieldesign, Abschnitt 3).
// Jede Antwort verändert einen konkreten Zustand; keine ist die beste.

import type { World } from "./types";
import { Rng } from "./rng";
import { NET } from "./world";
import { PROVINCES } from "./netz";

export type GroupId =
  | "rentner"
  | "arbeitnehmer"
  | "unternehmer"
  | "landwirte"
  | "junge"
  | "beamte"
  | "konservative"
  | "staedtische_saekulare";

export interface PlayerProfile {
  name: string;
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
}

export interface Answer {
  label: string;
  text: string;
  apply: (p: PlayerProfile) => void;
}

export interface Station {
  id: string;
  title: string;
  story: string;
  question: string;
  answers: Answer[];
}

const near = (p: PlayerProfile, g: GroupId, d: number) => {
  p.naehe[g] = (p.naehe[g] ?? 0) + d;
};

export const STATIONS: Station[] = [
  {
    id: "kindheit",
    title: "Kindheit",
    story: "Jede Karriere beginnt irgendwo. Deine beginnt in einer Küche, in der abends über Politik gestritten wurde.",
    question: "Wo bist du aufgewachsen?",
    answers: [
      { label: "İzmir", text: "Eine Großstadt am Meer, weltoffen und laut.", apply: (p) => { p.heimat = "İzmir"; p.heimatPlaka = 35; near(p, "staedtische_saekulare", 3); } },
      { label: "Konya", text: "Eine Stadt in Zentralanatolien, fromm, fleißig, stolz.", apply: (p) => { p.heimat = "Konya"; p.heimatPlaka = 42; near(p, "konservative", 3); } },
      { label: "Diyarbakır", text: "Eine alte Stadt im Südosten, mit vielen Sprachen und vielen Wunden.", apply: (p) => { p.heimat = "Diyarbakır"; p.heimatPlaka = 21; near(p, "junge", 1); } },
      { label: "Trabzon", text: "Eine Hafenstadt am Schwarzen Meer, Fußball, Tee und Dickköpfe.", apply: (p) => { p.heimat = "Trabzon"; p.heimatPlaka = 61; near(p, "arbeitnehmer", 2); } },
    ],
  },
  {
    id: "jugend",
    title: "Jugend",
    story: "Mit siebzehn hattest du Meinungen zu allem und Erfahrung mit nichts.",
    question: "Was hat dich geprägt?",
    answers: [
      { label: "Die Studentenbewegung", text: "Flugblätter, Nachtdiskussionen, eine Festnahme, über die du heute schmunzelst.", apply: (p) => { p.jugend = "Studentenbewegung"; near(p, "junge", 3); near(p, "staedtische_saekulare", 2); } },
      { label: "Der Familienbetrieb", text: "Du hast gelernt, was eine Lohnabrechnung ist, bevor du wählen durftest.", apply: (p) => { p.jugend = "Familienbetrieb"; near(p, "unternehmer", 3); } },
      { label: "Die Moscheegemeinde", text: "Jugendgruppe, Ferienlager, ein Imam, der dir das Zuhören beibrachte.", apply: (p) => { p.jugend = "Moscheegemeinde"; near(p, "konservative", 3); } },
      { label: "Der Sportverein", text: "Kapitän der Jugendmannschaft. Du weißt, wie man eine Kabine zusammenhält.", apply: (p) => { p.jugend = "Sportverein"; near(p, "arbeitnehmer", 2); near(p, "junge", 1); } },
    ],
  },
  {
    id: "beruf",
    title: "Beruf",
    story: "Bevor du Reden hieltest, hast du gearbeitet. Die Leute wissen das; deine Gegner auch.",
    question: "Womit hast du dein Geld verdient?",
    answers: [
      { label: "Anwältin oder Anwalt", text: "Verträge, Gerichte, Mandanten, die dir heute noch Gefallen schulden.", apply: (p) => { p.beruf = "Anwalt"; near(p, "staedtische_saekulare", 1); } },
      { label: "Ärztin oder Arzt", text: "Nachtdienste in einer Provinzklinik. Du weißt, was im Gesundheitswesen fehlt.", apply: (p) => { p.beruf = "Arzt"; near(p, "rentner", 2); } },
      { label: "Unternehmerin oder Unternehmer", text: "Eine Firma mit dreihundert Beschäftigten. Und ein Steuerbescheid, den die Presse gern hätte.", apply: (p) => { p.beruf = "Unternehmer"; near(p, "unternehmer", 3); near(p, "arbeitnehmer", -1); } },
      { label: "Ökonomin oder Ökonom", text: "Zehn Jahre bei einer Bank, dann an der Universität. Du verstehst Zinsen; die Wähler weniger.", apply: (p) => { p.beruf = "Ökonom"; near(p, "unternehmer", 1); near(p, "staedtische_saekulare", 1); } },
    ],
  },
  {
    id: "liebe",
    title: "Liebe",
    story: "Es gibt Menschen, die man trifft, und Menschen, die einem zustoßen.",
    question: "Wie hast du deine Partnerin oder deinen Partner kennengelernt?",
    answers: [
      { label: "Im Hörsaal", text: "Sie war schlauer als du und hat es dich jeden Tag wissen lassen. Heute ist sie Richterin.", apply: (p) => { p.partner = "Richterin, eigene Karriere, eigene Meinung"; } },
      { label: "Auf einer Hochzeit", text: "Die Familien haben nachgeholfen. Er führt heute das Bauunternehmen seines Vaters.", apply: (p) => { p.partner = "Bauunternehmer, Aufträge vom Staat möglich"; near(p, "unternehmer", 1); } },
      { label: "Bei einer Demonstration", text: "Ihr wurdet zusammen vom Wasserwerfer getroffen. Sie ist heute Journalistin.", apply: (p) => { p.partner = "Journalistin, kritisch, gut vernetzt"; near(p, "staedtische_saekulare", 1); } },
      { label: "Im Krankenhaus", text: "Er war Krankenpfleger, du warst Patient. Er hält dich bis heute auf dem Boden.", apply: (p) => { p.partner = "Krankenpfleger, bodenständig, meidet Kameras"; near(p, "arbeitnehmer", 1); } },
    ],
  },
  {
    id: "politik",
    title: "Der Weg in die Politik",
    story: "Niemand geht in die Politik, weil er einen ruhigen Abend sucht.",
    question: "Was hat dich in die Politik gebracht?",
    answers: [
      { label: "Ein Unglück", text: "Ein Haus in deiner Heimatstadt stürzte ein. Der Bauunternehmer kam mit einer Geldstrafe davon.", apply: (p) => { p.motiv = "Unglück und Wut über Pfusch"; near(p, "rentner", 1); near(p, "staedtische_saekulare", 1); } },
      { label: "Wut über Korruption", text: "Du hast gesehen, wie Aufträge verteilt werden. Und wer sie bekommt.", apply: (p) => { p.motiv = "Korruption"; near(p, "junge", 2); } },
      { label: "Ein Mentor", text: "Ein alter Bürgermeister nahm dich mit auf Wahlkampftour. Er ist heute dein schärfster Kritiker.", apply: (p) => { p.motiv = "Mentor"; near(p, "konservative", 1); } },
      { label: "Ehrgeiz", text: "Du wolltest es einfach. Wenigstens bist du ehrlich zu dir.", apply: (p) => { p.motiv = "Ehrgeiz"; } },
    ],
  },
  {
    id: "partei",
    title: "Die eigene Partei",
    story: "Die alten Parteien waren dir zu eng, zu müde oder zu sehr mit sich selbst beschäftigt. Also hast du eine neue gegründet.",
    question: "Wofür steht deine Partei?",
    answers: [
      { label: "Aufbruch der Mitte", text: "Wirtschaft, Rechtsstaat, weniger Streit. Für alle, die müde sind vom Kulturkampf.", apply: (p) => { p.partei = { name: "Aufbruchspartei", kurz: "AP", farbe: "#2f5d62" }; near(p, "unternehmer", 3); near(p, "staedtische_saekulare", 3); near(p, "junge", 2); } },
      { label: "Soziale Gerechtigkeit", text: "Löhne, Renten, Wohnungen. Für alle, denen am Monatsende das Geld fehlt.", apply: (p) => { p.partei = { name: "Partei der Gerechtigkeit", kurz: "PG", farbe: "#a23b2a" }; near(p, "arbeitnehmer", 4); near(p, "rentner", 3); near(p, "unternehmer", -2); } },
      { label: "Werte und Wohlstand", text: "Familie, Glaube, ehrliche Arbeit. Konservativ, aber sauber.", apply: (p) => { p.partei = { name: "Partei der Werte", kurz: "PW", farbe: "#b8860b" }; near(p, "konservative", 4); near(p, "landwirte", 2); near(p, "staedtische_saekulare", -2); } },
      { label: "Die Regionen", text: "Mehr Geld und mehr Rechte für die Provinzen, weniger Ankara.", apply: (p) => { p.partei = { name: "Partei der Regionen", kurz: "PR", farbe: "#556b2f" }; near(p, "landwirte", 4); near(p, "junge", 1); } },
    ],
  },
  {
    id: "wahlkampf",
    title: "Der Wahlkampf 2028",
    story: "Achtzehn Monate Kundgebungen, schlechter Tee, gute Umfragen und eine Frage, die dir jeder Berater stellt.",
    question: "Gehst du ein Wahlbündnis ein, und was versprichst du?",
    answers: [
      { label: "Bündnis mit der YENİ Parti", text: "Stark gegen die Regierung, aber ihr Vorsitz erwartet Ministerien.", apply: (p) => { p.buendnis = "YENİ"; p.versprechen.push("Der YENİ Parti wurden zwei Ministerien zugesagt."); } },
      { label: "Bündnis mit der MHP", text: "Die Nationalisten bringen Stimmen in Anatolien und wollen ein hartes Wort in Sicherheitsfragen.", apply: (p) => { p.buendnis = "MHP"; p.versprechen.push("Der MHP wurde ein Mitspracherecht beim Friedensprozess zugesagt."); near(p, "konservative", 2); } },
      { label: "Allein, mit einem großen Versprechen", text: "Kein Bündnis. Dafür das Versprechen: Renten rauf in den ersten hundert Tagen.", apply: (p) => { p.versprechen.push("Rentenerhöhung in den ersten hundert Tagen versprochen."); near(p, "rentner", 3); } },
      { label: "Allein, mit einem harten Versprechen", text: "Kein Bündnis. Dafür: Jede große Vergabe wird öffentlich, jeder Minister legt sein Vermögen offen.", apply: (p) => { p.versprechen.push("Offene Vergaben und Vermögenserklärungen aller Minister versprochen."); near(p, "junge", 2); near(p, "staedtische_saekulare", 2); } },
    ],
  },
  {
    id: "wahlnacht",
    title: "Die Wahlnacht",
    story: "Es ist kurz nach Mitternacht. Die Hochrechnungen schwanken, dein Telefon glüht, deine Familie schläft auf dem Sofa.",
    question: "Wie hast du gewonnen?",
    answers: [
      { label: "Knapp in der Stichwahl", text: "50,6 Prozent. Die Hälfte des Landes hat dich nicht gewollt, und sie sagt es laut.", apply: (p) => { p.wahl = { runde: 2, anteil: 50.6 }; } },
      { label: "Deutlich in der Stichwahl", text: "54 Prozent. Ein klarer Auftrag, aber nach zwei Wahlgängen.", apply: (p) => { p.wahl = { runde: 2, anteil: 54 }; } },
      { label: "Im ersten Wahlgang", text: "51,2 Prozent schon in der ersten Runde. Niemand hatte damit gerechnet, du auch nicht.", apply: (p) => { p.wahl = { runde: 1, anteil: 51.2 }; } },
    ],
  },
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

export interface Parliament {
  shares: Record<string, number>;
  seats: Record<string, number>;
}

/**
 * Parlament 2028: Umfragen, die neue Partei zieht 15 bis 30 % an sich,
 * jeder Anteil schwankt um bis zu ±5 Prozentpunkte. Sitzverteilung vorerst
 * landesweit nach D'Hondt mit 7-%-Hürde (Bündnisse zählen gemeinsam);
 * die Verteilung je Provinz folgt mit den Provinzdaten.
 */
export function electParliament(profile: PlayerProfile, rng: Rng): Parliament {
  const shares: Record<string, number> = { ...POLLS };
  const own = profile.partei.kurz || "EIGENE";
  const gain = rng.between(15, 30);
  const sources = SOURCES[own] ?? { Andere: 1 };
  for (const [party, weight] of Object.entries(sources)) {
    shares[party] = Math.max(0.5, (shares[party] ?? 0) - gain * weight);
  }
  shares[own] = gain;
  for (const k of Object.keys(shares)) shares[k] = Math.max(0.3, shares[k]! + rng.between(-5, 5) * (shares[k]! > 5 ? 1 : 0.2));
  const total = Object.values(shares).reduce((a, b) => a + b, 0);
  for (const k of Object.keys(shares)) shares[k] = (shares[k]! / total) * 100;

  // Sperrklausel: Bündnispartner zählen gemeinsam
  const allianceShare = profile.buendnis ? shares[own]! + (shares[profile.buendnis] ?? 0) : 0;
  const passes = (party: string) =>
    party !== "Andere" &&
    (shares[party]! >= 7 || (profile.buendnis && (party === own || party === profile.buendnis) && allianceShare >= 7));
  const eligible = Object.keys(shares).filter((p) => passes(p));

  const seats: Record<string, number> = Object.fromEntries(eligible.map((p) => [p, 0]));
  for (let s = 0; s < 600; s++) {
    let best = eligible[0]!;
    let bestQ = -1;
    for (const p of eligible) {
      const q = shares[p]! / (seats[p]! + 1);
      if (q > bestQ) {
        bestQ = q;
        best = p;
      }
    }
    seats[best]! += 1;
  }
  return { shares, seats };
}

/** Wirkung des Prologs auf den Weltzustand. */
export function applyProfile(world: World, profile: PlayerProfile): void {
  for (const [group, d] of Object.entries(profile.naehe)) {
    const i = NET.index.get(group);
    if (i === undefined) continue;
    for (let p = 0; p < PROVINCES; p++) {
      const k = i * PROVINCES + p;
      world.net.values[k] = Math.min(100, Math.max(0, world.net.values[k]! + d));
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
export function startAfterElection(world: World, profile: PlayerProfile): void {
  const rng = new Rng(world.rngState);
  world.player = structuredClone(profile);
  world.parliament = electParliament(profile, rng);
  world.rngState = rng.state;
  applyProfile(world, profile);

  const own = profile.partei.kurz;
  const ownSeats = world.parliament.seats[own] ?? 0;
  const allySeats = profile.buendnis ? (world.parliament.seats[profile.buendnis] ?? 0) : 0;
  const bloc = ownSeats + allySeats;
  world.log.push({
    day: world.day,
    date: world.date,
    kind: "ereignis",
    text:
      `${profile.name} gewinnt die Präsidentschaftswahl ${profile.wahl.runde === 1 ? "im ersten Wahlgang" : "in der Stichwahl"} ` +
      `mit ${profile.wahl.anteil.toLocaleString("de-DE")} %. Die ${profile.partei.name} erhält ${ownSeats} von 600 Sitzen` +
      (profile.buendnis ? `, mit dem Bündnispartner ${profile.buendnis} ${bloc}.` : "."),
    why:
      bloc >= 301
        ? "Eine eigene Mehrheit im Parlament: Gesetze und Haushalt sind möglich, Verfassungsänderungen brauchen trotzdem 360 Stimmen."
        : `Keine eigene Mehrheit: Für Gesetze fehlen ${301 - bloc} Stimmen. Es braucht Partner, Absprachen oder Überläufer.`,
  });
  for (const v of profile.versprechen) {
    world.log.push({ day: world.day, date: world.date, kind: "ereignis", text: `Offene Zusage aus dem Wahlkampf: ${v}` });
  }
}
