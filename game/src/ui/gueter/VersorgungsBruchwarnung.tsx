import type { VersorgungsBruchrisiko } from "../../sim/versorgungsmehrheit";
import { KOALITIONSBRUCH_LOYALITAET } from "../../sim/koalitionslage";
import { PARTEI_NAME } from "../../sim/fraktionen";
import { formatDateDe } from "../../sim/dates";
import { t, zahl } from "../../i18n";
import { UbVerweis } from "../akte/Uebersicht";

export function VersorgungsBruchwarnung({risiken,kompakt=false}:{risiken:VersorgungsBruchrisiko[];kompakt?:boolean}) {
  if(!risiken.length)return null;
  return <aside className="rg-bruchwarnung" aria-label={t("mandat.bruch.titel")}><b>{t("mandat.bruch.titel")}</b>
    {risiken.map(r=><div key={r.partei}><strong>{PARTEI_NAME[r.partei]??r.partei}</strong>
      <p>{t(`mandat.bruch.${r.zeitpunkt}`,{datum:formatDateDe(r.pruefung),grenze:KOALITIONSBRUCH_LOYALITAET})}</p>
      {!kompakt && <><p>{t(r.angenommen?"mandat.bruch.annahme":"mandat.bruch.ablehnung")}</p>
        {r.personen.map(p=><small key={p.id}>{p.name}: {zahl(p.vorher,1)} → {zahl(p.nachher,1)} {t("vn.loyalitaet")}</small>)}
        <p>{t("vn.sitzverlust",{n:r.sitze,rest:r.ohne})}</p></>}
    </div>)}
    {!kompakt && <p>{t("mandat.bruch.handeln")} <UbVerweis ziel={{art:"akte",akte:"personen"}}>{t("mandat.bruch.gespraech")}</UbVerweis></p>}
  </aside>;
}
