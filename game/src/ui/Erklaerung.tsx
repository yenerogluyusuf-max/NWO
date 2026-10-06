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
    <section className="erklaerung" aria-label={tx("ui2.ui.Erklaerung.8e99219", { p0: node.name })}>
      <header className="erklaerung-kopf">
        <Cameo seed="Defne Arslan" figure="f" glasses size={36} tint="#265a62" />
        <div>
          <strong>{t("ui.Erklaerung.f45e424")}</strong>
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
              <b>{t("ui.Erklaerung.0ca5c4c")}</b> {e.stand[0]}
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
                    <span>{t("ui.Erklaerung.344fbb6")}</span>
                    <ul>
                      {e.orte.hoch.map((o) => (
                        <li key={o.name}>
                          {o.name} <em>{Math.round(o.wert)}</em>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <span>{tx("ui2.ui.Erklaerung.c60c617")}</span>
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
                  <h4>{t("ui.Erklaerung.184fe65")}</h4>
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
                  <summary>{tx("ui2.ui.Erklaerung.21f2bd4", { p0: e.begriffe.length })}</summary>
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
            {mehr ? tx("ui2.ui.Erklaerung.34a01ce") : tx("ui2.ui.Erklaerung.0105a20")}
          </button>
        </div>
      )}

      {reiter === "welt" && (
        <div className="erklaerung-koerper">
          <p className="lead">{t("ui.Erklaerung.b90015a")}</p>
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
                  {tx("ui2.ui.Erklaerung.22265ed", { p0: node.name })}
                </p>
              )}
            </>
          ) : (
            <p className="subtitle">
              {tx("ui2.ui.Erklaerung.7eb3571", { p0: node.name })} {node.input === "leitzins" ? tx("ui2.ui.Erklaerung.bbb2d54") : tx("ui2.ui.Erklaerung.84c0076")}
            </p>
          )}
        </div>
      )}

      {reiter === "tun" && (
        <div className="erklaerung-koerper">
          {e.hebel.length > 0 && (
            <>
              <p className="lead">{tx("ui2.ui.Erklaerung.dc43c99", { p0: node.name })}</p>
              <ul className="hebel">
                {e.hebel.map((h) => {
                  const id = /„(.+?)“/.exec(h.text)?.[1];
                  return (
                    <li key={h.text}>
                      <strong>{h.text}</strong>
                      <span>{h.warum}</span>
                      {id && (
                        <button className="link" onClick={() => onSelect(hebelId(id))}>
                          {t("ui.Erklaerung.a440712")}
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
              <h4>{tx("ui2.ui.Erklaerung.f74a9ea")}</h4>
              <ul className="wichtig">
                {e.treiber.map((v) => (
                  <li key={v.id}>
                    <button className="link" onClick={() => onSelect(v.id)}>
                      {v.name}
                    </button>{" "}
                    <span className={v.erhoeht ? "plus" : "minus"}>{v.erhoeht ? tx("ui2.ui.Erklaerung.39d21fd") : "senkt es"}</span> · <em>{v.wann}</em>
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
import { t } from "../i18n";
import { t as tx } from "../i18n";
function hebelId(name: string): string {
  return NET.nodes.find((n) => n.name === name)?.id ?? "";
}
