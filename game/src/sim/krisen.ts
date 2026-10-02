// Krisen-Blocker (MIL-3 aus VERBESSERUNGSPLAN_2026-09-30, HOI4 „National Spirits" light):
// Akute Zustände sperren oder verteuern bestimmte Maßnahmen vorübergehend, bis sich die Lage beruhigt hat.
//   - „Lira-Vertrauen erschüttert": Abwertung oder Risikoaufschlag über der Schwelle → Ausgaben in Wirtschaft und Haushalt teurer
//   - „Katastrophenlage": nach Erdbeben oder Überschwemmung → Versorgung bleibt normal, der Rest teurer, Prestige gesperrt
//   - „Kriegsgefahr": Konflikt mit einem Nachbarn über der Schwelle → Außen- und Militärpolitik günstiger, Prestige gesperrt
//   - „Justiz im Umbau": solange die Justizreform läuft, sind weitere Justiz-Maßnahmen gesperrt
// Alle Schwellen und Faktoren sind Spielparameter der Kalibrierung, keine Tatsachenbehauptungen.
// Hysterese: Einmal aktiv, endet eine Krise erst unter der tieferen Unterschwelle — kein Flackern an der Grenze.
// Der Zustand lebt in spiel.krisen (nur wer aktiv ist und seit wann); alles andere wird aus der Welt abgeleitet.

import { NET } from "./modell";
import { nationalAverage } from "./netz";
import { addLog } from "./log";
import { LAENDER, weltZustand } from "./laender";
import type { World } from "./types";
import type { AktiveKrise } from "./spiel-typen";
import type { NodeSpec } from "../data/politiknetz";

/** Spielparameter, keine Tatsachen: Schwellen und Faktoren der Krisen (Kalibrierung). */
export const KRISEN_REGELN = {
  /** Lira-Vertrauen: Abwertung der Lira auf 12 Monate (%) oder Risikoaufschlag (CDS, Basispunkte) über der Schwelle */
  lira: { abwertungAn: 45, abwertungAus: 35, cdsAn: 600, cdsAus: 450, faktor: 1.5 },
  /** Katastrophenlage: wird in den ersten Tagen nach dem Ereignis aktiv, endet, wenn es länger zurückliegt */
  katastrophe: { frisch: 60, ende: 90, faktor: 1.5 },
  /** Kriegsgefahr: Konflikt-Dimension eines Nachbarn (0 bis 100) über der Schwelle; Rabatt für Außen/Militär */
  krieg: { an: 75, aus: 65, rabatt: 0.75 },
} as const;

export type KrisenArt = "gesperrt" | "teuer";

/** Eine aktive Krise, aufbereitet für Anzeige und Prüfung. */
export interface KrisenSicht {
  id: string;
  name: string;
  /** Warum die Krise gerade aktiv ist (ein Satz) */
  grund: string;
  /** Was sie mit den betroffenen Maßnahmen macht (ein Satz) */
  wirkung: string;
  /** Woran man erkennt, dass sie endet (Restbedingung) */
  bedingung: string;
  /** Tag (seit Spielbeginn), an dem sie aktiv wurde */
  seit: number;
}

/** Wie eine aktive Krise eine konkrete Maßnahme trifft. */
export interface KrisenTreffer {
  krise: KrisenSicht;
  art: KrisenArt;
  /** Kostenfaktor bei „teuer" (unter 1 = günstiger); bei „gesperrt" immer 1 */
  faktor: number;
  /** Der ehrliche Ausweg bei einer Ablehnung; nur bei „gesperrt" gesetzt */
  ausweg?: string;
}

interface KrisenEffekt {
  art: KrisenArt;
  faktor: number;
}

interface KrisenDef {
  id: string;
  name: string;
  /** Schwelle erreicht: Die Krise wird aktiv. */
  ausloeser: (w: World) => boolean;
  /** Unterschwelle unterschritten: Eine aktive Krise endet (Hysterese). */
  beruhigt: (w: World) => boolean;
  grund: (w: World) => string;
  wirkung: string;
  bedingung: string;
  /** Was der Spieler stattdessen tun kann — eine Ablehnung nennt immer den Alternativweg. */
  ausweg: string;
  /** Wie die Krise eine Maßnahme trifft; null = nicht betroffen. */
  effekt: (node: NodeSpec) => KrisenEffekt | null;
}

const nf = (x: number) => x.toLocaleString("de-DE", { maximumFractionDigits: 1 });

// ---------------------------------------------------------------------------
// Auslöser der einzelnen Krisen

const R = KRISEN_REGELN;

/** Katastrophen-Ereignisvorlagen, die eine Katastrophenlage auslösen. */
const KATASTROPHEN_VORLAGEN = new Set(["erdbeben", "ueberschwemmung"]);

