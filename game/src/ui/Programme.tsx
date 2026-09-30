// Regierungsprogramme: Ein Plan für Jahre. Jeder Schritt verlangt echte Politik, kostet Kapital und Zeit und wirkt danach dauerhaft.

import { useState } from "react";
import type { World } from "../sim/types";
import { MAX_LAUFEND, PROGRAMME, programmZustand, schrittSicht, starteSchritt, type SchrittSicht } from "../sim/programme";
import { tunWort } from "../data/skalen";
import { NET } from "../sim/modell";

const STATUS_ZEICHEN: Record<SchrittSicht["status"], string> = { gesperrt: "○", offen: "◔", bereit: "●", laufend: "◐", fertig: "✓" };
const STATUS_WORT: Record<SchrittSicht["status"], string> = { gesperrt: "gesperrt", offen: "Voraussetzung fehlt", bereit: "bereit", laufend: "läuft", fertig: "erreicht" };

export function Programme({ world, refresh, onMassnahme }: { world: World; refresh: () => void; onMassnahme?: (id: string, richtung: 1 | -1) => void }) {
  const [antwort, setAntwort] = useState<{ ok: boolean; text: string; why?: string } | null>(null);
  const [offen, setOffen] = useState<string | null>(PROGRAMME[0]!.id);
  if (!world.spiel) return <p>Ohne Spielschleife gibt es keine Programme.</p>;
  const z = programmZustand(world);
  const laufend = z.laufend.map((l) => {
    const p = PROGRAMME.find((x) => x.schritte.some((s) => s.id === l.schritt))!;
    const s = p.schritte.find((x) => x.id === l.schritt)!;
    return { p, s, sicht: schrittSicht(world, s) };
  });
  return (
    <div className="programme">
      <section className="paper">
        <h3>Regierungsprogramme</h3>
        <p className="subtitle">
          Ein Programm ist ein Plan für Jahre. Jeder Schritt verlangt echte Politik (eine Maßnahme auf einer Stufe, ein gelöstes Problem), kostet Kapital und Zeit und wirkt danach dauerhaft. Höchstens {MAX_LAUFEND} Schritte laufen gleichzeitig.
        </p>
        {antwort && (
          <p className={`rueckmeldung ${antwort.ok ? "ok" : "nein"}`} role="status">
            {antwort.text}
            {antwort.why && <em> {antwort.why}</em>}
          </p>
        )}
        {laufend.length > 0 && (
          <div className="prog-laufend">
            <b>Läuft gerade</b>
            {laufend.map(({ p, s, sicht }) => (
              <div key={s.id} className="prog-lauf">
                <span>
                  {s.titel} <em>({p.titel})</em>
                </span>
                <span className="prog-balken" aria-hidden>
                  <i style={{ width: `${Math.round((sicht.lauf ?? 0) * 100)}%` }} />
                </span>
                <span className="prog-rest">noch {sicht.restTage} Tage</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <ul className="prog-liste">
        {PROGRAMME.map((p) => {
          const sichten = p.schritte.map((s) => schrittSicht(world, s));
          const fertig = sichten.filter((x) => x.status === "fertig").length;
          const bereit = sichten.filter((x) => x.status === "bereit").length;
          const auf = offen === p.id;
          return (
            <li key={p.id} className={`prog-karte${fertig === p.schritte.length ? " erfuellt" : ""}`}>
              <button className="prog-kopf" aria-expanded={auf} onClick={() => setOffen(auf ? null : p.id)}>
                <span className="prog-titel">{p.titel}</span>
                <span className="prog-stand">
                  {fertig} von {p.schritte.length}
                  {bereit > 0 && <b className="prog-bereit">{bereit} bereit</b>}
                </span>
                <span className="prog-punkte" aria-hidden>
                  {sichten.map((x) => (
                    <i key={x.schritt.id} className={x.status} />
                  ))}
                </span>
              </button>
              {auf && (
                <div className="prog-koerper">
                  <p className="prog-leitbild">{p.leitbild}</p>
                  <ol className="prog-schritte">
                    {sichten.map((x) => (
                      <li key={x.schritt.id} className={`schritt-${x.status}${x.schritt.vermaechtnis ? " vermaechtnis" : ""}`}>
                        <div className="prog-schritt-kopf">
                          <span className="prog-zeichen" aria-hidden>
                            {STATUS_ZEICHEN[x.status]}
                          </span>
                          <strong>{x.schritt.titel}</strong>
                          <em>{STATUS_WORT[x.status]}</em>
                        </div>
                        <p className="prog-text">{x.schritt.text}</p>
                        {x.status !== "fertig" && (
                          <ul className="prog-bedingungen">
                            {x.fehlt.length > 0 && <li className="offen">Erst: {x.fehlt.join(", ")}</li>}
                            {x.bedingungen
                              .filter((b) => b.bedingung.art !== "keine")
                              .map((b) => (
                                <li key={b.text} className={b.erfuellt ? "ok" : "offen"}>
                                  <span aria-hidden>{b.erfuellt ? "✓" : "○"}</span> {b.text}
                                  {!b.erfuellt && (b.bedingung.art === "massnahme" || b.bedingung.art === "massnahme-max") && (
                                    <button
                                      className="link"
                                      onClick={() => {
                                        const bb = b.bedingung as { id: string };
                                        onMassnahme?.(bb.id, b.bedingung.art === "massnahme" ? 1 : -1);
                                      }}
                                    >
                                      {" "}
                                      {tunWort((b.bedingung as { id: string }).id, b.bedingung.art === "massnahme" ? 1 : -1)}: {NET.nodes[NET.index.get((b.bedingung as { id: string }).id)!]!.name}
                                    </button>
                                  )}
                                </li>
                              ))}
                          </ul>
                        )}
                        <p className="prog-ergebnis">
                          <b>Danach:</b> {x.schritt.ergebnis}
                        </p>
                        {x.status === "bereit" && (
                          <button
                            className="aktion-knopf"
                            disabled={!x.bezahlbar}
                            title={x.bezahlbar ? undefined : "Dafür fehlt Kapital"}
                            onClick={() => {
                              setAntwort(starteSchritt(world, x.schritt.id));
                              refresh();
                            }}
                          >
                            Umsetzen: {Math.round(x.schritt.tage / 30) || 1} {Math.round(x.schritt.tage / 30) <= 1 ? "Monat" : "Monate"} <b>{x.schritt.kapital}</b>
                          </button>
                        )}
                        {x.status === "laufend" && <p className="prog-rest">Noch {x.restTage} Tage.</p>}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
