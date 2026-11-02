// Reproduzierbare politische Nachsorge mit dem echten Tages- und Monatslauf. Keine Browserprüfung.
import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { createWorld, save, load } from "../Spielentwicklung/game/src/sim/world";
import { turkey2026 } from "../Spielentwicklung/game/src/sim/scenario";
import { schnellProfil, startAfterElection } from "../Spielentwicklung/game/src/sim/prolog";
import { fraktion } from "../Spielentwicklung/game/src/sim/fraktionen";
import { gueterSicht } from "../Spielentwicklung/game/src/sim/gueter";
import { aussenZustand } from "../Spielentwicklung/game/src/sim/diplomatie";
import { addDays } from "../Spielentwicklung/game/src/sim/dates";
import { beschliesseVersorgungsProgramm, aendereVersorgungsVorlage, versorgungsParlamentTag } from "../Spielentwicklung/game/src/sim/versorgungspolitik";
import { versorgungsNachsorge, versorgungsStabilisierungsPlan, stabilisiereVersorgungsKoalition } from "../Spielentwicklung/game/src/sim/versorgungsnachsorge";
import { spielTick } from "../Spielentwicklung/game/src/sim/spiel";
import { Rng } from "../Spielentwicklung/game/src/sim/rng";
const w=createWorld(turkey2026,17);startAfterElection(w,schnellProfil());
w.spiel!.ereignisse=[];w.spiel!.zusagen=[];w.spiel!.kapital=150;w.spiel!.lager=["YENİ"];
w.parliament!.seats={[w.player!.partei.kurz]:200,"YENİ":120,CHP:200,MHP:50,DEM:30};
for(const p of Object.keys(w.parliament!.seats)) fraktion(w,p).bereitschaft=50;
aussenZustand(w).energie.hormus="offen";gueterSicht(w);
const chef=w.spiel!.figuren.find(f=>f.amt==="partner"&&f.partei==="YENİ")!;chef.loyalitaet=23;
assert.ok(beschliesseVersorgungsProgramm(w,"schutz").ok);
assert.ok(aendereVersorgungsVorlage(w,"schutz","sozial").ok);
w.day+=7;w.date=addDays(w.date,7);versorgungsParlamentTag(w);
const sicht=versorgungsNachsorge(w,"schutz")!;
assert.equal(sicht.vorlage.status,"angenommen");assert.equal(chef.loyalitaet,19);
assert.equal(sicht.sitze,320);assert.equal(sicht.partner[0]!.ohne,200);
const prognosen=(["fraktion","vertrauen","rueckendeckung"] as const).map(art=>{
 const p=versorgungsStabilisierungsPlan(w,"schutz","YENİ",art)!;
 const {stand,...daten}=p;return daten;
});
const ohne=load(save(w));
const a=versorgungsStabilisierungsPlan(w,"schutz","YENİ","fraktion")!;
assert.ok(stabilisiereVersorgungsKoalition(w,a).ok);assert.equal(chef.loyalitaet,24);
const nachGespräch={loyalitaet:chef.loyalitaet,kapital:w.spiel!.kapital,buchung:w.spiel!.gueter!.regierung!.vorlagen!.schutz!.nachsorge};
for(const k of [w,ohne]) {
 const ziel=versorgungsNachsorge(k,"schutz")!.pruefung;let tage=0;
 while(addDays(k.date,tage)!==ziel)tage++;
 k.day+=tage;k.date=addDays(k.date,tage);spielTick(k,new Rng(19));
}
assert.ok(w.spiel!.lager.includes("YENİ"));assert.ok(!ohne.spiel!.lager.includes("YENİ"));
const bericht={art:"Lokale Simulation, keine Browserprüfung",seed:17,sitze:ohne.parliament!.seats,
 ausgang:{loyalitaetVorVotum:23,loyalitaetNachVotum:19,regierungssitze:320,sitzeNachAustritt:200,beschluss:sicht.beschluss,unzufrieden:sicht.unzufrieden},
 prognosen,nachGespräch,monat:{datum:w.date,mitGespräch:w.spiel!.lager,ohneGespräch:ohne.spiel!.lager,loyalitaetMitGespräch:chef.loyalitaet}};
if(!process.argv[2])throw new Error("Ausgabepfad fehlt");
writeFileSync(process.argv[2],JSON.stringify(bericht,null,2)+"\n");
console.log(JSON.stringify({vorVotum:23,nachVotum:19,nachGespräch:nachGespräch.loyalitaet,monat:bericht.monat},null,2));
