import { useId, useRef, useState } from 'react';
/** Eingeklappt bleibt die Leiste über Sitzungen hinweg (Vorgabe S: mehr mit der Karte arbeiten) */
const SCHMAL='nwo.leiste.schmal';
const leseSchmal=():boolean=>{try{return localStorage.getItem(SCHMAL)==='ja';}catch{return false;}};
import { Icon, type IconName } from '../icons';
import { t } from '../../i18n';
import './navigation.css';
export interface NavigationsEintrag {id:string;kurz:string;titel:string;icon:IconName;badge?:number;umlauf?:number}
const GRUPPEN=[['regieren',['schreibtisch','politik','gesetze','personen']],['land',['wirtschaft','waehler','reich_infra','fokusbaum']],['welt',['welt','streitkraefte','zeitung']]] as const;
export function navigationsGruppen<T extends NavigationsEintrag>(eintraege:T[]) {
  return GRUPPEN.map(([id,ids])=>({id,eintraege:ids.flatMap(z=>eintraege.filter(e=>e.id===z))}));
}
export function RegierungsNavigation({eintraege,aktiv,onWaehlen}:{eintraege:NavigationsEintrag[];aktiv?:string;onWaehlen:(id:string)=>void}) {
  const [offen,setOffen]=useState(false),[schmal,setSchmal]=useState(leseSchmal),id=useId(),schalter=useRef<HTMLButtonElement>(null);
  const umschalten=()=>{const n=!schmal;setSchmal(n);try{localStorage.setItem(SCHMAL,n?'ja':'nein');}catch{/* gilt nur für diese Sitzung */}};
  return <><button type="button" ref={schalter} className="rn-schalter" aria-controls={id} aria-expanded={offen} onClick={()=>setOffen(o=>!o)}><Icon name="kuppel" size={18}/>{t('rn.bereiche')}<span aria-hidden>{offen?'×':'☰'}</span></button>
    <nav id={id} className={`dossier-menu regierungs-navigation${offen?' rn-offen':''}${schmal?' rn-schmal':''}`} aria-label={t('nav.aria')} onKeyDown={e=>{if(e.key==='Escape'&&offen){setOffen(false);schalter.current?.focus();}}}>
      <div className="rn-marke"><span className="rn-marke-text">{t('rn.marke')}<small>{t('rn.unter')}</small></span><button type="button" className="rn-klappe" aria-pressed={schmal} title={t(schmal?'rn.ausklappen':'rn.einklappen')} aria-label={t(schmal?'rn.ausklappen':'rn.einklappen')} onClick={umschalten}><span aria-hidden>{schmal?'»':'«'}</span></button></div>
      {navigationsGruppen(eintraege).map(g=><section key={g.id} aria-label={t(`rn.${g.id}`)}><h3>{t(`rn.${g.id}`)}</h3>{g.eintraege.map(m=><button type="button" key={m.id} className={aktiv===m.id?'on':''} aria-current={aktiv===m.id?'page':undefined} title={m.titel} onClick={()=>{onWaehlen(m.id);setOffen(false);}}>
        <Icon name={m.icon} size={21}/><span className="menu-kurz">{m.kurz}</span><span className="rn-zahlen">{m.badge!==undefined&&<b aria-label={t('rn.offen',{n:m.badge})}>{m.badge>99?'99+':m.badge}</b>}{m.umlauf!==undefined&&<b className="ruhig" aria-label={t('rn.neu',{n:m.umlauf})}>{m.umlauf>99?'99+':m.umlauf}</b>}</span>
      </button>)}</section>)}
    </nav></>;
}
