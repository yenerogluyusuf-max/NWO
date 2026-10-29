// Große Weltereignisse als Entscheidungen für den Spieler: ein Machtwechsel bei einem wichtigen Gegenüber und der Ausbruch einer Krise bei
// einem Nachbarn oder Partner (Währungskrise, Staatsbankrott, Unruhen, Grenzgefechte). Das Weltmodell (sim/welt-modell.ts) merkt sie vor;
// dieses Modul legt höchstens eines in 150 Tagen vor und nur, wenn der Schreibtisch nicht ohnehin voll ist.
// Alle Zahlen sind Spielparameter (Platzhalter der Kalibrierung), keine Tatsachenbehauptungen.

import { WELT_REGELN } from "../data/welt-daten";
import { opt, kosten, nf } from "./ereignis-hilfen";
import type { Vorlage } from "./ereignis-hilfen";
import { oeffne } from "./ereignisse";
import { wirke } from "./wirkung";
import { NET } from "./modell";
import {
  KRISE_NAME,

  akteurDat,
  akteurDef,
  akteurName,
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
import { EINGEHEND_NAME, beantworteEinfluss } from "./welt-dienst";
import type { OffenesEreignis } from "./spiel-typen";
import type { Rng } from "./rng";
import type { World } from "./types";

const landId = (ev: OffenesEreignis): string => String(ev.daten?.land ?? "USA");
const kursVon = (ev: OffenesEreignis): -1 | 0 | 1 => (Number(ev.daten?.kurs ?? 0) as -1 | 0 | 1);
const kriseVon = (ev: OffenesEreignis): KriseArt => String(ev.daten?.krise ?? "unruhen") as KriseArt;

const KURS_TEXT: Record<"-1" | "0" | "1", string> = {
  "-1": "Die neue Führung schlägt einen härteren Ton gegenüber Ankara an.",
  "0": "Die neue Führung hält an der bisherigen Linie gegenüber Ankara fest.",
  "1": "Die neue Führung sucht die Annäherung an Ankara.",
};

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
  titel: (_, ev) => `Machtwechsel ${akteurDef(landId(ev)).inLand}`,
  text: (w, ev) => {
    const id = landId(ev);
    const d = akteurDef(id);
    const e = eigenVon(w, id);
    return [
      `${d.sitz} hat eine neue Führung. ${KURS_TEXT[String(kursVon(ev)) as "-1" | "0" | "1"]} Das Land steht bei ${nf(e.wachstum)} Prozent Wachstum und ${nf(e.inflation)} Prozent Inflation, die Lage gilt als ${stabilitaetWort(e.stabilitaet)}.`,
      "Der Außenminister legt drei Wege vor: sofort gratulieren und zu einem Besuch einladen, abwarten und den Kurs beobachten, oder gleich die eigenen Forderungen auf den Tisch legen.",
    ];
  },
  warum: () => "Das Weltmodell lässt die Staaten nach ihren Amtszeiten wählen und gelegentlich auch außerhalb der Wahlen die Führung wechseln; Termine folgen den Verfassungen.",
  optionen: (_, ev) => {
    const id = landId(ev);
    const k = kursVon(ev);
    const name = akteurName(id);
    return [
      opt(
        "gratulieren",
        "Gratulieren und einladen",
        "Kostet 2 Kapital. Ein früher Besuch verbessert das Verhältnis, vor allem wenn die neue Führung ohnehin Nähe sucht; zu Hause kann es als Anbiedern gelten.",
        2,
        (w) => {
          beziehungAendern(w, id, { vertrauen: 4 + (k === 1 ? 3 : 0), konflikt: -2 });
          return `Ankara gratuliert ${akteurDat(id)} sofort und lädt zu einem Besuch ein: ${k === 1 ? "Die Einladung trifft auf offene Ohren." : k === -1 ? "Die Geste mildert den härteren Ton ein wenig." : "Das Verhältnis wird wärmer."}`;
        },
      ),
      opt(
        "abwarten",
        "Abwarten",
        "Kostet nichts. Ankara beobachtet den Kurs; eine neue Führung mit hartem Ton nutzt das Schweigen.",
        0,
        (w) => {
          if (k === -1) beziehungAendern(w, id, { vertrauen: -1.5 });
          return `Ankara wartet ab und beobachtet den Kurs ${akteurDat(id)}.${k === -1 ? " Die neue Führung legt das Schweigen als Schwäche aus." : ""}`;
        },
      ),
      opt(
        "fordern",
        "Eigene Forderungen stellen",
        `Kostet 1 Kapital. Wer früh Forderungen stellt, prägt den Anfang — bei einem harten Kurs ${name} eskaliert es, sonst ist es ein starkes Signal.`,
        1,
        (w) => {
          if (k === -1) {
            beziehungAendern(w, id, { vertrauen: -5, konflikt: 4 });
            return `Die Forderungen treffen auf eine Führung, die den Konflikt sucht: Das Verhältnis zu ${akteurDat(id)} verschlechtert sich.`;
          }
          beziehungAendern(w, id, { vertrauen: 2, konflikt: -1 });
          return `Die Forderungen werden ernst genommen: ${akteurName(id)} verspricht, sie zu prüfen.`;
        },
      ),
    ];
  },
  standard: (w, ev) => {
    if (kursVon(ev) === -1) beziehungAendern(w, landId(ev), { vertrauen: -1.5 });
    return `Ankara lässt den Machtwechsel ${akteurDef(landId(ev)).inLand} unbeantwortet.`;
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
  titel: (_, ev) => `${KRISE_NAME[kriseVon(ev)]} ${akteurDef(landId(ev)).inLand}`,
  text: (w, ev) => {
    const id = landId(ev);
    const e = eigenVon(w, id);
    const art = kriseVon(ev);
    const lage =
      art === "waehrung"
        ? `Die Inflation liegt bei ${nf(e.inflation)} Prozent, das Defizit bei ${nf(-e.defizit)} Prozent des BIP.`
        : art === "zahlungsausfall"
          ? `Die Schulden stehen bei ${nf(e.schulden + 20, 0)} Prozent des BIP; ${akteurName(id)} kann sie nicht mehr bedienen.`
          : art === "grenzkrise"
            ? `Die Spannung mit dem Nachbarn ist so hoch, dass es zu Gefechten kommt; die Stabilität liegt bei ${Math.round(e.stabilitaet)} von 100.`
            : `Die Stabilität liegt bei ${Math.round(e.stabilitaet)} von 100, der Rückhalt der Führung bei ${Math.round(e.rueckhalt)}.`;
    return [
      `${KRISE_NAME[art]} ${akteurDef(id).inLand}. ${lage}`,
      `Für die Türkei hängt daran einiges: Handel, Sicherheit an der Grenze und die Frage, wer in ${akteurName(id)} Einfluss gewinnt, wenn niemand hilft. Der Stab schlägt vor, jetzt zu helfen, die Grenze zu sichern oder zuzusehen.`,
    ];
  },
  warum: () => "Das Weltmodell lässt Staaten bei hoher Inflation, Schuldenlast und Instabilität in Krisen geraten; die Wahrscheinlichkeit folgt ihren Kennzahlen.",
  optionen: (_, ev) => {
    const id = landId(ev);
    return [
      opt(
        "helfen",
        "Finanzhilfe und Beistand anbieten",
        `Kostet 3 Kapital und etwa 0,12 Prozent des BIP. Die Krise klingt schneller ab, ${akteurName(id)} bindet sich enger an Ankara.`,
        3,
        (w) => {
          kosten(w, 0.12);
          const e = eigenVon(w, id);
          e.stabilitaet = Math.round(Math.min(100, e.stabilitaet + 10) * 10) / 10;
          if (e.krise) e.krise.bis = Math.min(e.krise.bis, w.day + 60);
          beziehungAendern(w, id, { vertrauen: 8, handel: 4, konflikt: -3 });
          wirke(w, "ansehen", 0.5);
          return `Ankara hilft ${akteurDat(id)}: Die Lage stabilisiert sich auf ${Math.round(e.stabilitaet)} von 100, das Vertrauen wächst.`;
        },
      ),
      opt(
        "sichern",
        "Grenze und Handel absichern",
        "Kostet 1 Kapital. Die Türkei schützt sich vor Flüchtlingen und Schmuggel, hilft aber nicht; das Land merkt es.",
        1,
        (w) => {
          if (NET.index.has("terrorgefahr")) wirke(w, "terrorgefahr", -0.3);
          beziehungAendern(w, id, { vertrauen: -1.5 });
          return `Ankara sichert die Grenze zu ${akteurDat(id)} und schränkt den Handel ein: Die Folgen für die Türkei bleiben begrenzt, das Verhältnis kühlt ab.`;
        },
      ),
    ];
  },
  standard: (w, ev) => {
    const id = landId(ev);
    wirke(w, "export", -0.4);
    if (NET.index.has("terrorgefahr")) wirke(w, "terrorgefahr", 0.3);
    beziehungAendern(w, id, { vertrauen: -3 });
    return `Ankara sieht der Krise ${akteurDef(id).inLand} zu: Der Handel leidet, die Grenze wird unruhiger, und ${akteurName(id)} merkt, wer nicht geholfen hat.`;
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
  titel: (_, ev) => `${EINGEHEND_NAME[artVon(ev)]} aufgedeckt: ${akteurName(landId(ev))}`,
  text: (_, ev) => {
    const art = artVon(ev);
    const name = akteurName(landId(ev));
    return [
      `Der Dienst meldet: ${name} betreibt eine ${EINGEHEND_NAME[art].toLowerCase()} gegen die Türkei${art === "einfluss" ? " — Geld, Medien und Netzwerke sollen die Stimmung vor der Wahl drehen" : art === "medien" ? " — gezielte Falschmeldungen sollen die Regierung schwächen" : " — Gespräche des Präsidialamts sollen abgehört werden"}.`,
      "Der Stab legt drei Antworten vor: den Dienst verstärken und still abfangen, den Vorgang öffentlich machen oder das Mediengesetz verschärfen. Wer nichts tut, zahlt mit Rückhalt.",
    ];
  },
  warum: () => "Andere Staaten betreiben Einflussoperationen gegen die Türkei, vor allem in den Monaten vor einer Wahl und bei hoher Spannung; was aufgedeckt wird, legt das Spiel vor.",
  optionen: (_, ev) => {
    const von = landId(ev);
    const art = artVon(ev);
    const op = opIdVon(ev);
    return [
      opt("gegenspionage", "Gegenspionage verstärken", "Kostet 2 Kapital und 15 Dienstkapazität. Fängt den Großteil ab, bindet den Dienst und macht weitere Entdeckungen wahrscheinlicher.", 2, (w) => beantworteEinfluss(w, op, von, art, "gegenspionage")),
      opt("oeffentlich", "Öffentlich machen und einbestellen", `Kostet 1 Kapital. Die Regierung gewinnt Rückhalt, das Verhältnis zu ${akteurDat(von)} kühlt ab.`, 1, (w) => beantworteEinfluss(w, op, von, art, "oeffentlich")),
      opt("mediengesetz", "Mediengesetz verschärfen", "Kostet 3 Kapital. Ausländische Kampagnen werden schwerer, aber Pressefreiheit und das Vertrauen der EU leiden.", 3, (w) => beantworteEinfluss(w, op, von, art, "mediengesetz")),
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

