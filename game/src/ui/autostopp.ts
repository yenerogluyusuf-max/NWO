// Auto-Stopp-Taxonomie nach RECHERCHE_SPIELFLUSS_UX.md, Kapitel 7.5 („Der flüssige Tag“).
// Leitregel: „Keine Pause ohne Entscheidung.“ Jeder Auslöser, der die laufende Zeit anhalten kann,
// gehört zu genau einer Klasse:
//
//   A — Entscheidung: erfordert eine Wahl mit Konsequenz (und Frist). Harter Stopp, Fenster enthält
//       die Entscheidung selbst. Verhalten unverändert.
//   B — Wendepunkt: keine Entscheidung, aber dauerhafte Zustandsänderung oder gekreuzte Schwelle.
//       Stopp mit Banner (Hinweis-/Feier-Fenster), einmal pro Ereignis — quittiert, dann Ruhe.
//   C — Umlauf: Routine ohne Handlungsbedarf heute. Kein Stopp mehr; die Meldung landet lautlos
//       im Sammel-Hinweis (Zähler am Schreibtisch) und ist dort beim nächsten Stopp lesbar.
//
// Zuordnung der Auslöser im Bestandscode:
//
// | Auslöser (Stelle)                                                | Klasse | Begründung |
// |------------------------------------------------------------------|--------|------------|
// | Neues Entscheidungs-Ereignis, spiel.ereignisse (sim/ereignisse.ts `oeffne`, UI: EreignisFenster) | A | Optionen mit Konsequenz und Verfallsfrist |
// | Spielende, spiel.ende (sim/spiel.ts `beende`, UI: BilanzFenster) | A | Abschluss der Partie, verlangt den Blick des Spielers |
// | Hinweis `starthilfe` (sim/spiel.ts, nach der Zielwahl)           | B | Amtsantritt, einmalig |
// | Hinweis `warnung-*` (Sturz-Warnung, sim/spiel.ts)                | B | Sturz-Schwelle gekreuzt |
// | Hinweis `bruch-*` (Partner verlässt das Lager, sim/spiel.ts)     | B | Vertragsbruch |
// | Hinweis `wahl-*` (Wiederwahl, sim/spiel.ts)                      | B | Wendepunkt der Partie |
// | Hinweis `programm-*` (Schritt erreicht/Programm erfüllt, sim/programme.ts) | B | Fertigstellung |
// | Hinweis `zusammenbruch-*` (sim/aufmerksamkeit.ts)                | B | Krisen-Eintritt mit Vertrauensverlust |
// | Hinweis `pause-*` (ruhiger Tag, sim/aufmerksamkeit.ts)           | C | Routine-Folge der Belastung; die Sperre erklärt sich am Blocker (`neuanfangGrund`) |
// | Feier, spiel.reich.feier (sim/reich.ts, UI: WunderFenster)       | B | Fertigstellung (Wunder/Großprojekt/Serie) |
// | Abstimmung im Parlament (UI: AbstimmungsKarte)                   | C | Ergebnis ohne Entscheidung; die Karte hält schon bisher nicht an (unverändert) |
// | Monatsumfrage (spiel.umfrage.verlauf)                            | C | Regelmäßige Messung; erscheint als Umlauf-Eintrag |
// | Wirkungsberichte, Auslands-, Markt- und Bankzeilen des Protokolls (log, UI: Meldungen-Feed) | C | Umlauf ohne Handlungsbedarf heute |
// | Statistik-Veröffentlichungen (log kind „statistik“)              | C | Reguläre Veröffentlichung; weiterhin nur in Chronik und Wirtschaftsakte |
//
// Wirkung gegenüber dem Bestand: `pause-*` hält nicht mehr an, und alles ohne Entscheidung
// sammelt sich lesbar am Schreibtisch, statt als flüchtige Karte unterzugehen.

import type { Hinweis, SpielZustand } from "../sim/spiel-typen";

export type StoppKlasse = "A" | "B" | "C";

/** Kennung → Klasse für Hinweise der Spielschleife (Vergabe der Kennungen: die push-Stellen in sim/). */
const HINWEIS_KLASSEN: [praefix: string, klasse: StoppKlasse][] = [
  ["pause-", "C"],
  ["starthilfe", "B"],
  ["warnung-", "B"],
  ["bruch-", "B"],
  ["wahl-", "B"],
  ["programm-", "B"],
  ["zusammenbruch-", "B"],
];

export function hinweisKlasse(id: string): StoppKlasse {
  for (const [praefix, klasse] of HINWEIS_KLASSEN) if (id.startsWith(praefix)) return klasse;
  // Unbekannte Hinweise bleiben Wendepunkte: lieber einmal zu oft halten als etwas Wichtiges verschlucken.
  return "B";
}

/** Eine gesammelte Umlauf-Meldung (Klasse C): Datum schon formatiert, damit die Anzeige nichts rechnen muss. */
export interface UmlaufEintrag {
  id: string;
  datum: string;
  titel: string;
  text?: string;
}

/** Wie viele Umlauf-Meldungen der Sammel-Hinweis höchstens vorhält (die Chronik kennt alles). */
export const UMLAUF_LIMIT = 20;

/** Hängt neue Umlauf-Meldungen an und kappt auf das Limit; die ältesten fallen zuerst heraus. */
export function sammleUmlauf(bisher: UmlaufEintrag[], neu: UmlaufEintrag[], limit = UMLAUF_LIMIT): UmlaufEintrag[] {
  return [...bisher, ...neu].slice(-limit);
}

export interface HaltBewertung {
  /** Zeit anhalten (Klasse A oder B). */
  halt: boolean;
  /** Welche Klasse den Halt auslöste; A schlägt B. null = die Zeit läuft weiter. */
  klasse: "A" | "B" | null;
  /** C-Hinweise, die ohne Stopp in den Sammel-Hinweis wandern (die Oberfläche entfernt sie aus spiel.hinweise). */
  umlaufHinweise: Hinweis[];
}

/**
 * Wertet den Zustand nach einem Tick aus. `geseheneEreignisse` enthält die Kennungen aller Ereignisse,
 * für die schon einmal gehalten wurde: Ein Ereignis hält genau einmal (danach entscheidet der Spieler
 * oder vertagt es), das Spielende und Hinweise/Feiern halten, bis sie quittiert sind.
 */
export function bewerteHalt(spiel: SpielZustand, geseheneEreignisse: ReadonlySet<string>): HaltBewertung {
  const umlaufHinweise = spiel.hinweise.filter((h) => hinweisKlasse(h.id) === "C");
  const bHinweis = spiel.hinweise.some((h) => hinweisKlasse(h.id) === "B");
  const a = !!spiel.ende || spiel.ereignisse.some((e) => !geseheneEreignisse.has(e.id));
  const b = bHinweis || (spiel.reich?.feier.length ?? 0) > 0;
  return { halt: a || b, klasse: a ? "A" : b ? "B" : null, umlaufHinweise };
}
