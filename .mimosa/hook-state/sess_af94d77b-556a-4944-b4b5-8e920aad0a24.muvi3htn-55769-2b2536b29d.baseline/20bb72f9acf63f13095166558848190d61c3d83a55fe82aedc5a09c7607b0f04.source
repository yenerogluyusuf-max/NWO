// Bilanz der Amtszeit: das Geschichtsbuchkapitel aus den Daten der Partie, mit dem Vermächtnis als zweiter Ansicht (Rückblick in Kapiteln und Epilog).
// „Neue Partie“ löscht den Stand nicht: Er bleibt als „Weitester Stand“ im Titelbild erhalten (ui/App.tsx).

import { useMemo, useState } from "react";
import type { World } from "../sim/types";
import { erstelleBilanz } from "../sim/bilanz";
import { vermaechtnis } from "../sim/vermaechtnis";
import { Corners, Flourish } from "./art/Ornament";
import { Vermaechtnis } from "./wahl/Vermaechtnis";
import { datum as formatDatum, t } from "../i18n";

export function BilanzFenster({ world, onNeu, onSchliessen }: { world: World; onNeu: () => void; onSchliessen: () => void }) {
  const b = erstelleBilanz(world);
  const ende = world.spiel!.ende!;
  const [ansicht, setAnsicht] = useState<"bilanz" | "vermaechtnis">("bilanz");
  const daten = useMemo(() => (ansicht === "vermaechtnis" ? vermaechtnis(world) : null), [ansicht, world]);
  return (
    <div className="event-layer bilanz-layer" role="dialog" aria-modal="true" aria-labelledby="bilanz-titel">
      <article className="frame bilanz">
        <Corners />
        <div className="bilanz-body">
          <p className="kicker">{t("bilanz.ui.kicker", { datum: ende.datum })}</p>
          <h1 id="bilanz-titel">{b.titel}</h1>
          <Flourish width={240} />
          {ansicht === "vermaechtnis" && daten ? (
            <Vermaechtnis daten={daten} />
          ) : (
            <>
              <div className="bilanz-text">
                {b.absaetze.map((a, i) => (
                  <p key={i}>{a}</p>
                ))}
              </div>
              <div className="bilanz-spalten">
                <section>
                  <h3>{t("bilanz.ui.zahlen")}</h3>
                  <table className="bilanz-tabelle">
                    <tbody>
                      {b.kennzahlen.map((k) => (
                        <tr key={k.name}>
                          <th>{k.name}</th>
                          <td>{k.start}</td>
                          <td aria-hidden>→</td>
                          <td className={`urteil-${k.urteil}`}>{k.ende}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <h3>{t("bilanz.ui.ziele")}</h3>
                  <ul className="bilanz-ziele">
                    {b.ziele.length === 0 && <li>{t("bilanz.ui.keine_ziele")}</li>}
                    {b.ziele.map((z) => (
                      <li key={z.titel} className={z.erreicht ? "ja" : "nein"}>
                        <span className="haken" aria-hidden>
                          {z.erreicht ? "✓" : "✗"}
                        </span>
                        <span>
                          <strong>{z.titel}</strong>
                          <em>
                            {z.erreicht ? t("bilanz.ui.erreicht") : t("bilanz.ui.verfehlt")} · {z.stand}
                          </em>
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
                <section>
                  <h3>{t("bilanz.ui.was_geschah")}</h3>
                  <ul className="chronik">
                    {b.chronik.length === 0 && <li>{t("bilanz.ui.nichts")}</li>}
                    {b.chronik.map((c, i) => (
                      <li key={i}>
                        <span className="wann">{formatDatum(c.datum)}</span>
                        <strong>{c.titel}</strong>
                        <em>{c.ausgang}</em>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
            </>
          )}
          <p className="bilanz-hinweis">{t("vermaechtnis.erhalten")}</p>
          <div className="event-actions">
            <button className="brass-button" onClick={onNeu}>
              {t("bilanz.ui.neu")}
            </button>
            <button className="leather-button" onClick={() => setAnsicht(ansicht === "bilanz" ? "vermaechtnis" : "bilanz")}>
              {ansicht === "bilanz" ? t("bilanz.ui.vermaechtnis") : t("bilanz.ui.bilanz")}
            </button>
            <button className="leather-button" onClick={onSchliessen}>
              {t("bilanz.ui.karte")}
            </button>
          </div>
        </div>
      </article>
    </div>
  );
}
