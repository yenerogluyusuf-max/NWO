// Pakte, Koalitionen und Kriege zwischen anderen Staaten.
//
// Drei Dinge, die vorher fehlten (VERBESSERUNGSPLAN, KARTE_KONZEPT_2026-10-04.md, Abschnitt 6):
//   1. Pakte als Objekte. Aus den Institutionen (data/welt-institutionen.ts) und den laufenden Beistandsklauseln der Verträge
//      (sim/abkommen.ts) entsteht je Pakt eine Klausel: kollektiv, Beistand, Konsultation oder keine Verpflichtung.
//   2. Koalitionen im Krieg der Türkei. Pflicht entsteht nur aus einem Pakt UND nur, wenn ein Mitglied ANGEGRIFFEN wird. Wer selbst
//      angreift, löst keinen Bündnisfall aus (die NATO-Klausel schützt kein Mitglied, das angreift) und verliert Ansehen im Pakt.
//      Sitzen beide Streitparteien im selben Pakt, spaltet der Krieg den Pakt, statt ihn zu verpflichten. Daneben entscheidet das
//      Eigeninteresse: Bündniswert, Misstrauen, Handel, eigene Kriegsbelastung. Wer beitritt, trägt zur Stärke bei (sim/krieg.ts);
//      Partner der Gegenseite blockieren harte Friedenspakete, bis ihre Kampfkraft erschöpft ist.
//   3. Kriege zwischen anderen Staaten (Weltmodell). Sie entstehen aus den Spannungswerten der Paare und aus den Vermittlungskonflikten,
//      ziehen Pakte hinein und schicken der Türkei einen Beistandsruf, wenn ein Pakt-Partner angegriffen wird.
//
// Der Zustand liegt im Weltmodell (`kriege`, `rufe`) und im Konfliktvorgang (`koalition`); ältere Spielstände legen ihn beim ersten
// Zugriff an. Zufall kommt nur aus abgeleiteten Quellen (Seed, Monat, Kennungen), nie aus dem Spielstrom.
// Alle Zahlen sind Spielparameter (Platzhalter der Kalibrierung), keine Tatsachenbehauptungen. Tatsachen stehen nur in Texten mit Quelle.

import { INSTITUTIONEN } from "../data/welt-institutionen";
import { HEISSE_PAARE } from "../data/welt-daten";
import { WEITERE_NACH_ID } from "../data/welt-weitere";
import { NET } from "./modell";
import { wirke } from "./wirkung";
import { addLog } from "./log";
import { clamp } from "./economy";
import { landAendern, weltZustand } from "./laender";
import { alleLaufenden, laufende } from "./abkommen";
import { kosten } from "./ereignis-hilfen";
import {
  AKTEUR_IDS,
  akteurDat,
  akteurName,
  beziehungAendern,
  beziehungZurTuerkei,
  eigenVon,
  hashInt,
  istHauptakteur,
  paarVon,
  setzePaar as paarAendern,
  setzeKriegHaken,
  weltModell,
  weltNotiz,
  type WeltModell,
} from "./welt-modell";
import type { World } from "./types";
import type { KoalitionsAbwesender, KoalitionsPartner, KriegKoalition, KriegVorgang, KriegsRahmung } from "./krieg-typen";
import type {
  DrittKrieg,
  KoalitionenSicht,
  KoalitionsSicht,
  PaktDef,
  PaktKlausel,
  PaktSicht,
} from "./pakte-typen";
import { t as tx } from "../i18n";

export type { DrittKrieg, KoalitionenSicht, KoalitionsSicht, PaktDef, PaktKlausel, PaktSicht } from "./pakte-typen";

export const TUR = "TUR";

// ---------------------------------------------------------------------------
// Stärketabellen (aus sim/krieg.ts hierher gezogen, damit Gegner UND Partner dieselbe Waage haben)

/**
 * Gegnerische Kriegsstärke je Land (Spielparameter, keine Tatsachen): grob aus Größe, Rüstung und
 * Regionaleigenschaften abgeleitet — bewusst als pauschale Tabelle, damit die Rechnung lesbar bleibt.
 */
export const GEGNER_STAERKE: Record<string, number> = {
  USA: 82, RUS: 74, CHN: 88, EU: 55,
  GRC: 52, IRN: 58, SYR: 28, IRQ: 36, ARM: 26, ISR: 64, GEO: 22, CYP: 14, UKR: 40,
  AZE: 34, SAU: 48, EGY: 46, LBY: 20, KAZ: 24,
};
export const GEGNER_GRUPPE: Record<string, number> = { "Große Mächte": 78, Nachbarn: 50, "Verbündete und Partner": 40 };

/** Die Waage eines Partners oder Gegners auf der Skala 0 bis 100 (Hauptakteure aus der Tabelle, weitere aus Rüstung und Klasse). */
export function akteurStaerke(w: World, id: string): number {
  const t = GEGNER_STAERKE[id];
  if (t !== undefined) return t;
  const e = eigenVon(w, id);
  const klasse = WEITERE_NACH_ID.get(id)?.klasse;
  // Spielparameter: Rüstungsquote und Entwicklungsstand als grobes Maß
  return clamp(28 + 7 * e.ruestung + (klasse === "fortgeschritten" ? 14 : klasse === "aufstrebend" ? 8 : 0), 15, 80);
}

// ---------------------------------------------------------------------------
// Pakte

/** Die Klausel je Institution mit ihrer Quelle. Was hier nicht steht, hat keine Verteidigungspflicht. */
const KLAUSELN: Record<string, { klausel: PaktKlausel; text: string; quelle: string }> = {
  nato: {
    klausel: "kollektiv",
    text: tx("sim2.sim.pakte.21a239f"),
    quelle: "Nordatlantikvertrag, Art. 5",
  },
  mekka: {
    klausel: "kollektiv",
    text: tx("sim2.sim.pakte.5b8b98a"),
    quelle: "Dossier 12; data/welt-institutionen.ts",
  },
  eu: {
    klausel: "beistand",
    text: tx("sim2.sim.pakte.9090acb"),
    quelle: "Vertrag über die Europäische Union, Art. 42 Abs. 7",
  },
  golf: {
    klausel: "beistand",
    text: tx("sim2.sim.pakte.770b33d"),
    quelle: "Golf-Kooperationsrat, Gemeinsames Verteidigungsabkommen (2000), öffentlich bekannt; Gewicht ist Spielparameter",
  },
  sco: {
    klausel: "konsultation",
    text: tx("sim2.sim.pakte.e2fcbf9"),
    quelle: "Dossier B2; Mitgliederliste der SOZ",
  },
  ots: {
    klausel: "konsultation",
    text: tx("sim2.sim.pakte.9bf5c76"),
    quelle: "Dossiers 10, 16",
  },
};

/** Gewicht der Pflicht je Klausel (Spielparameter). */
export const PFLICHT: Record<PaktKlausel, number> = { kollektiv: 1, beistand: 0.6, konsultation: 0.2, keine: 0 };

export const KLAUSEL_NAME: Record<PaktKlausel, string> = {
  kollektiv: "Kollektive Verteidigung",
  beistand: "Beistand",
  konsultation: "Konsultation",
  keine: "Keine Verteidigungspflicht",
};

let paktCache: PaktDef[] | undefined;

/** Die Pakte aus den Institutionen (ohne laufende Verträge). */
export function paktDefs(): PaktDef[] {
  if (paktCache) return paktCache;
  paktCache = INSTITUTIONEN.map((i): PaktDef => {
    const k = KLAUSELN[i.id];
    const mitglieder = [...(i.id === "eu" ? ["EU"] : []), ...i.mitglieder, ...(i.tuerkei === "mitglied" ? [TUR] : [])];
    return {
      id: i.id,
      name: i.name,
      kurz: i.kurz,
      klausel: k?.klausel ?? "keine",
      mitglieder,
      partner: [...(i.partner ?? []), ...(i.beobachter ?? []), ...(i.tuerkei === "partner" || i.tuerkei === "dialog" || i.tuerkei === "beobachter" ? [TUR] : [])],
      text: k?.text ?? i.text,
      quelle: k?.quelle ?? i.quelle,
    };
  });
  return paktCache;
}

