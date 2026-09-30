// Gezeichnete Landschaft der Türkei: echtes Relief, dargestellt wie ein illustrierter Atlas.
//
// Schärfe: Das Höhenmodell (AWS Terrain, Zoom 8, etwa 475 m je Punkt) liegt als Textur auf der Grafikkarte.
// Schattierung, Küstenlinie und Wasser entstehen pro Bildpunkt im Shader; das Gitternetz trägt nur die Silhouette.
// Linien, Grenzen, Flächen und Beschriftung liegen nicht mehr in einem festen Bild, sondern werden in Geräte-Pixeln
// pro Bild gezeichnet (vector.ts) und sind daher bei jedem Zoom scharf.

import * as THREE from "three";

export interface Relief {
  width: number;
  height: number;
  lon0: number;
  lon1: number;
  lat0: number;
  lat1: number;
  data: Int16Array;
  /** Zoomstufe der Quelle (7 alt, 8 neu) */
  zoom?: number;
}

/** Lädt das feinste vorhandene Höhenmodell; fehlt die neue Datei, dient die alte als Rückfall. */
export async function loadRelief(): Promise<Relief> {
  for (const name of ["relief-z8", "relief"]) {
    try {
      const metaRes = await fetch(`/data/${name}.json`);
      if (!metaRes.ok) continue;
      const meta = await metaRes.json();
      if (typeof meta.width !== "number") continue;
      const bin = await fetch(`/data/${name}.bin`);
      if (!bin.ok) continue;
      const buf = await bin.arrayBuffer();
      if (buf.byteLength < meta.width * meta.height * 2) continue;
      return { ...meta, data: new Int16Array(buf) };
    } catch {
      /* nächster Versuch */
    }
  }
  throw new Error("Höhenmodell nicht gefunden");
}

/** Küsten-Distanzfeld (tools/geodaten/karte_daten.py): 8 Bit, 128 = Küste, 5 Stufen je Höhenmodellpunkt, positiv an Land. */
export interface KuestenFeld {
  width: number;
  height: number;
  data: Uint8Array;
}

export async function loadKuestenFeld(): Promise<KuestenFeld | null> {
  try {
    const meta = await fetch("/data/karte/kueste-sdf.json");
    const res = await fetch("/data/karte/kueste-sdf.bin.gz");
    if (!meta.ok || !res.ok) return null;
    const m = (await meta.json()) as { width: number; height: number };
    let buf = await res.arrayBuffer();
    const b = new Uint8Array(buf, 0, 2);
    // Manche Server liefern die Datei schon entpackt aus (Content-Encoding); dann fehlt die gzip-Kennung
    if (b[0] === 0x1f && b[1] === 0x8b) buf = await new Response(new Blob([buf]).stream().pipeThrough(new DecompressionStream("gzip"))).arrayBuffer();
    if (buf.byteLength < m.width * m.height) return null;
    return { width: m.width, height: m.height, data: new Uint8Array(buf, 0, m.width * m.height) };
  } catch {
    return null;
  }
}

const mercY = (lat: number) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));

/** Längen- und Breitengrad in Texturkoordinaten des Reliefs (0–1, v = 0 im Norden). */
export function lonLatToUv(r: Relief, lon: number, lat: number): [number, number] {
  const u = (lon - r.lon0) / (r.lon1 - r.lon0);
  const v = (mercY(r.lat1) - mercY(lat)) / (mercY(r.lat1) - mercY(r.lat0));
  return [u, v];
}

export const WORLD_W = 20;
/** Überhöhung der Silhouette: 5000 m entsprechen 0,8 Einheiten */
export const HEIGHT_SCALE = 0.00016;

