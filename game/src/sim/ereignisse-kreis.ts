// Der Machtkreis meldet sich auf dem Schreibtisch (Welle E3, 7. November 2026).
//
// Befund im Spielstand des Inhabers (dokumentation/analyse_2026-11-05/bereiche/machtkreis_dienst.md): 15 Jahre, kein Hebel gezogen, der
// Nachfolgedruck lag 36 Monate über 60 und stand bei 89, ohne dass je etwas kam; das Ergebnis einer Überprüfung stand nur als Zeile im
// Machtkreis. Zwei Vorgänge:
//
//   kreis_befund           Der Dienst hat bei einer Überprüfung etwas gefunden: nutzen (Druckmittel), opfern oder decken.
//   kreis_nachfolge_stufe  Der Nachfolgedruck überschreitet 60, 80 oder 95: Der Kronprinz sammelt Unterstützer, spricht offen oder sammelt
//                          Unterschriften für einen außerordentlichen Parteitag. Jede Karte nennt den Termin des nächsten Parteitags.
//
// Beide würfeln aus Samen, Vorlage und Tag (eigenerWurf) und konkurrieren ohne Zusatzplatz. Jede Zahl, die eine Antwort nennt, ist die Zahl,
// die sie bucht. Alle Größen sind Spielparameter; der Rechtsrahmen des Parteitags steht in sim/machtkreis.ts (NACHFOLGE_STUFEN).

import { t, zahl as zahlFmt } from "../i18n";
import { opt } from "./ereignis-hilfen";
import type { Option, Vorlage } from "./ereignis-hilfen";
import { vertrauenAendern } from "./wirkung";
import { AEMTER, eigenVon, grollVerschieben, loyalitaetVerschieben } from "./personen";
import { ausscheiden } from "./nachfolge";
import { addDays } from "./dates";
import {
  NACHFOLGE_STUFEN,
  machtkreis,
  macheOeffentlich,
  nachfolgeStufe,
  nebenVon,
  ordentlicherParteitag,
  parteitagTermin,
  personVon,
  personen,
  rolleText,
  schluesselVon,
  setzeAusserordentlichenParteitag,
  zeigeSzene,
  type Geheimnis,
  type Person,
} from "./machtkreis";
import { NACHFOLGE_WIRKUNG, nachfolgeAntworten } from "./ereignisse-machtkreis";
import { msg } from "../i18n";
import type { World } from "./types";
import type { OffenesEreignis } from "./spiel-typen";

// ---------------------------------------------------------------------------
// Spielparameter

export const KREIS = {
  befund: {
    frist: 20,
    /** Ein Befund, der so lange nicht auf den Tisch kam, verfällt (Tage) */
    verfall: 365,
    /** Druckmittel: Loyalität gesichert, aber Groll wächst (und mit ihm die Gefahr, dass die Presse es erfährt, sim/machtkreis.ts) */
    nutzen: { pk: 1, loyalitaet: 25, groll: 15, angst: 3 },
    /** Opfern: Rücktritt oder Ausschluss; Vertrauen je Schwere des Geheimnisses, die übrigen sehen: niemand ist sicher */
    opfern: { pk: 2, vertrauenJeSchwere: 0.5, andere: -1.5, nachfolge: -20 },
    /** Decken: Ruhe und Dankbarkeit; das Geheimnis bleibt, wo es ist */
    decken: { pk: 1, loyalitaet: 10, groll: -15 },
    /** Liegenlassen: Die Person erfährt von der Überprüfung */
    liegen: { groll: 10 },
  },
  stufe: {
    frist: 25,
    abkuehlung: 60,
    /** Ohne Antwort: Der Kronprinz gewinnt Einfluss, der Druck wächst, das Vertrauen leidet leicht */
    liegen: { druck: 5, einfluss: 5, vertrauen: -0.3 },
  },
} as const;

const im = (w: World): boolean => !!w.spiel;
const p = (w: World, ev: OffenesEreignis): Person | undefined => personVon(w, String(ev.daten?.a ?? ""));
const nm = (x: Person | undefined): string => (x ? x.name : t("mk.jemand"));
const tage = (n: number): number => Math.max(0, Math.round(n));
/** Vorzeichen und Zahl in der Sprache des Spiels (+1,5 / −0,3). */
const zahl = (x: number): string => `${x > 0 ? "+" : x < 0 ? "−" : ""}${zahlFmt(Math.abs(x), Number.isInteger(x) ? 0 : 1)}`;

