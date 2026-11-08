// Hilfen der Tests von Welle 3, K3: ein Krieg über die Leiter bis zum Einsatz, mit Operationsform.
import { expect } from "vitest";
import { advance, createWorld, load } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { startAfterElection, schnellProfil } from "../src/sim/prolog";
import { KRIEG, PAKETE, fuehreKriegHandlungAus, handlungenFuer, kriegMit, kriegszielErreicht, kriseEroeffnen, paketAnnahme, waehleZielraum, type KriegHandlungId } from "../src/sim/krieg";
import { antworten, entscheide } from "../src/sim/ereignisse";
import { WENDEPUNKT_IDS } from "../src/sim/ereignisse-wendepunkte";
import { waehleOperation } from "../src/sim/operationen";
import { Rng } from "../src/sim/rng";
import type { OperationsFormId, VerbuendeteId } from "../src/data/operationen";
import type { KriegVorgang } from "../src/sim/krieg-typen";
import type { World } from "../src/sim/types";

/** Monate zwischen zwei Daten im Format JJJJ-MM-TT (Tage / 30,44). */
export function monthsBetween(a: string, b: string): number {
  return (Date.parse(b) - Date.parse(a)) / 86_400_000 / 30.44;
}

/** Frische Partie mit eigener Mehrheit (wie test/krieg-leiter.test.ts). */
export function frisch(seed = 6): World {
  const w = createWorld(turkey2026, seed);
  startAfterElection(w, schnellProfil());
  w.spiel!.ereignisse = [];
  w.parliament!.seats = { [w.player!.partei.kurz]: 400 };
  return w;
}

export interface Plan { land: string; zielraum: string; form: OperationsFormId; mit?: VerbuendeteId; mobil?: boolean }

/**
 * Über die Leiter bis zum Einsatz: Krise, Drohkulisse, Kriegsziel „Schutz“ mit Zielraum, wahlweise Teilmobilmachung, Operationsform, Ultimatum
 * (ein Wurf, bei dem der Gegner ablehnt) und Einsatz. Gibt die echten Entscheidungen und die Pflichtschritte mit.
 */
export function bisKrieg(w: World, o: Plan): { k: KriegVorgang; echte: string[]; pflicht: string[]; start: string } {
  const echte: string[] = [], pflicht: string[] = [];
  w.spiel!.kapital = Math.max(w.spiel!.kapital, 150);
  const start = w.date;
  expect(kriseEroeffnen(w, o.land).ok).toBe(true);
  echte.push("krise");
  const k = kriegMit(w, o.land)!;
  advance(w, KRIEG.spannungMinTage);
  w.spiel!.ereignisse = w.spiel!.ereignisse.filter((e) => !e.vorlage.startsWith("krieg"));
  if (k.phase === "spannung") { expect(fuehreKriegHandlungAus(w, k.id, "drohkulisse").ok).toBe(true); pflicht.push("drohkulisse"); }
  expect(fuehreKriegHandlungAus(w, k.id, "ziel_schutz").ok).toBe(true);
  waehleZielraum(w, k.id, o.zielraum);
  echte.push("kriegsziel");
  // Läuft noch eine Demobilisierung (Stand 2043 des Inhabers: bis 1. September), wartet der Bot, bis die Mobilmachung wieder geht
  for (let i = 0; i < 60 && o.mobil && k.mobilmachung === 0 && !handlungenFuer(w, k.id).find((h) => h.id === "mobil_teil")?.moeglich; i++) advance(w, 1);
  if (o.mobil && k.mobilmachung === 0) { const m = fuehreKriegHandlungAus(w, k.id, "mobil_teil"); expect(m.ok, m.text).toBe(true); echte.push("mobilmachung"); }
  expect(waehleOperation(w, k, o.form, o.mit ?? "allein").ok).toBe(true);
  echte.push("operation");
  for (let s = 1; s < 60; s++) {
    const probe = load(JSON.stringify(w));
    const kp = kriegMit(probe, o.land)!;
    fuehreKriegHandlungAus(probe, kp.id, "ultimatum", new Rng(s));
    if (kp.phase !== "beendet") { fuehreKriegHandlungAus(w, k.id, "ultimatum", new Rng(s)); break; }
  }
  pflicht.push("ultimatum");
  advance(w, KRIEG.drohkulisseMinTage);
  w.spiel!.ereignisse = w.spiel!.ereignisse.filter((e) => !e.vorlage.startsWith("krieg"));
  const einsatz = (["beschluss_vollmacht", "beschluss"] as KriegHandlungId[]).find((h) => handlungenFuer(w, k.id).some((x) => x.id === h && x.moeglich))!;
  expect(fuehreKriegHandlungAus(w, k.id, einsatz).ok).toBe(true);
  pflicht.push("einsatz");
  // Abstimmung im Parlament (Griechenland): bis der Krieg läuft
  for (let i = 0; i < 20 && k.phase !== "krieg"; i++) advance(w, 1);
  expect(k.phase).toBe("krieg");
  return { k, echte, pflicht, start };
}

