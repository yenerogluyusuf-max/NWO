// Gefährdete Fraktionszusagen auf dem Regierungsschreibtisch. Vorschauen bleiben auf Vergleichskopien.
import type { World } from "./types";
import { zusageVorhaben, loeseEin, vertroesteFrei } from "./zusagen";
import { aktiveParteivorsitzende, KOALITIONSBRUCH_LOYALITAET, KOALITIONSWARNUNG_LOYALITAET, naechsteKoalitionspruefung, regierungsSitze } from "./koalitionslage";
import { gesetzSicht } from "./handeln";
import { startBereitschaft } from "./fraktionen";
import { nationalAverage } from "./netz";
import { eigenVon } from "./personen";
import { NET } from "./modell";
import { addDays } from "./dates";
import { t } from "../i18n";
import { zusagenDruck, ZUSAGEN_VERFALL_LOYALITAET } from "./zusagendruck";

const bereit = (w:World,p:string) => w.spiel?.fraktionen?.[p]?.bereitschaft ?? startBereitschaft(w,p);
const vertrauen = (w:World) => nationalAverage(NET,w.net,"vertrauen_regierung");
export type ZusagenSchritt = "einloesen" | "vertroesten";

/** Fälligkeit ist kein automatischer Austritt: Erinnerungsfrist und Monatsprüfung werden getrennt ausgewiesen. */
export function gefaehrdeteZusagen(world: World) {
  if (!world.spiel || world.spiel.ende) return [];
  const w = structuredClone(world), sp = w.spiel!;
  const druck = new Map([...new Set(sp.lager)].map(p => [p, zusagenDruck(w,p)]));
  return sp.zusagen.filter(z => !z.erfuellt && !z.gebrochen && w.parliament?.seats[z.von] !== undefined).map(z => {
    const koalition = z.von !== w.player?.partei.kurz && sp.lager.includes(z.von);
    const rolle = z.von === w.player?.partei.kurz ? "eigene" : koalition ? "koalition" : (sp.fraktionen?.[z.von]?.duldungBis ?? -1) > w.day ? "duldung" : "opposition";
    const vorsitz = aktiveParteivorsitzende(w,z.von).map(f => ({id:f.id,name:f.name,loyalitaet:f.loyalitaet}));
    const loyalitaet = vorsitz.length ? Math.min(...vorsitz.map(f=>f.loyalitaet)) : undefined;
    const akut = koalition && loyalitaet !== undefined && loyalitaet < KOALITIONSBRUCH_LOYALITAET;
    const wenigRueckhalt = koalition && loyalitaet !== undefined && loyalitaet < KOALITIONSWARNUNG_LOYALITAET;
    const erinnerung = z.faellig <= w.day ? sp.ereignisse.filter(e=>e.vorlage==="zusage" && e.daten?.zusage===z.id).sort((a,b)=>a.frist-b.frist)[0] : undefined;
    const v = zusageVorhaben(w,z);
    // Bereits bekannte Duldungsfristen gelten auch in der Gesetzesprognose am vorgesehenen Termin.
    const votumWelt = v?.gesetz ? {...w,day:v.gesetz.abstimmung,date:addDays(w.date,v.gesetz.abstimmung-w.day)} : w;
    const stimmen = v?.gesetz ? gesetzSicht(votumWelt,v.gesetz) : undefined;
    const tage = z.faellig - w.day;
    const teil = !!v?.gesetz && !v.decktZiel && !v.erreicht;
    const mehrheit = !v?.erreicht && !!stimmen && stimmen.ja < 309;
    const zuSpaet = !v?.erreicht && !!v?.gesetz && v.gesetz.abstimmung >= (erinnerung?.frist ?? z.faellig + 1);
    const fristdruck = druck.get(z.von);
    const gruende = [akut ? "akut" : wenigRueckhalt ? "rueckhalt" : null, fristdruck?.bruch ? "fristfolge" : null, erinnerung ? "erinnerung" : tage<=45 ? "frist" : null, teil ? "teil" : null, mehrheit ? "mehrheit" : null, zuSpaet ? "spaet" : null].filter((g):g is string=>!!g);
    return {z,partei:z.von,rolle,koalition,vorsitz,loyalitaet,akut,wenigRueckhalt,tage,erinnerung,
      pruefung:naechsteKoalitionspruefung(w.date),sitze:w.parliament?.seats[z.von]??0,ohne:regierungsSitze(w,z.von),
      druck:fristdruck,nachVerfall:loyalitaet===undefined?undefined:Math.max(0,loyalitaet-ZUSAGEN_VERFALL_LOYALITAET),
      gesetz:v?{id:v.id,ziel:v.ziel,erreicht:v.erreicht,decktZiel:v.decktZiel,entwurf:v.gesetz,ja:stimmen?.ja,luecke:stimmen?.luecke}:undefined,
      gruende,gewicht:(akut?100:0)+(fristdruck?.bruch?40:0)+(erinnerung&&erinnerung.frist-w.day<=7?50:0)+(tage<0?30:tage<=14?20:0)+(wenigRueckhalt?10:0)};
  }).filter(s=>s.gruende.length>0).sort((a,b)=>b.gewicht-a.gewicht || (a.erinnerung?.frist??a.z.faellig)-(b.erinnerung?.frist??b.z.faellig) || a.z.id.localeCompare(b.z.id));
}
export type ZusagenWarnung = ReturnType<typeof gefaehrdeteZusagen>[number];

