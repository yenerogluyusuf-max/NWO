import { useState } from "react";
import type { World } from "../../sim/types";
import { gefaehrdeteZusagen, zusagenSchrittPlan, fuehreZusagenSchrittAus, type ZusagenWarnung, type ZusagenSchrittPlan } from "../../sim/zusagenwarnung";
import { koalitionsHilfePlan, stabilisiereKoalition, type KoalitionsHilfePlan, type Stabilisierung } from "../../sim/koalitionshilfe";
import { KOALITIONSBRUCH_LOYALITAET } from "../../sim/koalitionslage";
import { zusageText } from "../../sim/zusagen";
import { PARTEI_NAME } from "../../sim/fraktionen";
import { addDays, formatDateDe } from "../../sim/dates";
import { t, zahl } from "../../i18n";
import type { Ziel } from "./briefing";
import { ZusagenDruck } from "../personen/ZusagenDruck";
import "./zusagenwache.css";

const AKTIONEN:Stabilisierung[]=["fraktion","vertrauen","rueckendeckung"];
const loyal=(n:number)=>n<20&&Math.round(n*100)/100>=20?`< ${zahl(20,0)}`:zahl(n,2);
const delta=(n:number)=>`${n>0?"+":""}${zahl(n,1)}`;
const datum=(w:World,tag:number)=>formatDateDe(addDays(w.date,tag-w.day));
const parteiName=(p:string)=>PARTEI_NAME[p]??p;
type Ergebnis={ok:boolean;text:string};

function Folgen({w,s,a}:{w:World;s:ZusagenWarnung;a:KoalitionsHilfePlan|ZusagenSchrittPlan}) {
  if(!a.moeglich) return <p className="zw-warn">{"grund" in a?a.grund:(a as ZusagenSchrittPlan).text}</p>;
  const nach=s.vorsitz.length?Math.min(...s.vorsitz.map(f=>a.personen.find(p=>p.id===f.id)?.nachher??f.loyalitaet)):undefined;
  return <>
    <p className="zw-preis">{t("vn.preis",{pk:zahl(a.pk,1),aufmerksamkeit:zahl(a.aufmerksamkeit,0)})}</p>
    {a.kapitalDanach<0&&<p className="zw-warn">{t("vn.aufPump",{n:zahl(a.kapitalDanach,1)})}</p>}
    {a.aufmerksamkeitDanach<20&&<p className="zw-warn">{t("vn.erschoepfung",{n:zahl(a.aufmerksamkeitDanach,0)})}</p>}
    <p>{t("zw.sofort",{bereitschaft:delta(a.bereitschaft),vertrauen:delta(a.vertrauen)})}</p>
    {"legitimitaet" in a&&<p>{t("zw.legitimitaet",{n:delta(a.legitimitaet as number)})}</p>}
    {s.koalition&&nach!==undefined&&<p className={nach<KOALITIONSBRUCH_LOYALITAET?"zw-warn":"zw-prognose"}>
      {t("vn.danach",{n:loyal(nach)})} {t(nach<KOALITIONSBRUCH_LOYALITAET?"vn.bleibtAkut":nach<35?"vn.knappGerettet":"vn.mehrPuffer")}
    </p>}
    <ZusagenDruck lage={a.druck} danach/>
    {"faelligDanach" in a&&a.art==="vertroesten"&&<p>{t("zw.neueFrist",{datum:datum(w,a.faelligDanach)})}</p>}
    {"faelligDanach" in a&&a.art==="einloesen"&&a.moeglich&&!a.erfuellt&&a.abstimmung!==undefined&&<p>{t("zusage.gesetz.fristDanach",{datum:datum(w,a.faelligDanach)})}</p>}
    {"abstimmung" in a&&a.abstimmung!==undefined&&!a.erfuellt&&<p className="zw-warn">{t("zw.erstVotum",{datum:datum(w,a.abstimmung)})}</p>}
    {a.personen.length>0&&<details className="zw-folgen"><summary>{t("vn.alleFolgen")}</summary><ul>{a.personen.map(p=><li key={p.id}>
      {"vorherName" in p&&p.vorherName!==p.name?`${p.vorherName} → `:""}{p.name}: {zahl(p.vorher,1)} → {zahl(p.nachher,1)}
      {"groll" in p&&p.groll!==0?` · ${t("zw.groll",{n:delta(p.groll as number)})}`:""}
    </li>)}</ul>{"ehrgeiz" in a&&<p>{t("vn.nebenfolgen",{groll:delta(a.groll),ehrgeiz:delta(a.ehrgeiz),vertrauen:delta(a.vertrauen)})}</p>}</details>}
  </>;
}

