import { useEffect, useRef, useState } from "react";
import { createAtlas, loadKuestenFeld, loadRelief, lonLatToUv, type AtlasScene, type Relief } from "./scene";
import { VectorLayer, type BezirkInfo } from "./vector";
import { PROVINZEN } from "../../sim/regional";
import { PARTY_COLORS } from "../Parliament";
import { PROVINCE_FC, provinceCenters } from "./overlay";
import { Icon } from "../icons";
import { Flagge } from "../art/Flaggen";
import "./karte.css";
import type { Kartenebene } from "../ebenen";

export interface KartenOrt {
  id: string;
  lon: number;
  lat: number;
  art: "erbe" | "wunder" | "bau";
  text: string;
  /** Zustand 0 bis 100 (Stätten) */
  zustand?: number;
  /** Ab dieser Kamerahöhe (größere Zahl = weiter weg) wird die Marke ausgeblendet */
  dmax?: number;
}

export interface AtlasMapProps {
  fill?: Record<number, string>;
  fillAlpha?: number;
  selected?: number;
  onSelect?: (plaka: number) => void;
  /** Farben der Länder nach ISO-Kürzel (Ebene „Beziehungen“) */
  laenderFarben?: Record<string, string>;
  /** Tippen auf ein Land außerhalb der Türkei, in jeder Ebene; `pos` ist die Bildschirmposition (Fensterkoordinaten) des Tippens */
  onLand?: (iso: string, pos?: { x: number; y: number }) => void;
  /** Land unter dem Zeiger (ISO-Kürzel), `undefined` beim Verlassen */
  hoverLand?: (iso: string | undefined) => void;
  /** Land, das dauerhaft hervorgehoben wird (ISO-Kürzel), etwa das angetippte */
  landAuswahl?: string;
  /** Stätten, Wunder und Bauvorhaben mit Länge und Breite */
  orte?: KartenOrt[];
  /** Flaggen der Gesprächspartner an einem Punkt im Land; Tippen ruft `onLand` mit der Kennung `iso` */
  laenderPins?: { id: string; iso: string; lon: number; lat: number; name: string; ton: "gut" | "mittel" | "schlecht" }[];
  onOrt?: (id: string) => void;
  /** Ereignis- und Krisenmarken an Provinzen */
  marken?: { id: string; plaka: number; art: "ereignis" | "frist" | "krise"; text: string }[];
  onMarke?: (id: string) => void;
  onHover?: (plaka: number | undefined) => void;
  /** Welche Provinzen beschriftet werden (Kfz-Kennziffern) */
  labels?: number[];
  /** Freie Beschriftungen wie Meere und Nachbarländer */
  geoLabels?: { text: string; lon: number; lat: number; kind: "meer" | "land" }[];
  className?: string;
  /** Ohne Bedienung, etwa als Hintergrund des Titelbilds */
  interactive?: boolean;
  /** Kamera fährt weich an diese Stelle */
  camera?: { lon: number; lat: number; d: number };
  /** Langsames Schweben der Kamera */
  drift?: boolean;
  /** Welche Kartenebene gezeigt wird (bestimmt Straßen, Bezirke, Einrichtungen) */
  ebene?: Kartenebene;
}

const NAMES: Record<number, string> = Object.fromEntries(PROVINCE_FC.features.map((f) => [f.properties.plaka, f.properties.name]));

/** Stadtfigur je Provinz: Hauptstadt, Metropole ab 2,5 Mio. Einwohnern, sonst Stadt. */
function cityKind(plaka: number): "hauptstadt" | "metropole" | "stadt" {
  if (plaka === 6) return "hauptstadt";
  return (PROVINZEN[plaka - 1]?.bevoelkerung ?? 0) >= 2_500_000 ? "metropole" : "stadt";
}

interface Ctx {
  atlas: AtlasScene;
  relief: Relief;
  vector: VectorLayer;
  centers: Record<number, [number, number]>;
}

const MIN_D = 2.4;
const MAX_D = 20;

