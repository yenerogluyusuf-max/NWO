// Die Zeitung (UI-1 aus VERBESSERUNGSPLAN_2026-09-30, Suzerain-Vorbild: „Zeitung als Soft-Dashboard").
// Jeden Monat — und bei Großereignissen sofort — erscheint eine Ausgabe mit zwei bis drei Blättern
// aus verschiedenen Medien-Clustern (data/medien.ts): dieselbe Realität in verschiedenen Framings.
//   - regierungsnahe Blätter feiern Erfolge und schreiben Misserfolge klein (Eigentümer-Empfindlichkeit
//     steuert die Stärke des Drehs),
//   - oppositionsnahe dramatisieren und verschweigen Erfolge eher,
//   - unabhängige berichten nüchtern.
// Die Wahrheit liegt nur in den internen Werten (RECHERCHE_MEDIEN_UMFRAGEN.md, A.5.4).
//
// Artikel sind regelbasierte Bausteine aus dem Weltzustand — KEINE KI. KI-Text kommt später (KI-2);
// die Schnittstelle dafür ist `textQuelle: "regel" | "ki"` an jedem Artikel.
//
// Umfragen: Das Zeitungs-Modul ist der Consumer für die TODOs in sim/umfrage.ts. Die veröffentlichte
// Umfrage des Monats kommt von einem Institut mit Haus-Bias und erscheint IN der Zeitung (nicht mehr
// als nackte Zahl im Umlauf). Die interne Fortschreibung (spiel.umfrage.zustimmung) bleibt die
// Wahrheit des Spiels und treibt Sturzgefahr und Wahl — gemessen wird nur fürs Blatt.
//
// Determinismus: Alle Zufallsziehungen der Zeitung laufen über eigene, aus dem Weltzustand abgeleitete
// Zufallsquellen (Muster wie hashZahl in sim/personen.ts) — der Zufallsstrom des Spiels wird nicht
// angezapft, die bisherige Simulation bleibt bit-identisch.
//
// Alle Zahlen sind Spielparameter (Platzhalter der Kalibrierung), keine Tatsachenbehauptungen.

import { MEDIEN_CLUSTER, medienCluster, type MedienCluster } from "../data/medien";
import { UMFRAGE_INSTITUTE, umfrageInstitut, type UmfrageInstitut } from "../data/umfrage_institute";
import { hashZahl } from "./personen";
import { Rng } from "./rng";
import { clamp } from "./economy";
import { NET } from "./modell";
import { nationalAverage } from "./netz";
import { wirke } from "./wirkung";
import { umfrageMessung } from "./umfrage";
import { fmt } from "./log";
import { formatMonthDe } from "./dates";
import type { World } from "./types";

// ---------------------------------------------------------------------------
// Typen

export type Sparte = "politik" | "wirtschaft" | "ereignis" | "programm" | "welt" | "umfrage";

export type VorgangArt =
  | "wahlsieg"
  | "bruch"
  | "krise"
  | "fertigstellung"
  | "skandal"
  | "ereignis"
  | "programm"
  | "gesetz"
  | "wirtschaft"
  | "umfrage";

/** Ein redaktioneller Vorgang: die Realität, aus der jedes Blatt seine eigene Schlagzeile baut. */
export interface ZeitungVorgang {
  id: string;
  art: VorgangArt;
  sparte: Sparte;
  /** Kurzer Sachverhalt („Die YENİ verlässt das Lager") */
  titel: string;
  /** Der nackte Fakt mit Zahlen — erscheint in JEDEM Framing, nur der Dreh drumherum ist cluster-eigen */
  fakt: string;
  /** Bewertung für die Regierung: −1 (Katastrophe) bis +1 (Triumph) */
  wertung: number;
  tag: number;
  datum: string;
  /** Großereignis: löst eine Eilmeldung aus und wirkt stärker */
  gross?: boolean;
  /** Kriegsphase (Krise der besonderen Art) */
  krieg?: boolean;
  /** Textanker, die dieser Vorgang in der Monatssammlung ersetzt (Chronik/Log-Dubletten) */
  schluessel?: string[];
}

export type FramingArt = "regierungsnah" | "oppositionell" | "neutral";

export interface ZeitungArtikel {
  id: string;
  art: VorgangArt;
  sparte: Sparte;
  schlagzeile: string;
  /** 1–3 Absätze; der erste trägt den gemeinsamen Fakt, der Rest den Dreh des Blattes */
  text: string[];
  /** Herkunft des Textes; KI kommt später (KI-2), der Fallback bleibt „regel" */
  textQuelle: "regel" | "ki";
  /** Endgültige Stimmungswirkung des Artikels (Vorzeichen = Richtung für die Regierung) */
  wirkung: number;
  framing: { art: FramingArt; staerke: number };
  /** Kleingedruckt: regierungsnahe Blätter entsorgen Unbequemes unterhalb der Falz */
  kurz: boolean;
}

export interface ZeitungBlatt {
  clusterId: string;
  /** Erfundener Blattname (nie der Name eines echten Mediums) */
  name: string;
  /** Zeile unter dem Titel — Charakter in einem Satz */
  unterzeile: string;
  digital: boolean;
  ton: FramingArt;
  artikel: ZeitungArtikel[];
  /** Titel der Vorgänge, die dieses Blatt (noch) nicht gebracht hat — Sichtbarkeit des Schweigens */
  verschwiegen: string[];
}

/** Die veröffentlichte Umfrage des Monats: Institut, Messwert und das, was das Haus offenlegt. */
export interface ZeitungUmfrage {
  institutId: string;
  institut: string;
  wert: number;
  vormonat?: number;
  stichprobe?: number;
  methode: string;
  /** Messwert des Instituts minus wahrer Wert — intern, fürs Balancing und spätere Mentorin-Texte */
  abweichung: number;
}

