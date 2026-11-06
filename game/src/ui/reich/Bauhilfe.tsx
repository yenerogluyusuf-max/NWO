import { t, zahl } from "../../i18n";
import { PAUSE_VERFALL, verwaltungBilanz, VORZIEHEN_VERWALTUNG } from "../../sim/reich";
import type { World } from "../../sim/types";
import "./bauhilfe.css";

/** Zahlen der Hinweise aus denselben Spielparametern, die der Bau bucht (Pausenverfall, Preis des Vorziehens). */
export const bauhilfeWerte = (): Record<string, Record<string, string | number>> => ({
  baupause: { anteil: zahl(PAUSE_VERFALL * 100, 1) },
  bauprioritaet: { n: VORZIEHEN_VERWALTUNG },
  baupersonal: {},
});

/** Gemeinsame Erklärung der vorhandenen politischen Hebel in Bauakte und Industrieprojekt. */
export function Bauhilfe({ world }: { world: World }) {
  const v = verwaltungBilanz(world);
  const werte = bauhilfeWerte();
  return <details className="bauhilfe">
    <summary>{t("balance.bautitel")}</summary>
    <p>{t("balance.baulage", { vorrat: zahl(v.vorrat, 1), saldo: `${v.netto >= 0 ? "+" : ""}${zahl(v.netto, 1)}` })}</p>
    <p>{t("balance.personal", { wert: zahl(v.personal, 1) })}</p>
    <ul>{(["baupause", "bauprioritaet", "baupersonal"] as const).map(k => <li key={k}>{t(`balance.${k}`, werte[k])}</li>)}</ul>
  </details>;
}
