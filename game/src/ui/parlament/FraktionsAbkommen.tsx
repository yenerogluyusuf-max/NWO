import type { World } from "../../sim/types";
import { VERHANDLUNG, type FraktionSicht, type Verhandlung } from "../../sim/verhandeln";
import { AUFMERKSAMKEIT_KOSTEN } from "../../sim/aufmerksamkeit";
import { PARTNER_START_LOYALITAET } from "../../sim/figuren";
import { KOALITIONSBRUCH_LOYALITAET, naechsteKoalitionspruefung } from "../../sim/koalitionslage";
import { addDays, formatDateDe } from "../../sim/dates";
import { t, zahl } from "../../i18n";
import { stufenName } from "../../data/skalen";

/** Sichtbare Bedingungen direkt am Abschluss; keine eigene Verhandlungsregel. */
export function FraktionsAbkommen({world,fraktion:f,onVerhandlung}:{world:World;fraktion:FraktionSicht;onVerhandlung:(art:Verhandlung)=>void}) {
  const angebote=f.aktionen.filter(a=>a.id==="duldung"||a.id==="koalition");
  if(!angebote.length)return null;
  return <div className="fraktion-abkommen" aria-label={t("fa.titel",{partei:f.name})}>
    {f.zusagenziel && <div className="fa-ziel">
      <b>{f.zusagenziel.name}</b>
      <dl>
        <div><dt>{t("fa.ausgang")}</dt><dd>{f.zusagenziel.startName ?? stufenName(f.zusagenziel.massnahme,f.zusagenziel.stufeStart)}</dd></div>
        <div><dt>{t("fa.ziel")}</dt><dd>{f.zusagenziel.zielName ?? stufenName(f.zusagenziel.massnahme,f.zusagenziel.stufeZiel)}</dd></div>
      </dl>
      <p>{t("fa.zielFest")}</p>
      {f.zusagenziel.bereitsBeschlossen && <p>{t("fa.zielBeschlossen")}</p>}
    </div>}
    {angebote.map(a=>{
    const koalition=a.id==="koalition",tage=koalition?VERHANDLUNG.koalitionZusageTage:VERHANDLUNG.duldungTage;
    const aufmerksamkeit=koalition?AUFMERKSAMKEIT_KOSTEN.koalition:AUFMERKSAMKEIT_KOSTEN.duldung;
    const restAufmerksamkeit=Math.max(0,(world.spiel?.verfassung?.aufmerksamkeit??80)-aufmerksamkeit);
    const datum=formatDateDe(addDays(world.date,tage));
    return <article key={a.id}>
      <h4>{t(koalition?"fa.koalition":"fa.duldung")}</h4>
      {koalition && <p>{t("fa.sitze",{n:f.sitze})}</p>}
      <p className="fa-preis">{t("fa.preis",{pk:a.pk,aufmerksamkeit})}</p>
      {a.moeglich&&world.spiel!.kapital-a.pk<0 && <p className="fa-warnung">{t("vn.aufPump",{n:zahl(world.spiel!.kapital-a.pk,1)})}</p>}
      {a.moeglich&&restAufmerksamkeit<20 && <p className="fa-warnung">{t("vn.erschoepfung",{n:zahl(restAufmerksamkeit,0)})}</p>}
      <p>{t(koalition?"fa.unbefristet":"fa.befristet",{datum})}</p>
      <p>{t("fa.zusage",{forderung:f.forderung,datum})}</p>
      {koalition && <div className="fa-vorsitz"><b>{t("fa.vorsitz")}</b>
        {f.vorsitz.length?f.vorsitz.map(p=><p key={p.id}>{t("fa.bleibt",{name:p.name,n:p.loyalitaet<KOALITIONSBRUCH_LOYALITAET&&Math.round(p.loyalitaet*10)/10>=KOALITIONSBRUCH_LOYALITAET?t("vm.bruch.knapp",{grenze:KOALITIONSBRUCH_LOYALITAET}):zahl(p.loyalitaet,1)})}</p>):<p>{t("fa.neu",{n:PARTNER_START_LOYALITAET})}</p>}
        {f.vorsitz.some(p=>p.loyalitaet<KOALITIONSBRUCH_LOYALITAET) && <p className="fa-warnung">{t("fa.bruch",{grenze:KOALITIONSBRUCH_LOYALITAET,datum:formatDateDe(naechsteKoalitionspruefung(world.date))})}</p>}
      </div>}
      {!a.moeglich && <p className="fa-warnung">{a.grund}</p>}
      <button type="button" className="pd-btn" disabled={!a.moeglich} onClick={()=>onVerhandlung(a.id)} aria-label={t("fa.handeln",{aktion:a.label,partei:f.name})}>{a.label}</button>
    </article>;
  })}<p className="fa-hinweis">{t("fa.stimmen")}</p></div>;
}
