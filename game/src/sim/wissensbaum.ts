// Der Wissensbaum: Sicht und Entscheidungen (Konzept FOKUS_FORSCHUNG_KRIEG_KONZEPT_2026-10-05.md, Leitsatz „Realismus verpackt in ein Spiel“).
//
// Die Knoten sind Vorhaben des Reiches; der Baum ordnet sie in Zweige und Spalten, sagt in einem Satz, warum ein Knoten gesperrt ist,
// und bietet drei Entscheidungen, die etwas kosten:
//   1. Schwerpunkt: Ein Zweig forscht schneller, die anderen etwas langsamer (Kapital, Sperrfrist).
//   2. Selbst forschen oder Lizenz kaufen: Lizenz ist schneller, kostet Kapital und Gebühren, macht abhängig; der Rivale des Lizenzgebers
//      nimmt es übel, und sperrt der Lizenzgeber (Krieg, Sanktion, Zerwürfnis), stocken Bau und Werk.
//   3. Werk staatlich, mit heimischer Firma oder mit ausländischem Partner: weniger Schulden gegen Abhängigkeit oder weniger eigenes Wissen.
// Das Tempo jedes Knotens hängt an Forschungsetat, Innovationsgrenze (Bildung über Jahre) und Abwanderung (sim/wissensbaum-kern.ts).
// Fertige Werke stellen Güter her (sim/gueter.ts), heben die heimische Generation der Streitkräfte und beschleunigen ihre Fertigung.

import { BAUM, HEUREKA, HEUREKA_VON, RIVALEN, STANDORT, WERK_VON, ZWEIGE, ZWEIG_VON, type Lizenzgeber, type Traeger, type ZweigId } from "../data/wissensbaum";
import type { GattungId } from "../data/streitkraefte";
import type { Voraussetzung } from "./reich-typen";
import { bauKapazitaet, bauPool, bauplan, beginne, groessenWert, inVergabePhase, laufBau, laufMonate, monatsBauleistung, reichZustand, ruestungsKapazitaet, vergabeAngebot, verwaltungBilanz, vorhabenDef, vorhabenSicht, vorschauFuer, warteschlange } from "./reich";
import { baumZustand, forschungsTempo, landesTempo, lizenzgeber, partnerGesperrt, setzeSperrQuelle, standortVon, tempoTeile, werkErtrag, werkZusatz, type TempoTeile } from "./wissensbaum-kern";
import { auslastung } from "./infrastruktur";
import { PROVINZEN } from "./regional";
import { aussenZustand } from "./diplomatie";
import { SANKTION_GEZIELT } from "./sanktion-art";
import { aktiveKriege } from "./krieg";
import { forschungsSicht, WISSEN, bildungsUeberhang } from "./wissensbasis";
import { NET } from "./modell";
import { nationalAverage } from "./netz";
import { dimensionZu } from "./laender";
import { forschungsBudget } from "./haushalt";
import { setzeGueterQuelle, streitkraefte } from "./streitkraefte";
import { beziehungAendern, beziehungZurTuerkei } from "./welt-modell";
import { kannZahlen } from "./kapital";
import { wirke } from "./wirkung";
import { addLog } from "./log";
import { zeitungEreignis } from "./zeitung";
import { momentaufnahme, rueckblickAnlegen } from "./berichte";
import { t } from "../i18n";
import { stufenName } from "../data/skalen";
import type { World } from "./types";

export type KnotenZustand = "fertig" | "laeuft" | "moeglich" | "gesperrt";

export interface KnotenSicht {
  id: string;
  zweig: ZweigId;
  /** Spalte im Baum: Länge der längsten Kette von Voraussetzungen im Baum */
  spalte: number;
  zustand: KnotenZustand;
  /** 0 bis 1 */
  fortschritt: number;
  restMonate?: number;
  pausiert?: boolean;
  /** Kapital und geplante Monate beim Beginn (transparente Ausschreibung) */
  pk: number;
  monate: number;
  /**
   * Welle E2: Monate bis fertig bei heutigem Tempo (Forschungsetat, Bildung, Fokus, Heureka), hinten in der Reihe der Baustelle, mit der
   * Vergabephase; fehlt sie, ist der Termin offen (die Reihe wird in 20 Jahren nicht frei). Vorher stand die geplante Bauzeit da: „etwa 42 Monate“
   * für den Chip-Entwurf, gemessen bei Tempo 2,6 waren es etwa 23.
   */
  monateEcht?: number;
  /** Ein Satz, warum der Knoten gesperrt ist (leer, wenn möglich) */
  grund?: string;
  /** Die Art des ersten Hindernisses, für den Hinweis „Bildung erhöhen“ */
  hindernis?: "bildung" | "foerderung" | "vorgaenger" | "partner" | "knoten" | "kapital" | "verwaltung" | "sonst";
  /** Fehlen noch Hochschulen, Fachkräfte oder Bildungsqualität? */
  brauchtBildung: boolean;
  /** Alle Voraussetzungen als Zeilen, mit Sprungziel für die Ansicht */
  voraus: { text: string; erfuellt: boolean; sprung?: Sprung }[];
  /** Sprungziel des ersten Hindernisses (für den klickbaren Hinweis auf der Karte) */
  sprung?: Sprung;
  /** Vorgänger im Baum (für Verbindungen) */
  vorgaenger: string[];
  lizenzgeber: Lizenzgeber[];
  lizenz?: Lizenzgeber;
  traeger?: { art: Traeger; partner?: Lizenzgeber };
  werk: boolean;
  /** Standort des Werks (gewählt oder aus den Daten), Kfz-Kennziffer */
  standort?: number;
  /** Heureka: Bedingung in einem Satz, ob sie erfüllt ist und ob der Moment schon ausgelöst wurde */
  heureka?: { text: string; erfuellt: boolean; ausgeloest: boolean; frisch: boolean };
  tempo?: TempoTeile;
  /** Frischer Durchbruch: Stempel in der Ansicht */
  durchbruch: boolean;
  /** Wunder: riesig und ungewiss */
  wunder: boolean;
  /** Ungewisser Durchbruch (kann scheitern) */
  ungewiss: boolean;
}

/**
 * Wohin eine fehlende Voraussetzung führt: zu einem anderen Knoten im Baum, zu einer Maßnahme im Politiknetz (mit Zielstufe),
 * zum Bildungsetat im Haushalt, zu einer Größe im Netz, zur Außenlage, oder nur ein Hinweis (Kapital, Verwaltung).
 */
export type Sprung =
  | { art: "knoten"; id: string }
  | { art: "vorhaben"; id: string }
  | { art: "massnahme"; id: string; ziel: number }
  | { art: "bildung"; id: string }
  | { art: "netz"; id: string }
  | { art: "land"; land: string }
  | { art: "kapital"; pk: number }
  | { art: "verwaltung" };

