import { afterAll, expect, test } from 'vitest';
import { writeFileSync } from 'node:fs';
import { SZENARIEN, spieleSzenario } from '../scripts/regierungs-stresstest';

const ergebnisse:ReturnType<typeof spieleSzenario>[]=[];
afterAll(()=>{
 if(process.env.REGIERUNGS_STRESS_AUS)writeFileSync(process.env.REGIERUNGS_STRESS_AUS,JSON.stringify({version:1,hinweis:'Automatisierte Tageskampagnen über echte Handlungen, kein Browserlauf. Vorgegebene Schocks sind Testbedingungen; politische Enden werden respektiert.',ergebnisse},null,2)+'\n');
});
const auswahl=process.env.REGIERUNGS_STRESS_SZENARIEN?.split(',');
const szenarien=auswahl?SZENARIEN.filter(s=>auswahl.includes(s)):SZENARIEN;
test.each(szenarien)('fünf Spieljahre: %s',szenario=>{
 const seeds=(process.env.REGIERUNGS_STRESS_SEEDS??'5,17').split(',').map(Number);
 for(const seed of seeds){
  const r=spieleSzenario(szenario,seed);ergebnisse.push(r);
  expect(r.fehler,`${szenario}/${seed}`).toEqual([]);
  expect(r.bilanzFehler).toBeLessThan(1e-10);
  expect(r.bipFehler).toBeLessThan(1e-10);
  expect(r.warenFehler).toBeLessThan(1e-7);
  expect(r.tage>=365*5||r.ende!==null).toBe(true);
  if(szenario!=='passiv')expect(r.aktionen.some(a=>a.ok)).toBe(true);
  if(szenario==='fabrikoffensive')expect(r.aktionen.some(a=>a.art==='industrieprojekt'&&a.ok)).toBe(true);
  if(szenario==='krieg')expect(r.monate.some(m=>m.kriege.some(k=>k.wochen>0))).toBe(true);
  expect(r.schuldenRest).toBeLessThan(1e-10);
 }
},180_000);
