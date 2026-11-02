import { afterEach, describe, expect, test } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createWorld, load, save } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { schnellProfil, startAfterElection } from "../src/sim/prolog";
import { gueterMonat, gueterSicht, gueterZustand, fuehreGutInstrumentAus } from "../src/sim/gueter";
import { beschliesseVersorgungsKurs, beschliesseVersorgungsProgramm as bringeEin, versorgungsParlamentTag, regierungsProgramm, versorgungsPolitikAbschluss, type VersorgungsProgramm, type EnergiePartner } from "../src/sim/versorgungspolitik";
import { aussenZustand } from "../src/sim/diplomatie";
import { vertrauenZu } from "../src/sim/laender";
import { transportZustand, transportPlan } from "../src/sim/transport";
import { TRANSPORT_ROUTEN } from "../src/data/transport";
import { nationalAverage } from "../src/sim/netz";
import { NET } from "../src/sim/modell";
import { addDays } from "../src/sim/dates";
import { WAREN_PREIS } from "../src/sim/versorgung";
import { VersorgungsLage } from "../src/ui/gueter/VersorgungsLage";
import { setzeSprache } from "../src/i18n";
import type { World } from "../src/sim/types";
import type { KriegVorgang } from "../src/sim/krieg-typen";
function welt() {const w=createWorld(turkey2026,17);startAfterElection(w,schnellProfil());w.spiel!.ereignisse=[];w.spiel!.kapital=150;aussenZustand(w).energie.hormus="offen";gueterSicht(w);return w;}
function zeit(w:World,n:number) {w.day+=n;w.date=addDays(w.date,n);}
// Diese Tests prüfen den Vollzug nach einem erfolgreichen Votum. Die parlamentarischen
// Konflikte, Fristen und Ablehnungen stehen separat in versorgungsmandat.test.tsx.
function beschliesseVersorgungsProgramm(w:World,id:VersorgungsProgramm,partner?:EnergiePartner) {
  const r=bringeEin(w,id,partner); if(!r.ok) return r;
  const sitze=w.parliament!.seats;
  w.parliament!.seats={[w.player!.partei.kurz]:600};
  zeit(w,7);versorgungsParlamentTag(w);w.parliament!.seats=sitze;
  expect(w.spiel!.gueter!.regierung!.vorlagen![id]!.status).toBe("angenommen");return r;
}
const fluss=(w:World,id:string)=>gueterSicht(w).find(s=>s.def.id===id)!.fluss;
function krise(w:World) {gueterZustand(w).lager.erdgas=0;aussenZustand(w).eigeneSanktionen.push("RUS");aussenZustand(w).energie.hormus="geschlossen";}
afterEach(async()=>{await setzeSprache("de");});

