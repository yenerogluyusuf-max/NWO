// Das Schätzblatt eines freien Großprojekts (INF-4): Bänder statt Festpreise, Risiken, die
// Zweitrundeneffekte für Nachbarn, die Transit-Kette mit ihren Verhandlungen (Bagdadbahn-Logik)
// und die Mentorin-Box, die Richtung und Bandbreite erklärt — nie exakte Zahlen.
// Nach der Annahme wird daraus ein normales Vorhaben mit „geschätzt"-Markierung.

import { useState } from "react";
import type { World } from "../../sim/types";
import type { Band, FreiEintrag, Vergabe } from "../../sim/reich-typen";
import { MASSSTAB_NAMEN, PROJEKT_TYP_NAMEN, VERGABE_NAMEN } from "../../sim/reich-typen";
import { vergabeAngebot } from "../../sim/reich";
import { beginneFrei, freieEntwuerfe, transitGegenAnnehmen, transitUmweg, transitVerhandeln, UMWEG_FAKTOR, verwerfeFrei } from "../../sim/grossprojekt";
import { land } from "../../sim/laender";

const fmt = (x: number): string => x.toLocaleString("de-DE", { maximumFractionDigits: 1 });
const bandText = (b: Band): string => `${fmt(b.tief)} bis ${fmt(b.hoch)}`;

const VERGABE_REIHENFOLGE: Vergabe[] = ["stammfirma", "sparvergabe", "ausschreibung"];

function TransitKette({ welt, id, eintrag, refresh, melde }: { welt: World; id: string; eintrag: FreiEintrag; refresh: () => void; melde: (t: string) => void }) {
  const s = eintrag.schaetzung;
  if (!s.transit?.length) return null;
  const tue = (fn: () => { ok: boolean; text: string }) => {
    const r = fn();
    melde(r.text);
    refresh();
  };
  return (
    <div className="rr-transit">
      <b className="rr-wirkung-kopf">Grenzübertritt — jedes Land verhandelt ein eigenes Paket am Verhandlungstisch</b>
      <ul className="rr-transit-kette">
        {s.transit.map((t) => {
          const stand = eintrag.transit?.[t.land] ?? "offen";
          const gegen = eintrag.transitGegen?.[t.land];
          return (
            <li key={t.land} className={`rr-transit-schritt ${stand}`}>
              <span className="rr-transit-land">
                {t.name}
                {t.vermutet && <em title="Vom Interpreter ergänzter Korridor, nicht von Ihnen genannt"> (vermuteter Korridor)</em>}
              </span>
              <span className={`rr-plakette transit-${stand}`} title={{ offen: "Noch nicht verhandelt", zusage: "Durchfahrt zugesagt", veto: "Verweigert die Durchfahrt", umgangen: "Die Strecke umgeht das Land — teurer" }[stand]}>
                {{ offen: "offen", zusage: "zugesagt", veto: "Veto", umgangen: "Umweg" }[stand]}
              </span>
              {stand === "offen" && (
                <button type="button" className="aktion-knopf" onClick={() => tue(() => transitVerhandeln(welt, id, t.land))} title="Paket am Verhandlungstisch: die Türkei bietet ihre besten Klauseln und verlangt die Durchfahrt. Kostet Kapital.">
                  Verhandeln
                </button>
              )}
              {stand === "offen" && gegen && (
                <button type="button" className="aktion-knopf" onClick={() => tue(() => transitGegenAnnehmen(welt, id, t.land))} title="Das nachgebesserte Paket des Landes annehmen.">
                  Gegenangebot annehmen
                </button>
              )}
              {stand === "veto" && (
                <button type="button" className="aktion-knopf" onClick={() => tue(() => transitUmweg(welt, id, t.land))} title={`Das Veto steht. Der Umweg macht den Bau etwa ${Math.round((UMWEG_FAKTOR - 1) * 100)} % teurer und ein Viertel länger.`}>
                  Umweg wählen (+{Math.round((UMWEG_FAKTOR - 1) * 100)} % Bau)
                </button>
              )}
            </li>
          );
        })}
      </ul>
      <p className="rr-hinweis">Ein einziges Veto macht die Strecke tot — oder den Umweg teurer (Bagdadbahn-Regel).</p>
    </div>
  );
}