function sprungVon(v: Voraussetzung, jetzt: number | undefined): Sprung | undefined {
  switch (v.art) {
    case "bestand":
      return ZWEIG_VON[v.id] ? { art: "knoten", id: v.id } : { art: "vorhaben", id: v.id };
    case "massnahme":
      return { art: "massnahme", id: v.id, ziel: v.min ?? v.max ?? Math.round(jetzt ?? 0) };
    case "knoten":
      return BILDUNG.has(v.id) ? { art: "bildung", id: v.id } : { art: "netz", id: v.id };
    case "land":
      return { art: "land", land: v.land };
    default:
      return undefined;
  }
}

export interface ZweigSicht {
  id: ZweigId;
  knoten: KnotenSicht[];
  fertig: number;
  schwerpunkt: boolean;
}

export interface BaumSicht {
  zweige: ZweigSicht[];
  /** Forschungstempo des Landes (ohne Zweig und Lizenz) */
  tempo: { forschung: number; abwanderung: number; gesamt: number };
  /** Forschungsetat gegen Innovationsgrenze, in % des BIP */
  etat: { budget: number; grenze: number; verpufft: number };
  abwanderung: boolean;
  /** Wie viele mögliche oder gesperrte Knoten auf mehr Ingenieure (Hochschulen, Fachkräfte) warten */
  wartenAufBildung: number;
  schwerpunkt: ZweigId | null;
  /** Tage, bis der Schwerpunkt wieder gewechselt werden kann (0 = jetzt) */
  schwerpunktSperre: number;
  /** Ein Satz zur Lage */
  satz: string;
  /**
   * Welle E2: Was die Forschung aufhält, je Ursache eine Zeile mit Sprung (Verwaltung, Förderung, Bildung, Kapital, Partner).
   * Gezählt werden Knoten, deren Vorstufen stehen: Sie wären ohne dieses Hindernis startbar oder sind es von der Sache her schon.
   */
  sperren: SperrGruppe[];
}

export interface SperrGruppe {
  art: NonNullable<KnotenSicht["hindernis"]>;
  /** Wie viele Knoten an diesem Hindernis warten */
  n: number;
  /** Ein Satz mit Zahlen: was fehlt und was es bindet */
  text: string;
  sprung?: Sprung;
  /** Der Knoten, für den der Satz gilt (Rückweg nach dem Sprung) */
  knoten: string;
}

/** Verwaltungskraft, die im Vorrat liegen muss, bevor ein Vorhaben beginnt: das Dreifache des Monatsbedarfs (sim/reich.ts, `vorhabenSicht`). */
export const verwaltungsBedarf = (jeMonat: number): number => Math.round(jeMonat * 3 * 10) / 10;

/**
 * Wer die Verwaltung bindet: laufende Vorhaben mit Verwaltungsbedarf, davon die ohne Fortschritt in diesem Monat (sie warten auf Baukapazität,
 * ziehen aber Verwaltungskraft). Im Spielstand des Inhabers (2043) waren es 16 Vorhaben, 9 ohne Fortschritt, darunter 13 Restaurierungen von 2036.
 */
export interface VerwaltungsLage {
  vorrat: number;
  netto: number;
  /** Verwaltungskraft je Monat aller laufenden, nicht ruhenden Vorhaben */
  bau: number;
  laufend: number;
  /** Vorhaben ohne Fortschritt in diesem Monat, die trotzdem Verwaltungskraft ziehen */
  ohne: { id: string; verwaltung: number }[];
  /** Verwaltungskraft je Monat, die frei würde, wenn diese ruhen */
  frei: number;
}

export function verwaltungsLage(w: World): VerwaltungsLage {
  const z = reichZustand(w);
  const vb = verwaltungBilanz(w);
  const plan = bauplan(w);
  let laufend = 0;
  const ohne: VerwaltungsLage["ohne"] = [];
  for (const l of z.laufend) {
    const bedarf = vorhabenDef(l.id)?.kosten.verwaltung ?? 0;
    if (l.pausiert || bedarf <= 0) continue;
    laufend++;
    if ((plan[l.id] ?? 0) <= 0 && !(l.vergabeBis !== undefined && w.day < l.vergabeBis)) ohne.push({ id: l.id, verwaltung: bedarf });
  }
  const r1 = (x: number) => Math.round(x * 10) / 10;
  return { vorrat: r1(z.verwaltung), netto: r1(vb.netto), bau: r1(vb.bau), laufend, ohne, frei: r1(ohne.reduce((a, b) => a + b.verwaltung, 0)) };
}

/** So weit rechnet die Schätzung voraus (Monate); was dann nicht fertig ist, hat keinen Termin. */
const HORIZONT = 240;

let freiGemerkt: { schluessel: string; frei: { land: number[]; ruestung: number[] }; verzug: number } | null = null;

/**
 * Was jeder Engpass in den kommenden Monaten frei hat, nachdem die laufenden Vorhaben in ihrer Reihenfolge bedient sind: dieselbe Rechnung wie
 * die Schätzung der Baustelle (sim/reich.ts, `warteschlange`). Ein neues Vorhaben reiht sich hinten ein und bekommt nur, was übrig bleibt.
 */
function freieKapazitaet(w: World): { frei: { land: number[]; ruestung: number[] }; verzug: number } {
  const z = reichZustand(w);
  const cap = { land: bauKapazitaet(w), ruestung: ruestungsKapazitaet(w) };
  const schluessel = `${w.seed}|${w.day}|${z.verwaltung}|${cap.land}|${cap.ruestung}|${z.laufend.map((l) => `${l.id}:${l.fortschritt}:${l.pausiert ? 1 : 0}:${l.vergabeBis ?? ""}`).join(",")}|${JSON.stringify(w.spiel?.wissensbaum?.lizenzen ?? {})}`;
  if (freiGemerkt?.schluessel === schluessel) return freiGemerkt;
  const verzug = z.verwaltung <= 0 ? 0.5 : 1;
  const rest = new Map<string, number>();
  for (const l of z.laufend) {
    const v = vorhabenDef(l.id);
    if (v) rest.set(l.id, Math.max(0, laufBau(l, v) - l.fortschritt));
  }
  const frei = { land: [] as number[], ruestung: [] as number[] };
  for (let m = 1; m <= HORIZONT; m++) {
    const f = { ...cap };
    for (const l of z.laufend) {
      const v = vorhabenDef(l.id);
      const r = rest.get(l.id) ?? 0;
      if (!v || l.pausiert || r <= 0) continue;
      if (inVergabePhase(w, l) && Math.ceil((l.vergabeBis! - w.day) / 30) >= m) continue;
      const pool = bauPool(v);
      if (pool === "ohne") continue;
      const aufnahme = monatsBauleistung((laufBau(l, v) / Math.max(1, laufMonate(l, v))) * forschungsTempo(w, l.id), f[pool], r, verzug);
      rest.set(l.id, r - aufnahme <= 1e-6 ? 0 : r - aufnahme);
      f[pool] -= aufnahme / verzug;
    }
    frei.land.push(f.land);
    frei.ruestung.push(f.ruestung);
  }
  freiGemerkt = { schluessel, frei, verzug };
  return freiGemerkt;
}

