// Der Wahlkampf als Handlungsphase (INN-5, VERBESSERUNGSPLAN Stufe C): Ab acht Wochen vor der
// Präsidentschaftswahl wird der Modus aktiv — Reisen in die Provinzen (Ortsbezug über die echten
// Provinz-Daten und die Archätypen), themenbezogene Wahlversprechen (werden als Zusagen registriert:
// Glaubwürdigkeits-Effekt jetzt, Bruch-Preis später über das Zusagen-System), Auslandstouren zur
// Diaspora und das TV-Duell mit Vorbereitungskosten. Die Gegenseite tritt mit sichtbarem Profil an:
// Ihre Angriffe treffen umso härter, je mehr echte Probleme rot stehen, und der Spieler sieht die
// Stärke des Gegners nur durch das Bias seiner eigenen Umfragen (sim/umfrage.ts, data/umfrage_institute.ts).
// Die Diaspora wirkt nur hier, weil die Präsidentschaftswahl eine nationale Wahl ist
// (data/diaspora.ts: nurNationaleWahlen; Kommunalwahlen bleiben unberührt).
// Alle Zahlen sind Spielparameter (Platzhalter der Kalibrierung), keine Tatsachenbehauptungen.

import { NET } from "./modell";
import { PROVINCES, nationalAverage } from "./netz";
import { clamp } from "./economy";
import { addDays, formatDateDe } from "./dates";
import { addLog, fmt } from "./log";
import { wirke } from "./wirkung";
import { PROVINZEN, REGION_DE } from "./regional";
import { DELTAS, archetypVon } from "../data/provinz_archetypen";
import { DIASPORA_KAMPAGNE, DIASPORA_LAENDER, DIASPORA_PROFIL } from "../data/diaspora";
import { UMFRAGE_INSTITUTE } from "../data/umfrage_institute";
import { umfrageMessung } from "./umfrage";
import { GRUPPEN } from "./gruppen";
import { landAendern } from "./laender";
import { PARTEI_NAME } from "./fraktionen";
import { figur } from "./figuren";
import { zusagenBilanz } from "./zusagen";
import { zeitungEreignis } from "./zeitung";
import { maxAmtszeiten } from "./amtszeit";
import { t } from "../i18n";
import { Rng } from "./rng";
import type { World } from "./types";
import type { AuslandsTour, WahlkampfZustand } from "./spiel-typen";
import { t as tx } from "../i18n";

export const WAHLKAMPF = {
  /** Tage vor dem Wahltag, ab denen die Phase beginnt (acht Wochen) */
  beginnTage: 56,
  /** Aktionspunkte je Kampagnenwoche */
  apProWoche: 10,
  /** Länge der Kampagnenwoche in Tagen */
  wocheTage: 7,
  /** Während der Phase lädt sich die Aufmerksamkeit schneller auf (Faktor auf die Tages-Regeneration, Anzeige in der Wahlkampf-Zentrale) */
  aufmerksamkeitFaktor: 1.5,
  /** Reisekosten: nah/fern (Regionen im Umkreis der Hauptstadt gegenüber entfernten) */
  reiseApNah: 1,
  reiseApFern: 2,
  /** Grundwirkung eines Provinzbesuchs auf das lokale Vertrauen */
  reiseVertrauen: 2.2,
  /** Bonus je akutem Problem vor Ort (Chance: Der Besuch nimmt den Druck auf) */
  reiseProblemBonus: 0.7,
  /** Verstärkung, wenn ein brennendes Problem den Archätyp der Provinz prägt */
  archetypFaktor: 1.5,
  /** Grundrisiko eines missglückten Besuchs; steigt mit der Zahl brennender Probleme vor Ort */
  reiseRisiko: 0.15,
  reiseRisikoJeProblem: 0.1,
  /** Anteil der Wirkung eines missglückten Besuchs (negativ) */
  reiseRueckschlag: 0.6,
  /** Abnehmender Ertrag: Faktor je bereits geleistetem Besuch derselben Provinz */
  reiseAbnutzung: 0.5,
  /** Wirkung auf die Gruppe, die zum Archätyp der Provinz passt (Anteil an reiseVertrauen) */
  reiseGruppenAnteil: 0.65,
  /** Auslandstour: Kosten und der heimische Fernseheffekt der Bilder voller Hallen im Ausland */
  tourAp: 3,
  tourVertrauen: 1.2,
  tourNationalisten: 1,
  /** Abnehmender Ertrag wiederholter Touren in dasselbe Land */
  tourAbnutzung: 0.5,
  /** Versprechen: Kosten, Grundbeifall der Zielgruppen, Abnutzung je weiterem Versprechen */
  versprechenAp: 1,
  versprechenBeifall: 1.6,
  versprechenAbnutzung: 0.25,
  /** Vertrauens-Bonus eines Versprechens (mit Glaubwürdigkeit gewichtet) */
  versprechenVertrauen: 0.3,
  /** Monate nach der Wahl, in denen ein Versprechen als Zusage fällig wird */
  versprechenFristMonate: 12,
  /** TV-Duell: Tage vor der Wahl, Vorbereitungskosten, Wirkungsrahmen */
  duellTageVorher: 14,
  duellAp: 2,
  duellVorbereitetBonus: 6,
  duellUnvorbereitetMalus: 4,
  duellSigma: 3,
  /** Übertrag des Punkteabstands ins Duell auf die Wechselwähler (Prozentpunkte je Punkt) */
  duellUebertrag: 0.4,
  duellMax: 5,
  /** Anteil des Duell-Effekts, der dauerhaft in die schwankenden Gruppen des Netzes fließt */
  duellNetzAnteil: 0.5,
  /** Gegner-Angriffe je Woche: Basis, Zuschlag je akutem Problem-Block, Deckel je Woche und insgesamt */
  angriffBasis: 0.45,
  angriffJeLast: 2.6,
  angriffBasisOhneLast: 0.5,
  angriffDeckelWoche: 1.5,
  angriffDeckelGesamt: 6,
  /** Ab dieser Stärke berichtet die Zeitung über einen Angriff (Eilmeldung im Framing der Cluster) */
  angriffZeitungAb: 1.0,
  /** Länge des Umfrage-Tickers */
  tickerLaenge: 8,
  /** Letzte Amtszeit: Der Präsident wirbt für den Nachfolger des Lagers. Anteil seiner Wirkung, der auf Reisen und Versprechen übergeht */
  nachfolgerUebertrag: 0.7,
  /** Auftritte für den Nachfolger: Kosten in Aktionspunkten, Höchstzahl je Art, Abnutzung je weiterem Auftritt derselben Art, Deckel je Auftritt in Prozentpunkten */
  auftrittGemeinsamAp: 2,
  auftrittAlleinAp: 1,
  auftrittGemeinsamMax: 2,
  auftrittAlleinMax: 3,
  auftrittAbnutzung: 0.7,
  auftrittGemeinsamDeckel: 1.2,
  auftrittAlleinDeckel: 0.8,
  /** TV-Duell des Nachfolgers: Gewicht seiner eigenen Strahlkraft gegenüber der Zustimmung des Präsidenten */
  nachfolgerDuellStaerke: 0.6,
} as const;

