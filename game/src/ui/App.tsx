import { useCallback, useEffect, useRef, useState } from "react";
import { advance, createWorld } from "../sim/world";
import { turkey2026 } from "../sim/scenario";
import { formatDateDe } from "../sim/dates";
import type { World } from "../sim/types";
import { Desk } from "./Desk";
import { EconomyFile } from "./EconomyFile";
import { ProvinceMap } from "./ProvinceMap";
import { Decisions } from "./Decisions";
import { NetView } from "./NetView";
import { Prologue } from "./Prologue";
import { startAfterElection, type PlayerProfile } from "../sim/prolog";

type View = "schreibtisch" | "wirtschaft" | "netz" | "karte" | "entscheidungen";

const SPEEDS = [
  { label: "Pause", msPerDay: 0 },
  { label: "▶", msPerDay: 700 },
  { label: "▶▶", msPerDay: 200 },
  { label: "▶▶▶", msPerDay: 40 },
];

export function App() {
  const [started, setStarted] = useState(() => new URLSearchParams(location.search).has("schnellstart"));
  const world = useRef<World>(createWorld(turkey2026, Date.now() % 1_000_000));

  if (!started) {
    return (
      <div className="app">
        <header className="topbar">
          <div className="brand">Staatsräson</div>
        </header>
        <main className="main">
          <Prologue
            onDone={(profile: PlayerProfile) => {
              startAfterElection(world.current, profile);
              setStarted(true);
            }}
          />
        </main>
      </div>
    );
  }
  return <Game world={world.current} />;
}

function Game({ world: initial }: { world: World }) {
  const world = useRef<World>(initial);
  const [, setVersion] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [view, setView] = useState<View>("schreibtisch");

  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    const ms = SPEEDS[speed]!.msPerDay;
    if (ms === 0) return;
    const id = setInterval(() => {
      const logBefore = world.current.log.length;
      advance(world.current, 1);
      // Wichtige Entscheidungen unterbrechen das Vorspulen (Spieldesign, Abschnitt 2)
      const fresh = world.current.log.slice(logBefore);
      if (fresh.some((l) => l.kind === "entscheidung")) setSpeed(0);
      refresh();
    }, ms);
    return () => clearInterval(id);
  }, [speed, refresh]);

  const w = world.current;

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">Staatsräson</div>
        <div className="date">{formatDateDe(w.date)}</div>
        <div className="speeds" role="group" aria-label="Zeit">
          {SPEEDS.map((s, i) => (
            <button key={s.label} className={i === speed ? "active" : ""} onClick={() => setSpeed(i)}>
              {s.label}
            </button>
          ))}
        </div>
        <nav className="tabs">
          {(
            [
              ["schreibtisch", "Schreibtisch"],
              ["wirtschaft", "Wirtschaftsakte"],
              ["netz", "Politiknetz"],
              ["karte", "Karte"],
              ["entscheidungen", "Entscheidungen"],
            ] as const
          ).map(([id, label]) => (
            <button key={id} className={view === id ? "active" : ""} onClick={() => setView(id)}>
              {label}
            </button>
          ))}
        </nav>
      </header>
      <main className="main">
        {view === "schreibtisch" && <Desk world={w} onOpen={setView} />}
        {view === "wirtschaft" && <EconomyFile world={w} />}
        {view === "netz" && <NetView world={w} onDecided={refresh} />}
        {view === "karte" && <ProvinceMap />}
        {view === "entscheidungen" && (
          <Decisions
            world={w}
            onDecided={() => {
              refresh();
              setView("schreibtisch");
            }}
          />
        )}
      </main>
      <footer className="footer">
        Prototyp · Daten vom Stichtag {turkey2026.dataDate} · Karte: Natural Earth (gemeinfrei)
      </footer>
    </div>
  );
}
