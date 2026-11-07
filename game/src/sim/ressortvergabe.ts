// Ressortvergabe an Partnerparteien: ein Ministerium wechselt wirklich an ein Mitglied der Partei.
// Gemeinsamer Kern für das Umbildungsfenster (sim/amtszeit.ts), die Startforderung der Bündnispartei (sim/ereignisse.ts)
// und das Einlösen der Zusage „zwei Ministerien“ (sim/zusagen.ts). Wer ein Ministerium verspricht, gibt es auch ab.

import { addLog } from "./log";
import { Rng } from "./rng";
import { AEMTER, loyalitaetVerschieben } from "./personen";
import { besetzeNeu, figur, neuerName, vergebeneNamen } from "./figuren";
import { PARTEI_NAME } from "./fraktionen";
import { t } from "../i18n";
import { aktiveParteivorsitzende } from "./koalitionslage";
import { MINISTERIEN } from "../data/ministerien";
import type { World } from "./types";
import type { Figur, Zusage } from "./spiel-typen";

/**
 * Reihenfolge, in der Ressorts an Partner gehen, wenn der Spieler nicht einzeln wählt: zuerst Fachressorts,
 * nie Präsidialamt und Generalstab (Spielparameter; die Rangfolge folgt der Nähe zum Präsidenten).
 */
export const PARTNER_RESSORTS: Figur["amt"][] = ["wirtschaft", "justiz", "inneres", "aussen", "finanzen"];

/** Wer für die Partei ein Ministerium übernimmt: Profil des neuen Ministers (Spielparameter; Anzeige vor der Wahl und Buchung aus derselben Zahl). */
export const PARTNER_MINISTER = { loyalitaet: 62, faehigkeit: 55, ehrgeiz: 60 } as const;

/** Die Ministerien, die an eine Partei gehen können: alle 17 Ressorts im Amt, die sie noch nicht führt (nie Präsidialamt und Generalstab). */
export function waehlbareRessorts(w: World, partei: string): Figur["amt"][] {
  return MINISTERIEN.map((m) => m.id).filter((a) => {
    const f = figur(w, a);
    return !!f && f.imAmt && f.partei !== partei;
  });
}

/** Übergibt ein Ministerium an die Partei: neuer Minister aus ihren Reihen, Erinnerung, Protokoll. Ohne Kapitalprüfung. */
export function ministeriumAnPartei(w: World, amt: Figur["amt"], partei: string): { ok: boolean; text: string } {
  const sp = w.spiel;
  const f = figur(w, amt);
  if (!sp || !f || f.partei === partei) return { ok: false, text: t("ressort.fehler") };
  const rng = new Rng((w.seed ^ 0x6b3d ^ Math.imul(w.day + PARTNER_RESSORTS.indexOf(amt) + 1, 2654435761)) | 0);
  const benutzt = vergebeneNamen(w);
  const alt = `${f.rolle} ${f.name}`;
  const name = PARTEI_NAME[partei] ?? partei;
  besetzeNeu(w, f, { name: neuerName(rng, benutzt, f.weiblich), ...PARTNER_MINISTER, lager: "partei", notiz: t("umbildung.erinnerung.partner", { partei: name }) });
  f.partei = partei;
  for(const pf of aktiveParteivorsitzende(w,partei)) loyalitaetVerschieben(pf, 8);
  addLog(w, "entscheidung", t("umbildung.log.partner", { alt, partei: name, neu: f.name }), t("umbildung.log.partner_warum"));
  return { ok: true, text: t("umbildung.ok.partner", { partei: name, ressort: AEMTER[amt].ressort }) };
}

/** Welche Ressorts als Nächstes an die Partei gehen würden (für Optionstexte mit Namen). */
export function naechsteRessorts(w: World, partei: string, anzahl: number): Figur["amt"][] {
  return PARTNER_RESSORTS.filter((a) => {
    const f = figur(w, a);
    return f && f.partei !== partei;
  }).slice(0, anzahl);
}

/** Vergibt mehrere Ressorts: die gewählten (`wahl`, Befund C-6) oder sonst in der festen Reihenfolge; liefert die vergebenen Ämter. */
export function ministerienAnPartei(w: World, partei: string, anzahl: number, wahl?: readonly Figur["amt"][]): Figur["amt"][] {
  const out: Figur["amt"][] = [];
  const offen = waehlbareRessorts(w, partei);
  const ziel = wahl ? [...new Set(wahl)].filter((a) => offen.includes(a)).slice(0, anzahl) : naechsteRessorts(w, partei, anzahl);
  for (const a of ziel) if (ministeriumAnPartei(w, a, partei).ok) out.push(a);
  return out;
}

/** Ressortnamen als Aufzählung für Texte. */
export const ressortNamen = (aemter: Figur["amt"][]): string[] => aemter.map((a) => AEMTER[a].ressort);

/** Eine Zusage, die Ministerien verspricht (Prolog: „zwei Ministerien zugesagt“). */
export const istMinisterienZusage = (z: Zusage): boolean => !z.massnahme && (z.id === "z-ministerien" || /Ministerien/.test(z.text));
