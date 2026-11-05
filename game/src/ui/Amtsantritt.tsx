// Das Startbild (Rückmeldung des Projektinhabers 05.11.2026: „der Wahlsieg kann direkt eingeblendet werden“; ENTSCHEIDUNGEN V):
// Links das Wahlergebnis als Bild (Halbrund mit Lager und 301-Linie, Ergebnis der Präsidentenwahl, Lage zum Amtsantritt), rechts die
// Zielwahl als Kacheln mit dem heutigen Stand, Schwierigkeit und „Amt antreten“. Ein Bildschirm, kein Scrollen, kein Textblock davor.
// Ersetzt das Fenster „Amtsübergabe“ und die lange Zielliste des ersten Tages.

import { useMemo, useState } from "react";
import type { World } from "../sim/types";
import { ZIELE, type ZielDef } from "../sim/ziele";
import { SCHWIERIGKEITEN, type Schwierigkeit } from "../sim/spiel";
import { parlamentsLage } from "./parlament/lage";
import { Sitzplan } from "./parlament/Halbrund";
import { Corners } from "./art/Ornament";
import { Icon, type IconName } from "./icons";
import { formatDateDe } from "../sim/dates";
import { t, zahl } from "../i18n";
import "./amtsantritt.css";

/** Zeichen je Ziel; fehlt eines, das des Bereichs. */
const ZIEL_ICON: Record<string, IconName> = {
  inflation15: "preis", arbeit8: "fabrik", schulden30: "lira", wasserstrom: "tropfen", erdbeben: "beben", wohnen: "haus", aerzte: "krankenhaus",
  strassen: "strasse", partner5: "haende", frieden: "siegel", vertraege3: "tausch", ansehen60: "karte", mehrheit: "parlament", vertrauen60: "menge",
  rechtsstaat60: "waage", ordnung: "warnung", wort: "feder", kabinett: "person",
};
const BEREICH_ICON: Record<NonNullable<ZielDef["bereich"]>, IconName> = { wirtschaft: "lira", land: "karte", aussen: "tausch", staat: "parlament" };
const BEREICHE: NonNullable<ZielDef["bereich"]>[] = ["wirtschaft", "land", "aussen", "staat"];

