// Die Außenlage der Türkei als Zustand mit Gedächtnis (Fork AUSSEN, 05.10.2026): Flucht, Energie, Terror, Friedensprozess, Sanktionen,
// Diaspora und die Instrumente des Präsidenten (Staatsbesuch mit Tagesordnung, Botschafter, Sanktionen, Rückführung, Grenzsicherung,
// Friedensschritt). Heute verpufften Gesten und Konfliktwerte fielen auf den Startwert zurück; hier werden Bestände geführt, die über
// Jahre wirken, Anker für die Beziehungen gesetzt und die Kopplung an Wirtschaft, Haushalt, Wohnen, Wähler und Sicherheit gerechnet.
//
// Quellen der Startwerte (sonst Spielparameter, als solche kommentiert):
// - Syrer unter temporärem Schutz 2.508.446 (08/2025), Rückkehr aus der Türkei seit 12/2024: 639.995 (UNHCR, 30.04.2026) —
//   RECHERCHE_REALWELT_TUERKEI_2026.md §4.2. Startbestand 1,9 Mio. ist daraus abgeleitet (Differenz, gerundet).
// - Gas-Lieferanten 2025: Russland 36 %, Aserbaidschan 20 %, USA 16 %, Iran 13 %, Algerien 8 % (Ember, Hormus-Report 2026); der
//   Iran-Vertrag ist am 29.07.2026 ausgelaufen (RECHERCHE_ENERGIE.md, Tabelle Lieferverträge). Im Spiel: Iran 0, LNG-Pool 38 % (abgeleitet).
// - Diaspora-Devisenkanal: data/diaspora.ts (DIASPORA_DOEVIZ, Schwellen und Größenordnung aus TCMB-Daten).
// Alles Weitere sind Spielparameter.

import { NET } from "./modell";
import { nationalAverage, startAverage } from "./netz";
import { wirke } from "./wirkung";
import { addLog } from "./log";
import { LAENDER, land, landAendern, vertrauenZu, weltZustand } from "./laender";
import { alleLaufenden } from "./abkommen";
import { setzeAussenHaken, weltModell, akteurName, hashInt, type WeltModell } from "./welt-modell";
import { kannZahlen } from "./kapital";
import { neuanfangGrund, verbrauche } from "./aufmerksamkeit";
import { Rng } from "./rng";
import { addDays } from "./dates";
import { t } from "../i18n";
import { DIASPORA_DOEVIZ, DIASPORA_EREIGNISSE } from "../data/diaspora";
import type { World } from "./types";

// ---------------------------------------------------------------------------
// Typen

export type Lieferant = "RUS" | "AZE" | "LNG" | "IRN" | "HEIM";
export type Hormus = "offen" | "gestoert" | "geschlossen";
export type Taeter = "is" | "pkk" | "links";
export type Agenda = "handel" | "sicherheit" | "energie" | "migration" | "diaspora";
export type InstrumentId = "staatsbesuch" | "botschafter_ab" | "botschafter_zurueck" | "sanktion" | "sanktion_aufheben" | "rueckfuehrung" | "grenzsicherung" | "friedensschritt";

export interface Sanktion {
  id: "caatsa" | "eu_handel";
  von: string;
  seit: number;
}

export interface AussenBericht {
  id: string;
  instrument: InstrumentId;
  land?: string;
  agenda?: Agenda;
  tag: number;
  datum: string;
  vorher: Record<string, number>;
  /** Auswertungen nach 6 und 12 Monaten */
  nach6?: Record<string, number>;
  nach12?: Record<string, number>;
}

export interface AussenVerlauf {
  monat: string;
  ansehen: number;
  eu: number;
  sicherheit: number;
  flucht: number;
  energie: number;
  diaspora: number;
  terror: number;
}

export interface AussenZustand {
  v: 1;
  monat: string;
  flucht: { bestand: number; zufluss: number; abfluss: number; kostenJahr: number };
  energie: { anteile: Record<Lieferant, number>; hormus: Hormus; versorgung: number };
  terror: Record<Taeter, number>;
  friedens: { phase: number; fortschritt: number; rueckschlaege: number };
  sanktionen: Sanktion[];
  /** Zähler der Monate, in denen eine Sanktionsbedingung erfüllt bzw. aufgehoben ist */
  zaehler: Record<string, number>;
  diaspora: { vertrauen: number; flussMrd: number; mobilisierung: number };
  /** Befristete Wirkungen der Instrumente: bis zu diesem Tag */
  bis: Partial<Record<"rueckfuehrung" | "grenze" | "euHilfe", number>>;
  besuche: Record<string, number>;
  abberufen: string[];
  eigeneSanktionen: string[];
  berichte: AussenBericht[];
  verlauf: AussenVerlauf[];
  letzterAnschlag?: { tag: number; taeter: Taeter };
  /** Ausgangswerte des ersten Monats: Wirkungen ins Netz rechnen nur die Abweichung davon (ruhige Welt = keine Verschiebung) */
  basis?: { versorgung: number; terror: number; anteilMax: number };
}

// ---------------------------------------------------------------------------
// Regeln (Spielparameter)

export const AUSSEN = {
  fluchtStart: 1.9,
  /** Haushaltskosten je Million Geflüchteter und Jahr in % des BIP (Spielparameter) */
  kostenJeMio: 0.25,
  /** Anteil, den ein laufendes EU-Migrationsabkommen trägt */
  euAnteil: 0.5,
  anteileStart: { RUS: 36, AZE: 20, LNG: 38, IRN: 0, HEIM: 6 } as Record<Lieferant, number>,
  /** Monatliche Grundchance eines Anschlags je 100 Aktivitätspunkte einer Gruppe */
  anschlagChance: 0.006,
  besuchAbkuehlung: 180,
  pk: { staatsbesuch: 6, botschafter_ab: 2, botschafter_zurueck: 1, sanktion: 4, sanktion_aufheben: 2, rueckfuehrung: 5, grenzsicherung: 4, friedensschritt: 6 } as Record<InstrumentId, number>,
  aufmerksamkeit: { staatsbesuch: 12, botschafter_ab: 3, botschafter_zurueck: 2, sanktion: 5, sanktion_aufheben: 3, rueckfuehrung: 6, grenzsicherung: 4, friedensschritt: 8 } as Record<InstrumentId, number>,
};

