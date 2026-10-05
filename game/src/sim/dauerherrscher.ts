// Langzeitfolgen der Dauerherrschaft: Wer über die zweite Amtszeit hinaus regiert (dritte Amtszeit nach „Weitere Wiederwahl“ oder ohne Grenze), zahlt dafür.
// „Unbegrenzt“ ist keine kostenlose Option: Das Land ermüdet (die Regierungsmüdigkeit zählt über die Amtszeiten weiter, sim/amtszeit.ts), die Rivalen im
// Kabinett warten auf ihre Chance (Ehrgeiz, Groll, sinkende Loyalität), Legitimität und Zusammenhalt bröckeln, Straßburg, Brüssel und die Straße reagieren,
// und die Gesundheit des Präsidenten wird zum Thema (sim/enden.ts: Alter, Krankheit, Tod). Wertungsfrei: Die Folgen hängen an der Dauer, nicht an der Richtung.
// Alle Zahlen sind Spielparameter (Platzhalter der Kalibrierung), keine Tatsachenbehauptungen.

import { clamp } from "./economy";
import { addLog } from "./log";
import { wirke } from "./wirkung";
import { landAendern } from "./laender";
import { AEMTER, eigenVon, loyalitaetVerschieben } from "./personen";
import { t } from "../i18n";
import type { World } from "./types";

export const DAUER = {
  /** Ab dieser Amtszeit zählt die Herrschaft als „lang“ (dritte Amtszeit) */
  ab: 3,
  /** Höchstzahl der Stufen, mit denen die Monatswirkung wächst (je Amtszeit über der zweiten eine Stufe) */
  maxStufen: 4,
  /**
   * Zusätzliche Müdigkeitsmonate je Stufe (sim/amtszeit.ts, muedigkeitsMonate): Die mitgetragene Müdigkeit früherer Amtszeiten ist nach oben begrenzt
   * (AMTSZEIT.uebertragMax), die lange Herrschaft kostet darüber hinaus je Stufe acht Monate Verschleiß (bei 0,3 Punkten je Monat 2,4 Punkte
   * Zustimmung, höchstens 9,6 bei vier Stufen). Kalibriert mit dem klaren Bot über zehn Seeds und unbegrenzte Amtszeiten: bei 6 Monaten gewinnt er Wahl 3
   * neunmal von neun, Wahl 4 siebenmal von neun, Wahl 5 dreimal von fünf; bei 9 Monaten Wahl 3 achtmal von neun, Wahl 4 viermal von acht, Wahl 5 keinmal
   * von vier. Der Wert dazwischen soll Wahl 3 meist, Wahl 4 etwa zur Hälfte und Wahl 5 und später selten gelingen lassen. Spielparameter.
   */
  muedigkeitMonate: 8,
  /** Monatliche Verschiebung je Stufe im Kabinett: Ehrgeiz, Groll (bei Ehrgeiz ab 60), Loyalität (bei Ehrgeiz ab 60) */
  ehrgeiz: 0.25,
  groll: 0.12,
  loyalitaet: -0.08,
  /** Monatliche Stöße je Stufe auf das Land: Legitimität, Polarisierung, Streikneigung, Druck aus Straßburg, Ansehen */
  legitimitaet: -0.3,
  polarisierung: 0.35,
  streik: 0.2,
  strassburg: 0.3,
  ansehen: -0.15,
  /** Monatlicher Vertrauensverlust der EU je Stufe (die Beitrittsgespräche leiden, die Kopenhagener Kriterien werden zum Dauerthema) */
  eu: -0.4,
} as const;

/** Die Stufe der Dauerherrschaft (0 = keine): eine Stufe je Amtszeit über der zweiten, begrenzt. */
export function dauerStufe(w: World): number {
  const nr = w.spiel?.amtszeit ?? 1;
  return clamp(nr - (DAUER.ab - 1), 0, DAUER.maxStufen);
}

/** Monatlich aus der Spielschleife: die Kosten der langen Herrschaft, wachsend mit den Amtszeiten. */
export function dauerherrscherMonat(w: World): void {
  const sp = w.spiel;
  if (!sp || sp.ende) return;
  const n = dauerStufe(w);
  if (n <= 0) return;
  for (const f of sp.figuren) {
    if (!f.imAmt || !AEMTER[f.amt].regierungsamt || f.amt === "partner") continue;
    const e = eigenVon(w, f);
    if (e.kommissarisch) continue;
    e.ehrgeiz = clamp(e.ehrgeiz + DAUER.ehrgeiz * n, 0, 100);
    if (e.ehrgeiz >= 60) {
      e.groll = clamp(e.groll + DAUER.groll * n, 0, 100);
      loyalitaetVerschieben(f, DAUER.loyalitaet * n);
    }
  }
  wirke(w, "legitimitaet", DAUER.legitimitaet * n);
  wirke(w, "polarisierung", DAUER.polarisierung * n);
  wirke(w, "streikneigung", DAUER.streik * n);
  wirke(w, "strassburg_druck", DAUER.strassburg * n);
  wirke(w, "ansehen", DAUER.ansehen * n);
  landAendern(w, "EU", { vertrauen: DAUER.eu * n }, t("dauer.eu_notiz"));
}

/** Beginn einer weiteren Amtszeit ohne Grenze: Chronik, Hinweis und ein Schub für die Rivalen (sie sehen, dass der Präsident bleibt). */
export function dauerherrscherBeginn(w: World, nr: number): void {
  const sp = w.spiel;
  if (!sp) return;
  for (const f of sp.figuren) {
    if (!f.imAmt || !AEMTER[f.amt].regierungsamt || f.amt === "partner") continue;
    const e = eigenVon(w, f);
    if (e.ehrgeiz >= 60) {
      e.groll = clamp(e.groll + 2, 0, 100);
      loyalitaetVerschieben(f, -1);
    }
  }
  sp.hinweise.push({ id: `dauer-${w.day}`, titel: t("dauer.hinweis.titel", { nr }), szene: "istanbul", text: [t("dauer.hinweis.text1", { nr }), t("dauer.hinweis.text2")] });
  addLog(w, "ereignis", t("dauer.log", { nr }), t("dauer.log_warum"));
}
