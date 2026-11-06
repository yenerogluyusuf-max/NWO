import { afterEach, expect, test } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createWorld, save, load, tick } from '../src/sim/world';
import { turkey2026 } from '../src/sim/scenario';
import { startAfterElection, schnellProfil } from '../src/sim/prolog';
import { KRISENGESETZE, krisenGesetzPlan, bringeKrisenGesetzEin, krisenAlltag } from '../src/sim/krisengesetze';
import { bringeEin, gesetzPrognose, gesetzeAbstimmen, setPolicy } from '../src/sim/handeln';
import { NET } from '../src/sim/modell';
import { stufenName } from '../src/data/skalen';
import { nationalAverage, PROVINCES } from '../src/sim/netz';
import { fraktion } from '../src/sim/fraktionen';
import { aktiveParteivorsitzende } from '../src/sim/koalitionslage';
import { addDays, formatDateDe } from '../src/sim/dates';
import { Rng } from '../src/sim/rng';
import { KrisenGesetze, KrisenGesetzKarte } from '../src/ui/wirtschaft/KrisenGesetze';
import { setzeSprache, t, katalogVon, platzhalter } from '../src/i18n';
import type { World } from '../src/sim/types';

function welt() {
  const w=createWorld(turkey2026,17);startAfterElection(w,{...schnellProfil(),buendnis:'YENİ'});
  w.spiel!.ereignisse=[];w.spiel!.zusagen=[];w.spiel!.kapital=100;
  w.parliament!.seats={[w.player!.partei.kurz]:480,'YENİ':120};
  return w;
}
function votum(w:World) {
  const tag=w.spiel!.gesetze[0]!.abstimmung;w.date=addDays(w.date,tag-w.day);w.day=tag;
  return gesetzeAbstimmen(w,new Rng(17))[0]!;
}
afterEach(async()=>{await setzeSprache('de');});

test.each(KRISENGESETZE)('%s: reale Kosten, keine vorzeitigen Effekte, tatsächliches Votum und Umsetzung',id=>{
  const w=welt();w.spiel!.verfassung!.belastung=75;
  const alt=save(w),p=krisenGesetzPlan(w,id,10)!;expect(save(w)).toBe(alt);expect(p.moeglich).toBe(true);
  const netz=structuredClone(w.net),figuren=structuredClone(w.spiel!.figuren),umfrage=w.spiel!.umfrage.zustimmung;
  const kap=w.spiel!.kapital,auf=w.spiel!.verfassung!.aufmerksamkeit,quote=w.economy.debtRatio;
  expect(bringeKrisenGesetzEin(w,p).ok).toBe(true);
  expect(w.spiel!.kapital).toBe(kap-p.pk);expect(w.spiel!.verfassung!.aufmerksamkeit).toBe(Math.max(0,auf-p.aufmerksamkeit));
  expect(w.net).toEqual(netz);expect(w.spiel!.figuren).toEqual(figuren);expect(w.spiel!.umfrage.zustimmung).toBe(umfrage);expect(w.economy.debtRatio).toBe(quote);
  // Seit N4 beschließt beim Mindestlohn die Kommission (data/rechtswege.ts): Der Plan zeigt dann keine Plenumsprognose, sondern den Beschlusstag.
  if(p.kommission){expect(w.spiel!.gesetze[0]!.weg).toBe('kommission');expect(p.prognose).toBeUndefined();expect(p.beschlussTag).toBe(w.spiel!.gesetze[0]!.abstimmung);}
  else expect(gesetzPrognose(w,w.spiel!.gesetze[0]!)).toEqual(p.prognose);
  const nach=save(w);expect(bringeKrisenGesetzEin(w,p).ok).toBe(false);expect(save(w)).toBe(nach);
  expect(votum(w).angenommen).toBe(true);expect(w.net.targets[id]).toBe(p.ziel);
  for(const f of p.reaktionen)expect(w.spiel!.figuren.find(x=>x.id===f.id)!.loyalitaet).toBeCloseTo(f.nachher,9);
  expect(nationalAverage(NET,w.net,id)).toBeCloseTo(p.aktuell,9);
  const tag=w.day;while(w.day<tag+35&&!w.spiel!.ende)tick(w);
  expect(nationalAverage(NET,w.net,id)).toBeGreaterThan(p.aktuell);
});

