// Sprachmodell im Gespräch: Antworten lesen, Vorschläge prüfen und ausführen, Anfragen aufbauen, Fehler melden.
// Die Tests laufen ohne Netz: Der Anbieter wird durch einen Ersatz ersetzt (kein Aufruf, keine Kosten).

import { describe, expect, test } from "vitest";
import { createWorld } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { startAfterElection, schnellProfil } from "../src/sim/prolog";
import { leseAntwort, vorschau, fuehreAus } from "../src/ki/aktionen";
import { systemText, zustandsText } from "../src/ki/kontext";
import { fragKi } from "../src/ki/gespraech";
import { KiFehler, rufeAuf, serverStatus, waehleWeg, type Holer } from "../src/ki/anbieter";
import { ANBIETER, anbieterDef, endpunkt, erkenneAnbieter, istPrivaterHost, schluesselWarnung } from "../src/ki/anbieterliste";
import { konfigAusRoh } from "../src/ki/einstellungen";
import { STANDARD_KONFIG, type KiAktion, type KiKonfig } from "../src/ki/typen";
import { NET } from "../src/sim/modell";
import { LAENDER } from "../src/sim/laender";

function welt(seed = 5) {
  const w = createWorld(turkey2026, seed);
  startAfterElection(w, schnellProfil());
  w.spiel!.ereignisse = [];
  w.spiel!.kapital = 60;
  return w;
}

const antwort = (status: number, body: unknown): Response => new Response(typeof body === "string" ? body : JSON.stringify(body), { status });
const anthropicOk = (text: string): Response => antwort(200, { content: [{ type: "text", text }], usage: { input_tokens: 2500, output_tokens: 120 }, model: "claude-sonnet-5-5" });
const mitSchluessel: KiKonfig = { ...STANDARD_KONFIG, art: "anthropic", schluessel: { anthropic: "sk-ant-test" } };

describe("Antwort lesen", () => {
  test("strenges JSON mit Aktionen", () => {
    const r = leseAntwort('{"antwort":"Der Mindestlohn ist niedrig.","aktionen":[{"art":"massnahme","id":"m_mindestlohn","richtung":1,"grund":"Reallöhne"}]}');
    expect(r.gelesen).toBe(true);
    expect(r.antwort).toContain("Mindestlohn");
    expect(r.aktionen).toHaveLength(1);
    expect(r.aktionen[0]).toMatchObject({ art: "massnahme", id: "m_mindestlohn", richtung: 1, weg: "gesetz" });
  });

  test("JSON in Markdown-Zäunen und mit Text davor", () => {
    const r = leseAntwort('Hier die Antwort:\n```json\n{"antwort":"ok","aktionen":[{"art":"zeit","tage":30}]}\n```');
    expect(r.gelesen).toBe(true);
    expect(r.aktionen).toEqual([{ art: "zeit", tage: 30 }]);
  });

  test("Freitext ohne JSON wird als Antwort ohne Aktionen behandelt", () => {
    const r = leseAntwort("Ich würde erst die Mehrheit sichern.");
    expect(r.gelesen).toBe(false);
    expect(r.antwort).toBe("Ich würde erst die Mehrheit sichern.");
    expect(r.aktionen).toEqual([]);
  });

  test("ungültige und erfundene Aktionen werden verworfen, höchstens drei bleiben", () => {
    const r = leseAntwort(
      JSON.stringify({
        antwort: "x",
        aktionen: [
          { art: "atombombe", ziel: "Athen" },
          { art: "massnahme", id: "m_mindestlohn" },
          { art: "zeit", tage: 9999 },
          { art: "land", land: "EU", handlung: "gipfel" },
          { art: "land", land: "USA", handlung: "handel" },
          { art: "land", land: "RUS", handlung: "gipfel" },
          { art: "land", land: "CHN", handlung: "gipfel" },
        ],
      }),
    );
    // atombombe und die Maßnahme ohne Stufe/Richtung fallen weg; die Zeit wird auf 90 Tage begrenzt; nach drei ist Schluss
    expect(r.aktionen).toHaveLength(3);
    expect(r.aktionen[0]).toEqual({ art: "zeit", tage: 90 });
  });
});