/** Laufende bilaterale Beistandsklauseln der Verträge (die Mekka-Klausel ist schon als Pakt erfasst). */
function bilateralePakte(w: World): PaktDef[] {
  const out: PaktDef[] = [];
  for (const v of alleLaufenden(w)) {
    if (!v.gibt.includes("beistand") || v.id.includes("mekka")) continue;
    out.push({
      id: `bilateral-${v.land}`,
      name: tx("sim2.sim.pakte.253aaef", { p0: akteurDat(v.land) }),
      kurz: `Klausel ${v.land}`,
      klausel: "beistand",
      mitglieder: [TUR, v.land],
      partner: [],
      text: tx("sim2.sim.pakte.f6ac897"),
      quelle: "Vertrag am Verhandlungstisch (sim/abkommen.ts)",
      bilateral: true,
    });
  }
  return out;
}

export function allePakte(w: World): PaktDef[] {
  return [...paktDefs(), ...bilateralePakte(w)];
}

/** Die Pakte, in denen ein Akteur Mitglied ist. */
export function pakteVon(w: World, id: string): PaktDef[] {
  return allePakte(w).filter((p) => p.mitglieder.includes(id));
}

// ---------------------------------------------------------------------------
// Parameter der Koalitionen im Krieg der Türkei

export const KOALITION = {
  /** Punkte einer vollen Pflicht (Klausel × Angriffslage) */
  pflicht: 55,
  /** Eigeninteresse: Bündnisnähe, Feindschaft, Misstrauen/Vertrauen, Handel, eigene Kriegsbelastung */
  bindung: 0.35,
  feind: 0.3,
  vertrauen: 0.4,
  sicherheit: 0.2,
  handel: 0.12,
  krieg: 0.25,
  /** Ab so vielen Punkten tritt der Staat bei; zwischen Zögerschwelle und Beitritt zögert er und wird weiter geprüft */
  beitrittAb: 45,
  zoegernAb: 28,
  /** Aufschlag, wenn die Türkei um Beistand bittet (Handlung „Bündnispartner rufen“) */
  rufBonus: 14,
  /** Deterministisches Rauschen der Bewertung (Punkte, Betrag) */
  rauschen: 4,
  /** Höchstzahl der Partner je Seite */
  maxJeSeite: 10,
  /** Beitrag zur eigenen Stärke je Partner (Anteil seiner Waage) und Deckel der Summe */
  beitragEigen: 0.28,
  deckelEigen: 0.4,
  /** Beitrag zur Gegnerstärke je Partner (Anteil seiner Waage) und Deckel in Stärkepunkten */
  beitragGegner: 0.16,
  deckelGegner: 16,
  /** Lastteilung: so viel weniger Verlust und Erschöpfung je Partner (Deckel) */
  lastJePartner: 0.1,
  lastDeckel: 0.3,
  /** Schwund der Kampfkraft je Woche: Grundverschleiß und Zuschlag, wenn die Seite verliert */
  verschleiss: 0.008,
  erosion: 0.02,
  aussteigenUnter: 0.2,
  /** Blockade harter Friedenspakete je Gegenpartner (Prozentpunkte der Annahme) und Deckel */
  blockade: 6,
  blockadeDeckel: 24,
  /** Abkühlung der Bitte um Beistand (Tage) */
  rufTage: 21,
  /** Ansehen und Beziehung zu den Pakt-Führern, wenn die Türkei als Angreifer den Bündnisfall nicht auslöst */
  paktAnsehen: 2,
  paktBeziehung: 2,
} as const;

/** Pflicht-Anteile nach Rahmung, wenn die Türkei beginnt: wessen Pakt-Mitglied gilt als angegriffen. */
const PFLICHT_RAHMUNG: Record<KriegsRahmung, { eigen: number; gegner: number }> = {
  verteidigung: { eigen: 0.5, gegner: 0.5 }, // beide Seiten behaupten, sich zu verteidigen
  schutz: { eigen: 0, gegner: 1 },
  beistand: { eigen: 0, gegner: 1 },
  revision: { eigen: 0, gegner: 1 },
};

/** Wie stark der Bündnisfall zugunsten der jeweiligen Seite greift (0 bis 1). */
function pflichtAnteile(aggressor: "tuerkei" | "gegner", rahmung: KriegsRahmung | undefined): { eigen: number; gegner: number } {
  if (aggressor === "gegner") return { eigen: 1, gegner: 0 };
  return PFLICHT_RAHMUNG[rahmung ?? "revision"];
}

interface Bewertung {
  id: string;
  seite: "eigen" | "gegner";
  punkte: number;
  pflicht: number;
  pakt?: string;
  grund: string;
}

function rauschenVon(w: World, k: KriegVorgang, id: string): number {
  return (hashInt(`${w.seed}|koal|${k.id}|${id}`) / 4294967296 - 0.5) * 2 * KOALITION.rauschen;
}

/** Bewertet einen Staat für eine Seite: Pflicht aus Pakten plus Eigeninteresse. */
function bewerteFuer(w: World, pakte: PaktDef[], k: KriegVorgang, c: string, seite: "eigen" | "gegner", aggressor: "tuerkei" | "gegner", bonus: number, spaltung: Set<string>): Bewertung {
  const L = k.land;
  const X = seite === "eigen" ? TUR : L;
  const Y = seite === "eigen" ? L : TUR;
  const anteil = pflichtAnteile(aggressor, k.rahmung)[seite];
  let pflicht = 0;
  let pakt: string | undefined;
  for (const p of pakte) {
    if (!p.mitglieder.includes(c) || !p.mitglieder.includes(X)) continue;
    const g = PFLICHT[p.klausel];
    if (g <= 0) continue;
    if (p.mitglieder.includes(Y)) {
      // Beide Streitparteien im selben Pakt: Der Krieg spaltet ihn, die Klausel verpflichtet niemanden
      if (g >= PFLICHT.beistand) spaltung.add(p.id);
      continue;
    }
    // Das Opfer ist die Seite mit dem Anteil; der Angreifer löst keinen Bündnisfall aus
    const wert = g * anteil;
    if (wert > pflicht) {
      pflicht = wert;
      pakt = p.id;
    }
  }
  const e = eigenVon(w, c);
  const tr = beziehungZurTuerkei(w, c);
  const b = c === L ? 100 : paarVon(w, c, L).buendnis;
  let punkte: number;
  if (seite === "eigen") {
    punkte =
      KOALITION.pflicht * pflicht +
      KOALITION.vertrauen * Math.max(0, tr.vertrauen - 40) +
      KOALITION.sicherheit * Math.max(0, tr.sicherheit - 40) +
      KOALITION.feind * Math.max(0, -b) -
      KOALITION.bindung * Math.max(0, b) -
      KOALITION.krieg * e.krieg -
      (e.stabilitaet < 30 ? 15 : 0);
  } else {
    punkte =
      KOALITION.pflicht * pflicht +
      KOALITION.bindung * Math.max(0, b) +
      KOALITION.feind * Math.max(0, tr.konflikt - 30) +
      KOALITION.vertrauen * 0.9 * Math.max(0, 45 - tr.vertrauen) -
      KOALITION.vertrauen * 0.75 * Math.max(0, tr.vertrauen - 55) -
      KOALITION.handel * Math.max(0, tr.handel - 40) -
      KOALITION.krieg * e.krieg -
      (e.stabilitaet < 30 ? 15 : 0);
  }
  punkte += rauschenVon(w, k, c) + bonus;
  const grund =
    pflicht > 0.55
      ? tx("sim2.sim.pakte.41c66bb", { p0: paktName(w, pakt!) })
      : pflicht > 0
        ? tx("sim2.sim.pakte.c2253d6", { p0: paktName(w, pakt!) })
        : seite === "gegner"
          ? b >= 50
            ? tx("sim2.sim.pakte.06de800")
            : tr.vertrauen < 40
              ? tx("sim2.sim.pakte.c0d52f6")
              : "Eigeninteresse"
          : tr.vertrauen >= 55
            ? tx("sim2.sim.pakte.cacd02c")
            : "Eigeninteresse";
  return { id: c, seite, punkte, pflicht, ...(pakt ? { pakt } : {}), grund };
}

