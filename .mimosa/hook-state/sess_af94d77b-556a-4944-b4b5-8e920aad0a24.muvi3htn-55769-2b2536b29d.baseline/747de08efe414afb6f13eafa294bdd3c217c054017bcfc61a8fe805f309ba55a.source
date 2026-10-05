// Die Wahl als Ereignis mit Folgen (VERBESSERUNGSPLAN, Welle 2 „Wahl und Neuanfang“).
//
// Rechtslage (tuerkei/INSTITUTIONEN.md, Abschnitte 1 und 6): Der Präsident wird direkt auf fünf Jahre gewählt; wer im ersten Wahlgang keine absolute
// Mehrheit erreicht, muss in die Stichwahl (AY 101). Präsident und Parlament werden am selben Tag gewählt (AY 77). Sperrklausel 7 %, Bündnisse zählen für
// die Hürde zusammen, Sitze nach D'Hondt je Provinz (MSK 33, 34). Höchstens zwei Amtszeiten; eine dritte nur über Neuwahlen mit 360 Stimmen (AY 101, 116).
// Gegen Entscheidungen des Hohen Wahlrats YSK gibt es kein Rechtsmittel (AY 79).
// Zu prüfen: Der Abstand zwischen erstem Wahlgang und Stichwahl (hier 14 Tage) steht nicht in den Projektquellen.
//
// Alle Zahlen sind Spielparameter (Platzhalter der Kalibrierung), keine Tatsachenbehauptungen über echte Wahlen.
// Die Reihenfolge am Wahltag: erster Wahlgang (mit Parlamentswahl), gegebenenfalls Stichwahl nach 14 Tagen, dann die Folgen:
// Wahlabend-Ansicht, Reaktionen, bei Sieg der Beginn der nächsten Amtszeit (sim/amtszeit.ts), bei Niederlage das Ende (sim/spiel.ts).

import { marktSchock } from "./maerkte";
import { NET } from "./modell";
import { PROVINCES, nationalAverage } from "./netz";
import { clamp } from "./economy";
import { addLog } from "./log";
import { wirke } from "./wirkung";
import { Rng } from "./rng";
import { PROVINZEN } from "./regional";
import { verfassungAktiv } from "./verfassung";
import { versprechensschuldMalus } from "./katastrophe";
import { gegnerPartei, wahlEffekte } from "./wahlkampf";
import { FORDERUNG, PARTEI_NAME, forderungVon, parteiNaehe } from "./fraktionen";
import { eigenVon, hashZahl } from "./personen";
import { figur, neuerName } from "./figuren";
import { lokaleAnteile, verteileSitze } from "./prolog";
import { oeffne } from "./ereignisse";
import { zusageAnlegen } from "./ereignis-hilfen";
import { zeitungEreignis } from "./zeitung";
import { LAENDER, landAendern, vertrauenZu } from "./laender";
import { beende } from "./spiel";
import { aktuelleAmtszeit, beginneAmtszeit, maxAmtszeiten, nachholen, wahlBezugsAnteil } from "./amtszeit";
import { msg, t } from "../i18n";
import type { World } from "./types";
import type {
  WahlErgebnis,
  WahlKandidat,
  WahlKandidatId,
  WahlParlament,
  WahlReaktion,
  WahlRede,
  WahlRunde,
  WahlZustand,
  StichwahlVorgang,
  NachtragZustand,
} from "./spiel-typen";

export const WAHL = {
  /** Tage zwischen erstem Wahlgang und Stichwahl (zu prüfen, siehe oben) */
  stichwahlTage: 14,
  /** Anteil kleinerer Bewerber an den gültigen Stimmen, in Prozent */
  andere: 1.2,
  /** Streuung des Ergebnisses um die Umfrage, in Prozentpunkten (wie bisher) */
  rauschen: 2.2,
  /** Anteil des Hauptgegners an dem, was der Amtsinhaber nicht holt: Basis, Aufschlag je Polarisierungspunkt über 50, Grenzen */
  gegnerQuoteBasis: 0.84,
  gegnerQuotePol: 0.12,
  gegnerQuoteMin: 0.7,
  gegnerQuoteMax: 0.96,
  /** Beteiligung in Prozent: Basis plus Polarisierung (0 bis 100) mal Faktor; die Stichwahl liegt etwas darunter */
  beteiligungBasis: 78,
  beteiligungPol: 0.12,
  beteiligungStich: -2.5,
  /** In der letzten Amtszeit trägt der Nachfolger nur einen Teil der Beliebtheit des Präsidenten */
  letzteFaktor: 0.85,
  /** Spreizung der Provinzergebnisse: Punkte je Punkt Vertrauensabstand der Provinz zum Land; Gewicht der Hochburgen des Lagers (Punkte Vertrauensabstand je Prozentpunkt Abweichung) */
  provinzSpreizung: 0.55,
  musterGewicht: 1.2,
  /** Stichwahl: Anteil der Wähler des Dritten, die zum Amtsinhaber wechseln (Basis, je Nähe-Punkt, Grenzen); die übrigen gehen zu 70 % zum Gegner, zu 30 % bleiben sie zu Hause */
  uebertragBasis: 0.3,
  uebertragNaehe: 0.1,
  uebertragMin: 0.08,
  uebertragMax: 0.7,
  uebertragZumGegner: 0.7,
  /** Entscheidung zwischen den Runden: Wirkung der Werbung und der Mobilisierung, Rauschen der Stichwahl */
  uebertragWerben: 0.16,
  mobilisierung: 1.2,
  stichwahlRauschen: 1,
  /** Knappes Ergebnis: Abstand in Prozentpunkten, unter dem die Opposition anfechten kann */
  knapp: 3,
  /** Klares Ergebnis: Abstand, ab dem von einem Auftrag gesprochen wird */
  klar: 12,
  /** Parlamentswahl: Wie stark der Zugewinn des Präsidenten auf die Lager-Parteien durchschlägt, Streuung, relative Streuung großer und kleiner Parteien */
  lagerFaktor: 0.55,
  lagerRauschen: 1.2,
  parteiRauschenGross: 0.07,
  parteiRauschenKlein: 0.14,
} as const;

// ---------------------------------------------------------------------------
// Zustand

export function wahlZustand(w: World): WahlZustand {
  const sp = w.spiel;
  if (!sp) throw new Error("Ohne Spielschleife gibt es keine Wahl.");
  return (sp.wahl ??= { historie: [] });
}

