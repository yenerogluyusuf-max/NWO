import { afterEach, expect, test } from 'vitest';
import { createWorld, advance, save, load } from '../src/sim/world';
import { turkey2026 } from '../src/sim/scenario';
import { schnellProfil, startAfterElection } from '../src/sim/prolog';
import { NET } from '../src/sim/modell';
import { nationalAverage, provinceValue } from '../src/sim/netz';
import { wirke } from '../src/sim/wirkung';
import { Rng } from '../src/sim/rng';
import { auslandstour, reise, reiseVorschau, reiseWirkungVorschau, tourVorschau, diasporaBlock, wahlkampfAktion } from '../src/sim/wahlkampf';

const ruhig = { next: () => .99, between: (a:number,b:number) => (a+b)/2 } as Rng;
function welt(){const w=createWorld(turkey2026,6);startAfterElection(w,schnellProfil());w.spiel!.wahltag=w.day+56;advance(w,1);return w;}

test.each(['vertrauen_regierung','nationalisten'])('wiederholte Auslandstour: auch %s nutzt sich ab', id=>{
 const w=welt(),vor=nationalAverage(NET,w.net,id);expect(auslandstour(w,'deutschland',ruhig).ok).toBe(true);
 const eins=nationalAverage(NET,w.net,id);expect(auslandstour(w,'deutschland',ruhig).ok).toBe(true);
 expect(nationalAverage(NET,w.net,id)-eins).toBeCloseTo((eins-vor)/2,10);
});
test('auch bei vielen Problemen ist das Reiserisiko höchstens 100 Prozent',()=>{
 const w=welt();for(const n of NET.nodes)if(n.kind==='problem')wirke(w,n.id,100);
 expect(reiseVorschau(w,6).risiko).toBeLessThanOrEqual(1);
});


