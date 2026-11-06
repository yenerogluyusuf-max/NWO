// Sozialnachträge nutzen den normalen Haushaltsvollzug und seine gespeicherten Belege.
// Pakete verändern weder Zustimmung noch Mehrheiten beim Einbringen.
import type { World } from './types';
import { POSTEN_NACH_ID, inSpanne, haushaltsTitel } from './haushalt';
import { haushaltZustand, defizitJetzt } from './wirtschaft';
import { REGELN, stimmenPrognose } from './handeln';
import { AUFMERKSAMKEIT_KOSTEN, neuanfangGrund, verbrauche } from './aufmerksamkeit';
import { kannZahlen } from './kapital';
import { bipMrd, geldAusBip } from './staatsgeld';
import { aktiveParteivorsitzende, naechsteKoalitionspruefung, regierungsSitze } from './koalitionslage';
import { zusagenDruck } from './zusagendruck';
import { addLog } from './log';
import { NET } from './modell';
import { nationalAverage } from './netz';
import { t } from '../i18n';
import { wirke } from './wirkung';

export const KRISENPAKETE=['entlastung','umschichten','dienste'] as const;
export type KrisenPaket=typeof KRISENPAKETE[number];
export const KRISENPAKET_KOSTEN={pk:4,aufmerksamkeit:AUFMERKSAMKEIT_KOSTEN.gesetz,wiederanlauf:30} as const;

export function sozialeKrisenlage(w:World) {
  return {armut:nationalAverage(NET,w.net,'armut'),lebenshaltung:nationalAverage(NET,w.net,'lebenshaltung'),
    realeinkommen:nationalAverage(NET,w.net,'realeinkommen'),zustimmung:w.spiel?.umfrage.zustimmung??0,
    tiefstand:w.spiel?.tiefstand??0,sitze:regierungsSitze(w)};
}

