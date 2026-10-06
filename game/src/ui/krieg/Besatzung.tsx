// Besetzte Regionen nach einem Frieden: je Region Form, Widerstand und Monatskosten, dazu die Entscheidung, was aus ihr wird
// (Pufferzone, Zivilverwaltung mit Wiederaufbau, Annexion, Rückgabe). Rechnet nichts selbst (sim/kriegsschauplatz.ts).

import type { World } from "../../sim/types";
import { t, zahl } from "../../i18n";
import { useSprache } from "../../i18n/react";
import { aendereBesatzung, besatzungsSicht } from "../../sim/kriegsschauplatz";
import { land } from "../../sim/laender";
import { BESATZUNG, type BesatzungsForm } from "../../data/schauplaetze";
import "./krieg.css";

const FORMEN: BesatzungsForm[] = ["pufferzone", "verwaltung", "annexion"];

export function Besatzung({ world, onTat, nurLand }: { world: World; onTat: (text: string) => void; nurLand?: string }) {
  useSprache();
  const liste = besatzungsSicht(world).filter((b) => !nurLand || b.land === nurLand);
  if (!liste.length) return null;
  const summe = liste.reduce((s, b) => s + b.kostenMonat, 0);
  return (
    <section className="ks ks-besatzung" aria-label={t("krieg.besatzung.titel")}>
      <header className="ks-kopf">
        <b>{t("krieg.besatzung.titel")}</b>
        <span>{t("krieg.besatzung.summe", { n: liste.length, bip: zahl(summe * 12, 2) })}</span>
      </header>
      <ul className="ks-besetzt">
        {liste.map((b) => (
          <li key={b.region}>
            <div className="ks-zeile">
              <strong>{t(`krieg.region.${b.region}`)}</strong>
              <span>
                {land(b.land).name} · {t(`krieg.besatzung.form.${b.form}.name`)}
              </span>
            </div>
            <div className="ks-zeile" title={t("krieg.besatzung.widerstand_hilfe", { ziel: b.widerstandZiel })}>
              <span>{t("krieg.besatzung.widerstand")}</span>
              <span className="ks-balken" aria-hidden>
                <i style={{ width: `${b.widerstand}%` }} className={b.widerstand >= BESATZUNG.anschlagAb ? "hoch" : ""} />
              </span>
              <b>{zahl(b.widerstand)}</b>
            </div>
            <p className="ks-hilfe">{t(`krieg.besatzung.form.${b.form}.text`)}</p>
            <div className="ks-knoepfe" role="group">
              {FORMEN.filter((f) => f !== b.form).map((f) => (
                <button key={f} type="button" onClick={() => onTat(aendereBesatzung(world, b.region, f).text)}>
                  <strong>{t(`krieg.besatzung.form.${f}.name`)}</strong>
                  <span>{t("krieg.besatzung.preis", { pk: f === "annexion" ? BESATZUNG.pkAnnexion : BESATZUNG.pkWechsel })}</span>
                </button>
              ))}
              <button type="button" onClick={() => onTat(aendereBesatzung(world, b.region, "rueckgabe").text)}>
                <strong>{t("krieg.besatzung.rueckgabe")}</strong>
                <span>{t("krieg.besatzung.rueckgabe_kurz")}</span>
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
