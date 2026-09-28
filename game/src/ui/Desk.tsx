import { useState } from "react";
import type { LogEntry, World } from "../sim/types";
import { formatDateDe } from "../sim/dates";
import { mentorNotes } from "./mentor";
import { Parliament } from "./Parliament";
import { Cameo } from "./art/Cameo";
import { Icon, type IconName } from "./icons";

type View = "schreibtisch" | "wirtschaft" | "karte" | "entscheidungen";

const KIND_ICON: Record<LogEntry["kind"], IconName> = {
  entscheidung: "siegel",
  ereignis: "feder",
  statistik: "akte",
  markt: "lira",
};

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
        <ul>
          {briefing.map((entry, i) => (
            <li key={`${entry.day}-${i}`} className={`entry kind-${entry.kind}`}>
              {(i === 0 || briefing[i - 1]!.date !== entry.date) && <div className="brief-date">{formatDateDe(entry.date)}</div>}
              <div className="entry-row">
                <span className="entry-icon" title={KIND_LABEL[entry.kind]}>
                  <Icon name={KIND_ICON[entry.kind]} size={18} />
                </span>
                <div>
                  <div>{entry.text}</div>
                  {entry.why && <div className="why">{entry.why}</div>}
                </div>
              </div>
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
