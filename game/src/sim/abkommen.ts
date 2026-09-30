// Der Verhandlungstisch: Verträge mit anderen Ländern aus Klauseln (data/abkommen.ts).
// Die Gegenseite bewertet das ganze Paket: was ihr jede Klausel wert ist oder kostet, dazu Vertrauen, offener Streit, Abhängigkeit
// (Hebel), die Erinnerung an gebrochene und gehaltene Verträge und die Länge der Bindung. Erreicht das Paket die Schwelle, stimmt sie
// zu; knapp darunter macht sie ein Gegenangebot mit genau einer Änderung; eine Rote Linie ist ein Veto. Ein laufender Vertrag wirkt
// jeden Monat im Land, wird jedes Jahr geprüft und kann gebrochen werden; ein Bruch bleibt in Erinnerung.
// Alle Zahlen sind Spielparameter (Platzhalter der Kalibrierung), keine Tatsachenbehauptungen.

import { KLAUSEL_NACH_ID, AUSSTRAHLUNG, PROFILE, VERTRAGSLAUFZEITEN, type KlauselDef, type Laufzeit } from "../data/abkommen";
import { dimensionZu, land, landAendern, vertrauenZu, weltZustand, type Dimension } from "./laender";
import { effektZeile, wendeEffekt, type EffektZeile } from "./reich";
import { pruefeBedingung } from "./programme";
import { kannZahlen } from "./kapital";
import { addLog } from "./log";
import { wirke, vertrauenAendern } from "./wirkung";
import { clamp } from "./economy";
import { NET } from "./modell";
import { nationalAverage } from "./netz";
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
    if (aktiv.has(id)) gesperrt = "Dazu läuft schon ein Vertrag.";
    else if (def.mindestens && dimensionZu(w, landId, def.mindestens.dim) < def.mindestens.wert) gesperrt = def.mindestens.text;
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

export interface Grund {
  text: string;
  /** Beitrag zur Bewertung, positiv für den Partner */
  wert: number;
  art: "plus" | "minus" | "info";
}

export type Urteil = "leer" | "zustimmung" | "gegenangebot" | "ablehnung" | "veto";

export interface Gegenangebot {
  text: string;
  angebot: Angebot;
}

export interface Bewertung {
  urteil: Urteil;
  punkte: number;
  grenze: number;
  /** 0 ablehnend bis 4 einverstanden */
  stimmung: 0 | 1 | 2 | 3 | 4;
  gruende: Grund[];
  veto?: string;
  gegenangebote: Gegenangebot[];
  /** Kapital, das die Verhandlung und die Klauseln im Land kosten */
  pk: number;
}

export const STIMMUNG_WORT = ["Ablehnend", "Skeptisch", "Zögernd", "Geneigt", "Einverstanden"] as const;

/** Kapital für einen Vertrag: ein Sockel für die Verhandlung, dazu der politische Preis der Klauseln im eigenen Land. */
export function pkFuer(a: Angebot): number {
  const n = a.gibt.length + a.will.length;
  const klauseln = [...a.gibt, ...a.will].reduce((s, id) => s + (KLAUSEL_NACH_ID[id]?.pk ?? 0), 0);
  return n === 0 ? 0 : 2 + Math.ceil(n / 2) + klauseln;
}

function grenzeFuer(jahre: Laufzeit): number {
  return 4 + (jahre - 2) * 0.35;
}

