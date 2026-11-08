/** Gleiche tatsächlich erspielte Ausgangslage, drei echte Wahlkampfentscheidungen.
 * Kein Überschreiben von Zustimmung, Wahltermin, Zufallszustand, Kosten oder Niederlagen. */
import { spieleStrategie, regiereStrategie } from './balance-strategien';
import { messung, type Aktion } from './regierungs-stresstest';
import { save, load, tick } from '../src/sim/world';
import { PROVINZEN } from '../src/sim/regional';
import { wahlkampfAktiv, wahlkampfAktion, duellVorbereiten, reiseWirkungVorschau, reise, auslandstour, TOUR_LAENDER, type AktionErgebnis } from '../src/sim/wahlkampf';
import type { Rng } from '../src/sim/rng';
import type { World } from '../src/sim/types';
import { staatsfinanzen } from '../src/sim/staatsfinanzen';

type Kurs='ohne'|'regional'|'gemischt';
export function fuehreWahlkampf(w:World,kurs:Kurs,aktionen:Aktion[]) {
 if(kurs==='ohne'||!wahlkampfAktiv(w))return;
 const k=w.spiel!.wahlkampf!;
 const tue=(ziel:string,fn:(rng:Rng)=>AktionErgebnis)=>{
  const ap=k.ap,r=wahlkampfAktion(w,fn);
  aktionen.push({tag:w.day,datum:w.date,art:'wahlkampf',ziel,ok:r.ok,text:`${ap-k.ap} AP · ${r.text}`,pk:0,schulden:0});
 };
 if(!k.duell.vorbereitet&&k.duell.tag===undefined&&k.ap>=2)tue('duell',()=>duellVorbereiten(w));
 // Je höchstens eine Auslandstour pro Woche. Danach lokale Besuche mit positivem Erwartungswert.
 // Berechnet nur aus der sichtbaren Chance und Wirkung; kein Blick auf den nächsten Zufallswert.
 if(kurs==='gemischt'&&k.ap>=3){
  const land=[...TOUR_LAENDER].sort((a,b)=>k.touren.filter(t=>t.land===a.land).length-k.touren.filter(t=>t.land===b.land).length||b.anteilWaehler-a.anteilWaehler)[0]!;
  tue(`tour/${land.land}`,rng=>auslandstour(w,land.land,rng));
 }
 for(let i=0;i<10&&k.ap>0;i++){
  const z=PROVINZEN.map(p=>{
   const v=reiseWirkungVorschau(w,p.plaka);
   return {plaka:p.plaka,v,nutzen:((1-v.risiko)*(v.erfolg+v.gruppenErfolg)+v.risiko*(v.rueckschlag+v.gruppenRueckschlag))*w.net.weights[p.plaka-1]!/v.kosten};
  }).filter(p=>p.v.kosten<=k.ap&&p.nutzen>0).sort((a,b)=>b.nutzen-a.nutzen)[0];
  if(!z)break;
  tue(`reise/${z.plaka}`,rng=>reise(w,z.plaka,rng));
 }
}
export function pruefeKrisenwahlkampf(seed=5){
 let start:string|undefined;
 const vorlauf=spieleStrategie('sozial_entlastung',seed,5.1,w=>{
  if(!start&&wahlkampfAktiv(w))start=save(w);
 });
 if(!start)return {seed,hinweis:'Regierung erreicht die Wahlkampfphase nicht.',vorlauf,wege:[]};
 const wege=(['ohne','regional','gemischt'] as const).map(kurs=>{
  const w=load(start!),beginn=w.day,wahlTag=w.spiel!.wahltag,aktionen:Aktion[]=[],wochen=[];
  const vorher=messung(w);let bilanzFehler=0,schuldenFehler=0,warenFehler=0,apFehler=false;
  while(!w.spiel!.ende&&!(w.spiel!.wahl?.historie.length)&&w.day<=wahlTag+16){
   if(w.day%7===0){regiereStrategie(w,'stabilisierung',aktionen,'sozial_entlastung');fuehreWahlkampf(w,kurs,aktionen);wochen.push({messung:messung(w),kampagne:structuredClone(w.spiel!.wahlkampf)});}
   tick(w);const f=staatsfinanzen(w);bilanzFehler=Math.max(bilanzFehler,Math.abs((f.ausgabenMrd-f.einnahmenMrd-f.kreditMrd)/f.bip));
   apFehler ||= (w.spiel!.wahlkampf?.ap??0)<0;
   if(w.date.endsWith('-01')){
    const r=w.economy.schuldenAbschluss!;
    schuldenFehler=Math.max(schuldenFehler,Math.abs((r.nachherMrd-r.vorherMrd-r.defizitMrd-r.wechselkursMrd-r.restUeberschussMrd+(r.kasseEntnahmeMrd??0))/f.bip));
    for(const v of Object.values(w.spiel!.gueter?.bilanz?.waren??{}))if(v)warenFehler=Math.max(warenFehler,Math.abs(v.anfang+v.produktion+v.importiert-v.geliefert-v.militaerGeliefert-v.exportiert-v.ende-v.verlust));
   }
  }
  return {kurs,beginn,tag:w.day,vorher,schluss:messung(w),ende:w.spiel!.ende,wahl:w.spiel!.wahl?.historie.at(-1),wochen,aktionen,bilanzFehler,schuldenFehler,warenFehler,apFehler};
 });
 return {seed,hinweis:'Tatsächlicher Krisenlauf, identischer gespeicherter Ausgangspunkt; spätere Zufallspfade unterscheiden sich durch echte Aktionen. Keine isolierte Kausalschätzung oder Sieg-Garantie. Keine Wahlversprechen in diesen drei Reisekursen.',vorlauf,wege};
}
