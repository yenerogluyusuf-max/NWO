// Der Verhandlungstisch: Verträge mit anderen Ländern aus Klauseln (data/abkommen.ts).
// Die Gegenseite bewertet das ganze Paket: was ihr jede Klausel wert ist oder kostet, dazu Vertrauen, offener Streit, Abhängigkeit
// (Hebel), die Erinnerung an gebrochene und gehaltene Verträge und die Länge der Bindung. Erreicht das Paket die Schwelle, stimmt sie
// zu; knapp darunter macht sie ein Gegenangebot mit genau einer Änderung; eine Rote Linie ist ein Veto. Ein laufender Vertrag wirkt
// jeden Monat im Land, wird jedes Jahr geprüft und kann gebrochen werden; ein Bruch bleibt in Erinnerung.
// Alle Zahlen sind Spielparameter (Platzhalter der Kalibrierung), keine Tatsachenbehauptungen.

import { KLAUSEL_NACH_ID, AUSSTRAHLUNG, PROFILE, SPERRE_KLAUSELN, VERTRAGSLAUFZEITEN, type KlauselDef, type Laufzeit } from "../data/abkommen";
import { dimensionZu, land, landAendern, vertrauenZu, weltZustand, type Dimension } from "./laender";
import { effektZeile, wendeEffekt, type EffektZeile } from "./reich";
import { pruefeBedingung } from "./programme";
import { kannZahlen } from "./kapital";
import { addLog } from "./log";
import { wirke, vertrauenAendern } from "./wirkung";
import { clamp } from "./economy";
import { NET } from "./modell";
import { nationalAverage } from "./netz";
// Ringimport mit sim/diplomatie.ts: beide rufen einander nur zur Laufzeit in Funktionen auf, nie beim Laden des Moduls
import { aussenZustand } from "./diplomatie";
import { t } from "../i18n";
import type { Rng } from "./rng";
import type { World } from "./types";
import type { Angebot, Vertrag } from "./abkommen-typen";

export type { Angebot, Vertrag } from "./abkommen-typen";
export { VERTRAGSLAUFZEITEN } from "../data/abkommen";

/** Wie stark die Dauerwirkungen eines Vertrags bei kurzer, mittlerer und langer Bindung ausfallen */
export const LAUFZEIT_FAKTOR: Record<Laufzeit, number> = { 2: 0.8, 5: 1, 10: 1.25 };
const TAGE_JAHR = 360;
/** Tage, in denen ein Land nach einer Zurückweisung nicht wieder verhandelt */
const SPERRE_TAGE = 45;
const BRUCH_STRAFE = 6;

// ---------------------------------------------------------------------------
// Klauseln eines Landes

export interface KlauselSicht {
  def: KlauselDef;
  /** Landesspezifische Fassung von Titel und Text */
  label: string;
  text: string;
  /** Wert (+) oder Kosten (−) für den Partner, in Punkten der Bewertung */
  wert: number;
  /** Rote Linie: der Partner nimmt sie nie an */
  rot: boolean;
  rotText?: string;
  /** Warum sie gerade nicht gewählt werden kann; sonst leer */
  gesperrt?: string;
}

export function vertraegeVon(w: World, landId: string): Vertrag[] {
  const z = weltZustand(w)[landId]!;
  return (z.vertraege ??= []);
}

export const laufende = (w: World, landId: string): Vertrag[] => vertraegeVon(w, landId).filter((v) => v.status === "laeuft");

export function alleLaufenden(w: World): Vertrag[] {
  const out: Vertrag[] = [];
  for (const id of Object.keys(weltZustand(w))) out.push(...laufende(w, id));
  return out;
}

export function klauselnFuer(w: World, landId: string): KlauselSicht[] {
  const p = PROFILE[landId];
  if (!p) return [];
  const aktiv = new Set(laufende(w, landId).flatMap((v) => [...v.gibt, ...v.will]));
  const out: KlauselSicht[] = [];
  for (const [id, wert] of Object.entries(p.werte)) {
    const def = KLAUSEL_NACH_ID[id];
    if (!def) continue;
    const o = p.texte?.[id];
    const rot = p.rot.includes(id);
    let gesperrt: string | undefined;
    if (aktiv.has(id)) gesperrt = t("abk.gesperrt.laeuft");
    // Handelssperre (Stand 30.09.2026: Israel seit 05/2024): Handels-Klauseln bleiben gesperrt, bis „ende_sperre“ vereinbart ist
    else if (weltZustand(w)[landId]!.handelssperre && SPERRE_KLAUSELN.includes(id)) gesperrt = t("abk.gesperrt.sperre");
    else if (def.mindestens && dimensionZu(w, landId, def.mindestens.dim) < def.mindestens.wert) gesperrt = def.mindestens.text;
    // „Sanktionen aufheben“ gibt es nur, wo dieser Partner wirklich eine Sanktion gegen die Türkei verhängt hat (früher auch ohne)
    else if (id === "w_sanktion" && !aussenZustand(w).sanktionen.some((x) => x.von === landId)) gesperrt = t("aussen.sanktion.klausel_keine");
    out.push({ def, label: o?.label ?? def.label, text: o?.text ?? def.text, wert, rot, ...(rot && p.rotText?.[id] ? { rotText: p.rotText[id] } : {}), ...(gesperrt ? { gesperrt } : {}) });
  }
  return out;
}

export const klauselSicht = (w: World, landId: string, id: string): KlauselSicht | undefined => klauselnFuer(w, landId).find((k) => k.def.id === id);

