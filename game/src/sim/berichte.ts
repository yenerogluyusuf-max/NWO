// Wirkungsberichte: Sechs und zwölf Monate nach einem Beschluss zeigt das Spiel, was sich getan hat. Ein Gesetz ist keine Wirkung;
// die Berichte machen sichtbar, ob es gewirkt hat, wo, und ob es Nebenwirkungen gab. Die Zahlen zeigen die Veränderung insgesamt,
// nicht nur die dieser einen Maßnahme: Im Politiknetz wirkt vieles zugleich.
//
// Was ein Bericht ehrlich sagen kann (und was nicht):
//   - Er vergleicht den Landesdurchschnitt der unmittelbaren Zielgrößen (die stärksten Kanten der Maßnahme) mit dem Stand beim Beschluss.
//   - Er sagt zu jeder Größe, in welche Richtung die Maßnahme sie bewegen SOLL (Richtung und Begründung der Kante) und wie lange die
//     Wirkung braucht (Verzögerung der Kante, Umsetzungsstand der Maßnahme). Was noch nicht wirken kann, ist „noch nicht fällig“,
//     nicht „keine Wirkung“.
//   - Er rechnet NICHT heraus, was ohne die Maßnahme geschehen wäre: Das Netz läuft nur vorwärts, der Stand beim Beschluss ist nicht
//     als ganze Welt gespeichert. Statt einer erfundenen Gegenrechnung nennt er die gleichzeitig wirkenden anderen Beschlüsse.
//   - Der Verlauf stammt aus echten Monatsstichproben (jeweils am Ersten, nach dem Netzschritt), nicht aus Interpolation.
//
// Alle Zusatzfelder sind optional: Spielstände aus der Zeit vor dem Umbau laden weiter und zeigen zwei Punkte statt einer Kurve.

import { NET } from "./modell";
import { PROVINCES, nationalAverage } from "./netz";
import { PROVINZEN } from "./regional";
import { HOCH_SCHLECHT } from "./personen";
import { restMonate, umsetzungsStand } from "./umsetzung";
import { addDays, dayOfMonth } from "./dates";
import { addLog } from "./log";
import { GRUPPEN } from "./gruppen";
import { aktuelleLocale, aktuelleSprache, t, zahl } from "../i18n";
import type { World } from "./types";

/** Monatliche Stichproben seit dem Beschluss; Index 0 ist der Tag des Beschlusses. */
export interface Verlaufsdaten {
  /** Spieltag je Stichprobe */
  tage: number[];
  /** Landesdurchschnitt je unmittelbarer Zielgröße */
  groessen: Record<string, number[]>;
  /** Zahl der Provinzen mit akutem Problem je verbundenem Problem */
  akut: Record<string, number[]>;
}

export interface Beobachtung {
  id: string;
  name: string;
  tag: number;
  von: number;
  auf: number;
  ort: number[] | null;
  /** Landesdurchschnitt der Zielgrößen zum Zeitpunkt des Beschlusses */
  werte: Record<string, number>;
  /** Anzahl der Provinzen mit akutem Problem zum Zeitpunkt des Beschlusses */
  akut: Record<string, number>;
  /** Welche Berichte schon erschienen sind (Monate) */
  berichtet: number[];
  /** Monatsstichproben für die Verlaufskurve (fehlt in älteren Spielständen) */
  verlauf?: Verlaufsdaten;
  /** Provinzwerte der Zielgrößen beim Beschluss, Index = Kfz-Kennziffer − 1, eine Nachkommastelle (fehlt in älteren Spielständen) */
  provinzwerte?: Record<string, number[]>;
  /** Kfz-Kennziffern der Provinzen, in denen ein Problem beim Beschluss akut war */
  akutOrte?: Record<string, number[]>;
}

/**
 * Wie sich eine Größe zur Erwartung der Maßnahme verhält. Zwei Fragen entscheiden: Bewegte sie sich so, wie das Politiknetz es für
 * diese Maßnahme annimmt? Und ist die Bewegung gut oder schlecht fürs Land?
 *   erwartet       wie modelliert, gut fürs Land (die Absicht der Maßnahme)
 *   nebenwirkung   wie modelliert, schlecht fürs Land (der Preis der Maßnahme)
 *   gegenlaeufig   entgegen dem Modell und schlecht fürs Land (die Wirkung kehrt sich um)
 *   unerwartet     entgegen dem Modell, aber gut fürs Land (andere Ursachen; kein Verdienst dieser Maßnahme)
 *   fremd          entgegen dem Modell und schlecht, aber ein anderer Beschluss erklärt die Bewegung über eine eigene Verbindung
 *   spaeter        noch nicht fällig: Umsetzung oder Verzögerung der Verbindung stehen noch aus
 *   ruhig          kaum bewegt
 */
export type Bewertung = "erwartet" | "nebenwirkung" | "gegenlaeufig" | "unerwartet" | "fremd" | "spaeter" | "ruhig";

export interface BerichtRegion {
  plaka: number;
  name: string;
  vorher: number;
  nachher: number;
  delta: number;
}

/** Eine Größe, an der der Bericht die Maßnahme misst. */
export interface BerichtGroesse {
  id: string;
  name: string;
  art: "groesse" | "problem";
  /** Wähler- und Interessengruppen: Der Wert ist die Stimmung der Gruppe gegenüber der Regierung, nicht ihre Größe oder Lage */
  stimmung?: true;
  /** Größe: Landesdurchschnitt 0–100; Problem: Zahl der Provinzen mit akutem Problem */
  vorher: number;
  nachher: number;
  delta: number;
  /** In welche Richtung die Maßnahme die Größe bewegen soll (nur bei unmittelbaren Zielgrößen) */
  erwartet?: "steigt" | "sinkt";
  /** Begründung der Verbindung aus dem Politiknetz */
  warum?: string;
  /** Verzögerung der Verbindung in Monaten */
  lag?: number;
  /** Andere Beschlüsse, deren Verbindung die Bewegung entgegen dem Modell dieser Maßnahme erklären kann */
  ursachen?: string[];
  bewertung: Bewertung;
  /** Gut fürs Land (true), schlecht (false), kaum bewegt (null) — unabhängig von der Erwartung */
  besser: boolean | null;
  /** Verlauf seit dem Beschluss (gleiche Länge wie `verlaufTage` des Berichts) */
  verlauf?: number[];
  /** Provinzen mit der stärksten Verbesserung und Verschlechterung (nur Größen) */
  regionen?: { besser: BerichtRegion[]; schlechter: BerichtRegion[] };
  /** Probleme: Provinzen, in denen das Problem nicht mehr akut ist, und solche, in denen es neu akut wurde */
  entschaerft?: { plaka: number; name: string }[];
  neuAkut?: { plaka: number; name: string }[];
}

