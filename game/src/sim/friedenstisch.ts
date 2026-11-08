// Der Friedenstisch (Welle 3, K4; krieg.md Schritt 7, Befund C4): Forderungen je Region statt vier fester Bündel.
//
// Was der Spieler entscheidet: Für jede Region, die die Türkei hält oder um die gekämpft wird, eine Form (Sicherheitszone, Sonderstatus,
// Abtretung, Rückgabe), dazu die Auflagen des Vertrags (Rückzug des Gegners um 10 oder 30 km, gemeinsame Patrouillen, Rückkehr von
// Geflüchteten, Reparationen, Garantien). Jede Forderung hat einen Preis in Punkten und einen Innen- und Außenpreis, sichtbar vor dem Klick.
// Der Gegner nimmt an, wenn das Paket in sein Budget passt; sonst lehnt er ab und legt ein Gegenangebot vor. Ein Vermittler (USA oder
// Russland, wer dem Gegner näher steht) bringt ein eigenes Paket, das der Gegner mit dem Gewicht des Vermittlers annimmt.
//
// Vorbilder und Belege (Abruf 08.11.2026):
//   - Spielmuster: HOI4-Friedenskonferenz, Punktebudget nach Beitrag, eigene Besetzung billiger, „Kern nehmen“ teuer; ohne die Auktion der
//     Sieger und ohne Runden (recherche_vorbilder.md M8, K7; https://hoi4.paradoxwikis.com/Peace_conference).
//   - Gemeinsame Erklärung USA–Türkei vom 17.10.2019 (13 Punkte): Pkt. 8 Einheit und territoriale Unversehrtheit Syriens, Pkt. 9 schwere
//     Waffen der YPG einsammeln, Pkt. 10 die Zone setzen „primarily“ die türkischen Streitkräfte durch, Pkt. 11 Pause von 120 Stunden für den
//     Abzug der YPG aus der Zone, Pkt. 12 keine weiteren Sanktionen nach EO 13894, die bestehenden fallen mit dem Ende der Operation.
//     https://www.aljazeera.com/news/2019/10/full-text-turkey-statement-northeast-syria-191017191203481.html
//   - Memorandum Türkei–Russland, Sotschi 22.10.2019 (10 Punkte): Pkt. 1 Einheit Syriens, Pkt. 3 der Status quo im Gebiet Tal Abyad – Ras
//     al-Ain mit 32 km Tiefe bleibt, Pkt. 4 Adana-Abkommen bekräftigt, Pkt. 5 Rückzug der YPG 30 km binnen 150 Stunden, danach gemeinsame
//     russisch-türkische Patrouillen 10 km tief (ohne Qamischli), Pkt. 6 Manbidsch und Tal Rifat geräumt, Pkt. 8 sichere und freiwillige
//     Rückkehr von Geflüchteten. https://www.iletisim.gov.tr/english/haberler/detay/memorandum-of-understanding-between-turkey-and-the-russian-federation
//   - Abtretung nur unter echtem Druck: Finnland trat am 12.03.1940 rund 9 % seines Gebiets mit Viipuri ab, als die Rote Armee die Stadt
//     fast eingeschlossen hatte (https://en.wikipedia.org/wiki/Moscow_Peace_Treaty). Armenien gab nach dem Fall von Schuscha Kalbadschar,
//     Agdam und Latschin mit Fristen zurück; Russland vermittelte und stellte 1.960 Soldaten für fünf Jahre, Rückkehr unter Aufsicht des
//     UNHCR (Erklärung vom 09./10.11.2020, https://en.wikipedia.org/wiki/2020_Nagorno-Karabakh_ceasefire_agreement). Seit 1945 ist die
//     Eroberung ganzer Teile von Staaten selten geworden; wer erobert, nimmt kleine Stücke und meidet den Krieg (Zacher 2001, International
//     Organization 55/2; Altman 2020, International Organization 74/3, 151 Eroberungsversuche 1918 bis 2018).
//   - Hatay-Weg: Vertrag Türkei–Frankreich vom 23.06.1939 in Ankara (Hatay an die Türkei), am selben Tag die Beistandserklärung in Paris;
//     Beschluss der Hatay-Versammlung 29.06.1939, Gesetz der Großen Nationalversammlung 07.07.1939; Syrien erkannte den Übergang nicht an
//     (recherche_besatzung.md C.3; https://atamdergi.gov.tr/ozet/183/eng).
//   - Sonderstatus: Abkommen Moldau–Russland vom 21.07.1992 über Transnistrien, Waffenruhe, Sicherheitszone, gemeinsame Kontrollkommission
//     und Friedenstruppe (https://pax.peaceagreements.org/agreements/1024). Zypern: Der Annan-Plan 2004 sah für den türkisch-zyprischen
//     Teilstaat gut 28,5 bis 29 % der Insel vor, weniger als die heute kontrollierte Fläche; der Süden lehnte mit 75,83 % ab
//     (recherche_besatzung.md B; https://www.nbcnews.com/id/wbna4637309).
//
// Alle Punktwerte, Budgets und Faktoren sind Spielparameter; belegt sind Vorbilder, Fristen und Kilometer.

