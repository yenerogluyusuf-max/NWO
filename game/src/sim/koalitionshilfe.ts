import type { World } from "./types";
import { addDays } from "./dates";
import { t } from "../i18n";
import { verhandle, VERHANDLUNG } from "./verhandeln";
import { startBereitschaft } from "./fraktionen";
import { fuehreGespraech, GESPRAECH_ABKUEHLUNG, MAX_TERMINE } from "./gespraeche";
import { eigenVon } from "./personen";
import { AUFMERKSAMKEIT_KOSTEN } from "./aufmerksamkeit";
import { Rng } from "./rng";
import { kannZahlen, UEBERZIEHUNG } from "./kapital";
import { nationalAverage } from "./netz";
import { NET } from "./modell";
import { aktiverKoalitionsVorsitz } from "./koalitionslage";
import { zusagenDruck, type ZusagenDruckLage } from "./zusagendruck";

export type Stabilisierung = "fraktion" | "vertrauen" | "rueckendeckung";
export interface KoalitionsHilfePlan {
  partei: string; art: Stabilisierung; figur?: string; tag: number; pk: number;
  personen: {id:string;name:string;vorher:number;nachher:number}[];
  bereitschaft:number;vertrauen:number;
  aufmerksamkeit:number;moeglich:boolean;grund?:string;stand:string;
  kapitalDanach:number;aufmerksamkeitDanach:number;
  groll:number;ehrgeiz:number;
  druck?:ZusagenDruckLage;
}
const bereitschaft=(w:World,p:string)=>w.spiel?.fraktionen?.[p]?.bereitschaft??startBereitschaft(w,p);
const vertrauen=(w:World)=>nationalAverage(NET,w.net,"vertrauen_regierung");
const datum=(w:World,tag:number)=>addDays(w.date,tag-w.day);

function ausfuehren(w:World,partei:string,art:Stabilisierung,figur?:string):{ok:boolean;text:string} {
  if(art==="fraktion") return verhandle(w,partei,"gespraech",new Rng(w.rngState));
  if(!figur || !["vertrauen","rueckendeckung"].includes(art)) return {ok:false,text:t("vn.nichtMoeglich")};
  return fuehreGespraech(w,figur,"sorge",art);
}

/** Übersetzt die vorhandenen Sperren; die Entscheidung selbst bleibt beim Gesprächssystem. */
function gespraechsGrund(w:World,partei:string,art:Stabilisierung,figur:string,rueckfall:string):string {
  const f=w.spiel!.figuren.find(f=>f.id===figur)!;
  const rest=art==="fraktion"?(w.spiel!.fraktionen?.[partei]?.gespraech??-1e9)+VERHANDLUNG.gespraechAbkuehlung-w.day:(f.gespraech??-1e9)+GESPRAECH_ABKUEHLUNG-w.day;
  if(rest>0) return t("vn.sperre",{n:rest});
  if(art!=="fraktion"&&(w.spiel!.termine??[]).filter(tag=>tag>w.day-30).length>=MAX_TERMINE) return t("vn.termine",{n:MAX_TERMINE});
  if(art==="vertrauen"&&f.loyalitaet>=90) return t("vn.hoheLoyalitaet");
  if(art==="rueckendeckung"&&(f.eigen?.groll??0)<20&&f.loyalitaet>=45) return t("vn.keinAnlass");
  if((w.spiel!.verfassung?.pauseBis??0)>w.day) return t("vn.pause",{datum:datum(w,w.spiel!.verfassung!.pauseBis!)});
  if(!kannZahlen(w.spiel!.kapital,1)) return t("vn.kapitalGrenze",{n:UEBERZIEHUNG});
  return rueckfall;
}

