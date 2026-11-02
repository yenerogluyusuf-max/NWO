import {afterEach,expect,test} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {createWorld,advance,save,load} from '../src/sim/world';
import {turkey2026} from '../src/sim/scenario';
import {startAfterElection,schnellProfil} from '../src/sim/prolog';
import {ressortAnliegenTag,ressortAntwortPlan,beantworteRessortAnliegen} from '../src/sim/ressortanliegen';
import {ressortPolitikPlan,entscheideRessortVorfall} from '../src/sim/ressortpolitik';
import {ressortNachsorgeTag,aktiveRessortNachsorge,beginneRessortNachsorge} from '../src/sim/ressortnachsorge';
import {bewerteRessortErholung,beginneRessortRueckhalt} from '../src/sim/ressortrueckhalt';
import {AEMTER,HOCH_SCHLECHT,eigenVon,wertVon} from '../src/sim/personen';
import {wirke} from '../src/sim/wirkung';
import {addDays} from '../src/sim/dates';
import {fraktion} from '../src/sim/fraktionen';
import {oppositionVon} from '../src/sim/opposition';
import {regierungsSitze} from '../src/sim/koalitionslage';
import {beginneHaushaltsBeleg,schliesseHaushaltsBeleg} from '../src/sim/haushaltsbericht';
import {RessortErholung,RessortErholungsVerlauf} from '../src/ui/minister/RessortErholung';
import {RessortRueckhalt} from '../src/ui/minister/RessortRueckhalt';
import {setzeSprache,t,katalogVon,platzhalter} from '../src/i18n';
function welt(){
 const w=createWorld(turkey2026,17);startAfterElection(w,{...schnellProfil(),buendnis:'YENİ'});
 w.day=100;w.date='2028-04-19';w.spiel!.kapital=100;w.spiel!.ereignisse=[];w.spiel!.gesetze=[];w.spiel!.zusagen=[];
 w.spiel!.lager=['YENİ'];w.parliament!.seats={[w.player!.partei.kurz]:200,'YENİ':120,CHP:150,MHP:90,DEM:40};
 for(const f of w.spiel!.figuren){const e=eigenVon(w,f);e.groll=0;f.loyalitaet=60;if(AEMTER[f.amt].regierungsamt)for(const id of AEMTER[f.amt].fach)wert(w,id,HOCH_SCHLECHT.has(id)?10:90);}
 const f=minister(w);f.partei='YENİ';f.gespraech=-100;Object.assign(eigenVon(w,f),{ehrgeiz:30,faehigkeit:70,stil:'vorsichtig',groll:0});
 wert(w,'kriminalitaet',90);ressortAnliegenTag(w);zeit(w,30);ressortAnliegenTag(w);zeit(w,14);ressortAnliegenTag(w);
 const v=w.spiel!.ministerfluss!.ressortVorfaelle!.at(-1)!;
 expect(entscheideRessortVorfall(w,ressortPolitikPlan(w,v.id,'stuetzen')!).ok).toBe(true);
 vorsitz(w).loyalitaet=40;for(const p of ['YENİ','CHP','MHP','DEM'])fraktion(w,p).bereitschaft=50;oppositionVon(w).staerke=50;return w;
}
type W=ReturnType<typeof createWorld>;
const minister=(w:W)=>w.spiel!.figuren.find(f=>f.amt==='inneres'&&f.imAmt)!;
const vorsitz=(w:W)=>w.spiel!.figuren.find(f=>f.amt==='partner'&&f.partei==='YENİ'&&f.imAmt)!;
const spur=(w:W)=>aktiveRessortNachsorge(w)[0]!;
const letzte=(w:W)=>spur(w).meldungen.at(-1)!;
const politik=(w:W)=>letzte(w).politik!;
function wert(w:W,id:string,n:number){wirke(w,id,n-wertVon(w,id));}
function zeit(w:W,n:number){w.day+=n;w.date=addDays(w.date,n);}
function meldung(w:W,n=14){zeit(w,n);ressortNachsorgeTag(w);return politik(w);}
function druck(w:W){meldung(w);return meldung(w);}
afterEach(async()=>{await setzeSprache('de')});

