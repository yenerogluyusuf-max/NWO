// Staatsräson als Mac-App: Eine schlanke Electron-Hülle um das fertig gebaute Spiel (game/dist).
// - Das Spiel läuft unter app://spiel/ (eigenes Protokoll), ohne Entwicklungsserver, ohne Neuladen bei Dateiänderungen.
// - Die Weiterleitung zum Sprachmodell (/api/ki/status, /api/ki/relay) übernimmt die App selbst; sie arbeitet wie die im Entwicklungsserver
//   (vite.config.ts): nur öffentliche https-Ziele, nur JSON, höchstens 4000 Ausgabe-Token. Schlüssel kommen aus dem Spiel (Eingabefeld,
//   bleibt im Profil der App) oder aus der Datei „.env.local“ im Datenordner der App. Die Umgebungsvariablen der Shell werden NICHT gelesen.
// - Spielstände liegen in IndexedDB im Profil der App (~/Library/Application Support/Staatsräson), nicht im iCloud-Schreibtisch.

const { app, BrowserWindow, Menu, protocol, shell, session } = require("electron");
const path = require("node:path");
const fs = require("node:fs");
const { pathToFileURL } = require("node:url");
const { Readable } = require("node:stream");

const ENTWICKLUNG = process.argv.includes("--dev");
const DIST = path.join(__dirname, "dist");

protocol.registerSchemesAsPrivileged([
  { scheme: "app", privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true } },
]);

let anbieter = null;

async function ladeAnbieter() {
  anbieter = await import(pathToFileURL(path.join(__dirname, "ki", "anbieterliste.mjs")).href);
}

