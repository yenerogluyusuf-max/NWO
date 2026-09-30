// Aufrufe an das Sprachmodell. Drei Wege:
//   server  der Entwicklungsserver kennt den Schlüssel (game/.env.local) und leitet die Anfrage weiter; der Schlüssel erreicht den Browser nie
//   relay   der eigene Schlüssel liegt im Browser, die Anfrage läuft aber über den Entwicklungsserver (kein Problem mit CORS)
//   direkt  der Browser ruft den Anbieter selbst auf (Claude erlaubt das mit Kennzeichnung, ein lokaler Server sowieso)
// Welche Anbieter es gibt, steht in anbieterliste.ts.

import { ANBIETER, anbieterDef, endpunkt, schluesselWarnung, type AnbieterDef } from "./anbieterliste";
import type { KiAntwortRoh, KiKonfig, KiNachricht } from "./typen";

export interface KiAnfrage {
  /** Stabiler Teil (Regeln, Katalog): wird zum Zwischenspeichern markiert */
  system: string;
  nachrichten: KiNachricht[];
  maxTokens: number;
  signal?: AbortSignal;
}

export class KiFehler extends Error {
  constructor(
    message: string,
    readonly art: "schluessel" | "netz" | "limit" | "server" | "antwort" | "konfig",
  ) {
    super(message);
  }
}

export type Holer = (url: string, init: RequestInit) => Promise<Response>;

const ZEITLIMIT_MS = 60_000;

export interface ServerStatus {
  /** Anbieter, für die der Entwicklungsserver einen Schlüssel kennt */
  anbieter: string[];
  /** Ob der Entwicklungsserver Anfragen weiterleitet */
  relay: boolean;
}

let statusCache: ServerStatus | undefined;

/** Fragt den Entwicklungsserver, welche Schlüssel er kennt; ohne Entwicklungsserver (statisches Hosting) ist das Ergebnis leer. */
export async function serverStatus(holen: Holer = fetch, neu = false): Promise<ServerStatus> {
  if (statusCache && !neu) return statusCache;
  try {
    const r = await holen("/api/ki/status", { method: "GET" });
    const j = r.ok ? ((await r.json()) as { konfiguriert?: boolean; anbieter?: unknown; relay?: boolean }) : {};
    const liste = Array.isArray(j.anbieter) ? j.anbieter.filter((x): x is string => typeof x === "string") : j.konfiguriert === true ? ["anthropic"] : [];
    statusCache = { anbieter: liste, relay: j.relay === true || liste.length > 0 };
  } catch {
    statusCache = { anbieter: [], relay: false };
  }
  return statusCache;
}

export type Modus = "server" | "relay" | "direkt";

export interface Weg {
  anbieter: AnbieterDef;
  modus: Modus;
  modell: string;
  /** Der eigene Schlüssel (leer beim Weg „server“ und beim lokalen Server) */
  schluessel: string;
}

export const MODUS_NAME: Record<Modus, string> = { server: "Schlüssel auf dem Entwicklungsserver", relay: "über den Entwicklungsserver", direkt: "direkt" };

const modellFuer = (k: KiKonfig, a: AnbieterDef): string => (k.modell[a.id] ?? "").trim() || a.standardModell;
const adresseFuer = (k: KiKonfig, a: AnbieterDef): string => (a.lokal ? k.lokalUrl : a.eigeneUrl ? k.eigenUrl : a.basis);

/** Was fehlt, wenn kein Weg offensteht; ein Satz für die Oberfläche. */
export async function konfigProblem(k: KiKonfig, holen: Holer = fetch): Promise<string> {
  if (k.art === "aus") return "Die KI ist ausgeschaltet.";
  if (k.art === "auto") return "Es ist kein Schlüssel eingetragen, und der Entwicklungsserver kennt keinen. Wählen Sie einen Anbieter und tragen Sie seinen Schlüssel ein.";
  const a = anbieterDef(k.art);
  if (!a) return "Der gewählte Anbieter ist unbekannt.";
  if (a.eigeneUrl && !adresseFuer(k, a).trim()) return "Es fehlt die Adresse des Dienstes.";
  if (!modellFuer(k, a)) return `Für ${a.name} fehlt der Modellname: Tragen Sie ihn so ein, wie er in Ihrem Konto steht.`;
  if (!a.lokal && !(k.schluessel[a.id] ?? "").trim() && !(await serverStatus(holen)).anbieter.includes(a.id)) return `Für ${a.name} fehlt der Schlüssel.`;
  return "Die KI ist nicht eingerichtet.";
}

