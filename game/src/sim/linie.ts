// Die Linie der eigenen Partei als Preis: Wie weit eine Maßnahme von den Achsen der Partei entfernt ist, wirkt auf Kapitalkosten,
// Stimmverhalten der Fraktionen, Loyalität der Partner und, über die Nähe, auf die Wählergruppen. Das Spiel wertet keine Richtung:
// Dieselben Formeln gelten für jede Lage; wer mit seiner Linie regiert, zahlt weniger, wer sie bricht, zahlt mehr (Kurswechsel ist
// möglich und teuer). Alle Konstanten sind Spielparameter (Platzhalter der Kalibrierung), keine Tatsachenbehauptungen.

import {
  ACHSEN_IDS,
  GRUPPEN_ACHSEN,
  KLASSISCHE_VOREINSTELLUNGEN,
  MASSNAHME_VEKTOR,
  NULL_ACHSEN,
  PARTEI_ACHSEN,
  VOREINSTELLUNG_NACH_KURZ,
  type Achsen,
  type Voreinstellung,
} from "../data/linien";
import { GRUPPEN, GRUPPEN_SUMME } from "./gruppen";
import { NET } from "./modell";
import { figurLoyalitaetAendern } from "./figuren";
import { clamp } from "./economy";
import { kannZahlen } from "./kapital";
import { addLog } from "./log";
import { t } from "../i18n";
import type { World } from "./types";

export const LINIE = {
  /** Größter Rabatt auf die Kapitalkosten bei voller Übereinstimmung der Maßnahme mit der Linie */
  rabatt: 0.12,
  /** Größter Aufschlag bei voller Gegenläufigkeit (Kurswechsel) */
  aufschlag: 0.45,
  /** Anteil der Sitze einer Lagerpartei, der bei voller Gegenläufigkeit nicht mitstimmt */
  abweichler: 0.5,
  /** Die eigene Partei hält mehr Disziplin: Ihre Abweichung zählt nur zu diesem Teil */
  eigeneDisziplin: 0.5,
  /** Anteil der Sitze einer Oppositionspartei, der bei voller Übereinstimmung mitstimmt */
  oppositionJa: 0.2,
  /** Punkte Loyalität eines Partners je voller Übereinstimmung bei einer Änderung von 20 Stufen */
  partnerLoyalitaet: 4,
  /** Punkte Zustimmung je voll zur Linie passender (oder sie brechender) Änderung von 20 Stufen: Die Stammwählerschaft honoriert Linientreue und straft den Bruch */
  stamm: 0.6,
  /**
   * Ausgleich des politischen Preises: Der Stammwähler-Bonus steigt mit der Unpopularität der Maßnahme (nach dem Politiknetz) und sinkt bei populären.
   * Faktor = 1 + preisAusgleich · Unpopularität, zwischen preisUnten und preisOben. Dieselbe Regel für jede Linie: Wer eine unbeliebte Maßnahme durchsetzt,
   * für die seine Basis steht, wird dafür von ihr getragen; wer sich mit Beliebtem schmückt, bekommt kaum Zusatz.
   */
  preisAusgleich: 1,
  preisUnten: 0.3,
  preisOben: 2.5,
  /** Einfluss einer Maßnahme auf die Zustimmung (Netzanalyse), bei dem die Unpopularität 1 beträgt */
  preisSkala: 0.002,
  /** Der Saldo der Stammwählerschaft bleibt in diesem Band (Punkte Zustimmung) */
  stammGrenze: 10,
  /** Größte Verschiebung der Nähe einer Wählergruppe zur Partei (Punkte der Gruppenstimmung) */
  gruppenNaehe: 5,
  /** Ein Vektor kürzer als dieser Wert wirkt anteilig schwächer (Maßnahmen mit schwachem Lagerbezug) */
  vektorSchwelle: 0.6,
} as const;

