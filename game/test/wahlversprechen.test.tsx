import { afterEach, expect, test } from 'vitest';
import { advance, createWorld, save, load, tick } from '../src/sim/world';
import { turkey2026 } from '../src/sim/scenario';
import { schnellProfil, startAfterElection } from '../src/sim/prolog';
import { verspreche, wahlkampfTag } from '../src/sim/wahlkampf';
import { brecheZusage } from '../src/sim/zusagen';
import { wirke } from '../src/sim/wirkung';
import type { World } from '../src/sim/types';
function welt(){const w=createWorld(turkey2026,6);startAfterElection(w,schnellProfil());w.spiel!.wahltag=w.day+56;advance(w,1);return w;}
function neueRunde(w:World){delete w.spiel!.wahlkampf;w.spiel!.amtszeit++;w.spiel!.wahltag+=1826;w.day=w.spiel!.wahltag-56;wahlkampfTag(w);}

test('erneutes Thema in späterem Wahlkampf erzeugt eigenständige Zusage',()=>{
 const w=welt();verspreche(w,'v_renten');const alt=w.spiel!.zusagen.at(-1)!;brecheZusage(w,alt);
 neueRunde(w);w.spiel!.wahlkampf!.rolle='amt';expect(verspreche(w,'v_renten').ok).toBe(true);
 expect(w.spiel!.zusagen.at(-1)!.id).not.toBe(alt.id);
});
test('ausgeschöpftes Ziel schenkt keinen Beifall und kostet keine AP',()=>{
 const w=welt();wirke(w,'m_renten',100);w.net.targets.m_renten=100;const vor=save(w);
 expect(verspreche(w,'v_renten').ok).toBe(false);expect(save(w)).toBe(vor);
});
test('neues Ziel baut auf beschlossenem Fortschritt auf statt vorhandenen Beschluss erneut zu versprechen',()=>{
 const w=welt();w.net.targets.m_renten=80;expect(verspreche(w,'v_renten').ok).toBe(true);
 expect(w.spiel!.zusagen.at(-1)!.stufeZiel).toBe(100);
});

import { versprechenAngebot } from '../src/sim/wahlkampf';
import { wahlversprechenPlan, gibWahlversprechen } from '../src/sim/wahlversprechen-plan';
import { wahlversprechenThema, freieWahlzusageId } from '../src/sim/wahlversprechen-bezug';
import { bringeEin, gesetzPrognose, setPolicy } from '../src/sim/handeln';
import { vorgaenge, vorgaengeAbgleichen } from '../src/sim/vorgaenge';
import { NET } from '../src/sim/modell';
import { nationalAverage } from '../src/sim/netz';
import { fraktion } from '../src/sim/fraktionen';
import { oeffne, entscheide } from '../src/sim/ereignisse';
import { Rng } from '../src/sim/rng';
import { addDays } from '../src/sim/dates';
import { zusageText } from '../src/sim/zusagen';