/** Die Sperrklausel in Prozent nach dem gültigen Wahlrecht (Verfassungsartikel „Wahlhürde“). */
export function huerdeProzent(w: World): number {
  const v = verfassungAktiv(w, "wahlrecht");
  return v === "fuenf" ? 5 : v === "zehn" ? 10 : 7;
}

export function istLetzteWahl(w: World): boolean {
  const sp = w.spiel;
  return !!sp && sp.amtszeit >= maxAmtszeiten(w);
}

/** Die letzte Wahl des Spiels (oder undefined), für Ansichten und Tests. */
export function letzteWahl(w: World): WahlErgebnis | undefined {
  return w.spiel?.wahl?.historie[w.spiel.wahl.historie.length - 1];
}

/** Das Ergebnis, das die Oberfläche als Wahlabend zeigen soll (bis es quittiert ist). */
export function wahlabend(w: World): WahlErgebnis | undefined {
  const id = w.spiel?.wahl?.abend;
  return id ? w.spiel!.wahl!.historie.find((e) => e.id === id) : undefined;
}

export function wahlabendQuittieren(w: World): void {
  const sp = w.spiel;
  const z = sp?.wahl;
  if (!sp || !z) return;
  if (z.abend) sp.hinweise = sp.hinweise.filter((h) => h.id !== z.abend);
  delete z.abend;
}

// ---------------------------------------------------------------------------
// Kandidaten

/** Kandidatenfeld: der Präsident (in der letzten Amtszeit sein Nachfolger), der Hauptgegner und der Dritte. */
export function kandidatenFeld(w: World, letzte: boolean): WahlKandidat[] {
  const sp = w.spiel!;
  const eigene = w.player!.partei;
  const opp = figur(w, "opposition");
  const gp = gegnerPartei(w);
  const lager = new Set([eigene.kurz, ...sp.lager]);
  const gegnerP = Object.entries(w.parliament?.seats ?? {})
    .filter(([p]) => !lager.has(p) && p !== gp)
    .sort((a, b) => b[1] - a[1])[0]?.[0];
  const benutzt = new Set(sp.figuren.map((f) => f.name));
  const rng = new Rng((w.seed ^ 0x3a17 ^ Math.imul(w.day, 2654435761)) | 0);
  const nachfolger = sp.nachfolge?.nachfolger;
  const amt: WahlKandidat = {
    id: "amt",
    name: letzte ? (nachfolger?.name ?? t("wahl.nachfolger_offen")) : w.player!.name,
    partei: eigene.kurz,
    parteiName: eigene.name,
    ...(letzte ? { nachfolger: true } : {}),
  };
  const gegner: WahlKandidat = { id: "gegner", name: opp?.name ?? t("wahl.gegner_name"), partei: gp, parteiName: PARTEI_NAME[gp] ?? gp };
  const abtr = sp.nachfolge?.abtruenniger;
  const dritte: WahlKandidat =
    letzte && abtr
      ? { id: "dritte", name: abtr.name, partei: eigene.kurz, parteiName: t("wahl.abtruenniger_partei", { partei: eigene.name }) }
      : { id: "dritte", name: neuerName(rng, benutzt), partei: gegnerP ?? "Andere", parteiName: gegnerP ? (PARTEI_NAME[gegnerP] ?? gegnerP) : t("wahl.unabhaengig") };
  return [amt, gegner, dritte];
}

// ---------------------------------------------------------------------------
// Erster Wahlgang

interface Wahlgang {
  amt: number;
  gegner: number;
  dritte: number;
  beteiligung: number;
  /** Aufschlüsselung der Einflüsse in Prozentpunkten, für die Anzeige */
  einfluesse: { name: string; punkte: number }[];
}

/**
 * Was vom Gegner und vom Lager kommt (in Prozentpunkten für den Amtsinhaber): Der Oppositionsführer nach Fähigkeit (bis ±0,8), das Lager im
 * Parlament nach Sitzen (unter 301: −1, ab 360: +0,5). Spielparameter, Platzhalter der Kalibrierung.
 */
export function gegnerEinfluss(w: World): { name: string; punkte: number }[] {
  const out: { name: string; punkte: number }[] = [];
  const opp = figur(w, "opposition");
  const fae = opp ? eigenVon(w, opp).faehigkeit : 60;
  const o = Math.round(-clamp((fae - 60) / 12, -1, 1) * 0.8 * 10) / 10;
  if (o !== 0) out.push({ name: t("wahl.einfluss.opposition"), punkte: o });
  const seats = w.parliament?.seats ?? {};
  const lager = [w.player!.partei.kurz, ...(w.spiel?.lager ?? [])].reduce((s, p) => s + (seats[p] ?? 0), 0);
  const l = lager < 301 ? -1 : lager >= 360 ? 0.5 : 0;
  if (l !== 0) out.push({ name: t("wahl.einfluss.lager"), punkte: l });
  return out;
}

/** Die Rechnung des ersten Wahlgangs: Zustimmung, Kampagne, Versprechensschuld, Rauschen; der Rest verteilt sich auf Gegner und Dritten. */
function ersterWahlgang(w: World, rng: Rng, letzte: boolean): Wahlgang {
  const sp = w.spiel!;
  const schuld = versprechensschuldMalus(w);
  // INF-5: Die Unwucht zwischen öffentlicher Katastrophen-Zusage und Lieferung kostet am Wahltag Stimmen und steht in Chronik und Protokoll
  if (schuld.punkte > 0) {
    sp.chronik.push({ tag: w.day, datum: w.date, titel: t("wahl.schuld.titel"), ausgang: schuld.text });
    addLog(w, "ereignis", t("wahl.schuld.log"), schuld.text);
  }
  const effekte = wahlEffekte(w);
  const einfluesse: Wahlgang["einfluesse"] = [...effekte.teile.map((x) => ({ name: x.name, punkte: x.punkte }))];
  if (schuld.punkte > 0) einfluesse.push({ name: t("wahl.einfluss.schuld"), punkte: -Math.round(schuld.punkte * 10) / 10 });
  let roh = sp.umfrage.zustimmung + effekte.gesamt - schuld.punkte + rng.normal(WAHL.rauschen);
  // Der Gegner ist kein Spiegel der Zustimmung: Ein fähiger Oppositionsführer und ein schwaches Lager im Parlament verschieben das Ergebnis
  for (const x of gegnerEinfluss(w)) {
    roh += x.punkte;
    einfluesse.push(x);
  }
  if (letzte) {
    // Der Nachfolger trägt die Beliebtheit nicht ganz; seine eigene Strahlkraft und ein abtrünniger Rivale verschieben das Ergebnis
    const n = sp.nachfolge?.nachfolger;
    const bonus = n ? (n.staerke - 55) / 10 : -1;
    roh = 50 + WAHL.letzteFaktor * (roh - 50) + bonus;
    if (n) einfluesse.push({ name: t("wahl.einfluss.nachfolger", { name: n.name }), punkte: Math.round(bonus * 10) / 10 });
    const abtr = sp.nachfolge?.abtruenniger;
    if (abtr) {
      const verlust = 2 + abtr.staerke / 20;
      roh -= verlust;
      einfluesse.push({ name: t("wahl.einfluss.abtruenniger", { name: abtr.name }), punkte: -Math.round(verlust * 10) / 10 });
    }
  }
  const amt = clamp(roh, 3, 96);
  const rest = Math.max(0, 100 - amt - WAHL.andere);
  const pol = nationalAverage(NET, w.net, "polarisierung");
  const opp = figur(w, "opposition");
  const fae = opp ? eigenVon(w, opp).faehigkeit : 60;
  const q = clamp(WAHL.gegnerQuoteBasis + (WAHL.gegnerQuotePol * (pol - 50)) / 50 + (0.04 * (fae - 60)) / 12, WAHL.gegnerQuoteMin, WAHL.gegnerQuoteMax);
  const gegner = rest * q;
  const dritte = rest - gegner;
  const beteiligung = clamp(WAHL.beteiligungBasis + WAHL.beteiligungPol * pol + rng.normal(1), 60, 92);
  return { amt, gegner, dritte, beteiligung, einfluesse };
}

