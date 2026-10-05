// Die Karte der ganzen Welt: Basisrelief, Länder außerhalb des Kerns (karte-W*.bin), Flaggen-Marken aller Akteure, abgestuftes Gitternetz
// und die Kamera (der Rand des Rahmens wird bei keinem Schwenk und Zoom sichtbar). Erzeugt mit tools/geodaten/welt_gelaende.py und
// tools/geodaten/karte2/13_welt_laender.py (siehe dortige README).

import { existsSync, readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { describe, expect, test } from "vitest";
import { WELT } from "../src/data/welt-daten";
import { WEITERE } from "../src/data/welt-weitere";
import { LAENDERNAMEN, LAND_PINS } from "../src/ui/ebenen";
import { abgestuftTeilen, erzeugeKamera, lonLatToUv, weltBreite, weltHoehe } from "../src/ui/atlas/scene";
import { uebertrageFlaechen, type KFlaeche, type KStufe } from "../src/ui/atlas/daten";

const DIR = "public/data/karte";
const vorhanden = existsSync(`${DIR}/welt.json`) && existsSync(`${DIR}/karte-W1.bin`);

interface Ring { lon: Float64Array; lat: Float64Array }
interface Flaeche { besitzer: number; ringe: Ring[] }
interface Bogen { typ: number; lon: Float64Array; lat: Float64Array }

function lese(datei: string): { flaechen: Flaeche[]; bogen: Bogen[] } {
  const b = readFileSync(`${DIR}/${datei}`);
  const a = new Int32Array(b.buffer, b.byteOffset, Math.floor(b.byteLength / 4));
  expect(a[0]).toBe(0x4b32);
  const nFl = a[2]!;
  const nBogen = a[3]!;
  let p = 4;
  const flaechen: Flaeche[] = [];
  for (let f = 0; f < nFl; f++) {
    const besitzer = a[p]!;
    const nRinge = a[p + 1]!;
    p += 2;
    const ringe: Ring[] = [];
    for (let k = 0; k < nRinge; k++) {
      const n = a[p]!;
      const lon = new Float64Array(n);
      const lat = new Float64Array(n);
      for (let i = 0; i < n; i++) {
        lon[i] = a[p + 1 + 2 * i]! / 1e5;
        lat[i] = a[p + 2 + 2 * i]! / 1e5;
      }
      p += 1 + 2 * n;
      ringe.push({ lon, lat });
    }
    flaechen.push({ besitzer, ringe });
  }
  const bogen: Bogen[] = [];
  for (let k = 0; k < nBogen; k++) {
    const typ = a[p]!;
    const n = a[p + 1]!;
    const lon = new Float64Array(n);
    const lat = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      lon[i] = a[p + 2 + 2 * i]! / 1e5;
      lat[i] = a[p + 3 + 2 * i]! / 1e5;
    }
    p += 2 + 2 * n;
    bogen.push({ typ, lon, lat });
  }
  expect(p).toBe(a.length);
  return { flaechen, bogen };
}

function drin(f: Flaeche, lon: number, lat: number): boolean {
  let d = false;
  for (const r of f.ringe) {
    for (let i = 0, j = r.lon.length - 1; i < r.lon.length; j = i++) {
      if (r.lat[i]! > lat !== r.lat[j]! > lat && lon < ((r.lon[j]! - r.lon[i]!) * (lat - r.lat[i]!)) / (r.lat[j]! - r.lat[i]!) + r.lon[i]!) d = !d;
    }
  }
  return d;
}

interface Meta { besitzer: { k: string; iso?: string; name?: string }[]; anker: Record<string, number[]>; welt?: { stufen: string[] } }
const meta = vorhanden ? (JSON.parse(readFileSync(`${DIR}/karte.json`, "utf8")) as Meta) : null;
const welt = vorhanden ? (JSON.parse(readFileSync(`${DIR}/welt.json`, "utf8")) as { width: number; height: number; lon0: number; lon1: number; lat0: number; lat1: number }) : null;
const ROI = { lon0: 19.4, lat0: 30.9, lon1: 50.6, lat1: 46.1 };

