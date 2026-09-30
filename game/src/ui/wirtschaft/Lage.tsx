// Die Lage: alle Kennzahlen mit Verlauf, jede anklickbar. Die Detailansicht zeigt den Verlauf seit Spielbeginn mit Prognoseband und Marken,
// was die Zahl bewegt, den Vergleich mit anderen Ländern und was man tun kann; jede Handlung führt zu einer Entscheidung.

import { useEffect, useMemo, useState } from "react";
import type { World } from "../../sim/types";
import type { Metric } from "../../sim/forecast";
import { KENNZAHLEN, GRUPPEN, aktuellerWert, bewertung, kennzahl, startWert, wertVorMonaten, type Handlung } from "../../sim/wirtschaft-kennzahlen";
import { alleMarken, startMonat, verlauf } from "../../sim/wirtschaft";
import { stufeVon } from "../../sim/haushalt";
import { formatMonthDe } from "../../sim/dates";
import { VergleichBalken } from "../VergleichBalken";
import { ZUORDNUNG, spielWert } from "../vergleich";
import { Diagramm } from "./Diagramm";
import { berechneReihen } from "./prognose";
import type { PrognoseReihe } from "../../sim/forecast";
import "./wirtschaft.css";

const nf = (x: number, d = 1) => x.toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d });
const zeichen = (x: number) => (x > 0 ? "+" : x < 0 ? "−" : "±");

