import type { World } from "./types";
import { addDays } from "./dates";
import { t } from "../i18n";
import { startBereitschaft } from "./fraktionen";
import { zusagenDruck } from "./zusagendruck";
import { aktiverKoalitionsVorsitz, drohtKoalitionsbruch, KOALITIONSBRUCH_LOYALITAET, KOALITIONSWARNUNG_LOYALITAET, naechsteKoalitionspruefung, regierungsSitze } from "./koalitionslage";
import { energiePartnerHindernis, versorgungsKonditionen, type VersorgungsProgramm, type VersorgungsVorlage } from "./versorgungspolitik";
import { versorgungsReaktionsDelta, type VersorgungsKlausel } from "./versorgungsmehrheit";

import { koalitionsHilfePlan, stabilisiereKoalition, type KoalitionsHilfePlan, type Stabilisierung } from "./koalitionshilfe";
export type { Stabilisierung } from "./koalitionshilfe";
export interface StabilisierungsPlan extends KoalitionsHilfePlan { programm:VersorgungsProgramm;vorlage:string; }
const bereitschaft=(w:World,p:string)=>w.spiel?.fraktionen?.[p]?.bereitschaft??startBereitschaft(w,p);
const abgeschlossen=(v:VersorgungsVorlage|undefined)=>v && (v.status==="angenommen"||v.status==="abgelehnt");
const datum=(w:World,tag:number)=>addDays(w.date,tag-w.day);

/** Den jüngsten Beschluss drei Tage lang zeigen, bei akuter Bruchgefahr auch später. */
export function oeffneVersorgungsNachsorge(w:World,programm:VersorgungsProgramm):boolean {
  const neueste=Object.values(w.spiel?.gueter?.regierung?.vorlagen??{}).filter(v=>abgeschlossen(v))
    .sort((a,b)=>(b.erledigt??b.abstimmung)-(a.erledigt??a.abstimmung)||a.id.localeCompare(b.id))[0];
  return neueste?.programm===programm && (w.day<=(neueste.erledigt??neueste.abstimmung)+3 || !!w.spiel?.figuren.some(f=>drohtKoalitionsbruch(w,f)));
}

