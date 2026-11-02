import type { World } from "../../sim/types";
import type { RegierungsBilanz } from "../../sim/versorgungspolitik";
import type { VersorgungsEntscheidungsBeleg, VersorgungsNachweis } from "../../sim/versorgungsbericht";
import { GUT_NACH_ID } from "../../data/gueter";
import { PARTEI_NAME } from "../../sim/fraktionen";
import { formatDateDe } from "../../sim/dates";
import { rendere, t, zahl } from "../../i18n";
import { UbVerweis } from "../akte/Uebersicht";
import "./monatsbericht.css";
import { HaushaltsMonatsbericht } from "../wirtschaft/HaushaltsBericht";

const signiert=(n:number,stellen=2)=>{const wert=Math.abs(n)<0.5*10**-stellen?0:n;return `${wert>0?"+":""}${zahl(wert,stellen)}`;};
const ton=(n:number)=>n>0.00005?"gut":n< -0.00005?"schlecht":"neutral";
const partei=(p:string)=>PARTEI_NAME[p]??p;
const pp=(n:number)=>t("vm.pp",{n:signiert(n*100)});

function EntscheidungsBeleg({e,n,b}:{e:VersorgungsEntscheidungsBeleg;n:VersorgungsNachweis;b:RegierungsBilanz}) {
  const v=e.vergleich;
  const titel=e.id==="kurs"?t(`gueter.kette.${n.kurs}`):t(`regierung.${e.id}.titel`);
  return <article className="vm-entscheidung">
    <header><span className="vm-etikett">{t(e.id==="kurs"?"vm.kurs":"vm.auftrag")}</span><h5>{titel}</h5>
      <span className={`vm-befund ${v?ton(v.deckung):"neutral"}`}>{v?t(v.deckung>0.00005?"vm.hilft":v.deckung< -0.00005?"vm.belastet":"vm.unveraendert"):t(`vm.status.${e.status}`)}</span>
    </header>
    {e.status==="aktiv" ? <>
      <p>{t(e.id==="kurs"?`vm.mechanik.${n.kurs}`:`vm.mechanik.${e.id}`)}</p>
      {e.grund && <p className="vm-hindernis">{rendere(e.grund)}</p>}
      {e.id==="energie" && <p className="vm-belegtext">{t("vm.gas",{menge:zahl(b.zusatzGas,2),preis:zahl(b.aufpreis,3),land:b.partner??"—"})}</p>}
      {e.id==="netz" && <p className="vm-belegtext">{t("regierung.berichtNetz",{n:b.reparaturen})}</p>}
      {v && <dl className="vm-vergleich">
        <div><dt>{t("vm.zivil")}</dt><dd className={ton(v.deckung)}>{pp(v.deckung)}</dd></div>
        {v.einsatz!==undefined && <div><dt>{t("vm.einsatz")}</dt><dd className={ton(v.einsatz)}>{pp(v.einsatz)}</dd></div>}
        <div><dt>{t("vm.handel")}</dt><dd className={ton(v.handel)}>{t("vm.mrdUsd",{n:signiert(v.handel,3)})}</dd></div>
      </dl>}
      {v && <p className="vm-referenz">{t(e.id==="kurs"?"vm.referenzKurs":"vm.referenzProgramm",{kurs:t(`gueter.kette.${n.kursReferenz}`)})}</p>}
      {v && v.waren.length>0 && <details className="vm-einzelbelege"><summary>{t("vm.einzelbelege")}</summary><ul>
        {v.waren.map(f=><li key={f.gut}><b>{t(`gueter.gut.${f.gut}`)}</b><span>{t("vm.deckungDelta",{n:pp(f.deckung)})}</span>
          {(["bedarf","produktion","lager"] as const).filter(k=>Math.abs(f[k])>0.0005).map(k=><small key={k}>{t(`vm.menge.${k}`,{n:signiert(f[k],3),einheit:GUT_NACH_ID.get(f.gut)!.einheit})}</small>)}
        </li>)}
      </ul></details>}
    </> : <p>{t(`vm.zeit.${e.status}`,{datum:formatDateDe(e.status==="beendet"?e.bis!:e.ab!)})}</p>}
  </article>;
}

