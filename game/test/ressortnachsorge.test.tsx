import {afterEach,expect,test} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {createWorld,advance,save,load} from '../src/sim/world';
import {turkey2026} from '../src/sim/scenario';
import {startAfterElection,schnellProfil} from '../src/sim/prolog';
import {ressortAnliegenTag,ressortAntwortPlan,beantworteRessortAnliegen,RESSORT_ANLIEGEN} from '../src/sim/ressortanliegen';
import {ressortPolitikPlan,entscheideRessortVorfall,type RessortReaktion} from '../src/sim/ressortpolitik';
import {ressortNachsorgeTag,aktiveRessortNachsorge,beginneRessortNachsorge} from '../src/sim/ressortnachsorge';
import {AEMTER,HOCH_SCHLECHT,eigenVon,wertVon} from '../src/sim/personen';
import {wirke} from '../src/sim/wirkung';
import {addDays} from '../src/sim/dates';
import {besetzeNeu} from '../src/sim/figuren';
import {entlasse} from '../src/sim/nachfolge';
import {RessortErholung,RessortErholungsVerlauf} from '../src/ui/minister/RessortErholung';
import {RessortAnliegenKarten} from '../src/ui/minister/RessortAnliegen';
import {beginneHaushaltsBeleg,schliesseHaushaltsBeleg} from '../src/sim/haushaltsbericht';
import {setzeSprache,t,katalogVon,platzhalter} from '../src/i18n';
import type {Figur} from '../src/sim/spiel-typen';
function welt(amt:Figur['amt']='inneres'){
 const w=createWorld(turkey2026,17);startAfterElection(w,{...schnellProfil(),buendnis:'YENİ'});
 w.day=100;w.date='2028-05-04';w.spiel!.kapital=100;w.spiel!.ereignisse=[];w.spiel!.gesetze=[];w.spiel!.zusagen=[];
 for(const f of w.spiel!.figuren){const e=eigenVon(w,f);e.groll=0;f.loyalitaet=60;if(AEMTER[f.amt].regierungsamt)for(const id of AEMTER[f.amt].fach)wert(w,id,HOCH_SCHLECHT.has(id)?10:90);}
 const f=w.spiel!.figuren.find(f=>f.amt===amt&&f.imAmt)!;f.partei='YENİ';f.gespraech=-100;Object.assign(eigenVon(w,f),{ehrgeiz:30,faehigkeit:70,stil:'vorsichtig',groll:0});
 wert(w,amt==='wirtschaft'?'industrie':'kriminalitaet',amt==='wirtschaft'?5:90);ressortAnliegenTag(w);
 zeit(w,30);ressortAnliegenTag(w);zeit(w,14);ressortAnliegenTag(w);expect(w.spiel!.ministerfluss!.ressortVorfaelle!.at(-1)!.amt).toBe(amt);return w;
}
type W=ReturnType<typeof welt>;
function wert(w:W,id:string,n:number){wirke(w,id,n-wertVon(w,id));}
function zeit(w:W,n:number){w.day+=n;w.date=addDays(w.date,n);}
function meldung(w:W,n=14){zeit(w,n);ressortNachsorgeTag(w);}
const v=(w:W)=>w.spiel!.ministerfluss!.ressortVorfaelle!.at(-1)!;
const spur=(w:W)=>aktiveRessortNachsorge(w)[0]!;
const letzte=(w:W)=>spur(w).meldungen.at(-1)!;
function entscheide(w:W,art:RessortReaktion='stuetzen'){const p=ressortPolitikPlan(w,v(w).id,art)!;expect(p.ok).toBe(true);expect(entscheideRessortVorfall(w,p).ok).toBe(true);return w;}
afterEach(async()=>{await setzeSprache('de')});

