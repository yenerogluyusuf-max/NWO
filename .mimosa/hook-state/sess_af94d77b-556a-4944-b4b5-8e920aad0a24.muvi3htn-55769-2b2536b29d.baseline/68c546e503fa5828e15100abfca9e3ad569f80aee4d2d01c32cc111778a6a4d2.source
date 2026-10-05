// Folgeketten: Was danach kommt. Aus den Verbindungen des Politiknetzes (mit ihren Verzögerungen) und den Zusammenhängen des
// Wirtschaftsmodells (WIRTSCHAFTSMODELL.md, Z1 bis Z9) entsteht die Kette einer Entscheidung, in Wörtern und mit Richtung.

import { NET } from "./modell";
import { PARAMS } from "./economy";

export interface Glied {
  /** Der Name einer Größe des Netzes („Kreditvergabe“, Pfeil folgt aus `richtung`) oder ein ganzer Satz des Wirtschaftsmodells */
  text: string;
  /** Ob `text` nur der Name einer Größe ist (dann zeigt die Oberfläche einen Pfeil) */
  groesse?: boolean;
  richtung: 1 | -1;
  /** Ob das für Land und Leute gut ist; `null`, wenn es auf den Blickwinkel ankommt */
  gut: boolean | null;
  /** Nach so vielen Monaten setzt es ein (0 = sofort) */
  nach: number;
  /** 1 = unmittelbare Folge, 2 und 3 = Folgen der Folgen */
  ebene: 1 | 2 | 3;
  /** Warum (aus der Verbindung des Netzes oder der Modellregel) */
  warum?: string;
}

/** Größen des Netzes, bei denen ein höherer Wert schlechter ist. */
const SCHLECHT_WENN_HOCH = new Set([
  "haftueberfuellung", "ausnahmerecht", "strassburg_druck", "korruption", "polarisierung", "kriminalitaet", "terrorgefahr", "stau",
  "energiepreise", "energieimporte", "lebenshaltung", "armut", "ungleichheit", "schattenwirtschaft", "duerre", "kostendruck", "mieten",
  "abwanderung", "landflucht", "zinslast", "streikneigung", "gefluechtete", "dollarisierung", "wartezeiten", "schulabbruch",
  "informelle_arbeit", "jugendarbeitslosigkeit", "lebensmittelpreise", "luftverschmutzung", "inflation", "arbeitslosigkeit", "abwertung", "defizit", "schulden",
]);

/** Ob eine Bewegung der Größe in diese Richtung gut ist; `null` bei Größen ohne klare Wertung (etwa der Leitzins). */
export function istGut(id: string, richtung: 1 | -1): boolean | null {
  const n = NET.nodes[NET.index.get(id) ?? -1];
  if (!n) return null;
  if (id === "leitzins") return null;
  if (n.kind === "massnahme") return null;
  const schlecht = n.kind === "problem" || SCHLECHT_WENN_HOCH.has(id);
  return schlecht ? richtung < 0 : richtung > 0;
}

interface Aus {
  nach: number;
  gewicht: number;
  lag: number;
  warum: string;
}

let ausgehend: Map<number, Aus[]> | null = null;
function ausgehendeKanten(): Map<number, Aus[]> {
  if (ausgehend) return ausgehend;
  const m = new Map<number, Aus[]>();
  for (let j = 0; j < NET.edgeFrom.length; j++) {
    const von = NET.edgeFrom[j]!;
    const liste = m.get(von) ?? [];
    liste.push({ nach: NET.edgeTo[j]!, gewicht: NET.edgeWeight[j]!, lag: NET.edgeLag[j]!, warum: NET.edges[j]!.why });
    m.set(von, liste);
  }
  ausgehend = m;
  return m;
}

/**
 * Die Kette, die eine Bewegung der Größe `startId` im Politiknetz auslöst: bis zu drei Stufen, jeweils die stärksten Verbindungen.
 * `richtung` ist die Richtung der Bewegung (+1 steigt, −1 sinkt).
 */
