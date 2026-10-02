// Die Wirtschaftsakte: Lage, Zentralbank, Haushalt. Jede Kennzahl führt zu einer Entscheidung, jede Entscheidung zeigt ihre Folgen.

import { useState } from "react";
import type { World } from "../../sim/types";
import type { Handlung } from "../../sim/wirtschaft-kennzahlen";
import { Lage } from "./Lage";
import { Zentralbank } from "./Zentralbank";
import { Haushalt } from "./Haushalt";
import "./wirtschaft.css";

export type Reiter = "lage" | "zentralbank" | "haushalt";

const REITER: { id: Reiter; label: string; text: string }[] = [
  { id: "lage", label: "Lage", text: "Kennzahlen und Verläufe" },
  { id: "zentralbank", label: "Zentralbank", text: "Zinssitzungen, Führung, Gesetz" },
  { id: "haushalt", label: "Haushalt", text: "Plan, Regler, Nachtrag" },
];

export function WirtschaftAkte({ world, start = "lage", zbAbschnitt, posten, onGeaendert }: { world: World; start?: Reiter; zbAbschnitt?: "sitzung" | "gouverneur" | "stufe" | "devisen"; posten?: string; onGeaendert?: (() => void) | undefined }) {
  const [reiter, setReiter] = useState<Reiter>(start);
  const [abschnitt, setAbschnitt] = useState<"sitzung" | "gouverneur" | "stufe" | "devisen" | undefined>(zbAbschnitt);
  const [wahl, setWahl] = useState(posten);
  const [, setVersion] = useState(0);
  const geaendert = () => {
    setVersion((v) => v + 1);
    onGeaendert?.();
  };

  function handlung(h: Handlung) {
    setReiter(h.ziel);
    setAbschnitt(h.abschnitt);
    setWahl(h.posten);
  }

  return (
    <div className="wi-akte">
      <nav className="wi-reiter" role="tablist" aria-label="Wirtschaft">
        {REITER.map((r) => (
          <button key={r.id} role="tab" aria-selected={reiter === r.id} className={reiter === r.id ? "on" : ""} onClick={() => { setReiter(r.id); if (r.id === "zentralbank") setAbschnitt(undefined); if (r.id === "haushalt") setWahl(undefined); }}>
            <b>{r.label}</b>
            <span>{r.text}</span>
          </button>
        ))}
      </nav>
      {reiter === "lage" && <Lage world={world} onHandlung={handlung} />}
      {reiter === "zentralbank" && <Zentralbank world={world} geaendert={geaendert} abschnitt={abschnitt} />}
      {reiter === "haushalt" && <Haushalt world={world} geaendert={geaendert} posten={wahl} />}
    </div>
  );
}