/** Wer welchen Lieferanten bei einer Energie-Tagesordnung stärkt */
const ENERGIE_PARTNER: Record<string, Lieferant> = { RUS: "RUS", AZE: "AZE", USA: "LNG", SAU: "LNG", EGY: "LNG", IRN: "IRN" };
/** Länder, mit denen sich über Migration verhandeln lässt */
const MIGRATION_PARTNER = new Set(["EU", "SYR", "IRQ", "GRC"]);
/** Gewicht der Handelsbeziehung für Export (Spielparameter, grob nach Exportanteilen) */
const HANDEL_GEWICHT: Record<string, number> = { EU: 0.4, USA: 0.1, RUS: 0.08, IRQ: 0.06, CHN: 0.05, GRC: 0.03, SAU: 0.04, EGY: 0.03, AZE: 0.02, ISR: 0.02, IRN: 0.02, UKR: 0.02 };

const PHASEN = 6; // 0 kein Prozess … 5 Rückkehr und Normalisierung

// ---------------------------------------------------------------------------
// Kleine Hilfen

const clamp = (x: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, x));
const r1 = (x: number): number => Math.round(x * 10) / 10;
const r2 = (x: number): number => Math.round(x * 100) / 100;
const knoten = (w: World, id: string, ersatz = 50): number => (NET.index.has(id) ? nationalAverage(NET, w.net, id) : ersatz);
const startK = (w: World, id: string, ersatz = 50): number => (NET.index.has(id) ? startAverage(NET, w.net, id) : ersatz);
const stoss = (w: World, id: string, d: number): void => {
  if (NET.index.has(id) && d !== 0) wirke(w, id, d);
};
function massnahme(w: World, id: string): number {
  return knoten(w, id, 50);
}

export function aussenZustand(w: World): AussenZustand {
  const m = weltModell(w);
  const a = (m.aussen ??= {
    v: 1,
    monat: "",
    flucht: { bestand: AUSSEN.fluchtStart, zufluss: 0, abfluss: 0, kostenJahr: 0 },
    energie: { anteile: { ...AUSSEN.anteileStart }, hormus: "gestoert", versorgung: 55 },
    terror: { is: 35, pkk: 40, links: 20 },
    friedens: { phase: 1, fortschritt: 0, rueckschlaege: 0 },
    sanktionen: [],
    zaehler: {},
    diaspora: { vertrauen: 50, flussMrd: 0, mobilisierung: 0 },
    bis: {},
    besuche: {},
    abberufen: [],
    eigeneSanktionen: [],
    berichte: [],
    verlauf: [],
  });
  // Ältere Stände dieses Moduls ergänzen
  a.bis ??= {};
  a.besuche ??= {};
  a.abberufen ??= [];
  a.eigeneSanktionen ??= [];
  a.berichte ??= [];
  a.verlauf ??= [];
  a.zaehler ??= {};
  a.diaspora ??= { vertrauen: 50, flussMrd: 0, mobilisierung: 0 };
  return a;
}

function aktiv(w: World, a: AussenZustand, k: keyof AussenZustand["bis"]): boolean {
  return (a.bis[k] ?? -1) >= w.day;
}

function hinweis(w: World, id: string, titel: string, text: string[]): void {
  const sp = w.spiel;
  if (!sp) return;
  if (sp.hinweise.some((h) => h.id === id)) return;
  sp.hinweise.push({ id, titel, text, szene: "istanbul" });
}

/** Konflikt-Anker je Hauptakteur: wohin der Konfliktwert ohne Ereignisse zurückkehrt (statt immer zum Startwert). */
export function konfliktAnker(w: World, id: string, m: WeltModell = weltModell(w)): number {
  const a = aussenZustand(w);
  const vertraege = alleLaufenden(w).filter((v) => v.land === id).length;
  const kurs = m.laender[id]?.kurs ?? 0;
  const sanktion = a.sanktionen.some((s) => s.von === id) || a.eigeneSanktionen.includes(id) ? 1 : 0;
  const abberufen = a.abberufen.includes(id) ? 1 : 0;
  // Spielparameter: jeder laufende Vertrag senkt den Anker um 6 (höchstens 3), ein härterer Kurs hebt ihn um 8
  return clamp(-6 * Math.min(3, vertraege) - 8 * kurs + 10 * sanktion + 6 * abberufen, -25, 30);
}

// ---------------------------------------------------------------------------
// Monatsschritt (vom Weltmodell aufgerufen, nach der Rückwirkung)

