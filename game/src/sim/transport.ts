import { FRONT_ZUGANG, HUBS, HUB_NACH_ID, HUB_GEWICHT, HUB_PROVINZEN, TRANSPORT_ROUTEN, type TransportRoute } from "../data/transport";
import { GUETER, type GutDef, type GutId } from "../data/gueter";
import type { World } from "./types";
import type { WarenFluss } from "./versorgung";
import { kosten } from "./ereignis-hilfen";
import { kannZahlen } from "./kapital";
import { addLog } from "./log";
import { t } from "../i18n";

export type TransportAktion = "reparatur" | "umleitung" | "luftbruecke" | "depot";
export interface TransportMassnahme { art: TransportAktion; ziel: string; ab: number; bis: number; pfad?: string[] }
export interface FrontDepot { land: string; ort: string; lon: number; lat: number; bestand: number; zielTage: number }
export interface DepotBilanz { land: string; anfang: number; geliefert: number; verbraucht: number; bedarf: number; ende: number; deckung: number; tage: number }
export interface RegionLieferung { bedarf: number; geliefert: number; ende: number }
export interface RoutenLage extends TransportRoute { faktor: number; kapazitaet: number; belegt: number; schaden: number; bekaempft: boolean; grund: "offen" | "kampf" | "feind" | "schaden" | "ueberlast"; waren: GutId[] }
export interface TransportBilanz { monat: string; routen: RoutenLage[]; regionen: Record<string, Partial<Record<GutId, RegionLieferung>>>; depots: Record<string, DepotBilanz>; regierungsReparaturen?: string[] }
export interface TransportZustand {
  v: 1; lager: Partial<Record<GutId, Record<string, number>>>; schaden: Record<string, number>;
  depots: Record<string, FrontDepot>; massnahmen: TransportMassnahme[]; bilanz?: TransportBilanz;
}
export interface TransportPlan { zustand: TransportZustand; routen: RoutenLage[]; bilanz: TransportBilanz; world: World }
const sum = (o: Record<string, number>) => Object.values(o).reduce((s,n)=>s+n,0);
const clamp = (n: number) => Math.max(0,Math.min(1,n));
const aktiv = (w: World) => (w.spiel?.kriege ?? []).filter(k=>k.phase === "krieg" || k.phase === "waffenruhe");
const oelMonat = GUETER.find(g=>g.id === "erdoel")!.verbrauch / 12;
const FRACHT: Partial<Record<GutId, number>> = { erdoel:12, erdgas:12, getreide:8, kohle:8, stahl:5, elektronik:2, medikamente:1, duenger:3 };
const aktivAm = (w: World, a: TransportMassnahme) => a.ab <= w.day && a.bis > w.day;

function neu(): TransportZustand { return { v:1, lager:{}, schaden:{}, depots:{}, massnahmen:[] }; }
export function transportZustand(w: World): TransportZustand {
  if (!w.spiel) throw new Error("Transport benötigt einen Spielstand");
  return w.spiel.transport ??= neu();
}
function mitDepots(w: World, z: TransportZustand): void {
  for (const k of aktiv(w)) if (!z.depots[k.land]) {
    // Depots sind rückwärtige Bereitstellungslager an der Grenze; Fernoperationen starten beim Hafen Samsun.
    const ort = FRONT_ZUGANG[k.land]?.[0] ?? "55";
    const h = HUB_NACH_ID[ort]!;
    z.depots[k.land] = { land:k.land, ort, lon:h.lon+0.35, lat:h.lat-0.2, bestand:0, zielTage:15 };
  }
}
export function frontBedarf(w: World): number {
  const z = w.spiel?.transport;
  return aktiv(w).reduce((s,k)=>{
    const d = z?.depots[k.land];
    const n = oelMonat * 0.12 * (k.phase === "waffenruhe" ? 0.35 : 1);
    const ziel = z?.massnahmen.some(a=>a.art === "depot" && a.ziel === k.land && aktivAm(w,a)) ? 30 : d?.zielTage ?? 15;
    return s + Math.max(0,n*(1+ziel/30)-(d?.bestand ?? 0));
  },0);
}

