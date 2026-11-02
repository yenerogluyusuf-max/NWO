// Regierungsaufträge steuern die vorhandene Warenrechnung. Keine zweite Waren- oder Haushaltsbilanz.
import type { World } from "./types";
import type { VersorgungsBilanz, VersorgungsPrioritaet } from "./versorgung";
import { GUETER, type GutId } from "../data/gueter";
import { gueterZustand } from "./gueter";
import { landAendern, vertrauenSicht } from "./laender";
import { beziehungAendern } from "./welt-modell";
import { transportLage } from "./transport";
import { kosten } from "./ereignis-hilfen";
import { wirke } from "./wirkung";
import { NET } from "./modell";
import { nationalAverage } from "./netz";
import { addLog } from "./log";
import { msg, rendere, t, type Msg } from "../i18n";
import { versorgungsStimmen, versorgungsReaktionsDelta, VERSORGUNGS_KLAUSELN, type VersorgungsEntwurf, type VersorgungsKlausel, type VersorgungsStimme } from "./versorgungsmehrheit";
import { bereitschaftAendern, fraktion } from "./fraktionen";
import { figurLoyalitaetAendern } from "./figuren";
import { parteiAchsen } from "./linie";
import { oppositionVon, oppositionsFraktionen } from "./opposition";
import { clamp } from "./economy";
import type { VersorgungsNachweis } from "./versorgungsbericht";