export function aussenMonat(w: World, m: WeltModell): void {
  const sp = w.spiel;
  if (!sp || sp.ende) return;
  const a = aussenZustand(w);
  const monat = w.date.slice(0, 7);
  if (a.monat === monat) return;
  a.monat = monat;
  const rng = new Rng(hashInt(`${w.seed}|aussen|${monat}`));
  const L = (id: string) => m.laender[id];

  // 1. Anker der Beziehungen und dauerhafter Kurs neuer Führungen (laender.ts liest `anker` im Monatsschritt)
  const welt = weltZustand(w);
  for (const l of LAENDER) {
    const z = welt[l.id]!;
    z.anker = konfliktAnker(w, l.id, m);
    const kurs = L(l.id)?.kurs ?? 0;
    if (kurs !== 0) z.versatz = clamp(z.versatz + 0.3 * kurs, -60, 60);
  }

  // 2. Handel je Land als Dauerwirkung auf Export und Tourismus (Stützung jeden Monat, solange die Beziehung trägt)
  let handel = 0;
  for (const [id, g] of Object.entries(HANDEL_GEWICHT)) {
    const z = welt[id];
    if (!z) continue;
    handel += g * (z.handel - land(id).start.handel);
  }
  stoss(w, "export", clamp(0.004 * handel, -0.3, 0.3));
  const gaeste = 0.5 * (vertrauenZu(w, "EU") - land("EU").start.vertrauen) + 0.3 * (vertrauenZu(w, "RUS") - land("RUS").start.vertrauen);
  stoss(w, "tourismus", clamp(0.003 * gaeste, -0.15, 0.15));

  // 3. Flucht: Zufluss aus Kriegen und Krisen der Nachbarn, Rückkehr bei Stabilität und Programmen
  const syr = L("SYR");
  const irq = L("IRQ");
  const irn = L("IRN");
  // Spielparameter: Zufluss erst bei Krise oder heißem Krieg, Rückkehr als laufender Trend seit dem Assad-Sturz (UNHCR-Reihe), stärker bei Stabilität
  let zufluss = 0;
  if (syr) zufluss += (syr.krise ? 0.015 : 0) + 0.0002 * Math.max(0, syr.krieg - 40);
  if (irq) zufluss += (irq.krise ? 0.005 : 0) + 0.0001 * Math.max(0, irq.krieg - 40);
  if (irn) zufluss += (irn.stabilitaet < 20 ? (0.012 * (20 - irn.stabilitaet)) / 20 : 0) + 0.0001 * Math.max(0, irn.krieg - 40);
  const grenze = clamp((massnahme(w, "m_grenzschutz") - 50) / 100, -0.2, 0.4) + (aktiv(w, a, "grenze") ? 0.25 : 0);
  zufluss = Math.max(0, zufluss * (1 - grenze));
  const stabSyr = syr?.stabilitaet ?? 40;
  let abflussQuote = (stabSyr >= 25 ? 0.0015 : 0) + (stabSyr > 30 ? (0.003 * (stabSyr - 30)) / 70 : 0);
  abflussQuote += clamp((massnahme(w, "m_rueckkehr") - 50) / 50, -0.5, 1) * 0.003;
  if (aktiv(w, a, "rueckfuehrung")) abflussQuote += 0.006;
  const abfluss = Math.max(0, a.flucht.bestand * abflussQuote);
  const vorher = a.flucht.bestand;
  a.flucht.bestand = r2(clamp(a.flucht.bestand + zufluss - abfluss, 0.2, 6));
  a.flucht.zufluss = r2(zufluss);
  a.flucht.abfluss = r2(abfluss);
  const euMig = aktiv(w, a, "euHilfe") || alleLaufenden(w).some((v) => v.land === "EU" && v.gibt.includes("migration_zusage"));
  a.flucht.kostenJahr = r2(a.flucht.bestand * AUSSEN.kostenJeMio * (euMig ? 1 - AUSSEN.euAnteil : 1));
  // Die Kosten tragen Sozialkassen und Haushalt über das Netz (keine zweite Schuldenbuchung neben dem Wirtschaftsmodell)
  stoss(w, "sozialkassen", -0.08 * a.flucht.kostenJahr);
  // Bestand auf den Index „Geflüchtete“ (Start 60) abbilden; dazu Wohnen und Nationalisten über die Netzkanten
  const zielIndex = clamp(startK(w, "gefluechtete", 60) + (a.flucht.bestand - AUSSEN.fluchtStart) * (a.flucht.bestand >= AUSSEN.fluchtStart ? 8 : 3), 0, 100);
  // Spielparameter: Rückgang entlastet langsamer, als ein Zuwachs belastet (Wohnungen und Stimmung folgen träge)
  stoss(w, "gefluechtete", 0.04 * (zielIndex - knoten(w, "gefluechtete", 60)));
  stoss(w, "mieten", clamp((a.flucht.bestand > vorher ? 0.5 : 0.15) * (a.flucht.bestand - vorher), -0.15, 0.15));
  // Den Migrationsdruck erzeugt das Netz aus dem Index „Geflüchtete“ (keine zweite Wirkung hier)

  // 4. Energie: Anteile, Hormus, Versorgungssicherheit, Winterprüfung
  const isrIrn = sp.vermittlung?.["isr_irn"]?.konfliktIndex;
  const hormus: Hormus = isrIrn === undefined ? a.energie.hormus : isrIrn >= 70 ? "geschlossen" : isrIrn >= 45 ? "gestoert" : "offen";
  if (hormus !== a.energie.hormus) {
    hinweis(w, `aussen-hormus-${monat}`, t("aussen.hormus.titel"), [t(`aussen.hormus.${hormus}`)]);
    a.energie.hormus = hormus;
  }
  const an = a.energie.anteile;
  const rusRisiko = clamp((welt["RUS"]?.konflikt ?? 45) / 100 + (a.sanktionen.length ? 0.1 : 0), 0, 1);
  const hormusF = hormus === "geschlossen" ? 0.6 : hormus === "gestoert" ? 0.3 : 0;
  const heim = clamp((knoten(w, "sakarya_gas", 25) - 25) * 0.2, -3, 10);
  a.energie.versorgung = r1(clamp(78 - 40 * (an.RUS / 100) * rusRisiko - 30 * (an.LNG / 100) * hormusF - 0.2 * Math.max(an.RUS, an.LNG, an.AZE) + heim, 0, 100));
  const maxAnteil = Math.max(an.RUS, an.LNG, an.AZE);
  a.basis ??= { versorgung: a.energie.versorgung, terror: 0, anteilMax: maxAnteil };
  stoss(w, "energieversorgung", 0.05 * (startK(w, "energieversorgung", 55) + (a.energie.versorgung - a.basis.versorgung) - knoten(w, "energieversorgung", 55)));
  stoss(w, "gasabhaengigkeit", 0.05 * (startK(w, "gasabhaengigkeit", 70) + 1.5 * (maxAnteil - a.basis.anteilMax) - knoten(w, "gasabhaengigkeit", 70)));
  // Den Preis selbst trägt der Ölpreis der Außenwelt (sim/aussenwelt.ts); hier nur die Versorgung, sonst zählte Hormus doppelt
  const mon = Number(monat.slice(5, 7));
  if (mon === 11 && a.energie.versorgung < 45) hinweis(w, `aussen-winter-warn-${monat}`, t("aussen.winter.warn_titel"), [t("aussen.winter.warn", { v: Math.round(a.energie.versorgung) })]);
  if (mon === 1 && a.energie.versorgung < 45) {
    stoss(w, "p_energiemangel", 6);
    stoss(w, "lebenshaltung", 2);
    stoss(w, "vertrauen_regierung", -2);
    hinweis(w, `aussen-winter-${monat}`, t("aussen.winter.titel"), [t("aussen.winter.text", { v: Math.round(a.energie.versorgung) })]);
  }

  // 5. Terror: drei Täterkreise mit eigenen Treibern
  const ziel: Record<Taeter, number> = {
    is: clamp(0.5 * (syr?.krieg ?? 30) + 0.3 * (100 - stabSyr) + 0.2 * (irq?.krieg ?? 20) - 0.2 * (massnahme(w, "m_polizei") - 50) - (aktiv(w, a, "grenze") ? 8 : 0), 0, 100),
    pkk: clamp(60 - 12 * a.friedens.phase - 0.3 * (knoten(w, "minderheiten", 50) - 50) + 0.15 * (irq?.krieg ?? 20) - 0.15 * (massnahme(w, "m_polizei") - 50), 0, 100),
    links: clamp(0.6 * knoten(w, "polarisierung", 70) - 10 + 0.3 * (knoten(w, "protestdruck", 40) - 40), 0, 100),
  };
  for (const k of ["is", "pkk", "links"] as Taeter[]) a.terror[k] = r1(a.terror[k] + 0.1 * (ziel[k] - a.terror[k]));
  const terrorIndex = 0.5 * Math.max(a.terror.is, a.terror.pkk, a.terror.links) + 0.5 * ((a.terror.is + a.terror.pkk + a.terror.links) / 3);
  if (!a.basis.terror) a.basis.terror = terrorIndex;
  stoss(w, "terrorgefahr", 0.05 * (startK(w, "terrorgefahr", 40) + (terrorIndex - a.basis.terror) - knoten(w, "terrorgefahr", 40)));
  for (const k of ["is", "pkk", "links"] as Taeter[]) {
    if (rng.next() < (a.terror[k] / 100) * AUSSEN.anschlagChance) {
      anschlag(w, a, k);
      break;
    }
  }

  // 6. Friedensprozess: Fortschritt aus Politik und Stimmung, Rückschläge durch Anschläge
  const fp = a.friedens;
  const kurs = clamp((massnahme(w, "m_friedensprozess") - 45) / 55, -1, 1);
  fp.fortschritt = r1(fp.fortschritt + 6 * kurs + 0.05 * (knoten(w, "minderheiten", 50) - 50) - 0.03 * (knoten(w, "nationalisten", 50) - 50));
  if (fp.fortschritt >= 100 && fp.phase < PHASEN - 1) {
    fp.phase += 1;
    fp.fortschritt = 0;
    hinweis(w, `aussen-frieden-${fp.phase}-${monat}`, t("aussen.frieden.titel"), [t(`aussen.frieden.phase${fp.phase}`)]);
    addLog(w, "ereignis", t("aussen.frieden.log", { phase: t(`aussen.frieden.name${fp.phase}`) }));
  } else if (fp.fortschritt <= -60 && fp.phase > 0) {
    fp.phase -= 1;
    fp.fortschritt = 0;
    fp.rueckschlaege += 1;
    hinweis(w, `aussen-frieden-zurueck-${monat}`, t("aussen.frieden.zurueck_titel"), [t("aussen.frieden.zurueck", { phase: t(`aussen.frieden.name${fp.phase}`) })]);
  }
  fp.fortschritt = clamp(fp.fortschritt, -60, 100);
  if (fp.phase >= 2) {
    stoss(w, "minderheiten", 0.1);
    stoss(w, "ansehen", 0.05);
    stoss(w, "nationalisten", -0.04 * fp.phase);
  }

  // 7. Sanktionen gegen die Türkei: entstehen nach anhaltendem Konflikt, enden nach anhaltender Entspannung
  sanktionsRegel(w, a, "caatsa", "USA", (welt["USA"]?.konflikt ?? 45) >= 70, (welt["USA"]?.konflikt ?? 45) < 50, 3);
  const euRegel = (welt["EU"]?.konflikt ?? 45) >= 75 || (knoten(w, "pressefreiheit", 30) < 12 && knoten(w, "justiz_unabhaengigkeit", 30) < 20);
  sanktionsRegel(w, a, "eu_handel", "EU", euRegel, (welt["EU"]?.konflikt ?? 45) < 60 && knoten(w, "pressefreiheit", 30) >= 15, 6);
  for (const s of a.sanktionen) {
    if (s.id === "caatsa") {
      stoss(w, "modernisierung", -0.15);
      stoss(w, "export", -0.1);
      stoss(w, "auslandskapital", -0.1);
    } else {
      stoss(w, "export", -0.3);
      stoss(w, "auslandskapital", -0.2);
      stoss(w, "beziehungen_eu", -0.1);
    }
  }
  for (const id of a.eigeneSanktionen) stoss(w, "export", -0.05 * (HANDEL_GEWICHT[id] ?? 0.02) * 10);

  // 8. Partner können Verträge brechen (heute brach nur die Türkei)
  for (const v of alleLaufenden(w)) {
    const vt = vertrauenZu(w, v.land);
    const kursL = L(v.land)?.kurs ?? 0;
    if (vt < 22 || (kursL === -1 && vt < 35)) {
      if (rng.next() < 0.12) {
        v.status = "gebrochen";
        v.ende = t("aussen.bruch.ende");
        landAendern(w, v.land, { vertrauen: -4, konflikt: 4 }, t("aussen.bruch.notiz"));
        stoss(w, "ansehen", -0.5);
        hinweis(w, `aussen-bruch-${v.id}`, t("aussen.bruch.titel", { land: akteurName(v.land) }), [t("aussen.bruch.text", { land: akteurName(v.land) })]);
        addLog(w, "ereignis", t("aussen.bruch.titel", { land: akteurName(v.land) }));
      }
    }
  }

  // 9. Diaspora: Vertrauen, Devisen und Ereignisse in den Gastländern
  const dz = a.diaspora;
  const zielD = 0.4 * knoten(w, "beziehungen_eu", 40) + 0.3 * knoten(w, "pressefreiheit", 30) * 1.6 + 0.3 * knoten(w, "vertrauen_regierung", 50);
  dz.vertrauen = r1(clamp(dz.vertrauen + 0.1 * (zielD - dz.vertrauen), 0, 100));
  const druck = w.economy.reservenDruck ?? 0;
  let fluss = 0;
  if (druck > 0.3 && dz.vertrauen >= DIASPORA_DOEVIZ.vertrauenZuflussAb) fluss = (DIASPORA_DOEVIZ.krisenZuflussMrdUsd.min + DIASPORA_DOEVIZ.krisenZuflussMrdUsd.max) / 2 / 12;
  else if (dz.vertrauen < DIASPORA_DOEVIZ.vertrauenAbflussAb) fluss = (DIASPORA_DOEVIZ.abflussMrdUsd.max / 12) * clamp((DIASPORA_DOEVIZ.vertrauenAbflussAb - dz.vertrauen) / 20, 0, 1.6);
  dz.flussMrd = r2(fluss);
  if (fluss !== 0) {
    w.economy.reservenNettoUsdMrd = Math.max(0, (w.economy.reservenNettoUsdMrd ?? 0) + fluss);
    w.economy.reservenBruttoUsdMrd = Math.max(0, (w.economy.reservenBruttoUsdMrd ?? 0) + fluss);
  }
  dz.mobilisierung = r1(dz.mobilisierung * 0.9);
  if (rng.next() < 0.025) {
    const e = DIASPORA_EREIGNISSE[Math.floor(rng.next() * DIASPORA_EREIGNISSE.length)]!;
    if (e.beziehungGastland) landAendern(w, "EU", { vertrauen: e.beziehungGastland * 0.4 }, e.titel);
    if (e.diasporaMobilisierung) dz.mobilisierung = r1(dz.mobilisierung + e.diasporaMobilisierung);
    hinweis(w, `aussen-diaspora-${e.id}-${monat}`, e.titel, [t("aussen.diaspora.ereignis", { beleg: e.beleg })]);
  }

  // 10. Wirkungsberichte der Instrumente nach 6 und 12 Monaten
  const jetzt = momentaufnahme(w);
  for (const b of a.berichte) {
    if (!b.nach6 && w.day - b.tag >= 182) b.nach6 = jetzt(b.land);
    if (!b.nach12 && w.day - b.tag >= 365) b.nach12 = jetzt(b.land);
  }
  if (a.berichte.length > 40) a.berichte.splice(0, a.berichte.length - 40);

  // 11. Verlauf für die Akte (60 Monate)
  a.verlauf.push({
    monat,
    ansehen: r1(knoten(w, "ansehen", 50)),
    eu: r1(vertrauenZu(w, "EU")),
    sicherheit: r1(100 - knoten(w, "terrorgefahr", 40)),
    flucht: a.flucht.bestand,
    energie: a.energie.versorgung,
    diaspora: dz.vertrauen,
    terror: r1(terrorIndex),
  });
  if (a.verlauf.length > 60) a.verlauf.shift();
}