/** Was eine Klausel im eigenen Land bewirkt, in Zeilen für Karte und Vorschau (grün gut, rot schlecht). */
export function heimWirkung(def: KlauselDef): { sofort: EffektZeile[]; dauer: EffektZeile[] } {
  return {
    sofort: (def.abschluss ?? []).map((e) => effektZeile(e, "sofort")).filter((z): z is EffektZeile => !!z),
    dauer: (def.dauer ?? []).map((e) => effektZeile(e, "dauer")).filter((z): z is EffektZeile => !!z),
  };
}

// ---------------------------------------------------------------------------
// Bewertung durch die Gegenseite
//
// Welle H6 (06.11.2026), Rückmeldung des Inhabers: „kein Russland der Welt würde so ein Angebot annehmen“. Vorher waren die Punkte die
// Summe der Klauselwerte PLUS Vertrauen, Streit, Hebel und Treue; bei guter Beziehung trug allein dieser Grundbetrag über die Schwelle,
// und die Stimmung „bezahlte“ beliebige Forderungen (im Spielstand des Inhabers: Akkuyu, Korridor und Transit ohne Gegenleistung).
// Jetzt rechnet die Gegenseite wie ein Staat: Ihr Saldo aus den Klauseln — was sie bekommt, minus was sie gibt — muss über einer
// Mindestmarge liegen. Die Beziehung senkt diese Marge oder macht Gespräche überhaupt erst möglich, ersetzt aber keine Gegenleistung:
// Die Marge fällt nie unter null. Ein Paket nur aus Forderungen hat einen negativen Saldo und scheitert, es sei denn, jede Forderung
// liegt im eigenen Interesse der Gegenseite (Klauselwert ≥ 0).

/** Spielparameter der Abwägung (Platzhalter der Kalibrierung, keine Tatsachen). */
export const ABWAEGUNG = {
  /** Was ein neutraler Partner mindestens mehr bekommen will, als er gibt, bei zwei Jahren Laufzeit */
  margeGrund: 2,
  /** Je Jahr Bindung über zwei Jahre hinaus wächst die Marge */
  margeJeJahr: 0.35,
  /** Jeder Punkt Beziehung (Vertrauen, Streit, Hebel, Treue) senkt die Marge um diesen Anteil */
  beziehungsFaktor: 0.5,
  /** Untergrenze der Marge: Die Beziehung ersetzt nie eine Gegenleistung */
  margeMin: 0,
  /** Unter diesem Stand der Beziehung verhandelt der Partner gar nicht (etwa Vertrauen 0 und Streit 100 ohne eigenen Hebel) */
  gespraechAb: -15,
} as const;

export interface Grund {
  text: string;
  /** Beitrag: bei Klauseln der Wert für den Partner (+ bekommt, − gibt), bei der Beziehung die Senkung (+) oder Erhöhung (−) der Marge */
  wert: number;
  art: "plus" | "minus" | "info";
  /** Woher der Grund kommt: eine Klausel auf der Waage oder die Beziehung am Tisch */
  quelle?: "klausel" | "beziehung";
}

export type Urteil = "leer" | "zustimmung" | "gegenangebot" | "ablehnung" | "veto";

export interface Gegenangebot {
  text: string;
  angebot: Angebot;
  /** Was die Änderung ist: eine weitere Leistung der Türkei, zwei, der Verzicht auf eine Forderung oder eine kürzere Bindung */
  art?: "zusatz" | "zwei" | "verzicht" | "kuerzer";
  /** Kurzer Grund, warum gerade diese Änderung (größter Wunsch des Partners, geringster Preis für die Türkei) */
  hinweis?: string;
}

export interface Bewertung {
  urteil: Urteil;
  /** Saldo des Partners aus den Klauseln (wie früher „Punkte“, jetzt ohne Beziehung) */
  punkte: number;
  /** Nötige Marge (wie früher „Grenze“) */
  grenze: number;
  /** Was die Türkei dem Partner gibt: Summe der positiven Klauselwerte */
  gibtWert: number;
  /** Was die Türkei vom Partner verlangt: Summe der Kosten (Beträge der negativen Klauselwerte, ohne Rote Linie) */
  willKosten: number;
  /** Beziehung in Punkten: Vertrauen, Streit, Hebel, Treue, Brüche */
  beziehung: number;
  /** Ob der Partner überhaupt verhandelt */
  gespraech: boolean;
  /** 0 ablehnend bis 4 einverstanden */
  stimmung: 0 | 1 | 2 | 3 | 4;
  gruende: Grund[];
  veto?: string;
  gegenangebote: Gegenangebot[];
  /** Kapital, das die Verhandlung und die Klauseln im Land kosten */
  pk: number;
}

// Stimmung des Partners in der Sprache des Spiels (Getter: der Text entsteht beim Lesen)
export const STIMMUNG_WORT: Readonly<Record<0 | 1 | 2 | 3 | 4, string>> = {
  get 0() { return t("tag_t8.aussen.stimmung.0"); },
  get 1() { return t("tag_t8.aussen.stimmung.1"); },
  get 2() { return t("tag_t8.aussen.stimmung.2"); },
  get 3() { return t("tag_t8.aussen.stimmung.3"); },
  get 4() { return t("tag_t8.aussen.stimmung.4"); },
};

/** Kapital für einen Vertrag: ein Sockel für die Verhandlung, dazu der politische Preis der Klauseln im eigenen Land. */
export function pkFuer(a: Angebot): number {
  const n = a.gibt.length + a.will.length;
  const klauseln = [...a.gibt, ...a.will].reduce((s, id) => s + (KLAUSEL_NACH_ID[id]?.pk ?? 0), 0);
  return n === 0 ? 0 : 2 + Math.ceil(n / 2) + klauseln;
}