// Zusammenführung der Nachtzweige: Den Mindestlohn beschließt seit N4 die Mindestlohnkommission (Arbeitsgesetz Art. 39), nicht das
// Parlament; eine Ablehnung im Plenum gibt es dort nicht mehr. Die Prüfung der Ablehnung läuft deshalb am Arbeitslosengeld, das
// weiter durchs Parlament muss. Zusätzlich prüft der zweite Test, dass der Krisenrat beim Mindestlohn keine Plenumsprognose zeigt.
test('Ablehnung startet keine Umsetzung und löst keine Zusage ein',()=>{
  const w=welt(),opposition=['MHP','AKP'].find(p=>p!==w.player!.partei.kurz)!;
  w.parliament!.seats={[w.player!.partei.kurz]:0,[opposition]:600};w.spiel!.lager=[];fraktion(w,opposition).bereitschaft=0;
  const ziel0=Math.round(nationalAverage(NET,w.net,'m_arbeitslosengeld'))+20;
  w.spiel!.zusagen.push({id:'abgelehnt',von:'YENİ',text:'Arbeitslosengeld erhöhen',massnahme:'m_arbeitslosengeld',richtung:1,stufeZiel:ziel0,stufeStart:ziel0-20,faellig:w.day+90,erfuellt:false,gebrochen:false});
  const p=krisenGesetzPlan(w,'m_arbeitslosengeld',20)!;expect(p.kommission).toBe(false);expect(p.prognose!.luecke).toBeGreaterThan(0);
  expect(bringeKrisenGesetzEin(w,p).ok).toBe(true);const ziel=w.net.targets.m_arbeitslosengeld;
  expect(votum(w).angenommen).toBe(false);expect(w.net.targets.m_arbeitslosengeld).toBe(ziel);expect(w.spiel!.zusagen.find(z=>z.id==='abgelehnt')!.erfuellt).toBe(false);
});

test('Mindestlohn im Krisenrat: Die Kommission beschließt, ohne Plenumsprognose und ohne „Gesetzentwurf“',()=>{
  const w=welt(),opposition=['MHP','AKP'].find(p=>p!==w.player!.partei.kurz)!;
  w.parliament!.seats={[w.player!.partei.kurz]:0,[opposition]:600};w.spiel!.lager=[];fraktion(w,opposition).bereitschaft=0;
  const p=krisenGesetzPlan(w,'m_mindestlohn',20)!;expect(p.kommission).toBe(true);expect(p.prognose).toBeUndefined();
  const karte=renderToStaticMarkup(<KrisenGesetzKarte world={w} plan={p} ausfuehren={()=>{}}/>);
  expect(karte).not.toContain(t('kg.einbringen'));expect(karte).not.toContain(t('kg.mehrheit'));expect(karte).toContain(t('int.kg.kommissionAktion'));
  expect(bringeKrisenGesetzEin(w,p).ok).toBe(true);
  const datum=w.spiel!.gesetze[0]!.abstimmung;expect(karte).toContain(t('int.kg.kommission',{datum:formatDateDe(addDays(w.date,datum-w.day))}));
  const laufend=krisenGesetzPlan(w,'m_mindestlohn',10)!;expect(laufend.laufend).toBe(true);
  const stand=renderToStaticMarkup(<KrisenGesetzKarte world={w} plan={laufend} ausfuehren={()=>{}}/>);
  expect(stand).toContain(t('int.kg.kommissionLaufend'));expect(stand).not.toContain(t('kg.laufend'));
  // Ohne jede Stimme im Parlament setzt die Kommission die Vorgabe durch, und erst dann beginnt die Umsetzung.
  const vorher=w.net.targets.m_mindestlohn;expect(vorher).not.toBe(p.ziel);
  votum(w);expect(w.net.targets.m_mindestlohn).toBe(p.ziel);
});

