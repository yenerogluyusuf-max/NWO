// Die Vorschau in einer Tabelle: Was in zwölf Monaten mit und ohne die Entscheidung erwartet wird, Größe für Größe, mit Richtung und Wertung.

import type { Metric, PrognoseReihe } from "../../sim/forecast";
import { KENNZAHLEN_NACH_ID } from "../../sim/wirtschaft-kennzahlen";
import "./wirtschaft.css";

import { t } from "../../i18n";
const nf = (x: number, d: number) => x.toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d });

export function Wirkung({ reihen, metriken, rechnet }: { reihen: PrognoseReihe[] | null; metriken: { id: Metric; kennzahl: string; label: string }[]; rechnet?: boolean }) {
  if (!reihen) return rechnet ? <p className="wi-hinweis wi-rechnet">{t("ui.wirtschaft.Wirkung.b2a60be")}</p> : null;
  const zeilen = metriken
    .map((m) => {
      const r = reihen.find((x) => x.metric === m.id);
      const k = KENNZAHLEN_NACH_ID[m.kennzahl]!;
      if (!r || !r.mit.length) return null;
      const o = r.ohne[r.ohne.length - 1]!;
      const a = r.mit[r.mit.length - 1]!;
      const delta = a.mid - o.mid;
      const spanne = Math.max((a.high - a.low) / 2, (o.high - o.low) / 2, Math.abs(o.mid) * 0.002, 0.005);
      const unklar = Math.abs(delta) < spanne * 0.25;
      const gut = unklar || k.gut === "neutral" ? null : k.gut === "niedrig" ? delta < 0 : delta > 0;
      return { m, k, o, a, delta, unklar, gut };
    })
    .filter((x): x is NonNullable<typeof x> => !!x);
  if (!zeilen.length) return null;
  return (
    <table className="wi-wirkung">
      <caption>{t("ui.wirtschaft.Wirkung.6ba7590")}</caption>
      <thead>
        <tr>
          <th scope="col">{t("ui.wirtschaft.Wirkung.d9130ae")}</th>
          <th scope="col">Ohne</th>
          <th scope="col">Mit</th>
          <th scope="col">Wirkung</th>
        </tr>
      </thead>
      <tbody>
        {zeilen.map(({ m, k, o, a, delta, unklar, gut }) => (
          <tr key={m.id}>
            <th scope="row">{m.label}</th>
            <td>{nf(o.mid, k.stellen)}</td>
            <td>{nf(a.mid, k.stellen)}</td>
            <td className={gut === true ? "wi-gut" : gut === false ? "wi-schlecht" : "wi-neutral"}>
              {unklar ? (
                <>◆ kaum Unterschied</>
              ) : (
                <>
                  {delta > 0 ? "▲" : "▼"} {delta > 0 ? "+" : "−"}
                  {nf(Math.abs(delta), Math.max(1, k.stellen))} {k.einheit === "Indexpunkte" ? "" : k.einheit}
                </>
              )}
            </td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr>
          <td colSpan={4}>{t("ui.wirtschaft.Wirkung.925fb24")}</td>
        </tr>
      </tfoot>
    </table>
  );
}
