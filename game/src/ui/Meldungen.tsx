// Meldungen: kurze Karten unter der Datumsplakette, die von selbst verschwinden.
// Sie ersetzen die Pause bei Dingen, auf die der Spieler keinen Einfluss hat (Zinsbeschluss, Marktbewegungen).

import { Icon, type IconName } from "./icons";

export interface Meldung {
  id: string;
  titel: string;
  text?: string;
  ton: "markt" | "bank" | "parlament" | "ereignis";
}

const ICON: Record<Meldung["ton"], IconName> = { markt: "lira", bank: "bank", parlament: "parlament", ereignis: "feder" };

export function Meldungen({ items, onClose }: { items: Meldung[]; onClose: (id: string) => void }) {
  if (!items.length) return null;
  return (
    <div className="meldungen" aria-live="polite">
      {items.map((m) => (
        <button key={m.id} className={`meldung ton-${m.ton}`} onClick={() => onClose(m.id)}>
          <Icon name={ICON[m.ton]} size={20} />
          <span className="meldung-text">
            <strong>{m.titel}</strong>
            {m.text && <em>{m.text}</em>}
          </span>
        </button>
      ))}
    </div>
  );
}
