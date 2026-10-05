// React-Anbindung der Übersetzungsschicht: Die Oberfläche rendert neu, sobald die Sprache wechselt.

import { useSyncExternalStore } from "react";
import { abonniere, aktuelleSprache, type Sprache } from "./index";

/** Aktuelle Sprache; Komponenten, die `t()` im Render benutzen, rufen den Hook auf (oder hängen unter einem Baum mit key={sprache}). */
export function useSprache(): Sprache {
  return useSyncExternalStore(abonniere, aktuelleSprache, () => "de" as const);
}
