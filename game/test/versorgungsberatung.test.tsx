import { afterEach, describe, expect, test } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createWorld, load, save } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { schnellProfil, startAfterElection } from "../src/sim/prolog";
import { gueterSicht } from "../src/sim/gueter";
import { fraktion } from "../src/sim/fraktionen";
import { aussenZustand } from "../src/sim/diplomatie";
import { addDays } from "../src/sim/dates";
import { versorgungsMehrheitsWege, uebernehmeVersorgungsWeg, versorgungsReaktionsVorschau } from "../src/sim/versorgungsberatung";
import { beschliesseVersorgungsProgramm, aendereVersorgungsVorlage, versorgungsParlamentTag, versorgungsKonditionen, versorgungsKlauselnGrund } from "../src/sim/versorgungspolitik";
import { versorgungsStimmen } from "../src/sim/versorgungsmehrheit";
import { VersorgungsMandat, VersorgungsTagesordnung } from "../src/ui/gueter/VersorgungsMandat";
import { setzeSprache, t, katalogVon, platzhalter } from "../src/i18n";
import type { World } from "../src/sim/types";
import type { KriegVorgang } from "../src/sim/krieg-typen";

function welt() {
  const w=createWorld(turkey2026,17);startAfterElection(w,schnellProfil());
  w.spiel!.ereignisse=[];w.spiel!.kapital=150;w.spiel!.lager=["YENİ"];
  w.parliament!.seats={[w.player!.partei.kurz]:130,"YENİ":120,CHP:200,MHP:80,DEM:70};
  for(const p of Object.keys(w.parliament!.seats)) fraktion(w,p).bereitschaft=50;
  aussenZustand(w).energie.hormus="offen";gueterSicht(w);
  beschliesseVersorgungsProgramm(w,"schutz");return w;
}
const v=(w:World)=>w.spiel!.gueter!.regierung!.vorlagen!.schutz!;
const wege=(w:World)=>versorgungsMehrheitsWege(w,"schutz");
function zeit(w:World,n:number){w.day+=n;w.date=addDays(w.date,n);}
const zahlJa=(w:World)=>versorgungsStimmen(w,v(w),v(w).abstimmung).reduce((s,f)=>s+f.ja,0);
afterEach(async()=>{await setzeSprache("de");});

