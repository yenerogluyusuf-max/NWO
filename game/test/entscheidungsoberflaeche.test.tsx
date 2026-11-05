import { POSTEN } from '../src/sim/haushalt';
import { afterEach, expect, test, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createWorld, save } from '../src/sim/world';
import { turkey2026 } from '../src/sim/scenario';
import { startAfterElection, schnellProfil } from '../src/sim/prolog';
import { haushaltZustand, defizitJetzt } from '../src/sim/wirtschaft';
import { setzeEntwurf, setzePosten, postenVorschau, bringeHaushaltsgesetzEin, haushaltszyklusTag, stufeVon } from '../src/sim/haushalt';
import { haushaltsPostenEntscheidung, fuehreHaushaltsPostenAus, haushaltsEntscheidung } from '../src/sim/haushaltsentscheidung';
import { ministerFuer } from '../src/sim/ministerfluss-kern';
import { wertVon } from '../src/sim/personen';
import { fraktion } from '../src/sim/fraktionen';
import { addDays, formatDateDe } from '../src/sim/dates';
import { Rng } from '../src/sim/rng';
import { behoerden } from '../src/sim/behoerden';
import { EntscheidungsWege } from '../src/ui/entscheidungen/EntscheidungsWege';
import { HaushaltsEntwurf } from '../src/ui/wirtschaft/HaushaltsEntwurf';
import { Uebersicht } from '../src/ui/akte/Uebersicht';
import { Haushalt } from '../src/ui/wirtschaft/Haushalt';
import { setzeSprache, t, katalogVon, platzhalter } from '../src/i18n';
import de from '../src/i18n/katalog/de/entscheidungsoberflaeche.json';
const noop=()=>{};
function welt(datum='2028-11-02') {
 const w=createWorld(turkey2026,17);startAfterElection(w,{...schnellProfil(),buendnis:'YENİ'});
 w.day=100;w.date=datum;w.spiel!.kapital=100;w.spiel!.ereignisse=[];w.spiel!.gesetze=[];
 const z=haushaltZustand(w);z.entwurf={};z.gesetz=null;z.zyklusJahr=2027;
 return w;
}
afterEach(async()=>{await setzeSprache('de');});

