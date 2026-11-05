import { afterEach, describe, expect, test, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Akte, aktenNavigation, type AktenReiter, type AktenReiterId, type AktenZugang } from '../src/ui/akte/Akte';
import { AKTEN_PROFILE, aktenProfil } from '../src/ui/akte/profil';
import { BereichsAkte } from '../src/ui/akte/Bereiche';
import { WirtschaftAkte } from '../src/ui/wirtschaft/Akte';
import { createWorld, save } from '../src/sim/world';
import { turkey2026 } from '../src/sim/scenario';
import { startAfterElection, schnellProfil } from '../src/sim/prolog';
import { gueterSicht } from '../src/sim/gueter';
import { setzeSprache, t, katalogVon, platzhalter } from '../src/i18n';
import de from '../src/i18n/katalog/de/aktennavigation.json';
const noop=()=>{};
const reiter:AktenReiter[]=(['lage','instrumente','verlauf','personen','vorgaenge'] as AktenReiterId[]).map(id=>({id,inhalt:()=>`Inhalt ${id}`}));
const eintraege:AktenZugang[]=[{id:'haushalt',label:'Haushalt',icon:'muenze',waehlen:noop},{id:'inventar',label:'Versorgung',icon:'tausch',waehlen:noop}];
function welt(){const w=createWorld(turkey2026,17);startAfterElection(w,schnellProfil());gueterSicht(w);return w;}
afterEach(async()=>{await setzeSprache('de');});

describe('Fachliche Navigation ohne zusätzliche Instrumente-Ebene',()=>{
  test('direkte Zugänge ersetzen genau die Sammelrubrik; Auswertungen bleiben erreichbar',()=>{
    const n=aktenNavigation('wirtschaft',reiter,'lage',noop,{aktiv:'haushalt',eintraege});
    expect(n.map(z=>z.id)).toEqual(['lage','zugang-haushalt','zugang-inventar','verlauf','personen','vorgaenge']);
    // Die Lage steht seit dem Plan Oberfläche (Q4) im Hintergrund, nicht mehr bei den Fachansichten
    expect(n.filter(z=>z.gruppe==='arbeit').map(z=>z.label)).toEqual(['Haushalt','Versorgung']);
    expect(n.filter(z=>z.aktiv).map(z=>z.id)).toEqual(['lage']);
  });
  test('ein Fachzugang öffnet das bestehende Ziel und den richtigen internen Bereich',()=>{
    const aufrufe:string[]=[];
    const n=aktenNavigation('wirtschaft',reiter,'verlauf',id=>aufrufe.push(id),{aktiv:'haushalt',eintraege:[{...eintraege[1]!,waehlen:()=>aufrufe.push('inventar')} ]});
    n.find(z=>z.id==='zugang-inventar')!.waehlen();expect(aufrufe).toEqual(['instrumente','inventar']);
  });
  test('Einordnung verändert die zuvor gewählte Fachansicht nicht',()=>{
    const ziel=vi.fn(),reiterWahl=vi.fn();
    const n=aktenNavigation('wirtschaft',reiter,'instrumente',reiterWahl,{aktiv:'haushalt',eintraege:[{...eintraege[0]!,waehlen:ziel}]});
    n.find(z=>z.id==='verlauf')!.waehlen();expect(reiterWahl).toHaveBeenCalledWith('verlauf');expect(ziel).not.toHaveBeenCalled();
    expect(n.filter(z=>z.aktiv).map(z=>z.id)).toEqual(['zugang-haushalt']);
  });
  test('alte interne Zugänge funktionieren auch ohne neue Fachziele',()=>{
    const n=aktenNavigation('recht',reiter,'instrumente',noop);expect(n.find(z=>z.aktiv)!.id).toBe('instrumente');expect(n.find(z=>z.aktiv)!.label).toBe('Entscheidungen');
    expect(n.map(z=>z.id)).toEqual(reiter.map(r=>r.id));
  });
  test('alle neun Bereiche haben eigene fachliche Namen und bekannte Symbole',()=>{
    const namen=new Set<string>();
    for(const bereich of Object.keys(AKTEN_PROFILE)) {
      const p=aktenProfil(bereich);namen.add(p.titel);expect(p.reiter('lage')).not.toBe('Lage');expect(p.reiter('verlauf')).not.toBe('Verlauf');expect(p.icon).toBeTruthy();
    }
    expect(namen.size).toBe(9);expect(aktenProfil('altbestand').titel).toBe(t('akneu.allgemein.titel'));
  });
});

