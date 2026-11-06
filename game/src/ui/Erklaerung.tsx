// „Die Mentorin erklärt“: Zu jeder Größe stehen hier in drei Reitern, was sie ist, wie das Land im Weltvergleich steht
// und was du tun kannst. Man soll im Spiel lernen (Lernkonzept).
// Tagarbeit 06.11.: Die Leiste ist zugeklappt, bis man einen Reiter wählt. Offen sagt sie nur, was die Ansicht nicht schon zeigt:
// Der Stand steht über der Erklärung in großer Zahl, die Wirkungen im Bild und in den Begründungen; die allgemeine Belehrung
// („Eine Maßnahme ist ein Regler …“) steht unter den Begriffen statt als erster Satz.

import { useMemo, useState } from "react";
import type { World } from "../sim/types";
import type { NodeSpec } from "../data/politiknetz";
import { erklaere } from "./lernen";
import { VergleichBalken } from "./VergleichBalken";
import { indikatorenFuer, spielWert } from "./vergleich";
import { Cameo } from "./art/Cameo";
import { betroffene } from "../sim/wege";

type Reiter = "erklaert" | "welt" | "tun";

/** kopfText: der Satz, der über der Erklärung schon steht; die Mentorin wiederholt ihn nicht (Spielerdurchlauf 5. November) */
export function Erklaerung({ node, world, onSelect, kopfText }: { node: NodeSpec; world: World; onSelect: (id: string) => void; kopfText?: string }) {
  const [reiter, setReiter] = useState<Reiter | null>(null);
  const [welt, setWelt] = useState(0);
  const tag = world.day - (world.day % 15);
  const e0 = useMemo(() => erklaere(node, world), [node.id, world.net.month, tag]); // eslint-disable-line react-hooks/exhaustive-deps
  const e = kopfText && e0.was[0]?.trim() === kopfText.trim() && e0.was.length > 1 ? { ...e0, was: e0.was.slice(1) } : e0;
  const vergleiche = indikatorenFuer(node.input ?? node.id);
  const aktuell = vergleiche[Math.min(welt, vergleiche.length - 1)];
  const eingang = node.input ? spielWert(world, node.input) : undefined;
  // Was die Ansicht schon zeigt, sagt die Mentorin nicht noch einmal (siehe Kopf der Datei)
  const allgemein = node.input ? null : t(`lernen.art.${node.kind}`);
  // Bei Maßnahmen nennen Kosten und Dauer schon „Was folgt daraus?“ unter dem Bild; die Mentorin sagt stattdessen, wer gewinnt und verliert
  const eigenes = node.kind === "massnahme" ? [] : e.was.filter((x) => x !== allgemein);
  const stand = node.input ? e.stand : e.stand.slice(1);
  const wer = node.kind === "massnahme" ? betroffene(node.id, 1) : null;
  const begriffe = allgemein ? [{ begriff: t("t2.mentor.wasIst", { art: node.kind }), text: allgemein }, ...e.begriffe] : e.begriffe;
  const lead = [
    wer && wer.gewinner.length > 0 ? t("t2.mentor.gewinner", { liste: wer.gewinner.join(", ") }) : null,
    wer && wer.verlierer.length > 0 ? t("t2.mentor.verlierer", { liste: wer.verlierer.join(", ") }) : null,
  ].filter(Boolean).join(" ");

  return (
    <section className="erklaerung" aria-label={tx("ui2.ui.Erklaerung.8e99219", { p0: node.name })}>
      <header className="erklaerung-kopf">
        <Cameo seed="Defne Arslan" figure="f" glasses size={32} tint="#265a62" />
        <strong>{t("t2.mentor.titel")}</strong>
        <div className="reiter" role="tablist">
          {(
            [
              ["erklaert", t("ui.Erklaerung.reiter.erklaert")],
              ["welt", t("ui.Erklaerung.reiter.welt")],
              ["tun", t("ui.Erklaerung.reiter.tun")],
            ] as [Reiter, string][]
          )
            // Ohne hinterlegten Vergleich hätte der Reiter nur eine allgemeine Belehrung: Er entfällt
            .filter(([id]) => id !== "welt" || vergleiche.length > 0)
            .map(([id, label]) => (
            <button key={id} role="tab" aria-selected={reiter === id} aria-expanded={reiter === id} className={reiter === id ? "on" : ""} onClick={() => setReiter(reiter === id ? null : id)}>
              {label}
            </button>
          ))}
        </div>
      </header>

      {reiter === "erklaert" && (
        <div className="erklaerung-koerper">
          {lead && <p className="lead">{lead}</p>}
          {eigenes.map((x, i) => (
            <p key={i} className={!lead && i === 0 ? "lead" : undefined}>
              {x}
            </p>
          ))}
          {stand.map((x, i) => (
            <p key={`s${i}`} className="stand">
              {i === 0 && <b>{t("ui.Erklaerung.0ca5c4c")}</b>} {x}
            </p>
          ))}
          {/* Aufgeklappt zeigt der Reiter alles; die Begriffe bleiben eine eigene Klappe */}
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
          {begriffe.length > 0 && (
            <details className="begriffe">
              <summary>{tx("ui2.ui.Erklaerung.21f2bd4", { p0: begriffe.length })}</summary>
              <dl>
                {begriffe.map((b) => (
                  <div key={b.begriff}>
                    <dt>{b.begriff}</dt>
                    <dd>{b.text}</dd>
                  </div>
                ))}
              </dl>
            </details>
          )}
        </div>
      )}

      {reiter === "welt" && (
        <div className="erklaerung-koerper">
          {/* Kein allgemeiner Satz vorweg („Eine Zahl sagt erst im Vergleich etwas“): Kopf und Platz der Türkei sagen es konkret */}
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