function sanktionsRegel(w: World, a: AussenZustand, id: Sanktion["id"], von: string, an: boolean, aus: boolean, monate: number): void {
  const k = `${id}`;
  const laeuft = a.sanktionen.find((s) => s.id === id);
  if (!laeuft) {
    a.zaehler[k] = an ? (a.zaehler[k] ?? 0) + 1 : 0;
    if (a.zaehler[k] === monate - 1) hinweis(w, `aussen-sanktion-droht-${id}-${w.date.slice(0, 7)}`, t("aussen.sanktion.droht_titel", { land: akteurName(von) }), [t(`aussen.sanktion.droht.${id}`)]);
    if (a.zaehler[k]! >= monate) {
      a.sanktionen.push({ id, von, seit: w.day });
      a.zaehler[k] = 0;
      hinweis(w, `aussen-sanktion-${id}-${w.day}`, t("aussen.sanktion.titel", { land: akteurName(von) }), [t(`aussen.sanktion.text.${id}`)]);
      addLog(w, "ereignis", t("aussen.sanktion.titel", { land: akteurName(von) }));
    }
  } else {
    a.zaehler[`${k}_aus`] = aus ? (a.zaehler[`${k}_aus`] ?? 0) + 1 : 0;
    if (a.zaehler[`${k}_aus`]! >= 6) {
      a.sanktionen = a.sanktionen.filter((s) => s.id !== id);
      a.zaehler[`${k}_aus`] = 0;
      hinweis(w, `aussen-sanktion-ende-${id}-${w.day}`, t("aussen.sanktion.ende_titel", { land: akteurName(von) }), [t("aussen.sanktion.ende")]);
    }
  }
}