describe('Bereichsarbeitsplatz und weiterhin gültige Sprünge',()=>{
  test('nur der gewählte Inhalt wird aufgebaut, unbekannte Startauswahl fällt auf vorhandene Ansicht zurück',()=>{
    const lage=vi.fn(()=> <p>Lageinhalt</p>),handeln=vi.fn(()=> <p>Fachinhalt</p>);
    const html=renderToStaticMarkup(<Akte bereich="recht" zweck="Zweck" kernwerte={[]} aktiv="personen" reiter={[{id:'lage',inhalt:lage},{id:'instrumente',inhalt:handeln}]}/>);
    expect(lage).toHaveBeenCalledOnce();expect(handeln).not.toHaveBeenCalled();expect(html).toContain('Lageinhalt');
    expect(html.match(/aria-current="page"/g)).toHaveLength(1);
  });
  test('Navigation, Inhaltsregion und Sprunglink sind korrekt verbunden',()=>{
    const html=renderToStaticMarkup(<Akte bereich="wirtschaft" zweck="Zweck" kernwerte={[{label:'Inflation',wert:'10 %'}]} reiter={reiter} aktiv="instrumente" zugaenge={{aktiv:'inventar',eintraege}}/>);
    const region=html.match(/<section id="([^"]+)"[^>]+aria-labelledby="([^"]+)"/)!;
    expect(region).toBeTruthy();expect(html).toContain(`href="#${region[1]}"`);expect(html).toContain(`aria-controls="${region[1]}"`);
    expect(html).toContain(`id="${region[2]}" type="button" aria-current="page"`);
    expect(html).toContain('<dt class="ak-kernwert-label">Inflation</dt>');expect(html).not.toContain('role="tablist"');
    expect(html).not.toContain('>Instrumente<');expect(html).not.toContain('class="ak-unterreiter"');
  });
  test('mehrere Akten haben unabhängige Navigations- und Inhaltskennungen',()=>{
    const html=renderToStaticMarkup(<><Akte bereich="wirtschaft" zweck="A" kernwerte={[]} reiter={reiter}/><Akte bereich="recht" zweck="B" kernwerte={[]} reiter={reiter}/></>);
    const ids=[...html.matchAll(/\sid="([^"]+)"/g)].map(m=>m[1]);expect(new Set(ids).size).toBe(ids.length);
  });
  test.each(['lage','haushalt','inventar','zentralbank'] as const)('Wirtschaftseinstieg %s wählt genau einen passenden Zugang',start=>{
    const w=welt();const html=renderToStaticMarkup(<WirtschaftAkte world={w} start={start}/>);
    const nav=html.slice(html.indexOf('<nav class="ak-navigation"'),html.indexOf('</nav>')+6);
    expect(nav.match(/aria-current="page"/g)).toHaveLength(1);
    const id=start==='lage'?'lage':`zugang-${start}`;
    expect(nav).toMatch(new RegExp(`id="[^"]*-${id}" type="button" aria-current="page"`));
    expect(html).not.toContain('class="ak-unterreiter"');expect(nav).not.toContain('>Instrumente<');
  });
  test('Parlament, Verfassung und Behörden sind direkt erreichbar, aktive Ansicht bleibt erhalten',()=>{
    const w=welt(),html=renderToStaticMarkup(<BereichsAkte bereich="recht" world={w} tabs={[{id:'parlament',label:'Fraktionen'},{id:'verfassung',label:'Verfassung'}]} aktiverTab="verfassung" onTab={noop} reiter="instrumente" onReiter={noop}><p>Verfassungsinhalt</p></BereichsAkte>);
    expect(html).toContain('Verfassungsinhalt');expect(html).toMatch(/id="[^"]*-zugang-verfassung" type="button" aria-current="page"/);
    expect(html).toContain('-zugang-parlament');
    // Die Behörden stehen im Hintergrund unter der Lage, nicht mehr als eigener Zugang (Rundgang 5. November)
    expect(html).not.toContain('-zugang-behoerden');
    expect(html).not.toContain('class="ak-unterreiter"');
  });
  test('die neue Navigation und Kopfzeile verändern keine Weltkonten',()=>{
    const w=welt(),vorher=save(w);renderToStaticMarkup(<Akte bereich="wirtschaft" zweck="Zweck" kernwerte={[{label:'Wert',wert:'12'}]} reiter={reiter} zugaenge={{aktiv:'haushalt',eintraege}}/>);expect(save(w)).toBe(vorher);
  });
  test.each(['de','en','tr'] as const)('Bereichsnamen, direkte Zugänge und Kontext sind vollständig übersetzt: %s',async sprache=>{
    await setzeSprache(sprache);
    for(const bereich of Object.keys(AKTEN_PROFILE)) {
      const html=renderToStaticMarkup(<Akte bereich={bereich} zweck="Zweck" kernwerte={[]} reiter={reiter} aktiv="verlauf" zugaenge={{aktiv:'haushalt',eintraege:[]}}/>);
      expect(html).not.toMatch(/⟦|\{bereich\}|akneu\./);expect(html).toContain(renderToStaticMarkup(<span>{aktenProfil(bereich).reiter('verlauf')}</span>));
    }
    for(const [key,value] of Object.entries(de)){expect(katalogVon(sprache)[key],key).toBeTruthy();expect(platzhalter(katalogVon(sprache)[key]!).sort(),key).toEqual(platzhalter(value).sort());}
  });
});
