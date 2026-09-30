// Die Ursachenkette: Warum steht eine Größe dort, wo sie steht? Jede Zeile ist ein Auslöser mit seinem Beitrag in Punkten der Größe darüber;
// darunter, eingerückt, was wiederum diesen Auslöser bewegt hat. Endet bei Maßnahmen (Ihre Entscheidung) und Eingangsgrößen (die Wirtschaft).

import type { KettenGlied } from "../../sim/waehler-detail";
import { nf, vz } from "./format";

function zustand(g: KettenGlied): string {
  const a = Math.abs(g.abweichung);
  if (a < 0.2) return "kaum verändert";
  if (g.art === "massnahme") return `${nf(a, 0)} Stufen ${g.abweichung > 0 ? "höher" : "niedriger"} als zu Beginn`;
  return `${nf(a)} Punkte ${g.abweichung > 0 ? "über" : "unter"} dem Ausgangswert`;
}

export function Kette({
  glieder,
  eltern,
  onMassnahme,
  tiefe = 0,
}: {
  glieder: KettenGlied[];
  /** Name der Größe darüber, für „hebt …“ und „drückt …“ */
  eltern: string;
  onMassnahme?: (id: string, richtung: 1 | -1) => void;
  tiefe?: number;
}) {
  if (!glieder.length) return null;
  const groesster = Math.max(0.01, ...glieder.map((g) => Math.abs(g.beitrag)));
  return (
    <ul className={`wa-kette wa-kette-${Math.min(tiefe, 2)}`}>
      {glieder.map((g) => {
        // Farbe: ob der heutige Stand dieser Ursache der Gruppe hilft oder schadet; Pfeil: ob sie über oder unter ihrem Ausgangswert liegt
        const gut = g.abweichung * g.vorzeichen >= 0;
        const ruhig = Math.abs(g.abweichung) < 0.2;
        return (
          <li key={g.id}>
            <div className={`wa-kette-zeile ${ruhig ? "" : gut ? "gut" : "schlecht"}`}>
              <span className="wa-kette-pfeil" aria-hidden>
                {ruhig ? "·" : g.abweichung > 0 ? "▲" : "▼"}
              </span>
              <span className="wa-kette-name">
                <strong>{g.name}</strong>
                <span className="wa-kette-zustand">
                  {zustand(g)} · {g.beitrag >= 0 ? "hebt" : "drückt"} {eltern}
                </span>
              </span>
              <span className="wa-kette-balken" aria-hidden>
                <i style={{ width: `${Math.max(6, (Math.abs(g.beitrag) / groesster) * 100)}%` }} />
              </span>
              <strong className="wa-kette-zahl">{vz(g.beitrag)}</strong>
            </div>
            {tiefe === 0 && g.text && <em className="wa-kette-warum">{g.text}</em>}
            {g.art === "massnahme" && onMassnahme && (
              <button type="button" className="link wa-kette-link" onClick={() => onMassnahme(g.id, g.beitrag < 0 ? (g.abweichung > 0 ? -1 : 1) : g.abweichung >= 0 ? 1 : -1)}>
                Maßnahme ansehen und einstellen
              </button>
            )}
            {g.kinder.length > 0 && <Kette glieder={g.kinder} eltern={g.name} {...(onMassnahme ? { onMassnahme } : {})} tiefe={tiefe + 1} />}
          </li>
        );
      })}
    </ul>
  );
}
