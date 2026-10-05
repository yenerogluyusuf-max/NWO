// Zielwahl: am ersten Spieltag und zu Beginn jeder weiteren Amtszeit wählt der Präsident bis zu drei Ziele. Die Bilanz misst sie am Ende.
// Zum Start steht die ganze Liste zur Wahl; zu Beginn einer weiteren Amtszeit nur, was noch nicht erreicht ist, mit dem Stand beim Angebot.

import { useState } from "react";
import { ZIELE, type ZielAngebot, type ZielDef } from "../sim/ziele";
import { SCHWIERIGKEITEN, type Schwierigkeit } from "../sim/spiel";
import { Corners, Flourish } from "./art/Ornament";
import { Icon } from "./icons";
import { t } from "../i18n";

const BEREICHE: NonNullable<ZielDef["bereich"]>[] = ["wirtschaft", "land", "aussen", "staat"];

export function ZielWahl({
  onFertig,
  angebot,
  modus = "start",
}: {
  onFertig: (ids: string[], schwierigkeit: Schwierigkeit) => void;
  /** Die zur Wahl stehenden Ziele mit Stand; fehlt es, steht die ganze Liste zur Wahl (erster Tag) */
  angebot?: ZielAngebot[];
  modus?: "start" | "amtszeit";
}) {
  const [gewaehlt, setGewaehlt] = useState<string[]>([]);
  const [schwer, setSchwer] = useState<Schwierigkeit>("normal");
  const umschalten = (id: string) => setGewaehlt((g) => (g.includes(id) ? g.filter((x) => x !== id) : g.length < 3 ? [...g, id] : g));
  const liste: { def: ZielDef; stand?: string }[] = angebot ? angebot.map((a) => ({ def: a.def, stand: a.stand })) : ZIELE.filter((z) => !z.nurLetzte).map((def) => ({ def }));
  const amtszeit = modus === "amtszeit";
  const gruppen = BEREICHE.map((b) => ({ bereich: b, ziele: liste.filter((z) => (z.def.bereich ?? "land") === b) })).filter((g) => g.ziele.length > 0);
  return (
    <div className="event-layer" role="dialog" aria-modal="true" aria-labelledby="zielwahl-titel">
      <article className="frame event-window zielwahl">
        <Corners />
        <div className="event-body">
          <p className="kicker">{amtszeit ? t("ziel.amtszeit.kicker") : t("ziel.start.kicker")}</p>
          <h2 id="zielwahl-titel">{amtszeit ? t("ziel.amtszeit.titel") : t("ziel.start.titel")}</h2>
          <Flourish width={180} />
          <p className="event-text">
            {amtszeit ? t("ziel.amtszeit.text") : t("ziel.start.text")}
          </p>
          {gruppen.map((g) => (
            <section key={g.bereich} className="ziel-gruppe">
              {gruppen.length > 1 && <h3 className="ziel-gruppe-titel">{t(`ziel.bereich.${g.bereich}`)}</h3>}
              <ul className="ziel-liste">
                {g.ziele.map(({ def: z, stand }) => (
                  <li key={z.id}>
                    <button className={`ziel${gewaehlt.includes(z.id) ? " on" : ""}`} onClick={() => umschalten(z.id)} aria-pressed={gewaehlt.includes(z.id)}>
                      <Icon name="ziel" size={20} />
                      <span>
                        <strong>{z.titel}</strong>
                        <em>{z.beschreibung}</em>
                        {stand && <em>{t("ziel.ui.stand_heute", { stand })}</em>}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
          {!amtszeit && (
            <div className="schwierigkeit" role="radiogroup" aria-label={t("ziel.ui.schwierigkeit")}>
              <b>{t("ziel.ui.schwierigkeit")}</b>
              {(Object.keys(SCHWIERIGKEITEN) as Schwierigkeit[]).map((k) => (
                <button key={k} role="radio" aria-checked={schwer === k} className={schwer === k ? "on" : ""} onClick={() => setSchwer(k)} title={SCHWIERIGKEITEN[k].text}>
                  <strong>{SCHWIERIGKEITEN[k].name}</strong>
                  <span>{SCHWIERIGKEITEN[k].text}</span>
                </button>
              ))}
            </div>
          )}
          <div className="event-actions">
            <button className="brass-button" onClick={() => onFertig(gewaehlt, schwer)}>
              {gewaehlt.length ? t("ziel.ui.beginnen_mit", { n: gewaehlt.length }) : t("ziel.ui.beginnen_ohne")}
            </button>
          </div>
        </div>
      </article>
    </div>
  );
}
