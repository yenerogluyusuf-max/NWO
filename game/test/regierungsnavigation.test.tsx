import { afterEach, expect, test } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { RegierungsNavigation, navigationsGruppen, type NavigationsEintrag } from '../src/ui/navigation/RegierungsNavigation';
import { setzeSprache, t } from '../src/i18n';
const ids=['schreibtisch','wirtschaft','waehler','gesetze','personen','streitkraefte','welt','reich_infra','fokusbaum','zeitung'];
afterEach(async()=>{await setzeSprache('de');});
test('alle zehn bestehenden Einstiege bleiben erhalten, Legislative und Exekutive stehen direkt am Schreibtisch',()=>{
 const eintraege: NavigationsEintrag[]=ids.map(id=>({id,kurz:id,titel:id,icon:'akte'}));const g=navigationsGruppen(eintraege);
 expect(g[0]!.eintraege.map(e=>e.id)).toEqual(['schreibtisch','gesetze','personen']);expect(g.flatMap(g=>g.eintraege.map(e=>e.id)).sort()).toEqual([...ids].sort());
});
test.each(['de','en','tr'] as const)('%s: aktive Seite, mobile Bereichswahl und Vorgangszahlen sind zugänglich benannt',async lang=>{
 await setzeSprache(lang);const es: NavigationsEintrag[]=ids.map(id=>({id,kurz:id==='gesetze'?t('nav.recht'):id==='personen'?t('nav.regierung'):id,titel:id,icon:'akte',...(id==='gesetze'?{badge:3}:{})}));
 const html=renderToStaticMarkup(<RegierungsNavigation eintraege={es} aktiv="gesetze" onWaehlen={()=>{}}/>);
 expect(html).toContain(t('nav.recht'));expect(html).toContain(t('nav.regierung'));expect(html).toContain('aria-expanded="false"');expect(html).toContain(t('rn.offen',{n:3}));expect(html.match(/aria-current="page"/g)).toHaveLength(1);
});
