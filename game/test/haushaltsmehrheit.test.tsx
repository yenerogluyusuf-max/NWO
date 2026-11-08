import { afterEach, describe, expect, test } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createWorld, save, load } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { startAfterElection, schnellProfil } from "../src/sim/prolog";
import { bringeHaushaltsgesetzEin, haushaltsGesetzSicht, haushaltsEntwurfsSicht, haushaltsStimmenKaufen, haushaltszyklusTag, setzeEntwurf } from "../src/sim/haushalt";
import { haushaltsMehrheitsPlan, haushaltsFraktionsWege, sichereHaushaltsMehrheit } from "../src/sim/haushaltsmehrheit";
import { HaushaltsMehrheit, HaushaltsAbkommensKarte } from "../src/ui/wirtschaft/HaushaltsMehrheit";
import { Haushalt } from "../src/ui/wirtschaft/Haushalt";
import { haushaltZustand } from "../src/sim/wirtschaft";
import { stimmenSicht } from "../src/sim/handeln";
import { fraktion } from "../src/sim/fraktionen";
import { addDays, formatDateDe } from "../src/sim/dates";
import { setzeSprache, t, katalogVon, platzhalter } from "../src/i18n";
import { VERHANDLUNG } from "../src/sim/verhandeln";
import { Rng } from "../src/sim/rng";
import { oeffne } from "../src/sim/ereignisse";
import { AUFMERKSAMKEIT_KOSTEN } from "../src/sim/aufmerksamkeit";
import type { World } from "../src/sim/types";

