import { useRef, useState } from "react";
import { createWorld } from "../sim/world";
import { turkey2026 } from "../sim/scenario";
import type { World } from "../sim/types";
import { Prologue } from "./Prologue";
import { Stage } from "./Stage";
import { startAfterElection, type PlayerProfile } from "../sim/prolog";

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
  return <Stage world={world.current} />;
}