/** Themen, die in der Katastrophenlage unverteuert bleiben (Versorgung der Betroffenen). */
const VERSORGUNG = new Set(["wohnen", "gesundheit", "sicherheit", "infrastruktur"]);

function katastropheZuletzt(w: World): number {
  const spiel = w.spiel!;
  let tag = -1e9;
  for (const v of KATASTROPHEN_VORLAGEN) tag = Math.max(tag, spiel.zuletzt[v] ?? -1e9);
  return tag;
}

function katastropheOffen(w: World): boolean {
  return w.spiel!.ereignisse.some((e) => KATASTROPHEN_VORLAGEN.has(e.vorlage));
}

function schaerfsterNachbar(w: World): { name: string; konflikt: number } | null {
  if (!w.spiel) return null;
  const welt = weltZustand(w);
  let out: { name: string; konflikt: number } | null = null;
  for (const l of LAENDER) {
    if (l.gruppe !== "Nachbarn") continue;
    const k = welt[l.id]?.konflikt ?? 0;
    if (!out || k > out.konflikt) out = { name: l.name, konflikt: k };
  }
  return out;
}

/** Läuft die Justizreform gerade (Gesetz im Parlament oder Umsetzung unterwegs)? */
function justizreformLaeuft(w: World): boolean {
  const spiel = w.spiel;
  if (!spiel) return false;
  if (spiel.gesetze.some((g) => g.massnahme === "m_justizreform")) return true;
  const ziel = w.net.targets["m_justizreform"];
  if (ziel !== undefined && Math.abs(ziel - nationalAverage(NET, w.net, "m_justizreform")) > 1) return true;
  const ziele = w.net.ziele?.["m_justizreform"];
  if (ziele?.some((z) => z >= 0)) return true;
  return false;
}

// ---------------------------------------------------------------------------
// Die Krisen

const KRISEN: KrisenDef[] = [
  {
    id: "lira_vertrauen",
    name: "Lira-Vertrauen erschüttert",
    ausloeser: (w) => w.economy.fxChange12 >= R.lira.abwertungAn || w.economy.riskPremium >= R.lira.cdsAn,
    beruhigt: (w) => w.economy.fxChange12 < R.lira.abwertungAus && w.economy.riskPremium < R.lira.cdsAus,
    grund: (w) => {
      const teile: string[] = [];
      if (w.economy.fxChange12 >= R.lira.abwertungAus) teile.push(`die Lira hat in zwölf Monaten ${nf(w.economy.fxChange12)} % verloren`);
      if (w.economy.riskPremium >= R.lira.cdsAus) teile.push(`der Risikoaufschlag liegt bei ${Math.round(w.economy.riskPremium)} Punkten`);
      return `Die Märkte trauen der Lira nicht: ${teile.join(" und ")}. Neue Ausgabenprogramme lesen sie als Inflationsrisiko.`;
    },
    wirkung: `Ausgaben in Wirtschaft und Haushalt kosten das ${nf(R.lira.faktor)}-fache an Kapital.`,
    bedingung: `Endet, wenn die Abwertung auf zwölf Monate unter ${R.lira.abwertungAus} % und der Risikoaufschlag unter ${R.lira.cdsAus} Punkte fallen.`,
    ausweg: "Ausweg: erst das Vertrauen zurückgewinnen (Zentralbank in Ruhe lassen, Haushalt ordnen) oder Einnahmen statt Ausgaben nutzen.",
    effekt: (node) => ((node.theme === "wirtschaft" || node.theme === "haushalt") && (node.cost ?? 0) > 0 ? { art: "teuer", faktor: R.lira.faktor } : null),
  },
  {
    id: "katastrophenlage",
    name: "Katastrophenlage",
    ausloeser: (w) => katastropheOffen(w) || w.day - katastropheZuletzt(w) < R.katastrophe.frisch,
    beruhigt: (w) => !katastropheOffen(w) && w.day - katastropheZuletzt(w) > R.katastrophe.ende,
    grund: () => "Nach der Katastrophe sind Verwaltung, Haushalt und Aufmerksamkeit auf Nothilfe und Versorgung der Betroffenen ausgerichtet.",
    wirkung: `Nur Versorgung (Wohnen, Gesundheit, Sicherheit, Infrastruktur) geht wie bisher; alles andere kostet das ${nf(R.katastrophe.faktor)}-fache, Prestige-Vorhaben (Kultur) warten.`,
    bedingung: `Endet, wenn die Katastrophe mehr als ${R.katastrophe.ende} Tage zurückliegt und kein Ereignis mehr offen ist.`,
    ausweg: "Ausweg: Was der Versorgung dient (Wohnen, Gesundheit, Sicherheit, Infrastruktur), geht sofort; der Rest wartet, bis die Lage vorbei ist.",
    effekt: (node) => {
      if (VERSORGUNG.has(node.theme)) return null;
      if (node.theme === "kultur") return { art: "gesperrt", faktor: 1 };
      return { art: "teuer", faktor: R.katastrophe.faktor };
    },
  },
  {
    id: "kriegsgefahr",
    name: "Kriegsgefahr",
    ausloeser: (w) => (schaerfsterNachbar(w)?.konflikt ?? 0) > R.krieg.an,
    beruhigt: (w) => (schaerfsterNachbar(w)?.konflikt ?? 0) < R.krieg.aus,
    grund: (w) => {
      const n = schaerfsterNachbar(w);
      return n ? `Der Konflikt mit ${n.name} steht bei ${Math.round(n.konflikt)} von 100; das Land erwartet Geschlossenheit statt Schauprojekten.` : "";
    },
    wirkung: `Außen- und Militärpolitik kostet nur ${Math.round(R.krieg.rabatt * 100)} % des Kapitals; Prestige-Vorhaben (Kultur) sind gesperrt.`,
    bedingung: `Endet, wenn kein Konflikt mit einem Nachbarn mehr über ${R.krieg.aus} steht.`,
    ausweg: "Ausweg: den Konflikt entschärfen (Gespräche am Verhandlungstisch in der Welt) — oder warten, bis die Spannung nachlässt.",
    effekt: (node) => {
      if (node.theme === "aussen" || node.theme === "militaer") return { art: "teuer", faktor: R.krieg.rabatt };
      if (node.theme === "kultur") return { art: "gesperrt", faktor: 1 };
      return null;
    },
  },
  {
    id: "justiz_umbau",
    name: "Justiz im Umbau",
    ausloeser: justizreformLaeuft,
    beruhigt: (w) => !justizreformLaeuft(w),
    grund: () => "Die Justizreform wird gerade umgesetzt; Gerichte, Ministerium und Richterrat sind mit dem Umbau ausgelastet.",
    wirkung: "Weitere Justiz-Maßnahmen (Recht und Justiz) sind gesperrt, bis die Reform abgeschlossen ist.",
    bedingung: "Endet, wenn die Justizreform umgesetzt oder ihr Gesetz zurückgezogen ist.",
    ausweg: "Ausweg: die laufende Reform zu Ende bringen (oder ihr Gesetz im Parlament zurückziehen); danach ist der Weg frei.",
    effekt: (node) => (node.theme === "recht" && node.id !== "m_justizreform" ? { art: "gesperrt", faktor: 1 } : null),
  },
];

