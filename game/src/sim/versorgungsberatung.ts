// Verhandlungswege sind Vorschläge für die vorhandene Vorlage, keine zweite Mehrheitsmechanik.
import type { World } from "./types";
import { clamp } from "./economy";
import { addLog } from "./log";
import { t } from "../i18n";
import { PARTEI_NAME } from "./fraktionen";
import { versorgungsStimmen, versorgungsReaktionsDelta, versorgungsBruchrisiken, auslaufendeVersorgungsDuldungen, VERSORGUNGS_KLAUSELN, type VersorgungsKlausel, type VersorgungsStimme, type VersorgungsBruchrisiko } from "./versorgungsmehrheit";
import { versorgungsKonditionen, versorgungsKlauselnGrund, versorgungsVorlageHindernis, versorgungsAenderungsTermin, type VersorgungsProgramm, type VersorgungsVorlage, type RegierungsReaktion } from "./versorgungspolitik";

export interface VersorgungsWeg {
  programm:VersorgungsProgramm; vorlage:string;
  klauseln:VersorgungsKlausel[]; hinzu:VersorgungsKlausel[]; entfernt:VersorgungsKlausel[];
  gespraeche:string[]; pk:number; abstimmung:number; verschiebung:number;
  stimmen: (VersorgungsStimme & { vorher:number; delta:number })[];
  ja:number; vorher:number; delta:number; fehlt:number; puffer:number;
  konditionen:ReturnType<typeof versorgungsKonditionen>; budgetDelta:number;
  reaktionen:RegierungsReaktion[]; koalitionsLast:number;
  duldungen:{partei:string;bis:number}[];
  bruchrisiken:VersorgungsBruchrisiko[];
  schwerpunkt:"minimal"|"koalition"|"budget"|"stimmen";
  stand:string;
}
const summe=(s:VersorgungsStimme[])=>s.reduce((sum,f)=>sum+f.ja,0);

/** Nur lesen: auch noch nicht initialisierte Fraktionen werden durch die Beratung nicht angelegt. */
export function versorgungsReaktionsVorschau(w:World,stimmen:VersorgungsStimme[],angenommen=true):RegierungsReaktion[] {
  return stimmen.flatMap(f=>{
    const delta=versorgungsReaktionsDelta(f,angenommen);
    if(!delta) return [];
    return [{partei:f.partei,bereitschaft:clamp(f.bereitschaft+delta,0,100)-f.bereitschaft,
      personen:(w.spiel?.figuren??[]).filter(p=>p.amt==="partner" && p.imAmt && p.partei===f.partei && w.spiel!.lager.includes(f.partei))
        .flatMap(p=>{const d=clamp(p.loyalitaet+delta,0,100)-p.loyalitaet;return d?[{name:p.name,loyalitaet:d}]:[];})}];
  });
}

