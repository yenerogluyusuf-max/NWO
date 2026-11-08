import { afterEach, describe, expect, test } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createWorld, load, save } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { schnellProfil, startAfterElection } from "../src/sim/prolog";
import { aussenZustand } from "../src/sim/diplomatie";
import { fraktion } from "../src/sim/fraktionen";
import { gueterSicht, gueterMonat } from "../src/sim/gueter";
import { addDays } from "../src/sim/dates";
import { beschliesseVersorgungsProgramm, aendereVersorgungsVorlage, versorgungsParlamentTag } from "../src/sim/versorgungspolitik";
import { versorgungsNachsorge, versorgungsStabilisierungsPlan, stabilisiereVersorgungsKoalition, oeffneVersorgungsNachsorge, type Stabilisierung } from "../src/sim/versorgungsnachsorge";
import { aktiverKoalitionsVorsitz, drohtKoalitionsbruch, regierungsSitze } from "../src/sim/koalitionslage";
import { eigenVon } from "../src/sim/personen";
import { nationalAverage } from "../src/sim/netz";
import { NET } from "../src/sim/modell";
import { spielTick } from "../src/sim/spiel";
import { Rng } from "../src/sim/rng";
import { VersorgungsMandat, VersorgungsTagesordnung } from "../src/ui/gueter/VersorgungsMandat";
import { setzeSprache, t, katalogVon, platzhalter } from "../src/i18n";
import type { World } from "../src/sim/types";

function welt(klauseln:("sozial"|"kontrolle"|"zivil")[]=["sozial"]) {
  const w=createWorld(turkey2026,17);startAfterElection(w,schnellProfil());
  w.spiel!.ereignisse=[];w.spiel!.kapital=150;w.spiel!.lager=["YENİ"];
  w.parliament!.seats={[w.player!.partei.kurz]:130,"YENİ":120,CHP:200,MHP:80,DEM:70};
  for(const p of Object.keys(w.parliament!.seats)) fraktion(w,p).bereitschaft=50;
  aussenZustand(w).energie.hormus="offen";gueterSicht(w);
  const chef=w.spiel!.figuren.find(f=>f.amt==="partner"&&f.partei==="YENİ")!;chef.loyalitaet=23;
  beschliesseVersorgungsProgramm(w,"schutz");for(const k of klauseln) aendereVersorgungsVorlage(w,"schutz",k);
  zeit(w,7);versorgungsParlamentTag(w);return w;
}
const v=(w:World)=>w.spiel!.gueter!.regierung!.vorlagen!.schutz!;
const chef=(w:World)=>w.spiel!.figuren.find(f=>f.amt==="partner"&&f.partei==="YENİ")!;
function zeit(w:World,n:number){w.day+=n;w.date=addDays(w.date,n);}
const plan=(w:World,art:Stabilisierung="fraktion")=>versorgungsStabilisierungsPlan(w,"schutz","YENİ",art)!;
const s=(w:World)=>versorgungsNachsorge(w,"schutz")!;
afterEach(async()=>{await setzeSprache("de");});

