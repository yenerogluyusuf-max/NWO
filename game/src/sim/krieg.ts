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

import { kraenke } from "./kraenkung";
import { KRAFT_TUERKEI, NORMALSTAND } from "../data/kraefte";
import { militaerVersorgung } from "./versorgung";
import { PREIS, REAKTION, kriegspreisBeginn, kriegspreisWoche } from "./kriegspreis";
import { BEOBACHTER, KRAENKUNG } from "./kraenkung";
import { NET } from "./modell";
import { nationalAverage } from "./netz";
import { wirke, vertrauenAendern } from "./wirkung";
import { addLog } from "./log";
import { clamp } from "./economy";
import { addDays, formatDateDe } from "./dates";
import { LAENDER, konfliktRuhewert, land, landAendern, vertrauenZu, weltZustand } from "./laender";
import { alleLaufenden } from "./abkommen";
import {
  GEGNER_GRUPPE,
  GEGNER_STAERKE,
  KOALITION,
  koalitionAufloesen,
  koalitionRufen,
  koalitionWoche,
  koalitionenBeiKriegsbeginn,
  koalitionenIn,
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
import { aktuelleSprache, liste, t, zahl } from "../i18n";
import { bestandsFaktor, streitkraefteMonat } from "./streitkraefte";
import { STANDARD_ZIEL, ZIELRAEUME, type Zielraum } from "../data/streitkraefte";
import type { FriedensPaket, KriegPhase, KriegVorgang, KriegsRahmung, Mobilmachung } from "./krieg-typen";
import { besatzungNachFrieden, eigenerBestandsFaktor, gegnerBestand, gegnerBestandsFaktor, kriegsFaktoren, kriegsschauplatzMonat, regionenSetzen, schauplatzWoche, zielGeaendert } from "./kriegsschauplatz";
import { landFormen } from "./ereignisse-krieg";
import { erlassGrund, parlamentInFerien, vollmachtAbgelaufen, vollmachtFuer } from "./krieg-recht";
import { FERN, fernZielErreicht, fernZielVon, istFernkonflikt } from "./fernkonflikt";
import { besatzung, regionenVon, schauplatzFuer, zielRegionen } from "./kriegsschauplatz";

/** Spielparameter, keine Tatsachen: alle Schwellen, Kosten und Faktoren des Konfliktvorgangs (Kalibrierung). */
export const KRIEG = {
  /** Höchstens so viele aktive Konfliktvorgänge gleichzeitig (spannung bis waffenruhe) */
  maxAktiv: 2,
  /** Ab dieser Konflikt-Dimension gilt akute Angriffsgefahr: Dann darf ein dritter Vorgang neben zwei bloßen Spannungen entstehen
   * (Spielparameter, ENTSCHEIDUNGEN R.3) */
  notfallAb: 90,
  /** Ab dieser Konflikt-Dimension eines Landes entsteht ein Spannungs-Vorgang (Monatsprüfung); knapp unter der Kriegsgefahr-Krise (75) */
  anlageAb: 73,
  /** Waffenruhe (Spielparameter): nach so vielen Tagen macht der Gegner ein Gegenangebot; nach der Frist endet die Waffenruhe */
  gegenangebotTage: 30,
  waffenruheFrist: 120,
  /** Ab dieser Eskalation steht ein Angriff unmittelbar bevor; erst dann ist die Rahmung „Verteidigung“ glaubhaft */
  verteidigungGlaubhaftAb: 90,
  /** Abkühlung, bevor mit demselben Land erneut eine Spannung entsteht (Tage) */
  anlageAbkuehlung: 300,
  /** Eskalation für den Übergang spannung → drohkulisse */
  drohkulisseAb: 78,
  /** Darunter löst sich eine Drohkulisse wieder zur Spannung auf */
  drohkulisseAus: 45,
  /** Darunter verfliegt eine Spannung ganz (Vorgang endet still) */
  spannungAus: 22,
  /**
   * Abklingen ohne neuen Anlass (Spielstand 2039 des Inhabers: Spannung mit Israel zehn Jahre bei 70, Drohkulisse mit Zypern sieben Jahre
   * bei 80). Vorher folgte die Eskalation allein dem Konfliktwert des Landes, und der kehrt zu seinem Ruhewert zurück (Israel 70, Zypern 72
   * plus Anker); die Ausstiegsschwellen 22 und 45 lagen weit darunter, also endete der Vorgang nie. Jetzt (Spielparameter, keine belegten
   * Fristen): Nach dem letzten Anlass folgt die Eskalation dem Konflikt noch `naehrFrist` Tage, danach sinkt sie um mindestens
   * `abklingenJeTag` je Tag. Ein Anlass ist ein Sprung des Konfliktwerts um mindestens `naehrSprung` an einem Tag (Zwischenfall, Druck,
   * Machtwechsel zum härteren Kurs, Ereignis) oder ein eigener Schritt der Eskalation (Bereitschaft, Kriegsziel, Mobilmachung, gescheitertes
   * Ultimatum). Fällt der Konfliktwert ebenso deutlich (Beruhigen, Vermittlung, Gesten, Machtwechsel zum freundlicheren Kurs), ist die
   * Nährfrist sofort vorbei. Von 70 aus endet eine Spannung so rund fünfeinhalb Monate nach dem letzten Anlass, nach einer Beruhigung
   * in rund drei Monaten.
   */
  naehrFrist: 45,
  abklingenJeTag: 0.4,
  naehrSprung: 2,
  /** Ein neuer Vorgang entsteht erst, wenn der Konflikt mindestens so weit über seinem Ruhewert steht (akuter Anstieg statt Dauerzustand) */
  anlageUeberRuhe: 3,
  /** Ab dieser Eskalation schlägt der Gegner zu (defensiver Krieg ohne eigenen Beschluss) */
  angriffAb: 95,
  /** Tage bis zur Parlamentsabstimmung über den Einsatzbeschluss */
  beschlussTage: 7,
  /**
   * Vorlauf (Befund G-2, 5. November: vorher lag zwischen Krisenbeginn und Krieg ein Tag). Spielparameter, keine belegten Fristen:
   * Die Spannung dauert mindestens drei Wochen, bevor eine offene Drohkulisse entsteht, und die Drohkulisse mindestens zwei Wochen,
   * bevor die Regierung der Großen Nationalversammlung einen Einsatzbeschluss vorlegen kann. In dieser Zeit reagieren Partner,
   * Märkte und Vermittler, und die Mobilmachung braucht ihre Tage. Zusammen mit der Abstimmung (7 Tage) liegen zwischen der ersten
   * Spannung und einem selbst begonnenen Krieg mindestens 42 Tage. Ein Angriff des Gegners auf die Türkei wartet auf keine Frist.
   */
  spannungMinTage: 21,
  drohkulisseMinTage: 14,
  /** Tage, bis eine angeordnete Mobilmachungsstufe voll steht (keine, teilweise, voll): Reserven einberufen, Verbände verlegen (Spielparameter) */
  mobilTage: [0, 14, 30],
  /** Stärkefaktor je Mobilmachungsstufe */
  mobilFaktor: [0.55, 0.85, 1.08],
  /** Preis des Einsatzes per Erlass (nur nach Art. 92 Abs. 2 bei einem Angriff auf die Türkei): Vertrauen und Legitimität */
  erlassVertrauen: -3,
  erlassLegitimitaet: -2.5,
  /** Kriegsbeginn: Risikoaufschlag der Märkte (Basispunkte) und die Sammlung um die Flagge (Zustimmung; ohne Parlament oder bei offener Revision ein Abschlag) */
  beginnRisiko: { angriff: 220, revision: 200, sonst: 150 },
  beginnSammlung: 2,
  beginnOhneSammlung: -1,
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
  // --- Welle 3, K1 (krieg.md Schritte 1 bis 3), alles Spielparameter ---
  /**
   * Der Gegner schlägt aus der Drohkulisse nur zu, wenn auch sein eigener Konfliktwert an der Schwelle steht: Die eigenen Schritte der
   * Türkei (Sockel) heben die Eskalation, treiben ihn aber nicht allein zum Angriff. Im Spielstand 2043 des Inhabers hob das Kriegsziel
   * die Eskalation von 88 auf 98, und Israel griff am nächsten Tag an (krieg.md 1.3).
   */
  angriffKonfliktAb: 90,
  /** Einsatzbeschluss bei einem Angriff auf die Türkei während der Sitzungszeit: Eilabstimmung nach so vielen Tagen */
  beschlussTageEil: 2,
  /** „Drohkulisse aufbauen“: Kapital und Abstand der Eskalation über der Schwelle */
  drohkulissePk: 6,
  /** „Einsatz auf die Vollmacht“: Kapital (keine Abstimmung, Art. 92 mit stehender Rahmenvollmacht) */
  vollmachtPk: 6,
  /** Ein Friedenspaket nimmt der Gegner an, wenn seine Bereitschaft mindestens so hoch ist */
  paketNoetig: 50,
  /** Aufschlag auf die Bereitschaft, wenn das Kriegsziel erreicht ist bzw. der Gegner erschöpft den Rückzug antritt */
  zielBonus: 10,
  rueckzugBonus: 15,
  /** Ohne Schauplatz und ohne Fernziel gilt das Kriegsziel ab dieser Frontlage als erreicht */
  zielFrontOhneSchauplatz: 80,
  /** In der Waffenruhe zehrt eine gehaltene Linie weiter am Gegner und, schwächer, an der eigenen Heimatfront (je Woche) */
  waffenruheZehrtGegner: 1.5,
  waffenruheZehrtEigen: 0.5,
  /** Ein abgelehntes Waffenruhe-Angebot des Gegners kommt frühestens nach so vielen Tagen wieder */
  angebotAbstand: 84,
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

/** Vollstand des Rückhalts im Land (Erschöpfungsuhr), auf beiden Seiten. Mehr als voll geht nicht; die Anzeige zeigt dieselbe Zahl. */
export const RUECKHALT_MAX = 100;

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
  const mob = mobilStand(w, k).faktor + (k.bereit ? 0.06 : 0);
  const nachschub = clamp(0.72 + 0.0035 * (knotenWert(w, "logistik") - 50) + 0.0025 * (knotenWert(w, "export") - 50), 0.6, 1.1);
  const allianz = 1 + koalitionsFaktoren(w, k).eigenPlus;
  // Bestand und Technik der Streitkräfte (sim/streitkraefte.ts; 1 = Stand 2026); mit gewählter Einsatzart zählen ihre tragenden Gattungen,
  // der Generationsabstand zum Gegner und die Munition (sim/kriegsschauplatz.ts)
  // Gemeinsame Skala (data/kraefte.ts): Im Normalstand ist die Türkei so stark wie ihr belegter Grundwert; jeder Faktor wirkt als
  // Abweichung vom Normalstand statt als Abschlag von 100.
  const n = NORMALSTAND;
  const relativ = (b / n.bereitschaft) * (moral / n.moral) * (mob / n.mobilmachung) * (nachschub / n.nachschub);
  return KRAFT_TUERKEI * relativ * dok * militaerVersorgung(w, k.land).faktor * allianz * (eigenerBestandsFaktor(w, k) ?? bestandsFaktor(w));
}

/**
 * Wie weit die angeordnete Mobilmachung steht: Die neue Stufe wächst über KRIEG.mobilTage von der alten Stufe zur vollen Stärke an.
 * `anteil` 1 heißt fertig; `fertig` ist der Tag, an dem sie voll steht (Anzeige als Fortschrittsbalken).
 */
export function mobilStand(w: World, k: KriegVorgang): { faktor: number; anteil: number; fertig: number } {
  const ziel = KRIEG.mobilFaktor[k.mobilmachung];
  if (k.mobilSeit === undefined || k.mobilVon === undefined) return { faktor: ziel, anteil: 1, fertig: w.day };
  const dauer = KRIEG.mobilTage[k.mobilmachung] || 1;
  const anteil = clamp((w.day - k.mobilSeit) / dauer, 0, 1);
  const von = k.mobilVon;
  return { faktor: von + (ziel - von) * anteil, anteil, fertig: k.mobilSeit + dauer };
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

/** Ein Posten der Rechnung, nach der der Gegner ein Paket annimmt oder ablehnt (Anzeige am Verhandlungstisch). */
export interface AussichtGrund {
  /** Katalogschlüssel `welle_k1.aussicht.<id>` */
  id: "grund" | "angebot" | "erschoepfung_gegner" | "erschoepfung_eigen" | "front" | "haerte" | "blockade" | "ziel" | "rueckzug";
  wert: number;
}

/**
 * Die Bereitschaft des Gegners, ein Paket anzunehmen, mit allen Posten der Rechnung (Welle 3, K1; krieg.md Befund A3). Ab
 * KRIEG.paketNoetig nimmt er an, darunter lehnt er ab, und zwar sicher: Die Zahl ist keine Wahrscheinlichkeit. Vorher stand im Spielstand
 * des Inhabers viermal „Aussicht 47 %“ am Knopf, und jeder Klick scheiterte gleich. Jetzt nennt die Akte die Posten, und ein Paket unter der
 * Schwelle lässt sich nicht vorlegen.
 */
export function paketAussicht(w: World, k: KriegVorgang, p: FriedensPaket, paketId?: string): { prozent: number; gruende: AussichtGrund[] } {
  // Was der Gegner selbst angeboten hat, nimmt er an (Gegenangebot in der Waffenruhe, Angebot bei erreichtem Kriegsziel)
  if (paketId && k.angebotPaket === paketId) return { prozent: 95, gruende: [{ id: "angebot", wert: 95 }] };
  const hart = p.gebiet === 1 || p.reparation === 1;
  const r1 = (x: number) => Math.round(x * 10) / 10;
  const gruende: AussichtGrund[] = [
    { id: "grund", wert: 40 },
    { id: "erschoepfung_gegner", wert: r1((100 - k.uhrGegner) * 0.55) },
    { id: "erschoepfung_eigen", wert: r1(-(100 - k.uhr) * 0.25) },
    { id: "front", wert: r1((k.front - 50) * 0.7) },
    { id: "haerte", wert: r1(-paketHaerte(p) * 22) },
    // Die Partner des Gegners blockieren harte Pakete, solange sie Kampfkraft haben (sim/pakte.ts)
    { id: "blockade", wert: r1(-paketBlockade(w, k, hart)) },
  ];
  if (k.zielErreicht !== undefined) gruende.push({ id: "ziel", wert: KRIEG.zielBonus });
  if (k.rueckzugGegner) gruende.push({ id: "rueckzug", wert: KRIEG.rueckzugBonus });
  const roh = gruende.reduce((s, g) => s + g.wert, 0);
  return { prozent: Math.round(clamp(roh, 5, 98)), gruende: gruende.filter((g) => g.wert !== 0) };
}

/** Annahme-Aussicht eines Friedenspakets in Prozent (deterministisch; die Uhr beider Seiten treibt sie). */
export function paketAnnahme(w: World, k: KriegVorgang, p: FriedensPaket, paketId?: string): number {
  return paketAussicht(w, k, p, paketId).prozent;
}

/** Hält die Türkei in diesem Vorgang Regionen des Gegners (Front oder Besatzung)? */
function haeltRegionen(w: World, k: KriegVorgang): boolean {
  const lage = k.regionen ?? {};
  return regionenVon(k.land).some((r) => lage[r.id] === "eigen") || besatzung(w).some((b) => b.land === k.land);
}

/** Welche Pakete in diesem Vorgang auf dem Tisch liegen können: im Fernkonflikt keine mit Gebiet. */
export function paketeFuer(k: KriegVorgang): string[] {
  // Ohne Grenze gibt es auch keine Grenzzugeständnisse: Wer verliert, zahlt und zieht ab (paket_fern_nachgeben)
  if (istFernkonflikt(k.land)) return ["paket_fern_zugestaendnisse", "paket_fern_abschreckung", "paket_weiss", "paket_fern_nachgeben"];
  return ["paket_sieg", "paket_linie", "paket_ausgewogen", "paket_weiss", "paket_zugestaendnis"];
}

/**
 * Das Paket, das der Lage entspricht und das der Gegner selbst vorlegt (Welle 3, K1): Hält die Türkei Gebiet, den Frieden entlang der Linie;
 * im Fernkonflikt das Paket des erreichten Ziels; steht es offen, den weißen Frieden; siegt der Gegner, verlangt er Zugeständnisse.
 * Vorher bot Griechenland bei Frontlage 96 und vier genommenen Regionen den Status quo an („Ausgewogener Frieden“, Spielstand 2045).
 */
export function lagePaketId(w: World, k: KriegVorgang): string {
  if (k.front < 40) return istFernkonflikt(k.land) ? "paket_fern_nachgeben" : "paket_zugestaendnis";
  if (istFernkonflikt(k.land)) return k.zielErreicht !== undefined || fernZielErreicht(k) ? FERN.paket[fernZielVon(k)] : k.front >= 60 ? "paket_fern_abschreckung" : "paket_weiss";
  if (haeltRegionen(w, k)) return "paket_linie";
  return k.front < 60 ? "paket_weiss" : "paket_ausgewogen";
}

/**
 * Ob das Kriegsziel erreicht ist: alle Regionen des Zielraums genommen, im Fernkonflikt das Fernziel erfüllt (sim/fernkonflikt.ts), ohne
 * Schauplatz eine Frontlage ab KRIEG.zielFrontOhneSchauplatz.
 */
export function kriegszielErreicht(k: KriegVorgang): boolean {
  if (k.phase !== "krieg" && k.phase !== "waffenruhe") return false;
  if (istFernkonflikt(k.land)) return fernZielErreicht(k);
  const ziel = schauplatzFuer(k.land) ? zielRegionen(k) : [];
  if (ziel.length) return ziel.every((r) => k.regionen?.[r.id] === "eigen");
  return k.front >= KRIEG.zielFrontOhneSchauplatz;
}

/**
 * Der Innenpreis eines Friedenspakets, genau so, wie `friedenSchliessen` ihn bucht (Befund G-18: der Knopf versprach einen Preis und
 * nannte keinen). `basis` ist der Preis vor der Presse, `po` der Zustimmungsverlust danach; `nationalisten` die Bewegung dieser Gruppe.
 */
export function paketPreis(w: World, k: KriegVorgang, p: FriedensPaket): { po: number; nationalisten: number } {
  let basis = 0;
  let nationalisten = 0;
  if (p.gebiet === 1) {
    nationalisten += 6 + 2 * (zielraumVon(k).bedeutung - 2);
    if (k.rahmung !== "verteidigung") basis += 3;
  }
  if (p.gebiet === -1) {
    nationalisten -= 10;
    basis += 8;
  }
  if (p.reparation === 1) nationalisten += 2;
  if (p.reparation === -1) basis += 6;
  const weiss = p.gebiet === 0 && p.reparation === 0;
  if (weiss && k.woche >= 10) basis += 2;
  return { po: poVerlustFuer(w, basis), nationalisten };
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
  // Welle 3, K1: das Paket der Lage (der Gegner legt es selbst vor, wenn die Türkei Gebiet hält) und die zwei Ziele des Fernkonflikts
  paket_linie: {
    get name() { return t("welle_k1.paket.linie.name"); },
    get text() { return t("welle_k1.paket.linie.text"); },
    paket: () => ({ gebiet: 1, reparation: 0, garantien: true, rueckzug: false }),
  },
  paket_fern_abschreckung: {
    get name() { return t("welle_k1.paket.fern_abschreckung.name"); },
    get text() { return t("welle_k1.paket.fern_abschreckung.text"); },
    paket: () => ({ gebiet: 0, reparation: 0, garantien: true, rueckzug: true }),
  },
  paket_fern_nachgeben: {
    get name() { return t("welle_k1.paket.fern_nachgeben.name"); },
    get text() { return t("welle_k1.paket.fern_nachgeben.text"); },
    paket: () => ({ gebiet: 0, reparation: -1, garantien: false, rueckzug: true }),
  },
  paket_fern_zugestaendnisse: {
    get name() { return t("welle_k1.paket.fern_zugestaendnisse.name"); },
    get text() { return t("welle_k1.paket.fern_zugestaendnisse.text"); },
    paket: () => ({ gebiet: 0, reparation: 1, garantien: true, rueckzug: true }),
  },
};

/**
 * Aussicht, dass der Gegner einem Ultimatum nachgibt (0 bis 0,6): Je klarer die Türkei überlegen ist (Stärke samt erwarteter
 * Koalitionen), desto eher; gegen Ebenbürtige selten. Spielparameter; Vorbild sind Zwangsdiplomatie-Fälle wie die Krise um
 * Öcalan 1998 (Syrien wies ihn aus) und Imia/Kardak 1996 (beide Seiten zogen sich zurück).
 */
export function ultimatumAussicht(w: World, k: KriegVorgang): number {
  return clamp(0.1 + (eigenStaerke(w, k) - gegnerStaerke(w, k.land)) / 80, 0.05, 0.6);
}

/**
 * Die Rahmung, wie sie tatsächlich zählt: Eine „Verteidigung“, die erklärt wurde, bevor der Gegner kurz vor dem Angriff stand
 * (Eskalation unter KRIEG.verteidigungGlaubhaftAb), überzeugt weder Parlament noch Ausland mehr als „Schutz“. Früher brachte sie
 * auch bei einem eigenen Angriff +30 Stimmen und eine längere Ausdauer (PRUEFUNG_GESAMT_2026-11-04).
 */
export function rahmungWerte(k: KriegVorgang): (typeof RAHMUNG)[KriegsRahmung] {
  const r = k.rahmung ?? "verteidigung";
  if (r === "verteidigung" && k.rahmungDuenn) return { ...RAHMUNG.verteidigung, stimmen: RAHMUNG.schutz.stimmen, uhrStart: RAHMUNG.schutz.uhrStart };
  return RAHMUNG[r];
}

// ---------------------------------------------------------------------------
// Handlungen des Präsidenten (bestellen und verantworten — nicht kommandieren)

export type KriegHandlungId =
  | "bereitschaft"
  | "drohkulisse"
  | "beschluss_vollmacht"
  | "signal"
  | "vermittlung"
  | `ziel_${KriegsRahmung}`
  | "deeskalation"
  | "ultimatum"
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


/**
 * Ob ein Angriff auf die Türkei vorliegt oder unmittelbar bevorsteht, so dass der Präsident nach Art. 92 Abs. 2 der Verfassung den
 * Einsatz sofort anordnen darf: Die Selbstverteidigung wurde erklärt, als der Gegner schon kurz vor dem Schlag stand (Eskalation ab
 * KRIEG.verteidigungGlaubhaftAb vor der eigenen Erklärung). Jede andere Rahmung (Schutz, Beistand, Revision) ist ein Einsatz im
 * Ausland und braucht den Beschluss der Großen Nationalversammlung.
 */
export function angriffAufTuerkei(k: KriegVorgang): boolean {
  return k.rahmung === "verteidigung" && !k.rahmungDuenn;
}

/**
 * Die Türkei beginnt den Krieg selbst (kein Angriff auf sie, kein Beistand für einen angegriffenen Partner). Dann führt die Leiter über das
 * Ultimatum (Welle 3, K1): Druck, Drohkulisse, Ultimatum, Einsatzbeschluss.
 */
export function tuerkeiBeginnt(k: KriegVorgang): boolean {
  return !angriffAufTuerkei(k) && k.rahmung !== "beistand";
}

/** Eigener Schritt der Eskalation: Der Sockel steigt auf den Stand nach dem Schritt (KriegVorgang.sockel). */
function sockelHeben(k: KriegVorgang): void {
  k.sockel = Math.max(k.sockel ?? 0, k.eskalation);
}

export type SprosseId = "druck" | "drohkulisse" | "ultimatum" | "einsatz";
export interface Sprosse {
  id: SprosseId;
  stand: "vorbei" | "jetzt" | "kommt" | "entfaellt";
  /** Frühester Tag, falls die Sprosse auf eine Frist wartet */
  ab?: number;
  /** Für den Einsatz: über welchen Weg (Vollmacht, Abstimmung, Erlass nach Art. 92 Abs. 2) */
  weg?: "vollmacht" | "parlament" | "erlass";
}

/**
 * Die Eskalationsleiter eines Vorgangs vor dem Krieg (Welle 3, K1; krieg.md Schritt 1): Druck → Drohkulisse → Ultimatum → Einsatz.
 * Dieselben Bedingungen prüft `handlungenFuer`; diese Sicht ordnet sie nur für die Akte.
 */
export function eskalationsLeiter(w: World, k: KriegVorgang): Sprosse[] {
  const vor = k.phase === "spannung" || k.phase === "drohkulisse" || k.phase === "beschluss";
  const nachher = !vor;
  const beginnt = !k.kriegszielDeklariert || tuerkeiBeginnt(k);
  const weg: Sprosse["weg"] = vollmachtFuer(w, k.land) ? "vollmacht" : angriffAufTuerkei(k) && parlamentInFerien(w) ? "erlass" : "parlament";
  const droh: Sprosse = k.phase === "spannung" ? { id: "drohkulisse", stand: "jetzt", ab: Math.max(w.day, k.seit + KRIEG.spannungMinTage) } : { id: "drohkulisse", stand: "vorbei" };
  const ult: Sprosse = !beginnt
    ? { id: "ultimatum", stand: "entfaellt" }
    : k.ultimatum || nachher ? { id: "ultimatum", stand: "vorbei" } : { id: "ultimatum", stand: k.phase === "drohkulisse" ? "jetzt" : "kommt" };
  const einsatzAb = k.phase === "drohkulisse" ? Math.max(w.day, k.seit + KRIEG.drohkulisseMinTage) : undefined;
  const einsatz: Sprosse = nachher || k.phase === "beschluss"
    ? { id: "einsatz", stand: k.phase === "beschluss" ? "jetzt" : "vorbei", weg, ...(k.beschluss && k.phase === "beschluss" ? { ab: k.beschluss.abstimmung } : {}) }
    : { id: "einsatz", stand: k.phase === "drohkulisse" && (ult.stand === "vorbei" || ult.stand === "entfaellt") ? "jetzt" : "kommt", weg, ...(einsatzAb !== undefined ? { ab: einsatzAb } : {}) };
  return [{ id: "druck", stand: "vorbei" }, droh, ult, einsatz];
}

const zahlMitVorzeichen = (x: number): string => (x > 0 ? "+" : x < 0 ? "−" : "") + zahl(Math.abs(x), Number.isInteger(x) ? 0 : 1);

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

  if (ph === "spannung") {
    // Zweite Sprosse der Leiter (Welle 3, K1): Truppen an die Grenze und eine öffentliche Forderung, nach der Mindestdauer der Spannung
    const frueh = k.seit + KRIEG.spannungMinTage - w.day;
    push("drohkulisse", t("welle_k1.h.drohkulisse"), KRIEG.drohkulissePk, t("welle_k1.h.drohkulisse.hinweis", { land: l.name }), frueh > 0 ? t("nacht_n7.krieg.beschluss.frueh", { tage: frueh, datum: addDays(w.date, frueh) }) : undefined);
  }
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
    // Das Ultimatum ist die dritte Sprosse und gehört in die Drohkulisse (Welle 3, K1)
    if (ph === "drohkulisse") push("ultimatum", t("krieg.k.h.ultimatum"), 6, t("krieg.k.h.ultimatum.hinweis", { land: l.name, aussicht: Math.round(ultimatumAussicht(w, k) * 100) }), k.ultimatum ? t("krieg.k.h.ultimatum.schon") : undefined);
    push("deeskalation", t("krieg.k.h.deeskalation"), 4, t("krieg.k.h.deeskalation.hinweis"));
    push("rueckzug", t("krieg.k.h.rueckzug"), 6, t("krieg.k.h.rueckzug.hinweis"));
  }
  if (ph === "drohkulisse") {
    const dauer = (stufe: 1 | 2) => " " + t("nacht_n7.krieg.mobil.dauer", { tage: KRIEG.mobilTage[stufe] });
    if (k.mobilmachung === 0) push("mobil_teil", t("krieg.k.h.mobil_teil"), 8, t("krieg.k.h.mobil_teil.hinweis") + dauer(1), demob);
    if (k.mobilmachung < 2) push("mobil_voll", t("krieg.k.h.mobil_voll"), 14, t("krieg.k.h.mobil_voll.hinweis") + dauer(2), demob);
    if (!k.kriegszielDeklariert) {
      // Ohne deklariertes Kriegsziel kein Beschluss: Die Rahmung ist Pflicht (Civ6-Preisschild).
    } else {
      // Art. 92 der Verfassung: Den Einsatz der Streitkräfte im Ausland beschließt die Große Nationalversammlung. Erst nach der
      // Mindestdauer der Drohkulisse kann die Regierung ihn vorlegen (Spielparameter, KRIEG.drohkulisseMinTage). Beginnt die Türkei selbst,
      // steht davor das Ultimatum (Welle 3, K1). Für Syrien und Irak gilt die stehende Rahmenvollmacht bis 30.10.2028 (sim/krieg-recht.ts).
      const frueh = k.seit + KRIEG.drohkulisseMinTage - w.day;
      const sperre = frueh > 0
        ? t("nacht_n7.krieg.beschluss.frueh", { tage: frueh, datum: addDays(w.date, frueh) })
        : tuerkeiBeginnt(k) && !k.ultimatum ? t("welle_k1.h.erst_ultimatum", { land: l.name }) : undefined;
      const vollmacht = vollmachtFuer(w, k.land);
      if (vollmacht) {
        push("beschluss_vollmacht", t("welle_k1.h.vollmacht"), KRIEG.vollmachtPk, t("welle_k1.h.vollmacht.hinweis", { land: l.name, bis: vollmacht.bis }), sperre);
      } else {
        const stimmen = stimmenSicht(w, { massnahme: "m_verteidigung", richtung: 1 }).erwartet + rahmungWerte(k).stimmen;
        const abgelaufen = vollmachtAbgelaufen(w, k.land);
        const tage = angriffAufTuerkei(k) ? KRIEG.beschlussTageEil : KRIEG.beschlussTage;
        push(
          "beschluss",
          t("krieg.k.h.beschluss"),
          10,
          t("krieg.k.h.beschluss.hinweis", { tage, stimmen: Math.round(stimmen) }) + (abgelaufen ? " " + t("welle_k1.h.vollmacht_abgelaufen", { bis: abgelaufen.bis }) : ""),
          sperre,
        );
      }
      // Nur bei einem Angriff auf die Türkei in den Parlamentsferien darf der Präsident den Einsatz sofort selbst anordnen (Art. 92 Abs. 2)
      push(
        "beschluss_erlass",
        t("krieg.k.h.erlass"),
        20,
        t("nacht_n7.krieg.erlass.hinweis", { vertrauen: zahlMitVorzeichen(KRIEG.erlassVertrauen), legitimitaet: zahlMitVorzeichen(KRIEG.erlassLegitimitaet) }),
        erlassGrund(w, angriffAufTuerkei(k)),
      );
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
    push("waffenruhe", t("krieg.k.h.waffenruhe"), 5, k.zielErreicht !== undefined ? t("welle_k1.h.waffenruhe_ziel", { land: l.name }) : t("krieg.k.h.waffenruhe.hinweis"));
    if (k.mobilmachung < 2) push("mobil_voll", t("krieg.k.h.mobil_nach"), 14, t("krieg.k.h.mobil_nach.hinweis"), demob);
  }
  if (ph === "waffenruhe") {
    const erlaubt = paketeFuer(k);
    const gebiet = haeltRegionen(w, k);
    for (const id of erlaubt) {
      const def = PAKETE[id]!;
      const angeboten = k.angebotPaket === id;
      if (!angeboten && id === "paket_sieg" && k.front < 55) continue;
      if (!angeboten && id === "paket_linie" && !gebiet) continue;
      if (!angeboten && (id === "paket_zugestaendnis" || id === "paket_fern_nachgeben") && k.front > 45) continue;
      const p = def.paket(k.front);
      const aussicht = paketAnnahme(w, k, p, id);
      const preis = paketPreis(w, k, p);
      const daheim = preis.po > 0 ? t("nacht_n7.krieg.paket.preis", { po: zahl(preis.po, 1) }) : t("nacht_n7.krieg.paket.preis_kein");
      const gruppe = preis.nationalisten ? " " + t("nacht_n7.krieg.paket.nationalisten", { n: zahlMitVorzeichen(preis.nationalisten) }) : "";
      // Unter der Schwelle lehnt der Gegner sicher ab: Dann lässt sich das Paket nicht vorlegen, und der Grund steht da (keine Klick-Schleife)
      const nein = aussicht < KRIEG.paketNoetig ? t("welle_k1.h.paket_nein", { land: l.name, aussicht, noetig: KRIEG.paketNoetig }) : undefined;
      push(id as KriegHandlungId, t("krieg.k.h.paket", { name: def.name }), 4, t("nacht_n7.krieg.paket.hinweis", { text: def.text, aussicht, daheim: daheim + gruppe }), nein);
    }
    push("weiterkaempfen", t("krieg.k.h.weiter"), 2, t("krieg.k.h.weiter.hinweis"));
  }
  return out;
}

// ---------------------------------------------------------------------------
// Vorlauf und Preis vor dem Krieg (Befund G-2: Phasen mit Mindestdauer; Kriegspreis daheim und im Ausland sichtbar)

export type LeiterStufe = "spannung" | "drohkulisse" | "beschluss" | "krieg" | "waffenruhe" | "frieden";
export const LEITER: LeiterStufe[] = ["spannung", "drohkulisse", "beschluss", "krieg", "waffenruhe", "frieden"];

/** Die Phasenleiter: wo der Vorgang steht und ab wann der nächste Schritt frühestens möglich ist (Tag; nur für den nächsten Schritt). */
export function phasenLeiter(w: World, k: KriegVorgang): { stufe: LeiterStufe; stand: "vorbei" | "jetzt" | "kommt"; ab?: number }[] {
  const jetzt = k.phase === "beendet" ? "frieden" : k.phase;
  const i = LEITER.indexOf(jetzt);
  return LEITER.map((stufe, j) => {
    const stand = j < i ? "vorbei" : j === i ? "jetzt" : "kommt";
    let ab: number | undefined;
    if (j === i + 1 && k.phase === "spannung") ab = Math.max(w.day, k.seit + KRIEG.spannungMinTage);
    if (j === i + 1 && k.phase === "drohkulisse" && k.kriegszielDeklariert && !angriffAufTuerkei(k)) ab = Math.max(w.day, k.seit + KRIEG.drohkulisseMinTage);
    if (j === i + 1 && k.phase === "beschluss" && k.beschluss) ab = k.beschluss.abstimmung;
    return { stufe, stand, ...(ab !== undefined ? { ab } : {}) };
  });
}

export interface KriegsVorschau {
  /** Ob die Türkei als Angreifer gälte (sonst Selbstverteidigung nach Art. 92 Abs. 2) */
  angreifer: boolean;
  daheim: string[];
  ausland: string[];
}

/**
 * Was ein Krieg mit diesem Land kosten würde, aus denselben Zahlen, die `kriegsbeginn`, `kriegspreisBeginn`, `kriegspreisWoche` und
 * `kraenke` buchen: Märkte, Sammlung um die Flagge, Kriegsmüdigkeit, Tourismus; Ansehen, EU und USA, Sanktionen, gekränkte
 * Schutzmächte und wer an der Seite des Gegners kämpfen würde.
 */
export function kriegsVorschau(w: World, k: KriegVorgang): KriegsVorschau {
  const l = land(k.land);
  const angreifer = !angriffAufTuerkei(k);
  const r = REAKTION[k.land];
  const rahmung = k.rahmung ?? "verteidigung";
  const zm = (x: number) => zahlMitVorzeichen(Math.round(x * 10) / 10);
  const daheim: string[] = [];
  const ausland: string[] = [];
  const sammlung = rahmung === "revision" ? KRIEG.beginnOhneSammlung : KRIEG.beginnSammlung;
  daheim.push(t("nacht_n7.vorschau.sammlung", { z: zm(sammlung), erlass: zm(KRIEG.beginnOhneSammlung) }));
  daheim.push(t("nacht_n7.vorschau.maerkte", { bp: rahmung === "revision" ? KRIEG.beginnRisiko.revision : KRIEG.beginnRisiko.sonst, woche: Math.round((r?.risiko ?? 4) * (angreifer ? 1 : 0.5)) }));
  daheim.push(t("nacht_n7.vorschau.muede", { z: zahl(PREIS.muedeJeWoche * (angreifer ? 1 : PREIS.muedeVerteidigung), 2), deckel: zahl(PREIS.muedeDeckel * (angreifer ? 1 : PREIS.muedeVerteidigung), 1) }));
  if (r?.kueste) daheim.push(t("nacht_n7.vorschau.kueste", { n: r.kueste.provinzen.length }));
  const werte = rahmungWerte(k);
  ausland.push(t("nacht_n7.vorschau.ansehen", { z: zm(werte.ansehen) }));
  if (angreifer) {
    if (r && r.eu > 0) ausland.push(t("nacht_n7.vorschau.eu", { z: zm(r.eu * PREIS.beginnWochen), woche: zm(r.eu) }));
    if (r?.euSanktionAb !== undefined) ausland.push(t("nacht_n7.vorschau.eu_sanktion", { land: l.name, woche: r.euSanktionAb }));
    if (r?.usaSanktionAb !== undefined) ausland.push(t("nacht_n7.vorschau.usa_sanktion", { woche: r.usaSanktionAb }));
    const zeugen = (BEOBACHTER[k.land] ?? []).filter((b) => b !== k.land && w.spiel?.welt?.[b]);
    if (zeugen.length) ausland.push(t("nacht_n7.vorschau.zeugen", { namen: liste(zeugen.map(landNameVon)), land: l.name, z: zm(-KRAENKUNG.staerke.angriff * KRAENKUNG.vertrauen) }));
  }
  const koSicht = koalitionenIn(w, k.id);
  const mit = koSicht.gegner.filter((x) => x.rolle === "partner").map((x) => x.name);
  if (mit.length) ausland.push(t("nacht_n7.vorschau.koalition", { namen: liste(mit), n: mit.length, land: lf(l, "dat") }));
  const stopp = koSicht.gegner.filter((x) => x.rolle === "exportstopp").map((x) => x.name);
  if (stopp.length) ausland.push(t("welle_e5.vorschau.exportstopp", { namen: liste(stopp), n: stopp.length }));
  return { angreifer, daheim, ausland };
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
    case "drohkulisse": {
      // Die zweite Sprosse: Truppen an die Grenze, öffentliche Forderung; die Mindestdauer der Drohkulisse beginnt
      naehren(w, k);
      k.eskalation = clamp(Math.max(k.eskalation, KRIEG.drohkulisseAb + 2), 0, 100);
      sockelHeben(k);
      phaseSetzen(w, k, "drohkulisse");
      w.economy.riskPremium += 10;
      wirke(w, "ansehen", -1);
      landAendern(w, k.land, { konflikt: 3 }, t("welle_k1.h.drohkulisse"));
      belastungEreignis(w, VERFASSUNG.eskalation, t("krieg.k.droh.belastung", { land: l.name }));
      text = t("welle_k1.x.drohkulisse", { land: lf(l, "dat") });
      why += " " + t("welle_k1.x.drohkulisse.warum", { tage: KRIEG.drohkulisseMinTage });
      break;
    }
    case "beschluss_vollmacht": {
      // Art. 92 mit stehender Rahmenvollmacht: Der Präsident bestimmt Umfang, Ort und Zeitpunkt; keine neue Abstimmung
      k.beschluss = { weg: "vollmacht", abstimmung: w.day, rahmung: k.rahmung! };
      const v = vollmachtFuer(w, k.land)!;
      text = t("welle_k1.x.vollmacht", { land: lf(l, "akk"), bis: v.bis });
      why += " " + t("welle_k1.x.vollmacht.warum");
      addLog(w, "entscheidung", text, why);
      kriegsbeginn(w, k, "vollmacht");
      return { ok: true, text, why };
    }
    case "bereitschaft": {
      k.bereit = true;
      naehren(w, k);
      k.eskalation = clamp(k.eskalation + 4, 0, 100);
      sockelHeben(k);
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
      if (k.sockel !== undefined) k.sockel = Math.max(0, k.sockel - 4);
      text = t("krieg.k.x.signal", { land: lf(l, "akk") });
      break;
    }
    case "vermittlung": {
      const aussicht = clamp(30 + (knotenWert(w, "ansehen") - 45) * 0.8 + (vertrauenZu(w, k.land) - 35) * 0.6 - (k.eskalation - 50) * 0.4, 5, 85);
      const zufall = rng ? rng.next() * 100 : 50;
      if (zufall < aussicht) {
        entziehen(w, k);
        delete k.sockel;
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
    case "ultimatum": {
      // Zwangsdiplomatie: Gibt der Gegner nach, endet die Krise mit einem Prestigegewinn; sonst schaukelt sie sich auf
      k.ultimatum = true;
      w.economy.riskPremium += 20;
      if (rng.next() < ultimatumAussicht(w, k)) {
        landAendern(w, k.land, { konflikt: -15, vertrauen: -4 }, t("krieg.k.x.ultimatum.notiz"));
        wirke(w, "ansehen", 1);
        wirke(w, "nationalisten", 2);
        text = t("krieg.k.x.ultimatum.ja", { land: l.name });
        why += " " + t("krieg.k.x.ultimatum.ja.warum");
        addLog(w, "entscheidung", text, why);
        beendeVorgang(w, k, "nachgegeben");
        return { ok: true, text, why };
      }
      naehren(w, k);
      k.eskalation = clamp(k.eskalation + 15, 0, 100);
      sockelHeben(k);
      landAendern(w, k.land, { konflikt: 8 }, t("krieg.k.x.ultimatum.notiz"));
      wirke(w, "ansehen", -1);
      text = t("krieg.k.x.ultimatum.nein", { land: l.name });
      why += " " + t("krieg.k.x.ultimatum.nein.warum");
      break;
    }
    case "ziel_verteidigung":
    case "ziel_schutz":
    case "ziel_beistand":
    case "ziel_revision": {
      const r = handlungId.slice(5) as KriegsRahmung;
      const vorher = k.eskalation;
      k.rahmung = r;
      k.kriegszielDeklariert = true;
      naehren(w, k);
      k.eskalation = clamp(k.eskalation + 10, 0, 100);
      // Das erklärte Kriegsziel verfliegt nicht mehr (krieg.md Befund A2): Der Sockel hält die Eskalation bis zur Entspannung
      sockelHeben(k);
      let extra = 0;
      if (r === "beistand" && alleLaufenden(w).every((v) => v.land !== k.land)) extra = -3;
      // Selbstverteidigung verlangt einen unmittelbar bevorstehenden Angriff; sonst zählt sie nur wie „Schutz“ (rahmungWerte)
      if (r === "verteidigung" && vorher < KRIEG.verteidigungGlaubhaftAb) { extra = -2; k.rahmungDuenn = true; } else delete k.rahmungDuenn;
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
      entziehen(w, k);
      delete k.sockel;
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
      // Die neue Stufe steht erst nach KRIEG.mobilTage voll (mobilStand); bis dahin wächst die Stärke vom heutigen Stand aus
      k.mobilVon = mobilStand(w, k).faktor;
      k.mobilSeit = w.day;
      k.mobilmachung = (voll ? 2 : 1) as Mobilmachung;
      naehren(w, k);
      k.eskalation = clamp(k.eskalation + (voll ? 14 : 8), 0, 100);
      if (k.phase !== "krieg") sockelHeben(k);
      kosten(w, voll ? 0.7 : 0.3);
      wirke(w, "junge", voll ? -3 : -1);
      wirke(w, "nationalisten", voll ? 2 : 1);
      if (voll) {
        wirke(w, "staedtische_saekulare", -2);
        wirke(w, "konservative", 1);
        k.uhr = clamp(k.uhr - 5, 0, RUECKHALT_MAX);
      }
      belastungEreignis(w, VERFASSUNG.eskalation, t(voll ? "krieg.k.x.voll" : "krieg.k.x.teil"));
      text = t(voll ? "krieg.k.x.voll.text" : "krieg.k.x.teil.text");
      why += " " + t("krieg.k.x.mobil.warum", { bip: voll ? 0.7 : 0.3 });
      break;
    }
    case "beschluss": {
      // Bei einem Angriff auf die Türkei in der Sitzungszeit stimmt die Große Nationalversammlung im Eilverfahren ab (Spielparameter)
      const tage = angriffAufTuerkei(k) ? KRIEG.beschlussTageEil : KRIEG.beschlussTage;
      k.beschluss = { weg: "parlament", abstimmung: w.day + tage, rahmung: k.rahmung! };
      phaseSetzen(w, k, "beschluss");
      text = t("krieg.k.x.beschluss", { land: lf(l, "akk"), tage });
      why += " " + t("krieg.k.x.beschluss.warum");
      break;
    }
    case "beschluss_erlass": {
      vertrauenAendern(w, KRIEG.erlassVertrauen);
      wirke(w, "legitimitaet", KRIEG.erlassLegitimitaet);
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
      if (k.zielErreicht !== undefined || k.uhrGegner <= 55 || k.front >= 62 || k.uhr <= 40) {
        text = t("krieg.k.x.waffenruhe.ja", { land: l.name });
        addLog(w, "entscheidung", text, why);
        waffenruheEintreten(w, k);
        return { ok: true, text, why };
      }
      k.uhr = clamp(k.uhr - 3, 0, RUECKHALT_MAX);
      k.eskalation = clamp(k.eskalation + 2, 0, 100);
      text = t("krieg.k.x.waffenruhe.nein", { land: l.name });
      why += " " + t("krieg.k.x.waffenruhe.nein.warum");
      break;
    }
    case "paket_sieg":
    case "paket_linie":
    case "paket_fern_abschreckung":
    case "paket_fern_zugestaendnisse":
    case "paket_fern_nachgeben":
    case "paket_ausgewogen":
    case "paket_weiss":
    case "paket_zugestaendnis": {
      const p = PAKETE[handlungId]!.paket(k.front);
      const aussicht = paketAnnahme(w, k, p, handlungId);
      if (aussicht >= KRIEG.paketNoetig) return friedenSchliessen(w, k, p, handlungId, rng);
      k.eskalation = clamp(k.eskalation + 2, 0, 100);
      text = t("krieg.k.x.paket.nein", { land: l.name, aussicht });
      why += " " + t("krieg.k.x.paket.nein.warum");
      break;
    }
    case "weiterkaempfen": {
      k.uhr = clamp(k.uhr - 5, 0, RUECKHALT_MAX);
      k.gegnerAngebot = false;
      delete k.angebotPaket;
      // Wer weiterkämpft, sucht ein weiteres Ziel; der Rückzug des Gegners ist vorbei
      delete k.rueckzugGegner;
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
  // Ein noch offenes Angebot der Waffenruhe ist erledigt (Welle 3, K1: Ziel erreicht und Rückzug können in dieselbe Woche fallen)
  if (w.spiel) w.spiel.ereignisse = w.spiel.ereignisse.filter((e) => !(e.vorlage === "krieg_waffenruhe" && e.daten?.vorgang === k.id));
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
    genaehrt: w.day,
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
  // Partner mit Fallformen (im Deutschen „Saudi-Arabien und den Golfstaaten“), siehe landFormen in sim/ereignisse-krieg.ts
  return { ok: true, text: t("krieg.k.bs.ok", { partner: landFormen(partner), land: l.name }) };
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

function kriegsbeginn(w: World, k: KriegVorgang, wegVoll: "parlament" | "erlass" | "angriff" | "vollmacht"): void {
  // Die Vollmacht ist ein Beschluss der Großen Nationalversammlung, nur ein stehender: Märkte, Bündnisse und Sammlung wie beim Votum
  const weg = wegVoll === "vollmacht" ? "parlament" : wegVoll;
  const l = land(k.land);
  const rahmung = k.rahmung ?? "verteidigung";
  phaseSetzen(w, k, "krieg");
  k.woche = 0;
  k.stagnation = 0;
  // Greift die Türkei an (kein Gegenangriff, keine tragfähige Verteidigung), sehen die Schutzmächte des Gegners zu (sim/kraenkung.ts)
  if (weg !== "angriff" && (rahmung !== "verteidigung" || k.rahmungDuenn)) kraenke(w, k.land, "angriff");
  // Koalitionen: Pakt-Pflicht nur für das Opfer, Eigeninteresse für alle (sim/pakte.ts); danach erst die Stärke rechnen
  koalitionenBeiKriegsbeginn(w, k, weg);
  gegnerBestand(w, k);
  const staerkeDelta = eigenStaerke(w, k) - gegnerStaerke(w, k.land);
  k.front = clamp(50 + staerkeDelta * 0.25, 25, 75);
  k.frontVorher = k.front;
  // Wer angegriffen wird, verteidigt sich glaubhaft, gleich was vorher erklärt war
  if (weg === "angriff") delete k.rahmungDuenn;
  k.uhr = clamp(100 + rahmungWerte(k).uhrStart, 0, RUECKHALT_MAX);
  k.uhrGegner = 100;
  regionenSetzen(w, k);
  // Märkte (Suzerain-Anker: CDS-/Öl-Sprung)
  w.economy.riskPremium += weg === "angriff" ? KRIEG.beginnRisiko.angriff : rahmung === "revision" ? KRIEG.beginnRisiko.revision : KRIEG.beginnRisiko.sonst;
  // Rally um die Flagge (Suzerain: Kriegsorder +2 PO) — nicht beim Erlass, nicht bei Revision
  const spiel = w.spiel!;
  if (weg === "erlass" || rahmung === "revision") spiel.umfrage.zustimmung = Math.max(0, spiel.umfrage.zustimmung + KRIEG.beginnOhneSammlung);
  else spiel.umfrage.zustimmung = Math.min(100, spiel.umfrage.zustimmung + KRIEG.beginnSammlung);
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
  delete k.sockel;
  delete k.zielErreicht;
  delete k.rueckzugGegner;
  const einstieg = wegVoll === "vollmacht"
    ? t("welle_k1.beg.vollmacht", { land: lf(l, "akk") })
    : weg === "angriff"
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
  const bonus = (b.rahmung === k.rahmung ? rahmungWerte(k) : RAHMUNG[b.rahmung]).stimmen + (k.eskalation >= 85 ? 15 : 0);
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
  spiel.chronik.push({ tag: w.day, datum: w.date, titel: t("krieg.k.nl.titel", { land: l.name }), ausgang: t("krieg.k.nl.chronik"), presse: { sparte: "welt", wertung: -0.9 } });
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
  // Innenpreis des Pakets aus derselben Rechnung, die der Knopf vorher zeigt (paketPreis)
  const preis = paketPreis(w, k, p);
  phaseSetzen(w, k, "frieden");
  k.ausgang = p.gebiet === 1 || p.reparation === 1 ? "sieg" : p.gebiet === -1 || p.reparation === -1 ? "frieden" : "weisser_frieden";
  const teile: string[] = [];
  if (p.gebiet === 1) {
    wirke(w, "nationalisten", 6);
    wirke(w, "konservative", 3);
    const ansehen = k.rahmung === "verteidigung" ? -4 : k.rahmung === "revision" ? -6 : -3;
    wirke(w, "ansehen", ansehen);
    wirke(w, "beziehungen_eu", -3);
    landAendern(w, k.land, { konflikt: 25, vertrauen: -10 }, t("wort.krieg.grund_pufferzone"));
    teile.push(t("wort.krieg.teil_pufferzone", { ansehen }));
    // Ein bedeutender Zielraum zählt innen mehr und kostet außen mehr (Bedeutung 1 bis 3, Standard 2)
    const bed = zielraumVon(k).bedeutung - 2;
    if (bed !== 0) {
      wirke(w, "nationalisten", 2 * bed);
      wirke(w, "ansehen", -1.5 * bed);
    }
  }
  // Was die Front hält, wird besetzt (Pufferzone, später Verwaltung, Annexion oder Rückgabe); sonst kehren die Regionen zurück
  const besetzt = besatzungNachFrieden(w, k, p.gebiet, p.forderungen ? { forderungen: p.forderungen } : {});
  // Fernkonflikt: Abschreckung wirkt über die eigene Glaubwürdigkeit, Zugeständnisse über die Reparation (Welle 3, K1)
  if (paketId === "paket_fern_abschreckung") {
    wirke(w, "abschreckung", 3);
    teile.push(t("welle_k1.fr.abschreckung"));
  }
  if (besetzt.length) teile.push(t("krieg.besatzung.frieden_teil", { regionen: besetzt.join(", ") }));
  if (p.gebiet === -1) {
    wirke(w, "offiziersvertrauen", -15);
    wirke(w, "nationalisten", -10);
    wirke(w, "konservative", -4);
    teile.push(t("wort.krieg.teil_zugestaendnis"));
  }
  if (p.reparation === 1) {
    kosten(w, -0.8);
    wirke(w, "nationalisten", 2);
    teile.push(t("krieg.k.fr.rep_an"));
  }
  if (p.reparation === -1) {
    kosten(w, 1.2);
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
  // Innenpreis, presse-multipliziert (Suzerain: freie Presse verteuert den Frieden)
  const po = preis.po;
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
  spiel.chronik.push({ tag: w.day, datum: w.date, titel: t("krieg.k.fr.titel", { land: l.name }), ausgang: t("krieg.k.fr.chronik", { paket: paketName, inhalt }), presse: { sparte: "welt", wertung: 0.5 } });
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

/**
 * Die Waffenruhe hat ein Ende (PRUEFUNG_GESAMT_2026-11-04): Früher konnte sie ohne Frist und ohne Gegenangebot ewig stehen,
 * und der Spieler „parkte“ den Krieg kostenlos. Jetzt macht der Gegner nach KRIEG.gegenangebotTage ein Angebot, das zur Lage passt,
 * und nach KRIEG.waffenruheFrist kippt die Lage: Wer im Vorteil ist und noch Kraft hat, greift wieder an; sonst friert der
 * Konflikt ein (Vorbilder Zypern 1974, Korea 1953): keine Gebietsänderung, Demobilisierung, die Spannung mit dem Land bleibt.
 */
function waffenruheTag(w: World, k: KriegVorgang): void {
  const l = land(k.land);
  const tage = w.day - k.seit;
  // Die Erschöpfung steht in der Waffenruhe nicht still (Welle 3, K1): Eine gehaltene Linie zehrt am Gegner, schwächer an der eigenen Heimatfront
  if (tage > 0 && tage % 7 === 0 && haeltRegionen(w, k)) {
    k.uhrGegner = clamp(k.uhrGegner - KRIEG.waffenruheZehrtGegner, -KRIEG.kapitulation, RUECKHALT_MAX);
    k.uhr = clamp(k.uhr - KRIEG.waffenruheZehrtEigen, -KRIEG.kapitulation, RUECKHALT_MAX);
  }
  if (!k.angebotPaket && tage >= KRIEG.gegenangebotTage) {
    // Das Angebot passt zur Lage (lagePaketId): Hält die Türkei Gebiet, der Frieden entlang der Linie; steht es offen, der weiße Frieden;
    // siegt der Gegner, verlangt er Zugeständnisse
    k.angebotPaket = lagePaketId(w, k);
    const name = PAKETE[k.angebotPaket]!.name;
    hinweis(w, `krieg-gegenangebot-${k.id}`, t("krieg.k.wr.angebot.titel", { land: l.name }), [t("krieg.k.wr.angebot.text", { land: l.name, paket: name, tage: KRIEG.waffenruheFrist - tage })]);
    addLog(w, "ereignis", t("krieg.k.wr.angebot.log", { land: l.name, paket: name }), t("krieg.k.wr.angebot.warum"));
  }
  if (tage < KRIEG.waffenruheFrist) return;
  delete k.angebotPaket;
  if (k.front < 40 && k.uhrGegner > 50) {
    phaseSetzen(w, k, "krieg");
    k.gegnerAngebot = false;
    hinweis(w, `krieg-wr-bruch-${k.id}-${w.day}`, t("krieg.k.wr.bruch.titel", { land: l.name }), [t("krieg.k.wr.bruch.text", { land: l.name })]);
    addLog(w, "ereignis", t("krieg.k.wr.bruch.log", { land: l.name }), t("krieg.k.wr.bruch.warum"));
    return;
  }
  koalitionAufloesen(w, k, "frieden");
  // Einfrieren behält die gehaltene Linie als De-facto-Kontrolle ohne Vertrag (Welle 3, K1; Vorbild Zypern 1974). Vorher fielen alle
  // Eroberungen weg: Im Spielstand 2045 waren Lesbos, Chios, Kos und Alexandroupoli nach dem Einfrieren verloren.
  const linie = besatzungNachFrieden(w, k, 1, { grundlage: "linie" });
  phaseSetzen(w, k, "frieden");
  k.ausgang = "eingefroren";
  demobStarten(w, k);
  const z = weltZustand(w)[k.land];
  if (z) z.konflikt = Math.max(z.konflikt, 60);
  const regionen = linie.join(", ");
  hinweis(w, `krieg-eingefroren-${k.id}`, t("krieg.k.wr.eingefroren.titel", { land: l.name }), [
    linie.length ? t("welle_k1.eingefroren.text_linie", { land: l.name, regionen, n: linie.length }) : t("krieg.k.wr.eingefroren.text", { land: l.name }),
  ]);
  addLog(w, "ereignis", linie.length ? t("welle_k1.eingefroren.log_linie", { land: l.name, regionen, n: linie.length }) : t("krieg.k.wr.eingefroren.log", { land: l.name }), t("krieg.k.wr.eingefroren.warum"));
  if (linie.length) spiel(w).chronik.push({ tag: w.day, datum: w.date, titel: t("krieg.k.wr.eingefroren.titel", { land: l.name }), ausgang: t("welle_k1.eingefroren.log_linie", { land: l.name, regionen, n: linie.length }), presse: { sparte: "welt", wertung: 0.1 } });
}

const spiel = (w: World) => w.spiel!;

function beendeVorgang(w: World, k: KriegVorgang, ausgang: KriegVorgang["ausgang"]): void {
  koalitionAufloesen(w, k, "rueckzug");
  phaseSetzen(w, k, "beendet");
  k.ausgang = ausgang;
  if (ausgang === "abgeklungen") {
    // Ohne neuen Anlass verflogen: eigener Satz mit dem Tag des letzten Anlasses (Spielstand 2039: zehn Jahre ohne Ende)
    const seit = addDays(w.date, (k.genaehrt ?? k.seit) - w.day);
    addLog(w, "ereignis", t("welle_h2.krieg.ende.abgeklungen", { land: land(k.land).name }), t("welle_h2.krieg.ende.abgeklungen.warum", { datum: seit }));
    return;
  }
  addLog(w, "ereignis", t("krieg.k.ende", { land: land(k.land).name, ausgang: ausgang === "rueckzug" ? t("krieg.k.ende.rueckzug") : ausgang === "nachgegeben" ? t("krieg.k.ende.nachgegeben") : String(ausgang) }), "");
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
  // Im Fernkonflikt kann der Gegner die Türkei über Meer und Luft nicht niederwerfen (Welle 3, K1): Sein Gegenstoß ist gedämpft wie bei den
  // Inselstaaten; verlieren kann die Türkei dort über die Erschöpfung, nicht über einen Zusammenbruch der Front
  const offensive = GEGNER_OFFENSIVE[k.land] ?? (istFernkonflikt(k.land) ? FERN.gegenstoss : undefined);
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
  // Siege füllen den Rückhalt nur bis zum Vollstand auf (Welle 1, E5): Im Spielstand des Inhabers stand er nach dem Israel-Krieg bei 109,7,
  // und der Überschuss schluckte unsichtbar die Abzüge für „Weiterkämpfen“. Real ist der Sammeleffekt klein (krieg.md, Befund B4).
  k.uhr = Math.min(RUECKHALT_MAX, k.uhr);
  k.uhrGegner = Math.min(RUECKHALT_MAX, k.uhrGegner);
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
    // Im Fernkonflikt gibt es kein Gelände zu gewinnen, nur den Schlagabtausch (sim/fernkonflikt.ts)
    const fern = istFernkonflikt(k.land);
    hinweis(w, `krieg-kipp-o-${k.id}-${k.woche}`, t("krieg.k.kipp.o.titel", { land: l.name }), [t(fern ? "welle_k1.fern.kipp.text" : "krieg.k.kipp.o.text", { land: l.name, front: Math.round(k.front) })]);
    addLog(w, "ereignis", t("krieg.k.kipp.o.log", { land: l.name, front: Math.round(k.front) }), t(fern ? "welle_k1.fern.kipp.warum" : "krieg.k.kipp.o.warum"));
  }

  // Kriegsziel erreicht (Welle 3, K1; krieg.md Schritt 2, Vic3-Muster M7): Der Gegner wird verhandlungsbereit und legt das Paket der Lage
  // selbst vor. Der Präsident wählt: Waffenruhe annehmen oder weiter vorstoßen. Vorher kam die Waffenruhe erst bei Frontlage 96, und das
  // Paket der Oberfläche fand keine Mehrheit in der Rechnung.
  if (k.zielErreicht === undefined && kriegszielErreicht(k)) {
    k.zielErreicht = w.day;
    k.angebotPaket = lagePaketId(w, k);
    const paket = PAKETE[k.angebotPaket]!.name;
    hinweis(w, `krieg-ziel-${k.id}`, t("welle_k1.ziel.titel", { land: l.name }), [t("welle_k1.ziel.text", { land: l.name, paket })]);
    addLog(w, "ereignis", t("welle_k1.ziel.log", { land: l.name, paket }), t("welle_k1.ziel.warum"));
    if (!k.gegnerAngebot) {
      k.gegnerAngebot = true;
      k.angebotZuletzt = w.day;
      oeffne(w, "krieg_waffenruhe", rng, { daten: { land: k.land, vorgang: k.id } });
    }
  }

  // Waffenruhe-Angebot des Gegners (Suzerain-Lücke gefüllt: Friedensangebot mitten im Krieg)
  // Ein abgelehntes Angebot kommt frühestens nach KRIEG.angebotAbstand (zwölf Wochen, Spielparameter) wieder (Welle 3, K1: in einem Fernkonflikt ohne Zusammenbruch kam es
  // vorher jede Woche, im Spielerlauf passiv Samen 6 einundzwanzigmal)
  const angebotFrei = w.day - (k.angebotZuletzt ?? -1e9) >= KRIEG.angebotAbstand;
  if (!k.gegnerAngebot && angebotFrei && (k.uhrGegner <= KRIEG.angebotUhr || ((k.stagnation ?? 0) >= 4 && k.uhr <= 55) || k.uhr <= 30) && rng.next() < 0.5) {
    k.gegnerAngebot = true;
    k.angebotZuletzt = w.day;
    oeffne(w, "krieg_waffenruhe", rng, { daten: { land: k.land, vorgang: k.id } });
  }

  // Kapitulations-Checks (Anti-Aussitzen: unter 0 fällt eine Uhr nur bei kontrolliertem Kriegsziel)
  if (k.front <= KRIEG.zusammenbruchFront || k.uhr <= -KRIEG.kapitulation) {
    niederlage(w, k, rng);
    return;
  }
  // Ein Fernkonflikt hat keinen Zusammenbruch der Front: Ist die eigene Heimatfront erschöpft, erzwingt sie die Waffenruhe (Welle 3, K1).
  // Der Gegner legt das Paket der Lage vor; ohne Einigung friert der Konflikt nach der Frist ein.
  if (istFernkonflikt(k.land) && k.uhr <= 0) {
    k.angebotPaket = lagePaketId(w, k);
    addLog(w, "ereignis", t("welle_k1.fern.erschoepft", { land: l.name }), t("welle_k1.fern.erschoepft.warum", { paket: PAKETE[k.angebotPaket]!.name }));
    waffenruheEintreten(w, k);
    return;
  }
  if (k.front >= KRIEG.siegFront || k.uhrGegner <= -KRIEG.kapitulation) {
    // Der Gegner tritt erschöpft den Rückzug an und legt das Paket der Lage vor. Der Satz nennt dieselbe Zahl, die die Rechnung annimmt
    // (vorher: „akzeptiert jedes Paket“, im Spielstand 2045 dann viermal 47 %).
    k.rueckzugGegner = true;
    k.angebotPaket = lagePaketId(w, k);
    const def = PAKETE[k.angebotPaket]!;
    const sieg = paketeFuer(k).includes("paket_sieg") && haeltRegionen(w, k) ? paketAnnahme(w, k, PAKETE.paket_sieg!.paket(k.front), "paket_sieg") : undefined;
    addLog(
      w,
      "ereignis",
      t("krieg.k.erschoepft", { land: l.name }),
      t("welle_k1.erschoepft.warum", { paket: def.name, aussicht: paketAnnahme(w, k, def.paket(k.front), k.angebotPaket) }) + (sieg !== undefined ? " " + t("welle_k1.erschoepft.sieg", { aussicht: sieg, noetig: KRIEG.paketNoetig }) : ""),
    );
    waffenruheEintreten(w, k);
  }
}

/** Ein Tag Eskalation: träge zum Ziel, höchstens 0,8 Punkte am Tag. */
export function eskalationSchritt(eskalation: number, ziel: number): number {
  return clamp(eskalation + clamp((ziel - eskalation) * 0.06, -0.8, 0.8), 0, 100);
}

/** Ein Tag Eskalation vor dem Krieg: in der Nährfrist folgt sie dem Konflikt, danach sinkt sie um mindestens `abklingenJeTag`. */
export function eskalationTag(eskalation: number, konflikt: number, tageOhneAnlass: number): number {
  const folgt = eskalationSchritt(eskalation, konflikt);
  return tageOhneAnlass > KRIEG.naehrFrist ? clamp(Math.min(folgt, eskalation - KRIEG.abklingenJeTag), 0, 100) : folgt;
}

/** Ein neuer Anlass nährt die Spannung: Die Nährfrist beginnt von vorn. */
function naehren(w: World, k: KriegVorgang): void {
  k.genaehrt = w.day;
}

/** Eine Entspannung nimmt der Spannung die Nahrung: Die Nährfrist ist sofort vorbei, sie klingt von heute an ab. */
function entziehen(w: World, k: KriegVorgang): void {
  k.genaehrt = Math.min(k.genaehrt ?? k.seit, w.day - KRIEG.naehrFrist - 1);
}

export interface SpannungsVerlauf {
  /** Tag des letzten Anlasses */
  genaehrt: number;
  /** Ab diesem Tag klingt die Spannung ohne neuen Anlass ab */
  abklingenAb: number;
  /** Ob sie schon abklingt */
  klingtAb: boolean;
  /** Voraussichtliches Ende ohne neuen Anlass (Tag); fehlt, wenn es mehr als vier Jahre dauerte */
  endeEtwa?: number;
  /** Konfliktwert heute und Ruhewert, zu dem er ohne Ereignisse zurückkehrt */
  konflikt: number;
  ruhewert: number;
}

/**
 * Wie sich eine Spannung oder Drohkulisse ohne neuen Anlass entwickelt, aus denselben Regeln wie `kriegTag`: Der Konfliktwert kehrt um
 * einen Punkt im Monat zu seinem Ruhewert zurück (laender.ts, weltMonat), die Eskalation folgt `eskalationTag`. Nur für die Anzeige.
 */
export function spannungsVerlauf(w: World, k: KriegVorgang): SpannungsVerlauf | undefined {
  if (k.phase !== "spannung" && k.phase !== "drohkulisse") return undefined;
  const genaehrt = k.genaehrt ?? k.seit;
  let konflikt = w.spiel?.welt?.[k.land]?.konflikt ?? k.eskalation;
  const ruhewert = konfliktRuhewert(w, k.land);
  const heute = konflikt;
  let esk = k.eskalation;
  let sockel = k.sockel;
  let endeEtwa: number | undefined;
  for (let d = 1; d <= 1461; d++) {
    if (d % 30 === 0) konflikt += Math.sign(ruhewert - konflikt) * Math.min(1, Math.abs(ruhewert - konflikt));
    esk = eskalationTag(esk, konflikt, w.day + d - genaehrt);
    // Der Sockel eigener Schritte, wie im Tagesschritt (Welle 3, K1)
    if (sockel !== undefined) {
      if (!k.kriegszielDeklariert && w.day + d - genaehrt > KRIEG.naehrFrist) sockel = Math.max(0, sockel - KRIEG.abklingenJeTag);
      esk = Math.max(esk, sockel);
    }
    if (esk <= KRIEG.spannungAus) {
      endeEtwa = w.day + d;
      break;
    }
  }
  return { genaehrt, abklingenAb: genaehrt + KRIEG.naehrFrist, klingtAb: w.day > genaehrt + KRIEG.naehrFrist, ...(endeEtwa !== undefined ? { endeEtwa } : {}), konflikt: heute, ruhewert };
}

/** Der tägliche Schritt des Konfliktvorgangs (aus dem Spieltick). */
export function kriegTag(w: World, rng: Rng): void {
  const spiel = w.spiel;
  if (!spiel || spiel.ende) return;
  for (const k of kriege(w)) {
    // Eskalation folgt träge der Konflikt-Dimension des Landes, solange ein Anlass sie nährt; danach klingt sie ab (KRIEG.naehrFrist)
    if (k.phase === "spannung" || k.phase === "drohkulisse") {
      const konflikt = weltZustand(w)[k.land]?.konflikt ?? k.eskalation;
      // Ältere Spielstände: Ohne Eintrag gilt der Beginn der Phase als letzter Anlass
      k.genaehrt ??= k.seit;
      const sprung = k.konfliktStand === undefined ? 0 : konflikt - k.konfliktStand;
      if (sprung >= KRIEG.naehrSprung) naehren(w, k);
      else if (sprung <= -KRIEG.naehrSprung) entziehen(w, k);
      k.konfliktStand = konflikt;
      k.eskalation = eskalationTag(k.eskalation, konflikt, w.day - k.genaehrt!);
      // Der Sockel eigener Schritte (Welle 3, K1): Mit erklärtem Kriegsziel hält er bis zur Entspannung, sonst klingt er ab wie die Eskalation
      if (k.sockel !== undefined) {
        if (!k.kriegszielDeklariert && w.day - k.genaehrt! > KRIEG.naehrFrist) k.sockel = Math.max(0, k.sockel - KRIEG.abklingenJeTag);
        k.eskalation = Math.max(k.eskalation, k.sockel);
      }
    }
    switch (k.phase) {
      case "spannung": {
        if (k.eskalation >= KRIEG.drohkulisseAb && (w.day - k.seit >= KRIEG.spannungMinTage || k.gegnerDroht)) {
          phaseSetzen(w, k, "drohkulisse");
          belastungEreignis(w, VERFASSUNG.eskalation, t("krieg.k.droh.belastung", { land: land(k.land).name }));
          addLog(w, "ereignis", t("krieg.k.droh.log", { land: land(k.land).name }), t("krieg.k.droh.warum"));
          // Auto-Stopp Klasse A: Die Eskalation verlangt eine Entscheidung
          oeffne(w, "krieg_drohkulisse", rng, { daten: { land: k.land, vorgang: k.id } });
        } else if (k.eskalation <= KRIEG.spannungAus) {
          // Die Spannung ist verflogen, durch Entspannung oder weil sie kein Anlass mehr nährt: kein Rückzug, kein Gesichtsverlust
          beendeVorgang(w, k, "abgeklungen");
        }
        break;
      }
      case "drohkulisse": {
        // Der Gegner schlägt zu, wenn die Eskalation an der Schwelle steht UND sein eigener Konfliktwert auch: Die eigenen Schritte der Türkei
        // allein (Kriegsziel, Mobilmachung) lösen den Angriff nicht aus (Welle 3, K1; krieg.md 1.3)
        if (k.eskalation >= KRIEG.angriffAb && (weltZustand(w)[k.land]?.konflikt ?? 0) >= KRIEG.angriffKonfliktAb && !k.beschluss) {
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
      case "waffenruhe": {
        waffenruheTag(w, k);
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
  // Neue Spannungen entstehen aus der Konflikt-Dimension; Zwischenfälle treiben sie dorthin. Eigener, abgeleiteter Zufallsstrom:
  // Die gemeinsame Folge (übrige Ereignisse, Alttests) bleibt unberührt.
  zwischenfaelle(w, new Rng((w.rngState ^ Math.imul(w.day + 13, 0x9e3779b1)) | 0));
  void rng;
  // Höchstens zwei Vorgänge. Ausnahme: Bei akuter Angriffsgefahr (Konflikt ab notfallAb) darf ein dritter entstehen, solange nicht
  // schon zwei heiße (ab Drohkulisse) laufen. Sonst verdrängten zwei laue Spannungen (etwa durch Zwischenfälle) einen echten Angriff.
  // Das heißeste Land kommt zuerst an die Reihe.
  const heiss = (): number => aktiveKriege(w).filter((k) => k.phase !== "spannung").length;
  const voll = (konflikt: number): boolean => heiss() >= KRIEG.maxAktiv ||
    aktiveKriege(w).length >= (konflikt >= KRIEG.notfallAb ? KRIEG.maxAktiv + 1 : KRIEG.maxAktiv);
  const z = weltZustand(w);
  for (const l of [...LAENDER].sort((a, b) => (z[b.id]?.konflikt ?? 0) - (z[a.id]?.konflikt ?? 0))) {
    if (voll(z[l.id]?.konflikt ?? 0)) continue;
    if ((z[l.id]?.konflikt ?? 0) < KRIEG.anlageAb) continue;
    // Nur ein akuter Anstieg über den Ruhewert legt einen Vorgang an; ein dauerhaft hoher Konflikt (Zypern mit härterer Führung) nicht
    if ((z[l.id]?.konflikt ?? 0) < konfliktRuhewert(w, l.id) + KRIEG.anlageUeberRuhe) continue;
    if (ohneKriegsvorgang(l.id)) continue;
    if (kriegMit(w, l.id)) continue;
    if (w.day - (spiel.zuletzt[`krieg-${l.id}`] ?? -1e9) < KRIEG.anlageAbkuehlung) continue;
    vorgangAnlegen(w, l.id, z[l.id]!.konflikt);
  }
}

/**
 * Ein Land droht selbst offen (Länder-Eigeninitiative „Drohkulisse“, sim/initiative.ts über die Brücke in sim/spiel.ts): Besteht mit ihm
 * eine Spannung, steigt sie auf Drohkulisse-Niveau, und die Mindestdauer der Spannung entfällt, weil der Gegner den Takt vorgibt.
 * Die Mindestdauer vor dem eigenen Einsatzbeschluss bleibt.
 */
export function drohkulisseDurchGegner(w: World, landId: string): boolean {
  const k = kriegMit(w, landId);
  if (!k || k.phase !== "spannung") return false;
  k.eskalation = Math.max(k.eskalation, KRIEG.drohkulisseAb + 2);
  k.gegnerDroht = true;
  naehren(w, k);
  return true;
}

/** Legt einen Spannungs-Vorgang an (Monatsprüfung oder vom Präsidenten eröffnete Krise). */
function vorgangAnlegen(w: World, landId: string, eskalation: number): KriegVorgang {
  const l = land(landId);
  w.spiel!.zuletzt[`krieg-${l.id}`] = w.day;
  const k: KriegVorgang = {
    id: `kv-${l.id}-${w.day}`, land: l.id, phase: "spannung", seit: w.day, eskalation, mobilmachung: 0,
    front: 50, frontVorher: 50, uhr: 100, uhrGegner: 100, woche: 0, verluste: 0,
    genaehrt: w.day, konfliktStand: weltZustand(w)[l.id]?.konflikt ?? eskalation,
  };
  kriege(w).push(k);
  const konflikt = Math.round(weltZustand(w)[l.id]?.konflikt ?? eskalation);
  // Ein Zwischenfall desselben Tages ist der Auslöser: Er steht nicht noch als eigenes Fenster davor (Spielerdurchlauf: sechs Fenster an einem Tag)
  const sp = w.spiel;
  const zwischenfall = sp?.hinweise.some((h) => h.id === `krieg-zwischenfall-${l.id}-${w.day}`);
  if (sp && zwischenfall) sp.hinweise = sp.hinweise.filter((h) => h.id !== `krieg-zwischenfall-${l.id}-${w.day}`);
  hinweis(w, `krieg-spannung-${k.id}`, t("krieg.k.sp.titel", { land: l.name }), [t("krieg.k.sp.text1", { land: l.name, konflikt, zwischenfall: zwischenfall ? "ja" : "nein", ort: zwischenfallOrt(l.id) }), t("krieg.k.sp.text2")]);
  addLog(w, "ereignis", t("krieg.k.sp.log", { land: l.name }), t("krieg.k.sp.warum"));
  return k;
}

/**
 * Ab diesem Konfliktwert kostet eine eigene Krise nur den Grundpreis (Spielparameter). Darunter geht sie auch, aber teurer (Welle 3, K1):
 * Eine Krise aus ruhiger Lage braucht einen Vorwand, und das kostet Kapital, Ansehen und das Vertrauen des Landes. Vorher war sie unter 55
 * gesperrt, und gegen Syrien (Start 20) führte der einzige Weg über 13 Gesten „Druck“ in zwei Jahren (krieg.md 1.2).
 */
export const KRISE_AB = 55;
export const KRISE_PK = 4;
/** Je so viele Konfliktpunkte unter KRISE_AB ein Kapital mehr; je Punkt so viel Ansehen und Vertrauen (Spielparameter) */
export const KRISE_AUFSCHLAG = { punkteJePk: 4, ansehenJePunkt: 0.1, vertrauenJePunkt: 0.2 };

/** Was eine eigene Krise mit diesem Land kostet, aus denselben Zahlen, die `kriseEroeffnen` bucht. */
export function krisePreis(w: World, landId: string): { pk: number; ansehen: number; vertrauen: number; aufschlag: boolean } {
  const konflikt = weltZustand(w)[landId]?.konflikt ?? 0;
  const unter = Math.max(0, KRISE_AB - konflikt);
  const r1 = (x: number) => Math.round(x * 10) / 10;
  return {
    pk: KRISE_PK + Math.ceil(unter / KRISE_AUFSCHLAG.punkteJePk),
    ansehen: r1(-1 - unter * KRISE_AUFSCHLAG.ansehenJePunkt),
    vertrauen: r1(-3 - unter * KRISE_AUFSCHLAG.vertrauenJePunkt),
    aufschlag: unter > 0,
  };
}

/** Warum der Präsident mit einem Land gerade keine Krise eröffnen kann (sonst undefined). */
export function kriseGrund(w: World, landId: string): string | undefined {
  const spiel = w.spiel;
  if (!spiel || spiel.ende) return t("krieg.k.x.keinspiel");
  if (kriegMit(w, landId)) return t("krieg.k.krise.schon");
  if (ohneKriegsvorgang(landId)) return t("krieg.k.krise.fern", { land: land(landId).name });
  if (aktiveKriege(w).length >= KRIEG.maxAktiv) return t("krieg.k.krise.zuviele", { n: KRIEG.maxAktiv });
  if (w.day - (spiel.zuletzt[`krieg-${landId}`] ?? -1e9) < 30) return t("welle_k1.krise.eben");
  if (!kannZahlen(spiel.kapital, krisePreis(w, landId).pk)) return t("krieg.k.kapital");
  return undefined;
}

/**
 * Der Präsident eröffnet selbst eine Krise, die erste Sprosse der Leiter „Druck“ (PRUEFUNG_GESAMT_2026-11-04; Welle 3, K1):
 * Ein Spannungs-Vorgang entsteht sofort; Märkte und Ausland notieren es. Danach stehen Drohkulisse, Kriegsziel und Ultimatum offen,
 * aber ebenso Vermittlung und Deeskalation.
 */
export function kriseEroeffnen(w: World, landId: string): Ergebnis {
  const grund = kriseGrund(w, landId);
  if (grund) return { ok: false, text: grund };
  const spiel = w.spiel!;
  const l = land(landId);
  const preis = krisePreis(w, landId);
  spiel.kapital -= preis.pk;
  w.economy.riskPremium += 15;
  wirke(w, "ansehen", preis.ansehen);
  landAendern(w, landId, { konflikt: 5, vertrauen: preis.vertrauen }, t("krieg.k.krise.notiz"));
  const k = vorgangAnlegen(w, landId, Math.max(weltZustand(w)[landId]!.konflikt, KRIEG.anlageAb));
  // Die eigene Krise ist ein eigener Schritt: Sie trägt die Eskalation über die Nährfrist, auch wenn der Konfliktwert niedriger liegt
  sockelHeben(k);
  const text = t("krieg.k.krise.ok", { land: l.name });
  const why = t("welle_k1.krise.warum", { pk: preis.pk, ansehen: zahlMitVorzeichen(preis.ansehen), vertrauen: zahlMitVorzeichen(preis.vertrauen) });
  addLog(w, "entscheidung", text, why);
  return { ok: true, text, why };
}

/**
 * Zwischenfälle (Grenze, Luftraum, See): Bei angespannten Ländern verschärft sich die Lage manchmal von selbst, ohne Zutun des
 * Präsidenten. Monatliche Wahrscheinlichkeit (Konflikt − 50) / 300, also bei Konflikt 72 rund 7 % (Spielparameter). Früher bewegten
 * sich Konflikte ohne den Spieler nie (24 Monate ohne einen Vorgang, PRUEFUNG_GESAMT_2026-11-04).
 */
/**
 * Wo ein Zwischenfall geschehen kann, nach der Geografie: Landgrenze (Iran, Irak, Syrien, Kaukasus), Luftraum und See
 * (Schwarzes Meer, östliches Mittelmeer), fern der Grenzen (USA, China, Golf, Zentralasien). Griechenland und die EU
 * (über Bulgarien und Griechenland) haben alle drei Wege. Spielerdurchlauf 5. November: „Zwischenfall an der Grenze“ mit den USA.
 */
const ZWISCHENFALL_ORT: Record<string, "grenze" | "see" | "fern"> = {
  IRN: "grenze", IRQ: "grenze", SYR: "grenze", ARM: "grenze", AZE: "grenze", GEO: "grenze",
  RUS: "see", UKR: "see", CYP: "see", EGY: "see", LBY: "see", ISR: "see",
  USA: "fern", CHN: "fern", SAU: "fern", KAZ: "fern",
};
export const zwischenfallOrt = (landId: string): string => ZWISCHENFALL_ORT[landId] ?? "alle";

/**
 * Mit fernen Großmächten und der EU entsteht kein militärischer Vorgang (Spannung, Drohkulisse, Kriegsbeschluss): Die Spannung
 * bleibt Sache von Diplomatie, Handel und Sanktionen (ENTSCHEIDUNGEN, Nachtrag zu U vom 5. November). Zwischenfälle gibt es weiter,
 * etwa 2023 der Abschuss einer türkischen Drohne durch die US-Luftwaffe über Syrien; sie treiben die Spannung aber nicht über die
 * Schwelle eines Vorgangs.
 */
export const ohneKriegsvorgang = (landId: string): boolean => landId === "EU" || ZWISCHENFALL_ORT[landId] === "fern";

function zwischenfaelle(w: World, rng: Rng): void {
  const z = weltZustand(w);
  for (const l of LAENDER) {
    const konflikt = z[l.id]?.konflikt ?? 0;
    // Auch während einer Spannung: Ein Zwischenfall nährt sie (kriegTag erkennt den Sprung) und kann sie zur Drohkulisse treiben, die eine
    // Entscheidung verlangt. In der Drohkulisse und später nicht: Sonst zogen Zwischenfälle allein einen Präsidenten, der nicht antwortet,
    // bis zum Angriff (scripts/wahlkampf-krisenlauf.ts: Israel schlägt im Dezember 2028 zu); weiter eskaliert sie dort nur durch eigene
    // Schritte oder die offene Drohung des Gegners
    const kv = kriegMit(w, l.id);
    if (konflikt < 50 || (kv && kv.phase !== "spannung")) continue;
    if (rng.next() >= (konflikt - 50) / 300) continue;
    if (ohneKriegsvorgang(l.id) && konflikt >= KRIEG.anlageAb - 8) continue;
    // Ebenso, solange nach einem abgeklungenen Vorgang kein neuer entstehen darf (Abkühlung): Sonst trieben Zwischenfälle den Konflikt
    // ungesehen über die Schwelle, und der nächste Vorgang begann gleich an der Angriffsschwelle (frische Partie, Samen 6: Israel schlägt
    // einen Tag nach der Drohkulisse zu)
    const sp = w.spiel;
    if (!kv && sp && w.day - (sp.zuletzt[`krieg-${l.id}`] ?? -1e9) < KRIEG.anlageAbkuehlung && konflikt >= KRIEG.anlageAb - 8) continue;
    const plus = 4 + Math.round(rng.next() * 4);
    landAendern(w, l.id, { konflikt: plus }, t("krieg.k.zwischenfall.notiz"));
    hinweis(w, `krieg-zwischenfall-${l.id}-${w.day}`, t("krieg.k.zwischenfall.titel", { land: l.name }), [t("krieg.k.zwischenfall.text", { land: l.name, ort: zwischenfallOrt(l.id), alt: Math.round(konflikt), neu: Math.round(konflikt + plus) })]);
    addLog(w, "ereignis", t("krieg.k.zwischenfall.log", { land: l.name, plus }), t("krieg.k.zwischenfall.warum"));
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

/** Preis eines Zielraumwechsels im Krieg (Spielparameter; die Akte zeigt dieselben Zahlen). */
export const ZIELRAUM_WECHSEL = { pk: 4, moral: -2 };

/** Den Zielraum festlegen: nur vor dem Waffengang und nach Ausrufen eines Kriegsziels sinnvoll; danach nur ein Wechsel mit Preis. */
export function waehleZielraum(w: World, kriegId: string, zielId: string): Ergebnis {
  const k = kriegZu(w, kriegId);
  const z = ZIELRAEUME.find((x) => x.id === zielId);
  if (!k || !z || z.land !== k.land) return { ok: false, text: t("militaer.ziel.ungueltig") };
  if (k.phase === "frieden" || k.phase === "beendet") return { ok: false, text: t("militaer.ziel.vorbei") };
  const wechsel = !!k.zielraum && k.zielraum !== zielId && k.phase === "krieg";
  if (wechsel) {
    if (!kannZahlen(w.spiel!.kapital, ZIELRAUM_WECHSEL.pk)) return { ok: false, text: t("militaer.grund.kapital") };
    w.spiel!.kapital -= ZIELRAUM_WECHSEL.pk;
    wirke(w, "truppenmoral", ZIELRAUM_WECHSEL.moral);
  }
  k.zielraum = zielId;
  zielGeaendert(w, k);
  const text = t(wechsel ? "militaer.ziel.gewechselt" : "militaer.ziel.gesetzt", { ziel: t(`militaer.zielraum.${zielId}`) });
  addLog(w, "entscheidung", text);
  return { ok: true, text };
}
