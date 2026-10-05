// Der Dienst (MİT) als Spielebene: verdeckte Operationen gegenüber einem Staat anordnen, laufende ansehen und den Bericht lesen.
// Im Bericht steht nur, was der Spieler selbst angeordnet hat oder was aufgedeckt wurde. Die Operationen sind Spielmechanik mit Kosten,
// Dauer, niedriger bis mittlerer Erfolgschance und Aufdeckungsrisiko — nie ein sicherer Sieg.

import { useMemo, useState } from "react";
import type { World } from "../../sim/types";
import { OP_DEFS, EINGEHEND_NAME, dienstSicht, opsOptionen, ordneAn } from "../../sim/welt-dienst";
import { akteurListe, ANZEIGE_GRUPPEN, wahlSicht } from "../../sim/welt-sicht";
import { akteurName } from "../../sim/welt-modell";
import { formatDateDe } from "../../sim/dates";
import { Flagge } from "../art/Flaggen";
import type { Operation } from "../../sim/welt-modell";

const AUSGANG: Record<string, string> = { erfolg: "Erfolg", fehlschlag: "Fehlschlag", aufgedeckt: "Aufgedeckt", info: "Vermerk" };

export function Dienst({ world, refresh, ziel: start, onLand }: { world: World; refresh: () => void; ziel?: string; onLand: (id: string) => void }) {
  const liste = useMemo(() => akteurListe(), []);
  const [ziel, setZiel] = useState<string>(start ?? "USA");
  const [lager, setLager] = useState<NonNullable<Operation["lager"]>>("herausforderer");
  const [antwort, setAntwort] = useState<{ ok: boolean; text: string; why?: string } | null>(null);
  const sicht = dienstSicht(world);
  const optionen = opsOptionen(world, ziel);
  const wahl = wahlSicht(world, ziel);
  const kapitalOk = world.spiel!.kapital;

  const anordnen = (art: Operation["art"]) => {
    setAntwort(ordneAn(world, art, ziel, art === "kandidat" ? lager : undefined));
    refresh();
  };
  const gegen = () => {
    setAntwort(ordneAn(world, "gegen", ziel));
    refresh();
  };

  return (
    <div className="we-dienst">
      <header className="we-dienst-kopf">
        <h3>Der Dienst</h3>
        <p className="subtitle">
          Verdeckte Operationen sind Spielmechanik: Sie kosten Kapital und einen Teil der knappen Kapazität, gelingen nur selten sauber und können auffliegen. Die Welt erfährt nur, was
          auffliegt; hier steht, was Sie angeordnet haben oder was aufgedeckt wurde.
        </p>
      </header>

      <div className="we-dienst-kapazitaet">
        <div className="we-lagebalken">
          <span>
            Dienstkapazität<em>{Math.round(sicht.kapazitaet)} von 100</em>
          </span>
          <i style={{ ["--w" as string]: `${sicht.kapazitaet}%` }} aria-hidden />
        </div>
        <div className="we-dienst-abwehr">
          {sicht.abwehr > 0 ? <span className="we-chip gut">Gegenspionage aktiv: noch {sicht.abwehr} Monate</span> : <span className="we-chip">Gegenspionage nicht verstärkt</span>}
          <button type="button" className="aktion-knopf klein" onClick={gegen} disabled={kapitalOk < OP_DEFS.gegen.pk || sicht.kapazitaet < OP_DEFS.gegen.kap} title={OP_DEFS.gegen.text}>
            Gegenspionage verstärken <b>{OP_DEFS.gegen.pk}</b>
          </button>
        </div>
      </div>

      {antwort && (
        <p className={`we-rueck ${antwort.ok ? "ok" : "nein"}`} role="status">
          {antwort.text}
          {antwort.why && <em> {antwort.why}</em>}
        </p>
      )}

      <section className="we-dienst-ziel">
        <label htmlFor="we-ziel">Zielstaat</label>
        <div className="we-ziel-zeile">
          <Flagge id={ziel} breite={34} />
          <select id="we-ziel" value={ziel} onChange={(e) => { setZiel(e.target.value); setAntwort(null); }}>
            {ANZEIGE_GRUPPEN.map((g) => (
              <optgroup key={g} label={g}>
                {liste.filter((a) => a.gruppe === g).map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <button type="button" className="link" onClick={() => onLand(ziel)}>
            Länderakte öffnen →
          </button>
        </div>
        {wahl ? (
          <p className="we-dienst-wahl">
            <b>
              {wahl.art} am {wahl.datumDe}
            </b>{" "}
            (in {wahl.monate} Monaten). Amtsführung: {wahl.fuehrung.wort}
            {wahl.herausforderer ? `, Herausforderer: ${wahl.herausforderer.wort} (${wahl.herausforderer.staerke})` : ""}.{" "}
            {wahl.lagebild ? `Aussicht der Amtsführung laut Aufklärung: etwa ${wahl.lagebild.prozent} Prozent.` : "Ohne Aufklärung ist die Aussicht unbekannt."}
          </p>
        ) : (
          <p className="we-dienst-wahl we-hinweis">In {akteurName(ziel)} steht keine Wahl an, die sich beeinflussen ließe.</p>
        )}
      </section>

      <ul className="we-ops">
        {optionen.map((o) => (
          <li key={o.def.art} className={`we-op${o.moeglich ? "" : " gesperrt"}`}>
            <div className="we-op-kopf">
              <strong>{o.def.name}</strong>
              <span className="we-chip">Kapital {o.def.pk}</span>
              <span className="we-chip">Kapazität {o.def.kap}</span>
              <span className="we-chip">{o.def.monate} Monate</span>
            </div>
            <p>{o.def.text}</p>
            <div className="we-op-aussicht">
              <span>
                Erfolgsaussicht: <b className={`aus-${o.aussicht.wort}`}>{o.aussicht.wort}</b>
              </span>
              <span>
                Risiko der Aufdeckung: <b className={`risiko-${o.aussicht.aufWort.replace(" ", "-")}`}>{o.aussicht.aufWort}</b>
              </span>
            </div>
            <ul className="we-faktoren">
              {o.aussicht.faktoren.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            {o.lager && (
              <div className="we-lager" role="radiogroup" aria-label="Wessen Lager">
                {o.lager.map((l) => (
                  <label key={l.id}>
                    <input type="radio" name="we-lager" checked={lager === l.id} onChange={() => setLager(l.id)} /> {l.label}
                  </label>
                ))}
              </div>
            )}
            <div className="we-op-fuss">
              <button type="button" className="aktion-knopf" disabled={!o.moeglich} onClick={() => anordnen(o.def.art)}>
                Anordnen
              </button>
              {!o.moeglich && <span className="we-hinweis">{o.grund}</span>}
            </div>
          </li>
        ))}
      </ul>

      {sicht.laufend.length > 0 && (
        <section className="we-dienst-laufend">
          <b>Laufende Operationen</b>
          <ul>
            {sicht.laufend.map((l) => (
              <li key={l.op.id}>
                <Flagge id={l.ziel} breite={26} /> <strong>{l.name}</strong> gegen {akteurName(l.ziel)} — noch {Math.max(1, Math.round(l.restTage / 30))} Monate
              </li>
            ))}
          </ul>
        </section>
      )}

      {sicht.aufgedeckteFremde.length > 0 && (
        <section className="we-dienst-fremd">
          <b>Aufgedeckte Operationen gegen die Türkei</b>
          <ul>
            {sicht.aufgedeckteFremde.map((f, i) => (
              <li key={i}>
                <Flagge id={f.von} breite={26} /> {EINGEHEND_NAME[f.art]} — {akteurName(f.von)}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="we-dienst-bericht">
        <b>Bericht des Dienstes</b>
        {sicht.bericht.length === 0 ? (
          <p className="we-hinweis">Noch nichts angeordnet, noch nichts aufgedeckt.</p>
        ) : (
          <ul>
            {sicht.bericht.slice(0, 12).map((b, i) => (
              <li key={`${b.tag}-${i}`} className={`ausgang-${b.ausgang}`}>
                <span className="we-datum">{formatDateDe(b.datum)}</span> <span className={`we-chip ausgang-${b.ausgang}`}>{AUSGANG[b.ausgang]}</span> <strong>{b.titel}</strong>
                <br />
                <span>{b.text}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
