// Der Haushalt als Entscheidung: der Plan für 2026 mit belegten Zahlen, die Regler des Nachtragshaushalts mit Vorschau (Kapital, Defizit, Folgen
// über zwölf Monate) und die bisherigen Änderungen. Jede Änderung wirkt auf Nachfrage, Defizit, Schulden und die Politikfelder des Netzes.

import { useEffect, useMemo, useState } from "react";
import type { World } from "../../sim/types";
import type { Aktion, Metric, PrognoseReihe } from "../../sim/forecast";
import { impulsKette } from "../../sim/folgen";
import { formatDateDe } from "../../sim/dates";
import { KENNZAHLEN_NACH_ID, aktuellerWert, bewertung, startWert } from "../../sim/wirtschaft-kennzahlen";
import { alleMarken, defizitJetzt, haushaltZustand, startMonat, verlauf, zinsausgabenJetzt } from "../../sim/wirtschaft";
import { POSTEN, impulsAusPosten, mrdJeStufe, postenVorschau, setzePosten, stufeVon, type PostenDef } from "../../sim/haushalt";
import { AUSGABEN_2026, PLAN_2026, STEUERN_2026 } from "../../data/haushaltsplan";
import { Diagramm } from "./Diagramm";
import { Folgen } from "./Folgen";
import { Bestaetigung } from "./Bestaetigung";
import { Wirkung } from "./Wirkung";
import { berechneReihen } from "./prognose";
import "./wirtschaft.css";

const nf = (x: number, d = 1) => x.toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d });
const mrdText = (x: number) => Math.round(x).toLocaleString("de-DE");
const bio = (mrd: number) => `${(mrd / 1000).toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} Bio.`;
const STUFEN = [-2, -1, 0, 1, 2];
const vz = (x: number) => (x > 0 ? `+${x}` : x < 0 ? `−${Math.abs(x)}` : "0");

const METRIKEN: { id: Metric; kennzahl: string; label: string }[] = [
  { id: "defizit", kennzahl: "defizit", label: "Defizit" },
  { id: "debtRatio", kennzahl: "schulden", label: "Schulden" },
  { id: "growth", kennzahl: "wachstum", label: "Wachstum" },
  { id: "inflation", kennzahl: "inflation", label: "Inflation" },
  { id: "unemployment", kennzahl: "arbeitslosigkeit", label: "Arbeitslosigkeit" },
  { id: "riskPremium", kennzahl: "risiko", label: "Risikoaufschlag" },
];

/** Welche Zeile des Haushaltsplans ein Posten trifft und wie stark (Anteil der Änderung). */
const PLAN_ZEILEN: Record<string, { zeile: string; anteil: number }[]> = {
  soziales: [{ zeile: "uebertragungen", anteil: 1 }],
  personal: [{ zeile: "personal", anteil: 1 }],
  investitionen: [{ zeile: "investitionen", anteil: 1 }],
  einkommensteuer: [{ zeile: "est", anteil: 1 }],
  verbrauchsteuern: [
    { zeile: "mwst", anteil: 0.58 },
    { zeile: "oetv", anteil: 0.42 },
  ],
  unternehmensteuer: [{ zeile: "kst", anteil: 1 }],
};

function Kennziffer({ world, id }: { world: World; id: string }) {
  const k = KENNZAHLEN_NACH_ID[id]!;
  const jetzt = aktuellerWert(world, id);
  const b = bewertung(k, jetzt, startWert(world, id));
  return (
    <div className="wi-kennziffer">
      <dt>{k.name}</dt>
      <dd>
        {nf(jetzt, k.stellen)} <small>{k.einheit}</small>
      </dd>
      {Number.isFinite(b.delta) && Math.abs(b.delta) >= 0.05 && (
        <span className={`wi-chip ${b.gut === true ? "wi-gut" : b.gut === false ? "wi-schlecht" : "wi-neutral"}`}>
          seit Start {b.delta > 0 ? "▲" : "▼"} {nf(Math.abs(b.delta), k.stellen === 0 ? 0 : 1)}
        </span>
      )}
    </div>
  );
}

