import type { World } from "./types";
import { beschliesseVersorgungsKurs, neueVersorgungsVorlage, regierungsPruefung, versorgungsKonditionen, type EnergiePartner, type VersorgungsProgramm, type RegierungsReaktion } from "./versorgungspolitik";
import { auslaufendeVersorgungsDuldungen, versorgungsBruchrisiken, versorgungsStimmen } from "./versorgungsmehrheit";
import { versorgungsReaktionsVorschau } from "./versorgungsberatung";
import type { VersorgungsPrioritaet } from "./versorgung";
import { startBereitschaft } from "./fraktionen";
import { drohtKoalitionsbruch, naechsteKoalitionspruefung, regierungsSitze } from "./koalitionslage";

/** Ein neuer Antrag übernimmt keine Klauseln, Gespräche oder Stimmen eines alten Beschlusses. */
export function versorgungsStartVorschau(w:World,programm:VersorgungsProgramm,partner:EnergiePartner="AZE") {
  const vorlage=neueVersorgungsVorlage(w,programm,partner);
  // Die bestehende Transportprüfung darf ihre Lesedaten aufbauen, aber nicht die betrachtete Welt verändern.
  const grund=regierungsPruefung(structuredClone(w),programm,partner);
  const stimmen=versorgungsStimmen(w,vorlage,vorlage.abstimmung);
  const ja=stimmen.reduce((n,f)=>n+f.ja,0),konditionen=versorgungsKonditionen(vorlage);
  return {vorlage,grund,stimmen,ja,fehlt:Math.max(0,301-ja),konditionen,
    ab:vorlage.abstimmung+konditionen.vorlauf,bis:vorlage.abstimmung+konditionen.vorlauf+konditionen.dauer,
    duldungen:auslaufendeVersorgungsDuldungen(w,vorlage.abstimmung),
    bruchrisiken:grund?[]:versorgungsBruchrisiken(w,stimmen,vorlage.abstimmung),
    annahme:versorgungsReaktionsVorschau(w,stimmen,true),ablehnung:versorgungsReaktionsVorschau(w,stimmen,false)};
}

/** Der echte Kurswechsel auf einer Kopie: keine zweite Formel für Kosten oder Parteireaktionen. */
export function versorgungsKursVorschau(w:World,kurs:VersorgungsPrioritaet) {
  const probe=structuredClone(w),ergebnis=beschliesseVersorgungsKurs(probe,kurs);
  const reaktionen:RegierungsReaktion[]=ergebnis.ok?Object.keys(w.parliament?.seats??{}).flatMap(partei=>{
    const bereitschaft=(probe.spiel?.fraktionen?.[partei]?.bereitschaft??startBereitschaft(w,partei))-(w.spiel?.fraktionen?.[partei]?.bereitschaft??startBereitschaft(w,partei));
    const personen=(probe.spiel?.figuren??[]).flatMap(f=>{
      if(f.partei!==partei)return [];
      const alt=w.spiel?.figuren.find(a=>a.id===f.id),delta=alt?f.loyalitaet-alt.loyalitaet:0;
      return delta?[{name:f.name,loyalitaet:delta}]:[];
    });
    return bereitschaft||personen.length?[{partei,bereitschaft,personen}]:[];
  }):[];
  const risiken=ergebnis.ok?(probe.spiel?.figuren??[]).filter(f=>drohtKoalitionsbruch(probe,f)).map(f=>({
    id:f.id,name:f.name,partei:f.partei!,vorher:w.spiel!.figuren.find(a=>a.id===f.id)!.loyalitaet,nachher:f.loyalitaet,
    sitze:w.parliament?.seats[f.partei!]??0,rest:regierungsSitze(w,f.partei),datum:naechsteKoalitionspruefung(w.date),
  })):[];
  return {kurs,grund:ergebnis.ok?undefined:ergebnis.text,pk:ergebnis.ok?w.spiel!.kapital-probe.spiel!.kapital:3,
    bis:ergebnis.ok?probe.spiel!.gueter!.regierung!.kursAb!:w.day+30,reaktionen,risiken};
}
