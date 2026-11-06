import type { World } from "../../sim/types";
import { bringeHaushaltsgesetzEin } from "../../sim/haushalt";
import { haushaltsEntscheidung } from "../../sim/haushaltsentscheidung";
import { formatDateDe } from "../../sim/dates";
import { t, zahl } from "../../i18n";
import { EntscheidungsKarte } from "../entscheidungen/EntscheidungsKarte";
import { GesetzesPrognoseHinweis } from "../parlament/GesetzesPrognoseHinweis";

export function HaushaltsEntwurf({world,onErgebnis}:{world:World;onErgebnis:(r:{ok:boolean;text:string;why?:string})=>void}) {
  const p=haushaltsEntscheidung(world);if(!p)return null;
  return <EntscheidungsKarte kicker={t("eo.budgetVorlage")} titel={t("eo.jahr",{jahr:String(Number(world.date.slice(0,4))+1)})} einleitung={t("eo.einbringenHinweis")}
    fakten={[
      {label:t("eo.kapital"),wert:t("ve.pk",{n:0}),hinweis:t("ve.initiative")},
      {label:t("sf.finanzwirkung"),wert:t("sf.betrag",{n:zahl(p.finanzMrd,1)}),hinweis:t("sf.preisHinweis")},
      {label:t("eo.gesamtDefizit"),wert:`${zahl(p.vor,1)} → ${zahl(p.nach,1)} %`},
      {label:t("eo.votum"),wert:t("eo.gesetzStimmen",{n:p.prognose.ja}),hinweis:t(p.prognose.luecke?"gp.luecke":"gp.mehrheit",{n:p.prognose.luecke})},
      {label:t("ve.votum"),wert:formatDateDe(p.prognose.datum),hinweis:t("ve.beiEinbringen")},
    ]}
    aktion={t("eo.einbringen")} gesperrt={p.grund} hinweis={t("eo.beraten")} onAusfuehren={()=>onErgebnis(bringeHaushaltsgesetzEin(world))}>
    <GesetzesPrognoseHinweis prognose={p.prognose}/>
    <p>{t("eo.entwurfWirkung")}</p><p>{t("eo.ablehnung")}</p>
  </EntscheidungsKarte>;
}
