// Regionale Startwerte des Politiknetzes aus den Provinzdaten.
// Die Faktoren sind grobe Ableitungen (Wirtschaftskraft, Stadtgröße, Region);
// sie sollen Unterschiede in die richtige Richtung zeigen, nicht messen.

import raw from "../data/provinzdaten.json";
import infraRaw from "../data/provinz_infra.json";
import type { RegionalStart } from "./netz";
import { datenTabelle } from "../i18n/daten";

export interface ProvinceData {
  plaka: number;
  name: string;
  bevoelkerung: number;
  region: string;
  nuts2: string;
  bipProKopf: number;
  arbeitslosigkeit: number;
  arbeitslosigkeitHerkunft: "belegt" | "geschaetzt";
  sitze: number;
  stimmen2023: Record<"AKP" | "CHP" | "MHP" | "İYİ" | "YSP", number>;
  buergermeister2024: string;
  grossstadt: boolean;
}

/** Deutsche Namen der sieben Regionen (in Klammern der türkische Name). */
export const REGION_DE: Record<string, string> = {
  Marmara: "Marmara",
  Ege: "Ägäis (Ege)",
  Akdeniz: "Mittelmeer (Akdeniz)",
  "İç Anadolu": "Zentralanatolien (İç Anadolu)",
  Karadeniz: "Schwarzmeer (Karadeniz)",
  "Doğu Anadolu": "Ostanatolien (Doğu Anadolu)",
  "Güneydoğu Anadolu": "Südostanatolien (Güneydoğu Anadolu)",
};

datenTabelle("region", REGION_DE);

export const PROVINZEN: ProvinceData[] = (raw as { provinzen: ProvinceData[] }).provinzen.sort((a, b) => a.plaka - b.plaka);

const totalPop = PROVINZEN.reduce((s, p) => s + p.bevoelkerung, 0);

/** Bevölkerungsanteil je Provinz, Index = Kfz-Kennziffer − 1. */
export const WEIGHTS: number[] = PROVINZEN.map((p) => p.bevoelkerung / totalPop);

const avgGdp = PROVINZEN.reduce((s, p) => s + p.bevoelkerung * p.bipProKopf, 0) / totalPop;
const avgUnemployment = PROVINZEN.reduce((s, p) => s + p.bevoelkerung * p.arbeitslosigkeit, 0) / totalPop;

/** Grobe Einordnung der Provinzen an großen Bruchzonen (Nordanatolische, Ostanatolische Verwerfung, Ägäis). */
export const SEISMIC = new Set([2, 9, 10, 12, 14, 16, 20, 23, 24, 31, 34, 35, 41, 44, 45, 46, 48, 54, 65, 77, 81]);

/** Grenzprovinzen zu Syrien mit vielen Geflüchteten. */
export const BORDER = new Set([27, 31, 47, 63, 79]);

const WATER: Record<string, number> = {
  "Güneydoğu Anadolu": 0.8,
  "İç Anadolu": 0.85,
  Akdeniz: 0.95,
  Ege: 0.95,
  Marmara: 1.0,
  "Doğu Anadolu": 1.05,
  Karadeniz: 1.2,
};

function perProvince(f: (p: ProvinceData, gdpRatio: number) => number): number[] {
  return PROVINZEN.map((p) => f(p, p.bipProKopf / avgGdp));
}

const cityFactor = (p: ProvinceData, big: number, mid: number, small: number) =>
  p.bevoelkerung > 4_000_000 ? big : p.bevoelkerung > 2_000_000 ? mid : small;

/**
 * Belegte Unterschiede der Netze je Provinz (Befund F-3, Nacht N6): Straßendichte (km je km²) und Schienenlänge je Fläche aus
 * data/provinz_infra.json (© OpenStreetMap-Mitwirkende, ODbL, Geofabrik-Auszug Türkei). Vorher starteten „Straßen und Autobahnen“
 * und „Bahnnetz“ in allen 81 Provinzen gleich (Adıyaman mit 52 km Bahn wie İstanbul). Gedämpft mit Exponent 0,35 und so genormt,
 * dass das Landesmittel (nach Bevölkerung) gleich bleibt; Provinzen ohne Schiene zählen mit 15 % des Mittels. Exponent und
 * Untergrenze sind Spielparameter, die Rangfolge kommt aus den Daten.
 */
