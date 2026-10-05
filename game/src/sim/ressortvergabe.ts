// Ressortvergabe an Partnerparteien: ein Ministerium wechselt wirklich an ein Mitglied der Partei.
// Gemeinsamer Kern für das Umbildungsfenster (sim/amtszeit.ts), die Startforderung der Bündnispartei (sim/ereignisse.ts)
// und das Einlösen der Zusage „zwei Ministerien“ (sim/zusagen.ts). Wer ein Ministerium verspricht, gibt es auch ab.

import { addLog } from "./log";
import { Rng } from "./rng";
import { AEMTER, loyalitaetVerschieben } from "./personen";
import { besetzeNeu, figur, neuerName } from "./figuren";
import { PARTEI_NAME } from "./fraktionen";
import { t } from "../i18n";
import type { World } from "./types";
import type { Figur, Zusage } from "./spiel-typen";

/**
 * Reihenfolge, in der Ressorts an Partner gehen, wenn der Spieler nicht einzeln wählt: zuerst Fachressorts,
 * nie Präsidialamt und Generalstab (Spielparameter; die Rangfolge folgt der Nähe zum Präsidenten).
 */
export const PARTNER_RESSORTS: Figur["amt"][] = ["wirtschaft", "justiz", "inneres", "aussen", "finanzen"];

/** Übergibt ein Ministerium an die Partei: neuer Minister aus ihren Reihen, Erinnerung, Protokoll. Ohne Kapitalprüfung. */
export function ministeriumAnPartei(w: World, amt: Figur["amt"], partei: string): { ok: boolean; text: string } {
  const sp = w.spiel;
  const f = figur(w, amt);
  if (!sp || !f || f.partei === partei) return { ok: false, text: t("ressort.fehler") };
  const rng = new Rng((w.seed ^ 0x6b3d ^ Math.imul(w.day + PARTNER_RESSORTS.indexOf(amt) + 1, 2654435761)) | 0);
  const benutzt = new Set(sp.figuren.map((x) => x.name));
  const alt = `${f.rolle} ${f.name}`;
  const name = PARTEI_NAME[partei] ?? partei;
  besetzeNeu(w, f, { name: neuerName(rng, benutzt, f.weiblich), loyalitaet: 62, faehigkeit: 55, ehrgeiz: 60, lager: "partei", notiz: t("umbildung.erinnerung.partner", { partei: name }) });
  f.partei = partei;
  const pf = sp.figuren.find((x) => x.amt === "partner" && x.partei === partei) ?? sp.figuren.find((x) => x.amt === "partner" && !x.partei);
  if (pf) loyalitaetVerschieben(pf, 8);
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

/** Vergibt mehrere Ressorts in der festen Reihenfolge; liefert die vergebenen Ämter. */
export function ministerienAnPartei(w: World, partei: string, anzahl: number): Figur["amt"][] {
  const out: Figur["amt"][] = [];
  for (const a of naechsteRessorts(w, partei, anzahl)) if (ministeriumAnPartei(w, a, partei).ok) out.push(a);
  return out;
}

/** Ressortnamen als Aufzählung für Texte. */
export const ressortNamen = (aemter: Figur["amt"][]): string[] => aemter.map((a) => AEMTER[a].ressort);

/** Eine Zusage, die Ministerien verspricht (Prolog: „zwei Ministerien zugesagt“). */
export const istMinisterienZusage = (z: Zusage): boolean => !z.massnahme && (z.id === "z-ministerien" || /Ministerien/.test(z.text));
