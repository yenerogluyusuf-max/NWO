// Der MİT in der Behördenliste der Sicherheit. Welle M1: Inland, Netze, laufende Operationen und Bericht stehen in der einen Dienstakte
// (Außen › Dienst, ui/welt/Dienst.tsx); hier bleiben Ausbau und Etat wie bei jeder Behörde (BehoerdeDetail), dazu zwei Kennzahlen und der
// Sprung in die Akte. Vorher lagen die Inlandsoperationen hier in der vierten Ebene hinter dem Behörden-Aufklapper.

import type { World } from "../../sim/types";
import { dienstSicht, lagebildQualitaet } from "../../sim/welt-dienst";
import { UbVerweis } from "../akte/Uebersicht";
import { t } from "../../i18n";

export function MitZusatz({ w }: { w: World; refresh: () => void }) {
  const sicht = dienstSicht(w);
  const lage = lagebildQualitaet(w);
  return (
    <div className="mit-ansicht mit-verweis">
      <p className="ub-info">
        {t("welle_m1.mit.zeile", { kap: Math.round(sicht.kapazitaet), max: sicht.kapazitaetMax, lage: lage.wert, laufend: sicht.laufend.length + sicht.inland.length })}
      </p>
      <UbVerweis ziel={{ art: "land", id: "dienst" }}>{t("welle_m1.mit.zur_akte")}</UbVerweis>
    </div>
  );
}
