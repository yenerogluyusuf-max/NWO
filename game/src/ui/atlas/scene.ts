// Gezeichnete Landschaft der Türkei: echtes Relief, dargestellt wie ein
// illustrierter Atlas (Aquarellflächen, Tintenlinien, Schraffur, Papier).

import * as THREE from "three";

export interface Relief {
  width: number;
  height: number;
  lon0: number;
  lon1: number;
  lat0: number;
  lat1: number;
  data: Int16Array;
}

export async function loadRelief(): Promise<Relief> {
  const [meta, buf] = await Promise.all([
    fetch("/data/relief.json").then((r) => r.json()),
    fetch("/data/relief.bin").then((r) => r.arrayBuffer()),
  ]);
  return { ...meta, data: new Int16Array(buf) };
}

const mercY = (lat: number) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));

/** Längen- und Breitengrad in Texturkoordinaten des Reliefs (0–1, v = 0 im Norden). */
export function lonLatToUv(r: Relief, lon: number, lat: number): [number, number] {
  const u = (lon - r.lon0) / (r.lon1 - r.lon0);
  const v = (mercY(r.lat1) - mercY(lat)) / (mercY(r.lat1) - mercY(r.lat0));
  return [u, v];
}

export const WORLD_W = 20;
const HEIGHT_SCALE = 0.00016; // Überhöhung: 5000 m ≈ 0,8 Einheiten

export interface AtlasScene {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  terrain: THREE.Mesh;
  overlay: THREE.CanvasTexture;
  fills: THREE.CanvasTexture;
  /** Stärke der politischen Flächen, 0 bis 1 */
  setPolitical: (x: number) => void;
  worldH: number;
  heightAt: (u: number, v: number) => number;
  uvToWorld: (u: number, v: number) => THREE.Vector3;
  dispose: () => void;
  resize: (w: number, h: number) => void;
  render: (t: number) => void;
  setView: (focusU: number, focusV: number, dist: number) => void;
}

const paperNoise = /* glsl */ `
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
  attribute float elev;
  varying float vElev;
  varying vec3 vNormal;
  varying vec2 vUv;
  varying vec3 vWorld;
  void main() {
    vElev = elev;
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorld = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const terrainFragment = /* glsl */ `
  uniform sampler2D overlay;
  uniform sampler2D fills;
  uniform float political;
  uniform vec3 sunDir;
  varying float vElev;
  varying vec3 vNormal;
  varying vec2 vUv;
  varying vec3 vWorld;
  ${paperNoise}

  // Gemalte Geländefarben wie auf einer Strategiekarte: Feuchte von Norden und Westen,
  // Trockenheit nach Südosten, Fels und Schnee in der Höhe
  vec3 palette(float e, float moist) {
    vec3 green = vec3(0.30, 0.44, 0.22);
    vec3 plains = vec3(0.53, 0.54, 0.31);
    vec3 steppe = vec3(0.70, 0.63, 0.42);
    vec3 dry = vec3(0.74, 0.62, 0.44);
    vec3 high = vec3(0.56, 0.47, 0.35);
    vec3 rock = vec3(0.47, 0.43, 0.40);
    vec3 snow = vec3(0.93, 0.94, 0.96);
    float n = (fbm(vUv * 40.0) - 0.5) * 160.0;
    float h = e + n;
    vec3 low = mix(mix(dry, steppe, smoothstep(0.1, 0.45, moist)), mix(plains, green, smoothstep(0.55, 0.85, moist)), smoothstep(0.35, 0.6, moist));
    vec3 c = low;
    c = mix(c, mix(steppe, plains, moist * 0.6), smoothstep(700.0, 1200.0, h) * (1.0 - moist * 0.5));
    c = mix(c, high, smoothstep(1500.0, 2200.0, h));
    c = mix(c, rock, smoothstep(2300.0, 2900.0, h));
    c = mix(c, snow, smoothstep(3000.0, 3500.0, h));
    return c;
  }

  void main() {
    vec3 n = normalize(vNormal);
    float light = dot(n, normalize(sunDir));

    // Feuchte: Schwarzmeerküste und Ägäis grün, Südosten trocken
    float moist = smoothstep(0.52, 0.2, vUv.y) * 0.75 + smoothstep(0.34, 0.12, vUv.x) * 0.35 + (fbm(vUv * 9.0) - 0.5) * 0.35;
    moist = clamp(moist, 0.0, 1.0);
    vec3 base = palette(vElev, moist);

    // Gemalte Unregelmäßigkeit in der Fläche
    float wash = fbm(vUv * 22.0 + 3.1);
    base *= 0.92 + 0.14 * wash;

    // Wälder als dunkle, weiche Flecken in feuchten Lagen
    float forest = smoothstep(0.55, 0.68, fbm(vUv * 30.0 + 7.0)) * smoothstep(0.35, 0.7, moist) * step(40.0, vElev) * (1.0 - smoothstep(1700.0, 2100.0, vElev));
    base = mix(base, vec3(0.17, 0.29, 0.15), forest * 0.7);

    // Relief kräftig schattiert
    float shade = smoothstep(-0.3, 1.0, light);
    base *= 0.6 + 0.52 * shade;

    // heller Sandsaum an der Küste
    float shore = 1.0 - smoothstep(0.0, 18.0, vElev);
    base = mix(base, vec3(0.80, 0.74, 0.56), shore * 0.55 * step(-0.5, vElev));

    // Politische Flächen als Lasur, je nach Zoom kräftiger oder schwächer
    vec4 fl = texture2D(fills, vUv);
    float lum = dot(base, vec3(0.299, 0.587, 0.114));
    vec3 glazed = fl.rgb * (0.55 + 0.8 * lum);
    base = mix(base, glazed, fl.a * political);

    // Linien, Flüsse, Grenzen und Auswahl immer voll
    vec4 ov = texture2D(overlay, vUv);
    base = mix(base, ov.rgb, ov.a);

    gl_FragColor = vec4(base, 1.0);
  }
