// Schnittstellen der Personen für andere Teile des Spiels: Hinweise für Schreibtisch und Leiste, der Rat der Ressorts zu einem Ereignis
// und ein Textblock über das ganze Umfeld für das Sprachmodell. Nichts davon verändert den Spielstand.

import { addDays, formatDateDe } from "./dates";
import { AEMTER, eigenVon, erinnerungen, grollWort, leistung, leistungWort, sorgeText, wertVon } from "./personen";
import { EREIGNIS_BEZUG, ratHinweise, termineInfo } from "./gespraeche";
import { zusagenBilanz, zusagenSicht } from "./zusagen";
import type { World } from "./types";

export interface PersonenHinweis {
  id: string;
  ton: "rot" | "gelb";
  text: string;
  figurId?: string;
}

/** Was im Umfeld gerade Aufmerksamkeit braucht: Rücktrittsgefahr, kommissarische Leitungen, auslaufende Aufträge, fällige Zusagen. */
export function personenHinweise(w: World): PersonenHinweis[] {
  const sp = w.spiel;
  if (!sp) return [];
  const out: PersonenHinweis[] = [];
  for (const f of sp.figuren) {
    if (!f.imAmt || f.amt === "opposition") continue;
    const e = eigenVon(w, f);
    if (f.loyalitaet < 25) out.push({ id: `gefahr-${f.id}`, ton: "rot", figurId: f.id, text: `${f.rolle} ${f.name} steht kurz vor dem Bruch (Loyalität ${Math.round(f.loyalitaet)}, ${grollWort(e.groll)}).` });
    if (e.kommissarisch) out.push({ id: `kommissarisch-${f.id}`, ton: "gelb", figurId: f.id, text: `${AEMTER[f.amt].ressort} wird nur kommissarisch geführt: Ein Nachfolger fehlt.` });
    const a = e.auftrag;
    if (a?.status === "laeuft" && a.frist - w.day <= 30) {
      const fortschritt = Math.max(0, Math.min(100, Math.round((((wertVon(w, a.groesse) - a.vorher) * a.richtung) / a.delta) * 100)));
      out.push({ id: `auftrag-${f.id}`, ton: "gelb", figurId: f.id, text: `Der Auftrag an ${f.name} endet am ${formatDateDe(addDays(sp.start.datum, a.frist))}: ${fortschritt} % erreicht.` });
    }
  }
  for (const z of zusagenSicht(w)) {
    if (z.dringlichkeit === "dringend" || z.dringlichkeit === "ueberfaellig") out.push({ id: `zusage-${z.z.id}`, ton: z.dringlichkeit === "ueberfaellig" ? "rot" : "gelb", text: `Zusage ${z.tage < 0 ? "überfällig" : `in ${z.tage} Tagen fällig`}: ${z.z.text}` });
  }
  return out;
}

export interface RessortRat {
  figurId: string;
  name: string;
  rolle: string;
  /** Ob die Person dem Präsidenten genug folgt, um offen zu sprechen (Loyalität ab 40) */
  offen: boolean;
  zeilen: string[];
}

/** Was die betroffenen Ressorts zu einem offenen Ereignis raten; ohne Termin und ohne Kosten (eine Einschätzung, kein Gespräch). */
export function ratZuEreignis(w: World, ereignisId: string): RessortRat[] {
  const sp = w.spiel;
  const ev = sp?.ereignisse.find((e) => e.id === ereignisId);
  const bezug = ev ? EREIGNIS_BEZUG[ev.vorlage] : undefined;
  if (!sp || !ev || !bezug) return [];
  return sp.figuren
    .filter((f) => f.imAmt && bezug.amt.includes(f.amt))
    .map((f) => {
      const offen = f.loyalitaet >= 40;
      const zeilen = offen ? ratHinweise(w, f, { id: `ereignis:${ev.id}`, titel: bezug.titel, text: "", art: "ereignis", bezug: ev.id }).slice(0, 3) : [`${f.name} hält sich zurück: Bei Loyalität ${Math.round(f.loyalitaet)} gibt es keine offene Einschätzung.`];
      return { figurId: f.id, name: f.name, rolle: f.rolle, offen, zeilen };
    });
}

/** Ein Textblock über das ganze Umfeld für das Sprachmodell: Zahlen und Zustand, keine Empfehlung. */
export function umfeldKontext(w: World): string {
  const sp = w.spiel;
  if (!sp) return "";
  const t = termineInfo(w);
  const b = zusagenBilanz(w);
  const zeilen = [`Umfeld (Termine ${t.belegt}/${t.max} in 30 Tagen; Glaubwürdigkeit ${Math.round(b.glaubwuerdigkeit)} ${b.wort}; Zusagen: ${b.gehalten} gehalten, ${b.gebrochen} gebrochen, ${b.offen} offen):`];
  for (const f of sp.figuren) {
    if (!f.imAmt) continue;
    const e = eigenVon(w, f);
    const kurz = [`${f.rolle} ${f.name}: Loyalität ${Math.round(f.loyalitaet)}, Groll ${Math.round(e.groll)}, Ehrgeiz ${Math.round(e.ehrgeiz)}, ${e.stil}`];
    if (AEMTER[f.amt].wirkung.length) kurz.push(`Ressort ${leistungWort(leistung(w, f))}`);
    if (e.kommissarisch) kurz.push("kommissarisch");
    if (e.auftrag?.status === "laeuft") kurz.push(`Auftrag: ${e.auftrag.text} bis ${formatDateDe(addDays(sp.start.datum, e.auftrag.frist))}`);
    const er = erinnerungen(f)[0];
    if (er) kurz.push(`zuletzt: ${er.text}`);
    zeilen.push(`- ${kurz.join("; ")}. Sorge: ${sorgeText(w, f)}`);
  }
  return zeilen.join("\n");
}