export type VersorgungsProgramm = "schutz" | "energie" | "netz";
export type EnergiePartner = "AZE" | "USA";
export interface RegierungsAuftrag { ab: number; bis: number; partner?: EnergiePartner; klauseln?: VersorgungsKlausel[]; traeger?: string[]; vorlage?:string }
export interface VersorgungsVorlage extends VersorgungsEntwurf {
  id: string; partner?: EnergiePartner; eingebracht: number; abstimmung: number; pk: number;
  status: "offen" | "angenommen" | "abgelehnt" | "zurueckgezogen" | "gegenstandslos";
  erledigt?: number; stimmen?: VersorgungsStimme[];
  reaktionen?: RegierungsReaktion[];
  ausfallGrund?: Msg;
  beschluss?: {ab:number;bis:number;bip:number};
  nachsorge?: VersorgungsNachsorgeEintrag[];
}
export interface VersorgungsNachsorgeEintrag {
  tag:number; partei:string; art:"fraktion"|"vertrauen"|"rueckendeckung"; pk:number;
  bereitschaft:number; personen:{id:string;name:string;vorher:number;nachher:number}[]; vertrauen:number;
}
export interface RegierungsReaktion { partei: string; bereitschaft: number; personen: { name: string; loyalitaet: number }[] }
export interface RegierungsBilanz {
  haushalt?:import("./haushaltsbericht").HaushaltsMonatsbericht;
  monat: string; deckung: number; vertrauen: number; zusatzGas: number;
  aufpreis: number; partner?: EnergiePartner; reparaturen: number;
  parlamentarisch?: "erfolg" | "kritik" | "neutral";
  reaktionen?: RegierungsReaktion[];
  oppositionStaerke?: number;
  nachweis?: VersorgungsNachweis;
  /** Tatsächliche Austritte bei der anschließenden Monatsprüfung, vor dem Loyalitätsreset erfasst. */
  koalition?: {
    datum:string; vorher:number; nachher:number; grenze:number;
    austritte:{partei:string;name:string;loyalitaet:number;sitze:number}[];
  };
  politik?: {
    anlass: "unterversorgung" | "erholung" | "kaumAenderung" | "erstbericht" | "keinMandat";
    kontrolle: boolean; nominal: number;
    traeger: { partei: string; rolle: VersorgungsStimme["rolle"]; programme: VersorgungsProgramm[] }[];
    opposition: string[];
    legitimitaet: number; sozial: number;
    vertrauen: { ergebnis: number; front: number; sparen: number; begrenzung: number };
  };
}
export interface VersorgungsRegierung {
  kursAb?: number;
  kursVorher?: VersorgungsPrioritaet;
  programme: Partial<Record<VersorgungsProgramm, RegierungsAuftrag>>;
  bericht?: RegierungsBilanz;
  vorlagen?: Partial<Record<VersorgungsProgramm, VersorgungsVorlage>>;
}
/** Alle Mengen, Fristen und Effekte sind transparente Spielparameter. */
export const VERSORGUNGSPOLITIK = {
  schutz: { pk: 4, bip: 0.04, vorlauf: 0, dauer: 90 },
  energie: { pk: 5, bip: 0.02, vorlauf: 30, dauer: 180 },
  netz: { pk: 6, bip: 0.08, vorlauf: 21, dauer: 90 },
};
export const SCHUTZ_GUETER: GutId[] = ["getreide", "obst_gemuese", "fleisch_milch", "zucker_oele", "medikamente", "duenger"];
export function regierungsProgramm(w: World, id: VersorgungsProgramm): RegierungsAuftrag | undefined {
  const a = w.spiel?.gueter?.regierung?.programme[id];
  return a && a.ab <= w.day && w.day < a.bis ? a : undefined;
}
function zustand(w: World): VersorgungsRegierung {
  return gueterZustand(w).regierung ??= { programme: {} };
}
export function energiePartnerHindernis(w: World, partner: EnergiePartner): Msg | undefined {
  const a = w.spiel?.weltmodell?.aussen;
  if (w.spiel?.kriege?.some(k => k.land === partner && (k.phase === "krieg" || k.phase === "waffenruhe")) ||
    a?.eigeneSanktionen?.includes(partner) || a?.sanktionen?.some(s => s.von === partner) || w.spiel?.welt?.[partner]?.handelssperre)
    return msg("regierung.partnerGesperrt");
  if (vertrauenSicht(w, partner) < 40) return msg("regierung.partnerVertrauen");
}
export function energiePartnerGrund(w: World, partner: EnergiePartner): string | undefined {
  const grund = energiePartnerHindernis(w, partner);
  return grund && rendere(grund);
}
function regierungsHindernis(w: World, id: VersorgungsProgramm, partner: EnergiePartner = "AZE", vollzug = false): Msg | undefined {
  if (!w.spiel || !VERSORGUNGSPOLITIK[id]) return msg("regierung.nicht");
  if (!w.player || !w.parliament) return msg("mandat.keinParlament");
  const v = w.spiel.gueter?.regierung?.vorlagen?.[id];
  if (!vollzug && v?.status === "offen") return msg("mandat.offenGrund");
  if (!vollzug && v?.erledigt !== undefined && v.status !== "angenommen" && w.day < v.erledigt + 14) return msg("mandat.pause");
  const a = w.spiel.gueter?.regierung?.programme[id];
  if (a && a.bis > w.day) return msg("regierung.laeuft");
  if (id === "energie") {
    if (!["AZE", "USA"].includes(partner)) return msg("regierung.nicht");
    const grund = energiePartnerHindernis(w, partner); if (grund) return grund;
  }
  if (id === "netz" && !transportLage(w).routen.some(r => r.schaden >= 0.05 && !r.bekaempft && r.art !== "front")) return msg("regierung.keinSchaden");
  if (!vollzug && w.spiel.kapital < VERSORGUNGSPOLITIK[id].pk) return msg("transport.kapital");
}
export function regierungsPruefung(w: World, id: VersorgungsProgramm, partner: EnergiePartner = "AZE", vollzug = false): string | undefined {
  const grund = regierungsHindernis(w, id, partner, vollzug);
  return grund && rendere(grund);
}
/** Politisches Kapital bezahlt die Initiative; Geld und Waren fließen erst nach dem Votum. */
export function neueVersorgungsVorlage(w:World,id:VersorgungsProgramm,partner:EnergiePartner="AZE"):VersorgungsVorlage {
  return {id:`versorgung-${id}-${w.day}`,programm:id,...(id==="energie"?{partner}:{}),
    eingebracht:w.day,abstimmung:w.day+7,pk:VERSORGUNGSPOLITIK[id].pk,klauseln:[],gespraeche:[],status:"offen"};
}
export function beschliesseVersorgungsProgramm(w: World, id: VersorgungsProgramm, partner: EnergiePartner = "AZE"): { ok: boolean; text: string } {
  const grund = regierungsPruefung(w, id, partner);
  if (grund) return { ok: false, text: grund };
  const r = VERSORGUNGSPOLITIK[id];
  w.spiel!.kapital -= r.pk;
  (zustand(w).vorlagen ??= {})[id] = neueVersorgungsVorlage(w,id,partner);
  const text = t("mandat.eingebracht", {name:t(`regierung.${id}.titel`)});
  addLog(w,"entscheidung",text); return {ok:true,text};
}

