// Meldungen: kurze Karten unter der Datumsplakette, die von selbst verschwinden.
// Sie ersetzen die Pause bei Dingen, auf die der Spieler keinen Einfluss hat (Zinsbeschluss, Marktbewegungen).

import { Icon, type IconName } from "./icons";

export interface Meldung {
  id: string;
  titel: string;
  text?: string;
  ton: "markt" | "bank" | "parlament" | "ereignis";
  klickbar?: boolean;
}

const ICON: Record<Meldung["ton"], IconName> = { markt: "lira", bank: "bank", parlament: "parlament", ereignis: "feder" };

export function Meldungen({
  items,
  onClose,
  onOeffne,
}: {
  items: Meldung[];
  onClose: (id: string) => void;
  onOeffne?: (m: Meldung) => void;
}) {
  if (!items.length) return null;
  return (
    <div className="meldungen" aria-live="polite">
      {items.map((m) => {
        const istBericht = m.titel.startsWith("Wirkungsbericht:") || m.klickbar;
        return (
          <div
            key={m.id}
            className={`meldung ton-${m.ton}${istBericht ? " klickbar" : ""}`}
            style={{ position: "relative", cursor: istBericht ? "pointer" : "default" }}
            onClick={() => {
              if (istBericht && onOeffne) {
                onOeffne(m);
              } else {
                onClose(m.id);
              }
            }}
          >
            <Icon name={ICON[m.ton]} size={20} />
            <span className="meldung-text" style={{ flex: 1 }}>
              <strong>{m.titel}</strong>
              {m.text && <em>{m.text}</em>}
              {istBericht && (
                <span style={{ display: "block", marginTop: 4, font: "600 11.5px var(--sans)", color: "var(--gold-2)", letterSpacing: "0.02em" }}>
                  Akte & Entwicklungen ansehen ➔
                </span>
              )}
            </span>
            <button
              type="button"
              className="meldung-zu"
              aria-label="Schließen"
              onClick={(e) => {
                e.stopPropagation();
                onClose(m.id);
              }}
              style={{
                background: "none",
                border: "none",
                color: "var(--ink-soft)",
                fontSize: 16,
                cursor: "pointer",
                padding: "2px 6px",
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}
