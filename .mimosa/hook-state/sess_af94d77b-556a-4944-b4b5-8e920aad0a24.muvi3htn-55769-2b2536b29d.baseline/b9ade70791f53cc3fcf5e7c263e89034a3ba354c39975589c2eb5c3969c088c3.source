// Umsetzungsstand je Maßnahme (INN-2, Democracy-4-Muster; Spieldesign „Absicht, Beschluss, Wirkung“).
//
// Ein Beschluss wirkt nicht sofort voll: Die Verwaltung setzt die neue Stufe über die
// Umsetzungsdauer des Knotens (`months` in data/politiknetz.ts) an — sichtbar als Balken
// von 0 auf 100. Drei Mechaniken laufen dabei zusammen, alle drei wirken (Dokumentation
// in netz.ts am Wirkungsfaktor-Haken):
//   1. Die Stufe selbst wandert schrittweise aufs Ziel (targets/steps in netz.ts),
//   2. dieser Umsetzungsstand dämpft die ausgehenden Kanten (Faktor umsetzung/100),
//   3. die Kanten-Verzögerung (lag 0–12) verschiebt die Wirkung zusätzlich nach hinten.
//
// Maßnahmen ohne Umsetzungsdauer (`months` fehlt) wirken sofort: Sie bekommen keinen
// Eintrag, der Faktor ist 1. Ein fehlender Eintrag gilt allgemein als 100 (voll umgesetzt);
// damit wirken alte Spielstände ohne Datenverlust genau wie bisher (Migration s. unten).

import type { NetModel, NetState } from "./netz";

/** Eine Änderung um höchstens so viele Stufenpunkte gilt als Feinjustierung. */
export const KLEINE_AENDERUNG = 1;

/**
 * Punkte, die die laufende Umsetzung bei einer Feinjustierung verliert, statt von vorn
 * zu beginnen: Wer den Regler nur um eine Stufe nachstellt, baut auf dem auf, was die
 * Verwaltung schon eingerichtet hat (Democracy 4 dämpft kleine Slider-Bewegungen ebenfalls
 * nur). Größere Änderungen beginnen die Umsetzung dagegen bei 0.
 */
export const DAEMPFUNG_KLEINE_AENDERUNG = 25;

/** Umsetzungsstand 0–100; fehlender Eintrag = voll umgesetzt (100). */
export function umsetzungsStand(net: NetState, id: string): number {
  return net.umsetzung?.[id] ?? 100;
}

/** Faktor für die ausgehenden Kanten einer Maßnahme (0–1). */
export function wirkungsFaktor(net: NetState, id: string): number {
  return umsetzungsStand(net, id) / 100;
}

/**
 * Startet oder dämpft die Umsetzung, wenn eine Maßnahme gesetzt oder geändert wird.
 * Aufgerufen aus handeln.ts (wendeAn) — dem einzigen Weg, auf dem ein Beschluss ins Netz kommt.
 *
 * - Maßnahme ohne Umsetzungsdauer: kein Eintrag, sie wirkt sofort (Faktor 1).
 * - Änderung um höchstens eine Stufe (Feinjustierung): −25 Punkte statt Reset.
 * - Größere Änderung oder erstmaliger Beschluss: Start bei 0.
 *
 * `aenderung` ist der Sprung der Stufe gegenüber dem Stand beim Beschluss,
 * `effektiveMonate` die Dauer inklusive Verwaltungsüberlast (wie beim Stufen-Schritt).
 * Das Tempo (Punkte je Monat) wird beim Beschluss festgelegt und nicht nachträglich
 * verändert — analog zu `steps` in netz.ts.
 */
export function starteUmsetzung(model: NetModel, net: NetState, id: string, aenderung: number, effektiveMonate: number): void {
  const i = model.index.get(id);
  const node = i === undefined ? undefined : model.nodes[i];
  if (!node || node.kind !== "massnahme" || node.months === undefined) return;
  net.umsetzung ??= {};
  net.umsetzungTempo ??= {};
  const bisher = net.umsetzung[id] ?? 100;
  net.umsetzung[id] = Math.abs(aenderung) <= KLEINE_AENDERUNG ? Math.max(0, bisher - DAEMPFUNG_KLEINE_AENDERUNG) : 0;
  net.umsetzungTempo[id] = 100 / Math.max(1, effektiveMonate);
}

/**
 * Monatsschritt der Simulation: Jede laufende Umsetzung nähert sich linear der 100
 * (gleicher Zuwachs jeden Monat). Wer 100 erreicht, ist voll umgesetzt; der Eintrag
 * wird aufgeräumt, der Faktor ist wieder 1. Läuft in world.ts (monthlyNet) vor dem
 * Netzschritt, damit schon der erste Monat mit dem neuen Stand wirkt.
 */
export function umsetzungMonat(net: NetState): void {
  if (!net.umsetzung) return;
  for (const id of Object.keys(net.umsetzung)) {
    const stand = net.umsetzung[id]!;
    const tempo = net.umsetzungTempo?.[id] ?? 100;
    if (stand + tempo >= 100) {
      delete net.umsetzung[id];
      if (net.umsetzungTempo) delete net.umsetzungTempo[id];
    } else {
      net.umsetzung[id] = stand + tempo;
    }
  }
}

/** Geschätzte Restmonate bis zur vollen Wirkung; null, wenn voll umgesetzt. */
export function restMonate(net: NetState, id: string): number | null {
  const stand = net.umsetzung?.[id];
  if (stand === undefined) return null;
  const tempo = net.umsetzungTempo?.[id] ?? 100;
  return Math.max(1, Math.ceil((100 - stand) / tempo));
}

/**
 * Migration alter Spielstände (INN-2): Früher gab es keinen Umsetzungsstand — alles
 * Beschlossene galt als voll wirksam. Darum gilt ein fehlender Eintrag (und ein fehlendes
 * Feld) als 100; die Migration besteht in genau dieser Konvention und legt das Feld nicht
 * nachträglich an, damit Speichern und Laden bit-exakt bleiben (Reproduzierbarkeit M1).
 * Vorhandene, aber beschädigte Einträge (JSON-null aus NaN, Werte außerhalb 0–100,
 * Einträge ohne Maßnahme) werden dagegen repariert, also auf den Default zurückgesetzt.
 */
export function migriereUmsetzung(model: NetModel, net: NetState): void {
  if (net.umsetzung === undefined) {
    if (net.umsetzungTempo !== undefined) delete net.umsetzungTempo;
    return;
  }
  net.umsetzungTempo ??= {};
  for (const id of Object.keys(net.umsetzung)) {
    const i = model.index.get(id);
    const node = i === undefined ? undefined : model.nodes[i];
    const stand = net.umsetzung[id]!;
    const tempo = net.umsetzungTempo[id]!;
    const ungueltig =
      !node ||
      node.kind !== "massnahme" ||
      node.months === undefined ||
      !Number.isFinite(stand) ||
      stand < 0 ||
      stand >= 100 ||
      !Number.isFinite(tempo) ||
      tempo <= 0;
    if (ungueltig) {
      delete net.umsetzung[id];
      delete net.umsetzungTempo[id];
    }
  }
}
