// Baustein „ⓘ-Erklärung“ (PLAN_OBERFLAECHE_DETAIL Teil 1, Q3): Regeltexte stehen nicht mehr als Absatz in der Ansicht, sondern
// hinter einem ⓘ, das beim Antippen den Text zeigt. Ohne Zustand im Spiel; ein natives <details> hält Tastatur und Vorleser.

import type { ReactNode } from "react";
import { t } from "../../i18n";
import "./bausteine.css";

export function Erklaer({ children, titel }: { children: ReactNode; titel?: string }) {
  return (
    <details className="bs-erklaer">
      <summary aria-label={titel ?? t("bs.erklaer")} title={titel ?? t("bs.erklaer")}>
        <span aria-hidden>ⓘ</span>
      </summary>
      <div className="bs-erklaer-text" role="note">
        {children}
      </div>
    </details>
  );
}
