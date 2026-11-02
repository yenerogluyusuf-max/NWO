import { frontVersorgungsBeleg, militaerVersorgung } from "../../sim/versorgung";
import { useState } from "react";
import { HUBS, HUB_NACH_ID, HUB_PROVINZEN, transportLage, regionaleDeckung, transportAktion, TRANSPORT_AKTIONEN, type TransportAktion } from "../../sim/transport";
import type { World } from "../../sim/types";
import { akteurName } from "../../sim/welt-modell";
import { addDays, formatDateDe } from "../../sim/dates";
import { GUETER } from "../../data/gueter";
import MITTEN from "../../data/reich/provinzmitten.json";
import { t, zahl } from "../../i18n";
import "./transport.css";
import { UbVerweis } from "../akte/Uebersicht";

export interface TransportKartenDaten {
  routen: {id:string;name:string;punkte:[number,number][];ton:string;auswahl:boolean}[];
  knoten: {id:string;name:string;lon:number;lat:number;depot:boolean;ton:string;auswahl:boolean}[];
}
export function transportKartenDaten(w:World,gas:boolean,auswahl:string|null):TransportKartenDaten {
  const l=transportLage(w); const punkte:Record<string,[number,number]>=Object.fromEntries(HUBS.map(h=>[h.id,[h.lon,h.lat]]));
  for(const d of l.depots) punkte[`front:${d.land}`]=[d.lon,d.lat];
  const routen=l.routen.filter(r=>gas?r.art==="pipeline":r.art!=="pipeline");
  return {
    routen:routen.map(r=>({id:r.id,name:`${HUB_NACH_ID[r.von]?.name ?? r.von} → ${HUB_NACH_ID[r.nach]?.name ?? akteurName(r.land??"")} · ${t(`transport.art.${r.art}`)} · ${t(`transport.grund.${r.grund}`)}`,
      punkte:[punkte[r.von]!,...(r.via??[]).map(p=>(MITTEN as unknown as Record<string,[number,number]>)[String(p)]!),punkte[r.nach]!],
      ton:r.faktor<0.01?"rot":r.faktor<0.8?"gelb":"gruen",auswahl:r.id===auswahl})),
    knoten:[...HUBS.map(h=>({...h,depot:false,ton:regionaleDeckung(w,h.id)<0.9?"rot":"gruen",auswahl:auswahl===h.id})),
      ...(!gas?l.depots.map(d=>({id:`front:${d.land}`,name:t("transport.frontName",{land:akteurName(d.land)}),lon:d.lon,lat:d.lat,depot:true,
        ton:!frontVersorgungsBeleg(w,d.land)?"gelb":militaerVersorgung(w,d.land).treibstoff<0.9?"rot":"gruen",auswahl:auswahl===`front:${d.land}`})):[])],
  };
}

type TafelProps = {world:World;auswahl:string|null;onAuswahl:(id:string)=>void;gas:boolean;onGas:(b:boolean)=>void;refresh:()=>void;onWirtschaft:()=>void;onClose:()=>void};

function Pegel({wert,label,ton="gruen"}:{wert:number;label:string;ton?:string}) {
  return <div className={`tr-pegel ${ton}`}><div><span>{label}</span><strong>{zahl(wert,0)}<small>%</small></strong></div><div className="tr-meter" role="meter" aria-label={label} aria-valuenow={Math.min(100,Math.max(0,Math.round(wert)))} aria-valuemin={0} aria-valuemax={100}><i style={{width:`${Math.min(100,Math.max(0,wert))}%`}}/></div></div>;
}