function beitraege(w: World, a: Angebot): { punkte: number; gruende: Grund[]; veto?: string } {
  const p = PROFILE[a.land];
  const gruende: Grund[] = [];
  if (!p) return { punkte: -99, gruende };
  const l = land(a.land);
  const z = weltZustand(w)[a.land]!;
  let punkte = 0;
  let veto: string | undefined;
  for (const id of [...a.gibt, ...a.will]) {
    const k = klauselSicht(w, a.land, id);
    if (!k) {
      gruende.push({ text: `${l.name} verhandelt darüber nicht.`, wert: -20, art: "minus" });
      punkte -= 20;
      continue;
    }
    if (k.rot) veto = k.rotText ?? `${l.name} nimmt „${k.label}“ nicht an.`;
    const gibt = k.def.seite === "gibt";
    if (k.wert >= 0) gruende.push({ text: gibt ? `„${k.label}“: ${l.name} will das.` : `„${k.label}“ kostet ${l.name} nichts.`, wert: k.wert, art: "plus" });
    else if (!k.rot) gruende.push({ text: `„${k.label}“ kostet ${l.name} etwas.`, wert: k.wert, art: "minus" });
    else gruende.push({ text: `„${k.label}“ ist eine Rote Linie.`, wert: 0, art: "minus" });
    if (!k.rot) punkte += k.wert;
  }
  const v = vertrauenZu(w, a.land);
  const basis = (v - 45) / 5;
  gruende.push({ text: basis >= 0 ? `Vertrauen zur Türkei trägt (${Math.round(v)}).` : `Das Vertrauen ist gering (${Math.round(v)}).`, wert: basis, art: basis >= 0 ? "plus" : "minus" });
  const konf = -(z.konflikt - 40) / 8;
  if (Math.abs(konf) >= 1) gruende.push({ text: konf < 0 ? "Offener Streit belastet die Gespräche." : "Es gibt kaum offenen Streit.", wert: konf, art: konf < 0 ? "minus" : "plus" });
  if (p.hebel !== 0) gruende.push({ text: p.hebelText, wert: p.hebel, art: p.hebel > 0 ? "plus" : "minus" });
  const bruch = -(z.bruch ?? 0);
  if (bruch < -0.3) gruende.push({ text: `Die Erinnerung an einen gebrochenen Vertrag wirkt nach.`, wert: bruch, art: "minus" });
  const gehalten = Math.min(3, (z.gehalten ?? 0) * 1.5);
  if (gehalten > 0) gruende.push({ text: "Frühere Verträge hat die Türkei gehalten.", wert: gehalten, art: "plus" });
  const gegenseitig = a.gibt.length > 0 && a.will.length > 0 ? 2 : 0;
  if (gegenseitig) gruende.push({ text: "Ein ausgewogenes Paket: Geben und Nehmen.", wert: gegenseitig, art: "plus" });
  else if (a.will.length > 0 && a.gibt.length === 0) gruende.push({ text: "Sie verlangen nur, ohne etwas zu bieten.", wert: 0, art: "info" });
  punkte += basis + konf + p.hebel + bruch + gehalten + gegenseitig;
  return { punkte, gruende, ...(veto ? { veto } : {}) };
}

function stimmungFuer(d: number): 0 | 1 | 2 | 3 | 4 {
  return d >= 0 ? 4 : d >= -3 ? 3 : d >= -7 ? 2 : d >= -12 ? 1 : 0;
}

/** Kosten einer Klausel für den Spieler, für die Reihenfolge der Gegenangebote: politischer Preis und schädliche Wirkungen. */
function eigenerPreis(def: KlauselDef): number {
  const schlecht = [...(def.abschluss ?? []), ...(def.dauer ?? [])].map((e) => effektZeile(e, "dauer")).filter((z) => z && !z.gut).length;
  return (def.pk ?? 0) + schlecht * 0.6;
}

