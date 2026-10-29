// Ereignisse des Machtkreises (sim/machtkreis.ts): offene Rivalität, Seitenwechsel, Nachfolgefrage, Enthüllung durch die Presse,
// Putschzirkel im Generalstab, Kampfkandidatur auf dem Parteitag. Sie entstehen aus dem Zustand der Menschen, nicht aus dem Würfel allein.
// Alle Wahrscheinlichkeiten und Wirkungen sind Spielparameter; die Texte stehen in katalog/<sprache>/machtkreis.json.

import { t } from "../i18n";
import { opt } from "./ereignis-hilfen";
import type { Vorlage } from "./ereignis-hilfen";
import { vertrauenAendern, wirke } from "./wirkung";
import { eigenVon, grollVerschieben, loyalitaetVerschieben, merke } from "./personen";
import { ausscheiden } from "./nachfolge";
import {
  MACHTKREIS,
  aufgedeckterPutschzirkel,
  beziehungenVon,
  geheimnisFuerPresse,
  heftigsteRivalitaet,
  macheOeffentlich,
  machtkreis,
  nebenVon,
  personVon,
  regimeGrad,
  regimeStil,
  rolleText,
  schluesselVon,
  wechselKandidat,
  zeigeSzene,
  type Person,
} from "./machtkreis";
import { msg } from "../i18n";
import type { World } from "./types";
import type { OffenesEreignis } from "./spiel-typen";

const p = (w: World, ev: OffenesEreignis, k = "a"): Person | undefined => personVon(w, String(ev.daten?.[k] ?? ""));
const nm = (x: Person | undefined): string => (x ? x.name : t("mk.jemand"));
const rl = (x: Person | undefined): string => (x ? rolleText(x) : "");

function loy(w: World, x: Person | undefined, d: number): void {
  if (!x) return;
  if (x.figur) loyalitaetVerschieben(x.figur, d);
  else if (x.neben) x.neben.loyalitaet = Math.max(0, Math.min(100, x.neben.loyalitaet + d));
}
function groll(w: World, x: Person | undefined, d: number): void {
  if (!x) return;
  if (x.figur) grollVerschieben(w, x.figur, d);
  else if (x.neben) x.neben.loyalitaet = Math.max(0, Math.min(100, x.neben.loyalitaet - d * 0.3));
}
const im = (w: World): boolean => !!w.spiel && MACHTKREIS.aktiv;

// ---------------------------------------------------------------------------
// Offene Rivalität zweier Minister

const RIVALITAET: Vorlage = {
  id: "kreis_rivalitaet",
  szene: "parlament",
  frist: 20,
  abkuehlung: 200,
  chance: (w) => {
    if (!im(w)) return 0;
    const r = heftigsteRivalitaet(w);
    return r && r.staerke >= 70 ? 0.08 : r && r.staerke >= 60 ? 0.03 : 0;
  },
  erzeuge: (w) => {
    const r = heftigsteRivalitaet(w);
    return r ? { provinzen: [], staerke: 1, daten: { a: r.a, b: r.b } } : null;
  },
  titel: (w, ev) => t("mk.ev.rival.titel", { a: nm(p(w, ev, "a")), b: nm(p(w, ev, "b")) }),
  text: (w, ev) => [t("mk.ev.rival.text1", { a: nm(p(w, ev, "a")), ra: rl(p(w, ev, "a")), b: nm(p(w, ev, "b")), rb: rl(p(w, ev, "b")) }), t("mk.ev.rival.text2")],
  warum: () => t("mk.ev.rival.warum"),
  optionen: (w, ev) => [
    opt("fuer_a", t("mk.ev.rival.fuer", { name: nm(p(w, ev, "a")) }), t("mk.ev.rival.fuer_beschr", { sieger: nm(p(w, ev, "a")), verlierer: nm(p(w, ev, "b")) }), 1, (ww) => entscheideRivalen(ww, ev, "a")),
    opt("fuer_b", t("mk.ev.rival.fuer", { name: nm(p(w, ev, "b")) }), t("mk.ev.rival.fuer_beschr", { sieger: nm(p(w, ev, "b")), verlierer: nm(p(w, ev, "a")) }), 1, (ww) => entscheideRivalen(ww, ev, "b")),
    opt("schlichten", t("mk.ev.rival.schlichten"), t("mk.ev.rival.schlichten_beschr"), 3, (ww) => {
      const a = p(ww, ev, "a");
      const b = p(ww, ev, "b");
      groll(ww, a, -10);
      groll(ww, b, -10);
      const bz = machtkreis(ww).beziehungen.find((x) => x.a === ev.daten?.a && x.b === ev.daten?.b);
      if (bz) bz.staerke = Math.max(0, bz.staerke - 35);
      zeigeSzene(ww, "schlichten", msg("mk.szene.schlichten", { a: nm(a), b: nm(b) }), [String(ev.daten?.a), String(ev.daten?.b)], t("mk.stempel.schlichten"));
      return t("mk.ev.rival.schlichten_aus", { a: nm(a), b: nm(b) });
    }),
  ],
  standard: (w, ev) => {
    const a = p(w, ev, "a");
    const b = p(w, ev, "b");
    // Wer nicht entscheidet, lässt den Streit in die Öffentlichkeit
    vertrauenAendern(w, -0.6);
    groll(w, a, 6);
    groll(w, b, 6);
    for (const x of [a, b]) if (x?.figur) eigenVon(w, x.figur).druckBis = w.day + 60;
    return t("mk.ev.rival.standard", { a: nm(a), b: nm(b) });
  },
};

