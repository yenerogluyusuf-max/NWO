// Typen des Ministerflusses: Vorlagen (Frage mit Optionen, Empfehlung des Ministers), Befehle an die Minister und Rückmeldungen.
// Vorlagen selbst sind abgeleitet (sim/ministerfluss.ts rechnet sie aus dem Weltzustand); gespeichert wird nur, was nicht abgeleitet
// werden kann: Was entschieden, vertagt oder abgelehnt wurde, welche Befehle laufen und was die Minister zurückgemeldet haben.
// Alles reines JSON, es gehört zum Spielstand. Alle Zahlen sind Spielparameter (Platzhalter der Kalibrierung), keine Tatsachen.

import type { Figur } from "./spiel-typen";
import type { Msg } from "../i18n/typen";
import type { AnsatzId } from "./gespraeche";
import type { AktionId } from "./laender";
import type { Vorschlag } from "./vorschlaege";

export type Amt = Figur["amt"];

/** Wie eine Vorlage auf den Tisch kommt: eine Frage mit Optionen, ein einzelner Vorschlag, eine Warnung, eine Rückmeldung oder das Schweigen eines Ministers. */
export type VorlagenArt = "frage" | "vorschlag" | "warnung" | "rueckmeldung" | "schweigen";

export type VorlagenQuelle = "ereignis" | "kabinett" | "lage" | "problem" | "zusage" | "person" | "befehl" | "auftrag";

/** Was eine Option bewirkt; reine Daten, damit die Vorlage nach dem Laden dieselbe bleibt. Ausgeführt wird immer über die Kernfunktionen. */
export type OptionAktion =
  | { art: "ereignis"; ereignisId: string; optionId: string }
  | { art: "kabinett"; themaId: string; optionId: string }
  | { art: "massnahme"; id: string; ziel: number; ort: number[] | null }
  | { art: "zusage"; zusageId: string; weg: "einloesen" | "vertroesten" | "brechen" }
  | { art: "gespraech"; figurId: string; themaId: string; ansatz: AnsatzId }
  | { art: "befehl"; entwurf: BefehlEntwurf }
  | { art: "kenntnis" }
  | { art: "spaeter"; tage: number }
  | { art: "nichts" }
  /** Bitte eines Ministers bei Überlast eines Netzes (sim/infrastruktur.ts) */
  | import("./infrastruktur").InfraAktion;

/** Eine Größe mit Stand heute, Stand ohne Eingriff und Stand mit Eingriff nach einigen Monaten (Politiknetz bei sonst unveränderter Wirtschaftslage). */
export interface NutzenZeile {
  id: string;
  name: string;
  art: "groesse" | "problem";
  /** Größen: Landesdurchschnitt 0 bis 100; Probleme: Zahl der Provinzen, in denen das Problem akut ist */
  einheit: "von 100" | "Provinzen";
  jetzt: number;
  ohne: number;
  mit: number;
  monate: number;
  schlechtWennHoch: boolean;
  /** Ob der Eingriff die Größe verbessert (true), verschlechtert (false) oder kaum bewegt (null) */
  besser: boolean | null;
}

export interface VorlageOption {
  id: string;
  label: string;
  text?: string;
  kosten: { pk: number; aufmerksamkeit: number };
  /** Sichtbare Folgen in Worten (aus Vorschau und Plan, nie erfunden) */
  folgen: string[];
  nutzen?: NutzenZeile[];
  /** Wer dafür ist: Minister und Wählergruppen, mit Namen */
  dafuer: string[];
  dagegen: string[];
  /** Wählergruppen, die verlieren */
  verlierer: string[];
  aktion: OptionAktion;
  moeglich: boolean;
  /** Warum es gerade nicht geht */
  grund?: string;
  /** Ob die Option vor allem das eigene Ressort des vorlegenden Ministers stärkt */
  eigenesRessort?: boolean;
  /** Bei Gesetzen: wie viele Stimmen im Parlament fehlen (für die Empfehlung, unabhängig von der Sprache der Folgen) */
  luecke?: number;
}

export type VorlagenZiel =
  | { art: "akte"; akte: string }
  | { art: "politik"; massnahme?: { id: string; level?: number; ort?: number[] | null } }
  | { art: "ereignis"; id: string }
  | { art: "land"; id: string }
  | { art: "karte"; problemId?: string };

export interface VorlageMinister {
  id: string;
  name: string;
  rolle: string;
  weiblich: boolean;
  loyalitaet: number;
  faehigkeit: number;
  stil: string;
}