/** Schwierigkeits-Faktor für die Gegner-Stärke; spiegelt `haerte` aus SCHWIERIGKEITEN (sim/spiel.ts), ohne das Modul zu laden. */
function gegnerHaerte(w: World): number {
  const s = w.spiel?.schwierigkeit;
  return s === "hart" ? 1.2 : s === "entspannt" ? 0.9 : 1;
}

// ---------------------------------------------------------------------------
// Phase und Zustand

/** Ob der Wahlkampf gerade läuft. */
export function wahlkampfAktiv(w: World): boolean {
  const sp = w.spiel;
  return !!sp && !sp.ende && sp.wahlkampf !== undefined;
}

/** Wer kämpft: der Präsident für sich oder, in der letzten Amtszeit, für den Nachfolger des Lagers. */
export function wahlkampfRolle(w: World): "amt" | "nachfolger" {
  return w.spiel?.wahlkampf?.rolle ?? "amt";
}

/** Der Nachfolger, für den geworben wird (nur im Nachfolger-Wahlkampf und nach der Kür). */
export function nachfolgerImWahlkampf(w: World): { name: string; rolle: string; staerke: number } | undefined {
  if (wahlkampfRolle(w) !== "nachfolger") return undefined;
  const n = w.spiel?.nachfolge?.nachfolger;
  return n ? { name: n.name, rolle: n.rolle, staerke: n.staerke } : undefined;
}

/** Der Zustand des laufenden Wahlkampfs (undefined außerhalb der Phase). */
export function wahlkampfVon(w: World): WahlkampfZustand | undefined {
  return w.spiel?.wahlkampf;
}

/** Faktor auf die tägliche Aufladung der Aufmerksamkeit (sim/aufmerksamkeit.ts liest das hier). */
export function aufmerksamkeitsFaktor(w: World): number {
  return wahlkampfAktiv(w) ? WAHLKAMPF.aufmerksamkeitFaktor : 1;
}

// ---------------------------------------------------------------------------
// Reisen: Ortsbezug über Provinz-Daten und Archätypen

/** Regionen im Umkreis der Hauptstadt: eine Reise dorthin kostet weniger (Spielparameter der Entfernung). */
const NAHE_REGIONEN = new Set(["İç Anadolu", "Marmara", "Karadeniz"]);

/** Aktionspunkte-Kosten eines Besuchs in der Provinz (1 bis 2, je nach Entfernung). */
export function reiseKosten(plaka: number): number {
  const p = PROVINZEN[plaka - 1];
  return p !== undefined && NAHE_REGIONEN.has(p.region) ? WAHLKAMPF.reiseApNah : WAHLKAMPF.reiseApFern;
}

/** Die Wählergruppe, die in einem Provinz-Archätyp besonders zählt (Ortsbezug der Reisen). */
const ARCHETYP_GRUPPE: Record<number, string> = {
  1: "staedtische_saekulare", // Metropol-Industrie-Kern
  2: "arbeitnehmer", // Industrie- und Hafen-Gürtel (2. Reihe)
  3: "unternehmer", // Tourismus-Küste
  4: "konservative", // Anatolische Mittelstädte / Tiger
  5: "landwirte", // Agrar-Steppe İç Ege/Zentralanatolien
  6: "landwirte", // Karadeniz-Fındık-Peripherie
  7: "minderheiten", // Südost/GAP
  8: "arme", // Ost-Anatolien peripher
};

/** Akute (rote) Probleme in einer Provinz, mit Namen. */
export function akuteProblemeIn(w: World, plaka: number): { id: string; name: string }[] {
  const out: { id: string; name: string }[] = [];
  for (const node of NET.nodes) {
    if (node.kind !== "problem" || !node.threshold) continue;
    const i = NET.index.get(node.id)!;
    if (w.net.values[i * PROVINCES + plaka - 1]! >= node.threshold) out.push({ id: node.id, name: node.name });
  }
  return out;
}

/** Ob ein brennendes Problem den Archätyp der Provinz prägt (|Delta| mindestens 5 in der Archätyp-Matrix). */
export function archetypRelevant(w: World, plaka: number): boolean {
  const arch = archetypVon(plaka);
  if (!arch) return false;
  return akuteProblemeIn(w, plaka).some((pr) => Math.abs(DELTAS[pr.id]?.[arch.id - 1] ?? 0) >= 5);
}

/** Erwartete Stärke eines Besuchs vor Abnutzung und Risiko, für die Anzeige. */
export function reiseVorschau(w: World, plaka: number): { staerke: number; risiko: number; probleme: string[]; relevant: boolean; abnutzung: number } {
  const k = wahlkampfVon(w);
  const probleme = akuteProblemeIn(w, plaka);
  const relevant = archetypRelevant(w, plaka);
  const besuche = k?.besuche[String(plaka)] ?? 0;
  const staerke = (WAHLKAMPF.reiseVertrauen + WAHLKAMPF.reiseProblemBonus * probleme.length) * (relevant ? WAHLKAMPF.archetypFaktor : 1);
  return {
    staerke,
    risiko: probleme.length > 0 ? WAHLKAMPF.reiseRisiko + WAHLKAMPF.reiseRisikoJeProblem * probleme.length : 0,
    probleme: probleme.map((p) => p.name),
    relevant,
    abnutzung: Math.pow(WAHLKAMPF.reiseAbnutzung, besuche),
  };
}

export interface AktionErgebnis {
  ok: boolean;
  text: string;
}

/** Eine Kampagnenreise in eine Provinz: lokale Zustimmung, Stärke und Risiko aus dem lokalen Problemstand. */
export function reise(w: World, plaka: number, rng: Rng): AktionErgebnis {
  const sp = w.spiel;
  const k = sp?.wahlkampf;
  if (!sp || sp.ende || !k) return { ok: false, text: tx("sim2.sim.wahlkampf.f25e0a2") };
  const provinz = PROVINZEN[plaka - 1];
  if (!provinz) return { ok: false, text: "Unbekannte Provinz." };
  const kosten = reiseKosten(plaka);
  if (k.ap < kosten) return { ok: false, text: tx("sim2.sim.wahlkampf.09a4a0d", { p0: kosten, p1: fmt(k.ap) }) };

  const vorschau = reiseVorschau(w, plaka);
  const missglueckt = vorschau.probleme.length > 0 && rng.next() < vorschau.risiko;
  const uebertrag = k.rolle === "nachfolger" ? WAHLKAMPF.nachfolgerUebertrag : 1;
  const effekt = (missglueckt ? -WAHLKAMPF.reiseRueckschlag : 1) * vorschau.staerke * vorschau.abnutzung * uebertrag;

  k.ap -= kosten;
  k.besuche[String(plaka)] = (k.besuche[String(plaka)] ?? 0) + 1;
  k.reisen.push({ plaka, tag: w.day, effekt: Math.round(effekt * 10) / 10, missglueckt });

  wirke(w, "vertrauen_regierung", effekt, [plaka]);
  const arch = archetypVon(plaka);
  const gruppe = arch ? ARCHETYP_GRUPPE[arch.id] : undefined;
  if (gruppe) wirke(w, gruppe, effekt * WAHLKAMPF.reiseGruppenAnteil, [plaka]);

  const wiederholt = (k.besuche[String(plaka)] ?? 0) > 1;
  let text: string;
  if (missglueckt) {
    text = tx("sim2.sim.wahlkampf.aec3c03", { p0: provinz.name, p1: vorschau.probleme[0]! });
  } else if (vorschau.probleme.length > 0) {
    text = tx("sim2.sim.wahlkampf.f4336f4", { p0: provinz.name, p1: vorschau.probleme[0]!, p2: vorschau.relevant ? ", und weil die Lage die Provinz prägt, trägt es umso mehr" : "" });
  } else {
    text = tx("sim2.sim.wahlkampf.d077e0d", { p0: provinz.name });
  }
  if (wiederholt) text += tx("sim2.sim.wahlkampf.442999b");
  addLog(
    w,
    "entscheidung",
    tx("sim2.sim.wahlkampf.63941c7", { p0: provinz.name, p1: kosten }),
    `${text} Lokales Vertrauen ${effekt >= 0 ? "+" : "−"}${fmt(Math.abs(effekt))}.`,
  );
  return { ok: true, text };
}

