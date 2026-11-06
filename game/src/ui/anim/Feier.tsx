// Feiermoment, Teil 2: der kurze Moment selbst (befund-H H-24). Ein Siegel wird aufgedrückt, ein Messingschein läuft einmal darüber,
// Kicker und Titel stehen daneben; nach 1,8 Sekunden ist alles vorbei. Das große Fenster bleibt den Wundern und Wahlen.
// Abschaltbar über die vorhandene Effektstufe („Aus“ zeigt nichts); bei „Bewegung reduzieren“ blendet der Moment nur ruhig ein und aus.
// Die Bühne ruft `useFeierWaechter(welt)` einmal auf und stellt `<Feiermoment />` einmal hin; mehr Aufrufe braucht es nicht.

import { useEffect, useRef, useState } from "react";
import type { World } from "../../sim/types";
import { Icon, type IconName } from "../icons";
import { effektstufe } from "./effekte";
import { abonniereFeiern, feiere, feierStand, neueFeiern, type Feier, type FeierArt, type FeierStand } from "./feierwaechter";
import "./feier.css";

/** Dauer eines Moments in Millisekunden (Spielparameter der Gestaltung: kurz genug, um nie zu stören) */
export const FEIER_DAUER = 1800;
/** Höchstens so viele Momente warten; was darüber kommt, entfällt (die Meldungen nennen es ohnehin) */
const WARTESCHLANGE = 3;

const ZEICHEN: Record<FeierArt, IconName> = { gesetz: "parlament", fokus: "ziel", ziel: "siegel" };

/** Beobachtet den Spielstand nach jedem Zeichnen der Bühne und meldet, was neu fertig ist. */
export function useFeierWaechter(w: World): void {
  const stand = useRef<FeierStand | null>(null);
  const zuletzt = useRef<{ welt: World; tag: number; log: number; fokus: number } | null>(null);
  useEffect(() => {
    const jetzt = { welt: w, tag: w.day, log: w.log.length, fokus: w.spiel?.fokus?.fertig.length ?? 0 };
    const vorher = zuletzt.current;
    zuletzt.current = jetzt;
    // Neue Welt (Laden, Neubeginn): Was schon fertig ist, gilt als gesehen
    if (!stand.current || !vorher || vorher.welt !== w) {
      stand.current = feierStand(w);
      return;
    }
    if (vorher.tag === jetzt.tag && vorher.log === jetzt.log && vorher.fokus === jetzt.fokus) return;
    for (const f of neueFeiern(w, stand.current)) feiere(f);
  });
}

export function Feiermoment() {
  const [aktiv, setAktiv] = useState<(Feier & { nr: number }) | null>(null);
  const schlange = useRef<Feier[]>([]);
  const nr = useRef(0);
  useEffect(
    () =>
      abonniereFeiern((f) => {
        if (effektstufe() === "aus") return;
        if (schlange.current.length >= WARTESCHLANGE) return;
        schlange.current.push(f);
        setAktiv((a) => a ?? { ...schlange.current.shift()!, nr: ++nr.current });
      }),
    [],
  );
  useEffect(() => {
    if (!aktiv) return;
    const id = window.setTimeout(() => {
      const naechste = schlange.current.shift();
      setAktiv(naechste ? { ...naechste, nr: ++nr.current } : null);
    }, FEIER_DAUER);
    return () => window.clearTimeout(id);
  }, [aktiv]);
  if (!aktiv) return null;
  return (
    <div key={aktiv.nr} className={`feier feier-${aktiv.art}`} role="status" aria-live="polite">
      <span className="feier-siegel" aria-hidden>
        <Icon name={ZEICHEN[aktiv.art]} size={26} />
      </span>
      <span className="feier-text">
        <small>{aktiv.kicker}</small>
        <strong>{aktiv.titel}</strong>
      </span>
      <span className="feier-glanz" aria-hidden />
    </div>
  );
}