/** Beschlossene Bedingungen bleiben historische Daten. Fortschritt und Bruchgefahr kommen aus der heutigen Lage. */
export function versorgungsNachsorge(w:World,programm:VersorgungsProgramm) {
  const reg=w.spiel?.gueter?.regierung,v=reg?.vorlagen?.[programm];
  if(!v || !abgeschlossen(v)) return;
  const r=versorgungsKonditionen(v),tag=v.erledigt??v.abstimmung;
  const beschluss=v.status==="angenommen"?(v.beschluss??{ab:tag+r.vorlauf,bis:tag+r.vorlauf+r.dauer,bip:r.bip}):undefined;
  const auftrag=reg?.programme[programm];
  const passt=!!beschluss && !!auftrag && (auftrag.vorlage?auftrag.vorlage===v.id:auftrag.ab===beschluss.ab&&auftrag.bis===beschluss.bis);
  const phase=!beschluss?"keinAuftrag":w.day>=beschluss.bis?"beendet":!passt?"fehlt":w.day<beschluss.ab?"vorbereitung":"aktiv";
  const hindernis=phase==="aktiv"&&auftrag?.partner?energiePartnerHindernis(w,auftrag.partner):undefined;
  const pflichten=(beschluss?v.klauseln:[]).map(k=>{
    const kurs=k==="zivil"?"zivil":k==="einsatz"?"militaer":undefined;
    const ab=kurs?tag:beschluss!.ab;
    const abweichung=w.day<beschluss!.bis && (!passt || (kurs && (w.spiel?.gueter?.prioritaet!==kurs || (reg?.kursAb??0)<beschluss!.bis)));
    return {klausel:k,ab,bis:beschluss!.bis,status:abweichung?"abweichend":w.day>=beschluss!.bis?"beendet":w.day<ab?"vorbereitung":"verbindlich",
      parteien:(v.stimmen??[]).filter(f=>f.erfuellt&&f.forderung===k).map(f=>f.partei)};
  });
  const gegensatz:Partial<Record<VersorgungsKlausel,VersorgungsKlausel>>={sozial:"haushalt",haushalt:"sozial",zivil:"einsatz",einsatz:"zivil"};
  const unzufrieden=(v.stimmen??[]).filter(f=>versorgungsReaktionsDelta(f,v.status==="angenommen")<0).map(f=>({
    ...f,reaktion:v.reaktionen?.find(r=>r.partei===f.partei),
    konflikt:gegensatz[f.forderung] && v.klauseln.includes(gegensatz[f.forderung]!) ? gegensatz[f.forderung] : undefined,
    jetztKoalition:!!w.spiel?.lager.includes(f.partei),
  }));
  const partner=[...new Set(w.spiel?.lager??[])].filter(p=>p!==w.player?.partei.kurz).map(partei=>{
    const personen=(w.spiel?.figuren??[]).filter(f=>f.partei===partei&&aktiverKoalitionsVorsitz(w,f));
    const loyalitaet=personen.length?Math.min(...personen.map(f=>f.loyalitaet)):undefined;
    return {partei,druck:zusagenDruck(w,partei),personen:personen.map(f=>({id:f.id,name:f.name,loyalitaet:f.loyalitaet})),loyalitaet,
      risiko:loyalitaet===undefined?"unbekannt":loyalitaet<KOALITIONSBRUCH_LOYALITAET?"akut":loyalitaet<KOALITIONSWARNUNG_LOYALITAET?"gefaehrdet":"ruhig",
      sitze:w.parliament?.seats[partei]??0,ohne:regierungsSitze(w,partei),bereitschaft:bereitschaft(w,partei),
      zusagen:(w.spiel?.zusagen??[]).filter(z=>z.von===partei&&!z.erfuellt&&!z.gebrochen)};
  }).sort((a,b)=>(a.loyalitaet??100)-(b.loyalitaet??100));
  const bericht=reg?.bericht;
  // Ein auch damals zufriedener Partner kann inzwischen aus anderen Gründen ausgeschieden sein.
  const ausgeschieden=(v.stimmen??[]).filter(f=>f.rolle==="koalition"&&!w.spiel?.lager.includes(f.partei)).map(f=>f.partei);
  const belegt=!!beschluss && bericht?.nachweis?.entscheidungen.some(e=>e.id===programm&&e.status==="aktiv"&&e.ab===datum(w,beschluss.ab)&&e.bis===datum(w,beschluss.bis));
  return {vorlage:v,beschluss,phase,hindernis,pflichten,unzufrieden,partner,ausgeschieden,sitze:regierungsSitze(w),
    pruefung:naechsteKoalitionspruefung(w.date),bericht:belegt?bericht:undefined};
}

/** Versorgung und Schreibtisch nutzen dieselben tatsächlichen Gesprächsregeln. */
export function versorgungsStabilisierungsPlan(w:World,programm:VersorgungsProgramm,partei:string,art:Stabilisierung,figur?:string):StabilisierungsPlan|undefined {
  const v=w.spiel?.gueter?.regierung?.vorlagen?.[programm];
  if(!v || !abgeschlossen(v)) return;
  const hilfe=koalitionsHilfePlan(w,partei,art,figur);if(!hilfe) return;
  return {...hilfe,programm,vorlage:v.id,stand:JSON.stringify({vorlage:v.id,status:v.status,gespraech:hilfe.stand})};
}

export function stabilisiereVersorgungsKoalition(w:World,angebot:StabilisierungsPlan):{ok:boolean;text:string} {
  const aktuell=versorgungsStabilisierungsPlan(w,angebot.programm,angebot.partei,angebot.art,angebot.figur);
  if(!aktuell || !aktuell.moeglich || aktuell.stand!==angebot.stand) return {ok:false,text:t("vn.veraltet")};
  const hilfe=koalitionsHilfePlan(w,aktuell.partei,aktuell.art,aktuell.figur)!;
  const r=stabilisiereKoalition(w,hilfe);
  if(!r.ok) return r;
  const v=w.spiel!.gueter!.regierung!.vorlagen![aktuell.programm]!;
  const {tag,partei,art,pk,bereitschaft,personen,vertrauen}=aktuell;
  (v.nachsorge??=[]).push({tag,partei,art,pk,bereitschaft,personen,vertrauen});
  v.nachsorge=v.nachsorge.slice(-8);
  return {ok:true,text:t("vn.gebucht",{partei,pk})};
}
