import { RessortForderungsWege, RessortHilfeFolgen } from './RessortForderungsWege';
import type { World } from '../../sim/types';
import { aktiveRessortNachsorge, type RessortNachsorge, type RessortMeldung } from '../../sim/ressortnachsorge';
import { AEMTER, HOCH_SCHLECHT } from '../../sim/personen';
import { NET } from '../../sim/modell';
import { POSTEN_NACH_ID } from '../../sim/haushalt';
import { addDays, formatDateDe } from '../../sim/dates';
import { t, zahl } from '../../i18n';
import { UbVerweis } from '../akte/Uebersicht';
import { Chip, RessortRegeln, RessortRueckhalt } from './RessortRueckhalt';
import './ressorterholung.css';

// ENTSCHEIDUNGEN Z (06.11.2026): Jede Meldung ist eine Karte mit Kennzahlen und Chips. Erklärsätze, die Status oder Zahl
// wiederholen, entfallen; die Regeln der Messung stehen einmal je Liste hinter „Wie die Bewertung funktioniert“.
const name=(id:string)=>NET.nodes[NET.index.get(id)??-1]?.name??id;
const datum=(n:RessortNachsorge,tag:number)=>formatDateDe(addDays(n.datum,tag-n.seit));
const ausloeser=(n:RessortNachsorge)=>t(n.entscheidung==='entlassen'?'rp.abschluss.entlassen':`rp.art.${n.entscheidung}`);
function Vorschlag({m}:{m:RessortMeldung}) {
  const v=m.vorschlag;
  if(!v)return m.schritt==='anliegen'?<Chip label={t('ra.vorschlag')} wert={t('welle_b2.rn.keinVorschlag')}/>:null;
  const text=v.art==='gesetz'?`${name(v.id)} → ${zahl(v.ziel,0)}`:v.aktion.art==='etat'?t('hh.etat',{name:POSTEN_NACH_ID[v.aktion.posten]?.name??v.aktion.posten,ziel:v.aktion.ziel}):v.aktion.art==='programm'?t(`regierung.${v.aktion.programm}.titel`):'';
  return <p className="rn-vorschlag"><b>{t('ra.vorschlag')}</b> {text}</p>;
}
function Messung({n,m,world,refresh}:{n:RessortNachsorge;m:RessortMeldung;world?:World;refresh?:()=>void}) {
  const delta=(HOCH_SCHLECHT.has(n.groesse)?-1:1)*(m.wert-n.ausgang);
  return <>
    <dl className="rn-messwerte" aria-label={name(n.groesse)}>
      <div className="rn-groesse"><dt>{name(n.groesse)}</dt><dd>{t(HOCH_SCHLECHT.has(n.groesse)?'welle_b2.rn.niedrig':'welle_b2.rn.hoch')}</dd></div>
      <div><dt>{t('rn.ausgang')}</dt><dd>{zahl(n.ausgang,2)}</dd><small>{formatDateDe(n.datum)}</small></div>
      <div><dt>{t('rn.letzte')}</dt><dd>{zahl(m.vorher,2)}</dd></div>
      <div><dt>{t('rn.messung')}</dt><dd>{zahl(m.wert,2)}</dd><small>{formatDateDe(m.datum)}</small></div>
      <div className={`rn-saldo ${delta>0?'gut':delta<0?'schlecht':''}`}><dt>{t('welle_b2.rn.saldo')}</dt><dd>{`${delta>0?'+':''}${zahl(delta,2)}`}</dd></div>
    </dl>
    <div className="rk-chips">
      <Chip klasse="rk-schritt" label={t(`welle_b2.rn.schritt.${m.schritt}`)} title={t(`rn.schritt.${m.schritt}`)}/>
      {m.wechsel&&<Chip label={t('welle_b2.rn.wechsel')} wert={`${m.wechsel} → ${m.name}`}/>}
      {m.frist!==undefined&&<Chip label={t('welle_b2.rn.frist')} wert={datum(n,m.frist)}/>}
      {m.weitereProbleme?.map(p=><Chip key={p.groesse} klasse="schlecht" label={name(p.groesse)} wert={zahl(p.wert,2)} title={t('rn.weitere')}/>)}
    </div>
    <Vorschlag m={m}/>
    <RessortRueckhalt beleg={m.politik} hilfe={world?f=><RessortForderungsWege world={world} bezug={{beobachtung:n.id,forderung:f.id}} refresh={refresh}/>:undefined}/>
  </>;
}

function EingeschlageneWege({n}:{n:RessortNachsorge}) {
  if(!n.hilfen?.length)return null;
  return <details><summary>{t('rh.verlauf')}</summary>{n.hilfen.slice().reverse().map((b,i)=><article className="rk-eintrag" key={`${b.tag}-${b.forderung}-${i}`}>
    <h5>{formatDateDe(b.datum)} · {b.name}</h5>
    <div className="rk-chips">
      {b.kompromiss&&<Chip label={t(`rh.art.${b.kompromiss.art}`)} wert={b.kompromiss.art!=='absprache'?b.kompromiss.partei:undefined}/>}
      <Chip label={t('welle_b2.rk.preis')} wert={t('vn.preis',{pk:zahl(b.pk,1),aufmerksamkeit:zahl(b.aufmerksamkeit,0)})}/>
      {!!b.zusagen.length&&<Chip label={t('welle_b2.rk.zusagen')} wert={b.zusagen.map(z=>z.von).join(', ')}/>}
    </div>
    <RessortHilfeFolgen vor={b.vorher} nach={b.nachher}/>
  </article>)}</details>;
}

