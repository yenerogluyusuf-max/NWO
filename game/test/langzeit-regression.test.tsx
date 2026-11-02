import { expect, test } from 'vitest';
import { createWorld } from '../src/sim/world';
import { turkey2026 } from '../src/sim/scenario';
import { startAfterElection, schnellProfil } from '../src/sim/prolog';
import { kosten } from '../src/sim/ereignis-hilfen';
import { monthlyUpdate } from '../src/sim/economy';
import { Rng } from '../src/sim/rng';
import { gueterMonat } from '../src/sim/gueter';
import { militaerVersorgung } from '../src/sim/versorgung';
import type { KriegVorgang } from '../src/sim/krieg-typen';
function welt(){const w=createWorld(turkey2026,17);startAfterElection(w,schnellProfil());return w;}
function front(w:ReturnType<typeof welt>,land='SYR'){
 const k:KriegVorgang={id:`test-${land}`,land,phase:'krieg',seit:w.day,eskalation:90,mobilmachung:1,front:40,frontVorher:40,uhr:80,uhrGegner:80,woche:0,verluste:0};
 (w.spiel!.kriege??=[]).push(k);return k;
}
test('Erstattung über Restschuld erzeugt keine negativen Bruttoschulden',()=>{
 const w=welt();w.economy.debtRatio=0.1;kosten(w,-0.6);
 expect(w.economy.debtRatio).toBe(0);
});
test('Monatsüberschuss bleibt für das spätere Defizit erhalten',()=>{
 const w=welt(),e=w.economy;Object.assign(e,{debtRatio:0,deficit:-12,fiscalImpulse:0,policyCost:0,zinsMehrlast:0,konjunkturSaldo:0});
 monthlyUpdate(e,[],new Rng(1));e.deficit=1;
 monthlyUpdate(e,[],new Rng(1));
 expect(e.debtRatio).toBe(0);
});
test('neue Front erhält keine Gratisversorgung aus einer früheren Friedensbilanz',()=>{
 const w=welt();gueterMonat(w);front(w);
 expect(militaerVersorgung(w,'SYR').treibstoff).toBe(0);
});
test('zweite unversorgte Front verschwindet nicht aus der Gesamtversorgung',()=>{
 const w=welt();front(w);gueterMonat(w);const alt=militaerVersorgung(w).treibstoff;front(w,'IRN');
 expect(militaerVersorgung(w,'IRN').treibstoff).toBe(0);
 expect(militaerVersorgung(w).treibstoff).toBeLessThan(alt);
});

import { afterEach } from 'vitest';
import { load, save, tick } from '../src/sim/world';
import { bucheFinanzsaldo, bipMrd, schuldenMonatsrechnung, kassenbestand } from '../src/sim/staatsgeld';
import { staatsfinanzen } from '../src/sim/staatsfinanzen';
import { Staatsfinanzen } from '../src/ui/wirtschaft/Staatsfinanzen';
import { KENNZAHLEN_NACH_ID } from '../src/sim/wirtschaft-kennzahlen';
import { TransportTafel, transportKartenDaten } from '../src/ui/gueter/TransportKarte';
import { renderToStaticMarkup } from 'react-dom/server';
import { setzeSprache } from '../src/i18n';
import { gueterZustand } from '../src/sim/gueter';
import { eigenStaerke } from '../src/sim/krieg';
import { baueAus, behoerdenMonat } from '../src/sim/behoerden';
import { wirkungsVorschau, oeffne } from '../src/sim/ereignisse';
afterEach(async()=>{await setzeSprache('de');});

