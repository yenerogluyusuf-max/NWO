import { useState } from "react";
import { haushaltsTitel } from "../../sim/haushalt";
import type { World } from "../../sim/types";
import { haushaltsNachsorge, type HaushaltsMonatsbericht as Bericht } from "../../sim/haushaltsbericht";
import { naechsteKoalitionspruefung } from "../../sim/koalitionslage";
import { NET } from "../../sim/modell";
import { AEMTER, HOCH_SCHLECHT } from "../../sim/personen";
import { zusageText, zusageVon } from "../../sim/zusagen";
import { formatDateDe } from "../../sim/dates";
import { t, zahl } from "../../i18n";
import { geld } from "../bausteine/zahlformat";
import { UbVerweis } from "../akte/Uebersicht";
import { ZusagenDruck } from "../personen/ZusagenDruck";
import "./haushaltsbericht.css";
import { HaushaltsGegenmassnahmen } from "./HaushaltsGegenmassnahmen";

const sign=(n:number,d=2)=>`${n>=0.5*10**-d?"+":""}${zahl(Math.abs(n)<0.5*10**-d?0:n,d)}`;
const ton=(n:number,d=2)=>n>=0.5*10**-d?"gut":n<=-0.5*10**-d?"schlecht":"";
const posten=(id:string)=>t(`haushalt.posten.${id}.name`);
const knoten=(id:string)=>NET.nodes[NET.index.get(id)??-1]?.name??id;
const b1=(k:string,p?:Record<string,string|number>)=>t(`welle_b1.${k}`,p);
const loyal=(n:number)=>n<20&&Math.round(n*100)/100>=20?"< 20":zahl(n,1);

/** Eine Kennzahl: kleines Etikett, große Zahl, darunter höchstens ein kurzer Zusatz. */
function Kz({label,wert,zusatz,klasse=""}:{label:string;wert:string;zusatz?:string|undefined;klasse?:string}) {
  return <div className={klasse}><dt>{label}</dt><dd>{wert}</dd>{zusatz&&<small>{zusatz}</small>}</div>;
}

/** Ja und Nein des Votums als Balken über alle 600 Sitze, die Mehrheitslinie bei 301. */
function Stimmbalken({ja}:{ja:number}) {
  const nein=600-ja;
  return <div className="hb-stimmen" role="img" aria-label={b1("hb.stimmen",{ja,nein})}>
    <span className="hb-ja" style={{width:`${ja/6}%`}}/><span className="hb-nein" style={{width:`${nein/6}%`}}/><i style={{left:`${301/6}%`}}/>
  </div>;
}