import type { FriedensTisch, KriegVorgang, TischForm } from "./krieg-typen";
import type { Region } from "../data/schauplaetze";
import { genommeneFlaeche, regionenVon, schauplatzFuer, zielFlaeche } from "./kriegsschauplatz";
import { istFernkonflikt } from "./fernkonflikt";
import { paketBlockade } from "./pakte";
import { paarVon } from "./welt-modell";
import { land, landAendern } from "./laender";
import { wirke } from "./wirkung";
import { kosten } from "./ereignis-hilfen";
import { marktErholung } from "./kriegspreis";
import { kriegZu, poVerlustFuer, zielraumVon, friedenMitTisch, type Ergebnis } from "./krieg";
import { addLog } from "./log";
import { t } from "../i18n";
import type { World } from "./types";

const clamp = (x: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, x));
const r1 = (x: number): number => Math.round(x * 10) / 10;

/** Spielparameter des Friedenstischs. */
export const TISCH = {
  /** Budget: Anteil des gehaltenen Zielraums, Erschöpfung des Gegners, eigene Erschöpfung (Abzug), erreichtes Kriegsziel, Rückzug des Gegners */
  budgetKontrolle: 35,
  budgetErschoepfung: 0.6,
  budgetEigen: 0.3,
  budgetZiel: 8,
  budgetRueckzug: 15,
  /** Preis einer Region: Grundwert, je Bedeutung (1 bis 3), je 100.000 Einwohner (höchstens 20); HOI4: Staatswert 10 + 1 je 100.000 */
  regionGrund: 4,
  regionJeWert: 3,
  regionEinwohnerMax: 20,
  /** Faktor je Form; eine gehaltene Zone kostet die Hälfte (HOI4: eigene Besetzung 0,8; Sotschi Pkt. 3: der Status quo bleibt) */
  faktor: { zone: 0.5, zoneUmkaempft: 1, satellit: 1.6, annexion: 3, rueckgabe: -0.3 } as const,
  /** Abtretung nur unter echtem Druck: Rückhalt des Gegners höchstens so hoch, oder er hat den Rückzug angetreten */
  abtretungUhr: 30,
  /** Sonderstatus erst, wenn der Gegner deutlich erschöpft ist (Moldau unterschrieb 1992 nach den Kämpfen um Bender) */
  sonderstatusUhr: 50,
  /** Auflagen in Punkten (Patrouillen machen das Paket für den Gegner leichter) */
  rueckzug: { 0: 0, 10: 6, 30: 14 } as Record<0 | 10 | 30, number>,
  patrouillen: -4,
  rueckkehr: 5,
  reparation: 12,
  garantien: 3,
  /** Gewicht des Vermittlers: So viele Punkte mehr trägt der Gegner, wenn das Paket vom Vermittler kommt */
  vermittlerBonus: 15,
} as const;

/** Hauptstädte gibt kein Gegner ab (Spielparameter; Eriwan ist eigene Verwaltungseinheit, Nikosia Sitz der Regierung der Republik Zypern). */
const HAUPTSTADT = new Set(["arm_eriwan", "cyp_nikosia"]);

export type TischLage = "eigen" | "umkaempft";

