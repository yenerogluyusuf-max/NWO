import { afterEach, describe, expect, test } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createWorld, load, save } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { schnellProfil, startAfterElection } from "../src/sim/prolog";
import { gueterMonat, gueterSicht, gueterZustand } from "../src/sim/gueter";
import { beschliesseVersorgungsProgramm, beschliesseVersorgungsKurs, aendereVersorgungsVorlage, versorgungsParlamentTag, versorgungsPolitikAbschluss, zivileVersorgungsDeckung, type VersorgungsProgramm } from "../src/sim/versorgungspolitik";
import { aussenZustand } from "../src/sim/diplomatie";
import { transportPlan, transportZustand } from "../src/sim/transport";
import { fraktion } from "../src/sim/fraktionen";
import { oppositionVon } from "../src/sim/opposition";
import { addDays } from "../src/sim/dates";
import { TRANSPORT_ROUTEN } from "../src/data/transport";
import { GUETER } from "../src/data/gueter";
import { VersorgungsMonatsbericht } from "../src/ui/gueter/VersorgungsMonatsbericht";
import { VersorgungsTagesordnung } from "../src/ui/gueter/VersorgungsMandat";
import { setzeSprache, t } from "../src/i18n";
import type { World } from "../src/sim/types";
import type { KriegVorgang } from "../src/sim/krieg-typen";

function welt() {
  const w=createWorld(turkey2026,17);startAfterElection(w,schnellProfil());
  w.spiel!.ereignisse=[];w.spiel!.kapital=150;w.spiel!.lager=["YENİ"];
  w.parliament!.seats={[w.player!.partei.kurz]:130,"YENİ":120,CHP:200,MHP:80,DEM:70};
  for(const p of Object.keys(w.parliament!.seats))fraktion(w,p).bereitschaft=50;
  aussenZustand(w).energie.hormus="offen";gueterSicht(w);return w;
}
function zeit(w:World,n:number){w.day+=n;w.date=addDays(w.date,n);}
const bericht=(w:World)=>w.spiel!.gueter!.regierung!.bericht!;
function beschliessen(w:World,id:VersorgungsProgramm) {
  w.parliament!.seats={[w.player!.partei.kurz]:600};
  expect(beschliesseVersorgungsProgramm(w,id,"AZE").ok).toBe(true);
  zeit(w,7);versorgungsParlamentTag(w);
}
function gaskrise(w:World){gueterZustand(w).lager.erdgas=0;aussenZustand(w).eigeneSanktionen.push("RUS");aussenZustand(w).energie.hormus="geschlossen";}
function deckung(w:World){return zivileVersorgungsDeckung(w.spiel!.gueter!.bilanz!);}
afterEach(async()=>{await setzeSprache("de");});

