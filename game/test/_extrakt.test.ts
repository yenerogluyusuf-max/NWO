// Vorübergehend: schreibt die deutschen Datentexte als Katalogvorlage (wird wieder gelöscht).
import { it } from "vitest";
import { writeFileSync } from "node:fs";
import { NODES } from "../src/data/politiknetz";
import de from "../src/i18n/katalog/de/netz.json";
import "../src/data/skalen";
import { angemeldeteBereiche } from "../src/i18n/daten";
const OUT = "/private/tmp/claude-501/-Users-yusufyeneroglu/2b9cbe89-2a9c-4f54-9116-e7a66c185932/scratchpad/daten/";
it("extrahiert", async () => {
  for (const m of (process.env.MODULE ?? "").split(",").filter(Boolean)) await import(m);
  const netz: Record<string, string> = {};
  for (const n of NODES) for (const f of ["name", "text"] as const) {
    const k = `netz.knoten.${n.id}.${f}`;
    if (!(k in de) && n[f]) netz[k] = n[f];
  }
  writeFileSync(OUT + "netzknoten.json", JSON.stringify(netz, null, 1));
  const b = angemeldeteBereiche();
  const grob: Record<string, Record<string, string>> = {};
  for (const [bereich, tab] of Object.entries(b)) Object.assign((grob[bereich.split(".")[0]!] ??= {}), tab);
  for (const [g, tab] of Object.entries(grob)) writeFileSync(OUT + `daten_${g}.json`, JSON.stringify(tab, null, 1));
});
