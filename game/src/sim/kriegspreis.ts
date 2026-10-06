// Der innere und äußere Preis eines Krieges, Woche für Woche: Die Sammlung um die Flagge verfliegt, Gefallene kommen heim und die Opposition
// zählt mit, Verbündete und Märkte reagieren. Ein kurzer Sieg bleibt möglich, aber er kostet; ein Angriff auf ein Mitglied der EU oder der NATO
// trifft Handel, Tourismus und Lira hart.
//
// Schnittstelle: sim/krieg.ts ruft `kriegspreisWoche` in jeder Kriegswoche auf. Dieses Modul importiert krieg.ts nicht (kein Ladezyklus).
// Alle Zahlen sind Spielparameter. Größenordnungen: Die Gefallenenzahl je Woche ist an den Bodeneinsätzen in Nordsyrien 2016 bis 2019
// ausgerichtet (Dutzende, nicht Tausende je Monat); eine belegte Einzelzahl liegt im Projekt nicht vor.

import type { KriegVorgang } from "./krieg-typen";
import { wirke } from "./wirkung";
import { addLog } from "./log";
import { kosten } from "./ereignis-hilfen";
import { land, landAendern, weltZustand } from "./laender";
import { verhaengeSanktion } from "./diplomatie";
import { t } from "../i18n";
import type { World } from "./types";

/** Wie Dritte auf einen türkischen Angriff reagieren (je Kriegswoche) und was er die Wirtschaft kostet. */
interface Reaktion {
  /** Konflikt-Dimension der EU bzw. der USA mit der Türkei je Woche */
  eu: number;
  usa: number;
  /** Ab dieser Kriegswoche verhängt die EU bzw. die USA Sanktionen sofort (Angriff auf ein Mitglied); fehlt: nur über die Monatsregel */
  euSanktionAb?: number;
  usaSanktionAb?: number;
  /** Tourismus landesweit und an der Küste (Plaka) je Woche */
  tourismus: number;
  kueste?: { provinzen: number[]; wert: number };
  /** Risikoaufschlag je Woche (Basispunkte), Auslandskapital je Woche */
  risiko: number;
  kapital: number;
  /** Grenzschutz und Flüchtlingsaufnahme je Woche in % des BIP */
  grenze: number;
}

/** Ägäisküste: İzmir, Muğla, Aydın, Antalya, Çanakkale, Balıkesir. */
const AEGAEIS = [35, 48, 9, 7, 17, 10];

const STANDARD: Reaktion = { eu: 0.4, usa: 0.3, tourismus: -0.03, risiko: 4, kapital: -0.03, grenze: 0 };

/** Spielparameter je Gegner. */
export const REAKTION: Record<string, Reaktion> = {
  SYR: { eu: 0.6, usa: 0.5, tourismus: -0.03, risiko: 4, kapital: -0.03, grenze: 0.004 },
  IRQ: { eu: 0.4, usa: 0.4, tourismus: -0.02, risiko: 4, kapital: -0.03, grenze: 0.002 },
  ARM: { eu: 1.5, usa: 1.8, tourismus: -0.04, risiko: 6, kapital: -0.05, grenze: 0 },
  IRN: { eu: 0.3, usa: -0.3, tourismus: -0.08, risiko: 12, kapital: -0.08, grenze: 0.003 },
  GRC: { eu: 6, usa: 4.5, euSanktionAb: 3, usaSanktionAb: 6, tourismus: -0.25, kueste: { provinzen: AEGAEIS, wert: -0.9 }, risiko: 28, kapital: -0.35, grenze: 0 },
  CYP: { eu: 5, usa: 2.5, euSanktionAb: 4, tourismus: -0.15, kueste: { provinzen: [7, 33, 1, 31], wert: -0.5 }, risiko: 18, kapital: -0.25, grenze: 0 },
};

export const PREIS = {
  /** Kriegsmüdigkeit: Zustimmung je Woche, wächst mit der Dauer bis zum Deckel; bei Selbstverteidigung schwächer */
  muedeJeWoche: 0.035,
  muedeDeckel: 0.4,
  muedeVerteidigung: 0.5,
  /** Gefallene je Prozentpunkt Wochenverlust der tragenden Gattungen, skaliert mit der Stärke des Gegners (Bezug 30) */
  gefalleneJeProzent: 22,
  /** Zustimmung je Gefallenem der Woche (Medien und Trauerfeiern) */
  zustimmungJeGefallenem: 0.008,
  /** Dauerhafter Teil: Vertrauen in die Regierung je Punkt Müdigkeit und je Gefallenem, Wählergruppen je Gefallenem */
  vertrauenJeMuede: 3,
  vertrauenJeGefallenem: 0.015,
  gruppeJeGefallenem: 0.004,
  /** Bei Kriegsbeginn als Angreifer: so viele Wochen Reaktion auf einen Schlag, dazu Vertrauen und städtische Säkulare */
  beginnWochen: 4,
  beginnVertrauen: 1.2,
  /** Höchster Konflikt mit EU oder USA, den der Kriegspreis setzt (mit Abstand unter der Schwelle eines eigenen Konfliktvorgangs, 73) */
  westenDeckel: 62,
  /** Schwellen der Gefallenen, an denen die Opposition eine Debatte erzwingt */
  schwellen: [50, 250, 1000, 5000],
};

function reaktion(id: string): Reaktion {
  return REAKTION[id] ?? STANDARD;
}

