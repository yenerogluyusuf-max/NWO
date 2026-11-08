// Wendepunkte eines Krieges (Welle 3, K3; krieg.md Schritt 6, Befund B9): In der Mitte eines Krieges gab es nichts zu entscheiden. Jetzt
// melden sich, ausgelöst von Lage und Zeit statt am Monatsersten, bis zu fünf Vorgänge mit echtem Tausch auf dem Schreibtisch. Jeder kommt
// in einem Krieg höchstens einmal, höchstens einer je Kriegswoche.
//
//   krieg_wp_stadtkampf    Die Front steht vor einer großen Stadt: Sturm (Tempo, Gefallene) gegen Einschließen (Zeit, Rückhalt).
//                          Vorbild: Afrin-Stadt am 18.03.2018, eingeschlossen genommen; 137.070 bis 167.000 Vertriebene (OCHA; recherche A2).
//   krieg_wp_flucht        Menschen fliehen an die türkische Grenze. Vorbild: Friedensquelle, rund 180.000 Vertriebene (OCHA 22.10.2019, A3);
//                          Vorgabe der Recherche je Bodenoperation 170.000, Band 137.000 bis 300.000.
//   krieg_wp_vermittlung   Eine Großmacht bietet eine Waffenruhe an. Vorbild: Pence und Erdoğan am 17.10.2019, 120 Stunden Pause; Sotschi am
//                          22.10.2019, 150 Stunden und 30 km (A3). Bei einer Landung der UN-Sicherheitsrat (Resolution 353, 20.07.1974, 15:0; B).
//   krieg_wp_sanktion      Die USA oder die EU drohen mit Sanktionen. Vorbild: EO 13894 vom 14.10.2019 gegen zwei Ministerien und drei Minister,
//                          aufgehoben am 23.10.; die Lira verlor bis zum Sanktionstag 4,3 %, die Börse 7,7 % und erholte sich nach der Pause (A3).
//   krieg_wp_munition      Munition oder Nachschub werden knapp (Bestand der Streitkräfte, sim/streitkraefte.ts; Versorgung, sim/versorgung.ts).
//   krieg_wp_gefallene     Die Gefallenen kommen heim. Vorbild: Balyun am 27.02.2020, 33 Gefallene an einem Tag; danach Frühlingsschild, die
//                          Konsultation im NATO-Rat nach Art. 4 am 28.02. und das Moskauer Protokoll am 05.03. (A4).
//   krieg_wp_zivilisten    Zivile Opfer oder ein Kulturgut werden getroffen. Vorbilder: Beschuss eines Ferienorts bei Zakho am 20.07.2022 mit
//                          acht Toten, Beschwerde Iraks beim Sicherheitsrat (A6); Übergriffe verbündeter Gruppen in Afrin (Amnesty 02.08.2018,
//                          HRW 29.02.2024; recherche_besatzung.md A). Welterbestätten: UNESCO-Liste (Nummern im Kommentar bei KULTURGUT).
//   krieg_wp_schlagwelle   Die Schlagwelle eines Luftschlags ist geflogen: einstellen, eine zweite Welle oder eine Bodenoperation nachlegen.
//                          Vorbild: Klauenschwert, eine Woche; die angedrohte Bodenoperation folgte nicht (A7).
//
// Pflichten für neue Vorgänge (Welle H3): Die Vorlagen würfeln nie (chance 0, der Kriegsmotor öffnet sie), tragen trotzdem `eigenerWurf` und
// `ohneZusatzplatz`, damit der Monatswürfel für sie keine Zahl aus dem Strom der Partie zieht. Die Auswahl im Krieg nutzt nur die Lage und
// einen festen Wert aus Samen, Vorgang und Vorlage (hashWert). Jede Antwort wirkt über die Wege des Krieges (Front, Tempo, Rückhalt, Moral,
// Weltpreis, Zustimmung); die Zeilen unter einer Antwort entstehen aus denselben Werten, die sie bucht (`wirksam`).
// Alle Schwellen und Wirkungen sind Spielparameter, wo im Kopf keine Quelle steht.

import { MARKT_DROHUNG, PREIS } from "./kriegspreis";
import { schauplatzFuer, umkaempfteRegion } from "./kriegsschauplatz";
import type { KriegsTempo } from "../data/schauplaetze";
import { OPERATIONSFORMEN } from "../data/operationen";
import { anDerGrenze, formenFuer, operationVon, snaMoeglich, tuerkeiGreiftAn, waehleOperation, wochenDerForm } from "./operationen";
import { istFernkonflikt, LANDNACHBARN } from "./fernkonflikt";
import { streitkraefte } from "./streitkraefte";
import { militaerVersorgung } from "./versorgung";
import { aussenZustand } from "./diplomatie";
import { landAendern, weltZustand } from "./laender";
import { hashWert } from "./aufmerksamkeit";
import { wirke } from "./wirkung";
import { kosten, opt } from "./ereignis-hilfen";
import { kriegZu, aktiveKriege, lagePaketId, PAKETE, waffenruheFuerAngebot } from "./krieg";
import { oeffne } from "./ereignisse";
import { landFormen, landZahl } from "./ereignisse-krieg";
import { Rng } from "./rng";
import { t, zahl } from "../i18n";
import type { Option, Vorlage } from "./ereignis-hilfen";
import type { OffenesEreignis } from "./spiel-typen";
import type { KriegVorgang } from "./krieg-typen";
import type { World } from "./types";

// ---------------------------------------------------------------------------
// Spielparameter

