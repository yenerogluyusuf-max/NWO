// Die Abstimmung als kurzer Auftritt: Sitze werden von links nach rechts aufgerufen, die Zähler laufen, dann fällt der Stempel.
// Die Karte hält das Spiel nicht an: Die Zeit läuft weiter, ein Tippen überspringt, und im Parlament lässt sich jede Abstimmung erneut abspielen.
// Warum so: Eine Abstimmung ist keine Entscheidung des Spielers, sondern ein Ergebnis. Pausen gibt es im Spiel nur, wo etwas zu entscheiden ist;
// bei „Vorspulen“ würde eine blockierende Sequenz jedes Gesetz zu einem Hindernis machen.

import { useEffect, useMemo, useRef, useState } from "react";
import type { World } from "../../sim/types";
import { REGELN } from "../../sim/handeln";
import { amAbstimmungBeobachten, baueVerlauf, leseAbstimmung, merkeGesetze, type Abstimmung } from "./abstimmung";
import { FARBEN_DUNKEL, Sitzplan } from "./Halbrund";
import "./parlament.css";

const DAUER = 2600;
const HALTEN = 5200;

export function nutztReduzierteBewegung(): boolean {
  try {
    return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

interface Eintrag {
  ab: Abstimmung;
  sach: string[];
  nr: number;
}

let zaehler = 0;

/** Beobachtet das Protokoll und zeigt jede neue Abstimmung; wird einmal in der Bühne eingebunden. */
export function AbstimmungsKarte({ world }: { world: World }) {
  const gesehen = useRef<number | null>(null);
  const sach = useRef(new Map<string, string[]>());
  const [warte, setWarte] = useState<Eintrag[]>([]);

  // Vor der Abstimmung merken, welche Fraktionen aus Sachgründen mitstimmen (danach ist das Gesetz aus der Liste)
  merkeGesetze(world, sach.current);

  useEffect(() => {
    const n = world.log.length;
    if (gesehen.current === null || n < gesehen.current) {
      gesehen.current = n;
      return;
    }
    const neu: Eintrag[] = [];
    for (let i = gesehen.current; i < n; i++) {
      const l = world.log[i]!;
      if (l.kind !== "entscheidung") continue;
      const ab = leseAbstimmung(l);
      if (ab) neu.push({ ab, sach: sach.current.get(ab.name) ?? [], nr: ++zaehler });
    }
    gesehen.current = n;
    if (neu.length) setWarte((q) => [...q, ...neu].slice(-3));
  });

  useEffect(() => amAbstimmungBeobachten((ab, s) => setWarte((q) => [...q, { ab, sach: s, nr: ++zaehler }].slice(-3))), []);

  const erste = warte[0];
  if (!erste) return null;
  return <Karte key={erste.nr} world={world} eintrag={erste} weitere={warte.length - 1} onZu={() => setWarte((q) => q.slice(1))} />;
}

function Karte({ world, eintrag, weitere, onZu }: { world: World; eintrag: Eintrag; weitere: number; onZu: () => void }) {
  const { ab } = eintrag;
  const verlauf = useMemo(() => baueVerlauf(world, ab, eintrag.sach), [ab, eintrag.sach, world]);
  const n = verlauf?.votum.length ?? 0;
  const reduziert = useMemo(nutztReduzierteBewegung, []);
  const [sichtbar, setSichtbar] = useState(reduziert ? n : 0);
  const [fertig, setFertig] = useState(reduziert || !verlauf);
  const raf = useRef(0);
  // Die Bühne zeichnet bei jedem Tick neu; die Schließfunktion darf die Uhr deshalb nicht zurücksetzen
  const zu = useRef(onZu);
  zu.current = onZu;

  useEffect(() => {
    if (!verlauf || reduziert) return;
    const t0 = performance.now();
    const schritt = (t: number) => {
      const x = Math.min(1, (t - t0) / DAUER);
      setSichtbar(Math.round(n * (1 - Math.pow(1 - x, 1.25))));
      if (x < 1) raf.current = requestAnimationFrame(schritt);
      else setFertig(true);
    };
    raf.current = requestAnimationFrame(schritt);
    return () => cancelAnimationFrame(raf.current);
  }, [verlauf, reduziert, n]);

  useEffect(() => {
    if (!fertig) return;
    const id = window.setTimeout(() => zu.current(), HALTEN);
    return () => window.clearTimeout(id);
  }, [fertig]);

  useEffect(() => {
    const taste = (e: KeyboardEvent) => {
      if (e.key === "Escape") zu.current();
    };
    window.addEventListener("keydown", taste);
    return () => window.removeEventListener("keydown", taste);
  }, []);

  if (!verlauf) return null;
  const ja = sichtbar > 0 ? verlauf.jaKum[sichtbar - 1]! : 0;
  const nein = sichtbar - ja;
  const ueber = ab.ja - REGELN.mehrheit;

  function tippen() {
    if (!fertig) {
      cancelAnimationFrame(raf.current);
      setSichtbar(n);
      setFertig(true);
    } else zu.current();
  }

  return (
    <div className={`par-karte-huelle${fertig ? " fertig" : ""}`} role="status" aria-live="polite">
      <button className="par-karte" onClick={tippen} aria-label={fertig ? "Abstimmung schließen" : "Abstimmung überspringen"}>
        <span className="par-karte-kopf">Abstimmung im Parlament</span>
        <strong className="par-karte-titel">„{ab.name}“</strong>
        <span className="par-karte-unter">
          {ab.angenommen ? `${ab.ort}${ab.stufe !== undefined ? ` · Stufe ${ab.stufe}` : ""}` : "Gesetzentwurf"} · {REGELN.mehrheit} Stimmen nötig
        </span>
        <Sitzplan
          lage={verlauf.lage}
          modus="abstimmung"
          votum={verlauf.votum}
          sichtbar={sichtbar}
          farben={FARBEN_DUNKEL}
          className="par-dunkel"
          aria={`Abstimmung über ${ab.name}: ${ab.ja} Ja, ${ab.nein} Nein`}
          mitte={
            <div className="par-zaehler">
              <span className="ja">
                <b>{ja}</b>
                <i>Ja</i>
              </span>
              <span className="nein">
                <b>{nein}</b>
                <i>Nein</i>
              </span>
            </div>
          }
        />
        <span className="par-balken" aria-hidden="true">
          <i className="ja" style={{ width: `${(ja / Math.max(1, n)) * 100}%` }} />
          <i className="nein" style={{ width: `${(nein / Math.max(1, n)) * 100}%` }} />
          <s style={{ left: `${(REGELN.mehrheit / Math.max(1, n)) * 100}%` }} />
        </span>
        <span className="par-urteil-zeile">
          {fertig ? (
            <>
              <span className={`par-stempel ${ab.angenommen ? "angenommen" : "abgelehnt"}`}>{ab.angenommen ? "Angenommen" : "Abgelehnt"}</span>
              <span className="par-urteil-text">{ab.angenommen ? `${ab.ja} zu ${ab.nein}: ${ueber} Stimmen über der Mehrheit.` : `${ab.ja} zu ${ab.nein}: Es fehlten ${REGELN.mehrheit - ab.ja} Stimmen.`}</span>
            </>
          ) : (
            <span className="par-urteil-text">Tippen überspringt.</span>
          )}
        </span>
        {weitere > 0 && <span className="par-weitere">Noch {weitere} {weitere === 1 ? "weitere Abstimmung" : "weitere Abstimmungen"}</span>}
      </button>
    </div>
  );
}
