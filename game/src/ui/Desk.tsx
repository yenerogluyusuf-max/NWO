import { useState } from "react";
import type { LogEntry, World } from "../sim/types";
import { formatDateDe } from "../sim/dates";
import { mentorNotes } from "./mentor";
import { Parliament } from "./Parliament";
import { Cameo } from "./art/Cameo";

type View = "schreibtisch" | "wirtschaft" | "karte" | "entscheidungen";

const KIND_LABEL: Record<LogEntry["kind"], string> = {
  entscheidung: "Beschluss",
  ereignis: "Ereignis",
  statistik: "Gemessen",
  markt: "Markt",
};

export function Desk({ world, onOpen }: { world: World; onOpen: (v: View) => void }) {
  const [openNote, setOpenNote] = useState<number | null>(null);
  // Das Briefing zeigt höchstens fünf Punkte (Spieldesign, Abschnitt 4).
  const briefing = [...world.log].reverse().slice(0, 5);
  const notes = mentorNotes(world);

  return (
    <div className="desk">
      <section className="paper briefing">
        <h2>Morgenbriefing</h2>
        <p className="subtitle">{formatDateDe(world.date)}</p>
        <ul>
          {briefing.map((entry, i) => (
            <li key={`${entry.day}-${i}`} className={`entry kind-${entry.kind}`}>
              <span className="tag">{KIND_LABEL[entry.kind]}</span>
              <span className="when">{formatDateDe(entry.date)}</span>
              <div>{entry.text}</div>
              {entry.why && <div className="why">Warum: {entry.why}</div>}
            </li>
          ))}
        </ul>
        <div className="desk-actions">
          <button onClick={() => onOpen("wirtschaft")}>Wirtschaftsakte öffnen</button>
          <button onClick={() => onOpen("entscheidungen")}>Entscheidungen</button>
        </div>
      </section>

      <div className="desk-side">
      <Parliament world={world} />
      <aside className="mentor">
        <div className="mentor-head">
          <Cameo seed="Defne Arslan" figure="f" glasses size={46} tint="#265a62" />
          <div>
            <strong>Prof. Dr. Defne Arslan</strong>
            <div className="subtitle">Mentorin · neutral</div>
          </div>
        </div>
        {notes.map((n, i) => (
          <div key={i} className="note">
            <p>{n.short}</p>
            {openNote === i ? (
              <p className="more">{n.more}</p>
            ) : (
              <button className="link" onClick={() => setOpenNote(i)}>
                Mehr erklären
              </button>
            )}
          </div>
        ))}
      </aside>
      </div>
    </div>
  );
}
