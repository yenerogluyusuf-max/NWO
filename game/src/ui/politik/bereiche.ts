// Die Bereiche der Politik: aus dem Politiknetz berechnet, wie es in jedem Themenfeld steht (Ampel, Lage, akute Probleme,
// laufende Vorhaben) und welche Maßnahmen dort zur Wahl stehen. Reine Logik ohne Oberfläche, damit sie sich prüfen lässt.
// Die Schwellen der Ampel sind Anzeigeregeln, keine Messwerte: Sie sagen, wann das Spiel Aufmerksamkeit verlangt.

import { NET } from "../../sim/modell";
import { nationalAverage, startAverage } from "../../sim/netz";
import { THEME_NAMES, type NodeSpec, type Theme } from "../../data/politiknetz";
import { skala, naechsteStufe, skalenArt } from "../../data/skalen";
import { akuteProbleme, vorschlaege, type Vorschlag } from "../../sim/vorschlaege";
import { krisenFuerMassnahme } from "../../sim/krisen";
import type { World } from "../../sim/types";

export type Ampel = "gruen" | "gelb" | "rot";

export interface BereichDef {
  theme: Theme;
  name: string;
  /** Ein Satz: worum es in diesem Bereich geht */
  text: string;
}

/** Die Reihenfolge, in der die Bereiche stehen: erst das, was Menschen täglich spüren, dann Staat, Sicherheit, Welt. */
export const BEREICH_THEMEN: Theme[] = [
  "wirtschaft",
  "haushalt",
  "arbeit",
  "gesundheit",
  "bildung",
  "wohnen",
  "energie",
  "landwirtschaft",
  "infrastruktur",
  "sicherheit",
  "recht",
  "militaer",
  "kultur",
  "gesellschaft",
  "aussen",
];

const TEXTE: Record<string, string> = {
  wirtschaft: "Preise, Löhne, Investitionen und Handel: was Haushalte im Portemonnaie und Betriebe in der Bilanz spüren.",
  haushalt: "Einnahmen, Ausgaben, Schulden und das Vertrauen der Märkte.",
  arbeit: "Beschäftigung, Armut, Renten und Arbeitskämpfe.",
  gesundheit: "Krankenhäuser, Ärzte, Wartezeiten und Medikamente.",
  bildung: "Schulen, Hochschulen, Fachkräfte und die Frage, wer bleibt und wer geht.",
  wohnen: "Mieten, Neubau, Bauqualität und Erdbebenvorsorge.",
  energie: "Strom, Gas, erneuerbare Energie und die Abhängigkeit von Importen.",
  landwirtschaft: "Wasser, Ernten, Preise und das Leben auf dem Land.",
  infrastruktur: "Straßen, Bahn, Häfen, Netze und ihr Zustand.",
  sicherheit: "Polizei, Kriminalität, Terror und Frieden im Innern.",
  recht: "Justiz, Gerichte, Haft, Urteile und die Grenzen der Regierung.",
  militaer: "Heer, Luftwaffe, Marine, Rüstung und Abschreckung.",
  kultur: "Kulturerbe, Identität und Vielfalt: das Gedächtnis des Landes.",
  gesellschaft: "Medien, Zusammenhalt, Gleichstellung und das Vertrauen in die Regierung.",
  aussen: "Beziehungen zu Nachbarn und Mächten, Geflüchtete und internationales Ansehen.",
};

export const BEREICHE: BereichDef[] = BEREICH_THEMEN.map((theme) => ({ theme, name: THEME_NAMES[theme], text: TEXTE[theme] ?? "" }));

