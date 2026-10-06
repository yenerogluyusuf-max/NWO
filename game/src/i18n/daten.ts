// Texte in Datenmodulen (Namen, Beschreibungen, Stufen, Rollen) dreisprachig, ohne die Daten zu verlegen.
//
//   datenTexte("skala", liste, (x) => x.id, ["name", "text"])
//
// Deutsch bleibt im Datenmodul die Quelle. Läuft das Spiel auf Türkisch oder Englisch, ersetzt der Aufruf beim Laden des Moduls die
// genannten Felder durch den Katalogeintrag `daten.<bereich>.<id>.<feld>` (Rückfall: Englisch, dann der deutsche Text). Die Sprache
// wechselt nur durch Neuladen (siehe wechsleSprache), deshalb genügt das einmalige Ersetzen. Jeder Aufruf meldet seine deutschen Texte an,
// damit test/datentexte.test.ts prüft, dass der deutsche Katalog den Daten entspricht und Türkisch und Englisch vollständig sind.
//
// Nur Anzeigefelder anmelden, nie Felder, mit denen der Code vergleicht oder rechnet.

import { aktuelleSprache, katalogVon } from "./index";

type Tabelle = Record<string, string>;

interface Anmeldung {
  bereich: string;
  texte: Tabelle;
}

const ANMELDUNGEN: Anmeldung[] = [];

export const schluessel = (bereich: string, id: string, feld: string): string => `daten.${bereich}.${id}.${feld}`;

function hole(key: string): string | undefined {
  const s = aktuelleSprache();
  if (s === "de") return undefined;
  return katalogVon(s)[key] ?? katalogVon("en")[key];
}

/**
 * Meldet die Felder einer Liste an und setzt in Türkisch und Englisch die Übersetzung ein.
 * `id` muss je Eintrag eindeutig und stabil sein (Kennung aus den Daten, nie der Anzeigetext).
 */
export function datenTexte<T extends object>(bereich: string, liste: readonly T[], id: (x: T, i: number) => string, felder: readonly string[]): void {
  const texte: Tabelle = {};
  liste.forEach((x, i) => {
    const kennung = id(x, i);
    for (const f of felder) {
      const v = (x as Record<string, unknown>)[f];
      if (typeof v !== "string" || !v.trim()) continue;
      const k = schluessel(bereich, kennung, f);
      texte[k] = v;
      const neu = hole(k);
      if (neu !== undefined) (x as Record<string, unknown>)[f] = neu;
    }
  });
  ANMELDUNGEN.push({ bereich, texte });
}

/** Wie datenTexte, aber für einzelne Felder verschachtelter Objekte, ohne diesen Objekte etwas hinzuzufügen (Kennung kommt von außen). */
export function datenFelder(bereich: string, eintraege: readonly { id: string; obj: object; feld: string }[]): void {
  const texte: Tabelle = {};
  for (const { id, obj, feld } of eintraege) {
    const v = (obj as Record<string, unknown>)[feld];
    if (typeof v !== "string" || !v.trim()) continue;
    const k = schluessel(bereich, id, feld);
    texte[k] = v;
    const neu = hole(k);
    if (neu !== undefined) (obj as Record<string, unknown>)[feld] = neu;
  }
  ANMELDUNGEN.push({ bereich, texte });
}

/** Wie datenTexte für eine Tabelle Kennung → Text (etwa Themen- oder Rollennamen). */
export function datenTabelle(bereich: string, tabelle: Record<string, string>): void {
  const texte: Tabelle = {};
  for (const [kennung, v] of Object.entries(tabelle)) {
    const k = `daten.${bereich}.${kennung}`;
    texte[k] = v;
    const neu = hole(k);
    if (neu !== undefined) tabelle[kennung] = neu;
  }
  ANMELDUNGEN.push({ bereich, texte });
}

/** Ein einzelner fester Text aus einem Datenmodul (Rückfall: der deutsche Text). */
export function datenText(bereich: string, kennung: string, deutsch: string): string {
  const k = `daten.${bereich}.${kennung}`;
  ANMELDUNGEN.push({ bereich, texte: { [k]: deutsch } });
  return hole(k) ?? deutsch;
}

/** Alle angemeldeten deutschen Texte (für den Katalogtest und das Erzeugen der deutschen Kataloge). */
export function angemeldeteDatentexte(): Tabelle {
  const alle: Tabelle = {};
  for (const a of ANMELDUNGEN) Object.assign(alle, a.texte);
  return alle;
}

export function angemeldeteBereiche(): Record<string, Tabelle> {
  const out: Record<string, Tabelle> = {};
  for (const a of ANMELDUNGEN) Object.assign((out[a.bereich] ??= {}), a.texte);
  return out;
}