const rund1 = (x: number): number => Math.round(x * 10) / 10;

function rundeVon(w: World, nr: 1 | 2, a: { amt: number; gegner: number; dritte?: number }, beteiligung: number): WahlRunde {
  return {
    nr,
    tag: w.day,
    datum: w.date,
    anteile: { amt: rund1(a.amt), gegner: rund1(a.gegner), ...(a.dritte !== undefined ? { dritte: rund1(a.dritte) } : {}) },
    beteiligung: rund1(beteiligung),
  };
}

// ---------------------------------------------------------------------------
// Provinzergebnisse

/**
 * Anteil des Amtsinhabers und des Gegners je Provinz im Entscheidungsgang: Die Provinzen weichen nach dem örtlichen Vertrauen in die Regierung vom
 * Landesergebnis ab (Spielparameter `provinzSpreizung`); der bevölkerungsgewichtete Schnitt bleibt genau beim Landesergebnis.
 */
export function provinzErgebnisse(w: World, amtLand: number, gegnerLand: number, muster?: number[]): Record<string, { amt: number; gegner: number }> {
  const i = NET.index.get("vertrauen_regierung")!;
  const nat = nationalAverage(NET, w.net, "vertrauen_regierung");
  const gew = w.net.weights;
  // Abstand der Provinz vom Land: das örtliche Vertrauen in die Regierung, dazu die Hochburgen des Lagers aus der Parlamentswahl (Muster der Wahl 2023)
  const abstand = Array.from({ length: PROVINCES }, (_, p) => w.net.values[i * PROVINCES + p]! - nat + (muster ? WAHL.musterGewicht * (muster[p] ?? 0) : 0));
  const amt = abstand.map((d) => amtLand + WAHL.provinzSpreizung * d);
  const geg = abstand.map((d) => gegnerLand - 0.8 * WAHL.provinzSpreizung * d);
  const nachziehen = (x: number[], ziel: number) => {
    const schnitt = x.reduce((s, v, p) => s + v * gew[p]!, 0);
    return x.map((v) => clamp(v + (ziel - schnitt), 2, 97));
  };
  const a = nachziehen(amt, amtLand);
  const g = nachziehen(geg, gegnerLand);
  const out: Record<string, { amt: number; gegner: number }> = {};
  for (let p = 0; p < PROVINCES; p++) {
    let x = a[p]!;
    let y = g[p]!;
    if (x + y > 99) {
      const f = 99 / (x + y);
      x *= f;
      y *= f;
    }
    out[String(PROVINZEN[p]!.plaka)] = { amt: rund1(x), gegner: rund1(y) };
  }
  return out;
}

// ---------------------------------------------------------------------------
// Parlamentswahl am selben Tag

/**
 * Die Parlamentswahl: Der Zugewinn oder Verlust des Präsidenten gegenüber der letzten Wahl schlägt zu einem Teil auf das Lager durch,
 * die Oppositionsparteien streuen. Danach gelten die Hürde (das Lager zählt als Bündnis zusammen) und D'Hondt je Provinz.
 * Schreibt das neue Parlament in die Welt, passt das Regierungslager an und liefert das Ergebnis.
 */
export function parlamentswahl(w: World, rng: Rng, praesDelta: number): WahlParlament {
  return parlamentswahlMitMuster(w, rng, praesDelta).parlament;
}