/** Größen, bei denen ein hoher Wert schlecht ist; alle anderen sind gut, wenn sie hoch sind. Neutrale stehen in NEUTRAL. */
export const SCHLECHT_WENN_HOCH = new Set([
  "lebenshaltung",
  "kostendruck",
  "ungleichheit",
  "schattenwirtschaft",
  "dollarisierung",
  "zinslast",
  "armut",
  "informelle_arbeit",
  "jugendarbeitslosigkeit",
  "streikneigung",
  "wartezeiten",
  "schulabbruch",
  "abwanderung",
  "stau",
  "energiepreise",
  "energieimporte",
  "duerre",
  "lebensmittelpreise",
  "landflucht",
  "mieten",
  "kriminalitaet",
  "terrorgefahr",
  "korruption",
  "polarisierung",
  "ausnahmerecht",
  "haftueberfuellung",
  "strassburg_druck",
  "gefluechtete",
  "inflation",
  "arbeitslosigkeit",
  "abwertung",
  "defizit",
  "schulden",
]);

/** Größen ohne gut oder schlecht: Sie beschreiben, wo das Land steht, nicht ob es ihm gut geht. */
export const NEUTRAL = new Set(["geburtenrate", "religioesitaet", "leitzins"]);

/** Einheit der Modellgrößen, die als echte Zahl (nicht als Index 0 bis 100) gerechnet werden. */
export const EINHEIT: Record<string, string> = {
  inflation: "%",
  arbeitslosigkeit: "%",
  leitzins: "%",
  abwertung: "%",
  schulden: "% des BIP",
  wachstum: "Index",
  defizit: "Index",
};

export type Bewertung = "gut" | "mittel" | "schlecht" | "neutral";

/** Wie gut ein Wert der Größe ist: bei „hoch ist gut“ ab 60 gut, bis 35 schlecht; bei „hoch ist schlecht“ umgekehrt. */
export function bewerte(id: string, wert: number): Bewertung {
  if (NEUTRAL.has(id)) return "neutral";
  const v = SCHLECHT_WENN_HOCH.has(id) ? 100 - wert : wert;
  return v >= 60 ? "gut" : v <= 35 ? "schlecht" : "mittel";
}

export interface LageZeile {
  id: string;
  name: string;
  jetzt: number;
  start: number;
  delta: number;
  bewertung: Bewertung;
  /** Ob die Veränderung seit dem Start gut ist (true), schlecht (false) oder neutral (null) */
  besser: boolean | null;
  input: boolean;
}

export interface MassnahmeZeile {
  id: string;
  name: string;
  text: string;
  jetzt: number;
  /** Name der heutigen Stufe bei Maßnahmen mit benannten Zuständen, sonst „Stufe 47“ */
  stufe: string;
  /** Wohin die laufende Umsetzung führt, sonst undefined */
  ziel?: number;
  imParlament?: { tage: number; stufe: number };
  /** Haushaltsposten heute in % des BIP; 0 = kein eigener Posten */
  kosten: number;
  einnahme: boolean;
  /** Krisen-Blocker (MIL-3): gesperrt oder verteuert/verbilligt durch eine aktive Krise */
  blocker?: { art: "gesperrt" | "teuer"; faktor: number; titel: string };
}

export interface ProblemZeile {
  id: string;
  name: string;
  provinzen: number[];
  /** Anteil der Bevölkerung in den betroffenen Provinzen, 0 bis 1 */
  last: number;
  theme: Theme;
}

export interface BereichStand {
  theme: Theme;
  name: string;
  text: string;
  ampel: Ampel;
  /** Ein Satz, warum die Ampel so steht */
  ampelGrund: string;
  probleme: ProblemZeile[];
  lage: LageZeile[];
  massnahmen: MassnahmeZeile[];
  /** Vorhaben, die gerade laufen (im Parlament oder in Umsetzung) */
  laufend: number;
  /** Wie viele Größen sich seit dem Start gebessert und verschlechtert haben */
  besser: number;
  schlechter: number;
}

export function lageZeilen(world: World, theme: Theme): LageZeile[] {
  return NET.nodes
    .filter((n) => n.theme === theme && n.kind === "groesse")
    .map((n) => {
      const jetzt = nationalAverage(NET, world.net, n.id);
      const start = startAverage(NET, world.net, n.id);
      const delta = jetzt - start;
      const neutral = NEUTRAL.has(n.id);
      const schlecht = SCHLECHT_WENN_HOCH.has(n.id);
      return {
        id: n.id,
        name: n.name,
        jetzt,
        start,
        delta,
        bewertung: n.input ? ("neutral" as Bewertung) : bewerte(n.id, jetzt),
        besser: neutral || Math.abs(delta) < 0.5 ? null : schlecht ? delta < 0 : delta > 0,
        input: !!n.input,
      };
    });
}

