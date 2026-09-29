// Echter Spieldurchlauf im Browser: öffnen, spielen, Screenshots.
// DOM-Aktionen direkt (die Karte animiert, Playwright wartet sonst auf Stabilität).
// Aufruf: node e2e/spiel.mjs [verzeichnis]
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const dir = process.argv[2] ?? "/tmp/staatsraeson-spiel";
mkdirSync(dir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 });
page.on("pageerror", (e) => console.log("SEITENFEHLER:", e.message));

const tap = (label) =>
  page.locator(`button[aria-label="${label}"], button:has-text("${label}")`).first().evaluate((el) => el.click());

const schreiben = async (text) => {
  await page.getByLabel("Anweisung").evaluate((el, t) => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
    setter.call(el, t);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }, text);
  await tap("Senden");
  await page.waitForTimeout(250);
};

await page.goto("http://localhost:5173/?schnellstart", { waitUntil: "networkidle" });
await page.waitForTimeout(1800);
await page.screenshot({ path: `${dir}/01-karte.png` });
console.log("01 Karte");

// Ereignisfenster (Amtsübergabe) erledigen
await tap("An die Arbeit");
await page.waitForTimeout(300);

await tap("Gespräch");
await page.waitForTimeout(400);
await schreiben("Wie hoch ist die Inflation?");
await schreiben("Erhoehe den Mindestlohn um 25 Punkte");
await schreiben("Ich will mehr ausgeben");
await page.waitForTimeout(300);
await page.screenshot({ path: `${dir}/02-gespraech.png` });
console.log("02 Gespräch");

await tap("Politiknetz");
await page.waitForTimeout(700);
await page.screenshot({ path: `${dir}/03-netz.png` });
console.log("03 Netz");

const slider = page.locator('input[type="range"]').first();
if (await slider.count()) {
  await slider.evaluate((el) => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
    setter.call(el, "80");
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${dir}/04-regler-80.png` });
  console.log("04 Regler 80");
  await tap("Vorschau");
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${dir}/05-vorschau.png` });
  console.log("05 Vorschau");
  await tap("Beschließen");
  await page.waitForTimeout(300);
}

await tap("Beschlussbuch");
await page.waitForTimeout(500);
await page.screenshot({ path: `${dir}/06-beschlussbuch.png` });
console.log("06 Beschlussbuch");

await tap("Bereiche");
await page.waitForTimeout(400);
await page.screenshot({ path: `${dir}/07-bereiche.png` });
console.log("07 Bereiche");

await tap("Gespräch");
await page.waitForTimeout(300);
await schreiben("30 Tage weiter");
await page.waitForTimeout(500);
await page.screenshot({ path: `${dir}/08-nach-30-tagen.png` });
console.log("08 Bilanz nach 30 Tagen");

await browser.close();
console.log("fertig:", dir);
