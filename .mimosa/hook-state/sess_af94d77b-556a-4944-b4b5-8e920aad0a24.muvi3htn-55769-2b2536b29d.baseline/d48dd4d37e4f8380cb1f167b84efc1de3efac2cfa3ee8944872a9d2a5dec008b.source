// Hebel: Welche Maßnahmen bewegen eine Größe, direkt oder über eine Zwischengröße?
// Aus den Verbindungen des Politiknetzes gerechnet; keine eigene Meinung.

import { NET } from "./modell";
import type { NodeSpec } from "../data/politiknetz";

export interface Hebel {
  node: NodeSpec;
  /** Stärke der Wirkung (Betrag, Summe direkter und halbierter indirekter Verbindungen) */
  staerke: number;
  /** +1: die Maßnahme erhöhen, um das Ziel zu erreichen; −1: sie senken */
  richtung: 1 | -1;
}

/**
 * Maßnahmen, die eine Größe in die gewünschte Richtung bewegen (`gewuenscht` +1 erhöhen, −1 senken),
 * nach Stärke sortiert. Ist die Größe selbst eine Maßnahme, gibt es keine Hebel.
 */
export function hebel(zielId: string, gewuenscht: 1 | -1, n = 4): Hebel[] {
  const summe = new Map<string, number>();
  for (const e1 of NET.edges) {
    const von = NET.nodes[NET.index.get(e1.from)!]!;
    if (von.kind !== "massnahme") continue;
    if (e1.to === zielId) summe.set(von.id, (summe.get(von.id) ?? 0) + e1.weight);
    else for (const e2 of NET.edges) if (e2.from === e1.to && e2.to === zielId) summe.set(von.id, (summe.get(von.id) ?? 0) + e1.weight * e2.weight * 0.5);
  }
  return [...summe.entries()]
    .map(([id, s]) => ({ node: NET.nodes[NET.index.get(id)!]!, staerke: Math.abs(s), richtung: (s * gewuenscht > 0 ? 1 : -1) as 1 | -1 }))
    .filter((h) => h.staerke > 0.0005)
    .sort((a, b) => b.staerke - a.staerke)
    .slice(0, n);
}

/** Für die Größen des Wirtschaftsmodells gibt es keine Regler, sondern Wege über Haushalt, Zentralbank und Umfeld. */
export const MAKRO_WEGE: Record<string, { name: string; wege: Record<"rauf" | "runter", string> }> = {
  inflation: { name: "Inflation", wege: { runter: "Ausgaben dämpfen („Sparen“), die Zentralbank stützen statt kritisieren, Energiepreise abfedern; Preiskontrollen dämpfen nur den Anschein.", rauf: "Das wird selten gewollt; mehr Ausgaben und eine gefügige Zentralbank treiben die Inflation." } },
  arbeitslosigkeit: { name: "Arbeitslosigkeit", wege: { runter: "Investitionsanreize, Mittelstandsförderung und Berufsausbildung; mehr Ausgaben helfen kurz und treiben die Inflation.", rauf: "Das passiert von allein, wenn Sie kräftig sparen." } },
  wachstum: { name: "Wachstum", wege: { rauf: "Investitionsanreize, Exportförderung, Infrastruktur und Fachkräfte; Ausgaben wirken schnell, aber mit Preisfolgen.", runter: "Das ergibt sich aus Sparen und hohen Zinsen." } },
  schulden: { name: "Staatsschulden", wege: { runter: "Sparen, Steuern anheben oder Steuerfahndung stärken; Wachstum hilft, und hohe Inflation entwertet Schulden (mit Nebenwirkungen).", rauf: "Mehr Ausgaben und weniger Einnahmen erhöhen sie." } },
};

/** Welche Gruppen gewinnen oder verlieren, wenn die Maßnahme erhöht (+1) oder gesenkt (−1) wird? Aus den direkten Verbindungen zu den Wählergruppen. */
export function betroffene(massnahmeId: string, richtung: 1 | -1): { gewinner: string[]; verlierer: string[] } {
  const wirkung: { name: string; wert: number }[] = [];
  for (const e of NET.edges) {
    if (e.from !== massnahmeId) continue;
    const ziel = NET.nodes[NET.index.get(e.to)!]!;
    if (ziel.kind !== "gruppe") continue;
    wirkung.push({ name: ziel.name, wert: e.weight * richtung });
  }
  wirkung.sort((a, b) => Math.abs(b.wert) - Math.abs(a.wert));
  return {
    gewinner: wirkung.filter((w) => w.wert > 0.0005).slice(0, 4).map((w) => w.name),
    verlierer: wirkung.filter((w) => w.wert < -0.0005).slice(0, 4).map((w) => w.name),
  };
}

