import { geldAusBip } from "./staatsgeld";
import type { World } from "./types";
import { haushaltZustand, defizitJetzt } from "./wirtschaft";
import { POSTEN_NACH_ID, inSpanne, stufeVon, postenVorschau, setzePosten, setzeEntwurf, haushaltsfenster, haushaltsEntwurfsSicht } from "./haushalt";
import { ministerFuer } from "./ministerfluss-kern";
import { wertVon } from "./personen";
import { t } from "../i18n";

/** Die echte Handlung auf einer Kopie liefert Preis, Sperre und unmittelbare Folgen. */
export function haushaltsPostenEntscheidung(w:World,id:string,ziel:number) {
  const p=POSTEN_NACH_ID[id];if(!p)return;
  const k=structuredClone(w),z=haushaltZustand(k),vor=stufeVon(k,id),plan=z.entwurf?.[id]??vor;
  ziel=inSpanne(p,ziel);
  const v=postenVorschau(k,id,ziel),modus=haushaltsfenster(k).offen?"entwurf":"nachtrag";
  const kapital=k.spiel?.kapital??0,leg=wertVon(k,"legitimitaet"),minister=ministerFuer(k,p.amt),loyal=minister?.loyalitaet??0;
  const r=k.spiel?.ende?{ok:false,text:t("eo.amtsende")}:modus==="entwurf"&&plan===ziel?{ok:false,text:t("eo.keineAenderung")}:modus==="entwurf"?setzeEntwurf(k,id,ziel):setzePosten(k,id,ziel);
  return {id,ziel,vor,plan,modus,entfernen:modus==="entwurf"&&ziel===vor&&plan!==vor,ok:r.ok,grund:r.ok?undefined:r.text,
    finanzMrd:geldAusBip(w,v.impuls),
    pk:modus==="entwurf"?0:r.ok?kapital-k.spiel!.kapital:v.kapital,
    defizitVorher:v.defizitVorher,defizitNachher:v.defizitNachher,impuls:v.impuls,
    legitimitaet:r.ok?wertVon(k,"legitimitaet")-leg:0,loyalitaet:r.ok&&minister?minister.loyalitaet-loyal:0,
    vorschau:v,
  };
}
export type HaushaltsPostenEntscheidung=NonNullable<ReturnType<typeof haushaltsPostenEntscheidung>>;

export function fuehreHaushaltsPostenAus(w:World,p:HaushaltsPostenEntscheidung) {
  const aktuell=haushaltsPostenEntscheidung(w,p.id,p.ziel);
  if(!aktuell?.ok||JSON.stringify(aktuell)!==JSON.stringify(p))return {ok:false,text:aktuell?.grund??t("vn.veraltet")};
  return p.modus==="entwurf"?setzeEntwurf(w,p.id,p.ziel):setzePosten(w,p.id,p.ziel);
}

/** Gemeinsame Summe aller Entwurfsposten, ohne in der echten Welt etwas zu beschließen. */
export function haushaltsEntscheidung(w:World) {
  const k=structuredClone(w),z=haushaltZustand(k),prognose=haushaltsEntwurfsSicht(k),vor=defizitJetzt(k);
  if(!prognose)return;
  for(const [id,ziel] of Object.entries(z.entwurf??{}))if(POSTEN_NACH_ID[id]&&ziel!==stufeVon(k,id))setzePosten(k,id,ziel,true);
  return {prognose,vor,nach:defizitJetzt(k),finanzMrd:geldAusBip(k,defizitJetzt(k)-vor),grund:w.spiel?.ende?t("eo.amtsende"):undefined};
}
