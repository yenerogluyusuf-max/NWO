// MIL-1 „Krieg als Vorgang“ (VERBESSERUNGSPLAN_2026-09-30): der Konfliktvorgang in sechs Zuständen.
//   spannung → drohkulisse → beschluss → krieg → waffenruhe → frieden  (+ beendet per Rückzug/Niederlage)
//
// Verbindliche Designentscheidung: Der Präsident bestellt und verantwortet, er kommandiert nicht.
// Es gibt keine Taktik. Die Eskalationsphase ist die Hauptspielfläche; der Verlauf ist eine abstrakte
// Frontlage (0–100) mit Trend und eine Erschöpfungsuhr pro Seite, kein Schlachtfeld.
//
// Blaupausen:
//   - RECHERCHE_SUZERAIN_KRIEGSMATRIX.md §9 (Zustandsfolge, Doktrin-Passung als UND-Paarung, Folge-Tabellen,
//     Friedens-Innenpreis inkl. „freie Presse verteuert Frieden“, Gebietshingabe = Putsch-Risiko)
//   - RECHERCHE_VERTIEFUNG_KRIEG.md: Vic3-Phasen (Spannung/Drohkulisse/Beschluss/Verlauf/Frieden),
//     War-Support-Erschöpfungsuhr mit Wochen-Tabelle, Anti-Aussitzen-Regel, Demobilisierungs-Rechnung (90 Tage),
//     Civ6-Rahmung (die Kriegsbegründung legt die Preise der Folgehandlungen fest)
//
// Alle Zahlen sind Spielparameter (Platzhalter der Kalibrierung), keine Tatsachenbehauptungen.

import { kriegspreisBeginn, kriegspreisWoche } from "./kriegspreis";
import { NET } from "./modell";
import { nationalAverage } from "./netz";
import { wirke, vertrauenAendern } from "./wirkung";
import { addLog } from "./log";
import { clamp } from "./economy";
import { addDays, formatDateDe } from "./dates";
import { LAENDER, land, landAendern, vertrauenZu, weltZustand } from "./laender";
import { alleLaufenden } from "./abkommen";
import {
  GEGNER_GRUPPE,
  GEGNER_STAERKE,
  KOALITION,
  koalitionAufloesen,
  koalitionRufen,
  koalitionWoche,
  koalitionenBeiKriegsbeginn,
  koalitionsFaktoren,
  lastTeilung,
  paketBlockade,
} from "./pakte";
import { akteurName as landNameVon } from "./welt-modell";
import { stimmenSicht } from "./handeln";
import { oeffne } from "./ereignisse";
import { kosten } from "./ereignis-hilfen";
import { kannZahlen } from "./kapital";
import { VERFASSUNG, AUFMERKSAMKEIT_KOSTEN, belastungEreignis, neuanfangGrund, verbrauche } from "./aufmerksamkeit";
import { Rng } from "./rng";
import type { World } from "./types";
import { aktuelleSprache, t } from "../i18n";
import { bestandsFaktor, streitkraefteMonat } from "./streitkraefte";
import { STANDARD_ZIEL, ZIELRAEUME, type Zielraum } from "../data/streitkraefte";
import type { FriedensPaket, KriegPhase, KriegVorgang, KriegsRahmung, Mobilmachung } from "./krieg-typen";
import { besatzungNachFrieden, eigenerBestandsFaktor, gegnerBestand, gegnerBestandsFaktor, kriegsFaktoren, kriegsschauplatzMonat, regionenSetzen, schauplatzWoche, zielGeaendert } from "./kriegsschauplatz";

/** Spielparameter, keine Tatsachen: alle Schwellen, Kosten und Faktoren des Konfliktvorgangs (Kalibrierung). */
export const KRIEG = {
  /** Höchstens so viele aktive Konfliktvorgänge gleichzeitig (spannung bis waffenruhe) */
  maxAktiv: 2,
  /** Ab dieser Konflikt-Dimension eines Landes entsteht ein Spannungs-Vorgang (Monatsprüfung); knapp unter der Kriegsgefahr-Krise (75) */
  anlageAb: 73,
  /** Abkühlung, bevor mit demselben Land erneut eine Spannung entsteht (Tage) */
  anlageAbkuehlung: 300,
  /** Eskalation für den Übergang spannung → drohkulisse */
  drohkulisseAb: 78,
  /** Darunter löst sich eine Drohkulisse wieder zur Spannung auf */
  drohkulisseAus: 45,
  /** Darunter verfliegt eine Spannung ganz (Vorgang endet still) */
  spannungAus: 22,
  /** Ab dieser Eskalation schlägt der Gegner zu (defensiver Krieg ohne eigenen Beschluss) */
  angriffAb: 95,
  /** Tage bis zur Parlamentsabstimmung über den Einsatzbeschluss */
  beschlussTage: 7,
  /** Frontlage: Faktor und Wochen-Maximum der Bewegung */
  frontFaktor: 0.16,
  frontMaxDelta: 5,
  /** Frontlage, ab der die eigene bzw. gegnerische Seite zusammenbricht */
  zusammenbruchFront: 2,
  siegFront: 96,
  /** Erschöpfungsuhr: Basisabfluss je Woche, Treiber je Verlustpunkt, Gewinn-Dämpfung, Zusatzlast Vollmobilisierung */
  uhrBasis: 0.5,
  uhrVerlust: 1.6,
  uhrGewinn: 1.1,
  uhrVollLast: 0.35,
  /** Uhr-Stand, bei dem eine Seite kapituliert (Anti-Aussitzen: nur erreichbar, wenn das Kriegsziel kontrolliert ist) */
  kapitulation: 100,
  /** Frontlage-Schwelle für die Halbkontrolle des Kriegsziels (Anti-Aussitzen-Floor) */
  kontrolleFront: 34,
  /** Gegner bietet Waffenruhe an, wenn seine Uhr darunter fällt */
  angebotUhr: 35,
  /** Kipppunkte der Frontlage für Hinweise (Klasse B) */
  kippUnten: 35,
  kippOben: 65,
  /** Verlustpunkte je Woche je Frontpunkt Rückzug; Verschleiß auch im Stillstand */
  verlustFaktor: 0.8,
  verschleiss: 0.15,
  /** Demobilisierung: Tage Auslauf und Sperre für erneute Mobilisierung (Vic3: 90 Tage) */
  demobTage: 90,
  /** Demobilisierungs-Rechnung je Monat im Auslauf, in % des BIP */
  demobKostenMonat: 0.04,
  /** Niederlage: Offiziersvertrauen unter dieser Marke nach Gebietsabtretung/Niederlage löst das Putsch-Risiko-Ereignis aus */
  putschAb: 35,
} as const;

/**
 * Wie weit ein Gegner selbst auf türkisches Gebiet vorstoßen kann, als Faktor auf seine Gegenstöße unter Frontlage 50 (Spielparameter):
 * Griechenland und Zypern verteidigen Inseln über das Meer hinweg; ein Vorstoß nach Anatolien liegt außerhalb ihrer Mittel. Je tiefer die Front fällt,
 * desto weiter liegt das Ziel ihres Gegenstoßes im Landesinneren: Scheitert der Angriff, endet er eher im Patt und in der Erschöpfung
 * als im Zusammenbruch der Front.
 */
export const GEGNER_OFFENSIVE: Record<string, number> = { GRC: 0.45, CYP: 0.2 };

export const PHASEN_NAME: Record<KriegPhase, string> = {
  get spannung() { return t("krieg.k.phase.spannung"); },
  get drohkulisse() { return t("krieg.k.phase.drohkulisse"); },
  get beschluss() { return t("krieg.k.phase.beschluss"); },
  get krieg() { return t("krieg.k.phase.krieg"); },
  get waffenruhe() { return t("krieg.k.phase.waffenruhe"); },
  get frieden() { return t("krieg.k.phase.frieden"); },
  get beendet() { return t("krieg.k.phase.beendet"); },
};

/** Civ6-Preisschild: Die Rahmung legt die Preise der Folgehandlungen fest (Parlament, Welt, Wähler). */
export const RAHMUNG: Record<KriegsRahmung, { name: string; text: string; stimmen: number; ansehen: number; uhrStart: number; nationalisten: number }> = {
  verteidigung: {
    get name() { return t("krieg.k.rahmung.verteidigung.name"); },
    get text() { return t("krieg.k.rahmung.verteidigung.text"); },
    stimmen: 30,
    ansehen: -1,
    uhrStart: 8,
    nationalisten: 2,
  },
  schutz: {
    get name() { return t("krieg.k.rahmung.schutz.name"); },
    get text() { return t("krieg.k.rahmung.schutz.text"); },
    stimmen: 12,
    ansehen: -3,
    uhrStart: 0,
    nationalisten: 1,
  },
  beistand: {
    get name() { return t("krieg.k.rahmung.beistand.name"); },
    get text() { return t("krieg.k.rahmung.beistand.text"); },
    stimmen: 20,
    ansehen: -1,
    uhrStart: 4,
    nationalisten: 1,
  },
  revision: {
    get name() { return t("krieg.k.rahmung.revision.name"); },
    get text() { return t("krieg.k.rahmung.revision.text"); },
    stimmen: -25,
    ansehen: -6,
    uhrStart: -10,
    nationalisten: 4,
  },
};

