// Fraktionen des Parlaments: Was sie wollen, wie offen sie für den Präsidenten sind, wer duldet und wer im Lager sitzt.
// Alle Zahlen sind Spielparameter (Platzhalter der Kalibrierung), keine Tatsachenbehauptungen über echte Parteien.

import { clamp } from "./economy";
import { NET } from "./modell";
import { nationalAverage } from "./netz";
import type { World } from "./types";
import type { Fraktion } from "./spiel-typen";

export interface Forderung {
  massnahme: string;
  text: string;
}

/** Woran eine Fraktion ihre Unterstützung knüpft. */
export const FORDERUNG: Record<string, Forderung> = {
  AKP: { massnahme: "m_religioese_schulen", text: "mehr Rückhalt für religiöse Schulen" },
  "YENİ": { massnahme: "m_wissenschaftsfreiheit", text: "mehr Wissenschaftsfreiheit" },
  DEM: { massnahme: "m_friedensprozess", text: "Fortschritte im Friedensprozess" },
  MHP: { massnahme: "m_verteidigung", text: "höhere Verteidigungsausgaben" },
  "İYİ": { massnahme: "m_grenzschutz", text: "mehr Grenzschutz" },
  CHP: { massnahme: "m_justizreform", text: "eine Justizreform" },
  Zafer: { massnahme: "m_grenzschutz", text: "deutlich mehr Grenzschutz" },
  YRP: { massnahme: "m_religionsbehoerde", text: "mehr Mittel für die Religionsbehörde" },
};

/** Was eine Fraktion je nach Lage fordern kann; nur Maßnahmen, die man erhöhen soll. Die Forderung wechselt alle paar Monate. */
export const FORDERUNGEN: Record<string, Forderung[]> = {
  AKP: [
    { massnahme: "m_religioese_schulen", text: "mehr Rückhalt für religiöse Schulen" },
    { massnahme: "m_kindergeld", text: "ein höheres Kindergeld" },
    { massnahme: "m_bauindustrie", text: "Aufträge und Förderung für die Bauindustrie" },
    { massnahme: "m_agrarsubventionen", text: "höhere Agrarsubventionen" },
    { massnahme: "m_autobahnen", text: "neue Autobahnen und Brücken" },
  ],
  "YENİ": [
    { massnahme: "m_wissenschaftsfreiheit", text: "mehr Wissenschaftsfreiheit" },
    { massnahme: "m_investitionsanreize", text: "Investitionsanreize für Unternehmen" },
    { massnahme: "m_kmu", text: "Förderung für den Mittelstand" },
    { massnahme: "m_verwaltungsdigital", text: "eine digitale Verwaltung" },
    { massnahme: "m_forschung", text: "mehr Geld für Forschung" },
  ],
  CHP: [
    { massnahme: "m_justizreform", text: "eine Justizreform" },
    { massnahme: "m_gewaltschutz", text: "besseren Schutz vor Gewalt gegen Frauen" },
    { massnahme: "m_sozialwohnungen", text: "mehr Sozialwohnungen" },
    { massnahme: "m_stipendien", text: "mehr Stipendien für Studierende" },
    { massnahme: "m_mindestlohn", text: "einen höheren Mindestlohn" },
  ],
  MHP: [
    { massnahme: "m_verteidigung", text: "höhere Verteidigungsausgaben" },
    { massnahme: "m_ruestungsindustrie", text: "Ausbau der heimischen Rüstungsindustrie" },
    { massnahme: "m_grenzschutz", text: "mehr Grenzschutz" },
    { massnahme: "m_polizei", text: "eine stärkere Polizei" },
  ],
  "İYİ": [
    { massnahme: "m_grenzschutz", text: "mehr Grenzschutz" },
    { massnahme: "m_rueckkehr", text: "Rückkehrprogramme für Geflüchtete" },
    { massnahme: "m_kmu", text: "Entlastung für den Mittelstand" },
    { massnahme: "m_polizei", text: "eine stärkere Polizei" },
  ],
  DEM: [
    { massnahme: "m_friedensprozess", text: "Fortschritte im Friedensprozess" },
    { massnahme: "m_regionalfoerderung", text: "mehr Geld für die benachteiligten Regionen" },
    { massnahme: "m_versammlungsfreiheit", text: "mehr Versammlungsfreiheit" },
    { massnahme: "m_gewerkschaftsrechte", text: "stärkere Gewerkschaftsrechte" },
  ],
  Zafer: [
    { massnahme: "m_grenzschutz", text: "deutlich mehr Grenzschutz" },
    { massnahme: "m_rueckkehr", text: "konsequente Rückführungen" },
    { massnahme: "m_polizei", text: "eine stärkere Polizei" },
  ],
  YRP: [
    { massnahme: "m_religionsbehoerde", text: "mehr Mittel für die Religionsbehörde" },
    { massnahme: "m_renten", text: "höhere Renten" },
    { massnahme: "m_sozialhilfe", text: "höhere Sozialhilfe" },
    { massnahme: "m_kindergeld", text: "ein höheres Kindergeld" },
  ],
};

