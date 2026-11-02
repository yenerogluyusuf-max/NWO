import { afterEach, describe, expect, test } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createWorld, save, load } from "../src/sim/world";
import { turkey2026 } from "../src/sim/scenario";
import { schnellProfil, startAfterElection } from "../src/sim/prolog";
import { fraktion } from "../src/sim/fraktionen";
import { aktiveParteivorsitzende, regierungsSitze } from "../src/sim/koalitionslage";
import { gefaehrdeteZusagen, zusagenSchrittPlan, fuehreZusagenSchrittAus } from "../src/sim/zusagenwarnung";
import { koalitionsHilfePlan, stabilisiereKoalition } from "../src/sim/koalitionshilfe";
import { bringeEin, stufeIn } from "../src/sim/handeln";
import { oeffne, ereignisTag } from "../src/sim/ereignisse";
import { brecheZusage } from "../src/sim/zusagen";
import { spielTick } from "../src/sim/spiel";
import { ministerVorlagen, entscheideVorlage } from "../src/sim/ministerfluss";
import { Rng } from "../src/sim/rng";
import { addDays } from "../src/sim/dates";
import { eigenVon } from "../src/sim/personen";
import { setzeSprache, t, platzhalter } from "../src/i18n";
import { ZusagenWache, ZusagenSchritte } from "../src/ui/schreibtisch/ZusagenWache";
import { Schreibtisch } from "../src/ui/schreibtisch/Schreibtisch";
import { Personen } from "../src/ui/Personen";
import de from "../src/i18n/katalog/de/zusagenwache.json";
import en from "../src/i18n/katalog/en/zusagenwache.json";
import tr from "../src/i18n/katalog/tr/zusagenwache.json";
import type { World } from "../src/sim/types";
import type { Zusage } from "../src/sim/spiel-typen";

function welt(loyalitaet=30) {
  const w=createWorld(turkey2026,17);startAfterElection(w,{...schnellProfil(),buendnis:"YENİ"});
  w.spiel!.ereignisse=[];w.spiel!.zusagen=[];w.spiel!.gesetze=[];w.spiel!.lager=["YENİ"];w.spiel!.kapital=100;
  w.parliament!.seats={[w.player!.partei.kurz]:200,"YENİ":120,CHP:200,MHP:50,DEM:30};
  fraktion(w,"YENİ").bereitschaft=60;chef(w).loyalitaet=loyalitaet;eigenVon(w,chef(w)).groll=10;
  return w;
}
const chef=(w:World)=>aktiveParteivorsitzende(w,"YENİ")[0]!;
function zusage(w:World,opts:Partial<Zusage>={}) {
  const z:Zusage={id:`z-wache-${w.spiel!.zusagen.length}`,von:"YENİ",text:"Verbindliche Fraktionszusage",faellig:w.day+10,erfuellt:false,gebrochen:false,...opts};
  w.spiel!.zusagen.push(z);return z;
}
function erinnerung(w:World,z:Zusage) {z.faellig=w.day;return oeffne(w,"zusage",new Rng(3),{provinzen:[],staerke:1,daten:{zusage:z.id}})!;}
function gesetzZusage(w:World) {const massnahme="m_renten",stufeStart=Math.round(stufeIn(w,massnahme,null));return zusage(w,{massnahme,richtung:1,stufeStart,stufeZiel:stufeStart+20});}
afterEach(async()=>{await setzeSprache("de");});