function paktName(w: World, id: string): string {
  return allePakte(w).find((p) => p.id === id)?.kurz ?? id;
}

/** Alle Kandidaten bewerten und der besseren Seite zuordnen. */
function bewerteAlle(w: World, k: KriegVorgang, aggressor: "tuerkei" | "gegner", bonus: number): { liste: Bewertung[]; spaltung: Set<string> } {
  const spaltung = new Set<string>();
  const liste: Bewertung[] = [];
  const pakte = allePakte(w);
  for (const c of AKTEUR_IDS) {
    if (c === k.land) continue;
    const e = bewerteFuer(w, pakte, k, c, "eigen", aggressor, bonus, spaltung);
    const g = bewerteFuer(w, pakte, k, c, "gegner", aggressor, 0, spaltung);
    // Der Ruf der Türkei (bonus) gilt nur der eigenen Seite
    liste.push(e.punkte >= g.punkte ? e : g);
  }
  liste.sort((a, b) => b.punkte - a.punkte);
  return { liste, spaltung };
}

function einsatzVon(punkte: number): number {
  return Math.round(clamp(punkte / 80, 0.4, 1) * 100) / 100;
}

function beitrittWirkung(w: World, p: KoalitionsPartner): void {
  if (p.seite === "gegner") beziehungAendern(w, p.id, { vertrauen: -6, konflikt: 8 }, tx("sim2.sim.pakte.65f9f18", { p0: p.grund }));
  else beziehungAendern(w, p.id, { vertrauen: 3, sicherheit: 2 }, tx("sim2.sim.pakte.e1d2602", { p0: p.grund }));
}

const koalitionVon = (_w: World, k: KriegVorgang): KriegKoalition | undefined => k.koalition;

/** Zählt die Partner einer Seite. */
const zaehle = (ko: KriegKoalition, seite: "eigen" | "gegner"): number => ko.partner.filter((p) => p.seite === seite).length;

/**
 * Baut oder aktualisiert die Koalitionen eines Vorgangs (beim Kriegsbeginn, wöchentlich für Zögernde und auf Bitten der Türkei).
 * Liefert die neu hinzugekommenen Partner. `erstmals` löst die Folgen für Verweigerer aus.
 */
export function koalitionAufbauen(w: World, k: KriegVorgang, aggressor: "tuerkei" | "gegner", opts: { bonus?: number; erstmals?: boolean } = {}): KoalitionsPartner[] {
  const bonus = opts.bonus ?? 0;
  const ko: KriegKoalition = (k.koalition ??= { aggressor, partner: [], abwesend: [], bewertet: w.day });
  ko.aggressor = aggressor;
  ko.bewertet = w.day;
  const { liste, spaltung } = bewerteAlle(w, k, aggressor, bonus);
  if (spaltung.size > 0 && !ko.spaltung) ko.spaltung = [...spaltung][0];
  const neu: KoalitionsPartner[] = [];
  const abwesend: KoalitionsAbwesender[] = [];
  for (const b of liste) {
    if (ko.partner.some((p) => p.id === b.id)) continue;
    // Auch hineingezogene Staaten einer Seite sind Teil der Rechnung des Gegners (Hauptgegner steht in k.land)
    if (b.punkte >= KOALITION.beitrittAb && zaehle(ko, b.seite) < KOALITION.maxJeSeite) {
      const partner: KoalitionsPartner = {
        id: b.id,
        seite: b.seite,
        seit: w.day,
        grund: b.grund,
        ...(b.pakt ? { pakt: b.pakt } : {}),
        pflicht: b.pflicht > 0.3,
        rest: 1,
        einsatz: einsatzVon(b.punkte),
      };
      ko.partner.push(partner);
      neu.push(partner);
      beitrittWirkung(w, partner);
    } else if (b.pflicht > 0.3 || b.punkte >= KOALITION.zoegernAb) {
      abwesend.push({ id: b.id, seite: b.seite, pflicht: b.pflicht > 0.3, grund: b.pflicht > 0.3 ? tx("sim2.sim.pakte.6eca341", { p0: paktName(w, b.pakt!) }) : b.grund, punkte: Math.round(b.punkte), zoegert: b.punkte >= KOALITION.zoegernAb });
    }
  }
  ko.abwesend = abwesend;
  if (opts.erstmals) {
    // Wer die Pflicht gegenüber der Türkei nicht erfüllt, kostet Vertrauen (einmalig)
    for (const a of abwesend) {
      if (a.seite === "eigen" && a.pflicht && !a.zoegert) beziehungAendern(w, a.id, { vertrauen: -4, sicherheit: -3 }, tx("sim2.sim.pakte.2257d18"));
    }
  }
  return neu;
}

// ---------------------------------------------------------------------------
// Wirkung auf den Krieg

const vorschauCache = new WeakMap<World, { schluessel: string; ko: KriegKoalition }>();

/** Vorschau, wer mitmachen würde (ohne Folgen), solange der Vorgang noch keine Koalition hat (je Tag zwischengespeichert). */
function vorschau(w: World, k: KriegVorgang): KriegKoalition {
  const schluessel = `${k.id}|${w.day}|${k.rahmung ?? ""}|${k.kriegszielDeklariert ? 1 : 0}`;
  const hit = vorschauCache.get(w);
  if (hit && hit.schluessel === schluessel) return hit.ko;
  const ko = vorschauBerechnen(w, k);
  vorschauCache.set(w, { schluessel, ko });
  return ko;
}

function vorschauBerechnen(w: World, k: KriegVorgang): KriegKoalition {
  const aggressor: "tuerkei" | "gegner" = k.kriegszielDeklariert ? "tuerkei" : "gegner";
  const { liste, spaltung } = bewerteAlle(w, k, aggressor, 0);
  const ko: KriegKoalition = { aggressor, partner: [], abwesend: [], bewertet: w.day };
  if (spaltung.size > 0) ko.spaltung = [...spaltung][0];
  for (const b of liste) {
    if (b.punkte >= KOALITION.beitrittAb && zaehle(ko, b.seite) < KOALITION.maxJeSeite) {
      ko.partner.push({ id: b.id, seite: b.seite, seit: w.day, grund: b.grund, ...(b.pakt ? { pakt: b.pakt } : {}), pflicht: b.pflicht > 0.3, rest: 1, einsatz: einsatzVon(b.punkte) });
    } else if (b.pflicht > 0.3 || b.punkte >= KOALITION.zoegernAb) {
      ko.abwesend.push({ id: b.id, seite: b.seite, pflicht: b.pflicht > 0.3, grund: b.grund, punkte: Math.round(b.punkte), zoegert: b.punkte >= KOALITION.zoegernAb });
    }
  }
  return ko;
}

/** Die Koalition eines Vorgangs: die gespeicherte oder, vor dem Krieg, die Vorschau. */
function koalitionOderVorschau(w: World, k: KriegVorgang): KriegKoalition {
  return koalitionVon(w, k) ?? vorschau(w, k);
}

/** Beitrag der Koalitionen zur Stärke: Aufschlag auf die eigene (Faktor) und auf die des Gegners (Stärkepunkte). */
export function koalitionsFaktoren(w: World, k: KriegVorgang): { eigenPlus: number; gegnerPlus: number } {
  const ko = koalitionOderVorschau(w, k);
  let eigen = 0;
  let gegner = 0;
  for (const p of ko.partner) {
    const s = akteurStaerke(w, p.id) / 100;
    if (p.seite === "eigen") eigen += KOALITION.beitragEigen * s * p.einsatz * p.rest;
    else gegner += KOALITION.beitragGegner * s * 100 * p.einsatz * p.rest;
  }
  return { eigenPlus: Math.min(KOALITION.deckelEigen, eigen), gegnerPlus: Math.min(KOALITION.deckelGegner, gegner) };
}

/** Lastteilung: Anteil, um den Verlust und Erschöpfung der Seite sinken (0 bis Deckel). */
export function lastTeilung(w: World, k: KriegVorgang): { eigen: number; gegner: number } {
  const ko = koalitionVon(w, k);
  if (!ko) return { eigen: 0, gegner: 0 };
  const zahl = (s: "eigen" | "gegner") => ko.partner.filter((p) => p.seite === s).reduce((a, p) => a + p.rest * p.einsatz, 0);
  return { eigen: Math.min(KOALITION.lastDeckel, KOALITION.lastJePartner * zahl("eigen")), gegner: Math.min(KOALITION.lastDeckel, KOALITION.lastJePartner * zahl("gegner")) };
}