export function massnahmenZeilen(world: World, theme: Theme): MassnahmeZeile[] {
  const spiel = world.spiel;
  const out: MassnahmeZeile[] = [];
  for (const n of NET.nodes) {
    if (n.theme !== theme || n.kind !== "massnahme") continue;
    const jetzt = nationalAverage(NET, world.net, n.id);
    const ziel = world.net.targets[n.id];
    const gesetz = spiel?.gesetze.find((g) => g.massnahme === n.id);
    const sk = skala(n.id, jetzt);
    const stufe = skalenArt(n.id) === "regime" ? naechsteStufe(sk, jetzt).stufe.name : `Stufe ${Math.round(jetzt)}`;
    const kosten = Math.abs(((n.cost ?? 0) * jetzt) / 100);
    // Krisen-Blocker: Sperre schlägt Verteuerung; mehrere Verteuerungen multiplizieren sich
    const treffer = spiel ? krisenFuerMassnahme(world, n.id) : [];
    const sperre = treffer.find((t) => t.art === "gesperrt");
    const faktor = treffer.reduce((f, t) => (t.art === "teuer" ? f * t.faktor : f), 1);
    const blocker: MassnahmeZeile["blocker"] = sperre
      ? { art: "gesperrt", faktor: 1, titel: `${sperre.krise.name}: ${sperre.krise.grund} ${sperre.ausweg ?? ""} ${sperre.krise.bedingung}`.trim() }
      : faktor !== 1
        ? { art: "teuer", faktor, titel: treffer.map((t) => `${t.krise.name}: ${t.krise.wirkung} ${t.krise.bedingung}`).join(" ") }
        : undefined;
    out.push({
      id: n.id,
      name: n.name,
      text: n.text,
      jetzt,
      stufe,
      ...(ziel !== undefined && Math.abs(ziel - jetzt) > 1 ? { ziel } : {}),
      ...(gesetz ? { imParlament: { tage: Math.max(0, gesetz.abstimmung - world.day), stufe: gesetz.stufe } } : {}),
      kosten: Math.abs(n.cost ?? 0) >= 0.05 ? kosten : 0,
      einnahme: (n.cost ?? 0) < 0,
      ...(blocker ? { blocker } : {}),
    });
  }
  // Was läuft, steht oben; sonst nach Name
  return out.sort((a, b) => Number(!!(b.imParlament || b.ziel !== undefined)) - Number(!!(a.imParlament || a.ziel !== undefined)) || a.name.localeCompare(b.name, "de"));
}

/** Die akuten Probleme eines Bereichs, nach Last (Bevölkerungsanteil) sortiert. */
export function problemeIn(world: World, theme: Theme): ProblemZeile[] {
  return akuteProbleme(world)
    .map((p) => ({ id: p.id, name: p.name, provinzen: p.provinzen, last: p.last, theme: NET.nodes[NET.index.get(p.id)!]!.theme }))
    .filter((p) => p.theme === theme);
}

/** Wie viele Vorhaben dieses Bereichs laufen: Gesetze im Parlament und Umsetzungen (landesweit oder vor Ort). */
export function laufendeVorhaben(world: World, theme: Theme): number {
  const ids = new Set(NET.nodes.filter((n) => n.theme === theme && n.kind === "massnahme").map((n) => n.id));
  const laufend = new Set<string>();
  for (const g of world.spiel?.gesetze ?? []) if (ids.has(g.massnahme)) laufend.add(g.massnahme);
  for (const id of ids) {
    const ziel = world.net.targets[id];
    if (ziel !== undefined && Math.abs(ziel - nationalAverage(NET, world.net, id)) > 1) laufend.add(id);
  }
  for (const id of Object.keys(world.net.ziele ?? {})) if (ids.has(id)) laufend.add(id);
  return laufend.size;
}

