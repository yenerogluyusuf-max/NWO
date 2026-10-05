// Medien als System (Runde 2, Fork MEDIEN, 05.10.2026; Konzept SPIEL_DURCHDACHT_2026-10-05.md, Welle 4).
//
// Bis hierher waren die sieben Medien-Cluster (data/medien.ts) Daten ohne Mechanik: Eigentümer, Verwundbarkeit und Preise standen in
// einer Liste, die Zeitung nutzte nur die Ausrichtung. Dieses Modul gibt jedem Cluster einen Zustand und dem Spieler Eingriffe mit Preis:
//
//   medienVon(w)                    Zustand je Cluster (Eigentümer, Lizenz, Selbstzensur, Reichweite, Abhängigkeit, Druck, Märtyrer)
//   medienAktionen(w)               alle möglichen Eingriffe mit Kosten, Vorschau der Folgen und Grund, wenn etwas nicht geht
//   fuehreMedienAktionAus(w, …)     einen Eingriff ausführen: Kapital, Aufmerksamkeit, Zustand, Märkte, Ausland, Straße, Gegenreaktion
//   medienMonat(w)                  monatlich: Regler → Lizenzen, Selbstzensur klingt ab, Reichweite folgt dem Druck, Kippen der
//                                   opportunistischen Blätter, Pressefreiheitswert, Kontrollrendite und ihr Preis
//   wirksamerCluster(w, cluster)    der Cluster, wie er jetzt wirkt (Zeitung und Wirkung lesen ihn statt der starren Daten)
//   angezeigteZustimmung(w)         was der Spieler zu sehen bekommt: der Strom der Institute, nicht die nackte Wahrheit
//   rohdatenKaufen(w)               die Wahrheit gegen Kapital und Wartezeit
//
// Die Dauerkanäle bleiben die Regler m_medienaufsicht, m_internetsperren und m_staatsmedien (Politiknetz): Sie setzen die Lizenzlage
// (hohe Stufen schließen wirklich Sender); die Eingriffe setzen Zustände und Stöße darüber hinaus. Alle Zahlen sind Spielparameter
// (Platzhalter der Kalibrierung), keine Messwerte; die Referenzwerte der Preise stehen in data/medien.ts (REGULIERUNG_PREISE).

import type { World } from "./types";
import type { ChronikEintrag } from "./spiel-typen";
import { MEDIEN_CLUSTER, REGULIERUNG_PREISE, RSF_START, medienCluster, type MedienCluster, type MedienAusrichtung } from "../data/medien";
import { FEHLER_GENERATOR, umfrageInstitut } from "../data/umfrage_institute";
import { NET } from "./modell";
import { nationalAverage } from "./netz";
import { wirke } from "./wirkung";
import { addLog } from "./log";
import { clamp } from "./economy";
import { kannZahlen } from "./kapital";
import { hashWert, neuanfangGrund, verbrauche } from "./aufmerksamkeit";
import { marktSchock } from "./maerkte";
import { t } from "../i18n";

// ---------------------------------------------------------------------------
// Spielparameter

export const MEDIEN = {
  /** Anteil, mit dem Selbstzensur über dem Startwert pro Monat abklingt */
  selbstzensurAbklang: 0.04,
  /** Anteil, mit dem die Reichweite pro Monat ihrem Ziel folgt */
  reichweiteTempo: 0.2,
  /** Monatlicher Abklang der Drücke (Finanzen, Plattform), des Märtyrer-Effekts und der laufenden Verfahren */
  druckAbklang: 0.1,
  maertyrerAbklang: 0.1,
  verfahrenAbklang: 0.1,
  ausweichAbklang: 0.03,
  /** Tage Pause je Eingriff und Cluster, davor wirkt er nicht noch einmal */
  pause: 25,
  /** Tage Sperre durch einen Lizenzentzug, danach darf das Blatt wieder erscheinen (unter Druck) */
  lizenzentzugTage: 240,
  blackoutTage: 10,
  /** Zustimmung, unter der ein opportunistisches Blatt kippt, und die Schwelle für die Rückkehr (Hysterese) */
  kippSchwelle: 40,
  kippRueck: 48,
  /** Kontrollrendite: Anteil der Selbstzensur über dem Start (Reichweite-gewichtet), der monatlich Vertrauen bringt … */
  renditeVertrauen: 0.015,
  renditeMax: 0.6,
  /** … und was er an Legitimität und Ansehen kostet */
  renditeLegitimitaet: 0.012,
  renditeAnsehen: 0.01,
  /** Der Pressefreiheitswert nähert sich jeden Monat dem Wert, den das Netz hergibt */
  rsfNaehe: 0.1,
  /** Wie stark der Netzknoten pressefreiheit auf den Zielwert des Index wirkt */
  rsfNetz: 0.3,
  /** Rang je Punkt Score (Spielparameter: Start Rang 159 bei 29,4) */
  rsfRangProPunkt: 3,
  /** Stärke, mit der eine Interview-Offensive wohlwollende Berichte erzeugt, und wie lange (Tage) */
  wohlwollenTage: 90,
  wohlwollenFaktor: 0.85,
  /** Tage Wartezeit und Gültigkeit der gekauften Rohdaten, Kosten */
  rohdaten: { kapital: 3, aufmerksamkeit: 8, wartetage: 7, gueltigTage: 45 },
  /** Anzahl Einträge im Verlauf der Eingriffe und des Pressefreiheitswerts */
  eingriffeMax: 40,
  verlaufMax: 60,
  /**
   * Wirkung eines Eingriffs je Punkt Pressefreiheitswert (Kalibrierung gegen Bots, 05.10.): Der Netzknoten pressefreiheit, Ausland,
   * Gruppen und die kurze Ruhe, die Kontrolle verschafft („Kontrolle über die Medien verschafft kurz Ruhe, kostet aber Glaubwürdigkeit“).
   * `markt` skaliert den Marktschock der Aktion.
   */
  wirkung: { pressefreiheitNetz: 1, ansehen: 0.25, eu: 0.3, staedtisch: 0.35, junge: 0.25, konservative: 0.3, ruhe: 0.45, markt: 0.6 },
  /** Kleine Beruhigung durch Pressekonferenz und Interview: Vertrauen und Ansehen je Ausführung */
  gespraech: { vertrauen: 0.5, ansehen: 0.25, interview: 0.5 },
} as const;

// ---------------------------------------------------------------------------
// Typen

export type Eigentuemer = "staatsnah" | "opportunistisch" | "privat" | "oppositionell";
export type Lizenz = "frei" | "gedraengt" | "gesperrt";

export type AktionId =
  | "eigentuemerdruck"
  | "staatsanzeigen"
  | "anzeigenstopp"
  | "aufsichtsstrafe"
  | "blackout"
  | "lizenzentzug"
  | "verfahren"
  | "sperre_netz"
  | "uebernahme"
  | "pressekonferenz"
  | "interview";

