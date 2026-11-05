// Das Pult des Präsidenten für seine Minister: links die Vorlagen (Posteingang), rechts die Befehle. Eine fertige Komponente für den
// Reiter „Ministerrat & Kabinett“ (und überall, wo man mit den Ministern arbeiten will).

import { useState } from "react";
import { laufendeBefehle } from "../../sim/minister-befehle";
import { ministerVorlagen } from "../../sim/ministerfluss";
import type { Vorlage, VorlagenZiel } from "../../sim/ministerfluss-typen";
import type { World } from "../../sim/types";
import { BefehlBlatt } from "./BefehlBlatt";
import { offeneAnliegen, Posteingang } from "./Posteingang";
import { t } from "../../i18n";
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
  /** Nur diese Person (Ministerakte am Kabinettstisch) */
  nur?: { id: string; amt: import("../../sim/ministerfluss-typen").Amt };
}

export function MinisterPult({ world, refresh, onGehe, onKarte, onEinstellen, start = "vorlagen", nur }: MinisterPultProps) {
  const [reiter, setReiter] = useState<"vorlagen" | "befehle">(start);
  // Dieselbe Zahl wie „Alle“ im Posteingang: Vorlagen und Anliegen der Ressorts
  const n = world.spiel ? ministerVorlagen(world, { tiefe: 0 }).filter((v) => !nur || v.amt === nur.amt).length + offeneAnliegen(world).filter((a) => !nur || a.amt === nur.amt).length : 0;
  const laufend = world.spiel ? laufendeBefehle(world).filter((b) => !nur || b.figurId === nur.id).length : 0;
  return (
    <div className="mf">
      <div className="mf-reiter" role="tablist" aria-label={t("ui2.ui.minister.MinisterPult.78e2eab")}>
        <button role="tab" aria-selected={reiter === "vorlagen"} className={`mf-reiter-knopf${reiter === "vorlagen" ? " on" : ""}`} onClick={() => setReiter("vorlagen")}>
          {t("ui2.ui.minister.MinisterPult.d9b6200")}{n > 0 && <em>{n}</em>}
        </button>
        <button role="tab" aria-selected={reiter === "befehle"} className={`mf-reiter-knopf${reiter === "befehle" ? " on" : ""}`} onClick={() => setReiter("befehle")}>
          {t("ui2.ui.minister.MinisterPult.f2dda66")}{laufend > 0 && <em>{laufend}</em>}
        </button>
      </div>
      {reiter === "vorlagen" ? <Posteingang world={world} refresh={refresh} {...(onGehe ? { onGehe } : {})} {...(onKarte ? { onKarte } : {})} {...(onEinstellen ? { onEinstellen } : {})} {...(nur ? { nurAmt: nur.amt } : {})} /> : <BefehlBlatt world={world} refresh={refresh} {...(nur ? { nurFigur: nur.id } : {})} />}
    </div>
  );
}
