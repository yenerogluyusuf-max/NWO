// Welle 3, K6 (krieg.md Schritt 10, karte.md K8): das Kriegsziel aus einzelnen Regionen, gesetzt durch Anklicken auf der Karte.
//
// Bisher gab es je Land zwei bis drei feste Zielräume (data/streitkraefte.ts ZIELRAEUME, Regionen in data/schauplaetze.ts
// ZIELRAUM_REGIONEN). Jetzt darf der Präsident die Regionen selbst wählen. Regeln (Spielparameter, abgeleitet aus dem Vorrücken der Front,
// die die Regionen nach ihrer Tiefe nimmt, sim/kriegsschauplatz.ts `regionenSetzen`):
//   - Eine Region der Tiefe n > 1 ist nur wählbar, wenn eine Region der Tiefe n − 1 desselben Schauplatzes gewählt oder schon gehalten ist.
//     So bleibt der Zielraum ein Vorstoß von der Grenze aus. Alle festen Zielräume erfüllen diese Regel.
//   - Gegenwehr und Bedeutung (`zielraumVon` in sim/krieg.ts) kommen vom kleinsten festen Zielraum, der die Auswahl ganz enthält. Eine
//     kleinere Auswahl ist also nie billiger als der Zielraum, aus dem sie stammt (zurückhaltende Lösung, „Zur Bestätigung“ im Bericht K6).
//   - Entspricht die Auswahl genau einem festen Zielraum, gilt dieser, ohne eigene Liste.
//   - Ein Wechsel im laufenden Krieg kostet wie der Wechsel des festen Zielraums (`ZIELRAUM_WECHSEL`).
// Ältere Spielstände haben das Feld `zielRegionen` nicht; dann gilt wie bisher der feste Zielraum.

import type { World } from "./types";
import type { KriegVorgang } from "./krieg-typen";
import { REGION_NACH_ID, ZIELRAUM_REGIONEN, type Region } from "../data/schauplaetze";
import { ZIELRAEUME } from "../data/streitkraefte";
import { ZIELRAUM_WECHSEL, kriegZu, type Ergebnis } from "./krieg";
import { besatzung, regionenVon, schauplatzFuer, zielGeaendert, zielRegionen } from "./kriegsschauplatz";
import { istFernkonflikt } from "./fernkonflikt";
import { kannZahlen } from "./kapital";
import { wirke } from "./wirkung";
import { addLog } from "./log";
import { liste, t } from "../i18n";

/** Regionen, die die Türkei in diesem Schauplatz schon hält: im Krieg genommen oder als Besatzung aus einem früheren Krieg. */
export function gehalteneRegionen(w: World, k: KriegVorgang): Set<string> {
  const out = new Set<string>();
  for (const [id, lage] of Object.entries(k.regionen ?? {})) if (lage === "eigen") out.add(id);
  for (const b of besatzung(w)) if (b.land === k.land) out.add(b.region);
  return out;
}

/**
 * Die erste Region der Auswahl, die die Tiefenregel verletzt (Tiefe n > 1 ohne gewählte oder gehaltene Region der Tiefe n − 1),
 * oder `undefined`, wenn die Auswahl zusammenhängt.
 */
export function zielLuecke(landId: string, ids: readonly string[], gehalten: ReadonlySet<string> = new Set()): string | undefined {
  const tiefen = new Set<number>();
  for (const r of regionenVon(landId)) if (ids.includes(r.id) || gehalten.has(r.id)) tiefen.add(r.tiefe);
  for (const id of ids) {
    const r = REGION_NACH_ID[id];
    if (r && r.tiefe > 1 && !tiefen.has(r.tiefe - 1)) return id;
  }
  return undefined;
}

/** Ob eine Region zur Auswahl hinzukommen darf (Tiefenregel). */
export function regionWaehlbar(landId: string, id: string, ids: readonly string[], gehalten: ReadonlySet<string> = new Set()): boolean {
  const r = REGION_NACH_ID[id];
  if (!r || !regionenVon(landId).includes(r)) return false;
  if (r.tiefe <= 1) return true;
  return regionenVon(landId).some((x) => x.tiefe === r.tiefe - 1 && (ids.includes(x.id) || gehalten.has(x.id)));
}

/** Streicht Regionen, die nach dem Abwählen einer anderen nicht mehr zusammenhängen (wiederholt, bis die Auswahl stimmt). */
export function zielBereinigen(landId: string, ids: readonly string[], gehalten: ReadonlySet<string> = new Set()): string[] {
  let aus = [...ids];
  for (let i = 0; i < 4; i++) {
    const weg = zielLuecke(landId, aus, gehalten);
    if (!weg) break;
    // Alle Regionen derselben Tiefe ohne Halt fallen zugleich weg
    const tiefe = REGION_NACH_ID[weg]!.tiefe;
    aus = aus.filter((id) => (REGION_NACH_ID[id]?.tiefe ?? 0) < tiefe);
  }
  return aus;
}