export function netzKette(startId: string, richtung: 1 | -1, breite: [number, number, number] = [4, 2, 2]): Glied[] {
  const start = NET.index.get(startId);
  if (start === undefined) return [];
  const aus = ausgehendeKanten();
  const gesehen = new Set<number>([start]);
  const out: Glied[] = [];
  let front: { i: number; dir: 1 | -1; nach: number }[] = [{ i: start, dir: richtung, nach: 0 }];
  for (const ebene of [1, 2, 3] as const) {
    const naechste: { i: number; dir: 1 | -1; nach: number; g: number }[] = [];
    for (const f of front) {
      const kanten = (aus.get(f.i) ?? [])
        .filter((k) => Math.abs(k.gewicht) >= (ebene === 1 ? 0.01 : 0.015) && NET.nodes[k.nach]!.kind !== "massnahme" && !NET.nodes[k.nach]!.input && !gesehen.has(k.nach))
        .sort((a, b) => Math.abs(b.gewicht) - Math.abs(a.gewicht))
        .slice(0, ebene === 1 ? breite[0] : breite[ebene - 1]);
      for (const k of kanten) {
        if (gesehen.has(k.nach)) continue;
        gesehen.add(k.nach);
        const dir = (k.gewicht > 0 ? f.dir : -f.dir) as 1 | -1;
        const node = NET.nodes[k.nach]!;
        const nach = f.nach + k.lag;
        out.push({ text: node.name, groesse: true, richtung: dir, gut: istGut(node.id, dir), nach, ebene, warum: k.warum });
        naechste.push({ i: k.nach, dir, nach, g: Math.abs(k.gewicht) });
      }
    }
    front = naechste.sort((a, b) => b.g - a.g).slice(0, 4);
    if (!front.length) break;
  }
  return out;
}

/** Was eine Zinsänderung im Wirtschaftsmodell auslöst (Z1 bis Z9) und welche Verzögerung dabei gilt. */
export function zinsKette(delta: number): Glied[] {
  if (!delta) return [];
  const s: 1 | -1 = delta > 0 ? 1 : -1;
  const lag = PARAMS.rateLagMonths;
  const modell: Glied[] = [
    { text: s > 0 ? "Die Lira wird stärker: Anleger holen sich den höheren Zins" : "Die Lira wird schwächer: Anleger ziehen Geld ab", richtung: s, gut: s > 0, nach: 0, ebene: 1, warum: "Z4: Der Realzins zieht Kapital an oder weg, binnen Tagen." },
    { text: s > 0 ? "Die Wirtschaft läuft kühler: Auslastung sinkt" : "Die Wirtschaft läuft heißer: Auslastung steigt", richtung: (-s) as 1 | -1, gut: null, nach: lag, ebene: 1, warum: `Z1: Der Zins wirkt auf Kredite und Nachfrage, nach etwa ${lag} Monaten.` },
    { text: s > 0 ? "Die Inflation sinkt" : "Die Inflation steigt", richtung: (-s) as 1 | -1, gut: s > 0, nach: lag + 3, ebene: 2, warum: "Z2 und Z5: Weniger Auslastung und eine stärkere Lira bremsen die Preise." },
    { text: s > 0 ? "Wachstum und Beschäftigung leiden" : "Wachstum und Beschäftigung profitieren", richtung: (-s) as 1 | -1, gut: s < 0, nach: lag + 2, ebene: 2, warum: "Z9: Die Arbeitslosigkeit folgt dem Wachstum mit Verzögerung." },
    { text: s > 0 ? "Neue Staatsschulden werden teurer: Der Zinsdienst wächst langsam" : "Neue Staatsschulden werden billiger: Der Zinsdienst wächst langsamer", richtung: s, gut: s < 0, nach: 12, ebene: 2, warum: "Z7: Die Schuld wird erst bei Fälligkeit neu finanziert, deshalb kommt die Wirkung über Jahre." },
  ];
  return [...modell, ...netzKette("leitzins", s, [3, 2, 1]).filter((g) => g.ebene <= 2)];
}

