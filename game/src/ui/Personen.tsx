// Personen und Zusagen: Wer um den Präsidenten steht, was er will und wie er zu Ihnen steht.

import { useState } from "react";
import type { World } from "../sim/types";
import { haltung } from "../sim/figuren";
import { entlasseFigur, sprichMitFigur, GESPRAECH_ABKUEHLUNG } from "../sim/eingriffe";
import { Rng } from "../sim/rng";
import { formatDateDe, addDays } from "../sim/dates";
import { Cameo } from "./art/Cameo";
import { kannZahlen } from "../sim/kapital";

const ENTLASSBAR = new Set(["finanzen", "inneres", "aussen", "stab"]);

export function Personen({ world, refresh }: { world: World; refresh?: () => void }) {
  const spiel = world.spiel;
  const [antwort, setAntwort] = useState<{ ok: boolean; text: string; why?: string } | null>(null);
  const [wirklich, setWirklich] = useState<string | null>(null);
  if (!spiel) return <p>In dieser Partie gibt es kein Umfeld.</p>;

  function gespraech(id: string) {
    setAntwort(sprichMitFigur(world, id));
    refresh?.();
  }
  function entlassen(id: string, amt: "finanzen" | "inneres" | "aussen" | "stab") {
    if (wirklich !== id) {
      setWirklich(id);
      return;
    }
    const r = entlasseFigur(world, amt, new Rng(world.rngState ^ world.day));
    world.rngState = (world.rngState + 1) | 0;
    setAntwort(r);
    setWirklich(null);
    refresh?.();
  }
  const offen = spiel.zusagen.filter((z) => !z.erfuellt && !z.gebrochen);
  const erledigt = spiel.zusagen.filter((z) => z.erfuellt || z.gebrochen);
  return (
    <div className="personen">
      <section className="paper">
        <h3>Ihr Umfeld</h3>
        <p className="subtitle">Wer Ihnen folgt, hängt an Ihren Entscheidungen. Loyalität wächst mit gehaltenen Zusagen und sinkt mit Angriffen auf ihr Feld.</p>
        {antwort && (
          <p className={`rueckmeldung ${antwort.ok ? "ok" : "nein"}`} role="status">
            {antwort.text}
            {antwort.why && <em> {antwort.why}</em>}
          </p>
        )}
        <ul className="figuren">
          {spiel.figuren.map((f) => (
            <li key={f.id} className={f.amt === "opposition" ? "gegner" : ""}>
              <Cameo seed={f.name} size={44} figure={f.weiblich ? "f" : "m"} tint={f.amt === "opposition" ? "#7a3b30" : "#265a62"} />
              <div>
                <strong>{f.name}</strong>
                <div className="rolle">{f.rolle}</div>
                <p className="figur-will"><b>Will</b>{f.ziel}</p>
                <div className={`loyal l-${f.loyalitaet >= 55 ? "gut" : f.loyalitaet >= 30 ? "mittel" : "schlecht"}`} title={`Loyalität ${Math.round(f.loyalitaet)} von 100`}>
                  <span className="bar">
                    <i style={{ width: `${f.loyalitaet}%` }} />
                  </span>
                  <em>{haltung(f)}</em>
                </div>
                {f.amt !== "opposition" && (
                  <div className="fraktion-aktionen">
                    <button
                      className="aktion-knopf"
                      disabled={!kannZahlen(spiel.kapital, 1) || (f.gespraech !== undefined && f.gespraech + GESPRAECH_ABKUEHLUNG > world.day)}
                      onClick={() => gespraech(f.id)}
                      title={f.gespraech !== undefined && f.gespraech + GESPRAECH_ABKUEHLUNG > world.day ? `Wieder sinnvoll in ${f.gespraech + GESPRAECH_ABKUEHLUNG - world.day} Tagen.` : "Ein Gespräch stärkt die Loyalität (+8)."}
                    >
                      Gespräch führen <b>1</b>
                    </button>
                    {ENTLASSBAR.has(f.amt) && (
                      <button className="aktion-knopf leise" disabled={!kannZahlen(spiel.kapital, 4)} onClick={() => entlassen(f.id, f.amt as "finanzen" | "inneres" | "aussen" | "stab")} title="Ein neuer Mensch mit eigener Haltung; die Märkte reagieren auf Wechsel im Finanzministerium.">
                        {wirklich === f.id ? "Wirklich entlassen?" : "Entlassen"} <b>4</b>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>
      <section className="paper">
        <h3>Zusagen</h3>
        {offen.length === 0 && <p className="subtitle">Keine offenen Zusagen.</p>}
        <ul className="zusagen">
          {offen.map((z) => (
            <li key={z.id}>
              <strong>{z.von}</strong> {z.text}
              <div className="subtitle">fällig am {formatDateDe(addDays(world.spiel!.start.datum, z.faellig))}</div>
            </li>
          ))}
        </ul>
        {erledigt.length > 0 && (
          <>
            <h3>Erledigt</h3>
            <ul className="zusagen erledigt">
              {erledigt.map((z) => (
                <li key={z.id} className={z.erfuellt ? "erfuellt" : "gebrochen"}>
                  {z.erfuellt ? "gehalten" : "gebrochen"}: {z.text}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