function gegenangebote(w: World, a: Angebot): Gegenangebot[] {
  const l = land(a.land);
  const kandidaten: { angebot: Angebot; preis: number; text: string; punkte: number }[] = [];
  const mitGrenze = (b: Angebot) => beitraege(w, b).punkte - grenzeFuer(b.jahre);
  // 1. Kürzere Bindung
  for (const j of VERTRAGSLAUFZEITEN) {
    if (j >= a.jahre) continue;
    const b = { ...a, jahre: j };
    if (mitGrenze(b) >= 0) kandidaten.push({ angebot: b, preis: 0.5, text: `${l.name} stimmt zu, wenn die Laufzeit auf ${j} Jahre verkürzt wird.`, punkte: mitGrenze(b) });
  }
  // 2. Ein weiteres Angebot der Türkei
  for (const k of klauselnFuer(w, a.land)) {
    if (k.def.seite !== "gibt" || k.gesperrt || k.rot || a.gibt.includes(k.def.id) || k.wert <= 0) continue;
    const b = { ...a, gibt: [...a.gibt, k.def.id] };
    if (mitGrenze(b) >= 0) kandidaten.push({ angebot: b, preis: 1 + eigenerPreis(k.def), text: `${l.name} stimmt zu, wenn Sie zusätzlich „${k.label}“ anbieten.`, punkte: mitGrenze(b) });
  }
  // 3. Verzicht auf eine Forderung
  for (const id of a.will) {
    const k = klauselSicht(w, a.land, id);
    if (!k) continue;
    const b = { ...a, will: a.will.filter((x) => x !== id) };
    if ((b.gibt.length || b.will.length) && mitGrenze(b) >= 0) kandidaten.push({ angebot: b, preis: 2 + Math.abs(k.wert) * 0.3, text: `${l.name} stimmt zu, wenn Sie auf „${k.label}“ verzichten.`, punkte: mitGrenze(b) });
  }
  kandidaten.sort((x, y) => x.preis - y.preis || x.punkte - y.punkte);
  const out = kandidaten.slice(0, 3).map((k) => ({ text: k.text, angebot: k.angebot }));
  if (out.length) return out;
  // 4. Zwei Änderungen: die schwerste Forderung streichen und das beste Angebot dazulegen
  const forderungen = a.will.map((id) => ({ id, k: klauselSicht(w, a.land, id) })).filter((x) => x.k && !x.k.rot).sort((x, y) => x.k!.wert - y.k!.wert);
  const angebote = klauselnFuer(w, a.land).filter((k) => k.def.seite === "gibt" && !k.gesperrt && !k.rot && k.wert > 0 && !a.gibt.includes(k.def.id)).sort((x, y) => y.wert - x.wert);
  if (forderungen[0] && angebote[0]) {
    const b = { ...a, will: a.will.filter((x) => x !== forderungen[0]!.id), gibt: [...a.gibt, angebote[0].def.id] };
    if (mitGrenze(b) >= 0) return [{ text: `${l.name} stimmt zu, wenn Sie auf „${forderungen[0].k!.label}“ verzichten und „${angebote[0].label}“ anbieten.`, angebot: b }];
  }
  return [];
}

