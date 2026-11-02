import { afterEach, describe, expect, test } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createWorld, load, save } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { schnellProfil, startAfterElection } from "../src/sim/prolog";
import { zusagenDruck } from "../src/sim/zusagendruck";
import { gefaehrdeteZusagen, zusagenSchrittPlan, fuehreZusagenSchrittAus } from "../src/sim/zusagenwarnung";
import { koalitionsHilfePlan, stabilisiereKoalition } from "../src/sim/koalitionshilfe";
import { aktiveParteivorsitzende, regierungsSitze } from "../src/sim/koalitionslage";
import { fraktion } from "../src/sim/fraktionen";
import { oeffne } from "../src/sim/ereignisse";
import { spielTick } from "../src/sim/spiel";
import { addDays, formatDateDe } from "../src/sim/dates";
import { Rng } from "../src/sim/rng";
import { ZusagenDruck } from "../src/ui/personen/ZusagenDruck";
import { ZusagenWache, ZusagenSchritte } from "../src/ui/schreibtisch/ZusagenWache";
import { ZusagenAnsicht } from "../src/ui/personen/ZusagenAnsicht";
import { VersorgungsNachsorge } from "../src/ui/gueter/VersorgungsNachsorge";
import { gueterSicht } from "../src/sim/gueter";
import { beschliesseVersorgungsProgramm, versorgungsParlamentTag } from "../src/sim/versorgungspolitik";
import { versorgungsNachsorge, versorgungsStabilisierungsPlan } from "../src/sim/versorgungsnachsorge";
import { setzeSprache, t, katalogVon, platzhalter } from "../src/i18n";
import type { World } from "../src/sim/types";
import type { Zusage } from "../src/sim/spiel-typen";

const chef=(w:World)=>aktiveParteivorsitzende(w,"YENİ")[0]!;
function welt(loyalitaet=38) {
  const w=createWorld(turkey2026,17);startAfterElection(w,{...schnellProfil(),buendnis:"YENİ"});
  w.date="2028-06-25";w.day=0;w.spiel!.start.datum=w.date;
  w.spiel!.ereignisse=[];w.spiel!.zusagen=[];w.spiel!.gesetze=[];w.spiel!.lager=["YENİ"];w.spiel!.kapital=100;
  w.spiel!.verfassung!.aufmerksamkeit=80;
  w.parliament!.seats={[w.player!.partei.kurz]:200,"YENİ":120,CHP:200,MHP:50,DEM:30};
  for(const p of Object.keys(w.parliament!.seats))fraktion(w,p).bereitschaft=60;
  chef(w).loyalitaet=loyalitaet;return w;
}
function zusage(w:World,frist:number,extra:Partial<Zusage>={}) {
  const z:Zusage={id:`druck-${w.spiel!.zusagen.length}`,von:"YENİ",text:`Zusage ${w.spiel!.zusagen.length+1}`,faellig:w.day,erfuellt:false,gebrochen:false,...extra};
  w.spiel!.zusagen.push(z);
  const e=oeffne(w,"zusage",new Rng(3),{provinzen:[],staerke:1,daten:{zusage:z.id}})!;
  e.frist=w.day+frist;return {z,e};
}
function zwei(w:World) {return [zusage(w,2),zusage(w,6)] as const;}
const d=(w:World)=>zusagenDruck(w,"YENİ")!;
afterEach(async()=>{await setzeSprache("de");});

