// Schreibtisch nach der Rückmeldung des Inhabers vom 06.11.2026: Bündelung, ehrliche Dringlichkeit, Verjährung der Ressortvorfälle.
import { describe, expect, test } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createWorld, save } from '../src/sim/world';
import { turkey2026 } from '../src/sim/scenario';
import { startAfterElection, schnellProfil } from '../src/sim/prolog';
import { AEMTER, eigenVon, HOCH_SCHLECHT, wertVon } from '../src/sim/personen';
import { wirke } from '../src/sim/wirkung';
import { addDays } from '../src/sim/dates';
import { ressortAnliegenTag } from '../src/sim/ressortanliegen';
import { offeneRessortVorfaelle, RESSORT_VORFALL_FRIST, ressortPolitikPlan, entscheideRessortVorfall, type RessortVorfall } from '../src/sim/ressortpolitik';
import { flussZustand } from '../src/sim/ministerfluss-kern';
import { gefaehrdeteZusagen } from '../src/sim/zusagenwarnung';
import { schreibtischMappe } from '../src/sim/ministerfluss';
import type { Amt, Vorlage } from '../src/sim/ministerfluss-typen';
import { tageslage, type Warnung } from '../src/ui/schreibtisch/briefing';
import { ehrlicherTon, schreibtischArbeit, tischAnzahl } from '../src/ui/schreibtisch/arbeitsplatz';
import { Schreibtisch } from '../src/ui/schreibtisch/Schreibtisch';
import { t } from '../src/i18n';

const noop=()=>{};
function welt() {
  const w=createWorld(turkey2026,17);startAfterElection(w,{...schnellProfil(),buendnis:'YENİ'});
  w.day=60;w.date='2028-06-25';w.spiel!.kapital=100;w.spiel!.zusagen=[];w.spiel!.gesetze=[];w.spiel!.ereignisse=[];
  return w;
}
type W=ReturnType<typeof welt>;
/** Ein offener Stillstand für das Ressort, so wie ihn erfasseRessortVorfall anlegt */
function stillstand(w:W,amt:Amt,vorTagen=3):RessortVorfall {
  const f=w.spiel!.figuren.find(f=>f.imAmt&&f.amt===amt)!;
  const groesse=AEMTER[amt].fach[0]!,tag=w.day-vorTagen;
  const v={id:`ressort-${amt}-${tag-14}`,figur:f.id,name:f.name,amt,amtsantritt:eigenVon(w,f).seit,tag,datum:addDays(w.date,-vorTagen),art:'stillstand',erfolg:false,
    folge:{id:'x',tag,datum:w.date,name:f.name,amt,groesse,art:'stillstand',vorher:40,nachher:38.5,loyalitaet:0,groll:0,bip:0,legitimitaet:0},
    reaktion:{tag,datum:w.date,art:'vorfall',pk:0,aufmerksamkeit:0,kapitalDanach:0,aufmerksamkeitDanach:0,vertrauen:0,legitimitaet:0,risikoaufschlag:0,glaubwuerdigkeit:0,parteien:[],personen:[]}} as RessortVorfall;
  (flussZustand(w).ressortVorfaelle??=[]).push(v);return v;
}
const arbeit=(w:W,warnungen:Warnung[]=[],mappe:Vorlage[]=[])=>schreibtischArbeit(w,{warnungen,faellig:[]},mappe,gefaehrdeteZusagen(w));
function lageVorlage(amt:Amt,id='lage-1'):Vorlage {
  return {id,thema:id,art:'frage',quelle:'lage',amt,titel:`Vorlage ${id}`,anlass:['Die Lage ist schlecht.'],optionen:[],tag:60,prioritaet:50,prioritaetGrund:'Grund'};
}

