// Browserprüfung der jüngsten Oberflächen (Wahlkampf mit Reisen, Wahlversprechen-Karte, Krisengesetze am Schreibtisch)
// in vier Fenstergrößen, mit Bildern und gezielten Prüfungen der am 4. November 2026 behobenen Darstellungsfehler:
//  - Mehrzahl: nie „1 Monate“ / „1 months“
//  - Aktenmenü bleibt im zweispaltigen Layout beim Scrollen sichtbar (keine leere linke Spalte)
//  - Zielkarten am ersten Tag: kein Text läuft über den Kartenrand
//  - Modale Blätter: Meldungschips und (Handy) der Knopf „Bereiche“ liegen nicht darüber
//  - Handy mit offener Akte: Meldungschips und Kartenschalter verdecken die Akte nicht
//
// Aufruf: Dev-Server starten (npm run dev), dann  node e2e/wahlkampf-oberflaeche-pruef.mjs [bildverzeichnis]
// Der Spielstand wird im Browser über die Module des Dev-Servers erzeugt (Wahl in 56 Tagen) und in der IndexedDB gesichert.
// WebGL ist abgeschaltet, damit die Prüfung auch ohne Grafikkarte (Cloud, CI) läuft: Die 3D-Karte bleibt dabei leer.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const dir = process.argv[2] ?? "/tmp/staatsraeson-wahlkampf";
mkdirSync(dir, { recursive: true });
const GROESSEN = [[1280, 720], [1000, 570], [1512, 982], [390, 844]];
const browser = await chromium.launch({ args: ["--disable-3d-apis"] });
let befunde = 0;
const befund = (groesse, text) => { befunde++; console.log(`   ✗ ${groesse}: ${text}`); };

