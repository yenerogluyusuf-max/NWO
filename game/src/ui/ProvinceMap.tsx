import { useMemo, useState } from "react";
import { geoMercator, geoPath } from "d3-geo";
import type { FeatureCollection, Geometry } from "geojson";
import raw from "../data/provinzen.json";

interface ProvinceProps {
  id: string;
  plaka: number;
  name: string;
}

const provinces = raw as unknown as FeatureCollection<Geometry, ProvinceProps>;

/** Die 30 Großstadtkommunen (tuerkei/INSTITUTIONEN.md, Abschnitt 8). */
const METROPOLITAN = new Set(
  "Adana, Ankara, Antalya, Aydın, Balıkesir, Bursa, Denizli, Diyarbakır, Erzurum, Eskişehir, Gaziantep, Hatay, İstanbul, İzmir, Kahramanmaraş, Kayseri, Kocaeli, Konya, Malatya, Manisa, Mardin, Mersin, Muğla, Ordu, Sakarya, Samsun, Şanlıurfa, Tekirdağ, Trabzon, Van".split(", "),
);

/** Großstädte, die sich bis in die Bezirke aufklappen lassen (Bezirkszahl laut Recherche). */
const DISTRICTS: Record<string, number> = { İstanbul: 39, Ankara: 25, İzmir: 30 };

const W = 960;
const H = 440;

export function ProvinceMap() {
  const [hover, setHover] = useState<ProvinceProps | null>(null);
  const [selected, setSelected] = useState<ProvinceProps | null>(null);

  const paths = useMemo(() => {
    const projection = geoMercator().fitSize([W, H], provinces);
    const path = geoPath(projection);
    return provinces.features.map((f) => ({
      props: f.properties,
      d: path(f) ?? "",
      centroid: path.centroid(f),
    }));
  }, []);

  const info = hover ?? selected;

  return (
    <div className="mapview">
      <section className="paper">
        <h2>Karte</h2>
        <p className="subtitle">81 Provinzen · Punkte markieren die 30 Großstadtkommunen</p>
        <svg className="map" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Karte der Türkei mit 81 Provinzen">
          {paths.map(({ props, d }) => (
            <path
              key={props.id}
              d={d}
              className={
                "province" +
                (selected?.id === props.id ? " selected" : "") +
                (METROPOLITAN.has(props.name) ? " metro" : "")
              }
              onMouseEnter={() => setHover(props)}
              onMouseLeave={() => setHover(null)}
              onClick={() => setSelected(props)}
            >
              <title>{props.name}</title>
            </path>
          ))}
          {paths
            .filter(({ props }) => METROPOLITAN.has(props.name))
            .map(({ props, centroid }) => (
              <circle key={props.id} cx={centroid[0]} cy={centroid[1]} r={DISTRICTS[props.name] ? 5 : 3} className="metro-dot" />
            ))}
        </svg>
      </section>
      <aside className="paper province-card">
        {info ? (
          <>
            <h3>{info.name}</h3>
            <p className="subtitle">Provinz Nr. {info.plaka}</p>
            <p>{METROPOLITAN.has(info.name) ? "Großstadtkommune mit gewähltem Oberbürgermeister." : "Provinz mit Provinzverwaltung und gewählten Bürgermeistern."}</p>
            <p>Der Gouverneur wird vom Präsidenten ernannt.</p>
            {DISTRICTS[info.name] && (
              <p>
                <strong>{DISTRICTS[info.name]} Bezirke</strong>, aufklappbar (folgt).
              </p>
            )}
            <p className="hint">Regionale Daten (Bevölkerung, Probleme, Stimmung) folgen mit dem Politiknetz.</p>
          </>
        ) : (
          <p className="subtitle">Fahre über eine Provinz oder klicke sie an.</p>
        )}
      </aside>
    </div>
  );
}
