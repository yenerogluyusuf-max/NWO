// Kartendaten der Oberfläche: Provinzgeometrie, Regionsfarben, Schwerpunkte für Beschriftungen und Kamerafahrten.
// Gezeichnet wird in vector.ts (scharf, pro Bild); hier liegen nur die Daten.

import type { Feature, FeatureCollection, Geometry, Position } from "geojson";
import raw from "../../data/provinzen.json";
import { lonLatToUv, type Relief } from "./scene";

export interface ProvinceProps {
  id: string;
  plaka: number;
  name: string;
}

export const PROVINCE_FC = raw as unknown as FeatureCollection<Geometry, ProvinceProps>;

/** Farben der sieben Regionen für die Kartenebene „Regionen“. */
export const REGION_COLORS: Record<string, string> = {
  Marmara: "#d9ab5e",
  Ege: "#a9bb6c",
  Akdeniz: "#e0915f",
  "İç Anadolu": "#e8cf85",
  Karadeniz: "#7fae7a",
  "Doğu Anadolu": "#a996c4",
  "Güneydoğu Anadolu": "#d58a78",
};

/** Die Türkei in der politischen Ansicht, wie ein Land in Hearts of Iron. */
export const NATION_COLOR = "#a8604a";

export function ringsOf(f: Feature<Geometry, ProvinceProps>): Position[][] {
  const g = f.geometry;
  if (g.type === "Polygon") return g.coordinates;
  if (g.type === "MultiPolygon") return g.coordinates.flat();
  return [];
}

/** Schwerpunkt einer Provinz in Texturkoordinaten (für Beschriftungen). */
export function provinceCenters(r: Relief): Record<number, [number, number]> {
  const out: Record<number, [number, number]> = {};
  for (const f of PROVINCE_FC.features) {
    // größten Ring nehmen, dessen Mittelwert reicht für die Beschriftung
    const ring = ringsOf(f).sort((a, b) => b.length - a.length)[0] ?? [];
    let su = 0;
    let sv = 0;
    for (const pt of ring) {
      const [u, v] = lonLatToUv(r, pt[0]!, pt[1]!);
      su += u;
      sv += v;
    }
    out[f.properties.plaka] = [su / ring.length, sv / ring.length];
  }
  return out;
}

/** Mittelpunkt einer Provinz in Länge und Breite, etwa für Kamerafahrten. */
export function provinceLonLat(plaka: number): [number, number] | undefined {
  const f = PROVINCE_FC.features.find((x) => x.properties.plaka === plaka);
  if (!f) return undefined;
  const ring = ringsOf(f).sort((a, b) => b.length - a.length)[0] ?? [];
  let lon = 0;
  let lat = 0;
  for (const pt of ring) {
    lon += pt[0]!;
    lat += pt[1]!;
  }
  return [lon / ring.length, lat / ring.length];
}

/** Kfz-Kennziffer zu einem Provinznamen (türkische Schreibung). */
export function plakaByName(name: string): number | undefined {
  return PROVINCE_FC.features.find((f) => f.properties.name === name)?.properties.plaka;
}
