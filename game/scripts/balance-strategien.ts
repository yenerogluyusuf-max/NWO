import { krisenPaketPlan, bringeKrisenPaketEin, type KrisenPaket } from '../src/sim/krisenpaket';
import { haushaltsMehrheitsPlan, haushaltsFraktionsWege, sichereHaushaltsMehrheit } from '../src/sim/haushaltsmehrheit';
import { spieleSzenario, regiere, type RegierungsPlan, type Aktion } from './regierungs-stresstest';
import { reichZustand, pausiere, verschiebe, verwaltungBilanz } from '../src/sim/reich';
import type { World } from '../src/sim/types';
import { krisenGesetzPlan, bringeKrisenGesetzEin, type KrisenGesetz } from '../src/sim/krisengesetze';
import { nationalAverage } from '../src/sim/netz';
import { NET } from '../src/sim/modell';

export const STRATEGIEN=['geldpolitik','entlastung','konsolidierung','breite_subvention','industrie_bisher','industrie_fokus','industrie_verwaltung','stabilisierung_abgestimmt','industrie_finanziert','sozial_entlastung','sozial_umschichten','sozial_dienste','sozial_lohn','sozial_arbeit'] as const;
export type Strategie=typeof STRATEGIEN[number];
const WERKE=['chips_design','batt_zellfabrik','robotik_offensive'];
const PLAENE:Partial<Record<Strategie,RegierungsPlan>>={
 stabilisierung_abgestimmt:{budgets:{sozialhilfe:3,subventionen:-1,unternehmensteuer:1},agenda:[['m_sozialhilfe',75],['m_antikorruption',75],['m_energieeffizienz',75]],neueInfrastruktur:false,ereignisAntworten:{waehrungsrutsch:'ruhe',iwf_angebot:'allein',mindestlohn:'mass',start_haushalt:'mitte'}},
 industrie_finanziert:{neueInfrastruktur:false,budgets:{bildung:2,forschung:2,investitionen:2,personal:2,subventionen:-2,unternehmensteuer:2},agenda:[['m_verwaltungsdigital',90],['m_industrie_modernisierung',85],['m_bauindustrie',85],['m_fachkraefteprogramm',80],['m_forschung',75]]},
 entlastung:{budgets:{sozialhilfe:3,subventionen:-1,unternehmensteuer:1},agenda:[['m_antikorruption',75],['m_verwaltungsdigital',65]],neueInfrastruktur:false},
 konsolidierung:{budgets:{sozialhilfe:2,subventionen:-2,investitionen:-1,unternehmensteuer:2},agenda:[['m_antikorruption',75],['m_verwaltungsdigital',65]],neueInfrastruktur:false},
 breite_subvention:{budgets:{subventionen:4,sozialhilfe:2},agenda:[['m_antikorruption',75],['m_verwaltungsdigital',65]],neueInfrastruktur:false},
 industrie_fokus:{neueInfrastruktur:false},
 industrie_verwaltung:{neueInfrastruktur:false,budgets:{bildung:2,forschung:2,investitionen:2,personal:2},agenda:[['m_verwaltungsdigital',90],['m_industrie_modernisierung',85],['m_bauindustrie',85],['m_fachkraefteprogramm',80],['m_forschung',75]]},
};
function priorisiere(w:World,aktionen:Aktion[]){
 const z=reichZustand(w),ziel=WERKE.find(id=>z.laufend.some(l=>l.id===id));
 if(!ziel)return;
 // Nur bestehende Bedienaktionen: Zurückstellen bewahrt Fortschritt, kostet aber Zeit anderer Projekte.
 for(const l of z.laufend){
  const an=!WERKE.includes(l.id);
  if(!!l.pausiert===an)continue;
  const ok=pausiere(w,l.id,an);aktionen.push({tag:w.day,datum:w.date,art:'baupause',ziel:l.id,ok,text:an?'Vorhaben für Industriepriorität pausiert':'Industrievorhaben fortgesetzt',pk:0,schulden:0});
 }
 if(verwaltungBilanz(w).vorrat>30){
  const r=verschiebe(w,ziel,-1);
  if(r.ok)aktionen.push({tag:w.day,datum:w.date,art:'bauprioritaet',ziel,ok:true,text:`${r.kosten} Verwaltung; verdrängt ${r.verdrangt?.join(', ')}`,pk:0,schulden:0});
 }
}
export function regiereStrategie(w:World,s:Parameters<typeof regiere>[1],a:Aktion[],strategie:Strategie){
  const industrie=strategie.startsWith('industrie');
  if(industrie&&strategie!=='industrie_bisher')priorisiere(w,a);
  const sozial=strategie.startsWith('sozial_');
  const tue=(art:string,ziel:string,fn:()=>{ok:boolean;text:string})=>{
   const pk=w.spiel!.kapital,schuld=w.economy.debtRatio,r=fn();
   a.push({tag:w.day,datum:w.date,art,ziel,ok:r.ok,text:r.text,pk:pk-w.spiel!.kapital,schulden:w.economy.debtRatio-schuld});
  };
  if(sozial&&w.day%28===0){
   const id=['sozial_lohn','sozial_arbeit'].includes(strategie)?'entlastung':strategie.slice(7) as KrisenPaket,p=krisenPaketPlan(w,id);
   if(p?.moeglich&&w.spiel!.kapital>p.pk+12)tue('sozialnachtrag',id,()=>bringeKrisenPaketEin(w,p));
  }
  const gesetze:KrisenGesetz[]=strategie==='sozial_lohn'?['m_mindestlohn']:strategie==='sozial_arbeit'?['m_arbeitslosengeld','m_ausbildung']:[];
  if(w.day%28===0)for(const id of gesetze){
   // Gleicher ausführbarer Weg wie im Krisenrat, mit zehn Stufen und einer PK-Reserve.
   // Kein neuer Entwurf während laufender Umsetzung, kein geschenkter Beschluss.
   if((w.net.targets[id]??nationalAverage(NET,w.net,id))>=75)continue;
   const p=krisenGesetzPlan(w,id,10);
   if(p?.moeglich&&w.spiel!.kapital>p.pk+12){tue('krisengesetz',`${id}/${p.ziel}`,()=>bringeKrisenGesetzEin(w,p));break;}
  }
  regiere(w,s,a,sozial?{...PLAENE.stabilisierung_abgestimmt,budgets:{},ministerAgenda:[...(PLAENE.stabilisierung_abgestimmt!.agenda??[]),...gesetze.map(id=>[id,75] as [string,number])]}:PLAENE[strategie]);
  if(sozial&&w.spiel!.wirtschaft?.haushalt.gesetz){
   const absprache=haushaltsMehrheitsPlan(w,'puffer');
   const moeglich=[...(absprache?[absprache]:[]),...haushaltsFraktionsWege(w)].filter(p=>p.moeglich&&p.pk+8<w.spiel!.kapital&&p.nachher>=309).sort((a,b)=>a.pk-b.pk);
   const p=moeglich[0];if(p)tue('haushaltsmehrheit',`${p.art}/${p.partei??'Absprache'}`,()=>sichereHaushaltsMehrheit(w,p));
  }
}
export function spieleStrategie(strategie:Strategie,seed:number,jahre=5,beobachte?:(w:World)=>void){
 const r=spieleSzenario(strategie.startsWith('industrie')?'fabrikoffensive':'stabilisierung',seed,jahre,(w,s,a)=>{
  beobachte?.(w);
  regiereStrategie(w,s,a,strategie);
 });
 return {...r,strategie};
}