export interface ZeitungAusgabe {
  nummer: number;
  datum: string;
  monat: string;
  anlass: "monatlich" | "eilmeldung";
  blaetter: ZeitungBlatt[];
  umfrage?: ZeitungUmfrage;
  /** Name eines Instituts, dessen Ergebnis in der Schublade blieb (Recherche B.4.2) */
  umfrageSchublade?: string;
}

export interface ZeitungZustand {
  /** Neueste Ausgabe zuletzt; auf ARCHIV_MAX begrenzt */
  archiv: ZeitungAusgabe[];
  /** Ausgaben seit dem letzten Öffnen der Zeitung (Badge am Einstieg) */
  ungelesen: number;
  naechsteNummer: number;
  /** Großereignisse, die Digital schon brachte und Print erst im nächsten Monat bringt */
  warteschlange: ZeitungVorgang[];
  /** Tag der letzten Monatsausgabe (Chronik-Sammlung ab hier) */
  letzteMonatsausgabeTag: number;
  /** Messwert der zuletzt veröffentlichten Umfrage (Delta-Text) */
  letzteUmfrage?: number;
  /** Wirtschaftswerte der letzten Ausgabe (Delta-Text) */
  wirtschaft: { inflation: number; policyRate: number; usdTry: number };
}

export const ARCHIV_MAX = 12;

// ---------------------------------------------------------------------------
// Die Blätter: erfundene Namen je Cluster (reale Vorbilder nur in data/medien.ts-Kommentaren)

interface BlattDef {
  name: string;
  unterzeile: string;
}

const BLAETTER: Record<string, BlattDef> = {
  staatsrundfunk: { name: "Der Staatsbote", unterzeile: "Amtlich. Ausgewogen. Immer schon da." },
  holding_kern: { name: "Neue Warte", unterzeile: "Unabhängig. Überparteilich. Eigentümernah." },
  holding_breit: { name: "Tagespost", unterzeile: "Was das Land bewegt — und was der Aufsichtsrat bewegt." },
  kommerz_konform: { name: "Abendkurier", unterzeile: "Große Gefühle, kleine Risiken." },
  opposition_masse: { name: "Die Freie Stimme", unterzeile: "Unbequem seit der ersten Ausgabe." },
  opposition_nische: { name: "Der Widerspruch", unterzeile: "Klein auflagestark an Haltung." },
  digital_frei: { name: "Das Netzportal", unterzeile: "Schneller als jede Druckerpresse — und erreichbar, solange es geht." },
};

export function blattDef(clusterId: string): BlattDef {
  return BLAETTER[clusterId] ?? { name: "Der Anzeiger", unterzeile: "Erscheint unregelmäßig." };
}

// ---------------------------------------------------------------------------
// Framing-Regeln

/** Die Lesart eines Clusters folgt der Ausrichtung, nicht dem Marktanteil. */
export function framingFuer(cluster: MedienCluster): FramingArt {
  switch (cluster.ausrichtung) {
    case "staatlich":
    case "loyalistisch":
    case "linientreu_opportunistisch":
    case "konform_kommerziell":
      return "regierungsnah";
    case "oppositionell_masse":
    case "oppositionell_nische":
      return "oppositionell";
    case "unabhaengig_digital":
      return "neutral";
  }
}

/**
 * Die Stärke des Drehs: Je empfindlicher der Eigentümer auf Regierungsdruck reagiert,
 * desto größer die Feier und desto kleiner der Misserfolg. Freie Blätter drehen aus
 * Überzeugung in die andere Richtung; neutrale bleiben nah am Fakt.
 */
export function framingStaerke(cluster: MedienCluster): number {
  const f = cluster.eigentuemerEmpfindlichkeit / 100;
  const art = framingFuer(cluster);
  if (art === "regierungsnah") return clamp(0.3 + 0.7 * f, 0, 1);
  if (art === "oppositionell") return clamp(0.9 - f, 0, 1);
  return 0.15;
}

/** Mit welcher Wahrscheinlichkeit ein Cluster einen Vorgang überhaupt bringt (Recherche A.5.4). */
export function berichtP(cluster: MedienCluster, vorgang: Pick<ZeitungVorgang, "wertung">): number {
  // Unangenehm für die Regierung → Skandal-Quote Regierung; angenehm → Bereitschaft, Regierungsnahes zu tragen
  return vorgang.wertung < 0 ? cluster.berichtSkandalRegierung : cluster.berichtSkandalOpposition;
}

/** Deterministische Zufallsquelle der Zeitung: zapft den Strom des Spiels NICHT an. */
function zeitungZufall(salz: string): Rng {
  return new Rng(Math.floor(hashZahl(salz) * 2 ** 31));
}

// ---------------------------------------------------------------------------
// Textbausteine (regelbasiert; KI-Text folgt später über dieselbe Schnittstelle)

interface TextKontext {
  /** Name des Präsidenten */
  name: string;
  /** Kürzel der eigenen Partei */
  partei: string;
}

interface Baustein {
  schlagzeile: string;
  /** Der Dreh des Blattes; der Fakt steht immer im ersten Absatz davor */
  spin: string;
  kurz: boolean;
}

