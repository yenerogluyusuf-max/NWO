// Ereignisvorlagen des Konfliktvorgangs (MIL-1): die Auto-Stops der Klasse A.
//   krieg_drohkulisse — die Eskalation verlangt eine Entscheidung (Phasenwechsel)
//   krieg_waffenruhe  — der Gegner bietet mitten im Krieg Waffenruhe an (Suzerain-Lücke gefüllt)
//   putschgeruechte   — nach Niederlage oder Gebietsabtretung bei zerbrochenem Offiziersvertrauen
// Alle drei werden nur vom Kriegsmotor geöffnet (chance 0) und führen dieselben Handlungen aus
// wie Dossier, Parser und KI — der Kern bleibt die einzige Wahrheitsquelle.
// Alle Zahlen sind Spielparameter (Platzhalter der Kalibrierung), keine Tatsachenbehauptungen.

import { wirke, vertrauenAendern } from "./wirkung";
import { land } from "./laender";
import { NET } from "./modell";
import { nationalAverage } from "./netz";
import { opt } from "./ereignis-hilfen";
import { aktiveKriege, fuehreKriegHandlungAus, waffenruheFuerAngebot } from "./krieg";
import type { Vorlage } from "./ereignis-hilfen";
import type { World } from "./types";
import type { OffenesEreignis } from "./spiel-typen";

const landName = (ev: OffenesEreignis): string => {
  try {
    return land(String(ev.daten?.land ?? "")).name;
  } catch {
    return "Griechenland"; // Standardfall des Szenarios (Text-Öffnung ohne Übergabe)
  }
};
const vorgangId = (ev: OffenesEreignis): string => String(ev.daten?.vorgang ?? "");
const offiziersvertrauen = (w: World): number => nationalAverage(NET, w.net, "offiziersvertrauen");

/** Öffnung ohne Übergabe (Text-Prüfung): den laufenden Vorgang nehmen, sonst den Standard-Spannungsfall. */
const erzeugeKrieg = (w: World) => {
  const k = aktiveKriege(w)[0];
  return { provinzen: [], staerke: 1, daten: { land: k?.land ?? "GRC", vorgang: k?.id ?? "" } };
};

const KRIEG_DROHKULISSE: Vorlage = {
  id: "krieg_drohkulisse",
  szene: "istanbul",
  frist: 12,
  abkuehlung: 1,
  chance: () => 0,
  erzeuge: erzeugeKrieg,
  titel: (_, ev) => `Drohkulisse: Die Lage mit ${landName(ev)} spitzt sich zu`,
  text: (w, ev) => [
    `Aus den Zwischenfällen mit ${landName(ev)} ist eine Drohkulisse geworden. Der Generalstab legt Lagebilder vor, die Fraktionen warten auf eine Linie, die Kommentatoren riechen Blut.`,
    "Jetzt zählt jede Handlung: Bereitschaft zeigen, vermitteln lassen, die Lage beruhigen — oder ein Kriegsziel deklarieren, das die Preise aller Folgehandlungen festlegt. Das vollständige Dossier steht in der Welt-Ansicht.",
  ],
  warum: () => "Die Eskalationsphase ist die Hauptspielfläche: Wer vorbereitet ist und eine konsistente Linie fährt, zahlt später den kleineren Preis; wer aussitzt, lässt den Gegner die Fakten setzen.",
  optionen: () => [
    opt("mobil", "Teilmobilmachung anordnen", "Kostet 8 Kapital und 0,3 % des BIP; die Stärke steigt, die Eskalation auch.", 8, (w, ev, rng) => fuehreKriegHandlungAus(w, vorgangId(ev), "mobil_teil", rng).text),
    opt("vermittlung", "Vermittlung rufen", "Kostet 5 Kapital; bei Erfolg lässt die Eskalation deutlich nach.", 5, (w, ev, rng) => fuehreKriegHandlungAus(w, vorgangId(ev), "vermittlung", rng).text),
    opt("deeskalation", "Die Lage beruhigen", "Kostet 4 Kapital; Nationalisten lesen es als Schwäche.", 4, (w, ev, rng) => fuehreKriegHandlungAus(w, vorgangId(ev), "deeskalation", rng).text),
  ],
  standard: () => "Die Regierung entscheidet nicht; die Drohkulisse hält an und der Gegner setzt die Fakten.",
};

