// Foto der echten Karte mit Software-Grafik (ohne Grafikkarte, etwa eine Minute): node e2e/karte-mit-grafik.mjs <bild.png>
import { createRequire } from "node:module"; const { chromium } = createRequire(import.meta.url)("playwright");
const out = process.argv[2];
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, locale: "de-DE" });
page.setDefaultTimeout(240000);
await page.goto("http://localhost:5173/", { waitUntil: "domcontentloaded" });
await page.evaluate(async () => { const W = await import("/src/sim/world.ts"); const S = await import("/src/sim/scenario.ts"); const P = await import("/src/sim/prolog.ts"); const Sp = await import("/src/ui/speicher.ts");
  const K = await import("/src/sim/krieg.ts"); const L = await import("/src/sim/laender.ts"); const R = await import("/src/sim/rng.ts");
  const w = W.createWorld(S.turkey2026, 6); P.startAfterElection(w, P.schnellProfil()); w.spiel.wahltag = w.day + 600; W.advance(w, 40);
  L.weltZustand(w).IRN.konflikt = 99; K.kriegMonat(w, new R.Rng(3)); for (let i = 0; i < 60 && !K.kriege(w).some((k) => k.phase === "krieg"); i++) W.advance(w, 1); W.advance(w, 28);
  w.spiel.ereignisse = []; await Sp.speichereWarten(w); try { localStorage.setItem("nwo.effekte", "aus"); } catch {} });
await page.reload({ waitUntil: "domcontentloaded" }); await page.waitForTimeout(4000);
await page.evaluate(() => Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("Fortsetzen"))?.click()); await page.waitForTimeout(8000);
for (let i = 0; i < 15; i++) { const w = await page.evaluate(() => { const b = Array.from(document.querySelectorAll(".event-layer button")).find((x) => /An die Arbeit|Zum Schreibtisch|Ohne Ziele beginnen|Später entscheiden|Verstanden|Schließen/.test(x.textContent ?? "")); if (b) { b.click(); return true; } return false; }); if (!w) break; await page.waitForTimeout(600); }
await page.evaluate(() => document.querySelector(".dossier .close")?.click()); await page.waitForTimeout(15000);
const t0 = Date.now(); await page.screenshot({ path: out, timeout: 240000 }); console.log("Foto in", Date.now() - t0, "ms");
await browser.close();