/** Der Ländername für einen Satz: im Deutschen in der Fallform (Akkusativ, Dativ mit Artikel), in den übrigen Sprachen der Name. */
function lf(l: { name: string; akk: string; dat: string }, fall: "akk" | "dat"): string {
  return aktuelleSprache() === "de" ? l[fall] : l.name;
}

// Die Stärketabellen (Gegner, Partner) stehen in sim/pakte.ts, damit Gegner und Koalitionspartner dieselbe Waage haben.

/** Drittländer-Ausstrahlung bei Kriegsbeginn: Rivalen des Gegners rücken näher (Spielparameter). */
const AUSSTRAHLUNG_RIVALEN: Record<string, Record<string, number>> = {
  RUS: { UKR: 4 }, GRC: { CYP: 3 }, ISR: { SAU: 2 }, IRN: { SAU: 3 }, ARM: { AZE: 4 }, AZE: { ARM: 4 },
};

// ---------------------------------------------------------------------------
// Zustand (Migration: ältere Spielstände haben kein Krieg-Feld — dann gibt es keinen Konflikt)

export function kriege(w: World): KriegVorgang[] {
  const spiel = w.spiel;
  if (!spiel) return [];
  spiel.kriege ??= [];
  return spiel.kriege;
}

/** Vorgänge, die für die Obergrenze (2) und die Anzeige zählen. */
export function aktiveKriege(w: World): KriegVorgang[] {
  return kriege(w).filter((k) => k.phase !== "frieden" && k.phase !== "beendet");
}

export function kriegMit(w: World, landId: string): KriegVorgang | undefined {
  return kriege(w).find((k) => k.land === landId && k.phase !== "beendet");
}

export function kriegZu(w: World, kriegId: string): KriegVorgang | undefined {
  return kriege(w).find((k) => k.id === kriegId);
}

/** Früheste Demobilisierungs-Sperre aller Vorgänge (Tag); 0, wenn keine läuft. */
export function demobSperreBis(w: World): number {
  return kriege(w).reduce((s, k) => Math.max(s, k.demobSperreBis ?? 0), 0);
}

// ---------------------------------------------------------------------------
// Doktrin-Passung (Suzerain-Konsistenz-Regel: UND-gepaart, Mischen verwässert)

interface DoktrinProfil {
  name: string;
  /** Kernpaarung: Alle müssen erfüllt sein, sonst verwässert die Linie (zählen doppelt) */
  kern: [knoten: string, min: number][];
  stuetze: [knoten: string, min: number][];
}

const DOKTRIN_PROFILE: Record<string, DoktrinProfil> = {
  doktrin_drohnen: {
    get name() { return t("krieg.k.doktrin.drohnen"); },
    kern: [
      ["modernisierung", 55],
      ["bereitschaft_luft", 55],
    ],
    stuetze: [
      ["ruestungsautarkie", 55],
      ["truppenmoral", 50],
    ],
  },
  doktrin_luftverteidigung: {
    get name() { return t("krieg.k.doktrin.luftverteidigung"); },
    kern: [
      ["bereitschaft_luft", 58],
      ["abschreckung", 55],
    ],
    stuetze: [
      ["ruestungsautarkie", 50],
      ["modernisierung", 45],
    ],
  },
  doktrin_autonomie: {
    get name() { return t("krieg.k.doktrin.autonomie"); },
    kern: [
      ["ruestungsautarkie", 58],
      ["bereitschaft_heer", 55],
    ],
    stuetze: [
      ["modernisierung", 50],
      ["truppenmoral", 50],
    ],
  },
};

export interface DoktrinPassung {
  doktrin: string | null;
  name: string | null;
  /** Erfüllte Gliederanteile (Kern doppelt gewichtet), 0 bis 1 */
  passung: number;
  /** Alle Kernglieder erfüllt: die Linie trägt (Suzerain: „follow one doctrine consistently“) */
  konsistent: boolean;
  /** Multiplikator auf die eigene Stärke; konsistent liegt immer über jeder Mischung */
  faktor: number;
  /** Namen der fehlenden Kernglieder (für die ehrliche Anzeige) */
  fehlt: string[];
}

function knotenWert(w: World, id: string): number {
  return nationalAverage(NET, w.net, id);
}

function knotenName(id: string): string {
  const i = NET.index.get(id);
  return i === undefined ? id : NET.nodes[i]!.name;
}

/** Wie gut die gewählte Doktrin und die Vorbereitung zusammenpassen (UND-Paarung, kein Punktesammeln). */
export function doktrinPassung(w: World): DoktrinPassung {
  const bestand = w.spiel?.reich?.bestand ?? {};
  const doktrin = Object.keys(DOKTRIN_PROFILE).find((id) => bestand[id]) ?? null;
  if (!doktrin) return { doktrin: null, name: null, passung: 0, konsistent: false, faktor: 1, fehlt: [] };
  const profil = DOKTRIN_PROFILE[doktrin]!;
  const kernOk = profil.kern.filter(([id, min]) => knotenWert(w, id) >= min);
  const stuetzeOk = profil.stuetze.filter(([id, min]) => knotenWert(w, id) >= min);
  const passung = (kernOk.length * 2 + stuetzeOk.length) / (profil.kern.length * 2 + profil.stuetze.length);
  const konsistent = kernOk.length === profil.kern.length;
  const faktor = konsistent ? 1.18 + 0.12 * (stuetzeOk.length / profil.stuetze.length) : 0.72 + 0.38 * passung;
  const fehlt = profil.kern.filter(([id, min]) => knotenWert(w, id) < min).map(([id, min]) => t("krieg.k.doktrin.mindestens", { knoten: knotenName(id), min }));
  return { doktrin, name: profil.name, passung, konsistent, faktor, fehlt };
}

// ---------------------------------------------------------------------------
// Stärke und Lagebild

/**
 * Die eigene Kriegsstärke: Bereitschaft der Teilstreitkräfte, getragen von Moral,
 * multipliziert mit Doktrin-Passung UND Mobilisierung (konsistente Vorbereitung zahlt
 * multiplikativ ein, gemischte verwässert), Nachschub aus Wirtschaftsverkehr (Logistik/Export)
 * und die Koalition: Partner an der Seite der Türkei tragen je nach Waage, Einsatz und verbleibender Kampfkraft bei (sim/pakte.ts;
 * ersetzt die frühere Pauschale „Beistands-Klausel gibt höchstens +15 Prozent“).
 */
export function eigenStaerke(w: World, k: KriegVorgang): number {
  const b = knotenWert(w, "bereitschaft_heer") * 0.45 + knotenWert(w, "bereitschaft_luft") * 0.35 + knotenWert(w, "bereitschaft_see") * 0.2;
  const moral = 0.65 + 0.35 * (knotenWert(w, "truppenmoral") / 100);
  const dok = doktrinPassung(w).faktor;
  const mob = ([0.55, 0.85, 1.08] as const)[k.mobilmachung] + (k.bereit ? 0.06 : 0);
  const nachschub = clamp(0.72 + 0.0035 * (knotenWert(w, "logistik") - 50) + 0.0025 * (knotenWert(w, "export") - 50), 0.6, 1.1);
  const allianz = 1 + koalitionsFaktoren(w, k).eigenPlus;
  // Bestand und Technik der Streitkräfte (sim/streitkraefte.ts; 1 = Stand 2026); mit gewählter Einsatzart zählen ihre tragenden Gattungen,
  // der Generationsabstand zum Gegner und die Munition (sim/kriegsschauplatz.ts)
  return b * moral * dok * mob * nachschub * allianz * (eigenerBestandsFaktor(w, k) ?? bestandsFaktor(w));
}

/** Die vermutete Stärke des Gegners; steigt leicht mit der Eskalation (der Gegner rüstet mit) und mit seinen Koalitionspartnern. */
export function gegnerStaerke(w: World, landId: string): number {
  const l = land(landId);
  const k = kriegMit(w, landId);
  const basis = GEGNER_STAERKE[landId] ?? GEGNER_GRUPPE[l.gruppe] ?? 50;
  // Der Zielraum bestimmt, wie viel Gegenwehr das Ziel kostet (Grenzstreifen leichter als ein tiefer Vorstoß)
  const ziel = k ? zielraumVon(k) : STANDARD_ZIEL;
  // Sein Bestand (Menge und Generation der Gattungen, gegen die gekämpft wird) zehrt sich im Krieg auf (sim/kriegsschauplatz.ts)
  const bestand = k ? gegnerBestandsFaktor(w, k) : 1;
  return (basis + (k ? k.eskalation * 0.08 + koalitionsFaktoren(w, k).gegnerPlus : 0)) * ziel.schwierigkeit * bestand;
}

/** Wie gut das Lagebild über den Gegner ist (LERNKONZEPT: ehrlich über Unsicherheit). */
export function lagebild(w: World): { stufe: "bekannt" | "vermutet" | "unsicher"; text: string } {
  const a = knotenWert(w, "abschreckung");
  if (a >= 60) return { stufe: "bekannt", text: t("krieg.k.lage.bekannt") };
  if (a >= 40) return { stufe: "vermutet", text: t("krieg.k.lage.vermutet") };
  return { stufe: "unsicher", text: t("krieg.k.lage.unsicher") };
}

