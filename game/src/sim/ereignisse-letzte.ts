// Die letzte Amtszeit kündigt sich an (Welle E3b, 7. November 2026).
//
// Befund im Spiel des Inhabers (scratchpad/spielstand/s2045.json): Nach „Weitere Wiederwahl“ (2033) war die dritte Amtszeit die letzte. Die
// Nachfolgefrage kam am 1. März 2044 und lief ohne Antwort aus; am 1. Juni 2045 brachte er „Keine Begrenzung“ ein, abgestimmt worden wäre
// am 29. Juni, nach der Wahl vom 4. Juni. Die Präsidentin musste abtreten, ohne dass das Spiel deutlich gewarnt hatte.
//
//   amtszeit_letzte  Zu Beginn der letzten Amtszeit, rund 19 und rund 9 Monate vor der Wahl: Verfassung ändern (mit Mehrheit und Dauer als
//                    Zahl, nur solange es vor der Wahl wirken kann), Neuwahl durch das Parlament nach Art. 116 Abs. 3, den Nachfolger
//                    aufbauen (Machtkreis) oder das Abtreten ankündigen.
//
// Die Ankündigung ist ein fester Termin des Amtes (eigener Platz, fester Tag, eigener Wurf): Sie zieht keine Zahl aus dem Strom der Partie.
// Alle Wirkungen sind Spielparameter.

import { t, zahl as zahlFmt } from "../i18n";
import { opt } from "./ereignis-hilfen";
import type { Option, Vorlage } from "./ereignis-hilfen";
import { addDays } from "./dates";
import { vertrauenAendern, wirke } from "./wirkung";
import { AEMTER, loyalitaetVerschieben } from "./personen";
import {
  VERFASSUNG_REGELN,
  amtszeitGrenze,
  bringeVerfassungEin,
  paketFrist,
  paketStimmen,
  pruefeVerfassung,
  verfassungAktiv,
  zusatzKandidaturMoeglich,
} from "./verfassung";
import { machtkreis } from "./machtkreis";
import type { World } from "./types";
import type { OffenesEreignis } from "./spiel-typen";

export const LETZTE = {
  /** Stufe 2 und 3: so viele Tage vor der Wahl (rund 19 und 9 Monate; die Kür des Nachfolgers kommt 18 Monate vorher, sim/amtszeit.ts) */
  stufe2: 570,
  stufe3: 270,
  frist: 30,
  /** Den Nachfolger aufbauen: Druck in der Partei, Loyalität der Anwärter im Kabinett */
  aufbauen: { pk: 1, druck: -20, loyalitaet: 4 },
  /** Das Abtreten ankündigen: Legitimität und Ansehen für den geordneten Übergang, das Kabinett schaut zum Nächsten */
  abtreten: { legitimitaet: 2, ansehen: 1, vertrauen: 0.5, kabinett: -1 },
} as const;

const zahl = (x: number): string => `${x > 0 ? "+" : x < 0 ? "−" : ""}${zahlFmt(Math.abs(x), Number.isInteger(x) ? 0 : 1)}`;

/** Ob die laufende Amtszeit die letzte erlaubte ist. */
export function letzteAmtszeit(w: World): boolean {
  const sp = w.spiel;
  if (!sp || sp.ende) return false;
  const g = amtszeitGrenze(w);
  return Number.isFinite(g) && sp.amtszeit >= g;
}

/** Stufe nach dem Abstand zur Wahl: 1 ab Beginn, 2 ab rund 19 Monaten, 3 ab rund 9 Monaten vorher. */
export function ankuendigungsStufe(w: World): number {
  const tage = (w.spiel?.wahltag ?? w.day) - w.day;
  return tage <= LETZTE.stufe3 ? 3 : tage <= LETZTE.stufe2 ? 2 : 1;
}