function entscheideRivalen(w: World, ev: OffenesEreignis, sieger: "a" | "b"): string {
  const s = p(w, ev, sieger);
  const v = p(w, ev, sieger === "a" ? "b" : "a");
  loy(w, s, 10);
  loy(w, v, -12);
  groll(w, v, 20);
  if (s?.figur) eigenVon(w, s.figur).mittelBis = w.day + 120;
  const bz = machtkreis(w).beziehungen.find((x) => x.a === ev.daten?.a && x.b === ev.daten?.b);
  if (bz) bz.staerke = Math.max(0, bz.staerke - 20);
  zeigeSzene(w, "rivalen", msg("mk.szene.rivalen", { sieger: nm(s), verlierer: nm(v) }), [s?.schluessel ?? "", v?.schluessel ?? ""], t("mk.stempel.rivalen"));
  return t("mk.ev.rival.fuer_aus", { sieger: nm(s), verlierer: nm(v) });
}

// ---------------------------------------------------------------------------
// Seitenwechsel

const SEITENWECHSEL: Vorlage = {
  id: "kreis_seitenwechsel",
  szene: "istanbul",
  frist: 15,
  abkuehlung: 240,
  chance: (w) => (im(w) && wechselKandidat(w) ? 0.1 : 0),
  erzeuge: (w) => {
    const k = wechselKandidat(w);
    return k ? { provinzen: [], staerke: 1, daten: { a: k.schluessel } } : null;
  },
  titel: (w, ev) => t("mk.ev.wechsel.titel", { name: nm(p(w, ev)) }),
  text: (w, ev) => {
    const a = p(w, ev);
    const g = a ? machtkreis(w).geheimnisse.find((x) => x.person === a.schluessel && x.aufgedeckt) : undefined;
    return [t("mk.ev.wechsel.text1", { name: nm(a), rolle: rl(a), loy: Math.round(a?.loyalitaet ?? 0) }), g ? t("mk.ev.wechsel.textGeheimnis", { art: t(`mk.geheimnis.${g.art}`) }) : t("mk.ev.wechsel.text2")];
  },
  warum: () => t("mk.ev.wechsel.warum"),
  optionen: (w, ev) => {
    const a = p(w, ev);
    const g = a ? machtkreis(w).geheimnisse.find((x) => x.person === a.schluessel && x.aufgedeckt) : undefined;
    const liste = [
      opt("deal", t("mk.ev.wechsel.deal"), t("mk.ev.wechsel.deal_beschr"), 4, (ww) => {
        const x = p(ww, ev);
        loy(ww, x, 22);
        groll(ww, x, -30);
        if (x) machtkreis(ww).deals[x.schluessel] = ww.day + 365;
        zeigeSzene(ww, "deal", msg("mk.szene.deal", { name: nm(x), rolle: rl(x) }), [x?.schluessel ?? ""], t("mk.stempel.deal"));
        return t("mk.ev.wechsel.deal_aus", { name: nm(x) });
      }),
      opt("gehen", t("mk.ev.wechsel.gehen"), t("mk.ev.wechsel.gehen_beschr"), 0, (ww) => wechselVollzogen(ww, ev)),
    ];
    if (g)
      liste.splice(1, 0, opt("druck", t("mk.ev.wechsel.druck"), t("mk.ev.wechsel.druck_beschr"), 1, (ww) => {
        const x = p(ww, ev);
        loy(ww, x, 28);
        groll(ww, x, 30);
        machtkreis(ww).angst = Math.min(100, machtkreis(ww).angst + 5);
        zeigeSzene(ww, "druck", msg("mk.szene.druck", { name: nm(x) }), [x?.schluessel ?? ""], t("mk.stempel.druck"));
        return t("mk.ev.wechsel.druck_aus", { name: nm(x) });
      }));
    return liste;
  },
  standard: (w, ev) => wechselVollzogen(w, ev),
};