async function wegFuer(k: KiKonfig, a: AnbieterDef, holen: Holer): Promise<Weg | null> {
  const modell = modellFuer(k, a);
  if (!modell) return null;
  if (a.eigeneUrl && !adresseFuer(k, a).trim()) return null;
  if (a.lokal) return { anbieter: a, modus: "direkt", modell, schluessel: "" };
  const schluessel = (k.schluessel[a.id] ?? "").trim();
  if (schluessel) {
    // Claude erlaubt Aufrufe aus dem Browser; die anderen Anbieter sperren sie oft (CORS), dann hilft der Entwicklungsserver
    if (a.protokoll === "anthropic") return { anbieter: a, modus: "direkt", modell, schluessel };
    const st = await serverStatus(holen);
    return { anbieter: a, modus: st.relay ? "relay" : "direkt", modell, schluessel };
  }
  if ((await serverStatus(holen)).anbieter.includes(a.id)) return { anbieter: a, modus: "server", modell, schluessel: "" };
  return null;
}

/** Welchen Weg das Spiel nimmt; `null`, wenn nichts eingerichtet ist. */
export async function waehleWeg(k: KiKonfig, holen: Holer = fetch): Promise<Weg | null> {
  if (k.art === "aus") return null;
  if (k.art !== "auto") {
    const a = anbieterDef(k.art);
    return a ? wegFuer(k, a, holen) : null;
  }
  // Automatisch: zuerst ein Schlüssel auf dem Entwicklungsserver, dann ein eigener, der zu seinem Anbieter passt
  const st = await serverStatus(holen);
  for (const a of ANBIETER) {
    if (a.lokal || !st.anbieter.includes(a.id)) continue;
    const w = await wegFuer({ ...k, art: a.id }, a, holen);
    if (w) return w;
  }
  for (const a of ANBIETER) {
    const s = (k.schluessel[a.id] ?? "").trim();
    if (a.lokal || !s || schluesselWarnung(a.id, s)) continue;
    const w = await wegFuer({ ...k, art: a.id }, a, holen);
    if (w) return w;
  }
  return null;
}

function mitZeitlimit(signal?: AbortSignal): { signal: AbortSignal; ende: () => void } {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), ZEITLIMIT_MS);
  const weiter = () => c.abort();
  signal?.addEventListener("abort", weiter, { once: true });
  return {
    signal: c.signal,
    ende: () => {
      clearTimeout(t);
      signal?.removeEventListener("abort", weiter);
    },
  };
}

function fehlerAus(status: number, text: string, w: Weg): KiFehler {
  const a = w.anbieter;
  let detail = "";
  try {
    const j = JSON.parse(text) as { error?: { message?: string } | string; message?: string };
    detail = typeof j.error === "string" ? j.error : (j.error?.message ?? j.message ?? "");
  } catch {
    detail = text.slice(0, 160);
  }
  if (status === 401 || status === 403) {
    const warnung = schluesselWarnung(a.id, w.schluessel);
    return new KiFehler(`${a.name} hat den Schlüssel abgelehnt. ${warnung ?? "Bitte in den KI-Einstellungen prüfen: Schlüssel und Anbieter müssen zusammenpassen."}`, "schluessel");
  }
  if (status === 429) return new KiFehler(`Bei ${a.name}: zu viele Anfragen oder das Kontingent ist erschöpft. Bitte später noch einmal.`, "limit");
  if (status === 404) return new KiFehler(`Bei ${a.name} wurde das Modell „${w.modell}“ oder die Adresse nicht gefunden${detail ? ` (${detail})` : ""}. Prüfen Sie den Modellnamen in Ihrem Konto.`, "konfig");
  if (status >= 500) return new KiFehler(`${a.name} antwortet gerade nicht (Serverfehler ${status}).`, "server");
  return new KiFehler(`${a.name} hat die Anfrage abgelehnt${detail ? `: ${detail}` : ` (Status ${status})`}.`, "antwort");
}

function textAus(inhalt: unknown): string {
  if (typeof inhalt === "string") return inhalt;
  if (Array.isArray(inhalt)) return inhalt.map((t) => (typeof t === "string" ? t : ((t as { text?: string }).text ?? ""))).join("");
  return "";
}