function baustein(framing: FramingArt, staerke: number, v: ZeitungVorgang, k: TextKontext): Baustein {
  const stark = staerke >= 0.75;
  switch (v.art) {
    case "wahlsieg":
      if (framing === "regierungsnah")
        return {
          schlagzeile: stark ? `Triumph der Vernunft: ${k.name} wiedergewählt` : `${k.name} wiedergewählt`,
          spin: "Die Wähler belohnen einen Kurs, von dem dieses Blatt immer überzeugt war. Fünf weitere Jahre Stabilität — das Land kann durchatmen.",
          kurz: false,
        };
      if (framing === "oppositionell")
        return {
          schlagzeile: `Weiter wie bisher: ${k.name} wiedergewählt`,
          spin: "Die andere Hälfte des Landes wollte etwas anderes. Fünf Jahre sind eine lange Zeit — man wird sich an alles erinnern.",
          kurz: true,
        };
      return { schlagzeile: `${k.name} wiedergewählt`, spin: "Die zweite Amtszeit ist nach der Verfassung die letzte. Die Wahlbehörde meldete keine nennenswerten Zwischenfälle.", kurz: false };

    case "bruch":
      if (framing === "regierungsnah")
        return stark
          ? { schlagzeile: "Parteitaktik in Ankara", spin: "Die Regierung arbeitet ungerührt weiter. Mehrheiten kommen und gehen; der Kurs bleibt.", kurz: true }
          : { schlagzeile: "Partner verlässt das Lager", spin: "Man bedauert den Schritt, erinnert an gemeinsame Erfolge — und verweist auf die Tagesordnung.", kurz: false };
      if (framing === "oppositionell")
        return { schlagzeile: "Das Lager bröckelt", spin: "Wer aussteigt, kennt die Bilanz von innen. Die Frage ist nicht mehr, ob dieses Bündnis trägt, sondern wie lange noch.", kurz: false };
      return { schlagzeile: "Bruch im Regierungslager", spin: "Für Gesetze wird nun jede Stimme zur Verhandlungssache; die Fraktionen sortieren sich neu.", kurz: false };

    case "krise":
      if (v.krieg) {
        if (framing === "regierungsnah")
          return { schlagzeile: "Das Land steht zusammen", spin: "In Stunden wie diesen zählt Einigkeit. Die Regierung handelt besonnen und entschlossen zugleich.", kurz: false };
        if (framing === "oppositionell")
          return { schlagzeile: "Kriegsgefahr — eskaliert, um abzulenken?", spin: "Wer zu Hause verliert, sucht den Konflikt draußen. Die Rechnung zahlen später andere.", kurz: false };
        return { schlagzeile: "Kriegsgefahr: der Stand", spin: "Was gesichert ist, was unklar bleibt — und welche Wege zur Deeskalation offenstehen.", kurz: false };
      }
      if (framing === "regierungsnah")
        return stark
          ? { schlagzeile: "Spekulation gegen das Land", spin: "Ankara bleibt ruhig: Angriffe auf die Wirtschaft sind zum Scheitern verurteilt. Mehr muss dazu nicht gesagt werden.", kurz: true }
          : { schlagzeile: "Turbulenzen in der Lage", spin: "Die Regierung beobachtet die Entwicklung; Fachleute erwarten eine Beruhigung.", kurz: false };
      if (framing === "oppositionell")
        return { schlagzeile: "Die Krise hat eine Adresse", spin: "Jeder Einkauf widerlegt die Beschwichtigungen aus dem Palast. Wer die Lage herbeiregiert hat, nennt sie nun Schicksal.", kurz: false };
      return { schlagzeile: "Krise bestätigt: Was feststeht", spin: "Auslöser, Zahlen und die offenen Fragen — eingeordnet, ohne Aufregung.", kurz: false };

    case "fertigstellung":
      if (framing === "regierungsnah")
        return { schlagzeile: stark ? "Vollendung: Geschichte geschrieben" : "Vorhaben vollendet", spin: "Was andere ankündigen, vollendet diese Regierung. Das Land wächst an solchen Tagen.", kurz: false };
      if (framing === "oppositionell")
        return { schlagzeile: "Eröffnet — die Rechnung kommt später", spin: "Prestige hat einen Preis, der nicht auf dem Einweihungsband steht. Den Unterhalt zahlt, Überraschung, der Steuerzahler.", kurz: true };
      return { schlagzeile: "Vorhaben fertiggestellt", spin: "Kosten, Nutzen und die offenen Fragen des Betriebs im Überblick.", kurz: false };

    case "skandal":
      if (framing === "regierungsnah")
        return { schlagzeile: "Ruhmlose Rache eines Gescheiterten", spin: "Wer scheitert, dichtet. Die Vorwürfe entbehren jeder Grundlage; wir drucken sie der Vollständigkeit halber.", kurz: true };
      if (framing === "oppositionell")
        return { schlagzeile: "Er packt aus: das System hinter den Türen", spin: "Endlich sagt es einer von innen. Jede Zeile bestätigt, was dieses Blatt seit Jahren schreibt.", kurz: false };
      return { schlagzeile: "Schwere Vorwürfe aus den eigenen Reihen", spin: "Die Anschuldigungen sind bislang nicht belegt; die Regierung weist sie zurück. Eine Einordnung.", kurz: false };

    case "programm":
      if (framing === "regierungsnah")
        return { schlagzeile: "Plan erfüllt", spin: "Schritt für Schritt wird aus dem Versprechen von damals die Wirklichkeit von heute.", kurz: false };
      if (framing === "oppositionell")
        return { schlagzeile: "Erfolg auf dem Papier", spin: "Ob die Bilanz im Alltag ankommt, entscheidet sich nicht auf dem Regierungsflugblatt.", kurz: true };
      return { schlagzeile: "Programm-Fortschritt", spin: "Der Stand der Umsetzung, nüchtern betrachtet.", kurz: false };

    case "gesetz":
      if (v.wertung >= 0) {
        if (framing === "regierungsnah") return { schlagzeile: "Parlament beschließt Gesetz", spin: "Mit klarer Mehrheit: Das Land wird ein Stück besser regiert.", kurz: false };
        if (framing === "oppositionell") return { schlagzeile: "Durchgewunken", spin: "Debatte? Fehlanzeige. Die Folgen werden wir alle noch erfahren.", kurz: true };
        return { schlagzeile: "Gesetz angenommen", spin: "Das Wichtigste zum Beschluss im Überblick.", kurz: false };
      }
      if (framing === "regierungsnah") return { schlagzeile: "Abstimmung vertagt", spin: "Inhaltlich notwendig, taktisch verschoben — so liest die Regierung das Votum.", kurz: true };
      if (framing === "oppositionell") return { schlagzeile: "Schlappe im Parlament", spin: "Selbst die eigene Mehrheit trägt das nicht mehr mit.", kurz: false };
      return { schlagzeile: "Gesetz gescheitert", spin: "Die Stimmen reichten nicht; die Frage bleibt auf der Tagesordnung.", kurz: false };

    case "wirtschaft":
      if (v.wertung >= 0) {
        if (framing === "regierungsnah") return { schlagzeile: "Die Politik wirkt", spin: "Geduld und Kurs zahlen sich aus — die Zahlen belegen es.", kurz: false };
        if (framing === "oppositionell") return { schlagzeile: "Ein guter Monat — vorerst", spin: "Ein Monat macht noch keine Wende. Man gönnt sich die Vorfreude in Ankara.", kurz: true };
        return { schlagzeile: "Erholung in den Daten", spin: "Die Entwicklung im Kontext der letzten Monate.", kurz: false };
      }
      if (framing === "regierungsnah")
        return stark
          ? { schlagzeile: "Zahlen im normalen Rahmen", spin: "Schwankungen gehören zur Lage; der Trend stimmt.", kurz: true }
          : { schlagzeile: "Gegenwind in den Zahlen", spin: "Die Regierung bleibt gelassen; die Ursachen liegen im Ausland.", kurz: false };
      if (framing === "oppositionell") return { schlagzeile: "Die Statistik straft die Regierung", spin: "Man kann an der Methode feilschen, nicht am Gefühl im Portemonnaie.", kurz: false };
      return { schlagzeile: "Verschlechterung in den Daten", spin: "Die Entwicklung im Kontext der letzten Monate.", kurz: false };

    case "ereignis":
      if (framing === "regierungsnah")
        return v.wertung < -0.4
          ? { schlagzeile: "Lage im Griff", spin: "Voreilige Schritte wären das falsche Signal; die Regierung handelt besonnen.", kurz: true }
          : { schlagzeile: "Regierung handelt", spin: "Besonnen und zum Wohl der Betroffenen — so geht Krisenpolitik.", kurz: false };
      if (framing === "oppositionell")
        return { schlagzeile: "Und niemand übernimmt die Verantwortung", spin: "Die Betroffenen warten, die Regierung verwaltet. Das ist das Muster.", kurz: false };
      return { schlagzeile: "Die Lage", spin: "Was geschah und was folgt — der Überblick.", kurz: false };

    case "umfrage":
      if (framing === "regierungsnah") return { schlagzeile: "Umfrage: Regierung stabil", spin: "Das Volk weiß, wen es hat.", kurz: false };
      if (framing === "oppositionell") return { schlagzeile: "Selbst freundlich gemessen", spin: "Wenn schon die Häuser des Auftraggebers so wenig messen, wie sieht es dann draußen aus?", kurz: false };
      return { schlagzeile: "Die Erhebung des Monats", spin: "Methodik und Einordnung.", kurz: false };
  }
}