test('Erstattung bleibt nominal erhalten, spätere Ausgabe verbraucht erst Kasse und dann Kredit',()=>{
 const w=welt(),bip=bipMrd(w);w.economy.debtRatio=0.1;
 kosten(w,-0.6);expect(kassenbestand(w.economy)).toBeCloseTo(bip*0.005,8);
 kosten(w,0.3);expect(w.economy.debtRatio).toBe(0);expect(kassenbestand(w.economy)).toBeCloseTo(bip*0.002,8);
 kosten(w,0.4);expect(w.economy.debtRatio).toBeCloseTo(0.2,10);expect(kassenbestand(w.economy)).toBe(0);
});
test('Kasse erhält keine Inflationsgewinne und übersteht Speichern/Laden; Altstand startet bei null',()=>{
 const w=welt();w.economy.kassenbestandMrd=123;
 w.economy.geldbasis!.preise=2;expect(staatsfinanzen(w).kasseMrd).toBe(123);
 expect(load(save(w)).economy.kassenbestandMrd).toBe(123);
 delete w.economy.kassenbestandMrd;const alt=save(w);expect(kassenbestand(w.economy)).toBe(0);expect(save(w)).toBe(alt);
 expect(kassenbestand(load(alt).economy)).toBe(0);
});
test.each([0,0.5,30])('zehn Jahre Wechsel von Überschuss, Defizit, Wachstum und Rezession erhalten jeden Geldbetrag, Startquote %s',quote=>{
 const w=welt(),e=w.economy;Object.assign(e,{debtRatio:quote,fiscalImpulse:0,policyCost:0,zinsMehrlast:0,konjunkturSaldo:0});
 for(let m=0;m<120;m++){
  Object.assign(e,{deficit:m%24<12?-12:8,growth:m%30<10?-5:4,inflation:m%36<12?35:3});
  const altFx=e.usdTry;e.usdTry*=m%12===0?1.3:0.999;
  const r=schuldenMonatsrechnung(e,altFx,0.4);
  expect(r.nachherMrd).toBeGreaterThanOrEqual(0);expect(r.kasseNachherMrd!).toBeGreaterThanOrEqual(0);
  expect(r.nachherMrd-r.kasseNachherMrd!-(r.vorherMrd-r.kasseVorherMrd!)).toBeCloseTo(r.defizitMrd+r.wechselkursMrd,7);
  e.debtRatio=r.nachherQuote;e.kassenbestandMrd=r.kasseNachherMrd;
  // Carry the actual nominal closing GDP into the following accounting period.
  e.geldbasis={basisBipMrd:r.bipNachherMrd,real:1,preise:1,seit:w.date,letzterMonat:w.date.slice(0,7)};
  const netto0=staatsfinanzen(w).nettoSchuldenMrd;bucheFinanzsaldo(e,m%3===0?-0.2:0.1);
  expect(staatsfinanzen(w).nettoSchuldenMrd-netto0).toBeCloseTo((m%3===0?-0.2:0.1)*bipMrd(w)/100,7);
 }
});
test('echter Tageswechsel bewahrt monatliche Überschüsse und verbucht sie nur einmal',()=>{
 const w=welt();w.date='2028-06-30';Object.assign(w.economy,{debtRatio:0,deficit:-20,fiscalImpulse:0,policyCost:0,zinsMehrlast:0,konjunkturSaldo:0});
 tick(w);const r=w.economy.schuldenAbschluss!;expect(r.restUeberschussMrd).toBeGreaterThan(0);
 expect(r.kasseNachherMrd).toBe(r.restUeberschussMrd);
 const vorher=save(w);staatsfinanzen(w);schuldenMonatsrechnung(w.economy);expect(save(w)).toBe(vorher);
});
test('laufende Behördenausgaben verwenden vorhandenes Guthaben ohne doppelte Nachfragewirkung',()=>{
 const a=welt(),b=load(save(a));a.spiel!.kapital=b.spiel!.kapital=100;
 a.economy.kassenbestandMrd=bipMrd(a)*0.1;
 expect(baueAus(a,'justiz','personal').ok).toBe(true);expect(baueAus(b,'justiz','personal').ok).toBe(true);
 a.day=b.day=Math.max(a.spiel!.behoerden!.stand.justiz.bau!.fertig,b.spiel!.behoerden!.stand.justiz.bau!.fertig);
 const schuldA=a.economy.debtRatio,schuldB=b.economy.debtRatio,kasse=kassenbestand(a.economy);
 behoerdenMonat(a);behoerdenMonat(b);
 const kredit=b.economy.debtRatio-schuldB;
 expect(kredit).toBeGreaterThan(0);expect(a.economy.debtRatio).toBeCloseTo(schuldA,10);
 expect(kasse-kassenbestand(a.economy)).toBeCloseTo(kredit*bipMrd(a)/100,8);
 expect(a.economy.outputGap).toBeCloseTo(b.economy.outputGap,10);
});
test('Schuldenprognose erklärt die Finanzierung aus Guthaben und ihre Komponenten addieren sich',()=>{
 const w=welt();w.economy.kassenbestandMrd=bipMrd(w);const p=KENNZAHLEN_NACH_ID['schulden']!.treiber(w);
 expect(JSON.stringify(p)).toContain('Staatskasse');
});
test('Ereignisvorschau zeigt Kassenentnahme und aktualisiert ihre Finanzierung am selben Tag',()=>{
 const w=welt();w.spiel!.kapital=100;
 const ev=oeffne(w,'fluechtlingswelle',new Rng(1),{provinzen:[27],staerke:1})!;
 expect(ev).not.toBeNull();
 const ohne=wirkungsVorschau(w,ev,'aufnehmen');expect(ohne.join(' ')).toContain('Schulden');
 w.economy.kassenbestandMrd=bipMrd(w);const vorher=save(w);
 const mit=wirkungsVorschau(w,ev,'aufnehmen');expect(mit.join(' ')).toContain('Staatskasse');
 expect(mit.join(' ')).not.toContain('Schulden +');expect(save(w)).toBe(vorher);
});
test('neuer Krieg übernimmt nicht die Verbrauchsbilanz des früheren Einsatzes',()=>{
 const w=welt(),k=front(w);gueterMonat(w);expect(militaerVersorgung(w,'SYR').treibstoff).toBeGreaterThan(0);
 k.phase='beendet';const neu=front(w);neu.id='zweiter-einsatz';
 expect(militaerVersorgung(w,'SYR').treibstoff).toBe(0);
 expect(load(save(w)).spiel!.transport!.bilanz!.depots.SYR!.kriegId).toBe(k.id);
});
test('erste wirkliche Belieferung erhöht Kampfstärke; Lesen verbraucht keine Waren',()=>{
 const w=welt(),k=front(w),leer=eigenStaerke(w,k),vorher=save(w);
 expect(militaerVersorgung(w,'SYR').faktor).toBe(0.25);expect(save(w)).toBe(vorher);
 gueterMonat(w);expect(militaerVersorgung(w,'SYR').treibstoff).toBeGreaterThan(0);
 expect(eigenStaerke(w,k)).toBeGreaterThan(leer);
 const bezahlt=save(w);militaerVersorgung(w);gueterMonat(w);expect(save(w)).toBe(bezahlt);
});
test('Waffenruhe zählt mit geringerem Bedarf; abgeschlossene Fronten verschwinden von der Karte',()=>{
 const w=welt();front(w);gueterMonat(w);const k=front(w,'IRN');k.phase='waffenruhe';
 expect(militaerVersorgung(w).treibstoff).toBeCloseTo(1/1.35,6);
 k.phase='beendet';expect(militaerVersorgung(w).treibstoff).toBeCloseTo(1,6);
 expect(transportKartenDaten(w,false,null).knoten.some(k=>k.id==='front:IRN')).toBe(false);
});
test.each(['de','en','tr'] as const)('Kassenbuch und neue Front erklären den wirklichen Stand (%s)',async sprache=>{
 await setzeSprache(sprache);const w=welt();w.economy.kassenbestandMrd=123;front(w);
 const f=renderToStaticMarkup(<Staatsfinanzen world={w} details/>);
 expect(f).toContain('123');expect(f).not.toMatch(/sf\.[a-z]|NaN/);
 const h=renderToStaticMarkup(<TransportTafel world={w} auswahl="front:SYR" onAuswahl={()=>{}} gas={false} onGas={()=>{}} refresh={()=>{}} onWirtschaft={()=>{}} onClose={()=>{}}/>);
 expect(h).toContain('25');expect(h).not.toMatch(/transport\.frontErste|NaN/);
 expect(transportKartenDaten(w,false,null).knoten.find(k=>k.id==='front:SYR')!.ton).toBe('gelb');
});

test('alter Monatsbeleg behauptet keine nachträglich erhaltene Kasse',()=>{
 const w=welt();w.economy.debtRatio=0;w.economy.deficit=-12;
 const r=schuldenMonatsrechnung(w.economy);delete r.kasseVorherMrd;delete r.kasseNachherMrd;delete r.kasseEntnahmeMrd;
 w.economy.schuldenAbschluss={...r,monat:'2028-05',datum:'2028-06-01'};
 const vorher=save(w),h=renderToStaticMarkup(<Staatsfinanzen world={w} details/>);
 expect(h).toContain('nicht rückwirkend');expect(save(w)).toBe(vorher);
});