function ausfuehren(w:World,id:string,art:ZusagenSchritt) {
  const z=w.spiel?.zusagen.find(z=>z.id===id);
  if(!z || z.erfuellt || z.gebrochen || w.spiel?.ende) return {ok:false,text:t("sim2.sim.zusagen.fd45097")};
  return art==="einloesen"?loeseEin(w,z):vertroesteFrei(w,z);
}

/** Tatsächliche Sofortfolgen und der konkrete Abstimmungstermin, keine erfundene Vorabbelohnung. */
export function zusagenSchrittPlan(w:World,id:string,art:ZusagenSchritt) {
  const z=w.spiel?.zusagen.find(z=>z.id===id);
  if(!z || z.erfuellt || z.gebrochen || w.spiel?.ende || !["einloesen","vertroesten"].includes(art)) return;
  const k=structuredClone(w),sp=k.spiel!,kapital=sp.kapital,aufmerksamkeit=sp.verfassung?.aufmerksamkeit??80;
  const vorBereit=bereit(k,z.von),vorVertrauen=vertrauen(k);
  for (const f of sp.figuren) eigenVon(k,f);
  const vorLegitimitaet=nationalAverage(NET,k.net,"legitimitaet");
  const vorher=sp.figuren.map(f=>({id:f.id,name:f.name,loyalitaet:f.loyalitaet,groll:f.eigen?.groll??0}));
  const r=ausfuehren(k,id,art),neu=sp.zusagen.find(x=>x.id===id)!;
  const gesetz=neu.massnahme?sp.gesetze.find(g=>g.massnahme===neu.massnahme):undefined;
  const plan={id,art,partei:z.von,moeglich:r.ok,text:r.text,pk:r.ok?kapital-sp.kapital:0,
    aufmerksamkeit:r.ok?aufmerksamkeit-(sp.verfassung?.aufmerksamkeit??80):0,
    kapitalDanach:sp.kapital,aufmerksamkeitDanach:sp.verfassung?.aufmerksamkeit??80,
    legitimitaet:r.ok?nationalAverage(NET,k.net,"legitimitaet")-vorLegitimitaet:0,
    bereitschaft:r.ok?bereit(k,z.von)-vorBereit:0,vertrauen:r.ok?vertrauen(k)-vorVertrauen:0,
    personen:r.ok?vorher.flatMap(f=>{const n=sp.figuren.find(p=>p.id===f.id)!;return n.loyalitaet!==f.loyalitaet || (n.eigen?.groll??0)!==f.groll ? [{id:f.id,name:n.name,vorherName:f.name,vorher:f.loyalitaet,nachher:n.loyalitaet,groll:(n.eigen?.groll??0)-f.groll}]:[]}):[],
    faelligDanach:neu.faellig,erfuellt:neu.erfuellt,abstimmung:gesetz?.abstimmung,druck:r.ok?zusagenDruck(k,z.von):undefined,stand:""};
  plan.stand=JSON.stringify({tag:w.day,datum:w.date,z,ereignisse:w.spiel?.ereignisse,kapital:w.spiel?.kapital,lager:w.spiel?.lager,sitze:w.parliament?.seats,
    verfassung:w.spiel?.verfassung,fraktionen:w.spiel?.fraktionen,gesetze:w.spiel?.gesetze,personen:vorher,plan});
  return plan;
}
export type ZusagenSchrittPlan = NonNullable<ReturnType<typeof zusagenSchrittPlan>>;
export function fuehreZusagenSchrittAus(w:World,angebot:ZusagenSchrittPlan) {
  const jetzt=zusagenSchrittPlan(w,angebot.id,angebot.art);
  if(!jetzt || !jetzt.moeglich || jetzt.stand!==angebot.stand) return {ok:false,text:t("vn.veraltet")};
  return ausfuehren(w,jetzt.id,jetzt.art);
}