/** Der größte denkbare Abstand zweier Punkte im Raum der fünf Achsen (jede von −100 bis +100). */
export const MAX_ABSTAND = 200 * Math.sqrt(ACHSEN_IDS.length);

/** Abstand zweier Linien, 0 (gleich) bis 1 (entgegengesetzte Ecken). */
export function abstand(a: Achsen, b: Achsen): number {
  let s = 0;
  for (const k of ACHSEN_IDS) s += (a[k] - b[k]) ** 2;
  return Math.sqrt(s) / MAX_ABSTAND;
}

/** Politische Nähe aus dem Abstand: +2 (nah) bis −2 (fern); 0 liegt bei etwa einem Drittel des größten Abstands. */
export function naeheAusAbstand(a: number): number {
  return clamp(Math.round(2 - a * 6), -2, 2);
}

// ---------------------------------------------------------------------------
// Wessen Linie ist es

/** Achsen von Parteien, die nicht in den Tabellen stehen (die eigene, frei eingestellte Partei): merkt sich die letzte Anfrage. */
const frei = new Map<string, Achsen>();

export function merkeAchsen(kurz: string, achsen: Achsen): void {
  frei.set(kurz, achsen);
}

/** Achsen einer Partei nach Kürzel: Szene, Voreinstellung oder zuletzt gemerkte freie Partei. */
export function parteiAchsen(kurz: string): Achsen | undefined {
  return PARTEI_ACHSEN[kurz] ?? VOREINSTELLUNG_NACH_KURZ[kurz]?.achsen ?? frei.get(kurz);
}

/** Linie der eigenen Partei: gespeicherte Achsen, sonst nach Kürzel (ältere Spielstände), sonst die Mitte. */
export function spielerAchsen(world: Pick<World, "player">): Achsen {
  const p = world.player;
  if (!p) return NULL_ACHSEN;
  if (p.achsen) {
    merkeAchsen(p.partei.kurz, p.achsen);
    return p.achsen;
  }
  return parteiAchsen(p.partei.kurz) ?? NULL_ACHSEN;
}

// ---------------------------------------------------------------------------
// Maßnahmen gegen Linie

/**
 * Wie sehr eine Änderung der Maßnahme zur Linie passt: +1 voll, −1 voll dagegen. `richtung` +1 erhöht, −1 senkt.
 * Maßnahmen ohne Lagerbezug (Vektor 0) und mit schwachem Bezug zählen nicht oder nur anteilig.
 */
export function uebereinstimmung(achsen: Achsen, massnahme: string, richtung: number): number {
  const v = MASSNAHME_VEKTOR[massnahme];
  if (!v || richtung === 0) return 0;
  let dot = 0;
  let norm = 0;
  for (const k of ACHSEN_IDS) {
    dot += (achsen[k] / 100) * v[k] * Math.sign(richtung);
    norm += Math.abs(v[k]);
  }
  if (norm === 0) return 0;
  return clamp(dot / norm, -1, 1) * Math.min(1, norm / LINIE.vektorSchwelle);
}

/** Faktor auf die Kapitalkosten einer Änderung: unter 1 mit der Linie, über 1 gegen die Linie. */
export function linienFaktor(world: Pick<World, "player">, massnahme: string, delta: number): number {
  const a = uebereinstimmung(spielerAchsen(world), massnahme, Math.sign(delta));
  return a >= 0 ? 1 - LINIE.rabatt * a : 1 + LINIE.aufschlag * -a;
}

/** Anteil der Sitze einer Fraktion im Lager, der für das Gesetz stimmt (1 = alle). */
export function jaAnteilLager(world: Pick<World, "player">, partei: string, massnahme: string, richtung: number): number {
  const achsen = parteiAchsen(partei) ?? (partei === world.player?.partei.kurz ? spielerAchsen(world) : undefined);
  if (!achsen) return 1;
  const a = uebereinstimmung(achsen, massnahme, richtung);
  if (a >= 0) return 1;
  const eigene = partei === world.player?.partei.kurz;
  return clamp(1 - LINIE.abweichler * -a * (eigene ? LINIE.eigeneDisziplin : 1), 0.2, 1);
}

