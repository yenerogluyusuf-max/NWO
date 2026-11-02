import { useId, useState, type ReactNode } from "react";
import { t } from "../../i18n";
import "./entscheidung.css";

export interface EntscheidungsWeg { id:string; titel:string; kurz:string; preis:string; hinweis?:string }

/** Die Auswahl ist unverbindlich. Nur die gewählte Alternative baut ihre ausführliche Vorschau auf. */
export function EntscheidungsWege({wege,inhalt,wahl:onWahlWert,onWahl}:{
  wege:EntscheidungsWeg[];inhalt:(id:string)=>ReactNode;wahl?:string|null;onWahl?:(id:string|null)=>void;
}) {
  const id=useId(),[innen,setInnen]=useState<string|null>(null);
  const wahl=onWahlWert===undefined?innen:onWahlWert;
  const aktiv=wege.find(w=>w.id===wahl);
  const waehle=(wert:string)=>{const neu=wert===wahl?null:wert;setInnen(neu);onWahl?.(neu);};
  return <div className="ew-wege">
    <p className="ew-hinweis">{t("eo.auswahlHinweis")}</p>
    <div className="ew-auswahl" role="group" aria-label={t("eo.alternativen")}>
      {wege.map((w,i)=><button key={w.id} type="button" id={`${id}-${i}`} className={aktiv?.id===w.id?"on":""} aria-expanded={aktiv?.id===w.id} aria-controls={`${id}-vorschau`} onClick={()=>waehle(w.id)}>
        <span className="ew-nummer" aria-hidden="true">{String(i+1).padStart(2,"0")}</span>
        <span className="ew-text"><strong>{w.titel}</strong><span>{w.kurz}</span><b>{w.preis}</b>{w.hinweis&&<small>{w.hinweis}</small>}</span>
        <span className="ew-pfeil" aria-hidden="true">{aktiv?.id===w.id?"−":"+"}</span>
      </button>)}
    </div>
    <div id={`${id}-vorschau`} className="ew-detail" role="region" aria-label={aktiv?.titel??t("eo.vorschau")}>
      {aktiv?inhalt(aktiv.id):<p className="ew-leer">{t("eo.waehlen")}</p>}
    </div>
  </div>;
}