describe("Gefährdete Zusagen auf dem Regierungsschreibtisch",()=>{
  test("zeigt nahe Frist, Fraktion, Rückhalt und Sitzverlust ohne den Spielstand zu ändern",()=>{
    const w=welt(19),z=zusage(w),stand=save(w),s=gefaehrdeteZusagen(w)[0]!;
    expect(s.z.id).toBe(z.id);expect(s.rolle).toBe("koalition");expect(s.akut).toBe(true);
    expect(s.tage).toBe(10);expect(s.sitze).toBe(120);expect(s.ohne).toBe(200);expect(s.nachVerfall).toBe(4);
    expect(save(w)).toBe(stand);
  });
  test("akute Bruchgefahr steht vor einer früheren aber stabilen Zusage",()=>{
    const w=welt(19),spaet=zusage(w,{faellig:w.day+150});zusage(w,{von:"CHP",faellig:w.day-4});
    expect(gefaehrdeteZusagen(w)[0]!.z.id).toBe(spaet.id);
    expect(gefaehrdeteZusagen(w)[1]!.rolle).toBe("opposition");expect(gefaehrdeteZusagen(w)[1]!.akut).toBe(false);
  });
  test("ruhige ferne und erledigte Zusagen sowie Nichtfraktionen werden ausgeblendet",()=>{
    const w=welt(70);zusage(w,{faellig:w.day+100});zusage(w,{erfuellt:true});zusage(w,{gebrochen:true});zusage(w,{von:"Wähler"});
    expect(gefaehrdeteZusagen(w)).toEqual([]);
  });
  test("Duldung und fehlender oder inaktiver Vorsitz werden nicht als akuter Koalitionsbruch ausgegeben",()=>{
    const w=welt(5),z=zusage(w);w.spiel!.lager=[];fraktion(w,z.von).duldungBis=w.day+30;
    let s=gefaehrdeteZusagen(w)[0]!;expect(s.rolle).toBe("duldung");expect(s.akut).toBe(false);
    w.spiel!.lager=[z.von];chef(w).imAmt=false;s=gefaehrdeteZusagen(w)[0]!;
    expect(s.loyalitaet).toBeUndefined();expect(s.akut).toBe(false);expect(s.vorsitz).toHaveLength(0);
    expect(koalitionsHilfePlan(w,z.von,"fraktion")).toBeUndefined();
  });
  test("eigene Fraktion erhält Zusagenschritte ohne fälschlich angebotenen Bündnisbeitritt",()=>{
    const w=welt();zusage(w,{von:w.player!.partei.kurz});const s=gefaehrdeteZusagen(w)[0]!;
    expect(s.rolle).toBe("eigene");expect(s.koalition).toBe(false);
    const html=renderToStaticMarkup(<ZusagenSchritte world={w} s={s} onGehe={()=>{}} onErgebnis={()=>{}}/>);
    expect(html).toContain(t("zw.eigene"));expect(html).not.toContain(t("zw.opposition"));
  });
  test("Erinnerungsfrist ist vom eigentlichen Fälligkeitstag getrennt",()=>{
    const w=welt(),z=zusage(w),e=erinnerung(w,z),s=gefaehrdeteZusagen(w)[0]!;
    expect(s.tage).toBe(0);expect(s.erinnerung!.frist).toBe(e.frist);expect(e.frist).toBe(w.day+20);
  });
  test("unzureichender Entwurf, unsichere Mehrheit und späte Abstimmung werden konkret benannt",()=>{
    const w=welt(),z=gesetzZusage(w);erinnerung(w,z);
    expect(bringeEin(w,z.massnahme!,z.stufeStart!+5,null,"gesetz").ok).toBe(true);
    // Ein unzureichender Entwurf lässt die Erinnerung offen. Ein enges verbindliches Datum bleibt separat prüfbar.
    z.faellig=w.day+5;w.spiel!.gesetze[0]!.absprachen=-600;
    const s=gefaehrdeteZusagen(w)[0]!;
    expect(s.gruende).toEqual(expect.arrayContaining(["teil","mehrheit","spaet"]));
    expect(s.gesetz!.entwurf!.stufe).toBe(z.stufeStart!+5);expect(s.gesetz!.ja).toBe(0);
  });
  test("bekannte Duldung läuft in der angezeigten Abstimmungsprognose tatsächlich aus",()=>{
    const w=welt(70),z=gesetzZusage(w);fraktion(w,"CHP").duldungBis=w.day+3;
    expect(bringeEin(w,z.massnahme!,z.stufeZiel!,null,"gesetz").ok).toBe(true);
    const ohneDuldung=gefaehrdeteZusagen(w)[0]!.gesetz!.ja!;
    fraktion(w,"CHP").duldungBis=w.day+100;
    expect(gefaehrdeteZusagen(w)[0]!.gesetz!.ja!).toBeGreaterThan(ohneDuldung);
  });
  test("Einlösen nennt und bucht echte Kosten, Vorsitzreaktion und neue Fraktionsbereitschaft",()=>{
    const w=welt(),z=zusage(w),p=zusagenSchrittPlan(w,z.id,"einloesen")!,stand=save(w);
    expect(p.pk).toBe(4);expect(p.bereitschaft).toBe(10);expect(p.personen.find(f=>f.id===chef(w).id)!.nachher).toBe(42);
    expect(save(w)).toBe(stand);expect(fuehreZusagenSchrittAus(w,p).ok).toBe(true);
    expect(chef(w).loyalitaet).toBe(42);expect(fraktion(w,z.von).bereitschaft).toBe(70);expect(w.spiel!.kapital).toBe(96);
    expect(z.erfuellt).toBe(true);expect(fuehreZusagenSchrittAus(w,p).ok).toBe(false);
  });
  test("Einbringen nennt das spätere Votum und verspricht keine sofortige Rettung",()=>{
    const w=welt(19),z=gesetzZusage(w),p=zusagenSchrittPlan(w,z.id,"einloesen")!;
    expect(p.moeglich).toBe(true);expect(p.erfuellt).toBe(false);expect(p.abstimmung).toBeGreaterThan(w.day);
    expect(p.personen).toEqual([]);expect(p.bereitschaft).toBe(0);
    expect(fuehreZusagenSchrittAus(w,p).ok).toBe(true);expect(chef(w).loyalitaet).toBe(19);
  });
  test("Vertrösten warnt vor Loyalitätsverlust, nennt Frist und erledigt nur die passende Erinnerung",()=>{
    const w=welt(25),z=zusage(w),e=erinnerung(w,z),andere=zusage(w),e2=erinnerung(w,andere);
    const p=zusagenSchrittPlan(w,z.id,"vertroesten")!;
    expect(p.pk).toBe(1);expect(p.faelligDanach).toBe(w.day+90);expect(p.personen.find(f=>f.id===chef(w).id)!.nachher).toBe(17);
    expect(fuehreZusagenSchrittAus(w,p).ok).toBe(true);
    expect(w.spiel!.ereignisse.some(x=>x.id===e.id)).toBe(false);expect(w.spiel!.ereignisse.some(x=>x.id===e2.id)).toBe(true);
    expect(z.erfuellt).toBe(false);expect(z.faellig).toBe(p.faelligDanach);expect(chef(w).loyalitaet).toBe(17);
  });
  test("direkte Erfüllung beseitigt die offene Erinnerung und kann nicht später erneut als Bruch gebucht werden",()=>{
    const w=welt(),z=zusage(w),e=erinnerung(w,z);
    expect(fuehreZusagenSchrittAus(w,zusagenSchrittPlan(w,z.id,"einloesen")!).ok).toBe(true);
    expect(w.spiel!.ereignisse.some(x=>x.id===e.id)).toBe(false);
    const vorher=save(w);brecheZusage(w,z,true);expect(save(w)).toBe(vorher);
  });
  test.each(["erfuellt","verschoben"] as const)("alte gespeicherte Erinnerung nach %s wird vor ihrem Verfall bereinigt",art=>{
    const w=welt(),z=zusage(w);erinnerung(w,z);
    if(art==="erfuellt")z.erfuellt=true;else z.faellig=w.day+90;
    const neu=load(save(w));expect(gefaehrdeteZusagen(neu).every(s=>!s.erinnerung)).toBe(true);ereignisTag(neu,new Rng(19));
    expect(neu.spiel!.ereignisse.some(e=>e.vorlage==="zusage"&&e.daten?.zusage===z.id)).toBe(false);
    expect(neu.spiel!.zusagen[0]!.gebrochen).toBe(false);
  });
  test.each(["kapital","loyalitaet","frist","abgeschlossen","partei","tag"] as const)("überholtes Zusagenangebot bei %s verändert nichts",art=>{
    const w=welt(),z=zusage(w),p=zusagenSchrittPlan(w,z.id,"vertroesten")!;
    if(art==="kapital")w.spiel!.kapital-=.2;
    if(art==="loyalitaet")chef(w).loyalitaet-=1;
    if(art==="frist")z.faellig+=3;
    if(art==="abgeschlossen")z.erfuellt=true;
    if(art==="partei")z.von="CHP";
    if(art==="tag"){w.day++;w.date=addDays(w.date,1);}
    const vorher=save(w);expect(fuehreZusagenSchrittAus(w,p).ok).toBe(false);expect(save(w)).toBe(vorher);
  });
  test("ausgeschöpfte Vertröstungen und Kapitalgrenze bleiben sichtbare Sperren",()=>{
    const w=welt(),z=zusage(w);z.vertroestet=2;expect(zusagenSchrittPlan(w,z.id,"vertroesten")!.moeglich).toBe(false);
    w.spiel!.kapital=-100;expect(zusagenSchrittPlan(w,z.id,"einloesen")!.moeglich).toBe(false);
  });
  test("Koalitionsgespräch ist ohne Versorgungsbeschluss nutzbar und teilt seine Sperre über Zusagen hinweg",()=>{
    const w=welt(19);zusage(w);zusage(w);
    const p=koalitionsHilfePlan(w,"YENİ","fraktion")!,stand=save(w);
    expect(p.moeglich).toBe(true);expect(p.pk).toBe(1);expect(p.aufmerksamkeit).toBe(2);expect(save(w)).toBe(stand);
    expect(stabilisiereKoalition(w,p).ok).toBe(true);expect(chef(w).loyalitaet).toBe(24);
    expect(koalitionsHilfePlan(w,"YENİ","fraktion")!.moeglich).toBe(false);
    expect(w.spiel!.zusagen.every(z=>!z.erfuellt)).toBe(true);
  });
  test("gleicher Tagesstand reagiert sofort auf Loyalität, Frist und Bearbeitung",()=>{
    const w=welt(19),z=zusage(w,{faellig:w.day+150});expect(gefaehrdeteZusagen(w)).toHaveLength(1);
    chef(w).loyalitaet=70;expect(gefaehrdeteZusagen(w)).toHaveLength(0);
    z.faellig=w.day+1;expect(gefaehrdeteZusagen(w)).toHaveLength(1);
    z.erfuellt=true;expect(gefaehrdeteZusagen(w)).toHaveLength(0);
  });
  test("vom Schreibtisch vorbereitete Hilfe verhindert den echten Monatsbruch",()=>{
    const w=welt(19),z=zusage(w);w.date="2028-06-30";w.day=0;w.spiel!.start.datum=w.date;z.faellig=30;
    const ohne=load(save(w));expect(stabilisiereKoalition(w,koalitionsHilfePlan(w,z.von,"fraktion")!).ok).toBe(true);
    for(const x of [w,ohne]){x.date="2028-07-01";x.day=1;spielTick(x,new Rng(19));}
    expect(regierungsSitze(w)).toBe(320);expect(regierungsSitze(ohne)).toBe(200);
  });
  test("Unterschriftenmappe nennt denselben tatsächlichen Gesetzespreis wie die Zusagenwache",()=>{
    const w=welt(),z=gesetzZusage(w),plan=zusagenSchrittPlan(w,z.id,"einloesen")!;
    const v=ministerVorlagen(w,{tiefe:0}).find(v=>v.thema===`zusage:${z.id}`)!;
    const o=v.optionen.find(o=>o.id==="einloesen")!;
    expect(o.kosten.pk).toBe(plan.pk);expect(o.kosten.pk).toBeGreaterThan(0);
    expect(o.folgen).toContain(t("zusage.gesetz.belohnung"));
    const kapital=w.spiel!.kapital;expect(entscheideVorlage(w,v.id,o.id).ok).toBe(true);
    expect(w.spiel!.kapital).toBeCloseTo(kapital-plan.pk);expect(z.erfuellt).toBe(false);
  });
  test("Unterschriftenmappe bietet laufenden Entwurf oder unbezahlbaren Antrag nicht als ausführbar an",()=>{
    const w=welt(),z=gesetzZusage(w);
    const option=()=>ministerVorlagen(w,{tiefe:0}).find(v=>v.thema===`zusage:${z.id}`)!.optionen.find(o=>o.id==="einloesen")!;
    w.spiel!.kapital=-100;expect(option().moeglich).toBe(false);
    w.spiel!.kapital=100;bringeEin(w,z.massnahme!,z.stufeZiel!,null,"gesetz");z.faellig=w.day+10;
    expect(option().moeglich).toBe(false);expect(option().text).toBe(t("zusage.gesetz.laeuft"));
  });
  test("bereits beschlossenes Ziel ist auch in der Unterschriftenmappe ohne neues Gesetz erfüllbar",()=>{
    const w=welt(),z=gesetzZusage(w);w.net.targets[z.massnahme!]=z.stufeZiel!;
    const o=ministerVorlagen(w,{tiefe:0}).find(v=>v.thema===`zusage:${z.id}`)!.optionen.find(o=>o.id==="einloesen")!;
    expect(o.kosten).toEqual({pk:0,aufmerksamkeit:0});expect(o.moeglich).toBe(true);
    expect(o.label).toBe(t("zusage.gesetz.verbuchen"));expect(o.text).toBe(t("zusage.gesetz.bereit.text"));
  });
  test("Mappe aktualisiert Frist und bereits beschlossenes Ziel auch bei gleicher Zusagen- und Zielanzahl",()=>{
    const w=welt(),z=gesetzZusage(w);w.net.targets[z.massnahme!]=z.stufeStart!;
    const option=()=>ministerVorlagen(w,{tiefe:0}).find(v=>v.thema===`zusage:${z.id}`)?.optionen.find(o=>o.id==="einloesen");
    expect(option()!.kosten.pk).toBeGreaterThan(0);w.net.targets[z.massnahme!]=z.stufeZiel!;
    expect(option()!.kosten.pk).toBe(0);z.faellig=w.day+100;expect(option()).toBeUndefined();
  });
  test("Sprachkataloge haben gleiche Schlüssel und Platzhalter",()=>{
    for(const kat of [en,tr]){expect(Object.keys(kat).sort()).toEqual(Object.keys(de).sort());for(const k of Object.keys(de) as (keyof typeof de)[])expect(platzhalter(kat[k])).toEqual(platzhalter(de[k]));}
  });
  test.each(["de","en","tr"] as const)("Schreibtischkarten und ausführbare Schritte auf %s zeigen Kosten, Risiko und eindeutige Aktionen",async lang=>{
    await setzeSprache(lang);const w=welt(19.9999),z=zusage(w),s=gefaehrdeteZusagen(w)[0]!,stand=save(w);
    const html=renderToStaticMarkup(<ZusagenWache world={w} refresh={()=>{}} onGehe={()=>{}}/>);
    expect(html).toContain(t("zw.titel"));expect(html).toContain(t("zw.rolle.koalition"));expect(html).toContain("&lt; 20");
    const schritte=renderToStaticMarkup(<ZusagenSchritte world={w} s={s} onGehe={()=>{}} onErgebnis={()=>{}}/>);
    expect(schritte).toContain(t("vn.aktion.fraktion"));expect(schritte).toContain(t("zw.vertroesten"));expect(schritte).toContain(t("vn.bleibtAkut"));
    expect(html+schritte).not.toMatch(/⟦|NaN|undefined|Infinity/);expect(save(w)).toBe(stand);
    expect(z.erfuellt).toBe(false);
  });
  test("Regierungsschreibtisch bindet die Karten ein; Zusagensprung öffnet direkt den richtigen Personenreiter",()=>{
    const w=welt();zusage(w);
    expect(renderToStaticMarkup(<Schreibtisch world={w} refresh={()=>{}} onGehe={()=>{}}/>)).toContain(t("zw.titel"));
    const html=renderToStaticMarkup(<Personen world={w} initialTab="zusagen"/>);
    expect(html).toContain('class="pe-zusagen-seite"');
  });
});
