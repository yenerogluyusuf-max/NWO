import { useState } from "react";
import type { World } from "../../sim/types";
import { haushaltsGesetzSicht } from "../../sim/haushalt";
import { haushaltsFraktionsWege, haushaltsMehrheitsPlan, sichereHaushaltsMehrheit, type HaushaltsMehrheitsPlan } from "../../sim/haushaltsmehrheit";
import { t, zahl } from "../../i18n";
import { formatDateDe } from "../../sim/dates";
import { GesetzesPrognoseHinweis } from "../parlament/GesetzesPrognoseHinweis";
import { FraktionsAbkommen } from "../parlament/FraktionsAbkommen";
import { ZusagenDruck } from "../personen/ZusagenDruck";
import { useSprung } from "../akte/Uebersicht";
import "../parlament/parlament.css";
import { EntscheidungsKarte } from "../entscheidungen/EntscheidungsKarte";
import "./haushaltsmehrheit.css";

function Risiken({plan}:{plan:HaushaltsMehrheitsPlan}) {
  return <>{plan.risiken.map(p=><p className="hm-warnung" key={p.partei+p.name}>{t("hm.bruch",{partei:p.partei,name:p.name,loyal:Math.round(p.loyalitaet*100)/100>=20?"< 20":zahl(p.loyalitaet,2),datum:formatDateDe(p.datum),sitze:p.sitze})}</p>)}
    {plan.druck.map(d=><ZusagenDruck key={d.partei} lage={d} danach/>)}</>;
}

export function HaushaltsAbkommensKarte({world,plan:a,onAnnehmen}:{world:World;plan:HaushaltsMehrheitsPlan;onAnnehmen:()=>void}) {
  if(!a.fraktion)return null;
  return <article className="hm-fraktion">
    <header><h5>{a.fraktion.name}</h5><strong>{t("hm.gewinn",{n:a.gewinn})}</strong></header>
    <p>{t("hm.stimmen",{vor:a.vorher,nach:a.nachher,plus:a.gewinn})} {a.luecke?t("gp.luecke",{n:a.luecke}):t("gp.mehrheit")}</p>
    {a.bereitschaftDelta!==0&&<p>{t("hm.bereitschaft",{n:a.bereitschaftDelta})}</p>}
    <Risiken plan={a}/>
    <FraktionsAbkommen world={world} fraktion={a.fraktion} onVerhandlung={onAnnehmen}/>
  </article>;
}

export function HaushaltsMehrheit({world,geaendert}:{world:World;geaendert:()=>void}) {
  const [fraktionenOffen,setFraktionenOffen]=useState(false),[alle,setAlle]=useState(false);
  const [antwort,setAntwort]=useState<{ok:boolean;text:string;why?:string}|null>(null);
  const gehe=useSprung(),p=haushaltsGesetzSicht(world);
  if(!p)return null;
  if(world.spiel?.ende)return <p>{t("hm.beendet")}</p>;
  const absprachen=(["einfach","puffer"] as const).flatMap(art=>{const a=haushaltsMehrheitsPlan(world,art);return a?[a]:[];});
  const wege=fraktionenOffen?haushaltsFraktionsWege(world):[];
  const ersteParteien=new Set<string>();
  const auswahl=alle?wege:wege.filter(a=>{if(ersteParteien.has(a.partei!)||ersteParteien.size>=3)return false;ersteParteien.add(a.partei!);return true;});
  const handeln=(a:HaushaltsMehrheitsPlan)=>{const r=sichereHaushaltsMehrheit(world,a);setAntwort(r);geaendert();};
  return <section className="hm" aria-label={t("hm.titel")}>
    <GesetzesPrognoseHinweis prognose={p}/>
    <h4>{t("hm.titel")}</h4>
    <p className="hm-lead">{t("hm.keineGarantie")}</p>
    {antwort&&<p role="status" className={`rueckmeldung ${antwort.ok?"ok":"nein"}`}>{antwort.text} {antwort.why}</p>}
    {absprachen.length>0?<div className="hm-wege">{absprachen.map(a=><EntscheidungsKarte key={a.art} kicker={t("hm.titel")} titel={t(`hm.${a.art}`)} einleitung={t("hm.stimmen",{vor:a.vorher,nach:a.nachher,plus:a.gewinn})}
      fakten={[
        {label:t('eo.kapital'),wert:t('ve.pk',{n:a.pk})},
        {label:t('eo.aufmerksamkeit'),wert:t('eo.punkte',{n:a.aufmerksamkeit})},
        {label:t('eo.votum'),wert:t('eo.gesetzStimmen',{n:a.nachher})},
        {label:t('ve.votum'),wert:formatDateDe(p.datum)},
      ]} aktion={t("hm.absprache",{n:a.stimmen})} gesperrt={a.moeglich?undefined:a.grund??t('vn.nichtMoeglich')} hinweis={t('hm.keineGarantie')} onAusfuehren={()=>handeln(a)}>
      <p>{t("hm.preis",{pk:a.pk,aufmerksamkeit:a.aufmerksamkeit})}</p>
      <p>{t(a.art==="einfach"?"hm.einfachRisiko":"hm.pufferRisiko")}</p>
      <p className="hm-klein">{t("hm.abspracheFolge")}</p>
      {a.kapitalDanach<0&&<p className="hm-warnung">{t("vn.aufPump",{n:zahl(a.kapitalDanach,1)})}</p>}
      {!a.moeglich&&<p className="hm-warnung">{a.grund}</p>}
      <Risiken plan={a}/>
    </EntscheidungsKarte>)}</div>:<p>{t("hm.pufferSteht")}</p>}
    <details className="hm-fraktionen" onToggle={e=>setFraktionenOffen(e.currentTarget.open)}>
      <summary>{t("hm.fraktionen")}</summary>
      {fraktionenOffen&&<>
        <p>{t("hm.auswahl")}</p>
        {wege.length===0&&<p>{t("hm.keinAbkommen")}</p>}
        {auswahl.map(a=><HaushaltsAbkommensKarte key={a.partei+a.art} world={world} plan={a} onAnnehmen={()=>handeln(a)}/>)}
        {wege.length>auswahl.length&&<button type="button" className="pd-btn quiet" onClick={()=>setAlle(true)}>{t("hm.alle",{n:wege.length})}</button>}
      </>}
    </details>
    {gehe&&<button type="button" className="pd-btn quiet" onClick={()=>gehe({art:"akte",akte:"parlament"})}>{t("hm.parlament")}</button>}
  </section>;
}