/** Die Beziehung zur Türkei in Punkten, mit ihren Gründen. Sie wirkt nur auf die Marge, nie auf den Saldo. */
export function beziehungZu(w: World, landId: string): { punkte: number; gruende: Grund[] } {
  const p = PROFILE[landId];
  const z = weltZustand(w)[landId]!;
  const gruende: Grund[] = [];
  const f = ABWAEGUNG.beziehungsFaktor;
  const v = vertrauenZu(w, landId);
  const basis = (v - 45) / 5;
  gruende.push({ text: basis >= 0 ? t("abk.grund.vertrauen_ja", { v: Math.round(v) }) : t("abk.grund.vertrauen_nein", { v: Math.round(v) }), wert: basis * f, art: basis >= 0 ? "plus" : "minus", quelle: "beziehung" });
  const konf = -(z.konflikt - 40) / 8;
  if (Math.abs(konf) >= 1) gruende.push({ text: konf < 0 ? t("abk.grund.streit") : t("abk.grund.kein_streit"), wert: konf * f, art: konf < 0 ? "minus" : "plus", quelle: "beziehung" });
  const hebel = p?.hebel ?? 0;
  if (hebel !== 0 && p) gruende.push({ text: p.hebelText, wert: hebel * f, art: hebel > 0 ? "plus" : "minus", quelle: "beziehung" });
  const bruch = -(z.bruch ?? 0);
  if (bruch < -0.3) gruende.push({ text: t("abk.grund.bruch"), wert: bruch * f, art: "minus", quelle: "beziehung" });
  const gehalten = Math.min(3, (z.gehalten ?? 0) * 1.5);
  if (gehalten > 0) gruende.push({ text: t("abk.grund.gehalten"), wert: gehalten * f, art: "plus", quelle: "beziehung" });
  return { punkte: basis + konf + hebel + bruch + gehalten, gruende };
}

/** Die Mindestmarge: Grund und Laufzeit, gesenkt durch die Beziehung, nie unter der Untergrenze. */
export function margeFuer(jahre: Laufzeit, beziehung: number): number {
  const roh = ABWAEGUNG.margeGrund + (jahre - 2) * ABWAEGUNG.margeJeJahr - beziehung * ABWAEGUNG.beziehungsFaktor;
  return Math.max(ABWAEGUNG.margeMin, roh);
}

interface Abwaegung {
  saldo: number;
  gibtWert: number;
  willKosten: number;
  marge: number;
  beziehung: number;
  gespraech: boolean;
  gruende: Grund[];
  veto?: string;
}

function abwaegung(w: World, a: Angebot): Abwaegung {
  const p = PROFILE[a.land];
  const gruende: Grund[] = [];
  if (!p) return { saldo: -99, gibtWert: 0, willKosten: 99, marge: 99, beziehung: -99, gespraech: false, gruende };
  const l = land(a.land);
  let gibtWert = 0;
  let willKosten = 0;
  let veto: string | undefined;
  for (const id of [...a.gibt, ...a.will]) {
    const k = klauselSicht(w, a.land, id);
    if (!k) {
      gruende.push({ text: t("abk.grund.nicht", { land: l.name }), wert: -20, art: "minus", quelle: "klausel" });
      willKosten += 20;
      continue;
    }
    if (k.rot) {
      veto = k.rotText ?? `${l.name} nimmt „${k.label}“ nicht an.`;
      gruende.push({ text: t("abk.grund.rot", { label: k.label }), wert: 0, art: "minus", quelle: "klausel" });
      continue;
    }
    const gibt = k.def.seite === "gibt";
    if (k.wert > 0) {
      gibtWert += k.wert;
      gruende.push({ text: gibt ? t("abk.grund.will", { label: k.label, land: l.name }) : t("welle_h6.grund.interesse", { label: k.label, land: l.name }), wert: k.wert, art: "plus", quelle: "klausel" });
    } else if (k.wert < 0) {
      willKosten -= k.wert;
      gruende.push({ text: t("abk.grund.kostet", { label: k.label, land: l.name }), wert: k.wert, art: "minus", quelle: "klausel" });
    } else {
      gruende.push({ text: t("abk.grund.kostetnichts", { label: k.label, land: l.name }), wert: 0, art: "info", quelle: "klausel" });
    }
  }
  const bz = beziehungZu(w, a.land);
  gruende.push(...bz.gruende);
  const saldo = gibtWert - willKosten;
  if (a.gibt.length === 0 && a.will.length > 0 && saldo < 0) gruende.push({ text: t("abk.grund.einseitig"), wert: 0, art: "info", quelle: "klausel" });
  const gespraech = bz.punkte >= ABWAEGUNG.gespraechAb;
  if (!gespraech) gruende.push({ text: t("welle_h6.grund.kein_gespraech", { land: l.name }), wert: 0, art: "minus", quelle: "beziehung" });
  return { saldo, gibtWert, willKosten, marge: margeFuer(a.jahre, bz.punkte), beziehung: bz.punkte, gespraech, gruende, ...(veto ? { veto } : {}) };
}

/** Ob die Gegenseite einem Paket zustimmt: Gespräch möglich, keine Rote Linie, Saldo mindestens die Marge. */
function stimmtZu(w: World, a: Angebot): boolean {
  const x = abwaegung(w, a);
  return x.gespraech && !x.veto && x.saldo >= x.marge - 1e-9;
}

function stimmungFuer(d: number): 0 | 1 | 2 | 3 | 4 {
  return d >= 0 ? 4 : d >= -3 ? 3 : d >= -7 ? 2 : d >= -12 ? 1 : 0;
}