export const WENDEPUNKT = {
  /** Höchstens so viele Wendepunkte je Krieg (die Schlagwelle zählt mit) */
  maxJeKrieg: 5,
  /** Zwischen zwei Wendepunkten liegen mindestens so viele Kriegswochen, also höchstens einer je Woche (die Schlagwelle wartet nicht) */
  abstandWochen: 1,
  /** Frist einer Antwort in Tagen: eine Kriegswoche */
  frist: 7,
  /** Ab so vielen Gefallenen meldet sich die Heimatfront (Größenordnung Olivenzweig 54, Schutzschild Euphrat 71; recherche A1, A2) */
  gefalleneAb: 25,
  /** Unter so vielen Gefechtstagen Munition (Start 60, data/streitkraefte.ts) oder unter diesem Anteil der Versorgung wird es knapp */
  munitionAb: 30,
  versorgungAb: 0.6,
  /** Ab diesem Konflikt mit den USA droht Washington, wenn die Türkei angreift (ein Angriff auf ein EU-Mitglied bringt die Drohung immer) */
  sanktionAb: 50,
  /** Vertriebene je Operation (recherche_operationen.md, Zahlen fürs Spiel: Vorgabe 170.000, Band 137.000 bis 300.000) */
  vertriebene: { begrenzt: 170_000, grossoffensive: 300_000 } as Record<string, number>,
  /** Anteil der Vertriebenen, der bei offener Grenze in die Türkei kommt (Spielparameter) */
  aufnahmeAnteil: 0.5,
  /** Lira bei Standhalten gegen eine Sanktionsdrohung: belegt 4,3 % (USD/TRY 01. bis 14.10.2019, recherche A3) */
  liraSanktion: 4.3,
};

/** UNESCO-Welterbe in den Regionen der Schauplätze (whc.unesco.org/en/list/<Nummer>). */
const KULTURGUT: Record<string, number> = {
  syr_aleppo: 21, // Altstadt von Aleppo, 1986
  grc_rhodos: 493, // Mittelalterliche Stadt Rhodos, 1988
  grc_thessaloniki: 456, // Frühchristliche und byzantinische Bauten in Thessaloniki, 1988
  irq_erbil: 1437, // Zitadelle von Erbil, 2014
  cyp_paphos: 79, // Paphos, 1980
  irn_taebris: 1346, // Historischer Basar von Täbris, 2010
};

// ---------------------------------------------------------------------------
// Wirkungen als Daten: dieselben Werte buchen und beschriften

interface Werte {
  /** Schub der Front in der nächsten Woche (wie „Reserven und Nachschub“) */
  front?: number;
  uhr?: number;
  uhrGegner?: number;
  gefallene?: number;
  tempo?: KriegsTempo;
  /** Gefechtstage Munition */
  munition?: number;
  /** Menschen, die in die Türkei kommen */
  flucht?: number;
  eskalation?: number;
  /** Konflikt mit Ländern (Gegner, EU, USA, Russland) */
  konflikt?: Record<string, number>;
  /** Netzknoten (Ansehen, Nationalisten, Truppenmoral …); zeigt die allgemeine Vorschau des Ereignisfensters */
  netz?: Record<string, number>;
  zustimmung?: number;
  /** % des BIP; zeigt die Preisplakette */
  kosten?: number;
  /** Lira schwächer (+) oder stärker (−) in Prozent; Risikoaufschlag in Basispunkten */
  lira?: number;
  risiko?: number;
}

const clamp = (x: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, x));
const vz = (x: number, d = 0): string => (x > 0 ? "+" : x < 0 ? "−" : "") + zahl(Math.abs(x), d);

/** Was die Werte in diesem Vorgang wirklich bewegen (nach den Grenzen der Größen): Grundlage für Buchung und Zeilen. */
function wirksam(w: World, k: KriegVorgang, v: Werte): Werte {
  const out: Werte = { ...v };
  if (v.uhr) out.uhr = clamp(k.uhr + v.uhr, 0, 100) - k.uhr;
  if (v.uhrGegner) out.uhrGegner = clamp(k.uhrGegner + v.uhrGegner, -100, 100) - k.uhrGegner;
  if (v.eskalation) out.eskalation = clamp(k.eskalation + v.eskalation, 0, 100) - k.eskalation;
  if (v.konflikt) {
    out.konflikt = {};
    for (const [id, d] of Object.entries(v.konflikt)) {
      const jetzt = weltZustand(w)[id]?.konflikt;
      if (jetzt === undefined) continue;
      // Wie der Kriegspreis: Der Westen antwortet mit Druck, nicht mit einem eigenen Konfliktvorgang
      const deckel = id === "EU" || id === "USA" ? PREIS.westenDeckel : 100;
      const neu = d > 0 ? Math.min(Math.max(jetzt, deckel), jetzt + d) : Math.max(0, jetzt + d);
      if (neu !== jetzt) out.konflikt[id] = neu - jetzt;
    }
  }
  if (v.tempo && (k.tempo ?? "normal") === v.tempo) delete out.tempo;
  return out;
}

function buche(w: World, k: KriegVorgang, roh: Werte): void {
  const v = wirksam(w, k, roh);
  if (v.front) k.frontSchub = (k.frontSchub ?? 0) + v.front;
  if (v.uhr) k.uhr += v.uhr;
  if (v.uhrGegner) k.uhrGegner += v.uhrGegner;
  if (v.eskalation) k.eskalation += v.eskalation;
  if (v.tempo) k.tempo = v.tempo;
  if (v.gefallene) {
    // Wie im Kriegspreis (sim/kriegspreis.ts): Die Zahl steigt, die Umfrage und das Vertrauen sinken je Gefallenem
    k.gefallene = (k.gefallene ?? 0) + v.gefallene;
    if (w.spiel) w.spiel.umfrage.zustimmung = Math.max(0, w.spiel.umfrage.zustimmung - v.gefallene * PREIS.zustimmungJeGefallenem);
    wirke(w, "vertrauen_regierung", -v.gefallene * PREIS.vertrauenJeGefallenem);
  }
  if (v.munition) {
    const m = streitkraefte(w).gattungen.munition;
    m.menge = Math.round((m.menge + v.munition) * 10) / 10;
  }
  if (v.flucht) {
    const f = aussenZustand(w).flucht;
    f.bestand = Math.round((f.bestand + v.flucht / 1e6) * 100) / 100;
  }
  for (const [id, d] of Object.entries(v.konflikt ?? {})) landAendern(w, id, { konflikt: d });
  for (const [id, d] of Object.entries(v.netz ?? {})) wirke(w, id, d);
  if (v.zustimmung && w.spiel) w.spiel.umfrage.zustimmung = clamp(w.spiel.umfrage.zustimmung + v.zustimmung, 0, 100);
  if (v.kosten) kosten(w, v.kosten);
  if (v.lira) {
    w.economy.usdTry *= 1 + v.lira / 100;
    w.economy.eurTry *= 1 + v.lira / 100;
  }
  if (v.risiko) w.economy.riskPremium = Math.max(0, w.economy.riskPremium + v.risiko);
}

