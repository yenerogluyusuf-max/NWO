// Sicht auf den Dienst als eine Akte (Welle M1, 8. November 2026).
//
// Vorher lag der Dienst an drei Orten (Außen › Dienst mit 43 Zielstaaten und sechs Operationen ohne Zweck, Sicherheit › Behörden › MİT
// mit Inland und Ausbau in der vierten Ebene, Machtkreis › Überprüfen). Jetzt: eine Akte mit Kopf (Kapazität, Laufendes, Lagebild, Schutz),
// den drei Gelegenheiten nach dem echten MİT (Zugriff, Schlag gegen Kader, Austausch), dem Inland und dem Ausbau.
//
// Rechtsgrundlage des echten Dienstes: Gesetz Nr. 2937 über die Nachrichtendienste (mevzuat.gov.tr/MevzuatMetin/1.5.2937.pdf).
// Art. 3: „Cumhurbaşkanına bağlı MİT kurulmuştur“ (seit KHK 694 vom 15.08.2017, bestätigt durch Gesetz 7078). Art. 4 Buchst. h und i
// (eingefügt durch Gesetz 6532 vom 17.04.2014): Aufträge des Präsidenten zu äußerer Sicherheit, Terrorabwehr und nationaler Sicherheit;
// Nachrichtengewinnung im Ausland mit technischen und menschlichen Mitteln. Art. 26: Ermittlungen gegen Angehörige des Dienstes brauchen
// die Erlaubnis des Präsidenten. Daraus im Spiel: Der Dienst handelt nur auf Weisung des Präsidenten, also über diese Akte.

import { t } from "../i18n";
import { aussenZustand } from "./diplomatie";
import { beziehungZurTuerkei } from "./welt-modell";
import { DIENST_VORGAENGE } from "./ereignisse-dienst";
import { OP_DEFS, VORGANG, dienst, vorgangAussicht, type VorgangArt } from "./welt-dienst";
import type { World } from "./types";

export const GELEGENHEITEN: VorgangArt[] = ["zugriff", "kader", "kanal"];

export interface Gelegenheit {
  art: VorgangArt;
  /** Ein offener Vorgang auf dem Schreibtisch */
  offen?: { id: string; land: string; fristTage: number };
  /** Eine laufende Operation dieser Art */
  laufend?: { land: string; restTage: number; p?: number; pAuf?: number };
  /** Ob die Lage die Gelegenheit gerade hergibt, mit den Zahlen, an denen es hängt */
  bedingung: { erfuellt: boolean; text: string };
  /** Aussicht und Risiko in Worten der Sprache, aus derselben Rechnung, die den Ausgang würfelt */
  aussicht: string;
  /** Der letzte Bericht zu dieser Art (Titel beginnt mit dem Namen der Operation) */
  letzter?: { datum: string; ausgang: string; text: string };
}

const pz = (x: number): number => Math.round(x * 100);

/** Tage, bis die nächste Gelegenheit frühestens kommen darf (höchstens eine im Quartal, erst nach dem ersten halben Jahr). */
export function tageBisGelegenheit(w: World): number {
  const q = DIENST_VORGAENGE;
  const ab = Math.max(0, q.ab - w.day);
  const letzte = dienst(w).gelegenheit;
  const quartal = letzte === undefined ? 0 : Math.max(0, q.quartal - (w.day - letzte));
  return Math.max(ab, quartal);
}

function bedingung(w: World, art: VorgangArt): { erfuellt: boolean; text: string } {
  const q = DIENST_VORGAENGE;
  if (art === "kader") {
    const tz = aussenZustand(w).terror;
    const erfuellt = Math.max(tz.pkk, tz.is) >= q.kader.ab;
    return { erfuellt, text: t("welle_m1.dienst.bed.kader", { pkk: Math.round(tz.pkk), is: Math.round(tz.is), ab: q.kader.ab }) };
  }
  if (art === "kanal") {
    const usa = Math.round(beziehungZurTuerkei(w, "USA").vertrauen);
    const rus = Math.round(beziehungZurTuerkei(w, "RUS").vertrauen);
    return { erfuellt: usa >= q.kanal.vertrauen && rus >= q.kanal.vertrauen, text: t("welle_m1.dienst.bed.kanal", { usa, rus, ab: q.kanal.vertrauen }) };
  }
  return { erfuellt: true, text: t("welle_m1.dienst.bed.zugriff", { chance: pz(q.zugriff.chance) }) };
}

function aussicht(w: World, art: VorgangArt): string {
  if (art === "zugriff") {
    // Die Aussicht hängt am Gastland: ohne Mitwirkung (Vertrauen 30) bis volle Mitwirkung (Vertrauen 80)
    const q = VORGANG.zugriff.p;
    return t("welle_m1.dienst.aussicht.zugriff", { von: pz(q.basis), bis: pz(Math.min(q.max, q.basis + q.koop)) });
  }
  if (art === "kader") {
    const s = vorgangAussicht(w, "kader", "IRQ", "schlag");
    const f = vorgangAussicht(w, "kader", "IRQ", "festnahme");
    return t("welle_m1.dienst.aussicht.kader", { p: pz(s.p), auf: pz(s.pAuf), pf: pz(f.p), auff: pz(f.pAuf) });
  }
  return t("welle_m1.dienst.aussicht.kanal", { p: pz(vorgangAussicht(w, "kanal", "USA").p) });
}

/** Die drei Gelegenheiten des Dienstes mit Stand, Bedingung und Aussicht. */
export function gelegenheiten(w: World): Gelegenheit[] {
  const sp = w.spiel;
  if (!sp) return [];
  const dz = dienst(w);
  return GELEGENHEITEN.map((art) => {
    const ev = sp.ereignisse.find((e) => e.vorlage === `dienst_${art}`);
    const op = dz.ops.find((o) => o.art === art);
    const name = OP_DEFS[art].name;
    const b = [...dz.bericht].reverse().find((x) => x.titel.startsWith(name) && x.ausgang !== "info");
    return {
      art,
      ...(ev ? { offen: { id: ev.id, land: String(ev.daten?.land ?? ""), fristTage: Math.max(0, ev.frist - w.day) } } : {}),
      ...(op ? { laufend: { land: op.ziel, restTage: Math.max(0, op.ende - w.day), ...(op.p !== undefined ? { p: op.p } : {}), ...(op.pAuf !== undefined ? { pAuf: op.pAuf } : {}) } } : {}),
      bedingung: bedingung(w, art),
      aussicht: aussicht(w, art),
      ...(b ? { letzter: { datum: b.datum, ausgang: b.ausgang, text: b.text } } : {}),
    };
  });
}

/** Ob der Dienst gerade etwas in diesem Land hat (offene Gelegenheit oder laufende Operation): für den Hinweis in der Länderakte. */
export function dienstImLand(w: World, land: string): boolean {
  const sp = w.spiel;
  if (!sp) return false;
  if (sp.ereignisse.some((e) => e.vorlage.startsWith("dienst_") && e.daten?.land === land)) return true;
  return dienst(w).ops.some((o) => o.ziel === land && o.art !== "gegen");
}