function loy(x: Person | undefined, d: number): void {
  if (!x) return;
  if (x.figur) loyalitaetVerschieben(x.figur, d);
  else if (x.neben) x.neben.loyalitaet = Math.max(0, Math.min(100, x.neben.loyalitaet + d));
}
function groll(w: World, x: Person | undefined, d: number): void {
  if (!x) return;
  if (x.figur) grollVerschieben(w, x.figur, d);
  else if (x.neben) x.neben.loyalitaet = Math.max(0, Math.min(100, x.neben.loyalitaet - d * 0.3));
}
const zumKreis = (ev: OffenesEreignis): NonNullable<Option["stelle"]> => ({ art: "machtkreis", ...(ev.daten?.a ? { person: String(ev.daten.a) } : {}) });

// ---------------------------------------------------------------------------
// Befund einer Überprüfung

/** Der älteste Befund, dessen Person und Geheimnis es noch gibt (ältere verfallen). */
export function offenerBefund(w: World): { person: string; geheimnis: Geheimnis } | undefined {
  const mk = w.spiel?.machtkreis;
  if (!mk?.befunde?.length) return undefined;
  for (const b of mk.befunde.filter((x) => w.day - x.tag <= KREIS.befund.verfall)) {
    const g = mk.geheimnisse.find((x) => x.id === b.geheimnis);
    if (g && !g.oeffentlich && personVon(w, b.person)) return { person: b.person, geheimnis: g };
  }
  return undefined;
}

const geheimnisVon = (w: World, ev: OffenesEreignis): Geheimnis | undefined => machtkreis(w).geheimnisse.find((g) => g.id === ev.daten?.g);

/** Ob die Person ein Amt hat, aus dem sie zurücktreten kann, oder als Nebenfigur aus der Partei gedrängt wird. */
function kannOpfern(x: Person | undefined): boolean {
  if (!x) return false;
  if (x.figur) return !!AEMTER[x.figur.amt]?.regierungsamt && !eigenVon0(x);
  return x.neben?.art === "kronprinz" || x.neben?.art === "fraktionschef";
}
const eigenVon0 = (x: Person): boolean => !!x.figur?.eigen?.kommissarisch;