test('Duldung läuft zum tatsächlichen Votum aus; kleine und große Schritte haben eigene Preise',()=>{
  const w=welt();w.parliament!.seats={[w.player!.partei.kurz]:200,'YENİ':120,CHP:280};w.spiel!.lager=[];fraktion(w,'CHP').duldungBis=w.day+10;
  const klein=krisenGesetzPlan(w,'m_arbeitslosengeld',10)!,gross=krisenGesetzPlan(w,'m_arbeitslosengeld',20)!;
  expect(klein.prognose!.auslaufend.map(f=>f.partei)).toContain('CHP');expect(klein.prognose!.ja).toBeLessThan(klein.prognose!.heuteJa);
  expect(gross.pk).toBeGreaterThanOrEqual(klein.pk);expect(gross.kostenBip).toBeGreaterThan(klein.kostenBip);expect(gross.ziel-klein.ziel).toBe(10);
});

test('Ausreichendes Ziel verlängert echte Zusagenfrist; Anerkennung erst bei Annahme',()=>{
  const w=welt(),ziel=Math.round(nationalAverage(NET,w.net,'m_arbeitslosengeld'))+20;
  w.spiel!.zusagen.push({id:'schutz',von:'YENİ',text:'Arbeitslosengeld erhöhen',massnahme:'m_arbeitslosengeld',richtung:1,stufeZiel:ziel,stufeStart:ziel-20,faellig:5,erfuellt:false,gebrochen:false});
  const klein=krisenGesetzPlan(w,'m_arbeitslosengeld',10)!,p=krisenGesetzPlan(w,'m_arbeitslosengeld',20)!;
  expect(klein.erfuellt).toEqual([]);expect(klein.zusagen).toEqual([]);expect(p.erfuellt[0]?.id).toBe('schutz');
  expect(p.zusagen[0]?.nachher).toBe(p.prognose!.tag+15);
  const loy=aktiveParteivorsitzende(w,'YENİ')[0]!.loyalitaet;
  bringeKrisenGesetzEin(w,p);expect(w.spiel!.zusagen[0]!.erfuellt).toBe(false);expect(aktiveParteivorsitzende(w,'YENİ')[0]!.loyalitaet).toBe(loy);
  const geladen=load(save(w));expect(votum(geladen).angenommen).toBe(true);expect(geladen.spiel!.zusagen[0]!.erfuellt).toBe(true);
  for(const f of p.reaktionen)expect(geladen.spiel!.figuren.find(x=>x.id===f.id)!.loyalitaet).toBeCloseTo(f.nachher,9);
});

test.each(['kapital','pause','ende','stimmen','zusagen','person','datum','bip'] as const)('%s: alte Vorschläge buchen nichts',art=>{
  const w=welt(),p=krisenGesetzPlan(w,'m_mindestlohn',10)!;
  if(art==='kapital')w.spiel!.kapital=-100;
  if(art==='pause')w.spiel!.verfassung!.pauseBis=w.day+2;
  if(art==='ende')w.spiel!.ende={art:'sturz',tag:w.day,datum:w.date,titel:'Ende',text:'Ende'} as never;
  if(art==='stimmen')w.parliament!.seats={[w.player!.partei.kurz]:180,CHP:420};
  if(art==='zusagen')w.spiel!.zusagen.push({id:'neu',von:'YENİ',text:'Lohn',massnahme:'m_mindestlohn',richtung:1,stufeZiel:p.ziel,faellig:1,erfuellt:false,gebrochen:false});
  if(art==='person')aktiveParteivorsitzende(w,'YENİ')[0]!.loyalitaet=19;
  if(art==='datum')w.date=addDays(w.date,1);
  if(art==='bip')w.economy.geldbasis!.real*=2;
  const vor=save(w);expect(bringeKrisenGesetzEin(w,p).ok).toBe(false);expect(save(w)).toBe(vor);
});

test('Laufender oder bereits beschlossener Ausbau bleibt erhalten, keine Umkehr oder Verdopplung',()=>{
  const w=welt();bringeEin(w,'m_ausbildung',80,null,'gesetz');
  expect(krisenGesetzPlan(w,'m_ausbildung',10)!.laufend).toBe(true);expect(krisenGesetzPlan(w,'m_ausbildung',10)!.moeglich).toBe(false);
  w.spiel!.gesetze=[];setPolicy(w,'m_ausbildung',80);
  const p=krisenGesetzPlan(w,'m_ausbildung',10)!;expect(p.umsetzung).toBe(true);expect(p.moeglich).toBe(false);expect(p.ziel).toBeGreaterThanOrEqual(80);
});

