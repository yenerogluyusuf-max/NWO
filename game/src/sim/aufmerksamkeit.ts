// Aufmerksamkeit und Belastung des Präsidenten (Belastungs-/Aufmerksamkeitskonto, RECHERCHE_SYNTHESE_RUNDE2 §3.1):
// Jede Amtshandlung verbraucht Aufmerksamkeit zusätzlich zum Politischen Kapital; sie lädt sich täglich wieder auf.
// Wer dauerhaft über seine Kraft hinaus regiert, sammelt Belastung — in drei Stufen (CK3-Muster): ruhig, angespannt,
// überlastet. Nie ein hartes Verbot: Wer will, darf die Aufmerksamkeit bis null überziehen und kauft das mit Belastung.
// Erst die Überlastung erzwingt eine ehrliche Zwangspause, anhaltende Überlastung den Zusammenbruch.
// Alle Zahlen sind Spielparameter (Platzhalter der Kalibrierung), keine Tatsachen.

import { addLog } from "./log";
import { addDays, formatDateDe } from "./dates";
import { clamp } from "./economy";
import { vertrauenAendern } from "./wirkung";
import type { World } from "./types";

export interface BelastungsTreiber {
  tag: number;
  text: string;
  punkte: number;
}

export type VerfassungsStufe = 0 | 1 | 2;

/** Der Zustand des Kontos; ältere Spielstände bekommen beim Laden die Startwerte (siehe migriereVerfassung). */
export interface Verfassung {
  /** Aufmerksamkeit, 0 bis 100 */
  aufmerksamkeit: number;
  /** Belastung, 0 bis 100 */
  belastung: number;
  /** Zuletzt bekannte Stufe (für Chronik-Einträge bei Stufenwechseln) */
  stufe: VerfassungsStufe;
  /** Tage am Stück über der Zusammenbruch-Schwelle */
  ueberlastTage: number;
  /** Bis zu diesem Tag starten keine neuen Vorgänge (Zwangspause) */
  pauseBis?: number;
  /** Tag, an dem die letzte Zwangspause begann (Abkühlung, damit Pausen nicht kaskadieren) */
  letztePause?: number;
  /** Was die Belastung zuletzt trieb (rollierend, für den Tooltip) */
  treiber: BelastungsTreiber[];
}

export const VERFASSUNG = {
  startAufmerksamkeit: 80,
  startBelastung: 10,
  /** Aufladung je Tag */
  regenProTag: 3,
  /** Aufmerksamkeit darunter: der Präsident regiert auf Verschleiß (+Belastung je Tag) */
  erschoepfungAb: 20,
  erschoepfungProTag: 2,
  /** Aufmerksamkeit darüber: der Tag lässt Luft (−Belastung je Tag) */
  erholungAb: 60,
  erholungProTag: 1,
  /** Stufen der Belastung: darunter ruhig, ab 40 angespannt, ab 70 überlastet */
  angespanntAb: 40,
  ueberlastetAb: 70,
  /** Belastung über dieser Schwelle, so viele Tage am Stück: Zusammenbruch */
  zusammenbruchAb: 85,
  zusammenbruchTage: 30,
  /** Dauer der Zwangspause bei Überlastung bzw. nach dem Zusammenbruch */
  pauseTage: 3,
  pauseZusammenbruch: 5,
  /** Tage nach einer Zwangspause ohne neue Zwangspause */
  pauseAbkuehlung: 14,
  /** Belastung nach dem Zusammenbruch: der Druck ist erst einmal raus */
  belastungNachBruch: 55,
  /** Sturz-Warnung und Eskalations-Ereignisse treiben die Belastung sofort */
  sturzWarnung: 8,
  eskalation: 6,
  /** Eine Fertigstellungs-Feier lässt die Belastung sinken */
  feierErloesung: 8,
  /** Fenster der Treiber-Liste in Tagen */
  treiberTage: 30,
  /** Angespannt: die Stimmenschätzung streut breiter, Einbringungen verzögern sich mitunter */
  unsicherheitFaktor: 1.5,
  verzugChance: 0.25,
  verzugTage: 2,
} as const;