export interface AtlasScene {
  renderer: THREE.WebGLRenderer;
  camera: THREE.PerspectiveCamera;
  worldH: number;
  /** Höhe über dem Meer in Metern an einer Stelle (bilinear) */
  elevationAt: (u: number, v: number) => number;
  /** Höhe in Welteinheiten */
  heightAt: (u: number, v: number) => number;
  uvToWorld: (u: number, v: number) => THREE.Vector3;
  resize: (w: number, h: number) => void;
  render: (t: number) => void;
  /** Kamera auf eine Stelle richten; die Sicht wird so verschoben, dass der Kartenrand nicht sichtbar wird */
  setView: (focusU: number, focusV: number, dist: number) => { u: number; v: number };
  /** Bildschirmposition (CSS-Pixel) eines Punktes der Karte; `sichtbar` ist falsch hinter der Kamera */
  project: (u: number, v: number, h?: number) => { x: number; y: number; sichtbar: boolean };
  /** Sichtbarer Ausschnitt der Grundfläche in Texturkoordinaten */
  viewBounds: () => { u0: number; u1: number; v0: number; v1: number };
  /** Karte (u, v) unter einem Bildschirmpunkt auf der Grundfläche (Höhe 0) */
  groundUv: (px: number, py: number) => [number, number] | null;
  /** Karte (u, v) unter einem Bildschirmpunkt auf dem Gelände (mit Höhe) */
  pickUv: (px: number, py: number) => [number, number] | null;
  /** Matrix Welt → Klippraum als 16 Zahlen, für die Vektorebene */
  matrix: () => Float32Array;
  size: () => { w: number; h: number };
  dispose: () => void;
}

const GLSL_NOISE = /* glsl */ `
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float s = 0.0; float a = 0.5;
    for (int i = 0; i < 5; i++) { s += a * noise(p); p *= 2.03; a *= 0.5; }
    return s;
  }
`;

