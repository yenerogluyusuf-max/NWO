// Blöcke und Institutionen: Mitglieder, Beschlussregel, der Stand der Türkei und — für die EU — der Rat mit den Positionen der Mitgliedstaaten.

import { useState } from "react";
import type { World } from "../../sim/types";
import { INSTITUTIONEN, STATUS_NAME, type InstitutionDef } from "../../data/welt-institutionen";
import { THEMA_NAME, fuehreInstitutionsAktionAus, institutionSicht, institutionsAktionen, ratErgebnis } from "../../sim/welt-bloecke";
import type { EuThema } from "../../data/welt-weitere";
import { akteurName } from "../../sim/welt-modell";
import { Flagge } from "../art/Flaggen";

const REGEL: Record<InstitutionDef["beschluss"], string> = {
  einstimmig: "Einstimmigkeit",
  mehrheit: "Mehrheit",
  konsens: "Konsens",
  keine: "keine bindenden Beschlüsse",
};

const STIMME: Record<string, string> = { dafuer: "dafür", enthaltung: "Enthaltung", dagegen: "dagegen" };

function EuRat({ world, onLand }: { world: World; onLand: (id: string) => void }) {
  const [thema, setThema] = useState<EuThema>("erweiterung");
  const e = ratErgebnis(world, thema);
  return (
    <section className="we-rat">
      <h4>Der Rat der Mitgliedstaaten</h4>
      <p className="subtitle">
        Die Eröffnung eines Beitrittskapitels verlangt Einstimmigkeit, ein Handelsmandat eine qualifizierte Mehrheit. Im Spiel zählen die 13 Staaten, die als Akteure vorkommen (vereinfacht); die
        übrigen folgen ihnen. Griechenland und Zypern üben ihr Veto über die Konfliktwerte aus, die anderen verweigern die Einstimmigkeit erst bei extremer Haltung.
      </p>
      <div className="we-rat-themen" role="tablist" aria-label="Thema">
        {(Object.keys(THEMA_NAME) as EuThema[]).map((t) => (
          <button key={t} type="button" role="tab" aria-selected={thema === t} className={thema === t ? "on" : ""} onClick={() => setThema(t)}>
            {THEMA_NAME[t]}
          </button>
        ))}
      </div>
      <p className="we-rat-ergebnis">
        <span className="we-chip gut">dafür {e.dafuer}</span> <span className="we-chip">Enthaltung {e.enthaltung}</span> <span className="we-chip schlecht">dagegen {e.dagegen}</span>{" "}
        <b>Einstimmigkeit: {e.einstimmig ? "nicht verweigert" : `blockiert (${e.blocker.map((b) => b.name).join(", ")})`}</b> · <b>Mehrheit: {e.mehrheit ? "erreicht" : "verfehlt"}</b>
      </p>
      <ul className="we-rat-liste">
        {e.stimmen.map((s) => (
          <li key={s.id} className={`stimme-${s.stimme}${s.veto ? " veto" : ""}`}>
            <button type="button" className="we-rat-land" onClick={() => onLand(s.id)}>
              <Flagge id={s.id} breite={28} /> {s.name}
            </button>
            <span className="we-rat-balken" aria-hidden>
              <i style={{ ["--p" as string]: `${50 + s.wert / 2}%` }} />
            </span>
            <span className="we-rat-wort">
              <b>{STIMME[s.stimme]}</b>
              {s.veto ? " · verweigert" : ""}
              {s.konflikt ? " · Veto über Konfliktwerte" : ""}
            </span>
            <em>{s.grund}</em>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function Block({ world, id, refresh, onLand }: { world: World; id: string; refresh: () => void; onLand: (id: string) => void }) {
  const [antwort, setAntwort] = useState<{ ok: boolean; text: string; why?: string } | null>(null);
  const { def, tuerkei, statusName } = institutionSicht(world, id);
  const aktionen = institutionsAktionen(world, id);
  const gruppe = (titel: string, ids?: string[]) =>
    ids && ids.length > 0 ? (
      <div className="we-block-gruppe">
        <b>{titel}</b>
        <ul>
          {ids.map((x) => (
            <li key={x}>
              <button type="button" className="we-block-land" onClick={() => onLand(x)} title={akteurName(x)}>
                <Flagge id={x} breite={30} /> <span>{akteurName(x)}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    ) : null;
  return (
    <div className="we-block">
      <header className="we-block-kopf">
        <h3>{def.name}</h3>
        <span className={`we-chip ${tuerkei === "mitglied" ? "gut" : tuerkei === "keiner" ? "schlecht" : ""}`}>Türkei: {statusName}</span>
      </header>
      <p className="we-block-text">{def.text}</p>
      <p className="we-block-regel">
        <b>Beschlussregel:</b> {REGEL[def.beschluss]} · <b>Türkei:</b> {def.tuerkeiText}
      </p>
      {gruppe("Mitglieder im Spiel", def.mitglieder)}
      {gruppe("Partner", def.partner)}
      {gruppe("Beobachter", def.beobachter)}
      {def.weitereMitglieder > 0 && <p className="we-hinweis">Dazu {def.weitereMitglieder} weitere Mitglieder, die im Spiel keine eigenen Akteure sind.</p>}

      {aktionen.length > 0 && (
        <div className="we-block-aktionen">
          {antwort && (
            <p className={`we-rueck ${antwort.ok ? "ok" : "nein"}`} role="status">
              {antwort.text}
              {antwort.why && <em> {antwort.why}</em>}
            </p>
          )}
          {aktionen.map((a) => (
            <div key={a.id} className="we-block-aktion">
              <button
                type="button"
                className="aktion-knopf"
                disabled={!a.moeglich}
                onClick={() => {
                  setAntwort(fuehreInstitutionsAktionAus(world, a.id));
                  refresh();
                }}
              >
                {a.label} <b>{a.pk}</b>
              </button>
              <span>{a.moeglich ? a.hinweis : a.grund}</span>
            </div>
          ))}
        </div>
      )}
      {id === "eu" && <EuRat world={world} onLand={onLand} />}
    </div>
  );
}

export function BlockListe({ gewaehlt, onWaehle, world }: { gewaehlt: string; onWaehle: (id: string) => void; world: World }) {
  return (
    <ul className="we-block-liste">
      {INSTITUTIONEN.map((i) => {
        const s = institutionSicht(world, i.id);
        return (
          <li key={i.id}>
            <button type="button" className={`we-eintrag block${gewaehlt === i.id ? " on" : ""}`} onClick={() => onWaehle(i.id)} aria-pressed={gewaehlt === i.id}>
              <span className="we-block-kurz" aria-hidden>
                {i.kurz.slice(0, 4)}
              </span>
              <span className="we-name">{i.kurz}</span>
              <span className="we-haltung">{STATUS_NAME[s.tuerkei].split(" (")[0]}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