describe('Bündelung',()=>{
  test('mehrere stillstehende Ressorts werden ein Eintrag mit Namen, Werten und Reaktionsfrist',()=>{
    const w=welt();stillstand(w,'handel');stillstand(w,'justiz',10);stillstand(w,'kultur',20);
    const a=arbeit(w);
    const b=a.alle.filter(p=>p.inhalt.art==='ressorts');
    expect(b).toHaveLength(1);
    expect(a.alle.some(p=>p.id==='r-handel'||p.id==='r-justiz'||p.id==='r-kultur')).toBe(false);
    const i=b[0]!.inhalt;if(i.art!=='ressorts')throw new Error();
    expect(i.reihen.map(r=>r.amt).sort()).toEqual(['handel','justiz','kultur']);
    expect(Math.min(...i.reihen.map(r=>r.tage))).toBe(RESSORT_VORFALL_FRIST-20);
    expect(b[0]!.titel).toBe(t('h4.still.titel',{n:3}));
  });
  test('pro Ressort höchstens ein Eintrag: Vorfall und Vorlagen desselben Ministers stehen zusammen',()=>{
    const w=welt();stillstand(w,'handel');
    const a=arbeit(w,[],[lageVorlage('handel','a'),lageVorlage('handel','b')]);
    const handel=a.alle.filter(p=>p.amt==='handel'||p.id.includes('handel'));
    expect(handel.map(p=>p.id)).toEqual(['r-handel']);
    const i=handel[0]!.inhalt;if(i.art!=='ressort')throw new Error();
    expect(i.vorfall).toBeDefined();expect(i.vorlagen.map(v=>v.id)).toEqual(['a','b']);
  });
  test('die offene Anfrage eines Ministers wird nicht mehr vom fristlosen Vorfall verdeckt',()=>{
    const w=welt();
    for(const f of w.spiel!.figuren){eigenVon(w,f).groll=0;f.loyalitaet=60;if(AEMTER[f.amt].regierungsamt)for(const id of AEMTER[f.amt].fach)wirke(w,id,(HOCH_SCHLECHT.has(id)?10:90)-wertVon(w,id));}
    const f=w.spiel!.figuren.find(f=>f.amt==='inneres'&&f.imAmt)!;Object.assign(eigenVon(w,f),{ehrgeiz:30,faehigkeit:70,stil:'vorsichtig',groll:0});
    wirke(w,'kriminalitaet',90-wertVon(w,'kriminalitaet'));ressortAnliegenTag(w);w.day+=30;w.date=addDays(w.date,30);ressortAnliegenTag(w);
    stillstand(w,'inneres');
    const r=arbeit(w).alle.find(p=>p.id==='r-inneres')!;
    expect(r.inhalt.art==='ressort'&&r.inhalt.anliegen).toBeTruthy();
    expect(r.titel).toBe(t('h4.r.anliegen.titel',{ressort:t('daten.amt.inneres.ressort')}));
  });
  test('die Forderungen einer Partei an mehrere Ressorts werden ein Eintrag',()=>{
    const w=welt();stillstand(w,'handel');
    const v=offeneRessortVorfaelle(w)[0]!;expect(entscheideRessortVorfall(w,ressortPolitikPlan(w,v.id,'stuetzen')!).ok).toBe(true);
    const n=arbeit(w).nachsorge[0]!;
    const f=(id:string,tage:number)=>({id,partei:'YENİ',rolle:'koalition' as const,groesse:n.groesse,ausgang:40,ziel:42,seit:w.day,datum:w.date,frist:w.day+tage,fristDatum:addDays(w.date,tage),status:'offen' as const,stand:40});
    n.rueckhalt!.forderungen=[f('a',20),f('b',5)];
    const p=arbeit(w).alle.filter(x=>x.inhalt.art==='partei');
    expect(p).toHaveLength(1);expect(p[0]!.id).toBe('p-YENİ');expect(p[0]!.tage).toBe(5);expect(p[0]!.ton).toBe('rot');
    if(p[0]!.inhalt.art==='partei')expect(p[0]!.inhalt.reihen.map(r=>r.forderung)).toEqual(['b','a']);
  });
});

describe('Ehrliche Dringlichkeit',()=>{
  test('Rot nur bis 7 Tage oder bei echter Gefahr, ohne Frist ruhig',()=>{
    expect(ehrlicherTon(7)).toBe('rot');expect(ehrlicherTon(8)).toBe('gelb');expect(ehrlicherTon(undefined)).toBe('ruhig');expect(ehrlicherTon(undefined,true)).toBe('rot');
  });
  test('ein Ressortvorfall ist nicht mehr fristlos dringend',()=>{
    const w=welt();stillstand(w,'handel',3);
    const r=arbeit(w).alle.find(p=>p.id==='r-handel')!;
    expect(r.tage).toBe(RESSORT_VORFALL_FRIST-3);expect(r.ton).toBe('gelb');
  });
  test('Lageberichte ohne eigene Entscheidung stehen in der Lage und zählen nicht am Reiter',()=>{
    const w=welt();
    const warn:Warnung[]=[{id:'opposition',stufe:'rot',text:'Opposition stark',warum:'Eine starke Opposition gewinnt Rathäuser.',ziel:{art:'akte',akte:'waehler'}}];
    const a=arbeit(w,warn);
    expect(a.alle.some(p=>p.id.includes('opposition'))).toBe(false);
    expect(a.lage.map(l=>l.id)).toEqual(['opposition']);
    expect(tischAnzahl(w)).toBe(schreibtischArbeit(w,tageslage(w),schreibtischMappe(w,5).mappe,gefaehrdeteZusagen(w)).alle.length);
  });
});

describe('Verjährung und Anzeige',()=>{
  test('ein Vorfall ohne Reaktion verjährt nach der Reaktionszeit und verschwindet vom Tisch',()=>{
    const w=welt();stillstand(w,'handel',RESSORT_VORFALL_FRIST-1);
    expect(offeneRessortVorfaelle(w)).toHaveLength(1);
    w.day+=1;w.date=addDays(w.date,1);
    expect(offeneRessortVorfaelle(w)).toHaveLength(0);
    ressortAnliegenTag(w);
    expect(flussZustand(w).ressortVorfaelle![0]!.geschlossen).toBe('verjaehrt');
    expect(arbeit(w).alle.some(p=>p.id==='r-handel')).toBe(false);
  });
  test('Anzeigen des Tisches mit Bündel, Kacheln und Lage verändert den Spielstand nicht',()=>{
    const w=welt();stillstand(w,'handel');stillstand(w,'justiz');
    // Eigenschaften der Figuren und Zustände (Programm, Gesellschaft) legt der Monatslauf an; in dieser Testwelt fehlen sie noch, und
    // Lagebericht und Mappe ergänzen sie beim ersten Lesen (älteres Verhalten). Geprüft wird, dass der Tisch darüber hinaus nichts schreibt.
    for(const f of w.spiel!.figuren)eigenVon(w,f);
    tageslage(w);schreibtischMappe(w,5);
    const s=save(w);
    const html=renderToStaticMarkup(<Schreibtisch world={w} refresh={noop} onGehe={noop}/>);
    expect(html).toContain(t('h4.still.titel',{n:2}));expect(html).toContain(t('h4.kurz.stuetzen'));expect(html).toContain(t('h4.frage'));
    expect(html).not.toMatch(/⟦|NaN|undefined|\{(?:n|datum|name|partei)\}/);
    expect(save(w)).toBe(s);
  });
});