export const PARTEI_NAME: Record<string, string> = {
  AKP: "AKP",
  "YENİ": "YENİ Parti",
  CHP: "CHP",
  MHP: "MHP",
  "İYİ": "İYİ Parti",
  DEM: "DEM Parti",
  Zafer: "Zafer Partisi",
  YRP: "Yeniden Refah",
};

/** Kurzbeschreibung der Ausrichtung, damit man Partner und Gegner einordnen kann. */
export const AUSRICHTUNG: Record<string, string> = {
  AKP: "national-konservativ, bisherige Regierungspartei",
  "YENİ": "liberal-zentristisch, wirtschaftsnah",
  CHP: "sozialdemokratisch, säkular",
  MHP: "nationalistisch, sicherheitsorientiert",
  "İYİ": "nationalistisch-liberal, grenzstreng",
  DEM: "linksgerichtet, für die kurdischen Regionen",
  Zafer: "nationalistisch, migrationskritisch",
  YRP: "islamisch-konservativ, sozialpolitisch",
};

/** Politische Nähe der Fraktionen zur eigenen Partei des Spielers: −2 (fern) bis +2 (nah). */
const NAEHE: Record<string, Record<string, number>> = {
  // Die neue Partei ist gegen die bisherige Regierung (AKP, MHP) angetreten: Deren Nähe zu ihr ist gering
  AP: { AKP: -1, "YENİ": 2, CHP: 1, MHP: -1, "İYİ": 1, DEM: 0, Zafer: -2, YRP: -1 },
  PG: { AKP: -1, "YENİ": 1, CHP: 2, MHP: -1, "İYİ": -1, DEM: 2, Zafer: -2, YRP: 0 },
  PW: { AKP: 2, "YENİ": 0, CHP: -1, MHP: 1, "İYİ": 1, DEM: -1, Zafer: 0, YRP: 2 },
  PR: { AKP: -1, "YENİ": 1, CHP: 1, MHP: 0, "İYİ": 0, DEM: 1, Zafer: -1, YRP: 0 },
};

/** Ausgangsbereitschaft einer Fraktion, mit dem Präsidenten zusammenzuarbeiten (0 bis 100). */
export function startBereitschaft(world: World, partei: string): number {
  const nah = NAEHE[world.player?.partei.kurz ?? ""]?.[partei] ?? 0;
  const zustimmung = world.spiel?.umfrage.zustimmung ?? 50;
  return clamp(Math.round(42 + 12 * nah + 0.35 * (zustimmung - 50)), 10, 90);
}

export function fraktion(world: World, partei: string): Fraktion {
  const spiel = world.spiel;
  if (!spiel) return { bereitschaft: 40 };
  spiel.fraktionen ??= {};
  return (spiel.fraktionen[partei] ??= { bereitschaft: startBereitschaft(world, partei) });
}