/** Momentane Korridore. Gegnerkontrolle sperrt Landwege unabhängig von Reparaturen. */
function routenLage(w: World, z: TransportZustand): RoutenLage[] {
  const kriege = aktiv(w);
  const defs: TransportRoute[] = [...TRANSPORT_ROUTEN];
  for (const k of kriege) {
    const zugang = FRONT_ZUGANG[k.land] ?? ["55","33"];
    for (const von of zugang) defs.push({ id:`front-${k.land}-${von}`, von, nach:`front:${k.land}`, land:k.land, art:"front", kap:5 });
    if (z.massnahmen.some(a=>a.art === "luftbruecke" && a.ziel === k.land && aktivAm(w,a))) defs.push({ id:`luft-${k.land}`,von:"6",nach:`front:${k.land}`,land:k.land,art:"luft",kap:0.7 });
  }
  return defs.map(r=>{
    const provinzen = [Number(r.von),Number(r.nach),...(r.via??[])].filter(Number.isFinite);
    const feind = r.art !== "luft" && r.art !== "see" && kriege.some(k=>k.phase === "krieg" && k.bedroht?.some(p=>provinzen.includes(p)));
    const kampf = r.art === "front" && kriege.some(k=>k.land === r.land && k.phase === "krieg") || r.art === "see" && kriege.some(k=>k.phase === "krieg" && ["GRC","CYP","RUS"].includes(k.land));
    let schaden = clamp(z.schaden[r.id] ?? 0);
    for (const a of z.massnahmen) if(a.art === "reparatur" && a.ziel === r.id && a.ab <= w.day) schaden = Math.max(0,schaden-0.65);
    const netz = r.art === "bahn" ? "bahn" : r.art === "strasse" ? "strasse" : r.art === "see" ? "hafen" : null;
    const n = netz ? w.spiel?.infrastruktur?.netze[netz] : undefined;
    const belastung = n ? Math.min(1,...provinzen.map(p=>{const i=netz==="hafen"?0:p-1; return n.start[i]! > 0 ? n.kap[i]! * n.start[i]! / Math.max(0.01,n.nachfrage[i]!) : 1; })) : 1;
    const umleitung = z.massnahmen.some(a=>a.art === "umleitung" && a.pfad?.includes(r.id) && aktivAm(w,a)) ? 1.5 : 1;
    const faktor = feind ? 0 : (kampf ? 0.45 : 1) * (1-schaden) * belastung;
    return {...r, schaden, bekaempft:feind || kampf, faktor, kapazitaet:r.kap*faktor*umleitung, belegt:0, waren:[], grund:feind?"feind":schaden>0.05?"schaden":kampf?"kampf":belastung<0.95?"ueberlast":"offen"};
  });
}

/** Pure Kopie für Vorschau und Monatsabschluss; Öffnen der Karte verbraucht keine Waren. */
export function transportPlan(w: World): TransportPlan {
  const z: TransportZustand = structuredClone(w.spiel?.transport ?? neu());
  mitDepots(w,z);
  let routen = routenLage(w,z);
  const mandat = w.spiel?.gueter?.regierung?.programme.netz;
  const regierungsReparaturen: string[] = [];
  if (mandat && mandat.ab <= w.day && w.day < mandat.bis && w.spiel?.gueter?.monat !== w.date.slice(0,7)) {
    // Das Ministerium priorisiert selbst. Kämpfe und Besatzung lassen sich nicht mit Geld aufheben.
    for (const r of routen.filter(r => !r.bekaempft && r.art !== "front" && r.schaden >= 0.05).sort((a,b) => b.schaden-a.schaden || a.id.localeCompare(b.id)).slice(0,4)) {
      z.schaden[r.id] = Math.max(0, (z.schaden[r.id] ?? 0) - 0.35);
      regierungsReparaturen.push(r.id);
    }
    routen = routenLage(w,z);
  }
  return {world:w,zustand:z,routen,bilanz:{monat:w.date.slice(0,7),routen,regionen:{},depots:{},regierungsReparaturen}};
}
export function transportLage(w: World): { routen: RoutenLage[]; depots: FrontDepot[] } {
  const p = transportPlan(w);
  for (const r of p.routen) { const alt = w.spiel?.transport?.bilanz?.routen.find(a=>a.id===r.id); if(alt) {r.belegt=alt.belegt; r.waren=alt.waren;} }
  return {routen:p.routen,depots:Object.values(p.zustand.depots)};
}