export function Amtsantritt({ world, onFertig }: { world: World; onFertig: (ids: string[], schwierigkeit: Schwierigkeit) => void }) {
  const [gewaehlt, setGewaehlt] = useState<string[]>([]);
  const [schwer, setSchwer] = useState<Schwierigkeit>("normal");
  const [fokus, setFokus] = useState<string | null>(null);
  const p = world.player;
  const lage = parlamentsLage(world);
  // Der heutige Stand jedes Ziels, einmal gerechnet (die Zeit steht am ersten Tag)
  const ziele = useMemo(
    () => BEREICHE.flatMap((b) => ZIELE.filter((z) => !z.nurLetzte && (z.bereich ?? "land") === b)).map((def) => ({ def, stand: def.pruefe(world).stand })),
    [world],
  );
  const umschalten = (id: string) => setGewaehlt((g) => (g.includes(id) ? g.filter((x) => x !== id) : g.length < 3 ? [...g, id] : g));
  const detail = ziele.find((z) => z.def.id === (fokus ?? gewaehlt.at(-1)));
  const monate = Math.max(1, Math.round(((world.spiel?.wahltag ?? world.day) - world.day) / 30.44));
  const partner = lage?.fraktionen.filter((f) => f.rolle === "lager" && f.partei !== lage.eigene) ?? [];
  const eigene = lage?.fraktionen.find((f) => f.partei === lage.eigene);
  const mehrheit = (lage?.lager ?? 0) >= 301;
  return (
    <div className="event-layer" role="dialog" aria-modal="true" aria-labelledby="antritt-titel">
      <article className="frame event-window antritt">
        <Corners />
        <section className="antritt-wahl" aria-label={t("antritt.wahlAria")}>
          <p className="kicker">{t("antritt.kicker", { datum: formatDateDe(world.date) })}</p>
          <h2 id="antritt-titel">{t("antritt.titel", { name: p?.name ?? "", g: p?.aussehen?.geschlecht ?? "m" })}</h2>
          <div className="antritt-zahlen">
            <div>
              <b>{zahl(p?.wahl.anteil ?? 0, 1)} %</b>
              <span>{t(p?.wahl.runde === 2 ? "antritt.stichwahl" : "antritt.ersterGang")}</span>
            </div>
            <div className={mehrheit ? "gut" : "schlecht"}>
              <b>{lage?.lager ?? 0}<small>/600</small></b>
              <span>{t(mehrheit ? "antritt.mehrheit" : "antritt.keineMehrheit")}</span>
            </div>
            <div>
              <b>{zahl(world.published.inflation.value, 1)} %</b>
              <span>{t("antritt.inflation")}</span>
            </div>
            <div>
              <b>{monate >= 18 ? t("antritt.jahre", { n: Math.round(monate / 12) }) : t("antritt.monate", { n: monate })}</b>
              <span>{t("antritt.bisWahl")}</span>
            </div>
          </div>
          {lage && (
            <Sitzplan
              lage={lage}
              mehrheitslinie
              aria={t("antritt.halbrundAria", { lager: lage.lager })}
              mitte={<span className="antritt-mitte"><b>{lage.lager}</b><small>{t("antritt.lager")}</small></span>}
            />
          )}
          <ul className="antritt-parteien">
            {eigene && <li style={{ borderColor: eigene.farbe }}><b>{eigene.name}</b> {eigene.sitze}</li>}
            {partner.map((f) => <li key={f.partei} style={{ borderColor: f.farbe }}>{f.name} {f.sitze}</li>)}
          </ul>
        </section>

        <section className="antritt-ziele" aria-labelledby="antritt-ziele-titel">
          <h3 id="antritt-ziele-titel">{t("ziel.start.titel")}</h3>
          <p className="antritt-hinweis">{t("antritt.zieleHinweis", { n: gewaehlt.length })}</p>
          <ul className="antritt-kacheln">
            {ziele.map(({ def: z, stand }) => {
              const nr = gewaehlt.indexOf(z.id);
              return (
                <li key={z.id}>
                  <button
                    type="button"
                    className={`antritt-kachel b-${z.bereich ?? "land"}${nr >= 0 ? " on" : ""}`}
                    aria-pressed={nr >= 0}
                    onClick={() => umschalten(z.id)}
                    onMouseEnter={() => setFokus(z.id)}
                    onMouseLeave={() => setFokus(null)}
                    onFocus={() => setFokus(z.id)}
                    onBlur={() => setFokus(null)}
                  >
                    <Icon name={ZIEL_ICON[z.id] ?? BEREICH_ICON[z.bereich ?? "land"]} size={18} />
                    <strong>{z.titel}</strong>
                    {stand && <small>{stand}</small>}
                    {nr >= 0 && <i className="antritt-nr">{nr + 1}</i>}
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="antritt-detail" aria-live="polite">{detail ? <><b>{detail.def.titel}:</b> {detail.def.beschreibung}</> : t("antritt.detailLeer")}</p>
          <div className="antritt-fuss">
            <div className="antritt-schwer" role="radiogroup" aria-label={t("ziel.ui.schwierigkeit")}>
              {(Object.keys(SCHWIERIGKEITEN) as Schwierigkeit[]).map((k) => (
                <button key={k} type="button" role="radio" aria-checked={schwer === k} className={schwer === k ? "on" : ""} onClick={() => setSchwer(k)} title={SCHWIERIGKEITEN[k].text}>
                  {SCHWIERIGKEITEN[k].name}
                </button>
              ))}
            </div>
            <button type="button" className="brass-button" onClick={() => onFertig(gewaehlt, schwer)}>
              {gewaehlt.length ? t("antritt.antreten", { n: gewaehlt.length }) : t("antritt.antretenOhne")}
            </button>
          </div>
          <p className="antritt-schwer-text">{SCHWIERIGKEITEN[schwer].text}</p>
        </section>
      </article>
    </div>
  );
}