export interface TischRegion {
  region: Region;
  lage: TischLage;
  form: TischForm;
  punkte: number;
  /** Je Form: möglich oder der Grund, warum nicht, und der Preis in Punkten */
  formen: { form: TischForm; punkte: number; grund?: string }[];
}

/** Ein Posten des Außen- oder Innenpreises, so wie er gebucht wird. */
export type Buchung =
  | { art: "knoten"; id: string; wert: number }
  | { art: "land"; id: string; delta: { konflikt?: number; vertrauen?: number; sicherheit?: number } }
  | { art: "kosten"; bip: number }
  | { art: "zustimmung"; wert: number }
  /** Innenpreis vor der Presse (sim/krieg.ts poVerlustFuer), gebucht über friedenSchliessen */
  | { art: "basis"; wert: number }
  /** Die USA heben die Sanktionen auf (Pkt. 12 der Erklärung vom 17.10.2019): Die Lira erholt sich (sim/kriegspreis.ts) */
  | { art: "markt" };

export interface TischPreis {
  punkte: number;
  budget: number;
  /** Ob der Gegner annimmt (Paket im Budget, keine gesperrte Forderung) */
  annahme: boolean;
  /** Gesperrte Forderungen (Abtretung ohne Druck, Hauptstadt) */
  gesperrt: string[];
  buchungen: Buchung[];
  /** Zusammenfassung der Buchungen für die Anzeige (dieselben Zahlen) */
  po: number;
  zustimmung: number;
  nationalisten: number;
  ansehen: number;
  konflikt: Record<string, number>;
  bip: number;
}

// ---------------------------------------------------------------------------
// Wer am Tisch sitzt

/** Ob es einen Friedenstisch mit Regionen gibt: Landkrieg mit Schauplatz in der Waffenruhe, und die Türkei hält oder bekämpft eine Region. */
export function tischMoeglich(k: KriegVorgang): boolean {
  if (k.phase !== "waffenruhe" || istFernkonflikt(k.land) || !schauplatzFuer(k.land)) return false;
  return regionenVon(k.land).some((r) => k.regionen?.[r.id] === "eigen" || k.regionen?.[r.id] === "umkaempft");
}

/**
 * Der Vermittler: wer von den USA und Russland dem Gegner näher steht (Bündniswert im Weltmodell, sim/welt-modell.ts paarVon) und nicht
 * selbst mitkämpft. Bei Gleichstand wie in K3 (Wendepunkt Vermittlung): im Kaukasus und gegen Iran Russland, sonst die USA.
 */
export function vermittlerVon(w: World, k: KriegVorgang): "USA" | "RUS" | undefined {
  const kaempft = new Set((k.koalition?.partner ?? []).map((p) => p.id));
  const kandidaten = (["USA", "RUS"] as const).filter((v) => !kaempft.has(v) && v !== k.land);
  if (!kandidaten.length) return undefined;
  if (kandidaten.length === 1) return kandidaten[0];
  const usa = paarVon(w, "USA", k.land).buendnis;
  const rus = paarVon(w, "RUS", k.land).buendnis;
  if (usa !== rus) return usa > rus ? "USA" : "RUS";
  return k.land === "ARM" || k.land === "IRN" ? "RUS" : "USA";
}

// ---------------------------------------------------------------------------
// Budget und Preise

/** Das Budget des Gegners in Punkten: wie viel Druck auf ihm liegt (Kontrolle und Erschöpfung), mit allen Posten. */
export function tischBudget(w: World, k: KriegVorgang): { punkte: number; posten: { id: string; wert: number }[] } {
  const ziel = zielFlaeche(k);
  const kontrolle = ziel > 0 ? clamp(genommeneFlaeche(k) / ziel, 0, 1) : clamp((k.front - 50) / 50, 0, 1);
  const posten = [
    { id: "kontrolle", wert: r1(TISCH.budgetKontrolle * kontrolle) },
    { id: "erschoepfung_gegner", wert: r1(TISCH.budgetErschoepfung * clamp(100 - k.uhrGegner, 0, 200)) },
    { id: "erschoepfung_eigen", wert: r1(-TISCH.budgetEigen * clamp(100 - k.uhr, 0, 200)) },
    ...(k.zielErreicht !== undefined ? [{ id: "ziel", wert: TISCH.budgetZiel }] : []),
    ...(k.rueckzugGegner ? [{ id: "rueckzug", wert: TISCH.budgetRueckzug }] : []),
    // Die Partner des Gegners stärken ihm den Rücken, solange sie Kampfkraft haben (sim/pakte.ts)
    { id: "blockade", wert: r1(-paketBlockade(w, k, true)) },
  ].filter((p) => p.wert !== 0);
  return { punkte: Math.max(0, Math.round(posten.reduce((s, p) => s + p.wert, 0))), posten };
}

