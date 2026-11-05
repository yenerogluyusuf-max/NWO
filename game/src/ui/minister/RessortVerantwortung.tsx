import { RessortErholung } from './RessortErholung';
import { useState } from 'react';
import type { World } from '../../sim/types';
import { offeneRessortVorfaelle, ressortPolitikPlan, entscheideRessortVorfall, type RessortReaktion, type RessortPolitikBeleg, type RessortVorfall } from '../../sim/ressortpolitik';
import { formatDateDe, addDays } from '../../sim/dates';
import { t, zahl } from '../../i18n';
import { NET } from '../../sim/modell';
import { AEMTER } from '../../sim/personen';
import { UbVerweis } from '../akte/Uebersicht';
import { ZusagenDruck } from '../personen/ZusagenDruck';
import { EntscheidungsKarte } from '../entscheidungen/EntscheidungsKarte';
import { EntscheidungsWege } from '../entscheidungen/EntscheidungsWege';
import './ressortverantwortung.css';

const arten:RessortReaktion[]=['stuetzen','zurueckpfeifen','entlassen'];
const sign=(n:number)=>`${n>0?'+':''}${zahl(n,2)}`;
const tagDatum=(datum:string,tag:number,ziel:number)=>formatDateDe(addDays(datum,ziel-tag));
const knoten=(id:string)=>NET.nodes[NET.index.get(id)??-1]?.name??id;
const ausgang=(v:RessortVorfall)=>v.art==='auftragVerfehlt'?'rp.auftrag':v.art==='stillstand'?'rp.stillstand':v.erfolg?'rp.eigenGut':'rp.eigenSchlecht';
export function RessortPolitikFolgen({b}:{b:RessortPolitikBeleg}) {
  return <div className="rp-folgen">
    <p>{t('rp.sofort',{vertrauen:sign(b.vertrauen),leg:sign(b.legitimitaet)})}</p>
    {b.risikoaufschlag!==0||b.glaubwuerdigkeit!==0?<p>{t('rp.markt',{risiko:sign(b.risikoaufschlag),glaub:sign(b.glaubwuerdigkeit)})}</p>:null}
    {b.kontrolleBis!==undefined&&<p>{t('rp.kontrolle',{datum:tagDatum(b.datum,b.tag,b.kontrolleBis)})}</p>}
    {b.nachfolger&&<p>{t('rp.nachfolger',{name:b.nachfolger.name,partei:b.nachfolger.partei??t('rp.parteilos'),faehigkeit:zahl(b.nachfolger.faehigkeit,0),loyalitaet:zahl(b.nachfolger.loyalitaet,0),datum:tagDatum(b.datum,b.tag,b.nachfolger.einarbeitungBis??b.tag)})}</p>}
    {b.nachfolger?.kommissarisch&&<p>{t('rp.kommissarisch')}</p>}
    {b.opposition&&<p className="rp-opposition">{t('rp.opposition',{partei:b.opposition.partei,vor:zahl(b.opposition.vorher,2),nach:zahl(b.opposition.nachher,2)})} {t(`rp.opp.${b.art}`,{partei:b.opposition.partei,name:''})}</p>}
    <details><summary>{t('rp.fraktionen')}</summary>
      {b.parteien.map(p=><p key={p.partei}><b>{p.partei} · {t(`zw.rolle.${p.rolle}`)}</b><br/>{t(`rp.grund.${p.grund}`)} {t('rp.bereitschaft',{vor:zahl(p.vorher,2),nach:zahl(p.nachher,2)})}</p>)}
      {b.personen.map(p=><p key={p.id}>{p.nachfolger?t('rp.personWechsel',{alt:p.name,neu:p.nachfolger}):t('rp.person',{name:p.name,vor:zahl(p.loyalitaetVor,2),nach:zahl(p.loyalitaetNach,2),groll:sign(p.grollNach-p.grollVor)})}</p>)}
    </details>
  </div>;
}
export function RessortPolitikVerlauf({vorfaelle}:{vorfaelle:RessortVorfall[]}) {
  if(!vorfaelle.length)return null;
  return <details className="rp-verlauf"><summary>{t('rp.verlauf')}</summary><p>{t('rp.historisch')}</p>
    {vorfaelle.slice().reverse().map(v=><article key={v.id}>
      <h5>{v.name} · {formatDateDe(v.datum)}</h5>
      <p>{t(ausgang(v))}</p>
      <RessortPolitikFolgen b={v.reaktion}/>
      {v.entscheidung?<><h5>{t(v.entscheidung.art==='entlassen'?'rp.abschluss.entlassen':`rp.art.${v.entscheidung.art}`)} · {formatDateDe(v.entscheidung.datum)}</h5><p>{t('vn.preis',{pk:zahl(v.entscheidung.pk,1),aufmerksamkeit:zahl(v.entscheidung.aufmerksamkeit,0)})}</p><RessortPolitikFolgen b={v.entscheidung}/></>:<p>{t(v.geschlossen?`rp.${v.geschlossen}`:'rp.offen')}</p>}
    </article>)}
  </details>;
}
export function RessortReaktionsOption({world,id,art,onEntscheide}:{world:World;id:string;art:RessortReaktion;onEntscheide:(p:NonNullable<ReturnType<typeof ressortPolitikPlan>>)=>void}) {
  const p=ressortPolitikPlan(world,id,art);if(!p)return null;
  return <EntscheidungsKarte kicker={t('rp.titel')} titel={t(`rp.art.${art}`)} einleitung={t(`rp.text.${art}`)}
    fakten={[
      {label:t('eo.kapital'),wert:t('ve.pk',{n:zahl(p.pk,1)})},
      {label:t('eo.aufmerksamkeit'),wert:t('eo.punkte',{n:zahl(p.aufmerksamkeit,0)})},
      {label:t('eo.befugnis'),wert:t('eo.regierung'),hinweis:t('eo.keinVotum')},
      {label:t('eo.frist'),wert:formatDateDe(p.pruefung),hinweis:t('eo.koalitionspruefung')},
    ]}
    aktion={t(`rp.art.${art}`)} gesperrt={p.ok?undefined:p.grund??t('vn.nichtMoeglich')} hinweis={t('rp.grenze')} onAusfuehren={()=>onEntscheide(p)}>
    {p.ok&&p.beleg?<>
      <RessortPolitikFolgen b={p.beleg}/>
      {p.beleg.kapitalDanach<0&&<p className="rp-warnung">{t('vn.aufPump',{n:zahl(p.beleg.kapitalDanach,1)})}</p>}
      {p.beleg.aufmerksamkeitDanach<20&&<p className="rp-warnung">{t('vn.erschoepfung',{n:zahl(p.beleg.aufmerksamkeitDanach,0)})}</p>}
      {p.risiken.length>0?<div className="rp-warnung"><p>{t('rp.bruch',{datum:formatDateDe(p.pruefung),parteien:p.risiken.map(r=>r.partei).join(', '),vor:p.sitze,nach:p.danach,fehlt:Math.max(0,301-p.danach)})}</p>
        {p.risiken.flatMap(r=>r.personen.map(f=><p key={`${r.partei}-${f.name}`}>{f.name}: {f.loyalitaet<20&&Math.round(f.loyalitaet*100)/100>=20?'< 20':zahl(f.loyalitaet,2)} · {r.sitze} {t('rp.sitze')}</p>))}
      </div>:<p>{t('rp.keinBruch')}</p>}
      {p.druck.map(d=><ZusagenDruck key={d.partei} lage={d} danach/>)}
    </>:<p className="rp-warnung">{p.grund}</p>}
  </EntscheidungsKarte>;
}
export function RessortVerantwortung({world,refresh,amt,anliegenVorOrt=false,mitNachsorge=true}:{world:World;refresh:()=>void;amt?:RessortVorfall['amt'];anliegenVorOrt?:boolean;mitNachsorge?:boolean}) {
  const [antwort,setAntwort]=useState('');
  const offen=offeneRessortVorfaelle(world).filter(v=>!amt||v.amt===amt),alle=(world.spiel?.ministerfluss?.ressortVorfaelle??[]).filter(v=>!amt||v.amt===amt);
  if(!alle.length)return mitNachsorge?<RessortErholung refresh={refresh} world={world} amt={amt} anliegenVorOrt={anliegenVorOrt}/>:null;
  return <>{mitNachsorge&&<RessortErholung refresh={refresh} world={world} amt={amt} anliegenVorOrt={anliegenVorOrt}/>}<section className="rp" aria-label={t('rp.titel')}>
    {antwort&&<p role="status">{antwort}</p>}
    {offen.map(v=><article className="rp-vorfall" key={v.id}>
      <div className="rp-kopf"><h4>{v.name} · {AEMTER[v.amt].ressort}{v.partei?` · ${v.partei}`:''}</h4><time>{formatDateDe(v.datum)}</time></div>
      <p>{t(ausgang(v))}</p>
      {/* Vorgabe V: ganze Zahlen, Zusatzkosten nur, wenn es welche gibt; die drei Antworten stehen gleich da (früher erst nach „vergleichen“) */}
      <p>{t('rp.sachfolgeKurz',{name:knoten(v.folge.groesse),vor:zahl(v.folge.vorher,0),nach:zahl(v.folge.nachher,0)})}{v.folge.bip>0.0005?` ${t('rp.sachKosten',{bip:zahl(v.folge.bip,2)})}`:''}</p>
      <RessortReaktionsWege key={v.id} world={world} id={v.id} onEntscheide={p=>{const r=entscheideRessortVorfall(world,p);setAntwort(r.text);refresh();}}/>
      <details><summary>{t('rp.schonGebucht')}</summary><RessortPolitikFolgen b={v.reaktion}/></details>
    </article>)}
    <details className="rp-grenze"><summary>{t('rp.grenzeTitel')}</summary><p>{t('rp.grenze')}</p></details>
    <p><UbVerweis ziel={{art:'akte',akte:'parlament'}}>{t('rp.parlament')}</UbVerweis> · <UbVerweis ziel={{art:'akte',akte:'personen'}}>{t('rp.nachfolge')}</UbVerweis></p>
    <RessortPolitikVerlauf vorfaelle={alle}/>
  </section></>;
}

function RessortReaktionsWege({world,id,onEntscheide}:{world:World;id:string;onEntscheide:(p:NonNullable<ReturnType<typeof ressortPolitikPlan>>)=>void}) {
 const pl=arten.flatMap(art=>{const p=ressortPolitikPlan(world,id,art);return p?[p]:[];});
 return <EntscheidungsWege wege={pl.map(p=>({id:p.art,titel:t(`rp.art.${p.art}`),kurz:t(`eo.reaktion.${p.art}`),preis:t('vn.preis',{pk:zahl(p.pk,1),aufmerksamkeit:zahl(p.aufmerksamkeit,0)}),hinweis:p.grund}))}
   inhalt={art=><RessortReaktionsOption world={world} id={id} art={art as RessortReaktion} onEntscheide={onEntscheide}/>}/>;
}
