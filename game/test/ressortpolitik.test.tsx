import {afterEach,expect,test} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {createWorld,advance,save,load} from '../src/sim/world';
import {turkey2026} from '../src/sim/scenario';
import {startAfterElection,schnellProfil} from '../src/sim/prolog';
import {ressortAnliegenTag,ressortEigenart,ressortAntwortPlan} from '../src/sim/ressortanliegen';
import {offeneRessortVorfaelle,ressortPolitikPlan,entscheideRessortVorfall,erfasseRessortVorfall,type RessortReaktion} from '../src/sim/ressortpolitik';
import {AEMTER,HOCH_SCHLECHT,eigenVon,wertVon} from '../src/sim/personen';
import {personenMonat} from '../src/sim/personen-monat';
import {wirke} from '../src/sim/wirkung';
import {addDays} from '../src/sim/dates';
import {entlasse,entlassungsFolgen,kandidatenFuer} from '../src/sim/nachfolge';
import {umbildungSicht,umbildungEntlassen,umbildungErsetzen} from '../src/sim/amtszeit';
import {besetzeNeu} from '../src/sim/figuren';
import {fraktion} from '../src/sim/fraktionen';
import {oppositionVon} from '../src/sim/opposition';
import {regierungsSitze} from '../src/sim/koalitionslage';
import {beginneHaushaltsBeleg,schliesseHaushaltsBeleg,haushaltsMonatsabschluss} from '../src/sim/haushaltsbericht';
import {RessortVerantwortung,RessortReaktionsOption,RessortPolitikVerlauf} from '../src/ui/minister/RessortVerantwortung';
import {setzeSprache,t,katalogVon,platzhalter} from '../src/i18n';
function welt(ehrgeiz=30,faehigkeit=70){
 const w=createWorld(turkey2026,17);startAfterElection(w,{...schnellProfil(),buendnis:'YENİ'});
 w.day=100;w.date='2028-05-17';w.spiel!.kapital=100;w.spiel!.ereignisse=[];w.spiel!.gesetze=[];w.spiel!.zusagen=[];
 w.spiel!.lager=['YENİ'];w.parliament!.seats={[w.player!.partei.kurz]:200,'YENİ':120,CHP:150,MHP:90,DEM:40};
 for(const f of w.spiel!.figuren){const e=eigenVon(w,f);e.groll=0;f.loyalitaet=60;if(AEMTER[f.amt].regierungsamt)for(const id of AEMTER[f.amt].fach)wirke(w,id,(HOCH_SCHLECHT.has(id)?10:90)-wertVon(w,id));}
 const f=minister(w);f.partei='YENİ';f.gespraech=-100;Object.assign(eigenVon(w,f),{ehrgeiz,faehigkeit,stil:'vorsichtig',groll:0});vorsitz(w).loyalitaet=40;
 for(const p of ['YENİ','CHP','MHP','DEM'])fraktion(w,p).bereitschaft=50;
 oppositionVon(w).staerke=50;wirke(w,'kriminalitaet',90-wertVon(w,'kriminalitaet'));ressortAnliegenTag(w);return w;
}
function minister(w:ReturnType<typeof createWorld>){return w.spiel!.figuren.find(f=>f.amt==='inneres'&&f.imAmt)!;}
function vorsitz(w:ReturnType<typeof createWorld>){return w.spiel!.figuren.find(f=>f.amt==='partner'&&f.partei==='YENİ'&&f.imAmt)!;}
function tag(w:ReturnType<typeof createWorld>,n:number){w.day+=n;w.date=addDays(w.date,n);ressortAnliegenTag(w);}
function fall(ehr=30,fae=70){const w=welt(ehr,fae);tag(w,30);tag(w,14);expect(offeneRessortVorfaelle(w)).toHaveLength(1);return w;}
const vorfall=(w:ReturnType<typeof createWorld>)=>w.spiel!.ministerfluss!.ressortVorfaelle!.at(-1)!;
const plan=(w:ReturnType<typeof createWorld>,art:RessortReaktion)=>ressortPolitikPlan(w,vorfall(w).id,art)!;
afterEach(async()=>{await setzeSprache('de')});