test.each(['stuetzen','zurueckpfeifen','entlassen'] as const)('%s startet Messreihe mit echtem Entscheidungswert und aktuellem Amtsinhaber',art=>{
 const w=welt();wert(w,'kriminalitaet',85);const vorher=save(w);ressortPolitikPlan(w,v(w).id,art);expect(save(w)).toBe(vorher);entscheide(w,art);
 const n=spur(w);expect(n.ausgang).toBeCloseTo(85);expect(n.naechsteMeldung).toBe(w.day+14);expect(n.meldungen).toEqual([]);expect(n.verantwortlich.name).toBe(w.spiel!.figuren.find(f=>f.amt==='inneres'&&f.imAmt)!.name);expect(n.nachgetragen).toBe(false);
});
test('erster Bericht erst nach 14 Tagen, Tageshaken und Start wiederholbar ohne Doppelmeldung',()=>{
 const w=entscheide(welt());const id=spur(w).id;beginneRessortNachsorge(w,v(w));expect(aktiveRessortNachsorge(w)).toHaveLength(1);meldung(w,13);expect(spur(w).meldungen).toHaveLength(0);meldung(w,1);expect(spur(w).meldungen).toHaveLength(1);const s=save(w);ressortNachsorgeTag(w);expect(save(w)).toBe(s);expect(spur(w).id).toBe(id);
});
test('Fortschritt bleibt bei hoher Belastung kritisch, Nachhaken erzeugt echten Vorschlag ohne kostenlose Wirkung',()=>{
 const w=entscheide(welt());wert(w,'kriminalitaet',80);const pk=w.spiel!.kapital,loy=w.spiel!.figuren.filter(f=>f.amt!=='partner').map(f=>f.loyalitaet),z=JSON.stringify(w.spiel!.zusagen);meldung(w);
 const m=letzte(w);expect(m.entwicklung).toBe('fortschritt');expect(m.kritisch).toBe(true);expect(m.vorschlag?.art).toBe('gesetz');expect(m.schritt).toBe('anliegen');expect(m.frist).toBe(w.day+14);expect(w.spiel!.kapital).toBe(pk);expect(w.spiel!.figuren.filter(f=>f.amt!=='partner').map(f=>f.loyalitaet)).toEqual(loy);expect(m.politik?.urteil).toBe('fortschritt');expect(JSON.stringify(w.spiel!.zusagen)).toBe(z);expect(wertVon(w,'kriminalitaet')).toBeCloseTo(80);
 const a=w.spiel!.ministerfluss!.ressortAnliegen!.find(a=>a.id===m.anliegen)!;expect(a.nachsorge).toBe(spur(w).id);
 const p=ressortAntwortPlan(w,a.id,'umsetzen')!;expect(p.ok).toBe(true);expect(p.gesetz).toBeDefined();expect(beantworteRessortAnliegen(w,p).ok).toBe(true);expect(w.spiel!.kapital).toBe(pk-p.pk);expect(w.spiel!.gesetze).toHaveLength(1);expect(spur(w).status).toBe('beobachtung');
});
test('niedrige und hohe gute Werte werden in der richtigen Richtung bewertet',()=>{
 const w=entscheide(welt('wirtschaft'));wert(w,'industrie',8);meldung(w);expect(letzte(w).entwicklung).toBe('fortschritt');wert(w,'industrie',6);meldung(w);expect(letzte(w).entwicklung).toBe('rueckschlag');
});
test.each([[1,'fortschritt'],[0.99,'unveraendert'],[-1,'rueckschlag'],[-0.99,'unveraendert']] as const)('exakte Messschwelle %s ohne Rundungsentscheidung ergibt %s',(delta,art)=>{
 const w=entscheide(welt());wert(w,'kriminalitaet',spur(w).ausgang-delta);meldung(w);expect(letzte(w).entwicklung).toBe(art);
});
test('Entwarnung braucht zwei Meldungen; beobachtet anschließend monatlich und erkennt Rückfall',()=>{
 const w=entscheide(welt());wert(w,'kriminalitaet',62);meldung(w);expect(letzte(w).entwicklung).toBe('entspannt');expect(spur(w).status).toBe('beobachtung');expect(letzte(w).anliegen).toBeUndefined();
 meldung(w);expect(letzte(w).entwicklung).toBe('stabilisiert');expect(spur(w).naechsteMeldung).toBe(w.day+30);wert(w,'kriminalitaet',70);meldung(w,29);expect(spur(w).meldungen).toHaveLength(2);meldung(w,1);expect(letzte(w).entwicklung).toBe('rueckfall');expect(letzte(w).schritt).toBe('anliegen');expect(spur(w).naechsteMeldung).toBe(w.day+14);
});
test.each([['inneres','kriminalitaet',62,false],['inneres','kriminalitaet',62.001,true],['wirtschaft','industrie',38,false],['wirtschaft','industrie',37.999,true]] as const)('Entwarnungsgrenze für %s bei %s=%s exakt', (amt,id,n,krise)=>{
 const w=entscheide(welt(amt));wert(w,id,n);meldung(w);expect(letzte(w).kritisch).toBe(krise);
});
test('laufendes Verfahren ist keine Erholung und erzeugt keinen doppelten Gesetzentwurf',()=>{
 const w=entscheide(welt());meldung(w);const a=letzte(w).anliegen!;beantworteRessortAnliegen(w,ressortAntwortPlan(w,a,'umsetzen')!);wert(w,'kriminalitaet',95);meldung(w);
 expect(letzte(w).entwicklung).toBe('rueckschlag');expect(letzte(w).schritt).toBe('bearbeitung');expect(letzte(w).anliegen).toBeUndefined();expect(w.spiel!.gesetze).toHaveLength(1);expect(spur(w).status).toBe('beobachtung');
 // Seit 07.11.2026 fragt das Ressort nach einer Antwort 90 Tage nicht wieder nach derselben Größe (RESSORT_ANLIEGEN.pause)
 w.spiel!.gesetze=[];meldung(w);expect(letzte(w).schritt).toBe('warteschlange');meldung(w,RESSORT_ANLIEGEN.pause);expect(letzte(w).schritt).toBe('anliegen');expect(letzte(w).anliegen).not.toBe(a);expect(letzte(w).vorschlag).toBeDefined();
});
test('bestehendes Anliegen wird verwendet, nicht dupliziert oder kostenlos verlängert',()=>{
 const w=entscheide(welt());meldung(w);const m=letzte(w),a=w.spiel!.ministerfluss!.ressortAnliegen!.find(a=>a.id===m.anliegen)!;const frist=a.frist;meldung(w);
 expect(letzte(w).anliegen).toBe(a.id);expect(a.frist).toBe(frist);expect(w.spiel!.ministerfluss!.ressortAnliegen!.filter(a=>['offen','besprochen'].includes(a.status))).toHaveLength(1);
});
test('unbeantwortetes Nachhaken folgt den echten Eskalationsregeln ohne zweite Messstrafe',()=>{
 const w=entscheide(welt());meldung(w);const id=letzte(w).anliegen!,f=w.spiel!.figuren.find(f=>f.amt==='inneres'&&f.imAmt)!,loy=f.loyalitaet;
 zeit(w,14);ressortAnliegenTag(w);const wertNach=wertVon(w,'kriminalitaet'),kap=w.spiel!.kapital;ressortNachsorgeTag(w);
 expect(f.loyalitaet).toBe(loy-2);expect(letzte(w).schritt).toBe('verantwortung');expect(wertVon(w,'kriminalitaet')).toBe(wertNach);expect(w.spiel!.kapital).toBe(kap);expect(v(w).id).toBe(id);
});
test('Gespräch zur Folgemeldung führt reale Szene, Frist und Beziehungspreis; Messreihe bleibt offen',()=>{
 const w=entscheide(welt());meldung(w);const p=ressortAntwortPlan(w,letzte(w).anliegen!,'reden')!;const r=beantworteRessortAnliegen(w,p);expect(r.ok).toBe(true);expect('dialog' in r&&r.dialog!.length).toBeGreaterThan(0);expect(spur(w).status).toBe('beobachtung');expect(w.spiel!.ministerfluss!.ressortAnliegen!.find(a=>a.id===p.id)!.frist).toBe(w.day+21);
});
test('Nachfolger berichtet unter eigenem Namen, ohne Ausgang oder frühere Meldungen umzuschreiben',()=>{
 const w=entscheide(welt());meldung(w);const n=spur(w),hist=JSON.stringify(n.meldungen[0]),alt=n.verantwortlich.name;const f=w.spiel!.figuren.find(f=>f.amt===n.amt&&f.imAmt)!;besetzeNeu(w,f,{name:'Neue Leitung',loyalitaet:55});zeit(w,14);ressortAnliegenTag(w);ressortNachsorgeTag(w);
 expect(letzte(w).name).toBe('Neue Leitung');expect(letzte(w).wechsel).toBe(alt);expect(JSON.stringify(n.meldungen[0])).toBe(hist);expect(n.ausgang).toBeCloseTo(91.5);
});
test('ohne Amtsinhaber keine Meldung im Namen des Vorgängers; nach Besetzung Messung fortsetzen',()=>{
 const w=entscheide(welt()),f=w.spiel!.figuren.find(f=>f.amt==='inneres'&&f.imAmt)!;f.imAmt=false;meldung(w);expect(spur(w).meldungen).toHaveLength(0);expect(renderToStaticMarkup(<RessortErholung world={w}/>)).toContain(t('rn.unbesetzt'));f.imAmt=true;meldung(w,1);expect(spur(w).meldungen).toHaveLength(1);
});
test('erneute Entscheidung startet neue Baseline, alte Messreihe bleibt unverändert erhalten',()=>{
 const w=entscheide(welt());meldung(w);const alt=spur(w),hist=JSON.stringify(alt.meldungen);zeit(w,14);ressortAnliegenTag(w);entscheide(w,'zurueckpfeifen');expect(alt.status).toBe('abgeloest');expect(spur(w).id).not.toBe(alt.id);expect(JSON.stringify(alt.meldungen)).toBe(hist);expect(aktiveRessortNachsorge(w)).toHaveLength(1);
});
test('Entlassung aus der Personenakte startet ebenfalls Nachverfolgung',()=>{
 const w=welt();expect(entlasse(w,'inneres',null).ok).toBe(true);expect(spur(w).entscheidung).toBe('entlassen');expect(spur(w).verantwortlich.name).toBe(w.spiel!.figuren.find(f=>f.amt==='inneres'&&f.imAmt)!.name);
});
test('Speichern/Laden erhält Termin und Berichte; alte Entscheidungen starten heute ohne rückwirkende Messung',()=>{
 const w=entscheide(welt());meldung(w);const k=load(save(w));expect(spur(k)).toEqual(spur(w));const s=save(k);ressortNachsorgeTag(k);expect(save(k)).toBe(s);
 delete k.spiel!.ministerfluss!.ressortNachsorge;delete v(k).nachsorgeBegonnen;delete k.spiel!.ministerfluss!.ressortNachsorgeTag;wert(k,'kriminalitaet',75);ressortNachsorgeTag(k);expect(spur(k).ausgang).toBeCloseTo(75);expect(spur(k).nachgetragen).toBe(true);expect(spur(k).meldungen).toEqual([]);expect(spur(k).naechsteMeldung).toBe(k.day+14);
});
test('echter Tageslauf erfasst Monatswerte nach Ressortwirkung und speichert unveränderlichen Bericht',()=>{
 const w=entscheide(welt());expect(w.date).toBe('2028-06-17');const b=beginneHaushaltsBeleg(w,{jahr:2028,eingebracht:90,abstimmung:w.day,absprachen:0,schritte:{}},400);schliesseHaushaltsBeleg(w,b);advance(w,14);
 expect(w.date).toBe('2028-07-01');expect(letzte(w).tag).toBe(w.day);expect(letzte(w).wert).toBeCloseTo(wertVon(w,'kriminalitaet'));
 const m=w.spiel!.wirtschaft!.haushalt.monatsberichte!.at(-1)!;expect(m.ressortnachsorge![0]!.meldungen.at(-1)!.wert).toBe(letzte(w).wert);const hist=JSON.stringify(m);wert(w,'kriminalitaet',30);advance(w,14);expect(JSON.stringify(m)).toBe(hist);
});
test('Berichtshistorie bleibt begrenzt, ohne erfundene Zwischenmessungen bei Zeitsprung',()=>{
 const w=entscheide(welt());wert(w,'kriminalitaet',40);meldung(w,90);expect(spur(w).meldungen).toHaveLength(1);for(let i=0;i<12;i++)meldung(w,30);expect(spur(w).meldungen).toHaveLength(8);
});
test.each(['de','en','tr'] as const)('Fortschrittskarten, Vorschlagszugang und Monatsrückblick auf %s sind zustandsneutral',async lang=>{
 await setzeSprache(lang);const w=entscheide(welt());wert(w,'kriminalitaet',80);meldung(w);const s=save(w);const h=renderToStaticMarkup(<RessortAnliegenKarten world={w} refresh={()=>{}}/>);expect(h).toContain(t('rn.titel'));expect(h).toContain(t('rn.status.fortschritt'));expect(h).toContain(t('rn.antworten'));expect(h).toContain(`id="ressort-anliegen-${letzte(w).anliegen}"`);expect(h).not.toContain('⟦');expect(save(w)).toBe(s);
 const r=renderToStaticMarkup(<RessortErholungsVerlauf beobachtungen={aktiveRessortNachsorge(w)}/>);expect(r).toContain(t('rn.historisch'));expect(r).not.toContain('⟦');expect(save(w)).toBe(s);
 for(const k of Object.keys(katalogVon('de')).filter(k=>k.startsWith('rn.')))expect(platzhalter(katalogVon(lang)[k]!)).toEqual(platzhalter(katalogVon('de')[k]!));
});