/** Wie stark ein Artikel die Stimmung bewegt: Großereignisse und Skandale schwerer als Routine. */
const WIRKUNG_FAKTOR: Record<VorgangArt, number> = {
  wahlsieg: 0.9,
  bruch: 1.1,
  krise: 1.1,
  fertigstellung: 0.8,
  skandal: 1.2,
  ereignis: 0.4,
  programm: 0.5,
  gesetz: 0.4,
  wirtschaft: 0.6,
  umfrage: 0.4,
};

/** Ein Blatt macht aus einem Vorgang einen Artikel (gleicher Fakt, eigener Dreh). */
export function artikelFuer(cluster: MedienCluster, vorgang: ZeitungVorgang, kontext: TextKontext, id: string): ZeitungArtikel {
  const art = framingFuer(cluster);
  const staerke = framingStaerke(cluster);
  const b = baustein(art, staerke, vorgang, kontext);
  // Kleingedrucktes wirkt gedämpfter, Dramatisiertes stärker (Sichtbarkeits-Mechanik)
  const sicht = b.kurz ? 0.5 : art === "neutral" ? 0.8 : 1;
  const wirkung = clamp(vorgang.wertung * WIRKUNG_FAKTOR[vorgang.art] * sicht, -1.5, 1.5);
  const text = b.kurz ? [`${vorgang.fakt} ${b.spin}`] : [vorgang.fakt, b.spin];
  return { id, art: vorgang.art, sparte: vorgang.sparte, schlagzeile: b.schlagzeile, text, textQuelle: "regel", wirkung, framing: { art, staerke }, kurz: b.kurz };
}

// ---------------------------------------------------------------------------
// Blatt- und Ausgabenbau

/** Welche Cluster eine Ausgabe tragen: immer ein regierungsnahes und ein oppositionsnahes Blatt, jeden zweiten Monat zusätzlich das digitale (Recherche A.5.4). */
export function blattAuswahl(monatIndex: number): string[] {
  const regierungsnah = ["holding_kern", "staatsrundfunk", "holding_breit", "kommerz_konform"];
  const opposition = ["opposition_masse", "opposition_nische"];
  const auswahl = [regierungsnah[monatIndex % regierungsnah.length]!, opposition[monatIndex % opposition.length]!];
  if (monatIndex % 2 === 0) auswahl.push("digital_frei");
  return auswahl;
}

function monatIndex(datum: string): number {
  const [j, m] = datum.split("-").map(Number) as [number, number];
  return j * 12 + (m - 1);
}

const FUELLER_FAKT = "Ein ruhiger Monat im Land; die großen Fragen warten auf die nächste Ausgabe.";