// Unabhängige Preis-/Buchungsprüfung: keine Gesetzeswirkung allein durch eine Wahlkampfrede.
test('Versprechen bucht nur AP und die gezeigten Reaktionen, Ziel und Frist bleiben fest',()=>{
 const w=welt(),alt=save(w),p=wahlversprechenPlan(w,'v_mindestlohn')!;
 expect(save(w)).toBe(alt);const pk=w.spiel!.kapital,auf=w.spiel!.verfassung!.aufmerksamkeit,ap=w.spiel!.wahlkampf!.ap;
 const economy=structuredClone(w.economy),targets=structuredClone(w.net.targets),gesetze=structuredClone(w.spiel!.gesetze);
 const vertrauen=nationalAverage(NET,w.net,'vertrauen_regierung'),gruppen=p.gruppen.map(g=>nationalAverage(NET,w.net,g.id));
 expect(gibWahlversprechen(w,p).ok).toBe(true);
 const z=w.spiel!.zusagen.at(-1)!;expect(z.stufeZiel).toBe(p.zusage.stufeZiel);expect(z.faellig).toBe(p.zusage.faellig);
 expect(w.spiel!.wahlkampf!.ap).toBe(ap-p.ap);expect(w.spiel!.kapital).toBe(pk);expect(w.spiel!.verfassung!.aufmerksamkeit).toBe(auf);
 expect(w.economy).toEqual(economy);expect(w.net.targets).toEqual(targets);expect(w.spiel!.gesetze).toEqual(gesetze);expect(z.erfuellt).toBe(false);
 expect(nationalAverage(NET,w.net,'vertrauen_regierung')-vertrauen).toBeCloseTo(p.vertrauen,9);
 p.gruppen.forEach((g,i)=>expect(nationalAverage(NET,w.net,g.id)-gruppen[i]!).toBeCloseTo(g.delta,9));
 const danach=save(w);expect(gibWahlversprechen(w,p).ok).toBe(false);expect(save(w)).toBe(danach);
 wirke(w,z.massnahme!,5);expect(versprechenAngebot(w,'v_mindestlohn')!.zusage.stufeZiel).toBe(z.stufeZiel);
});
test('offenes altes Thema darf im nächsten Wahlkampf nicht ein zweites Mal Beifall bringen',()=>{
 const w=welt();verspreche(w,'v_renten');const z=w.spiel!.zusagen.at(-1)!;neueRunde(w);w.spiel!.wahlkampf!.rolle='amt';
 const stand=save(w);expect(versprechenAngebot(w,'v_renten')!.bestehend?.id).toBe(z.id);
 expect(verspreche(w,'v_renten').ok).toBe(false);expect(save(w)).toBe(stand);
});
test('neues Versprechen mit Senkung respektiert beschlossene Absenkung und Untergrenze',()=>{
 const w=welt();w.net.targets.m_mwst=5;
 expect(verspreche(w,'v_mwst').ok).toBe(true);expect(w.spiel!.zusagen.at(-1)!.stufeZiel).toBe(0);
 const b=welt();b.net.targets.m_mwst=0;const vor=save(b);expect(verspreche(b,'v_mwst').ok).toBe(false);expect(save(b)).toBe(vor);
});
test('abgeschlossene Altzusagen und ihre Erinnerungen werden nicht mit dem neuen Thema verwechselt',()=>{
 const w=welt();verspreche(w,'v_renten');const alt=w.spiel!.zusagen.at(-1)!;brecheZusage(w,alt);const vorher=structuredClone(alt);
 neueRunde(w);w.date=addDays(w.spiel!.start.datum,w.day);w.spiel!.wahlkampf!.rolle='amt';verspreche(w,'v_renten');const neu=w.spiel!.zusagen.at(-1)!;
 neu.faellig=w.day;const e=oeffne(w,'zusage',new Rng(3),{provinzen:[],staerke:1,daten:{zusage:neu.id}})!;
 w.spiel!.kapital=100;expect(entscheide(w,e.id,'vertroesten',new Rng(4)).ok).toBe(true);
 expect(neu.vertroestet).toBe(1);expect(neu.faellig).toBeGreaterThan(w.day);expect(alt).toEqual(vorher);
 const geladen=load(save(w));expect(geladen.spiel!.zusagen.find(z=>z.id===neu.id)?.wahlversprechen).toEqual(neu.wahlversprechen);
});
test('alte und neue Wohnungszusagen eröffnen je einen eigenen Vorgang ohne Dublette',()=>{
 const w=welt();verspreche(w,'v_wohnen');const alt=w.spiel!.zusagen.at(-1)!;delete alt.wahlversprechen;
 vorgaengeAbgleichen(w);alt.erfuellt=true;alt.abgeschlossen=w.day;
 neueRunde(w);w.spiel!.wahlkampf!.rolle='amt';verspreche(w,'v_wohnen');const neu=w.spiel!.zusagen.at(-1)!;
 vorgaengeAbgleichen(w);vorgaengeAbgleichen(w);
 expect(vorgaenge(w).filter(v=>v.ursprung.art==='wahlversprechen').map(v=>v.ursprung.ref)).toEqual([alt.id,neu.id]);
 expect(wahlversprechenThema(neu)).toBe('v_wohnen');expect(alt.id).not.toBe(neu.id);
});
test('freie Kennung überschreibt weder alte Doppelbelege noch eine vorhandene Rundennummer',()=>{
 const w=welt();verspreche(w,'v_renten');const z=w.spiel!.zusagen.at(-1)!;
 w.spiel!.zusagen.push({...z},{...z,id:`${z.id}--2-4000`});
 expect(freieWahlzusageId(w.spiel!.zusagen,'v_renten',2,4000)).toBe(`${z.id}--2-4000-2`);
});
test('nachfolgende Gesetzeseinbringung kostet exakt die vorher gezeigten Ressourcen und wahrt Duldungsfrist',()=>{
 const w=welt();w.spiel!.kapital=100;w.spiel!.verfassung!.belastung=75;fraktion(w,'CHP').duldungBis=w.day+10;
 const p=wahlversprechenPlan(w,'v_renten')!;expect(p.gesetz.prognose).toBeDefined();gibWahlversprechen(w,p);
 const pk=w.spiel!.kapital,auf=w.spiel!.verfassung!.aufmerksamkeit;
 expect(bringeEin(w,p.def.massnahme,p.zusage.stufeZiel!,null,'gesetz').ok).toBe(true);
 expect(pk-w.spiel!.kapital).toBe(p.gesetz.pk);expect(w.spiel!.verfassung!.aufmerksamkeit).toBe(Math.max(0,auf-p.gesetz.aufmerksamkeit));
 expect(gesetzPrognose(w,w.spiel!.gesetze.at(-1)!)).toEqual(p.gesetz.prognose);
 expect(w.spiel!.zusagen.at(-1)!.erfuellt).toBe(false);expect(w.spiel!.zusagen.at(-1)!.faellig).toBe(p.gesetz.faellig);
});
test.each([null,[6]])('laufender Teilentwurf %s wird weder überschrieben noch als Erfüllung angeboten',provinzen=>{
 const w=welt();w.spiel!.kapital=100;const p=wahlversprechenPlan(w,'v_renten')!;
 expect(bringeEin(w,p.def.massnahme,p.zusage.stufeZiel!-5,provinzen,'gesetz').ok).toBe(true);
 const g=structuredClone(w.spiel!.gesetze[0]),q=wahlversprechenPlan(w,'v_renten')!;
 expect(q.gesetz.laufend).toBe(true);expect(q.gesetz.decktZiel).toBe(false);expect(q.gesetz.ziel).toBe(g!.stufe);
 expect(gibWahlversprechen(w,q).ok).toBe(true);expect(w.spiel!.gesetze[0]).toEqual(g);
});
test('aktuell nicht bezahlbares Gesetz hindert Wahlversprechen nicht, zeigt aber die echte Hürde',()=>{
 const w=welt();w.spiel!.kapital=-100;
 const p=wahlversprechenPlan(w,'v_renten')!;expect(p.moeglich).toBe(true);expect(p.gesetz.grund).toBeTruthy();expect(p.gesetz.prognose).toBeUndefined();
 expect(gibWahlversprechen(w,p).ok).toBe(true);expect(w.spiel!.kapital).toBe(-100);
});
test('veraltetes Ziel oder politische Lage bucht nichts',()=>{
 const w=welt(),p=wahlversprechenPlan(w,'v_renten')!;w.net.targets.m_renten=90;
 const vor=save(w);expect(gibWahlversprechen(w,p).ok).toBe(false);expect(save(w)).toBe(vor);
 const q=wahlversprechenPlan(w,'v_renten')!;fraktion(w,'CHP').duldungBis=w.day+30;
 const stand=save(w);expect(gibWahlversprechen(w,q).ok).toBe(false);expect(save(w)).toBe(stand);
});
test('Nachfolgerrede erstellt keine persönliche Verpflichtung und behauptet keine neue Frist',()=>{
 const w=welt();w.spiel!.wahlkampf!.rolle='nachfolger';const n=w.spiel!.zusagen.length;
 const p=wahlversprechenPlan(w,'v_renten')!,r=gibWahlversprechen(w,p);
 expect(r.ok).toBe(true);expect(w.spiel!.zusagen).toHaveLength(n);expect(r.text).toContain('keine eigene neue Zusage');
});
test('Erfüllung des neuen Landesziels lässt den historischen Bruch unverändert',()=>{
 const w=welt();verspreche(w,'v_renten');const alt=w.spiel!.zusagen.at(-1)!;brecheZusage(w,alt);const historie=structuredClone(alt);
 neueRunde(w);w.spiel!.wahlkampf!.rolle='amt';verspreche(w,'v_renten');const neu=w.spiel!.zusagen.at(-1)!;
 setPolicy(w,neu.massnahme!,neu.stufeZiel!);expect(neu.erfuellt).toBe(true);expect(alt).toEqual(historie);
});

