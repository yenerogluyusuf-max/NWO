import { afterEach, expect, test } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { knotenSicht } from '../src/sim/wissensbaum';
import { NET } from '../src/sim/modell';
import { PROVINCES } from '../src/sim/netz';
import { createWorld } from '../src/sim/world';
import { turkey2026 } from '../src/sim/scenario';
import { startAfterElection, schnellProfil } from '../src/sim/prolog';
import { setzeSprache, t } from '../src/i18n';
import { Zentralbank } from '../src/ui/wirtschaft/Zentralbank';
import { Bauhilfe, bauhilfeWerte } from '../src/ui/reich/Bauhilfe';
import { Reich } from '../src/ui/Reich';
import { haushaltZustand } from '../src/sim/wirtschaft';
function welt(){const w=createWorld(turkey2026,17);startAfterElection(w,schnellProfil());return w;}
afterEach(async()=>{await setzeSprache('de');});
for(const lang of ['de','en','tr'] as const)test(`${lang}: Krisenregel, Gegenfinanzierung und Bauhilfen sind verständlich ausgegeben`,async()=>{
 await setzeSprache(lang);const w=welt();Object.assign(w.economy,{inflation:90,expectedInflation:85,policyRate:30});
 const bank=renderToStaticMarkup(createElement(Zentralbank,{world:w,geaendert:()=>{}}));
 expect(bank).toContain(t('balance.zinsschritt',{wert:lang==='en'?'12.5':'12,5'}));
 const h=haushaltZustand(w);h.wirksam={personal:2};
 const bau=renderToStaticMarkup(createElement(Bauhilfe,{world:w}));
 // Nacht N6: Pausenverfall und Preis des Vorziehens stehen als Zahl aus den Spielparametern im Text (bauhilfeWerte)
 for(const k of ['bautitel','baupause','bauprioritaet','baupersonal'])expect(bau).toContain(t(`balance.${k}`,(bauhilfeWerte() as Record<string,Record<string,string|number>>)[k]??{}));
 expect(bau).toContain('<summary>');
 const reich=renderToStaticMarkup(createElement(Reich,{world:w,bereich:'infrastruktur',refresh:()=>{}}));
 expect(reich).toContain(t('balance.bautitel'));
 expect(bank+bau+reich).not.toMatch(/NaN|Infinity|undefined|⟦|balance\./);
});
test('normale Lage zeigt keine beschleunigte Krisenreaktion',()=>{
 const w=welt();Object.assign(w.economy,{inflation:20,expectedInflation:15,policyRate:20});
 const html=renderToStaticMarkup(createElement(Zentralbank,{world:w,geaendert:()=>{}}));
 expect(html).not.toContain('Aufholphase');
});

for(const lang of ['de','en','tr'] as const)test(`${lang}: fast erreichte Voraussetzungen versprechen keinen Baubeginn`,async()=>{
 await setzeSprache(lang);const w=welt();const i=NET.index.get('hochschule')!;
 for(let p=0;p<PROVINCES;p++)w.net.values[i*PROVINCES+p]=45.99;
 const k=knotenSicht(w,'chips_design')!;
 expect(k.zustand).toBe('gesperrt');expect(k.grund).toContain(t('balance.knappUnter',{wert:46}));
 expect(k.voraus.some(v=>!v.erfuellt&&v.text.includes(t('balance.knappUnter',{wert:46})))).toBe(true);
 for(let p=0;p<PROVINCES;p++)w.net.values[i*PROVINCES+p]=46.01;
 expect(knotenSicht(w,'chips_design')!.voraus[0]!.text).not.toContain(t('balance.knappUnter',{wert:46}));
});
