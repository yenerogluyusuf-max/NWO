import { useEffect, useRef, useState } from "react";
import type { World } from "../../sim/types";
import { energiePartnerGrund, type EnergiePartner, type VersorgungsProgramm } from "../../sim/versorgungspolitik";
import { oeffneVersorgungsNachsorge } from "../../sim/versorgungsnachsorge";
import { addDays, formatDateDe } from "../../sim/dates";
import { t } from "../../i18n";
import { VersorgungsMandat } from "./VersorgungsMandat";
import { VersorgungsVorschlag } from "./VersorgungsVorschlag";

export function VersorgungsProgrammKarte({world,programm,index,start,geaendert}:{world:World;programm:VersorgungsProgramm;index:number;start?:boolean;geaendert:()=>void}) {
  const [partner,setPartner]=useState<EnergiePartner>("AZE");
  const [meldung,setMeldung]=useState("");
  const [wahl,setWahl]=useState<boolean|undefined>();
  const kopf=useRef<HTMLElement>(null);
  const reg=world.spiel?.gueter?.regierung,a=reg?.programme[programm],v=reg?.vorlagen?.[programm];
  const laeuft=!!a&&world.day<a.bis,offen=v?.status==="offen",neu=!laeuft&&!offen;
  const nachsorge=oeffneVersorgungsNachsorge(world,programm),geoeffnet=wahl??(!!start||nachsorge);
  const datum=(tag:number)=>formatDateDe(addDays(world.date,tag-world.day));
  const ausgesetzt=laeuft&&a.partner?energiePartnerGrund(world,a.partner):undefined;
  // Ein ausdrücklicher Aktenzugang setzt den Fokus auf den Vorgang; Spielticks tun dies nicht.
  useEffect(()=>{if(start)kopf.current?.focus();},[start]);
  const tun=(r:{ok:boolean;text:string})=>{setMeldung(r.text);if(r.ok){kopf.current?.focus();geaendert();}};
  return <details className={`rg-programm${laeuft?" rg-beschlossen":""}`} open={geoeffnet} onToggle={e=>setWahl(e.currentTarget.open)} data-programm={programm}>
    <summary ref={kopf}><span className="rg-nummer">0{index+1}</span><span><b>{t(`regierung.${programm}.titel`)}</b><small>{laeuft?t(a.ab>world.day?"regierung.bereit":"regierung.aktivBis",{datum:datum(a.ab>world.day?a.ab:a.bis)}):offen?`${t("mandat.status.offen")} · ${datum(v.abstimmung)}`:t(`regierung.${programm}.kurz`)}</small></span><i aria-hidden="true">+</i></summary>
    {geoeffnet&&<div className="rg-programm-inhalt">
      {programm==="energie"&&<label className="rg-partner">{t("regierung.partner")}<select value={laeuft?a.partner:offen?v.partner:partner} disabled={laeuft||offen} onChange={e=>setPartner(e.target.value as EnergiePartner)}>
        <option value="AZE">{t("regierung.wegAZE")}</option><option value="USA">{t("regierung.wegUSA")}</option>
      </select></label>}
      {neu?<VersorgungsVorschlag world={world} programm={programm} partner={partner} onErgebnis={tun}/>:<>
        <details className="rg-programm-wirkung"><summary>{t("mandat.programmWirkung")}</summary>
          {!!v?.klauseln.length&&<p className="rg-leise">{t("mandat.grundpaket")}</p>}
          {(["wirtschaft","innen","aussen"] as const).map(f=><div className="rg-abwaegung" key={f}><h5>{t(`regierung.${f}`)}</h5><p>{t(`regierung.${programm}.${f}`)}</p></div>)}
        </details>
        {laeuft&&<p className="rg-auftrag">{t("regierung.aktivBis",{datum:datum(a.bis)})}</p>}
        {ausgesetzt&&<p className="rg-warnung">{ausgesetzt}</p>}
        <VersorgungsMandat key={v?.id??programm} world={world} programm={programm} geaendert={geaendert}/>
      </>}
      {neu&&v&&<details className="ve-rueckblick" open={nachsorge||undefined}><summary>{t("ve.bisherigerBeschluss")} · {datum(v.erledigt??v.abstimmung)}</summary>
        <VersorgungsMandat key={v.id} world={world} programm={programm} geaendert={geaendert}/>
      </details>}
      {neu&&a&&<p className="rg-leise">{t("regierung.beendet")}</p>}
      <p role="status" className="rg-meldung">{meldung}</p>
    </div>}
  </details>;
}