/** Ausschließlich der gespeicherte Monatsstand; keine Neuberechnung aus späteren Koalitionen oder Kursen. */
export function VersorgungsMonatsbericht({bericht:b,world,geaendert}:{bericht:RegierungsBilanz|undefined;world?:World;geaendert?:()=>void}) {
  if(!b)return <section className="vm-bericht vm-leer" aria-label={t("vm.titel")}><h4>{t("vm.titel")}</h4><p>{t("vm.nochNicht")}</p></section>;
  const n=b.nachweis,p=b.politik;
  const delta=n?.vorher?b.deckung-n.vorher.deckung:undefined;
  const knappUnter=p?.anlass==="unterversorgung" && b.deckung*100>=89.95;
  const erholungsText=delta===undefined?"—":p?.anlass==="erholung" && delta*100<2.005?t("vm.mehrAlsZwei"):pp(delta);
  return <section className="vm-bericht" aria-label={t("vm.titel")}>
    <header className="vm-kopf"><span>{t("vm.kicker",{monat:b.monat})}</span><h4>{t("vm.titel")}</h4><p>{t("vm.intro")}</p></header>
    <dl className="vm-kennzahlen">
      <div><dt>{t("vm.zivil")}</dt><dd>{knappUnter?t("vm.knappUnterNeunzig"):t("vm.prozent",{n:zahl(b.deckung*100,1)})}</dd><small className={delta===undefined?"neutral":ton(delta)}>{delta===undefined?t("vm.ersterMonat"):t("vm.vorperiode",{n:erholungsText,monat:n!.vorher!.monat})}</small></div>
      <div><dt>{t("regierung.vertrauen")}</dt><dd className={ton(b.vertrauen)}>{signiert(b.vertrauen)}</dd><small>{t("vm.punkte")}</small></div>
      <div><dt>{t("vm.parlament")}</dt><dd className={`vm-urteil ${b.parlamentarisch==="kritik"?"schlecht":b.parlamentarisch==="erfolg"?"gut":"neutral"}`}>{t(`vm.urteil.${b.parlamentarisch??"neutral"}`)}</dd><small>{t("vm.standMonatsende")}</small></div>
    </dl>
    {n ? <div className="vm-inhalt">
      <h4>{t("vm.entscheidungen")}</h4><p className="vm-methodik">{t("vm.vergleichHilfe")}</p>
      <div className="vm-entscheidungen">{n.entscheidungen.map(e=><EntscheidungsBeleg key={e.id} e={e} n={n} b={b}/>)}</div>
      {n.engpaesse.length>0 && <details className="vm-engpaesse"><summary>{t("vm.engpaesse")}</summary><p>{t("vm.engpassHilfe")}</p><ul>{n.engpaesse.map(e=><li key={e.gut}>
        <b>{t(`gueter.gut.${e.gut}`)} · {zahl(e.deckung*100,1)} %</b>
        {e.lieferlaender.length>0 && <span>{t("vm.lieferausfall",{laender:e.lieferlaender.join(", ")})}</span>}
        {e.hormus && <span>{t("vm.hormus")}</span>}
        {!e.lieferlaender.length && !e.hormus && <span>{t("vm.andereEngpaesse")}</span>}
      </li>)}</ul></details>}
    </div> : <div className="vm-alt"><p>{t("vm.altbericht")}</p>
      {b.partner && <p>{t("vm.gas",{menge:zahl(b.zusatzGas,2),preis:zahl(b.aufpreis,3),land:b.partner})}</p>}
      <p>{t("regierung.berichtNetz",{n:b.reparaturen})}</p>
    </div>}
    {b.haushalt && <HaushaltsMonatsbericht bericht={b.haushalt} world={world} geaendert={geaendert}/>}
    {p && <section className="vm-politik" aria-label={t("vm.politik")}>
      <h4>{t("vm.politik")}</h4><p className="vm-begruendung">{t(`vm.anlass.${knappUnter?"knappUnterversorgung":p.anlass}`,{deckung:zahl(b.deckung*100,2),delta:erholungsText})}</p>
      {p.anlass!=="keinMandat" && <p>{t(p.kontrolle?"vm.kontrolle":"vm.ohneKontrolle",{n:signiert(p.nominal,0)})}</p>}
      <p className="vm-methodik">{t("vm.traegerHilfe")}</p>
      <ul className="vm-parteien">{p.traeger.filter(f=>f.rolle!=="eigene").map(f=>{
        const r=b.reaktionen?.find(r=>r.partei===f.partei);
        return <li key={f.partei}><div><b>{partei(f.partei)}</b><span>{t(`mandat.rolle.${f.rolle}`)}</span><small>{t("vm.traegt",{programme:f.programme.map(id=>t(`regierung.${id}.titel`)).join(" · ")})}</small></div>
          <div className="vm-parteifolge"><b className={ton(r?.bereitschaft??0)}>{t("mandat.bereitschaftDelta",{n:signiert(r?.bereitschaft??0,1)})}</b>
            {r?.personen.map(person=><small key={person.name}>{t("mandat.loyalitaetDelta",{name:person.name,n:signiert(person.loyalitaet,1)})}</small>)}
          </div>
        </li>;
      })}</ul>
      <div className="vm-opposition"><b>{t("vm.opposition")}</b>
        <p>{t(!p.opposition.length?"vm.keineOpposition":p.anlass==="unterversorgung"?"vm.anfrage":"vm.keinZugewinn",{parteien:p.opposition.map(partei).join(", "),n:signiert(b.oppositionStaerke??0,1)})}</p>
        {p.traeger.some(f=>f.rolle==="opposition"||f.rolle==="duldung") && <small>{t("vm.oppositionTraegt")}</small>}
      </div>
      <details className="vm-vertrauen"><summary>{t("vm.folgenrechnung")}</summary><dl>
        {(["ergebnis","front","sparen","begrenzung"] as const).map(id=><div key={id}><dt>{t(`vm.vertrauen.${id}`)}</dt><dd>{signiert(p.vertrauen[id])}</dd></div>)}
        <div className="vm-summe"><dt>{t("regierung.vertrauen")}</dt><dd>{signiert(b.vertrauen)}</dd></div>
        <div><dt>{t("vm.legitimitaet")}</dt><dd>{signiert(p.legitimitaet)}</dd></div>
        <div><dt>{t("vm.sozial")}</dt><dd>{signiert(p.sozial)}</dd></div>
      </dl><p>{t("vm.grenzen")}</p></details>
    </section>}
    {!!b.koalition?.austritte.length && <section className="vm-koalitionsbruch" aria-label={t("vm.bruch.titel")}>
      <h4>{t("vm.bruch.titel")}</h4>
      <p className="vm-bruchsitze">{t("vm.bruch.sitze",{datum:formatDateDe(b.koalition.datum),vorher:b.koalition.vorher,nachher:b.koalition.nachher})}</p>
      <ul>{b.koalition.austritte.map(f=><li key={f.partei}>{t("vm.bruch.partei",{partei:partei(f.partei),name:f.name,
        loyalitaet:f.loyalitaet<b.koalition!.grenze&&Math.round(f.loyalitaet*100)/100>=b.koalition!.grenze?t("vm.bruch.knapp",{grenze:b.koalition!.grenze}):zahl(f.loyalitaet,2),
        grenze:b.koalition!.grenze,sitze:f.sitze})}</li>)}</ul>
      <p>{t(b.koalition.nachher>=301?"vm.bruch.mehrheit":"vm.bruch.luecke",{n:Math.max(0,301-b.koalition.nachher)})}</p>
      <p className="vm-methodik">{t("vm.bruch.abfolge")}</p>
      <p>{t("vm.bruch.handeln")} <UbVerweis ziel={{art:"akte",akte:"parlament"}}>{t("vm.bruch.parlament")}</UbVerweis></p>
    </section>}
    {!p && b.parlamentarisch && <p className="vm-alt">{t(`mandat.bilanz.${b.parlamentarisch}`)}</p>}
    {!p && b.reaktionen && <ul className="vm-alt">{b.reaktionen.map(r=><li key={r.partei}>{partei(r.partei)} · {t("mandat.bereitschaftDelta",{n:signiert(r.bereitschaft,1)})}
      {r.personen.map(person=><p key={person.name}>{t("mandat.loyalitaetDelta",{name:person.name,n:signiert(person.loyalitaet,1)})}</p>)}
    </li>)}</ul>}
    {!p && b.oppositionStaerke!==undefined && <p className="vm-alt">{t("mandat.oppositionDelta",{n:signiert(b.oppositionStaerke,1)})}</p>}
    <footer>{t("regierung.methodik")}</footer>
  </section>;
}
