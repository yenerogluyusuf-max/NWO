// Ereignisvorlagen des Konfliktvorgangs (MIL-1): die Auto-Stops der Klasse A.
//   krieg_drohkulisse — die Eskalation verlangt eine Entscheidung (Phasenwechsel)
//   krieg_waffenruhe  — der Gegner bietet mitten im Krieg Waffenruhe an (Suzerain-Lücke gefüllt)
//   putschgeruechte   — nach Niederlage oder Gebietsabtretung bei zerbrochenem Offiziersvertrauen
//   krieg_beistandsruf — ein Pakt-Partner der Türkei wird angegriffen: Beistand leisten, nur Material oder verweigern (sim/pakte.ts)
// Alle drei werden nur vom Kriegsmotor geöffnet (chance 0) und führen dieselben Handlungen aus
// wie die Welt-Ansicht, Parser und KI — der Kern bleibt die einzige Wahrheitsquelle.
// Alle sichtbaren Texte kommen aus dem Katalog (src/i18n/katalog/*/nacht_n5_welt.json, Schlüssel ev.<vorlage>.*).
// Alle Zahlen sind Spielparameter (Platzhalter der Kalibrierung), keine Tatsachenbehauptungen.

import { wirke, vertrauenAendern } from "./wirkung";
import { NET } from "./modell";
import { nationalAverage } from "./netz";
import { opt } from "./ereignis-hilfen";
import { aktiveKriege, beistandVorgangGrund, eroeffneBeistandsVorgang, fuehreKriegHandlungAus, handlungenFuer, waffenruheFuerAngebot, type KriegHandlungId } from "./krieg";
import { allePakte, beistandMaterial, beistandVerweigern } from "./pakte";
import { akteurAkk, akteurDat, akteurDef, akteurName } from "./welt-modell";
import { aktuelleSprache, t, type Formen } from "../i18n";
import type { Option, Vorlage } from "./ereignis-hilfen";
import type { World } from "./types";
import type { OffenesEreignis } from "./spiel-typen";

/**
 * Ein Staat als Eigenname mit Fallformen für den Katalog (`{land}`, `{land|dat}`, `{land|akk}`, `{land|loc}`).
 * Dativ und Akkusativ stehen nur, wo sie vom Namen abweichen (deutsche Artikel, englisch „the United States“);
 * sonst bildet das Türkische die Endung selbst. Im Deutschen ist die Grundform der Satzgegenstand mit Artikel
 * („die Vereinigten Staaten“, „Saudi-Arabien und die Golfstaaten“, aber „Iran“), und `loc` ist die Wendung „in …“ aus den Daten.
 */
export function landFormen(id: string): Formen {
  let name = id;
  let dat = id;
  let akk = id;
  let inLand: string | undefined;
  try {
    name = akteurName(id);
    dat = akteurDat(id);
    akk = akteurAkk(id);
    inLand = akteurDef(id).inLand;
  } catch {
    // Unbekannte Kennung: der Name bleibt die Kennung
  }
  const de = aktuelleSprache() === "de";
  const nom = de && !akk.startsWith("den ") ? akk : name;
  return { nom, ...(dat !== name ? { dat } : {}), ...(akk !== name ? { akk } : {}), ...(de && inLand ? { loc: inLand } : {}) };
}

/** Zahl des Staatsnamens für das Verb: „pl“ in Deutsch und Englisch Mehrzahl, „plde“ nur im Deutschen (die Vereinigten Staaten), sonst „sg“. */
export function landZahl(id: string): "pl" | "plde" | "sg" {
  if (id === "SAU") return "pl";
  return id === "USA" || id === "NLD" || id === "ARE" ? "plde" : "sg";
}

const landId = (ev: OffenesEreignis): string => String(ev.daten?.land ?? "GRC");
const vorgangId = (ev: OffenesEreignis): string => String(ev.daten?.vorgang ?? "");
const offiziersvertrauen = (w: World): number => nationalAverage(NET, w.net, "offiziersvertrauen");
/** Die Gegenseite des Vorgangs für den Katalog: Name mit Fällen und Zahl des Verbs. */
const gegenseite = (ev: OffenesEreignis) => ({ land: landFormen(landId(ev)), nz: landZahl(landId(ev)) });

/** Öffnung ohne Übergabe (Text-Prüfung): den laufenden Vorgang nehmen, sonst den Standard-Spannungsfall. */
const erzeugeKrieg = (w: World) => {
  const k = aktiveKriege(w)[0];
  return { provinzen: [], staerke: 1, daten: { land: k?.land ?? "GRC", vorgang: k?.id ?? "" } };
};

