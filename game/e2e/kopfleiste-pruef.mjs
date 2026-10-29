// Kopfleiste-Prüfung (Ende des Kopfleisten-Strangs): In drei Fenstergrößen (1000×570, 1280×720, 1512×982)
// müssen die vier Zonen (Wer, Wann, Wie, Menü) nebeneinander passen — ohne Überlappung, ohne Überlauf
// über das Fenster, ohne abgeschnittene Zahlen. Aufruf: Dev-Server starten (npm run dev), dann
// node e2e/kopfleiste-pruef.mjs
import { chromium } from "playwright";

const GROESSEN = [
  [1000, 570],
  [1280, 720],
  [1512, 982],
];

const browser = await chromium.launch();
let bemängelt = 0;

for (const [breite, hoehe] of GROESSEN) {
  const page = await browser.newPage({ viewport: { width: breite, height: hoehe } });
  page.on("pageerror", (e) => console.log(`SEITENFEHLER (${breite}×${hoehe}):`, e.message));
  await page.goto("http://localhost:5173/?schnellstart", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);

  const befund = await page.evaluate(() => {
    const fehler = [];
    const leiste = document.querySelector(".kf");
    if (!leiste) return ["Keine Kopfleiste (.kf) gefunden"];
    // Die Hover-Tipps sind im DOM immer da und blähen scrollWidth auf: Für die Prüfung nur den stehenden Teil.
    const stil = document.createElement("style");
    stil.textContent = ".kf .tip { display: none !important; }";
    document.head.appendChild(stil);
    const zone = (name) => leiste.querySelector(`.kf-${name}`);
    const box = (el) => {
      const r = el.getBoundingClientRect();
      return { x: r.x, r: r.right, b: r.bottom };
    };
    // 1) Reihenfolge und Nichtüberlappung der Zonen
    const zonen = ["wer", "wann", "wie", "menue"].map((n) => ({ n, el: zone(n) }));
    for (const z of zonen) if (!z.el) fehler.push(`Zone kf-${z.n} fehlt`);
    const vorhanden = zonen.filter((z) => z.el);
    for (let i = 1; i < vorhanden.length; i++) {
      const a = box(vorhanden[i - 1].el);
      const b = box(vorhanden[i].el);
      if (b.x < a.r - 0.5) fehler.push(`kf-${vorhanden[i - 1].n} und kf-${vorhanden[i].n} überlappen um ${Math.round(a.r - b.x)} px`);
    }
    // 2) Nichts ragt über das Fenster oder unter die Leiste hinaus
    const oben = box(leiste);
    for (const z of vorhanden) {
      const b = box(z.el);
      if (b.r > window.innerWidth + 0.5) fehler.push(`kf-${z.n} ragt ${Math.round(b.r - window.innerWidth)} px über das Fenster`);
      if (b.b > oben.b + 0.5) fehler.push(`kf-${z.n} hängt unter der Leiste (${Math.round(b.b - oben.b)} px)`);
    }
    // 3) Zahlen nicht abgeschnitten: jede Kennzahl passt in sich selbst
    for (const zahl of Array.from(leiste.querySelectorAll(".kf-zahl"))) {
      if (zahl.scrollWidth > zahl.clientWidth + 1) fehler.push(`Kennzahl „${zahl.textContent?.slice(0, 24)}“ abgeschnitten (${zahl.scrollWidth} > ${zahl.clientWidth})`);
    }
    // 4) Menüklappe erreichbar und vollständig sichtbar
    const menue = zone("menue");
    if (menue && menue.getBoundingClientRect().right > window.innerWidth) fehler.push("Menüknopf ragt über den rechten Rand");
    return fehler;
  });

  if (befund.length === 0) {
    console.log(`✓ ${breite}×${hoehe}: Kopfleiste ohne Befund`);
  } else {
    bemängelt += befund.length;
    console.log(`✗ ${breite}×${hoehe}:`);
    for (const f of befund) console.log(`   - ${f}`);
  }
  await page.close();
}

await browser.close();
console.log(bemängelt === 0 ? "KOPFLEISTE: PRÜFUNG BESTANDEN" : `KOPFLEISTE: ${bemängelt} Befunde`);
process.exitCode = bemängelt === 0 ? 0 : 1;