export interface Bericht {
  tag: number;
  datum: string;
  massnahme: string;
  titel: string;
  monate: number;
  urteil: "gut" | "schwach" | "keine" | "gemischt";
  zeilen: string[];
  hinweis: string;
  // --- Ab hier optional: ältere Berichte haben diese Felder nicht ---
  /** Name der Maßnahme ohne Zusätze */
  name?: string;
  von?: number;
  auf?: number;
  ort?: number[] | null;
  beschlussTag?: number;
  beschlussDatum?: string;
  /** Feineres Urteil: „zu_frueh“ trennt „noch nicht wirksam“ von „wirkt nicht“ */
  phase?: "wirkt" | "gemischt" | "schwach" | "gegenlaeufig" | "zu_frueh";
  /** Ein bis zwei vollständige Sätze für Meldung und Umlauf */
  kurz?: string;
  /** Die Begründung des Urteils in Sätzen */
  begruendung?: string[];
  /** Umsetzungsstand der Maßnahme zum Berichtszeitpunkt */
  reife?: { stand: number; restMonate: number | null; geplantMonate: number | null };
  groessen?: BerichtGroesse[];
  /** Tage seit dem Beschluss für jeden Punkt der Verläufe */
  verlaufTage?: number[];
  /** Wirkte es überall gleich (einheitlich) oder gab es regionale Unterschiede (unterschiedlich)? Fehlt, wenn nichts bewegt wurde oder die Provinzwerte fehlen. */
  regional?: "einheitlich" | "unterschiedlich";
  /** Andere Beschlüsse, die auf dieselben Größen wirken */
  mitwirkend?: { massnahme: string; name: string; tag: number }[];
  /** Planwert des Beschlusses: Mehr- oder Minderbelastung des Haushalts in Prozent des BIP je Jahr */
  kosten?: { bipProJahr: number };
  /** Monate bis zur vollen Wirkung zum Berichtszeitpunkt (für die Übersetzung; fehlt in älteren Berichten) */
  rest?: number;
  /** Der Preis kam vor dem Nutzen (für die Übersetzung; fehlt in älteren Berichten) */
  preisVorNutzen?: true;
}

const REGEL = { schwelle: 8, berichteNachMonaten: [6, 12, 24] };
/** Ab dieser Veränderung (Indexpunkte) gilt eine Größe als bewegt; ab GEGEN zählt eine Bewegung gegen die Erwartung als Nebenwirkung. */
const BEWEGT = 0.8;
const GEGEN = 1.5;
/** Unterschied zwischen stärkster und schwächster Provinz (Indexpunkte), ab dem „wo“ überhaupt eine Aussage ist */
const REGION_SPANNE = 1;
/** Ab diesem Umsetzungsstand (Prozent) gilt der Bau als so gut wie fertig: Dann bremst nicht mehr er, sondern die Verzögerung der Wirkungswege */
const FAST_FERTIG = 95;

/** Größen, bei denen ein höherer Wert schlechter ist (zusätzlich zu den Problemen und den Größen aus dem Personenmodul). */
const EXTRA_SCHLECHT = new Set([
  "schattenwirtschaft", "informelle_arbeit", "jugendarbeitslosigkeit", "dollarisierung", "schulabbruch", "abwanderung", "wartezeiten",
  "gasabhaengigkeit", "energie_importrechnung", "energie_subventionslast", "strompreis", "duerre", "lebensmittelpreise", "landflucht",
]);

function schlechtBeiHoch(id: string): boolean {
  if (HOCH_SCHLECHT.has(id) || EXTRA_SCHLECHT.has(id)) return true;
  const i = NET.index.get(id);
  return i !== undefined && NET.nodes[i]!.kind === "problem";
}

interface ZielKante {
  id: string;
  erwartung: 1 | -1;
  lag: number;
  warum: string;
}

/** Die unmittelbaren Wirkungswege einer Maßnahme: ihre vier stärksten Verbindungen. */
function zielKanten(id: string): ZielKante[] {
  return NET.edges
    .filter((e) => e.from === id)
    .sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight))
    .slice(0, 4)
    .map((e) => ({ id: e.to, erwartung: (e.weight >= 0 ? 1 : -1) as 1 | -1, lag: e.lag, warum: e.why }));
}

/** Die Größen, an denen sich eine Maßnahme zuerst zeigt (ihre stärksten Verbindungen), ohne Eingänge; für Rückblicke auf Programmschritte. */
export function wirkungsZiele(id: string, n = 2): string[] {
  return zielKanten(id)
    .map((z) => z.id)
    .filter((x) => !NET.nodes[NET.index.get(x)!]!.input)
    .slice(0, n);
}

function problemeUm(id: string): string[] {
  const nah = new Set<string>();
  for (const e of NET.edges) if (e.from === id) nah.add(e.to);
  for (const e of NET.edges) if (nah.has(e.from)) nah.add(e.to);
  return [...nah].filter((n) => NET.nodes[NET.index.get(n)!]!.kind === "problem");
}

/** Kfz-Kennziffern der Provinzen, in denen das Problem akut ist (Wert ab der Schwelle). */
function akutPlakas(world: World, id: string): number[] {
  const node = NET.nodes[NET.index.get(id)!]!;
  const i = NET.index.get(id)!;
  const out: number[] = [];
  for (let p = 0; p < PROVINCES; p++) if (node.threshold && world.net.values[i * PROVINCES + p]! >= node.threshold) out.push(p + 1);
  return out;
}

