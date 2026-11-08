import { afterEach, describe, expect, test } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createWorld, load, save } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { schnellProfil, startAfterElection } from "../src/sim/prolog";
import { aktiveParteivorsitzende } from "../src/sim/koalitionslage";
import { bringeEin, gesetzPrognose, gesetzSicht, stufeIn } from "../src/sim/handeln";
import { fraktion } from "../src/sim/fraktionen";
import { verfassungVon } from "../src/sim/aufmerksamkeit";
import { faellig, warnungen, tageslage } from "../src/ui/schreibtisch/briefing";
import { mentorNotes } from "../src/ui/mentor";
import { addDays, formatDateDe } from "../src/sim/dates";
import { setzeSprache, t } from "../src/i18n";
import { koalitionsHinweis } from "../src/ui/koalitionshinweis";
import { Schreibtisch } from "../src/ui/schreibtisch/Schreibtisch";
import { verhandle } from "../src/sim/verhandeln";
import { Rng } from "../src/sim/rng";
import type { World } from "../src/sim/types";

function welt(){
 const w=createWorld(turkey2026,17);startAfterElection(w,{...schnellProfil(),buendnis:"YENİ"});
 w.date="2028-06-25";w.day=60;w.spiel!.start.datum=addDays(w.date,-60);w.spiel!.ereignisse=[];w.spiel!.zusagen=[];w.spiel!.gesetze=[];w.spiel!.kapital=100;
 w.parliament!.seats={[w.player!.partei.kurz]:200,"YENİ":120,CHP:200,MHP:50,DEM:30};
 fraktion(w,"YENİ").bereitschaft=60;chef(w).loyalitaet=45;verfassungVon(w).belastung=0;return w;
}
const chef=(w:World)=>aktiveParteivorsitzende(w,"YENİ")[0]!;
afterEach(async()=>{await setzeSprache("de");});
describe("Politische Lage auf dem Schreibtisch stimmt mit der Entscheidung überein",()=>{
 test("ein inaktiver ehemaliger Vorsitz löst weder Warnung noch Mentor-Bruchhinweis aus",()=>{
  const w=welt();w.spiel!.figuren.unshift({...structuredClone(chef(w)),id:"alt",name:"Ehemaliger Vorsitz",imAmt:false,loyalitaet:5});
  expect(warnungen(w).some(x=>x.id==="partner")).toBe(false);expect(mentorNotes(w).some(x=>x.id==="partner-wackelt")).toBe(false);
 });
 test("der gefährdetste aktive Vorsitz erhält Vorrang vor einem nur unzufriedenen Partner",()=>{
  const w=welt();chef(w).loyalitaet=31;
  w.spiel!.figuren.push({...structuredClone(chef(w)),id:"zweiter",name:"Akuter Vorsitz",loyalitaet:19});
  expect(warnungen(w).find(x=>x.id==="partner")!.text).toContain("Akuter Vorsitz");
  expect(mentorNotes(w).find(x=>x.id==="partner-wackelt")!.short).toContain("Akuter Vorsitz");
 });
 test("der Zusagensprung verwendet das vereinbarte Landesziel statt weiterer zwanzig Punkte",()=>{
  const w=welt(),start=stufeIn(w,"m_renten",null);
  w.spiel!.zusagen.push({id:"fest",von:"YENİ",text:"Rente",faellig:w.day+3,massnahme:"m_renten",richtung:1,stufeStart:start-10,stufeZiel:start+10,erfuellt:false,gebrochen:false});
  const k=faellig(w).find(x=>x.id==="z-fest")!.knopf;
  expect(k.art==="gehe"&&k.ziel.art==="politik"&&k.ziel.massnahme?.level).toBe(start+10);
 });
 test("die Terminzeile berücksichtigt Stimmenabsprachen und Duldungsende zum Votum",()=>{
  const w=welt();fraktion(w,"CHP").duldungBis=w.day+3;
  expect(bringeEin(w,"m_renten",stufeIn(w,"m_renten",null)+20,null,"gesetz").ok).toBe(true);
  const g=w.spiel!.gesetze[0]!;g.absprachen=83;g.stimmenBonus=7;
  const s=gesetzSicht({...w,day:g.abstimmung,date:addDays(w.date,g.abstimmung-w.day)},g);
  const f=faellig(w).find(x=>x.id===`g-${g.id}`)!;
  // N4 (Art. 96): Ein Gesetz braucht die Mehrheit der Anwesenden, nicht mehr pauschal 301. Die nötige Zahl kommt aus derselben
  // Prognose, die am Abstimmungstag zählt (gesetzPrognose().schwelle); sie liegt zwischen 151 Ja und der Mitgliedermehrheit 301.
  const noetig=gesetzPrognose(w,g).schwelle;expect(noetig).toBeGreaterThanOrEqual(151);expect(noetig).toBeLessThanOrEqual(301);
  expect(f.unter).toContain(t("sk.f.gesetz.unter",{wann:t("sk.tage",{n:g.abstimmung-w.day}),ja:s.ja,noetig}));
 });
 test.each([[19.9999,"rot"],[20,"gelb"],[34.9999,"gelb"],[35,undefined]] as const)("Loyalität %s verwendet die gemeinsame Warn- und Bruchschwelle",(n,farbe)=>{
  const w=welt();chef(w).loyalitaet=n;const h=warnungen(w).find(x=>x.id==="partner");expect(h?.stufe).toBe(farbe);
  expect(!!koalitionsHinweis(w)).toBe(n<35);
  if(n<20)expect(h!.warum).toContain("< 20");
  if(h){expect(h.warum).toContain(formatDateDe("2028-07-01"));expect(h.warum).toContain("120");expect(h.warum).toContain("200");}
 });
 test("ein echtes Gespräch entfernt die akute Bruchwarnung, aber lässt die Frühwarnung bestehen",()=>{
  const w=welt();chef(w).loyalitaet=19;expect(tageslage(w).warnungen.find(x=>x.id==="partner")!.stufe).toBe("rot");
  expect(verhandle(w,"YENİ","gespraech",new Rng(4)).ok).toBe(true);expect(chef(w).loyalitaet).toBe(24);
  expect(tageslage(w).warnungen.find(x=>x.id==="partner")!.stufe).toBe("gelb");
  expect(mentorNotes(w).find(x=>x.id==="partner-wackelt")!.short).toBe(koalitionsHinweis(w)!.text);
 });
 test("Opposition, eigene Partei und inaktive Personen erzeugen keine Koalitionsbruchwarnung",()=>{
  const w=welt(),f=chef(w);f.loyalitaet=5;w.spiel!.lager=[];expect(koalitionsHinweis(w)).toBeUndefined();
  w.spiel!.lager=[w.player!.partei.kurz];f.partei=w.player!.partei.kurz;expect(koalitionsHinweis(w)).toBeUndefined();
 });
 test("gleicher Tag und gleiche Anzahlen dürfen andere Duldung, Frist und Zwangspause zeigen",()=>{
  const w=welt();fraktion(w,"CHP").duldungBis=w.day+5;
  expect(bringeEin(w,"m_renten",70,null,"gesetz").ok).toBe(true);
  const a=tageslage(w),g=w.spiel!.gesetze[0]!;fraktion(w,"CHP").duldungBis=w.day+40;g.abstimmung+=4;verfassungVon(w).pauseBis=w.day+3;
  const b=tageslage(w);expect(a.faellig.find(x=>x.id==="d-CHP")!.tage).toBe(5);expect(b.faellig.find(x=>x.id==="d-CHP")!.tage).toBe(40);
  expect(b.faellig.find(x=>x.id===`g-${g.id}`)!.tage).toBe(a.faellig.find(x=>x.id===`g-${g.id}`)!.tage!+4);
  expect(a.verfassung?.pauseBis).toBeUndefined();expect(b.verfassung?.pauseBis).toBe(formatDateDe(addDays(w.date,3)));
  expect(b.warnungen.some(x=>x.id==="zwangspause")).toBe(true);
 });
 test("gleiche Weltkennzahlen beim Laden verwechseln keine anderen Sitzverhältnisse und Vorsitzenden",()=>{
  const w=welt();chef(w).loyalitaet=34;const a=tageslage(w),neu=load(save(w));
  neu.parliament!.seats["YENİ"]=80;chef(neu).loyalitaet=19;
  const b=tageslage(neu);expect(a.kennzahlen.find(x=>x.id==="mehrheit")!.wert).not.toBe(b.kennzahlen.find(x=>x.id==="mehrheit")!.wert);
  expect(b.warnungen.find(x=>x.id==="partner")!.stufe).toBe("rot");expect(a.warnungen.find(x=>x.id==="partner")!.stufe).toBe("gelb");
 });
 test("ein festes niedrigeres Ziel bleibt auch nach späterem Umsetzungsfortschritt dasselbe",()=>{
  const w=welt();w.spiel!.zusagen.push({id:"senken",von:"YENİ",text:"Zielsenkung",faellig:w.day+3,massnahme:"m_renten",richtung:-1,stufeStart:70,stufeZiel:50,erfuellt:false,gebrochen:false});
  const k=faellig(w).find(x=>x.id==="z-senken")!.knopf;
  expect(k.art==="gehe"&&k.ziel.art==="politik"&&k.ziel.massnahme?.level).toBe(50);
 });
 test("die parlamentarische Frist wird nach einer geänderten Mehrheit sofort als dringend eingestuft",()=>{
  const w=welt();bringeEin(w,"m_renten",70,null,"gesetz");const g=w.spiel!.gesetze[0]!;g.abstimmung=w.day+2;g.absprachen=600;
  expect(faellig(w).find(x=>x.id===`g-${g.id}`)!.dringend).toBe(false);g.absprachen=-600;
  const f=faellig(w).find(x=>x.id===`g-${g.id}`)!;expect(f.dringend).toBe(true);
  // N4 (Art. 96): Die Lücke misst sich an der Schwelle der Anwesenden aus der Prognose, nicht an pauschal 301 (bei 0 Ja: die ganze Schwelle).
  const pr=gesetzPrognose(w,g);expect(pr.ja).toBe(0);expect(pr.luecke).toBe(pr.schwelle);
  expect(f.unter).toContain(t("sk.f.gesetz.fehlt",{n:pr.luecke}));
 });
 test.each(["de","en","tr"] as const)("Lage und Mentorin folgen dem Sprachwechsel am selben Tag auf %s",async lang=>{
  const w=welt();chef(w).loyalitaet=19;tageslage(w);mentorNotes(w);await setzeSprache(lang);
  const a=tageslage(w),h=koalitionsHinweis(w)!,html=renderToStaticMarkup(<Schreibtisch world={w} refresh={()=>{}} onGehe={()=>{}}/>);
  expect(a.warnungen.find(x=>x.id==="partner")!.text).toBe(h.text);expect(mentorNotes(w).find(x=>x.id==="partner-wackelt")!.short).toBe(h.text);
  expect(html).toContain(h.text);expect(html).not.toContain("⟦");expect(html).not.toMatch(/\{(?:name|datum|sitze|rest)\}/);
 });
 test("wiederholtes Lesen der aktuellen Lage verändert weder laufende Zusagen noch Gesetze oder den Spielstand",()=>{
  const w=welt();chef(w).loyalitaet=19;fraktion(w,"CHP").duldungBis=w.day+3;
  w.spiel!.zusagen.push({id:"offen",von:"YENİ",text:"Rente",faellig:w.day+3,massnahme:"m_renten",richtung:1,stufeStart:40,stufeZiel:60,erfuellt:false,gebrochen:false});
  expect(bringeEin(w,"m_renten",60,null,"gesetz").ok).toBe(true);
  tageslage(w);mentorNotes(w);const stand=save(w);
  for(let i=0;i<3;i++){tageslage(w);mentorNotes(w);}
  expect(save(w)).toBe(stand);
 });
});
