// Gemeinsame Inhalte für die Reiter Verlauf und Personen: Wirkungsberichte eines Bereichs, zuständige Figuren mit Gesicht und Haltung.

import { t } from "../../i18n";
import { NET } from "../../sim/modell";
import type { Bericht } from "../../sim/berichte";
import type { Figur } from "../../sim/spiel-typen";
import type { World } from "../../sim/types";
import { Portraet } from "../personen/bausteine";

/** Wirkungsberichte, deren Maßnahme zu einem der Themen gehört (neueste zuerst). */
export function berichteFuer(w: World, themen: readonly string[]): Bericht[] {
  const liste = w.spiel?.berichte ?? [];
  return liste
    .filter((b) => {
      const i = NET.index.get(b.massnahme);
      const theme = i === undefined ? undefined : (NET.nodes[i] as { theme?: string }).theme;
      return theme !== undefined && themen.includes(theme);
    })
    .slice()
    .reverse();
}

export function BerichtListe({ berichte, onOeffne }: { berichte: Bericht[]; onOeffne?: (b: Bericht) => void }) {
  if (!berichte.length) return <p className="ak-leer">{t("akte.verlauf.keineBerichte")}</p>;
  return (
    <ul className="ak-berichte">
      {berichte.slice(0, 8).map((b) => (
        <li key={`${b.massnahme}-${b.tag}`} className={`ak-bericht ${b.urteil}`}>
          <div>
            <b>{b.name ?? b.titel}</b>
            <span>{t("akte.verlauf.berichtKopf", { d: b.datum, m: b.monate })}</span>
          </div>
          <p>{b.kurz ?? b.hinweis}</p>
          {onOeffne && (
            <button type="button" className="ak-link" onClick={() => onOeffne(b)}>
              {t("akte.verlauf.oeffnen")}
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}

const loyalWort = (l: number): string => t(l >= 70 ? "akte.personen.loyal" : l >= 50 ? "akte.personen.verlaesslich" : l >= 30 ? "akte.personen.distanziert" : "akte.personen.abtruennig");

/** Zuständige Figuren eines Bereichs mit Gesicht, Amt, Haltung und Ziel. */
export function PersonenListe({ w, aemter, onGespraech }: { w: World; aemter: readonly Figur["amt"][]; onGespraech?: (f: Figur) => void }) {
  const figuren = (w.spiel?.figuren ?? []).filter((f) => f.imAmt && aemter.includes(f.amt));
  if (!figuren.length) return <p className="ak-leer">{t("akte.personen.keine")}</p>;
  return (
    <div className="ak-personen">
      {figuren.map((f) => (
        <article key={f.id} className="ak-person">
          <Portraet w={w} f={f} size={96} />
          <div>
            <b>{f.name}</b>
            <span className="ak-person-rolle">{f.rolle}</span>
            <span className="ak-person-haltung">{t("akte.personen.haltung", { wort: loyalWort(f.loyalitaet), n: Math.round(f.loyalitaet) })}</span>
            <p>{f.ziel}</p>
            {onGespraech && (
              <button type="button" className="ak-link" onClick={() => onGespraech(f)}>
                {t("akte.personen.gespraech")}
              </button>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
