// Das Parlament auf dem Schreibtisch: Halbrund und Sitzliste. Die ausführliche Ansicht mit Abstimmungen steht im Parlament-Fenster (parlament/ParlamentKopf).

import { useState } from "react";
import type { World } from "../sim/types";
import { PARTY_COLORS, parlamentsLage, ROLLEN_WORT } from "./parlament/lage";
import { Sitzplan } from "./parlament/Halbrund";
import { GESETZ_SCHWELLE, REGELN } from "../sim/handeln";
import { VERFASSUNG_REGELN } from "../sim/verfassung";
import { t, zahl } from "../i18n";

export { PARTY_COLORS };

export function Parliament({ world }: { world: World }) {
  const [hervor, setHervor] = useState<string | null>(null);
  const lage = parlamentsLage(world);
  if (!lage) return null;
  const fehlt = REGELN.mehrheit - lage.lager - lage.duldung;

  return (
    <section className="paper parliament">
      <h3>{t("ui2.ui.Parliament.e9f977f")}</h3>
      <Sitzplan
        lage={lage}
        hervor={hervor}
        onHover={setHervor}
        aria={t("ui2.ui.Parliament.ba79e9a", { p0: lage.fraktionen.map((f) => `${f.name} ${f.sitze}`).join(", ") })}
        mitte={
          <div className="par-mitte-inhalt">
            <strong>{lage.lager}</strong>
            <span>{fehlt > 0 ? t("n4.pk.fehlen", { n: fehlt, mitglieder: REGELN.mehrheit }) : lage.lager < REGELN.mehrheit ? t("n4.pk.mitDuldung", { n: lage.lager + lage.duldung }) : lage.hatLager ? t("n4.pk.regierungsmehrheit") : t("n4.pk.eigeneMehrheit")}</span>
          </div>
        }
      />
      <ul className="seatlist">
        {lage.fraktionen.map((f) => (
          <li key={f.partei} onPointerEnter={() => setHervor(f.partei)} onPointerLeave={() => setHervor(null)}>
            <span className="dot" style={{ background: f.farbe }} />
            <span className="party">
              {f.name}
              {f.rolle !== "eigene" && f.rolle !== "opposition" && <em> · {ROLLEN_WORT[f.rolle]}</em>}
            </span>
            <strong>{f.sitze}</strong>
            <span className="share" title={t("n4.pk.anteilHilfe")}>{t("n4.pk.anteil", { p: zahl(f.anteil, 1) })}</span>
          </li>
        ))}
      </ul>
      <p className="footnote">{t("n4.pk.lead", { sitze: zahl(lage.gesamt), gesetz: GESETZ_SCHWELLE, mitglieder: REGELN.mehrheit, vf: VERFASSUNG_REGELN.mehrheit, direkt: VERFASSUNG_REGELN.direkt })}</p>
    </section>
  );
}