// ---------------------------------------------------------------------------
// Friedenspreise (Innenpreis-Liste; freie Presse verteuert den Frieden)

/**
 * Medien-Faktor auf den innenpolitischen Preis des Friedens (Suzerain: PO −3 zensiert bis −8 frei).
 * Freie Presse macht Reparationen und Abtretungen sichtbar und damit teurer.
 */
export function presseFaktor(w: World): number {
  return 0.55 + 0.9 * (knotenWert(w, "pressefreiheit") / 100);
}

/** Der Zustimmungsverlust (Umfragepunkte), den ein Friedenspreis von `basis` nach Presse-Lage kostet. */
export function poVerlustFuer(w: World, basis: number): number {
  return Math.round(basis * presseFaktor(w) * 10) / 10;
}

/** Die Härte eines Pakets aus Sicht des Gegners (negativ = Zugeständnis an ihn). */
function paketHaerte(p: FriedensPaket): number {
  return p.gebiet * 1.1 + p.reparation * 0.7 + (p.garantien ? 0.15 : 0) + (p.rueckzug ? -0.15 : 0);
}

/** Annahme-Aussicht eines Friedenspakets in Prozent (deterministisch; die Uhr beider Seiten treibt sie). */
export function paketAnnahme(w: World, k: KriegVorgang, p: FriedensPaket): number {
  const hart = p.gebiet === 1 || p.reparation === 1;
  // Die Partner des Gegners blockieren harte Pakete, solange sie Kampfkraft haben (sim/pakte.ts)
  const roh = 40 + (100 - k.uhrGegner) * 0.55 - (100 - k.uhr) * 0.25 + (k.front - 50) * 0.7 - paketHaerte(p) * 22 - paketBlockade(w, k, hart);
  return Math.round(clamp(roh, 5, 98));
}

export const PAKETE: Record<string, { name: string; text: string; paket: (front: number) => FriedensPaket }> = {
  paket_sieg: {
    get name() { return t("krieg.k.paket.paket_sieg"); },
    get text() { return t("wort.krieg.paket_sieg"); },
    paket: () => ({ gebiet: 1, reparation: 1, garantien: true, rueckzug: false }),
  },
  paket_ausgewogen: {
    get name() { return t("krieg.k.paket.paket_ausgewogen"); },
    get text() { return t("krieg.k.paket.paket_ausgewogen.text"); },
    paket: () => ({ gebiet: 0, reparation: 0, garantien: true, rueckzug: true }),
  },
  paket_weiss: {
    get name() { return t("krieg.k.paket.paket_weiss"); },
    get text() { return t("krieg.k.paket.paket_weiss.text"); },
    paket: () => ({ gebiet: 0, reparation: 0, garantien: false, rueckzug: true }),
  },
  paket_zugestaendnis: {
    get name() { return t("krieg.k.paket.paket_zugestaendnis"); },
    get text() { return t("wort.krieg.paket_zugestaendnis"); },
    paket: () => ({ gebiet: -1, reparation: -1, garantien: false, rueckzug: true }),
  },
};

// ---------------------------------------------------------------------------
// Handlungen des Präsidenten (bestellen und verantworten — nicht kommandieren)

export type KriegHandlungId =
  | "bereitschaft"
  | "signal"
  | "vermittlung"
  | `ziel_${KriegsRahmung}`
  | "deeskalation"
  | "mobil_teil"
  | "mobil_voll"
  | "beschluss"
  | "beschluss_erlass"
  | "verstaerkung"
  | "koalition_rufen"
  | "waffenruhe"
  | keyof typeof PAKETE
  | "weiterkaempfen"
  | "rueckzug";

export interface KriegHandlungSicht {
  id: KriegHandlungId;
  label: string;
  pk: number;
  moeglich: boolean;
  /** Warum es gerade nicht geht (oder was es konkret kostet und bringt) */
  grund?: string;
  hinweis: string;
}


function demobGrund(w: World): string | undefined {
  const bis = demobSperreBis(w);
  if (bis <= w.day) return undefined;
  return t("krieg.k.demob.grund", { datum: formatDateDe(addDays(w.date, bis - w.day)) });
}

/** Alle Handlungen, die der Konfliktvorgang in der aktuellen Phase anbietet — mit Preisen und ehrlichen Gründen. */
export function handlungenFuer(w: World, kriegId: string): KriegHandlungSicht[] {
  const spiel = w.spiel;
  const k = kriegZu(w, kriegId);
  if (!spiel || !k) return [];
  const l = land(k.land);
  const kapital = spiel.kapital;
  const out: KriegHandlungSicht[] = [];
  const push = (id: KriegHandlungId, label: string, pk: number, hinweis: string, grund?: string) => {
    let g = grund;
    if (!g && !kannZahlen(kapital, pk)) g = t("krieg.k.kapital");
    out.push({ id, label, pk, moeglich: !g, ...(g ? { grund: g } : {}), hinweis });
  };
  const demob = demobGrund(w);
  const ph = k.phase;

  if (ph === "spannung" || ph === "drohkulisse") {
    if (!k.bereit) push("bereitschaft", t("krieg.k.h.bereitschaft"), 6, t("krieg.k.h.bereitschaft.hinweis"));
    const signalRest = (k.signalZuletzt ?? -1e9) + 60 - w.day;
    push("signal", t("krieg.k.h.signal"), 3, t("krieg.k.h.signal.hinweis"), signalRest > 0 ? t("krieg.k.h.signal.rest", { tage: signalRest }) : undefined);
    push("vermittlung", t("krieg.k.h.vermittlung"), 5, t("krieg.k.h.vermittlung.hinweis", { ansehen: Math.round(knotenWert(w, "ansehen")), vertrauen: Math.round(vertrauenZu(w, k.land)) }));
    if (!k.kriegszielDeklariert) {
      for (const r of ["verteidigung", "schutz", "beistand", "revision"] as const) {
        const beleg = r === "beistand" && alleLaufenden(w).every((v) => v.land !== k.land) ? t("krieg.k.h.ziel.beleg") : undefined;
        push(`ziel_${r}`, t("krieg.k.h.ziel", { rahmung: RAHMUNG[r].name }), 8, t("krieg.k.h.ziel.hinweis", { text: RAHMUNG[r].text, stimmen: `${RAHMUNG[r].stimmen >= 0 ? "+" : ""}${RAHMUNG[r].stimmen}`, ansehen: RAHMUNG[r].ansehen }), beleg);
      }
    }
    push("deeskalation", t("krieg.k.h.deeskalation"), 4, t("krieg.k.h.deeskalation.hinweis"));
    push("rueckzug", t("krieg.k.h.rueckzug"), 6, t("krieg.k.h.rueckzug.hinweis"));
  }
  if (ph === "drohkulisse") {
    if (k.mobilmachung === 0) push("mobil_teil", t("krieg.k.h.mobil_teil"), 8, t("krieg.k.h.mobil_teil.hinweis"), demob);
    if (k.mobilmachung < 2) push("mobil_voll", t("krieg.k.h.mobil_voll"), 14, t("krieg.k.h.mobil_voll.hinweis"), demob);
    if (!k.kriegszielDeklariert) {
      // Ohne deklariertes Kriegsziel kein Beschluss: Die Rahmung ist Pflicht (Civ6-Preisschild).
    } else {
      const stimmen = stimmenSicht(w, { massnahme: "m_verteidigung", richtung: 1 }).erwartet + RAHMUNG[k.rahmung!].stimmen;
      push("beschluss", t("krieg.k.h.beschluss"), 10, t("krieg.k.h.beschluss.hinweis", { tage: KRIEG.beschlussTage, stimmen: Math.round(stimmen) }));
      push("beschluss_erlass", t("krieg.k.h.erlass"), 20, t("krieg.k.h.erlass.hinweis"));
    }
  }
  if (ph === "beschluss" && k.beschluss?.weg === "parlament") {
    // Warten auf die Abstimmung; ein Rückzug des Beschlusses wäre ein Gesichtsverlust — bewusst nicht angeboten (v1).
  }
  if (ph === "krieg") {
    const rest = (k.verstaerkungZuletzt ?? -1e9) + 21 - w.day;
    push("verstaerkung", t("krieg.k.h.verstaerkung"), 6, t("krieg.k.h.verstaerkung.hinweis"), rest > 0 ? t("krieg.k.h.wieder", { tage: rest }) : undefined);
    const ko = k.koalition;
    const zoegernde = ko ? ko.abwesend.filter((a) => a.seite === "eigen" && a.zoegert).length : 0;
    const rufRest = (ko?.gerufen ?? -1e9) + KOALITION.rufTage - w.day;
    if (zoegernde > 0 || (ko?.abwesend.some((a) => a.seite === "eigen") ?? false)) {
      push(
        "koalition_rufen",
        t("krieg.k.h.koalition"),
        6,
        t("krieg.k.h.koalition.hinweis", { n: zoegernde, bonus: KOALITION.rufBonus }),
        rufRest > 0 ? t("krieg.k.h.koalition.rest", { tage: rufRest }) : zoegernde === 0 ? t("krieg.k.h.koalition.niemand") : undefined,
      );
    }
    push("waffenruhe", t("krieg.k.h.waffenruhe"), 5, t("krieg.k.h.waffenruhe.hinweis"));
    if (k.mobilmachung < 2) push("mobil_voll", t("krieg.k.h.mobil_nach"), 14, t("krieg.k.h.mobil_nach.hinweis"), demob);
  }
  if (ph === "waffenruhe") {
    for (const [id, def] of Object.entries(PAKETE)) {
      if (id === "paket_sieg" && k.front < 55) continue;
      if (id === "paket_zugestaendnis" && k.front > 45) continue;
      const p = def.paket(k.front);
      const aussicht = paketAnnahme(w, k, p);
      push(id as KriegHandlungId, t("krieg.k.h.paket", { name: def.name }), 4, t("krieg.k.h.paket.hinweis", { text: def.text, aussicht }));
    }
    push("weiterkaempfen", t("krieg.k.h.weiter"), 2, t("krieg.k.h.weiter.hinweis"));
  }
  return out;
}

