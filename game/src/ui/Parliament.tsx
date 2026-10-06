// Das Parlament auf dem Schreibtisch: Halbrund und Sitzliste. Die ausführliche Ansicht mit Abstimmungen steht im Parlament-Fenster (parlament/ParlamentKopf).

import { useState } from "react";
import type { World } from "../sim/types";
import { PARTY_COLORS, parlamentsLage, ROLLEN_WORT } from "./parlament/lage";
import { Sitzplan } from "./parlament/Halbrund";
import { REGELN } from "../sim/handeln";
import { VERFASSUNG_REGELN } from "../sim/verfassung";
import { t } from "../i18n";

export { PARTY_COLORS };

export function Parliament({ world }: { world: World }) {
  const [hervor, setHervor] = useState<string | null>(null);
  const lage = parlamentsLage(world);
  if (!lage) return null;
  const fehlt = 301 - lage.lager - lage.duldung;

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
            <span>{fehlt > 0 ? `es fehlen ${fehlt}` : lage.lager < 301 ? `mit Duldung ${lage.lager + lage.duldung}` : lage.hatLager ? "Regierungsmehrheit" : "eigene Mehrheit"}</span>
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
            <span className="share">{f.anteil.toLocaleString("de-DE", { maximumFractionDigits: 1 })} %</span>
          </li>
        ))}
      </ul>
      <p className="footnote">{t("ui2.ui.Parliament.92576e6", { p0: REGELN.mehrheit, p1: VERFASSUNG_REGELN.mehrheit, p2: VERFASSUNG_REGELN.direkt })}</p>
    </section>
  );
}
