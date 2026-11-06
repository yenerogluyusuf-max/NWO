// Große Ziele (ENTSCHEIDUNGEN Q, GROSSE_ZIELE_2026-11-04): Ziele über Jahre mit Stufen bis zur Utopie. Jede Stufe hat eine Schwelle
// (harte Voraussetzungen aus dem Spielzustand), eine Chance (nie sicher, als Wort und Band gezeigt), Wege, die die Chance erhöhen, und
// einen Versuch, der gelingt, teilweise gelingt oder scheitert. Höchstens drei Ziele gleichzeitig. Gegenspieler reagieren.
// Alle Zahlen hier sind Spielparameter (Gewichte, Schwellen, Preise); die Ziele knüpfen an reale Anker an (Organisation der Turkstaaten,
// KSZE als Vorbild, Mittlerer Korridor und Development Road, EU-Beitrittsprozess seit 1999/2005, GAP-Projekt, Doktrin „Blaues Vaterland“).

import type { WunderBild } from "./reich-typen";
import { NET } from "./modell";
import { nationalAverage } from "./netz";
import { wirke } from "./wirkung";
import { addLog } from "./log";
import { kannZahlen } from "./kapital";
import { verbrauche } from "./aufmerksamkeit";
import { kosten } from "./ereignis-hilfen";
import { landAendern, weltZustand } from "./laender";
import { beziehungZurTuerkei, istHauptakteur } from "./welt-modell";
import { Rng } from "./rng";
import { t } from "../i18n";
import type { World } from "./types";

// ---------------------------------------------------------------------------
// Typen

export type ZielBereich = "aussen" | "sicherheit" | "logistik" | "agrar" | "see" | "technik" | "energie" | "innen";
export type Bedingung =
  | { art: "knoten"; id: string; min: number }
  | { art: "vertrauen"; laender: string[]; min: number }
  | { art: "massnahme"; id: string; min: number }
  | { art: "konfliktHoechstens"; laender: string[]; max: number };
/** Ein Faktor der Chance: Wert zwischen `von` (trägt 0 bei) und `bis` (trägt das volle Gewicht bei) */
export type Faktor = (
  | { art: "knoten"; id: string }
  | { art: "vertrauen"; laender: string[] }
  | { art: "massnahme"; id: string }
  | { art: "vertretung"; laender: string[] }
  | { art: "konflikt"; laender: string[] }
) & { gewicht: number; von: number; bis: number; schluessel: string };
export type Effekt = { art: "knoten"; id: string; d: number } | { art: "land"; laender: string[]; dim: "vertrauen" | "handel" | "konflikt" | "sicherheit"; d: number };

export interface StufeDef {
  id: string;
  /** Schwelle: ohne sie kein Versuch */
  schwelle: Bedingung[];
  /** Grundchance und Faktoren; die Summe wird auf CHANCE_MIN bis CHANCE_MAX begrenzt */
  basis: number;
  faktoren: Faktor[];
  /** Preis des Versuchs */
  pk: number;
  aufmerksamkeit: number;
  erfolg: Effekt[];
}
export interface ZielDef {
  id: string;
  bereich: ZielBereich;
  /** Motiv aus ui/reich/WunderBild.tsx (Nacht N6: die Ordnung im Nahen Osten zeigt einen Konferenzsaal statt einer Moschee) */
  bild: WunderBild;
  /** Länder, um deren Zustimmung es geht (für Wege und Vertretungen) */
  partner: string[];
  /** Wer sich bei Erfolg querstellt (Vertrauen −, Konflikt +) */
  gegenspieler: string[];
  stufen: StufeDef[];
}
export type WegId = "gipfel" | "fonds" | "kampagne";
export interface ZielStand { stufe: number; abgeschwaecht?: boolean; vorbereitung: number; versuche: number; sperreBis?: number; weg?: Partial<Record<WegId, number>> }
export interface GrosseZieleZustand { verfolgt: string[]; stand: Record<string, ZielStand>; vertretungen: Record<string, number> }

export const GROSSE_ZIELE = {
  maxVerfolgt: 3,
  chanceMin: 0.03,
  chanceMax: 0.85,
  /** Teilerfolg, wenn der Wurf die Chance knapp verfehlt (bis zu so viel darüber) */
  teilerfolgBreite: 0.25,
  sperreTage: 365,
  ansehenScheitern: -2,
  vorbereitungMax: 30,
  vorbereitungVerfallMonat: 1,
  wegAbkuehlung: 60,
  vertretungMax: 3,
  vertretungPk: 2,
  vertretungBip: 0.02,
} as const;

/** Wege: einfache Knöpfe mit Preis, die die Chance des nächsten Versuchs erhöhen (Vorbereitung in Prozentpunkten) */
export const WEGE: Record<WegId, { pk: number; aufmerksamkeit: number; bip: number; vorbereitung: number }> = {
  gipfel: { pk: 6, aufmerksamkeit: 10, bip: 0, vorbereitung: 8 },
  fonds: { pk: 3, aufmerksamkeit: 4, bip: 0.1, vorbereitung: 10 },
  kampagne: { pk: 4, aufmerksamkeit: 6, bip: 0, vorbereitung: 6 },
};

// ---------------------------------------------------------------------------
// Katalog