/** Der Füller für einen Monat ohne Meldung: eigene, passende Zeile je Lesart statt des Ereignis-Drehs. */
function fuellerArtikel(cluster: MedienCluster, id: string): ZeitungArtikel {
  const art = framingFuer(cluster);
  const schlagzeile = art === "regierungsnah" ? "Ruhiger Monat, fleißige Regierung" : art === "oppositionell" ? "Die Ruhe ist das eigentliche Thema" : "Ein ruhiger Monat";
  const spin =
    art === "regierungsnah"
      ? "Während andere reden, arbeitet die Regierung. Die großen Linien stimmen; der Rest ist Wetter."
      : art === "oppositionell"
        ? "Nichts passiert — sagen die einen. Wir fragen: Wem nützt diese Stille, und seit wann?"
        : "Es gibt wenig zu melden, und auch das ist eine Nachricht. Der Überblick folgt, sobald es ihn braucht.";
  return {
    id,
    art: "ereignis",
    sparte: "politik",
    schlagzeile,
    text: [FUELLER_FAKT, spin],
    textQuelle: "regel",
    wirkung: 0,
    framing: { art, staerke: framingStaerke(cluster) },
    kurz: true,
  };
}

/** Baut die Blätter einer Ausgabe: je Cluster eigene Ziehung, eigener Dreh, eigenes Schweigen. */
function baueBlaetter(clusterIds: string[], vorgaenge: ZeitungVorgang[], kontext: TextKontext, rng: Rng, nummer: number): ZeitungBlatt[] {
  const blaetter: ZeitungBlatt[] = [];
  for (const id of clusterIds) {
    const cluster = medienCluster(id);
    if (!cluster) continue;
    const def = blattDef(id);
    const artikel: ZeitungArtikel[] = [];
    const verschwiegen: string[] = [];
    vorgaenge.forEach((v, i) => {
      if (rng.next() < berichtP(cluster, v)) artikel.push(artikelFuer(cluster, v, kontext, `a${nummer}-${id}-${i}`));
      else verschwiegen.push(v.titel);
    });
    // Ein Blatt ohne Meldung gibt es nicht: Im Zweifel füllt die Redaktion aus dem eigenen Alltag
    if (artikel.length === 0) artikel.push(fuellerArtikel(cluster, `a${nummer}-${id}-f`));
    // Das Wichtigste nach vorn: Leitartikel ist der stärkste Beitrag
    artikel.sort((a, b) => Math.abs(b.wirkung) - Math.abs(a.wirkung));
    blaetter.push({ clusterId: id, name: def.name, unterzeile: def.unterzeile, digital: cluster.digital, ton: framingFuer(cluster), artikel: artikel.slice(0, 5), verschwiegen: verschwiegen.slice(0, 3) });
  }
  return blaetter;
}

// ---------------------------------------------------------------------------
// Umfrage des Monats (Consumer der TODOs in sim/umfrage.ts: Instituts-Auswahl + Publikation)

export interface UmfrageErgebnis {
  umfrage?: ZeitungUmfrage;
  schublade?: string;
}

/**
 * Ein Institut misst den wahren Wert — mit Haus-Bias, Angstklima und Rauschen — und entscheidet
 * dann nach seiner Publikationsregel, ob die Zahl das Blatt sieht (Recherche B.4.2).
 * Verbraucht nur die übergebene Zufallsquelle.
 */
export function monatsUmfrage(wahrerWert: number, angstklima: number, rng: Rng, vormonat?: number): UmfrageErgebnis {
  const institut: UmfrageInstitut = UMFRAGE_INSTITUTE[Math.floor(rng.next() * UMFRAGE_INSTITUTE.length)]!;
  // Kommerzielle Häuser: der Haus-Effekt springt von Welle zu Welle (Recherche B.2.6)
  const sprung = institut.hausBiasInstabilitaet ? (rng.next() * 2 - 1) * institut.hausBiasInstabilitaet : 0;
  const effektivesBias = institut.hausBias + sprung;
  const gemessen = clamp(umfrageMessung(wahrerWert, rng, { institutId: institut.id, angstklima }) + sprung, 0, 100);
  // Gefällt das Ergebnis dem eigenen Lager? (Recherche B.4.2: Schubladen-Umfragen)
  const guenstig = effektivesBias >= 0 ? gemessen >= wahrerWert - 1 : gemessen <= wahrerWert - 2;
  const p = guenstig ? institut.publikation.wennGuenstig : institut.publikation.wennUnguenstig;
  if (rng.next() >= p) return { schublade: institut.name };
  const wert = Math.round(gemessen * 10) / 10;
  const umfrage: ZeitungUmfrage = {
    institutId: institut.id,
    institut: institut.name,
    wert,
    ...(vormonat !== undefined ? { vormonat } : {}),
    ...(institut.stichprobeTransparent ? { stichprobe: institut.stichprobe } : {}),
    methode: institut.methode.replace("_", " + "),
    abweichung: Math.round((gemessen - wahrerWert) * 10) / 10,
  };
  return { umfrage };
}

// ---------------------------------------------------------------------------
// Zustand

export function zeitungStart(world: World): ZeitungZustand {
  return {
    archiv: [],
    ungelesen: 0,
    naechsteNummer: 1,
    warteschlange: [],
    // Die erste Ausgabe greift den laufenden Monat auf (bei alten Spielständen: den letzten Monat)
    letzteMonatsausgabeTag: Math.max(0, world.day - 31),
    wirtschaft: { inflation: world.published.inflation.value, policyRate: world.economy.policyRate, usdTry: world.economy.usdTry },
  };
}

/** Der Zeitungszustand; ältere Spielstände legen ihn beim ersten Bedarf an (Migration). */
export function zeitungVon(world: World): ZeitungZustand {
  const spiel = world.spiel!;
  if (!spiel.zeitung) spiel.zeitung = zeitungStart(world);
  return spiel.zeitung;
}

/** Die Oberfläche hat die Zeitung geöffnet: Das Badge „Neue Ausgabe" erlischt. */
export function zeitungGelesen(world: World): void {
  const z = world.spiel?.zeitung;
  if (z) z.ungelesen = 0;
}