test.each(['2028-10-12','2028-11-02'])('Postenvorschau am %s ist neutral und bucht beim Klick exakt den angegebenen Preis',date=>{
 const w=welt(date),s=save(w),p=haushaltsPostenEntscheidung(w,'investitionen',1)!;
 expect(p.ok).toBe(true);expect(save(w)).toBe(s);const pk=w.spiel!.kapital,leg=wertVon(w,'legitimitaet'),f=ministerFuer(w,'wirtschaft')!,loy=f.loyalitaet;
 expect(fuehreHaushaltsPostenAus(w,p).ok).toBe(true);expect(w.spiel!.kapital).toBe(pk-p.pk);
 expect(wertVon(w,'legitimitaet')-leg).toBeCloseTo(p.legitimitaet);expect(f.loyalitaet-loy).toBe(p.loyalitaet);
 expect(stufeVon(w,'investitionen')).toBe(date.includes('-10-')?0:1);
});
test('Entwurf kann ohne Nachtrag und ohne Persönlichkeitsbonus auf den heutigen Stand zurückgenommen werden',()=>{
 const w=welt('2028-10-12');setzeEntwurf(w,'investitionen',2);expect(postenVorschau(w,'investitionen',0).ok).toBe(false);
 const p=haushaltsPostenEntscheidung(w,'investitionen',0)!,s=save(w);expect(p).toMatchObject({ok:true,entfernen:true,pk:0,loyalitaet:0,legitimitaet:0});expect(save(w)).toBe(s);
 expect(fuehreHaushaltsPostenAus(w,p).ok).toBe(true);expect(haushaltZustand(w).entwurf?.investitionen).toBeUndefined();expect(stufeVon(w,'investitionen')).toBe(0);
});
test('ein bereits laufendes Haushaltsgesetz sperrt den vermeintlich bezahlbaren Nachtrag vor dem Klick',()=>{
 const w=welt('2028-10-12');setzeEntwurf(w,'investitionen',1);bringeHaushaltsgesetzEin(w);
 expect(postenVorschau(w,'investitionen',2).ok).toBe(true);const p=haushaltsPostenEntscheidung(w,'investitionen',2)!,s=save(w);
 expect(p.ok).toBe(false);expect(p.grund).toBe(t('haushalt.fehler.im_parlament'));
 expect(fuehreHaushaltsPostenAus(w,p).ok).toBe(false);expect(save(w)).toBe(s);
});
test('unveränderter Entwurf wird nicht erneut als Änderung angeboten',()=>{
 const w=welt('2028-10-12');setzeEntwurf(w,'investitionen',2);expect(haushaltsPostenEntscheidung(w,'investitionen',2)).toMatchObject({ok:false,grund:t('eo.keineAenderung')});
});
test.each(['kapital','monat','posten','amtsende'] as const)('geänderter Zustand %s kann keinen alten Haushaltsklick buchen',art=>{
 const w=welt(art==='monat'?'2028-10-28':'2028-11-02'),p=haushaltsPostenEntscheidung(w,'investitionen',1)!;
 if(art==='kapital')w.spiel!.kapital=-100;if(art==='monat')w.date='2028-10-29';if(art==='posten')setzePosten(w,'investitionen',1,true);
 if(art==='amtsende')w.spiel!.ende={art:'abwahl',tag:w.day,datum:w.date,titel:'Abwahl',text:'Ende'};
 const s=save(w);expect(fuehreHaushaltsPostenAus(w,p).ok).toBe(false);expect(save(w)).toBe(s);
});
test('Annahme des echten Haushaltsgesetzes erreicht die gemeinsam vorgerechnete Defizitsumme',()=>{
 const w=welt('2028-10-12');setzeEntwurf(w,'investitionen',2);setzeEntwurf(w,'landwirtschaft',-1);
 const s=save(w),p=haushaltsEntscheidung(w)!;expect(save(w)).toBe(s);expect(p.nach).not.toBe(p.vor);
 bringeHaushaltsgesetzEin(w);const g=haushaltZustand(w).gesetz!;w.date=addDays(w.date,g.abstimmung-w.day);w.day=g.abstimmung;
 const rng=new Rng(5);rng.normal=()=>600;haushaltszyklusTag(w,rng);
 expect(haushaltZustand(w).letztesErgebnis).toBe('angenommen');expect(defizitJetzt(w)).toBeCloseTo(p.nach);
});
test('leerer und bereits eingebrachter Entwurf liefern keine zweite Einbringkarte',()=>{
 const w=welt('2028-10-12');expect(haushaltsEntscheidung(w)).toBeUndefined();setzeEntwurf(w,'investitionen',1);bringeHaushaltsgesetzEin(w);expect(haushaltsEntscheidung(w)).toBeUndefined();
});
test('Haushaltsvorschau berücksichtigt Duldungsende und stellt Bedingungen vor die Einbringung',()=>{
 const w=welt('2028-10-12');setzeEntwurf(w,'investitionen',1);w.parliament!.seats={[w.player!.partei.kurz]:200,'YENİ':120,MHP:280};fraktion(w,'MHP').duldungBis=w.day+2;
 const p=haushaltsEntscheidung(w)!,html=renderToStaticMarkup(<HaushaltsEntwurf world={w} onErgebnis={noop}/>);
 expect(p.prognose.auslaufend.some(p=>p.partei==='MHP')).toBe(true);
 for(const text of [t('eo.gesamtDefizit'),formatDateDe(p.prognose.datum),t('eo.ablehnung')])expect(html.indexOf(text)).toBeLessThan(html.indexOf('<footer>'));
});
const wege=[{id:'a',titel:'Erster Weg',kurz:'Beschreibung A',preis:'4 PK'},{id:'b',titel:'Zweiter Weg',kurz:'Beschreibung B',preis:'6 PK'}];
test('bloßes Öffnen der Alternativen baut keine teure ausführliche Vorschau auf und führt nichts aus',()=>{
 const inhalt=vi.fn(()=>null),waehlen=vi.fn();const html=renderToStaticMarkup(<EntscheidungsWege wege={wege} inhalt={inhalt} onWahl={waehlen}/>);
 expect(inhalt).not.toHaveBeenCalled();expect(waehlen).not.toHaveBeenCalled();expect(html).toContain(t('eo.auswahlHinweis'));expect(html).toContain('aria-expanded="false"');
});
test('eine ausgewählte Alternative baut genau ihren Inhalt auf, veraltete Auswahl keinen Ersatz',()=>{
 const inhalt=vi.fn(id=><p>{id}</p>);renderToStaticMarkup(<EntscheidungsWege wege={wege} wahl="b" inhalt={inhalt}/>);
 expect(inhalt.mock.calls).toEqual([['b']]);inhalt.mockClear();renderToStaticMarkup(<EntscheidungsWege wege={wege} wahl="entfallen" inhalt={inhalt}/>);expect(inhalt).not.toHaveBeenCalled();
});
test('Haushaltstafel zeigt alle Posten mit Regler auf einen Blick und die Bilanz als Balken (Democracy 4)',()=>{
 const w=welt('2028-06-05');const html=renderToStaticMarkup(<Haushalt world={w} geaendert={noop}/>);
 expect(html).toContain('hd-bilanz');expect(html).toContain('hd-spur');
 const regler=(html.match(/type="range"/g)??[]).length;expect(regler).toBe(POSTEN.length);
 expect(html).not.toContain('NaN');expect(html).not.toContain('⟦');
});
test.each(['de','en','tr'] as const)('Haushaltsarbeitsplatz, Entscheidungskarten und Katalog auf %s',async lang=>{
 await setzeSprache(lang);const w=welt('2028-10-12');setzeEntwurf(w,'investitionen',1);const s=save(w),html=renderToStaticMarkup(<Haushalt world={w} geaendert={noop}/>);
 expect(html).toContain(t('eo.haushalt'));expect(html).toContain(t('eo.gesamtDefizit'));expect(html).not.toContain('class="ub-detail"');expect(html).not.toContain('⟦');expect(html).not.toContain('NaN');expect(abweichungen(JSON.parse(s),JSON.parse(save(w)))).toEqual([]);
 for(const key of Object.keys(de)){expect(katalogVon(lang)[key]).toBeDefined();expect(platzhalter(katalogVon(lang)[key]!)).toEqual(platzhalter(katalogVon('de')[key]!));}
});