/** Zahl der Partner des Gegners, die ein hartes Paket (Gebiet oder Reparation) blockieren; die Blockade in Prozentpunkten der Annahme. */
export function paketBlockade(w: World, k: KriegVorgang, hart: boolean): number {
  const ko = koalitionVon(w, k);
  if (!ko) return 0;
  const summe = ko.partner.filter((p) => p.seite === "gegner").reduce((a, p) => a + p.rest * KOALITION.blockade, 0);
  return Math.min(KOALITION.blockadeDeckel, summe) * (hart ? 1 : 0.4);
}

/** Bei Kriegsbeginn: die Koalitionen bilden, die Folgen des Bündnisfalls verbuchen, einen Hinweis schreiben. */
export function koalitionenBeiKriegsbeginn(w: World, k: KriegVorgang, weg: "parlament" | "erlass" | "angriff"): void {
  const aggressor: "tuerkei" | "gegner" = weg === "angriff" ? "gegner" : "tuerkei";
  // Ein Beistandsvorgang hat seinen Partner schon an der Seite der Türkei; er bleibt, die Bewertung ergänzt nur
  koalitionAufbauen(w, k, aggressor, { erstmals: true });
  const ko = k.koalition!;
  if (aggressor === "tuerkei") paktFolgenAngriff(w, k);
  const zeilen: string[] = [];
  const eigen = ko.partner.filter((p) => p.seite === "eigen");
  const gegner = ko.partner.filter((p) => p.seite === "gegner");
  if (aggressor === "gegner") zeilen.push(tx("sim2.sim.pakte.8817a14", { p0: akteurName(k.land) }));
  else if (ko.spaltung) zeilen.push(tx("sim2.sim.pakte.68adee8", { p0: paktName(w, ko.spaltung) }));
  else zeilen.push(tx("sim2.sim.pakte.1bed9d1", { p0: akteurName(k.land) }));
  if (eigen.length) zeilen.push(tx("sim2.sim.pakte.15fdf42", { p0: eigen.map((p) => `${akteurName(p.id)} (${p.grund})`).join("; ") }));
  else zeilen.push(tx("sim2.sim.pakte.72a604f"));
  if (gegner.length) zeilen.push(tx("sim2.sim.pakte.f91450c", { p0: akteurName(k.land), p1: gegner.map((p) => `${akteurName(p.id)} (${p.grund})`).join("; ") }));
  const verweigert = ko.abwesend.filter((a) => a.seite === "eigen" && a.pflicht && !a.zoegert);
  if (verweigert.length) zeilen.push(tx("sim2.sim.pakte.0d33b02", { p0: verweigert.map((a) => akteurName(a.id)).join(", ") }));
  const zoegernde = ko.abwesend.filter((a) => a.zoegert);
  if (zoegernde.length) zeilen.push(tx("sim2.sim.pakte.ac28270", { p0: zoegernde.slice(0, 5).map((a) => akteurName(a.id)).join(", ") }));
  w.spiel?.hinweise.push({ id: `krieg-koalition-${k.id}-${w.day}`, titel: tx("sim2.sim.pakte.b584ee0", { p0: akteurName(k.land) }), szene: "istanbul", text: zeilen });
  addLog(w, "ereignis", tx("sim2.sim.pakte.3dae73e", { p0: akteurName(k.land), p1: eigen.length, p2: gegner.length }), zeilen[0] ?? "");
}

/** Folgen für den Angreifer im Pakt: Der Bündnisfall greift nicht, das kostet Ansehen und Nähe zu den Pakt-Führern. */
function paktFolgenAngriff(w: World, k: KriegVorgang): void {
  const faktor = { revision: 1, schutz: 0.7, beistand: 0.3, verteidigung: 0.3 }[k.rahmung ?? "revision"];
  const kollektive = paktDefs().filter((p) => p.klausel === "kollektiv" && p.mitglieder.includes(TUR));
  if (kollektive.length === 0) return;
  wirke(w, "ansehen", -KOALITION.paktAnsehen * faktor);
  for (const p of kollektive) {
    // Die Pakt-Führer sind die Mitglieder, die die Klausel tragen würden (NATO: USA und EU-Staaten)
    if (p.id === "nato") {
      wirke(w, "beziehungen_usa", -KOALITION.paktBeziehung * faktor);
      wirke(w, "beziehungen_eu", -KOALITION.paktBeziehung * 0.7 * faktor);
    }
  }
  addLog(w, "ereignis", tx("sim2.sim.pakte.69b60a2"), `Ansehen −${(KOALITION.paktAnsehen * faktor).toLocaleString("de-DE", { maximumFractionDigits: 1 })} (Rahmung „${k.rahmung ?? "revision"}“).`);
}

/** Wöchentlich: Zögernde prüfen, Kampfkraft der Partner abschmelzen, Aussteiger melden. */
export function koalitionWoche(w: World, k: KriegVorgang): void {
  const ko = k.koalition;
  if (!ko) return;
  // 1. Zögernde (alle zwei Wochen) mit wachsendem Druck prüfen: Pflichtige kommen mit der Zeit eher
  if (k.woche % 2 === 0 && ko.abwesend.some((a) => a.zoegert)) {
    const druck = Math.min(8, k.woche / 2) * 1.5;
    const { liste } = bewerteAlle(w, k, ko.aggressor, 0);
    for (const b of liste) {
      const a = ko.abwesend.find((x) => x.id === b.id && x.zoegert);
      if (!a || zaehle(ko, b.seite) >= KOALITION.maxJeSeite) continue;
      const schub = b.pflicht > 0.3 ? druck : druck * 0.3;
      if (b.punkte + schub >= KOALITION.beitrittAb && b.seite === a.seite) {
        const partner: KoalitionsPartner = { id: b.id, seite: b.seite, seit: w.day, grund: b.grund, ...(b.pakt ? { pakt: b.pakt } : {}), pflicht: b.pflicht > 0.3, rest: 1, einsatz: einsatzVon(b.punkte + schub) };
        ko.partner.push(partner);
        ko.abwesend = ko.abwesend.filter((x) => x.id !== b.id);
        beitrittWirkung(w, partner);
        const l = akteurName(k.land);
        w.spiel?.hinweise.push({
          id: `krieg-koalition-beitritt-${k.id}-${b.id}-${w.day}`,
          titel: tx("sim2.sim.pakte.1ce870d", { p0: akteurName(b.id) }),
          szene: "istanbul",
          text: [tx("sim2.sim.pakte.3aca98c", { p0: akteurName(b.id), p1: l, p2: b.seite === "eigen" ? "der Türkei" : akteurDat(k.land), p3: b.grund })],
        });
        addLog(w, "ereignis", tx("sim2.sim.pakte.b4356c2", { p0: akteurName(b.id), p1: b.seite === "eigen" ? "an der Seite der Türkei" : `gegen die Türkei, an der Seite ${akteurDat(k.land)}` }), b.grund);
      }
    }
  }
  // 2. Kampfkraft der Partner: Grundverschleiß, dazu Erosion, wenn die Seite verliert
  const sieg = (k.front - 50) / 10; // positiv: die Türkei gewinnt
  for (const p of ko.partner) {
    const verlust = KOALITION.verschleiss + KOALITION.erosion * clamp(p.seite === "eigen" ? -sieg : sieg, 0, 3);
    p.rest = Math.round(clamp(p.rest - verlust, 0, 1) * 1000) / 1000;
  }
  // 3. Aussteiger: Kampfkraft aufgebraucht oder das Land selbst am Boden
  for (const p of [...ko.partner]) {
    const e = eigenVon(w, p.id);
    if (p.rest <= KOALITION.aussteigenUnter || e.stabilitaet < 20) {
      ko.partner = ko.partner.filter((x) => x !== p);
      ko.abwesend.push({ id: p.id, seite: p.seite, pflicht: false, grund: p.rest <= KOALITION.aussteigenUnter ? tx("sim2.sim.pakte.17bd3a6") : tx("sim2.sim.pakte.228bb55"), punkte: 0, zoegert: false });
      addLog(w, "ereignis", tx("sim2.sim.pakte.0be664b", { p0: akteurName(p.id), p1: p.seite === "eigen" ? "an der Seite der Türkei" : "an der Seite des Gegners" }), p.rest <= KOALITION.aussteigenUnter ? tx("sim2.sim.pakte.faddc7f") : tx("sim2.sim.pakte.9f762f1"));
    }
  }
}