const terrainVertex = /* glsl */ `
  uniform sampler2D elevTex;
  uniform float heightScale;
  varying vec2 vUv;
  varying vec3 vWorld;
  void main() {
    vUv = uv;
    float e = texture2D(elevTex, uv).r;
    vec3 p = position;
    p.y = max(e, 0.0) * heightScale;
    vec4 wp = modelMatrix * vec4(p, 1.0);
    vWorld = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const terrainFragment = /* glsl */ `
  uniform sampler2D elevTex;
  uniform sampler2D sdfTex;
  uniform float hasSdf;
  uniform vec2 texSize;
  uniform float texMeters0; // Meter je Höhenpunkt am Äquator (Mercator)
  uniform vec2 merc;        // Mercator-y der Nord- und Südkante
  uniform float latN;
  uniform float latS;
  uniform vec3 sunDir;
  uniform float time;
  uniform float exag;       // Überhöhung der Schattierung
  uniform vec3 bgColor;
  uniform float fogNear;
  uniform float fogFar;
  varying vec2 vUv;
  varying vec3 vWorld;
  ${GLSL_NOISE}

  float elev(vec2 uv) { return texture2D(elevTex, uv).r; }

  // Gemalte Geländefarben: Feuchte von Norden und Westen, Trockenheit nach Südosten, Fels und Schnee in der Höhe
  vec3 palette(float e, float moist, float slope) {
    vec3 green = vec3(0.33, 0.47, 0.24);
    vec3 plains = vec3(0.58, 0.57, 0.33);
    vec3 steppe = vec3(0.76, 0.68, 0.45);
    vec3 dry = vec3(0.80, 0.68, 0.48);
    vec3 high = vec3(0.62, 0.52, 0.39);
    vec3 rock = vec3(0.52, 0.47, 0.43);
    vec3 snow = vec3(0.95, 0.96, 0.98);
    vec3 low = mix(mix(dry, steppe, smoothstep(0.1, 0.45, moist)), mix(plains, green, smoothstep(0.55, 0.85, moist)), smoothstep(0.35, 0.6, moist));
    vec3 c = low;
    c = mix(c, mix(steppe, plains, moist * 0.6), smoothstep(700.0, 1200.0, e) * (1.0 - moist * 0.5));
    c = mix(c, high, smoothstep(1500.0, 2200.0, e));
    c = mix(c, rock, smoothstep(2300.0, 2900.0, e));
    c = mix(c, rock, smoothstep(0.35, 0.8, slope) * 0.6);
    c = mix(c, snow, smoothstep(3000.0, 3500.0, e));
    return c;
  }

  void main() {
    float e = elev(vUv);

    // Küste aus dem Distanzfeld: Abstand in Höhenmodellpunkten, positiv an Land; ohne Feld gilt die Nulllinie des Höhenmodells
    float sdT = 0.0;
    float aa = 1.0;
    if (hasSdf > 0.5) {
      sdT = (texture2D(sdfTex, vUv).r * 255.0 - 128.0) / 5.0;
      aa = max(fwidth(sdT), 0.02);
      e = sdT > 0.0 ? max(e, 1.5) : min(e, -1.5);
    }

    // Breite an dieser Stelle (Web-Mercator) für den wahren Punktabstand in Metern
    float my = mix(merc.x, merc.y, vUv.y);
    float lat = 2.0 * atan(exp(my)) - 1.5707963;
    float texM = texMeters0 * cos(lat);

    // Bildschirmfläche eines Punktes: Beim Herauszoomen wird über mehrere Punkte geglättet, damit nichts flimmert
    vec2 fw = fwidth(vUv) * texSize;
    float foot = clamp(max(fw.x, fw.y), 1.0, 12.0);
    vec2 px = foot / texSize;

    float eL = elev(vUv - vec2(px.x, 0.0));
    float eR = elev(vUv + vec2(px.x, 0.0));
    float eU = elev(vUv - vec2(0.0, px.y));
    float eD = elev(vUv + vec2(0.0, px.y));
    float dx = (eR - eL) / (2.0 * foot * texM);
    float dz = (eD - eU) / (2.0 * foot * texM);

    // Feines Gelände aus dem Nahbereich: Rauschen, das mit der Steilheit wächst, damit auch stark gezoomtes Gelände Struktur hat
    float steep = clamp(length(vec2(dx, dz)) * 2.2, 0.0, 1.0);
    vec2 wp2 = vWorld.xz;
    float micro1 = fbm(wp2 * 55.0);
    float micro2 = fbm(wp2 * 140.0 + 3.7);
    vec2 pert = vec2(micro1 - 0.5, micro2 - 0.5) * (0.05 + 0.32 * steep);
    vec3 n = normalize(vec3(-(dx + pert.x) * exag, 1.0, -(dz + pert.y) * exag));

    float light = dot(n, normalize(sunDir));
    float shade = smoothstep(-0.25, 1.0, light);

    // Feuchte und Farbe
    float moist = smoothstep(0.52, 0.2, vUv.y) * 0.75 + smoothstep(0.34, 0.12, vUv.x) * 0.35 + (fbm(vUv * 9.0) - 0.5) * 0.35;
    moist = clamp(moist, 0.0, 1.0);
    vec3 land = palette(e, moist, steep);

    // Gemalte Unregelmäßigkeit und Wälder
    float wash = fbm(vUv * 22.0 + 3.1);
    land *= 0.93 + 0.13 * wash;
    float forest = smoothstep(0.55, 0.68, fbm(vUv * 30.0 + 7.0)) * smoothstep(0.35, 0.7, moist) * step(40.0, e) * (1.0 - smoothstep(1700.0, 2100.0, e));
    land = mix(land, vec3(0.19, 0.31, 0.17), forest * 0.65);

    // Kraftvolle, aber ruhige Schattierung; Täler etwas dunkler (Hohlform gegenüber der Umgebung)
    float around = (eL + eR + eU + eD) * 0.25;
    float cavity = clamp((around - e) / 180.0, -1.0, 1.0);
    land *= 0.62 + 0.5 * shade;
    land *= 1.0 - 0.16 * max(0.0, cavity);
    land = mix(land, land * 1.08 + vec3(0.02, 0.018, 0.01), max(0.0, -cavity) * 0.35);

    // Feine Papier- und Pinselstruktur, im Weltmaß, damit sie bei jedem Zoom Körnung behält
    float grain = noise(wp2 * 900.0) * 0.5 + noise(wp2 * 260.0) * 0.5;
    land *= 0.965 + 0.07 * grain;

    // Küste: heller Sandsaum
    float shore = 1.0 - smoothstep(0.0, 22.0, e);
    if (hasSdf > 0.5) shore = exp(-max(sdT, 0.0) / 2.6);
    land = mix(land, vec3(0.83, 0.77, 0.58), shore * 0.5 * step(-1.0, e));
    if (hasSdf > 0.5) land *= 1.0 - 0.13 * exp(-max(sdT, 0.0) / 0.9);

    // Wasser: Tiefe, langsame Wellen, Brandung
    float depth = clamp(-e / 2500.0, 0.0, 1.0);
    vec3 shallow = vec3(0.24, 0.46, 0.52);
    vec3 deep = vec3(0.08, 0.18, 0.28);
    float wv = fbm(vUv * 16.0 + time * 0.006);
    vec3 water = mix(shallow, deep, smoothstep(0.0, 0.5, depth + (wv - 0.5) * 0.12));
    float ripple = fbm(vec2(wp2.x * 130.0 + time * 0.22, wp2.y * 210.0 - time * 0.14));
    water += vec3(0.05, 0.07, 0.08) * smoothstep(0.62, 0.8, ripple) * (1.0 - depth * 0.6);
    float surf = 1.0 - smoothstep(0.0, 40.0, -e);
    float welle = 0.55 + 0.25 * sin(time * 0.8 + vUv.x * 300.0);
    water = mix(water, vec3(0.62, 0.74, 0.74), surf * welle * 0.6 * step(e, 0.0));

    // Meer nahe der Küste: helles Flachwasser und feine Küstenlinien im Abstand, wie in gestochenen Atlanten
    if (hasSdf > 0.5) {
      float seaD = max(-sdT, 0.0);
      water = mix(water, vec3(0.34, 0.58, 0.62), 0.42 * exp(-seaD / 3.4));
      float fein = smoothstep(2.4, 0.5, aa);
      float lin = 0.0;
      for (int k = 1; k <= 4; k++) {
        float fk = float(k);
        lin += (1.0 - smoothstep(0.0, aa * 1.15, abs(seaD - 4.5 * fk))) * (0.22 - 0.045 * fk);
      }
      water = mix(water, vec3(0.86, 0.93, 0.92), lin * fein * step(0.0, -sdT));
    }

    // Küstenlinie pro Bildpunkt: mit Distanzfeld scharf bei jeder Vergrößerung, sonst weicher Übergang um die Nulllinie
    float istLand = hasSdf > 0.5 ? smoothstep(-aa * 0.7, aa * 0.7, sdT) : smoothstep(-2.5, 2.5, e);
    vec3 col = mix(water, land, istLand);
    if (hasSdf > 0.5) {
      float tinte = 1.0 - smoothstep(aa * 0.35, aa * 1.05, abs(sdT));
      col = mix(col, vec3(0.13, 0.085, 0.06), tinte * 0.9);
    }

    // Rand der Karte: sanft ins Dunkle, damit keine harte Kante sichtbar wird
    float rand = smoothstep(0.0, 0.035, min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y)));
    float dist = length(vWorld - cameraPosition);
    float nebel = smoothstep(fogNear, fogFar, dist) * 0.55;
    col = mix(bgColor, col, rand);
    col = mix(col, bgColor, nebel);
    gl_FragColor = vec4(col, 1.0);
  }
