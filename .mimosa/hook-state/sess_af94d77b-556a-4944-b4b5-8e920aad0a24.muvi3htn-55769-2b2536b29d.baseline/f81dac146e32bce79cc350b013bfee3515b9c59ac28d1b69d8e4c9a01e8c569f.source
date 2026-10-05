// Vorschau „Folgen im Voraus“ ohne die Oberfläche zu blockieren: Die Rechnung läuft in einem Web Worker.
// Ohne Worker (etwa in Tests) rechnet die Vorschau im selben Thread.

import { outlookMany, type Aktion, type Metric, type Outlook } from "../sim/forecast";
import { save } from "../sim/world";
import type { World } from "../sim/types";

let worker: Worker | null = null;
let zaehler = 0;
const offen = new Map<number, { ok: (o: Outlook[]) => void; fehler: (e: Error) => void }>();

function starte(): Worker | null {
  if (worker) return worker;
  if (typeof Worker === "undefined") return null;
  try {
    worker = new Worker(new URL("../sim/forecast.worker.ts", import.meta.url), { type: "module" });
    worker.onmessage = (e: MessageEvent<{ id: number; ergebnis?: Outlook[]; fehler?: string }>) => {
      const p = offen.get(e.data.id);
      if (!p) return;
      offen.delete(e.data.id);
      if (e.data.ergebnis) p.ok(e.data.ergebnis);
      else p.fehler(new Error(e.data.fehler ?? "Vorschau fehlgeschlagen"));
    };
    worker.onerror = () => {
      worker = null;
    };
    return worker;
  } catch {
    return null;
  }
}

export function berechneVorschau(world: World, aktion: Aktion, metriken: Metric[], monate = 12, laeufe = 10): Promise<Outlook[]> {
  const w = starte();
  if (!w) return Promise.resolve(outlookMany(world, aktion, metriken, monate, laeufe));
  return new Promise((ok, fehler) => {
    const id = ++zaehler;
    offen.set(id, { ok, fehler });
    w.postMessage({ id, welt: save(world), aktion, metriken, monate, laeufe });
  });
}
