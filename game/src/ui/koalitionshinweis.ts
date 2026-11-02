// Gemeinsame politische Einordnung für Lagewarnung und Mentorin; dieselben aktiven Personen und Schwellen wie im Monatslauf.
import type { World } from "../sim/types";
import { aktiverKoalitionsVorsitz, KOALITIONSBRUCH_LOYALITAET, KOALITIONSWARNUNG_LOYALITAET, naechsteKoalitionspruefung, regierungsSitze } from "../sim/koalitionslage";
import { formatDateDe } from "../sim/dates";
import { t, zahl } from "../i18n";

export function koalitionsHinweis(w:World) {
  const f=(w.spiel?.figuren??[]).filter(f=>aktiverKoalitionsVorsitz(w,f)&&f.loyalitaet<KOALITIONSWARNUNG_LOYALITAET)
    .sort((a,b)=>a.loyalitaet-b.loyalitaet||a.id.localeCompare(b.id))[0];
  if(!f)return;
  const akut=f.loyalitaet<KOALITIONSBRUCH_LOYALITAET;
  const loyalitaet=akut&&Math.round(f.loyalitaet*100)/100>=KOALITIONSBRUCH_LOYALITAET?`< ${KOALITIONSBRUCH_LOYALITAET}`:zahl(f.loyalitaet,2);
  return {figur:f.id,akut,text:t(akut?"sl.partner.akut":"sl.partner.frueh",{name:f.name,partei:f.partei!}),
    warum:t(akut?"sl.partner.bruch":"sl.partner.puffer",{loyalitaet,datum:formatDateDe(naechsteKoalitionspruefung(w.date)),sitze:w.parliament?.seats[f.partei!]??0,rest:regierungsSitze(w,f.partei)}),
    hilfe:t("sl.partner.hilfe")};
}
