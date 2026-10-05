// Einbindung der Behörden in die Bereichsakte: Im Reiter „Instrumente“ erscheinen die Behörden des Bereichs, im Bereich Sicherheit
// zuvor der MİT mit Netzkarte und Inland. Der eigene Zustand sorgt für die Neuzeichnung nach einer Entscheidung (die Simulation ändert w direkt).

import { useReducer } from "react";
import type { World } from "../../sim/types";
import type { BehoerdeBereich } from "../../data/behoerden";
import { behoerdenImBereich } from "../../sim/behoerden";
import { BehoerdenListe } from "./Behoerde";
import { MitAnsicht } from "./Mit";
import { t } from "../../i18n";
import "./behoerden.css";

export function BehoerdenInstrument({ w, bereich }: { w: World; bereich: string }) {
  const [, refresh] = useReducer((n: number) => n + 1, 0);
  if (!w.spiel) return null;
  const ids = behoerdenImBereich(bereich);
  if (!ids.length) return null;
  const mit = ids.includes("mit");
  return (
    <div className="bh-instrument-block">
      <h3 className="ak-abschnitt">{t("behoerden.ui.titel")}</h3>
      {mit && <MitAnsicht w={w} refresh={refresh} />}
      <BehoerdenListe w={w} bereich={bereich as BehoerdeBereich} refresh={refresh} />
    </div>
  );
}