/** Anteil der Sitze einer Fraktion außerhalb des Lagers, der zusätzlich mitstimmt, weil das Gesetz zu ihr passt. */
export function jaAnteilOpposition(partei: string, massnahme: string, richtung: number): number {
  const achsen = parteiAchsen(partei);
  if (!achsen) return 0;
  return LINIE.oppositionJa * Math.max(0, uebereinstimmung(achsen, massnahme, richtung));
}

/** Eine Partei des Lagers misst eine beschlossene Änderung an ihrer Linie: Ihre Loyalität steigt oder sinkt. */
export function reagierePartner(world: World, massnahme: string, richtung: number, umfang: number): void {
  const spiel = world.spiel;
  if (!spiel || richtung === 0 || umfang <= 0) return;
  const stufe = Math.min(1.5, umfang / 20);
  for (const f of spiel.figuren) {
    if (f.amt !== "partner" || !f.partei) continue;
    const achsen = parteiAchsen(f.partei);
    if (!achsen) continue;
    const a = uebereinstimmung(achsen, massnahme, richtung);
    if (Math.abs(a) < 0.15) continue;
    figurLoyalitaetAendern(world, f, LINIE.partnerLoyalitaet * a * stufe, a > 0 ? "Die Partei sieht ihre Linie bestätigt." : "Die Partei sieht ihre Linie verlassen.");
  }
}

const preisCache = new Map<string, number>();

/**
 * Wie die Zustimmung auf eine Erhöhung der Maßnahme reagiert, aus dem Politiknetz geschätzt: Summe der Kantengewichte über höchstens drei Schritte
 * (jeder Schritt zählt 80 %) bis zum Vertrauen in die Regierung (Gewicht 0,45 der Zustimmungsformel) und zu den Wählergruppen (zusammen 0,25).
 * Positiv = beliebt, negativ = unbeliebt. Eine grobe Schätzung ohne Verzögerung und Kurvenform; sie dient nur dem Ausgleich in `reagiereStamm`.
 */
export function zustimmungsEinfluss(massnahme: string): number {
  const bekannt = preisCache.get(massnahme);
  if (bekannt !== undefined) return bekannt;
  const aus = new Map<string, { to: string; w: number }[]>();
  for (const e of NET.edges) {
    const l = aus.get(e.from);
    if (l) l.push({ to: e.to, w: e.weight });
    else aus.set(e.from, [{ to: e.to, w: e.weight }]);
  }
  const gewicht = (id: string): number => {
    if (id === "vertrauen_regierung") return 0.45;
    const g = GRUPPEN.find((x) => x.id === id);
    return g ? (0.25 * g.gewicht) / GRUPPEN_SUMME : 0;
  };
  let summe = 0;
  let front = [{ id: massnahme, f: 1 }];
  for (let hop = 0; hop < 3; hop++) {
    const next: { id: string; f: number }[] = [];
    for (const { id, f } of front)
      for (const e of aus.get(id) ?? []) {
        const ff = f * e.w;
        summe += ff * gewicht(e.to);
        next.push({ id: e.to, f: ff * 0.8 });
      }
    front = next;
  }
  preisCache.set(massnahme, summe);
  return summe;
}

/** Faktor auf den Stammwähler-Bonus einer Änderung: über 1 bei unbeliebten, unter 1 bei beliebten Maßnahmen (Richtung +1 erhöht, −1 senkt). */
export function preisFaktor(massnahme: string, richtung: number): number {
  const unbeliebt = (-zustimmungsEinfluss(massnahme) * Math.sign(richtung)) / LINIE.preisSkala;
  return clamp(1 + LINIE.preisAusgleich * unbeliebt, LINIE.preisUnten, LINIE.preisOben);
}

