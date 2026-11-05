// Bausteine „Reglerzeile“ und „Preisfeld“ (PLAN_OBERFLAECHE_DETAIL Teil 1, Q3): eine Zeile mit Namen, Regler mit − und +, und dem
// Wert vorher → nachher; darunter, wenn gewählt, das Preisfeld mit den Fakten des Beschlusses. Haushalt (Präfix „hd“) und
// Politik (Präfix „mt“) bauen ihre Zeilen daraus; das Präfix hält die bisherigen Stile, damit der Umzug nichts am Bild ändert.

import type { ReactNode } from "react";

export interface ReglerZeileProps {
  /** Klassenpräfix der Ansicht: „hd“ (Haushalt), „mt“ (Maßnahmentafel) */
  kl: string;
  /** Zusätzliche Klassen der Zeile (on, geaendert, laeuft) */
  zustand?: string;
  /** Der Namensblock links (Knopf oder Text, mit Unterzeile) */
  name: ReactNode;
  wert: number;
  min: number;
  max: number;
  onWert: (wert: number) => void;
  minus: string;
  plus: string;
  aria: string;
  ariaWert?: string;
  /** Klasse des Wertfelds rechts („betrag“, „stufe“) */
  anzeigeKlasse: string;
  /** Wert heute */
  vorher: ReactNode;
  /** Gewählter Wert, wenn er sich vom heutigen unterscheidet */
  nachher?: ReactNode;
  /** Das Preisfeld unter der Zeile */
  children?: ReactNode;
}

export function ReglerZeile(p: ReglerZeileProps) {
  return (
    <li className={`${p.kl}-zeile${p.zustand ? ` ${p.zustand}` : ""}`}>
      <div className={`${p.kl}-reihe`}>
        {p.name}
        <div className={`${p.kl}-regler`}>
          <button type="button" aria-label={p.minus} title={p.minus} disabled={p.wert <= p.min} onClick={() => p.onWert(p.wert - 1)}>
            −
          </button>
          <input type="range" min={p.min} max={p.max} step={1} value={p.wert} aria-label={p.aria} {...(p.ariaWert ? { "aria-valuetext": p.ariaWert } : {})} onChange={(e) => p.onWert(Number(e.target.value))} />
          <button type="button" aria-label={p.plus} title={p.plus} disabled={p.wert >= p.max} onClick={() => p.onWert(p.wert + 1)}>
            +
          </button>
        </div>
        <span className={`${p.kl}-${p.anzeigeKlasse}`}>
          {p.nachher !== undefined ? (
            <>
              <s>{p.vorher}</s> <b>{p.nachher}</b>
            </>
          ) : (
            p.vorher
          )}
        </span>
      </div>
      {p.children}
    </li>
  );
}

export interface PreisFakt {
  label: string;
  wert: ReactNode;
  /** Rot: Was hier steht, verhindert oder verteuert den Beschluss */
  schlecht?: boolean;
}

/** Die Fakten eines Beschlusses (Kapital, Mehrheit, Dauer, Haushalt …) als Liste. */
export function Preisfeld({ kl, fakten }: { kl: string; fakten: PreisFakt[] }) {
  return (
    <dl className={`${kl}-fakten`}>
      {fakten.map((f) => (
        <div key={f.label}>
          <dt>{f.label}</dt>
          <dd {...(f.schlecht ? { className: "schlecht" } : {})}>{f.wert}</dd>
        </div>
      ))}
    </dl>
  );
}
