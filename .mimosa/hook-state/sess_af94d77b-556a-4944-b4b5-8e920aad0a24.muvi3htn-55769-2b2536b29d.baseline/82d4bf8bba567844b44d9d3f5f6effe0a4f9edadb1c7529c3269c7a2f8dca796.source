// Sprachwahl: Deutsch, Türkçe, English. Der Wechsel sichert den laufenden Stand und lädt die Oberfläche neu, damit alle Texte
// (auch die der Datenmodule) in der neuen Sprache erscheinen.

import { useState } from "react";
import { SPRACHEN, aktuelleSprache, t, wechsleSprache } from "../i18n";
import "./sprachwahl.css";

export function SprachWahl({ className, kurz }: { className?: string; kurz?: boolean }) {
  const aktiv = aktuelleSprache();
  const [wechselt, setWechselt] = useState(false);
  const waehle = async (id: (typeof SPRACHEN)[number]["id"]) => {
    if (id === aktiv || wechselt) return;
    setWechselt(true);
    try {
      // Läuft ein Spiel, sichert die Bühne vorher (Stage.tsx hängt `__sichereJetzt` ans Fenster)
      await (window as unknown as { __sichereJetzt?: () => Promise<unknown> }).__sichereJetzt?.();
    } catch {
      /* Sichern fehlgeschlagen: trotzdem wechseln, der Autostand liegt vor */
    }
    await wechsleSprache(id);
    setWechselt(false);
  };
  return (
    <div className={`sprachwahl${className ? ` ${className}` : ""}`} role="group" aria-label={t("sprache.wahl")}>
      {SPRACHEN.map((s) => (
        <button key={s.id} type="button" lang={s.id} className={aktiv === s.id ? "on" : ""} aria-pressed={aktiv === s.id} disabled={wechselt} onClick={() => void waehle(s.id)} title={s.name}>
          {kurz ? s.id.toUpperCase() : s.name}
        </button>
      ))}
    </div>
  );
}