function anschlag(w: World, a: AussenZustand, k: Taeter): void {
  a.letzterAnschlag = { tag: w.day, taeter: k };
  stoss(w, "tourismus", -2);
  stoss(w, "nationalisten", 1.5);
  stoss(w, "polarisierung", 1.5);
  stoss(w, "vertrauen_regierung", -1);
  stoss(w, "terrorgefahr", 3);
  // Auslandsfolge nach Täterkreis
  if (k === "is") landAendern(w, "SYR", { konflikt: 6 }, t("aussen.anschlag.notiz"));
  if (k === "pkk") {
    landAendern(w, "IRQ", { konflikt: 4 }, t("aussen.anschlag.notiz"));
    a.friedens.fortschritt = r1(a.friedens.fortschritt - 25);
    a.friedens.rueckschlaege += 1;
  }
  hinweis(w, `aussen-anschlag-${w.day}`, t(`aussen.anschlag.titel.${k}`), [t(`aussen.anschlag.text.${k}`)]);
  addLog(w, "ereignis", t(`aussen.anschlag.titel.${k}`));
}

function momentaufnahme(w: World): (landId?: string) => Record<string, number> {
  return (landId) => {
    const r: Record<string, number> = {
      ansehen: r1(knoten(w, "ansehen", 50)),
      export: r1(knoten(w, "export", 50)),
      sicherheit: r1(100 - knoten(w, "terrorgefahr", 40)),
      flucht: aussenZustand(w).flucht.bestand,
      energie: aussenZustand(w).energie.versorgung,
    };
    if (landId && LAENDER.some((l) => l.id === landId)) {
      r.vertrauen = r1(vertrauenZu(w, landId));
      r.konflikt = r1(weltZustand(w)[landId]!.konflikt);
      r.handel = r1(weltZustand(w)[landId]!.handel);
    }
    return r;
  };
}