test('Ressortversagen bucht aktive Koalitionsreaktion und Oppositionsanfrage genau einmal',()=>{
 const w=fall(),v=vorfall(w);expect(v.art).toBe('stillstand');expect(v.erfolg).toBe(false);
 expect(vorsitz(w).loyalitaet).toBe(38);expect(fraktion(w,'YENİ').bereitschaft).toBe(47);expect(fraktion(w,'CHP').bereitschaft).toBe(48);expect(oppositionVon(w).staerke).toBe(52);
 expect(oppositionVon(w).zuege.at(-1)!.art).toBe('anfrage');const s=save(w);
 ressortAnliegenTag(w);erfasseRessortVorfall(w,w.spiel!.ministerfluss!.ressortAnliegen!.find(a=>a.id===v.id)!,v.folge,false);expect(save(w)).toBe(s);
});
test('hilfreicher Alleingang bleibt wegen fehlender Abstimmung politisch umstritten',()=>{
 const w=fall(80,75),v=vorfall(w);expect(v.erfolg).toBe(true);expect(v.art).toBe('eigeninitiative');expect(vorsitz(w).loyalitaet).toBe(39);expect(oppositionVon(w).staerke).toBe(51);expect(v.reaktion.parteien.find(p=>p.partei==='YENİ')!.grund).toBe('kontrolle');
});
test('mehrere aktive Vorsitzende reagieren, inaktiver Vorsitz und gleichnamiger Minister nicht',()=>{
 const w=welt(),p=vorsitz(w);w.spiel!.figuren.push({...structuredClone(p),id:'zweiter-vorsitz',loyalitaet:31},{...structuredClone(p),id:'alter-vorsitz',imAmt:false,loyalitaet:77});
 tag(w,30);tag(w,14);expect(w.spiel!.figuren.find(f=>f.id==='zweiter-vorsitz')!.loyalitaet).toBe(29);expect(w.spiel!.figuren.find(f=>f.id==='alter-vorsitz')!.loyalitaet).toBe(77);expect(minister(w).loyalitaet).toBe(58);
});
test.each(['stuetzen','zurueckpfeifen','entlassen'] as const)('%s: zustandsneutrale Vorschau entspricht sämtlichen tatsächlich gespeicherten Folgen',art=>{
 const w=fall(80,40),s=save(w),p=plan(w,art);expect(p.ok).toBe(true);expect(save(w)).toBe(s);const ursprung=JSON.stringify(vorfall(w).reaktion);
 expect(entscheideRessortVorfall(w,p).ok).toBe(true);expect(vorfall(w).entscheidung).toEqual(p.beleg);expect(JSON.stringify(vorfall(w).reaktion)).toBe(ursprung);
 const fertig=save(w);expect(entscheideRessortVorfall(w,p).ok).toBe(false);expect(save(w)).toBe(fertig);
});
test('Stützen belohnt Minister und Partei, stärkt bei Misserfolg die Opposition und repariert keine Krise',()=>{
 const w=fall(),f=minister(w),loy=f.loyalitaet,chair=vorsitz(w).loyalitaet,wert=wertVon(w,'kriminalitaet'),z=JSON.stringify(w.spiel!.zusagen),p=plan(w,'stuetzen');
 expect(p.beleg!.vertrauen).toBeCloseTo(-0.5);entscheideRessortVorfall(w,p);
 expect(f.loyalitaet).toBe(loy+6);expect(vorsitz(w).loyalitaet).toBe(chair+3);expect(oppositionVon(w).staerke).toBe(55);expect(wertVon(w,'kriminalitaet')).toBe(wert);expect(JSON.stringify(w.spiel!.zusagen)).toBe(z);
});
test('Zurückpfeifen unterbindet nächsten Alleingang für 60 Tage, lässt Sachprobleme aber bestehen',()=>{
 const w=fall(80,75),p=plan(w,'zurueckpfeifen'),d=w.day,schulden=w.economy.debtRatio;entscheideRessortVorfall(w,p);
 expect(minister(w).eigen!.ressortKontrolleBis).toBe(d+60);expect(minister(w).eigen!.druckBis).toBe(d+60);expect(w.economy.debtRatio).toBe(schulden);
 tag(w,30);tag(w,14);expect(vorfall(w).art).toBe('stillstand');expect(w.economy.debtRatio).toBe(schulden);
 tag(w,30);const a=w.spiel!.ministerfluss!.ressortAnliegen!.find(a=>a.status==='offen'&&a.amt==='inneres')!;expect(ressortEigenart(w,a)!.eigen).toBe(true);
});
test('Entlassung verwendet echte Nachfolge und belastet Partner statt Vorsitz durch Nachfolger zu ersetzen',()=>{
 const w=fall(),f=minister(w),name=f.name,chair=vorsitz(w),loy=chair.loyalitaet,p=plan(w,'entlassen'),wert=wertVon(w,'kriminalitaet');
 entscheideRessortVorfall(w,p);expect(f.name).not.toBe(name);expect(f.eigen!.kommissarisch).toBe(true);expect(f.partei).toBe('YENİ');expect(f.eigen!.einarbeitungBis).toBe(w.day+60);expect(w.spiel!.ehemalige!.some(f=>f.name===name)).toBe(true);
 expect(chair.loyalitaet).toBe(loy-8);expect(p.beleg!.nachfolger!.name).toBe(f.name);expect(wertVon(w,'kriminalitaet')).toBe(wert);expect(offeneRessortVorfaelle(w)).toHaveLength(0);
});
test('tatsächlicher Amtswechsel mit derselben Figurenkennung macht alte Antwort ungültig',()=>{
 const w=fall(),p=plan(w,'stuetzen'),id=minister(w).id;besetzeNeu(w,minister(w),{name:'Neue Person',loyalitaet:50});expect(minister(w).id).toBe(id);const s=save(w);
 expect(entscheideRessortVorfall(w,p).ok).toBe(false);expect(save(w)).toBe(s);tag(w,1);expect(vorfall(w).geschlossen).toBe('wechsel');expect(offeneRessortVorfaelle(w)).toHaveLength(0);
});
test('Entlassung aus der Personenakte löst dieselben politischen Folgen einmal aus und zeigt sie vorher',()=>{
 const w=fall(),p=plan(w,'entlassen');vorsitz(w).loyalitaet=25;const hinweis=entlassungsFolgen(w,'inneres').join(' ');expect(hinweis).toContain('25 → 17');expect(hinweis).toContain('320 → 200');
 const neu=plan(w,'entlassen');expect(entlasse(w,'inneres',null).ok).toBe(true);expect(vorfall(w).entscheidung).toEqual(neu.beleg);const s=save(w);expect(entscheideRessortVorfall(w,p).ok).toBe(false);expect(save(w)).toBe(s);
});
test.each(['kommissarisch','kandidat'] as const)('Umbildung %s bucht wirklichen Rabatt im Vorfallsbeleg und dieselben Partnerfolgen',art=>{
 const w=fall();w.spiel!.umbildung={seit:w.day,bis:w.day+30,anlass:'wiederwahl',entschieden:{}};vorsitz(w).loyalitaet=25;
 expect(umbildungSicht(w)!.minister.find(m=>m.amt==='inneres')!.politischeFolgen!.join(' ')).toContain('25 → 17');
 const pk=w.spiel!.kapital,k=kandidatenFuer(w,'inneres')[0]!;
 const r=art==='kommissarisch'?umbildungEntlassen(w,'inneres'):umbildungErsetzen(w,'inneres',k.id);expect(r.ok).toBe(true);
 expect(vorfall(w).entscheidung!.pk).toBe(pk-w.spiel!.kapital);expect(vorfall(w).entscheidung!.pk).toBe(art==='kommissarisch'?1:2);expect(vorsitz(w).loyalitaet).toBe(17);
 expect(vorfall(w).entscheidung!.nachfolger!.kommissarisch).toBe(art==='kommissarisch');
 const html=renderToStaticMarkup(<RessortPolitikVerlauf vorfaelle={[vorfall(w)]}/>);expect(html).toContain(t('rp.abschluss.entlassen'));expect(html.includes(t('rp.kommissarisch'))).toBe(art==='kommissarisch');expect(html).not.toContain(t('rp.art.entlassen'));
});
test('eine gesperrte Umbildung lässt Rabatt und Vorfall unverändert',()=>{
 const w=fall();w.spiel!.umbildung={seit:w.day,bis:w.day+30,anlass:'wiederwahl',entschieden:{}};w.spiel!.verfassung!.pauseBis=w.day+2;const s=save(w);
 expect(umbildungEntlassen(w,'inneres').ok).toBe(false);expect(save(w)).toBe(s);
});
test('echte Nachbesetzung übernimmt weder unbeantwortete Anfrage noch alte Vernachlässigungsfrist',()=>{
 const w=welt();tag(w,30);const a=w.spiel!.ministerfluss!.ressortAnliegen!.find(a=>a.amt==='inneres')!;entlasse(w,'inneres',null);expect(ressortAntwortPlan(w,a.id,'ablehnen')!.ok).toBe(false);tag(w,14);
 expect(a.status).toBe('entfallen');expect(minister(w).loyalitaet).toBe(50);expect(w.spiel!.ministerfluss!.ressortVorfaelle??[]).toHaveLength(0);expect(w.spiel!.ministerfluss!.ressortAnliegen!.filter(a=>a.status==='offen')).toHaveLength(0);
});
test('neuer Bündnisstand entwertet Angebot; ehemalige Partner werden nicht wieder zur Koalition gerechnet',()=>{
 const w=fall(),p=plan(w,'entlassen');w.spiel!.lager=[];const s=save(w);expect(entscheideRessortVorfall(w,p).ok).toBe(false);expect(save(w)).toBe(s);
 const neu=plan(w,'entlassen');expect(neu.risiken).toEqual([]);expect(neu.beleg!.parteien.find(p=>p.partei==='YENİ')!.rolle).toBe('opposition');
});
test('unbezahlbare oder durch Erholungspause gesperrte Reaktion bucht nichts',()=>{
 const w=fall();w.spiel!.kapital=-100;const p=plan(w,'entlassen'),s=save(w);expect(p.ok).toBe(false);expect(entscheideRessortVorfall(w,p).ok).toBe(false);expect(save(w)).toBe(s);
 w.spiel!.kapital=100;w.spiel!.verfassung!.pauseBis=w.day+2;const x=save(w);expect(plan(w,'stuetzen').ok).toBe(false);expect(save(w)).toBe(x);
});
test('bekannte weitere Zusagenerinnerung wird in der Reaktionsvorschau weiter berücksichtigt',()=>{
 const w=fall();w.spiel!.zusagen.push({id:'test-z',von:'YENİ',text:'Test',faellig:w.day-10,erfuellt:false,gebrochen:false});
 w.spiel!.ereignisse.push({id:'test-er',vorlage:'zusage',tag:w.day-2,frist:w.day+1,daten:{zusage:'test-z'},staerke:1,provinzen:[]});
 const p=plan(w,'stuetzen');expect(p.druck.some(d=>d.partei==='YENİ')).toBe(true);
});
test('Werte werden tatsächlich begrenzt und extreme Vorschauen bleiben korrekt',()=>{
 const w=fall();minister(w).loyalitaet=99;vorsitz(w).loyalitaet=99;oppositionVon(w).staerke=99;const p=plan(w,'stuetzen');
 expect(p.beleg!.personen.find(f=>f.id===minister(w).id)!.loyalitaetNach).toBe(100);expect(p.beleg!.opposition!.nachher).toBe(100);
 entscheideRessortVorfall(w,p);expect(vorsitz(w).loyalitaet).toBe(100);
});
test('ohne parlamentarische Opposition wird keine fiktive Fraktion bestraft',()=>{
 const w=welt();w.parliament!.seats={[w.player!.partei.kurz]:480,'YENİ':120};tag(w,30);tag(w,14);expect(vorfall(w).reaktion.opposition).toBeUndefined();expect(vorfall(w).reaktion.parteien.map(p=>p.partei)).toEqual(['YENİ']);
});
test('späterer Vorfall ersetzt alte offene Antwort ohne damaligen Beleg umzuschreiben',()=>{
 const w=fall(),alt=vorfall(w),historisch=JSON.stringify(alt.reaktion),p=plan(w,'stuetzen');tag(w,30);tag(w,14);
 expect(alt.geschlossen).toBe('ueberholt');expect(JSON.stringify(alt.reaktion)).toBe(historisch);expect(offeneRessortVorfaelle(w)).toHaveLength(1);expect(entscheideRessortVorfall(w,p).ok).toBe(false);
});
test('Speichern/Laden erhält Entscheidung und sperrt Wiederholung; alte Stände erhalten keine rückwirkenden Strafen',()=>{
 const w=fall();entscheideRessortVorfall(w,plan(w,'stuetzen'));const neu=load(save(w));expect(vorfall(neu).entscheidung).toEqual(vorfall(w).entscheidung);expect(plan(neu,'entlassen').ok).toBe(false);
 delete neu.spiel!.ministerfluss!.ressortVorfaelle;const loy=vorsitz(neu).loyalitaet;tag(neu,1);expect(neu.spiel!.ministerfluss!.ressortVorfaelle??[]).toHaveLength(0);expect(vorsitz(neu).loyalitaet).toBe(loy);
});
test('verfehlter vorhandener Ressortauftrag löst denselben politischen Vorgang aus, ohne doppelte Fachstrafe',()=>{
 const w=welt(),f=minister(w),e=eigenVon(w,f);e.auftrag={id:'auftrag-inneres-test',text:'Kriminalität senken',groesse:'kriminalitaet',richtung:-1,delta:20,seit:w.day-180,frist:w.day,vorher:80,status:'laeuft'};
 personenMonat(w);expect(e.auftrag.status).toBe('verfehlt');expect(vorfall(w).art).toBe('auftragVerfehlt');expect(vorfall(w).folge.loyalitaet).toBe(-5);expect(plan(w,'entlassen').ok).toBe(true);expect(vorsitz(w).loyalitaet).toBe(38);
 const anzahl=w.spiel!.ministerfluss!.ressortVorfaelle!.length;personenMonat(w);expect(w.spiel!.ministerfluss!.ressortVorfaelle).toHaveLength(anzahl);
});
test('echte Monatsprüfung: Entlassung kann Partner kosten, Rückendeckung erhält die Mehrheit; Bericht bleibt historisch',()=>{
 const w=fall();expect(w.date).toBe('2028-06-30');vorsitz(w).loyalitaet=25;
 const b=beginneHaushaltsBeleg(w,{jahr:2028,eingebracht:90,abstimmung:w.day,absprachen:0,schritte:{}},400);schliesseHaushaltsBeleg(w,b);
 const st=load(save(w)),en=load(save(w));const p=plan(en,'entlassen');expect(p.risiken[0]!.partei).toBe('YENİ');expect(p.danach).toBe(200);expect(p.pruefung).toBe('2028-07-01');
 entscheideRessortVorfall(en,p);entscheideRessortVorfall(st,plan(st,'stuetzen'));advance(en,1);advance(st,1);
 expect(regierungsSitze(en)).toBe(200);expect(regierungsSitze(st)).toBe(320);
 const m=en.spiel!.wirtschaft!.haushalt.monatsberichte!.at(-1)!;expect(m.ministerpolitik!.at(-1)!.entscheidung!.art).toBe('entlassen');const hist=JSON.stringify(m);tag(en,5);expect(JSON.stringify(m)).toBe(hist);
});
test.each(['de','en','tr'] as const)('Karten, offene Handlungsoptionen und historischer Bericht auf %s sind zustandsneutral',async lang=>{
 await setzeSprache(lang);const w=fall(),s=save(w);
 const h=renderToStaticMarkup(<><RessortVerantwortung world={w} refresh={()=>{}}/>{(['stuetzen','zurueckpfeifen','entlassen'] as const).map(art=><RessortReaktionsOption key={art} world={w} id={vorfall(w).id} art={art} onEntscheide={()=>{}}/>)}</>);
 expect(h).toContain(t('rp.titel'));expect(h).toContain(t('rp.art.entlassen'));expect(h).toContain(t('rp.fraktionen'));expect(h).not.toContain('⟦');expect(save(w)).toBe(s);
 entscheideRessortVorfall(w,plan(w,'entlassen'));const r=renderToStaticMarkup(<RessortPolitikVerlauf vorfaelle={[vorfall(w)]}/>);expect(r).toContain(t('rp.abschluss.entlassen'));expect(r).not.toContain('⟦');
 for(const k of Object.keys(katalogVon('de')).filter(k=>k.startsWith('rp.')))expect(platzhalter(katalogVon(lang)[k]!)).toEqual(platzhalter(katalogVon('de')[k]!));
});