export interface ClusterZustand {
  eigentuemer: Eigentuemer;
  /** Lizenz durch Eingriffe (die Regler können sie zusätzlich verschärfen, siehe lizenzVon) */
  lizenz: Lizenz;
  /** Sperre durch Blackout oder Lizenzentzug bis zu diesem Spieltag */
  gesperrtBis?: number;
  /** 0 bis 100: Wie sehr die Redaktion von sich aus weglässt */
  selbstzensur: number;
  /** Faktor auf die Reichweite (1 = Start); 0 bei gesperrtem Blatt wird in `reichweiteJetzt` berechnet */
  reichweite: number;
  /** 0 bis 100: Anteil der Einnahmen aus Staatsanzeigen und Aufträgen */
  abhaengigkeit: number;
  finanzdruck: number;
  plattformDruck: number;
  /** 0 bis 100: Aufmerksamkeit, die Verfolgung dem Blatt verschafft (Streisand-Effekt) */
  maertyrer: number;
  wohlwollenBis?: number;
  /** Opportunistisches Blatt hat sich vom Lager gelöst */
  gekippt?: boolean;
  uebernommen?: boolean;
  lizenzentzugGenutzt?: boolean;
  /** Lizenzlage aus den Reglern, im Monatsschritt berechnet */
  reglerLizenz: Lizenz;
}

export interface EingriffEintrag {
  tag: number;
  datum: string;
  aktion: AktionId;
  cluster?: string;
  text: string;
  /** Wie viele Punkte des Pressefreiheitswerts der Eingriff gekostet hat (negativ = gewonnen) */
  rsf: number;
}

export interface MedienZustand {
  v: 1;
  cluster: Record<string, ClusterZustand>;
  /** Der lebende Pressefreiheitswert (Start 29,4) */
  rsfScore: number;
  rsfVerlauf: { tag: number; datum: string; score: number }[];
  eingriffe: EingriffEintrag[];
  /** Letzter Tag je „aktion|cluster“ (Pause) */
  zuletzt: Record<string, number>;
  /** 0 bis 100: Wie viel Aufmerksamkeit in soziale Netze ausweicht */
  ausweich: number;
  /** Laufende Verfahren gegen Journalisten (klingen ab); erhöht die Chance auf den Pressekonflikt */
  verfahren: number;
  /** Gekaufte Rohdaten: bestellt, bereit ab, gültig bis (Spieltage) */
  rohdaten?: { bestelltTag: number; bereitTag: number; bisTag: number };
  /** Stand der Regler beim letzten Monatsschritt (für Hinweise bei Schwellenübergängen) */
  regler?: { aufsicht: number; internet: number; staatsmedien: number };
  /** Wert des Netzknotens pressefreiheit beim ersten Monatsschritt: Bezug für den Pressefreiheitswert */
  pfStart?: number;
}

// ---------------------------------------------------------------------------
// Startwerte

const START_EIGENTUEMER: Record<MedienAusrichtung, Eigentuemer> = {
  staatlich: "staatsnah",
  loyalistisch: "staatsnah",
  linientreu_opportunistisch: "opportunistisch",
  konform_kommerziell: "privat",
  oppositionell_masse: "oppositionell",
  oppositionell_nische: "oppositionell",
  unabhaengig_digital: "privat",
};

/** Anteil der Einnahmen aus Staatsanzeigen und Aufträgen am Start (Spielparameter; Recherche A.5.1 nennt die Richtung). */
const START_ABHAENGIGKEIT: Record<MedienAusrichtung, number> = {
  staatlich: 90,
  loyalistisch: 80,
  linientreu_opportunistisch: 70,
  konform_kommerziell: 50,
  oppositionell_masse: 15,
  oppositionell_nische: 60,
  unabhaengig_digital: 10,
};

/** Selbstzensur am Start: aus der Empfindlichkeit des Eigentümers (Spielparameter). */
export const startSelbstzensur = (c: MedienCluster): number => Math.round(c.eigentuemerEmpfindlichkeit * 0.8);

function startCluster(c: MedienCluster): ClusterZustand {
  return {
    eigentuemer: START_EIGENTUEMER[c.ausrichtung],
    lizenz: "frei",
    selbstzensur: startSelbstzensur(c),
    reichweite: 1,
    abhaengigkeit: START_ABHAENGIGKEIT[c.ausrichtung],
    finanzdruck: 0,
    plattformDruck: 0,
    maertyrer: 0,
    reglerLizenz: "frei",
  };
}

export function medienStart(): MedienZustand {
  return {
    v: 1,
    cluster: Object.fromEntries(MEDIEN_CLUSTER.map((c) => [c.id, startCluster(c)])),
    rsfScore: RSF_START.score,
    rsfVerlauf: [],
    eingriffe: [],
    zuletzt: {},
    ausweich: 0,
    verfahren: 0,
  };
}

/** Der Zustand dieser Partie; ältere Spielstände bekommen ihn beim ersten Zugriff (Migration: fehlende Cluster werden ergänzt). */
export function medienVon(w: World): MedienZustand {
  const sp = w.spiel;
  if (!sp) return medienStart();
  const m = (sp.medien ??= medienStart());
  for (const c of MEDIEN_CLUSTER) m.cluster[c.id] ??= startCluster(c);
  return m;
}

const clusterZustand = (w: World, id: string): ClusterZustand => medienVon(w).cluster[id]!;

// ---------------------------------------------------------------------------
// Lizenz, Sperre, Reichweite

const LIZENZ_RANG: Record<Lizenz, number> = { frei: 0, gedraengt: 1, gesperrt: 2 };
const hoeher = (a: Lizenz, b: Lizenz): Lizenz => (LIZENZ_RANG[a] >= LIZENZ_RANG[b] ? a : b);

/** Die Lizenzlage, die die Regler aus der Stufe ableiten: hohe Stufen schließen wirklich Sender (Textreihe in data/skalen.ts: „Verbote und Schließungen“). */
export function reglerLizenz(cluster: MedienCluster, aufsicht: number, internet: number): Lizenz {
  const lizenzAnfaellig = cluster.verwundbarkeit.includes("lizenz");
  if (!lizenzAnfaellig) return "frei";
  if (cluster.digital) {
    if (internet >= 90) return "gesperrt";
    if (internet >= 60 || aufsicht >= 65) return "gedraengt";
    return "frei";
  }
  if (aufsicht >= 90) return cluster.ausrichtung === "oppositionell_masse" || cluster.ausrichtung === "oppositionell_nische" ? "gesperrt" : "gedraengt";
  if (aufsicht >= 65) return "gedraengt";
  return "frei";
}