/**
 * Monate bis fertig, wenn das Vorhaben heute beginnt: hinten in der Reihe der Baustelle, bei heutigem Tempo und heutiger Kapazität, mit der
 * Vergabephase der Ausschreibung. Dieselbe Rechnung wie die Monatsleistung in sim/reich.ts (Bau je Monat mal Forschungstempo, begrenzt durch
 * das, was der Engpass nach den laufenden Vorhaben frei hat). Künftige Änderungen von Etat und Kapazität sind nicht vorweggenommen.
 * Mit `lizenz` gilt das Tempo der Lizenz. `undefined`: in 20 Jahren nicht fertig.
 */
export function dauerEcht(w: World, id: string, lizenz = false): number | undefined {
  const v = vorhabenDef(id);
  if (!v) return undefined;
  const a = vergabeAngebot(v, "ausschreibung");
  const tempo = (tempoTeile(w, id)?.gesamt ?? 1) * (lizenz ? BAUM.lizenzTempo : 1);
  const rate = (a.bau / Math.max(1, a.monate)) * tempo;
  const pool = bauPool(v);
  if (pool === "ohne") return a.vorlauf + Math.max(1, Math.ceil(a.bau / Math.max(0.1, rate)));
  const { frei, verzug } = freieKapazitaet(w);
  // Wer Verwaltungskraft braucht, beginnt erst mit vollem Vorrat (das Dreifache des Bedarfs); dann bremst kein Verzug. Was der Engpass frei hat,
  // hängt nicht am Verzug: Er zieht die volle Leistung der Vorhaben davor ab (sim/reich.ts, `bauplan`)
  const eigenerVerzug = (v.kosten.verwaltung ?? 0) > 0 ? 1 : verzug;
  let rest = a.bau;
  for (let m = 1; m <= HORIZONT; m++) {
    if (m <= a.vorlauf) continue;
    rest -= monatsBauleistung(rate, frei[pool][m - 1]!, rest, eigenerVerzug);
    if (rest <= 1e-6) return m;
  }
  return undefined;
}

const BILDUNG = new Set(["hochschule", "fachkraefte", "bildungsqualitaet"]);

/** Name einer Größe oder eines Vorhabens aus dem Katalog des Wissensbaums (sonst die Kennung). */
export const groesseName = (id: string): string => t(`wissen.g.${id}`);
export const knotenName = (id: string): string => t(`wissen.n.${id}.name`);

/** Eine gerundete Gleichheit darf eine noch nicht erreichte Grenze nicht als erfüllt erscheinen lassen. */
/** Stand einer Maßnahme in ihrer echten Einheit (N9, Befund B-1); „knapp unter …“ bleibt, nur mit der Einheit */
function massnahmeStand(v: Extract<Voraussetzung, { art: "massnahme" }>, j: number | string): string {
  if (typeof j === "number") {
    // Welle E2: Benannte Zustände fassen Stufen zusammen; liegt der Stand unter der Grenze im selben Zustand, hieß es vorher
    // „Das erste Kraftwerk, nötig Das erste Kraftwerk“. Dann steht „knapp unter …“ da.
    const grenze = v.min ?? v.max;
    if (grenze !== undefined && j !== grenze && stufenName(v.id, j) === stufenName(v.id, grenze)) return t(j < grenze ? "balance.knappUnter" : "balance.knappUeber", { wert: stufenName(v.id, grenze) });
    return stufenName(v.id, j);
  }
  const grenze = "min" in v && v.min !== undefined ? v.min : "max" in v && v.max !== undefined ? v.max : 0;
  return t(j === t("balance.knappUnter", { wert: grenze }) ? "balance.knappUnter" : "balance.knappUeber", { wert: stufenName(v.id, grenze) });
}

function vorausAnzeige(v: Voraussetzung, jetzt: number | undefined): number | string {
  if (jetzt === undefined) return 0;
  const rund = Math.round(jetzt);
  if ("min" in v && v.min !== undefined && jetzt < v.min && rund >= v.min) return t("balance.knappUnter", { wert: v.min });
  if ("max" in v && v.max !== undefined && jetzt > v.max && rund <= v.max) return t("balance.knappUeber", { wert: v.max });
  return rund;
}

function grundZeile(v: Voraussetzung, jetzt: number | undefined): { text: string; art: NonNullable<KnotenSicht["hindernis"]> } {
  const j = vorausAnzeige(v, jetzt);
  switch (v.art) {
    case "bestand":
      return { text: t("wissen.grund.vorgaenger", { name: ZWEIG_VON[v.id] ? knotenName(v.id) : groesseName(v.id) }), art: "vorgaenger" };
    case "knoten":
      if (BILDUNG.has(v.id)) return { text: t("wissen.grund.bildung", { was: groesseName(v.id), jetzt: j, ziel: v.min ?? 0 }), art: "bildung" };
      return { text: t("wissen.grund.knoten", { was: groesseName(v.id), jetzt: j, ziel: v.min ?? v.max ?? 0 }), art: "knoten" };
    case "massnahme":
      if (v.id === "m_forschung") return { text: t("n9.wissen.foerderung", { jetzt: massnahmeStand(v, j), ziel: stufenName(v.id, v.min ?? 0) }), art: "foerderung" };
      return { text: t("n9.wissen.grund", { was: groesseName(v.id), jetzt: massnahmeStand(v, j), ziel: stufenName(v.id, v.min ?? v.max ?? 0) }), art: "knoten" };
    case "land":
      return { text: t("wissen.grund.partner", { land: t(`wissen.partner.${v.land}`), jetzt: j, ziel: v.min ?? 0 }), art: "partner" };
    case "jahr":
      return { text: t("wissen.grund.jahr", { jahr: v.min }), art: "sonst" };
    default:
      return { text: t("wissen.grund.sonst"), art: "sonst" };
  }
}

