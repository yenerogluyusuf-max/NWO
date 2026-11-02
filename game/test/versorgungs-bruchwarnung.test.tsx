import { afterEach, describe, expect, test } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createWorld, save } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { schnellProfil, startAfterElection } from "../src/sim/prolog";
import { fraktion } from "../src/sim/fraktionen";
import { gueterSicht } from "../src/sim/gueter";
import { aussenZustand } from "../src/sim/diplomatie";
import { beschliesseVersorgungsProgramm, aendereVersorgungsVorlage } from "../src/sim/versorgungspolitik";
import { versorgungsStimmen, versorgungsBruchrisiken } from "../src/sim/versorgungsmehrheit";
import { versorgungsMehrheitsWege, uebernehmeVersorgungsWeg } from "../src/sim/versorgungsberatung";
import { naechsteKoalitionspruefung } from "../src/sim/koalitionslage";
import { addDays } from "../src/sim/dates";
import { spielTick } from "../src/sim/spiel";
import { Rng } from "../src/sim/rng";
import { VersorgungsMandat } from "../src/ui/gueter/VersorgungsMandat";
import { setzeSprache, t, katalogVon, platzhalter } from "../src/i18n";
import type { World } from "../src/sim/types";

function welt(datum="2028-06-24") {
  const w=createWorld(turkey2026,17);startAfterElection(w,schnellProfil());
  w.date=datum;w.day=0;w.spiel!.start.datum=datum;
  w.spiel!.ereignisse=[];w.spiel!.zusagen=[];w.spiel!.kapital=150;w.spiel!.lager=["YENİ"];
  w.parliament!.seats={[w.player!.partei.kurz]:200,"YENİ":120,CHP:200,MHP:50,DEM:30};
  for(const p of Object.keys(w.parliament!.seats))fraktion(w,p).bereitschaft=50;
  chef(w).loyalitaet=23;aussenZustand(w).energie.hormus="offen";gueterSicht(w);
  beschliesseVersorgungsProgramm(w,"schutz");aendereVersorgungsVorlage(w,"schutz","sozial");return w;
}
const v=(w:World)=>w.spiel!.gueter!.regierung!.vorlagen!.schutz!;
const chef=(w:World)=>w.spiel!.figuren.find(f=>f.amt==="partner"&&f.partei==="YENİ")!;
const warnung=(w:World)=>versorgungsBruchrisiken(w,versorgungsStimmen(w,v(w),v(w).abstimmung),v(w).abstimmung);
afterEach(async()=>{await setzeSprache("de");});

describe("Bruchwarnung vor dem Versorgungsvotum",()=>{
  test("Votum am Ersten kann den Partner im selben Tageslauf kosten; Warnung steht vorher fest",()=>{
    const w=welt(),stand=save(w),risiken=warnung(w);
    expect(risiken).toHaveLength(1);expect(risiken[0]).toMatchObject({partei:"YENİ",angenommen:true,zeitpunkt:"gleich",pruefung:"2028-07-01",sitze:120,ohne:200});
    expect(risiken[0]!.personen[0]).toMatchObject({vorher:23,nachher:19});expect(save(w)).toBe(stand);
    w.day+=7;w.date=addDays(w.date,7);spielTick(w,new Rng(19));
    expect(v(w).status).toBe("angenommen");expect(w.spiel!.lager).not.toContain("YENİ");
    expect(v(w).reaktionen!.find(r=>r.partei==="YENİ")!.personen[0]!.loyalitaet).toBe(-4);
  });
  test("auch Ablehnung kann die Bruchschwelle unterschreiten",()=>{
    const w=welt();aendereVersorgungsVorlage(w,"schutz","sozial");chef(w).loyalitaet=21;
    w.parliament!.seats={[w.player!.partei.kurz]:130,"YENİ":120,CHP:200,MHP:80,DEM:70};
    expect(warnung(w)[0]).toMatchObject({angenommen:false,zeitpunkt:"gleich",personen:[{vorher:21,nachher:19}]});
  });
  test("bereits akuter Partner kann vor dem Votum gehen, selbst wenn das spätere Paket ihn besänftigen würde",()=>{
    const w=welt("2028-06-28");aendereVersorgungsVorlage(w,"schutz","sozial");aendereVersorgungsVorlage(w,"schutz","haushalt");chef(w).loyalitaet=19;
    expect(warnung(w)[0]).toMatchObject({zeitpunkt:"vorher",pruefung:"2028-07-01",personen:[{vorher:19,nachher:22}]});
  });
  test("Votum nach dem Ersten nennt den nächsten Prüfmonat; Loyalität genau 20 ist kein unmittelbarer Bruch",()=>{
    const w=welt("2028-06-25");expect(warnung(w)[0]).toMatchObject({zeitpunkt:"spaeter",pruefung:"2028-08-01"});
    chef(w).loyalitaet=24;expect(warnung(w)).toEqual([]);
    chef(w).loyalitaet=0;chef(w).imAmt=false;expect(warnung(w)).toEqual([]);
    chef(w).imAmt=true;w.spiel!.lager=[];expect(warnung(w)).toEqual([]);
  });
  test("Monatsprüfung behandelt Jahreswechsel, Schaltjahr und denselben Monatsersten korrekt",()=>{
    expect(naechsteKoalitionspruefung("2028-12-31",true)).toBe("2029-01-01");
    expect(naechsteKoalitionspruefung("2028-02-29",true)).toBe("2028-03-01");
    expect(naechsteKoalitionspruefung("2028-07-01",true)).toBe("2028-07-01");
    expect(naechsteKoalitionspruefung("2028-07-01")).toBe("2028-08-01");
  });
  test("späte Klauseländerung kann das Votum erst auf den Monatsersten verschieben",()=>{
    const w=welt("2028-06-22");aendereVersorgungsVorlage(w,"schutz","sozial");w.day+=6;w.date=addDays(w.date,6);
    expect(v(w).abstimmung).toBe(7);
    const p=versorgungsMehrheitsWege(w,"schutz").find(p=>p.klauseln.includes("sozial"))!;
    expect(p.abstimmung).toBe(9);expect(p.bruchrisiken[0]).toMatchObject({zeitpunkt:"gleich",pruefung:"2028-07-01"});
  });
  test("verschlechterte Bruchprognose verwirft ein veraltetes Paket trotz gleicher nominaler Loyalitätskosten",()=>{
    const w=welt();aendereVersorgungsVorlage(w,"schutz","sozial");
    const p=versorgungsMehrheitsWege(w,"schutz").find(p=>p.klauseln.includes("sozial"))!;
    expect(p.bruchrisiken[0]!.personen[0]!.nachher).toBe(19);chef(w).loyalitaet=22;
    const stand=save(w);expect(uebernehmeVersorgungsWeg(w,p).ok).toBe(false);expect(save(w)).toBe(stand);
  });
  test.each(["de","en","tr"] as const)("sichtbare Warnung in Entwurf und Kompromissen ist in %s vollständig",async sprache=>{
    await setzeSprache(sprache);const w=welt(),stand=save(w);
    const html=renderToStaticMarkup(<VersorgungsMandat world={w} programm="schutz" geaendert={()=>{}}/>);
    expect(html).toContain(t("mandat.bruch.titel"));expect(html).toContain(t("mandat.bruch.gespraech"));expect(html).not.toContain("⟦");expect(save(w)).toBe(stand);
    for(const key of Object.keys(katalogVon("de")).filter(k=>k.startsWith("mandat.bruch.")))expect(platzhalter(katalogVon(sprache)[key]!)).toEqual(platzhalter(katalogVon("de")[key]!));
  });
});