const TURK = ["AZE", "KAZ", "UZB", "KGZ", "TKM"];
const NAHOST = ["SAU", "IRQ", "EGY", "IRN"];
const v = (laender: string[], gewicht: number, von: number, bis: number, schluessel: string): Faktor => ({ art: "vertrauen", laender, gewicht, von, bis, schluessel });
const k = (id: string, gewicht: number, von: number, bis: number, schluessel: string): Faktor => ({ art: "knoten", id, gewicht, von, bis, schluessel });
const vt = (laender: string[], gewicht: number, schluessel: string): Faktor => ({ art: "vertretung", laender, gewicht, von: 1, bis: 3, schluessel });
const kf = (laender: string[], gewicht: number, von: number, bis: number, schluessel: string): Faktor => ({ art: "konflikt", laender, gewicht, von, bis, schluessel });

export const ZIELE: ZielDef[] = [
  {
    id: "turkunion", bereich: "aussen", bild: "tor", partner: TURK, gegenspieler: ["RUS", "CHN"],
    stufen: [
      { id: "freihandel", schwelle: [{ art: "vertrauen", laender: TURK, min: 50 }], basis: 0.15, pk: 8, aufmerksamkeit: 12,
        faktoren: [v(TURK, 0.3, 50, 80, "vertrauen"), k("export", 0.15, 40, 70, "export"), vt(TURK, 0.1, "vertretung")],
        erfolg: [{ art: "knoten", id: "export", d: 3 }, { art: "land", laender: TURK, dim: "handel", d: 6 }] },
      { id: "markt", schwelle: [{ art: "vertrauen", laender: TURK, min: 60 }, { art: "knoten", id: "logistik", min: 50 }], basis: 0.08, pk: 12, aufmerksamkeit: 15,
        faktoren: [v(TURK, 0.3, 60, 85, "vertrauen"), k("logistik", 0.15, 50, 80, "logistik"), vt(TURK, 0.1, "vertretung"), kf(["RUS"], -0.15, 50, 80, "widerstand")],
        erfolg: [{ art: "knoten", id: "export", d: 4 }, { art: "knoten", id: "investitionen", d: 3 }, { art: "land", laender: TURK, dim: "vertrauen", d: 5 }] },
      { id: "waehrung", schwelle: [{ art: "vertrauen", laender: TURK, min: 70 }, { art: "knoten", id: "export", min: 55 }], basis: 0.03, pk: 18, aufmerksamkeit: 20,
        faktoren: [v(TURK, 0.25, 70, 95, "vertrauen"), k("auslandskapital", 0.15, 50, 80, "auslandskapital"), vt(TURK, 0.1, "vertretung"), kf(["RUS", "CHN"], -0.2, 45, 80, "widerstand")],
        erfolg: [{ art: "knoten", id: "export", d: 6 }, { art: "knoten", id: "ansehen", d: 5 }, { art: "land", laender: TURK, dim: "vertrauen", d: 8 }] },
    ],
  },
  {
    id: "nahostordnung", bereich: "sicherheit", bild: "konferenz", partner: NAHOST, gegenspieler: ["ISR"],
    stufen: [
      { id: "konferenz", schwelle: [{ art: "knoten", id: "ansehen", min: 45 }], basis: 0.2, pk: 8, aufmerksamkeit: 12,
        faktoren: [k("ansehen", 0.25, 45, 75, "ansehen"), v(NAHOST, 0.2, 40, 70, "vertrauen"), vt(NAHOST, 0.1, "vertretung")],
        erfolg: [{ art: "knoten", id: "ansehen", d: 3 }, { art: "land", laender: NAHOST, dim: "vertrauen", d: 4 }] },
      { id: "pakt", schwelle: [{ art: "vertrauen", laender: ["SAU", "IRQ"], min: 55 }, { art: "konfliktHoechstens", laender: ["IRN", "SYR"], max: 60 }], basis: 0.08, pk: 12, aufmerksamkeit: 15,
        faktoren: [v(NAHOST, 0.25, 55, 80, "vertrauen"), k("abschreckung", 0.15, 50, 75, "abschreckung"), kf(["IRN", "ISR"], -0.2, 40, 80, "widerstand")],
        erfolg: [{ art: "knoten", id: "terrorgefahr", d: -4 }, { art: "land", laender: NAHOST, dim: "sicherheit", d: 6 }] },
      { id: "organisation", schwelle: [{ art: "vertrauen", laender: NAHOST, min: 62 }, { art: "knoten", id: "ansehen", min: 60 }], basis: 0.03, pk: 18, aufmerksamkeit: 20,
        faktoren: [v(NAHOST, 0.25, 62, 90, "vertrauen"), k("ansehen", 0.2, 60, 85, "ansehen"), kf(["IRN", "ISR", "USA"], -0.2, 40, 80, "widerstand")],
        erfolg: [{ art: "knoten", id: "ansehen", d: 6 }, { art: "knoten", id: "terrorgefahr", d: -6 }, { art: "land", laender: NAHOST, dim: "vertrauen", d: 8 }] },
    ],
  },
  {
    id: "drehscheibe", bereich: "logistik", bild: "hafen", partner: ["AZE", "IRQ", "CHN", "GEO", "KAZ"], gegenspieler: ["RUS", "IRN"],
    stufen: [
      { id: "korridor", schwelle: [{ art: "knoten", id: "logistik", min: 45 }], basis: 0.2, pk: 8, aufmerksamkeit: 10,
        faktoren: [k("logistik", 0.25, 45, 75, "logistik"), k("bahnnetz", 0.15, 45, 75, "infrastruktur"), v(["AZE", "GEO", "KAZ"], 0.15, 50, 80, "vertrauen")],
        erfolg: [{ art: "knoten", id: "logistik", d: 4 }, { art: "knoten", id: "export", d: 2 }, { art: "land", laender: ["AZE", "GEO", "KAZ"], dim: "handel", d: 5 }] },
      { id: "entwicklungsstrasse", schwelle: [{ art: "vertrauen", laender: ["IRQ"], min: 50 }, { art: "knoten", id: "bahnnetz", min: 55 }], basis: 0.1, pk: 12, aufmerksamkeit: 14,
        faktoren: [v(["IRQ"], 0.2, 50, 80, "vertrauen"), k("bahnnetz", 0.2, 55, 80, "infrastruktur"), kf(["IRQ", "SYR"], -0.15, 40, 75, "widerstand")],
        erfolg: [{ art: "knoten", id: "logistik", d: 5 }, { art: "knoten", id: "investitionen", d: 3 }, { art: "land", laender: ["IRQ"], dim: "handel", d: 8 }] },
      { id: "weltdrehkreuz", schwelle: [{ art: "knoten", id: "logistik", min: 65 }, { art: "vertrauen", laender: ["CHN", "EU"], min: 50 }], basis: 0.04, pk: 16, aufmerksamkeit: 18,
        faktoren: [k("logistik", 0.25, 65, 90, "logistik"), v(["CHN", "EU"], 0.2, 50, 80, "vertrauen"), k("auslandskapital", 0.1, 50, 80, "auslandskapital")],
        erfolg: [{ art: "knoten", id: "logistik", d: 8 }, { art: "knoten", id: "export", d: 5 }, { art: "knoten", id: "auslandskapital", d: 4 }] },
    ],
  },
  {
    id: "eubeitritt", bereich: "aussen", bild: "gericht", partner: ["EU"], gegenspieler: ["CYP", "GRC"],
    stufen: [
      { id: "verhandlungen", schwelle: [{ art: "knoten", id: "pressefreiheit", min: 35 }, { art: "knoten", id: "justiz_unabhaengigkeit", min: 35 }], basis: 0.12, pk: 8, aufmerksamkeit: 12,
        faktoren: [k("pressefreiheit", 0.2, 35, 70, "presse"), k("justiz_unabhaengigkeit", 0.2, 35, 70, "justiz"), v(["EU"], 0.15, 40, 70, "vertrauen")],
        erfolg: [{ art: "knoten", id: "auslandskapital", d: 3 }, { art: "land", laender: ["EU"], dim: "vertrauen", d: 6 }] },
      { id: "kapitel", schwelle: [{ art: "knoten", id: "pressefreiheit", min: 50 }, { art: "knoten", id: "justiz_unabhaengigkeit", min: 50 }, { art: "vertrauen", laender: ["EU"], min: 55 }], basis: 0.06, pk: 12, aufmerksamkeit: 15,
        faktoren: [k("pressefreiheit", 0.2, 50, 80, "presse"), k("justiz_unabhaengigkeit", 0.2, 50, 80, "justiz"), kf(["CYP", "GRC"], -0.2, 40, 80, "widerstand")],
        erfolg: [{ art: "knoten", id: "investitionen", d: 4 }, { art: "knoten", id: "auslandskapital", d: 4 }] },
      { id: "beitritt", schwelle: [{ art: "knoten", id: "pressefreiheit", min: 65 }, { art: "konfliktHoechstens", laender: ["CYP", "GRC"], max: 45 }], basis: 0.03, pk: 18, aufmerksamkeit: 20,
        faktoren: [k("pressefreiheit", 0.15, 65, 90, "presse"), v(["EU"], 0.25, 60, 90, "vertrauen"), kf(["CYP", "GRC"], -0.25, 30, 70, "widerstand")],
        erfolg: [{ art: "knoten", id: "auslandskapital", d: 8 }, { art: "knoten", id: "export", d: 5 }, { art: "knoten", id: "ansehen", d: 5 }] },
    ],
  },
  {
    id: "kornkammer", bereich: "agrar", bild: "feld", partner: ["IRQ", "SAU", "EGY"], gegenspieler: [],
    stufen: [
      { id: "selbstversorgung", schwelle: [{ art: "knoten", id: "wasserversorgung", min: 40 }], basis: 0.2, pk: 6, aufmerksamkeit: 10,
        faktoren: [k("ernte", 0.25, 40, 75, "ernte"), k("wasserversorgung", 0.2, 40, 75, "wasser"), { art: "massnahme", id: "m_bewaesserung", gewicht: 0.1, von: 50, bis: 80, schluessel: "bewaesserung" }],
        erfolg: [{ art: "knoten", id: "ernte", d: 4 }, { art: "knoten", id: "lebensmittelpreise", d: -3 }] },
      { id: "nettoexport", schwelle: [{ art: "knoten", id: "ernte", min: 55 }], basis: 0.1, pk: 10, aufmerksamkeit: 12,
        faktoren: [k("ernte", 0.25, 55, 85, "ernte"), { art: "massnahme", id: "m_agrarforschung", gewicht: 0.15, von: 50, bis: 85, schluessel: "forschung" }, v(["IRQ", "SAU", "EGY"], 0.1, 45, 75, "vertrauen")],
        erfolg: [{ art: "knoten", id: "export", d: 3 }, { art: "land", laender: ["IRQ", "SAU", "EGY"], dim: "handel", d: 5 }] },
      { id: "kornkammer", schwelle: [{ art: "knoten", id: "ernte", min: 70 }, { art: "knoten", id: "wasserversorgung", min: 60 }], basis: 0.04, pk: 14, aufmerksamkeit: 16,
        faktoren: [k("ernte", 0.25, 70, 95, "ernte"), k("wasserversorgung", 0.2, 60, 90, "wasser"), v(["IRQ", "SAU", "EGY"], 0.15, 55, 85, "vertrauen")],
        erfolg: [{ art: "knoten", id: "export", d: 5 }, { art: "knoten", id: "ansehen", d: 3 }, { art: "land", laender: ["IRQ", "SAU", "EGY"], dim: "vertrauen", d: 6 }] },
    ],
  },
  {
    id: "seemacht", bereich: "see", bild: "schiff", partner: ["AZE", "LBY"], gegenspieler: ["GRC", "CYP", "EGY"],
    stufen: [
      { id: "werften", schwelle: [{ art: "knoten", id: "bereitschaft_see", min: 45 }], basis: 0.2, pk: 8, aufmerksamkeit: 10,
        faktoren: [k("bereitschaft_see", 0.2, 45, 75, "marine"), k("ruestungsautarkie", 0.2, 40, 75, "autarkie"), k("export", 0.1, 40, 70, "export")],
        erfolg: [{ art: "knoten", id: "ruestungsautarkie", d: 4 }, { art: "knoten", id: "export", d: 2 }] },
      { id: "mittelmeer", schwelle: [{ art: "knoten", id: "bereitschaft_see", min: 60 }], basis: 0.08, pk: 12, aufmerksamkeit: 15,
        faktoren: [k("bereitschaft_see", 0.25, 60, 85, "marine"), k("abschreckung", 0.15, 50, 80, "abschreckung"), kf(["GRC", "CYP", "EGY"], -0.2, 40, 80, "widerstand")],
        erfolg: [{ art: "knoten", id: "abschreckung", d: 5 }, { art: "knoten", id: "ansehen", d: 2 }] },
      { id: "weltwerft", schwelle: [{ art: "knoten", id: "ruestungsautarkie", min: 65 }, { art: "knoten", id: "export", min: 55 }], basis: 0.04, pk: 16, aufmerksamkeit: 18,
        faktoren: [k("ruestungsautarkie", 0.25, 65, 90, "autarkie"), k("export", 0.2, 55, 85, "export"), k("investitionen", 0.1, 50, 80, "investitionen")],
        erfolg: [{ art: "knoten", id: "export", d: 6 }, { art: "knoten", id: "investitionen", d: 4 }, { art: "knoten", id: "ansehen", d: 3 }] },
    ],
  },
  // Vier weitere Bereiche (Vorgabe Q.4, GROSSE_ZIELE §3): Technologie, Energie, Innen, Weltbühne. Werte sind Spielparameter.
  {
    id: "technologie", bereich: "technik", bild: "chip", partner: ["EU", "AZE"], gegenspieler: ["GRC"],
    stufen: [
      { id: "autarkie", schwelle: [{ art: "knoten", id: "ruestungsautarkie", min: 45 }], basis: 0.18, pk: 8, aufmerksamkeit: 12,
        faktoren: [k("ruestungsautarkie", 0.25, 45, 80, "autarkie"), k("hochschule", 0.15, 45, 75, "forschung"), k("modernisierung", 0.1, 40, 70, "modernisierung")],
        erfolg: [{ art: "knoten", id: "ruestungsautarkie", d: 4 }, { art: "knoten", id: "export", d: 2 }, { art: "knoten", id: "ansehen", d: 2 }] },
      { id: "halbleiter", schwelle: [{ art: "knoten", id: "hochschule", min: 55 }, { art: "massnahme", id: "m_forschung", min: 55 }], basis: 0.07, pk: 12, aufmerksamkeit: 15,
        faktoren: [k("hochschule", 0.2, 55, 85, "forschung"), k("m_forschung", 0.15, 55, 85, "forschung"), k("auslandskapital", 0.15, 40, 70, "auslandskapital"), v(["EU"], 0.1, 40, 70, "vertrauen")],
        erfolg: [{ art: "knoten", id: "modernisierung", d: 4 }, { art: "knoten", id: "export", d: 3 }] },
      { id: "mond", schwelle: [{ art: "knoten", id: "hochschule", min: 65 }, { art: "knoten", id: "ruestungsautarkie", min: 65 }], basis: 0.03, pk: 16, aufmerksamkeit: 18,
        faktoren: [k("m_forschung", 0.2, 60, 90, "forschung"), k("hochschule", 0.15, 65, 90, "forschung"), k("ansehen", 0.1, 50, 80, "ansehen")],
        erfolg: [{ art: "knoten", id: "ansehen", d: 6 }, { art: "knoten", id: "identitaet", d: 4 }, { art: "knoten", id: "hochschule", d: 3 }] },
    ],
  },
  {
    id: "energieunabhaengig", bereich: "energie", bild: "reaktor", partner: ["AZE", "KAZ"], gegenspieler: ["RUS", "IRN"],
    stufen: [
      { id: "sakarya", schwelle: [{ art: "massnahme", id: "m_gasfoerderung", min: 50 }], basis: 0.18, pk: 8, aufmerksamkeit: 10,
        faktoren: [k("m_gasfoerderung", 0.2, 50, 80, "gas"), k("gasabhaengigkeit", 0.15, 70, 45, "abhaengigkeit"), v(["AZE"], 0.1, 50, 80, "vertrauen")],
        erfolg: [{ art: "knoten", id: "gasabhaengigkeit", d: -4 }, { art: "knoten", id: "energieversorgung", d: 2 }] },
      { id: "kernkraft", schwelle: [{ art: "massnahme", id: "m_kernkraft", min: 55 }, { art: "knoten", id: "erneuerbare", min: 40 }], basis: 0.08, pk: 12, aufmerksamkeit: 14,
        faktoren: [k("m_kernkraft", 0.2, 55, 85, "kernkraft"), k("erneuerbare", 0.15, 40, 70, "erneuerbare"), kf(["RUS"], -0.1, 50, 80, "widerstand")],
        erfolg: [{ art: "knoten", id: "gasabhaengigkeit", d: -4 }, { art: "knoten", id: "stromversorgung", d: 3 }] },
      { id: "unabhaengig", schwelle: [{ art: "knoten", id: "erneuerbare", min: 60 }, { art: "knoten", id: "energieversorgung", min: 60 }], basis: 0.03, pk: 16, aufmerksamkeit: 18,
        faktoren: [k("erneuerbare", 0.2, 60, 90, "erneuerbare"), k("gasabhaengigkeit", 0.2, 50, 20, "abhaengigkeit"), k("m_energieeffizienz", 0.1, 50, 80, "effizienz")],
        erfolg: [{ art: "knoten", id: "energieimporte", d: -6 }, { art: "knoten", id: "ansehen", d: 3 }, { art: "knoten", id: "energieversorgung", d: 4 }] },
    ],
  },
  {
    id: "versoehnung", bereich: "innen", bild: "gericht", partner: ["EU"], gegenspieler: [],
    stufen: [
      { id: "friedensprozess", schwelle: [{ art: "massnahme", id: "m_friedensprozess", min: 50 }], basis: 0.15, pk: 10, aufmerksamkeit: 14,
        faktoren: [k("m_friedensprozess", 0.2, 50, 80, "frieden"), k("minderheiten", 0.15, 40, 70, "minderheiten"), k("polarisierung", 0.15, 80, 55, "polarisierung")],
        erfolg: [{ art: "knoten", id: "minderheiten", d: 4 }, { art: "knoten", id: "polarisierung", d: -3 }] },
      { id: "verfassung", schwelle: [{ art: "knoten", id: "justiz_unabhaengigkeit", min: 40 }, { art: "knoten", id: "legitimitaet", min: 55 }], basis: 0.07, pk: 14, aufmerksamkeit: 16,
        faktoren: [k("justizvertrauen", 0.15, 40, 70, "justiz"), k("pressefreiheit", 0.15, 30, 60, "presse"), k("legitimitaet", 0.1, 55, 80, "legitimitaet")],
        erfolg: [{ art: "knoten", id: "rechtssicherheit", d: 4 }, { art: "knoten", id: "legitimitaet", d: 3 }, { art: "land", laender: ["EU"], dim: "vertrauen", d: 4 }] },
      { id: "versoehnung", schwelle: [{ art: "knoten", id: "minderheiten", min: 60 }, { art: "knoten", id: "identitaet", min: 60 }], basis: 0.03, pk: 16, aufmerksamkeit: 18,
        faktoren: [k("polarisierung", 0.25, 70, 40, "polarisierung"), k("minderheiten", 0.15, 60, 85, "minderheiten"), k("identitaet", 0.1, 60, 85, "identitaet")],
        erfolg: [{ art: "knoten", id: "polarisierung", d: -8 }, { art: "knoten", id: "identitaet", d: 5 }, { art: "knoten", id: "ansehen", d: 3 }] },
    ],
  },
  {
    id: "weltbuehne", bereich: "aussen", bild: "konferenz", partner: ["EU", "SAU", "AZE", "KAZ"], gegenspieler: ["USA", "RUS", "CHN"],
    stufen: [
      { id: "olympia", schwelle: [{ art: "knoten", id: "ansehen", min: 50 }, { art: "knoten", id: "tourismus", min: 55 }], basis: 0.15, pk: 10, aufmerksamkeit: 12,
        faktoren: [k("ansehen", 0.2, 50, 75, "ansehen"), k("tourismus", 0.15, 55, 80, "tourismus"), k("bahnnetz", 0.1, 40, 70, "infrastruktur")],
        erfolg: [{ art: "knoten", id: "tourismus", d: 4 }, { art: "knoten", id: "ansehen", d: 3 }, { art: "knoten", id: "identitaet", d: 2 }] },
      { id: "vermittler", schwelle: [{ art: "knoten", id: "ansehen", min: 55 }, { art: "vertrauen", laender: ["USA", "RUS"], min: 45 }], basis: 0.08, pk: 12, aufmerksamkeit: 15,
        faktoren: [k("ansehen", 0.2, 55, 80, "ansehen"), v(["USA", "RUS", "EU"], 0.2, 45, 70, "vertrauen"), vt(["EU", "SAU"], 0.1, "vertretung")],
        erfolg: [{ art: "knoten", id: "ansehen", d: 4 }, { art: "land", laender: ["USA", "RUS"], dim: "vertrauen", d: 3 }] },
      { id: "sicherheitsrat", schwelle: [{ art: "knoten", id: "ansehen", min: 70 }], basis: 0.02, pk: 20, aufmerksamkeit: 20,
        faktoren: [k("ansehen", 0.2, 70, 95, "ansehen"), v(["EU", "SAU", "AZE", "KAZ"], 0.15, 55, 85, "vertrauen"), kf(["USA", "RUS", "CHN"], -0.15, 40, 80, "widerstand")],
        erfolg: [{ art: "knoten", id: "ansehen", d: 8 }, { art: "knoten", id: "identitaet", d: 3 }] },
    ],
  },
];
const ZIEL_NACH_ID = new Map(ZIELE.map((z) => [z.id, z]));
export const zielDef = (id: string): ZielDef | undefined => ZIEL_NACH_ID.get(id);

