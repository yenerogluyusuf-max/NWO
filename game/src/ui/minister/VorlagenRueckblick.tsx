import type { World } from "../../sim/types";
import type { VerfalleneVorlage } from "../../sim/ministerfluss-typen";
import { addDays, formatDateDe } from "../../sim/dates";
import { rendere, t } from "../../i18n";

/** Der gespeicherte Ausgang bleibt historisch; heutige Verpflichtungen stehen ausdrücklich daneben. */
export function VorlagenRueckblick({world,eintraege}:{world:World;eintraege:VerfalleneVorlage[]}) {
  if(!eintraege.length)return null;
  return <section className="mf-abschnitt mf-rueckblick">
    <h4>{t("mzr.titel")}</h4>
    <p className="mf-leer">{t("mzr.hinweis")}</p>
    <ul className="mf-verfallen">{[...eintraege].reverse().slice(0,6).map((x,i)=>{
      const status=x.zusage?.status??(x.quelle==="zusage"?"alt":"verfallen");
      const z=x.zusage?world.spiel?.zusagen.find(z=>z.id===x.zusage!.id):undefined;
      return <li key={`${x.id}-${x.verfallen}-${i}`} className={`ausgang-${status}`}>
        <div className="mf-rb-inhalt">
          <span className="mf-rb-status">{t(`mzr.status.${status}`)}</span>
          <strong>{rendere(x.titel)}</strong>
          <p>{x.zusage?rendere(x.grund):x.quelle==="zusage"?t("mzr.alt"):rendere(x.grund)}</p>
          {x.zusage?.abstimmung&&<p>{t("mzr.votum",{datum:formatDateDe(x.zusage.abstimmung)})}</p>}
          {x.zusage?.faellig&&<p>{t("mzr.damaligeFrist",{datum:formatDateDe(x.zusage.faellig)})}</p>}
          {x.zusage&&<p className="mf-rb-heute">{t(!z?"mzr.heute.entfallen":z.erfuellt?"mzr.heute.erfuellt":z.gebrochen?"mzr.heute.gebrochen":"mzr.heute.offen",z?{datum:formatDateDe(addDays(world.date,z.faellig-world.day))}:{})}</p>}
        </div>
        <span className="mf-rb-datum">{t("mzr.erfasst",{datum:formatDateDe(addDays(world.spiel!.start.datum,x.verfallen))})}</span>
      </li>;
    })}</ul>
  </section>;
}
