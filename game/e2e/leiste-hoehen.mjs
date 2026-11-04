// Leiste und Kartenebene bei sechs Bildschirmgrößen: Die Leiste darf nicht scrollen und den Knopf „Kartenebene“ nicht verdecken.
// Aufruf (Entwicklungsserver auf 5173): node e2e/leiste-hoehen.mjs <bild.png>. Ausgabe je Größe: scroll 0 und ueberlapp false erwartet.
import { createRequire } from "node:module"; const { chromium } = createRequire(import.meta.url)("playwright");
const browser = await chromium.launch({ args: ["--disable-3d-apis"] });
for (const [b, h] of [[1280, 720], [1280, 800], [1366, 768], [1440, 900], [1920, 1080], [1024, 768]]) {
  const page = await browser.newPage({ viewport: { width: b, height: h }, locale: "de-DE" });
  await page.goto("http://localhost:5173/", { waitUntil: "domcontentloaded" });
  await page.evaluate(async () => { const W = await import("/src/sim/world.ts"); const S = await import("/src/sim/scenario.ts"); const P = await import("/src/sim/prolog.ts"); const Sp = await import("/src/ui/speicher.ts");
    const w = W.createWorld(S.turkey2026, 6); P.startAfterElection(w, P.schnellProfil()); w.spiel.wahltag = w.day + 600; W.advance(w, 40); w.spiel.ereignisse = []; await Sp.speichereWarten(w); });
  await page.reload({ waitUntil: "domcontentloaded" }); await page.waitForTimeout(2500);
  await page.evaluate(() => Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("Fortsetzen"))?.click()); await page.waitForTimeout(3500);
  for (let i = 0; i < 15; i++) { const w = await page.evaluate(() => { const b = Array.from(document.querySelectorAll(".event-layer button")).find((x) => /An die Arbeit|Zum Schreibtisch|Ohne Ziele beginnen|Später entscheiden|Verstanden|Schließen/.test(x.textContent ?? "")); if (b) { b.click(); return true; } return false; }); if (!w) break; await page.waitForTimeout(300); }
  await page.evaluate(() => document.querySelector(".dossier .close")?.click()); await page.waitForTimeout(500);
  const r = await page.evaluate(() => { const n = document.querySelector(".regierungs-navigation"), l = document.querySelector(".linsen-knopf"); const nr = n?.getBoundingClientRect(), lr = l?.getBoundingClientRect();
    return { scroll: n ? n.scrollHeight - n.clientHeight : -1, navUnten: Math.round(nr?.bottom ?? 0), linseOben: Math.round(lr?.top ?? 0), ueberlapp: !!(nr && lr && lr.top < nr.bottom && lr.left < nr.right) }; });
  console.log(`${b}x${h}`, JSON.stringify(r));
  if (b === 1280 && h === 720) await page.screenshot({ path: process.argv[2] });
  await page.close();
}
await browser.close();