// ---------------------------------------------------------------------------
// Zustand und Messung

export function grosseZiele(w: World): GrosseZieleZustand {
  const sp = w.spiel!;
  return (sp.grosseZiele ??= { verfolgt: [], stand: {}, vertretungen: {} });
}
function stand(w: World, id: string): ZielStand {
  return (grosseZiele(w).stand[id] ??= { stufe: 0, vorbereitung: 0, versuche: 0 });
}
/** Vertrauen zur Türkei, für Haupt- und weitere Akteure (Weltmodell) */
const vertrauenVon = (w: World, id: string): number => beziehungZurTuerkei(w, id).vertrauen;
const mittel = (xs: number[]): number => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const knoten = (w: World, id: string): number => (NET.index.has(id) ? nationalAverage(NET, w.net, id) : 0);
export const vertretungVon = (w: World, land: string): number => grosseZiele(w).vertretungen[land] ?? 1;

function wert(w: World, f: Faktor | Bedingung): number {
  switch (f.art) {
    case "knoten": return knoten(w, f.id);
    case "massnahme": return w.net.targets[f.id] ?? 0;
    case "vertrauen": return mittel(f.laender.map((l) => vertrauenVon(w, l)));
    case "vertretung": return mittel(f.laender.map((l) => vertretungVon(w, l)));
    case "konflikt":
    case "konfliktHoechstens": return Math.max(...f.laender.map((l) => (istHauptakteur(l) ? weltZustand(w)[l]?.konflikt ?? 0 : beziehungZurTuerkei(w, l).konflikt)));
  }
}

