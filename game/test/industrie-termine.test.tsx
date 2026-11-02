import { afterEach, expect, test } from 'vitest';
import { createWorld, save } from '../src/sim/world';
import { turkey2026 } from '../src/sim/scenario';
import { startAfterElection, schnellProfil } from '../src/sim/prolog';
import { bauplan, reichZustand, reichMonat, vorhabenSicht, warteschlange } from '../src/sim/reich';
import { knotenSicht, knotenTermin } from '../src/sim/wissensbaum';
import { haushaltZustand } from '../src/sim/wirtschaft';
import { setzeSprache, t } from '../src/i18n';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Detail } from '../src/ui/wissen/Detail';
function welt(){
 const w=createWorld(turkey2026,17);startAfterElection(w,schnellProfil());
 const z=reichZustand(w);z.verwaltung=100;
 // Isolierter Terminprüfstand: keine politische Kampagne, Risiken schon geprüft.
 z.laufend=[{id:'chips_design',start:w.date,fortschritt:0,bau:100,monate:10,durchbruchGeprueft:true,ueberzugN:100}];
 return w;
}
afterEach(async()=>{await setzeSprache('de');});
test('Termin der Baureihenfolge berücksichtigt das tatsächliche Forschungstempo',()=>{
 const w=welt();w.spiel!.modifikatoren??={};w.spiel!.modifikatoren['fokus:wissen:chips_design']=0.5;
 expect(bauplan(w).chips_design).toBeCloseTo(5);
 expect(warteschlange(w).find(k=>k.id==='chips_design')!.fertigIn).toBe(20);
});
test('Projektansicht berücksichtigt die Wartezeit hinter einem kapazitätsfüllenden Vorhaben',()=>{
 const w=welt();reichZustand(w).laufend.unshift({id:'infra_kanal_istanbul',start:w.date,fortschritt:0,bau:30000,monate:100});
 const termin=warteschlange(w).find(k=>k.id==='chips_design')!;
 expect(termin.startIn!).toBeGreaterThan(100);
 expect(vorhabenSicht(w,'chips_design')!.restMonate).toBe(termin.fertigIn);
});
test('pausierte Forschung verspricht keine Fertigstellung in zehn Monaten',()=>{
 const w=welt();reichZustand(w).laufend[0]!.pausiert=true;
 expect(vorhabenSicht(w,'chips_design')!.restMonate).toBeUndefined();
});
test('konstantes halbes Forschungstempo erreicht den angezeigten Abschluss im echten Baumonatslauf',()=>{
 const w=welt(),z=reichZustand(w);z.bestand={};
 w.spiel!.modifikatoren??={};w.spiel!.modifikatoren['fokus:wissen:chips_design']=0.5;
 const termin=vorhabenSicht(w,'chips_design')!.restMonate!;
 expect(termin).toBe(20);
 for(let i=1;i<=termin;i++){
  reichMonat(w);
  expect(!!z.bestand.chips_design).toBe(i===termin);
 }
});
test('gereifter Forschungsetat aktualisiert den Termin am selben Tag ohne Fortschritt zu schenken',()=>{
 const w=welt(),h=haushaltZustand(w);h.wirksam??={...h.stufen};h.wirksam.forschung=-4;
 const langsam=vorhabenSicht(w,'chips_design')!.restMonate!;
 h.wirksam.forschung=4;
 expect(vorhabenSicht(w,'chips_design')!.restMonate!).toBeLessThan(langsam);
 const vorher=save(w);warteschlange(w);vorhabenSicht(w,'chips_design');
 expect(save(w)).toBe(vorher);
 expect(reichZustand(w).laufend[0]!.fortschritt).toBe(0);
});
test('erschöpfte Verwaltung gibt den ersten Abschluss innerhalb der tatsächlichen Rundungstoleranz an',()=>{
 const w=welt();reichZustand(w).verwaltung=0;
 const termin=warteschlange(w).find(k=>k.id==='chips_design')!.fertigIn!;
 // Halbe Leistung bedeutet doppelte Dauer; kein asymptotischer letzter Rest.
 expect(termin).toBe(20);
});
for(const sprache of ['de','en','tr'] as const)test(`${sprache}: Pause und unbestimmter Termin erscheinen ohne erfundene Restdauer`,async()=>{
 await setzeSprache(sprache);const w=welt();reichZustand(w).laufend[0]!.pausiert=true;
 const k=knotenSicht(w,'chips_design')!;
 expect(knotenTermin(k)).toBe(t('wissen.ui.bauPause'));
 let html=renderToStaticMarkup(createElement(Detail,{w,k,onGetan:()=>{},onZu:()=>{}}));
 expect(html).toContain(t('wissen.ui.bauPause'));expect(html).toContain(t('wissen.ui.terminRegel'));
 const unbestimmt={...k,pausiert:false,restMonate:undefined};
 html=renderToStaticMarkup(createElement(Detail,{w,k:unbestimmt,onGetan:()=>{},onZu:()=>{}}));
 expect(html).toContain(t('wissen.ui.terminOffen'));
 expect(html).not.toMatch(/undefined|NaN|Infinity|⟦|wissen\.ui\./);
});
