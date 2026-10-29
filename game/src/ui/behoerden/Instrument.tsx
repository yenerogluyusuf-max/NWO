// Einbindung der Behörden in die Bereichsakte: eigener Unterreiter „Behörden“ unter den Instrumenten, als Übersicht mit Kacheln; der MİT
// zeigt in seiner Detailleiste zusätzlich Lagebild, Netze und Inland. Der eigene Zustand sorgt für die Neuzeichnung nach einer
// Entscheidung (die Simulation ändert w direkt).

import { useReducer } from "react";
import type { World } from "../../sim/types";
import type { BehoerdeBereich } from "../../data/behoerden";
import { behoerdenImBereich } from "../../sim/behoerden";
import { BehoerdenListe } from "./Behoerde";
import { MitZusatz } from "./Mit";
import "./behoerden.css";

export function BehoerdenInstrument({ w, bereich }: { w: World; bereich: string }) {
  const [, refresh] = useReducer((n: number) => n + 1, 0);
  if (!w.spiel) return null;
  if (!behoerdenImBereich(bereich).length) return null;
  return (
    <div className="bh-instrument-block">
      <BehoerdenListe w={w} bereich={bereich as BehoerdeBereich} refresh={refresh} extra={(id) => (id === "mit" ? <MitZusatz w={w} refresh={refresh} /> : null)} />
    </div>
  );
}