test.each([false,true])('Beratung zeigt den echten %s-Entwurf statt eines neuen Angebots',regional=>{
  const w=welt();bringeEin(w,'m_ausbildung',83,regional?[6]:null,'gesetz');
  const p=krisenGesetzPlan(w,'m_ausbildung',10)!;
  const html=renderToStaticMarkup(<KrisenGesetzKarte world={w} plan={p} ausfuehren={()=>{}}/>);
  // Das Ziel des Entwurfs erscheint in der echten Einheit der Maßnahme (N9, Befund B-1), nicht als Indexstufe
  expect(html).toContain(t(regional?'n9.kg.regional':'n9.kg.landes',{ziel:stufenName('m_ausbildung',83)}));
  expect(html).not.toContain(t('kg.einbringen'));expect(html).not.toContain(t('kg.jahreskosten'));
});

test('Ausgeschöpftes Ziel und unbekannter Maßnahmenweg buchen nichts',()=>{
  const w=welt(),i=NET.index.get('m_mindestlohn')!;
  for(let p=0;p<PROVINCES;p++)w.net.values[i*PROVINCES+p]=100;
  w.net.targets.m_mindestlohn=100;const vor=save(w),plan=krisenGesetzPlan(w,'m_mindestlohn',20)!;
  expect(plan.moeglich).toBe(false);expect(bringeKrisenGesetzEin(w,plan).ok).toBe(false);
  expect(krisenGesetzPlan(w,'unbekannt' as never)).toBeUndefined();expect(krisenGesetzPlan(w,'m_mindestlohn',-10 as never)).toBeUndefined();expect(save(w)).toBe(vor);
});

test('Koalitionsbruch vor dem Votum wird trotz späterer Zusagenerfüllung gezeigt',()=>{
  const w=welt();w.date='2028-06-25';aktiveParteivorsitzende(w,'YENİ')[0]!.loyalitaet=19;
  const p=krisenGesetzPlan(w,'m_arbeitslosengeld',10)!;
  expect(p.vorVotumRisiken[0]?.sitze).toBe(120);expect(p.pruefung).toBe('2028-07-01');
  expect(renderToStaticMarkup(<KrisenGesetzKarte world={w} plan={p} ausfuehren={()=>{}}/>)).toContain('Schon vor dem Votum');
});

test('Dreimonatsvergleich beobachtet historische Indizes und verändert nichts',()=>{
  const w=welt();expect(krisenAlltag(w).every(x=>x.trend===null)).toBe(true);
  w.day=100;w.net.month=3;
  for(const id of ['lebenshaltung','realeinkommen','armut'])for(let p=0;p<PROVINCES;p++)w.net.history[0]![NET.index.get(id)!*PROVINCES+p]=10;
  const vor=save(w);for(const v of krisenAlltag(w))expect(v.trend).toBeCloseTo(v.wert-10,9);expect(save(w)).toBe(vor);
});

test.each(['de','en','tr'] as const)('%s: Texte, echte Vorschau, Behauptungsgrenzen und abgeschlossene Altstände',async sprache=>{
  await setzeSprache(sprache);const w=welt(),p=krisenGesetzPlan(w,'m_ausbildung',20)!;
  const html=renderToStaticMarkup(<KrisenGesetze world={w} geaendert={()=>{}}/>);
  expect(html).toContain(t('kg.m_ausbildung.titel'));expect(html).toContain(t('kg.keinVerlauf'));
  const karte=renderToStaticMarkup(<KrisenGesetzKarte world={w} plan={p} ausfuehren={()=>{}}/>);
  expect(karte).toContain(t('kg.finanzierung'));expect(karte).toContain(t('kg.m_ausbildung.preis'));expect(karte).toContain(t('kg.einbringen'));
  for(const [key,text]of Object.entries(katalogVon('de')).filter(([k])=>k.startsWith('kg.'))){
    expect(katalogVon(sprache)[key],key).toBeTruthy();expect(platzhalter(katalogVon(sprache)[key]!)).toEqual(platzhalter(text));
  }
});