function legeAb(world: World, ausgabe: ZeitungAusgabe): void {
  const z = zeitungVon(world);
  z.archiv.push(ausgabe);
  if (z.archiv.length > ARCHIV_MAX) z.archiv.splice(0, z.archiv.length - ARCHIV_MAX);
  z.ungelesen += 1;
  z.naechsteNummer += 1;
}

function hinweis(world: World, ausgabe: ZeitungAusgabe): void {
  const spiel = world.spiel!;
  const lead = ausgabe.blaetter[0]?.artikel[0];
  spiel.hinweise.push({
    // Präfix „zeitung-": Klasse C der Auto-Stopp-Taxonomie — Umlauf, die Zeit läuft weiter
    id: `zeitung-${ausgabe.anlass === "eilmeldung" ? "eil-" : ""}${world.day}-${ausgabe.nummer}`,
    titel: ausgabe.anlass === "eilmeldung" ? "Eilmeldung in der Zeitung" : "Die Zeitung: Neue Ausgabe",
    szene: "istanbul",
    text: [
      `Ausgabe Nr. ${ausgabe.nummer}: ${ausgabe.blaetter.map((b) => b.name).join(", ")}.${lead ? ` Leitartikel: „${lead.schlagzeile}" (${ausgabe.blaetter[0]!.name}).` : ""}`,
    ],
  });
}

// ---------------------------------------------------------------------------
// Eilmeldung: Digital berichtet noch am selben Tag, Print erst im nächsten Monat

export interface Grossereignis {
  art: "wahlsieg" | "bruch" | "krise" | "fertigstellung";
  titel: string;
  fakt: string;
  wertung: number;
  krieg?: boolean;
  schluessel?: string[];
}

const SPARTE_GROSS: Record<Grossereignis["art"], Sparte> = { wahlsieg: "politik", bruch: "politik", krise: "welt", fertigstellung: "programm" };

/**
 * Großereignis (Wahlsieg, Vertragsbruch, Krise, Fertigstellung, Kriegsphase): Die digitalen
 * Cluster bringen es sofort (Eilmeldung), die Print-Blätter erst in der nächsten Monatsausgabe —
 * bis dahin liegt der Vorgang in der Warteschlange (Sichtbarkeits-Mechanik, Recherche A.5.4).
 */
export function zeitungEreignis(world: World, e: Grossereignis): void {
  const spiel = world.spiel;
  if (!spiel || spiel.ende) return;
  const z = zeitungVon(world);
  const vorgang: ZeitungVorgang = {
    id: `gross-${world.day}-${z.naechsteNummer}`,
    art: e.art,
    sparte: e.krieg ? "welt" : SPARTE_GROSS[e.art],
    titel: e.titel,
    fakt: e.fakt,
    wertung: e.wertung,
    tag: world.day,
    datum: world.date,
    gross: true,
    ...(e.krieg ? { krieg: true } : {}),
    ...(e.schluessel ? { schluessel: e.schluessel } : {}),
  };
  z.warteschlange.push(vorgang);

  const kontext: TextKontext = { name: world.player?.name ?? "Die Regierung", partei: world.player?.partei.kurz ?? "" };
  // Eilmeldung: das digitale Blatt mit der Meldung, dazu die Blätter des Monats ohne sie (Print folgt).
  // Ein Großereignis ist für das freie Netz zu groß zum Übersehen — Digital berichtet immer;
  // die Berichtswahrscheinlichkeit wirkt auf die Print-Aufarbeitung im nächsten Monat (und auf Routine).
  const auswahl = ["digital_frei", ...blattAuswahl(monatIndex(world.date)).filter((id) => id !== "digital_frei")];
  const blaetter: ZeitungBlatt[] = [];
  for (const id of auswahl) {
    const cluster = medienCluster(id)!;
    const def = blattDef(id);
    if (cluster.digital) {
      blaetter.push({ clusterId: id, name: def.name, unterzeile: def.unterzeile, digital: true, ton: framingFuer(cluster), artikel: [artikelFuer(cluster, vorgang, kontext, `e${z.naechsteNummer}-${id}`)], verschwiegen: [] });
    } else {
      blaetter.push({
        clusterId: id,
        name: def.name,
        unterzeile: def.unterzeile,
        digital: false,
        ton: framingFuer(cluster),
        artikel: [
          {
            id: `e${z.naechsteNummer}-${id}-hinweis`,
            art: "ereignis",
            sparte: "politik",
            schlagzeile: "Aus der Redaktion",
            text: ["Die Druckerpresse läuft schon für morgen; die ausführliche Einordnung lesen Sie in der nächsten Ausgabe."],
            textQuelle: "regel",
            wirkung: 0,
            framing: { art: framingFuer(cluster), staerke: framingStaerke(cluster) },
            kurz: true,
          },
        ],
        verschwiegen: [vorgang.titel],
      });
    }
  }
  const ausgabe: ZeitungAusgabe = { nummer: z.naechsteNummer, datum: world.date, monat: world.date.slice(0, 7), anlass: "eilmeldung", blaetter };
  legeAb(world, ausgabe);
  hinweis(world, ausgabe);
  // Nur die digitale Reichweite wirkt schon jetzt; der Print-Effekt kommt mit der Monatsausgabe
  wendeWirkungAn(world, ausgabe);
}

// ---------------------------------------------------------------------------
// Monatsausgabe