/** Aufmerksamkeitskosten der Amtshandlungen, zusätzlich zum Kapital: klein für Routine, groß für Vorgänge. */
export const AUFMERKSAMKEIT_KOSTEN = {
  gesetz: 10,
  erlass: 10,
  stimmenkauf: 3,
  gespraech: 4,
  verhandlungGespraech: 2,
  zugestaendnis: 4,
  duldung: 6,
  koalition: 8,
  abwerben: 6,
  landAktion: { gipfel: 8, handel: 6, ruestung: 6, druck: 4, entspannen: 6, hilfe: 6 } as const,
  reichVorhaben: 8,
  programmSchritt: 4,
  /** Ein Verfassungspaket ist der größte Vorgang der Bühne */
  verfassungPaket: 14,
  verfassungKampagne: 6,
} as const;

export const STUFE_NAME: Record<VerfassungsStufe, string> = { 0: "ruhig", 1: "angespannt", 2: "überlastet" };

export function verfassungStart(): Verfassung {
  return { aufmerksamkeit: VERFASSUNG.startAufmerksamkeit, belastung: VERFASSUNG.startBelastung, stufe: 0, ueberlastTage: 0, treiber: [] };
}

/** Das Konto dieser Partie; ältere Spielstände ohne Konto bekommen beim ersten Zugriff die Startwerte. */
export function verfassungVon(w: World): Verfassung {
  const sp = w.spiel;
  if (!sp) return verfassungStart();
  sp.verfassung ??= verfassungStart();
  return sp.verfassung;
}

export function stufeVon(belastung: number): VerfassungsStufe {
  return belastung >= VERFASSUNG.ueberlastetAb ? 2 : belastung >= VERFASSUNG.angespanntAb ? 1 : 0;
}

/** Wie breit die Unsicherheit der Stimmenschätzung gerade streut (Stufe „angespannt“ verbreitert sie). */
export function unsicherheitFaktor(w: World): number {
  return stufeVon(verfassungVon(w).belastung) >= 1 ? VERFASSUNG.unsicherheitFaktor : 1;
}

/** Deterministischer Wert in [0,1) aus einem Schlüssel — für kleine Chancen ohne Zufallszustand. */
export function hashWert(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}

// ---------------------------------------------------------------------------
// Verbrauch und Zufluss

/** Aufmerksamkeit ausgeben. Überziehen bis null ist erlaubt — die Belastung folgt im Tagesrhythmus. */
export function verbrauche(w: World, punkte: number, _was: string): void {
  if (!w.spiel || punkte <= 0) return;
  const v = verfassungVon(w);
  v.aufmerksamkeit = clamp(v.aufmerksamkeit - punkte, 0, 100);
}

function treiben(w: World, v: Verfassung, punkte: number, text: string): void {
  v.belastung = clamp(v.belastung + punkte, 0, 100);
  if (punkte <= 0) return;
  v.treiber.push({ tag: w.day, text, punkte });
  if (v.treiber.length > 40) v.treiber = v.treiber.slice(-40);
}

/** Ein Ereignis, das die Belastung sofort treibt (Eskalation, Sturz-Warnung). */
export function belastungEreignis(w: World, punkte: number, text: string): void {
  if (!w.spiel || punkte <= 0) return;
  treiben(w, verfassungVon(w), punkte, text);
}

/** Erleichterung, etwa nach einer Fertigstellungs-Feier. */
export function belastungSinken(w: World, punkte: number): void {
  if (!w.spiel || punkte <= 0) return;
  const v = verfassungVon(w);
  v.belastung = clamp(v.belastung - punkte, 0, 100);
}

/** Was die Belastung zuletzt trieb: die stärksten drei Treiber der vergangenen Wochen, für den Tooltip. */
export function belastungsTreiber(w: World): { text: string; punkte: number }[] {
  const v = verfassungVon(w);
  const summen = new Map<string, number>();
  for (const t of v.treiber) {
    if (t.tag < w.day - VERFASSUNG.treiberTage) continue;
    summen.set(t.text, (summen.get(t.text) ?? 0) + t.punkte);
  }
  return [...summen.entries()].map(([text, punkte]) => ({ text, punkte })).sort((a, b) => b.punkte - a.punkte).slice(0, 3);
}

