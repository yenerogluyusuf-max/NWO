// Die Wählerkoalition, wie in Democracy 4: Wer trägt Sie, wer schwankt, wer ist verloren, warum, wohin würden sie wechseln, und was würde helfen.
// Links die Gruppen mit Stimmung, Trend und Richtung, rechts die gewählte Gruppe im Einzelnen. Alles aus dem Politiknetz gerechnet.

import { useEffect, useMemo, useRef, useState } from "react";
import type { World } from "../sim/types";
import { abwanderung, koalition, schritteFuerZustimmung, type GruppeKurz } from "../sim/waehler-detail";
import { zustimmungsBilanz } from "../sim/waehler";
import { entscheidungsMarken, zustimmungsVerlauf } from "../sim/waehler-verlauf";
import { formatDateDe } from "../sim/dates";
import { GruppenDetail, type DossierZiel } from "./waehler/GruppenDetail";
import { HilfeKarte } from "./waehler/HilfeKarte";
import { Sparkline } from "./waehler/Sparkline";
import { gewichtWort, nf, prozent, vz } from "./waehler/format";
import "./waehler/waehler.css";

const ROLLE_TEXT = { traeger: "Träger", schwankend: "Schwankend", gegner: "Abgewandt" } as const;

function Barometer({ world }: { world: World }) {
  const bilanz = zustimmungsBilanz(world);
  const verlauf = zustimmungsVerlauf(world);
  const marken = entscheidungsMarken(world);
  const groesster = Math.max(1, ...bilanz.posten.map((p) => Math.abs(p.delta)));
  const gut = bilanz.jetzt >= 50;
  return (
    <section className="wa-barometer">
      <div className="wa-baro-zahl">
        <span className="wa-baro-kopf">Wenn heute gewählt würde</span>
        <strong className={gut ? "gut" : "schlecht"}>{nf(bilanz.jetzt, 0)} %</strong>
        <span className="wa-baro-text">
          Zustimmung, nötig sind 50. Die Wahl ist am {formatDateDe(bilanz.wahlDatum)}, in etwa {bilanz.wahlIn} Monaten; die Zahlen zeigen auf {nf(bilanz.tendenz, 0)} %.
        </span>
      </div>
      <div className="wa-baro-linie">
        <Sparkline monate={verlauf.monate} werte={verlauf.werte} marken={marken} ziel={bilanz.tendenz} hoehe={84} beschriftung="Zustimmung im Verlauf" einheit=" %" />
      </div>
      <details className="wa-bilanz">
        <summary>Woher die Zahl kommt, seit dem Amtsantritt</summary>
        <ul>
          {bilanz.posten.map((p) => (
            <li key={p.name}>
              <div className="wa-bilanz-zeile">
                <span>{p.name}</span>
                <span className="wa-bilanz-balken" aria-hidden>
                  <i className={p.delta >= 0 ? "plus" : "minus"} style={{ width: `${(Math.abs(p.delta) / groesster) * 50}%`, [p.delta >= 0 ? "left" : "right"]: "50%" }} />
                </span>
                <strong className={p.delta >= 0 ? "gut" : "schlecht"}>{vz(p.delta)}</strong>
              </div>
              <em>{p.text}</em>
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}

function KoalitionsBalken({ k, waehle, world, onMassnahme }: { k: ReturnType<typeof koalition>; waehle: (id: string) => void; world: World; onMassnahme?: (id: string, richtung: 1 | -1) => void }) {
  const spiel = world.spiel!;
  const signatur = `${world.date.slice(0, 7)}|${Math.floor(spiel.kapital)}|${Object.keys(world.net.targets).length}|${spiel.gesetze.length}`;
  const schritte = useMemo(() => schritteFuerZustimmung(world, 3), [signatur]); // eslint-disable-line react-hooks/exhaustive-deps
  const wanderung = useMemo(() => abwanderung(world), [signatur]); // eslint-disable-line react-hooks/exhaustive-deps
  const anzahl = (r: GruppeKurz["rolle"]) => {
    const n = k.gruppen.filter((g) => g.rolle === r).length;
    return `${n} ${n === 1 ? "Gruppe" : "Gruppen"}`;
  };
  const gruppe = (g: GruppeKurz | null, was: string, satz: (g: GruppeKurz) => string) =>
    g ? (
      <li>
        <b>{was}</b> {satz(g)}
        <button type="button" className="link" onClick={() => waehle(g.id)}>
          {" "}
          Ansehen
        </button>
      </li>
    ) : null;
  return (
    <section className="wa-koalition" aria-label="Ihre Wählerkoalition">
      <h3>Ihre Koalition der Wähler</h3>
      <div className="wa-balken" role="img" aria-label={`Träger ${prozent(k.traeger)}, schwankend ${prozent(k.schwankend)}, abgewandt ${prozent(k.gegner)}`}>
        <span className="rolle-traeger" style={{ flexGrow: k.traeger }} />
        <span className="rolle-schwankend" style={{ flexGrow: k.schwankend }} />
        <span className="rolle-gegner" style={{ flexGrow: k.gegner }} />
      </div>
      <ul className="wa-legende">
        <li className="rolle-traeger">
          <b>{prozent(k.traeger)}</b> tragen Sie <em>({anzahl("traeger")})</em>
        </li>
        <li className="rolle-schwankend">
          <b>{prozent(k.schwankend)}</b> schwanken <em>({anzahl("schwankend")})</em>
        </li>
        <li className="rolle-gegner">
          <b>{prozent(k.gegner)}</b> haben sich abgewandt <em>({anzahl("gegner")})</em>
        </li>
      </ul>
      <ul className="wa-hinweise">
        {gruppe(k.gewinnbar, "Am ehesten zu gewinnen:", (g) => `${g.name}. Läge sie bei 58, brächte das ${nf(g.potenzial, 1)} Punkte Zustimmung.`)}
        {gruppe(k.gefaehrdet, "Am stärksten gefährdet:", (g) => `${g.name} strebt bei den heutigen Verhältnissen nach ${nf(g.ziel, 0)}, jetzt ${nf(g.laune, 0)}.`)}
      </ul>
      {wanderung.anteil >= 0.03 && wanderung.ziele.length > 0 && (
        <div className="wa-wanderung">
          <h4>Wohin Wähler abwandern</h4>
          <p className="wa-unter">
            Bei den heutigen Stimmungen wechselten etwa {prozent(wanderung.anteil)} aller Wähler eher die Seite (Spielparameter, keine Messung). Sie gingen zu den Parteien, deren Forderungen ihnen am meisten nützten:
          </p>
          <ul className="wa-ziele">
            {wanderung.ziele.map((z) => (
              <li key={z.partei}>
                <div className="wa-ziel-kopf">
                  <strong>{z.name}</strong>
                  {z.imLager && <em>in Ihrem Lager</em>}
                  <span>{prozent(z.anteil)} der Abwanderer</span>
                </div>
                <span className="wa-ziel-balken" aria-hidden>
                  <i style={{ width: `${Math.round(z.anteil * 100)}%` }} />
                </span>
                {z.herkunft.length > 0 && <em className="wa-ziel-passt">vor allem aus: {z.herkunft.join(", ")}</em>}
              </li>
            ))}
          </ul>
        </div>
      )}
      {schritte.length > 0 && (
        <details className="wa-schritte">
          <summary>Die wirksamsten Schritte für Ihre Zustimmung bis zur Wahl</summary>
          <p className="wa-unter">Jede Maßnahme, rauf oder runter, um 20 Stufen durchgerechnet, ohne Rückwirkungen über die Wirtschaft (Preise, Schulden); wer dabei gewinnt und wer sich ärgert, steht dabei. Die Vorschau rechnet alles.</p>
          <ul className="wa-hilfen">
            {schritte.map((h) => (
              <HilfeKarte key={`${h.massnahme}${h.richtung}`} h={h} world={world} ziel={null} {...(onMassnahme ? { onMassnahme } : {})} />
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}

function GruppenKarte({ g, aktiv, waehle }: { g: GruppeKurz; aktiv: boolean; waehle: (id: string) => void }) {
  const abstand = g.ziel - g.laune;
  return (
    <li>
      <button type="button" className={`wa-gruppe rolle-${g.rolle}${aktiv ? " on" : ""}`} aria-pressed={aktiv} onClick={() => waehle(g.id)}>
        <span className="wa-g-kopf">
          <strong>{g.name}</strong>
          <span className="wa-g-rolle">{ROLLE_TEXT[g.rolle]}</span>
        </span>
        <span className="wa-g-bar" aria-hidden>
          <i style={{ width: `${Math.max(0, Math.min(100, g.laune))}%` }} />
          <b className="ruhe" />
          {Math.abs(abstand) >= 2 && <u className={abstand < 0 ? "fallend" : "steigend"} style={{ left: `${Math.max(0, Math.min(100, g.ziel))}%` }} title={`Strebt nach ${nf(g.ziel, 0)}`} />}
        </span>
        <span className="wa-g-fuss">
          <span>{gewichtWort(g.anteil)}</span>
          <span className="wa-g-zahl">
            {Math.round(g.laune)}
            {g.trend !== null && Math.abs(g.trend) >= 0.4 && <em className={g.trend > 0 ? "gut" : "schlecht"}> {g.trend > 0 ? "▲" : "▼"} {nf(Math.abs(g.trend))}</em>}
          </span>
        </span>
      </button>
    </li>
  );
}

export function Waehler({ world, onMassnahme, onDossier }: { world: World; onMassnahme?: (id: string, richtung: 1 | -1) => void; onDossier?: (d: DossierZiel) => void }) {
  const spiel = world.spiel;
  const k = useMemo(() => (spiel ? koalition(world) : null), [spiel ? world.date.slice(0, 7) : "", spiel?.gesetze.length, spiel ? Object.keys(world.net.targets).length : 0]); // eslint-disable-line react-hooks/exhaustive-deps
  const [gewaehlt, setGewaehlt] = useState<string | null>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  const erster = useRef(true);
  const standard = k?.gefaehrdet?.id ?? k?.gewinnbar?.id ?? k?.gruppen[0]?.id ?? null;
  const aktuell = gewaehlt ?? standard;
  useEffect(() => {
    // Auf kleinen Bildschirmen liegt die Ansicht unter der Liste: nach der Wahl dorthin springen
    if (erster.current) {
      erster.current = false;
      return;
    }
    if (gewaehlt && window.matchMedia("(max-width: 900px)").matches) detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [gewaehlt]);
  if (!spiel || !k) return <p>Ohne Spielschleife gibt es keine Wählerkoalition.</p>;
  return (
    <div className="waehler wa-root">
      <Barometer world={world} />
      <KoalitionsBalken k={k} waehle={setGewaehlt} world={world} {...(onMassnahme ? { onMassnahme } : {})} />
      <div className="wa-haupt">
        <nav className="wa-liste" aria-label="Wählergruppen">
          <h3>Ihre Wähler</h3>
          <p className="wa-unter">Wählen Sie eine Gruppe. Die Marke im Balken zeigt, wohin ihre Stimmung bei den heutigen Verhältnissen strebt.</p>
          <ul>
            {k.gruppen.map((g) => (
              <GruppenKarte key={g.id} g={g} aktiv={g.id === aktuell} waehle={setGewaehlt} />
            ))}
          </ul>
        </nav>
        <div className="wa-rechts" ref={detailRef}>
          {aktuell && <GruppenDetail key={aktuell} world={world} id={aktuell} {...(onMassnahme ? { onMassnahme } : {})} {...(onDossier ? { onDossier } : {})} />}
        </div>
      </div>
    </div>
  );
}
