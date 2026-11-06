// Ereignisvorlagen der Vermittlung zwischen Drittstaaten (AUS-4): die Auto-Stops der Klasse A.
//   vermittlung_spoiler — eine Seite oder ein Dritter torpediert die Annäherung (Provokation,
//                         Hardliner-Gewinn, Sabotage, Ultimatum); Antwortmuster: verurteilen /
//                         dämpfen / ignorieren.
//   vermittlung_verstoss — eine Seite bricht die vereinbarte Umsetzung, die Ankara garantiert;
//                         Antwortmuster: eingreifen / dämpfen / hinnehmen (Garantie-Bruch).
// Beide werden nur vom Vermittlungs-Motor geöffnet (chance 0) und führen dieselben Folgen aus
// wie die Anzeige — der Kern (sim/vermittlung.ts) bleibt die einzige Wahrheitsquelle.
// Alle sichtbaren Texte kommen aus dem Katalog (src/i18n/katalog/*/nacht_n5_welt.json, Schlüssel ev.<vorlage>.*,
// Konfliktnamen unter ev.vermittlung.konflikt.*). Alle Zahlen sind Spielparameter (Platzhalter der Kalibrierung), keine Tatsachenbehauptungen.

import { KONFLIKTE, KONFLIKT_NACH_ID, type KonfliktDef } from "../data/konflikte";
import { opt } from "./ereignis-hilfen";
import { konfliktZustand, spoilerFolge, verstossFolge } from "./vermittlung";
import { t, type Formen } from "../i18n";
import type { Vorlage } from "./ereignis-hilfen";
import type { OffenesEreignis } from "./spiel-typen";

/** Konflikt der Datenlage, mit Standardfall für die Text-Öffnung ohne Übergabe. */
function konfliktVon(ev: OffenesEreignis) {
  return KONFLIKT_NACH_ID[String(ev.daten?.konflikt ?? "")] ?? KONFLIKTE[0]!;
}

/** Eine Konfliktseite aus dem Katalog: Grundform (im Deutschen mit Artikel, wo nötig) und Dativ, wo er abweicht. */
function seiteFormen(def: KonfliktDef, seite: "a" | "b"): Formen {
  const nom = t(`ev.vermittlung.konflikt.${def.id}.${seite}`);
  const dat = t(`ev.vermittlung.konflikt.${def.id}.${seite}.dat`);
  return dat !== nom ? { nom, dat } : { nom };
}

/**
 * Namen eines Konflikts für den Katalog (die Daten in data/konflikte.ts sind deutsch): Titel, beide Seiten,
 * und — nach der Seite des Ereignisses — `seite` (wer stört) und `andere`.
 */
export function konfliktNamen(def: KonfliktDef, seiteDesEreignisses?: unknown) {
  const a = seiteFormen(def, "a");
  const b = seiteFormen(def, "b");
  const istB = seiteDesEreignisses === "b";
  return { konflikt: t(`ev.vermittlung.konflikt.${def.id}.titel`), a, b, seite: istB ? b : a, andere: istB ? a : b };
}

const namenVon = (ev: OffenesEreignis) => konfliktNamen(konfliktVon(ev), ev.daten?.seite);
const spoilerArt = (ev: OffenesEreignis): string => {
  const art = String(ev.daten?.art ?? "provokation");
  return ["provokation", "hardliner", "sabotage", "ultimatum"].includes(art) ? art : "provokation";
};

/** Öffnung ohne Übergabe (Text-Prüfung): den ersten Konflikt mit einer Standard-Provokation. */
const erzeugeStandard = () => ({ provinzen: [], staerke: 1, daten: { konflikt: KONFLIKTE[0]!.id, art: "provokation", seite: "a" } });

const SPOILER: Vorlage = {
  id: "vermittlung_spoiler",
  szene: "istanbul",
  frist: 10,
  abkuehlung: 1,
  chance: () => 0,
  erzeuge: erzeugeStandard,
  titel: (_, ev) => t("ev.vermittlung_spoiler.titel", namenVon(ev)),
  text: (w, ev) => {
    const z = konfliktZustand(w, konfliktVon(ev).id);
    return [t(`ev.vermittlung_spoiler.art.${spoilerArt(ev)}`, namenVon(ev)), t("ev.vermittlung_spoiler.text2", { reif: Math.round(z.reif) })];
  },
  warum: () => t("ev.vermittlung_spoiler.warum"),
  optionen: (_, ev) => [
    opt("verurteilen", t("ev.vermittlung_spoiler.opt.verurteilen.label"), t("ev.vermittlung_spoiler.opt.verurteilen.beschr", namenVon(ev)), 2, (w, ev2) => spoilerFolge(w, ev2, "verurteilen")),
    opt("daempfen", t("ev.vermittlung_spoiler.opt.daempfen.label"), t("ev.vermittlung_spoiler.opt.daempfen.beschr"), 3, (w, ev2) => spoilerFolge(w, ev2, "daempfen")),
    opt("ignorieren", t("ev.vermittlung_spoiler.opt.ignorieren.label"), t("ev.vermittlung_spoiler.opt.ignorieren.beschr"), 0, (w, ev2) => spoilerFolge(w, ev2, "ignorieren")),
  ],
  standard: (w, ev) => spoilerFolge(w, ev, "ignorieren"),
};

const VERSTOSS: Vorlage = {
  id: "vermittlung_verstoss",
  szene: "istanbul",
  frist: 12,
  abkuehlung: 1,
  chance: () => 0,
  erzeuge: erzeugeStandard,
  titel: (_, ev) => t("ev.vermittlung_verstoss.titel", namenVon(ev)),
  text: (w, ev) => {
    const z = konfliktZustand(w, konfliktVon(ev).id);
    return [t("ev.vermittlung_verstoss.text1", namenVon(ev)), t(z.garantie === "militaer" ? "ev.vermittlung_verstoss.text2.militaer" : "ev.vermittlung_verstoss.text2")];
  },
  warum: () => t("ev.vermittlung_verstoss.warum"),
  optionen: (w, ev) => {
    const z = konfliktZustand(w, konfliktVon(ev).id);
    const o = (x: string) => `ev.vermittlung_verstoss.opt.${x}`;
    const liste = [
      opt("daempfen", t(o("daempfen.label")), t(o("daempfen.beschr")), 4, (w2, ev2) => verstossFolge(w2, ev2, "daempfen")),
      opt("hinnehmen", t(o("hinnehmen.label")), t(o("hinnehmen.beschr")), 0, (w2, ev2) => verstossFolge(w2, ev2, "hinnehmen")),
    ];
    if (z.garantie === "militaer") {
      liste.unshift(opt("eingreifen", t(o("eingreifen.label")), t(o("eingreifen.beschr")), 0, (w2, ev2) => verstossFolge(w2, ev2, "eingreifen")));
    }
    return liste;
  },
  standard: (w, ev) => verstossFolge(w, ev, "hinnehmen"),
};

export const VERMITTLUNG_VORLAGEN: Vorlage[] = [SPOILER, VERSTOSS];