export function Schaetzblatt({ welt, id, eintrag, refresh }: { welt: World; id: string; eintrag: FreiEintrag; refresh: () => void }) {
  const [vergabeWahl, setVergabeWahl] = useState(false);
  const [meldung, setMeldung] = useState<string | null>(null);
  const s = eintrag.schaetzung;
  const v = eintrag.def;
  const transitOffen = Object.values(eintrag.transit ?? {}).some((st) => st === "offen" || st === "veto");
  const kapital = welt.spiel?.kapital ?? 0;

  const annehmen = (weg: Vergabe) => {
    const r = beginneFrei(welt, id, weg);
    setVergabeWahl(false);
    setMeldung(r.text);
    refresh();
  };
  const verwerfen = () => {
    const r = verwerfeFrei(welt, id);
    setMeldung(r.text);
    refresh();
  };

  return (
    <article className={`rr-karte klasse-${s.klasse} rr-schaetz`}>
      <div className="rr-karte-kopf">
        <span className="rr-klasse">Freies Großprojekt</span>
        <span className="rr-plakette geschaetzt" title="Kosten, Dauer und Wirkungen sind Schätzungen aus dem 3-Ebenen-Modell; die Überschreitung kommt erfahrungsgemäß erst im Bau.">
          geschätzt
        </span>
      </div>
      <h4 className="rr-name">{s.name}</h4>
      <p className="rr-text">
        Ihre Eingabe: „{s.eingabe}“ — {PROJEKT_TYP_NAMEN[s.typ]}, {MASSSTAB_NAMEN[s.massstab]}.
      </p>

      <ul className="rr-kosten" aria-label="Geschätzte Kosten (Bandbreiten)">
        <li title="Politisches Kapital beim Beginn (Bandbreite)">
          <b>{bandText(s.pk)}</b> Kapital
        </li>
        <li title="Baupunkte insgesamt; die Überschreitung treibt das obere Ende">
          <b>{bandText(s.bau)}</b> Baupunkte
        </li>
        <li title="Bauzeit; die Vergabe und die Überschreitung wirken darauf">
          <b>{bandText(s.monate)}</b> Monate
        </li>
        <li title="Schuldenquote über die Bauzeit">
          <b>{bandText(s.schulden)}</b> % BIP
        </li>
        <li title="Verwaltungskraft je Monat im Bau">
          <b>{s.verwaltung}</b> Verwaltung/Monat
        </li>
      </ul>

      {s.wirkungen.length > 0 && (
        <div className="rr-wirkung">
          <b className="rr-wirkung-kopf">Wirkung (Richtung und Bandbreite, verwirklicht erst bei der Annahme)</b>
          <ul>
            {s.wirkungen.slice(0, 8).map((wg) => (
              <li key={wg.name} className={wg.gut ? "rr-gut" : "rr-schlecht"}>
                <span aria-hidden>{wg.richtung > 0 ? "▲" : "▼"}</span> {wg.name}
                {wg.wo ? ` ${wg.wo.trim()}` : ""}: {bandText(wg.band)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {s.risiken.length > 0 && (
        <div className="rr-wirkung">
          <b className="rr-wirkung-kopf">Risiken</b>
          <ul>
            {s.risiken.map((r) => (
              <li key={r.name} className="rr-risiko" title={r.text}>
                <b>{r.name}:</b> {r.wert}
              </li>
            ))}
          </ul>
        </div>
      )}

      {s.nachbarn.length > 0 && (
        <div className="rr-wirkung">
          <b className="rr-wirkung-kopf">Zweitrundeneffekt: Nachbarn nehmen ab</b>
          <ul>
            {s.nachbarn.map((n) => (
              <li key={n.name} className="rr-schlecht" title={n.text}>
                <span aria-hidden>▼</span> {n.name}
              </li>
            ))}
          </ul>
        </div>
      )}

      <TransitKette welt={welt} id={id} eintrag={eintrag} refresh={refresh} melde={setMeldung} />

      <blockquote className="rr-mentor">
        <b>Die Mentorin erklärt:</b> {s.mentor}
      </blockquote>

      {meldung && <p className="rr-ergebnis ok" role="status">{meldung}</p>}

      {!vergabeWahl && (
        <div className="rr-bau-knoepfe">
          <button type="button" className="aktion-knopf rr-beginnen" disabled={transitOffen} onClick={() => setVergabeWahl(true)} title={transitOffen ? "Erst müssen alle Durchfahrten zugesagt oder umgangen sein." : "Die Bänder werden verwirklicht und das Vorhaben beginnt."}>
            Annehmen und vergeben
            {transitOffen && <small> (Transit offen)</small>}
          </button>
          <button type="button" className="link" onClick={verwerfen}>
            Verwerfen
          </button>
        </div>
      )}
      {vergabeWahl && (
        <div className="rr-vergabe">
          <b className="rr-wirkung-kopf">Wie wird der Auftrag vergeben? Die Wahl steht danach fest.</b>
          <ul>
            {VERGABE_REIHENFOLGE.map((weg) => {
              const a = vergabeAngebot(v, weg);
              const unbezahlbar = kapital + 1e-9 < a.pk;
              return (
                <li key={weg}>
                  <button type="button" className="aktion-knopf" disabled={unbezahlbar} onClick={() => annehmen(weg)} title={unbezahlbar ? `Dafür fehlt Kapital (${a.pk} nötig).` : undefined}>
                    {VERGABE_NAMEN[weg]}
                  </button>
                  <span className="rr-bau-info">
                    {a.pk} Kapital · {a.bau} Baupunkte · {a.monate} {a.monate === 1 ? "Monat" : "Monate"}
                    {a.vorlauf > 0 ? ` + ${a.vorlauf} Monate Vergabephase` : ""} <em>(aus der Mitte der Bänder)</em>
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="rr-hinweis">Bei der Annahme fallen die Würfe: Wirkungen und Verkehre werden im Band verwirklicht; die Überschreitung entscheidet sich erst im Bau.</p>
          <button type="button" className="link" onClick={() => setVergabeWahl(false)}>
            Zurück
          </button>
        </div>
      )}
    </article>
  );
}

/** Alle Schätzblätter des Reichs, die noch nicht begonnen wurden. */
export function Schaetzblaetter({ world, refresh }: { world: World; refresh: () => void }) {
  const entwuerfe = freieEntwuerfe(world).filter((x) => x.eintrag.stand === "entwurf");
  if (!entwuerfe.length) return null;
  return (
    <section className="rr-abschnitt">
      <h4>
        Freie Großprojekte <em>{entwuerfe.length} {entwuerfe.length === 1 ? "Schätzblatt" : "Schätzblätter"} — Bänder statt Festpreise; verhandelt wird an der Grenze wie im Land</em>
      </h4>
      <div className="rr-raster gross">
        {entwuerfe.map(({ id, eintrag }) => (
          <Schaetzblatt key={id} welt={world} id={id} eintrag={eintrag} refresh={refresh} />
        ))}
      </div>
    </section>
  );
}