export interface SchwellenSicht { text: string; erfuellt: boolean }
export function schwelleSicht(w: World, s: StufeDef): SchwellenSicht[] {
  return s.schwelle.map((b) => {
    const x = wert(w, b);
    const erfuellt = b.art === "konfliktHoechstens" ? x <= b.max : x >= b.min;
    const name = b.art === "knoten" ? NET.nodes[NET.index.get(b.id)!]?.name ?? b.id : b.art === "massnahme" ? NET.nodes[NET.index.get(b.id) ?? -1]?.name ?? b.id : "";
    const text = b.art === "konfliktHoechstens" ? t("gz2.schwelle.konflikt", { max: b.max, jetzt: Math.round(x) })
      : b.art === "vertrauen" ? t("gz2.schwelle.vertrauen", { min: b.min, jetzt: Math.round(x) })
      : t("gz2.schwelle.knoten", { name, min: b.min, jetzt: Math.round(x) });
    return { text, erfuellt };
  });
}

export interface ChanceSicht { chance: number; wort: "gering" | "moeglich" | "aussichtsreich" | "gut"; von: number; bis: number; dafuer: string[]; dagegen: string[] }
export function chanceVon(w: World, zielId: string): ChanceSicht | null {
  const z = zielDef(zielId), st = stand(w, zielId);
  const s = z?.stufen[st.stufe];
  if (!z || !s) return null;
  const beitraege = s.faktoren.map((f) => {
    const anteil = Math.max(0, Math.min(1, (wert(w, f) - f.von) / (f.bis - f.von)));
    return { schluessel: f.schluessel, d: f.gewicht * anteil };
  });
  const roh = s.basis + beitraege.reduce((a, b) => a + b.d, 0) + st.vorbereitung / 100 - (st.abgeschwaecht ? 0.05 : 0);
  const chance = Math.max(GROSSE_ZIELE.chanceMin, Math.min(GROSSE_ZIELE.chanceMax, roh));
  const wort = chance < 0.15 ? "gering" : chance < 0.35 ? "moeglich" : chance < 0.6 ? "aussichtsreich" : "gut";
  const gruende = [...beitraege, { schluessel: "vorbereitung", d: st.vorbereitung / 100 }].filter((b) => Math.abs(b.d) >= 0.01);
  const dafuer = gruende.filter((b) => b.d > 0).sort((a, b) => b.d - a.d).slice(0, 3).map((b) => t(`gz2.grund.${b.schluessel}`));
  const dagegen = gruende.filter((b) => b.d < 0).sort((a, b) => a.d - b.d).slice(0, 3).map((b) => t(`gz2.grund.${b.schluessel}`));
  // Fehlende Faktoren (bei null) nennen, was noch fehlt
  for (const b of beitraege) if (b.d === 0 && dagegen.length < 3 && !s.faktoren.find((f) => f.schluessel === b.schluessel && f.gewicht < 0)) dagegen.push(t("gz2.grund.fehlt", { was: t(`gz2.grund.${b.schluessel}`) }));
  return { chance, wort, von: Math.max(0, Math.round((chance - 0.1) * 100)), bis: Math.min(95, Math.round((chance + 0.1) * 100)), dafuer, dagegen: dagegen.slice(0, 3) };
}

