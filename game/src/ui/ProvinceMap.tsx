import { useMemo, useState } from "react";
import { geoMercator, geoPath } from "d3-geo";
import type { FeatureCollection, Geometry } from "geojson";
import raw from "../data/provinzen.json";
import type { World } from "../sim/types";
import { PROVINZEN } from "../sim/regional";
import { NET } from "../sim/world";
import { PROVINCES } from "../sim/netz";
import { PARTY_COLORS } from "./Parliament";

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

interface MapProps {
  /** Wert je Kfz-Kennziffer; färbt die Provinzen ein */
  values?: Record<number, number>;
  valueLabel?: string;
  /** Schwelle, ab der ein Problem akut ist (färbt rot) */
  problem?: number;
  compact?: boolean;
  world?: World;
}

type Mode = "wahl" | "wirtschaft" | "arbeitslosigkeit" | "probleme";

const MODES: { id: Mode; label: string }[] = [
  { id: "wahl", label: "Wahl 2028" },
  { id: "wirtschaft", label: "Wirtschaftskraft" },
  { id: "arbeitslosigkeit", label: "Arbeitslosigkeit" },
  { id: "probleme", label: "Akute Probleme" },
];

function acuteProblems(world: World, plaka: number): string[] {
  return NET.nodes
    .filter((n) => n.kind === "problem" && n.threshold !== undefined)
    .filter((n) => world.net.values[NET.index.get(n.id)! * PROVINCES + plaka - 1]! >= n.threshold!)
    .map((n) => n.name);
}

function winner(world: World, plaka: number): string | undefined {
  const seats = world.parliament?.byProvince?.[plaka];
  if (!seats) return undefined;
  return Object.entries(seats).sort((a, b) => b[1] - a[1])[0]?.[0];
}

