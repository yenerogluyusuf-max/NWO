// Das Seitenfenster der Ortswahl (karte.md K1, Welle 3 K6): Solange ein Ort auf der großen Karte gewählt wird, tritt die Akte zurück, und
// dieses Fenster steht rechts neben der Karte (Breite wie die Provinzkarte). Es zeigt die Frage, was die Farben bedeuten, die Auswahl mit
// Kennzahlen (Karte im Stil des Haushaltskopfs, ENTSCHEIDUNGEN Z), den Preis und zwei Knöpfe: Übernehmen und Abbrechen (Esc).
// Rechnet nichts selbst: alles aus der Anfrage (ortswahl.ts), die der Aufrufer mit den Zahlen der Simulation baut.

import { Corners } from "../art/Ornament";
import { t } from "../../i18n";
import { useSprache } from "../../i18n/react";
import { BEWERTUNG_FARBE, rgba, type Bewertung, type OrtswahlZustand } from "./ortswahl";
import "./ortswahl.css";

const LEGENDE: (Bewertung | "gewaehlt")[] = ["gewaehlt", "gut", "moeglich", "erfuellt", "gesperrt"];

export function OrtswahlLeiste({ zustand, onStreichen, onUebernehmen, onAbbrechen }: {
  zustand: OrtswahlZustand;
  onStreichen: (ziel: string) => void;
  onUebernehmen: () => void;
  onAbbrechen: () => void;
}) {
  useSprache();
  const { anfrage, auswahl } = zustand;
  const v = anfrage.vorschau(auswahl);
  const bew = anfrage.bewerte(auswahl);
  const vorhanden = new Set(Object.values(bew).map((b) => b.bewertung));
  return (
    <aside className="ortswahl-leiste frame" role="dialog" aria-label={anfrage.titel}>
      <Corners />
      <header className="dossier-head">
        <h2>{anfrage.titel}</h2>
        <button className="close" onClick={onAbbrechen} aria-label={t("welle_k6.leiste.abbrechen")}>
          ✕
        </button>
      </header>
      <div className="ow-koerper">
        <p className="ow-frage">{anfrage.frage}</p>
        <ul className="ow-legende" aria-label={t("welle_k6.leiste.legende")}>
          {LEGENDE.filter((s) => s === "gewaehlt" || vorhanden.has(s)).map((s) => (
            <li key={s}>
              <i style={{ background: rgba(BEWERTUNG_FARBE[s].fuell, Math.max(0.45, BEWERTUNG_FARBE[s].fuell[3])), borderColor: rgba(BEWERTUNG_FARBE[s].rand) }} aria-hidden />
              {t(`welle_k6.bewertung.${s}.kurz`)}
            </li>
          ))}
        </ul>

        <section className="ow-karte" aria-label={t("welle_k6.leiste.auswahl")}>
          <dl className="ow-zahlen">
            {v.kennzahlen.map((k) => (
              <div key={k.etikett}>
                <dt>{k.etikett}</dt>
                <dd>
                  {k.wert}
                  {k.klein && <small>{k.klein}</small>}
                </dd>
              </div>
            ))}
          </dl>
          {v.hinweis && <p className="ow-hinweis">{v.hinweis}</p>}
        </section>

        {v.zeilen.length > 0 ? (
          <ol className="ow-liste">
            {v.zeilen.map((z) => (
              <li key={z.ziel}>
                <span>
                  <b>{z.name}</b>
                  <small>{z.zahlen}</small>
                </span>
                <button type="button" className="knopf-leise" onClick={() => onStreichen(z.ziel)} aria-label={t("welle_k6.leiste.streichen", { name: z.name })}>
                  {t("welle_k6.leiste.streichen_kurz")}
                </button>
              </li>
            ))}
          </ol>
        ) : (
          <p className="ow-leer">{t("welle_k6.leiste.klick")}</p>
        )}

        <footer className="ow-fuss">
          <p className={`ow-preis${v.ok ? "" : " gesperrt"}`}>{v.ok ? v.preis || t("welle_k6.leiste.kostenlos") : v.grund}</p>
          <div className="ow-knoepfe">
            <button type="button" className="knopf-haupt" disabled={!v.ok} onClick={onUebernehmen}>
              {anfrage.knopf ?? t("welle_k6.leiste.uebernehmen")}
            </button>
            <button type="button" className="knopf-leise" onClick={onAbbrechen}>
              {t("welle_k6.leiste.zurueck")}
            </button>
          </div>
        </footer>
      </div>
    </aside>
  );
}