describe("Versorgung als Regierungspolitik",()=>{
  test("Kurs ist bezahlt und 30 Tage bindend, Wiederholung bringt weder Kosten noch Zustimmung",()=>{
    const w=welt(), vertrauen=nationalAverage(NET,w.net,"vertrauen_regierung");
    expect(beschliesseVersorgungsKurs(w,"militaer").ok).toBe(true);
    expect(w.spiel!.kapital).toBe(147);
    const stand=save(w);
    expect(beschliesseVersorgungsKurs(w,"zivil").ok).toBe(false);
    expect(beschliesseVersorgungsKurs(w,"militaer").ok).toBe(false);
    expect(save(w)).toBe(stand);
    expect(nationalAverage(NET,w.net,"vertrauen_regierung")).toBe(vertrauen);
    zeit(w,30);expect(beschliesseVersorgungsKurs(w,"zivil").ok).toBe(true);
    expect(w.spiel!.kapital).toBe(144);
  });
  test("Schutzpaket spart Energie, begrenzt Industrie und Exporte, kostet Schulden und Auslandsvertrauen",()=>{
    const w=welt(), normal=gueterSicht(w), eu=vertrauenZu(w,"EU"), debt=w.economy.debtRatio;
    expect(beschliesseVersorgungsProgramm(w,"schutz").ok).toBe(true);
    expect(w.economy.debtRatio).toBeCloseTo(debt+0.04);
    expect(vertrauenZu(w,"EU")).toBeLessThan(eu);
    const sicht=gueterSicht(w);
    expect(sicht.find(s=>s.def.id==="erdgas")!.fluss.bedarf).toBeCloseTo(normal.find(s=>s.def.id==="erdgas")!.fluss.bedarf*0.9);
    expect(sicht.find(s=>s.def.id==="stahl")!.fluss.produktion).toBeCloseTo(normal.find(s=>s.def.id==="stahl")!.fluss.produktion*0.95);
    expect(sicht.find(s=>s.def.id==="getreide")!.fluss.exportiert).toBe(0);
    const pk=w.spiel!.kapital, bezahlt=save(w);
    expect(beschliesseVersorgungsProgramm(w,"schutz").ok).toBe(false);expect(save(w)).toBe(bezahlt);expect(w.spiel!.kapital).toBe(pk);
    gueterMonat(w);expect(w.spiel!.gueter!.regierung!.bericht!.vertrauen).toBeCloseTo(-0.25);
    for(const f of Object.values(w.spiel!.gueter!.bilanz!.waren)) expect(f!.anfang+f!.produktion+f!.importiert).toBeCloseTo(f!.geliefert+f!.militaerGeliefert+f!.exportiert+f!.ende+f!.verlust,8);
  });
  test("Befristung hebt nur das Paket auf und bewahrt vorherige individuelle Exportstopps",()=>{
    const w=welt();gueterZustand(w).ausfuhrStopp.push("getreide");
    beschliesseVersorgungsProgramm(w,"schutz");zeit(w,90);
    expect(regierungsProgramm(w,"schutz")).toBeUndefined();
    expect(fluss(w,"getreide").exportSoll).toBe(0);
    expect(fluss(w,"obst_gemuese").exportSoll).toBeGreaterThan(0);
  });
  test("Energieabkommen braucht Vorlauf, bezahlt nur echte Zusatzmengen und stärkt erst dann den Partner",()=>{
    const w=welt();krise(w);const ohne=fluss(w,"erdgas"), vt=vertrauenZu(w,"AZE");
    expect(beschliesseVersorgungsProgramm(w,"energie","AZE").ok).toBe(true);
    expect(vertrauenZu(w,"AZE")).toBe(vt);
    expect(fluss(w,"erdgas").importiert).toBe(ohne.importiert);
    zeit(w,30);const f=fluss(w,"erdgas");
    expect(f.zusatzImport!.menge).toBeGreaterThan(0);expect(f.importiert-ohne.importiert).toBeCloseTo(f.zusatzImport!.menge);
    expect(f.importUsdMrd-ohne.importUsdMrd).toBeCloseTo(f.zusatzImport!.menge*WAREN_PREIS.erdgas*1.2);
    gueterMonat(w);expect(vertrauenZu(w,"AZE")).toBeGreaterThan(vt);
    expect(w.spiel!.gueter!.regierung!.bericht!.zusatzGas).toBeCloseTo(f.zusatzImport!.menge);
    expect(f.anfang+f.produktion+f.importiert).toBeCloseTo(f.geliefert+f.militaerGeliefert+f.exportiert+f.ende+f.verlust,8);
  });
  test("Vertrag liefert nicht gegen Krieg oder Sanktionen und endet ohne dauerhaften Importbonus",()=>{
    const w=welt();krise(w);beschliesseVersorgungsProgramm(w,"energie","AZE");zeit(w,30);
    aussenZustand(w).eigeneSanktionen.push("AZE");expect(fluss(w,"erdgas").zusatzImport!.menge).toBe(0);
    aussenZustand(w).eigeneSanktionen.pop();w.spiel!.kriege=[{id:"aze",land:"AZE",phase:"krieg"} as KriegVorgang];
    expect(fluss(w,"erdgas").zusatzImport!.menge).toBe(0);
    w.spiel!.kriege=[];zeit(w,180);expect(fluss(w,"erdgas").zusatzImport).toBeUndefined();
  });
  test("Zusatzgas kann nicht aus einem isolierten Eintrittsknoten teleportieren",()=>{
    const w=welt();krise(w);w.spiel!.kriege=[{id:"test",land:"SYR",phase:"krieg",bedroht:[25]} as KriegVorgang];
    beschliesseVersorgungsProgramm(w,"energie","AZE");zeit(w,30);
    const mit=transportPlan(w);gueterSicht(w,mit);
    const ohne=load(save(w));delete ohne.spiel!.gueter!.regierung!.programme.energie;
    const p=transportPlan(ohne);gueterSicht(ohne,p);
    for(const [hub,reg] of Object.entries(mit.bilanz.regionen)) if(hub!=="25") expect(reg.erdgas!.geliefert).toBeCloseTo(p.bilanz.regionen[hub]!.erdgas!.geliefert,8);
  });
  test("Ministerium repariert höchstens vier sichere Korridore, nach Vorlauf, dauerhaft und ohne Mehrfachabschluss",()=>{
    const w=welt(), z=transportZustand(w);const routen=TRANSPORT_ROUTEN.filter(r=>r.art!=="pipeline").slice(0,6);
    for(const r of routen) z.schaden[r.id]=0.8;
    expect(beschliesseVersorgungsProgramm(w,"netz").ok).toBe(true);
    expect(transportPlan(w).bilanz.regierungsReparaturen).toHaveLength(0);
    zeit(w,21);const vor=save(w), p=transportPlan(w);
    expect(p.bilanz.regierungsReparaturen).toHaveLength(4);expect(save(w)).toBe(vor);
    gueterMonat(w);expect(w.spiel!.gueter!.regierung!.bericht!.reparaturen).toBe(4);
    const nach=save(w);gueterMonat(w);transportPlan(w);expect(save(w)).toBe(nach);
    const repaired=p.bilanz.regierungsReparaturen![0]!;expect(w.spiel!.transport!.schaden[repaired]).toBeCloseTo(0.45);
    zeit(w,90);expect(transportPlan(w).zustand.schaden[repaired]).toBeCloseTo(0.45);
  });
  test("Wiederaufbau öffnet keine besetzten Straßen",()=>{
    const w=welt(), z=transportZustand(w);for(const r of TRANSPORT_ROUTEN) z.schaden[r.id]=0.8;
    beschliesseVersorgungsProgramm(w,"netz");zeit(w,21);
    w.spiel!.kriege=[{id:"test",land:"SYR",phase:"krieg",bedroht:[27,63]} as KriegVorgang];
    const p=transportPlan(w);
    for(const r of p.routen.filter(r=>r.grund==="feind")) {expect(r.kapazitaet).toBe(0);expect(p.bilanz.regierungsReparaturen).not.toContain(r.id);}
  });
  test("Wiederhergestellte Versorgung bringt Ergebnisvertrauen; wiederholte Anzeige und Laden nicht",()=>{
    const w=welt();gueterMonat(w);const gut=structuredClone(w.spiel!.gueter!.bilanz!);const schlecht=structuredClone(gut);
    for(const f of Object.values(schlecht.waren)){f!.geliefert*=0.5;f!.fehl=f!.bedarf-f!.geliefert;}
    zeit(w,31);gut.monat=w.date.slice(0,7);versorgungsPolitikAbschluss(w,gut,schlecht);
    expect(w.spiel!.gueter!.regierung!.bericht!.vertrauen).toBeCloseTo(0.8);
    const stand=save(w);versorgungsPolitikAbschluss(w,gut,schlecht);expect(save(w)).toBe(stand);
    const kopie=load(stand);expect(kopie.spiel!.gueter!.regierung).toEqual(w.spiel!.gueter!.regierung);
    versorgungsPolitikAbschluss(kopie,gut,schlecht);expect(kopie.spiel!.gueter!.regierung).toEqual(w.spiel!.gueter!.regierung);
  });
  test("Schutzpaket lässt sich nicht über Einzelinstrumente umgehen oder doppelt bezahlen",()=>{
    const w=welt();beschliesseVersorgungsProgramm(w,"schutz");const before=save(w);
    expect(fuehreGutInstrumentAus(w,"getreide","stopp").ok).toBe(false);
    expect(fuehreGutInstrumentAus(w,"getreide","foerderung").ok).toBe(false);
    expect(save(w)).toBe(before);
  });
  test("Unfinanzierte und gesperrte Regierungsprogramme verändern nichts",()=>{
    const w=welt();w.spiel!.kapital=0;const before=save(w);
    expect(beschliesseVersorgungsProgramm(w,"schutz").ok).toBe(false);
    expect(beschliesseVersorgungsKurs(w,"zivil").ok).toBe(false);expect(save(w)).toBe(before);
    w.spiel!.kapital=100;aussenZustand(w).eigeneSanktionen.push("AZE");const gesperrt=save(w);
    expect(beschliesseVersorgungsProgramm(w,"energie","AZE").ok).toBe(false);expect(save(w)).toBe(gesperrt);
  });
  test("Laden bewahrt ein noch nicht lieferbereites Abkommen mit Kosten und Fristen",()=>{
    const w=welt();beschliesseVersorgungsProgramm(w,"energie","USA");const k=load(save(w));
    expect(k.spiel!.gueter!.regierung).toEqual(w.spiel!.gueter!.regierung);
    expect(k.spiel!.kapital).toBe(w.spiel!.kapital);expect(fluss(k,"erdgas").zusatzImport).toBeUndefined();
    const before=save(k);expect(beschliesseVersorgungsProgramm(k,"energie","AZE").ok).toBe(false);expect(save(k)).toBe(before);
  });
  test.each(["de","en","tr"] as const)("Regierungsoberfläche übersetzt, Programme und Abwägungen sichtbar: %s",async sprache=>{
    await setzeSprache(sprache);const w=welt();gueterMonat(w);const before=save(w);
    const html=renderToStaticMarkup(<VersorgungsLage world={w} geaendert={()=>{}}/>);
    expect(html).not.toMatch(/⟦|regierung\.|\{(?:datum|pk|bip|menge|preis|land)\}/);
    expect(html).toContain('class="rg-programm"');expect(save(w)).toBe(before);
  });
});