test('echte Erholung bucht Rückhalt und schwächt Opposition ohne Fachwert, PK oder Zusagen zu verändern',()=>{
 const w=welt(),f=minister(w),loy=f.loyalitaet,pk=w.spiel!.kapital,z=JSON.stringify(w.spiel!.zusagen);wert(w,'kriminalitaet',80);const b=meldung(w);
 expect(b.urteil).toBe('fortschritt');expect(fraktion(w,'YENİ').bereitschaft).toBe(52);expect(vorsitz(w).loyalitaet).toBe(41);expect(fraktion(w,'CHP').bereitschaft).toBe(51);expect(oppositionVon(w).staerke).toBe(49);expect(f.loyalitaet).toBe(loy);expect(w.spiel!.kapital).toBe(pk);expect(JSON.stringify(w.spiel!.zusagen)).toBe(z);expect(wertVon(w,'kriminalitaet')).toBeCloseTo(80);
 expect(b.parteien.find(p=>p.partei==='YENİ')!.personen[0]).toMatchObject({vorher:40,nachher:41});expect(b.opposition).toEqual({partei:'CHP',vorher:50,nachher:49});
});
test('bestätigte Erholung belohnt einmal; gesunde weitere Steigerung und weitere stabile Berichte nicht',()=>{
 const w=welt();wert(w,'kriminalitaet',60);expect(meldung(w).urteil).toBe('fortschritt');expect(meldung(w).urteil).toBe('bestaetigt');expect(vorsitz(w).loyalitaet).toBe(43);const r=fraktion(w,'YENİ').bereitschaft;wert(w,'kriminalitaet',50);expect(meldung(w,30).urteil).toBe('gehalten');expect(fraktion(w,'YENİ').bereitschaft).toBe(r);
});
test('Rückfall und Wiederholung eines früheren Bestwerts erzeugen keinen zweiten Fortschrittsbonus',()=>{
 const w=welt();wert(w,'kriminalitaet',80);meldung(w);wert(w,'kriminalitaet',85);expect(meldung(w).urteil).toBe('druck');const r=fraktion(w,'YENİ').bereitschaft;wert(w,'kriminalitaet',80);const b=meldung(w);expect(b.urteil).not.toBe('fortschritt');expect(fraktion(w,'YENİ').bereitschaft).toBe(r);expect(b.forderungen.every(f=>f.status==='erreicht')).toBe(true);
});
test('unbeteiligter gesunder Messwert verdeckt die stagnierende Krise nicht',()=>{
 const w=welt();wert(w,'terrorgefahr',5);expect(meldung(w).urteil).toBe('geduld');wert(w,'terrorgefahr',2);expect(meldung(w).urteil).toBe('druck');
});
test.each([0.99,1,1.01])('neuer Bestwert mit Verbesserung %s verwendet genaue Ein-Punkt-Schwelle',d=>{
 const w=welt();wert(w,'kriminalitaet',spur(w).ausgang-d);expect(meldung(w).urteil).toBe(d<1?'geduld':'fortschritt');
});
test('kleine Verbesserungen sammeln sich bis zur Anerkennung von einem Punkt',()=>{
 const w=welt(),n=spur(w);wert(w,'kriminalitaet',n.ausgang-0.6);expect(meldung(w).urteil).toBe('geduld');wert(w,'kriminalitaet',n.ausgang-1.1);expect(meldung(w).urteil).toBe('fortschritt');
});
test('anderes kritisches Ressortproblem hat bei Rückschlag Vorrang vor dem verbesserten Ausgangswert',()=>{
 const w=welt();wert(w,'kriminalitaet',60);wert(w,'terrorgefahr',80);const b=meldung(w);expect(letzte(w).entwicklung).toBe('teilErholt');expect(b.urteil).toBe('druck');expect(b.grund).toBe('rueckschlag');expect(b.belege[0]!.groesse).toBe('terrorgefahr');expect(b.forderungen[0]!.groesse).toBe('terrorgefahr');expect(b.forderungen[0]!.ziel).toBeCloseTo(78);
});
test('Stillstand erhält einen Bericht Geduld; danach messbare Forderungen mit festen 28 Tagen',()=>{
 const w=welt();expect(meldung(w).urteil).toBe('geduld');const b=meldung(w);expect(b.urteil).toBe('druck');expect(b.grund).toBe('stillstand');expect(b.forderungen).toHaveLength(2);
 expect(b.forderungen.map(f=>f.partei)).toEqual(['YENİ','CHP']);for(const f of b.forderungen){expect(f.frist).toBe(w.day+28);expect(f.ziel).toBeCloseTo(f.ausgang-2);expect(f.status).toBe('offen');}expect(w.spiel!.zusagen).toEqual([]);
 expect(fraktion(w,'YENİ').bereitschaft).toBe(47);expect(vorsitz(w).loyalitaet).toBe(38);expect(oppositionVon(w).staerke).toBe(52);
});
test('laufendes reales Gesetz erhält einen weiteren Bericht Zeit, ersetzt aber kein Ergebnis',()=>{
 const w=welt();meldung(w);const p=ressortAntwortPlan(w,letzte(w).anliegen!,'umsetzen')!;expect(p.ok).toBe(true);beantworteRessortAnliegen(w,p);
 expect(meldung(w).urteil).toBe('beratung');expect(spur(w).rueckhalt!.forderungen).toEqual([]);expect(meldung(w).urteil).toBe('druck');expect(w.spiel!.gesetze).toHaveLength(1);
});
test('Rückschlag erzeugt sofort Druck, aber niemals erneuten Abzug vor 28 Tagen',()=>{
 const w=welt();wert(w,'kriminalitaet',95);expect(meldung(w).urteil).toBe('druck');const r=fraktion(w,'YENİ').bereitschaft;wert(w,'kriminalitaet',97);expect(meldung(w).urteil).toBe('druckpause');expect(fraktion(w,'YENİ').bereitschaft).toBe(r);expect(meldung(w).urteil).toBe('druck');expect(fraktion(w,'YENİ').bereitschaft).toBe(r-3);
});
test('Ziel wird an echter Messung erreicht, alter Forderungsbeleg bleibt dabei unverändert',()=>{
 const w=welt(),b=druck(w),alt=JSON.stringify(b);const ziel=b.forderungen[0]!.ziel;wert(w,'kriminalitaet',ziel);const neu=meldung(w);expect(neu.forderungen.every(f=>f.status==='erreicht')).toBe(true);expect(neu.urteil).toBe('fortschritt');expect(JSON.stringify(b)).toBe(alt);expect(w.spiel!.zusagen).toEqual([]);
});
test('Entwarnung erfüllt Forderung auch vor der vollen Zwei-Punkte-Verbesserung',()=>{
 const w=welt();wert(w,'kriminalitaet',63);beginneRessortRueckhalt(w,spur(w));spur(w).rueckhalt!.beste.kriminalitaet=63;druck(w);wert(w,'kriminalitaet',62);expect(meldung(w).forderungen.every(f=>f.status==='erreicht')).toBe(true);
});
test('fälliges verfehltes Ziel bleibt als Beleg erhalten und löst neue konkrete Forderung aus',()=>{
 const w=welt(),alt=druck(w),frist=alt.forderungen[0]!.frist;meldung(w);const b=meldung(w);expect(w.day).toBe(frist);expect(b.grund).toBe('zielVerfehlt');expect(b.forderungen.filter(f=>f.status==='verfehlt')).toHaveLength(2);expect(b.forderungen.filter(f=>f.status==='offen')).toHaveLength(2);expect(b.forderungen.find(f=>f.status==='offen')!.frist).toBe(w.day+28);
});
test('neue Personalentscheidung übernimmt Bestwerte und offene Fristen ohne Rückbonus',()=>{
 const w=welt();wert(w,'kriminalitaet',80);meldung(w);wert(w,'kriminalitaet',85);druck(w);const alt=spur(w),s=structuredClone(alt.rueckhalt);const v=structuredClone(w.spiel!.ministerfluss!.ressortVorfaelle![0]!);v.id='zweite-entscheidung';v.nachsorgeBegonnen=false;v.entscheidung!.tag=w.day;v.entscheidung!.datum=w.date;beginneRessortNachsorge(w,v);
 expect(spur(w).rueckhalt).toEqual(s);expect(spur(w).rueckhalt).not.toBe(alt.rueckhalt);wert(w,'kriminalitaet',80);expect(meldung(w).urteil).not.toBe('fortschritt');
});
test('ehemalige Koalition wird aktuell als Opposition bewertet; Forderungsrolle bleibt historisch',()=>{
 const w=welt();druck(w);const c=vorsitz(w),loy=c.loyalitaet;w.spiel!.lager=[];wert(w,'kriminalitaet',80);const b=meldung(w);expect(c.loyalitaet).toBe(loy);expect(b.parteien.find(p=>p.partei==='YENİ')!.rolle).toBe('opposition');expect(b.forderungen.find(f=>f.partei==='YENİ')!.rolle).toBe('koalition');
});
test('Duldung wird mit heutiger Frist eingeordnet und ist keine Koalitionsloyalität',()=>{
 const w=welt();fraktion(w,'CHP').duldungBis=w.day+15;wert(w,'kriminalitaet',80);expect(meldung(w).parteien.find(p=>p.partei==='CHP')!.rolle).toBe('duldung');wert(w,'kriminalitaet',78);expect(meldung(w).parteien.find(p=>p.partei==='CHP')!.rolle).toBe('opposition');
});
test('Sitzverlust beendet alte parlamentarische Forderung ohne erfundenen Akteur',()=>{
 const w=welt();druck(w);w.parliament!.seats.CHP=0;const b=meldung(w);expect(b.forderungen.find(f=>f.partei==='CHP')!.status).toBe('entfallen');expect(b.parteien.some(p=>p.partei==='CHP')).toBe(false);
});
test('nur aktive Vorsitzende reagieren; mehrere aktive werden gleich behandelt',()=>{
 const w=welt(),c=vorsitz(w);w.spiel!.figuren.push({...structuredClone(c),id:'extra',loyalitaet:30},{...structuredClone(c),id:'inaktiv',loyalitaet:30,imAmt:false});wert(w,'kriminalitaet',80);meldung(w);expect(w.spiel!.figuren.find(f=>f.id==='extra')!.loyalitaet).toBe(31);expect(w.spiel!.figuren.find(f=>f.id==='inaktiv')!.loyalitaet).toBe(30);
});
test('andere Koalitionspartner reagieren schwächer auf Verantwortung und auf bestätigte Erholung',()=>{
 const w=welt();w.spiel!.lager.push('MHP');w.spiel!.figuren.push({...structuredClone(vorsitz(w)),id:'mhp-chair',partei:'MHP',loyalitaet:30});druck(w);expect(fraktion(w,'MHP').bereitschaft).toBe(48);expect(w.spiel!.figuren.find(f=>f.id==='mhp-chair')!.loyalitaet).toBe(29);wert(w,'kriminalitaet',60);meldung(w);meldung(w);expect(w.spiel!.figuren.find(f=>f.id==='mhp-chair')!.loyalitaet).toBe(30);
});
test('tatsächliche Begrenzung auf 0–100 statt nomineller Reaktion gespeichert',()=>{
 const w=welt();vorsitz(w).loyalitaet=100;fraktion(w,'YENİ').bereitschaft=99;oppositionVon(w).staerke=0;wert(w,'kriminalitaet',80);const b=meldung(w);expect(b.parteien.find(p=>p.partei==='YENİ')).toMatchObject({vorher:99,nachher:100,personen:[{name:vorsitz(w).name,vorher:100,nachher:100}]});expect(b.opposition).toMatchObject({vorher:0,nachher:0});
});
test('ohne parlamentarische Opposition keine fiktive Anfrage oder Oppositionsstärke',()=>{
 const w=welt();w.parliament!.seats={[w.player!.partei.kurz]:480,'YENİ':120};const b=druck(w);expect(b.opposition).toBeUndefined();expect(b.forderungen.map(f=>f.partei)).toEqual(['YENİ']);
});
test('Vorfall am Messtag wird nicht durch zusätzliche politische Messstrafe verdoppelt',()=>{
 const w=welt();meldung(w);zeit(w,14);ressortAnliegenTag(w);const r=fraktion(w,'YENİ').bereitschaft,l=vorsitz(w).loyalitaet;ressortNachsorgeTag(w);expect(politik(w).urteil).toBe('vorfall');expect(fraktion(w,'YENİ').bereitschaft).toBe(r);expect(vorsitz(w).loyalitaet).toBe(l);
});
test('wiederholte Bewertung und Speichern/Laden buchen keine zweite Reaktion',()=>{
 const w=welt();wert(w,'kriminalitaet',80);meldung(w);const s=save(w);bewerteRessortErholung(w,spur(w),letzte(w));ressortNachsorgeTag(w);expect(save(w)).toBe(s);const k=load(s);expect(spur(k)).toEqual(spur(w));bewerteRessortErholung(k,spur(k),letzte(k));expect(save(k)).toBe(save(load(s)));
});
test('Altberichte werden nicht nachträglich belohnt; bekannte Bestwerte bleiben Vergleichsgrundlage',()=>{
 const w=welt();wert(w,'kriminalitaet',80);meldung(w);delete spur(w).rueckhalt;delete letzte(w).politik;const hist=JSON.stringify(letzte(w)),r=fraktion(w,'YENİ').bereitschaft;meldung(w);expect(politik(w).urteil).toBe('geduld');expect(fraktion(w,'YENİ').bereitschaft).toBe(r);expect(JSON.stringify(spur(w).meldungen[0])).toBe(hist);
});
test('Gesamthistorie bleibt begrenzt und erreicht/verfehlt wird nur einmal gebucht',()=>{
 const w=welt();for(let i=0;i<20;i++)meldung(w);expect(spur(w).meldungen).toHaveLength(8);expect(spur(w).rueckhalt!.forderungen.length).toBeLessThanOrEqual(8);expect(spur(w).rueckhalt!.forderungen.filter(f=>f.status==='offen')).toHaveLength(2);
});
test.each(['de','en','tr'] as const)('reale politische Meldung und Monatskarte auf %s zustandsneutral und vollständig',async lang=>{
 await setzeSprache(lang);const w=welt();druck(w);vorsitz(w).loyalitaet=19;meldung(w,28);const s=save(w);const h=renderToStaticMarkup(<RessortErholung world={w}/>),r=renderToStaticMarkup(<RessortErholungsVerlauf beobachtungen={aktiveRessortNachsorge(w)}/>);
 for(const html of [h,r]){expect(html).toContain(t('rr.titel'));expect(html).toContain(t('rr.forderungen'));expect(html).toContain(t('rr.gebucht'));expect(html).not.toContain('⟦');expect(html).not.toContain('NaN');}expect(save(w)).toBe(s);
 for(const k of Object.keys(katalogVon('de')).filter(k=>k.startsWith('rr.'))){expect(katalogVon(lang)[k]).toBeDefined();expect(platzhalter(katalogVon(lang)[k]!)).toEqual(platzhalter(katalogVon('de')[k]!));}
 expect(renderToStaticMarkup(<RessortRueckhalt/>)).toContain(t('rr.alt'));
});
test('echter Monatslauf: Ergebnisrückhalt hält Partner, erneuter Stillstand kostet die Regierungsmehrheit',()=>{
 const w=welt();expect(w.date).toBe('2028-06-02');meldung(w);beantworteRessortAnliegen(w,ressortAntwortPlan(w,letzte(w).anliegen!,'reden')!);
 vorsitz(w).loyalitaet=21;const b=beginneHaushaltsBeleg(w,{jahr:2028,eingebracht:90,abstimmung:w.day,absprachen:0,schritte:{}},400);schliesseHaushaltsBeleg(w,b);
 const gut=load(save(w)),schlecht=load(save(w));wert(gut,'kriminalitaet',80);meldung(gut);meldung(schlecht);expect(gut.date).toBe('2028-06-30');expect(vorsitz(gut).loyalitaet).toBe(22);expect(vorsitz(schlecht).loyalitaet).toBe(19);expect(politik(schlecht).koalition).toEqual({pruefung:'2028-07-01',sitze:320,danach:200,parteien:['YENİ']});
 advance(gut,1);advance(schlecht,1);expect(regierungsSitze(gut)).toBe(320);expect(regierungsSitze(schlecht)).toBe(200);
 const m=gut.spiel!.wirtschaft!.haushalt.monatsberichte!.at(-1)!;expect(m.ressortnachsorge![0]!.meldungen.at(-1)!.politik!.urteil).toBe('fortschritt');const hist=JSON.stringify(m);wert(gut,'kriminalitaet',60);meldung(gut);expect(JSON.stringify(m)).toBe(hist);
});

