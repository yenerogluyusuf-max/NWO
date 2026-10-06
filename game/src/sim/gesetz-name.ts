// Anzeigename eines Gesetzentwurfs in der aktuellen Sprache. Der Spielstand speichert den Namen, wie er beim Einbringen hieß; trägt der
// Entwurf schlicht den deutschen Namen seiner Maßnahme, erscheint der Name aus dem (übersetzten) Politiknetz.

import { NET } from "./modell";
import { NODES } from "../data/politiknetz";
import { katalogDe } from "../i18n";
import type { Gesetz } from "./spiel-typen";

const deutscherName = (id: string): string | undefined => katalogDe()[`netz.knoten.${id}.name`] ?? NODES.find((n) => n.id === id)?.name;

export function gesetzName(g: Pick<Gesetz, "massnahme" | "name">): string {
  const i = NET.index.get(g.massnahme);
  if (i === undefined) return g.name;
  return g.name === deutscherName(g.massnahme) ? NET.nodes[i]!.name : g.name;
}

let nachDeutsch: Map<string, string> | null = null;
/** Ein deutscher Maßnahmenname (etwa aus einer Protokollzeile) in der aktuellen Sprache; Unbekanntes bleibt, wie es ist. */
export function massnahmenName(deutsch: string): string {
  if (!nachDeutsch) {
    nachDeutsch = new Map();
    for (const n of NODES) {
      const de = deutscherName(n.id);
      if (de) nachDeutsch.set(de, n.id);
    }
  }
  const id = nachDeutsch.get(deutsch);
  const i = id === undefined ? undefined : NET.index.get(id);
  return i === undefined ? deutsch : NET.nodes[i]!.name;
}
