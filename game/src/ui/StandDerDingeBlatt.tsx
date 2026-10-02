// Das „Stand der Dinge“-Blatt beim Laden: einmalig, ruhig, wegklickbar — danach der normale Schreibtisch.
// Atlas-Typografie wie das Ereignisfenster (frame, kicker, Flourish), aber ohne Szene: ein Blatt, keine Episode.
// Die Zahlen rechnet standderdinge.ts; hier wird nur gezeigt.

import { Corners, Flourish } from "./art/Ornament";
import type { KennzahlDelta, StandDerDinge as Stand } from "./standderdinge";

const nf = (x: number, d = 1) => x.toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d });

function DeltaChip({ d }: { d: KennzahlDelta }) {
  const bewegt = Math.abs(d.delta) >= 0.05;
  const auf = d.delta > 0;
  const gut = bewegt && auf === d.gutWennAuf;
  return (
    <li className={`sdd-delta${bewegt ? (gut ? " gut" : " schlecht") : ""}`}>
      <span className="sdd-delta-label">{d.label}</span>
      <span className="sdd-delta-wert">
        {d.id === "kapital" ? Math.floor(d.nach) : nf(d.nach)}
        {d.einheit ? ` ${d.einheit}` : ""}
      </span>
      <span className="sdd-delta-diff">
        {bewegt ? `${auf ? "▲" : "▼"} ${nf(Math.abs(d.delta))}` : "± 0"}
        <em> zuletzt {d.id === "kapital" ? Math.floor(d.von) : nf(d.von)}</em>
      </span>
    </li>
  );
}

export function StandDerDingeBlatt({ stand, onSchliessen }: { stand: Stand; onSchliessen: () => void }) {
  return (
    <div className="event-layer" role="dialog" aria-modal="true" aria-labelledby="sdd-titel">
      <article className="frame event-window sdd">
        <Corners />
        <div className="event-body sdd-body">
          <p className="kicker">Stand der Dinge</p>
          <h2 id="sdd-titel">
            {stand.datum} · {stand.amtszeit}. Amtszeit
          </h2>
          <Flourish width={180} />
          <p className="subtitle">
            Willkommen zurück. Die Wahl ist {stand.monateBisWahl <= 1 ? "in Kürze" : `in ${stand.monateBisWahl} Monaten`}
            {stand.vergleichDatum ? `; verglichen wird mit dem Beginn Ihrer letzten Sitzung (${stand.vergleichDatum})` : ""}.
          </p>

          {stand.deltas ? (
            <ul className="sdd-deltas" aria-label="Veränderung seit der letzten Sitzung">
              {stand.deltas.map((d) => (
                <DeltaChip key={d.id} d={d} />
              ))}
            </ul>
          ) : (
            <p className="sdd-notiz">Keine Vergleichsdaten aus der letzten Sitzung — sie entstehen ab jetzt bei jedem Speichern.</p>
          )}

          <div className="sdd-spalten">
            <section>
              <h3>Laufende Vorgänge</h3>
              {stand.vorgaenge.length === 0 ? (
                <p className="sdd-notiz">Nichts läuft gerade. Der Beraterstab am Schreibtisch sagt, was sich lohnt.</p>
              ) : (
                <ul className="sdd-liste">
                  {stand.vorgaenge.map((v) => (
                    <li key={v.id}>
                      <strong>{v.titel}</strong>
                      <span className="sdd-rest">{v.rest}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section>
              <h3>Probleme</h3>
              {stand.probleme.length === 0 ? (
                <p className="sdd-notiz">Keine Warnung. Was sich ändert, steht zuerst am Schreibtisch.</p>
              ) : (
                <ul className="sdd-liste">
                  {stand.probleme.map((p) => (
                    <li key={p.id}>
                      <span className={`sdd-ampel ${p.stufe}`} role="img" aria-label={p.stufe === "rot" ? "dringend" : "Achtung"} />
                      <strong>{p.text}</strong>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <p className="sdd-zeile">
            <span className="sdd-zeile-label">Agenda</span> {stand.agenda ?? "Kein fester Termin im Staatsjahr."}
          </p>
          <p className="sdd-zeile">
            <span className="sdd-zeile-label">Dringendste Frist</span>{" "}
            {stand.frist ? `${stand.frist.titel} — ${stand.frist.tage <= 0 ? "heute" : stand.frist.tage === 1 ? "morgen" : `in ${stand.frist.tage} Tagen`}` : "Keine offene Frist."}
          </p>

          <div className="event-actions">
            <button className="brass-button" onClick={onSchliessen}>
              Zum Schreibtisch
            </button>
          </div>
        </div>
      </article>
    </div>
  );
}