test('Entspannung einer Größe verdeckt kein anderes Ressortproblem; Vorschlag greift neues Problem auf',()=>{
 const w=entscheide(welt());wert(w,'kriminalitaet',40);wert(w,'terrorgefahr',80);meldung(w);
 expect(letzte(w).entwicklung).toBe('teilErholt');expect(letzte(w).zielKritisch).toBe(false);expect(letzte(w).kritisch).toBe(true);expect(letzte(w).weitereProbleme).toEqual([{groesse:'terrorgefahr',wert:expect.closeTo(80)}]);
 const a=w.spiel!.ministerfluss!.ressortAnliegen!.find(a=>a.id===letzte(w).anliegen)!;expect(a.groesse).toBe('terrorgefahr');expect(a.vorschlag).toBeDefined();expect(spur(w).naechsteMeldung).toBe(w.day+14);
 meldung(w);expect(spur(w).status).toBe('beobachtung');wert(w,'terrorgefahr',40);meldung(w);expect(letzte(w).entwicklung).toBe('entspannt');meldung(w);expect(letzte(w).entwicklung).toBe('stabilisiert');
});
test('volle Anliegenliste wird erklärt; keine vierte Anfrage und keine zusätzliche Strafe',()=>{
 const w=entscheide(welt());const z=w.spiel!.ministerfluss!,basis=z.ressortAnliegen![0]!;
 for(const amt of ['wirtschaft','justiz','aussen'] as const){const f=w.spiel!.figuren.find(f=>f.amt===amt&&f.imAmt)!;z.ressortAnliegen!.push({...structuredClone(basis),id:'offen-'+amt,amt,figur:f.id,name:f.name,amtsantritt:f.eigen!.seit,status:'offen',frist:w.day+20});}
 const pk=w.spiel!.kapital;meldung(w);expect(letzte(w).schritt).toBe('warteschlange');expect(z.ressortAnliegen!.filter(a=>a.status==='offen')).toHaveLength(3);expect(w.spiel!.kapital).toBe(pk);
 z.ressortAnliegen!.find(a=>a.id==='offen-justiz')!.status='erledigt';meldung(w);expect(letzte(w).schritt).toBe('anliegen');
});
test('Anzeige einer angenommenen Folgevorlage nennt Bearbeitung und behauptet keine Erholung',()=>{
 const w=entscheide(welt());meldung(w);const id=letzte(w).anliegen!;beantworteRessortAnliegen(w,ressortAntwortPlan(w,id,'umsetzen')!);const h=renderToStaticMarkup(<RessortErholung world={w} anliegenVorOrt/>);
 expect(h).toContain(t('rn.anliegen.beauftragt'));expect(h).not.toContain(`href="#ressort-anliegen-${id}"`);expect(h).not.toContain(t('rn.status.stabilisiert'));
});
test('Annahme einer Folgevorlage und echte weitere Tage berichten gemessenen Stand statt automatischem Erfolg',()=>{
 const w=entscheide(welt());meldung(w);const id=letzte(w).anliegen!,p=ressortAntwortPlan(w,id,'umsetzen')!;beantworteRessortAnliegen(w,p);const ausgang=spur(w).ausgang;
 advance(w,14);expect(letzte(w).tag).toBe(w.day);expect(letzte(w).wert).toBeCloseTo(wertVon(w,spur(w).groesse));expect(spur(w).ausgang).toBe(ausgang);
 if(letzte(w).kritisch)expect(spur(w).status).not.toBe('stabilisiert');
});
