import {afterEach,expect,test} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {createWorld,save,load} from '../src/sim/world';
import {turkey2026} from '../src/sim/scenario';
import {startAfterElection,schnellProfil} from '../src/sim/prolog';
import {ressortAnliegenTag} from '../src/sim/ressortanliegen';
import {ressortPolitikPlan,entscheideRessortVorfall} from '../src/sim/ressortpolitik';
import {ressortNachsorgeTag,aktiveRessortNachsorge} from '../src/sim/ressortnachsorge';
import {AEMTER,HOCH_SCHLECHT,eigenVon,wertVon} from '../src/sim/personen';
import {wirke} from '../src/sim/wirkung';
import {addDays} from '../src/sim/dates';
import {fraktion} from '../src/sim/fraktionen';
import {Rng} from '../src/sim/rng';
import {gesetzeAbstimmen,gesetzPrognose,bringeEin} from '../src/sim/handeln';
import {haushaltsStand} from '../src/sim/haushaltsbericht';
import {ressortForderungsMassnahmen,ressortForderungsPlan,ressortForderungsKompromisse,fuehreRessortForderungsHilfeAus,ressortForderungsSperre,type RessortHilfePlan} from '../src/sim/ressortforderungshilfe';
import {RessortHilfeKarte,RessortForderungsWege} from '../src/ui/minister/RessortForderungsWege';
import {RessortErholung,RessortErholungsVerlauf} from '../src/ui/minister/RessortErholung';
import {setzeSprache,t,katalogVon,platzhalter} from '../src/i18n';
function welt(){
 const w=createWorld(turkey2026,17);startAfterElection(w,{...schnellProfil(),buendnis:'YENİ'});w.day=100;w.date='2028-04-19';w.spiel!.kapital=100;w.spiel!.ereignisse=[];w.spiel!.gesetze=[];w.spiel!.zusagen=[];
 w.spiel!.lager=['YENİ'];w.parliament!.seats={[w.player!.partei.kurz]:200,'YENİ':120,CHP:150,MHP:90,DEM:40};
 for(const f of w.spiel!.figuren){eigenVon(w,f);f.loyalitaet=60;if(AEMTER[f.amt].regierungsamt)for(const id of AEMTER[f.amt].fach)wert(w,id,HOCH_SCHLECHT.has(id)?10:90);}
 const f=w.spiel!.figuren.find(f=>f.amt==='inneres'&&f.imAmt)!;f.partei='YENİ';f.gespraech=-100;Object.assign(eigenVon(w,f),{ehrgeiz:30,faehigkeit:70,stil:'vorsichtig',groll:0});
 wert(w,'kriminalitaet',90);ressortAnliegenTag(w);zeit(w,30);ressortAnliegenTag(w);zeit(w,14);ressortAnliegenTag(w);
 const v=w.spiel!.ministerfluss!.ressortVorfaelle!.at(-1)!;entscheideRessortVorfall(w,ressortPolitikPlan(w,v.id,'stuetzen')!);
 for(const p of ['YENİ','CHP','MHP','DEM'])fraktion(w,p).bereitschaft=70;
 zeit(w,14);ressortNachsorgeTag(w);zeit(w,14);ressortNachsorgeTag(w);return w;
}
type W=ReturnType<typeof createWorld>;
function wert(w:W,id:string,n:number){wirke(w,id,n-wertVon(w,id));}
function zeit(w:W,n:number){w.day+=n;w.date=addDays(w.date,n);}
const spur=(w:W)=>aktiveRessortNachsorge(w)[0]!;
const ref=(w:W)=>({beobachtung:spur(w).id,forderung:spur(w).rueckhalt!.forderungen.find(f=>f.status==='offen')!.id});
const gesetz=(w:W)=>ressortForderungsMassnahmen(w,ref(w)).find(p=>p.aktion.art==='gesetz'&&p.moeglich)!;
afterEach(async()=>{await setzeSprache('de')});