describe("Vorschau und Ausführung", () => {
  test("Maßnahme: Kosten und Mehrheit werden vorab genannt, Ausführung bringt das Gesetz ein", () => {
    const w = welt();
    const a = { art: "massnahme", id: "m_mindestlohn", stufe: 70, orte: null, weg: "gesetz" } as const;
    const v = vorschau(w, a);
    expect(v.problem).toBeUndefined();
    expect(v.kosten).toBeGreaterThan(0);
    expect(v.titel).toContain("Mindestlohn");
    const vorher = w.spiel!.gesetze.length;
    const r = fuehreAus(w, a);
    expect(r.ok, r.text).toBe(true);
    expect(w.spiel!.gesetze.length).toBe(vorher + 1);
  });

  test("Erfundene Maßnahme, unbekannter Ort, falsches Land: Problem statt Ausführung, Zustand unverändert", () => {
    const w = welt();
    const kapital = w.spiel!.kapital;
    const schlechte: KiAktion[] = [
      { art: "massnahme", id: "m_erfunden", stufe: 50, orte: null, weg: "gesetz" },
      { art: "massnahme", id: "m_mindestlohn", stufe: 50, orte: ["Atlantis"], weg: "gesetz" },
      { art: "land", land: "MARS", handlung: "gipfel" },
      { art: "land", land: "EU", handlung: "invasion" },
      { art: "fraktion", partei: "XYZ", handlung: "gespraech" },
      { art: "ereignis", id: "gibt-es-nicht", option: "x" },
    ];
    for (const a of schlechte) {
      const v = vorschau(w, a);
      expect(v.problem, JSON.stringify(a)).toBeTruthy();
      const r = fuehreAus(w, a);
      expect(r.ok).toBe(false);
    }
    expect(w.spiel!.kapital).toBe(kapital);
    expect(w.spiel!.gesetze).toHaveLength(0);
  });

  test("Zu wenig Kapital: keine Ausführung", () => {
    const w = welt();
    w.spiel!.kapital = -20; // die Überziehung ist ausgeschöpft
    const a = { art: "land", land: "EU", handlung: "gipfel" } as const;
    expect(vorschau(w, a).problem).toBeTruthy();
    expect(fuehreAus(w, a).ok).toBe(false);
    expect(w.spiel!.kapital).toBe(-20);
  });

  test("Land und Fraktion laufen über dieselben Funktionen wie die Bedienung von Hand", () => {
    const w = welt();
    const l = fuehreAus(w, { art: "land", land: "EU", handlung: "gipfel" });
    expect(l.ok, l.text).toBe(true);
    const partei = Object.keys(w.parliament!.seats).find((p) => p !== w.player!.partei.kurz && !(w.spiel!.lager ?? []).includes(p))!;
    const f = fuehreAus(w, { art: "fraktion", partei, handlung: "gespraech" });
    expect(f.ok, f.text).toBe(true);
  });

  test("Zeit läuft und meldet das Datum", () => {
    const w = welt();
    const tag = w.day;
    const r = fuehreAus(w, { art: "zeit", tage: 5 });
    expect(r.ok).toBe(true);
    expect(w.day).toBeGreaterThan(tag);
  });
});

