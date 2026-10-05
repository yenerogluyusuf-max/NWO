// Märkte und Konjunkturkopplung (Runde „Das Netz atmet“, 05.10.2026; Konzept SPIEL_DURCHDACHT_2026-10-05.md, Welle 3).
//
// Bis hierher reagierten die Märkte nur auf Zahlen der Wirtschaft (Inflation, Schulden, Zins). Wahl, Festnahmen, Notstand und Eingriffe in
// Justiz und Presse änderten Kurs, Risikoaufschlag und Reserven nicht. Dieses Modul schließt die Lücke:
//
//   marktSchock(w, art, stärke)   ein politisches Ereignis erschreckt (stärke > 0) oder beruhigt (stärke < 0) die Märkte: sofortiger Sprung von
//                                 Risikoaufschlag und Kurs, Abfluss aus den Reserven, ein dauerhafter Aufschlag, der monatlich abklingt
//   koppleNetzAnWirtschaft(w)     monatlich: Lage der Institutionen → Risikoaufschlag, Sektorenindex → Auslastung/Leistungsbilanz/Arbeitsmarkt,
//                                 Importabhängigkeit → Ölwirkung, Konjunktur → Haushalt (Stabilisatoren, Steuerbasis), Schwellenüberschreitungen
//                                 von Notstand, Justiz und Presse als Schock, Rating als Bestand
//   ratingSicht(w)                das Rating mit Ausblick für die Oberfläche
//
// Alle Zahlen sind Spielparameter (Platzhalter der Kalibrierung), keine Messwerte. Die Zuschläge wirken nur mit Politiknetz: Ohne die
// optionalen Felder des EconomyState (types.ts) bleiben die Wirtschaftsregeln unverändert (Lernfall-Replays).

import type { EconomyState, World } from "./types";
import { NET } from "./modell";
import { nationalAverage, startAverage } from "./netz";
import { PARAMS, clamp } from "./economy";
import { aktualisiereReservenDruck } from "./devisen";
import { wirke } from "./wirkung";
import { addLog } from "./log";
import { t } from "../i18n";

export const MARKT = {
  /** Anteil des dauerhaften Aufschlags (politikRisiko), der pro Monat abklingt */
  abklang: 0.12,
  /** Obergrenze des dauerhaften Aufschlags aus politischen Schocks, Basispunkte */
  politikRisikoMax: 450,
  /** Anteil des sofortigen Sprungs im Risikoaufschlag, der als dauerhafter Aufschlag stehen bleibt */
  dauerAnteil: 0.5,
  /** Beruhigung wirkt nur halb so stark wie ein Schreck (Vertrauen geht schnell verloren und kehrt langsam zurück) */
  beruhigung: 0.5,
  /** Tage Pause je Art: Davor wirkt dieselbe Art nur zu 30 %, danach wieder voll */
  pause: 20,
  /** Basispunkte Risikoaufschlag je Indexpunkt, den die Lage der Institutionen unter dem Start liegt (darüber nur 40 %) */
  institutionenBp: 3,
  /** Indexpunkte, die der Abstand der Institutionen zum Start höchstens zählt */
  institutionenMax: 80,
  /** Wie stark die Importabhängigkeit (Netz) die Wirkung des Ölpreises verändert, je Indexpunkt Abweichung */
  energieAufFaktor: 0.012,
  /** Schwelle in Punkten und Bewertung der drei Stufen, ab denen eine Verschlechterung der Institutionen als Schock gelesen wird */
  stufen: [10, 20, 32],
} as const;

export type MarktArt = "wahl" | "verhaftung" | "notstand" | "justiz" | "verfassung" | "presse" | "reform";

/** Je Art: Sprung des Risikoaufschlags (Basispunkte), Abwertung (Anteil) und Reservenabfluss (Mrd. USD) bei Stärke 1. */
const ARTEN: Record<MarktArt, { cds: number; fx: number; reserven: number }> = {
  wahl: { cds: 30, fx: 0.01, reserven: 1.5 },
  verhaftung: { cds: 55, fx: 0.025, reserven: 4 },
  notstand: { cds: 70, fx: 0.03, reserven: 5 },
  justiz: { cds: 40, fx: 0.015, reserven: 2 },
  verfassung: { cds: 40, fx: 0.015, reserven: 2 },
  presse: { cds: 25, fx: 0.008, reserven: 1 },
  reform: { cds: 30, fx: 0.01, reserven: 1.5 },
};

