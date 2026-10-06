// Zusagen: Wem etwas versprochen wurde, bis wann, wie weit es ist, was Halten und Brechen bedeuten, und Handlungen dazu.

import { t } from "../../i18n";
import { vorgangZuZusage } from "../../sim/vorgaenge";
import { useState } from "react";
import type { World } from "../../sim/types";
import { addDays, formatDateDe } from "../../sim/dates";
import { brecheFrei, loeseEin, vertroesteFrei, zusagenBilanz, zusagenSicht, zusageBezug, zusageText, zusageVon, type ZusageAntwort, type ZusageSicht } from "../../sim/zusagen";
import { Balken, Portraet, tonVon } from "./bausteine";
import { t as tx } from "../../i18n";

const DRING_TEXT: Record<ZusageSicht["dringlichkeit"], string> = { ruhig: "in Ruhe", bald: "bald fällig", dringend: "dringend", ueberfaellig: "überfällig" };

function Medaille({ world, s }: { world: World; s: ZusageSicht }) {
  if (s.bezug.art === "person") {
    const f = world.spiel!.figuren.find((x) => x.id === s.bezug.id);
    if (f) return <Portraet w={world} f={f} size={40} />;
  }
  const kurz = s.bezug.art === "fraktion" ? s.bezug.name.slice(0, 4) : s.bezug.name.split(/[ -]/).map((t) => t[0]).join("").slice(0, 3).toUpperCase();
  return (
    <div className="pe-medaille" aria-hidden>
      {kurz}
    </div>
  );
}

