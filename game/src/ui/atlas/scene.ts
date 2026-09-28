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
  uniform vec3 sunDir;
  varying float vElev;
  varying vec3 vNormal;
  varying vec2 vUv;
  varying vec3 vWorld;
  ${paperNoise}

  // Aquarellpalette nach Höhe
  vec3 palette(float e) {
    vec3 c0 = vec3(0.62, 0.72, 0.46); // Küstenebene, sattes Grün
    vec3 c1 = vec3(0.78, 0.76, 0.50); // Hügel, Olive
    vec3 c2 = vec3(0.84, 0.70, 0.46); // Hochland, Ocker
    vec3 c3 = vec3(0.62, 0.46, 0.34); // Gebirge, Siena
    vec3 c4 = vec3(0.96, 0.95, 0.92); // Gipfel, Papierweiß
    float n = (fbm(vUv * 64.0) - 0.5) * 260.0; // ausfransende Ränder
    float h = e + n;
    vec3 c = mix(c0, c1, smoothstep(150.0, 600.0, h));
    c = mix(c, c2, smoothstep(700.0, 1300.0, h));
    c = mix(c, c3, smoothstep(1700.0, 2500.0, h));
    c = mix(c, c4, smoothstep(3000.0, 3600.0, h));
    return c;
  }

  void main() {
    vec3 n = normalize(vNormal);
    float light = dot(n, normalize(sunDir));
    vec3 base = palette(vElev);

    // Aquarell: Pigment sammelt sich ungleichmäßig
    float wash = fbm(vUv * 29.0 + 3.1);
    base *= 0.9 + 0.18 * wash;

    // Schattierung in wenigen weichen Stufen
    float shade = smoothstep(-0.1, 0.9, light);
    shade = floor(shade * 4.0 + 0.5 * fbm(vUv * 96.0)) / 4.0;
    base *= 0.72 + 0.34 * shade;

    // Schraffur an Schattenhängen
    vec2 hp = vUv * vec2(2240.0, 1390.0);
    float line = abs(fract((hp.x + hp.y) * 0.5) - 0.5);
    float hatch = (1.0 - smoothstep(0.0, 0.18, line)) * (1.0 - smoothstep(0.15, 0.55, light));
    base = mix(base, vec3(0.30, 0.24, 0.20), hatch * 0.35);

    // Gezeichnete Wälder und Felder: Tupfen im Tiefland, dichter im feuchten Norden
    vec2 fp = vUv * vec2(830.0, 520.0);
    vec2 fc = floor(fp);
    vec2 ff = fract(fp) - 0.5;
    float fr = hash(fc);
    float forestZone = smoothstep(0.52, 0.62, fbm(vUv * 14.0 + 7.0)) + smoothstep(0.42, 0.28, vUv.y) * 0.5;
    float dotShape = 1.0 - smoothstep(0.18, 0.28, length(ff + (vec2(hash(fc + 3.1), hash(fc + 5.7)) - 0.5) * 0.4));
    float forest = dotShape * step(0.35, fr) * step(0.5, forestZone) * step(20.0, vElev) * (1.0 - smoothstep(1400.0, 1800.0, vElev));
    base = mix(base, vec3(0.26, 0.40, 0.22), forest * 0.75);

    // Bergsymbole: kleine gezeichnete Gipfel im Hochgebirge
    vec2 mp = vUv * vec2(270.0, 170.0);
    vec2 mc = floor(mp);
    vec2 mf = fract(mp) - vec2(0.5, 0.62);
    float mr = hash(mc + 11.0);
    float ridge = mf.y + abs(mf.x) * 1.45;
    float outline = (1.0 - smoothstep(0.0, 0.05, abs(ridge + 0.02))) * step(-0.36, mf.y) * step(mf.y, 0.2);
    float shadowSide = step(0.0, mf.x) * step(-0.02, ridge) * step(mf.y, 0.2) * step(abs(mf.x), 0.35);
    float mountainZone = smoothstep(1700.0, 2200.0, vElev) * step(0.4, mr);
    base = mix(base, vec3(0.45, 0.34, 0.27), shadowSide * mountainZone * 0.45);
    base = mix(base, vec3(0.20, 0.15, 0.12), outline * mountainZone * 0.9);

    // Höhenlinien in Tinte, alle 500 m, jede vierte kräftiger
    float c = vElev / 500.0;
    float w = fwidth(c);
    float contour = 1.0 - smoothstep(0.0, w * 1.2, abs(fract(c) - 0.5) - 0.5 + w);
    float major = step(3.5, mod(floor(c + 0.5), 4.0));
    base = mix(base, vec3(0.35, 0.27, 0.22), contour * (0.18 + 0.2 * major) * step(80.0, vElev));

    // Küstenlinie in Tinte, auf der Landseite
    float shore = 1.0 - smoothstep(0.0, 25.0, vElev);
    base = mix(base, vec3(0.24, 0.19, 0.16), shore * 0.8 * step(-0.5, vElev));

    // Provinzen, Wahl, Probleme: eingefärbte Lasur und Grenzlinien
    vec4 ov = texture2D(overlay, vUv);
    base = mix(base, ov.rgb, ov.a);

    // Papierkorn
    float grain = fbm(gl_FragCoord.xy * 0.35);
    base *= 0.93 + 0.1 * grain;

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
    float d = texture2D(depthMap, vUv).r; // 0 = Küste, 1 = tief
    vec3 shallow = vec3(0.70, 0.83, 0.82);
    vec3 deep = vec3(0.34, 0.52, 0.60);
    float wash = fbm(vUv * 19.0 + time * 0.01);
    vec3 col = mix(shallow, deep, smoothstep(0.0, 0.6, d + (wash - 0.5) * 0.15));

    // Küstenlinien wie auf alten Karten: parallele Linien entlang der Küste
    float rings = abs(fract(d * 38.0 - time * 0.05) - 0.5);
    float ringMask = (1.0 - smoothstep(0.0, 0.06, rings)) * (1.0 - smoothstep(0.02, 0.16, d)) * step(0.004, d);
    col = mix(col, vec3(0.25, 0.38, 0.45), ringMask * 0.5);

    // Kleine gezeichnete Wellenstriche im offenen Meer
    vec2 p = vUv * vec2(420.0, 260.0);
    vec2 cell = floor(p);
    vec2 f = fract(p) - 0.5;
    float r = hash(cell);
    float stroke = abs(f.y - 0.12 * sin(f.x * 9.0 + time * 0.6 + r * 6.0));
    float waveMask = (1.0 - smoothstep(0.02, 0.07, stroke)) * step(abs(f.x), 0.3) * step(0.86, r) * step(0.2, d);
    col = mix(col, vec3(0.90, 0.94, 0.93), waveMask * 0.7);

    col *= 0.93 + 0.1 * fbm(gl_FragCoord.xy * 0.35);
    gl_FragColor = vec4(col, 1.0);
  }
`;

export function createAtlas(canvas: HTMLCanvasElement, relief: Relief, overlayCanvas: HTMLCanvasElement): AtlasScene {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xe9e0cc);
  scene.fog = new THREE.Fog(0xe9e0cc, 26, 48);

  const worldH = (WORLD_W * relief.height) / relief.width;
  const segX = Math.floor(relief.width / 3);
  const segY = Math.floor(relief.height / 3);
  const geo = new THREE.PlaneGeometry(WORLD_W, worldH, segX, segY);
  geo.rotateX(-Math.PI / 2);

  const sample = (u: number, v: number) => {
    const x = Math.min(relief.width - 1, Math.max(0, Math.round(u * (relief.width - 1))));
    const y = Math.min(relief.height - 1, Math.max(0, Math.round(v * (relief.height - 1))));
    return relief.data[y * relief.width + x]!;
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

  const sunDir = new THREE.Vector3(-0.6, 0.8, 0.35);
  const terrainMat = new THREE.ShaderMaterial({
    vertexShader: terrainVertex,
    fragmentShader: terrainFragment,
    uniforms: { overlay: { value: overlay }, sunDir: { value: sunDir } },
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
      depthTex.dispose();
      renderer.dispose();
    },
  };
}