function wechselVollzogen(w: World, ev: OffenesEreignis): string {
  const a = p(w, ev);
  if (a?.figur) {
    merke(w, a.figur, t("mk.merke.wechsel"));
    ausscheiden(w, a.figur, t("mk.grund.wechsel"));
    // Wer überläuft, nimmt Wissen und Vertrauen mit
    eigenVon(w, a.figur);
  }
  vertrauenAendern(w, -1.2);
  wirke(w, "legitimitaet", -1);
  const kp = nebenVon(w, "kronprinz");
  if (kp) {
    kp.einfluss = Math.min(100, kp.einfluss + 8);
    machtkreis(w).nachfolge = Math.min(100, machtkreis(w).nachfolge + 8);
  }
  zeigeSzene(w, "wechsel", msg("mk.szene.wechsel", { name: nm(a), rolle: rl(a) }), [a?.schluessel ?? ""], t("mk.stempel.wechsel"));
  return t("mk.ev.wechsel.gehen_aus", { name: nm(a) });
}

// ---------------------------------------------------------------------------
// Nachfolgefrage in der eigenen Partei

const NACHFOLGE: Vorlage = {
  id: "kreis_nachfolge",
  szene: "parlament",
  frist: 25,
  abkuehlung: 300,
  chance: (w) => {
    if (!im(w)) return 0;
    const kp = nebenVon(w, "kronprinz");
    return kp && kp.status === "aktiv" && machtkreis(w).nachfolge >= 60 ? 0.06 : 0;
  },
  erzeuge: (w) => {
    const kp = nebenVon(w, "kronprinz");
    return kp ? { provinzen: [], staerke: 1, daten: { a: schluesselVon(kp) } } : null;
  },
  titel: (w, ev) => t("mk.ev.nachfolge.titel", { name: nm(p(w, ev)) }),
  text: (w, ev) => [t("mk.ev.nachfolge.text1", { name: nm(p(w, ev)), druck: Math.round(machtkreis(w).nachfolge) }), t(`mk.ev.nachfolge.text2.${regimeStil(regimeGrad(w))}`)],
  warum: () => t("mk.ev.nachfolge.warum"),
  optionen: () => [
    opt("designieren", t("mk.ev.nachfolge.designieren"), t("mk.ev.nachfolge.designieren_beschr"), 2, (ww, ev) => {
      const x = p(ww, ev);
      const mk = machtkreis(ww);
      mk.nachfolge = Math.max(0, mk.nachfolge - 40);
      loy(ww, x, 20);
      if (x?.neben) x.neben.einfluss = Math.min(100, x.neben.einfluss + 20);
      // Wer einen Nachfolger benennt, wird zur Übergangsfigur: Die Minister schauen schon zum Nächsten
      for (const b of beziehungenVon(ww, x?.schluessel ?? "", false)) if (b.art === "rivalen") groll(ww, personVon(ww, b.andere), 12);
      wirke(ww, "legitimitaet", -1);
      zeigeSzene(ww, "designieren", msg("mk.szene.designieren", { name: nm(x) }), [x?.schluessel ?? ""], t("mk.stempel.designieren"));
      return t("mk.ev.nachfolge.designieren_aus", { name: nm(x) });
    }),
    opt("hinhalten", t("mk.ev.nachfolge.hinhalten"), t("mk.ev.nachfolge.hinhalten_beschr"), 3, (ww, ev) => {
      const x = p(ww, ev);
      const mk = machtkreis(ww);
      mk.nachfolge = Math.max(0, mk.nachfolge - 25);
      if (x) mk.deals[x.schluessel] = ww.day + 365;
      loy(ww, x, 8);
      zeigeSzene(ww, "deal", msg("mk.szene.hinhalten", { name: nm(x) }), [x?.schluessel ?? ""], t("mk.stempel.deal"));
      return t("mk.ev.nachfolge.hinhalten_aus", { name: nm(x) });
    }),
    opt("ausbooten", t("mk.ev.nachfolge.ausbooten"), t("mk.ev.nachfolge.ausbooten_beschr"), 3, (ww, ev) => {
      const x = p(ww, ev);
      const mk = machtkreis(ww);
      mk.nachfolge = Math.max(0, mk.nachfolge - 30);
      if (x?.neben) {
        x.neben.status = "kaltgestellt";
        x.neben.bis = ww.day + 540;
        x.neben.einfluss = Math.max(0, x.neben.einfluss - 30);
        x.neben.loyalitaet = Math.max(0, x.neben.loyalitaet - 25);
      }
      // Die Partei merkt, dass Widerspruch bestraft wird
      vertrauenAendern(ww, -0.4);
      if (regimeStil(regimeGrad(ww)) !== "autoritaer") wirke(ww, "legitimitaet", -1.5);
      mk.angst = Math.min(100, mk.angst + 6);
      zeigeSzene(ww, "kaltstellen", msg("mk.szene.ausbooten", { name: nm(x) }), [x?.schluessel ?? ""], t("mk.stempel.kaltstellen"));
      return t("mk.ev.nachfolge.ausbooten_aus", { name: nm(x) });
    }),
  ],
  standard: (w, ev) => {
    const mk = machtkreis(w);
    mk.nachfolge = Math.min(100, mk.nachfolge + 15);
    vertrauenAendern(w, -0.5);
    return t("mk.ev.nachfolge.standard", { name: nm(p(w, ev)) });
  },
};