test('Forderung erhält mehrere passende Maßnahmen samt Preis, Umsetzung und echter Votumsfrist',()=>{
 const w=welt(),s=save(w),pl=ressortForderungsMassnahmen(w,ref(w));expect(pl.length).toBeGreaterThan(1);expect(pl.some(p=>p.fach.begrenzt)).toBe(true);expect(pl.some(p=>p.aktion.art==='etat')).toBe(true);expect(save(w)).toBe(s);
 for(const p of pl){expect(p.fach.id).toBe('kriminalitaet');expect(p.pk).toBeGreaterThanOrEqual(0);expect(p.fach.monate).toBeGreaterThanOrEqual(0);if(p.aktion.art==='gesetz'){expect(p.votum!.tag).toBeGreaterThan(w.day);expect(p.votum!.luecke).toBe(Math.max(0,p.votum!.schwelle-p.votum!.ja));}}
});
test('Annahmevorschau gibt keinen Rückhalt beim Einbringen; echte Messforderung bleibt offen',()=>{
 const w=welt(),p=gesetz(w),pk=w.spiel!.kapital,vor=JSON.stringify(spur(w).rueckhalt!.forderungen),hist=JSON.stringify(spur(w).meldungen);expect(p).toBeDefined();expect(p.annahme).toBeDefined();expect(fuehreRessortForderungsHilfeAus(w,p).ok).toBe(true);
 expect(w.spiel!.kapital).toBe(pk-p.pk);expect(haushaltsStand(w)).toEqual(p.sofort);expect(w.spiel!.gesetze).toHaveLength(1);expect(JSON.stringify(spur(w).rueckhalt!.forderungen)).toBe(vor);expect(JSON.stringify(spur(w).meldungen)).toBe(hist);expect(spur(w).hilfen).toHaveLength(1);
});
test('bedingte Annahme stimmt mit echter Abstimmungsabwicklung ohne andere Monatswirkungen überein',()=>{
 const w=welt(),p=gesetz(w);fuehreRessortForderungsHilfeAus(w,p);const g=w.spiel!.gesetze[0]!;zeit(w,g.abstimmung-w.day);const rng=new Rng(w.rngState);rng.normal=()=>600;expect(gesetzeAbstimmen(w,rng)[0]!.angenommen).toBe(true);expect(haushaltsStand(w)).toEqual(p.annahme);expect(spur(w).rueckhalt!.forderungen[0]!.status).toBe('offen');
});
test('Paket führt Fraktionsgespräch und Gesetz mit identischem Gesamtpreis atomar aus',()=>{
 const w=welt(),p=ressortForderungsPlan(w,ref(w),gesetz(w).aktion,{art:'gespraech',partei:'YENİ'})!;expect(p.moeglich).toBe(true);expect(p.ohneKompromiss).toBeDefined();const pk=w.spiel!.kapital;
 expect(fuehreRessortForderungsHilfeAus(w,p).ok).toBe(true);expect(w.spiel!.kapital).toBe(pk-p.pk);expect(haushaltsStand(w)).toEqual(p.sofort);expect(gesetzPrognose(w,w.spiel!.gesetze[0]!).ja).toBe(p.votum!.ja);expect(spur(w).hilfen![0]!.kompromiss!.art).toBe('gespraech');
});
test.each(['duldung','koalition'] as const)('%s zeigt und erzeugt dieselben festen Zusatzversprechen',art=>{
 const w=welt(),p=ressortForderungsPlan(w,ref(w),gesetz(w).aktion,{art,partei:'CHP'})!;expect(p.moeglich).toBe(true);expect(p.zusagen.length).toBeGreaterThan(0);expect(p.zusagen[0]!.stufeZiel).toBeDefined();expect(fuehreRessortForderungsHilfeAus(w,p).ok).toBe(true);
 expect(w.spiel!.zusagen).toEqual(p.zusagen);expect(spur(w).rueckhalt!.forderungen[0]!.status).toBe('offen');expect(haushaltsStand(w)).toEqual(p.sofort);
});
// Seit N4 gilt für Gesetze die Mehrheit der Anwesenden (Art. 96): Die Schwelle steht in der Prognose (votum.schwelle) statt fest 301
test('Stimmenabsprachen zeigen tatsächlichen Preis und buchen den Puffer nur einmal',()=>{
 const w=welt();w.spiel!.lager=[];const a=gesetz(w).aktion,p=ressortForderungsPlan(w,ref(w),a,{art:'absprache'})!;expect(p.moeglich).toBe(true);expect(p.votum!.ja).toBeGreaterThanOrEqual(p.votum!.schwelle);const pk=w.spiel!.kapital;expect(fuehreRessortForderungsHilfeAus(w,p).ok).toBe(true);expect(w.spiel!.kapital).toBe(pk-p.pk);const s=save(w);expect(fuehreRessortForderungsHilfeAus(w,p).ok).toBe(false);expect(save(w)).toBe(s);
});
test('laufendes Gesetz wird nicht dupliziert; Unterstützung kann später separat ausgehandelt werden',()=>{
 const w=welt(),p=gesetz(w);fuehreRessortForderungsHilfeAus(w,p);const lauf=ressortForderungsMassnahmen(w,ref(w)).find(p=>p.aktion.art==='laufend')!;expect(lauf.moeglich).toBe(false);const h=renderToStaticMarkup(<RessortHilfeKarte world={w} p={lauf} onTun={()=>{}}/>);expect(h).toContain(t('rh.laufend'));expect(h).not.toContain(t('rh.einbringen'));
 const k=ressortForderungsPlan(w,ref(w),lauf.aktion,{art:'zugestaendnis',partei:'CHP'})!;expect(k.moeglich).toBe(true);fuehreRessortForderungsHilfeAus(w,k);expect(w.spiel!.gesetze).toHaveLength(1);expect(w.spiel!.gesetze[0]!.stufe).toBe(p.ziel);
});
test('bekannte Duldung endet vor dem Votum und fehlt in der Prognose',()=>{
 const w=welt();fraktion(w,'CHP').duldungBis=w.day+5;const p=gesetz(w);expect(p.votum!.auslaufend.map(p=>p.partei)).toContain('CHP');expect(p.votum!.ja).toBeLessThan(p.votum!.heuteJa);
});
test('kleinerer Eingriff mindert Preis und politischen Ausschlag, ohne geringere Wirkungszeit zu versprechen',()=>{
 const w=welt(),pl=ressortForderungsMassnahmen(w,ref(w));const klein=pl.find(p=>p.aktion.art==='gesetz'&&p.fach.begrenzt)!,gross=pl.find(p=>p.aktion.art==='gesetz'&&p.aktion.id===klein.aktion.id&&!p.fach.begrenzt)!;
 expect(klein.pk).toBeLessThanOrEqual(gross.pk);expect(Math.abs(klein.kostenBip)).toBeLessThanOrEqual(Math.abs(gross.kostenBip));expect(klein.fach.monate).toBe(gross.fach.monate);
});
test('direkter Etatweg bezahlt Nachtrag und zeigt Minister- sowie Legitimitätsfolgen',()=>{
 const w=welt(),p=ressortForderungsMassnahmen(w,ref(w)).find(p=>p.aktion.art==='etat'&&p.moeglich)!;expect(p).toBeDefined();expect(p.votum).toBeUndefined();expect(p.sofort.legitimitaet).toBeLessThan(p.vorher.legitimitaet);const pk=w.spiel!.kapital;expect(fuehreRessortForderungsHilfeAus(w,p).ok).toBe(true);expect(w.spiel!.kapital).toBe(pk-p.pk);expect(haushaltsStand(w)).toEqual(p.sofort);
});
test('unbezahlbares Paket verliert keine bereits bezahlte Teilverhandlung',()=>{
 const w=welt(),a=gesetz(w).aktion;w.spiel!.kapital=-19;const p=ressortForderungsPlan(w,ref(w),a,{art:'gespraech',partei:'YENİ'})!,s=save(w);expect(p.moeglich).toBe(false);expect(fuehreRessortForderungsHilfeAus(w,p).ok).toBe(false);expect(save(w)).toBe(s);
});
test.each(['kapital','fraktion','forderung','minister','frist','datum'] as const)('Änderung von %s entwertet Angebot ohne Teilbuchung',art=>{
 const w=welt(),p=gesetz(w);if(art==='kapital')w.spiel!.kapital-=0.1;if(art==='fraktion')fraktion(w,'CHP').bereitschaft-=1;if(art==='forderung')spur(w).rueckhalt!.forderungen[0]!.ziel-=1;if(art==='minister')w.spiel!.figuren.find(f=>f.amt==='inneres')!.name='Nachfolge';if(art==='frist')spur(w).rueckhalt!.forderungen[0]!.frist+=1;if(art==='datum')zeit(w,1);const s=save(w);expect(fuehreRessortForderungsHilfeAus(w,p).ok).toBe(false);expect(save(w)).toBe(s);
});
test('Erfüllung, entfallene Vertretung und supersedierte Beobachtung sperren teure alte Wege',()=>{
 for(const art of ['erfuellt','sitze','abgeloest']){const w=welt(),r=ref(w),p=gesetz(w);if(art==='erfuellt')wert(w,'kriminalitaet',60);if(art==='sitze')w.parliament!.seats['YENİ']=0;if(art==='abgeloest')spur(w).status='abgeloest';const s=save(w);expect(ressortForderungsSperre(w,r)).toBeDefined();expect(fuehreRessortForderungsHilfeAus(w,p).ok).toBe(false);expect(save(w)).toBe(s);}
});
test('Pause verhindert Paket, und fremde unpassende Maßnahme kann nicht eingeschleust werden',()=>{
 const w=welt(),a=gesetz(w).aktion;w.spiel!.verfassung!.pauseBis=w.day+3;const p=ressortForderungsPlan(w,ref(w),a)!;expect(p.moeglich).toBe(false);expect(ressortForderungsPlan(w,ref(w),{art:'gesetz',id:'m_forschung',ziel:100})).toBeUndefined();
});
test('eingeschlagener Weg bleibt nach Speichern/Laden erhalten, Forderungsziel und Frist unverändert',()=>{
 const w=welt(),f=structuredClone(spur(w).rueckhalt!.forderungen[0]);fuehreRessortForderungsHilfeAus(w,gesetz(w));const k=load(save(w));expect(spur(k).hilfen).toEqual(spur(w).hilfen);expect(spur(k).rueckhalt!.forderungen[0]).toEqual(f);
});
test('Kompromisssuche bleibt zustandsneutral und nennt höchstens vier tatsächlich vergleichbare Angebote',()=>{
 const w=welt(),p=gesetz(w),s=save(w),pl=ressortForderungsKompromisse(w,ref(w),p.aktion);expect(pl.length).toBeGreaterThan(0);expect(pl.length).toBeLessThanOrEqual(4);expect(pl.every(p=>p.kompromiss)).toBe(true);expect(save(w)).toBe(s);
});
test.each(['de','en','tr'] as const)('Handlungs- und Kompromisskarten auf %s sind verständlich, vollständig und zustandsneutral',async lang=>{
 await setzeSprache(lang);const w=welt(),p=ressortForderungsPlan(w,ref(w),gesetz(w).aktion,{art:'duldung',partei:'CHP'})!,s=save(w);
 const h=renderToStaticMarkup(<RessortHilfeKarte world={w} p={p} onTun={()=>{}}/>);expect(h).toContain(t('rh.neueZusagen'));expect(h).toContain(t('rh.annahme'));expect(h).not.toContain('⟦');expect(h).not.toContain('NaN');
 const live=renderToStaticMarkup(<RessortErholung world={w}/>),historisch=renderToStaticMarkup(<RessortErholungsVerlauf beobachtungen={aktiveRessortNachsorge(w)}/>);expect(live).toContain(t('rh.oeffnen'));expect(historisch).not.toContain(t('rh.oeffnen'));expect(save(w)).toBe(s);
 expect(renderToStaticMarkup(<RessortForderungsWege world={w} bezug={ref(w)}/>)).toContain('aria-expanded="false"');
 for(const k of Object.keys(katalogVon('de')).filter(k=>k.startsWith('rh.'))){expect(katalogVon(lang)[k]).toBeDefined();expect(platzhalter(katalogVon(lang)[k]!)).toEqual(platzhalter(katalogVon('de')[k]!));}
});

