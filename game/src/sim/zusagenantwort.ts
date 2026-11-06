// Erinnerungsantworten verwenden dieselben Handlungen wie die Zusagenakte. Die Vorschau bucht nur auf einer Kopie.
import type { World } from "./types";
import type { OffenesEreignis } from "./spiel-typen";
import type { Option } from "./ereignis-hilfen";
import { loeseEin, vertroesteFrei, brecheFrei, zusageVorhaben } from "./zusagen";
import { aktiveParteivorsitzende, KOALITIONSBRUCH_LOYALITAET, naechsteKoalitionspruefung, regierungsSitze } from "./koalitionslage";
import { zusagenDruck } from "./zusagendruck";
import { istMinisterienZusage, naechsteRessorts } from "./ressortvergabe";
import { startBereitschaft } from "./fraktionen";
import { eigenVon } from "./personen";
import { gesetzSicht } from "./handeln";
import { nationalAverage } from "./netz";
import { NET } from "./modell";
import { addDays, formatDateDe } from "./dates";
import { t, zahl } from "../i18n";

const ARTEN=["erfuellen","vertroesten","brechen"] as const;
type Art=typeof ARTEN[number];
const wert=(w:World,id:string)=>nationalAverage(NET,w.net,id);
const bereit=(w:World,p:string)=>w.spiel?.fraktionen?.[p]?.bereitschaft??startBereitschaft(w,p);
const delta=(n:number)=>`${n>0?"+":""}${zahl(n,2)}`;
const loyal=(n:number)=>n<20&&Math.round(n*100)/100>=20?`< ${zahl(20,0)}`:zahl(n,2);
const datum=(w:World,tag:number)=>formatDateDe(addDays(w.date,tag-w.day));

export function aktuelleErinnerungsZusage(w:World,ev:OffenesEreignis) {
  const z=w.spiel?.zusagen.find(z=>z.id===String(ev.daten?.zusage));
  return z&&!z.erfuellt&&!z.gebrochen&&z.abgeschlossen===undefined&&z.faellig<=w.day&&!w.spiel?.ende?z:undefined;
}
function ausfuehren(w:World,ev:OffenesEreignis,art:Art) {
  const z=aktuelleErinnerungsZusage(w,ev);
  if(!z)return {ok:false,text:t("ze.veraltet")};
  // Zusage „zwei Ministerien“ (N1, Befund C-6): Die Vorschau dieser Antwort nennt beide Wechsel mit Namen („A → B“); eine eigene Wahl gibt es im Reiter Zusagen.
  const wahl=istMinisterienZusage(z)?naechsteRessorts(w,z.von,2):undefined;
  return art==="erfuellen"?loeseEin(w,z,wahl):art==="vertroesten"?vertroesteFrei(w,z):brecheFrei(w,z);
}