export function ZusagenAnsicht({ world, refresh, onMassnahme, onVorgang }: { world: World; refresh: () => void; onMassnahme?: (id: string, richtung: 1 | -1) => void; onVorgang?: (id: string) => void }) {
  const spiel = world.spiel!;
  const [antwort, setAntwort] = useState<(ZusageAntwort & { id: string }) | null>(null);
  const [wirklich, setWirklich] = useState<string | null>(null);
  const sicht = zusagenSicht(world);
  const bilanz = zusagenBilanz(world);
  const erledigt = spiel.zusagen.filter((z) => z.erfuellt || z.gebrochen).sort((a, b) => (b.abgeschlossen ?? 0) - (a.abgeschlossen ?? 0));

  function tu(id: string, f: () => ZusageAntwort) {
    const r = f();
    setAntwort({ ...r, id });
    setWirklich(null);
    refresh();
  }

  return (
    <div className="pe-zusagen-seite" style={{ display: "grid", gap: 14 }}>
      <section className="paper">
        <h3>{t("ui.personen.ZusagenAnsicht.e224469")}</h3>
        <div className="pe-bilanz">
          <div className="pe-gross">
            <strong>
              {Math.round(bilanz.glaubwuerdigkeit)} <small style={{ font: "italic 16px var(--serif)", color: "var(--ink-soft)" }}>{bilanz.wort}</small>
            </strong>
            <Balken wert={bilanz.glaubwuerdigkeit} ton={tonVon(bilanz.glaubwuerdigkeit)} wort={bilanz.wort} label={t("ui.personen.ZusagenAnsicht.e8d0e79")} />
          </div>
          <div>
            <p style={{ margin: 0 }}>
              <strong>{bilanz.gehalten}</strong> {tx("ui2.ui.personen.ZusagenAnsicht.7207f39")} <strong>{bilanz.gebrochen}</strong> {tx("ui2.ui.personen.ZusagenAnsicht.e3b11fd")} <strong>{bilanz.offen}</strong> {tx("ui2.ui.personen.ZusagenAnsicht.a31cb8b", { p0: bilanz.vertroestet })}
            </p>
            <p className="subtitle" style={{ margin: "6px 0 0" }}>
              {t("ui.personen.ZusagenAnsicht.2334b05")}
            </p>
          </div>
        </div>
      </section>

      <section className="paper">
        <h3>{tx("ui2.ui.personen.ZusagenAnsicht.9049d8e")}</h3>
        {antwort && (
          <p className={`pe-rueck${antwort.ok ? "" : " nein"}`} role="status">
            {antwort.text}
            {antwort.why && <em> {antwort.why}</em>}
          </p>
        )}
        {sicht.length === 0 && <p className="pe-leer">{t("ui.personen.ZusagenAnsicht.923a607")}</p>}
        <div className="pe-zusagen">
          {sicht.map((s) => (
            <article key={s.z.id} className={`pe-zusage ${s.dringlichkeit}`}>
              <header>
                <Medaille world={world} s={s} />
                <div>
                  <strong>{zusageText(s.z)}</strong>
                  <em>
                    {s.bezug.art === "person" ? `${s.bezug.name} (${zusageVon(s.z.von)})` : s.bezug.art === "fraktion" ? tx("ui2.ui.personen.ZusagenAnsicht.bc3d909", { p0: s.bezug.name }) : s.bezug.art === "land" ? tx("ui2.ui.personen.ZusagenAnsicht.e568133", { p0: s.bezug.name }) : zusageVon(s.bezug.name)}
                  </em>
                </div>
                <div className={`pe-frist ${s.dringlichkeit}`}>
                  {s.tage < 0 ? tx("ui2.ui.personen.ZusagenAnsicht.9e31426", { p0: -s.tage }) : s.tage === 0 ? tx("ui2.ui.personen.ZusagenAnsicht.342e0c3") : tx("ui2.ui.personen.ZusagenAnsicht.94acca5", { p0: s.tage })}
                  <small>
                    {formatDateDe(s.datum)} · {DRING_TEXT[s.dringlichkeit]}
                  </small>
                </div>
              </header>
              {s.fortschritt && (
                <div>
                  <Balken
                    wert={s.fortschritt.anteil * 100}
                    ton={s.fortschritt.anteil >= 0.6 ? "gut" : s.fortschritt.anteil >= 0.2 ? "mittel" : "schlecht"}
                    label={tx("ui2.ui.personen.ZusagenAnsicht.c5c02b7", { p0: s.fortschritt.name, p1: Math.round(s.fortschritt.start), p2: s.fortschritt.zielName ?? Math.round(s.fortschritt.ziel), p3: Math.round(s.fortschritt.jetzt) })}
                    wort={s.fortschritt.imParlament ? tx("ui2.ui.personen.ZusagenAnsicht.07204cc") : `${Math.round(s.fortschritt.anteil * 100)} %`}
                    klein
                  />
                </div>
              )}
              <div className="pe-vorher">
                <div className="gehalten">
                  <h5>{tx("ui2.ui.personen.ZusagenAnsicht.70583e5")}</h5>
                  <ul>
                    {s.gehalten.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </div>
                <div className="gebrochen">
                  <h5>{tx("ui2.ui.personen.ZusagenAnsicht.37da164")}</h5>
                  <ul>
                    {s.gebrochen.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="pe-aktionen">
                <button className="pe-aktion haupt" onClick={() => tu(s.z.id, () => loeseEin(world, s.z))} disabled={s.fortschritt?.imParlament} title={s.fortschritt?.imParlament ? tx("ui2.ui.personen.ZusagenAnsicht.dc72b81") : tx("ui2.ui.personen.ZusagenAnsicht.67fe9f3")}>
                  {t("ui.personen.ZusagenAnsicht.104b3fd")}
                </button>
                {s.z.massnahme && onMassnahme && (
                  <button className="pe-aktion" onClick={() => onMassnahme(s.z.massnahme!, (s.z.richtung ?? 1) > 0 ? 1 : -1)}>
                    {t("ui.personen.ZusagenAnsicht.0e1c234")}
                  </button>
                )}
                {onVorgang && vorgangZuZusage(world, s.z.id) && (
                  <button className="pe-aktion" onClick={() => onVorgang(vorgangZuZusage(world, s.z.id)!.id)}>
                    {t("vorgang.sprung.zum")}
                  </button>
                )}
                <button className="pe-aktion" disabled={!s.vertroesten?.moeglich} title={s.vertroesten?.text} onClick={() => tu(s.z.id, () => vertroesteFrei(world, s.z))}>
                  {tx("ui2.ui.personen.ZusagenAnsicht.89ec4d1")} <b>1</b>
                </button>
                <button className="pe-aktion leise" onClick={() => (wirklich === s.z.id ? tu(s.z.id, () => brecheFrei(world, s.z)) : setWirklich(s.z.id))}>
                  {wirklich === s.z.id ? tx("ui2.ui.personen.ZusagenAnsicht.e674097") : tx("ui2.ui.personen.ZusagenAnsicht.94c66b4")}
                </button>
              </div>
              {s.vertroesten && <p className="subtitle" style={{ margin: 0 }}>{s.vertroesten.text}</p>}
            </article>
          ))}
        </div>
      </section>

      {erledigt.length > 0 && (
        <section className="paper">
          <h3>{tx("ui2.ui.personen.ZusagenAnsicht.adf9ae5")}</h3>
          <ul className="pe-erledigt">
            {erledigt.slice(0, 12).map((z) => {
              const b = zusageBezug(world, z);
              return (
                <li key={z.id} className={z.erfuellt ? "erfuellt" : "gebrochen"}>
                  <span aria-hidden>{z.erfuellt ? "✓" : "✗"}</span>
                  <span>
                    {z.erfuellt ? tx("ui2.ui.personen.ZusagenAnsicht.dd01a6f") : tx("ui2.ui.personen.ZusagenAnsicht.150a658")}: {zusageText(z)} <em>({b.name})</em>
                  </span>
                  {z.abgeschlossen !== undefined && <time>{formatDateDe(addDays(spiel.start.datum, z.abgeschlossen))}</time>}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
