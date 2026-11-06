// Wo ein neuer Auftrag in die Baureihenfolge kommt (Befund F-3): hinten (frei) oder an die Spitze (Preis wie beim Vorziehen).
// Die Zahlen kommen aus sim/reich.ts (spitzenPreis, warteschlange), dieselbe Rechnung wie beim Buchen.

import type { World } from "../../sim/types";
import type { Vorhaben } from "../../sim/reich-typen";
import { bauPool, reichZustand, spitzenPreis, type Platz } from "../../sim/reich";
import { t } from "../../i18n";

export function PlatzWahl({ world, v, platz, onPlatz }: { world: World; v: Vorhaben; platz: Platz; onPlatz: (p: Platz) => void }) {
  const pool = bauPool(v);
  if (pool === "ohne") return null;
  const preis = spitzenPreis(world, v.id);
  if (!preis.verdrangt.length) return <p className="rr-hinweis vk-platz-satz">{t("n6.bau.endeErster")}</p>;
  const vorrat = reichZustand(world).verwaltung;
  const zuTeuer = vorrat < preis.kosten;
  return (
    <div className="vk-platz" role="radiogroup" aria-label={t("n6.platz.titel")}>
      <b className="rr-wirkung-kopf">{t("n6.platz.titel")}</b>
      <label className={platz === "ende" ? "on" : ""}>
        <input type="radio" name={`platz-${v.id}`} checked={platz === "ende"} onChange={() => onPlatz("ende")} />
        <span>{t("n6.bau.ende", { n: preis.verdrangt.length + 1 })}</span>
      </label>
      <label className={`${platz === "spitze" ? "on" : ""}${zuTeuer ? " zu" : ""}`} title={zuTeuer ? t("sim2.sim.reich.8eb9ca2", { p0: preis.kosten }) : undefined}>
        <input type="radio" name={`platz-${v.id}`} checked={platz === "spitze"} disabled={zuTeuer} onChange={() => onPlatz("spitze")} />
        <span>{t("n6.bau.spitze", { kosten: preis.kosten, liste: preis.verdrangt.join(", ") })}</span>
      </label>
    </div>
  );
}
