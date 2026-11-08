import { afterEach, describe, expect, test } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createWorld, save, load } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { schnellProfil, startAfterElection } from "../src/sim/prolog";
import { fraktion } from "../src/sim/fraktionen";
import { aktiveParteivorsitzende } from "../src/sim/koalitionslage";
import { brecheZusage, loeseEin, vertroesteFrei, brecheFrei, zusageBezug, zusagenSicht, zusageAbschluss } from "../src/sim/zusagen";
import { ministeriumAnPartei } from "../src/sim/ressortvergabe";
import { eigenVon } from "../src/sim/personen";
import { oeffne, ansicht, entscheide } from "../src/sim/ereignisse";
import { spielTick } from "../src/sim/spiel";
import { Rng } from "../src/sim/rng";
import { setzeSprache } from "../src/i18n";
import { ZusagenAnsicht } from "../src/ui/personen/ZusagenAnsicht";
import type { World } from "../src/sim/types";
import type { Zusage } from "../src/sim/spiel-typen";

function welt() {
  const w=createWorld(turkey2026,17);startAfterElection(w,{...schnellProfil(),buendnis:"YENİ"});
  w.spiel!.ereignisse=[];w.spiel!.zusagen=[];w.spiel!.lager=["YENİ"];w.spiel!.kapital=100;
  w.parliament!.seats={[w.player!.partei.kurz]:200,"YENİ":120,CHP:200,MHP:50,DEM:30};
  fraktion(w,"YENİ").bereitschaft=60;
  minister(w).partei="YENİ";minister(w).loyalitaet=50;chef(w).loyalitaet=40;
  eigenVon(w,chef(w)).groll=10;eigenVon(w,minister(w)).groll=10;
  return w;
}
const chef=(w:World)=>w.spiel!.figuren.find(f=>f.amt==="partner"&&f.partei==="YENİ")!;
const minister=(w:World)=>w.spiel!.figuren.find(f=>f.amt==="finanzen")!;
function zusage(w:World):Zusage {
  const z:Zusage={id:"z-test-partei",von:"YENİ",text:"Zusage an die Fraktion",faellig:w.day+30,erfuellt:false,gebrochen:false};
  w.spiel!.zusagen.push(z);return z;
}
afterEach(async()=>{await setzeSprache("de");});