/**
 * Die Stammwählerschaft misst eine beschlossene Änderung an der Linie: Passt sie, steigt die Zustimmung dauerhaft, bricht sie die Linie,
 * sinkt sie (Glaubwürdigkeit). Dieselbe Regel gilt für jede Linie. Ohne sie bestrafte die Welt des Spiels Maßnahmen jeder Lage gleich hart,
 * obwohl jede Linie eine Basis hat, die gerade diese Maßnahmen will; gemessen in test/neutralitaet.test.ts.
 */
export function reagiereStamm(world: World, massnahme: string, richtung: number, umfang: number): void {
  const spiel = world.spiel;
  const spieler = world.player;
  if (!spiel || !spieler || richtung === 0 || umfang <= 0) return;
  const a = uebereinstimmung(spielerAchsen(world), massnahme, richtung);
  if (a === 0) return;
  const vorher = spieler.stammSaldo ?? 0;
  // Passt die Änderung zur Linie, wächst der Bonus mit dem Preis (Unbeliebtes trägt die Basis); bricht sie die Linie, gilt die Strafe unabhängig davon
  const ausgleich = a > 0 ? preisFaktor(massnahme, richtung) : 1;
  const nachher = clamp(vorher + LINIE.stamm * a * ausgleich * Math.min(1.5, umfang / 20), -LINIE.stammGrenze, LINIE.stammGrenze);
  const delta = nachher - vorher;
  if (delta === 0) return;
  spieler.stammSaldo = nachher;
  spiel.kalibrierung += delta;
  if (Math.floor(Math.abs(nachher) / 3) > Math.floor(Math.abs(vorher) / 3) || Math.sign(nachher) !== Math.sign(vorher)) {
    addLog(world, "ereignis", t(nachher > 0 ? "linie.stamm.plus" : "linie.stamm.minus", { punkte: Math.round(Math.abs(nachher)) }), t("linie.stamm.warum"));
  }
}

// ---------------------------------------------------------------------------
// Nähe zu Gruppen und Parteien

/**
 * Nähe der eigenen Partei zu den Wählergruppen aus den Achsen: nahe Gruppen +, ferne −, gewichtet so, dass die Summe über alle
 * Gruppen null ergibt (die Linie verschiebt, woher die Stimmung kommt, nicht wie viel es insgesamt ist). Höchstens ±LINIE.gruppenNaehe.
 */
export function gruppenNaehe(achsen: Achsen): Record<string, number> {
  const roh: Record<string, number> = {};
  for (const g of GRUPPEN) {
    const ga = GRUPPEN_ACHSEN[g.id];
    roh[g.id] = ga ? 1 - (2 * abstand(achsen, ga)) / 0.55 : 0;
  }
  const summe = GRUPPEN.reduce((s, g) => s + g.gewicht, 0);
  const mittel = GRUPPEN.reduce((s, g) => s + g.gewicht * roh[g.id]!, 0) / summe;
  const groesste = Math.max(0.0001, ...GRUPPEN.map((g) => Math.abs(roh[g.id]! - mittel)));
  const out: Record<string, number> = {};
  for (const g of GRUPPEN) out[g.id] = Math.round((LINIE.gruppenNaehe * (roh[g.id]! - mittel)) / Math.max(groesste, 0.5));
  return out;
}

/** Die klassischen Muster behalten ihre bisher von Hand gesetzte Nähe (Kalibrierung bleibt); alle anderen Linien rechnen aus den Achsen. */
export const KLASSISCH_NAEHE: Record<string, Record<string, number>> = {
  AP: { unternehmer: 3, staedtische_saekulare: 3, junge: 2 },
  PG: { arbeitnehmer: 4, rentner: 3, unternehmer: -2 },
  PW: { konservative: 4, landwirte: 2, staedtische_saekulare: -2 },
  PR: { landwirte: 4, junge: 1 },
};

export function naeheFuerLinie(kurz: string, achsen: Achsen): Record<string, number> {
  return KLASSISCH_NAEHE[kurz] ?? gruppenNaehe(achsen);
}

