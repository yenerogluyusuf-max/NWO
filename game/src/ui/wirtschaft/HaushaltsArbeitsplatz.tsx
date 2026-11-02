import { useId, type ReactNode } from "react";
import type { UbKachel } from "../akte/Uebersicht";
import { t } from "../../i18n";

/** Ein Haushaltsbuch mit direkt auswählbaren Ressorts und einem vollwertigen Arbeitsbereich. */
export function HaushaltsArbeitsplatz({kacheln,wahl,onWahl,detail,lage,zahlen}:{
  kacheln:UbKachel[];wahl:string;onWahl:(id:string)=>void;detail:(id:string)=>ReactNode;
  lage:ReactNode;zahlen:{label:string;wert:string}[];
}) {
  const id=useId(),aktiv=kacheln.find(k=>k.id===wahl)??kacheln.find(k=>k.id==="_zyklus")??kacheln[0];
  const gruppen=[...new Set(kacheln.map(k=>k.gruppe??""))];
  return <div className="hw-arbeitsplatz">
    <header className="hw-kopf"><div><small>{t("eo.haushalt")}</small><p>{lage}</p></div>
      <dl>{zahlen.map(z=><div key={z.label}><dt>{z.label}</dt><dd>{z.wert}</dd></div>)}</dl>
    </header>
    <div className="hw-flaeche">
      <nav className="hw-verzeichnis" aria-label={t("eo.auswaehlen")}>
        <a href={`#${id}-inhalt`} className="hw-sprung">{t("eo.zumInhalt")}</a>
        <label className="hw-mobil" htmlFor={`${id}-wahl`}>{t("eo.auswaehlen")}
          <select id={`${id}-wahl`} value={aktiv?.id??""} onChange={e=>onWahl(e.target.value)}>{gruppen.map(g=><optgroup label={g||t("eo.haushalt")} key={g}>{kacheln.filter(k=>(k.gruppe??"")===g).map(k=><option value={k.id} key={k.id}>{k.titel}</option>)}</optgroup>)}</select>
        </label>
        <div className="hw-zeilen">{gruppen.map(g=><section key={g} aria-label={g||t("eo.haushalt")}>
          {g&&<h4>{g}</h4>}{kacheln.filter(k=>(k.gruppe??"")===g).map(k=><button type="button" key={k.id} className={`hw-eintrag ${aktiv?.id===k.id?"on":""}`} aria-current={aktiv?.id===k.id?"page":undefined} aria-controls={`${id}-inhalt`} onClick={()=>onWahl(k.id)}>
            <span><b>{k.titel}</b>{k.zeile&&<small>{k.zeile}</small>}{k.marke&&<small className={`hw-marke ${k.marke.ton}`}>{k.marke.text}</small>}</span>
            {k.wert&&<span className="hw-wert">{k.wert}<small>{k.wertLabel}</small></span>}
          </button>)}
        </section>)}</div>
      </nav>
      <section id={`${id}-inhalt`} className="hw-inhalt" tabIndex={-1} aria-label={aktiv?.titel??t("eo.haushalt")}>{aktiv&&detail(aktiv.id)}</section>
    </div>
  </div>;
}