// ---------------------------------------------------------------------------
// Instrumente

export interface Folge {
  text: string;
  /** +1 gut für die Türkei, −1 schlecht, 0 gemischt */
  ton: -1 | 0 | 1;
}

export interface InstrumentSicht {
  id: InstrumentId;
  label: string;
  text: string;
  pk: number;
  aufmerksamkeit: number;
  braucheLand: boolean;
  laender: string[];
  moeglich: boolean;
  grund?: string;
}

export const AGENDEN: Agenda[] = ["handel", "sicherheit", "energie", "migration", "diaspora"];

function landListe(): string[] {
  return LAENDER.map((l) => l.id);
}

export function instrumente(w: World): InstrumentSicht[] {
  const a = aussenZustand(w);
  const kapital = w.spiel?.kapital ?? 0;
  const pause = neuanfangGrund(w);
  const def = (id: InstrumentId, braucheLand: boolean, laender: string[], extra?: string): InstrumentSicht => {
    const pk = AUSSEN.pk[id];
    const grund = pause ?? (!kannZahlen(kapital, pk) ? t("aussen.grund.kapital", { pk }) : extra);
    return { id, label: t(`aussen.instr.${id}.label`), text: t(`aussen.instr.${id}.text`), pk, aufmerksamkeit: AUSSEN.aufmerksamkeit[id], braucheLand, laender, moeglich: !grund, ...(grund ? { grund } : {}) };
  };
  const alle = landListe();
  return [
    def("staatsbesuch", true, alle),
    def("botschafter_ab", true, alle.filter((id) => !a.abberufen.includes(id))),
    def("botschafter_zurueck", true, a.abberufen, a.abberufen.length ? undefined : t("aussen.grund.keiner_abberufen")),
    def("sanktion", true, alle.filter((id) => !a.eigeneSanktionen.includes(id) && id !== "EU" && id !== "USA")),
    def("sanktion_aufheben", true, a.eigeneSanktionen, a.eigeneSanktionen.length ? undefined : t("aussen.grund.keine_sanktion")),
    def("rueckfuehrung", false, [], aktiv(w, a, "rueckfuehrung") ? t("aussen.grund.laeuft") : undefined),
    def("grenzsicherung", false, [], aktiv(w, a, "grenze") ? t("aussen.grund.laeuft") : undefined),
    def("friedensschritt", false, [], a.friedens.phase >= PHASEN - 1 ? t("aussen.grund.frieden_fertig") : undefined),
  ];
}

/** Vorschau der Folgen eines Instruments (aus denselben Zahlen, die die Ausführung benutzt). */
export function vorschau(w: World, id: InstrumentId, landId?: string, agenda: Agenda = "handel"): Folge[] {
  const n = landId ? akteurName(landId) : "";
  const f = (key: string, ton: -1 | 0 | 1, p?: Record<string, string | number>): Folge => ({ text: t(`aussen.folge.${key}`, { land: n, ...(p ?? {}) }), ton });
  switch (id) {
    case "staatsbesuch": {
      const out: Folge[] = [f("vertrauen_plus", 1, { d: 4 })];
      if (agenda === "handel") out.push(f("handel_plus", 1, { d: 8 }), f("export_plus", 1));
      if (agenda === "sicherheit") out.push(f("sicherheit_plus", 1, { d: 8 }), f("abschreckung_plus", 1));
      if (agenda === "energie") out.push(landId && ENERGIE_PARTNER[landId] ? f("energie_anteil", 1, { lieferant: t(`aussen.lieferant.${ENERGIE_PARTNER[landId]}`) }) : f("energie_keiner", 0));
      if (agenda === "migration") out.push(landId && MIGRATION_PARTNER.has(landId) ? f(landId === "SYR" || landId === "IRQ" ? "rueckkehr_plus" : "eu_hilfe", 1) : f("migration_keiner", 0));
      if (agenda === "diaspora") out.push(f("diaspora_plus", 1), f("ansehen_plus", 1));
      if (landId === "RUS" || landId === "IRN") out.push(f("westen_skeptisch", -1));
      return out;
    }
    case "botschafter_ab":
      return [f("vertrauen_minus", -1, { d: 10 }), f("konflikt_plus", -1, { d: 8 }), f("nationalisten_plus", 1), f("ansehen_minus", -1)];
    case "botschafter_zurueck":
      return [f("vertrauen_plus", 1, { d: 4 }), f("konflikt_minus", 1, { d: 3 })];
    case "sanktion":
      return [f("handel_minus", -1, { d: 15 }), f("konflikt_plus", -1, { d: 10 }), f("export_minus", -1), f("druck_auf", 0)];
    case "sanktion_aufheben":
      return [f("handel_plus", 1, { d: 6 }), f("konflikt_minus", 1, { d: 5 })];
    case "rueckfuehrung":
      return [f("rueckkehr_zwoelf", 1), f("kosten_schulden", -1), f("nationalisten_plus", 1), f("ansehen_minus", -1)];
    case "grenzsicherung":
      return [f("zufluss_minus", 1), f("terror_is_minus", 1), f("nationalisten_plus", 1), f("ansehen_klein_minus", -1)];
    case "friedensschritt":
      return [f("frieden_plus", 1, { d: massnahme(w, "m_friedensprozess") >= 40 ? 20 : 8 }), f("minderheiten_plus", 1), f("nationalisten_minus", -1)];
  }
}

