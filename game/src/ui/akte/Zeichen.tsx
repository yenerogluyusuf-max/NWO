// Zeichensprache (GESTALTUNG_2026-11-04, Stufe G2): Jede Ressource hat überall dasselbe Symbol und dieselbe Farbe,
// damit man Kosten liest, ohne zu lesen. Der Preis-Baustein ist auf jeder Karte gleich gebaut.

import { t } from "../../i18n";
import { Icon, type IconName } from "../icons";
import "./zeichen.css";

export type Ressource = "pk" | "geld" | "schulden" | "aufmerksamkeit" | "verwaltung" | "bau" | "zeit" | "ap" | "zustimmung";

export const RESSOURCEN: Record<Ressource, { farbe: string; icon: IconName | "uhr" }> = {
  pk: { farbe: "#8e2a22", icon: "siegel" },
  geld: { farbe: "#a8781f", icon: "lira" },
  schulden: { farbe: "#6b4a2b", icon: "bank" },
  aufmerksamkeit: { farbe: "#2f5d8a", icon: "ziel" },
  verwaltung: { farbe: "#5b4a7a", icon: "akte" },
  bau: { farbe: "#7a5b26", icon: "kran" },
  zeit: { farbe: "#46594f", icon: "uhr" },
  ap: { farbe: "#2f6b45", icon: "urne" },
  zustimmung: { farbe: "#355f55", icon: "menge" },
};

export const ressourceName = (r: Ressource) => t(`gz.res.${r}.name`);
export const ressourceText = (r: Ressource) => t(`gz.res.${r}.was`);

/** Das runde Zeichen einer Ressource. */
export function Zeichen({ r, size = 16 }: { r: Ressource; size?: number }) {
  const d = RESSOURCEN[r];
  return (
    <span className="gz-zeichen" style={{ ["--gz-farbe" as string]: d.farbe, width: size + 10, height: size + 10 }} aria-hidden>
      {d.icon === "uhr" ? (
        <svg className="icon" width={size} height={size} viewBox="0 0 24 24">
          <path d="M7 3h10M7 21h10M8 3c0 5 8 6 8 9s-8 4-8 9M16 3c0 5-8 6-8 9s8 4 8 9" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      ) : (
        <Icon name={d.icon} size={size} />
      )}
    </span>
  );
}

/** Preis-Baustein: Zeichen, Zahl, Einheit. Der Name der Ressource steht für Vorleser und Mauszeiger dabei. */
export function Preis({ r, wert, einheit, knapp }: { r: Ressource; wert: string; einheit?: string; knapp?: boolean }) {
  return (
    <span className={`gz-preis${knapp ? " knapp" : ""}`} style={{ ["--gz-farbe" as string]: RESSOURCEN[r].farbe }} title={`${ressourceName(r)}: ${ressourceText(r)}`}>
      <Zeichen r={r} size={13} />
      <span className="gz-vorleser">{ressourceName(r)}</span>
      <b>{wert}</b>
      {einheit && <small>{einheit}</small>}
    </span>
  );
}