const BEFUND: Vorlage = {
  id: "kreis_befund",
  eigenerWurf: true,
  ohneZusatzplatz: true,
  szene: "istanbul",
  frist: KREIS.befund.frist,
  abkuehlung: 20,
  chance: (w) => (im(w) && offenerBefund(w) ? 1 : 0),
  erzeuge: (w) => {
    const b = offenerBefund(w);
    if (b) return { provinzen: [], staerke: b.geheimnis.schwere, daten: { a: b.person, g: b.geheimnis.id } };
    // Ohne laufenden Befund (Textprüfung, Wächter gegen Schau): ein unaufgedecktes Geheimnis einer Person im Amt
    const g = machtkreis(w).geheimnisse.find((x) => !x.oeffentlich && x.art !== "putschzirkel" && personVon(w, x.person)?.figur);
    return g ? { provinzen: [], staerke: g.schwere, daten: { a: g.person, g: g.id } } : null;
  },
  eroeffne: (w, ev) => {
    const mk = machtkreis(w);
    mk.befunde = (mk.befunde ?? []).filter((b) => b.geheimnis !== ev.daten?.g);
  },
  titel: (w, ev) => t("welle_e3.befund.titel", { name: nm(p(w, ev)) }),
  text: (w, ev) => {
    const x = p(w, ev);
    const g = geheimnisVon(w, ev);
    return [
      t("welle_e3.befund.text1", { name: nm(x), rolle: x ? rolleText(x) : "", art: g ? t(`mk.geheimnis.${g.art}`) : "", schwere: g?.schwere ?? 1 }),
      t("welle_e3.befund.text2", { loy: Math.round(x?.loyalitaet ?? 0) }),
    ];
  },
  warum: () => t("welle_e3.befund.warum"),
  stelle: (_w, ev) => zumKreis(ev),
  optionen: (w, ev) => {
    const q = KREIS.befund;
    const x = p(w, ev);
    const g = geheimnisVon(w, ev);
    const schwere = g?.schwere ?? 1;
    const vertrauen = Math.round(q.opfern.vertrauenJeSchwere * schwere * 10) / 10;
    const opfern: Option = {
      ...opt("opfern", t(x?.neben ? "welle_e3.befund.opfern.label_partei" : "welle_e3.befund.opfern.label"), t(x?.neben ? "welle_e3.befund.opfern.beschr_partei" : "welle_e3.befund.opfern.beschr", { name: nm(x) }), q.opfern.pk, (ww, e) => {
        const y = p(ww, e);
        const gg = geheimnisVon(ww, e);
        if (gg) macheOeffentlich(ww, gg);
        if (y?.figur) ausscheiden(ww, y.figur, t("mk.grund.bauernopferGrund"));
        else if (y?.neben) {
          y.neben.status = "kaltgestellt";
          y.neben.bis = ww.day + 540;
          if (y.neben.art === "kronprinz") machtkreis(ww).nachfolge = Math.max(0, machtkreis(ww).nachfolge + q.opfern.nachfolge);
        }
        vertrauenAendern(ww, vertrauen);
        for (const z of personen(ww)) if (z.figur && z.schluessel !== y?.schluessel && AEMTER[z.figur.amt]?.regierungsamt) loyalitaetVerschieben(z.figur, q.opfern.andere);
        zeigeSzene(ww, "bauernopfer", msg("mk.szene.bauernopfer", { name: nm(y), rolle: y ? rolleText(y) : "" }), [y?.schluessel ?? ""], t("mk.stempel.bauernopfer"));
        return t("welle_e3.befund.opfern.aus", { name: nm(y) });
      }),
      stelle: zumKreis(ev),
      bedingungen: [t("welle_e3.befund.opfern.zahlen", { vertrauen: zahl(vertrauen), andere: zahl(q.opfern.andere) }), ...(x?.neben?.art === "kronprinz" ? [t("welle_e3.befund.opfern.kronprinz", { druck: zahl(q.opfern.nachfolge) })] : [])],
      ...(kannOpfern(x) ? {} : { sperre: t("welle_e3.befund.opfern.sperre") }),
    };
    return [
      {
        ...opt("nutzen", t("welle_e3.befund.nutzen.label"), t("welle_e3.befund.nutzen.beschr", { name: nm(x) }), q.nutzen.pk, (ww, e) => {
          const y = p(ww, e);
          loy(y, q.nutzen.loyalitaet);
          groll(ww, y, q.nutzen.groll);
          const mk = machtkreis(ww);
          mk.angst = Math.min(100, mk.angst + q.nutzen.angst);
          zeigeSzene(ww, "druck", msg("mk.szene.druck", { name: nm(y) }), [y?.schluessel ?? ""], t("mk.stempel.druck"));
          return t("welle_e3.befund.nutzen.aus", { name: nm(y) });
        }),
        stelle: zumKreis(ev),
        bedingungen: [t("welle_e3.befund.nutzen.zahlen", { loy: zahl(q.nutzen.loyalitaet), groll: zahl(q.nutzen.groll), angst: zahl(q.nutzen.angst) })],
      },
      opfern,
      {
        ...opt("decken", t("welle_e3.befund.decken.label"), t("welle_e3.befund.decken.beschr", { name: nm(x) }), q.decken.pk, (ww, e) => {
          const y = p(ww, e);
          loy(y, q.decken.loyalitaet);
          groll(ww, y, q.decken.groll);
          return t("welle_e3.befund.decken.aus", { name: nm(y) });
        }),
        stelle: zumKreis(ev),
        bedingungen: [t("welle_e3.befund.decken.zahlen", { loy: zahl(q.decken.loyalitaet), groll: zahl(q.decken.groll) })],
      },
      { ...opt("abwarten", t("welle_e3.befund.abwarten.label"), t("welle_e3.befund.abwarten.beschr", { name: nm(x) }), 0, (ww, e) => befundLiegen(ww, e)), stelle: zumKreis(ev), bedingungen: [t("welle_e3.befund.abwarten.zahlen", { groll: zahl(q.liegen.groll) })] },
    ];
  },
  standard: (w, ev) => befundLiegen(w, ev),
};

function befundLiegen(w: World, ev: OffenesEreignis): string {
  const y = p(w, ev);
  groll(w, y, KREIS.befund.liegen.groll);
  return t("welle_e3.befund.abwarten.aus", { name: nm(y) });
}

// ---------------------------------------------------------------------------
// Stufen des Nachfolgedrucks

/** Die Stufe, die noch nicht gemeldet ist (1 bis 3), sonst 0. */
export function offeneStufe(w: World): number {
  const mk = w.spiel?.machtkreis;
  if (!mk) return 0;
  const kp = mk.neben.find((n) => n.art === "kronprinz");
  if (!kp || kp.status !== "aktiv") return 0;
  const s = nachfolgeStufe(mk.nachfolge);
  return s > (mk.nachfolgeStufe ?? 0) ? s : 0;
}

const stufeVon = (ev: OffenesEreignis): 1 | 2 | 3 => Math.min(3, Math.max(1, Number(ev.daten?.stufe ?? 1))) as 1 | 2 | 3;

