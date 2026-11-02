// Fraktionen bewerten gemessene Ergebnisse. Forderungen sind keine automatisch angenommenen Zusagen.
import type { World } from './types';
import type { RessortNachsorge, RessortMeldung } from './ressortnachsorge';
import { AEMTER, HOCH_SCHLECHT, wertVon, loyalitaetVerschieben } from './personen';
import { ressortEntspannt } from './ressortanliegen';
import { aktiveParteivorsitzende, regierungsSitze, naechsteKoalitionspruefung } from './koalitionslage';
import { bereitschaftAendern, startBereitschaft } from './fraktionen';
import { oppositionsFraktionen, oppositionVon } from './opposition';
import { clamp } from './economy';
import { addDays } from './dates';
import { addLog } from './log';
import { t } from '../i18n';

type Rolle='koalition'|'duldung'|'opposition';
export type RessortUrteil='fortschritt'|'bestaetigt'|'druck'|'geduld'|'beratung'|'gehalten'|'vorfall'|'druckpause';
export interface RessortForderung {
  id:string;partei:string;rolle:Rolle;groesse:string;ausgang:number;ziel:number;seit:number;datum:string;frist:number;fristDatum:string;
  status:'offen'|'erreicht'|'verfehlt'|'entfallen';stand:number;geprueft?:string;
}
export interface RessortRueckhaltStand {
  beste:Record<string,number>;vorige:Record<string,number>;stabilBelohnt:boolean;stagnation:number;
  beobachtete:string[];
  letzterDruck?:number;forderungen:RessortForderung[];
}
export interface RessortRueckhaltBeleg {
  tag:number;datum:string;urteil:RessortUrteil;stagnation:number;
  grund?:'zielVerfehlt'|'rueckschlag'|'stillstand';
  belege:{groesse:string;vorher:number;jetzt:number;verbesserung:number}[];
  parteien:{partei:string;rolle:Rolle;vorher:number;nachher:number;traeger:boolean;personen:{name:string;vorher:number;nachher:number}[]}[];
  opposition?:{partei:string;vorher:number;nachher:number};
  forderungen:RessortForderung[];naechsterDruck?:string;
  koalition:{pruefung:string;sitze:number;danach:number;parteien:string[]};
}
const richtung=(id:string)=>HOCH_SCHLECHT.has(id)?-1:1;
const rolle=(w:World,p:string):Rolle=>w.spiel!.lager.includes(p)?'koalition':(w.spiel!.fraktionen?.[p]?.duldungBis??0)>w.day?'duldung':'opposition';
const bereit=(w:World,p:string)=>w.spiel!.fraktionen?.[p]?.bereitschaft??startBereitschaft(w,p);
const werte=(w:World,n:RessortNachsorge)=>Object.fromEntries([...new Set([n.groesse,...AEMTER[n.amt].fach])].map(id=>[id,wertVon(w,id)]));

/** Übernimmt politische Erwartungen bei einer neuen Personalentscheidung im selben Ressort. */
export function beginneRessortRueckhalt(w:World,n:RessortNachsorge,vorige?:RessortNachsorge):void {
  if(vorige?.rueckhalt){n.rueckhalt=structuredClone(vorige.rueckhalt);return;}
  const jetzt=werte(w,n),beste={...jetzt,[n.groesse]:n.ausgang},vor={...beste};
  const beobachtete=new Set(Object.entries(beste).filter(([id,v])=>!ressortEntspannt(id,v)).map(([id])=>id));
  // Altberichte werden nur als Vergleichsstand benutzt; keine rückwirkenden Buchungen.
  for(const m of n.meldungen){
    const messung={...m.messwerte,[n.groesse]:m.wert,...Object.fromEntries((m.weitereProbleme??[]).map(p=>[p.groesse,p.wert]))};
    for(const [id,v] of Object.entries(messung)){
      if(!beobachtete.has(id)&&!ressortEntspannt(id,v)){beobachtete.add(id);beste[id]=v;}
      if(beste[id]===undefined||richtung(id)*(v-beste[id]!)>0)beste[id]=v;vor[id]=v;
    }
  }
  n.rueckhalt={beste,vorige:vor,beobachtete:[...beobachtete],stagnation:0,forderungen:[],stabilBelohnt:n.meldungen.at(-1)?.entwicklung==='stabilisiert'||
    (!n.meldungen.length&&Object.entries(beste).every(([id,v])=>ressortEntspannt(id,v)))};
}

