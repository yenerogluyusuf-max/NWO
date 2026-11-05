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
import { akteurName } from "./welt-modell";
import { t } from "../i18n";
import { zeitungEreignis } from "./zeitung";
import { DEVISEN } from "./devisen";
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
  /** Zahlungsbilanzkrise (WIR-2): Verteuerungsfaktor für Ausgaben (die Schwellen stehen in DEVISEN, devisen.ts) */
  zahlungsbilanz: { faktor: 1.5 },
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
  /** Schwelle erreicht: Die Krise wird aktiv. */
  ausloeser: (w: World) => boolean;
  /** Unterschwelle unterschritten: Eine aktive Krise endet (Hysterese). */
  beruhigt: (w: World) => boolean;
  /** Platzhalter der Texte (krise.<id>.grund, .wirkung, .bedingung; Katalog krisen.json). Der Ausweg (krise.<id>.ausweg) nennt bei
   * einer Ablehnung immer den Alternativweg. */
  werte?: (w: World) => Record<string, string | number>;
  /** Wie die Krise eine Maßnahme trifft; null = nicht betroffen. */
  effekt: (node: NodeSpec) => KrisenEffekt | null;
}


// ---------------------------------------------------------------------------
// Auslöser der einzelnen Krisen

const R = KRISEN_REGELN;

/** Katastrophen-Ereignisvorlagen, die eine Katastrophenlage auslösen. */
const KATASTROPHEN_VORLAGEN = new Set(["erdbeben", "ueberschwemmung", "grossbeben", "katastrophe_flut", "katastrophe_duerre", "katastrophe_waldbrand"]);

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

function schaerfsterNachbar(w: World): { id: string; konflikt: number } | null {
  if (!w.spiel) return null;
  const welt = weltZustand(w);
  let out: { id: string; konflikt: number } | null = null;
  for (const l of LAENDER) {
    if (l.gruppe !== "Nachbarn") continue;
    const k = welt[l.id]?.konflikt ?? 0;
    if (!out || k > out.konflikt) out = { id: l.id, konflikt: k };
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
    ausloeser: (w) => w.economy.fxChange12 >= R.lira.abwertungAn || w.economy.riskPremium >= R.lira.cdsAn,
    beruhigt: (w) => w.economy.fxChange12 < R.lira.abwertungAus && w.economy.riskPremium < R.lira.cdsAus,
    werte: (w) => {
      const a = w.economy.fxChange12 >= R.lira.abwertungAus, c = w.economy.riskPremium >= R.lira.cdsAus;
      return { fall: a && c ? "beide" : a ? "abwertung" : c ? "cds" : "keins", abwertung: w.economy.fxChange12, cds: Math.round(w.economy.riskPremium), faktor: R.lira.faktor, abwertungAus: R.lira.abwertungAus, cdsAus: R.lira.cdsAus };
    },
    effekt: (node) => ((node.theme === "wirtschaft" || node.theme === "haushalt") && (node.cost ?? 0) > 0 ? { art: "teuer", faktor: R.lira.faktor } : null),
  },
  {
    id: "katastrophenlage",
    ausloeser: (w) => katastropheOffen(w) || w.day - katastropheZuletzt(w) < R.katastrophe.frisch,
    beruhigt: (w) => !katastropheOffen(w) && w.day - katastropheZuletzt(w) > R.katastrophe.ende,
    werte: () => ({ faktor: R.katastrophe.faktor, tage: R.katastrophe.ende }),
    effekt: (node) => {
      if (VERSORGUNG.has(node.theme)) return null;
      if (node.theme === "kultur") return { art: "gesperrt", faktor: 1 };
      return { art: "teuer", faktor: R.katastrophe.faktor };
    },
  },
  {
    id: "kriegsgefahr",
    ausloeser: (w) => (schaerfsterNachbar(w)?.konflikt ?? 0) > R.krieg.an,
    beruhigt: (w) => (schaerfsterNachbar(w)?.konflikt ?? 0) < R.krieg.aus,
    werte: (w) => {
      const n = schaerfsterNachbar(w);
      return { land: n ? akteurName(n.id) : "", wert: Math.round(n?.konflikt ?? 0), rabatt: Math.round(R.krieg.rabatt * 100), schwelle: R.krieg.aus };
    },
    effekt: (node) => {
      if (node.theme === "aussen" || node.theme === "militaer") return { art: "teuer", faktor: R.krieg.rabatt };
      if (node.theme === "kultur") return { art: "gesperrt", faktor: 1 };
      return null;
    },
  },
  {
    id: "zahlungsbilanz",
    ausloeser: (w) => (w.economy.reservenNettoUsdMrd ?? Number.POSITIVE_INFINITY) < DEVISEN.kriseAn,
    beruhigt: (w) => (w.economy.reservenNettoUsdMrd ?? Number.POSITIVE_INFINITY) > DEVISEN.kriseAus,
    werte: (w) => ({ reserven: w.economy.reservenNettoUsdMrd ?? 0, faktor: R.zahlungsbilanz.faktor, schwelle: DEVISEN.kriseAus }),
    effekt: (node) => {
      if ((node.theme === "wirtschaft" || node.theme === "haushalt") && (node.cost ?? 0) > 0) return { art: "teuer", faktor: R.zahlungsbilanz.faktor };
      if (node.theme === "kultur") return { art: "gesperrt", faktor: 1 };
      return null;
    },
  },
  {
    id: "justiz_umbau",
    ausloeser: justizreformLaeuft,
    beruhigt: (w) => !justizreformLaeuft(w),
    effekt: (node) => (node.theme === "recht" && node.id !== "m_justizreform" ? { art: "gesperrt", faktor: 1 } : null),
  },
];

