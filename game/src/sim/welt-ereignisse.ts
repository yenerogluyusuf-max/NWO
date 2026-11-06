// Große Weltereignisse als Entscheidungen für den Spieler: ein Machtwechsel bei einem wichtigen Gegenüber und der Ausbruch einer Krise bei
// einem Nachbarn oder Partner (Währungskrise, Staatsbankrott, Unruhen, Grenzgefechte). Das Weltmodell (sim/welt-modell.ts) merkt sie vor;
// dieses Modul legt höchstens eines in 150 Tagen vor und nur, wenn der Schreibtisch nicht ohnehin voll ist.
// Alle sichtbaren Texte kommen aus dem Katalog (src/i18n/katalog/*/nacht_n5.json, Schlüssel ev.<vorlage>.*).
// Alle Zahlen sind Spielparameter (Platzhalter der Kalibrierung), keine Tatsachenbehauptungen.

import { WELT_REGELN } from "../data/welt-daten";
import { opt, kosten } from "./ereignis-hilfen";
import type { Vorlage } from "./ereignis-hilfen";
import { oeffne } from "./ereignisse";
import { wirke } from "./wirkung";
import { NET } from "./modell";
import {
  beziehungAendern,
  eigenVon,
  setzeEreignisHaken,
  stabilitaetWort,
  type KriseArt,
  type WeltModell,
} from "./welt-modell";
import "./welt-bloecke";
import "./diplomatie";
import { rufVermerken } from "./pakte";
import { GEGENSPIONAGE_KAPAZITAET, beantworteEinfluss, kapazitaetMax } from "./welt-dienst";
import { landFormen, landZahl } from "./ereignisse-krieg";
import { t } from "../i18n";
import type { OffenesEreignis } from "./spiel-typen";
import type { Rng } from "./rng";
import type { World } from "./types";

const landId = (ev: OffenesEreignis): string => String(ev.daten?.land ?? "USA");
const kursVon = (ev: OffenesEreignis): -1 | 0 | 1 => (Number(ev.daten?.kurs ?? 0) as -1 | 0 | 1);
const kriseVon = (ev: OffenesEreignis): KriseArt => String(ev.daten?.krise ?? "unruhen") as KriseArt;

/** Kurs der neuen Führung als Auswahlwert für den Katalog (`{kurs, select, hart {…} nah {…} other {…}}`). */
const KURS: Record<"-1" | "0" | "1", string> = { "-1": "hart", "0": "gleich", "1": "nah" };
/** Stufe der Stabilität (dieselben Schwellen wie stabilitaetWort in sim/welt-modell.ts) als Katalogschlüssel. */
const STABILITAET: Record<string, string> = { stabil: "stabil", gefestigt: "gefestigt", angespannt: "angespannt", "brüchig": "bruechig", "am Rand des Zerfalls": "zerfall" };

/** Land, Zahl des Verbs und Kurs für die Katalogtexte eines Weltereignisses. */
const params = (ev: OffenesEreignis) => ({ land: landFormen(landId(ev)), nz: landZahl(landId(ev)), kurs: KURS[String(kursVon(ev)) as "-1" | "0" | "1"] });

// ---------------------------------------------------------------------------
// Machtwechsel

const MACHTWECHSEL: Vorlage = {
  id: "welt_machtwechsel",
  szene: "istanbul",
  frist: 30,
  abkuehlung: 150,
  chance: () => 0,
  wettbewerb: "aussitzen",
  schwere: 0.8,
  erzeuge: () => ({ provinzen: [], staerke: 0.5, daten: { land: "USA", kurs: 0 } }),
  titel: (_, ev) => t("ev.welt_machtwechsel.titel", params(ev)),
  text: (w, ev) => {
    const e = eigenVon(w, landId(ev));
    return [
      t("ev.welt_machtwechsel.text1", { ...params(ev), wachstum: e.wachstum, inflation: e.inflation, lage: t(`ev.welt.stabilitaet.${STABILITAET[stabilitaetWort(e.stabilitaet)] ?? "angespannt"}`) }),
      t("ev.welt_machtwechsel.text2"),
    ];
  },
  warum: () => t("ev.welt_machtwechsel.warum"),
  optionen: (_, ev) => {
    const id = landId(ev);
    const k = kursVon(ev);
    const p = params(ev);
    const o = (x: string) => `ev.welt_machtwechsel.opt.${x}`;
    return [
      opt("gratulieren", t(o("gratulieren.label")), t(o("gratulieren.beschr"), p), 2, (w) => {
        beziehungAendern(w, id, { vertrauen: 4 + (k === 1 ? 3 : 0), konflikt: -2 });
        return t(o("gratulieren.ausgang"), p);
      }),
      opt("abwarten", t(o("abwarten.label")), t(o("abwarten.beschr"), p), 0, (w) => {
        if (k === -1) beziehungAendern(w, id, { vertrauen: -1.5 });
        return t(o("abwarten.ausgang"), p);
      }),
      opt("fordern", t(o("fordern.label")), t(o("fordern.beschr"), p), 1, (w) => {
        if (k === -1) {
          beziehungAendern(w, id, { vertrauen: -5, konflikt: 4 });
          return t(o("fordern.ausgang.hart"), p);
        }
        beziehungAendern(w, id, { vertrauen: 2, konflikt: -1 });
        return t(o("fordern.ausgang"), p);
      }),
    ];
  },
  standard: (w, ev) => {
    if (kursVon(ev) === -1) beziehungAendern(w, landId(ev), { vertrauen: -1.5 });
    return t("ev.welt_machtwechsel.standard", params(ev));
  },
};