/**
 * Konflikt mit der EU oder den USA erhöhen, aber nur bis deutlich unter die Schwelle, ab der ein eigener Konfliktvorgang entstünde
 * (sim/krieg.ts KRIEG.anlageAb 73): Der Westen antwortet mit Sanktionen und Druck, nicht mit Krieg.
 */
function westen(w: World, id: "EU" | "USA", d: number): void {
  if (!d) return;
  const jetzt = weltZustand(w)[id]?.konflikt ?? 45;
  const plus = d > 0 ? Math.min(d, Math.max(0, PREIS.westenDeckel - jetzt)) : d;
  if (plus) landAendern(w, id, { konflikt: plus });
}

/** Die Türkei ist Angreifer (nicht Selbstverteidigung nach einem Angriff). */
function angreifer(k: KriegVorgang): boolean {
  if (k.koalition) return k.koalition.aggressor === "tuerkei";
  return k.rahmung !== "verteidigung";
}

/** Ein Wochenschritt des Kriegspreises (nach Front und Verlusten der Woche). */
export function kriegspreisWoche(w: World, k: KriegVorgang, gegnerStaerke: number): void {
  const sp = w.spiel;
  if (!sp) return;
  const l = land(k.land);
  const angriff = angreifer(k);

  // 1. Die Sammlung um die Flagge verfliegt: Müdigkeit wächst mit jeder Woche
  const muede = Math.min(PREIS.muedeDeckel, PREIS.muedeJeWoche * k.woche) * (angriff ? 1 : PREIS.muedeVerteidigung);
  // 2. Gefallene: aus den Wochenverlusten der tragenden Gattungen (Prozent), je stärker der Gegner, desto blutiger
  const verlustProzent = k.letzteWoche?.eigen ?? 0;
  const neu = Math.round(verlustProzent * PREIS.gefalleneJeProzent * Math.max(0.5, gegnerStaerke / 30));
  const vorher = k.gefallene ?? 0;
  k.gefallene = vorher + neu;
  // Sofort in der Umfrage, dauerhaft über das Vertrauen in die Regierung und die Gruppen, die den Krieg tragen müssen
  sp.umfrage.zustimmung = Math.max(0, sp.umfrage.zustimmung - muede - neu * PREIS.zustimmungJeGefallenem);
  wirke(w, "vertrauen_regierung", -(muede * PREIS.vertrauenJeMuede + neu * PREIS.vertrauenJeGefallenem));
  if (neu > 0) {
    wirke(w, "junge", -neu * PREIS.gruppeJeGefallenem);
    wirke(w, "staedtische_saekulare", -neu * PREIS.gruppeJeGefallenem);
  }
  for (const s of PREIS.schwellen) {
    if (vorher < s && k.gefallene >= s) {
      sp.hinweise.push({ id: `krieg-gefallene-${k.id}-${s}`, titel: t("krieg.preis.gefallene_titel", { zahl: s }), szene: "parlament", text: [t("krieg.preis.gefallene_text", { zahl: k.gefallene, land: l.name })] });
      addLog(w, "ereignis", t("krieg.preis.gefallene_log", { zahl: k.gefallene, land: l.name }), t("krieg.preis.gefallene_warum"));
      wirke(w, "staedtische_saekulare", -0.6);
      wirke(w, "junge", -0.4);
      wirke(w, "vertrauen_regierung", -0.3);
    }
  }

  // 3. Dritte und Märkte (nur der Angreifer trägt den diplomatischen Preis voll)
  const r = reaktion(k.land);
  const f = angriff ? 1 : 0.25;
  westen(w, "EU", r.eu * f);
  westen(w, "USA", r.usa * f);
  if (angriff && r.euSanktionAb !== undefined && k.woche >= r.euSanktionAb && verhaengeSanktion(w, "eu_handel", "EU")) {
    addLog(w, "ereignis", t("krieg.preis.sanktion_eu", { land: l.name }), t("krieg.preis.sanktion_warum"));
  }
  if (angriff && r.usaSanktionAb !== undefined && k.woche >= r.usaSanktionAb && verhaengeSanktion(w, "caatsa", "USA")) {
    addLog(w, "ereignis", t("krieg.preis.sanktion_usa", { land: l.name }), t("krieg.preis.sanktion_warum"));
  }
  wirke(w, "tourismus", r.tourismus);
  if (r.kueste) wirke(w, "tourismus", r.kueste.wert, r.kueste.provinzen);
  wirke(w, "auslandskapital", r.kapital * (angriff ? 1 : 0.5));
  w.economy.riskPremium += r.risiko * (angriff ? 1 : 0.5);
  if (r.grenze) kosten(w, r.grenze);
  if (angriff) wirke(w, "ansehen", -0.15);
}

/**
 * Bei Kriegsbeginn als Angreifer: Buchungen werden storniert, Anleger ziehen ab, die Hauptstädte des Westens protestieren, und ein Teil
 * des Landes trägt den Einsatz nicht mit (die Sammlung um die Flagge in sim/krieg.ts gleicht das nur kurz aus).
 */
export function kriegspreisBeginn(w: World, k: KriegVorgang): void {
  if (!angreifer(k)) return;
  const r = reaktion(k.land);
  westen(w, "EU", r.eu * PREIS.beginnWochen);
  westen(w, "USA", Math.max(0, r.usa) * PREIS.beginnWochen);
  wirke(w, "tourismus", r.tourismus * PREIS.beginnWochen * 2);
  wirke(w, "auslandskapital", r.kapital * PREIS.beginnWochen);
  wirke(w, "vertrauen_regierung", -PREIS.beginnVertrauen);
  wirke(w, "staedtische_saekulare", -PREIS.beginnVertrauen);
}
