import { afterEach, describe, expect, test } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createWorld, load, save } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { schnellProfil, startAfterElection } from "../src/sim/prolog";
import { gueterMonat, gueterSicht, gueterZustand } from "../src/sim/gueter";
import { beschliesseVersorgungsProgramm, aendereVersorgungsVorlage, versorgungsGespraech, zieheVersorgungsVorlageZurueck, versorgungsParlamentTag, versorgungsKonditionen, versorgungsKlauselVorschau, versorgungsVorlageHindernis, versorgungsAenderungsTermin, versorgungsPolitikAbschluss, beschliesseVersorgungsKurs, type VersorgungsProgramm } from "../src/sim/versorgungspolitik";
import { versorgungsStimmen, auslaufendeVersorgungsDuldungen } from "../src/sim/versorgungsmehrheit";
import { aussenZustand } from "../src/sim/diplomatie";
import { vertrauenSicht, vertrauenZu } from "../src/sim/laender";
import { fraktion } from "../src/sim/fraktionen";
import { oppositionVon } from "../src/sim/opposition";
import { addDays, formatDateDe } from "../src/sim/dates";
import { NET } from "../src/sim/modell";
import { nationalAverage } from "../src/sim/netz";
import { spielTick } from "../src/sim/spiel";
import { Rng } from "../src/sim/rng";
import { VersorgungsMandat, VersorgungsTagesordnung } from "../src/ui/gueter/VersorgungsMandat";
import { leseAbstimmung, baueVerlauf, letzteAbstimmungen } from "../src/ui/parlament/abstimmung";
import { rendere, setzeSprache, t } from "../src/i18n";
import type { World } from "../src/sim/types";
import type { KriegVorgang } from "../src/sim/krieg-typen";

function welt() {
  const w=createWorld(turkey2026,17);startAfterElection(w,schnellProfil());
  w.spiel!.ereignisse=[];w.spiel!.kapital=150;w.spiel!.lager=["YENİ"];
  w.parliament!.seats={[w.player!.partei.kurz]:130,"YENİ":120,CHP:200,MHP:80,DEM:70};
  for (const p of Object.keys(w.parliament!.seats)) fraktion(w,p).bereitschaft=50;
  aussenZustand(w).energie.hormus="offen";gueterSicht(w);return w;
}
const v=(w:World,id:VersorgungsProgramm="schutz")=>w.spiel!.gueter!.regierung!.vorlagen![id]!;
const stimmen=(w:World,id:VersorgungsProgramm="schutz")=>versorgungsStimmen(w,v(w,id));
const ja=(w:World)=>stimmen(w).reduce((s,f)=>s+f.ja,0);
function zeit(w:World,n:number){w.day+=n;w.date=addDays(w.date,n);}
function mehrheit(w:World){w.parliament!.seats={[w.player!.partei.kurz]:600};}
function abstimmen(w:World,id:VersorgungsProgramm="schutz"){zeit(w,v(w,id).abstimmung-w.day);versorgungsParlamentTag(w);}
afterEach(async()=>{await setzeSprache("de");});