function regionGrundwert(r: Region): number {
  return TISCH.regionGrund + TISCH.regionJeWert * r.wert + Math.min(TISCH.regionEinwohnerMax, (r.einwohner?.zahl ?? 0) / 100_000);
}

/** Preis einer Region in einer Form (Punkte, gerundet). Verzicht auf eine umkämpfte Region kostet nichts. */
export function regionPunkte(r: Region, lage: TischLage, form: TischForm): number {
  const g = regionGrundwert(r);
  if (form === "rueckgabe") return lage === "umkaempft" ? 0 : Math.round(g * TISCH.faktor.rueckgabe);
  if (form === "zone") return Math.round(g * (lage === "eigen" ? TISCH.faktor.zone : TISCH.faktor.zoneUmkaempft));
  return Math.round(g * TISCH.faktor[form]);
}

/** Steht der Gegner unter echtem Druck, dass er Gebiet abtritt? */
export function abtretungsDruck(k: KriegVorgang): boolean {
  return k.uhrGegner <= TISCH.abtretungUhr || !!k.rueckzugGegner;
}

/** Warum eine Form für eine Region nicht geht (oder undefined). */
function formGrund(k: KriegVorgang, r: Region, lage: TischLage, form: TischForm): string | undefined {
  const name = land(k.land).name;
  if (lage === "umkaempft" && (form === "satellit" || form === "annexion")) return t("welle_k4.grund.umkaempft", { land: name });
  if (form === "annexion" && HAUPTSTADT.has(r.id)) return t("welle_k4.grund.hauptstadt", { land: name });
  if (form === "annexion" && !abtretungsDruck(k)) return t("welle_k4.grund.druck", { land: name, uhr: TISCH.abtretungUhr });
  if (form === "satellit" && !(k.uhrGegner <= TISCH.sonderstatusUhr || k.rueckzugGegner)) return t("welle_k4.grund.sonderstatus", { land: name, uhr: TISCH.sonderstatusUhr });
  return undefined;
}

/** Die Regionen am Tisch mit der Form des Entwurfs und allen Formen samt Preis. */
export function tischRegionen(k: KriegVorgang, tisch: FriedensTisch): TischRegion[] {
  const out: TischRegion[] = [];
  for (const r of regionenVon(k.land)) {
    const l = k.regionen?.[r.id];
    if (l !== "eigen" && l !== "umkaempft") continue;
    const form = tisch.regionen[r.id] ?? (l === "eigen" ? "zone" : "rueckgabe");
    const formen = (["zone", "satellit", "annexion", "rueckgabe"] as TischForm[]).map((f) => {
      const grund = formGrund(k, r, l, f);
      return { form: f, punkte: regionPunkte(r, l, f), ...(grund ? { grund } : {}) };
    });
    out.push({ region: r, lage: l, form, punkte: regionPunkte(r, l, form), formen });
  }
  return out;
}

/** Der Vorschlag der Lage (wie „Frieden entlang der Linie“): Was die Türkei hält, bleibt Zone; um Umkämpftes wird nicht gestritten. */
export function tischDerLage(k: KriegVorgang): FriedensTisch {
  const regionen: Record<string, TischForm> = {};
  for (const r of regionenVon(k.land)) {
    const l = k.regionen?.[r.id];
    if (l === "eigen") regionen[r.id] = "zone";
    else if (l === "umkaempft") regionen[r.id] = "rueckgabe";
  }
  return { regionen, rueckzugKm: 0, patrouillen: false, rueckkehr: false, reparation: false, garantien: true };
}