/** Direkte Eingriffe bei den Größen des Wirtschaftsmodells (Haushalt und Zentralbank), mit ehrlichem Ausgang. */
export const MAKRO_EINGRIFFE: Record<string, { option: "ausgaben" | "sparen" | "kritik" | "gouverneur"; wirkt: string }[]> = {
  inflation: [
    { option: "sparen", wirkt: "dämpft die Nachfrage und damit die Preise; kostet Wachstum und Zustimmung" },
    { option: "kritik", wirkt: "erhöht die Inflation: Die Märkte fürchten politischen Druck auf die Zentralbank" },
  ],
  arbeitslosigkeit: [
    { option: "ausgaben", wirkt: "stützt die Beschäftigung kurz; treibt Inflation und Schulden" },
    { option: "sparen", wirkt: "erhöht die Arbeitslosigkeit, weil die Nachfrage fällt" },
  ],
  wachstum: [
    { option: "ausgaben", wirkt: "beschleunigt das Wachstum schnell, mit Preisfolgen" },
    { option: "gouverneur", wirkt: "eine gefügige Zentralbankführung senkt die Zinsen; die Lira gerät unter Druck" },
  ],
  schulden: [
    { option: "sparen", wirkt: "senkt das Defizit; kostet Wachstum" },
    { option: "ausgaben", wirkt: "erhöht die Schulden" },
  ],
  leitzins: [
    { option: "kritik", wirkt: "Sie setzen den Zins nicht selbst: Kritik erhöht den Druck, kostet aber Glaubwürdigkeit" },
    { option: "gouverneur", wirkt: "eine neue Führung entscheidet anders; die Märkte reagieren nervös" },
  ],
  abwertung: [
    { option: "kritik", wirkt: "beschleunigt die Abwertung: Anleger fürchten politischen Druck" },
    { option: "sparen", wirkt: "beruhigt die Märkte und stützt die Lira, kostet Nachfrage" },
  ],
};

export interface HandlungsHebel {
  massnahme: string;
  name: string;
  /** +1 erhöhen, −1 senken */
  richtung: 1 | -1;
  /** Stärke der Wirkung auf die Zielgröße in drei Wörtern */
  wirkung: "stark" | "spürbar" | "schwach";
  /** Wie die Wirkung gemeint ist: die Größe steigt oder sinkt dadurch */
  folge: "hebt" | "senkt";
  jetzt: number;
}

/** Die Stärke eines Hebels im Verhältnis zum stärksten, der zu diesem Ziel führt: „stark“ heißt „so stark, wie es hier überhaupt geht“. */
function wirkungWort(staerke: number, groesste: number): HandlungsHebel["wirkung"] {
  const r = groesste > 0 ? staerke / groesste : 0;
  return r >= 0.6 ? "stark" : r >= 0.3 ? "spürbar" : "schwach";
}

/**
 * Was kann man tun, damit eine Größe steigt (+1) oder sinkt (−1)? Die stärksten Hebel des Netzes, mit dem heutigen Stand der Maßnahme.
 * Maßnahmen, die schon fast am Anschlag stehen, fehlen.
 */
export function handlungsHebel(nationalMittel: (id: string) => number, zielId: string, gewuenscht: 1 | -1, n = 4): HandlungsHebel[] {
  const alle = hebel(zielId, gewuenscht, n + 4);
  const groesste = alle[0]?.staerke ?? 0;
  return alle
    .map((h) => ({
      massnahme: h.node.id,
      name: h.node.name,
      richtung: h.richtung,
      wirkung: wirkungWort(h.staerke, groesste),
      folge: (gewuenscht > 0 ? "hebt" : "senkt") as "hebt" | "senkt",
      jetzt: nationalMittel(h.node.id),
    }))
    .filter((h) => (h.richtung > 0 ? h.jetzt < 90 : h.jetzt > 10))
    .slice(0, n);
}
