// Eine Runde des Gesprächs mit dem Sprachmodell: Zustand und Frage senden, Antwort lesen, Vorschläge prüfen.

import { rufeAuf, type Holer } from "./anbieter";
import { leseAntwort, vorschau } from "./aktionen";
import { systemText, zustandsText } from "./kontext";
import type { KiAntwortRoh, KiErgebnis, KiKonfig, KiNachricht, KiVorschau } from "./typen";
import type { World } from "../sim/types";

const MAX_VERLAUF = 6;
const MAX_TOKENS = 900;

export interface KiRunde {
  ergebnis: KiErgebnis;
  vorschauen: KiVorschau[];
  verbrauch: { ein: number; aus: number; modell: string };
}

/** Der Verlauf enthält von früheren Runden nur den Text, nicht den damaligen Zustand: Der veraltet, und Token kosten Geld. */
function nachrichten(verlauf: KiNachricht[], w: World, eingabe: string): KiNachricht[] {
  const alt = verlauf.slice(-MAX_VERLAUF);
  // Die Rollen müssen abwechseln und mit „user“ beginnen
  while (alt.length && alt[0]!.rolle !== "user") alt.shift();
  return [...alt, { rolle: "user", text: `${zustandsText(w)}\n\nAUFTRAG DES SPIELERS:\n${eingabe}` }];
}

export async function fragKi(w: World, verlauf: KiNachricht[], eingabe: string, k: KiKonfig, holen?: Holer, signal?: AbortSignal): Promise<KiRunde> {
  const roh: KiAntwortRoh = await rufeAuf(k, { system: systemText(), nachrichten: nachrichten(verlauf, w, eingabe), maxTokens: MAX_TOKENS, ...(signal ? { signal } : {}) }, holen);
  const ergebnis = leseAntwort(roh.text);
  return { ergebnis, vorschauen: ergebnis.aktionen.map((a) => vorschau(w, a)), verbrauch: { ein: roh.tokensEin, aus: roh.tokensAus, modell: roh.modell } };
}

/** Rat zu einem offenen Ereignis: erklärt die Antworten, schlägt eine vor, führt nichts aus. */
export async function fragKiRat(w: World, ereignisId: string, k: KiKonfig, holen?: Holer, signal?: AbortSignal): Promise<KiRunde> {
  const frage = `Erkläre das offene Ereignis [${ereignisId}] in wenigen Sätzen: Worum geht es, welche Antwort hat welchen Preis und welche Nebenwirkung, und welche würdest du empfehlen (mit Begründung, neutral nach Wirkung im Spiel)? Schlage höchstens die empfohlene Antwort als Aktion vor.`;
  return fragKi(w, [], frage, k, holen, signal);
}
