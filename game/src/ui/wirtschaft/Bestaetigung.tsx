// Große Entscheidungen brauchen eine Unterschrift: Der Text nennt, was geschieht, was es kostet und was danach kommt; das Siegel besiegelt es.

import type { ReactNode } from "react";
import "./wirtschaft.css";

export function Bestaetigung({ name, titel, children, knopf = "Unterzeichnen", onJa, onNein }: { name: string; titel: string; children?: ReactNode; knopf?: string; onJa: () => void; onNein: () => void }) {
  return (
    <div className="wi-bestaetigung" role="group" aria-label={titel}>
      <p className="kicker">Zur Unterschrift</p>
      <h4>{titel}</h4>
      {children}
      <div className="signature">
        <div className="signature-line">
          <span className="signature-name">{name}</span>
          <span className="signature-caption">Unterschrift</span>
        </div>
        <button className="wax-seal" onClick={onJa}>
          <img src="/ui/siegel.png" alt="" />
          <span>{knopf}</span>
        </button>
      </div>
      <button className="link" onClick={onNein}>
        Verwerfen
      </button>
    </div>
  );
}