/** Die Zeilen unter einer Antwort: nur die Größen des Krieges; Ansehen, Zustimmung, Lira und Kosten zeigt das Ereignisfenster selbst. */
function zeilen(w: World, k: KriegVorgang | undefined, roh: Werte): string[] {
  const v = k ? wirksam(w, k, roh) : roh;
  const out: string[] = [];
  if (v.front) out.push(t("welle_k3.wz.front", { d: vz(v.front) }));
  if (v.tempo) out.push(t("welle_k3.wz.tempo", { tempo: t(`krieg.tempo.${v.tempo}.name`) }));
  if (v.gefallene) out.push(t("welle_k3.wz.gefallene", { d: vz(v.gefallene) }));
  if (v.uhr) out.push(t("welle_k3.wz.uhr", { d: vz(v.uhr, Number.isInteger(v.uhr) ? 0 : 1) }));
  if (v.uhrGegner) out.push(t("welle_k3.wz.uhr_gegner", { d: vz(v.uhrGegner, Number.isInteger(v.uhrGegner) ? 0 : 1) }));
  if (v.eskalation) out.push(t("welle_k3.wz.eskalation", { d: vz(v.eskalation, Number.isInteger(v.eskalation) ? 0 : 1) }));
  if (v.munition) out.push(t("welle_k3.wz.munition", { d: vz(v.munition) }));
  if (v.flucht) out.push(t("welle_k3.wz.flucht", { d: vz(v.flucht) }));
  for (const [id, d] of Object.entries(v.konflikt ?? {})) out.push(t("welle_k3.wz.konflikt", { land: landFormen(id), d: vz(d, Number.isInteger(d) ? 0 : 1) }));
  return out;
}

// ---------------------------------------------------------------------------
// Gemeinsame Hilfen der Vorlagen

const vorgangId = (ev: OffenesEreignis): string => String(ev.daten?.vorgang ?? "");
const landId = (ev: OffenesEreignis): string => String(ev.daten?.land ?? "GRC");
const vorgang = (w: World, ev: OffenesEreignis): KriegVorgang | undefined => {
  const k = kriegZu(w, vorgangId(ev));
  return k && (k.phase === "krieg" || k.phase === "waffenruhe") ? k : undefined;
};
const params = (ev: OffenesEreignis, extra: Record<string, string | number> = {}) => ({ land: landFormen(landId(ev)), nz: landZahl(landId(ev)), ...extra });
const regionName = (id: string): string => t(`krieg.region.${id}`);

/** Eine Antwort, die ihre Werte bucht und beschriftet; `danach` führt eine Handlung des Krieges aus (Waffenruhe, neue Form). */
function antwort(
  w: World,
  ev: OffenesEreignis,
  vorlage: string,
  id: string,
  pk: number,
  werte: Werte,
  satz: string,
  danach?: { zeile: (w: World, k: KriegVorgang) => string; tun: (w: World, k: KriegVorgang) => string },
): Option {
  const k = vorgang(w, ev);
  const z = zeilen(w, k, werte);
  if (danach && k) z.push(danach.zeile(w, k));
  const beschreibung = z.length ? `${satz} ${z.join(" · ")}.` : satz;
  return opt(id, t(`welle_k3.wp.${vorlage}.opt.${id}`), beschreibung, pk, (w2, e2) => {
    const k2 = vorgang(w2, e2);
    if (!k2) return t("welle_k3.wp.weg");
    buche(w2, k2, werte);
    const nach = danach ? " " + danach.tun(w2, k2) : "";
    return t(`welle_k3.wp.${vorlage}.aus.${id}`, params(e2)) + nach;
  });
}

/** Die Standardfolge: dieselbe Buchung wie die Antwort `id`, ohne deren Kapital. */
function standardWie(vorlage: string, werte: (w: World, ev: OffenesEreignis) => Werte) {
  return (w: World, ev: OffenesEreignis): string => {
    const k = vorgang(w, ev);
    if (!k) return t("welle_k3.wp.weg");
    buche(w, k, werte(w, ev));
    return t(`welle_k3.wp.${vorlage}.standard`, params(ev));
  };
}

type Daten = (w: World, k: KriegVorgang | undefined) => Record<string, string | number>;
/** Die Daten eines Wendepunkts aus der Lage seines Krieges (wendepunkteWoche ruft sie mit dem auslösenden Vorgang). */
const DATEN: Record<string, Daten> = {};

/** Für die Textprüfung ohne Krieg: der laufende Vorgang, sonst ein Beispielfall gegen Griechenland ohne Vorgang. */
function erzeugeAus(id: string, daten: Daten) {
  DATEN[id] = daten;
  return (w: World) => {
    const k = aktiveKriege(w).find((x) => x.phase === "krieg") ?? aktiveKriege(w)[0];
    return { provinzen: [], staerke: 1, daten: { land: k?.land ?? "GRC", vorgang: k?.id ?? "", ...daten(w, k) } };
  };
}

