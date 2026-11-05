import {afterEach,expect,test} from 'vitest';
import {NET} from "../src/sim/modell";
import {renderToStaticMarkup} from 'react-dom/server';
import {advance,createWorld,save,load} from '../src/sim/world';
import {turkey2026} from '../src/sim/scenario';
import {startAfterElection,schnellProfil} from '../src/sim/prolog';
import {ressortAnliegenTag,ressortAntwortPlan,beantworteRessortAnliegen} from '../src/sim/ressortanliegen';
import {eigenVon,wertVon,AEMTER,HOCH_SCHLECHT} from '../src/sim/personen';
import {wirke} from '../src/sim/wirkung';
import {addDays} from '../src/sim/dates';
import {RessortAnliegenKarten,RessortFolgen,RessortAntwortKarte} from '../src/ui/minister/RessortAnliegen';
import {RessortTischkarten,anliegenAlsVorlage} from '../src/ui/schreibtisch/Tischkarte';
import {setzeSprache,t,katalogVon,platzhalter,zahl} from '../src/i18n';
import {fuehreGespraech} from '../src/sim/gespraeche';
import {setzePosten} from '../src/sim/haushalt';
import {haushaltZustand} from '../src/sim/wirtschaft';
function welt(ehrgeiz=30,faehigkeit=70){const w=createWorld(turkey2026,17);startAfterElection(w,{...schnellProfil(),buendnis:'YENİ'});w.day=100;w.date='2028-06-05';w.spiel!.kapital=100;w.spiel!.ereignisse=[];w.spiel!.gesetze=[];
 for(const f of w.spiel!.figuren)if(AEMTER[f.amt].regierungsamt){for(const id of AEMTER[f.amt].fach)wirke(w,id,(HOCH_SCHLECHT.has(id)?10:90)-wertVon(w,id));}
 const f=w.spiel!.figuren.find(f=>f.amt==='inneres'&&f.imAmt)!;f.loyalitaet=60;f.gespraech=-100;Object.assign(eigenVon(w,f),{ehrgeiz,faehigkeit,stil:'vorsichtig',groll:0});wirke(w,'kriminalitaet',90-wertVon(w,'kriminalitaet'));ressortAnliegenTag(w);return w;}