`;

export function createAtlas(canvas: HTMLCanvasElement, relief: Relief, kueste?: KuestenFeld | null): AtlasScene {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  const bg = new THREE.Color(0x101b24);
  renderer.setClearColor(bg);
  const scene = new THREE.Scene();

  const worldH = (WORLD_W * relief.height) / relief.width;

  // Höhenmodell als Halbgleitkomma-Textur (Int16 → Half über eine Nachschlagetabelle)
  const lut = new Uint16Array(65536);
  for (let i = 0; i < 65536; i++) lut[i] = THREE.DataUtils.toHalfFloat(i - 32768);
  const half = new Uint16Array(relief.data.length);
  for (let i = 0; i < half.length; i++) half[i] = lut[relief.data[i]! + 32768]!;
  const elevTex = new THREE.DataTexture(half, relief.width, relief.height, THREE.RedFormat, THREE.HalfFloatType);
  elevTex.magFilter = THREE.LinearFilter;
  elevTex.minFilter = THREE.LinearFilter;
  elevTex.generateMipmaps = false;
  elevTex.flipY = false;
  elevTex.unpackAlignment = 2;
  elevTex.wrapS = THREE.ClampToEdgeWrapping;
  elevTex.wrapT = THREE.ClampToEdgeWrapping;
  elevTex.needsUpdate = true;

  let sdfTex: THREE.DataTexture | null = null;
  if (kueste) {
    sdfTex = new THREE.DataTexture(kueste.data, kueste.width, kueste.height, THREE.RedFormat, THREE.UnsignedByteType);
    sdfTex.magFilter = THREE.LinearFilter;
    sdfTex.minFilter = THREE.LinearFilter;
    sdfTex.generateMipmaps = false;
    sdfTex.flipY = false;
    sdfTex.unpackAlignment = 1;
    sdfTex.wrapS = THREE.ClampToEdgeWrapping;
    sdfTex.wrapT = THREE.ClampToEdgeWrapping;
    sdfTex.needsUpdate = true;
  }

  const segX = Math.min(1000, Math.floor(relief.width / 5));
  const segY = Math.round((segX * relief.height) / relief.width);
  const geo = new THREE.PlaneGeometry(WORLD_W, worldH, segX, segY);
  geo.rotateX(-Math.PI / 2);
  // v = 0 im Norden, passend zum Relief und zu den Zeichenkoordinaten
  const uv = geo.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setY(i, 1 - uv.getY(i));

  const sunDir = new THREE.Vector3(-0.62, 0.72, -0.42);
  const uniforms = {
    elevTex: { value: elevTex },
    sdfTex: { value: sdfTex },
    hasSdf: { value: sdfTex ? 1 : 0 },
    texSize: { value: new THREE.Vector2(relief.width, relief.height) },
    texMeters0: { value: (((relief.lon1 - relief.lon0) * Math.PI) / 180 * 6378137) / relief.width },
    merc: { value: new THREE.Vector2(mercY(relief.lat1), mercY(relief.lat0)) },
    latN: { value: relief.lat1 },
    latS: { value: relief.lat0 },
    heightScale: { value: HEIGHT_SCALE },
    sunDir: { value: sunDir },
    time: { value: 0 },
    exag: { value: relief.zoom && relief.zoom >= 8 ? 2.4 : 2.0 },
    bgColor: { value: bg },
    fogNear: { value: 16 },
    fogFar: { value: 46 },
  };
  const material = new THREE.ShaderMaterial({ vertexShader: terrainVertex, fragmentShader: terrainFragment, uniforms });
  const terrain = new THREE.Mesh(geo, material);
  terrain.frustumCulled = false;
  scene.add(terrain);

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 120);
  const target = new THREE.Vector3(0, 0, 0);
  let dist = 13;
  let cssW = 1;
  let cssH = 1;

  function placeCamera() {
    camera.position.set(target.x, target.y + dist * 0.88, target.z + dist * 0.47);
    camera.lookAt(target);
    camera.updateMatrixWorld(true);
    uniforms.fogNear.value = dist * 1.05;
    uniforms.fogFar.value = dist * 3.4;
  }
  placeCamera();

  const W = relief.width;
  const H = relief.height;
  const data = relief.data;
  function elevationAt(u: number, v: number): number {
    const x = Math.min(W - 1.001, Math.max(0, u * (W - 1)));
    const y = Math.min(H - 1.001, Math.max(0, v * (H - 1)));
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const fx = x - x0;
    const fy = y - y0;
    const i = y0 * W + x0;
    const a = data[i]!;
    const b = data[i + 1]!;
    const c = data[i + W]!;
    const d = data[i + W + 1]!;
    return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy;
  }
  const heightAt = (u: number, v: number) => Math.max(0, elevationAt(u, v)) * HEIGHT_SCALE;
  const uvToWorld = (u: number, v: number) => new THREE.Vector3((u - 0.5) * WORLD_W, heightAt(u, v), (v - 0.5) * worldH);

  const rayCaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const hit = new THREE.Vector3();

  function groundUv(px: number, py: number): [number, number] | null {
    ndc.set((px / cssW) * 2 - 1, -(py / cssH) * 2 + 1);
    rayCaster.setFromCamera(ndc, camera);
    if (!rayCaster.ray.intersectPlane(plane, hit)) return null;
    return [hit.x / WORLD_W + 0.5, hit.z / worldH + 0.5];
  }

  function pickUv(px: number, py: number): [number, number] | null {
    ndc.set((px / cssW) * 2 - 1, -(py / cssH) * 2 + 1);
    rayCaster.setFromCamera(ndc, camera);
    const o = rayCaster.ray.origin;
    const d = rayCaster.ray.direction;
    // Strahl in Schritten bis zum Gelände verfolgen, dann verfeinern
    const maxT = 80;
    const step = 0.06;
    let t = 0;
    let prevT = 0;
    for (; t < maxT; t += step) {
      const x = o.x + d.x * t;
      const y = o.y + d.y * t;
      const z = o.z + d.z * t;
      const u = x / WORLD_W + 0.5;
      const v = z / worldH + 0.5;
      if (u < 0 || u > 1 || v < 0 || v > 1) {
        prevT = t;
        continue;
      }
      if (y <= heightAt(u, v)) {
        let lo = prevT;
        let hi = t;
        for (let k = 0; k < 8; k++) {
          const mid = (lo + hi) / 2;
          const um = (o.x + d.x * mid) / WORLD_W + 0.5;
          const vm = (o.z + d.z * mid) / worldH + 0.5;
          if (o.y + d.y * mid <= heightAt(um, vm)) hi = mid;
          else lo = mid;
        }
        return [(o.x + d.x * hi) / WORLD_W + 0.5, (o.z + d.z * hi) / worldH + 0.5];
      }
      prevT = t;
    }
    return null;
  }

  function viewBounds() {
    let u0 = 1;
    let u1 = 0;
    let v0 = 1;
    let v1 = 0;
    const pts: [number, number][] = [[0, 0], [cssW, 0], [0, cssH], [cssW, cssH], [cssW / 2, 0], [cssW / 2, cssH]];
    for (const [x, y] of pts) {
      const g = groundUv(x, y);
      if (!g) continue;
      u0 = Math.min(u0, g[0]);
      u1 = Math.max(u1, g[0]);
      v0 = Math.min(v0, g[1]);
      v1 = Math.max(v1, g[1]);
    }
    // Gelände hebt die Ränder etwas an: Rand großzügig ansetzen
    const rand = 0.04;
    return { u0: u0 - rand, u1: u1 + rand, v0: v0 - rand, v1: v1 + rand };
  }

  const vp = new THREE.Matrix4();
  const out = new THREE.Vector3();
  function project(u: number, v: number, h?: number) {
    out.set((u - 0.5) * WORLD_W, h ?? heightAt(u, v), (v - 0.5) * worldH).project(camera);
    // hinter der Kamera liefert project() eine z-Koordinate über 1
    return { x: ((out.x + 1) / 2) * cssW, y: ((1 - out.y) / 2) * cssH, sichtbar: out.z < 1 && out.z > -1 };
  }

  return {
    renderer,
    camera,
    worldH,
    elevationAt,
    heightAt,
    uvToWorld,
    resize(w, h) {
      cssW = Math.max(1, w);
      cssH = Math.max(1, h);
      renderer.setSize(cssW, cssH, false);
      camera.aspect = cssW / cssH;
      camera.updateProjectionMatrix();
    },
    render(t) {
      uniforms.time.value = t;
      renderer.render(scene, camera);
    },
    setView(focusU, focusV, d) {
      dist = d;
      let u = focusU;
      let v = focusV;
      // Zweimal nachführen: Der Rand darf nicht sichtbar werden
      for (let k = 0; k < 3; k++) {
        target.set((u - 0.5) * WORLD_W, 0, (v - 0.5) * worldH);
        placeCamera();
        const b = viewBounds();
        let du = 0;
        let dv = 0;
        if (b.u1 - b.u0 >= 1) du = 0.5 - (b.u0 + b.u1) / 2;
        else if (b.u0 < 0) du = -b.u0;
        else if (b.u1 > 1) du = 1 - b.u1;
        if (b.v1 - b.v0 >= 1) dv = 0.5 - (b.v0 + b.v1) / 2;
        else if (b.v0 < 0) dv = -b.v0;
        else if (b.v1 > 1) dv = 1 - b.v1;
        if (Math.abs(du) < 1e-4 && Math.abs(dv) < 1e-4) break;
        u += du;
        v += dv;
      }
      target.set((u - 0.5) * WORLD_W, 0, (v - 0.5) * worldH);
      placeCamera();
      return { u, v };
    },
    project,
    viewBounds,
    groundUv,
    pickUv,
    matrix() {
      vp.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
      return Float32Array.from(vp.elements);
    },
    size: () => ({ w: cssW, h: cssH }),
    dispose() {
      geo.dispose();
      material.dispose();
      elevTex.dispose();
      sdfTex?.dispose();
      renderer.dispose();
    },
  };
}