export function AtlasMap({
  fill,
  fillAlpha,
  selected,
  onSelect,
  laenderFarben,
  onLand,
  hoverLand,
  landAuswahl,
  marken = [],
  onMarke,
  orte = [],
  laenderPins = [],
  onOrt,
  onHover,
  labels = [],
  geoLabels = [],
  className,
  interactive = true,
  camera,
  drift = false,
  ebene = "gelaende",
}: AtlasMapProps) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const vec = useRef<HTMLCanvasElement>(null);
  const labelLayer = useRef<HTMLDivElement>(null);
  const ctx = useRef<Ctx | null>(null);
  const [ready, setReady] = useState(false);
  const [namenDa, setNamenDa] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const [hover, setHover] = useState<number | undefined>(undefined);
  const [landHover, setLandHover] = useState<{ iso: string; name: string } | undefined>(undefined);
  const landHoverRef = useRef<string | undefined>(undefined);
  const [bezirk, setBezirk] = useState<{ info: BezirkInfo; x: number; y: number } | undefined>(undefined);
  const styleRef = useRef({ fill, fillAlpha, hover, selected, ebene });
  const labelsRef = useRef(labels);
  labelsRef.current = labels;
  const view = useRef({ u: 0.5, v: 0.5, d: 13 });
  const flight = useRef<{ u: number; v: number; d: number } | null>(null);
  const driftRef = useRef(drift);
  driftRef.current = drift;
  const drag = useRef<{ x: number; y: number; ground: [number, number]; moved: boolean } | null>(null);
  const hoverRaf = useRef(0);

  // Szene einmalig aufbauen
  useEffect(() => {
    let disposed = false;
    let frame = 0;
    let ro: ResizeObserver | undefined;
    Promise.all([loadRelief(), loadKuestenFeld()])
      .then(([relief, kueste]) => {
        if (disposed || !canvas.current || !wrap.current || !vec.current) return;
        const atlas = createAtlas(canvas.current, relief, kueste);
        const vector = new VectorLayer(vec.current, atlas, relief);
        vector.onDaten = () => {
          vector.markDirty();
          setNamenDa(vector.namenBereit());
        };
        ctx.current = { atlas, relief, vector, centers: provinceCenters(relief) };
        const dpr = Math.min(window.devicePixelRatio, 2);
        const size = () => {
          const r = wrap.current!.getBoundingClientRect();
          atlas.resize(r.width, r.height);
          vector.resize(Math.max(1, r.width), Math.max(1, r.height), dpr);
          const c = view.current;
          const v = atlas.setView(c.u, c.v, c.d);
          view.current = { ...c, u: v.u, v: v.v };
        };
        const [u0, v0] = lonLatToUv(relief, 35.3, 38.6);
        view.current = { u: u0, v: v0, d: 13 };
        size();
        ro = new ResizeObserver(size);
        ro.observe(wrap.current);
        vector.setStyle(styleRef.current);
        // Nur für Prüfskripte in der Entwicklung: Kamera setzen und Bildschirmposition eines Ortes abfragen
        if (import.meta.env.DEV) {
          (window as unknown as { __karte?: unknown }).__karte = {
            setze: (lon: number, lat: number, d: number) => {
              const [u, v] = lonLatToUv(relief, lon, lat);
              flight.current = null;
              const n = atlas.setView(u, v, d);
              view.current = { u: n.u, v: n.v, d };
            },
            /** Zeit für das letzte gezeichnete Bild (Flächen, Namen) in Millisekunden */
            zeiten: () => ({ ...vector.zeiten }),
            /** Zuletzt gesetzte Namen mit Rechtecken und die von der Oberfläche belegten Rechtecke */
            namen: () => ({ gesetzt: vector.gesetzteNamen(), reserviert: vector.reservierteRechtecke() }),
            /** Land und Provinz an einer Bildschirmposition (Fensterkoordinaten), wie beim Tippen */
            trefferBei: (cx: number, cy: number) => {
              const r = wrap.current!.getBoundingClientRect();
              const uv = atlas.pickUv(cx - r.left, cy - r.top);
              if (!uv) return { provinz: undefined, land: undefined };
              const provinz = vector.pickProvince(uv[0], uv[1]);
              return { provinz, land: provinz ? undefined : vector.pickLand(uv[0], uv[1]) };
            },
            bildschirm: (lon: number, lat: number) => {
              const [u, v] = lonLatToUv(relief, lon, lat);
              const p = atlas.project(u, v);
              const r = wrap.current!.getBoundingClientRect();
              return { x: p.x + r.left, y: p.y + r.top, sichtbar: p.sichtbar };
            },
          };
        }
        const t0 = performance.now();
        const loop = () => {
          const t = (performance.now() - t0) / 1000;
          const f = flight.current;
          const cur = view.current;
          let changed = false;
          if (f) {
            const k = 0.05;
            cur.u += (f.u - cur.u) * k;
            cur.v += (f.v - cur.v) * k;
            cur.d += (f.d - cur.d) * k;
            if (Math.abs(f.u - cur.u) + Math.abs(f.v - cur.v) + Math.abs(f.d - cur.d) / 20 < 0.0004) flight.current = null;
            changed = true;
          }
          if (changed || driftRef.current) {
            const sway = driftRef.current ? [Math.sin(t * 0.05) * 0.035, Math.cos(t * 0.037) * 0.02] : [0, 0];
            const v = atlas.setView(cur.u + sway[0]!, cur.v + sway[1]!, cur.d);
            if (!driftRef.current) {
              cur.u = v.u;
              cur.v = v.v;
            }
          }
          atlas.render(t);
          vector.draw();
          placeLabels();
          frame = requestAnimationFrame(loop);
        };
        loop();
        setReady(true);
      })
      .catch((e) => setFehler(String(e)));
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      ro?.disconnect();
      ctx.current?.atlas.dispose();
      ctx.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Farben, Auswahl und Ebene an die Vektorebene weitergeben
  useEffect(() => {
    styleRef.current = { fill, fillAlpha, hover, selected, ebene };
    ctx.current?.vector.setStyle({ ...(fill ? { fill } : {}), ...(fill === undefined ? { fill: undefined } : {}), ...(laenderFarben ? { laender: laenderFarben } : { laender: undefined as never }), fillAlpha, hover, selected, ebene });
  }, [fill, fillAlpha, hover, selected, ebene, ready, laenderFarben]);

  // Was die Oberfläche schon selbst beschriftet (Stadtschilder), zeichnet die Karte nicht noch einmal;
  // die übergebenen Meeresnamen ersetzt die Karte durch eigene, sobald ihre Namensdaten da sind.
  useEffect(() => {
    ctx.current?.vector.setAusgeblendet(labels.map((p) => NAMES[p] ?? "").filter(Boolean));
  }, [labels, ready]);

  useEffect(() => {
    ctx.current?.vector.setStyle({ landAuswahl });
  }, [landAuswahl, ready]);

  // Kamerafahrt zu einer Stelle
  useEffect(() => {
    const c = ctx.current;
    if (!ready || !c || !camera) return;
    const [u, v] = lonLatToUv(c.relief, camera.lon, camera.lat);
    flight.current = { u, v, d: camera.d };
  }, [ready, camera?.lon, camera?.lat, camera?.d]);

  function placeLabels() {
    const c = ctx.current;
    const layer = labelLayer.current;
    if (!c || !layer) return;
    const rect = layer.getBoundingClientRect();
    // Stadtfiguren erst aus der Nähe, von weitem nur Banner wie Siegpunkte
    layer.classList.toggle("far", view.current.d > 11);
    const belegt: { x: number; y: number; w: number; h: number }[] = [];
    for (const el of Array.from(layer.children) as HTMLElement[]) {
      let center: [number, number] | undefined;
      if (el.dataset.lon) center = lonLatToUv(c.relief, Number(el.dataset.lon), Number(el.dataset.lat));
      else center = c.centers[Number(el.dataset.plaka)];
      if (!center) continue;
      const p = c.atlas.project(center[0], center[1]);
      const scale = el.dataset.plaka ? Math.min(1.5, Math.max(0.62, 11 / view.current.d)) : 1;
      const ort = el.classList.contains("ort");
      if (ort) {
        el.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, -50%)`;
        const dmax = Number(el.dataset.dmax ?? 99);
        const dmin = Number(el.dataset.dmin ?? 0);
        el.style.opacity = p.sichtbar && view.current.d <= dmax && view.current.d >= dmin && p.x > 0 && p.x < rect.width && p.y > 60 && p.y < rect.height ? "1" : "0";
        el.style.pointerEvents = el.style.opacity === "1" ? "auto" : "none";
        if (el.style.opacity === "1") belegt.push({ x: p.x - 15, y: p.y - 15, w: 30, h: 30 });
        continue;
      }
      const marke = el.classList.contains("marke");
      el.style.transform = marke
        ? `translate(${p.x + Number(el.dataset.dx ?? 0)}px, ${p.y - 26 + Number(el.dataset.dy ?? 0)}px) translate(-50%, -100%)`
        : el.dataset.plaka
          ? `translate(${p.x}px, ${p.y}px) translate(-50%, -8px) scale(${scale.toFixed(3)})`
          : `translate(${p.x}px, ${p.y}px) translate(-50%, -50%) scale(${scale.toFixed(3)})`;
      // am Rand ausblenden, damit Namen nicht abgeschnitten werden
      const half = el.offsetWidth / 2 + 12;
      const edge = Math.min(p.x - half, rect.width - p.x - half, p.y - 70, rect.height - p.y - 20);
      el.style.opacity = p.sichtbar ? String(Math.max(0, Math.min(1, edge / 40))) : "0";
      if (p.sichtbar && el.classList.contains("city")) belegt.push({ x: p.x - (el.offsetWidth / 2) * scale - 4, y: p.y - 8 * scale - 4, w: el.offsetWidth * scale + 8, h: el.offsetHeight * scale + 8 });
      else if (p.sichtbar && marke) belegt.push({ x: p.x - 16, y: p.y - 58, w: 32, h: 34 });
    }
    c.vector.setReserviert(belegt);
  }

  function local(e: React.PointerEvent | React.WheelEvent): { x: number; y: number } {
    const r = wrap.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  /** Land unter dem Zeiger: hebt es hervor und meldet es nach außen */
  function setLandzeiger(iso: string | undefined) {
    const c = ctx.current;
    if (!c || landHoverRef.current === iso) return;
    landHoverRef.current = iso;
    c.vector.setStyle({ hoverLand: iso });
    setLandHover(iso ? { iso, name: c.vector.laender().find((l) => l.iso === iso)?.name ?? iso } : undefined);
    hoverLand?.(iso);
  }

  function updateHover(e: React.PointerEvent) {
    const c = ctx.current;
    if (!c) return;
    const { x, y } = local(e);
    const uv = c.atlas.pickUv(x, y);
    if (!uv) {
      setHover(undefined);
      setBezirk(undefined);
      setLandzeiger(undefined);
      c.vector.setStyle({ hoverBezirk: undefined, hoverLand: undefined });
      return;
    }
    const p = c.vector.pickProvince(uv[0], uv[1]);
    if (p !== hover) {
      setHover(p);
      onHover?.(p);
    }
    setLandzeiger(p ? undefined : c.vector.pickLand(uv[0], uv[1]));
    const b = c.vector.pickBezirk(uv[0], uv[1]);
    if (b && (ebene === "infrastruktur" || view.current.d < 7)) {
      c.vector.setStyle({ hoverBezirk: b.index });
      setBezirk({ info: b.info, x, y });
    } else {
      c.vector.setStyle({ hoverBezirk: undefined });
      setBezirk(undefined);
    }
  }

  return (
    <div
      ref={wrap}
      className={`atlas ${interactive ? "" : "passive"} ${hover || landHover ? "karte-zeiger" : ""} ${className ?? ""}`}
      onPointerDown={(e) => {
        const c = ctx.current;
        if (!interactive || !c) return;
        flight.current = null;
        const { x, y } = local(e);
        const g = c.atlas.groundUv(x, y);
        drag.current = g ? { x: e.clientX, y: e.clientY, ground: g, moved: false } : null;
      }}
      onPointerMove={(e) => {
        if (!interactive) return;
        const c = ctx.current;
        const d = drag.current;
        if (c && d && e.buttons === 1) {
          if (Math.abs(e.clientX - d.x) + Math.abs(e.clientY - d.y) > 4) d.moved = true;
          if (!d.moved) return;
          const { x, y } = local(e);
          const g = c.atlas.groundUv(x, y);
          if (!g) return;
          // Die Stelle unter dem Zeiger bleibt unter dem Zeiger: Die Karte wird gegriffen
          const v = view.current;
          const n = c.atlas.setView(v.u + (d.ground[0] - g[0]), v.v + (d.ground[1] - g[1]), v.d);
          view.current = { ...v, u: n.u, v: n.v };
          return;
        }
        if (hoverRaf.current) return;
        const ev = e;
        hoverRaf.current = requestAnimationFrame(() => {
          hoverRaf.current = 0;
          updateHover(ev);
        });
      }}
      onPointerUp={(e) => {
        const c = ctx.current;
        const d = drag.current;
        drag.current = null;
        if (c && d && !d.moved) {
          const { x, y } = local(e);
          const uv = c.atlas.pickUv(x, y);
          const p = uv ? c.vector.pickProvince(uv[0], uv[1]) : undefined;
          if (p) onSelect?.(p);
          else if (uv && onLand) {
            const iso = c.vector.pickLand(uv[0], uv[1]);
            if (iso) onLand(iso, { x: e.clientX, y: e.clientY });
          }
        }
      }}
      onPointerLeave={() => {
        setHover(undefined);
        setBezirk(undefined);
        setLandzeiger(undefined);
        ctx.current?.vector.setStyle({ hoverBezirk: undefined });
        onHover?.(undefined);
      }}
      onWheel={(e) => {
        const c = ctx.current;
        if (!interactive || !c) return;
        flight.current = null;
        const { x, y } = local(e);
        const vor = c.atlas.groundUv(x, y);
        const v = view.current;
        const d = Math.min(MAX_D, Math.max(MIN_D, v.d * Math.exp(Math.max(-0.35, Math.min(0.35, e.deltaY * 0.0022)))));
        let n = c.atlas.setView(v.u, v.v, d);
        // Auf die Stelle unter dem Zeiger zoomen
        const nach = c.atlas.groundUv(x, y);
        if (vor && nach) n = c.atlas.setView(n.u + (vor[0] - nach[0]), n.v + (vor[1] - nach[1]), d);
        view.current = { u: n.u, v: n.v, d };
      }}
    >
      <canvas ref={canvas} className="atlas-canvas" />
      <canvas ref={vec} className="atlas-vector" />
      <div ref={labelLayer} className="atlas-labels" aria-hidden>
        {(namenDa ? [] : geoLabels).map((g) => (
          <span key={g.text} data-lon={g.lon} data-lat={g.lat} className={`atlas-geo ${g.kind}`}>
            {g.text}
          </span>
        ))}
        {orte.map((o) => (
          <button
            key={o.id}
            type="button"
            data-lon={o.lon}
            data-lat={o.lat}
            data-dmax={o.dmax ?? 99}
            className={`ort ort-${o.art}${o.art === "erbe" && o.zustand !== undefined && o.zustand < 40 ? " gefaehrdet" : ""}`}
            title={o.text}
            aria-label={o.text}
            style={o.zustand !== undefined ? ({ "--z": String(Math.round(o.zustand)) } as React.CSSProperties) : undefined}
            onClick={(e) => {
              e.stopPropagation();
              onOrt?.(o.id);
            }}
          >
            <Icon name={o.art === "erbe" ? "kuppel" : o.art === "wunder" ? "tempel" : "kran"} size={o.art === "erbe" ? 12 : 15} />
          </button>
        ))}
        {laenderPins.map((p) => (
          <button
            key={p.id}
            type="button"
            data-lon={p.lon}
            data-lat={p.lat}
            data-dmin="5.5"
            className={`ort ort-land ton-${p.ton}`}
            title={p.name}
            aria-label={`${p.name}: Länderkarte öffnen`}
            onClick={(e) => {
              e.stopPropagation();
              onLand?.(p.iso, { x: e.clientX, y: e.clientY });
            }}
            onPointerUp={(e) => e.stopPropagation()}
          >
            <Flagge id={p.id} breite={28} rund />
          </button>
        ))}
        {marken.map((m, i) => (
          <button key={m.id} data-plaka={m.plaka} data-dx={(i % 3) * 22 - 22} data-dy={-Math.floor(i / 3) * 26} className={`marke marke-${m.art}`} title={m.text} onClick={(e) => { e.stopPropagation(); onMarke?.(m.id); }} onPointerUp={(e) => e.stopPropagation()}>
            <span aria-hidden>{m.art === "krise" ? "!" : m.art === "frist" ? "!" : "●"}</span>
          </button>
        ))}
        {labels.map((p) => {
          const mayor = PROVINZEN[p - 1]?.buergermeister2024 ?? "";
          const kind = cityKind(p);
          return (
            <span key={p} data-plaka={p} className={`city city-${kind}${p === selected ? " selected" : ""}`}>
              <i className="karte-stadtpunkt" aria-hidden />
              <span className="city-banner">
                <i style={{ background: PARTY_COLORS[mayor] ?? "#8a7a64" }} />
                {kind === "hauptstadt" && <b aria-hidden>★</b>}
                {NAMES[p]}
              </span>
            </span>
          );
        })}
      </div>
      {!ready && !fehler && <div className="atlas-loading">Die Karte wird gezeichnet …</div>}
      {fehler && <div className="atlas-loading">Die Karte konnte nicht geladen werden.</div>}
      {bezirk ? (
        <div className="atlas-hover bezirk" style={{ left: bezirk.x + 16, top: bezirk.y + 16 }}>
          <strong>{bezirk.info.name}</strong>
          <span>{NAMES[bezirk.info.plaka]} · {Math.round(bezirk.info.flaeche).toLocaleString("de-DE")} km²</span>
          <span>Straßen: {bezirk.info.dichte.toLocaleString("de-DE", { maximumFractionDigits: 2, minimumFractionDigits: 2 })} km je km²</span>
          <span>{bezirk.info.krankenhaeuser} Krankenhäuser · {bezirk.info.flughaefen} Flughäfen</span>
        </div>
      ) : (
        (hover || landHover) && <div className="atlas-hover">{hover ? NAMES[hover] : landHover!.name}</div>
      )}
    </div>
  );
}