/** Was ein Ausgabenimpuls (oder eine Steuersenkung) im Wirtschaftsmodell auslöst; `delta` in Prozent des BIP je Jahr (+ mehr Nachfrage). */
export function impulsKette(delta: number): Glied[] {
  if (!delta) return [];
  const s: 1 | -1 = delta > 0 ? 1 : -1;
  return [
    { text: s > 0 ? "Die Nachfrage steigt: Der Staat kauft und zahlt mehr" : "Die Nachfrage sinkt: Der Staat kauft und zahlt weniger", richtung: s, gut: null, nach: 1, ebene: 1, warum: "Z6: Ausgaben und Steuern wirken auf die Nachfrage." },
    { text: s > 0 ? "Das Defizit wächst, die Schulden steigen" : "Das Defizit schrumpft, die Schulden wachsen langsamer", richtung: s, gut: s < 0, nach: 1, ebene: 1, warum: "Z7: Defizite werden zu Schulden." },
    { text: s > 0 ? "Wachstum und Beschäftigung steigen" : "Wachstum und Beschäftigung sinken", richtung: s, gut: s > 0, nach: 3, ebene: 2, warum: "Z1 und Z9: Höhere Auslastung heißt mehr Produktion und Arbeit." },
    { text: s > 0 ? "Die Inflation steigt" : "Die Inflation sinkt", richtung: s, gut: s < 0, nach: 6, ebene: 2, warum: "Z2: Läuft die Wirtschaft heißer, steigen Preise und Löhne schneller." },
    { text: s > 0 ? "Der Risikoaufschlag steigt: Anleger verlangen mehr für Staatsanleihen" : "Der Risikoaufschlag sinkt: Anleger verlangen weniger für Staatsanleihen", richtung: s, gut: s < 0, nach: 1, ebene: 2, warum: "Z8: Hohe Defizite machen Anleger nervös." },
    ...netzKette("defizit", s, [2, 1, 1]).filter((g) => g.ebene <= 2),
  ];
}

/** Was der Verlust (oder Gewinn) an Glaubwürdigkeit der Zentralbank auslöst. */
export function glaubwuerdigkeitsKette(delta: number): Glied[] {
  if (!delta) return [];
  const s: 1 | -1 = delta < 0 ? 1 : -1; // 1 = Vertrauensverlust
  return [
    { text: s > 0 ? "Die Lira gibt nach, der Risikoaufschlag steigt" : "Die Lira festigt sich, der Risikoaufschlag sinkt", richtung: s, gut: s < 0, nach: 0, ebene: 1, warum: "Z4 und Z8: Märkte reagieren binnen Tagen auf politischen Einfluss." },
    { text: s > 0 ? "Die Inflationserwartungen steigen" : "Die Inflationserwartungen sinken", richtung: s, gut: s < 0, nach: 2, ebene: 1, warum: "Z3: Verliert die Bank Glaubwürdigkeit, verankern sich die Erwartungen schlechter." },
    { text: s > 0 ? "Löhne und Preise ziehen vorsorglich an: Die Inflation verfestigt sich" : "Die Inflation lässt sich leichter senken", richtung: s, gut: s < 0, nach: 6, ebene: 2, warum: "Z3: Erwartungen bestimmen, wie zäh die Inflation ist." },
  ];
}

/** Die Kette als Text in einer Zeile, für Chronik und Meldungen. */
export function kettenZeile(g: Glied): string {
  const pfeil = g.groesse ? ` ${g.richtung > 0 ? "▲" : "▼"}` : "";
  return `${g.text}${pfeil}${g.nach ? ` (nach etwa ${g.nach} Monaten)` : ""}`;
}
