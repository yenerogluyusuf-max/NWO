import { t, zahl } from "../../i18n";
import { verwaltungBilanz } from "../../sim/reich";
import type { World } from "../../sim/types";
import "./bauhilfe.css";

/** Gemeinsame Erklärung der vorhandenen politischen Hebel in Bauakte und Industrieprojekt. */
export function Bauhilfe({ world }: { world: World }) {
  const v = verwaltungBilanz(world);
  return <details className="bauhilfe">
    <summary>{t("balance.bautitel")}</summary>
    <p>{t("balance.baulage", { vorrat: zahl(v.vorrat, 1), saldo: `${v.netto >= 0 ? "+" : ""}${zahl(v.netto, 1)}` })}</p>
    <p>{t("balance.personal", { wert: zahl(v.personal, 1) })}</p>
    <ul>{["baupause", "bauprioritaet", "baupersonal"].map(k => <li key={k}>{t(`balance.${k}`)}</li>)}</ul>
  </details>;
}
