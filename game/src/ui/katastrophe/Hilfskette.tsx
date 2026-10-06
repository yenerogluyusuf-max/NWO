// Die Hilfskette eines Falls als Stufenband: Nothilfe → Übergangsversorgung → Wiederaufbau → Bewältigt.
// Jede Stufe zeigt ihren Stand; wo das Spiel den nächsten Schritt erlaubt, steht der Knopf direkt darunter.

import type { ReactNode } from "react";
import type { KettenStufe, KettenStatus } from "../../sim/katastrophe";
import { t } from "../../i18n";

const MARKE: Record<KettenStatus, string> = { erledigt: "✓", laeuft: "…", offen: "!", gesperrt: "–", entfaellt: "–" };
const STATUS_WORT = (s: KettenStatus): string => t(`reste.kat.status.${s}`);

export function Hilfskette({ stufen, aktionen }: { stufen: KettenStufe[]; aktionen: Partial<Record<KettenStufe["id"], ReactNode>> }) {
  return (
    <ol className="kr-kette" aria-label={t("ui2.ui.katastrophe.Hilfskette.5ed1824")}>
      {stufen.map((s, i) => (
        <li key={s.id} className={`kr-stufe st-${s.status}`}>
          <div className="kr-stufe-kopf">
            <span className="kr-marke" aria-hidden>
              {MARKE[s.status]}
            </span>
            <span className="kr-stufe-nr">{t("ui2.ui.katastrophe.Hilfskette.72f8af6", { p0: i + 1 })}</span>
          </div>
          <h4>{s.name}</h4>
          <p className="kr-stufe-status">{STATUS_WORT(s.status)}</p>
          <p className="kr-stufe-text">{s.detail}</p>
          {s.fortschritt !== undefined && (
            <div className="kr-balken" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(s.fortschritt * 100)}>
              <i style={{ width: `${Math.round(s.fortschritt * 100)}%` }} />
            </div>
          )}
          {aktionen[s.id] && <div className="kr-stufe-aktion">{aktionen[s.id]}</div>}
        </li>
      ))}
    </ol>
  );
}
