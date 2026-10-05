// Gezeichnete Landschaft der Welt: echtes Relief, dargestellt wie ein illustrierter Atlas.
//
// Aufbau in zwei Stufen (Web-Mercator, ein gemeinsamer Rahmen für die ganze Welt):
//   Kern   Türkei und Rand, Höhenmodell AWS Terrain Zoom 8 (etwa 475 m je Punkt), unverändert scharf.
//   Basis  ganze Welt, Zoom 5 (etwa 5 km je Punkt), 8 Bit je Punkt (tools/geodaten/welt_gelaende.py), dazu ein Küstenabstandsfeld.
// Alle Texturkoordinaten (u, v) der Karte beziehen sich auf den Welt-Rahmen; der Kern ist ein Rechteck darin. Im Shader gilt innen der Kern,
// außen die Basis, dazwischen ein weicher Übergang. Das Gitternetz ist abgestuft: dicht am Kern, nach außen immer gröber.
// Schattierung, Küstenlinie und Wasser entstehen pro Bildpunkt im Shader; das Gitternetz trägt nur die Silhouette.
// Linien, Grenzen, Flächen und Beschriftung liegen nicht in einem festen Bild, sondern werden in Geräte-Pixeln
// pro Bild gezeichnet (vector.ts) und sind daher bei jedem Zoom scharf.
// Fehlen die Weltdateien, gilt der Kern allein als Rahmen (Verhalten wie früher).

import * as THREE from "three";

export interface KernRelief {
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

export interface Relief {
  /** Punkte der Basis über den ganzen Rahmen (Kern allein: seine eigenen Maße) */
  width: number;
  height: number;
  /** Rahmen der Karte */
  lon0: number;
  lon1: number;
  lat0: number;
  lat1: number;
  /** Basis: Höhe, 8 Bit in Wurzelkodierung (h = (b / 255)² · 8900 m, Meer = 0); null, wenn die Weltdateien fehlen */
  basis: Uint8Array | null;
  /** Basis: Küstenabstand in Punkten, 8 Bit (b = 128 + 4 · Abstand, positiv an Land) */
  basisKueste: Uint8Array | null;
  kern: KernRelief;
}

/** Der Kern ist die Quelle des Maßstabs: 20 Welteinheiten für seine 31 Grad Länge. */
const KERN_W = 20;
const KERN_GRAD = 31;
/** Weltbreite (Einheiten) je Grad Länge */
const EINHEITEN_JE_GRAD = KERN_W / KERN_GRAD;
const MERC_JE_EINHEIT = (Math.PI / 180) / EINHEITEN_JE_GRAD;
export const HOEHE_MAX_BASIS = 8900;

async function entpacke(buf: ArrayBuffer): Promise<ArrayBuffer> {
  const b = new Uint8Array(buf, 0, 2);
  // Manche Server liefern die Datei schon entpackt aus (Content-Encoding); dann fehlt die gzip-Kennung
  if (b[0] === 0x1f && b[1] === 0x8b) return new Response(new Blob([buf]).stream().pipeThrough(new DecompressionStream("gzip"))).arrayBuffer();
  return buf;
}

async function ladeKern(): Promise<KernRelief> {
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

async function ladeBasis(): Promise<{ meta: { width: number; height: number; lon0: number; lon1: number; lat0: number; lat1: number }; hoehe: Uint8Array; kueste: Uint8Array } | null> {
  try {
    const [m, h, k] = await Promise.all([fetch("/data/karte/welt.json"), fetch("/data/karte/welt-hoehe.bin.gz"), fetch("/data/karte/welt-kueste.bin.gz")]);
    if (!m.ok || !h.ok || !k.ok) return null;
    const meta = await m.json();
    const [hb, kb] = await Promise.all([h.arrayBuffer().then(entpacke), k.arrayBuffer().then(entpacke)]);
    const n = meta.width * meta.height;
    if (hb.byteLength < n || kb.byteLength < n) return null;
    performance.mark("karte-welt-geladen");
    return { meta, hoehe: new Uint8Array(hb, 0, n), kueste: new Uint8Array(kb, 0, n) };
  } catch {
    return null;
  }
}

/** Lädt Kern und Welt-Basis; fehlt die Basis, dient der Kern allein als Rahmen. */
export async function loadRelief(): Promise<Relief> {
  const [kern, basis] = await Promise.all([ladeKern(), ladeBasis()]);
  if (basis) {
    const m = basis.meta;
    return { width: m.width, height: m.height, lon0: m.lon0, lon1: m.lon1, lat0: m.lat0, lat1: m.lat1, basis: basis.hoehe, basisKueste: basis.kueste, kern };
  }
  return { width: kern.width, height: kern.height, lon0: kern.lon0, lon1: kern.lon1, lat0: kern.lat0, lat1: kern.lat1, basis: null, basisKueste: null, kern };
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
    const buf = await entpacke(await res.arrayBuffer());
    if (buf.byteLength < m.width * m.height) return null;
    performance.mark("karte-sdf-geladen");
    return { width: m.width, height: m.height, data: new Uint8Array(buf, 0, m.width * m.height) };
  } catch {
    return null;
  }
}

const mercY = (lat: number) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));

/** Längen- und Breitengrad in Texturkoordinaten des Rahmens (0–1, v = 0 im Norden). */
export function lonLatToUv(r: { lon0: number; lon1: number; lat0: number; lat1: number }, lon: number, lat: number): [number, number] {
  const u = (lon - r.lon0) / (r.lon1 - r.lon0);
  const v = (mercY(r.lat1) - mercY(lat)) / (mercY(r.lat1) - mercY(r.lat0));
  return [u, v];
}

/** Breite der Welt in Einheiten für einen Rahmen */
export function weltBreite(r: { lon0: number; lon1: number }): number {
  return (r.lon1 - r.lon0) * EINHEITEN_JE_GRAD;
}
/** Höhe der Welt in Einheiten für einen Rahmen (Mercator: gleicher Maßstab in beiden Richtungen) */
export function weltHoehe(r: { lat0: number; lat1: number }): number {
  return (mercY(r.lat1) - mercY(r.lat0)) / MERC_JE_EINHEIT;
}