const waffenruhe = {
  zeile: (w: World, k: KriegVorgang) => t("welle_k3.wz.waffenruhe", { paket: PAKETE[lagePaketId(w, k)]!.name }),
  tun: (w: World, k: KriegVorgang) => {
    k.angebotPaket = lagePaketId(w, k);
    return waffenruheFuerAngebot(w, k.id);
  },
};

const GRUND = {
  id: "",
  szene: "istanbul",
  frist: WENDEPUNKT.frist,
  abkuehlung: 1,
  chance: () => 0,
  eigenerWurf: true,
  ohneZusatzplatz: true,
  wettbewerb: "aussitzen",
  schwere: 1.3,
} as const;

// ---------------------------------------------------------------------------
// 1. Stadtkampf

const STADT = {
  sturm: { front: 4, gefallene: 14, netz: { ansehen: -2, truppenmoral: 1 }, konflikt: { EU: 2 } } as Werte,
  einschliessen: { tempo: "vorsichtig", uhr: -2, kosten: 0.05, netz: { ansehen: 1 } } as Werte,
  sna: { front: 2, gefallene: 3, netz: { ansehen: -3 }, konflikt: { EU: 3 } } as Werte,
};

const WP_STADTKAMPF: Vorlage = {
  ...GRUND,
  id: "krieg_wp_stadtkampf",
  erzeuge: erzeugeAus("krieg_wp_stadtkampf", (_, k) => ({ region: (k && umkaempfteRegion(k)?.id) || "grc_thessaloniki" })),
  titel: (_, ev) => t("welle_k3.wp.krieg_wp_stadtkampf.titel", { stadt: regionName(String(ev.daten?.region)) }),
  text: (_, ev) => [t("welle_k3.wp.krieg_wp_stadtkampf.text1", params(ev, { stadt: regionName(String(ev.daten?.region)) })), t("welle_k3.wp.krieg_wp_stadtkampf.text2")],
  warum: () => t("welle_k3.wp.krieg_wp_stadtkampf.warum"),
  optionen: (w, ev) => {
    const k = vorgang(w, ev);
    const out = [
      antwort(w, ev, "krieg_wp_stadtkampf", "sturm", 0, STADT.sturm, t("welle_k3.wp.krieg_wp_stadtkampf.satz.sturm")),
      antwort(w, ev, "krieg_wp_stadtkampf", "einschliessen", 2, STADT.einschliessen, t("welle_k3.wp.krieg_wp_stadtkampf.satz.einschliessen")),
    ];
    if (k?.verbuendete === "sna") out.push(antwort(w, ev, "krieg_wp_stadtkampf", "sna", 0, STADT.sna, t("welle_k3.wp.krieg_wp_stadtkampf.satz.sna")));
    return out;
  },
  standard: standardWie("krieg_wp_stadtkampf", () => STADT.sturm),
};

// ---------------------------------------------------------------------------
// 2. Flucht an die Grenze

const fluchtZahl = (k: KriegVorgang | undefined): number => WENDEPUNKT.vertriebene[k?.operation ?? "begrenzt"] ?? WENDEPUNKT.vertriebene.begrenzt!;
const FLUCHT = {
  // Das Außenmodell führt die Geflüchteten in Schritten von 10.000 (sim/diplomatie.ts, Millionen mit zwei Stellen): gebucht und gezeigt wird dieselbe Zahl
  aufnehmen: (n: number): Werte => ({ flucht: Math.round((n * WENDEPUNKT.aufnahmeAnteil) / 1e4) * 1e4, kosten: 0.06, netz: { ansehen: 2, nationalisten: -1.5 } }),
  zone: { uhr: -1, kosten: 0.04, netz: { ansehen: 0.5 } } as Werte,
  schliessen: { netz: { ansehen: -2.5, nationalisten: 1 }, konflikt: { EU: 2 } } as Werte,
};

const WP_FLUCHT: Vorlage = {
  ...GRUND,
  id: "krieg_wp_flucht",
  erzeuge: erzeugeAus("krieg_wp_flucht", (_, k) => ({ zahl: fluchtZahl(k) })),
  titel: (_, ev) => t("welle_k3.wp.krieg_wp_flucht.titel", { zahl: zahl(Number(ev.daten?.zahl ?? 0), 0) }),
  text: (_, ev) => [t("welle_k3.wp.krieg_wp_flucht.text1", params(ev, { zahl: zahl(Number(ev.daten?.zahl ?? 0), 0) })), t("welle_k3.wp.krieg_wp_flucht.text2")],
  warum: () => t("welle_k3.wp.krieg_wp_flucht.warum"),
  optionen: (w, ev) => [
    antwort(w, ev, "krieg_wp_flucht", "aufnehmen", 0, FLUCHT.aufnehmen(Number(ev.daten?.zahl ?? 0)), t("welle_k3.wp.krieg_wp_flucht.satz.aufnehmen")),
    antwort(w, ev, "krieg_wp_flucht", "zone", 2, FLUCHT.zone, t("welle_k3.wp.krieg_wp_flucht.satz.zone")),
    antwort(w, ev, "krieg_wp_flucht", "schliessen", 0, FLUCHT.schliessen, t("welle_k3.wp.krieg_wp_flucht.satz.schliessen")),
  ],
  standard: standardWie("krieg_wp_flucht", () => FLUCHT.schliessen),
};

// ---------------------------------------------------------------------------
// 3. Vermittlung einer Großmacht