/** Die Bitte um Beistand (Handlung): Zögernde auf der eigenen Seite mit Aufschlag neu bewerten. */
export function koalitionRufen(w: World, k: KriegVorgang): { neu: KoalitionsPartner[]; abgelehnt: string[] } {
  const ko = k.koalition;
  if (!ko) return { neu: [], abgelehnt: [] };
  ko.gerufen = w.day;
  const vorher = new Set(ko.abwesend.filter((a) => a.seite === "eigen").map((a) => a.id));
  const neu = koalitionAufbauen(w, k, ko.aggressor, { bonus: KOALITION.rufBonus }).filter((p) => p.seite === "eigen");
  const abgelehnt = [...vorher].filter((id) => !neu.some((p) => p.id === id));
  // Wer um Beistand gebeten wird und ablehnt, nimmt es übel (klein)
  for (const id of abgelehnt) beziehungAendern(w, id, { vertrauen: -1.5 }, "Bitte um Beistand abgelehnt");
  return { neu, abgelehnt };
}

/** Der Krieg ist zu Ende (Frieden, Niederlage, Rückzug): Die Koalitionen lösen sich auf; die Partner merken sich, wie es ausging. */
export function koalitionAufloesen(w: World, k: KriegVorgang, wie: "sieg" | "frieden" | "zugestaendnis" | "niederlage" | "rueckzug"): void {
  const ko = k.koalition;
  if (!ko || ko.partner.length === 0) return;
  for (const p of ko.partner) {
    if (p.seite !== "eigen") continue;
    const d = wie === "sieg" ? { vertrauen: 2 } : wie === "zugestaendnis" ? { vertrauen: -3 } : wie === "niederlage" ? { vertrauen: -2 } : wie === "rueckzug" ? { vertrauen: -1 } : { vertrauen: 1 };
    beziehungAendern(w, p.id, d, wie === "zugestaendnis" ? tx("sim2.sim.pakte.234f280") : tx("sim2.sim.pakte.2d90c75"));
  }
  addLog(w, "ereignis", tx("sim2.sim.pakte.5768795", { p0: akteurName(k.land) }), `${ko.partner.length} Partner beider Seiten gehen auseinander.`);
  ko.partner = [];
  ko.abwesend = [];
}

// ---------------------------------------------------------------------------
// Anzeige

/** Die Koalitionen eines Vorgangs für die Oberfläche. */
export function koalitionenIn(w: World, kriegId: string): KoalitionenSicht {
  const k = w.spiel?.kriege?.find((x) => x.id === kriegId);
  if (!k) return { aggressor: null, eigen: [], gegner: [] };
  const gespeichert = koalitionVon(w, k);
  const ko = gespeichert ?? vorschau(w, k);
  const sicht = (seite: "eigen" | "gegner"): KoalitionsSicht[] => {
    const out: KoalitionsSicht[] = [];
    if (seite === "gegner") out.push({ id: k.land, name: akteurName(k.land), seite, rolle: "hauptgegner", grund: "Hauptgegner", pflicht: false });
    for (const p of ko.partner.filter((x) => x.seite === seite)) {
      out.push({ id: p.id, name: akteurName(p.id), seite, rolle: "partner", grund: p.grund, pflicht: p.pflicht, ...(p.pakt ? { pakt: p.pakt } : {}), rest: p.rest, einsatz: p.einsatz });
    }
    for (const a of ko.abwesend.filter((x) => x.seite === seite && (x.zoegert || x.pflicht))) {
      out.push({ id: a.id, name: akteurName(a.id), seite, rolle: a.zoegert ? "zoegert" : "abseits", grund: a.grund, pflicht: a.pflicht });
    }
    return out;
  };
  return {
    aggressor: ko.aggressor,
    eigen: sicht("eigen"),
    gegner: sicht("gegner"),
    ...(ko.spaltung ? { spaltung: { id: ko.spaltung, name: allePakte(w).find((p) => p.id === ko.spaltung)?.name ?? ko.spaltung } } : {}),
  };
}

/** Alle Pakte mit ihren Mitgliedern, Klauseln und den laufenden Kriegen, in denen Mitglieder kämpfen. */
export function paktSicht(w: World): PaktSicht[] {
  const aktive = drittKriege(w);
  const turkeiKriege = (w.spiel?.kriege ?? []).filter((x) => x.phase === "krieg" || x.phase === "waffenruhe");
  return allePakte(w).map((p) => {
    const kriege = aktive
      .map((k) => ({ k, mitglieder: [...new Set([...k.seiteA, ...k.seiteB])].filter((id) => p.mitglieder.includes(id)) }))
      .filter((x) => x.mitglieder.length > 0)
      .map((x) => ({ id: x.k.id, titel: kriegTitel(x.k), mitglieder: x.mitglieder }));
    const gespalten = turkeiKriege.some((tk) => tk.koalition?.spaltung === p.id) || aktive.some((k) => k.seiteA.some((a) => p.mitglieder.includes(a)) && k.seiteB.some((b) => p.mitglieder.includes(b)) && PFLICHT[p.klausel] > 0);
    return { ...p, tuerkeiMitglied: p.mitglieder.includes(TUR), pflichtGewicht: PFLICHT[p.klausel], kriege, gespalten };
  });
}

export function kriegTitel(k: DrittKrieg): string {
  return `${akteurName(k.a)} gegen ${akteurName(k.b)}`;
}

/** Die Kriege zwischen anderen Staaten (laufende, auf Wunsch auch beendete). Ältere Spielstände legen die Liste beim ersten Zugriff an. */
export function drittKriege(w: World, auchBeendete = false): DrittKrieg[] {
  if (!w.spiel) return [];
  const m = weltModell(w);
  const liste = kriegeAnlegen(w, m);
  return liste.filter((k) => auchBeendete || k.ende === undefined);
}

// ---------------------------------------------------------------------------
// Kriege zwischen anderen Staaten

interface KriegsPaarDef {
  a: string;
  b: string;
  /** Spannung, ab der das Paar in den Krieg kippen kann (Spielparameter); darunter −10 endet er */
  schwelle: number;
  /** Kennung des Konflikts in der Vermittlung (dann ist der Konflikt-Index die Wahrheit der Spannung) */
  vermittlung?: string;
  /** Staaten, die in der Ausgangslage schon mitkämpfen */
  beteiligte?: { id: string; seite: "a" | "b"; grund: string }[];
  /** Wer in der Ausgangslage angegriffen hat, wenn die Dossiers es eindeutig sagen */
  angreifer?: "a" | "b";
  seitText?: string;
  quelle: string;
}

/**
 * Die Paare, die in einen Krieg kippen können: die heißen Paare (data/welt-daten.ts) und die Konflikte der Dossiers. Paare großer Mächte
 * (USA, EU, Russland, China) untereinander sind bewusst keine Kandidaten — dort wirken Sanktionen und Stellvertreter, nicht der offene Krieg
 * (Spielparameter-Entscheidung, hält das Weltmodell vor dem Weltkrieg). Die Schwellen sind Spielparameter.
 */
export const KRIEGSPAARE: KriegsPaarDef[] = [
  { a: "RUS", b: "UKR", schwelle: 65, vermittlung: "ukr_rus", angreifer: "a", seitText: tx("sim2.sim.pakte.b782574"), quelle: "Dossier Teil IV A2" },
  { a: "IRN", b: "ISR", schwelle: 65, vermittlung: "isr_irn", beteiligte: [{ id: "USA", seite: "b", grund: tx("sim2.sim.pakte.cbf299c") }], seitText: tx("sim2.sim.pakte.12b8613"), quelle: "Dossier Teil IV A1" },
  { a: "ARM", b: "AZE", schwelle: 62, vermittlung: "arm_aze", quelle: "Dossier Teil IV A3" },
  { a: "ISR", b: "SYR", schwelle: 68, quelle: "Dossier Teil IV B4" },
  { a: "IRN", b: "SAU", schwelle: 80, quelle: "Dossier Teil IV B3" },
  { a: "GEO", b: "RUS", schwelle: 58, quelle: "Dossier Teil IV B6" },
];

