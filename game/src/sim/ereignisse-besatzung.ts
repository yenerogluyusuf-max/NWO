// Die Stellvertreterverwaltung kann einen Skandal auslösen (Welle 3, K5; krieg.md Schritt 8, Abnahme).
//
// Vorbild: Nordsyrien unter der Syrischen Nationalarmee. HRW, „Everything Is by the Power of the Weapon“ (29.02.2024): Entführungen mit
// Lösegeld von 100 bis 30.000 US-$ in 23 Fällen, Abgaben bis zu 50 % der Ernte, Eigentumsentzug; die Türkei „trägt Verantwortung“ als
// Besatzungsmacht. Amnesty International (02.08.2018): „Turkey is the occupying power in Afrin“, mindestens 86 Fälle willkürlicher Haft.
// UN-Untersuchungskommission zu Syrien: Plünderung kurdischen Eigentums in Afrin „in koordinierter Weise“. Die Türkei wies die Vorwürfe
// zurück (The New Arab, https://www.newarab.com/news/turkey-rejects-accusations-it-committed-abuses-syria). Alles in recherche_besatzung.md A.2.
//
// Pflichten (WELLE12): eigener Wurf, kein Zusatzplatz, eigene Datei, registriert an einer Stelle in sim/ereignisse.ts. Jede Zeile unter einer
// Antwort entsteht aus denselben Zahlen, die die Antwort bucht (SKANDAL unten). Schwellen, Häufigkeit und Wirkungen sind Spielparameter.

import { t, zahl } from "../i18n";
import { FORM } from "../data/besatzung";
import { opt } from "./ereignis-hilfen";
import type { Option, Vorlage } from "./ereignis-hilfen";
import type { OffenesEreignis } from "./spiel-typen";
import type { BesatzungsGebiet } from "./krieg-typen";
import { aendereBesatzung, besatzungLesen, mitStellvertretern } from "./besatzung";
import { landAendern } from "./laender";
import { wirke } from "./wirkung";
import type { World } from "./types";

/** Spielparameter des Skandals. */
export const SKANDAL = {
  /** Frühestens so viele Tage nach Beginn der Stellvertreterverwaltung */
  abTagen: 90,
  /** Chance je Monat und Zone mit Stellvertretern, höchstens `chanceMax` */
  chance: 0.06,
  chanceMax: 0.2,
  frist: 14,
  abkuehlung: 240,
  /** Untersuchen und die Fraktion abziehen: Kapital, Ansehen, Widerstand, Nationalisten */
  untersuchen: { pk: 4, ansehen: 1, widerstand: -6, nationalisten: -1 },
  /** Bestreiten: wie die Türkei 2024; Ansehen, Konflikt mit der EU, Widerstand */
  bestreiten: { ansehen: -2, euKonflikt: 3, widerstand: 4 },
  /** Schweigen: etwas weniger als Bestreiten, der Bericht wirkt trotzdem */
  schweigen: { ansehen: -1.5, widerstand: 4 },
};

const zonen = (w: World): BesatzungsGebiet[] => besatzungLesen(w).filter((b) => mitStellvertretern(b) && w.day - (b.formSeit ?? b.seit) >= SKANDAL.abTagen);

/** Die Zone mit dem höchsten Widerstand (deterministisch; bei Gleichstand die zuerst besetzte). */
function zoneFuer(w: World): BesatzungsGebiet | undefined {
  return [...zonen(w)].sort((a, b) => b.widerstand - a.widerstand || a.seit - b.seit)[0];
}

const regionVon = (ev: OffenesEreignis): string => String(ev.daten?.region ?? "");
const gebiet = (w: World, ev: OffenesEreignis): BesatzungsGebiet | undefined => besatzungLesen(w).find((b) => b.region === regionVon(ev));
const nameVon = (ev: OffenesEreignis): string => t(`krieg.region.${regionVon(ev)}`);

function widerstandAendern(w: World, ev: OffenesEreignis, d: number): void {
  const b = gebiet(w, ev);
  if (b) b.widerstand = Math.round(Math.min(100, Math.max(0, b.widerstand + d)) * 10) / 10;
}

const vzs = (x: number): string => (x > 0 ? "+" : "−") + zahl(Math.abs(x));
const zeilen = (x: { ansehen?: number; widerstand?: number; nationalisten?: number; euKonflikt?: number }): string[] => {
  const out: string[] = [];
  if (x.ansehen) out.push(t("welle_k5.skandal.zeile.ansehen", { d: vzs(x.ansehen) }));
  if (x.widerstand) out.push(t("welle_k5.skandal.zeile.widerstand", { d: vzs(x.widerstand) }));
  if (x.nationalisten) out.push(t("welle_k5.skandal.zeile.nationalisten", { d: vzs(x.nationalisten) }));
  if (x.euKonflikt) out.push(t("welle_k5.skandal.zeile.eu", { d: vzs(x.euKonflikt) }));
  return out;
};

