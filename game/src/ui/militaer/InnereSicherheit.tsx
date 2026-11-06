// Innere Sicherheit in der Akte Sicherheit (Befund G-10): Terrorgefahr nach Tätergruppen und der Friedensprozess als Phasenleiter.
// Vorher standen beide unter Außen › Weltlage. Nur lesend; dieselben Zahlen wie sim/diplomatie.ts `aussenLage`. Die Instrumente
// (Friedensschritt, Grenzsicherung) liegen weiter unter Außen › Weltlage › Instrumente.

import type { World } from "../../sim/types";
import { aussenLage } from "../../sim/diplomatie";
import { t } from "../../i18n";
import { useSprache } from "../../i18n/react";
import "./militaer.css";

const ton = (x: number, schlechtAb: number, mittelAb: number) => (x >= schlechtAb ? "schlecht" : x >= mittelAb ? "mittel" : "gut");

export function InnereSicherheit({ world }: { world: World }) {
  useSprache();
  const lage = aussenLage(world);
  return (
    <section className="si-innen" aria-label={t("nacht_n7.innen.titel")}>
      <h3 className="ak-abschnitt">{t("nacht_n7.innen.titel")}</h3>
      <div className="si-innen-raster">
        <div>
          <h4>{t("aussen.ui.terror")}</h4>
          {(["is", "pkk", "links"] as const).map((k) => (
            <div key={k} className="si-zeile">
              <span>{t(`aussen.ui.taeter.${k}`)}</span>
              <i className={`si-balken ${ton(lage.terror[k], 60, 35)}`} aria-hidden>
                <b style={{ width: `${Math.max(0, Math.min(100, lage.terror[k]))}%` }} />
              </i>
              <b>{Math.round(lage.terror[k])}</b>
            </div>
          ))}
        </div>
        <div>
          <h4>{t("aussen.ui.frieden")}</h4>
          <ol className="si-phasen">
            {[0, 1, 2, 3, 4, 5].map((p) => (
              <li key={p} className={p < lage.friedens.phase ? "fertig" : p === lage.friedens.phase ? "jetzt" : ""}>
                {t(`aussen.frieden.name${p}`)}
              </li>
            ))}
          </ol>
          <p className="si-klein">
            {t("aussen.ui.fortschritt")} <b>{Math.round(lage.friedens.fortschritt)}</b>
            {lage.friedens.rueckschlaege > 0 ? ` · ${t("aussen.ui.rueckschlaege", { n: lage.friedens.rueckschlaege })}` : ""}
            {" · "}{t("nacht_n7.innen.instrumente")}
          </p>
        </div>
      </div>
    </section>
  );
}