describe("Nach dem Versorgungsvotum",()=>{
  test("Beschluss speichert Budget und Laufzeit, benennt offene Forderung und tatsächliche Kosten",()=>{
    const w=welt(),n=s(w),stand=save(w);
    expect(v(w).status).toBe("angenommen");expect(v(w).beschluss).toEqual({ab:w.day,bis:w.day+90,bip:0.07});
    expect(n.pflichten[0]).toMatchObject({klausel:"sozial",status:"verbindlich",parteien:["CHP"]});
    expect(n.unzufrieden.find(f=>f.partei==="YENİ")).toMatchObject({forderung:"haushalt",konflikt:"sozial",reaktion:{bereitschaft:-4}});
    expect(n.partner[0]).toMatchObject({loyalitaet:19,risiko:"akut",sitze:120,ohne:130});
    expect(n.sitze).toBe(250);expect(n.pruefung).toMatch(/-01$/);expect(save(w)).toBe(stand);
  });
  test("jüngste Nachsorge öffnet nach dem Votum und bei akuter Gefahr, ohne alle alten Vorlagen aufzuklappen",()=>{
    const w=welt();expect(oeffneVersorgungsNachsorge(w,"schutz")).toBe(true);
    zeit(w,4);expect(oeffneVersorgungsNachsorge(w,"schutz")).toBe(true);
    chef(w).loyalitaet=50;expect(oeffneVersorgungsNachsorge(w,"schutz")).toBe(false);
    const n=structuredClone(v(w));n.id="neuer-beschluss";n.programm="energie";n.erledigt=w.day;
    w.spiel!.gueter!.regierung!.vorlagen!.energie=n;
    expect(oeffneVersorgungsNachsorge(w,"energie")).toBe(true);expect(oeffneVersorgungsNachsorge(w,"schutz")).toBe(false);
  });
  test("abgelehnte Vorlage begründet Verstimmung, erzeugt aber keine Bindung",()=>{
    const w=welt([]),n=s(w);expect(v(w).status).toBe("abgelehnt");expect(n.beschluss).toBeUndefined();
    expect(n.pflichten).toEqual([]);expect(n.phase).toBe("keinAuftrag");
    expect(n.unzufrieden.map(f=>f.partei)).toEqual(["YENİ"]);expect(n.unzufrieden[0]!.reaktion!.bereitschaft).toBe(-2);
    expect(plan(w).moeglich).toBe(true);
  });
  test("Zivilgarantie bindet bereits in der Vorbereitung; Kontrolle beginnt mit dem Auftrag",()=>{
    const w=welt(["sozial","kontrolle","zivil"]),n=s(w);expect(n.phase).toBe("vorbereitung");
    expect(n.pflichten.find(p=>p.klausel==="zivil")).toMatchObject({ab:w.day,status:"verbindlich"});
    expect(n.pflichten.find(p=>p.klausel==="kontrolle")).toMatchObject({ab:w.day+7,status:"vorbereitung"});
    w.spiel!.gueter!.prioritaet="militaer";
    expect(s(w).pflichten.find(p=>p.klausel==="zivil")!.status).toBe("abweichend");
  });
  test("reguläres Ende ist kein Zusagenbruch und fehlender Auftrag wird nicht als erfüllt ausgegeben",()=>{
    const w=welt();delete w.spiel!.gueter!.regierung!.programme.schutz;
    expect(s(w).phase).toBe("fehlt");expect(s(w).pflichten[0]!.status).toBe("abweichend");
    zeit(w,90);expect(s(w).phase).toBe("beendet");expect(s(w).pflichten[0]!.status).toBe("beendet");
  });
  test("alte Spielstände ohne Beschlusssnapshot behalten nachvollziehbare Bedingungen",()=>{
    const w=welt(),alt=s(w);delete v(w).beschluss;delete w.spiel!.gueter!.regierung!.programme.schutz!.vorlage;
    const stand=save(w);expect(s(w).beschluss).toEqual(alt.beschluss);expect(s(w).phase).toBe("aktiv");expect(save(w)).toBe(stand);
  });
  test("aktueller Monatsbeleg gehört zum konkreten Auftrag, nicht zu einer alten gleichnamigen Maßnahme",()=>{
    const w=welt();expect(s(w).bericht).toBeUndefined();gueterMonat(w);
    expect(s(w).bericht?.monat).toBe(w.date.slice(0,7));
    v(w).beschluss!.ab++;expect(s(w).bericht).toBeUndefined();
  });
  test("aktuelle Sanktion wird nach beschlossenem Energieabkommen als Vollzugshindernis gezeigt",()=>{
    const w=welt();w.parliament!.seats={[w.player!.partei.kurz]:600};
    expect(beschliesseVersorgungsProgramm(w,"energie","AZE").ok).toBe(true);zeit(w,7);versorgungsParlamentTag(w);zeit(w,30);
    aussenZustand(w).eigeneSanktionen=["AZE"];
    expect(versorgungsNachsorge(w,"energie")!.hindernis?.k).toBe("regierung.partnerGesperrt");
  });
  test("historische Verstimmung bleibt nach Koalitionswechsel richtig; Rückkehr braucht ein neues Bündnis",()=>{
    const w=welt(),reaktionen=structuredClone(v(w).reaktionen);w.spiel!.lager=[];
    expect(s(w).unzufrieden.find(f=>f.partei==="YENİ")!.jetztKoalition).toBe(false);
    expect(s(w).partner).toEqual([]);expect(plan(w)).toBeUndefined();expect(v(w).reaktionen).toEqual(reaktionen);
  });
  test("Risiko verwendet echte aktive Vorsitzende und zählt Sitze ohne Doppelzählung",()=>{
    const w=welt();w.spiel!.lager.push(w.player!.partei.kurz,"YENİ");expect(regierungsSitze(w)).toBe(250);
    expect(drohtKoalitionsbruch(w,chef(w))).toBe(true);chef(w).loyalitaet=20;expect(drohtKoalitionsbruch(w,chef(w))).toBe(false);
    chef(w).imAmt=false;chef(w).loyalitaet=0;expect(aktiverKoalitionsVorsitz(w,chef(w))).toBe(false);
    expect(drohtKoalitionsbruch(w,chef(w))).toBe(false);expect(s(w).partner[0]!.risiko).toBe("unbekannt");
  });
  test.each(["fraktion","vertrauen","rueckendeckung"] as const)("%s nutzt die echte Aktion: Vorschau, Preis und gebuchte Personenfolgen stimmen",art=>{
    const w=welt(),c=chef(w),e=eigenVon(w,c);e.groll=44;e.ehrgeiz=60;e.stil="nuechtern";
    const stand=save(w),a=plan(w,art),kapital=w.spiel!.kapital,bereit=fraktion(w,"YENİ").bereitschaft,altVertrauen=nationalAverage(NET,w.net,"vertrauen_regierung");
    expect(a.moeglich).toBe(true);expect(save(w)).toBe(stand);
    expect(stabilisiereVersorgungsKoalition(w,a).ok).toBe(true);
    expect(w.spiel!.kapital).toBe(kapital-a.pk);expect(fraktion(w,"YENİ").bereitschaft-bereit).toBe(a.bereitschaft);
    for(const p of a.personen) expect(w.spiel!.figuren.find(f=>f.id===p.id)!.loyalitaet).toBe(p.nachher);
    expect(nationalAverage(NET,w.net,"vertrauen_regierung")-altVertrauen).toBeCloseTo(a.vertrauen);
    expect(v(w).nachsorge!.at(-1)).toMatchObject({art,pk:a.pk,personen:a.personen,bereitschaft:a.bereitschaft,vertrauen:a.vertrauen});
    expect(s(w).partner[0]!.loyalitaet).toBe(c.loyalitaet);
  });
  test("Fraktionsgespräch stärkt den Vorsitz statt eines vorher einsortierten Ministers",()=>{
    const w=welt();const minister=w.spiel!.figuren.find(f=>f.amt==="wirtschaft")!;minister.partei="YENİ";minister.loyalitaet=40;
    const a=plan(w);expect(a.personen.map(f=>f.id)).toContain(chef(w).id);expect(a.personen.map(f=>f.id)).not.toContain(minister.id);
    stabilisiereVersorgungsKoalition(w,a);expect(chef(w).loyalitaet).toBe(24);expect(minister.loyalitaet).toBe(40);
  });
  test("Rückendeckung zeigt auch Mitbegünstigte und Vertrauenspreis, ohne vorhandene Zusagen zu ändern",()=>{
    const w=welt(),c=chef(w),e=eigenVon(w,c);e.groll=30;
    const minister=w.spiel!.figuren.find(f=>f.amt==="wirtschaft")!;eigenVon(w,minister).lager=e.lager;minister.loyalitaet=99;
    const alt=structuredClone(v(w).beschluss),klauseln=[...v(w).klauseln],a=plan(w,"rueckendeckung");
    expect(a.personen.find(f=>f.id===minister.id)).toMatchObject({vorher:99,nachher:100});expect(a.vertrauen).toBeCloseTo(-0.1);
    stabilisiereVersorgungsKoalition(w,a);expect(v(w).beschluss).toEqual(alt);expect(v(w).klauseln).toEqual(klauseln);
  });
  test("bei Loyalität null reicht ein einzelnes Gespräch nicht; Oberfläche behauptet keine Rettung",()=>{
    const w=welt();chef(w).loyalitaet=0;
    const html=renderToStaticMarkup(<VersorgungsMandat world={w} programm="schutz" geaendert={()=>{}}/>);
    expect(html).toContain(t("vn.bleibtAkut"));expect(plan(w).personen.find(f=>f.id===chef(w).id)!.nachher).toBe(5);
  });
  test("keine wiederholbare Gratisloyalität: Sperre gilt auch über eine zweite Vorlage hinweg",()=>{
    const w=welt(),a=plan(w);stabilisiereVersorgungsKoalition(w,a);const stand=save(w);
    expect(stabilisiereVersorgungsKoalition(w,a).ok).toBe(false);expect(save(w)).toBe(stand);expect(plan(w).moeglich).toBe(false);
    const zweite=structuredClone(v(w));zweite.programm="energie";zweite.id="zweite";w.spiel!.gueter!.regierung!.vorlagen!.energie=zweite;
    expect(versorgungsStabilisierungsPlan(w,"energie","YENİ","fraktion")!.moeglich).toBe(false);
    zeit(w,30);expect(plan(w).moeglich).toBe(true);
  });
  test("persönliche Termine teilen ihre Sperre, Fraktionsgespräch bleibt eine eigene Handlung",()=>{
    const w=welt();expect(stabilisiereVersorgungsKoalition(w,plan(w,"vertrauen")).ok).toBe(true);
    expect(plan(w,"rueckendeckung").moeglich).toBe(false);expect(plan(w).moeglich).toBe(true);
    zeit(w,21);chef(w).loyalitaet=30;expect(plan(w,"rueckendeckung").moeglich).toBe(true);
  });
  test.each(["kapital","loyalitaet","tag","ausgetreten","vorlage","pause"] as const)("veralteter Stabilisierungsplan bei %s bucht nichts",was=>{
    const w=welt(),a=plan(w);
    if(was==="kapital")w.spiel!.kapital=0;
    if(was==="loyalitaet")chef(w).loyalitaet=5;
    if(was==="tag")zeit(w,1);
    if(was==="ausgetreten")w.spiel!.lager=[];
    if(was==="vorlage")v(w).status="offen";
    if(was==="pause")w.spiel!.verfassung!.pauseBis=w.day+3;
    const stand=save(w);expect(stabilisiereVersorgungsKoalition(w,a).ok).toBe(false);expect(save(w)).toBe(stand);
  });
  test("ausgeschöpfte Kapitalüberziehung und vier Termine zeigen echte Hindernisse",()=>{
    const w=welt();w.spiel!.kapital=-20;const stand=save(w);expect(plan(w).moeglich).toBe(false);expect(plan(w,"vertrauen").moeglich).toBe(false);expect(save(w)).toBe(stand);
    w.spiel!.kapital=20;w.spiel!.termine=[w.day,w.day,w.day,w.day];expect(plan(w,"vertrauen").moeglich).toBe(false);
  });
  test("Kapital auf Kredit und knappe Aufmerksamkeit sind vor dem Eingriff sichtbar",()=>{
    const w=welt();w.spiel!.kapital=0;w.spiel!.verfassung!.aufmerksamkeit=20;
    const a=plan(w);expect(a.moeglich).toBe(true);expect(a.kapitalDanach).toBe(-1);expect(a.aufmerksamkeitDanach).toBe(18);
    const html=renderToStaticMarkup(<VersorgungsMandat world={w} programm="schutz" geaendert={()=>{}}/>);
    expect(html).toContain(t("vn.aufPump",{n:"-1,0"}));expect(html).toContain(t("vn.erschoepfung",{n:"18"}));
    stabilisiereVersorgungsKoalition(w,a);expect(w.spiel!.kapital).toBe(-1);expect(w.spiel!.verfassung!.aufmerksamkeit).toBe(18);
  });
  test("tatsächlicher Monatswechsel: Gespräch verhindert den sonst eintretenden Koalitionsbruch",()=>{
    const w=welt();chef(w).loyalitaet=17;w.spiel!.zusagen=[];
    const ohne=load(save(w));expect(stabilisiereVersorgungsKoalition(w,plan(w)).ok).toBe(true);
    for(const k of [w,ohne]) {
      const ziel=s(k).pruefung;let tage=0;while(addDays(k.date,tage)!==ziel)tage++;
      zeit(k,tage);spielTick(k,new Rng(19));
    }
    expect(ohne.spiel!.lager).not.toContain("YENİ");expect(w.spiel!.lager).toContain("YENİ");
  });
  test("inaktiver früherer Vorsitz verursacht beim Monatswechsel keinen Bruch",()=>{
    const w=welt();chef(w).loyalitaet=60;
    w.spiel!.figuren.push({...chef(w),id:"alter-vorsitz",name:"Ehemaliger",imAmt:false,loyalitaet:0});
    const ziel=s(w).pruefung;let tage=0;while(addDays(w.date,tage)!==ziel)tage++;zeit(w,tage);spielTick(w,new Rng(19));
    expect(w.spiel!.lager).toContain("YENİ");
  });
  test("beide Ansichten und Laden bewahren Buchungen; reine Anzeige verändert keine alten Profile",()=>{
    const w=welt();for(const f of w.spiel!.figuren)delete f.eigen;delete w.spiel!.fraktionen;
    const stand=save(w);const html=renderToStaticMarkup(<VersorgungsTagesordnung world={w} geaendert={()=>{}}/>);
    expect(html).toContain(t("vn.titel"));expect(html).toContain(t("vn.zusammenhalten"));expect(save(w)).toBe(stand);
    const a=plan(w);stabilisiereVersorgungsKoalition(w,a);const k=load(save(w));expect(v(k).nachsorge).toEqual(v(w).nachsorge);expect(s(k).beschluss).toEqual(s(w).beschluss);
    const akte=renderToStaticMarkup(<VersorgungsMandat world={k} programm="schutz" geaendert={()=>{}}/>);expect(akte).toContain(t("vn.protokoll"));
  });
  test.each(["de","en","tr"] as const)("Nachsorge ist in %s vollständig beschriftet",async sprache=>{
    await setzeSprache(sprache);const w=welt();
    const html=renderToStaticMarkup(<VersorgungsMandat world={w} programm="schutz" geaendert={()=>{}}/>);
    expect(html).toContain(t("vn.titel"));expect(html).not.toContain("⟦");expect(html).not.toContain("NaN");
    expect(html).not.toMatch(/\{(?:datum|n|grenze|rest|pk)\}/);
    for(const key of Object.keys(katalogVon("de")).filter(k=>k.startsWith("vn."))) {
      expect(katalogVon(sprache)[key]).toBeDefined();expect(platzhalter(katalogVon(sprache)[key]!)).toEqual(platzhalter(katalogVon("de")[key]!));
    }
  });
});