// ---------------------------------------------------------------------------
// Handlungen

export type ZielErgebnis = { ok: boolean; text: string; ausgang?: "erfolg" | "teilerfolg" | "scheitern" };

export function verfolgeGrund(w: World, zielId: string): string | undefined {
  const g = grosseZiele(w), z = zielDef(zielId);
  if (!z) return t("gz2.grund.unbekannt");
  if (g.verfolgt.includes(zielId)) return undefined;
  if (stand(w, zielId).stufe >= z.stufen.length) return t("gz2.grund.erreicht");
  if (g.verfolgt.length >= GROSSE_ZIELE.maxVerfolgt) return t("gz2.grund.zuviele", { n: GROSSE_ZIELE.maxVerfolgt });
  return undefined;
}
export function verfolge(w: World, zielId: string, an: boolean): ZielErgebnis {
  const g = grosseZiele(w);
  if (!an) { g.verfolgt = g.verfolgt.filter((x) => x !== zielId); return { ok: true, text: t("gz2.x.losgelassen", { ziel: t(`gz2.ziel.${zielId}.titel`) }) }; }
  const grund = verfolgeGrund(w, zielId);
  if (grund) return { ok: false, text: grund };
  if (!g.verfolgt.includes(zielId)) g.verfolgt.push(zielId);
  stand(w, zielId);
  return { ok: true, text: t("gz2.x.verfolgt", { ziel: t(`gz2.ziel.${zielId}.titel`) }) };
}

