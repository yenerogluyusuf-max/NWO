import { expect, test } from 'vitest';
import { writeFileSync } from 'node:fs';
import { pruefeKrisenwahlkampf } from '../scripts/wahlkampf-krisenlauf';

test('erspielte schwere Krise: gleicher Start, echter Wahlkampf, reale Wahl ohne garantierten Sieg',()=>{
 const r=pruefeKrisenwahlkampf();
 if(process.env.WAHLKAMPF_AUS)writeFileSync(process.env.WAHLKAMPF_AUS,JSON.stringify(r)+'\n');
 expect(r.vorlauf.fehler).toEqual([]);expect(r.wege).toHaveLength(3);
 for(const w of r.wege){
  expect(w.vorher).toEqual(r.wege[0]!.vorher);expect(w.apFehler).toBe(false);
  expect(w.bilanzFehler).toBeLessThan(1e-10);expect(w.schuldenFehler).toBeLessThan(1e-10);expect(w.warenFehler).toBeLessThan(1e-7);
  expect(w.ende||w.wahl).toBeTruthy();
  const kampagne=w.aktionen.filter(a=>a.art==='wahlkampf');
  expect(kampagne.every(a=>a.ok)).toBe(true);
  if(w.kurs==='ohne')expect(kampagne).toHaveLength(0);
  else {expect(kampagne.some(a=>a.ziel==='duell')).toBe(true);expect(kampagne.some(a=>a.ziel.startsWith('reise/'))).toBe(true);}
  if(w.kurs==='gemischt')expect(kampagne.some(a=>a.ziel.startsWith('tour/'))).toBe(true);
 }
},180_000);