/** Überhöhung der Silhouette: 5000 m entsprechen 0,8 Einheiten */
export const HEIGHT_SCALE = 0.00016;

/** Zusätze des Geländes je Effektstufe und Jahreszeit (siehe jahreszeit.ts) */
export interface AtlasEffekt {
  /** 0 aus, 1 mittel, 2 hoch */
  stufe: 0 | 1 | 2;
  winter: number;
  fruehling: number;
  waerme: number;
  wolken: number;
  stroemung: number;
}

export interface AtlasScene {
  renderer: THREE.WebGLRenderer;
  camera: THREE.PerspectiveCamera;
  worldW: number;
  worldH: number;
  /** Höhe über dem Meer in Metern an einer Stelle (bilinear) */
  elevationAt: (u: number, v: number) => number;
  /** Höhe in Welteinheiten */
  heightAt: (u: number, v: number) => number;
  uvToWorld: (u: number, v: number) => THREE.Vector3;
  resize: (w: number, h: number) => void;
  /** Rechter Bildrand in CSS-Pixeln, der verdeckt ist (etwa ein Buch): Das Ziel der Kamera steht in der Mitte der freien Fläche. 0 hebt es auf. */
  setzeRand: (rechts: number) => void;
  render: (t: number) => void;
  /** Auflösung des Reliefs: 1 = volle Schärfe (bis Pixelverhältnis 2); kleiner = gröber, solange die Karte bewegt wird (schneller, weniger Verzögerung) */
  setQualitaet: (faktor: number) => void;
  /** Jahreszeit, Schaum, Wolkenschatten, Strömung des Geländes setzen (Zeichnen ist danach neu fällig) */
  setEffekt: (e: AtlasEffekt) => void;
  /** Kamera auf eine Stelle richten; die Sicht wird so verschoben, dass der Kartenrand nicht sichtbar wird */
  setView: (focusU: number, focusV: number, dist: number) => { u: number; v: number };
  /** Bildschirmposition (CSS-Pixel) eines Punktes der Karte; `sichtbar` ist falsch hinter der Kamera */
  project: (u: number, v: number, h?: number) => { x: number; y: number; sichtbar: boolean };
  /** Sichtbarer Ausschnitt der Grundfläche in Texturkoordinaten */
  viewBounds: () => { u0: number; u1: number; v0: number; v1: number; ru: number; rv: number };
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
  uniform sampler2D baseTex;
  uniform float heightScale;
  uniform vec4 coreRect;   // Kern im Rahmen (u0, v0, u1, v1)
  uniform vec4 coreWorld;  // Kern in Welteinheiten (xmin, zmin, xmax, zmax)
  uniform float blendW;
  uniform float fullCore;
  varying vec2 vUv;
  varying vec3 vWorld;

  float coreWeight(vec2 xz) {
    if (fullCore > 0.5) return 1.0;
    float d = min(min(xz.x - coreWorld.x, coreWorld.z - xz.x), min(xz.y - coreWorld.y, coreWorld.w - xz.y));
    return smoothstep(0.0, blendW, d);
  }