export function wegGrund(w: World, zielId: string, weg: WegId): string | undefined {
  const sp = w.spiel!, def = WEGE[weg], st = stand(w, zielId);
  if (!grosseZiele(w).verfolgt.includes(zielId)) return t("gz2.grund.nichtVerfolgt");
  if (st.vorbereitung >= GROSSE_ZIELE.vorbereitungMax) return t("gz2.grund.vorbereitungVoll", { max: GROSSE_ZIELE.vorbereitungMax });
  const rest = (st.weg?.[weg] ?? -1e9) + GROSSE_ZIELE.wegAbkuehlung - w.day;
  if (rest > 0) return t("gz2.grund.abkuehlung", { tage: rest });
  if (!kannZahlen(sp.kapital, def.pk)) return t("gz2.grund.kapital", { pk: def.pk });
  return undefined;
}
export function geheWeg(w: World, zielId: string, weg: WegId): ZielErgebnis {
  const grund = wegGrund(w, zielId, weg);
  if (grund) return { ok: false, text: grund };
  const sp = w.spiel!, def = WEGE[weg], st = stand(w, zielId), z = zielDef(zielId)!;
  sp.kapital -= def.pk;
  verbrauche(w, def.aufmerksamkeit, `Großes Ziel: ${weg}`);
  if (def.bip > 0) kosten(w, def.bip);
  st.vorbereitung = Math.min(GROSSE_ZIELE.vorbereitungMax, st.vorbereitung + def.vorbereitung);
  (st.weg ??= {})[weg] = w.day;
  if (weg === "gipfel") for (const l of z.partner) if (istHauptakteur(l)) landAendern(w, l, { vertrauen: 2 }, t("gz2.notiz.gipfel"));
  if (weg === "kampagne") wirke(w, "ansehen", 0.3);
  const text = t(`gz2.x.weg.${weg}`, { ziel: t(`gz2.ziel.${zielId}.titel`) });
  addLog(w, "entscheidung", text, t("gz2.x.weg.warum", { plus: def.vorbereitung }));
  return { ok: true, text };
}