export function ZusagenSchritte({world,s,onGehe,onErgebnis}:{world:World;s:ZusagenWarnung;onGehe:(z:Ziel)=>void;onErgebnis:(r:Ergebnis)=>void}) {
  const einloesen=zusagenSchrittPlan(world,s.z.id,"einloesen"),vertroesten=zusagenSchrittPlan(world,s.z.id,"vertroesten");
  return <div className="zw-schritte">
    <p className="zw-leitlinie">{t(s.koalition?"zw.reihenfolge":s.rolle==="eigene"?"zw.eigene":"zw.opposition")}</p>
    {s.gesetz?.entwurf&&<aside className="zw-gesetz">
      <b>{t("zw.entwurf",{datum:datum(world,s.gesetz.entwurf.abstimmung),ja:s.gesetz.ja??0})}</b>
      <p>{t(s.gesetz.decktZiel?"zusage.gesetz.deckt":"zusage.gesetz.teil")}</p>
      <button type="button" className="pd-btn" onClick={()=>onGehe({art:"akte",akte:"parlament"})}>{t("zw.mehrheit")}</button>
    </aside>}
    <div className="zw-optionen">
      {[einloesen,vertroesten].map(a=>a&&<article key={a.art} className="zw-option">
        <h6>{a.art==="vertroesten"?t("zw.vertroesten"):t(s.gesetz&&!s.gesetz.erreicht?"zusage.gesetz.aktion":"zw.einloesen")}</h6>
        <p>{t(a.art==="vertroesten"?"zw.vertroestenText":s.gesetz&&!s.gesetz.erreicht?"zusage.gesetz.belohnung":"zw.einloesenText")}</p>
        <Folgen w={world} s={s} a={a}/>
        <button type="button" className="pd-btn" disabled={!a.moeglich} onClick={()=>onErgebnis(fuehreZusagenSchrittAus(world,a))}>
          {t(a.art==="vertroesten"?"zw.verschieben":"zw.ausfuehren")}
        </button>
      </article>)}
    </div>
    {s.koalition&&s.vorsitz.length>0&&<>
      <h6 className="zw-zwischen">{t("zw.gespraeche")}</h6>
      <p>{t("zw.gespraecheText")}</p>
      <div className="zw-optionen zw-gespraeche">{AKTIONEN.map(art=>{
        const a=koalitionsHilfePlan(world,s.partei,art);if(!a)return null;
        return <article key={art} className="zw-option"><h6>{t(`vn.aktion.${art}`)}</h6><p>{t(`vn.aktion.${art}.text`)}</p>
          <Folgen w={world} s={s} a={a}/>
          <button type="button" className="pd-btn" disabled={!a.moeglich} onClick={()=>onErgebnis(stabilisiereKoalition(world,a))} aria-label={t("vn.handelnName",{aktion:t(`vn.aktion.${art}`),partei:parteiName(s.partei)})}>{t("vn.handeln")}</button>
        </article>;
      })}</div>
    </>}
    {s.erinnerung&&<button type="button" className="pd-btn quiet" onClick={()=>onGehe({art:"ereignis",id:s.erinnerung!.id})}>{t("zw.erinnerungOeffnen")}</button>}
  </div>;
}