// ---------------------------------------------------------------------------
// Zwangspause und Schranken für neue Vorgänge

/** Ob gerade eine Zwangspause läuft. */
export function zwangspause(w: World): boolean {
  const v = w.spiel?.verfassung;
  return v?.pauseBis !== undefined && v.pauseBis > w.day;
}

/** Warum gerade kein neuer Vorgang startet; leer, wenn es geht. Laufendes ist nie gesperrt. */
export function neuanfangGrund(w: World): string | undefined {
  const sp = w.spiel;
  if (!sp) return undefined;
  const v = verfassungVon(w);
  if (v.pauseBis === undefined || v.pauseBis <= w.day) return undefined;
  const datum = formatDateDe(addDays(w.date, v.pauseBis - w.day));
  return `Der Präsident braucht einen ruhigen Tag: Bis ${datum} startet er keine neuen Vorgänge; das Laufende — Gesetze im Parlament, Bauvorhaben, Programme — geht weiter.`;
}

// ---------------------------------------------------------------------------
// Tagesrhythmus

function pauseBeginnen(w: World, v: Verfassung, tage: number, bruch: boolean): void {
  const sp = w.spiel!;
  v.pauseBis = w.day + tage;
  v.letztePause = w.day;
  const datum = formatDateDe(addDays(w.date, tage));
  if (bruch) {
    sp.hinweise.push({
      id: `zusammenbruch-${w.day}`,
      titel: "Zusammenbruch",
      szene: "istanbul",
      text: [
        "Mitten im Termin bricht der Präsident zusammen; der Arzt spricht von Erschöpfung, der Stab löscht den Kalender.",
        `Bis ${datum} startet er keine neuen Vorgänge. Das Vertrauen ins Amt leidet, und das Umfeld fragt sich, wie lange das noch gut geht.`,
      ],
    });
  } else {
    sp.hinweise.push({
      id: `pause-${w.day}`,
      titel: "Der Präsident braucht einen ruhigen Tag",
      szene: "istanbul",
      text: [
        "Zu viele Akten, zu viele Gespräche, zu wenig Schlaf: Der Stab streicht die Neuauflagen aus dem Kalender.",
        `Bis ${datum} startet der Präsident keine neuen Vorgänge; das Laufende geht weiter. Wer sich erholt, regiert wieder mit klarer Hand.`,
      ],
    });
  }
}

function zusammenbruch(w: World, v: Verfassung): void {
  const sp = w.spiel!;
  v.ueberlastTage = 0;
  v.belastung = VERFASSUNG.belastungNachBruch;
  pauseBeginnen(w, v, VERFASSUNG.pauseZusammenbruch, true);
  v.stufe = stufeVon(v.belastung);
  vertrauenAendern(w, -2);
  for (const f of sp.figuren) if (f.imAmt) f.loyalitaet = clamp(f.loyalitaet - 6, 0, 100);
  sp.chronik.push({ tag: w.day, datum: w.date, titel: "Zusammenbruch", ausgang: "Der Präsident bricht unter der Last zusammen; Tage der erzwungenen Ruhe folgen, das Vertrauen ins Amt und in sein Umfeld leidet." });
  addLog(w, "ereignis", "Der Präsident bricht unter der Belastung zusammen.", "Wochen der Überlastung fordern ihren Preis: Vertrauen in die Regierung −2, Loyalität des Umfelds −6, eine Zwangspause folgt.");
}