// ---------------------------------------------------------------------------
// Kampfkandidatur auf dem Parteitag (nicht im autoritären Stil: dort wird nicht offen gewählt)

const PARTEITAG: Vorlage = {
  id: "kreis_parteitag",
  szene: "parlament",
  frist: 20,
  abkuehlung: 720,
  chance: (w) => {
    if (!im(w)) return 0;
    const kp = nebenVon(w, "kronprinz");
    return kp && kp.status === "aktiv" && machtkreis(w).nachfolge >= 90 && regimeStil(regimeGrad(w)) !== "autoritaer" && w.spiel!.umfrage.zustimmung < 45 ? 0.15 : 0;
  },
  erzeuge: (w) => {
    const kp = nebenVon(w, "kronprinz");
    return kp ? { provinzen: [], staerke: 1, daten: { a: schluesselVon(kp) } } : null;
  },
  titel: (w, ev) => t("mk.ev.parteitag.titel", { name: nm(p(w, ev)) }),
  text: (w, ev) => [t("mk.ev.parteitag.text1", { name: nm(p(w, ev)), einfluss: Math.round(p(w, ev)?.neben?.einfluss ?? 0) }), t("mk.ev.parteitag.text2", { chance: Math.round(parteitagChance(w, ev) * 100) })],
  warum: () => t("mk.ev.parteitag.warum"),
  optionen: () => [
    opt("kaempfen", t("mk.ev.parteitag.kaempfen"), t("mk.ev.parteitag.kaempfen_beschr"), 4, (ww, ev, rng) => {
      const x = p(ww, ev);
      const mk = machtkreis(ww);
      const sieg = rng.next() < parteitagChance(ww, ev);
      if (sieg) {
        mk.nachfolge = 5;
        if (x?.neben) {
          x.neben.einfluss = Math.max(0, x.neben.einfluss - 35);
          x.neben.ehrgeiz = Math.max(0, x.neben.ehrgeiz - 20);
          x.neben.loyalitaet = Math.min(100, x.neben.loyalitaet + 10);
        }
        wirke(ww, "legitimitaet", 3);
        vertrauenAendern(ww, 0.8);
        zeigeSzene(ww, "parteitagSieg", msg("mk.szene.parteitagSieg", { name: nm(x) }), [x?.schluessel ?? ""], t("mk.stempel.parteitagSieg"));
        return t("mk.ev.parteitag.sieg", { name: nm(x) });
      }
      mk.nachfolge = 100;
      if (x?.neben) x.neben.einfluss = Math.min(100, x.neben.einfluss + 20);
      fraktionWendetSich(ww);
      wirke(ww, "legitimitaet", -5);
      vertrauenAendern(ww, -2);
      if (ww.spiel) ww.spiel.kapital -= 8;
      zeigeSzene(ww, "parteitagNiederlage", msg("mk.szene.parteitagNiederlage", { name: nm(x) }), [x?.schluessel ?? ""], t("mk.stempel.parteitagNiederlage"));
      return t("mk.ev.parteitag.niederlage", { name: nm(x) });
    }),
    opt("teilen", t("mk.ev.parteitag.teilen"), t("mk.ev.parteitag.teilen_beschr"), 2, (ww, ev) => {
      const x = p(ww, ev);
      const mk = machtkreis(ww);
      mk.nachfolge = 45;
      if (x?.neben) {
        x.neben.einfluss = Math.min(100, x.neben.einfluss + 10);
        x.neben.loyalitaet = Math.min(100, x.neben.loyalitaet + 15);
      }
      if (x) mk.deals[x.schluessel] = ww.day + 730;
      wirke(ww, "legitimitaet", -1);
      zeigeSzene(ww, "deal", msg("mk.szene.teilen", { name: nm(x) }), [x?.schluessel ?? ""], t("mk.stempel.deal"));
      return t("mk.ev.parteitag.teilen_aus", { name: nm(x) });
    }),
  ],
  standard: (w, ev) => {
    const x = p(w, ev);
    const mk = machtkreis(w);
    mk.nachfolge = 100;
    if (x?.neben) x.neben.einfluss = Math.min(100, x.neben.einfluss + 15);
    fraktionWendetSich(w);
    wirke(w, "legitimitaet", -4);
    vertrauenAendern(w, -1.5);
    return t("mk.ev.parteitag.standard", { name: nm(x) });
  },
};

