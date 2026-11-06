// Zuletzt fertig: Jeder abgeschlossene Eingriff zeigt, was vorher war, was bei der Fertigstellung galt und was heute ist.
// Bei Pflege und Restaurierung steht zuerst der Zustand des Stücks. Die Dauerwirkung baut sich nach der Fertigstellung über Monate auf,
// darum steht die dritte Spalte „heute“ dabei.

import { useState } from "react";
import type { World } from "../../sim/types";
import type { Bereich } from "../../sim/reich-typen";
import { eingriffHeute, reichZustand, vorhabenDef } from "../../sim/reich";
import { NET } from "../../sim/modell";
import { formatDateDe } from "../../sim/dates";

import { aktuelleLocale, t } from "../../i18n";
const name = (id: string) => NET.nodes[NET.index.get(id) ?? -1]?.name ?? id;
const zahl = (x: number) => Math.round(x).toLocaleString(aktuelleLocale());

/** `kacheln`: in der Akte Land die fertigen Eingriffe als Kacheln, die Tabelle des gewählten darunter (Tagarbeit 6. November). */
export function Verlauf({ world, bereich, kacheln }: { world: World; bereich: Bereich; kacheln?: boolean }) {
  const [wahl, setWahl] = useState<string | null>(null);
  const z = reichZustand(world);
  const liste = [...(z.verlauf ?? [])]
    .filter((e) => vorhabenDef(e.id)?.bereich === bereich)
    .reverse()
    .slice(0, 6);
  if (!liste.length) return null;
  if (kacheln) {
    const e = liste.find((x) => `${x.id}-${x.tag}` === wahl);
    return (
      <section className="rr-abschnitt lk-abschnitt">
        <h4>
          {t("ui2.ui.reich.Verlauf.719555b")} <em>{t("ui.reich.Verlauf.1a8d4ba")}</em>
        </h4>
        <ul className="lk-raster lk-raster-schmal">
          {liste.map((x) => {
            const k = `${x.id}-${x.tag}`;
            return (
              <li key={k}>
                <button type="button" className={`lk-kachel${k === wahl ? " on" : ""}`} aria-expanded={k === wahl} onClick={() => setWahl(k === wahl ? null : k)}>
                  <strong>{x.name}</strong>
                  {x.zustand && <span className="lk-zustand">{t("ui2.ui.reich.Verlauf.c396097", { p0: x.zustand.vorher, p1: x.zustand.nachher })}</span>}
                  <span className="lk-fuss">
                    <span className="lk-wort">{formatDateDe(x.datum)}</span>
                    <span className="lk-pfeil" aria-hidden>{k === wahl ? "▴" : "▾"}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        {e && (
          <div className="lk-detail" role="region" aria-label={e.name}>
            <header>
              <strong>{e.name}</strong>
              <button type="button" className="knopf-leise" onClick={() => setWahl(null)}>{t("tag_t3.zuklappen")}</button>
            </header>
            <Tabelle world={world} e={e} />
          </div>
        )}
      </section>
    );
  }
  return (
    <section className="rr-abschnitt">
      <h4>
        {t("ui2.ui.reich.Verlauf.719555b")} <em>{t("ui.reich.Verlauf.1a8d4ba")}</em>
      </h4>
      <ul className="rv-liste">
        {liste.map((e) => {
          return (
            <li key={`${e.id}-${e.tag}`} className="rv-eintrag">
              <div className="rv-kopf">
                <strong>{e.name}</strong>
                <span className="rr-bau-info">{formatDateDe(e.datum)}</span>
              </div>
              {e.zustand && (
                <p className="rv-zustand">
                  {t("ui2.ui.reich.Verlauf.c396097", { p0: e.zustand.vorher, p1: e.zustand.nachher })}
                </p>
              )}
              <Tabelle world={world} e={e} />
            </li>
          );
        })}
      </ul>
    </section>
  );
}

type Eingriff = NonNullable<ReturnType<typeof reichZustand>["verlauf"]>[number];

/** Vorher, bei Fertigstellung und heute je Größe (höchstens fünf). */
function Tabelle({ world, e }: { world: World; e: Eingriff }) {
  const heute = eingriffHeute(world, e);
  const ids = Object.keys(e.vorher).filter((id) => id in e.nachher);
  if (!ids.length) return null;
  return (
    <table className="rv-tabelle">
      <thead>
        <tr>
          <th scope="col">{t("ui.reich.Verlauf.d9130ae")}</th>
          <th scope="col">{t("ui2.ui.reich.Verlauf.60c78d2")}</th>
          <th scope="col">{t("ui2.ui.reich.Verlauf.69c4e94")}</th>
          <th scope="col">{t("ui2.ui.reich.Verlauf.1ab3309")}</th>
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
  );
}
