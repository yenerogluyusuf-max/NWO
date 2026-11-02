import type { ZusagenDruckLage } from "../../sim/zusagendruck";
import { zusageText } from "../../sim/zusagen";
import { PARTEI_NAME } from "../../sim/fraktionen";
import { formatDateDe } from "../../sim/dates";
import { t, zahl } from "../../i18n";
import "./zusagendruck.css";

const loyal = (n:number) => n < 20 && Math.round(n*100)/100 >= 20 ? `< ${zahl(20,0)}` : zahl(n,2);

/** Gemeinsame bedingte Fristenfolge, im Überblick und nach einer vorgeschlagenen Handlung. */
export function ZusagenDruck({lage,danach=false,onErinnerung}:{lage:ZusagenDruckLage|undefined;danach?:boolean;onErinnerung?:(id:string)=>void}) {
  if (!lage) return null;
  const erste=lage.erinnerungen[0]!;
  return <aside className={`zd${lage.bruch?" zd-gefahr":""}`} aria-label={t("zd.titel")}>
    <header><b>{t(danach?"zd.nachSchritt":"zd.titel")}</b><span>{PARTEI_NAME[lage.partei]??lage.partei}</span></header>
    <p>{t("zd.summe",{n:lage.erinnerungen.length,datum:formatDateDe(lage.pruefung),vor:loyal(lage.loyalitaet),nach:loyal(lage.nachVerfall)})}</p>
    <p className="zd-folge">{t(lage.bruch?"zd.bruch":"zd.puffer",{sitze:lage.sitze,rest:lage.ohne})}</p>
    <p>{t("zd.schritt",{zusage:zusageText(erste.zusage),datum:formatDateDe(erste.datum)})}</p>
    {onErinnerung&&<button type="button" className="zd-handeln" onClick={()=>onErinnerung(erste.ereignis)}>{t("zd.antworten")}</button>}
    <details><summary>{t("zd.details",{n:lage.erinnerungen.length})}</summary>
      <ul>{lage.erinnerungen.map(e=><li key={e.zusage.id}><span>{zusageText(e.zusage)}</span><time dateTime={e.datum}>{t("zd.frist",{datum:formatDateDe(e.datum)})}</time></li>)}</ul>
      <p className="zd-hinweis">{t("zd.grenze")}</p>
    </details>
  </aside>;
}