// ---------------------------------------------------------------------------
// Auslandstour: der Diaspora-Block (nur nationale Wahlen, data/diaspora.ts)

export type TourLand = AuslandsTour["land"];

/** Die vier bereisbaren Länder der Diaspora-Kampagne mit ihren Daten. */
export const TOUR_LAENDER: { land: TourLand; name: string; modifikatorPp: number; anteilWaehler: number }[] = (
  [
    ["deutschland", "Deutschland"],
    ["belgien", "Belgien"],
    ["frankreich", "Frankreich"],
    ["niederlande", "Niederlande"],
  ] as const
).map(([land, name]) => {
  const profil = DIASPORA_LAENDER.find((l) => l.land === land)!;
  return { land, name, modifikatorPp: profil.lagerModifikatorPp, anteilWaehler: profil.anteilWaehler };
});

/** Eine Auslandstour zur Diaspora: Mobilisierung des Blocks, heimischer Fernseheffekt, Risiko eines Auftrittsverbots. */
export function auslandstour(w: World, land: TourLand, rng: Rng): AktionErgebnis {
  const sp = w.spiel;
  const k = sp?.wahlkampf;
  if (!sp || sp.ende || !k) return { ok: false, text: tx("sim2.sim.wahlkampf.f25e0a2") };
  const ziel = TOUR_LAENDER.find((t) => t.land === land);
  if (!ziel) return { ok: false, text: "Unbekanntes Zielland." };
  if (k.ap < WAHLKAMPF.tourAp) return { ok: false, text: tx("sim2.sim.wahlkampf.7f397a4", { p0: WAHLKAMPF.tourAp, p1: fmt(k.ap) }) };

  const bisher = k.touren.filter((t) => t.land === land).length;
  const abnutzung = Math.pow(WAHLKAMPF.tourAbnutzung, bisher);
  // Reichweite: Der Anteil des Landes an den Auslandswählern bestimmt, wie breit die Mobilisierung wirkt
  const reichweite = clamp(ziel.anteilWaehler / 0.17, 0.4, 2.6);
  let beteiligungPlus = rng.between(DIASPORA_KAMPAGNE.beteiligungPlusPp.min, DIASPORA_KAMPAGNE.beteiligungPlusPp.max) * reichweite * abnutzung;
  let lagerPlus = rng.between(DIASPORA_KAMPAGNE.lagerPlusPp.min, DIASPORA_KAMPAGNE.lagerPlusPp.max) * abnutzung;
  const verbot = rng.next() < DIASPORA_KAMPAGNE.auftrittsverbotChance;
  let verbotText = "";
  if (verbot) {
    // Einreise-/Auftrittsverbot des Gastlands: Beziehung leidet, das Belagerungs-Narrativ heizt die Beteiligung an (2017-Muster)
    const beziehung = rng.between(DIASPORA_KAMPAGNE.beziehungGastland.min, DIASPORA_KAMPAGNE.beziehungGastland.max);
    landAendern(w, "EU", { vertrauen: beziehung, konflikt: 4 }, tx("sim2.sim.wahlkampf.08a765f", { p0: ziel.name }));
    beteiligungPlus += DIASPORA_KAMPAGNE.belagerungBeteiligungPp;
    verbotText = tx("sim2.sim.wahlkampf.f7a815d", { p0: ziel.name });
  }
  beteiligungPlus = Math.round(beteiligungPlus * 10) / 10;
  lagerPlus = Math.round(lagerPlus * 10) / 10;

  k.ap -= WAHLKAMPF.tourAp;
  k.touren.push({ land, tag: w.day, beteiligungPlus, lagerPlus, verbot });
  // Heimischer Fernseheffekt: volle Hallen im Ausland sind auch im Inland Bilder
  wirke(w, "vertrauen_regierung", WAHLKAMPF.tourVertrauen);
  wirke(w, "nationalisten", WAHLKAMPF.tourNationalisten);

  const text = tx("sim2.sim.wahlkampf.8f7e132", { p0: ziel.name, p1: beteiligungPlus >= 0 ? "+" : "−", p2: fmt(Math.abs(beteiligungPlus)), p3: fmt(lagerPlus), p4: verbotText });
  addLog(w, "entscheidung", `Auslandstour: ${ziel.name} (${WAHLKAMPF.tourAp} AP).`, text);
  return { ok: true, text };
}

/** Der Diaspora-Block bei der Wahl: registrierte Auslandswähler × Beteiligung × Lager-Modifikator (Recherche 6.1). */
export function diasporaBlock(w: World, inlandZustimmung: number): { beitrag: number; beteiligung: number; lagerAnteil: number; effektivAnteil: number } {
  const touren = w.spiel?.wahlkampf?.touren ?? [];
  const beteiligungPlus = touren.reduce((s, t) => s + t.beteiligungPlus, 0);
  const lagerPlus = touren.reduce((s, t) => s + t.lagerPlus, 0);
  const p = DIASPORA_PROFIL;
  const beteiligung = clamp(p.beteiligung + beteiligungPlus / 100, p.beteiligungKorridor.min, 0.75);
  const effektivAnteil = p.anteilStimmen * (beteiligung / p.beteiligung);
  // Lager-Anteil im Ausland: Inlandswert + Modifikator gegenüber dem Inland + dauerhaftes Medien-Polster + Kampagne
  const lagerAnteil = clamp(inlandZustimmung + p.lagerModifikatorInlandPp + p.medienPolsterPp + lagerPlus, 0, 100);
  return { beitrag: effektivAnteil * (lagerAnteil - inlandZustimmung), beteiligung, lagerAnteil, effektivAnteil };
}

// ---------------------------------------------------------------------------
// Versprechen: themenbezogene Wahlversprechen, die zu Zusagen werden

