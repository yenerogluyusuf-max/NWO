import { afterEach, expect, test } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createWorld, save, load, tick } from '../src/sim/world';
import { turkey2026 } from '../src/sim/scenario';
import { startAfterElection, schnellProfil } from '../src/sim/prolog';
import { KRISENPAKETE, krisenPaketPlan, bringeKrisenPaketEin } from '../src/sim/krisenpaket';
import { haushaltZustand, defizitJetzt } from '../src/sim/wirtschaft';
import { haushaltsGesetzSicht, haushaltszyklusTag, haushaltsfenster, setzeEntwurf, bringeHaushaltsgesetzEin, naechsteHaushaltstermine } from '../src/sim/haushalt';
import { haushaltsMehrheitsPlan, sichereHaushaltsMehrheit } from '../src/sim/haushaltsmehrheit';
import { haushaltsNachsorge, haushaltsMonatsabschluss } from '../src/sim/haushaltsbericht';
import { fraktion } from '../src/sim/fraktionen';
import { wirke } from '../src/sim/wirkung';
import { nationalAverage } from '../src/sim/netz';
import { NET } from '../src/sim/modell';
import { Rng } from '../src/sim/rng';
import { addDays } from '../src/sim/dates';
import { Krisenrat } from '../src/ui/wirtschaft/Krisenrat';
import { HaushaltsMonatsbericht } from '../src/ui/wirtschaft/HaushaltsBericht';
import { setzeSprache, katalogVon, platzhalter, t } from '../src/i18n';
import { regierungsVorgaenge } from '../src/ui/schreibtisch/arbeitsplatz';