export function zusagenErinnerungsAntwort(w:World,ev:OffenesEreignis,id:string):Option|undefined {
  if(!ARTEN.includes(id as Art))return;
  const art=id as Art,z=aktuelleErinnerungsZusage(w,ev);
  const wirkung=(ww:World)=>ausfuehren(ww,ev,art).text;
  if(!z)return {id,label:t(`ze.${art}`),pk:0,beschreibung:t("ze.veraltet"),sperre:t("ze.veraltet"),wirkung};
  const k=structuredClone(w),sp=k.spiel!,zk=sp.zusagen.find(x=>x.id===z.id)!;
  const vorhaben=zusageVorhaben(k,zk),kapital=sp.kapital,auf=sp.verfassung?.aufmerksamkeit??80;
  const vertrauen=wert(k,"vertrauen_regierung"),legitimitaet=wert(k,"legitimitaet"),bereitschaft=bereit(k,z.von);
  const vorher=sp.figuren.map(f=>({id:f.id,name:f.name,loyalitaet:f.loyalitaet,groll:eigenVon(k,f).groll??0}));
  const r=ausfuehren(k,ev,art);
  const preis=r.ok?kapital-sp.kapital:art==="brechen"?0:art==="vertroesten"?1:vorhaben?(vorhaben.erreicht?0:vorhaben.pr.ok?vorhaben.pr.gesetz.pk:0):4;
  const label=art==="erfuellen"&&vorhaben?t(vorhaben.erreicht?"zusage.gesetz.verbuchen":"zusage.gesetz.aktion"):t(`ze.${art}`);
  if(!r.ok)return {id,label,pk:0,anzeigePk:preis,beschreibung:r.text,sperre:r.text,wirkung};
  const aufmerksamkeit=auf-(sp.verfassung?.aufmerksamkeit??80);
  const bedingungen=[t("vn.preis",{pk:zahl(preis,1),aufmerksamkeit:zahl(aufmerksamkeit,0)})];
  if(art==="vertroesten")bedingungen.push(t("zw.neueFrist",{datum:datum(w,zk.faellig)}),t("ze.verbleibend",{n:Math.max(0,2-(zk.vertroestet??0))}));
  if(art==="erfuellen"&&!zk.erfuellt){
    const g=sp.gesetze.find(g=>g.massnahme===zk.massnahme);
    if(g){
      const votum=gesetzSicht({...k,day:g.abstimmung,date:addDays(k.date,g.abstimmung-k.day)},g);
      bedingungen.push(t("zw.entwurf",{datum:datum(w,g.abstimmung),ja:votum.ja}),t("zusage.gesetz.fristDanach",{datum:datum(w,zk.faellig)}),t("zusage.gesetz.belohnung"));
    }
  }
  const sofortfolgen=[t("ze.vertrauen",{vertrauen:delta(wert(k,"vertrauen_regierung")-vertrauen),legitimitaet:delta(wert(k,"legitimitaet")-legitimitaet)})];
  if(w.parliament?.seats[z.von]!==undefined)sofortfolgen.push(t("ze.bereitschaft",{partei:z.von,vor:zahl(bereitschaft,2),nach:zahl(bereit(k,z.von),2)}));
  for(const f of sp.figuren){
    const vor=vorher.find(p=>p.id===f.id);
    if(vor&&(vor.loyalitaet!==f.loyalitaet||vor.name!==f.name||(f.eigen?.groll??0)!==vor.groll)){
      sofortfolgen.push(t("ze.person",{name:vor.name===f.name?f.name:`${vor.name} → ${f.name}`,vor:loyal(vor.loyalitaet),nach:loyal(f.loyalitaet),groll:delta((f.eigen?.groll??0)-vor.groll)}));
    }
  }
  const koalition=sp.lager.includes(z.von)&&z.von!==w.player?.partei.kurz;
  const vorsitz=aktiveParteivorsitzende(k,z.von),nach=vorsitz.length?Math.min(...vorsitz.map(f=>f.loyalitaet)):undefined;
  const druck=zusagenDruck(k,z.von);
  const warnungen:string[]=[];
  if(koalition&&nach!==undefined&&nach<KOALITIONSBRUCH_LOYALITAET)warnungen.push(t("ze.akut",{n:loyal(nach),datum:formatDateDe(naechsteKoalitionspruefung(w.date)),sitze:w.parliament?.seats[z.von]??0,rest:regierungsSitze(w,z.von)}));
  if(druck){
    bedingungen.push(t("zd.summe",{n:druck.erinnerungen.length,datum:formatDateDe(druck.pruefung),vor:loyal(druck.loyalitaet),nach:loyal(druck.nachVerfall)}));
    const e=druck.erinnerungen[0]!;
    bedingungen.push(t("ze.weitereFrist",{datum:formatDateDe(e.datum)}));
    if(druck.bruch)warnungen.push(t("zd.bruch",{sitze:druck.sitze,rest:druck.ohne}));
  }
  if(sp.kapital<0)warnungen.push(t("vn.aufPump",{n:zahl(sp.kapital,1)}));
  if((sp.verfassung?.aufmerksamkeit??80)<20)warnungen.push(t("vn.erschoepfung",{n:zahl(sp.verfassung?.aufmerksamkeit??80,0)}));
  return {id,label,pk:0,anzeigePk:preis,aufmerksamkeit,beschreibung:art==="erfuellen"?r.text:t(`ze.${art}Text`),bedingungen,sofortfolgen,
    ...(warnungen.length?{warnung:warnungen.join(" ")} : {}),wirkung};
}
export function zusagenErinnerungsAntworten(w:World,ev:OffenesEreignis):Option[] {
  return ARTEN.map(id=>zusagenErinnerungsAntwort(w,ev,id)!);
}
