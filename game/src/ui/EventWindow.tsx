// Ereignisfenster wie in Strategiespielen: Bild, Überschrift, kurzer Text,
// die Begründung als Randnotiz und höchstens zwei Antworten.

import type { ReactNode } from "react";
import { Vignette, type Scene } from "./art/Vignette";
import { Corners, Flourish } from "./art/Ornament";

export interface GameEvent {
  id: string;
  scene: Scene;
  date: string;
  title: string;
  text: ReactNode;
  why?: string;
  actions: { label: string; primary?: boolean; run?: () => void }[];
}

export function EventWindow({ event, onClose }: { event: GameEvent; onClose: () => void }) {
  return (
    <div className="event-layer" role="dialog" aria-modal="true" aria-labelledby={`ev-${event.id}`}>
      <article className="frame event-window">
        <Corners />
        <div className="event-picture">
          <Vignette scene={event.scene} />
          <span className="event-date">{event.date}</span>
        </div>
        <div className="event-body">
          <h2 id={`ev-${event.id}`}>{event.title}</h2>
          <Flourish width={180} />
          <div className="event-text">{event.text}</div>
          {event.why && <p className="event-why">{event.why}</p>}
          <div className="event-actions">
            {event.actions.map((a) => (
              <button
                key={a.label}
                className={a.primary ? "brass-button" : "leather-button"}
                onClick={() => {
                  a.run?.();
                  onClose();
                }}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>
      </article>
    </div>
  );
}
