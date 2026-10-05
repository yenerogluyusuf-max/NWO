// Zeichnet symbol.svg als PNG (1024 × 1024, durchsichtiger Rand) mit dem Playwright-Chromium aus game/node_modules.
// Aufruf aus dem Ordner game/ (bauen.sh tut das): node ../app/symbol.mjs <svg> <png>
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";

const require = createRequire(process.cwd() + "/");
const { chromium } = require("playwright");

const [svgPfad, ziel] = process.argv.slice(2);
const svg = readFileSync(svgPfad, "utf8");
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1024, height: 1024 }, deviceScaleFactor: 1 });
await p.setContent(`<html><body style="margin:0;background:transparent">${svg.replace("<svg ", '<svg width="1024" height="1024" ')}</body></html>`);
await p.screenshot({ path: ziel, omitBackground: true });
await b.close();