/** Der Entwurf des Präsidenten (oder, solange er nichts verändert hat, der Vorschlag der Lage). */
export function tischEntwurf(k: KriegVorgang): FriedensTisch {
  return k.tisch ?? tischDerLage(k);
}

const behalten = (f: TischForm): boolean => f !== "rueckgabe";

/**
 * Alle Buchungen eines Pakets, genau so, wie `friedenSchliessen` sie bucht (keine Schau). Die festen Folgen eines Friedens mit Gebiet
 * stammen aus dem früheren Paket „gebiet = 1“ (sim/krieg.ts), die Zusätze je Form und Auflage sind Spielparameter.
 */
export function tischBuchungen(w: World, k: KriegVorgang, tisch: FriedensTisch): Buchung[] {
  const b: Buchung[] = [];
  const regs = tischRegionen(k, tisch);
  const gehalten = regs.filter((x) => behalten(x.form) && (x.lage === "eigen" || x.form === "zone"));
  const zurueck = regs.filter((x) => x.form === "rueckgabe" && x.lage === "eigen");
  const L = k.land;
  if (gehalten.length) {
    // Wie das frühere Paket mit Gebiet: Hardliner zufrieden, außen ein Preis nach Rahmung und Bedeutung des Zielraums
    const bed = zielraumVon(k).bedeutung - 2;
    const ansehen = (k.rahmung === "verteidigung" ? -4 : k.rahmung === "revision" ? -6 : -3) - 1.5 * bed;
    b.push({ art: "knoten", id: "nationalisten", wert: 6 + 2 * bed }, { art: "knoten", id: "konservative", wert: 3 }, { art: "knoten", id: "ansehen", wert: ansehen });
    b.push({ art: "knoten", id: "beziehungen_eu", wert: -3 }, { art: "land", id: L, delta: { konflikt: 25, vertrauen: -10 } });
    if (k.rahmung !== "verteidigung") b.push({ art: "basis", wert: 3 });
  }
  for (const x of gehalten) {
    if (x.form === "satellit") b.push({ art: "knoten", id: "ansehen", wert: -1.5 }, { art: "knoten", id: "nationalisten", wert: 1 }, { art: "land", id: "EU", delta: { konflikt: 2 } });
    if (x.form === "annexion") {
      b.push({ art: "knoten", id: "ansehen", wert: -4 }, { art: "knoten", id: "nationalisten", wert: 3 }, { art: "knoten", id: "konservative", wert: 1 }, { art: "knoten", id: "staedtische_saekulare", wert: -1 });
      b.push({ art: "land", id: "EU", delta: { konflikt: 3 } }, { art: "land", id: "USA", delta: { konflikt: 2 } });
    }
  }
  for (const _ of zurueck) {
    b.push({ art: "knoten", id: "nationalisten", wert: -2 }, { art: "knoten", id: "ansehen", wert: 1 }, { art: "land", id: L, delta: { vertrauen: 4 } }, { art: "basis", wert: 1.5 });
  }
  if (gehalten.length && tisch.rueckzugKm > 0) b.push({ art: "knoten", id: "nationalisten", wert: tisch.rueckzugKm === 30 ? 1 : 0.5 }, { art: "land", id: L, delta: { konflikt: tisch.rueckzugKm === 30 ? 4 : 2 } });
  const v = vermittlerVon(w, k);
  if (gehalten.length && tisch.patrouillen && v) b.push({ art: "land", id: v, delta: { konflikt: -2 } }, { art: "knoten", id: "nationalisten", wert: -0.5 });
  if (gehalten.length && tisch.rueckkehr) b.push({ art: "zustimmung", wert: 0.5 });
  if (tisch.reparation) b.push({ art: "kosten", bip: -0.8 }, { art: "knoten", id: "nationalisten", wert: 2 }, { art: "land", id: L, delta: { vertrauen: -5 } });
  if (tisch.garantien) b.push({ art: "land", id: L, delta: { konflikt: -15, vertrauen: 5, sicherheit: 6 } });
  if (!gehalten.length) {
    // Ohne Gebiet ziehen beide Seiten ab (wie der weiße Frieden)
    b.push({ art: "land", id: L, delta: { konflikt: -10 } }, { art: "knoten", id: "truppenmoral", wert: 2 });
    if (!tisch.reparation && k.woche >= 10) b.push({ art: "basis", wert: 2 });
  }
  // Ein Paket des Vermittlers: Er bürgt dafür und wird belohnt (Pence: Sanktionen fallen; Sotschi: Moskau gewinnt, Washington grollt)
  if (tisch.von === "USA") b.push({ art: "land", id: "USA", delta: { konflikt: -4 } }, { art: "markt" }, { art: "knoten", id: "ansehen", wert: 1 }, { art: "knoten", id: "nationalisten", wert: -1 });
  if (tisch.von === "RUS") b.push({ art: "land", id: "RUS", delta: { konflikt: -3 } }, { art: "land", id: "USA", delta: { konflikt: 2 } }, { art: "knoten", id: "ansehen", wert: 1 }, { art: "knoten", id: "nationalisten", wert: -1 });
  return b;
}

