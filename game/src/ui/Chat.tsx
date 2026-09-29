// Das Gespräch: freie Sprache, gepruefte Aktionen (Spieldesign, Abschnitt 5 und 6).
// Jede wirksame Aenderung erscheint im Verlauf mit Begruendung, wie im Spiel gefordert.

import { useRef, useState } from "react";
import type { World } from "../sim/types";
import { befehl, willkommensText, type ChatZeile } from "../sim/befehle";

export function Chat({ world, refresh }: { world: World; refresh: () => void }) {
  const [zeilen, setZeilen] = useState<ChatZeile[]>([{ rolle: "spiel", text: willkommensText() }]);
  const [text, setText] = useState("");
  const unten = useRef<HTMLDivElement>(null);

  function senden(e: React.FormEvent) {
    e.preventDefault();
    const roh = text.trim();
    if (!roh) return;
    const antwort = befehl(roh, world);
    setZeilen((z) => [
      ...z,
      { rolle: "spieler", text: roh },
      { rolle: "spiel", text: antwort.text, why: antwort.why },
    ]);
    setText("");
    refresh();
    requestAnimationFrame(() => unten.current?.scrollIntoView({ behavior: "smooth" }));
  }

  return (
    <div className="chat">
      <div className="chat-verlauf" aria-live="polite">
        {zeilen.map((z, i) => (
          <div key={i} className={`chat-zeile ${z.rolle}`}>
            <span className="chat-rolle">{z.rolle === "spieler" ? "Sie" : "Kanzlei"}</span>
            <div className="chat-text">
              <p>{z.text}</p>
              {z.why && <p className="chat-why">{z.why}</p>}
            </div>
          </div>
        ))}
        <div ref={unten} />
      </div>
      <form className="chat-eingabe" onSubmit={senden}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Schreiben Sie, was geschehen soll …"
          aria-label="Anweisung"
        />
        <button type="submit" className="brass-button">
          Senden
        </button>
      </form>
    </div>
  );
}