export interface VersprechenDef {
  id: string;
  titel: string;
  text: string;
  massnahme: string;
  richtung: 1 | -1;
  /** Gruppen, die sofort Beifall spenden */
  zielgruppen: string[];
  /** Gruppen, die sich düpiert fühlen (halber Malus) */
  verlierer?: string[];
}

/** Der Katalog der Wahlversprechen: zwölf Themen, die im Netz echte Maßnahmen sind. */
export const VERSPRECHEN: VersprechenDef[] = [
  { id: "v_mindestlohn", titel: tx("sim2.sim.wahlkampf.ab350d8"), text: tx("sim2.sim.wahlkampf.b69b504"), massnahme: "m_mindestlohn", richtung: 1, zielgruppen: ["arbeitnehmer", "arme"], verlierer: ["unternehmer"] },
  { id: "v_renten", titel: tx("sim2.sim.wahlkampf.309421e"), text: tx("sim2.sim.wahlkampf.d6a5e75"), massnahme: "m_renten", richtung: 1, zielgruppen: ["rentner"] },
  { id: "v_mietdeckel", titel: tx("sim2.sim.wahlkampf.d32b643"), text: tx("sim2.sim.wahlkampf.88b703d"), massnahme: "m_mietdeckel", richtung: 1, zielgruppen: ["staedtische_saekulare", "arme"], verlierer: ["unternehmer"] },
  { id: "v_mwst", titel: "Mehrwertsteuer senken", text: tx("sim2.sim.wahlkampf.83c6d40"), massnahme: "m_mwst", richtung: -1, zielgruppen: ["arme", "arbeitnehmer", "landwirte"] },
  { id: "v_energie", titel: "Energiepreise deckeln", text: tx("sim2.sim.wahlkampf.58a8fe9"), massnahme: "m_energiesubventionen", richtung: 1, zielgruppen: ["arme", "landwirte", "arbeitnehmer"] },
  { id: "v_megaprojekt", titel: tx("sim2.sim.wahlkampf.7110a7a"), text: tx("sim2.sim.wahlkampf.1fe9b67"), massnahme: "m_autobahnen", richtung: 1, zielgruppen: ["konservative", "unternehmer"], verlierer: ["staedtische_saekulare"] },
  { id: "v_kindergeld", titel: tx("sim2.sim.wahlkampf.1835bef"), text: tx("sim2.sim.wahlkampf.86b5726"), massnahme: "m_kindergeld", richtung: 1, zielgruppen: ["konservative", "arme"] },
  { id: "v_agrar", titel: "Agrarsubventionen ausbauen", text: tx("sim2.sim.wahlkampf.140b806"), massnahme: "m_agrarsubventionen", richtung: 1, zielgruppen: ["landwirte"] },
  { id: "v_wohnen", titel: "Staatlicher Wohnungsbau", text: tx("sim2.sim.wahlkampf.10adff1"), massnahme: "m_sozialwohnungen", richtung: 1, zielgruppen: ["arme", "junge"] },
  { id: "v_korruption", titel: tx("sim2.sim.wahlkampf.c686cce"), text: tx("sim2.sim.wahlkampf.b87ccee"), massnahme: "m_antikorruption", richtung: 1, zielgruppen: ["staedtische_saekulare", "junge"] },
  { id: "v_stipendien", titel: tx("sim2.sim.wahlkampf.d234195"), text: tx("sim2.sim.wahlkampf.af34ce0"), massnahme: "m_stipendien", richtung: 1, zielgruppen: ["junge"] },
  { id: "v_sicherheit", titel: tx("sim2.sim.wahlkampf.07306a3"), text: tx("sim2.sim.wahlkampf.a39b57e"), massnahme: "m_polizei", richtung: 1, zielgruppen: ["nationalisten", "konservative"], verlierer: ["minderheiten"] },
];

export function versprechenDef(id: string): VersprechenDef | undefined {
  return VERSPRECHEN.find((v) => v.id === id);
}

/** Faktor der Glaubwürdigkeit auf den sofortigen Beifall: Wer viel bricht, dem glaubt man weniger; und jedes weitere Versprechen nutzt sich ab. */
export function versprechenGlaube(w: World): { glaubwuerdigkeit: number; abnutzung: number; faktor: number } {
  const b = zusagenBilanz(w);
  const glaubwuerdigkeit = 0.4 + 0.6 * (b.glaubwuerdigkeit / 100);
  const abnutzung = 1 / (1 + WAHLKAMPF.versprechenAbnutzung * (w.spiel?.wahlkampf?.versprechen.length ?? 0));
  return { glaubwuerdigkeit, abnutzung, faktor: glaubwuerdigkeit * abnutzung };
}

/** Ein Wahlversprechen geben: Beifall jetzt (mit Glaubwürdigkeit gewichtet), Zusage mit Frist zwölf Monate nach der Wahl. */
export function verspreche(w: World, id: string): AktionErgebnis {
  const sp = w.spiel;
  const k = sp?.wahlkampf;
  if (!sp || sp.ende || !k) return { ok: false, text: tx("sim2.sim.wahlkampf.f25e0a2") };
  const def = versprechenDef(id);
  if (!def) return { ok: false, text: "Unbekanntes Versprechen." };
  if (k.versprechen.includes(id)) return { ok: false, text: tx("sim2.sim.wahlkampf.0785331") };
  if (k.ap < WAHLKAMPF.versprechenAp) return { ok: false, text: tx("sim2.sim.wahlkampf.e5bc76a", { p0: WAHLKAMPF.versprechenAp, p1: fmt(k.ap) }) };

  const { faktor, glaubwuerdigkeit } = versprechenGlaube(w);
  const nachfolgerRolle = k.rolle === "nachfolger";
  const beifall = WAHLKAMPF.versprechenBeifall * faktor * (nachfolgerRolle ? WAHLKAMPF.nachfolgerUebertrag : 1);
  for (const g of def.zielgruppen) wirke(w, g, beifall);
  for (const g of def.verlierer ?? []) wirke(w, g, -beifall * 0.5);
  wirke(w, "vertrauen_regierung", WAHLKAMPF.versprechenVertrauen * glaubwuerdigkeit);

  k.ap -= WAHLKAMPF.versprechenAp;
  k.versprechen.push(id);
  // Das Versprechen wird zur Zusage: Frist zwölf Monate nach der Wahl; das Zusagen-System bucht Halten und Brechen.
  // Im Nachfolger-Wahlkampf verspricht der Nachfolger, nicht der Präsident: Seine Amtszeit endet mit der Wahl, es entsteht keine Zusage.
  if (!nachfolgerRolle) sp.zusagen.push({
    id: `z-wahl-${id}`,
    von: tx("sim2.sim.wahlkampf.dc43faf"),
    text: `Im Wahlkampf versprochen: ${def.titel}`,
    faellig: sp.wahltag + Math.round(WAHLKAMPF.versprechenFristMonate * 30.4),
    massnahme: def.massnahme,
    richtung: def.richtung,
    erfuellt: false,
    gebrochen: false,
  });

  const text = tx("sim2.sim.wahlkampf.861854f", { p0: def.titel, p1: faktor >= 0.8 ? "ist groß" : faktor >= 0.5 ? "fällt spürbar aus" : "bleibt mager — die Glaubwürdigkeit ist angeschlagen", p2: formatDateDe(addDays(w.date, sp.wahltag + Math.round(WAHLKAMPF.versprechenFristMonate * 30.4) - w.day)) });
  addLog(w, "entscheidung", `Wahlversprechen: ${def.titel} (${WAHLKAMPF.versprechenAp} AP).`, text);
  return { ok: true, text };
}