function welt(einbringen=true) {
  const w=createWorld(turkey2026,17);startAfterElection(w,{...schnellProfil(),buendnis:"YENİ"});
  w.day=120;w.date="2028-10-10";w.spiel!.kapital=100;w.spiel!.lager=[];w.spiel!.zusagen=[];w.spiel!.ereignisse=[];
  w.parliament!.seats={[w.player!.partei.kurz]:180,CHP:180,"YENİ":120,MHP:90,DEM:30};
  fraktion(w,"CHP").duldungBis=w.day+10;fraktion(w,"YENİ").bereitschaft=65;
  expect(setzeEntwurf(w,"investitionen",1).ok).toBe(true);
  if(einbringen)expect(bringeHaushaltsgesetzEin(w).ok).toBe(true);
  return w;
}
const chef=(w:World)=>w.spiel!.figuren.find(f=>f.amt==="partner"&&f.partei==="YENİ")!;
afterEach(async()=>{await setzeSprache("de");});
describe("Haushalt: Mehrheit zum Votum",()=>{
  test("eine vor dem Votum auslaufende Duldung darf die Lücke nicht verdecken",()=>{
    const w=welt(),g=haushaltZustand(w).gesetz!;
    const ja=stimmenSicht({...w,day:g.abstimmung,date:addDays(w.date,g.abstimmung-w.day)}).erwartet;
    expect(ja).toBeLessThan(301);expect(haushaltsGesetzSicht(w)!.ja).toBe(ja);
  });
  test("die Vorschau bleibt auf 600 Stimmen begrenzt",()=>{
    const w=welt();haushaltZustand(w).gesetz!.absprachen=800;
    expect(haushaltsGesetzSicht(w)!.ja).toBe(600);
  });
  test.each([NaN,0,-5,Infinity])("ungültige Absprache %s bucht nichts",n=>{
    const w=welt(),vorher=save(w);expect(haushaltsStimmenKaufen(w,n).ok).toBe(false);expect(save(w)).toBe(vorher);
  });
  test.each([-1,0,1])("Duldung endet %s Tage relativ zum Votum",offset=>{
    const w=welt(),g=haushaltZustand(w).gesetz!;fraktion(w,"CHP").duldungBis=g.abstimmung+offset;
    const p=haushaltsGesetzSicht(w)!;
    expect(p.auslaufend.map(f=>f.partei)).toEqual(offset<=0?["CHP"]:[]);
    expect(p.ja<p.heuteJa).toBe(offset<=0);
    if(offset<=0)expect(p.auslaufend[0]!.datum).toBe(addDays(w.date,g.abstimmung+offset-w.day));
  });
  test("mehrere Fristen werden geordnet, bereits beendete und Koalitionsduldungen ausgeschlossen",()=>{
    const w=welt();fraktion(w,"MHP").duldungBis=w.day+2;fraktion(w,"DEM").duldungBis=w.day;
    w.spiel!.lager=["YENİ"];fraktion(w,"YENİ").duldungBis=w.day+1;
    expect(haushaltsGesetzSicht(w)!.auslaufend.map(f=>f.partei)).toEqual(["MHP","CHP"]);
  });
  test("überfällige Voten beleben keine alte Duldung wieder",()=>{
    const w=welt();haushaltZustand(w).gesetz!.abstimmung=w.day-2;fraktion(w,"CHP").duldungBis=w.day-1;
    expect(haushaltsGesetzSicht(w)).toMatchObject({tag:w.day,datum:w.date,fristDelta:0,auslaufend:[],tageBis:0});
  });
  test("Entwurf und eingebrachtes Gesetz haben dieselbe Terminvorschau",()=>{
    const w=welt(false),p=haushaltsEntwurfsSicht(w)!;
    expect(p.auslaufend.map(f=>f.partei)).toEqual(["CHP"]);expect(p.ja).toBeLessThan(301);
    expect(bringeHaushaltsgesetzEin(w).ok).toBe(true);expect(haushaltsGesetzSicht(w)).toEqual(p);
    expect(haushaltsEntwurfsSicht(w)).toBeNull();
  });
  test("leere und geschlossene Entwürfe zeigen keinen fiktiven Abstimmungstermin",()=>{
    const w=welt(false);haushaltZustand(w).entwurf={};expect(haushaltsEntwurfsSicht(w)).toBeNull();
    haushaltZustand(w).entwurf={investitionen:1};w.date="2028-09-10";expect(haushaltsEntwurfsSicht(w)).toBeNull();
  });
  test.each(["einfach","puffer"] as const)("%s erreicht das angezeigte Ziel, bucht genau den Preis und stimmt nicht vorzeitig ab",art=>{
    const w=welt(),a=haushaltsMehrheitsPlan(w,art)!,g=structuredClone(haushaltZustand(w).gesetz!);
    const k=w.spiel!.kapital,auf=w.spiel!.verfassung!.aufmerksamkeit,z=structuredClone(w.spiel!.zusagen),anzahl=w.log.length;
    expect(a.nachher).toBe(art==="einfach"?301:309);expect(a.aufmerksamkeit).toBe(0);
    expect(a.vorher).toBe(233);expect(a.pk).toBe(art==="einfach"?34:38);
    expect(sichereHaushaltsMehrheit(w,a).ok).toBe(true);
    expect(haushaltsGesetzSicht(w)!.ja).toBe(a.nachher);expect(w.spiel!.kapital).toBe(k-a.pk);
    expect(w.spiel!.verfassung!.aufmerksamkeit).toBe(auf);expect(w.spiel!.zusagen).toEqual(z);
    expect(haushaltZustand(w).gesetz).toEqual({...g,absprachen:g.absprachen+a.stimmen});expect(w.log.length).toBe(anzahl+1);
    expect(haushaltZustand(w).stufen.investitionen??0).toBe(0);
    const stand=save(w);expect(sichereHaushaltsMehrheit(w,a).ok).toBe(false);expect(save(w)).toBe(stand);
  });
  test("einfache Mehrheit bleibt bezahlbar, wenn der größere Puffer den Überziehungsrahmen übersteigt",()=>{
    const w=welt(),einfach=haushaltsMehrheitsPlan(w,"einfach")!;w.spiel!.kapital=einfach.pk-20;
    const a=haushaltsMehrheitsPlan(w,"einfach")!,b=haushaltsMehrheitsPlan(w,"puffer")!;
    expect(a.moeglich).toBe(true);expect(a.kapitalDanach).toBe(-20);expect(b.moeglich).toBe(false);
    const stand=save(w);expect(sichereHaushaltsMehrheit(w,b).ok).toBe(false);expect(save(w)).toBe(stand);
    const html=renderToStaticMarkup(<HaushaltsMehrheit world={w} geaendert={()=>{}}/>);
    expect(html).toContain(t("hm.kapital"));expect(html).toContain('disabled=""');
    expect(sichereHaushaltsMehrheit(w,a).ok).toBe(true);expect(w.spiel!.kapital).toBe(-20);
  });
  test.each(["duldung","koalition"] as const)("%s: Stimmen, Preis, Aufmerksamkeit, Bereitschaft und feste Zusage entsprechen dem wirklichen Abschluss",art=>{
    const w=welt(),a=haushaltsMehrheitsPlan(w,art,"YENİ")!,person=structuredClone(chef(w)),bereitschaft=fraktion(w,"YENİ").bereitschaft;
    expect(a.gewinn).toBeGreaterThan(0);expect(a.fraktion!.zusagenziel).toBeDefined();
    expect(sichereHaushaltsMehrheit(w,a).ok).toBe(true);
    expect(haushaltsGesetzSicht(w)!.ja).toBe(a.nachher);expect(w.spiel!.kapital).toBe(a.kapitalDanach);
    expect(w.spiel!.verfassung!.aufmerksamkeit).toBe(a.aufmerksamkeitDanach);expect(a.aufmerksamkeit).toBe(AUFMERKSAMKEIT_KOSTEN[art]);
    expect(fraktion(w,"YENİ").bereitschaft).toBe(bereitschaft+a.bereitschaftDelta);expect(chef(w)).toEqual(person);
    const dauer=art==="duldung"?VERHANDLUNG.duldungTage:VERHANDLUNG.koalitionZusageTage,ziel=a.fraktion!.zusagenziel!;
    expect(w.spiel!.zusagen.at(-1)).toMatchObject({von:"YENİ",faellig:w.day+dauer,massnahme:ziel.massnahme,stufeStart:ziel.stufeStart,stufeZiel:ziel.stufeZiel,erfuellt:false,gebrochen:false});
    expect(w.spiel!.lager.includes("YENİ")).toBe(art==="koalition");
    const stand=save(w);expect(sichereHaushaltsMehrheit(w,a).ok).toBe(false);expect(save(w)).toBe(stand);
  });
  test("neuer Vorsitz entsteht nur beim echten Abschluss; die Vorschau bleibt zustandsneutral",()=>{
    const w=welt();w.spiel!.figuren=w.spiel!.figuren.filter(f=>f.partei!=="YENİ");const stand=save(w),a=haushaltsMehrheitsPlan(w,"koalition","YENİ")!;
    expect(save(w)).toBe(stand);expect(a.fraktion!.vorsitz).toEqual([]);
    expect(sichereHaushaltsMehrheit(w,a).ok).toBe(true);expect(chef(w)).toMatchObject({loyalitaet:55,imAmt:true});
  });
  test("laufende Duldungen lassen sich erst nach Ablauf erneuern; ein Bündnis bleibt eine gesonderte Alternative",()=>{
    const w=welt();fraktion(w,"CHP").bereitschaft=65;
    expect(haushaltsMehrheitsPlan(w,"duldung","CHP")).toBeUndefined();expect(haushaltsMehrheitsPlan(w,"koalition","CHP")).toBeDefined();
    w.day+=10;w.date=addDays(w.date,10);expect(haushaltsMehrheitsPlan(w,"duldung","CHP")).toBeDefined();
  });
  test("eine vor dem verschobenen Votum endende neue Duldung wird nicht als Stimmengewinn angeboten",()=>{
    const w=welt();haushaltZustand(w).gesetz!.abstimmung=w.day+180;
    expect(haushaltsMehrheitsPlan(w,"duldung","YENİ")).toBeUndefined();
  });
  test("Angebote verwenden nur ausführbare Fraktionen und sortieren nach Restlücke und Preis",()=>{
    const w=welt(),wege=haushaltsFraktionsWege(w),stand=save(w);
    expect(wege.length).toBeGreaterThan(1);expect(wege.every(a=>a.moeglich&&a.gewinn>0&&a.partei!==w.player!.partei.kurz)).toBe(true);
    for(let i=1;i<wege.length;i++){const a=wege[i-1]!,b=wege[i]!;expect(a.luecke<=b.luecke).toBe(true);if(a.luecke===b.luecke)expect(a.pk<=b.pk).toBe(true);}
    haushaltsFraktionsWege(w);expect(save(w)).toBe(stand);
    w.spiel!.verfassung!.pauseBis=w.day+3;expect(haushaltsFraktionsWege(w)).toEqual([]);
  });
  test.each(["kapital","sitze","termin","bereitschaft","rng"])("geänderte Bedingung %s entwertet alte Abkommen ohne Teilbuchung",art=>{
    const w=welt(),a=haushaltsMehrheitsPlan(w,"koalition","YENİ")!;
    if(art==="kapital")w.spiel!.kapital-=0.01;
    if(art==="sitze")w.parliament!.seats["YENİ"]!--;
    if(art==="termin")haushaltZustand(w).gesetz!.abstimmung++;
    if(art==="bereitschaft")fraktion(w,"YENİ").bereitschaft++;
    if(art==="rng")w.rngState=new Rng(71).state;
    const stand=save(w);expect(sichereHaushaltsMehrheit(w,a).ok).toBe(false);expect(save(w)).toBe(stand);
  });
  test("ein Angebot verwendet seine geprüften Werte statt manipulierter Stimmen oder Preise",()=>{
    const w=welt(),a=haushaltsMehrheitsPlan(w,"einfach")!,pk=a.pk;a.stimmen=500;a.pk=0;
    const k=w.spiel!.kapital;expect(sichereHaushaltsMehrheit(w,a).ok).toBe(true);
    expect(haushaltsGesetzSicht(w)!.ja).toBe(301);expect(w.spiel!.kapital).toBe(k-pk);
  });
  test("bereits gesicherter Puffer erzeugt keine weitere kostenpflichtige Absprache",()=>{
    const w=welt();haushaltZustand(w).gesetz!.absprachen=200;
    expect(haushaltsMehrheitsPlan(w,"einfach")).toBeUndefined();expect(haushaltsMehrheitsPlan(w,"puffer")).toBeUndefined();
    expect(renderToStaticMarkup(<HaushaltsMehrheit world={w} geaendert={()=>{}}/>)).toContain(t("hm.pufferSteht"));
  });
  test("vor dem Votum drohender Bruch ist trotz nomineller Mehrheit sichtbar; inaktive Vorsitzende zählen nicht",()=>{
    const w=welt();w.date="2028-10-20";chef(w).loyalitaet=19.99999;
    const a=haushaltsMehrheitsPlan(w,"koalition","YENİ")!;
    expect(a.risiken).toMatchObject([{partei:"YENİ",loyalitaet:19.99999,datum:"2028-11-01",sitze:120}]);
    const html=renderToStaticMarkup(<HaushaltsAbkommensKarte world={w} plan={a} onAnnehmen={()=>{}}/>);
    expect(html).toContain(formatDateDe("2028-11-01"));expect(html).toContain("&lt; 20");
    chef(w).imAmt=false;expect(haushaltsMehrheitsPlan(w,"koalition","YENİ")!.risiken).toEqual([]);
  });
  test("offene Zusagenerinnerungen werden beim neuen Bündnis mitgezählt und entwerten ältere Angebote",()=>{
    const w=welt();w.date="2028-10-20";chef(w).loyalitaet=30;
    const a=haushaltsMehrheitsPlan(w,"koalition","YENİ")!;
    w.spiel!.zusagen.push({id:"alt",von:"YENİ",text:"Alte Zusage",faellig:w.day,erfuellt:false,gebrochen:false});
    const e=oeffne(w,"zusage",new Rng(3),{provinzen:[],staerke:1,daten:{zusage:"alt"}})!;e.frist=w.day+2;
    const b=haushaltsMehrheitsPlan(w,"koalition","YENİ")!;expect(b.druck[0]).toMatchObject({nachVerfall:15,bruch:true});
    const stand=save(w);expect(sichereHaushaltsMehrheit(w,a).ok).toBe(false);expect(save(w)).toBe(stand);
  });
  test("ohne laufendes Haushaltsgesetz und nach Amtsende wird nichts gebucht",()=>{
    const w=welt(),a=haushaltsMehrheitsPlan(w,"puffer")!;haushaltZustand(w).gesetz=null;
    expect(haushaltsFraktionsWege(w)).toEqual([]);expect(sichereHaushaltsMehrheit(w,a).ok).toBe(false);
    const ende=welt();ende.spiel!.ende={art:"abwahl",tag:ende.day,datum:ende.date,titel:"Abgewählt",text:"Amtsende"};
    const stand=save(ende);expect(haushaltsStimmenKaufen(ende,10).ok).toBe(false);expect(haushaltsFraktionsWege(ende)).toEqual([]);
    expect(save(ende)).toBe(stand);
  });
  test("Speichern und Laden erhalten Terminprognose, Absprache und Vertragsfolgen",()=>{
    const w=welt();expect(sichereHaushaltsMehrheit(w,haushaltsMehrheitsPlan(w,"duldung","YENİ")!).ok).toBe(true);
    expect(sichereHaushaltsMehrheit(w,haushaltsMehrheitsPlan(w,"puffer")!).ok).toBe(true);
    const p=haushaltsGesetzSicht(w),neu=load(save(w));expect(haushaltsGesetzSicht(neu)).toEqual(p);
    expect(neu.spiel!.zusagen).toEqual(w.spiel!.zusagen);expect(haushaltZustand(neu).gesetz).toEqual(haushaltZustand(w).gesetz);
  });
  test("echtes Haushaltsvotum: ohne Hilfe scheitert der Entwurf, mit Puffer wird er bei gleicher Streuung beschlossen",()=>{
    const ohne=welt(),mit=load(save(ohne)),p=haushaltsMehrheitsPlan(mit,"puffer")!;
    expect(sichereHaushaltsMehrheit(mit,p).ok).toBe(true);
    const streuung=Math.round(new Rng(91).normal(6));
    for(const w of [ohne,mit]){
      const g=haushaltZustand(w).gesetz!,prognose=haushaltsGesetzSicht(w)!;
      w.day=g.abstimmung;w.date=prognose.datum;haushaltszyklusTag(w,new Rng(91));
      expect(w.spiel!.chronik.at(-1)!.ausgang).toContain(`${prognose.ja+streuung} zu ${600-prognose.ja-streuung}`);
      expect(haushaltZustand(w).gesetz).toBeNull();
    }
    expect(haushaltZustand(ohne).letztesErgebnis).toBe("gescheitert");expect(haushaltZustand(ohne).stufen.investitionen??0).toBe(0);
    expect(haushaltZustand(mit).letztesErgebnis).toBe("angenommen");expect(haushaltZustand(mit).stufen.investitionen).toBe(1);
  });
  test.each(["de","en","tr"] as const)("Haushalts- und Vertragskarten auf %s zeigen echte Fristen, Lücken, Preise und Zielzustände",async lang=>{
    await setzeSprache(lang);const w=welt(),p=haushaltsGesetzSicht(w)!,a=haushaltsMehrheitsPlan(w,"koalition","YENİ")!,stand=save(w);
    const html=renderToStaticMarkup(<HaushaltsMehrheit world={w} geaendert={()=>{}}/>);
    expect(html).toContain(t("hm.titel"));expect(html).toContain(t("gp.luecke",{n:p.luecke}));expect(html).toContain(formatDateDe(p.auslaufend[0]!.datum));
    const plan=haushaltsMehrheitsPlan(w,"einfach")!;expect(html).toContain(t("hm.preis",{pk:plan.pk,aufmerksamkeit:0}));
    const vertrag=renderToStaticMarkup(<HaushaltsAbkommensKarte world={w} plan={a} onAnnehmen={()=>{}}/>);
    expect(vertrag).toContain(t("hm.gewinn",{n:a.gewinn}));expect(vertrag).toContain(t("fa.preis",{pk:a.pk,aufmerksamkeit:a.aufmerksamkeit}));
    expect(vertrag).toContain(t("fa.zielFest"));expect(vertrag).toContain(formatDateDe(addDays(w.date,150)));
    expect(html+vertrag).not.toContain("⟦");expect(html+vertrag).not.toMatch(/\{(?:n|datum|sitze|partei|pk|plus)\}/);expect(save(w)).toBe(stand);
    for(const key of Object.keys(katalogVon("de")).filter(k=>k.startsWith("hm.")))expect(platzhalter(katalogVon(lang)[key]!)).toEqual(platzhalter(katalogVon("de")[key]!));
  });
  test("die eigentliche Haushaltsansicht enthält vor Einbringung und während Beratung dieselbe Prognose",()=>{
    for(const eingebracht of [false,true]){
      const w=welt(eingebracht),p=eingebracht?haushaltsGesetzSicht(w)!:haushaltsEntwurfsSicht(w)!;
      const html=renderToStaticMarkup(<Haushalt world={w} geaendert={()=>{}} posten="_zyklus"/>);
      expect(html).toContain(t("gp.titel"));expect(html).toContain(t("gp.luecke",{n:p.luecke}));expect(html).toContain(formatDateDe(p.datum));
      if(eingebracht)expect(html).toContain(t("hm.titel"));
      const kachel=renderToStaticMarkup(<Haushalt world={w} geaendert={()=>{}}/>);
      expect(kachel).toContain(t("gp.luecke",{n:p.luecke}));expect(kachel).toContain(t("hm.kachelFristen",{n:p.auslaufend.length}));
      expect(kachel).toContain(t("hm.kachelStimmen",{datum:formatDateDe(p.datum)}));
    }
  });
});