export interface Vorlage {
  /** Stabil, solange es dieselbe Frage im selben Zeitfenster ist; unter dieser Kennung merkt sich der Spielstand, was entschieden wurde */
  id: string;
  /** Das Thema ohne Zeitfenster: „Später“ und „Nicht tun“ gelten für das Thema, auch wenn die Vorlage im nächsten Fenster wiederkommt */
  thema: string;
  art: VorlagenArt;
  quelle: VorlagenQuelle;
  amt: Amt;
  /** Wer vorlegt; fehlt, wenn das Amt unbesetzt ist */
  minister?: VorlageMinister;
  titel: string;
  /** Der Titel als Meldung, wenn er im Spielstand landen kann (gesehen, verfallen): so folgt er einem Sprachwechsel */
  titelMsg?: Msg;
  anlass: string[];
  optionen: VorlageOption[];
  empfehlung?: { optionId: string; grund: string; von: string; hinweis?: string };
  /** Tage bis zur Frist; fehlt bei Vorlagen ohne Frist */
  frist?: number;
  /** Seit diesem Tag liegt die Vorlage vor */
  tag: number;
  /** 0 bis 100 */
  prioritaet: number;
  /** Warum sie so weit oben (oder unten) liegt, in einem Satz */
  prioritaetGrund: string;
  ort?: number[];
  /** Wie schlimm das Problem ist und wo (bei Vorlagen aus akuten Problemen) */
  problem?: { id: string; name: string; provinzen: number; ortNamen: string[]; anteil: number };
  ziel?: VorlagenZiel;
  /** Bei Vorlagen aus dem Problemlöser: der ursprüngliche Vorschlag (für „Einstellen und ansehen“) */
  vorschlag?: Vorschlag;
  /** Ob die Vorlage erst später entschieden werden kann (etwa bis zur nächsten Kabinettssitzung) */
  wartet?: string;
}

// ---------------------------------------------------------------------------
// Befehle

export type BefehlTyp = "ziel" | "vorhaben" | "verhandeln";

/** Was der Präsident anordnet. `ziel`: Größe des Ressorts (Auftrag mit Frist); `vorhaben`: Maßnahme mit Zielstufe; `verhandeln`: Land und Handlung. */
export interface BefehlEntwurf {
  typ: BefehlTyp;
  figurId: string;
  groesse?: string;
  massnahme?: string;
  ziel?: number;
  land?: string;
  aktion?: AktionId;
}

export interface Befehl extends BefehlEntwurf {
  id: string;
  erteilt: number;
  faellig: number;
  status: "laeuft" | "erledigt" | "verweigert";
  ergebnis?: "erfolg" | "teilerfolg" | "scheitern";
  text?: string;
}

export interface Rueckmeldung {
  id: string;
  tag: number;
  figurId: string;
  amt: Amt;
  titel: string;
  text: string[];
  ergebnis: "erfolg" | "teilerfolg" | "scheitern" | "verweigert" | "info";
  befehlId?: string;
  /** Wenn der Entwurf fertig ist, aber nicht eingebracht werden konnte: das Vorhaben zum Nachholen */
  nachholen?: { massnahme: string; ziel: number; ort: number[] | null };
}

export interface VerfalleneVorlage {
  id: string;
  /** Meldung (seit dem Sprachwechsel) oder fertiger Text aus älteren Spielständen */
  titel: string | Msg;
  amt: Amt;
  quelle: VorlagenQuelle;
  seit: number;
  verfallen: number;
  grund: string | Msg;
}

export interface MinisterFlussZustand {
  /** Kennung → was entschieden wurde (Tag, Wahl); begrenzt */
  erledigt: Record<string, { tag: number; text: string }>;
  /** Kennung → Tag der Wiedervorlage */
  vertagt: Record<string, number>;
  /** Kennung → Tag, an dem der Präsident bewusst nichts tat; die Vorlage kommt vorerst nicht wieder */
  abgelehnt: Record<string, number>;
  befehle: Befehl[];
  rueckmeldungen: Rueckmeldung[];
  /** Gelesene Rückmeldungen und abgeschlossene Aufträge (Kennungen) */
  gelesen: string[];
  verfallen: VerfalleneVorlage[];
  /** Vorlagen, die zuletzt auf dem Tisch lagen; was daraus verschwindet, ohne dass entschieden wurde, verfällt sichtbar */
  gesehen: Record<string, { titel: string | Msg; amt: Amt; quelle: VorlagenQuelle; tag: number; thema?: string }>;
}

export function neuerMinisterFluss(): MinisterFlussZustand {
  return { erledigt: {}, vertagt: {}, abgelehnt: {}, befehle: [], rueckmeldungen: [], gelesen: [], verfallen: [], gesehen: {} };
}