/** Punkte eines Pakets (Summe der Regionen und Auflagen). */
export function tischPunkte(k: KriegVorgang, tisch: FriedensTisch): number {
  const regs = tischRegionen(k, tisch);
  const gehalten = regs.some((x) => behalten(x.form));
  let p = regs.reduce((s, x) => s + x.punkte, 0);
  if (gehalten) p += TISCH.rueckzug[tisch.rueckzugKm] + (tisch.patrouillen ? TISCH.patrouillen : 0) + (tisch.rueckkehr ? TISCH.rueckkehr : 0);
  if (tisch.reparation) p += TISCH.reparation;
  if (tisch.garantien) p += TISCH.garantien;
  return Math.max(0, p);
}

/** Preis und Antwort des Gegners auf ein Paket: Punkte gegen Budget, gesperrte Forderungen, alle Buchungen und ihre Summen. */
export function tischPreis(w: World, k: KriegVorgang, tisch: FriedensTisch): TischPreis {
  const buchungen = tischBuchungen(w, k, tisch);
  const punkte = tischPunkte(k, tisch);
  const grund = tischBudget(w, k).punkte;
  const budget = grund + (tisch.von === "USA" || tisch.von === "RUS" ? TISCH.vermittlerBonus : 0);
  const gesperrt = tischRegionen(k, tisch).filter((x) => x.formen.find((f) => f.form === x.form)?.grund).map((x) => x.region.id);
  const konflikt: Record<string, number> = {};
  let nationalisten = 0, ansehen = 0, zustimmung = 0, basis = 0, bip = 0;
  for (const x of buchungen) {
    if (x.art === "knoten" && x.id === "nationalisten") nationalisten += x.wert;
    if (x.art === "knoten" && x.id === "ansehen") ansehen += x.wert;
    if (x.art === "land" && x.delta.konflikt) konflikt[x.id] = (konflikt[x.id] ?? 0) + x.delta.konflikt;
    if (x.art === "zustimmung") zustimmung += x.wert;
    if (x.art === "basis") basis += x.wert;
    if (x.art === "kosten") bip += x.bip;
  }
  const po = poVerlustFuer(w, basis);
  for (const key of Object.keys(konflikt)) if (!konflikt[key]) delete konflikt[key];
  return { punkte, budget, annahme: punkte <= budget && !gesperrt.length, gesperrt, buchungen, po, zustimmung: r1(zustimmung - po), nationalisten: r1(nationalisten), ansehen: r1(ansehen), konflikt, bip };
}

/** Bucht die Buchungen eines Pakets (ohne den Innenpreis „basis“, den friedenSchliessen über die Presse bucht). */
export function tischBuchen(w: World, k: KriegVorgang, tisch: FriedensTisch): void {
  for (const x of tischBuchungen(w, k, tisch)) {
    if (x.art === "knoten") wirke(w, x.id, x.wert);
    else if (x.art === "land") landAendern(w, x.id, x.delta, t("welle_k4.notiz", { land: land(k.land).name }));
    else if (x.art === "kosten") kosten(w, x.bip);
    else if (x.art === "zustimmung" && w.spiel) w.spiel.umfrage.zustimmung = clamp(w.spiel.umfrage.zustimmung + x.wert, 0, 100);
    else if (x.art === "markt") marktErholung(w, k);
  }
}