/** Nähe der eigenen Linie zu einer Partei der Szene, −2 (fern) bis +2 (nah). */
export function naeheZuPartei(achsen: Achsen, partei: string): number {
  const p = PARTEI_ACHSEN[partei];
  return p ? naeheAusAbstand(abstand(achsen, p)) : 0;
}

/** Aus welchen Parteien eine neue Partei ihre Stimmen zieht: nach Nähe der Linie und Größe (Anteil am Zugewinn, Summe 1). */
export function quellenAusAchsen(achsen: Achsen, umfragen: Record<string, number>): Record<string, number> {
  const w: Record<string, number> = {};
  for (const p of Object.keys(PARTEI_ACHSEN)) w[p] = (umfragen[p] ?? 0) * Math.exp(-abstand(achsen, PARTEI_ACHSEN[p]!) / 0.2);
  w["Andere"] = 0.5;
  const summe = Object.values(w).reduce((s, x) => s + x, 0);
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(w)) out[k] = v / summe;
  return out;
}

// ---------------------------------------------------------------------------
// Eigene Partei setzen und vorab zeigen, was die Linie bedeutet

export interface ParteiAngabe {
  name: string;
  kurz: string;
  farbe: string;
  achsen: Achsen;
}

/** Setzt Partei, Achsen und Gruppennähe im Profil (ersetzt die frühere Handarbeit je Antwort). */
export function setzeLinie(p: { partei: { name: string; kurz: string; farbe: string }; achsen?: Achsen; naehe: Record<string, number> | Partial<Record<string, number>> }, a: ParteiAngabe): void {
  p.partei = { name: a.name, kurz: a.kurz, farbe: a.farbe };
  p.achsen = { ...a.achsen };
  merkeAchsen(a.kurz, p.achsen);
  const n = p.naehe as Record<string, number>;
  for (const [g, d] of Object.entries(naeheFuerLinie(a.kurz, a.achsen))) n[g] = (n[g] ?? 0) + d;
}

export function voreinstellungAlsAngabe(v: Voreinstellung, name: string): ParteiAngabe {
  return { name, kurz: v.kurz, farbe: v.farbe, achsen: v.achsen };
}

export interface LinienVorschau {
  /** Gruppen nach Nähe: wer trägt dich (nah) und wer steht fern */
  gruppen: { id: string; naehe: number }[];
  /** Parteien der Szene nach Abstand: Partner (nah) und Gegner (fern) */
  parteien: { kurz: string; naehe: number; abstand: number }[];
  /** Maßnahmen mit dem niedrigsten und höchsten Kapitalfaktor (Erhöhen und Senken) */
  billig: { id: string; richtung: 1 | -1; faktor: number }[];
  teuer: { id: string; richtung: 1 | -1; faktor: number }[];
}

/** Was eine Linie bedeutet, ohne Spielstand: für die Vorschau im Parteikonfigurator. */
export function vorschau(achsen: Achsen, kurz = "", anzahl = 5): LinienVorschau {
  const n = naeheFuerLinie(kurz, achsen);
  const gruppen = GRUPPEN.map((g) => ({ id: g.id, naehe: n[g.id] ?? 0 })).sort((x, y) => y.naehe - x.naehe);
  const parteien = Object.keys(PARTEI_ACHSEN)
    .map((p) => ({ kurz: p, naehe: naeheZuPartei(achsen, p), abstand: abstand(achsen, PARTEI_ACHSEN[p]!) }))
    .sort((x, y) => x.abstand - y.abstand);
  const alle: { id: string; richtung: 1 | -1; faktor: number; gewicht: number }[] = [];
  for (const id of Object.keys(MASSNAHME_VEKTOR)) {
    const v = MASSNAHME_VEKTOR[id]!;
    const gewicht = ACHSEN_IDS.reduce((s, k) => s + Math.abs(v[k]), 0);
    for (const richtung of [1, -1] as const) {
      const a = uebereinstimmung(achsen, id, richtung);
      if (a === 0) continue;
      alle.push({ id, richtung, faktor: a >= 0 ? 1 - LINIE.rabatt * a : 1 + LINIE.aufschlag * -a, gewicht });
    }
  }
  // Bei gleichem Faktor zuerst die Maßnahmen mit dem stärksten Lagerbezug (sie zeigen die Linie am deutlichsten)
  const ordnung = (x: { faktor: number; gewicht: number }, y: { faktor: number; gewicht: number }) => x.faktor - y.faktor || y.gewicht - x.gewicht;
  const klein = ({ id, richtung, faktor }: { id: string; richtung: 1 | -1; faktor: number }) => ({ id, richtung, faktor });
  const billig = [...alle].sort(ordnung).slice(0, anzahl).map(klein);
  const teuer = [...alle].sort((x, y) => -ordnung(x, y)).slice(0, anzahl).map(klein);
  return { gruppen, parteien, billig, teuer };
}