import { renderToStaticMarkup } from 'react-dom/server';
import { WahlversprechenKarte } from '../src/ui/Wahlversprechen';
import { setzeSprache, katalogVon, platzhalter, t } from '../src/i18n';
afterEach(async()=>{await setzeSprache('de');});
test.each(['de','en','tr'] as const)('%s: Ziel, Frist, Gesetzeskosten und gespeicherte Zusage werden übersetzt',async lang=>{
 await setzeSprache(lang);const w=welt();w.spiel!.kapital=100;
 const p=wahlversprechenPlan(w,'v_renten')!,html=renderToStaticMarkup(<WahlversprechenKarte world={w} plan={p} ausfuehren={()=>{}}/>);
 expect(html).not.toMatch(/NaN|undefined|⟦|wv\./);expect(html).toContain(t('wv.frist'));expect(html).toContain(t('wv.land'));expect(html).toContain('TRY');
 expect(gibWahlversprechen(w,p).ok).toBe(true);const z=w.spiel!.zusagen.at(-1)!;expect(z.von).toBe('Wähler');expect(zusageText(z)).toContain(t('wv.name.v_renten'));
 expect(z.text).toContain('Im Wahlkampf versprochen');
 const de=katalogVon('de'),k=katalogVon(lang);for(const key of Object.keys(de).filter(k=>k.startsWith('wv.'))){expect(k[key]).toBeDefined();expect(platzhalter(k[key]!)).toEqual(platzhalter(de[key]!));}
});