function tag(w:ReturnType<typeof welt>,n:number){w.day+=n;w.date=addDays(w.date,n);ressortAnliegenTag(w);}
const offene=(w:ReturnType<typeof welt>)=>w.spiel!.ministerfluss!.ressortAnliegen!.find(a=>a.amt==='inneres'&&a.status==='offen')!;
const person=(w:ReturnType<typeof welt>)=>w.spiel!.figuren.find(f=>f.amt==='inneres'&&f.imAmt)!;
function anliegen(ehr=30,fae=70){const w=welt(ehr,fae);tag(w,30);expect(offene(w)).toBeDefined();return w;}
afterEach(async()=>{await setzeSprache('de')});
test('anderweitiger Eingriff am selben Tag sperrt alte Ministerantwort vor jeder Buchung',()=>{const w=anliegen(),a=offene(w),p=ressortAntwortPlan(w,a.id,'reden')!;expect(setzePosten(w,'innere_sicherheit',1,true).ok).toBe(true);const s=save(w);expect(ressortAntwortPlan(w,a.id,'reden')!.ok).toBe(false);expect(beantworteRessortAnliegen(w,p).ok).toBe(false);expect(save(w)).toBe(s);});
test('entspannte Lage am selben Tag erzeugt keine unnötigen Ablehnungsfolgen',()=>{const w=anliegen(),a=offene(w),p=ressortAntwortPlan(w,a.id,'ablehnen')!;wirke(w,a.groesse,40-wertVon(w,a.groesse));const s=save(w);expect(ressortAntwortPlan(w,a.id,'ablehnen')!.ok).toBe(false);expect(beantworteRessortAnliegen(w,p).ok).toBe(false);expect(save(w)).toBe(s);});
test('Anliegen entsteht nach 30 Tagen ohne Öffnen der Akte, kein rückwirkender Altstand-Verfall',()=>{const w=welt();tag(w,29);expect(offene(w)).toBeUndefined();tag(w,1);const a=offene(w);expect(a.frist).toBe(w.day+14);expect(a.vorschlag).toBeDefined();const s=save(w);ressortAnliegenTag(w);expect(save(w)).toBe(s);});
test('unbeantwortet: Ressort verschlechtert sich und Minister verliert Rückhalt, nur einmal',()=>{const w=anliegen(),a=offene(w),f=person(w),vor=wertVon(w,a.groesse);tag(w,14);expect(a.status).toBe('eskaliert');expect(wertVon(w,a.groesse)).toBeCloseTo(vor+1.5);expect(f.loyalitaet).toBe(58);expect(f.eigen!.groll).toBe(3);const s=save(w);ressortAnliegenTag(w);expect(save(w)).toBe(s);});
test('ehrgeiziger fähiger Minister lindert das Problem auf eigene Faust, kostet Geld und Legitimität',()=>{const w=anliegen(80,75),a=offene(w),vor=wertVon(w,a.groesse),schulden=w.economy.debtRatio,leg=wertVon(w,'legitimitaet');tag(w,14);expect(wertVon(w,a.groesse)).toBeCloseTo(vor-1.2);expect(w.economy.debtRatio-schulden).toBeCloseTo(0.01);expect(wertVon(w,'legitimitaet')).toBeCloseTo(leg-0.3);expect(w.spiel!.gesetze).toHaveLength(0);expect(w.spiel!.ministerfluss!.ressortFolgen!.at(-1)!.art).toBe('eigeninitiative');});
test('ehrgeiziger fachlich schwacher Alleingang verschlechtert statt zu heilen',()=>{const w=anliegen(80,40),a=offene(w),vor=wertVon(w,a.groesse);tag(w,14);expect(wertVon(w,a.groesse)).toBeCloseTo(vor+0.8);expect(w.economy.debtRatio).toBeGreaterThan(0);});
test('Ablehnung hat sofort Beziehungskosten, Fristablauf bestraft nicht ein zweites Mal',()=>{const w=anliegen(),a=offene(w),p=ressortAntwortPlan(w,a.id,'ablehnen')!;expect(p.ok).toBe(true);expect(p.folge!.loyalitaet).toBe(-3);expect(p.folge!.groll).toBe(5);beantworteRessortAnliegen(w,p);expect(person(w).loyalitaet).toBe(57);tag(w,14);expect(person(w).loyalitaet).toBe(57);expect(person(w).eigen!.groll).toBe(5);expect(a.status).toBe('eskaliert');});
test('Gespräch führt echte Szene aus und verschiebt Sachfrist; kein kostenloser Ressorteffekt',()=>{const w=anliegen(),a=offene(w),vor=wertVon(w,a.groesse),s=save(w),p=ressortAntwortPlan(w,a.id,'reden')!;expect(save(w)).toBe(s);expect(p.ok).toBe(true);const r=beantworteRessortAnliegen(w,p);expect(r.ok).toBe(true);expect('dialog' in r&&r.dialog?.length).toBeGreaterThan(0);expect(a.status).toBe('besprochen');expect(a.frist).toBe(w.day+21);expect(wertVon(w,a.groesse)).toBe(vor);expect(person(w).loyalitaet).toBe(62);tag(w,21);expect(a.status).toBe('eskaliert');});
test('einmaliger Aufschub besitzt Preis, keine unendliche Fristverlängerung',()=>{const w=anliegen(),a=offene(w),frist=a.frist,p=ressortAntwortPlan(w,a.id,'spaeter')!;beantworteRessortAnliegen(w,p);expect(a.frist).toBe(frist+7);expect(person(w).loyalitaet).toBe(59);expect(ressortAntwortPlan(w,a.id,'spaeter')!.ok).toBe(false);});
test('Ablehnung kann vor Frist durch Gespräch korrigiert werden; alte Antworten buchen nichts',()=>{const w=anliegen(),a=offene(w),alt=ressortAntwortPlan(w,a.id,'reden')!;beantworteRessortAnliegen(w,ressortAntwortPlan(w,a.id,'ablehnen')!);const s=save(w);expect(beantworteRessortAnliegen(w,alt).ok).toBe(false);expect(save(w)).toBe(s);expect(beantworteRessortAnliegen(w,ressortAntwortPlan(w,a.id,'reden')!).ok).toBe(true);});
test('Ministerwechsel erledigt altes Anliegen ohne den Nachfolger zu bestrafen',()=>{const w=anliegen(),a=offene(w),f=person(w);f.imAmt=false;const n={...structuredClone(f),id:'neuer-minister',name:'Nachfolger',imAmt:true,loyalitaet:77};w.spiel!.figuren.push(n);tag(w,14);expect(a.status).toBe('entfallen');expect(n.loyalitaet).toBe(77);expect(w.spiel!.ministerfluss!.ressortFolgen!.at(-1)!.loyalitaet).toBe(0);});
test('anderweitiger fachlicher Eingriff und Entspannung stoppen den angekündigten Verfall',()=>{const w=anliegen(),a=offene(w);setzePosten(w,'innere_sicherheit',1,true);tag(w,1);expect(a.status).toBe('erledigt');expect(w.spiel!.ministerfluss!.ressortFolgen!.at(-1)!.art).toBe('bearbeitet');const x=anliegen(),b=offene(x);wirke(x,b.groesse,40-wertVon(x,b.groesse));tag(x,14);expect(b.status).toBe('erledigt');expect(person(x).loyalitaet).toBe(60);});
test('vorhandenes Gespräch außerhalb der Karte zählt, fachliche Zusage bleibt offen',()=>{const w=anliegen(),a=offene(w);expect(fuehreGespraech(w,a.figur,'sorge','rat').ok).toBe(true);tag(w,1);expect(a.status).toBe('besprochen');expect(a.frist).toBe(w.day+21);});
test('Annahme bringt echten Gesetzentwurf ein und zeigt dieselbe Mehrheit und Kosten',()=>{const w=anliegen(),a=offene(w),p=ressortAntwortPlan(w,a.id,'umsetzen')!,pk=w.spiel!.kapital;expect(p.ok).toBe(true);expect(p.gesetz).toBeDefined();expect(beantworteRessortAnliegen(w,p).ok).toBe(true);expect(w.spiel!.kapital).toBe(pk-p.pk);expect(w.spiel!.gesetze).toHaveLength(1);expect(a.status).toBe('beauftragt');});
test('tatsächlicher Tageslauf führt fälliges Ressortanliegen ohne UI aus; Speichern/Laden bleibt stabil',()=>{const w=anliegen(),a=offene(w);w.day=a.frist-1;w.date='2028-06-15';const neu=load(save(w)),vor=person(neu).loyalitaet;advance(neu,1);expect(neu.spiel!.ministerfluss!.ressortAnliegen!.find(x=>x.id===a.id)!.status).toBe('eskaliert');expect(person(neu).loyalitaet).toBe(vor-2);expect(neu.spiel!.ministerfluss!.ressortFolgen!.some(f=>f.id===a.id&&f.art==='stillstand')).toBe(true);});
test.each(['de','en','tr'] as const)('Ministerkarten und belegte Folgen auf %s ohne Zustandsänderung',async lang=>{await setzeSprache(lang);const w=anliegen(),s=save(w),html=renderToStaticMarkup(<RessortAnliegenKarten world={w} refresh={()=>{}}/>);expect(html).toContain(t('ra.titel'));expect(html).toContain(t('ra.ohneStill'));expect(html).not.toContain('⟦');expect(save(w)).toBe(s);tag(w,14);const h=renderToStaticMarkup(<RessortFolgen folgen={w.spiel!.ministerfluss!.ressortFolgen!}/>);expect(h).toContain(t('ra.art.stillstand'));for(const k of Object.keys(katalogVon('de')).filter(k=>k.startsWith('ra.')||k.startsWith('hh.')))expect(platzhalter(katalogVon(lang)[k]!)).toEqual(platzhalter(katalogVon('de')[k]!));});