export function TransportTafel({world:w,auswahl,onAuswahl,gas,onGas,refresh,onWirtschaft,onClose}:TafelProps) {
  const [meldung,setMeldung]=useState("");
  const [kompakt,setKompakt]=useState(false);
  const l=transportLage(w), z=w.spiel?.transport, b=z?.bilanz;
  const route=l.routen.find(r=>r.id===auswahl);
  const depot=l.depots.find(d=>`front:${d.land}`===auswahl);
  const hub=HUB_NACH_ID[auswahl??""];
  const front=depot?frontVersorgungsBeleg(w,depot.land):undefined;
  const detail=!!(route||depot||hub);
  const routen=l.routen.filter(r=>gas?r.art==="pipeline":r.art!=="pipeline");
  const kritisch=routen.filter(r=>r.faktor<0.8);
  const name=(id:string,land?:string)=>HUB_NACH_ID[id]?.name??akteurName(land??id.slice(6));
  const datum=(tag:number)=>formatDateDe(addDays(w.date,tag-w.day));
  const aktion=(art:TransportAktion,ziel:string)=>{
    const regel=TRANSPORT_AKTIONEN[art], pruefung=transportAktion(w,art,ziel,false);
    const auftrag=z?.massnahmen.find(a=>a.art===art&&a.ziel===ziel&&a.bis>w.day);
    const symbol={luftbruecke:"↗",depot:"▤",reparatur:"↻",umleitung:"⇄"}[art];
    return <div className={`tr-aktion${auftrag?" bestellt":""}`} key={art}>
      <button type="button" disabled={!pruefung.ok} onClick={()=>{const erg=transportAktion(w,art,ziel);setMeldung(erg.text);if(erg.ok)refresh();}} title={!pruefung.ok?pruefung.text:t(`transport.wirkung.${art}`)}>
        <span className="tr-aktionszeichen" aria-hidden="true">{auftrag?"✓":symbol}</span>
        <span><b>{t(`transport.aktion.${art}`)}</b><small>{auftrag?t(auftrag.ab>w.day?"transport.ab":"transport.aktiv",{datum:datum(auftrag.ab)}):t("transport.kurzPreis",{pk:regel.pk,tage:regel.tage,bip:zahl(regel.bip,3)})}</small></span>
        <span className="tr-pfeil" aria-hidden="true">{auftrag?"": "→"}</span>
      </button>
      {!pruefung.ok&&!auftrag&&<p className="tr-gesperrt-hinweis">{pruefung.text}</p>}
    </div>;
  };
  const deckung=depot?militaerVersorgung(w,depot.land).treibstoff:1;
  return <aside className={`tr-tafel${kompakt?" tr-kompakt":""}`} aria-label={t("transport.titel")}>
    <header className="tr-kopf">
      <div className="tr-emblem" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M6 6L18 12L6 18M6 6V18"/><circle cx="6" cy="6" r="2.4" fill="#183b36"/><circle cx="18" cy="12" r="2.4" fill="#183b36"/><circle cx="6" cy="18" r="2.4" fill="#183b36"/></svg></div>
      <div className="tr-kopftitel"><span>{t("transport.operationskarte")}</span><h2>{t("transport.titel")}</h2></div>
      <button type="button" className="tr-iconbutton" aria-expanded={!kompakt} aria-label={t(kompakt?"transport.aufklappen":"transport.einklappen")} onClick={()=>setKompakt(!kompakt)}>{kompakt?"+":"−"}</button>
      <button type="button" className="tr-iconbutton" onClick={onClose} aria-label={t("transport.schliessen")}>×</button>
    </header>
    {!kompakt&&<>
      <div className="tr-filter" role="group" aria-label={t("transport.netz")}>
        <button type="button" aria-pressed={!gas} onClick={()=>{onGas(false);onAuswahl("");}}><span aria-hidden="true">⇄</span>{t("transport.fracht")}</button>
        <button type="button" aria-pressed={gas} onClick={()=>{onGas(true);onAuswahl("");}}><span aria-hidden="true">⌁</span>{t("transport.gas")}</button>
      </div>
      <div className="tr-inhalt">
        {detail&&<button className="tr-zurueck" type="button" onClick={()=>onAuswahl("")}>← {t("transport.uebersicht")}</button>}
        {!detail&&<>
          <div className="tr-uebersicht-hero"><span className="tr-kicker">{t("transport.netzLage")}</span><h3>{t(kritisch.length?"transport.netzGefaehrdet":"transport.netzStabil")}</h3><p>{t("transport.karteHinweis")}</p>
            <div className="tr-netz-zahlen"><div><strong>{routen.length}</strong><span>{t("transport.korridore")}</span></div><div className={kritisch.length?"tr-negativ":""}><strong>{kritisch.length}</strong><span>{t("transport.engpaesseKurz")}</span></div><div><strong>{l.depots.length}</strong><span>{t("transport.depots")}</span></div></div>
          </div>
          {l.depots.length>0&&<section className="tr-abschnitt"><h4>{t("transport.depots")}</h4>{l.depots.map(d=>{const v=frontVersorgungsBeleg(w,d.land)?.deckung;return <button className="tr-depotkarte" type="button" key={d.land} onClick={()=>onAuswahl(`front:${d.land}`)}>
            <span className={`tr-statuspunkt ${v===undefined?"gelb":v<0.9?"rot":"gruen"}`} aria-hidden="true"/><span><b>{akteurName(d.land)}</b><small>{t("transport.standortKurz",{ort:name(d.ort)})}</small></span><span className={(v??1)<0.9?"tr-negativ":""}><strong>{v===undefined?"—":zahl(v*100,0)}<small>%</small></strong><small>{t("transport.versorgt")}</small></span><i aria-hidden="true">›</i>
          </button>;})}</section>}
          <section className="tr-abschnitt"><h4>{t("transport.engpaesse")}</h4>{!kritisch.length&&<p className="tr-leise">{t("transport.keinEngpass")}</p>}
            {kritisch.map(r=><button className="tr-routenzeile" type="button" key={r.id} onClick={()=>onAuswahl(r.id)}><span className={`tr-statuspunkt ${r.faktor<0.01?"rot":"gelb"}`} aria-hidden="true"/><span><b>{name(r.von)} <em>→</em> {name(r.nach,r.land)}</b><small>{t(`transport.grund.${r.grund}`)}</small></span><strong>{zahl(r.kapazitaet/r.kap*100,0)}<small>%</small></strong></button>)}
          </section>
          <details className="tr-details"><summary>{t("transport.alleRouten")}</summary>{routen.map(r=><button className="tr-routenzeile" type="button" key={r.id} onClick={()=>onAuswahl(r.id)}>{name(r.von)} → {name(r.nach,r.land)}<small>{t(`transport.art.${r.art}`)}</small></button>)}</details>
        </>}
        {depot&&<section aria-label={t("transport.depot")}>
          <div className="tr-hero"><span className="tr-kicker">{t("transport.depotTyp")}</span><div className="tr-hero-titel"><h3>{akteurName(depot.land)}</h3><span className={`tr-status ${deckung<0.9?"rot":"gruen"}`}>{t(!front?"transport.ungeprueft":deckung<0.05?"regierung.keineLieferung":deckung<0.9?"transport.knapp":"transport.gesichert")}</span></div><p>{t("transport.standortKurz",{ort:name(depot.ort)})}</p></div>
          <div className={`tr-versorgungskarte ${deckung<0.9?"kritisch":""}`}>
            {front ? <Pegel wert={deckung*100} label={t("transport.gedeckt")} ton={deckung<0.9?"rot":"gruen"}/> : <p>{t("transport.frontErsteLieferung")}</p>}
            <div className="tr-kennzahlen"><div><strong>{zahl(depot.bestand,2)}<small> Mio. t</small></strong><span>{t("transport.vorratKurz")}</span></div><div><strong>{front?zahl(front.tage,0):"—"}<small> {t("transport.tage")}</small></strong><span>{t("transport.reichweiteKurz")}</span></div></div>
          </div>
          {front && <div className={`tr-folge ${deckung<0.9?"rot":""}`}><span aria-hidden="true">{deckung<0.9?"!":"✓"}</span><div><strong>{t("regierung.versorgungFaktor",{kraft:zahl((0.25+0.75*deckung)*100,0)})}</strong><p>{t(deckung<0.9?"transport.frontKurz":"transport.frontGut")}</p></div></div>}
          <details className="tr-details"><summary>{t("transport.bilanzDetails")}</summary><p>{t("transport.ziel")}: {depot.zielTage} {t("transport.tage")}</p>{front&&<p>{t("transport.depotBilanz",{anfang:zahl(front.anfang,2),lieferung:zahl(front.geliefert,2),verbrauch:zahl(front.verbraucht,2),ende:zahl(front.ende,2)})}</p>}<p>{t("transport.frontFolge",{kraft:zahl((0.25+0.75*deckung)*100,0)})}</p></details>
        </section>}
        {route&&<section aria-label={t("transport.route")}>
          <div className="tr-hero"><span className="tr-kicker">{t(`transport.art.${route.art}`)}</span><h3 className="tr-route-titel">{name(route.von)}<span>↓</span>{name(route.nach,route.land)}</h3><span className={`tr-status ${route.faktor<0.01?"rot":route.faktor<0.8?"gelb":"gruen"}`}>{t(`transport.grund.${route.grund}`)}</span></div>
          <div className="tr-versorgungskarte"><Pegel wert={route.kapazitaet/route.kap*100} label={t("transport.kapazitaet")} ton={route.faktor<0.8?"rot":"gruen"}/><p className="tr-schaden">{t("transport.schaden")} <strong>{zahl(route.schaden*100,0)} %</strong></p></div>
          {route.grund==="feind"&&<p className="tr-folge-text">{t("transport.feindKurz")}</p>}
          <h4>{t("transport.knotenPruefen")}</h4>{[route.von,route.nach].map(id=><button className="tr-routenzeile" key={id} type="button" onClick={()=>onAuswahl(id)}><span>{name(id,route.land)}</span><strong>{zahl((id.startsWith("front:")?(frontVersorgungsBeleg(w,id.slice(6))?.deckung??0):regionaleDeckung(w,id))*100,0)}<small>%</small></strong><i aria-hidden="true">›</i></button>)}
          <details className="tr-details"><summary>{t("transport.bilanzDetails")}</summary><p>{t("transport.frachtLetzterMonat")}: {route.waren.map(g=>t(`gueter.gut.${g}`)).join(", ")||"—"}</p><p>{t("transport.folgenRoute")}</p></details>
        </section>}
        {hub&&<section><div className="tr-hero"><span className="tr-kicker">{t("transport.regionTyp")}</span><h3>{hub.name}</h3><p>{t("transport.regionAnzahl",{n:HUB_PROVINZEN[hub.id]!.length})}</p></div>
          {GUETER.filter(g=>g.id!=="ruestung").map(g=>{const f=b?.regionen[hub.id]?.[g.id];const wert=f&&f.bedarf>0?f.geliefert/f.bedarf*100:100;return f?<div className="tr-warenzeile" key={g.id}><span>{t(`gueter.gut.${g.id}`)}</span><span className="tr-mini-meter"><i style={{width:`${Math.min(100,wert)}%`}} className={wert<99?"rot":""}/></span><strong className={wert<99?"tr-negativ":""}>{zahl(wert,0)}<small>%</small></strong></div>:null;})}
          <details className="tr-details"><summary>{t("transport.bilanzDetails")}</summary><p>{t("transport.regionFolge")}</p></details>
        </section>}
        <p className="tr-zeitstempel">{t("transport.bilanzKurz",{monat:b?.monat??"—"})}</p>
      </div>
      <div className="tr-handeln">
        <h4>{t("regierung.mapTitel")}</h4>
        <p className="tr-politik-folge">{t(route?.grund === "feind" || depot && l.routen.filter(r=>r.nach===`front:${depot.land}`).every(r=>r.grund==="feind") ? "regierung.mapBlockiert" : depot && deckung<0.9 ? "regierung.mapKnapp" : "regierung.mapNormal")}</p>
        <button className="tr-regierung" type="button" onClick={onWirtschaft}>{t("regierung.zumKabinett")} <span aria-hidden="true">→</span></button>
        {depot && <UbVerweis ziel={{art:"land",id:depot.land}}>{t("regierung.deeskalation")}</UbVerweis>}
        {(depot||route)&&<details className="tr-details"><summary>{t("regierung.verwaltung")}</summary>
          {depot?<>{aktion("luftbruecke",depot.land)}{aktion("depot",depot.land)}</>:route?<>{aktion("reparatur",route.id)}{aktion("umleitung",route.id)}</>:null}
          {(depot?["luftbruecke","depot"]:["reparatur","umleitung"]).map(art=><p key={art}><b>{t(`transport.aktion.${art}`)}:</b> {t(`transport.wirkung.${art}`)}</p>)}
          {meldung&&<p role="status" className="tr-meldung">{meldung}</p>}
        </details>}
      </div>
      <footer className="tr-fuss"><div className="tr-legende"><span><i className="gruen"/>{t("transport.frei")}</span><span><i className="gelb"/>{t("transport.begrenzt")}</span><span><i className="rot"/>{t("transport.gesperrt")}</span></div><button type="button" onClick={onWirtschaft}>{t("transport.wirtschaft")} <span aria-hidden="true">↗</span></button><details className="tr-modell"><summary>{t("transport.modellKurz")}</summary><p>{t("transport.modell")}</p></details></footer>
    </>}
  </aside>;
}
