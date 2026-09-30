// Verträge mit einem Land: laufende mit Fortschritt, Pflichten und Prüfung, beendete mit dem Grund.

import { useState } from "react";
import type { World } from "../../sim/types";
import { land, weltZustand } from "../../sim/laender";
import { KLAUSEL_NACH_ID } from "../../data/abkommen";
import { fruehesterAusstieg, klauselSicht, kuendige, vertragsName, type Vertrag } from "../../sim/abkommen";
import { pruefeBedingung } from "../../sim/programme";
import { addDays, formatDateDe } from "../../sim/dates";

const TAGE_JAHR = 360;
const datum = (w: World, tag: number) => formatDateDe(addDays(w.date, tag - w.day));

const STATUS: Record<Vertrag["status"], string> = { laeuft: "läuft", ausgelaufen: "ausgelaufen", gebrochen: "gebrochen", gekuendigt: "gekündigt" };

function VertragKarte({ world, v, refresh }: { world: World; v: Vertrag; refresh: () => void }) {
  const [frage, setFrage] = useState(false);
  const [antwort, setAntwort] = useState<string | null>(null);
  const laeuft = v.status === "laeuft";
  const fortschritt = Math.min(1, (world.day - v.seit) / Math.max(1, v.ablauf - v.seit));
  const frueh = world.day < fruehesterAusstieg(v);
  const pflichten = [...v.gibt, ...v.will]
    .map((id) => KLAUSEL_NACH_ID[id])
    .filter((d) => d?.pflicht)
    .map((d) => ({ d: d!, ok: pruefeBedingung(world, d!.pflicht!).erfuellt }));
  return (
    <li className={`we-vertrag st-${v.status}`}>
      <div className="we-vertrag-kopf">
        <strong>{vertragsName(world, v)}</strong>
        <span className={`we-status st-${v.status}`}>{STATUS[v.status]}</span>
      </div>
      <p className="we-vertrag-klauseln">
        {v.gibt.length > 0 && (
          <span>
            <em>Wir bieten:</em> {v.gibt.map((id) => klauselSicht(world, v.land, id)?.label ?? id).join("; ")}.{" "}
          </span>
        )}
        {v.will.length > 0 && (
          <span>
            <em>Wir erhalten:</em> {v.will.map((id) => klauselSicht(world, v.land, id)?.label ?? id).join("; ")}.
          </span>
        )}
      </p>
      <div className="we-fortschritt" aria-label={`${Math.round(fortschritt * 100)} Prozent der Laufzeit`}>
        <i style={{ width: `${Math.round((laeuft ? fortschritt : v.status === "ausgelaufen" ? 1 : fortschritt) * 100)}%` }} />
      </div>
      <p className="we-vertrag-daten">
        {datum(world, v.seit)} bis {datum(world, v.ablauf)} · {v.jahre} Jahre
        {laeuft && <> · nächste Prüfung {datum(world, v.letztePruefung + TAGE_JAHR)}</>}
        {v.verstoesse > 0 && laeuft && <b className="we-schlecht"> · {v.verstoesse} Verstoß</b>}
      </p>
      {laeuft && pflichten.length > 0 && (
        <ul className="we-pflichten" aria-label="Pflichten der Türkei">
          {pflichten.map(({ d, ok }) => (
            <li key={d.id} className={ok ? "we-gut" : "we-schlecht"}>
              <span aria-hidden>{ok ? "✓" : "✗"}</span> {d.pflichtText ?? d.label}
              {!ok && <em> Bis zur nächsten Prüfung erfüllen, sonst zählt es als Verstoß.</em>}
            </li>
          ))}
        </ul>
      )}
      {v.ende && !laeuft && <p className="we-vertrag-ende">{v.ende}</p>}
      {laeuft && !antwort && (
        <div className="we-vertrag-aktion">
          {!frage ? (
            <button type="button" className="link" onClick={() => setFrage(true)}>
              Kündigen …
            </button>
          ) : (
            <>
              <span className={frueh ? "we-schlecht" : ""}>
                {frueh ? `Vor dem ${datum(world, fruehesterAusstieg(v))} gilt der Ausstieg als Bruch: Vertrauen und Ansehen sinken, das Land verhandelt später härter.` : "Ordentliche Kündigung: ein kleiner Verlust an Vertrauen, die Dauerwirkungen enden."}
              </span>
              <button
                type="button"
                className="aktion-knopf"
                onClick={() => {
                  setAntwort(kuendige(world, v.land, v.id).text);
                  refresh();
                }}
              >
                Ja, kündigen
              </button>
              <button type="button" className="link" onClick={() => setFrage(false)}>
                Doch nicht
              </button>
            </>
          )}
        </div>
      )}
      {antwort && <p className="we-vertrag-ende">{antwort}</p>}
    </li>
  );
}

export function Vertraege({ world, landId, refresh }: { world: World; landId: string; refresh: () => void }) {
  const l = land(landId);
  const alle = [...(weltZustand(world)[landId]!.vertraege ?? [])].reverse();
  const laufende = alle.filter((v) => v.status === "laeuft");
  const beendet = alle.filter((v) => v.status !== "laeuft");
  if (alle.length === 0) {
    return <p className="we-leer">Mit {l.dat} gibt es noch keinen Vertrag. Am Verhandlungstisch stellen Sie einen zusammen.</p>;
  }
  return (
    <div className="we-vertraege">
      {laufende.length > 0 && (
        <>
          <h4>Laufend</h4>
          <ul>
            {laufende.map((v) => (
              <VertragKarte key={v.id} world={world} v={v} refresh={refresh} />
            ))}
          </ul>
        </>
      )}
      {beendet.length > 0 && (
        <>
          <h4>Beendet</h4>
          <ul>
            {beendet.map((v) => (
              <VertragKarte key={v.id} world={world} v={v} refresh={refresh} />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