/** Nach einer verlorenen Kampfkandidatur hört die Fraktion auf den neuen Vorsitz: Die Disziplin bricht ein. */
function fraktionWendetSich(w: World): void {
  const f = nebenVon(w, "fraktionschef");
  if (f) f.loyalitaet = Math.max(0, f.loyalitaet - 25);
}

/** Chance, die Kampfkandidatur zu gewinnen: Zustimmung, eigene Leute, Einfluss des Kronprinzen (Spielparameter). */
export function parteitagChance(w: World, ev: OffenesEreignis): number {
  const x = p(w, ev);
  const zust = w.spiel?.umfrage.zustimmung ?? 40;
  const einfluss = x?.neben?.einfluss ?? 50;
  return Math.max(0.15, Math.min(0.85, 0.5 + (zust - 40) * 0.02 - (einfluss - 50) * 0.01));
}

// ---------------------------------------------------------------------------
// Enthüllung durch die Presse

const ENTHUELLUNG: Vorlage = {
  id: "kreis_enthuellung",
  szene: "istanbul",
  frist: 12,
  abkuehlung: 210,
  chance: (w) => (im(w) && geheimnisFuerPresse(w) ? 0.07 : 0),
  erzeuge: (w) => {
    const g = geheimnisFuerPresse(w);
    const j = nebenVon(w, "journalist");
    return g && j ? { provinzen: [], staerke: g.schwere, daten: { a: g.person, g: g.id, j: schluesselVon(j) } } : null;
  },
  titel: (w, ev) => t("mk.ev.enthuellung.titel", { name: nm(p(w, ev, "a")) }),
  text: (w, ev) => {
    const g = machtkreis(w).geheimnisse.find((x) => x.id === ev.daten?.g);
    return [
      t("mk.ev.enthuellung.text1", { journalist: nm(p(w, ev, "j")), name: nm(p(w, ev, "a")), rolle: rl(p(w, ev, "a")), art: g ? t(`mk.geheimnis.${g.art}`) : "" }),
      t(`mk.ev.enthuellung.text2.${regimeStil(regimeGrad(w))}`),
    ];
  },
  warum: () => t("mk.ev.enthuellung.warum"),
  optionen: (w) => {
    const stil = regimeStil(regimeGrad(w));
    const liste = [
      opt("opfern", t("mk.ev.enthuellung.opfern"), t("mk.ev.enthuellung.opfern_beschr"), 1, (ww, ev) => {
        const a = p(ww, ev, "a");
        oeffentlich(ww, ev);
        if (a?.figur) ausscheiden(ww, a.figur, t("mk.grund.bauernopferGrund"));
        vertrauenAendern(ww, 1.2);
        zeigeSzene(ww, "bauernopfer", msg("mk.szene.bauernopfer", { name: nm(a), rolle: rl(a) }), [a?.schluessel ?? ""], t("mk.stempel.bauernopfer"));
        return t("mk.ev.enthuellung.opfern_aus", { name: nm(a) });
      }),
      opt("dementieren", t("mk.ev.enthuellung.dementieren"), t("mk.ev.enthuellung.dementieren_beschr"), 2, (ww, ev) => {
        const a = p(ww, ev, "a");
        oeffentlich(ww, ev);
        loy(ww, a, 12);
        vertrauenAendern(ww, -1.4);
        wirke(ww, "korruption", 1);
        return t("mk.ev.enthuellung.dementieren_aus", { name: nm(a) });
      }),
      opt("interview", t("mk.ev.enthuellung.interview"), t("mk.ev.enthuellung.interview_beschr"), 3, (ww, ev) => {
        const j = p(ww, ev, "j");
        // Ein Exklusivgespräch verschiebt die Geschichte; die Journalistin bleibt kritisch, aber die Enthüllung wartet
        if (j?.neben) {
          j.neben.loyalitaet = Math.min(100, j.neben.loyalitaet + 6);
          j.neben.einfluss = Math.min(100, j.neben.einfluss + 5);
        }
        const g = machtkreis(ww).geheimnisse.find((x) => x.id === ev.daten?.g);
        if (g) g.seit = ww.day;
        vertrauenAendern(ww, -0.3);
        return t("mk.ev.enthuellung.interview_aus", { journalist: nm(j) });
      }),
    ];
    if (stil !== "offen")
      liste.push(opt("festnehmen", t("mk.ev.enthuellung.festnehmen"), t("mk.ev.enthuellung.festnehmen_beschr"), 2, (ww, ev) => {
        const j = p(ww, ev, "j");
        if (j?.neben) {
          j.neben.status = "haft";
          j.neben.bis = ww.day + 540;
          j.neben.loyalitaet = 0;
        }
        wirke(ww, "pressefreiheit", -4);
        wirke(ww, "beziehungen_eu", -3);
        wirke(ww, "ansehen", -2);
        const mk = machtkreis(ww);
        mk.angst = Math.min(100, mk.angst + 8);
        zeigeSzene(ww, "haft", msg("mk.szene.haft", { journalist: nm(j) }), [j?.schluessel ?? ""], t("mk.stempel.haft"));
        return t("mk.ev.enthuellung.festnehmen_aus", { journalist: nm(j) });
      }));
    return liste;
  },
  standard: (w, ev) => {
    const a = p(w, ev, "a");
    oeffentlich(w, ev);
    vertrauenAendern(w, -1.6);
    groll(w, a, 10);
    return t("mk.ev.enthuellung.standard", { name: nm(a) });
  },
};