describe("Gemeinsame Folgen bekannter Zusagenfristen",()=>{
  test("zwei offene Erinnerungen bedrohen gemeinsam eine bislang unauffällige Koalition",()=>{
    const w=welt(),[a,b]=zwei(w),stand=save(w),s=d(w);
    expect(s.erinnerungen.map(e=>e.zusage.id)).toEqual([a.z.id,b.z.id]);
    expect(s).toMatchObject({pruefung:"2028-07-01",loyalitaet:38,nachVerfall:8,bruch:true,sitze:120,ohne:200});
    expect(gefaehrdeteZusagen(w)[0]!.gruende).toContain("fristfolge");
    expect(save(w)).toBe(stand);expect(d(load(save(w)))).toEqual(s);
  });
  test.each(["erfuellt","gebrochen","verschoben","nachPruefung","anderePartei"] as const)("%s zählt nicht zum Verfall dieser Fraktion vor der nächsten Prüfung",art=>{
    const w=welt(),[,b]=zwei(w);
    if(art==="erfuellt")b.z.erfuellt=true;if(art==="gebrochen")b.z.gebrochen=true;
    if(art==="verschoben")b.z.faellig=w.day+90;if(art==="nachPruefung")b.e.frist=7;if(art==="anderePartei")b.z.von="CHP";
    expect(d(w).erinnerungen).toHaveLength(1);expect(d(w).nachVerfall).toBe(23);expect(d(w).bruch).toBe(false);
  });
  test("bloß fällige Zusagen ohne geöffnete Erinnerung bekommen keine erfundene Verfallsfrist",()=>{
    const w=welt();zusage(w,2);w.spiel!.ereignisse=[];
    expect(zusagenDruck(w,"YENİ")).toBeUndefined();expect(gefaehrdeteZusagen(w)[0]!.druck).toBeUndefined();
  });
  test("doppelte Alt-Erinnerungen zählen die Zusage einmal mit der frühesten Frist",()=>{
    const w=welt(),{e}=zusage(w,5);w.spiel!.ereignisse.push({...structuredClone(e),id:"alt-doppelt",frist:1});
    expect(d(w).erinnerungen).toHaveLength(1);expect(d(w).erinnerungen[0]!.ereignis).toBe("alt-doppelt");expect(d(w).nachVerfall).toBe(23);
  });
  test.each([[50,20,false],[49.9999,19.9999,true],[10,0,true]] as const)("bei Loyalität %s wird auf %s begrenzt und die exakte Bruchschwelle geprüft",(loyal,nach,bruch)=>{
    const w=welt(loyal);zwei(w);expect(d(w).nachVerfall).toBeCloseTo(nach,6);expect(d(w).bruch).toBe(bruch);
  });
  test("nur aktive Koalitionsvorsitzende zählen; mehrere aktive werden über den schwächsten bewertet",()=>{
    const w=welt(70);zwei(w);const alt={...structuredClone(chef(w)),id:"alt",loyalitaet:1,imAmt:false};w.spiel!.figuren.push(alt);
    expect(d(w).nachVerfall).toBe(40);w.spiel!.figuren.push({...structuredClone(alt),id:"mitvorsitz",imAmt:true,loyalitaet:35});
    expect(d(w).nachVerfall).toBe(5);
    w.spiel!.lager=[];expect(zusagenDruck(w,"YENİ")).toBeUndefined();
    w.spiel!.lager=["YENİ"];for(const f of aktiveParteivorsitzende(w,"YENİ"))f.imAmt=false;
    expect(zusagenDruck(w,"YENİ")).toBeUndefined();
  });
  test("Gespräch zeigt Soforthilfe und weiterhin gefährliche Summe beider Erinnerungen",()=>{
    const w=welt();zwei(w);const p=koalitionsHilfePlan(w,"YENİ","fraktion")!,stand=save(w);
    expect(p.druck).toMatchObject({loyalitaet:43,nachVerfall:13,bruch:true});expect(save(w)).toBe(stand);
    expect(stabilisiereKoalition(w,p).ok).toBe(true);expect(d(w)).toEqual(p.druck);expect(d(w).erinnerungen).toHaveLength(2);
  });
  test.each(["einloesen","vertroesten"] as const)("%s berücksichtigt nur die danach verbleibende Erinnerung samt tatsächlichem Loyalitätspreis",art=>{
    const w=welt(),[a,b]=zwei(w),plan=zusagenSchrittPlan(w,a.z.id,art)!,stand=save(w);
    expect(plan.druck!.erinnerungen.map(e=>e.zusage.id)).toEqual([b.z.id]);
    expect(plan.druck!.nachVerfall).toBe(art==="einloesen"?35:15);expect(plan.druck!.bruch).toBe(art==="vertroesten");
    expect(save(w)).toBe(stand);expect(fuehreZusagenSchrittAus(w,plan).ok).toBe(true);expect(d(w)).toEqual(plan.druck);
  });
  test("Erfüllung der letzten Erinnerung entfernt die bedingte Verfallsfolge aus der Vorschau",()=>{
    const w=welt(),a=zusage(w,2),p=zusagenSchrittPlan(w,a.z.id,"einloesen")!;
    expect(p.druck).toBeUndefined();expect(fuehreZusagenSchrittAus(w,p).ok).toBe(true);expect(zusagenDruck(w,"YENİ")).toBeUndefined();
  });
  test("ein neu hinzukommender Verfall macht das alte Gesprächsangebot ohne Teilbuchung ungültig",()=>{
    const w=welt();zusage(w,2);const p=koalitionsHilfePlan(w,"YENİ","fraktion")!;
    zusage(w,6);const stand=save(w);expect(stabilisiereKoalition(w,p).ok).toBe(false);expect(save(w)).toBe(stand);
  });
  test("echter Monatslauf: Gespräch allein verliert die Mehrheit, Erfüllung einer der Zusagen erhält sie",()=>{
    const w=welt(),[a]=zwei(w),gespraech=load(save(w));
    expect(stabilisiereKoalition(gespraech,koalitionsHilfePlan(gespraech,"YENİ","fraktion")!).ok).toBe(true);
    expect(fuehreZusagenSchrittAus(w,zusagenSchrittPlan(w,a.z.id,"einloesen")!).ok).toBe(true);
    for(const x of [w,gespraech])for(let tag=1;tag<=6;tag++){x.day=tag;x.date=addDays("2028-06-25",tag);spielTick(x,new Rng(19));}
    expect(gespraech.spiel!.zusagen.every(z=>z.gebrochen)).toBe(true);expect(regierungsSitze(gespraech)).toBe(200);
    expect(w.spiel!.zusagen[0]!.erfuellt).toBe(true);expect(w.spiel!.zusagen[1]!.gebrochen).toBe(true);expect(regierungsSitze(w)).toBe(320);
  });
  test("Versorgungsnachsorge verwendet dieselben Fristen und zeigt Gespräche auch bei noch hohem Rückhalt",()=>{
    const w=welt();gueterSicht(w);expect(beschliesseVersorgungsProgramm(w,"schutz").ok).toBe(true);
    w.day=7;w.date="2028-06-25";versorgungsParlamentTag(w);chef(w).loyalitaet=38;zwei(w);
    const s=versorgungsNachsorge(w,"schutz")!;expect(s.partner[0]!.druck).toEqual(d(w));
    expect(versorgungsStabilisierungsPlan(w,"schutz","YENİ","fraktion")!.druck!.nachVerfall).toBe(13);
    const html=renderToStaticMarkup(<VersorgungsNachsorge world={w} programm="schutz" onErgebnis={()=>{}}/>);
    expect(html).toContain(t("zd.titel"));expect(html).toContain(t("zd.nachSchritt"));expect(html).toContain(t("vn.aktion.fraktion"));
  });
  test.each(["de","en","tr"] as const)("gemeinsame Übersicht und Schritte auf %s zeigen bedingte Folgen und konkrete Fristen ohne Änderungen",async lang=>{
    await setzeSprache(lang);const w=welt(49.9999);zwei(w);const lage=d(w),stand=save(w);
    const html=renderToStaticMarkup(<ZusagenDruck lage={lage} onErinnerung={()=>{}}/>);
    expect(html).toContain("&lt; 20");expect(html).toContain(t("zd.antworten"));expect(html).toContain(formatDateDe("2028-06-27"));
    expect(html).not.toMatch(/⟦|NaN|undefined/);expect(save(w)).toBe(stand);
    const desk=renderToStaticMarkup(<ZusagenWache world={w} refresh={()=>{}} onGehe={()=>{}}/>);
    expect(desk.match(/class="zd zd-gefahr"/g)).toHaveLength(1);
    const schritte=renderToStaticMarkup(<ZusagenSchritte world={w} s={gefaehrdeteZusagen(w)[0]!} onGehe={()=>{}} onErgebnis={()=>{}}/>);
    expect(schritte).toContain(t("zd.nachSchritt"));
    const akte=renderToStaticMarkup(<ZusagenAnsicht world={w} refresh={()=>{}}/>);expect(akte).toContain(t("zd.titel"));
    for(const key of Object.keys(katalogVon("de")).filter(k=>k.startsWith("zd."))){expect(katalogVon(lang)[key]).toBeDefined();expect(platzhalter(katalogVon(lang)[key]!)).toEqual(platzhalter(katalogVon("de")[key]!));}
  });
});
