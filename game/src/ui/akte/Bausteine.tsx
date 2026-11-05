// Gemeinsame Inhalte für die Reiter Verlauf und Personen: Wirkungsberichte eines Bereichs, zuständige Figuren mit Gesicht und Haltung.

import { t } from "../../i18n";
import { NET } from "../../sim/modell";
import type { Bericht } from "../../sim/berichte";
import type { Figur } from "../../sim/spiel-typen";
import type { World } from "../../sim/types";
import { Portraet } from "../personen/bausteine";
import { stimmungVon } from "../../sim/kabinett";
import { bereitschaftWort } from "../../sim/fraktionen";

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

export function BerichtListe({ berichte, onOeffne, gesamt = 0 }: { berichte: Bericht[]; onOeffne?: (b: Bericht) => void; /** Berichte über alle Bereiche, für den Leertext */ gesamt?: number }) {
  // Leer heißt hier nur „in diesem Bereich“; gibt es anderswo Berichte, sagt der Text, wo sie stehen
  if (!berichte.length) return <p className="ak-leer">{gesamt > 0 ? t("akte.verlauf.keineHierAberGesamt", { n: gesamt }) : t("akte.verlauf.keineBerichte")}</p>;
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

/** Haltung in einem Wort, mit denselben Stufen wie der Kabinettstisch (`stimmungVon`); Parteifiguren nach der Gesprächsbereitschaft
 *  ihrer Fraktion, denn eine Oppositionsführerin ist Ihnen nicht „abtrünnig“ (Rundgang 5. November). Nur lesend. */
function haltung(w: World, f: Figur): string {
  if ((f.amt === "opposition" || f.amt === "partner") && f.partei) {
    const b = w.spiel?.fraktionen?.[f.partei]?.bereitschaft ?? 40;
    return t("akte.personen.bereitschaft", { wort: bereitschaftWort(b), n: Math.round(b) });
  }
  const st = stimmungVon(f.loyalitaet, f.eigen?.groll ?? 0);
  return t("akte.personen.haltung", { wort: t(`akte.personen.st.${st}`), n: Math.round(f.loyalitaet) });
}

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
            <span className="ak-person-haltung">{haltung(w, f)}</span>
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
