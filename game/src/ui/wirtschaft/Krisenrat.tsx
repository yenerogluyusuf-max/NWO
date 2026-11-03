import { useEffect, useId, useRef, useState } from 'react';
import type { World } from '../../sim/types';
import { KRISENPAKETE, krisenPaketPlan, bringeKrisenPaketEin, sozialeKrisenlage, type KrisenPaket } from '../../sim/krisenpaket';
import { haushaltsTitel, POSTEN_NACH_ID } from '../../sim/haushalt';
import { NET } from '../../sim/modell';
import { t, zahl } from '../../i18n';
import { formatDateDe } from '../../sim/dates';
import { HaushaltsMehrheit } from './HaushaltsMehrheit';
import { HaushaltsNachbericht } from './HaushaltsBericht';
import { GesetzesPrognoseHinweis } from '../parlament/GesetzesPrognoseHinweis';
import { EntscheidungsKarte } from '../entscheidungen/EntscheidungsKarte';
import { ZusagenDruck } from '../personen/ZusagenDruck';
import { UbVerweis } from '../akte/Uebersicht';
import './krisenrat.css';
import { KrisenGesetze } from './KrisenGesetze';

const sign=(n:number)=>`${n>0?'+':''}${zahl(n,2)}`;
export function Krisenrat({world,geaendert}:{world:World;geaendert:()=>void}) {
  const [wahl,setWahl]=useState<KrisenPaket>(),[antwort,setAntwort]=useState<{ok:boolean;text:string}>();
  const detailId=useId(),detail=useRef<HTMLDivElement>(null);
  useEffect(()=>{if(wahl)detail.current?.focus();},[wahl]);
  const lage=sozialeKrisenlage(world),h=world.spiel?.wirtschaft?.haushalt,g=h?.gesetz;
  const p=wahl&&!g?krisenPaketPlan(world,wahl):undefined;
  return <section className="krisenrat" aria-label={t('kp.titel')}>
    <header className="kr-kopf"><span>{t('kp.kicker')}</span><h3>{t('kp.titel')}</h3><p>{t('kp.lead')}</p></header>
    <ol className="kr-schritte"><li><b>01</b>{t('kp.schritt1')}</li><li><b>02</b>{t('kp.schritt2')}</li><li><b>03</b>{t('kp.schritt3')}</li></ol>
    <dl className="kr-lage"><div><dt>{t('kp.armut')}</dt><dd>{zahl(lage.armut,1)} / 100</dd></div><div><dt>{t('kp.zustimmung')}</dt><dd>{zahl(lage.zustimmung,1)} %</dd></div><div><dt>{t('kp.sitze')}</dt><dd>{lage.sitze} / 301</dd></div></dl>
    <p className={lage.tiefstand>0?'kr-warnung':'kr-hinweis'}>{t('kp.druck',{n:lage.tiefstand})}</p>
    <KrisenGesetze world={world} geaendert={geaendert}/>
    {antwort&&<p role="status" className={`rueckmeldung ${antwort.ok?'ok':'nein'}`}>{antwort.text}</p>}
    {g?<><h4>{haushaltsTitel(g)}</h4><p>{t('kp.beratung')}</p><HaushaltsMehrheit world={world} geaendert={geaendert}/></>:<>
      <div className="kr-pakete" role="group" aria-label={t('kp.schritt1')}>{KRISENPAKETE.map((id,i)=><button type="button" key={id} aria-pressed={wahl===id} aria-controls={p&&wahl===id?detailId:undefined} onClick={()=>{setWahl(id);setAntwort(undefined);}}><span>0{i+1}</span><strong>{t(`kp.${id}.titel`)}</strong><small>{t(`kp.${id}.kurz`)}</small><em>{t('kp.pruefen')} →</em></button>)}</div>
      {p&&<div id={detailId} ref={detail} tabIndex={-1} className="kr-detail" role="region" aria-label={t(`kp.${p.id}.titel`)}><EntscheidungsKarte titel={t(`kp.${p.id}.titel`)} kicker={t('kp.nachtrag')} einleitung={t(`kp.${p.id}.text`)}
        fakten={[{label:t('eo.kapital'),wert:t('ve.pk',{n:p.pk})},{label:t('eo.aufmerksamkeit'),wert:zahl(p.aufmerksamkeit,0)},
          {label:t('kp.saldo'),wert:t('hb.ppBip',{n:sign(p.saldo)})},{label:t('kp.geld'),wert:t('kp.mrd',{n:sign(p.geldJahr)})}]}
        aktion={t('kp.einbringen')} gesperrt={p.moeglich?undefined:p.grund} hinweis={t('kp.dauer')}
        onAusfuehren={()=>{const r=bringeKrisenPaketEin(world,p);setAntwort(r);geaendert();}}>
        <p className="kr-hinweis">{t('kp.finanzierung',{vor:zahl(p.defizitVorher,2),nach:zahl(p.defizitVorher+p.saldo,2)})}</p>
        <ul className="kr-posten">{p.posten.map(e=><li key={e.id}><strong>{POSTEN_NACH_ID[e.id]!.name}</strong><span>{t('kp.stufe',{vor:e.vorher,nach:e.ziel})} · {t('hb.ppBip',{n:sign(e.saldo)})}</span><small>{t('kp.reife',{n:e.monate})} {POSTEN_NACH_ID[e.id]!.wirkung}</small><small>{POSTEN_NACH_ID[e.id]!.kehrseite}</small></li>)}</ul>
        <h5>{t('kp.gruppen')}</h5><ul>{p.gruppen.map(e=><li key={e.id}>{NET.nodes[NET.index.get(e.id)??-1]?.name??e.id}: {sign(e.delta)}</li>)}</ul><p>{t('kp.gruppenText')}</p>
        <GesetzesPrognoseHinweis prognose={p.prognose}/>
        <p>{t('kp.verhandlung')}</p>
        {p.risiken.map(r=><p key={r.partei+r.name} className="kr-warnung">{t('kp.partner',{partei:r.partei,name:r.name,n:zahl(r.loyalitaet,2),sitze:r.sitze,datum:formatDateDe(p.pruefung)})}</p>)}
        {p.druck.map(d=><ZusagenDruck key={d.partei} lage={d}/>)}
        <UbVerweis ziel={{art:'zusagen'}}>{t('kp.zusagen')}</UbVerweis>
        {p.kapitalDanach<0&&<p className="kr-warnung">{t('vn.aufPump',{n:zahl(p.kapitalDanach,1)})}</p>}
        {p.aufmerksamkeitDanach<20&&<p className="kr-warnung">{t('kp.erschoepfung',{n:zahl(p.aufmerksamkeitDanach,0)})}</p>}
      </EntscheidungsKarte></div>}
    </>}
    {!!h?.abschluesse?.length&&<details className="kr-bericht"><summary>{t('kp.schritt3')}</summary><HaushaltsNachbericht world={world} geaendert={geaendert}/></details>}
    <div className="kr-links"><UbVerweis ziel={{art:'akte',akte:'wirtschaft',start:'haushalt'}}>{t('sd.haushalt')}</UbVerweis><UbVerweis ziel={{art:'akte',akte:'parlament'}}>{t('hm.parlament')}</UbVerweis><UbVerweis ziel={{art:'zusagen'}}>{t('kp.zusagen')}</UbVerweis></div>
  </section>;
}
