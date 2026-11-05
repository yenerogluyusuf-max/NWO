// Baustein „Seitenfenster“ (ENTSCHEIDUNGEN W 3, Karte als Bühne): die Akte neben der lebenden Karte statt Papier über ihr. Kopf mit
// Bereichsname, bis zu vier Ansichtsreitern und Schließen; der Inhalt scrollt, die Karte bleibt bedienbar.

import type { ReactNode } from "react";
import { t } from "../../i18n";
import "./bausteine.css";

export interface SeitenReiter {
  id: string;
  label: string;
}

export function Seitenfenster({ titel, reiter, aktiv, onReiter, onSchliessen, children }: { titel: string; reiter?: SeitenReiter[]; aktiv?: string; onReiter?: (id: string) => void; onSchliessen: () => void; children?: ReactNode }) {
  return (
    <aside className="bs-seite" aria-label={titel}>
      <header className="bs-seite-kopf">
        <h2>{titel}</h2>
        {reiter && reiter.length > 1 && (
          <div className="bs-seite-reiter" role="tablist">
            {reiter.map((r) => (
              <button key={r.id} type="button" role="tab" aria-selected={aktiv === r.id} className={aktiv === r.id ? "on" : undefined} onClick={() => onReiter?.(r.id)}>
                {r.label}
              </button>
            ))}
          </div>
        )}
        <button type="button" className="bs-seite-zu" aria-label={t("bs.schliessen")} onClick={onSchliessen}>
          ×
        </button>
      </header>
      <div className="bs-seite-inhalt">{children}</div>
    </aside>
  );
}