function welt() {
 const w=createWorld(turkey2026,17);startAfterElection(w,{...schnellProfil(),buendnis:'YENİ'});
 w.spiel!.ereignisse=[];w.spiel!.zusagen=[];w.spiel!.kapital=100;
 w.parliament!.seats={[w.player!.partei.kurz]:480,CHP:120};w.spiel!.lager=[];
 return w;
}
function abstimmen(w:ReturnType<typeof welt>) {
 const g=haushaltZustand(w).gesetz!;w.date=addDays(w.date,g.abstimmung-w.day);w.day=g.abstimmung;haushaltszyklusTag(w,new Rng(17));
}
afterEach(async()=>{await setzeSprache('de');});
test.each(KRISENPAKETE)('%s: Vorschau neutral, Annahme bucht Finanzierung und begrenzte Gruppenreaktionen genau einmal',id=>{
 const w=welt();wirke(w,'arme',100);wirke(w,'unternehmer',-100);
 const vor=save(w),p=krisenPaketPlan(w,id)!;expect(save(w)).toBe(vor);
 const netz=structuredClone(w.net),def=defizitJetzt(w),umfrage=w.spiel!.umfrage.zustimmung,kap=w.spiel!.kapital,auf=w.spiel!.verfassung!.aufmerksamkeit;
 expect(bringeKrisenPaketEin(w,p).ok).toBe(true);expect(w.spiel!.kapital).toBe(kap-p.pk);expect(w.spiel!.verfassung!.aufmerksamkeit).toBe(auf-p.aufmerksamkeit);
 expect(w.net).toEqual(netz);expect(defizitJetzt(w)).toBe(def);expect(w.spiel!.umfrage.zustimmung).toBe(umfrage);expect(haushaltsGesetzSicht(w)!.ja).toBe(p.prognose.ja);
 abstimmen(w);expect(haushaltZustand(w).abschluesse!.at(-1)).toMatchObject({angenommen:true,krisenpaket:id});
 expect(defizitJetzt(w)-def).toBeCloseTo(p.saldo,10);
 for(const e of p.posten)expect(haushaltZustand(w).stufen[e.id]).toBe(e.ziel);
 for(const g of p.gruppen)expect(nationalAverage(NET,w.net,g.id)-nationalAverage(NET,netz,g.id)).toBeCloseTo(g.delta,9);
 expect(krisenPaketPlan(w,id)!.moeglich).toBe(false);
 const fertig=save(w);haushaltszyklusTag(w,new Rng(17));expect(save(w)).toBe(fertig);
});
test('abgelehnter Nachtrag verändert keine Ansätze und verbraucht nicht den Jahreszyklus',()=>{
 const w=welt(),h=haushaltZustand(w);w.parliament!.seats={[w.player!.partei.kurz]:0,CHP:600};h.zyklusJahr=2027;h.entwurf={bildung:2};
 const p=krisenPaketPlan(w,'entlastung')!,stufen={...h.stufen};expect(bringeKrisenPaketEin(w,p).ok).toBe(true);abstimmen(w);
 expect(h.abschluesse!.at(-1)!.angenommen).toBe(false);expect(h.stufen).toEqual(stufen);expect(h.zyklusJahr).toBe(2027);expect(h.entwurf).toEqual({bildung:2});
 expect(krisenPaketPlan(w,'entlastung')!.grund).toContain('30');w.day+=30;w.date=addDays(w.date,30);expect(krisenPaketPlan(w,'entlastung')!.moeglich).toBe(true);
});
test('angenommener Nachtrag erhält den vorbereiteten Oktoberhaushalt und erlaubt dessen eigenen Beschluss',()=>{
 const w=welt();w.date='2028-10-01';const h=haushaltZustand(w);h.entwurf={bildung:2};
 expect(bringeKrisenPaketEin(w,krisenPaketPlan(w,'entlastung')!).ok).toBe(true);abstimmen(w);
 expect(h.zyklusJahr).toBeUndefined();expect(h.entwurf).toEqual({bildung:2});expect(haushaltsfenster(w).offen).toBe(true);
 expect(bringeHaushaltsgesetzEin(w).ok).toBe(true);expect(h.gesetz?.krisenpaket).toBeUndefined();abstimmen(w);expect(h.zyklusJahr).toBe(2028);
});
test.each(['kapital','pause','beendet','haushalt','stufen','stimmen','duldung','bip'] as const)('geänderte Lage %s entwertet den Klick ohne Teilbuchung',art=>{
 const w=welt(),p=krisenPaketPlan(w,'entlastung')!;
 if(art==='kapital')w.spiel!.kapital=-20;
 if(art==='pause')w.spiel!.verfassung!.pauseBis=w.day+2;
 if(art==='beendet')w.spiel!.ende={art:'sturz',tag:w.day,datum:w.date,titel:'Ende',text:'Ende'} as never;
 if(art==='haushalt'){w.date='2028-10-01';setzeEntwurf(w,'bildung',2);bringeHaushaltsgesetzEin(w);}
 if(art==='stufen')haushaltZustand(w).stufen.sozialhilfe=1;
 if(art==='stimmen')w.parliament!.seats={[w.player!.partei.kurz]:200,CHP:400};
 if(art==='duldung'){fraktion(w,'CHP').duldungBis=w.day+2;}
 if(art==='bip')w.economy.geldbasis!.real*=1.2;
 const vor=save(w);expect(bringeKrisenPaketEin(w,p).ok).toBe(false);expect(save(w)).toBe(vor);
});
test('höhere bestehende Hilfe wird nicht gekürzt; Finanzierungsgrenze bleibt als Defizit sichtbar',()=>{
 const w=welt(),h=haushaltZustand(w);h.stufen={sozialhilfe:6,unternehmensteuer:4};
 const p=krisenPaketPlan(w,'dienste')!;expect(p.schritte.sozialhilfe).toBeUndefined();expect(p.schritte.unternehmensteuer).toBeUndefined();expect(p.saldo).toBeGreaterThan(0);
});
test('vor dem Votum auslaufende Duldung wird ausgewiesen; ein echter Vertrag sichert Stimmen und speichert die neue Zusage',()=>{
 const w=welt();w.parliament!.seats={[w.player!.partei.kurz]:180,CHP:180,'YENİ':120,MHP:90,DEM:30};w.spiel!.lager=[];fraktion(w,'CHP').duldungBis=w.day+10;fraktion(w,'YENİ').bereitschaft=65;
 const p=krisenPaketPlan(w,'entlastung')!;expect(p.prognose.auslaufend.map(f=>f.partei)).toContain('CHP');expect(p.prognose.luecke).toBeGreaterThan(0);
 expect(bringeKrisenPaketEin(w,p).ok).toBe(true);const a=haushaltsMehrheitsPlan(w,'koalition','YENİ')!;expect(a).toBeDefined();
 const kap=w.spiel!.kapital;expect(sichereHaushaltsMehrheit(w,a).ok).toBe(true);expect(w.spiel!.kapital).toBe(kap-a.pk);expect(haushaltsGesetzSicht(w)!.ja).toBe(a.nachher);
 const z=w.spiel!.zusagen.at(-1)!;expect(z.von).toBe('YENİ');expect(z.erfuellt).toBe(false);expect(z.stufeZiel).toBeDefined();
 abstimmen(w);expect(haushaltZustand(w).abschluesse!.at(-1)!.zusagen.some(x=>x.z.id===z.id&&x.quelle==='haushalt')).toBe(true);
});
test('Speichern/Laden erhält Paketziel, Abkommen und Monatsbeobachtung',()=>{
 const w=welt();bringeKrisenPaketEin(w,krisenPaketPlan(w,'entlastung')!);
 const r=load(save(w));expect(haushaltZustand(r).gesetz).toEqual(haushaltZustand(w).gesetz);abstimmen(r);haushaltsMonatsabschluss(r);
 const b=haushaltZustand(r).monatsberichte!.at(-1)!;expect(b.abschluss.krisenpaket).toBe('entlastung');expect(b.stand.sozial?.armut).toBeTypeOf('number');
 const alt=structuredClone(b);delete alt.stand.sozial;delete alt.abschluss.vorher.sozial;expect(()=>renderToStaticMarkup(<HaushaltsMonatsbericht bericht={alt}/>)).not.toThrow();
});
test.each(['de','en','tr'] as const)('%s: Krisenrat, Kalender und Bericht benennen Nachtrag und echte Verpflichtungen',async sprache=>{
 await setzeSprache(sprache);const w=welt();const html=renderToStaticMarkup(<Krisenrat world={w} geaendert={()=>{}}/>);
 expect(html).toContain(t('kp.titel').replaceAll('&','&amp;'));expect(html).toContain(t('kp.entlastung.titel'));
 bringeKrisenPaketEin(w,krisenPaketPlan(w,'entlastung')!);
 expect(naechsteHaushaltstermine(w)[0]!.text).toContain(t('kp.entlastung.titel'));expect(regierungsVorgaenge(w)[0]!.titel).toContain(t('kp.entlastung.titel'));
 expect(renderToStaticMarkup(<Krisenrat world={w} geaendert={()=>{}}/>)).toContain(t('hm.titel'));
 abstimmen(w);const h=renderToStaticMarkup(<HaushaltsMonatsbericht bericht={haushaltsNachsorge(w)!}/>);expect(h).toContain(t('kp.sozialBericht'));expect(h).toContain(t('kp.entlastung.titel'));
 const de=katalogVon('de'),k=katalogVon(sprache);for(const key of Object.keys(de).filter(k=>k.startsWith('kp.')||k.startsWith('rn.'))){expect(k[key],key).toBeTruthy();expect(platzhalter(k[key]!)).toEqual(platzhalter(de[key]!));}
});
test('echter Monatslauf setzt das Paket erst nach dem Votum um und speichert die soziale Lage',()=>{
 const w=welt();bringeKrisenPaketEin(w,krisenPaketPlan(w,'entlastung')!);const g=haushaltZustand(w).gesetz!;
 for(let i=0;i<40&&!w.spiel!.ende;i++){tick(w);if(w.day<g.abstimmung)expect(haushaltZustand(w).stufen.sozialhilfe??0).toBe(0);}
 expect(haushaltZustand(w).abschluesse!.at(-1)).toMatchObject({krisenpaket:'entlastung',angenommen:true});
 expect(haushaltZustand(w).monatsberichte!.at(-1)?.stand.sozial).toBeDefined();
});
