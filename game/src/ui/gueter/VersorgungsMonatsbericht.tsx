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
const pp=(n:number)=>t("welle_b1.vm.pp",{n:signiert(n*100)});
const b1=(k:string,p?:Record<string,string|number>)=>t(`welle_b1.${k}`,p);

/** Eine Entscheidung als Karte: Etikett, Titel, Befund, darunter ihre Vergleichszahlen; die Warenbelege als Tabelle. */
function EntscheidungsBeleg({e,n,b}:{e:VersorgungsEntscheidungsBeleg;n:VersorgungsNachweis;b:RegierungsBilanz}) {
  const v=e.vergleich;
  const titel=e.id==="kurs"?t(`gueter.kette.${n.kurs}`):t(`regierung.${e.id}.titel`);
  return <article className="vm-entscheidung">
    <header><span className="vm-etikett">{t(e.id==="kurs"?"vm.kurs":"vm.auftrag")}</span><h5>{titel}</h5>
      <span className={`vm-befund ${v?ton(v.deckung):"neutral"}`}>{v?t(v.deckung>0.00005?"vm.hilft":v.deckung< -0.00005?"vm.belastet":"vm.unveraendert"):t(`vm.status.${e.status}`)}</span>
    </header>
    {e.status==="aktiv" ? <>
      {e.grund && <p className="vm-hindernis">{rendere(e.grund)}</p>}
      <dl className="vm-vergleich">
        {v && <div><dt>{t("vm.zivil")}</dt><dd className={ton(v.deckung)}>{pp(v.deckung)}</dd></div>}
        {v && v.einsatz!==undefined && <div><dt>{t("vm.einsatz")}</dt><dd className={ton(v.einsatz)}>{pp(v.einsatz)}</dd></div>}
        {v && <div><dt>{t("vm.handel")}</dt><dd className={ton(v.handel)}>{t("vm.mrdUsd",{n:signiert(v.handel,3)})}</dd></div>}
        {e.id==="energie" && <><div><dt>{b1("vm.zusatzgas",{land:b.partner??"—"})}</dt><dd>{b1("vm.mrdM3",{n:zahl(b.zusatzGas,2)})}</dd></div><div><dt>{b1("vm.aufpreis")}</dt><dd>{t("vm.mrdUsd",{n:zahl(b.aufpreis,3)})}</dd></div></>}
        {e.id==="netz" && <div><dt>{b1("vm.reparaturen")}</dt><dd>{b.reparaturen}</dd></div>}
      </dl>
      {v && <small className="vm-referenz">{e.id==="kurs"?b1("vm.referenzKurs",{kurs:t(`gueter.kette.${n.kursReferenz}`)}):b1("vm.referenzProgramm")}</small>}
      {v && v.waren.length>0 && <details className="vm-einzelbelege"><summary>{t("vm.einzelbelege")}</summary><table className="vm-tabelle">
        <thead><tr><th>{b1("vm.gut")}</th><th>{b1("vm.deckung")}</th><th>{b1("vm.bedarf")}</th><th>{b1("vm.produktion")}</th><th>{b1("vm.lager")}</th></tr></thead>
        <tbody>{v.waren.map(f=>{const einheit=GUT_NACH_ID.get(f.gut)!.einheit;const z=(k:"bedarf"|"produktion"|"lager")=>Math.abs(f[k])>0.0005?`${signiert(f[k],3)} ${einheit}`:"—";
          return <tr key={f.gut}><th scope="row">{t(`gueter.gut.${f.gut}`)}</th><td className={ton(f.deckung)}>{pp(f.deckung)}</td><td>{z("bedarf")}</td><td>{z("produktion")}</td><td>{z("lager")}</td></tr>;})}</tbody>
      </table></details>}
    </> : <p className="vm-zeit">{b1(`vm.zeit.${e.status}`,{datum:formatDateDe(e.status==="beendet"?e.bis!:e.ab!)})}</p>}
  </article>;
}

/** Ausschließlich der gespeicherte Monatsstand; keine Neuberechnung aus späteren Koalitionen oder Kursen.
 *  Welle B1 (06.11.2026): Zahlen statt Sätze. Kopf mit drei Kennzahlen wie der Haushaltskopf, Entscheidungen als Karten mit Vergleichszahlen,
 *  Parteien als Tabelle, der Haushalt nur mit Kopf und Lage (der volle Bericht steht im Haushalt). */