`;

const waterVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const waterFragment = /* glsl */ `
  uniform sampler2D depthMap;
  uniform float time;
  varying vec2 vUv;
  ${paperNoise}
  void main() {
    float d = texture2D(depthMap, vUv).r; // 0 = Land, sonst Tiefe
    if (d < 0.001) discard; // tief liegendes Land nicht mit Wasser überdecken
    vec3 shallow = vec3(0.24, 0.42, 0.47);
    vec3 deep = vec3(0.09, 0.19, 0.27);
    float wash = fbm(vUv * 16.0 + time * 0.008);
    vec3 col = mix(shallow, deep, smoothstep(0.0, 0.5, d + (wash - 0.5) * 0.12));

    // feine, langsam ziehende Wellen
    float ripple = fbm(vec2(vUv.x * 260.0 + time * 0.25, vUv.y * 420.0 - time * 0.15));
    col += vec3(0.05, 0.07, 0.08) * smoothstep(0.62, 0.8, ripple);

    // Brandung: heller Saum direkt an der Küste
    float surf = (1.0 - smoothstep(0.0, 0.035, d)) * step(0.002, d);
    col = mix(col, vec3(0.55, 0.68, 0.70), surf * (0.55 + 0.25 * sin(time * 0.8 + vUv.x * 300.0)));

    gl_FragColor = vec4(col, 1.0);
  }