/** Derselbe reine Rechner prüft die Vorschläge und später die atomare Übernahme. */
function bewerte(w:World,v:VersorgungsVorlage,klauseln:VersorgungsKlausel[],gespraeche:string[]):VersorgungsWeg|undefined {
  if(v.status!=="offen" || w.day>=v.abstimmung || !w.spiel || versorgungsKlauselnGrund(w,klauseln)) return;
  if(new Set(gespraeche).size!==gespraeche.length || gespraeche.some(p=>p===w.player?.partei.kurz || !(w.parliament?.seats[p]) || v.gespraeche.includes(p))) return;
  if(w.spiel.kapital<gespraeche.length) return;
  const hinzu=klauseln.filter(k=>!v.klauseln.includes(k)), entfernt=v.klauseln.filter(k=>!klauseln.includes(k));
  if(!hinzu.length && !entfernt.length && !gespraeche.length) return;
  const abstimmung=hinzu.length||entfernt.length?versorgungsAenderungsTermin(w,v.abstimmung):v.abstimmung;
  const e={...v,klauseln,gespraeche:[...v.gespraeche,...gespraeche],abstimmung};
  if(versorgungsVorlageHindernis(w,e)) return;
  const bisher=versorgungsStimmen(w,v,v.abstimmung), vorher=summe(bisher);
  const stimmen=versorgungsStimmen(w,e,abstimmung).map(f=>{const alt=bisher.find(p=>p.partei===f.partei)?.ja??0;return {...f,vorher:alt,delta:f.ja-alt};});
  const ja=summe(stimmen), konditionen=versorgungsKonditionen(e), reaktionen=versorgungsReaktionsVorschau(w,stimmen);
  // Auch ein Partner ohne benannte Spielfigur verliert Bereitschaft. Keine unsichtbare Koalitionsbelohnung.
  const koalitionsLast=reaktionen.filter(r=>stimmen.some(f=>f.partei===r.partei && f.rolle==="koalition"))
    .reduce((s,r)=>s+Math.max(0,-r.bereitschaft)+r.personen.reduce((n,p)=>n+Math.max(0,-p.loyalitaet),0),0);
  const weg:VersorgungsWeg={programm:v.programm,vorlage:v.id,klauseln:[...klauseln],hinzu,entfernt,gespraeche:[...gespraeche],pk:gespraeche.length,
    abstimmung,verschiebung:abstimmung-v.abstimmung,stimmen,ja,vorher,delta:ja-vorher,fehlt:Math.max(0,301-ja),puffer:Math.max(0,ja-301),
    konditionen,budgetDelta:konditionen.bip-versorgungsKonditionen(v).bip,reaktionen,koalitionsLast,
    duldungen:auslaufendeVersorgungsDuldungen(w,abstimmung),bruchrisiken:versorgungsBruchrisiken(w,stimmen,abstimmung),schwerpunkt:"stimmen",stand:""};
  // Keine Teilbuchung nach überholter Anzeige: Basis, Frist, Preis und sichtbare Folgen müssen noch stimmen.
  weg.stand=JSON.stringify({tag:w.day,kapital:w.spiel.kapital,basis:{id:v.id,klauseln:v.klauseln,gespraeche:v.gespraeche,abstimmung:v.abstimmung},
    kurs:w.spiel.gueter?.prioritaet,kursAb:w.spiel.gueter?.regierung?.kursAb,weg});
  return weg;
}