export function bewerteRessortErholung(w:World,n:RessortNachsorge,m:RessortMeldung):RessortRueckhaltBeleg {
  if(m.politik)return m.politik;
  if(!n.rueckhalt)beginneRessortRueckhalt(w,n);
  const s=n.rueckhalt!,jetzt=werte(w,n);m.messwerte={...jetzt};
  for(const [id,v] of Object.entries(jetzt))if(!s.beobachtete.includes(id)&&!ressortEntspannt(id,v)){
    // Neues Sachproblem erstmals erfassen; bekannte Bestwerte bei Rückfällen bleiben bestehen.
    s.beobachtete.push(id);s.beste[id]=v;
  }
  const neueBestwerte=Object.entries(jetzt).flatMap(([id,v])=>{
    const alt=s.beste[id]??v,delta=richtung(id)*(v-alt);
    return !ressortEntspannt(id,alt)&&delta>=1-1e-8?[{groesse:id,vorher:alt,jetzt:v,verbesserung:delta}]:[];
  });
  const rueckschlaege=Object.entries(jetzt).flatMap(([id,v])=>{
    const vorher=s.vorige[id]??v,verbesserung=richtung(id)*(v-vorher);
    return !ressortEntspannt(id,v)&&verbesserung<=-1+1e-8?[{groesse:id,vorher,jetzt:v,verbesserung}]:[];
  });
  const rueckschlag=rueckschlaege.length>0;
  const zielErreicht=(f:RessortForderung,v:number)=>richtung(f.groesse)*(v-f.ziel)>=-1e-8||ressortEntspannt(f.groesse,v);
  let neuVerfehlt=false,neuErreicht=false;
  for(const f of s.forderungen.filter(f=>f.status==='offen')){
    f.stand=wertVon(w,f.groesse);
    if((w.parliament?.seats[f.partei]??0)<=0||f.partei===w.player?.partei.kurz)f.status='entfallen';
    else if(zielErreicht(f,f.stand)){f.status='erreicht';neuErreicht=true;}
    else if(w.day>=f.frist){f.status='verfehlt';neuVerfehlt=true;}
    if(f.status!=='offen')f.geprueft=w.date;
  }
  s.stagnation=!m.kritisch||neueBestwerte.length&&!rueckschlag||neuErreicht?0:s.stagnation+1;
  const frisch=(w.spiel!.ministerfluss?.ressortVorfaelle??[]).some(v=>v.amt===n.amt&&v.tag===w.day);
  let urteil:RessortUrteil;
  if(frisch)urteil='vorfall';
  else if(neuVerfehlt||rueckschlag||s.stagnation>=(m.schritt==='bearbeitung'?3:2))urteil='druck';
  else if(n.ruhigeMeldungen>=2&&!s.stabilBelohnt)urteil='bestaetigt';
  else if(neueBestwerte.length&&!rueckschlag)urteil='fortschritt';
  else urteil=m.kritisch?(m.schritt==='bearbeitung'?'beratung':'geduld'):'gehalten';
  if(urteil==='druck'&&s.letzterDruck!==undefined&&w.day-s.letzterDruck<28)urteil='druckpause';
  const positiv=urteil==='fortschritt'||urteil==='bestaetigt',negativ=urteil==='druck';
  if(urteil==='bestaetigt')s.stabilBelohnt=true;
  if(negativ)s.letzterDruck=w.day;
  // Neue Tiefs/Hochs werden nur beim anerkannten Fortschritt als abgegolten geführt.
  // Vorfälle und Entspannung im Beobachtungsaltstand lassen sich nicht später nochmals vergüten.
  if(positiv||frisch)for(const b of neueBestwerte)s.beste[b.groesse]=b.jetzt;
  s.vorige={...jetzt};
  const f=w.spiel!.figuren.find(f=>f.imAmt&&f.amt===n.amt),traeger=f?.partei;
  const parteien:RessortRueckhaltBeleg['parteien']=[];
  if(positiv||negativ)for(const [p,sitze] of Object.entries(w.parliament?.seats??{})){
    if(sitze<=0||p===w.player?.partei.kurz)continue;
    const r=rolle(w,p),eigen=r==='koalition'&&p===traeger;
    const delta=r==='koalition'?(negativ?(eigen?-3:-2):urteil==='bestaetigt'?4:2):(negativ?-1:1);
    const b=bereit(w,p);bereitschaftAendern(w,p,delta);
    const personen=r==='koalition'?aktiveParteivorsitzende(w,p).map(f=>{
      const vorher=f.loyalitaet;loyalitaetVerschieben(f,negativ?(eigen?-2:-1):urteil==='bestaetigt'?(eigen?2:1):(eigen?1:0));
      return {name:f.name,vorher,nachher:f.loyalitaet};
    }):[];
    parteien.push({partei:p,rolle:r,vorher:b,nachher:bereit(w,p),traeger:eigen,personen});
  }
  const fr=oppositionsFraktionen(w);
  let opposition:RessortRueckhaltBeleg['opposition'];
  if((positiv||negativ)&&fr.length){
    const o=oppositionVon(w),b=o.staerke;o.partei=fr[0]!.partei;
    o.staerke=clamp(b+(negativ?2:urteil==='bestaetigt'?-2:-1),0,100);opposition={partei:o.partei,vorher:b,nachher:o.staerke};
    const text=t(negativ?'rr.opp.druck':'rr.opp.erfolg',{partei:o.partei,name:m.name});
    o.zuege.push({tag:w.day,datum:w.date,art:'anfrage',text});if(o.zuege.length>40)o.zuege.shift();addLog(w,'ereignis',text);
  }
  if(negativ){
    const coal=[...new Set(w.spiel!.lager)].filter(p=>p!==w.player?.partei.kurz&&(w.parliament?.seats[p]??0)>0).sort((a,b)=>(a===traeger?-1:b===traeger?1:0)||(w.parliament?.seats[b]??0)-(w.parliament?.seats[a]??0));
    const problem=Object.entries(jetzt).filter(([id,v])=>!ressortEntspannt(id,v)).sort(([a,av],[b,bv])=>(HOCH_SCHLECHT.has(b)?bv:100-bv)-(HOCH_SCHLECHT.has(a)?av:100-av))[0];
    if(problem)for(const p of [...new Set([coal[0],fr[0]?.partei].filter((p):p is string=>!!p))]){
      if(s.forderungen.some(f=>f.partei===p&&f.status==='offen'))continue;
      const [groesse,ausgang]=problem;
      s.forderungen.push({id:`${n.amt}-${p}-${w.day}`,partei:p,rolle:rolle(w,p),groesse,ausgang,ziel:clamp(ausgang+richtung(groesse)*2,0,100),seit:w.day,datum:w.date,frist:w.day+28,fristDatum:addDays(w.date,28),stand:ausgang,status:'offen'});
    }
  }
  s.forderungen=[...s.forderungen.filter(f=>f.status!=='offen').slice(-6),...s.forderungen.filter(f=>f.status==='offen')];
  const gefaehrdet=[...new Set(w.spiel!.lager)].filter(p=>p!==w.player?.partei.kurz&&aktiveParteivorsitzende(w,p).some(f=>f.loyalitaet<20));
  const sitze=regierungsSitze(w);
  const b:RessortRueckhaltBeleg={tag:w.day,datum:w.date,urteil,stagnation:s.stagnation,
    grund:urteil==='druck'||urteil==='druckpause'?(neuVerfehlt?'zielVerfehlt':rueckschlag?'rueckschlag':'stillstand'):undefined,
    belege:positiv?neueBestwerte:rueckschlaege,parteien,opposition,forderungen:structuredClone(s.forderungen),
    naechsterDruck:s.letzterDruck!==undefined?addDays(w.date,Math.max(0,s.letzterDruck+28-w.day)):undefined,
    koalition:{pruefung:naechsteKoalitionspruefung(w.date),sitze,danach:sitze-gefaehrdet.reduce((sum,p)=>sum+(w.parliament?.seats[p]??0),0),parteien:gefaehrdet}};
  m.politik=b;return b;
}
