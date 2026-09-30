// Prognosebänder ohne die Oberfläche zu blockieren: Die Rechnung läuft in einem Web Worker (ohne Worker, etwa in Tests, im selben Thread).
// Ergebnisse werden für denselben Spielstand und dieselbe Handlung gemerkt.

import { prognoseReihen, type Aktion, type Band, type Metric, type PrognoseReihe } from "../../sim/forecast";
import { save } from "../../sim/world";
import type { World } from "../../sim/types";

let worker: Worker | null = null;
let zaehler = 0;
const offen = new Map<number, { ok: (o: PrognoseReihe[]) => void; fehler: (e: Error) => void }>();
const gemerkt = new Map<string, Promise<PrognoseReihe[]>>();

interface Auftrag {
  welt: string;
  aktion: Aktion | null;
  metriken: Metric[];
  monate: number;
  laeufe: number;
  ok: (o: PrognoseReihe[]) => void;
  fehler: (e: Error) => void;
}
/** Der Worker rechnet einen Auftrag nach dem anderen; wartet schon einer, zählt nur der neueste (wer schneller klickt, als gerechnet wird, will das Alte nicht mehr). */
let laeuft = false;
let wartend: Auftrag | null = null;

function starte(): Worker | null {
  if (worker) return worker;
  if (typeof Worker === "undefined") return null;
  try {
    worker = new Worker(new URL("../../sim/wirtschaft.worker.ts", import.meta.url), { type: "module" });
    worker.onmessage = (e: MessageEvent<{ id: number; ergebnis?: PrognoseReihe[]; fehler?: string }>) => {
      const p = offen.get(e.data.id);
      laeuft = false;
      if (p) {
        offen.delete(e.data.id);
        if (e.data.ergebnis) p.ok(e.data.ergebnis);
        else p.fehler(new Error(e.data.fehler ?? "Prognose fehlgeschlagen"));
      }
      naechster();
    };
    worker.onerror = () => {
      worker = null;
      laeuft = false;
    };
    return worker;
  } catch {
    return null;
  }
}

function naechster(): void {
  const w = worker;
  if (!w || laeuft || !wartend) return;
  const a = wartend;
  wartend = null;
  laeuft = true;
  const id = ++zaehler;
  offen.set(id, { ok: a.ok, fehler: a.fehler });
  w.postMessage({ id, welt: a.welt, aktion: a.aktion, metriken: a.metriken, monate: a.monate, laeufe: a.laeufe });
}

/** Wenige Zufallsläufe machen das Band treppig; ein gleitender Mittelwert über drei Monate glättet es, ohne die Reihenfolge low, mid, high zu verletzen. */
function glaette(b: Band[]): Band[] {
  return b.map((_, i) => {
    const nachbarn = b.slice(Math.max(0, i - 1), Math.min(b.length, i + 2));
    const mittel = (f: (x: Band) => number) => nachbarn.reduce((a, x) => a + f(x), 0) / nachbarn.length;
    const low = mittel((x) => x.low);
    const mid = mittel((x) => x.mid);
    const high = mittel((x) => x.high);
    return { low: Math.min(low, mid), mid, high: Math.max(high, mid) };
  });
}

function geglaettet(r: PrognoseReihe[]): PrognoseReihe[] {
  return r.map((x) => ({ ...x, ohne: glaette(x.ohne), mit: glaette(x.mit) }));
}

/** Die Prognose als Band je Monat, mit und ohne Handlung; gleiche Anfragen an demselben Stand kommen aus dem Speicher. */
export function berechneReihen(world: World, aktion: Aktion | null, metriken: Metric[], monate = 12, laeufe = 8): Promise<PrognoseReihe[]> {
  const key = `${world.day}|${Math.floor(world.spiel?.kapital ?? 0)}|${JSON.stringify(aktion)}|${metriken.join(",")}|${monate}|${laeufe}`;
  const schon = gemerkt.get(key);
  if (schon) return schon;
  const w = starte();
  const p: Promise<PrognoseReihe[]> = w
    ? new Promise<PrognoseReihe[]>((ok, fehler) => {
        if (wartend) wartend.fehler(new Error("überholt"));
        wartend = { welt: save(world), aktion, metriken, monate, laeufe, ok, fehler };
        naechster();
      }).then(geglaettet)
    : Promise.resolve(geglaettet(prognoseReihen(world, aktion, metriken, monate, laeufe)));
  gemerkt.set(key, p);
  if (gemerkt.size > 40) gemerkt.delete(gemerkt.keys().next().value as string);
  p.catch(() => gemerkt.delete(key));
  return p;
}
