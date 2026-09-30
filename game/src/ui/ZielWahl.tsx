// Erster Spieltag: Der Präsident wählt bis zu drei Ziele seiner Amtszeit. Die Bilanz misst sie am Ende.

import { useState } from "react";
import { ZIELE } from "../sim/ziele";
import { SCHWIERIGKEITEN, type Schwierigkeit } from "../sim/spiel";
import { Corners, Flourish } from "./art/Ornament";
import { Icon } from "./icons";

export function ZielWahl({ onFertig }: { onFertig: (ids: string[], schwierigkeit: Schwierigkeit) => void }) {
  const [gewaehlt, setGewaehlt] = useState<string[]>([]);
  const [schwer, setSchwer] = useState<Schwierigkeit>("normal");
  const umschalten = (id: string) => setGewaehlt((g) => (g.includes(id) ? g.filter((x) => x !== id) : g.length < 3 ? [...g, id] : g));
  return (
    <div className="event-layer" role="dialog" aria-modal="true" aria-labelledby="zielwahl-titel">
      <article className="frame event-window zielwahl">
        <Corners />
        <div className="event-body">
          <p className="kicker">Erster Tag im Amt</p>
          <h2 id="zielwahl-titel">Was soll von dieser Amtszeit bleiben?</h2>
          <Flourish width={180} />
          <p className="event-text">
            Wählen Sie bis zu drei Ziele. Sie sind Ihr Maßstab: Das Land, Ihre Partner und die Geschichtsbücher messen Sie am Ende daran. Die Ziele sind messbar und
            nicht alle gleichzeitig zu haben.
          </p>
          <ul className="ziel-liste">
            {ZIELE.map((z) => (
              <li key={z.id}>
                <button className={`ziel${gewaehlt.includes(z.id) ? " on" : ""}`} onClick={() => umschalten(z.id)} aria-pressed={gewaehlt.includes(z.id)}>
                  <Icon name="ziel" size={20} />
                  <span>
                    <strong>{z.titel}</strong>
                    <em>{z.beschreibung}</em>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <div className="schwierigkeit" role="radiogroup" aria-label="Schwierigkeit">
            <b>Schwierigkeit</b>
            {(Object.keys(SCHWIERIGKEITEN) as Schwierigkeit[]).map((k) => (
              <button key={k} role="radio" aria-checked={schwer === k} className={schwer === k ? "on" : ""} onClick={() => setSchwer(k)} title={SCHWIERIGKEITEN[k].text}>
                <strong>{SCHWIERIGKEITEN[k].name}</strong>
                <span>{SCHWIERIGKEITEN[k].text}</span>
              </button>
            ))}
          </div>
          <div className="event-actions">
            <button className="brass-button" onClick={() => onFertig(gewaehlt, schwer)}>
              {gewaehlt.length ? `Mit ${gewaehlt.length} ${gewaehlt.length === 1 ? "Ziel" : "Zielen"} beginnen` : "Ohne Ziele beginnen"}
            </button>
          </div>
        </div>
      </article>
    </div>
  );
}