/** Wie `parlamentswahl`, dazu die Hochburgen des Lagers je Provinz (Abweichung seines örtlichen Anteils vom Landesanteil, in Prozentpunkten). */
export function parlamentswahlMitMuster(w: World, rng: Rng, praesDelta: number): { parlament: WahlParlament; muster: number[] } {
  const sp = w.spiel!;
  const alt = w.parliament;
  if (!alt) {
    return { parlament: { anteile: {}, sitzeVorher: {}, sitzeNachher: {}, huerde: huerdeProzent(w), unterHuerde: [], lagerVorher: [...sp.lager], lagerNachher: [...sp.lager], lagerSitzeVorher: 0, lagerSitzeNachher: 0 }, muster: [] };
  }
  const eigene = w.player!.partei.kurz;
  const lagerVorher = [eigene, ...sp.lager.filter((p) => p !== eigene)];
  const parteien = Object.keys(alt.shares).sort();
  const huerde = huerdeProzent(w);
  const summeLager = (a: Record<string, number>) => lagerVorher.reduce((s, p) => s + (a[p] ?? 0), 0);
  const sL = summeLager(alt.shares);
  const verschiebung = clamp(WAHL.lagerFaktor * praesDelta + rng.normal(WAHL.lagerRauschen), -10, 10);
  const sL2 = clamp(sL + verschiebung, 8, 80);
  const sO2 = 100 - sL2;
  const neu: Record<string, number> = {};
  // Lager: gleichmäßig skaliert
  for (const p of parteien) if (lagerVorher.includes(p)) neu[p] = sL > 0 ? (alt.shares[p]! * sL2) / sL : 0;
  // Opposition: eigene Streuung je Partei, danach auf den Rest skaliert
  const roh: Record<string, number> = {};
  for (const p of parteien) {
    if (lagerVorher.includes(p)) continue;
    const s = alt.shares[p]!;
    roh[p] = Math.max(0.05, s * (1 + rng.normal(s > 5 ? WAHL.parteiRauschenGross : WAHL.parteiRauschenKlein)));
  }
  const summeRoh = Object.values(roh).reduce((a, b) => a + b, 0);
  for (const p of Object.keys(roh)) neu[p] = summeRoh > 0 ? (roh[p]! * sO2) / summeRoh : 0;
  const allianzOk = summeLager(neu) >= huerde;
  const zugelassen = parteien.filter((p) => p !== "Andere" && (neu[p]! >= huerde || (lagerVorher.includes(p) && allianzOk)));
  const lokal = lokaleAnteile(neu, eigene);
  const lagerLand = lagerVorher.reduce((s, p) => s + (neu[p] ?? 0), 0);
  const muster = lokal.map((sh) => rund1(lagerVorher.reduce((s, p) => s + (sh[p] ?? 0), 0) - lagerLand));
  const { seats, byProvince } = verteileSitze(lokal, zugelassen);
  const unterHuerde = parteien.filter((p) => p !== "Andere" && !zugelassen.includes(p) && (alt.seats[p] ?? 0) > 0);
  const gerundet: Record<string, number> = {};
  for (const p of parteien) gerundet[p] = rund1(neu[p]!);
  const sitzeVorher = { ...alt.seats };
  w.parliament = { shares: gerundet, seats, byProvince };
  sp.lager = sp.lager.filter((p) => (seats[p] ?? 0) > 0);
  const lagerNachher = [eigene, ...sp.lager.filter((p) => p !== eigene)];
  const summeSitze = (s: Record<string, number>, l: string[]) => l.reduce((n, p) => n + (s[p] ?? 0), 0);
  return {
    parlament: {
      anteile: gerundet,
      sitzeVorher,
      sitzeNachher: { ...seats },
      huerde,
      unterHuerde,
      lagerVorher,
      lagerNachher,
      lagerSitzeVorher: summeSitze(sitzeVorher, lagerVorher),
      lagerSitzeNachher: summeSitze(seats, lagerNachher),
    },
    muster,
  };
}

// ---------------------------------------------------------------------------
// Stichwahl

function uebertragAuf(w: World, dritte: WahlKandidat): number {
  const nahe = dritte.partei === "Andere" ? 0 : parteiNaehe(w, dritte.partei);
  return clamp(WAHL.uebertragBasis + WAHL.uebertragNaehe * nahe, WAHL.uebertragMin, WAHL.uebertragMax);
}

/** Anteil des Amtsinhabers (und des Gegners) an den gültigen Stimmen der Stichwahl, aus dem Vorgang. */
export function stichwahlAnteile(v: StichwahlVorgang): { amt: number; gegner: number } {
  const a = v.basis.amt + v.uebertrag * v.basis.dritte + v.mobilisierung;
  const g = v.basis.gegner + (1 - v.uebertrag) * WAHL.uebertragZumGegner * v.basis.dritte;
  const summe = a + g;
  return { amt: (100 * a) / summe, gegner: (100 * g) / summe };
}

/** Die Entscheidung zwischen den Wahlgängen (aus dem Ereignis „wahl_stichwahl“). */
export function stichwahlEntscheidung(w: World, art: "werben" | "mobilisieren" | "abwarten"): string {
  const v = w.spiel?.wahl?.stichwahl;
  if (!v) return t("wahl.stichwahl.keine");
  v.entscheidung = art;
  if (art === "werben") {
    v.uebertrag = clamp(v.uebertrag + WAHL.uebertragWerben, WAHL.uebertragMin, WAHL.uebertragMax);
    // Eine Wahlempfehlung gibt es nicht umsonst: Die Partei des Dritten erwartet nach der Wahl ein Zugeständnis (Zusage mit Frist)
    const partei = v.kandidaten.find((k) => k.id === "dritte")?.partei;
    if (partei && FORDERUNG[partei]) {
      const f = forderungVon(w, partei);
      zusageAnlegen(w, { von: partei, text: t("wahl.stichwahl.zusage", { partei: PARTEI_NAME[partei] ?? partei, forderung: f.text }), tage: 180, massnahme: f.massnahme });
      return t("wahl.stichwahl.werben_ausgang_zusage", { partei: PARTEI_NAME[partei] ?? partei, forderung: f.text });
    }
    return t("wahl.stichwahl.werben_ausgang");
  }
  if (art === "mobilisieren") {
    v.mobilisierung += WAHL.mobilisierung;
    wirke(w, "polarisierung", 1);
    return t("wahl.stichwahl.mobil_ausgang");
  }
  return t("wahl.stichwahl.abwarten_ausgang");
}

// ---------------------------------------------------------------------------
// Reaktionen

