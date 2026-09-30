// Entlassen und Ernennen als Prozess: Folgen der Entlassung, drei Kandidaten mit Profil, Kosten, Marktreaktion.

import { useMemo, useState } from "react";
import type { World } from "../../sim/types";
import type { Figur } from "../../sim/spiel-typen";
import { entlasse, entlassungsFolgen, ernenneNachfolger, kandidatenFuer, KOMMISSARISCH_PK } from "../../sim/nachfolge";
import { kannZahlen } from "../../sim/kapital";
import { AEMTER, ehrgeizWort } from "../../sim/personen";
import { LAGER_NAMEN, STIL_NAMEN } from "../../sim/personen-typen";
import { Cameo } from "../art/Cameo";
import { Balken, LAGER_FARBE, Marke, Portraet } from "./bausteine";

export interface WechselMeldung {
  ok: boolean;
  text: string;
  why?: string;
  folgen: string[];
}

/** `modus` „entlassen“ setzt einen neuen Menschen an die Stelle des Amtsinhabers; „nachfolge“ ersetzt eine kommissarische Leitung. */
export function NachfolgeAuswahl({ world, figur, modus, refresh, onFertig }: { world: World; figur: Figur; modus: "entlassen" | "nachfolge"; refresh: () => void; onFertig: (m?: WechselMeldung) => void }) {
  const [gewaehlt, setGewaehlt] = useState<string | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);
  const kandidaten = useMemo(() => kandidatenFuer(world, figur.amt), [world, figur.amt, figur.name]);
  const folgen = useMemo(() => (modus === "entlassen" ? entlassungsFolgen(world, figur.amt) : []), [world, figur.amt, modus, figur.name]);
  const spiel = world.spiel!;
  const d = AEMTER[figur.amt];
  const k = kandidaten.find((x) => x.id === gewaehlt);
  const pk = k ? (modus === "entlassen" ? k.pk : Math.max(1, k.pk - 1)) : modus === "entlassen" ? KOMMISSARISCH_PK : 0;

  function ausfuehren(kommissarisch: boolean) {
    const r = modus === "nachfolge" ? ernenneNachfolger(world, figur.amt, gewaehlt ?? "") : entlasse(world, figur.amt, kommissarisch ? null : gewaehlt);
    if (!r.ok) {
      setFehler(r.text);
      return;
    }
    refresh();
    onFertig(r);
  }

  return (
    <div className="pe-szene">
      <div className="pe-szenenkopf">
        <Portraet w={world} f={figur} size={52} />
        <div>
          <h3>{modus === "entlassen" ? `${figur.rolle} ${figur.name} entlassen` : `Nachfolge für ${d.ressort}`}</h3>
          <div className="pe-rolle">{modus === "entlassen" ? "Wer soll das Amt übernehmen?" : `${figur.name} führt das Amt nur kommissarisch.`}</div>
        </div>
        <div className="pe-termine">Kapital: {Math.floor(spiel.kapital)}</div>
      </div>

      {modus === "entlassen" && (
        <div className="pe-warn" role="note">
          <strong>Folgen der Entlassung</strong>
          <ul>
            {folgen.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="pe-kandidaten">
        {kandidaten.map((c) => (
          <div key={c.id} className={`pe-kandidat${gewaehlt === c.id ? " on" : ""}`}>
            <header>
              <Cameo seed={c.name} size={44} figure={c.weiblich ? "f" : "m"} tint={LAGER_FARBE[c.lager]} />
              <div>
                <strong>{c.name}</strong>
                <em>{c.herkunft}</em>
              </div>
            </header>
            <div className="pe-marken">
              <Marke>{STIL_NAMEN[c.stil]}</Marke>
              <Marke art="gold">{LAGER_NAMEN[c.lager]}</Marke>
            </div>
            <Balken label="Fähigkeit" wert={c.faehigkeit} wort={String(c.faehigkeit)} klein />
            <Balken label="Ehrgeiz" wert={c.ehrgeiz} ton={c.ehrgeiz >= 75 ? "schlecht" : "gut"} wort={ehrgeizWort(c.ehrgeiz)} klein hinweis="Hoher Ehrgeiz: gefährlich, wenn er übergangen wird" />
            <Balken label="Gesinnung gegenüber Ihnen" wert={c.loyalitaet} wort={String(c.loyalitaet)} klein />
            <p className="pe-plus">+ {c.staerke}</p>
            <p className="pe-minus">− {c.schwaeche}</p>
            {c.markt !== 0 && (
              <p className={c.markt < 0 ? "pe-plus" : "pe-minus"}>
                Märkte: Risikoaufschlag {c.markt < 0 ? "" : "+"}
                {c.markt} Punkte
              </p>
            )}
            <button className="pe-aktion haupt" disabled={!kannZahlen(spiel.kapital, modus === "entlassen" ? c.pk : Math.max(1, c.pk - 1))} onClick={() => setGewaehlt(c.id)}>
              {gewaehlt === c.id ? "Ausgewählt" : "Auswählen"} <b>{modus === "entlassen" ? c.pk : Math.max(1, c.pk - 1)}</b>
            </button>
          </div>
        ))}
      </div>

      {fehler && (
        <p className="pe-rueck nein" role="alert">
          {fehler}
        </p>
      )}
      <div className="pe-aktionen">
        <button className="pe-aktion haupt" disabled={!k || !kannZahlen(spiel.kapital, pk)} onClick={() => ausfuehren(false)}>
          {modus === "entlassen" ? "Entlassen und ernennen" : "Ernennen"}
          {k ? ` (${pk} Kapital)` : ""}
        </button>
        {modus === "entlassen" && (
          <button className="pe-aktion" disabled={!kannZahlen(spiel.kapital, KOMMISSARISCH_PK)} onClick={() => ausfuehren(true)} title="Ein Staatssekretär führt das Amt, bis Sie sich entschieden haben; er leistet weniger.">
            Nur entlassen, kommissarisch besetzen <b>{KOMMISSARISCH_PK}</b>
          </button>
        )}
        <button className="pe-aktion leise" onClick={() => onFertig()}>
          Abbrechen
        </button>
      </div>
    </div>
  );
}