/** Chronik-Einträge des Monats als Vorgänge (Ereignisse, Skandale, Programme) — ohne das, was die Eilmeldung schon griff. */
function chronikVorgaenge(world: World, z: ZeitungZustand): ZeitungVorgang[] {
  const spiel = world.spiel!;
  const gesperrt = z.warteschlange.flatMap((v) => v.schluessel ?? []);
  const out: ZeitungVorgang[] = [];
  for (const c of spiel.chronik) {
    if (c.tag <= z.letzteMonatsausgabeTag || c.tag >= world.day) continue;
    if (gesperrt.some((s) => c.titel.includes(s) || c.ausgang.includes(s))) continue;
    if (/^(Der Präsident wirkt|Die Lage beruhigt|Überlastung)/.test(c.titel)) continue; // Verfassung ist intern
    let art: VorgangArt = "ereignis";
    let sparte: Sparte = "ereignis";
    let wertung = c.ausgang.startsWith("Keine Entscheidung") || c.ausgang.startsWith("Ausgesessen") ? -0.55 : -0.15;
    if (c.titel.includes("packt aus")) {
      art = "skandal";
      sparte = "politik";
      wertung = -0.9;
    } else if (/^(Schritt erreicht|Programm erfüllt)/.test(c.titel)) {
      art = "programm";
      sparte = "programm";
      wertung = 0.5;
    } else if (c.titel.startsWith("Wirkungsbericht:")) {
      art = "programm";
      sparte = "programm";
      wertung = c.ausgang.includes("Es wirkt.") ? 0.4 : c.ausgang.includes("Keine Wirkung") ? -0.35 : 0;
    } else if (c.titel === "Zusammenbruch") {
      wertung = -0.6;
    }
    out.push({ id: `chronik-${c.tag}-${out.length}`, art, sparte, titel: c.titel, fakt: `${c.titel}: ${c.ausgang}`, wertung, tag: c.tag, datum: c.datum });
  }
  return out.slice(-3);
}

/** Beschlossene und gescheiterte Gesetze des Monats aus dem Protokoll. */
function gesetzVorgaenge(world: World, z: ZeitungZustand): ZeitungVorgang[] {
  const out: ZeitungVorgang[] = [];
  for (const l of world.log) {
    if (l.day <= z.letzteMonatsausgabeTag || l.day >= world.day || l.kind !== "entscheidung") continue;
    const ja = /^Das Parlament nimmt „(.+)“ an/.exec(l.text);
    const nein = /^Das Parlament lehnt „(.+)“ ab/.exec(l.text);
    const m = ja ?? nein;
    if (!m) continue;
    out.push({
      id: `gesetz-${l.day}-${out.length}`,
      art: "gesetz",
      sparte: "politik",
      titel: m[1]!,
      fakt: ja ? `Das Parlament nimmt „${m[1]}" mit Mehrheit an.` : `Das Parlament lehnt „${m[1]}" ab.`,
      wertung: ja ? 0.3 : -0.5,
      tag: l.day,
      datum: l.date,
    });
  }
  return out.slice(-2);
}

/** Die größten Wirtschaftsbewegungen seit der letzten Ausgabe (veröffentlichte Werte, nie die verdeckten). */
function wirtschaftVorgaenge(world: World, z: ZeitungZustand): ZeitungVorgang[] {
  const kandidaten: { titel: string; fakt: string; wertung: number; schwere: number }[] = [];
  const infl = world.published.inflation;
  const dInfl = infl.value - z.wirtschaft.inflation;
  if (Math.abs(dInfl) >= 0.75) {
    kandidaten.push({
      titel: dInfl > 0 ? "Teuerung zieht an" : "Teuerung lässt nach",
      fakt: `Die Inflation liegt bei ${fmt(infl.value)} Prozent zum Vorjahr (zuletzt ${fmt(z.wirtschaft.inflation)}), Stand ${formatMonthDe(infl.period)}.`,
      wertung: dInfl > 0 ? -0.7 : 0.55,
      schwere: Math.abs(dInfl),
    });
  }
  const dZins = world.economy.policyRate - z.wirtschaft.policyRate;
  if (Math.abs(dZins) >= 0.5) {
    kandidaten.push({
      titel: dZins > 0 ? "Zentralbank verschärft den Zins" : "Zentralbank senkt den Zins",
      fakt: `Der Leitzins steht bei ${fmt(world.economy.policyRate)} Prozent (zuvor ${fmt(z.wirtschaft.policyRate)}).`,
      wertung: dZins > 0 ? -0.35 : 0.25,
      schwere: Math.abs(dZins) * 1.5,
    });
  }
  const dLira = (world.economy.usdTry / z.wirtschaft.usdTry - 1) * 100;
  if (Math.abs(dLira) >= 2) {
    kandidaten.push({
      titel: dLira > 0 ? "Lira gibt nach" : "Lira erholt sich",
      fakt: `Der Dollar kostet ${fmt(world.economy.usdTry)} Lira; das sind ${fmt(Math.abs(dLira))} Prozent ${dLira > 0 ? "mehr" : "weniger"} als vor einem Monat.`,
      wertung: dLira > 0 ? -0.6 : 0.4,
      schwere: Math.abs(dLira) / 2,
    });
  }
  kandidaten.sort((a, b) => b.schwere - a.schwere);
  return kandidaten.slice(0, 2).map((k, i) => ({ id: `wirt-${world.day}-${i}`, art: "wirtschaft" as const, sparte: "wirtschaft" as const, titel: k.titel, fakt: k.fakt, wertung: k.wertung, tag: world.day, datum: world.date }));
}

/** Repressionsklima für die Umfrage-Messung: aus der Pressefreiheit abgeleitet (Recherche B.3). */
function angstklimaVon(world: World): number {
  const presse = nationalAverage(NET, world.net, "pressefreiheit");
  return clamp(Number.isFinite(presse) ? 100 - presse : 0, 0, 100);
}