test('Vorschau der Annahme entspricht dem späteren Beschluss, nicht dem Beifall der Rede',()=>{
 const w=welt();w.spiel!.kapital=100;
 const p=wahlversprechenPlan(w,'v_mindestlohn')!,figuren=structuredClone(w.spiel!.figuren);
 gibWahlversprechen(w,p);expect(w.spiel!.figuren).toEqual(figuren);
 setPolicy(w,p.def.massnahme,p.zusage.stufeZiel!,null);
 for(const f of p.reaktionen)expect(w.spiel!.figuren.find(n=>n.id===f.id)!.loyalitaet).toBeCloseTo(f.nachher,8);
});
test('echter Tageslauf: neue Zusage wird beim Votum erfüllt, alter Bruch bleibt historisch',()=>{
 const w=welt();verspreche(w,'v_renten');const alt=w.spiel!.zusagen.at(-1)!;brecheZusage(w,alt);const historisch=structuredClone(alt);
 // Neuer Wahlkampf als Fixture; die folgenden Tage und das Votum laufen durch die echte Spielschleife.
 neueRunde(w);w.date=addDays(w.spiel!.start.datum,w.day);w.spiel!.wahlkampf!.rolle='amt';
 w.parliament!.seats={[w.player!.partei.kurz]:600};w.spiel!.lager=[];w.spiel!.kapital=150;
 const p=wahlversprechenPlan(w,'v_renten')!;expect(gibWahlversprechen(w,p).ok).toBe(true);const neu=w.spiel!.zusagen.at(-1)!;
 expect(bringeEin(w,p.def.massnahme,neu.stufeZiel!,null,'gesetz').ok).toBe(true);
 const votum=w.spiel!.gesetze.at(-1)!.abstimmung;
 while(w.day<votum&&!w.spiel!.ende)tick(w);
 expect(w.spiel!.ende).toBeUndefined();expect(w.day).toBe(votum);expect(neu.erfuellt).toBe(true);
 expect(neu.abgeschlossen).toBe(votum);expect(w.net.targets.m_renten).toBe(neu.stufeZiel);expect(alt).toEqual(historisch);
});

test('Monatsprüfung nach Zielbeschluss und heutige Gefahr bleiben zeitlich getrennt',()=>{
 const w=welt();w.date='2028-06-25';w.spiel!.kapital=100;
 const partner=w.spiel!.figuren.find(f=>f.imAmt&&f.amt==='partner'&&w.spiel!.lager.includes(f.partei!));
 expect(partner).toBeDefined();partner!.loyalitaet=19;
 const p=wahlversprechenPlan(w,'v_renten')!;expect(p.gesetz.prognose!.datum > '2028-07-01').toBe(true);
 expect(p.pruefungJetzt).toBe('2028-07-01');expect(p.pruefung).toBe('2028-08-01');expect(p.jetztRisiken.some(f=>f.name===partner!.name)).toBe(true);
});
test('Teilvorhaben liefert keinen erfundenen Termin für die spätere Zielerfüllung',()=>{
 const w=welt();w.spiel!.kapital=100;const a=versprechenAngebot(w,'v_renten')!;
 bringeEin(w,a.def.massnahme,a.zusage.stufeZiel!-5,null,'gesetz');
 expect(wahlversprechenPlan(w,'v_renten')!.pruefung).toBeUndefined();
});
