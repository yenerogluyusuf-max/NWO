import { afterEach, describe, expect, test } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createWorld, save, load } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { schnellProfil, startAfterElection } from "../src/sim/prolog";
import { fraktion } from "../src/sim/fraktionen";
import { gueterSicht } from "../src/sim/gueter";
import { aussenZustand } from "../src/sim/diplomatie";
import { beschliesseVersorgungsProgramm, aendereVersorgungsVorlage } from "../src/sim/versorgungspolitik";
import { versorgungsNachsorge } from "../src/sim/versorgungsnachsorge";
import { verhandle } from "../src/sim/verhandeln";
import { spielTick } from "../src/sim/spiel";
import { Rng } from "../src/sim/rng";
import { VersorgungsMonatsbericht } from "../src/ui/gueter/VersorgungsMonatsbericht";
import { VersorgungsNachsorge } from "../src/ui/gueter/VersorgungsNachsorge";
import { SprungKontext } from "../src/ui/akte/Uebersicht";
import { setzeSprache, t, katalogVon, platzhalter } from "../src/i18n";
import type { World } from "../src/sim/types";

function welt() {
  const w=createWorld(turkey2026,17);startAfterElection(w,schnellProfil());
  w.date="2028-06-24";w.day=0;w.spiel!.start.datum=w.date;
  w.spiel!.ereignisse=[];w.spiel!.zusagen=[];w.spiel!.kapital=150;w.spiel!.lager=["YENİ"];
  w.parliament!.seats={[w.player!.partei.kurz]:200,"YENİ":120,CHP:200,MHP:50,DEM:30};
  for(const p of Object.keys(w.parliament!.seats))fraktion(w,p).bereitschaft=50;
  chef(w).loyalitaet=23;aussenZustand(w).energie.hormus="offen";gueterSicht(w);
  beschliesseVersorgungsProgramm(w,"schutz");aendereVersorgungsVorlage(w,"schutz","sozial");return w;
}
const chef=(w:World)=>w.spiel!.figuren.find(f=>f.amt==="partner"&&f.partei==="YENİ")!;
const v=(w:World)=>w.spiel!.gueter!.regierung!.vorlagen!.schutz!;
const b=(w:World)=>w.spiel!.gueter!.regierung!.bericht!;
function monatslauf(w:World){w.day=7;w.date="2028-07-01";spielTick(w,new Rng(19));}
afterEach(async()=>{await setzeSprache("de");});

