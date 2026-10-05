// Ereignisvorlagen der Vermittlung zwischen Drittstaaten (AUS-4): die Auto-Stops der Klasse A.
//   vermittlung_spoiler — eine Seite oder ein Dritter torpediert die Annäherung (Provokation,
//                         Hardliner-Gewinn, Sabotage, Ultimatum); Antwortmuster: verurteilen /
//                         dämpfen / ignorieren.
//   vermittlung_verstoss — eine Seite bricht die vereinbarte Umsetzung, die Ankara garantiert;
//                         Antwortmuster: eingreifen / dämpfen / hinnehmen (Garantie-Bruch).
// Beide werden nur vom Vermittlungs-Motor geöffnet (chance 0) und führen dieselben Folgen aus
// wie die Anzeige — der Kern (sim/vermittlung.ts) bleibt die einzige Wahrheitsquelle.
// Alle Zahlen sind Spielparameter (Platzhalter der Kalibrierung), keine Tatsachenbehauptungen.

import { KONFLIKTE, KONFLIKT_NACH_ID, SPOILER_ARTEN, type SpoilerArtId } from "../data/konflikte";
import { beschr, opt } from "./ereignis-hilfen";
import { konfliktZustand, spoilerFolge, verstossFolge } from "./vermittlung";
import type { Vorlage } from "./ereignis-hilfen";
import type { World } from "./types";
import type { OffenesEreignis } from "./spiel-typen";

/** Konflikt der Datenlage, mit Standardfall für die Text-Öffnung ohne Übergabe. */
function konfliktVon(ev: OffenesEreignis) {
  return KONFLIKT_NACH_ID[String(ev.daten?.konflikt ?? "")] ?? KONFLIKTE[0]!;
}

function seiteName(ev: OffenesEreignis): string {
  const def = konfliktVon(ev);
  return ev.daten?.seite === "b" ? def.b.name : def.a.name;
}

function spoilerArt(ev: OffenesEreignis) {
  return SPOILER_ARTEN[(String(ev.daten?.art ?? "provokation") as SpoilerArtId)] ?? SPOILER_ARTEN.provokation;
}

/** Öffnung ohne Übergabe (Text-Prüfung): den ersten Konflikt mit einer Standard-Provokation. */
const erzeugeStandard = () => ({ provinzen: [], staerke: 1, daten: { konflikt: KONFLIKTE[0]!.id, art: "provokation", seite: "a" } });

const SPOILER: Vorlage = {
  id: "vermittlung_spoiler",
  szene: "istanbul",
  frist: 10,
  abkuehlung: 1,
  chance: () => 0,
  erzeuge: erzeugeStandard,
  titel: (_, ev) => `Spoiler bei der Vermittlung: ${konfliktVon(ev).titel}`,
  text: (w, ev) => {
    const def = konfliktVon(ev);
    const art = spoilerArt(ev);
    const z = konfliktZustand(w, def.id);
    return [
      art.text.replace("{seite}", seiteName(ev)),
      `Die Reife der Lage liegt bei ${Math.round(z.reif)} von 100: Wer die Annäherung fürchtet, hat jetzt das größte Interesse, sie zu beschädigen.`,
    ];
  },
  warum: () => "Spoiler sind der klassische Grund, warum Vermittlungen scheitern: Wer vom Konflikt profitiert, schlägt genau dann zu, wenn der Ausgleich näher rückt. Jede Antwort ist ein Signal — an die Spoiler, an die andere Seite und an die eigene Glaubwürdigkeit als Vermittler.",
  optionen: (_, ev) => [
    opt("verurteilen", "Öffentlich verurteilen", beschr(2, 0, "klare Kante gegen die Spoiler; die Beziehung zu der einen Seite leidet (−6), die andere fühlt sich geschützt."), 2, (w, ev2) => spoilerFolge(w, ev2, "verurteilen")),
    opt("daempfen", "Diskret dämpfen", beschr(3, 0, "der Schaden bleibt klein, ohne dass jemand das Gesicht verliert — kostet Kapital."), 3, (w, ev2) => spoilerFolge(w, ev2, "daempfen")),
    opt("ignorieren", "Ignorieren", beschr(0, 0, "kostet nichts; die Spoiler lesen es als Freibrief (Reif −)."), 0, (w, ev2) => spoilerFolge(w, ev2, "ignorieren")),
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
  titel: (_, ev) => `Verstoß gegen die Vereinbarung: ${konfliktVon(ev).titel}`,
  text: (w, ev) => {
    const def = konfliktVon(ev);
    const z = konfliktZustand(w, def.id);
    return [
      `Die vereinbarte Umsetzung zwischen ${def.a.name} und ${def.b.name} ist gebrochen worden: Verletzungen an der Linie, blockierte Schritte, Schuldzuweisungen beider Seiten. Ankara garantiert die Vereinbarung — jetzt schaut die Welt auf den Garanten.`,
      z.garantie === "militaer"
        ? "Die militärische Garantie lässt zwei Wege: eingreifen und die Vereinbarung durchsetzen — oder den Gesichtsverlust der Garantiemacht hinnehmen."
        : "Die Garantie lässt Spielraum: dämpfen und die Vereinbarung retten — oder den Verstoß hinnehmen und die Bürgschaft verlieren.",
    ];
  },
  warum: () => "Eine Garantie kauft Verantwortung: Wer bürgt, wird am ersten Verstoß gemessen. Durchsetzen kostet Geld und Risiko, Dämpfen kostet Abschreckung, Hinnehmen kostet das Gesicht — und vielleicht die ganze Vermittlung.",
  optionen: (w, ev) => {
    const def = konfliktVon(ev);
    const z = konfliktZustand(w, def.id);
    const liste = [
      opt("daempfen", "Auf allen Kanälen dämpfen", beschr(4, 0, "die Garantie steht, aber beide Seiten lernen, dass Verstöße billig sind."), 4, (w2, ev2) => verstossFolge(w2, ev2, "daempfen")),
      opt("hinnehmen", "Den Verstoß hinnehmen", beschr(0, 0, "die Garantie bricht: Gesichtsverlust (Ansehen −6), die Lage fällt zurück."), 0, (w2, ev2) => verstossFolge(w2, ev2, "hinnehmen")),
    ];
    if (z.garantie === "militaer") {
      liste.unshift(
        opt("eingreifen", "Eingreifen und die Garantie durchsetzen", beschr(0, 0.3, "teuer und riskant; die Garantie gilt, und alle rechnen künftig mit Ankara."), 0, (w2, ev2) => verstossFolge(w2, ev2, "eingreifen")),
      );
    }
    return liste;
  },
  standard: (w, ev) => verstossFolge(w, ev, "hinnehmen"),
};

export const VERMITTLUNG_VORLAGEN: Vorlage[] = [SPOILER, VERSTOSS];