function reaktionen(w: World, e: Omit<WahlErgebnis, "reaktionen" | "id" | "nummer">, stichwahl: boolean): WahlReaktion[] {
  const out: WahlReaktion[] = [];
  const gegner = e.kandidaten.find((k) => k.id === "gegner")!;
  const amt = e.kandidaten.find((k) => k.id === "amt")!;
  const marge = e.marge;
  const knapp = marge < WAHL.knapp;
  // Opposition
  if (e.gewonnen) {
    if (knapp) out.push({ wer: "opposition", wertung: -1, text: msg("wahl.reaktion.opp_anfechtung", { name: gegner.name, partei: gegner.parteiName, marge: rund1(marge) }) });
    else out.push({ wer: "opposition", wertung: 0, text: msg("wahl.reaktion.opp_anerkennt", { name: gegner.name, partei: gegner.parteiName }) });
  } else {
    out.push({ wer: "opposition", wertung: -1, text: msg("wahl.reaktion.opp_siegt", { name: gegner.name, partei: gegner.parteiName }) });
  }
  // Wahlrat und Beobachter (YSK: kein Rechtsmittel, AY 79)
  const frei = nationalAverage(NET, w.net, "pressefreiheit");
  const justiz = nationalAverage(NET, w.net, "justiz_unabhaengigkeit");
  const fair = frei >= 50 && justiz >= 45;
  out.push({
    wer: "wahlrat",
    wertung: fair ? 1 : -1,
    text: msg(fair ? "wahl.reaktion.beobachter_fair" : "wahl.reaktion.beobachter_kritik", {}),
  });
  // Ausland: die zwei Hauptakteure mit dem größten Vertrauen gratulieren (bei Sieg), die EU mahnt bei schwachem Rechtsstaat
  const nach = [...LAENDER].filter((l) => l.id !== "EU").sort((a, b) => vertrauenZu(w, b.id) - vertrauenZu(w, a.id));
  if (e.gewonnen) {
    for (const l of nach.slice(0, 2)) out.push({ wer: "ausland", wertung: 1, text: msg("wahl.reaktion.gratulation", { land: l.name, name: amt.name }) });
  } else {
    out.push({ wer: "ausland", wertung: 0, text: msg("wahl.reaktion.ausland_gegner", { name: gegner.name }) });
  }
  if (e.gewonnen && (justiz < 45 || frei < 45)) out.push({ wer: "ausland", wertung: -1, text: msg("wahl.reaktion.eu_mahnt", {}) });
  // Märkte
  const mw = e.gewonnen ? (marge >= WAHL.klar ? 1 : knapp ? -1 : 0) : -1;
  out.push({ wer: "maerkte", wertung: mw as -1 | 0 | 1, text: msg(mw > 0 ? "wahl.reaktion.maerkte_ruhig" : mw < 0 ? "wahl.reaktion.maerkte_nervoes" : "wahl.reaktion.maerkte_abwartend", {}) });
  // Lager im Parlament
  const p = e.parlament;
  const diff = p.lagerSitzeNachher - p.lagerSitzeVorher;
  out.push({
    wer: "partei",
    wertung: diff > 0 ? 1 : diff < 0 ? -1 : 0,
    text: msg(p.lagerSitzeNachher >= 301 ? "wahl.reaktion.lager_mehrheit" : "wahl.reaktion.lager_ohne_mehrheit", { sitze: p.lagerSitzeNachher, diff: Math.abs(diff), richtung: diff >= 0 ? "plus" : "minus", fehlt: Math.max(0, 301 - p.lagerSitzeNachher) }),
  });
  void stichwahl;
  return out;
}

/** Wirkung der Wahl auf Legitimität, Polarisierung, Märkte und Ausland (einmalig, beim Abschluss). */
function folgen(w: World, e: WahlErgebnis): void {
  const marge = e.marge;
  if (e.gewonnen) {
    const klar = marge >= WAHL.klar;
    const knapp = marge < WAHL.knapp;
    wirke(w, "legitimitaet", klar ? 2 : knapp ? -1.5 : 0.5);
    wirke(w, "polarisierung", klar ? -1 : knapp ? 2 : 0);
    // Märkte: ein klares Ergebnis beruhigt, ein knappes verunsichert (Risikoaufschlag in Punkten)
    if (klar) marktSchock(w, "wahl", -1);
    else if (knapp) marktSchock(w, "wahl", 0.5);
    w.economy.credibility = clamp(w.economy.credibility + (klar ? 0.005 : knapp ? -0.01 : 0), 0.05, 0.95);
    // Beobachter: faire Wahl stützt das Ansehen, eine als unfair empfundene schadet
    const r = e.reaktionen.find((x) => x.wer === "wahlrat");
    wirke(w, "ansehen", r && r.wertung > 0 ? 1 : -2);
    const nach = [...LAENDER].filter((l) => l.id !== "EU").sort((a, b) => vertrauenZu(w, b.id) - vertrauenZu(w, a.id));
    for (const l of nach.slice(0, 2)) landAendern(w, l.id, { vertrauen: 1.5 }, "Glückwünsche zur Wahl");
    if (e.reaktionen.some((x) => x.wer === "ausland" && x.wertung < 0)) landAendern(w, "EU", { vertrauen: -2, konflikt: 2 }, "Kritik am Wahlverlauf");
  }
}

// ---------------------------------------------------------------------------
// Abschluss einer Wahl

type Basis = Omit<WahlErgebnis, "reaktionen" | "id" | "nummer" | "marge" | "gewonnen" | "sieger" | "letzteWahl" | "amtszeit" | "tag" | "datum" | "anfechtung">;

function abschliessen(w: World, rng: Rng, basis: Basis, nachStichwahl: boolean): void {
  const sp = w.spiel!;
  const z = wahlZustand(w);
  const letzte = istLetzteWahl(w);
  const letzteRunde = basis.runden[basis.runden.length - 1]!;
  const a = letzteRunde.anteile;
  const reihe = (Object.entries(a) as [WahlKandidatId, number][]).sort((x, y) => y[1] - x[1]);
  const sieger = reihe[0]![0];
  const marge = rund1(reihe[0]![1] - (reihe[1]?.[1] ?? 0));
  const gewonnen = sieger === "amt";
  const tag = w.day;
  const e: WahlErgebnis = {
    id: `wahl-${tag}`,
    nummer: z.historie.length + 1,
    amtszeit: sp.amtszeit,
    tag,
    datum: w.date,
    ...basis,
    sieger,
    gewonnen,
    marge,
    letzteWahl: letzte,
    reaktionen: [],
    anfechtung: gewonnen && marge < WAHL.knapp ? "laufend" : "keine",
  };
  e.reaktionen = reaktionen(w, e, nachStichwahl);
  z.historie.push(e);
  z.abend = e.id;
  delete z.stichwahl;
  folgen(w, e);

  const amtName = e.kandidaten.find((k) => k.id === "amt")!.name;
  const gegnerName = e.kandidaten.find((k) => k.id === "gegner")!.name;
  const anteilAmt = a.amt ?? 0;
  const wahlText = nachStichwahl ? t("wahl.log.stichwahl") : t("wahl.log.erster_gang");
  delete sp.wahlkampf;

  if (gewonnen && !letzte) {
    const titel = t("wahl.chronik.wiederwahl");
    sp.chronik.push({ tag, datum: w.date, titel, ausgang: t("wahl.chronik.wiederwahl_text", { name: amtName, anteil: rund1(anteilAmt), gang: wahlText, marge }) });
    addLog(w, "ereignis", t("wahl.log.wiederwahl", { name: amtName, anteil: rund1(anteilAmt), gang: wahlText }), t("wahl.log.wiederwahl_warum", { sitze: e.parlament.lagerSitzeNachher }));
    zeitungEreignis(w, { art: "wahlsieg", titel: t("wahl.zeitung.titel"), fakt: t("wahl.zeitung.fakt", { name: amtName, anteil: rund1(anteilAmt) }), wertung: 1, schluessel: [t("wahl.zeitung.titel")] });
    beginneAmtszeit(w, sp.amtszeit + 1, "wiederwahl");
    // Rückfall für Oberflächen ohne Wahlabend-Ansicht: der Hinweis trägt dieselbe Kennung wie das Ergebnis und wird mit ihm quittiert
    sp.hinweise.push({
      id: e.id,
      titel: t("wahl.hinweis.wiederwahl_titel"),
      szene: "wahlnacht",
      text: [t("wahl.hinweis.wiederwahl_text", { name: amtName, anteil: rund1(anteilAmt), nr: sp.amtszeit, sitze: e.parlament.lagerSitzeNachher, letzte: sp.amtszeit >= maxAmtszeiten(w) ? "ja" : "nein" })],
    });
  } else if (gewonnen && letzte) {
    const text = t("wahl.ende.nachfolger_sieg", { name: amtName, anteil: rund1(anteilAmt), marge });
    beende(w, "amtszeitende", t("wahl.ende.nachfolger_sieg_titel"), text, anteilAmt, "sieg");
  } else if (!gewonnen && letzte) {
    const text = t("wahl.ende.nachfolger_niederlage", { name: amtName, gegner: gegnerName, anteil: rund1(anteilAmt) });
    beende(w, "abwahl", t("wahl.ende.nachfolger_niederlage_titel"), text, anteilAmt, "niederlage");
  } else {
    const text = t("wahl.ende.abwahl", { datum: w.date, name: amtName, gegner: gegnerName, anteil: rund1(anteilAmt), gang: wahlText });
    beende(w, "abwahl", t("wahl.ende.abwahl_titel"), text, anteilAmt);
  }

  // Folgeereignisse (nur bei Sieg): Koalitionsrunde ohne Mehrheit, Anfechtung bei knappem Ergebnis
  if (gewonnen && !sp.ende) {
    if (e.parlament.lagerSitzeNachher < 301) oeffne(w, "wahl_koalitionsrunde", rng, { daten: { sitze: e.parlament.lagerSitzeNachher } });
    if (e.anfechtung === "laufend") oeffne(w, "wahl_anfechtung", rng, { daten: { marge, gegner: gegnerName } });
  }
}