/** Wer vermittelt: bei einer Landung der Sicherheitsrat (1974), in Nordsyrien und Nordirak die USA (2019), im Kaukasus und gegen Iran Russland. */
function vermittlerFuer(k: KriegVorgang | undefined): "USA" | "RUS" | "UN" {
  if (!k) return "USA";
  if (k.operation === "landung" || k.land === "CYP") return "UN";
  if (k.land === "ARM" || k.land === "IRN") return "RUS";
  return "USA";
}
const VERMITTLUNG = {
  annehmen: (v: string): Werte => ({ konflikt: v === "UN" ? { EU: -2 } : { [v]: -4 }, risiko: -30, netz: { ansehen: 2, nationalisten: -1 } }),
  moskau: { konflikt: { RUS: -3, USA: 2 }, risiko: -20, netz: { ansehen: 1, nationalisten: -0.5 } } as Werte,
  ablehnen: (v: string): Werte => ({ konflikt: v === "UN" ? { EU: 3, USA: 2 } : { [v]: 5 }, netz: { nationalisten: 1.5, ansehen: -1.5 } }),
};

const WP_VERMITTLUNG: Vorlage = {
  ...GRUND,
  id: "krieg_wp_vermittlung",
  erzeuge: erzeugeAus("krieg_wp_vermittlung", (_, k) => ({ vermittler: vermittlerFuer(k) })),
  titel: (_, ev) => t(`welle_k3.wp.krieg_wp_vermittlung.titel.${String(ev.daten?.vermittler ?? "USA")}`),
  text: (_, ev) => [t(`welle_k3.wp.krieg_wp_vermittlung.text1.${String(ev.daten?.vermittler ?? "USA")}`, params(ev)), t("welle_k3.wp.krieg_wp_vermittlung.text2")],
  warum: () => t("welle_k3.wp.krieg_wp_vermittlung.warum"),
  optionen: (w, ev) => {
    const v = String(ev.daten?.vermittler ?? "USA");
    const out = [antwort(w, ev, "krieg_wp_vermittlung", "annehmen", 0, VERMITTLUNG.annehmen(v), t(`welle_k3.wp.krieg_wp_vermittlung.satz.annehmen.${v}`), waffenruhe)];
    // Wie im Oktober 2019: Nach der Pause mit Washington verhandelte Ankara in Sotschi mit Moskau
    if (v === "USA" && landId(ev) === "SYR") out.push(antwort(w, ev, "krieg_wp_vermittlung", "moskau", 3, VERMITTLUNG.moskau, t("welle_k3.wp.krieg_wp_vermittlung.satz.moskau"), waffenruhe));
    out.push(antwort(w, ev, "krieg_wp_vermittlung", "ablehnen", 0, VERMITTLUNG.ablehnen(v), t("welle_k3.wp.krieg_wp_vermittlung.satz.ablehnen")));
    return out;
  },
  standard: standardWie("krieg_wp_vermittlung", (_, ev) => VERMITTLUNG.ablehnen(String(ev.daten?.vermittler ?? "USA"))),
};

// ---------------------------------------------------------------------------
// 4. Sanktionsdrohung

const EU_MITGLIED = new Set(["GRC", "CYP"]);
const SANKTION = {
  // Einlenken wie die Pause vom 17.10.2019: Es bleiben 1,5 % des Sprungs (MARKT_DROHUNG.bleibt in sim/kriegspreis.ts)
  einlenken: (von: string): Werte => ({ tempo: "vorsichtig", konflikt: { [von]: -3 }, lira: Math.round(WENDEPUNKT.liraSanktion * MARKT_DROHUNG.bleibt * 10) / 10, risiko: -20, netz: { nationalisten: -1 } }),
  vermitteln: (von: string): Werte => ({ konflikt: { [von]: -1.5 }, lira: WENDEPUNKT.liraSanktion / 2, risiko: 25 }),
  standhalten: (von: string): Werte => ({ konflikt: { [von]: 3 }, lira: WENDEPUNKT.liraSanktion, risiko: 60, zustimmung: 0.5, netz: { nationalisten: 1.5 } }),
};

const WP_SANKTION: Vorlage = {
  ...GRUND,
  id: "krieg_wp_sanktion",
  erzeuge: erzeugeAus("krieg_wp_sanktion", (_, k) => ({ von: k && EU_MITGLIED.has(k.land) ? "EU" : "USA" })),
  titel: (_, ev) => t(`welle_k3.wp.krieg_wp_sanktion.titel.${String(ev.daten?.von ?? "USA")}`),
  text: (_, ev) => [t(`welle_k3.wp.krieg_wp_sanktion.text1.${String(ev.daten?.von ?? "USA")}`, params(ev)), t("welle_k3.wp.krieg_wp_sanktion.text2")],
  warum: () => t("welle_k3.wp.krieg_wp_sanktion.warum"),
  optionen: (w, ev) => {
    const von = String(ev.daten?.von ?? "USA");
    return [
      antwort(w, ev, "krieg_wp_sanktion", "einlenken", 0, SANKTION.einlenken(von), t("welle_k3.wp.krieg_wp_sanktion.satz.einlenken")),
      antwort(w, ev, "krieg_wp_sanktion", "vermitteln", 3, SANKTION.vermitteln(von), t("welle_k3.wp.krieg_wp_sanktion.satz.vermitteln")),
      antwort(w, ev, "krieg_wp_sanktion", "standhalten", 0, SANKTION.standhalten(von), t("welle_k3.wp.krieg_wp_sanktion.satz.standhalten")),
    ];
  },
  standard: standardWie("krieg_wp_sanktion", (_, ev) => SANKTION.standhalten(String(ev.daten?.von ?? "USA"))),
};

// ---------------------------------------------------------------------------
// 5. Munition und Nachschub

const MUNITION = {
  notkauf: { munition: 20, kosten: 0.15 } as Werte,
  produktion: { munition: 10, kosten: 0.08 } as Werte,
  sparen: { tempo: "vorsichtig", uhr: -1 } as Werte,
};