describe.skipIf(!vorhanden)("Welt-Basisrelief", () => {
  const hoehe = vorhanden ? gunzipSync(readFileSync(`${DIR}/welt-hoehe.bin.gz`)) : Buffer.alloc(0);
  const kueste = vorhanden ? gunzipSync(readFileSync(`${DIR}/welt-kueste.bin.gz`)) : Buffer.alloc(0);

  test("Maße und Rahmen: ganze Welt, Kern liegt darin, beide Felder haben je Punkt ein Byte", () => {
    expect(welt!.lon0).toBe(-180);
    expect(welt!.lon1).toBe(180);
    expect(welt!.lat0).toBeLessThan(-55);
    expect(welt!.lat1).toBeGreaterThan(75);
    expect(hoehe.length).toBe(welt!.width * welt!.height);
    expect(kueste.length).toBe(welt!.width * welt!.height);
    // Der Kern (Höhenmodell Zoom 8) liegt vollständig im Rahmen
    expect(19.5).toBeGreaterThan(welt!.lon0);
    expect(50.5).toBeLessThan(welt!.lon1);
    expect(31).toBeGreaterThan(welt!.lat0);
    expect(46).toBeLessThan(welt!.lat1);
  });

  const am = (lon: number, lat: number) => {
    const [u, v] = lonLatToUv(welt!, lon, lat);
    const x = Math.min(welt!.width - 1, Math.max(0, Math.round(u * (welt!.width - 1))));
    const y = Math.min(welt!.height - 1, Math.max(0, Math.round(v * (welt!.height - 1))));
    const i = y * welt!.width + x;
    const n = hoehe[i]! / 255;
    return { meter: n * n * 8900, land: kueste[i]! > 128 };
  };

  test("Land und Meer an bekannten Stellen, Höhen plausibel", () => {
    for (const [name, lon, lat] of [["Berlin", 13.4, 52.5], ["Moskau", 37.6, 55.75], ["Peking", 116.4, 39.9], ["Brasília", -47.9, -15.8], ["Pretoria", 28.2, -25.7], ["Washington", -77, 38.9]] as const) {
      expect(am(lon, lat).land, name).toBe(true);
    }
    for (const [name, lon, lat] of [["Atlantik", -30, 40], ["Pazifik", -150, 0], ["Indischer Ozean", 80, -20], ["Mittelmeer", 20, 34], ["Schwarzes Meer", 34, 43], ["Kaspisches Meer", 50.5, 41]] as const) {
      expect(am(lon, lat).land, name).toBe(false);
    }
    expect(am(86.9, 28).meter, "Himalaya").toBeGreaterThan(5500);
    expect(am(37.6, 55.75).meter, "Moskau").toBeLessThan(400);
    expect(am(32.86, 39.93).meter, "Ankara").toBeGreaterThan(600);
    expect(am(-30, 40).meter, "Meer ohne Höhe").toBe(0);
  });

  test("Anteil Land etwa ein Drittel (Natural Earth, ohne Antarktis)", () => {
    let land = 0;
    for (let i = 0; i < kueste.length; i += 97) if (kueste[i]! > 128) land++;
    const anteil = land / Math.ceil(kueste.length / 97);
    expect(anteil).toBeGreaterThan(0.28);
    expect(anteil).toBeLessThan(0.36);
  });
});