/** Kurze Zeile für die Liste der Voraussetzungen (ohne Ratschlag). */
function vorausZeile(v: Voraussetzung, jetzt: number | undefined): string {
  const j = vorausAnzeige(v, jetzt);
  switch (v.art) {
    case "bestand":
      return t("wissen.v.bestand", { name: ZWEIG_VON[v.id] ? knotenName(v.id) : groesseName(v.id) });
    case "knoten":
      return t("wissen.v.knoten", { was: groesseName(v.id), jetzt: j, ziel: v.min ?? v.max ?? 0 });
    case "massnahme":
      return t("n9.wissen.v", { was: groesseName(v.id), jetzt: massnahmeStand(v, j), ziel: stufenName(v.id, v.min ?? v.max ?? 0) });
    case "land":
      return t("wissen.v.partner", { land: t(`wissen.partner.${v.land}`), jetzt: j, ziel: v.min ?? 0 });
    default:
      return grundZeile(v, jetzt).text;
  }
}

function jetztWert(w: World, v: Voraussetzung): number | undefined {
  if (v.art === "knoten" || v.art === "massnahme") return NET.index.has(v.id) ? nationalAverage(NET, w.net, v.id) : undefined;
  if (v.art === "land") return dimensionZu(w, v.land, v.dim);
  return undefined;
}

const spaltenCache = new Map<string, number>();
/** Spalte eines Knotens: 0 ohne Vorgänger im Baum, sonst eins mehr als der späteste Vorgänger. */
export function spalteVon(id: string, voraus: (id: string) => Voraussetzung[], tiefe = 0): number {
  const c = spaltenCache.get(id);
  if (c !== undefined) return c;
  if (tiefe > 20) return 0;
  const vor = voraus(id).filter((x): x is { art: "bestand"; id: string } => x.art === "bestand" && !!ZWEIG_VON[x.id]).map((x) => x.id);
  const s = vor.length ? 1 + Math.max(...vor.map((v) => spalteVon(v, voraus, tiefe + 1))) : 0;
  spaltenCache.set(id, s);
  return s;
}

/** Sicht auf einen Knoten. */
export function knotenSicht(w: World, id: string): KnotenSicht | null {
  const s = vorhabenSicht(w, id);
  const zweig = ZWEIG_VON[id];
  if (!s || !zweig) return null;
  const z = baumZustand(w);
  const v = s.v;
  const angebot = vergabeAngebot(v, "ausschreibung");
  const voraus = v.voraus.map((x) => {
    const st = s.voraus.find((y) => y.voraus === x);
    const j = jetztWert(w, x);
    const sp = sprungVon(x, j);
    return { text: vorausZeile(x, j), erfuellt: st?.erfuellt ?? false, ...(sp ? { sprung: sp } : {}) };
  });
  let sprung: Sprung | undefined;
  const zustand: KnotenZustand = s.status === "fertig" ? "fertig" : s.status === "im_bau" || s.status === "pausiert" ? "laeuft" : s.bereit && s.status === "verfuegbar" ? "moeglich" : "gesperrt";
  let grund: string | undefined;
  let hindernis: KnotenSicht["hindernis"];
  if (zustand === "gesperrt") {
    const erstes = v.voraus.find((x) => !s.voraus.find((y) => y.voraus === x)?.erfuellt);
    if (erstes) {
      const g = grundZeile(erstes, jetztWert(w, erstes));
      grund = g.text;
      hindernis = g.art;
      sprung = sprungVon(erstes, jetztWert(w, erstes));
    } else {
      grund = t("wissen.grund.sonst");
      hindernis = "sonst";
    }
  } else if (zustand === "moeglich") {
    if (!kannZahlen(w.spiel!.kapital, angebot.pk)) {
      grund = t("wissen.grund.kapital", { pk: angebot.pk });
      hindernis = "kapital";
      sprung = { art: "kapital", pk: angebot.pk };
    } else if (!s.verwaltungOk) {
      // Welle E2: Die Zeile nennt Vorrat und Bedarf (vorher nur „ausgelastet“; den Grund sah man erst im vierten Klick)
      grund = t("welle_e2.grund.verwaltung", { vorrat: Math.floor(reichZustand(w).verwaltung), bedarf: verwaltungsBedarf(v.kosten.verwaltung ?? 0) });
      hindernis = "verwaltung";
      sprung = { art: "verwaltung" };
    }
  }
  const frisch = z.durchbrueche.find((d) => d.id === id && w.day - d.tag <= BAUM.durchbruchTage);
  return {
    id,
    zweig,
    spalte: spalteVon(id, (x) => vorhabenSicht(w, x)?.v.voraus ?? []),
    zustand,
    fortschritt: s.fortschritt,
    ...(s.status === "pausiert" ? { pausiert: true } : {}),
    ...(s.restMonate !== undefined ? { restMonate: s.restMonate } : {}),
    pk: angebot.pk,
    monate: angebot.monate,
    ...((): { monateEcht?: number } => {
      const m = s.status === "fertig" ? 0 : s.status === "im_bau" || s.status === "pausiert" ? s.restMonate : dauerEcht(w, id);
      return m === undefined ? {} : { monateEcht: m };
    })(),
    ...(grund ? { grund } : {}),
    ...(hindernis ? { hindernis } : {}),
    ...(sprung ? { sprung } : {}),
    voraus,
    // Wartet auf Bildung: Die Vorgänger stehen, aber Hochschulen, Fachkräfte oder Bildungsqualität reichen nicht
    brauchtBildung:
      zustand === "gesperrt" &&
      v.voraus.every((x) => x.art !== "bestand" || !!s.voraus.find((y) => y.voraus === x)?.erfuellt) &&
      v.voraus.some((x) => x.art === "knoten" && BILDUNG.has(x.id) && !s.voraus.find((y) => y.voraus === x)?.erfuellt),
    vorgaenger: v.voraus.filter((x): x is { art: "bestand"; id: string } => x.art === "bestand" && !!ZWEIG_VON[x.id]).map((x) => x.id),
    lizenzgeber: lizenzgeber(id),
    ...(z.lizenzen[id] ? { lizenz: z.lizenzen[id] } : {}),
    ...(z.traeger[id] ? { traeger: z.traeger[id] } : {}),
    werk: !!WERK_VON[id],
    ...(WERK_VON[id] ? { standort: standortVon(w, id)! } : {}),
    ...(HEUREKA_VON[id] ? { heureka: heurekaSicht(w, id) } : {}),
    ...(zustand === "laeuft" ? { tempo: tempoTeile(w, id)! } : {}),
    durchbruch: !!frisch,
    wunder: v.klasse === "wunder",
    ungewiss: !!v.scheitern,
  };
}