export function bewerte(w: World, a: Angebot): Bewertung {
  const grenze = grenzeFuer(a.jahre);
  const pk = pkFuer(a);
  if (a.gibt.length + a.will.length === 0) return { urteil: "leer", punkte: 0, grenze, stimmung: 0, gruende: [], gegenangebote: [], pk };
  const { punkte, gruende, veto } = beitraege(w, a);
  gruende.sort((x, y) => Math.abs(y.wert) - Math.abs(x.wert));
  if (veto) return { urteil: "veto", punkte, grenze, stimmung: 0, gruende, veto, gegenangebote: [], pk };
  const d = punkte - grenze;
  if (d >= 0) return { urteil: "zustimmung", punkte, grenze, stimmung: stimmungFuer(d), gruende, gegenangebote: [], pk };
  const gegen = d >= -6 ? gegenangebote(w, a) : [];
  return { urteil: gegen.length ? "gegenangebot" : "ablehnung", punkte, grenze, stimmung: stimmungFuer(d), gruende, gegenangebote: gegen, pk };
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

const nameKlauseln = (w: World, landId: string, ids: string[]) => ids.map((id) => klauselSicht(w, landId, id)?.label ?? id).join(", ");

export function vertragsName(w: World, v: Vertrag): string {
  const alle = [...v.gibt, ...v.will];
  const erste = klauselSicht(w, v.land, alle[0] ?? "")?.label ?? alle[0] ?? "Vertrag";
  return alle.length > 1 ? `${erste} und ${alle.length - 1} weitere Klausel${alle.length > 2 ? "n" : ""}` : erste;
}

/** Sperrfrist nach einer Zurückweisung, in Tagen; 0, wenn das Land verhandelt. */
export function sperreRest(w: World, landId: string): number {
  return Math.max(0, (weltZustand(w)[landId]?.sperreBis ?? 0) - w.day);
}

/** Legt einen Vertrag an und wendet Abschlusswirkungen an; das Kapital wird vom Aufrufer abgezogen. */
function schliesse(w: World, a: Angebot): Vertrag {
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
  landAendern(w, a.land, { vertrauen: 3, konflikt: -3 }, `Vertrag über ${nameKlauseln(w, a.land, [...a.gibt, ...a.will])}`);
  for (const id of [...a.gibt, ...a.will]) {
    const def = KLAUSEL_NACH_ID[id];
    if (!def) continue;
    for (const e of def.abschluss ?? []) wendeEffekt(w, e);
    if (def.land) landAendern(w, a.land, def.land);
    for (const x of AUSSTRAHLUNG[`${id}@${a.land}`] ?? []) landAendern(w, x.land, { [x.dim]: x.d }, x.text);
  }
  z.abkommen.push(`Vertrag ${w.date.slice(0, 4)}: ${nameKlauseln(w, a.land, [...a.gibt, ...a.will])} (${a.jahre} Jahre)`);
  addLog(w, "entscheidung", `Vertrag mit ${l.dat}: ${nameKlauseln(w, a.land, [...a.gibt, ...a.will])}`, `Laufzeit ${a.jahre} Jahre. Er wirkt jeden Monat, wird jedes Jahr geprüft und bindet beide Seiten.`);
  return v;
}

function pruefeAngebot(w: World, a: Angebot): string | null {
  if (!PROFILE[a.land]) return "Mit diesem Land gibt es keine Verhandlungen.";
  if (!VERTRAGSLAUFZEITEN.includes(a.jahre)) return "Diese Laufzeit gibt es nicht.";
  const ids = [...a.gibt, ...a.will];
  if (ids.length === 0) return "Ein Vertrag braucht mindestens eine Klausel.";
  if (new Set(ids).size !== ids.length) return "Eine Klausel kann nur einmal im Vertrag stehen.";
  for (const id of a.gibt) if (KLAUSEL_NACH_ID[id]?.seite !== "gibt") return "Unter „Wir bieten“ steht etwas, das wir verlangen.";
  for (const id of a.will) if (KLAUSEL_NACH_ID[id]?.seite !== "will") return "Unter „Wir verlangen“ steht etwas, das wir bieten.";
  for (const id of ids) {
    const k = klauselSicht(w, a.land, id);
    if (!k) return `${land(a.land).name} verhandelt nicht über „${KLAUSEL_NACH_ID[id]?.label ?? id}“.`;
    if (k.gesperrt) return `„${k.label}“: ${k.gesperrt}`;
  }
  return null;
}

/** Ein Angebot unterbreiten: kostet Kapital, die Gegenseite antwortet. Zustimmung schließt den Vertrag. */
export function verhandle(w: World, a: Angebot): Ergebnis {
  const spiel = w.spiel;
  if (!spiel) return { ok: false, urteil: "leer", text: "Ohne Spielschleife gibt es keine Verhandlungen." };
  const problem = pruefeAngebot(w, a);
  if (problem) return { ok: false, urteil: "leer", text: problem };
  const l = land(a.land);
  const rest = sperreRest(w, a.land);
  if (rest > 0) return { ok: false, urteil: "gesperrt", text: `${l.name} spricht erst in ${rest} Tagen wieder mit Ihnen.` };
  const b = bewerte(w, a);
  if (!kannZahlen(spiel.kapital, b.pk)) return { ok: false, urteil: "kein-kapital", text: "Dafür fehlt das Kapital.", bewertung: b };
  spiel.kapital -= b.pk;
  const z = weltZustand(w)[a.land]!;
  switch (b.urteil) {
    case "zustimmung": {
      const v = schliesse(w, a);
      return { ok: true, urteil: "zustimmung", text: `${l.name} stimmt zu: Der Vertrag gilt ${a.jahre} Jahre.`, why: `Kostet ${b.pk} Kapital. Er wirkt jeden Monat und wird jedes Jahr geprüft.`, bewertung: b, vertrag: v };
    }
    case "gegenangebot":
      return { ok: false, urteil: "gegenangebot", text: `${l.name} antwortet mit einem Gegenangebot.`, why: `Kostet ${b.pk} Kapital; die Annahme des Gegenangebots kostet nichts mehr.`, bewertung: b };
    case "veto":
      landAendern(w, a.land, { vertrauen: -2 }, "Ein Angebot über eine Rote Linie");
      z.sperreBis = w.day + SPERRE_TAGE;
      return { ok: false, urteil: "veto", text: `${l.name} weist das Angebot zurück: ${b.veto}`, why: `Kostet ${b.pk} Kapital und etwas Vertrauen; das Land spricht ${SPERRE_TAGE} Tage nicht mit Ihnen.`, bewertung: b };
    default:
      z.sperreBis = w.day + SPERRE_TAGE / 3;
      return { ok: false, urteil: "ablehnung", text: `${l.name} lehnt ab: Das Paket ist zu einseitig.`, why: `Kostet ${b.pk} Kapital; ein neues Angebot ist in ${Math.round(SPERRE_TAGE / 3)} Tagen möglich.`, bewertung: b };
  }
}

/** Ein Gegenangebot annehmen: kostet nichts mehr, das Land hat schon zugestimmt. */
export function nimmGegenangebot(w: World, a: Angebot): Ergebnis {
  const spiel = w.spiel;
  if (!spiel) return { ok: false, urteil: "leer", text: "Ohne Spielschleife gibt es keine Verhandlungen." };
  const problem = pruefeAngebot(w, a);
  if (problem) return { ok: false, urteil: "leer", text: problem };
  const b = bewerte(w, a);
  const l = land(a.land);
  if (b.urteil !== "zustimmung") return { ok: false, urteil: b.urteil, text: `${l.name} steht zu dem Gegenangebot nicht mehr.`, bewertung: b };
  // Nur der politische Preis der Klauseln im eigenen Land kommt zum Sockel hinzu
  const preis = [...a.gibt, ...a.will].reduce((s, id) => s + (KLAUSEL_NACH_ID[id]?.pk ?? 0), 0);
  if (!kannZahlen(spiel.kapital, preis)) return { ok: false, urteil: "kein-kapital", text: "Dafür fehlt das Kapital.", bewertung: b };
  spiel.kapital -= preis;
  const v = schliesse(w, a);
  return { ok: true, urteil: "zustimmung", text: `${l.name} und die Türkei einigen sich: Der Vertrag gilt ${a.jahre} Jahre.`, why: preis ? `Der politische Preis im eigenen Land: ${preis} Kapital.` : "Kein weiterer Preis.", bewertung: b, vertrag: v };
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
    addLog(w, "entscheidung", `Vertrag mit ${l.dat}: Die Jahresprüfung ist bestanden.`, "Die Türkei hat alle Pflichten erfüllt: Das Vertrauen wächst.");
    return;
  }
  v.verstoesse += 1;
  landAendern(w, v.land, { vertrauen: -6, konflikt: 3 }, `Verstoß gegen den Vertrag: ${verfehlt.join("; ")}`);
  if (v.verstoesse >= 2) {
    beende(w, v, "gebrochen", `Zwei Jahre in Folge verfehlt: ${verfehlt.join("; ")}`);
    landAendern(w, v.land, { vertrauen: -12, konflikt: 6 }, "Der Vertrag ist gebrochen");
    wirke(w, "ansehen", -2);
    z.bruch = (z.bruch ?? 0) + BRUCH_STRAFE;
    addLog(w, "entscheidung", `Der Vertrag mit ${l.dat} ist gebrochen.`, `Verfehlt: ${verfehlt.join("; ")}. Das Vertrauen bricht ein, und ${l.name} wird künftig härter verhandeln.`);
  } else {
    addLog(w, "entscheidung", `Vertrag mit ${l.dat}: ein Verstoß.`, `Verfehlt: ${verfehlt.join("; ")}. Beim zweiten Mal gilt der Vertrag als gebrochen.`);
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
        addLog(w, "entscheidung", `Vertrag mit ${land(id).dat} ausgelaufen.`, v.verstoesse === 0 ? "Er wurde gehalten; für einen neuen Vertrag zählt das." : "Es gab Verstöße; dafür wird das Land in Erinnerung behalten.");
        continue;
      }
      if (w.day - v.letztePruefung >= TAGE_JAHR) pruefeJahr(w, v);
    }
  }
}

