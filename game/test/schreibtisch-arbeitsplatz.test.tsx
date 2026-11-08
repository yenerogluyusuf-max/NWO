import { afterEach, describe, expect, test } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createWorld, save } from '../src/sim/world';
import { turkey2026 } from '../src/sim/scenario';
import { startAfterElection, schnellProfil } from '../src/sim/prolog';
import { aktiveParteivorsitzende } from '../src/sim/koalitionslage';
import { fraktion } from '../src/sim/fraktionen';
import { verfassungVon } from '../src/sim/aufmerksamkeit';
import { AEMTER, eigenVon, HOCH_SCHLECHT, wertVon } from '../src/sim/personen';
import { wirke } from '../src/sim/wirkung';
import { addDays } from '../src/sim/dates';
import { ressortAnliegenTag } from '../src/sim/ressortanliegen';
import { offeneRessortVorfaelle, ressortPolitikPlan, entscheideRessortVorfall } from '../src/sim/ressortpolitik';
import { gefaehrdeteZusagen, zusagenSchrittPlan, fuehreZusagenSchrittAus } from '../src/sim/zusagenwarnung';
import { schreibtischMappe } from '../src/sim/ministerfluss';
import { stimmenPrognose } from '../src/sim/handeln';
import { gueterZustand } from '../src/sim/gueter';
import { haushaltZustand } from '../src/sim/wirtschaft';
import type { Vorlage } from '../src/sim/ministerfluss-typen';
import { tageslage, type Warnung } from '../src/ui/schreibtisch/briefing';
import { aktuelleAuswahl, fristText, regierungsVorgaenge, schreibtischArbeit } from '../src/ui/schreibtisch/arbeitsplatz';
import { Schreibtisch, SchreibtischEntscheidungen, SchreibtischInArbeit, SchreibtischRueckblick } from '../src/ui/schreibtisch/Schreibtisch';
import { Mappe } from '../src/ui/minister/Mappe';
import { setzeSprache, t, katalogVon, platzhalter } from '../src/i18n';
import de from '../src/i18n/katalog/de/schreibtischarbeit.json';
const noop=()=>{};
function welt() {
  const w=createWorld(turkey2026,17);startAfterElection(w,{...schnellProfil(),buendnis:'YENİ'});
  w.day=60;w.date='2028-06-25';w.spiel!.start.datum=addDays(w.date,-60);w.spiel!.kapital=100;
  w.spiel!.zusagen=[];w.spiel!.gesetze=[];w.spiel!.ereignisse=[];
  w.parliament!.seats={[w.player!.partei.kurz]:200,'YENİ':120,CHP:200,MHP:50,DEM:30};
  fraktion(w,'YENİ').bereitschaft=60;aktiveParteivorsitzende(w,'YENİ')[0]!.loyalitaet=50;verfassungVon(w).belastung=0;
  return w;
}
type Welt=ReturnType<typeof welt>;
function zusage(w:Welt,id='rente') {
  const z={id,von:'YENİ',text:`Zusage ${id}`,faellig:w.day+2,massnahme:'m_renten',richtung:1 as const,stufeStart:20,stufeZiel:40,erfuellt:false,gebrochen:false};w.spiel!.zusagen.push(z);return z;
}
function vorlage(id:string,frist?:number,quelle:Vorlage['quelle']='lage'):Vorlage {
  return {id,thema:id,art:'vorschlag',quelle,amt:'wirtschaft',titel:`Vorlage ${id}`,anlass:[],optionen:[],tag:60,prioritaet:70,prioritaetGrund:'Grund',frist};
}
function arbeit(w:Welt) {return schreibtischArbeit(w,tageslage(w),schreibtischMappe(w,5).mappe,gefaehrdeteZusagen(w));}
function ministerWelt() {
  const w=welt();
  for(const f of w.spiel!.figuren) {
    const e=eigenVon(w,f);e.groll=0;f.loyalitaet=60;
    if(AEMTER[f.amt].regierungsamt)for(const id of AEMTER[f.amt].fach)wirke(w,id,(HOCH_SCHLECHT.has(id)?10:90)-wertVon(w,id));
  }
  const f=w.spiel!.figuren.find(f=>f.amt==='inneres'&&f.imAmt)!;f.partei='YENİ';f.gespraech=-100;
  Object.assign(eigenVon(w,f),{ehrgeiz:30,faehigkeit:70,stil:'vorsichtig',groll:0});
  wirke(w,'kriminalitaet',90-wertVon(w,'kriminalitaet'));ressortAnliegenTag(w);
  w.day+=30;w.date=addDays(w.date,30);ressortAnliegenTag(w);return w;
}
afterEach(async()=>{await setzeSprache('de');});