/** Kosten einer Klausel für den Spieler, für die Reihenfolge der Gegenangebote: politischer Preis und schädliche Wirkungen. */
function eigenerPreis(def: KlauselDef): number {
  const schlecht = [...(def.abschluss ?? []), ...(def.dauer ?? [])].map((e) => effektZeile(e, "dauer")).filter((z) => z && !z.gut).length;
  return (def.pk ?? 0) + schlecht * 0.6;
}

/**
 * Was die Gegenseite für ihre Zustimmung verlangt, aus ihren eigenen Wünschen: die Leistung, die ihr am meisten wert ist, die für die
 * Türkei günstigste, die gerade reicht, notfalls zwei Leistungen; dazu der Verzicht auf die teuerste Forderung und eine kürzere Bindung.
 * Jeder Vorschlag ist ein Paket, dem sie selbst zustimmt. Höchstens drei, deterministisch geordnet.
 */
function gegenangebote(w: World, a: Angebot): Gegenangebot[] {
  const l = land(a.land);
  const out: Gegenangebot[] = [];
  const schon = new Set<string>();
  const dazu = (g: Gegenangebot) => {
    const key = `${[...g.angebot.gibt].sort().join(",")}|${[...g.angebot.will].sort().join(",")}|${g.angebot.jahre}`;
    if (schon.has(key)) return;
    schon.add(key);
    out.push(g);
  };
  const frei = klauselnFuer(w, a.land).filter((k) => k.def.seite === "gibt" && !k.gesperrt && !k.rot && k.wert > 0 && !a.gibt.includes(k.def.id));
  const mit = (...ids: string[]): Angebot => ({ ...a, gibt: [...a.gibt, ...ids] });
  const passend = frei.filter((k) => stimmtZu(w, mit(k.def.id)));
  // 1. Der größte Wunsch der Gegenseite, der die Lücke schließt
  const nachWunsch = [...passend].sort((x, y) => y.wert - x.wert || x.def.id.localeCompare(y.def.id));
  if (nachWunsch[0]) dazu({ text: t("abk.weg.zusaetzlich", { land: l.name, label: nachWunsch[0].label }), angebot: mit(nachWunsch[0].def.id), art: "zusatz", hinweis: t("welle_h6.weg.wunsch", { land: l.name }) });
  // 2. Verzicht auf die Forderung, die die Gegenseite am meisten kostet
  const teuerste = a.will
    .map((id) => klauselSicht(w, a.land, id))
    .filter((k): k is KlauselSicht => !!k && !k.rot && k.wert < 0)
    .sort((x, y) => x.wert - y.wert || x.def.id.localeCompare(y.def.id))[0];
  if (teuerste) {
    const b = { ...a, will: a.will.filter((x) => x !== teuerste.def.id) };
    if (b.gibt.length + b.will.length > 0 && stimmtZu(w, b)) dazu({ text: t("welle_h6.weg.verzicht", { land: l.name, label: teuerste.label }), angebot: b, art: "verzicht", hinweis: t("welle_h6.weg.verzicht_hinweis", { land: l.name }) });
  }
  // 3. Die für die Türkei günstigste Leistung, die gerade reicht
  const nachPreis = [...passend].sort((x, y) => eigenerPreis(x.def) - eigenerPreis(y.def) || x.wert - y.wert || x.def.id.localeCompare(y.def.id));
  if (nachPreis[0]) dazu({ text: t("abk.weg.zusaetzlich", { land: l.name, label: nachPreis[0].label }), angebot: mit(nachPreis[0].def.id), art: "zusatz", hinweis: t("welle_h6.weg.guenstig") });
  // 4. Reicht keine einzelne Leistung: die zwei größten Wünsche, die zusammen reichen
  if (!passend.length) {
    const top = [...frei].sort((x, y) => y.wert - x.wert || x.def.id.localeCompare(y.def.id)).slice(0, 5);
    paar: for (let i = 0; i < top.length; i++) {
      for (let j = i + 1; j < top.length; j++) {
        if (stimmtZu(w, mit(top[i]!.def.id, top[j]!.def.id))) {
          dazu({ text: t("welle_h6.weg.zwei", { land: l.name, a: top[i]!.label, b: top[j]!.label }), angebot: mit(top[i]!.def.id, top[j]!.def.id), art: "zwei", hinweis: t("welle_h6.weg.wunsch", { land: l.name }) });
          break paar;
        }
      }
    }
  }
  // 5. Eine kürzere Bindung (nur, wenn der Saldo schon stimmt und nur die Laufzeit stört)
  for (const j of VERTRAGSLAUFZEITEN) {
    if (j >= a.jahre) continue;
    const b = { ...a, jahre: j };
    if (stimmtZu(w, b)) {
      dazu({ text: t("abk.weg.kuerzer", { land: l.name, jahre: j }), angebot: b, art: "kuerzer" });
      break;
    }
  }
  return out.slice(0, 3);
}

