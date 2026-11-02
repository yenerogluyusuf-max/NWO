// Gegenmaßnahmen verwenden ausschließlich bestehende Haushalts-, Versorgungs- und Gesprächshandlungen.
import type { World } from './types';
import { letzterHaushaltsBeschluss, haushaltsStand } from './haushaltsbericht';
import { setzePosten, POSTEN_NACH_ID, postenVorschau } from './haushalt';
import { beschliesseVersorgungsProgramm, versorgungsKonditionen, VERSORGUNGSPOLITIK, type VersorgungsProgramm, type EnergiePartner } from './versorgungspolitik';
import { versorgungsStimmen, versorgungsBruchrisiken, auslaufendeVersorgungsDuldungen } from './versorgungsmehrheit';
import { versorgungsMehrheitsWege, uebernehmeVersorgungsWeg, versorgungsReaktionsVorschau } from './versorgungsberatung';
import { koalitionsHilfePlan, stabilisiereKoalition, type Stabilisierung } from './koalitionshilfe';
import { zusagenSchrittPlan, fuehreZusagenSchrittAus, type ZusagenSchritt } from './zusagenwarnung';
import { aktiveParteivorsitzende } from './koalitionslage';
import { zusagenDruck } from './zusagendruck';
import { gesetzSicht } from './handeln';
import { addDays } from './dates';
import { t } from '../i18n';
import { nationalAverage } from './netz';
import { NET } from './modell';

export type HaushaltsHilfe =
  | {art:'etat';posten:string;ziel:number}
  | {art:'programm';programm:VersorgungsProgramm;partner?:EnergiePartner}
  | {art:'gespraech';partei:string;weg:Stabilisierung}
  | {art:'zusage';id:string;weg:ZusagenSchritt};

function handeln(w:World,a:HaushaltsHilfe) {
  if(a.art==='etat')return setzePosten(w,a.posten,a.ziel);
  if(a.art==='gespraech') {const p=koalitionsHilfePlan(w,a.partei,a.weg);return p?stabilisiereKoalition(w,p):{ok:false,text:t('vn.nichtMoeglich')};}
  if(a.art==='zusage') {const p=zusagenSchrittPlan(w,a.id,a.weg);return p?fuehreZusagenSchrittAus(w,p):{ok:false,text:t('vn.nichtMoeglich')};}
  const offen=w.spiel?.gueter?.regierung?.vorlagen?.[a.programm]?.status==='offen';
  if(!offen){const r=beschliesseVersorgungsProgramm(w,a.programm,a.partner);if(!r.ok)return r;}
  const v=w.spiel!.gueter!.regierung!.vorlagen![a.programm]!;
  if(versorgungsStimmen(w,v,v.abstimmung).reduce((s,f)=>s+f.ja,0)<301){
    const wege=versorgungsMehrheitsWege(w,a.programm),weg=wege.find(p=>p.schwerpunkt==='koalition'&&p.ja>=301)??wege[0];
    if(weg)return uebernehmeVersorgungsWeg(w,weg);
  }
  return offen?{ok:false,text:t('hh.beratungLaeuft')}:{ok:true,text:t('mandat.eingebracht',{name:t(`regierung.${a.programm}.titel`)})};
}

