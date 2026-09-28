import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { World } from "../sim/types";
import { advance, NET } from "../sim/world";
import { formatDateDe } from "../sim/dates";
import { nationalAverage, PROVINCES } from "../sim/netz";
import { PROVINZEN } from "../sim/regional";
import { AtlasMap } from "./atlas/AtlasMap";
import { PROVINCE_FC } from "./atlas/overlay";
import { Desk } from "./Desk";
import { EconomyFile } from "./EconomyFile";
import { NetView } from "./NetView";
import { Decisions } from "./Decisions";
import { PARTY_COLORS } from "./Parliament";
import { Icon, type IconName } from "./icons";

type Dossier = "schreibtisch" | "wirtschaft" | "netz" | "entscheidungen" | null;
type MapMode = "gelaende" | "wahl" | "wirtschaft" | "arbeitslosigkeit" | "probleme" | "netz";

const SPEEDS = [0, 700, 200, 40];

/** Beschriftungen wie in einem Atlas: Meere und Nachbarländer. */
const GEO_LABELS: { text: string; lon: number; lat: number; kind: "meer" | "land" }[] = [
  { text: "Schwarzes Meer", lon: 34.6, lat: 43.1, kind: "meer" },
  { text: "Mittelmeer", lon: 31.0, lat: 34.6, kind: "meer" },
  { text: "Ägäis", lon: 25.0, lat: 38.4, kind: "meer" },
  { text: "Griechenland", lon: 22.3, lat: 39.6, kind: "land" },
  { text: "Bulgarien", lon: 25.2, lat: 42.8, kind: "land" },
  { text: "Georgien", lon: 43.6, lat: 42.1, kind: "land" },
  { text: "Armenien", lon: 44.9, lat: 40.2, kind: "land" },
  { text: "Iran", lon: 47.0, lat: 37.6, kind: "land" },
  { text: "Irak", lon: 43.8, lat: 35.4, kind: "land" },
  { text: "Syrien", lon: 38.6, lat: 35.2, kind: "land" },
  { text: "Zypern", lon: 33.1, lat: 35.05, kind: "land" },
];

const METROS = PROVINCE_FC.features
  .filter((f) => PROVINZEN[f.properties.plaka - 1]?.grossstadt)
  .map((f) => f.properties.plaka);

