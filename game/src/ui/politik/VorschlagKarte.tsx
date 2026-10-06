// Ein Vorschlag des Problemlösers als Karte: was, wo, warum, was es kostet, ob die Mehrheit steht, und zwei Wege zur Entscheidung.
// Wird in „Heute“, in den Bereichen und am Schreibtisch benutzt, damit es überall dasselbe ist.

import { tunWort } from "../../data/skalen";
import { provinzenText } from "../../sim/handeln";
import type { Vorschlag } from "../../sim/vorschlaege";

import { t } from "../../i18n";
const kfmt = (x: number) => x.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function VorschlagKarte({
  v,
  onEinstellen,
  onSofort,
  kompakt,
}: {
  v: Vorschlag;
  onEinstellen: (v: Vorschlag) => void;
  onSofort: (v: Vorschlag) => void;
  /** Ohne Begründung, für enge Stellen */
  kompakt?: boolean;
}) {
  return (
    <li className="po-vorschlag">
      <div className="vorschlag-kopf">
        <strong>{v.name}</strong>
        <span>
          {v.zielName ? t("ui2.ui.politik.VorschlagKarte.48d7c7b", { p0: v.jetztName, p1: v.zielName }) : t("ui2.ui.politik.VorschlagKarte.ae11a28", { p0: tunWort(v.massnahme, v.richtung), p1: v.stufeJetzt, p2: v.ziel })} · {provinzenText(v.ort)}
        </span>
      </div>
      {!kompakt && <p className="vorschlag-grund">{v.grund}</p>}
      <div className="vorschlag-preis">
        <span>{t("ui2.ui.politik.VorschlagKarte.87b52bd", { p0: v.pk })}</span>
        <span>{t("ui2.ui.politik.VorschlagKarte.ee0e2ff", { p0: kfmt(v.kostenBip) })}</span>
        <span>
          etwa {v.monate} {v.monate === 1 ? t("ui2.ui.politik.VorschlagKarte.da13625") : t("ui2.ui.politik.VorschlagKarte.1c561ae")}
        </span>
        <span className={`stimmen-urteil urteil-${v.urteil}`}>{v.urteil === "sicher" ? t("ui2.ui.politik.VorschlagKarte.61a0cfe") : v.urteil === "knapp" ? t("ui2.ui.politik.VorschlagKarte.d6570c1") : "aussichtslos"}</span>
      </div>
      <div className="fraktion-aktionen">
        <button className="aktion-knopf" onClick={() => onEinstellen(v)}>
          {t("ui.politik.VorschlagKarte.c568008")}
        </button>
        <button
          className="aktion-knopf"
          disabled={!v.bezahlbar || v.urteil === "verloren"}
          title={v.urteil === "verloren" ? t("ui2.ui.politik.VorschlagKarte.d99f486") : !v.bezahlbar ? t("ui2.ui.politik.VorschlagKarte.9fcc6e5") : t("ui2.ui.politik.VorschlagKarte.abaa171")}
          onClick={() => onSofort(v)}
        >
          {t("ui2.ui.politik.VorschlagKarte.266e656")} <b>{v.pk}</b>
        </button>
      </div>
    </li>
  );
}
