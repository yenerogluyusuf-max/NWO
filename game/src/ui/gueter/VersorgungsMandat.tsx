import { useState } from "react";
import type { World } from "../../sim/types";
import { aendereVersorgungsVorlage, versorgungsGespraech, zieheVersorgungsVorlageZurueck, versorgungsKonditionen, versorgungsKlauselVorschau, versorgungsVorlageHindernis, versorgungsAenderungsTermin, type RegierungsReaktion, type VersorgungsProgramm } from "../../sim/versorgungspolitik";
import { versorgungsStimmen, versorgungsBruchrisiken, auslaufendeVersorgungsDuldungen, VERSORGUNGS_KLAUSELN, type VersorgungsEntwurf } from "../../sim/versorgungsmehrheit";
import { addDays, formatDateDe } from "../../sim/dates";
import { PARTEI_NAME } from "../../sim/fraktionen";
import { rendere, t, zahl } from "../../i18n";
import "./regierung.css";
import { VersorgungsMonatsbericht } from "./VersorgungsMonatsbericht";
import { VersorgungsMehrheitsWege } from "./VersorgungsMehrheitsWege";
import { VersorgungsNachsorge } from "./VersorgungsNachsorge";
import { oeffneVersorgungsNachsorge } from "../../sim/versorgungsnachsorge";
import { VersorgungsBruchwarnung } from "./VersorgungsBruchwarnung";

const signiert=(n:number,stellen=0)=>`${n>0?"+":""}${zahl(n,stellen)}`;
const parteiName=(p:string)=>PARTEI_NAME[p]??p;
const HINDERNIS_HILFE:Record<string,string>={
  "regierung.partnerGesperrt":"mandat.hindernis.diplomatie",
  "regierung.partnerVertrauen":"mandat.hindernis.vertrauen",
  "regierung.kursBindung":"mandat.hindernis.kurs",
  "mandat.keinEinsatz":"mandat.hindernis.einsatz",
  "regierung.keinSchaden":"mandat.hindernis.netz",
};

export function RegierungsReaktionen({reaktionen,titel=t("mandat.tatsaechlicheFolgen")}:{reaktionen:RegierungsReaktion[];titel?:string}) {
  if (!reaktionen.length) return null;
  return <div className="rg-reaktionen"><h5>{titel}</h5><ul>
    {reaktionen.map(r=><li key={r.partei}><b>{parteiName(r.partei)}</b><span className={r.bereitschaft<0?"rg-minus":"rg-plus"}>{t("mandat.bereitschaftDelta",{n:signiert(r.bereitschaft,1)})}</span>
      {r.personen.map(p=><small key={p.name} className={p.loyalitaet<0?"rg-minus":"rg-plus"}>{t("mandat.loyalitaetDelta",{name:p.name,n:signiert(p.loyalitaet,1)})}</small>)}
    </li>)}
  </ul></div>;
}