const r1 = (x: number) => Math.round(x * 10) / 10;
const r2 = (x: number) => Math.round(x * 100) / 100;
const nf = (x: number) => x.toLocaleString(aktuelleLocale(), { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** Vorzeichenrichtige Veränderung mit einer Nachkommastelle; unter 0,05 ist es „unverändert“, nie „−0,0“. */
export function veraenderung(d: number): string {
  const r = Math.round(Math.abs(d) * 10) / 10;
  if (!Number.isFinite(r) || r === 0) return t("bericht.unveraendert");
  return `${d > 0 ? "+" : "−"}${nf(r)}`;
}

const monateWort = (n: number) => t("bericht.monate", { n });
/** „in etwa 42 Monaten“: Dativ nach Präpositionen */
const monateDativ = (n: number) => t("bericht.monateDativ", { n });

/** Beschlüsse anderer Maßnahmen im Zeitraum, in dem ihre Wirkung noch läuft (bis ein Jahr vor diesem Beschluss), jeweils der jüngste je Maßnahme. */
function andereBeschluesse(world: World, b: Beobachtung): Beobachtung[] {
  const out = new Map<string, Beobachtung>();
  for (const o of world.spiel?.beobachtungen ?? []) {
    if (o.id === b.id || o.tag > world.day || o.tag < b.tag - 360) continue;
    const alt = out.get(o.id);
    if (!alt || o.tag > alt.tag) out.set(o.id, o);
  }
  return [...out.values()].sort((x, y) => y.tag - x.tag);
}

/** Welche anderen Beschlüsse können eine Bewegung der Größe in dieser Richtung über eine eigene Verbindung erklären? */
function erklaerer(andere: Beobachtung[], zielId: string, d: number): string[] {
  const namen: string[] = [];
  for (const o of andere) {
    const richtung = o.auf > o.von ? 1 : -1;
    if (NET.edges.some((e) => e.from === o.id && e.to === zielId && Math.sign(e.weight) * richtung === Math.sign(d))) namen.push(o.name);
  }
  return namen;
}

/** Nach einem Beschluss festhalten, wie die Lage vorher war. */
export function beobachte(world: World, id: string, von: number, auf: number, ort: number[] | null): void {
  const spiel = world.spiel;
  if (!spiel || Math.abs(auf - von) < REGEL.schwelle) return;
  const node = NET.nodes[NET.index.get(id)!];
  if (!node || node.kind !== "massnahme") return;
  const werte: Record<string, number> = {};
  const provinzwerte: Record<string, number[]> = {};
  for (const z of zielKanten(id)) {
    const n = NET.nodes[NET.index.get(z.id)!]!;
    if (n.input) continue;
    werte[z.id] = nationalAverage(NET, world.net, z.id);
    const i = NET.index.get(z.id)!;
    provinzwerte[z.id] = world.net.values.slice(i * PROVINCES, (i + 1) * PROVINCES).map(r1);
  }
  const akut: Record<string, number> = {};
  const akutOrte: Record<string, number[]> = {};
  for (const p of problemeUm(id)) {
    akutOrte[p] = akutPlakas(world, p);
    akut[p] = akutOrte[p]!.length;
  }
  const verlauf: Verlaufsdaten = {
    tage: [world.day],
    groessen: Object.fromEntries(Object.entries(werte).map(([k, v]) => [k, [r2(v)]])),
    akut: Object.fromEntries(Object.entries(akut).map(([k, v]) => [k, [v]])),
  };
  (spiel.beobachtungen ??= []).push({ id, name: node.name, tag: world.day, von, auf, ort, werte, akut, berichtet: [], verlauf, provinzwerte, akutOrte });
  if (spiel.beobachtungen.length > 60) spiel.beobachtungen.shift();
}

/** Am Monatsersten (nach dem Netzschritt): eine Stichprobe der Zielgrößen für die Verlaufskurve. Rechnet nichts in der Welt um. */
function stichprobe(world: World, b: Beobachtung): void {
  const v = b.verlauf;
  if (!v || b.berichtet.includes(24)) return;
  if (world.day <= v.tage[v.tage.length - 1]!) return;
  v.tage.push(world.day);
  for (const id of Object.keys(v.groessen)) v.groessen[id]!.push(r2(nationalAverage(NET, world.net, id)));
  for (const id of Object.keys(v.akut)) v.akut[id]!.push(akutPlakas(world, id).length);
}

/** Verlauf einer Größe bis heute: echte Stichproben, am Ende der aktuelle Stand; ohne Stichproben nur Beschluss und heute. */
function reiheBis(world: World, b: Beobachtung, art: "groesse" | "problem", id: string, jetzt: number): { tage: number[]; werte: number[] } {
  const v = b.verlauf;
  const alt = art === "groesse" ? v?.groessen[id] : v?.akut[id];
  if (v && alt && alt.length === v.tage.length) {
    const tage = v.tage.map((t) => t - b.tag);
    const werte = [...alt];
    if (world.day > v.tage[v.tage.length - 1]!) {
      tage.push(world.day - b.tag);
      werte.push(r2(jetzt));
    }
    return { tage, werte };
  }
  const vorher = art === "groesse" ? (b.werte[id] ?? jetzt) : (b.akut[id] ?? jetzt);
  return { tage: [0, world.day - b.tag], werte: [r2(vorher), r2(jetzt)] };
}

function regionenFuer(world: World, b: Beobachtung, id: string): BerichtGroesse["regionen"] | undefined {
  const vor = b.provinzwerte?.[id];
  const i = NET.index.get(id);
  if (!vor || vor.length !== PROVINCES || i === undefined) return undefined;
  const vz = schlechtBeiHoch(id) ? -1 : 1;
  const alle: (BerichtRegion & { wert: number })[] = [];
  for (let p = 0; p < PROVINCES; p++) {
    const nach = world.net.values[i * PROVINCES + p]!;
    const d = nach - vor[p]!;
    if (!Number.isFinite(d)) continue;
    alle.push({ plaka: p + 1, name: PROVINZEN[p]?.name ?? `Provinz ${p + 1}`, vorher: r1(vor[p]!), nachher: r1(nach), delta: r1(d), wert: d * vz });
  }
  // Wirkt eine Maßnahme überall gleich, wäre jede Liste von „Spitzenreitern“ Zufall (Reihenfolge der Kennziffern)
  if (alle.length === 0 || Math.max(...alle.map((x) => x.delta)) - Math.min(...alle.map((x) => x.delta)) < REGION_SPANNE) return undefined;
  const ohne = (x: BerichtRegion & { wert: number }): BerichtRegion => ({ plaka: x.plaka, name: x.name, vorher: x.vorher, nachher: x.nachher, delta: x.delta });
  const besser = alle.filter((x) => x.wert >= BEWEGT).sort((a, c) => c.wert - a.wert || a.plaka - c.plaka).slice(0, 3).map(ohne);
  const schlechter = alle.filter((x) => x.wert <= -BEWEGT).sort((a, c) => a.wert - c.wert || a.plaka - c.plaka).slice(0, 3).map(ohne);
  return besser.length || schlechter.length ? { besser, schlechter } : undefined;
}

/** Ein Satzglied über eine Größe, grammatisch neutral (Namen wie „Beschäftigte“ oder „Reale Einkommen“ sind Mehrzahl). */
function satzUeber(g: BerichtGroesse): string {
  if (g.art === "problem") return t("bericht.satz.problem", { name: g.name, nachher: g.nachher, vorher: g.vorher });
  return t(g.stimmung ? "bericht.satz.stimmung" : "bericht.satz.groesse", { name: g.name, d: veraenderung(g.delta), jetzt: nf(g.nachher) });
}

function kurzfassung(phase: NonNullable<Bericht["phase"]>, groessen: BerichtGroesse[], reife: Bericht["reife"], maxLag: number, preisVorNutzen: boolean): string {
  const nachGroesse = (a: BerichtGroesse, c: BerichtGroesse) => Math.abs(c.delta) - Math.abs(a.delta);
  const mit = (...bew: Bewertung[]) => groessen.filter((g) => bew.includes(g.bewertung)).sort(nachGroesse);
  const gut = mit("erwartet");
  const schlecht = mit("nebenwirkung", "gegenlaeufig");
  switch (phase) {
    case "zu_frueh":
      if (preisVorNutzen && schlecht.length) return t("bericht.kurz.preisVorNutzen", { satz: satzUeber(schlecht[0]!) });
      if (reife && reife.stand < FAST_FERTIG)
        return reife.restMonate ? t("bericht.kurz.umsetzungRest", { stand: Math.round(reife.stand), rest: monateDativ(reife.restMonate) }) : t("bericht.kurz.umsetzung", { stand: Math.round(reife.stand) });
      return reife && reife.stand < 100 ? t("bericht.kurz.fast", { lag: monateDativ(maxLag) }) : t("bericht.kurz.umgesetzt", { lag: monateDativ(maxLag) });
    case "wirkt":
      return t("bericht.kurz.wirkt", { satz: satzUeber(gut[0]!) });
    case "gemischt":
      return t("bericht.kurz.gemischt", { gut: satzUeber(gut[0]!), schlecht: satzUeber(schlecht[0]!) });
    case "gegenlaeufig":
      return t("bericht.kurz.gegenlaeufig", { satz: satzUeber(schlecht[0]!) });
    case "schwach":
      return t("bericht.kurz.schwach");
  }
}

function zeileGroesse(name: string, vorher: number, jetzt: number, d: number): string {
  return Math.abs(d) < 0.05 ? t("bericht.zeile.unveraendert", { name, jetzt: nf(jetzt) }) : t("bericht.zeile.groesse", { name, vorher: nf(vorher), jetzt: nf(jetzt), d: veraenderung(d) });
}

function zeileProblem(name: string, vorher: number, jetzt: number): string {
  return t("bericht.zeile.problem", { name, vorher, jetzt });
}

function titelVon(name: string, ort: number[] | null | undefined, von: number, auf: number, monate: number): string {
  return ort ? t("bericht.titelOrt", { name, n: ort.length, von: Math.round(von), auf: Math.round(auf), monate }) : t("bericht.titel", { name, von: Math.round(von), auf: Math.round(auf), monate });
}

function hinweisVon(urteil: Bericht["urteil"], rb: number): string {
  return (rb > 0 ? t("bericht.hinweis.rest", { rest: monateWort(rb) }) + " " : "") + t(`bericht.urteil.${urteil}`) + " " + t("bericht.hinweis.insgesamt");
}

/** Die Begründung des Urteils, Satz für Satz */
function begruendungVon(phase: NonNullable<Bericht["phase"]>, groessen: BerichtGroesse[], reife: Bericht["reife"], mitwirkend: NonNullable<Bericht["mitwirkend"]>): string[] {
  const begruendung: string[] = [];
  if (reife && reife.stand < FAST_FERTIG)
    begruendung.push(reife.restMonate ? t("bericht.beg.umsetzungRest", { stand: reife.stand, rest: monateDativ(reife.restMonate) }) : t("bericht.beg.umsetzung", { stand: reife.stand }));
  const liste = (bew: Bewertung) => groessen.filter((g) => g.bewertung === bew);
  if (liste("erwartet").length) begruendung.push(t("bericht.beg.erwartet", { liste: liste("erwartet").map(satzUeber).join("; ") }));
  if (liste("nebenwirkung").length) begruendung.push(t("bericht.beg.preis", { liste: liste("nebenwirkung").map(satzUeber).join("; ") }));
  if (liste("gegenlaeufig").length) begruendung.push(t("bericht.beg.gegen", { liste: liste("gegenlaeufig").map(satzUeber).join("; ") }));
  if (liste("fremd").length) begruendung.push(t("bericht.beg.fremd", { liste: liste("fremd").map((g) => `${satzUeber(g)} (${(g.ursachen ?? []).join(", ")})`).join("; ") }));
  if (liste("unerwartet").length) begruendung.push(t("bericht.beg.unerwartet", { liste: liste("unerwartet").map(satzUeber).join("; ") }));
  const spaeter = liste("spaeter");
  if (spaeter.length) begruendung.push(t("bericht.beg.spaeter", { liste: spaeter.map((g) => t("bericht.beg.verzoegerung", { name: g.name, lag: monateWort(g.lag ?? 0) })).join(", ") }));
  if (phase === "schwach") begruendung.push(t("bericht.beg.schwach"));
  if (mitwirkend.length) begruendung.push(t("bericht.beg.mitwirkend", { liste: mitwirkend.map((m) => m.name).join(", ") }));
  return begruendung;
}

const knotenName = (id: string, sonst: string): string => {
  const i = NET.index.get(id);
  return i === undefined ? sonst : NET.nodes[i]!.name;
};

/**
 * Berichte liegen mit fertigen Sätzen im Spielstand. Beim Laden in Türkisch oder Englisch werden Titel, Zeilen, Hinweis, Kurzfassung und
 * Begründung aus den gespeicherten Zahlen neu gesetzt; Namen kommen aus dem (übersetzten) Politiknetz. Deutsch bleibt unverändert.
 */
export function lokalisiereBerichte(world: World): void {
  if (aktuelleSprache() === "de") return;
  for (const b of world.spiel?.berichte ?? []) {
    if (b.name === undefined || b.von === undefined || b.auf === undefined || !b.groessen) continue;
    const alterKurz = b.kurz ?? "";
    const alterHinweis = b.hinweis;
    b.name = knotenName(b.massnahme, b.name);
    for (const g of b.groessen) g.name = knotenName(g.id, g.name);
    for (const m of b.mitwirkend ?? []) m.name = knotenName(m.massnahme, m.name);
    b.titel = titelVon(b.name, b.ort, b.von, b.auf, b.monate);
    b.zeilen = b.groessen.filter((g) => g.art === "groesse" || g.delta !== 0).map((g) => (g.art === "problem" ? zeileProblem(g.name, g.vorher, g.nachher) : zeileGroesse(g.name, g.vorher, g.nachher, g.delta)));
    const rb = b.rest ?? Number(/(\d+)/.exec(alterHinweis.split(".")[0] ?? "")?.[1] ?? 0);
    b.hinweis = hinweisVon(b.urteil, /^(Die volle Wirkung|The full effect|Tam etki)/.test(alterHinweis) || b.rest !== undefined ? rb : 0);
    if (b.phase) {
      const maxLag = Math.max(0, ...zielKanten(b.massnahme).map((k) => k.lag));
      const preisVorNutzen = b.preisVorNutzen ?? /^(Preis vor Nutzen|Price before benefit|Fayda öncesi bedel)/.test(alterKurz);
      b.kurz = kurzfassung(b.phase, b.groessen, b.reife, maxLag, preisVorNutzen);
      b.begruendung = begruendungVon(b.phase, b.groessen, b.reife, b.mitwirkend ?? []);
    }
  }
}

function bericht(world: World, b: Beobachtung, monate: number): Bericht {
  const spiel = world.spiel!;
  const node = NET.nodes[NET.index.get(b.id)!]!;
  const richtung = b.auf > b.von ? 1 : -1;
  const neuer = (spiel.beobachtungen ?? []).some((o) => o.id === b.id && o.tag > b.tag);
  // Der Umsetzungsstand gilt für den letzten Beschluss zu dieser Maßnahme; bei einem späteren Beschluss sagt er über diesen nichts mehr
  const stand = neuer ? undefined : umsetzungsStand(world.net, b.id);
  const rest = neuer ? null : restMonate(world.net, b.id);
  // Abgerundet: Solange die Umsetzung läuft, steht sie nie auf „100 Prozent“
  const reife: Bericht["reife"] | undefined = stand === undefined ? undefined : { stand: Math.min(Math.floor(stand), 99), restMonate: rest, geplantMonate: node.months ?? null };
  const unvollstaendig = stand !== undefined && stand < 100;

  const andere = andereBeschluesse(world, b);
  const groessen: BerichtGroesse[] = [];
  const zeilen: string[] = [];
  /** Zählt für das Urteil: passt = Absicht erreicht, gegen = Preis oder Umkehr (spürbar schlecht fürs Land). D = unmittelbare Wirkungswege, P = verbundene Probleme. */
  let passtD = 0;
  let gegenD = 0;
  let passtP = 0;
  let gegenP = 0;
  /** Wirkungswege, die dem Land nützen sollen und noch nicht fällig sind */
  let absichtAussteht = 0;
  let maxLag = 0;
  let verlaufTage: number[] = [0, world.day - b.tag];

  for (const k of zielKanten(b.id)) {
    if (b.werte[k.id] === undefined) continue;
    const n = NET.nodes[NET.index.get(k.id)!]!;
    const vorher = b.werte[k.id]!;
    const jetzt = nationalAverage(NET, world.net, k.id);
    const d = jetzt - vorher;
    const erwartet = k.erwartung * richtung;
    const vz = schlechtBeiHoch(k.id) ? -1 : 1;
    const wieModelliert = d * erwartet > 0;
    const gutFuersLand = d * vz > 0;
    maxLag = Math.max(maxLag, k.lag);
    // Entgegen dem Modell dieser Maßnahme kann nur etwas anderes die Größe bewegt haben: Wer, zeigt ein Blick auf die anderen Beschlüsse
    const ursachen = Math.abs(d) >= BEWEGT && !wieModelliert ? erklaerer(andere, k.id, d) : [];
    let bewertung: Bewertung;
    if (monate <= k.lag) {
      bewertung = "spaeter";
      if (erwartet * vz > 0) absichtAussteht++;
    } else if (Math.abs(d) >= BEWEGT) {
      if (wieModelliert && gutFuersLand) {
        passtD++;
        bewertung = "erwartet";
      } else if (!gutFuersLand) {
        // Benannt wird jede spürbar schlechte Bewegung; fürs Urteil zählt sie erst ab GEGEN (kleine Preise sind Rauschen, kein Fehlschlag)
        const zaehlt = Math.abs(d) >= GEGEN;
        if (wieModelliert) {
          if (zaehlt) gegenD++;
          bewertung = "nebenwirkung";
        } else if (ursachen.length) bewertung = "fremd";
        else {
          if (zaehlt) gegenD++;
          bewertung = "gegenlaeufig";
        }
      } else bewertung = "unerwartet";
    } else {
      bewertung = unvollstaendig ? "spaeter" : "ruhig";
      if (bewertung === "spaeter" && erwartet * vz > 0) absichtAussteht++;
    }
    const reihe = reiheBis(world, b, "groesse", k.id, jetzt);
    verlaufTage = reihe.tage;
    const regionen = regionenFuer(world, b, k.id);
    groessen.push({
      id: k.id,
      name: n.name,
      art: "groesse",
      ...(n.kind === "gruppe" ? { stimmung: true as const } : {}),
      vorher: r1(vorher),
      nachher: r1(jetzt),
      delta: r2(d),
      erwartet: erwartet > 0 ? "steigt" : "sinkt",
      warum: k.warum,
      lag: k.lag,
      ...(ursachen.length ? { ursachen } : {}),
      bewertung,
      besser: Math.abs(d) >= BEWEGT ? gutFuersLand : null,
      verlauf: reihe.werte,
      ...(regionen ? { regionen } : {}),
    });
    zeilen.push(zeileGroesse(n.name, vorher, jetzt, d));
  }

  const probleme: BerichtGroesse[] = [];
  for (const [pid, vorher] of Object.entries(b.akut)) {
    const jetzt = akutPlakas(world, pid);
    if (jetzt.length === vorher && vorher === 0) continue;
    const n = NET.nodes[NET.index.get(pid)!]!;
    if (jetzt.length !== vorher) zeilen.push(zeileProblem(n.name, vorher, jetzt.length));
    if (jetzt.length < vorher) passtP++;
    else if (jetzt.length > vorher + 1) gegenP++;
    const reihe = reiheBis(world, b, "problem", pid, jetzt.length);
    const vorOrte = new Set(b.akutOrte?.[pid] ?? []);
    const jetztOrte = new Set(jetzt);
    const namen = (liste: number[]) => liste.slice(0, 5).map((p) => ({ plaka: p, name: PROVINZEN[p - 1]?.name ?? `Provinz ${p}` }));
    const entschaerft = b.akutOrte ? namen([...vorOrte].filter((p) => !jetztOrte.has(p)).sort((a, c) => a - c)) : [];
    const neuAkut = b.akutOrte ? namen([...jetztOrte].filter((p) => !vorOrte.has(p)).sort((a, c) => a - c)) : [];
    probleme.push({
      id: pid,
      name: n.name,
      art: "problem",
      vorher,
      nachher: jetzt.length,
      delta: jetzt.length - vorher,
      bewertung: jetzt.length < vorher ? "erwartet" : jetzt.length > vorher + 1 ? "gegenlaeufig" : "ruhig",
      besser: jetzt.length < vorher ? true : jetzt.length > vorher ? false : null,
      verlauf: reihe.werte,
      ...(entschaerft.length ? { entschaerft } : {}),
      ...(neuAkut.length ? { neuAkut } : {}),
    });
    if (reihe.tage.length > verlaufTage.length) verlaufTage = reihe.tage;
  }
  probleme.sort((a, c) => Math.abs(c.delta) - Math.abs(a.delta));
  // Probleme in der Nähe sind Umfeld, kein Beweis: Sie entscheiden das Urteil nur mit, wenn sich schon ein unmittelbarer Wirkungsweg bewegt hat.
  // Sonst würde ein Zufall zwei Verbindungen weiter (Wohnungsnot 8 auf 7) einen Bau, der noch nichts bewirken kann, zum „Wirkt“ machen.
  const direktBewegt = passtD + gegenD > 0;
  if (!direktBewegt) for (const g of probleme) if (g.bewertung === "erwartet" || g.bewertung === "gegenlaeufig") g.bewertung = "ruhig";
  const passt = passtD + (direktBewegt ? passtP : 0);
  const gegen = gegenD + (direktBewegt ? gegenP : 0);
  groessen.push(...probleme);

  // Der Preis kommt oft vor dem Nutzen (Stimmung und Kosten sofort, der Ertrag nach Monaten): Steht die beabsichtigte Wirkung noch aus, ist es „zu früh“, nicht „keine Wirkung“
  const preisVorNutzen = passt === 0 && gegen >= 1 && absichtAussteht > 0;
  const urteil: Bericht["urteil"] = preisVorNutzen ? "schwach" : passt >= 1 && gegen === 0 ? "gut" : passt >= 1 && gegen >= 1 ? "gemischt" : gegen >= 1 ? "keine" : "schwach";
  const nochNichtFaellig = groessen.some((g) => g.bewertung === "spaeter");
  const phase: NonNullable<Bericht["phase"]> =
    urteil === "gut" ? "wirkt" : urteil === "gemischt" ? "gemischt" : urteil === "keine" ? "gegenlaeufig" : unvollstaendig || nochNichtFaellig ? "zu_frueh" : "schwach";

  // Wer sonst noch auf dieselben Größen wirkt: ehrlicher als eine Gegenrechnung, die das Spiel nicht hat
  const ziele = new Set(groessen.filter((g) => g.art === "groesse").map((g) => g.id));
  const mitwirkend: NonNullable<Bericht["mitwirkend"]> = [];
  for (const o of andere) {
    if (NET.edges.some((e) => e.from === o.id && ziele.has(e.to))) mitwirkend.push({ massnahme: o.id, name: o.name, tag: o.tag });
    if (mitwirkend.length >= 3) break;
  }

  const rb = rest ?? (neuer ? Math.max(0, (node.months ?? 1) - monate) : 0);
  const begruendung = begruendungVon(phase, groessen, reife, mitwirkend);

  const kurz = kurzfassung(phase, groessen, reife, maxLag, preisVorNutzen);
  const bewegteGroessen = groessen.filter((g) => g.art === "groesse" && Math.abs(g.delta) >= BEWEGT);
  const regional: Bericht["regional"] | undefined =
    b.provinzwerte && bewegteGroessen.length ? (bewegteGroessen.some((g) => g.regionen) ? "unterschiedlich" : "einheitlich") : undefined;
  const anteil = b.ort ? b.ort.reduce((s, p) => s + (world.net.weights[p - 1] ?? 0), 0) : 1;
  const kosten = node.cost ? { bipProJahr: r2((anteil * (b.auf - b.von) * node.cost) / 100) } : undefined;

  return {
    tag: world.day,
    datum: world.date,
    massnahme: b.id,
    titel: titelVon(b.name, b.ort, b.von, b.auf, monate),
    monate,
    urteil,
    zeilen,
    hinweis: hinweisVon(urteil, rb),
    rest: rb,
    ...(preisVorNutzen ? { preisVorNutzen } : {}),
    name: b.name,
    von: b.von,
    auf: b.auf,
    ort: b.ort,
    beschlussTag: b.tag,
    beschlussDatum: addDays(world.date, b.tag - world.day),
    phase,
    kurz,
    begruendung,
    ...(reife ? { reife } : {}),
    groessen,
    verlaufTage,
    ...(regional ? { regional } : {}),
    ...(mitwirkend.length ? { mitwirkend } : {}),
    ...(kosten ? { kosten } : {}),
  };
}

/** Das Urteil als Schlusswort der Chronik. Die Marken „Es wirkt.“ usw. lesen andere Module (etwa die Zeitung) aus. */
function chronikMarke(r: Bericht): string {
  if (r.phase === "zu_frueh") return "";
  return r.urteil === "gut" ? " Es wirkt." : r.urteil === "schwach" ? " Bisher kaum Wirkung." : r.urteil === "gemischt" ? " Gemischte Bilanz." : " Keine Wirkung in die gewünschte Richtung.";
}

/** Täglich: Monatsstichproben ziehen und fällige Berichte schreiben (Gesetze: nach 6, 12 und 24 Monaten; dazu die Rückblicke). */
export function berichteTag(world: World): void {
  const spiel = world.spiel;
  if (!spiel) return;
  if (spiel.beobachtungen) {
    const monatsanfang = dayOfMonth(world.date) === 1;
    for (const b of spiel.beobachtungen) {
      if (monatsanfang) stichprobe(world, b);
      for (const m of REGEL.berichteNachMonaten) {
        if (b.berichtet.includes(m) || world.day - b.tag < m * 30) continue;
        b.berichtet.push(m);
        const r = bericht(world, b, m);
        (spiel.berichte ??= []).push(r);
        if (spiel.berichte.length > 80) spiel.berichte.shift();
        spiel.chronik.push({ tag: world.day, datum: world.date, titel: `Wirkungsbericht: ${b.name}`, ausgang: `${r.kurz}${chronikMarke(r)}` });
        addLog(world, "ereignis", `Wirkungsbericht: ${b.name}, ${m} Monate danach`, r.kurz);
        schlechtesUrteilMelden(world, r, b.id);
      }
    }
  }
  rueckblickTag(world);
}

// ---------------------------------------------------------------------------
// Rückblicke: Wirkungsberichte für Entscheidungen, die kein Gesetz sind
//
// Eine Antwort auf ein Ereignis, ein Programmschritt, ein Vertrag: Bisher bekam nur das Gesetz einen Bericht. Der Rückblick hält fest,
// wie die wichtigsten Größen standen, als entschieden wurde, und sagt nach 6, 12 und 24 Monaten, was davon geblieben ist. Er rechnet nichts
// heraus (kein „was ohne die Entscheidung gewesen wäre“) und gibt keine Erwartung vor: Er zeigt, wohin sich die Größen bewegt haben.
// Alle Schwellen sind Spielparameter.

/** Ein Rückblick auf eine Entscheidung (gespeichert in `spiel.rueckblicke`). */
export interface Rueckblick {
  id: string;
  art: "ereignis" | "programm" | "vertrag";
  name: string;
  tag: number;
  /** Landesmittel der beobachteten Größen beim Beschluss (Knoten-Kennung → Wert) */
  werte: Record<string, number>;
  berichtet: number[];
  /** Nur Markierung (schon vorhandene Schritte und Verträge beim ersten Zählen): bekommt nie einen Bericht */
  stumm?: true;
}

export const RUECKBLICK = {
  monate: [6, 12, 24] as const,
  /** Ab dieser Veränderung (Indexpunkte) gilt eine Größe als bewegt (wie BEWEGT bei den Gesetzen) */
  bewegt: BEWEGT,
  /** Eine Entscheidung wird nur beobachtet, wenn sich mindestens eine Größe um so viel bewegt hat */
  mindestBewegung: 1,
  /** Wie viele Größen ein Rückblick betrachtet (die am stärksten bewegten, dazu das Vertrauen in die Regierung) */
  hoechstGroessen: 4,
  /** Älteste Rückblicke fallen weg */
  maxGespeichert: 60,
  /** Ein B-Stopp wegen schlechten Urteils höchstens alle so viele Tage, damit Berichte nicht zur Flut werden */
  stoppAbstand: 30,
} as const;

/** Landesmittel aller Größen, Probleme und Gruppen (ohne Maßnahmen und Eingänge); Grundlage für „vorher“ und „nachher“ einer Entscheidung. */
export function momentaufnahme(world: World): Record<string, number> {
  const out: Record<string, number> = {};
  for (const n of NET.nodes) {
    if (n.input || n.kind === "massnahme") continue;
    out[n.id] = nationalAverage(NET, world.net, n.id);
  }
  return out;
}

/**
 * Legt einen Rückblick an. Mit `nach` (Stand direkt nach der Entscheidung) werden die am stärksten bewegten Größen beobachtet, mit `ids`
 * genau diese. Hat die Entscheidung nichts bewegt, entsteht kein Rückblick (Rückgabe false).
 */
export function rueckblickAnlegen(world: World, art: Rueckblick["art"], name: string, vor: Record<string, number>, nach?: Record<string, number>, ids?: string[], schluessel?: string): boolean {
  const spiel = world.spiel;
  if (!spiel) return false;
  let gewaehlt: string[] = ids ? ids.filter((id) => NET.index.has(id)) : [];
  if (!ids && nach) {
    gewaehlt = Object.keys(vor)
      .map((id) => ({ id, d: Math.abs((nach[id] ?? vor[id]!) - vor[id]!) }))
      .filter((x) => x.d >= RUECKBLICK.mindestBewegung)
      .sort((a, b) => b.d - a.d)
      .slice(0, RUECKBLICK.hoechstGroessen)
      .map((x) => x.id);
  }
  if (!gewaehlt.length) return false;
  if (!gewaehlt.includes("vertrauen_regierung")) gewaehlt.push("vertrauen_regierung");
  const werte: Record<string, number> = {};
  for (const id of gewaehlt) werte[id] = r2(vor[id] ?? nationalAverage(NET, world.net, id));
  (spiel.rueckblicke ??= []).push({ id: `${art}:${schluessel ?? `${name}:${world.day}`}`, art, name, tag: world.day, werte, berichtet: [] });
  // Die Obergrenze gilt für echte Rückblicke; Markierungen bleiben, sonst würden alte Schritte und Verträge später als neu erkannt
  while (spiel.rueckblicke.filter((r) => !r.stumm).length > RUECKBLICK.maxGespeichert) spiel.rueckblicke.splice(spiel.rueckblicke.findIndex((r) => !r.stumm), 1);
  return true;
}

/** Nur eine Markierung, dass es diesen Schritt oder Vertrag schon gibt (kein Bericht). */
export function rueckblickMarkieren(world: World, art: Rueckblick["art"], schluessel: string): void {
  (world.spiel!.rueckblicke ??= []).push({ id: `${art}:${schluessel}`, art, name: schluessel, tag: world.day, werte: {}, berichtet: [], stumm: true });
}

const gruppenIds = new Set(GRUPPEN.map((g) => g.id));
const fmtDelta = (d: number): string => {
  const r = Math.round(Math.abs(d) * 10) / 10;
  return r === 0 ? zahl(0, 1) : `${d > 0 ? "+" : "−"}${zahl(r, 1)}`;
};

/** Der Bericht zu einem Rückblick nach `monate` Monaten. */
function rueckblickBericht(world: World, r: Rueckblick, monate: number): Bericht {
  const groessen: BerichtGroesse[] = Object.entries(r.werte).map(([id, vorher]) => {
    const i = NET.index.get(id)!;
    const jetzt = nationalAverage(NET, world.net, id);
    const delta = jetzt - vorher;
    const bewegt = Math.abs(delta) >= RUECKBLICK.bewegt;
    const gut = schlechtBeiHoch(id) ? delta < 0 : delta > 0;
    return {
      id,
      name: NET.nodes[i]!.name,
      art: "groesse" as const,
      ...(gruppenIds.has(id) ? { stimmung: true as const } : {}),
      vorher: r1(vorher),
      nachher: r1(jetzt),
      delta: r1(delta),
      bewertung: !bewegt ? "ruhig" : gut ? "erwartet" : "nebenwirkung",
      besser: !bewegt ? null : gut,
    };
  });
  const besser = groessen.filter((g) => g.besser === true);
  const schlechter = groessen.filter((g) => g.besser === false);
  const staerkste = (l: BerichtGroesse[]) => [...l].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))[0];
  const urteil: Bericht["urteil"] = besser.length && !schlechter.length ? "gut" : schlechter.length && !besser.length ? "schwach" : besser.length && schlechter.length ? "gemischt" : "keine";
  const phase: NonNullable<Bericht["phase"]> = urteil === "gut" ? "wirkt" : urteil === "gemischt" ? "gemischt" : urteil === "schwach" ? "gegenlaeufig" : monate < 12 ? "zu_frueh" : "schwach";
  const b = staerkste(besser);
  const s = staerkste(schlechter);
  const kurz = t(`takt.bericht.kurz.${urteil}`, { name: r.name, monate, beste: b?.name ?? "", schlechteste: s?.name ?? "" });
  const begruendung: string[] = [];
  if (b) begruendung.push(t("takt.bericht.besser", { name: b.name, vorher: zahl(b.vorher, 1), nachher: zahl(b.nachher, 1) }));
  if (s) begruendung.push(t("takt.bericht.schlechter", { name: s.name, vorher: zahl(s.vorher, 1), nachher: zahl(s.nachher, 1) }));
  if (!b && !s) begruendung.push(t("takt.bericht.ruhig"));
  return {
    tag: world.day,
    datum: world.date,
    massnahme: `rueckblick:${r.id}`,
    titel: t("takt.bericht.titel", { name: r.name, monate }),
    monate,
    urteil,
    zeilen: groessen.map((g) => t("takt.bericht.zeile", { name: g.name, vorher: zahl(g.vorher, 1), nachher: zahl(g.nachher, 1), delta: fmtDelta(g.delta) })),
    hinweis: t("takt.bericht.hinweis"),
    name: r.name,
    beschlussTag: r.tag,
    beschlussDatum: addDays(world.date, r.tag - world.day),
    phase,
    kurz,
    begruendung,
    groessen,
  };
}

