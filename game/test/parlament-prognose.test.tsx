import { afterEach, describe, expect, test } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createWorld, load, save } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { schnellProfil, startAfterElection } from "../src/sim/prolog";
import { bringeEin, gesetzPrognose, gesetzSicht, gesetzWeltAmVotum, gesetzeAbstimmen, stimmenKaufen, stufeIn } from "../src/sim/handeln";
import { fraktion } from "../src/sim/fraktionen";
import { addDays } from "../src/sim/dates";
import { Beschlussbuch } from "../src/ui/Beschlussbuch";
import { parlamentsLage } from "../src/ui/parlament/lage";
import { verteileErwartung, vorgabeFuer, zaehleZustaende } from "../src/ui/parlament/stimmen";
import { setzeSprache, t } from "../src/i18n";
import { GesetzesPrognoseHinweis } from "../src/ui/parlament/GesetzesPrognoseHinweis";
import { Tagesordnung } from "../src/ui/parlament/Tagesordnung";
import { faellig } from "../src/ui/schreibtisch/briefing";
import { laufendeVerfahren, vorhabenSicht } from "../src/sim/gesetzgebung";
import { GESETZESVORHABEN } from "../src/data/gesetzesvorhaben";
import { Rng } from "../src/sim/rng";
import { verfassungVon } from "../src/sim/aufmerksamkeit";

function beispiel() {
  const w=createWorld(turkey2026,17);
  startAfterElection(w,{...schnellProfil(),buendnis:"YENİ"});
  w.date="2028-06-25";w.day=60;w.spiel!.kapital=150;w.spiel!.gesetze=[];w.spiel!.zusagen=[];w.spiel!.ereignisse=[];
  w.parliament!.seats={[w.player!.partei.kurz]:200,"YENİ":120,CHP:200,MHP:50,DEM:30};
  fraktion(w,"CHP").duldungBis=w.day+3;
  expect(bringeEin(w,"m_renten",stufeIn(w,"m_renten",null)+20,null,"gesetz").ok).toBe(true);
  const g=w.spiel!.gesetze[0]!;
  return {w,g};
}
afterEach(async()=>{await setzeSprache("de");});