/** Die tatsächliche Lizenzlage: Eingriff oder Regler, je nachdem was schärfer ist; eine abgelaufene Sperre zählt als „gedrängt“. */
export function lizenzVon(w: World, id: string): Lizenz {
  const z = clusterZustand(w, id);
  let eigene: Lizenz = z.lizenz;
  if (z.gesperrtBis !== undefined) eigene = z.gesperrtBis > w.day ? "gesperrt" : z.lizenz === "gesperrt" ? "gedraengt" : z.lizenz;
  return hoeher(eigene, z.reglerLizenz);
}

export const istGesperrt = (w: World, id: string): boolean => lizenzVon(w, id) === "gesperrt";

/** Ursache einer Sperre für die Anzeige. */
export function sperrGrund(w: World, id: string): "lizenzentzug" | "blackout" | "regler" | undefined {
  const z = clusterZustand(w, id);
  if (z.gesperrtBis !== undefined && z.gesperrtBis > w.day) return z.lizenzentzugGenutzt && z.gesperrtBis - w.day > MEDIEN.blackoutTage ? "lizenzentzug" : "blackout";
  if (z.reglerLizenz === "gesperrt") return "regler";
  return undefined;
}

/** Faktor auf die Reichweite jetzt: 0 bei gesperrtem Blatt, sonst die gewachsene oder geschrumpfte Reichweite. */
export function reichweiteJetzt(w: World, id: string): number {
  if (istGesperrt(w, id)) return 0;
  return clusterZustand(w, id).reichweite;
}

/** Zielwert der Reichweite aus Druck, Märtyrer-Effekt, Ausweichen und Selbstzensur. */
function reichweiteZiel(c: MedienCluster, z: ClusterZustand, ausweich: number): number {
  const start = startSelbstzensur(c);
  let ziel = 1;
  ziel -= (z.finanzdruck / 100) * 0.5;
  ziel -= (z.plattformDruck / 100) * 0.5;
  ziel += (z.maertyrer / 100) * 0.5;
  if (c.digital) ziel += (ausweich / 100) * 0.4;
  // Wer sich als verlängerter Arm der Regierung liest, verliert Leser (Vertrauensverlust)
  ziel -= (Math.max(0, z.selbstzensur - start) / 100) * 0.3;
  if (z.uebernommen) ziel *= 0.85;
  return clamp(ziel, 0.1, 1.6);
}

/**
 * Der Cluster, wie er jetzt wirkt: Ausrichtung nach Eigentümer und Kippen, Skandalbericht nach Selbstzensur und Wohlwollen, Reichweite nach
 * Zustand. Die Zeitung und die Wirkung auf die Gruppen lesen ihn statt der starren Daten.
 */
export function wirksamerCluster(w: World, c: MedienCluster): MedienCluster {
  const z = clusterZustand(w, c.id);
  const start = startSelbstzensur(c);
  const sz = clamp((z.selbstzensur - start) / Math.max(1, 100 - start), 0, 1);
  let ausrichtung: MedienAusrichtung = c.ausrichtung;
  let empfindlichkeit = c.eigentuemerEmpfindlichkeit;
  if (z.gekippt && !z.uebernommen) {
    ausrichtung = "oppositionell_masse";
    empfindlichkeit = Math.min(empfindlichkeit, 40);
  }
  if (z.uebernommen || (z.eigentuemer === "staatsnah" && ausrichtung !== "staatlich")) {
    ausrichtung = "loyalistisch";
    empfindlichkeit = Math.max(empfindlichkeit, 95);
  }
  const wohl = z.wohlwollenBis !== undefined && z.wohlwollenBis > w.day ? MEDIEN.wohlwollenFaktor : 1;
  // Ein gekipptes oder übernommenes Blatt berichtet nach seiner neuen Richtung, sonst dämpft die Selbstzensur den Bericht über die Regierung
  const gegen = ausrichtung !== c.ausrichtung ? gekipptBericht(ausrichtung, c) : c.berichtSkandalRegierung * (1 - 0.75 * sz);
  const reich = reichweiteJetzt(w, c.id);
  return {
    ...c,
    ausrichtung,
    eigentuemerEmpfindlichkeit: empfindlichkeit,
    berichtSkandalRegierung: clamp(gegen * wohl, 0, 0.99),
    berichtSkandalOpposition: clamp(c.berichtSkandalOpposition * (1 + 0.25 * sz), 0, 0.99),
    reichweiteSegmente: Object.fromEntries(Object.entries(c.reichweiteSegmente).map(([s, v]) => [s, v * reich])) as MedienCluster["reichweiteSegmente"],
  };
}

/** Wie oft ein gekipptes oder übernommenes Blatt Regierungsskandale bringt. */
function gekipptBericht(ausrichtung: MedienAusrichtung, c: MedienCluster): number {
  if (ausrichtung === "oppositionell_masse") return 0.7;
  if (ausrichtung === "loyalistisch") return Math.min(c.berichtSkandalRegierung, 0.1);
  return c.berichtSkandalRegierung;
}

/** Welche Blätter eine Ausgabe tragen, wenn gesperrte ausfallen: Ersatz aus derselben Richtung, sonst das Digitale, sonst nichts. */
export function blattAuswahlWelt(w: World, basis: string[]): { ids: string[]; gesperrt: { id: string; grund: "lizenzentzug" | "blackout" | "regler" }[] } {
  const ids: string[] = [];
  const gesperrt: { id: string; grund: "lizenzentzug" | "blackout" | "regler" }[] = [];
  const ersatz: Record<string, string[]> = {
    opposition_masse: ["opposition_nische", "digital_frei"],
    opposition_nische: ["opposition_masse", "digital_frei"],
    digital_frei: ["opposition_masse", "opposition_nische"],
  };
  for (const id of basis) {
    if (!istGesperrt(w, id)) {
      if (!ids.includes(id)) ids.push(id);
      continue;
    }
    gesperrt.push({ id, grund: sperrGrund(w, id) ?? "regler" });
    const alt = (ersatz[id] ?? []).find((a) => !istGesperrt(w, a) && !ids.includes(a) && !basis.includes(a));
    if (alt) ids.push(alt);
  }
  return { ids, gesperrt };
}

// ---------------------------------------------------------------------------
// Eingriffe

interface AktionDef {
  id: AktionId;
  kapital: number;
  aufmerksamkeit: number;
  /** Schlüssel aus REGULIERUNG_PREISE (Referenzwert und Punkte des Pressefreiheitswerts), falls es einen gibt */
  preis?: keyof typeof REGULIERUNG_PREISE;
  /** Punkte des Pressefreiheitswerts, wenn kein Preis in REGULIERUNG_PREISE steht (negativ = gewonnen) */
  rsf?: number;
  /** Stärke des Marktschocks (art „presse“; negativ beruhigt) */
  markt: number;
  /** Märtyrer-Effekt und Ausweichen, die der Eingriff auslöst */
  maertyrer: number;
  ausweich: number;
  /** Ob die Aktion einen Cluster braucht */
  clusterAktion: boolean;
  /** Eine Aktion mit Einmal-Charakter gilt je Cluster nur einmal */
  einmalig?: boolean;
}

