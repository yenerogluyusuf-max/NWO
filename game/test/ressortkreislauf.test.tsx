// Druckkreislauf der Ressorts (Befund aus dem Spiel des Inhabers, 07.11.2026): Die Justizministerin fragte alle sechs Wochen nach derselben
// Größe, obwohl ihre Reform in der Umsetzung lief; jede verfallene Anfrage drückte die Unabhängigkeit der Justiz weiter bis auf 0,4.
import {expect,test} from 'vitest';
import {createWorld} from '../src/sim/world';
import {turkey2026} from '../src/sim/scenario';
import {startAfterElection,schnellProfil} from '../src/sim/prolog';
import {ressortAnliegenTag,hebelUnterwegs,ressortHebel,ressortPauseBis,legeRessortAnliegenAn,RESSORT_ANLIEGEN,RESSORT_STILLSTAND} from '../src/sim/ressortanliegen';
import {AEMTER,HOCH_SCHLECHT,eigenVon,wertVon} from '../src/sim/personen';
import {wirke} from '../src/sim/wirkung';
import {addDays} from '../src/sim/dates';
import {flussZustand} from '../src/sim/ministerfluss-kern';
import {ressortMonatslog} from '../src/sim/ressortlog';
import {t} from '../src/i18n';

type W=ReturnType<typeof createWorld>;
function welt():W{
 const w=createWorld(turkey2026,17);startAfterElection(w,{...schnellProfil(),buendnis:'YENİ'});
 w.day=100;w.date='2028-05-17';w.spiel!.kapital=100;w.spiel!.ereignisse=[];w.spiel!.gesetze=[];w.spiel!.zusagen=[];
 for(const f of w.spiel!.figuren){const e=eigenVon(w,f);e.groll=0;f.loyalitaet=60;if(AEMTER[f.amt].regierungsamt)for(const id of AEMTER[f.amt].fach)wirke(w,id,(HOCH_SCHLECHT.has(id)?10:90)-wertVon(w,id));}
 Object.assign(eigenVon(w,minister(w)),{ehrgeiz:30,faehigkeit:70,stil:'vorsichtig',groll:0});minister(w).gespraech=-100;
 return w;
}
const minister=(w:W)=>w.spiel!.figuren.find(f=>f.amt==='inneres'&&f.imAmt)!;
const tag=(w:W,n:number)=>{w.day+=n;w.date=addDays(w.date,n);ressortAnliegenTag(w);};
const anliegen=(w:W)=>(w.spiel!.ministerfluss?.ressortAnliegen??[]).filter(a=>a.amt==='inneres');