// ---------------------------------------------------------------------------
// Auftritte für den Nachfolger (nur in der letzten Amtszeit)

export type AuftrittArt = "gemeinsam" | "allein";

/** Was der nächste Auftritt dieser Art brächte (Prozentpunkte am Wahltag, nach Abnutzung und Deckel) und was er kostet. */
export function auftrittVorschau(w: World, art: AuftrittArt): { punkte: number; ap: number; uebrig: number; max: number } {
  const sp = w.spiel;
  const k = sp?.wahlkampf;
  const n = nachfolgerImWahlkampf(w);
  const max = art === "gemeinsam" ? WAHLKAMPF.auftrittGemeinsamMax : WAHLKAMPF.auftrittAlleinMax;
  const ap = art === "gemeinsam" ? WAHLKAMPF.auftrittGemeinsamAp : WAHLKAMPF.auftrittAlleinAp;
  const gemacht = k?.nachfolgerAuftritte?.[art] ?? 0;
  if (!sp || !n) return { punkte: 0, ap, uebrig: 0, max };
  // Gemeinsam: Die Beliebtheit des Präsidenten färbt ab (auch ins Negative). Allein: Die Strahlkraft des Nachfolgers selbst zählt.
  const roh = art === "gemeinsam" ? (sp.umfrage.zustimmung - 50) / 25 : (n.staerke - 55) / 40;
  const deckel = art === "gemeinsam" ? WAHLKAMPF.auftrittGemeinsamDeckel : WAHLKAMPF.auftrittAlleinDeckel;
  const punkte = Math.round(clamp(roh, -deckel, deckel) * Math.pow(WAHLKAMPF.auftrittAbnutzung, gemacht) * 100) / 100;
  return { punkte, ap, uebrig: Math.max(0, max - gemacht), max };
}

/** Ein Auftritt für den Nachfolger: gemeinsam mit dem Präsidenten oder der Nachfolger allein. */
export function nachfolgerAuftritt(w: World, art: AuftrittArt): AktionErgebnis {
  const sp = w.spiel;
  const k = sp?.wahlkampf;
  if (!sp || sp.ende || !k) return { ok: false, text: t("enden.wk.auftritt.kein_wahlkampf") };
  const n = nachfolgerImWahlkampf(w);
  if (k.rolle !== "nachfolger" || !n) return { ok: false, text: t("enden.wk.auftritt.kein_nachfolger") };
  const a = (k.nachfolgerAuftritte ??= { gemeinsam: 0, allein: 0, punkte: 0 });
  const v = auftrittVorschau(w, art);
  if (v.uebrig <= 0) return { ok: false, text: t("enden.wk.auftritt.max", { n: v.max }) };
  if (k.ap < v.ap) return { ok: false, text: t("enden.wk.auftritt.zu_wenig", { kosten: v.ap, ap: fmt(k.ap) }) };
  k.ap -= v.ap;
  a[art] += 1;
  a.punkte = Math.round((a.punkte + v.punkte) * 100) / 100;
  const text = t(`enden.wk.auftritt.${art}.${v.punkte >= 0 ? "gut" : "schlecht"}`, { name: n.name });
  addLog(w, "entscheidung", t(`enden.wk.auftritt.${art}.log`, { name: n.name, ap: v.ap }), t("enden.wk.auftritt.ergebnis", { text, punkte: v.punkte }));
  return { ok: true, text };
}

// ---------------------------------------------------------------------------
// Der Gegner: Oppositions-Kandidat mit sichtbarem Profil

export interface GegnerProfil {
  name: string;
  partei: string;
  parteiName: string;
  /** Sichtbar nur durch das Bias der eigenen Umfragen: 100 minus letzte Ticker-Messung (null vor der ersten Messung) */
  staerkeSicht: number | null;
  institut?: string;
  hausBias?: number;
}

/** Die größte Oppositionsfraktion außerhalb des Regierungslagers. */
export function gegnerPartei(w: World): string {
  const eigene = w.player?.partei.kurz;
  const lager = new Set([eigene, ...(w.spiel?.lager ?? [])]);
  let best = "";
  let sitze = -1;
  for (const [p, s] of Object.entries(w.parliament?.seats ?? {})) {
    if (lager.has(p)) continue;
    if (s > sitze) {
      best = p;
      sitze = s;
    }
  }
  return best || "CHP";
}

/** Die wahre Stärke des Gegners (intern): das, was nicht beim Präsidenten liegt, gewichtet mit der Schwierigkeit. */
export function gegnerStaerkeWahr(w: World): number {
  const z = w.spiel?.umfrage.zustimmung ?? 50;
  return clamp(100 - z + 6 * (gegnerHaerte(w) - 1), 0, 100);
}

/** Das sichtbare Profil des Gegners: Der Spieler sieht die Stärke nur gespiegelt durch seine letzte Umfrage (mit deren Bias). */
export function gegnerProfil(w: World): GegnerProfil {
  const k = wahlkampfVon(w);
  const partei = gegnerPartei(w);
  const f = figur(w, "opposition");
  const letzte = k?.ticker[k.ticker.length - 1];
  return {
    name: f ? `${f.rolle} ${f.name}` : tx("sim2.sim.wahlkampf.0bbe99a"),
    partei,
    parteiName: PARTEI_NAME[partei] ?? partei,
    staerkeSicht: letzte ? Math.round((100 - letzte.wert) * 10) / 10 : null,
    ...(letzte ? { institut: letzte.institut, hausBias: letzte.hausBias } : {}),
  };
}

// ---------------------------------------------------------------------------
// Das TV-Duell

/** Die Vorbereitung auf das TV-Duell (kostet Aktionspunkte; unvorbereitet hineinzugehen ist das Risiko). */
export function duellVorbereiten(w: World): AktionErgebnis {
  const sp = w.spiel;
  const k = sp?.wahlkampf;
  if (!sp || sp.ende || !k) return { ok: false, text: tx("sim2.sim.wahlkampf.f25e0a2") };
  if (k.duell.tag !== undefined) return { ok: false, text: tx("sim2.sim.wahlkampf.7d82e99") };
  if (k.duell.vorbereitet > 0) return { ok: false, text: tx("sim2.sim.wahlkampf.d9fc1da") };
  if (k.ap < WAHLKAMPF.duellAp) return { ok: false, text: tx("sim2.sim.wahlkampf.3d54c56", { p0: WAHLKAMPF.duellAp, p1: fmt(k.ap) }) };
  k.ap -= WAHLKAMPF.duellAp;
  k.duell.vorbereitet = 1;
  const text = tx("sim2.sim.wahlkampf.f94dad3");
  addLog(w, "entscheidung", `TV-Duell: Vorbereitung (${WAHLKAMPF.duellAp} AP).`, text);
  return { ok: true, text };
}