test('Haushaltsfenster sperrt den sofortigen Nachtrag und bucht keinen kostenlosen Ersatz',()=>{
 const w=welt();w.date='2028-10-15';const p=ressortForderungsMassnahmen(w,ref(w)).find(p=>p.aktion.art==='etat')!;expect(p).toBeDefined();expect(p.moeglich).toBe(false);const s=save(w);expect(fuehreRessortForderungsHilfeAus(w,p).ok).toBe(false);expect(save(w)).toBe(s);
});
test('bereits wirksames Umsetzungsziel verhindert eine doppelt bezahlte gleichgerichtete Neueinbringung',()=>{
 const w=welt(),p=gesetz(w);w.net.targets[p.aktion.id]=p.ziel;const pl=ressortForderungsMassnahmen(w,ref(w));expect(pl.some(x=>x.aktion.art==='gesetz'&&x.aktion.id===p.aktion.id)).toBe(false);
});
test('schwacher Partner bleibt trotz Vertrag ein sichtbares Risiko, Gespräch verbessert den tatsächlichen Rückhalt',()=>{
 const w=welt();const chef=w.spiel!.figuren.find(f=>f.imAmt&&f.amt==='partner'&&f.partei==='YENİ')!;chef.loyalitaet=19;const a=gesetz(w).aktion,p=ressortForderungsPlan(w,ref(w),a)!;expect(p.risiken.some(r=>r.partei==='YENİ'&&r.phase==='sofort')).toBe(true);
 const k=ressortForderungsPlan(w,ref(w),a,{art:'gespraech',partei:'YENİ'})!;expect(k.risiken.some(r=>r.partei==='YENİ'&&r.phase==='sofort')).toBe(false);expect(fuehreRessortForderungsHilfeAus(w,k).ok).toBe(true);expect(w.spiel!.figuren.find(f=>f.id===chef.id)!.loyalitaet).toBe(24);
});
test('erst neue Messung bewertet Forderung; Handlungsbeleg bleibt historisch und im Monatsformat lesbar',()=>{
 const w=welt(),p=gesetz(w);fuehreRessortForderungsHilfeAus(w,p);const z=structuredClone(spur(w)),b=JSON.stringify(z.hilfen);expect(spur(w).rueckhalt!.forderungen[0]!.status).toBe('offen');
 wert(w,'kriminalitaet',spur(w).rueckhalt!.forderungen[0]!.ziel);zeit(w,14);ressortNachsorgeTag(w);expect(spur(w).rueckhalt!.forderungen[0]!.status).toBe('erreicht');expect(JSON.stringify(spur(w).hilfen)).toBe(b);expect(z.rueckhalt!.forderungen[0]!.status).toBe('offen');
 const h=renderToStaticMarkup(<RessortErholungsVerlauf beobachtungen={[z]}/>);expect(h).toContain(t('rh.verlauf'));expect(h).not.toContain(t('rh.oeffnen'));expect(h).toContain(p.name);
});
