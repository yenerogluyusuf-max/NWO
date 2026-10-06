// Zuletzt fertig: Jeder abgeschlossene Eingriff zeigt, was vorher war, was bei der Fertigstellung galt und was heute ist.
// Bei Pflege und Restaurierung steht zuerst der Zustand des Stücks. Die Dauerwirkung baut sich nach der Fertigstellung über Monate auf,
// darum steht die dritte Spalte „heute“ dabei.

import type { World } from "../../sim/types";
import type { Bereich } from "../../sim/reich-typen";
import { eingriffHeute, reichZustand, vorhabenDef } from "../../sim/reich";
import { NET } from "../../sim/modell";
import { formatDateDe } from "../../sim/dates";

import { t } from "../../i18n";
const name = (id: string) => NET.nodes[NET.index.get(id) ?? -1]?.name ?? id;
const zahl = (x: number) => Math.round(x).toLocaleString("de-DE");

export function Verlauf({ world, bereich }: { world: World; bereich: Bereich }) {
  const z = reichZustand(world);
  const liste = [...(z.verlauf ?? [])]
    .filter((e) => vorhabenDef(e.id)?.bereich === bereich)
    .reverse()
    .slice(0, 6);
  if (!liste.length) return null;
  return (
    <section className="rr-abschnitt">
      <h4>
        Zuletzt fertig <em>{t("ui.reich.Verlauf.1a8d4ba")}</em>
      </h4>
      <ul className="rv-liste">
        {liste.map((e) => {
          const heute = eingriffHeute(world, e);
          const ids = Object.keys(e.vorher).filter((id) => id in e.nachher);
          return (
            <li key={`${e.id}-${e.tag}`} className="rv-eintrag">
              <div className="rv-kopf">
                <strong>{e.name}</strong>
                <span className="rr-bau-info">{formatDateDe(e.datum)}</span>
              </div>
              {e.zustand && (
                <p className="rv-zustand">
                  Zustand {e.zustand.vorher} → {e.zustand.nachher}
                </p>
              )}
              {ids.length > 0 && (
                <table className="rv-tabelle">
                  <thead>
                    <tr>
                      <th scope="col">{t("ui.reich.Verlauf.d9130ae")}</th>
                      <th scope="col">Vorher</th>
                      <th scope="col">Bei Fertigstellung</th>
                      <th scope="col">Heute</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ids.slice(0, 5).map((id) => (
                      <tr key={id}>
                        <th scope="row">{name(id)}</th>
                        <td>{zahl(e.vorher[id]!)}</td>
                        <td>{zahl(e.nachher[id]!)}</td>
                        <td>{heute[id] !== undefined ? zahl(heute[id]!) : "–"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