/**
 * Eine Handlung des Konfliktvorgangs als Antwort. Den Preis bucht die Handlung selbst (sim/krieg.ts, fuehreKriegHandlungAus), so wie
 * in der Akte des Landes. Nacht 5./6.11.: Vorher buchte zusätzlich der Ereignismotor denselben Betrag (8 + 8, 5 + 5, 4 + 4); jetzt bucht
 * der Motor nichts, und `anzeigePk` nennt den Preis der Handlung, damit die Bezahlbarkeit ihn kennt. `pk` ist der Rückfall ohne Vorgang.
 */
function kriegsHandlung(w: World, ev: OffenesEreignis, id: string, handlung: KriegHandlungId, pk: number, labelKey: string): Option {
  const sicht = handlungenFuer(w, vorgangId(ev)).find((x) => x.id === handlung);
  return {
    ...opt(id, t(labelKey), t(`ev.krieg_drohkulisse.opt.${id}.beschr`), 0, (ww, e2, rng) => fuehreKriegHandlungAus(ww, vorgangId(e2), handlung, rng).text),
    anzeigePk: sicht?.pk ?? pk,
  };
}

const KRIEG_DROHKULISSE: Vorlage = {
  id: "krieg_drohkulisse",
  szene: "istanbul",
  frist: 12,
  abkuehlung: 1,
  chance: () => 0,
  erzeuge: erzeugeKrieg,
  titel: (_, ev) => t("ev.krieg_drohkulisse.titel", gegenseite(ev)),
  text: (_, ev) => [t("ev.krieg_drohkulisse.text1", gegenseite(ev)), t("ev.krieg_drohkulisse.text2", gegenseite(ev))],
  warum: () => t("ev.krieg_drohkulisse.warum"),
  optionen: (w, ev) => [
    kriegsHandlung(w, ev, "mobil", "mobil_teil", 8, "krieg.k.h.mobil_teil"),
    kriegsHandlung(w, ev, "vermittlung", "vermittlung", 5, "krieg.k.h.vermittlung"),
    kriegsHandlung(w, ev, "deeskalation", "deeskalation", 4, "krieg.k.h.deeskalation"),
  ],
  standard: () => t("ev.krieg_drohkulisse.standard"),
};

const KRIEG_WAFFENRUHE: Vorlage = {
  id: "krieg_waffenruhe",
  szene: "istanbul",
  frist: 14,
  abkuehlung: 1,
  chance: () => 0,
  erzeuge: erzeugeKrieg,
  titel: (_, ev) => t("ev.krieg_waffenruhe.titel", gegenseite(ev)),
  text: (_, ev) => [t("ev.krieg_waffenruhe.text1", gegenseite(ev)), t("ev.krieg_waffenruhe.text2")],
  warum: () => t("ev.krieg_waffenruhe.warum"),
  optionen: () => [
    opt("annehmen", t("ev.krieg_waffenruhe.opt.annehmen.label"), t("ev.krieg_waffenruhe.opt.annehmen.beschr"), 0, (w, ev) => waffenruheFuerAngebot(w, vorgangId(ev))),
    opt("ablehnen", t("ev.krieg_waffenruhe.opt.ablehnen.label"), t("ev.krieg_waffenruhe.opt.ablehnen.beschr"), 0, (w, ev) => {
      const k = w.spiel?.kriege?.find((x) => x.id === vorgangId(ev));
      if (!k) return t("ev.krieg_waffenruhe.opt.ablehnen.weg");
      k.gegnerAngebot = false;
      k.uhr = Math.max(0, k.uhr - 3);
      k.eskalation = Math.min(100, k.eskalation + 2);
      return t("ev.krieg_waffenruhe.opt.ablehnen.ausgang");
    }),
  ],
  standard: (w, ev) => {
    const k = w.spiel?.kriege?.find((x) => x.id === vorgangId(ev));
    if (k) {
      k.gegnerAngebot = false;
      k.uhr = Math.max(0, k.uhr - 3);
    }
    return t("ev.krieg_waffenruhe.standard");
  },
};

const PUTSCHGERUECHTE: Vorlage = {
  id: "putschgeruechte",
  szene: "istanbul",
  frist: 12,
  abkuehlung: 3650,
  chance: () => 0,
  erzeuge: erzeugeKrieg,
  titel: () => t("ev.putschgeruechte.titel"),
  text: (w) => [t("ev.putschgeruechte.text1", { n: Math.round(offiziersvertrauen(w)) }), t("ev.putschgeruechte.text2")],
  warum: () => t("ev.putschgeruechte.warum"),
  optionen: () => [
    opt("ordnung", t("ev.putschgeruechte.opt.ordnung.label"), t("ev.putschgeruechte.opt.ordnung.beschr"), 5, (w) => {
      wirke(w, "offiziersvertrauen", -4);
      wirke(w, "legitimitaet", -2);
      wirke(w, "nationalisten", 1);
      return t("ev.putschgeruechte.opt.ordnung.ausgang");
    }),
    opt("einbinden", t("ev.putschgeruechte.opt.einbinden.label"), t("ev.putschgeruechte.opt.einbinden.beschr"), 8, (w) => {
      wirke(w, "offiziersvertrauen", 6);
      wirke(w, "nationalisten", -2);
      w.spiel!.umfrage.zustimmung = Math.max(0, w.spiel!.umfrage.zustimmung - 1);
      return t("ev.putschgeruechte.opt.einbinden.ausgang");
    }),
  ],
  standard: (w) => {
    wirke(w, "offiziersvertrauen", -6);
    wirke(w, "legitimitaet", -3);
    vertrauenAendern(w, -2);
    return t("ev.putschgeruechte.standard");
  },
};

