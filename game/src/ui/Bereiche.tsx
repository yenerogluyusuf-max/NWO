// „Heute“ in der Politik: Was jetzt ansteht. Aus den akuten Problemen berechnet das Spiel die Vorhaben, die dort am meisten
// bewirken, wo es brennt. Die Bereiche selbst (Wirtschaft, Gesundheit, Wohnen …) stehen im Reiter „Bereiche“ (politik/Politik.tsx).

import { useMemo, useState } from "react";
import type { World } from "../sim/types";
import { vorschlaege, type Vorschlag } from "../sim/vorschlaege";
import { bringeEin } from "../sim/handeln";
import { VorschlagKarte } from "./politik/VorschlagKarte";
import "./politik/politik.css";

export function Bereiche({ world, onVorhaben, onBereiche, refresh }: { world: World; onVorhaben?: (v: Vorschlag) => void; onBereiche?: () => void; refresh?: () => void }) {
  const [antwort, setAntwort] = useState<{ ok: boolean; text: string; why?: string } | null>(null);
  const spiel = world.spiel;
  // Die Rechnung ist aufwendig: nur neu, wenn sich Tag, Kapital oder die Zahl der Gesetze ändert
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const vs = useMemo(() => (spiel ? vorschlaege(world, 6) : []), [world.day, spiel?.kapital, spiel?.gesetze.length, Object.keys(world.net.targets).length]);
  return (
    <section className="vorschlaege">
      <h3>Was jetzt ansteht</h3>
      <p className="subtitle">Aus Ihren akuten Problemen berechnet: die Vorhaben, die dort am meisten bewirken, wo es brennt. Die Liste ändert sich mit der Lage.</p>
      {antwort && (
        <p className={`rueckmeldung ${antwort.ok ? "ok" : "nein"}`} role="status">
          {antwort.text}
          {antwort.why && <em> {antwort.why}</em>}
        </p>
      )}
      {vs.length === 0 && <p className="subtitle">Im Moment drängt nichts. Sehen Sie in den Bereichen nach, wo Sie etwas verbessern wollen.</p>}
      <ol className="vorschlag-liste">
        {vs.map((v) => (
          <VorschlagKarte
            key={v.massnahme}
            v={v}
            onEinstellen={(x) => onVorhaben?.(x)}
            onSofort={(x) => {
              setAntwort(bringeEin(world, x.massnahme, x.ziel, x.ort, "gesetz"));
              refresh?.();
            }}
          />
        ))}
      </ol>
      {onBereiche && (
        <p className="po-fuss">
          Lieber selbst suchen? <button className="link" onClick={onBereiche}>Alle Bereiche ansehen</button>
        </p>
      )}
    </section>
  );
}