const INFRA_PROV = (infraRaw as { provinzen: Record<string, { flaeche_km2: number; strasse_dichte: number; schiene_km: number }> }).provinzen;
function netzFaktor(wert: (p: ProvinceData) => number): number[] {
  const roh = PROVINZEN.map(wert);
  const mittel = roh.reduce((s, x, i) => s + x * WEIGHTS[i]!, 0);
  const f = roh.map((x) => (Math.max(x, 0.15 * mittel) / Math.max(1e-9, mittel)) ** 0.35);
  const norm = f.reduce((s, x, i) => s + x * WEIGHTS[i]!, 0);
  return f.map((x) => x / norm);
}

export const REGIONAL: RegionalStart = {
  verkehrsnetz: netzFaktor((p) => INFRA_PROV[String(p.plaka)]?.strasse_dichte ?? 0),
  bahnnetz: netzFaktor((p) => { const x = INFRA_PROV[String(p.plaka)]; return x ? x.schiene_km / Math.max(1, x.flaeche_km2) : 0; }),

  // Eingang: Arbeitslosigkeit je Provinz relativ zum Landeswert
  arbeitslosigkeit: perProvince((p) => p.arbeitslosigkeit / avgUnemployment),

  armut: perProvince((_, r) => r ** -0.5),
  p_armut: perProvince((_, r) => r ** -0.5),
  realeinkommen: perProvince((_, r) => r ** 0.3),
  schulabbruch: perProvince((_, r) => r ** -0.4),
  jugendarbeitslosigkeit: perProvince((p) => p.arbeitslosigkeit / avgUnemployment),
  p_jugendarbeitslosigkeit: perProvince((p) => p.arbeitslosigkeit / avgUnemployment),
  bildungsqualitaet: perProvince((_, r) => r ** 0.2),
  hochschule: perProvince((_, r) => r ** 0.2),
  gesundheitsversorgung: perProvince((_, r) => r ** 0.2),
  aerzte: perProvince((_, r) => r ** 0.3),
  p_aerztemangel: perProvince((_, r) => r ** -0.3),
  internet: perProvince((_, r) => r ** 0.25),
  wachstum_regional: perProvince((_, r) => r ** 0.3),
  landwirtschaft_einkommen: perProvince((_, r) => r ** 0.2),
  landflucht: perProvince((p, r) => r ** -0.4 * cityFactor(p, 0.6, 0.8, 1)),
  p_landflucht: perProvince((p, r) => r ** -0.4 * cityFactor(p, 0.6, 0.8, 1)),

  mieten: perProvince((p) => cityFactor(p, 1.25, 1.1, 0.85)),
  p_wohnungsnot: perProvince((p) => cityFactor(p, 1.25, 1.1, 0.85)),
  stau: perProvince((p) => cityFactor(p, 1.3, 1.1, 0.8)),
  luftqualitaet: perProvince((p) => cityFactor(p, 0.8, 0.9, 1.05)),
  p_luftverschmutzung: perProvince((p) => cityFactor(p, 1.3, 1.1, 0.9)),

  wasserversorgung: perProvince((p) => WATER[p.region] ?? 1),
  duerre: perProvince((p) => 1 / (WATER[p.region] ?? 1)),
  p_wassermangel: perProvince((p) => (1 / (WATER[p.region] ?? 1)) ** 2),

  p_erdbebengefahr: perProvince((p) => (SEISMIC.has(p.plaka) ? 1.15 : 0.85)),
  erdbebenvorsorge: perProvince((p) => (SEISMIC.has(p.plaka) ? 0.95 : 1.05)),

  gefluechtete: perProvince((p) => (BORDER.has(p.plaka) ? 1.5 : p.plaka === 34 ? 1.2 : 0.85)),
  p_migrationsdruck: perProvince((p) => (BORDER.has(p.plaka) ? 1.2 : p.plaka === 34 ? 1.1 : 0.9)),
};
