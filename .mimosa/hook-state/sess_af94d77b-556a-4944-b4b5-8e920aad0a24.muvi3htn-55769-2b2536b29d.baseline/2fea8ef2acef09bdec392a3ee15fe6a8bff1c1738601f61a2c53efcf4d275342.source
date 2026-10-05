// Vom Problem zur Lösung: Aus den akuten Problemen und den Verbindungen des Politiknetzes werden konkrete Vorhaben
// berechnet, die das Problem dort angehen, wo es akut ist, mit Kosten, Mehrheit und Dauer. Was vorgeschlagen wird,
// ändert sich mit der Lage: ein gelöstes Problem, ein laufendes Gesetz oder eine erreichte Stufe nehmen es aus der Liste.

import { NET } from "./modell";
import { PROVINCES } from "./netz";
import { clamp } from "./economy";
import { hebel } from "./wege";
import { pruefeVorhaben, stufeIn } from "./handeln";
import { skala, skalenArt, tunWort } from "../data/skalen";
import type { World } from "./types";

export interface Vorschlag {
  massnahme: string;
  name: string;
  /** +1 erhöhen, −1 senken */
  richtung: 1 | -1;
  stufeJetzt: number;
  ziel: number;
  /** Bei Maßnahmen mit benannten Zuständen: wie der heutige und der vorgeschlagene Zustand heißen */
  jetztName?: string;
  zielName?: string;
  /** Kfz-Kennziffern; null = ganzes Land */
  ort: number[] | null;
  problemId: string;
  problemName: string;
  /** In wie vielen Provinzen das Problem akut ist */
  provinzen: number;
  pk: number;
  kostenBip: number;
  monate: number;
  bezahlbar: boolean;
  urteil: "sicher" | "knapp" | "verloren";
  /** Ein Satz, warum genau das */
  grund: string;
  punkte: number;
}

const hash = (t: string): number => {
  let h = 2166136261;
  for (let i = 0; i < t.length; i++) h = Math.imul(h ^ t.charCodeAt(i), 16777619);
  return (h >>> 0) / 4294967296;
};

/** Maßnahmen, die ab einer Stufe mehr schaden als nützen; der Vorschlag hört davor auf und sagt es. */
const GRENZEN: Record<string, { max: number; hinweis: string }> = {
  m_mietdeckel: { max: 55, hinweis: "Über Stufe 60 bricht der Neubau ein." },
  m_preiskontrollen: { max: 55, hinweis: "Über Stufe 60 verschwindet Ware in den Schwarzmarkt." },
};

interface AkutesProblem {
  id: string;
  name: string;
  provinzen: number[];
  /** Bevölkerungsanteil der betroffenen Provinzen, 0 bis 1 */
  last: number;
}

export function akuteProbleme(world: World): AkutesProblem[] {
  const out: AkutesProblem[] = [];
  for (const n of NET.nodes) {
    if (n.kind !== "problem" || !n.threshold) continue;
    const i = NET.index.get(n.id)!;
    const provinzen: number[] = [];
    let last = 0;
    for (let p = 0; p < PROVINCES; p++) {
      if (world.net.values[i * PROVINCES + p]! >= n.threshold) {
        provinzen.push(p + 1);
        last += world.net.weights[p]!;
      }
    }
    if (provinzen.length) out.push({ id: n.id, name: n.name, provinzen, last });
  }
  return out.sort((a, b) => b.last - a.last);
}

/** Läuft zu dieser Maßnahme gerade eine Umsetzung (landesweit oder vor Ort)? */
function wirdUmgesetzt(world: World, id: string): boolean {
  const i = NET.index.get(id)!;
  const land = world.net.targets[id];
  if (land !== undefined && Math.abs(land - stufeIn(world, id, null)) > 1) return true;
  const ort = world.net.ziele?.[id];
  if (ort) {
    for (let p = 0; p < PROVINCES; p++) {
      const t = ort[p];
      if (t !== undefined && t >= 0 && Math.abs(t - world.net.values[i * PROVINCES + p]!) > 1) return true;
    }
  }
  return false;
}

