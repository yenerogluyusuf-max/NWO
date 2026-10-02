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

import { NET } from "./modell";
import { nationalAverage } from "./netz";
import { wirke, vertrauenAendern } from "./wirkung";
import { addLog } from "./log";
import { clamp } from "./economy";
import { addDays, formatDateDe } from "./dates";
import { LAENDER, land, landAendern, vertrauenZu, weltZustand } from "./laender";
import { alleLaufenden } from "./abkommen";
import { stimmenSicht } from "./handeln";
import { oeffne } from "./ereignisse";
import { kosten } from "./ereignis-hilfen";
import { kannZahlen } from "./kapital";
import { VERFASSUNG, AUFMERKSAMKEIT_KOSTEN, belastungEreignis, neuanfangGrund, verbrauche } from "./aufmerksamkeit";
import { Rng } from "./rng";
import type { World } from "./types";
import type { FriedensPaket, KriegPhase, KriegVorgang, KriegsRahmung, Mobilmachung } from "./krieg-typen";

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

export const PHASEN_NAME: Record<KriegPhase, string> = {
  spannung: "Spannung",
  drohkulisse: "Drohkulisse",
  beschluss: "Einsatzbeschluss",
  krieg: "Krieg",
  waffenruhe: "Waffenruhe",
  frieden: "Frieden",
  beendet: "Beendet",
};

/** Civ6-Preisschild: Die Rahmung legt die Preise der Folgehandlungen fest (Parlament, Welt, Wähler). */
export const RAHMUNG: Record<KriegsRahmung, { name: string; text: string; stimmen: number; ansehen: number; uhrStart: number; nationalisten: number }> = {
  verteidigung: {
    name: "Selbstverteidigung",
    text: "Antwort auf einen Zwischenfall: Das Parlament trägt sie am ehesten, die Welt rechnet sie kaum an — wenn die Eskalation als Beleg taugt.",
    stimmen: 30,
    ansehen: -1,
    uhrStart: 8,
    nationalisten: 2,
  },
  schutz: {
    name: "Schutz von Minderheiten",
    text: "Humanitär gerahmt: innen vermittelbar, außen umstritten.",
    stimmen: 12,
    ansehen: -3,
    uhrStart: 0,
    nationalisten: 1,
  },
  beistand: {
    name: "Vertragliche Beistandspflicht",
    text: "Ein Bündnis verpflichtet: glaubwürdig nur mit einem laufenden Vertrag als Beleg.",
    stimmen: 20,
    ansehen: -1,
    uhrStart: 4,
    nationalisten: 1,
  },
  revision: {
    name: "Offene Revision",
    text: "Der ungerahmte Angriff: innen der billigste Auftritt für Hardliner, außen der teuerste — Völkerrecht und Märkte rechnen hart ab.",
    stimmen: -25,
    ansehen: -6,
    uhrStart: -10,
    nationalisten: 4,
  },
};

/**
 * Gegnerische Kriegsstärke je Land (Spielparameter, keine Tatsachen): grob aus Größe, Rüstung und
 * Regionaleigenschaften abgeleitet — bewusst als pauschale Tabelle, damit die Rechnung lesbar bleibt.
 */
const GEGNER_STAERKE: Record<string, number> = {
  USA: 82, RUS: 74, CHN: 88, EU: 55,
  GRC: 52, IRN: 58, SYR: 28, IRQ: 36, ARM: 26, ISR: 64, GEO: 22, CYP: 14, UKR: 40,
  AZE: 34, SAU: 48, EGY: 46, LBY: 20, KAZ: 24,
};
const GEGNER_GRUPPE: Record<string, number> = { "Große Mächte": 78, Nachbarn: 50, "Verbündete und Partner": 40 };

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
    name: "Drohnenverbund",
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
    name: "Mehrschichtige Luftverteidigung",
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
    name: "Strategische Autonomie",
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
  const fehlt = profil.kern.filter(([id, min]) => knotenWert(w, id) < min).map(([id, min]) => `${knotenName(id)} mindestens ${min}`);
  return { doktrin, name: profil.name, passung, konsistent, faktor, fehlt };
}

// ---------------------------------------------------------------------------
// Stärke und Lagebild

/** Laufende Beistands-Klauseln (Bündnisrückhalt wirkt auf die eigene Stärke, flag-basiert wie in Suzerain). */
function beistandAnzahl(w: World): number {
  return alleLaufenden(w).filter((v) => v.gibt.includes("beistand")).length;
}

/**
 * Die eigene Kriegsstärke: Bereitschaft der Teilstreitkräfte, getragen von Moral,
 * multipliziert mit Doktrin-Passung UND Mobilisierung (konsistente Vorbereitung zahlt
 * multiplikativ ein, gemischte verwässert), Nachschub aus Wirtschaftsverkehr (Logistik/Export)
 * und Bündnisrückhalt.
 */
