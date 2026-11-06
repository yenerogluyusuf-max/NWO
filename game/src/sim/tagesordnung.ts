// Die Tagesordnung des Parlaments (Plan Oberfläche, Anhang A „Parlament › Tagesordnung“; ENTSCHEIDUNGEN W 2): alles, worüber das
// Parlament abstimmt oder was beim Verfassungsgericht liegt, an einer Stelle und mit denselben Zahlen wie an der Quelle.
// Reine Lesefunktion: Gesetze rechnet gesetzPrognose, den Haushalt haushaltsGesetzSicht, Versorgungsvorlagen versorgungsStimmen,
// das Verfassungspaket paketStimmen; die Normenkontrolle kommt aus laufendeVerfahren. Keine eigene Regel.

import { addDays } from "./dates";
import { REGELN, gesetzPrognose, gesetzPhase, type GesetzPhase } from "./handeln";
import { haushaltsGesetzSicht, haushaltsTitel } from "./haushalt";
import { versorgungsStimmen } from "./versorgungsmehrheit";
import { paketStimmen, VERFASSUNG_REGELN } from "./verfassung";
import { laufendeVerfahren } from "./gesetzgebung";
import { t } from "../i18n";
import type { World } from "./types";

export type TagesordnungArt = "gesetz" | "haushalt" | "versorgung" | "verfassung" | "gericht";

export interface TagesordnungPunkt {
  id: string;
  art: TagesordnungArt;
  titel: string;
  /** Spieltag der Abstimmung (beim Gericht: des Spruchs) */
  tag: number;
  tageBis: number;
  datum: string;
  /** Erwartete Ja-Stimmen am Abstimmungstag (fehlt beim Gericht) */
  ja?: number;
  /** Spanne der Schätzung, wo die Quelle sie kennt (Verfassung) */
  tief?: number;
  hoch?: number;
  /** Nötige Unterstützer: Mehrheit der Anwesenden bei Gesetzen (GESETZ_SCHWELLE), 301 nach einer Rücksendung, beim Haushalt und bei
   *  Versorgungsvorlagen (sim/haushalt.ts und sim/versorgungsmehrheit.ts zählen noch 301), 360 beim Verfassungspaket */
  schwelle?: number;
  /** Beim Verfassungspaket: ab hier ohne Volksabstimmung (400) */
  direkt?: number;
  urteil?: "sicher" | "knapp" | "verloren";
  /** Für Gesetze: Kennung des Gesetzes und der Maßnahme (Sprung an die Maßnahmenzeile) */
  gesetzId?: string;
  massnahme?: string;
  /** Beim Gericht: Wahrscheinlichkeit, dass es aufhebt */
  p?: number;
  /** Bei Gesetzen: Ausschuss, Plenum, Kommission oder neue Beratung nach Rücksendung */
  phase?: GesetzPhase;
}

const urteilVon = (ja: number, schwelle: number): TagesordnungPunkt["urteil"] => (ja >= schwelle + 8 ? "sicher" : ja >= schwelle - 10 ? "knapp" : "verloren");

export function tagesordnung(w: World): TagesordnungPunkt[] {
  const sp = w.spiel;
  if (!sp) return [];
  const out: TagesordnungPunkt[] = [];
  const datum = (tag: number) => addDays(w.date, tag - w.day);
  for (const g of sp.gesetze) {
    const p = gesetzPrognose(w, g);
    out.push({ id: g.id, art: "gesetz", titel: g.name, tag: g.abstimmung, tageBis: Math.max(0, g.abstimmung - w.day), datum: p.datum, ja: p.ja, schwelle: p.schwelle, urteil: p.urteil, gesetzId: g.id, massnahme: g.massnahme, phase: gesetzPhase(w, g) });
  }
  const hg = sp.wirtschaft?.haushalt.gesetz;
  const hs = haushaltsGesetzSicht(w);
  if (hg && hs) out.push({ id: "haushaltsgesetz", art: "haushalt", titel: haushaltsTitel(hg), tag: hs.abstimmungTag, tageBis: hs.tageBis, datum: hs.datum, ja: hs.ja, schwelle: REGELN.mehrheit, urteil: hs.urteil });
  for (const v of Object.values(sp.gueter?.regierung?.vorlagen ?? {})) {
    if (!v || v.status !== "offen") continue;
    const ja = versorgungsStimmen(w, v, v.abstimmung).reduce((s, f) => s + f.ja, 0);
    out.push({ id: v.id, art: "versorgung", titel: t(`regierung.${v.programm}.titel`), tag: v.abstimmung, tageBis: Math.max(0, v.abstimmung - w.day), datum: datum(v.abstimmung), ja, schwelle: REGELN.mehrheit, urteil: urteilVon(ja, REGELN.mehrheit) });
  }
  const vf = sp.verfassungsvorgang?.laufend;
  if (vf && vf.phase === "parlament") {
    const st = paketStimmen(w, vf.paket, vf.absprachen);
    out.push({ id: vf.id, art: "verfassung", titel: t("tagesordnung.verfassung"), tag: vf.abstimmung, tageBis: Math.max(0, vf.abstimmung - w.day), datum: datum(vf.abstimmung), ja: st.erwartet, tief: st.tief, hoch: st.hoch, schwelle: VERFASSUNG_REGELN.mehrheit, direkt: VERFASSUNG_REGELN.direkt, urteil: urteilVon(st.erwartet, VERFASSUNG_REGELN.mehrheit) });
  }
  laufendeVerfahren(w).gericht.forEach((g, i) => {
    out.push({ id: `gericht-${i}-${g.titel}`, art: "gericht", titel: g.titel, tag: w.day + g.tage, tageBis: g.tage, datum: datum(w.day + g.tage), p: g.p });
  });
  return out.sort((a, b) => a.tag - b.tag || a.art.localeCompare(b.art));
}
