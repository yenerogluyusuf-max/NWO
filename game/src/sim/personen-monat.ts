// Was die Menschen um den Präsidenten von selbst tun, Monat für Monat: Das Ressort arbeitet (gut oder schlecht, je nach Fähigkeit und
// Loyalität), Aufträge laufen und werden am Stichtag gemessen, Groll steigt bei Ehrgeizigen, die sich übergangen fühlen, und klingt sonst ab.
// Zusagen, Ehemalige und die Ergänzung der Ämter älterer Spielstände laufen hier mit.

import { wirke } from "./wirkung";
import { addLog } from "./log";
import { ergaenzeFiguren } from "./figuren";
import { AEMTER, eigenVon, grollVerschieben, leistung, loyalitaetVerschieben, merke, wertVon, nf } from "./personen";
import { zusagenMonat } from "./zusagen";
import { ehemaligeMonat } from "./nachfolge";
import type { Figur } from "./spiel-typen";
import type { World } from "./types";

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
    merke(w, f, `Auftrag erfüllt: ${a.text}`);
    addLog(w, "ereignis", `${f.rolle} ${f.name} hat den Auftrag erfüllt: ${a.text} (${nf(a.vorher, 0)} auf ${nf(jetzt, 0)}).`, "Wer liefert, wird loyaler; Erfolge im Ressort zahlen auf die Legitimität ein.");
  } else {
    a.status = "verfehlt";
    e.bilanz.verfehlt++;
    loyalitaetVerschieben(f, -5);
    grollVerschieben(w, f, 8);
    merke(w, f, `Auftrag verfehlt: ${a.text}`);
    addLog(w, "ereignis", `${f.rolle} ${f.name} hat den Auftrag verfehlt: ${a.text} (${nf(a.vorher, 0)} auf ${nf(jetzt, 0)}).`, "Ein verfehltes Ziel kostet Loyalität und macht Groll: Sie kann darauf hinweisen, dass Sie sie nicht unterstützt haben.");
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
}