describe("Kontext für das Modell", () => {
  test("Der feste Teil kennt alle Maßnahmen und Länder und das Ausgabeformat", () => {
    const s = systemText();
    for (const n of NET.nodes.filter((x) => x.kind === "massnahme")) expect(s).toContain(`${n.id}: ${n.name}`);
    for (const l of LAENDER) expect(s).toContain(`${l.id}: ${l.name}`);
    expect(s).toContain('"aktionen"');
    expect(s).toContain("Politisches Kapital");
  });

  test("Der Zustand nennt die Lage aus dem Kern und bleibt klein", () => {
    const w = welt();
    const z = zustandsText(w);
    expect(z).toContain("Zustimmung");
    expect(z).toContain("Kapital 60");
    expect(z).toContain("Parlament: Lager");
    expect(z).toContain("Wählergruppen");
    expect(z).toContain("m_mindestlohn=");
    expect(z).not.toMatch(/undefined|NaN|\[object/);
    expect(z.length).toBeLessThan(9000);
    // deterministisch
    expect(zustandsText(w)).toBe(z);
  });
});

describe("Runde mit Ersatz-Anbieter", () => {
  test("Frage und Zustand gehen an den Anbieter, Vorschläge kommen geprüft zurück", async () => {
    const w = welt();
    const gesehen: { url: string; body: any }[] = [];
    const holen: Holer = async (url, init) => {
      gesehen.push({ url, body: init.body ? JSON.parse(String(init.body)) : null });
      return anthropicOk('{"antwort":"Ein Gipfel mit der EU hilft.","aktionen":[{"art":"land","land":"EU","handlung":"gipfel","grund":"Vertrauen aufbauen"}]}');
    };
    const runde = await fragKi(w, [], "Wie verbessere ich das Verhältnis zur EU?", mitSchluessel, holen);
    expect(runde.ergebnis.antwort).toContain("Gipfel");
    expect(runde.vorschauen).toHaveLength(1);
    expect(runde.vorschauen[0]!.problem).toBeUndefined();
    expect(runde.verbrauch).toMatchObject({ ein: 2500, aus: 120 });
    const call = gesehen[0]!;
    expect(call.url).toBe("https://api.anthropic.com/v1/messages");
    expect(call.body.model).toBe("claude-sonnet-5-5");
    expect(call.body.system[0].cache_control).toEqual({ type: "ephemeral" });
    expect(call.body.messages[0].role).toBe("user");
    expect(call.body.messages.at(-1).content).toContain("ZUSTAND");
    expect(call.body.messages.at(-1).content).toContain("Wie verbessere ich das Verhältnis zur EU?");
  });

  test("Der Verlauf beginnt immer mit einer Nutzernachricht und wechselt die Rollen", async () => {
    const w = welt();
    let body: any;
    const holen: Holer = async (_u, init) => {
      body = JSON.parse(String(init.body));
      return anthropicOk('{"antwort":"ok","aktionen":[]}');
    };
    await fragKi(w, [{ rolle: "assistant", text: "verwaist" }, { rolle: "user", text: "a" }, { rolle: "assistant", text: "b" }], "c", mitSchluessel, holen);
    const rollen = body.messages.map((m: { role: string }) => m.role);
    expect(rollen).toEqual(["user", "assistant", "user"]);
  });

  test("Aufruf ohne Einrichtung wird gemeldet, nicht versucht", async () => {
    await expect(rufeAuf({ ...STANDARD_KONFIG, art: "anthropic" }, { system: "s", nachrichten: [{ rolle: "user", text: "x" }], maxTokens: 10 }, async () => antwort(200, {}))).rejects.toMatchObject({ art: "konfig" });
  });

  test("Fehlerarten: abgelehnter Schlüssel, Limit, Serverfehler, kein Netz", async () => {
    const a = { system: "s", nachrichten: [{ rolle: "user" as const, text: "x" }], maxTokens: 10 };
    await expect(rufeAuf(mitSchluessel, a, async () => antwort(401, { error: { message: "invalid x-api-key" } }))).rejects.toMatchObject({ art: "schluessel" });
    await expect(rufeAuf(mitSchluessel, a, async () => antwort(429, { error: { message: "rate" } }))).rejects.toMatchObject({ art: "limit" });
    await expect(rufeAuf(mitSchluessel, a, async () => antwort(503, "down"))).rejects.toMatchObject({ art: "server" });
    await expect(
      rufeAuf(mitSchluessel, a, async () => {
        throw new TypeError("Failed to fetch");
      }),
    ).rejects.toBeInstanceOf(KiFehler);
  });

  test("Weg: Entwicklungsserver hat Vorrang, dann eigener Schlüssel, sonst keiner", async () => {
    const serverJa: Holer = async () => antwort(200, { konfiguriert: true, anbieter: ["anthropic"], relay: true });
    const serverNein: Holer = async () => antwort(200, { konfiguriert: false, anbieter: [], relay: false });
    await serverStatus(serverJa, true);
    const w1 = await waehleWeg({ ...STANDARD_KONFIG, art: "auto" }, serverJa);
    expect(w1).toMatchObject({ modus: "server", anbieter: { id: "anthropic" } });
    // Der Status wird gemerkt; für die weiteren Fälle wird er ausdrücklich neu geprüft
    await serverStatus(serverNein, true);
    expect((await waehleWeg({ ...STANDARD_KONFIG, art: "auto", schluessel: { anthropic: "sk-ant-k" } }, serverNein))?.modus).toBe("direkt");
    expect(await waehleWeg({ ...STANDARD_KONFIG, art: "auto" }, serverNein)).toBeNull();
    expect(await waehleWeg({ ...STANDARD_KONFIG, art: "aus", schluessel: { anthropic: "sk-ant-k" } }, serverNein)).toBeNull();
    expect((await waehleWeg({ ...STANDARD_KONFIG, art: "lokal" }, serverNein))?.anbieter.id).toBe("lokal");
    // Ein Schlüssel, der offensichtlich zu einem anderen Anbieter gehört, wird von „Automatisch“ nicht benutzt
    expect(await waehleWeg({ ...STANDARD_KONFIG, art: "auto", schluessel: { anthropic: "kein-claude-schluessel" } }, serverNein)).toBeNull();
  });

  test("Lokaler Server: OpenAI-Format", async () => {
    let url = "";
    let body: any;
    const holen: Holer = async (u, init) => {
      url = u;
      body = JSON.parse(String(init.body));
      return antwort(200, { choices: [{ message: { content: '{"antwort":"lokal","aktionen":[]}' } }], usage: { prompt_tokens: 10, completion_tokens: 5 }, model: "bonsai" });
    };
    const r = await rufeAuf({ ...STANDARD_KONFIG, art: "lokal" }, { system: "S", nachrichten: [{ rolle: "user", text: "Hallo" }], maxTokens: 50 }, holen);
    expect(url).toBe("http://127.0.0.1:18127/v1/chat/completions");
    expect(body.messages[0]).toEqual({ role: "system", content: "S" });
    expect(r.text).toContain("lokal");
    expect(r.tokensEin).toBe(10);
  });
});

describe("Mehrere Anbieter", () => {
  const a = { system: "S", nachrichten: [{ rolle: "user" as const, text: "Hallo" }], maxTokens: 50 };

  test("Xiaomi MiMo: OpenAI-Format mit max_completion_tokens und abgeschaltetem Denken, über den Entwicklungsserver", async () => {
    const serverNein: Holer = async () => antwort(200, { anbieter: [], relay: true });
    await serverStatus(serverNein, true);
    let url = "";
    let kopf: Record<string, string> = {};
    let body: any;
    const holen: Holer = async (u, init) => {
      url = u;
      kopf = init.headers as Record<string, string>;
      body = JSON.parse(String(init.body));
      return antwort(200, { choices: [{ message: { content: '{"antwort":"mimo","aktionen":[]}' } }], usage: { prompt_tokens: 12, completion_tokens: 4 }, model: "mimo-v2.6-flash" });
    };
    const r = await rufeAuf({ ...STANDARD_KONFIG, art: "mimo", schluessel: { mimo: "sk-mimo-test" } }, a, holen);
    expect(url).toBe("/api/ki/relay");
    expect(kopf["x-ki-anbieter"]).toBe("mimo");
    expect(kopf["x-ki-schluessel"]).toBe("sk-mimo-test");
    expect(body.model).toBe("mimo-v2.6-flash");
    expect(body.max_completion_tokens).toBe(50);
    expect(body.max_tokens).toBeUndefined();
    expect(body.thinking).toEqual({ type: "disabled" });
    expect(body.messages[0]).toEqual({ role: "system", content: "S" });
    expect(r).toMatchObject({ text: '{"antwort":"mimo","aktionen":[]}', tokensEin: 12, tokensAus: 4 });
  });

  test("Ohne Entwicklungsserver ruft der Browser den Anbieter direkt mit Bearer-Schlüssel auf", async () => {
    await serverStatus(async () => antwort(404, {}), true);
    let url = "";
    let kopf: Record<string, string> = {};
    const holen: Holer = async (u, init) => {
      url = u;
      kopf = init.headers as Record<string, string>;
      return antwort(200, { choices: [{ message: { content: [{ type: "text", text: "teil1" }, { type: "text", text: "teil2" }] } }] });
    };
    const r = await rufeAuf({ ...STANDARD_KONFIG, art: "deepseek", schluessel: { deepseek: "k" } }, a, holen);
    expect(url).toBe("https://api.deepseek.com/chat/completions");
    expect(kopf.authorization).toBe("Bearer k");
    expect(r.text).toBe("teil1teil2");
  });

  test("Anbieter ohne voreingestelltes Modell brauchen einen Modellnamen und melden das", async () => {
    await serverStatus(async () => antwort(200, { anbieter: [], relay: true }), true);
    await expect(rufeAuf({ ...STANDARD_KONFIG, art: "openai", schluessel: { openai: "sk-x" } }, a, async () => antwort(200, {}))).rejects.toMatchObject({ art: "konfig", message: expect.stringContaining("Modellname") });
    const eigen = { ...STANDARD_KONFIG, art: "eigen", schluessel: { eigen: "k" }, modell: { eigen: "m" }, eigenUrl: "" };
    await expect(rufeAuf(eigen, a, async () => antwort(200, {}))).rejects.toMatchObject({ message: expect.stringContaining("Adresse") });
  });

  test("Ein abgelehnter Schlüssel nennt den Anbieter und erkennt einen fremden Schlüssel", async () => {
    await serverStatus(async () => antwort(404, {}), true);
    const falsch = { ...STANDARD_KONFIG, art: "anthropic", schluessel: { anthropic: "sk-or-v1-abc" } };
    await expect(rufeAuf(falsch, a, async () => antwort(401, { error: { message: "invalid x-api-key" } }))).rejects.toMatchObject({
      art: "schluessel",
      message: expect.stringMatching(/OpenRouter/),
    });
  });

  test("Schlüsselerkennung und Warnungen", () => {
    expect(erkenneAnbieter("sk-ant-api03-x")).toBe("anthropic");
    expect(erkenneAnbieter("AIzaSyX")).toBe("gemini");
    expect(erkenneAnbieter("sk-abc")).toBeUndefined();
    expect(schluesselWarnung("anthropic", "sk-ant-x")).toBeNull();
    expect(schluesselWarnung("anthropic", "sk-abc")).toMatch(/sk-ant-/);
    expect(schluesselWarnung("mimo", "sk-abc")).toBeNull();
    expect(schluesselWarnung("mimo", "sk-ant-abc")).toMatch(/Claude/);
    expect(schluesselWarnung("mimo", "ab cd")).toMatch(/Leerzeichen/);
  });

  test("Jeder Anbieter hat gültige Angaben; Endpunkte und Sperre privater Ziele", () => {
    const ids = new Set<string>();
    for (const x of ANBIETER) {
      expect(ids.has(x.id)).toBe(false);
      ids.add(x.id);
      if (!x.eigeneUrl) expect(x.basis).toMatch(/^https?:\/\//);
      if (x.standardModell && x.modelle.length) expect(x.modelle.some((m) => m.id === x.standardModell)).toBe(true);
    }
    expect(endpunkt(anbieterDef("mimo")!)).toBe("https://api.xiaomimimo.com/v1/chat/completions");
    expect(endpunkt(anbieterDef("anthropic")!)).toBe("https://api.anthropic.com/v1/messages");
    expect(endpunkt(anbieterDef("eigen")!, "https://example.org/v1/")).toBe("https://example.org/v1/chat/completions");
    for (const h of ["localhost", "127.0.0.1", "10.1.2.3", "192.168.0.5", "172.20.1.1", "169.254.169.254", "[::1]", "dienst.local"]) expect(istPrivaterHost(h)).toBe(true);
    for (const h of ["api.xiaomimimo.com", "8.8.8.8", "172.32.0.1"]) expect(istPrivaterHost(h)).toBe(false);
  });

  test("Alte Einstellungen (ein Claude-Schlüssel, ein lokales Modell) werden übernommen", () => {
    const k = konfigAusRoh({ art: "proxy", modell: "claude-haiku-4-5-20251001", schluessel: "sk-ant-alt", lokalUrl: "http://127.0.0.1:1234/v1", lokalModell: "qwen", maxAufrufe: 30 });
    expect(k.art).toBe("auto");
    expect(k.schluessel.anthropic).toBe("sk-ant-alt");
    expect(k.modell).toMatchObject({ anthropic: "claude-haiku-4-5-20251001", lokal: "qwen" });
    expect(k.lokalUrl).toBe("http://127.0.0.1:1234/v1");
    expect(k.maxAufrufe).toBe(30);
    expect(konfigAusRoh(null)).toEqual(STANDARD_KONFIG);
    expect(konfigAusRoh({ art: "mimo", schluessel: { mimo: "x" }, modell: { mimo: "mimo-v2.6-pro" } })).toMatchObject({ art: "mimo", schluessel: { mimo: "x" }, modell: { mimo: "mimo-v2.6-pro" } });
  });
});

describe("Reich und Verträge im Gespräch", () => {
  test("Der Zustand nennt Reich und Verträge, der feste Text die Kataloge", () => {
    const w = welt();
    const z = zustandsText(w);
    expect(z).toMatch(/Reich: Verwaltungskraft \d+/);
    expect(z).toMatch(/Verträge: keine/);
    const s = systemText();
    expect(s).toContain("VORHABEN DES REICHES");
    expect(s).toContain("KLAUSELN JE LAND");
    expect(s).toMatch(/SYR: bieten bauauftraege/);
    expect(s).toContain('"art":"abkommen"');
  });

  test("Ein Vertragsvorschlag wird gelesen, geprüft und über den Verhandlungstisch ausgeführt", () => {
    const w = welt();
    const r = leseAntwort('{"antwort":"Ein Wiederaufbaupaket.","aktionen":[{"art":"abkommen","land":"SYR","bieten":["bauauftraege","energie_lieferung"],"verlangen":["w_rueckkehr"],"jahre":5,"grund":"Rückkehr fördern"}]}');
    expect(r.aktionen[0]).toMatchObject({ art: "abkommen", land: "SYR", bieten: ["bauauftraege", "energie_lieferung"], verlangen: ["w_rueckkehr"], jahre: 5 });
    const v = vorschau(w, r.aktionen[0]!);
    expect(v.problem).toBeUndefined();
    expect(v.kosten).toBeGreaterThan(0);
    expect(v.hinweis).toMatch(/zustimmen/);
    const kapital = w.spiel!.kapital;
    const e = fuehreAus(w, r.aktionen[0]!);
    expect(e.ok, e.text).toBe(true);
    expect(w.spiel!.kapital).toBeLessThan(kapital);
    expect(zustandsText(w)).toMatch(/Verträge: SYR bietet/);
  });

  test("Erfundene Klauseln, Rote Linien und fehlendes Kapital sind Probleme, keine Ausführung", () => {
    const w = welt();
    const erfunden: KiAktion = { art: "abkommen", land: "SYR", bieten: ["atomwaffen"], verlangen: [] };
    expect(vorschau(w, erfunden).problem).toMatch(/gibt es nicht/);
    const rot: KiAktion = { art: "abkommen", land: "GRC", bieten: ["v_casus"], verlangen: ["w_inseln"] };
    expect(vorschau(w, rot).problem).toMatch(/Athen/);
    expect(fuehreAus(w, rot).ok).toBe(false);
    w.spiel!.kapital = -19;
    const teuer: KiAktion = { art: "abkommen", land: "SYR", bieten: ["bauauftraege", "energie_lieferung"], verlangen: ["w_rueckkehr"] };
    expect(vorschau(w, teuer).problem).toMatch(/Kapital/);
    expect(vorschau(w, { art: "abkommen", land: "MARS", bieten: [], verlangen: [] }).problem).toMatch(/kein Land/);
  });

  test("Vorhaben des Reiches und Vermittlung: Vorschau prüft, Ausführung geht über den Kern", () => {
    const w = welt();
    expect(vorschau(w, { art: "vorhaben", id: "gibt_es_nicht" }).problem).toMatch(/kein Vorhaben/);
    const beginnbar = leseAntwort('{"antwort":"x","aktionen":[{"art":"vorhaben","id":"erbe_restaurierung_ephesos"}]}').aktionen[0]!;
    // egal ob dieses Vorhaben existiert: die Vorschau meldet entweder ein Problem oder Kosten, ohne etwas auszuführen
    const v = vorschau(w, beginnbar);
    expect(v.problem !== undefined || v.kosten !== undefined).toBe(true);
    expect(vorschau(w, { art: "vermittlung", id: "unbekannt" }).problem).toMatch(/gibt es nicht/);
    const vm = vorschau(w, { art: "vermittlung", id: "ukr_rus" });
    expect(vm.titel).toMatch(/Ukraine/);
    expect(vm.hinweis).toMatch(/Aussicht/);
  });
});