// ---------------------------------------------------------------------------
// Krise

const KRISE: Vorlage = {
  id: "welt_krise",
  szene: "istanbul",
  frist: 30,
  abkuehlung: 150,
  chance: () => 0,
  wettbewerb: "aussitzen",
  schwere: 1.1,
  erzeuge: () => ({ provinzen: [], staerke: 0.5, daten: { land: "EGY", krise: "waehrung" } }),
  titel: (_, ev) => t("ev.welt_krise.titel", { ...params(ev), art: kriseVon(ev) }),
  text: (w, ev) => {
    const e = eigenVon(w, landId(ev));
    // Der erste Satz steht als Zitat unter dem Titel; er wiederholt den Titel nicht (Spielerdurchlauf 5. November:
    // „Währungskrise im Iran. Währungskrise im Iran.“)
    const lage = t(`ev.welt_krise.lage.${kriseVon(ev)}`, {
      ...params(ev),
      inflation: e.inflation,
      defizit: -e.defizit,
      schulden: e.schulden + 20,
      stab: Math.round(e.stabilitaet),
      rueckhalt: Math.round(e.rueckhalt),
    });
    return [lage, t("ev.welt_krise.text2", params(ev))];
  },
  warum: () => t("ev.welt_krise.warum"),
  optionen: (_, ev) => {
    const id = landId(ev);
    const p = params(ev);
    return [
      opt("helfen", t("ev.welt_krise.opt.helfen.label"), t("ev.welt_krise.opt.helfen.beschr", p), 3, (w) => {
        kosten(w, 0.12);
        const e = eigenVon(w, id);
        e.stabilitaet = Math.round(Math.min(100, e.stabilitaet + 10) * 10) / 10;
        if (e.krise) e.krise.bis = Math.min(e.krise.bis, w.day + 60);
        beziehungAendern(w, id, { vertrauen: 8, handel: 4, konflikt: -3 });
        wirke(w, "ansehen", 0.5);
        return t("ev.welt_krise.opt.helfen.ausgang", { ...p, stab: Math.round(e.stabilitaet) });
      }),
      opt("sichern", t("ev.welt_krise.opt.sichern.label"), t("ev.welt_krise.opt.sichern.beschr", p), 1, (w) => {
        if (NET.index.has("terrorgefahr")) wirke(w, "terrorgefahr", -0.3);
        beziehungAendern(w, id, { vertrauen: -1.5 });
        return t("ev.welt_krise.opt.sichern.ausgang", p);
      }),
    ];
  },
  standard: (w, ev) => {
    const id = landId(ev);
    wirke(w, "export", -0.4);
    if (NET.index.has("terrorgefahr")) wirke(w, "terrorgefahr", 0.3);
    beziehungAendern(w, id, { vertrauen: -3 });
    return t("ev.welt_krise.standard", params(ev));
  },
};

// ---------------------------------------------------------------------------
// Aufgedeckter Einflussversuch gegen die Türkei (Spiegelbild der eigenen Operationen)

