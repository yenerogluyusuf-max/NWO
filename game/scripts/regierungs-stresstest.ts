/** Reproduzierbare Tageskampagnen. Keine geschenkten Stimmen, Gelder oder angenommenen Gesetze.
 * Szenarioschocks sind ausdrücklich vorgegebene Start-/Außenbedingungen; danach gelten die Spielregeln. */
import { createWorld, tick, NET } from '../src/sim/world';
import { turkey2026 } from '../src/sim/scenario';
import { startAfterElection, schnellProfil } from '../src/sim/prolog';
import { nationalAverage } from '../src/sim/netz';
import { antworten, entscheide, standardAntwort } from '../src/sim/ereignisse';
import { bringeEin, pruefeVorhaben, gesetzPrognose, stimmenKaufen } from '../src/sim/handeln';
import { fraktionsUebersicht, verhandle } from '../src/sim/verhandeln';
import { haushaltsfenster, setzeEntwurf, bringeHaushaltsgesetzEin, setzePosten } from '../src/sim/haushalt';
import { ressortAntwortPlan, beantworteRessortAnliegen } from '../src/sim/ressortanliegen';
import { fuehreAus, infrastrukturBitte, type InfraAktion } from '../src/sim/infrastruktur';
import { verwaltungBilanz, bauKapazitaet } from '../src/sim/reich';
import { weltZustand } from '../src/sim/laender';
import { kriege, kriegMonat, handlungenFuer, fuehreKriegHandlungAus } from '../src/sim/krieg';
import { zivileVersorgungsDeckung } from '../src/sim/versorgungspolitik';
import { militaerVersorgung } from '../src/sim/versorgung';
import { staatsfinanzen } from '../src/sim/staatsfinanzen';
import { bipMrd } from '../src/sim/staatsgeld';
import { defizitJetzt } from '../src/sim/wirtschaft';
import { baumSicht, beginneKnoten, knotenSicht } from '../src/sim/wissensbaum';
import { aendereStufe, ernenneGouverneur } from '../src/sim/zentralbank';
import { zbZustand } from '../src/sim/wirtschaft';
import { Rng } from '../src/sim/rng';
import { regierungsSitze } from '../src/sim/koalitionslage';
import { sozialeKrisenlage } from '../src/sim/krisenpaket';
import { zustimmungsTeile } from '../src/sim/spiel';
import type { World } from '../src/sim/types';

