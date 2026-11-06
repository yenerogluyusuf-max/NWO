import type { World } from "../../sim/types";
import { VERHANDLUNG, type FraktionSicht, type Verhandlung } from "../../sim/verhandeln";
import { AUFMERKSAMKEIT_KOSTEN } from "../../sim/aufmerksamkeit";
import { PARTNER_START_LOYALITAET } from "../../sim/figuren";
import { KOALITIONSBRUCH_LOYALITAET, naechsteKoalitionspruefung } from "../../sim/koalitionslage";
import { addDays, formatDateDe } from "../../sim/dates";
import { t, zahl } from "../../i18n";
import { stufenName } from "../../data/skalen";
import "../minister/ressorterholung.css";

/** Sichtbare Bedingungen direkt am Abschluss; keine eigene Verhandlungsregel. */
export function FraktionsAbkommen({world,fraktion:f,onVerhandlung}:{world:World;fraktion:FraktionSicht;onVerhandlung:(art:Verhandlung)=>void}) {
  const angebote=f.aktionen.filter(a=>a.id==="duldung"||a.id==="koalition");
  if(!angebote.length)return null;
  // ENTSCHEIDUNGEN Z (06.11.2026): Bedingungen als Chips; Erläuterungen stehen am Titel der Karte
  return <div className="fraktion-abkommen" aria-label={t("fa.titel",{partei:f.name})} title={t("fa.stimmen")}>
    {f.zusagenziel && <div className="fa-ziel" title={t("fa.zielFest")}>
      <b>{f.zusagenziel.name}</b>
      <dl>
        <div><dt>{t("fa.ausgang")}</dt><dd>{f.zusagenziel.startName ?? stufenName(f.zusagenziel.massnahme,f.zusagenziel.stufeStart)}</dd></div>
        <div><dt>{t("fa.ziel")}</dt><dd>{f.zusagenziel.zielName ?? stufenName(f.zusagenziel.massnahme,f.zusagenziel.stufeZiel)}</dd></div>
      </dl>
      {f.zusagenziel.bereitsBeschlossen && <span className="rk-chip" title={t("fa.zielBeschlossen")}>{t("welle_b2.fa.beschlossen")}</span>}
    </div>}
    {angebote.map(a=>{
    const koalition=a.id==="koalition",tage=koalition?VERHANDLUNG.koalitionZusageTage:VERHANDLUNG.duldungTage;
    const aufmerksamkeit=koalition?AUFMERKSAMKEIT_KOSTEN.koalition:AUFMERKSAMKEIT_KOSTEN.duldung;
    const restAufmerksamkeit=Math.max(0,(world.spiel?.verfassung?.aufmerksamkeit??80)-aufmerksamkeit);
    const datum=formatDateDe(addDays(world.date,tage));
    return <article key={a.id}>
      <h4>{t(koalition?"fa.koalition":"fa.duldung")}</h4>
      <div className="rk-chips">
        <span className="rk-chip"><b>{t("fa.preis",{pk:a.pk,aufmerksamkeit})}</b></span>
        {koalition && <span className="rk-chip" title={t("fa.sitze",{n:f.sitze})}><span>{t("welle_b2.fa.sitze")}</span><b>+{f.sitze}</b></span>}
        <span className="rk-chip" title={t(koalition?"fa.unbefristet":"fa.befristet",{datum})}><span>{t("welle_b2.fa.laufzeit")}</span><b>{koalition?t("welle_b2.fa.unbefristet"):t("welle_b2.fa.bis",{datum})}</b></span>
      </div>
      {a.moeglich&&world.spiel!.kapital-a.pk<0 && <p className="fa-warnung">{t("vn.aufPump",{n:zahl(world.spiel!.kapital-a.pk,1)})}</p>}
      {a.moeglich&&restAufmerksamkeit<20 && <p className="fa-warnung">{t("vn.erschoepfung",{n:zahl(restAufmerksamkeit,0)})}</p>}
      <div className="rk-chips"><span className="rk-chip fa-zusage" title={t("fa.zusage",{forderung:f.forderung,datum})}><span>{t("welle_b2.fa.zusage",{datum})}</span><b>{f.forderung}</b></span></div>
      {koalition && <div className="fa-vorsitz"><b>{t("fa.vorsitz")}</b>
        <div className="rk-chips">{f.vorsitz.length?f.vorsitz.map(p=><span key={p.id} className={`rk-chip${p.loyalitaet<KOALITIONSBRUCH_LOYALITAET?" schlecht":""}`} title={t("fa.bleibt",{name:p.name,n:zahl(p.loyalitaet,1)})}><span>{p.name}</span><b>{p.loyalitaet<KOALITIONSBRUCH_LOYALITAET&&Math.round(p.loyalitaet*10)/10>=KOALITIONSBRUCH_LOYALITAET?t("vm.bruch.knapp",{grenze:KOALITIONSBRUCH_LOYALITAET}):zahl(p.loyalitaet,1)}</b></span>):<span className="rk-chip" title={t("fa.neu",{n:PARTNER_START_LOYALITAET})}><span>{t("welle_b2.fa.neu")}</span><b>{PARTNER_START_LOYALITAET}</b></span>}</div>
        {f.vorsitz.some(p=>p.loyalitaet<KOALITIONSBRUCH_LOYALITAET) && <p className="fa-warnung" title={t("fa.bruch",{grenze:KOALITIONSBRUCH_LOYALITAET,datum:formatDateDe(naechsteKoalitionspruefung(world.date))})}>{t("welle_b2.fa.bruch",{grenze:KOALITIONSBRUCH_LOYALITAET,datum:formatDateDe(naechsteKoalitionspruefung(world.date))})}</p>}
      </div>}
      {!a.moeglich && <p className="fa-warnung">{a.grund}</p>}
      <button type="button" className="pd-btn" disabled={!a.moeglich} onClick={()=>onVerhandlung(a.id)} aria-label={t("fa.handeln",{aktion:a.label,partei:f.name})}>{a.label}</button>
    </article>;
  })}</div>;
}