describe("Fraktionszusagen wirken beim aktiven Parteivorsitz",()=>{
  test("Zuordnung bleibt bei vertauschter Figurenreihenfolge gleich und verändert keinen Spielstand",()=>{
    const w=welt(),z=zusage(w),stand=save(w);
    expect(w.spiel!.figuren.find(f=>f.partei===z.von)!.amt).toBe("finanzen");
    expect(zusageBezug(w,z)).toEqual({art:"person",id:chef(w).id,name:chef(w).name});
    expect(save(w)).toBe(stand);w.spiel!.figuren.reverse();
    expect(zusageBezug(w,z).id).toBe(chef(w).id);
  });
  test.each(["einloesen","vertroesten","brechen","verfall"] as const)("%s bucht die Personenfolge am Vorsitz, nicht am Minister",art=>{
    const w=welt(),z=zusage(w),m=structuredClone(minister(w));
    if(art==="einloesen")expect(loeseEin(w,z).ok).toBe(true);
    else if(art==="vertroesten")expect(vertroesteFrei(w,z).ok).toBe(true);
    else if(art==="brechen")expect(brecheFrei(w,z).ok).toBe(true);
    else brecheZusage(w,z,true);
    expect(chef(w).loyalitaet).toBe({einloesen:52,vertroesten:32,brechen:15,verfall:25}[art]);
    expect(chef(w).eigen!.groll).toBe({einloesen:10,vertroesten:14,brechen:30,verfall:22}[art]);
    expect(minister(w)).toEqual(m);
    expect(fraktion(w,"YENİ").bereitschaft).toBe({einloesen:70,vertroesten:60,brechen:35,verfall:40}[art]);
    expect(w.spiel!.kapital).toBe({einloesen:96,vertroesten:99,brechen:100,verfall:100}[art]);
  });
  test("inaktiver ehemaliger Vorsitz wird weder angesprochen noch belohnt oder bestraft",()=>{
    const w=welt(),z=zusage(w),f=chef(w),alt={...structuredClone(f),id:"ehemalig",imAmt:false};
    w.spiel!.figuren.unshift(alt);const vorher=structuredClone(alt);
    expect(zusageBezug(w,z).id).toBe(f.id);brecheFrei(w,z);
    expect(alt).toEqual(vorher);expect(aktiveParteivorsitzende(w,"YENİ")[0]!.loyalitaet).toBe(15);
  });
  test("ohne aktiven Vorsitz bleibt die Fraktion zuständig, Minister und Ehemalige bleiben unverändert",()=>{
    const w=welt(),z=zusage(w);chef(w).imAmt=false;const figuren=structuredClone(w.spiel!.figuren);
    expect(zusageBezug(w,z)).toEqual({art:"fraktion",id:"YENİ",name:"YENİ"});
    expect(loeseEin(w,z).ok).toBe(true);expect(w.spiel!.figuren).toEqual(figuren);
    expect(fraktion(w,"YENİ").bereitschaft).toBe(70);
  });
  test("mehrere aktive Vorsitzende werden einheitlich genannt und reagieren, die Fraktion nur einmal",()=>{
    const w=welt(),z=zusage(w),f=chef(w);
    const zweiter={...structuredClone(f),id:"a-zweiter",name:"Zweiter Vorsitz"};w.spiel!.figuren.push(zweiter);
    const bezug=zusageBezug(w,z);expect(bezug.name).toContain(f.name);expect(bezug.name).toContain(zweiter.name);
    expect(loeseEin(w,z).ok).toBe(true);expect(f.loyalitaet).toBe(52);expect(zweiter.loyalitaet).toBe(52);
    expect(fraktion(w,"YENİ").bereitschaft).toBe(70);const stand=save(w);
    zusageAbschluss(w,z,"erfuellt");expect(save(w)).toBe(stand);
    expect(zusageBezug(load(save(w)),z)).toEqual(bezug);
  });
  test("aktiver Vorsitz bleibt auch nach Koalitionsaustritt Ansprechpartner",()=>{
    const w=welt(),z=zusage(w);w.spiel!.lager=[];
    expect(zusageBezug(w,z).id).toBe(chef(w).id);expect(vertroesteFrei(w,z).ok).toBe(true);
    expect(chef(w).loyalitaet).toBe(32);expect(w.spiel!.lager).toEqual([]);
  });
  test("Ressortvergabe erreicht den aktiven Vorsitz statt eines früheren oder parteilosen Partners",()=>{
    const w=welt(),f=chef(w),alt={...structuredClone(f),id:"alter-vorsitz",imAmt:false};
    const fremd={...structuredClone(f),id:"ohne-partei",partei:undefined};w.spiel!.figuren.unshift(alt,fremd);
    expect(ministeriumAnPartei(w,"wirtschaft","YENİ").ok).toBe(true);
    expect(f.loyalitaet).toBe(48);expect(alt.loyalitaet).toBe(40);expect(fremd.loyalitaet).toBe(40);
    expect(ministeriumAnPartei(w,"justiz","CHP").ok).toBe(true);expect(fremd.loyalitaet).toBe(40);
  });
  test("fällige Erinnerung nennt denselben Vorsitz wie die Zusagenansicht",()=>{
    const w=welt(),z=zusage(w);z.faellig=w.day;
    const ev=oeffne(w,"zusage",new Rng(3),{provinzen:[],staerke:1,daten:{zusage:z.id}})!;
    expect(ev).toBeDefined();const text=ansicht(w,ev).text.join(" ");
    expect(text).toContain(chef(w).name);expect(text).not.toContain(minister(w).name);
    expect(entscheide(w,ev.id,"brechen",new Rng(3)).ok).toBe(true);
    expect(chef(w).loyalitaet).toBe(15);expect(minister(w).loyalitaet).toBe(50);
  });
  test("Startforderung verwendet die Zusage und Vorsitzenden der tatsächlichen Bündnispartei",()=>{
    const w=welt(),f=chef(w),fremd={...structuredClone(f),id:"chp-vorsitz",partei:"CHP",name:"Vorsitz CHP"};
    w.spiel!.figuren.unshift(fremd);
    const andere={...zusage(w),id:"ministerien-chp",von:"CHP",text:"Zwei Ministerien"};
    const eigene={...andere,id:"z-ministerien",von:"YENİ"};w.spiel!.zusagen=[andere,eigene];
    const ev=oeffne(w,"start_partner",new Rng(3))!;expect(ev).toBeDefined();
    expect(entscheide(w,ev.id,"grosszuegig",new Rng(3)).ok).toBe(true);
    expect(eigene.erfuellt).toBe(true);expect(andere.erfuellt).toBe(false);
    expect(f.loyalitaet).toBe(68);expect(fremd.loyalitaet).toBe(40);
  });
  test("Bruch einer Fraktionszusage erreicht die echte Monatsprüfung und kostet die Partnerstimmen",()=>{
    const w=welt(),z=zusage(w);w.date="2028-06-30";w.day=0;w.spiel!.start.datum=w.date;
    expect(brecheFrei(w,z).ok).toBe(true);expect(chef(w).loyalitaet).toBe(15);
    w.date="2028-07-01";w.day=1;spielTick(w,new Rng(19));
    expect(w.spiel!.lager).not.toContain("YENİ");
    expect(w.spiel!.gueter!.regierung!.bericht!.koalition).toMatchObject({vorher:320,nachher:200,austritte:[{partei:"YENİ"}]});
  });
  test.each(["de","en","tr"] as const)("Zusagenansicht nennt auf %s den richtigen persönlichen Empfänger",async lang=>{
    await setzeSprache(lang);const w=welt(),z=zusage(w);const s=zusagenSicht(w).find(s=>s.z.id===z.id)!;
    expect(s.gehalten.join(" ")).toContain(chef(w).name);expect(s.gebrochen.join(" ")).not.toContain(minister(w).name);
    const html=renderToStaticMarkup(<ZusagenAnsicht world={w} refresh={()=>{}}/>);
    expect(html).toContain(chef(w).name);expect(html).not.toContain(minister(w).name);expect(html).not.toContain("⟦");
  });
});