/** Ruft das Modell auf und liefert den Antworttext samt Verbrauch. */
export async function rufeAuf(k: KiKonfig, a: KiAnfrage, holen: Holer = fetch): Promise<KiAntwortRoh> {
  const weg = await waehleWeg(k, holen);
  if (!weg) throw new KiFehler(await konfigProblem(k, holen), "konfig");
  const an = weg.anbieter;
  const zeit = mitZeitlimit(a.signal);
  try {
    let body: unknown;
    if (an.protokoll === "anthropic") {
      body = {
        model: weg.modell,
        max_tokens: a.maxTokens,
        system: [{ type: "text", text: a.system, cache_control: { type: "ephemeral" } }],
        messages: a.nachrichten.map((n) => ({ role: n.rolle, content: n.text })),
      };
    } else {
      body = {
        model: weg.modell,
        [an.tokenFeld]: a.maxTokens,
        ...(an.temperatur !== null ? { temperature: an.temperatur } : {}),
        ...(an.extra ?? {}),
        messages: [{ role: "system", content: a.system }, ...a.nachrichten.map((n) => ({ role: n.rolle, content: n.text }))],
      };
    }
    const ueberServer = weg.modus !== "direkt";
    const url = ueberServer ? "/api/ki/relay" : endpunkt(an, adresseFuer(k, an));
    const kopf: Record<string, string> = { "content-type": "application/json" };
    if (ueberServer) {
      kopf["x-ki-anbieter"] = an.id;
      if (weg.schluessel) kopf["x-ki-schluessel"] = weg.schluessel;
      if (an.eigeneUrl) kopf["x-ki-url"] = adresseFuer(k, an);
    } else if (an.protokoll === "anthropic") {
      kopf["x-api-key"] = weg.schluessel;
      kopf["anthropic-version"] = "2023-06-01";
      // Ohne diese Kennzeichnung lässt die API Aufrufe aus dem Browser nicht zu; der Schlüssel liegt hier nur auf diesem Rechner
      kopf["anthropic-dangerous-direct-browser-access"] = "true";
    } else if (weg.schluessel) {
      kopf["authorization"] = `Bearer ${weg.schluessel}`;
    }
    const antwort = await holen(url, { method: "POST", headers: kopf, body: JSON.stringify(body), signal: zeit.signal });
    const text = await antwort.text();
    if (!antwort.ok) throw fehlerAus(antwort.status, text, weg);
    if (an.protokoll === "anthropic") {
      const j = JSON.parse(text) as { content?: { type: string; text?: string }[]; usage?: { input_tokens?: number; output_tokens?: number }; model?: string };
      const t = (j.content ?? []).filter((b) => b.type === "text").map((b) => b.text ?? "").join("");
      return { text: t, tokensEin: j.usage?.input_tokens ?? 0, tokensAus: j.usage?.output_tokens ?? 0, modell: j.model ?? weg.modell };
    }
    const j = JSON.parse(text) as { choices?: { message?: { content?: unknown } }[]; usage?: { prompt_tokens?: number; completion_tokens?: number }; model?: string };
    return { text: textAus(j.choices?.[0]?.message?.content), tokensEin: j.usage?.prompt_tokens ?? 0, tokensAus: j.usage?.completion_tokens ?? 0, modell: j.model ?? weg.modell };
  } catch (e) {
    if (e instanceof KiFehler) throw e;
    if ((e as Error).name === "AbortError") throw new KiFehler("Die Antwort hat zu lange gedauert oder wurde abgebrochen.", "netz");
    if (weg.modus === "direkt" && !an.lokal && an.protokoll !== "anthropic") {
      throw new KiFehler(`Keine Verbindung zu ${an.name}. Möglicherweise sperrt der Anbieter Aufrufe aus dem Browser: Starten Sie das Spiel mit dem Entwicklungsserver (npm run dev), dann läuft der Aufruf über ihn.`, "netz");
    }
    throw new KiFehler(an.lokal ? "Der lokale Server antwortet nicht. Läuft er, und stimmt die Adresse?" : `Keine Verbindung zu ${an.name}. Läuft das Netz, und ist der Dienst erreichbar?`, "netz");
  } finally {
    zeit.ende();
  }
}