export function haushaltsHilfePlan(w:World,beschluss:string,a:HaushaltsHilfe) {
  const b=letzterHaushaltsBeschluss(w);
  if(!b||b.id!==beschluss||!w.spiel||w.spiel.ende)return;
  if(a.art==='etat'&&(!POSTEN_NACH_ID[a.posten]||!b.angenommen||!b.posten.some(p=>p.id===a.posten&&p.danach<p.vorher&&a.ziel===p.vorher&&(w.spiel!.wirtschaft!.haushalt.stufen[p.id]??0)<a.ziel)))return;
  const k=structuredClone(w),vor=haushaltsStand(k),kapital=k.spiel!.kapital,auf=k.spiel!.verfassung?.aufmerksamkeit??80;
  const alteGesetze=new Set(k.spiel!.gesetze.map(g=>g.id));
  const zVor=a.art==='zusage'?structuredClone(k.spiel!.zusagen.find(z=>z.id===a.id)):undefined;
  const r=handeln(k,a),nach=haushaltsStand(k);
  const v=a.art==='programm'?k.spiel!.gueter?.regierung?.vorlagen?.[a.programm]:undefined;
  const stimmen=v?.status==='offen'?versorgungsStimmen(k,v,v.abstimmung):undefined;
  const g=a.art==='zusage'?k.spiel!.gesetze.find(g=>!alteGesetze.has(g.id)):undefined;
  const gesetz=g?gesetzSicht({...k,day:g.abstimmung,date:addDays(k.date,g.abstimmung-k.day)},g):undefined;
  const druck=k.spiel!.lager.flatMap(p=>{const d=zusagenDruck(k,p);return d?[d]:[];});
  const plan={beschluss,aktion:a,moeglich:r.ok,grund:r.ok?undefined:r.text,stand:'',
    pk:r.ok?kapital-k.spiel!.kapital:a.art==='etat'?postenVorschau(k,a.posten,a.ziel).kapital:a.art==='programm'?VERSORGUNGSPOLITIK[a.programm].pk:0,
    aufmerksamkeit:r.ok?auf-(k.spiel!.verfassung?.aufmerksamkeit??80):0,kapitalDanach:k.spiel!.kapital,aufmerksamkeitDanach:k.spiel!.verfassung?.aufmerksamkeit??80,
    defizit:nach.defizit-vor.defizit,legitimitaet:nach.legitimitaet-vor.legitimitaet,
    vertrauen:nationalAverage(NET,k.net,'vertrauen_regierung')-nationalAverage(NET,w.net,'vertrauen_regierung'),
    bereitschaft:nach.parteien.flatMap(p=>{const alt=vor.parteien.find(f=>f.partei===p.partei);return alt&&alt.bereitschaft!==p.bereitschaft?[{partei:p.partei,delta:p.bereitschaft-alt.bereitschaft}]:[];}),
    personen:nach.personen.flatMap(p=>{const alt=vor.personen.find(f=>f.id===p.id);return alt&&alt.loyalitaet!==p.loyalitaet?[{id:p.id,name:p.name,vorher:alt.loyalitaet,nachher:p.loyalitaet}]:[];}),
    partner:nach.parteien.filter(p=>p.rolle==='koalition'),druck,
    zusage:zVor?{vor:zVor,nach:structuredClone(k.spiel!.zusagen.find(z=>z.id===zVor.id)!)}:undefined,
    gesetz:gesetz?{ja:gesetz.ja,tag:g!.abstimmung}:undefined,
    programm:v?.status==='offen'?{vorlage:structuredClone(v),stimmen:stimmen!,ja:stimmen!.reduce((s,f)=>s+f.ja,0),konditionen:versorgungsKonditionen(v),
      risiken:versorgungsBruchrisiken(k,stimmen!,v.abstimmung),duldungen:auslaufendeVersorgungsDuldungen(k,v.abstimmung),reaktionen:versorgungsReaktionsVorschau(k,stimmen!)}:undefined};
  // Die angezeigten Folgen und alle Ausgangsbedingungen müssen beim Klick noch gelten.
  plan.stand=JSON.stringify({tag:w.day,datum:w.date,rng:w.rngState,kapital:w.spiel.kapital,verfassung:w.spiel.verfassung,
    fraktionen:w.spiel.fraktionen,lager:w.spiel.lager,sitze:w.parliament?.seats,personen:w.spiel.figuren,zusagen:w.spiel.zusagen,
    ereignisse:w.spiel.ereignisse,haushalt:w.spiel.wirtschaft?.haushalt.stufen,vorlagen:w.spiel.gueter?.regierung?.vorlagen,plan});
  return plan;
}
export type HaushaltsHilfePlan=NonNullable<ReturnType<typeof haushaltsHilfePlan>>;
export function fuehreHaushaltsHilfeAus(w:World,a:HaushaltsHilfePlan) {
  const p=haushaltsHilfePlan(w,a.beschluss,a.aktion);
  if(!p?.moeglich||p.stand!==a.stand)return {ok:false,text:t('vn.veraltet')};
  return handeln(w,p.aktion);
}

/** Nur heutige Probleme begründen heutige Handlungskarten; der historische Bericht bleibt unverändert. */
export function haushaltsHilfen(w:World,beschluss:string):HaushaltsHilfePlan[] {
  const b=letzterHaushaltsBeschluss(w);if(!b||b.id!==beschluss||!w.spiel||w.spiel.ende)return [];
  const specs:HaushaltsHilfe[]=[];
  const cuts=b.angenommen?b.posten.filter(p=>['landwirtschaft','investitionen','umwelt_energie','forschung','subventionen'].includes(p.id)&&p.danach<p.vorher&&(w.spiel!.wirtschaft!.haushalt.stufen[p.id]??0)<p.vorher):[];
  for(const p of cuts)specs.push({art:'etat',posten:p.id,ziel:p.vorher});
  const reg=w.spiel.gueter?.regierung,r=w.spiel.wirtschaft?.haushalt.reifungsbeleg;
  const mangel=!!cuts.length||(reg?.bericht?.deckung??1)<0.9||(r?.beschluss===b.id&&(r.deckung< -1e-6||(r.einsatz??0)< -1e-6));
  if(mangel)specs.push({art:'programm',programm:'schutz'},{art:'programm',programm:'netz'},{art:'programm',programm:'energie',partner:'AZE'},{art:'programm',programm:'energie',partner:'USA'});
  const parteien=w.spiel.lager.filter(p=>aktiveParteivorsitzende(w,p).some(f=>f.loyalitaet<35)||zusagenDruck(w,p)?.bruch);
  for(const partei of parteien) {
    for(const weg of ['fraktion','vertrauen','rueckendeckung'] as const)specs.push({art:'gespraech',partei,weg});
    for(const z of w.spiel.zusagen.filter(z=>z.von===partei&&!z.erfuellt&&!z.gebrochen).sort((a,b)=>a.faellig-b.faellig).slice(0,2))
      specs.push({art:'zusage',id:z.id,weg:'einloesen'},{art:'zusage',id:z.id,weg:'vertroesten'});
  }
  const seen=new Set<string>();
  return specs.flatMap(a=>{const p=haushaltsHilfePlan(w,beschluss,a);if(!p)return [];const key=a.art==='programm'&&p.programm?`${p.programm.vorlage.id}:${p.programm.vorlage.partner??''}`:JSON.stringify(a);if(seen.has(key))return [];seen.add(key);return [p];});
}
