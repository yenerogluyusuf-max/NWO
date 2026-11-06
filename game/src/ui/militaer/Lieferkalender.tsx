// Das Bild oben in „Rüstung und Beschaffung“ (Befund G-4/G-45): Was kommt wann? Jedes laufende Rüstungsvorhaben steht einmal auf einer
// Zeitachse, mit dem einen Fertigdatum, das die Bauliste schätzt (sim/reich.ts `warteschlange`); dieselbe Zahl nennen die Streitkräfte
// (sim/streitkraefte.ts `lieferTag`). Was mitkommt (Stückzahl, Gattung), steht an der Zeile.

import type { World } from "../../sim/types";
import { reichZustand, vorhabenDef, warteschlange } from "../../sim/reich";
import { streitkraefte } from "../../sim/streitkraefte";
import { addDays } from "../../sim/dates";
import { datum, t, zahl } from "../../i18n";
import { useSprache } from "../../i18n/react";
import { GATTUNG_NACH_ID } from "../../data/streitkraefte";
import "./militaer.css";

export function Lieferkalender({ world }: { world: World }) {
  useSprache();
  if (!world.spiel) return null;
  const z = reichZustand(world);
  const schlange = warteschlange(world);
  const lieferungen = streitkraefte(world).laufend;
  const zeilen = schlange
    .map((s) => ({ s, v: vorhabenDef(s.id) }))
    .filter((x) => x.v?.bereich === "militaer")
    .map(({ s, v }) => {
      const l = z.laufend.find((x) => x.id === s.id);
      const gesamt = l ? (l.bau ?? v!.kosten.bau) : v!.kosten.bau;
      const b = lieferungen.find((x) => x.vorhaben === s.id);
      return { id: s.id, name: v!.name, monate: s.fertigIn, pausiert: s.pausiert, anteil: l && gesamt > 0 ? l.fortschritt / gesamt : 0, lieferung: b };
    });
  if (!zeilen.length) return null;
  const jahr0 = Number(world.date.slice(0, 4));
  const spaetest = Math.max(24, ...zeilen.map((x) => x.monate ?? 0));
  const jahre = Math.ceil((spaetest + Number(world.date.slice(5, 7))) / 12) + 1;
  const breite = jahre * 12;
  const monat0 = Number(world.date.slice(5, 7)) - 1;
  const pos = (m: number) => `${((monat0 + m) / breite) * 100}%`;
  return (
    <section className="sk-kalender" aria-label={t("nacht_n7.kalender.titel")}>
      <h4>{t("nacht_n7.kalender.titel")}</h4>
      <div className="sk-kal-kopf" aria-hidden>
        <span />
        <div className="sk-kal-achse">
          {Array.from({ length: jahre }, (_, i) => (
            <span key={i} style={{ left: `${((i * 12) / breite) * 100}%` }}>{jahr0 + i}</span>
          ))}
          <i className="heute" style={{ left: pos(0) }} />
        </div>
        <span />
      </div>
      <ol className="sk-kal-zeilen">
        {zeilen.map((x) => (
          <li key={x.id} className={x.pausiert ? "ruht" : x.monate === undefined ? "wartet" : ""}>
            <span className="sk-kal-name">
              <b>{x.name}</b>
              {x.lieferung && (
                <small>
                  {GATTUNG_NACH_ID[x.lieferung.gattung].einheit === "stueck"
                    ? t("nacht_n7.kalender.lieferung", { n: zahl(x.lieferung.menge, 0), gattung: t(`militaer.gattung.${x.lieferung.gattung}`) })
                    : t("nacht_n7.kalender.lieferung_index", { p: zahl(Math.round((x.lieferung.menge / GATTUNG_NACH_ID[x.lieferung.gattung].start) * 100), 0), gattung: t(`militaer.gattung.${x.lieferung.gattung}`) })}
                  {x.lieferung.gestoppt ? ` · ${t("militaer.ui.gestoppt")}` : ""}
                </small>
              )}
            </span>
            <span className="sk-kal-bahn">
              {x.monate !== undefined && (
                <>
                  <i className="lauf" style={{ left: pos(0), width: `${(x.monate / breite) * 100}%` }} />
                  <i className="ziel" style={{ left: pos(x.monate) }} />
                </>
              )}
            </span>
            <span className="sk-kal-datum">
              {x.pausiert ? t("nacht_n7.kalender.ruht") : x.monate === undefined ? t("nacht_n7.kalender.wartet") : datum(addDays(world.date, x.monate * 30), "monat")}
              <small>{t("nacht_n7.kalender.stand", { p: zahl(Math.round(x.anteil * 100), 0) })}</small>
            </span>
          </li>
        ))}
      </ol>
      <p className="sk-kal-hinweis">{t("nacht_n7.kalender.hinweis")}</p>
    </section>
  );
}