// ---------------------------------------------------------------------------
// Tageshaken

/** Täglich aus der Spielschleife: Stichwahl auszählen, sonst am Wahltag wählen. */
export function wahlTick(w: World, rng: Rng): void {
  const sp = w.spiel;
  if (!sp || sp.ende) return;
  parlamentNachtragPruefen(w);
  const v = sp.wahl?.stichwahl;
  if (v) {
    if (w.day >= v.tag) stichwahlAuszaehlen(w, rng);
    return;
  }
  if (w.day >= sp.wahltag) wahl(w, rng);
}

/** Erster Wahlgang samt Parlamentswahl; entscheidet sofort oder setzt die Stichwahl an. */
export function wahl(w: World, rng: Rng): void {
  const sp = w.spiel!;
  const z = wahlZustand(w);
  const letzte = istLetzteWahl(w);
  const kandidaten = kandidatenFeld(w, letzte);
  const g = ersterWahlgang(w, rng, letzte);
  const bezug = wahlBezugsAnteil(w);
  const { parlament, muster } = parlamentswahlMitMuster(w, rng, g.amt - bezug);
  const absolut = (x: number) => x > 50;
  const runde1 = rundeVon(w, 1, g, g.beteiligung);
  const provinzen = provinzErgebnisse(w, g.amt, g.gegner, muster);
  const entschieden = absolut(g.amt) || absolut(g.gegner) || absolut(g.dritte);
  if (entschieden) {
    abschliessen(w, rng, { kandidaten, runden: [runde1], provinzen, parlament, einfluesse: g.einfluesse }, false);
    return;
  }
  // Stichwahl: Amtsinhaber gegen Hauptgegner
  const dritte = kandidaten.find((k) => k.id === "dritte")!;
  const vorgang: StichwahlVorgang = {
    tag: w.day + WAHL.stichwahlTage,
    runde1,
    kandidaten,
    basis: { amt: g.amt, gegner: g.gegner, dritte: g.dritte },
    uebertrag: uebertragAuf(w, dritte),
    mobilisierung: 0,
    parlament,
    provinzen1: provinzen,
    muster,
    reaktionen: [],
    einfluesse: g.einfluesse,
  };
  z.stichwahl = vorgang;
  const amtName = kandidaten[0]!.name;
  const gegnerName = kandidaten[1]!.name;
  sp.chronik.push({ tag: w.day, datum: w.date, titel: t("wahl.chronik.stichwahl"), ausgang: t("wahl.chronik.stichwahl_text", { amt: rund1(g.amt), gegner: rund1(g.gegner), gegnerName }) });
  addLog(w, "ereignis", t("wahl.log.stichwahl_noetig", { amt: rund1(g.amt), gegner: rund1(g.gegner) }), t("wahl.log.stichwahl_warum", { tage: WAHL.stichwahlTage }));
  sp.hinweise.push({
    id: `wahl-stichwahl-${w.day}`,
    titel: t("wahl.hinweis.stichwahl_titel"),
    szene: "wahlnacht",
    text: [t("wahl.hinweis.stichwahl_text", { amtName, amt: rund1(g.amt), gegnerName, gegner: rund1(g.gegner), tage: WAHL.stichwahlTage })],
  });
  oeffne(w, "wahl_stichwahl", rng, { daten: { amt: rund1(g.amt), gegner: rund1(g.gegner), dritte: rund1(g.dritte), dritteName: dritte.name, uebertrag: Math.round(vorgang.uebertrag * 100) } });
}

/** Zweiter Wahlgang. */
function stichwahlAuszaehlen(w: World, rng: Rng): void {
  const sp = w.spiel!;
  const v = sp.wahl!.stichwahl!;
  const r = stichwahlAnteile(v);
  const amt = clamp(r.amt + rng.normal(WAHL.stichwahlRauschen), 1, 99);
  const gegner = 100 - amt;
  const beteiligung = clamp(v.runde1.beteiligung + WAHL.beteiligungStich, 55, 92);
  const runde2 = rundeVon(w, 2, { amt, gegner }, beteiligung);
  const provinzen = provinzErgebnisse(w, amt, gegner, v.muster);
  abschliessen(w, rng, { kandidaten: v.kandidaten, runden: [v.runde1, runde2], provinzen, parlament: v.parlament, einfluesse: v.einfluesse }, true);
}

// ---------------------------------------------------------------------------
// Siegesrede (Entscheidung am Wahlabend)