export function versuchGrund(w: World, zielId: string): string | undefined {
  const sp = w.spiel!, z = zielDef(zielId), st = stand(w, zielId);
  const s = z?.stufen[st.stufe];
  if (!z || !s) return t("gz2.grund.erreicht");
  if (!grosseZiele(w).verfolgt.includes(zielId)) return t("gz2.grund.nichtVerfolgt");
  if ((st.sperreBis ?? -1) > w.day) return t("gz2.grund.sperre", { tage: st.sperreBis! - w.day });
  if (schwelleSicht(w, s).some((x) => !x.erfuellt)) return t("gz2.grund.schwelle");
  if (!kannZahlen(sp.kapital, s.pk)) return t("gz2.grund.kapital", { pk: s.pk });
  return undefined;
}

function wende(w: World, e: Effekt, faktor: number): void {
  if (e.art === "knoten") { if (NET.index.has(e.id)) wirke(w, e.id, e.d * faktor); return; }
  for (const l of e.laender) if (istHauptakteur(l)) landAendern(w, l, { [e.dim]: e.d * faktor }, t("gz2.notiz.ziel"));
}

/** Der Versuch: Wurf gegen die Chance. Knapp verfehlt: Teilerfolg (abgeschwächte Fassung, halbe Wirkung); sonst Scheitern mit Sperrfrist. */
export function versuche(w: World, zielId: string, rng?: Rng): ZielErgebnis {
  const grund = versuchGrund(w, zielId);
  if (grund) return { ok: false, text: grund };
  const sp = w.spiel!, z = zielDef(zielId)!, st = stand(w, zielId), s = z.stufen[st.stufe]!;
  const c = chanceVon(w, zielId)!.chance;
  sp.kapital -= s.pk;
  verbrauche(w, s.aufmerksamkeit, `Großes Ziel: Versuch ${zielId}`);
  st.versuche += 1;
  // Eigener, abgeleiteter Zufallsstrom: Die gemeinsame Folge bleibt unberührt
  const r = (rng ?? new Rng((w.rngState ^ Math.imul(w.day + st.versuche * 7 + zielId.length, 0x27d4eb2d)) | 0)).next();
  const zielName = t(`gz2.ziel.${zielId}.titel`), stufeName = t(`gz2.ziel.${zielId}.${s.id}`);
  let ausgang: "erfolg" | "teilerfolg" | "scheitern";
  if (r < c) {
    ausgang = "erfolg";
    for (const e of s.erfolg) wende(w, e, 1);
  } else if (r < c + GROSSE_ZIELE.teilerfolgBreite) {
    ausgang = "teilerfolg";
    for (const e of s.erfolg) wende(w, e, 0.5);
  } else {
    ausgang = "scheitern";
    st.sperreBis = w.day + GROSSE_ZIELE.sperreTage;
    st.vorbereitung = Math.round(st.vorbereitung / 2);
    wirke(w, "ansehen", GROSSE_ZIELE.ansehenScheitern);
    for (const l of z.partner) if (istHauptakteur(l)) landAendern(w, l, { vertrauen: -3 }, t("gz2.notiz.gescheitert"));
  }
  if (ausgang !== "scheitern") {
    st.stufe += 1;
    st.abgeschwaecht = ausgang === "teilerfolg";
    st.vorbereitung = 0;
    // Gegenspieler stellen sich quer: Wer verliert, wenn die Türkei aufsteigt, sagt es
    for (const l of z.gegenspieler) if (istHauptakteur(l)) landAendern(w, l, { vertrauen: -3, konflikt: 3 }, t("gz2.notiz.gegenspieler"));
    if (st.stufe >= z.stufen.length) grosseZiele(w).verfolgt = grosseZiele(w).verfolgt.filter((x) => x !== zielId);
  }
  const text = t(`gz2.x.${ausgang}`, { ziel: zielName, stufe: stufeName });
  sp.hinweise.push({ id: `grossziel-${zielId}-${w.day}`, titel: text, szene: ausgang === "scheitern" ? "parlament" : "istanbul", text: [t(`gz2.x.${ausgang}.text`, { ziel: zielName, stufe: stufeName, chance: Math.round(c * 100) })] });
  addLog(w, "entscheidung", text, t("gz2.x.wurf", { chance: Math.round(c * 100) }));
  return { ok: true, text, ausgang };
}

