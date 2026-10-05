// Erzeugt public/ui/portraits/portraits.json aus den Dateinamen der gemalten Porträts.
// Dateiname: p-<f|m>-<alter>-<ton>-<nn>[-<merkmale>].webp   (Merkmale mit + verbunden: kopftuch, brille, bart, uniform, robe)
// Aufruf: node game/tools/portraits/baue_manifest.mjs
import { readdirSync, writeFileSync, existsSync, mkdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const hier = dirname(fileURLToPath(import.meta.url));
const ordner = join(hier, "..", "..", "public", "ui", "portraits");
if (!existsSync(ordner)) mkdirSync(ordner, { recursive: true });

const MUSTER = /^p-([fm])-(30|40|50|60|70)-([1-5])-(\d{2})(?:-([a-z+]+))?\.webp$/;
const MERKMALE = new Set(["kopftuch", "brille", "bart", "uniform", "robe"]);
const eintraege = [];
const fehler = [];

for (const datei of readdirSync(ordner).sort()) {
  if (!datei.endsWith(".webp")) continue;
  const m = MUSTER.exec(datei);
  if (!m) {
    fehler.push(`${datei}: Name passt nicht zum Schema`);
    continue;
  }
  const merkmale = m[5] ? m[5].split("+") : [];
  const unbekannt = merkmale.filter((x) => !MERKMALE.has(x));
  if (unbekannt.length) {
    fehler.push(`${datei}: unbekannte Merkmale ${unbekannt.join(", ")}`);
    continue;
  }
  const kb = Math.round(statSync(join(ordner, datei)).size / 1024);
  if (kb > 120) fehler.push(`${datei}: ${kb} KB (Richtwert höchstens 80 KB)`);
  eintraege.push({
    datei,
    geschlecht: m[1],
    alter: Number(m[2]),
    ton: Number(m[3]),
    kopftuch: merkmale.includes("kopftuch"),
    brille: merkmale.includes("brille"),
    bart: merkmale.includes("bart"),
    uniform: merkmale.includes("uniform"),
    robe: merkmale.includes("robe"),
  });
}

writeFileSync(join(ordner, "portraits.json"), JSON.stringify({ version: 1, bilder: eintraege }, null, 1) + "\n");
console.log(`${eintraege.length} Porträts im Manifest.`);
if (fehler.length) console.log("Hinweise:\n" + fehler.map((f) => "  " + f).join("\n"));