/** Spielparameter der Drittkriege. */
export const DRITTKRIEG = {
  /** Wahrscheinlichkeit je Monat, dass ein Paar über der Schwelle zündet: Grundwert und Anstieg bis zur vollen Spannung */
  zuendBasis: 0.05,
  zuendSteil: 0.3,
  /** Faktor, wenn eine der Parteien instabil ist (Stabilität unter 35 oder Unruhen) */
  instabil: 1.5,
  /** Abkühlung nach einem Ende, bevor dasselbe Paar erneut zündet (Tage) */
  abkuehlung: 540,
  /** Wie schnell die Intensität der Spannung folgt (Anteil je Monat) und der Zuschlag je hineingezogenem Staat */
  traege: 0.3,
  jeBeteiligter: 4,
  /** Erschöpfungsende (nur ohne Vermittlung): ab dem x-ten Monat wächst die Chance je Monat bis zum Deckel */
  erschoepfungAb: 6,
  erschoepfungSchritt: 0.03,
  erschoepfungMax: 0.18,
  /** Spannung, um die ein erschöpfter Krieg abkühlt */
  abkuehlen: 22,
  /** Beitritt von Pakt-Partnern: Punkte, Monatschance, Höchstzahl je Monat und je Krieg */
  beitrittAb: 50,
  beitrittChance: 0.5,
  maxMonat: 2,
  maxKrieg: 6,
  /** Ausstrahlung: Spannung, die ein laufender Krieg den Rivalen seiner Parteien je Monat aufdrängt */
  ausstrahlung: 0.4,
  /** Wirkung auf die Türkei je Einheit (Intensitätsänderung gegenüber dem Beginn, 0 bis 1) */
  terror: 0.1,
  tourismus: 0.05,
  oel: 0.6,
  /** Ende eines Krieges der Ausgangslage entlastet einmalig den Ölpreis */
  entlastungOel: 4,
  /** Behalte so viele beendete Kriege im Gedächtnis */
  archiv: 10,
} as const;

/** Energieexporteure unter den Akteuren (Spielparameter nach WeltDef.energie) */
const ENERGIE_EXPORTEURE = new Set(["RUS", "IRN", "SAU", "IRQ", "AZE", "KAZ", "LBY"]);
const NAHBEREICH = new Set(["SYR", "IRQ", "IRN", "GEO", "ARM", "UKR", "LBY", "AZE", "GRC", "CYP", "ISR", "SAU", "RUS", "EGY"]);

const paarSchl = (a: string, b: string): string => (a < b ? `${a}|${b}` : `${b}|${a}`);

function spannungVon(w: World, a: string, b: string): number {
  return paarVon(w, a, b).spannung;
}

function neuerKrieg(w: World, def: KriegsPaarDef, anlass: DrittKrieg["anlass"], intensitaet: number, angreifer: "a" | "b" | undefined): DrittKrieg {
  const seiteA = [def.a, ...(def.beteiligte ?? []).filter((x) => x.seite === "a").map((x) => x.id)];
  const seiteB = [def.b, ...(def.beteiligte ?? []).filter((x) => x.seite === "b").map((x) => x.id)];
  return {
    id: `dk-${def.a}-${def.b}-${w.day}`,
    a: def.a,
    b: def.b,
    seiteA,
    seiteB,
    ...(angreifer ? { angreifer } : {}),
    anlass,
    seit: w.day,
    ...(anlass === "ausgangslage" && def.seitText ? { seitText: def.seitText } : {}),
    intensitaet: Math.round(intensitaet),
    intensitaetStart: anlass === "ausgangslage" ? Math.round(intensitaet) : 0,
    beitritte: (anlass === "ausgangslage" ? def.beteiligte ?? [] : []).map((x) => ({ id: x.id, seite: x.seite, tag: w.day, grund: x.grund })),
    ...(def.vermittlung ? { vermittlung: def.vermittlung } : {}),
  };
}

function aktiv(kriege: DrittKrieg[], def: KriegsPaarDef): DrittKrieg | undefined {
  return kriege.find((k) => k.ende === undefined && paarSchl(k.a, k.b) === paarSchl(def.a, def.b));
}

/** Wer greift an? Die Seite mit dem schwächeren Rückhalt lenkt ab; bei Gleichstand bleibt es offen (Spielparameter). */
function wahleAngreifer(w: World, def: KriegsPaarDef): "a" | "b" | undefined {
  if (def.angreifer) return def.angreifer;
  const ra = eigenVon(w, def.a).rueckhalt;
  const rb = eigenVon(w, def.b).rueckhalt;
  if (Math.abs(ra - rb) < 5) return undefined;
  return ra < rb ? "a" : "b";
}

function beteiligte(k: DrittKrieg): string[] {
  return [...new Set([...k.seiteA, ...k.seiteB])];
}

function einigungErreicht(w: World, def: KriegsPaarDef): boolean {
  if (!def.vermittlung) return false;
  return w.spiel?.vermittlung?.[def.vermittlung]?.einigung !== undefined;
}

/** Der monatliche Schritt der Kriege zwischen anderen Staaten (Haken des Weltmodells). */
/** Legt die Liste an und füllt die Ausgangslage aus den aktuellen Spannungen (ältere Spielstände starten von ihrem Stand). */
function kriegeAnlegen(w: World, m: WeltModell): DrittKrieg[] {
  if (m.kriege) return m.kriege;
  const liste: DrittKrieg[] = [];
  m.kriege = liste;
  m.rufe ??= {};
  for (const def of KRIEGSPAARE) {
    const s = spannungVon(w, def.a, def.b);
    if (s >= def.schwelle && !einigungErreicht(w, def)) liste.push(neuerKrieg(w, def, "ausgangslage", s, def.angreifer));
  }
  return liste;
}