export interface MarktReaktion {
  /** Sprung des Risikoaufschlags in Basispunkten (+ schlechter, − besser) */
  cds: number;
  /** Veränderung des Kurses in Prozent (+ Abwertung, − Aufwertung) */
  kursProzent: number;
  /** Abfluss aus den Netto-Reserven in Mrd. USD (0 bei Beruhigung) */
  reserven: number;
}

/**
 * Ein politisches Ereignis wirkt auf die Märkte.
 * `staerke` > 0 erschreckt (Festnahmen, Notstand, Eingriffe), < 0 beruhigt (Reform, klares Ergebnis); 1 ist ein typischer Fall, 2,5 ein schwerer.
 * Je geringer die Glaubwürdigkeit der Zentralbank, desto heftiger die Reaktion. Schreibt eine Zeile ins Protokoll (Art „markt“).
 */
export function marktSchock(w: World, art: MarktArt, staerke = 1, text?: { titel: string; warum: string }): MarktReaktion {
  const e = w.economy;
  const a = ARTEN[art];
  const glaubwuerdig = 0.7 + 0.6 * (1 - clamp(e.credibility, 0, 1));
  const tage = (e.marktSchockTag ??= {});
  const letzter = tage[art];
  const dampf = letzter !== undefined && w.day - letzter < MARKT.pause ? 0.3 : 1;
  tage[art] = w.day;
  const s = staerke * glaubwuerdig * dampf;
  const schreck = s > 0;
  const f = schreck ? s : s * MARKT.beruhigung;
  const cds = a.cds * f;
  const fx = a.fx * f;
  const reserven = schreck ? a.reserven * s : 0;

  e.riskPremium = clamp(e.riskPremium + cds, 50, 2000);
  e.politikRisiko = clamp((e.politikRisiko ?? 0) + cds * MARKT.dauerAnteil, -100, MARKT.politikRisikoMax);
  e.usdTry *= 1 + fx;
  e.eurTry *= 1 + fx;
  if (reserven > 0 && e.reservenNettoUsdMrd !== undefined) {
    e.reservenNettoUsdMrd -= reserven;
    if (e.reservenBruttoUsdMrd !== undefined) e.reservenBruttoUsdMrd = Math.max(0, e.reservenBruttoUsdMrd - reserven);
    aktualisiereReservenDruck(e);
  }
  wirke(w, "vertrauen_maerkte", -3 * f);
  const titel = text?.titel ?? t(`markt.schock.${art}.${schreck ? "hoch" : "tief"}.titel`);
  const warum = text?.warum ?? t(`markt.schock.${art}.${schreck ? "hoch" : "tief"}.text`, { cds: Math.round(Math.abs(cds)) });
  addLog(w, "markt", titel, warum);
  return { cds, kursProzent: fx * 100, reserven };
}

// ---------------------------------------------------------------------------
// Rating als Bestand

/** Die Bonitätsskala des Spiels (zusammengefasst aus Moody's, Fitch, S&P). Startstufe BB− (Ba3, BB−, BB−: RECHERCHE_REALWELT_TUERKEI_2026.md, Abschnitt 2.11). */
export const RATING_STUFEN = ["CCC+", "B−", "B", "B+", "BB−", "BB", "BB+", "BBB−", "BBB"] as const;
const START_STUFE = 4;
/** Ab dieser Stufe gilt das Land als „Investment Grade“ (BBB−) */
const ANLAGEGRAD = 7;
/** Punkte der Bonität je Stufe und Monate, die der Abstand anhalten muss, bis die Agenturen handeln */
const RATING = { punkteJeStufe: 10, monate: 6, aufschlagJeStufe: 35 } as const;

/** Der Bonitätsscore (höher = besser) aus Schulden, Risikoaufschlag, Glaubwürdigkeit, Inflation, Institutionen und Reserven. Nur Abstände zum Start zählen. */
export function bonitaetsScore(w: World): number {
  const e = w.economy;
  const dev = (id: string) => nationalAverage(NET, w.net, id);
  let s = 0;
  s -= 0.3 * Math.max(0, e.debtRatio - 30);
  s -= 0.02 * (e.riskPremium - (e.politikRisiko ?? 0) - (e.institutionenRisiko ?? 0) - 250);
  s += 14 * (clamp(e.credibility, 0, 1) - 0.5);
  s -= 0.4 * Math.max(0, e.inflation - 10);
  s += 0.1 * ((dev("justiz_unabhaengigkeit") + dev("rechtssicherheit") + dev("vertrauen_maerkte")) / 3 - 50);
  if (e.reservenNettoUsdMrd !== undefined) s -= 0.1 * Math.max(0, 25 - e.reservenNettoUsdMrd);
  return s;
}