`;

/** Kastenfilter in zwei Durchgängen, Meer bleibt Meer. */
function blur(src: Int16Array, w: number, h: number, r: number): Float32Array {
  const tmp = new Float32Array(src.length);
  const out = new Float32Array(src.length);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let s = 0;
      let n = 0;
      for (let k = -r; k <= r; k++) {
        const xx = Math.min(w - 1, Math.max(0, x + k));
        s += src[y * w + xx]!;
        n++;
      }
      tmp[y * w + x] = s / n;
    }
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let s = 0;
      let n = 0;
      for (let k = -r; k <= r; k++) {
        const yy = Math.min(h - 1, Math.max(0, y + k));
        s += tmp[yy * w + x]!;
        n++;
      }
      const orig = src[y * w + x]!;
      // Küste nicht verschieben: Vorzeichen des Originals behalten
      out[y * w + x] = orig > 0 ? Math.max(1, s / n) : Math.min(orig, s / n);
    }
  }
  return out;
}

export function createAtlas(canvas: HTMLCanvasElement, relief: Relief, overlayCanvas: HTMLCanvasElement, fillCanvas: HTMLCanvasElement): AtlasScene {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x14222c);
  scene.fog = new THREE.Fog(0x14222c, 26, 48);

  const worldH = (WORLD_W * relief.height) / relief.width;
  const segX = Math.floor(relief.width / 3);
  const segY = Math.floor(relief.height / 3);
  const geo = new THREE.PlaneGeometry(WORLD_W, worldH, segX, segY);
  geo.rotateX(-Math.PI / 2);

  // Relief leicht glätten: ein ruhiges Brett statt zerknittertem Papier
  const smoothData = blur(relief.data, relief.width, relief.height, 2);
  const sample = (u: number, v: number) => {
    const x = Math.min(relief.width - 1, Math.max(0, Math.round(u * (relief.width - 1))));
    const y = Math.min(relief.height - 1, Math.max(0, Math.round(v * (relief.height - 1))));
    return smoothData[y * relief.width + x]!;
  };

  const pos = geo.attributes.position as THREE.BufferAttribute;
  const uv = geo.attributes.uv as THREE.BufferAttribute;
  const elev = new Float32Array(pos.count);
  for (let i = 0; i < pos.count; i++) {
    const u = uv.getX(i);
    const v = 1 - uv.getY(i);
    uv.setY(i, v); // v = 0 im Norden, passend zum Relief und zur Überlagerung
    const e = sample(u, v);
    elev[i] = e;
    pos.setY(i, Math.max(0, e) * HEIGHT_SCALE);
  }
  geo.setAttribute("elev", new THREE.BufferAttribute(elev, 1));
  geo.computeVertexNormals();

  const overlay = new THREE.CanvasTexture(overlayCanvas);
  // Zeile 0 der Zeichenfläche ist Norden, wie beim Relief: nicht umdrehen
  overlay.flipY = false;
  overlay.colorSpace = THREE.NoColorSpace;
  overlay.anisotropy = 4;

  const fills = new THREE.CanvasTexture(fillCanvas);
  fills.flipY = false;
  fills.colorSpace = THREE.NoColorSpace;
  fills.anisotropy = 4;
  const political = { value: 1 };

  const sunDir = new THREE.Vector3(-0.6, 0.8, 0.35);
  const terrainMat = new THREE.ShaderMaterial({
    vertexShader: terrainVertex,
    fragmentShader: terrainFragment,
    uniforms: { overlay: { value: overlay }, fills: { value: fills }, political, sunDir: { value: sunDir } },
  });
  const terrain = new THREE.Mesh(geo, terrainMat);
  scene.add(terrain);

  // Tiefenkarte fürs Wasser: 0 an der Küste, 1 ab 2500 m Tiefe
  const depth = new Uint8Array(relief.width * relief.height);
  for (let i = 0; i < depth.length; i++) {
    const e = relief.data[i]!;
    depth[i] = e >= 0 ? 0 : Math.min(255, Math.round((-e / 2500) * 255));
  }
  const depthTex = new THREE.DataTexture(depth, relief.width, relief.height, THREE.RedFormat, THREE.UnsignedByteType);
  depthTex.magFilter = THREE.LinearFilter;
  depthTex.minFilter = THREE.LinearFilter;
  depthTex.flipY = false;
  depthTex.needsUpdate = true;

  const waterGeo = new THREE.PlaneGeometry(WORLD_W, worldH, 1, 1);
  waterGeo.rotateX(-Math.PI / 2);
  const wuv = waterGeo.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < wuv.count; i++) wuv.setY(i, 1 - wuv.getY(i));
  const waterMat = new THREE.ShaderMaterial({
    vertexShader: waterVertex,
    fragmentShader: waterFragment,
    uniforms: { depthMap: { value: depthTex }, time: { value: 0 } },
  });
  const water = new THREE.Mesh(waterGeo, waterMat);
  water.position.y = 0.004;
  scene.add(water);

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  const target = new THREE.Vector3(0, 0, 0);
  let dist = 13;

  function placeCamera() {
    camera.position.set(target.x, target.y + dist * 0.88, target.z + dist * 0.47);
    camera.lookAt(target);
  }
  placeCamera();

  const heightAt = (u: number, v: number) => Math.max(0, sample(u, v)) * HEIGHT_SCALE;
  const uvToWorld = (u: number, v: number) =>
    new THREE.Vector3((u - 0.5) * WORLD_W, heightAt(u, v), (v - 0.5) * worldH);

  return {
    renderer,
    scene,
    camera,
    terrain,
    overlay,
    fills,
    setPolitical(x) {
      political.value = x;
    },
    worldH,
    heightAt,
    uvToWorld,
    resize(w, h) {
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    },
    render(t) {
      waterMat.uniforms.time!.value = t;
      renderer.render(scene, camera);
    },
    setView(u, v, d) {
      const p = uvToWorld(u, v);
      target.set(p.x, 0, p.z);
      dist = d;
      placeCamera();
    },
    dispose() {
      geo.dispose();
      waterGeo.dispose();
      terrainMat.dispose();
      waterMat.dispose();
      overlay.dispose();
      fills.dispose();
      depthTex.dispose();
      renderer.dispose();
    },
  };
}
