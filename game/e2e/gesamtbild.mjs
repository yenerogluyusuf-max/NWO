// Gesamtbild (ENTSCHEIDUNGEN T): fotografiert jede Art von Bildschirm (Titel, Fenster, Schreibtisch, Karte, Menü, Politik, Akten, Krieg)
// und misst Schriften, Größen, Knöpfe, Flächen und Rundungen über das ganze Spiel. Jede Gestaltungsänderung wird an diesem Bogen geprüft,
// nicht an der einen Seite. Aufruf (Entwicklungsserver auf 5173): node e2e/gesamtbild.mjs <ordner> 1440 900; danach
// python3 e2e/gesamtbild-auswertung.py <ordner>/stil.json und python3 e2e/gesamtbild-bogen.py <ordner> <bogen.png>
import { createRequire } from "node:module"; import { writeFileSync, mkdirSync } from "node:fs";
const { chromium } = createRequire(import.meta.url)("playwright");
const [dir, B, H] = [process.argv[2], +process.argv[3], +process.argv[4]];
mkdirSync(dir, { recursive: true });
const browser = await chromium.launch({ args: ["--disable-3d-apis"] });
const page = await browser.newPage({ viewport: { width: B, height: H }, locale: "de-DE", deviceScaleFactor: 1 });
page.on("pageerror", (e) => console.log("SEITENFEHLER:", e.message));
const stil = {}; let n = 0;
const messe = async () => page.evaluate(() => {
  const sicht = (e) => { const r = e.getBoundingClientRect(); return r.width > 2 && r.height > 2 && r.bottom > 0 && r.top < innerHeight && getComputedStyle(e).visibility !== "hidden"; };
  const knoepfe = Array.from(document.querySelectorAll("button")).filter(sicht).map((b) => { const c = getComputedStyle(b); return `${c.backgroundColor}|${c.backgroundImage.slice(0, 40)}|${c.borderRadius}|${c.fontFamily.split(",")[0]}|${c.borderTopColor}`; });
  const texte = Array.from(document.querySelectorAll("p,span,h1,h2,h3,h4,li,dt,dd,small,b,strong,label,a,button")).filter(sicht).filter((e) => Array.from(e.childNodes).some((x) => x.nodeType === 3 && x.textContent.trim()));
  const schriften = texte.map((e) => getComputedStyle(e).fontFamily.split(",")[0].replace(/"/g, ""));
  const groessen = texte.map((e) => getComputedStyle(e).fontSize);
  const flaechen = Array.from(document.querySelectorAll("div,section,article,aside,nav,header,li")).filter(sicht).map((e) => getComputedStyle(e).backgroundColor).filter((c) => c !== "rgba(0, 0, 0, 0)");
  const radien = Array.from(document.querySelectorAll("div,section,article,aside,button,li")).filter(sicht).map((e) => getComputedStyle(e).borderTopLeftRadius).filter((r) => r !== "0px");
  return { knoepfe, schriften, groessen, flaechen, radien };
});
const foto = async (name) => { n++; const f = `${String(n).padStart(2, "0")}-${name}`.replace(/[^\wäöüÄÖÜß-]+/g, "_"); await page.screenshot({ path: `${dir}/${f}.png` }); stil[f] = await messe(); };
const klick = (re, sel = "button") => page.evaluate(([re, sel]) => { const b = Array.from(document.querySelectorAll(sel)).find((x) => new RegExp(re).test((x.textContent || "") + " " + (x.getAttribute("aria-label") || ""))); if (b) { b.click(); return true; } return false; }, [re, sel]);
const warte = (ms) => page.waitForTimeout(ms);
const WEG = "An die Arbeit|Zum Schreibtisch|Ohne Ziele beginnen|Später entscheiden|Verstanden|Schließen";
await page.goto("http://localhost:5173/", { waitUntil: "domcontentloaded" }); await warte(3000); await foto("Titelbild");
await page.evaluate(async () => {
  const W = await import("/src/sim/world.ts"); const S = await import("/src/sim/scenario.ts"); const P = await import("/src/sim/prolog.ts");
  const Sp = await import("/src/ui/speicher.ts"); const K = await import("/src/sim/krieg.ts"); const L = await import("/src/sim/laender.ts"); const R = await import("/src/sim/rng.ts");
  const w = W.createWorld(S.turkey2026, 6); P.startAfterElection(w, P.schnellProfil()); w.spiel.wahltag = w.day + 600; W.advance(w, 40);
  w.spiel.kapital = 120; L.weltZustand(w).IRN.konflikt = 99; K.kriegMonat(w, new R.Rng(3));
  for (let i = 0; i < 60 && !K.kriege(w).some((k) => k.phase === "krieg"); i++) W.advance(w, 1);
  W.advance(w, 28); await Sp.speichereWarten(w);
});
await page.reload({ waitUntil: "domcontentloaded" }); await warte(2500); await foto("Titelbild_mit_Spielstand");
await klick("Fortsetzen"); await warte(4000);
for (let i = 0; i < 4; i++) {
  if (await page.evaluate(() => !!document.querySelector(".event-layer"))) await foto(`Fenster_${i + 1}`);
  const w = await klick(WEG, ".event-layer button"); if (!w) break; await warte(500);
}
for (let i = 0; i < 15; i++) { const w = await klick(WEG, ".event-layer button"); if (!w) break; await warte(300); }
await foto("Schreibtisch");
for (const r of ["Chronik", "Berichte", "Spielstand"]) { await klick(`^\\s*${r}\\s*$`, ".dossier-tabs button, .dossier-head button"); await warte(900); await foto(`Schreibtisch_${r}`); }
await page.evaluate(() => document.querySelector(".dossier .close")?.click()); await warte(1200); await foto("Karte");
await klick("Menü|Hauptmenü|menu", ".kopfleiste button, header button"); await warte(700); await foto("Kopfmenue"); await page.keyboard.press("Escape"); await warte(400);
const gehe = (gr) => page.evaluate((gr) => { document.querySelector(".dossier .close")?.click(); }).then(() => page.waitForTimeout(500)).then(() => page.evaluate((gr) => Array.from(document.querySelectorAll(".regierungs-navigation button")).find(x => x.textContent.trim().replace(/\d+$/, "").trim() === gr)?.click(), gr));
await gehe("Politik"); await warte(1300); await foto("Politik");
for (const r of ["Vorschläge", "Wirkungsnetz"]) { await klick(`^\\s*${r}\\s*$`, ".dossier-tabs button"); await warte(900); await foto(`Politik_${r}`); }
const AKTEN = [["Wirtschaft", "Wirtschaftslage"], ["Wirtschaft", "Haushalt"], ["Parlament & Gesetze", "Fraktionen und Abstimmung"], ["Kabinett & Verwaltung", "Ministerrat & Kabinett"], ["Gesellschaft", "Wahlkampf"], ["Land", "Infrastruktur und Bau"], ["Forschung & Ziele", "Wissensbaum"], ["Forschung & Ziele", "Große Ziele"], ["Außen", "Länder und Diplomatie"], ["Sicherheit", "Sicherheitslage"], ["Sicherheit", "Streitkräfte"], ["Medien", "Zeitung"]];
for (const [gr, u] of AKTEN) {
  await gehe(gr); await warte(1100);
  await page.evaluate((u) => Array.from(document.querySelectorAll(".ak-navigation button")).find(b => b.textContent.trim() === u)?.click(), u); await warte(1000);
  await page.evaluate(() => document.querySelector(".ak-arbeitsplatz")?.scrollIntoView({ block: "start" })); await warte(300); await foto(`${gr}_${u}`);
}
await gehe("Sicherheit"); await warte(1100); await page.evaluate(() => (document.querySelector(".gz-konflikt.krieg button") ?? document.querySelector(".gz-konflikt button"))?.click()); await warte(1800); await foto("Krieg");
writeFileSync(`${dir}/stil.json`, JSON.stringify(stil));
console.log(n, "Bilder");
await browser.close();
