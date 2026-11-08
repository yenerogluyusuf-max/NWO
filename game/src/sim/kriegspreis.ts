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
import { t, zahl } from "../i18n";
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
  /**
   * Welle 3, K2: Die Müdigkeit folgt den Särgen, nicht dem Kalender. Ab so vielen Gefallenen je Woche wirkt sie voll, darunter anteilig, aber
   * mindestens zu `muedeMindest` (Spielparameter). Belegt ist die Richtung: Lange Operationen mit wenigen Gefallenen (Schutzschild Euphrat
   * sieben Monate, 71 Gefallene; Klauenschloss seit 2022) kosteten keine messbare Zustimmung; Kriegsbeginn 2019 brachte 0 bis +4 Punkte
   * (recherche_operationen.md A3). Der Deckel je Woche bleibt `muedeDeckel`.
   */
  muedeBezug: 10,
  muedeMindest: 0.25,
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

/**
 * Welle 3, K2 (krieg.md Schritt 5): die Sanktionsdrohung des Westens als eigener Moment an den Märkten. Belegt ist der Fall Friedensquelle
 * 2019 (recherche_operationen.md A3, eigene Rechnung aus EZB-Referenzkursen und BIST-100): Der Kriegsbeginn selbst bewegte die Lira kaum
 * (−1,3 % bis +1,1 % in allen Operationen 2016 bis 2022). Die Drohung und die Sanktion am fünften Tag kosteten die Lira 4,3 % (USD/TRY
 * 5,687 am 01.10. → 5,931 am 14.10.), die Börse 7,7 %; nach der Pause standen noch +1,3 bis +1,7 % (25.10. bzw. 18.10.), die Börse war in
 * rund zwei Wochen fast erholt. Die Lira zeigt das Spiel, einen Börsenindex führt das Wirtschaftsmodell nicht (Lücke im Modell, nicht in den
 * Daten); die Börse wirkt hier über das Vertrauen der Märkte.
 */
export const MARKT_DROHUNG = {
  /** Sprung des Kurses (USD/TRY) bei der Drohung: +4,3 % (belegt, siehe oben) */
  kurs: 0.043,
  /** Anteil des Sprungs, der nach der Erholung bleibt: 1,5 % von 4,3 %, Mitte der belegten 1,3 bis 1,7 % */
  bleibt: 0.35,
  /** Tage bis zur Erholung (2019: Sanktion am 14.10., Pause am 17.10., Kurs am 25.10. zurück; Börse in rund zwei Wochen) */
  erholungTage: 14,
  /** Wann der Westen droht: eigene Bodenoffensive (nicht Luftschläge und nicht Verbündete vor Ort; 2016, 2018 und 2022 gab es keinen
   * Kursabschlag) gegen ein Land, bei dem die USA mindestens so stark reagieren (REAKTION.usa) */
  usaAb: 0.5,
  /** Vertrauen der Märkte bei der Drohung (Spielparameter, an Stelle des Börsenabschlags) */
  vertrauen: -3,
};

/**
 * Die Sanktionsdrohung an den Märkten auslösen, einmal je Krieg: Kurs und Vertrauen der Märkte. Auch für Wendepunkte im Krieg nutzbar;
 * ein zweiter Aufruf im selben Krieg bucht nichts. Rückgabe: ob gebucht wurde.
 */
export function sanktionsDrohungMarkt(w: World, k: KriegVorgang): boolean {
  if (k.marktDrohung) return false;
  const e = w.economy;
  e.usdTry *= 1 + MARKT_DROHUNG.kurs;
  e.eurTry *= 1 + MARKT_DROHUNG.kurs;
  wirke(w, "vertrauen_maerkte", MARKT_DROHUNG.vertrauen);
  k.marktDrohung = { tag: w.day, sprung: MARKT_DROHUNG.kurs };
  addLog(w, "markt", t("welle_k2.markt.drohung", { land: land(k.land).name, prozent: zahlProzent(MARKT_DROHUNG.kurs) }), t("welle_k2.markt.drohung_warum"));
  return true;
}

/** Die Erholung nach der Drohung (nach der Pause oder nach `erholungTage`): Der Kurs gibt bis auf den bleibenden Anteil zurück. */
export function marktErholung(w: World, k: KriegVorgang): boolean {
  const d = k.marktDrohung;
  if (!d || d.erholt) return false;
  const faktor = (1 + d.sprung * MARKT_DROHUNG.bleibt) / (1 + d.sprung);
  w.economy.usdTry *= faktor;
  w.economy.eurTry *= faktor;
  wirke(w, "vertrauen_maerkte", -MARKT_DROHUNG.vertrauen * 0.8);
  d.erholt = true;
  addLog(w, "markt", t("welle_k2.markt.erholung", { prozent: zahlProzent(d.sprung * MARKT_DROHUNG.bleibt) }), t("welle_k2.markt.erholung_warum"));
  return true;
}

const zahlProzent = (anteil: number): string => zahl(anteil * 100, 1);

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
  return k.rahmung !== "verteidigung" || !!k.rahmungDuenn;
}

/** Ein Wochenschritt des Kriegspreises (nach Front und Verlusten der Woche). */
export function kriegspreisWoche(w: World, k: KriegVorgang, gegnerStaerke: number): void {
  const sp = w.spiel;
  if (!sp) return;
  const l = land(k.land);
  const angriff = angreifer(k);

  // 1. Die Sammlung um die Flagge verfliegt: Müdigkeit wächst mit jeder Woche
  const zuletzt = k.letzteWoche?.last !== undefined ? k.letzteWoche.last * Math.max(0.5, gegnerStaerke / 30) : PREIS.muedeBezug;
  const intensitaet = Math.min(1, Math.max(PREIS.muedeMindest, zuletzt / PREIS.muedeBezug));
  const muede = Math.min(PREIS.muedeDeckel, PREIS.muedeJeWoche * k.woche) * (angriff ? 1 : PREIS.muedeVerteidigung) * intensitaet;
  // 2. Gefallene: aus den Wochenverlusten der tragenden Gattungen (Prozent), je stärker der Gegner, desto blutiger
  // Im Landkrieg mit Zielraum aus der Gefechtslast der Woche (Fläche, Gelände, Grundverschleiß; sim/kriegsschauplatz.ts), sonst aus den
  // Prozentverlusten. Gerundet wird mit einem festen Versatz je Woche: Bruchteile gehen nicht verloren, und der Lauf bleibt deterministisch.
  const staerke = Math.max(0.5, gegnerStaerke / 30);
  const last = k.letzteWoche?.last;
  const roh = last !== undefined ? last * staerke : (k.letzteWoche?.eigen ?? 0) * PREIS.gefalleneJeProzent * staerke;
  const neu = last !== undefined ? Math.floor(roh + ((k.woche * 0.618034) % 1)) : Math.round(roh);
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
  // Sanktionsdrohung des Westens bei einer eigenen Bodenoffensive (Vorbild Friedensquelle 2019), danach die Erholung
  // Mit gewählter Operationsform (K3) kommt die Drohung als Wendepunkt (sim/ereignisse-wendepunkte.ts) und bucht den Kurs dort nach der Antwort
  if (angriff && !k.operation && (k.einsatz === undefined || k.einsatz === "boden") && r.usa >= MARKT_DROHUNG.usaAb) sanktionsDrohungMarkt(w, k);
  if (k.marktDrohung && !k.marktDrohung.erholt && w.day - k.marktDrohung.tag >= MARKT_DROHUNG.erholungTage) marktErholung(w, k);
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
