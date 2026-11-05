// Das Bild der Wählerkoalition (AP 12, nach Democracy 4): jede Gruppe ein Kreis. Waagerecht steht die Stimmung (0 bis 100) mit den
// Schwellen für „trägt“ und „schwankt“, die Größe ist das Gewicht der Gruppe, der Pfeil zeigt, wohin die Stimmung bei heutigen
// Verhältnissen strebt. Ein Klick wählt die Gruppe; daneben steht sie im Einzelnen.

import type { GruppeKurz } from "../../sim/waehler-detail";
import { SCHWELLE_SCHWANKEND, SCHWELLE_TRAEGER } from "../../sim/waehler-detail";
import { t } from "../../i18n";
import { gewichtWort, nf } from "./format";

/** Eine Zeile je Gruppe, nach Gewicht geordnet: der Kreis sitzt genau auf ihrer Stimmung, nichts wird verschoben. */
export function Kreisfeld({ gruppen, aktiv, waehle }: { gruppen: GruppeKurz[]; aktiv: string | null; waehle: (id: string) => void }) {
  const werte = gruppen.flatMap((g) => [g.laune, g.ziel]);
  const von = Math.max(0, Math.min(30, Math.floor((Math.min(...werte) - 6) / 5) * 5));
  const bis = Math.min(100, Math.max(75, Math.ceil((Math.max(...werte) + 6) / 5) * 5));
  const x = (v: number) => ((Math.max(von, Math.min(bis, v)) - von) / (bis - von)) * 100;
  const gross = Math.max(...gruppen.map((g) => g.anteil), 0.01);
  const d = (g: GruppeKurz) => Math.round(16 + 16 * Math.sqrt(g.anteil / gross));
  const striche = Array.from({ length: Math.floor((bis - von) / 10) + 1 }, (_, i) => von + i * 10);
  const reihe = [...gruppen].sort((a, b) => b.anteil - a.anteil);
  return (
    <figure className="wa-feld" aria-label={t("wa.feld.aria")}>
      <div className="wa-feld-raster">
        <span />
        <div className="wa-feld-kopf">
          {/* Zonen über der Achse; der Name steht in der Zone, wenn sie breit genug ist, sonst im Tooltip */}
          {([["gegner", 0, x(SCHWELLE_SCHWANKEND)], ["schwankend", x(SCHWELLE_SCHWANKEND), x(SCHWELLE_TRAEGER)], ["traeger", x(SCHWELLE_TRAEGER), 100]] as const).map(([z, a, b]) => (
            <span key={z} className={`wa-feld-zone ${z}`} style={{ left: `${a}%`, width: `${b - a}%` }} title={t(`wa.legende.${z}`)}>{b - a >= 18 ? t(`wa.feld.zone.${z}`) : ""}</span>
          ))}
        </div>
        {reihe.map((g) => {
          const laenge = x(g.ziel) - x(g.laune), groesse = d(g);
          return [
            <button key={`${g.id}-n`} type="button" className={`wa-feld-name${aktiv === g.id ? " on" : ""}`} onClick={() => waehle(g.id)} aria-pressed={aktiv === g.id}>
              {g.name}
            </button>,
            <div key={g.id} className={`wa-feld-spur${aktiv === g.id ? " on" : ""}`}>
              <i className="wa-feld-b gegner" style={{ left: 0, width: `${x(SCHWELLE_SCHWANKEND)}%` }} />
              <i className="wa-feld-b schwankend" style={{ left: `${x(SCHWELLE_SCHWANKEND)}%`, width: `${x(SCHWELLE_TRAEGER) - x(SCHWELLE_SCHWANKEND)}%` }} />
              <i className="wa-feld-b traeger" style={{ left: `${x(SCHWELLE_TRAEGER)}%`, width: `${100 - x(SCHWELLE_TRAEGER)}%` }} />
              {Math.abs(g.ziel - g.laune) >= 2 && <i className={`wa-feld-pfeil ${laenge > 0 ? "steigt" : "faellt"}`} style={{ left: `${laenge > 0 ? x(g.laune) : x(g.ziel)}%`, width: `${Math.abs(laenge)}%` }} aria-hidden />}
              <button type="button" className={`wa-feld-kreis rolle-${g.rolle}${aktiv === g.id ? " on" : ""}`} style={{ left: `${x(g.laune)}%`, width: groesse, height: groesse }} tabIndex={-1}
                title={t("wa.feld.titel", { name: g.name, laune: nf(g.laune, 0), ziel: nf(g.ziel, 0), gewicht: gewichtWort(g.anteil) })} onClick={() => waehle(g.id)}>
                <b>{Math.round(g.laune)}</b>
              </button>
            </div>,
          ];
        })}
        <span />
        <div className="wa-feld-achse">{striche.map((v) => <span key={v} style={{ left: `${x(v)}%` }}>{v}</span>)}</div>
      </div>
      <figcaption>{t("wa.feld.legende")}</figcaption>
    </figure>
  );
}