export function bewerte(w: World, a: Angebot): Bewertung {
  const pk = pkFuer(a);
  if (a.gibt.length + a.will.length === 0) {
    const bz = PROFILE[a.land] ? beziehungZu(w, a.land).punkte : 0;
    return { urteil: "leer", punkte: 0, grenze: margeFuer(a.jahre, bz), gibtWert: 0, willKosten: 0, beziehung: bz, gespraech: bz >= ABWAEGUNG.gespraechAb, stimmung: 0, gruende: [], gegenangebote: [], pk };
  }
  const x = abwaegung(w, a);
  const gruende = [...x.gruende].sort((p, q) => Math.abs(q.wert) - Math.abs(p.wert));
  const basis = { punkte: x.saldo, grenze: x.marge, gibtWert: x.gibtWert, willKosten: x.willKosten, beziehung: x.beziehung, gespraech: x.gespraech, gruende, pk };
  if (x.veto) return { ...basis, urteil: "veto", stimmung: 0, veto: x.veto, gegenangebote: [] };
  const d = x.saldo - x.marge;
  if (!x.gespraech) return { ...basis, urteil: "ablehnung", stimmung: 0, gegenangebote: [] };
  if (d >= -1e-9) return { ...basis, urteil: "zustimmung", stimmung: 4, gegenangebote: [] };
  const gegen = gegenangebote(w, a);
  return { ...basis, urteil: gegen.length ? "gegenangebot" : "ablehnung", stimmung: stimmungFuer(d), gegenangebote: gegen };
}

// ---------------------------------------------------------------------------
// Verhandeln und Abschließen

export interface Ergebnis {
  ok: boolean;
  urteil: Urteil | "gesperrt" | "kein-kapital";
  text: string;
  why?: string;
  bewertung?: Bewertung;
  vertrag?: Vertrag;
}

const nameKlauseln = (w: World, landId: string, ids: string[]) => ids.map((id) => klauselSicht(w, landId, id)?.label ?? KLAUSEL_NACH_ID[id]?.label ?? id).join(", ");

export function vertragsName(w: World, v: Vertrag): string {
  const alle = [...v.gibt, ...v.will];
  const erste = klauselSicht(w, v.land, alle[0] ?? "")?.label ?? KLAUSEL_NACH_ID[alle[0] ?? ""]?.label ?? alle[0] ?? "Vertrag";
  return alle.length > 1 ? `${erste} und ${alle.length - 1} weitere Klausel${alle.length > 2 ? "n" : ""}` : erste;
}

/** Sperrfrist nach einer Zurückweisung, in Tagen; 0, wenn das Land verhandelt. */
export function sperreRest(w: World, landId: string): number {
  return Math.max(0, (weltZustand(w)[landId]?.sperreBis ?? 0) - w.day);
}

/** Legt einen Vertrag an und wendet Abschlusswirkungen an; das Kapital wird vom Aufrufer abgezogen. */
export function schliesse(w: World, a: Angebot): Vertrag {
  const l = land(a.land);
  const z = weltZustand(w)[a.land]!;
  const v: Vertrag = {
    id: `v-${a.land}-${w.day}-${(z.vertraege ??= []).length}`,
    land: a.land,
    gibt: [...a.gibt],
    will: [...a.will],
    jahre: a.jahre,
    seit: w.day,
    ablauf: w.day + a.jahre * TAGE_JAHR,
    status: "laeuft",
    verstoesse: 0,
    letztePruefung: w.day,
  };
  z.vertraege.push(v);
  // „ende_sperre“ beendet eine bestehende Handelssperre des Landes (Stand 30.09.2026: Israel); danach sind Handelsaktionen und -klauseln frei
  if (a.gibt.includes("ende_sperre")) z.handelssperre = false;
  // „Sanktionen aufheben“ hebt die Sanktion dieses Partners tatsächlich auf (früher wirkten nur Netzstützen, die Sanktion blieb)
  if (a.will.includes("w_sanktion")) {
    const az = aussenZustand(w);
    const weg = az.sanktionen.filter((x) => x.von === a.land);
    if (weg.length) {
      az.sanktionen = az.sanktionen.filter((x) => x.von !== a.land);
      addLog(w, "entscheidung", t("aussen.sanktion.vertrag_aufgehoben", { land: l.name }), t("aussen.sanktion.vertrag_aufgehoben.warum"));
    }
  }
  landAendern(w, a.land, { vertrauen: 3, konflikt: -3 }, `Vertrag über ${nameKlauseln(w, a.land, [...a.gibt, ...a.will])}`);
  for (const id of [...a.gibt, ...a.will]) {
    const def = KLAUSEL_NACH_ID[id];
    if (!def) continue;
    for (const e of def.abschluss ?? []) wendeEffekt(w, e);
    if (def.land) landAendern(w, a.land, def.land);
    for (const x of AUSSTRAHLUNG[`${id}@${a.land}`] ?? []) landAendern(w, x.land, { [x.dim]: x.d }, x.text);
  }
  z.abkommen.push(`Vertrag ${w.date.slice(0, 4)}: ${nameKlauseln(w, a.land, [...a.gibt, ...a.will])} (${a.jahre} Jahre)`);
  addLog(w, "entscheidung", t("abkommen.log.geschlossen", { dat: l.dat, land: l.name, klauseln: nameKlauseln(w, a.land, [...a.gibt, ...a.will]) }), t("abkommen.log.geschlossen_warum", { jahre: a.jahre }));
  return v;
}

/** Ob das Angebot formal in Ordnung ist: ein Satz mit dem Mangel, sonst `null`. */
export function pruefeAngebot(w: World, a: Angebot): string | null {
  if (!PROFILE[a.land]) return t("abk.pruef.kein_land");
  if (!VERTRAGSLAUFZEITEN.includes(a.jahre)) return t("abk.pruef.laufzeit");
  const ids = [...a.gibt, ...a.will];
  if (ids.length === 0) return t("abk.pruef.leer");
  if (new Set(ids).size !== ids.length) return t("abk.pruef.doppelt");
  for (const id of ids) if (!KLAUSEL_NACH_ID[id]) return `Die Klausel „${id}“ gibt es nicht.`;
  for (const id of a.gibt) if (KLAUSEL_NACH_ID[id]?.seite !== "gibt") return t("abk.pruef.seite_gibt");
  for (const id of a.will) if (KLAUSEL_NACH_ID[id]?.seite !== "will") return t("abk.pruef.seite_will");
  for (const id of ids) {
    const k = klauselSicht(w, a.land, id);
    if (!k) return t("abk.pruef.klausel", { land: land(a.land).name, label: KLAUSEL_NACH_ID[id]?.label ?? id });
    if (k.gesperrt) return `„${k.label}“: ${k.gesperrt}`;
  }
  return null;
}