/** Die Szene des Duells, wenn der Nachfolger antritt (Texte über die Übersetzungsschicht). */
function duellSzeneNachfolger(w: World, effekt: number, name: string): string {
  const g = gegnerProfil(w);
  const gegner = g.name.replace(/^Oppositionsführer /, "");
  const stufe = effekt >= 2.5 ? "klar" : effekt >= 0.5 ? "vorn" : effekt > -0.5 ? "gleich" : effekt > -2.5 ? "hinten" : "desaster";
  return t(`enden.duell.nachfolger.${stufe}`, { name, gegner });
}

function duellSzene(w: World, effekt: number, vorbereitet: boolean): string {
  const g = gegnerProfil(w);
  const sw = schwachstelle(w);
  const name = g.name.replace(/^Oppositionsführer /, "");
  if (effekt >= 2.5) return tx("sim2.sim.wahlkampf.0130b22", { p0: name, p1: sw ? ` zu ${sw.name}` : "" });
  if (effekt >= 0.5) return tx("sim2.sim.wahlkampf.bed8297", { p0: name });
  if (effekt > -0.5) return tx("sim2.sim.wahlkampf.8b28357");
  if (effekt > -2.5) return tx("sim2.sim.wahlkampf.70d547e", { p0: name, p1: sw ? sw.name : "der Bilanz", p2: vorbereitet ? "Ohne die Proben wäre es schlimmer geworden." : "Die fehlende Vorbereitung zeigt sich in jeder zweiten Antwort." });
  return tx("sim2.sim.wahlkampf.5f498a2", { p0: name, p1: sw ? ` — ${sw.name} zuerst` : "", p2: vorbereitet ? "Auch die Vorbereitung rettet den Abend nicht mehr." : "Unvorbereitet in ein Duell zu gehen, hat seinen Preis." });
}

function duellAustragen(w: World, rng: Rng): void {
  const sp = w.spiel!;
  const k = sp.wahlkampf!;
  const vorbereitet = k.duell.vorbereitet > 0;
  const nachfolger = nachfolgerImWahlkampf(w);
  // Im Nachfolger-Wahlkampf tritt der Nachfolger an: seine eigene Strahlkraft trägt, die Zustimmung des Präsidenten wirkt nur teilweise
  const basisWert = nachfolger ? WAHLKAMPF.nachfolgerDuellStaerke * nachfolger.staerke + (1 - WAHLKAMPF.nachfolgerDuellStaerke) * sp.umfrage.zustimmung : sp.umfrage.zustimmung;
  const spielerWert = basisWert + (vorbereitet ? WAHLKAMPF.duellVorbereitetBonus : -WAHLKAMPF.duellUnvorbereitetMalus) + rng.normal(WAHLKAMPF.duellSigma);
  const gegnerWert = gegnerStaerkeWahr(w) + rng.normal(WAHLKAMPF.duellSigma);
  const effekt = Math.round(clamp((spielerWert - gegnerWert) * WAHLKAMPF.duellUebertrag, -WAHLKAMPF.duellMax, WAHLKAMPF.duellMax) * 10) / 10;
  k.duell.tag = w.day;
  k.duell.effekt = effekt;
  k.duell.szene = nachfolger ? duellSzeneNachfolger(w, effekt, nachfolger.name) : duellSzene(w, effekt, vorbereitet);
  // Effekt auf die Wechselwähler: die schwankenden Gruppen (Laune zwischen den Schwellen) kippen ein Stück
  for (const g of GRUPPEN) {
    const laune = nationalAverage(NET, w.net, g.id);
    if (laune >= 45 && laune < 58) wirke(w, g.id, effekt * WAHLKAMPF.duellNetzAnteil);
  }
  sp.hinweise.push({
    id: `wahlkampf-duell-${w.day}`,
    titel: `TV-Duell: ${effekt >= 0 ? "+" : "−"}${fmt(Math.abs(effekt))} Prozentpunkte`,
    szene: "wahlnacht",
    text: [
      k.duell.szene,
      tx("sim2.sim.wahlkampf.0724d47", { p0: effekt >= 0 ? "+" : "−", p1: fmt(Math.abs(effekt)), p2: vorbereitet ? "Die Vorbereitung hat sich bezahlt gemacht." : "Vorbereitung hätte den Ausgang womöglich gedreht." }),
    ],
  });
  addLog(w, "ereignis", `TV-Duell ${effekt >= 0 ? "gewonnen" : "verloren"} (${effekt >= 0 ? "+" : "−"}${fmt(Math.abs(effekt))} Prozentpunkte).`, k.duell.szene);
}

// ---------------------------------------------------------------------------
// Gegner-Angriffe und Umfrage-Ticker (Wochenrhythmus)

export interface Schwachstelle {
  id: string;
  name: string;
  /** Bevölkerungsanteil in Provinzen, in denen das Problem akut ist */
  last: number;
  provinzen: number;
}

/** Die größte echte Schwachstelle: das akute Problem mit der größten betroffenen Bevölkerung. */
export function schwachstelle(w: World): Schwachstelle | null {
  let worst: Schwachstelle | null = null;
  for (const node of NET.nodes) {
    if (node.kind !== "problem" || !node.threshold) continue;
    const i = NET.index.get(node.id)!;
    let last = 0;
    let n = 0;
    for (let p = 0; p < PROVINCES; p++) {
      if (w.net.values[i * PROVINCES + p]! >= node.threshold) {
        last += w.net.weights[p]!;
        n++;
      }
    }
    if (last > 0 && (worst === null || last > worst.last)) worst = { id: node.id, name: node.name, last, provinzen: n };
  }
  return worst;
}

function tickerWoche(w: World, rng: Rng): void {
  const sp = w.spiel!;
  const k = sp.wahlkampf!;
  const wocheIndex = Math.round((w.day - k.beginn) / WAHLKAMPF.wocheTage);
  const institut = UMFRAGE_INSTITUTE[wocheIndex % UMFRAGE_INSTITUTE.length]!;
  const wert = umfrageMessung(sp.umfrage.zustimmung, rng, { institutId: institut.id });
  k.ticker.push({ tag: w.day, institutId: institut.id, institut: institut.name, wert: Math.round(wert * 10) / 10, hausBias: institut.hausBias });
  if (k.ticker.length > WAHLKAMPF.tickerLaenge) k.ticker.shift();
}

