// Die Verlängerung der Vollmacht für Syrien und Irak (Welle 4, K7; krieg.md Schritt 11, Befund B7).
//
//   vollmacht_verlaengerung  Termin im Oktober des Jahres, in dem die Vollmacht ausläuft (zuerst am 30.10.2028), wenn etwas auf dem Spiel
//                            steht: Die Mehrheit wackelt, oder es läuft ein Konflikt mit Syrien oder dem Irak. Der Präsident legt sie für
//                            drei oder für ein Jahr vor, mit oder ohne Zusage an eine Fraktion, oder lässt sie auslaufen.
//
// Sonst ist die Verlängerung Routine, wie in der Wirklichkeit seit 2014: Die Regierung legt am 21. Oktober vor, was der Plan sagt (drei Jahre
// wie 2025, ein Jahr oder auslaufen lassen; einstellbar in der Kriegsakte), und das Ergebnis steht als Hinweis und in der Zeitung. So kommt
// keine Akte ohne Entscheidung auf den Schreibtisch („wenige echte Entscheidungen mit Einsatz“).
//
// Vorbild: Die TBMM tritt am 1. Oktober wieder zusammen und stimmte über die Vollmacht am 08.10.2019, 07.10.2020, 26.10.2021, 17.10.2023 und
// 21.10.2025 ab (recherche_operationen.md C; Tutanak 21.10.2025). Der Termin öffnet am 5. Oktober mit 15 Tagen Frist (Spielparameter), so
// liegt die Abstimmung vor dem 30. Oktober. Die Fraktionen stimmen nach ihren belegten Haltungen (sim/mandat.ts). Läuft die Vollmacht aus,
// braucht ein Einsatz in Syrien oder im Irak wieder ein eigenes Mandat. Ein gescheiterter Antrag kostet wie jeder gescheiterte (Vorbild
// 1. März 2003) und sperrt einen neuen Antrag für beide Länder.
//
// Eigener Wurf, eigener Platz, fester Tag: Die Vorlage zieht keine Zahl aus dem Strom der Partie. Sie steht in den festen Terminen des
// Staatsjahres (sim/ereignisse.ts, TERMINE). Wirkungen beim Auslaufen sind Spielparameter.

import { t } from "../i18n";
import { addDays } from "./dates";
import { opt } from "./ereignis-hilfen";
import type { Option, Vorlage } from "./ereignis-hilfen";
import { wirke, vertrauenAendern } from "./wirkung";
import { MANDAT, haltungsSatz, hashAbweichung, mandatAbstimmen, mandatSicht, zusageAngebote, zusageBuchen, zusageSinnvoll, type MandatAnlass, type MandatSicht } from "./mandat";
import { VOLLMACHT_LAENDER, vollmachtFestschreiben, vollmachtStand, vollmachtVerlaengert } from "./krieg-recht";
import type { OffenesEreignis } from "./spiel-typen";
import type { World } from "./types";

export const VOLLMACHT_TERMIN = {
  tag: 5,
  frist: 15,
  /** Auslaufen lassen: Offiziere und Nationalisten sind enttäuscht, Minderheiten erleichtert (Spielparameter) */
  auslaufen: { offiziere: -2, nationalisten: -1, minderheiten: 1 },
} as const;

/** Ob in diesem Monat über die Vollmacht zu entscheiden ist: Oktober des Jahres, in dem sie ausläuft, und noch nicht entschieden. */
export function verlaengerungFaellig(w: World): boolean {
  if (!w.spiel || w.spiel.ende) return false;
  const s = vollmachtStand(w);
  return w.date.slice(5, 7) === "10" && s.bis.slice(0, 4) === w.date.slice(0, 4) && w.date <= s.bis && s.entschieden !== s.bis;
}

/** Ob die Verlängerung eine Entscheidung verdient: Die Mehrheit für den Plan wackelt, oder ein Konflikt mit Syrien oder dem Irak läuft. */
export function verlaengerungStrittig(w: World): boolean {
  const s = vollmachtStand(w);
  const jahre = s.plan ?? 3;
  if (jahre > 0 && zusageSinnvoll(mandatSicht(w, { art: "verlaengerung", jahre }))) return true;
  return (w.spiel?.kriege ?? []).some((k) => VOLLMACHT_LAENDER.includes(k.land) && k.phase !== "beendet");
}

