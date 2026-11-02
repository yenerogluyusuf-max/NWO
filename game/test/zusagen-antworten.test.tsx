import { afterEach, describe, expect, test } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createWorld, save, load } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { schnellProfil, startAfterElection } from "../src/sim/prolog";
import { ansicht, entscheide, oeffne, wirkungsVorschau, standardAntwort, ereignisTag } from "../src/sim/ereignisse";
import { PARTNER_RESSORTS } from "../src/sim/ressortvergabe";
import { aktiveParteivorsitzende, regierungsSitze } from "../src/sim/koalitionslage";
import { fraktion } from "../src/sim/fraktionen";
import { Rng } from "../src/sim/rng";
import { setzeSprache, t, zahl } from "../src/i18n";
import { stufeIn } from "../src/sim/handeln";
import { verfassungVon } from "../src/sim/aufmerksamkeit";
import { ministerVorlagen, ministerflussSchluessel, entscheideVorlage } from "../src/sim/ministerfluss";
import { addDays, formatDateDe } from "../src/sim/dates";
import { spielTick } from "../src/sim/spiel";
import { nationalAverage } from "../src/sim/netz";
import { NET } from "../src/sim/modell";
import { EreignisFenster } from "../src/ui/EreignisFenster";
import type { World } from "../src/sim/types";
import type { Zusage } from "../src/sim/spiel-typen";