function Regler({ p, stufe, entwurf, onWahl }: { p: PostenDef; stufe: number; entwurf: number | null; onWahl: (s: number) => void }) {
  const [links, rechts] = p.seite === "ausgabe" ? ["kürzen", "ausbauen"] : ["senken", "anheben"];
  return (
    <div className="wi-regler" role="radiogroup" aria-label={`${p.name}: Stufe`}>
      <span className="wi-regler-seite">{links}</span>
      {STUFEN.map((s) => (
        <button key={s} role="radio" aria-checked={(entwurf ?? stufe) === s} className={`wi-stufe-knopf${stufe === s ? " ist" : ""}${entwurf === s && entwurf !== stufe ? " entwurf" : ""}`} onClick={() => onWahl(s)} title={s === stufe ? "Jetzt" : `Auf Stufe ${vz(s)} stellen`}>
          {vz(s)}
        </button>
      ))}
      <span className="wi-regler-seite">{rechts}</span>
    </div>
  );
}

export function Haushalt({ world, geaendert, posten }: { world: World; geaendert: () => void; posten?: string | undefined }) {
  const z = haushaltZustand(world);
  const [sel, setSel] = useState<string | null>(posten ?? null);
  const [entwurf, setEntwurf] = useState<number | null>(posten ? Math.max(-2, Math.min(2, stufeVon(world, posten) + 1)) : null);
  const [bestaetigt, setBestaetigt] = useState(false);
  const [rueck, setRueck] = useState<{ ok: boolean; text: string; why?: string | undefined } | null>(null);
  const [metrik, setMetrik] = useState<Metric>("defizit");
  const [reihen, setReihen] = useState<PrognoseReihe[] | null>(null);
  const [rechnet, setRechnet] = useState(false);
  const [offen, setOffen] = useState<number | null>(null);
  const stand = Math.floor(world.day / 30);
  const p = sel ? POSTEN.find((x) => x.id === sel) : undefined;
  const v = p && entwurf !== null ? postenVorschau(world, p.id, entwurf) : null;

  useEffect(() => {
    if (!p || entwurf === null || entwurf === stufeVon(world, p.id)) {
      setReihen(null);
      return;
    }
    let aktiv = true;
    setRechnet(true);
    const aktion: Aktion = { art: "posten", id: p.id, stufe: entwurf };
    berechneReihen(world, aktion, METRIKEN.map((m) => m.id), 12, 8)
      .then((r) => {
        if (!aktiv) return;
        setReihen(r);
        setRechnet(false);
      })
      .catch(() => aktiv && setRechnet(false));
    return () => {
      aktiv = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel, entwurf, stand]);

  useEffect(() => {
    if (posten) document.getElementById("wi-hh-regler")?.scrollIntoView({ block: "start" });
  }, [posten]);

  // Der Plan mit den eigenen Änderungen: Milliarden Lira je Zeile
  const aenderung = useMemo(() => {
    const m: Record<string, number> = {};
    for (const q of POSTEN) {
      const s = z.stufen[q.id] ?? 0;
      if (!s) continue;
      for (const t of PLAN_ZEILEN[q.id] ?? []) m[t.zeile] = (m[t.zeile] ?? 0) + s * mrdJeStufe(q) * t.anteil;
    }
    return m;
  }, [z.stufen]);
  const zinsenJetzt = zinsausgabenJetzt(world) * PLAN_2026.mrdProProzentBip;
  const maxAus = Math.max(...AUSGABEN_2026.map((x) => x.mrd));
  const maxSt = Math.max(...STEUERN_2026.map((x) => x.mrd));

  const r = reihen?.find((x) => x.metric === metrik);
  const mk = METRIKEN.find((m) => m.id === metrik)!;
  const k = KENNZAHLEN_NACH_ID[mk.kennzahl]!;
  const band = r ? { ohne: r.ohne, ...(r.mit.length ? { mit: r.mit, mitName: `Mit: ${p?.name ?? "Änderung"}` } : {}) } : undefined;

  function beschliesse() {
    if (!p || entwurf === null) return;
    const res = setzePosten(world, p.id, entwurf);
    setRueck(res);
    setBestaetigt(false);
    if (res.ok) {
      setEntwurf(null);
      setSel(null);
    }
    geaendert();
  }

  const vorschauBlock = (
    p && v && entwurf !== null && entwurf !== stufeVon(world, p.id) && (
      <div className="wi-hh-vorschau" aria-live="polite">
        <h4>
          {p.name}: Stufe {vz(stufeVon(world, p.id))} auf {vz(entwurf)}
        </h4>
        <dl className="wi-zahlen">
          <div>
            <dt>Kapital</dt>
            <dd>{v.kapital}</dd>
          </div>
          <div>
            <dt>Defizit</dt>
            <dd>
              {nf(v.defizitVorher, 2)} → {nf(v.defizitNachher, 2)} %
            </dd>
          </div>
          <div>
            <dt>Ausgabenimpuls</dt>
            <dd>
              {v.impuls >= 0 ? "+" : "−"}
              {nf(Math.abs(v.impuls), 2)} % des BIP
            </dd>
          </div>
          <div>
            <dt>Jahr</dt>
            <dd>
              {v.delta > 0 ? "+" : "−"}
              {mrdText(Math.abs(v.delta) * mrdJeStufe(p))} Mrd. Lira
            </dd>
          </div>
        </dl>
        <div className="wi-verteilung">
          <span>
            <b>Gewinner:</b> {p.gewinner}
          </span>
          <span>
            <b>Verlierer:</b> {p.verlierer}
          </span>
        </div>
        <p className="wi-kehrseite">
          <b>Kehrseite:</b> {p.kehrseite}
        </p>
        <Folgen titel="Was danach kommt" glieder={impulsKette(v.impuls)} />
        <h4>Dauerhaft im Politiknetz</h4>
        <div className="wi-dauer">
          {v.zeilen.map((x) => (
            <span key={x.text} className={`wi-chip ${x.gut === true ? "wi-gut" : x.gut === false ? "wi-schlecht" : "wi-neutral"}`}>
              {x.richtung > 0 ? "▲" : "▼"} {x.text}
            </span>
          ))}
        </div>
        <Wirkung reihen={reihen} metriken={METRIKEN} rechnet={rechnet} />
        <div className="wi-metriken" role="tablist" aria-label="Größe der Vorschau">
          {METRIKEN.map((m) => (
            <button key={m.id} role="tab" aria-selected={metrik === m.id} className={metrik === m.id ? "on" : ""} onClick={() => setMetrik(m.id)}>
              {m.label}
            </button>
          ))}
        </div>
        <Diagramm punkte={verlauf(world, mk.kennzahl)} startMonat={startMonat(world)} jetztMonat={world.date.slice(0, 7)} band={band} linien={k.linien?.(world)} marken={alleMarken(world).filter((m) => m.art === "haushalt" || m.art === "zins")} stellen={k.stellen} einheit={k.einheit} name={k.name} rechnet={rechnet} />
        {!v.ok && v.grund && <p className="wi-grund">{v.grund}</p>}
        {bestaetigt ? (
          <Bestaetigung name={world.player?.name ?? ""} titel={`Nachtragshaushalt: ${p.name}`} knopf="Beschließen" onJa={beschliesse} onNein={() => setBestaetigt(false)}>
            <p>
              {p.name} von Stufe {vz(stufeVon(world, p.id))} auf {vz(entwurf)}. Das kostet {v.kapital} Kapital und verändert das Defizit von {nf(v.defizitVorher, 2)} auf {nf(v.defizitNachher, 2)} % des BIP.
            </p>
          </Bestaetigung>
        ) : (
          <button className="wi-handlung wi-haupt" disabled={!v.ok} onClick={() => setBestaetigt(true)}>
            Nachtragshaushalt beschließen ({v.kapital} Kapital) <span aria-hidden>→</span>
          </button>
        )}
        <button className="link" onClick={() => { setSel(null); setEntwurf(null); }}>
          Verwerfen
        </button>
      </div>
    )
  );

  return (
    <div className="wi-hh">
      {rueck && (
        <p className={`rueckmeldung ${rueck.ok ? "ok" : "nein"} wi-rueck`} role="status">
          {rueck.text}
          {rueck.why && <em> {rueck.why}</em>}
        </p>
      )}

      <section className="wi-karte">
        <p className="kicker">Der Haushalt</p>
        <h3>Wie der Staat wirtschaftet</h3>
        <dl className="wi-kennziffern">
          <Kennziffer world={world} id="defizit" />
          <Kennziffer world={world} id="schulden" />
          <Kennziffer world={world} id="zinsausgaben" />
          <Kennziffer world={world} id="risiko" />
        </dl>
        <p className="wi-hinweis">
          Das Defizit setzt sich zusammen aus der Grundlinie des Haushaltsgesetzes ({nf(world.economy.deficit)} %), Ihrem Ausgabenimpuls ({nf(world.economy.fiscalImpulse)} % des BIP: {nf(impulsAusPosten(world))} aus den Reglern unten, der Rest aus Beschlüssen und Ereignissen), den Kosten der beschlossenen Maßnahmen ({nf(world.economy.policyCost, 2)} %) und dem Mehr- oder Minderzins auf die Schuld ({nf(world.economy.zinsMehrlast ?? 0, 2)} %): zusammen <b>{nf(defizitJetzt(world), 2)} % des BIP</b>. Der Zinsdienst folgt den Marktzinsen nur langsam: Ein Zinsentscheid der Bank kommt beim Staat erst über Jahre an.
        </p>
      </section>

      <section className="wi-karte" id="wi-hh-plan">
        <p className="kicker">Der Haushaltsplan 2026</p>
        <h3>
          {bio(PLAN_2026.ausgabenGesamt)} Lira Ausgaben, {bio(PLAN_2026.einnahmenGesamt)} Einnahmen
        </h3>
        <p className="wi-hinweis">
          Das Haushaltsgesetz der Zentralregierung; das geplante Defizit beträgt rund {bio(PLAN_2026.defizit)} Lira ({nf(PLAN_2026.defizitProzentBip)} % des BIP). In der Spalte „Ihre Änderung“ steht, was Ihre Regler daraus machen, in Milliarden Lira im Jahr (Größenordnung).
        </p>
        <div className="wi-plan">
          <div>
            <h4>Ausgaben (Mrd. Lira)</h4>
            <ul className="wi-plan-liste">
              {AUSGABEN_2026.map((x) => {
                const live = x.id === "zinsen" ? zinsenJetzt - x.mrd : aenderung[x.id] ?? 0;
                return (
                  <li key={x.id} title={x.text}>
                    <span className="wi-plan-name">{x.name}</span>
                    <span className="wi-plan-balken" aria-hidden>
                      <i style={{ width: `${(x.mrd / maxAus) * 100}%` }} />
                    </span>
                    <span className="wi-plan-wert">{mrdText(x.mrd)}</span>
                    <span className={`wi-plan-live ${live > 5 ? "wi-mehr" : live < -5 ? "wi-weniger" : ""}`}>{Math.abs(live) >= 5 ? `${live > 0 ? "+" : "−"}${mrdText(Math.abs(live))}` : ""}</span>
                  </li>
                );
              })}
            </ul>
          </div>
          <div>
            <h4>Steuern (Mrd. Lira)</h4>
            <ul className="wi-plan-liste">
              {STEUERN_2026.map((x) => {
                const live = aenderung[x.id] ?? 0;
                return (
                  <li key={x.id} title={x.text}>
                    <span className="wi-plan-name">{x.name}</span>
                    <span className="wi-plan-balken" aria-hidden>
                      <i className="wi-steuer" style={{ width: `${(x.mrd / maxSt) * 100}%` }} />
                    </span>
                    <span className="wi-plan-wert">{mrdText(x.mrd)}</span>
                    <span className={`wi-plan-live ${live > 5 ? "wi-weniger" : live < -5 ? "wi-mehr" : ""}`}>{Math.abs(live) >= 5 ? `${live > 0 ? "+" : "−"}${mrdText(Math.abs(live))}` : ""}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
        <p className="wi-quelle">
          Quellen:{" "}
          {PLAN_2026.quellen.map((q, i) => (
            <span key={q.url}>
              {i > 0 && "; "}
              <a href={q.url} target="_blank" rel="noreferrer">
                {q.name}
              </a>
            </span>
          ))}
          . {PLAN_2026.hinweis} Die Zinsausgaben zeigen den Stand im Spiel ({nf(zinsausgabenJetzt(world))} % des BIP).
        </p>
      </section>

      <section className="wi-karte" id="wi-hh-regler">
        <p className="kicker">Nachtragshaushalt</p>
        <h3>Die Regler</h3>
        <p className="wi-hinweis">
          Jeder Posten hat fünf Stufen; eine Stufe entspricht etwa {nf(POSTEN[0]!.schritt)} % des BIP ({mrdText(mrdJeStufe(POSTEN[0]!))} Mrd. Lira) bei Ausgaben, {nf(POSTEN[6]!.schritt)} % ({mrdText(mrdJeStufe(POSTEN[6]!))} Mrd.) bei Steuern. Jede Änderung kostet Kapital, in die unbeliebte Richtung doppelt. Wählen Sie eine Stufe: Die Vorschau zeigt vorher, was daraus wird.
        </p>
        <ul className="wi-posten">
          {POSTEN.map((q) => {
            const st = stufeVon(world, q.id);
            const aktiv = sel === q.id;
            return (
              <li key={q.id} className={`wi-posten-zeile${aktiv ? " on" : ""}`}>
                <div className="wi-posten-kopf">
                  <b>{q.name}</b>
                  <span className="wi-posten-art">{q.seite === "ausgabe" ? "Ausgabe" : "Einnahme"}</span>
                </div>
                <span className="wi-posten-text">{q.text}</span>
                <Regler
                  p={q}
                  stufe={st}
                  entwurf={aktiv ? entwurf : null}
                  onWahl={(s) => {
                    setSel(q.id);
                    setEntwurf(s);
                    setBestaetigt(false);
                  }}
                />
                {st !== 0 && (
                  <span className="wi-posten-stand">
                    Jetzt auf Stufe {vz(st)}: etwa {st > 0 ? "+" : "−"}
                    {mrdText(Math.abs(st) * mrdJeStufe(q))} Mrd. Lira im Jahr.
                  </span>
                )}
                {aktiv && vorschauBlock}
              </li>
            );
          })}
        </ul>

      </section>

      <section className="wi-karte">
        <p className="kicker">Der Haushalt im Oktober</p>
        <h3>Was jedes Jahr kommt</h3>
        <p className="wi-hinweis">Im Oktober legt der Finanzminister den Haushaltsentwurf für das nächste Jahr vor. Sie entscheiden, ob konsolidiert, fortgeschrieben oder investiert wird; das setzt mehrere Regler auf einmal und wirkt wie ein Nachtragshaushalt.</p>
      </section>

      <section className="wi-karte">
        <p className="kicker">Bisherige Änderungen</p>
        <h3>Was Sie beschlossen haben</h3>
        {z.aenderungen.length === 0 ? (
          <p className="wi-hinweis">Noch keine Änderung am Haushalt.</p>
        ) : (
          <ul className="wi-sitzungen">
            {[...z.aenderungen].reverse().map((a, i) => (
              <li key={a.tag + a.posten}>
                <button className="wi-sitzung" aria-expanded={offen === i} onClick={() => setOffen(offen === i ? null : i)}>
                  <span className="wi-wann">{formatDateDe(a.datum)}</span>
                  <span className="wi-beschluss-gross">{a.text}</span>
                </button>
                {offen === i && (
                  <div className="wi-sitzung-text">
                    <h4>Was danach kommt</h4>
                    <ul>
                      {a.folgen.map((f, n) => (
                        <li key={n}>{f}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