export const AKTIONEN: Record<AktionId, AktionDef> = {
  eigentuemerdruck: { id: "eigentuemerdruck", kapital: 3, aufmerksamkeit: 6, rsf: 0.5, markt: 0.2, maertyrer: 0, ausweich: 4, clusterAktion: true },
  staatsanzeigen: { id: "staatsanzeigen", kapital: 2, aufmerksamkeit: 3, rsf: 0.2, markt: 0, maertyrer: 0, ausweich: 0, clusterAktion: true },
  anzeigenstopp: { id: "anzeigenstopp", kapital: 2, aufmerksamkeit: 4, preis: "bik_anzeigenstopp", markt: 0.2, maertyrer: 8, ausweich: 6, clusterAktion: true },
  aufsichtsstrafe: { id: "aufsichtsstrafe", kapital: 2, aufmerksamkeit: 3, preis: "rtuek_geldstrafe", markt: 0.2, maertyrer: 4, ausweich: 2, clusterAktion: true },
  blackout: { id: "blackout", kapital: 5, aufmerksamkeit: 8, preis: "blackout_10tage", markt: 0.8, maertyrer: 15, ausweich: 10, clusterAktion: true },
  lizenzentzug: { id: "lizenzentzug", kapital: 8, aufmerksamkeit: 15, preis: "lizenzentzug", markt: 1.5, maertyrer: 40, ausweich: 20, clusterAktion: true, einmalig: true },
  verfahren: { id: "verfahren", kapital: 3, aufmerksamkeit: 5, preis: "tck217a_verfahren", markt: 0.4, maertyrer: 10, ausweich: 5, clusterAktion: true },
  sperre_netz: { id: "sperre_netz", kapital: 4, aufmerksamkeit: 6, preis: "kontosperrung", markt: 0.6, maertyrer: 0, ausweich: 30, clusterAktion: true },
  uebernahme: { id: "uebernahme", kapital: 10, aufmerksamkeit: 12, rsf: 1.5, markt: 0.5, maertyrer: 10, ausweich: 8, clusterAktion: true, einmalig: true },
  pressekonferenz: { id: "pressekonferenz", kapital: 1, aufmerksamkeit: 10, rsf: -0.2, markt: -0.1, maertyrer: 0, ausweich: 0, clusterAktion: false },
  interview: { id: "interview", kapital: 1, aufmerksamkeit: 12, rsf: -0.3, markt: -0.1, maertyrer: 0, ausweich: 0, clusterAktion: true },
};

const rsfMalusVon = (a: AktionDef): number => (a.preis ? REGULIERUNG_PREISE[a.preis].rsfMalus : (a.rsf ?? 0));
const mobilisierungVon = (a: AktionDef): number => (a.preis ? (REGULIERUNG_PREISE[a.preis] as { oppoMobilisierung?: number }).oppoMobilisierung ?? 0 : 0);

export interface MedienAktionSicht {
  aktion: AktionId;
  /** Ob die Aktion zu diesem Cluster überhaupt passt (sonst nur Kandidat zum Ausblenden) */
  anwendbar: boolean;
  cluster?: string;
  clusterName?: string;
  kapital: number;
  aufmerksamkeit: number;
  moeglich: boolean;
  grund?: string;
  /** Kurze Zeilen mit den erwarteten Folgen (Kosten, Zustand, Gegenreaktion) */
  vorschau: string[];
  rsfMalus: number;
}

const loyalAusrichtung = (a: MedienAusrichtung): boolean => a === "staatlich" || a === "loyalistisch";

/** Ob eine Aktion zu einem Cluster passt (Voraussetzung), sonst der Grund in einem Satz. */
function passt(w: World, a: AktionDef, c: MedienCluster | undefined): string | null {
  if (a.clusterAktion && !c) return t("medien.grund.ohne_cluster");
  if (!c) return null;
  const z = clusterZustand(w, c.id);
  const lizenz = lizenzVon(w, c.id);
  const eigentum = c.verwundbarkeit.includes("eigentum");
  const lizenzAnfaellig = c.verwundbarkeit.includes("lizenz");
  switch (a.id) {
    case "eigentuemerdruck":
      if (!eigentum) return t("medien.grund.kein_eigentuemerhebel");
      if (z.eigentuemer === "staatsnah") return t("medien.grund.schon_staatsnah");
      return null;
    case "staatsanzeigen":
      if (c.digital) return t("medien.grund.digital_ohne_anzeigen");
      if (z.eigentuemer === "oppositionell") return t("medien.grund.oppositionell_lehnt_ab");
      return null;
    case "anzeigenstopp":
      if (!lizenzAnfaellig || c.digital) return t("medien.grund.kein_anzeigenhebel");
      return null;
    case "aufsichtsstrafe":
      if (!lizenzAnfaellig) return t("medien.grund.keine_aufsicht");
      return null;
    case "blackout":
      if (!lizenzAnfaellig || c.digital) return t("medien.grund.kein_blackout");
      if (lizenz === "gesperrt") return t("medien.grund.schon_gesperrt");
      return null;
    case "lizenzentzug":
      if (!lizenzAnfaellig) return t("medien.grund.keine_lizenz");
      if (z.lizenzentzugGenutzt) return t("medien.grund.lizenz_schon_entzogen");
      if (lizenz === "frei") return t("medien.grund.erst_druck");
      if (lizenz === "gesperrt") return t("medien.grund.schon_gesperrt");
      return null;
    case "verfahren":
      if (loyalAusrichtung(c.ausrichtung)) return t("medien.grund.regierungsnah_kein_verfahren");
      return null;
    case "sperre_netz":
      if (!c.digital) return t("medien.grund.nur_digital");
      return null;
    case "uebernahme":
      if (z.uebernommen || z.eigentuemer === "staatsnah") return t("medien.grund.schon_staatsnah");
      if (eigentum && (z.eigentuemer === "privat" || z.eigentuemer === "opportunistisch")) return null;
      if (lizenzAnfaellig && z.eigentuemer === "oppositionell") return LIZENZ_RANG[lizenz] >= 1 ? null : t("medien.grund.treuhaender_erst_druck");
      return t("medien.grund.nicht_kaeuflich");
    case "interview":
      if (c.ausrichtung === "staatlich") return t("medien.grund.staatsfunk_interview");
      return null;
    case "pressekonferenz":
      return null;
  }
}

function aktionsClusterListe(a: AktionDef): MedienCluster[] {
  return a.clusterAktion ? MEDIEN_CLUSTER : [];
}

