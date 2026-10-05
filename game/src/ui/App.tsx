import { useEffect, useMemo, useRef, useState } from "react";
import { createWorld } from "../sim/world";
import { turkey2026 } from "../sim/scenario";
import type { World } from "../sim/types";
import { msg, rendere, t, type Msg } from "../i18n";
import { SprachWahl } from "./SprachWahl";
import { Prologue } from "./Prologue";
import { Stage } from "./Stage";
import { Fehlergrenze } from "./Fehlergrenze";
import { schnellProfil, startAfterElection, type PlayerProfile } from "../sim/prolog";
import { AtlasMap } from "./atlas/AtlasMap";
import { provinceLonLat } from "./atlas/overlay";
import { verdeckterRand } from "./prolog/kamera";
import { Corners, Flourish, StateSeal } from "./art/Ornament";
import { alleSlots, fruehereStaende, importiereSpielstandDatei, ladeRueck, ladeSlot, ladeSpielstand, loescheSpielstand, spielstandInfo, speichere, speichereWarten } from "./speicher";
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
  /** Abstand der Kamera im Prolog (je Station); ohne Angabe der Standard */
  const [focusD, setFocusD] = useState<number | undefined>(undefined);
  /** Das Buch ist gerade breit (Parteiseite): Es verdeckt mehr von der Karte */
  const [buchWeit, setBuchWeit] = useState(false);
  const [world, setWorld] = useState<World>(() => (schnell ? schnellstartWelt() : neueWelt()));
  const [spielId, setSpielId] = useState(0);
  /** Ob die laufende Partie aus einem Spielstand stammt — dann zeigt die Bühne das „Stand der Dinge“-Blatt */
  const [geladen, setGeladen] = useState(false);
  const stand = useMemo(() => spielstandInfo(), [phase]);
  const slots = useMemo(() => alleSlots(), [phase]);
  const frueher = useMemo(() => fruehereStaende(), [phase]);
  const dateiWahl = useRef<HTMLInputElement>(null);
  const [ladeFehler, setLadeFehler] = useState<Msg | null>(null);

  /** Startet die Bühne mit einer geladenen Welt (Fortsetzen, Slot oder Datei). */
  const startMit = (w: World) => {
    setWorld(w);
    setGeladen(true);
    setLadeFehler(null);
    setSpielId((i) => i + 1);
    setPhase("spiel");
  };

  /** Liest eine exportierte Spielstanddatei (.json) ein. */
  const ausDatei = async (datei: File | undefined) => {
    if (!datei) return;
    try {
      const w = importiereSpielstandDatei(await datei.text());
      if (w) startMit(w);
      else setLadeFehler(msg("titel.fehler_datei_format"));
    } catch {
      setLadeFehler(msg("titel.fehler_datei_lesen"));
    }
  };

  // Im Prolog liegt das Buch auf der rechten Seite: Die Karte zielt in die Mitte der freien Fläche links davon
  const [randProlog, setRandProlog] = useState(() => verdeckterRand());
  useEffect(() => {
    const f = () => setRandProlog(verdeckterRand(buchWeit));
    f();
    window.addEventListener("resize", f);
    return () => window.removeEventListener("resize", f);
  }, [buchWeit]);

  const camera = useMemo(() => {
    const ll = focus ? provinceLonLat(focus) : undefined;
    return ll ? { lon: ll[0], lat: ll[1] - 0.6, d: focusD ?? 7.5 } : OVERVIEW;
  }, [focus, focusD]);

  if (phase === "spiel") {
    return (
      <Fehlergrenze gross titel={t("spiel.name")}>
      <Stage
        key={spielId}
        world={world}
        geladen={geladen}
        onNeu={() => {
          // Eine beendete Laufbahn bleibt erhalten: Sie wird gesichert statt gelöscht und liegt danach als „Weitester Stand“ im Titelbild.
          // Nur eine laufende, noch nicht beendete Partie wird wie bisher vom Spielstand entfernt (die Sicherung des weitesten Stands bleibt auch dann).
          const beendet = !!world.spiel?.ende;
          void (async () => {
            if (beendet) await speichereWarten(world);
            else loescheSpielstand();
            setWorld(neueWelt());
            setFocus(undefined);
            setFocusD(undefined);
            setBuchWeit(false);
            setGeladen(false);
            setPhase("titel");
          })();
        }}
      />
      </Fehlergrenze>
    );
  }

  return (
    <div className={`front phase-${phase}`}>
      <AtlasMap className="front-map" interactive={false} drift camera={camera} selected={focus} labels={focus ? [focus] : []} randRechts={phase === "prolog" ? randProlog : 0} />
      <div className="front-shade" />
      {phase === "titel" && (
        <main className="title-screen">
          <div className="title-plaque frame">
            <Corners />
            <StateSeal size={120} />
            <h1 className="logo">{t("spiel.name")}</h1>
            <Flourish width={300} />
            <p className="tagline">{t("titel.tagline")}</p>
            <nav className="title-menu">
              <button className="brass-button" onClick={() => setPhase("prolog")}>
                {t("titel.neu")}
              </button>
              <button
                className="leather-button"
                disabled={!stand}
                title={stand ? t("titel.stand_hinweis", { name: stand.name, d: stand.datum }) : t("titel.kein_stand")}
                onClick={async () => {
                  const w = await ladeSpielstand();
                  if (w) startMit(w);
                  else setLadeFehler(msg("titel.fehler_letzter"));
                }}
              >
                {stand ? t("titel.fortsetzen_datum", { d: stand.datum }) : t("titel.fortsetzen")}
              </button>
              {slots.map((sl) => (
                <button
                  key={sl.slot}
                  className="leather-button"
                  title={t("titel.stand_hinweis", { name: sl.name, d: sl.datum })}
                  onClick={async () => {
                    const w = await ladeSlot(sl.slot);
                    if (w) startMit(w);
                    else setLadeFehler(msg("titel.fehler_slot", { n: sl.slot }));
                  }}
                >
                  {t("titel.slot_text", { label: sl.label, d: sl.datum })}
                </button>
              ))}
              {frueher.length > 0 && (
                <details className="frueher-staende">
                  <summary>{t("titel.frueher", { n: frueher.length })}</summary>
                  {frueher.map((r) => (
                    <button
                      key={r.key}
                      className="leather-button"
                      title={t("titel.frueher_hinweis")}
                      onClick={async () => {
                        const w = await ladeRueck(r.key);
                        if (w) startMit(w);
                        else setLadeFehler(msg("titel.fehler_sicherung"));
                      }}
                    >
                      {r.key === "hoechst" ? t("titel.weitester") : t("titel.sicherung")} · {formatDateDe(r.info.datum)}
                      {r.info.gespeichert ? t("titel.sicherung_zeit", { z: r.info.gespeichert }) : ""}
                    </button>
                  ))}
                </details>
              )}
              <button className="leather-button" title={t("titel.datei_hinweis")} onClick={() => dateiWahl.current?.click()}>
                {t("titel.datei")}
              </button>
              <input
                ref={dateiWahl}
                type="file"
                accept=".json,application/json"
                hidden
                onChange={(e) => {
                  void ausDatei(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </nav>
            {ladeFehler && (
              <p className="title-note" role="alert">
                {rendere(ladeFehler)}
              </p>
            )}
          </div>
          <p className="title-note">{t("titel.quellen", { d: "2026-09-25" })}</p>
          <SprachWahl className="title-sprache" />
        </main>
      )}
      {phase === "prolog" && (
        <Prologue
          onFocus={(plaka, d, weit) => {
            setFocus(plaka);
            setFocusD(d);
            setBuchWeit(!!weit);
          }}
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
