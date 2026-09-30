// Zusagen: Wem etwas versprochen wurde, bis wann, wie weit es ist, was Halten und Brechen bedeuten, und Handlungen dazu.

import { useState } from "react";
import type { World } from "../../sim/types";
import { addDays, formatDateDe } from "../../sim/dates";
import { brecheFrei, loeseEin, vertroesteFrei, zusagenBilanz, zusagenSicht, zusageBezug, type ZusageAntwort, type ZusageSicht } from "../../sim/zusagen";
import { Balken, Portraet, tonVon } from "./bausteine";

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

export function ZusagenAnsicht({ world, refresh, onMassnahme }: { world: World; refresh: () => void; onMassnahme?: (id: string, richtung: 1 | -1) => void }) {
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
        <h3>Ihre Glaubwürdigkeit</h3>
        <div className="pe-bilanz">
          <div className="pe-gross">
            <strong>
              {Math.round(bilanz.glaubwuerdigkeit)} <small style={{ font: "italic 16px var(--serif)", color: "var(--ink-soft)" }}>{bilanz.wort}</small>
            </strong>
            <Balken wert={bilanz.glaubwuerdigkeit} ton={tonVon(bilanz.glaubwuerdigkeit)} wort={bilanz.wort} label="Glaubwürdigkeit" />
          </div>
          <div>
            <p style={{ margin: 0 }}>
              <strong>{bilanz.gehalten}</strong> gehalten, <strong>{bilanz.gebrochen}</strong> gebrochen, <strong>{bilanz.offen}</strong> offen, {bilanz.vertroestet}× vertröstet.
            </p>
            <p className="subtitle" style={{ margin: "6px 0 0" }}>
              Wer Zusagen hält, gewinnt Legitimität und Vertrauen und wird beim nächsten Mal ernster genommen; wer sie bricht, verliert beides, dazu Verbündete. Unter 40 sinkt die Legitimität jeden Monat, ab 80 steigt sie langsam.
            </p>
          </div>
        </div>
      </section>

      <section className="paper">
        <h3>Offene Zusagen</h3>
        {antwort && (
          <p className={`pe-rueck${antwort.ok ? "" : " nein"}`} role="status">
            {antwort.text}
            {antwort.why && <em> {antwort.why}</em>}
          </p>
        )}
        {sicht.length === 0 && <p className="pe-leer">Keine offenen Zusagen. Wer Versprechen macht (Wahlkampf, Bündnis, Verträge), findet sie hier.</p>}
        <div className="pe-zusagen">
          {sicht.map((s) => (
            <article key={s.z.id} className={`pe-zusage ${s.dringlichkeit}`}>
              <header>
                <Medaille world={world} s={s} />
                <div>
                  <strong>{s.z.text}</strong>
                  <em>
                    {s.bezug.art === "person" ? `${s.bezug.name} (${s.z.von})` : s.bezug.art === "fraktion" ? `Fraktion ${s.bezug.name}` : s.bezug.art === "land" ? `Land: ${s.bezug.name}` : s.bezug.name}
                  </em>
                </div>
                <div className={`pe-frist ${s.dringlichkeit}`}>
                  {s.tage < 0 ? `seit ${-s.tage} Tagen überfällig` : s.tage === 0 ? "heute fällig" : `in ${s.tage} Tagen`}
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
                    label={`${s.fortschritt.name}: von ${Math.round(s.fortschritt.start)} auf ${s.fortschritt.zielName ?? Math.round(s.fortschritt.ziel)} (jetzt ${Math.round(s.fortschritt.jetzt)})`}
                    wort={s.fortschritt.imParlament ? "im Parlament" : `${Math.round(s.fortschritt.anteil * 100)} %`}
                    klein
                  />
                </div>
              )}
              <div className="pe-vorher">
                <div className="gehalten">
                  <h5>Wenn gehalten</h5>
                  <ul>
                    {s.gehalten.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </div>
                <div className="gebrochen">
                  <h5>Wenn gebrochen</h5>
                  <ul>
                    {s.gebrochen.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="pe-aktionen">
                <button className="pe-aktion haupt" onClick={() => tu(s.z.id, () => loeseEin(world, s.z))} disabled={s.fortschritt?.imParlament} title={s.fortschritt?.imParlament ? "Das Gesetz liegt schon im Parlament" : "Das verlangte Gesetz einbringen oder die Zusage einlösen"}>
                  Jetzt einlösen
                </button>
                {s.z.massnahme && onMassnahme && (
                  <button className="pe-aktion" onClick={() => onMassnahme(s.z.massnahme!, (s.z.richtung ?? 1) > 0 ? 1 : -1)}>
                    Maßnahme ansehen
                  </button>
                )}
                <button className="pe-aktion" disabled={!s.vertroesten?.moeglich} title={s.vertroesten?.text} onClick={() => tu(s.z.id, () => vertroesteFrei(world, s.z))}>
                  Vertrösten <b>1</b>
                </button>
                <button className="pe-aktion leise" onClick={() => (wirklich === s.z.id ? tu(s.z.id, () => brecheFrei(world, s.z)) : setWirklich(s.z.id))}>
                  {wirklich === s.z.id ? "Wirklich brechen?" : "Brechen"}
                </button>
              </div>
              {s.vertroesten && <p className="subtitle" style={{ margin: 0 }}>{s.vertroesten.text}</p>}
            </article>
          ))}
        </div>
      </section>

      {erledigt.length > 0 && (
        <section className="paper">
          <h3>Erledigt</h3>
          <ul className="pe-erledigt">
            {erledigt.slice(0, 12).map((z) => {
              const b = zusageBezug(world, z);
              return (
                <li key={z.id} className={z.erfuellt ? "erfuellt" : "gebrochen"}>
                  <span aria-hidden>{z.erfuellt ? "✓" : "✗"}</span>
                  <span>
                    {z.erfuellt ? "Gehalten" : "Gebrochen"}: {z.text} <em>({b.name})</em>
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