/** Vorschau der Folgen in Zeilen (nach dem Muster der anderen Vorschauen im Spiel). */
function vorschauVon(w: World, a: AktionDef, c: MedienCluster | undefined): string[] {
  const out: string[] = [];
  const rsf = rsfMalusVon(a);
  if (rsf > 0) out.push(t("medien.vorschau.rsf_minus", { n: rsf }));
  if (rsf < 0) out.push(t("medien.vorschau.rsf_plus", { n: Math.abs(rsf) }));
  const z = c ? clusterZustand(w, c.id) : undefined;
  switch (a.id) {
    case "eigentuemerdruck":
      if (c) out.push(t("medien.vorschau.selbstzensur_plus", { n: Math.round(22 * (c.eigentuemerEmpfindlichkeit / 100) + 6) }));
      out.push(t("medien.vorschau.leak"));
      break;
    case "staatsanzeigen":
      out.push(t("medien.vorschau.abhaengigkeit_plus", { n: 25 }), t("medien.vorschau.selbstzensur_plus", { n: 8 }));
      break;
    case "anzeigenstopp":
      out.push(t("medien.vorschau.finanzdruck"), t("medien.vorschau.selbstzensur_plus", { n: 10 }));
      break;
    case "aufsichtsstrafe":
      out.push(t("medien.vorschau.lizenz_gedraengt"), t("medien.vorschau.selbstzensur_plus", { n: 8 }));
      break;
    case "blackout":
      out.push(t("medien.vorschau.blackout", { tage: MEDIEN.blackoutTage }), t("medien.vorschau.empoerung", { n: mobilisierungVon(a) }));
      break;
    case "lizenzentzug":
      out.push(t("medien.vorschau.lizenzentzug", { tage: MEDIEN.lizenzentzugTage }), t("medien.vorschau.einmalig"));
      break;
    case "verfahren":
      out.push(t("medien.vorschau.selbstzensur_plus", { n: 12 }), t("medien.vorschau.pressekonflikt"));
      break;
    case "sperre_netz":
      out.push(t("medien.vorschau.plattform"), t("medien.vorschau.ausweichen"));
      break;
    case "uebernahme":
      out.push(t("medien.vorschau.uebernahme"), t("medien.vorschau.leserverlust"), t("medien.vorschau.einmalig"));
      break;
    case "pressekonferenz":
      out.push(t("medien.vorschau.pressekonferenz"));
      break;
    case "interview":
      out.push(t("medien.vorschau.interview", { tage: MEDIEN.wohlwollenTage }));
      break;
  }
  if (a.markt > 0) out.push(t("medien.vorschau.markt_schreck"));
  if (a.maertyrer >= 15 && z) out.push(t("medien.vorschau.maertyrer"));
  return out;
}

/** Alle Eingriffe, die es gibt, mit Kosten, Vorschau und möglichem Grund, warum etwas gerade nicht geht. */
export function medienAktionen(w: World): MedienAktionSicht[] {
  const sp = w.spiel;
  const out: MedienAktionSicht[] = [];
  const pause = sp ? neuanfangGrund(w) : undefined;
  const m = medienVon(w);
  for (const a of Object.values(AKTIONEN)) {
    const listen: (MedienCluster | undefined)[] = a.clusterAktion ? aktionsClusterListe(a) : [undefined];
    for (const c of listen) {
      const ungeeignet = passt(w, a, c);
      let grund: string | null = ungeeignet;
      if (!grund) {
        const letzte = m.zuletzt[`${a.id}|${c?.id ?? ""}`];
        if (letzte !== undefined && w.day - letzte < MEDIEN.pause && !a.einmalig) grund = t("medien.grund.pause", { tage: MEDIEN.pause - (w.day - letzte) });
      }
      if (!grund && pause) grund = pause;
      if (!grund && sp && !kannZahlen(sp.kapital, a.kapital)) grund = t("medien.grund.kapital");
      out.push({
        aktion: a.id,
        anwendbar: ungeeignet === null,
        ...(c ? { cluster: c.id, clusterName: c.name } : {}),
        kapital: a.kapital,
        aufmerksamkeit: a.aufmerksamkeit,
        moeglich: grund === null,
        ...(grund ? { grund } : {}),
        vorschau: vorschauVon(w, a, c),
        rsfMalus: rsfMalusVon(a),
      });
    }
  }
  return out;
}

export interface MedienErgebnis {
  ok: boolean;
  text: string;
  why?: string;
}

function chronik(w: World, titel: string, ausgang: string): void {
  const e: ChronikEintrag = { tag: w.day, datum: w.date, titel, ausgang };
  w.spiel?.chronik.push(e);
}

/** Pressefreiheitswert und Netz: der Eingriff kostet Punkte (negativ = gewinnt). */
function rsfBuchen(w: World, m: MedienZustand, punkte: number): void {
  m.rsfScore = clamp(m.rsfScore - punkte, 0, 100);
  // Der Netzknoten folgt dem Index (Netzpunkte je Indexpunkt: MEDIEN.wirkung.pressefreiheitNetz)
  if (NET.index.has("pressefreiheit") && punkte !== 0) wirke(w, "pressefreiheit", -MEDIEN.wirkung.pressefreiheitNetz * punkte);
}

/** Wirkung eines Eingriffs auf Ausland, Straße und Gruppen (alles aus den Punkten des Preises). */
function auswirkungen(w: World, a: AktionDef, rsf: number): void {
  const k = MEDIEN.wirkung;
  if (rsf > 0) {
    wirke(w, "ansehen", -k.ansehen * rsf);
    wirke(w, "beziehungen_eu", -k.eu * rsf);
    wirke(w, "staedtische_saekulare", -k.staedtisch * rsf);
    wirke(w, "junge", -k.junge * rsf);
    wirke(w, "konservative", k.konservative * rsf);
    // Kurze Ruhe: Wer Kritik abstellt, gewinnt im eigenen Lager Vertrauen; die Rechnung (Ansehen, Märkte, Legitimität) kommt hinterher
    wirke(w, "vertrauen_regierung", k.ruhe * rsf);
    const empoerung = mobilisierungVon(a);
    if (empoerung > 0 && NET.index.has("protestdruck")) wirke(w, "protestdruck", 0.8 * empoerung);
  } else if (rsf < 0) {
    wirke(w, "ansehen", -k.ansehen * rsf);
    wirke(w, "beziehungen_eu", -k.eu * rsf);
  }
  if (a.markt !== 0) marktSchock(w, "presse", a.markt * k.markt);
}

/** Gegenreaktionen: Märtyrer-Effekt, Ausweichen auf soziale Netze, Leaks. */
function gegenreaktion(w: World, m: MedienZustand, a: AktionDef, c: MedienCluster | undefined, z: ClusterZustand | undefined): string | null {
  if (z && a.maertyrer > 0) z.maertyrer = clamp(z.maertyrer + a.maertyrer, 0, 100);
  m.ausweich = clamp(m.ausweich + a.ausweich, 0, 100);
  if ((a.id === "eigentuemerdruck" || a.id === "verfahren") && hashWert(`${w.seed}|leak|${w.day}|${a.id}|${c?.id ?? ""}`) < 0.15) {
    wirke(w, "ansehen", -1);
    wirke(w, "polarisierung", 1);
    return t("medien.leak");
  }
  return null;
}