describe("Versorgung im bestehenden Parlament",()=>{
  test("Einbringen bezahlt nur Initiative; sieben Tage Debatte, keine Güter und keine Schulden",()=>{
    const w=welt(),debt=w.economy.debtRatio,normal=gueterSicht(w);
    expect(beschliesseVersorgungsProgramm(w,"schutz").ok).toBe(true);
    expect(w.spiel!.kapital).toBe(146);expect(w.economy.debtRatio).toBe(debt);
    expect(w.spiel!.gueter!.regierung!.programme.schutz).toBeUndefined();
    expect(gueterSicht(w)).toEqual(normal);
    zeit(w,6);versorgungsParlamentTag(w);expect(v(w).status).toBe("offen");
    const before=save(w);expect(beschliesseVersorgungsProgramm(w,"schutz").ok).toBe(false);expect(save(w)).toBe(before);
  });
  test("Koalition folgt nicht blind; sozialer Kompromiss gewinnt Opposition und Mehrheitswechsel",()=>{
    const w=welt();beschliesseVersorgungsProgramm(w,"schutz");const vorher=stimmen(w);
    expect(ja(w)).toBeLessThan(301);
    const koalition=vorher.find(f=>f.partei==="YENİ")!;expect(koalition.ja).toBeLessThan(koalition.sitze);
    expect(aendereVersorgungsVorlage(w,"schutz","sozial").ok).toBe(true);
    expect(ja(w)).toBeGreaterThanOrEqual(301);
    expect(stimmen(w).find(f=>f.partei==="CHP")!.ja).toBeGreaterThan(vorher.find(f=>f.partei==="CHP")!.ja);
    const debt=w.economy.debtRatio;abstimmen(w);
    expect(v(w).status).toBe("angenommen");expect(w.economy.debtRatio).toBeCloseTo(debt+0.07);
    expect(w.spiel!.gueter!.regierung!.programme.schutz!.traeger).toContain("CHP");
    expect(fraktion(w,"CHP").bereitschaft).toBe(53);expect(fraktion(w,"YENİ").bereitschaft).toBe(46);
  });
  test("Scheitern kostet Vertrauen und Zeit, aber kein Haushaltsgeld; erneutes Tick bucht nichts doppelt",()=>{
    const w=welt();beschliesseVersorgungsProgramm(w,"schutz");const debt=w.economy.debtRatio,vertrauen=nationalAverage(NET,w.net,"vertrauen_regierung");
    abstimmen(w);expect(v(w).status).toBe("abgelehnt");
    expect(w.spiel!.gueter!.regierung!.programme.schutz).toBeUndefined();expect(w.economy.debtRatio).toBe(debt);
    expect(nationalAverage(NET,w.net,"vertrauen_regierung")).toBeCloseTo(vertrauen-0.5);
    const before=save(w);versorgungsParlamentTag(w);expect(save(w)).toBe(before);
    expect(beschliesseVersorgungsProgramm(w,"schutz").ok).toBe(false);zeit(w,14);expect(beschliesseVersorgungsProgramm(w,"schutz").ok).toBe(true);
  });
  test("Kompromisse schließen einander aus; späte Änderungen lassen drei Tage Beratung",()=>{
    const w=welt();beschliesseVersorgungsProgramm(w,"schutz");
    aendereVersorgungsVorlage(w,"schutz","sozial");const before=save(w);
    expect(aendereVersorgungsVorlage(w,"schutz","haushalt").ok).toBe(false);expect(save(w)).toBe(before);
    zeit(w,6);aendereVersorgungsVorlage(w,"schutz","kontrolle");expect(v(w).abstimmung-w.day).toBe(3);
    zeit(w,3);const zuSpaet=save(w);expect(aendereVersorgungsVorlage(w,"schutz","sozial").ok).toBe(false);expect(save(w)).toBe(zuSpaet);
  });
  test("Vorschau vor dem Klick ist zustandsneutral und entspricht den tatsächlichen Stimmen und Kosten",()=>{
    const w=welt();beschliesseVersorgungsProgramm(w,"schutz");const stand=save(w);
    const p=versorgungsKlauselVorschau(w,v(w),"sozial"), e={...v(w),klauseln:p.klauseln};
    const prognose=versorgungsStimmen(w,e), kosten=versorgungsKonditionen(e);
    expect(p.grund).toBeUndefined();expect(save(w)).toBe(stand);
    aendereVersorgungsVorlage(w,"schutz","sozial");expect(stimmen(w)).toEqual(prognose);expect(versorgungsKonditionen(v(w))).toEqual(kosten);
    const konflikt=versorgungsKlauselVorschau(w,v(w),"haushalt");expect(konflikt.grund).toBeDefined();expect(aendereVersorgungsVorlage(w,"schutz","haushalt").text).toBe(konflikt.grund);
  });
  test("Abstimmungsbericht zeigt gebuchte, begrenzte Bereitschaft und wirkliche Partnerloyalität",()=>{
    const w=welt();fraktion(w,"CHP").bereitschaft=99;fraktion(w,"YENİ").bereitschaft=2;
    w.spiel!.figuren=w.spiel!.figuren.filter(f=>f.amt!=="partner");
    w.spiel!.figuren.push({id:"test-partner",name:"Partner",rolle:"Partner",amt:"partner",ziel:"Markt",loyalitaet:2,imAmt:true,partei:"YENİ"});
    beschliesseVersorgungsProgramm(w,"schutz");aendereVersorgungsVorlage(w,"schutz","sozial");abstimmen(w);
    expect(v(w).status).toBe("angenommen");
    expect(v(w).reaktionen!.find(r=>r.partei==="CHP")!.bereitschaft).toBe(1);
    expect(v(w).reaktionen!.find(r=>r.partei==="YENİ")).toMatchObject({bereitschaft:-2,personen:[{name:"Partner",loyalitaet:-2}]});
    const k=load(save(w));expect(v(k).reaktionen).toEqual(v(w).reaktionen);
    const html=renderToStaticMarkup(<VersorgungsMandat world={k} programm="schutz" geaendert={()=>{}}/>);
    expect(html).toContain("Tatsächliche politische Folgen");expect(html).toContain("-2,0 Loyalität");
  });
  test("Gespräch kostet einmal 1 PK, holt Stimmen aber ist keine wiederholbare Loyalitätsbelohnung",()=>{
    const w=welt();beschliesseVersorgungsProgramm(w,"schutz");const vorher=ja(w),bereitschaft=fraktion(w,"CHP").bereitschaft;
    expect(versorgungsGespraech(w,"schutz","CHP").ok).toBe(true);expect(w.spiel!.kapital).toBe(145);expect(ja(w)).toBeGreaterThan(vorher);
    expect(fraktion(w,"CHP").bereitschaft).toBe(bereitschaft);
    const before=save(w);expect(versorgungsGespraech(w,"schutz","CHP").ok).toBe(false);expect(versorgungsGespraech(w,"schutz","fehlend").ok).toBe(false);expect(save(w)).toBe(before);
  });
  test("Rückzug erstattet halbe Initiative, keine Gespräche; nach Fälligkeit kein Rückzug",()=>{
    const w=welt();beschliesseVersorgungsProgramm(w,"schutz");versorgungsGespraech(w,"schutz","CHP");
    expect(zieheVersorgungsVorlageZurueck(w,"schutz").ok).toBe(true);expect(w.spiel!.kapital).toBe(147);
    const html=renderToStaticMarkup(<VersorgungsMandat world={w} programm="schutz" geaendert={()=>{}}/>);
    expect(html).toContain("Kein Auftrag. Kein Haushaltsgeld freigegeben.");expect(html).toContain("Verbraucht: 3 politisches Kapital");
    expect(html).toContain("Keine Abstimmung");expect(html).not.toContain("Budget bei Annahme");expect(html).not.toContain("Ja erwartet");
    zeit(w,20);versorgungsParlamentTag(w);expect(w.economy.debtRatio).toBe(welt().economy.debtRatio);
    beschliesseVersorgungsProgramm(w,"schutz");zeit(w,7);expect(zieheVersorgungsVorlageZurueck(w,"schutz").ok).toBe(false);
  });
  test("Aktuelle Sitze und Koalition am Abstimmungstag zählen, auch nach einer Wahl",()=>{
    const w=welt();beschliesseVersorgungsProgramm(w,"schutz");aendereVersorgungsVorlage(w,"schutz","sozial");expect(ja(w)).toBeGreaterThanOrEqual(301);
    w.parliament!.seats={MHP:600};w.spiel!.lager=[];abstimmen(w);
    expect(v(w).status).toBe("abgelehnt");expect(v(w).stimmen!.every(f=>f.partei==="MHP")).toBe(true);
  });
  test("Bestehende Duldung und Fraktionsbereitschaft beeinflussen dieselbe Vorlage",()=>{
    const w=welt();beschliesseVersorgungsProgramm(w,"schutz");const vor=stimmen(w).find(f=>f.partei==="CHP")!.ja;
    fraktion(w,"CHP").duldungBis=w.day+10;fraktion(w,"CHP").bereitschaft=90;
    expect(stimmen(w).find(f=>f.partei==="CHP")!.ja).toBeGreaterThan(vor);
    zeit(w,10);expect(stimmen(w).find(f=>f.partei==="CHP")!.rolle).toBe("opposition");
  });
  test("Prognose entfernt eine am Abstimmungstag auslaufende Duldung vorab und entspricht dem Votum",()=>{
    const w=welt();w.parliament!.seats={[w.player!.partei.kurz]:130,"YENİ":100,CHP:370};
    fraktion(w,"CHP").duldungBis=w.day+7;beschliesseVersorgungsProgramm(w,"schutz");
    const heute=stimmen(w),prognose=versorgungsStimmen(w,v(w),v(w).abstimmung);
    const jaHeute=heute.reduce((n,f)=>n+f.ja,0),jaPrognose=prognose.reduce((n,f)=>n+f.ja,0);
    expect(jaHeute).toBeGreaterThanOrEqual(301);expect(jaPrognose).toBeLessThan(301);
    expect(prognose.find(f=>f.partei==="CHP")!.rolle).toBe("opposition");
    const stand=save(w),html=renderToStaticMarkup(<VersorgungsMandat world={w} programm="schutz" geaendert={()=>{}}/>);
    expect(html).toContain(t("mandat.stand",{ja:jaPrognose,gesamt:600}));expect(html).toContain(t("mandat.duldungEndet"));expect(save(w)).toBe(stand);
    abstimmen(w);expect(v(w).stimmen).toEqual(prognose);expect(v(w).status).toBe("abgelehnt");
  });
  test("Späte Klausel zeigt Terminverschiebung und dadurch verlorene Duldungsstimmen vor dem Klick",()=>{
    const w=welt();w.parliament!.seats={[w.player!.partei.kurz]:130,"YENİ":100,CHP:370};
    fraktion(w,"CHP").duldungBis=w.day+8;beschliesseVersorgungsProgramm(w,"schutz");zeit(w,6);
    const alterTermin=v(w).abstimmung,neuerTermin=versorgungsAenderungsTermin(w,alterTermin);
    const aktuell=versorgungsStimmen(w,v(w),alterTermin).reduce((n,f)=>n+f.ja,0);
    const kandidat={...v(w),klauseln:versorgungsKlauselVorschau(w,v(w),"kontrolle").klauseln};
    const prognose=versorgungsStimmen(w,kandidat,neuerTermin),danach=prognose.reduce((n,f)=>n+f.ja,0);
    expect(neuerTermin-alterTermin).toBe(2);expect(aktuell).toBeGreaterThanOrEqual(301);expect(danach).toBeLessThan(301);
    const stand=save(w),html=renderToStaticMarkup(<VersorgungsMandat world={w} programm="schutz" geaendert={()=>{}}/>);
    expect(html).toContain(t("mandat.votumVerschoben",{tage:2,datum:formatDateDe(addDays(w.date,3))}));
    expect(html).toContain(t("mandat.stimmenDelta",{n:danach-aktuell}));expect(html).toContain(t("mandat.duldungDurchAenderung",{parteien:"CHP"}));expect(save(w)).toBe(stand);
    expect(aendereVersorgungsVorlage(w,"schutz","kontrolle").ok).toBe(true);expect(v(w).abstimmung).toBe(neuerTermin);
    abstimmen(w);expect(v(w).stimmen).toEqual(prognose);
  });
  test("Fristwarnung betrifft nur noch laufende Duldungen parlamentarischer Parteien außerhalb der Koalition",()=>{
    const w=welt(),tag=w.day;
    fraktion(w,w.player!.partei.kurz).duldungBis=tag+7;fraktion(w,"YENİ").duldungBis=tag+7;
    fraktion(w,"CHP").duldungBis=tag+7;fraktion(w,"MHP").duldungBis=tag;fraktion(w,"DEM").duldungBis=tag+8;
    fraktion(w,"ausgeschieden").duldungBis=tag+7;const stand=save(w);
    expect(auslaufendeVersorgungsDuldungen(w,tag+7)).toEqual([{partei:"CHP",bis:tag+7}]);expect(save(w)).toBe(stand);
  });
  test("Zeitplan vor dem Beschluss entspricht tatsächlichem Vorlauf und Vertragsende",()=>{
    const w=welt();mehrheit(w);beschliesseVersorgungsProgramm(w,"energie","AZE");aendereVersorgungsVorlage(w,"energie","kontrolle");aendereVersorgungsVorlage(w,"energie","haushalt");
    const ab=formatDateDe(addDays(w.date,7+37)),bis=formatDateDe(addDays(w.date,7+37+90));
    const vorher=renderToStaticMarkup(<VersorgungsMandat world={w} programm="energie" geaendert={()=>{}}/>);
    expect(vorher).toContain(t("mandat.zeitplanVorschau",{ab,bis}));abstimmen(w,"energie");
    const a=w.spiel!.gueter!.regierung!.programme.energie!;
    expect(formatDateDe(addDays(w.date,a.ab-w.day))).toBe(ab);expect(formatDateDe(addDays(w.date,a.bis-w.day))).toBe(bis);
    expect(renderToStaticMarkup(<VersorgungsMandat world={w} programm="energie" geaendert={()=>{}}/>)).toContain(t("mandat.zeitplanBeschlossen",{ab,bis}));
  });
  test.each(["de","en","tr"] as const)("Termin- und Duldungshinweise sind übersetzt: %s",async lang=>{
    await setzeSprache(lang);const w=welt();fraktion(w,"CHP").duldungBis=w.day+7;beschliesseVersorgungsProgramm(w,"schutz");zeit(w,6);
    const stand=save(w),html=renderToStaticMarkup(<VersorgungsMandat world={w} programm="schutz" geaendert={()=>{}}/>);
    expect(html).toContain(t("mandat.duldungEndet"));expect(html).toContain(t("mandat.votumVerschoben",{tage:2,datum:formatDateDe(addDays(w.date,3))}));
    expect(html).not.toMatch(/⟦|mandat\.|\{(?:ab|bis|parteien|tage|datum)\}/);expect(save(w)).toBe(stand);
  });
  test("Haushaltsdeckel reduziert echte Kosten und Laufzeit; Vorlauf beginnt nach dem Votum",()=>{
    const w=welt();mehrheit(w);beschliesseVersorgungsProgramm(w,"energie","AZE");aendereVersorgungsVorlage(w,"energie","haushalt");aendereVersorgungsVorlage(w,"energie","kontrolle");
    const debt=w.economy.debtRatio;abstimmen(w,"energie");const a=w.spiel!.gueter!.regierung!.programme.energie!;
    expect(a.ab-w.day).toBe(37);expect(a.bis-a.ab).toBe(90);expect(w.economy.debtRatio-debt).toBeCloseTo(0.013);
    const konditionen=versorgungsKonditionen(v(w,"energie"));
    expect(konditionen.bip).toBeCloseTo(0.013);expect(konditionen.dauer).toBe(90);expect(konditionen.vorlauf).toBe(37);
  });
  test("Verschlechterte Außenbeziehung vor dem Votum verhindert Vertrag und Kosten",()=>{
    const w=welt();mehrheit(w);beschliesseVersorgungsProgramm(w,"energie","AZE");const debt=w.economy.debtRatio;
    aussenZustand(w).eigeneSanktionen.push("AZE");abstimmen(w,"energie");
    expect(v(w,"energie").status).toBe("gegenstandslos");expect(w.economy.debtRatio).toBe(debt);expect(w.spiel!.gueter!.regierung!.programme.energie).toBeUndefined();
  });
  test.each(["de","en","tr"] as const)("Blockade trotz Mehrheit vorab sichtbar, Grund bleibt nach Laden und Entspannung erhalten: %s",async lang=>{
    const w=welt();mehrheit(w);beschliesseVersorgungsProgramm(w,"energie","AZE");
    aussenZustand(w).eigeneSanktionen.push("AZE");
    const grund=versorgungsVorlageHindernis(w,v(w,"energie"))!;
    const stand=save(w), debt=w.economy.debtRatio;
    await setzeSprache(lang);
    const html=renderToStaticMarkup(<VersorgungsMandat world={w} programm="energie" geaendert={()=>{}}/>);
    expect(html).toContain(t("mandat.vollzugBlockiert"));expect(html).toContain(rendere(grund));
    expect(html).toContain(t("mandat.hindernis.diplomatie"));expect(html).not.toContain(t("mandat.mehrheit"));
    expect(html).not.toMatch(/⟦|\{(?:datum|grund)\}/);expect(save(w)).toBe(stand);
    abstimmen(w,"energie");expect(v(w,"energie").ausfallGrund).toEqual(grund);expect(w.economy.debtRatio).toBe(debt);
    aussenZustand(w).eigeneSanktionen=[];
    const k=load(save(w));await setzeSprache(lang==="de"?"en":"de");
    const abgeschlossen=renderToStaticMarkup(<VersorgungsMandat world={k} programm="energie" geaendert={()=>{}}/>);
    expect(abgeschlossen).toContain(t("mandat.hindernis.damals",{grund:rendere(grund)}));
    expect(abgeschlossen).toContain(t("mandat.keineAbstimmung"));expect(abgeschlossen).not.toContain(t("mandat.erwartet"));
    versorgungsParlamentTag(k);expect(k.spiel!.gueter!.regierung!.programme.energie).toBeUndefined();
  });
  test("Vor dem Stichtag aufgehobene Sanktionen erlauben das tatsächliche Votum",()=>{
    const w=welt();mehrheit(w);beschliesseVersorgungsProgramm(w,"energie","AZE");aussenZustand(w).eigeneSanktionen.push("AZE");
    expect(versorgungsVorlageHindernis(w,v(w,"energie"))).toBeDefined();
    aussenZustand(w).eigeneSanktionen=[];expect(versorgungsVorlageHindernis(w,v(w,"energie"))).toBeUndefined();
    const debt=w.economy.debtRatio;abstimmen(w,"energie");
    expect(v(w,"energie").status).toBe("angenommen");expect(v(w,"energie").ausfallGrund).toBeUndefined();
    expect(w.economy.debtRatio).toBeCloseTo(debt+0.02);
  });
  test.each([false,true])("Energie-Vorschau migriert fehlende Länder- und Außenstände nicht: Teilstand %s",teilstand=>{
    const w=welt();beschliesseVersorgungsProgramm(w,"energie","AZE");delete w.spiel!.weltmodell;
    if(teilstand) w.spiel!.welt={};else delete w.spiel!.welt;
    const stand=save(w), vertrauen=vertrauenSicht(w,"AZE");
    const grund=versorgungsVorlageHindernis(w,v(w,"energie"));
    renderToStaticMarkup(<VersorgungsMandat world={w} programm="energie" geaendert={()=>{}}/>);
    expect(save(w)).toBe(stand);
    expect(vertrauenZu(w,"AZE")).toBe(vertrauen);
    expect(versorgungsVorlageHindernis(w,v(w,"energie"))).toEqual(grund);
  });
  test("Nach Kriegsende lässt sich die ungültige Einsatzgarantie vor dem Votum entfernen",()=>{
    const w=welt();mehrheit(w);w.spiel!.kriege=[{id:"syr",land:"SYR",phase:"krieg"} as KriegVorgang];
    beschliesseVersorgungsProgramm(w,"schutz");aendereVersorgungsVorlage(w,"schutz","einsatz");
    w.spiel!.kriege=[];zeit(w,6);
    expect(versorgungsVorlageHindernis(w,v(w))?.k).toBe("mandat.keinEinsatz");
    const html=renderToStaticMarkup(<VersorgungsMandat world={w} programm="schutz" geaendert={()=>{}}/>);
    expect(html).toContain(t("mandat.hindernis.einsatz"));
    expect(aendereVersorgungsVorlage(w,"schutz","einsatz").ok).toBe(true);
    expect(v(w).abstimmung-w.day).toBe(3);expect(versorgungsVorlageHindernis(w,v(w))).toBeUndefined();
    abstimmen(w);expect(v(w).status).toBe("angenommen");expect(gueterZustand(w).prioritaet).not.toBe("militaer");
  });
  test("Zivilgarantie bindet tatsächlichen Verteilungskurs bis Programmende",()=>{
    const w=welt();mehrheit(w);beschliesseVersorgungsProgramm(w,"schutz");aendereVersorgungsVorlage(w,"schutz","zivil");abstimmen(w);
    expect(gueterZustand(w).prioritaet).toBe("zivil");expect(beschliesseVersorgungsKurs(w,"militaer").ok).toBe(false);
    zeit(w,90);expect(beschliesseVersorgungsKurs(w,"militaer").ok).toBe(true);
  });
  test("Einsatzgarantie braucht Krieg und widerspricht Zivilgarantie",()=>{
    const w=welt();beschliesseVersorgungsProgramm(w,"schutz");expect(aendereVersorgungsVorlage(w,"schutz","einsatz").ok).toBe(false);
    w.spiel!.kriege=[{id:"syr",land:"SYR",phase:"krieg"} as KriegVorgang];
    expect(aendereVersorgungsVorlage(w,"schutz","einsatz").ok).toBe(true);expect(aendereVersorgungsVorlage(w,"schutz","zivil").ok).toBe(false);
    mehrheit(w);abstimmen(w);expect(gueterZustand(w).prioritaet).toBe("militaer");
  });
  test("Andere laufende Kursbindung kann nicht durch Garantie übergangen werden",()=>{
    const w=welt();beschliesseVersorgungsKurs(w,"militaer");beschliesseVersorgungsProgramm(w,"schutz");
    expect(aendereVersorgungsVorlage(w,"schutz","zivil").ok).toBe(false);
  });
  test("Garantie wird beim Votum erneut geprüft, falls inzwischen ein anderer Kurs beschlossen wurde",()=>{
    const w=welt();mehrheit(w);beschliesseVersorgungsProgramm(w,"schutz");aendereVersorgungsVorlage(w,"schutz","zivil");beschliesseVersorgungsKurs(w,"militaer");
    const grund=versorgungsVorlageHindernis(w,v(w));expect(grund?.k).toBe("regierung.kursBindung");
    abstimmen(w);expect(v(w).status).toBe("gegenstandslos");expect(v(w).ausfallGrund).toEqual(grund);expect(gueterZustand(w).prioritaet).toBe("militaer");
  });
  test("Sozialausgleich wirkt auf Armut und Belastung, nicht auf die Menge vorhandener Waren",()=>{
    const w=welt();mehrheit(w);beschliesseVersorgungsProgramm(w,"schutz");aendereVersorgungsVorlage(w,"schutz","sozial");abstimmen(w);
    const ohne=load(save(w));ohne.spiel!.gueter!.regierung!.programme.schutz!.klauseln=[];
    expect(gueterSicht(w)).toEqual(gueterSicht(ohne));const armut=nationalAverage(NET,w.net,"armut");
    gueterMonat(w);expect(w.spiel!.gueter!.regierung!.bericht!.vertrauen).toBeCloseTo(-0.1);
    gueterMonat(ohne);expect(nationalAverage(NET,w.net,"armut")-nationalAverage(NET,ohne.net,"armut")).toBeCloseTo(-0.25);expect(nationalAverage(NET,w.net,"armut")).toBeLessThan(armut+1);
  });
  test("Schlechte Versorgung führt zu realer Oppositionsanfrage und Verlust an Kooperationsbereitschaft, einmal pro Monat",()=>{
    const w=welt();beschliesseVersorgungsProgramm(w,"schutz");aendereVersorgungsVorlage(w,"schutz","sozial");aendereVersorgungsVorlage(w,"schutz","kontrolle");abstimmen(w);zeit(w,7);
    gueterMonat(w);const b=structuredClone(w.spiel!.gueter!.bilanz!);zeit(w,31);b.monat=w.date.slice(0,7);
    for (const f of Object.values(b.waren)) {if (f) {f.geliefert=f.bedarf*0.5;f.fehl=f.bedarf-f.geliefert;}}
    const o=oppositionVon(w),staerke=o.staerke,bereit=fraktion(w,"CHP").bereitschaft;
    versorgungsPolitikAbschluss(w,b);
    expect(o.staerke).toBeCloseTo(staerke+2);expect(o.zuege.at(-1)?.art).toBe("anfrage");expect(fraktion(w,"CHP").bereitschaft).toBe(bereit-2);
    expect(w.spiel!.gueter!.regierung!.bericht!.oppositionStaerke).toBe(2);
    expect(w.spiel!.gueter!.regierung!.bericht!.reaktionen!.find(r=>r.partei==="CHP")!.bereitschaft).toBe(-2);
    const stand=save(w);versorgungsPolitikAbschluss(w,b);expect(save(w)).toBe(stand);
  });
  test("Kursentscheidung verändert die bestehende Koalitionsloyalität und Fraktionsbereitschaft",()=>{
    const w=welt();w.spiel!.lager=["MHP"];
    w.spiel!.figuren.push({id:"test-partner",name:"Partner",rolle:"Partner",amt:"partner",ziel:"Sicherheit",loyalitaet:50,imAmt:true,partei:"MHP"});
    beschliesseVersorgungsKurs(w,"zivil");expect(fraktion(w,"MHP").bereitschaft).toBeLessThan(50);
    expect(w.spiel!.figuren.at(-1)!.loyalitaet).toBeLessThan(50);
  });
  test("Kurswechsel hin und zurück erzeugen keinen zusätzlichen Fraktionsrückhalt",()=>{
    const w=welt();const vorher=fraktion(w,"MHP").bereitschaft;
    beschliesseVersorgungsKurs(w,"militaer");expect(fraktion(w,"MHP").bereitschaft).toBeGreaterThan(vorher);
    zeit(w,30);beschliesseVersorgungsKurs(w,"ausgewogen");expect(fraktion(w,"MHP").bereitschaft).toBeCloseTo(vorher);
  });
  test("Ausgeschiedene Partner reagieren als Fraktion, erhalten aber keine Koalitionsloyalität",()=>{
    const w=welt();w.spiel!.lager=[];
    w.spiel!.figuren.push({id:"frueherer-partner",name:"Früherer Partner",rolle:"Partner",amt:"partner",ziel:"Sicherheit",loyalitaet:50,imAmt:true,partei:"MHP"});
    beschliesseVersorgungsKurs(w,"militaer");
    expect(fraktion(w,"MHP").bereitschaft).toBeGreaterThan(50);expect(w.spiel!.figuren.at(-1)!.loyalitaet).toBe(50);
  });
  test("Laden erhält Entwurf und Kompromisse; Tageslauf vollzieht nach Frist genau einmal",()=>{
    const w=welt();mehrheit(w);beschliesseVersorgungsProgramm(w,"schutz");aendereVersorgungsVorlage(w,"schutz","haushalt");const k=load(save(w));
    expect(v(k)).toEqual(v(w));zeit(k,7);spielTick(k,new Rng(7));expect(v(k).status).toBe("angenommen");
    const debt=k.economy.debtRatio;versorgungsParlamentTag(k);expect(k.economy.debtRatio).toBe(debt);
  });
  test("Alte Aufträge werden nicht rückwirkend zur Abstimmung gestellt",()=>{
    const w=welt();gueterZustand(w).regierung={programme:{schutz:{ab:w.day,bis:w.day+90}}};const before=save(w);versorgungsParlamentTag(w);expect(save(w)).toBe(before);
  });
  test("Parlamentssequenz und Historie verwenden echte Fraktionsstimmen auch nach Wahl und Sprachwechsel",async()=>{
    const w=welt();beschliesseVersorgungsProgramm(w,"schutz");aendereVersorgungsVorlage(w,"schutz","sozial");abstimmen(w);
    const erwartet=v(w).stimmen!, eintrag=w.log.find(l=>l.versorgungsvotum)!;
    expect(eintrag).toBeDefined();expect(letzteAbstimmungen(w)[0]!.ja).toBe(erwartet.reduce((s,f)=>s+f.ja,0));
    w.parliament!.seats={MHP:600};w.spiel!.lager=[];await setzeSprache("en");
    const abstimmung=leseAbstimmung(eintrag)!;const verlauf=baueVerlauf(w,abstimmung)!;
    expect(abstimmung.name).toBe("Protect essential supplies");
    expect(verlauf.votum).toHaveLength(600);expect(verlauf.jaKum.at(-1)).toBe(abstimmung.ja);
    for (const f of erwartet) {expect(verlauf.jaJe[f.partei]).toBe(f.ja);expect(verlauf.lage.fraktionen.find(x=>x.partei===f.partei)!.sitze).toBe(f.sitze);}
    const k=load(save(w));expect(letzteAbstimmungen(k)[0]!.fraktionen).toEqual(erwartet);
  });
  test.each(["de","en","tr"] as const)("Gemeinsame UI übersetzt und ohne Zustandsänderung: %s",async lang=>{
    await setzeSprache(lang);const w=welt();beschliesseVersorgungsProgramm(w,"schutz");aendereVersorgungsVorlage(w,"schutz","sozial");const before=save(w);
    const html=renderToStaticMarkup(<><VersorgungsMandat world={w} programm="schutz" geaendert={()=>{}}/><VersorgungsTagesordnung world={w} geaendert={()=>{}}/></>);
    expect(html).not.toMatch(/⟦|mandat\.|\{(?:datum|partei|bip|ja|n|forderung)\}/);expect(html).toContain('type="checkbox"');expect(html).toContain('role="status"');expect(save(w)).toBe(before);
  });
});