// ---------------------------------------------------------------------------
// Ausführung

export interface Ergebnis {
  ok: boolean;
  text: string;
  why?: string;
}

function phaseSetzen(w: World, k: KriegVorgang, phase: KriegPhase): void {
  k.phase = phase;
  k.seit = w.day;
}

function hinweis(w: World, id: string, titel: string, text: string[]): void {
  w.spiel?.hinweise.push({ id, titel, szene: "istanbul", text });
}

/** Führt eine Handlung aus; was `handlungenFuer` als unmöglich meldet, wird nicht ausgeführt. */
export function fuehreKriegHandlungAus(w: World, kriegId: string, handlungId: KriegHandlungId, rng?: Rng): Ergebnis {
  const spiel = w.spiel;
  const k = kriegZu(w, kriegId);
  if (!spiel) return { ok: false, text: t("krieg.k.x.keinspiel") };
  if (!k) return { ok: false, text: t("krieg.k.x.weg") };
  const sicht = handlungenFuer(w, kriegId).find((x) => x.id === handlungId);
  if (!sicht) return { ok: false, text: t("krieg.k.x.phase") };
  if (!sicht.moeglich) return { ok: false, text: sicht.grund ?? t("krieg.k.x.nicht") };
  const pause = neuanfangGrund(w);
  if (pause) return { ok: false, text: pause };
  // Ohne übergebenen Zufall: deterministisch aus dem Weltzustand würfeln (Oberfläche, Parser)
  if (!rng) {
    rng = new Rng(w.rngState);
    w.rngState = (w.rngState + 1) | 0;
  }
  const l = land(k.land);
  spiel.kapital -= sicht.pk;
  verbrauche(w, AUFMERKSAMKEIT_KOSTEN.landAktion.entspannen, `${sicht.label}: ${l.name}`);

  let text = "";
  let why = t("krieg.k.x.kostet", { pk: sicht.pk });
  switch (handlungId) {
    case "bereitschaft": {
      k.bereit = true;
      k.eskalation = clamp(k.eskalation + 4, 0, 100);
      wirke(w, "abschreckung", 3);
      landAendern(w, k.land, { konflikt: 2 }, t("krieg.k.h.bereitschaft"));
      text = t("krieg.k.x.bereitschaft", { land: l.name });
      why += " " + t("krieg.k.x.bereitschaft.warum");
      break;
    }
    case "signal": {
      k.signalZuletzt = w.day;
      wirke(w, "abschreckung", 2);
      landAendern(w, k.land, { konflikt: -3 }, t("krieg.k.x.signal.notiz"));
      k.eskalation = clamp(k.eskalation - 4, 0, 100);
      text = t("krieg.k.x.signal", { land: lf(l, "akk") });
      break;
    }
    case "vermittlung": {
      const aussicht = clamp(30 + (knotenWert(w, "ansehen") - 45) * 0.8 + (vertrauenZu(w, k.land) - 35) * 0.6 - (k.eskalation - 50) * 0.4, 5, 85);
      const zufall = rng ? rng.next() * 100 : 50;
      if (zufall < aussicht) {
        k.eskalation = clamp(k.eskalation - 18, 0, 100);
        landAendern(w, k.land, { konflikt: -8, vertrauen: 3 }, t("krieg.k.x.vermittlung.notiz"));
        wirke(w, "ansehen", 2);
        text = t("krieg.k.x.vermittlung.ok", { land: lf(l, "dat") });
        why += " " + t("krieg.k.x.vermittlung.ok.warum", { aussicht: Math.round(aussicht) });
      } else {
        landAendern(w, k.land, { vertrauen: -2 });
        wirke(w, "ansehen", -1);
        text = t("krieg.k.x.vermittlung.nein", { land: lf(l, "dat") });
        why += " " + t("krieg.k.x.vermittlung.nein.warum", { aussicht: Math.round(aussicht) });
      }
      break;
    }
    case "ziel_verteidigung":
    case "ziel_schutz":
    case "ziel_beistand":
    case "ziel_revision": {
      const r = handlungId.slice(5) as KriegsRahmung;
      k.rahmung = r;
      k.kriegszielDeklariert = true;
      k.eskalation = clamp(k.eskalation + 10, 0, 100);
      let extra = 0;
      if (r === "beistand" && alleLaufenden(w).every((v) => v.land !== k.land)) extra = -3;
      if (r === "verteidigung" && k.eskalation < 60) extra = -2;
      wirke(w, "ansehen", RAHMUNG[r].ansehen + extra);
      wirke(w, "nationalisten", RAHMUNG[r].nationalisten);
      if (r === "revision") {
        wirke(w, "beziehungen_eu", -4);
        landAendern(w, "EU", { konflikt: 6, vertrauen: -4 }, t("krieg.k.x.revision.notiz"));
      }
      text = t("krieg.k.x.ziel", { land: lf(l, "dat"), rahmung: RAHMUNG[r].name });
      why += " " + t("krieg.k.x.ziel.warum", { stimmen: `${RAHMUNG[r].stimmen >= 0 ? "+" : ""}${RAHMUNG[r].stimmen}` }) + (extra ? " " + t("krieg.k.x.ziel.duenn") : "");
      break;
    }
    case "deeskalation": {
      landAendern(w, k.land, { konflikt: -10 }, t("krieg.k.x.deesk.notiz"));
      k.eskalation = clamp(k.eskalation - 12, 0, 100);
      wirke(w, "nationalisten", -1);
      wirke(w, "staedtische_saekulare", 1);
      text = t("krieg.k.x.deesk", { land: lf(l, "dat") });
      why += " " + t("krieg.k.x.deesk.warum");
      break;
    }
    case "rueckzug": {
      landAendern(w, k.land, { konflikt: -15, vertrauen: 4 }, t("krieg.k.x.rueckzug.notiz"));
      wirke(w, "ansehen", -2);
      wirke(w, "nationalisten", -3);
      beendeVorgang(w, k, "rueckzug");
      text = t("krieg.k.x.rueckzug", { land: lf(l, "dat") });
      why += " " + t("krieg.k.x.rueckzug.warum");
      break;
    }
    case "mobil_teil":
    case "mobil_voll": {
      const voll = handlungId === "mobil_voll";
      k.mobilmachung = (voll ? 2 : 1) as Mobilmachung;
      k.eskalation = clamp(k.eskalation + (voll ? 14 : 8), 0, 100);
      kosten(w, voll ? 0.7 : 0.3);
      wirke(w, "junge", voll ? -3 : -1);
      wirke(w, "nationalisten", voll ? 2 : 1);
      if (voll) {
        wirke(w, "staedtische_saekulare", -2);
        wirke(w, "konservative", 1);
        k.uhr = clamp(k.uhr - 5, 0, 110);
      }
      belastungEreignis(w, VERFASSUNG.eskalation, t(voll ? "krieg.k.x.voll" : "krieg.k.x.teil"));
      text = t(voll ? "krieg.k.x.voll.text" : "krieg.k.x.teil.text");
      why += " " + t("krieg.k.x.mobil.warum", { bip: voll ? 0.7 : 0.3 });
      break;
    }
    case "beschluss": {
      k.beschluss = { weg: "parlament", abstimmung: w.day + KRIEG.beschlussTage, rahmung: k.rahmung! };
      phaseSetzen(w, k, "beschluss");
      text = t("krieg.k.x.beschluss", { land: lf(l, "akk"), tage: KRIEG.beschlussTage });
      why += " " + t("krieg.k.x.beschluss.warum");
      break;
    }
    case "beschluss_erlass": {
      vertrauenAendern(w, -3);
      wirke(w, "legitimitaet", -2.5);
      k.beschluss = { weg: "erlass", abstimmung: w.day, rahmung: k.rahmung! };
      text = t("krieg.k.x.erlass", { land: lf(l, "akk") });
      why += " " + t("krieg.k.x.erlass.warum");
      addLog(w, "entscheidung", text, why);
      kriegsbeginn(w, k, "erlass");
      return { ok: true, text, why };
    }
    case "verstaerkung": {
      k.verstaerkungZuletzt = w.day;
      k.frontSchub = (k.frontSchub ?? 0) + 3;
      kosten(w, 0.25);
      text = t("krieg.k.x.verstaerkung");
      break;
    }
    case "koalition_rufen": {
      const { neu, abgelehnt } = koalitionRufen(w, k);
      if (neu.length > 0) {
        text = t("krieg.k.x.koalition.ja", { laender: neu.map((p) => landNameVon(p.id)).join(", ") });
        why += " " + t("krieg.k.x.koalition.ja.warum") + " " + (abgelehnt.length ? t("krieg.k.x.koalition.ab", { laender: abgelehnt.map(landNameVon).join(", ") }) : t("krieg.k.x.koalition.niemand"));
      } else {
        text = t("krieg.k.x.koalition.nein");
        why += abgelehnt.length ? " " + t("krieg.k.x.koalition.uebel", { laender: abgelehnt.map(landNameVon).join(", ") }) : "";
      }
      break;
    }
    case "waffenruhe": {
      if (k.uhrGegner <= 55 || k.front >= 62 || k.uhr <= 40) {
        text = t("krieg.k.x.waffenruhe.ja", { land: l.name });
        addLog(w, "entscheidung", text, why);
        waffenruheEintreten(w, k);
        return { ok: true, text, why };
      }
      k.uhr = clamp(k.uhr - 3, 0, 110);
      k.eskalation = clamp(k.eskalation + 2, 0, 100);
      text = t("krieg.k.x.waffenruhe.nein", { land: l.name });
      why += " " + t("krieg.k.x.waffenruhe.nein.warum");
      break;
    }
    case "paket_sieg":
    case "paket_ausgewogen":
    case "paket_weiss":
    case "paket_zugestaendnis": {
      const p = PAKETE[handlungId]!.paket(k.front);
      const aussicht = paketAnnahme(w, k, p);
      if (aussicht >= 50) return friedenSchliessen(w, k, p, handlungId, rng);
      k.eskalation = clamp(k.eskalation + 2, 0, 100);
      text = t("krieg.k.x.paket.nein", { land: l.name, aussicht });
      why += " " + t("krieg.k.x.paket.nein.warum");
      break;
    }
    case "weiterkaempfen": {
      k.uhr = clamp(k.uhr - 5, 0, 110);
      k.gegnerAngebot = false;
      phaseSetzen(w, k, "krieg");
      text = t("krieg.k.x.weiter");
      break;
    }
  }
  addLog(w, "entscheidung", text, why);
  return { ok: true, text, why };
}

