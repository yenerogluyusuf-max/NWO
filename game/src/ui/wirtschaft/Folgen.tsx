// „Was danach kommt“: die Folgekette einer Entscheidung in Wörtern, mit Richtung, Verzögerung und Begründung.

import type { Glied } from "../../sim/folgen";
import { t } from "../../i18n";
import "./wirtschaft.css";

function Pfeil({ g }: { g: Glied }) {
  const klasse = g.gut === true ? "wi-gut" : g.gut === false ? "wi-schlecht" : "wi-neutral";
  return (
    <span className={`wi-pfeil ${klasse}`} aria-label={g.richtung > 0 ? "steigt" : "sinkt"}>
      {g.richtung > 0 ? "▲" : "▼"}
    </span>
  );
}

/** kurz: nur die ersten drei unmittelbaren Folgen offen, der Rest der Kette klappt auf (AP 11: höchstens anderthalb Bildschirme) */
export function Folgen({ glieder, titel, leer, kurz }: { glieder: Glied[]; titel?: string; leer?: string; kurz?: boolean }) {
  if (!glieder.length) return leer ? <p className="wi-hinweis">{leer}</p> : null;
  const nachEbene = [1, 2, 3].map((e) => glieder.filter((g) => g.ebene === e)).filter((l) => l.length);
  if (kurz && glieder.length > 3) {
    const erste = nachEbene[0]!.slice(0, 3);
    const rest = glieder.filter((g) => !erste.includes(g));
    return (
      <div className="wi-folgen">
        {titel && <h4>{titel}</h4>}
        <Kette liste={erste} k={0} />
        <details className="wi-folgen-mehr"><summary>{t("folgen.weitere", { n: rest.length })}</summary><Folgen glieder={rest} /></details>
      </div>
    );
  }
  return (
    <div className="wi-folgen">
      {titel && <h4>{titel}</h4>}
      {nachEbene.map((liste, k) => <Kette key={k} liste={liste} k={k} />)}
    </div>
  );
}

function Kette({ liste, k }: { liste: Glied[]; k: number }) {
  return (
        <ol className={`wi-kette wi-ebene-${k + 1}`}>
          {liste.map((g, i) => (
            <li key={i} title={g.warum}>
              <Pfeil g={g} />
              <span className="wi-folge-text">
                {g.text}
                {g.nach > 0 && <em className="wi-nach"> {t("ui2.ui.wirtschaft.Folgen.300f156", { p0: g.nach })} {g.nach === 1 ? t("ui2.ui.wirtschaft.Folgen.da13625") : t("ui2.ui.wirtschaft.Folgen.3e846ba")}</em>}
                {g.nach === 0 && !g.groesse && <em className="wi-nach"> {t("ui2.ui.wirtschaft.Folgen.25e3f3e")}</em>}
              </span>
              {g.warum && <small>{g.warum}</small>}
            </li>
          ))}
        </ol>
  );
}
