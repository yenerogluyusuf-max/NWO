// „Stand der Dinge“: das Re-Entry-Blatt beim Laden eines Spielstands (RECHERCHE_SPIELFLUSS_UX.md, Kap. 7.2 ① —
// Rückkehr ist ein Feature). Reine Rechnung ohne Anzeige: Alles kommt aus dem Weltzustand und dem
// Sitzungs-Snapshot aus speicher.ts; fehlt der Snapshot (alte Spielstände), gibt es „keine Vergleichsdaten“.

import type { World } from "../sim/types";
import { formatDateDe } from "../sim/dates";
import { vorhabenDef, vorhabenSicht, reichZustand } from "../sim/reich";
import { schrittMitProgramm } from "../sim/programme";
import { faellig, termine, warnungen, KALENDER } from "./schreibtisch/briefing";
import type { KennzahlenSnapshot } from "./speicher";
import { t } from "../i18n";

export interface VorgangLaufend {
  id: string;
  titel: string;
  /** Restlaufzeit in Spieltagen */
  tage: number;
  rest: string;
}

export interface ProblemAmpel {
  id: string;
  text: string;
  stufe: "rot" | "gelb";
}

export interface KennzahlDelta {
  id: "zustimmung" | "inflation" | "kapital";
  label: string;
  von: number;
  nach: number;
  delta: number;
  /** Zustimmung und Kapital sind gut, wenn sie steigen; Inflation ist gut, wenn sie fällt. */
  gutWennAuf: boolean;
  einheit: string;
}

export interface StandDerDinge {
  datum: string;
  amtszeit: number;
  monateBisWahl: number;
  /** Bis zu drei wichtigste laufende Vorgänge, die nächste zuerst */
  vorgaenge: VorgangLaufend[];
  /** Bis zu drei schwerste Probleme, Ampel über die Stufe */
  probleme: ProblemAmpel[];
  /** Deltas seit Beginn der letzten Sitzung; null = keine Vergleichsdaten (alter Spielstand) */
  deltas: KennzahlDelta[] | null;
  /** Datum der Vergleichsbasis, formatiert */
  vergleichDatum: string | null;
  /** Eine Agenda-Zeile: der nächste feste Termin des Staatsjahres */
  agenda: string | null;
  /** Die dringendste Frist, falls es eine gibt */
  frist: { titel: string; tage: number } | null;
}

const restWort = (tage: number) => t("sk.sdd.rest", { n: Math.max(0, tage) });

/** Die drei wichtigsten laufenden Vorgänge: Gesetze vor der Abstimmung, Programm-Schritte, Bauvorhaben. */
function laufendeVorgaenge(w: World): VorgangLaufend[] {
  const spiel = w.spiel!;
  const out: VorgangLaufend[] = [];
  for (const g of spiel.gesetze) {
    const tage = Math.max(0, g.abstimmung - w.day);
    out.push({ id: `g-${g.id}`, titel: t("sk.f.gesetz.titel", { name: g.name }), tage, rest: restWort(tage) });
  }
  for (const l of spiel.programm?.laufend ?? []) {
    const eintrag = schrittMitProgramm(l.schritt);
    const tage = Math.max(0, l.ende - w.day);
    out.push({ id: `p-${l.schritt}`, titel: t("sk.sdd.programm", { titel: eintrag?.schritt.titel ?? l.schritt }), tage, rest: restWort(tage) });
  }
  const z = reichZustand(w);
  for (const l of z.laufend) {
    const sicht = vorhabenSicht(w, l.id);
    if (!sicht) continue;
    const monate = sicht.vergabePhase ? (sicht.vergabeMonate ?? 0) : (sicht.restMonate ?? 0);
    const tage = Math.ceil(monate * 30.4);
    const name = vorhabenDef(l.id)?.name ?? l.id;
    out.push({
      id: `r-${l.id}`,
      titel: t(sicht.vergabePhase ? "sk.sdd.vergabe" : l.pausiert ? "sk.sdd.ruht" : "sk.sdd.bau", { name }),
      tage,
      rest: l.pausiert && !sicht.vergabePhase ? t("sk.sdd.ruhtKurz") : t("sk.sdd.monate", { n: Math.max(0, monate) }),
    });
  }
  return out.sort((a, b) => a.tage - b.tage).slice(0, 3);
}

/** Zahlen-Deltas gegen den Snapshot vom Beginn der letzten Sitzung. */
function deltas(w: World, vorsitzung: KennzahlenSnapshot): KennzahlDelta[] {
  const spiel = w.spiel!;
  const roh: [KennzahlDelta["id"], string, number, number, boolean, string][] = [
    ["zustimmung", t("sk.kz.zustimmung"), vorsitzung.zustimmung, spiel.umfrage.zustimmung, true, "%"],
    ["inflation", t("sk.kz.preise"), vorsitzung.inflation, w.published.inflation.value, false, "%"],
    ["kapital", t("sk.kz.kapital"), vorsitzung.kapital, spiel.kapital, true, ""],
  ];
  return roh.map(([id, label, von, nach, gutWennAuf, einheit]) => ({ id, label, von, nach, delta: nach - von, gutWennAuf, einheit }));
}

export function standDerDinge(w: World, vorsitzung: KennzahlenSnapshot | null): StandDerDinge {
  const spiel = w.spiel!;
  const wahltage = Math.max(0, spiel.wahltag - w.day);
  const agendaTermin = termine(w).find((x) => x.id === "wahl" || KALENDER.some((k) => k.id === x.id && !k.weich));
  const f = faellig(w)[0];
  return {
    datum: formatDateDe(w.date),
    amtszeit: spiel.amtszeit,
    monateBisWahl: Math.round(wahltage / 30.4),
    vorgaenge: laufendeVorgaenge(w),
    probleme: warnungen(w).slice(0, 3).map((x) => ({ id: x.id, text: x.text, stufe: x.stufe })),
    deltas: vorsitzung ? deltas(w, vorsitzung) : null,
    vergleichDatum: vorsitzung ? formatDateDe(vorsitzung.datum) : null,
    agenda: agendaTermin ? t("sk.sdd.agenda", { datum: agendaTermin.datum, text: agendaTermin.text }) : null,
    frist: f && f.tage !== undefined ? { titel: f.titel, tage: f.tage } : null,
  };
}