export function eigenStaerke(w: World, k: KriegVorgang): number {
  const b = knotenWert(w, "bereitschaft_heer") * 0.45 + knotenWert(w, "bereitschaft_luft") * 0.35 + knotenWert(w, "bereitschaft_see") * 0.2;
  const moral = 0.65 + 0.35 * (knotenWert(w, "truppenmoral") / 100);
  const dok = doktrinPassung(w).faktor;
  const mob = ([0.55, 0.85, 1.08] as const)[k.mobilmachung] + (k.bereit ? 0.06 : 0);
  const nachschub = clamp(0.72 + 0.0035 * (knotenWert(w, "logistik") - 50) + 0.0025 * (knotenWert(w, "export") - 50), 0.6, 1.1);
  const allianz = 1 + Math.min(0.15, 0.06 * beistandAnzahl(w));
  return b * moral * dok * mob * nachschub * allianz;
}

/** Die vermutete Stärke des Gegners; steigt leicht mit der Eskalation (der Gegner rüstet mit). */
export function gegnerStaerke(w: World, landId: string): number {
  const l = land(landId);
  const k = kriegMit(w, landId);
  const basis = GEGNER_STAERKE[landId] ?? GEGNER_GRUPPE[l.gruppe] ?? 50;
  return basis + (k ? k.eskalation * 0.08 : 0);
}

/** Wie gut das Lagebild über den Gegner ist (LERNKONZEPT: ehrlich über Unsicherheit). */
export function lagebild(w: World): { stufe: "bekannt" | "vermutet" | "unsicher"; text: string } {
  const a = knotenWert(w, "abschreckung");
  if (a >= 60) return { stufe: "bekannt", text: "Das Lagebild des Generalstabs ist belastbar." };
  if (a >= 40) return { stufe: "vermutet", text: "Das Lagebild ist lückenhaft; die Stärke des Gegners ist eine Schätzung (±10)." };
  return { stufe: "unsicher", text: "Das Lagebild ist unsicher: Der Generalstab kann die Gegenstärke nur grob einordnen." };
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
  const roh = 40 + (100 - k.uhrGegner) * 0.55 - (100 - k.uhr) * 0.25 + (k.front - 50) * 0.7 - paketHaerte(p) * 22;
  return Math.round(clamp(roh, 5, 98));
}