function mix(a: [number, number, number], b: [number, number, number], t: number): string {
  const c = a.map((x, i) => Math.round(x + (b[i]! - x) * t));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

const LOW: [number, number, number] = [236, 229, 212];
const HIGH: [number, number, number] = [47, 93, 98];
const ACUTE: [number, number, number] = [158, 52, 46];

export function ProvinceMap({ values, valueLabel, problem, compact, world }: MapProps = {}) {
  const [hover, setHover] = useState<ProvinceProps | null>(null);
  const [selected, setSelected] = useState<ProvinceProps | null>(null);
  const [mode, setMode] = useState<Mode>("wahl");

  const gdpRange = useMemo(() => {
    const xs = PROVINZEN.map((p) => p.bipProKopf);
    return { min: Math.min(...xs), max: Math.max(...xs) };
  }, []);

  function modeFill(plaka: number): string | undefined {
    const data = PROVINZEN[plaka - 1];
    if (!data) return undefined;
    if (mode === "wahl" && world) {
      const w = winner(world, plaka);
      if (!w) return undefined;
      return w === world.player?.partei.kurz ? world.player.partei.farbe : (PARTY_COLORS[w] ?? "#999");
    }
    if (mode === "wirtschaft") return mix(LOW, HIGH, Math.sqrt((data.bipProKopf - gdpRange.min) / (gdpRange.max - gdpRange.min)));
    if (mode === "arbeitslosigkeit") return mix(LOW, ACUTE, Math.min(1, Math.max(0, (data.arbeitslosigkeit - 4) / 10)));
    if (mode === "probleme" && world) {
      const n = acuteProblems(world, plaka).length;
      return n === 0 ? mix(LOW, HIGH, 0.1) : mix(LOW, ACUTE, Math.min(1, 0.3 + n * 0.25));
    }
    return undefined;
  }

  const scale = useMemo(() => {
    if (!values) return null;
    const xs = Object.values(values);
    const min = Math.min(...xs);
    const max = Math.max(...xs);
    return { min, max, flat: max - min < 0.5 };
  }, [values]);

  function fillFor(plaka: number): string | undefined {
    if (!values || !scale) return undefined;
    const v = values[plaka] ?? 0;
    if (problem !== undefined) return v >= problem ? mix(LOW, ACUTE, 0.35 + 0.65 * Math.min(1, (v - problem) / 20)) : mix(LOW, HIGH, 0.15);
    if (scale.flat) return mix(LOW, HIGH, 0.35);
    return mix(LOW, HIGH, (v - scale.min) / (scale.max - scale.min));
  }

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

  if (compact) {
    return (
      <section className="paper compact-map">
        <h3>{valueLabel} je Provinz</h3>
        <svg className="map" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${valueLabel} je Provinz`}>
          {paths.map(({ props, d }) => (
            <path
              key={props.id}
              d={d}
              className="province"
              style={{ fill: fillFor(props.plaka) }}
              onMouseEnter={() => setHover(props)}
              onMouseLeave={() => setHover(null)}
            >
              <title>
                {props.name}: {values?.[props.plaka]?.toLocaleString("de-DE", { maximumFractionDigits: 1 })}
              </title>
            </path>
          ))}
        </svg>
        <p className="subtitle">
          {hover
            ? `${hover.name}: ${values?.[hover.plaka]?.toLocaleString("de-DE", { maximumFractionDigits: 1 })}`
            : scale?.flat
              ? "Noch keine regionalen Unterschiede; die Provinzdaten werden gerade erhoben."
              : "Dunkler heißt mehr. Fahre über eine Provinz."}
        </p>
      </section>
    );
  }

  return (
    <div className="mapview">
      <section className="paper">
        <h2>Karte</h2>
        <p className="subtitle">81 Provinzen · Punkte markieren die 30 Großstadtkommunen</p>
        <div className="modes" role="group" aria-label="Kartenebene">
          {MODES.filter((m) => world || (m.id !== "wahl" && m.id !== "probleme")).map((m) => (
            <button key={m.id} className={mode === m.id ? "active" : ""} onClick={() => setMode(m.id)}>
              {m.label}
            </button>
          ))}
        </div>
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
              style={{ fill: modeFill(props.plaka) }}
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
            <p className="subtitle">Provinz Nr. {info.plaka} · {PROVINZEN[info.plaka - 1]?.region}</p>
            {(() => {
              const d = PROVINZEN[info.plaka - 1];
              if (!d) return null;
              const seats = world?.parliament?.byProvince?.[info.plaka];
              const acute = world ? acuteProblems(world, info.plaka) : [];
              return (
                <table className="facts">
                  <tbody>
                    <tr><th>Einwohner</th><td>{d.bevoelkerung.toLocaleString("de-DE")}</td></tr>
                    <tr><th>Wirtschaftskraft</th><td>{d.bipProKopf.toLocaleString("de-DE")} Lira pro Kopf (2024)</td></tr>
                    <tr><th>Arbeitslosigkeit</th><td>{d.arbeitslosigkeit.toLocaleString("de-DE")} %{d.arbeitslosigkeitHerkunft === "geschaetzt" ? " (geschätzt)" : ""}</td></tr>
                    <tr><th>Bürgermeister 2024</th><td>{d.buergermeister2024}{d.grossstadt ? " · Großstadtkommune" : ""}</td></tr>
                    <tr><th>Abgeordnete</th><td>{d.sitze}{seats ? ": " + Object.entries(seats).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k === world?.player?.partei.kurz ? world.player.partei.name : k} ${n}`).join(", ") : ""}</td></tr>
                    {world && <tr><th>Akute Probleme</th><td>{acute.length ? acute.join(", ") : "keine"}</td></tr>}
                  </tbody>
                </table>
              );
            })()}
            <p>Der Gouverneur wird vom Präsidenten ernannt.</p>
            {DISTRICTS[info.name] && (
              <p>
                <strong>{DISTRICTS[info.name]} Bezirke</strong>, aufklappbar (folgt).
              </p>
            )}
          </>
        ) : (
          <p className="subtitle">Fahre über eine Provinz oder klicke sie an.</p>
        )}
      </aside>
    </div>
  );
}
