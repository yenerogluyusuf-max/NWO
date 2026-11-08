// Hilfe für Modelltests: Zufallsereignisse würfeln nicht, die festen Termine des Staatsjahres kommen weiter.
// Gemessen wird dann das Modell, nicht der Verlauf der Vorgänge. Jeder neue Vorgang mit eigener Wirkung (Welle E1: Gipfel, EU-Bericht,
// Einladung nach Istanbul) verschiebt sonst, was eine kurze Partie erlebt, und kippt Vergleiche zweier Partien, die nur das Modell prüfen.
// Muster aus test/inflation-kostenschub.test.ts (Welle H3): Chancen auf null, danach zurück.
import { VORLAGEN } from "../src/sim/ereignisse";

/** Dieselben Termine wie TERMINE in sim/ereignisse.ts */
export const FESTE_TERMINE = new Set(["mindestlohn", "haushaltsjahr", "kommunalwahl", "zusage", "koalitionsangebot"]);

/** Führt `f` aus, während nur die festen Termine würfeln; die Chancen kommen danach zurück, auch bei einem Fehler. */
export function ohneZufallsereignisse<T>(f: () => T): T {
  const chancen = VORLAGEN.map((v) => v.chance);
  try {
    for (const v of VORLAGEN) if (!FESTE_TERMINE.has(v.id)) v.chance = () => 0;
    return f();
  } finally {
    VORLAGEN.forEach((v, i) => (v.chance = chancen[i]!));
  }
}