/** Der Plan der Regierung für den Oktober (Kriegsakte): drei Jahre, ein Jahr oder auslaufen lassen. */
export function vollmachtPlanSetzen(w: World, plan: 0 | 1 | 3): void {
  vollmachtFestschreiben(w);
  if (w.spiel?.vollmacht) w.spiel.vollmacht.plan = plan;
}

/** Routine am 21. Oktober: Liegt keine Entscheidung vor und kein Termin offen, legt die Regierung vor, was der Plan sagt. */
export function vollmachtRoutineTag(w: World): void {
  const sp = w.spiel;
  if (!sp || sp.ende || !verlaengerungFaellig(w) || w.date.slice(8, 10) < "21") return;
  if (sp.ereignisse.some((e) => e.vorlage === "vollmacht_verlaengerung")) return;
  const plan = vollmachtStand(w).plan ?? 3;
  const text = plan === 0 ? auslaufen(w, false) : abstimmenUndBuchen(w, { art: "verlaengerung", jahre: plan });
  sp.hinweise.push({ id: `vollmacht-${w.date}`, titel: t("welle_k7.v.titel_routine"), szene: "parlament", text: [text] });
}

/** Ein Satz mit der erwarteten Abstimmung für die Antwortkarte (dieselbe Rechnung wie die Buchung). */
function erwartung(m: MandatSicht): string {
  return t("welle_k7.v.erwartet", { ja: m.ja, nein: m.nein, enth: m.enthaltung, noetig: m.noetig, band: m.band });
}

/** Stimmt ab und bucht: verlängert oder lässt mit den Folgen des Scheiterns auslaufen. */
function abstimmenUndBuchen(w: World, anlass: MandatAnlass & { art: "verlaengerung" }): string {
  vollmachtFestschreiben(w);
  const sp = w.spiel!;
  const v = sp.vollmacht!;
  const m = mandatAbstimmen(w, anlass, hashAbweichung(w, `verlaengerung|${anlass.jahre}`));
  const alt = v.bis;
  v.entschieden = alt;
  v.verlauf.push({ datum: w.date, jahre: anlass.jahre, ja: m.ja, nein: m.nein, enthaltung: m.enthaltung, angenommen: m.angenommen });
  const haltung = haltungsSatz(m);
  if (m.angenommen) {
    v.bis = vollmachtVerlaengert(alt, anlass.jahre);
    sp.chronik.push({ tag: w.day, datum: w.date, titel: t("welle_k7.v.chronik.ja", { ja: m.ja, nein: m.nein }), ausgang: haltung, art: "bericht", presse: { sparte: "politik", wertung: 0.1 } });
    return t("welle_k7.v.aus.ja", { ja: m.ja, nein: m.nein, enth: m.enthaltung, jahre: anlass.jahre, bis: v.bis, haltung });
  }
  const f = MANDAT.scheitern;
  vertrauenAendern(w, f.vertrauen);
  sp.umfrage.zustimmung = Math.max(0, sp.umfrage.zustimmung + f.zustimmung);
  wirke(w, "ansehen", f.ansehen);
  wirke(w, "offiziersvertrauen", f.offiziere);
  w.economy.riskPremium += f.risiko;
  const sperre = sp.mandatSperre ??= {};
  for (const l of VOLLMACHT_LAENDER) sperre[l] = Math.max(sperre[l] ?? 0, w.day + f.sperreTage);
  sp.chronik.push({ tag: w.day, datum: w.date, titel: t("welle_k7.v.chronik.nein", { ja: m.ja, noetig: m.noetig }), ausgang: haltung, art: "bericht", presse: { sparte: "politik", wertung: -0.7 } });
  return t("welle_k7.v.aus.nein", { ja: m.ja, nein: m.nein, enth: m.enthaltung, noetig: m.noetig, bis: alt, datum: addDays(w.date, f.sperreTage), haltung });
}

function auslaufen(w: World, ohneAntrag: boolean): string {
  vollmachtFestschreiben(w);
  const v = w.spiel!.vollmacht!;
  v.entschieden = v.bis;
  const a = VOLLMACHT_TERMIN.auslaufen;
  wirke(w, "offiziersvertrauen", a.offiziere);
  wirke(w, "nationalisten", a.nationalisten);
  wirke(w, "minderheiten", a.minderheiten);
  return t(ohneAntrag ? "welle_k7.v.aus.liegen" : "welle_k7.v.aus.auslaufen", { bis: v.bis });
}

