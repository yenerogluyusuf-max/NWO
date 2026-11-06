import { VersorgungsBruchwarnung } from "../gueter/VersorgungsBruchwarnung";
import { RessortVerantwortung } from './RessortVerantwortung';
import { useState, useMemo } from 'react';
import { Portraet } from '../art/Portraet';
import type { Amt } from '../../sim/ministerfluss-typen';
import type { World } from '../../sim/types';
import { ressortAntwortPlan, beantworteRessortAnliegen, ressortEigenart, ressortInhaber, type RessortAntwort, type RessortFolge } from '../../sim/ressortanliegen';
import { NET } from '../../sim/modell';
import { POSTEN_NACH_ID } from '../../sim/haushalt';
import { addDays, formatDateDe } from '../../sim/dates';
import { t, zahl } from '../../i18n';
import { UbVerweis } from '../akte/Uebersicht';
import { EntscheidungsKarte } from '../entscheidungen/EntscheidungsKarte';
import { EntscheidungsWege } from '../entscheidungen/EntscheidungsWege';
import { Chip } from './RessortRueckhalt';
import './ressortanliegen.css';
const name=(id:string)=>NET.nodes[NET.index.get(id)??-1]?.name??id;
const sign=(n:number)=>`${n>0?'+':''}${zahl(n,2)}`;
const datum=(w:World,tag:number)=>formatDateDe(addDays(w.date,tag-w.day));
const ARTEN:RessortAntwort[]=['reden','umsetzen','spaeter','ablehnen'];
// ENTSCHEIDUNGEN Z: Rückblick als Tabelle, eine Zeile je Schritt; dieselben gebuchten Zahlen wie vorher die Sätze.
export function RessortFolgen({folgen}:{folgen:RessortFolge[]}) {
 if(!folgen.length)return null;
 return <details className="ra-folgen"><summary>{t('ra.folgen')} ({folgen.length})</summary>
  <table className="rk-tabelle"><thead><tr><th>{t('welle_b2.rk.datum')}</th><th>{t('welle_b2.rk.schritt')}</th><th>{t('welle_b2.rk.wert')}</th><th>{t('welle_b2.rk.loyalitaet')}</th><th>{t('welle_b2.rk.groll')}</th><th>{t('welle_b2.rk.preis')}</th></tr></thead><tbody>
  {folgen.slice().reverse().map((f,i)=><tr key={`${f.id}-${f.tag}-${i}`}>
   <td>{formatDateDe(f.datum)}<small>{f.name}</small></td>
   <td>{t(`ra.art.${f.art}`)}</td>
   <td>{name(f.groesse)} <span className="rk-wert">{zahl(f.vorher,2)} → {zahl(f.nachher,2)}</span></td>
   <td className="rk-wert">{sign(f.loyalitaet)}</td><td className="rk-wert">{sign(f.groll)}</td>
   <td><div className="rk-chips">
    {f.bip!==0&&<Chip label={t('welle_b2.rk.bip')} wert={`${zahl(f.bip,3)} %`}/>}
    {!!f.defizit&&<Chip label={t('welle_b2.rk.defizit')} delta={f.defizit} umgekehrt/>}
    {f.legitimitaet!==0&&<Chip label={t('welle_b2.rk.legitimitaet')} delta={f.legitimitaet}/>}
    {!!f.vertrauen&&<Chip label={t('welle_b2.rk.vertrauen')} delta={f.vertrauen}/>}
    {f.pk!==undefined&&<Chip label={t('vn.preis',{pk:zahl(f.pk,1),aufmerksamkeit:zahl(f.aufmerksamkeit??0,0)})}/>}
   </div></td>
  </tr>)}
  </tbody></table>
 </details>;
}
export function RessortAnliegenKarten({world,refresh,amt,mitNachsorge=true}:{world:World;refresh:()=>void;amt?:Amt;mitNachsorge?:boolean}) {
 const [auswahl,setAuswahl]=useState(''),[antwort,setAntwort]=useState<{ok:boolean;text:string;dialog?:{wer:string;text:string}[]}|null>(null);
 const anliegen=(world.spiel?.ministerfluss?.ressortAnliegen??[]).filter(a=>(!amt||a.amt===amt)&&['offen','besprochen','abgelehnt'].includes(a.status));
 const folgen=(world.spiel?.ministerfluss?.ressortFolgen??[]).filter(f=>!amt||f.amt===amt);
 if(!anliegen.length&&!folgen.length)return <RessortVerantwortung world={world} refresh={refresh} amt={amt} mitNachsorge={mitNachsorge} anliegenVorOrt/>;
 return <><RessortVerantwortung world={world} refresh={refresh} amt={amt} mitNachsorge={mitNachsorge} anliegenVorOrt/><section className="ra" aria-label={t('ra.titel')}><header><small>{t('ra.kicker')}</small><h3 title={t('ra.intro')}>{t('ra.titel')}</h3></header>
  {antwort&&<><p role="status">{antwort.text}</p>{antwort.dialog&&<div className="ra-dialog">{antwort.dialog.map((z,i)=><p key={i}><b>{t(`ra.sprecher.${z.wer}`)}</b> {z.text}</p>)}</div>}</>}
  {anliegen.map(a=>{
   const f=ressortInhaber(world,a);if(!f)return null;
   // Auswahl der Eigenart benötigt nur die bestehende Person; kein Profil wird durch die Anzeige angelegt.
   const eigen=ressortEigenart(structuredClone(world),a),v=a.vorschlag;
   const vtext=v?.art==='gesetz'?`${name(v.id)} → ${zahl(v.ziel,0)}`:v?.art==='haushalt'?v.aktion.art==='etat'?t('hh.etat',{name:POSTEN_NACH_ID[v.aktion.posten]!.name,ziel:v.aktion.ziel}):v.aktion.art==='programm'?t(`regierung.${v.aktion.programm}.titel`):'':t('ra.keinVorschlag');
   return <article className="ra-anliegen" id={`ressort-anliegen-${a.id}`} key={a.id}>
    <div className="ra-kopf"><div className="ra-absender"><Portraet seed={f.name} size={54} geschlecht={f.weiblich?"f":"m"} rahmen="keiner" lebendig={false}/><div><small>{f.rolle}</small><h4>{f.name}</h4></div></div><time dateTime={addDays(world.date,a.frist-world.day)} title={t('ra.fristRegel')}>{t('ra.frist',{datum:datum(world,a.frist)})}</time></div>
    <blockquote>{t(a.status==='besprochen'?'ra.nachGespraech':a.status==='abgelehnt'?'ra.zurueckgewiesen':'ra.bitte',{groesse:name(a.groesse),wert:zahl(a.vorher,1)})}</blockquote>
    {(()=>{const e=(f.eigen?.erinnerung??[]).filter(x=>x.tag<a.seit).at(-1);return e?<p className="ra-gedaechtnis">{t('ra.gedaechtnis',{datum:datum(world,e.tag),text:e.text})}</p>:null;})()}
    <p><b>{t('ra.vorschlag')}</b> {vtext}</p>
    <p className="ra-warnung">{t(eigen?.eigen?eigen.faehig?'ra.ohneEigenGut':'ra.ohneEigenSchlecht':'ra.ohneStill')}</p>
    {(eigen?.kontrolleBis??0)>world.day&&<p>{t('rp.kontrolle',{datum:datum(world,eigen!.kontrolleBis!)})}</p>}
    <button type="button" className="pd-btn" aria-expanded={auswahl===a.id} onClick={()=>setAuswahl(auswahl===a.id?'':a.id)}>{t(auswahl===a.id?'ra.schliessen':'ra.antworten')}</button>
    {auswahl===a.id&&<RessortAntwortWege key={a.id} world={world} id={a.id} onAntwort={p=>{setAntwort(beantworteRessortAnliegen(world,p));refresh();}}/>}
    <UbVerweis ziel={{art:'akte',akte:'personen'}}>{t('ra.personen')}</UbVerweis>
   </article>;
  })}
  <RessortFolgen folgen={folgen}/>
 </section></>;
}

