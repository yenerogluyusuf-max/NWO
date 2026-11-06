import { afterEach, describe, expect, test } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { advance, createWorld, load, save } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { schnellProfil, startAfterElection } from "../src/sim/prolog";
import { bringeHaushaltsgesetzEin, haushaltsGesetzSicht, haushaltszyklusTag, setzeEntwurf, setzePosten, POSTEN_NACH_ID } from "../src/sim/haushalt";
import { haushaltsMehrheitsPlan, sichereHaushaltsMehrheit } from "../src/sim/haushaltsmehrheit";
import { haushaltsNachsorge, haushaltsMonatsabschluss, letzterHaushaltsBeschluss } from "../src/sim/haushaltsbericht";
import { haushaltsReifungVorbereiten } from "../src/sim/haushaltsreifung";
import { haushaltZustand } from "../src/sim/wirtschaft";
import { wirtschaftMonat } from "../src/sim/wirtschaft-tick";
import { gueterMonat } from "../src/sim/gueter";
import { fraktion } from "../src/sim/fraktionen";
import { Rng } from "../src/sim/rng";
import { addDays, formatDateDe } from "../src/sim/dates";
import { HaushaltsMonatsbericht, HaushaltsNachbericht } from "../src/ui/wirtschaft/HaushaltsBericht";
import { Haushalt } from "../src/ui/wirtschaft/Haushalt";
import { VersorgungsMonatsbericht } from "../src/ui/gueter/VersorgungsMonatsbericht";
import { setzeSprache, t, katalogVon, platzhalter } from "../src/i18n";
import type { World } from "../src/sim/types";

function welt() {
  const w=createWorld(turkey2026,17);startAfterElection(w,{...schnellProfil(),buendnis:"YENİ"});
  w.day=120;w.date="2028-10-10";w.spiel!.kapital=100;w.spiel!.lager=[];w.spiel!.zusagen=[];w.spiel!.ereignisse=[];
  w.parliament!.seats={[w.player!.partei.kurz]:180,CHP:180,"YENİ":120,MHP:90,DEM:30};
  fraktion(w,"YENİ").bereitschaft=65;
  expect(setzeEntwurf(w,"investitionen",2).ok).toBe(true);expect(bringeHaushaltsgesetzEin(w).ok).toBe(true);
  return w;
}
const chef=(w:World)=>w.spiel!.figuren.find(f=>f.amt==="partner"&&f.partei==="YENİ")!;
function abkommen(w:World,art:"koalition"|"duldung"="koalition") {
  const a=haushaltsMehrheitsPlan(w,art,"YENİ")!;expect(sichereHaushaltsMehrheit(w,a).ok).toBe(true);return w.spiel!.zusagen.at(-1)!;
}
function votum(w:World,annahme=true) {
  const g=haushaltZustand(w).gesetz!;g.absprachen=annahme?600:0;
  const p=haushaltsGesetzSicht(w)!;w.day=p.tag;w.date=p.datum;haushaltszyklusTag(w,new Rng(91));
  return letzterHaushaltsBeschluss(w)!;
}
function monat(w:World) {
  w.day++;w.date=addDays(w.date,1);wirtschaftMonat(w);gueterMonat(w);haushaltsMonatsabschluss(w);
  return haushaltZustand(w).monatsberichte!.at(-1)!;
}
afterEach(async()=>{await setzeSprache("de");});