export function fuehreInstrumentAus(w: World, id: InstrumentId, landId?: string, agenda: Agenda = "handel"): { ok: boolean; text: string; why?: string } {
  const sp = w.spiel;
  if (!sp) return { ok: false, text: t("aussen.grund.ohne_spiel") };
  const sicht = instrumente(w).find((i) => i.id === id)!;
  if (!sicht.moeglich) return { ok: false, text: sicht.grund ?? "" };
  if (sicht.braucheLand && (!landId || !sicht.laender.includes(landId))) return { ok: false, text: t("aussen.grund.land") };
  const a = aussenZustand(w);
  if (id === "staatsbesuch" && landId && w.day - (a.besuche[landId] ?? -1e9) < AUSSEN.besuchAbkuehlung) {
    return { ok: false, text: t("aussen.grund.besuch", { land: akteurName(landId), tage: AUSSEN.besuchAbkuehlung - (w.day - a.besuche[landId]!) }) };
  }
  const vorher = momentaufnahme(w)(landId);
  sp.kapital -= sicht.pk;
  verbrauche(w, sicht.aufmerksamkeit, sicht.label);
  const n = landId ? akteurName(landId) : "";
  switch (id) {
    case "staatsbesuch": {
      a.besuche[landId!] = w.day;
      landAendern(w, landId!, { vertrauen: 4 }, t("aussen.notiz.besuch", { agenda: t(`aussen.agenda.${agenda}`) }));
      if (agenda === "handel") {
        landAendern(w, landId!, { handel: 8 });
        stoss(w, "export", 0.3);
      } else if (agenda === "sicherheit") {
        landAendern(w, landId!, { sicherheit: 8 });
        stoss(w, "abschreckung", 0.3);
      } else if (agenda === "energie") {
        const l = ENERGIE_PARTNER[landId!];
        if (l) verschiebeAnteil(a, l, 4);
        landAendern(w, landId!, { handel: 4 });
      } else if (agenda === "migration") {
        if (landId === "SYR" || landId === "IRQ") a.bis.rueckfuehrung = Math.max(a.bis.rueckfuehrung ?? 0, w.day + 365);
        else if (MIGRATION_PARTNER.has(landId!)) a.bis.euHilfe = Math.max(a.bis.euHilfe ?? 0, w.day + 365);
      } else if (agenda === "diaspora") {
        a.diaspora.vertrauen = r1(clamp(a.diaspora.vertrauen + 5, 0, 100));
        stoss(w, "ansehen", 0.5);
      }
      if (landId === "RUS" || landId === "IRN") {
        landAendern(w, "USA", { vertrauen: -2 });
        landAendern(w, "EU", { vertrauen: -1 });
      }
      break;
    }
    case "botschafter_ab":
      a.abberufen.push(landId!);
      landAendern(w, landId!, { vertrauen: -10, konflikt: 8 }, t("aussen.notiz.abberufen"));
      stoss(w, "nationalisten", 1);
      stoss(w, "ansehen", -0.5);
      break;
    case "botschafter_zurueck":
      a.abberufen = a.abberufen.filter((x) => x !== landId);
      landAendern(w, landId!, { vertrauen: 4, konflikt: -3 }, t("aussen.notiz.zurueck"));
      break;
    case "sanktion":
      a.eigeneSanktionen.push(landId!);
      landAendern(w, landId!, { handel: -15, konflikt: 10, vertrauen: -8 }, t("aussen.notiz.sanktion"));
      stoss(w, "export", -0.3);
      break;
    case "sanktion_aufheben":
      a.eigeneSanktionen = a.eigeneSanktionen.filter((x) => x !== landId);
      landAendern(w, landId!, { handel: 6, konflikt: -5 }, t("aussen.notiz.sanktion_ende"));
      break;
    case "rueckfuehrung":
      a.bis.rueckfuehrung = w.day + 365;
      w.economy.debtRatio += 0.1;
      landAendern(w, "SYR", { vertrauen: 4 });
      stoss(w, "nationalisten", 1);
      stoss(w, "ansehen", -0.5);
      break;
    case "grenzsicherung":
      a.bis.grenze = w.day + 365;
      a.terror.is = r1(Math.max(0, a.terror.is - 10));
      stoss(w, "nationalisten", 1);
      stoss(w, "ansehen", -0.3);
      break;
    case "friedensschritt":
      a.friedens.fortschritt = r1(clamp(a.friedens.fortschritt + (massnahme(w, "m_friedensprozess") >= 40 ? 20 : 8), -60, 100));
      stoss(w, "minderheiten", 1);
      stoss(w, "nationalisten", -1);
      break;
  }
  a.berichte.push({ id: `${id}-${w.day}-${landId ?? "tr"}`, instrument: id, ...(landId ? { land: landId } : {}), ...(id === "staatsbesuch" ? { agenda } : {}), tag: w.day, datum: w.date, vorher });
  const text = t(`aussen.instr.${id}.ausgang`, { land: n, agenda: t(`aussen.agenda.${agenda}`) });
  const why = t("aussen.kostet", { pk: sicht.pk, a: sicht.aufmerksamkeit });
  addLog(w, "entscheidung", text, why);
  return { ok: true, text, why };
}

/** Verschiebt Anteile am Gasbezug (Ereignis „Gasvertrag“: Verlängern stärkt den Lieferanten, Diversifizieren das Flüssiggas). */
export function lieferanteilVerschieben(w: World, ziel: Lieferant, d: number): void {
  verschiebeAnteil(aussenZustand(w), ziel, d);
}

function verschiebeAnteil(a: AussenZustand, ziel: Lieferant, d: number): void {
  const an = a.energie.anteile;
  const quelle: Lieferant = ziel === "RUS" ? "LNG" : an.RUS >= an.LNG ? "RUS" : "LNG";
  const wirklich = Math.min(d, an[quelle]);
  an[quelle] = r1(an[quelle] - wirklich);
  an[ziel] = r1(an[ziel] + wirklich);
}

// ---------------------------------------------------------------------------
// Lesefunktionen für die Akte

export interface Vorwarnung {
  id: string;
  text: string;
  ernst: 1 | 2;
}