/** Ein Angebot unterbreiten: kostet Kapital, die Gegenseite antwortet. Zustimmung schließt den Vertrag. */
export function verhandle(w: World, a: Angebot): Ergebnis {
  const spiel = w.spiel;
  if (!spiel) return { ok: false, urteil: "leer", text: t("abk.leer") };
  const problem = pruefeAngebot(w, a);
  if (problem) return { ok: false, urteil: "leer", text: problem };
  const l = land(a.land);
  const rest = sperreRest(w, a.land);
  if (rest > 0) return { ok: false, urteil: "gesperrt", text: t("abk.urteil.gesperrt", { land: l.name, tage: rest }) };
  const b = bewerte(w, a);
  if (!kannZahlen(spiel.kapital, b.pk)) return { ok: false, urteil: "kein-kapital", text: t("abk.kein_kapital"), bewertung: b };
  spiel.kapital -= b.pk;
  const z = weltZustand(w)[a.land]!;
  switch (b.urteil) {
    case "zustimmung": {
      const v = schliesse(w, a);
      return { ok: true, urteil: "zustimmung", text: t("abk.urteil.zustimmung", { land: l.name, jahre: a.jahre }), why: t("abk.urteil.zustimmung_warum", { pk: b.pk }), bewertung: b, vertrag: v };
    }
    case "gegenangebot":
      return { ok: false, urteil: "gegenangebot", text: t("abk.urteil.gegenangebot", { land: l.name }), why: t("abk.urteil.gegenangebot_warum", { pk: b.pk }), bewertung: b };
    case "veto":
      landAendern(w, a.land, { vertrauen: -2 }, "Ein Angebot über eine Rote Linie");
      z.sperreBis = w.day + SPERRE_TAGE;
      // Merker für die Eigeninitiative (sim/initiative.ts): Eine bedrohte Rote Linie ist der stärkste Treiber
      z.rotBedroht = w.day;
      return { ok: false, urteil: "veto", text: t("abk.urteil.veto", { land: l.name, veto: b.veto ?? "" }), why: t("abk.urteil.veto_warum", { pk: b.pk, tage: SPERRE_TAGE }), bewertung: b };
    default:
      z.sperreBis = w.day + SPERRE_TAGE / 3;
      return { ok: false, urteil: "ablehnung", text: t("abk.urteil.ablehnung", { land: l.name }), why: t("abk.urteil.ablehnung_warum", { pk: b.pk, tage: Math.round(SPERRE_TAGE / 3) }), bewertung: b };
  }
}

/** Ein Gegenangebot annehmen: kostet nichts mehr, das Land hat schon zugestimmt. */
export function nimmGegenangebot(w: World, a: Angebot): Ergebnis {
  const spiel = w.spiel;
  if (!spiel) return { ok: false, urteil: "leer", text: t("abk.leer") };
  const problem = pruefeAngebot(w, a);
  if (problem) return { ok: false, urteil: "leer", text: problem };
  const b = bewerte(w, a);
  const l = land(a.land);
  if (b.urteil !== "zustimmung") return { ok: false, urteil: b.urteil, text: t("abk.urteil.gegen_weg", { land: l.name }), bewertung: b };
  // Nur der politische Preis der Klauseln im eigenen Land kommt zum Sockel hinzu
  const preis = [...a.gibt, ...a.will].reduce((s, id) => s + (KLAUSEL_NACH_ID[id]?.pk ?? 0), 0);
  if (!kannZahlen(spiel.kapital, preis)) return { ok: false, urteil: "kein-kapital", text: t("abk.kein_kapital"), bewertung: b };
  spiel.kapital -= preis;
  const v = schliesse(w, a);
  return { ok: true, urteil: "zustimmung", text: t("abk.urteil.einig", { land: l.name, jahre: a.jahre }), why: preis ? t("abk.urteil.einig_preis", { pk: preis }) : t("abk.urteil.einig_frei"), bewertung: b, vertrag: v };
}

// ---------------------------------------------------------------------------
// Laufender Vertrag: Monat, Jahresprüfung, Ablauf, Kündigung

/** Ob der Partner seine Seite hält: Er tut es, solange Vertrauen und Ruhe da sind. */
export function partnerVerlaesslich(w: World, landId: string): boolean {
  return vertrauenZu(w, landId) >= 25 && weltZustand(w)[landId]!.konflikt < 85;
}

function beende(w: World, v: Vertrag, status: Vertrag["status"], text: string): void {
  v.status = status;
  v.ende = text;
}