/** Kündigen: Nach einem Drittel der Laufzeit ordentlich (kleiner Vertrauensverlust), früher gilt es als Bruch. */
export function kuendige(w: World, landId: string, vertragId: string): { ok: boolean; text: string; why?: string } {
  const v = vertraegeVon(w, landId).find((x) => x.id === vertragId);
  if (!v || v.status !== "laeuft") return { ok: false, text: "Diesen Vertrag gibt es nicht mehr." };
  const l = land(landId);
  const z = weltZustand(w)[landId]!;
  const fruehesten = v.seit + Math.floor((v.ablauf - v.seit) / 3);
  if (w.day >= fruehesten) {
    beende(w, v, "gekuendigt", "Ordentlich gekündigt.");
    landAendern(w, landId, { vertrauen: -4 }, "Kündigung eines Vertrags");
    addLog(w, "entscheidung", `Vertrag mit ${l.dat} gekündigt.`, "Ordentliche Kündigung: ein kleiner Verlust an Vertrauen, keine Strafe.");
    return { ok: true, text: `Der Vertrag mit ${l.dat} ist gekündigt.`, why: "Ein kleiner Verlust an Vertrauen; die Dauerwirkungen enden." };
  }
  beende(w, v, "gebrochen", "Vorzeitig ausgestiegen.");
  landAendern(w, landId, { vertrauen: -12, konflikt: 6 }, "Vorzeitiger Ausstieg aus einem Vertrag");
  wirke(w, "ansehen", -2);
  z.bruch = (z.bruch ?? 0) + BRUCH_STRAFE;
  addLog(w, "entscheidung", `Ausstieg aus dem Vertrag mit ${l.dat}.`, "Vor einem Drittel der Laufzeit gilt das als Bruch: Vertrauen und Ansehen sinken, und das Land wird künftig härter verhandeln.");
  return { ok: true, text: `Der Vertrag mit ${l.dat} ist vorzeitig beendet: Das gilt als Bruch.`, why: "Vertrauen und Ansehen sinken; das Land erinnert sich." };
}

