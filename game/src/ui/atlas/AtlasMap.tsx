import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { createAtlas, loadRelief, lonLatToUv, type AtlasScene, type Relief } from "./scene";
import { drawOverlay, drawPickCanvas, makeCanvas, provinceCenters, PROVINCE_FC, type OverlayStyle } from "./overlay";

export interface AtlasMapProps {
  fill?: Record<number, string>;
  fillAlpha?: number;
  selected?: number;
  onSelect?: (plaka: number) => void;
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
}

const NAMES: Record<number, string> = Object.fromEntries(PROVINCE_FC.features.map((f) => [f.properties.plaka, f.properties.name]));

interface Ctx {
  atlas: AtlasScene;
  relief: Relief;
  overlayCanvas: HTMLCanvasElement;
  pickCanvas: HTMLCanvasElement;
  centers: Record<number, [number, number]>;
}

export function AtlasMap({
  fill,
  fillAlpha,
  selected,
  onSelect,
  onHover,
  labels = [],
  geoLabels = [],
  className,
  interactive = true,
  camera,
  drift = false,
}: AtlasMapProps) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const labelLayer = useRef<HTMLDivElement>(null);
  const ctx = useRef<Ctx | null>(null);
  const [ready, setReady] = useState(false);
  const [hover, setHover] = useState<number | undefined>(undefined);
  const styleRef = useRef<OverlayStyle>({});
  const labelsRef = useRef(labels);
  labelsRef.current = labels;
  // Kamerafahrt: Ziel und Schweben werden in der Zeichenschleife nachgeführt
  const flight = useRef<{ u: number; v: number; d: number } | null>(null);
  const driftRef = useRef(drift);
  driftRef.current = drift;

  // Szene einmalig aufbauen
  useEffect(() => {
    let disposed = false;
    let frame = 0;
    let ro: ResizeObserver | undefined;
    loadRelief().then((relief) => {
      if (disposed || !canvas.current || !wrap.current) return;
      const overlayCanvas = makeCanvas(relief);
      const pickCanvas = makeCanvas(relief);
      drawPickCanvas(pickCanvas, relief);
      drawOverlay(overlayCanvas, relief, styleRef.current);
      const atlas = createAtlas(canvas.current, relief, overlayCanvas);
      atlas.overlay.needsUpdate = true;
      ctx.current = { atlas, relief, overlayCanvas, pickCanvas, centers: provinceCenters(relief) };
      const size = () => {
        const r = wrap.current!.getBoundingClientRect();
        atlas.resize(Math.max(1, r.width), Math.max(1, r.height));
      };
      size();
      ro = new ResizeObserver(size);
      ro.observe(wrap.current);
      const t0 = performance.now();
      const loop = () => {
        const t = (performance.now() - t0) / 1000;
        const f = flight.current;
        if (f) {
          const cur = view.current;
          const k = 0.035;
          cur.u += (f.u - cur.u) * k;
          cur.v += (f.v - cur.v) * k;
          cur.d += (f.d - cur.d) * k;
          if (Math.abs(f.u - cur.u) + Math.abs(f.v - cur.v) + Math.abs(f.d - cur.d) / 20 < 0.0004) flight.current = null;
        }
        if (f || driftRef.current) {
          const sway = driftRef.current ? [Math.sin(t * 0.05) * 0.035, Math.cos(t * 0.037) * 0.02] : [0, 0];
          atlas.setView(view.current.u + sway[0]!, view.current.v + sway[1]!, view.current.d);
        }
        atlas.render(t);
        placeLabels();
        frame = requestAnimationFrame(loop);
      };
      loop();
      setReady(true);
    });
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      ro?.disconnect();
      ctx.current?.atlas.dispose();
      ctx.current = null;
    };
  }, []);

  // Überlagerung neu zeichnen, wenn sich Farben, Auswahl oder Hover ändern
  useEffect(() => {
    styleRef.current = { fill, fillAlpha, hover, selected };
    const c = ctx.current;
    if (!c) return;
    drawOverlay(c.overlayCanvas, c.relief, styleRef.current);
    c.atlas.overlay.needsUpdate = true;
  }, [fill, fillAlpha, hover, selected, ready]);

  function placeLabels() {
    const c = ctx.current;
    const layer = labelLayer.current;
    if (!c || !layer) return;
    const rect = layer.getBoundingClientRect();
    for (const el of Array.from(layer.children) as HTMLElement[]) {
      let center: [number, number] | undefined;
      if (el.dataset.lon) center = lonLatToUv(c.relief, Number(el.dataset.lon), Number(el.dataset.lat));
      else center = c.centers[Number(el.dataset.plaka)];
      if (!center) continue;
      const p = c.atlas.uvToWorld(center[0], center[1]).project(c.atlas.camera);
      const x = ((p.x + 1) / 2) * rect.width;
      const y = ((1 - p.y) / 2) * rect.height;
      el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
      // am Rand ausblenden, damit Namen nicht abgeschnitten werden
      const half = el.offsetWidth / 2 + 12;
      const edge = Math.min(x - half, rect.width - x - half, y - 70, rect.height - y - 20);
      el.style.opacity = String(Math.max(0, Math.min(1, edge / 40)));
    }
  }

  function pick(ev: React.PointerEvent): number | undefined {
    const c = ctx.current;
    if (!c || !canvas.current) return undefined;
    const rect = canvas.current.getBoundingClientRect();
    const ndc = new THREE.Vector2(((ev.clientX - rect.left) / rect.width) * 2 - 1, -((ev.clientY - rect.top) / rect.height) * 2 + 1);
    const ray = new THREE.Raycaster();
    ray.setFromCamera(ndc, c.atlas.camera);
    const hit = ray.intersectObject(c.atlas.terrain)[0];
    if (!hit?.uv) return undefined;
    const x = Math.floor(hit.uv.x * c.pickCanvas.width);
    const y = Math.floor(hit.uv.y * c.pickCanvas.height);
    const px = c.pickCanvas.getContext("2d")!.getImageData(x, y, 1, 1).data;
    return px[3]! > 200 && px[0]! > 0 ? px[0] : undefined;
  }

  // Kamera: ziehen verschiebt, Mausrad zoomt
  const drag = useRef<{ x: number; y: number; u: number; v: number; moved: boolean } | null>(null);
  const view = useRef({ u: 0.5, v: 0.5, d: 13 });

  useEffect(() => {
    const c = ctx.current;
    if (!ready || !c) return;
    const [u, v] = lonLatToUv(c.relief, 35.3, 38.6);
    view.current = { u, v, d: 13 };
    c.atlas.setView(u, v, 13);
  }, [ready]);

  useEffect(() => {
    const c = ctx.current;
    if (!ready || !c || !camera) return;
    const [u, v] = lonLatToUv(c.relief, camera.lon, camera.lat);
    flight.current = { u, v, d: camera.d };
  }, [ready, camera?.lon, camera?.lat, camera?.d]);

  return (
    <div
      ref={wrap}
      className={`atlas ${interactive ? "" : "passive"} ${className ?? ""}`}
      onPointerDown={(e) => {
        if (!interactive) return;
        flight.current = null;
        drag.current = { x: e.clientX, y: e.clientY, u: view.current.u, v: view.current.v, moved: false };
      }}
      onPointerMove={(e) => {
        if (!interactive) return;
        const d = drag.current;
        if (d && e.buttons === 1) {
          const dx = (e.clientX - d.x) / (wrap.current?.clientWidth ?? 1);
          const dy = (e.clientY - d.y) / (wrap.current?.clientHeight ?? 1);
          if (Math.abs(dx) + Math.abs(dy) > 0.004) d.moved = true;
          const k = view.current.d / 20;
          view.current.u = Math.min(0.95, Math.max(0.05, d.u - dx * 1.1 * k));
          view.current.v = Math.min(0.95, Math.max(0.05, d.v - dy * 1.6 * k));
          ctx.current?.atlas.setView(view.current.u, view.current.v, view.current.d);
          return;
        }
        const p = pick(e);
        if (p !== hover) {
          setHover(p);
          onHover?.(p);
        }
      }}
      onPointerUp={(e) => {
        const d = drag.current;
        drag.current = null;
        if (d && !d.moved) {
          const p = pick(e);
          if (p) onSelect?.(p);
        }
      }}
      onPointerLeave={() => {
        setHover(undefined);
        onHover?.(undefined);
      }}
      onWheel={(e) => {
        if (!interactive) return;
        flight.current = null;
        view.current.d = Math.min(20, Math.max(3.5, view.current.d * (e.deltaY > 0 ? 1.08 : 0.92)));
        ctx.current?.atlas.setView(view.current.u, view.current.v, view.current.d);
      }}
    >
      <canvas ref={canvas} className="atlas-canvas" />
      <div ref={labelLayer} className="atlas-labels" aria-hidden>
        {geoLabels.map((g) => (
          <span key={g.text} data-lon={g.lon} data-lat={g.lat} className={`atlas-geo ${g.kind}`}>
            {g.text}
          </span>
        ))}
        {labels.map((p) => (
          <span key={p} data-plaka={p} className={`atlas-label${p === selected ? " selected" : ""}`}>
            {NAMES[p]}
          </span>
        ))}
      </div>
      {!ready && <div className="atlas-loading">Die Karte wird gezeichnet …</div>}
      {hover && <div className="atlas-hover">{NAMES[hover]}</div>}
    </div>
  );
}