const WP_MUNITION: Vorlage = {
  ...GRUND,
  id: "krieg_wp_munition",
  erzeuge: erzeugeAus("krieg_wp_munition", (w) => ({ tage: Math.round(streitkraefte(w).gattungen.munition.menge) })),
  titel: () => t("welle_k3.wp.krieg_wp_munition.titel"),
  text: (_, ev) => [t("welle_k3.wp.krieg_wp_munition.text1", params(ev, { tage: zahl(Number(ev.daten?.tage ?? 0), 0) })), t("welle_k3.wp.krieg_wp_munition.text2")],
  warum: () => t("welle_k3.wp.krieg_wp_munition.warum"),
  optionen: (w, ev) => [
    antwort(w, ev, "krieg_wp_munition", "notkauf", 2, MUNITION.notkauf, t("welle_k3.wp.krieg_wp_munition.satz.notkauf")),
    antwort(w, ev, "krieg_wp_munition", "produktion", 0, MUNITION.produktion, t("welle_k3.wp.krieg_wp_munition.satz.produktion")),
    antwort(w, ev, "krieg_wp_munition", "sparen", 0, MUNITION.sparen, t("welle_k3.wp.krieg_wp_munition.satz.sparen")),
  ],
  standard: standardWie("krieg_wp_munition", () => MUNITION.sparen),
};

// ---------------------------------------------------------------------------
// 6. Gefallene und Stimmung zu Hause

const GEFALLENE = {
  vergeltung: { front: 2, uhrGegner: -6, eskalation: 4, kosten: 0.05, netz: { nationalisten: 2, ansehen: -1 } } as Werte,
  trauer: { uhr: 4, netz: { vertrauen_regierung: 0.8, nationalisten: -0.5 } } as Werte,
  nato: { konflikt: { USA: -2, EU: -1 }, netz: { ansehen: 1.5 } } as Werte,
  schweigen: { uhr: -3, netz: { vertrauen_regierung: -0.5 } } as Werte,
};
const NATO_GEGNER = new Set(["GRC"]);

const WP_GEFALLENE: Vorlage = {
  ...GRUND,
  id: "krieg_wp_gefallene",
  erzeuge: erzeugeAus("krieg_wp_gefallene", (_, k) => ({ zahl: k?.gefallene ?? WENDEPUNKT.gefalleneAb })),
  titel: (_, ev) => t("welle_k3.wp.krieg_wp_gefallene.titel", { zahl: zahl(Number(ev.daten?.zahl ?? 0), 0) }),
  text: (_, ev) => [t("welle_k3.wp.krieg_wp_gefallene.text1", params(ev, { zahl: zahl(Number(ev.daten?.zahl ?? 0), 0) })), t("welle_k3.wp.krieg_wp_gefallene.text2")],
  warum: () => t("welle_k3.wp.krieg_wp_gefallene.warum"),
  optionen: (w, ev) => {
    const out = [
      antwort(w, ev, "krieg_wp_gefallene", "vergeltung", 0, GEFALLENE.vergeltung, t("welle_k3.wp.krieg_wp_gefallene.satz.vergeltung")),
      antwort(w, ev, "krieg_wp_gefallene", "trauer", 0, GEFALLENE.trauer, t("welle_k3.wp.krieg_wp_gefallene.satz.trauer")),
    ];
    // Gegen ein NATO-Mitglied gibt es keine Konsultation (Griechenland blockierte schon am 29.02.2020 eine gemeinsame Erklärung, recherche A4)
    if (!NATO_GEGNER.has(landId(ev))) out.push(antwort(w, ev, "krieg_wp_gefallene", "nato", 3, GEFALLENE.nato, t("welle_k3.wp.krieg_wp_gefallene.satz.nato")));
    return out;
  },
  standard: standardWie("krieg_wp_gefallene", () => GEFALLENE.schweigen),
};

// ---------------------------------------------------------------------------
// 7. Zivile Opfer und Kulturgut

type ZivilArt = "beschuss" | "verbuendete" | "kulturgut";
function zivilFall(k: KriegVorgang | undefined): { art: ZivilArt; region: string } {
  const lage = k?.regionen ?? {};
  const umk = k ? umkaempfteRegion(k) : undefined;
  const kultur = Object.keys(KULTURGUT).find((id) => id === umk?.id || lage[id] === "eigen");
  if (k?.verbuendete === "sna") return { art: "verbuendete", region: umk?.id ?? "syr_asas" };
  if (kultur) return { art: "kulturgut", region: kultur };
  return { art: "beschuss", region: umk?.id ?? "grc_thessaloniki" };
}
const ZIVIL = {
  untersuchen: { netz: { ansehen: 2, offiziersvertrauen: -1.5, nationalisten: -1 } } as Werte,
  bestreiten: (landId: string): Werte => ({ konflikt: { [landId]: 3, EU: 2 }, netz: { ansehen: -2, nationalisten: 1 } }),
  abziehen: { front: -2, konflikt: { EU: -1 }, netz: { ansehen: 3 } } as Werte,
  schutzzone: { tempo: "vorsichtig", front: -1, netz: { ansehen: 2.5 } } as Werte,
};

