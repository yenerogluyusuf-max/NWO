import type { World } from "../../sim/types";
import type { VersorgungsProgramm } from "../../sim/versorgungspolitik";
import { versorgungsMehrheitsWege, uebernehmeVersorgungsWeg } from "../../sim/versorgungsberatung";
import { addDays, formatDateDe } from "../../sim/dates";
import { PARTEI_NAME } from "../../sim/fraktionen";
import { t, zahl } from "../../i18n";
import "./mehrheitswege.css";
import { VersorgungsBruchwarnung } from "./VersorgungsBruchwarnung";

const name=(p:string)=>PARTEI_NAME[p]??p;
const delta=(n:number,stellen=0)=>`${n>0?"+":""}${zahl(n,stellen)}`;

export function VersorgungsMehrheitsWege({world,programm,onErgebnis}:{world:World;programm:VersorgungsProgramm;onErgebnis:(r:{ok:boolean;text:string})=>void}) {
  const wege=versorgungsMehrheitsWege(world,programm);
  const datum=(tag:number)=>formatDateDe(addDays(world.date,tag-world.day));
  return <section className="mw-beratung" aria-label={t("mehrheitsweg.titel")}>
    <header><span className="mw-kicker">{t("mehrheitsweg.kicker")}</span><h5>{t("mehrheitsweg.titel")}</h5><p>{t("mehrheitsweg.einstieg")}</p></header>
    {!wege.length ? <p className="mw-leer">{t("mehrheitsweg.keinWeg")}</p> : <>
      {wege.every(p=>p.fehlt>0) && <p className="mw-warnung">{t("mehrheitsweg.keineMehrheit")}</p>}
      <div className="mw-wege">{wege.map((p,i)=>{
        const gewinner=p.stimmen.filter(f=>f.delta>0), verlierer=p.stimmen.filter(f=>f.delta<0);
        const koalition=p.reaktionen.filter(r=>p.stimmen.some(f=>f.partei===r.partei&&f.rolle==="koalition") && (r.bereitschaft<0||r.personen.some(f=>f.loyalitaet<0)));
        return <article className={`mw-weg${p.fehlt?" mw-unvollstaendig":""}`} key={p.stand}>
          <header><span className="mw-nummer" aria-hidden="true">0{i+1}</span><div><h6>{t(`mehrheitsweg.${p.schwerpunkt}`)}</h6><p>{t(p.fehlt?"mandat.fehlen":"mehrheitsweg.puffer",{n:p.fehlt||p.puffer})}</p></div><div className="mw-ergebnis"><b>{p.ja}</b><span>{t("mandat.erwartet")}</span><small className={p.delta<0?"rg-minus":"rg-plus"}>{t("mandat.stimmenDelta",{n:delta(p.delta)})}</small></div></header>
          <div className="mw-weg-body">
            <div className="mw-gewinne"><b>{t("mehrheitsweg.gewinnbar")}</b><p>{gewinner.length?gewinner.map(f=>`${name(f.partei)} ${delta(f.delta)}`).join(" · "):t("mehrheitsweg.keinZuwachs")}</p>
              {verlierer.length>0 && <p className="rg-minus">{t("mehrheitsweg.verlust",{parteien:verlierer.map(f=>`${name(f.partei)} ${delta(f.delta)}`).join(" · ")})}</p>}
            </div>
            <ul className="mw-schritte">
              {p.entfernt.map(k=><li key={`ab-${k}`}><span aria-hidden="true">−</span>{t("mehrheitsweg.entfernen",{klausel:t(`mandat.${k}.titel`)})}</li>)}
              {p.hinzu.map(k=><li key={k}><span aria-hidden="true">+</span>{t("mehrheitsweg.aufnehmen",{klausel:t(`mandat.${k}.titel`)})}</li>)}
              {p.gespraeche.map(partei=><li key={partei}><span aria-hidden="true">↗</span>{t("mehrheitsweg.gespraech",{partei:name(partei)})}</li>)}
            </ul>
            <dl className="mw-kosten"><div><dt>{t("mehrheitsweg.sofort")}</dt><dd>{p.pk} Kapital</dd></div><div><dt>{t("mandat.budgetBeiAnnahme")}</dt><dd>{zahl(p.konditionen.bip,3)} % BIP<small>{t("mehrheitsweg.budgetDelta",{n:delta(p.budgetDelta,3)})}</small></dd></div></dl>
            <p className="mw-zeit">{t("mehrheitsweg.zeit",{datum:datum(p.abstimmung),vorlauf:p.konditionen.vorlauf,dauer:p.konditionen.dauer})}</p>
            {p.verschiebung>0 && <p className="mw-warnung">{t("mandat.votumVerschoben",{tage:p.verschiebung,datum:datum(p.abstimmung)})}</p>}
            {p.duldungen.length>0 && <p className="mw-warnung">{t("mehrheitsweg.duldung",{parteien:p.duldungen.map(f=>name(f.partei)).join(", ")})}</p>}
            <VersorgungsBruchwarnung risiken={p.bruchrisiken}/>
            <div className={`mw-politik${koalition.length?" mw-konflikt":""}`}><b>{t("mehrheitsweg.preis")}</b>
              <p>{koalition.length?t("mehrheitsweg.koalitionsRisiko",{parteien:koalition.map(r=>name(r.partei)).join(", ")}):t("mehrheitsweg.keinKoalitionsVerlust")}</p>
              {koalition.map(r=><p key={r.partei}><strong>{name(r.partei)}</strong> {t("mandat.bereitschaftDelta",{n:delta(r.bereitschaft,1)})}{r.personen.map(f=><small key={f.name}>{t("mandat.loyalitaetDelta",{name:f.name,n:delta(f.loyalitaet,1)})}</small>)}</p>)}
              <details><summary>{t("mehrheitsweg.folgen")}</summary>
                <p>{t("mehrheitsweg.bedingt")}</p>
                <ul className="mw-fraktionen">{p.stimmen.map(f=>{
                  const reaktion=p.reaktionen.find(r=>r.partei===f.partei);
                  return <li key={f.partei}><div><b>{name(f.partei)}</b><span>{t(`mandat.rolle.${f.rolle}`)}</span></div><strong>{f.vorher} → {f.ja}</strong>
                    <p>{t(f.erfuellt?"mandat.erfuellt":"mandat.fordert",{forderung:t(`mandat.${f.forderung}.titel`)})}{p.gespraeche.includes(f.partei)&&` · ${t("mehrheitsweg.neuesGespraech")}`}</p>
                    {reaktion && <p className={reaktion.bereitschaft<0?"rg-minus":"rg-plus"}>{t("mandat.bereitschaftDelta",{n:delta(reaktion.bereitschaft,1)})}{reaktion.personen.map(f=><small key={f.name}>{t("mandat.loyalitaetDelta",{name:f.name,n:delta(f.loyalitaet,1)})}</small>)}</p>}
                  </li>;
                })}</ul>
                {p.klauseln.length>0 && <div className="mw-zusagen">{p.klauseln.map(k=><p key={k}><b>{t(`mandat.${k}.titel`)}</b>{t(`mandat.${k}.text`)}</p>)}</div>}
              </details>
            </div>
            <button type="button" className="mw-uebernehmen" onClick={()=>onErgebnis(uebernehmeVersorgungsWeg(world,p))} aria-label={t("mehrheitsweg.buttonName",{name:t(`mehrheitsweg.${p.schwerpunkt}`),pk:p.pk})}>{t("mehrheitsweg.button")}<span>{t("mehrheitsweg.pk",{n:p.pk})}</span></button>
          </div>
        </article>;
      })}</div>
      <p className="mw-hinweis">{t("mehrheitsweg.hinweis")}</p>
    </>}
  </section>;
}
