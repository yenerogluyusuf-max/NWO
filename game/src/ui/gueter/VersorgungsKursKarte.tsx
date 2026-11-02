import type { World } from "../../sim/types";
import type { VersorgungsPrioritaet } from "../../sim/versorgung";
import { versorgungsKursVorschau } from "../../sim/versorgungsentscheidung";
import { beschliesseVersorgungsKurs } from "../../sim/versorgungspolitik";
import { addDays, formatDateDe } from "../../sim/dates";
import { PARTEI_NAME } from "../../sim/fraktionen";
import { t, zahl } from "../../i18n";
import { EntscheidungsKarte } from "../entscheidungen/EntscheidungsKarte";
import { RegierungsReaktionen } from "./VersorgungsMandat";

export function VersorgungsKursKarte({world,kurs,onErgebnis}:{world:World;kurs:VersorgungsPrioritaet;onErgebnis:(r:{ok:boolean;text:string})=>void}) {
  const p=versorgungsKursVorschau(world,kurs);
  return <EntscheidungsKarte kicker={t("ve.kursVorlage")} titel={t(`gueter.kette.${kurs}`)} einleitung={t(`regierung.${kurs}`)}
    fakten={[
      {label:t("ve.jetzt"),wert:t("ve.pk",{n:p.pk}),hinweis:t("ve.kursKosten")},
      {label:t("ve.kompetenz"),wert:t("ve.regierung"),hinweis:t("ve.keinVotum")},
      {label:t("ve.bindung"),wert:formatDateDe(addDays(world.date,p.bis-world.day)),hinweis:t("ve.kursDauer")},
      {label:t("ve.wirkungAb"),wert:t("ve.abrechnung"),hinweis:t("ve.kursAbrechnung")},
    ]} aktion={t("ve.kursAusfuehren",{pk:p.pk})} gesperrt={p.grund} hinweis={t("regierung.kursPreis")}
    onAusfuehren={()=>onErgebnis(beschliesseVersorgungsKurs(world,kurs))}>
    <h5>{t("ve.politischerPreis")}</h5><p>{t("ve.kursFolgen")}</p>
    <RegierungsReaktionen reaktionen={p.reaktionen} titel={t("ve.kursReaktionen")}/>
    {p.risiken.map(r=><aside className="ve-frist" key={r.id}><h5>{t("mandat.bruch.titel")} · {PARTEI_NAME[r.partei]??r.partei}</h5>
      <p>{t("ve.kursRisiko",{name:r.name,vorher:zahl(r.vorher,1),nachher:zahl(r.nachher,1),datum:formatDateDe(r.datum),sitze:r.sitze,rest:r.rest})}</p>
      <p>{t("mandat.bruch.handeln")}</p>
    </aside>)}
  </EntscheidungsKarte>;
}
