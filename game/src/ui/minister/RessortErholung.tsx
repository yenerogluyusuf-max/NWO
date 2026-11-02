import { RessortForderungsWege, RessortHilfeFolgen } from './RessortForderungsWege';
import type { World } from '../../sim/types';
import { aktiveRessortNachsorge, type RessortNachsorge, type RessortMeldung } from '../../sim/ressortnachsorge';
import { AEMTER, HOCH_SCHLECHT } from '../../sim/personen';
import { NET } from '../../sim/modell';
import { POSTEN_NACH_ID } from '../../sim/haushalt';
import { addDays, formatDateDe } from '../../sim/dates';
import { t, zahl } from '../../i18n';
import { UbVerweis } from '../akte/Uebersicht';
import { RessortRueckhalt } from './RessortRueckhalt';
import './ressorterholung.css';

const name=(id:string)=>NET.nodes[NET.index.get(id)??-1]?.name??id;
const datum=(n:RessortNachsorge,tag:number)=>formatDateDe(addDays(n.datum,tag-n.seit));
function Vorschlag({m}:{m:RessortMeldung}) {
  const v=m.vorschlag;
  if(!v)return m.schritt==='anliegen'?<p>{t('ra.keinVorschlag')}</p>:null;
  const text=v.art==='gesetz'?`${name(v.id)} → ${zahl(v.ziel,0)}`:v.aktion.art==='etat'?t('hh.etat',{name:POSTEN_NACH_ID[v.aktion.posten]?.name??v.aktion.posten,ziel:v.aktion.ziel}):v.aktion.art==='programm'?t(`regierung.${v.aktion.programm}.titel`):'';
  return <p className="rn-vorschlag"><b>{t('ra.vorschlag')}</b> {text}</p>;
}
function Messung({n,m,world,refresh}:{n:RessortNachsorge;m:RessortMeldung;world?:World;refresh?:()=>void}) {
  const delta=(HOCH_SCHLECHT.has(n.groesse)?-1:1)*(m.wert-n.ausgang);
  return <>
    <p className="rn-groesse">{name(n.groesse)} · {t(HOCH_SCHLECHT.has(n.groesse)?'rn.niedrig':'rn.hoch')}</p>
    <dl className="rn-messwerte">
      <div><dt>{t('rn.ausgang')}</dt><dd>{zahl(n.ausgang,2)}</dd><small>{formatDateDe(n.datum)}</small></div>
      <div><dt>{t('rn.letzte')}</dt><dd>{zahl(m.vorher,2)}</dd></div>
      <div><dt>{t('rn.messung')}</dt><dd>{zahl(m.wert,2)}</dd><small>{formatDateDe(m.datum)}</small></div>
    </dl>
    <p>{t('rn.saldo',{n:zahl(Math.abs(delta),2),richtung:t(delta>0?'rn.besser':delta<0?'rn.schlechter':'rn.gleich')})}</p>
    <blockquote>{t(`rn.stimme.${m.entwicklung}`)}</blockquote>
    {m.wechsel&&<p>{t('rn.wechsel',{alt:m.wechsel,neu:m.name})}</p>}
    {!!m.weitereProbleme?.length&&<div className="rn-hinweis"><b>{t('rn.weitere')}</b>{m.weitereProbleme.map(p=><p key={p.groesse}>{name(p.groesse)}: {zahl(p.wert,2)} · {t(HOCH_SCHLECHT.has(p.groesse)?'rn.niedrig':'rn.hoch')}</p>)}</div>}
    <p>{t(`rn.schritt.${m.schritt}`)}</p><Vorschlag m={m}/>
    {m.frist!==undefined&&<p>{t('ra.frist',{datum:datum(n,m.frist)})}</p>}
    <RessortRueckhalt beleg={m.politik} hilfe={world?f=><RessortForderungsWege world={world} bezug={{beobachtung:n.id,forderung:f.id}} refresh={refresh}/>:undefined}/>
  </>;
}

function EingeschlageneWege({n}:{n:RessortNachsorge}) {
  if(!n.hilfen?.length)return null;
  return <details><summary>{t('rh.verlauf')}</summary><p>{t('rh.belegGrenze')}</p>{n.hilfen.slice().reverse().map((b,i)=><article key={`${b.tag}-${b.forderung}-${i}`}>
    <h5>{formatDateDe(b.datum)} · {b.name}</h5>
    {b.kompromiss&&<p>{t(`rh.art.${b.kompromiss.art}`)}{b.kompromiss.art!=='absprache'&&<> · {b.kompromiss.partei}</>}</p>}
    <p>{t('vn.preis',{pk:zahl(b.pk,1),aufmerksamkeit:zahl(b.aufmerksamkeit,0)})}</p>
    <RessortHilfeFolgen vor={b.vorher} nach={b.nachher}/>
    {!!b.zusagen.length&&<p>{t('rh.vereinbart',{parteien:b.zusagen.map(z=>z.von).join(', ')})}</p>}
  </article>)}</details>;
}