export function krisenPaketPlan(w:World,id:KrisenPaket) {
  if(!w.spiel||!KRISENPAKETE.includes(id))return;
  // Auch alte Spielstände dürfen durch das Öffnen einer Vorschau keine Konten bekommen.
  const k=structuredClone(w),sp=k.spiel!,h=haushaltZustand(k),schritte:Record<string,number>={};
  const aktuell=(p:string)=>h.stufen[p]??0;
  const mindestens=(p:string,n:number)=>{if(aktuell(p)<n)schritte[p]=inSpanne(POSTEN_NACH_ID[p]!,n);};
  const hoechstens=(p:string,n:number)=>{if(aktuell(p)>n)schritte[p]=inSpanne(POSTEN_NACH_ID[p]!,n);};
  // Steuern stellt allein ihr Gesetz im Politikbereich (Befund D-1, N3): Kaufkrafthilfe über Preisstützen statt über eine Steuersenkung,
  // Gegenfinanzierung über gestreckte Investitionen statt über einen zweiten Steuerregler.
  if(id==='entlastung'){mindestens('sozialhilfe',4);mindestens('subventionen',1);}
  if(id==='umschichten'){mindestens('sozialhilfe',4);hoechstens('subventionen',-1);}
  if(id==='dienste'){mindestens('sozialhilfe',3);mindestens('gesundheit',2);mindestens('rentenniveau',2);}
  const impulse=()=>Object.entries(schritte).reduce((s,[p,z])=>s+(z-aktuell(p))*POSTEN_NACH_ID[p]!.schritt,0);
  // Gegenfinanzierung nur für zusätzliche Leistungen: Investitionen werden gestreckt, soweit ihre Spanne reicht; ein Rest erhöht das Defizit.
  const bedarf=Math.max(0,impulse()),inv=POSTEN_NACH_ID.investitionen!;
  if(bedarf>1e-9&&!schritte.investitionen)hoechstens('investitionen',Math.max(inv.min,aktuell('investitionen')-Math.ceil((bedarf-1e-9)/inv.schritt)));
  const posten=Object.entries(schritte).map(([p,ziel])=>{const d=POSTEN_NACH_ID[p]!,delta=ziel-aktuell(p);return {id:p,vorher:aktuell(p),ziel,delta,
    saldo:delta*d.schritt,monate:d.reifeMonate,
    gruppen:d.sofort.map(g=>({id:g.id,delta:g.d*delta}))};});
  let grund=sp.ende?t('hm.beendet'):h.gesetz?t('kp.laufend'):neuanfangGrund(k);
  const letzter=[...(h.abschluesse??[])].reverse().find(b=>b.krisenpaket===id&&!b.angenommen);
  if(!grund&&letzter&&w.day<letzter.tag+KRISENPAKET_KOSTEN.wiederanlauf)grund=t('kp.warten',{tage:letzter.tag+KRISENPAKET_KOSTEN.wiederanlauf-w.day});
  if(!grund&&!posten.length)grund=t('kp.erreicht');
  if(!grund&&!kannZahlen(sp.kapital,KRISENPAKET_KOSTEN.pk))grund=t('hm.kapital');
  const prognose=stimmenPrognose(k,w.day+REGELN.tageBisAbstimmung);
  const saldo=impulse(),gruppen=new Map<string,number>();
  for(const p of posten)for(const g of p.gruppen){
    if(!gruppen.has(g.id))gruppen.set(g.id,nationalAverage(NET,k.net,g.id));
    wirke(k,g.id,g.delta);
  }
  const risiken=sp.lager.flatMap(partei=>aktiveParteivorsitzende(k,partei).filter(f=>f.loyalitaet<35).map(f=>({partei,name:f.name,loyalitaet:f.loyalitaet,sitze:k.parliament?.seats[partei]??0})));
  const druck=sp.lager.flatMap(p=>{const d=zusagenDruck(k,p);return d?[d]:[];});
  const plan={id,stand:'',moeglich:!grund,grund,posten,schritte,saldo,geldJahr:geldAusBip(w,saldo),defizitVorher:defizitJetzt(k),
    pk:KRISENPAKET_KOSTEN.pk,aufmerksamkeit:KRISENPAKET_KOSTEN.aufmerksamkeit,
    kapitalDanach:sp.kapital-KRISENPAKET_KOSTEN.pk,aufmerksamkeitDanach:Math.max(0,(sp.verfassung?.aufmerksamkeit??80)-KRISENPAKET_KOSTEN.aufmerksamkeit),
    prognose,gruppen:[...gruppen].map(([id,vorher])=>({id,delta:nationalAverage(NET,k.net,id)-vorher})).filter(g=>Math.abs(g.delta)>1e-9),risiken,druck,pruefung:naechsteKoalitionspruefung(w.date)};
  // Die Geldbasis gehört zum Stand: Ändert sich das BIP, gelten die angezeigten Lira-Beträge nicht mehr (auch bei ausgeglichenem Saldo)
  plan.stand=JSON.stringify({tag:w.day,datum:w.date,stufen:h.stufen,gesetz:h.gesetz,verfassung:sp.verfassung,kapital:sp.kapital,ende:sp.ende,bip:bipMrd(w),plan});
  return plan;
}
export type KrisenPaketPlan=NonNullable<ReturnType<typeof krisenPaketPlan>>;
export function bringeKrisenPaketEin(w:World,angebot:KrisenPaketPlan) {
  const p=krisenPaketPlan(w,angebot.id);
  if(!p?.moeglich||p.stand!==angebot.stand)return {ok:false,text:t('vn.veraltet')};
  const h=haushaltZustand(w),sp=w.spiel!;
  sp.kapital-=p.pk;verbrauche(w,p.aufmerksamkeit,'krisenpaket');
  h.gesetz={jahr:Number(w.date.slice(0,4)),krisenpaket:p.id,schritte:{...p.schritte},eingebracht:w.day,abstimmung:p.prognose.tag,absprachen:0};
  // Der vorbereitete Jahreshaushalt bleibt unangetastet; Nachtrag und Jahreszyklus sind getrennt.
  const text=t('kp.eingebracht',{name:haushaltsTitel(h.gesetz),tage:REGELN.tageBisAbstimmung});
  addLog(w,'entscheidung',text,t('kp.einbringenPreis',{pk:p.pk,auf:p.aufmerksamkeit}));
  return {ok:true,text};
}
