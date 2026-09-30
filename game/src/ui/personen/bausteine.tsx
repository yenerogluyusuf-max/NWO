// Kleine Bausteine der Personenansicht: Porträt, Balken, Marken.

import type { ReactNode } from "react";
import { Cameo } from "../art/Cameo";
import { eigenVon } from "../../sim/personen";
import type { LagerArt } from "../../sim/personen-typen";
import type { Figur } from "../../sim/spiel-typen";
import type { World } from "../../sim/types";

export const LAGER_FARBE: Record<LagerArt, string> = {
  praesident: "#7c5823",
  partei: "#3f6b3a",
  apparat: "#4a3f6b",
  markt: "#265a62",
  diplomatie: "#2f5a8a",
  justiz: "#6b4a3a",
  streitkraefte: "#4c5a3a",
  opposition: "#7a3b30",
};

export function Portraet({ w, f, size = 44 }: { w: World; f: Figur; size?: number }) {
  const e = eigenVon(w, f);
  return <Cameo seed={f.name} size={size} figure={f.weiblich ? "f" : "m"} tint={LAGER_FARBE[e.lager]} />;
}

export type Ton = "gut" | "mittel" | "schlecht";

/** Ton eines Wertes von 0 bis 100; bei `hochIstSchlecht` kehrt sich die Richtung um. */
export function tonVon(x: number, hochIstSchlecht = false): Ton {
  const g = hochIstSchlecht ? 100 - x : x;
  return g >= 58 ? "gut" : g >= 35 ? "mittel" : "schlecht";
}

export function Balken({ label, wert, wort, ton, klein, hinweis }: { label?: string; wert: number; wort?: string; ton?: Ton; klein?: boolean; hinweis?: string }) {
  const t = ton ?? tonVon(wert);
  const breite = Math.max(0, Math.min(100, wert));
  return (
    <div className={`pe-balken ${t}${klein ? " klein" : ""}`} title={hinweis ?? `${Math.round(wert)} von 100`}>
      {label && <span>{label}</span>}
      <div className="pe-bar" role="img" aria-label={`${label ?? "Wert"} ${Math.round(wert)} von 100`}>
        <i style={{ width: `${breite}%` }} />
      </div>
      <em>{wort ?? Math.round(wert)}</em>
    </div>
  );
}

export function Marke({ children, art }: { children: ReactNode; art?: "rot" | "gruen" | "gold" }) {
  return <span className={`pe-marke${art ? ` ${art}` : ""}`}>{children}</span>;
}
