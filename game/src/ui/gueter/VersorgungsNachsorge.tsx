import type { World } from "../../sim/types";
import type { VersorgungsProgramm } from "../../sim/versorgungspolitik";
import { versorgungsNachsorge, versorgungsStabilisierungsPlan, stabilisiereVersorgungsKoalition, type Stabilisierung } from "../../sim/versorgungsnachsorge";
import { KOALITIONSBRUCH_LOYALITAET, KOALITIONSWARNUNG_LOYALITAET } from "../../sim/koalitionslage";
import { PARTEI_NAME } from "../../sim/fraktionen";
import { zusageText } from "../../sim/zusagen";
import { addDays, formatDateDe } from "../../sim/dates";
import { rendere, t, zahl } from "../../i18n";
import { UbVerweis } from "../akte/Uebersicht";
import { ZusagenDruck } from "../personen/ZusagenDruck";
import "./nachsorge.css";

const name=(p:string)=>PARTEI_NAME[p]??p;
const delta=(n:number)=>`${n>0?"+":""}${zahl(n,1)}`;
const AKTIONEN:Stabilisierung[]=["fraktion","vertrauen","rueckendeckung"];

export function VersorgungsNachsorge({world,programm,onErgebnis}:{world:World;programm:VersorgungsProgramm;onErgebnis:(r:{ok:boolean;text:string})=>void}) {
  const s=versorgungsNachsorge(world,programm);if(!s) return null;
  const datum=(tag:number)=>formatDateDe(addDays(world.date,tag-world.day));
  return <section className="vn-nachsorge" aria-label={t("vn.titel")}>
    <header><span>{t("vn.kicker")}</span><h5>{t("vn.titel")}</h5><p>{t("vn.intro")}</p></header>
    <div className="vn-auftrag"><b>{t(`vn.phase.${s.phase}`)}</b>
      {s.beschluss && <p>{t("vn.auftrag",{ab:datum(s.beschluss.ab),bis:datum(s.beschluss.bis),bip:zahl(s.beschluss.bip,3)})}</p>}
      {s.hindernis && <p className="rg-minus">{rendere(s.hindernis)} <UbVerweis ziel={{art:"land",id:s.vorlage.partner!}}>{t("vn.diplomatie")}</UbVerweis></p>}
      {s.phase==="fehlt" && <p className="rg-minus">{t("vn.auftragFehlt")}</p>}
    </div>
    {s.pflichten.length>0 && <><h6>{t("vn.pflichten")}</h6><div className="vn-pflichten">{s.pflichten.map(p=><details key={p.klausel} className={p.status==="abweichend"?"vn-abweichung":""}>
      <summary><b>{t(`mandat.${p.klausel}.titel`)}</b><span>{t(`vn.pflicht.${p.status}`)}</span></summary>
      <p>{t("vn.bindung",{ab:datum(p.ab),bis:datum(p.bis)})}</p><p>{t(`vn.zusage.${p.klausel}`)}</p>
      {p.parteien.length>0 && <p>{t("vn.verlangt",{parteien:p.parteien.map(name).join(", ")})}</p>}
      <p>{t(`mandat.${p.klausel}.text`)}</p>
      {p.status==="abweichend" && <p className="rg-minus">{t("vn.abweichung")}</p>}
    </details>)}</div></>}
    {s.beschluss && !s.pflichten.length && <p className="vn-leise">{t("vn.ohneKlauseln")}</p>}
    {s.beschluss && <aside className="vn-kontrolle"><b>{t("vn.ergebnisse")}</b>
      <p>{s.bericht?t("vn.monat",{monat:s.bericht.monat,n:zahl(s.bericht.deckung*100,2)}):t("vn.nochKeinBericht")}</p>
      <p>{t("vn.monatsregel")}{s.vorlage.klauseln.includes("kontrolle")&&` ${t("vn.doppelt")}`}</p>
    </aside>}
    <h6>{t("vn.verstimmt")}</h6>
    {s.unzufrieden.length===0?<p className="vn-leise">{t("vn.keinStreit")}</p>:<ul className="vn-konflikte">{s.unzufrieden.map(f=><li key={f.partei}>
      <div><b>{name(f.partei)}</b><small>{t("vn.rolleDamals",{rolle:t(`mandat.rolle.${f.rolle}`)})}</small></div>
      <p>{s.vorlage.status==="abgelehnt"?t("vn.gescheitert"):f.konflikt?t("vn.gegensatz",{forderung:t(`mandat.${f.forderung}.titel`),statt:t(`mandat.${f.konflikt}.titel`)}):t("vn.offeneForderung",{forderung:t(`mandat.${f.forderung}.titel`)})}</p>
      {f.reaktion?<p className="vn-verlust">{t("mandat.bereitschaftDelta",{n:delta(f.reaktion.bereitschaft)})}{f.reaktion.personen.map(p=><span key={p.name}>{t("mandat.loyalitaetDelta",{name:p.name,n:delta(p.loyalitaet)})}</span>)}</p>:<p className="vn-leise">{t("vn.alteReaktion")}</p>}
      {f.rolle==="koalition"&&!f.jetztKoalition && <p className="vn-verlust">{t("vn.ausgeschieden")}</p>}
    </li>)}</ul>}
    <div className="vn-koalitionskopf"><h6>{t("vn.zusammenhalten")}</h6><span>{t("vn.regierungssitze",{n:s.sitze})}</span></div>
    {s.ausgeschieden.length>0 && <aside className="vn-austritte">
      <b>{t("vn.lagerGeaendert")}</b><p>{t("vn.ehemaligePartner",{parteien:s.ausgeschieden.map(name).join(", ")})}</p>
      <p>{t(s.sitze>=301?"vn.mehrheitHeute":"vn.lueckeHeute",{n:Math.max(0,301-s.sitze)})}</p>
      <p>{t("vn.neuesBuendnis")} <UbVerweis ziel={{art:"akte",akte:"parlament"}}>{t("vm.bruch.parlament")}</UbVerweis></p>
    </aside>}
    <p className="vn-leise">{t("vn.pruefung",{datum:formatDateDe(s.pruefung),grenze:KOALITIONSBRUCH_LOYALITAET})}</p>
    {s.partner.length===0 && <p className="vn-leise">{t("vn.keinePartner")}</p>}
    {s.partner.map(p=>{
      const hilfe=p.risiko==="akut"||p.risiko==="gefaehrdet"||p.druck?.bruch||s.unzufrieden.some(f=>f.partei===p.partei);
      return <article className={`vn-partner vn-${p.risiko}`} key={p.partei}>
        <header><div><b>{name(p.partei)}</b><span>{t(`vn.risiko.${p.risiko}`)}</span></div><strong>{p.loyalitaet===undefined?"—":zahl(p.loyalitaet,1)}<small>{t("vn.loyalitaet")}</small></strong></header>
        {p.loyalitaet!==undefined && <div className="vn-loyalitaetsbalken" role="img" aria-label={t("vn.loyalitaetswert",{n:zahl(p.loyalitaet,1),grenze:KOALITIONSBRUCH_LOYALITAET})}><i style={{width:`${p.loyalitaet}%`}}/><s style={{left:`${KOALITIONSBRUCH_LOYALITAET}%`}}/></div>}
        <p>{t("vn.sitzverlust",{n:p.sitze,rest:p.ohne})} {t(p.ohne>=301?"vn.sitzeReichen":"vn.sitzeFehlen",{n:Math.max(0,301-p.ohne)})}</p>
        {p.personen.map(f=><p className="vn-leise" key={f.id}>{f.name} · {t("vn.loyalitaetswert",{n:zahl(f.loyalitaet,1),grenze:KOALITIONSBRUCH_LOYALITAET})}</p>)}
        <ZusagenDruck lage={p.druck}/>
        {p.zusagen.length>0 && <details className="vn-weitere"><summary>{t("vn.weitereZusagen",{n:p.zusagen.length})}</summary><ul>{p.zusagen.map(z=><li key={z.id}>{zusageText(z)}<small>{t("vn.faellig",{datum:datum(z.faellig)})}</small></li>)}</ul><UbVerweis ziel={{art:"akte",akte:"personen"}}>{t("vn.zusagenOeffnen")}</UbVerweis></details>}
        {hilfe && p.personen.length>0 && <div className="vn-wege">{AKTIONEN.map(art=>{
          const a=versorgungsStabilisierungsPlan(world,programm,p.partei,art);if(!a) return null;
          const nach=Math.min(...p.personen.map(f=>a.personen.find(n=>n.id===f.id)?.nachher??f.loyalitaet));
          return <div className="vn-hilfe" key={art}><b>{t(`vn.aktion.${art}`)}</b><p>{t(`vn.aktion.${art}.text`)}</p>
            <p className="vn-preis">{t("vn.preis",{pk:a.pk,aufmerksamkeit:a.aufmerksamkeit})}</p>
            {a.moeglich&&a.kapitalDanach<0 && <p className="vn-grund">{t("vn.aufPump",{n:zahl(a.kapitalDanach,1)})}</p>}
            {a.moeglich&&a.aufmerksamkeitDanach<20 && <p className="vn-grund">{t("vn.erschoepfung",{n:zahl(a.aufmerksamkeitDanach,0)})}</p>}
            {a.moeglich?<><p className="vn-prognose">{t("vn.danach",{n:zahl(nach,1)})}<span>{t(nach<KOALITIONSBRUCH_LOYALITAET?"vn.bleibtAkut":nach<KOALITIONSWARNUNG_LOYALITAET?"vn.knappGerettet":"vn.mehrPuffer")}</span></p>
              <ZusagenDruck lage={a.druck} danach/>
              <p>{t("mandat.bereitschaftDelta",{n:delta(a.bereitschaft)})}</p>
              <details><summary>{t("vn.alleFolgen")}</summary><ul>{a.personen.map(f=><li key={f.id}>{f.name}: {zahl(f.vorher,1)} → {zahl(f.nachher,1)}</li>)}</ul><p>{t("vn.nebenfolgen",{groll:delta(a.groll),ehrgeiz:delta(a.ehrgeiz),vertrauen:delta(a.vertrauen)})}</p></details>
            </>:<p className="vn-grund">{a.grund}</p>}
            <button type="button" disabled={!a.moeglich} onClick={()=>onErgebnis(stabilisiereVersorgungsKoalition(world,a))} aria-label={t("vn.handelnName",{aktion:t(`vn.aktion.${art}`),partei:name(p.partei)})}>{t("vn.handeln")}</button>
          </div>;
        })}</div>}
        {p.risiko==="unbekannt" && <p className="vn-leise">{t("vn.keinVorsitz")}</p>}
      </article>;
    })}
    <p className="vn-leise">{t("vn.dauerhaft")} <UbVerweis ziel={{art:"akte",akte:"parlament"}}>{t("vn.parlament")}</UbVerweis></p>
    {!!s.vorlage.nachsorge?.length && <details className="vn-protokoll" open><summary>{t("vn.protokoll")}</summary>{s.vorlage.nachsorge.slice(-3).reverse().map((a,i)=><div key={`${a.tag}-${a.art}-${i}`}><b>{datum(a.tag)} · {name(a.partei)} · {t(`vn.aktion.${a.art}`)}</b><p>{t("vn.buchung",{pk:a.pk,bereitschaft:delta(a.bereitschaft),vertrauen:delta(a.vertrauen)})}</p>{a.personen.map(f=><small key={f.id}>{f.name}: {zahl(f.vorher,1)} → {zahl(f.nachher,1)}</small>)}</div>)}</details>}
  </section>;
}
