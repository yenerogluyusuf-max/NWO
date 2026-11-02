import { RessortErholungsVerlauf } from "../minister/RessortErholung";
import { RessortFolgen } from "../minister/RessortAnliegen";
import { RessortPolitikVerlauf } from "../minister/RessortVerantwortung";
import type { World } from "../../sim/types";
import { haushaltsNachsorge, type HaushaltsMonatsbericht as Bericht } from "../../sim/haushaltsbericht";
import { naechsteKoalitionspruefung } from "../../sim/koalitionslage";
import { NET } from "../../sim/modell";
import { zusageText, zusageVon } from "../../sim/zusagen";
import { formatDateDe } from "../../sim/dates";
import { t, zahl } from "../../i18n";
import { UbVerweis } from "../akte/Uebersicht";
import { ZusagenDruck } from "../personen/ZusagenDruck";
import "./haushaltsbericht.css";
import { HaushaltsGegenmassnahmen } from "./HaushaltsGegenmassnahmen";

const sign=(n:number,d=2)=>`${n>=0.5*10**-d?"+":""}${zahl(Math.abs(n)<0.5*10**-d?0:n,d)}`;
const posten=(id:string)=>t(`haushalt.posten.${id}.name`);
const knoten=(id:string)=>NET.nodes[NET.index.get(id)??-1]?.name??id;