/** Führt einen Eingriff aus (Kapital und Aufmerksamkeit werden abgezogen, Zustand, Märkte, Ausland, Straße und Gegenreaktion wirken). */
export function fuehreMedienAktionAus(w: World, aktionId: AktionId, clusterId?: string): MedienErgebnis {
  const sp = w.spiel;
  if (!sp) return { ok: false, text: t("medien.fehler.ohne_spiel") };
  const a = AKTIONEN[aktionId];
  if (!a) return { ok: false, text: t("medien.fehler.unbekannt") };
  const c = clusterId ? medienCluster(clusterId) : undefined;
  const sicht = medienAktionen(w).find((s) => s.aktion === aktionId && s.cluster === c?.id);
  if (!sicht) return { ok: false, text: t("medien.fehler.unbekannt") };
  if (!sicht.moeglich) return { ok: false, text: sicht.grund ?? t("medien.fehler.nicht_moeglich") };
  const m = medienVon(w);
  const z = c ? m.cluster[c.id] : undefined;
  sp.kapital -= a.kapital;
  verbrauche(w, a.aufmerksamkeit, `Medien: ${aktionId}`);
  m.zuletzt[`${a.id}|${c?.id ?? ""}`] = w.day;
  const rsf = rsfMalusVon(a);
  const name = c?.name ?? "";
  let text = "";
  let chronikTitel: string | null = null;

  switch (a.id) {
    case "eigentuemerdruck": {
      const plus = 22 * (c!.eigentuemerEmpfindlichkeit / 100) + 6;
      z!.selbstzensur = clamp(z!.selbstzensur + plus, 0, 100);
      z!.reichweite = clamp(z!.reichweite - 0.02, 0.1, 1.6);
      text = t("medien.ergebnis.eigentuemerdruck", { cluster: name });
      break;
    }
    case "staatsanzeigen":
      z!.abhaengigkeit = clamp(z!.abhaengigkeit + 25, 0, 100);
      z!.selbstzensur = clamp(z!.selbstzensur + 8, 0, 100);
      text = t("medien.ergebnis.staatsanzeigen", { cluster: name });
      break;
    case "anzeigenstopp":
      z!.finanzdruck = clamp(z!.finanzdruck + 30, 0, 100);
      z!.selbstzensur = clamp(z!.selbstzensur + 10, 0, 100);
      text = t("medien.ergebnis.anzeigenstopp", { cluster: name });
      break;
    case "aufsichtsstrafe":
      z!.lizenz = hoeher(z!.lizenz, "gedraengt");
      z!.selbstzensur = clamp(z!.selbstzensur + 8, 0, 100);
      text = t("medien.ergebnis.aufsichtsstrafe", { cluster: name });
      break;
    case "blackout":
      z!.gesperrtBis = Math.max(z!.gesperrtBis ?? 0, w.day + MEDIEN.blackoutTage);
      z!.lizenz = hoeher(z!.lizenz, "gedraengt");
      z!.reichweite = clamp(z!.reichweite - 0.08, 0.1, 1.6);
      text = t("medien.ergebnis.blackout", { cluster: name, tage: MEDIEN.blackoutTage });
      chronikTitel = t("medien.chronik.blackout", { cluster: name });
      break;
    case "lizenzentzug":
      z!.lizenz = "gesperrt";
      z!.gesperrtBis = w.day + MEDIEN.lizenzentzugTage;
      z!.lizenzentzugGenutzt = true;
      text = t("medien.ergebnis.lizenzentzug", { cluster: name });
      chronikTitel = t("medien.chronik.lizenzentzug", { cluster: name });
      break;
    case "verfahren":
      z!.selbstzensur = clamp(z!.selbstzensur + 12, 0, 100);
      m.verfahren = clamp(m.verfahren + 1, 0, 12);
      text = t("medien.ergebnis.verfahren", { cluster: name });
      break;
    case "sperre_netz":
      z!.plattformDruck = clamp(z!.plattformDruck + 35, 0, 100);
      wirke(w, "junge", -1);
      text = t("medien.ergebnis.sperre_netz", { cluster: name });
      break;
    case "uebernahme": {
      const treuhaender = z!.eigentuemer === "oppositionell";
      z!.uebernommen = true;
      z!.eigentuemer = "staatsnah";
      z!.selbstzensur = clamp(Math.max(z!.selbstzensur, 80), 0, 100);
      z!.lizenz = "frei";
      delete z!.gesperrtBis;
      z!.reichweite = clamp(z!.reichweite * 0.9, 0.1, 1.6);
      text = t(treuhaender ? "medien.ergebnis.uebernahme_treuhaender" : "medien.ergebnis.uebernahme_kauf", { cluster: name });
      chronikTitel = t("medien.chronik.uebernahme", { cluster: name });
      break;
    }
    case "pressekonferenz":
      wirke(w, "vertrauen_regierung", MEDIEN.gespraech.vertrauen);
      wirke(w, "ansehen", MEDIEN.gespraech.ansehen);
      m.verfahren = clamp(m.verfahren - 1, 0, 12);
      text = t("medien.ergebnis.pressekonferenz");
      break;
    case "interview":
      z!.wohlwollenBis = w.day + MEDIEN.wohlwollenTage;
      wirke(w, "staedtische_saekulare", MEDIEN.gespraech.interview);
      wirke(w, "ansehen", MEDIEN.gespraech.ansehen);
      text = t("medien.ergebnis.interview", { cluster: name });
      break;
  }

  rsfBuchen(w, m, rsf);
  auswirkungen(w, a, rsf);
  const leak = gegenreaktion(w, m, a, c, z);
  const eintrag: EingriffEintrag = { tag: w.day, datum: w.date, aktion: a.id, ...(c ? { cluster: c.id } : {}), text, rsf };
  m.eingriffe.push(eintrag);
  if (m.eingriffe.length > MEDIEN.eingriffeMax) m.eingriffe.splice(0, m.eingriffe.length - MEDIEN.eingriffeMax);
  addLog(w, "entscheidung", text, t("medien.log.warum", { kapital: a.kapital }));
  if (chronikTitel) chronik(w, chronikTitel, text);
  const gesamt = leak ? `${text} ${leak}` : text;
  return { ok: true, text: gesamt, why: t("medien.log.warum", { kapital: a.kapital }) };
}

// ---------------------------------------------------------------------------
// Ereignisse greifen ein (Pressekonflikt in sim/ereignisse-innen.ts)