export const REDEN: Record<WahlRede, { wirkungen: [string, number][] }> = {
  einend: { wirkungen: [["polarisierung", -2], ["legitimitaet", 1], ["nationalisten", -1]] },
  triumph: { wirkungen: [["polarisierung", 2], ["nationalisten", 1.5], ["konservative", 1], ["legitimitaet", -0.5]] },
  bescheiden: { wirkungen: [["vertrauen_regierung", 0.8], ["legitimitaet", 0.5]] },
};

/** Der Ton der Rede am Wahlabend; wirkt einmal. */
export function rede(w: World, ton: WahlRede): { ok: boolean; text: string } {
  const e = wahlabend(w) ?? letzteWahl(w);
  if (!e || !e.gewonnen) return { ok: false, text: t("wahl.rede.keine") };
  if (e.rede) return { ok: false, text: t("wahl.rede.schon") };
  e.rede = ton;
  for (const [id, d] of REDEN[ton].wirkungen) wirke(w, id, d);
  const text = t(`wahl.rede.${ton}_ausgang`);
  addLog(w, "entscheidung", t("wahl.rede.log", { ton: t(`wahl.rede.${ton}`) }), text);
  return { ok: true, text };
}

// ---------------------------------------------------------------------------
// Anfechtung (knapper Sieg): Der Hohe Wahlrat entscheidet endgültig

export function anfechtungAbschluss(w: World, ausgang: "abgewiesen" | "keine"): void {
  const e = letzteWahl(w);
  if (e) e.anfechtung = ausgang;
}

// ---------------------------------------------------------------------------
// Hochrechnung für die Wahlabend-Ansicht

export interface HochrechnungsStufe {
  /** Anteil der ausgezählten Stimmen, 0 bis 1 */
  gezaehlt: number;
  amt: number;
  gegner: number;
  dritte?: number;
  /** Kfz-Kennziffern der bis hierhin ausgezählten Provinzen */
  provinzen: number[];
}

/** Fünf Stufen der Auszählung: Die Anteile laufen mit abnehmender Streuung auf das Endergebnis zu (deterministisch aus der Wahl). */
export function hochrechnung(e: WahlErgebnis, stufen = 5): HochrechnungsStufe[] {
  const r = e.runden[e.runden.length - 1]!;
  const reihenfolge = [...PROVINZEN].map((p) => p.plaka).sort((a, b) => hashZahl(`${e.id}|z|${a}`) - hashZahl(`${e.id}|z|${b}`));
  const out: HochrechnungsStufe[] = [];
  for (let s = 1; s <= stufen; s++) {
    const anteil = s / stufen;
    const streu = (1 - anteil) * 5;
    const verschiebung = (hashZahl(`${e.id}|h|${s}`) - 0.5) * 2 * streu;
    const amt = s === stufen ? (r.anteile.amt ?? 0) : clamp((r.anteile.amt ?? 0) + verschiebung, 1, 99);
    const dritte = r.anteile.dritte;
    const gegner = s === stufen ? (r.anteile.gegner ?? 0) : clamp((r.anteile.gegner ?? 0) - verschiebung * 0.9, 1, 99);
    out.push({ gezaehlt: anteil, amt: rund1(amt), gegner: rund1(gegner), ...(dritte !== undefined ? { dritte } : {}), provinzen: reihenfolge.slice(0, Math.round(reihenfolge.length * anteil)) });
  }
  return out;
}


// ---------------------------------------------------------------------------
// Nachträgliche Parlamentswahl für ältere Spielstände
//
// Ältere Stände haben die Wahl ohne Parlamentswahl gespielt: Die Amtszeit zählte weiter, die Sitze blieben. Einmalig und nur auf Wunsch wird die
// Parlamentswahl nachgeholt, mit den Regeln der Wahl (Hürde, Bündnisse, D'Hondt je Provinz) und der Stimmung um den Wahltag aus dem Verlauf der Zustimmung.
// Der Wahlsieg des Präsidenten steht fest (er ist im Amt); sein Ergebnis wird nicht neu gewürfelt. Umbildung und Zielwahl (sim/amtszeit.ts: nachholen)
// kommen erst nach der Antwort.

export const NACHTRAG = {
  /** So lange nach der Wahl (Tage; 14 Monate) wird noch gefragt */
  monate: 14,
  /** Mindestanteil des Präsidenten, den die Schätzung annimmt (er hat im ersten Wahlgang oder in der Stichwahl gewonnen: Spielparameter) */
  amtMindestens: 50.5,
  /** Beteiligung der nachgetragenen Wahl (Spielparameter, wie die erste Runde der übrigen Wahlen im Mittel) */
  beteiligung: 85,
} as const;

/** Die Frage nach dem Nachtrag, solange sie offen ist (die Oberfläche zeigt ihr Fenster vor Umbildung und Zielwahl). */
export function parlamentNachtragFrage(w: World): NachtragZustand | undefined {
  const n = w.spiel?.wahl?.nachtrag;
  return n && n.status === "frage" ? n : undefined;
}

/** Ob die Frage schon beantwortet ist (oder nie gestellt wurde, weil die Wahl neu gespielt wurde). */
export const parlamentNachtragBeantwortet = (w: World): boolean => {
  const n = w.spiel?.wahl?.nachtrag;
  return !n || n.status !== "frage";
};

/**
 * Stellt die Frage einmalig, wenn der Stand die Wahl noch ohne Parlamentswahl kennt: Amtszeit 2 oder höher, die Wahl liegt höchstens 14 Monate zurück, und die
 * Historie enthält für sie kein Ergebnis (ältere Spielstände). Der Merker im Spielstand verhindert jede Wiederholung.
 */
export function parlamentNachtragPruefen(w: World): void {
  const sp = w.spiel;
  if (!sp || sp.ende || sp.amtszeit < 2) return;
  if (sp.wahl?.nachtrag) return;
  if ((sp.wahl?.historie.length ?? 0) >= sp.amtszeit - 1) return;
  const a = aktuelleAmtszeit(w);
  if (a.nr < 2 || w.day - a.tag > NACHTRAG.monate * 30.4) return;
  wahlZustand(w).nachtrag = { status: "frage", tag: a.tag, datum: a.datum, seit: w.day };
  addLog(w, "ereignis", t("wahl.nachtrag.log_frage"), t("wahl.nachtrag.log_frage_warum", { datum: a.datum }));
}