export function bereitschaftAendern(world: World, partei: string, delta: number): void {
  if (!world.parliament?.seats[partei]) return;
  const f = fraktion(world, partei);
  f.bereitschaft = clamp(f.bereitschaft + delta, 0, 100);
}

export function bereitschaftWort(b: number): string {
  if (b >= 70) return "aufgeschlossen";
  if (b >= 55) return "gesprächsbereit";
  if (b >= 40) return "abwägend";
  if (b >= 25) return "reserviert";
  return "ablehnend";
}

/** Anteil der Sitze einer duldenden Fraktion, der tatsächlich mitstimmt. */
export const DULDUNG_QUOTE = 0.7;

/** Fraktionen, die das Lager bei Gesetzen dulden (ohne im Lager zu sein): ihre Sitze und die erwarteten Ja-Stimmen daraus. */
export function duldung(world: World): { sitze: number; ja: number; parteien: string[] } {
  const spiel = world.spiel;
  const parl = world.parliament;
  const out = { sitze: 0, ja: 0, parteien: [] as string[] };
  if (!spiel || !parl) return out;
  for (const [partei, f] of Object.entries(spiel.fraktionen ?? {})) {
    if (f.duldungBis === undefined || f.duldungBis <= world.day || spiel.lager.includes(partei)) continue;
    const sitze = parl.seats[partei] ?? 0;
    out.sitze += sitze;
    out.ja += Math.round(sitze * DULDUNG_QUOTE);
    out.parteien.push(partei);
  }
  return out;
}

/** Anteil der Sitze einer Fraktion, der für ein Gesetz stimmt, das genau ihre Kernforderung erfüllt. */
export const SACHSTIMMEN_QUOTE = 0.6;

/** Ja-Stimmen aus Fraktionen außerhalb des Lagers, deren Kernforderung dieses Gesetz erfüllt (Sachkoalition). */
export function sachstimmen(world: World, massnahme: string | undefined, richtung: number): { ja: number; sitze: number; parteien: string[] } {
  const spiel = world.spiel;
  const parl = world.parliament;
  const out = { ja: 0, sitze: 0, parteien: [] as string[] };
  if (!spiel || !parl || !massnahme || richtung <= 0) return out;
  const dul = duldung(world).parteien;
  for (const [partei, sitze] of Object.entries(parl.seats)) {
    if (partei === world.player?.partei.kurz || spiel.lager.includes(partei) || dul.includes(partei)) continue;
    if (forderungVon(world, partei).massnahme !== massnahme) continue;
    out.sitze += sitze;
    out.ja += Math.round(sitze * SACHSTIMMEN_QUOTE);
    out.parteien.push(partei);
  }
  return out;
}

/** Sitze, mit denen das Regierungslager ins Spiel startet: eine Mehrheit mit Puffer, damit ein einzelner Partner sie nicht sofort kippt. */
export const REGIERUNGSMEHRHEIT_ZIEL = 316;

/**
 * Wer außer dem eigenen Bündnispartner noch ins Lager gehört, damit das Spiel mit einer Regierungsmehrheit beginnt.
 * Gewählt wird nach politischer Nähe und Größe; wer der eigenen Partei fern steht („−2“), wird nur gewählt, wenn nichts anderes bleibt.
 */