function defZu(id: string): KrisenDef | undefined {
  return KRISEN.find((d) => d.id === id);
}

// ---------------------------------------------------------------------------
// Lesen

/** Die aktuell aktiven Krisen, aufbereitet für Banner und Badges. */
export function aktiveKrisen(world: World): KrisenSicht[] {
  const spiel = world.spiel;
  if (!spiel) return [];
  return (spiel.krisen ?? []).flatMap((k) => {
    const def = defZu(k.id);
    return def ? [{ id: def.id, name: def.name, grund: def.grund(world), wirkung: def.wirkung, bedingung: def.bedingung, seit: k.seit }] : [];
  });
}

/** Wie die aktiven Krisen eine Maßnahme treffen (leer, wenn keine betroffen ist). */
export function krisenFuerMassnahme(world: World, massnahmeId: string): KrisenTreffer[] {
  const i = NET.index.get(massnahmeId);
  const node = i === undefined ? undefined : NET.nodes[i];
  if (!node || node.kind !== "massnahme") return [];
  return aktiveKrisen(world).flatMap((krise) => {
    const def = defZu(krise.id)!;
    const e = def.effekt(node);
    if (!e) return [];
    const t: KrisenTreffer = { krise, art: e.art, faktor: e.art === "teuer" ? e.faktor : 1 };
    if (e.art === "gesperrt") t.ausweg = def.ausweg;
    return [t];
  });
}

// ---------------------------------------------------------------------------
// Schreiben (einmal täglich aus dem Tick)

/** Bringt die Krisenliste auf den Stand der Welt: aktiviert über der Schwelle, beendet unter der Unterschwelle (Hysterese). */
export function krisenAktualisieren(world: World): void {
  const spiel = world.spiel;
  if (!spiel || spiel.ende) return;
  const bisher = spiel.krisen ?? [];
  const neu: AktiveKrise[] = [];
  for (const def of KRISEN) {
    const aktiv = bisher.find((k) => k.id === def.id);
    if (aktiv) {
      if (def.beruhigt(world)) {
        addLog(world, "ereignis", `„${def.name}“ ist vorbei.`, def.bedingung);
        continue;
      }
      neu.push(aktiv);
    } else if (def.ausloeser(world)) {
      neu.push({ id: def.id, seit: world.day });
      addLog(world, "ereignis", `${def.name}: ${def.grund(world)}`, `${def.wirkung} ${def.bedingung}`);
    }
  }
  spiel.krisen = neu;
}