function welt(){
 const w=createWorld(turkey2026,17);startAfterElection(w,{...schnellProfil(),buendnis:"YENİ"});
 w.date="2028-06-25";w.day=0;w.spiel!.start.datum=w.date;
 w.spiel!.ereignisse=[];w.spiel!.zusagen=[];w.spiel!.gesetze=[];w.spiel!.kapital=100;
 w.parliament!.seats={[w.player!.partei.kurz]:200,"YENİ":120,CHP:200,MHP:50,DEM:30};
 fraktion(w,"YENİ").bereitschaft=60;chef(w).loyalitaet=30;return w;
}
const chef=(w:World)=>aktiveParteivorsitzende(w,"YENİ")[0]!;
function erinnerung(w:World,extra:Partial<Zusage>={}){
 const z:Zusage={id:`z-antwort-${w.spiel!.zusagen.length}`,von:"YENİ",text:"Verbindliche Zusage",faellig:w.day,erfuellt:false,gebrochen:false,...extra};
 w.spiel!.zusagen.push(z);const e=oeffne(w,"zusage",new Rng(3),{provinzen:[],staerke:1,daten:{zusage:z.id}})!;return {z,e};
}
afterEach(async()=>{await setzeSprache("de");});
describe("Echte Zusagenantworten im Ereignisfenster",()=>{
 test("eine unmögliche Ressortvergabe bucht weder Preis noch Abschluss",()=>{
  const w=welt(),{e}=erinnerung(w,{text:"Zwei Ministerien zugesagt"});
  for(const f of w.spiel!.figuren)if(PARTNER_RESSORTS.includes(f.amt))f.partei="YENİ";
  ansicht(w,e);const stand=save(w);
  expect(entscheide(w,e.id,"erfuellen",new Rng(4)).ok).toBe(false);expect(save(w)).toBe(stand);
 });
 test.each(["vertroesten","brechen"])("%s darf eine bereits verschobene Alt-Erinnerung nicht erneut entscheiden",art=>{
  const w=welt(),{z,e}=erinnerung(w);z.faellig=w.day+90;ansicht(w,e);const stand=save(w);
  expect(entscheide(w,e.id,art,new Rng(4)).ok).toBe(false);expect(save(w)).toBe(stand);
 });
 test.each([
  ["erfuellen",4,42,70,0], ["vertroesten",1,22,60,4], ["brechen",0,5,35,20],
 ] as const)("%s zeigt und bucht Preis, Fraktionsbereitschaft und Vorsitzfolge genau einmal",(art,preis,loy,bereit,groll)=>{
  const w=welt(),{z,e}=erinnerung(w),andere=erinnerung(w);andere.e.frist=5;
  const grollVor=chef(w).eigen?.groll??0,stand=save(w),a=ansicht(w,e),o=a.optionen.find(o=>o.id===art)!;
  expect(save(w)).toBe(stand);expect(o.anzeigePk).toBe(preis);expect(o.sperre).toBeUndefined();
  expect(o.vorschau).toContain(t("ze.person",{name:chef(w).name,vor:zahl(30,2),nach:zahl(loy,2),groll:groll?`+${zahl(groll,2)}`:zahl(0,2)}));
  expect(o.vorschau).toContain(t("ze.bereitschaft",{partei:"YENİ",vor:zahl(60,2),nach:zahl(bereit,2)}));
  const chronik=w.spiel!.chronik.length;
  const vertrauen=nationalAverage(NET,w.net,"vertrauen_regierung"),legitimitaet=nationalAverage(NET,w.net,"legitimitaet");
  expect(entscheide(w,e.id,art,new Rng(4)).ok).toBe(true);
  expect(w.spiel!.kapital).toBe(100-preis);expect(chef(w).loyalitaet).toBe(loy);expect(chef(w).eigen!.groll).toBe(grollVor+groll);
  expect(fraktion(w,"YENİ").bereitschaft).toBe(bereit);expect(w.spiel!.chronik.length).toBe(chronik+1);
  const vorzeichen=(n:number)=>`${n>0?"+":""}${zahl(n,2)}`;
  expect(o.vorschau).toContain(t("ze.vertrauen",{vertrauen:vorzeichen(nationalAverage(NET,w.net,"vertrauen_regierung")-vertrauen),legitimitaet:vorzeichen(nationalAverage(NET,w.net,"legitimitaet")-legitimitaet)}));
  expect(w.spiel!.ereignisse).toEqual([andere.e]);
  if(art==="vertroesten"){
   expect(z.faellig).toBe(90);expect(z.erfuellt).toBe(false);expect(o.bedingungen!.join(" ")).toContain(formatDateDe(addDays(w.date,90)));
   expect(o.bedingungen!.join(" ")).toContain(t("zd.summe",{n:1,datum:formatDateDe("2028-07-01"),vor:zahl(22,2),nach:zahl(7,2)}));
   expect(o.warnung).toContain(t("zd.bruch",{sitze:120,rest:200}));
  }
  const danach=save(w);expect(entscheide(w,e.id,art,new Rng(4)).ok).toBe(false);expect(save(w)).toBe(danach);
 });
 test("Ressortantwort zeigt die beiden wirklichen Personalwechsel und den gesamten Vorsitzgewinn",()=>{
  const w=welt(),{e}=erinnerung(w,{text:"Zwei Ministerien zugesagt"});
  const alt=w.spiel!.figuren.filter(f=>["wirtschaft","justiz"].includes(f.amt)).map(f=>({id:f.id,name:f.name}));
  const o=ansicht(w,e).optionen.find(o=>o.id==="erfuellen")!;
  expect(entscheide(w,e.id,"erfuellen",new Rng(4)).ok).toBe(true);expect(chef(w).loyalitaet).toBe(58);expect(w.spiel!.kapital).toBe(96);
  for(const f of alt){const neu=w.spiel!.figuren.find(x=>x.id===f.id)!;expect(neu.partei).toBe("YENİ");expect(neu.name).not.toBe(f.name);expect(o.vorschau.join(" ")).toContain(`${f.name} → ${neu.name}`);}
  expect(o.vorschau.join(" ")).toContain(`${zahl(30,2)} → ${zahl(58,2)}`);
 });
 test("Vorschau begrenzt die persönliche Anerkennung auf den tatsächlich möglichen Wert",()=>{
  const w=welt(),{e}=erinnerung(w);chef(w).loyalitaet=95;
  const o=ansicht(w,e).optionen.find(o=>o.id==="erfuellen")!;
  expect(o.vorschau.join(" ")).toContain(`${zahl(95,2)} → ${zahl(100,2)}`);
  entscheide(w,e.id,"erfuellen",new Rng(4));expect(chef(w).loyalitaet).toBe(100);
 });
 test("zweimal vertröstete Zusage bleibt mit erklärter Sperre sichtbar und bezahlt nichts mehr",()=>{
  const w=welt(),{e}=erinnerung(w,{vertroestet:2}),a=ansicht(w,e),stand=save(w);
  expect(a.optionen.find(o=>o.id==="vertroesten")!.sperre).toBe(t("sim2.sim.zusagen.fe9241f"));
  expect(entscheide(w,e.id,"vertroesten",new Rng(4)).ok).toBe(false);expect(save(w)).toBe(stand);
 });
 test.each(["erfuellt","gebrochen","abgeschlossen","entfernt","verschoben"] as const)("überholte Erinnerung (%s) kann keine Zusagenantwort mehr buchen",art=>{
  const w=welt(),{z,e}=erinnerung(w);
  if(art==="entfernt")w.spiel!.zusagen=[];else if(art==="verschoben")z.faellig=90;else if(art==="abgeschlossen")z.abgeschlossen=0;else z[art]=true;
  ansicht(w,e);const stand=save(w);
  for(const id of ["erfuellen","vertroesten","brechen"])expect(entscheide(w,e.id,id,new Rng(4)).ok).toBe(false);
  expect(save(w)).toBe(stand);expect(standardAntwort(w,e)).toBe("aussitzen");
  expect(entscheide(w,e.id,"aussitzen",new Rng(4)).ok).toBe(true);expect(chef(w).loyalitaet).toBe(30);expect(w.spiel!.kapital).toBe(100);
  if(art==="verschoben")expect(z.gebrochen).toBe(false);
 });
 test("Gesetzeseinbringung zeigt echte Aufmerksamkeit und Preis, gibt aber keinen Erfüllungsbonus",()=>{
  const w=welt(),start=Math.round(stufeIn(w,"m_renten",null));verfassungVon(w).belastung=0;
  const {z,e}=erinnerung(w,{massnahme:"m_renten",richtung:1,stufeStart:start,stufeZiel:start+20});
  const auf=verfassungVon(w).aufmerksamkeit,o=ansicht(w,e).optionen.find(o=>o.id==="erfuellen")!;
  const v=ministerVorlagen(w,{tiefe:0}).find(v=>v.thema===`ereignis:${e.id}`)!;
  expect(v.optionen.find(o=>o.id==="erfuellen")!.kosten).toEqual({pk:o.anzeigePk,aufmerksamkeit:o.aufmerksamkeit});
  expect(o.aufmerksamkeit).toBeGreaterThan(0);expect(o.bedingungen).toContain(t("zusage.gesetz.belohnung"));
  expect(entscheideVorlage(w,v.id,"erfuellen").ok).toBe(true);
  expect(w.spiel!.kapital).toBe(100-o.anzeigePk!);expect(verfassungVon(w).aufmerksamkeit).toBe(auf-o.aufmerksamkeit!);
  expect(z.erfuellt).toBe(false);expect(chef(w).loyalitaet).toBe(30);expect(z.faellig).toBe(w.spiel!.gesetze[0]!.abstimmung+15);
 });
 test("schon beschlossenes Landesziel wird ohne neues Gesetz und ohne Preis verbucht",()=>{
  const w=welt(),start=Math.round(stufeIn(w,"m_renten",null)),{z,e}=erinnerung(w,{massnahme:"m_renten",richtung:1,stufeStart:start-20,stufeZiel:start});
  const o=ansicht(w,e).optionen.find(o=>o.id==="erfuellen")!;expect(o.anzeigePk).toBe(0);expect(o.label).toBe(t("zusage.gesetz.verbuchen"));
  expect(entscheide(w,e.id,"erfuellen",new Rng(4)).ok).toBe(true);expect(z.erfuellt).toBe(true);expect(chef(w).loyalitaet).toBe(42);expect(w.spiel!.gesetze).toHaveLength(0);
 });
 test("Vorschau bleibt bei gleicher Ereigniskennung in verschiedenen Welten und am selben Tag aktuell",()=>{
  const w=welt(),{e}=erinnerung(w),zweite=load(save(w));chef(zweite).loyalitaet=95;
  expect(wirkungsVorschau(w,e,"erfuellen").join(" ")).toContain(`${zahl(30,2)} → ${zahl(42,2)}`);
  expect(wirkungsVorschau(zweite,e,"erfuellen").join(" ")).toContain(`${zahl(95,2)} → ${zahl(100,2)}`);
  chef(w).loyalitaet=28;
  expect(wirkungsVorschau(w,e,"vertroesten").join(" ")).toContain(`${zahl(28,2)} → ${zahl(20,2)}`);
 });
 test("nach Vorschau weggefallenes Kapital sperrt den Klick und der Hinweis nennt den tatsächlichen Preis",()=>{
  const w=welt(),{e}=erinnerung(w);expect(ansicht(w,e).optionen.find(o=>o.id==="erfuellen")!.sperre).toBeUndefined();
  w.spiel!.kapital=-20;const a=ansicht(w,e),stand=save(w);
  expect(entscheide(w,e.id,"erfuellen",new Rng(4)).ok).toBe(false);expect(save(w)).toBe(stand);
  const html=renderToStaticMarkup(<EreignisFenster ansicht={a} datum={w.date} kapital={-20} onWaehle={()=>{}} onSpaeter={()=>{}}/>);
  expect(html).toContain(t("ereignis.knapp",{kapital:-20}));expect(html).toContain(t("ereignis.preis",{n:4}));
 });
 test("Ministermappe aktualisiert auch eine Überziehung innerhalb desselben gerundeten Kapitalwerts",()=>{
  const w=welt(),{e}=erinnerung(w);w.spiel!.kapital=-15.2;
  const option=()=>ministerVorlagen(w,{tiefe:0}).find(v=>v.thema===`ereignis:${e.id}`)!.optionen.find(o=>o.id==="erfuellen")!;
  expect(option().text).toContain(t("vn.aufPump",{n:zahl(-19.2,1)}));w.spiel!.kapital=-15.8;
  expect(option().text).toContain(t("vn.aufPump",{n:zahl(-19.8,1)}));
 });
 test("Ministermappe erneuert exakte Bruchschwelle, weitere Fristen und Ressortverfügbarkeit am selben Tag",()=>{
  const w=welt(),{e}=erinnerung(w,{text:"Zwei Ministerien zugesagt"}),andere=erinnerung(w);andere.e.frist=10;
  chef(w).loyalitaet=28.0001;
  const option=()=>ministerVorlagen(w,{tiefe:0}).find(v=>v.thema===`ereignis:${e.id}`)!.optionen.find(o=>o.id==="vertroesten")!;
  const vor=option();expect(vor.text).not.toContain("unter 20");const key=ministerflussSchluessel(w);
  chef(w).loyalitaet=27.9999;expect(ministerflussSchluessel(w)).not.toBe(key);expect(option().text).toContain("unter 20");
  andere.e.frist=5;expect(option().text).toContain(t("zd.bruch",{sitze:120,rest:200}));
  for(const f of w.spiel!.figuren)if(PARTNER_RESSORTS.includes(f.amt))f.partei="YENİ";
  expect(ministerVorlagen(w,{tiefe:0}).find(v=>v.thema===`ereignis:${e.id}`)!.optionen.find(o=>o.id==="erfuellen")!.moeglich).toBe(false);
 });
 test("ausdrücklicher Bruch und unbeantworteter Verfall haben unterschiedliche echte Monatsfolgen",()=>{
  const w=welt(),{e}=erinnerung(w);chef(w).loyalitaet=38;e.frist=5;const verfall=load(save(w));
  const o=ansicht(w,e).optionen.find(o=>o.id==="brechen")!;expect(o.warnung).toContain("120");expect(o.warnung).toContain("200");
  expect(entscheide(w,e.id,"brechen",new Rng(4)).ok).toBe(true);expect(chef(w).loyalitaet).toBe(13);
  verfall.day=5;verfall.date="2028-06-30";ereignisTag(verfall,new Rng(19));expect(chef(verfall).loyalitaet).toBe(23);
  for(const x of [w,verfall]){x.day=6;x.date="2028-07-01";spielTick(x,new Rng(19));}
  expect(regierungsSitze(w)).toBe(200);expect(regierungsSitze(verfall)).toBe(320);
 });
 test.each(["de","en","tr"] as const)("Antwortkarten zeigen vor dem Klick Frist, genaue Folgen und verbleibendes Risiko auf %s",async lang=>{
  await setzeSprache(lang);const w=welt(),{e}=erinnerung(w),andere=erinnerung(w);andere.e.frist=5;
  const a=ansicht(w,e),stand=save(w),html=renderToStaticMarkup(<EreignisFenster ansicht={a} datum={w.date} kapital={100} onWaehle={()=>{}} onSpaeter={()=>{}}/>);
  for(const o of a.optionen)for(const s of [...(o.bedingungen??[]),...o.vorschau,...(o.warnung?[o.warnung]:[])])expect(html).toContain(s);
  expect(html).not.toContain("⟦");expect(html).not.toMatch(/\{(?:wer|vor|nach|datum|sitze)\}/);expect(save(w)).toBe(stand);
 });
});
