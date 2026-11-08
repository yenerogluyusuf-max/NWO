import { chromium } from "/Users/yusufyeneroglu/Desktop/Staatsraeson/game/node_modules/playwright/index.mjs";
const dir = process.argv[2];
const browser = await chromium.launch({ channel: "chromium", args: ["--use-angle=metal", "--ignore-gpu-blocklist", "--enable-gpu-rasterization", "--enable-webgl"] });
const page = await browser.newPage({ viewport: { width: 1512, height: 982 }, deviceScaleFactor: 2 });
const errors = [];
page.on("pageerror", (e) => errors.push("PAGEERROR " + e.message));
page.on("console", (m) => { if (["error", "warning"].includes(m.type())) errors.push(m.type() + ": " + m.text().slice(0, 200)); });
const tap = (label) => page.locator(`button[aria-label="${label}"], button:has-text("${label}")`).first().evaluate((el) => el.click());

const t0 = Date.now();
await page.goto("http://localhost:5173/?schnellstart", { waitUntil: "networkidle" });
await page.waitForSelector("canvas.atlas-canvas", { timeout: 20000 });
await page.waitForFunction(() => !document.querySelector(".atlas-loading"), null, { timeout: 60000 });
console.log("Zeit bis Karte fertig gezeichnet:", Date.now() - t0, "ms");
await page.waitForTimeout(1500);

const info = await page.evaluate(() => {
  const c = document.querySelector("canvas.atlas-canvas");
  const gl = c.getContext("webgl2") || c.getContext("webgl");
  const ext = gl && gl.getExtension("WEBGL_debug_renderer_info");
  return {
    cssW: c.clientWidth, cssH: c.clientHeight, bufW: c.width, bufH: c.height, dpr: devicePixelRatio,
    renderer: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : "?",
    maxTex: gl ? gl.getParameter(gl.MAX_TEXTURE_SIZE) : "?",
    maxAniso: gl && gl.getExtension("EXT_texture_filter_anisotropic") ? gl.getParameter(gl.getExtension("EXT_texture_filter_anisotropic").MAX_TEXTURE_MAX_ANISOTROPY_EXT) : "?",
  };
});
console.log("Canvas:", JSON.stringify(info));

await tap("An die Arbeit");
await page.waitForTimeout(500);
await page.screenshot({ path: `${dir}/01-uebersicht.png` });

// FPS im Ruhezustand
const fps = await page.evaluate(() => new Promise((res) => { let n = 0; const t = performance.now(); const f = () => { n++; if (performance.now() - t < 3000) requestAnimationFrame(f); else res(n / 3); }; requestAnimationFrame(f); }));
console.log("FPS Ruhe (Übersicht):", fps.toFixed(1));

// Maximal hineinzoomen und nach Hatay/Adana schwenken
const box = { x: 756, y: 500 };
await page.mouse.move(box.x, box.y);
for (let i = 0; i < 18; i++) { await page.mouse.wheel(0, -300); await page.waitForTimeout(60); }
await page.waitForTimeout(600);
await page.screenshot({ path: `${dir}/02-max-zoom-mitte.png` });

await page.mouse.move(900, 800); await page.mouse.down();
await page.mouse.move(680, 250, { steps: 25 }); await page.mouse.up();
await page.waitForTimeout(900);
await page.screenshot({ path: `${dir}/03-max-zoom-hatay.png` });
const fps2 = await page.evaluate(() => new Promise((res) => { let n = 0; const t = performance.now(); const f = () => { n++; if (performance.now() - t < 3000) requestAnimationFrame(f); else res(n / 3); }; requestAnimationFrame(f); }));
console.log("FPS Ruhe (Nahansicht):", fps2.toFixed(1));

// Zwischenzoom
for (let i = 0; i < 6; i++) { await page.mouse.wheel(0, 300); await page.waitForTimeout(60); }
await page.waitForTimeout(500);
await page.screenshot({ path: `${dir}/04-mittlerer-zoom.png` });

console.log("Konsole/Fehler:", errors.length ? errors.join("\n") : "keine");
await browser.close();
