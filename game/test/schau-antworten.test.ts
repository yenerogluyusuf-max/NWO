// Wächter gegen Schau (Rückmeldung des Projektinhabers 05.11.2026: „Hinter jeder Entscheidung muss etwas stecken“). Jede Antwort jedes
// Ereignisses läuft auf einer Kopie der Welt und wird mit dem Zustand davor verglichen; Protokoll, Chronik, Hinweise und Kapital zählen nicht.
// Erlaubt ist nur ehrliches Nichtstun (Abwarten, wie geplant), und jedes Ereignis braucht mindestens eine Antwort mit Wirkung oder Folgeereignis.
// Mit SCHAU_AUS=<datei> schreibt der Test den vollen Bericht.
import { expect, test } from "vitest";
import { writeFileSync } from "node:fs";
import { createWorld, load, save } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { startAfterElection, schnellProfil } from "../src/sim/prolog";
import { VORLAGEN, antworten, oeffne } from "../src/sim/ereignisse";
import { Rng } from "../src/sim/rng";
import type { World } from "../src/sim/types";

const AUSGENOMMEN = new Set(["log", "chronik", "hinweise", "zuletzt", "ereignisse", "kapital", "rngState", "folgenLog", "zeitung", "rueckblicke", "berichte", "treiber", "erinnerung", "gesehen", "presse"]);

function flach(x: unknown, pfad: string, out: Map<string, unknown>): void {
  if (x === null || typeof x !== "object") { out.set(pfad, x); return; }
  if (ArrayBuffer.isView(x)) { Array.from(x as unknown as ArrayLike<number>).forEach((v, i) => out.set(`${pfad}[${i}]`, v)); return; }
  for (const [k, v] of Object.entries(x as Record<string, unknown>)) {
    if (AUSGENOMMEN.has(k)) continue;
    flach(v, pfad ? `${pfad}.${k}` : k, out);
  }
}

function diff(a: World, b: World): string[] {
  const A = new Map<string, unknown>(), B = new Map<string, unknown>();
  flach(JSON.parse(save(a)), "", A);
  flach(JSON.parse(save(b)), "", B);
  const out: string[] = [];
  for (const k of new Set([...A.keys(), ...B.keys()])) {
    const x = A.get(k), y = B.get(k);
    if (typeof x === "number" && typeof y === "number" ? Math.abs(x - y) > 1e-6 : x !== y) out.push(k);
  }
  return out;
}

const kurz = (pfade: string[]) => [...new Set(pfade.map((p) => p.replace(/\[\d+\]/g, "[]").replace(/\.\d+(\.|$)/g, ".#$1")))].slice(0, 6);

test("Jede Antwort wirkt, außer ehrlichem Nichtstun (keine Schau)", () => {
  const basis = createWorld(turkey2026, 3);
  startAfterElection(basis, schnellProfil());
  basis.spiel!.ereignisse = [];
  const bericht: unknown[] = [];
  for (const v of VORLAGEN) {
    const w = load(save(basis));
    const ev = oeffne(w, v.id, new Rng(7));
    if (!ev) { bericht.push({ id: v.id, status: "nicht erzeugbar" }); continue; }
    const vorher = load(save(w));
    const std = load(save(w));
    const evS = std.spiel!.ereignisse.find((e) => e.id === ev.id)!;
    try { v.standard(std, evS, new Rng(1)); } catch { /* ohne Standard */ }
    const stdDiff = diff(vorher, std);
    const optionen = antworten(w, ev).map((o) => {
      const k = load(save(w));
      const evK = k.spiel!.ereignisse.find((e) => e.id === ev.id)!;
      const oK = antworten(k, evK).find((x) => x.id === o.id)!;
      let fehler: string | undefined;
      try { oK.wirkung(k, evK, new Rng(1)); } catch (e) { fehler = String(e); }
      const d = diff(vorher, k);
      const gleichStandard = diff(std, k).length === 0;
      const folge = !!v.folgen?.[o.id];
      return { id: o.id, label: o.label, pk: o.pk, aenderungen: d.length, beispiele: kurz(d), gleichStandard, folge, ...(o.sperre ? { sperre: true } : {}), ...(fehler ? { fehler } : {}) };
    });
    bericht.push({ id: v.id, titel: v.titel(w, ev), standardAenderungen: stdDiff.length, optionen });
  }
  if (process.env.SCHAU_AUS) writeFileSync(process.env.SCHAU_AUS, JSON.stringify(bericht, null, 1));
  const verstoesse: string[] = [];
  for (const v of bericht as { id: string; status?: string; optionen?: { id: string; aenderungen: number; folge: boolean }[] }[]) {
    if (v.status || LAGE_NOETIG.has(v.id) || ALT.has(v.id)) continue;
    const ohne = v.optionen!.filter((o) => o.aenderungen === 0 && !o.folge);
    if (ohne.length === v.optionen!.length) verstoesse.push(`${v.id}: keine Antwort mit Wirkung`);
    for (const o of ohne) if (!NICHTSTUN.has(o.id) && !NICHTSTUN.has(`${v.id}:${o.id}`)) verstoesse.push(`${v.id}:${o.id} ohne Wirkung`);
  }
  expect(verstoesse).toEqual([]);
}, 600_000);

/** Ehrliches Nichtstun: heißt so und verspricht nichts. „entwurf“ verhindert die automatische Fortschreibung des Haushalts (selbst vorbereiten). */
const NICHTSTUN = new Set(["aussitzen", "abwarten", "spaeter", "ordentlich", "haushaltsjahr:entwurf"]);
/** Ereignisse, deren Antworten auf eine laufende Lage wirken (Krieg, Stichwahl, Nachfolge): in einer frischen Partie ohne Gegenstand. */
const LAGE_NOETIG = new Set(["krieg_drohkulisse", "krieg_waffenruhe", "wahl_stichwahl", "nachfolge_kuer"]);
/** Nur noch für ältere Spielstände, in denen das Ereignis offen sein kann (neue Partien öffnen es nicht mehr). */
const ALT = new Set(["start_haushalt"]);