describe("Konkrete Verhandlungswege",()=>{
  test("gefährdete Mehrheit erhält ausführbare, unterschiedliche Kompromisse mit ehrlichen Fraktionsgewinnen",()=>{
    const w=welt(),vorher=save(w),wegeJetzt=wege(w);
    expect(zahlJa(w)).toBeLessThan(301);expect(wegeJetzt.length).toBeGreaterThan(0);expect(wegeJetzt.length).toBeLessThanOrEqual(3);
    expect(new Set(wegeJetzt.map(p=>p.klauseln.join())).size).toBe(wegeJetzt.length);
    for(const p of wegeJetzt){
      expect(p.ja).toBeGreaterThanOrEqual(301);expect(p.fehlt).toBe(0);expect(p.puffer).toBe(p.ja-301);
      expect(p.stimmen.reduce((s,f)=>s+f.delta,0)).toBe(p.delta);
      expect(p.stimmen.some(f=>f.rolle==="opposition"&&f.delta>0)).toBe(true);
      expect(versorgungsKlauselnGrund(w,p.klauseln)).toBeUndefined();
      expect(p.pk).toBe(p.gespraeche.length);
    }
    expect(save(w)).toBe(vorher);
  });
  test("Übernahme, spätere Abstimmung und gebuchte Parteifolgen entsprechen jedem angebotenen Weg",()=>{
    const basis=welt();
    for(const p of wege(basis)) {
      const w=load(save(basis)),kapital=w.spiel!.kapital,debt=w.economy.debtRatio;
      expect(uebernehmeVersorgungsWeg(w,p).ok).toBe(true);
      expect(w.spiel!.kapital).toBe(kapital-p.pk);expect(w.economy.debtRatio).toBe(debt);
      expect(v(w).status).toBe("offen");expect(w.spiel!.gueter!.regierung!.programme.schutz).toBeUndefined();
      expect(zahlJa(w)).toBe(p.ja);expect(versorgungsKonditionen(v(w))).toEqual(p.konditionen);
      zeit(w,p.abstimmung-w.day);versorgungsParlamentTag(w);
      expect(v(w).status).toBe("angenommen");expect(v(w).stimmen!.reduce((s,f)=>s+f.ja,0)).toBe(p.ja);
      expect(v(w).reaktionen).toEqual(p.reaktionen);expect(w.economy.debtRatio).toBeCloseTo(debt+p.konditionen.bip);
    }
  });
  test("Loyalität und Bereitschaft zeigen tatsächliche begrenzte politische Kosten",()=>{
    const w=welt();fraktion(w,"YENİ").bereitschaft=2;fraktion(w,"CHP").bereitschaft=99;
    w.spiel!.figuren=w.spiel!.figuren.filter(p=>p.amt!=="partner");
    w.spiel!.figuren.push({id:"koal",name:"Partner",rolle:"Partner",amt:"partner",ziel:"Markt",loyalitaet:2,imAmt:true,partei:"YENİ"});
    const p=wege(w).find(p=>p.klauseln.includes("sozial"))!;expect(p).toBeDefined();
    expect(p.reaktionen.find(r=>r.partei==="YENİ")).toEqual({partei:"YENİ",bereitschaft:-2,personen:[{name:"Partner",loyalitaet:-2}]});
    expect(p.reaktionen.find(r=>r.partei==="CHP")!.bereitschaft).toBe(1);
    uebernehmeVersorgungsWeg(w,p);expect(fraktion(w,"YENİ").bereitschaft).toBe(2);
    zeit(w,p.abstimmung-w.day);versorgungsParlamentTag(w);expect(v(w).reaktionen).toEqual(p.reaktionen);
  });
  test("keine erfundene Mehrheit bei unvereinbaren Forderungen und aufgebrauchtem Kapital",()=>{
    const w=welt();w.spiel!.lager=[];w.spiel!.kapital=0;w.parliament!.seats={CHP:300,"YENİ":300};
    fraktion(w,"CHP").bereitschaft=0;fraktion(w,"YENİ").bereitschaft=0;
    const p=wege(w);expect(p.length).toBeGreaterThan(0);
    expect(p.every(p=>p.ja<301&&p.fehlt===301-p.ja&&p.pk===0)).toBe(true);
    const html=renderToStaticMarkup(<VersorgungsMandat world={w} programm="schutz" geaendert={()=>{}}/>);
    expect(html).toContain(t("mehrheitsweg.keineMehrheit"));
    for(const weg of p) expect(html).toContain(t("mandat.fehlen",{n:weg.fehlt}));
  });
  test("Gespräch allein sichert eine knappe Mehrheit ohne Klausel oder Fristverschiebung",()=>{
    const w=welt();w.spiel!.lager=[];
    for(let eigene=1;eigene<600;eigene++) {
      w.parliament!.seats={[w.player!.partei.kurz]:eigene,CHP:600-eigene};
      const vorher=zahlJa(w),danach=versorgungsStimmen(w,{...v(w),gespraeche:["CHP"]},v(w).abstimmung).reduce((s,f)=>s+f.ja,0);
      if(vorher<301 && danach>=301) break;
    }
    zeit(w,6);const termin=v(w).abstimmung,p=wege(w)[0]!;
    expect(zahlJa(w)).toBeLessThan(301);expect(p.klauseln).toEqual([]);expect(p.gespraeche).toEqual(["CHP"]);
    expect(p.pk).toBe(1);expect(p.ja).toBeGreaterThanOrEqual(301);expect(p.abstimmung).toBe(termin);
    expect(uebernehmeVersorgungsWeg(w,p).ok).toBe(true);
    const nachher=save(w);expect(uebernehmeVersorgungsWeg(w,p).ok).toBe(false);expect(save(w)).toBe(nachher);
  });
  test("Haushaltsdeckel wird atomar gegen Sozialausgleich getauscht",()=>{
    const w=welt();aendereVersorgungsVorlage(w,"schutz","haushalt");
    w.parliament!.seats={[w.player!.partei.kurz]:130,CHP:400,"YENİ":70};
    const p=wege(w).find(p=>p.klauseln.includes("sozial"))!;expect(p).toBeDefined();expect(p.entfernt).toContain("haushalt");
    expect(uebernehmeVersorgungsWeg(w,p).ok).toBe(true);
    expect(v(w).klauseln).toContain("sozial");expect(v(w).klauseln).not.toContain("haushalt");
    expect(zahlJa(w)).toBe(p.ja);
  });
  test.each(["kapital","sitze","bereitschaft","termin","tag","kurs"] as const)("veralteter Weg bei Änderung von %s wird ohne Teilbuchung verworfen",aenderung=>{
    const w=welt(),p=wege(w)[0]!;
    if(aenderung==="kapital") w.spiel!.kapital=0;
    if(aenderung==="sitze") w.parliament!.seats={CHP:600};
    if(aenderung==="bereitschaft") fraktion(w,"CHP").bereitschaft=0;
    if(aenderung==="termin") v(w).abstimmung++;
    if(aenderung==="tag") zeit(w,1);
    if(aenderung==="kurs") w.spiel!.gueter!.prioritaet="militaer";
    const stand=save(w);expect(uebernehmeVersorgungsWeg(w,p).ok).toBe(false);expect(save(w)).toBe(stand);
  });
  test("manipulierter Klauselsatz und doppelte Gespräche werden nicht teilweise übernommen",()=>{
    const w=welt(),p=wege(w)[0]!,stand=save(w);
    expect(uebernehmeVersorgungsWeg(w,{...p,klauseln:["sozial","haushalt"]}).ok).toBe(false);
    expect(uebernehmeVersorgungsWeg(w,{...p,gespraeche:["CHP","CHP"]}).ok).toBe(false);
    expect(save(w)).toBe(stand);
  });
  test("nach Fristablauf oder Abschluss gibt es keine nachträgliche Verhandlung",()=>{
    const w=welt(),p=wege(w)[0]!;zeit(w,7);const stand=save(w);
    expect(wege(w)).toEqual([]);expect(uebernehmeVersorgungsWeg(w,p).ok).toBe(false);expect(save(w)).toBe(stand);
    versorgungsParlamentTag(w);expect(wege(w)).toEqual([]);
  });
  test("späte Klauseln berücksichtigen Beratungstage und die dadurch auslaufende Duldung",()=>{
    const w=welt();w.parliament!.seats={[w.player!.partei.kurz]:130,"YENİ":100,CHP:370};fraktion(w,"CHP").duldungBis=w.day+8;
    zeit(w,6);const alt=v(w).abstimmung;
    const p=wege(w).find(p=>p.hinzu.length+p.entfernt.length>0)!;expect(p).toBeDefined();
    expect(p.abstimmung).toBe(w.day+3);expect(p.verschiebung).toBe(2);expect(p.duldungen.map(d=>d.partei)).toContain("CHP");
    expect(p.stimmen.find(f=>f.partei==="CHP")!.rolle).toBe("opposition");
    expect(p.ja).toBe(versorgungsStimmen(w,{...v(w),klauseln:p.klauseln,gespraeche:p.gespraeche},alt+2).reduce((s,f)=>s+f.ja,0));
    uebernehmeVersorgungsWeg(w,p);zeit(w,p.abstimmung-w.day);versorgungsParlamentTag(w);
    expect(v(w).stimmen!.reduce((s,f)=>s+f.ja,0)).toBe(p.ja);
  });
  test("Einsatzgarantie und gebundene Gegenkurse werden nicht als vermeintliche Lösung angeboten",()=>{
    const w=welt();expect(wege(w).every(p=>!p.klauseln.includes("einsatz"))).toBe(true);
    w.spiel!.kriege=[{id:"syr",land:"SYR",phase:"krieg"} as KriegVorgang];
    w.spiel!.gueter!.prioritaet="militaer";w.spiel!.gueter!.regierung!.kursAb=w.day+90;
    expect(wege(w).every(p=>!p.klauseln.includes("zivil"))).toBe(true);
  });
  test("ungültig gewordene Garantie kann durch einen gültigen Weg entfernt werden",()=>{
    const w=welt();w.spiel!.kriege=[{id:"syr",land:"SYR",phase:"krieg"} as KriegVorgang];
    aendereVersorgungsVorlage(w,"schutz","einsatz");w.spiel!.kriege=[];
    const p=wege(w)[0]!;expect(p).toBeDefined();expect(p.entfernt).toContain("einsatz");
    expect(uebernehmeVersorgungsWeg(w,p).ok).toBe(true);
  });
  test("keine Verhandlung beseitigt eine Sanktion gegen den Energielieferanten",()=>{
    const w=welt();expect(beschliesseVersorgungsProgramm(w,"energie","AZE").ok).toBe(true);
    expect(versorgungsMehrheitsWege(w,"energie").length).toBeGreaterThan(0);
    aussenZustand(w).eigeneSanktionen=["AZE"];
    const stand=save(w);expect(versorgungsMehrheitsWege(w,"energie")).toEqual([]);expect(save(w)).toBe(stand);
  });
  test("Vorschau initialisiert keine Fraktionen und zeigt keine fiktive Reaktion der eigenen Partei",()=>{
    const w=welt();w.spiel!.fraktionen={};const stand=save(w);
    const p=wege(w)[0]!;expect(p).toBeDefined();expect(p.reaktionen.some(r=>r.partei===w.player!.partei.kurz)).toBe(false);
    versorgungsReaktionsVorschau(w,versorgungsStimmen(w,v(w)));expect(save(w)).toBe(stand);
  });
  test("beide Ansichten zeigen ausführbare Wege; Vorschau und Übernahme überstehen Speichern und Laden",()=>{
    const w=welt(),p=wege(w)[0]!,kopie=load(save(w));expect(wege(kopie)).toEqual(wege(w));
    const stand=save(kopie);
    const akte=renderToStaticMarkup(<VersorgungsMandat world={kopie} programm="schutz" geaendert={()=>{}}/>);
    const parlament=renderToStaticMarkup(<VersorgungsTagesordnung world={kopie} geaendert={()=>{}}/>);
    for(const html of [akte,parlament]) {
      expect(html).toContain(t("mehrheitsweg.titel"));expect(html).toContain(t("mehrheitsweg.button"));expect(html).toContain(t("mehrheitsweg.preis"));
      expect(html).toContain("aria-label");expect(html).not.toContain("NaN");expect(html).not.toContain("⟦");
    }
    expect(save(kopie)).toBe(stand);expect(uebernehmeVersorgungsWeg(kopie,p).ok).toBe(true);
    const wieder=load(save(kopie));expect(v(wieder)).toEqual(v(kopie));expect(zahlJa(wieder)).toBe(p.ja);
  });
  test.each(["de","en","tr"] as const)("vollständiger Katalog und verständliche Verhandlung in %s",async sprache=>{
    await setzeSprache(sprache);const w=welt();
    const html=renderToStaticMarkup(<VersorgungsMandat world={w} programm="schutz" geaendert={()=>{}}/>);
    expect(html).toContain(t("mehrheitsweg.titel"));expect(html).not.toContain("⟦");expect(html).not.toMatch(/\{(?:name|pk|n|parteien|datum)\}/);
    for(const key of Object.keys(katalogVon("de")).filter(k=>k.startsWith("mehrheitsweg."))) {
      expect(katalogVon(sprache)[key]).toBeDefined();expect(platzhalter(katalogVon(sprache)[key]!)).toEqual(platzhalter(katalogVon("de")[key]!));
    }
  });
});