export function ampelFuer(probleme: ProblemZeile[], lage: LageZeile[]): { ampel: Ampel; grund: string } {
  const schlecht = lage.filter((l) => !l.input && l.bewertung === "schlecht");
  const schwer = probleme.filter((p) => p.last >= 0.3);
  if (probleme.length >= 3 || schwer.length > 0 || schlecht.length >= 2) {
    const teile: string[] = [];
    if (probleme.length) teile.push(`${probleme.length} akute${probleme.length === 1 ? "s Problem" : " Probleme"}`);
    if (schlecht.length) teile.push(`${schlecht.length} ${schlecht.length === 1 ? "Größe" : "Größen"} im schlechten Bereich`);
    return { ampel: "rot", grund: `Angespannt: ${teile.join(", ")}.` };
  }
  if (probleme.length >= 1 || schlecht.length >= 1) {
    return { ampel: "gelb", grund: probleme.length ? `${probleme.length} akutes Problem: ${probleme[0]!.name}.` : `${schlecht[0]!.name} steht im schlechten Bereich.` };
  }
  return { ampel: "gruen", grund: "Kein akutes Problem, keine Größe im schlechten Bereich." };
}

export function bereichStand(world: World, theme: Theme): BereichStand {
  const lage = lageZeilen(world, theme);
  const probleme = problemeIn(world, theme);
  const { ampel, grund } = ampelFuer(probleme, lage);
  return {
    theme,
    name: THEME_NAMES[theme],
    text: TEXTE[theme] ?? "",
    ampel,
    ampelGrund: grund,
    probleme,
    lage,
    massnahmen: massnahmenZeilen(world, theme),
    laufend: laufendeVorhaben(world, theme),
    besser: lage.filter((l) => l.besser === true).length,
    schlechter: lage.filter((l) => l.besser === false).length,
  };
}

/** Kurzfassung für die Kachel und die Leiste: ohne Maßnahmenliste, damit die Übersicht schnell bleibt. */
export interface BereichKurz {
  theme: Theme;
  name: string;
  text: string;
  ampel: Ampel;
  ampelGrund: string;
  akut: number;
  laufend: number;
  besser: number;
  schlechter: number;
  /** Die auffälligsten Größen (schlechte zuerst, dann nach Veränderung) */
  signale: LageZeile[];
  probleme: ProblemZeile[];
}

export function bereichKurz(world: World, theme: Theme): BereichKurz {
  const lage = lageZeilen(world, theme);
  const probleme = problemeIn(world, theme);
  const { ampel, grund } = ampelFuer(probleme, lage);
  const rang = (l: LageZeile) => (l.bewertung === "schlecht" ? 0 : l.besser === false ? 1 : l.besser === true ? 2 : 3);
  const signale = lage
    .filter((l) => !l.input)
    .sort((a, b) => rang(a) - rang(b) || Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 3);
  return {
    theme,
    name: THEME_NAMES[theme],
    text: TEXTE[theme] ?? "",
    ampel,
    ampelGrund: grund,
    akut: probleme.length,
    laufend: laufendeVorhaben(world, theme),
    besser: lage.filter((l) => l.besser === true).length,
    schlechter: lage.filter((l) => l.besser === false).length,
    signale,
    probleme,
  };
}

export function alleBereiche(world: World): BereichKurz[] {
  return BEREICH_THEMEN.map((t) => bereichKurz(world, t));
}

/** Vorschläge des Problemlösers, die zu einem Bereich gehören. */
export function vorschlaegeIn(alle: Vorschlag[], theme: Theme): Vorschlag[] {
  return alle.filter((v) => NET.nodes[NET.index.get(v.massnahme)!]!.theme === theme);
}

/** Alle Vorschläge einmal berechnen (teuer), damit die Bereiche sie nur noch sortieren. */
export function alleVorschlaege(world: World): Vorschlag[] {
  return world.spiel ? vorschlaege(world, 60) : [];
}

export function nodeVon(id: string): NodeSpec | undefined {
  const i = NET.index.get(id);
  return i === undefined ? undefined : NET.nodes[i];
}