// ---------------------------------------------------------------------------
// Phasenübergänge und Folgen

/** Der Gegner kontrolliert das Kriegsziel, wenn die Front tief genug steht (Anti-Aussitzen-Schwelle). */
function gegnerKontrolle(k: KriegVorgang): number {
  return k.front >= 50 ? 0 : clamp((50 - k.front) / (50 - KRIEG.kontrolleFront), 0, 1);
}
function eigenKontrolle(k: KriegVorgang): number {
  return k.front <= 50 ? 0 : clamp((k.front - 50) / (100 - KRIEG.kippOben - 1), 0, 1);
}

function waffenruheEintreten(w: World, k: KriegVorgang): void {
  const l = land(k.land);
  phaseSetzen(w, k, "waffenruhe");
  k.gegnerAngebot = false;
  hinweis(w, `krieg-waffenruhe-${k.id}-${w.day}`, t("krieg.k.wr.titel", { land: l.name }), [t("krieg.k.wr.text1", { land: l.name }), t("krieg.k.wr.text2")]);
  addLog(w, "ereignis", t("krieg.k.wr.log", { land: l.name }), t("krieg.k.wr.warum"));
}

/**
 * Beistandsruf: Ein Pakt-Partner der Türkei wurde angegriffen und die Türkei sagt militärischen Beistand zu (Ereignis krieg_beistandsruf).
 * Es entsteht ein Konfliktvorgang in der Drohkulisse, die Rahmung „Beistand“ ist deklariert (der Pakt ist der Beleg), der Partner steht schon
 * an der Seite der Türkei. Der Einsatzbeschluss bleibt Sache des Präsidenten und des Parlaments wie bei jedem Krieg (MIL-1).
 */
export function beistandVorgangGrund(w: World, gegnerId: string): string | undefined {
  if (!w.spiel) return t("krieg.k.x.keinspiel");
  if (!LAENDER.some((l) => l.id === gegnerId)) return t("krieg.k.bs.kein");
  if (kriegMit(w, gegnerId)) return t("krieg.k.bs.laeuft", { land: land(gegnerId).name });
  if (aktiveKriege(w).length >= KRIEG.maxAktiv) return t("krieg.k.bs.zwei");
  return undefined;
}

export function eroeffneBeistandsVorgang(w: World, gegnerId: string, partner: string, paktId: string): Ergebnis {
  const spiel = w.spiel;
  const grund = beistandVorgangGrund(w, gegnerId);
  if (!spiel || grund) return { ok: false, text: grund ?? t("krieg.k.x.keinspiel") };
  const l = land(gegnerId);
  const k: KriegVorgang = {
    id: `kv-${gegnerId}-${w.day}`,
    land: gegnerId,
    phase: "drohkulisse",
    seit: w.day,
    eskalation: 85,
    mobilmachung: 0,
    rahmung: "beistand",
    kriegszielDeklariert: true,
    front: 50,
    frontVorher: 50,
    uhr: 100,
    uhrGegner: 100,
    woche: 0,
    verluste: 0,
    beistandFuer: { partner, pakt: paktId },
    koalition: {
      aggressor: "tuerkei",
      partner: [{ id: partner, seite: "eigen", seit: w.day, grund: t("krieg.k.bs.grund"), pakt: paktId, pflicht: true, rest: 1, einsatz: 1 }],
      abwesend: [],
      bewertet: w.day,
    },
  };
  kriege(w).push(k);
  spiel.zuletzt[`krieg-${gegnerId}`] = w.day;
  landAendern(w, gegnerId, { konflikt: 12, vertrauen: -8 }, t("krieg.k.bs.notiz", { partner: landNameVon(partner) }));
  wirke(w, "ansehen", RAHMUNG.beistand.ansehen);
  wirke(w, "nationalisten", RAHMUNG.beistand.nationalisten);
  phaseSetzen(w, k, "drohkulisse");
  const pn = landNameVon(partner);
  hinweis(w, `krieg-beistand-${k.id}`, t("krieg.k.bs.titel", { partner: pn }), [t("krieg.k.bs.text1", { partner: pn, land: l.name }), t("krieg.k.bs.text2")]);
  addLog(w, "entscheidung", t("krieg.k.bs.log", { partner: pn, land: l.name }), t("krieg.k.bs.log.warum"));
  return { ok: true, text: t("krieg.k.bs.ok", { partner: pn, land: l.name }) };
}

/** Das Waffenruhe-Angebot des Gegners annehmen (Ereignis krieg_waffenruhe). */
export function waffenruheFuerAngebot(w: World, kriegId: string): string {
  const k = kriegZu(w, kriegId);
  if (!k || k.phase !== "krieg") return t("krieg.k.ang.weg");
  waffenruheEintreten(w, k);
  return t("krieg.k.ang.ok", { land: land(k.land).name });
}

/** Niederlage oder Gebietsabtretung bei zerbrochenem Offiziersvertrauen: das Putsch-Risiko-Ereignis (einmal je Vorgang). */
function pruefePutsch(w: World, k: KriegVorgang, rng?: Rng): void {
  if (k.putsch || knotenWert(w, "offiziersvertrauen") >= KRIEG.putschAb) return;
  k.putsch = true;
  oeffne(w, "putschgeruechte", rng ?? new Rng(w.rngState), { daten: { land: k.land, vorgang: k.id } });
}