/** Schlüssel aus <Datenordner>/.env.local (Zeilen NAME=WERT); sonst keine. */
function schluesselAusDatei() {
  const werte = {};
  try {
    const text = fs.readFileSync(path.join(app.getPath("userData"), ".env.local"), "utf8");
    for (const zeile of text.split(/\r?\n/)) {
      if (/^\s*#/.test(zeile)) continue;
      const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(zeile);
      if (m) werte[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    /* keine Datei: nur die Schlüssel aus dem Spiel */
  }
  const keys = {};
  for (const a of anbieter.ANBIETER) if (a.envVar && werte[a.envVar]) keys[a.id] = werte[a.envVar];
  return keys;
}

const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

async function relay(request) {
  if (request.method !== "POST") return json(405, { error: { message: "Nur POST." } });
  const kopf = (n) => (request.headers.get(n) ?? "").trim();
  if (!/^application\/json/.test(kopf("content-type"))) return json(415, { error: { message: "Nur JSON." } });
  const a = anbieter.anbieterDef(kopf("x-ki-anbieter"));
  if (!a || a.lokal) return json(400, { error: { message: "Unbekannter Anbieter." } });
  const key = kopf("x-ki-schluessel") || schluesselAusDatei()[a.id] || "";
  const ziel = a.eigeneUrl ? anbieter.endpunkt(a, kopf("x-ki-url")) : anbieter.endpunkt(a, undefined, key);
  let url;
  try {
    url = new URL(ziel);
  } catch {
    return json(400, { error: { message: "Die Adresse des Dienstes ist ungültig." } });
  }
  if (url.protocol !== "https:" || anbieter.istPrivaterHost(url.hostname)) return json(400, { error: { message: "Nur öffentliche https-Adressen." } });
  if (!key) return json(503, { error: { message: `Für ${a.name} ist kein Schlüssel eingetragen.` } });
  const text = await request.text();
  if (text.length > 400_000) return json(413, { error: { message: "Anfrage zu groß." } });
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    return json(400, { error: { message: "Kein gültiges JSON." } });
  }
  if (typeof body.model !== "string" || !body.model.trim()) return json(400, { error: { message: "Es fehlt der Modellname." } });
  if (a.id === "anthropic" && !/^claude-[a-z0-9.-]+$/.test(body.model)) return json(400, { error: { message: "Unbekanntes Modell." } });
  const tokens = body.max_tokens ?? body.max_completion_tokens;
  if (typeof tokens !== "number" || tokens < 1 || tokens > 4000) return json(400, { error: { message: "Die Ausgabelänge muss zwischen 1 und 4000 Token liegen." } });
  try {
    const r = await fetch(url, {
      method: "POST",
      headers:
        a.protokoll === "anthropic"
          ? { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" }
          : { "content-type": "application/json", authorization: `Bearer ${key}`, ...(a.auchApiKeyKopf ? { "api-key": key } : {}) },
      body: JSON.stringify(body),
    });
    return new Response(await r.text(), { status: r.status, headers: { "content-type": "application/json" } });
  } catch {
    return json(502, { error: { message: `${a.name} ist von der App aus nicht erreichbar.` } });
  }
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".wasm": "application/wasm",
  ".gz": "application/gzip",
  ".txt": "text/plain; charset=utf-8",
  ".map": "application/json",
};

/** Liefert eine Datei aus dem Spielordner. Bewusst ohne net.fetch: Das scheitert an Umlauten im Pfad (Staatsräson.app). */
async function dateiAntwort(pfad) {
  let rel;
  try {
    rel = decodeURIComponent(pfad);
  } catch {
    return new Response("Ungültige Adresse", { status: 400 });
  }
  if (rel.endsWith("/")) rel += "index.html";
  const datei = path.normalize(path.join(DIST, rel));
  if (!datei.startsWith(DIST + path.sep)) return new Response("Nicht erlaubt", { status: 403 });
  try {
    const st = await fs.promises.stat(datei);
    if (!st.isFile()) return new Response("Nicht gefunden", { status: 404 });
    return new Response(Readable.toWeb(fs.createReadStream(datei)), {
      status: 200,
      headers: {
        "content-type": MIME[path.extname(datei).toLowerCase()] ?? "application/octet-stream",
        "content-length": String(st.size),
        "cache-control": "no-cache",
      },
    });
  } catch {
    return new Response("Nicht gefunden", { status: 404 });
  }
}

function menue() {
  Menu.setApplicationMenu(
    Menu.buildFromTemplate([
      {
        label: "Staatsräson",
        submenu: [{ role: "about", label: "Über Staatsräson" }, { type: "separator" }, { role: "hide", label: "Staatsräson ausblenden" }, { role: "hideOthers" }, { role: "unhide" }, { type: "separator" }, { role: "quit", label: "Staatsräson beenden" }],
      },
      {
        label: "Ansicht",
        submenu: [
          { role: "togglefullscreen", label: "Vollbild" },
          { type: "separator" },
          { role: "zoomIn", label: "Größer" },
          { role: "zoomOut", label: "Kleiner" },
          { role: "resetZoom", label: "Normale Größe" },
          { type: "separator" },
          { role: "reload", label: "Neu laden" },
          ...(ENTWICKLUNG ? [{ role: "toggleDevTools" }] : []),
        ],
      },
      { label: "Fenster", submenu: [{ role: "minimize", label: "Im Dock ablegen" }, { role: "zoom", label: "Zoomen" }] },
    ]),
  );
}

/** Ladefehler und abgestürzte Anzeigeprozesse landen in <Logordner>/spiel.log (Finder: ~/Library/Logs/Staatsräson). */
function logge(text) {
  try {
    fs.mkdirSync(app.getPath("logs"), { recursive: true });
    fs.appendFileSync(path.join(app.getPath("logs"), "spiel.log"), `${new Date().toISOString()} ${text}\n`);
  } catch {
    /* ohne Protokoll läuft das Spiel trotzdem */
  }
}

function fenster() {
  const win = new BrowserWindow({
    width: 1560,
    height: 980,
    minWidth: 1000,
    minHeight: 640,
    backgroundColor: "#14100b",
    title: "Staatsräson",
    show: false,
    webPreferences: { contextIsolation: true, sandbox: true, devTools: ENTWICKLUNG, spellcheck: false },
  });
  win.once("ready-to-show", () => win.show());
  win.webContents.on("did-fail-load", (_e, code, beschreibung, url) => logge(`Laden fehlgeschlagen (${code} ${beschreibung}): ${url}`));
  win.webContents.on("render-process-gone", (_e, d) => logge(`Anzeigeprozess beendet: ${d.reason}`));
  win.webContents.on("console-message", (e) => {
    if ((e.level === "error" || e.level === 3) && !/getBoundingClientRect/.test(e.message ?? "")) logge(`Konsole: ${e.message}`);
  });
  // Links nach außen öffnen im Browser, nie im Spielfenster
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url)) shell.openExternal(url);
    return { action: "deny" };
  });
  win.webContents.on("will-navigate", (e, url) => {
    if (!url.startsWith("app://spiel/")) {
      e.preventDefault();
      if (/^https?:/.test(url)) shell.openExternal(url);
    }
  });
  win.loadURL("app://spiel/");
  return win;
}