export function versorgungsKonditionen(e: Pick<VersorgungsEntwurf,"programm"|"klauseln">) {
  const r = VERSORGUNGSPOLITIK[e.programm];
  return { bip:r.bip * (e.klauseln.includes("haushalt") ? 0.65 : 1) + (e.klauseln.includes("sozial") ? 0.03 : 0),
    dauer:e.klauseln.includes("haushalt") ? Math.floor(r.dauer/2) : r.dauer,
    vorlauf:r.vorlauf + (e.klauseln.includes("kontrolle") ? 7 : 0) };
}
function kursKlauselHindernis(w:World, klauseln:VersorgungsKlausel[]): Msg | undefined {
  const kurs = klauseln.includes("zivil") ? "zivil" : klauseln.includes("einsatz") ? "militaer" : undefined;
  if (!kurs) return;
  if (kurs === "militaer" && !w.spiel?.kriege?.some(k=>k.phase === "krieg" || k.phase === "waffenruhe")) return msg("mandat.keinEinsatz");
  if (kurs !== (w.spiel?.gueter?.prioritaet ?? "ausgewogen") && (w.spiel?.gueter?.regierung?.kursAb ?? -1)>w.day) return msg("regierung.kursBindung");
}
/** Live-Hinweis und Entscheidung am Stichtag verwenden dieselbe zustandsneutrale Prüfung. */
export function versorgungsVorlageHindernis(w:World, v:VersorgungsVorlage): Msg | undefined {
  return regierungsHindernis(w,v.programm,v.partner,true) ?? kursKlauselHindernis(w,v.klauseln);
}
export function versorgungsAenderungsTermin(w:World,abstimmung:number):number {
  return Math.max(abstimmung,w.day+3);
}
export function aendereVersorgungsVorlage(w:World,id:VersorgungsProgramm,klausel:VersorgungsKlausel): {ok:boolean;text:string} {
  const v = w.spiel?.gueter?.regierung?.vorlagen?.[id];
  if (!v || v.status !== "offen" || w.day >= v.abstimmung || !VERSORGUNGS_KLAUSELN.includes(klausel)) return {ok:false,text:t("mandat.nichtOffen")};
  const {klauseln:neu,grund} = versorgungsKlauselVorschau(w,v,klausel);
  if (grund) return {ok:false,text:grund};
  v.klauseln=neu; v.abstimmung=versorgungsAenderungsTermin(w,v.abstimmung);
  return {ok:true,text:t("mandat.geaendert")};
}
/** Anzeige und Handlung teilen dieselben Zulässigkeitsregeln; Vorschau verändert keinen Zustand. */
export function versorgungsKlauselVorschau(w:World,e:VersorgungsEntwurf,klausel:VersorgungsKlausel): {klauseln:VersorgungsKlausel[];grund?:string} {
  const klauseln=e.klauseln.includes(klausel) ? e.klauseln.filter(k=>k!==klausel) : [...e.klauseln,klausel];
  return {klauseln,grund:versorgungsKlauselnGrund(w,klauseln)};
}
/** Prüft das endgültige Paket auch beim gleichzeitigen Tausch zweier unvereinbarer Klauseln. */
export function versorgungsKlauselnGrund(w:World,klauseln:VersorgungsKlausel[]):string|undefined {
  if(klauseln.some(k=>!VERSORGUNGS_KLAUSELN.includes(k)) || new Set(klauseln).size!==klauseln.length) return t("mandat.nichtOffen");
  const widerspruch=(klauseln.includes("sozial") && klauseln.includes("haushalt")) || (klauseln.includes("zivil") && klauseln.includes("einsatz"));
  const hindernis=kursKlauselHindernis(w,klauseln);
  return widerspruch?t("mandat.widerspruch"):hindernis && rendere(hindernis);
}
export function versorgungsGespraech(w:World,id:VersorgungsProgramm,partei:string): {ok:boolean;text:string} {
  const v = w.spiel?.gueter?.regierung?.vorlagen?.[id];
  if (!v || v.status !== "offen" || w.day >= v.abstimmung || partei===w.player?.partei.kurz || !(w.parliament?.seats[partei]) || v.gespraeche.includes(partei)) return {ok:false,text:t("mandat.nichtOffen")};
  if (w.spiel!.kapital<1) return {ok:false,text:t("transport.kapital")};
  w.spiel!.kapital--;v.gespraeche.push(partei);
  return {ok:true,text:t("mandat.gesprochen",{partei})};
}
export function zieheVersorgungsVorlageZurueck(w:World,id:VersorgungsProgramm): {ok:boolean;text:string} {
  const v=w.spiel?.gueter?.regierung?.vorlagen?.[id];
  if (!v || v.status!=="offen" || w.day>=v.abstimmung) return {ok:false,text:t("mandat.nichtOffen")};
  v.status="zurueckgezogen";v.erledigt=w.day;
  w.spiel!.kapital+=Math.floor(v.pk/2);
  const text=t("mandat.zurueckgezogen");addLog(w,"entscheidung",text);return {ok:true,text};
}
function reagiereFraktion(w:World,partei:string,delta:number,text:string): RegierungsReaktion | undefined {
  if (partei===w.player?.partei.kurz || !(w.parliament?.seats[partei]) || delta===0) return;
  const vorher=fraktion(w,partei).bereitschaft;
  bereitschaftAendern(w,partei,delta);
  const personen:RegierungsReaktion["personen"]=[];
  for (const f of w.spiel?.figuren ?? []) if (f.amt==="partner" && f.imAmt && f.partei===partei && w.spiel!.lager.includes(partei)) {
    const loyalitaet=f.loyalitaet;figurLoyalitaetAendern(w,f,delta,text);
    if(f.loyalitaet!==loyalitaet) personen.push({name:f.name,loyalitaet:f.loyalitaet-loyalitaet});
  }
  return {partei,bereitschaft:fraktion(w,partei).bereitschaft-vorher,personen};
}
/** Der Tageslauf verwendet dieselbe aktuelle Sitzrechnung wie die Vorschau. */
export function versorgungsParlamentTag(w:World): void {
  for (const v of Object.values(w.spiel?.gueter?.regierung?.vorlagen ?? {})) {
    if (!v || v.status!=="offen" || w.day<v.abstimmung) continue;
    const grund=versorgungsVorlageHindernis(w,v);
    v.erledigt=w.day;
    if (grund) {v.status="gegenstandslos";v.ausfallGrund=grund;addLog(w,"entscheidung",t("mandat.gegenstandslos",{name:t(`regierung.${v.programm}.titel`),grund:rendere(grund)}));continue;}
    v.stimmen=versorgungsStimmen(w,v);
    const ja=v.stimmen.reduce((s,f)=>s+f.ja,0), angenommen=ja>=301;
    v.status=angenommen ? "angenommen" : "abgelehnt";
    const text=t(angenommen ? "mandat.angenommen" : "mandat.abgelehnt",{name:t(`regierung.${v.programm}.titel`),ja});
    if (angenommen) vollzieheProgramm(w,v);
    else {wirke(w,"vertrauen_regierung",-0.5);w.spiel!.umfrage.zustimmung=Math.max(0,w.spiel!.umfrage.zustimmung-0.4);}
    v.reaktionen=[];
    for (const f of v.stimmen) {
      const reaktion=reagiereFraktion(w,f.partei,versorgungsReaktionsDelta(f,angenommen),text);
      if(reaktion) v.reaktionen.push(reaktion);
    }
    addLog(w,"entscheidung",text);
    w.log[w.log.length-1]!.versorgungsvotum={programm:v.programm,stimmen:structuredClone(v.stimmen)};
  }
}
function vollzieheProgramm(w:World,v:VersorgungsVorlage): void {
  const id=v.programm, r=versorgungsKonditionen(v);
  kosten(w,r.bip);
  const z=zustand(w);
  z.programme[id] = { ab:w.day+r.vorlauf, bis:w.day+r.vorlauf+r.dauer, partner:v.partner,
    klauseln:[...v.klauseln], traeger:v.stimmen!.filter(f=>f.ja>f.sitze/2).map(f=>f.partei),vorlage:v.id };
  v.beschluss={ab:z.programme[id]!.ab,bis:z.programme[id]!.bis,bip:r.bip};
  const kurs=v.klauseln.includes("zivil") ? "zivil" : v.klauseln.includes("einsatz") ? "militaer" : undefined;
  if (kurs) {
    const vorher=gueterZustand(w).prioritaet??"ausgewogen";
    if(kurs!==vorher)z.kursVorher=vorher;
    gueterZustand(w).prioritaet=kurs;z.kursAb=Math.max(z.kursAb ?? 0,z.programme[id]!.bis);
  }
  if (id === "schutz") {
    // Exportpartner reagieren auf die angekündigte Beschränkung, einmal pro Beschluss.
    const kunden = new Set(GUETER.filter(g => SCHUTZ_GUETER.includes(g.id) && g.ausfuhr > 0).flatMap(g => g.kunden));
    for (const land of kunden) beziehungAendern(w, land, { vertrauen: -1, handel: -1 }, t("regierung.exportReaktion"));
  }
}
export function versorgungsKursGrund(w: World, kurs: VersorgungsPrioritaet): string | undefined {
  if (!w.spiel || !["ausgewogen", "zivil", "militaer"].includes(kurs)) return t("regierung.nicht");
  if ((w.spiel.gueter?.prioritaet ?? "ausgewogen") === kurs) return t("regierung.aktuellerKurs");
  if ((w.spiel.gueter?.regierung?.kursAb ?? -Infinity) > w.day) return t("regierung.kursBindung");
  if (w.spiel.kapital < 3) return t("transport.kapital");
}
export function beschliesseVersorgungsKurs(w: World, kurs: VersorgungsPrioritaet): { ok: boolean; text: string } {
  const grund = versorgungsKursGrund(w, kurs); if (grund) return { ok: false, text: grund };
  const vorher=gueterZustand(w).prioritaet ?? "ausgewogen";
  gueterZustand(w).prioritaet = kurs;
  zustand(w).kursVorher = vorher;
  zustand(w).kursAb = w.day + 30;
  w.spiel!.kapital -= 3;
  const text = t("gueter.kette.prioritaetLog", { name: t(`gueter.kette.${kurs}`) });
  for (const [partei,sitze] of Object.entries(w.parliament?.seats ?? {})) {
    if (sitze<=0) continue;
    const national=parteiAchsen(partei)?.national ?? 0;
    // Die Richtungsänderung zählt: Hin und Her über „ausgewogen“ erzeugt keine zusätzliche Loyalität.
    const richtung={militaer:1,zivil:-1,ausgewogen:0};
    const delta=(richtung[kurs]-richtung[vorher])*national/25;
    reagiereFraktion(w,partei,delta,text);
  }
  addLog(w, "entscheidung", text); return { ok: true, text };
}
export function zivileVersorgungsDeckung(b: VersorgungsBilanz): number {
  const f = Object.entries(b.waren).filter(([id, f]) => id !== "ruestung" && f && f.bedarf > 0).map(([, f]) => f!);
  return f.length ? f.reduce((s, f) => s + Math.min(1, f.geliefert / f.bedarf), 0) / f.length : 1;
}
/** Wird ausschließlich innerhalb des einmaligen Waren-Monatsabschlusses aufgerufen. */
export function versorgungsPolitikAbschluss(w: World, b: VersorgungsBilanz, vorher?: VersorgungsBilanz, nachweis?:VersorgungsNachweis): void {
  const z = zustand(w);
  if (z.bericht?.monat === b.monat) return;
  const jetzt = zivileVersorgungsDeckung(b);
  // Ergebnis statt Klick-Belohnung: Erholung/Verschlechterung, plus die Last der Einschränkungen.
  const aenderung = vorher ? Math.max(-0.8, Math.min(0.8, (jetzt - zivileVersorgungsDeckung(vorher)) * 4)) : 0;
  const oel = b.waren.erdoel;
  const militaerLast = w.spiel!.gueter!.prioritaet === "militaer" && oel && oel.militaerGeliefert > 0 && oel.bedarf > 0 ? 0.8 * oel.fehl / oel.bedarf : 0;
  const vorVertrauen = nationalAverage(NET, w.net, "vertrauen_regierung");
  const aktive=Object.values(z.programme).filter((a):a is RegierungsAuftrag=>!!a && a.ab<=w.day && w.day<a.bis);
  const sozial=aktive.some(a=>a.klauseln?.includes("sozial"));
  const kontrolle=aktive.some(a=>a.klauseln?.includes("kontrolle"));
  const sparLast=regierungsProgramm(w, "schutz") ? sozial ? 0.1 : 0.25 : 0;
  const armutVorher=nationalAverage(NET,w.net,"armut"), legitimitaetVorher=nationalAverage(NET,w.net,"legitimitaet");
  wirke(w, "vertrauen_regierung", aenderung - militaerLast - sparLast);
  if (sozial) wirke(w,"armut",-0.25);
  const gas = b.waren.erdgas?.zusatzImport;
  if (gas && gas.menge > 1e-8) landAendern(w, gas.land, { vertrauen: Math.min(1, gas.menge), handel: 0.5 }, t("regierung.partnerReaktion"));
  z.bericht = { monat: b.monat, deckung: jetzt, vertrauen: nationalAverage(NET, w.net, "vertrauen_regierung") - vorVertrauen,
    zusatzGas: gas?.menge ?? 0, aufpreis: gas?.aufpreisUsdMrd ?? 0, partner: gas?.land,
    reparaturen: w.spiel?.transport?.bilanz?.regierungsReparaturen?.length ?? 0, nachweis };
  const fraktionsLage=versorgungsStimmen(w,{programm:"schutz",klauseln:[],gespraeche:[]});
  const traeger=[...new Set(aktive.flatMap(a=>a.traeger??[]))].filter(partei=>(w.parliament?.seats[partei]??0)>0).map(partei=>({
    partei, rolle:fraktionsLage.find(f=>f.partei===partei)!.rolle,
    programme:(Object.entries(z.programme) as [VersorgungsProgramm,RegierungsAuftrag][]).filter(([,a])=>a && a.ab<=w.day && w.day<a.bis && a.traeger?.includes(partei)).map(([id])=>id),
  }));
  z.bericht.politik={anlass:"keinMandat",kontrolle,nominal:0,traeger,opposition:oppositionsFraktionen(w).map(f=>f.partei),legitimitaet:0,
    sozial:nationalAverage(NET,w.net,"armut")-armutVorher,
    vertrauen:{ergebnis:aenderung,front:militaerLast?-militaerLast:0,sparen:sparLast?-sparLast:0,begrenzung:z.bericht.vertrauen-(aenderung-militaerLast-sparLast)}};
  if (aktive.some(a=>a.traeger)) {
    // Mittelwerte können exakt 90 % oder zwei Prozentpunkte um wenige Gleitkommastellen verfehlen.
    const delta=jetzt<0.9-1e-9 ? -1 : vorher && jetzt-zivileVersorgungsDeckung(vorher)>0.02+1e-9 ? 1 : 0;
    z.bericht.politik.anlass=delta<0?"unterversorgung":delta>0?"erholung":vorher?"kaumAenderung":"erstbericht";
    z.bericht.politik.nominal=delta*(kontrolle?2:1);
    z.bericht.parlamentarisch=delta<0 ? "kritik" : delta>0 ? "erfolg" : "neutral";
    const text=t(`mandat.bilanz.${z.bericht.parlamentarisch}`);
    z.bericht.reaktionen=[];
    for (const partei of new Set(aktive.flatMap(a=>a.traeger ?? []))) {
      const reaktion=reagiereFraktion(w,partei,delta*(kontrolle?2:1),text);
      if(reaktion) z.bericht.reaktionen.push(reaktion);
    }
    if (kontrolle) wirke(w,"legitimitaet",delta<0 ? -0.2 : delta>0 ? 0.15 : 0);
    if (delta<0 && oppositionsFraktionen(w).length) {
      const o=oppositionVon(w), vorherStaerke=o.staerke;o.staerke=clamp(o.staerke+(kontrolle?2:1),0,100);
      z.bericht.oppositionStaerke=o.staerke-vorherStaerke;
      o.zuege.push({tag:w.day,datum:w.date,art:"anfrage",text});o.zuege=o.zuege.slice(-40);
      addLog(w,"ereignis",text);
    }
  }
  z.bericht.politik.legitimitaet=nationalAverage(NET,w.net,"legitimitaet")-legitimitaetVorher;
  if (vorher && zivileVersorgungsDeckung(vorher) < 0.95 && jetzt >= 0.95) addLog(w, "ereignis", t("regierung.erholung"));
}
