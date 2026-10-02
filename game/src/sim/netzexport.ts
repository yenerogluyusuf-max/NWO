// Maschinenlesbarer Abzug des Politiknetzes (INN-1): jede Verbindung mit Form,
// Parametern und Begründung, jeder Knoten mit Rücklauf, Trägheit und Preisen.
// Grundlage für die Kalibrierung (WIR-1): Die Tabelle lässt sich diffen und prüfen,
// ohne den Code zu lesen. Alle Werte sind Spielparameter, keine Messwerte.

import { EDGES, NODES } from "../data/politiknetz";

export interface KantenZeile {
  /** „von→nach“, eindeutig je Verbindung */
  id: string;
  von: string;
  nach: string;
  gewicht: number;
  verzoegerung: number;
  form: string;
  /** Formparameter als kompakter JSON-Text („{}" bei linear) */
  parameter: string;
  begruendung: string;
}

export interface KnotenZeile {
  id: string;
  name: string;
  art: string;
  thema: string;
  start: number;
  ruecklauf: number;
  traegheit: number;
  /** Die vier Preise als JSON-Text („{}" bei Defaults) */
  preise: string;
}

export function kantenZeilen(): KantenZeile[] {
  return EDGES.map((e) => {
    const { typ: _typ, ...parameter } = e.form ?? { typ: "linear" };
    return {
      id: `${e.from}→${e.to}`,
      von: e.from,
      nach: e.to,
      gewicht: e.weight,
      verzoegerung: e.lag,
      form: e.form?.typ ?? "linear",
      parameter: e.form && e.form.typ !== "linear" ? JSON.stringify(parameter) : "{}",
      begruendung: e.why,
    };
  });
}

export function knotenZeilen(): KnotenZeile[] {
  return NODES.map((n) => ({
    id: n.id,
    name: n.name,
    art: n.kind,
    thema: n.theme,
    start: n.start,
    ruecklauf: n.decay,
    traegheit: n.traegheit ?? 1,
    preise: n.preise ? JSON.stringify(n.preise) : "{}",
  }));
}

/** CSV-Feld: immer in Anführungszeichen, Anführungszeichen verdoppelt. */
const feld = (x: string | number): string => `"${String(x).replaceAll('"', '""')}"`;

export function kantenCsv(): string {
  const kopf = "id;von;nach;gewicht;verzoegerung;form;parameter;begruendung";
  const zeilen = kantenZeilen().map((z) => [z.id, z.von, z.nach, z.gewicht, z.verzoegerung, z.form, z.parameter, z.begruendung].map(feld).join(";"));
  return [kopf, ...zeilen].join("\n") + "\n";
}

export function knotenCsv(): string {
  const kopf = "id;name;art;thema;start;ruecklauf;traegheit;preise";
  const zeilen = knotenZeilen().map((z) => [z.id, z.name, z.art, z.thema, z.start, z.ruecklauf, z.traegheit, z.preise].map(feld).join(";"));
  return [kopf, ...zeilen].join("\n") + "\n";
}

export function netzJson(): string {
  return JSON.stringify({ kanten: kantenZeilen(), knoten: knotenZeilen() }, null, 2) + "\n";
}