app.setName("Staatsräson");

// Tests und Prüfläufe dürfen nie das echte Profil benutzen (dort liegen die Spielstände): STAATSRAESON_PROFIL=<Ordner> legt ein eigenes an.
if (process.env.STAATSRAESON_PROFIL) app.setPath("userData", process.env.STAATSRAESON_PROFIL);

// Nur eine Instanz: Ein zweiter Start holt das vorhandene Fenster nach vorn, statt ein leeres zweites zu öffnen
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", () => {
    const w = BrowserWindow.getAllWindows()[0];
    if (w) {
      if (w.isMinimized()) w.restore();
      w.focus();
    }
  });
}

app.whenReady().then(async () => {
  await ladeAnbieter();
  // Electron hängt den App-Namen an die Browserkennung („…Staatsräson/0.1.0 Chrome/…“). Das „ä“ darin lässt jede Anfrage an das
  // eigene Protokoll scheitern („Cannot convert argument to a ByteString“), das Fenster bliebe leer. Darum eine rein ASCII-Kennung.
  const kennung = session.defaultSession.getUserAgent().replace(/\sStaatsr\S*\/\S+/i, "").replace(/[^\x20-\x7e]/g, "");
  session.defaultSession.setUserAgent(kennung);
  app.userAgentFallback = kennung;
  protocol.handle("app", (request) => {
    const url = new URL(request.url);
    if (url.pathname === "/api/ki/status") {
      const keys = schluesselAusDatei();
      return json(200, { konfiguriert: Object.keys(keys).length > 0, anbieter: Object.keys(keys), relay: true });
    }
    if (url.pathname === "/api/ki/relay") return relay(request);
    return dateiAntwort(url.pathname);
  });
  // Ein lokaler Modellserver (127.0.0.1) antwortet ohne Freigabe-Kopfzeilen; die App erlaubt den Zugriff nur für diese Adressen
  session.defaultSession.webRequest.onHeadersReceived({ urls: ["http://127.0.0.1/*", "http://localhost/*", "http://[::1]/*", "https://127.0.0.1/*", "https://localhost/*"] }, (details, rueckruf) => {
    const h = { ...details.responseHeaders };
    try {
      const u = new URL(details.url);
      if (u.hostname === "127.0.0.1" || u.hostname === "localhost" || u.hostname === "[::1]") {
        h["access-control-allow-origin"] = ["app://spiel"];
        h["access-control-allow-headers"] = ["*"];
        h["access-control-allow-methods"] = ["GET, POST, OPTIONS"];
      }
    } catch {
      /* unverändert */
    }
    rueckruf({ responseHeaders: h });
  });
  menue();
  fenster();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) fenster();
  });
});

// Beim Beenden (Cmd+Q, Dock, Neustart) sichert das Spiel zuerst den Stand; erst danach schließt die App. Höchstens 8 Sekunden Wartezeit.
let sichertBeimBeenden = false;
app.on("before-quit", (e) => {
  if (sichertBeimBeenden) return;
  const fenster = BrowserWindow.getAllWindows()[0];
  if (!fenster || fenster.isDestroyed()) return;
  e.preventDefault();
  sichertBeimBeenden = true;
  const frist = new Promise((ok) => setTimeout(ok, 8000));
  const sichern = fenster.webContents.executeJavaScript("typeof window.__sichereJetzt === 'function' ? window.__sichereJetzt() : null").catch(() => null);
  Promise.race([sichern, frist]).finally(() => app.quit());
});

app.on("window-all-closed", () => app.quit());