/** Botschaft oder Vertretung ausbauen (Stufe 1 Botschaft, 2 mit Handels- und Kulturzentrum, 3 Großbotschaft): ein Knopf mit Preis. */
export function vertretungGrund(w: World, land: string): string | undefined {
  if (vertretungVon(w, land) >= GROSSE_ZIELE.vertretungMax) return t("gz2.grund.vertretungVoll");
  if (!kannZahlen(w.spiel!.kapital, GROSSE_ZIELE.vertretungPk)) return t("gz2.grund.kapital", { pk: GROSSE_ZIELE.vertretungPk });
  return undefined;
}
export function vertretungAusbauen(w: World, land: string): ZielErgebnis {
  const grund = vertretungGrund(w, land);
  if (grund) return { ok: false, text: grund };
  const g = grosseZiele(w);
  w.spiel!.kapital -= GROSSE_ZIELE.vertretungPk;
  kosten(w, GROSSE_ZIELE.vertretungBip);
  g.vertretungen[land] = vertretungVon(w, land) + 1;
  if (istHauptakteur(land)) landAendern(w, land, { vertrauen: 2, handel: 2 }, t("gz2.notiz.vertretung"));
  const text = t("gz2.x.vertretung", { stufe: g.vertretungen[land]! });
  addLog(w, "entscheidung", text, t("gz2.x.vertretung.warum"));
  return { ok: true, text };
}

/** Monatsschritt: Vorbereitung verfliegt, wenn niemand sie pflegt. */
export function grosseZieleMonat(w: World): void {
  const g = w.spiel?.grosseZiele;
  if (!g) return;
  for (const st of Object.values(g.stand)) st.vorbereitung = Math.max(0, st.vorbereitung - GROSSE_ZIELE.vorbereitungVerfallMonat);
}
