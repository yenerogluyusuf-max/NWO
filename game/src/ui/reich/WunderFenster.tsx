// Die Fertigstellung eines Wunders, Großprojekts oder einer Route: ein gemaltes Bild, das im Zeitraffer entsteht, dazu Ort, Zitat und Wirkung.
// Die Wirkungen erscheinen nacheinander; wer die Bewegung nicht mag, sieht alles sofort (prefers-reduced-motion).

import { useState } from "react";
import { Corners, Flourish } from "../art/Ornament";
import { Icon } from "../icons";
import { WunderBild } from "./WunderBild";
import { effektZeile, vorhabenDef } from "../../sim/reich";
import { formatDateDe } from "../../sim/dates";
import { NET } from "../../sim/modell";
import type { Vorhaben } from "../../sim/reich-typen";

const TITEL: Record<string, string> = { wunder: "Ein Wunder ist vollendet", grossprojekt: "Ein Großprojekt ist eröffnet", serie: "Eine Route ist eröffnet", ausbau: "Der Ausbau ist fertig" };

function verliererName(v: Vorhaben): string | null {
  if (!v.verlierer) return null;
  const n = NET.nodes[NET.index.get(v.verlierer) ?? -1];
  return n ? n.name : v.verlierer;
}

export function WunderFenster({ id, datum, onWeiter, onKarte }: { id: string; datum: string; onWeiter: () => void; onKarte?: (o: { lon: number; lat: number }) => void }) {
  const v = vorhabenDef(id);
  // Ein Tippen auf das Bild lässt alle Bewegung an ihr Ende springen
  const [uebersprungen, setUebersprungen] = useState(false);
  if (!v) return null;
  const sofort = v.abschluss.map((e) => effektZeile(e)).filter((x): x is NonNullable<typeof x> => !!x).slice(0, 5);
  const dauer = (v.dauer ?? []).map((e) => effektZeile(e, "dauer")).filter((x): x is NonNullable<typeof x> => !!x).slice(0, 4);
  const verlierer = verliererName(v);
  return (
    <div className="event-layer wunder-layer" role="dialog" aria-modal="true" aria-labelledby={`wf-${id}`}>
      <article className={`frame wunder-fenster${uebersprungen ? " uebersprungen" : ""}`}>
        <Corners />
        <div className="wunder-bildrahmen" onClick={() => setUebersprungen(true)} title="Tippen überspringt die Bewegung">
          <WunderBild art={v.bild ?? "stadt"} animiert />
          <span className="wunder-a-hinweis" aria-hidden="true">
            Tippen überspringt
          </span>
          <span className="wunder-datum">{formatDateDe(datum)}</span>
          <span className="wunder-klasse">{TITEL[v.klasse] ?? "Fertiggestellt"}</span>
        </div>
        <div className="wunder-koerper">
          <h2 id={`wf-${id}`} className="wunder-titel">
            {v.name}
          </h2>
          {v.ort && <p className="wunder-ort">{v.ort.name}</p>}
          <Flourish />
          <p className="wunder-text">{v.text}</p>
          {v.zitat && (
            <blockquote className="wunder-zitat">
              {v.zitat.text}
              <cite>{v.zitat.von}</cite>
            </blockquote>
          )}
          {[
            { titel: "Sofort", liste: sofort, start: 1.7 },
            { titel: "Dauerhaft", liste: dauer, start: 1.7 + sofort.length * 0.18 + 0.2 },
          ]
            .filter((g) => g.liste.length > 0)
            .map((g) => (
              <div key={g.titel} className="wunder-gruppe">
                <b className="wunder-gruppe-kopf">{g.titel}</b>
                <ul className="wunder-wirkung" aria-label={g.titel}>
                  {g.liste.map((z, i) => (
                    <li key={z.text} className={z.gut ? "rr-gut" : "rr-schlecht"} style={{ animationDelay: `${g.start + i * 0.18}s` }}>
                      <span aria-hidden>{z.richtung > 0 ? "▲" : "▼"}</span> {z.text}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          <p className="wunder-kehrseite">
            <b>Der Preis:</b> {v.kehrseite}
            {verlierer && <em> Es verliert: {verlierer}.</em>}
          </p>
          <div className="wunder-knoepfe">
            {v.ort && onKarte && (
              <button className="leather-button" type="button" onClick={() => onKarte({ lon: v.ort!.lon, lat: v.ort!.lat })}>
                <Icon name="berg" size={16} /> Auf der Karte zeigen
              </button>
            )}
            <button className="brass-button" type="button" onClick={onWeiter} autoFocus>
              Weiter
            </button>
          </div>
        </div>
      </article>
    </div>
  );
}
