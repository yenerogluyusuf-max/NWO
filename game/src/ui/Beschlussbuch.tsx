// Das Beschlussbuch: Was der Spieler beschlossen hat — mit Datum, Kosten und
// Umsetzungsstand. Jede wirksame Maßnahme erscheint hier; nichts geht verloren.

import { useMemo } from "react";
import type { World } from "../sim/types";
import { NET, setPolicy } from "../sim/world";
import { nationalAverage, policyCost } from "../sim/netz";
import { formatDateDe } from "../sim/dates";

const nf = (x: number) => x.toLocaleString("de-DE", { maximumFractionDigits: 2, minimumFractionDigits: 2 });

export function Beschlussbuch({ world, refresh }: { world: World; refresh: () => void }) {
  const beschluesse = useMemo(
    () => [...world.log].reverse().filter((l) => l.kind === "entscheidung"),
    [world.log.length],
  );

  const offen = useMemo(() => {
    const out: { id: string; name: string; now: number; target: number; months: number }[] = [];
    for (const [id, target] of Object.entries(world.net.targets)) {
      const i = NET.index.get(id);
      if (i === undefined) continue;
      const now = nationalAverage(NET, world.net, id);
      if (Math.abs(now - target) > 1) {
        out.push({ id, name: NET.nodes[i]!.name, now, target, months: NET.nodes[i]!.months ?? 1 });
      }
    }
    return out;
  }, [world.net.targets, world.net.values]);

  const kosten = policyCost(NET, world.net);

  return (
    <div className="beschlussbuch">
      <section className="paper">
        <h3>Die Rechnung</h3>
        <div className="costbox big">
          <div>
            <span>Laufende Politikosten</span>
            <strong>
              {kosten >= 0 ? "" : "+"}
              {nf(Math.abs(kosten))} % des BIP pro Jahr
            </strong>
            <em>{kosten > 0 ? "mehr Ausgaben als beim Amtsantritt" : kosten < 0 ? "netto Einnahmen gegenüber dem Amtsantritt" : "wie beim Amtsantritt"}</em>
          </div>
          <div>
            <span>Beschlüsse im Buch</span>
            <strong>{beschluesse.length}</strong>
            <em>seit dem Amtsantritt</em>
          </div>
          <div>
            <span>Laufende Umsetzungen</span>
            <strong>{offen.length}</strong>
            <em>Maßnahmen noch nicht wirksam</em>
          </div>
        </div>
      </section>

      {offen.length > 0 && (
        <section className="paper">
          <h3>In Umsetzung</h3>
          <p className="subtitle">Ein Beschluss ist noch keine Wirkung. Diese Maßnahmen laufen noch:</p>
          <ul className="offen-liste">
            {offen.map((o) => (
              <li key={o.id}>
                <div className="offen-kopf">
                  <strong>{o.name}</strong>
                  <span className="subtitle">
                    {Math.round(o.now)} → {Math.round(o.target)} · noch etwa {o.months} Monat{o.months === 1 ? "" : "e"}
                  </span>
                  <button
                    className="link"
                    onClick={() => {
                      setPolicy(world, o.id, Math.round(o.now));
                      refresh();
                    }}
                    title="Zurück auf den heutigen Stand stellen"
                  >
                    stoppen
                  </button>
                </div>
                <div className="impl-bar" aria-hidden="true">
                  <div className="impl-now" style={{ width: `${Math.max(0, Math.min(100, o.now))}%` }} />
                  <div className="impl-target" style={{ left: `${Math.max(0, Math.min(100, o.target))}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="paper">
        <h3>Beschlüsse</h3>
        {beschluesse.length === 0 ? (
          <p className="subtitle">Noch nichts beschlossen. Jede wirksame Maßnahme landet hier — mit Datum und Begründung.</p>
        ) : (
          <ul className="beschluss-liste">
            {beschluesse.map((l, i) => (
              <li key={i}>
                <span className="when">{formatDateDe(l.date)}</span>
                <div>
                  <p>{l.text}</p>
                  {l.why && <p className="chat-why">{l.why}</p>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