const EINFLUSS: Vorlage = {
  id: "welt_einfluss",
  szene: "istanbul",
  frist: 30,
  abkuehlung: 90,
  chance: () => 0,
  wettbewerb: "aussitzen",
  schwere: 1,
  erzeuge: () => ({ provinzen: [], staerke: 0.5, daten: { land: "RUS", art: "einfluss", opId: 0 } }),
  titel: (_, ev) => t("ev.welt_einfluss.titel", { ...params(ev), art: t(`ev.welt_einfluss.art.${artVon(ev)}`) }),
  text: (_, ev) => [t(`ev.welt_einfluss.text1.${artVon(ev)}`, params(ev)), t("ev.welt_einfluss.text2")],
  warum: () => t("ev.welt_einfluss.warum"),
  optionen: (w, ev) => {
    const von = landId(ev);
    const art = artVon(ev);
    const op = opIdVon(ev);
    const p = params(ev);
    const anteil = (100 * GEGENSPIONAGE_KAPAZITAET) / Math.max(1, kapazitaetMax(w));
    return [
      opt("gegenspionage", t("ev.welt_einfluss.opt.gegenspionage.label"), t("ev.welt_einfluss.opt.gegenspionage.beschr", { anteil }), 2, (ww) => beantworteEinfluss(ww, op, von, art, "gegenspionage")),
      opt("oeffentlich", t("ev.welt_einfluss.opt.oeffentlich.label"), t("ev.welt_einfluss.opt.oeffentlich.beschr", p), 1, (ww) => beantworteEinfluss(ww, op, von, art, "oeffentlich")),
      opt("mediengesetz", t("ev.welt_einfluss.opt.mediengesetz.label"), t("ev.welt_einfluss.opt.mediengesetz.beschr"), 3, (ww) => beantworteEinfluss(ww, op, von, art, "mediengesetz")),
    ];
  },
  standard: (w, ev) => beantworteEinfluss(w, opIdVon(ev), landId(ev), artVon(ev), "nichts"),
};

const artVon = (ev: OffenesEreignis): "einfluss" | "medien" | "abhoeren" => String(ev.daten?.art ?? "einfluss") as "einfluss" | "medien" | "abhoeren";
const opIdVon = (ev: OffenesEreignis): number => Number(ev.daten?.opId ?? 0);

export const WELT_VORLAGEN: Vorlage[] = [MACHTWECHSEL, KRISE, EINFLUSS];

// ---------------------------------------------------------------------------
// Der Haken: höchstens ein Großereignis in 150 Tagen, nur bei freiem Schreibtisch

const MACHT_RELEVANT = new Set(["USA", "EU", "RUS", "GRC", "IRN", "ISR", "SAU", "AZE", "EGY", "CYP", "DEU", "FRA", "GBR", "IRQ", "SYR", "ARM"]);
const KRISE_RELEVANT = new Set(["SYR", "IRQ", "IRN", "EGY", "GEO", "ARM", "AZE", "UKR", "LBY", "KAZ", "CYP", "GRC", "PAK", "ETH"]);

function legeVor(w: World, m: WeltModell, rng: Rng): void {
  const k = m.ereignisKandidaten ?? [];
  if (k.length === 0) return;
  const spiel = w.spiel!;
  if (spiel.ereignisse.length >= 2) return;
  // Aufgedeckte Einflussversuche gegen die Türkei haben Vorrang und einen kürzeren Abstand
  const fremd = k.find((x) => x.art === "einfluss");
  if (fremd && w.day - m.ereignisTag >= 60 && !spiel.ereignisse.some((e) => e.vorlage === "welt_einfluss")) {
    const ev = oeffne(w, "welt_einfluss", rng, { provinzen: [], staerke: 0.5, daten: { land: fremd.id, art: fremd.einfluss ?? "einfluss", opId: fremd.opId ?? 0 } });
    if (ev) m.ereignisTag = w.day;
    return;
  }
  // Der Beistandsruf eines Pakt-Partners hat ebenfalls Vorrang: Er verlangt eine Antwort, solange der Krieg des Partners läuft
  const beistand = k.find((x) => x.art === "beistand");
  if (beistand && w.day - m.ereignisTag >= 30 && !spiel.ereignisse.some((e) => e.vorlage === "krieg_beistandsruf")) {
    const ev = oeffne(w, "krieg_beistandsruf", rng, { provinzen: [], staerke: 0.5, daten: { partner: beistand.partner ?? beistand.id, gegner: beistand.gegner ?? "", pakt: beistand.pakt ?? "", krieg: beistand.krieg ?? "" } });
    if (ev) {
      m.ereignisTag = w.day;
      rufVermerken(w, beistand.krieg ?? "", beistand.pakt ?? "");
    }
    return;
  }
  if (w.day - m.ereignisTag < WELT_REGELN.ereignisAbstand) return;
  const kandidaten = k.filter((x) => (x.art === "machtwechsel" ? MACHT_RELEVANT.has(x.id) : x.art === "krise" ? KRISE_RELEVANT.has(x.id) : false));
  if (kandidaten.length === 0) return;
  const wahl = kandidaten[Math.floor(rng.next() * kandidaten.length)]!;
  const ev =
    wahl.art === "machtwechsel"
      ? oeffne(w, "welt_machtwechsel", rng, { provinzen: [], staerke: 0.5, daten: { land: wahl.id, kurs: wahl.kurs ?? 0 } })
      : oeffne(w, "welt_krise", rng, { provinzen: [], staerke: 0.5, daten: { land: wahl.id, krise: wahl.krise ?? "unruhen" } });
  if (ev) m.ereignisTag = w.day;
}

setzeEreignisHaken(legeVor);