test('läuft der vorgeschlagene Hebel schon, wartet das Ressort: keine Anfrage, eine offene gilt als bearbeitet',()=>{
 const w=welt();wirke(w,'kriminalitaet',90-wertVon(w,'kriminalitaet'));ressortAnliegenTag(w);tag(w,30);
 const a=anliegen(w).find(a=>a.status==='offen')!;expect(a.vorschlag?.art).toBe('gesetz');
 const id=a.vorschlag!.art==='gesetz'?a.vorschlag!.id:'';(w.net.umsetzung??={})[id]=40;
 expect(hebelUnterwegs(w,a)).toBe(true);tag(w,1);expect(a.status).toBe('erledigt');
 tag(w,RESSORT_ANLIEGEN.frist);expect(anliegen(w).filter(x=>x.status==='eskaliert')).toHaveLength(0);
 expect(legeRessortAnliegenAn(w,minister(w),a.groesse)).toBeUndefined();
});
test('nach dem Verfall hakt die Nachbeobachtung während der Pause nicht wieder zu derselben Größe nach',()=>{
 const w=welt();wirke(w,'kriminalitaet',90-wertVon(w,'kriminalitaet'));ressortAnliegenTag(w);tag(w,30);
 expect(anliegen(w).some(a=>a.status==='offen')).toBe(true);
 tag(w,RESSORT_ANLIEGEN.frist);
 const a=anliegen(w).find(a=>a.status==='eskaliert')!;expect(a).toBeDefined();
 expect(ressortPauseBis(w,'inneres',a.groesse)).toBe(w.day+RESSORT_ANLIEGEN.pause);
 expect(legeRessortAnliegenAn(w,minister(w),a.groesse,'nachsorge-test')).toBeUndefined();
 w.day+=RESSORT_ANLIEGEN.pause;w.date=addDays(w.date,RESSORT_ANLIEGEN.pause);
 expect(legeRessortAnliegenAn(w,minister(w),a.groesse,'nachsorge-test')).toBeDefined();
});
test('am Boden und ohne Hebel sinkt die Größe durch Liegenlassen nicht weiter',()=>{
 const w=welt();wirke(w,'kriminalitaet',(100-RESSORT_STILLSTAND.boden+0.5)-wertVon(w,'kriminalitaet'));ressortAnliegenTag(w);tag(w,30);
 const vor=wertVon(w,'kriminalitaet');tag(w,RESSORT_ANLIEGEN.frist);
 expect(anliegen(w).some(a=>a.status==='eskaliert')).toBe(true);
 expect(wertVon(w,'kriminalitaet')).toBeCloseTo(vor,6);
 const w2=welt();wirke(w2,'kriminalitaet',90-wertVon(w2,'kriminalitaet'));ressortAnliegenTag(w2);tag(w2,30);
 const a=anliegen(w2).find(a=>a.status==='offen')!;delete a.vorschlag;
 const vor2=wertVon(w2,'kriminalitaet');tag(w2,RESSORT_ANLIEGEN.frist);
 expect(wertVon(w2,'kriminalitaet')).toBeCloseTo(vor2,6);
});
test('die Anfrage nennt ihren Hebel; fehlt er, sagt sie das',()=>{
 const w=welt();wirke(w,'kriminalitaet',90-wertVon(w,'kriminalitaet'));ressortAnliegenTag(w);tag(w,30);
 const a=anliegen(w).find(a=>a.status==='offen')!;
 const h=ressortHebel(w,a);expect(h.art==='gesetz'||h.art==='haushalt').toBe(true);
 const zeile=w.log.find(l=>l.day===a.seit&&l.text.startsWith(t('h4b.ra.neu',{name:a.name,groesse:'X',datum:'Y',hebel:'gesetz',massnahme:'M',ziel:1}).split(' ')[0]!))!;
 expect(zeile.text).toContain(h.art==='gesetz'||h.art==='haushalt'?h.name:'');
 delete a.vorschlag;expect(ressortHebel(w,a).art).toBe('keiner');
});
test('Meldungen und Parteireaktionen eines Monats stehen in einer Zeile je Ressort',()=>{
 const w=welt(),n=w.log.length;
 ressortMonatslog(w,'justiz',{art:'meldung',name:'Ece Öztürk',groesse:'justiz_unabhaengigkeit',vor:0.9,nach:0.6,stand:'Keine deutliche Erholung'});
 ressortMonatslog(w,'justiz',{art:'forderung',partei:'AKP'});
 ressortMonatslog(w,'justiz',{art:'aufklaerung',partei:'AKP'});
 ressortMonatslog(w,'justiz',{art:'meldung',name:'Ece Öztürk',groesse:'justiz_unabhaengigkeit',vor:0.6,nach:0.4,stand:'Keine deutliche Erholung'});
 ressortMonatslog(w,'handel',{art:'forderung',partei:'AKP'});
 expect(w.log.length).toBe(n+2);
 const z=w.log[n]!;expect(z.sammel!.meldungen).toBe(2);expect(z.text).toContain('0,9 → 0,4');expect(z.text).toContain('AKP');
 w.date=addDays(w.date,40);w.day+=40;ressortMonatslog(w,'justiz',{art:'forderung',partei:'AKP'});expect(w.log.length).toBe(n+3);
 void flussZustand;
});
