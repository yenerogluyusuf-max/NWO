// Zynismus (Vorbild Democracy 4, RECHERCHE_GLM_16 §3): Wer eine Maßnahme kurz nach ihrer Änderung in die Gegenrichtung dreht oder kurz
// vor der Wahl teure Geschenke verteilt, verliert Glaubwürdigkeit. Der Zynismus klingt langsam ab und drückt die Zustimmung.
// Nur eigene Beschlüsse zählen (Gesetz, Erlass); Ereignisse und Gerichtsurteile, die Maßnahmen ändern, nicht. Werte: Spielparameter.

import type { World } from "./types";
import { NET } from "./modell";
import { t } from "../i18n";
import { addLog } from "./log";

export interface ZynismusZustand {
  wert: number;
  /** Letzte eigene Änderung je Maßnahme: Tag und Richtung (+1 erhöht, −1 gesenkt) */
  letzte: Record<string, { tag: number; richtung: 1 | -1 }>;
}

export const ZYNISMUS = {
  /** Kehrtwende innerhalb dieser Frist gilt als Richtungswechsel */
  wendeTage: 540,
  /** Zuwachs je Kehrtwende (bei 20 Stufen Änderung; kleinere Schritte zählen anteilig, mindestens die Hälfte) */
  wende: 6,
  /** Teure Erhöhungen in diesem Abstand vor der Wahl gelten als Wahlgeschenk */
  geschenkTage: 180,
  geschenk: 3,
  /** Abklingen je Monat und Gewicht in der Zustimmung (Punkte je Zynismuspunkt) */
  abklingen: 0.05,
  gewicht: 0.1,
  max: 60,
} as const;

export function zynismus(w: World): ZynismusZustand {
  const sp = w.spiel!;
  sp.zynismus ??= { wert: 0, letzte: {} };
  return sp.zynismus;
}

/** Nach einem eigenen Beschluss: Richtungswechsel und Wahlgeschenke buchen. */
export function politikGeaendert(w: World, id: string, vorher: number, nachher: number): void {
  const sp = w.spiel;
  if (!sp || Math.abs(nachher - vorher) < 1) return;
  const z = zynismus(w), richtung: 1 | -1 = nachher > vorher ? 1 : -1, umfang = Math.max(0.5, Math.min(1.5, Math.abs(nachher - vorher) / 20));
  const node = NET.nodes[NET.index.get(id) ?? -1];
  const name = node?.name ?? id;
  let zuwachs = 0;
  const l = z.letzte[id];
  if (l && l.richtung !== richtung && w.day - l.tag <= ZYNISMUS.wendeTage) {
    zuwachs += ZYNISMUS.wende * umfang;
    addLog(w, "ereignis", t("zynismus.log.wende", { name }), t("zynismus.warum.wende"));
  }
  if (richtung === 1 && (node?.cost ?? 0) > 0 && sp.wahltag - w.day <= ZYNISMUS.geschenkTage && sp.wahltag > w.day) {
    zuwachs += ZYNISMUS.geschenk * umfang;
    addLog(w, "ereignis", t("zynismus.log.geschenk", { name }), t("zynismus.warum.geschenk"));
  }
  z.wert = Math.min(ZYNISMUS.max, z.wert + zuwachs);
  z.letzte[id] = { tag: w.day, richtung };
}

export function zynismusMonat(w: World): void {
  if (!w.spiel?.zynismus) return;
  const z = w.spiel.zynismus;
  z.wert = Math.max(0, z.wert * (1 - ZYNISMUS.abklingen));
  for (const [id, l] of Object.entries(z.letzte)) if (w.day - l.tag > ZYNISMUS.wendeTage) delete z.letzte[id];
}

/** Abzug in der Zustimmung (Punkte) */
export const zynismusLast = (w: World): number => (w.spiel?.zynismus?.wert ?? 0) * ZYNISMUS.gewicht;