export function vorwarnungen(w: World): Vorwarnung[] {
  const a = aussenZustand(w);
  const welt = weltZustand(w);
  const out: Vorwarnung[] = [];
  if (a.energie.hormus !== "offen") out.push({ id: "hormus", text: t(`aussen.warn.hormus_${a.energie.hormus}`), ernst: a.energie.hormus === "geschlossen" ? 2 : 1 });
  if (a.energie.versorgung < 45) out.push({ id: "winter", text: t("aussen.warn.winter", { v: Math.round(a.energie.versorgung) }), ernst: 2 });
  if ((welt["USA"]?.konflikt ?? 0) >= 60 && !a.sanktionen.some((s) => s.id === "caatsa")) out.push({ id: "caatsa", text: t("aussen.warn.caatsa"), ernst: 1 });
  if ((welt["EU"]?.konflikt ?? 0) >= 65 && !a.sanktionen.some((s) => s.id === "eu_handel")) out.push({ id: "eu", text: t("aussen.warn.eu"), ernst: 1 });
  if (a.flucht.zufluss > 0.02) out.push({ id: "flucht", text: t("aussen.warn.flucht", { z: Math.round(a.flucht.zufluss * 1000) }), ernst: 2 });
  for (const k of ["is", "pkk", "links"] as Taeter[]) if (a.terror[k] >= 60) out.push({ id: `terror-${k}`, text: t(`aussen.warn.terror_${k}`), ernst: 2 });
  for (const v of alleLaufenden(w)) if (vertrauenZu(w, v.land) < 30) out.push({ id: `bruch-${v.id}`, text: t("aussen.warn.bruch", { land: akteurName(v.land) }), ernst: 1 });
  if (a.diaspora.vertrauen < 40) out.push({ id: "diaspora", text: t("aussen.warn.diaspora"), ernst: 1 });
  return out;
}

/** Außenkalender für das Terminblatt: feste Jahrestermine (Monat laut Recherche; genaue Tage zu prüfen) und geplante Besuche. */
export function aussenTermine(w: World): { id: string; tage: number; datum: string; text: string }[] {
  const jahr = Number(w.date.slice(0, 4));
  const feste: { id: string; monat: number; key: string }[] = [
    { id: "un", monat: 9, key: "aussen.termin.un" },
    { id: "g20", monat: 11, key: "aussen.termin.g20" },
    { id: "nato", monat: 7, key: "aussen.termin.nato" },
    { id: "ots", monat: 10, key: "aussen.termin.ots" },
  ];
  const out: { id: string; tage: number; datum: string; text: string }[] = [];
  for (const f of feste) {
    for (const j of [jahr, jahr + 1]) {
      const datum = `${j}-${String(f.monat).padStart(2, "0")}-15`;
      const tage = Math.round((Date.parse(datum) - Date.parse(w.date)) / 86_400_000);
      if (tage >= 0 && tage <= 365) {
        out.push({ id: `aussen-${f.id}-${j}`, tage, datum, text: t(f.key) });
        break;
      }
    }
  }
  return out;
}

export interface AussenLage {
  kennzahlen: { id: keyof Omit<AussenVerlauf, "monat">; wert: number; reihe: number[]; einheit: string }[];
  vorwarnungen: Vorwarnung[];
  energie: AussenZustand["energie"];
  flucht: AussenZustand["flucht"];
  terror: AussenZustand["terror"];
  friedens: AussenZustand["friedens"];
  sanktionen: Sanktion[];
  diaspora: AussenZustand["diaspora"];
  monate: string[];
}

export function aussenLage(w: World): AussenLage {
  const a = aussenZustand(w);
  const reihe = (k: keyof Omit<AussenVerlauf, "monat">) => a.verlauf.map((v) => v[k]);
  const letzt = <K extends keyof Omit<AussenVerlauf, "monat">>(k: K, ersatz: number) => (a.verlauf.length ? a.verlauf[a.verlauf.length - 1]![k] : ersatz);
  return {
    kennzahlen: [
      { id: "ansehen", wert: letzt("ansehen", knoten(w, "ansehen", 50)), reihe: reihe("ansehen"), einheit: "" },
      { id: "eu", wert: letzt("eu", vertrauenZu(w, "EU")), reihe: reihe("eu"), einheit: "" },
      { id: "sicherheit", wert: letzt("sicherheit", 100 - knoten(w, "terrorgefahr", 40)), reihe: reihe("sicherheit"), einheit: "" },
      { id: "flucht", wert: a.flucht.bestand, reihe: reihe("flucht"), einheit: "Mio." },
      { id: "energie", wert: a.energie.versorgung, reihe: reihe("energie"), einheit: "" },
      { id: "diaspora", wert: a.diaspora.vertrauen, reihe: reihe("diaspora"), einheit: "" },
    ],
    vorwarnungen: vorwarnungen(w),
    energie: a.energie,
    flucht: a.flucht,
    terror: a.terror,
    friedens: a.friedens,
    sanktionen: a.sanktionen,
    diaspora: a.diaspora,
    monate: a.verlauf.map((v) => v.monat),
  };
}

export interface BerichtSicht {
  id: string;
  titel: string;
  datum: string;
  zeilen: { key: string; vorher: number; nachher: number }[];
  stand: "offen" | "6" | "12";
}

export function aussenBerichte(w: World): BerichtSicht[] {
  const a = aussenZustand(w);
  return a.berichte
    .slice()
    .reverse()
    .map((b) => {
      const nach = b.nach12 ?? b.nach6;
      const titel = t(`aussen.instr.${b.instrument}.label`) + (b.land ? ` · ${akteurName(b.land)}` : "") + (b.agenda ? ` · ${t(`aussen.agenda.${b.agenda}`)}` : "");
      return {
        id: b.id,
        titel,
        datum: b.datum,
        stand: b.nach12 ? "12" : b.nach6 ? "6" : "offen",
        zeilen: nach ? Object.keys(b.vorher).map((k) => ({ key: k, vorher: b.vorher[k]!, nachher: nach[k] ?? b.vorher[k]! })) : [],
      } as BerichtSicht;
    });
}

/** Für die Wahl (Fork NACHFOLGE): Mobilisierung der Diaspora in Prozentpunkten Beteiligung (Spielparameter). */
export function diasporaMobilisierung(w: World): number {
  return aussenZustand(w).diaspora.mobilisierung;
}

/** Datum in N Tagen (für die Anzeige der Befristungen). */
export function bisDatum(w: World, k: keyof AussenZustand["bis"]): string | undefined {
  const b = aussenZustand(w).bis[k];
  return b && b >= w.day ? addDays(w.date, b - w.day) : undefined;
}

setzeAussenHaken(aussenMonat);