function pruefeJahr(w: World, v: Vertrag): void {
  const l = land(v.land);
  const z = weltZustand(w)[v.land]!;
  v.letztePruefung = w.day;
  const verfehlt: string[] = [];
  for (const id of [...v.gibt, ...v.will]) {
    const def = KLAUSEL_NACH_ID[id];
    if (!def?.pflicht) continue;
    if (!pruefeBedingung(w, def.pflicht).erfuellt) verfehlt.push(def.pflichtText ?? def.label);
  }
  if (verfehlt.length === 0) {
    landAendern(w, v.land, { vertrauen: 2 }, "Jahresprüfung des Vertrags bestanden");
    addLog(w, "entscheidung", t("abkommen.log.bestanden", { dat: l.dat, land: l.name }), t("abkommen.log.bestanden_warum"));
    return;
  }
  v.verstoesse += 1;
  landAendern(w, v.land, { vertrauen: -6, konflikt: 3 }, `Verstoß gegen den Vertrag: ${verfehlt.join("; ")}`);
  if (v.verstoesse >= 2) {
    beende(w, v, "gebrochen", `Zwei Jahre in Folge verfehlt: ${verfehlt.join("; ")}`);
    landAendern(w, v.land, { vertrauen: -12, konflikt: 6 }, "Der Vertrag ist gebrochen");
    wirke(w, "ansehen", -2);
    z.bruch = (z.bruch ?? 0) + BRUCH_STRAFE;
    addLog(w, "entscheidung", t("abkommen.log.gebrochen", { dat: l.dat, land: l.name }), t("abkommen.log.gebrochen_warum", { verfehlt: verfehlt.join("; "), land: l.name }));
  } else {
    addLog(w, "entscheidung", t("abkommen.log.verstoss", { dat: l.dat, land: l.name }), t("abkommen.log.verstoss_warum", { verfehlt: verfehlt.join("; ") }));
  }
}

/** Einmal im Monat: Dauerwirkungen, Jahresprüfung, Ablauf; die Erinnerung an Brüche klingt ab. */
export function abkommenMonat(w: World, _rng?: Rng): void {
  if (!w.spiel?.welt) return;
  for (const id of Object.keys(w.spiel.welt)) {
    const z = w.spiel.welt[id]!;
    if (z.bruch) z.bruch = Math.max(0, z.bruch - 0.15);
    for (const v of z.vertraege ?? []) {
      if (v.status !== "laeuft") continue;
      const f = LAUFZEIT_FAKTOR[v.jahre];
      const verlaesslich = partnerVerlaesslich(w, id);
      for (const cid of [...v.gibt, ...v.will]) {
        const def = KLAUSEL_NACH_ID[cid];
        if (!def) continue;
        // Was der Partner liefert, ruht, solange er unzuverlässig ist
        const g = def.seite === "will" && !verlaesslich ? 0.4 : 1;
        for (const e of def.dauer ?? []) wendeEffekt(w, e, f * g);
      }
      if (w.day >= v.ablauf) {
        z.gehalten = (z.gehalten ?? 0) + (v.verstoesse === 0 ? 1 : 0);
        beende(w, v, "ausgelaufen", "Die Laufzeit ist zu Ende.");
        landAendern(w, id, { vertrauen: v.verstoesse === 0 ? 2 : 0 });
        addLog(w, "entscheidung", t("abkommen.log.ausgelaufen", { dat: land(id).dat, land: land(id).name }), t(v.verstoesse === 0 ? "abkommen.log.ausgelaufen_gehalten" : "abkommen.log.ausgelaufen_verstoesse"));
        continue;
      }
      if (w.day - v.letztePruefung >= TAGE_JAHR) pruefeJahr(w, v);
    }
  }
}

/** Kündigen: Nach einem Drittel der Laufzeit ordentlich (kleiner Vertrauensverlust), früher gilt es als Bruch. */
export function kuendige(w: World, landId: string, vertragId: string): { ok: boolean; text: string; why?: string } {
  const v = vertraegeVon(w, landId).find((x) => x.id === vertragId);
  if (!v || v.status !== "laeuft") return { ok: false, text: t("abk.weg") };
  const l = land(landId);
  const z = weltZustand(w)[landId]!;
  const fruehesten = v.seit + Math.floor((v.ablauf - v.seit) / 3);
  if (w.day >= fruehesten) {
    beende(w, v, "gekuendigt", "Ordentlich gekündigt.");
    landAendern(w, landId, { vertrauen: -4 }, "Kündigung eines Vertrags");
    addLog(w, "entscheidung", t("abkommen.log.gekuendigt", { dat: l.dat, land: l.name }), t("abkommen.log.gekuendigt_warum"));
    return { ok: true, text: t("abk.gekuendigt", { dat: l.dat, land: l.name }), why: t("abk.gekuendigt_warum") };
  }
  beende(w, v, "gebrochen", "Vorzeitig ausgestiegen.");
  landAendern(w, landId, { vertrauen: -12, konflikt: 6 }, "Vorzeitiger Ausstieg aus einem Vertrag");
  wirke(w, "ansehen", -2);
  z.bruch = (z.bruch ?? 0) + BRUCH_STRAFE;
  addLog(w, "entscheidung", t("abkommen.log.ausstieg", { dat: l.dat, land: l.name }), t("abkommen.log.ausstieg_warum"));
  return { ok: true, text: t("abk.ausstieg", { dat: l.dat, land: l.name }), why: t("abk.ausstieg_warum") };
}

/** Ein laufender Vertrag ohne Verstoß lässt sich vor dem Ablauf um weitere Jahre verlängern; der Partner muss ihm noch trauen. */
export const VERLAENGERUNG_PK: Record<Laufzeit, number> = { 2: 1, 5: 3, 10: 6 };