/** Dieselbe Vorlage in Wirtschaftsakte und Parlament, ohne separate Zusagen oder Stimmenkonten. */
export function VersorgungsMandat({world,programm,geaendert}:{world:World;programm:VersorgungsProgramm;geaendert:()=>void}) {
  const [meldung,setMeldung]=useState("");
  const v=world.spiel?.gueter?.regierung?.vorlagen?.[programm];
  const auftrag=world.spiel?.gueter?.regierung?.programme[programm];
  const e:VersorgungsEntwurf=v ?? {programm,klauseln:[],gespraeche:[]};
  const offen=v?.status==="offen", fertig=!!v && !offen;
  const hindernis=offen?versorgungsVorlageHindernis(world,v):undefined;
  const zeigeStimmen=!fertig || !!v.stimmen;
  const stichtag=offen?v.abstimmung:world.day+7;
  const stimmen=fertig && v.stimmen ? v.stimmen : versorgungsStimmen(world,e,stichtag);
  const duldungen=fertig?[]:auslaufendeVersorgungsDuldungen(world,stichtag);
  const ja=stimmen.reduce((s,f)=>s+f.ja,0), gesamt=stimmen.reduce((s,f)=>s+f.sitze,0);
  const lagerJa=stimmen.filter(f=>f.rolle==="eigene"||f.rolle==="koalition").reduce((s,f)=>s+f.ja,0);
  const unzufrieden=stimmen.filter(f=>f.rolle==="koalition"&&!f.erfuellt).map(f=>parteiName(f.partei));
  const r=versorgungsKonditionen(e), editierbar=offen && world.day<v.abstimmung;
  const beschlussTag=offen?v.abstimmung:v?.erledigt??v?.abstimmung;
  const datum=(tag:number)=>formatDateDe(addDays(world.date,tag-world.day));
  const tun=(a:{ok:boolean;text:string})=>{setMeldung(a.text);if(a.ok) geaendert();};
  // Alte Aufträge behalten ihre Bedingungen; keine nachträglich erfundene Abstimmung.
  if (!v && auftrag && auftrag.bis>world.day) return <p className="rg-leise">{t("mandat.altauftrag")}</p>;
  return <section className="rg-mandat" aria-label={t("mandat.titel")}>
    <header className="rg-mandat-hero">
      <div className="rg-mandat-kopf"><div><span className="rg-eyebrow">{t("mandat.kicker")}</span><h4>{t(fertig?`mandat.status.${v.status}`:"mandat.titel")}</h4></div>
        <div className="rg-votum"><b>{zeigeStimmen?ja:"—"}</b><span>{t(!zeigeStimmen?"mandat.keineAbstimmung":v?.stimmen?"mandat.ja":"mandat.erwartet")}</span></div></div>
      {zeigeStimmen && <><div className="rg-mehrheitsbalken" role="img" aria-label={t("mandat.stand",{ja,gesamt})}><i style={{width:`${gesamt?ja/gesamt*100:0}%`}}/><s style={{left:`${gesamt?Math.min(100,301/gesamt*100):50}%`}}/></div>
      <div className="rg-stimmenzeile"><strong>{t(hindernis?"mandat.vollzugBlockiert":ja>=301?"mandat.mehrheit":"mandat.fehlen",{n:Math.max(0,301-ja)})}</strong><span>{t("mandat.schwelle")}</span></div>
      <div className="rg-stimmenquellen"><span>{t("mandat.regierungsStimmen",{n:lagerJa})}</span><span>{t("mandat.weitereStimmen",{n:ja-lagerJa})}</span></div></>}
    </header>
    <div className="rg-mandat-body">
      <p className="rg-zeitpunkt">{offen?t("mandat.termin",{datum:datum(v.abstimmung)}):fertig?t("mandat.abgeschlossen",{datum:datum(v.erledigt??v.abstimmung)}):t("mandat.vorEinbringen")}</p>
      {!fertig && <p className="rg-prognosebasis">{t("mandat.prognoseStichtag",{datum:datum(stichtag)})}</p>}
      {duldungen.length>0 && <aside className="rg-fristwarnung"><b>{t("mandat.duldungEndet")}</b><p>{t("mandat.duldungFrist",{parteien:duldungen.map(f=>`${parteiName(f.partei)} (${datum(f.bis)})`).join(", ")})}</p></aside>}
      {hindernis && <aside className="rg-hindernis" aria-label={t("mandat.hindernis.titel")}>
        <span className="rg-hindernis-zeichen" aria-hidden="true">!</span><div>
          <b>{t("mandat.hindernis.titel")}</b><p>{rendere(hindernis)}</p>
          <p>{t(HINDERNIS_HILFE[hindernis.k]??"mandat.hindernis.allgemein")}</p>
          <small>{t("mandat.hindernis.folge",{datum:datum(v!.abstimmung)})}</small>
        </div>
      </aside>}
      {!fertig && <aside className={`rg-politischerPreis${unzufrieden.length?" vorsicht":""}`}>
        <b>{t(ja>=301&&lagerJa<301?"mandat.buendnisMehrheit":ja<301?"mandat.mehrheitOffen":"mandat.eigeneMehrheit")}</b>
        {stimmen.some(f=>f.rolle==="koalition") && <p>{unzufrieden.length?t("mandat.koalitionsPreis",{parteien:unzufrieden.join(", ")}):t("mandat.koalitionBeruecksichtigt")}</p>}
      </aside>}
      {!fertig && !hindernis && <VersorgungsBruchwarnung risiken={versorgungsBruchrisiken(world,stimmen,stichtag)}/>}
      {v?.status==="gegenstandslos" && <p className="rg-grund">{v.ausfallGrund?t("mandat.hindernis.damals",{grund:rendere(v.ausfallGrund)}):t("mandat.gegenstandslosHilfe")}</p>}
      {v && (!fertig || v.status==="angenommen") && <div className="rg-konditionen" aria-label={t("mandat.konditionenTitel")}>
        <div><span>{t(v.status==="angenommen"?"mandat.budgetBeschlossen":"mandat.budgetBeiAnnahme")}</span><b>{zahl(r.bip,3)} %</b><small>{t("mandat.bipEinmalig")}</small></div>
        <div><span>{t("mandat.vorbereitung")}</span><b>{r.vorlauf} <small>{t("mandat.tage")}</small></b><small>{t("mandat.abBeschluss")}</small></div>
        <div><span>{t("mandat.laufzeit")}</span><b>{r.dauer} <small>{t("mandat.tage")}</small></b><small>{t("mandat.nachVorbereitung")}</small></div>
      </div>}
      {beschlussTag!==undefined && (!fertig || v?.status==="angenommen") && <p className="rg-zeitplan">{t(offen?"mandat.zeitplanVorschau":"mandat.zeitplanBeschlossen",{ab:datum(beschlussTag+r.vorlauf),bis:datum(beschlussTag+r.vorlauf+r.dauer)})}</p>}
      {v && fertig && v.status!=="angenommen" && <p className="rg-keinAuftrag"><b>{t("mandat.keinAuftrag")}</b><span>{t("mandat.verbrauchtesKapital",{pk:v.pk+v.gespraeche.length-(v.status==="zurueckgezogen"?Math.floor(v.pk/2):0)})}</span></p>}
      {editierbar && <VersorgungsMehrheitsWege world={world} programm={programm} onErgebnis={tun}/>}
      {offen && <fieldset className="rg-kompromisse"><legend>{t("mandat.kompromisse")}</legend><p className="rg-leise">{t("mandat.kompromissKurz")}</p>
        <div className="rg-klauselraster">{VERSORGUNGS_KLAUSELN.map(k=>{
          const ausgewaehlt=e.klauseln.includes(k), vorschau=versorgungsKlauselVorschau(world,e,k);
          const kandidat={...e,klauseln:vorschau.klauseln};
          const neuerTermin=editierbar?versorgungsAenderungsTermin(world,v.abstimmung):v.abstimmung;
          const fraktionenNeu=versorgungsStimmen(world,kandidat,neuerTermin);
          const neueStimmen=fraktionenNeu.reduce((s,f)=>s+f.ja,0), preis=versorgungsKonditionen(kandidat);
          const neueDuldungsLuecken=auslaufendeVersorgungsDuldungen(world,neuerTermin).filter(f=>f.bis>v.abstimmung);
          return <div className={`rg-klausel${ausgewaehlt?" on":""}${vorschau.grund?" gesperrt":""}`} key={k}>
            <label><input type="checkbox" checked={ausgewaehlt} disabled={!editierbar||!!vorschau.grund} onChange={()=>tun(aendereVersorgungsVorlage(world,programm,k))}/><span><b>{t(`mandat.${k}.titel`)}</b><small>{t(`mandat.${k}.kurz`)}</small></span></label>
            {vorschau.grund ? <p className="rg-klausel-grund">{vorschau.grund}</p> : <div className="rg-klausel-prognose"><span>{t(ausgewaehlt?"mandat.beiEntfernung":"mandat.beiAufnahme")}</span><b className={neueStimmen-ja<0?"rg-minus":"rg-plus"}>{t("mandat.stimmenDelta",{n:signiert(neueStimmen-ja)})}</b>
              {Math.abs(preis.bip-r.bip)>0.00001 && <small>{t("mandat.budgetDelta",{n:signiert(preis.bip-r.bip,3)})}</small>}
              {preis.dauer!==r.dauer && <small>{t("mandat.dauerDelta",{n:signiert(preis.dauer-r.dauer)})}</small>}
              {preis.vorlauf!==r.vorlauf && <small>{t("mandat.vorlaufDelta",{n:signiert(preis.vorlauf-r.vorlauf)})}</small>}
              {editierbar && neuerTermin>v.abstimmung && <small className="rg-terminfolge">{t("mandat.votumVerschoben",{tage:neuerTermin-v.abstimmung,datum:datum(neuerTermin)})}</small>}
              {editierbar && neueDuldungsLuecken.length>0 && <small className="rg-terminfolge">{t("mandat.duldungDurchAenderung",{parteien:neueDuldungsLuecken.map(f=>parteiName(f.partei)).join(", ")})}</small>}
            </div>}
            {!vorschau.grund && !hindernis && editierbar && <VersorgungsBruchwarnung kompakt risiken={versorgungsBruchrisiken(world,fraktionenNeu,neuerTermin)}/>}
            <details className="rg-klausel-detail"><summary>{t("mandat.folgeDetails")}</summary><p>{t(`mandat.${k}.text`)}</p></details>
          </div>;
        })}</div>
      </fieldset>}
      {fertig && <VersorgungsNachsorge world={world} programm={programm} onErgebnis={tun}/>}
      {v?.reaktionen && <RegierungsReaktionen reaktionen={v.reaktionen}/>}
      {zeigeStimmen && <details className="rg-fraktionen">
        <summary>{t("mandat.fraktionen")}<span>{t("mandat.fraktionenAnzahl",{n:stimmen.length})}</span></summary>
        <ul>{stimmen.map(f=><li key={f.partei}>
          <div className="rg-fraktion-name"><b>{parteiName(f.partei)}</b><span>{t(`mandat.rolle.${f.rolle}`)}</span></div>
          <div className="rg-fraktion-forderung"><span className={f.erfuellt?"rg-plus":""}>{t(f.erfuellt?"mandat.erfuellt":"mandat.fordert",{forderung:t(`mandat.${f.forderung}.titel`)})}</span>
            <small>{t("mandat.bereitschaft",{n:Math.round(f.bereitschaft)})}</small></div>
          <b className="rg-fraktion-stimmen">{f.ja}<small> / {f.sitze}</small></b>
          {editierbar && f.rolle!=="eigene" && <button type="button" className="rg-gespraech" disabled={e.gespraeche.includes(f.partei)||(world.spiel?.kapital??0)<1} onClick={()=>tun(versorgungsGespraech(world,programm,f.partei))}>{t(e.gespraeche.includes(f.partei)?"mandat.gespraechGefuehrt":"mandat.gespraech")}</button>}
        </li>)}</ul>
        <p className="rg-leise">{t("mandat.stimmenHilfe")}</p><p className="rg-leise">{t("mandat.folgen")}</p>
      </details>}
      {fertig && e.klauseln.length>0 && <p className="rg-auftrag">{t(v.status==="angenommen"?"mandat.vereinbart":"mandat.entwurfBedingungen",{text:e.klauseln.map(k=>t(`mandat.${k}.titel`)).join(" · ")})}</p>}
      {editierbar && <button type="button" className="rg-rueckzug" onClick={()=>tun(zieheVersorgungsVorlageZurueck(world,programm))}>{t("mandat.rueckzug",{pk:Math.floor(v.pk/2)})}</button>}
      <p role="status" className="rg-meldung">{meldung}</p>
    </div>
  </section>;
}

export function VersorgungsTagesordnung({world,geaendert}:{world:World;geaendert:()=>void}) {
  const vorlagen=Object.values(world.spiel?.gueter?.regierung?.vorlagen??{}).filter(v=>!!v);
  const bericht=world.spiel?.gueter?.regierung?.bericht;
  if (!vorlagen.length && !bericht) return null;
  return <section className="rg-tagesordnung"><h3>{t("mandat.tagesordnung")}</h3><p>{t("mandat.tagesordnungHilfe")}</p>
    {vorlagen.map(v=><details key={v.id} open={v.status==="offen" || oeffneVersorgungsNachsorge(world,v.programm) || undefined}><summary>{t(`regierung.${v.programm}.titel`)}<span>{t(`mandat.status.${v.status}`)}</span></summary><VersorgungsMandat world={world} programm={v.programm} geaendert={geaendert}/></details>)}
    {bericht && <details className="vm-monatslink"><summary>{t("vm.kicker",{monat:bericht.monat})}</summary><VersorgungsMonatsbericht bericht={bericht} world={world} geaendert={geaendert}/></details>}
  </section>;
}