/** Ressortbelege des Monats als Tabellen statt der vollständigen Ressortakten (die stehen live im Kabinett). */
function Ressorts({b}:{b:Bericht}) {
  const folgen=b.ressort??[],nachsorge=b.ressortnachsorge??[],vorfaelle=b.ministerpolitik??[];
  if(!folgen.length&&!nachsorge.length&&!vorfaelle.length)return null;
  return <details className="hb-auf"><summary>{b1("hb.ressorts")}<span className="hb-chips">
      {nachsorge.length>0&&<em>{b1("hb.nachsorgeN",{n:nachsorge.length})}</em>}{folgen.length>0&&<em>{b1("hb.folgenN",{n:folgen.length})}</em>}{vorfaelle.length>0&&<em>{b1("hb.vorfaelleN",{n:vorfaelle.length})}</em>}</span></summary>
    {nachsorge.length>0&&<table className="hb-tabelle"><caption>{t("rn.titel")}</caption><thead><tr><th>{b1("hb.ressort")}</th><th className="txt">{b1("hb.groesse")}</th><th>{t("rn.ausgang")}</th><th>{t("rn.messung")}</th><th>{b1("hb.meldungen")}</th><th className="txt">{b1("hb.status")}</th></tr></thead>
      <tbody>{nachsorge.map(n=>{const m=n.meldungen.at(-1),besser=m?(HOCH_SCHLECHT.has(n.groesse)?-1:1)*(m.wert-n.ausgang):0;return <tr key={n.id}>
        <th scope="row">{AEMTER[n.amt].ressort}<small>{m?.name??n.verantwortlich.name}</small></th><td className="txt">{knoten(n.groesse)}</td><td>{zahl(n.ausgang,2)}<small>{formatDateDe(n.datum)}</small></td>
        <td className={m?ton(besser):""}>{m?zahl(m.wert,2):"—"}{m&&<small>{formatDateDe(m.datum)}</small>}</td><td>{n.meldungen.length}</td><td className="txt">{t(`rn.status.${m?.entwicklung??"wartet"}`)}</td></tr>;})}</tbody></table>}
    {folgen.length>0&&<table className="hb-tabelle"><caption>{t("ra.folgen")}</caption><thead><tr><th>{b1("hb.datum")}</th><th className="txt">{b1("hb.minister")}</th><th className="txt">{b1("hb.vorgang")}</th><th className="txt">{b1("hb.groesse")}</th><th>{b1("hb.loyalitaet")}</th></tr></thead>
      <tbody>{folgen.slice().reverse().map((f,i)=><tr key={`${f.id}-${f.tag}-${i}`}><td>{formatDateDe(f.datum)}</td><th scope="row" className="txt">{f.name}</th><td className="txt">{t(`ra.art.${f.art}`)}</td>
        <td className="txt">{knoten(f.groesse)}<small>{zahl(f.vorher,2)} → {zahl(f.nachher,2)}</small></td><td className={ton(f.loyalitaet)}>{sign(f.loyalitaet)}</td></tr>)}</tbody></table>}
    {vorfaelle.length>0&&<table className="hb-tabelle"><caption>{t("rp.verlauf")}</caption><thead><tr><th>{b1("hb.datum")}</th><th className="txt">{b1("hb.minister")}</th><th className="txt">{b1("hb.vorgang")}</th><th className="txt">{b1("hb.antwort")}</th></tr></thead>
      <tbody>{vorfaelle.slice().reverse().map(v=><tr key={v.id}><td>{formatDateDe(v.datum)}</td><th scope="row" className="txt">{v.name}<small>{AEMTER[v.amt].ressort}</small></th><td className="txt">{t(`ra.art.${v.art}`)}</td>
        <td className="txt">{v.entscheidung?t(v.entscheidung.art==="entlassen"?"rp.abschluss.entlassen":`rp.art.${v.entscheidung.art}`):b1(v.geschlossen?`hb.geschlossen.${v.geschlossen}`:"hb.offen")}</td></tr>)}</tbody></table>}
    <p className="hb-links"><UbVerweis ziel={{art:"akte",akte:"personen"}}>{b1("hb.zumKabinett")}</UbVerweis></p>
  </details>;
}

/** Dieser Bericht liest nur gespeicherte Belege. Die Live-Nachsorge wird ausdrücklich anders beschriftet.
 *  Welle B1 (06.11.2026): Zahlen statt Sätze. Kopf wie der Haushaltskopf (Titel, große Kennzahlen), darunter Blöcke mit Kennzahlen,
 *  Zusagen als Zeilen; Posten, Abkommen und Ressortbelege als kleine Tabellen hinter Aufklappern.
 *  `kurz` zeigt nur Kopf und Lage (eingebettet im Versorgungsbericht; der volle Bericht steht im Haushalt). */