describe.skipIf(!vorhanden)("Länder der Welt (karte-W*.bin)", () => {
  const stufen = ["karte-W0.bin", "karte-W1.bin"].map(lese);

  test("karte.json nennt die Welt-Dateien und über 200 Länder; die Indizes der bisherigen Besitzer sind unverändert", () => {
    expect(meta!.welt?.stufen).toEqual(["karte-W0.bin", "karte-W1.bin", "karte-W1.bin"]);
    expect(meta!.besitzer.slice(0, 81).every((b) => b.k === "p")).toBe(true);
    expect(meta!.besitzer.filter((b) => b.k === "t")).toHaveLength(1);
    expect(meta!.besitzer.filter((b) => b.k === "l").length).toBeGreaterThan(200);
    // das bisherige Land GRC behält seinen Platz in der Tabelle
    expect(meta!.besitzer.findIndex((b) => b.iso === "GRC")).toBeGreaterThanOrEqual(81);
    expect(meta!.besitzer.findIndex((b) => b.iso === "GRC")).toBeLessThan(111);
  });

  test("Besitzer gültig, nur Landesgrenzen (Typ 5), keine Bögen am Rand des Kernausschnitts, Flächen außerhalb des Ausschnitts", () => {
    for (const st of stufen) {
      expect(st.flaechen.length).toBeGreaterThan(1000);
      for (const f of st.flaechen) {
        expect(f.besitzer).toBeGreaterThanOrEqual(81);
        expect(f.besitzer).toBeLessThan(meta!.besitzer.length);
        expect(meta!.besitzer[f.besitzer]!.k).toBe("l");
      }
      for (const b of st.bogen) {
        expect(b.typ).toBe(5);
        const amRand = (kol: Float64Array, v: number) => kol.every((x) => Math.abs(x - v) < 2e-3);
        expect(amRand(b.lon, ROI.lon0) || amRand(b.lon, ROI.lon1) || amRand(b.lat, ROI.lat0) || amRand(b.lat, ROI.lat1), "Randbogen").toBe(false);
      }
      // Kein Eckpunkt liegt deutlich im Inneren des Kernausschnitts (dort gelten die Flächen aus karte-L*.bin)
      for (const f of st.flaechen) {
        for (const r of f.ringe) {
          for (let i = 0; i < r.lon.length; i++) {
            const innen = r.lon[i]! > ROI.lon0 + 0.02 && r.lon[i]! < ROI.lon1 - 0.02 && r.lat[i]! > ROI.lat0 + 0.02 && r.lat[i]! < ROI.lat1 - 0.02;
            expect(innen).toBe(false);
          }
        }
      }
    }
  });

  test("keine Überlappung: ein Zufallspunkt liegt in höchstens einer Fläche (Welt-Stufe 1)", () => {
    const st = stufen[1]!;
    let s = 4242;
    const zufall = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
    let doppelt = 0;
    let getroffen = 0;
    for (let k = 0; k < 1500; k++) {
      const lon = -170 + zufall() * 340;
      const lat = -50 + zufall() * 120;
      if (lon > ROI.lon0 && lon < ROI.lon1 && lat > ROI.lat0 && lat < ROI.lat1) continue;
      const n = st.flaechen.filter((f) => drin(f, lon, lat)).length;
      getroffen += n > 0 ? 1 : 0;
      if (n > 1) doppelt++;
    }
    expect(getroffen).toBeGreaterThan(250);
    expect(doppelt / Math.max(1, getroffen)).toBeLessThan(0.01);
  });

  test("jeder Akteur des Weltmodells hat ein Land auf der Karte (die EU über Belgien als Sitz)", () => {
    const isos = [...WELT.filter((d) => d.id !== "EU").map((d) => d.iso), ...WEITERE.map((d) => d.iso), "BEL"];
    for (const iso of isos) {
      const i = meta!.besitzer.findIndex((b) => b.k === "l" && b.iso === iso);
      expect(i, iso).toBeGreaterThanOrEqual(81);
      expect((meta!.besitzer[i]!.name ?? "").length, `Name ${iso}`).toBeGreaterThan(2);
      expect((meta!.anker[iso] ?? []).length, `Beschriftungspunkte ${iso}`).toBeGreaterThanOrEqual(3);
    }
  });

  test("Flaggen-Marken: alle 41 Akteure, jede liegt in ihrem Land, die Namen sind bekannt", () => {
    const ids = [...WELT.map((d) => d.id), ...WEITERE.map((d) => d.id)].sort();
    expect(ids).toHaveLength(41);
    expect(LAND_PINS.map((p) => p.id).sort()).toEqual(ids);
    expect(new Set(LAND_PINS.map((p) => `${p.lon},${p.lat}`)).size).toBe(LAND_PINS.length);
    // Flächen des Kerns (Stufe 1) und der Welt (Stufe 1) zusammen
    const alle = [...lese("karte-L1.bin").flaechen, ...stufen[1]!.flaechen];
    for (const p of LAND_PINS) {
      const iso = p.iso === "EU" ? "BEL" : p.iso;
      const idx = meta!.besitzer.findIndex((b) => b.k === "l" && b.iso === iso);
      expect(idx, p.id).toBeGreaterThanOrEqual(81);
      const eigene = alle.filter((f) => f.besitzer === idx);
      // Küstenstädte dürfen im vereinfachten Umriss knapp außen liegen: Mitte oder ein Punkt im Abstand von 0,06 Grad
      const proben: [number, number][] = [[0, 0], [0.06, 0], [-0.06, 0], [0, 0.06], [0, -0.06], [0.04, 0.04], [-0.04, 0.04], [0.04, -0.04], [-0.04, -0.04]];
      const treffer = proben.some(([dx, dy]) => eigene.some((f) => drin(f, p.lon + dx, p.lat + dy)));
      expect(treffer, `${p.id} (${p.lon}, ${p.lat}) liegt nicht in ${iso}`).toBe(true);
      expect(p.rang).toBeGreaterThan(0);
      if (p.iso !== "EU") expect(LAENDERNAMEN[p.iso] ?? meta!.besitzer[idx]!.name, p.id).toBeTruthy();
    }
  });
});

