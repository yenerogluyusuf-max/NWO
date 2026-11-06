import { useState } from 'react';
import type { World } from '../../sim/types';
import { haushaltsHilfen, fuehreHaushaltsHilfeAus, type HaushaltsHilfePlan } from '../../sim/haushaltshilfe';
import { POSTEN_NACH_ID } from '../../sim/haushalt';
import { naechsteKoalitionspruefung } from '../../sim/koalitionslage';
import { zusageText } from '../../sim/zusagen';
import { addDays, formatDateDe } from '../../sim/dates';
import { t, zahl } from '../../i18n';
import { ZusagenDruck } from '../personen/ZusagenDruck';
import { VersorgungsBruchwarnung } from '../gueter/VersorgungsBruchwarnung';
import { UbVerweis } from '../akte/Uebersicht';
import { EntscheidungsKarte } from '../entscheidungen/EntscheidungsKarte';
import { EntscheidungsWege } from '../entscheidungen/EntscheidungsWege';
import './haushaltshilfe.css';
const sign=(n:number)=>`${n>0?'+':''}${zahl(n,2)}`;
const datum=(w:World,tag:number)=>formatDateDe(addDays(w.date,tag-w.day));
export function haushaltsHilfeTitel(p:HaushaltsHilfePlan) {
  const a=p.aktion;
  if(a.art==='etat')return t('hh.etat',{name:POSTEN_NACH_ID[a.posten]!.name,ziel:a.ziel});
  if(a.art==='programm')return t(`regierung.${a.programm}.titel`)+(a.programm==='energie'?` · ${p.programm?.vorlage.partner??a.partner}`:'');
  if(a.art==='gespraech')return `${a.partei} · ${t(`vn.aktion.${a.weg}`)}`;
  return `${t(a.weg==='einloesen'?'zw.einloesen':'zw.vertroesten')} · ${p.zusage?.vor.von}`;
}
export function HaushaltsGegenmassnahmen({world,beschluss,geaendert}:{world:World;beschluss:string;geaendert:()=>void}) {
  const [alle,setAlle]=useState(false),[antwort,setAntwort]=useState<{ok:boolean;text:string}|null>(null);
  const pl=haushaltsHilfen(world,beschluss),cards=alle?pl:pl.slice(0,4);
  const tun=(p:HaushaltsHilfePlan)=>{setAntwort(fuehreHaushaltsHilfeAus(world,p));geaendert();};
  return <section className="hh" aria-label={t('hh.titel')}>
    <header><small>{t('hh.heute',{datum:formatDateDe(world.date)})}</small><h4>{t('hh.titel')}</h4><p>{t('welle_b1.hh.intro')}</p></header>
    {antwort&&<p role="status">{antwort.text}</p>}
    {!pl.length&&<p>{t('welle_b1.hh.keine')}</p>}
    <EntscheidungsWege wege={cards.map(p=>({id:JSON.stringify(p.aktion),titel:haushaltsHilfeTitel(p),
      kurz:t(p.programm?'eo.beraten':p.aktion.art==='gespraech'?'hh.gespraechGrenze':'eo.wirkungOffen'),
      preis:p.moeglich?t('vn.preis',{pk:zahl(p.pk,1),aufmerksamkeit:zahl(p.aufmerksamkeit,0)}):t('eo.pruefen'),hinweis:p.moeglich?undefined:p.grund}))}
      inhalt={id=>{const p=cards.find(p=>JSON.stringify(p.aktion)===id);return p?<HaushaltsHilfeKarte world={world} p={p} onTun={tun}/>:null;}}/>
    {pl.length>4&&<button type="button" className="pd-btn quiet" aria-expanded={alle} onClick={()=>setAlle(!alle)}>{t(alle?'hh.weniger':'hh.mehr',{n:pl.length-4})}</button>}
    <p><UbVerweis ziel={{art:'versorgung'}}>{t('transport.zurKarte')}</UbVerweis> · <UbVerweis ziel={{art:'akte',akte:'parlament'}}>{t('hh.verhandeln')}</UbVerweis></p>
  </section>;
}

