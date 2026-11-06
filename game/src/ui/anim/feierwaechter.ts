// Feiermoment, Teil 1: Was ist neu fertig? (befund-H H-24). Ein beschlossenes Gesetz, ein vollendeter Fokus, ein erreichtes Amtsziel und
// eine erreichte Stufe eines großen Ziels bekommen einen kurzen Moment im Stil der Wunderfeier (anim/Feier.tsx). Der Wächter liest nur
// den Spielstand und schreibt nichts hinein; er vergleicht mit dem, was er beim letzten Blick gesehen hat. Was beim ersten Blick schon
// fertig war (geladener Stand), wird nicht gefeiert.

import type { LogEntry, World } from "../../sim/types";
import { zielStand } from "../../sim/ziele";
import { fokusName } from "../../sim/fokus";
import { t } from "../../i18n";

export type FeierArt = "gesetz" | "fokus" | "ziel";

export interface Feier {
  art: FeierArt;
  /** Kicker über dem Titel, fertig übersetzt („Gesetz beschlossen“) */
  kicker: string;
  titel: string;
}

export interface FeierStand {
  log: WeakSet<LogEntry>;
  fokus: Set<string>;
  ziele: Set<string>;
  stufen: Map<string, number>;
}

/** Nur die letzten Einträge prüfen: Mehr als so viele kommen zwischen zwei Blicken nicht hinzu (Spielparameter). */
const LOG_FENSTER = 60;

/** Erreichte Amtsziele mit Titel (Kennung → Titel). */
function erreichteZiele(w: World): Map<string, string> {
  try {
    return new Map(zielStand(w).filter((z) => z.erreicht).map((z) => [z.def.id, z.def.titel]));
  } catch {
    return new Map();
  }
}

/** Stand beim ersten Blick (alles bisher Fertige gilt als gesehen). */
export function feierStand(w: World): FeierStand {
  const log = new WeakSet<LogEntry>();
  for (const l of w.log.slice(-LOG_FENSTER)) log.add(l);
  return {
    log,
    fokus: new Set((w.spiel?.fokus?.fertig ?? []).map((f) => f.id)),
    ziele: new Set(erreichteZiele(w).keys()),
    stufen: new Map(Object.entries(w.spiel?.grosseZiele?.stand ?? {}).map(([id, s]) => [id, s.stufe])),
  };
}

/** Was seit dem letzten Blick fertig wurde; der Stand wird dabei fortgeschrieben. */
export function neueFeiern(w: World, stand: FeierStand): Feier[] {
  const out: Feier[] = [];
  for (const l of w.log.slice(-LOG_FENSTER)) {
    if (stand.log.has(l)) continue;
    stand.log.add(l);
    if (l.abstimmung?.art === "gesetz" && l.abstimmung.angenommen) out.push({ art: "gesetz", kicker: t("n8.feier.gesetz"), titel: l.abstimmung.name });
  }
  for (const f of w.spiel?.fokus?.fertig ?? []) {
    if (stand.fokus.has(f.id)) continue;
    stand.fokus.add(f.id);
    out.push({ art: "fokus", kicker: t("n8.feier.fokus"), titel: fokusName(f.id) });
  }
  // Jedes Ziel wird in einer Sitzung nur einmal gefeiert, auch wenn es um die Schwelle pendelt (etwa die Inflation)
  for (const [id, titel] of erreichteZiele(w)) {
    if (stand.ziele.has(id)) continue;
    stand.ziele.add(id);
    out.push({ art: "ziel", kicker: t("n8.feier.ziel"), titel });
  }
  for (const [id, s] of Object.entries(w.spiel?.grosseZiele?.stand ?? {})) {
    const vorher = stand.stufen.get(id) ?? 0;
    if (s.stufe > vorher) out.push({ art: "ziel", kicker: t("n8.feier.stufe"), titel: t(`gz2.ziel.${id}.titel`) });
    stand.stufen.set(id, s.stufe);
  }
  return out;
}

// Kleiner Verteiler: Der Wächter (in der Bühne) meldet, die Komponente zeigt. So kann jede Stelle einen Moment auslösen, ohne die
// Komponente zu kennen.
type Hoerer = (f: Feier) => void;
const hoerer = new Set<Hoerer>();
export function feiere(f: Feier): void {
  for (const h of [...hoerer]) h(f);
}
export function abonniereFeiern(h: Hoerer): () => void {
  hoerer.add(h);
  return () => hoerer.delete(h);
}
