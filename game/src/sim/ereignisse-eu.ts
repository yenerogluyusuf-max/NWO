// Ereignisvorlagen des EU-Beitrittsvorgangs (AUS-2): die Auto-Stopps der Klasse A.
//   eu_veto      — ein benannter Mitgliedstaat (Griechenland, Zypern) legt sein Veto gegen eine
//                  Kapitel-Eröffnung: Zugeständnis oder ein Jahr Stillstand
//   eu_zollunion — Brüssel bietet das Mandat für das Zollunion-Update an: annehmen oder vertagen
// Beide werden nur vom EU-Motor geöffnet (chance 0) und rufen dieselben Funktionen wie das
// Dossier — der Kern (sim/eu.ts) bleibt die einzige Wahrheitsquelle.
// Alle Zahlen sind Spielparameter (Platzhalter der Kalibrierung), keine Tatsachenbehauptungen.

import { land } from "./laender";
import { opt, nf } from "./ereignis-hilfen";
import { EU_REGELN, KAPITEL_NACH_ID, vetoAbwarten, vetoBeantworten, zollunionAblehnen, zollunionAnnehmen, zypernBewegung } from "./eu";
import type { Vorlage } from "./ereignis-hilfen";
import type { World } from "./types";
import type { OffenesEreignis } from "./spiel-typen";

const landId = (ev: OffenesEreignis): string => String(ev.daten?.land ?? "GRC");
const kapitelId = (ev: OffenesEreignis): string => String(ev.daten?.kapitel ?? "k23");
const landName = (ev: OffenesEreignis): string => {
  try {
    return land(landId(ev)).name;
  } catch {
    return "Griechenland";
  }
};
const kapitelName = (ev: OffenesEreignis): string => {
  const def = KAPITEL_NACH_ID.get(kapitelId(ev));
  return def ? `Kapitel ${def.nummer} „${def.name}“` : "das Kapitel";
};

const EU_VETO: Vorlage = {
  id: "eu_veto",
  szene: "istanbul",
  frist: 21,
  abkuehlung: 90,
  chance: () => 0,
  erzeuge: () => ({ provinzen: [], staerke: 0.5, daten: { land: "GRC", kapitel: "k23" } }),
  titel: (_, ev) => `${landName(ev)} legt ein Veto gegen ${kapitelName(ev)} ein`,
  text: (w, ev) => {
    const zypern = landId(ev) === "CYP" ? ` ${zypernBewegung(w).text}` : "";
    return [
      `Die Kriterien für ${kapitelName(ev)} wären erfüllt — doch im Rat der Europäischen Union legt ${landName(ev)} sein Veto ein. Erweiterung braucht Einstimmigkeit; ein einziges Mitglied genügt.${zypern}`,
      "Der Außenminister legt zwei Wege vor: ein sichtbares Zugeständnis, das den Konflikt entschärft und das Veto aufhebt — oder abwarten, bis sich die Lage dreht, was das Kapitel für ein Jahr blockiert.",
    ];
  },
  warum: () =>
    "Dokumentiert: Griechenland und Zypern nutzen ihre Vetomacht gegen jeden EU-Schritt Richtung Ankara, solange die Streitpunkte offen sind (RECHERCHE_REALWELT_LAENDERDOSSIERS.md, Dossier 2, Rote Linie 3; Dossier 17, Rote Linie 5).",
  optionen: (_, ev) => [
    opt(
      "zugestaendnis",
      "Zugeständnis anbieten",
      `Kostet ${EU_REGELN.pkVetoZugestaendnis} Kapital; entschärft den Konflikt und hebt das Veto — national gesinnte Wähler lesen es als Nachgeben.`,
      EU_REGELN.pkVetoZugestaendnis,
      (w) => vetoBeantworten(w, landId(ev), kapitelId(ev)),
    ),
    opt("abwarten", "Abwarten", `Kostet nichts; ${kapitelName(ev)} bleibt ein Jahr blockiert und Brüssel verliert etwas Vertrauen.`, 0, (w) => vetoAbwarten(w, landId(ev), kapitelId(ev))),
  ],
  standard: (w, ev) => vetoAbwarten(w, landId(ev), kapitelId(ev)),
};

const EU_ZOLLUNION: Vorlage = {
  id: "eu_zollunion",
  szene: "istanbul",
  frist: 30,
  abkuehlung: 365,
  chance: () => 0,
  erzeuge: () => ({ provinzen: [], staerke: 0.5 }),
  titel: () => "Brüssel bietet das Mandat für das Zollunion-Update an",
  text: () => [
    `Mit den geschlossenen Kapiteln ist die Türkei weit genug: Brüssel bietet das Mandat an, die Zollunion von 1995 zu modernisieren — Dienstleistungen, öffentliche Vergaben und Agrar kommen auf den Tisch.`,
    "Das Update ist ein echtes Zwischenziel mit einem echten Preis: Die Industrie und die Exporteure gewinnen Zugang, die Landwirtschaft verliert Schutzzölle und steht im Wettbewerb. Wer ablehnt, wartet Jahre auf das nächste Angebot.",
  ],
  warum: () =>
    `Das Mandat kommt mit ${EU_REGELN.zollunionKapitel} vorläufig geschlossenen Kapiteln in Reichweite (Spielparameter; RECHERCHE_REALWELT_LAENDERDOSSIERS.md, Dossier 2: Griechenland und Zypern bremsten das Update bisher).`,
  optionen: () => [
    opt(
      "annehmen",
      "Das Mandat annehmen",
      `Export +, Industrie +, Investitionen +, Risikoaufschlag sinkt um ${nf(40, 0)} Punkte; die Landwirtschaft verliert Schutz (Einkommen −, Landwirte −).`,
      0,
      (w) => zollunionAnnehmen(w),
    ),
    opt("ablehnen", "Ablehnen", "Kein Preis heute; das Angebot vertagt sich um zwei Jahre und Brüssel verliert Vertrauen.", 0, (w) => zollunionAblehnen(w)),
  ],
  standard: (w) => zollunionAblehnen(w),
};

export const EU_VORLAGEN: Vorlage[] = [EU_VETO, EU_ZOLLUNION];

/** Für Tests und die Oberfläche: die Kennungen der EU-Vorlagen. */
export const EU_VORLAGE_IDS = EU_VORLAGEN.map((v) => v.id);

// Typsicherheit: World-Import wird in den Wirkungen gebraucht
export type { World };
