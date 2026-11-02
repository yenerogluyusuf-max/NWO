import { afterEach, describe, expect, test } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createWorld, save, load } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { schnellProfil, startAfterElection } from "../src/sim/prolog";
import { entscheideVorlage, flussZustand, ministerVorlagen, pflegeVorlagen, schreibtischMappe, vertageVorlage } from "../src/sim/ministerfluss";
import { loeseEin, vertroesteFrei, brecheFrei } from "../src/sim/zusagen";
import { setzeSprache, t, rendere } from "../src/i18n";
import { addDays, formatDateDe } from "../src/sim/dates";
import { bringeEin, gesetzeAbstimmen, stufeIn } from "../src/sim/handeln";
import { verfassungVon } from "../src/sim/aufmerksamkeit";
import { Rng } from "../src/sim/rng";
import { VorlagenRueckblick } from "../src/ui/minister/VorlagenRueckblick";
import { Mappe } from "../src/ui/minister/Mappe";
import { zusagenMappenStand, istVerfallen } from "../src/sim/ministerfluss-zusagen";
import type { World } from "../src/sim/types";
import type { Zusage } from "../src/sim/spiel-typen";

function welt(){
 const w=createWorld(turkey2026,17);startAfterElection(w,{...schnellProfil(),buendnis:"YENİ"});
 w.date="2028-06-25";w.day=0;w.spiel!.start.datum=w.date;w.spiel!.ereignisse=[];w.spiel!.zusagen=[];w.spiel!.gesetze=[];w.spiel!.kapital=100;
 const z:Zusage={id:"z-mappenfolge",von:"YENİ",text:"Zusage an den Partner",faellig:0,erfuellt:false,gebrochen:false};w.spiel!.zusagen.push(z);return w;
}
const zusage=(w:World)=>w.spiel!.zusagen[0]!;
const karte=(w:World)=>ministerVorlagen(w,{tiefe:0}).find(v=>v.thema===`zusage:${zusage(w).id}`);
function gesetz(w:World){const z=zusage(w),start=Math.round(stufeIn(w,"m_renten",null));Object.assign(z,{massnahme:"m_renten",richtung:1,stufeStart:start,stufeZiel:start+20});verfassungVon(w).belastung=0;return z;}
const tag=(w:World,n:number)=>{w.day=n;w.date=addDays(w.spiel!.start.datum,n);};
afterEach(async()=>{await setzeSprache("de");});
describe("Zusagen bleiben als Verpflichtungen in der Ministermappe erhalten",()=>{
 test("eine vertröstete Zusage wird bei der neuen Frist wieder vorgelegt",()=>{
  const w=welt(),v=karte(w)!;expect(v).toBeDefined();expect(entscheideVorlage(w,v.id,"vertroesten").ok).toBe(true);
  expect(karte(w)).toBeUndefined();w.day=76;w.date=addDays(w.spiel!.start.datum,w.day);
  expect(karte(w)).toBeDefined();
 });
 test("eine außerhalb der Mappe erfüllte Zusage erscheint nicht als verfallen",()=>{
  const w=welt(),v=karte(w)!;pflegeVorlagen(w);expect(flussZustand(w).gesehen[v.id]).toBeDefined();
  expect(loeseEin(w,zusage(w)).ok).toBe(true);pflegeVorlagen(w);
  const archiv=flussZustand(w).verfallen.find(x=>x.id===v.id);
  expect(archiv).toBeDefined();expect(archiv).toHaveProperty("zusage.status","erfuellt");
 });
 test("zwei Vertröstungen ergeben getrennte Arbeitsschritte und lassen die dritte Frist sichtbar",()=>{
  const w=welt(),erste=karte(w)!;expect(entscheideVorlage(w,erste.id,"vertroesten").ok).toBe(true);
  tag(w,76);const zweite=karte(w)!;expect(zweite.id).not.toBe(erste.id);expect(zweite.thema).toBe(erste.thema);
  expect(entscheideVorlage(w,zweite.id,"vertroesten").ok).toBe(true);expect(zusage(w).faellig).toBe(166);
  tag(w,152);const dritte=karte(w)!;expect(dritte).toBeDefined();expect(dritte.optionen.some(o=>o.id==="vertroesten")).toBe(false);
  expect(flussZustand(w).verfallen.map(x=>x.zusage?.status)).toEqual(["vertroestet","vertroestet"]);
  expect(w.spiel!.kapital).toBe(98);expect(zusage(w).erfuellt).toBe(false);
 });
 test("eine alte Karte kann die Zusage nach einer Friständerung nicht noch einmal bezahlen",()=>{
  const w=welt(),v=karte(w)!;vertroesteFrei(w,zusage(w));const stand=save(w);
  expect(entscheideVorlage(w,v.id,"einloesen").ok).toBe(false);expect(save(w)).toBe(stand);
 });
 test("erledigte Altkennungen verstecken offene Zusagen nach Speichern und Laden nicht mehr",()=>{
  const w=welt();zusage(w).faellig=90;zusage(w).vertroestet=1;
  flussZustand(w).erledigt[`zusage:${zusage(w).id}`]={tag:0,text:"Vertrösten"};
  const neu=load(save(w));tag(neu,76);expect(karte(neu)).toBeDefined();
  expect(neu.spiel!.kapital).toBe(100);expect(zusage(neu).erfuellt).toBe(false);
 });
 test.each([true,false])("ein echtes Votum (angenommen=%s) entscheidet über Erfüllung oder Wiedervorlage",angenommen=>{
  const w=welt(),z=gesetz(w),v=karte(w)!;
  expect(entscheideVorlage(w,v.id,"einloesen").ok).toBe(true);expect(z.erfuellt).toBe(false);expect(karte(w)).toBeUndefined();
  const protokoll=structuredClone(flussZustand(w).verfallen[0]!);expect(protokoll.zusage?.status).toBe("beratung");
  const g=w.spiel!.gesetze[0]!;g.absprachen=angenommen?600:-600;tag(w,g.abstimmung);
  expect(gesetzeAbstimmen(w,new Rng(4))[0]!.angenommen).toBe(angenommen);tag(w,z.faellig-14);pflegeVorlagen(w);
  expect(z.erfuellt).toBe(angenommen);expect(!!karte(w)).toBe(!angenommen);
  expect(flussZustand(w).verfallen[0]).toEqual(protokoll);
  const html=renderToStaticMarkup(<VorlagenRueckblick world={w} eintraege={flussZustand(w).verfallen}/>);
  expect(html).toContain(t("mzr.status.beratung"));expect(html).toContain(t(angenommen?"mzr.heute.erfuellt":"mzr.heute.offen",{datum:formatDateDe(addDays(w.date,z.faellig-w.day))}));
 });
 test.each(["erfuellen","vertroesten","brechen","entfernen"] as const)("anderer Zugangsweg %s erhält den zutreffenden Ausgang ohne Doppelbuchung",art=>{
  const w=welt(),v=karte(w)!;pflegeVorlagen(w);
  if(art==="erfuellen")loeseEin(w,zusage(w));else if(art==="vertroesten")vertroesteFrei(w,zusage(w));else if(art==="brechen")brecheFrei(w,zusage(w));else w.spiel!.zusagen=[];
  const kapital=w.spiel!.kapital,personen=structuredClone(w.spiel!.figuren);pflegeVorlagen(w);pflegeVorlagen(w);
  const r=flussZustand(w).verfallen.filter(x=>x.id===v.id);expect(r).toHaveLength(1);
  expect(r[0]!.zusage?.status).toBe({erfuellen:"erfuellt",vertroesten:"vertroestet",brechen:"gebrochen",entfernen:"entfallen"}[art]);
  expect(w.spiel!.kapital).toBe(kapital);expect(w.spiel!.figuren).toEqual(personen);
  expect(istVerfallen(r[0]!)).toBe(art==="brechen");
 });
 test("normal eingebrachtes Gesetz erscheint als Beratung, nicht als verlorene Zusage",()=>{
  const w=welt(),z=gesetz(w);pflegeVorlagen(w);
  expect(bringeEin(w,z.massnahme!,z.stufeZiel!,null,"gesetz").ok).toBe(true);pflegeVorlagen(w);
  const r=flussZustand(w).verfallen.find(x=>x.zusage?.id===z.id)!;
  expect(r.zusage!.status).toBe("beratung");expect(r.zusage!.abstimmung).toBe(addDays(w.date,w.spiel!.gesetze[0]!.abstimmung));
  expect(r.zusage!.faellig).toBe(addDays(w.date,z.faellig));expect(z.erfuellt).toBe(false);
 });
 test("direkte Entscheidung und spätere Mappenpflege erzeugen nur einen Rückblick",()=>{
  const w=welt(),v=karte(w)!;pflegeVorlagen(w);expect(entscheideVorlage(w,v.id,"einloesen").ok).toBe(true);
  pflegeVorlagen(w);pflegeVorlagen(w);expect(flussZustand(w).verfallen.filter(x=>x.id===v.id)).toHaveLength(1);
  const m=schreibtischMappe(w,0);expect(m.rueckblick).toBe(1);expect(m.verfallen).toBe(0);
  const html=renderToStaticMarkup(<Mappe world={w} refresh={()=>{}} max={0} onPosteingang={()=>{}}/>);
  expect(html).toContain(t("mzr.anzahl",{n:1}));expect(html).not.toContain(t("mf.verfallen",{n:1}));
 });
 test("gescheiterte Einlösung bleibt offen und erzeugt keinen Erfolg im Rückblick",()=>{
  const w=welt(),v=karte(w)!;w.spiel!.kapital=-20;
  expect(entscheideVorlage(w,v.id,"einloesen").ok).toBe(false);
  expect(zusage(w).erfuellt).toBe(false);expect(flussZustand(w).verfallen).toHaveLength(0);expect(flussZustand(w).erledigt[v.id]).toBeUndefined();
 });
 test("ein unzureichender Entwurf erhält die offene Zusagenkarte und wird nicht als ausreichende Beratung abgelegt",()=>{
  const w=welt(),z=gesetz(w),v=karte(w)!;pflegeVorlagen(w);
  expect(bringeEin(w,z.massnahme!,z.stufeStart!+5,null,"gesetz").ok).toBe(true);pflegeVorlagen(w);
  expect(karte(w)?.id).toBe(v.id);expect(z.faellig).toBe(0);expect(z.erfuellt).toBe(false);
  expect(flussZustand(w).verfallen.some(x=>x.zusage?.id===z.id)).toBe(false);
 });
 test("Frist- und Statusänderungen derselben Zusage ändern den UI-Pflegeschlüssel am selben Tag",()=>{
  const w=welt(),a=zusagenMappenStand(w);zusage(w).faellig=1;const b=zusagenMappenStand(w);expect(b).not.toBe(a);
  zusage(w).erfuellt=true;expect(zusagenMappenStand(w)).not.toBe(b);
 });
 test("eine nur im Posteingang vertagte Vorlage verschweigt ihre anderswo erfüllte Zusage nicht",()=>{
  const w=welt(),v=karte(w)!;pflegeVorlagen(w);vertageVorlage(w,v.id,30);
  expect(karte(w)).toBeUndefined();expect(loeseEin(w,zusage(w)).ok).toBe(true);pflegeVorlagen(w);
  expect(flussZustand(w).verfallen.find(x=>x.id===v.id)?.zusage?.status).toBe("erfuellt");
  expect(flussZustand(w).vertagt[v.thema]).toBeUndefined();
 });
 test("historische Frist und Status überstehen neue Vertröstung sowie Speichern/Laden",()=>{
  const w=welt(),v=karte(w)!;entscheideVorlage(w,v.id,"vertroesten");const alt=structuredClone(flussZustand(w).verfallen[0]!);
  tag(w,76);const zweite=karte(w)!;entscheideVorlage(w,zweite.id,"vertroesten");
  const neu=load(save(w));expect(flussZustand(neu).verfallen[0]).toEqual(alt);
  expect(alt.zusage!.faellig).not.toBe(addDays(neu.date,zusage(neu).faellig-neu.day));
 });
 test("alte mehrdeutige Zusagenablage bleibt lesbar und wird nicht als bewiesener Bruch gezählt",()=>{
  const w=welt(),f=flussZustand(w);f.verfallen.push({id:"alt",titel:"Alte Zusage",amt:"stab",quelle:"zusage",seit:0,verfallen:0,grund:"Erledigt oder verfallen"});
  expect(schreibtischMappe(w,0).verfallen).toBe(0);
  const html=renderToStaticMarkup(<VorlagenRueckblick world={w} eintraege={f.verfallen}/>);
  expect(html).toContain(t("mzr.alt"));expect(html).toContain(t("mzr.status.alt"));expect(html).not.toContain(t("mzr.status.gebrochen"));
 });
 test.each(["de","en","tr"] as const)("der Rückblick unterscheidet historischen Ausgang und heutige Pflicht auf %s",async lang=>{
  const w=welt(),v=karte(w)!;entscheideVorlage(w,v.id,"vertroesten");const eintraege=flussZustand(w).verfallen;const stand=save(w);
  await setzeSprache(lang);const html=renderToStaticMarkup(<VorlagenRueckblick world={w} eintraege={eintraege}/>);
  expect(html).toContain(t("mzr.status.vertroestet"));expect(html).toContain(rendere(eintraege[0]!.grund));
  expect(html).toContain(t("mzr.heute.offen",{datum:formatDateDe(eintraege[0]!.zusage!.faellig!)}));
  expect(html).not.toContain("⟦");expect(html).not.toMatch(/\{(?:datum|n)\}/);expect(save(w)).toBe(stand);
 });
});