/** Wann der früheste ordentliche Ausstieg möglich ist. */
export function fruehesterAusstieg(v: Vertrag): number {
  return v.seit + Math.floor((v.ablauf - v.seit) / 3);
}

// ---------------------------------------------------------------------------
// Vermittlung zwischen zwei Dritten: eine Lücke, die kein Konkurrenzspiel besetzt (RECHERCHE §6)

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

export const VERMITTLUNGEN: VermittlungDef[] = [
  {
    id: "ukr_rus", titel: "Ukraine und Russland", a: "UKR", b: "RUS", pk: 5, abkuehlung: 240, minA: 45, minB: 35,
    text: "Ankara richtet in Istanbul Gespräche aus: Meerengenregeln, Getreidekorridor und der Austausch von Gefangenen.",
    paket: ["Gefangenenaustausch in Istanbul", "Meerengenregeln nach Montreux", "Getreide- und Handelskorridor im Schwarzen Meer"],
  },
  {
    id: "arm_aze", titel: "Armenien und Aserbaidschan", a: "ARM", b: "AZE", pk: 5, abkuehlung: 240, minA: 35, minB: 45,
    text: "Transit gegen Grenzöffnung: Eine Verbindung nach Nachitschewan über armenisches Gebiet, dafür Schritte zur Öffnung der Grenze.",
    paket: ["Transit über armenisches Gebiet (TRIPP)", "Grenzöffnung für Drittstaatler und Diplomaten", "Bahn zwischen Gjumri und Kars"],
  },
];

