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

import { t } from "../../i18n";
import { t as tt } from "../../i18n";
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
      <b className="rr-wirkung-kopf">{t("ui.reich.Schaetzblatt.a6dd7bf")}</b>
      <ul className="rr-transit-kette">
        {s.transit.map((tx) => {
          const stand = eintrag.transit?.[tx.land] ?? "offen";
          const gegen = eintrag.transitGegen?.[tx.land];
          return (
            <li key={tx.land} className={`rr-transit-schritt ${stand}`}>
              <span className="rr-transit-land">
                {tx.name}
                {tx.vermutet && <em title={t("ui.reich.Schaetzblatt.6cf7fa3")}> {tt("ui2.ui.reich.Schaetzblatt.a2ce305")}</em>}
              </span>
              <span className={`rr-plakette transit-${stand}`} title={{ offen: "Noch nicht verhandelt", zusage: "Durchfahrt zugesagt", veto: "Verweigert die Durchfahrt", umgangen: "Die Strecke umgeht das Land — teurer" }[stand]}>
                {{ offen: "offen", zusage: "zugesagt", veto: "Veto", umgangen: "Umweg" }[stand]}
              </span>
              {stand === "offen" && (
                <button type="button" className="aktion-knopf" onClick={() => tue(() => transitVerhandeln(welt, id, tx.land))} title={t("ui.reich.Schaetzblatt.cfe8b8e")}>
                  {tt("ui2.ui.reich.Schaetzblatt.4e9e3f8")}
                </button>
              )}
              {stand === "offen" && gegen && (
                <button type="button" className="aktion-knopf" onClick={() => tue(() => transitGegenAnnehmen(welt, id, tx.land))} title={t("ui.reich.Schaetzblatt.97f17a9")}>
                  {tt("ui2.ui.reich.Schaetzblatt.824fbe5")}
                </button>
              )}
              {stand === "veto" && (
                <button type="button" className="aktion-knopf" onClick={() => tue(() => transitUmweg(welt, id, tx.land))} title={tt("ui2.ui.reich.Schaetzblatt.4b76ec4", { p0: Math.round((UMWEG_FAKTOR - 1) * 100) })}>
                  {tt("ui2.ui.reich.Schaetzblatt.7cf5d64", { p0: Math.round((UMWEG_FAKTOR - 1) * 100) })}
                </button>
              )}
            </li>
          );
        })}
      </ul>
      <p className="rr-hinweis">{t("ui.reich.Schaetzblatt.61033b9")}</p>
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
        <span className="rr-klasse">{t("ui.reich.Schaetzblatt.6712edc")}</span>
        <span className="rr-plakette geschaetzt" title={t("ui.reich.Schaetzblatt.8d30067")}>
          {t("ui.reich.Schaetzblatt.59d1b61")}
        </span>
      </div>
      <h4 className="rr-name">{s.name}</h4>
      <p className="rr-text">
        {tt("ui2.ui.reich.Schaetzblatt.888b919", { p0: s.eingabe, p1: PROJEKT_TYP_NAMEN[s.typ], p2: MASSSTAB_NAMEN[s.massstab] })}
      </p>

      <ul className="rr-kosten" aria-label={t("ui.reich.Schaetzblatt.6573ad3")}>
        <li title={t("ui.reich.Schaetzblatt.031fe90")}>
          <b>{bandText(s.pk)}</b> {tt("ui2.ui.reich.Schaetzblatt.28d438e")}
        </li>
        <li title={t("ui.reich.Schaetzblatt.d33602a")}>
          <b>{bandText(s.bau)}</b> {tt("ui2.ui.reich.Schaetzblatt.f4466ae")}
        </li>
        <li title={t("ui.reich.Schaetzblatt.afeadd0")}>
          <b>{bandText(s.monate)}</b> {tt("ui2.ui.reich.Schaetzblatt.1c561ae")}
        </li>
        <li title={t("ui.reich.Schaetzblatt.ce0bf09")}>
          <b>{bandText(s.schulden)}</b> % BIP
        </li>
        <li title={tt("ui2.ui.reich.Schaetzblatt.70cf379")}>
          <b>{s.verwaltung}</b> {tt("ui2.ui.reich.Schaetzblatt.48ddb61")}
        </li>
      </ul>

      {s.wirkungen.length > 0 && (
        <div className="rr-wirkung">
          <b className="rr-wirkung-kopf">{t("ui.reich.Schaetzblatt.94a93c9")}</b>
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
          <b className="rr-wirkung-kopf">{tt("ui2.ui.reich.Schaetzblatt.bf36b8c")}</b>
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
          <b className="rr-wirkung-kopf">{tt("ui2.ui.reich.Schaetzblatt.88423dd")}</b>
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
        <b>{t("ui.reich.Schaetzblatt.f9dde96")}</b> {s.mentor}
      </blockquote>

      {meldung && <p className="rr-ergebnis ok" role="status">{meldung}</p>}

      {!vergabeWahl && (
        <div className="rr-bau-knoepfe">
          <button type="button" className="aktion-knopf rr-beginnen" disabled={transitOffen} onClick={() => setVergabeWahl(true)} title={transitOffen ? tt("ui2.ui.reich.Schaetzblatt.87561fd") : tt("ui2.ui.reich.Schaetzblatt.de27dd9")}>
            {tt("ui2.ui.reich.Schaetzblatt.922ea87")}
            {transitOffen && <small> {tt("ui2.ui.reich.Schaetzblatt.0b091d0")}</small>}
          </button>
          <button type="button" className="link" onClick={verwerfen}>
            {tt("ui2.ui.reich.Schaetzblatt.24cc57b")}
          </button>
        </div>
      )}
      {vergabeWahl && (
        <div className="rr-vergabe">
          <b className="rr-wirkung-kopf">{t("ui.reich.Schaetzblatt.1c4cddd")}</b>
          <ul>
            {VERGABE_REIHENFOLGE.map((weg) => {
              const a = vergabeAngebot(v, weg);
              const unbezahlbar = kapital + 1e-9 < a.pk;
              return (
                <li key={weg}>
                  <button type="button" className="aktion-knopf" disabled={unbezahlbar} onClick={() => annehmen(weg)} title={unbezahlbar ? tt("ui2.ui.reich.Schaetzblatt.36325d8", { p0: a.pk }) : undefined}>
                    {VERGABE_NAMEN[weg]}
                  </button>
                  <span className="rr-bau-info">
                    {tt("ui2.ui.reich.Schaetzblatt.632836b", { p0: a.pk, p1: a.bau, p2: a.monate })} {a.monate === 1 ? tt("ui2.ui.reich.Schaetzblatt.da13625") : tt("ui2.ui.reich.Schaetzblatt.1c561ae")}
                    {a.vorlauf > 0 ? tt("ui2.ui.reich.Schaetzblatt.a3ec358", { p0: a.vorlauf }) : ""} <em>{t("ui.reich.Schaetzblatt.73cad39")}</em>
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="rr-hinweis">{t("ui.reich.Schaetzblatt.753fd68")}</p>
          <button type="button" className="link" onClick={() => setVergabeWahl(false)}>
            {t("ui.reich.Schaetzblatt.4080624")}
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
        {tt("ui2.ui.reich.Schaetzblatt.9c6586f")} <em>{entwuerfe.length} {entwuerfe.length === 1 ? tt("ui2.ui.reich.Schaetzblatt.8dc9f00") : tt("ui2.ui.reich.Schaetzblatt.9ec947f")} {tt("ui2.ui.reich.Schaetzblatt.f33aa6c")}</em>
      </h4>
      <div className="rr-raster gross">
        {entwuerfe.map(({ id, eintrag }) => (
          <Schaetzblatt key={id} welt={world} id={id} eintrag={eintrag} refresh={refresh} />
        ))}
      </div>
    </section>
  );
}
