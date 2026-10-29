// Die Quellen-Akte: Wer die Karten und Zahlen geliefert hat (data/quellen.ts), mit Lizenz und Verweis,
// und ein Knopf, der den Attributionstext komplett in die Zwischenablage legt. Zweckzeile nach T2:
// Jede Ansicht sagt in einem Satz, wofür sie da ist. Keine Spiellogik.

import { useState } from "react";
import { QUELLEN, QUELLEN_GRUPPEN, quellenText } from "../../data/quellen";
import { t } from "../../i18n";
import "./quellen.css";

export function Quellen() {
  const [gemeldet, setGemeldet] = useState(false);

  const kopiere = async () => {
    try {
      await navigator.clipboard.writeText(quellenText());
      setGemeldet(true);
      setTimeout(() => setGemeldet(false), 2500);
    } catch {
      setGemeldet(false);
    }
  };

  return (
    <div className="quellen-akte" aria-label={t("quellen.titel")}>
      <p className="quellen-zweck">{t("quellen.zweck")}</p>
      <p className="quellen-hinweis">{t("quellen.hinweis")}</p>
      <div className="quellen-kopf">
        <button type="button" className="pd-btn quiet" onClick={kopiere}>
          {t("quellen.kopieren")}
        </button>
        {gemeldet && <span className="quellen-gemeldet">{t("quellen.gemeldet")}</span>}
      </div>
      {QUELLEN_GRUPPEN.map((g) => (
        <section key={g.id} className="quellen-gruppe" aria-label={g.titel}>
          <h4>{g.titel}</h4>
          {QUELLEN.filter((q) => q.gruppe === g.id).map((q) => (
            <article key={q.id} className="quellen-eintrag">
              <a href={q.url} target="_blank" rel="noreferrer" className="quellen-name">
                {q.name} →
              </a>
              <p className="quellen-zeile">
                <span className="quellen-lizenz">{q.lizenz}</span> {q.nutzung}
              </p>
            </article>
          ))}
        </section>
      ))}
    </div>
  );
}