export interface VermittlungSicht {
  def: VermittlungDef;
  moeglich: boolean;
  grund?: string;
  /** Aussicht in Prozent */
  aussicht: number;
}

function aussichtFuer(w: World, d: VermittlungDef): number {
  const ansehen = nationalAverage(NET, w.net, "ansehen");
  const va = vertrauenZu(w, d.a);
  const vb = vertrauenZu(w, d.b);
  const konflikt = Math.max(weltZustand(w)[d.a]!.konflikt, weltZustand(w)[d.b]!.konflikt);
  const roh = 20 + (Math.min(va, vb) - 35) * 1.2 - Math.max(0, konflikt - 60) * 0.6 + (ansehen - 45) * 0.6;
  return Math.round(clamp(roh, 8, 85));
}

export function vermittlungen(w: World): VermittlungSicht[] {
  const spiel = w.spiel;
  return VERMITTLUNGEN.map((d) => {
    let grund: string | undefined;
    const zuletzt = spiel?.vermittelt?.[d.id] ?? -1e9;
    if (spiel && !kannZahlen(spiel.kapital, d.pk)) grund = "Dafür fehlt das Kapital.";
    else if (w.day - zuletzt < d.abkuehlung) grund = `Wieder möglich in ${d.abkuehlung - (w.day - zuletzt)} Tagen.`;
    else if (vertrauenZu(w, d.a) < d.minA) grund = `${land(d.a).name} vertraut Ankara als Vermittler noch nicht genug.`;
    else if (vertrauenZu(w, d.b) < d.minB) grund = `${land(d.b).name} vertraut Ankara als Vermittler noch nicht genug.`;
    return { def: d, moeglich: !grund, ...(grund ? { grund } : {}), aussicht: aussichtFuer(w, d) };
  });
}

export function vermittle(w: World, id: string, rng: Rng): { ok: boolean; text: string; why?: string } {
  const spiel = w.spiel;
  if (!spiel) return { ok: false, text: "Ohne Spielschleife gibt es keine Vermittlung." };
  const sicht = vermittlungen(w).find((x) => x.def.id === id);
  if (!sicht) return { ok: false, text: "Diese Vermittlung gibt es nicht." };
  if (!sicht.moeglich) return { ok: false, text: sicht.grund ?? "Das geht gerade nicht." };
  const d = sicht.def;
  spiel.kapital -= d.pk;
  (spiel.vermittelt ??= {})[id] = w.day;
  const la = land(d.a);
  const lb = land(d.b);
  if (rng.next() * 100 < sicht.aussicht) {
    landAendern(w, d.a, { vertrauen: 4, konflikt: -5 }, `Vermittlung mit ${lb.dat}`);
    landAendern(w, d.b, { vertrauen: 4, konflikt: -5 }, `Vermittlung mit ${la.dat}`);
    wirke(w, "ansehen", 3);
    vertrauenAendern(w, 0.5);
    const text = `Vermittlung gelingt: ${la.name} und ${lb.name} einigen sich in Istanbul auf ein Paket.`;
    addLog(w, "entscheidung", text, `${d.paket.join("; ")}. Kostet ${d.pk} Kapital; Ankaras Ansehen wächst.`);
    return { ok: true, text, why: `${d.paket.join("; ")}. Kostet ${d.pk} Kapital; das Ansehen wächst.` };
  }
  landAendern(w, d.a, { vertrauen: -1 });
  landAendern(w, d.b, { vertrauen: -1 });
  wirke(w, "ansehen", -1);
  const text = `Die Vermittlung zwischen ${la.name} und ${lb.name} scheitert.`;
  addLog(w, "entscheidung", text, `Beide Seiten stellen zu hohe Bedingungen. Kostet ${d.pk} Kapital und etwas Ansehen; ein neuer Versuch ist später möglich.`);
  return { ok: false, text, why: `Kostet ${d.pk} Kapital und etwas Ansehen; ein neuer Versuch ist später möglich.` };
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