function kriegsbeginn(w: World, k: KriegVorgang, weg: "parlament" | "erlass" | "angriff"): void {
  const l = land(k.land);
  const rahmung = k.rahmung ?? "verteidigung";
  phaseSetzen(w, k, "krieg");
  k.woche = 0;
  k.stagnation = 0;
  // Koalitionen: Pakt-Pflicht nur für das Opfer, Eigeninteresse für alle (sim/pakte.ts); danach erst die Stärke rechnen
  koalitionenBeiKriegsbeginn(w, k, weg);
  gegnerBestand(w, k);
  const staerkeDelta = eigenStaerke(w, k) - gegnerStaerke(w, k.land);
  k.front = clamp(50 + staerkeDelta * 0.25, 25, 75);
  k.frontVorher = k.front;
  k.uhr = clamp(100 + RAHMUNG[rahmung].uhrStart, 0, 110);
  k.uhrGegner = 100;
  regionenSetzen(w, k);
  // Märkte (Suzerain-Anker: CDS-/Öl-Sprung)
  w.economy.riskPremium += weg === "angriff" ? 220 : rahmung === "revision" ? 200 : 150;
  // Rally um die Flagge (Suzerain: Kriegsorder +2 PO) — nicht beim Erlass, nicht bei Revision
  const spiel = w.spiel!;
  if (weg === "erlass" || rahmung === "revision") spiel.umfrage.zustimmung = Math.max(0, spiel.umfrage.zustimmung - 1);
  else spiel.umfrage.zustimmung = Math.min(100, spiel.umfrage.zustimmung + 2);
  wirke(w, "nationalisten", 3);
  wirke(w, "konservative", 1);
  wirke(w, "staedtische_saekulare", rahmung === "verteidigung" ? 0.5 : -1.5);
  wirke(w, "ansehen", RAHMUNG[rahmung].ansehen);
  landAendern(w, k.land, { vertrauen: -15, konflikt: 10 }, t("krieg.k.phase.krieg"));
  const z = weltZustand(w)[k.land]!;
  z.konflikt = Math.max(z.konflikt, 85);
  // Drittländer-Ausstrahlung: Rivalen des Gegners rücken näher, Nervöse ziehen sich zurück
  for (const [rivale, plus] of Object.entries(AUSSTRAHLUNG_RIVALEN[k.land] ?? {})) landAendern(w, rivale, { vertrauen: plus }, t("krieg.k.beg.rivale", { land: lf(l, "dat") }));
  for (const x of LAENDER) {
    if (x.id === k.land) continue;
    const xx = weltZustand(w)[x.id]!;
    if (xx.konflikt >= 55) landAendern(w, x.id, { vertrauen: -2 }, t("krieg.k.beg.ausweitung"));
    else if (vertrauenZu(w, x.id) >= 60) landAendern(w, x.id, { vertrauen: -1 }, t("krieg.k.beg.sorge"));
  }
  kriegspreisBeginn(w, k);
  belastungEreignis(w, VERFASSUNG.eskalation, t("krieg.k.beg.belastung", { land: l.name }));
  const einstieg =
    weg === "angriff"
      ? t("krieg.k.beg.angriff", { land: l.name })
      : weg === "erlass"
        ? t("krieg.k.beg.erlass", { land: lf(l, "akk") })
        : t("krieg.k.beg.parlament", { land: lf(l, "akk") });
  hinweis(w, `krieg-beginn-${k.id}-${w.day}`, t("krieg.k.beg.titel", { land: l.name }), [einstieg, t("krieg.k.beg.front", { front: Math.round(k.front) })]);
  addLog(w, "ereignis", t("krieg.k.beg.log", { land: l.name, einstieg }), t("krieg.k.beg.log.warum", { rahmung: RAHMUNG[rahmung].name }));
}

function beschlussAbstimmen(w: World, k: KriegVorgang, rng: Rng): void {
  const spiel = w.spiel!;
  const l = land(k.land);
  const b = k.beschluss!;
  const stimmen = stimmenSicht(w, { massnahme: "m_verteidigung", richtung: 1 });
  const bonus = RAHMUNG[b.rahmung].stimmen + (k.eskalation >= 85 ? 15 : 0);
  const ja = Math.min(600, Math.max(0, Math.round(stimmen.erwartet + bonus + rng.normal(6))));
  const nein = 600 - ja;
  delete k.beschluss;
  if (ja >= 301) {
    addLog(w, "entscheidung", t("krieg.k.bes.ja", { land: lf(l, "akk"), ja, nein }), t(bonus ? "krieg.k.bes.ja.bonus" : "krieg.k.bes.ja.warum", { rahmung: RAHMUNG[b.rahmung].name, bonus: `${bonus >= 0 ? "+" : ""}${bonus}` }));
    kriegsbeginn(w, k, "parlament");
  } else {
    phaseSetzen(w, k, "drohkulisse");
    k.eskalation = clamp(k.eskalation + 4, 0, 100);
    vertrauenAendern(w, -1.2);
    spiel.umfrage.zustimmung = Math.max(0, spiel.umfrage.zustimmung - 0.8);
    addLog(w, "entscheidung", t("krieg.k.bes.nein", { land: lf(l, "akk"), ja, nein }), t("krieg.k.bes.nein.warum"));
  }
}

function niederlage(w: World, k: KriegVorgang, rng?: Rng): void {
  const spiel = w.spiel!;
  const l = land(k.land);
  // Märkte und Haushalt: Reparationen, Flucht aus der Lira
  w.economy.riskPremium += 250;
  kosten(w, 2.0);
  const po = poVerlustFuer(w, 10);
  spiel.umfrage.zustimmung = Math.max(0, spiel.umfrage.zustimmung - po);
  vertrauenAendern(w, -po * 0.4);
  wirke(w, "ansehen", -8);
  wirke(w, "nationalisten", -8);
  wirke(w, "staedtische_saekulare", -4);
  wirke(w, "junge", -3);
  wirke(w, "offiziersvertrauen", -14);
  wirke(w, "truppenmoral", -6);
  landAendern(w, k.land, { vertrauen: -20, konflikt: 20 }, t("krieg.k.nl.notiz"));
  const zz = weltZustand(w)[k.land]!;
  zz.konflikt = clamp(Math.min(zz.konflikt, 60), 0, 100);
  demobStarten(w, k);
  besatzungNachFrieden(w, k, -1);
  koalitionAufloesen(w, k, "niederlage");
  phaseSetzen(w, k, "beendet");
  k.ausgang = "niederlage";
  const frei = knotenWert(w, "pressefreiheit") >= 50;
  hinweis(w, `krieg-niederlage-${k.id}-${w.day}`, t("krieg.k.nl.titel", { land: l.name }), [
    t(frei ? "krieg.k.nl.text.frei" : "krieg.k.nl.text.gelenkt", { land: lf(l, "akk"), po: Math.round(po * 10) / 10 }),
    t(knotenWert(w, "offiziersvertrauen") < KRIEG.putschAb ? "krieg.k.nl.offiziere.zerbrochen" : "krieg.k.nl.offiziere.angeknackst"),
  ]);
  spiel.chronik.push({ tag: w.day, datum: w.date, titel: t("krieg.k.nl.titel", { land: l.name }), ausgang: t("krieg.k.nl.chronik") });
  addLog(w, "ereignis", t("krieg.k.nl.log", { land: l.name }), t("krieg.k.nl.log.warum", { po: Math.round(po * 10) / 10 }));
  // Gebietsabtretung und Niederlage sind der klassische Putsch-Auslöser (Suzerain: Estord und Narbel)
  pruefePutsch(w, k, rng);
}

function demobStarten(w: World, k: KriegVorgang): void {
  if (k.mobilmachung === 0) return;
  k.mobilmachung = 0;
  k.demobBis = w.day + KRIEG.demobTage;
  k.demobSperreBis = w.day + KRIEG.demobTage;
  hinweis(w, `krieg-demob-${k.id}-${w.day}`, t("krieg.k.demob.titel"), [
    t("krieg.k.demob.text1", { tage: KRIEG.demobTage, bip: KRIEG.demobKostenMonat }),
    t("krieg.k.demob.text2", { datum: formatDateDe(addDays(w.date, KRIEG.demobTage)) }),
  ]);
}