function defZu(id: string): KrisenDef | undefined {
  return KRISEN.find((d) => d.id === id);
}

/** Texte einer Krise in der aktuellen Sprache (Katalog krisen.json) */
function text(def: KrisenDef, feld: "name" | "grund" | "wirkung" | "bedingung" | "ausweg", w: World): string {
  const v = def.werte?.(w) ?? {};
  // Die Bedingung nennt die Unterschwellen, der Grund die aktuellen Werte
  return t(`krise.${def.id}.${feld}`, feld === "bedingung" && def.id === "lira_vertrauen" ? { abwertung: v.abwertungAus!, cds: v.cdsAus! } : v);
}

// ---------------------------------------------------------------------------
// Lesen

/** Die aktuell aktiven Krisen, aufbereitet für Banner und Badges. */
export function aktiveKrisen(world: World): KrisenSicht[] {
  const spiel = world.spiel;
  if (!spiel) return [];
  return (spiel.krisen ?? []).flatMap((k) => {
    const def = defZu(k.id);
    return def ? [{ id: def.id, name: text(def, "name", world), grund: text(def, "grund", world), wirkung: text(def, "wirkung", world), bedingung: text(def, "bedingung", world), seit: k.seit }] : [];
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
    const treffer: KrisenTreffer = { krise, art: e.art, faktor: e.art === "teuer" ? e.faktor : 1 };
    if (e.art === "gesperrt") treffer.ausweg = text(def, "ausweg", world);
    return [treffer];
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
        addLog(world, "ereignis", t("krise.vorbei", { name: text(def, "name", world) }), text(def, "bedingung", world));
        continue;
      }
      neu.push(aktiv);
    } else if (def.ausloeser(world)) {
      neu.push({ id: def.id, seit: world.day });
      const name = text(def, "name", world), grund = text(def, "grund", world);
      addLog(world, "ereignis", `${name}: ${grund}`, `${text(def, "wirkung", world)} ${text(def, "bedingung", world)}`);
      // Krise (bzw. Kriegsphase): Großereignis für die Zeitung — Eilmeldung digital, Print im nächsten Monat
      zeitungEreignis(world, {
        art: "krise",
        titel: name,
        fakt: grund,
        wertung: def.id === "kriegsgefahr" ? -0.9 : -0.8,
        ...(def.id === "kriegsgefahr" ? { krieg: true } : {}),
        schluessel: [name],
      });
    }
  }
  spiel.krisen = neu;
}