function erlaubt(r: RoutenLage, gut: GutId): boolean { return gut === "erdgas" ? r.art === "pipeline" : r.art !== "pipeline" && (gut === "erdoel" || (r.art !== "front" && r.art !== "luft")); }
/** Breitensuche mit echten Restkapazitäten. Frontdepots sind Endpunkte, keine Transit-Abkürzungen. */
export function transportPfad(routen: RoutenLage[], von: string, nach: string, gut: GutId, auslassen?: string): RoutenLage[] | null {
  const queue: { ort:string; pfad:RoutenLage[] }[] = [{ort:von,pfad:[]}]; const gesehen=new Set([von]);
  for(let i=0;i<queue.length;i++) {
    const q=queue[i]!; if(q.ort===nach) return q.pfad;
    for(const r of routen) {
      if(r.id===auslassen || !erlaubt(r,gut) || r.kapazitaet-r.belegt<1e-8) continue;
      const ort=r.von===q.ort?r.nach:r.nach===q.ort?r.von:null;
      if(!ort || gesehen.has(ort) || ort.startsWith("front:") && ort!==nach) continue;
      gesehen.add(ort); queue.push({ort,pfad:[...q.pfad,r]});
    }
  }
  return null;
}

function ports(gut: GutId): Record<string,number> { return gut === "erdgas" ? {"34":0.4,"25":0.35,"35":0.25} : {"34":0.4,"35":0.2,"33":0.3,"55":0.1}; }