export function ZusagenWache({world,refresh,onGehe,zusageId}:{world:World;refresh:()=>void;onGehe:(z:Ziel)=>void;zusageId?:string}) {
  const [auswahl,setAuswahl]=useState("");
  const [alle,setAlle]=useState(false);
  const [antwort,setAntwort]=useState<Ergebnis|null>(null);
  // Kein Cache über Tag/Zusagenanzahl: auch Frist, Loyalität und Gesprächssperre können sich noch am selben Tag ändern.
  const sicht=gefaehrdeteZusagen(world).filter(s=>zusageId===undefined||s.z.id===zusageId),offen=auswahl;
  const druck=[...new Map(sicht.flatMap(s=>s.druck?[[s.partei,s.druck] as const]:[])).values()];
  if(!sicht.length&&!antwort)return null;
  const handle=(r:Ergebnis)=>{setAntwort(r);refresh();};
  return <section className="zw" aria-label={t("zw.titel")}>
    <header className="zw-kopf"><div><span>{t("zw.kicker")}</span><h4>{t("zw.titel")}</h4><p>{t("zw.intro")}</p></div>
      <button type="button" className="pd-btn quiet" onClick={()=>onGehe({art:"zusagen"})}>{t("zw.alleZusagen")}</button>
    </header>
    {antwort&&<p role="status" className={`zw-antwort ${antwort.ok?"gut":"zw-warn"}`}>{antwort.text}</p>}
    {!sicht.length&&<p>{t("zw.keineGefahr")}</p>}
    {druck.map(d=><ZusagenDruck key={d.partei} lage={d} onErinnerung={id=>onGehe({art:"ereignis",id})}/>)}
    {(alle?sicht:sicht.slice(0,3)).map(s=><article key={s.z.id} className={`zw-zusage ${s.akut?"akut":""}`}>
      <div className="zw-kartenkopf"><div><span className="zw-fraktion">{parteiName(s.partei)} · {t(`zw.rolle.${s.rolle}`)}</span><h5>{zusageText(s.z)}</h5></div>
        <div className="zw-frist"><b>{t(s.tage<0?"zw.ueberfaellig":s.tage===0?"zw.heute":"zw.inTagen",{n:Math.abs(s.tage)})}</b><time dateTime={addDays(world.date,s.z.faellig-world.day)}>{datum(world,s.z.faellig)}</time></div>
      </div>
      {s.erinnerung&&<p className="zw-warn">{t("zw.erinnerung",{datum:datum(world,s.erinnerung.frist)})}</p>}
      <div className="zw-lage"><p>{t(s.akut?"zw.akut":s.wenigRueckhalt?"zw.wenig":s.koalition?"zw.fristRisiko":"zw.fraktionRisiko")}</p>
        {s.koalition&&<p>{t("zw.pruefung",{datum:formatDateDe(s.pruefung),sitze:s.sitze,rest:s.ohne})}</p>}
        {s.vorsitz.map(f=><p className="zw-person" key={f.id}>{f.name} · {t("vn.loyalitaetswert",{n:loyal(f.loyalitaet),grenze:20})}</p>)}
        {s.koalition&&!s.vorsitz.length&&<p>{t("vn.keinVorsitz")}</p>}
        {s.koalition&&s.nachVerfall!==undefined&&<p>{t("zw.verfall",{n:zahl(s.nachVerfall,2)})}</p>}
        {s.gruende.includes("spaet")&&<p className="zw-warn">{t("zw.zuSpaet")}</p>}
        {s.gruende.includes("mehrheit")&&<p className="zw-warn">{t("zw.knapp",{ja:s.gesetz?.ja??0})}</p>}
        {s.gruende.includes("teil")&&<p className="zw-warn">{t("zusage.gesetz.teil")}</p>}
      </div>
      <p className="zw-empfehlung">{t(s.akut?"zw.empfehlung.akut":s.gesetz?.entwurf?"zw.empfehlung.gesetz":"zw.empfehlung.erfuellen")}</p>
      <button type="button" className="pd-btn zw-oeffnen" aria-expanded={offen===s.z.id} aria-controls={`zw-schritte-${s.z.id}`} onClick={()=>setAuswahl(offen===s.z.id?"":s.z.id)}>{t(offen===s.z.id?"zw.schliessen":"zw.schritte")}</button>
      <div id={`zw-schritte-${s.z.id}`} hidden={offen!==s.z.id}>{offen===s.z.id&&<ZusagenSchritte world={world} s={s} onGehe={onGehe} onErgebnis={handle}/>}</div>
    </article>)}
    {sicht.length>3&&<button type="button" className="pd-btn quiet" onClick={()=>setAlle(a=>!a)}>{t(alle?"zw.weniger":"zw.mehr",{n:sicht.length-3})}</button>}
  </section>;
}
