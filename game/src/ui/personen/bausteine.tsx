// Kleine Bausteine der Personenansicht: Porträt, Balken, Marken.
// Regel für alle Karten dieser Ansicht: Zahl und Einheit stehen zusammen und brechen nie um; jeder Balken hat dieselbe
// Breite (Beschriftung und Wort stehen darüber, nicht daneben); Symbole sind Zeichnungen aus icons.tsx, keine Emojis.

import type { ReactNode } from "react";
import { Portraet as Zeichnung, stimmungAus, type Stimmung } from "../art/Portraet";
import { eigenVon } from "../../sim/personen";
import type { LagerArt } from "../../sim/personen-typen";
import type { Figur } from "../../sim/spiel-typen";
import type { World } from "../../sim/types";
import { t as tx } from "../../i18n";

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

/** Das Gesicht einer Person: Samen ist der Name, Grund und Rahmen folgen dem Lager; mit `vielfalt` sehen verschiedene Menschen verschieden aus. */
export function Gesicht({ name, weiblich, lager, size = 44, stimmung, rolle, alter }: { name: string; weiblich?: boolean; lager: LagerArt; size?: number; stimmung?: Stimmung; rolle?: string; alter?: number }) {
  return <Zeichnung seed={name} size={size} geschlecht={weiblich ? "f" : "m"} tint={LAGER_FARBE[lager]} {...(stimmung ? { stimmung } : {})} {...(rolle ? { rolle } : {})} {...(alter ? { alter } : {})} rahmen={size < 40 ? "keiner" : "messing"} />;
}

export function Portraet({ w, f, size = 44 }: { w: World; f: Figur; size?: number }) {
  // Das Amt (Ressort) bestimmt Kleidung und Hintergrund; die Ämter des Spiels heißen wie die Rollen des Porträtsystems
  const rolle = f.amt;
  const e = eigenVon(w, f);
  const stimmung = stimmungAus({ groll: e.groll ?? 0, ehrgeiz: e.ehrgeiz ?? 0, loyalitaet: f.loyalitaet, kommissarisch: !!e.kommissarisch });
  return <Gesicht name={f.name} {...(f.weiblich !== undefined ? { weiblich: f.weiblich } : {})} lager={e.lager} size={size} stimmung={stimmung} rolle={rolle} />;
}

export type Ton = "gut" | "mittel" | "schlecht";

/** Ton eines Wertes von 0 bis 100; bei `hochIstSchlecht` kehrt sich die Richtung um. */
export function tonVon(x: number, hochIstSchlecht = false): Ton {
  const g = hochIstSchlecht ? 100 - x : x;
  return g >= 58 ? "gut" : g >= 35 ? "mittel" : "schlecht";
}

/**
 * Ein Balken. Mit `label` steht oben links die Beschriftung und oben rechts das Wort, darunter der Balken in voller Breite
 * (so beginnen und enden alle Balken einer Karte an derselben Stelle). Ohne `label` steht das Wort rechts neben dem Balken.
 * `zeile` ist ein kurzer Hinweis unter dem Balken, sichtbar statt als Tooltip.
 */
export function Balken({ label, wert, wort, ton, klein, hinweis, zeile }: { label?: string; wert: number; wort?: string; ton?: Ton; klein?: boolean; hinweis?: string; zeile?: string }) {
  const t = ton ?? tonVon(wert);
  const breite = Math.max(0, Math.min(100, wert));
  const text = wort ?? String(Math.round(wert));
  const bar = (
    <div className="pe-bar" role="img" aria-label={tx("ui2.ui.personen.bausteine.7fd173e", { p0: label ?? "Wert", p1: Math.round(wert) })}>
      <i style={{ width: `${breite}%` }} />
    </div>
  );
  return (
    <div className={`pe-balken ${t}${klein ? " klein" : ""}${label ? " mit-kopf" : ""}`} title={hinweis ?? tx("ui2.ui.personen.bausteine.4b66de7", { p0: Math.round(wert) })}>
      {label ? (
        <>
          <div className="pe-balken-kopf">
            <span>{label}</span>
            <em>{text}</em>
          </div>
          {bar}
        </>
      ) : (
        <>
          {bar}
          <em>{text}</em>
        </>
      )}
      {zeile && <small className="pe-balken-zeile">{zeile}</small>}
    </div>
  );
}

export function Marke({ children, art }: { children: ReactNode; art?: "rot" | "gruen" | "gold" }) {
  return <span className={`pe-marke${art ? ` ${art}` : ""}`}>{children}</span>;
}