/** Bei schlechtem Urteil hält das Spiel an (Klasse B, ui/autostopp.ts): Wer eine Entscheidung getroffen hat, soll erfahren, dass sie nicht trägt. */
function schlechtesUrteilMelden(world: World, r: Bericht, quelle: string): void {
  const spiel = world.spiel;
  if (!spiel || r.phase === "zu_frueh") return;
  const schlecht = r.phase === "gegenlaeufig" || (r.urteil === "schwach" && r.monate >= 12);
  if (!schlecht) return;
  if (world.day - (spiel.zuletzt.berichtStopp ?? -1e9) < RUECKBLICK.stoppAbstand) return;
  spiel.zuletzt.berichtStopp = world.day;
  spiel.hinweise.push({
    id: `bericht-schlecht-${quelle}-${world.day}`,
    titel: t("takt.bericht.stopp.titel", { name: r.name ?? r.titel, monate: r.monate }),
    szene: "parlament",
    text: [r.kurz ?? r.titel, ...(r.begruendung?.slice(0, 2) ?? [])],
  });
}

/** Täglich: fällige Rückblicke schreiben (6, 12 und 24 Monate nach der Entscheidung). */
function rueckblickTag(world: World): void {
  const spiel = world.spiel;
  if (!spiel?.rueckblicke?.length) return;
  for (const r of spiel.rueckblicke) {
    if (r.stumm) continue;
    for (const m of RUECKBLICK.monate) {
      if (r.berichtet.includes(m) || world.day - r.tag < m * 30) continue;
      r.berichtet.push(m);
      const b = rueckblickBericht(world, r, m);
      (spiel.berichte ??= []).push(b);
      if (spiel.berichte.length > 80) spiel.berichte.shift();
      // Berichte ohne erkennbare Bewegung stehen in der Berichtsakte, füllen aber weder Chronik noch Umlauf; nach einem ruhigen Zwölfmonatsbericht entfällt der nächste
      if (b.urteil === "keine") {
        if (m === 12 && !r.berichtet.includes(24)) r.berichtet.push(24);
        continue;
      }
      spiel.chronik.push({ tag: world.day, datum: world.date, titel: t("takt.bericht.chronik", { name: r.name }), ausgang: b.kurz ?? b.titel });
      addLog(world, "ereignis", t("takt.bericht.log", { name: r.name, monate: m }), b.kurz);
      schlechtesUrteilMelden(world, b, r.id);
    }
  }
}