for (const [B, H] of GROESSEN) {
  const g = `${B}×${H}`;
  const page = await browser.newPage({ viewport: { width: B, height: H }, locale: "de-DE" });
  page.on("pageerror", (e) => befund(g, `Seitenfehler: ${e.message}`));
  await page.goto("http://localhost:5173/", { waitUntil: "domcontentloaded" });
  await page.evaluate(async () => {
    const W = await import("/src/sim/world.ts"); const S = await import("/src/sim/scenario.ts");
    const P = await import("/src/sim/prolog.ts"); const Sp = await import("/src/ui/speicher.ts");
    const w = W.createWorld(S.turkey2026, 6); P.startAfterElection(w, P.schnellProfil());
    w.spiel.wahltag = w.day + 56; W.advance(w, 1);
    const r = await Sp.speichereWarten(w); if (!r.ok) throw new Error(r.grund);
  });
  await page.reload({ waitUntil: "domcontentloaded" }); await page.waitForTimeout(2500);

  const klick = async (sel, text) => {
    const ok = await page.evaluate(([sel, text]) => {
      const el = Array.from(document.querySelectorAll(sel)).find((e) => !text || e.textContent?.trim().includes(text));
      if (!el) return false; el.scrollIntoView({ block: "center" }); el.click(); return true;
    }, [sel, text]);
    if (!ok) befund(g, `nicht gefunden: ${sel} „${text}“`);
    await page.waitForTimeout(500);
  };
  const bild = (name) => page.screenshot({ path: `${dir}/${B}x${H}-${name}.png` });
  const sichtbar = (sel) => page.evaluate((sel) => { const e = document.querySelector(sel); return !!e && getComputedStyle(e).visibility !== "hidden" && e.getBoundingClientRect().height > 0; }, sel);
  const mehrzahl = async (wo) => { const t = await page.evaluate(() => document.body.innerText); if (/\b1 Monate\b|\b1 months\b/.test(t)) befund(g, `„1 Monate“ in ${wo}`); };
  const handy = B <= 720;

  await klick("button", "Fortsetzen"); await page.waitForTimeout(2500);
  await bild("00-stand-der-dinge");
  if (await sichtbar(".event-layer") && await sichtbar(".kf-meldungen")) befund(g, "Meldungschips über dem modalen Blatt");
  if (handy && await sichtbar(".event-layer") && await sichtbar(".rn-schalter")) befund(g, "Knopf „Bereiche“ über dem modalen Blatt");
  // Blätter des Spielbeginns wegklicken (Stand der Dinge, Zielwahl, wartende Ereignisse); die Zielwahl wird dabei geprüft
  for (let i = 0; i < 15; i++) {
    if (await page.evaluate(() => !!document.querySelector(".event-layer .ziel-liste"))) {
      await bild("00b-ziele");
      const zu = await page.evaluate(() => Array.from(document.querySelectorAll(".ziel")).filter((z) => z.scrollWidth > z.clientWidth + 1).map((z) => z.textContent?.trim().slice(0, 30)));
      for (const z of zu) befund(g, `Zielkarte läuft über: „${z}“`);
    }
    const weiter = await page.evaluate(() => { const b = Array.from(document.querySelectorAll(".event-layer button")).find((x) => /An die Arbeit|Zum Schreibtisch|Ohne Ziele beginnen|Später entscheiden/.test(x.textContent ?? "")); if (b) { b.click(); return true; } return false; });
    if (!weiter) break; await page.waitForTimeout(400);
  }

  await klick("button", "Gesellschaft"); await klick("button, [role=tab]", "Wahlkampf"); await page.waitForTimeout(800);
  await bild("01-wahlkampf");
  if (handy && await sichtbar(".kf-meldungen")) befund(g, "Meldungschips über der offenen Akte");
  if (handy && await sichtbar(".linsen")) befund(g, "Kartenschalter über der offenen Akte");
  await klick(".kampf-reisen button", ""); await bild("02-reise");
  await klick(".kampf-versprechen-auswahl button", "Rente");
  await page.evaluate(() => document.querySelector(".kampf-versprechen-plan")?.scrollIntoView({ block: "start" })); await page.waitForTimeout(400);
  await bild("03-versprechen-karte"); await mehrzahl("der Wahlversprechen-Karte");
  if (!handy) {
    // Nur zweispaltig: Einspaltig (schmale Akte) steht das Menü über dem Inhalt und scrollt bewusst mit.
    const nav = await page.evaluate(() => { const n = document.querySelector(".ak-navigation"), i = document.querySelector(".ak-inhalt"); if (!n || !i) return null;
      const r = n.getBoundingClientRect(); if (r.right > i.getBoundingClientRect().left) return null; return r.bottom > 0 && r.top < window.innerHeight; });
    if (nav === false) befund(g, "Aktenmenü beim Scrollen aus dem Bild (leere linke Spalte)");
  }
  await page.evaluate(() => document.querySelector(".kampf-versprechen-plan")?.scrollIntoView({ block: "end" })); await page.waitForTimeout(300);
  await bild("04-versprechen-karte-unten");

  await klick("button", "Schreibtisch"); await page.waitForTimeout(600);
  await page.evaluate(() => { const d = document.querySelector("details.sd-krisenrat"); if (d) { d.open = true; d.scrollIntoView({ block: "start" }); } }); await page.waitForTimeout(800);
  await bild("05-krisenrat");
  await klick(".kr-gesetz-wahl button", ""); await page.evaluate(() => document.querySelector(".kr-detail")?.scrollIntoView({ block: "start" })); await page.waitForTimeout(500);
  await bild("06-krisengesetz-karte"); await mehrzahl("der Krisengesetz-Karte");
  console.log(`${g}: geprüft`);
  await page.close();
}

await browser.close();
console.log(befunde === 0 ? "WAHLKAMPF-OBERFLÄCHE: PRÜFUNG BESTANDEN" : `WAHLKAMPF-OBERFLÄCHE: ${befunde} Befunde`);
process.exitCode = befunde === 0 ? 0 : 1;