function Verlauf({n}:{n:RessortNachsorge}) {
  if(n.meldungen.length<2)return null;
  return <details><summary>{t('rn.verlauf')}</summary>{n.meldungen.slice(0,-1).reverse().map(x=><details key={x.tag}>
    <summary>{formatDateDe(x.datum)} · {x.name}: {zahl(x.vorher,2)} → {zahl(x.wert,2)} · {t(`rn.status.${x.entwicklung}`)}</summary>
    <RessortRueckhalt beleg={x.politik}/>
  </details>)}</details>;
}

export function RessortErholung({world,amt,anliegenVorOrt=false,refresh}:{world:World;refresh?:()=>void;amt?:RessortNachsorge['amt'];anliegenVorOrt?:boolean}) {
  const alle=aktiveRessortNachsorge(world).filter(n=>!amt||n.amt===amt);
  if(!alle.length)return null;
  return <section className="rn" aria-label={t('rn.titel')}><header><small>{t('rn.kicker')}</small><h3>{t('rn.titel')}</h3><p>{t('rn.intro')}</p></header>
    {alle.map(n=>{
      const m=n.meldungen.at(-1),f=world.spiel?.figuren.find(f=>f.imAmt&&f.amt===n.amt),a=m?.anliegen?world.spiel?.ministerfluss?.ressortAnliegen?.find(a=>a.id===m.anliegen):undefined;
      const offen=a&&['offen','besprochen','abgelehnt'].includes(a.status)&&a.frist>world.day;
      return <article key={n.id} className={`rn-karte rn-${m?.entwicklung??'wartet'}`}>
        <div className="rn-kopf"><div><small>{AEMTER[n.amt].ressort}</small><h4>{m?.name??f?.name??n.verantwortlich.name}</h4></div><b className="rn-status">{t(`rn.status.${m?.entwicklung??'wartet'}`)}</b></div>
        <p>{t('rn.nachEntscheidung',{art:t(n.entscheidung==='entlassen'?'rp.abschluss.entlassen':`rp.art.${n.entscheidung}`),datum:formatDateDe(n.entscheidungDatum)})}</p>
        {n.nachgetragen&&<p>{t('rn.altstand',{datum:formatDateDe(n.datum)})}</p>}
        {m?<><p className="rn-stand">{t('rn.meldungVom',{datum:formatDateDe(m.datum)})}</p><Messung n={n} m={m} world={world} refresh={refresh}/></>:<p>{t('rn.erste',{groesse:name(n.groesse),wert:zahl(n.ausgang,2)})}</p>}
        {!f?<p className="rn-hinweis">{t('rn.unbesetzt')}</p>:<p>{t('rn.naechste',{name:f.name,datum:datum(n,n.naechsteMeldung)})}</p>}
        {m?.anliegen&&<p>{t('rn.heute',{status:t(`rn.anliegen.${a?.status??'archiv'}`)})}</p>}
        {offen&&anliegenVorOrt?<a className="pd-btn" href={`#ressort-anliegen-${a.id}`}>{t('rn.antworten')}</a>:
          m?.kritisch&&<UbVerweis ziel={{art:'akte',akte:m.schritt==='verantwortung'?'parlament':'personen'}}>{t(m.schritt==='verantwortung'?'rn.verantwortung':'rn.ressortOeffnen')}</UbVerweis>}
        {!!m?.politik?.koalition.parteien.length&&<p><UbVerweis ziel={{art:'akte',akte:'parlament'}}>{t('rp.parlament')}</UbVerweis></p>}
        <EingeschlageneWege n={n}/><Verlauf n={n}/>
      </article>;
    })}<p className="rn-grenze">{t('rn.regel')}</p><p className="rn-grenze">{t('rn.grenze')}</p>
  </section>;
}

export function RessortErholungsVerlauf({beobachtungen}:{beobachtungen:RessortNachsorge[]}) {
  if(!beobachtungen.length)return null;
  return <details className="rn rn-archiv"><summary>{t('rn.titel')}</summary><p>{t('rn.historisch')}</p>
    {beobachtungen.map(n=>{const m=n.meldungen.at(-1);return <article className="rn-karte" key={n.id}><h4>{AEMTER[n.amt].ressort} · {m?.name??n.verantwortlich.name}</h4>
      <p>{t('rn.nachEntscheidung',{art:t(n.entscheidung==='entlassen'?'rp.abschluss.entlassen':`rp.art.${n.entscheidung}`),datum:formatDateDe(n.entscheidungDatum)})}</p>
      {n.nachgetragen&&<p>{t('rn.altstand',{datum:formatDateDe(n.datum)})}</p>}
      {m?<><b>{t(`rn.status.${m.entwicklung}`)}</b><Messung n={n} m={m}/></>:<p>{t('rn.erste',{groesse:name(n.groesse),wert:zahl(n.ausgang,2)})}</p>}
      <p>{t(n.status==='abgeloest'?'rn.abgeloest':'rn.naechsteHistorisch',{datum:datum(n,n.naechsteMeldung)})}</p>
      <EingeschlageneWege n={n}/><Verlauf n={n}/>
    </article>;})}<p>{t('rn.grenze')}</p>
  </details>;
}
