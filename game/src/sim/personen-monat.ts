// Was die Menschen um den Präsidenten von selbst tun, Monat für Monat: Das Ressort arbeitet (gut oder schlecht, je nach Fähigkeit und
// Loyalität), Aufträge laufen und werden am Stichtag gemessen, Groll steigt bei Ehrgeizigen, die sich übergangen fühlen, und klingt sonst ab.
// Zusagen, Ehemalige und die Ergänzung der Ämter älterer Spielstände laufen hier mit.

import { t } from "../i18n";
import { wirke } from "./wirkung";
import { addLog } from "./log";
import { ergaenzeFiguren } from "./figuren";
import { AEMTER, eigenVon, grollVerschieben, leistung, loyalitaetVerschieben, merke, wertVon, nf } from "./personen";
import { zusagenMonat } from "./zusagen";
import { ehemaligeMonat } from "./nachfolge";
import { ministerflussMonat } from "./ministerfluss-monat";
import { machtkreisMonat } from "./machtkreis";
import type { Figur } from "./spiel-typen";
import type { World } from "./types";
import { erfasseRessortVorfall } from "./ressortpolitik";

/** Die monatliche Wirkung des Ressorts: Bei Leistung über 0,5 bewegt es seine Größen zum Guten, darunter zum Schlechten. */
function ressortWirkung(w: World, f: Figur): void {
  const d = AEMTER[f.amt];
  if (!d.wirkung.length) return;
  const q = leistung(w, f);
  const faktor = 2 * (q - 0.5);
  for (const x of d.wirkung) wirke(w, x.id, x.d * faktor);
}

function auftragMonat(w: World, f: Figur): void {
  const e = eigenVon(w, f);
  const a = e.auftrag;
  if (!a || a.status !== "laeuft") return;
  wirke(w, a.groesse, a.richtung * 0.6 * leistung(w, f));
  if (w.day < a.frist) return;
  const jetzt = wertVon(w, a.groesse);
  const erreicht = (jetzt - a.vorher) * a.richtung >= a.delta - 0.3;
  a.nachher = jetzt;
  e.bilanz ??= { erfuellt: 0, verfehlt: 0 };
  if (erreicht) {
    a.status = "erfuellt";
    e.bilanz.erfuellt++;
    loyalitaetVerschieben(f, 8);
    e.ehrgeiz = Math.min(100, e.ehrgeiz + 3);
    wirke(w, "legitimitaet", 0.3);
    merke(w, f, t("n1.pm.merke.erfuellt", { text: a.text }));
    addLog(w, "ereignis", t("n1.pm.log.erfuellt", { rolle: f.rolle, name: f.name, text: a.text, vorher: nf(a.vorher, 0), jetzt: nf(jetzt, 0) }), t("n1.pm.log.erfuellt.why"));
  } else {
    a.status = "verfehlt";
    e.bilanz.verfehlt++;
    const loyVor=f.loyalitaet,grollVor=e.groll;
    loyalitaetVerschieben(f, -5);
    grollVerschieben(w, f, 8);
    merke(w, f, t("n1.pm.merke.verfehlt", { text: a.text }));
    // Früher „Sie kann darauf hinweisen, dass Sie sie nicht unterstützt haben“: falsch bei Männern, daher geschlechtsneutral
    addLog(w, "ereignis", t("n1.pm.log.verfehlt", { rolle: f.rolle, name: f.name, text: a.text, vorher: nf(a.vorher, 0), jetzt: nf(jetzt, 0) }), t("n1.pm.log.verfehlt.why"));
    const id=`ressortauftrag-${a.id}`;
    erfasseRessortVorfall(w,{id,figur:f.id,name:f.name,amt:f.amt,amtsantritt:e.seit,groesse:a.groesse,vorher:a.vorher,seit:a.seit,frist:a.frist,status:'eskaliert',ende:w.day},
      {id,tag:w.day,datum:w.date,name:f.name,amt:f.amt,groesse:a.groesse,art:'auftragVerfehlt',vorher:a.vorher,nachher:jetzt,loyalitaet:f.loyalitaet-loyVor,groll:e.groll-grollVor,bip:0,legitimitaet:0},false);
  }
}

export function personenMonat(w: World): void {
  const sp = w.spiel;
  if (!sp) return;
  ergaenzeFiguren(w);
  zusagenMonat(w);
  ehemaligeMonat(w);
  for (const f of sp.figuren) {
    if (!f.imAmt || f.amt === "opposition") continue;
    const e = eigenVon(w, f);
    // Wer sich übergangen fühlt, sammelt Groll; sonst klingt er ab
    if (e.ehrgeiz >= 70 && f.loyalitaet < 50) grollVerschieben(w, f, 2);
    else if (f.loyalitaet < 30) grollVerschieben(w, f, 1);
    else grollVerschieben(w, f, -1);
    // Aufgestauter Groll frisst Loyalität
    if (e.groll >= 60) loyalitaetVerschieben(f, -0.5);
    if (AEMTER[f.amt].regierungsamt) {
      ressortWirkung(w, f);
      auftragMonat(w, f);
    }
  }
  // Befehle an die Minister laufen weiter, Vorlagen verfallen sichtbar (sim/ministerfluss.ts)
  ministerflussMonat(w);
  // Was der Machtkreis von selbst tut: Rivalitäten, Angst, Nachfolgedruck, Untersuchungen (sim/machtkreis.ts)
  machtkreisMonat(w);
}
