import { useId, useState } from 'react';
import type { World } from '../sim/types';
import { VERSPRECHEN, versprechenAngebot, type AktionErgebnis } from '../sim/wahlkampf';
import { wahlversprechenPlan, gibWahlversprechen, type WahlversprechenPlan } from '../sim/wahlversprechen-plan';
import { NET } from '../sim/modell';
import { t } from '../i18n';
import { addDays, formatDateDe } from '../sim/dates';
import { nf, vz } from './waehler/format';
import { GesetzesPrognoseHinweis } from './parlament/GesetzesPrognoseHinweis';
import { UbVerweis } from './akte/Uebersicht';

export function Wahlversprechen({world,tue}:{world:World;tue:(aktion:()=>AktionErgebnis)=>void}) {
  const [wahl,setWahl]=useState<string>(),detailId=useId();
  const plan=wahl?wahlversprechenPlan(world,wahl):undefined;
  return <>
    <p className="kampf-hinweis">{t('wv.hinweis')}</p>
    <div className="kampf-versprechen-auswahl" role="group" aria-label={t('wv.auswahl')}>
      {VERSPRECHEN.map(def=>{const a=versprechenAngebot(world,def.id)!;return <button key={def.id} type="button" aria-pressed={wahl===def.id} aria-controls={wahl===def.id?detailId:undefined} onClick={()=>setWahl(def.id)}>
        <strong>{a.def.titel}</strong><span>{a.gegeben?t('wv.gegeben'):a.bestehend?t('wv.offenKurz'):t('wv.zielKurz',{ziel:a.zusage.stufeZiel!})}</span>
        <small>{t('wv.pruefen')} →</small>
      </button>;})}
    </div>
    {plan&&<div id={detailId}><WahlversprechenKarte world={world} plan={plan} ausfuehren={()=>tue(()=>gibWahlversprechen(world,plan))}/></div>}
  </>;
}

export function WahlversprechenKarte({world,plan:p,ausfuehren}:{world:World;plan:WahlversprechenPlan;ausfuehren:()=>void}) {
  const datum=(tag:number)=>formatDateDe(addDays(world.date,tag-world.day)),g=p.gesetz;
  return <article className="kampf-entscheid kampf-versprechen-plan" aria-label={p.def.titel}>
    <header><div><span className="kampf-kicker">{t('wv.verpflichtung')}</span><h4>{p.def.titel}</h4></div><strong>{t('wv.preis',{ap:p.ap})}</strong></header>
    <dl className="kampf-versprechen-fakten">
      <div><dt>{t('wv.land')}</dt><dd>{t('wv.ziel',{jetzt:nf(p.aktuell),beschlossen:nf(p.beschlossen),ziel:nf(p.zusage.stufeZiel!)})}</dd></div>
      <div><dt>{t('wv.frist')}</dt><dd>{p.nachfolger?t('wv.nachfolgerKurz'):datum(p.zusage.faellig)}</dd></div>
    </dl>
    <p>{t(p.nachfolger?'wv.nachfolger':'wv.beschluss')}</p>
    {p.moeglich&&<><h5>{t('wv.sofort')}</h5><p>{t('wv.vertrauen',{n:vz(p.vertrauen,2)})}</p>
      <ul>{p.gruppen.map(g=><li key={g.id}>{NET.nodes[NET.index.get(g.id)!]!.name}: {vz(g.delta,2)}</li>)}</ul></>}
    <details className="kampf-verpflichtung" open>
      <summary>{t('wv.gesetz')}</summary>
      {g.erreicht?<p>{t('wv.erreicht')}</p>:<>
        <p>{t('wv.gesetzPreis',{pk:g.pk,auf:g.aufmerksamkeit,bip:vz(g.kostenBip,2),geld:vz(g.geldJahr,2),monate:g.monate})}</p>
        <p className="kampf-hinweis">{t('wv.finanzierung')}</p>
        {g.laufend&&<p>{t(g.regional?'wv.regional':'wv.laufend',{ziel:nf(g.ziel!)})} {t(g.decktZiel?'wv.deckt':'wv.decktNicht')}</p>}
        {g.prognose?<GesetzesPrognoseHinweis prognose={g.prognose}/>:<p>{t("wv.heuteStimmen",{ja:g.heutigeStimmen,fehlt:g.heutigeLuecke})}</p>}
        {g.grund&&<p className="schlecht">{t('wv.huerde',{grund:g.grund})}</p>}
        {!p.nachfolger&&g.faellig>p.zusage.faellig&&<p>{t('wv.beratung',{datum:datum(g.faellig)})}</p>}
      </>}
      <div className="kampf-plan-links">
        <UbVerweis ziel={{art:'politik',massnahme:{id:p.def.massnahme,level:p.zusage.stufeZiel,ort:null}}}>{t('wv.gesetzOeffnen')}</UbVerweis>
        <UbVerweis ziel={{art:'akte',akte:'parlament'}}>{t('kg.mehrheit')}</UbVerweis>
        <UbVerweis ziel={{art:'akte',akte:'wirtschaft',start:'haushalt'}}>{t('sd.haushalt')}</UbVerweis>
        <UbVerweis ziel={{art:'zusagen'}}>{t('kp.zusagen')}</UbVerweis>
      </div>
    </details>
    {p.jetztRisiken.map(r=><p className="schlecht" key={`jetzt-${r.partei}-${r.name}`}>{t('wv.heuteBruch',{partei:r.partei,name:r.name,n:nf(r.loyalitaet,2),sitze:r.sitze,datum:formatDateDe(p.pruefungJetzt)})}</p>)}
    {!g.erreicht&&<div className="kampf-koalitionsfolgen"><h5>{t('wv.beiBeschluss')}</h5><p className="kampf-hinweis">{t('wv.reaktionsGrenze')}</p>
      {p.reaktionen.length?<ul>{p.reaktionen.map(f=><li key={f.id}>{f.name}{f.partei?` · ${f.partei}`:''}: {t('kg.loyalitaet',{vor:nf(f.vorher,2),nach:nf(f.nachher,2)})}</li>)}</ul>:<p>{t('kg.keineReaktion')}</p>}
      {p.risiken.map(r=><p className="schlecht" key={r.partei+r.name}>{t(r.loyalitaet<20?'wv.bruch':'wv.fruehwarnung',{partei:r.partei,name:r.name,n:nf(r.loyalitaet,2),sitze:r.sitze,datum:p.pruefung?formatDateDe(p.pruefung):t('wv.terminOffen')})}</p>)}
    </div>}
    <p className="kampf-hinweis">{t('wv.bedingt')}</p>
    {p.grund&&<p role="status">{p.grund}</p>}
    <button type="button" className="pd-btn primary" disabled={!p.moeglich} onClick={ausfuehren}>{t(p.nachfolger?'wv.werben':'wv.versprechen',{ap:p.ap})}</button>
  </article>;
}