describe("Gitternetz der Welt", () => {
  test("abgestuftTeilen: dicht über dem Kern, nach außen wachsend, Rand genau 0 und 1", () => {
    const x = abgestuftTeilen(0, 0.55, 0.64, 1, 400, 0.0002, 1.05, 0.007);
    expect(x[0]).toBe(0);
    expect(x[x.length - 1]).toBe(1);
    for (let i = 1; i < x.length; i++) expect(x[i]!).toBeGreaterThan(x[i - 1]!);
    const kern = x.filter((v) => v >= 0.55 - 1e-9 && v <= 0.64 + 1e-9);
    expect(kern).toHaveLength(401);
    expect(kern[1]! - kern[0]!).toBeCloseTo(0.09 / 400, 8);
    let groesster = 0;
    let verhaeltnis = 0;
    for (let i = 2; i < x.length; i++) {
      const s = x[i]! - x[i - 1]!;
      const t = x[i - 1]! - x[i - 2]!;
      groesster = Math.max(groesster, s);
      // Nachbarmaschen unterscheiden sich um höchstens ein Zehntel (außer an der Randmasche)
      if (i < x.length - 1 && i > 2) verhaeltnis = Math.max(verhaeltnis, s / t, t / s);
    }
    expect(groesster).toBeLessThanOrEqual(0.007 * 1.001);
    expect(verhaeltnis).toBeLessThan(1.13);
  });

  test("Maßstab: der Kern hat 20 Welteinheiten Breite und das Seitenverhältnis des Höhenmodells", () => {
    const kern = { lon0: 19.5, lon1: 50.5, lat0: 31, lat1: 46 };
    expect(weltBreite(kern)).toBeCloseTo(20, 6);
    expect(weltHoehe(kern)).toBeCloseTo((20 * 3512) / 5643, 1);
    expect(weltBreite({ lon0: -180, lon1: 180 })).toBeCloseTo((20 * 360) / 31, 6);
  });
});