/** Der ganze Baum. */
export function baumSicht(w: World): BaumSicht {
  const z = baumZustand(w);
  const zweige = ZWEIGE.map((d) => {
    const knoten = d.knoten.map((id) => knotenSicht(w, id)).filter((k): k is KnotenSicht => !!k);
    return { id: d.id, knoten, fertig: knoten.filter((k) => k.zustand === "fertig").length, schwerpunkt: z.schwerpunkt === d.id };
  });
  const land = landesTempo(w);
  let etat = { budget: 0, grenze: WISSEN.grenzeStart, verpufft: 0 };
  let ueberhang = 0;
  try {
    const budget = forschungsBudget(w);
    const fs = forschungsSicht(w, budget);
    etat = { budget, grenze: fs.grenze, verpufft: fs.verpufft };
    ueberhang = bildungsUeberhang(w);
  } catch {
    /* ohne Haushalt */
  }
  const abwanderung = ueberhang > WISSEN.abwanderungSchwelle;
  const alle = zweige.flatMap((x) => x.knoten);
  const wartenAufBildung = alle.filter((k) => k.brauchtBildung).length;
  const sperre = Math.max(0, z.schwerpunktTag + BAUM.schwerpunktSperre - w.day);
  const gesamt = land.forschung * land.abwanderung;
  const satz =
    etat.verpufft > 0.05
      ? t("wissen.satz.verpufft", { verpufft: Math.round(etat.verpufft * 10) / 10, grenze: Math.round(etat.grenze * 10) / 10 })
      : abwanderung
        ? t("wissen.satz.abwanderung")
        : wartenAufBildung >= 2
          ? t("wissen.satz.bildung", { n: wartenAufBildung })
          : gesamt >= 1.15
            ? t("wissen.satz.schnell", { tempo: Math.round(gesamt * 10) / 10 })
            : gesamt <= 0.85
              ? t("wissen.satz.langsam", { tempo: Math.round(gesamt * 10) / 10 })
              : t("wissen.satz.normal");
  return { zweige, tempo: { ...land, gesamt }, etat, abwanderung, wartenAufBildung, schwerpunkt: z.schwerpunkt, schwerpunktSperre: sperre, satz, sperren: sperrGruppen(w, alle) };
}

/** Reihenfolge der Hindernisse in der Übersicht: was den ganzen Baum hält, zuerst. */
const SPERR_RANG: NonNullable<KnotenSicht["hindernis"]>[] = ["verwaltung", "foerderung", "bildung", "kapital", "partner", "knoten"];

