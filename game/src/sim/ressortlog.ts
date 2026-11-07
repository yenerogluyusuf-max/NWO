// Monatszeile je Ressort im Logbuch (Befund aus dem Spiel des Inhabers, 07.11.2026). In 22 Monaten standen dort 40 Mal „Ece Öztürk meldet:
// Keine deutliche Erholung“, 34 Mal „AKP verlangt Aufklärung über den Ressortvorfall …“ und 24 Mal „AKP verlangt nach der Ressortmeldung …
// messbare Ergebnisse“. Was der Spieler nicht entscheidet (Meldungen der Minister, Reaktionen der Parteien darauf), steht jetzt als eine
// Zeile je Monat und Ressort, die sich im Lauf des Monats fortschreibt. Die Einzelheiten bleiben in der Ressortakte (Meldungen, Belege).
import type { LogEntry, World } from './types';
import type { Figur } from './spiel-typen';
import { addLog } from './log';
import { formatMonthDe } from './dates';
import { NET } from './modell';
import { t, zahl } from '../i18n';

export interface RessortMonat {
  schluessel: string; amt: Figur['amt'];
  meldungen: number; name?: string; groesse?: string; vor?: number; nach?: number; stand?: string;
  forderung: string[]; entlastung: string[]; aufklaerung: string[];
}
export type RessortLogTeil =
  | { art: 'meldung'; name: string; groesse: string; vor: number; nach: number; stand: string }
  | { art: 'forderung' | 'entlastung' | 'aufklaerung'; partei: string };

const knoten = (id: string) => NET.nodes[NET.index.get(id) ?? -1]?.name ?? id;
const liste = (p: string[]) => (p.length < 2 ? (p[0] ?? '') : t('h4.liste', { vorne: p.slice(0, -1).join(', '), letzte: p.at(-1)! }));

function text(w: World, s: RessortMonat): string {
  const teile: string[] = [];
  if (s.meldungen) teile.push(t('h4b.log.meldungen', { n: s.meldungen, name: s.name!, groesse: knoten(s.groesse!), vor: zahl(s.vor!, 1), nach: zahl(s.nach!, 1), stand: s.stand! }));
  if (s.forderung.length) teile.push(t('h4b.log.forderung', { parteien: liste(s.forderung), n: s.forderung.length }));
  if (s.aufklaerung.length) teile.push(t('h4b.log.aufklaerung', { parteien: liste(s.aufklaerung), n: s.aufklaerung.length }));
  if (s.entlastung.length) teile.push(t('h4b.log.entlastung', { parteien: liste(s.entlastung), n: s.entlastung.length }));
  return t('h4b.log.kopf', { ressort: t(`daten.amt.${s.amt}.ressort`), monat: formatMonthDe(w.date), teile: teile.join('; ') });
}

/** Schreibt einen Teil in die Monatszeile des Ressorts; gibt es sie in diesem Monat noch nicht, entsteht sie. */
export function ressortMonatslog(w: World, amt: Figur['amt'], teil: RessortLogTeil): LogEntry {
  const monat = w.date.slice(0, 7), schluessel = `ressort:${amt}:${monat}`;
  let e: LogEntry | undefined;
  for (let i = w.log.length - 1; i >= 0; i--) {
    const x = w.log[i]!;
    if (x.date.slice(0, 7) !== monat) break;
    if (x.sammel?.schluessel === schluessel) { e = x; break; }
  }
  if (!e) { e = addLog(w, 'ereignis', ''); e.sammel = { schluessel, amt, meldungen: 0, forderung: [], entlastung: [], aufklaerung: [] }; }
  const s = e.sammel!;
  if (teil.art === 'meldung') {
    // Erster Messwert des Monats bleibt der Ausgang, der letzte zählt als Stand
    if (!s.meldungen || s.groesse !== teil.groesse) { s.vor = teil.vor; s.groesse = teil.groesse; }
    s.meldungen++; s.name = teil.name; s.nach = teil.nach; s.stand = teil.stand;
  } else if (!s[teil.art].includes(teil.partei)) s[teil.art].push(teil.partei);
  e.text = text(w, s);
  return e;
}
