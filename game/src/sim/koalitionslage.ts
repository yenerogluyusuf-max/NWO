import type { World } from "./types";
import type { Figur } from "./spiel-typen";

/** Dieselben Grenzen in Monatsprüfung und politischer Nachsorge; 35 ist nur eine Frühwarnung. */
export const KOALITIONSBRUCH_LOYALITAET=20;
export const KOALITIONSWARNUNG_LOYALITAET=35;
/** Parteizusagen richten sich an den aktiven Vorsitz, auch außerhalb des Regierungslagers. */
export function aktiveParteivorsitzende(w:World,partei:string):Figur[] {
  return (w.spiel?.figuren??[]).filter(f=>f.amt==="partner"&&f.imAmt&&f.partei===partei).sort((a,b)=>a.id.localeCompare(b.id));
}
export function aktiverKoalitionsVorsitz(w:World,f:Figur):boolean {
  return f.amt==="partner" && f.imAmt && !!f.partei && f.partei!==w.player?.partei.kurz && !!w.spiel?.lager.includes(f.partei);
}
export function drohtKoalitionsbruch(w:World,f:Figur):boolean {
  return aktiverKoalitionsVorsitz(w,f) && f.loyalitaet<KOALITIONSBRUCH_LOYALITAET;
}
export function regierungsSitze(w:World,ohne?:string):number {
  const parteien=new Set([w.player?.partei.kurz,...w.spiel?.lager??[]]);
  return [...parteien].reduce((sum,p)=>sum+(p && p!==ohne ? w.parliament?.seats[p]??0 : 0),0);
}
/** Im Tageslauf kommt das Votum vor der Monatsprüfung am Ersten. */
export function naechsteKoalitionspruefung(datum:string,inklusive=false):string {
  const d=new Date(`${datum}T12:00:00Z`);
  if(!inklusive || d.getUTCDate()!==1)d.setUTCMonth(d.getUTCMonth()+1,1);
  return d.toISOString().slice(0,10);
}