/** „Härte zeigen“ im Pressekonflikt: Die Aufsicht greift durch, die Redaktionen lernen, was sie weglassen. */
export function medienHaerte(w: World): void {
  const m = medienVon(w);
  for (const c of MEDIEN_CLUSTER) {
    const z = m.cluster[c.id]!;
    if (loyalAusrichtung(c.ausrichtung)) continue;
    z.selbstzensur = clamp(z.selbstzensur + (c.verwundbarkeit.includes("lizenz") ? 10 : 6), 0, 100);
    if (c.verwundbarkeit.includes("lizenz")) {
      z.lizenz = hoeher(z.lizenz, "gedraengt");
      z.finanzdruck = clamp(z.finanzdruck + 12, 0, 100);
    }
  }
  m.verfahren = clamp(m.verfahren + 1, 0, 12);
  m.ausweich = clamp(m.ausweich + 8, 0, 100);
  rsfBuchen(w, m, 1.5);
}

/** „Freilassen“ im Pressekonflikt: Entspannung, die Redaktionen trauen sich wieder. */
export function medienEntspannung(w: World): void {
  const m = medienVon(w);
  for (const c of MEDIEN_CLUSTER) {
    const z = m.cluster[c.id]!;
    z.selbstzensur = clamp(z.selbstzensur - 5, startSelbstzensur(c) - 0, 100);
  }
  m.verfahren = clamp(m.verfahren - 2, 0, 12);
  rsfBuchen(w, m, -0.8);
}

/** Wie viele Verfahren gegen Journalisten laufen: erhöht die Chance auf den Pressekonflikt. */
export const medienVerfahren = (w: World): number => w.spiel?.medien?.verfahren ?? 0;

// ---------------------------------------------------------------------------
// Pressefreiheitswert

export function rsfSicht(w: World): { score: number; rang: number; verlauf: { tag: number; datum: string; score: number }[]; start: typeof RSF_START } {
  const m = medienVon(w);
  const rang = clamp(Math.round(RSF_START.rang - (m.rsfScore - RSF_START.score) * MEDIEN.rsfRangProPunkt), 1, 180);
  return { score: Math.round(m.rsfScore * 10) / 10, rang, verlauf: m.rsfVerlauf, start: RSF_START };
}

// ---------------------------------------------------------------------------
// Monatsschritt

const netzWert = (w: World, id: string): number => {
  const v = nationalAverage(NET, w.net, id);
  return Number.isFinite(v) ? v : 0;
};

/** Gewichtete Selbstzensur über dem Start, Reichweite-gewichtet (Maß für die Kontrollrendite). */
function selbstzensurUeberStart(w: World, m: MedienZustand): number {
  let summe = 0;
  let gewicht = 0;
  for (const c of MEDIEN_CLUSTER) {
    const reich = Object.values(c.reichweiteSegmente).reduce((s, v) => s + v, 0);
    const z = m.cluster[c.id]!;
    summe += Math.max(0, z.selbstzensur - startSelbstzensur(c)) * reich;
    gewicht += reich;
  }
  return gewicht > 0 ? summe / gewicht : 0;
}

/** Monatlich: Regler, Lizenzen, Zustände, Kippen, Pressefreiheitswert, Kontrollrendite. Idempotent je Monat ist nicht nötig: aufgerufen aus zeitungMonat. */
export function medienMonat(w: World): void {
  const sp = w.spiel;
  if (!sp) return;
  const m = medienVon(w);
  const aufsicht = netzWert(w, "m_medienaufsicht");
  const internet = netzWert(w, "m_internetsperren");
  const staatsmedien = netzWert(w, "m_staatsmedien");

  for (const c of MEDIEN_CLUSTER) {
    const z = m.cluster[c.id]!;
    const start = startSelbstzensur(c);
    const alteLizenz = lizenzVon(w, c.id);
    z.reglerLizenz = reglerLizenz(c, aufsicht, internet);
    // Abgelaufene Sperre: das Blatt darf wieder erscheinen, steht aber weiter unter Druck
    if (z.gesperrtBis !== undefined && z.gesperrtBis <= w.day) {
      if (z.lizenz === "gesperrt") z.lizenz = "gedraengt";
      delete z.gesperrtBis;
    }
    // Selbstzensur über dem Start klingt langsam ab, darunter (Entspannung) kehrt sie zum Start zurück
    z.selbstzensur = clamp(z.selbstzensur + (start - z.selbstzensur) * MEDIEN.selbstzensurAbklang, 0, 100);
    // Staatliche Werbung und Aufträge binden die Regierungsnahen (m_staatsmedien über 60)
    if (c.ausrichtung === "loyalistisch" || c.ausrichtung === "linientreu_opportunistisch") {
      const ziel = clamp(START_ABHAENGIGKEIT[c.ausrichtung] + 0.5 * (staatsmedien - 60), 0, 100);
      z.abhaengigkeit = clamp(z.abhaengigkeit + (ziel - z.abhaengigkeit) * 0.1, 0, 100);
    } else {
      z.abhaengigkeit = clamp(z.abhaengigkeit + (START_ABHAENGIGKEIT[c.ausrichtung] - z.abhaengigkeit) * 0.05, 0, 100);
    }
    z.finanzdruck *= 1 - MEDIEN.druckAbklang;
    z.plattformDruck *= 1 - MEDIEN.druckAbklang;
    z.maertyrer *= 1 - MEDIEN.maertyrerAbklang;
    // Das opportunistische Blatt kippt bei schwacher Zustimmung und kehrt erst bei klar besseren Werten zurück (Sonderrolle in data/medien.ts)
    if (c.sonderrolle === "kippt_bei_machtwechsel_signal" && !z.uebernommen) {
      if (!z.gekippt && sp.umfrage.zustimmung < MEDIEN.kippSchwelle) {
        z.gekippt = true;
        addLog(w, "ereignis", t("medien.kippt.log", { cluster: c.name }), t("medien.kippt.warum"));
        chronik(w, t("medien.kippt.chronik", { cluster: c.name }), t("medien.kippt.warum"));
      } else if (z.gekippt && sp.umfrage.zustimmung > MEDIEN.kippRueck) {
        z.gekippt = false;
      }
    }
    const ziel = reichweiteZiel(c, z, m.ausweich);
    z.reichweite = clamp(z.reichweite + (ziel - z.reichweite) * MEDIEN.reichweiteTempo, 0.1, 1.6);
    const neueLizenz = lizenzVon(w, c.id);
    if (neueLizenz === "gesperrt" && alteLizenz !== "gesperrt" && z.reglerLizenz === "gesperrt") {
      addLog(w, "ereignis", t("medien.regler.sperre", { cluster: c.name }), t("medien.regler.warum"));
      chronik(w, t("medien.regler.sperre", { cluster: c.name }), t("medien.regler.warum"));
    }
  }
  m.ausweich *= 1 - MEDIEN.ausweichAbklang;
  m.verfahren *= 1 - MEDIEN.verfahrenAbklang;
  if (m.rohdaten && m.rohdaten.bisTag < w.day) delete m.rohdaten;

  // Kontrollrendite: Wer Redaktionen zum Schweigen bringt, gewinnt Vertrauen, und zahlt mit Legitimität und Ansehen
  const ueber = selbstzensurUeberStart(w, m);
  if (ueber > 0.5) {
    const rendite = Math.min(MEDIEN.renditeMax, MEDIEN.renditeVertrauen * ueber);
    wirke(w, "vertrauen_regierung", rendite);
    if (NET.index.has("legitimitaet")) wirke(w, "legitimitaet", -Math.min(MEDIEN.renditeMax, MEDIEN.renditeLegitimitaet * ueber));
    wirke(w, "ansehen", -Math.min(MEDIEN.renditeMax, MEDIEN.renditeAnsehen * ueber));
  }

  // Pressefreiheitswert: nähert sich dem Wert, den das Netz hergibt (Bezug: der Netzwert beim ersten Monatsschritt)
  const pf = netzWert(w, "pressefreiheit");
  m.pfStart ??= pf;
  const zielScore = clamp(RSF_START.score + MEDIEN.rsfNetz * (pf - m.pfStart), 0, 100);
  m.rsfScore = clamp(m.rsfScore + (zielScore - m.rsfScore) * MEDIEN.rsfNaehe, 0, 100);
  m.rsfVerlauf.push({ tag: w.day, datum: w.date, score: Math.round(m.rsfScore * 10) / 10 });
  if (m.rsfVerlauf.length > MEDIEN.verlaufMax) m.rsfVerlauf.splice(0, m.rsfVerlauf.length - MEDIEN.verlaufMax);
  m.regler = { aufsicht, internet, staatsmedien };
}