function dritteKriegeMonat(w: World, m: WeltModell): void {
  if (!w.spiel) return;
  const monat = w.date.slice(0, 7);
  const rng = hashZufall(`${w.seed}|dkrieg|${monat}`);
  const kriege = kriegeAnlegen(w, m);
  m.rufe ??= {};

  // 1. Laufende Kriege: Intensität, Beitritte, Ende
  let beitritteMonat = 0;
  for (const k of kriege) {
    if (k.ende !== undefined) continue;
    const def = KRIEGSPAARE.find((d) => paarSchl(d.a, d.b) === paarSchl(k.a, k.b));
    if (!def) continue;
    const s = spannungVon(w, k.a, k.b);
    const ziel = clamp(s + DRITTKRIEG.jeBeteiligter * (beteiligte(k).length - 2), 15, 100);
    k.intensitaet = Math.round(clamp(k.intensitaet + DRITTKRIEG.traege * (ziel - k.intensitaet), 0, 100));
    // Ein laufender Krieg hält die Spannung seines Paares oben (sonst kühlt die Rückkehr zur Ausgangslage ihn gegen die Lage ab)
    if (!def.vermittlung && s < def.schwelle - 4) paarAendern(m, k.a, k.b, { spannung: Math.min(2, def.schwelle - 4 - s) });
    // Ende
    const monate = Math.max(0, Math.round((w.day - k.seit) / 30));
    const ende = beendet(w, m, k, def, s, monate, rng);
    if (ende) {
      k.ende = w.day;
      k.ausgang = ende;
      endeFolgen(w, m, k, def);
      continue;
    }
    // Pakt-Beitritte
    if (beitritteMonat < DRITTKRIEG.maxMonat) beitritteMonat += paktBeitritte(w, m, k, rng, DRITTKRIEG.maxMonat - beitritteMonat);
  }

  // 2. Neue Kriege: Paare über der Schwelle zünden mit Wahrscheinlichkeit
  for (const def of KRIEGSPAARE) {
    if (aktiv(kriege, def)) continue;
    if (einigungErreicht(w, def)) continue;
    const s = spannungVon(w, def.a, def.b);
    if (s < def.schwelle) continue;
    const letzte = kriege.filter((k) => k.ende !== undefined && paarSchl(k.a, k.b) === paarSchl(def.a, def.b)).reduce((x, k) => Math.max(x, k.ende!), -1e9);
    if (w.day - letzte < DRITTKRIEG.abkuehlung) continue;
    const ea = eigenVon(w, def.a);
    const eb = eigenVon(w, def.b);
    const instabil = ea.stabilitaet < 35 || eb.stabilitaet < 35 || ea.krise?.art === "unruhen" || eb.krise?.art === "unruhen";
    const x = (s - def.schwelle) / Math.max(1, 100 - def.schwelle);
    const p = (DRITTKRIEG.zuendBasis + DRITTKRIEG.zuendSteil * x) * (instabil ? DRITTKRIEG.instabil : 1);
    if (rng() >= p) continue;
    const k = neuerKrieg(w, def, "spannung", Math.max(s, def.schwelle), wahleAngreifer(w, def));
    kriege.push(k);
    kriegsmeldung(w, m, k);
  }

  // 3. Ausstrahlung auf die Rivalen der Parteien: Die Lager rücken zusammen und auseinander. Nur was über die Ausgangslage hinausgeht, wirkt
  //    (die Ausgangslage steckt in den Startwerten der Paare).
  for (const k of kriege) {
    if (k.ende !== undefined) continue;
    const mehr = clamp((k.intensitaet - k.intensitaetStart) / 50, 0, 1);
    if (mehr <= 0) continue;
    const schub = DRITTKRIEG.ausstrahlung * mehr;
    for (const [seite, andere] of [[k.seiteA, k.seiteB], [k.seiteB, k.seiteA]] as const) {
      for (const x of seite) for (const y of andere) {
        if (x === k.a || x === k.b) continue;
        if (y === k.a || y === k.b) paarAendern(m, x, y, { spannung: schub });
      }
    }
    // Rivalen der Hauptparteien am Rand des Krieges (hohe Spannung, bisher nicht im Krieg) spüren ihn
    for (const hauptpartei of [k.a, k.b]) {
      for (const o of AKTEUR_IDS) {
        if (o === k.a || o === k.b || beteiligte(k).includes(o)) continue;
        const v = paarVon(w, hauptpartei, o);
        if (v.spannung >= 55 && v.buendnis <= -20) paarAendern(m, hauptpartei, o, { spannung: schub });
      }
    }
  }

  // 4. Wirkung auf die Türkei: nur was über die Ausgangslage hinausgeht (die steckt in den Startwerten)
  tuerkeiFolgen(w, m);

  // 5. Beistandsrufe: Ein Pakt-Partner der Türkei wird angegriffen
  beistandsrufe(w, m);

  // 6. Gedächtnis begrenzen
  const beendete = kriege.filter((k) => k.ende !== undefined);
  if (beendete.length > DRITTKRIEG.archiv) {
    const raus = new Set(beendete.slice(0, beendete.length - DRITTKRIEG.archiv).map((k) => k.id));
    m.kriege = kriege.filter((k) => !raus.has(k.id));
  }
}