const WP_ZIVILISTEN: Vorlage = {
  ...GRUND,
  id: "krieg_wp_zivilisten",
  erzeuge: erzeugeAus("krieg_wp_zivilisten", (_, k) => zivilFall(k)),
  titel: (_, ev) => t(`welle_k3.wp.krieg_wp_zivilisten.titel.${String(ev.daten?.art ?? "beschuss")}`, { ort: regionName(String(ev.daten?.region)) }),
  text: (_, ev) => [t(`welle_k3.wp.krieg_wp_zivilisten.text1.${String(ev.daten?.art ?? "beschuss")}`, params(ev, { ort: regionName(String(ev.daten?.region)) })), t("welle_k3.wp.krieg_wp_zivilisten.text2")],
  warum: () => t("welle_k3.wp.krieg_wp_zivilisten.warum"),
  optionen: (w, ev) => {
    const art = String(ev.daten?.art ?? "beschuss") as ZivilArt;
    const out = [
      antwort(w, ev, "krieg_wp_zivilisten", "untersuchen", 2, ZIVIL.untersuchen, t("welle_k3.wp.krieg_wp_zivilisten.satz.untersuchen")),
      antwort(w, ev, "krieg_wp_zivilisten", "bestreiten", 0, ZIVIL.bestreiten(landId(ev)), t("welle_k3.wp.krieg_wp_zivilisten.satz.bestreiten")),
    ];
    if (art === "verbuendete") out.push(antwort(w, ev, "krieg_wp_zivilisten", "abziehen", 3, ZIVIL.abziehen, t("welle_k3.wp.krieg_wp_zivilisten.satz.abziehen")));
    if (art === "kulturgut") out.push(antwort(w, ev, "krieg_wp_zivilisten", "schutzzone", 0, ZIVIL.schutzzone, t("welle_k3.wp.krieg_wp_zivilisten.satz.schutzzone")));
    return out;
  },
  standard: standardWie("krieg_wp_zivilisten", (_, ev) => ZIVIL.bestreiten(landId(ev))),
};

// ---------------------------------------------------------------------------
// 8. Ende einer Schlagwelle (nur Luftschlag)

const WELLE = {
  einstellen: { netz: { abschreckung: 2 } } as Werte,
  welle2: { konflikt: { USA: 2, EU: 1 }, netz: { ansehen: -1 } } as Werte,
  boden: {} as Werte,
};
const neueForm = (mit: "allein" | "sna") => ({
  zeile: () => t(mit === "sna" ? "welle_k3.wz.form_sna" : "welle_k3.wz.form", { form: t("welle_k3.op.begrenzt.name") }),
  tun: (w: World, k: KriegVorgang) => waehleOperation(w, k, "begrenzt", mit, true).text,
});
const zweiteWelle = {
  zeile: () => t("welle_k3.wz.welle2"),
  tun: (w: World, k: KriegVorgang) => {
    k.operationWoche = k.woche;
    // Die zweite Welle ist eine eigene Entscheidung: Danach kommt die Frage noch einmal, ohne weitere Welle
    (k.wendepunkte ??= {}).welle2 = k.woche;
    delete k.wendepunkte.krieg_wp_schlagwelle;
    return t("welle_k3.wz.welle2_aus");
  },
};

const WP_SCHLAGWELLE: Vorlage = {
  ...GRUND,
  id: "krieg_wp_schlagwelle",
  erzeuge: erzeugeAus("krieg_wp_schlagwelle", () => ({})),
  titel: (_, ev) => t("welle_k3.wp.krieg_wp_schlagwelle.titel", params(ev)),
  text: (_, ev) => [t("welle_k3.wp.krieg_wp_schlagwelle.text1", params(ev)), t("welle_k3.wp.krieg_wp_schlagwelle.text2")],
  warum: () => t("welle_k3.wp.krieg_wp_schlagwelle.warum"),
  optionen: (w, ev) => {
    const k = vorgang(w, ev);
    const pk = OPERATIONSFORMEN.begrenzt.pk;
    const out = [antwort(w, ev, "krieg_wp_schlagwelle", "einstellen", 0, WELLE.einstellen, t("welle_k3.wp.krieg_wp_schlagwelle.satz.einstellen"), waffenruhe)];
    if (!k?.wendepunkte?.welle2) out.push(antwort(w, ev, "krieg_wp_schlagwelle", "welle2", 2, WELLE.welle2, t("welle_k3.wp.krieg_wp_schlagwelle.satz.welle2"), zweiteWelle));
    // Die Bodenoperation kostet, was ihre Wahl im Krieg kostet; die Wahl selbst bucht das Kapital (anzeigePk nennt es vorher)
    // Geht die Bodenoperation hier nicht (kein Kapital), steht der Grund an der Antwort
    const sperre = k ? formenFuer(w, k, true).find((f) => f.id === "begrenzt")?.grund : undefined;
    // Ohne laufenden Krieg bucht die Antwort nichts; dann steht auch kein Preis da
    const boden = (id: string, mit: "allein" | "sna"): Option => ({ ...antwort(w, ev, "krieg_wp_schlagwelle", id, 0, WELLE.boden, t(`welle_k3.wp.krieg_wp_schlagwelle.satz.${id}`), neueForm(mit)), ...(k ? { anzeigePk: pk } : {}), ...(sperre ? { sperre } : {}) });
    out.push(boden("boden", "allein"));
    if (k && snaMoeglich(k, "begrenzt")) out.push(boden("boden_sna", "sna"));
    return out;
  },
  standard: standardWie("krieg_wp_schlagwelle", () => WELLE.einstellen),
};

export const WENDEPUNKT_VORLAGEN: Vorlage[] = [WP_STADTKAMPF, WP_FLUCHT, WP_VERMITTLUNG, WP_SANKTION, WP_MUNITION, WP_GEFALLENE, WP_ZIVILISTEN, WP_SCHLAGWELLE];
export const WENDEPUNKT_IDS: string[] = WENDEPUNKT_VORLAGEN.map((v) => v.id);

// ---------------------------------------------------------------------------
// Auslösung im Krieg (sim/krieg.ts `kriegWoche`)

/**
 * Ab welcher Kriegswoche ein Wendepunkt frühestens kommt: ein Grundwert und ein fester Versatz von 0 bis `spanne − 1` Wochen je Krieg
 * (hashWert aus Samen, Vorgang und Vorlage; kein Zug aus dem Zufallsstrom). So kommt nicht jeder Krieg im selben Takt.
 */
const abWoche = (w: World, k: KriegVorgang, id: string, grund: number, spanne = 2): number => grund + Math.floor(hashWert(`${w.seed}|wp|${k.id}|${id}`) * spanne);