test('laufendes Haushaltsverfahren zählt als Bearbeitung des betroffenen Ressorts',()=>{const w=anliegen(),a=offene(w);haushaltZustand(w).gesetz={jahr:2028,eingebracht:w.day,abstimmung:w.day+14,absprachen:0,schritte:{innere_sicherheit:1}} as any;tag(w,1);expect(a.status).toBe('erledigt');expect(person(w).loyalitaet).toBe(60);});
test('laufendes Versorgungsprogramm verhindert neue Vernachlässigungsanfrage im Wirtschaftsressort',async()=>{const {beschliesseVersorgungsProgramm}=await import('../src/sim/versorgungspolitik');const w=welt();wirke(w,'industrie',5-wertVon(w,'industrie'));tag(w,29);expect(beschliesseVersorgungsProgramm(w,'schutz').ok).toBe(true);tag(w,2);expect(w.spiel!.ministerfluss!.ressortAnliegen!.some(a=>a.amt==='wirtschaft')).toBe(false);});
test('Wirtschaftsminister schlägt reale Haushaltskorrektur vor; Preis und Legitimität landen im Rückblick',async()=>{
 const {beginneHaushaltsBeleg,schliesseHaushaltsBeleg,haushaltsMonatsabschluss}=await import('../src/sim/haushaltsbericht');
 const w=welt();wirke(w,'industrie',3-wertVon(w,'industrie'));w.date='2028-11-02';
 const b=beginneHaushaltsBeleg(w,{jahr:2028,eingebracht:90,abstimmung:99,absprachen:0,schritte:{landwirtschaft:-2}} as any,400);setzePosten(w,'landwirtschaft',-2,true);schliesseHaushaltsBeleg(w,b);
 tag(w,1);tag(w,30);const a=w.spiel!.ministerfluss!.ressortAnliegen!.find(a=>a.amt==='wirtschaft'&&a.status==='offen')!;expect(a.vorschlag?.art).toBe('haushalt');
 const p=ressortAntwortPlan(w,a.id,'umsetzen')!;expect(p.ok).toBe(true);expect(p.pk).toBe(4);expect(p.folge!.legitimitaet).toBeCloseTo(-0.4);expect(p.folge!.defizit).toBeGreaterThan(0);
 const pk=w.spiel!.kapital;expect(beantworteRessortAnliegen(w,p).ok).toBe(true);expect(w.spiel!.kapital).toBe(pk-4);expect(w.spiel!.wirtschaft!.haushalt.stufen.landwirtschaft??0).toBe(0);
 haushaltsMonatsabschluss(w);const m=w.spiel!.wirtschaft!.haushalt.monatsberichte!.at(-1)!;expect(m.ressort!.some(f=>f.id===a.id&&f.pk===4)).toBe(true);const hist=JSON.stringify(m);tag(w,1);expect(JSON.stringify(m)).toBe(hist);
});