export function VersorgungsMonatsbericht({bericht:b,world,geaendert}:{bericht:RegierungsBilanz|undefined;world?:World;geaendert?:()=>void}) {
  if(!b)return <section className="vm-bericht vm-leer" aria-label={t("vm.titel")}><h4>{t("vm.titel")}</h4><p>{b1("vm.nochNicht")}</p></section>;
  const n=b.nachweis,p=b.politik;
  const delta=n?.vorher?b.deckung-n.vorher.deckung:undefined;
  const knappUnter=p?.anlass==="unterversorgung" && b.deckung*100>=89.95;
  const erholungsText=delta===undefined?"—":p?.anlass==="erholung" && delta*100<2.005?t("vm.mehrAlsZwei"):pp(delta);
  const anlass=knappUnter?"knappUnterversorgung":p?.anlass;
  return <section className="vm-bericht" aria-label={t("vm.titel")}>
    <header className="vm-kopf"><div><span>{t("vm.kicker",{monat:b.monat})}</span><h4>{t("vm.titel")}</h4></div>
      <dl className="vm-kennzahlen">
        <div><dt>{t("vm.zivil")}</dt><dd>{knappUnter?t("vm.knappUnterNeunzig"):t("vm.prozent",{n:zahl(b.deckung*100,1)})}</dd><small className={delta===undefined?"neutral":ton(delta)}>{delta===undefined?b1("vm.ersterMonat"):t("vm.vorperiode",{n:erholungsText,monat:n!.vorher!.monat})}</small></div>
        <div><dt>{t("regierung.vertrauen")}</dt><dd className={ton(b.vertrauen)}>{signiert(b.vertrauen)}</dd><small>{b1("vm.punkte")}</small></div>
        <div><dt>{t("vm.parlament")}</dt><dd className={`vm-urteil ${b.parlamentarisch==="kritik"?"schlecht":b.parlamentarisch==="erfolg"?"gut":"neutral"}`}>{t(`vm.urteil.${b.parlamentarisch??"neutral"}`)}</dd><small>{t("vm.standMonatsende")}</small></div>
      </dl>
    </header>
    {n ? <div className="vm-inhalt">
      <h4>{t("vm.entscheidungen")}<small>{b1("vm.vergleichHilfe")}</small></h4>
      <div className="vm-entscheidungen">{n.entscheidungen.map(e=><EntscheidungsBeleg key={e.id} e={e} n={n} b={b}/>)}</div>
      {n.engpaesse.length>0 && <details className="vm-engpaesse"><summary>{t("vm.engpaesse")}</summary><table className="vm-tabelle">
        <thead><tr><th>{b1("vm.gut")}</th><th>{b1("vm.deckung")}</th><th>{b1("vm.ursache")}</th></tr></thead>
        <tbody>{n.engpaesse.map(e=><tr key={e.gut}><th scope="row">{t(`gueter.gut.${e.gut}`)}</th><td>{zahl(e.deckung*100,1)} %</td>
          <td>{[e.lieferlaender.length>0?b1("vm.lieferausfall",{laender:e.lieferlaender.join(", ")}):"",e.hormus?b1("vm.hormus"):"",!e.lieferlaender.length&&!e.hormus?b1("vm.andereEngpaesse"):""].filter(Boolean).join(" · ")}</td></tr>)}</tbody>
      </table></details>}
    </div> : <div className="vm-alt"><p>{b1("vm.altbericht")}</p>
      <dl className="vm-vergleich">{b.partner && <><div><dt>{b1("vm.zusatzgas",{land:b.partner})}</dt><dd>{b1("vm.mrdM3",{n:zahl(b.zusatzGas,2)})}</dd></div><div><dt>{b1("vm.aufpreis")}</dt><dd>{t("vm.mrdUsd",{n:zahl(b.aufpreis,3)})}</dd></div></>}
        <div><dt>{b1("vm.reparaturen")}</dt><dd>{b.reparaturen}</dd></div></dl>
    </div>}
    {b.haushalt && <div className="vm-haushalt"><HaushaltsMonatsbericht bericht={b.haushalt} world={world} geaendert={geaendert} kurz/></div>}
    {p && <section className="vm-politik" aria-label={t("vm.politik")}>
      <h4>{t("vm.politik")}</h4>
      <p className="vm-begruendung"><span className={`vm-marke ${anlass==="unterversorgung"||anlass==="knappUnterversorgung"?"schlecht":anlass==="erholung"?"gut":""}`}>{b1(`vm.anlass.${anlass}`,{deckung:zahl(b.deckung*100,2),delta:erholungsText})}</span>
        {p.anlass!=="keinMandat" && <span className="vm-marke">{b1(p.kontrolle?"vm.kontrolle":"vm.ohneKontrolle",{n:signiert(p.nominal,0)})}</span>}</p>
      {p.traeger.some(f=>f.rolle!=="eigene") && <table className="vm-tabelle vm-parteien">
        <thead><tr><th>{b1("vm.fraktion")}</th><th>{b1("vm.traegt")}</th><th>{b1("vm.bereitschaft")}</th><th>{b1("vm.loyalitaet")}</th></tr></thead>
        <tbody>{p.traeger.filter(f=>f.rolle!=="eigene").map(f=>{const r=b.reaktionen?.find(r=>r.partei===f.partei);
          return <tr key={f.partei}><th scope="row">{partei(f.partei)}<small>{t(`mandat.rolle.${f.rolle}`)}</small></th><td>{f.programme.map(id=>t(`regierung.${id}.titel`)).join(" · ")}</td>
            <td className={ton(r?.bereitschaft??0)}>{signiert(r?.bereitschaft??0,1)}</td><td>{r?.personen.length?r.personen.map(person=><span key={person.name}>{person.name} {signiert(person.loyalitaet,1)}</span>):"—"}</td></tr>;})}</tbody>
      </table>}
      <div className="vm-opposition"><b>{t("vm.opposition")}</b>
        <dl className="vm-vergleich">
          <div><dt>{b1("vm.parteien")}</dt><dd>{p.opposition.length?p.opposition.map(partei).join(", "):"—"}</dd></div>
          <div><dt>{b1("vm.anfrage")}</dt><dd>{b1(p.opposition.length&&p.anlass==="unterversorgung"?"vm.ja":"vm.nein")}</dd></div>
          <div><dt>{b1("vm.staerke")}</dt><dd className={ton(-(b.oppositionStaerke??0))}>{signiert(b.oppositionStaerke??0,1)}</dd></div>
        </dl>
        {p.traeger.some(f=>f.rolle==="opposition"||f.rolle==="duldung") && <small>{b1("vm.oppositionTraegt")}</small>}
      </div>
      <details className="vm-vertrauen"><summary>{t("vm.folgenrechnung")}</summary><dl>
        {(["ergebnis","front","sparen","begrenzung"] as const).map(id=><div key={id}><dt>{t(`vm.vertrauen.${id}`)}</dt><dd>{signiert(p.vertrauen[id])}</dd></div>)}
        <div className="vm-summe"><dt>{t("regierung.vertrauen")}</dt><dd>{signiert(b.vertrauen)}</dd></div>
        <div><dt>{t("vm.legitimitaet")}</dt><dd>{signiert(p.legitimitaet)}</dd></div>
        <div><dt>{t("vm.sozial")}</dt><dd>{signiert(p.sozial)}</dd></div>
      </dl></details>
    </section>}
    {!!b.koalition?.austritte.length && <section className="vm-koalitionsbruch" aria-label={t("vm.bruch.titel")}>
      <h4>{t("vm.bruch.titel")}<span className={`vm-marke ${b.koalition.nachher>=301?"":"schlecht"}`}>{b.koalition.nachher>=301?b1("vm.mehrheitBleibt"):b1("vm.luecke",{n:Math.max(0,301-b.koalition.nachher)})}</span></h4>
      <p className="vm-bruchsitze">{b1("vm.bruchSitze",{datum:formatDateDe(b.koalition.datum),vorher:b.koalition.vorher,nachher:b.koalition.nachher})}</p>
      <table className="vm-tabelle"><thead><tr><th>{b1("vm.fraktion")}</th><th>{b1("vm.vorsitz")}</th><th>{b1("vm.loyalitaet")}</th><th>{b1("vm.sitze")}</th></tr></thead>
        <tbody>{b.koalition.austritte.map(f=><tr key={f.partei}><th scope="row">{partei(f.partei)}</th><td>{f.name}</td>
          <td className="schlecht">{f.loyalitaet<b.koalition!.grenze&&Math.round(f.loyalitaet*100)/100>=b.koalition!.grenze?t("vm.bruch.knapp",{grenze:b.koalition!.grenze}):zahl(f.loyalitaet,2)}<small>{b1("vm.grenze",{n:b.koalition!.grenze})}</small></td><td>−{f.sitze}</td></tr>)}</tbody></table>
      <p><UbVerweis ziel={{art:"akte",akte:"parlament"}}>{t("vm.bruch.parlament")}</UbVerweis></p>
    </section>}
    {!p && (b.parlamentarisch || b.reaktionen || b.oppositionStaerke!==undefined) && <div className="vm-alt"><dl className="vm-vergleich">
      {b.parlamentarisch && <div><dt>{t("vm.parlament")}</dt><dd>{t(`vm.urteil.${b.parlamentarisch}`)}</dd></div>}
      {b.reaktionen?.map(r=><div key={r.partei}><dt>{partei(r.partei)}</dt><dd>{signiert(r.bereitschaft,1)}{r.personen.map(person=><small key={person.name}>{person.name} {signiert(person.loyalitaet,1)}</small>)}</dd></div>)}
      {b.oppositionStaerke!==undefined && <div><dt>{b1("vm.staerke")}</dt><dd>{signiert(b.oppositionStaerke,1)}</dd></div>}
    </dl></div>}
    <footer>{b1("vm.methodik")}</footer>
  </section>;
}
