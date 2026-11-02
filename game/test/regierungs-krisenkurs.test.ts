import { expect, test } from 'vitest';
import { starteSzenario, regiere, messung, type Aktion } from '../scripts/regierungs-stresstest';
import { fraktion } from '../src/sim/fraktionen';
test('Testregierung zählt die eigene Partei mit und schließt bei 320 Sitzen kein unnötiges weiteres Bündnis',()=>{
 const w=starteSzenario('stabilisierung',17);w.parliament!.seats={[w.player!.partei.kurz]:200,'YENİ':120,CHP:280};w.spiel!.lager=['YENİ'];w.spiel!.ereignisse=[];w.spiel!.kapital=100;fraktion(w,'CHP').bereitschaft=90;
 const a:Aktion[]=[];regiere(w,'stabilisierung',a,{minister:false,agenda:[],budgets:{},neueInfrastruktur:false});
 expect(messung(w).regierungssitze).toBe(320);expect(w.spiel!.lager).toEqual(['YENİ']);
 expect(a.filter(a=>a.art==='fraktion'&&a.ziel.endsWith('/koalition'))).toEqual([]);
});
