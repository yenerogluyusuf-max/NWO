// Takt und Gegenkräfte (Welle 3, Fork TAKT; Konzept SPIEL_DURCHDACHT_2026-10-05.md, Abschnitt 6).
//
// Die Messung vom 05.10.2026 (100 Läufe ohne Oberfläche) zeigte: Nichtstun gewinnt (93 % Wiederwahlen, kein Sturz, Kapital in 74 % der Monate am
// Deckel, Zusagen nie überfällig). Dieses Modul gibt dem Spiel Gegenkräfte:
//   1. Kapital über der Schwelle verfällt und nagt an der Legitimität (Rückhalt, der brach liegt, ist keiner).
//   2. Altlasten kosten Kapital: unerledigte Zusagen und akute Probleme verteuern das Regieren Monat für Monat.
//   3. Überfällige Zusagen haben Folgen und verfallen schließlich.
//   4. Ein dauerhaft schwaches Lager löst die Neuwahlforderung der Opposition aus (Ereignis in ereignisse-saison.ts).
// Dazu erfasst es die Rückblicke auf Programmschritte und Verträge (Wirkungsberichte, sim/berichte.ts).
// Alle Zahlen sind Spielparameter (Platzhalter der Kalibrierung), keine Tatsachenbehauptungen.

import { NET } from "./modell";
import { PROVINCES } from "./netz";
import { PROGRAMME, programmZustand } from "./programme";
import { alleLaufenden } from "./abkommen";
import { land } from "./laender";
import { rueckblickAnlegen, rueckblickMarkieren, wirkungsZiele } from "./berichte";
import { bereitschaftAendern } from "./fraktionen";
import { brecheZusage } from "./zusagen";
import { REGELN, stimmenSicht } from "./handeln";
import { addLog } from "./log";
import { wirke, vertrauenAendern } from "./wirkung";
import { t } from "../i18n";
import type { World } from "./types";

export const GEGENKRAFT = {
  /** Kapital über dieser Schwelle verfällt */
  kapitalSchwelle: 100,
  /** Anteil des Überschusses, der jeden Monat verfällt (bei Einkommen von etwa 12 im Monat liegt das Gleichgewicht dann bei etwa 140, unter dem Deckel von 150) */
  kapitalVerfall: 0.3,
  /** Brachliegender Rückhalt kostet Legitimität: höchstens so viele Indexpunkte je Monat, ab Schwelle bis Deckel wachsend */
  hortLegitimitaet: 0.15,
  /** Eine Zusage gilt als überfällig, wenn ihre Frist so viele Tage zurückliegt (nach Abzug der Warteschlange des Takts) */
  zusageUeberfaellig: 100,
  /** Nach so vielen Tagen Überfälligkeit verfällt eine Zusage als Bruch */
  zusageVerfall: 365,
  /** Altlast an Kapital je Monat: je überfälliger Zusage … */
  altlastJeZusage: 0.25,
  /** … und je Einheit Problemlast (Anteil der Bevölkerung in Provinzen mit akutem Problem, wie in der Zustimmung) */
  altlastJeProblem: 0.4,
  /** Höchste Altlast je Monat */
  altlastMax: 2,
  /** Das Lager gilt als dauerhaft schwach, wenn die Mehrheit so viele Monate in Folge fehlt und die Zustimmung unter der Schwelle liegt */
  schwachMonate: 6,
  schwachZustimmung: 45,
} as const;

const gk = (w: World) => (w.spiel!.gegenkraft ??= {});

/** Bevölkerungsanteil in Provinzen mit akutem Problem, summiert über alle Probleme (wie in der Zustimmung, sim/spiel.ts). */
function problemLast(w: World): number {
  let summe = 0;
  for (const node of NET.nodes) {
    if (node.kind !== "problem" || !node.threshold) continue;
    const i = NET.index.get(node.id)!;
    let anteil = 0;
    for (let p = 0; p < PROVINCES; p++) if (w.net.values[i * PROVINCES + p]! >= node.threshold) anteil += w.net.weights[p]!;
    summe += anteil;
  }
  return summe;
}

/** Zusagen, deren Frist so lange zurückliegt, dass die Warteschlange des Takts sie nicht mehr erklärt. */
export function ueberfaelligeZusagen(w: World): number {
  return (w.spiel?.zusagen ?? []).filter((z) => !z.erfuellt && !z.gebrochen && w.day - z.faellig > GEGENKRAFT.zusageUeberfaellig).length;
}

/** Kapital, das jeden Monat an Altlasten verloren geht (für Einkommen und Anzeige). */
export function altlast(w: World): number {
  const roh = GEGENKRAFT.altlastJeZusage * ueberfaelligeZusagen(w) + GEGENKRAFT.altlastJeProblem * problemLast(w);
  return Math.min(GEGENKRAFT.altlastMax, roh);
}