const VOLLMACHT_VERLAENGERUNG: Vorlage = {
  id: "vollmacht_verlaengerung",
  eigenerWurf: true,
  eigenerPlatz: true,
  tag: VOLLMACHT_TERMIN.tag,
  szene: "parlament",
  frist: VOLLMACHT_TERMIN.frist,
  abkuehlung: 300,
  wettbewerb: "aussitzen",
  chance: (w) => (verlaengerungFaellig(w) && verlaengerungStrittig(w) ? 1 : 0),
  erzeuge: (w) => ({ provinzen: [], staerke: 1, daten: { bis: vollmachtStand(w).bis, jahre: 3 } }),
  titel: () => t("welle_k7.v.titel"),
  text: (w, ev) => {
    const s = vollmachtStand(w);
    const letzte = s.verlauf.at(-1);
    return [
      t("welle_k7.v.text1"),
      t("welle_k7.v.text1b", { bis: String(ev.daten?.bis ?? s.bis) }),
      letzte ? t("welle_k7.v.text2.letzte", { datum: letzte.datum, ja: letzte.ja, nein: letzte.nein }) : t("welle_k7.v.text2.start"),
      t("welle_k7.v.text3", { plan: t(`welle_k7.plan.${s.plan ?? 3}`) }),
    ];
  },
  warum: () => t("welle_k7.v.warum"),
  stelle: () => ({ art: "welt", land: "SYR" }),
  optionen: (w) => {
    const out: Option[] = [];
    for (const jahre of [3, 1]) {
      const m = mandatSicht(w, { art: "verlaengerung", jahre });
      out.push({
        ...opt(`jahre_${jahre}`, t(`welle_k7.v.opt.jahre_${jahre}.label`), t(`welle_k7.v.opt.jahre_${jahre}.beschr`), 0, (ww) => abstimmenUndBuchen(ww, { art: "verlaengerung", jahre })),
        stelle: { art: "welt", land: "SYR" },
        bedingungen: [erwartung(m), haltungsSatz(m)],
        ...(m.angenommen ? {} : { warnung: t("welle_k7.v.warnung", { fehlen: m.noetig - m.ja }) }),
      });
    }
    // Eine Zusage an die Fraktion, die die meisten Stimmen bringt (CHP stimmte 2015 bis 2020 unter Bedingungen zu; sim/mandat.ts)
    const a = zusageSinnvoll(mandatSicht(w, { art: "verlaengerung", jahre: 3 })) ? zusageAngebote(w, { art: "verlaengerung", jahre: 3 })[0] : undefined;
    if (a) {
      const m = mandatSicht(w, { art: "verlaengerung", jahre: 3, zusagen: [a.partei] });
      out.push({
        ...opt("zusage", t("welle_k7.v.opt.zusage.label", { partei: a.name }), t("welle_k7.v.opt.zusage.beschr", { partei: a.name, forderung: a.forderung, tage: MANDAT.zusageTage }), a.pk, (ww) => {
          zusageBuchen(ww, a, t("welle_k7.zusage.worum.vollmacht"), true);
          return abstimmenUndBuchen(ww, { art: "verlaengerung", jahre: 3, zusagen: [a.partei] });
        }),
        stelle: { art: "welt", land: "SYR" },
        bedingungen: [erwartung(m), t("welle_k7.v.zusage_stimmen", { partei: a.name, stimmen: a.stimmen })],
      });
    }
    // Die Folgen (Offiziere, Nationalisten, Minderheiten) zeigt das Ereignisfenster aus der Buchung auf einer Kopie
    out.push(opt("auslaufen", t("welle_k7.v.opt.auslaufen.label"), t("welle_k7.v.opt.auslaufen.beschr"), 0, (ww) => auslaufen(ww, false)));
    return out;
  },
  // Ohne Antwort legt die Regierung vor, was der Plan sagt (Routine seit 2014)
  standard: (w) => {
    const plan = vollmachtStand(w).plan ?? 3;
    return plan === 0 ? auslaufen(w, true) : abstimmenUndBuchen(w, { art: "verlaengerung", jahre: plan });
  },
};

export const MANDAT_VORLAGEN: Vorlage[] = [VOLLMACHT_VERLAENGERUNG];
