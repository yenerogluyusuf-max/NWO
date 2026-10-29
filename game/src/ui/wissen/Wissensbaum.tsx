// Der Wissensbaum in der Akte: eine kompakte Vorschau (Tempo, was läuft, was als Nächstes geht) und der Knopf zum großen Baumfenster
// (BaumFenster.tsx, Civ-6-Vorbild). Ein Klick auf einen Eintrag öffnet den Baum mit diesem Knoten.

import { useMemo, useState } from "react";
import { t } from "../../i18n";
import { baumSicht, knotenName, type Sprung } from "../../sim/wissensbaum";
import type { World } from "../../sim/types";
import { BaumFenster } from "./BaumFenster";
import { Symbol, knotenSymbol } from "./symbole";
import "./wissensbaum.css";

export { Detail } from "./Detail";

export function Wissensbaum({
  world: w,
  onGeaendert,
  start,
  onAussen,
}: {
  world: World;
  onGeaendert?: () => void;
  /** Mit diesem Knoten gleich das Baumfenster öffnen (Rückweg nach einem Sprung) */
  start?: string | null;
  /** Sprung aus dem Baum hinaus: Politiknetz, Haushalt, Außenlage */
  onAussen?: (s: Sprung, knoten: string) => void;
}) {
  const [stand, setStand] = useState(0);
  const [offen, setOffen] = useState<{ start: string | null } | null>(start ? { start } : null);
  const sicht = useMemo(() => (w.spiel ? baumSicht(w) : null), [w, w.day, stand]);
  if (!w.spiel || !sicht) return null;
  const alle = sicht.zweige.flatMap((z) => z.knoten);
  const laufend = alle.filter((k) => k.zustand === "laeuft").sort((a, b) => b.fortschritt - a.fortschritt);
  const moeglich = alle.filter((k) => k.zustand === "moeglich");
  const wartend = alle.filter((k) => k.zustand === "gesperrt" && k.brauchtBildung);
  const fertig = alle.filter((k) => k.zustand === "fertig").length;
  const zeig = (id: string | null) => setOffen({ start: id });

  return (
    <div className="wb">
      <div className="wb-vorschau">
        <div className={`wb-tempo${sicht.tempo.gesamt >= 1.15 ? " gut" : sicht.tempo.gesamt <= 0.85 ? " schlecht" : ""}`}>
          <span className="wb-tempo-wert">{t("wissen.ui.tempoWert", { tempo: sicht.tempo.gesamt })}</span>
          <span className="wb-tempo-name">{t("wissen.ui.tempo")}</span>
        </div>
        <div className="wb-lage-text">
          <p className="wb-satz">{sicht.satz}</p>
          <p className="wb-etat">
            {t("wissen.ui.etat", { budget: sicht.etat.budget, grenze: sicht.etat.grenze })} · {t("wissen.civ.fertigGesamt", { fertig, gesamt: alle.length })}
            {sicht.schwerpunkt && (
              <span className="wb-chip an">
                {t("wissen.ui.schwerpunkt")}: {t(`wissen.z.${sicht.schwerpunkt}.name`)}
              </span>
            )}
            {sicht.abwanderung && <span className="wb-chip schlecht">{t("wissen.ui.abwanderung")}</span>}
          </p>
        </div>
        <button type="button" className="wb-oeffnen" onClick={() => zeig(null)}>
          <Symbol name="netz" gross={20} />
          {t("wissen.civ.oeffnen")}
        </button>
      </div>

      <div className="wb-spalten">
        <section>
          <h4>{t("wissen.civ.vorschau.laufend")}</h4>
          {laufend.length === 0 ? (
            <p className="wb-hinweis">{t("wissen.civ.nichts")}</p>
          ) : (
            <ul className="wb-liste">
              {laufend.slice(0, 3).map((k) => (
                <li key={k.id}>
                  <button type="button" onClick={() => zeig(k.id)}>
                    <span className={`wbf-k-rund klein b-${k.zweig}`}>
                      <Symbol name={knotenSymbol(k.id, k.zweig)} gross={16} />
                    </span>
                    <span className="wb-liste-name">{knotenName(k.id)}</span>
                    <span className="wb-liste-rest">{k.restMonate !== undefined ? t("wissen.civ.inMonaten", { n: k.restMonate }) : ""}</span>
                    <span className="wb-liste-balken">
                      <i style={{ width: `${Math.round(k.fortschritt * 100)}%` }} />
                    </span>
                  </button>
                </li>
              ))}
              {laufend.length > 3 && <li className="wb-hinweis">{t("wissen.civ.undMehr", { n: laufend.length - 3 })}</li>}
            </ul>
          )}
        </section>
        <section>
          <h4>{t("wissen.civ.vorschau.naechste")}</h4>
          {moeglich.length === 0 ? (
            <p className="wb-hinweis">{wartend.length ? t("wissen.satz.bildung", { n: wartend.length }) : t("wissen.civ.vorschau.keine")}</p>
          ) : (
            <ul className="wb-liste">
              {moeglich.slice(0, 3).map((k) => (
                <li key={k.id}>
                  <button type="button" onClick={() => zeig(k.id)}>
                    <span className={`wbf-k-rund klein b-${k.zweig}`}>
                      <Symbol name={knotenSymbol(k.id, k.zweig)} gross={16} />
                    </span>
                    <span className="wb-liste-name">{knotenName(k.id)}</span>
                    <span className="wb-liste-rest">{t("wissen.ui.kosten", { pk: k.pk, monate: k.monate })}</span>
                  </button>
                </li>
              ))}
              {moeglich.length > 3 && <li className="wb-hinweis">{t("wissen.civ.undMehr", { n: moeglich.length - 3 })}</li>}
            </ul>
          )}
        </section>
      </div>

      {offen && (
        <BaumFenster
          world={w}
          start={offen.start}
          onZu={() => {
            setOffen(null);
            setStand((x) => x + 1);
          }}
          onGeaendert={() => {
            setStand((x) => x + 1);
            onGeaendert?.();
          }}
          {...(onAussen
            ? {
                onAussen: (s: Sprung, von: string) => {
                  setOffen(null);
                  onAussen(s, von);
                },
              }
            : {})}
        />
      )}
    </div>
  );
}
