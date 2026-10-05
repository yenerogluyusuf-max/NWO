// Das Pult des Präsidenten für seine Minister: links die Vorlagen (Posteingang), rechts die Befehle. Eine fertige Komponente für den
// Reiter „Ministerrat & Kabinett“ (und überall, wo man mit den Ministern arbeiten will).

import { useState } from "react";
import { laufendeBefehle } from "../../sim/minister-befehle";
import { ministerVorlagen } from "../../sim/ministerfluss";
import type { Vorlage, VorlagenZiel } from "../../sim/ministerfluss-typen";
import type { World } from "../../sim/types";
import { BefehlBlatt } from "./BefehlBlatt";
import { Posteingang } from "./Posteingang";
import "../politik/design.css";
import "./ministerfluss.css";

export interface MinisterPultProps {
  world: World;
  refresh: () => void;
  onGehe?: (z: VorlagenZiel) => void;
  onKarte?: (problemId?: string) => void;
  onEinstellen?: (v: Vorlage) => void;
  /** Welcher Reiter zuerst offen ist (Standard: Vorlagen) */
  start?: "vorlagen" | "befehle";
}

export function MinisterPult({ world, refresh, onGehe, onKarte, onEinstellen, start = "vorlagen" }: MinisterPultProps) {
  const [reiter, setReiter] = useState<"vorlagen" | "befehle">(start);
  const n = world.spiel ? ministerVorlagen(world, { tiefe: 0 }).length : 0;
  const laufend = world.spiel ? laufendeBefehle(world).length : 0;
  return (
    <div className="mf">
      <div className="mf-reiter" role="tablist" aria-label="Minister">
        <button role="tab" aria-selected={reiter === "vorlagen"} className={`mf-reiter-knopf${reiter === "vorlagen" ? " on" : ""}`} onClick={() => setReiter("vorlagen")}>
          Vorlagen der Minister{n > 0 && <em>{n}</em>}
        </button>
        <button role="tab" aria-selected={reiter === "befehle"} className={`mf-reiter-knopf${reiter === "befehle" ? " on" : ""}`} onClick={() => setReiter("befehle")}>
          Befehle erteilen{laufend > 0 && <em>{laufend}</em>}
        </button>
      </div>
      {reiter === "vorlagen" ? <Posteingang world={world} refresh={refresh} {...(onGehe ? { onGehe } : {})} {...(onKarte ? { onKarte } : {})} {...(onEinstellen ? { onEinstellen } : {})} /> : <BefehlBlatt world={world} refresh={refresh} />}
    </div>
  );
}
