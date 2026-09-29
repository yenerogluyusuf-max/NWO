import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { World } from "../sim/types";
import { advance, NET } from "../sim/world";
import { formatDateDe } from "../sim/dates";
import { nationalAverage, PROVINCES } from "../sim/netz";
import { PROVINZEN } from "../sim/regional";
import { AtlasMap } from "./atlas/AtlasMap";
import { PROVINCE_FC, REGION_COLORS } from "./atlas/overlay";
import { Desk } from "./Desk";
import { Chat } from "./Chat";
import { EconomyFile } from "./EconomyFile";
import { NetView } from "./NetView";
import { Decisions } from "./Decisions";
import { PARTY_COLORS } from "./Parliament";
import { Icon, type IconName } from "./icons";
import { Cameo } from "./art/Cameo";
import { Corners } from "./art/Ornament";
import { EventWindow, type GameEvent } from "./EventWindow";

type Dossier = "schreibtisch" | "wirtschaft" | "netz" | "entscheidungen" | "gespraech" | null;
type MapMode = "gelaende" | "regionen" | "wahl" | "wirtschaft" | "arbeitslosigkeit" | "probleme" | "netz";

const SPEEDS = [0, 700, 200, 40];

/** Beschriftungen wie in einem Atlas: Meere und Nachbarländer. */
const GEO_LABELS: { text: string; lon: number; lat: number; kind: "meer" | "land" }[] = [
  { text: "Schwarzes Meer", lon: 34.6, lat: 43.1, kind: "meer" },
  { text: "Mittelmeer", lon: 31.0, lat: 34.6, kind: "meer" },
  { text: "Ägäis", lon: 25.0, lat: 38.4, kind: "meer" },
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
  const [dossier, setDossier] = useState<Dossier>(null);
  const [events, setEvents] = useState<GameEvent[]>(() => [startEvent(initial)]);
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
      const fresh = world.current.log.slice(before).filter((l) => l.kind === "entscheidung");
      if (fresh.length) {
        setSpeed(0);
        setEvents((q) => [
          ...q,
          ...fresh.map((l, i) => ({
            id: `ppk-${l.day}-${i}`,
            scene: "bank" as const,
            date: formatDateDe(l.date),
            title: "Geldpolitischer Ausschuss",
            text: <p>{l.text}</p>,
            why: l.why,
            actions: [
              { label: "Zur Kenntnis genommen", primary: true },
              { label: "Wirtschaftsakte öffnen", run: () => setDossier("wirtschaft") },
            ],
          })),
        ]);
      }
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
    if (mapMode === "regionen") {
      PROVINZEN.forEach((p) => (out[p.plaka] = REGION_COLORS[p.region] ?? "#999"));
      return out;
    }
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
    { id: "gelaende", label: "Politisch", icon: "berg" },
    { id: "regionen", label: "Regionen", icon: "netz" },
    { id: "wahl", label: "Wahl 2028", icon: "urne" },
    { id: "wirtschaft", label: "Wirtschaftskraft", icon: "fabrik" },
    { id: "arbeitslosigkeit", label: "Arbeitslosigkeit", icon: "koffer" },
    { id: "probleme", label: "Akute Probleme", icon: "warnung" },
  ];

  const dossiers: { id: Exclude<Dossier, null>; label: string; icon: IconName }[] = [
    { id: "schreibtisch", label: "Schreibtisch", icon: "feder" },
    { id: "gespraech", label: "Gespräch", icon: "feder" },
    { id: "wirtschaft", label: "Wirtschaftsakte", icon: "akte" },
    { id: "netz", label: "Politiknetz", icon: "netz" },
    { id: "entscheidungen", label: "Entscheidungen", icon: "siegel" },
  ];

  return (
    <div className="stage">
      <AtlasMap
        className="stage-map"
        fill={fill}
        fillAlpha={mapMode === "wahl" ? 0.56 : 0.62}
        selected={selected}
        labels={METROS}
        geoLabels={GEO_LABELS}
        onSelect={(p) => setSelected(p)}
      />

      <header className="hud">
        <div className="hud-bar" />
        <div className="hud-left">
          <div className="leader">
            <Cameo seed={w.player?.name ?? "Staatspräsident"} size={60} tint={w.player?.partei.farbe} ring="keiner" />
            <img className="leader-frame" src="/ui/rahmen-portraet.png" alt="" />
          </div>
          <div className="leader-text">
            <div className="hud-name">{w.player?.name ?? "Staatspräsident"}</div>
            <div className="hud-sub">
              <span className="party-dot" style={{ background: w.player?.partei.farbe }} /> {w.player?.partei.name ?? "Staatsräson"} · Staatsoberhaupt
            </div>
          </div>
        </div>
        <div className="hud-center">
          <div className="date-plate">
            <span className="date-day">{formatDateDe(w.date)}</span>
            <div className="speeds" role="group" aria-label="Spieltempo">
              {[0, 1, 2, 3].map((i) => (
                <button key={i} className={i === speed ? "on" : ""} onClick={() => setSpeed(i)} aria-label={i === 0 ? "Pause" : `Tempo ${i}`}>
                  {i === 0 ? <span className="pause-glyph" /> : Array.from({ length: i }, (_, k) => <span key={k} className="play-glyph" />)}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="hud-right">
          <Stat
            icon="preis"
            label="Inflation"
            value={`${inflation.toLocaleString("de-DE", { maximumFractionDigits: 1 })} %`}
            trend={trend(w, "inflation")}
            tip="Preisanstieg zum Vorjahresmonat, veröffentlicht vom Statistikamt mit einigen Wochen Verzögerung."
          />
          <Stat
            icon="lira"
            label="Lira je $"
            value={w.economy.usdTry.toLocaleString("de-DE", { maximumFractionDigits: 1 })}
            trend={trend(w, "usdTry")}
            tip="Wechselkurs am Markt, täglich. Steigt er, werden Importe wie Energie teurer."
          />
          <Stat icon="bank" label="Leitzins" value={`${w.economy.policyRate.toLocaleString("de-DE")} %`} trend={trend(w, "policyRate")} tip="Setzt der Geldpolitische Ausschuss der Zentralbank, achtmal im Jahr." />
          <Stat
            icon="parlament"
            label="Sitze"
            value={`${bloc} / 600`}
            warn={bloc < 301}
            tip={`Dein Lager im Parlament. Gesetze brauchen 301 Stimmen, eine Verfassungsänderung ohne Volksabstimmung 400, mit Volksabstimmung 360.`}
          />
          <Stat icon="haende" label="Vertrauen" value={`${Math.round(trust)}`} tip="Vertrauen in die Regierung, Mittel über alle Provinzen (0 bis 100)." />
        </div>
      </header>

      <Alerts world={w} bloc={bloc} onProblems={() => setMapMode("probleme")} onDesk={() => setDossier("schreibtisch")} />

      <nav className="dossier-menu" aria-label="Akten">
        {dossiers.map((d) => (
          <button key={d.id} className={dossier === d.id ? "on" : ""} onClick={() => setDossier(dossier === d.id ? null : d.id)} aria-label={d.label}>
            <Icon name={d.icon} />
            <span className="menu-label">{d.label}</span>
          </button>
        ))}
      </nav>

      {dossier && (
        <section className={`dossier frame${dossier === "netz" ? " full" : dossier === "wirtschaft" || dossier === "entscheidungen" ? " wide" : ""}`} aria-label={dossiers.find((d) => d.id === dossier)?.label}>
          <Corners />
          <header className="dossier-head">
            <h2>{dossiers.find((d) => d.id === dossier)?.label}</h2>
            <button className="close" onClick={() => setDossier(null)} aria-label="Schließen">
              ✕
            </button>
          </header>
          <div className="dossier-body">
            {dossier === "schreibtisch" && <Desk world={w} onOpen={(v) => setDossier(v === "karte" ? null : (v as Dossier))} />}
            {dossier === "gespraech" && <Chat world={w} refresh={refresh} />}
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

      <nav className="mapmodes" aria-label="Kartenebenen">
        <div className="mapmode-buttons">
          {modes.map((m) => (
            <button key={m.id} className={mapMode === m.id ? "on" : ""} onClick={() => setMapMode(m.id)} title={m.label} aria-pressed={mapMode === m.id}>
              <Icon name={m.icon} />
            </button>
          ))}
        </div>
        <div className="mapmode-caption">
          <span className="mapmode-kicker">Kartenebene</span>
          <span className="mapmode-name">
            {mapMode === "netz" ? NET.nodes[NET.index.get(netNode)!]!.name : modes.find((m) => m.id === mapMode)?.label}
          </span>
        </div>
      </nav>

      {mapMode === "wahl" && w.parliament && w.player ? (
        <aside className="cartouche legend" aria-label="Legende Wahl 2028">
          <div className="cartouche-title small">Wahl 2028</div>
          <div className="cartouche-sub">stärkste Partei je Provinz</div>
          <ul>
            {Object.entries(w.parliament.seats)
              .filter(([, n]) => n > 0)
              .sort((a, b) => b[1] - a[1])
              .map(([k, n]) => (
                <li key={k}>
                  <span className="swatch" style={{ background: k === w.player!.partei.kurz ? w.player!.partei.farbe : (PARTY_COLORS[k] ?? "#999") }} />
                  <span>{k === w.player!.partei.kurz ? w.player!.partei.name : k}</span>
                  <strong>{n}</strong>
                </li>
              ))}
          </ul>
        </aside>
      ) : (
        <div className="cartouche" aria-hidden>
          <div className="cartouche-title" lang="tr">Türkiye</div>
          <div className="cartouche-sub">81 Provinzen · Stand {w.date.slice(0, 4)}</div>
        </div>
      )}
      <img className="compass" src="/ui/kompass.png" alt="" />

      {selected && <ProvinceCard world={w} plaka={selected} onClose={() => setSelected(undefined)} />}

      {events[0] && (
        <EventWindow
          key={events[0].id}
          event={events[0]}
          onClose={() => setEvents((q) => q.slice(1))}
        />
      )}
    </div>
  );
}

function Stat({ icon, label, value, warn, trend: t, tip }: { icon: IconName; label: string; value: string; warn?: boolean; trend?: number; tip: string }) {
  return (
    <div className={`stat${warn ? " warn" : ""}`} tabIndex={0}>
      <Icon name={icon} />
      <div>
        <div className="stat-value">
          {value}
          {t !== undefined && Math.abs(t) > 0.05 && (
            <span className={`trend ${t > 0 ? "up" : "down"}`} aria-hidden>
              {t > 0 ? "▲" : "▼"} {Math.abs(t).toLocaleString("de-DE", { maximumFractionDigits: 1 })}
            </span>
          )}
        </div>
        <div className="stat-label">{label}</div>
      </div>
      <div className="tip" role="tooltip">
        <strong>{label}</strong>
        <p>{tip}</p>
        {t !== undefined && Math.abs(t) > 0.05 && (
          <p className="tip-trend">
            {t > 0 ? "Gestiegen" : "Gesunken"} seit dem Vormonat um {Math.abs(t).toLocaleString("de-DE", { maximumFractionDigits: 1 })}
          </p>
        )}
      </div>
    </div>
  );
}

/** Veränderung zum Vormonat aus der Monatsgeschichte. */
function trend(w: World, key: "inflation" | "usdTry" | "policyRate"): number | undefined {
  const h = w.history;
  if (h.length < 2) return undefined;
  if (key === "inflation") return h[h.length - 1]!.inflation - h[h.length - 2]!.inflation;
  const before = h[h.length - 1]![key];
  if (before === undefined) return undefined;
  return (key === "usdTry" ? w.economy.usdTry : w.economy.policyRate) - before;
}

/** Hinweise unter der Kopfleiste, wie die Warnsymbole in Hearts of Iron. */
function Alerts({ world, bloc, onProblems, onDesk }: { world: World; bloc: number; onProblems: () => void; onDesk: () => void }) {
  const items: { id: string; tone: "rot" | "gelb" | "blau"; icon: IconName; label: string; text: string; count?: number; onClick?: () => void }[] = [];

  const problems = NET.nodes.filter((n) => n.kind === "problem");
  const perProblem = problems
    .map((n) => {
      let c = 0;
      for (let p = 0; p < PROVINCES; p++) if (world.net.values[NET.index.get(n.id)! * PROVINCES + p]! >= n.threshold!) c++;
      return { name: n.name, c };
    })
    .filter((x) => x.c > 0)
    .sort((a, b) => b.c - a.c);
  if (perProblem.length) {
    items.push({
      id: "probleme",
      tone: "rot",
      icon: "warnung",
      label: "Akute Probleme",
      count: perProblem.length,
      text: perProblem.slice(0, 4).map((x) => `${x.name} in ${x.c} ${x.c === 1 ? "Provinz" : "Provinzen"}`).join(" · "),
      onClick: onProblems,
    });
  }

  const promises = world.log.filter((l) => l.text.startsWith("Offene Zusage"));
  if (promises.length) {
    items.push({
      id: "zusagen",
      tone: "gelb",
      icon: "haende",
      label: "Offene Zusagen",
      count: promises.length,
      text: promises.map((l) => l.text.replace("Offene Zusage aus dem Wahlkampf: ", "")).join(" · "),
      onClick: onDesk,
    });
  }

  if (bloc < 301) {
    items.push({ id: "mehrheit", tone: "rot", icon: "parlament", label: "Keine Mehrheit", text: `Für Gesetze fehlen ${301 - bloc} Stimmen.` });
  }

  const next = world.ppkDays.find((d) => d >= world.day);
  if (next !== undefined && next - world.day <= 10) {
    const days = next - world.day;
    items.push({
      id: "ppk",
      tone: "blau",
      icon: "bank",
      label: "Zinssitzung",
      text: days === 0 ? "Der Geldpolitische Ausschuss tagt heute." : `Der Geldpolitische Ausschuss tagt in ${days} ${days === 1 ? "Tag" : "Tagen"}.`,
    });
  }

  if (!items.length) return null;
  return (
    <div className="alerts" aria-label="Hinweise">
      {items.map((a) => (
        <button key={`${a.id}-${a.count ?? 0}`} className={`alert tone-${a.tone}`} onClick={a.onClick} aria-label={`${a.label}: ${a.text}`}>
          <Icon name={a.icon} size={20} />
          {a.count !== undefined && <span className="alert-count">{a.count}</span>}
          <span className="tip" role="tooltip">
            <strong>{a.label}</strong>
            <p>{a.text}</p>
          </span>
        </button>
      ))}
    </div>
  );
}

function startEvent(w: World): GameEvent {
  const p = w.player;
  const own = p?.partei.kurz;
  const seats = own ? (w.parliament?.seats[own] ?? 0) : 0;
  const ally = p?.buendnis ? (w.parliament?.seats[p.buendnis] ?? 0) : 0;
  return {
    id: "amtsuebergabe",
    scene: "parlament",
    date: formatDateDe(w.date),
    title: "Amtsübergabe in Ankara",
    text: (
      <>
        <p>
          Um neun Uhr legt {p?.name ?? "das neue Staatsoberhaupt"} im Parlament den Amtseid ab. Die {p?.partei.name ?? "eigene Partei"} stellt{" "}
          {seats} der 600 Abgeordneten{p?.buendnis && ally > 0 ? `, zusammen mit ${p.buendnis} sind es ${seats + ally}` : ""}.
        </p>
        <p>
          Auf dem Schreibtisch liegen das Morgenbriefing, die Wirtschaftsakte und die Zusagen aus dem Wahlkampf. Die Inflation liegt bei{" "}
          {w.published.inflation.value.toLocaleString("de-DE", { maximumFractionDigits: 1 })} %.
        </p>
      </>
    ),
    why: "Die Wirtschaftsdaten stammen vom 25. September 2026. Die Wahl 2028 ist erfunden, das Land und seine Regeln sind echt.",
    actions: [{ label: "An die Arbeit", primary: true }],
  };
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
    <aside className="province-card-float frame">
      <Corners />
      <header className="dossier-head">
        <h2>{d.name}</h2>
        <button className="close" onClick={onClose} aria-label="Schließen">
          ✕
        </button>
      </header>
      <div className="province-body">
      <p className="kicker">Provinz Nr. {plaka} · {d.region}</p>
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
        <dd>{d.sitze}</dd>
      </dl>
      {seats && (
        <ul className="province-seats">
          {Object.entries(seats)
            .filter(([, n]) => n > 0)
            .sort((a, b) => b[1] - a[1])
            .map(([k, n]) => (
              <li key={k}>
                <span className="dot" style={{ background: k === own?.kurz ? own.farbe : (PARTY_COLORS[k] ?? "#999") }} />
                <span className="party">{k === own?.kurz ? own.name : k}</span>
                <span className="n">{n}</span>
              </li>
            ))}
        </ul>
      )}
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
      </div>
    </aside>
  );
}
