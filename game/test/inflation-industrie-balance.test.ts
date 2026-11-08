import { expect, test } from 'vitest';
import { createWorld } from '../src/sim/world';
import { turkey2026 } from '../src/sim/scenario';
import { startAfterElection, schnellProfil } from '../src/sim/prolog';
import { dailyRiskPremium, monthlyUpdate, ppkDecision } from '../src/sim/economy';
import { haushaltMonat, setzePosten } from '../src/sim/haushalt';
import { Rng } from '../src/sim/rng';
import { bauplan, reichZustand, warteschlange, verwaltungBilanz, reichMonat, monatsBauleistung, pausiere, laufBau, vorhabenDef, PAUSE_VERFALL } from '../src/sim/reich';
import { haushaltZustand } from '../src/sim/wirtschaft';
function welt(){const w=createWorld(turkey2026,17);startAfterElection(w,schnellProfil());return w;}
test('voll gegenfinanzierte Reformen tragen keinen zusätzlichen Fiskaldominanzaufschlag',()=>{
 const e=welt().economy,a=structuredClone(e),b=structuredClone(e);
 a.policyCost=3;a.fiscalImpulse=-3;b.policyCost=0;b.fiscalImpulse=0;
 expect(dailyRiskPremium(a,new Rng(7))).toBeCloseTo(dailyRiskPremium(b,new Rng(7)),10);
 monthlyUpdate(a,[],new Rng(7));monthlyUpdate(b,[],new Rng(7));
 expect(a.credibility).toBeCloseTo(b.credibility,10);
});
test('ungedeckte zusätzliche Etats tragen dieselbe Finanzierungsbelastung wie gleich teure Reformen',()=>{
 const a=welt().economy,b=structuredClone(a);a.policyCost=3;a.fiscalImpulse=0;b.policyCost=0;b.fiscalImpulse=3;
 expect(dailyRiskPremium(a,new Rng(7))).toBeCloseTo(dailyRiskPremium(b,new Rng(7)),10);
 monthlyUpdate(a,[],new Rng(7));monthlyUpdate(b,[],new Rng(7));expect(a.credibility).toBeCloseTo(b.credibility,10);
});
test('erschöpfte Verwaltung halbiert die Leistung, nicht endlos den letzten Rest',()=>{
 const w=welt(),z=reichZustand(w);z.verwaltung=0;
 z.laufend=[{id:'chips_design',start:w.date,fortschritt:99,bau:100,monate:10}];
 expect(bauplan(w).chips_design).toBe(1);
 expect(warteschlange(w)[0]!.fertigIn).toBe(1);
});
test('gereifter Personaletat erweitert Verwaltung; der bloße Beschluss tut dies noch nicht',()=>{
 const w=welt(),h=haushaltZustand(w),vorher=verwaltungBilanz(w).einkommen;
 h.wirksam??={...h.stufen};h.wirksam.personal=0;h.stufen.personal=2;
 expect(verwaltungBilanz(w).einkommen).toBe(vorher);
 h.wirksam.personal=2;expect(verwaltungBilanz(w).einkommen).toBeGreaterThan(vorher);
});
test('Zinsregel kann einen extrem negativen Realzins zügiger aufholen, ohne sofort auf den Zielzins zu springen',()=>{
 const e=welt().economy;Object.assign(e,{policyRate:30,expectedInflation:85,inflation:90});
 const r=ppkDecision(e,'vorsichtig');
 expect(r.newRate-e.policyRate).toBeGreaterThan(5);
 expect(r.newRate-e.policyRate).toBeLessThanOrEqual(12.5);
 expect(r.newRate).toBeLessThan(r.target);
});

test('gewöhnliche Zinssitzungen, gefügige Führung und Zinssenkungen behalten ihre Grenzen',()=>{
 const e=welt().economy;
 Object.assign(e,{policyRate:30,expectedInflation:35,inflation:50});
 expect(ppkDecision(e,'vorsichtig').newRate-e.policyRate).toBeLessThanOrEqual(5);
 Object.assign(e,{policyRate:30,expectedInflation:85,inflation:90});
 expect(ppkDecision(e,'gefuegig').newRate-e.policyRate).toBeLessThanOrEqual(5);
 Object.assign(e,{policyRate:80,expectedInflation:15,inflation:20});
 expect(ppkDecision(e,'vorsichtig').newRate-e.policyRate).toBe(-5);
});