export function HaushaltsMonatsbericht({bericht:b,aktuell=false,world,geaendert,kurz=false}:{bericht:Bericht;aktuell?:boolean;world?:World;geaendert?:()=>void;kurz?:boolean}) {
  const a=b.abschluss,d=a.nachher.defizit-a.vorher.defizit;
  const minister=a.nachher.personen.flatMap(p=>{const alt=a.vorher.personen.find(x=>x.id===p.id);return alt&&Math.abs(p.loyalitaet-alt.loyalitaet)>1e-8?[{...p,delta:p.loyalitaet-alt.loyalitaet}]:[];});
  const partner=b.stand.parteien.filter(p=>p.rolle==="koalition"||a.abkommen.some(v=>v.partei===p.partei)||a.nachher.parteien.some(v=>v.partei===p.partei&&v.rolle==="koalition"));
  const kredit=a.vorher.finanzen&&a.nachher.finanzen?a.nachher.finanzen.kreditMrd-a.vorher.finanzen.kreditMrd:undefined;
  const f=b.stand.finanzen,s=b.stand.sozial;
  const reifeText=!a.angenommen?"hb.keineReifung":b.umsetzung.length>0&&b.umsetzung.every(p=>p.ersetzt)?"hb.ersetztAlle":"hb.wartet";
  return <section className={`hb${kurz?" hb-kurz":""}`} aria-label={t("hb.titel")}>
    <header className="hb-kopf">
      <div className="hb-titel"><small>{t(aktuell?"hb.heute":"hb.monat",{datum:formatDateDe(b.datum),monat:b.monat})}</small>
        <h4>{haushaltsTitel(a)}</h4>
        <p className="hb-votum"><span className={`hb-marke ${a.angenommen?"gut":"schlecht"}`}>{b1(a.angenommen?"hb.angenommen":"hb.abgelehnt")}</span>{b1("hb.votum",{datum:formatDateDe(a.datum),ja:a.ja,nein:600-a.ja})}</p>
        <Stimmbalken ja={a.ja}/>
      </div>
      <dl className="hb-kz">
        <Kz label={b1("hb.defizit")} wert={b1("hb.pp",{n:sign(d)})} zusatz={b1("hb.desBip")} klasse={ton(-d)}/>
        {kredit!==undefined&&<Kz label={b1("hb.jahresbedarf")} wert={`${kredit>=0.05?"+":""}${geld(kredit)}`} zusatz={b1("hb.imJahr")}/>}
        <Kz label={t("hb.legitimitaet")} wert={sign(a.nachher.legitimitaet-a.vorher.legitimitaet)} klasse={ton(a.nachher.legitimitaet-a.vorher.legitimitaet)}/>
        <Kz label={b1("hb.zustimmung")} wert={sign(a.nachher.zustimmung-a.vorher.zustimmung)} klasse={ton(a.nachher.zustimmung-a.vorher.zustimmung)}/>
      </dl>
    </header>
    {!a.angenommen&&<p className="hb-zeile">{b1("hb.alterHaushalt")}</p>}

    <div className="hb-raster">
      <section className="hb-block"><h5>{b1("hb.lage")}<small>{b1("hb.lageHinweis")}</small></h5>
        <dl className="hb-zahlen">
          <Kz label={b1("hb.defizitStand")} wert={t("hb.prozent",{n:zahl(b.stand.defizit,1)})} zusatz={b1("hb.desBip")}/>
          <Kz label={b1("hb.wachstum")} wert={t("hb.prozent",{n:zahl(b.stand.wachstum,1)})}/>
          <Kz label={b1("hb.schulden")} wert={t("hb.prozent",{n:zahl(b.stand.schulden,1)})} zusatz={b1("hb.desBip")}/>
          {f&&<><Kz label={b1("hb.einnahmen")} wert={geld(f.einnahmenMrd)} zusatz={b1("hb.real",{betrag:geld(f.realEinnahmenMrd),datum:formatDateDe(f.preisbasis)})}/>
            <Kz label={b1("hb.ausgaben")} wert={geld(f.ausgabenMrd)} zusatz={b1("hb.netto")}/>
            <Kz label={b1("hb.kredit")} wert={geld(f.kreditMrd)} zusatz={b1(f.kreditMrd<0?"hb.ueberschuss":"hb.imJahr")} klasse={f.kreditMrd>0?"schlecht":""}/></>}
          {b.versorgung&&<><Kz label={t("vm.zivil")} wert={t("hb.prozent",{n:zahl(b.versorgung.deckung*100,1)})} zusatz={b.versorgung.monat}/>
            <Kz label={t("vm.handel")} wert={t("vm.mrdUsd",{n:sign(b.versorgung.handel,3)})} klasse={ton(b.versorgung.handel,3)}/></>}
        </dl>
      </section>
      {!kurz&&s&&<section className="hb-block"><h5>{t("kp.sozialBericht")}<small>{b1("hb.index")}</small></h5>
        <dl className="hb-zahlen">{(["armut","lebenshaltung","realeinkommen"] as const).map(id=>{const v=a.vorher.sozial?s[id]-a.vorher.sozial[id]:undefined;const gut=v===undefined?0:id==="realeinkommen"?v:-v;
          return <Kz key={id} label={t(`kp.${id}`)} wert={zahl(s[id],1)} zusatz={v===undefined?undefined:b1("hb.seitVotum",{n:sign(v)})} klasse={ton(gut)}/>;})}</dl>
      </section>}
      {!kurz&&<section className="hb-block"><h5>{t("hb.wirkung")}{b.reifung&&<small>{b1("hb.reifungAm",{datum:formatDateDe(b.reifung.datum)})}</small>}</h5>
        {b.reifung?<><dl className="hb-zahlen">
            <Kz label={t("vm.zivil")} wert={b1("hb.pp",{n:sign(b.reifung.deckung*100)})} klasse={ton(b.reifung.deckung*100)}/>
            <Kz label={t("vm.handel")} wert={t("vm.mrdUsd",{n:sign(b.reifung.handel,3)})} klasse={ton(b.reifung.handel,3)}/>
            {b.reifung.einsatz!==undefined&&<Kz label={t("vm.einsatz")} wert={b1("hb.pp",{n:sign(b.reifung.einsatz*100)})} klasse={ton(b.reifung.einsatz*100)}/>}
          </dl>
          {b.reifung.knoten.length>0&&<details className="hb-auf"><summary>{t("hb.treiber")}</summary><table className="hb-tabelle"><tbody>{b.reifung.knoten.map(k=><tr key={k.id}><th scope="row">{knoten(k.id)}</th><td className={ton(k.delta,3)}>{t("hb.punkte",{n:sign(k.delta,3)})}</td></tr>)}</tbody></table>
            <p className="hb-zeile">{b1("hb.vergleich")}</p></details>}
        </>:<p className="hb-zeile">{b1(reifeText)}</p>}
      </section>}
      {!kurz&&<section className="hb-block"><h5>{t("hb.koalition")}</h5>
        <dl className="hb-zahlen"><Kz label={b1("hb.sitzeVotum")} wert={String(a.nachher.sitze)} zusatz={b1("hb.von600")}/><Kz label={b1("hb.sitzeHeute")} wert={String(b.stand.sitze)} zusatz={b1("hb.mehrheit301")} klasse={b.stand.sitze>=301?"gut":"schlecht"}/></dl>
        {partner.length>0&&<ul className="hb-parteien">{partner.map(p=><li key={p.partei}>
          <b>{zusageVon(p.partei)}</b><span className="hb-marke">{t(`zw.rolle.${p.rolle}`)}</span><span className="hb-wert">{b1("hb.bereitschaft",{n:zahl(p.bereitschaft,1)})}</span>
          {p.personen.map(f=><span key={f.id} className={`hb-wert ${f.loyalitaet<20?"schlecht":""}`}>{b1("hb.loyal",{name:f.name,n:loyal(f.loyalitaet)})}</span>)}
          {p.rolle==="koalition"&&p.personen.some(f=>f.loyalitaet<20)&&<span className="hb-warnung">{b1("hb.gefahr",{datum:formatDateDe(naechsteKoalitionspruefung(b.datum)),sitze:p.sitze})}</span>}
        </li>)}</ul>}
        {b.koalition&&<p className="hb-warnung">{b1("hb.austritte",{parteien:b.koalition.austritte.map(p=>zusageVon(p.partei)).join(", "),datum:formatDateDe(b.koalition.datum),vor:b.koalition.vorher,nach:b.koalition.nachher})}</p>}
        {minister.length>0&&<p className="hb-chips hb-minister"><small>{b1("hb.ministerEtat")}</small>{minister.map(p=><em key={p.id} className={ton(p.delta,1)}>{p.name} {sign(p.delta,1)}</em>)}</p>}
      </section>}
    </div>
    {kurz?<p className="hb-links"><UbVerweis ziel={{art:"akte",akte:"wirtschaft",start:"haushalt"}}>{b1("hb.vollerBericht")}</UbVerweis></p>:<>
    <section className="hb-block hb-breit"><h5>{t("hb.zusagen")}<small>{b1("hb.bindung")}</small></h5>
      {b.zusagen.length===0?<p className="hb-zeile">{b1("hb.keineZusagen")}</p>:<ul className="hb-zusagen">{b.zusagen.map(s=><li key={s.z.id}>
        <b>{zusageVon(s.z.von)}</b><span className="hb-zusage">{zusageText(s.z)}{s.z.stufeZiel!==undefined&&s.z.massnahme&&<small>{t("hb.ziel",{name:knoten(s.z.massnahme),n:zahl(s.z.stufeZiel,1)})}</small>}</span>
        <span className="hb-frist">{formatDateDe(s.datum)}<small>{b1(`hb.quelle.${s.quelle}`)}</small></span><span className={`hb-status ${s.status}`}>{t(`hb.status.${s.status}`)}</span>
      </li>)}</ul>}
      {b.druck.map(d=><ZusagenDruck key={d.partei} lage={d}/>)}
    </section>
    <div className="hb-aufklapper">
      {a.posten.length>0&&<details className="hb-auf"><summary>{t("hb.posten")}<span className="hb-chips"><em>{a.posten.length}</em></span></summary>
        <table className="hb-tabelle"><thead><tr><th>{b1("hb.posten")}</th><th>{b1("hb.vorher")}</th><th>{b1("hb.beantragt")}</th><th>{b1("hb.nachVotum")}</th>{a.angenommen&&<th>{b1("hb.wirksam")}</th>}<th>{b1("hb.reife")}</th></tr></thead>
          <tbody>{a.posten.map(p=>{const u=b.umsetzung.find(x=>x.id===p.id);return <tr key={p.id}><th scope="row">{posten(p.id)}{u?.ersetzt&&<small>{b1("hb.ersetzt")}</small>}</th><td>{p.vorher}</td><td>{p.ziel}</td><td>{p.danach}</td>
            {a.angenommen&&<td>{u?`${zahl(u.wirksam,2)} / ${u.heute}`:"—"}</td>}<td>{b1("hb.monate",{n:p.reifeMonate})}</td></tr>;})}</tbody></table></details>}
      {a.abkommen.length>0&&<details className="hb-auf"><summary>{t("hb.abkommen")}<span className="hb-chips"><em>{a.abkommen.length}</em></span></summary>
        <table className="hb-tabelle"><thead><tr><th>{b1("hb.fraktion")}</th><th>{b1("hb.datum")}</th><th>{t("eo.kapital")}</th><th>{t("eo.aufmerksamkeit")}</th><th>{b1("hb.bereitschaftKurz")}</th></tr></thead>
          <tbody>{a.abkommen.map((v,i)=><tr key={`${v.partei}-${v.art}-${i}`}><th scope="row">{zusageVon(v.partei)}<small>{t(`fa.${v.art}`)}</small></th><td>{formatDateDe(v.datum)}</td><td>{v.pk}</td><td>{zahl(v.aufmerksamkeit,0)}</td><td className={ton(v.bereitschaft,0)}>{sign(v.bereitschaft,0)}</td></tr>)}</tbody></table></details>}
      <Ressorts b={b}/>
    </div>
    {world&&geaendert&&<HaushaltsGegenmassnahmen world={world} beschluss={a.id} geaendert={geaendert}/>}
    <p className="hb-links"><UbVerweis ziel={{art:"zusagen"}}>{t("hb.zusagenAktion")}</UbVerweis><UbVerweis ziel={{art:"akte",akte:"parlament"}}>{t("hb.koalitionAktion")}</UbVerweis></p>
    </>}
  </section>;
}