  void main() {
    vUv = uv;
    float wc = coreWeight(position.xz);
    float e = 0.0;
    if (wc < 1.0) {
      float b = texture2D(baseTex, uv).r;
      e = b * b * ${HOEHE_MAX_BASIS}.0;
    }
    if (wc > 0.0) {
      vec2 cuv = (uv - coreRect.xy) / (coreRect.zw - coreRect.xy);
      e = mix(e, texture2D(elevTex, cuv).r, wc);
    }
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
  uniform float texMeters0; // Meter je Höhenpunkt des Kerns am Äquator (Mercator)
  uniform vec2 merc;        // Mercator-y der Nord- und Südkante des Kerns
  uniform sampler2D baseTex;
  uniform sampler2D baseSdf;
  uniform vec2 baseSize;
  uniform float baseMeters0;
  uniform vec2 baseMerc;    // Mercator-y der Nord- und Südkante des Rahmens
  uniform float exagBase;
  uniform vec4 coreRect;
  uniform vec4 coreWorld;
  uniform float blendW;
  uniform float fullCore;
  uniform vec3 sunDir;
  uniform float time;
  uniform vec4 saison;      // x Winter 0..1, y Frühling 0..1, z Wärme −1..1 (Winter kühl, Sommer warm), w Wolkenschatten 0..1
  uniform vec2 effektW;     // x Effektstufe (0 aus, 1 mittel, 2 hoch), y Richtung der Strömung im Wasser (Bogenmaß)
  uniform float exag;       // Überhöhung der Schattierung im Kern
  uniform vec3 bgColor;
  uniform float fogNear;
  uniform float fogFar;
  varying vec2 vUv;
  varying vec3 vWorld;
  ${GLSL_NOISE}

  // Ableitungen werden einmal am Anfang von main() gebildet (einheitlicher Programmablauf) und an Kern und Basis weitergegeben:
  // in den verzweigten Teilen wären sie an der Grenze zwischen Kern und Basis undefiniert (dünne dunkle Linie).
  float gPxw;      // Welteinheiten je Bildpunkt
  vec2 gDdx;       // Änderung der Rahmenkoordinate je Bildpunkt
  vec2 gDdy;
  vec2 gFwC;       // Fußabdruck eines Bildpunkts in Kernpunkten
  vec2 gFwB;       // dasselbe in Basispunkten
  float gAaC;      // Breite des Übergangs der Küstenlinie im Kern
  float gAaB;

  float coreWeight(vec2 xz) {
    if (fullCore > 0.5) return 1.0;
    float d = min(min(xz.x - coreWorld.x, coreWorld.z - xz.x), min(xz.y - coreWorld.y, coreWorld.w - xz.y));
    return smoothstep(0.0, blendW, d);
  }

  float elev(vec2 uv) { return texture2D(elevTex, uv).r; }
  float baseElev(vec2 uv) { float b = textureGrad(baseTex, uv, gDdx, gDdy).r; return b * b * ${HOEHE_MAX_BASIS}.0; }

  // Gemalte Geländefarben: Feuchte von Norden und Westen, Trockenheit nach Südosten, Fels und Schnee in der Höhe
  vec3 palette(float e, float moist, float slope, float snowA, float snowB) {
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
    c = mix(c, snow, smoothstep(snowA, snowB, e));
    return c;
  }

  // Der Kern: unverändert gegenüber der früheren Karte, nur in eigenen Koordinaten (uvC = 0..1 über das Kernrechteck)
  // Jahreszeit: Schnee zieht im Winter tiefer, im Frühling frischeres Grün (nur Stufe mittel und hoch; Stufe aus: saison ist 0)
  vec3 jahreszeit(vec3 land, float e, float moist) {
    float schneeH = mix(4200.0, 1150.0, saison.x);
    float schnee = saison.x * smoothstep(schneeH - 260.0, schneeH + 260.0, e);
    land = mix(land, vec3(0.86, 0.88, 0.88), schnee * 0.82);
    float gruen = saison.y * smoothstep(0.25, 0.7, moist) * (1.0 - smoothstep(1500.0, 2300.0, e)) * step(10.0, e);
    land = mix(land, land * vec3(0.9, 1.1, 0.84) + vec3(0.0, 0.025, 0.0), gruen * 0.55);
    return land;
  }

  vec3 shadeCore(vec2 uvC) {
    float e = elev(uvC);

    // Küste aus dem Distanzfeld: Abstand in Höhenmodellpunkten, positiv an Land; ohne Feld gilt die Nulllinie des Höhenmodells
    float sdT = 0.0;
    float aa = 1.0;
    if (hasSdf > 0.5) {
      sdT = (texture2D(sdfTex, uvC).r * 255.0 - 128.0) / 5.0;
      aa = gAaC;
      e = sdT > 0.0 ? max(e, 1.5) : min(e, -1.5);
    }

    // Breite an dieser Stelle (Web-Mercator) für den wahren Punktabstand in Metern
    float my = mix(merc.x, merc.y, uvC.y);
    float lat = 2.0 * atan(exp(my)) - 1.5707963;
    float texM = texMeters0 * cos(lat);

    // Bildschirmfläche eines Punktes: Beim Herauszoomen wird über mehrere Punkte geglättet, damit nichts flimmert
    vec2 fw = gFwC;
    float foot = clamp(max(fw.x, fw.y), 1.0, 12.0);
    vec2 px = foot / texSize;

    float eL = elev(uvC - vec2(px.x, 0.0));
    float eR = elev(uvC + vec2(px.x, 0.0));
    float eU = elev(uvC - vec2(0.0, px.y));
    float eD = elev(uvC + vec2(0.0, px.y));
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
    float moist = smoothstep(0.52, 0.2, uvC.y) * 0.75 + smoothstep(0.34, 0.12, uvC.x) * 0.35 + (fbm(uvC * 9.0) - 0.5) * 0.35;
    moist = clamp(moist, 0.0, 1.0);
    vec3 land = palette(e, moist, steep, 3000.0, 3500.0);

    // Gemalte Unregelmäßigkeit und Wälder
    float wash = fbm(uvC * 22.0 + 3.1);
    land *= 0.93 + 0.13 * wash;
    float forest = smoothstep(0.55, 0.68, fbm(uvC * 30.0 + 7.0)) * smoothstep(0.35, 0.7, moist) * step(40.0, e) * (1.0 - smoothstep(1700.0, 2100.0, e));
    land = mix(land, vec3(0.19, 0.31, 0.17), forest * 0.65);

    // Kraftvolle, aber ruhige Schattierung; Täler etwas dunkler (Hohlform gegenüber der Umgebung)
    float around = (eL + eR + eU + eD) * 0.25;
    float cavity = clamp((around - e) / 180.0, -1.0, 1.0);
    land = jahreszeit(land, e, moist);
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
    float wv = fbm(uvC * 16.0 + time * 0.006);
    vec3 water = mix(shallow, deep, smoothstep(0.0, 0.5, depth + (wv - 0.5) * 0.12));
    vec2 stroem = vec2(cos(effektW.y), sin(effektW.y)) * (0.26 * step(0.5, effektW.x) + 0.0);
    float ripple = fbm(vec2(wp2.x * 130.0 + time * 0.22 + stroem.x * time, wp2.y * 210.0 - time * 0.14 + stroem.y * time));
    water += vec3(0.05, 0.07, 0.08) * smoothstep(0.62, 0.8, ripple) * (1.0 - depth * 0.6);
    float surf = 1.0 - smoothstep(0.0, 40.0, -e);
    float welle = 0.55 + 0.25 * sin(time * 0.8 + uvC.x * 300.0);
    water = mix(water, vec3(0.62, 0.74, 0.74), surf * welle * 0.6 * step(e, 0.0));

    // Meer nahe der Küste: helles Flachwasser und feine Küstenlinien im Abstand, wie in gestochenen Atlanten
    if (hasSdf > 0.5) {
      float seaD = max(-sdT, 0.0);
      water = mix(water, vec3(0.34, 0.58, 0.62), 0.42 * exp(-seaD / 3.4));
      // Brandung: Wellenfronten laufen auf die Küste zu und lösen sich in Schaum auf (Stufe mittel und hoch)
      float front = 0.5 + 0.5 * sin(seaD * 1.9 - time * 0.85 + fbm(uvC * 40.0) * 3.0);
      float schaumAn = step(0.5, effektW.x) * smoothstep(0.35, 1.0, front) * exp(-seaD / 2.4) * (1.0 - exp(-seaD * 4.0));
      water = mix(water, vec3(0.9, 0.96, 0.95), schaumAn * 0.42);
      float fein = smoothstep(2.4, 0.5, aa);
      float lin = 0.0;
      for (int k = 1; k <= 4; k++) {
        float fk = float(k);
        lin += (1.0 - smoothstep(0.0, aa * 1.15, abs(seaD - 4.5 * fk))) * (0.19 - 0.04 * fk);
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
    return col;
  }

  // Die Welt-Basis (Zoom 5, etwa 5 km je Punkt): gleiche Malweise wie der Kern, aber mit Küstenabstand statt Meerestiefe und mit einem
  // Klima nach Breite (Tropen feucht, Wendekreise trocken, gemäßigte Zonen grün, Pole blass). In Kernnähe geht die Feuchte in die
  // des Kerns über, damit am Übergang keine Farbkante entsteht.
  vec3 shadeBase(vec2 uvW) {
    vec2 cext = (uvW - coreRect.xy) / (coreRect.zw - coreRect.xy); // Kernkoordinaten, über den Kern hinaus fortgesetzt
    float e = baseElev(uvW);
    float sd = (textureGrad(baseSdf, uvW, gDdx, gDdy).r * 255.0 - 128.0) / 4.0; // Basispunkte, positiv an Land
    float aa = gAaB;
    float seaD = max(-sd, 0.0);
    float depthN = smoothstep(0.0, 26.0, seaD);
    e = sd > 0.0 ? max(e, 1.5) : -(0.04 + 0.96 * depthN) * 2600.0;

    float my = mix(baseMerc.x, baseMerc.y, uvW.y);
    float lat = 2.0 * atan(exp(my)) - 1.5707963;
    float absLat = abs(lat) * 57.29578;
    float texM = baseMeters0 * cos(lat);

    vec2 fw = gFwB;
    float foot = clamp(max(fw.x, fw.y), 1.0, 12.0);
    vec2 px = foot / baseSize;
    float eL = baseElev(uvW - vec2(px.x, 0.0));
    float eR = baseElev(uvW + vec2(px.x, 0.0));
    float eU = baseElev(uvW - vec2(0.0, px.y));
    float eD = baseElev(uvW + vec2(0.0, px.y));
    float dx = (eR - eL) / (2.0 * foot * texM);
    float dz = (eD - eU) / (2.0 * foot * texM);
    float steep = clamp(length(vec2(dx, dz)) * 2.2, 0.0, 1.0);

    vec2 wp2 = vWorld.xz;
    // Feines Rauschen nur, solange ein Bildpunkt klein genug ist; sonst flimmert es
    float fade = 1.0 - smoothstep(0.004, 0.02, gPxw);
    vec2 pert = vec2(0.0);
    if (fade > 0.01) {
      pert = vec2(fbm(wp2 * 55.0) - 0.5, fbm(wp2 * 140.0 + 3.7) - 0.5) * (0.05 + 0.32 * steep) * fade;
    }
    vec3 n = normalize(vec3(-(dx + pert.x) * exagBase, 1.0, -(dz + pert.y) * exagBase));
    float shade = smoothstep(-0.25, 1.0, dot(n, normalize(sunDir)));

    // Klima nach Breite; in Kernnähe die Feuchte des Kerns
    float mWelt = 0.78 - 0.58 * smoothstep(6.0, 24.0, absLat) + 0.42 * smoothstep(32.0, 46.0, absLat) - 0.12 * smoothstep(58.0, 72.0, absLat);
    mWelt += (fbm(cext * 9.0) - 0.5) * 0.35;
    float mKern = smoothstep(0.52, 0.2, cext.y) * 0.75 + smoothstep(0.34, 0.12, cext.x) * 0.35 + (fbm(cext * 9.0) - 0.5) * 0.35;
    vec2 xz = vWorld.xz;
    float dAussen = max(max(coreWorld.x - xz.x, xz.x - coreWorld.z), max(coreWorld.y - xz.y, xz.y - coreWorld.w));
    float moist = clamp(mix(mWelt, mKern, 1.0 - smoothstep(0.0, 26.0, dAussen)), 0.0, 1.0);
    // Schneegrenze nach Breite: in den Subtropen über 5000 m (Hochland von Tibet bleibt braun), in den Alpen um 3000 m, im hohen Norden fast am Boden
    float snowA = 5900.0 - 1500.0 * smoothstep(25.0, 40.0, absLat) - 1600.0 * smoothstep(38.0, 50.0, absLat) - 1800.0 * smoothstep(50.0, 75.0, absLat);
    vec3 land = palette(e, moist, steep, snowA, snowA + 500.0);
    land = mix(land, vec3(0.86, 0.88, 0.88), smoothstep(63.0, 78.0, absLat) * 0.55);

    float wash = fbm(cext * 22.0 + 3.1);
    land *= 0.93 + 0.13 * wash;
    float forest = smoothstep(0.55, 0.68, fbm(cext * 30.0 + 7.0)) * smoothstep(0.35, 0.7, moist) * step(40.0, e) * (1.0 - smoothstep(1700.0, 2100.0, e));
    land = mix(land, vec3(0.19, 0.31, 0.17), forest * 0.65);

    float around = (eL + eR + eU + eD) * 0.25;
    float cavity = clamp((around - e) / 600.0, -1.0, 1.0);
    land = jahreszeit(land, e, moist);
    land *= 0.62 + 0.5 * shade;
    land *= 1.0 - 0.16 * max(0.0, cavity);
    land = mix(land, land * 1.08 + vec3(0.02, 0.018, 0.01), max(0.0, -cavity) * 0.35);
    if (fade > 0.01) {
      float grain = noise(wp2 * 900.0) * 0.5 + noise(wp2 * 260.0) * 0.5;
      land *= mix(1.0, 0.965 + 0.07 * grain, fade);
    }

    // Wasser: Tiefe aus dem Küstenabstand, langsame Wellen, helles Flachwasser an der Küste
    vec3 shallow = vec3(0.24, 0.46, 0.52);
    vec3 deep = vec3(0.08, 0.18, 0.28);
    float wv = fbm(cext * 16.0 + time * 0.006);
    vec3 water = mix(shallow, deep, smoothstep(0.0, 0.5, depthN * 0.95 + (wv - 0.5) * 0.12));
    if (fade > 0.01) {
      vec2 stroem = vec2(cos(effektW.y), sin(effektW.y)) * (0.26 * step(0.5, effektW.x) + 0.0);
    float ripple = fbm(vec2(wp2.x * 130.0 + time * 0.22 + stroem.x * time, wp2.y * 210.0 - time * 0.14 + stroem.y * time));
      water += vec3(0.05, 0.07, 0.08) * smoothstep(0.62, 0.8, ripple) * (1.0 - depthN * 0.6) * fade;
    }
    // Flachwassersaum an der Küste: etwa sieben Bildpunkte breit, solange die Karte nah ist; weit herausgezoomt bleibt er gut sichtbar
    float saumPunkte = clamp(7.0 * max(gFwB.x, gFwB.y), 0.3, 22.0);
    water = mix(water, vec3(0.34, 0.58, 0.62), 0.42 * exp(-seaD / saumPunkte));

    float istLand = smoothstep(-aa * 0.7, aa * 0.7, sd);
    vec3 col = mix(water, land, istLand);
    float tinte = 1.0 - smoothstep(aa * 0.35, aa * 1.05, abs(sd));
    col = mix(col, vec3(0.13, 0.085, 0.06), tinte * 0.8);
    return col;
  }

  void main() {
    gPxw = max(fwidth(vWorld.x), fwidth(vWorld.z));
    gDdx = dFdx(vUv);
    gDdy = dFdy(vUv);
    float wc = coreWeight(vWorld.xz);
    vec2 cuv = (vUv - coreRect.xy) / (coreRect.zw - coreRect.xy);
    gFwC = (abs(dFdx(cuv)) + abs(dFdy(cuv))) * texSize;
    gFwB = (abs(gDdx) + abs(gDdy)) * baseSize;
    // Küstenabstände nur für die Breite des Übergangs der Küstenlinie
    float sdKern = (texture2D(sdfTex, clamp(cuv, 0.0, 1.0)).r * 255.0 - 128.0) / 5.0;
    float sdBasis = (textureGrad(baseSdf, vUv, gDdx, gDdy).r * 255.0 - 128.0) / 4.0;
    gAaC = max(fwidth(sdKern), 0.02);
    gAaB = max(fwidth(sdBasis), 0.02);
    vec3 col;
    if (wc >= 1.0) col = shadeCore(cuv);
    else if (wc <= 0.0) col = shadeBase(vUv);
    else col = mix(shadeBase(vUv), shadeCore(cuv), wc);

    // Rand der Karte: sanft ins Dunkle, damit keine harte Kante sichtbar wird
    float randBreite = fullCore > 0.5 ? 0.035 : 0.01;
    float rand = smoothstep(0.0, randBreite, min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y)));
    float dist = length(vWorld - cameraPosition);
    // Wolkenschatten ziehen langsam über das Land; Wärme der Jahreszeit färbt das Licht leicht (Stufe hoch, im Kern und der Nähe)
    float wolke = fbm(vWorld.xz * 0.32 + vec2(time * 0.011, time * 0.0055));
    float wolkenAn = smoothstep(0.55, 0.8, wolke) * saison.w * (1.0 - smoothstep(fogNear * 0.9, fogNear * 1.6, dist));
    col *= 1.0 - 0.15 * wolkenAn;
    col *= mix(vec3(1.0), vec3(1.0 + 0.035 * saison.z, 1.0 + 0.004 * saison.z, 1.0 - 0.045 * saison.z), step(1.5, effektW.x));
    float nebel = smoothstep(fogNear, fogFar, dist) * 0.55;
    col = mix(bgColor, col, rand);
    col = mix(col, bgColor, nebel);
    gl_FragColor = vec4(col, 1.0);
  }
`;

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/**
 * Teilung der Strecke [a, b] in Texturkoordinaten: im Kern [k0, k1] gleichmäßig (nKern Teile), nach außen von `schritt0` aus mit dem Faktor
 * `wachs` je Schritt wachsend, höchstens `maxSchritt`. So bleibt der Kern so dicht wie bisher und die Welt trotzdem mit wenigen Eckpunkten bedeckt.
 */
export function abgestuftTeilen(a: number, k0: number, k1: number, b: number, nKern: number, schritt0: number, wachs: number, maxSchritt: number): number[] {
  const links: number[] = [];
  let p = k0;
  let s = schritt0;
  while (p - a > 1e-9) {
    const q = p - s;
    if (q <= a + s * 0.5) {
      links.push(a);
      break;
    }
    links.push(q);
    p = q;
    s = Math.min(maxSchritt, s * wachs);
  }
  const rechts: number[] = [];
  p = k1;
  s = schritt0;
  while (b - p > 1e-9) {
    const q = p + s;
    if (q >= b - s * 0.5) {
      rechts.push(b);
      break;
    }
    rechts.push(q);
    p = q;
    s = Math.min(maxSchritt, s * wachs);
  }
  const out: number[] = links.reverse();
  for (let i = 0; i <= nKern; i++) out.push(k0 + ((k1 - k0) * i) / nKern);
  out.push(...rechts);
  return out;
}

/** Halbiert die Auflösung (Mittelwert), solange die Grafikkarte die Textur nicht fassen würde. */
function halbieren(data: Uint8Array, w: number, h: number): { data: Uint8Array; w: number; h: number } {
  const w2 = Math.floor(w / 2);
  const h2 = Math.floor(h / 2);
  const out = new Uint8Array(w2 * h2);
  for (let y = 0; y < h2; y++) {
    for (let x = 0; x < w2; x++) {
      const i = 2 * y * w + 2 * x;
      out[y * w2 + x] = (data[i]! + data[i + 1]! + data[i + w]! + data[i + w + 1]! + 2) >> 2;
    }
  }
  return { data: out, w: w2, h: h2 };
}

function rText(data: Uint8Array, w: number, h: number, mip: boolean): THREE.DataTexture {
  const t = new THREE.DataTexture(data, w, h, THREE.RedFormat, THREE.UnsignedByteType);
  t.magFilter = THREE.LinearFilter;
  t.minFilter = mip ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter;
  t.generateMipmaps = mip;
  t.flipY = false;
  t.unpackAlignment = 1;
  t.wrapS = THREE.ClampToEdgeWrapping;
  t.wrapT = THREE.ClampToEdgeWrapping;
  t.needsUpdate = true;
  return t;
}

/**
 * Kamera und Sicht der Karte, getrennt von der Grafik (daher ohne WebGL prüfbar): Standpunkt, Neigung (weit herausgezoomt steiler),
 * Strahl auf den Boden, sichtbarer Ausschnitt und die Regel, dass der Rand des Rahmens nie sichtbar wird.
 */
export function erzeugeKamera(worldW: number, worldH: number, beimPlatzieren?: (dist: number) => void) {
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 400);
  const target = new THREE.Vector3(0, 0, 0);
  let dist = 13;
  let cssW = 1;
  let cssH = 1;

  function placeCamera() {
    // Nah wie bisher schräg (etwa 62 Grad), weit herausgezoomt immer steiler: die Strategieansicht der Welt liest sich flach
    const t = smooth(14, 140, dist);
    const ang = ((61.9 + 24 * t) * Math.PI) / 180;
    camera.position.set(target.x, target.y + dist * Math.sin(ang), target.z + dist * Math.cos(ang));
    camera.near = Math.max(0.05, dist * 0.03);
    camera.far = dist * 12;
    camera.updateProjectionMatrix();
    camera.lookAt(target);
    camera.updateMatrixWorld(true);
    beimPlatzieren?.(dist);
  }
  placeCamera();

  const rayCaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const hit = new THREE.Vector3();

  function groundUv(px: number, py: number): [number, number] | null {
    ndc.set((px / cssW) * 2 - 1, -(py / cssH) * 2 + 1);
    rayCaster.setFromCamera(ndc, camera);
    if (!rayCaster.ray.intersectPlane(plane, hit)) return null;
    return [hit.x / worldW + 0.5, hit.z / worldH + 0.5];
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
    // Gelände hebt die Ränder etwas an: Rand großzügig ansetzen (in Welteinheiten, wächst mit dem Abstand)
    const rand = Math.max(0.8, dist * 0.03);
    const ru = rand / worldW;
    const rv = rand / worldH;
    return { u0: u0 - ru, u1: u1 + ru, v0: v0 - rv, v1: v1 + rv, ru, rv };
  }

  function setView(focusU: number, focusV: number, d: number): { u: number; v: number } {
    dist = d;
    let u = focusU;
    let v = focusV;
    // Dreimal nachführen: Der Rand darf nicht sichtbar werden
    for (let k = 0; k < 3; k++) {
      target.set((u - 0.5) * worldW, 0, (v - 0.5) * worldH);
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
    target.set((u - 0.5) * worldW, 0, (v - 0.5) * worldH);
    placeCamera();
    return { u, v };
  }

  let randRechts = 0;

  /** Das Bild um den halben verdeckten Rand verschieben: Die Mitte des vollen Bildes (das Ziel) liegt dann in der Mitte der freien Fläche. */
  function wendeRandAn(): void {
    if (randRechts > 0) camera.setViewOffset(cssW, cssH, randRechts / 2, 0, cssW, cssH);
    else camera.clearViewOffset();
    camera.updateProjectionMatrix();
  }

  function setzeRand(rechts: number): void {
    randRechts = Math.max(0, Math.min(rechts, cssW * 0.8));
    wendeRandAn();
  }

  function resize(w: number, h: number): void {
    cssW = Math.max(1, w);
    cssH = Math.max(1, h);
    camera.aspect = cssW / cssH;
    wendeRandAn();
  }

  return { camera, setView, viewBounds, groundUv, resize, setzeRand, size: () => ({ w: cssW, h: cssH }), dist: () => dist };
}

export function createAtlas(canvas: HTMLCanvasElement, relief: Relief, kueste?: KuestenFeld | null): AtlasScene {
  const pixelMax = Math.min(window.devicePixelRatio, 2);
  // Kantenglättung nur bei niedrigem Pixelverhältnis: Ab 1,5 sieht man sie kaum, sie vervierfacht aber die Füllrate des schweren Relief-Shaders
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: pixelMax < 1.5, powerPreference: "high-performance" });
  renderer.setPixelRatio(pixelMax);
  let qualitaet = 1;
  const bg = new THREE.Color(0x101b24);
  renderer.setClearColor(bg);
  const scene = new THREE.Scene();

  const kern = relief.kern;
  const fullCore = !relief.basis || !relief.basisKueste;
  const worldW = weltBreite(relief);
  const worldH = weltHoehe(relief);

  // Kernrechteck im Rahmen
  const [cu0, cv0] = fullCore ? [0, 0] : lonLatToUv(relief, kern.lon0, kern.lat1);
  const [cu1, cv1] = fullCore ? [1, 1] : lonLatToUv(relief, kern.lon1, kern.lat0);
  const coreRect = new THREE.Vector4(cu0, cv0, cu1, cv1);
  const coreWorld = new THREE.Vector4((cu0 - 0.5) * worldW, (cv0 - 0.5) * worldH, (cu1 - 0.5) * worldW, (cv1 - 0.5) * worldH);
  /** Breite des weichen Übergangs von Kern zu Basis in Welteinheiten (innerhalb des Kernrechtecks) */
  const BLEND_W = 1.6;
  const coreWeightJs = (x: number, z: number): number => {
    if (fullCore) return 1;
    const d = Math.min(x - coreWorld.x, coreWorld.z - x, z - coreWorld.y, coreWorld.w - z);
    return smooth(0, BLEND_W, d);
  };

  // Höhenmodell des Kerns als Halbgleitkomma-Textur (Int16 → Half über eine Nachschlagetabelle)
  const lut = new Uint16Array(65536);
  for (let i = 0; i < 65536; i++) lut[i] = THREE.DataUtils.toHalfFloat(i - 32768);
  const half = new Uint16Array(kern.data.length);
  for (let i = 0; i < half.length; i++) half[i] = lut[kern.data[i]! + 32768]!;
  const elevTex = new THREE.DataTexture(half, kern.width, kern.height, THREE.RedFormat, THREE.HalfFloatType);
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

  // Welt-Basis: Höhe (Wurzelkodierung) und Küstenabstand, 8 Bit; mit Mipmaps, weil sie weit herausgezoomt stark verkleinert wird
  let baseData: Uint8Array = relief.basis ?? new Uint8Array(1);
  let baseSdfData: Uint8Array = relief.basisKueste ?? new Uint8Array([128]);
  let baseW = relief.basis ? relief.width : 1;
  let baseH = relief.basis ? relief.height : 1;
  const maxTex = renderer.capabilities.maxTextureSize;
  while (relief.basis && (baseW > maxTex || baseH > maxTex)) {
    const a = halbieren(baseData, baseW, baseH);
    const b = halbieren(baseSdfData, baseW, baseH);
    baseData = a.data;
    baseSdfData = b.data;
    baseW = a.w;
    baseH = a.h;
  }
  const baseTex = rText(baseData, baseW, baseH, !fullCore);
  const baseSdfTex = rText(baseSdfData, baseW, baseH, !fullCore);

  // Abgestuftes Gitternetz: dicht über dem Kern (wie bisher), nach außen gröber
  const segX = Math.min(1000, Math.floor(kern.width / 5));
  const segY = Math.round((segX * kern.height) / kern.width);
  let xs: number[];
  let ys: number[];
  if (fullCore) {
    xs = Array.from({ length: segX + 1 }, (_, i) => i / segX);
    ys = Array.from({ length: segY + 1 }, (_, j) => j / segY);
  } else {
    const schritt0 = (cu1 - cu0) / segX; // in u
    const s0Einheiten = schritt0 * worldW;
    xs = abgestuftTeilen(0, cu0, cu1, 1, segX, schritt0, 1.05, 1.6 / worldW);
    ys = abgestuftTeilen(0, cv0, cv1, 1, segY, s0Einheiten / worldH, 1.05, 1.6 / worldH);
  }
  const nx = xs.length;
  const ny = ys.length;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(nx * ny * 3);
  const uvArr = new Float32Array(nx * ny * 2);
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const k = j * nx + i;
      pos[3 * k] = (xs[i]! - 0.5) * worldW;
      pos[3 * k + 2] = (ys[j]! - 0.5) * worldH;
      uvArr[2 * k] = xs[i]!;
      uvArr[2 * k + 1] = ys[j]!; // v = 0 im Norden, passend zum Relief und zu den Zeichenkoordinaten
    }
  }
  const idx = new Uint32Array((nx - 1) * (ny - 1) * 6);
  let q = 0;
  for (let j = 0; j < ny - 1; j++) {
    for (let i = 0; i < nx - 1; i++) {
      const a = j * nx + i;
      const b = (j + 1) * nx + i;
      const c = j * nx + i + 1;
      const d = (j + 1) * nx + i + 1;
      idx[q++] = a;
      idx[q++] = b;
      idx[q++] = c;
      idx[q++] = c;
      idx[q++] = b;
      idx[q++] = d;
    }
  }
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("uv", new THREE.BufferAttribute(uvArr, 2));
  geo.setIndex(new THREE.BufferAttribute(idx, 1));

  const sunDir = new THREE.Vector3(-0.62, 0.72, -0.42);
  const uniforms = {
    elevTex: { value: elevTex },
    sdfTex: { value: sdfTex },
    hasSdf: { value: sdfTex ? 1 : 0 },
    texSize: { value: new THREE.Vector2(kern.width, kern.height) },
    texMeters0: { value: (((kern.lon1 - kern.lon0) * Math.PI) / 180 * 6378137) / kern.width },
    merc: { value: new THREE.Vector2(mercY(kern.lat1), mercY(kern.lat0)) },
    baseTex: { value: baseTex },
    baseSdf: { value: baseSdfTex },
    baseSize: { value: new THREE.Vector2(baseW, baseH) },
    baseMeters0: { value: (((relief.lon1 - relief.lon0) * Math.PI) / 180 * 6378137) / baseW },
    baseMerc: { value: new THREE.Vector2(mercY(relief.lat1), mercY(relief.lat0)) },
    exagBase: { value: 6.0 },
    coreRect: { value: coreRect },
    coreWorld: { value: coreWorld },
    blendW: { value: BLEND_W },
    fullCore: { value: fullCore ? 1 : 0 },
    heightScale: { value: HEIGHT_SCALE },
    sunDir: { value: sunDir },
    time: { value: 0 },
    saison: { value: new THREE.Vector4(0, 0, 0, 0) },
    effektW: { value: new THREE.Vector2(0, 0.6) },
    exag: { value: kern.zoom && kern.zoom >= 8 ? 2.4 : 2.0 },
    bgColor: { value: bg },
    fogNear: { value: 16 },
    fogFar: { value: 46 },
  };
  const material = new THREE.ShaderMaterial({ vertexShader: terrainVertex, fragmentShader: terrainFragment, uniforms });
  const terrain = new THREE.Mesh(geo, material);
  terrain.frustumCulled = false;
  scene.add(terrain);

  const kamera = erzeugeKamera(worldW, worldH, (d) => {
    uniforms.fogNear.value = d * 1.05;
    uniforms.fogFar.value = d * 3.4;
  });
  const camera = kamera.camera;
  const { groundUv, viewBounds } = kamera;

  // Höhen am Boden (für Vektorebene und Marken): derselbe Übergang wie im Shader
  const BW = relief.width;
  const BH = relief.height;
  const basisDaten = relief.basis;
  function baseElevAt(u: number, v: number): number {
    if (!basisDaten) return 0;
    const x = Math.min(BW - 1.001, Math.max(0, u * (BW - 1)));
    const y = Math.min(BH - 1.001, Math.max(0, v * (BH - 1)));
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const fx = x - x0;
    const fy = y - y0;
    const i = y0 * BW + x0;
    const b = (basisDaten[i]! * (1 - fx) + basisDaten[i + 1]! * fx) * (1 - fy) + (basisDaten[i + BW]! * (1 - fx) + basisDaten[i + BW + 1]! * fx) * fy;
    const n = b / 255;
    return n * n * HOEHE_MAX_BASIS;
  }
  const KW = kern.width;
  const KH = kern.height;
  const kdata = kern.data;
  function coreElevAt(u: number, v: number): number {
    const su = (u - cu0) / (cu1 - cu0);
    const sv = (v - cv0) / (cv1 - cv0);
    const x = Math.min(KW - 1.001, Math.max(0, su * (KW - 1)));
    const y = Math.min(KH - 1.001, Math.max(0, sv * (KH - 1)));
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const fx = x - x0;
    const fy = y - y0;
    const i = y0 * KW + x0;
    const a = kdata[i]!;
    const b = kdata[i + 1]!;
    const c = kdata[i + KW]!;
    const d = kdata[i + KW + 1]!;
    return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy;
  }
  function elevationAt(u: number, v: number): number {
    const w = coreWeightJs((u - 0.5) * worldW, (v - 0.5) * worldH);
    let e = 0;
    if (w < 1) e += (1 - w) * baseElevAt(u, v);
    if (w > 0) e += w * coreElevAt(u, v);
    return e;
  }
  const heightAt = (u: number, v: number) => Math.max(0, elevationAt(u, v)) * HEIGHT_SCALE;
  const uvToWorld = (u: number, v: number) => new THREE.Vector3((u - 0.5) * worldW, heightAt(u, v), (v - 0.5) * worldH);

  const rayCaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();

  function pickUv(px: number, py: number): [number, number] | null {
    const { w: cssW, h: cssH } = kamera.size();
    const dist = kamera.dist();
    ndc.set((px / cssW) * 2 - 1, -(py / cssH) * 2 + 1);
    rayCaster.setFromCamera(ndc, camera);
    const o = rayCaster.ray.origin;
    const d = rayCaster.ray.direction;
    // Strahl in Schritten bis zum Gelände verfolgen, dann verfeinern (Schrittweite wächst mit dem Abstand der Kamera)
    const maxT = Math.max(80, dist * 6);
    const step = Math.max(0.06, dist * 0.005);
    let t = 0;
    let prevT = 0;
    for (; t < maxT; t += step) {
      const x = o.x + d.x * t;
      const y = o.y + d.y * t;
      const z = o.z + d.z * t;
      const u = x / worldW + 0.5;
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
          const um = (o.x + d.x * mid) / worldW + 0.5;
          const vm = (o.z + d.z * mid) / worldH + 0.5;
          if (o.y + d.y * mid <= heightAt(um, vm)) hi = mid;
          else lo = mid;
        }
        return [(o.x + d.x * hi) / worldW + 0.5, (o.z + d.z * hi) / worldH + 0.5];
      }
      prevT = t;
    }
    return null;
  }

  const out = new THREE.Vector3();
  function project(u: number, v: number, h?: number) {
    const { w: cssW, h: cssH } = kamera.size();
    out.set((u - 0.5) * worldW, h ?? heightAt(u, v), (v - 0.5) * worldH).project(camera);
    // hinter der Kamera liefert project() eine z-Koordinate über 1
    return { x: ((out.x + 1) / 2) * cssW, y: ((1 - out.y) / 2) * cssH, sichtbar: out.z < 1 && out.z > -1 };
  }
  const vp = new THREE.Matrix4();

  return {
    renderer,
    camera,
    worldW,
    worldH,
    elevationAt,
    heightAt,
    uvToWorld,
    resize(w, h) {
      kamera.resize(w, h);
      const { w: cssW, h: cssH } = kamera.size();
      renderer.setSize(cssW, cssH, false);
    },
    setzeRand: kamera.setzeRand,
    render(t) {
      uniforms.time.value = t;
      renderer.render(scene, camera);
    },
    setEffekt(e) {
      uniforms.saison.value.set(e.winter, e.fruehling, e.waerme, e.wolken);
      uniforms.effektW.value.set(e.stufe, e.stroemung);
    },
    setQualitaet(faktor) {
      const f = Math.min(1, Math.max(0.4, faktor));
      if (Math.abs(f - qualitaet) < 0.01) return;
      qualitaet = f;
      // Bei Pixelverhältnis 1 gibt es nichts zu sparen; sonst nie unter 1
      const pr = pixelMax <= 1 ? pixelMax : Math.max(1, pixelMax * f);
      renderer.setPixelRatio(pr);
      const { w: cssW, h: cssH } = kamera.size();
      renderer.setSize(cssW, cssH, false);
    },
    setView: kamera.setView,
    project,
    viewBounds,
    groundUv,
    pickUv,
    matrix() {
      vp.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
      return Float32Array.from(vp.elements);
    },
    size: kamera.size,
    dispose() {
      geo.dispose();
      material.dispose();
      elevTex.dispose();
      sdfTex?.dispose();
      baseTex.dispose();
      baseSdfTex.dispose();
      renderer.dispose();
    },
  };
}