test('höhere Zinsen schenken weder sofort geringere Inflation noch Glaubwürdigkeit',()=>{
 const e=welt().economy;Object.assign(e,{policyRate:30,expectedInflation:85,inflation:90});
 const vor=structuredClone(e);ppkDecision(e,'vorsichtig');expect(e).toEqual(vor);
});


test('ein wirklicher Personalnachtrag kostet Haushalt und Kapital vor der späteren Kapazitätswirkung',()=>{
 const w=welt(),h=haushaltZustand(w),v=verwaltungBilanz(w),pk=w.spiel!.kapital,impuls=w.economy.fiscalImpulse;
 expect(setzePosten(w,'personal',2).ok).toBe(true);
 expect(w.spiel!.kapital).toBeLessThan(pk);
 expect(w.economy.fiscalImpulse-impuls).toBeCloseTo(0.8,8);
 expect(verwaltungBilanz(w).einkommen).toBe(v.einkommen);
 haushaltMonat(w);
 expect(h.wirksam!.personal).toBe(2);
 expect(verwaltungBilanz(w).einkommen-v.einkommen).toBeCloseTo(1.95,8);
});

test('Personalkürzung senkt die Bearbeitungskapazität und mehr Geld ist begrenzt wirksam',()=>{
 const w=welt(),h=haushaltZustand(w);h.wirksam??={};
 h.wirksam.personal=-4;const weniger=verwaltungBilanz(w);
 h.wirksam.personal=4;const mehr=verwaltungBilanz(w);
 expect(weniger.personal).toBeCloseTo(-3.9,8);expect(mehr.personal).toBeCloseTo(3.9,8);
});

test('kleiner Rest verbraucht bei halber Leistung nur seine tatsächliche Kapazität',()=>{
 const erster=monatsBauleistung(10,10,1,0.5),zweiter=monatsBauleistung(10,10-erster/0.5,20,0.5);
 expect(erster).toBe(1);expect(zweiter).toBe(4);expect(erster+zweiter).toBe(5);
});

test('erschöpfte Verwaltung beendet ein fast fertiges Werk einmalig auch im wirklichen Monatslauf',()=>{
 const w=welt(),z=reichZustand(w),h=haushaltZustand(w);z.verwaltung=0;h.wirksam={personal:-4};
 z.laufend.unshift({id:'chips_design',start:w.date,fortschritt:99,bau:100,monate:10,durchbruchGeprueft:true,ueberzugN:100});
 expect(verwaltungBilanz(w).netto).toBeLessThan(0);
 reichMonat(w);expect(z.verwaltung).toBe(0);expect(z.bestand.chips_design).toBeDefined();
 expect(z.laufend.some(l=>l.id==='chips_design')).toBe(false);
 const anzahl=Object.keys(z.bestand).length;reichMonat(w);expect(Object.keys(z.bestand)).toHaveLength(anzahl);
});

test('Pausieren entlastet die Verwaltung; der ruhende Bau verliert nur den Pausenverfall',()=>{
 const w=welt(),z=reichZustand(w),l=z.laufend[0]!,vor=verwaltungBilanz(w),fort=l.fortschritt;
 expect(pausiere(w,l.id,true)).toBe(true);
 expect(verwaltungBilanz(w).bau).toBeLessThan(vor.bau);
 // Nacht N6 (Befund F-4): Ein ruhender Bau verliert je Monat PAUSE_VERFALL seiner Baupunkte
 reichMonat(w);expect(l.fortschritt).toBeCloseTo(Math.max(0,fort-laufBau(l,vorhabenDef(l.id)!)*PAUSE_VERFALL),6);
});


test('fehlender Personalposten in vorhandener Wirksamkeit bedeutet null, Altstand ohne Wirksamkeit nutzt den gespeicherten Etat',()=>{
 const w=welt(),h=haushaltZustand(w);h.stufen.personal=2;h.wirksam={};
 expect(verwaltungBilanz(w).personal).toBe(0);
 delete h.wirksam;expect(verwaltungBilanz(w).personal).toBeCloseTo(1.95,8);
});
