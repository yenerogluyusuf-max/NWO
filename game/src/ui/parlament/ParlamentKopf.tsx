// Kopf des Parlament-Fensters: Halbrund mit Mehrheitslinie, Fraktionsliste, erwartetes Abstimmungsverhalten je Gesetz und die letzten Abstimmungen.

import { useEffect, useRef, useState } from "react";
import type { World } from "../../sim/types";
import { REGELN, stimmenSicht } from "../../sim/handeln";
import { formatDateDe } from "../../sim/dates";
import { parlamentsLage, ROLLEN_WORT } from "./lage";
import { amAnsichtBeobachten, letzteAbstimmungen, spieleAbstimmungAb } from "./abstimmung";
import { FARBEN_PAPIER, Sitzplan, zustandFarbe } from "./Halbrund";
import { verteileErwartung, vorgabeFuer, zaehleZustaende, zustandJeSitz, ZUSTAENDE, type Zustand } from "./stimmen";
import "./parlament.css";

const ZUSTAND_KURZ: Record<Zustand, string> = { fest: "Lager", zusage: "Zusage", wackelig: "wackelig", offen: "offen", nein: "Nein" };
const ZUSTAND_HILFE: Record<Zustand, string> = {
  fest: "Sitze des eigenen Lagers: stimmen mit Ja",
  zusage: "Duldung, Sachbündnis oder gekaufte Absprache",
  wackelig: "Übertritte aus der Opposition, die vom Ansehen des Präsidenten abhängen",
  offen: "Liegt in der Spanne der Schätzung: kann kippen",
  nein: "Stimmen mit Nein",
};
const zahl = (x: number) => x.toLocaleString("de-DE");

