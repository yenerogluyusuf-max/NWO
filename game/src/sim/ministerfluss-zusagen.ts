// Die Mappe erledigt einen Arbeitsschritt. Die zugrunde liegende Zusage bleibt bis zur Erfüllung oder zum Bruch offen.
import type { World } from "./types";
import type { GeseheneZusage, VerfalleneVorlage } from "./ministerfluss-typen";
import { zusageVorhaben } from "./zusagen";
import { addDays } from "./dates";
import { msg } from "../i18n";

export function geseheneZusage(w:World,thema:string):GeseheneZusage|undefined {
  const z=w.spiel?.zusagen.find(z=>thema===`zusage:${z.id}`);
  return z?{id:z.id,faellig:z.faellig,vertroestet:z.vertroestet??0}:undefined;
}

/** Nur Buchführung, keine politischen Wirkungen; kein erfundener Bruch bei einem verschwundenen Altvorgang. */
export function zusagenAusgang(w:World,id:string,vorher?:GeseheneZusage):Pick<VerfalleneVorlage,"zusage"|"grund"> {
  const z=w.spiel?.zusagen.find(z=>z.id===id),v=z?zusageVorhaben(w,z):null;
  const status:NonNullable<VerfalleneVorlage["zusage"]>["status"] = !z?"entfallen":z.erfuellt?"erfuellt":z.gebrochen?"gebrochen":
    vorher&&(z.vertroestet??0)>vorher.vertroestet?"vertroestet":v?.gesetz&&v.decktZiel?"beratung":"offen";
  const offen=status==="beratung"||status==="vertroestet"||status==="offen";
  return {grund:msg(`mzr.grund.${status}`),zusage:{id,status,
    ...(offen&&z?{faellig:addDays(w.date,z.faellig-w.day)}:{}),
    ...(status==="beratung"&&v?.gesetz?{abstimmung:addDays(w.date,v.gesetz.abstimmung-w.day)}:{})}};
}

/** Die UI pflegt auch Entscheidungen aus anderen Akten am selben Tag nach. */
export function zusagenMappenStand(w:World):string {
  return JSON.stringify([w.day,w.spiel?.zusagen,w.spiel?.gesetze]);
}

export function istVerfallen(v:VerfalleneVorlage):boolean {
  return v.zusage?v.zusage.status==="gebrochen":v.quelle!=="zusage";
}
