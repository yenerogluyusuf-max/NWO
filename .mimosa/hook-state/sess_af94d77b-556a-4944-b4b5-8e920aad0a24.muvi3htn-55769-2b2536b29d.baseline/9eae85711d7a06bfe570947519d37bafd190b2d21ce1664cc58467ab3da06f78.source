// Versprechen und Chronik: Was nach den Katastrophen zugesagt und geliefert wurde, was es am Wahltag kostet,
// und die Liste aller Fälle dieser Amtszeit.

import type { World } from "../../sim/types";
import { addDays, formatDateDe } from "../../sim/dates";
import { ART_NAMEN, namenVon, versprechensLage, versprechensschuldMalus } from "../../sim/katastrophe";
import type { Ziel } from "../schreibtisch/briefing";
import { nf } from "./daten";

export function Versprechen({ world, onGehe }: { world: World; onGehe?: (z: Ziel) => void }) {
  const zeilen = versprechensLage(world);
  const malus = versprechensschuldMalus(world);
  if (zeilen.length === 0) {
    return (
      <div className="kr-leer">
        <h3>Noch nichts versprochen</h3>
        <p>
          Ein öffentliches Versprechen nach einer Katastrophe, etwa „Wir bauen Ihnen die Häuser wieder auf“, bringt Zustimmung sofort und wird später gemessen. Hier sehen Sie, ob Sie
          halten, was Sie zugesagt haben.
        </p>
      </div>
    );
  }
  return (
    <div className="kr-versprechen-seite">
      <ul className="kr-versprechen-liste">
        {zeilen.map((z) => {
          const stand = z.quote >= 0.95 ? "erfüllt" : z.imBau ? "im Bau" : "offen";
          return (
            <li key={z.fallId} className={`stand-${stand === "erfüllt" ? "ok" : stand === "im Bau" ? "bau" : "offen"}`}>
              <div className="kr-versprechen-kopf">
                <h4>
                  {ART_NAMEN[z.art]}, {z.ort}
                </h4>
                <span className="kr-chip">{stand}</span>
              </div>
              <div className="kr-balken gross" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(z.quote * 100)}>
                <i style={{ width: `${Math.round(z.quote * 100)}%` }} />
              </div>
              <p>
                <strong>{nf(Math.round(z.geliefert))}</strong> von <strong>{nf(z.versprochen)}</strong> versprochenen Wohnungen geliefert ({nf(z.quote * 100)} Prozent).
              </p>
            </li>
          );
        })}
      </ul>

      <section className={`kr-wahltag ${malus.punkte > 0 ? "malus" : ""}`}>
        <h3>Was das am Wahltag kostet</h3>
        {malus.punkte > 0 ? (
          <p>{malus.text}</p>
        ) : (
          <p>Bisher droht kein Abzug: Versprechen werden erst sechs Monate nach der Katastrophe gemessen, und was geliefert ist, zählt für Sie.</p>
        )}
        <p className="kr-klein">
          Zur Mahnung: Nach dem Beben von 2023 waren 319.000 Wohnungen versprochen; im Februar 2025 waren 201.431 übergeben. Wer mehr verspricht, als er baut, wird am Wahltag daran
          gemessen.
        </p>
        {onGehe && (
          <div className="kr-aktionen">
            <button type="button" className="kr-knopf" onClick={() => onGehe({ art: "akte", akte: "waehler" })}>
              Stimmung der Wählergruppen
            </button>
            <button type="button" className="kr-knopf" onClick={() => onGehe({ art: "akte", akte: "reich_infra" })}>
              Baureihenfolge im Reich
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

export function Chronik({ world }: { world: World }) {
  const faelle = [...(world.spiel?.katastrophen?.faelle ?? [])].sort((a, b) => b.tag - a.tag);
  if (faelle.length === 0) {
    return (
      <div className="kr-leer">
        <h3>Keine Fälle in dieser Amtszeit</h3>
        <p>Sobald eine Katastrophe eintritt, steht sie hier mit Datum, Opferzahl und dem Stand ihrer Bewältigung.</p>
      </div>
    );
  }
  return (
    <table className="kr-chronik">
      <thead>
        <tr>
          <th scope="col">Datum</th>
          <th scope="col">Ereignis</th>
          <th scope="col" className="zahl">
            Todesopfer
          </th>
          <th scope="col">Stand</th>
        </tr>
      </thead>
      <tbody>
        {faelle.map((f) => (
          <tr key={f.id}>
            <td>{formatDateDe(f.datum)}</td>
            <td>
              {ART_NAMEN[f.art]} in {namenVon(f.provinzen)}
            </td>
            <td className="zahl">{nf(f.tote)}</td>
            <td>{f.bewaeltigt ? `bewältigt am ${formatDateDe(addDays(world.date, f.bewaeltigt - world.day))}` : "läuft"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
