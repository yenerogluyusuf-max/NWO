// Entlassen und Ernennen als Prozess: Folgen der Entlassung, drei Kandidaten mit Profil, Kosten, Marktreaktion.
//
// Aufbau von oben nach unten: wer geht · was das kostet (Folgen) · wer folgen könnte (gleich aufgebaute Karten) · die Entscheidung.
// Jede Kandidatenkarte hat dieselben Zeilen in derselben Reihenfolge (Gesicht, Marken, drei Balken, Stärke, Schwäche, Märkte, Fuß mit
// Kosten und Knopf); die Karten einer Reihe sind gleich hoch, der Knopf sitzt immer am Fuß.

import { useMemo, useState } from "react";
import type { World } from "../../sim/types";
import type { Figur } from "../../sim/spiel-typen";
import { entlasse, entlassungsFolgen, ernenneNachfolger, kandidatenFuer, KOMMISSARISCH_PK } from "../../sim/nachfolge";
import { kannZahlen } from "../../sim/kapital";
import { AEMTER, ehrgeizWort } from "../../sim/personen";
import { LAGER_NAMEN, STIL_NAMEN } from "../../sim/personen-typen";
import { Icon } from "../icons";
import { Balken, Gesicht, Marke, Portraet } from "./bausteine";

import { t } from "../../i18n";
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
  const kostenVon = (pk: number) => (modus === "entlassen" ? pk : Math.max(1, pk - 1));
  const pk = k ? kostenVon(k.pk) : modus === "entlassen" ? KOMMISSARISCH_PK : 0;

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
    <div className="pe-szene pe-nachfolge">
      <div className="pe-szenenkopf">
        <Portraet w={world} f={figur} size={110} />
        <div>
          <h3>{modus === "entlassen" ? `${figur.rolle} ${figur.name} entlassen` : `Nachfolge für ${d.ressort}`}</h3>
          <div className="pe-rolle">{modus === "entlassen" ? "Erst die Folgen prüfen, dann den Nachfolger wählen." : `${figur.name} führt das Amt nur kommissarisch.`}</div>
        </div>
        <div className="pe-termine">
          Kapital: <b>{Math.floor(spiel.kapital)}</b>
        </div>
      </div>

      {modus === "entlassen" && (
        <section className="pe-folgenkasten" aria-label={t("ui.personen.NachfolgeAuswahl.32e7bf5")}>
          <h4>
            <Icon name="warnung" size={16} />
            Folgen der Entlassung
          </h4>
          <ul>
            {folgen.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </section>
      )}

      <h4 className="pe-abschnitt">
        {modus === "entlassen" ? "Wer soll das Amt übernehmen?" : "Wen ernennen Sie?"} <small>{kandidaten.length} Kandidaten · einen wählen</small>
      </h4>
      <div className="pe-kandidaten">
        {kandidaten.map((c) => {
          const kosten = kostenVon(c.pk);
          const leistbar = kannZahlen(spiel.kapital, kosten);
          const an = gewaehlt === c.id;
          return (
            <article key={c.id} className={`pe-kandidat${an ? " on" : ""}`} aria-label={c.name}>
              <header>
                <Gesicht name={c.name} weiblich={c.weiblich} lager={c.lager} size={100} rolle={figur.amt} />
                <div>
                  <strong>{c.name}</strong>
                  <em>{c.herkunft}</em>
                </div>
              </header>
              <div className="pe-marken">
                <Marke>{STIL_NAMEN[c.stil]}</Marke>
                <Marke art="gold">{LAGER_NAMEN[c.lager]}</Marke>
              </div>
              <div className="pe-werte-spalte">
                <Balken label={t("ui.personen.NachfolgeAuswahl.132b486")} wert={c.faehigkeit} wort={String(c.faehigkeit)} klein />
                <Balken label="Ehrgeiz" wert={c.ehrgeiz} ton={c.ehrgeiz >= 75 ? "schlecht" : "gut"} wort={ehrgeizWort(c.ehrgeiz)} klein {...(c.ehrgeiz >= 75 ? { zeile: "Gefährlich, wenn er übergangen wird." } : {})} />
                <Balken label={t("ui.personen.NachfolgeAuswahl.61ae3ec")} wert={c.loyalitaet} wort={String(c.loyalitaet)} klein />
              </div>
              <p className="pe-plus">
                <b>+</b> {c.staerke}
              </p>
              <p className="pe-minus">
                <b>−</b> {c.schwaeche}
              </p>
              <p className={c.markt === 0 ? "pe-markt leer" : c.markt < 0 ? "pe-markt pe-plus" : "pe-markt pe-minus"}>
                {c.markt !== 0 && (
                  <>
                    Märkte: Risikoaufschlag {c.markt < 0 ? "" : "+"}
                    {c.markt} Punkte
                  </>
                )}
              </p>
              <footer className="pe-kfuss">
                <span className={`pe-kosten${leistbar ? "" : " knapp"}`} title={leistbar ? "Politisches Kapital, das die Ernennung kostet" : "Dafür reicht Ihr Kapital nicht"}>
                  {kosten} Kapital
                </span>
                <button className={`pe-aktion ${an ? "haupt" : ""}`} disabled={!leistbar} aria-pressed={an} onClick={() => setGewaehlt(c.id)}>
                  {an && <Icon name="haken" size={16} />}
                  {an ? "Ausgewählt" : "Auswählen"}
                </button>
              </footer>
            </article>
          );
        })}
      </div>

      {fehler && (
        <p className="pe-rueck nein" role="alert">
          {fehler}
        </p>
      )}

      <div className="pe-entscheidung">
        <p className={`pe-gewaehlt${k ? "" : " leer"}`} role="status">
          {k ? (
            <>
              Gewählt: <strong>{k.name}</strong> · {pk} Kapital
            </>
          ) : modus === "entlassen" ? (
            "Noch niemand gewählt. Sie können auch nur entlassen und das Amt kommissarisch besetzen."
          ) : (
            "Noch niemand gewählt."
          )}
        </p>
        <div className="pe-wege">
          <button className="pe-aktion haupt" disabled={!k || !kannZahlen(spiel.kapital, pk)} onClick={() => ausfuehren(false)} title={k ? undefined : "Wählen Sie zuerst einen Kandidaten"}>
            {modus === "entlassen" ? "Entlassen und ernennen" : "Ernennen"}
            {k && <b>{pk}</b>}
          </button>
          {modus === "entlassen" && (
            <button className="pe-aktion" disabled={!kannZahlen(spiel.kapital, KOMMISSARISCH_PK)} onClick={() => ausfuehren(true)} title={t("ui.personen.NachfolgeAuswahl.74c09bc")}>
              Nur entlassen, kommissarisch besetzen
              <b>{KOMMISSARISCH_PK}</b>
            </button>
          )}
          <button className="pe-aktion leise pe-abbruch" onClick={() => onFertig()}>
            {t("ui.personen.NachfolgeAuswahl.07af7cb")}
          </button>
        </div>
      </div>
    </div>
  );
}
