// Versprechen und Chronik: Was nach den Katastrophen zugesagt und geliefert wurde, was es am Wahltag kostet,
// und die Liste aller Fälle dieser Amtszeit.

import type { World } from "../../sim/types";
import { addDays, formatDateDe } from "../../sim/dates";
import { ART_NAMEN, namenVon, versprechensLage, versprechensschuldMalus } from "../../sim/katastrophe";
import type { Ziel } from "../schreibtisch/briefing";
import { nf } from "./daten";

import { t } from "../../i18n";
export function Versprechen({ world, onGehe }: { world: World; onGehe?: (z: Ziel) => void }) {
  const zeilen = versprechensLage(world);
  const malus = versprechensschuldMalus(world);
  if (zeilen.length === 0) {
    return (
      <div className="kr-leer">
        <h3>Noch nichts versprochen</h3>
        <p>
          {t("ui.katastrophe.Versprechen.4ad977f")}
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
        <h3>{t("ui.katastrophe.Versprechen.83f7113")}</h3>
        {malus.punkte > 0 ? (
          <p>{malus.text}</p>
        ) : (
          <p>{t("ui.katastrophe.Versprechen.2161d75")}</p>
        )}
        <p className="kr-klein">
          {t("ui.katastrophe.Versprechen.9bd9c13")}
        </p>
        {onGehe && (
          <div className="kr-aktionen">
            <button type="button" className="kr-knopf" onClick={() => onGehe({ art: "akte", akte: "waehler" })}>
              {t("ui.katastrophe.Versprechen.0b6eb4d")}
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
        <h3>{t("ui.katastrophe.Versprechen.9256116")}</h3>
        <p>{t("ui.katastrophe.Versprechen.2b52f4f")}</p>
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