/** Dieser Bericht liest nur gespeicherte Belege. Die Live-Nachsorge wird ausdrücklich anders beschriftet. */
export function HaushaltsMonatsbericht({bericht:b,aktuell=false,world,geaendert}:{bericht:Bericht;aktuell?:boolean;world?:World;geaendert?:()=>void}) {
  const a=b.abschluss,d=a.nachher.defizit-a.vorher.defizit;
  const minister=a.nachher.personen.flatMap(p=>{const alt=a.vorher.personen.find(x=>x.id===p.id);return alt&&Math.abs(p.loyalitaet-alt.loyalitaet)>1e-8?[{...p,delta:p.loyalitaet-alt.loyalitaet}]:[];});
  const partner=b.stand.parteien.filter(p=>p.rolle==="koalition"||a.abkommen.some(v=>v.partei===p.partei)||a.nachher.parteien.some(v=>v.partei===p.partei&&v.rolle==="koalition"));
  return <section className="hb" aria-label={t("hb.titel")}>
    <header className="hb-kopf"><small>{t(aktuell?"hb.heute":"hb.monat",{datum:formatDateDe(b.datum),monat:b.monat})}</small>
      <h4>{t("hb.titel")}</h4><p>{t(a.angenommen?"hb.angenommen":"hb.abgelehnt",{jahr:a.jahr+1,datum:formatDateDe(a.datum),ja:a.ja,nein:600-a.ja})}</p>
    </header>
    <div className="hb-inhalt">
      <h5>{t("hb.sofort")}</h5>
      <dl className="hb-zahlen">
        <div><dt>{t("hb.defizitDelta")}</dt><dd>{t("hb.ppBip",{n:sign(d)})}</dd></div>
        <div><dt>{t("hb.legitimitaet")}</dt><dd>{sign(a.nachher.legitimitaet-a.vorher.legitimitaet)}</dd></div>
        <div><dt>{t("hb.zustimmung")}</dt><dd>{sign(a.nachher.zustimmung-a.vorher.zustimmung)}</dd></div>
      </dl>
      <p>{t(!a.angenommen?"hb.alterHaushalt":d>1e-8?"hb.mehrAusgaben":d< -1e-8?"hb.wenigerAusgaben":"hb.saldoGleich")}</p>
      {a.vorher.finanzen&&a.nachher.finanzen&&<p>{t("sf.beschlussGeld",{n:sign(a.nachher.finanzen.kreditMrd-a.vorher.finanzen.kreditMrd,1)})}</p>}
      {minister.length>0&&<ul className="hb-liste">{minister.map(p=><li key={p.id}>{t("hb.minister",{name:p.name,n:sign(p.delta,1)})}</li>)}</ul>}
      <details><summary>{t("hb.posten")}</summary><ul className="hb-liste">{a.posten.map(p=>{
        const u=b.umsetzung.find(x=>x.id===p.id);
        return <li key={p.id}><b>{posten(p.id)}</b><span>{t("hb.stufen",{vor:p.vorher,ziel:p.ziel,nach:p.danach})}</span>
          {a.angenommen&&u&&<small>{t("hb.reife",{wirksam:zahl(u.wirksam,2),ziel:u.heute,monate:p.reifeMonate})}{u.ersetzt&&` ${t("hb.ersetzt")}`}</small>}
        </li>;
      })}</ul></details>

      <h5>{t("hb.zusagen")}</h5><p>{t("hb.bindung")}</p>
      {b.zusagen.length===0?<p>{t("hb.keineZusagen")}</p>:<ul className="hb-zusagen">{b.zusagen.map(s=><li key={s.z.id}>
        <div><b>{zusageVon(s.z.von)}</b><span className={`hb-status ${s.status}`}>{t(`hb.status.${s.status}`)}</span></div>
        <p>{zusageText(s.z)}</p><small>{t(`hb.quelle.${s.quelle}`)}</small>
        <p>{t("hb.frist",{datum:formatDateDe(s.datum)})}</p>
        {s.z.stufeZiel!==undefined&&s.z.massnahme&&<p>{t("hb.ziel",{name:knoten(s.z.massnahme),n:zahl(s.z.stufeZiel,1)})}</p>}
      </li>)}</ul>}
      <UbVerweis ziel={{art:"zusagen"}}>{t("hb.zusagenAktion")}</UbVerweis>
      {a.abkommen.length>0&&<details><summary>{t("hb.abkommen")}</summary><ul className="hb-liste">{a.abkommen.map((v,i)=><li key={`${v.partei}-${v.art}-${i}`}>
        <b>{zusageVon(v.partei)} · {t(`fa.${v.art}`)}</b><span>{t("hb.vertrag",{datum:formatDateDe(v.datum),pk:v.pk,auf:zahl(v.aufmerksamkeit,0),n:sign(v.bereitschaft,0)})}</span>
      </li>)}</ul></details>}

      <h5>{t("hb.wirkung")}</h5>
      {b.reifung?<>
        <p>{t("hb.reifungErklaert",{datum:formatDateDe(b.reifung.datum)})}</p>
        <dl className="hb-zahlen"><div><dt>{t("vm.zivil")}</dt><dd>{t("hb.pp",{n:sign(b.reifung.deckung*100)})}</dd></div>
          <div><dt>{t("vm.handel")}</dt><dd>{t("vm.mrdUsd",{n:sign(b.reifung.handel,3)})}</dd></div>
          {b.reifung.einsatz!==undefined&&<div><dt>{t("vm.einsatz")}</dt><dd>{t("hb.pp",{n:sign(b.reifung.einsatz*100)})}</dd></div>}
        </dl>
        {Math.abs(b.reifung.deckung)<0.00005&&<p>{t("hb.deckungGleich")}</p>}
        {b.reifung.knoten.length>0&&<details><summary>{t("hb.treiber")}</summary><ul className="hb-liste">{b.reifung.knoten.map(k=><li key={k.id}><b>{knoten(k.id)}</b><span>{t("hb.punkte",{n:sign(k.delta,3)})}</span></li>)}</ul></details>}
        <p className="hb-hinweis">{t("hb.vergleichGrenze")}</p>
      </>:<p>{t(!a.angenommen?"hb.keineReifung":b.umsetzung.length>0&&b.umsetzung.every(p=>p.ersetzt)?"hb.ersetztAlle":"hb.wartet")}</p>}
      <h5>{t("hb.beobachtet")}</h5><p>{t("hb.beobachtungGrenze")}</p>
      <dl className="hb-zahlen"><div><dt>{t("hb.defizit")}</dt><dd>{t("hb.prozent",{n:zahl(b.stand.defizit,2)})}</dd></div>
        <div><dt>{t("hb.wachstum")}</dt><dd>{t("hb.prozent",{n:zahl(b.stand.wachstum,2)})}</dd></div>
        <div><dt>{t("hb.schulden")}</dt><dd>{t("hb.prozent",{n:zahl(b.stand.schulden,2)})}</dd></div>
      </dl>
      {b.versorgung?<p>{t("hb.versorgung",{monat:b.versorgung.monat,n:zahl(b.versorgung.deckung*100,1),handel:sign(b.versorgung.handel,3)})}</p>:<p>{t("hb.keineVersorgung")}</p>}

      {b.stand.finanzen&&<aside className="hb-finanzstand">
        <h5>{t("sf.berichtGeld")}</h5>
        <p>{t("sf.berichtStand",{datum:formatDateDe(b.datum),ein:zahl(b.stand.finanzen.einnahmenMrd,1),aus:zahl(b.stand.finanzen.ausgabenMrd,1),kredit:sign(b.stand.finanzen.kreditMrd,1)})}</p>
        <p>{t("sf.realEinnahmen",{datum:formatDateDe(b.stand.finanzen.preisbasis),betrag:t("sf.betrag",{n:zahl(b.stand.finanzen.realEinnahmenMrd,1)})})}</p>
      </aside>}
      <h5>{t("hb.koalition")}</h5><p>{t("hb.sitze",{vor:a.nachher.sitze,nach:b.stand.sitze})}</p>
      <p className="hb-hinweis">{t("hb.politikGrenze")}</p>
      <ul className="hb-liste">{partner.map(p=><li key={p.partei}><b>{zusageVon(p.partei)} · {t(`zw.rolle.${p.rolle}`)}</b>
        <span>{t("hb.bereitschaft",{n:zahl(p.bereitschaft,1)})}</span>
        {p.personen.map(f=><span key={f.id}>{t("hb.loyalitaet",{name:f.name,n:f.loyalitaet<20&&Math.round(f.loyalitaet*100)/100>=20?"< 20":zahl(f.loyalitaet,2)})}</span>)}
        {p.rolle==="koalition"&&p.personen.some(f=>f.loyalitaet<20)&&<p className="hb-warnung">{t("hb.gefahr",{datum:formatDateDe(naechsteKoalitionspruefung(b.datum)),sitze:p.sitze})}</p>}
      </li>)}</ul>
      {b.koalition&&<p className="hb-warnung">{t("hb.austritte",{parteien:b.koalition.austritte.map(p=>zusageVon(p.partei)).join(", "),datum:formatDateDe(b.koalition.datum),vor:b.koalition.vorher,nach:b.koalition.nachher})}</p>}
      {b.druck.map(d=><ZusagenDruck key={d.partei} lage={d}/>)}
      <UbVerweis ziel={{art:"akte",akte:"parlament"}}>{t("hb.koalitionAktion")}</UbVerweis>
      {!!b.ressort?.length&&<RessortFolgen folgen={b.ressort}/>}
      {!!b.ressortnachsorge?.length&&<RessortErholungsVerlauf beobachtungen={b.ressortnachsorge}/>}
      {!!b.ministerpolitik?.length&&<RessortPolitikVerlauf vorfaelle={b.ministerpolitik}/>}
      {world&&geaendert&&<HaushaltsGegenmassnahmen world={world} beschluss={a.id} geaendert={geaendert}/>}
    </div>
  </section>;
}

export function HaushaltsNachbericht({world,geaendert}:{world:World;geaendert?:()=>void}) {
  const jetzt=haushaltsNachsorge(world);if(!jetzt)return null;
  const monate=(world.spiel?.wirtschaft?.haushalt.monatsberichte??[]).filter(b=>b.abschluss.id===jetzt.abschluss.id).slice().reverse();
  return <><HaushaltsMonatsbericht bericht={jetzt} aktuell world={world} geaendert={geaendert}/>
    {monate.map(b=><details key={b.monat}><summary>{t("hb.archiv",{monat:b.monat})}</summary><HaushaltsMonatsbericht bericht={b}/></details>)}
  </>;
}