export function HaushaltsHilfeKarte({world,p,onTun}:{world:World;p:HaushaltsHilfePlan;onTun:(p:HaushaltsHilfePlan)=>void}) {
  const a=p.aktion,v=p.programm,abstimmung=v?.vorlage.abstimmung??p.gesetz?.tag;
  return <EntscheidungsKarte kicker={t('hh.titel')} titel={haushaltsHilfeTitel(p)} einleitung={t('hh.heute',{datum:formatDateDe(world.date)})}
    fakten={[
      {label:t('eo.kapital'),wert:p.moeglich?t('ve.pk',{n:zahl(p.pk,1)}):'—'},
      {label:t('eo.aufmerksamkeit'),wert:p.moeglich?t('eo.punkte',{n:zahl(p.aufmerksamkeit,0)}):'—'},
      {label:t('eo.befugnis'),wert:v||p.gesetz?t('eo.gesetzStimmen',{n:v?.ja??p.gesetz!.ja}):t('eo.regierung'),hinweis:v||p.gesetz?t('eo.votum'):t('eo.keinVotum')},
      {label:t('eo.auftrag'),wert:abstimmung!==undefined?datum(world,abstimmung):formatDateDe(world.date),hinweis:t(abstimmung!==undefined?'eo.votum':'eo.sofort')},
    ]}
    aktion={t(a.art==='programm'?'hh.vorbereiten':'hh.ausfuehren')} gesperrt={p.moeglich?undefined:p.grund??t('vn.nichtMoeglich')} hinweis={t(v?'hh.votumOffen':'eo.wirkungOffen')} onAusfuehren={()=>onTun(p)}>
        {a.art==='etat'&&<><p>{t('hh.nachtrag',{n:sign(p.defizit),leg:sign(p.legitimitaet),monate:POSTEN_NACH_ID[a.posten]!.reifeMonate})}</p><p>{t('hh.keineNeueZusage')}</p></>}
        {a.art==='gespraech'&&<><p>{t(`vn.aktion.${a.weg}.text`)}</p><p>{t('hh.ohneVotum')}</p><p>{t('hh.gespraechGrenze')}</p></>}
        {p.zusage&&<><p>{zusageText(p.zusage.vor)}</p><p>{t('hh.zusagenFrist',{vor:datum(world,p.zusage.vor.faellig),nach:datum(world,p.zusage.nach.faellig)})}</p>
          <p>{t(p.zusage.nach.erfuellt?'hh.erfuellt':p.gesetz?'hh.nurEingebracht':'hh.weiterOffen')}</p>
          {p.gesetz?<p className="hh-mehrheit">{t('hh.mehrheit',{ja:p.gesetz.ja,fehlt:Math.max(0,301-p.gesetz.ja),datum:datum(world,p.gesetz.tag)})}</p>:<p>{t('hh.ohneVotum')}</p>}
          <p>{t('hh.keineNeueZusage')}</p>
        </>}
        {v&&<><p className="hh-mehrheit">{t('hh.mehrheit',{ja:v.ja,fehlt:Math.max(0,301-v.ja),datum:datum(world,v.vorlage.abstimmung)})}</p>
          <p>{t('hh.programmKosten',{bip:zahl(v.konditionen.bip,3),ab:datum(world,v.vorlage.abstimmung+v.konditionen.vorlauf),bis:datum(world,v.vorlage.abstimmung+v.konditionen.vorlauf+v.konditionen.dauer)})}</p>
          <p>{t(`regierung.${a.art==='programm'?a.programm:'schutz'}.wirtschaft`)}</p>
          <details><summary>{t('hh.auflagen')}</summary>
            {v.vorlage.klauseln.length?<ul>{v.vorlage.klauseln.map(k=><li key={k}><b>{t(`mandat.${k}.titel`)}</b><p>{t(`mandat.${k}.text`)}</p><small>{t('hh.fordernde',{parteien:v.stimmen.filter(f=>f.forderung===k).map(f=>f.partei).join(', ')||'—'})}</small></li>)}</ul>:<p>{t('hh.ohneAuflagen')}</p>}
            <p>{t('hh.gespraeche',{parteien:v.vorlage.gespraeche.join(', ')||'—'})}</p>
            {v.reaktionen.map(r=><p key={r.partei}>{r.partei}: {t('mandat.bereitschaftDelta',{n:sign(r.bereitschaft)})}{r.personen.map(f=><span key={f.name}> · {f.name}: {sign(f.loyalitaet)}</span>)}</p>)}
          </details>
          {v.duldungen.map(d=><p className="hh-warnung" key={d.partei}>{t('hh.duldung',{partei:d.partei,datum:datum(world,d.bis)})}</p>)}
          <VersorgungsBruchwarnung risiken={v.risiken}/><p>{t('hh.votumOffen')}</p>
        </>}
        {p.moeglich&&<>
          {p.kapitalDanach<0&&<p className="hh-warnung">{t('vn.aufPump',{n:zahl(p.kapitalDanach,1)})}</p>}
          {p.aufmerksamkeitDanach<20&&<p className="hh-warnung">{t('vn.erschoepfung',{n:zahl(p.aufmerksamkeitDanach,0)})}</p>}
          {(a.art==='gespraech'||a.art==='zusage')&&<p>{t('hh.nebenfolgen',{vertrauen:sign(p.vertrauen),leg:sign(p.legitimitaet)})}</p>}
          {p.bereitschaft.map(f=><p key={f.partei}>{f.partei}: {t('mandat.bereitschaftDelta',{n:sign(f.delta)})}</p>)}
          {p.personen.map(f=><p key={f.id}>{f.name}: {zahl(f.vorher,2)} → {zahl(f.nachher,2)} {t('vn.loyalitaet')}</p>)}
          {p.partner.filter(f=>f.personen.some(x=>x.loyalitaet<20)).map(f=><p className="hh-warnung" key={f.partei}>{f.partei}: {t('hb.gefahr',{datum:formatDateDe(naechsteKoalitionspruefung(world.date)),sitze:f.sitze})}</p>)}
          {p.druck.map(d=><ZusagenDruck key={d.partei} lage={d} danach/>)}
        </>}
  </EntscheidungsKarte>;
}
