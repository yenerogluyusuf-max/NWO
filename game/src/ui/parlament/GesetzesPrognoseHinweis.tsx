import type { gesetzPrognose } from "../../sim/handeln";
import { formatDateDe } from "../../sim/dates";
import { PARTEI_NAME } from "../../sim/fraktionen";
import { t } from "../../i18n";
import "./prognose.css";

/** Die Zeit bis zum Votum erklären, ohne daraus schon ein Abstimmungsergebnis zu machen. */
export function GesetzesPrognoseHinweis({ prognose }: { prognose: ReturnType<typeof gesetzPrognose> }) {
  const p = prognose;
  return <aside className={`par-prognose${p.auslaufend.length ? " mit-frist" : ""}`} aria-label={t("gp.titel")}>
    <header><span>{t("gp.titel")}</span><time dateTime={p.datum}>{formatDateDe(p.datum)}</time></header>
    <div className="par-prognose-zahlen">
      <div><span>{t("gp.heute")}</span><strong>{p.heuteJa}</strong></div>
      <span className="par-prognose-pfeil" aria-hidden="true">→</span>
      <div><span>{t("gp.votum")}</span><strong className={p.luecke ? "fehlt" : "reicht"}>{p.ja}</strong></div>
      <p>{p.luecke ? t("gp.luecke", { n:p.luecke }) : t("gp.mehrheit")}</p>
    </div>
    {p.auslaufend.length > 0 && <div className="par-prognose-fristen">
      <strong>{t("gp.fristeffekt", { n:Math.max(0,-p.fristDelta) })}</strong>
      <ul>{p.auslaufend.map(f => <li key={f.partei}>{t("gp.fraktion", { partei:PARTEI_NAME[f.partei]??f.partei, sitze:f.sitze, datum:formatDateDe(f.datum) })}</li>)}</ul>
      <p>{t("gp.hilfe")}</p>
    </div>}
    <p className="par-prognose-grenze">{t("gp.grenze")}</p>
  </aside>;
}
