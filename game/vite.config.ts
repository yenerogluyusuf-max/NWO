import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { ANBIETER, anbieterDef, endpunkt, istPrivaterHost } from "./src/ki/anbieterliste.ts";

/**
 * Weiterleitung zum Sprachmodell nur für den Entwicklungsserver. Schlüssel aus der Umgebung oder aus game/.env.local
 * (ANTHROPIC_API_KEY, MIMO_API_KEY, DEEPSEEK_API_KEY, OPENAI_API_KEY, GEMINI_API_KEY, OPENROUTER_API_KEY, MISTRAL_API_KEY,
 * KI_EIGEN_API_KEY) bleiben auf dem Rechner und erreichen nie den Browser. Ein eigener Schlüssel aus dem Browser wird nur
 * durchgereicht (das umgeht die CORS-Sperre mancher Anbieter). Es werden nur Anfragen von localhost angenommen, nur
 * JSON-Anfragen (das löst bei fremden Seiten eine Vorprüfung aus, die scheitert), nur öffentliche https-Ziele und höchstens
 * 4000 Ausgabe-Token.
 */
function kiRelay(schluessel: Record<string, string>): Plugin {
  const lokal = (host: string | undefined) => /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host ?? "");
  return {
    name: "staatsraeson-ki-relay",
    configureServer(server) {
      server.middlewares.use("/api/ki/status", (req, res) => {
        res.setHeader("content-type", "application/json");
        const ok = lokal(req.headers.host);
        res.end(JSON.stringify({ konfiguriert: ok && Object.keys(schluessel).length > 0, anbieter: ok ? Object.keys(schluessel) : [], relay: ok }));
      });
      server.middlewares.use("/api/ki/relay", (req, res) => {
        const antwort = (status: number, body: unknown) => {
          res.statusCode = status;
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify(body));
        };
        const kopf = (n: string) => {
          const v = req.headers[n];
          return (Array.isArray(v) ? v[0] : v)?.trim() ?? "";
        };
        if (req.method !== "POST") return antwort(405, { error: { message: "Nur POST." } });
        if (!lokal(req.headers.host)) return antwort(403, { error: { message: "Nur von localhost." } });
        const origin = kopf("origin");
        if (origin && !lokal(origin.replace(/^https?:\/\//, ""))) return antwort(403, { error: { message: "Nur von der eigenen Seite." } });
        if (!/^application\/json/.test(kopf("content-type"))) return antwort(415, { error: { message: "Nur JSON." } });
        const a = anbieterDef(kopf("x-ki-anbieter"));
        if (!a || a.lokal) return antwort(400, { error: { message: "Unbekannter Anbieter." } });
        const ziel = a.eigeneUrl ? endpunkt(a, kopf("x-ki-url")) : endpunkt(a);
        let url: URL;
        try {
          url = new URL(ziel);
        } catch {
          return antwort(400, { error: { message: "Die Adresse des Dienstes ist ungültig." } });
        }
        if (url.protocol !== "https:" || istPrivaterHost(url.hostname)) return antwort(400, { error: { message: "Nur öffentliche https-Adressen." } });
        const key = kopf("x-ki-schluessel") || schluessel[a.id] || "";
        if (!key) return antwort(503, { error: { message: `Für ${a.name} ist kein Schlüssel eingetragen.` } });
        const teile: Buffer[] = [];
        let groesse = 0;
        req.on("data", (c: Buffer) => {
          groesse += c.length;
          if (groesse > 400_000) req.destroy();
          else teile.push(c);
        });
        req.on("end", async () => {
          try {
            const body = JSON.parse(Buffer.concat(teile).toString("utf-8")) as Record<string, unknown>;
            if (typeof body.model !== "string" || !body.model.trim()) return antwort(400, { error: { message: "Es fehlt der Modellname." } });
            if (a.id === "anthropic" && !/^claude-[a-z0-9.-]+$/.test(body.model)) return antwort(400, { error: { message: "Unbekanntes Modell." } });
            const tokens = body.max_tokens ?? body.max_completion_tokens;
            if (typeof tokens !== "number" || tokens < 1 || tokens > 4000) return antwort(400, { error: { message: "Die Ausgabelänge muss zwischen 1 und 4000 Token liegen." } });
            const r = await fetch(url, {
              method: "POST",
              headers:
                a.protokoll === "anthropic"
                  ? { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" }
                  : { "content-type": "application/json", authorization: `Bearer ${key}` },
              body: JSON.stringify(body),
            });
            res.statusCode = r.status;
            res.setHeader("content-type", "application/json");
            res.end(await r.text());
          } catch {
            antwort(502, { error: { message: `${a.name} ist vom Entwicklungsserver aus nicht erreichbar.` } });
          }
        });
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const schluessel: Record<string, string> = {};
  for (const a of ANBIETER) {
    const wert = a.envVar ? (env[a.envVar] || process.env[a.envVar] || "").trim() : "";
    if (wert) schluessel[a.id] = wert;
  }
  return { plugins: [react(), kiRelay(schluessel)] };
});
