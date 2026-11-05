// Rundgang über alle Ansichten mit Messung (PLAN_OBERFLAECHE_DETAIL_2026-11-05.md, Teil 1 Q5 und Arbeitspaket 6/20).
//
// Öffnet das Spiel im Schnellstart, geht jede Gruppe der linken Leiste, jeden Reiter der Titelzeile und jeden Reiter der Akte
// durch, fotografiert die Ansicht und misst die Schwellen der Abnahme:
//   - Höhe höchstens 1,5 Bildschirme (Ausnahme: Verlauf und Chronik)
//   - mindestens 60 Wörter oder ein Knopf je Ansicht (keine fast leeren Reiter)
//   - keine Schrift unter 11,5 px
//   - Textkontrast mindestens 4,5 : 1 gegen den tatsächlichen Hintergrund
//   - keine Kommazahl bei Indizes („87,3 von 100“)
//
// Aufruf (ein Server muss laufen, etwa `npx vite preview --port 4173` nach `npx vite build`):
//   node scripts/rundgang.mjs [--url http://localhost:4173/] [--aus ../dokumentation/rundgang_JJJJ-MM-TT] [--streng]
// Mit --streng endet das Skript mit Code 1, wenn eine Schwelle verletzt ist. Ergebnis: Bilder, seiten.json, bericht.md.

import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const { chromium } = createRequire(import.meta.url)("playwright");

const arg = (name, standard) => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : standard;
};
const heute = new Date().toISOString().slice(0, 10);
const URL_BASIS = arg("url", "http://localhost:4173/");
const AUS = arg("aus", join(process.cwd(), "..", "dokumentation", `rundgang_${heute}`));
const STRENG = process.argv.includes("--streng");
const SCHWELLE = { hoehe: 1.5, woerter: 60, schrift: 11.5, kontrast: 4.5 };
const AUSNAHME_HOEHE = /Verlauf|Chronik|Rückblick|Quellen/i;