function ratingZustand(w: World): NonNullable<EconomyState["rating"]> {
  const e = w.economy;
  e.rating ??= { stufe: START_STUFE, ausblick: 0, seit: w.day, bezug: bonitaetsScore(w), zaehler: 0, tendenz: 0 };
  return e.rating;
}

export function ratingSicht(w: World): { stufe: string; index: number; ausblick: -1 | 0 | 1; seit: number; anlagegrad: boolean } {
  const r = ratingZustand(w);
  return { stufe: RATING_STUFEN[r.stufe]!, index: r.stufe, ausblick: r.ausblick, seit: r.seit, anlagegrad: r.stufe >= ANLAGEGRAD };
}

/** Eine Stufe rauf (+1) oder runter (−1): Aufschlag, Vertrauen, bei Anlagegrad einmaliger Kapitalzufluss. */
export function ratingAendere(w: World, richtung: 1 | -1): void {
  const e = w.economy;
  const r = ratingZustand(w);
  const neu = clamp(r.stufe + richtung, 0, RATING_STUFEN.length - 1);
  if (neu === r.stufe) return;
  const altIndex = r.stufe;
  const von = RATING_STUFEN[altIndex]!;
  r.stufe = neu;
  r.seit = w.day;
  r.zaehler = 0;
  r.tendenz = 0;
  r.ausblick = 0;
  // Der neue Maßstab: Der Abstand, der zur Stufenänderung führte, zählt jetzt als erledigt
  r.bezug += richtung * RATING.punkteJeStufe;
  e.politikRisiko = clamp((e.politikRisiko ?? 0) - richtung * RATING.aufschlagJeStufe, -100, MARKT.politikRisikoMax);
  e.riskPremium = clamp(e.riskPremium - richtung * RATING.aufschlagJeStufe, 50, 2000);
  wirke(w, "vertrauen_maerkte", 2 * richtung);
  if (richtung > 0 && neu === ANLAGEGRAD) wirke(w, "auslandskapital", 4);
  if (richtung < 0 && altIndex === ANLAGEGRAD) wirke(w, "auslandskapital", -3);
  const nach = RATING_STUFEN[neu]!;
  addLog(
    w,
    "markt",
    t(richtung > 0 ? "markt.rating.herauf.titel" : "markt.rating.herab.titel", { von, nach }),
    t(richtung > 0 ? "markt.rating.herauf.text" : "markt.rating.herab.text", { von, nach, anlagegrad: neu >= ANLAGEGRAD ? "ja" : "nein" }),
  );
}

/**
 * Die Agenturen werden milder (negative Punkte) oder strenger (positive): verschiebt den Maßstab, an dem der Abstand gemessen wird.
 * Eine Stufe entspricht zehn Punkten; die Stufenänderung folgt erst nach den üblichen Monaten (Ratingereignisse nutzen das).
 */
export function ratingDruck(w: World, punkte: number): void {
  ratingZustand(w).bezug += punkte;
}

/** Ein Monat Rating: Abstand zum Bezug, Ausblick, nach genügend Monaten die Stufenänderung. */
function ratingMonat(w: World): void {
  const r = ratingZustand(w);
  const abstand = (bonitaetsScore(w) - r.bezug) / RATING.punkteJeStufe;
  const will = abstand >= 1 ? 1 : abstand <= -1 ? -1 : 0;
  const ausblickVorher = r.ausblick;
  r.ausblick = abstand >= 0.5 ? 1 : abstand <= -0.5 ? -1 : 0;
  if (r.ausblick !== ausblickVorher && r.ausblick !== 0) {
    addLog(w, "markt", t(r.ausblick > 0 ? "markt.rating.ausblick_positiv.titel" : "markt.rating.ausblick_negativ.titel", { stufe: RATING_STUFEN[r.stufe]! }), t("markt.rating.ausblick.text"));
  }
  if (will !== 0 && will === r.tendenz) r.zaehler += 1;
  else {
    r.tendenz = will;
    r.zaehler = will === 0 ? 0 : 1;
  }
  if (will !== 0 && r.zaehler >= RATING.monate) ratingAendere(w, will as 1 | -1);
}

// ---------------------------------------------------------------------------
// Monatliche Kopplung des Politiknetzes an die Wirtschaft

const SEKTOREN = ["industrie", "export", "mittelstand", "investitionen", "bauwirtschaft", "tourismus"] as const;