/** Verfall des Kapitals über der Schwelle (Wert dieses Monats, vor dem Abbuchen). */
export function kapitalVerfall(kapital: number): number {
  return kapital > GEGENKRAFT.kapitalSchwelle ? (kapital - GEGENKRAFT.kapitalSchwelle) * GEGENKRAFT.kapitalVerfall : 0;
}

/**
 * Monatlich nach der Gutschrift (sim/spiel.ts, spielMonat): Kapital über der Schwelle verfällt, brachliegender Rückhalt nagt an der
 * Legitimität, überfällige Zusagen haben Folgen, das Lager wird auf Dauerschwäche geprüft, Rückblicke werden erfasst.
 */
export function taktMonat(w: World): void {
  const sp = w.spiel;
  if (!sp || sp.ende) return;

  // 1. Brachliegendes Kapital
  const verfall = kapitalVerfall(sp.kapital);
  if (verfall > 0) {
    sp.kapital -= verfall;
    const anteil = Math.min(1, (sp.kapital + verfall - GEGENKRAFT.kapitalSchwelle) / (REGELN.kapitalMax - GEGENKRAFT.kapitalSchwelle));
    wirke(w, "legitimitaet", -GEGENKRAFT.hortLegitimitaet * anteil);
    const g = gk(w);
    if (verfall >= 5 && w.day - (g.hortHinweis ?? -1e9) > 180) {
      g.hortHinweis = w.day;
      addLog(w, "ereignis", t("takt.gegenkraft.hort.titel"), t("takt.gegenkraft.hort.text"));
    }
  }

  // 2. Überfällige Zusagen: Folgen jeden Monat, nach einem Jahr Überfälligkeit der Bruch
  for (const z of sp.zusagen) {
    if (z.erfuellt || z.gebrochen) continue;
    const ueber = w.day - z.faellig;
    if (ueber > GEGENKRAFT.zusageVerfall) {
      brecheZusage(w, z, true);
      continue;
    }
    if (ueber > GEGENKRAFT.zusageUeberfaellig) {
      bereitschaftAendern(w, z.von, -2);
      vertrauenAendern(w, -0.1);
    }
  }

  // 3. Dauerhaft schwaches Lager (Zähler für die Neuwahlforderung)
  const g = gk(w);
  const schwach = stimmenSicht(w).lager < REGELN.mehrheit && sp.umfrage.zustimmung < GEGENKRAFT.schwachZustimmung;
  g.schwachMonate = schwach ? (g.schwachMonate ?? 0) + 1 : 0;

  rueckblickeErfassen(w);
}

/** Die Neuwahlforderung ist fällig, wenn das Lager lange schwach war und die letzte Forderung ein Jahr zurückliegt (Bedingung der Vorlage). */
export function neuwahlForderungFaellig(w: World): boolean {
  const g = w.spiel?.gegenkraft;
  return !!g && (g.schwachMonate ?? 0) >= GEGENKRAFT.schwachMonate && w.day - (g.neuwahlTag ?? -1e9) > 365;
}

// ---------------------------------------------------------------------------
// Rückblicke auf Programmschritte und Verträge

function rueckblickeErfassen(w: World): void {
  const sp = w.spiel!;
  const g = gk(w);
  const bekannt = new Set((sp.rueckblicke ?? []).map((r) => r.id));
  const stumm = !g.rueckblickBasis; // beim ersten Zählen nur markieren, was schon da ist (kein Bericht über alte Entscheidungen)

  for (const id of programmZustand(w).fertig) {
    if (bekannt.has(`programm:${id}`)) continue;
    if (stumm) {
      rueckblickMarkieren(w, "programm", id);
      continue;
    }
    const schritt = PROGRAMME.flatMap((p) => p.schritte).find((s) => s.id === id);
    if (!schritt) continue;
    const ids = new Set<string>();
    for (const b of schritt.bedingung) {
      if (b.art === "groesse" || b.art === "problem") ids.add(b.id);
      else if (b.art === "massnahme" || b.art === "massnahme-max") for (const z of wirkungsZiele(b.id, 2)) ids.add(z);
    }
    if (!rueckblickAnlegen(w, "programm", t("takt.bericht.programm", { titel: schritt.titel }), {}, undefined, [...ids], id)) rueckblickMarkieren(w, "programm", id);
  }

  for (const v of alleLaufenden(w)) {
    if (bekannt.has(`vertrag:${v.id}`)) continue;
    if (stumm) {
      rueckblickMarkieren(w, "vertrag", v.id);
      continue;
    }
    const l = land(v.land);
    if (!rueckblickAnlegen(w, "vertrag", t("takt.bericht.vertrag", { land: l.name }), {}, undefined, [l.knoten, "ansehen"], v.id)) rueckblickMarkieren(w, "vertrag", v.id);
  }
  g.rueckblickBasis = true;
}