function abweichungen(a:unknown,b:unknown,pfad=''):string[] {
 if(JSON.stringify(a)===JSON.stringify(b))return [];
 if(!a||!b||typeof a!=='object'||typeof b!=='object')return [pfad];
 return [...new Set([...Object.keys(a),...Object.keys(b)])].flatMap(k=>abweichungen((a as Record<string,unknown>)[k],(b as Record<string,unknown>)[k],pfad+'.'+k));
}

test.each([2027,2028])('Bilanz lässt das Behördenjahr %s unverändert und erklärt den angezeigten Verbrauch',jahr=>{
 const w=welt();behoerden(w).etat={jahr,genutzt:{innere_sicherheit:0.1},defizit:{innere_sicherheit:0.2}};
 const s=save(w),html=renderToStaticMarkup(<Haushalt world={w} geaendert={noop} posten="_bilanz"/>);
 expect(abweichungen(JSON.parse(s),JSON.parse(save(w)))).toEqual([]);
 expect(html).toContain('hh-behoerden');expect(html).not.toContain('hh-behoerden"></p>');
 expect(html).not.toContain('NaN');expect(html).not.toContain('⟦');
 if(jahr===2027)expect(html).toContain(t('haushalt.ui.behoerden.keine'));
 else expect(html).toContain(t('haushalt.posten.innere_sicherheit.name'));
});

test('geöffnete Fachübersicht verbindet genau ihren Eintrag mit einer benannten fokussierbaren Detailfläche',()=>{
 const html=renderToStaticMarkup(<Uebersicht kacheln={[{id:'a',titel:'Behörde A'},{id:'b',titel:'Behörde B'}]} start="b" detail={id=><p>Details {id}</p>}/>);
 const ziel=html.match(/aria-controls="([^"]+)"/)![1];
 expect(html.match(/aria-controls=/g)).toHaveLength(1);
 expect(html).toContain('aria-expanded="false"');expect(html).toContain('aria-expanded="true"');
 expect(html).toContain(`id="${ziel}" tabindex="-1" aria-label="Behörde B"`);
 expect(html).toContain('Details b');expect(html).not.toContain('Details a');
});