describe("Haushaltsbeschluss und Monatsfolgen",()=>{
  test("Abkommen halten ihre tatsächlichen Kosten und konkreten Zusagen fest; Vorschau legt keine Belege an",()=>{
    const w=welt(),stand=save(w),p=haushaltsMehrheitsPlan(w,"koalition","YENİ")!;
    expect(save(w)).toBe(stand);expect(haushaltZustand(w).gesetz!.abkommen).toBeUndefined();
    const z=abkommen(w),a=haushaltZustand(w).gesetz!.abkommen![0]!;
    expect(a).toMatchObject({partei:"YENİ",art:"koalition",pk:p.pk,aufmerksamkeit:p.aufmerksamkeit,vorher:p.vorher,nachher:p.nachher,bereitschaft:10});
    expect(a.zusagen).toEqual([z]);z.faellig++;expect(a.zusagen[0]!.faellig).not.toBe(z.faellig);
  });
  test("Annahme speichert reale Posten, Finanzierung und Ministerreaktion ohne erfundene Fraktionsbelohnung",()=>{
    const w=welt();abkommen(w);const person=chef(w).loyalitaet,b=votum(w);
    expect(b.angenommen).toBe(true);expect(b.ja).toBe(600);expect(b.posten[0]).toMatchObject({id:"investitionen",vorher:0,ziel:2,danach:2});
    expect(b.nachher.defizit-b.vorher.defizit).toBeCloseTo(2*POSTEN_NACH_ID.investitionen!.schritt,8);
    expect(b.nachher.personen.some(p=>p.loyalitaet!==(b.vorher.personen.find(v=>v.id===p.id)?.loyalitaet))).toBe(true);
    expect(chef(w).loyalitaet).toBe(person);expect(b.zusagen[0]!.status).toBe("offen");
  });
  test("Ablehnung lässt die neue Duldungszusage verbindlich und den bisherigen Etat unverändert",()=>{
    const w=welt(),z=abkommen(w,"duldung");w.parliament!.seats[w.player!.partei.kurz]=20;
    const b=votum(w,false);expect(b.angenommen).toBe(false);expect(b.posten[0]!.danach).toBe(0);
    expect(b.nachher.defizit).toBe(b.vorher.defizit);expect(b.nachher.legitimitaet).toBeLessThan(b.vorher.legitimitaet);
    expect(b.zusagen.find(x=>x.z.id===z.id)).toMatchObject({quelle:"haushalt",status:"offen"});expect(fraktion(w,"YENİ").duldungBis).toBeGreaterThan(w.day);
    expect(haushaltsReifungVorbereiten(w)).toBeUndefined();expect(haushaltZustand(w).stufen.investitionen??0).toBe(0);
  });
  test("ein höherer Forschungsetat erfüllt ein zugesagtes Forschungsgesetz nicht automatisch",()=>{
    const w=welt();haushaltZustand(w).gesetz!.schritte.forschung=3;
    const z=abkommen(w);expect(z.massnahme).toBeDefined();const ziel=z.stufeZiel;votum(w);
    expect(z.erfuellt).toBe(false);expect(z.stufeZiel).toBe(ziel);expect(haushaltsNachsorge(w)!.zusagen[0]!.status).toBe("offen");
  });
  test("bestehende andere Zusagen bleiben klar vom Preis der Haushaltsmehrheit getrennt",()=>{
    const w=welt();abkommen(w);w.spiel!.zusagen.push({id:"vorher",von:"YENİ",text:"Alte Verpflichtung",faellig:w.day+90,erfuellt:false,gebrochen:false});
    w.spiel!.zusagen.push({id:"fremd",von:"CHP",text:"Andere Partei",faellig:w.day+90,erfuellt:false,gebrochen:false});
    const b=votum(w);expect(b.zusagen.find(z=>z.z.id==="vorher")!.quelle).toBe("bestehend");expect(b.zusagen.some(z=>z.z.id==="fremd")).toBe(false);
  });
  test("Live-Nachsorge liest Erfüllung, Bruch und neue Frist, ohne den Beschlussbeleg umzuschreiben",()=>{
    const w=welt(),z=abkommen(w),b=votum(w),historie=JSON.stringify(b);
    z.faellig+=30;z.erfuellt=true;let n=haushaltsNachsorge(w)!;
    expect(n.zusagen[0]!.status).toBe("erfuellt");expect(n.zusagen[0]!.datum).toBe(addDays(w.date,z.faellig-w.day));
    z.erfuellt=false;z.gebrochen=true;expect(haushaltsNachsorge(w)!.zusagen[0]!.status).toBe("gebrochen");
    w.spiel!.zusagen=[];expect(haushaltsNachsorge(w)!.zusagen[0]!.status).toBe("unbekannt");expect(JSON.stringify(b)).toBe(historie);
  });
  test("der zusätzliche Reifungsschritt verbessert Verkehr; reine Vergleichsläufe buchen keine Waren oder politischen Folgen",()=>{
    const w=welt();abkommen(w);votum(w);w.day++;w.date=addDays(w.date,1);
    const kontrolle=structuredClone(w);delete haushaltZustand(kontrolle).abschluesse;
    wirtschaftMonat(w);wirtschaftMonat(kontrolle);
    const r=haushaltZustand(w).reifungsbeleg!;expect(r.knoten.find(k=>k.id==="verkehrsnetz")!.delta).toBeGreaterThan(0);
    expect(r.knoten.find(k=>k.id==="verkehrsnetz")!.delta).toBeLessThan(POSTEN_NACH_ID.investitionen!.dauer.find(k=>k.id==="verkehrsnetz")!.d*2);
    expect(w.net.values).toEqual(kontrolle.net.values);expect(w.economy).toEqual(kontrolle.economy);expect(w.spiel!.gueter).toEqual(kontrolle.spiel!.gueter);
    expect(w.spiel!.figuren).toEqual(kontrolle.spiel!.figuren);expect(w.spiel!.kapital).toBe(kontrolle.spiel!.kapital);
  });
  test("Kürzung des Agraransatzes zeigt einen negativen Reifungsbeitrag zur Ernte",()=>{
    const w=welt();haushaltZustand(w).gesetz!.schritte={landwirtschaft:-2};votum(w);monat(w);
    expect(haushaltZustand(w).reifungsbeleg!.knoten.find(k=>k.id==="ernte")!.delta).toBeLessThan(0);
  });
  test("neu bewilligter Etat ist vor der ersten Monatsabrechnung noch nicht wirksam",()=>{
    const w=welt();votum(w);const u=haushaltsNachsorge(w)!.umsetzung[0]!;
    expect(u).toMatchObject({ziel:2,heute:2,wirksam:0});
    const b=monat(w);expect(b.umsetzung[0]!.wirksam).toBeGreaterThan(0);expect(b.umsetzung[0]!.wirksam).toBeLessThan(2);
  });
  test("nachträglich geänderter Posten wird nicht mehr als Reifungsbeitrag des alten Beschlusses ausgegeben",()=>{
    const w=welt();votum(w);expect(setzePosten(w,"investitionen",3,true).ok).toBe(true);
    expect(haushaltsNachsorge(w)!.umsetzung[0]!.ersetzt).toBe(true);expect(haushaltsReifungVorbereiten(w)).toBeUndefined();
  });
  test("Monatsbericht verwendet gebuchte Waren und identische Belege in Wirtschafts- und Parlamentsbericht",()=>{
    const w=welt();abkommen(w);votum(w);const b=monat(w),reg=w.spiel!.gueter!.regierung!.bericht!;
    expect(b.versorgung).toEqual({monat:reg.monat,deckung:reg.deckung,handel:w.spiel!.gueter!.bilanz!.handelsDeltaUsdMrd});
    expect(b.reifung?.beschluss).toBe(b.abschluss.id);expect(reg.haushalt).toEqual(b);
    const einmal=save(w);haushaltsMonatsabschluss(w);expect(save(w)).toBe(einmal);
  });
  test("Monatsstände bleiben historisch, während heutige Zusagen und Parteien sich ändern",()=>{
    const w=welt(),z=abkommen(w);votum(w);const b=monat(w),historie=JSON.stringify(b);
    z.erfuellt=true;w.spiel!.lager=[];chef(w).loyalitaet=9;
    expect(haushaltsNachsorge(w)!.zusagen[0]!.status).toBe("erfuellt");expect(haushaltsNachsorge(w)!.stand.parteien.find(p=>p.partei==="YENİ")!.rolle).toBe("opposition");
    expect(JSON.stringify(b)).toBe(historie);expect(w.spiel!.gueter!.regierung!.bericht!.haushalt).toEqual(b);
  });
  test("echter Tageslauf über den Monatswechsel hält einen Koalitionsaustritt nach dem Haushaltsvotum fest",()=>{
    const w=welt();abkommen(w);chef(w).loyalitaet=1;const b=votum(w);expect(w.date).toBe("2028-10-31");
    advance(w,1);const m=haushaltZustand(w).monatsberichte!.at(-1)!;
    expect(m.abschluss.id).toBe(b.id);expect(m.koalition?.austritte.map(p=>p.partei)).toContain("YENİ");
    expect(b.nachher.sitze).toBe(300);expect(m.stand.sitze).toBe(180);expect(m.koalition!.austritte[0]!.loyalitaet).toBeLessThan(20);
    expect(m.zusagen[0]!.status).toBe("offen");expect(m.reifung).toBeDefined();
  });
  test("Votum am Monatsersten nach der Etatabrechnung erhält keine vorzeitige Reifungswirkung",()=>{
    const w=welt();abkommen(w);const g=haushaltZustand(w).gesetz!;g.abstimmung++;g.absprachen=600;
    w.day=g.abstimmung-1;w.date="2028-10-31";advance(w,1);
    const m=haushaltZustand(w).monatsberichte!.at(-1)!;expect(m.abschluss.datum).toBe("2028-11-01");expect(m.reifung).toBeUndefined();
    expect(haushaltZustand(w).wirksam?.investitionen??0).toBe(0);
    expect(m.umsetzung[0]!.wirksam).toBe(0);
  });
  test("Speichern und Laden erhalten Beschluss, zugeordnete Verträge und Monatsbelege",()=>{
    const w=welt();abkommen(w);votum(w);monat(w);const neu=load(save(w));
    expect(haushaltZustand(neu).abschluesse).toEqual(haushaltZustand(w).abschluesse);
    expect(haushaltZustand(neu).monatsberichte).toEqual(haushaltZustand(w).monatsberichte);
    expect(neu.spiel!.gueter!.regierung!.bericht!.haushalt).toEqual(w.spiel!.gueter!.regierung!.bericht!.haushalt);
  });
  test("Altstand ohne Beleg wird nicht nachträglich mit erfundenen Haushaltsfolgen ergänzt",()=>{
    const w=welt();haushaltZustand(w).gesetz=null;haushaltZustand(w).letztesErgebnis="angenommen";
    const neu=load(save(w)),stand=save(neu);expect(haushaltsNachsorge(neu)).toBeUndefined();haushaltsMonatsabschluss(neu);
    expect(renderToStaticMarkup(<HaushaltsNachbericht world={neu}/>)).toBe("");expect(save(neu)).toBe(stand);
  });
  test.each(["de","en","tr"] as const)("Berichte und Nachsorge auf %s erklären Ursache, Frist und Grenzen ohne den Spielstand zu verändern",async lang=>{
    await setzeSprache(lang);const w=welt();abkommen(w);votum(w);const b=monat(w),stand=save(w);
    const html=renderToStaticMarkup(<HaushaltsMonatsbericht bericht={b}/>);
    // Welle B1 (06.11.2026): Die Grenzsätze („Vergleich isoliert …“, „Der Etatbeschluss verändert …“) sind als Prosa entfallen; die Blöcke
    // tragen kurze Etiketten. Geprüft werden weiter Bindung, Wirkungsblock, Koalitionsblock, Frist und Herkunft der Zusage.
    expect(html).toContain(t("welle_b1.hb.bindung"));expect(html).toContain(t("hb.wirkung"));expect(html).toContain(t("hb.koalition"));expect(html).toContain(t("welle_b1.hb.sitzeVotum"));
    expect(html).toContain(formatDateDe(b.zusagen[0]!.datum));expect(html).toContain(t("welle_b1.hb.quelle.haushalt"));
    const integriert=renderToStaticMarkup(<VersorgungsMonatsbericht bericht={w.spiel!.gueter!.regierung!.bericht}/>);
    expect(save(w)).toBe(stand);
    renderToStaticMarkup(<HaushaltsNachbericht world={w}/>);expect(save(w)).toBe(stand);
    // Die umfassende Altansicht legt weiterhin ihre Behörden-Grunddaten beim ersten Lesen an.
    const haushalt=renderToStaticMarkup(<Haushalt world={structuredClone(w)} geaendert={()=>{}} posten="_abschluss"/>);
    expect(integriert).toContain(t("hb.titel"));expect(haushalt).toContain(t("hb.heute",{datum:formatDateDe(w.date)}));
    expect(html+integriert+haushalt).not.toContain("⟦");expect(html).not.toMatch(/\{(?:n|datum|ja|nein|vor|nach|ziel|monat)\}/);
    expect(save(w)).toBe(stand);
    for(const key of Object.keys(katalogVon("de")).filter(k=>k.startsWith("hb.")))expect(platzhalter(katalogVon(lang)[key]!)).toEqual(platzhalter(katalogVon("de")[key]!));
  });
});