function angriffWoche(w: World): void {
  const sp = w.spiel!;
  const k = sp.wahlkampf!;
  const g = gegnerProfil(w);
  const sw = schwachstelle(w);
  // Rote Probleme machen den Angriff wirksamer; ohne echte Schwachstelle verpufft er weitgehend
  let staerke = (sw ? WAHLKAMPF.angriffBasis + WAHLKAMPF.angriffJeLast * sw.last : WAHLKAMPF.angriffBasis * WAHLKAMPF.angriffBasisOhneLast) * gegnerHaerte(w);
  staerke = Math.min(staerke, WAHLKAMPF.angriffDeckelWoche);
  staerke = Math.max(0, Math.min(staerke, WAHLKAMPF.angriffDeckelGesamt + k.angriffe));
  if (staerke <= 0) return;
  k.angriffe = Math.round((k.angriffe - staerke) * 100) / 100;
  const thema = sw ? sw.name : tx("sim2.sim.wahlkampf.b07cd18");
  k.angriffeLog.push({ tag: w.day, thema, staerke: Math.round(staerke * 100) / 100 });
  if (k.angriffeLog.length > 12) k.angriffeLog.shift();
  addLog(
    w,
    "ereignis",
    `${g.name} greift an: ${thema}.`,
    sw ? tx("sim2.sim.wahlkampf.929fae7", { p0: sw.provinzen, p1: sw.provinzen === 1 ? "Provinz" : "Provinzen", p2: fmt(staerke) }) : tx("sim2.sim.wahlkampf.45109a2", { p0: fmt(staerke) }),
  );
  // Die Zeitung berichtet im Framing ihrer Cluster, wenn der Angriff trifft
  if (staerke >= WAHLKAMPF.angriffZeitungAb && sw) {
    zeitungEreignis(w, {
      art: "krise",
      titel: tx("sim2.sim.wahlkampf.a660e48"),
      fakt: tx("sim2.sim.wahlkampf.d55cd38", { p0: g.name, p1: g.parteiName, p2: sw.name, p3: sw.provinzen, p4: sw.provinzen === 1 ? "Provinz" : "Provinzen" }),
      wertung: -clamp(0.3 + staerke * 0.3, 0, 0.8),
      schluessel: ["greift an", sw.name],
    });
  }
}

// ---------------------------------------------------------------------------
// Tageshaken: Phasenbeginn, Wochenwechsel, Duell

/** Eigener Zufallsstrom des Wahlkampfs (Samen, Marke, Tag): Der Hauptstrom bleibt unberührt, alte Partien und lange Simulationen laufen wie bisher. */
export function wahlkampfRng(w: World): Rng {
  return new Rng((w.seed ^ 0x77a1 ^ Math.imul(w.day, 2654435761)) | 0);
}

/** Täglicher Haken aus der Spielschleife: beginnt die Phase, wechselt die Kampagnenwoche, trägt das Duell aus. */
export function wahlkampfTag(w: World): void {
  const sp = w.spiel;
  if (!sp || sp.ende) return;
  const k = sp.wahlkampf;
  if (!k) {
    if (sp.wahltag - w.day > WAHLKAMPF.beginnTage) return;
    // Phasenbeginn: acht Wochen vor der Wahl (nur die nationale Präsidentschaftswahl — Kommunalwahlen bleiben unberührt)
    sp.wahlkampf = { amtszeit: sp.amtszeit, ap: WAHLKAMPF.apProWoche, beginn: w.day, woche: w.day, besuche: {}, reisen: [], touren: [], versprechen: [], duell: { vorbereitet: 0 }, angriffe: 0, angriffeLog: [], ticker: [], rolle: sp.amtszeit >= maxAmtszeiten(w) ? "nachfolger" : "amt", nachfolgerAuftritte: { gemeinsam: 0, allein: 0, punkte: 0 } };
    const nachfolgerKampf = sp.wahlkampf.rolle === "nachfolger";
    const wahlDatum = formatDateDe(addDays(w.date, sp.wahltag - w.day));
    sp.hinweise.push({
      id: `wahlkampf-beginn-${w.day}`,
      titel: nachfolgerKampf ? t("enden.wk.beginn.titel") : "Der Wahlkampf beginnt",
      szene: "anatolien",
      text: nachfolgerKampf
        ? [
            t("enden.wk.beginn.text1", { datum: wahlDatum, name: sp.nachfolge?.nachfolger?.name ?? t("wahl.nachfolger_offen") }),
            t("enden.wk.beginn.text2", { ap: WAHLKAMPF.apProWoche }),
          ]
        : [
          tx("sim2.sim.wahlkampf.d05c1c9", { p0: formatDateDe(addDays(w.date, sp.wahltag - w.day)) }),
          tx("sim2.sim.wahlkampf.e175baf", { p0: WAHLKAMPF.apProWoche }),
          ],
    });
    addLog(w, "ereignis", tx("sim2.sim.wahlkampf.58b8cae"), tx("sim2.sim.wahlkampf.026a8d4", { p0: WAHLKAMPF.apProWoche }));
    tickerWoche(w, wahlkampfRng(w));
    return;
  }
  // Die Verfassung hebt die Amtszeitgrenze mitten im Wahlkampf auf: Der Präsident darf antreten und kämpft wieder für sich
  if (k.rolle === "nachfolger" && sp.amtszeit < maxAmtszeiten(w)) k.rolle = "amt";
  if (w.day - k.woche >= WAHLKAMPF.wocheTage) {
    k.woche = w.day;
    k.ap = WAHLKAMPF.apProWoche;
    angriffWoche(w);
    tickerWoche(w, wahlkampfRng(w));
  }
  if (k.duell.tag === undefined && sp.wahltag - w.day <= WAHLKAMPF.duellTageVorher) duellAustragen(w, wahlkampfRng(w));
}

// ---------------------------------------------------------------------------
// Der Wahltag: Die Effekte des Schlussspurts fließen in die Rechnung

export interface WahlEffekt {
  name: string;
  punkte: number;
}

/** Die Kampagnen-Effekte auf das Wahlergebnis in Prozentpunkten, aufgeschlüsselt (Wechselwähler-/Gruppen-Rechnung). */
export function wahlEffekte(w: World): { gesamt: number; teile: WahlEffekt[] } {
  const sp = w.spiel;
  const k = sp?.wahlkampf;
  if (!sp || !k) return { gesamt: 0, teile: [] };
  const teile: WahlEffekt[] = [];
  if (k.duell.effekt !== undefined && k.duell.effekt !== 0) teile.push({ name: "TV-Duell", punkte: k.duell.effekt });
  if (k.angriffe !== 0) teile.push({ name: tx("sim2.sim.wahlkampf.2e61132"), punkte: k.angriffe });
  const dias = diasporaBlock(w, sp.umfrage.zustimmung);
  if (Math.abs(dias.beitrag) >= 0.05) teile.push({ name: "Diaspora-Block", punkte: Math.round(dias.beitrag * 100) / 100 });
  if (k.nachfolgerAuftritte && k.nachfolgerAuftritte.punkte !== 0) teile.push({ name: t("enden.wk.effekt.auftritte"), punkte: k.nachfolgerAuftritte.punkte });
  return { gesamt: Math.round(teile.reduce((s, t) => s + t.punkte, 0) * 100) / 100, teile };
}

// ---------------------------------------------------------------------------
// Ansicht für die Wahlkampf-Zentrale