describe("Gesetzesprognose im Parlament",()=>{
  test("die laufende Gesetzeskarte berücksichtigt Duldungsende vor dem Votum",()=>{
    const {w,g}=beispiel();g.absprachen=83;g.stimmenBonus=7;
    const erwartet=gesetzSicht({...w,day:g.abstimmung,date:addDays(w.date,g.abstimmung-w.day)},g);
    expect(erwartet.ja).not.toBe(gesetzSicht(w,g).ja);
    const html=renderToStaticMarkup(<Beschlussbuch world={w} refresh={()=>{}}/>);
    expect(html).toContain(t("ui2.ui.Beschlussbuch.4a67f56",{p0:erwartet.ja,p1:301}));
  });
  test.each([17,-80,1200])("Halbrund und tatsächliche Rechnung stimmen auch bei Bonus %s überein",bonus=>{
    const {w,g}=beispiel();fraktion(w,"CHP").duldungBis=w.day+100;g.absprachen=30;g.stimmenBonus=bonus;
    const lage=parlamentsLage(w)!;const z=zaehleZustaende(verteileErwartung(lage,vorgabeFuer(w,g)));
    expect(z.fest+z.zusage+z.wackelig).toBe(gesetzSicht(w,g).ja);
    expect(Object.values(z).reduce((a,b)=>a+b,0)).toBe(600);
  });
  test.each([-1,0,1])("die Duldung endet %s Tage relativ zum Votum",offset=>{
    const {w,g}=beispiel();fraktion(w,"CHP").duldungBis=g.abstimmung+offset;
    const p=gesetzPrognose(w,g),v=vorgabeFuer(w,g);
    expect(p.auslaufend.map(f=>f.partei)).toEqual(offset<=0?["CHP"]:[]);
    expect(v.duldungsParteien?.includes("CHP")).toBe(offset>0);
    const lage=parlamentsLage(gesetzWeltAmVotum(w,g))!;
    expect(lage.fraktionen.find(f=>f.partei==="CHP")!.rolle).toBe(offset>0?"duldung":"opposition");
    const z=zaehleZustaende(verteileErwartung(lage,v));expect(z.fest+z.zusage+z.wackelig).toBe(p.ja);
  });
  test("ein heute gezeichneter Sitzplan zählt nach Ende der Duldung nicht doppelt",()=>{
    const {w,g}=beispiel();g.absprachen=45;g.stimmenBonus=19;
    const z=zaehleZustaende(verteileErwartung(parlamentsLage(w)!,vorgabeFuer(w,g)));
    expect(z.fest+z.zusage+z.wackelig).toBe(gesetzPrognose(w,g).ja);
  });
  test("mehrere Fristen werden geordnet, Koalitionspartner und bereits beendete Duldungen ausgeschlossen",()=>{
    const {w,g}=beispiel();fraktion(w,"MHP").duldungBis=w.day+1;fraktion(w,"DEM").duldungBis=w.day;
    fraktion(w,"YENİ").duldungBis=w.day+1;
    expect(gesetzPrognose(w,g).auslaufend.map(f=>f.partei)).toEqual(["MHP","CHP"]);
  });
  test("ein verlegtes Votum aktualisiert die bekannten Fristverluste am selben Tag",()=>{
    const {w,g}=beispiel();g.abstimmung=w.day+2;expect(gesetzPrognose(w,g).auslaufend).toHaveLength(0);
    g.abstimmung=w.day+4;expect(gesetzPrognose(w,g).auslaufend).toHaveLength(1);
  });
  test("überfällige Voten rechnen von heute statt eine bereits beendete Duldung wiederzubeleben",()=>{
    const {w,g}=beispiel();g.abstimmung=w.day-2;fraktion(w,"CHP").duldungBis=w.day-1;
    expect(gesetzPrognose(w,g)).toMatchObject({tag:w.day,datum:w.date,fristDelta:0,auslaufend:[]});
  });
  test("Beschlussbuch, Schreibtisch und laufende Gesetzesvorhaben teilen dieselbe Prognose",()=>{
    const {w,g}=beispiel();g.vorhaben="gv_renten";g.absprachen=7;g.stimmenBonus=-24;
    const p=gesetzPrognose(w,g),v=GESETZESVORHABEN.find(v=>v.id==="gv_renten")!;
    expect(laufendeVerfahren(w).parlament[0]!.ja).toBe(p.ja);
    expect(vorhabenSicht(w,v,new Set()).imParlament?.ja).toBe(p.ja);
    expect(faellig(w).find(f=>f.id===`g-${g.id}`)!.unter).toContain(t("sk.f.gesetz.unter",{wann:t("sk.tage",{n:g.abstimmung-w.day}),ja:p.ja,noetig:301}));
  });
  test("das Halbrund hält seine Grenzen auch bei starken Fassungseffekten und großen Absprachen ein",()=>{
    const {w,g}=beispiel();
    for(const absprachen of [0,8,100,900])for(const bonus of [-1200,-500,-20,0,20,500,1200]){
      g.absprachen=absprachen;g.stimmenBonus=bonus;
      const lage=parlamentsLage(gesetzWeltAmVotum(w,g))!,je=verteileErwartung(lage,vorgabeFuer(w,g)),z=zaehleZustaende(je);
      expect(z.fest+z.zusage+z.wackelig).toBe(gesetzPrognose(w,g).ja);
      for(const f of lage.fraktionen){expect(Object.values(je[f.partei]!).reduce((a,b)=>a+b,0)).toBe(f.sitze);expect(Object.values(je[f.partei]!).every(n=>Number.isInteger(n)&&n>=0)).toBe(true);}
    }
  });
  test("Prognose und Abstimmung verwenden dieselbe Grundlage einschließlich tatsächlicher Streuung",()=>{
    const {w,g}=beispiel();g.stimmenBonus=-130;const p=gesetzPrognose(w,g);
    const vergleich=new Rng(91),streuung=Math.round(vergleich.normal(6));
    w.date=p.datum;w.day=p.tag;
    const ergebnis=gesetzeAbstimmen(w,new Rng(91))[0]!;
    expect(ergebnis.ja).toBe(Math.max(0,Math.min(600,p.ja+streuung)));
    expect(ergebnis.angenommen).toBe(ergebnis.ja>=301);
  });
  test("die empfohlene Absprache erreicht den Puffer und bucht den gezeigten Preis",()=>{
    const {w,g}=beispiel();g.stimmenBonus=-100;const p=gesetzPrognose(w,g);
    expect(p.noetig).toBeGreaterThan(0);const kapital=w.spiel!.kapital,aufmerksamkeit=verfassungVon(w).aufmerksamkeit;
    expect(stimmenKaufen(w,g.id,p.noetig).ok).toBe(true);
    expect(w.spiel!.kapital).toBe(kapital-p.kosten);expect(verfassungVon(w).aufmerksamkeit).toBe(aufmerksamkeit-3);
    expect(gesetzPrognose(w,g).ja).toBe(309);expect(gesetzPrognose(w,g).noetig).toBe(0);
  });
  test.each(["de","en","tr"] as const)("Prognosekarte erklärt Fristen und Grenzen auf %s",async lang=>{
    await setzeSprache(lang);const {w,g}=beispiel(),p=gesetzPrognose(w,g);
    const html=renderToStaticMarkup(<GesetzesPrognoseHinweis prognose={p}/>);
    expect(html).toContain(t("gp.titel"));expect(html).toContain("CHP");expect(html).toContain(t("gp.hilfe"));
    expect(html).not.toContain("⟦");expect(html).not.toMatch(/\{(?:n|datum|sitze|partei)\}/);
  });
  test("Lesen und Speichern erhalten die heutige Fraktionsrolle und die laufenden Gesetze",()=>{
    const {w,g}=beispiel();gesetzPrognose(w,g);vorgabeFuer(w,g);const stand=save(w),p=gesetzPrognose(w,g);
    vorgabeFuer(w,g);expect(save(w)).toBe(stand);
    const neu=load(stand);expect(gesetzPrognose(neu,neu.spiel!.gesetze[0]!)).toEqual(p);
    expect(parlamentsLage(w)!.fraktionen.find(f=>f.partei==="CHP")!.rolle).toBe("duldung");
  });
  test("die Tagesordnung zeigt das eingebrachte Gesetz mit derselben Zahl wie die Prognose (ein Weg zum Gesetz)",()=>{
    const {w,g}=beispiel();g.vorhaben="gv_renten";g.stimmenBonus=-130;
    const p=gesetzPrognose(w,g),html=renderToStaticMarkup(<Tagesordnung world={w} refresh={()=>{}} onMassnahme={()=>{}} onHaushalt={()=>{}} onVerfassung={()=>{}} onPolitik={()=>{}}/>);
    expect(html).toContain(t("to.erwartet",{ja:p.ja,schwelle:301}));expect(html).toContain(g.name);
  });
  test("ein unbezahlbarer Stimmenpuffer bleibt als gesperrte Handlung mit Preis sichtbar",()=>{
    const {w,g}=beispiel();g.stimmenBonus=(g.stimmenBonus??0)+304-gesetzPrognose(w,g).ja;w.spiel!.kapital=-30;
    const p=gesetzPrognose(w,g);expect(p.ja).toBe(304);expect(p.bezahlbar).toBe(false);
    const html=renderToStaticMarkup(<Beschlussbuch world={w} refresh={()=>{}}/>);
    expect(html).toMatch(/class="pd-btn primary" disabled=""[^>]*>[^<]*<b>3<\/b>/);
    expect(html).toContain(t("gp.aufmerksamkeit",{n:3}));
    expect(html).toContain(t("ui2.ui.Beschlussbuch.3bd8b02",{p0:3,p1:-30}));
  });
});
