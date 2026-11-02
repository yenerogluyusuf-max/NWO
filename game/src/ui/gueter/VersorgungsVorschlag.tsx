import type { World } from "../../sim/types";
import { beschliesseVersorgungsProgramm, type EnergiePartner, type VersorgungsProgramm } from "../../sim/versorgungspolitik";
import { versorgungsStartVorschau } from "../../sim/versorgungsentscheidung";
import { PARTEI_NAME } from "../../sim/fraktionen";
import { addDays, formatDateDe } from "../../sim/dates";
import { t, zahl } from "../../i18n";
import { EntscheidungsKarte } from "../entscheidungen/EntscheidungsKarte";
import { VersorgungsBruchwarnung } from "./VersorgungsBruchwarnung";
import { RegierungsReaktionen } from "./VersorgungsMandat";

/** Vor dem Einbringen: das neue Grundpaket. Alte Beschlüsse bleiben im eigenen Rückblick. */
export function VersorgungsVorschlag({world,programm,partner,onErgebnis}:{world:World;programm:VersorgungsProgramm;partner:EnergiePartner;onErgebnis:(r:{ok:boolean;text:string})=>void}) {
  const p=versorgungsStartVorschau(world,programm,partner);
  const datum=(tag:number)=>formatDateDe(addDays(world.date,tag-world.day));
  const name=(partei:string)=>PARTEI_NAME[partei]??partei;
  const unzufrieden=p.stimmen.filter(f=>f.rolle==="koalition"&&!f.erfuellt);
  return <EntscheidungsKarte kicker={t("ve.neuerAntrag")} titel={t(`regierung.${programm}.titel`)} einleitung={t(`regierung.${programm}.kurz`)}
    fakten={[
      {label:t("ve.jetzt"),wert:t("ve.pk",{n:p.vorlage.pk}),hinweis:t("ve.initiative")},
      {label:t("mandat.budgetBeiAnnahme"),wert:`${zahl(p.konditionen.bip,2)} %`,hinweis:t("ve.schulden")},
      {label:t("ve.parlament"),wert:`${p.ja} / 301`,hinweis:t(p.fehlt?"mandat.fehlen":"mandat.mehrheit",{n:p.fehlt})},
      {label:t("ve.votum"),wert:datum(p.vorlage.abstimmung),hinweis:t("ve.beiEinbringen")},
    ]}
    aktion={t("ve.einbringen",{pk:p.vorlage.pk})} gesperrt={p.grund} hinweis={t("ve.naechsterSchritt")}
    onAusfuehren={()=>onErgebnis(beschliesseVersorgungsProgramm(world,programm,partner))}>
    <div className="ve-wirkung"><h5>{t("ve.wirkung")}</h5><p>{t(`regierung.${programm}.wirtschaft`)}</p>
      <p className="ve-zeitplan">{t("ve.zeitplan",{ab:datum(p.ab),bis:datum(p.bis),tage:p.konditionen.dauer})}</p>
    </div>
    <div className="ve-politik"><h5>{t("ve.politischerPreis")}</h5>
      <p>{t(`regierung.${programm}.innen`)}</p><p>{t(`regierung.${programm}.aussen`)}</p>
      {unzufrieden.length>0&&<p className="ve-warnung">{t("ve.partnerUnzufrieden",{parteien:unzufrieden.map(f=>name(f.partei)).join(", ")})}</p>}
    </div>
    {p.duldungen.length>0&&<aside className="ve-frist"><h5>{t("mandat.duldungEndet")}</h5><p>{t("mandat.duldungFrist",{parteien:p.duldungen.map(f=>`${name(f.partei)} (${datum(f.bis)})`).join(", ")})}</p></aside>}
    <VersorgungsBruchwarnung risiken={p.bruchrisiken}/>
    <details className="ve-fraktionen"><summary>{t("ve.stimmenDetails")}</summary>
      <p>{t("mandat.prognoseStichtag",{datum:datum(p.vorlage.abstimmung)})}</p>
      <ul>{p.stimmen.map(f=><li key={f.partei}><div><b>{name(f.partei)}</b><small>{t(`mandat.rolle.${f.rolle}`)}</small></div>
        <span>{t(f.erfuellt?"mandat.erfuellt":"mandat.fordert",{forderung:t(`mandat.${f.forderung}.titel`)})}</span><strong>{f.ja} / {f.sitze}</strong></li>)}</ul>
      <p>{t("ve.verhandeln")}</p>
      <RegierungsReaktionen reaktionen={p.annahme} titel={t("ve.beiAnnahme")}/>
      <RegierungsReaktionen reaktionen={p.ablehnung} titel={t("ve.beiAblehnung")}/>
      <p>{t("ve.ablehnung")}</p><p>{t("ve.vorbehalt")}</p>
    </details>
  </EntscheidungsKarte>;
}
