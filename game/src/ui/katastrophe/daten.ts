// Datenlogik der Krisenstab-Ansicht: Die Hebel der Vorsorge (Maßnahmen im Politiknetz) mit Stand, Preis und Wirkung.
// Reine Auskunft aus dem Modell (pruefeVorhaben, Umsetzungsstand, Kanten); die Ausführung läuft über bringeEin wie im Politikfenster.

import { NET } from "../../sim/modell";
import type { World } from "../../sim/types";
import { pruefeVorhaben, stufeIn } from "../../sim/handeln";
import { restMonate, umsetzungsStand } from "../../sim/umsetzung";

/** Die Maßnahmen, die Schaden und Opferzahlen einer Katastrophe senken (Bereitschaft und Gebäudebestand). */
export const HEBEL_IDS = ["m_afad_ausbau", "m_fruehwarnsystem", "m_versicherungspflicht", "m_gebaeudeverstaerkung", "m_bauaufsicht"] as const;

export interface HebelWirkung {
  /** Name der Größe, auf die die Maßnahme wirkt */
  auf: string;
  /** Verzögerung in Monaten */
  lag: number;
  warum: string;
}

export interface HebelZeile {
  id: string;
  name: string;
  text: string;
  /** Aktuelle Stufe im Landesdurchschnitt (0 bis 100) */
  stufe: number;
  /** Vorschlag für den nächsten Schritt */
  ziel: number;
  ausgeschoepft: boolean;
  /** Umsetzungsstand eines laufenden Beschlusses, 0 bis 100 (100 = voll wirksam) */
  umsetzung: number;
  restMonate: number | null;
  /** Politisches Kapital für den Weg über ein Gesetz */
  pk: number;
  /** Jährliche Kosten der Änderung in % des BIP */
  bip: number;
  /** Monate bis zur vollen Wirkung */
  monate: number;
  bezahlbar: boolean;
  /** Liegt schon ein Gesetzentwurf zu dieser Maßnahme im Parlament? */
  imParlament: boolean;
  moeglich: boolean;
  grund?: string;
  wirkung: HebelWirkung[];
}

/** Nächster sinnvoller Schritt: zwanzig Stufen weiter, auf volle Zehner, höchstens 100. */
export function naechsteStufe(stufe: number): number {
  return Math.min(100, Math.round(stufe / 10) * 10 + 20);
}

/** Alle Hebel der Vorsorge mit Preisschild; Maßnahmen, die es im Politiknetz nicht gibt, fehlen einfach. */
export function hebel(w: World): HebelZeile[] {
  const out: HebelZeile[] = [];
  for (const id of HEBEL_IDS) {
    const i = NET.index.get(id);
    const node = i === undefined ? undefined : NET.nodes[i];
    if (!node) continue;
    const stufe = Math.round(stufeIn(w, id, null));
    const ausgeschoepft = stufe >= 95;
    const ziel = naechsteStufe(stufe);
    const pr = pruefeVorhaben(w, id, ausgeschoepft ? stufe : ziel, null);
    const wirkung = NET.edges
      .filter((e) => e.from === id)
      .sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight))
      .slice(0, 2)
      .map((e) => ({ auf: NET.nodes[NET.index.get(e.to)!]?.name ?? e.to, lag: e.lag, warum: e.why }));
    out.push({
      id,
      name: node.name,
      text: node.text,
      stufe,
      ziel,
      ausgeschoepft,
      umsetzung: Math.round(umsetzungsStand(w.net, id)),
      restMonate: restMonate(w.net, id),
      pk: pr.gesetz.pk,
      bip: pr.kostenBip,
      monate: pr.monate,
      bezahlbar: pr.gesetz.bezahlbar,
      imParlament: !!w.spiel?.gesetze.some((g) => g.massnahme === id),
      moeglich: pr.ok,
      ...(pr.ok ? {} : { grund: pr.grund ?? "Nicht möglich." }),
      wirkung,
    });
  }
  return out;
}

export const nf = (x: number, d = 0): string => x.toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d });