// ---------------------------------------------------------------------------
// Gegenangebot und Vermittler

const kopie = (x: FriedensTisch): FriedensTisch => ({ ...x, regionen: { ...x.regionen } });

/**
 * Das Gegenangebot: das Paket, gekürzt bis es in die Grenze passt. Der Gegner streicht zuerst gesperrte Forderungen, dann Abtretung und
 * Sonderstatus (die teuerste Region zuerst), dann Reparationen, Kilometer und Rückkehr; zuletzt verzichtet die Türkei auf Umkämpftes und gibt
 * gehaltene Regionen zurück.
 * Gibt es einen Vermittler, bietet der Gegner von sich aus gemeinsame Patrouillen an (Gegenseitigkeit, Sotschi Pkt. 5).
 */
export function kuerzen(w: World, k: KriegVorgang, tisch: FriedensTisch, grenze: number): FriedensTisch {
  const x = kopie(tisch);
  const passt = () => tischPunkte(k, x) <= grenze && !tischRegionen(k, x).some((r) => r.formen.find((f) => f.form === r.form)?.grund);
  // Gesperrtes zuerst: Abtretung ohne Druck wird Sonderstatus, Umkämpftes kommt nur als Zone
  for (const r of tischRegionen(k, x)) {
    const g = r.formen.find((f) => f.form === r.form)?.grund;
    if (g) x.regionen[r.region.id] = r.lage === "eigen" ? "satellit" : "zone";
  }
  const teuerste = (pred: (r: TischRegion) => boolean, neu: TischForm) => () => {
    const kand = tischRegionen(k, x).filter(pred).sort((a, b) => b.punkte - a.punkte)[0];
    if (!kand) return false;
    x.regionen[kand.region.id] = neu;
    return true;
  };
  // Reihenfolge des Gegners: zuerst, was seine Hoheit trifft (Abtretung, Sonderstatus), dann Geld, dann Kilometer, dann die Rückkehr;
  // zuletzt verzichtet die Türkei auf Umkämpftes und gibt Gehaltenes zurück
  const schritte: (() => boolean)[] = [
    () => (vermittlerVon(w, k) && !x.patrouillen && tischRegionen(k, x).some((r) => behalten(r.form)) ? ((x.patrouillen = true), true) : false),
    teuerste((r) => r.form === "annexion", "satellit"),
    teuerste((r) => r.form === "satellit", "zone"),
    () => (x.reparation ? ((x.reparation = false), true) : false),
    () => (x.rueckzugKm === 30 ? ((x.rueckzugKm = 10), true) : false),
    () => (x.rueckzugKm === 10 ? ((x.rueckzugKm = 0), true) : false),
    () => (x.rueckkehr ? ((x.rueckkehr = false), true) : false),
    teuerste((r) => r.form === "zone" && r.lage === "umkaempft", "rueckgabe"),
    teuerste((r) => r.form === "zone" && r.lage === "eigen", "rueckgabe"),
  ];
  for (let i = 0; i < 60 && !passt(); i++) {
    const schritt = schritte.find((f) => f());
    if (!schritt) break;
  }
  x.von = "gegner";
  return x;
}

/**
 * Das Paket des Vermittlers. USA nach der Erklärung vom 17.10.2019: Zone über Gehaltenes und Umkämpftes (Abzug aus der Zone binnen
 * 120 Stunden), Garantien, keine weiteren Forderungen, die Sanktionen fallen. Russland nach Sotschi: Gehaltenes bleibt Zone, Umkämpftes
 * übernimmt der Staat, Rückzug 30 km, gemeinsame Patrouillen, Rückkehr von Geflüchteten, Garantien (Adana). Beide bekräftigen die Einheit
 * des Gegners: keine Abtretung, kein Sonderstatus. Passt es nicht ins Budget samt Gewicht des Vermittlers, kürzt er es.
 */