/** Der feste Zielraum, der genau diese Regionen umfasst, sonst der kleinste, der sie alle enthält. */
export function zielraumFuerRegionen(landId: string, ids: readonly string[]): { id: string; genau: boolean } | undefined {
  const menge = new Set(ids);
  const passend = ZIELRAEUME.filter((z) => z.land === landId)
    .map((z) => ({ id: z.id, regionen: ZIELRAUM_REGIONEN[z.id] ?? [] }))
    .filter((z) => ids.every((id) => z.regionen.includes(id)))
    .sort((a, b) => a.regionen.length - b.regionen.length);
  const z = passend[0];
  if (!z) return undefined;
  return { id: z.id, genau: z.regionen.length === menge.size };
}

/** Die Regionen in der Reihenfolge des Schauplatzes (Tiefe, dann Datensatz), ohne Doppelte. */
function ordne(landId: string, ids: readonly string[]): string[] {
  return regionenVon(landId).filter((r) => ids.includes(r.id)).sort((a, b) => a.tiefe - b.tiefe).map((r) => r.id);
}

/** Ob die Auswahl vom geltenden Ziel abweicht. */
export function zielAendertSich(k: KriegVorgang, ids: readonly string[]): boolean {
  const jetzt = zielRegionen(k).map((r) => r.id).sort();
  const neu = ordne(k.land, ids).sort();
  return jetzt.length !== neu.length || jetzt.some((id, i) => id !== neu[i]);
}

/** Ob das Ziel jetzt per Regionen gesetzt werden darf, und warum nicht. */
export function zielwahlOffen(w: World, k: KriegVorgang): { ok: boolean; grund?: string } {
  if (!schauplatzFuer(k.land) || istFernkonflikt(k.land)) return { ok: false, grund: t("militaer.ziel.ungueltig") };
  if (k.phase === "frieden" || k.phase === "beendet" || k.phase === "waffenruhe") return { ok: false, grund: t("militaer.ziel.vorbei") };
  if (!w.spiel) return { ok: false, grund: t("militaer.ziel.ungueltig") };
  return { ok: true };
}

/** Preis des Setzens: im laufenden Krieg der Wechselpreis, sonst nichts (dieselben Zahlen, die `waehleZielRegionen` bucht). */
export function zielwahlPreis(k: KriegVorgang, ids: readonly string[]): { pk: number; moral: number } {
  const wechsel = k.phase === "krieg" && (!!k.zielraum || !!k.zielRegionen) && zielAendertSich(k, ids);
  return wechsel ? { pk: ZIELRAUM_WECHSEL.pk, moral: ZIELRAUM_WECHSEL.moral } : { pk: 0, moral: 0 };
}

/** Das Kriegsziel aus Regionen setzen (aus der Ortswahl der Karte). */
export function waehleZielRegionen(w: World, kriegId: string, ids: readonly string[]): Ergebnis {
  const k = kriegZu(w, kriegId);
  if (!k) return { ok: false, text: t("militaer.ziel.ungueltig") };
  const offen = zielwahlOffen(w, k);
  if (!offen.ok) return { ok: false, text: offen.grund ?? t("militaer.ziel.ungueltig") };
  const eigene = regionenVon(k.land).map((r) => r.id);
  if (!ids.length || ids.some((id) => !eigene.includes(id))) return { ok: false, text: t("welle_k6.ziel.leer") };
  const gehalten = gehalteneRegionen(w, k);
  const luecke = zielLuecke(k.land, ids, gehalten);
  if (luecke) return { ok: false, text: t("welle_k6.ziel.luecke", { region: t(`krieg.region.${luecke}`) }) };
  const raum = zielraumFuerRegionen(k.land, ids);
  if (!raum) return { ok: false, text: t("militaer.ziel.ungueltig") };
  if (!zielAendertSich(k, ids) && (k.zielraum || k.zielRegionen)) return { ok: false, text: t("welle_k6.ziel.unveraendert") };
  const preis = zielwahlPreis(k, ids);
  if (preis.pk > 0) {
    if (!kannZahlen(w.spiel!.kapital, preis.pk)) return { ok: false, text: t("militaer.grund.kapital") };
    w.spiel!.kapital -= preis.pk;
    wirke(w, "truppenmoral", preis.moral);
  }
  k.zielraum = raum.id;
  if (raum.genau) delete k.zielRegionen;
  else k.zielRegionen = ordne(k.land, ids);
  zielGeaendert(w, k);
  const namen = liste(zielRegionen(k).map((r: Region) => t(`krieg.region.${r.id}`)));
  const text = t(preis.pk > 0 ? "welle_k6.ziel.gewechselt" : "welle_k6.ziel.gesetzt", { regionen: namen });
  addLog(w, "entscheidung", text);
  return { ok: true, text };
}