test('erst später auftretendes Sachproblem kann echte Erholung gewinnen, ohne gesunde Werte zu vergüten',()=>{
 const w=welt();wert(w,'kriminalitaet',60);meldung(w);meldung(w);wert(w,'terrorgefahr',80);expect(meldung(w,30).urteil).toBe('druck');wert(w,'terrorgefahr',78);const b=meldung(w);expect(b.urteil).toBe('fortschritt');expect(b.belege.map(v=>v.groesse)).toEqual(['terrorgefahr']);
});
test('nützlicher Ressortwert erzeugt Fortschritt nach oben und feste Mindestforderung',()=>{
 const w=welt(),n=spur(w);n.amt='wirtschaft';n.groesse='industrie';n.ausgang=5;wert(w,'industrie',5);beginneRessortRueckhalt(w,n);const f=w.spiel!.figuren.find(f=>f.amt==='wirtschaft'&&f.imAmt)!;f.partei='YENİ';wert(w,'industrie',8);expect(meldung(w).urteil).toBe('fortschritt');wert(w,'industrie',6);const b=meldung(w);expect(b.urteil).toBe('druck');expect(b.forderungen[0]!.groesse).toBe('industrie');expect(b.forderungen[0]!.ziel).toBeCloseTo(8);
});
test('Monatserster: Rückhaltsänderung nach der Monatsprüfung warnt auf den nächsten Monat',()=>{
 const w=welt();meldung(w);vorsitz(w).loyalitaet=21;zeit(w,14);w.date='2028-07-01';ressortNachsorgeTag(w);expect(politik(w).koalition).toEqual({pruefung:'2028-08-01',sitze:320,danach:200,parteien:['YENİ']});expect(regierungsSitze(w)).toBe(320);
});

test('Monatsansicht lässt frühere Fortschrittsreaktion neben neuer Druckreaktion nachvollziehen',()=>{
 const w=welt();wert(w,'kriminalitaet',80);meldung(w);wert(w,'kriminalitaet',85);meldung(w);const s=save(w),h=renderToStaticMarkup(<RessortErholungsVerlauf beobachtungen={aktiveRessortNachsorge(w)}/>);
 expect(h).toContain(t('rr.urteil.fortschritt'));expect(h).toContain(t('rr.urteil.druck'));expect(h).toContain(t('rn.verlauf'));expect(save(w)).toBe(s);
});
