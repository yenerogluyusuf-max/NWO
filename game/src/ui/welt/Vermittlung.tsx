// Vermittlung zwischen zwei Dritten: Ankara als Ort und Vermittler. Kostet Kapital, hat eine Aussicht und wirkt auf beide Seiten und das Ansehen.

import { useState } from "react";
import type { World } from "../../sim/types";
import { land } from "../../sim/laender";
import { vermittle, vermittlungen } from "../../sim/abkommen";
import { Rng } from "../../sim/rng";
import { Flagge } from "../art/Flaggen";
import { kannZahlen } from "../../sim/kapital";

export function Vermittlung({ world, refresh }: { world: World; refresh: () => void }) {
  const [antwort, setAntwort] = useState<{ id: string; ok: boolean; text: string; why?: string } | null>(null);
  const liste = vermittlungen(world);
  return (
    <section className="we-vermittlung">
      <h3>Vermittlung</h3>
      <p className="subtitle">Kein Konkurrenzspiel lässt einen Staat zwischen zwei Dritten vermitteln. Ankara kann es: Es hat einen Draht zu beiden Seiten. Beide müssen Ihnen als Vermittler vertrauen; ohne Erfolg verlieren Sie Kapital und ein wenig Ansehen.</p>
      <ul className="we-vermittlungen">
        {liste.map((v) => {
          const a = land(v.def.a);
          const b = land(v.def.b);
          return (
            <li key={v.def.id} className="we-vermittlung-karte">
              <div className="we-vermittlung-kopf">
                <Flagge id={v.def.a} breite={40} titel={a.name} />
                <span aria-hidden>⇄</span>
                <Flagge id={v.def.b} breite={40} titel={b.name} />
                <strong>{v.def.titel}</strong>
              </div>
              <p>{v.def.text}</p>
              <ul className="we-paket">
                {v.def.paket.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
              <div className="we-aussicht" aria-label={`Aussicht ${v.aussicht} Prozent`}>
                <span>Aussicht</span>
                <span className="we-balken">
                  <i style={{ width: `${v.aussicht}%` }} />
                </span>
                <b>{v.aussicht} %</b>
              </div>
              <div className="we-vermittlung-fuss">
                <button
                  type="button"
                  className="aktion-knopf"
                  disabled={!v.moeglich || !world.spiel || !kannZahlen(world.spiel.kapital, v.def.pk)}
                  title={v.grund}
                  onClick={() => {
                    const r = vermittle(world, v.def.id, new Rng(world.day * 7919 + v.def.id.length * 104729));
                    setAntwort({ id: v.def.id, ...r });
                    refresh();
                  }}
                >
                  Vermitteln <b>{v.def.pk}</b>
                </button>
                {v.grund && <span className="we-grund">{v.grund}</span>}
              </div>
              {antwort?.id === v.def.id && (
                <p className={`we-rueck ${antwort.ok ? "ok" : "nein"}`} role="status">
                  {antwort.text}
                  {antwort.why && <em> {antwort.why}</em>}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