function mix(a: number[], b: number[], t: number): string {
  const c = a.map((x, i) => Math.round(x + (b[i]! - x) * Math.min(1, Math.max(0, t))));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

const PAPER = [236, 226, 200];
const TEAL = [38, 90, 98];
const RED = [150, 44, 36];

export function Stage({ world: initial }: { world: World }) {
  const world = useRef<World>(initial);
  const [, setVersion] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [dossier, setDossier] = useState<Dossier>("schreibtisch");
  const [mapMode, setMapMode] = useState<MapMode>("gelaende");
  const [netNode, setNetNode] = useState<string>("p_wassermangel");
  const [selected, setSelected] = useState<number | undefined>(undefined);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);
  const w = world.current;

  useEffect(() => {
    const ms = SPEEDS[speed]!;
    if (!ms) return;
    const id = setInterval(() => {
      const before = world.current.log.length;
      advance(world.current, 1);
      if (world.current.log.slice(before).some((l) => l.kind === "entscheidung")) setSpeed(0);
      refresh();
    }, ms);
    return () => clearInterval(id);
  }, [speed, refresh]);

  const fill = useMemo(() => {
    const out: Record<number, string> = {};
    const nodeValues = (id: string) => {
      const i = NET.index.get(id)!;
      return Array.from({ length: PROVINCES }, (_, p) => w.net.values[i * PROVINCES + p]!);
    };
    if (mapMode === "gelaende") return undefined;
    if (mapMode === "wahl") {
      for (const [plaka, seats] of Object.entries(w.parliament?.byProvince ?? {})) {
        const top = Object.entries(seats).sort((a, b) => b[1] - a[1])[0]?.[0];
        if (!top) continue;
        out[Number(plaka)] = top === w.player?.partei.kurz ? w.player.partei.farbe : (PARTY_COLORS[top] ?? "#999");
      }
    }
    if (mapMode === "wirtschaft") {
      const xs = PROVINZEN.map((p) => p.bipProKopf);
      const min = Math.min(...xs);
      const max = Math.max(...xs);
      PROVINZEN.forEach((p) => (out[p.plaka] = mix(PAPER, TEAL, Math.sqrt((p.bipProKopf - min) / (max - min)))));
    }
    if (mapMode === "arbeitslosigkeit") {
      const vals = nodeValues("arbeitslosigkeit");
      vals.forEach((v, i) => (out[i + 1] = mix(PAPER, RED, (v - 4) / 10)));
    }
    if (mapMode === "probleme") {
      const problems = NET.nodes.filter((n) => n.kind === "problem");
      for (let p = 0; p < PROVINCES; p++) {
        const n = problems.filter((node) => w.net.values[NET.index.get(node.id)! * PROVINCES + p]! >= node.threshold!).length;
        out[p + 1] = n === 0 ? "rgba(0,0,0,0)" : mix(PAPER, RED, 0.35 + n * 0.22);
      }
    }
    if (mapMode === "netz") {
      const node = NET.nodes[NET.index.get(netNode)!]!;
      const vals = nodeValues(netNode);
      const min = Math.min(...vals);
      const max = Math.max(...vals);
      vals.forEach((v, i) => {
        if (node.kind === "problem") out[i + 1] = v >= node.threshold! ? mix(PAPER, RED, 0.45 + (v - node.threshold!) / 30) : "rgba(0,0,0,0)";
        else out[i + 1] = mix(PAPER, TEAL, max - min < 0.5 ? 0.4 : (v - min) / (max - min));
      });
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapMode, netNode, w.net.month, w.parliament]);

  const inflation = w.published.inflation.value;
  const own = w.player?.partei.kurz;
  const bloc = (own ? (w.parliament?.seats[own] ?? 0) : 0) + (w.player?.buendnis ? (w.parliament?.seats[w.player.buendnis] ?? 0) : 0);
  const trust = nationalAverage(NET, w.net, "vertrauen_regierung");

  const modes: { id: MapMode; label: string; icon: IconName }[] = [
    { id: "gelaende", label: "Gelände", icon: "berg" },
    { id: "wahl", label: "Wahl 2028", icon: "urne" },
    { id: "wirtschaft", label: "Wirtschaftskraft", icon: "fabrik" },
    { id: "arbeitslosigkeit", label: "Arbeitslosigkeit", icon: "koffer" },
    { id: "probleme", label: "Akute Probleme", icon: "warnung" },
  ];

  const dossiers: { id: Exclude<Dossier, null>; label: string }[] = [
    { id: "schreibtisch", label: "Schreibtisch" },
    { id: "wirtschaft", label: "Wirtschaftsakte" },
    { id: "netz", label: "Politiknetz" },
    { id: "entscheidungen", label: "Entscheidungen" },
  ];

  return (
    <div className="stage">
      <AtlasMap
        className="stage-map"
        fill={fill}
        fillAlpha={mapMode === "wahl" ? 0.45 : 0.62}
        selected={selected}
        labels={METROS}
        geoLabels={GEO_LABELS}
        onSelect={(p) => setSelected(p)}
      />

      <header className="hud">
        <div className="hud-left">
          <div className="seal" aria-hidden>
            <span>{w.player?.name.split(" ").map((x) => x[0]).join("").slice(0, 2) ?? "P"}</span>
          </div>
          <div>
            <div className="hud-name">{w.player?.name ?? "Staatspräsident"}</div>
            <div className="hud-sub">
              <span className="party-dot" style={{ background: w.player?.partei.farbe }} /> {w.player?.partei.name ?? "Staatsräson"}
            </div>
          </div>
        </div>
        <div className="hud-center">
          <div className="date-plate">{formatDateDe(w.date)}</div>
          <div className="speeds">
            {["❚❚", "▶", "▶▶", "▶▶▶"].map((l, i) => (
              <button key={l} className={i === speed ? "on" : ""} onClick={() => setSpeed(i)} aria-label={i === 0 ? "Pause" : `Tempo ${i}`}>
                {l}
              </button>
            ))}
          </div>
        </div>
        <div className="hud-right">
          <Stat icon="preis" label="Inflation" value={`${inflation.toLocaleString("de-DE", { maximumFractionDigits: 1 })} %`} />
          <Stat icon="lira" label="Lira je $" value={w.economy.usdTry.toLocaleString("de-DE", { maximumFractionDigits: 1 })} />
          <Stat icon="bank" label="Leitzins" value={`${w.economy.policyRate.toLocaleString("de-DE")} %`} />
          <Stat icon="parlament" label="Sitze" value={`${bloc} / 301`} warn={bloc < 301} />
          <Stat icon="haende" label="Vertrauen" value={`${Math.round(trust)}`} />
        </div>
      </header>

      {dossier && (
        <section className="dossier">
          <div className="dossier-tabs">
            {dossiers.map((d) => (
              <button key={d.id} className={dossier === d.id ? "on" : ""} onClick={() => setDossier(d.id)}>
                {d.label}
              </button>
            ))}
            <button className="close" onClick={() => setDossier(null)} aria-label="Mappe schließen">
              ✕
            </button>
          </div>
          <div className="dossier-body">
            {dossier === "schreibtisch" && <Desk world={w} onOpen={(v) => setDossier(v === "karte" ? null : (v as Dossier))} />}
            {dossier === "wirtschaft" && <EconomyFile world={w} />}
            {dossier === "netz" && (
              <NetView
                world={w}
                onDecided={refresh}
                onShowOnMap={(id) => {
                  setNetNode(id);
                  setMapMode("netz");
                }}
              />
            )}
            {dossier === "entscheidungen" && (
              <Decisions
                world={w}
                onDecided={() => {
                  refresh();
                  setDossier("schreibtisch");
                }}
              />
            )}
          </div>
        </section>
      )}
      {!dossier && (
        <button className="dossier-open" onClick={() => setDossier("schreibtisch")}>
          Aktenmappe
        </button>
      )}

      <nav className="mapmodes" aria-label="Kartenebenen">
        {modes.map((m) => (
          <button key={m.id} className={mapMode === m.id ? "on" : ""} onClick={() => setMapMode(m.id)} title={m.label}>
            <Icon name={m.icon} />
            <span>{m.label}</span>
          </button>
        ))}
        {mapMode === "netz" && (
          <span className="mapmode-note">Politiknetz: {NET.nodes[NET.index.get(netNode)!]!.name}</span>
        )}
      </nav>

      <div className="cartouche" aria-hidden>
        <div className="cartouche-title">Türkiye</div>
        <div className="cartouche-sub">81 Provinzen · Stand {w.date.slice(0, 4)}</div>
      </div>
      <svg className="compass" viewBox="0 0 100 100" aria-hidden>
        <circle cx="50" cy="50" r="30" fill="none" stroke="#2a1f18" strokeWidth="1" />
        <circle cx="50" cy="50" r="26" fill="none" stroke="#2a1f18" strokeWidth="0.5" strokeDasharray="1.5 2" />
        <path d="M50 8 L56 50 L50 92 L44 50 Z" fill="#f1e6cc" stroke="#2a1f18" strokeWidth="1.2" />
        <path d="M50 8 L56 50 L50 50 Z M50 92 L44 50 L50 50 Z" fill="#2a1f18" />
        <path d="M8 50 L50 45 L92 50 L50 55 Z" fill="#f1e6cc" stroke="#2a1f18" strokeWidth="1" />
        <path d="M92 50 L50 45 L50 50 Z M8 50 L50 55 L50 50 Z" fill="#8e2a22" />
        <text x="50" y="6" textAnchor="middle" fontFamily="Fraunces Variable, serif" fontSize="9" fontWeight="700" fill="#2a1f18">N</text>
      </svg>

      {selected && <ProvinceCard world={w} plaka={selected} onClose={() => setSelected(undefined)} />}
    </div>
  );
}

function Stat({ icon, label, value, warn }: { icon: IconName; label: string; value: string; warn?: boolean }) {
  return (
    <div className={`stat${warn ? " warn" : ""}`} title={label}>
      <Icon name={icon} />
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

function ProvinceCard({ world, plaka, onClose }: { world: World; plaka: number; onClose: () => void }) {
  const d = PROVINZEN[plaka - 1]!;
  const seats = world.parliament?.byProvince?.[plaka];
  const problems = NET.nodes
    .filter((n) => n.kind === "problem")
    .filter((n) => world.net.values[NET.index.get(n.id)! * PROVINCES + plaka - 1]! >= n.threshold!)
    .map((n) => n.name);
  const own = world.player?.partei;
  return (
    <aside className="province-card-float">
      <button className="close" onClick={onClose} aria-label="Schließen">
        ✕
      </button>
      <p className="kicker">Provinz Nr. {plaka} · {d.region}</p>
      <h2>{d.name}</h2>
      <dl>
        <dt>Einwohner</dt>
        <dd>{d.bevoelkerung.toLocaleString("de-DE")}</dd>
        <dt>Wirtschaftskraft</dt>
        <dd>{d.bipProKopf.toLocaleString("de-DE")} ₺ pro Kopf</dd>
        <dt>Arbeitslosigkeit</dt>
        <dd>
          {d.arbeitslosigkeit.toLocaleString("de-DE")} %{d.arbeitslosigkeitHerkunft === "geschaetzt" ? " (geschätzt)" : ""}
        </dd>
        <dt>Rathaus seit 2024</dt>
        <dd>{d.buergermeister2024}{d.grossstadt ? " · Großstadt" : ""}</dd>
        <dt>Abgeordnete</dt>
        <dd>
          {seats
            ? Object.entries(seats)
                .filter(([, n]) => n > 0)
                .sort((a, b) => b[1] - a[1])
                .map(([k, n]) => `${k === own?.kurz ? own.name : k} ${n}`)
                .join(" · ")
            : d.sitze}
        </dd>
      </dl>
      {problems.length > 0 && (
        <div className="stamps">
          {problems.map((p) => (
            <span key={p} className="stamp">
              {p}
            </span>
          ))}
        </div>
      )}
      <p className="footnote">Der Gouverneur wird vom Präsidenten ernannt.</p>
    </aside>
  );
}