describe('Regierungsschreibtisch als Arbeitsablauf',()=>{
  test('akute Zusage steht vor gewöhnlichen Vorlagen und erscheint nicht doppelt',()=>{
    const w=welt(),z=zusage(w);aktiveParteivorsitzende(w,'YENİ')[0]!.loyalitaet=19;
    const v=vorlage('zusage');v.optionen=[{id:'einloesen',label:'Einlösen',aktion:{art:'zusage',zusageId:z.id,weg:'einloesen'},kosten:{pk:1,aufmerksamkeit:1},folgen:[]} as unknown as Vorlage['optionen'][number]];
    const a=schreibtischArbeit(w,{warnungen:[],faellig:[]},[vorlage('normal'),v],gefaehrdeteZusagen(w));
    expect(a.highlights[0]!.id).toBe(`z-${z.id}`);expect(a.highlights.some(p=>p.id==='v-zusage')).toBe(false);
    expect(a.highlights[0]!.sprung).toEqual({art:'intern',auswahl:{bereich:'entscheiden',gruppe:'zusagen',id:z.id}});
  });
  test('eine Ereignisfrist und ihre Vorlage belegen nur einen hervorgehobenen Platz',()=>{
    const w=welt(),v=vorlage('ereignis',1,'ereignis');v.optionen=[{id:'a',aktion:{art:'ereignis',ereignisId:'fristfall',optionId:'a'}} as Vorlage['optionen'][number]];
    const warn:Warnung={id:'frist-fristfall',stufe:'rot',text:'Frist',warum:'Heute',ziel:{art:'ereignis',id:'fristfall'}};
    const a=schreibtischArbeit(w,{warnungen:[warn],faellig:[]},[v],[]);
    expect(a.highlights.map(p=>p.id)).toEqual(['v-ereignis']);
  });
  test('fällige Vorlagen werden nach wirklicher Restzeit geordnet, höchstens drei hervorgehoben',()=>{
    // Probleme des Landes sind eigene Einträge; Vorlagen eines Ministers stehen seit 06.11.2026 in einem Eintrag je Ressort (Test unten)
    const a=schreibtischArbeit(welt(),{warnungen:[],faellig:[]},[vorlage('normal',undefined,'problem'),vorlage('morgen',1,'problem'),vorlage('heute',0,'problem'),vorlage('alt',-2,'problem')],[]);
    expect(a.highlights.map(p=>p.id)).toEqual(['v-alt','v-heute','v-morgen']);expect(fristText(-2)).toContain('überfällig');
  });
  test('erledigte Auswahl fällt niemals automatisch auf die nächste Entscheidung zurück',()=>{
    const liste=[{id:'zweite'}];expect(aktuelleAuswahl(liste,'erste')).toBeUndefined();expect(aktuelleAuswahl(liste,undefined)).toBeUndefined();expect(aktuelleAuswahl(liste,'zweite')).toBe(liste[0]);
  });
  test('echte Ministeranfrage führt zum passenden Ressort; ein ausgeschiedener Inhaber verschwindet sofort',()=>{
    const w=ministerWelt(),a=arbeit(w);expect(a.minister.some(m=>m.amt==='inneres')).toBe(true);
    const p=a.highlights.find(p=>p.id==='r-inneres');expect(p!.sprung).toEqual({art:'intern',auswahl:{bereich:'entscheiden',gruppe:'minister',id:'inneres'}});
    w.spiel!.figuren.find(f=>f.amt==='inneres'&&f.imAmt)!.imAmt=false;
    expect(arbeit(w).minister.some(m=>m.amt==='inneres')).toBe(false);
  });
  test('reale Verantwortungsentscheidung wandert aus offenen Fällen in die Wirkungskontrolle',()=>{
    const w=ministerWelt();w.day+=14;w.date=addDays(w.date,14);ressortAnliegenTag(w);
    const v=offeneRessortVorfaelle(w)[0]!;expect(v).toBeDefined();expect(arbeit(w).vorfaelle).toHaveLength(1);
    const plan=ressortPolitikPlan(w,v.id,'stuetzen')!;expect(entscheideRessortVorfall(w,plan).ok).toBe(true);
    const neu=arbeit(w);expect(neu.vorfaelle).toHaveLength(0);expect(neu.beobachtet.some(m=>m.amt==='inneres')).toBe(true);
    const html=renderToStaticMarkup(<SchreibtischInArbeit world={w} refresh={noop} onGehe={noop} arbeit={neu} auswahl="inneres" onAuswahl={noop}/>);
    expect(html).toContain(t('rn.titel'));expect(html).toContain(t('rn.status.wartet'));
  });
  test('neue Ergebnisforderung führt zur Wirkungskontrolle mit erreichbaren Hilfen',()=>{
    const w=ministerWelt();w.day+=14;w.date=addDays(w.date,14);ressortAnliegenTag(w);const v=offeneRessortVorfaelle(w)[0]!;
    entscheideRessortVorfall(w,ressortPolitikPlan(w,v.id,'stuetzen')!);
    const n=arbeit(w).nachsorge[0]!;
    expect(n.rueckhalt).toBeDefined();
    n.rueckhalt!.forderungen=[{id:'f',partei:'YENİ',rolle:'koalition',groesse:n.groesse,ausgang:90,ziel:85,seit:w.day,datum:w.date,frist:w.day+1,fristDatum:addDays(w.date,1),status:'offen',stand:90}];
    const a=schreibtischArbeit(w,{warnungen:[],faellig:[]},[],[]);
    expect(a.highlights[0]!.sprung).toEqual({art:'intern',auswahl:{bereich:'arbeit',gruppe:'minister',id:'inneres'}});
    expect(a.beobachtet[0]!.forderungen).toBe(1);
  });
  test('Anzeige der Reihenfolge verändert weder Spielstand noch Fristen',()=>{
    const w=ministerWelt();zusage(w);const b=tageslage(w),m=schreibtischMappe(w,5),z=gefaehrdeteZusagen(w),s=save(w);
    for(let i=0;i<3;i++)schreibtischArbeit(w,b,m.mappe,z);expect(save(w)).toBe(s);
  });
  test('Erfüllung nimmt eine Zusage am selben Tag aus der Priorität',()=>{
    const w=welt(),z=zusage(w);z.stufeStart=0;z.stufeZiel=0;
    expect(gefaehrdeteZusagen(w)).toHaveLength(1);const p=zusagenSchrittPlan(w,z.id,'einloesen')!;
    expect(fuehreZusagenSchrittAus(w,p).ok).toBe(true);expect(z.erfuellt).toBe(true);
    expect(arbeit(w).highlights.some(p=>p.id===`z-${z.id}`)).toBe(false);
  });
  test('fokussierte Mappe zeigt ohne bewusste Auswahl keine Handlungskarte',()=>{
    const w=welt();zusage(w);expect(schreibtischMappe(w,5).mappe.length).toBeGreaterThan(0);
    const html=renderToStaticMarkup(<Mappe world={w} refresh={noop} fokus ohneRessorts vorlageId="erledigte-alte-kennung" onAuswahl={noop}/>);
    expect(html).toContain(t('sd.erledigt'));expect(html).toContain('sd-auswahlkarte');expect(html).not.toContain('class="mf-karte');
  });
  test('fokussierte Mappe zeigt genau eine passende Handlungskarte und keine Ministerberichte',()=>{
    const w=ministerWelt(),m=schreibtischMappe(w,5);expect(m.mappe.length).toBeGreaterThan(0);
    const html=renderToStaticMarkup(<Mappe world={w} refresh={noop} fokus ohneRessorts vorlageId={m.mappe[0]!.id} onAuswahl={noop}/>);
    expect((html.match(/<article class="mf-karte /g)??[]).length).toBe(1);expect(html).toContain('aria-pressed="true"');expect(html).not.toContain(t('ra.titel'));expect(html).not.toContain(t('rn.titel'));
  });
  test('Zusagenbereich begrenzt die Details auf die gewählte Zusage',()=>{
    const w=welt();zusage(w,'erste');zusage(w,'zweite');const z=gefaehrdeteZusagen(w);
    const html=renderToStaticMarkup(<SchreibtischEntscheidungen world={w} refresh={noop} onGehe={noop} arbeit={arbeit(w)} zusagen={z} gruppe="zusagen" auswahl={{zusagen:'erste'}} onAuswahl={noop} onPosteingang={noop}/>);
    expect(html).toContain('zw-schritte-erste');expect(html).not.toContain('zw-schritte-zweite');
  });
});

describe('Laufende Vorhaben und historische Rückmeldungen',()=>{
  test('Haushaltskarte übernimmt tatsächliche Absprachen und auslaufende Duldung zum Votum',()=>{
    const w=welt();haushaltZustand(w).gesetz={jahr:2028,schritte:{polizei:1},eingebracht:w.day,abstimmung:w.day+14,absprachen:31};
    fraktion(w,'CHP').duldungBis=w.day+2;
    const p=stimmenPrognose(structuredClone(w),w.day+14,31),s=save(w),a=regierungsVorgaenge(w)[0]!;
    expect(a.unter).toBe(t('sd.stimmen',{ja:p.ja,luecke:p.luecke}));expect(a.ziel).toEqual({art:'akte',akte:'wirtschaft',start:'haushalt'});expect(save(w)).toBe(s);
    fraktion(w,'CHP').duldungBis=w.day+40;expect(regierungsVorgaenge(w)[0]!.unter).not.toBe(a.unter);
  });
  test('Versorgung unterscheidet offene Abstimmung, Vorlauf, Umsetzung und bereits beendeten Auftrag',()=>{
    const w=welt(),z=gueterZustand(w);z.regierung={programme:{energie:{ab:w.day+10,bis:w.day+180},netz:{ab:w.day-5,bis:w.day+40},schutz:{ab:w.day-90,bis:w.day}},vorlagen:{schutz:{id:'schutz-votum',programm:'schutz',klauseln:[],gespraeche:[],eingebracht:w.day,abstimmung:w.day+7,status:'offen',pk:4}}};
    const s=save(w),v=regierungsVorgaenge(w);
    expect(v.map(x=>x.id)).toEqual(['schutz-votum','programm-energie','programm-netz']);
    expect(v[0]!.status).toBe(t('sd.beratung'));expect(v[1]!.status).toBe(t('sd.vorlauf'));expect(v[2]!.status).toBe(t('sd.aktiv'));
    expect(v[1]!.unter).toContain('Noch kein Nachweis');expect(save(w)).toBe(s);
  });
  test('Rückblick zeigt gespeicherten Monat statt Erfolg aus heutiger Lage zu erfinden',()=>{
    const w=welt();gueterZustand(w).regierung={programme:{},bericht:{monat:'2028-05',deckung:.72,vertrauen:-1,zusatzGas:0,aufpreis:0,reparaturen:0,parlamentarisch:'kritik'}};
    const s=save(w),html=renderToStaticMarkup(<SchreibtischRueckblick world={w} onGehe={noop} onPosteingang={noop}/>);
    expect(html).toContain('2028-05');expect(html).toContain('72,0');expect(html).toContain(t('vm.urteil.kritik'));expect(save(w)).toBe(s);
    expect(html).not.toContain('rh-wege');
  });
  test('fehlender Monatsbeleg zeigt keine erfundene Wirkung',()=>{
    const w=welt();const html=renderToStaticMarkup(<SchreibtischRueckblick world={w} onGehe={noop} onPosteingang={noop}/>);
    expect(html).toContain(t('vm.nochNicht'));
  });
});

describe('Dreisprachige Arbeitsoberfläche',()=>{
  test.each(['de','en','tr'] as const)('%s: Navigation, Auswahl, Berichte und Risiko bleiben verständlich',async lang=>{
    await setzeSprache(lang);const w=welt();zusage(w);aktiveParteivorsitzende(w,'YENİ')[0]!.loyalitaet=19;
    const html=renderToStaticMarkup(<Schreibtisch world={w} refresh={noop} onGehe={noop}/>);
    for(const key of ['h4.frage','h4.reiter.heute','sd.arbeit','sd.rueckblick','h4.reiter.krisenrat','sd.handlungsspielraum'])expect(html).toContain(t(key));
    // Rückmeldung 06.11.2026: Die Entscheidung steht als Karte oben, die Wege sind Knöpfe ohne Aufklappen; Reiter statt Aufklapper
    expect(html).toContain('class="tk2 gross ton-rot"');expect(html).toContain(t('zw.vertroesten'));expect(html).toContain('aria-selected="true"');expect(html).not.toContain('<main');
    expect(html).not.toContain('⟦');expect(html).not.toMatch(/\{(?:n|datum|name|partei)\}/);
    const work=renderToStaticMarkup(<SchreibtischInArbeit world={w} refresh={noop} onGehe={noop} arbeit={arbeit(w)} onAuswahl={noop}/>);
    const review=renderToStaticMarkup(<SchreibtischRueckblick world={w} onGehe={noop} onPosteingang={noop}/>);
    expect(work+review).not.toContain('⟦');
  });
  test.each(['de','en','tr'] as const)('%s: alle neuen Texte vollständig mit gleichen Platzhaltern',async lang=>{
    await setzeSprache(lang);const katalog=katalogVon(lang);
    for(const [key,value] of Object.entries(de)){expect(katalog[key],key).toBeTruthy();expect(platzhalter(katalog[key]!).sort(),key).toEqual(platzhalter(value).sort());}
  });
});
