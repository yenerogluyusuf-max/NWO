// Das Politiknetz ist statisch; nur sein Zustand gehört zum Spielstand.
// Eigene Datei, damit die Spielmodule das Netz kennen, ohne von world.ts abzuhängen.

import { buildModel, type NetModel } from "./netz";
import { EDGES, NODES, SYNERGIEN } from "../data/politiknetz";
import { aktuelleSprache, katalogVon } from "../i18n";

export const NET: NetModel = buildModel(NODES, EDGES, SYNERGIEN);

/**
 * Namen, Texte und Begründungen aus dem Katalog einsetzen (Schlüssel `netz.knoten.<id>.name|text`, `netz.kante.<von>.<nach>`,
 * `netz.synergie.<id>`), soweit dort ein Eintrag steht. Der deutsche Text im Datenmodul bleibt der Rückfall. So lässt sich das Netz
 * Schritt für Schritt übersetzen, ohne die Daten zu verlegen. Läuft einmal beim Laden des Moduls: Die Sprache wechselt nur durch Neuladen.
 */
function lokalisiere(): void {
  const sprache = aktuelleSprache();
  if (sprache === "de") return;
  const kat = katalogVon(sprache);
  const en = katalogVon("en");
  const hole = (key: string): string | undefined => kat[key] ?? en[key];
  for (const n of NODES) {
    n.name = hole(`netz.knoten.${n.id}.name`) ?? n.name;
    n.text = hole(`netz.knoten.${n.id}.text`) ?? n.text;
  }
  for (const e of EDGES) e.why = hole(`netz.kante.${e.from}.${e.to}`) ?? e.why;
  for (const s of SYNERGIEN) s.why = hole(`netz.synergie.${s.id}`) ?? s.why;
}

lokalisiere();
