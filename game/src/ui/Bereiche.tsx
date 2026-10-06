// „Heute“ in der Politik: Was jetzt ansteht. Aus den akuten Problemen berechnet das Spiel die Vorhaben, die dort am meisten
// bewirken, wo es brennt, und die Schritte, die die Ressorts gegen ihre schwächsten Größen vorschlagen. Jede Zeile ist eine Vorlage
// eines Ministers (dieselbe Karte wie am Schreibtisch): mit Gesicht, Empfehlung, wer dafür und dagegen ist, wie schlimm das Problem
// ist und wo, und dem erwarteten Nutzen in Zahlen. Die Bereiche selbst stehen im Reiter „Bereiche“ (politik/Politik.tsx).

import { useMemo, useState } from "react";
import type { World } from "../sim/types";
import type { Vorschlag } from "../sim/vorschlaege";
import { entscheideVorlage, heuteVorlagen, ministerflussSchluessel } from "../sim/ministerfluss";
import type { Vorlage, VorlagenZiel } from "../sim/ministerfluss-typen";
import { VorlageKarte } from "./minister/VorlageKarte";
import "./politik/design.css";
import "./minister/ministerfluss.css";
import "./politik/politik.css";

import { t } from "../i18n";
export function Bereiche({
  world,
  onVorhaben,
  onBereiche,
  refresh,
  onGehe,
  onKarte,
}: {
  world: World;
  onVorhaben?: (v: Vorschlag) => void;
  onBereiche?: () => void;
  refresh?: () => void;
  /** Führt zu Akten, Maßnahmen und Ländern (wie am Schreibtisch) */
  onGehe?: (z: VorlagenZiel) => void;
  /** Springt zur Karte (Ebene „Probleme“) */
  onKarte?: (problemId?: string) => void;
}) {
  const [antwort, setAntwort] = useState<{ ok: boolean; text: string; why?: string } | null>(null);
  const spiel = world.spiel;
  // Die Rechnung ist aufwendig: nur neu, wenn sich Tag, Kapital, Gesetze, Ereignisse oder die Entscheidungen ändern
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const vs = useMemo(() => (spiel ? heuteVorlagen(world, 6) : []), [ministerflussSchluessel(world)]);
  const entscheide = (v: Vorlage, optionId: string) => {
    setAntwort(entscheideVorlage(world, v.id, optionId));
    refresh?.();
  };
  return (
    <section className="vorschlaege mf">
      <header className="pd-seitenkopf">
        <div>
          <p className="pd-ueber">{t("ui2.ui.Bereiche.1ab3309")}</p>
          <h3>{t("ui2.ui.Bereiche.eaecb68")}</h3>
          <p className="pd-lead">{t("ui.Bereiche.99f90d9")}</p>
        </div>
        {vs.length > 0 && (
          <ul className="pd-zaehler" aria-label={t("ui.Bereiche.7be6696")}>
            <li className="hell">
              <b>{vs.length}</b>
              <span>{vs.length === 1 ? t("ui2.ui.Bereiche.4271557") : t("ui2.ui.Bereiche.ab41f3a")} {t("ui2.ui.Bereiche.4bd4d76")}</span>
            </li>
          </ul>
        )}
      </header>
      {antwort && (
        <p className={`mf-rueckmeldung ${antwort.ok ? "ok" : "nein"}`} role="status">
          {antwort.text}
          {antwort.why && <em>{antwort.why}</em>}
        </p>
      )}
      {vs.length === 0 && <p className="mf-leer">{t("ui.Bereiche.d6f5489")}</p>}
      <ol className="mf-liste">
        {vs.map((v, i) => (
          <li key={v.id}>
            <VorlageKarte v={v} nummer={i + 1} onEntscheide={entscheide} {...(onGehe ? { onGehe } : {})} {...(onKarte ? { onKarte } : {})} {...(onVorhaben ? { onEinstellen: (x: Vorlage) => x.vorschlag && onVorhaben(x.vorschlag) } : {})} />
          </li>
        ))}
      </ol>
      {onBereiche && (
        <p className="pd-legende">
          {t("ui2.ui.Bereiche.25bbb8b")} <button className="pd-btn quiet" onClick={onBereiche}>{t("ui2.ui.Bereiche.25e38e2")}</button>
        </p>
      )}
    </section>
  );
}