export function verlaengere(w: World, landId: string, vertragId: string, jahre: Laufzeit, bezahlen = true): { ok: boolean; text: string; why?: string } {
  const spiel = w.spiel;
  const v = vertraegeVon(w, landId).find((x) => x.id === vertragId);
  if (!spiel || !v || v.status !== "laeuft") return { ok: false, text: t("abk.weg") };
  const l = land(landId);
  if (v.verstoesse > 0) return { ok: false, text: t("abk.verl.verstoesse", { land: l.name }) };
  if (!partnerVerlaesslich(w, landId) || vertrauenZu(w, landId) < 35) return { ok: false, text: t("abk.verl.vertrauen", { land: l.name }) };
  const pk = VERLAENGERUNG_PK[jahre];
  if (bezahlen) {
    if (!kannZahlen(spiel.kapital, pk)) return { ok: false, text: t("abk.kein_kapital") };
    spiel.kapital -= pk;
  }
  v.ablauf += jahre * TAGE_JAHR;
  v.jahre = (v.jahre >= jahre ? v.jahre : jahre) as Laufzeit;
  landAendern(w, landId, { vertrauen: 3 }, "Vertrag verlängert");
  addLog(w, "entscheidung", t("abkommen.log.verlaengert", { dat: l.dat, land: l.name, jahre }), t("abkommen.log.verlaengert_warum"));
  return { ok: true, text: t("abk.verl.ok", { dat: l.dat, land: l.name, jahre }), why: bezahlen ? t("abk.kostet", { pk }) : t("abkommen.log.verlaengert_warum") };
}

/**
 * Ein Paket, das der Partner von sich aus vorschlagen würde: sein größter Wunsch an die Türkei gegen eine Gegenleistung, die er sich
 * leisten kann. Er schlägt nur vor, was er selbst annehmen würde (dieselbe Abwägung wie am Tisch), und legt eine Gegenleistung bei,
 * wo es eine gibt: Ein Vorschlag ist kein verkleidetes Verlangen. Unter den Gegenleistungen, die sein Saldo trägt, nimmt er die,
 * die der Türkei am meisten bringt (sie kostet ihn am meisten); so wird der Vorschlag annehmbar, ohne dass er draufzahlt.
 * `null`, wenn er keinen Wunsch hat, keine Gegenleistung tragen kann oder dem Paket selbst nicht zustimmen würde.
 */
export function vorschlagVomPartner(w: World, landId: string): Angebot | null {
  const ks = klauselnFuer(w, landId).filter((k) => !k.gesperrt && !k.rot);
  const gibt = ks.filter((k) => k.def.seite === "gibt" && k.wert > 0).sort((a, b) => b.wert - a.wert || a.def.id.localeCompare(b.def.id))[0];
  if (!gibt) return null;
  const wills = ks.filter((k) => k.def.seite === "will").sort((a, b) => a.wert - b.wert || a.def.id.localeCompare(b.def.id));
  for (const will of wills) {
    const a: Angebot = { land: landId, gibt: [gibt.def.id], will: [will.def.id], jahre: 5 };
    if (bewerte(w, a).urteil === "zustimmung") return a;
  }
  // Ohne tragbare Gegenleistung kein Vorschlag: Was der Partner dann will, kommt als Forderung (Vorlage „land_fordert“), nicht als Angebot
  return null;
}

/** Wann der früheste ordentliche Ausstieg möglich ist. */
export function fruehesterAusstieg(v: Vertrag): number {
  return v.seit + Math.floor((v.ablauf - v.seit) / 3);
}

// ---------------------------------------------------------------------------
// Vermittlung zwischen zwei Dritten: eine Lücke, die kein Konkurrenzspiel besetzt (RECHERCHE §6).
// AUS-4 (VERBESSERUNGSPLAN_2026-09-30): Das vertiefte Modell mit ZOPA, Reifegrad, Spoilern und Garantien
// liegt in sim/vermittlung.ts (Daten in data/konflikte.ts); diese Hülle hält die ursprüngliche
// Schnittstelle (VermittlungDef/vermittlungen/vermittle) für Bestandsaufrufer und ältere Tests.

import { KONFLIKTE } from "../data/konflikte";
import { konfliktSichten, vermittle as vermittleKonflikt } from "./vermittlung";

export interface VermittlungDef {
  id: string;
  titel: string;
  a: string;
  b: string;
  text: string;
  /** Was das Paket enthält */
  paket: string[];
  pk: number;
  abkuehlung: number;
  /** Mindestvertrauen beider Seiten in die Türkei */
  minA: number;
  minB: number;
}

export const VERMITTLUNGEN: VermittlungDef[] = KONFLIKTE.map((k) => ({
  id: k.id,
  titel: k.titel,
  a: k.a.land ?? "",
  b: k.b.land ?? "",
  text: k.text,
  paket: k.paket,
  pk: k.pk,
  abkuehlung: k.abkuehlung,
  minA: k.minA,
  minB: k.minB,
}));

export interface VermittlungSicht {
  def: VermittlungDef;
  moeglich: boolean;
  grund?: string;
  /** Aussicht in Prozent */
  aussicht: number;
}

export function vermittlungen(w: World): VermittlungSicht[] {
  return konfliktSichten(w).map((s) => ({
    def: VERMITTLUNGEN.find((d) => d.id === s.def.id)!,
    moeglich: s.moeglich,
    ...(s.grund ? { grund: s.grund } : {}),
    aussicht: s.aussicht,
  }));
}

export function vermittle(w: World, id: string, rng: Rng): { ok: boolean; text: string; why?: string } {
  return vermittleKonflikt(w, id, rng);
}

// ---------------------------------------------------------------------------
// Zusammenfassung für Anzeigen und KI

export function abkommenSumme(w: World): { laufend: number; gebrochen: number } {
  let laufend = 0;
  let gebrochen = 0;
  for (const id of Object.keys(weltZustand(w))) {
    for (const v of weltZustand(w)[id]!.vertraege ?? []) {
      if (v.status === "laeuft") laufend++;
      else if (v.status === "gebrochen") gebrochen++;
    }
  }
  return { laufend, gebrochen };
}

export type { Dimension };
