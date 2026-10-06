// Chronik und Umfragen: der Verlauf der Zustimmung und die Ereignisse, auf die Sie geantwortet (oder nicht geantwortet) haben.

import type { World } from "../sim/types";
import { formatDateDe } from "../sim/dates";
import { maxAmtszeiten } from "../sim/amtszeit";
import { t } from "../i18n";
import { angezeigteZustimmung, institutsReihe } from "../sim/medien";

/** „Amtszeit n von m“ bei einer Grenze, „Amtszeit n, ohne Begrenzung“ ohne (die Verfassung entscheidet, die Anzeige liest sie). */
export function amtszeitZeile(world: World): string {
  const nr = world.spiel?.amtszeit ?? 1;
  const max = maxAmtszeiten(world);
  return Number.isFinite(max) ? t("enden.chronik.amtszeit_von", { nr, max }) : t("enden.chronik.amtszeit_ohne", { nr });
}

function Verlauf({ werte, beschriftung }: { werte: number[]; beschriftung: string }) {
  if (werte.length < 2) return <p className="subtitle">{t("ui.Chronik.aaf6811")}</p>;
  const W = 520;
  const H = 120;
  const min = Math.min(...werte, 30);
  const max = Math.max(...werte, 60);
  const x = (i: number) => 12 + (i / (werte.length - 1)) * (W - 24);
  const y = (v: number) => H - 14 - ((v - min) / (max - min)) * (H - 28);
  const d = werte.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  return (
    <svg className="verlauf" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={beschriftung}>
      <line x1="12" x2={W - 12} y1={y(50)} y2={y(50)} className="schwelle" />
      <text x={W - 12} y={y(50) - 4} textAnchor="end" className="schwelle-text">
        {t("medien.chronik.schwelle")}
      </text>
      <path d={d} className="linie" />
      <circle cx={x(werte.length - 1)} cy={y(werte[werte.length - 1]!)} r="3.5" className="punkt" />
    </svg>
  );
}

export function Chronik({ world }: { world: World }) {
  const spiel = world.spiel;
  if (!spiel) return null;
  // Wie im Wählerbarometer: der Strom der Institute, bei gekauften Rohdaten die Wahrheit
  const zeig = angezeigteZustimmung(world);
  const roh = zeig.quelle === "rohdaten";
  const werte = roh ? spiel.umfrage.verlauf.map((v) => v.wert) : institutsReihe(world).map((x) => x.wert);
  const wahlDatum = formatDateDe(new Date(Date.parse(spiel.start.datum + "T00:00:00Z") + spiel.wahltag * 86_400_000).toISOString().slice(0, 10));
  const kopf =
    zeig.quelle === "rohdaten"
      ? t("medien.chronik.heute_rohdaten", { wert: Math.round(zeig.wert), datum: wahlDatum, amtszeit: amtszeitZeile(world) })
      : zeig.quelle === "institut"
        ? t("medien.chronik.heute", { wert: Math.round(zeig.wert), institut: zeig.institut ?? "", tage: zeig.alterTage, datum: wahlDatum, amtszeit: amtszeitZeile(world) })
        : t("medien.chronik.heute_start", { wert: Math.round(zeig.wert), datum: wahlDatum, amtszeit: amtszeitZeile(world) });
  return (
    <div className="chronik-akte">
      <section className="paper">
        <h3>Zustimmung</h3>
        <p className="subtitle">{kopf}</p>
        <Verlauf werte={werte} beschriftung={t("medien.chronik.verlauf")} />
      </section>
      <section className="paper">
        <h3>Was geschah</h3>
        {spiel.chronik.length === 0 && <p className="subtitle">{t("ui.Chronik.f33e781")}</p>}
        <ul className="chronik">
          {[...spiel.chronik].reverse().map((c, i) => (
            <li key={i}>
              <span className="wann">{formatDateDe(c.datum)}</span>
              <strong>{c.titel}</strong>
              <em>{c.ausgang}</em>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