describe("Tatsächlicher Koalitionsausgang nach der Versorgungsbewertung",()=>{
  test("Monatsbericht hält den echten Austritt vor dem Loyalitätsreset fest",()=>{
    const w=welt();monatslauf(w);
    expect(v(w).status).toBe("angenommen");expect(w.spiel!.lager).not.toContain("YENİ");
    expect(b(w).koalition).toMatchObject({datum:"2028-07-01",vorher:320,nachher:200,grenze:20,austritte:[{partei:"YENİ",name:chef(w).name,loyalitaet:19,sitze:120}]});
    expect(chef(w).loyalitaet).toBe(30);
    // Rollen bei der Bewertung bleiben historisch richtig; Austritt wird danach ergänzt.
    expect(b(w).politik!.traeger.find(f=>f.partei==="YENİ")!.rolle).toBe("koalition");
    expect(versorgungsNachsorge(w,"schutz")!.ausgeschieden).toEqual(["YENİ"]);
  });
  test("mehrere Austritte zählen Parteisitze einmal, auch bei mehreren Vorsitzenden",()=>{
    const w=welt();w.spiel!.lager.push("CHP","YENİ");
    w.spiel!.figuren.push({...structuredClone(chef(w)),id:"chp-test",partei:"CHP",name:"Vorsitz CHP",loyalitaet:1});
    w.spiel!.figuren.push({...structuredClone(chef(w)),id:"zweiter-yeni",loyalitaet:1});
    monatslauf(w);
    expect(b(w).koalition).toMatchObject({vorher:520,nachher:200});
    expect(b(w).koalition!.austritte.map(f=>f.partei)).toEqual(["YENİ","CHP"]);
    expect(b(w).koalition!.austritte.reduce((sum,f)=>sum+f.sitze,0)).toBe(320);
    // Auch damals erfüllte Forderungen verhindern die Anzeige eines später verlorenen Partners nicht.
    expect(v(w).stimmen!.find(f=>f.partei==="CHP")!.erfuellt).toBe(true);
    expect(versorgungsNachsorge(w,"schutz")!.ausgeschieden).toContain("CHP");
  });
  test.each(["stabil","inaktiv"])("kein erfundener Austritt bei %s",fall=>{
    const w=welt();if(fall==="stabil")chef(w).loyalitaet=55;else chef(w).imAmt=false;
    monatslauf(w);expect(b(w).koalition).toBeUndefined();expect(w.spiel!.lager).toContain("YENİ");
  });
  test("Neubündnis verändert heutige Nachsorge, nicht den gespeicherten Monatsausgang",()=>{
    const w=welt();monatslauf(w);const bericht=JSON.stringify(b(w)),reaktionen=JSON.stringify(v(w).reaktionen);
    fraktion(w,"YENİ").bereitschaft=60;
    expect(verhandle(w,"YENİ","koalition",new Rng(42)).ok).toBe(true);
    expect(versorgungsNachsorge(w,"schutz")!.ausgeschieden).toEqual([]);
    expect(versorgungsNachsorge(w,"schutz")!.sitze).toBe(320);
    expect(JSON.stringify(b(w))).toBe(bericht);expect(JSON.stringify(v(w).reaktionen)).toBe(reaktionen);
    expect(b(load(save(w))).koalition).toEqual(b(w).koalition);
  });
  test("alte Berichte ohne Austrittsbeleg erfinden keinen Verlauf",()=>{
    const w=welt();monatslauf(w);delete b(w).koalition;
    const alt=load(save(w)),stand=save(alt);
    expect(renderToStaticMarkup(<VersorgungsMonatsbericht bericht={b(alt)}/>)).not.toContain(t("vm.bruch.titel"));
    expect(versorgungsNachsorge(alt,"schutz")!.ausgeschieden).toEqual(["YENİ"]);
    expect(save(alt)).toBe(stand);
  });
  test("Rundung verdeckt eine nur knapp unterschrittene Bruchschwelle nicht",()=>{
    const w=welt();monatslauf(w);b(w).koalition!.austritte[0]!.loyalitaet=19.99999;
    const html=renderToStaticMarkup(<VersorgungsMonatsbericht bericht={b(w)}/>);
    expect(html).toContain(t("vm.bruch.knapp",{grenze:20}));expect(html).not.toContain("20,00 Loyalität");
  });
  test.each(["de","en","tr"] as const)("Monatsausgang und heutiger Handlungsbedarf in %s sind übersetzt und zustandsneutral",async sprache=>{
    await setzeSprache(sprache);const w=welt();monatslauf(w);const stand=save(w);
    const html=renderToStaticMarkup(<SprungKontext.Provider value={()=>{}}><VersorgungsMonatsbericht bericht={b(w)}/><VersorgungsNachsorge world={w} programm="schutz" onErgebnis={()=>{}}/></SprungKontext.Provider>);
    expect(html).toContain(t("vm.bruch.titel"));expect(html).toContain(t("vn.lagerGeaendert"));
    expect(html).toContain(t("vn.lueckeHeute",{n:101}));expect(html).toContain(t("vm.bruch.parlament"));
    expect(html).toContain('type="button"');expect(html).not.toContain("⟦");expect(save(w)).toBe(stand);
    const keys=Object.keys(katalogVon("de")).filter(k=>k.startsWith("vm.bruch.")||["vn.lagerGeaendert","vn.ehemaligePartner","vn.mehrheitHeute","vn.lueckeHeute","vn.neuesBuendnis"].includes(k));
    for(const key of keys)expect(platzhalter(katalogVon(sprache)[key]!)).toEqual(platzhalter(katalogVon("de")[key]!));
  });
});
