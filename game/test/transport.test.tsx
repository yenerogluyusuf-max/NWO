import { afterEach, describe, expect, test } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync, writeFileSync } from "node:fs";
import { createWorld, load, save } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { schnellProfil, startAfterElection } from "../src/sim/prolog";
import { gueterMonat, gueterSicht, gueterZustand } from "../src/sim/gueter";
import { transportPlan, transportPfad, transportLage, transportAktion, transportZustand, regionalVerteilen } from "../src/sim/transport";
import { HUBS, HUB_PROVINZEN, TRANSPORT_ROUTEN } from "../src/data/transport";
import { GUT_NACH_ID } from "../src/data/gueter";
import { militaerVersorgung } from "../src/sim/versorgung";
import { TransportTafel, transportKartenDaten } from "../src/ui/gueter/TransportKarte";
import { setzeSprache } from "../src/i18n";
import { NET } from "../src/sim/modell";
import type { World } from "../src/sim/types";
import type { KriegVorgang } from "../src/sim/krieg-typen";

function welt() {const w=createWorld(turkey2026,17);startAfterElection(w,schnellProfil());w.spiel!.ereignisse=[];w.spiel!.kapital=150;return w;}
function krieg(w:World,land="SYR") {const k:KriegVorgang={id:`test-${land}`,land,phase:"krieg",seit:w.day,eskalation:90,mobilmachung:1,front:40,frontVorher:40,uhr:80,uhrGegner:80,woche:4,verluste:5};(w.spiel!.kriege??=[]).push(k);return k;}
function monat(w:World) {gueterZustand(w).monat="";gueterMonat(w);}
const sum=(a:Record<string,number>)=>Object.values(a).reduce((x,y)=>x+y,0);
afterEach(async()=>{await setzeSprache("de");});