/** Die Bedingungen der Lage, in der Reihenfolge der Dringlichkeit (die erste passende kommt). */
const BEDINGUNG: { id: string; ab: number; spanne?: number; gilt: (w: World, k: KriegVorgang) => boolean }[] = [
  { id: "krieg_wp_schlagwelle", ab: 0, gilt: (_, k) => operationVon(k)?.id === "luftschlag" && wochenDerForm(k) >= (operationVon(k)?.wellenWochen ?? 1) },
  { id: "krieg_wp_gefallene", ab: 1, gilt: (_, k) => (k.gefallene ?? 0) >= WENDEPUNKT.gefalleneAb },
  {
    id: "krieg_wp_munition",
    ab: 2,
    gilt: (w, k) => {
      const v = militaerVersorgung(w, k.land);
      return streitkraefte(w).gattungen.munition.menge < WENDEPUNKT.munitionAb || v.material < WENDEPUNKT.versorgungAb || v.treibstoff < WENDEPUNKT.versorgungAb;
    },
  },
  {
    id: "krieg_wp_sanktion",
    ab: 1,
    gilt: (w, k) => tuerkeiGreiftAn(k) && (EU_MITGLIED.has(k.land) || (weltZustand(w).USA?.konflikt ?? 0) >= WENDEPUNKT.sanktionAb || k.wendepunkte?.krieg_wp_vermittlung !== undefined),
  },
  {
    id: "krieg_wp_vermittlung",
    ab: 2,
    // Die Großmacht tritt auf, wenn Tatsachen geschaffen sind (2019: nach Tal Abyad und Ras al-Ain), spätestens nach vier Wochen; bei einer
    // Landung sofort (Resolution 353 am Tag der Landung)
    gilt: (_, k) =>
      tuerkeiGreiftAn(k) && !!schauplatzFuer(k.land) && !k.gegnerAngebot && k.zielErreicht === undefined &&
      (k.operation === "landung" || Object.values(k.regionen ?? {}).some((l) => l === "eigen") || k.woche >= 4),
  },
  { id: "krieg_wp_stadtkampf", ab: 1, gilt: (_, k) => !!operationVon(k) && operationVon(k)!.tiefe > 0 && umkaempfteRegion(k)?.gelaende === "stadt" && !anDerGrenze(k) },
  {
    id: "krieg_wp_flucht",
    ab: 1,
    gilt: (_, k) =>
      LANDNACHBARN.has(k.land) && !!schauplatzFuer(k.land) && (k.operation === "begrenzt" || k.operation === "grossoffensive") &&
      (Object.values(k.regionen ?? {}).some((l) => l === "eigen") || k.woche >= 2),
  },
  { id: "krieg_wp_zivilisten", ab: 2, spanne: 5, gilt: (_, k) => !!operationVon(k) && !istFernkonflikt(k.land) },
];

/** Ob die Lage einen Wendepunkt verlangt (nur die Bedingung, ohne Abstand, Frühestwoche und Höchstzahl); für Tests und die Akte. */
export function wendepunktGilt(w: World, k: KriegVorgang, id: string): boolean {
  return !!BEDINGUNG.find((b) => b.id === id)?.gilt(w, k);
}

/**
 * Wendepunkte kommen in einem Krieg, den die Türkei mit einer gewählten Operation führt oder selbst begonnen hat. Ein Krieg, in dem der Präsident
 * nichts befiehlt (ein Angriff auf die Türkei ohne gewählte Form), bleibt beim Generalstab; dort melden sich Waffenruhe und Gefallene wie bisher
 * über die Hinweise des Kriegsmotors.
 */
export function wendepunkteAktiv(k: KriegVorgang): boolean {
  return k.phase === "krieg" && (!!k.operation || (!!k.koalition && k.koalition.aggressor === "tuerkei"));
}

/** Der nächste fällige Wendepunkt oder keiner (nur Lage, kein Zufallsstrom). */
export function naechsterWendepunkt(w: World, k: KriegVorgang): string | undefined {
  if (!wendepunkteAktiv(k)) return undefined;
  const gewesen = Object.entries(k.wendepunkte ?? {}).filter(([id]) => id.startsWith("krieg_wp_"));
  if (gewesen.length >= WENDEPUNKT.maxJeKrieg) return undefined;
  if (w.spiel?.ereignisse.some((e) => WENDEPUNKT_IDS.includes(e.vorlage) && e.daten?.vorgang === k.id)) return undefined;
  const zuletzt = Math.max(-1e9, ...gewesen.map(([, woche]) => woche));
  for (const b of BEDINGUNG) {
    if (k.wendepunkte?.[b.id] !== undefined) continue;
    const welle = b.id === "krieg_wp_schlagwelle";
    if (!welle && k.woche - zuletzt < WENDEPUNKT.abstandWochen) continue;
    if (k.woche < abWoche(w, k, b.id, b.ab, b.spanne) && !welle) continue;
    if (b.gilt(w, k)) return b.id;
  }
  return undefined;
}

/** Je Kriegswoche: Ist ein Wendepunkt fällig, öffnet er (ohne Zug aus dem Zufallsstrom: die Daten stehen fest, `erzeuge` wird nicht gewürfelt). */
export function wendepunkteWoche(w: World, k: KriegVorgang): void {
  const id = naechsterWendepunkt(w, k);
  if (!id || !w.spiel) return;
  (k.wendepunkte ??= {})[id] = k.woche;
  // Mit festen Daten zieht `oeffne` keine Zahl aus dem Strom (sim/ereignisse.ts); der Rng ist nur Pflichtargument
  oeffne(w, id, new Rng(0), { provinzen: [], staerke: 1, daten: { land: k.land, vorgang: k.id, ...DATEN[id]!(w, k) } });
}