// ---------------------------------------------------------------------------
// Wahrnehmung: der Strom der Institute statt der nackten Wahrheit

export const ROHDATEN = MEDIEN.rohdaten;

export interface AngezeigteZustimmung {
  /** Der Wert, den der Spieler zu sehen bekommt (gerundet auf eine Nachkommastelle) */
  wert: number;
  quelle: "institut" | "rohdaten" | "start";
  institut?: string;
  /** Tage seit der letzten veröffentlichten Messung (bei Rohdaten 0) */
  alterTage: number;
  vormonat?: number;
  /** Streuung der Messung in Prozentpunkten (Einzelmessung eines Instituts) */
  streuung: number;
  /** Publikationsverbot vor der Wahl: Es erscheinen keine neuen Zahlen */
  verbot: boolean;
  /** Name eines Instituts, dessen Ergebnis in der Schublade blieb */
  schublade?: string;
  /** Nur bei Rohdaten: bis wann sie gelten */
  rohdatenBis?: number;
}

const tageZwischen = (von: string, bis: string): number => Math.max(0, Math.round((Date.parse(bis + "T00:00:00Z") - Date.parse(von + "T00:00:00Z")) / 86_400_000));

/** Ob gerade das gesetzliche Publikationsverbot vor dem Wahltag gilt. */
export function publikationsverbot(w: World): boolean {
  const sp = w.spiel;
  if (!sp || sp.ende) return false;
  const bis = sp.wahltag - w.day;
  return bis >= 0 && bis <= FEHLER_GENERATOR.publikationsverbotTage;
}

/**
 * Was die Oberfläche als Zustimmung zeigt: die letzte veröffentlichte Umfrage eines Instituts (mit Haus-Bias, Angstklima und Rauschen),
 * nur wer Rohdaten gekauft hat, sieht für 45 Tage die Wahrheit. Im Publikationsverbot ändert sich die Zahl nicht mehr.
 */
export function angezeigteZustimmung(w: World): AngezeigteZustimmung {
  const sp = w.spiel;
  const wahr = sp?.umfrage.zustimmung ?? 0;
  const m = w.spiel?.medien;
  const verbot = publikationsverbot(w);
  const r = m?.rohdaten;
  if (r && w.day >= r.bereitTag && w.day <= r.bisTag) {
    return { wert: Math.round(wahr * 10) / 10, quelle: "rohdaten", alterTage: 0, streuung: 0, verbot, rohdatenBis: r.bisTag };
  }
  const archiv = sp?.zeitung?.archiv ?? [];
  for (let i = archiv.length - 1; i >= 0; i--) {
    const a = archiv[i]!;
    if (a.anlass !== "monatlich" || !a.umfrage) continue;
    const inst = umfrageInstitut(a.umfrage.institutId);
    const schublade = archiv[archiv.length - 1]?.umfrageSchublade;
    return {
      wert: a.umfrage.wert,
      quelle: "institut",
      institut: a.umfrage.institut,
      alterTage: tageZwischen(a.datum, w.date),
      ...(a.umfrage.vormonat !== undefined ? { vormonat: a.umfrage.vormonat } : {}),
      streuung: Math.round((inst?.sigma ?? FEHLER_GENERATOR.sigmaBasis) * 10) / 10,
      verbot,
      ...(schublade ? { schublade } : {}),
    };
  }
  return { wert: Math.round(wahr * 10) / 10, quelle: "start", alterTage: 0, streuung: 0, verbot };
}

/** Die Reihe der veröffentlichten Werte (Monat, Wert, Institut) für Barometer und Chronik. */
export function institutsReihe(w: World): { monat: string; wert: number; institut: string }[] {
  const out: { monat: string; wert: number; institut: string }[] = [];
  for (const a of w.spiel?.zeitung?.archiv ?? []) {
    if (a.anlass === "monatlich" && a.umfrage) out.push({ monat: a.monat, wert: a.umfrage.wert, institut: a.umfrage.institut });
  }
  return out;
}

/** Rohdaten kaufen: kostet Kapital und Aufmerksamkeit, kommt nach der Wartezeit und gilt 45 Tage. */
export function rohdatenKaufen(w: World): MedienErgebnis {
  const sp = w.spiel;
  if (!sp) return { ok: false, text: t("medien.fehler.ohne_spiel") };
  const m = medienVon(w);
  const r = m.rohdaten;
  if (r && w.day <= r.bisTag) {
    return { ok: false, text: w.day >= r.bereitTag ? t("medien.rohdaten.laeuft", { bis: r.bisTag - w.day }) : t("medien.rohdaten.bestellt", { tage: r.bereitTag - w.day }) };
  }
  const pause = neuanfangGrund(w);
  if (pause) return { ok: false, text: pause };
  if (!kannZahlen(sp.kapital, ROHDATEN.kapital)) return { ok: false, text: t("medien.grund.kapital") };
  sp.kapital -= ROHDATEN.kapital;
  verbrauche(w, ROHDATEN.aufmerksamkeit, "Rohdaten");
  m.rohdaten = { bestelltTag: w.day, bereitTag: w.day + ROHDATEN.wartetage, bisTag: w.day + ROHDATEN.wartetage + ROHDATEN.gueltigTage };
  addLog(w, "entscheidung", t("medien.rohdaten.log", { tage: ROHDATEN.wartetage }));
  return { ok: true, text: t("medien.rohdaten.log", { tage: ROHDATEN.wartetage }) };
}
