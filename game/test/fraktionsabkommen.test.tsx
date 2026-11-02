import { afterEach, describe, expect, test } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createWorld, save, load } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { schnellProfil, startAfterElection } from "../src/sim/prolog";
import { fraktionsUebersicht, verhandle, VERHANDLUNG } from "../src/sim/verhandeln";
import { fraktion } from "../src/sim/fraktionen";
import { eigenVon } from "../src/sim/personen";
import { aktiverKoalitionsVorsitz } from "../src/sim/koalitionslage";
import { spielTick } from "../src/sim/spiel";
import { PARTNER_START_LOYALITAET } from "../src/sim/figuren";
import { AUFMERKSAMKEIT_KOSTEN } from "../src/sim/aufmerksamkeit";
import { Rng } from "../src/sim/rng";
import { addDays, formatDateDe } from "../src/sim/dates";
import { FraktionsAbkommen } from "../src/ui/parlament/FraktionsAbkommen";
import { setzeSprache, t, katalogVon, platzhalter } from "../src/i18n";
import type { World } from "../src/sim/types";

function welt() {
  const w=createWorld(turkey2026,17);startAfterElection(w,{...schnellProfil(),buendnis:"YENİ"});
  w.spiel!.ereignisse=[];w.spiel!.zusagen=[];w.spiel!.lager=[];w.spiel!.kapital=100;
  w.parliament!.seats={[w.player!.partei.kurz]:200,"YENİ":120,CHP:200,MHP:50,DEM:30};
  w.spiel!.verfassung!.aufmerksamkeit=80;
  for(const p of Object.keys(w.parliament!.seats))fraktion(w,p).bereitschaft=60;
  return w;
}
const chef=(w:World)=>w.spiel!.figuren.find(f=>f.amt==="partner"&&f.partei==="YENİ")!;
const sicht=(w:World)=>fraktionsUebersicht(w).find(f=>f.partei==="YENİ")!;
const aktive=(w:World)=>w.spiel!.figuren.filter(f=>f.partei==="YENİ"&&aktiverKoalitionsVorsitz(w,f));
const abschluss=(w:World)=>verhandle(w,"YENİ","koalition",new Rng(9));
afterEach(async()=>{await setzeSprache("de");});

