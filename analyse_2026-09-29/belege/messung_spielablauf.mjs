import { chromium } from "/Users/yusufyeneroglu/Desktop/Staatsraeson/game/node_modules/playwright/index.mjs";
const dir = process.argv[2];
const browser = await chromium.launch({ channel: "chromium", args: ["--use-angle=metal", "--ignore-gpu-blocklist", "--enable-gpu-rasterization"] });
const page = await browser.newPage({ viewport: { width: 1512, height: 982 }, deviceScaleFactor: 1 });
const errors = [];
page.on("pageerror", (e) => errors.push("PAGEERROR " + e.message));
const tap = (label) => page.locator(`button[aria-label="${label}"], button:has-text("${label}")`).first().evaluate((el) => el.click());
const shot = async (n) => { await page.waitForTimeout(700); await page.screenshot({ path: `${dir}/${n}.png` }); };

await page.goto("http://localhost:5173/", { waitUntil: "networkidle" });
await page.waitForFunction(() => !document.querySelector(".atlas-loading"), null, { timeout: 60000 });
await shot("00-titel");
await tap("Neues Spiel");
await page.waitForTimeout(800);
await shot("01-prolog");
await tap("Zufällig und schnell");
await page.waitForTimeout(600);
await shot("02-prolog-fertig");
// letzte Schaltfläche (Beginnen) im Prolog
const primary = page.locator("button.primary").first();
console.log("Start-Knopf:", await primary.count() ? await primary.innerText() : "keiner");
if (await primary.count()) await primary.evaluate((el) => el.click());
await page.waitForTimeout(1500);
await shot("03-spielstart");
await tap("An die Arbeit");
await page.waitForTimeout(400);

// Kartenebenen
for (const t of ["Regionen", "Wahl 2028", "Wirtschaftskraft", "Arbeitslosigkeit", "Akute Probleme"]) {
  await page.locator(`button[title="${t}"]`).evaluate((el) => el.click());
  await shot("layer-" + t.replace(/\s/g, "_"));
}
await page.locator(`button[title="Politisch"]`).evaluate((el) => el.click());

// Schreibtisch
await tap("Schreibtisch"); await shot("10-schreibtisch");

// Entscheidung: Wartezeit der Vorschau messen
await tap("Entscheidungen"); await page.waitForTimeout(300);
const tPrev = await page.evaluate(async () => {
  const btn = [...document.querySelectorAll("button.decision-card")][2];
  const t = performance.now();
  btn.click();
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  return performance.now() - t;
});
console.log("Klick auf Entscheidungskarte bis nächster Frame (Vorschau blockiert Hauptthread):", tPrev.toFixed(0), "ms");
await shot("11-entscheidung-vorschau");
await tap("Schließen");

// Tempo 3: Ereignisse beobachten
await page.evaluate(() => document.querySelector('button[aria-label="Tempo 3"]').click());
const log = [];
for (let i = 0; i < 24; i++) {
  await page.waitForTimeout(2500);
  const s = await page.evaluate(() => ({
    datum: document.querySelector(".date-day")?.textContent,
    modal: document.querySelector(".event-window h2")?.textContent ?? null,
    speedOn: [...document.querySelectorAll(".speeds button")].findIndex((b) => b.className.includes("on")),
  }));
  log.push(s);
  if (s.modal) { await shot("20-ereignis-" + i); await page.evaluate(() => document.querySelector(".event-actions button")?.click()); await page.evaluate(() => document.querySelector('button[aria-label="Tempo 3"]').click()); }
}
console.log("Verlauf bei Tempo 3 (alle 2,5 s):");
console.log(log.map((l, i) => `${String(i * 2.5).padStart(5)} s  ${l.datum}  Tempo ${l.speedOn}${l.modal ? "  MODAL: " + l.modal : ""}`).join("\n"));
await shot("30-nach-60s");
console.log("Fehler:", errors.length ? errors.join("\n") : "keine");
await browser.close();
