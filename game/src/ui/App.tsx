import { useMemo, useState } from "react";
import { createWorld } from "../sim/world";
import { turkey2026 } from "../sim/scenario";
import type { World } from "../sim/types";
import { Prologue } from "./Prologue";
import { Stage } from "./Stage";
import { schnellProfil, startAfterElection, type PlayerProfile } from "../sim/prolog";
import { AtlasMap } from "./atlas/AtlasMap";
import { provinceLonLat } from "./atlas/overlay";
import { Corners, Flourish, StateSeal } from "./art/Ornament";
import { ladeSpielstand, loescheSpielstand, spielstandInfo, speichere } from "./speicher";
import { formatDateDe } from "../sim/dates";

type Phase = "titel" | "prolog" | "spiel";

const OVERVIEW = { lon: 35.2, lat: 38.9, d: 15.5 };

function neueWelt(): World {
  return createWorld(turkey2026, Date.now() % 1_000_000);
}

/** Schnellstart (`?schnellstart`): sofort im Amt, ohne Prolog. */
function schnellstartWelt(): World {
  const w = neueWelt();
  startAfterElection(w, schnellProfil());
  return w;
}

export function App() {
  const schnell = useMemo(() => new URLSearchParams(location.search).has("schnellstart"), []);
  const [phase, setPhase] = useState<Phase>(() => (schnell ? "spiel" : "titel"));
  const [focus, setFocus] = useState<number | undefined>(undefined);
  const [world, setWorld] = useState<World>(() => (schnell ? schnellstartWelt() : neueWelt()));
  const [spielId, setSpielId] = useState(0);
  /** Ob die laufende Partie aus einem Spielstand stammt — dann zeigt die Bühne das „Stand der Dinge“-Blatt */
  const [geladen, setGeladen] = useState(false);
  const stand = useMemo(() => spielstandInfo(), [phase]);

  const camera = useMemo(() => {
    const ll = focus ? provinceLonLat(focus) : undefined;
    return ll ? { lon: ll[0], lat: ll[1] - 0.6, d: 7.5 } : OVERVIEW;
  }, [focus]);

  if (phase === "spiel") {
    return (
      <Stage
        key={spielId}
        world={world}
        geladen={geladen}
        onNeu={() => {
          loescheSpielstand();
          setWorld(neueWelt());
          setFocus(undefined);
          setGeladen(false);
          setPhase("titel");
        }}
      />
    );
  }

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
              <button
                className="leather-button"
                disabled={!stand}
                title={stand ? `${stand.name}, ${formatDateDe(stand.datum)}` : "Noch kein Spielstand vorhanden"}
                onClick={() => {
                  const w = ladeSpielstand();
                  if (!w) return;
                  setWorld(w);
                  setGeladen(true);
                  setSpielId((i) => i + 1);
                  setPhase("spiel");
                }}
              >
                {stand ? `Fortsetzen · ${formatDateDe(stand.datum)}` : "Fortsetzen"}
              </button>
            </nav>
          </div>
          <p className="title-note">Wirtschaftsdaten vom 25. September 2026 · Karte nach Natural Earth, AWS Terrain und OpenStreetMap</p>
        </main>
      )}
      {phase === "prolog" && (
        <Prologue
          onFocus={setFocus}
          onDone={(profile: PlayerProfile) => {
            const w = neueWelt();
            startAfterElection(w, profile);
            speichere(w);
            setWorld(w);
            setSpielId((i) => i + 1);
            setPhase("spiel");
          }}
        />
      )}
    </div>
  );
}