describe("Erneute Bündnisse und sichtbare Bedingungen",()=>{
  test("ursprünglicher Vorsitz mit ID partner bleibt dieselbe Person ohne zweiten Vorsitz oder Rückhaltreset",()=>{
    const w=welt(),f=chef(w);expect(f.id).toBe("partner");
    f.loyalitaet=30;f.gespraech=w.day;eigenVon(w,f).groll=64;
    const vorher=structuredClone(f),anzahl=w.spiel!.figuren.length;
    expect(abschluss(w).ok).toBe(true);expect(aktive(w)).toHaveLength(1);
    expect(aktive(w)[0]).toEqual(vorher);expect(w.spiel!.figuren).toHaveLength(anzahl);
    expect(aktive(load(save(w)))[0]).toMatchObject({id:"partner",loyalitaet:30,gespraech:w.day});
    expect(verhandle(w,"YENİ","gespraech",new Rng(1)).ok).toBe(true);
    expect(aktive(w)[0]!.loyalitaet).toBe(35);
  });
  test("beliebige aktive Vorsitzkennung zählt, ein Minister derselben Partei ersetzt den Vorsitz nicht",()=>{
    const w=welt();chef(w).id="vorsitz-neue-generation";const f=chef(w);
    w.spiel!.figuren.find(p=>p.amt==="finanzen")!.partei="YENİ";
    expect(abschluss(w).ok).toBe(true);expect(aktive(w).map(p=>p.id)).toEqual([f.id]);
  });
  test("inaktive Vorsitzende bleiben unverändert, neue Kennung kollidiert auch nach mehreren Generationen nicht",()=>{
    const w=welt(),f=chef(w);f.id="partner-YENİ";f.imAmt=false;f.loyalitaet=3;
    w.spiel!.figuren.push({...structuredClone(f),id:"partner-YENİ-2"});
    const alt=structuredClone(w.spiel!.figuren);
    expect(abschluss(w).ok).toBe(true);expect(aktive(w)).toHaveLength(1);
    expect(aktive(w)[0]).toMatchObject({id:"partner-YENİ-3",loyalitaet:PARTNER_START_LOYALITAET,imAmt:true});
    expect(w.spiel!.figuren.slice(0,-1)).toEqual(alt);
    expect(new Set(w.spiel!.figuren.map(f=>f.id)).size).toBe(w.spiel!.figuren.length);
  });
  test("ohne vorhandenen Vorsitz entsteht genau ein neuer aktiver Ansprechpartner",()=>{
    const w=welt();w.spiel!.figuren=w.spiel!.figuren.filter(f=>f.partei!=="YENİ");
    expect(sicht(w).vorsitz).toEqual([]);expect(abschluss(w).ok).toBe(true);
    expect(aktive(w)).toHaveLength(1);expect(aktive(w)[0]!.loyalitaet).toBe(PARTNER_START_LOYALITAET);
    const stand=save(w);expect(abschluss(w).ok).toBe(false);expect(save(w)).toBe(stand);
  });
  test("erneutes Bündnis mit akut gefährdetem Vorsitz wird vorab gewarnt und bleibt beim Monatslauf gefährdet",()=>{
    const w=welt();w.date="2028-06-30";w.spiel!.start.datum=w.date;w.day=0;chef(w).loyalitaet=19;
    const html=renderToStaticMarkup(<FraktionsAbkommen world={w} fraktion={sicht(w)} onVerhandlung={()=>{}}/>);
    expect(html).toContain(t("fa.bruch",{grenze:20,datum:formatDateDe("2028-07-01")}));
    expect(abschluss(w).ok).toBe(true);expect(aktive(w)[0]!.loyalitaet).toBe(19);
    w.day=1;w.date="2028-07-01";spielTick(w,new Rng(19));
    expect(w.spiel!.lager).not.toContain("YENİ");
  });
  test.each(["koalition","duldung"] as const)("%s: Preis, Aufmerksamkeit, Zusagenfrist und Laufzeit entsprechen dem echten Abschluss",art=>{
    const w=welt(),f=sicht(w),a=f.aktionen.find(a=>a.id===art)!;
    const k=w.spiel!.kapital,auf=w.spiel!.verfassung!.aufmerksamkeit;
    const dauer=art==="koalition"?VERHANDLUNG.koalitionZusageTage:VERHANDLUNG.duldungTage;
    const html=renderToStaticMarkup(<FraktionsAbkommen world={w} fraktion={f} onVerhandlung={()=>{}}/>);
    expect(html).toContain(t("fa.preis",{pk:a.pk,aufmerksamkeit:AUFMERKSAMKEIT_KOSTEN[art]}));
    expect(html).toContain(t("fa.zusage",{forderung:f.forderung,datum:formatDateDe(addDays(w.date,dauer))}));
    expect(verhandle(w,"YENİ",art,new Rng(9)).ok).toBe(true);
    expect(w.spiel!.kapital).toBe(k-a.pk);expect(w.spiel!.verfassung!.aufmerksamkeit).toBe(auf-AUFMERKSAMKEIT_KOSTEN[art]);
    expect(w.spiel!.zusagen.at(-1)).toMatchObject({von:"YENİ",faellig:w.day+dauer,erfuellt:false,gebrochen:false});
    if(art==="duldung"){expect(fraktion(w,"YENİ").duldungBis).toBe(w.day+dauer);expect(w.spiel!.lager).not.toContain("YENİ");}
    else expect(w.spiel!.lager).toContain("YENİ");
  });
  test("Erholungspause ist vor dem Klick sichtbar und verhindert die Buchung",()=>{
    const w=welt();w.spiel!.verfassung!.pauseBis=w.day+3;const f=sicht(w),stand=save(w);
    expect(f.aktionen.every(a=>!a.moeglich)).toBe(true);
    expect(f.aktionen[0]!.grund).toBe(t("fa.pause",{datum:formatDateDe(addDays(w.date,3))}));
    expect(abschluss(w).ok).toBe(false);expect(save(w)).toBe(stand);
  });
  test("Kapitalüberziehung und niedrige Aufmerksamkeit sind vor dem Bündnis sichtbar",()=>{
    const w=welt();w.spiel!.kapital=0;w.spiel!.verfassung!.aufmerksamkeit=22;
    const f=sicht(w),pk=f.aktionen.find(a=>a.id==="koalition")!.pk;
    const html=renderToStaticMarkup(<FraktionsAbkommen world={w} fraktion={f} onVerhandlung={()=>{}}/>);
    expect(html).toContain(t("vn.aufPump",{n:(-pk).toLocaleString("de-DE",{minimumFractionDigits:1,maximumFractionDigits:1})}));
    expect(html).toContain(t("vn.erschoepfung",{n:14}));
  });
  test.each(["de","en","tr"] as const)("Karten auf %s zeigen Bedingungen ohne Spielstandsänderung oder unübersetzte Schlüssel",async lang=>{
    await setzeSprache(lang);const w=welt(),f=sicht(w),stand=save(w);
    const html=renderToStaticMarkup(<FraktionsAbkommen world={w} fraktion={f} onVerhandlung={()=>{}}/>);
    expect(html).toContain(t("fa.koalition"));expect(html).toContain(t("fa.duldung"));expect(html).toContain(t("fa.stimmen"));
    expect(html).toContain(t("fa.handeln",{aktion:f.aktionen.find(a=>a.id==="koalition")!.label,partei:f.name}));
    expect(html).not.toContain("⟦");expect(save(w)).toBe(stand);
    for(const key of Object.keys(katalogVon("de")).filter(k=>k.startsWith("fa.")))expect(platzhalter(katalogVon(lang)[key]!)).toEqual(platzhalter(katalogVon("de")[key]!));
  });
});