/** Termin des Parteitags in Worten (Datum, Tage), mit dem Weg, auf dem er zustande kommt. */
function terminText(w: World, stufe: 1 | 2 | 3): string {
  const termin = parteitagTermin(w);
  if (stufe === 3 && !termin.ausserordentlich) {
    const tag = Math.min(ordentlicherParteitag(w), w.day + NACHFOLGE_STUFEN.ausserordentlichTage);
    return t("welle_e3.stufe.termin.drohend", { tage: tage(tag - w.day), datum: addDays(w.date, tag - w.day) });
  }
  const n = tage(termin.tag - w.day);
  return t(termin.ausserordentlich ? "welle_e3.stufe.termin.ausserordentlich" : "welle_e3.stufe.termin.ordentlich", { tage: n, monate: Math.max(1, Math.round(n / 30)), datum: addDays(w.date, n) });
}

const STUFE: Vorlage = {
  id: "kreis_nachfolge_stufe",
  eigenerWurf: true,
  ohneZusatzplatz: true,
  szene: "parlament",
  frist: KREIS.stufe.frist,
  abkuehlung: KREIS.stufe.abkuehlung,
  chance: (w) => (offeneStufe(w) > 0 ? 1 : 0),
  erzeuge: (w) => {
    const kp = nebenVon(w, "kronprinz");
    if (!kp) return null;
    return { provinzen: [], staerke: 1, daten: { a: schluesselVon(kp), stufe: Math.max(1, offeneStufe(w)) } };
  },
  eroeffne: (w, ev) => {
    const mk = machtkreis(w);
    mk.nachfolgeStufe = Math.max(mk.nachfolgeStufe ?? 0, stufeVon(ev));
  },
  titel: (w, ev) => t(`welle_e3.stufe.titel.${stufeVon(ev)}`, { name: nm(p(w, ev)) }),
  text: (w, ev) => [t(`welle_e3.stufe.text1.${stufeVon(ev)}`, { name: nm(p(w, ev)), druck: Math.round(machtkreis(w).nachfolge), schwelle: NACHFOLGE_STUFEN.stufen[stufeVon(ev) - 1]! }), terminText(w, stufeVon(ev))],
  warum: (w) => t("welle_e3.stufe.warum", { druck: Math.round(machtkreis(w).nachfolge), kampf: NACHFOLGE_STUFEN.kampfAb }),
  stelle: (_w, ev) => zumKreis(ev),
  optionen: (w, ev) => {
    const druck = machtkreis(w).nachfolge;
    const zeile = (id: keyof typeof NACHFOLGE_WIRKUNG): string => {
      const q = NACHFOLGE_WIRKUNG[id];
      return t("welle_e3.stufe.zahlen", { vorher: Math.round(druck), nachher: Math.round(Math.max(0, druck + q.druck)), loy: zahl(q.loyalitaet), kampf: NACHFOLGE_STUFEN.kampfAb });
    };
    const antworten = nachfolgeAntworten(w, ev).map((o): Option => ({ ...o, stelle: zumKreis(ev), bedingungen: [zeile(o.id as keyof typeof NACHFOLGE_WIRKUNG)] }));
    const q = KREIS.stufe.liegen;
    antworten.push({
      ...opt("abwarten", t("welle_e3.stufe.abwarten.label"), t(`welle_e3.stufe.abwarten.beschr.${stufeVon(ev)}`, { name: nm(p(w, ev)) }), 0, (ww, e) => stufeLiegen(ww, e)),
      stelle: zumKreis(ev),
      bedingungen: [t("welle_e3.stufe.abwarten.zahlen", { vorher: Math.round(druck), nachher: Math.round(Math.min(100, druck + q.druck)), vertrauen: zahl(q.vertrauen) })],
    });
    return antworten;
  },
  standard: (w, ev) => stufeLiegen(w, ev),
};

/** Ohne Antwort wächst der Kronprinz; auf der dritten Stufe reicht er die Unterschriften ein und der außerordentliche Parteitag steht. */
function stufeLiegen(w: World, ev: OffenesEreignis): string {
  const q = KREIS.stufe.liegen;
  const mk = machtkreis(w);
  const x = p(w, ev);
  mk.nachfolge = Math.min(100, mk.nachfolge + q.druck);
  if (x?.neben) x.neben.einfluss = Math.min(100, x.neben.einfluss + q.einfluss);
  vertrauenAendern(w, q.vertrauen);
  if (stufeVon(ev) === 3) {
    const tag = setzeAusserordentlichenParteitag(w);
    return t("welle_e3.stufe.abwarten.aus3", { name: nm(x), tage: tage(tag - w.day) });
  }
  return t("welle_e3.stufe.abwarten.aus", { name: nm(x) });
}

export const KREIS_VORLAGEN: Vorlage[] = [BEFUND, STUFE];