describe("Regionale Transportwege",()=>{
  test("alle 81 Provinzen genau einmal zugeordnet; Fracht- und Gasnetz erreichen jeden Knoten",()=>{
    expect(Object.values(HUB_PROVINZEN).flat().sort((a,b)=>a-b)).toEqual(Array.from({length:81},(_,i)=>i+1));
    expect(new Set(TRANSPORT_ROUTEN.map(r=>r.id)).size).toBe(TRANSPORT_ROUTEN.length);
    const p=transportPlan(welt());
    for(const h of HUBS) for(const g of ["erdoel","erdgas"] as const) expect(transportPfad(p.routen,"34",h.id,g),`${g} → ${h.id}`).not.toBeNull();
  });
  test("Migration und Vorschau erzeugen keine Ware und verändern keinen Transportzustand",()=>{
    const w=welt();krieg(w);gueterSicht(w);const start=save(w);
    transportPlan(w);transportKartenDaten(w,false,null);gueterSicht(w);
    expect(save(w)).toBe(start);expect(w.spiel!.transport).toBeUndefined();
    monat(w);
    for(const [id,f] of Object.entries(w.spiel!.gueter!.bilanz!.waren)) expect(sum(w.spiel!.transport!.lager[id as import("../src/data/gueter").GutId]!)).toBeCloseTo(f!.ende,8);
  });
  test("Waren- und Depotbilanz erhalten jede Menge; Kapazität wird gemeinsam begrenzt",()=>{
    const w=welt();krieg(w);krieg(w,"IRN");monat(w);
    const z=w.spiel!.transport!;
    for(const [id,f] of Object.entries(w.spiel!.gueter!.bilanz!.waren)) {
      expect(f!.anfang+f!.produktion+f!.importiert,id).toBeCloseTo(f!.geliefert+f!.militaerGeliefert+f!.exportiert+f!.ende+f!.verlust,8);
    }
    for(const b of Object.values(z.bilanz!.depots)) expect(b.anfang+b.geliefert).toBeCloseTo(b.verbraucht+b.ende,8);
    expect(z.bilanz!.routen.some(r=>r.waren.length>1)).toBe(true);
    for(const r of z.bilanz!.routen) {expect(r.belegt).toBeGreaterThanOrEqual(0);expect(r.belegt).toBeLessThanOrEqual(r.kapazitaet+1e-8);}
    const vorher=JSON.stringify(z);gueterMonat(w);expect(JSON.stringify(w.spiel!.transport)).toBe(vorher);
    expect(load(save(w)).spiel!.transport).toEqual(z);
  });
  test("abgeschnittene Front verbraucht erst Depotreserve, dann fällt nur ihre Versorgung",()=>{
    const w=welt();const syr=krieg(w);krieg(w,"IRN");monat(w);
    expect(w.spiel!.transport!.depots.SYR!.bestand).toBeGreaterThan(0);
    syr.bedroht=[27,63];monat(w);
    const b=w.spiel!.transport!.bilanz!.depots.SYR!;
    expect(b.geliefert).toBe(0);expect(b.verbraucht).toBeGreaterThan(0);expect(b.deckung).toBeLessThan(1);
    monat(w);
    expect(militaerVersorgung(w,"SYR").treibstoff).toBe(0);
    expect(militaerVersorgung(w,"IRN").treibstoff).toBeCloseTo(1);
    expect(transportKartenDaten(w,false,null).routen.find(r=>r.id==="front-SYR-27")!.ton).toBe("rot");
    if(process.env.NWO_TRANSPORT_FIXTURE) writeFileSync(process.env.NWO_TRANSPORT_FIXTURE,save(w));
  });
  test("isolierte Zivilregion erhält keine teleportierten Importe; Preise steigen dort",()=>{
    const w=welt();krieg(w).bedroht=[27];
    gueterZustand(w).lager.erdgas=0;
    const vorher=[...w.net.values];monat(w);
    const z=w.spiel!.transport!;const f=z.bilanz!.regionen["27"]!.erdgas!;
    expect(f.geliefert).toBeLessThan(f.bedarf*0.2);
    expect(z.bilanz!.regionen["34"]!.erdgas!.geliefert).toBeCloseTo(z.bilanz!.regionen["34"]!.erdgas!.bedarf);
    const ni=NET.index.get("energiepreise")!;
    expect(w.net.values[ni*81+26]).toBeGreaterThan(vorher[ni*81+26]!);
  });
  test("Luftbrücke hat Vorlauf, begrenzten Durchsatz und braucht echten Treibstoff",()=>{
    const w=welt();krieg(w).bedroht=[27,63];monat(w);
    const pk=w.spiel!.kapital;const debt=w.economy.debtRatio;
    expect(transportAktion(w,"luftbruecke","SYR").ok).toBe(true);
    expect(w.spiel!.kapital).toBe(pk-4);expect(w.economy.debtRatio).toBeGreaterThan(debt);
    expect(transportAktion(w,"luftbruecke","SYR").ok).toBe(false);
    expect(transportPlan(w).routen.some(r=>r.art==="luft")).toBe(false);
    w.day+=7;monat(w);const b=w.spiel!.transport!.bilanz!.depots.SYR!;
    expect(b.geliefert).toBeGreaterThan(0);expect(b.geliefert).toBeLessThan(b.bedarf);
    expect(b.verbraucht).toBeCloseTo(b.geliefert);
    const p=transportPlan(w);p.zustand.depots.SYR!.bestand=0;
    const f=gueterSicht(w).find(g=>g.def.id==="erdoel")!.fluss;
    const leer=regionalVerteilen(p,GUT_NACH_ID.get("erdoel")!,{...f,anfang:0,produktion:0,importiert:0},"militaer");
    expect(leer.militaerGeliefert).toBe(0);expect(p.bilanz.depots.SYR!.verbraucht).toBe(0);
    w.day+=60;expect(transportPlan(w).routen.some(r=>r.art==="luft")).toBe(false);
  });
  test("Depotausbau erhöht nur den Zielvorrat nach 21 Tagen, nicht sofort den Bestand",()=>{
    const w=welt();krieg(w);monat(w);const stock=w.spiel!.transport!.depots.SYR!.bestand;
    expect(transportAktion(w,"depot","SYR").ok).toBe(true);
    expect(w.spiel!.transport!.depots.SYR!.bestand).toBe(stock);monat(w);
    expect(w.spiel!.transport!.depots.SYR!.zielTage).toBe(15);
    w.day+=21;monat(w);expect(w.spiel!.transport!.depots.SYR!.zielTage).toBe(30);
    expect(w.spiel!.transport!.bilanz!.depots.SYR!.geliefert).toBeGreaterThan(0);
  });
  test("Kampf zerstört Strecken fortlaufend, Pioniere halten dagegen; Reparatur wirkt einmal",()=>{
    // Je Kampfmonat +15 % Schaden, die Pioniere setzen 10 % instand (PIONIER_INSTANDSETZUNG): netto 5 % je Monat
    const w=welt();const k=krieg(w);monat(w);monat(w);monat(w);
    expect(w.spiel!.transport!.schaden["front-SYR-27"]).toBeCloseTo(0.15);
    k.phase="waffenruhe";
    expect(transportLage(w).routen.find(r=>r.id==="front-SYR-27")!.schaden).toBeCloseTo(0.15);
    expect(transportAktion(w,"reparatur","front-SYR-27").ok).toBe(true);
    w.day+=13;expect(transportLage(w).routen.find(r=>r.id==="front-SYR-27")!.schaden).toBeCloseTo(0.15);
    w.day++;monat(w);expect(w.spiel!.transport!.schaden["front-SYR-27"]).toBe(0);
    // In der Waffenruhe wird nicht mehr gekämpft; die Pioniere bauen weiter ab
    w.spiel!.transport!.schaden["front-SYR-27"]=0.2;monat(w);expect(w.spiel!.transport!.schaden["front-SYR-27"]).toBeCloseTo(0.1);
  });
  test("Reparatur öffnet keinen vom Gegner gesperrten Weg; Umleitung braucht echten Alternativpfad",()=>{
    const w=welt();krieg(w).bedroht=[27,63];monat(w);
    expect(transportAktion(w,"reparatur","front-SYR-27").ok).toBe(false);
    expect(transportAktion(w,"umleitung","front-SYR-27").ok).toBe(false);
    const id="bahn-34-6";const p=transportPlan(w);const path=transportPfad(p.routen,"34","6","erdoel",id)!;
    expect(path.length).toBeGreaterThan(1);expect(path.some(r=>r.id===id)).toBe(false);
    expect(transportAktion(w,"umleitung",id).ok).toBe(true);
    const normal=transportPlan(w).routen.find(r=>r.id===path[0]!.id)!.kapazitaet;
    w.day+=7;expect(transportPlan(w).routen.find(r=>r.id===path[0]!.id)!.kapazitaet).toBeCloseTo(normal*1.5);
    w.day+=90;expect(transportPlan(w).routen.find(r=>r.id===path[0]!.id)!.kapazitaet).toBeCloseTo(normal);
  });
  test.each(["de","en","tr"] as const)("Karten- und Depotanzeige ohne fehlende Übersetzungen (%s)",async lang=>{
    await setzeSprache(lang);const w=welt();krieg(w).bedroht=[27,63];monat(w);
    for(const auswahl of [null,"front:SYR","front-SYR-27","27"]) {
      const html=renderToStaticMarkup(<TransportTafel world={w} auswahl={auswahl} onAuswahl={()=>{}} gas={false} onGas={()=>{}} refresh={()=>{}} onWirtschaft={()=>{}} onClose={()=>{}}/>);
      expect(html).not.toMatch(/transport\.[a-z]|\{(?:monat|land|tage|kraft|pk|bip)\}|NaN/);
    }
    const de=JSON.parse(readFileSync(new URL("../src/i18n/katalog/de/transport.json",import.meta.url),"utf8"));
    const other=JSON.parse(readFileSync(new URL(`../src/i18n/katalog/${lang}/transport.json`,import.meta.url),"utf8"));
    expect(Object.keys(other).sort()).toEqual(Object.keys(de).sort());
  });
});