function oeffentlich(w: World, ev: OffenesEreignis): void {
  const g = machtkreis(w).geheimnisse.find((x) => x.id === ev.daten?.g);
  if (g) macheOeffentlich(w, g);
}

// ---------------------------------------------------------------------------
// Putschzirkel im Generalstab (nur, wenn der Dienst ihn aufgedeckt hat)

const PUTSCHZIRKEL: Vorlage = {
  id: "kreis_putschzirkel",
  szene: "istanbul",
  frist: 10,
  abkuehlung: 365,
  chance: (w) => (im(w) && aufgedeckterPutschzirkel(w) ? 0.5 : 0),
  erzeuge: (w) => {
    const g = aufgedeckterPutschzirkel(w);
    return g ? { provinzen: [], staerke: g.schwere, daten: { a: g.person, g: g.id } } : null;
  },
  titel: (w, ev) => t("mk.ev.putsch.titel", { name: nm(p(w, ev)) }),
  text: (w, ev) => [t("mk.ev.putsch.text1", { name: nm(p(w, ev)), rolle: rl(p(w, ev)) }), t(`mk.ev.putsch.text2.${regimeStil(regimeGrad(w))}`)],
  warum: () => t("mk.ev.putsch.warum"),
  optionen: () => [
    opt("saeubern", t("mk.ev.putsch.saeubern"), t("mk.ev.putsch.saeubern_beschr"), 4, (ww, ev) => {
      const a = p(ww, ev);
      const g = machtkreis(ww).geheimnisse.find((x) => x.id === ev.daten?.g);
      if (g) g.schwere = 1;
      if (a?.figur) ausscheiden(ww, a.figur, t("mk.grund.putsch"));
      const mk = machtkreis(ww);
      mk.saeuberungen.push(ww.day);
      mk.angst = Math.min(100, mk.angst + 15);
      wirke(ww, "truppenmoral", -5);
      wirke(ww, "offiziersvertrauen", -4);
      wirke(ww, "beziehungen_eu", -2);
      const enden = ww.spiel?.enden;
      if (enden) enden.putsch.geschuetztBis = Math.max(enden.putsch.geschuetztBis ?? 0, ww.day + 540);
      zeigeSzene(ww, "saeuberung", msg("mk.szene.saeuberung", { name: nm(a), rolle: rl(a) }), [a?.schluessel ?? ""], t("mk.stempel.saeuberung"));
      return t("mk.ev.putsch.saeubern_aus", { name: nm(a) });
    }),
    opt("still", t("mk.ev.putsch.still"), t("mk.ev.putsch.still_beschr"), 2, (ww, ev) => {
      const a = p(ww, ev);
      const g = machtkreis(ww).geheimnisse.find((x) => x.id === ev.daten?.g);
      if (g) g.schwere = 1;
      if (a?.figur) {
        eigenVon(ww, a.figur).ehrgeiz = Math.max(0, eigenVon(ww, a.figur).ehrgeiz - 25);
        loyalitaetVerschieben(a.figur, 15);
      }
      wirke(ww, "offiziersvertrauen", 1);
      zeigeSzene(ww, "druck", msg("mk.szene.still", { name: nm(a) }), [a?.schluessel ?? ""], t("mk.stempel.druck"));
      return t("mk.ev.putsch.still_aus", { name: nm(a) });
    }),
  ],
  standard: (w, ev) => {
    const a = p(w, ev);
    if (a?.figur) eigenVon(w, a.figur).ehrgeiz = Math.min(100, eigenVon(w, a.figur).ehrgeiz + 10);
    wirke(w, "offiziersvertrauen", -3);
    return t("mk.ev.putsch.standard", { name: nm(a) });
  },
};

export const MACHTKREIS_VORLAGEN: Vorlage[] = [RIVALITAET, SEITENWECHSEL, NACHFOLGE, PARTEITAG, ENTHUELLUNG, PUTSCHZIRKEL];
