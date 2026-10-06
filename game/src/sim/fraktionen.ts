// Fraktionen des Parlaments: Was sie wollen, wie offen sie für den Präsidenten sind, wer duldet und wer im Lager sitzt.
// Alle Zahlen sind Spielparameter (Platzhalter der Kalibrierung), keine Tatsachenbehauptungen über echte Parteien.

import { clamp } from "./economy";
import { NET } from "./modell";
import { nationalAverage } from "./netz";
import type { World } from "./types";
import type { Fraktion } from "./spiel-typen";
import type { Achsen } from "../data/linien";
import { naeheZuPartei, parteiAchsen, spielerAchsen } from "./linie";
import { t as tx } from "../i18n";

export interface Forderung {
  massnahme: string;
  text: string;
}

/** Woran eine Fraktion ihre Unterstützung knüpft. */
export const FORDERUNG: Record<string, Forderung> = {
  AKP: { massnahme: "m_religioese_schulen", text: tx("sim2.sim.fraktionen.3543d29") },
  "YENİ": { massnahme: "m_wissenschaftsfreiheit", text: tx("sim2.sim.fraktionen.cfc7076") },
  DEM: { massnahme: "m_friedensprozess", text: tx("sim2.sim.fraktionen.6fe6e59") },
  MHP: { massnahme: "m_verteidigung", text: tx("sim2.sim.fraktionen.376fb7a") },
  "İYİ": { massnahme: "m_grenzschutz", text: tx("sim2.sim.fraktionen.ef6358b") },
  CHP: { massnahme: "m_justizreform", text: tx("sim2.sim.fraktionen.343b301") },
  Zafer: { massnahme: "m_grenzschutz", text: tx("sim2.sim.fraktionen.a9899d2") },
  YRP: { massnahme: "m_religionsbehoerde", text: tx("sim2.sim.fraktionen.9e08e9b") },
};