type AntwortPlan=NonNullable<ReturnType<typeof ressortAntwortPlan>>;
export function RessortAntwortKarte({world,p,onAntwort}:{world:World;p:AntwortPlan;onAntwort:(p:AntwortPlan)=>void}) {
 const art=p.art,abstimmung=p.gesetz?.tag??p.hilfe?.programm?.vorlage.abstimmung;
 return <EntscheidungsKarte kicker={t('ra.titel')} titel={t(`ra.art.${art}`)} einleitung={t(`ra.antwort.${art}`)}
   fakten={[
     {label:t('eo.kapital'),wert:p.ok?t('ve.pk',{n:zahl(p.pk,1)}):'—'},
     {label:t('eo.aufmerksamkeit'),wert:p.ok?t('eo.punkte',{n:zahl(p.aufmerksamkeit,0)}):'—'},
     {label:t('eo.befugnis'),wert:abstimmung!==undefined?t('eo.gesetzStimmen',{n:p.gesetz?.ja??p.hilfe!.programm!.ja}):t('eo.regierung'),hinweis:t(abstimmung!==undefined?'eo.votum':'eo.keinVotum')},
     {label:t('eo.frist'),wert:p.ok?datum(world,p.frist):'—'},
   ]}
   aktion={t(`ra.art.${art}`)} gesperrt={p.ok?undefined:p.grund??t('vn.nichtMoeglich')} hinweis={t('eo.wirkungOffen')} onAusfuehren={()=>onAntwort(p)}>
   {p.ok&&<>
       {p.folge&&<p>{t('ra.sofort',{loy:sign(p.folge.loyalitaet),groll:sign(p.folge.groll)})}</p>}
       <p>{t('ra.antwortFrist',{datum:datum(world,p.frist)})}</p>
       {p.gesetz&&<p>{t('hh.mehrheit',{ja:p.gesetz.ja,fehlt:Math.max(0,301-p.gesetz.ja),datum:datum(world,p.gesetz.tag)})} {t('hh.nurEingebracht')}</p>}
       {p.hilfe&&<><p>{t('ra.haushaltFolge',{n:sign(p.hilfe.defizit),leg:sign(p.hilfe.legitimitaet)})}</p>
         {p.hilfe.programm&&<>
           <p>{t('hh.mehrheit',{ja:p.hilfe.programm.ja,fehlt:Math.max(0,301-p.hilfe.programm.ja),datum:datum(world,p.hilfe.programm.vorlage.abstimmung)})}</p>
           <p>{t('hh.programmKosten',{bip:zahl(p.hilfe.programm.konditionen.bip,3),ab:datum(world,p.hilfe.programm.vorlage.abstimmung+p.hilfe.programm.konditionen.vorlauf),bis:datum(world,p.hilfe.programm.vorlage.abstimmung+p.hilfe.programm.konditionen.vorlauf+p.hilfe.programm.konditionen.dauer)})}</p>
           <details><summary>{t('hh.auflagen')}</summary>{p.hilfe.programm.vorlage.klauseln.map(k=><p key={k}><b>{t(`mandat.${k}.titel`)}</b> {t(`mandat.${k}.text`)}</p>)}{p.hilfe.programm.reaktionen.map(r=><p key={r.partei}>{r.partei}: {t('mandat.bereitschaftDelta',{n:sign(r.bereitschaft)})}{r.personen.map(f=><span key={f.name}> · {f.name}: {sign(f.loyalitaet)}</span>)}</p>)}</details>
           <VersorgungsBruchwarnung risiken={p.hilfe.programm.risiken}/><p>{t('hh.votumOffen')}</p>
         </>}
       </>}
   </>}
 </EntscheidungsKarte>;
}
function RessortAntwortWege({world,id,onAntwort}:{world:World;id:string;onAntwort:(p:AntwortPlan)=>void}) {
 // Jeder Plan rechnet in einer Kopie der Welt (rund 45 ms); nur neu, wenn sich Tag, Anliegen oder Kapital ändern
 const pl=useMemo(()=>ARTEN.flatMap(art=>{const p=ressortAntwortPlan(world,id,art);return p?[p]:[];}),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [world,id,world.day,world.spiel?.kapital,world.spiel?.ministerfluss?.ressortAnliegen?.find(a=>a.id===id)?.status]);
 return <EntscheidungsWege wege={pl.map(p=>({id:p.art,titel:t(`ra.art.${p.art}`),kurz:t(`eo.antwort.${p.art}`),
   preis:p.ok?t('vn.preis',{pk:zahl(p.pk,1),aufmerksamkeit:zahl(p.aufmerksamkeit,0)}):t('eo.pruefen'),hinweis:p.grund}))}
   inhalt={art=>{const p=pl.find(p=>p.art===art);return p?<RessortAntwortKarte world={world} p={p} onAntwort={onAntwort}/>:null;}}/>;
}