describe("Kamera: der Rand der Welt wird nie sichtbar", () => {
  const frame = { lon0: -180, lon1: 180, lat0: -61.606, lat1: 79.171 };
  const W = weltBreite(frame);
  const H = weltHoehe(frame);

  test("bei jedem Fenster, Abstand und Schwenkpunkt liegt der Ausschnitt im Rahmen (oder deckt ihn ganz)", () => {
    for (const [fw, fh] of [[2000, 1300], [1280, 720], [800, 600], [390, 844]] as const) {
      const k = erzeugeKamera(W, H);
      k.resize(fw, fh);
      for (const d of [2.4, 6, 13, 25, 60, 120, 220]) {
        for (const u0 of [0, 0.02, 0.25, 0.5, 0.75, 0.98, 1]) {
          for (const v0 of [0, 0.02, 0.3, 0.5, 0.7, 0.98, 1]) {
            const n = k.setView(u0, v0, d);
            const b = k.viewBounds();
            const gross = b.u1 - b.u0 >= 1;
            const hoch = b.v1 - b.v0 >= 1;
            const rr = 0.002; // Rundungsspielraum
            if (!gross) {
              expect(b.u0, `u0 ${fw}x${fh} d=${d} (${u0}, ${v0})`).toBeGreaterThan(-rr);
              expect(b.u1, `u1 ${fw}x${fh} d=${d} (${u0}, ${v0})`).toBeLessThan(1 + rr);
            }
            if (!hoch) {
              expect(b.v0, `v0 ${fw}x${fh} d=${d} (${u0}, ${v0})`).toBeGreaterThan(-rr);
              expect(b.v1, `v1 ${fw}x${fh} d=${d} (${u0}, ${v0})`).toBeLessThan(1 + rr);
            }
            expect(n.u).toBeGreaterThan(-0.5);
            expect(n.u).toBeLessThan(1.5);
          }
        }
      }
    }
  });

  test("weit herausgezoomt steiler als nah: Neigung nimmt zu", () => {
    const k = erzeugeKamera(W, H);
    k.resize(2000, 1300);
    const hoehenwinkel = (d: number) => {
      k.setView(0.55, 0.4, d);
      const p = k.camera.position;
      // Winkel der Blickrichtung über dem Boden
      const horizontal = Math.hypot(p.x - (0.55 - 0.5) * W, p.z - (0.4 - 0.5) * H);
      return (Math.atan2(p.y, horizontal) * 180) / Math.PI;
    };
    expect(hoehenwinkel(13)).toBeGreaterThan(55);
    expect(hoehenwinkel(13)).toBeLessThan(68);
    expect(hoehenwinkel(220)).toBeGreaterThan(80);
  });
});

describe("Besitzerwechsel von Flächen (Vorbereitung)", () => {
  const fl = (besitzer: number, id: number): KFlaeche => ({ besitzer, ringe: [], bb: [id, id, id, id] });
  test("uebertrageFlaechen verschiebt die ausgewählten Flächen in die Liste des neuen Besitzers", () => {
    const a = fl(2, 1);
    const b = fl(2, 2);
    const c = fl(3, 3);
    const st: KStufe = { flaechen: [a, b, c], porBesitzer: [[], [], [a, b], [c]], bogen: [] };
    expect(uebertrageFlaechen(st, 2, 3, (f) => f.bb[0] === 2)).toBe(1);
    expect(st.porBesitzer[2]).toEqual([a]);
    expect(st.porBesitzer[3]).toEqual([c, b]);
    expect(b.besitzer).toBe(3);
    expect(uebertrageFlaechen(st, 2, 3)).toBe(1);
    expect(st.porBesitzer[2]).toEqual([]);
    expect(uebertrageFlaechen(st, 2, 3)).toBe(0);
    expect(uebertrageFlaechen(st, 3, 3)).toBe(0);
  });
});