/** Was eine Fraktion je nach Lage fordern kann; nur Maßnahmen, die man erhöhen soll. Die Forderung wechselt alle paar Monate. */
export const FORDERUNGEN: Record<string, Forderung[]> = {
  AKP: [
    { massnahme: "m_religioese_schulen", text: tx("sim2.sim.fraktionen.3543d29") },
    { massnahme: "m_kindergeld", text: tx("sim2.sim.fraktionen.670785c") },
    { massnahme: "m_bauindustrie", text: tx("sim2.sim.fraktionen.4e574f1") },
    { massnahme: "m_agrarsubventionen", text: tx("sim2.sim.fraktionen.b06158e") },
    { massnahme: "m_autobahnen", text: tx("sim2.sim.fraktionen.2cbe56e") },
  ],
  "YENİ": [
    { massnahme: "m_wissenschaftsfreiheit", text: tx("sim2.sim.fraktionen.cfc7076") },
    { massnahme: "m_investitionsanreize", text: tx("sim2.sim.fraktionen.8bfe9c5") },
    { massnahme: "m_kmu", text: tx("sim2.sim.fraktionen.68762ed") },
    { massnahme: "m_verwaltungsdigital", text: tx("sim2.sim.fraktionen.4f3b40a") },
    { massnahme: "m_forschung", text: tx("sim2.sim.fraktionen.8fd2f54") },
  ],
  CHP: [
    { massnahme: "m_justizreform", text: tx("sim2.sim.fraktionen.343b301") },
    { massnahme: "m_gewaltschutz", text: tx("sim2.sim.fraktionen.a3f296e") },
    { massnahme: "m_sozialwohnungen", text: tx("sim2.sim.fraktionen.1e48bb3") },
    { massnahme: "m_stipendien", text: tx("sim2.sim.fraktionen.e93fc03") },
    { massnahme: "m_mindestlohn", text: tx("sim2.sim.fraktionen.2d0ef4d") },
  ],
  MHP: [
    { massnahme: "m_verteidigung", text: tx("sim2.sim.fraktionen.376fb7a") },
    { massnahme: "m_ruestungsindustrie", text: tx("sim2.sim.fraktionen.79663df") },
    { massnahme: "m_grenzschutz", text: tx("sim2.sim.fraktionen.ef6358b") },
    { massnahme: "m_polizei", text: tx("sim2.sim.fraktionen.0efdab8") },
  ],
  "İYİ": [
    { massnahme: "m_grenzschutz", text: tx("sim2.sim.fraktionen.ef6358b") },
    { massnahme: "m_rueckkehr", text: tx("sim2.sim.fraktionen.5156ca3") },
    { massnahme: "m_kmu", text: tx("sim2.sim.fraktionen.0afda48") },
    { massnahme: "m_polizei", text: tx("sim2.sim.fraktionen.0efdab8") },
  ],
  DEM: [
    { massnahme: "m_friedensprozess", text: tx("sim2.sim.fraktionen.6fe6e59") },
    { massnahme: "m_regionalfoerderung", text: tx("sim2.sim.fraktionen.337c810") },
    { massnahme: "m_versammlungsfreiheit", text: tx("sim2.sim.fraktionen.4af8c05") },
    { massnahme: "m_gewerkschaftsrechte", text: tx("sim2.sim.fraktionen.a0a6e3a") },
  ],
  Zafer: [
    { massnahme: "m_grenzschutz", text: tx("sim2.sim.fraktionen.a9899d2") },
    { massnahme: "m_rueckkehr", text: tx("sim2.sim.fraktionen.66af97b") },
    { massnahme: "m_polizei", text: tx("sim2.sim.fraktionen.0efdab8") },
  ],
  YRP: [
    { massnahme: "m_religionsbehoerde", text: tx("sim2.sim.fraktionen.9e08e9b") },
    { massnahme: "m_renten", text: tx("sim2.sim.fraktionen.37f5337") },
    { massnahme: "m_sozialhilfe", text: tx("sim2.sim.fraktionen.d2b74ea") },
    { massnahme: "m_kindergeld", text: tx("sim2.sim.fraktionen.670785c") },
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
  CHP: tx("sim2.sim.fraktionen.f51b631"),
  MHP: "nationalistisch, sicherheitsorientiert",
  "İYİ": "nationalistisch-liberal, grenzstreng",
  DEM: tx("sim2.sim.fraktionen.0a7066e"),
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

/**
 * Politische Nähe einer Partei zur eigenen Partei des Spielers, −2 (fern) bis +2 (nah). Die vier klassischen Muster behalten ihre von Hand
 * gesetzte Tabelle (Kalibrierung), jede andere Linie rechnet die Nähe aus dem Abstand auf den fünf Achsen (sim/linie.ts).
 */
export function parteiNaehe(world: World, partei: string): number {
  const kurz = world.player?.partei.kurz ?? "";
  const fest = NAEHE[kurz]?.[partei];
  if (fest !== undefined) return fest;
  return world.player ? naeheZuPartei(spielerAchsen(world), partei) : 0;
}

/** Ausgangsbereitschaft einer Fraktion, mit dem Präsidenten zusammenzuarbeiten (0 bis 100). */
export function startBereitschaft(world: World, partei: string): number {
  const nah = parteiNaehe(world, partei);
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
  if (b >= 70) return tx("reste.bereitschaft.aufgeschlossen");
  if (b >= 55) return tx("reste.bereitschaft.gespraechsbereit");
  if (b >= 40) return tx("reste.bereitschaft.abwaegend");
  if (b >= 25) return tx("reste.bereitschaft.reserviert");
  return tx("reste.bereitschaft.ablehnend");
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

/**
 * Sitze, mit denen das Regierungslager ins Spiel startet: eine Mehrheit mit Puffer, damit ein einzelner Partner sie nicht sofort kippt.
 * Maßstab ist die echte Lage: Cumhur İttifakı nach der Wahl 2023 mit 323 Sitzen (AKP 268, MHP 50, YRP 5; YSK, kesin sonuçlar,
 * Resmî Gazete Juni 2023), im Sommer 2026 AKP 280 und MHP 46 (Sandalye dağılımı nach TBMM, berichtet von BirGün, 24.07.2026).
 * Das Lager soll so knapp bleiben, dass abspringende Partner und Abweichler Gesetze kippen können (Spielparameter).
 */
export const REGIERUNGSMEHRHEIT_ZIEL = 316;
/** Wie viele überzählige Sitze einen Punkt Nähe aufwiegen (früher 40; kleiner = knappere Lager) */
const UEBERSCHUSS_SITZE = 12;

/**
 * Wer außer dem eigenen Bündnispartner noch ins Lager gehört, damit das Spiel mit einer Regierungsmehrheit beginnt.
 * Gewählt wird nach politischer Nähe und Größe; wer der eigenen Partei fern steht („−2“), wird nur gewählt, wenn nichts anderes bleibt.
 */
export function waehlePartner(seats: Record<string, number>, eigene: string, buendnis: string | undefined, achsen?: Achsen): string[] {
  const eigeneAchsen = achsen ?? parteiAchsen(eigene);
  const nah: Record<string, number> = NAEHE[eigene] ?? (eigeneAchsen ? Object.fromEntries(Object.keys(seats).map((p) => [p, naeheZuPartei(eigeneAchsen, p)])) : {});
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
  // Überschuss kostet: Wer genug Sitze hat, teilt Ämter nicht mit mehr Partnern als nötig (kleinste Gewinnkoalition; Spielparameter)
  const wert = (k: string[], ziel: number) => k.reduce((s, p) => s + (nah[p] ?? 0) * 3, 0) - (grund + summe(k) - ziel) / UEBERSCHUSS_SITZE - 1.2 * (k.length - 1);
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
  if (!spiel || !pool?.length) return FORDERUNG[partei] ?? { massnahme: "m_justizreform", text: tx("sim2.sim.fraktionen.57225f9") };
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
  // Der Wortlaut kommt aus dem Vorrat der aktuellen Sprache; gespeichert ist er in der Sprache, in der die Forderung entstand
  const imVorrat = pool.find((e) => e.massnahme === f.forderung!.massnahme);
  return { massnahme: f.forderung!.massnahme, text: imVorrat?.text ?? f.forderung!.text };
}
