// Ein Vorschlag des Problemlösers als Karte: was, wo, warum, was es kostet, ob die Mehrheit steht, und zwei Wege zur Entscheidung.
// Wird in „Heute“, in den Bereichen und am Schreibtisch benutzt, damit es überall dasselbe ist.

import { tunWort } from "../../data/skalen";
import { provinzenText } from "../../sim/handeln";
import type { Vorschlag } from "../../sim/vorschlaege";

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
          {v.zielName ? `von „${v.jetztName}“ zu „${v.zielName}“` : `${tunWort(v.massnahme, v.richtung)} von Stufe ${v.stufeJetzt} auf ${v.ziel}`} · {provinzenText(v.ort)}
        </span>
      </div>
      {!kompakt && <p className="vorschlag-grund">{v.grund}</p>}
      <div className="vorschlag-preis">
        <span>{v.pk} Kapital</span>
        <span>{kfmt(v.kostenBip)} % BIP/Jahr</span>
        <span>
          etwa {v.monate} {v.monate === 1 ? "Monat" : "Monate"}
        </span>
        <span className={`stimmen-urteil urteil-${v.urteil}`}>{v.urteil === "sicher" ? "Mehrheit steht" : v.urteil === "knapp" ? "Mehrheit knapp" : "aussichtslos"}</span>
      </div>
      <div className="fraktion-aktionen">
        <button className="aktion-knopf" onClick={() => onEinstellen(v)}>
          Einstellen und ansehen
        </button>
        <button
          className="aktion-knopf"
          disabled={!v.bezahlbar || v.urteil === "verloren"}
          title={v.urteil === "verloren" ? "Ohne Mehrheit: erst im Parlament verhandeln" : !v.bezahlbar ? "Dafür fehlt Kapital" : "Als Gesetz einbringen"}
          onClick={() => onSofort(v)}
        >
          Sofort einbringen <b>{v.pk}</b>
        </button>
      </div>
    </li>
  );
}