export const SZENARIEN = ['referenz','passiv','rechtsstaat','machtstaat','industrie','bildungsstau','rezession','inflation','stabilisierung','krieg','fabrikoffensive'] as const;
export type Szenario = typeof SZENARIEN[number];
const BASIS: [string,number][] = [['m_wasserleitungen',75],['m_krankenhausbau',75],['m_bauaufsicht',75],['m_ausbildung',75]];
const INDUSTRIE: [string,number][] = [['m_industrie_modernisierung',95],['m_ausbildung',90],['m_forschung',85],['m_netzausbau',90],['m_energieeffizienz',85]];
const RECHT: [string,number][] = [['m_justizreform',100],['m_antikorruption',100],['m_medienaufsicht',0],['m_internetsperren',0],['m_versammlungsfreiheit',100]];
const MACHT: [string,number][] = [['m_justizreform',0],['m_antikorruption',0],['m_medienaufsicht',100],['m_internetsperren',100],['m_versammlungsfreiheit',0]];
const MESSWERTE = ['industrie','produktivitaet','investitionen','arbeitsplaetze_industrie','bildungsqualitaet','hochschule','fachkraefte','energieversorgung','rechtssicherheit','justiz_unabhaengigkeit','justizvertrauen','korruption','pressefreiheit','vertrauen_maerkte','vertrauen_regierung','legitimitaet','arbeitslosigkeit'] as const;
export interface Aktion { tag:number;datum:string;art:string;ziel:string;ok:boolean;text:string;pk:number;schulden:number }
export function messung(w:World) {
 const f=staatsfinanzen(w),e=w.economy,b=w.spiel?.gueter?.bilanz;
 return {sozial:sozialeKrisenlage(w),zustimmungsteile:zustimmungsTeile(w,w.day/30.4),tag:w.day,datum:w.date,bip:f.bip,realBip:bipMrd(w,true),schulden:f.schuldenMrd,kasse:f.kasseMrd,quote:e.debtRatio,defizit:defizitJetzt(w),zins:e.zinsMehrlast,
  inflation:e.inflation,wachstum:e.growth,arbeitslosigkeit:e.unemployment,kurs:e.usdTry,reserven:e.reservenNettoUsdMrd,brutto:e.reservenBruttoUsdMrd,
  geldpolitik:{zins:e.policyRate,erwartung:e.expectedInflation,glaubwuerdigkeit:e.credibility,produktionsluecke:e.outputGap,politikkosten:e.policyCost,haushaltsimpuls:e.fiscalImpulse},
  verwaltung:verwaltungBilanz(w),baukapazitaet:bauKapazitaet(w),
  einnahmen:f.einnahmenMrd,ausgaben:f.ausgabenMrd,kapital:w.spiel!.kapital,zustimmung:w.spiel!.umfrage.zustimmung,
  versorgung:b?zivileVersorgungsDeckung(b):null,front:militaerVersorgung(w).treibstoff,
  lager:[...w.spiel!.lager],regierungssitze:regierungsSitze(w),
  werte:Object.fromEntries(MESSWERTE.filter(id=>NET.index.has(id)).map(id=>[id,nationalAverage(NET,w.net,id)])),
  politik:Object.fromEntries([...BASIS,...INDUSTRIE,...RECHT,...MACHT].map(([id])=>[id,{beschlossen:w.net.targets[id],wirksam:nationalAverage(NET,w.net,id)}])),
  kriege:kriege(w).map(k=>({land:k.land,phase:k.phase,wochen:k.woche,front:k.front,gefallene:k.gefallene,demobBis:k.demobBis,ausgang:k.ausgang})),
  industrieprojekte:w.spiel!.reich ? {fertig:Object.keys(w.spiel!.reich.bestand),laufend:w.spiel!.reich.laufend.map(l=>l.id)}:null,
  ressortFolgen:w.spiel!.ministerfluss?.ressortFolgen?.map(r=>({amt:r.amt,art:r.art,tag:r.tag,vorher:r.vorher,nachher:r.nachher}))??[]};
}
export function starteSzenario(szenario:Szenario,seed:number):World {
 const w=createWorld(turkey2026,seed);
 startAfterElection(w,{...schnellProfil(),buendnis:'YENİ'});
 if(szenario==='rezession') Object.assign(w.economy,{outputGap:-7,growth:-4,euNachfrage:65});
 if(['inflation','stabilisierung'].includes(szenario)) Object.assign(w.economy,{inflation:90,expectedInflation:85,credibility:0.25});
 return w;
}
export interface RegierungsPlan { agenda?:[string,number][]; budgets?:Record<string,number>; minister?:boolean; neueInfrastruktur?:boolean; ereignisAntworten?:Record<string,string> }
export function regiere(w:World,szenario:Szenario,aktionen:Aktion[],plan:RegierungsPlan={}):void {
 if(szenario==='passiv')return;
 const sp=w.spiel!,rng=new Rng(w.rngState^Math.imul(w.day+1,7919));
 const tue=(art:string,ziel:string,fn:()=>{ok:boolean;text:string})=>{
  const pk=sp.kapital,schuld=w.economy.debtRatio,r=fn();
  aktionen.push({tag:w.day,datum:w.date,art,ziel,ok:r.ok,text:r.text,pk:pk-sp.kapital,schulden:w.economy.debtRatio-schuld});return r;
 };
 if(szenario==='fabrikoffensive'&&w.day%28===0){
  // Ein konkretes Werk hat Vorrang vor zusätzlichen, konkurrierenden Vorhaben.
  for(const id of ['batt_zellfabrik','chips_design','robotik_offensive']){
   const k=knotenSicht(w,id);
   if(k?.zustand==='moeglich'&&sp.kapital>k.pk+8){tue('industrieprojekt',id,()=>beginneKnoten(w,id));break;}
  }
 }
 // Krisenantworten werden vor Ablauf entschieden. Gegnerische Kriegshandlungen bleiben dem Kriegsablauf vorbehalten.
 for(const ev of [...sp.ereignisse]) {
  if(ev.vorlage.startsWith('krieg_'))continue;
  const opts=antworten(w,ev).filter(o=>!o.sperre&&(o.anzeigePk??o.pk)<=sp.kapital);
  const bevorzugt=ev.vorlage==='zusage'?opts.find(o=>o.id==='erfuellen')??opts.find(o=>o.id==='vertroesten'):undefined;
  const gewuenscht=plan.ereignisAntworten?.[ev.vorlage];
  const id=opts.find(o=>o.id===gewuenscht)?.id??bevorzugt?.id??standardAntwort(w,ev);
  if(id)tue('ereignis',`${ev.vorlage}/${id}`,()=>entscheide(w,ev.id,id,rng));
 }
 for(const a of sp.ministerfluss?.ressortAnliegen??[]) {
  if(plan.minister===false)break;
  if(!['offen','besprochen'].includes(a.status))continue;
  if(szenario==='bildungsstau'&&['bildung','bildungsqualitaet','fachkraefte','forschung','innovation'].includes(a.groesse))continue;
  // Ein gegensätzliches Ministerziel wird besprochen, aber nicht als heimliche Kehrtwende beschlossen.
  const agenda=plan.agenda??(szenario==='machtstaat'?MACHT:szenario==='rechtsstaat'?RECHT:[]);
  const v=a.vorschlag,kontra=v?.art==='gesetz'&&agenda.some(([id,z])=>id===v.id&&(z-nationalAverage(NET,w.net,id))*(v.ziel-nationalAverage(NET,w.net,id))<0);
  const p=ressortAntwortPlan(w,a.id,kontra?'reden':'umsetzen');
  if(p?.ok&&p.pk+8<sp.kapital)tue('minister',`${a.amt}/${p.art}`,()=>beantworteRessortAnliegen(w,p));
 }
 if(w.day%28===0) {
  if(szenario==='stabilisierung'&&sp.kapital>20) {
   if(w.governor.stance!=='vorsichtig')tue('zentralbank','vorsichtig',()=>ernenneGouverneur(w,'vorsichtig'));
   if(zbZustand(w).stufe!=='A')tue('zentralbank','unabhaengigkeit',()=>aendereStufe(w,zbZustand(w).stufe==='C'?'B':'A'));
  }
  if(['industrie','bildungsstau'].includes(szenario)&&w.day%84===0) {
   const knoten=baumSicht(w).zweige.filter(z=>['digital','energie','werkstoff','bio'].includes(z.id)).flatMap(z=>z.knoten);
   const kandidat=knoten.filter(k=>k.zustand==='moeglich'&&sp.kapital>k.pk+25).sort((a,b)=>a.spalte-b.spalte||a.monate-b.monate)[0];
   if(kandidat)tue('industrieprojekt',kandidat.id,()=>beginneKnoten(w,kandidat.id));
  }
  for(const f of fraktionsUebersicht(w)) {
   const ges=f.aktionen.find(a=>a.id==='gespraech');
   if(ges?.moeglich&&sp.kapital>ges.pk+12&&f.status==='lager')tue('fraktion',`${f.partei}/gespraech`,()=>verhandle(w,f.partei,'gespraech',rng));
  }
  const sitze=regierungsSitze(w);
  if(sitze<301)for(const f of fraktionsUebersicht(w)){
   const a=f.aktionen.find(a=>a.id==='koalition');
   if(f.status!=='lager'&&a?.moeglich&&sp.kapital>a.pk+15){tue('fraktion',`${f.partei}/koalition`,()=>verhandle(w,f.partei,'koalition',rng));break;}
  }
  const bitte=infrastrukturBitte(w),vb=verwaltungBilanz(w);
  const o=bitte?.optionen.find(o=>o.moeglich&&o.id==='ausbau'&&vb.netto>0&&vb.vorrat>30&&sp.kapital>(o.kosten.pk??0)+15)
   ??bitte?.optionen.find(o=>o.moeglich&&o.id==='alternative'&&sp.kapital>(o.kosten.pk??0)+15);
  if(plan.neueInfrastruktur!==false&&o?.aktion.art==='infrastruktur')tue('infrastruktur',o.id,()=>fuehreAus(w,o.aktion as InfraAktion));
  const liste=plan.agenda??(szenario==='rechtsstaat'?RECHT:szenario==='machtstaat'?MACHT:['industrie','bildungsstau','fabrikoffensive'].includes(szenario)?INDUSTRIE:BASIS);
  const start=Math.floor(w.day/28)%liste.length;
  for(let j=0;j<liste.length;j++){
   const [id,ziel]=liste[(start+j)%liste.length]!;
   if(szenario==='bildungsstau'&&['m_ausbildung','m_forschung'].includes(id))continue;
   const aktuell=w.net.targets[id]??nationalAverage(NET,w.net,id);
   if(Math.abs(ziel-aktuell)<1)continue;
   const stufe=aktuell+Math.sign(ziel-aktuell)*Math.min(20,Math.abs(ziel-aktuell)),p=pruefeVorhaben(w,id,stufe);
   if(p.ok&&sp.kapital>p.gesetz.pk+12){tue('gesetz',`${id}/${stufe}`,()=>bringeEin(w,id,stufe,null,'gesetz'));break;}
  }
  for(const g of sp.gesetze){
   const p=gesetzPrognose(w,g),luecke=Math.max(0,309-p.ja);
   if(luecke>0&&luecke<100&&sp.kapital>luecke*0.15+15)tue('absprache',g.massnahme,()=>stimmenKaufen(w,g.id,luecke));
  }
  const budgets:Record<string,number>=plan.budgets??(szenario==='rechtsstaat'?{justiz:3}:szenario==='machtstaat'?{justiz:-2}:szenario==='bildungsstau'?{bildung:-3,forschung:-2,investitionen:2}:['industrie','fabrikoffensive'].includes(szenario)?{bildung:2,forschung:2,investitionen:2}:szenario==='krieg'?{verteidigung:2}:{});
  for(const [id,z]of Object.entries(budgets))if((sp.wirtschaft?.haushalt.stufen[id]??0)!==z){
   if(haushaltsfenster(w).offen)tue('etat-entwurf',`${id}/${z}`,()=>setzeEntwurf(w,id,z));
   else if(sp.kapital>18)tue('etat-nachtrag',`${id}/${z}`,()=>setzePosten(w,id,z));
  }
  if(haushaltsfenster(w).offen&&Object.keys(sp.wirtschaft?.haushalt.entwurf??{}).length)tue('haushaltsgesetz','einbringen',()=>bringeHaushaltsgesetzEin(w));
 }
 if(szenario==='krieg')for(const k of kriege(w)){
  const optionen=handlungenFuer(w,k.id);
  const id=k.phase==='krieg'?(k.woche<12&&!k.mobilmachung?'mobil_voll':k.woche>=12?'waffenruhe':undefined):k.phase==='waffenruhe'?'paket_weiss':undefined;
  const o=optionen.find(o=>o.id===id&&o.moeglich&&sp.kapital>=o.pk);
  if(o)tue('krieg',o.id,()=>fuehreKriegHandlungAus(w,k.id,o.id,rng));
 }
}
export function spieleSzenario(szenario:Szenario,seed:number,jahre=5,regierung=regiere) {
 const w=starteSzenario(szenario,seed),aktionen:Aktion[]=[],monate=[messung(w)],fehler:string[]=[];
 let rest=0,bilanzFehler=0,bipFehler=0,warenFehler=0;
 const fehlerMerken=(s:string)=>{if(!fehler.includes(s))fehler.push(s);};
 while(w.day<365*jahre&&!w.spiel!.ende){
  if(w.day===364&&szenario==='krieg'){
   // Äußerer Angriff als Szenariobedingung; Phasen, Kosten und Front berechnet das echte Spiel.
   weltZustand(w).SYR!.konflikt=99;kriegMonat(w,new Rng(seed));
  }
  if(w.day%7===0)regierung(w,szenario,aktionen);
  tick(w);
  const e=w.economy,f=staatsfinanzen(w);
  if(e.debtRatio< -1e-9)fehlerMerken('negative Bruttoschulden');
  for(const [k,v]of Object.entries(e))if(typeof v==='number'&&!Number.isFinite(v))fehlerMerken(`nicht endliche Wirtschaft: ${k}`);
  if((e.reservenNettoUsdMrd??0)>(e.reservenBruttoUsdMrd??0)+1e-8)fehlerMerken('Nettoreserven über Brutto');
  bilanzFehler=Math.max(bilanzFehler,Math.abs((f.ausgabenMrd-f.einnahmenMrd-f.kreditMrd)/f.bip));
  if(w.date.endsWith('-01')){
   const r=e.schuldenAbschluss!;
   bipFehler=Math.max(bipFehler,Math.abs((r.bipNachherMrd-f.bip)/f.bip));
   rest=Math.max(rest,Math.abs((r.nachherMrd-r.vorherMrd-r.defizitMrd-r.wechselkursMrd-r.restUeberschussMrd+(r.kasseEntnahmeMrd??0))/f.bip));
   for(const f of Object.values(w.spiel!.gueter?.bilanz?.waren??{}))if(f)warenFehler=Math.max(warenFehler,Math.abs(f.anfang+f.produktion+f.importiert-f.geliefert-f.militaerGeliefert-f.exportiert-f.ende-f.verlust));
   monate.push(messung(w));
  }
 }
 const entwicklung=baumSicht(w);
 return {entwicklung:{etat:entwicklung.etat,tempo:entwicklung.tempo,wartenAufBildung:entwicklung.wartenAufBildung,knoten:entwicklung.zweige.flatMap(z=>z.knoten).map(k=>({id:k.id,zustand:k.zustand,grund:k.grund,fortschritt:k.fortschritt,restMonate:k.restMonate}))},szenario,seed,horizontJahre:jahre,tage:w.day,ende:w.spiel!.ende??null,aktionen,monate,schluss:messung(w),fehler,bilanzFehler,bipFehler,schuldenRest:rest,warenFehler};
}