function friedenSchliessen(w: World, k: KriegVorgang, p: FriedensPaket, paketId: string, rng?: Rng): Ergebnis {
  const spiel = w.spiel!;
  const l = land(k.land);
  phaseSetzen(w, k, "frieden");
  k.ausgang = p.gebiet === 1 || p.reparation === 1 ? "sieg" : p.gebiet === -1 || p.reparation === -1 ? "frieden" : "weisser_frieden";
  const teile: string[] = [];
  // Innenpreis-Basis des Pakets (Presse multipliziert sie gleich)
  let basis = 0;
  if (p.gebiet === 1) {
    wirke(w, "nationalisten", 6);
    wirke(w, "konservative", 3);
    const ansehen = k.rahmung === "verteidigung" ? -4 : k.rahmung === "revision" ? -6 : -3;
    wirke(w, "ansehen", ansehen);
    wirke(w, "beziehungen_eu", -3);
    landAendern(w, k.land, { konflikt: 25, vertrauen: -10 }, t("wort.krieg.grund_pufferzone"));
    teile.push(t("wort.krieg.teil_pufferzone", { ansehen }));
    if (k.rahmung !== "verteidigung") basis += 3;
    // Ein bedeutender Zielraum zählt innen mehr und kostet außen mehr (Bedeutung 1 bis 3, Standard 2)
    const bed = zielraumVon(k).bedeutung - 2;
    if (bed !== 0) {
      wirke(w, "nationalisten", 2 * bed);
      wirke(w, "ansehen", -1.5 * bed);
    }
  }
  // Was die Front hält, wird besetzt (Pufferzone, später Verwaltung, Annexion oder Rückgabe); sonst kehren die Regionen zurück
  const besetzt = besatzungNachFrieden(w, k, p.gebiet);
  if (besetzt.length) teile.push(t("krieg.besatzung.frieden_teil", { regionen: besetzt.join(", ") }));
  if (p.gebiet === -1) {
    wirke(w, "offiziersvertrauen", -15);
    wirke(w, "nationalisten", -10);
    wirke(w, "konservative", -4);
    basis += 8;
    teile.push(t("wort.krieg.teil_zugestaendnis"));
  }
  if (p.reparation === 1) {
    kosten(w, -0.8);
    wirke(w, "nationalisten", 2);
    teile.push(t("krieg.k.fr.rep_an"));
  }
  if (p.reparation === -1) {
    kosten(w, 1.2);
    basis += 6;
    // Gekaufter Frieden erzeugt Abhängigkeit (Suzerain: Beatrice-Deal)
    landAendern(w, k.land, { handel: 10 }, t("krieg.k.fr.gekauft.notiz"));
    teile.push(t("krieg.k.fr.rep_von"));
  }
  if (p.garantien) {
    landAendern(w, k.land, { konflikt: -15, vertrauen: 5, sicherheit: 6 }, t("krieg.k.fr.garantien.notiz"));
    teile.push(t("krieg.k.fr.garantien"));
  }
  if (p.rueckzug) {
    landAendern(w, k.land, { konflikt: -10 }, t("krieg.k.fr.rueckzug.notiz"));
    wirke(w, "truppenmoral", 2);
    teile.push(t("krieg.k.fr.rueckzug"));
  }
  if (k.ausgang === "weisser_frieden" && k.woche >= 10) basis += 2;
  // Innenpreis, presse-multipliziert (Suzerain: freie Presse verteuert den Frieden)
  const po = poVerlustFuer(w, basis);
  if (po > 0) {
    spiel.umfrage.zustimmung = Math.max(0, spiel.umfrage.zustimmung - po);
    vertrauenAendern(w, -po * 0.4);
  }
  k.friedenspreis = po;
  koalitionAufloesen(w, k, p.gebiet === 1 || p.reparation === 1 ? "sieg" : p.gebiet === -1 ? "zugestaendnis" : "frieden");
  // Erleichterung an den Märkten und bei den Kriegsmüden
  w.economy.riskPremium = Math.max(0, w.economy.riskPremium - 80);
  wirke(w, "staedtische_saekulare", 2);
  wirke(w, "junge", 2);
  demobStarten(w, k);
  const z = weltZustand(w)[k.land]!;
  z.konflikt = Math.min(z.konflikt, 45);
  const paketName = PAKETE[paketId]!.name;
  const inhalt = teile.join("; ") || t("krieg.k.fr.weiss");
  const po1 = Math.round(po * 10) / 10;
  spiel.chronik.push({ tag: w.day, datum: w.date, titel: t("krieg.k.fr.titel", { land: l.name }), ausgang: t("krieg.k.fr.chronik", { paket: paketName, inhalt }) });
  hinweis(w, `krieg-frieden-${k.id}-${w.day}`, t("krieg.k.fr.titel", { land: l.name }), [
    t("krieg.k.fr.text1", { paket: paketName, inhalt: teile.join("; ") || t("krieg.k.fr.ohne") }),
    po > 0 ? t(knotenWert(w, "pressefreiheit") >= 50 ? "krieg.k.fr.preis.frei" : "krieg.k.fr.preis.gelenkt", { po: po1 }) : t("krieg.k.fr.preiswert"),
  ]);
  const text = t("krieg.k.fr.log", { land: l.name, paket: paketName, inhalt });
  const why = po > 0 ? t("krieg.k.fr.log.warum", { po: po1, faktor: Math.round(presseFaktor(w) * 10) / 10 }) : t("krieg.k.fr.maerkte");
  addLog(w, "entscheidung", text, why);
  // Gebietsabtretung: Putsch-Risiko-Ereignis (Suzerain: Estord und Narbel)
  if (p.gebiet === -1) pruefePutsch(w, k, rng);
  return { ok: true, text, why };
}

function beendeVorgang(w: World, k: KriegVorgang, ausgang: KriegVorgang["ausgang"]): void {
  koalitionAufloesen(w, k, "rueckzug");
  phaseSetzen(w, k, "beendet");
  k.ausgang = ausgang;
  addLog(w, "ereignis", t("krieg.k.ende", { land: land(k.land).name, ausgang: ausgang === "rueckzug" ? t("krieg.k.ende.rueckzug") : String(ausgang) }), "");
}

// ---------------------------------------------------------------------------
// Motor: Tages-, Wochen- und Monatsschritt

function kriegWoche(w: World, k: KriegVorgang, rng: Rng): void {
  const l = land(k.land);
  k.woche += 1;
  const eigen = eigenStaerke(w, k);
  const gegner = gegnerStaerke(w, k.land);
  let delta = clamp((eigen - gegner) * KRIEG.frontFaktor, -KRIEG.frontMaxDelta, KRIEG.frontMaxDelta);
  // Gelände der umkämpften Region, Reichweite der Einsatzart und Tempo (sim/kriegsschauplatz.ts)
  const sf = kriegsFaktoren(k);
  delta *= delta > 0 ? sf.vorstoss : sf.rueckschlag;
  // Gegenstoß auf türkischen Boden: Wer sich auf Inseln verteidigt, kann das Festland kaum nehmen (Spielparameter GEGNER_OFFENSIVE)
  const offensive = GEGNER_OFFENSIVE[k.land];
  if (delta < 0 && k.front < 50 && offensive !== undefined) delta *= offensive * clamp((k.front - 10) / 40, 0.15, 1);
  if (k.frontSchub) {
    delta += k.frontSchub;
    delete k.frontSchub;
  }
  k.frontVorher = k.front;
  k.front = clamp(k.front + delta, 0, 100);

  // Verluste und Gewinne der Woche (Verschleiß auch im Stillstand, Vic3-Attrition)
  const verlustWoche = delta < 0 ? Math.min(4, -delta * KRIEG.verlustFaktor) : KRIEG.verschleiss;
  const gewinnWoche = delta > 0.5 ? delta * 0.6 : 0;
  k.verluste = clamp(k.verluste + verlustWoche, 0, 100);

  // Erschöpfungsuhren (Vic3-Wochen-Tabelle: Basis +, Verluste +, Gewinne −, Wirtschaftslage ±); Partner teilen die Last (sim/pakte.ts)
  const wirtschaftsdruck = clamp((1.5 - w.economy.growth) * 0.3, -0.45, 0.6);
  const last = lastTeilung(w, k);
  k.uhr += -(KRIEG.uhrBasis + verlustWoche * KRIEG.uhrVerlust + (k.mobilmachung === 2 ? KRIEG.uhrVollLast : 0) + Math.max(0, wirtschaftsdruck)) * (1 - last.eigen) * sf.uhr + gewinnWoche * KRIEG.uhrGewinn + Math.min(0, wirtschaftsdruck);
  k.uhrGegner += -(KRIEG.uhrBasis + gewinnWoche * KRIEG.uhrVerlust + sf.druck) * (1 - last.gegner) + verlustWoche * KRIEG.uhrGewinn;
  // Verluste beider Bestände, Regionen, bedrohte Grenzprovinzen, Kriegslast im Gegnerland
  schauplatzWoche(w, k, delta);
  // Der Preis der Woche: Müdigkeit, Gefallene, Dritte, Märkte (sim/kriegspreis.ts)
  kriegspreisWoche(w, k, gegner);
  // Die Koalitionen altern: Zögernde werden geprüft, Partner verlieren Kampfkraft, Erschöpfte steigen aus
  koalitionWoche(w, k);
  // Anti-Aussitzen: Keine Uhr fällt unter 0, solange die eigene Seite ihr Kriegsziel nicht zur Hälfte kontrolliert
  if (gegnerKontrolle(k) < 0.5) k.uhr = Math.max(0, k.uhr);
  if (eigenKontrolle(k) < 0.5) k.uhrGegner = Math.max(0, k.uhrGegner);

  // Stagnation untergräbt das Offiziersvertrauen (Suzerain: Stillstand frisst die Führung)
  if (Math.abs(k.front - k.frontVorher) < 0.5) k.stagnation = (k.stagnation ?? 0) + 1;
  else k.stagnation = 0;
  if (k.stagnation >= 2) wirke(w, "offiziersvertrauen", -0.3);

  // Wählergruppen und Truppenmoral je Verlauf
  if (delta >= 1) {
    wirke(w, "nationalisten", 0.4);
    wirke(w, "konservative", 0.2);
    wirke(w, "truppenmoral", 0.2);
  } else if (delta <= -1) {
    wirke(w, "nationalisten", -0.5);
    wirke(w, "staedtische_saekulare", -0.3);
    wirke(w, "junge", -0.2);
    wirke(w, "truppenmoral", -0.4);
  }
  // Märkte folgen dem Trend, nicht nur dem Faktum
  if (k.front < 40) w.economy.riskPremium += 6;
  else if (k.front > 62) w.economy.riskPremium = Math.max(0, w.economy.riskPremium - 4);

  // Kipppunkte der Frontlage: Hinweis Klasse B (Wendepunkt)
  if (k.frontVorher >= KRIEG.kippUnten && k.front < KRIEG.kippUnten) {
    hinweis(w, `krieg-kipp-u-${k.id}-${k.woche}`, t("krieg.k.kipp.u.titel", { land: l.name }), [t("krieg.k.kipp.u.text", { land: l.name, front: Math.round(k.front) })]);
    addLog(w, "ereignis", t("krieg.k.kipp.u.log", { land: l.name, front: Math.round(k.front) }), t("krieg.k.kipp.u.warum"));
  }
  if (k.frontVorher <= KRIEG.kippOben && k.front > KRIEG.kippOben) {
    hinweis(w, `krieg-kipp-o-${k.id}-${k.woche}`, t("krieg.k.kipp.o.titel", { land: l.name }), [t("krieg.k.kipp.o.text", { land: l.name, front: Math.round(k.front) })]);
    addLog(w, "ereignis", t("krieg.k.kipp.o.log", { land: l.name, front: Math.round(k.front) }), t("krieg.k.kipp.o.warum"));
  }

  // Waffenruhe-Angebot des Gegners (Suzerain-Lücke gefüllt: Friedensangebot mitten im Krieg)
  if (!k.gegnerAngebot && (k.uhrGegner <= KRIEG.angebotUhr || ((k.stagnation ?? 0) >= 4 && k.uhr <= 55) || k.uhr <= 30) && rng.next() < 0.5) {
    k.gegnerAngebot = true;
    oeffne(w, "krieg_waffenruhe", rng, { daten: { land: k.land, vorgang: k.id } });
  }

  // Kapitulations-Checks (Anti-Aussitzen: unter 0 fällt eine Uhr nur bei kontrolliertem Kriegsziel)
  if (k.front <= KRIEG.zusammenbruchFront || k.uhr <= -KRIEG.kapitulation) {
    niederlage(w, k, rng);
    return;
  }
  if (k.front >= KRIEG.siegFront || k.uhrGegner <= -KRIEG.kapitulation) {
    addLog(w, "ereignis", t("krieg.k.erschoepft", { land: l.name }), t("krieg.k.erschoepft.warum"));
    waffenruheEintreten(w, k);
  }
}