function Sparkline({ werte }: { werte: number[] }) {
  if (werte.length < 2) return null;
  const w = 50;
  const h = 24;
  const min = Math.min(...werte);
  const max = Math.max(...werte);
  const span = max - min || 1;
  const pts = werte.map((v, i) => `${((i / (werte.length - 1)) * w).toFixed(1)},${(max === min ? h / 2 : h - 3 - ((v - min) / span) * (h - 6)).toFixed(1)}`).join(" ");
  return (
    <svg className="wi-spark" width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden>
      <polyline points={pts} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function Chip({ id, jetzt, davor, label }: { id: string; jetzt: number; davor: number; label: string }) {
  const k = kennzahl(id)!;
  const b = bewertung(k, jetzt, davor);
  if (!Number.isFinite(b.delta)) return null;
  const klasse = b.gut === true ? "wi-gut" : b.gut === false ? "wi-schlecht" : "wi-neutral";
  const stellen = k.stellen === 0 ? 0 : Math.max(1, Math.min(2, k.stellen));
  return (
    <span className={`wi-chip ${klasse}`} title={b.gut === null ? "Keine klare Wertung" : b.gut ? "Besser als zuvor" : "Schlechter als zuvor"}>
      {label} {b.delta > 0 ? "▲" : b.delta < 0 ? "▼" : "◆"} {zeichen(b.delta)}
      {nf(Math.abs(b.delta), stellen)}
    </span>
  );
}

/** In schmalen Mappen steht das Detail unter der Liste: Nach der Wahl springt die Ansicht dorthin. */
function zumDetail() {
  const lage = document.querySelector<HTMLElement>(".wi-lage");
  if (lage && lage.clientWidth < 590) requestAnimationFrame(() => document.getElementById("wi-detail")?.scrollIntoView({ behavior: "smooth", block: "start" }));
}

export function Lage({ world, onHandlung }: { world: World; onHandlung: (h: Handlung) => void }) {
  const [gewaehlt, setGewaehlt] = useState("inflation");
  const [vorschau, setVorschau] = useState<Handlung | null>(null);
  const k = kennzahl(gewaehlt)!;

  const [reihe, setReihe] = useState<PrognoseReihe | null>(null);
  const [rechnet, setRechnet] = useState(false);
  const stand = Math.floor(world.day / 30);

  // Die Prognose rechnet im Hintergrund und gilt für den Stand, an dem sie angefordert wurde
  useEffect(() => {
    if (!k.prognose) {
      setReihe(null);
      return;
    }
    let aktiv = true;
    setRechnet(true);
    const metrik = k.prognose as Metric;
    const aktion = vorschau?.posten && vorschau.stufe !== undefined ? ({ art: "posten", id: vorschau.posten, stufe: stufeVon(world, vorschau.posten) + vorschau.stufe } as const) : null;
    berechneReihen(world, aktion, [metrik], 12, 8)
      .then((r) => {
        if (!aktiv) return;
        setReihe(r[0] ?? null);
        setRechnet(false);
      })
      .catch(() => aktiv && setRechnet(false));
    return () => {
      aktiv = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gewaehlt, vorschau, stand]);

  const punkte = verlauf(world, gewaehlt);
  const jetzt = aktuellerWert(world, gewaehlt);
  const start = startWert(world, gewaehlt);
  const vor12 = wertVorMonaten(world, gewaehlt, 12);
  const treiber = k.treiber(world);
  const maxT = Math.max(0.0001, ...treiber.zeilen.map((z) => Math.abs(z.wirkung)));
  const marken = useMemo(() => alleMarken(world), [world, world.day]);
  const letzteMarken = [...marken].reverse().slice(0, 5);
  const zuletzt = punkte.filter((p) => !p.jetzt).slice(-24).map((p) => p.wert);

  const band = reihe ? { ohne: reihe.ohne, ...(reihe.mit.length ? { mit: reihe.mit, mitName: `Mit: ${vorschau?.label ?? "Vorhaben"}` } : {}) } : undefined;

  return (
    <div className="wi-lage">
      <nav className="wi-liste" aria-label="Kennzahlen">
        {GRUPPEN.map((gruppe) => (
          <section key={gruppe}>
            <h4>{gruppe}</h4>
            <ul>
              {KENNZAHLEN.filter((x) => x.gruppe === gruppe).map((x) => {
                const w = aktuellerWert(world, x.id);
                const s = startWert(world, x.id);
                const b = bewertung(x, w, s);
                return (
                  <li key={x.id}>
                    <button className={`wi-zeile${x.id === gewaehlt ? " on" : ""}`} aria-pressed={x.id === gewaehlt} onClick={() => { setGewaehlt(x.id); setVorschau(null); zumDetail(); }}>
                      <span className="wi-zeile-name">{x.name}</span>
                      <span className="wi-zeile-wert">
                        {nf(w, x.stellen)}
                        <small>{x.einheit === "Indexpunkte" ? "" : x.einheit}</small>
                      </span>
                      <span className={`wi-zeile-spark ${b.gut === true ? "wi-gut" : b.gut === false ? "wi-schlecht" : "wi-neutral"}`}>
                        <Sparkline werte={verlauf(world, x.id).slice(-24).map((p) => p.wert)} />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </nav>

      <article className="wi-detail" id="wi-detail" aria-live="polite">
        <button className="link wi-zurueck" onClick={() => document.querySelector(".wi-liste")?.scrollIntoView({ behavior: "smooth", block: "start" })}>
          ↑ Alle Kennzahlen
        </button>
        <header>
          <p className="kicker">{k.gruppe}</p>
          <h3>{k.name}</h3>
          <div className="wi-kopf">
            <strong className="wi-gross">
              {nf(jetzt, k.stellen)} <small>{k.einheit === "Indexpunkte" ? "Indexpunkte" : k.einheit}</small>
            </strong>
            <span className="wi-chips">
              <Chip id={k.id} jetzt={jetzt} davor={start} label="seit Amtsantritt" />
              <Chip id={k.id} jetzt={jetzt} davor={vor12} label="zum Vorjahr" />
            </span>
          </div>
          <p className="wi-gemessen">{k.gemessen(world)}</p>
        </header>

        <Diagramm
          punkte={punkte}
          startMonat={startMonat(world)}
          jetztMonat={world.date.slice(0, 7)}
          band={band}
          linien={k.linien?.(world)}
          marken={marken}
          stellen={k.stellen}
          einheit={k.einheit}
          name={k.name}
          rechnet={rechnet}
        />

        <p className="wi-erklaerung">{k.erklaerung}</p>

        <section className="wi-block">
          <h4>Was bewegt diese Zahl?</h4>
          {treiber.kopf && <p className="wi-hinweis">{treiber.kopf}</p>}
          {treiber.zeilen.length === 0 ? (
            <p className="wi-hinweis">Im Moment wirkt nichts Nennenswertes auf diese Größe: Sie steht in ihrer Ruhelage. Erst Ihre Entscheidungen und Ereignisse bringen Bewegung.</p>
          ) : (
            <ul className="wi-treiber">
              {treiber.zeilen.map((z) => (
                <li key={z.name}>
                  <span className="wi-treiber-name">{z.name}</span>
                  <span className="wi-balken" aria-hidden>
                    <i className={z.wirkung >= 0 ? "wi-hoch" : "wi-runter"} style={{ width: `${Math.max(3, (Math.abs(z.wirkung) / maxT) * 50)}%`, [z.wirkung >= 0 ? "left" : "right"]: "50%" }} />
                  </span>
                  <span className="wi-treiber-wert">
                    {z.wirkung >= 0 ? "+" : "−"}
                    {nf(Math.abs(z.wirkung), Math.abs(z.wirkung) >= 10 ? 0 : 2)} <small>{z.einheit}</small>
                  </span>
                  <small className="wi-treiber-text">{z.text}</small>
                </li>
              ))}
            </ul>
          )}
        </section>

        {k.vergleichId && ZUORDNUNG[k.vergleichId] && (
          <section className="wi-block">
            <h4>Im Vergleich mit anderen Ländern</h4>
            <VergleichBalken code={ZUORDNUNG[k.vergleichId]![0]!} spiel={spielWert(world, k.vergleichId)} />
          </section>
        )}
        {k.id === "leitzins" && <p className="wi-hinweis">Leitzinsen anderer Länder liegen nicht in der Weltbank-Datenbank (Lücke); die Bank für Internationalen Zahlungsausgleich veröffentlicht sie.</p>}

        <section className="wi-block">
          <h4>Was Sie tun können</h4>
          <ul className="wi-handlungen">
            {k.handlungen.map((h) => (
              <li key={h.label}>
                <button className="wi-handlung" onClick={() => onHandlung(h)}>
                  {h.label} <span aria-hidden>→</span>
                </button>
                {h.posten && h.stufe !== undefined && k.prognose && (
                  <button className={`wi-wenn${vorschau?.label === h.label ? " on" : ""}`} aria-pressed={vorschau?.label === h.label} onClick={() => setVorschau(vorschau?.label === h.label ? null : h)}>
                    {vorschau?.label === h.label ? "Vorschau aus" : "Was wäre, wenn?"}
                  </button>
                )}
              </li>
            ))}
          </ul>
          {vorschau && <p className="wi-hinweis">Das Diagramm zeigt die Prognose mit dieser Änderung (rot) gegen „nichts tun“ (petrol). Die Bandbreite zeigt, wie unsicher das ist.</p>}
        </section>

        {letzteMarken.length > 0 && (
          <section className="wi-block">
            <h4>Was zuletzt passiert ist</h4>
            <ul className="wi-marken">
              {letzteMarken.map((m, i) => (
                <li key={i}>
                  <span className="wi-wann">{formatMonthDe(m.monat)}</span> {m.text}
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>
    </div>
  );
}