/** Die Institutionenknoten, deren Verschlechterung als Marktschock gelesen wird: Knoten, Art, Richtung (+1 = Anstieg ist schlecht), Stärke je Stufe. */
const WACHPOSTEN: { id: string; art: MarktArt; schlechtBeiAnstieg: boolean; staerke: number }[] = [
  { id: "ausnahmerecht", art: "notstand", schlechtBeiAnstieg: true, staerke: 1 },
  { id: "justiz_unabhaengigkeit", art: "justiz", schlechtBeiAnstieg: false, staerke: 0.9 },
  { id: "pressefreiheit", art: "presse", schlechtBeiAnstieg: false, staerke: 0.9 },
  { id: "rechtssicherheit", art: "justiz", schlechtBeiAnstieg: false, staerke: 0.7 },
];

/** Stufe der Verschlechterung (0 bis 3) eines Wachpostens; ein Zurückweichen um 5 Punkte hebt die Stufe wieder auf (kein Flackern an der Schwelle). */
function stufeVon(abstand: number, bisher: number): number {
  let st = bisher;
  while (st < MARKT.stufen.length && abstand >= MARKT.stufen[st]!) st += 1;
  while (st > 0 && abstand < MARKT.stufen[st - 1]! - 5) st -= 1;
  return st;
}

export function koppleNetzAnWirtschaft(w: World): void {
  const e = w.economy;
  const abw = (id: string): number => nationalAverage(NET, w.net, id) - startAverage(NET, w.net, id);

  // 1. Institutionen im Risikoaufschlag (Justiz, Rechtssicherheit, Presse, Vertrauen der Märkte)
  const inst = clamp((abw("justiz_unabhaengigkeit") + abw("rechtssicherheit") + abw("pressefreiheit") + abw("vertrauen_maerkte")) / 4, -MARKT.institutionenMax, MARKT.institutionenMax);
  e.institutionenRisiko = clamp(inst < 0 ? -MARKT.institutionenBp * inst : -0.4 * MARKT.institutionenBp * inst, -50, 250);

  // 2. Realwirtschaft der Branchen: wirkt auf Auslastung (economy.ts), Leistungsbilanz (devisen.ts) und die natürliche Arbeitslosigkeit
  e.sektorIndex = clamp(SEKTOREN.reduce((s, id) => s + abw(id), 0) / SEKTOREN.length, -30, 30);
  e.arbeitsmarktShift = clamp(0.02 * abw("jugendarbeitslosigkeit") - 0.015 * abw("mittelstand"), -1.5, 2.5);

  // 3. Importabhängigkeit bestimmt, wie hart der Ölpreis trifft
  e.energieFaktor = clamp(1 + MARKT.energieAufFaktor * (abw("energieimporte") + 0.5 * abw("gasabhaengigkeit")), 0.6, 1.6);

  // 4. Der Haushalt atmet mit der Konjunktur: Überauslastung und stärkere Steuerbasis entlasten, Rezession und schwache Basis belasten
  e.konjunkturSaldo = clamp(PARAMS.stabilisatoren * e.outputGap + PARAMS.steuerbasisAufHaushalt * abw("steuereinnahmen"), -3, 3);

  // 5. Dauerhafter Aufschlag aus politischen Schocks klingt ab
  if (e.politikRisiko !== undefined) {
    e.politikRisiko *= 1 - MARKT.abklang;
    if (Math.abs(e.politikRisiko) < 0.5) e.politikRisiko = 0;
  }

  // 6. Wachposten: Wer Notstand, Justiz oder Presse spürbar beschneidet, erschreckt die Märkte (Schwellen statt täglicher Zufall)
  if (w.spiel) {
    const stand = (e.institutionenVormonat ??= {});
    let groessterSchreck: { art: MarktArt; staerke: number } | null = null;
    for (const p of WACHPOSTEN) {
      const x = abw(p.id);
      const abstand = p.schlechtBeiAnstieg ? x : -x;
      const bisher = stand[p.id] ?? 0;
      const jetzt = stufeVon(abstand, bisher);
      stand[p.id] = jetzt;
      if (jetzt > bisher) {
        const s = p.staerke * (jetzt - bisher) * (0.8 + 0.4 * jetzt);
        if (!groessterSchreck || s > groessterSchreck.staerke) groessterSchreck = { art: p.art, staerke: s };
      }
    }
    if (groessterSchreck) marktSchock(w, groessterSchreck.art, clamp(groessterSchreck.staerke, 0.3, 3));
  }

  // 7. Rating als Bestand mit Ausblick
  ratingMonat(w);
}