/** Bis zu `n` Vorhaben, die die akuten Probleme jetzt am wirksamsten angehen, unter Abzug ihrer Nebenwirkungen auf andere Probleme. */
export function vorschlaege(world: World, n = 5): Vorschlag[] {
  const spiel = world.spiel;
  const monat = Math.floor(world.day / 30);
  const probleme = akuteProbleme(world);

  // Für jede Maßnahme: Wie stark und in welche Richtung wirkt sie auf welches akute Problem?
  interface Beitrag {
    problem: AkutesProblem;
    /** +1 Maßnahme erhöhen hilft, −1 Maßnahme senken hilft */
    richtung: 1 | -1;
    wert: number;
  }
  const beitraege = new Map<string, Beitrag[]>();
  for (const problem of probleme) {
    for (const h of hebel(problem.id, -1, 12)) {
      const liste = beitraege.get(h.node.id) ?? [];
      liste.push({ problem, richtung: h.richtung, wert: problem.last * h.staerke });
      beitraege.set(h.node.id, liste);
    }
  }

  const kandidaten: Vorschlag[] = [];
  for (const [id, liste] of beitraege) {
    if (spiel?.gesetze.some((g) => g.massnahme === id)) continue; // liegt schon im Parlament
    if (wirdUmgesetzt(world, id)) continue;
    const plus = liste.filter((b) => b.richtung === 1).reduce((s, b) => s + b.wert, 0);
    const minus = liste.filter((b) => b.richtung === -1).reduce((s, b) => s + b.wert, 0);
    const richtung: 1 | -1 = plus >= minus ? 1 : -1;
    const nutzen = richtung === 1 ? plus : minus;
    const schaden = richtung === 1 ? minus : plus;
    const netto = nutzen - 1.2 * schaden;
    if (netto <= 0) continue;
    const gleich = liste.filter((b) => b.richtung === richtung).sort((a, b) => b.wert - a.wert);
    const haupt = gleich[0]!.problem;
    const ort = haupt.provinzen.length <= 50 ? haupt.provinzen : null;
    const jetzt = stufeIn(world, id, ort);
    // Ist die Maßnahme dort schon weit ausgebaut, bringt mehr wenig: der Vorschlag verschwindet, das Problem ist ein anderes
    if ((richtung > 0 && jetzt >= 80) || (richtung < 0 && jetzt <= 15)) continue;
    const grenze = GRENZEN[id];
    let ziel = clamp(Math.round(jetzt + richtung * 20), 0, grenze && richtung > 0 ? grenze.max : 100);
    let jetztName: string | undefined;
    let zielName: string | undefined;
    if (skalenArt(id) === "regime") {
      // Benannte Zustände: zum nächsten Zustand in der gewünschten Richtung, nicht zu einer beliebigen Zahl
      const sk = skala(id, jetzt);
      const heute = sk.stufen.reduce((b, st) => (Math.abs(st.w - jetzt) < Math.abs(b.w - jetzt) ? st : b), sk.stufen[0]!);
      const weiter = sk.stufen.filter((st) => (richtung > 0 ? st.w > heute.w + 3 : st.w < heute.w - 3));
      const naechster = richtung > 0 ? weiter[0] : weiter[weiter.length - 1];
      if (!naechster) continue;
      if (grenze && richtung > 0 && naechster.w > grenze.max) continue;
      ziel = naechster.w;
      jetztName = heute.name;
      zielName = naechster.name;
    }
    if (Math.abs(ziel - jetzt) < 5) continue;
    const pr = pruefeVorhaben(world, id, ziel, ort);
    if (!pr.ok) continue;
    const luecke = pr.gesetz.stimmen.luecke;
    const mehrheit = luecke === 0 ? 1 : luecke <= 30 ? 0.65 : 0.2;
    const kapital = pr.gesetz.bezahlbar ? 1 : 0.5;
    const jitter = 0.9 + 0.2 * hash(`${id}|${monat}`);
    // Vielfalt: Was in den letzten Monaten schon beschlossen wurde, kommt seltener wieder vor
    const kuerzlich = (spiel?.beobachtungen ?? []).filter((o) => o.id === id && world.day - o.tag < 300).length;
    const punkte = ((netto * 1000) / (pr.gesetz.pk + 2)) * mehrheit * kapital * jitter * Math.pow(0.35, kuerzlich);
    const kosten = Math.ceil((luecke + 8) * 0.5);
    const node = NET.nodes[NET.index.get(id)!]!;
    const auch = gleich.slice(1, 3).map((b) => b.problem.name);
    const schadet = liste.filter((b) => b.richtung !== richtung).sort((a, b) => b.wert - a.wert).slice(0, 2).map((b) => b.problem.name);
    kandidaten.push({
      massnahme: id,
      name: node.name,
      richtung,
      stufeJetzt: Math.round(jetzt),
      ziel,
      ...(jetztName ? { jetztName } : {}),
      ...(zielName ? { zielName } : {}),
      ort,
      problemId: haupt.id,
      problemName: haupt.name,
      provinzen: haupt.provinzen.length,
      pk: pr.gesetz.pk,
      kostenBip: pr.kostenBip,
      monate: pr.monate,
      bezahlbar: pr.gesetz.bezahlbar,
      urteil: luecke === 0 ? "sicher" : (spiel?.kapital ?? 0) - pr.gesetz.pk >= kosten ? "knapp" : "verloren",
      grund:
        `${haupt.name} ist in ${haupt.provinzen.length} ${haupt.provinzen.length === 1 ? "Provinz" : "Provinzen"} akut; ${node.name} ${tunWort(id, richtung)} wirkt darauf.` +
        (auch.length ? ` Hilft auch bei: ${auch.join(", ")}.` : "") +
        (schadet.length ? ` Belastet: ${schadet.join(", ")}.` : "") +
        (grenze ? ` Achtung: ${grenze.hinweis}` : ""),
      punkte,
    });
  }
  // Höchstens zwei Vorhaben je Hauptproblem, damit die Liste nicht von einem Thema beherrscht wird
  const je = new Map<string, number>();
  const out: Vorschlag[] = [];
  for (const v of kandidaten.sort((a, b) => b.punkte - a.punkte)) {
    const c = je.get(v.problemId) ?? 0;
    if (c >= 2) continue;
    je.set(v.problemId, c + 1);
    out.push(v);
    if (out.length >= n) break;
  }
  return out;
}