export function vermittlerPaket(w: World, k: KriegVorgang): FriedensTisch | undefined {
  const v = vermittlerVon(w, k);
  if (!v) return undefined;
  const regionen: Record<string, TischForm> = {};
  for (const r of regionenVon(k.land)) {
    const l = k.regionen?.[r.id];
    if (l === "eigen") regionen[r.id] = "zone";
    else if (l === "umkaempft") regionen[r.id] = v === "USA" ? "zone" : "rueckgabe";
  }
  const roh: FriedensTisch = v === "USA"
    ? { regionen, rueckzugKm: 0, patrouillen: false, rueckkehr: false, reparation: false, garantien: true, von: "USA" }
    : { regionen, rueckzugKm: 30, patrouillen: true, rueckkehr: true, reparation: false, garantien: true, von: "RUS" };
  const grenze = tischBudget(w, k).punkte + TISCH.vermittlerBonus;
  if (tischPunkte(k, roh) <= grenze) return roh;
  return { ...kuerzen(w, k, roh, grenze), von: v };
}

// ---------------------------------------------------------------------------
// Handlungen

/** Eine Form oder Auflage im Entwurf ändern (kostet nichts; erst das Vorlegen zählt). */
export function tischSetzen(w: World, kriegId: string, aenderung: { region?: string; form?: TischForm } & Partial<Omit<FriedensTisch, "regionen" | "von">>): Ergebnis {
  const k = kriegZu(w, kriegId);
  if (!k || !tischMoeglich(k)) return { ok: false, text: t("welle_k4.x.kein_tisch") };
  const x = kopie(tischEntwurf(k));
  delete x.von;
  if (aenderung.region && aenderung.form) {
    const r = tischRegionen(k, x).find((y) => y.region.id === aenderung.region);
    if (!r) return { ok: false, text: t("welle_k4.x.keine_region") };
    const g = r.formen.find((f) => f.form === aenderung.form)?.grund;
    if (g) return { ok: false, text: g };
    x.regionen[aenderung.region] = aenderung.form;
  }
  if (aenderung.rueckzugKm !== undefined) x.rueckzugKm = aenderung.rueckzugKm;
  for (const f of ["patrouillen", "rueckkehr", "reparation", "garantien"] as const) if (aenderung[f] !== undefined) x[f] = aenderung[f]!;
  k.tisch = x;
  return { ok: true, text: t("welle_k4.x.gesetzt") };
}

/**
 * Ein Paket vorlegen: den eigenen Entwurf, das Gegenangebot oder das Paket des Vermittlers. Passt es (Budget, keine gesperrte Forderung),
 * schließt der Gegner Frieden; sonst lehnt er ab und legt sein Gegenangebot vor (die Eskalation steigt wie bei einem abgelehnten Paket).
 */
export function tischVorlegen(w: World, kriegId: string, welches: "eigen" | "gegen" | "vermittler"): Ergebnis {
  const k = kriegZu(w, kriegId);
  if (!k || !tischMoeglich(k)) return { ok: false, text: t("welle_k4.x.kein_tisch") };
  const name = land(k.land).name;
  const tisch = welches === "eigen" ? tischEntwurf(k) : welches === "gegen" ? k.tischAbgelehnt?.gegen : vermittlerPaket(w, k);
  if (!tisch) return { ok: false, text: t("welle_k4.x.kein_paket") };
  const preis = tischPreis(w, k, tisch);
  // Das eigene Gegenangebot nimmt der Gegner sicher an (wie ein Vorschlag der Gegenseite, sim/krieg.ts paketAussicht)
  if (welches === "gegen" || preis.annahme) return friedenMitTisch(w, k, tisch, welches === "vermittler" ? "paket_vermittler" : welches === "gegen" ? "paket_gegen" : "paket_tisch");
  const gegen = kuerzen(w, k, tisch, tischBudget(w, k).punkte);
  k.tischAbgelehnt = { tag: w.day, gegen };
  k.eskalation = clamp(k.eskalation + 2, 0, 100);
  const text = preis.gesperrt.length
    ? t("welle_k4.x.abgelehnt_sperre", { land: name })
    : t("welle_k4.x.abgelehnt", { land: name, zuviel: preis.punkte - preis.budget });
  const why = t("welle_k4.x.abgelehnt.warum", { land: name, punkte: tischPunkte(k, gegen) });
  addLog(w, "entscheidung", text, why);
  return { ok: false, text, why };
}