export const PAKETE: Record<string, { name: string; text: string; paket: (front: number) => FriedensPaket }> = {
  paket_sieg: {
    name: "Siegerfrieden",
    text: "Gebietsgewinn, Reparationen und Sicherheitsgarantien: der harte Schnitt — innen ein Triumph, außen ein Dauerstreit.",
    paket: () => ({ gebiet: 1, reparation: 1, garantien: true, rueckzug: false }),
  },
  paket_ausgewogen: {
    name: "Ausgewogener Frieden",
    text: "Status quo mit Sicherheitsgarantien und beiderseitigem Rückzug.",
    paket: () => ({ gebiet: 0, reparation: 0, garantien: true, rueckzug: true }),
  },
  paket_weiss: {
    name: "Weißer Frieden",
    text: "Rückzug ohne Bedingungen: Der billigste Ausstieg, innen schwer zu verkaufen, wenn der Krieg lange dauerte.",
    paket: () => ({ gebiet: 0, reparation: 0, garantien: false, rueckzug: true }),
  },
  paket_zugestaendnis: {
    name: "Gekaufter Frieden",
    text: "Gebietsabtretung und Reparationen: erkauft Ruhe um den Preis von Sturzgefahr, Putsch-Risiko und Abhängigkeit.",
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

const nf1 = (x: number) => x.toLocaleString("de-DE", { maximumFractionDigits: 1 });

function demobGrund(w: World): string | undefined {
  const bis = demobSperreBis(w);
  if (bis <= w.day) return undefined;
  return `Die Demobilisierung läuft noch bis ${formatDateDe(addDays(w.date, bis - w.day))}; eine erneute Mobilisierung ist frühestens danach möglich (90-Tage-Rechnung).`;
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
    if (!g && !kannZahlen(kapital, pk)) g = "Dafür fehlt Politisches Kapital.";
    out.push({ id, label, pk, moeglich: !g, ...(g ? { grund: g } : {}), hinweis });
  };
  const demob = demobGrund(w);
  const ph = k.phase;

  if (ph === "spannung" || ph === "drohkulisse") {
    if (!k.bereit) push("bereitschaft", "Truppen in Bereitschaft versetzen", 6, "Abschreckung +3, kleiner Stärkeschub; der Gegner liest es als Eskalation (+4).");
    const signalRest = (k.signalZuletzt ?? -1e9) + 60 - w.day;
    push("signal", "Abschreckungs-Signal senden", 3, "Manöver und scharfe Worte: Abschreckung +2, der Konflikt kühlt leicht (−3).", signalRest > 0 ? `Wieder glaubwürdig in ${signalRest} Tagen.` : undefined);
    push("vermittlung", "Vermittlung rufen", 5, `Vermittler einschalten: Bei Erfolg Eskalation −18 und Konflikt −8; Aussicht hängt an Ansehen (${Math.round(knotenWert(w, "ansehen"))}) und Vertrauen (${Math.round(vertrauenZu(w, k.land))}).`);
    if (!k.kriegszielDeklariert) {
      for (const r of ["verteidigung", "schutz", "beistand", "revision"] as const) {
        const beleg = r === "beistand" && alleLaufenden(w).every((v) => v.land !== k.land) ? "Ohne laufenden Vertrag mit diesem Land wirkt die Beistands-Rahmung unglaubwürdig (Ansehen −3 zusätzlich)." : undefined;
        push(`ziel_${r}`, `Kriegsziel deklarieren: ${RAHMUNG[r].name}`, 8, `${RAHMUNG[r].text} Legt die Preise aller Folgehandlungen fest (Parlament ${RAHMUNG[r].stimmen >= 0 ? "+" : ""}${RAHMUNG[r].stimmen} Stimmen, Ansehen ${RAHMUNG[r].ansehen}).`, beleg);
      }
    }
    push("deeskalation", "Die Lage beruhigen", 4, "Konflikt −10, Eskalation −12; Nationalisten zu Hause lesen es als Schwäche (−1). Unter der Ruheschwelle endet der Vorgang.");
    push("rueckzug", "Still zurückziehen", 6, "Der Vorgang endet: Konflikt −15, Vertrauen +4 — aber Ansehen −2 und Nationalisten −3.");
  }
  if (ph === "drohkulisse") {
    if (k.mobilmachung === 0) push("mobil_teil", "Teilmobilmachung anordnen", 8, "Reserven einziehen: Stärke deutlich höher; kostet 0,3 % des BIP, Eskalation +8, Junge −1.", demob);
    if (k.mobilmachung < 2) push("mobil_voll", "Vollmobilmachung anordnen", 14, "Der Staat stellt sich auf Krieg um: höchste Stärke; kostet 0,7 % des BIP, Eskalation +14, Junge −3, städtische Säkulare −2, die Uhr trägt die Last.", demob);
    if (!k.kriegszielDeklariert) {
      // Ohne deklariertes Kriegsziel kein Beschluss: Die Rahmung ist Pflicht (Civ6-Preisschild).
    } else {
      const stimmen = stimmenSicht(w, { massnahme: "m_verteidigung", richtung: 1 }).erwartet + RAHMUNG[k.rahmung!].stimmen;
      push("beschluss", "Einsatzbeschluss ins Parlament einbringen", 10, `Abstimmung in ${KRIEG.beschlussTage} Tagen; erwartet werden etwa ${Math.round(stimmen)} von 301 nötigen Stimmen. Scheitert er, gilt das als Schwäche.`);
      push("beschluss_erlass", "Einsatz per Erlass anordnen", 20, "Umgeht das Parlament: sofortiger Beschluss, doppelte Kosten, Vertrauen und Legitimität leiden (−3 / −2,5).");
    }
  }
  if (ph === "beschluss" && k.beschluss?.weg === "parlament") {
    // Warten auf die Abstimmung; ein Rückzug des Beschlusses wäre ein Gesichtsverlust — bewusst nicht angeboten (v1).
  }
  if (ph === "krieg") {
    const rest = (k.verstaerkungZuletzt ?? -1e9) + 21 - w.day;
    push("verstaerkung", "Reserven und Nachschub verstärken", 6, "Front-Schub +3 in der nächsten Woche; kostet 0,25 % des BIP. Der Präsident bestellt, der Generalstab führt.", rest > 0 ? `Wieder möglich in ${rest} Tagen.` : undefined);
    push("waffenruhe", "Waffenruhe anbieten", 5, "Der Gegner nimmt an, wenn er erschöpft ist oder die Front verloren gibt; lehnt er ab, gilt das Angebot zu Hause als Schwäche (Uhr −3).");
    if (k.mobilmachung < 2) push("mobil_voll", "Vollmobilmachung nachziehen", 14, "Auch mitten im Krieg möglich; teuer und spät.", demob);
  }
  if (ph === "waffenruhe") {
    for (const [id, def] of Object.entries(PAKETE)) {
      if (id === "paket_sieg" && k.front < 55) continue;
      if (id === "paket_zugestaendnis" && k.front > 45) continue;
      const p = def.paket(k.front);
      const aussicht = paketAnnahme(w, k, p);
      push(id as KriegHandlungId, `Friedenspaket: ${def.name}`, 4, `${def.text} Annahme-Aussicht etwa ${aussicht} %. Der Innenpreis steht schon jetzt fest (freie Presse verteuert ihn).`);
    }
    push("weiterkaempfen", "Weiterkämpfen", 2, "Zurück an die Front: die Uhr verliert 5 Punkte, die Heimatfront ist irritiert.");
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
  if (!spiel) return { ok: false, text: "Ohne Spielschleife gibt es keinen Konfliktvorgang." };
  if (!k) return { ok: false, text: "Diesen Konfliktvorgang gibt es nicht (mehr)." };
  const sicht = handlungenFuer(w, kriegId).find((x) => x.id === handlungId);
  if (!sicht) return { ok: false, text: "Diese Handlung gibt es in dieser Phase nicht." };
  if (!sicht.moeglich) return { ok: false, text: sicht.grund ?? "Das geht gerade nicht." };
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
  let why = `Kostet ${sicht.pk} Kapital.`;
  switch (handlungId) {
    case "bereitschaft": {
      k.bereit = true;
      k.eskalation = clamp(k.eskalation + 4, 0, 100);
      wirke(w, "abschreckung", 3);
      landAendern(w, k.land, { konflikt: 2 }, "Truppen in Bereitschaft");
      text = `Die Streitkräfte gehen in erhöhte Bereitschaft; ${l.name} registriert es.`;
      why += " Abschreckung +3; der Gegner liest es als Eskalation.";
      break;
    }
    case "signal": {
      k.signalZuletzt = w.day;
      wirke(w, "abschreckung", 2);
      landAendern(w, k.land, { konflikt: -3 }, "Abschreckungs-Signal aus Ankara");
      k.eskalation = clamp(k.eskalation - 4, 0, 100);
      text = `Manöver und scharfe Worte Richtung ${l.akk}: Die Drohkulisse bleibt, aber der Ton ist gesetzt.`;
      break;
    }
    case "vermittlung": {
      const aussicht = clamp(30 + (knotenWert(w, "ansehen") - 45) * 0.8 + (vertrauenZu(w, k.land) - 35) * 0.6 - (k.eskalation - 50) * 0.4, 5, 85);
      const zufall = rng ? rng.next() * 100 : 50;
      if (zufall < aussicht) {
        k.eskalation = clamp(k.eskalation - 18, 0, 100);
        landAendern(w, k.land, { konflikt: -8, vertrauen: 3 }, "Vermittlung nimmt Fahrt auf");
        wirke(w, "ansehen", 2);
        text = `Die Vermittlung mit ${l.dat} greift: Gesprächskanäle öffnen sich, die Eskalation lässt nach.`;
        why += ` Aussicht lag bei ${Math.round(aussicht)} %; Ansehen +2.`;
      } else {
        landAendern(w, k.land, { vertrauen: -2 });
        wirke(w, "ansehen", -1);
        text = `Die Vermittlung mit ${l.dat} scheitert an den Vorbedingungen der Gegenseite.`;
        why += ` Aussicht lag bei ${Math.round(aussicht)} %; Ansehen −1.`;
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
        landAendern(w, "EU", { konflikt: 6, vertrauen: -4 }, "Offene Revisionspolitik Ankaras");
      }
      text = `Die Regierung deklariert ihr Kriegsziel gegenüber ${l.dat}: ${RAHMUNG[r].name}.`;
      why += ` Die Rahmung legt die Preise aller Folgehandlungen fest (Parlament ${RAHMUNG[r].stimmen >= 0 ? "+" : ""}${RAHMUNG[r].stimmen} Stimmen).${extra ? " Der Beleg ist dünn; das Ausland notiert es." : ""}`;
      break;
    }
    case "deeskalation": {
      landAendern(w, k.land, { konflikt: -10 }, "Deeskalation aus Ankara");
      k.eskalation = clamp(k.eskalation - 12, 0, 100);
      wirke(w, "nationalisten", -1);
      wirke(w, "staedtische_saekulare", 1);
      text = `Ankara dämpft den Ton gegenüber ${l.dat}; die Spannung lässt nach.`;
      why += " Nationalisten lesen es als Schwäche; die städtische Mitte atmet auf.";
      break;
    }
    case "rueckzug": {
      landAendern(w, k.land, { konflikt: -15, vertrauen: 4 }, "Stiller Rückzug Ankaras");
      wirke(w, "ansehen", -2);
      wirke(w, "nationalisten", -3);
      beendeVorgang(w, k, "rueckzug");
      text = `Die Regierung zieht ihre Position gegenüber ${l.dat} still zurück; der Vorgang endet.`;
      why += " Das Gesicht verliert mehr als die Lage: Ansehen −2, Nationalisten −3.";
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
      belastungEreignis(w, VERFASSUNG.eskalation, voll ? "Vollmobilmachung" : "Teilmobilmachung");
      text = voll ? "Die Vollmobilmachung wird angeordnet: Reserven, Materiel, Transportpläne — der Staat stellt sich auf Krieg um." : "Die Teilmobilmachung wird angeordnet: Ausgewählte Reserven und Verbände gehen in Bereitschaft.";
      why += ` ${voll ? "0,7" : "0,3"} % des BIP als Zusatzlast; die Demobilisierung wird später erneut kosten (90-Tage-Rechnung).`;
      break;
    }
    case "beschluss": {
      k.beschluss = { weg: "parlament", abstimmung: w.day + KRIEG.beschlussTage, rahmung: k.rahmung! };
      phaseSetzen(w, k, "beschluss");
      text = `Der Einsatzbeschluss gegen ${l.akk} geht ins Parlament; die Abstimmung ist in ${KRIEG.beschlussTage} Tagen.`;
      why += " Ohne Mehrheit gilt die Einbringung als Schwäche; Absprachen und Stimmung entscheiden.";
      break;
    }
    case "beschluss_erlass": {
      vertrauenAendern(w, -3);
      wirke(w, "legitimitaet", -2.5);
      k.beschluss = { weg: "erlass", abstimmung: w.day, rahmung: k.rahmung! };
      text = `Per Erlass, am Parlament vorbei: Der Einsatz gegen ${l.akk} ist beschlossen.`;
      why += " Doppelte Kosten, Vertrauen −3, Legitimität −2,5; das Parlament vergisst den Affront nicht.";
      addLog(w, "entscheidung", text, why);
      kriegsbeginn(w, k, "erlass");
      return { ok: true, text, why };
    }
    case "verstaerkung": {
      k.verstaerkungZuletzt = w.day;
      k.frontSchub = (k.frontSchub ?? 0) + 3;
      kosten(w, 0.25);
      text = "Reserven und Nachschub werden an die Front geordnet; der Generalstab verrechnet sie in der nächsten Woche.";
      break;
    }
    case "waffenruhe": {
      if (k.uhrGegner <= 55 || k.front >= 62 || k.uhr <= 40) {
        text = `${l.name} nimmt die Waffenruhe an; die Waffen schweigen, der Verhandlungstisch wartet.`;
        addLog(w, "entscheidung", text, why);
        waffenruheEintreten(w, k);
        return { ok: true, text, why };
      }
      k.uhr = clamp(k.uhr - 3, 0, 110);
      k.eskalation = clamp(k.eskalation + 2, 0, 100);
      text = `${l.name} lehnt die Waffenruhe ab — die Gegenseite fühlt sich nicht erschöpft genug.`;
      why += " Das Angebot gilt zu Hause als Schwäche (Uhr −3).";
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
      text = `${l.name} weist das Paket zurück (Aussicht ${aussicht} %): Die Gegenseite fühlt sich noch nicht erschöpft genug. Die Waffenruhe hält vorerst.`;
      why += " Ein verworfenes Paket kostet nichts als Zeit — aber die Uhr läuft auf beiden Seiten nicht rückwärts.";
      break;
    }
    case "weiterkaempfen": {
      k.uhr = clamp(k.uhr - 5, 0, 110);
      k.gegnerAngebot = false;
      phaseSetzen(w, k, "krieg");
      text = "Die Regierung befiehlt die Wiederaufnahme der Operationen; die Heimatfront reagiert irritiert (Uhr −5).";
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
  hinweis(w, `krieg-waffenruhe-${k.id}-${w.day}`, `Waffenruhe mit ${l.name}`, [
    `Die Waffen schweigen im Konflikt mit ${l.name}. Am Verhandlungstisch wartet die eigentliche Rechnung: Gebiet, Reparationen, Garantien, Rückzug.`,
    "Der Innenpreis des Friedens hängt auch von der Presse ab: Je freier die Medien, desto sichtbarer — und teurer — ist jede Nachgiebigkeit.",
  ]);
  addLog(w, "ereignis", `Waffenruhe mit ${l.name}.`, "Die Waffenruhe hält, solange ein Friedenspaket oder die Rückkehr zum Krieg entschieden ist.");
}

/** Das Waffenruhe-Angebot des Gegners annehmen (Ereignis krieg_waffenruhe). */
export function waffenruheFuerAngebot(w: World, kriegId: string): string {
  const k = kriegZu(w, kriegId);
  if (!k || k.phase !== "krieg") return "Das Angebot ist gegenstandslos geworden.";
  waffenruheEintreten(w, k);
  return `Die Waffenruhe mit ${land(k.land).name} tritt in Kraft; der Verhandlungstisch öffnet sich.`;
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
  const staerkeDelta = eigenStaerke(w, k) - gegnerStaerke(w, k.land);
  k.front = clamp(50 + staerkeDelta * 0.25, 25, 75);
  k.frontVorher = k.front;
  k.uhr = clamp(100 + RAHMUNG[rahmung].uhrStart, 0, 110);
  k.uhrGegner = 100;
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
  landAendern(w, k.land, { vertrauen: -15, konflikt: 10 }, "Krieg");
  const z = weltZustand(w)[k.land]!;
  z.konflikt = Math.max(z.konflikt, 85);
  // Drittländer-Ausstrahlung: Rivalen des Gegners rücken näher, Nervöse ziehen sich zurück
  for (const [rivale, plus] of Object.entries(AUSSTRAHLUNG_RIVALEN[k.land] ?? {})) landAendern(w, rivale, { vertrauen: plus }, `Krieg zwischen der Türkei und ${l.dat}`);
  for (const x of LAENDER) {
    if (x.id === k.land) continue;
    const xx = weltZustand(w)[x.id]!;
    if (xx.konflikt >= 55) landAendern(w, x.id, { vertrauen: -2 }, "Sorge vor Ausweitung des Krieges");
    else if (vertrauenZu(w, x.id) >= 60) landAendern(w, x.id, { vertrauen: -1 }, "Sorge über den Krieg Ankaras");
  }
  belastungEreignis(w, VERFASSUNG.eskalation, `Kriegsbeginn mit ${l.name}`);
  const einstieg =
    weg === "angriff"
      ? `${l.name} schlägt zu: Ohne eigenen Beschluss steht die Türkei im Krieg — die Rahmung der Selbstverteidigung liegt auf der Hand.`
      : weg === "erlass"
        ? `Per Erlass beginnt der Einsatz gegen ${l.akk}; das Parlament wurde umgangen.`
        : `Mit dem Votum des Parlaments beginnt der Einsatz gegen ${l.akk}.`;
  hinweis(w, `krieg-beginn-${k.id}-${w.day}`, `Krieg mit ${l.name}`, [
    einstieg,
    `Die Frontlage startet bei ${Math.round(k.front)} von 100. Der Präsident bestellt und verantwortet — geführt wird an der Front vom Generalstab; wöchentliche Lageberichte zeigen Trend und Erschöpfung.`,
  ]);
  addLog(w, "ereignis", `Krieg mit ${l.name}: ${einstieg}`, `Rahmung „${RAHMUNG[rahmung].name}“, Märkte reagieren mit einem Risikoaufschlag.`);
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
    addLog(w, "entscheidung", `Das Parlament beschließt den Einsatz gegen ${l.akk} (${ja} zu ${nein}).`, `Rahmung „${RAHMUNG[b.rahmung].name}“${bonus ? ` (Bonus ${bonus >= 0 ? "+" : ""}${bonus})` : ""}.`);
    kriegsbeginn(w, k, "parlament");
  } else {
    phaseSetzen(w, k, "drohkulisse");
    k.eskalation = clamp(k.eskalation + 4, 0, 100);
    vertrauenAendern(w, -1.2);
    spiel.umfrage.zustimmung = Math.max(0, spiel.umfrage.zustimmung - 0.8);
    addLog(w, "entscheidung", `Das Parlament lehnt den Einsatzbeschluss gegen ${l.akk} ab (${ja} zu ${nein}).`, "Die Regierung wirkt geschwächt; die Gegenseite liest es als Einladung, die Drohkulisse zu halten.");
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
  landAendern(w, k.land, { vertrauen: -20, konflikt: 20 }, "Krieg gewonnen gegen die Türkei");
  const zz = weltZustand(w)[k.land]!;
  zz.konflikt = clamp(Math.min(zz.konflikt, 60), 0, 100);
  demobStarten(w, k);
  phaseSetzen(w, k, "beendet");
  k.ausgang = "niederlage";
  hinweis(w, `krieg-niederlage-${k.id}-${w.day}`, `Niederlage gegen ${l.name}`, [
    `Der Einsatz gegen ${l.akk} ist verloren: Reparationen, ein Risikoaufschlag der Märkte und ein Land in Ernüchterung. Der Zustimmungsverlust fällt bei ${knotenWert(w, "pressefreiheit") >= 50 ? "freier" : "gelenkter"} Presse aus wie erwartet (${nf1(po)} Punkte).`,
    knotenWert(w, "offiziersvertrauen") < KRIEG.putschAb
      ? "Im Generalstab wird offen über die Verantwortung gesprochen; das Vertrauen der Offiziere ist zerbrochen."
      : "Die Offiziere tragen die Niederlage vorerst mit — das Vertrauen ist angeknackst, nicht zerbrochen.",
  ]);
  spiel.chronik.push({ tag: w.day, datum: w.date, titel: `Niederlage gegen ${l.name}`, ausgang: "Der Krieg endet mit Reparationen und einem tiefen innenpolitischen Schaden." });
  addLog(w, "ereignis", `Niederlage gegen ${l.name}.`, `Reparationen (2 % des BIP), Märkte unter Druck, Zustimmung −${nf1(po)}.`);
  // Gebietsabtretung und Niederlage sind der klassische Putsch-Auslöser (Suzerain: Estord und Narbel)
  pruefePutsch(w, k, rng);
}

function demobStarten(w: World, k: KriegVorgang): void {
  if (k.mobilmachung === 0) return;
  k.mobilmachung = 0;
  k.demobBis = w.day + KRIEG.demobTage;
  k.demobSperreBis = w.day + KRIEG.demobTage;
  hinweis(w, `krieg-demob-${k.id}-${w.day}`, "Demobilisierung", [
    `Die Reserven kommen über ${KRIEG.demobTage} Tage nach Hause; die Rechnung läuft mit (etwa ${KRIEG.demobKostenMonat} % des BIP je Monat).`,
    `Eine erneute Mobilisierung ist frühestens am ${formatDateDe(addDays(w.date, KRIEG.demobTage))} möglich.`,
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
    landAendern(w, k.land, { konflikt: 25, vertrauen: -10 }, "Gebietsabtretung an die Türkei");
    teile.push(`Gebietsgewinn (Ansehen ${ansehen}: selbst der Siegerfrieden hat einen Weltpreis)`);
    if (k.rahmung !== "verteidigung") basis += 3;
  }
  if (p.gebiet === -1) {
    wirke(w, "offiziersvertrauen", -15);
    wirke(w, "nationalisten", -10);
    wirke(w, "konservative", -4);
    basis += 8;
    teile.push("Gebietsabtretung (Offiziersvertrauen −15: das Offizierskorps vergisst das nicht)");
  }
  if (p.reparation === 1) {
    kosten(w, -0.8);
    wirke(w, "nationalisten", 2);
    teile.push("Reparationen an die Türkei (Schuldenquote −0,8)");
  }
  if (p.reparation === -1) {
    kosten(w, 1.2);
    basis += 6;
    // Gekaufter Frieden erzeugt Abhängigkeit (Suzerain: Beatrice-Deal)
    landAendern(w, k.land, { handel: 10 }, "Gekaufter Frieden: wirtschaftliche Verflechtung als Pfand");
    teile.push("Reparationen von der Türkei (1,2 % des BIP) — gekaufter Frieden schafft Abhängigkeit");
  }
  if (p.garantien) {
    landAendern(w, k.land, { konflikt: -15, vertrauen: 5, sicherheit: 6 }, "Sicherheitsgarantien");
    teile.push("Sicherheitsgarantien an der Grenze");
  }
  if (p.rueckzug) {
    landAendern(w, k.land, { konflikt: -10 }, "Gegenseitiger Truppenrückzug");
    wirke(w, "truppenmoral", 2);
    teile.push("beiderseitiger Rückzug");
  }
  if (k.ausgang === "weisser_frieden" && k.woche >= 10) basis += 2;
  // Innenpreis, presse-multipliziert (Suzerain: freie Presse verteuert den Frieden)
  const po = poVerlustFuer(w, basis);
  if (po > 0) {
    spiel.umfrage.zustimmung = Math.max(0, spiel.umfrage.zustimmung - po);
    vertrauenAendern(w, -po * 0.4);
  }
  k.friedenspreis = po;
  // Erleichterung an den Märkten und bei den Kriegsmüden
  w.economy.riskPremium = Math.max(0, w.economy.riskPremium - 80);
  wirke(w, "staedtische_saekulare", 2);
  wirke(w, "junge", 2);
  demobStarten(w, k);
  const z = weltZustand(w)[k.land]!;
  z.konflikt = Math.min(z.konflikt, 45);
  spiel.chronik.push({ tag: w.day, datum: w.date, titel: `Frieden mit ${l.name}`, ausgang: `${PAKETE[paketId]!.name}: ${teile.join("; ") || "weißer Frieden"}.` });
  hinweis(w, `krieg-frieden-${k.id}-${w.day}`, `Frieden mit ${l.name}`, [
    `Das Paket „${PAKETE[paketId]!.name}“ ist unterschrieben: ${teile.join("; ") || "Rückzug ohne Bedingungen"}.`,
    po > 0 ? `Der Innenpreis: Zustimmung −${nf1(po)} (bei ${knotenWert(w, "pressefreiheit") >= 50 ? "freier" : "gelenkter"} Presse; freie Presse verteuert jeden Frieden).` : "Innenpolitisch bleibt der Frieden nahezu preiswert.",
  ]);
  const text = `Frieden mit ${l.name} („${PAKETE[paketId]!.name}“): ${teile.join("; ") || "weißer Frieden"}.`;
  const why = po > 0 ? `Innenpreis: Zustimmung −${nf1(po)} (Presse-Faktor ${nf1(presseFaktor(w))}). Märkte atmen auf (−80 Risikopunkte).` : "Märkte atmen auf (−80 Risikopunkte).";
  addLog(w, "entscheidung", text, why);
  // Gebietsabtretung: Putsch-Risiko-Ereignis (Suzerain: Estord und Narbel)
  if (p.gebiet === -1) pruefePutsch(w, k, rng);
  return { ok: true, text, why };
}

function beendeVorgang(w: World, k: KriegVorgang, ausgang: KriegVorgang["ausgang"]): void {
  phaseSetzen(w, k, "beendet");
  k.ausgang = ausgang;
  addLog(w, "ereignis", `Der Konfliktvorgang mit ${land(k.land).name} endet (${ausgang === "rueckzug" ? "Rückzug" : ausgang}).`, "");
}

// ---------------------------------------------------------------------------
// Motor: Tages-, Wochen- und Monatsschritt

function kriegWoche(w: World, k: KriegVorgang, rng: Rng): void {
  const l = land(k.land);
  k.woche += 1;
  const eigen = eigenStaerke(w, k);
  const gegner = gegnerStaerke(w, k.land);
  let delta = clamp((eigen - gegner) * KRIEG.frontFaktor, -KRIEG.frontMaxDelta, KRIEG.frontMaxDelta);
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

  // Erschöpfungsuhren (Vic3-Wochen-Tabelle: Basis +, Verluste +, Gewinne −, Wirtschaftslage ±)
  const wirtschaftsdruck = clamp((1.5 - w.economy.growth) * 0.3, -0.45, 0.6);
  k.uhr += -(KRIEG.uhrBasis + verlustWoche * KRIEG.uhrVerlust + (k.mobilmachung === 2 ? KRIEG.uhrVollLast : 0) + Math.max(0, wirtschaftsdruck)) + gewinnWoche * KRIEG.uhrGewinn + Math.min(0, wirtschaftsdruck);
  k.uhrGegner += -(KRIEG.uhrBasis + gewinnWoche * KRIEG.uhrVerlust) + verlustWoche * KRIEG.uhrGewinn;
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
    hinweis(w, `krieg-kipp-u-${k.id}-${k.woche}`, `Frontlage kippt: ${l.name}`, [`Die Lage im Konflikt mit ${l.name} verschlechtert sich: Front ${Math.round(k.front)} von 100, Trend fallend. Reserven, Nachschub oder der Weg an den Verhandlungstisch — der Spielraum wird enger.`]);
    addLog(w, "ereignis", `Frontlage kippt gegen ${l.name} (${Math.round(k.front)}).`, "Die Heimatfront liest die Verlustmeldungen; die Uhr fällt schneller als die Front.");
  }
  if (k.frontVorher <= KRIEG.kippOben && k.front > KRIEG.kippOben) {
    hinweis(w, `krieg-kipp-o-${k.id}-${k.woche}`, `Frontlage dreht: ${l.name}`, [`Die Lage im Konflikt mit ${l.name} verbessert sich deutlich: Front ${Math.round(k.front)} von 100, Trend steigend. Erfolg ist die beste Medizin für die Heimatfront — und die Versuchung, den Preis des Friedens hochzuschrauben.`]);
    addLog(w, "ereignis", `Frontlage dreht gegen ${l.name} (${Math.round(k.front)}).`, "Der Generalstab meldet Geländegewinne; die Verhandlungsposition wächst.");
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
    addLog(w, "ereignis", `${l.name} ist erschöpft und tritt den Rückzug an.`, "Die Gegenseite akzeptiert jedes Paket mit Gesichtswahrung; der Verhandlungstisch gehört Ihnen.");
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
          belastungEreignis(w, VERFASSUNG.eskalation, `Drohkulisse mit ${land(k.land).name}`);
          addLog(w, "ereignis", `Die Lage mit ${land(k.land).name} spitzt sich zur Drohkulisse zu.`, "Jetzt zählt jede Handlung: Mobilisierung, Rahmung, Vermittlung — oder der teure Ausstieg.");
          // Auto-Stopp Klasse A: Die Eskalation verlangt eine Entscheidung
          oeffne(w, "krieg_drohkulisse", rng, { daten: { land: k.land, vorgang: k.id } });
        } else if (k.eskalation <= KRIEG.spannungAus && (weltZustand(w)[k.land]?.konflikt ?? 100) < 45) {
          beendeVorgang(w, k, "rueckzug");
        }
        break;
      }
      case "drohkulisse": {
        if (k.eskalation >= KRIEG.angriffAb && !k.beschluss) {
          addLog(w, "ereignis", `${land(k.land).name} schlägt zu.`, "Die Drohkulisse kippt ohne eigenen Beschluss in den Krieg; die Selbstverteidigungs-Rahmung liegt auf der Hand.");
          if (!k.rahmung) k.rahmung = "verteidigung";
          kriegsbeginn(w, k, "angriff");
        } else if (k.eskalation <= KRIEG.drohkulisseAus) {
          phaseSetzen(w, k, "spannung");
          addLog(w, "ereignis", `Die Drohkulisse mit ${land(k.land).name} löst sich auf.`, "Die Spannung bleibt; der Vorgang ist noch nicht vorbei.");
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
      addLog(w, "ereignis", "Die Demobilisierung ist abgeschlossen.", "Die Reserven sind entlassen; die 90-Tage-Rechnung ist bezahlt. Eine erneute Mobilisierung ist wieder möglich.");
    }
  }
}

/** Der monatliche Schritt: neue Spannungen aus der Konflikt-Dimension, Demobilisierungs-Rechnung. */
export function kriegMonat(w: World, rng: Rng): void {
  const spiel = w.spiel;
  if (!spiel || spiel.ende) return;
  // Demobilisierungs-Rechnung (Vic3: 90 Tage Auslauf mit laufenden Kosten)
  for (const k of kriege(w)) {
    if (k.demobBis !== undefined && w.day < k.demobBis) {
      kosten(w, KRIEG.demobKostenMonat);
      addLog(w, "ereignis", `Demobilisierungs-Rechnung: ${KRIEG.demobKostenMonat} % des BIP.`, `Reserven nach Hause bringen kostet wie das Hochfahren; noch bis ${formatDateDe(addDays(w.date, k.demobBis - w.day))}.`);
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
    hinweis(w, `krieg-spannung-${k.id}`, `Spannung mit ${l.name}`, [
      `Der Konflikt mit ${l.name} hat eine Schwelle überschritten (${Math.round(z[l.id]!.konflikt)} von 100): Aus Zwischenfällen wird ein Vorgang, der eigene Entscheidungen verlangt.`,
      "Die Eskalationsphase ist die Hauptspielfläche: Bereitschaft, Signale, Vermittlung — oder die Deklaration eines Kriegsziels, das die Preise aller Folgehandlungen festlegt.",
    ]);
    addLog(w, "ereignis", `Spannung mit ${l.name}: Der Konflikt wird zum Vorgang.`, "Das Dossier steht in der Welt-Ansicht beim Land; jede Handlung hat dort ihren Preis.");
    void rng;
  }
}