/** Der tägliche Schritt des Konfliktvorgangs (aus dem Spieltick). */
export function kriegTag(w: World, rng: Rng): void {
  const spiel = w.spiel;
  if (!spiel || spiel.ende) return;
  for (const k of kriege(w)) {
    // Eskalation folgt träge der Konflikt-Dimension des Landes
    if (k.phase === "spannung" || k.phase === "drohkulisse") {
      const ziel = weltZustand(w)[k.land]?.konflikt ?? k.eskalation;
      k.eskalation = clamp(k.eskalation + clamp((ziel - k.eskalation) * 0.06, -0.8, 0.8), 0, 100);
    }
    switch (k.phase) {
      case "spannung": {
        if (k.eskalation >= KRIEG.drohkulisseAb) {
          phaseSetzen(w, k, "drohkulisse");
          belastungEreignis(w, VERFASSUNG.eskalation, t("krieg.k.droh.belastung", { land: land(k.land).name }));
          addLog(w, "ereignis", t("krieg.k.droh.log", { land: land(k.land).name }), t("krieg.k.droh.warum"));
          // Auto-Stopp Klasse A: Die Eskalation verlangt eine Entscheidung
          oeffne(w, "krieg_drohkulisse", rng, { daten: { land: k.land, vorgang: k.id } });
        } else if (k.eskalation <= KRIEG.spannungAus && (weltZustand(w)[k.land]?.konflikt ?? 100) < 45) {
          beendeVorgang(w, k, "rueckzug");
        }
        break;
      }
      case "drohkulisse": {
        if (k.eskalation >= KRIEG.angriffAb && !k.beschluss) {
          addLog(w, "ereignis", t("krieg.k.droh.angriff", { land: land(k.land).name }), t("krieg.k.droh.angriff.warum"));
          if (!k.rahmung) k.rahmung = "verteidigung";
          kriegsbeginn(w, k, "angriff");
        } else if (k.eskalation <= KRIEG.drohkulisseAus) {
          phaseSetzen(w, k, "spannung");
          addLog(w, "ereignis", t("krieg.k.droh.aus", { land: land(k.land).name }), t("krieg.k.droh.aus.warum"));
        }
        break;
      }
      case "beschluss": {
        if (k.beschluss && k.beschluss.weg === "parlament" && w.day >= k.beschluss.abstimmung) beschlussAbstimmen(w, k, rng);
        break;
      }
      case "krieg": {
        if ((w.day - k.seit) % 7 === 0 && w.day > k.seit) kriegWoche(w, k, rng);
        break;
      }
      case "frieden": {
        if (w.day > k.seit + 30) phaseSetzen(w, k, "beendet");
        break;
      }
      default:
        break;
    }
    // Demobilisierung: Ende des Auslaufs
    if (k.demobBis !== undefined && w.day >= k.demobBis) {
      delete k.demobBis;
      addLog(w, "ereignis", t("krieg.k.demob.fertig"), t("krieg.k.demob.fertig.warum"));
    }
  }
}

/** Der monatliche Schritt: neue Spannungen aus der Konflikt-Dimension, Demobilisierungs-Rechnung. */
export function kriegMonat(w: World, rng: Rng): void {
  const spiel = w.spiel;
  if (!spiel || spiel.ende) return;
  streitkraefteMonat(w, aktiveKriege(w).some((k) => k.phase === "krieg"));
  kriegsschauplatzMonat(w, kriege(w));
  // Demobilisierungs-Rechnung (Vic3: 90 Tage Auslauf mit laufenden Kosten)
  for (const k of kriege(w)) {
    if (k.demobBis !== undefined && w.day < k.demobBis) {
      kosten(w, KRIEG.demobKostenMonat);
      addLog(w, "ereignis", t("krieg.k.demob.rechnung", { bip: KRIEG.demobKostenMonat }), t("krieg.k.demob.rechnung.warum", { datum: formatDateDe(addDays(w.date, k.demobBis - w.day)) }));
    }
  }
  // Neue Spannungen entstehen aus der Konflikt-Dimension (Auslöser wie Grenzzwischenfälle treiben sie dorthin)
  const aktiv = aktiveKriege(w);
  if (aktiv.length >= KRIEG.maxAktiv) return;
  const z = weltZustand(w);
  for (const l of LAENDER) {
    if (aktiveKriege(w).length >= KRIEG.maxAktiv) break;
    if ((z[l.id]?.konflikt ?? 0) < KRIEG.anlageAb) continue;
    if (kriegMit(w, l.id)) continue;
    if (w.day - (spiel.zuletzt[`krieg-${l.id}`] ?? -1e9) < KRIEG.anlageAbkuehlung) continue;
    spiel.zuletzt[`krieg-${l.id}`] = w.day;
    const k: KriegVorgang = {
      id: `kv-${l.id}-${w.day}`,
      land: l.id,
      phase: "spannung",
      seit: w.day,
      eskalation: z[l.id]!.konflikt,
      mobilmachung: 0,
      front: 50,
      frontVorher: 50,
      uhr: 100,
      uhrGegner: 100,
      woche: 0,
      verluste: 0,
    };
    kriege(w).push(k);
    hinweis(w, `krieg-spannung-${k.id}`, t("krieg.k.sp.titel", { land: l.name }), [t("krieg.k.sp.text1", { land: l.name, konflikt: Math.round(z[l.id]!.konflikt) }), t("krieg.k.sp.text2")]);
    addLog(w, "ereignis", t("krieg.k.sp.log", { land: l.name }), t("krieg.k.sp.warum"));
    void rng;
  }
}

// ---------------------------------------------------------------------------
// Zielräume (Vorstufe der Regionen)

/** Die Zielräume für ein Land; ohne Eintrag gibt es nur das allgemeine Ziel. */
export function zielraeumeFuer(landId: string): Zielraum[] {
  return ZIELRAEUME.filter((z) => z.land === landId);
}

/** Schwierigkeit und Bedeutung des gewählten Zielraums (Standard, wenn keiner gewählt ist). */
export function zielraumVon(k: KriegVorgang): { schwierigkeit: number; bedeutung: number } {
  const z = k.zielraum ? ZIELRAEUME.find((x) => x.id === k.zielraum) : undefined;
  return z ?? STANDARD_ZIEL;
}

/** Den Zielraum festlegen: nur vor dem Waffengang und nach Ausrufen eines Kriegsziels sinnvoll; danach nur ein Wechsel mit Preis. */
export function waehleZielraum(w: World, kriegId: string, zielId: string): Ergebnis {
  const k = kriegZu(w, kriegId);
  const z = ZIELRAEUME.find((x) => x.id === zielId);
  if (!k || !z || z.land !== k.land) return { ok: false, text: t("militaer.ziel.ungueltig") };
  if (k.phase === "frieden" || k.phase === "beendet") return { ok: false, text: t("militaer.ziel.vorbei") };
  const wechsel = !!k.zielraum && k.zielraum !== zielId && k.phase === "krieg";
  if (wechsel) {
    if (!kannZahlen(w.spiel!.kapital, 4)) return { ok: false, text: t("militaer.grund.kapital") };
    w.spiel!.kapital -= 4;
    wirke(w, "truppenmoral", -2);
  }
  k.zielraum = zielId;
  zielGeaendert(w, k);
  const text = t(wechsel ? "militaer.ziel.gewechselt" : "militaer.ziel.gesetzt", { ziel: t(`militaer.zielraum.${zielId}`) });
  addLog(w, "entscheidung", text);
  return { ok: true, text };
}