mkdirSync(AUS, { recursive: true });
const browser = await chromium.launch({ args: ["--disable-3d-apis"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, locale: "de-DE" });
const fehler = [];
page.on("pageerror", (e) => fehler.push(`Seitenfehler: ${e.message}`));

const url = new URL(URL_BASIS);
url.searchParams.set("schnellstart", "");
await page.goto(url.toString());
await page.waitForTimeout(4000);

/** Offene Ereignisfenster beiseitelegen, damit sie die Ansicht nicht verdecken. */
const ruhe = async () => {
  for (let i = 0; i < 6; i++) {
    const weg = await page.evaluate(() => {
      const b = Array.from(document.querySelectorAll(".event-layer button")).find((x) => /Später entscheiden|Verstanden|Weiter|Schließen|Zum Schreibtisch|An die Arbeit|Los geht|Beginnen/.test(x.textContent ?? ""));
      b?.click();
      return !!b;
    });
    if (!weg) break;
    await page.waitForTimeout(500);
  }
};
await ruhe();
// Zeit anhalten (Leertaste schaltet zwischen Pause und Tempo 1; Tempo 0 ist gewollt)
await page.evaluate(() => document.querySelector('.kf-tempo button[aria-label]')?.click());

/** Misst die offene Ansicht im Browser. Alles hier läuft in der Seite und liest nur. */
const messe = () =>
  page.evaluate((S) => {
    const d = document.querySelector(".dossier");
    const body = d?.querySelector(".dossier-body") ?? d;
    const inhalt = d?.querySelector(".ak-inhalt") ?? body;
    const sicht = (el) => !!el && el.offsetParent !== null;
    const text = (inhalt?.innerText ?? "").replace(/\s+/g, " ").trim();
    // rgb(…) in 0–255 oder color(srgb …) in 0–1 (so liefert der Browser Farben aus color-mix)
    const rgb = (s) => {
      const z = (s.match(/[\d.]+/g) ?? []).map(Number);
      if (/^color\(srgb/.test(s)) return [z[0] * 255, z[1] * 255, z[2] * 255, ...(z[3] !== undefined ? [z[3]] : [])];
      return z;
    };
    const lum = ([r, g, b]) => {
      const f = (c) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    const grund = (el) => {
      for (let e = el; e; e = e.parentElement) {
        const c = rgb(getComputedStyle(e).backgroundColor);
        if (c.length >= 3 && (c[3] === undefined || c[3] > 0.5) && !/gradient|url/.test(getComputedStyle(e).backgroundImage)) return c;
        if (/gradient|url/.test(getComputedStyle(e).backgroundImage)) return null; // Verlauf oder Bild: nicht sicher messbar
      }
      return [255, 255, 255];
    };
    const klein = [];
    const blass = [];
    for (const el of inhalt?.querySelectorAll("*") ?? []) {
      if (!sicht(el)) continue;
      const eigen = Array.from(el.childNodes).some((n) => n.nodeType === 3 && n.textContent.trim().length > 1);
      if (!eigen || el.closest("svg")) continue;
      const st = getComputedStyle(el);
      const px = parseFloat(st.fontSize);
      const probe = el.textContent.trim().slice(0, 40);
      if (px < S.schrift) klein.push(`${px}px „${probe}“`);
      const g = grund(el);
      const v = rgb(st.color);
      if (g && v.length >= 3 && (v[3] === undefined || v[3] > 0.5)) {
        const [a, b] = [lum(v), lum(g)];
        const k = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
        if (k < S.kontrast) blass.push(`${k.toFixed(1)}:1 „${probe}“`);
      }
    }
    const indexKomma = (text.match(/\b\d+,\d+ (von 100|\/ 100)/g) ?? []).slice(0, 5);
    return {
      titel: d?.querySelector(".dossier-head h2")?.textContent?.trim() ?? "",
      hoehe: body?.scrollHeight ?? 0,
      sichtHoehe: body?.clientHeight ?? 1,
      woerter: text ? text.split(" ").length : 0,
      knoepfe: Array.from(inhalt?.querySelectorAll("button, input, select, [role=button]") ?? []).filter(sicht).length,
      klein: [...new Set(klein)].slice(0, 8),
      blass: [...new Set(blass)].slice(0, 8),
      indexKomma,
    };
  }, SCHWELLE);

const seiten = [];
let nr = 0;
const fotografiere = async (pfad) => {
  nr++;
  await page.waitForTimeout(800);
  await ruhe();
  const datei = `${String(nr).padStart(3, "0")}.png`;
  await page.screenshot({ path: join(AUS, datei) });
  const m = await messe();
  const verstoesse = [];
  const schirme = m.hoehe / Math.max(1, m.sichtHoehe);
  if (schirme > SCHWELLE.hoehe && !AUSNAHME_HOEHE.test(pfad.join(" "))) verstoesse.push(`zu lang: ${schirme.toFixed(1)} Bildschirme`);
  if (m.woerter < SCHWELLE.woerter && m.knoepfe === 0) verstoesse.push(`fast leer: ${m.woerter} Wörter, kein Knopf`);
  if (m.klein.length) verstoesse.push(`Schrift unter ${SCHWELLE.schrift} px: ${m.klein.length}`);
  if (m.blass.length) verstoesse.push(`Kontrast unter ${SCHWELLE.kontrast}:1: ${m.blass.length}`);
  if (m.indexKomma.length) verstoesse.push(`Kommazahl bei Index: ${m.indexKomma.join(", ")}`);
  seiten.push({ nr, pfad, datei, schirme: Number(schirme.toFixed(2)), ...m, verstoesse });
  console.log(String(nr).padStart(3), pfad.join(" › "), verstoesse.length ? `✗ ${verstoesse.join(" · ")}` : "✓");
};

const gruppen = await page.evaluate(() => document.querySelectorAll(".regierungs-navigation section button").length);
for (let i = 0; i < gruppen; i++) {
  const name = await page.evaluate((i) => {
    const b = document.querySelectorAll(".regierungs-navigation section button")[i];
    const n = b?.querySelector(".menu-kurz")?.textContent?.trim() ?? b?.textContent?.trim();
    b?.click();
    return n;
  }, i);
  await page.waitForTimeout(1300);
  await ruhe();
  const tabs = await page.evaluate(() => Array.from(document.querySelectorAll(".dossier-tabs [role=tab]")).map((b) => b.textContent.trim()));
  for (let k = 0; k < Math.max(1, tabs.length); k++) {
    if (tabs[k]) {
      await page.evaluate((k) => document.querySelectorAll(".dossier-tabs [role=tab]")[k]?.click(), k);
      await page.waitForTimeout(1100);
    }
    const akte = await page.evaluate(() => Array.from(document.querySelectorAll(".ak-navigation .ak-navgruppe button")).map((b) => b.querySelector("span")?.textContent?.trim() ?? b.textContent.trim()));
    if (!akte.length) {
      await fotografiere([name, tabs[k]].filter(Boolean));
      continue;
    }
    for (let a = 0; a < akte.length; a++) {
      await page.evaluate((a) => document.querySelectorAll(".ak-navigation .ak-navgruppe button")[a]?.click(), a);
      await page.waitForTimeout(1000);
      await fotografiere([name, tabs[k], akte[a]].filter(Boolean));
    }
  }
  // Gruppe wieder schließen, damit die nächste frisch öffnet
  await page.evaluate(() => document.querySelector(".dossier .close")?.click());
  await page.waitForTimeout(400);
}

const verletzt = seiten.filter((s) => s.verstoesse.length);
writeFileSync(join(AUS, "seiten.json"), JSON.stringify(seiten, null, 1));
const zeilen = [
  `# Rundgang ${heute}`,
  "",
  `${seiten.length} Ansichten, ${verletzt.length} mit Schwellenverletzung (Höhe ≤ ${SCHWELLE.hoehe} Bildschirme, ≥ ${SCHWELLE.woerter} Wörter oder ein Knopf, Schrift ≥ ${SCHWELLE.schrift} px, Kontrast ≥ ${SCHWELLE.kontrast}:1, Indizes ganzzahlig).`,
  "",
  "| Nr | Ansicht | Bildschirme | Wörter | Knöpfe | Verstöße |",
  "|---|---|---|---|---|---|",
  ...seiten.map((s) => `| [${s.nr}](${s.datei}) | ${s.pfad.join(" › ")} | ${s.schirme} | ${s.woerter} | ${s.knoepfe} | ${s.verstoesse.join("; ") || "–"} |`),
  "",
  ...(fehler.length ? ["## Fehler der Seite", "", ...fehler.map((f) => `- ${f}`)] : []),
];
writeFileSync(join(AUS, "bericht.md"), zeilen.join("\n") + "\n");
console.log(`\n${seiten.length} Ansichten, ${verletzt.length} mit Verstoß. Bericht: ${join(AUS, "bericht.md")}`);
if (fehler.length) console.log(fehler.join("\n"));
await browser.close();
if (STRENG && verletzt.length) process.exit(1);