/** Maximal 32 Klauselsätze. Gespräche wirken unabhängig; zuerst die mit dem größten echten Stimmengewinn. */
export function versorgungsMehrheitsWege(w:World,programm:VersorgungsProgramm):VersorgungsWeg[] {
  const v=w.spiel?.gueter?.regierung?.vorlagen?.[programm];
  if(!v || v.status!=="offen" || w.day>=v.abstimmung) return [];
  const basis=versorgungsStimmen(w,v,v.abstimmung), vorher=summe(basis), ziel=vorher>=301?vorher+10:301;
  const wege:VersorgungsWeg[]=[];
  for(let maske=0;maske<1<<VERSORGUNGS_KLAUSELN.length;maske++) {
    const klauseln=VERSORGUNGS_KLAUSELN.filter((_,i)=>maske&(1<<i));
    if(versorgungsKlauselnGrund(w,klauseln)) continue;
    const geaendert=klauseln.length!==v.klauseln.length||klauseln.some(k=>!v.klauseln.includes(k));
    const tag=geaendert?versorgungsAenderungsTermin(w,v.abstimmung):v.abstimmung;
    const e={...v,klauseln};
    if(versorgungsVorlageHindernis(w,e)) continue;
    const ohne=versorgungsStimmen(w,e,tag), neu:string[]=[];
    const moegliche=ohne.filter(f=>f.rolle!=="eigene"&&!v.gespraeche.includes(f.partei)).map(f=>({partei:f.partei,
      gewinn:(versorgungsStimmen(w,{...e,gespraeche:[...e.gespraeche,f.partei]},tag).find(p=>p.partei===f.partei)!.ja)-f.ja}))
      .filter(f=>f.gewinn>0).sort((a,b)=>b.gewinn-a.gewinn||a.partei.localeCompare(b.partei));
    const start=bewerte(w,v,klauseln,neu);if(start) wege.push(start);
    let ja=summe(ohne);
    for(const f of moegliche) {
      if(ja>=ziel || neu.length>=Math.floor(w.spiel!.kapital)) break;
      neu.push(f.partei);ja+=f.gewinn;
      const weg=bewerte(w,v,klauseln,neu);if(weg) wege.push(weg);
    }
  }
  const alteLast=versorgungsReaktionsVorschau(w,basis).filter(r=>basis.some(f=>f.partei===r.partei&&f.rolle==="koalition"))
    .reduce((s,r)=>s+Math.max(0,-r.bereitschaft)+r.personen.reduce((n,p)=>n+Math.max(0,-p.loyalitaet),0),0);
  const sinnvoll=wege.filter(p=>p.delta>0 || (p.ja>=301 && (p.koalitionsLast<alteLast || p.budgetDelta<0)) || !!versorgungsVorlageHindernis(w,v));
  const erfolg=sinnvoll.filter(p=>p.ja>=301);
  const pool=erfolg.length?erfolg:sinnvoll.filter(p=>p.delta>0);
  const auswahl:VersorgungsWeg[]=[];
  const aufwand=(p:VersorgungsWeg)=>p.hinzu.length+p.entfernt.length;
  const gleich=(a:VersorgungsWeg,b:VersorgungsWeg)=>a.klauseln.join()===b.klauseln.join();
  const add=(schwerpunkt:VersorgungsWeg["schwerpunkt"],vergleich:(a:VersorgungsWeg,b:VersorgungsWeg)=>number)=>{
    const p=[...pool].sort((a,b)=>vergleich(a,b)||b.ja-a.ja||a.klauseln.join().localeCompare(b.klauseln.join()))[0];
    if(p && !auswahl.some(a=>gleich(a,p))) auswahl.push({...p,schwerpunkt});
  };
  if(!erfolg.length) add("stimmen",(a,b)=>b.ja-a.ja||aufwand(a)-aufwand(b)||a.pk-b.pk);
  else add("minimal",(a,b)=>aufwand(a)-aufwand(b)||a.pk-b.pk||a.koalitionsLast-b.koalitionsLast);
  add("koalition",(a,b)=>a.koalitionsLast-b.koalitionsLast||a.pk-b.pk||aufwand(a)-aufwand(b));
  add("budget",(a,b)=>a.konditionen.bip-b.konditionen.bip||aufwand(a)-aufwand(b)||a.pk-b.pk);
  if(auswahl.length<3) add("stimmen",(a,b)=>b.ja-a.ja||aufwand(a)-aufwand(b)||a.pk-b.pk);
  return auswahl;
}

/** Ein Klick übernimmt nur den überprüften Entwurf und führt die genannten Gespräche. Das Votum bleibt offen. */
export function uebernehmeVersorgungsWeg(w:World,weg:VersorgungsWeg):{ok:boolean;text:string} {
  const v=w.spiel?.gueter?.regierung?.vorlagen?.[weg.programm];
  if(!v || v.id!==weg.vorlage || v.status!=="offen" || w.day>=v.abstimmung) return {ok:false,text:t("mandat.nichtOffen")};
  const aktuell=bewerte(w,v,weg.klauseln,weg.gespraeche);
  if(!aktuell || aktuell.stand!==weg.stand) return {ok:false,text:t("mehrheitsweg.veraltet")};
  v.klauseln=[...aktuell.klauseln];v.gespraeche.push(...aktuell.gespraeche);v.abstimmung=aktuell.abstimmung;
  w.spiel!.kapital-=aktuell.pk;
  const text=t("mehrheitsweg.uebernommen",{name:t(`regierung.${v.programm}.titel`),ja:aktuell.ja,pk:aktuell.pk,
    klauseln:v.klauseln.map(k=>t(`mandat.${k}.titel`)).join(", ")||t("mehrheitsweg.ohneKlauseln"),
    parteien:aktuell.gespraeche.map(p=>PARTEI_NAME[p]??p).join(", ")||t("mehrheitsweg.keineGespraeche")});
  addLog(w,"entscheidung",text);return {ok:true,text};
}
