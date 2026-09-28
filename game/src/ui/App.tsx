import { useMemo, useRef, useState } from "react";
import { createWorld } from "../sim/world";
import { turkey2026 } from "../sim/scenario";
import type { World } from "../sim/types";
import { Prologue } from "./Prologue";
import { Stage } from "./Stage";
import { startAfterElection, type PlayerProfile } from "../sim/prolog";
import { AtlasMap } from "./atlas/AtlasMap";
import { provinceLonLat } from "./atlas/overlay";
import { Corners, Flourish, StateSeal } from "./art/Ornament";

type Phase = "titel" | "prolog" | "spiel";

const OVERVIEW = { lon: 35.2, lat: 38.9, d: 15.5 };

export function App() {
  const [phase, setPhase] = useState<Phase>(() => (new URLSearchParams(location.search).has("schnellstart") ? "spiel" : "titel"));
  const [focus, setFocus] = useState<number | undefined>(undefined);
  const world = useRef<World>(createWorld(turkey2026, Date.now() % 1_000_000));

  const camera = useMemo(() => {
    const ll = focus ? provinceLonLat(focus) : undefined;
    return ll ? { lon: ll[0], lat: ll[1] - 0.6, d: 7.5 } : OVERVIEW;
  }, [focus]);

  if (phase === "spiel") return <Stage world={world.current} />;

  return (
    <div className={`front phase-${phase}`}>
      <AtlasMap className="front-map" interactive={false} drift camera={camera} selected={focus} labels={focus ? [focus] : []} />
      <div className="front-shade" />
      {phase === "titel" && (
        <main className="title-screen">
          <div className="title-plaque frame">
            <Corners />
            <StateSeal size={120} />
            <h1 className="logo">Staatsräson</h1>
            <Flourish width={300} />
            <p className="tagline">Die Türkei nach der Wahl 2028. Ein Land, ein Amt, fünf Jahre.</p>
            <nav className="title-menu">
              <button className="brass-button" onClick={() => setPhase("prolog")}>
                Neues Spiel
              </button>
              <button className="leather-button" disabled title="Noch kein Spielstand vorhanden">
                Fortsetzen
              </button>
            </nav>
          </div>
          <p className="title-note">Wirtschaftsdaten vom 25. September 2026 · Karte nach Natural Earth und AWS Terrain</p>
        </main>
      )}
      {phase === "prolog" && (
        <Prologue
          onFocus={setFocus}
          onDone={(profile: PlayerProfile) => {
            startAfterElection(world.current, profile);
            setPhase("spiel");
          }}
        />
      )}
    </div>
  );
}
