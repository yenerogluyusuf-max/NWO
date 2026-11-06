import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import type { World } from '../../sim/types';
import { krisenAlltag, KRISENGESETZE, krisenGesetzPlan, bringeKrisenGesetzEin, type KrisenGesetz, type KrisenGesetzPlan } from '../../sim/krisengesetze';
import { t, zahl } from '../../i18n';
import { stufenName } from '../../data/skalen';
import { formatDateDe, addDays } from '../../sim/dates';
import { EntscheidungsKarte } from '../entscheidungen/EntscheidungsKarte';
import { GesetzesPrognoseHinweis } from '../parlament/GesetzesPrognoseHinweis';
import { UbVerweis } from '../akte/Uebersicht';

const sign=(n:number)=>`${n>0?'+':''}${zahl(n,2)}`;
/** Tag T5: oben die Lage der Haushalte als vier Zahlen, die Lesehilfe aufklappbar (`lesehilfe` ergänzt sie um den Tiefstand),
 *  darunter die drei gesetzlichen Wege als Kacheln; die gewählte Kachel öffnet ihre Vorlage. */
export function KrisenGesetze({world,geaendert,lesehilfe}:{world:World;geaendert:()=>void;lesehilfe?:ReactNode}) {
  const [wahl,setWahl]=useState<KrisenGesetz>(),[umfang,setUmfang]=useState<10|20>(10);
  const [antwort,setAntwort]=useState<{ok:boolean;text:string}>();
  const id=useId(),ref=useRef<HTMLDivElement>(null);
  useEffect(()=>{if(wahl)ref.current?.focus();},[wahl]);
  const plan=wahl?krisenGesetzPlan(world,wahl,umfang):undefined;
  return <div className="kr-gesetze"><section className="kr-alltag" aria-label={t('kg.titel')}>
    <header><span>{t('kg.kicker')}</span><h4>{t('kg.titel')}</h4></header>
    <dl className="kr-alltag-zahlen">{krisenAlltag(world).map(v=><div key={v.id}><dt>{t(`kp.${v.id}`)}</dt><dd>{zahl(v.wert,1)}<small>/ 100</small></dd><p className={v.trend===null?'':v.trend*v.gut>0?'besser':v.trend*v.gut<0?'schlechter':''}>{v.trend===null?t('kg.keinVerlauf'):t('kg.trend',{n:sign(v.trend)})}</p></div>)}<div><dt>{t('kg.arbeit')}</dt><dd>{zahl(world.economy.unemployment,1)}<small>%</small></dd><p>{t('kg.inflation',{n:zahl(world.economy.inflation,1)})}</p></div></dl>
    <details className="kr-lesehilfe"><summary>{t('t5.kr.lesehilfe')}</summary>{lesehilfe}<p className="kr-hinweis">{t('kg.beobachtung')}</p><p className="kr-hinweis">{t(world.economy.inflation>0?'kg.preiseSteigen':'kg.preiseGrenze')}</p></details>
    </section>
    <section className="kr-weg" aria-label={t('kg.wege')}>
    <h4 className="kr-weg-titel">{t('kg.wege')}</h4>
    <div className="kr-wahl" role="group" aria-label={t('kg.wege')}>{KRISENGESETZE.map(g=><button type="button" key={g} aria-pressed={wahl===g} aria-controls={wahl===g?id:undefined} onClick={()=>{setWahl(g);setAntwort(undefined);}}><strong>{t(`kg.${g}.titel`)}</strong><small>{t(`kg.${g}.kurz`)}</small><span>{t('kp.pruefen')} →</span></button>)}</div>
    {plan&&<div className="kr-detail" tabIndex={-1} ref={ref} id={id} role="region" aria-label={t(`kg.${plan.id}.titel`)}>
      {!plan.laufend&&!plan.umsetzung&&<fieldset className="kr-umfang"><legend>{t('kg.umfang')}</legend>{([10,20] as const).map(n=><label key={n}><input type="radio" name={`${id}-umfang`} checked={umfang===n} onChange={()=>{setUmfang(n);setAntwort(undefined);}}/>{t('kg.schritt',{n})}</label>)}</fieldset>}
      <KrisenGesetzKarte world={world} plan={plan} ausfuehren={()=>{const r=bringeKrisenGesetzEin(world,plan);setAntwort(r);geaendert();}}/>
    </div>}
    {antwort&&<p role="status" className={`rueckmeldung ${antwort.ok?'ok':'nein'}`}>{antwort.text}</p>}
  </section></div>;
}