/** Zufallsquelle aus einem Schlüssel (mulberry32); der Spielstrom und der Weltmodell-Strom bleiben unberührt. */
function hashZufall(schluessel: string): () => number {
  let a = hashInt(schluessel) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function beendet(w: World, m: WeltModell, k: DrittKrieg, def: KriegsPaarDef, s: number, monate: number, rng: () => number): DrittKrieg["ausgang"] | undefined {
  void m;
  if (einigungErreicht(w, def) && s <= def.schwelle) return "einigung";
  if (s <= def.schwelle - 10) return def.vermittlung ? "einigung" : "abklingen";
  if (k.intensitaet < 35 && s < def.schwelle) return "abklingen";
  if (!def.vermittlung && monate >= DRITTKRIEG.erschoepfungAb) {
    const p = Math.min(DRITTKRIEG.erschoepfungMax, DRITTKRIEG.erschoepfungSchritt * (monate - DRITTKRIEG.erschoepfungAb + 1));
    if (rng() < p) return "erschoepfung";
  }
  return undefined;
}

const AUSGANG_TEXT: Record<NonNullable<DrittKrieg["ausgang"]>, string> = {
  einigung: tx("sim2.sim.pakte.77c579b"),
  erschoepfung: tx("sim2.sim.pakte.8584799"),
  abklingen: tx("sim2.sim.pakte.7d84b5c"),
};

function endeFolgen(w: World, m: WeltModell, k: DrittKrieg, def: KriegsPaarDef): void {
  if (k.ausgang === "erschoepfung") paarAendern(m, k.a, k.b, { spannung: -DRITTKRIEG.abkuehlen });
  const titel = `Waffenstillstand: ${kriegTitel(k)}`;
  const fakt = tx("sim2.sim.pakte.1f5dab8", { p0: AUSGANG_TEXT[k.ausgang!], p1: akteurDat(k.a), p2: akteurDat(k.b), p3: k.intensitaet });
  weltNotiz(w, m, { art: "waffenstillstand", id: k.a, gegen: k.b, titel, fakt, wertung: 0.2, gewicht: istTuerkeinah(k) ? 0.85 : 0.45 });
  addLog(w, "ereignis", titel, fakt);
  // Ein Ende der Ausgangslage entlastet die Märkte einmalig (nur was über den Startwert hinausgeht, zählt sonst laufend)
  if (k.anlass === "ausgangslage" && w.economy.oel !== undefined) w.economy.oel = Math.max(40, w.economy.oel - DRITTKRIEG.entlastungOel);
  void def;
}

const istTuerkeinah = (k: DrittKrieg): boolean => beteiligte(k).some((id) => NAHBEREICH.has(id));

function kriegsmeldung(w: World, m: WeltModell, k: DrittKrieg): void {
  const wer = k.angreifer ? (k.angreifer === "a" ? k.a : k.b) : undefined;
  const titel = `Krieg: ${kriegTitel(k)}`;
  const fakt = tx("sim2.sim.pakte.c574b1f", { p0: akteurDat(k.a), p1: akteurDat(k.b), p2: Math.round(spannungVon(w, k.a, k.b)), p3: wer ? ` Der erste Schlag geht nach den Meldungen von ${akteurDat(wer)} aus.` : " Wer begonnen hat, ist unklar." });
  weltNotiz(w, m, { art: "krieg", id: k.a, gegen: k.b, titel, fakt, wertung: -0.4, gewicht: istTuerkeinah(k) ? 0.95 : 0.6 });
  addLog(w, "ereignis", titel, fakt);
}

/** Pakt-Partner der Kriegsparteien entscheiden über einen Beitritt; liefert die Zahl der neuen Beitritte. */
function paktBeitritte(w: World, m: WeltModell, k: DrittKrieg, rng: () => number, rest: number): number {
  let n = 0;
  if (k.beitritte.length >= DRITTKRIEG.maxKrieg) return 0;
  const pakte = paktDefs().filter((p) => PFLICHT[p.klausel] >= PFLICHT.beistand);
  for (const seite of ["a", "b"] as const) {
    const haupt = seite === "a" ? k.a : k.b;
    const gegen = seite === "a" ? k.b : k.a;
    const eigene = seite === "a" ? k.seiteA : k.seiteB;
    const fremde = seite === "a" ? k.seiteB : k.seiteA;
    const opfer = k.angreifer !== undefined && k.angreifer !== seite;
    for (const p of pakte) {
      if (!p.mitglieder.includes(haupt) || p.mitglieder.includes(gegen)) continue;
      for (const c of p.mitglieder) {
        if (n >= rest || k.beitritte.length >= DRITTKRIEG.maxKrieg) return n;
        if (c === TUR || !AKTEUR_IDS.includes(c) || eigene.includes(c) || fremde.includes(c)) continue;
        // Ein Staat kämpft nicht in zwei Kriegen zugleich
        if ((m.kriege ?? []).some((x) => x.ende === undefined && x.id !== k.id && beteiligte(x).includes(c))) continue;
        const e = eigenVon(w, c);
        const pflicht = opfer ? PFLICHT[p.klausel] : 0;
        const punkte = KOALITION.pflicht * pflicht + KOALITION.bindung * Math.max(0, paarVon(w, c, haupt).buendnis) + KOALITION.feind * Math.max(0, -paarVon(w, c, gegen).buendnis) - KOALITION.krieg * e.krieg - (e.stabilitaet < 30 ? 15 : 0);
        if (punkte < DRITTKRIEG.beitrittAb || rng() >= DRITTKRIEG.beitrittChance) continue;
        const grund = pflicht > 0 ? tx("sim2.sim.pakte.b4da3c7", { p0: p.kurz, p1: akteurDat(haupt) }) : tx("sim2.sim.pakte.16ca323", { p0: akteurDat(haupt), p1: p.kurz });
        (seite === "a" ? k.seiteA : k.seiteB).push(c);
        k.beitritte.push({ id: c, seite, tag: w.day, grund, pakt: p.id });
        n++;
        weltNotiz(w, m, { art: "beitritt", id: c, gegen: gegen, titel: tx("sim2.sim.pakte.1ce870d", { p0: akteurName(c) }), fakt: tx("sim2.sim.pakte.6ebdade", { p0: akteurName(c), p1: akteurDat(k.a), p2: akteurDat(k.b), p3: akteurDat(haupt), p4: grund, p5: k.intensitaet }), wertung: -0.3, gewicht: istTuerkeinah(k) ? 0.85 : 0.5 });
        addLog(w, "ereignis", tx("sim2.sim.pakte.b4356c2", { p0: akteurName(c), p1: kriegTitel(k) }), grund);
        // Mehr Parteien machen die Einigung schwerer
        const vz = k.vermittlung ? w.spiel?.vermittlung?.[k.vermittlung] : undefined;
        if (vz) {
          vz.konfliktIndex = clamp(vz.konfliktIndex + 4, 0, 100);
          vz.reif = clamp(vz.reif - 3, 0, 100);
        }
        paarAendern(m, c, gegen, { spannung: 6, buendnis: -4 });
      }
    }
  }
  return n;
}

/** Folgen für die Türkei: Terrorgefahr, Tourismus und Energiepreis, jeweils nur für die Veränderung seit Beobachtungsbeginn. */
function tuerkeiFolgen(w: World, m: WeltModell): void {
  let last = 0;
  let energie = 0;
  for (const k of m.kriege ?? []) {
    if (k.ende !== undefined) continue;
    const delta = (k.intensitaet - k.intensitaetStart) / 100;
    if (delta === 0) continue;
    const region = istTuerkeinah(k) ? 1 : 0.4;
    last += delta * region;
    const exporteur = beteiligte(k).some((id) => ENERGIE_EXPORTEURE.has(id));
    if (exporteur) energie += delta;
  }
  if (last === 0 && energie === 0) return;
  if (NET.index.has("terrorgefahr")) wirke(w, "terrorgefahr", clamp(DRITTKRIEG.terror * last, -0.2, 0.3));
  if (NET.index.has("tourismus")) wirke(w, "tourismus", clamp(-DRITTKRIEG.tourismus * last, -0.2, 0.1));
  if (energie !== 0 && w.economy.oel !== undefined) w.economy.oel = Math.max(40, w.economy.oel + clamp(DRITTKRIEG.oel * energie, -2, 2));
}

// ---------------------------------------------------------------------------
// Beistandsruf

export interface BeistandsRuf {
  krieg: string;
  partner: string;
  gegner: string;
  pakt: string;
}

/** Offene Beistandsrufe: Ein Pakt-Partner der Türkei steht auf der angegriffenen Seite eines Krieges, ohne dass die Türkei schon kämpft. */
export function offeneRufe(w: World, m: WeltModell): BeistandsRuf[] {
  const out: BeistandsRuf[] = [];
  const tuerkeiKaempft = new Set((w.spiel?.kriege ?? []).filter((x) => x.phase !== "frieden" && x.phase !== "beendet").map((x) => x.land));
  for (const k of m.kriege ?? []) {
    if (k.ende !== undefined || k.angreifer === undefined) continue;
    const opferSeite = k.angreifer === "a" ? "b" : "a";
    const opfer = opferSeite === "a" ? k.seiteA : k.seiteB;
    const angreiferHaupt = k.angreifer === "a" ? k.a : k.b;
    if (tuerkeiKaempft.has(angreiferHaupt)) continue;
    for (const p of allePakte(w)) {
      if (!p.mitglieder.includes(TUR) || PFLICHT[p.klausel] < PFLICHT.beistand) continue;
      if (p.mitglieder.includes(angreiferHaupt)) continue;
      const partner = opfer.find((c) => c !== TUR && p.mitglieder.includes(c));
      if (!partner) continue;
      const schluessel = `${k.id}|${p.id}`;
      if (m.rufe?.[schluessel] !== undefined) continue;
      out.push({ krieg: k.id, partner, gegner: angreiferHaupt, pakt: p.id });
    }
  }
  return out;
}

function beistandsrufe(w: World, m: WeltModell): void {
  const rufe = offeneRufe(w, m);
  if (rufe.length === 0) return;
  const r = rufe[0]!;
  m.ereignisKandidaten = [...(m.ereignisKandidaten ?? []), { art: "beistand", id: r.partner, partner: r.partner, gegner: r.gegner, pakt: r.pakt, krieg: r.krieg }];
}

/** Vermerkt, dass der Ruf vorgelegt wurde (der Haken in sim/welt-ereignisse.ts ruft es nach dem Öffnen). */
export function rufVermerken(w: World, krieg: string, pakt: string): void {
  const m = weltModell(w);
  (m.rufe ??= {})[`${krieg}|${pakt}`] = w.day;
}

/** Die Antwort auf den Beistandsruf: Material und Diplomatie statt Truppen. */
export function beistandMaterial(w: World, partner: string, paktId: string): string {
  kosten(w, 0.2);
  beziehungAendern(w, partner, { vertrauen: 5, sicherheit: 6 }, tx("sim2.sim.pakte.7b0030c"));
  wirke(w, "ansehen", 0.5);
  const p = allePakte(w).find((x) => x.id === paktId);
  return tx("sim2.sim.pakte.d1f14bd", { p0: akteurDat(partner), p1: p ? ` (Pakt „${p.kurz}“)` : "" });
}

/** Die Antwort auf den Beistandsruf: Verweigern oder Schweigen kostet Vertrauen, Ansehen und womöglich den Vertrag. */
export function beistandVerweigern(w: World, partner: string, paktId: string, schweigen: boolean): string {
  const faktor = schweigen ? 1.25 : 1;
  beziehungAendern(w, partner, { vertrauen: -10 * faktor, sicherheit: -8 * faktor, konflikt: 3 }, tx("sim2.sim.pakte.5d2e038"));
  wirke(w, "ansehen", -1.5 * faktor);
  let vertragText = "";
  if (istHauptakteur(partner)) {
    // Der Verstoß folgt der Zwei-Verstöße-Logik der Verträge (sim/abkommen.ts)
    const v = laufende(w, partner).find((x) => x.gibt.includes("beistand"));
    if (v) {
      v.verstoesse += 1;
      if (v.verstoesse >= 2) {
        v.status = "gebrochen";
        v.ende = tx("sim2.sim.pakte.4fbb79c");
        const z = weltZustand(w)[partner]!;
        z.bruch = (z.bruch ?? 0) + 6;
        landAendern(w, partner, { vertrauen: -12, konflikt: 6 }, tx("sim2.sim.pakte.d221dae"));
        wirke(w, "ansehen", -2);
        vertragText = tx("sim2.sim.pakte.96207db");
      } else vertragText = tx("sim2.sim.pakte.be9a82f");
    }
  }
  const p = allePakte(w).find((x) => x.id === paktId);
  return tx("sim2.sim.pakte.39269f9", { p0: schweigen ? "Ankara lässt den Ruf unbeantwortet" : "Ankara verweigert den Beistand", p1: p ? ` im Pakt „${p.kurz}“` : "", p2: akteurName(partner), p3: vertragText });
}

// ---------------------------------------------------------------------------
// Registrierung beim Weltmodell

setzeKriegHaken((w, m) => dritteKriegeMonat(w, m));
