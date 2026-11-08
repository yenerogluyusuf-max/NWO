import { afterAll, expect, test } from 'vitest';
import { writeFileSync } from 'node:fs';
import { STRATEGIEN, spieleStrategie } from '../scripts/balance-strategien';
const ergebnisse:ReturnType<typeof spieleStrategie>[]=[];
afterAll(()=>{if(process.env.BALANCE_AUS)writeFileSync(process.env.BALANCE_AUS,JSON.stringify({hinweis:'Echte Tageskampagnen; vorgegebener Inflationsschock. Politische Spielenden gelten. Keine Browserprüfung.',ergebnisse})+'\n');});
const auswahl=process.env.BALANCE_STRATEGIEN?.split(',');
test.each(STRATEGIEN.filter(s=>!auswahl||auswahl.includes(s)))('Gegenmaßnahmen: %s',strategie=>{
 for(const seed of (process.env.BALANCE_SEEDS??'5,17').split(',').map(Number)){
  const r=spieleStrategie(strategie,seed,Number(process.env.BALANCE_JAHRE??5));ergebnisse.push(r);
  expect(r.fehler).toEqual([]);
  expect(r.bilanzFehler).toBeLessThan(1e-10);expect(r.schuldenRest).toBeLessThan(1e-10);expect(r.warenFehler).toBeLessThan(1e-7);
  expect(r.tage>=365*r.horizontJahre||r.ende!==null).toBe(true);
  expect(r.aktionen.some(a=>a.ok)).toBe(true);
 }
},180_000);
