// Gesetzliche Verpflichtung hinter einem Wahlversprechen; ausschließlich lesende Vorschau.
import type { World } from './types';
import { versprechenAngebot, verspreche } from './wahlkampf';
import { bringeEin, pruefeVorhaben, gesetzPrognose, setPolicy } from './handeln';
import { AUFMERKSAMKEIT_KOSTEN } from './aufmerksamkeit';
import { geldAusBip } from './staatsgeld';
import { zusageZielErreicht } from './zusagenfolgen';
import { t } from '../i18n';
import { aktiveParteivorsitzende, naechsteKoalitionspruefung } from './koalitionslage';

export function wahlversprechenPlan(w:World,id:string) {
  const angebot=versprechenAngebot(w,id);
  if(!angebot)return;
  const kopie=structuredClone(w);
  if(angebot.moeglich)verspreche(kopie,id);
  const z=angebot.zusage, pr=pruefeVorhaben(kopie,angebot.def.massnahme,z.stufeZiel!,null);
  const laufend=kopie.spiel!.gesetze.find(g=>g.massnahme===angebot.def.massnahme);
  const erreicht=zusageZielErreicht(z,w.net.targets[angebot.def.massnahme]??angebot.aktuell);
  const r=laufend||erreicht?undefined:bringeEin(kopie,angebot.def.massnahme,z.stufeZiel!,null,'gesetz');
  const gesetz=laufend??(r?.ok?kopie.spiel!.gesetze.find(g=>g.massnahme===angebot.def.massnahme):undefined);
  const decktZiel=!!gesetz&&!gesetz.provinzen?.length&&zusageZielErreicht(z,gesetz.stufe);
  const prognose=gesetz?gesetzPrognose(kopie,gesetz):undefined;
  const angenommen=structuredClone(kopie);
  if(!erreicht)setPolicy(angenommen,angebot.def.massnahme,z.stufeZiel!,null);
  const reaktionen=w.spiel!.figuren.filter(f=>f.imAmt).flatMap(f=>{
    const neu=angenommen.spiel!.figuren.find(n=>n.id===f.id);
    return neu&&Math.abs(neu.loyalitaet-f.loyalitaet)>1e-9?[{id:f.id,name:f.name,partei:f.partei,vorher:f.loyalitaet,nachher:neu.loyalitaet}]:[];
  });
  const risiken=[...new Set(w.spiel!.lager)].flatMap(partei=>aktiveParteivorsitzende(angenommen,partei).filter(f=>f.loyalitaet<35).map(f=>({partei,name:f.name,loyalitaet:f.loyalitaet,sitze:w.parliament?.seats[partei]??0})));
  const jetztRisiken=[...new Set(w.spiel!.lager)].flatMap(partei=>aktiveParteivorsitzende(w,partei).filter(f=>f.loyalitaet<20).map(f=>({partei,name:f.name,loyalitaet:f.loyalitaet,sitze:w.parliament?.seats[partei]??0})));
  const plan = { ...angebot, reaktionen, risiken, jetztRisiken, pruefungJetzt:naechsteKoalitionspruefung(w.date),
    pruefung:decktZiel&&prognose?naechsteKoalitionspruefung(prognose.datum,true):undefined, gesetz: {
    pk:pr.gesetz.pk, aufmerksamkeit:AUFMERKSAMKEIT_KOSTEN.gesetz,
    kostenBip:pr.kostenBip, geldJahr:geldAusBip(w,pr.kostenBip), monate:pr.monate,
    prognose,
    laufend:!!laufend, ziel:gesetz?.stufe, regional:!!gesetz?.provinzen?.length, decktZiel, erreicht,
    grund:r&&!r.ok?r.text:undefined,
    heutigeStimmen:pr.gesetz.stimmen.erwartet, heutigeLuecke:pr.gesetz.stimmen.luecke,
    faellig:kopie.spiel!.zusagen.find(a=>a.id===z.id)?.faellig??z.faellig,
  },
    stand:'',
  };
  // Auch Beträge, Fristen und politische Änderungen am selben Tag entwerten alte Angebote.
  plan.stand=JSON.stringify({tag:w.day,datum:w.date,plan,pr,lager:w.spiel!.lager,fraktionen:w.spiel!.fraktionen,
    figuren:w.spiel!.figuren,verfassung:w.spiel!.verfassung,kapital:w.spiel!.kapital,sitze:w.parliament?.seats,zusagen:w.spiel!.zusagen});
  return plan;
}
export type WahlversprechenPlan=NonNullable<ReturnType<typeof wahlversprechenPlan>>;

export function gibWahlversprechen(w:World,angebot:WahlversprechenPlan) {
  const jetzt=wahlversprechenPlan(w,angebot.def.id);
  if(!jetzt?.moeglich||jetzt.stand!==angebot.stand)return {ok:false,text:t('vn.veraltet')};
  return verspreche(w,angebot.def.id);
}
