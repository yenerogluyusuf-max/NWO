import { useState } from 'react';
import type { World } from '../../sim/types';
import type { HaushaltsStand } from '../../sim/haushaltsbericht';
import { ressortForderungsMassnahmen, ressortForderungsKompromisse, ressortForderungsSperre, fuehreRessortForderungsHilfeAus, type RessortHilfePlan, type RessortHilfeRef } from '../../sim/ressortforderungshilfe';
import { addDays, formatDateDe } from '../../sim/dates';
import { zusageText } from '../../sim/zusagen';
import { NET } from '../../sim/modell';
import { t, zahl } from '../../i18n';
import { ZusagenDruck } from '../personen/ZusagenDruck';
import { UbVerweis } from '../akte/Uebersicht';
import { EntscheidungsKarte } from '../entscheidungen/EntscheidungsKarte';
import { EntscheidungsWege } from '../entscheidungen/EntscheidungsWege';
import './ressortforderungswege.css';
const sign=(n:number)=>`${n>0?'+':''}${zahl(n,2)}`;
const name=(id:string)=>NET.nodes[NET.index.get(id)??-1]?.name??id;
export function RessortHilfeFolgen({vor,nach}:{vor:HaushaltsStand;nach:HaushaltsStand}){
 const personen=nach.personen.filter(p=>p.loyalitaet!==(vor.personen.find(v=>v.id===p.id)?.loyalitaet??p.loyalitaet));
 const parteien=nach.parteien.filter(p=>{const v=vor.parteien.find(x=>x.partei===p.partei);return v&&(p.bereitschaft!==v.bereitschaft||p.rolle!==v.rolle);});
 return <><p>{t('rh.haushalt',{def:sign(nach.defizit-vor.defizit),leg:sign(nach.legitimitaet-vor.legitimitaet),zust:sign(nach.zustimmung-vor.zustimmung)})}</p>
  {!parteien.length&&!personen.length&&<p>{t('rh.unveraendert')}</p>}
  {parteien.map(p=><p key={p.partei}><b>{p.partei}</b> · {t(`rr.rolle.${p.rolle}`)} · {t('rr.bereit')}: {sign(p.bereitschaft-vor.parteien.find(v=>v.partei===p.partei)!.bereitschaft)}</p>)}
  {personen.map(p=><p key={p.id}>{t('rr.loyal',{name:p.name})}: {zahl(vor.personen.find(v=>v.id===p.id)!.loyalitaet,2)} → {zahl(p.loyalitaet,2)}</p>)}
 </>;
}
export function RessortHilfeKarte({world,p,onTun}:{world:World;p:RessortHilfePlan;onTun:(p:RessortHilfePlan)=>void}) {
 const v=p.votum,k=p.kompromiss;
 const titel=k?t(k.art==='absprache'?'rh.absprache':'rh.vertrag',{partei:k.art==='absprache'?'':k.partei,art:t(`rh.art.${k.art}`)}):t(p.aktion.art==='etat'?'rh.etat':p.aktion.art==='laufend'?'rh.laufend':p.fach.begrenzt?'rh.begrenzt':'rh.gesetz');
 return <EntscheidungsKarte kicker={titel} titel={`${p.name} · ${zahl(p.von,0)} → ${zahl(p.ziel,0)}`} einleitung={t('rh.fach',{name:name(p.fach.id),monate:p.fach.monate,lag:p.fach.verzoegerung})}
  fakten={[
   {label:t('eo.kapital'),wert:t('ve.pk',{n:zahl(p.pk,1)}),hinweis:k?t('eo.gemeinsamerPreis'):undefined},
   {label:t('eo.aufmerksamkeit'),wert:t('eo.punkte',{n:zahl(p.aufmerksamkeit,0)})},
   {label:t('eo.befugnis'),wert:v?t('eo.gesetzStimmen',{n:v.ja}):p.aktion.art==='etat'?t('eo.regierung'):'—',hinweis:t(v?'eo.votum':p.aktion.art==='etat'?'eo.keinVotum':'rh.prognoseGesperrt')},
   {label:t('eo.neueZusagen'),wert:p.zusagen.length,hinweis:t('eo.ergebnisfrist')+': '+formatDateDe(p.fach.frist)},
  ]}
  aktion={p.aktion.art!=='laufend'||k?t(k?'rh.paket':p.aktion.art==='etat'?'rh.nachtrag':'rh.einbringen'):undefined}
  gesperrt={p.moeglich?undefined:p.grund??t('rh.keineBuchung')} hinweis={t('eo.wirkungOffen')} onAusfuehren={()=>onTun(p)}>
  <p>{t('rh.bip',{n:sign(p.kostenBip)})}</p>
  {v?<><p className="rh-mehrheit">{t('rh.mehrheit',{ja:v.ja,fehlt:v.luecke,datum:formatDateDe(v.datum)})}{p.ohneKompromiss!==undefined&&<> {t('rh.stimmenDelta',{n:sign(v.ja-p.ohneKompromiss)})}</>}</p>
    {v.auslaufend.map(d=><p className="rh-warnung" key={d.partei}>{t('rh.duldung',{partei:d.partei,datum:formatDateDe(d.datum),sitze:d.sitze})}</p>)}
    <p className={v.datum>=p.fach.frist?'rh-warnung':undefined}>{t(v.datum>=p.fach.frist?'rh.zuSpaet':'rh.umsetzungOffen',{frist:formatDateDe(p.fach.frist)})}</p>
   </>:<p>{t(p.aktion.art==='etat'?'rh.ohneVotum':'rh.prognoseGesperrt')}</p>}
  {p.aktion.art==='etat'&&<p>{t('rh.umsetzungOffen',{frist:formatDateDe(p.fach.frist)})}</p>}
  <p>{t('rh.naechste',{datum:formatDateDe(p.fach.naechsteMeldung)})}</p>
  {p.duldungBis&&<p>{t('rh.duldungBis',{datum:formatDateDe(p.duldungBis)})}</p>}
  {p.zusagen.length?<div className="rh-zusagen"><b>{t('rh.neueZusagen')}</b>{p.zusagen.map(z=><p key={z.id}>{z.von}: {zusageText(z)} {z.massnahme&&z.stufeZiel!==undefined&&<>{name(z.massnahme)} → {zahl(z.stufeZiel,0)}. </>}{t('rh.zusagenFrist',{datum:formatDateDe(addDays(world.date,z.faellig-world.day))})}</p>)}</div>:<p>{t(p.moeglich?'rh.keineZusage':'rh.keineBuchung')}</p>}
  <details><summary>{t('rh.sofort')}</summary><RessortHilfeFolgen vor={p.vorher} nach={p.sofort}/><p>{t('ra.vertrauen',{n:sign(p.vertrauen.sofort-p.vertrauen.vorher)})}</p></details>
  {p.annahme&&<details><summary>{t('rh.annahme')}</summary><p>{t('rh.bedingt')}</p><RessortHilfeFolgen vor={p.sofort} nach={p.annahme}/><p>{t('ra.vertrauen',{n:sign((p.vertrauen.annahme??p.vertrauen.sofort)-p.vertrauen.sofort)})}</p></details>}
  {p.risiken.map((r,i)=><p className="rh-warnung" key={`${r.phase}-${r.partei}-${i}`}>{t('rh.bruch',{partei:r.partei,name:r.name,loy:zahl(r.loyalitaet,2),datum:formatDateDe(r.datum),sitze:r.sitze,phase:t(`rh.phase.${r.phase}`)})}</p>)}
  {p.druck.map(d=>d?<ZusagenDruck key={d.partei} lage={d} danach/>:null)}
  {p.moeglich&&p.kapitalDanach<0&&<p className="rh-warnung">{t('vn.aufPump',{n:zahl(p.kapitalDanach,1)})}</p>}
  {p.moeglich&&p.aufmerksamkeitDanach<20&&<p className="rh-warnung">{t('vn.erschoepfung',{n:zahl(p.aufmerksamkeitDanach,0)})}</p>}
  {!p.moeglich&&<p className="rh-warnung">{p.grund}</p>}
 </EntscheidungsKarte>;
}
// offenStart: schon geöffnet zeigen (Schreibtisch: die Zeile selbst ist der Öffner)
export function RessortForderungsWege({world,bezug,refresh,offenStart=false}:{world:World;bezug:RessortHilfeRef;refresh?:()=>void;offenStart?:boolean}){
 const [offen,setOffen]=useState(offenStart),[wahl,setWahl]=useState(''),[kompromisseOffen,setKompromisseOffen]=useState(false),[antwort,setAntwort]=useState('');
 const sperre=ressortForderungsSperre(world,bezug);
 const pl=offen&&!sperre?ressortForderungsMassnahmen(world,bezug):[];
 const ausgewaehlt=pl.find(p=>JSON.stringify(p.aktion)===wahl),kompromisse=ausgewaehlt&&kompromisseOffen?ressortForderungsKompromisse(world,bezug,ausgewaehlt.aktion):[];
 const tun=(p:RessortHilfePlan)=>{const r=fuehreRessortForderungsHilfeAus(world,p);setAntwort(r.text);setWahl('');refresh?.();};
 return <div className="rh"><button type="button" className="pd-btn" aria-expanded={offen} onClick={()=>setOffen(!offen)}>{t(offen?'rh.schliessen':'rh.oeffnen')}</button>
  {antwort&&<p role="status">{antwort}</p>}
  {offen&&<><p>{t('rh.heute',{datum:formatDateDe(world.date)})}</p><p>{t('rh.grenze')}</p>
   {sperre?<p>{sperre}</p>:<>
    {!pl.length&&<p>{t('rh.keine')}</p>}
    <EntscheidungsWege wahl={wahl} onWahl={id=>{setWahl(id??'');setKompromisseOffen(false);}}
     wege={pl.map(p=>({id:JSON.stringify(p.aktion),titel:`${p.name} · ${zahl(p.ziel,0)}`,kurz:t(p.aktion.art==='etat'?'rh.etat':p.aktion.art==='laufend'?'rh.laufend':p.fach.begrenzt?'rh.begrenzt':'rh.gesetz'),
      preis:t('vn.preis',{pk:zahl(p.pk,1),aufmerksamkeit:zahl(p.aufmerksamkeit,0)}),hinweis:p.votum?t('rh.mehrheit',{ja:p.votum.ja,fehlt:p.votum.luecke,datum:formatDateDe(p.votum.datum)}):p.grund}))}
     inhalt={id=>{const p=pl.find(p=>JSON.stringify(p.aktion)===id);return p?<>
      <RessortHilfeKarte world={world} p={p} onTun={tun}/>
      {p.aktion.art!=='etat'&&<button type="button" className="pd-btn" aria-expanded={kompromisseOffen} onClick={()=>setKompromisseOffen(!kompromisseOffen)}>{t('rh.kompromisse')}</button>}
     </>:null;}}/>
    {ausgewaehlt&&kompromisseOffen&&<section aria-label={t('rh.kompromisse')}><h5>{t('rh.kompromisse')} · {ausgewaehlt.name}</h5><p>{t('rh.paketHinweis')}</p>
     {kompromisse.length?<EntscheidungsWege key={wahl} wege={kompromisse.map(p=>({id:JSON.stringify(p.kompromiss),titel:t(p.kompromiss!.art==='absprache'?'rh.absprache':'rh.vertrag',{partei:p.kompromiss!.art==='absprache'?'':p.kompromiss!.partei,art:t(`rh.art.${p.kompromiss!.art}`)}),
       kurz:t('rh.stimmenDelta',{n:sign((p.votum?.ja??0)-(p.ohneKompromiss??0))}),preis:t('vn.preis',{pk:zahl(p.pk,1),aufmerksamkeit:zahl(p.aufmerksamkeit,0)}),hinweis:p.grund}))}
       inhalt={id=>{const p=kompromisse.find(p=>JSON.stringify(p.kompromiss)===id);return p?<RessortHilfeKarte world={world} p={p} onTun={tun}/>:null;}}/>:<p>{t('rh.keinKompromiss')}</p>}
    </section>}

   </>}
   <UbVerweis ziel={{art:'akte',akte:'parlament'}}>{t('rp.parlament')}</UbVerweis> · <UbVerweis ziel={{art:'akte',akte:'reich_haushalt'}}>{t('rh.haushaltOeffnen')}</UbVerweis>
  </>}
 </div>;
}