/** Die Zustimmung im Monat der Wahl aus dem Verlauf (sonst die nächste frühere Messung, sonst die heutige). */
function zustimmungAmWahltag(w: World, datum: string): number {
  const verlauf = w.spiel!.umfrage.verlauf;
  const monat = datum.slice(0, 7);
  const treffer = verlauf.find((v) => v.monat === monat) ?? [...verlauf].reverse().find((v) => v.monat <= monat);
  return treffer?.wert ?? w.spiel!.umfrage.zustimmung;
}

/**
 * Antwort auf die Frage. „nein“: Das Parlament bleibt, nie wieder fragen. „ja“: Die Parlamentswahl wird nachgeholt (neue Sitze, Lager, Koalitionsrunde bei
 * fehlender Mehrheit, Wahlabend, Zeitung, Chronik). Danach laufen Umbildung und Zielwahl des Nachholens.
 */
export function parlamentNachtragAntwort(w: World, antwort: "ja" | "nein", rngVorgabe?: Rng): { ok: boolean; text: string } {
  const sp = w.spiel;
  const n = sp?.wahl?.nachtrag;
  if (!sp || !n || n.status !== "frage") return { ok: false, text: t("wahl.nachtrag.keine_frage") };
  if (antwort === "nein") {
    n.status = "nein";
    addLog(w, "entscheidung", t("wahl.nachtrag.log_nein"), t("wahl.nachtrag.log_nein_warum"));
    nachholen(w);
    return { ok: true, text: t("wahl.nachtrag.nein_ausgang") };
  }
  const rng = rngVorgabe ?? new Rng((w.seed ^ 0x5a3c ^ Math.imul(w.day, 2654435761)) | 0);
  // Der Präsident hat gewonnen (er ist im Amt): Seine Zustimmung am Wahltag, mindestens knapp über der Hälfte, bestimmt die Verschiebung des Lagers
  const zust = zustimmungAmWahltag(w, n.datum);
  const amt = Math.max(NACHTRAG.amtMindestens, zust);
  const { parlament, muster } = parlamentswahlMitMuster(w, rng, amt - wahlBezugsAnteil(w));
  const lagerAnteil = rund1(parlament.lagerNachher.reduce((s, p) => s + (parlament.anteile[p] ?? 0), 0));
  const opposition = Object.entries(parlament.anteile)
    .filter(([p]) => !parlament.lagerNachher.includes(p) && p !== "Andere")
    .sort((x, y) => y[1] - x[1]);
  const hauptGegner = opposition[0];
  const gegnerAnteil = rund1(hauptGegner?.[1] ?? 0);
  const kandidaten = kandidatenFeld(w, false);
  kandidaten[1] = { ...kandidaten[1]!, partei: hauptGegner?.[0] ?? kandidaten[1]!.partei, parteiName: PARTEI_NAME[hauptGegner?.[0] ?? ""] ?? hauptGegner?.[0] ?? kandidaten[1]!.parteiName };
  const runde = rundeVon(w, 1, { amt: lagerAnteil, gegner: gegnerAnteil, dritte: Math.max(0, 100 - lagerAnteil - gegnerAnteil) }, NACHTRAG.beteiligung);
  runde.tag = n.tag;
  runde.datum = n.datum;
  const z = wahlZustand(w);
  const e: WahlErgebnis = {
    id: `wahl-nachtrag-${w.day}`,
    nummer: z.historie.length + 1,
    amtszeit: sp.amtszeit - 1,
    tag: n.tag,
    datum: n.datum,
    kandidaten,
    runden: [runde],
    sieger: "amt",
    gewonnen: true,
    marge: rund1(lagerAnteil - gegnerAnteil),
    provinzen: provinzErgebnisse(w, lagerAnteil, gegnerAnteil, muster),
    parlament,
    reaktionen: [],
    anfechtung: "keine",
    letzteWahl: false,
    nachgetragen: true,
  };
  // Reaktionen: das Lager im Parlament (wie bei jeder Wahl), dazu die Opposition mit ihrem Sitzanteil
  const lagerReaktion = reaktionen(w, { ...e, marge: Math.max(e.marge, WAHL.knapp) }, false).filter((r) => r.wer === "partei");
  e.reaktionen = [
    { wer: "opposition", wertung: 0, text: msg("wahl.reaktion.nachtrag_opposition", { partei: PARTEI_NAME[hauptGegner?.[0] ?? ""] ?? hauptGegner?.[0] ?? "", sitze: parlament.sitzeNachher[hauptGegner?.[0] ?? ""] ?? 0 }) },
    ...lagerReaktion,
  ];
  z.historie.push(e);
  z.abend = e.id;
  n.status = "ja";
  n.ergebnis = e.id;
  const sitze = parlament.lagerSitzeNachher;
  const diff = sitze - parlament.lagerSitzeVorher;
  sp.chronik.push({
    tag: w.day,
    datum: w.date,
    titel: t("wahl.nachtrag.chronik_titel"),
    ausgang: t("wahl.nachtrag.chronik_text", { datum: n.datum, vorher: parlament.lagerSitzeVorher, nachher: sitze, richtung: diff >= 0 ? "plus" : "minus", diff: Math.abs(diff) }),
  });
  addLog(w, "entscheidung", t("wahl.nachtrag.log_ja", { datum: n.datum }), t("wahl.nachtrag.log_ja_warum", { vorher: parlament.lagerSitzeVorher, nachher: sitze }));
  zeitungEreignis(w, {
    art: sitze >= 301 ? "wahlsieg" : "bruch",
    titel: t("wahl.nachtrag.zeitung_titel"),
    fakt: t("wahl.nachtrag.zeitung_fakt", { datum: n.datum, nachher: sitze, mehrheit: sitze >= 301 ? "ja" : "nein" }),
    wertung: sitze >= 301 ? 1 : -1,
    schluessel: [t("wahl.nachtrag.zeitung_titel")],
  });
  // Rückfall für Oberflächen ohne Wahlabend-Ansicht: Der Hinweis trägt dieselbe Kennung wie das Ergebnis
  sp.hinweise.push({
    id: e.id,
    titel: t("wahl.nachtrag.hinweis_titel"),
    szene: "wahlnacht",
    text: [t("wahl.nachtrag.hinweis_text", { datum: n.datum, vorher: parlament.lagerSitzeVorher, nachher: sitze })],
  });
  if (sitze < 301) oeffne(w, "wahl_koalitionsrunde", rng, { daten: { sitze } });
  nachholen(w);
  return { ok: true, text: t("wahl.nachtrag.ja_ausgang", { nachher: sitze }) };
}
