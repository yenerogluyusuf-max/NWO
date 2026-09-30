// „Die Mentorin erklärt“: Zu jeder Größe stehen hier in drei Reitern, was sie ist, wie das Land im Weltvergleich steht
// und was du tun kannst. Man soll im Spiel lernen (Lernkonzept).

import { useMemo, useState } from "react";
import type { World } from "../sim/types";
import type { NodeSpec } from "../data/politiknetz";
import { erklaere } from "./lernen";
import { VergleichBalken } from "./VergleichBalken";
import { indikatorenFuer, spielWert } from "./vergleich";
import { Cameo } from "./art/Cameo";

type Reiter = "erklaert" | "welt" | "tun";

export function Erklaerung({ node, world, onSelect }: { node: NodeSpec; world: World; onSelect: (id: string) => void }) {
  const [reiter, setReiter] = useState<Reiter>("erklaert");
  const [welt, setWelt] = useState(0);
  const [mehr, setMehr] = useState(false);
  const tag = world.day - (world.day % 15);
  const e = useMemo(() => erklaere(node, world), [node.id, world.net.month, tag]); // eslint-disable-line react-hooks/exhaustive-deps
  const vergleiche = indikatorenFuer(node.input ?? node.id);
  const aktuell = vergleiche[Math.min(welt, vergleiche.length - 1)];
  const eingang = node.input ? spielWert(world, node.input) : undefined;

  return (
    <section className="erklaerung" aria-label={`Die Mentorin erklärt: ${node.name}`}>
      <header className="erklaerung-kopf">
        <Cameo seed="Defne Arslan" figure="f" glasses size={36} tint="#265a62" />
        <div>
          <strong>Die Mentorin erklärt</strong>
          <span>{node.name}</span>
        </div>
        <div className="reiter" role="tablist">
          {(
            [
              ["erklaert", "Erklärt"],
              ["welt", "Weltvergleich"],
              ["tun", "Was tun?"],
            ] as [Reiter, string][]
          ).map(([id, label]) => (
            <button key={id} role="tab" aria-selected={reiter === id} className={reiter === id ? "on" : ""} onClick={() => setReiter(id)}>
              {label}
            </button>
          ))}
        </div>
      </header>

      {reiter === "erklaert" && (
        <div className="erklaerung-koerper">
          <p className="lead">{e.was[0]}</p>
          {e.stand[0] && (
            <p className="stand">
              <b>Wo steht das Land?</b> {e.stand[0]}
            </p>
          )}
          {mehr && (
            <>
              {e.was.slice(1).map((t, i) => (
                <p key={i}>{t}</p>
              ))}
              {e.stand.slice(1).map((t, i) => (
                <p key={`s${i}`}>{t}</p>
              ))}
              {e.orte && (
                <div className="orte">
                  <div>
                    <span>Am höchsten</span>
                    <ul>
                      {e.orte.hoch.map((o) => (
                        <li key={o.name}>
                          {o.name} <em>{Math.round(o.wert)}</em>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <span>Am niedrigsten</span>
                    <ul>
                      {e.orte.tief.map((o) => (
                        <li key={o.name}>
                          {o.name} <em>{Math.round(o.wert)}</em>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              {e.wirkungen.length > 0 && (
                <>
                  <h4>Warum ist das wichtig?</h4>
                  <ul className="wichtig">
                    {e.wirkungen.map((v) => (
                      <li key={v.id}>
                        <button className="link" onClick={() => onSelect(v.id)}>
                          {v.name}
                        </button>{" "}
                        <span className={v.erhoeht ? "plus" : "minus"}>{v.erhoeht ? "steigt" : "sinkt"}</span> · <em>{v.wann}</em>
                        <span className="warum">{v.warum}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
              {e.begriffe.length > 0 && (
                <details className="begriffe">
                  <summary>Begriffe erklärt ({e.begriffe.length})</summary>
                  <dl>
                    {e.begriffe.map((b) => (
                      <div key={b.begriff}>
                        <dt>{b.begriff}</dt>
                        <dd>{b.text}</dd>
                      </div>
                    ))}
                  </dl>
                </details>
              )}
            </>
          )}
          <button className="link mehr-knopf" onClick={() => setMehr(!mehr)} aria-expanded={mehr}>
            {mehr ? "Weniger anzeigen" : "Mehr erklären"}
          </button>
        </div>
      )}

      {reiter === "welt" && (
        <div className="erklaerung-koerper">
          <p className="lead">Eine Zahl sagt erst im Vergleich etwas. Wie schneidet die Türkei gegenüber anderen Ländern ab?</p>
          {vergleiche.length > 1 && (
            <div className="welt-wahl">
              {vergleiche.map((v, i) => (
                <button key={v.code} className={i === welt ? "on" : ""} onClick={() => setWelt(i)}>
                  {v.ind.name}
                </button>
              ))}
            </div>
          )}
          {aktuell ? (
            <>
              <VergleichBalken code={aktuell.code} spiel={eingang} />
              {!node.input && (
                <p className="welt-hinweis">
                  Im Spiel ist „{node.name}“ ein Index von 0 bis 100. Der Vergleich zeigt die echte Größe dahinter, wie sie zuletzt gemessen wurde; er ändert sich mit deinem Spielstand nicht.
                </p>
              )}
            </>
          ) : (
            <p className="subtitle">
              Für „{node.name}“ hinterlegt das Spiel keinen internationalen Vergleich (Lücke). {node.input === "leitzins" ? "Leitzinsen liegen nicht in der Weltbank-Datenbank; die Bank für Internationalen Zahlungsausgleich veröffentlicht sie." : "Für Wohnen, Mieten und Erdbebenvorsorge fehlt eine vergleichbare internationale Statistik."}
            </p>
          )}
        </div>
      )}

      {reiter === "tun" && (
        <div className="erklaerung-koerper">
          {e.hebel.length > 0 && (
            <>
              <p className="lead">Diese Maßnahmen bewegen „{node.name}“ am stärksten (aus den Verbindungen des Netzes gerechnet):</p>
              <ul className="hebel">
                {e.hebel.map((h) => {
                  const id = /„(.+?)“/.exec(h.text)?.[1];
                  return (
                    <li key={h.text}>
                      <strong>{h.text}</strong>
                      <span>{h.warum}</span>
                      {id && (
                        <button className="link" onClick={() => onSelect(hebelId(id))}>
                          Zur Maßnahme
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </>
          )}
          {e.hebelHinweis && <p>{e.hebelHinweis}</p>}
          {e.treiber.length > 0 && (
            <>
              <h4>Was treibt es an?</h4>
              <ul className="wichtig">
                {e.treiber.map((v) => (
                  <li key={v.id}>
                    <button className="link" onClick={() => onSelect(v.id)}>
                      {v.name}
                    </button>{" "}
                    <span className={v.erhoeht ? "plus" : "minus"}>{v.erhoeht ? "erhöht es" : "senkt es"}</span> · <em>{v.wann}</em>
                    <span className="warum">{v.warum}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </section>
  );
}

import { NET } from "../sim/modell";
function hebelId(name: string): string {
  return NET.nodes.find((n) => n.name === name)?.id ?? "";
}
