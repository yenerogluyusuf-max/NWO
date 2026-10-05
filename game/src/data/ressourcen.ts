// Ressourcenvorkommen für die Linse „Ressourcen“: nur breit belegte Vorkommen (MTA-Lagerstättenkarte, Eti Maden, TPAO, DSİ, USGS),
// ohne Mengenangaben je Ort. Ergänzt um die Orte aus RECHERCHE_GLM_3 (Abschnitt 2.5), Koordinaten dort als Regionalangabe. Ausländische Vorkommen mit Länderkennung aus dem Weltmodell und Lage für die Karte.

import type { GutId } from "./gueter";

export interface Vorkommen {
  id: string;
  gut: GutId;
  /** Provinz (Kfz-Kennziffer) oder Land außerhalb der Türkei */
  plaka?: number;
  land?: string;
  ort: string;
  lon: number;
  lat: number;
  /** Bedeutung: 3 Weltrang, 2 national wichtig, 1 regional */
  rang: 1 | 2 | 3;
  quelle: string;
}

export const VORKOMMEN: Vorkommen[] = [
  // Bor (Eti Maden): Weltrang
  { id: "bor_kirka", gut: "bor", plaka: 26, ort: "Kırka (Eskişehir)", lon: 30.53, lat: 39.29, rang: 3, quelle: "Eti Maden" },
  { id: "bor_bigadic", gut: "bor", plaka: 10, ort: "Bigadiç (Balıkesir)", lon: 28.13, lat: 39.39, rang: 3, quelle: "Eti Maden" },
  { id: "bor_emet", gut: "bor", plaka: 43, ort: "Emet (Kütahya)", lon: 29.26, lat: 39.34, rang: 3, quelle: "Eti Maden" },
  { id: "bor_kestelek", gut: "bor", plaka: 16, ort: "Kestelek (Bursa)", lon: 28.83, lat: 39.92, rang: 2, quelle: "Eti Maden" },
  { id: "see_beylikova", gut: "bor", plaka: 26, ort: "Beylikova (Eskişehir): Seltene Erden, Pilotanlage; Umfang umstritten", lon: 31.21, lat: 39.69, rang: 2, quelle: "MTA" },
  // Erze
  { id: "chrom_guleman", gut: "erze", plaka: 23, ort: "Guleman (Elazığ): Chrom", lon: 39.53, lat: 38.53, rang: 2, quelle: "MTA" },
  { id: "kupfer_murgul", gut: "erze", plaka: 8, ort: "Murgul (Artvin): Kupfer", lon: 41.56, lat: 41.28, rang: 1, quelle: "MTA" },
  { id: "kupfer_maden", gut: "erze", plaka: 23, ort: "Maden (Elazığ): Kupfer", lon: 39.66, lat: 38.39, rang: 1, quelle: "MTA" },
  { id: "kupfer_kure", gut: "erze", plaka: 37, ort: "Küre (Kastamonu): Kupfer", lon: 33.71, lat: 41.80, rang: 1, quelle: "MTA" },
  { id: "eisen_divrigi", gut: "stahl", plaka: 58, ort: "Divriği (Sivas): Eisenerz", lon: 38.11, lat: 39.37, rang: 1, quelle: "MTA" },
  { id: "bor_bandirma", gut: "bor", plaka: 10, ort: "Bandırma (Balıkesir): Bor-Verarbeitung", lon: 27.97, lat: 40.35, rang: 2, quelle: "Eti Maden" },
  { id: "chrom_fethiye", gut: "erze", plaka: 48, ort: "Fethiye und Köyceğiz (Muğla): Chrom", lon: 28.70, lat: 36.80, rang: 1, quelle: "MTA" },
  { id: "kupfer_cayeli", gut: "erze", plaka: 53, ort: "Çayeli (Rize): Kupfer", lon: 40.73, lat: 41.09, rang: 1, quelle: "MTA" },
  // Kohle
  { id: "kohle_zonguldak", gut: "kohle", plaka: 67, ort: "Zonguldak: Steinkohle", lon: 31.79, lat: 41.45, rang: 2, quelle: "TTK" },
  { id: "kohle_elbistan", gut: "kohle", plaka: 46, ort: "Afşin-Elbistan: Braunkohle", lon: 37.20, lat: 38.25, rang: 2, quelle: "EÜAŞ" },
  { id: "kohle_soma", gut: "kohle", plaka: 45, ort: "Soma (Manisa): Braunkohle", lon: 27.61, lat: 39.19, rang: 2, quelle: "TKİ" },
  { id: "kohle_yatagan", gut: "kohle", plaka: 48, ort: "Yatağan (Muğla): Braunkohle", lon: 28.14, lat: 37.34, rang: 1, quelle: "EÜAŞ/MTA" },
  { id: "kohle_seyitomer", gut: "kohle", plaka: 43, ort: "Seyitömer (Kütahya): Braunkohle", lon: 29.90, lat: 39.40, rang: 1, quelle: "EÜAŞ/MTA" },
  { id: "kohle_kangal", gut: "kohle", plaka: 58, ort: "Kangal (Sivas): Braunkohle", lon: 37.38, lat: 39.23, rang: 1, quelle: "EÜAŞ/MTA" },
  { id: "kohle_can", gut: "kohle", plaka: 17, ort: "Çan (Çanakkale): Braunkohle", lon: 27.05, lat: 40.03, rang: 1, quelle: "EÜAŞ/MTA" },
  // Öl und Gas
  { id: "oel_batman", gut: "erdoel", plaka: 72, ort: "Batman: Ölfelder", lon: 41.13, lat: 37.89, rang: 1, quelle: "TPAO" },
  { id: "oel_gabar", gut: "erdoel", plaka: 73, ort: "Gabar (Şırnak): Ölfeld", lon: 42.30, lat: 37.50, rang: 2, quelle: "TPAO" },
  { id: "gas_sakarya", gut: "erdgas", ort: "Sakarya-Feld (Schwarzes Meer, Anlandung Filyos)", lon: 31.50, lat: 42.30, rang: 2, plaka: 67, quelle: "TPAO" },
  // Wasser und Staudämme
  { id: "wasser_ataturk", gut: "wasser", plaka: 63, ort: "Atatürk-Staudamm (Euphrat)", lon: 38.32, lat: 37.48, rang: 3, quelle: "DSİ" },
  { id: "wasser_keban", gut: "wasser", plaka: 23, ort: "Keban-Staudamm (Euphrat)", lon: 38.76, lat: 38.80, rang: 2, quelle: "DSİ" },
  { id: "wasser_ilisu", gut: "wasser", plaka: 47, ort: "Ilısu-Staudamm (Tigris)", lon: 41.85, lat: 37.53, rang: 3, quelle: "DSİ" },
  // Strom aus Wärme und Sonne
  { id: "strom_kizildere", gut: "strom", plaka: 20, ort: "Kızıldere (Denizli): Geothermie", lon: 28.85, lat: 37.95, rang: 1, quelle: "MTA/EPDK" },
  { id: "strom_germencik", gut: "strom", plaka: 9, ort: "Germencik (Aydın): Geothermie", lon: 27.60, lat: 37.87, rang: 1, quelle: "MTA/EPDK" },
  { id: "strom_karapinar", gut: "strom", plaka: 42, ort: "Karapınar (Konya): Solarpark", lon: 33.55, lat: 37.72, rang: 2, quelle: "EPDK" },
  // Landwirtschaft
  { id: "getreide_konya", gut: "getreide", plaka: 42, ort: "Konya-Ebene: Weizen", lon: 32.50, lat: 37.90, rang: 3, quelle: "TÜİK" },
  { id: "getreide_cukurova", gut: "getreide", plaka: 1, ort: "Çukurova (Adana): Weizen, Mais, Baumwolle", lon: 35.40, lat: 36.95, rang: 2, quelle: "TÜİK" },
  { id: "obst_anamur", gut: "obst_gemuese", plaka: 33, ort: "Anamur und Bozyazı (Mersin): Bananen", lon: 32.83, lat: 36.08, rang: 1, quelle: "TÜİK" },
  { id: "obst_alanya", gut: "obst_gemuese", plaka: 7, ort: "Alanya und Manavgat (Antalya): Bananen, Gewächshäuser", lon: 32.00, lat: 36.54, rang: 1, quelle: "TÜİK" },
  { id: "obst_haselnuss", gut: "obst_gemuese", plaka: 52, ort: "Ordu und Giresun: Haselnüsse (Weltrang)", lon: 37.88, lat: 40.98, rang: 3, quelle: "TÜİK/FAO" },
  // Ausland: Öl und Gas
  { id: "ausl_kirkuk", gut: "erdoel", land: "IRQ", ort: "Kirkuk und Kurdistan-Irak: Öl", lon: 44.39, lat: 35.47, rang: 3, quelle: "IEA" },
  { id: "ausl_basra", gut: "erdoel", land: "IRQ", ort: "Basra: Öl", lon: 47.78, lat: 30.51, rang: 3, quelle: "IEA" },
  { id: "ausl_southpars", gut: "erdgas", land: "IRN", ort: "South Pars: Gas", lon: 52.60, lat: 26.90, rang: 3, quelle: "IEA" },
  { id: "ausl_khuzestan", gut: "erdoel", land: "IRN", ort: "Chuzestan: Öl", lon: 48.70, lat: 31.30, rang: 3, quelle: "IEA" },
  { id: "ausl_shahdeniz", gut: "erdgas", land: "AZE", ort: "Shah Deniz (Kaspisches Meer): Gas", lon: 50.10, lat: 39.90, rang: 2, quelle: "BP/SOCAR" },
  { id: "ausl_acg", gut: "erdoel", land: "AZE", ort: "Azeri-Chirag-Gunashli: Öl", lon: 51.00, lat: 40.10, rang: 2, quelle: "BP/SOCAR" },
  { id: "ausl_westsibirien", gut: "erdgas", land: "RUS", ort: "Russland (über TurkStream): Gas", lon: 38.00, lat: 44.50, rang: 3, quelle: "IEA" },
  { id: "ausl_ghawar", gut: "erdoel", land: "SAU", ort: "Ghawar: Öl", lon: 49.20, lat: 25.40, rang: 3, quelle: "IEA" },
  { id: "ausl_northfield", gut: "erdgas", land: "QAT", ort: "North Field: Gas (LNG)", lon: 51.80, lat: 26.20, rang: 3, quelle: "IEA" },
  { id: "ausl_levante", gut: "erdgas", land: "ISR", ort: "Leviathan und Tamar: Gas", lon: 33.70, lat: 32.60, rang: 2, quelle: "IEA" },
  { id: "ausl_aphrodite", gut: "erdgas", land: "CYP", ort: "Aphrodite (Zypern): Gas, umstritten", lon: 33.10, lat: 33.70, rang: 1, quelle: "IEA" },
];

export const GUT_SYMBOL: Record<GutId, string> = {
  getreide: "Ähre", obst_gemuese: "Obst", fleisch_milch: "Vieh", zucker_oele: "Öl", wasser: "Wasser", strom: "Strom", erdgas: "Gas", erdoel: "Öl",
  kohle: "Kohle", stahl: "Eisen", bor: "Bor", erze: "Erz", elektronik: "Chip", medikamente: "Medizin", duenger: "Dünger", ruestung: "Rüstung",
};