/** Täglich: Aufladung, Belastungsdrift, Stufenwechsel mit Chronik, Zwangspause und Zusammenbruch. */
export function verfassungTag(w: World): void {
  const sp = w.spiel;
  if (!sp || sp.ende) return;
  const v = verfassungVon(w);

  v.aufmerksamkeit = clamp(v.aufmerksamkeit + VERFASSUNG.regenProTag, 0, 100);
  if (v.aufmerksamkeit < VERFASSUNG.erschoepfungAb) treiben(w, v, VERFASSUNG.erschoepfungProTag, "Regieren am Anschlag: Die Aufmerksamkeit ist erschöpft");
  else if (v.aufmerksamkeit > VERFASSUNG.erholungAb) v.belastung = clamp(v.belastung - VERFASSUNG.erholungProTag, 0, 100);

  if (v.pauseBis !== undefined && v.pauseBis <= w.day) delete v.pauseBis;

  // Zusammenbruch: zu viele Tage über der Schwelle
  if (v.belastung > VERFASSUNG.zusammenbruchAb) v.ueberlastTage += 1;
  else v.ueberlastTage = 0;
  if (v.ueberlastTage >= VERFASSUNG.zusammenbruchTage) {
    zusammenbruch(w, v);
    return;
  }

  // Stufenwechsel: Chronik, bei Überlastung die Zwangspause (mit Abkühlung, damit sie nicht kaskadiert)
  const stufe = stufeVon(v.belastung);
  if (stufe === v.stufe) return;
  const alt = v.stufe;
  v.stufe = stufe;
  if (stufe === 1) {
    if (alt === 0) {
      sp.chronik.push({ tag: w.day, datum: w.date, titel: "Der Präsident wirkt angespannt", ausgang: "Die Belastung ist über 40 gestiegen: Schätzungen streuen breiter, manche Einbringung verzögert sich." });
      addLog(w, "ereignis", "Der Präsident wirkt angespannt.", "Die Belastung ist über 40 gestiegen. Aufmerksamkeit lädt sich täglich auf; wer sie über 60 hält, baut Belastung wieder ab.");
    } else {
      sp.chronik.push({ tag: w.day, datum: w.date, titel: "Die Lage beruhigt sich etwas", ausgang: "Die Belastung fällt unter 70; der Präsident bleibt angespannt." });
    }
  } else if (stufe === 2) {
    sp.chronik.push({ tag: w.day, datum: w.date, titel: "Überlastung", ausgang: "Die Belastung ist über 70 gestiegen; der Stab erzwingt ruhige Tage ohne neue Vorgänge." });
    const abkuehlungVorbei = v.letztePause === undefined || w.day - v.letztePause >= VERFASSUNG.pauseAbkuehlung;
    if (abkuehlungVorbei && v.pauseBis === undefined) {
      pauseBeginnen(w, v, VERFASSUNG.pauseTage, false);
      addLog(w, "ereignis", "Der Präsident braucht einen ruhigen Tag.", `Die Belastung ist über 70 gestiegen: Bis ${formatDateDe(addDays(w.date, VERFASSUNG.pauseTage))} starten keine neuen Vorgänge; das Laufende geht weiter.`);
    }
  } else {
    sp.chronik.push({ tag: w.day, datum: w.date, titel: "Der Präsident wirkt wieder erholt", ausgang: "Die Belastung ist unter 40 gefallen." });
  }
}

// ---------------------------------------------------------------------------
// Migration

const zahl = (x: unknown): x is number => typeof x === "number" && Number.isFinite(x);

/** Alte Spielstände haben kein Konto: Sie laden mit den Startwerten; beschädigte Werte werden repariert. */
export function migriereVerfassung(w: World): void {
  const sp = w.spiel;
  if (!sp) return;
  if (!sp.verfassung) {
    sp.verfassung = verfassungStart();
    return;
  }
  const v = sp.verfassung;
  if (!zahl(v.aufmerksamkeit)) v.aufmerksamkeit = VERFASSUNG.startAufmerksamkeit;
  if (!zahl(v.belastung)) v.belastung = VERFASSUNG.startBelastung;
  v.aufmerksamkeit = clamp(v.aufmerksamkeit, 0, 100);
  v.belastung = clamp(v.belastung, 0, 100);
  if (v.stufe !== 0 && v.stufe !== 1 && v.stufe !== 2) v.stufe = stufeVon(v.belastung);
  if (!zahl(v.ueberlastTage)) v.ueberlastTage = 0;
  if (!Array.isArray(v.treiber)) v.treiber = [];
}