/** Die Stufe, die noch nicht angekündigt ist (1 bis 3), sonst 0. Eine neue Amtszeit beginnt von vorn. */
export function offeneAnkuendigung(w: World): number {
  const sp = w.spiel;
  if (!sp || !letzteAmtszeit(w) || sp.wahltag <= w.day) return 0;
  const a = sp.machtkreis?.letzteAnkuendigung;
  const gemeldet = a && a.amtszeit === sp.amtszeit ? a.stufe : 0;
  const s = ankuendigungsStufe(w);
  return s > gemeldet ? s : 0;
}

/** Das Paket, das die Grenze einen Schritt lockert: zwei → drei Amtszeiten, drei → keine Grenze. */
function lockerungsPaket(w: World): Record<string, string> {
  return { amtszeit: verfassungAktiv(w, "amtszeit") === "wiederwahl_plus" ? "unbegrenzt" : "wiederwahl_plus" };
}

const stufeVon = (ev: OffenesEreignis): 1 | 2 | 3 => Math.min(3, Math.max(1, Number(ev.daten?.stufe ?? 1))) as 1 | 2 | 3;

/** Weg über die Verfassung: echtes Einbringen, Preis vom Paket, Mehrheit und Dauer als Zahl; gesperrt, wenn es vor der Wahl nicht mehr wirken kann. */
function verfassungsWeg(w: World, id: "lockern" | "neuwahl", paket: Record<string, string>, label: string, beschreibung: string): Option {
  const pr = pruefeVerfassung(w, paket);
  const f = paketFrist(w, paket);
  const s = paketStimmen(w, paket);
  const r = VERFASSUNG_REGELN;
  const zeilen =
    id === "neuwahl"
      ? [t("welle_e3b.weg.neuwahl.zahlen", { mehrheit: r.mehrheit, tage: f.schnell, erwartet: s.erwartet, tief: s.tief, hoch: s.hoch })]
      : [t("welle_e3b.weg.lockern.zahlen", { mehrheit: r.mehrheit, direkt: r.direkt, tage: f.schnell, referendum: f.referendum, erwartet: s.erwartet, tief: s.tief, hoch: s.hoch })];
  zeilen.push(t("welle_e3b.weg.wahl", { tage: f.tageBisWahl }));
  if (f.nurDirekt) zeilen.push(t("welle_e3b.frist.nurDirekt", { tage: f.tageBisWahl, direkt: r.direkt, referendum: f.referendum }));
  const sperre = f.zuSpaet ? t("welle_e3b.frist.zuSpaet", { tage: f.tageBisWahl, abstimmung: f.schnell }) : !pr.ok ? pr.grund : undefined;
  return {
    ...opt(id, label, beschreibung, 0, (ww) => bringeVerfassungEin(ww, paket).text),
    // Das Kapital bucht bringeVerfassungEin selbst; die Plakette nennt denselben Preis aus derselben Prüfung
    anzeigePk: pr.pk,
    stelle: { art: "verfassung" },
    bedingungen: zeilen,
    ...(sperre ? { sperre } : {}),
  };
}