describe("Belegbarer Versorgungs-Monatsbericht",()=>{
  test("Schutzbeitrag entspricht separatem Monatslauf ohne Paket, einschließlich Sparen und Produktionsverlust",()=>{
    const w=welt();gaskrise(w);beschliessen(w,"schutz");
    const ohne=structuredClone(w);delete ohne.spiel!.gueter!.regierung!.programme.schutz;
    const p=transportPlan(w), erwartet=gueterSicht(w,p), pk=w.spiel!.kapital, debt=w.economy.debtRatio, rng=w.rngState;
    gueterMonat(w);gueterMonat(ohne);
    const v=bericht(w).nachweis!.entscheidungen.find(e=>e.id==="schutz")!.vergleich!;
    expect(v.deckung).toBeCloseTo(deckung(w)-deckung(ohne),10);
    expect(v.handel).toBeCloseTo(w.spiel!.gueter!.bilanz!.handelsDeltaUsdMrd-ohne.spiel!.gueter!.bilanz!.handelsDeltaUsdMrd,10);
    expect(v.waren.find(f=>f.gut==="erdgas")!.bedarf).toBeCloseTo(-ohne.spiel!.gueter!.bilanz!.waren.erdgas!.bedarf*0.1);
    expect(v.waren.find(f=>f.gut==="stahl")!.produktion).toBeLessThan(0);
    for(const s of erwartet)expect(w.spiel!.gueter!.bilanz!.waren[s.def.id]).toEqual(s.fluss);
    expect(w.spiel!.kapital).toBe(pk);expect(w.economy.debtRatio).toBe(debt);expect(w.rngState).toBe(rng);
  });
  test("Gasabkommen belegt tatsächlichen Zusatzimport und Vergleichswirkung; keine zweite Zahlung",()=>{
    const w=welt();gaskrise(w);beschliessen(w,"energie");zeit(w,30);
    const ohne=structuredClone(w);delete ohne.spiel!.gueter!.regierung!.programme.energie;
    gueterMonat(w);gueterMonat(ohne);
    const v=bericht(w).nachweis!.entscheidungen.find(e=>e.id==="energie")!.vergleich!;
    expect(bericht(w).zusatzGas).toBeGreaterThan(0);expect(v.deckung).toBeCloseTo(deckung(w)-deckung(ohne),10);
    expect(v.handel).toBeLessThan(0);expect(v.waren.find(f=>f.gut==="erdgas")).toBeDefined();
  });
  test("Sanktioniertes Abkommen erklärt Nullwirkung und behält den damaligen Grund",()=>{
    const w=welt();gaskrise(w);beschliessen(w,"energie");zeit(w,30);aussenZustand(w).eigeneSanktionen.push("AZE");
    gueterMonat(w);const e=bericht(w).nachweis!.entscheidungen.find(e=>e.id==="energie")!;
    expect(e.grund?.k).toBe("regierung.partnerGesperrt");expect(e.vergleich!.deckung).toBeCloseTo(0);expect(e.vergleich!.handel).toBeCloseTo(0);
    aussenZustand(w).eigeneSanktionen=[];expect(bericht(load(save(w))).nachweis!.entscheidungen.find(e=>e.id==="energie")!.grund).toEqual(e.grund);
  });
  test("Parlament und Vorlauf werden nicht als bereits wirksame Versorgung ausgegeben",()=>{
    const w=welt();gaskrise(w);beschliesseVersorgungsProgramm(w,"energie","AZE");gueterMonat(w);
    expect(bericht(w).nachweis!.entscheidungen.find(e=>e.id==="energie")).toMatchObject({status:"beratung"});
    expect(bericht(w).nachweis!.entscheidungen.find(e=>e.id==="energie")!.vergleich).toBeUndefined();
    const frisch=welt();gaskrise(frisch);beschliessen(frisch,"energie");gueterMonat(frisch);
    expect(bericht(frisch).nachweis!.entscheidungen.find(e=>e.id==="energie")).toMatchObject({status:"vorbereitung"});
    expect(bericht(frisch).zusatzGas).toBe(0);expect(bericht(frisch).politik!.anlass).toBe("keinMandat");
  });
  test("Wiederaufbauvergleich nutzt den Zustand vor den neuen Reparaturen",()=>{
    const w=welt();for(const r of TRANSPORT_ROUTEN)transportZustand(w).schaden[r.id]=0.8;
    beschliessen(w,"netz");zeit(w,21);const ohne=structuredClone(w);delete ohne.spiel!.gueter!.regierung!.programme.netz;
    gueterMonat(w);gueterMonat(ohne);const v=bericht(w).nachweis!.entscheidungen.find(e=>e.id==="netz")!.vergleich!;
    expect(bericht(w).reparaturen).toBe(4);expect(v.deckung).toBeCloseTo(deckung(w)-deckung(ohne),10);
    expect(ohne.spiel!.transport!.bilanz!.regierungsReparaturen).toHaveLength(0);
    const stand=save(w);gueterMonat(w);expect(save(w)).toBe(stand);
  });
  test.each(["zivil","militaer"] as const)("Verteilungskurs %s vergleicht zivilen Bedarf und tatsächlichen Frontverbrauch mit ausgewogen",kurs=>{
    const w=welt();w.spiel!.kriege=[{id:"syr",land:"SYR",phase:"krieg"} as KriegVorgang];
    gueterZustand(w).lager.erdoel=0;gueterZustand(w).prioritaet=kurs;
    aussenZustand(w).eigeneSanktionen.push(...GUETER.find(g=>g.id==="erdoel")!.lieferanten.map(l=>l.land));
    const ohne=structuredClone(w);ohne.spiel!.gueter!.prioritaet="ausgewogen";
    gueterMonat(w);gueterMonat(ohne);const v=bericht(w).nachweis!.entscheidungen.find(e=>e.id==="kurs")!.vergleich!;
    const front=(x:World)=>Object.values(x.spiel!.transport!.bilanz!.depots).reduce((n,d)=>n+d.verbraucht,0)/Object.values(x.spiel!.transport!.bilanz!.depots).reduce((n,d)=>n+d.bedarf,0);
    expect(v.einsatz).toBeCloseTo(front(w)-front(ohne),10);expect(v.deckung).toBeCloseTo(deckung(w)-deckung(ohne),10);
    expect(Math.abs(v.einsatz!)+Math.abs(v.deckung)).toBeGreaterThan(0);
  });
  test("Rückkehr zum ausgewogenen Kurs zeigt die Wirkung gegenüber dem zuvor gewählten Militärvorrang",()=>{
    const w=welt();w.spiel!.kriege=[{id:"syr",land:"SYR",phase:"krieg"} as KriegVorgang];
    gueterZustand(w).lager.erdoel=0;aussenZustand(w).eigeneSanktionen.push(...GUETER.find(g=>g.id==="erdoel")!.lieferanten.map(l=>l.land));
    expect(beschliesseVersorgungsKurs(w,"militaer").ok).toBe(true);zeit(w,30);
    expect(beschliesseVersorgungsKurs(w,"ausgewogen").ok).toBe(true);
    const ohne=structuredClone(w);ohne.spiel!.gueter!.prioritaet="militaer";
    gueterMonat(w);gueterMonat(ohne);
    const n=bericht(w).nachweis!;expect(n.kursReferenz).toBe("militaer");
    expect(n.entscheidungen[0]!.vergleich!.deckung).toBeCloseTo(deckung(w)-deckung(ohne),10);
    expect(n.entscheidungen[0]!.vergleich!.einsatz).toBeLessThan(0);
  });
  test("Erholung unter 90 Prozent bleibt Kritik; Kontrolle, Träger und tatsächliche Grenzen sind belegt",()=>{
    const w=welt();beschliesseVersorgungsProgramm(w,"schutz");aendereVersorgungsVorlage(w,"schutz","sozial");aendereVersorgungsVorlage(w,"schutz","kontrolle");
    zeit(w,7);versorgungsParlamentTag(w);zeit(w,7);gueterMonat(w);
    const aktuell=structuredClone(w.spiel!.gueter!.bilanz!),alt=structuredClone(aktuell);
    for(const f of Object.values(aktuell.waren)){f!.geliefert=f!.bedarf*0.85;f!.fehl=f!.bedarf-f!.geliefert;}
    for(const f of Object.values(alt.waren))f!.geliefert=f!.bedarf*0.5;
    zeit(w,31);aktuell.monat=w.date.slice(0,7);
    const n=structuredClone(bericht(w).nachweis!);n.vorher={monat:alt.monat,deckung:0.5};
    fraktion(w,"CHP").bereitschaft=1;oppositionVon(w).staerke=99;
    versorgungsPolitikAbschluss(w,aktuell,alt,n);const b=bericht(w);
    expect(b.politik).toMatchObject({anlass:"unterversorgung",kontrolle:true,nominal:-2});
    expect(b.politik!.traeger.find(f=>f.partei==="CHP")).toMatchObject({rolle:"opposition",programme:["schutz"]});
    expect(b.reaktionen!.find(r=>r.partei==="CHP")!.bereitschaft).toBe(-1);expect(b.oppositionStaerke).toBe(1);
    expect(b.politik!.legitimitaet).toBeCloseTo(-0.2);expect(b.politik!.sozial).toBeCloseTo(-0.25);
    expect(Object.values(b.politik!.vertrauen).reduce((a,b)=>a+b,0)).toBeCloseTo(b.vertrauen,10);
    const html=renderToStaticMarkup(<VersorgungsMonatsbericht bericht={b}/>);
    // Welle B1 (06.11.2026): Anlass, Kontrolle und Anfrage stehen als Marken und Kennzahlen statt als Sätze; geprüft wird dieselbe Aussage.
    expect(html).toContain("unter 90 %");expect(html).toContain(t("welle_b1.vm.kontrolle",{n:"-2"}));
    expect(html).toContain(`<dt>${t("welle_b1.vm.anfrage")}</dt><dd>${t("welle_b1.vm.ja")}</dd>`);
  });
  test.each([0.91,0.94])("Über 90 Prozent braucht zusätzlicher Rückhalt mehr als zwei Prozentpunkte Erholung: %s",ziel=>{
    const w=welt();gueterMonat(w);const alt=structuredClone(w.spiel!.gueter!.bilanz!),neu=structuredClone(alt);
    for(const f of Object.values(alt.waren))f!.geliefert=f!.bedarf*0.9;
    for(const f of Object.values(neu.waren))f!.geliefert=f!.bedarf*ziel;
    zeit(w,31);neu.monat=w.date.slice(0,7);w.spiel!.gueter!.regierung!.programme.schutz={ab:w.day,bis:w.day+90,traeger:["CHP"]};
    versorgungsPolitikAbschluss(w,neu,alt);
    expect(bericht(w).politik!.anlass).toBe(ziel===0.94?"erholung":"kaumAenderung");
    expect(bericht(w).politik!.nominal).toBe(ziel===0.94?1:0);expect(bericht(w).oppositionStaerke).toBeUndefined();
  });
  test.each([
    [0.88,0.9,"kaumAenderung"],
    [0.88,0.9-1e-12,"kaumAenderung"],
    [0.88,0.9+1e-12,"kaumAenderung"],
    [0.9,0.92,"kaumAenderung"],
    [0.7,0.89996,"unterversorgung"],
    [0.9,0.920001,"erholung"],
  ] as const)("Politische Schwellen statt Rundungsartefakte: %s → %s",(vorher,ziel,anlass)=>{
    const w=welt();gueterMonat(w);const alt=structuredClone(w.spiel!.gueter!.bilanz!),neu=structuredClone(alt);
    for(const f of Object.values(alt.waren))f!.geliefert=f!.bedarf*vorher;
    for(const f of Object.values(neu.waren))f!.geliefert=f!.bedarf*ziel;
    zeit(w,31);neu.monat=w.date.slice(0,7);w.spiel!.gueter!.regierung!.programme.schutz={ab:w.day,bis:w.day+90,traeger:["CHP"]};
    const n=structuredClone(bericht(w).nachweis!);n.vorher={monat:alt.monat,deckung:zivileVersorgungsDeckung(alt)};
    versorgungsPolitikAbschluss(w,neu,alt,n);
    expect(bericht(w).politik!.anlass).toBe(anlass);
    const html=renderToStaticMarkup(<VersorgungsMonatsbericht bericht={bericht(w)}/>);
    if(anlass==="unterversorgung") {
      expect(html).toContain("<dd>&lt; 90 %</dd>");expect(html).toContain(t("welle_b1.vm.anlass.knappUnterversorgung"));
    }
    if(anlass==="erholung")expect(html).toContain(t("vm.mehrAlsZwei"));
  });
  test.each(["de","en","tr"] as const)("Schwellenhinweise bleiben in jeder Sprache eindeutig: %s",async lang=>{
    await setzeSprache(lang);const w=welt();gueterMonat(w);const b=structuredClone(bericht(w));
    b.deckung=0.89996;b.politik!.anlass="unterversorgung";b.parlamentarisch="kritik";
    expect(renderToStaticMarkup(<VersorgungsMonatsbericht bericht={b}/>)).toContain(t("welle_b1.vm.anlass.knappUnterversorgung"));
    b.deckung=0.920001;b.nachweis!.vorher={monat:"2028-05",deckung:0.9};b.politik!.anlass="erholung";b.parlamentarisch="erfolg";
    const html=renderToStaticMarkup(<VersorgungsMonatsbericht bericht={b}/>);
    expect(html).toContain(t("vm.mehrAlsZwei"));expect(html).not.toMatch(/⟦|vm\.|\{(?:n|delta|deckung)\}/);
  });
  test.each(["de","en","tr"] as const)("Gespeicherte Entscheidungen, politische Rollen und Bericht bleiben nach späteren Änderungen erhalten: %s",async lang=>{
    const w=welt();gaskrise(w);beschliesseVersorgungsProgramm(w,"schutz");aendereVersorgungsVorlage(w,"schutz","sozial");
    zeit(w,7);versorgungsParlamentTag(w);gueterMonat(w);const vorher=structuredClone(bericht(w));
    w.spiel!.lager=["CHP"];w.parliament!.seats={CHP:600};w.spiel!.gueter!.prioritaet="militaer";delete w.spiel!.gueter!.regierung!.programme.schutz;
    const k=load(save(w));expect(bericht(k)).toEqual(vorher);await setzeSprache(lang);const stand=save(k);
    const html=renderToStaticMarkup(<><VersorgungsMonatsbericht bericht={bericht(k)}/><VersorgungsTagesordnung world={k} geaendert={()=>{}}/></>);
    expect(html).toContain(t("vm.titel"));expect(html).toContain(t("gueter.kette.ausgewogen"));expect(html).toContain(t("mandat.rolle.opposition"));
    expect(html).not.toMatch(/⟦|vm\.|\{(?:monat|delta|deckung|programme|datum|menge|preis|land|n)\}/);
    expect(save(k)).toBe(stand);gueterMonat(k);expect(bericht(k)).toEqual(vorher);
  });
  test("Ältere Berichte erfinden keine Ursachen und behalten tatsächlich gespeicherte Folgen",()=>{
    const b={monat:"2026-06",deckung:0.8,vertrauen:-0.1,zusatzGas:0.2,aufpreis:0.01,partner:"AZE" as const,reparaturen:2,
      reaktionen:[{partei:"CHP",bereitschaft:-1,personen:[]}],oppositionStaerke:1};
    const html=renderToStaticMarkup(<VersorgungsMonatsbericht bericht={b}/>);
    // Welle B1: Altbericht und Bereitschaft als Kennzahlzeile (Partei → −1,0) statt Satz
    expect(html).toContain(t("welle_b1.vm.altbericht"));expect(html).toContain("AZE");expect(html).toMatch(/<dt>CHP<\/dt><dd>-1,0/);expect(html).not.toContain(t("welle_b1.vm.referenzProgramm"));
  });
});