/** Das klassische Muster zum Kürzel (AP, PG, PW, PR) oder undefined. */
export const klassischNachKurz = (kurz: string): Voreinstellung | undefined => KLASSISCHE_VOREINSTELLUNGEN.find((v) => v.kurz === kurz);

// ---------------------------------------------------------------------------
// Kurswechsel: Die Linie der Partei selbst ändern (teuer, kostet Glaubwürdigkeit)

/** Kapitalpreis eines Kurswechsels: ein Sockel plus ein Teil, der mit dem Abstand zwischen alter und neuer Linie wächst (Spielparameter). */
export function kurswechselKosten(world: Pick<World, "player">, neu: Achsen): number {
  return Math.round(8 + 60 * abstand(spielerAchsen(world), neu));
}

/**
 * Die Partei legt eine neue Linie fest (zum Beispiel nach einem Machtwechsel im Lager oder zur Wahl). Das kostet Kapital und Glaubwürdigkeit:
 * Die Stammwählerschaft zweifelt (Saldo sinkt mit dem Abstand), die Partner mit der alten Linie werden kühl. Danach gilt die neue Linie für Kosten,
 * Stimmen und Partnerreaktionen. Keine Richtung ist verboten.
 */
export function kurswechsel(world: World, neu: Achsen): { ok: boolean; kosten: number; grund?: string } {
  const spiel = world.spiel;
  const spieler = world.player;
  if (!spiel || !spieler) return { ok: false, kosten: 0, grund: t("linie.kurswechsel.kein_spiel") };
  const alt = spielerAchsen(world);
  const d = abstand(alt, neu);
  const kosten = kurswechselKosten(world, neu);
  if (d < 0.02) return { ok: false, kosten: 0, grund: t("linie.kurswechsel.gleich") };
  if (!kannZahlen(spiel.kapital, kosten)) return { ok: false, kosten, grund: t("linie.kurswechsel.zu_teuer", { kosten }) };
  spiel.kapital -= kosten;
  spieler.achsen = { ...neu };
  merkeAchsen(spieler.partei.kurz, spieler.achsen);
  // Glaubwürdigkeit: Je weiter der Schritt, desto mehr Zweifel in der Basis (und auf Dauer ein Malus in der Zustimmung)
  const strafe = clamp(d * 18, 1, LINIE.stammGrenze);
  spieler.stammSaldo = clamp((spieler.stammSaldo ?? 0) - strafe, -LINIE.stammGrenze, LINIE.stammGrenze);
  spiel.kalibrierung -= strafe;
  for (const f of spiel.figuren) if (f.amt === "partner") figurLoyalitaetAendern(world, f, -Math.round(d * 12));
  addLog(world, "entscheidung", t("linie.kurswechsel.log", { kosten, strafe: Math.round(strafe) }), t("linie.kurswechsel.warum"));
  return { ok: true, kosten };
}
