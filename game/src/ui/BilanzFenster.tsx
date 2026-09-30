// Bilanz der Amtszeit: das Geschichtsbuchkapitel aus den Daten der Partie.

import type { World } from "../sim/types";
import { erstelleBilanz } from "../sim/bilanz";
import { Corners, Flourish } from "./art/Ornament";
import { formatDateDe } from "../sim/dates";

export function BilanzFenster({ world, onNeu, onSchliessen }: { world: World; onNeu: () => void; onSchliessen: () => void }) {
  const b = erstelleBilanz(world);
  const ende = world.spiel!.ende!;
  return (
    <div className="event-layer bilanz-layer" role="dialog" aria-modal="true" aria-labelledby="bilanz-titel">
      <article className="frame bilanz">
        <Corners />
        <div className="bilanz-body">
          <p className="kicker">Kapitel der Geschichtsbücher · {formatDateDe(ende.datum)}</p>
          <h1 id="bilanz-titel">{b.titel}</h1>
          <Flourish width={240} />
          <div className="bilanz-text">
            {b.absaetze.map((a, i) => (
              <p key={i}>{a}</p>
            ))}
          </div>
          <div className="bilanz-spalten">
            <section>
              <h3>Zahlen</h3>
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
              <h3>Ziele</h3>
              <ul className="bilanz-ziele">
                {b.ziele.length === 0 && <li>Keine Ziele gesetzt.</li>}
                {b.ziele.map((z) => (
                  <li key={z.titel} className={z.erreicht ? "ja" : "nein"}>
                    <span className="haken" aria-hidden>
                      {z.erreicht ? "✓" : "✗"}
                    </span>
                    <span>
                      <strong>{z.titel}</strong>
                      <em>{z.erreicht ? "erreicht" : "verfehlt"} · {z.stand}</em>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
            <section>
              <h3>Was geschah</h3>
              <ul className="chronik">
                {b.chronik.length === 0 && <li>Nichts, das eine Antwort verlangt hätte.</li>}
                {b.chronik.map((c, i) => (
                  <li key={i}>
                    <span className="wann">{formatDateDe(c.datum)}</span>
                    <strong>{c.titel}</strong>
                    <em>{c.ausgang}</em>
                  </li>
                ))}
              </ul>
            </section>
          </div>
          <div className="event-actions">
            <button className="brass-button" onClick={onNeu}>
              Neue Amtszeit
            </button>
            <button className="leather-button" onClick={onSchliessen}>
              Karte ansehen
            </button>
          </div>
        </div>
      </article>
    </div>
  );
}
