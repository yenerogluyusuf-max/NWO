// Der Monatslauf des Ministerflusses: nur fällige Befehle ausführen. Eigene schlanke Datei, damit der Monatslauf der Personen
// (personen-monat.ts) nichts von den Vorlagen und Ereignissen einziehen muss.

import { befehleMonat } from "./minister-befehle";
import type { World } from "./types";

export function ministerflussMonat(w: World): void {
  // Spielstände, in denen nie ein Befehl erteilt wurde, brauchen keinen Lauf
  if (!w.spiel?.ministerfluss?.befehle.length) return;
  befehleMonat(w);
  const z = w.spiel.ministerfluss;
  if (z.rueckmeldungen.length > 14) z.rueckmeldungen.splice(0, z.rueckmeldungen.length - 14);
}