export interface WahlkampfSicht {
  aktiv: boolean;
  /** Tage bis zum Phasenbeginn (nur wenn inaktiv und die Wahl noch aussteht) */
  beginntIn?: number;
  tageBisWahl: number;
  ap: number;
  apMax: number;
  /** Tage bis zum nächsten Wochenbudget */
  resetIn: number;
  besuchte: number;
  reisen: WahlkampfZustand["reisen"];
  touren: WahlkampfZustand["touren"];
  versprechen: { def: VersprechenDef; gegeben: boolean }[];
  glaubwuerdigkeit: number;
  glaubFaktor: number;
  duell: { tag?: number; datum: string; vorbereitet: boolean; effekt?: number; szene?: string };
  gegner: GegnerProfil;
  angriffe: number;
  angriffeLog: WahlkampfZustand["angriffeLog"];
  ticker: WahlkampfZustand["ticker"];
  diaspora: { beitrag: number; beteiligung: number; lagerAnteil: number; touren: number };
  effekte: { gesamt: number; teile: WahlEffekt[] };
  /** Wer kämpft, und für wen (im Nachfolger-Wahlkampf: Name, Rolle und Strahlkraft des Nachfolgers) */
  rolle: "amt" | "nachfolger";
  nachfolger?: { name: string; rolle: string; staerke: number };
  /** Auftritte für den Nachfolger: bisherige Zahl, Vorschau des nächsten Auftritts je Art (nur im Nachfolger-Wahlkampf) */
  auftritte?: { gemeinsam: number; allein: number; punkte: number; vorschau: Record<AuftrittArt, { punkte: number; ap: number; uebrig: number; max: number }> };
}

/** Alles, was die Wahlkampf-Zentrale zeigt, in einem Aufruf. */
export function wahlkampfSicht(w: World): WahlkampfSicht {
  const sp = w.spiel!;
  const k = sp.wahlkampf;
  const tageBisWahl = Math.max(0, sp.wahltag - w.day);
  const b = zusagenBilanz(w);
  const { faktor } = versprechenGlaube(w);
  const dias = diasporaBlock(w, sp.umfrage.zustimmung);
  const basis: WahlkampfSicht = {
    aktiv: !!k,
    tageBisWahl,
    ap: k?.ap ?? 0,
    apMax: WAHLKAMPF.apProWoche,
    resetIn: k ? Math.max(0, WAHLKAMPF.wocheTage - (w.day - k.woche)) : 0,
    besuchte: k ? Object.keys(k.besuche).length : 0,
    reisen: k?.reisen ?? [],
    touren: k?.touren ?? [],
    versprechen: VERSPRECHEN.map((def) => ({ def, gegeben: k?.versprechen.includes(def.id) ?? false })),
    glaubwuerdigkeit: b.glaubwuerdigkeit,
    glaubFaktor: faktor,
    duell: {
      datum: formatDateDe(addDays(w.date, Math.max(0, tageBisWahl - WAHLKAMPF.duellTageVorher))),
      vorbereitet: (k?.duell.vorbereitet ?? 0) > 0,
      ...(k?.duell.tag !== undefined ? { tag: k.duell.tag } : {}),
      ...(k?.duell.effekt !== undefined ? { effekt: k.duell.effekt } : {}),
      ...(k?.duell.szene ? { szene: k.duell.szene } : {}),
    },
    gegner: gegnerProfil(w),
    angriffe: k?.angriffe ?? 0,
    angriffeLog: k?.angriffeLog ?? [],
    ticker: k?.ticker ?? [],
    diaspora: { beitrag: Math.round(dias.beitrag * 100) / 100, beteiligung: dias.beteiligung, lagerAnteil: Math.round(dias.lagerAnteil * 10) / 10, touren: k?.touren.length ?? 0 },
    effekte: wahlEffekte(w),
    rolle: k?.rolle ?? "amt",
  };
  const nachf = nachfolgerImWahlkampf(w);
  if (nachf) basis.nachfolger = nachf;
  if (k?.rolle === "nachfolger") {
    const a = k.nachfolgerAuftritte ?? { gemeinsam: 0, allein: 0, punkte: 0 };
    basis.auftritte = { ...a, vorschau: { gemeinsam: auftrittVorschau(w, "gemeinsam"), allein: auftrittVorschau(w, "allein") } };
  }
  if (!k && tageBisWahl > 0) basis.beginntIn = Math.max(0, tageBisWahl - WAHLKAMPF.beginnTage);
  return basis;
}

// ---------------------------------------------------------------------------
// Migration

const zahl = (x: unknown): x is number => typeof x === "number" && Number.isFinite(x);

/** Alte Spielstände haben kein Wahlkampf-Feld: Die Phase beginnt beim ersten Tick im Zeitfenster; beschädigte Werte werden repariert. */
export function migriereWahlkampf(w: World): void {
  const sp = w.spiel;
  const k = sp?.wahlkampf;
  if (!sp || !k) return;
  if (!zahl(k.amtszeit)) k.amtszeit = sp.amtszeit;
  if (!zahl(k.ap)) k.ap = WAHLKAMPF.apProWoche;
  k.ap = clamp(k.ap, 0, WAHLKAMPF.apProWoche);
  if (!zahl(k.beginn)) k.beginn = w.day;
  if (!zahl(k.woche)) k.woche = w.day;
  if (typeof k.besuche !== "object" || k.besuche === null || Array.isArray(k.besuche)) k.besuche = {};
  if (!Array.isArray(k.reisen)) k.reisen = [];
  if (!Array.isArray(k.touren)) k.touren = [];
  if (!Array.isArray(k.versprechen)) k.versprechen = [];
  if (typeof k.duell !== "object" || k.duell === null) k.duell = { vorbereitet: 0 };
  if (!zahl(k.duell.vorbereitet)) k.duell.vorbereitet = 0;
  if (k.rolle !== "amt" && k.rolle !== "nachfolger") k.rolle = sp.amtszeit >= maxAmtszeiten(w) ? "nachfolger" : "amt";
  if (k.nachfolgerAuftritte !== undefined && (typeof k.nachfolgerAuftritte !== "object" || !zahl(k.nachfolgerAuftritte.punkte))) k.nachfolgerAuftritte = { gemeinsam: 0, allein: 0, punkte: 0 };
  if (!zahl(k.angriffe)) k.angriffe = 0;
  k.angriffe = clamp(k.angriffe, -WAHLKAMPF.angriffDeckelGesamt, 0);
  if (!Array.isArray(k.angriffeLog)) k.angriffeLog = [];
  if (!Array.isArray(k.ticker)) k.ticker = [];
}

/** Hilfe für Karte und Listen: deutsche Regionsnamen in festgelegter Reihenfolge. */
export function regionenMitProvinzen(): { region: string; name: string; provinzen: { plaka: number; name: string; bevoelkerung: number }[] }[] {
  const out: { region: string; name: string; provinzen: { plaka: number; name: string; bevoelkerung: number }[] }[] = [];
  for (const [region, name] of Object.entries(REGION_DE)) {
    out.push({ region, name, provinzen: PROVINZEN.filter((p) => p.region === region).map((p) => ({ plaka: p.plaka, name: p.name, bevoelkerung: p.bevoelkerung })) });
  }
  return out;
}