/** Welle E2: gesperrte und blockierte Knoten nach Ursache, je eine Zeile mit Sprung (ehrliche Anzeige statt „Als Nächstes möglich“). */
function sperrGruppen(w: World, alle: KnotenSicht[]): SperrGruppe[] {
  const out: SperrGruppe[] = [];
  for (const art of SPERR_RANG) {
    // Nur Knoten, deren Vorstufen im Baum stehen; wer auf einen Vorgänger wartet, wartet auf die Forschung selbst
    const ks = alle.filter((k) => k.hindernis === art && k.zustand !== "fertig" && k.zustand !== "laeuft" && !k.wunder && k.voraus.every((v) => v.erfuellt || v.sprung?.art !== "knoten"));
    if (!ks.length) continue;
    if (art === "verwaltung") {
      const l = verwaltungsLage(w);
      const bedarf = Math.min(...ks.map((k) => verwaltungsBedarf(vorhabenDef(k.id)?.kosten.verwaltung ?? 0)));
      out.push({ art, n: ks.length, text: t("welle_e2.sperre.verwaltung", { vorrat: Math.floor(l.vorrat), bedarf, laufend: l.laufend, ohne: l.ohne.length, bau: l.bau }), sprung: { art: "verwaltung" }, knoten: ks[0]!.id });
      continue;
    }
    if (art === "kapital") {
      const pk = Math.min(...ks.map((k) => k.pk));
      out.push({ art, n: ks.length, text: t("welle_e2.sperre.kapital", { pk, kapital: Math.floor(w.spiel?.kapital ?? 0) }), sprung: { art: "kapital", pk }, knoten: ks[0]!.id });
      continue;
    }
    // Förderung, Bildung, Partner, Größen: die Zeile des Knotens mit der niedrigsten Hürde (die Sprungziele tragen den Zielwert)
    const ziel = (k: KnotenSicht) => (k.sprung?.art === "massnahme" ? k.sprung.ziel : 0);
    const k = [...ks].sort((a, b) => ziel(a) - ziel(b))[0]!;
    out.push({ art, n: ks.length, text: k.grund ?? t("wissen.grund.sonst"), ...(k.sprung ? { sprung: k.sprung } : {}), knoten: k.id });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Entscheidungen

export interface Ergebnis {
  ok: boolean;
  text: string;
}

/** Die Richtung der Forschung festlegen (oder aufheben). */
export function setzeSchwerpunkt(w: World, zweig: ZweigId | null): Ergebnis {
  const sp = w.spiel;
  if (!sp || sp.ende) return { ok: false, text: t("wissen.e.keinSpiel") };
  const z = baumZustand(w);
  if (z.schwerpunkt === zweig) return { ok: false, text: t("wissen.e.schonSchwerpunkt") };
  const rest = z.schwerpunktTag + BAUM.schwerpunktSperre - w.day;
  if (rest > 0) return { ok: false, text: t("wissen.e.sperre", { tage: rest }) };
  if (!kannZahlen(sp.kapital, BAUM.schwerpunktPk)) return { ok: false, text: t("wissen.e.kapital", { pk: BAUM.schwerpunktPk }) };
  sp.kapital -= BAUM.schwerpunktPk;
  z.schwerpunkt = zweig;
  z.schwerpunktTag = w.day;
  const text = zweig ? t("wissen.e.schwerpunkt", { zweig: t(`wissen.z.${zweig}.name`) }) : t("wissen.e.schwerpunktAus");
  addLog(w, "entscheidung", text, t("wissen.e.schwerpunktWarum"));
  return { ok: true, text };
}

export interface BeginnOptionen {
  /** Lizenz statt eigener Forschung */
  lizenz?: Lizenzgeber;
  /** Träger eines Werks; beim ausländischen Träger mit Partner */
  traeger?: Traeger;
  partner?: Lizenzgeber;
  /** Standort eines Werks (Kfz-Kennziffer); ohne Angabe der erste aus den Daten */
  standort?: number;
}

/** Ist die Heureka-Bedingung eines Knotens erfüllt? (Liest nur.) */
export function heurekaErfuellt(w: World, id: string): boolean {
  const h = HEUREKA_VON[id];
  if (!h || !w.spiel) return false;
  const b = h.bedingung;
  if (b.art === "vorhaben") return !!w.spiel.reich?.bestand[b.id];
  return NET.index.has(b.id) && nationalAverage(NET, w.net, b.id) >= b.min;
}

function heurekaSicht(w: World, id: string): NonNullable<KnotenSicht["heureka"]> {
  const h = HEUREKA_VON[id]!;
  const b = h.bedingung;
  const text = b.art === "vorhaben" ? t("wissen.heureka.vorhaben", { name: knotenName(b.id) }) : t("wissen.heureka.massnahme", { was: groesseName(b.id), ziel: b.min });
  const eintrag = w.spiel?.wissensbaum?.heureka?.find((x) => x.id === id);
  return { text, erfuellt: heurekaErfuellt(w, id), ausgeloest: !!eintrag, frisch: !!eintrag && w.day - eintrag.tag <= BAUM.durchbruchTage };
}

/** Ein möglicher Standort eines Werks, wie die Ansicht ihn vergleicht. */
export interface StandortSicht {
  plaka: number;
  name: string;
  /** Auslastung von Strom und Wasser vor Ort (null, wo es keine Angabe gibt) */
  strom: number | null;
  wasser: number | null;
  /** Braucht das Werk viel Wasser (Chipfertigung)? */
  wasserIntensiv: boolean;
  /** Fachkräfte vor Ort und im Landesmittel */
  fach: number;
  fachLand: number;
  hafen: boolean;
  /** Bautempo an diesem Standort */
  tempo: number;
  /** Bremst ein überlastetes Netz den Bau? */
  engpass: boolean;
}

const r2 = (x: number): number => Math.round(x * 100) / 100;

/** Die Standorte eines Werks im Vergleich (leer ohne Werk). */
export function standortSichten(w: World, id: string): StandortSicht[] {
  const d = WERK_VON[id];
  if (!d || !w.spiel) return [];
  const fachLand = groessenWert(w, "fachkraefte");
  return d.standorte.map((o) => {
    let strom: number | null = null;
    let wasser: number | null = null;
    try {
      strom = auslastung(w, "strom", o.plaka);
      wasser = auslastung(w, "wasser", o.plaka);
    } catch {
      /* ohne Netze (Werkzeuge) */
    }
    const fach = groessenWert(w, "fachkraefte", [o.plaka]);
    const f = Number.isFinite(fach) && fachLand > 0 ? fach / fachLand : 1;
    const engpass = (strom ?? 0) >= STANDORT.ueberlast || (!!d.wasser && (wasser ?? 0) >= STANDORT.ueberlast);
    const tempo = r2(Math.min(STANDORT.tempoMax, Math.max(STANDORT.tempoMin, 1 + STANDORT.fachGewicht * (f - 1))) * (engpass ? STANDORT.ueberlastTempo : 1));
    return {
      plaka: o.plaka,
      name: PROVINZEN[o.plaka - 1]?.name ?? String(o.plaka),
      strom,
      wasser,
      wasserIntensiv: !!d.wasser,
      fach: Math.round(Number.isFinite(fach) ? fach : fachLand),
      fachLand: Math.round(fachLand),
      hafen: !!o.hafen,
      tempo,
      engpass,
    };
  });
}

/** Was eine Wahl zusätzlich kostet (Kapital), und ob sie geht. */
export function beginnPreis(w: World, id: string, o: BeginnOptionen = {}): { pk: number; ok: boolean; grund?: string } {
  const s = vorhabenSicht(w, id);
  if (!s) return { pk: 0, ok: false, grund: t("wissen.e.unbekannt") };
  let pk = vergabeAngebot(s.v, "ausschreibung").pk;
  if (o.lizenz) {
    if (!lizenzgeber(id).includes(o.lizenz)) return { pk, ok: false, grund: t("wissen.e.keineLizenz") };
    if (partnerGesperrt(w, o.lizenz, id)) return { pk, ok: false, grund: t("wissen.e.partnerGesperrt", { land: t(`wissen.partner.${o.lizenz}`) }) };
    pk += BAUM.lizenzPk;
  }
  if (o.traeger) {
    if (!WERK_VON[id]) return { pk, ok: false, grund: t("wissen.e.keinWerk") };
    if (o.traeger === "ausland") {
      const p = o.partner ?? lizenzgeber(id)[0];
      if (!p) return { pk, ok: false, grund: t("wissen.e.keinPartner") };
      if (partnerGesperrt(w, p, id)) return { pk, ok: false, grund: t("wissen.e.partnerGesperrt", { land: t(`wissen.partner.${p}`) }) };
    }
    pk += BAUM.traeger[o.traeger].pk;
  }
  if (o.standort !== undefined && !WERK_VON[id]?.standorte.some((x) => x.plaka === o.standort)) return { pk, ok: false, grund: t("wissen.e.keinStandort") };
  if (!kannZahlen(w.spiel!.kapital, pk)) return { pk, ok: false, grund: t("wissen.e.kapital", { pk }) };
  return { pk, ok: true };
}

function rivalenReagieren(w: World, p: Lizenzgeber, grund: string): void {
  beziehungAendern(w, p, { handel: 2, vertrauen: 2 }, grund);
  for (const r of RIVALEN[p]) beziehungAendern(w, r.id, { vertrauen: r.d }, grund);
}

/** Einen Knoten beginnen: selbst forschen, mit Lizenz, und bei Werken mit gewähltem Träger. */
export function beginneKnoten(w: World, id: string, o: BeginnOptionen = {}): Ergebnis {
  const sp = w.spiel;
  if (!sp || sp.ende) return { ok: false, text: t("wissen.e.keinSpiel") };
  const k = knotenSicht(w, id);
  if (!k) return { ok: false, text: t("wissen.e.unbekannt") };
  if (k.zustand !== "moeglich") return { ok: false, text: k.grund ?? t("wissen.e.nichtMoeglich") };
  const preis = beginnPreis(w, id, o);
  if (!preis.ok) return { ok: false, text: preis.grund ?? "" };
  const extra = preis.pk - k.pk;
  const logVorher = w.log.length;
  const r = beginne(w, id, "ausschreibung");
  if (!r.ok) return { ok: false, text: k.grund ?? t("wissen.e.nichtMoeglich") };
  // Die Zeile des Reiches ist deutsch; der Baum schreibt seine eigene in der Sprache des Spiels
  const i = w.log.findIndex((e, j) => j >= logVorher && e.text === r.text);
  if (i >= 0) w.log.splice(i, 1);
  sp.kapital -= extra;
  const z = baumZustand(w);
  const name = knotenName(id);
  let ort = "";
  if (WERK_VON[id]) {
    const so = standortSichten(w, id).find((x) => x.plaka === (o.standort ?? WERK_VON[id]!.standorte[0]!.plaka));
    if (so) {
      (z.standort ??= {})[id] = { plaka: so.plaka, tempo: so.tempo };
      ort = ` ${t("wissen.e.standort", { ort: so.name })}`;
    }
  }
  if (o.lizenz) {
    z.lizenzen[id] = o.lizenz;
    rivalenReagieren(w, o.lizenz, t("wissen.e.lizenzGrund", { name }));
    if (k.zweig === "ruestung") wirke(w, "ruestungsautarkie", -1);
  }
  if (o.traeger && WERK_VON[id]) {
    const partner = o.traeger === "ausland" ? (o.partner ?? lizenzgeber(id)[0]) : undefined;
    z.traeger[id] = { art: o.traeger, ...(partner ? { partner } : {}) };
    if (o.traeger === "firma") {
      wirke(w, "unternehmer", 1.5);
      wirke(w, "korruption", 0.4);
    } else if (o.traeger === "ausland" && partner) {
      wirke(w, "auslandskapital", 2);
      beziehungAendern(w, partner, { handel: 2 }, t("wissen.e.partnerGrund", { name }));
    }
  }
  const weg = o.lizenz ? t("wissen.e.weg.lizenz", { land: t(`wissen.partner.${o.lizenz}`) }) : t("wissen.e.weg.selbst");
  const traeger = o.traeger ? ` ${t(`wissen.traeger.${o.traeger}.kurz`)}.` : "";
  // Welle E2: die Schätzung der Baustelle (Tempo, Kapazität, Reihe) statt der geplanten Bauzeit
  const monate = warteschlange(w).find((e) => e.id === id)?.fertigIn;
  const text = (monate === undefined ? t("welle_e2.begonnenOffen", { name, weg }) : t("wissen.e.begonnen", { name, weg, monate })) + traeger + ort;
  addLog(w, "entscheidung", text, o.lizenz ? t("wissen.e.lizenzWarum") : t("wissen.e.selbstWarum"));
  return { ok: true, text };
}

/** Für einen laufenden Knoten eine Lizenz nachkaufen (beschleunigt den Rest). */
export function kaufeLizenz(w: World, id: string, p: Lizenzgeber): Ergebnis {
  const sp = w.spiel;
  if (!sp || sp.ende) return { ok: false, text: t("wissen.e.keinSpiel") };
  const k = knotenSicht(w, id);
  if (!k || k.zustand !== "laeuft") return { ok: false, text: t("wissen.e.nichtLaufend") };
  if (k.lizenz) return { ok: false, text: t("wissen.e.schonLizenz") };
  if (!k.lizenzgeber.includes(p)) return { ok: false, text: t("wissen.e.keineLizenz") };
  if (partnerGesperrt(w, p, id)) return { ok: false, text: t("wissen.e.partnerGesperrt", { land: t(`wissen.partner.${p}`) }) };
  if (!kannZahlen(sp.kapital, BAUM.lizenzPk)) return { ok: false, text: t("wissen.e.kapital", { pk: BAUM.lizenzPk }) };
  sp.kapital -= BAUM.lizenzPk;
  const z = baumZustand(w);
  z.lizenzen[id] = p;
  const name = knotenName(id);
  rivalenReagieren(w, p, t("wissen.e.lizenzGrund", { name }));
  if (k.zweig === "ruestung") wirke(w, "ruestungsautarkie", -1);
  const text = t("wissen.e.lizenzGekauft", { name, land: t(`wissen.partner.${p}`) });
  addLog(w, "entscheidung", text, t("wissen.e.lizenzWarum"));
  return { ok: true, text };
}

// ---------------------------------------------------------------------------
// Monatsschritt: Durchbrüche verbuchen, Sperren der Partner melden

const ELEKTRONIK_GATTUNGEN = new Set<GattungId>(["drohnen", "raketen", "luftabwehr"]);

/**
 * Fertigungstempo der Streitkräfte aus Gütern und Werken (1 = Stand 2026): Eigene Chips beschleunigen Drohnen, Raketen und Luftabwehr,
 * eigene Triebwerke die Kampfflugzeuge. Spielparameter.
 */
export function militaerGueterFaktor(w: World, gattung: GattungId): number {
  if (!w.spiel?.reich) return 1;
  let f = 1;
  if (ELEKTRONIK_GATTUNGEN.has(gattung)) f += 0.25 * Math.min(1, werkZusatz(w, "elektronik") / 0.75);
  if (gattung === "kampfflugzeuge") f += 0.2 * Math.max(werkErtrag(w, "luft_triebwerke"), werkErtrag(w, "mil_kaan_motor"));
  return f;
}
setzeGueterQuelle(militaerGueterFaktor);

/** Vorhaben, die eine gezielte Rüstungssanktion trifft: CAATSA richtet sich gegen die Rüstungsbehörde SSB (Exportlizenzen für
 * Rüstungsgüter), nicht gegen zivile Chips, KI oder Medizin. Triebwerke zählen dazu, weil sie in Kampfflugzeuge gehen. */
const RUESTUNGSNAH = (knoten: string): boolean => ZWEIG_VON[knoten] === "ruestung" || knoten === "luft_triebwerke";

/** Ein Partner sperrt bei Krieg mit der Türkei, bei Sanktionen gegen sie oder wenn das Vertrauen unter die Schwelle fällt. */
function sperrt(w: World, p: Lizenzgeber, knoten?: string): boolean {
  try {
    if (aktiveKriege(w).some((k) => k.land === p && (k.phase === "krieg" || k.phase === "waffenruhe"))) return true;
    if (aussenZustand(w).sanktionen.some((s) => s.von === p && (!SANKTION_GEZIELT.has(s.id) || (!!knoten && RUESTUNGSNAH(knoten))))) return true;
    return beziehungZurTuerkei(w, p).vertrauen < BAUM.partnerVertrauenMin;
  } catch {
    return false;
  }
}
setzeSperrQuelle(sperrt);

export function wissensbaumMonat(w: World): void {
  const sp = w.spiel;
  if (!sp || sp.ende) return;
  const bestand = reichZustand(w).bestand;
  const z = baumZustand(w);
  for (const d of ZWEIGE)
    for (const id of d.knoten) {
      if (!bestand[id] || z.verbucht.includes(id)) continue;
      z.verbucht.push(id);
      z.durchbrueche.push({ id, tag: w.day });
      const werk = WERK_VON[id];
      if (werk?.militaer?.length) {
        const sk = streitkraefte(w);
        const tr = z.traeger[id]?.art ?? "staat";
        const plus = BAUM.traeger[tr].generation * (z.lizenzen[id] ? 0.5 : 1);
        for (const g of werk.militaer) {
          const s = sk.gattungen[g];
          if (s) s.heimGeneration = Math.min(5, Math.round((s.heimGeneration + plus) * 100) / 100);
        }
      }
      // Das Werk am Standort: Arbeitsplätze und Vertrauen vor Ort, mit Seehafen mehr Ausfuhr (Netzlast: sim/infrastruktur.ts)
      let ort = "";
      if (werk && !z.start.includes(id)) {
        const pl = standortVon(w, id)!;
        wirke(w, "vertrauen_regierung", STANDORT.vertrauen, [pl]);
        wirke(w, "industrie", STANDORT.industrie, [pl]);
        if (werk.standorte.find((x) => x.plaka === pl)?.hafen) wirke(w, "export", STANDORT.hafenExport);
        ort = ` ${t("wissen.durchbruch.ort", { ort: PROVINZEN[pl - 1]?.name ?? String(pl) })}`;
      }
      addLog(w, "ereignis", t("wissen.durchbruch.log", { name: knotenName(id) }) + ort, werk ? t("wissen.durchbruch.werk") : t("wissen.durchbruch.wissen"));
      if (!z.start.includes(id)) durchbruchMoment(w, id, d.id, ort.trim());
    }
  z.durchbrueche = z.durchbrueche.filter((x) => w.day - x.tag <= BAUM.durchbruchTage);
  // Heureka: Ist die Bedingung erfüllt, solange der Knoten noch nicht fertig ist, geht es dort dauerhaft schneller (einmal je Knoten)
  // Was beim ersten Blick schon erfüllt ist (Spielbeginn, alter Spielstand), gilt still: kein Stempel, keine Meldungsflut
  const heureka = (z.heureka ??= []);
  const still = !z.heurekaGeprueft;
  z.heurekaGeprueft = true;
  for (const h of HEUREKA) {
    if (bestand[h.knoten] || heureka.some((x) => x.id === h.knoten) || !heurekaErfuellt(w, h.knoten)) continue;
    heureka.push({ id: h.knoten, tag: still ? -100_000 : w.day });
    if (still) continue;
    addLog(w, "ereignis", t("wissen.heureka.log", { name: knotenName(h.knoten) }), t("wissen.heureka.warum", { bedingung: heurekaSicht(w, h.knoten).text, tempo: BAUM.heurekaTempo }));
  }
  // Sperrt ein Lizenzgeber oder Partner, meldet die Akte es einmal; hebt er die Sperre auf, darf es wieder gemeldet werden
  const partner = new Set<Lizenzgeber>([...Object.values(z.lizenzen), ...Object.values(z.traeger).flatMap((x) => (x.partner ? [x.partner] : []))]);
  for (const p of partner) {
    const gesperrt = partnerGesperrt(w, p);
    if (gesperrt && !z.gemeldet.includes(p)) {
      z.gemeldet.push(p);
      addLog(w, "ereignis", t("wissen.sperre.log", { land: t(`wissen.partner.${p}`) }), t("wissen.sperre.warum"));
    } else if (!gesperrt && z.gemeldet.includes(p)) z.gemeldet = z.gemeldet.filter((x) => x !== p);
  }
}

/**
 * Welle E2: Ein Durchbruch ist ein Moment wie ein vollendeter Fokus (sim/fokus.ts): eigenes Fenster mit dem, was er bewirkt und öffnet,
 * eine Eilmeldung der Zeitung und ein Wirkungsbericht nach 6, 12 und 24 Monaten über die Größen, die das Vorhaben bewegt. Vorher war er nur
 * eine Zeile im Protokoll (Analyse forschung.md, U5). Wunder, Großprojekte und Serien meldet die Zeitung schon beim Abschluss im Reich.
 */
function durchbruchMoment(w: World, id: string, zweig: ZweigId, ort: string): void {
  const sp = w.spiel!;
  const v = vorhabenDef(id);
  const name = knotenName(id);
  const vs = v ? vorschauFuer(w, v) : null;
  const sofort = (vs?.sofort ?? []).slice(0, 3).map((e) => e.text);
  const dauerhaft = (vs?.dauerhaft ?? []).slice(0, 3).map((e) => e.text);
  const weiter = ZWEIGE.flatMap((d) => d.knoten).filter((k) => (vorhabenDef(k)?.voraus ?? []).some((x) => x.art === "bestand" && x.id === id)).map(knotenName);
  const text = [t(`wissen.n.${id}.satz`)];
  if (ort) text.push(ort);
  if (sofort.length) text.push(t("welle_e2.durchbruch.sofort", { liste: sofort.join(" · ") }));
  if (dauerhaft.length) text.push(t("welle_e2.durchbruch.dauerhaft", { liste: dauerhaft.join(" · ") }));
  if (weiter.length) text.push(t("welle_e2.durchbruch.weiter", { liste: weiter.join(", ") }));
  sp.hinweise.push({ id: `durchbruch-${id}-${w.day}`, titel: t("welle_e2.durchbruch.titel", { name }), szene: "istanbul", text });
  const wichtig = v?.klasse === "wunder" || v?.klasse === "grossprojekt" || v?.klasse === "serie";
  if (!wichtig) zeitungEreignis(w, { art: "fertigstellung", titel: name, fakt: t("welle_e2.durchbruch.fakt", { name, zweig: t(`wissen.z.${zweig}.name`) }), wertung: 0.6 });
  // Beobachtet werden die Größen, die das Vorhaben bewegt (Abschluss und Dauerwirkung), Stand heute
  const ids = [...new Set([...(v?.abschluss ?? []), ...(v?.dauer ?? [])].flatMap((e) => (e.t === "knoten" ? [e.id] : [])))].slice(0, 4);
  if (ids.length) rueckblickAnlegen(w, "forschung", name, momentaufnahme(w), undefined, ids, id);
}

// ---------------------------------------------------------------------------
// Für den Bot im Mess-Tor und für Tests: der nächste sinnvolle Schritt

/** Der günstigste mögliche Knoten (zuerst im Schwerpunkt), wenn Kapital und Verwaltung reichen. */
export function naechsterKnoten(w: World): KnotenSicht | null {
  if (!w.spiel) return null;
  if (verwaltungBilanz(w).netto < 0) return null;
  const s = baumSicht(w);
  const moeglich = s.zweige.flatMap((z) => z.knoten).filter((k) => k.zustand === "moeglich" && !k.grund && !k.wunder);
  moeglich.sort((a, b) => Number(b.zweig === s.schwerpunkt) - Number(a.zweig === s.schwerpunkt) || a.pk - b.pk);
  return moeglich[0] ?? null;
}


/** Gemeinsame Zeitangabe: Pause oder fehlende Schätzung sind kein versprochener Termin. */
export function knotenTermin(k: KnotenSicht): string {
  if (k.zustand === "fertig") return t("wissen.ui.zustand.fertig");
  if (k.zustand === "laeuft") return k.pausiert ? t("wissen.ui.bauPause") : k.restMonate !== undefined ? t("wissen.civ.inMonaten", { n: k.restMonate }) : t("wissen.ui.terminOffen");
  return k.monateEcht === undefined ? t("wissen.ui.terminOffen") : t("wissen.civ.dauer", { n: k.monateEcht });
}