const LETZTE_AMTSZEIT: Vorlage = {
  id: "amtszeit_letzte",
  eigenerWurf: true,
  eigenerPlatz: true,
  tag: 2,
  szene: "parlament",
  frist: LETZTE.frist,
  abkuehlung: 60,
  chance: (w) => (offeneAnkuendigung(w) > 0 ? 1 : 0),
  erzeuge: (w) => ({ provinzen: [], staerke: 1, daten: { stufe: Math.max(1, offeneAnkuendigung(w) || ankuendigungsStufe(w)) } }),
  eroeffne: (w, ev) => {
    const mk = machtkreis(w);
    const sp = w.spiel!;
    const vorher = mk.letzteAnkuendigung?.amtszeit === sp.amtszeit ? mk.letzteAnkuendigung.stufe : 0;
    mk.letzteAnkuendigung = { amtszeit: sp.amtszeit, stufe: Math.max(vorher, stufeVon(ev)) };
  },
  titel: (w, ev) => t(`welle_e3b.titel.${stufeVon(ev)}`, { monate: Math.max(1, Math.round(((w.spiel?.wahltag ?? w.day) - w.day) / 30)) }),
  text: (w) => {
    const sp = w.spiel!;
    const g = amtszeitGrenze(w);
    return [
      t("welle_e3b.text1", { nr: sp.amtszeit, max: Number.isFinite(g) ? g : 0, datum: addDays(w.date, Math.max(0, sp.wahltag - w.day)) }),
      t(sp.nachfolge?.nachfolger ? "welle_e3b.text2.nachfolger" : "welle_e3b.text2.offen", { name: sp.nachfolge?.nachfolger?.name ?? "" }),
    ];
  },
  warum: () => t("welle_e3b.warum"),
  stelle: () => ({ art: "verfassung" }),
  optionen: (w) => {
    const sp = w.spiel!;
    const out: Option[] = [];
    const lockern = lockerungsPaket(w);
    out.push(verfassungsWeg(w, "lockern", lockern, t(`welle_e3b.weg.lockern.label.${lockern.amtszeit}`), t("welle_e3b.weg.lockern.beschr")));
    // Art. 116 Abs. 3: Neuwahl durch das Parlament, danach noch eine Kandidatur (einmal); nur solange der Beschluss vor der Wahl fällt
    if (zusatzKandidaturMoeglich(w)) out.push(verfassungsWeg(w, "neuwahl", { amtszeit: "neuwahl_jetzt" }, t("welle_e3b.weg.neuwahl.label"), t("welle_e3b.weg.neuwahl.beschr")));
    const a = LETZTE.aufbauen;
    const druck = Math.round(machtkreis(w).nachfolge);
    out.push({
      ...opt("aufbauen", t("welle_e3b.weg.aufbauen.label"), t(sp.nachfolge?.nachfolger ? "welle_e3b.weg.aufbauen.beschr_name" : "welle_e3b.weg.aufbauen.beschr", { name: sp.nachfolge?.nachfolger?.name ?? "" }), a.pk, (ww) => {
        const mk = machtkreis(ww);
        mk.nachfolge = Math.max(0, mk.nachfolge + a.druck);
        const n = ww.spiel!.nachfolge;
        const anwaerter = n?.nachfolger ? [n.nachfolger] : n?.aspiranten ?? [];
        for (const x of anwaerter) {
          const f = ww.spiel!.figuren.find((y) => y.imAmt && y.amt === x.amt);
          if (f) loyalitaetVerschieben(f, a.loyalitaet);
        }
        return t("welle_e3b.weg.aufbauen.aus");
      }),
      stelle: { art: "machtkreis" },
      bedingungen: [t("welle_e3b.weg.aufbauen.zahlen", { vorher: druck, nachher: Math.max(0, druck + a.druck), loy: zahl(a.loyalitaet) })],
    });
    const ab = LETZTE.abtreten;
    out.push({
      ...opt("abtreten", t("welle_e3b.weg.abtreten.label"), t("welle_e3b.weg.abtreten.beschr"), 0, (ww) => {
        wirke(ww, "legitimitaet", ab.legitimitaet);
        wirke(ww, "ansehen", ab.ansehen);
        vertrauenAendern(ww, ab.vertrauen);
        for (const f of ww.spiel!.figuren) if (f.imAmt && AEMTER[f.amt]?.regierungsamt && f.amt !== "partner") loyalitaetVerschieben(f, ab.kabinett);
        return t("welle_e3b.weg.abtreten.aus");
      }),
      bedingungen: [t("welle_e3b.weg.abtreten.zahlen", { leg: zahl(ab.legitimitaet), ansehen: zahl(ab.ansehen), vertrauen: zahl(ab.vertrauen), kabinett: zahl(ab.kabinett) })],
    });
    out.push(opt("spaeter", t("welle_e3b.weg.spaeter.label"), t("welle_e3b.weg.spaeter.beschr"), 0, () => t("welle_e3b.weg.spaeter.aus")));
    return out;
  },
  standard: () => t("welle_e3b.weg.spaeter.aus"),
};

export const LETZTE_VORLAGEN: Vorlage[] = [LETZTE_AMTSZEIT];