/** Transporte derselben Monatsrechnung teilen Restkapazitäten, auch über Warengruppen hinweg. */
export function regionalVerteilen(p: TransportPlan, g: GutDef, f: WarenFluss, prioritaet: string): WarenFluss {
  const z=p.zustand; const w=p.world;
  const alt=z.lager[g.id]; const altSum=alt?sum(alt):0;
  const lager:Record<string,number>=Object.fromEntries(HUBS.map(h=>[h.id, altSum>1e-9 ? (alt?.[h.id]??0)*f.anfang/altSum : f.anfang*HUB_GEWICHT[h.id]!]));
  const lokal = ["wasser","strom","ruestung"].includes(g.id);
  const extra = f.zusatzImport?.menge ?? 0;
  const extraOrt = f.zusatzImport?.land === "AZE" ? "25" : "35";
  for(const h of HUBS) lager[h.id]! += f.produktion*HUB_GEWICHT[h.id]! + (lokal?f.importiert*HUB_GEWICHT[h.id]!:(f.importiert-extra)*(ports(g.id)[h.id]??0) + (h.id === extraOrt ? extra : 0));
  const gewicht=(FRACHT[g.id]??3)/Math.max(1,g.verbrauch/12);
  const bewegen=(ziel:string,bedarf:number,reserviert?:Record<string,number>):number=>{
    let geliefert=0;
    // Kürzester verfügbarer Weg; erschöpfte Kapazität erzwingt den nächsten Umweg.
    for(let runde=0;runde<60 && bedarf-geliefert>1e-8;runde++) {
      const queue: {id:string;pfad:RoutenLage[]}[]=[{id:ziel,pfad:[]}]; const gesehen=new Set([ziel]);
      let a: {id:string;pfad:RoutenLage[]}|undefined;
      if(lokal) {const h=HUBS.find(h=>lager[h.id]!-(reserviert?.[h.id]??0)>1e-8); if(h)a={id:h.id,pfad:[]};}
      else for(let qi=0;qi<queue.length;qi++) {
        const q=queue[qi]!;
        if((lager[q.id]??0)-(reserviert?.[q.id]??0)>1e-8) {a=q;break;}
        for(const r of p.routen) {
          if(!erlaubt(r,g.id) || r.kapazitaet-r.belegt<1e-8)continue;
          const ort=r.von===q.id?r.nach:r.nach===q.id?r.von:null;
          if(!ort || gesehen.has(ort) || ort.startsWith("front:"))continue;
          gesehen.add(ort);queue.push({id:ort,pfad:[...q.pfad,r]});
        }
      }
      if(!a) break;
      const menge=Math.min(bedarf-geliefert,lager[a.id]!-(reserviert?.[a.id]??0),...a.pfad!.map(r=>(r.kapazitaet-r.belegt)/gewicht));
      if(menge<=1e-8) break;
      lager[a.id]!-=menge; geliefert+=menge;
      for(const r of a.pfad!) { r.belegt+=menge*gewicht; if(!r.waren.includes(g.id)) r.waren.push(g.id); }
    }
    return geliefert;
  };
  const zivil=HUBS.map(h=>({ziel:h.id,bedarf:f.bedarf*HUB_GEWICHT[h.id]!,geliefert:0,mil:false}));
  const mil=g.id === "erdoel" ? aktiv(w).map(k=>{
    const d=z.depots[k.land]!; const bedarf=oelMonat*0.12*(k.phase==="waffenruhe"?0.35:1);
    if(z.massnahmen.some(a=>a.art==="depot" && a.ziel===k.land && a.ab<=w.day)) d.zielTage=30;
    p.bilanz.depots[k.land]={land:k.land,anfang:d.bestand,geliefert:0,verbraucht:0,bedarf,ende:d.bestand,deckung:0,tage:0};
    return {ziel:`front:${k.land}`,bedarf:Math.max(0,bedarf*(1+d.zielTage/30)-d.bestand),geliefert:0,mil:true};
  }) : [];
  // Viertelbedarfe verhindern, dass die erste Region sämtliche knappe Transportkapazität belegt.
  const gruppen=prioritaet==="militaer"?[mil,zivil]:prioritaet==="zivil"?[zivil,mil]:[[...zivil,...mil]];
  for(const gruppe of gruppen) for(let r=0;r<4;r++) for(const a of gruppe) a.geliefert+=bewegen(a.ziel,a.bedarf/4);
  for(const a of mil) {
    const land=a.ziel.slice(6); const d=z.depots[land]!; const b=p.bilanz.depots[land]!;
    b.geliefert=a.geliefert; b.verbraucht=Math.min(b.bedarf,d.bestand+a.geliefert); d.bestand+=a.geliefert-b.verbraucht;
    b.ende=d.bestand; b.deckung=b.bedarf>0?b.verbraucht/b.bedarf:1; b.tage=b.bedarf>0?d.bestand/b.bedarf*30:0;
  }
  let exportiert=0;
  for(const [ort,anteil] of Object.entries(ports(g.id))) exportiert+=bewegen(ort,f.exportSoll*f.transport*anteil);
  // Restware zu regionalen Zielbeständen verteilen; Waren hinter einer Sperre bleiben dort gespeichert.
  const rest=sum(lager); const ziel=Object.fromEntries(HUBS.map(h=>[h.id,rest*HUB_GEWICHT[h.id]!]));
  if(!lokal) for(const h of HUBS) {const m=bewegen(h.id,Math.max(0,ziel[h.id]!-lager[h.id]!),ziel); lager[h.id]!+=m;}
  let verlust=0;
  if(g.id === "strom") for(const h of HUBS) {verlust+=lager[h.id]!;lager[h.id]=0;}
  for(const a of zivil) {p.bilanz.regionen[a.ziel]??={}; p.bilanz.regionen[a.ziel]![g.id]={bedarf:a.bedarf,geliefert:a.geliefert,ende:lager[a.ziel]!};}
  z.lager[g.id]=lager;
  const geliefert=zivil.reduce((s,a)=>s+a.geliefert,0); const milit=mil.reduce((s,a)=>s+a.geliefert,0);
  return {...f,geliefert,militaerGeliefert:milit,militaerBedarf:mil.reduce((s,a)=>s+a.bedarf,0),exportiert,ende:sum(lager),verlust,fehl:Math.max(0,f.bedarf-geliefert)};
}

