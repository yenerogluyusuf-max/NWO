// Bestehende Gesetzeswege im Krisenrat. Vorschauen buchen nur auf Kopien;
// weder die Beratung noch eine gelungene Mehrheit ersetzt die spätere Umsetzung.
import type { World } from './types';
import { NET } from './modell';
import { nationalAverage } from './netz';
import { vorMonaten } from './waehler';
import { bringeEin, pruefeVorhaben, gesetzPrognose, setPolicy } from './handeln';
import { AUFMERKSAMKEIT_KOSTEN } from './aufmerksamkeit';
import { aktiveParteivorsitzende, naechsteKoalitionspruefung } from './koalitionslage';
import { geldAusBip } from './staatsgeld';
import { t } from '../i18n';

export const KRISENGESETZE = ['m_mindestlohn','m_arbeitslosengeld','m_ausbildung'] as const;
export type KrisenGesetz = typeof KRISENGESETZE[number];

/** Beobachtung, keine kausale Zurechnung an das zuletzt beschlossene Paket. */
export function krisenAlltag(w:World) {
  return ['lebenshaltung','realeinkommen','armut'].map(id=>{
    const wert=nationalAverage(NET,w.net,id),vorher=vorMonaten(w,id,3);
    return {id,wert,trend:vorher===null?null:wert-vorher,gut:id==='realeinkommen'?1:-1};
  });
}

export function krisenGesetzPlan(w:World,id:KrisenGesetz,umfang:10|20=10) {
  if(!w.spiel||!KRISENGESETZE.includes(id)||![10,20].includes(umfang))return;
  const aktuell=nationalAverage(NET,w.net,id),beschlossen=w.net.targets[id];
  const ziel=Math.min(100,Math.round(Math.max(aktuell,beschlossen??aktuell))+umfang);
  const k=structuredClone(w),pr=pruefeVorhaben(k,id,ziel,null);
  const laufend=k.spiel!.gesetze.find(g=>g.massnahme===id);
  const umsetzung=!laufend&&beschlossen!==undefined&&Math.abs(beschlossen-aktuell)>=1;
  const grund=laufend?t('kg.laufend'):umsetzung?t('kg.umsetzung',{ziel:beschlossen}):undefined;
  const r=grund?{ok:false,text:grund}:bringeEin(k,id,ziel,null,'gesetz');
  const g=laufend??(r.ok?k.spiel!.gesetze.find(g=>g.massnahme===id):undefined);
  const prognose=g?gesetzPrognose(k,g):undefined;
  const zusagen=r.ok?k.spiel!.zusagen.flatMap(z=>{
    const alt=w.spiel!.zusagen.find(a=>a.id===z.id);
    return alt&&z.faellig!==alt.faellig?[{id:z.id,text:z.text,von:z.von,vorher:alt.faellig,nachher:z.faellig}]:[];
  }):[];
  // Annahme unter heutigen Verhältnissen, ohne weiteren Zeitlauf oder geschenkte Stimmen.
  const angenommen=structuredClone(k);
  if(r.ok)setPolicy(angenommen,id,ziel,null);
  const reaktionen=r.ok?w.spiel.figuren.filter(f=>f.imAmt).flatMap(f=>{
    const neu=angenommen.spiel!.figuren.find(n=>n.id===f.id);
    return neu&&Math.abs(neu.loyalitaet-f.loyalitaet)>1e-9?[{id:f.id,name:f.name,partei:f.partei,vorher:f.loyalitaet,nachher:neu.loyalitaet}]:[];
  }):[];
  const erfuellt=r.ok?angenommen.spiel!.zusagen.filter(z=>z.erfuellt&&!w.spiel!.zusagen.find(a=>a.id===z.id)?.erfuellt).map(z=>({id:z.id,text:z.text,von:z.von})):[];
  const risiken=[...new Set(w.spiel.lager)].flatMap(partei=>aktiveParteivorsitzende(angenommen,partei).filter(f=>f.loyalitaet<35).map(f=>({partei,name:f.name,loyalitaet:f.loyalitaet,sitze:w.parliament?.seats[partei]??0})));
  const pruefung=naechsteKoalitionspruefung(w.date);
  const vorVotumRisiken=prognose&&pruefung<prognose.datum?[...new Set(w.spiel.lager)].flatMap(partei=>aktiveParteivorsitzende(w,partei).filter(f=>f.loyalitaet<20).map(f=>({partei,name:f.name,loyalitaet:f.loyalitaet,sitze:w.parliament?.seats[partei]??0}))):[];
  const plan={id,umfang,ziel,aktuell,beschlossen,moeglich:r.ok,grund:r.ok?undefined:r.text,laufend:!!laufend,laufendeStufe:laufend?.stufe,regional:!!laufend?.provinzen?.length,umsetzung,
    pk:pr.gesetz.pk,aufmerksamkeit:AUFMERKSAMKEIT_KOSTEN.gesetz,
    kapitalDanach:w.spiel.kapital-pr.gesetz.pk,aufmerksamkeitDanach:Math.max(0,(w.spiel.verfassung?.aufmerksamkeit??80)-AUFMERKSAMKEIT_KOSTEN.gesetz),
    monate:pr.monate,kostenBip:pr.kostenBip,geldJahr:geldAusBip(w,pr.kostenBip),prognose,reaktionen,zusagen,erfuellt,risiken,
    pruefung,vorVotumRisiken,stand:''};
  // Auch Änderungen an Frist, Linie, Ziel oder Personen am selben Tag entwerten ein Angebot.
  plan.stand=JSON.stringify({tag:w.day,datum:w.date,kapital:w.spiel.kapital,verfassung:w.spiel.verfassung,
    gesetze:w.spiel.gesetze,ereignisse:w.spiel.ereignisse,zusagen:w.spiel.zusagen,figuren:w.spiel.figuren,
    lager:w.spiel.lager,fraktionen:w.spiel.fraktionen,sitze:w.parliament?.seats,partei:w.player?.partei,plan});
  return plan;
}
export type KrisenGesetzPlan=NonNullable<ReturnType<typeof krisenGesetzPlan>>;

export function bringeKrisenGesetzEin(w:World,angebot:KrisenGesetzPlan) {
  const p=krisenGesetzPlan(w,angebot.id,angebot.umfang);
  if(!p?.moeglich||p.stand!==angebot.stand)return {ok:false,text:t('vn.veraltet')};
  return bringeEin(w,p.id,p.ziel,null,'gesetz');
}