/** Heutiger Stand oben; die gespeicherten Monatsabschlüsse als eine Verlaufstabelle. Ein Klick auf einen Monat zeigt dessen
 *  gespeicherten Bericht (immer nur einer, damit sich derselbe Text nicht zwölfmal wiederholt). */
export function HaushaltsNachbericht({world,geaendert}:{world:World;geaendert?:()=>void}) {
  const [monat,setMonat]=useState<string>();
  const jetzt=haushaltsNachsorge(world);if(!jetzt)return null;
  const monate=(world.spiel?.wirtschaft?.haushalt.monatsberichte??[]).filter(b=>b.abschluss.id===jetzt.abschluss.id).slice().reverse();
  const gewaehlt=monate.find(b=>b.monat===monat);
  const zaehle=(b:Bericht,s:string)=>b.zusagen.filter(z=>z.status===s).length;
  return <><HaushaltsMonatsbericht bericht={jetzt} aktuell world={world} geaendert={geaendert}/>
    {monate.length>0&&<details className="hb-verlauf"><summary>{b1("hb.verlauf",{n:monate.length})}</summary>
      <div className="hb-tabellenrahmen"><table className="hb-tabelle"><thead><tr><th>{b1("hb.monat")}</th><th>{b1("hb.defizitStand")}</th><th>{b1("hb.wachstum")}</th><th>{b1("hb.schulden")}</th><th>{b1("hb.kredit")}</th><th>{t("vm.zivil")}</th><th>{t("kp.armut")}</th><th>{t("kp.realeinkommen")}</th><th>{b1("hb.sitzeHeute")}</th><th>{b1("hb.zusagenKurz")}</th></tr></thead>
        <tbody>{monate.map(b=><tr key={b.monat} className={b.monat===monat?"an":""}>
          <th scope="row"><button type="button" className="hb-monat" aria-pressed={b.monat===monat} onClick={()=>setMonat(b.monat===monat?undefined:b.monat)}>{b.monat}</button></th>
          <td>{zahl(b.stand.defizit,1)}</td><td>{zahl(b.stand.wachstum,1)}</td><td>{zahl(b.stand.schulden,1)}</td><td>{b.stand.finanzen?geld(b.stand.finanzen.kreditMrd):"—"}</td>
          <td>{b.versorgung?zahl(b.versorgung.deckung*100,1):"—"}</td><td>{b.stand.sozial?zahl(b.stand.sozial.armut,1):"—"}</td><td>{b.stand.sozial?zahl(b.stand.sozial.realeinkommen,1):"—"}</td>
          <td className={b.stand.sitze>=301?"":"schlecht"}>{b.stand.sitze}</td><td>{b1("hb.zusagenZahl",{offen:zaehle(b,"offen"),erfuellt:zaehle(b,"erfuellt"),gebrochen:zaehle(b,"gebrochen")})}</td>
        </tr>)}</tbody></table></div>
      {gewaehlt&&<HaushaltsMonatsbericht key={gewaehlt.monat} bericht={gewaehlt}/>}
    </details>}
  </>;
}