test.each([false,true])('Reise zeigt beide tatsächlichen Ausgänge, Nachfolger=%s',nachfolger=>{
 for(const miss of [false,true]) {
  const w=welt();w.spiel!.wahlkampf!.rolle=nachfolger?'nachfolger':'amt';wirke(w,'p_armut',100);
  const v=reiseWirkungVorschau(w,6),vor=provinceValue(NET,w.net,'vertrauen_regierung',6),g=provinceValue(NET,w.net,v.gruppe!,6);
  expect(reise(w,6,{...ruhig,next:()=>miss?0:.999} as Rng).ok).toBe(true);
  expect(provinceValue(NET,w.net,'vertrauen_regierung',6)-vor).toBeCloseTo(miss?v.rueckschlag:v.erfolg,10);
  expect(provinceValue(NET,w.net,v.gruppe!,6)-g).toBeCloseTo(miss?v.gruppenRueckschlag:v.gruppenErfolg,10);
 }
});
test('Vorschau respektiert unterschiedliche lokale Indexgrenzen und verbraucht keinen Zufall',()=>{
 const w=welt();wirke(w,'vertrauen_regierung',100,[6]);const vor=save(w);
 expect(reiseWirkungVorschau(w,6).erfolg).toBe(0);const p=tourVorschau(w,'deutschland');
 expect(save(w)).toBe(vor);expect(p.vertrauen).toBeLessThan(1.2);
 const alt=nationalAverage(NET,w.net,'vertrauen_regierung');auslandstour(w,'deutschland',ruhig);
 expect(nationalAverage(NET,w.net,'vertrauen_regierung')-alt).toBeCloseTo(p.vertrauen,10);
});
test.each(['deutschland','belgien','frankreich','niederlande'] as const)('%s: Tourvorschau trifft die wirklichen Randwerte einschließlich Verbot',land=>{
 for(const hoch of [false,true])for(const verbot of [false,true]) {
  const w=welt();auslandstour(w,land,ruhig);
  const p=tourVorschau(w,land),vor=diasporaBlock(w,w.spiel!.umfrage.zustimmung);
  const r=auslandstour(w,land,{next:()=>verbot?0:.999,between:(a:number,b:number)=>hoch?b:a} as Rng);
  expect(r.ok).toBe(true);const nach=diasporaBlock(w,w.spiel!.umfrage.zustimmung),v=verbot?(hoch?p.verbotMax:p.verbotMin):(hoch?p.max:p.min);
  expect(nach.beitrag-vor.beitrag).toBeCloseTo(v.beitrag,10);
  expect((nach.beteiligung-vor.beteiligung)*100).toBeCloseTo(v.beteiligung,10);
  expect(nach.lagerAnteil-vor.lagerAnteil).toBeCloseTo(v.lager,10);
 }
});
test('Verbot mobilisiert bei Wiederholung weniger, das diplomatische Risiko bleibt',()=>{
 const w=welt(),rng={...ruhig,next:()=>0} as Rng;
 auslandstour(w,'deutschland',rng);auslandstour(w,'deutschland',rng);
 const [eins,zwei]=w.spiel!.wahlkampf!.touren;
 expect(zwei!.beteiligungPlus).toBeCloseTo(eins!.beteiligungPlus/2,1);
 expect(tourVorschau(w,'deutschland').risiko).toBe(.25);
});
test('75-Prozent-Grenze: weitere Tour verspricht keine neue Beteiligung',()=>{
 const w=welt();w.spiel!.wahlkampf!.touren.push({land:'belgien',tag:w.day,beteiligungPlus:30,lagerPlus:0,verbot:false});
 const p=tourVorschau(w,'deutschland');expect(p.min.beteiligung).toBe(0);expect(p.verbotMax.beteiligung).toBe(0);
});
test('anderes Land hat eigene Abnutzung; Speicherstand erhält besuchte Länder',()=>{
 const w=welt();auslandstour(w,'deutschland',ruhig);
 expect(tourVorschau(w,'belgien').abnutzung).toBe(1);
 const geladen=load(save(w));expect(tourVorschau(geladen,'deutschland').abnutzung).toBe(.5);
 expect(tourVorschau(geladen,'deutschland')).toEqual(tourVorschau(w,'deutschland'));
});
test('keine Punkte: Reise und Tour buchen weder Wirkung noch Zufall',()=>{
 const w=welt();w.spiel!.wahlkampf!.ap=0;const vor=save(w);
 expect(wahlkampfAktion(w,rng=>reise(w,6,rng)).ok).toBe(false);
 expect(wahlkampfAktion(w,rng=>auslandstour(w,'belgien',rng)).ok).toBe(false);expect(save(w)).toBe(vor);
});


import { renderToStaticMarkup } from 'react-dom/server';
import { ReisePlan, TourPlan, WahlkampfZentrale } from '../src/ui/Wahlkampf';
import { setzeSprache, katalogVon, platzhalter } from '../src/i18n';
afterEach(async()=>{await setzeSprache('de');});
test.each(['de','en','tr'] as const)('%s: Reise- und Tourkarten zeigen Kosten und Folgen auch ohne Mauszeiger',async lang=>{
 await setzeSprache(lang);const w=welt();w.spiel!.wahlkampf!.ap=0;
 const html=renderToStaticMarkup(<><ReisePlan world={w} plaka={6} tue={()=>{}}/><TourPlan world={w} land="deutschland" tue={()=>{}}/></>);
 expect(html).not.toMatch(/undefined|NaN|⟦|wahlreise\./);expect(html).toContain('disabled=""');
 expect(html).toContain('25');expect(html).toContain('<summary>');expect(html).not.toContain('title=');
 const de=katalogVon('de'),k=katalogVon(lang);
 for(const key of Object.keys(de).filter(k=>k.startsWith('wahlreise.'))) {expect(k[key]).toBeDefined();expect(platzhalter(k[key]!)).toEqual(platzhalter(de[key]!));}
});
test('Zentrale bietet Auswahl vor der ausführbaren Reise statt Sofortbuchung an Provinzknöpfen',()=>{
 const w=welt();const vor=save(w),html=renderToStaticMarkup(<WahlkampfZentrale world={w} refresh={()=>{}}/>);
 expect(html).toContain('<select');expect(html.match(/<option /g)).toHaveLength(81);expect(html).toContain('Ankara besuchen');
 expect(html).not.toContain('class="kampf-prov');expect(save(w)).toBe(vor);
});