/** Die vorhandenen Gesprächsregeln werden auf einer Kopie ausgeführt: Preis und sämtliche Personenfolgen sind identisch. */
export function koalitionsHilfePlan(w:World,partei:string,art:Stabilisierung,figur?:string):KoalitionsHilfePlan|undefined {
  if(w.spiel?.ende || !w.spiel?.lager.includes(partei) || partei===w.player?.partei.kurz || !(w.parliament?.seats[partei])) return;
  const vorsitz=w.spiel.figuren.filter(f=>f.partei===partei&&aktiverKoalitionsVorsitz(w,f)).sort((a,b)=>a.loyalitaet-b.loyalitaet||a.id.localeCompare(b.id));
  const ziel=figur?vorsitz.find(f=>f.id===figur):vorsitz[0];
  if(!ziel || !["fraktion","vertrauen","rueckendeckung"].includes(art)) return;
  const kopie=structuredClone(w),kapital=kopie.spiel!.kapital,bereit=bereitschaft(kopie,partei),vertrauenVor=vertrauen(kopie);
  const profil=art==="fraktion"?undefined:eigenVon(kopie,kopie.spiel!.figuren.find(f=>f.id===ziel.id)!);
  const grollVor=profil?.groll??0,ehrgeizVor=profil?.ehrgeiz??0;
  // Die Initialisierung älterer Personenprofile und Fraktionsforderungen bleibt auf der Vergleichskopie.
  const vorher=w.spiel.figuren.map(f=>({id:f.id,name:f.name,loyalitaet:f.loyalitaet}));
  const ergebnis=ausfuehren(kopie,partei,art,ziel.id);
  const neu=kopie.spiel!.figuren.find(f=>f.id===ziel.id)!;
  const plan:KoalitionsHilfePlan={partei,art,figur:ziel.id,tag:w.day,pk:ergebnis.ok?kapital-kopie.spiel!.kapital:1,
    aufmerksamkeit:art==="fraktion"?AUFMERKSAMKEIT_KOSTEN.verhandlungGespraech:AUFMERKSAMKEIT_KOSTEN.gespraech,
    moeglich:ergebnis.ok,grund:ergebnis.ok?undefined:gespraechsGrund(kopie,partei,art,ziel.id,ergebnis.text),stand:"",bereitschaft:ergebnis.ok?bereitschaft(kopie,partei)-bereit:0,
    kapitalDanach:kopie.spiel!.kapital,aufmerksamkeitDanach:kopie.spiel!.verfassung?.aufmerksamkeit??80,
    personen:ergebnis.ok?vorher.flatMap(f=>{const jetzt=kopie.spiel!.figuren.find(p=>p.id===f.id)?.loyalitaet??f.loyalitaet;return jetzt!==f.loyalitaet?[{id:f.id,name:f.name,vorher:f.loyalitaet,nachher:jetzt}]:[];}):[],
    vertrauen:ergebnis.ok?vertrauen(kopie)-vertrauenVor:0,
    groll:ergebnis.ok&&art!=="fraktion"?(neu.eigen?.groll??0)-grollVor:0,
    ehrgeiz:ergebnis.ok&&art!=="fraktion"?(neu.eigen?.ehrgeiz??0)-ehrgeizVor:0,
    druck:ergebnis.ok?zusagenDruck(kopie,partei):undefined};
  plan.stand=JSON.stringify({tag:w.day,datum:w.date,kapital:w.spiel.kapital,lager:w.spiel.lager,sitze:w.parliament?.seats,
    aufmerksamkeit:w.spiel.verfassung,personen:vorher,plan});
  return plan;
}

/** Kosten, Sperren und Folgen vor dem Buchen erneut prüfen; veraltete Angebote ändern nichts. */
export function stabilisiereKoalition(w: World, angebot: KoalitionsHilfePlan): {ok:boolean;text:string} {
  const aktuell = koalitionsHilfePlan(w, angebot.partei, angebot.art, angebot.figur);
  if (!aktuell || !aktuell.moeglich || aktuell.stand !== angebot.stand) return {ok:false,text:t("vn.veraltet")};
  return ausfuehren(w, aktuell.partei, aktuell.art, aktuell.figur);
}