export function transportAbschluss(w: World,p:TransportPlan):void {
  const z=p.zustand;
  // Schäden überdauern einen Waffenstillstand; Reparaturen wirken einmal nach ihrer Bauzeit.
  for(const r of p.routen) z.schaden[r.id]=Math.min(0.85,r.schaden + (r.bekaempft ? 0.15 : 0));
  z.massnahmen=z.massnahmen.filter(a=>a.bis>w.day && !(a.art==="reparatur" && a.ab<=w.day));
  z.bilanz=p.bilanz; w.spiel!.transport=z;
}

export const TRANSPORT_AKTIONEN:Record<TransportAktion,{pk:number;bip:number;tage:number;dauer:number}>={
  reparatur:{pk:3,bip:0.03,tage:14,dauer:1e9}, umleitung:{pk:3,bip:0.02,tage:7,dauer:90},
  luftbruecke:{pk:4,bip:0.04,tage:7,dauer:60}, depot:{pk:3,bip:0.015,tage:21,dauer:1e9},
};
export function transportAktion(w:World,art:TransportAktion,ziel:string,ausfuehren=true):{ok:boolean;text:string} {
  const p=transportPlan(w); const z=p.zustand; const regel=TRANSPORT_AKTIONEN[art];
  if(!w.spiel || !regel) return {ok:false,text:t("transport.nicht")};
  if(z.massnahmen.some(a=>a.art===art && a.ziel===ziel && a.bis>w.day)) return {ok:false,text:t("transport.beauftragt")};
  const route=p.routen.find(r=>r.id===ziel); const d=z.depots[ziel]; let pfad:string[]|undefined;
  if(art==="reparatur" && (!route || route.schaden<0.05 || route.grund==="feind")) return {ok:false,text:t(route?.grund==="feind"?"transport.feindHinweis":"transport.keinSchaden")};
  if(art==="umleitung") {const weg=route?transportPfad(p.routen,route.von,route.nach,route.art==="pipeline"?"erdgas":"erdoel",route.id):null; if(!weg?.length)return {ok:false,text:t("transport.keinUmweg")};pfad=weg.map(r=>r.id);}
  if((art==="depot" || art==="luftbruecke") && (!d || !aktiv(w).some(k=>k.land===ziel) || art==="depot" && d.zielTage>=30)) return {ok:false,text:t("transport.nicht")};
  if(!kannZahlen(w.spiel.kapital,regel.pk))return {ok:false,text:t("transport.kapital")};
  if(ausfuehren) {const echt=transportZustand(w);mitDepots(w,echt);w.spiel.kapital-=regel.pk;kosten(w,regel.bip);echt.massnahmen.push({art,ziel,ab:w.day+regel.tage,bis:w.day+regel.tage+regel.dauer,pfad});addLog(w,"entscheidung",t("transport.auftrag",{name:t(`transport.aktion.${art}`),tage:regel.tage}));}
  return {ok:true,text:t("transport.auftrag",{name:t(`transport.aktion.${art}`),tage:regel.tage})};
}

export function regionaleDeckung(w:World,hub:string):number {
  const waren=Object.values(w.spiel?.transport?.bilanz?.regionen[hub]??{}).filter(a=>a && a.bedarf>0);
  return waren.length ? Math.min(...waren.map(a=>a!.geliefert/a!.bedarf)) : 1;
}
export { HUBS, HUB_NACH_ID, HUB_PROVINZEN };