function schweigen(w: World, ev: OffenesEreignis): string {
  const s = SKANDAL.schweigen;
  wirke(w, "ansehen", s.ansehen);
  widerstandAendern(w, ev, s.widerstand);
  return t("welle_k5.skandal.standard", { region: nameVon(ev) });
}

const STELLVERTRETER_SKANDAL: Vorlage = {
  id: "besatzung_skandal",
  eigenerWurf: true,
  ohneZusatzplatz: true,
  szene: "istanbul",
  frist: SKANDAL.frist,
  abkuehlung: SKANDAL.abkuehlung,
  chance: (w) => Math.min(SKANDAL.chanceMax, SKANDAL.chance * zonen(w).length),
  erzeuge: (w) => {
    const b = zoneFuer(w);
    if (!b) return null;
    return { provinzen: [], staerke: 1, daten: { region: b.region, land: b.land, monate: Math.max(1, Math.round((w.day - (b.formSeit ?? b.seit)) / 30)) } };
  },
  titel: (_, ev) => t("welle_k5.skandal.titel", { region: nameVon(ev) }),
  text: (w, ev) => [
    t("welle_k5.skandal.text1", { region: nameVon(ev), monate: Number(ev.daten?.monate ?? 1) }),
    t("welle_k5.skandal.text2", { widerstand: Math.round(gebiet(w, ev)?.widerstand ?? 0) }),
  ],
  warum: () => t("welle_k5.skandal.warum"),
  stelle: (_, ev) => ({ art: "welt", land: String(ev.daten?.land ?? "SYR") }),
  optionen: (w, ev) => {
    const u = SKANDAL.untersuchen, b = SKANDAL.bestreiten;
    const land = String(ev.daten?.land ?? "SYR");
    const out: Option[] = [];
    out.push({
      ...opt("untersuchen", t("welle_k5.skandal.opt.untersuchen.label"), t("welle_k5.skandal.opt.untersuchen.beschr"), u.pk, (ww, e) => {
        wirke(ww, "ansehen", u.ansehen);
        wirke(ww, "nationalisten", u.nationalisten);
        widerstandAendern(ww, e, u.widerstand);
        return t("welle_k5.skandal.opt.untersuchen.ausgang", { region: nameVon(e) });
      }),
      bedingungen: zeilen({ ansehen: u.ansehen, widerstand: u.widerstand, nationalisten: u.nationalisten }),
      stelle: { art: "welt", land },
    });
    // Die Verwaltung selbst übernehmen: derselbe Weg wie in der Akte (Formwechsel zur Zivilverwaltung, Preis der Form)
    const g = gebiet(w, ev);
    out.push({
      ...opt("zivil", t("welle_k5.skandal.opt.zivil.label"), t("welle_k5.skandal.opt.zivil.beschr"), 0, (ww, e) => aendereBesatzung(ww, regionVon(e), "zivil").text),
      anzeigePk: FORM.zivil.pk,
      bedingungen: zeilen({ ansehen: FORM.zivil.ansehenWechsel }),
      stelle: { art: "welt", land },
      ...(!g || g.form !== "zone" ? { sperre: t("welle_k5.skandal.opt.zivil.sperre") } : {}),
    });
    out.push({
      ...opt("bestreiten", t("welle_k5.skandal.opt.bestreiten.label"), t("welle_k5.skandal.opt.bestreiten.beschr"), 0, (ww, e) => {
        wirke(ww, "ansehen", b.ansehen);
        landAendern(ww, "EU", { konflikt: b.euKonflikt }, t("welle_k5.skandal.grund"));
        widerstandAendern(ww, e, b.widerstand);
        return t("welle_k5.skandal.opt.bestreiten.ausgang", { region: nameVon(e) });
      }),
      bedingungen: zeilen({ ansehen: b.ansehen, widerstand: b.widerstand, euKonflikt: b.euKonflikt }),
    });
    out.push({ ...opt("abwarten", t("welle_k5.skandal.opt.abwarten.label"), t("welle_k5.skandal.opt.abwarten.beschr"), 0, (ww, e) => schweigen(ww, e)), bedingungen: zeilen(SKANDAL.schweigen) });
    return out;
  },
  standard: (w, ev) => schweigen(w, ev),
};

export const BESATZUNG_VORLAGEN: Vorlage[] = [STELLVERTRETER_SKANDAL];