export function ParlamentKopf({ world }: { world: World }) {
  // Das Parlament ändert sich durch Verhandlungen mitten am Tag; die Rechnung ist klein, deshalb ohne Zwischenspeicher
  const lage = parlamentsLage(world);
  const [ansicht, setAnsicht] = useState<string>("sitze");
  const [hervor, setHervor] = useState<string | null>(null);
  const kopf = useRef<HTMLElement>(null);
  useEffect(
    () =>
      amAnsichtBeobachten((id) => {
        setAnsicht(id);
        kopf.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }),
    [],
  );
  const gesetze = world.spiel?.gesetze ?? [];
  // Ein Gesetz, über das schon abgestimmt wurde, fällt zurück auf die Sitzverteilung
  const g = gesetze.find((x) => x.id === ansicht) ?? null;
  const erwartung = g !== null;
  let berechnet: { vorgabe: ReturnType<typeof vorgabeFuer>; z: ReturnType<typeof verteileErwartung>; sitze: Zustand[]; zahlen: Record<Zustand, number> } | null = null;
  if (lage && erwartung) {
    const vorgabe = vorgabeFuer(world, g);
    const z = verteileErwartung(lage, vorgabe);
    berechnet = { vorgabe, z, sitze: zustandJeSitz(lage, z), zahlen: zaehleZustaende(z) };
  }
  if (!lage) return null;

  const sicht = stimmenSicht(world);
  const ja = g && berechnet ? berechnet.vorgabe.erwartet + g.absprachen : (berechnet?.vorgabe.erwartet ?? sicht.erwartet);
  const fehlt = REGELN.mehrheit - (lage.lager + lage.duldung);
  const letzte = letzteAbstimmungen(world, 5);
  const zusatz = g?.absprachen ?? 0;
  const spanneVon = (berechnet?.vorgabe.niedrig ?? sicht.low) + zusatz;
  const spanneBis = (berechnet?.vorgabe.hoch ?? sicht.high) + zusatz;
  const jaSumme = berechnet ? berechnet.zahlen.fest + berechnet.zahlen.zusage + berechnet.zahlen.wackelig : 0;

  return (
    <section ref={kopf} className="paper par-kopf">
      <h3>Das Parlament</h3>
      <p className="subtitle">
        {zahl(lage.gesamt)} Sitze. Gesetze brauchen {REGELN.mehrheit} Stimmen, Verfassungsänderungen 360 mit Volksabstimmung oder 400 ohne.
      </p>

      {gesetze.length > 0 && (
        <div className="par-ansicht" role="tablist" aria-label="Ansicht des Halbrunds">
          <button role="tab" aria-selected={!g} className={`aktion-knopf${!g ? " on" : ""}`} onClick={() => setAnsicht("sitze")}>
            Sitzverteilung
          </button>
          {gesetze.map((x) => (
            <button key={x.id} role="tab" aria-selected={g?.id === x.id} className={`aktion-knopf${g?.id === x.id ? " on" : ""}`} onClick={() => setAnsicht(x.id)} title="So wird die Abstimmung nach heutigem Stand ausgehen">
              {x.name}
            </button>
          ))}
        </div>
      )}

      <Sitzplan
        lage={lage}
        modus={erwartung ? "erwartung" : "partei"}
        {...(berechnet ? { zustand: berechnet.sitze } : {})}
        hervor={hervor}
        farben={FARBEN_PAPIER}
        onHover={setHervor}
        aria={
          erwartung
            ? `Erwartetes Abstimmungsverhalten: ${zahl(ja)} Ja-Stimmen bei ${REGELN.mehrheit} nötigen`
            : `Sitzverteilung: ${lage.fraktionen.map((f) => `${f.name} ${f.sitze}`).join(", ")}`
        }
        mitte={
          erwartung ? (
            <div className="par-mitte-inhalt">
              <strong className={ja >= REGELN.mehrheit ? "gut" : "schlecht"}>{zahl(ja)}</strong>
              <span>
                Ja erwartet
                <em>Spanne {spanneVon}–{spanneBis}</em>
              </span>
            </div>
          ) : (
            <div className="par-mitte-inhalt">
              <strong>{zahl(lage.lager)}</strong>
              <span>{fehlt > 0 ? `es fehlen ${fehlt}` : lage.lager < REGELN.mehrheit ? `mit Duldung ${lage.lager + lage.duldung}` : lage.hatLager ? "Regierungsmehrheit" : "eigene Mehrheit"}</span>
            </div>
          )
        }
      />

      {erwartung && berechnet ? (
        <ul className="par-zustaende" aria-label="Erwartetes Abstimmungsverhalten">
          {ZUSTAENDE.map((k) => (
            <li key={k} title={ZUSTAND_HILFE[k]}>
              <i style={{ background: zustandFarbe(FARBEN_PAPIER, k) }} />
              <span>{ZUSTAND_KURZ[k]}</span>
              <b>{zahl(berechnet.zahlen[k])}</b>
            </li>
          ))}
        </ul>
      ) : null}
      {erwartung && berechnet && (
        <p className="par-lesart">
          {g ? `„${g.name}“: ` : ""}
          {ja >= REGELN.mehrheit ? `Nach heutigem Stand stimmen etwa ${zahl(jaSumme)} Abgeordnete mit Ja, die Mehrheit von ${REGELN.mehrheit} steht.` : `Nach heutigem Stand fehlen etwa ${REGELN.mehrheit - ja} Stimmen zur Mehrheit.`}
          {berechnet.vorgabe.sachParteien.length > 0 ? ` ${berechnet.vorgabe.sachParteien.join(" und ")} stimmt mit, weil das Gesetz die eigene Forderung erfüllt.` : ""}
        </p>
      )}

      <div className="par-bilanz" aria-label="Lager, Duldung und Opposition">
        <div className="par-lager-balken" aria-hidden="true">
          <i className="lager" style={{ width: `${(lage.lager / lage.gesamt) * 100}%` }} />
          <i className="duldung" style={{ width: `${(lage.duldung / lage.gesamt) * 100}%` }} />
          <i className="opposition" style={{ width: `${(lage.opposition / lage.gesamt) * 100}%` }} />
          <s style={{ left: `${(REGELN.mehrheit / lage.gesamt) * 100}%` }} />
        </div>
        <div className="par-lager-zeile">
          <span>
            <i className="lager" />
            Lager <b>{zahl(lage.lager)}</b>
          </span>
          {lage.duldung > 0 && (
            <span>
              <i className="duldung" />
              duldet <b>{zahl(lage.duldung)}</b>
            </span>
          )}
          <span>
            <i className="opposition" />
            Opposition <b>{zahl(lage.opposition)}</b>
          </span>
          <span className="par-marke">Mehrheit ab {REGELN.mehrheit}</span>
        </div>
      </div>

      <ul className="par-fraktionen">
        {lage.fraktionen.map((f) => (
          <li
            key={f.partei}
            className={`rolle-${f.rolle}${hervor === f.partei ? " on" : ""}${hervor && hervor !== f.partei ? " leise" : ""}`}
            onPointerEnter={() => setHervor(f.partei)}
            onPointerLeave={() => setHervor(null)}
          >
            <i className="par-punkt" style={{ background: f.farbe }} />
            <span className="par-name">
              {f.name}
              <em>{ROLLEN_WORT[f.rolle]}</em>
            </span>
            <span className="par-stark" aria-hidden="true">
              <i style={{ width: `${(f.sitze / lage.gesamt) * 100 * 2.2}%`, background: f.farbe }} />
            </span>
            <b>{f.sitze}</b>
            <span className="par-anteil">{f.anteil.toLocaleString("de-DE", { maximumFractionDigits: 1 })} %</span>
          </li>
        ))}
      </ul>

      {letzte.length > 0 && (
        <div className="par-letzte">
          <h4>Letzte Abstimmungen</h4>
          <ul>
            {letzte.map((a) => (
              <li key={`${a.tag}-${a.name}`} className={a.angenommen ? "ja" : "nein"}>
                <span className="par-l-stempel">{a.angenommen ? "angenommen" : "abgelehnt"}</span>
                <span className="par-l-name">
                  {a.name}
                  <em>
                    {formatDateDe(a.datum)} · {a.ja} zu {a.nein}
                  </em>
                </span>
                <button className="link" onClick={() => spieleAbstimmungAb(a)} title="Die Abstimmung noch einmal im Halbrund zeigen">
                  Ansehen
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