const KRIEG_WAFFENRUHE: Vorlage = {
  id: "krieg_waffenruhe",
  szene: "istanbul",
  frist: 14,
  abkuehlung: 1,
  chance: () => 0,
  erzeuge: erzeugeKrieg,
  titel: (_, ev) => `${landName(ev)} bietet Waffenruhe an`,
  text: (w, ev) => [
    `Über Vermittler lässt ${landName(ev)} ausrichten, es sei zu einer Waffenruhe bereit. Die Erschöpfung der Gegenseite scheint weit genug — oder es ist eine Falle, um Zeit zu gewinnen.`,
    "Nimmt die Regierung an, schweigen die Waffen und der Verhandlungstisch entscheidet über Gebiet, Reparationen, Garantien und Rückzug. Lehnt sie ab, liest die Heimatfront das als Härte — und die Gegenseite als Schwäche des Angebots.",
  ],
  warum: () => "Eine Waffenruhe ist kein Frieden: Sie öffnet den Verhandlungstisch, ohne die Rechnung zu begleichen. Der Innenpreis des Friedens hängt auch davon ab, wie frei die Presse berichten darf.",
  optionen: () => [
    opt("annehmen", "Waffenruhe annehmen", "Kostet nichts; die Waffen schweigen, der Verhandlungstisch öffnet sich.", 0, (w, ev) => waffenruheFuerAngebot(w, vorgangId(ev))),
    opt("ablehnen", "Ablehnen und weiterkämpfen", "Kostet nichts; die Heimatfront hält es aus (Uhr −3), der Krieg geht weiter.", 0, (w, ev) => {
      const k = w.spiel?.kriege?.find((x) => x.id === vorgangId(ev));
      if (!k) return "Das Angebot ist gegenstandslos geworden.";
      k.gegnerAngebot = false;
      k.uhr = Math.max(0, k.uhr - 3);
      k.eskalation = Math.min(100, k.eskalation + 2);
      return "Die Regierung lehnt die Waffenruhe ab; die Operationen gehen weiter.";
    }),
  ],
  standard: (w, ev) => {
    const k = w.spiel?.kriege?.find((x) => x.id === vorgangId(ev));
    if (k) {
      k.gegnerAngebot = false;
      k.uhr = Math.max(0, k.uhr - 3);
    }
    return "Ohne Antwort verfällt das Angebot; der Krieg geht weiter.";
  },
};

const PUTSCHGERUECHTE: Vorlage = {
  id: "putschgeruechte",
  szene: "istanbul",
  frist: 12,
  abkuehlung: 3650,
  chance: () => 0,
  erzeuge: erzeugeKrieg,
  titel: () => "Putschgerüchte im Generalstab",
  text: (w) => [
    `Nach der militärischen Schmach sprechen Offiziere offen über die Verantwortung der Regierung. Das Vertrauen im Offizierskorps liegt bei ${Math.round(offiziersvertrauen(w))} von 100 — zerbrochen.`,
    "In den Kasernen kursieren Namen. Der Geheimdienst legt Listen vor; die Frage ist, ob die Regierung die Führung diszipliniert oder einbindet, bevor andere die Initiative ergreifen.",
  ],
  warum: () => "Gebietsabtretung und Niederlage sind die klassischen Putsch-Auslöser: Ein Offizierskorps, das die Regierung für den Schaden verantwortlich macht, braucht nur noch einen Anlass.",
  optionen: () => [
    opt("ordnung", "Die Generäle zur Ordnung rufen", "Kostet 5 Kapital; Offiziersvertrauen −4, Legitimität −2, aber die Reihen schließen sich vorerst.", 5, (w) => {
      wirke(w, "offiziersvertrauen", -4);
      wirke(w, "legitimitaet", -2);
      wirke(w, "nationalisten", 1);
      return "Die Regierung rügt die lauten Generäle öffentlich; das Korps gehorcht — und merkt sich den Ton.";
    }),
    opt("einbinden", "Die Offiziere einbinden", "Kostet 8 Kapital; Offiziersvertrauen +6, Nationalisten −2, Zustimmung −1.", 8, (w) => {
      wirke(w, "offiziersvertrauen", 6);
      wirke(w, "nationalisten", -2);
      w.spiel!.umfrage.zustimmung = Math.max(0, w.spiel!.umfrage.zustimmung - 1);
      return "Ein Sonderstab aus Offizieren soll die Schmach aufarbeiten; das Korps fühlt sich ernst genommen.";
    }),
  ],
  standard: (w) => {
    wirke(w, "offiziersvertrauen", -6);
    wirke(w, "legitimitaet", -3);
    vertrauenAendern(w, -2);
    return "Die Gerüchte wachsen unbeantwortet weiter; das Korps liest das Schweigen als Schwäche.";
  },
};

export const KRIEG_VORLAGEN: Vorlage[] = [KRIEG_DROHKULISSE, KRIEG_WAFFENRUHE, PUTSCHGERUECHTE];