export interface KriegsLauf {
  echte: string[];
  pflicht: string[];
  wendepunkte: string[];
  monate: number;
  wochen: number;
  ausgang: string;
  gefallene: number;
  regionen: string[];
  log: string[];
}

/** Wege eines Wendepunkts nach der Haltung des Bots: die erste passende Kennung, sonst der erste Weg. */
const HALTUNG: Record<string, string[]> = {
  krieg_wp_stadtkampf: ["einschliessen"],
  krieg_wp_flucht: ["zone"],
  krieg_wp_vermittlung: ["annehmen"],
  krieg_wp_sanktion: ["vermitteln"],
  krieg_wp_munition: ["produktion"],
  krieg_wp_gefallene: ["trauer"],
  krieg_wp_zivilisten: ["untersuchen"],
  krieg_wp_schlagwelle: ["boden_sna", "boden"],
};

export function fuehreKrieg(w: World, o: Plan & { haltung?: Record<string, string[]> }): KriegsLauf {
  const wp: string[] = [], log: string[] = [];
  const { k, echte, pflicht, start } = bisKrieg(w, o);
  const haltung = { ...HALTUNG, ...o.haltung };
  for (let tag = 0; tag < 400 && k.phase !== "frieden" && k.phase !== "beendet"; tag++) {
    advance(w, 1);
    for (const ev of [...w.spiel!.ereignisse]) {
      if (!w.spiel!.ereignisse.includes(ev)) continue;
      const os = antworten(w, ev).filter((x) => !x.sperre);
      const kriegs = ev.daten?.vorgang === k.id;
      // Eine Pause nimmt der Bot erst an, wenn die Zone der Operation genommen ist (wie 2019 nach Tal Abyad und Ras al-Ain); sonst kämpft er weiter
      const haelt = kriegszielErreicht(k);
      const pause = (id: string) => (haelt ? id : "ablehnen");
      const wunsch = kriegs && WENDEPUNKT_IDS.includes(ev.vorlage) ? (haltung[ev.vorlage] ?? []).map((x) => (ev.vorlage === "krieg_wp_vermittlung" ? pause(x) : x)) : ev.vorlage === "krieg_waffenruhe" ? [pause("annehmen")] : [];
      const pick = os.find((x) => wunsch.includes(x.id)) ?? os.find((x) => (x.anzeigePk ?? x.pk) === 0) ?? os[0];
      if (!pick) continue;
      if (kriegs && WENDEPUNKT_IDS.includes(ev.vorlage)) { wp.push(`${ev.vorlage}:${pick.id}`); echte.push(ev.vorlage); log.push(`${w.date} W${k.woche} ${ev.vorlage} → ${pick.id}`); }
      else if (kriegs && ev.vorlage === "krieg_waffenruhe") { echte.push("waffenruhe_angebot"); log.push(`${w.date} W${k.woche} Angebot der Waffenruhe → ${pick.id}`); }
      w.spiel!.kapital = Math.max(w.spiel!.kapital, 40);
      entscheide(w, ev.id, pick.id, new Rng(1));
    }
    if (k.phase === "waffenruhe") {
      const id = (["paket_linie", "paket_sieg", "paket_ausgewogen", "paket_weiss"] as const).find((p) => paketAnnahme(w, k, PAKETE[p]!.paket(k.front), p) >= KRIEG.paketNoetig && handlungenFuer(w, k.id).some((h) => h.id === p && h.moeglich));
      if (id) { fuehreKriegHandlungAus(w, k.id, id); echte.push("friedenspaket"); log.push(`${w.date} W${k.woche} Frieden ${id}`); }
    }
  }
  return {
    echte, pflicht, wendepunkte: wp, monate: monthsBetween(start, w.date), wochen: k.woche, ausgang: `${k.phase}/${k.ausgang ?? "-"}`,
    gefallene: k.gefallene ?? 0, regionen: Object.entries(k.regionen ?? {}).filter(([, l]) => l === "eigen").map(([r]) => r), log,
  };
}