/** Die Monatsausgabe: Routine, Eilmeldungen im Print, Umfrage des Instituts — und die Wirkung auf die Wählergruppen. */
export function zeitungMonat(world: World): void {
  const spiel = world.spiel;
  if (!spiel || spiel.ende) return;
  const z = zeitungVon(world);
  const monat = world.date.slice(0, 7);
  if (z.archiv.some((a) => a.anlass === "monatlich" && a.monat === monat)) return;
  const kontext: TextKontext = { name: world.player?.name ?? "Die Regierung", partei: world.player?.partei.kurz ?? "" };
  const rng = zeitungZufall(`${world.seed}|zeitung|${monat}`);

  // Print holt auf, was Digital schon brachte (nur was VOR heute geschah — nicht das, was heute passiert)
  const printNachhol = z.warteschlange.filter((v) => v.tag < world.day);
  z.warteschlange = z.warteschlange.filter((v) => v.tag >= world.day);

  const vorgaenge: ZeitungVorgang[] = [...printNachhol, ...chronikVorgaenge(world, z), ...gesetzVorgaenge(world, z), ...wirtschaftVorgaenge(world, z)];

  // Die Umfrage des Monats: ein Institut mit Haus-Bias misst, und manchmal bleibt die Zahl in der Schublade
  const ergebnis = monatsUmfrage(spiel.umfrage.zustimmung, angstklimaVon(world), rng, z.letzteUmfrage);
  if (ergebnis.umfrage) {
    z.letzteUmfrage = ergebnis.umfrage.wert;
    const u = ergebnis.umfrage;
    const delta = u.vormonat !== undefined ? u.wert - u.vormonat : 0;
    const stich = u.stichprobe !== undefined ? `Stichprobe ${u.stichprobe.toLocaleString("de-DE")}, Methode ${u.methode}` : `Methode ${u.methode}, Stichprobe nicht offengelegt`;
    vorgaenge.push({
      id: `umfrage-${world.day}`,
      art: "umfrage",
      sparte: "umfrage",
      titel: `${u.institut}: ${fmt(u.wert)} Prozent`,
      fakt: `${u.institut} misst der Regierung ${fmt(u.wert)} Prozent Zustimmung${u.vormonat !== undefined ? ` (${delta >= 0 ? "+" : "−"}${fmt(Math.abs(delta))} zum Vormonat)` : ""}; ${stich}.`,
      wertung: delta > 1 ? 0.4 : delta < -1 ? -0.5 : 0.05,
      tag: world.day,
      datum: world.date,
    });
  }

  const blaetter = baueBlaetter(blattAuswahl(monatIndex(world.date)), vorgaenge, kontext, rng, z.naechsteNummer);
  const ausgabe: ZeitungAusgabe = {
    nummer: z.naechsteNummer,
    datum: world.date,
    monat,
    anlass: "monatlich",
    blaetter,
    ...(ergebnis.umfrage ? { umfrage: ergebnis.umfrage } : {}),
    ...(ergebnis.schublade ? { umfrageSchublade: ergebnis.schublade } : {}),
  };
  legeAb(world, ausgabe);
  hinweis(world, ausgabe);
  z.letzteMonatsausgabeTag = world.day;
  z.wirtschaft = { inflation: world.published.inflation.value, policyRate: world.economy.policyRate, usdTry: world.economy.usdTry };
  wendeWirkungAn(world, ausgabe);
}

// ---------------------------------------------------------------------------
// Spieler-Wirkung: Berichte bewegen die Wählergruppen, Schweigen lässt sie ruhig

/** Welche Wählergruppen ein Mediensegment ausmachen (Näherung nach data/medien.ts, A.5.2). */
const SEGMENT_GRUPPEN: Record<keyof MedienCluster["reichweiteSegmente"], [gruppe: string, anteil: number][]> = {
  laendlich_konservativ: [
    ["konservative", 0.5],
    ["landwirte", 0.3],
    ["rentner", 0.2],
  ],
  urban_alt: [
    ["arbeitnehmer", 0.6],
    ["rentner", 0.4],
  ],
  urban_jung: [["junge", 1]],
  kurdistan: [["minderheiten", 1]],
  akademisch: [["staedtische_saekulare", 1]],
};

/** Grundzug je Artikel: klein genug, dass eine einzelne Ausgabe nie kippt (Kalibrierung). */
const WIRKUNG_GRUNDZUG = 0.9;
/** Obergrenze je Gruppe und Ausgabe, damit auch Dauerfeuer nicht eskaliert. */
const WIRKUNG_DECKEL = 1.6;

/**
 * Die Stimmungswirkung einer Ausgabe je Wählergruppe: Reichweite des Clusters im Segment ×
 * Segment-Anteil der Gruppe × Wirkung des Artikels. Wer nicht berichtet, wirkt nicht —
 * so erreicht derselbe Skandal das ländliche Lager schwächer als die urbane Opposition (A.5.4).
 */
export function berechneWirkung(ausgabe: ZeitungAusgabe): Map<string, number> {
  const delta = new Map<string, number>();
  for (const blatt of ausgabe.blaetter) {
    const cluster = medienCluster(blatt.clusterId);
    if (!cluster) continue;
    for (const artikel of blatt.artikel) {
      if (artikel.wirkung === 0) continue;
      for (const [segment, gruppen] of Object.entries(SEGMENT_GRUPPEN)) {
        const reichweite = cluster.reichweiteSegmente[segment as keyof MedienCluster["reichweiteSegmente"]];
        if (reichweite <= 0) continue;
        for (const [gruppe, anteil] of gruppen) {
          const d = WIRKUNG_GRUNDZUG * artikel.wirkung * reichweite * anteil;
          delta.set(gruppe, clamp((delta.get(gruppe) ?? 0) + d, -WIRKUNG_DECKEL, WIRKUNG_DECKEL));
        }
      }
    }
  }
  return delta;
}

/** Wendet die Stimmungswirkung einer Ausgabe auf das Politiknetz an (Gruppen klingen von selbst wieder ab). */
export function wendeWirkungAn(world: World, ausgabe: ZeitungAusgabe): void {
  for (const [gruppe, delta] of berechneWirkung(ausgabe)) {
    if (Math.abs(delta) < 0.01) continue;
    wirke(world, gruppe, delta);
  }
}
