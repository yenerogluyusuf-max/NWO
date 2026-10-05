// Vermittlung zwischen Drittstaaten (AUS-4): Ankara als Ort und Vermittler — die Alleinstellung des Spiels.
// Konflikt-Auswahl, Reif-Kurve, ZOPA-Band mit Hebelpunkten, Handlungsleiste mit Preisen und der
// Garantie-Baukasten (Überwachung, Wirtschafts-Anker, militärische Garantie).

import { useState } from "react";
import type { World } from "../../sim/types";
import { GARANTIEN, VORBEREITUNGEN, type GarantieArtId, type VorbereitungId } from "../../data/konflikte";
import { STATUS_NAME, beendeGarantie, bieteGarantie, konfliktSichten, vermittle, vorbereite, type KonfliktSicht } from "../../sim/vermittlung";
import { Rng } from "../../sim/rng";
import { Flagge } from "../art/Flaggen";
import { kannZahlen } from "../../sim/kapital";

const ZOPA_LABEL = { geschlossen: "geschlossen", schmal: "schmal", breit: "breit" } as const;

function ParteiBlock({ seite, vertrauen, titel }: { seite: KonfliktSicht["def"]["a"]; vertrauen: number; titel: string }) {
  return (
    <div className="we-partei">
      <b>{seite.name}</b>
      <span className="we-partei-vertrauen" title="Vertrauen in die Türkei als Vermittler">
        Vertrauen in Ankara: {Math.round(vertrauen)}
      </span>
      <i>{titel}</i>
      <ul>
        {seite.forderungen.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>
      <i>Rote Linien</i>
      <ul className="we-rot">
        {seite.roteLinien.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
    </div>
  );
}

export function Vermittlung({ world, refresh }: { world: World; refresh: () => void }) {
  const liste = konfliktSichten(world);
  const [gewaehltId, setGewaehltId] = useState(liste[0]?.def.id ?? "");
  const [antwort, setAntwort] = useState<{ ok: boolean; text: string; why?: string } | null>(null);
  const s = liste.find((x) => x.def.id === gewaehltId) ?? liste[0];
  if (!s) return null;
  const tue = (fn: () => { ok: boolean; text: string; why?: string }) => {
    setAntwort(fn());
    refresh();
  };
  return (
    <section className="we-vermittlung">
      <h3>Vermittlung zwischen Dritten</h3>
      <p className="subtitle">
        Kein Konkurrenzspiel lässt einen Staat zwischen zwei Dritten vermitteln. Ankara kann es: Es hat einen Draht zu beiden Seiten. Die Lage muss reifen — Schmerz des Patts gegen Schmerz des
        Kompromisses —, Spoiler arbeiten dagegen, und eine Einigung hält nur, wer sie garantiert.
      </p>

      {/* Konflikt-Auswahl */}
      <div className="we-konflikte" role="tablist" aria-label="Konflikte">
        {liste.map((k) => (
          <button
            key={k.def.id}
            type="button"
            role="tab"
            aria-selected={k.def.id === s.def.id}
            className={`we-konflikt${k.def.id === s.def.id ? " on" : ""}`}
            onClick={() => {
              setGewaehltId(k.def.id);
              setAntwort(null);
            }}
          >
            <span className="we-konflikt-kopf">
              {k.def.a.land && <Flagge id={k.def.a.land} breite={26} titel={k.def.a.name} />}
              <span aria-hidden>⇄</span>
              {k.def.b.land && <Flagge id={k.def.b.land} breite={26} titel={k.def.b.name} />}
            </span>
            <b>{k.def.titel}</b>
            <span className={`we-status st-${k.status}`}>{STATUS_NAME[k.status]}</span>
            <span className="we-konflikt-zahlen">
              Reif {Math.round(k.z.reif)} · Konflikt {Math.round(k.z.konfliktIndex)} · ZOPA {ZOPA_LABEL[k.zopa.stufe]}
            </span>
          </button>
        ))}
      </div>

      <article className="we-vermittlung-karte">
        <header className="we-vermittlung-kopf">
          {s.def.a.land && <Flagge id={s.def.a.land} breite={40} titel={s.def.a.name} />}
          <span aria-hidden>⇄</span>
          {s.def.b.land && <Flagge id={s.def.b.land} breite={40} titel={s.def.b.name} />}
          <strong>{s.def.titel}</strong>
        </header>
        <p>{s.def.text}</p>

        <div className="we-parteien">
          <ParteiBlock seite={s.def.a} vertrauen={s.vertrauenA} titel="Kernforderungen" />
          <ParteiBlock seite={s.def.b} vertrauen={s.vertrauenB} titel="Kernforderungen" />
        </div>

        {/* Reif-Kurve */}
        <div className="we-reif" aria-label={`Reife der Lage ${Math.round(s.z.reif)} von 100`}>
          <div className="we-aussicht">
            <span>Reife</span>
            <span className="we-balken">
              <i style={{ width: `${s.z.reif}%` }} />
            </span>
            <b>{Math.round(s.z.reif)}</b>
          </div>
          {s.z.reifVerlauf.length > 1 && (
            <div className="we-reif-kurve" title="Reif-Verlauf der letzten Monate">
              {s.z.reifVerlauf.map((p) => (
                <i key={p.monat} style={{ height: `${Math.max(6, p.wert)}%` }} title={`${p.monat}: ${p.wert}`} />
              ))}
            </div>
          )}
        </div>

        {/* ZOPA-Band */}
        <div className={`we-zopa zopa-${s.zopa.stufe}`}>
          <div className="we-zopa-kopf">
            <span>Zone möglicher Einigung</span>
            <b>{ZOPA_LABEL[s.zopa.stufe]}</b>
          </div>
          <div className="we-zopa-band" aria-label={`Bandbreite ${s.zopa.breite} von 100`}>
            <i style={{ width: `${s.zopa.breite}%` }} />
          </div>
          {s.zopa.gruende.map((g) => (
            <p key={g} className="we-zopa-grund">
              {g}
            </p>
          ))}
          <ul className="we-hebel">
            {s.def.hebel.map((h) => (
              <li key={h.id}>
                <b>{h.label}</b> — {h.text}
                <em> {h.richtung}</em>
              </li>
            ))}
          </ul>
        </div>

        {/* Vermittlungsversuch */}
        <div className="we-aussicht" aria-label={`Aussicht ${s.aussicht} Prozent`}>
          <span>Aussicht{s.z.garantieAngebot ? ` (mit Garantie „${GARANTIEN[s.z.garantieAngebot].label}")` : ""}</span>
          <span className="we-balken">
            <i style={{ width: `${s.aussicht}%` }} />
          </span>
          <b>{s.aussicht} %</b>
        </div>
        <div className="we-vermittlung-fuss">
          <button
            type="button"
            className="aktion-knopf"
            disabled={!s.moeglich || !world.spiel || !kannZahlen(world.spiel.kapital, s.def.pk)}
            title={s.grund}
            onClick={() => tue(() => vermittle(world, s.def.id, new Rng(world.day * 7919 + s.def.id.length * 104729)))}
          >
            Vermitteln <b>{s.def.pk}</b>
          </button>
          {s.grund && <span className="we-grund">{s.grund}</span>}
        </div>
        <ul className="we-paket">
          {s.def.paket.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>

        {/* Handlungsleiste: Vorbereitung */}
        {s.z.einigung === undefined && (
          <div className="we-handlungen">
            <b>Reife schaffen</b>
            <div className="we-handlungen-leiste">
              {s.vorbereitungen.map((v) => (
                <button
                  key={v.def.id}
                  type="button"
                  className="aktion-knopf klein"
                  disabled={!v.moeglich}
                  title={`${v.def.hinweis}${v.grund ? ` — ${v.grund}` : ""}`}
                  onClick={() => tue(() => vorbereite(world, s.def.id, v.def.id as VorbereitungId))}
                >
                  {v.def.label} <b>{v.def.pk}</b>
                </button>
              ))}
            </div>
            <p className="we-hinweis">
              {s.vorbereitungen.find((v) => v.grund)?.grund ?? "Kanäle, Vertrauensmaßnahmen und die Gastgeberrolle lassen die Lage reifen — Spoiler können alles zurückwerfen."}
            </p>
          </div>
        )}

        {/* Garantie-Baukasten */}
        <div className="we-garantien">
          <b>Garantien</b>
          <div className="we-garantien-leiste">
            {s.garantien.map((g) => (
              <div key={g.def.id} className={`we-garantie${g.aktiv ? " aktiv" : ""}${g.angeboten ? " angeboten" : ""}`}>
                <b>{g.def.label}</b>
                <p>{g.def.text}</p>
                <p className="we-garantie-preis">
                  Angebot {g.def.pk} Kapital, Aufbau {g.def.bip.toLocaleString("de-DE")} % des BIP, danach {g.def.monatPk.toLocaleString("de-DE")} Kapital im Monat · Aussicht +{g.def.aussicht}
                </p>
                <p className="we-garantie-risiko">{g.def.risiko}</p>
                {g.aktiv ? (
                  <button type="button" className="aktion-knopf klein" title={s.z.konfliktIndex <= 25 ? "Geordnet beenden: ohne Gesichtsverlust" : "Mitten im Konflikt: Gesichtsverlust (Ansehen −2)"} onClick={() => tue(() => beendeGarantie(world, s.def.id))}>
                    Garantie beenden
                  </button>
                ) : g.angeboten ? (
                  <span className="we-angeboten">Angeboten — wirkt beim nächsten Vermittlungsversuch</span>
                ) : (
                  <button
                    type="button"
                    className="aktion-knopf klein"
                    disabled={!g.moeglich}
                    title={g.grund}
                    onClick={() => tue(() => bieteGarantie(world, s.def.id, g.def.id as GarantieArtId))}
                  >
                    Anbieten <b>{g.def.pk}</b>
                  </button>
                )}
                {g.grund && !g.aktiv && !g.angeboten && <span className="we-grund">{g.grund}</span>}
              </div>
            ))}
          </div>
        </div>

        {antwort && (
          <p className={`we-rueck ${antwort.ok ? "ok" : "nein"}`} role="status">
            {antwort.text}
            {antwort.why && <em> {antwort.why}</em>}
          </p>
        )}
      </article>
    </section>
  );
}
