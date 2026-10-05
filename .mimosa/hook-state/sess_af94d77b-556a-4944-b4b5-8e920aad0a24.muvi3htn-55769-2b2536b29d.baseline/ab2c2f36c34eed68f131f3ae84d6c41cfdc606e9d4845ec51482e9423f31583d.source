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
          <p className="pd-ueber">Heute</p>
          <h3>Was jetzt ansteht</h3>
          <p className="pd-lead">Nach Rang geordnet, aus Ihren akuten Problemen und den Sorgen der Ressorts berechnet. Was Sie hier nicht entscheiden, bleibt im Posteingang der Minister.</p>
        </div>
        {vs.length > 0 && (
          <ul className="pd-zaehler" aria-label="Zahl der Vorlagen">
            <li className="hell">
              <b>{vs.length}</b>
              <span>{vs.length === 1 ? "Vorlage" : "Vorlagen"} nach Rang</span>
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
      {vs.length === 0 && <p className="mf-leer">Im Moment drängt nichts. Sehen Sie in den Bereichen nach, wo Sie etwas verbessern wollen.</p>}
      <ol className="mf-liste">
        {vs.map((v, i) => (
          <li key={v.id}>
            <VorlageKarte v={v} nummer={i + 1} onEntscheide={entscheide} {...(onGehe ? { onGehe } : {})} {...(onKarte ? { onKarte } : {})} {...(onVorhaben ? { onEinstellen: (x: Vorlage) => x.vorschlag && onVorhaben(x.vorschlag) } : {})} />
          </li>
        ))}
      </ol>
      {onBereiche && (
        <p className="pd-legende">
          Lieber selbst suchen? <button className="pd-btn quiet" onClick={onBereiche}>Alle Bereiche ansehen</button>
        </p>
      )}
    </section>
  );
}
