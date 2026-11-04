// Art einer Sanktion gegen die Türkei: gezielt (nur Rüstung) oder breit (Handel). Eigenes kleines Modul, damit Versorgung und
// Wissensbaum es nutzen, ohne die Außenpolitik in ihre Ladereihenfolge zu ziehen.

/** Gezielte Sanktionen treffen nur die Rüstung (CAATSA: Exportlizenzen an die Rüstungsbehörde SSB), keine zivilen Lieferungen,
 * Lizenzen oder Energieabkommen. Breite Handelsmaßnahmen (EU) sperren dagegen den Handel mit dem Partner. */
export const SANKTION_GEZIELT: ReadonlySet<string> = new Set(["caatsa"]);
/** Sperrt eine laufende breite (nicht gezielte) Sanktion den zivilen Handel mit diesem Partner? */
export function breiteSanktionVon(a: { sanktionen?: { id: string; von: string }[] } | undefined, land: string): boolean {
  return !!a?.sanktionen?.some((s) => s.von === land && !SANKTION_GEZIELT.has(s.id));
}