// Jede neue Antwortansicht muss denselben Preis und dieselbe Frist wie die echte Handlung vor dem Klick zeigen.
test.each(['de','en','tr'] as const)('ausgewählte Ministerantworten auf %s zeigen Kosten und Frist ohne Buchung',async lang=>{
 await setzeSprache(lang);const w=anliegen(),a=offene(w),s=save(w);
 for(const art of ['reden','umsetzen','spaeter','ablehnen'] as const){
  const p=ressortAntwortPlan(w,a.id,art)!;expect(p.ok).toBe(true);
  const html=renderToStaticMarkup(<RessortAntwortKarte world={w} p={p} onAntwort={()=>{throw new Error('Anzeige darf nichts buchen')}}/>);
  expect(html).not.toContain('⟦');expect(html).not.toContain('NaN');
  const vorAktion=html.slice(0,html.indexOf('<footer>'));
  expect(vorAktion).toContain(t('ve.pk',{n:zahl(p.pk,1)}));
  expect(vorAktion).toContain(t('eo.punkte',{n:zahl(p.aufmerksamkeit,0)}));
  expect(vorAktion).toContain(t('eo.frist'));
  if(p.gesetz)expect(vorAktion).toContain(t('eo.gesetzStimmen',{n:p.gesetz.ja}));
 }
 expect(save(w)).toBe(s);
});
test('Gedächtnis (Suzerain): eine Ablehnung bleibt in Erinnerung und steht auf der nächsten Karte desselben Ministers',()=>{
 const w=anliegen(),a=offene(w);beantworteRessortAnliegen(w,ressortAntwortPlan(w,a.id,'ablehnen')!);
 expect(person(w).eigen!.erinnerung.at(-1)!.text).toBe(t('ra.merke.ablehnen',{groesse:NET.nodes[NET.index.get(a.groesse)!]!.name}));
 tag(w,14);tag(w,30);const neu=w.spiel!.ministerfluss!.ressortAnliegen!.find(x=>x.amt==='inneres'&&x.status==='offen'&&x.id!==a.id);
 if(neu){const html=renderToStaticMarkup(<RessortAnliegenKarten world={w} refresh={()=>{}}/>);expect(html).toContain('ra-gedaechtnis');}
});
// Schreibtisch (05.11.2026): Anliegen erscheinen als dieselbe Vorlagenkarte wie Ereignisse; Wege und Preise aus den Plänen, Anzeige ändert nichts
test.each(['de','en','tr'] as const)('Tischkarte des Anliegens auf %s: vier Wege mit Preis, ohne Zustandsänderung',async lang=>{
 await setzeSprache(lang);const w=anliegen(),s=save(w);
 const html=renderToStaticMarkup(<RessortTischkarten world={w} refresh={()=>{}} amt="inneres"/>);
 expect(save(w)).toBe(s);
 expect(html).toContain('mf-karte');
 for(const art of ['reden','umsetzen','ablehnen'] as const)expect(html).toContain(t(`ra.art.${art}`));
 expect(html).toContain(t('ra.art.spaeter'));
 const a=offene(w),v=anliegenAlsVorlage(w,a,(['reden','umsetzen','spaeter','ablehnen'] as const).flatMap(x=>{const p=ressortAntwortPlan(w,a.id,x);return p?[p]:[];}))!;
 const plan=ressortAntwortPlan(w,a.id,'umsetzen')!;
 expect(v.optionen.find(o=>o.id==='umsetzen')!.kosten.pk).toBe(Math.max(0,plan.pk));
});
