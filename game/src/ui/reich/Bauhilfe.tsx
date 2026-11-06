import type { ReactNode } from "react";
import { t, zahl } from "../../i18n";
import { PAUSE_VERFALL, PERSONAL_JE_STUFE, verwaltungBilanz, VORZIEHEN_VERWALTUNG } from "../../sim/reich";
import { RESSORT_NACH_ID } from "../../data/haushaltsplan";
import type { World } from "../../sim/types";
import "./bauhilfe.css";

/** Zahlen der Hebel aus denselben Spielparametern, die der Bau bucht (Pausenverfall, Preis des Vorziehens, Personaletat). */
export const bauhilfeWerte = (): Record<string, Record<string, string | number>> => ({
  pause: { anteil: zahl(PAUSE_VERFALL * 100, 1) },
  vorziehen: { n: VORZIEHEN_VERWALTUNG },
  personal: { bip: zahl(RESSORT_NACH_ID.personal?.schritt ?? 0, 1), plus: zahl(PERSONAL_JE_STUFE * 100, 0) },
});

/** Die Hebel des Baus in Bauakte und Forschung: Verwaltungskraft als Kennzahlen, die Hebel als kleine Tabelle mit Preis und Wirkung
 *  (Welle B3, ENTSCHEIDUNGEN Z: vorher fünf Absätze Fließtext auf einem weißen Blatt). `children` hängt eine kurze Zeile an. */
export function Bauhilfe({ world, children }: { world: World; children?: ReactNode }) {
  const v = verwaltungBilanz(world);
  const w = bauhilfeWerte();
  const vz = (x: number) => `${x > 0.05 ? "+" : x < -0.05 ? "−" : ""}${zahl(Math.abs(x), 1)}`;
  return <details className="bauhilfe">
    <summary>{t("balance.bautitel")}</summary>
    <dl className="bauhilfe-kz">
      <div><dt>{t("welle_b3.bau.vorrat")}</dt><dd>{zahl(v.vorrat, 1)}</dd></div>
      <div className={v.netto < 0 ? "schlecht" : ""}><dt>{t("welle_b3.bau.bilanz")}</dt><dd>{vz(v.netto)}</dd></div>
      <div><dt>{t("welle_b3.bau.personal")}</dt><dd>{vz(v.personal)}</dd></div>
    </dl>
    <p className="bauhilfe-satz">{t("welle_b3.bau.halb")}</p>
    <table className="rv-tabelle bauhilfe-tabelle">
      <thead><tr><th>{t("welle_b3.bau.hebel")}</th><th>{t("welle_b3.bau.preis")}</th><th>{t("welle_b3.bau.wirkung")}</th></tr></thead>
      <tbody>
        <tr><th>{t("welle_b3.bau.pause")}</th><td>{t("welle_b3.bau.pausePreis", w.pause)}</td><td>{t("welle_b3.bau.pauseWirkung")}</td></tr>
        <tr><th>{t("welle_b3.bau.aufgeben")}</th><td>{t("welle_b3.bau.aufgebenPreis")}</td><td>{t("welle_b3.bau.pauseWirkung")}</td></tr>
        <tr><th>{t("welle_b3.bau.vorziehen")}</th><td>{t("welle_b3.bau.vorziehenPreis", w.vorziehen)}</td><td>{t("welle_b3.bau.vorziehenWirkung")}</td></tr>
        <tr><th>{t("welle_b3.bau.personalStufe")}</th><td>{t("welle_b3.bau.personalPreis", w.personal)}</td><td>{t("welle_b3.bau.personalWirkung", w.personal)}</td></tr>
        <tr><th>{t("welle_b3.bau.lang")}</th><td>—</td><td>{t("welle_b3.bau.langWirkung")}</td></tr>
      </tbody>
    </table>
    {children}
  </details>;
}