export function waehlePartner(seats: Record<string, number>, eigene: string, buendnis: string | undefined): string[] {
  const nah = NAEHE[eigene] ?? {};
  const grund = (seats[eigene] ?? 0) + (buendnis ? (seats[buendnis] ?? 0) : 0);
  if (grund >= REGIERUNGSMEHRHEIT_ZIEL) return [];
  const kandidaten = Object.keys(seats).filter((p) => p !== eigene && p !== buendnis && (seats[p] ?? 0) >= 15 && (nah[p] ?? 0) > -2);
  // Alle Kombinationen aus einem bis drei Partnern: die mit ausreichender Mehrheit, geringem Überschuss, hoher Nähe und wenigen Partnern gewinnt
  const kombis: string[][] = [];
  for (let i = 0; i < kandidaten.length; i++) {
    kombis.push([kandidaten[i]!]);
    for (let j = i + 1; j < kandidaten.length; j++) {
      kombis.push([kandidaten[i]!, kandidaten[j]!]);
      for (let k = j + 1; k < kandidaten.length; k++) kombis.push([kandidaten[i]!, kandidaten[j]!, kandidaten[k]!]);
    }
  }
  const summe = (k: string[]) => k.reduce((s, p) => s + (seats[p] ?? 0), 0);
  const riese = (k: string[]) => k.some((p) => (seats[p] ?? 0) >= 200);
  const wert = (k: string[], ziel: number) => k.reduce((s, p) => s + (nah[p] ?? 0) * 3, 0) - (grund + summe(k) - ziel) / 40 - 1.2 * (k.length - 1);
  // Erst eine Mehrheit mit Puffer suchen, dann knapper; ein Riese (eine Fraktion mit 200 Sitzen und mehr) kommt nur ins Lager, wenn es ohne keine Mehrheit gibt
  let ersatz: string[] | null = null;
  for (const ziel of [REGIERUNGSMEHRHEIT_ZIEL, 306]) {
    const genug = kombis.filter((k) => grund + summe(k) >= ziel);
    if (!genug.length) continue;
    const ohneRiese = genug.filter((k) => !riese(k));
    const auswahl = ohneRiese.length ? ohneRiese : genug;
    const beste = auswahl.reduce((b, k) => (wert(k, ziel) > wert(b, ziel) ? k : b));
    if (!riese(beste)) return beste;
    ersatz ??= beste;
  }
  if (ersatz) return ersatz;
  // Es reicht auch mit allen Kombinationen nicht: nach Nähe, dann Größe, bis das Lager reicht
  const sortiert = [...kandidaten].sort((x, y) => (nah[y] ?? 0) - (nah[x] ?? 0) || (seats[y] ?? 0) - (seats[x] ?? 0));
  const out: string[] = [];
  let bloc = grund;
  for (const p of sortiert) {
    if (bloc >= 306) break;
    out.push(p);
    bloc += seats[p] ?? 0;
  }
  return out;
}

const hash = (t: string): number => {
  let h = 2166136261;
  for (let i = 0; i < t.length; i++) h = Math.imul(h ^ t.charCodeAt(i), 16777619);
  return h >>> 0;
};

/** Zeitraum, nach dem eine Fraktion etwas anderes verlangt (Tage). */
const FORDERUNG_DAUER = 270;

/**
 * Woran die Fraktion ihre Unterstützung gerade knüpft. Sie behält die Forderung, bis sie erfüllt, überholt oder zu alt ist,
 * und wählt dann eine andere aus ihrem Vorrat; welche, hängt von dieser Partie ab, nicht vom Zufall der Sekunde.
 */
export function forderungVon(world: World, partei: string): Forderung {
  const spiel = world.spiel;
  const pool = FORDERUNGEN[partei];
  if (!spiel || !pool?.length) return FORDERUNG[partei] ?? { massnahme: "m_justizreform", text: "ein Entgegenkommen" };
  const f = fraktion(world, partei);
  const stufe = (id: string) => nationalAverage(NET, world.net, id);
  const alt = f.forderung;
  if (!alt || world.day - alt.seit > FORDERUNG_DAUER || stufe(alt.massnahme) >= 90) {
    spiel.salz ??= world.rngState >>> 0;
    const frei = pool.filter((e) => stufe(e.massnahme) < 85 && e.massnahme !== alt?.massnahme);
    const liste = frei.length ? frei : pool;
    const wahl = liste[hash(`${spiel.salz}|${partei}|${Math.floor(world.day / FORDERUNG_DAUER)}|${alt?.massnahme ?? ""}`) % liste.length]!;
    f.forderung = { massnahme: wahl.massnahme, text: wahl.text, seit: world.day };
  }
  return { massnahme: f.forderung!.massnahme, text: f.forderung!.text };
}