function Verlauf({n}:{n:RessortNachsorge}) {
  if(n.meldungen.length<2)return null;
  return <details className="rn-verlauf"><summary>{t('rn.verlauf')} ({n.meldungen.length-1})</summary>{n.meldungen.slice(0,-1).reverse().map(x=><details key={x.tag}>
    <summary><span>{formatDateDe(x.datum)} · {x.name}</span><span className="rk-wert">{zahl(x.vorher,2)} → {zahl(x.wert,2)}</span><span className={`rk-status rn-s-${x.entwicklung}`}>{t(`rn.status.${x.entwicklung}`)}</span></summary>
    <RessortRueckhalt beleg={x.politik}/>
  </details>)}</details>;
}

function Kopf({n,titel,status}:{n:RessortNachsorge;titel:string;status:string}) {
  return <div className="rn-kopf"><div><small>{AEMTER[n.amt].ressort}</small><h4>{titel}</h4></div><b className="rn-status">{status}</b></div>;
}
function Ausloeser({n}:{n:RessortNachsorge}) {
  return <div className="rk-chips">
    <Chip label={t('welle_b2.rn.ausloeser')} wert={`${ausloeser(n)} · ${formatDateDe(n.entscheidungDatum)}`}/>
    {n.nachgetragen&&<Chip label={t('welle_b2.rn.altstand')} wert={formatDateDe(n.datum)} title={t('rn.altstand',{datum:formatDateDe(n.datum)})}/>}
  </div>;
}

export function RessortErholung({world,amt,anliegenVorOrt=false,refresh}:{world:World;refresh?:()=>void;amt?:RessortNachsorge['amt'];anliegenVorOrt?:boolean}) {
  const alle=aktiveRessortNachsorge(world).filter(n=>!amt||n.amt===amt);
  if(!alle.length)return null;
  return <section className="rn" aria-label={t('rn.titel')}><header><small>{t('rn.kicker')}</small><h3>{t('rn.titel')}</h3></header>
    {alle.map(n=>{
      const m=n.meldungen.at(-1),f=world.spiel?.figuren.find(f=>f.imAmt&&f.amt===n.amt),a=m?.anliegen?world.spiel?.ministerfluss?.ressortAnliegen?.find(a=>a.id===m.anliegen):undefined;
      const offen=a&&['offen','besprochen','abgelehnt'].includes(a.status)&&a.frist>world.day;
      return <article key={n.id} className={`rn-karte rn-${m?.entwicklung??'wartet'}`}>
        <Kopf n={n} titel={m?.name??f?.name??n.verantwortlich.name} status={t(`rn.status.${m?.entwicklung??'wartet'}`)}/>
        <Ausloeser n={n}/>
        {m?<Messung n={n} m={m} world={world} refresh={refresh}/>:<div className="rk-chips"><Chip label={t('welle_b2.rn.erste',{groesse:name(n.groesse)})} wert={zahl(n.ausgang,2)} title={t('rn.erste',{groesse:name(n.groesse),wert:zahl(n.ausgang,2)})}/></div>}
        <div className="rk-chips rn-fuss">
          {!f?<Chip klasse="schlecht" label={t('welle_b2.rn.unbesetzt')} title={t('rn.unbesetzt')}/>:<Chip label={t('welle_b2.rn.naechste',{name:f.name})} wert={datum(n,n.naechsteMeldung)}/>}
          {m?.anliegen&&<Chip label={t('welle_b2.rn.anliegen')} wert={t(`rn.anliegen.${a?.status??'archiv'}`)}/>}
        </div>
        {(offen&&anliegenVorOrt)||m?.kritisch||m?.politik?.koalition.parteien.length?<p className="rn-wege">
          {offen&&anliegenVorOrt?<a className="pd-btn" href={`#ressort-anliegen-${a.id}`}>{t('rn.antworten')}</a>:
            m?.kritisch&&<UbVerweis ziel={{art:'akte',akte:m.schritt==='verantwortung'?'parlament':'personen'}}>{t(m.schritt==='verantwortung'?'rn.verantwortung':'rn.ressortOeffnen')}</UbVerweis>}
          {!!m?.politik?.koalition.parteien.length&&<UbVerweis ziel={{art:'akte',akte:'parlament'}}>{t('rp.parlament')}</UbVerweis>}
        </p>:null}
        <EingeschlageneWege n={n}/><Verlauf n={n}/>
      </article>;
    })}<RessortRegeln/>
  </section>;
}

export function RessortErholungsVerlauf({beobachtungen}:{beobachtungen:RessortNachsorge[]}) {
  if(!beobachtungen.length)return null;
  return <details className="rn rn-archiv"><summary title={t('rn.historisch')}>{t('rn.titel')} ({beobachtungen.length})</summary>
    {beobachtungen.map(n=>{const m=n.meldungen.at(-1);return <article className={`rn-karte rn-${m?.entwicklung??'wartet'}`} key={n.id}>
      <Kopf n={n} titel={m?.name??n.verantwortlich.name} status={m?t(`rn.status.${m.entwicklung}`):t('rn.status.wartet')}/>
      <Ausloeser n={n}/>
      {m?<Messung n={n} m={m}/>:<div className="rk-chips"><Chip label={t('welle_b2.rn.erste',{groesse:name(n.groesse)})} wert={zahl(n.ausgang,2)}/></div>}
      <div className="rk-chips rn-fuss"><Chip label={t(n.status==='abgeloest'?'welle_b2.rn.abgeloest':'welle_b2.rn.naechsteHistorisch')} wert={n.status==='abgeloest'?undefined:datum(n,n.naechsteMeldung)} title={n.status==='abgeloest'?t('rn.abgeloest'):undefined}/></div>
      <EingeschlageneWege n={n}/><Verlauf n={n}/>
    </article>;})}<RessortRegeln/>
  </details>;
}
