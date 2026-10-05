// Konkrete Akteure für Ereignisse: Staaten, Banken, Zeitungen, Firmen. Inländische Firmen, Banken und Zeitungen sind erfunden
// (Entscheidungen, Block B: erfundene Namen für Personen und Unternehmen); Staaten und Nachbarschaften sind real.

import type { Rng } from "./rng";

export function waehle<T>(rng: Rng, liste: readonly T[]): T {
  return liste[Math.floor(rng.next() * liste.length)]!;
}

export const BANKEN = ["Bosporus Handelsbank", "Toros Kreditbank", "Fırat Sparkasse", "Ege Investmentbank", "Sakarya Mittelstandsbank", "Kapadokya Genossenschaftsbank"];
export const ZEITUNGEN = ["Günün Sesi", "Akşam Sözü", "Halkın Nabzı", "Ülke Postası", "Yeni Söz"];
export const KOHLEFIRMEN = ["Kuzey Kömür AŞ", "Toprak Madencilik", "Karakaya Kömür", "Batı Linyit AŞ"];
export const TEXTILFIRMEN = ["Ege Dokuma AŞ", "Denizli Tekstil", "Uşak Konfeksiyon", "Bursa İplik AŞ", "Marmara Giyim"];
export const CYBER_ZIELE = [
  "die Zahlungssysteme mehrerer Banken und ein Umspannwerk",
  "das Netz eines großen Stromversorgers und die Fahrkartensysteme der Bahn",
  "die Abfertigung an zwei Flughäfen und Teile des Mobilfunknetzes",
  "die Rechenzentren einer Krankenhauskette und die Steuerbehörde",
];
export const GAS_LIEFERANTEN = ["der russische Lieferant", "der aserbaidschanische Lieferant", "der iranische Lieferant"];

/** Wer jenseits der Grenze liegt, je nach Provinz (Kfz-Kennziffer). */
export const GRENZ_NACHBAR: Record<number, string> = {
  31: "Syrien", 79: "Syrien", 27: "Syrien", 63: "Syrien", 47: "Syrien",
  73: "Irak", 30: "Irak",
  65: "Iran", 76: "Iran",
  36: "Armenien",
  75: "Georgien", 8: "Georgien",
};

export interface NatoBewerber {
  land: string;
  /** Warum das heikel ist, in einem Satz */
  lage: string;
  /** Wie stark Moskau reagiert (Faktor auf die Wirkung auf Russland) */
  russland: number;
}

export const NATO_BEWERBER: NatoBewerber[] = [
  { land: "die Ukraine", lage: "Mitten im Krieg um die Aufnahme zu stimmen, hieße, Russland offen zu konfrontieren.", russland: 1.6 },
  { land: "Georgien", lage: "Ein Nachbar am Schwarzen Meer, mit russischen Truppen auf einem Teil seines Gebiets.", russland: 1.2 },
  { land: "Moldau", lage: "Ein kleines Land mit einer abtrünnigen Region unter russischem Einfluss.", russland: 1.0 },
  { land: "Bosnien und Herzegowina", lage: "Innenpolitisch tief gespalten; Ankara hat dort eigene Interessen und Freunde.", russland: 0.5 },
];