export function KrisenGesetzKarte({world,plan:p,ausfuehren}:{world:World;plan:KrisenGesetzPlan;ausfuehren:()=>void}) {
  const datum=(tag:number)=>formatDateDe(addDays(world.date,tag-world.day));
  const vorRisiken=p.vorVotumRisiken.map(r=><p className="kr-warnung" key={`vor-${r.partei}-${r.name}`}>{t('kg.vorVotum',{partei:r.partei,name:r.name,n:zahl(r.loyalitaet,2),sitze:r.sitze,datum:formatDateDe(p.pruefung)})}</p>);
  // Mindestlohn: Die Kommission beschließt (data/rechtswege.ts); kein Plenum, keine Stimmenprognose, kein „Gesetzentwurf“.
  const kommission=p.kommission&&p.beschlussTag!==undefined?<p>{t('int.kg.kommission',{datum:datum(p.beschlussTag)})}</p>:null;
  if(p.laufend||p.umsetzung)return <section className="kr-gesetz-stand"><h4>{t(`kg.${p.id}.titel`)}</h4><p>{p.laufend&&p.kommission?t('int.kg.kommissionLaufend'):p.grund}</p>
    {p.laufend&&<p>{t(p.regional?'n9.kg.regional':'n9.kg.landes',{ziel:stufenName(p.id,p.laufendeStufe!)})}</p>}
    {kommission}
    {p.prognose&&<GesetzesPrognoseHinweis prognose={p.prognose}/>}
    {vorRisiken}
    <div className="kr-links">{!p.kommission&&<UbVerweis ziel={{art:'akte',akte:'parlament'}}>{t('kg.mehrheit')}</UbVerweis>}<UbVerweis ziel={{art:'politik',massnahme:{id:p.id,level:p.laufendeStufe??p.beschlossen,ort:null}}}>{t('kg.fortschritt')}</UbVerweis></div>
  </section>;
  return <EntscheidungsKarte kicker={t('kg.gesetz')} titel={t(`kg.${p.id}.titel`)} einleitung={t(`kg.${p.id}.text`)}
    fakten={[{label:t('n9.kg.ziel'),wert:t('n9.kg.wert',{vor:stufenName(p.id,p.aktuell),nach:stufenName(p.id,p.ziel)})},
      {label:t('eo.kapital'),wert:t('ve.pk',{n:p.pk}),hinweis:t('kg.aufmerksamkeit',{n:p.aufmerksamkeit})},
      {label:t('kg.jahreskosten'),wert:t('hb.ppBip',{n:sign(p.kostenBip)}),hinweis:t('kp.mrd',{n:sign(p.geldJahr)})},
      {label:t('kg.vollzug'),wert:t('kg.monate',{n:p.monate})}]}
    aktion={t(p.kommission?'int.kg.kommissionAktion':'kg.einbringen')} gesperrt={p.moeglich?undefined:p.grund} hinweis={t(p.kommission?'int.kg.kommissionHinweis':'kg.keinSoforteffekt')} onAusfuehren={ausfuehren}>
    <p className="kr-warnung">{t(`kg.${p.id}.preis`)}</p><p>{t('kg.finanzierung')}</p>
    {kommission}
    {p.prognose&&<GesetzesPrognoseHinweis prognose={p.prognose}/>}
    <div className="kr-links">{!p.kommission&&<UbVerweis ziel={{art:'akte',akte:'parlament'}}>{t('kg.mehrheit')}</UbVerweis>}<UbVerweis ziel={{art:'politik',massnahme:{id:p.id,level:p.ziel,ort:null}}}>{t('kg.anpassen')}</UbVerweis><UbVerweis ziel={{art:'akte',akte:'wirtschaft',start:'haushalt'}}>{t('sd.haushalt')}</UbVerweis></div>
    {p.moeglich&&<>
      <h5>{t('kg.politik')}</h5><p>{t('kg.bedingt')}</p>
      {p.reaktionen.length?<ul>{p.reaktionen.map(f=><li key={f.id}>{f.name}{f.partei?` · ${f.partei}`:''}: {t('kg.loyalitaet',{vor:zahl(f.vorher,2),nach:zahl(f.nachher,2)})}</li>)}</ul>:<p>{t('kg.keineReaktion')}</p>}
      {p.zusagen.map(z=><p key={z.id}>{t('kg.frist',{von:z.von,text:z.text,vor:datum(z.vorher),nach:datum(z.nachher)})}</p>)}
      {p.erfuellt.map(z=><p key={z.id}>{t('kg.zusage',{von:z.von,text:z.text})}</p>)}
      {p.risiken.map(r=><p className="kr-warnung" key={r.partei+r.name}>{t('kg.risiko',{partei:r.partei,name:r.name,n:zahl(r.loyalitaet,2),sitze:r.sitze})}</p>)}
      {vorRisiken}
      {(p.risiken.length>0||p.erfuellt.length>0)&&<UbVerweis ziel={{art:'zusagen'}}>{t('kp.zusagen')}</UbVerweis>}
      {p.kapitalDanach<0&&<p className="kr-warnung">{t('vn.aufPump',{n:zahl(p.kapitalDanach,1)})}</p>}
      {p.aufmerksamkeitDanach<20&&<p className="kr-warnung">{t('kp.erschoepfung',{n:zahl(p.aufmerksamkeitDanach,0)})}</p>}
    </>}
  </EntscheidungsKarte>;
}