const ruf = (ev: OffenesEreignis) => ({
  partner: String(ev.daten?.partner ?? "SAU"),
  gegner: String(ev.daten?.gegner ?? "IRN"),
  pakt: String(ev.daten?.pakt ?? "mekka"),
});

/** Pakte mit eigenem Namen im Katalog (Akkusativ mit Artikel für „beruft sich auf …“); andere heißen allgemein „Beistandsvertrag“. */
const PAKT_NAMEN = new Set(["nato", "mekka", "eu", "golf", "sco", "ots"]);

/** Der Pakt eines Beistandsrufs für den Katalog: Name (ohne Pakt „die Zusage der Türkei“) und die Klausel in einem Satz. */
export function paktTexte(w: World, paktId: string): { pakt: string; klausel: string } {
  const p = allePakte(w).find((x) => x.id === paktId);
  if (!p) return { pakt: t("ev.krieg_beistandsruf.pakt.ohne"), klausel: t("ev.krieg_beistandsruf.klausel.ohne") };
  return { pakt: t(`ev.krieg_beistandsruf.pakt.${PAKT_NAMEN.has(p.id) ? p.id : "vertrag"}`), klausel: t(`ev.krieg_beistandsruf.klausel.${p.klausel}`) };
}

/** Partner und Gegner eines Beistandsrufs für den Katalog. */
export function rufParams(partner: string, gegner?: string) {
  return { partner: landFormen(partner), nz: landZahl(partner), ...(gegner ? { gegner: landFormen(gegner), gnz: landZahl(gegner) } : {}) };
}

const KRIEG_BEISTANDSRUF: Vorlage = {
  id: "krieg_beistandsruf",
  szene: "istanbul",
  frist: 20,
  abkuehlung: 1,
  chance: () => 0,
  wettbewerb: "aussitzen",
  schwere: 1.2,
  erzeuge: () => ({ provinzen: [], staerke: 0.5, daten: { partner: "SAU", gegner: "IRN", pakt: "mekka", krieg: "" } }),
  titel: (_, ev) => t("ev.krieg_beistandsruf.titel", rufParams(ruf(ev).partner)),
  text: (w, ev) => {
    const r = ruf(ev);
    const p = paktTexte(w, r.pakt);
    return [
      t("ev.krieg_beistandsruf.text1", { ...rufParams(r.partner, r.gegner), pakt: p.pakt }),
      p.klausel,
      t("ev.krieg_beistandsruf.text3"),
    ];
  },
  warum: () => t("ev.krieg_beistandsruf.warum"),
  optionen: (w, ev) => {
    const r = ruf(ev);
    const params = rufParams(r.partner, r.gegner);
    const out = [];
    if (!beistandVorgangGrund(w, r.gegner)) {
      out.push(
        opt("truppen", t("ev.krieg_beistandsruf.opt.truppen.label"), t("ev.krieg_beistandsruf.opt.truppen.beschr", params), 10, (w2) => eroeffneBeistandsVorgang(w2, r.gegner, r.partner, r.pakt).text),
      );
    }
    out.push(
      opt("material", t("ev.krieg_beistandsruf.opt.material.label"), t("ev.krieg_beistandsruf.opt.material.beschr", params), 4, (w2) => beistandMaterial(w2, r.partner, r.pakt)),
      opt("verweigern", t("ev.krieg_beistandsruf.opt.verweigern.label"), t("ev.krieg_beistandsruf.opt.verweigern.beschr", params), 0, (w2) => beistandVerweigern(w2, r.partner, r.pakt, false)),
    );
    return out;
  },
  standard: (w, ev) => {
    const r = ruf(ev);
    return beistandVerweigern(w, r.partner, r.pakt, true);
  },
};

export const KRIEG_VORLAGEN: Vorlage[] = [KRIEG_DROHKULISSE, KRIEG_WAFFENRUHE, PUTSCHGERUECHTE, KRIEG_BEISTANDSRUF];
